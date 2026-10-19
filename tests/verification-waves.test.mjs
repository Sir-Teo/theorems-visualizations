import assert from 'node:assert/strict';
import test from 'node:test';
import {record,near} from './verification-physics-utils.mjs';
import interfaces from '../content/waves/ch04.js';
import examples from '../content/waves/ch04-b.js';
import {fresnel,dropDeviation,nWater,nFlint} from '../content/waves/ch04.shared.js';
const item=(c,n)=>c.items.find(i=>i.num===n),rad=x=>x*Math.PI/180;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],scale=(a,s)=>a.map(x=>x*s),mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],check=(a,b,t=1e-12)=>a.forEach((x,i)=>near(x,b[i],t));
test('Fresnel amplitudes independently satisfy both Maxwell boundary equations and normal energy flux',()=>{
 for(const n1 of[1,1.5,2.5])for(const n2 of[1,1.5,3])for(const a of[0,20,50,80,89.5,90]){const th=rad(a),f=fresnel(n1,n2,th),ci=Math.cos(th),ct=f.cosT;
 check(add([1,0],f.rs),f.ts);check(scale(add([1,0],scale(f.rs,-1)),n1*ci),scale(mul(ct,f.ts),n2));
 check(scale(add([1,0],scale(f.rp,-1)),ci),mul(ct,f.tp));check(scale(add([1,0],f.rp),n1),scale(f.tp,n2));
 near(f.Rs+f.Ts,1,1e-12);near(f.Rp+f.Tp,1,1e-12);assert.ok(Object.values(f).flat().every(x=>typeof x==='boolean'||Number.isFinite(x)));
 if(f.tir){near(f.Rs,1,1e-12);near(f.Rp,1,1e-12);near(f.Ts,0,0)}
 }
 const f=fresnel(1.5,1.5,Math.PI/2);near(f.Rs,0,0);near(f.Ts,1,0);
 const c=fresnel(1.5,1,Math.asin(1/1.5));assert.equal(c.tir,false);near(c.cosT[0],0,1e-14);near(c.sinT,1,0);near(c.Ts,0,1e-12);
 for(const n1 of[1.3,1.333,1.5,2.42]){const f=fresnel(n1,1,Math.asin(1/n1));near(f.Rs,1,0);near(f.Ts,0,0);near(f.cosT[0],0,0);}
 near(fresnel(1,1.5,Math.atan(1.5)).Rp,0,1e-30);
});
test('actual Huygens tangent construction measures both angles and the correct wavelet-radius ratio',()=>{
 const reflection=record(item(interfaces,'4.5'),{time:4});reflection.controls[2].set(73);reflection.draw();assert.match(reflection.text(),/theta_r=73.00/);
 const r=record(item(interfaces,'4.6'),{time:4});r.controls[0].set(1);r.controls[1].set(1.5);r.controls[2].set(35);r.draw();assert.match(r.text(),/n_1\/n_2=0.667/);
 const angle=Number(r.text().match(/theta_2=([^}]+?)\}/)?.[1]||r.text().match(/theta_2=([\d.]+)/)[1]);near(angle,Math.asin(Math.sin(rad(35))/1.5)*180/Math.PI,.0003);
 r.controls[0].set(2.5);r.controls[1].set(1);r.controls[2].set(80);r.draw();assert.match(r.text(),/outgrow/);
 r.controls[2].set(Math.asin(1/2.5)*180/Math.PI);r.draw();assert.match(r.text(),/theta_2=90.00/);
});
test('critical-angle button retains its exact value and gives the grazing transmitted limit',()=>{
 const r=record(item(examples,'4.9'));r.buttons.find(b=>b.label==='go to critical angle').fn();r.draw();near(r.controls[2].value,Math.asin(1/1.5)*180/Math.PI,1e-14);assert.match(r.text(),/theta_2=90.00/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('actual frustrated-TIR field and derivative match at both faces and transmission equals the independent hyperbolic formula',()=>{
 const r=record(item(examples,'4.10'));const n=1.5,theta=Math.asin(1/n)+rad(4),kz=2*Math.PI*n*Math.cos(theta),kap=2*Math.PI*Math.sqrt(n*n*Math.sin(theta)**2-1),d=.35;
 r.draw(0);const real=r.stages[0].calls.find(c=>c[0]==='raster')[1];r.draw(1);const imag=r.stages[0].calls.find(c=>c[0]==='raster')[1],E=z=>[1.9*real(0,z),1.9*imag(0,z)],eps=1e-6;
 for(const z of[0,d]){check(E(z-eps),E(z+eps),2e-5);const left=E(z-2*eps).map((x,i)=>(E(z-eps)[i]-x)/eps),right=E(z+eps).map((x,i)=>(E(z+2*eps)[i]-x)/eps);check(left,right,3e-4)}
 const expected=1/(1+((kz*kz+kap*kap)/(2*kz*kap))**2*Math.sinh(kap*d)**2),T=r.stages[1].calls.find(c=>c[0]==='fn')[1];near(T(d),expected,1e-13);
 for(const n1 of[1.3,2.2])for(const extra of[.3,40])for(const gap of[0,2]){r.controls[0].set(n1);r.controls[1].set(extra);r.controls[2].set(gap);r.draw();const f=r.stages[1].calls.find(c=>c[0]==='fn')[1];assert.ok(f(gap)>0&&f(gap)<=1);assert.match(r.text(),/R\+T=1.000000/);assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
test('Stokes reversal identities hold for real propagating s and p amplitudes with matched reverse angles',()=>{
 for(const n1 of[1,1.5,2.5])for(const n2 of[1,1.7,3])for(const a of[0,10,20]){const f=fresnel(n1,n2,rad(a));if(f.tir)continue;const g=fresnel(n2,n1,Math.asin(f.sinT));for(const p of['s','p']){near(f['r'+p][0]+g['r'+p][0],0,1e-12);near(f['t'+p][0]*g['t'+p][0],1-f['r'+p][0]**2,1e-12)}}
});
test('rainbow extrema agree with independently differentiated Snell geometry and actual traced rays',()=>{
 for(const k of[1,2])for(const nm of[405,656]){const n=nWater(nm),i=Math.acos(Math.sqrt((n*n-1)/(k*(k+2)))),b=Math.sin(i),h=1e-6;
 near((dropDeviation(b+h,n,k)-dropDeviation(b-h,n,k))/(2*h),0,1e-8);assert.ok(dropDeviation(b-h,n,k)>dropDeviation(b,n,k));
 const r=record(item(examples,'4.12'));r.controls[1].set(k);r.controls[2].set(nm);r.controls[3].set(b);r.draw();const path=r.stages[0].calls.filter(c=>c[0]==='path'&&c[2]?.color===(nm===656?'red':'purple')).at(-1)[1],p=path.at(-2),q=path.at(-1),angle=Math.acos((q[0]-p[0])/Math.hypot(q[0]-p[0],q[1]-p[1]));near(Math.cos(angle),Math.cos(dropDeviation(b,n,k)),1e-12);assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
test('prism handles forbidden exit/minimum explicitly and reproduces symmetric minimum without sign exclusions',()=>{
 const r=record(item(examples,'4.12'));r.controls[0].set('prism');r.controls[4].set(75);r.controls[5].set(25);r.draw();assert.match(r.text(),/no symmetric transmitted minimum/);assert.match(r.text(),/no transmitted exit ray/);assert.doesNotMatch(r.text(),/NaN|Infinity|undefined/);
 r.controls[4].set(30);r.controls[5].set(80);r.draw();assert.doesNotMatch(r.text(),/no transmitted exit ray/);
 r.controls[4].set(60);const n=nFlint(550),tmin=Math.asin(n*.5);r.controls[5].set(tmin*180/Math.PI);r.draw();const f=r.stages[1].calls.filter(c=>c[0]==='fn')[1][1],expected=(2*tmin-rad(60))*180/Math.PI;near(f(tmin*180/Math.PI),expected,1e-12);assert.ok(f(tmin*180/Math.PI-.01)>expected);
});
test('fibre controls use the actual indices and meridional delay scale, including no-guiding and high-NA limits',()=>{
 const r=record(item(examples,'4.13'));r.draw();const expected=1000*1.48/299792458*1e9*(1.48/1.46-1);near(Number(r.text().match(/1\)=([\d.]+)\$/)?.[1]||r.text().match(/formula .*?=([\d.]+)\$/)[1]),expected,.0003);
 r.controls[0].set(1.4);r.controls[1].set(1.69);r.draw();assert.match(r.text(),/no total-internal-reflection guiding/);assert.match(r.text(),/1.690/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
 r.controls[0].set(1.7);r.controls[1].set(1.3);r.draw();assert.match(r.text(),/90.00/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('phase-flipped pulse satisfies the interface and reaches reflection at every glass index',()=>{
 const r=record(item(examples,'4.14'),{time:9});for(const dir of['ext','int'])for(const n of[1.1,3]){r.controls[0].set(dir);r.controls[1].set(n);r.draw();const f=r.stages[0].calls.find(c=>c[0]==='fn')[1],reflected=r.stages[0].calls.find(c=>c[0]==='dot');assert.ok(reflected&&reflected[1]<0);near(f(-1e-8),f(1e-8),1e-7);assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
