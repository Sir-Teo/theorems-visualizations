import assert from 'node:assert/strict';
import test from 'node:test';
import * as M from '../assets/js/viz/math.js';
import {G, DEG, thetaOf, thetaMax, shockAngles, obliqueJump, nuPM, NU_MAX, machFromNu, isenP, shockExpansionDiamond, ackeretDiamond, waveDrag, sears, fusIdeal, wingHump, areaCoeffs, dragOfK, atmo} from '../content/aero/ch04.shared.js';
import main, {mddKorn, cdWave, KORN_OFFSET} from '../content/aero/ch04.js';
import high from '../content/aero/ch04-b.js';
import lifting, {fitPhi} from '../content/aero/ch03.js';
import {weissinger, sheetDownwash} from '../content/aero/ch03.shared.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1e-8,Math.abs(b)),`${a} ≉ ${b}`);
const integrate=(fn,a,b,n=12000)=>{let s=0;for(let i=0;i<n;i++)s+=fn(a+(i+.5)*(b-a)/n);return s*(b-a)/n;};
function record(item) {
 const noop=()=>{},controls=[],renders=[],readouts=[],stages=[];
 const v={M,color:()=>'',fix:(x,n)=>x.toFixed(n),fmt:(x,n)=>Number(x.toPrecision(n)).toString(),sci:(x,n)=>x.toExponential(n),rng:M.rng,legend:noop,button:noop,readout:f=>readouts.push(f),render:f=>renders.push(f),
 slider:(label,min,max,value)=>{const c={label,value,el:{},set(x){this.value=x}};controls.push(c);return c},select:(label,options,value)=>{const c={label,value};controls.push(c);return c},toggle:(label,value)=>{const c={label,value};controls.push(c);return c},
 stage:()=>{const calls=[],ctx=new Proxy({},{get:()=>noop}),s=new Proxy({calls,ctx,width:900,height:400,el:{style:{}},handle:(x,y)=>({x,y,set(a,b){this.x=a;this.y=b}}),X:x=>x,Y:y=>y,clip:f=>f()},{get:(s,k)=>k in s?s[k]:(...args)=>calls.push([k,...args])});stages.push(s);return s;}};
 item.viz(v);const draw=()=>renders.forEach(f=>f());draw();return{controls,stages,draw,text:()=>readouts.map(f=>f()).join('\n')};
}
test('Prandtl–Meyer formula agrees with independently integrated turning differential and inverse',()=>{
 for(const m of[1.1,1.5,2,4,6]){const integral=integrate(v=>Math.sqrt(v*v-1)/(v*(1+.2*v*v)),1,m,50000);near(nuPM(m),integral,3e-7);near(machFromNu(nuPM(m)),m,1e-12);}
 near(NU_MAX/DEG,130.45407685048605,1e-12);
});
test('weak and strong shocks satisfy turning, mass, momentum and total-enthalpy conservation',()=>{
 for(const m of[1.15,1.5,2,4,6]){const tm=thetaMax(m);assert.equal(shockAngles(tm.theta*1.001,m),null);
 for(const theta of[tm.theta*.2,tm.theta*.95]){const bs=shockAngles(theta,m);assert.ok(bs.weak<bs.strong);
 for(const b of Object.values(bs)){near(thetaOf(b,m),theta,1e-10);const j=obliqueJump(m,b),un=m*Math.sqrt(G)*Math.sin(b),ut=m*Math.sqrt(G)*Math.cos(b),un2=un/j.rho;
 near(1+un*un,j.p+j.rho*un2*un2,2e-13);near(G/(G-1)+.5*m*m*G,G/(G-1)*j.T+.5*(un2*un2+ut*ut),2e-13);near(j.M2,Math.hypot(un2,ut)/Math.sqrt(G*j.T),2e-13);assert.ok(j.p0>0&&j.p0<1);}
 }}
});
test('Ackeret forces are the small-angle shock-expansion limit, with correct symmetry and zero state',()=>{
 for(const m of[1.5,2,4])for(const [a,e]of[[1e-5,0],[0,1e-5],[1e-5,2e-5]]){const ac=ackeretDiamond(m,a,e),ex=shockExpansionDiamond(m,a,e);near(ex.cd,ac.cd,2e-4);if(a)near(ex.cl,ac.cl,2e-4);else near(ex.cl,0,1e-12);const mirror=shockExpansionDiamond(m,-a,e);near(mirror.cd,ex.cd,1e-10);near(mirror.cl,-ex.cl,1e-10);}
 assert.deepEqual(shockExpansionDiamond(2,0,0),{cl:0,cd:0,up1:0,up2:0,lo1:0,lo2:0});
 assert.equal(shockExpansionDiamond(1.15,.1,.1),null);
});
test('Fourier wave drag uses area-slope coefficients: exact multi-mode fixtures and dimensional scaling',()=>{
 for(const l of[.5,1,3]){const A=.006,base=x=>Math.max(0,4*x*(l-x)/(l*l))**1.5;
 for(const k of[0,.3,-.7]){const f=x=>A*base(x)*(1+k*(1-2*x/l)),r=waveDrag(f,l,700,50);near(r.A[1],3*A/l,1e-12);near(r.A[2],2*A*k/l,1e-9);near(r.dq,Math.PI*A*A/(l*l)*(4.5+3*k*k),1e-12);}
 const r=waveDrag(x=>A*Math.max(0,4*x*(l-x)/(l*l))**2.5,l,700,50);near(r.A[1],2.5*A/l,1e-12);near(r.A[3],-1.25*A/l,1e-12);near(r.dq,75*Math.PI*A*A/(16*l*l),1e-12);
 const sh=sears(.005,l);near(waveDrag(sh.S,l).dq,sh.dq,1e-12);}
});
test('actual area-rule coefficient assembly respects the same-volume minimum and converges against direct slope integration',()=>{
 const Af=.006,Aw=.0036,ww=.4;
 for(const xw of[.2,.35,.54]){const co=areaCoeffs(Af,Aw,xw,ww);
 for(const k of[0,.4,1]){const area=x=>fusIdeal(x,Af)+(1-k)*wingHump(x,Aw,xw,ww),V=3*Math.PI*Af/16+(1-k)*Aw*ww/2;
 assert.ok(dragOfK(co,k)>=sears(V).dq*(1-1e-12),'no below-minimum shape');
 let direct=0;for(let n=1;n<=100;n++){const an=2/Math.PI*integrate(th=>{const x=(1-Math.cos(th))/2,ds=6*Af*Math.sin(th)*Math.cos(th)+(x>xw&&x<xw+ww?(1-k)*Aw*Math.PI/ww*Math.sin(2*Math.PI*(x-xw)/ww):0);return ds*Math.sin(n*th)},0,Math.PI,4000);direct+=n*an*an;}
 near(dragOfK(co,k),Math.PI/4*direct,.005);
 for(let i=0;i<=1000;i++){const x=i/1000;assert.ok(fusIdeal(x,Af)-k*wingHump(x,Aw,xw,ww)>=-1e-15);}
 }}
});
test('Mason Korn/Lock correlation has the cited drag-divergence derivative and unswept reduction',()=>{
 near(mddKorn(.95,.12,.6,0),.77,1e-13);
 for(const L of[0,30*DEG,60*DEG]){const dd=mddKorn(.87,.1,.5,L),cr=dd-KORN_OFFSET,h=1e-6;near((cdWave(dd+h,cr)-cdWave(dd-h,cr))/(2*h),.1,1e-8);assert.equal(cdWave(cr-.1,cr),0);}
});
test('actual zero-angle flat-plate and attached-corner boundaries give honest finite readouts',()=>{
 const r=record(high.items.find(i=>i.num==='4.6'));r.controls[1].value=0;r.controls[2].value=0;r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/zero drag in both models/);
 r.controls[0].value=1.15;r.controls[1].value=10;r.controls[2].value=10;r.draw();assert.match(r.text(),/unavailable/);
 const corner=record(high.items.find(i=>i.num==='4.5'));corner.controls[0].value=1.1;corner.controls[1].value=1;corner.draw();assert.doesNotMatch(corner.text(),/NaN|Infinity/);
});
test('NASA TFAWS SI heat-flux example, scalings and actual high-altitude controls',()=>{
 const q=1.7415e-4*Math.sqrt(3.1459e-4)*3535**3,T=(q/(.8*5.67e-8))**.25;near(q/1e4,13.6,.004);near(T,1317, .002);
 const r=record(high.items.find(i=>i.num==='4.7'));r.controls[0].value=90;r.controls[1].value=.01;r.controls[2].value=.4;r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/fully|cold-wall/);
 const a=atmo(50000);assert.ok(a.T>200&&a.rho>0);
});

test('primary ground-effect fit uses doubled image spacing only within the published range',()=>{
 for(const h of[1/30,.1,.25]){const H=2*h;near(fitPhi(h),1-(1-.66*H)/(1.05+3.7*H),1e-13);}
 assert.equal(fitPhi(.03),null);assert.equal(fitPhi(1),null);
 for(const AR of[4,8,14]){const f=weissinger({AR,alpha:.1,M:50});let prior=0;for(const h of[.03,.1,.25,1]){const g=weissinger({AR,alpha:.1,h,M:50}),p=(g.CDi/g.CL**2)/(f.CDi/f.CL**2);assert.ok(p>prior&&p<1);assert.ok(g.CL>f.CL);prior=p;}}
 const r=record(lifting.items.find(i=>i.num==='3.7'));r.controls[0].value=1;r.draw();assert.match(r.text(),/outside its published range/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
