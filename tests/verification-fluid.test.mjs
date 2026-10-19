import assert from 'node:assert/strict';
import test from 'node:test';
import {record,near} from './verification-physics-utils.mjs';
import vortices from '../content/fluid/ch03.js';
import potential from '../content/fluid/ch04.js';
import forces from '../content/fluid/ch04-b.js';
import applications,{imageVelocity} from '../content/fluid/ch04-c.js';
import {joukBody,theodorsen,elemVel} from '../content/fluid/ch04.shared.js';
const item=(c,n)=>c.items.find(i=>i.num===n);
test('Rankine vortex matches radial Euler balance, continuity and paddle-wheel spin',()=>{
 const r=record(item(vortices,'3.6'),{time:1});r.controls[0].set(.05);r.controls[1].set(.15);r.controls[2].set(.2);r.draw();
 const u=r.stages[1].calls.find(c=>c[0]==='fn')[1],eta=r.stages[2].calls.find(c=>c[0]==='fn')[1],a=.15,G=.05,g=9.81;
 near(u(a),G/(2*Math.PI*a),1e-13);near(u(a-1e-8),u(a+1e-8),1e-6);near(eta(0),-G*G/(4*Math.PI**2*a*a*g),1e-13);
 for(const x of[.03,.12,.18,.25])near((eta(x+1e-6)-eta(x-1e-6))/2e-6,u(x)**2/(g*x),1e-7);
 assert.match(r.text(),/outside.*0.00/);r.controls[2].set(.03);r.draw();assert.match(r.text(),/inside/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('Taylor-Proudman limiting slice is height-independent, unlike the 3D sphere field',()=>{
 const r=record(item(vortices,'3.11'));const raster=()=>r.stages[1].calls.find(c=>c[0]==='raster')[1];const f=raster();assert.ok(Math.abs(f(-1.3,0)-f(-1.3,3))>.01);
 r.controls[0].set('fast');r.draw();const F=raster();for(const x of[-2,-1.3,1.5,2.2])near(F(x,0),F(x,3),0);assert.match(r.text(),/spread over height:.*0.0000/);
});
test('U-tube equal-arm RK4 matches the harmonic solution and all extreme controls keep positive levels',()=>{
 const r=record(item(potential,'4.3'));r.draw(3.5);const h=r.stages[1].calls.find(c=>c[0]==='path')[1],f=r.stages[1].calls.find(c=>c[0]==='fn')[1];for(const[t,y]of h)near(y,f(t),2e-8);
 for(const L of[.8,3.2])for(const ratio of[.4,2.5]){r.controls[0].set(L);r.controls[1].set(.5);r.controls[2].set(ratio);r.draw(4);const fills=r.stages[0].calls.filter(c=>c[0]==='rect'&&c[2]===0);for(const c of fills)assert.ok(c[4]>0);assert.doesNotMatch(r.text(),/NaN|Infinity/);}
});
test('Blasius and pressure force match independent Kutta-Joukowski vectors across body shapes and contours',()=>{
 for(const U of[.5,2])for(const alpha of[-.3,.27])for(const G of[0,3])for(const opts of[{c:0,R:1},{c:.85,R:1},{zeta0:[-.3,.5],c:1,round:.12}]){
 const P=joukBody({...opts,U,alpha,G}),expected=[-U*G*Math.sin(alpha),U*G*Math.cos(alpha)],F=P.pressureForce(2000);near(F.Fx,expected[0],2e-6);near(F.Fy,expected[1],2e-6);
 for(const scale of[1,1.5,4]){const B=P.blasius(scale*P.R,1000);near(B.Fx,expected[0],1e-10);near(B.Fy,expected[1],1e-10)}
 }
});
test('circulating-cylinder stagnation and lift remain correct beyond surface merger',()=>{
 for(const k of[0,.6,1,2.2]){const r=record(item(forces,'4.9'),{time:.5});r.controls[0].set(k);r.draw();const red=r.stages[0].calls.filter(c=>c[0]==='dot'&&c[3]?.color==='red');
 for(const c of red){const vel=elemVel([{t:'uni',k:1},{t:'dbl',x:0,y:0,k:1},{t:'vtx',x:0,y:0,k:-4*Math.PI*k}],c[1],c[2]);near(Math.hypot(...vel),0,1e-12)}
 const txt=r.text(),lift=Number(txt.match(/pressure \$L=([^$]+)/)[1]);near(lift,4*Math.PI*k,5e-5);assert.doesNotMatch(txt,/NaN|Infinity/);}
});
test('exact channel image kernel cancels both walls and agrees with a long independent lattice sum',()=>{
 const x0=.3,y0=.6,G=6,W=2;for(const x of[-4,-1,.4,3])for(const y of[0,W])near(imageVelocity('channel',x0,y0,G,x,y)[1],0,1e-14);
 const direct=(x,y,self=false)=>{let u=0,v=0;const N=20000;for(let n=-N;n<=N;n++)for(const [yy,gg]of[[y0+2*n*W,G],[-y0+2*n*W,-G]]){if(self&&n===0&&gg===G)continue;const dx=x-x0,dy=y-yy,q=gg/(2*Math.PI*(dx*dx+dy*dy));u-=q*dy;v+=q*dx}return[u,v]};
 for(const[x,y]of[[-1,.2],[1,1.7],[2,.8]]){const a=imageVelocity('channel',x0,y0,G,x,y),b=direct(x,y);a.forEach((z,i)=>near(z,b[i],8e-6))}
 const a=imageVelocity('channel',x0,y0,G,x0,y0,true),b=direct(x0,y0,true);a.forEach((z,i)=>near(z,b[i],8e-6));near(a[0],G/(4*W)/Math.tan(Math.PI*y0/W),1e-14);
 for(const[x,y]of[[.9,2.2],[1.5,.5]]){const v=imageVelocity('corner',x,y,G,x,y,true);near(-2*v[0]/x**3-2*v[1]/y**3,0,1e-12)}
});
test('Theodorsen map recovers exact circles and a known noncircular analytic map, including derivative',()=>{
 const R=1.7,M=theodorsen(()=>R);assert.ok(M.ok);near(M.c0,Math.log(R),1e-13);for(const z of[[1,0],[2,.7],[-1.2,1]]){M.zOf(z).forEach((v,i)=>near(v,R*z[i],1e-12));near(M.dzOf(z)[0],R,1e-12);near(M.dzOf(z)[1],0,1e-12)}
 const A=1.4,B=.8,Rf=t=>1/Math.sqrt((Math.cos(t)/A)**2+(Math.sin(t)/B)**2),E=theodorsen(Rf,128,50);assert.ok(E.ok);assert.ok(E.err<1e-8);const c=(A+B)/2,k=(A-B)/(A+B);
 for(const z of[[1.3,.4],[-2,.7]]){const d=z[0]**2+z[1]**2,p=[c*(z[0]+k*z[0]/d),c*(z[1]-k*z[1]/d)];E.zOf(z).forEach((v,i)=>near(v,p[i],1e-8));const h=1e-6,f=E.zOf([z[0]+h,z[1]]),g=E.zOf([z[0]-h,z[1]]);E.dzOf(z).forEach((v,i)=>near(v,(f[i]-g[i])/(2*h),1e-8));}
});
test('added mass preserves exact density-zero limit, flips sinking acceleration and removes neutral pressure',()=>{
 const r=record(item(applications,'4.17'),{time:.8});r.controls[1].set(0);r.draw();assert.match(r.text(),/2.000/);assert.match(r.text(),/undefined/);const f=r.stages[1].calls.find(c=>c[0]==='fn')[1];near(f(1),9.81,1e-12);
 r.controls[1].set(1.6);r.draw();const arrow=r.stages[0].calls.find(c=>c[0]==='arrow'&&c[5]?.color==='green');assert.ok(arrow[4]<0);r.controls[1].set(1);r.draw();assert.equal(r.stages[0].calls.filter(c=>c[0]==='arrow').length,0);assert.doesNotMatch(r.text(),/NaN|Infinity/);
 r.controls[0].set('cyl');r.controls[1].set(0);r.draw();assert.match(r.text(),/1.000/);
});
