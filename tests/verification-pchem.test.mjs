import assert from 'node:assert/strict';
import test from 'node:test';
import {record,near} from './verification-physics-utils.mjs';
import c3 from '../content/pchem/ch03.js';import c3b from '../content/pchem/ch03-b.js';import c4 from '../content/pchem/ch04.js';import c4b from '../content/pchem/ch04-b.js';
import{R,VDW,vdwP,debyeS,cpOf,DFH,S298}from'../content/pchem/ch03.shared.js';
import{SUBST,phaseOf,vdwPsat,vdwRoots,vdwDensity,gammaWater,ripeningStep,antoineW}from'../content/pchem/ch04.shared.js';
const item=n=>[...c3.items,...c3b.items,...c4.items,...c4b.items].find(i=>i.num===n),fn=(r,s=0,n=0)=>r.stages[s].calls.filter(c=>c[0]==='fn')[n][1];
const simpson=(f,a,b,n=1200)=>{let s=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3};
test('finite heat-packet entropy uses exact block state functions and stops at actual equality',()=>{
 const r=record(item('3.1'));for(const mode of['down','up','work']){r.controls[0].set(mode);r.controls[4].set(70);r.draw();const paths=r.stages[0].calls.filter(c=>c[0]==='path'),a=paths[0][1],b=paths[1][1],entropy=r.stages[1].calls.find(c=>c[0]==='path')[1];for(let i=0;i<a.length;i++)near(entropy[i][1],100*Math.log(a[i][1]/350)+100*Math.log(b[i][1]/290),1e-12);if(mode==='down'){near(a.at(-1)[1],b.at(-1)[1],1e-12);near(a.at(-1)[1]+b.at(-1)[1],640,1e-12)}}
});
test('Clausius ledger independently conserves engine energy and produces zero only in the reversible limit',()=>{
 const r=record(item('3.4'));for(const d of[0,140])for(const f of[0,.5]){r.controls[0].set(d);r.controls[1].set(f);r.draw();const bars=r.stages[1].calls.filter(c=>c[0]==='rect'),a=bars[0][4],b=bars[2][4],sum=bars[4][4];near(a*600,(600-d)*R*Math.log(3),1e-12);near(-b*300,((300+d)+f*(300-2*d))*R*Math.log(3),1e-12);near(sum,a+b,1e-12);assert.ok(sum<=1e-12);if(!d&&!f)near(sum,0,1e-12)}
});
test('binomial entropy probabilities agree with independent recurrence and the variance of a fair split',()=>{
 const r=record(item('3.7'));for(const N of[4,30,1000]){r.controls[0].set(N);r.draw();const probabilities=N<=100?r.stages[1].calls.filter(c=>c[0]==='rect').map(c=>[.5*(c[1]+c[3]),c[4]]):r.stages[1].calls.find(c=>c[0]==='path')[1];near(probabilities.reduce((s,[x,p])=>s+p,0),1,2e-11);near(probabilities.reduce((s,[x,p])=>s+p*(N*x-N/2)**2,0),N/4,2e-10);let bin=1;for(let n=0;n<=Math.min(N,30);n++){if(n)bin*= (N-n+1)/n;near(Math.exp(r.stages[0].calls.find(c=>c[0]==='path')[1][n][1]*N),bin,2e-10)}}
});
test('residual-entropy toy model reaches the unbiased and ordered limits and distinguishes ice-rule violations',()=>{
 const r=record(item('3.8'));r.controls[0].set(0);r.draw();const bars=r.stages[2].calls.filter(c=>c[0]==='rect');near(bars[1][4],R*Math.log(2),1e-12);r.controls[0].set(2000);r.controls[1].set(5);r.draw();assert.ok(r.stages[2].calls.filter(c=>c[0]==='rect')[1][4]<1e-15);r.stages[1].click(.55,.55);r.draw();assert.ok(r.stages[1].calls.some(c=>c[0]==='corner'&&/violates/.test(c[1])));
});
test('Debye calorimetric integration agrees with an independent oscillator-density entropy formula',()=>{
 for(const theta of[60,92,130])for(const T of[1,50,83.8]){const y=theta/T,D=3/y**3*simpson(x=>x===0?0:x**3/Math.expm1(x),0,y,2400),expected=R*(4*D-3*Math.log1p(-Math.exp(-y)));near(debyeS(theta,T),expected,T<2?2e-6:1e-6)}
});
test('Helmholtz/Gibbs constraints and fuel-cell work bars satisfy independent first/second-law bookkeeping',()=>{
 const r=record(item('3.10'));for(const constraint of['p','V'])for(const dn of[-3,3]){r.controls[0].set(constraint);r.controls[3].set(dn);r.draw();const bars=r.stages[1].calls.filter(c=>c[0]==='rect'),T=r.stages[0].handles[0].x,q=6010-(constraint==='V'?dn*R*T:0);near(bars[1][4],-q/T,1e-12);near(bars[2][4],22-q/T,1e-12);near(bars[3][4],bars[2][4],1e-12)}
 const cell=record(item('3.11'));for(const resistance of[0,.6])for(const j of[.001,1.5]){cell.controls[0].set(resistance);cell.stages[0].handles[0].set(j,0);cell.draw();const bar=cell.stages[1].calls.filter(c=>c[0]==='rect');near(bar.slice(3).reduce((s,c)=>s+c[4]-c[2],0),285.83,1e-12);const V=fn(cell)(j);near(bar[3][4],2*96485.33212*V/1000,1e-12);assert.ok(V>=0&&V<=237130/(2*96485.33212))}
});
test('Maxwell derivatives independently match analytic entropy/pressure Jacobians for every potential and gas',()=>{
 const r=record(item('3.12'));for(const gas of['CO2','N2','Ar','ideal'])for(const pot of['U','H','A','G']){r.controls[0].set(gas);r.controls[1].set(pot);r.stages[1].handles[0].set(400,.22);r.draw();const g=gas==='ideal'?{a:0,b:0}:VDW[gas],cv=gas==='ideal'||gas==='Ar'?1.5*R:cpOf(gas,298.15)-R,T=400,V=.22,ST=cv/T,SV=R/(V-g.b),pT=R/(V-g.b),pV=-R*T/(V-g.b)**2+200*g.a/V**3;
 const expect={U:-SV/ST,H:1/(pT-pV*ST/SV),A:SV,G:-pT/pV}[pot],bars=r.stages[2].calls.filter(c=>c[0]==='rect');near(bars[0][4],expect,2e-7);near(bars[1][4],expect,2e-7)}
});
test('Gibbs–Helmholtz slope equals independently integrated reaction enthalpy with actual Cp inputs',()=>{
 const r=record(item('3.13')),reactions={haber:[['N2',-1],['H2',-3],['NH3',2]],co:[['CO',-1],['H2O',-1],['CO2',1],['H2',1]],water:[['H2',-1],['O2',-.5],['H2O',1]]};
 // The available production reaction selector supplies the exact stoichiometry captions.
 for(const key of ['haber'])for(const T of[350,700,950]){r.controls[0].set(key);r.draw();const f=fn(r),x=1000/T,h=1e-5,H=reactions[key].reduce((s,[sp,n])=>s+n*((sp==='H2O'?DFH.H2Og:DFH[sp]||0)*1000+simpson(t=>cpOf(sp,t),298.15,T)),0);near((f(x+h)-f(x-h))/(2*h),H/1000,1e-8)}
});
test('internal-pressure curve and every interpolated expansion marker satisfy the van der Waals energy invariant',()=>{
 const r=record(item('3.15'));for(const gas of['Ar','CO2','N2']){r.controls[0].set(gas);r.controls[2].set(.07);r.controls[3].set(20);r.draw(1.5);const g=VDW[gas],cv=gas==='Ar'?1.5*R:cpOf(gas,298.15)-R;near(fn(r)(.11),g.a/.11**2,1e-12);near(fn(r,0,1)(.11),g.a/.11**2,1e-9);const dot=r.stages[2].calls.find(c=>c[0]==='dot');near(cv*dot[2]-100*g.a/(.07*dot[1]),-100*g.a/.07,1e-12)}
});
test('phase reconstruction hits its anchors, identifies its unmodelled pressure region, and uses substance-specific handles',()=>{
 for(const S of Object.values(SUBST)){near(S.pv(S.Tt),S.pt,1e-12);near(S.pv(S.Tc),S.pc,1e-12);near(S.pv(S.T3),S.p3,1e-12);near(S.Tm(S.pt),S.Tt,1e-12)}near(SUBST.water.Tm(2085.66),251.165,1e-12);assert.equal(phaseOf(SUBST.water,300,5000),'unmodelled');const r=record(item('4.1'));r.controls[0].set('co2');r.draw();assert.deepEqual(r.stages[0].handles[0].constrain,{x:SUBST.co2.T,y:SUBST.co2.p});
});
test('chemical-potential model picks the lowest branch and keeps low-pressure vapour visible',()=>{
 const r=record(item('4.2'));for(const p of[.001,1,3000]){r.controls[0].set(p);r.draw();const funcs=r.stages[0].calls.filter(c=>c[0]==='fn').map(c=>c[1]),view=r.stages[0].calls.find(c=>c[0]==='setView')[2];for(const T of[240,300,420]){near(funcs[3](T),Math.min(...funcs.slice(0,3).map(f=>f(T))),1e-12);for(const f of funcs)assert.ok(f(T)>view[0]&&f(T)<view[1])}}
});
test('Clapeyron balances independent chemical-potential increments and handles a coincident vapour-pressure secant',()=>{
 const r=record(item('4.3'));for(const key of['wm','wb','cs','cm']){r.controls[0].set(key);r.draw();const line=r.stages[0].calls.find(c=>c[0]==='line'),slope=(line[4]-line[2])/(line[3]-line[1]),h=r.stages[0].handles[0];h.set(.2,.2*slope);r.draw();const bars=r.stages[1].calls.find(c=>c[0]==='bars')[1];near(bars[0]+bars[1],0,1e-11);near(bars[2],0,1e-11)}
 const s=record(item('4.4'));const x=1000/300;s.stages[0].handles.forEach(h=>h.set(x,Math.log(antoineW(300))));s.draw();assert.doesNotMatch(s.text(),/NaN|Infinity/);const H=R*Math.LN10*1435.264*(300/(300-64.848))**2/1000;assert.match(s.text(),new RegExp(H.toFixed(2)));near(fn(s)(1000/300),Math.log(antoineW(300)),1e-12);
});
test('triple coexistence is selected only at the model point and the melting line has its stated slope',()=>{
 const r=record(item('4.5'));r.buttons[0].fn();r.draw();assert.match(r.text(),/all three phases coexist/);r.stages[0].handles[0].set(273.3,611.657);r.draw();assert.doesNotMatch(r.text(),/all three phases coexist/);const l=r.stages[0].calls.find(c=>c[0]==='line');near((l[4]-l[2])/(l[3]-l[1]),-1.35e7,1e-8);
});
test('skate pressure uses actual contact geometry including out-of-model large pressure without a clipped marker',()=>{
 const r=record(item('4.6'));r.controls[0].set(120);r.controls[1].set(2);r.controls[2].set(.05);r.draw();const p=120*9.80665/(.02*.00005)/1e6;near(r.stages[0].handles[0].y,p,1e-12);assert.match(r.text(),/no actual phase prediction/);const view=r.stages[0].calls.find(c=>c[0]==='setView')[2];assert.ok(p<view[1]);
});
test('Maxwell saturation satisfies the independent equal-area integral and merges correctly at criticality',()=>{
 for(const T of[.6,.8,.95,.999]){const p=vdwPsat(T),roots=vdwRoots(T,p),[l,,g]=roots;assert.equal(roots.length,3);near(8*T/3*Math.log((3*g-1)/(3*l-1))+3/g-3/l-p*(g-l),0,1e-10);assert.ok(vdwDensity(T,p*.999)<vdwDensity(T,p*1.001))}near(vdwDensity(1,1),1,1e-12);const r=record(item('4.7'));r.buttons[1].fn();r.draw();assert.match(r.text(),/crosses the vaporization/);
});
test('IAPWS surface tension and frame work reproduce primary reference values and the selected elastic comparison',()=>{
 for(const [C,mN]of[[.01,75.65],[20,72.74],[100,58.91],[300,14.36]])near(1000*gammaWater(C+273.15),mN,.0005);
 const r=record(item('4.9'));r.controls[0].set('ethanol');r.controls[2].set(12);r.stages[0].handles[0].set(14.5,5);r.draw();assert.match(r.text(),/22.30/);assert.match(r.text(),/5.35/);const F=2*.0223*.12;assert.match(r.text(),new RegExp((F*.115).toExponential(3).replace('+','\\+')));r.controls[3].set(true);r.draw();assert.match(r.text(),/elastic-sheet comparison/);assert.match(r.text(),new RegExp((F*11.5**2*.01/8).toExponential(3).replace('+','\\+')));
});
test('bubble radius controls reset the physical state and one-surface pressures halve without losing volume',()=>{
 const r=record(item('4.11'));r.controls[2].set(.8);r.controls[3].set(3);r.draw();assert.match(r.text(),/12.50/);const p=r.stages[1].calls.find(c=>c[0]==='bars')[1];r.controls[0].set(2);r.draw();near(r.stages[1].calls.find(c=>c[0]==='bars')[1][0],p[0]/2,1e-12);for(const t of[0,1,10,30]){r.draw(t);const circles=r.stages[0].calls.filter(c=>c[0]==='circle');near(circles[0][3]**3+circles[1][3]**3,.8**3+3**3,1e-12)}
});
test('Kelvin curvature signs are reciprocal and the production coarsening step conserves volume across disappearances',()=>{
 const r=record(item('4.12'));for(const T of[0,100]){r.controls[0].set(T);r.draw();const f=fn(r),g=fn(r,0,1);for(const rad of[1.2,10,1000])near(f(rad)*g(rad),1,1e-12)}
 for(const a of[.68,1.2]){let radii=[3,4,8,12,18],V=radii.reduce((s,x)=>s+x**3,0);for(let i=0;i<2000;i++){const s=ripeningStep(radii,a,.01);radii=s.r;assert.ok(Number.isFinite(s.S));near(radii.reduce((s,x)=>s+x**3,0),V,1e-12)}assert.ok(radii.filter(x=>x>0).length<5)}
});
test('capillary law uses the primary-liquid fixture, signed depression, exact right-angle zero and meniscus-volume correction',()=>{
 const r=record(item('4.13'));r.controls[1].set('mercury');r.controls[2].set(.03);r.draw();const h=2*.4761*Math.cos(125*Math.PI/180)/(13546*9.80665*.00003)*1000;near(fn(r,1)(.03),Math.abs(h),1e-12);const view=r.stages[0].calls.find(c=>c[0]==='setView')[2];assert.ok(h/10>view[0]);r.controls[0].set(90);r.draw();assert.match(r.text(),/0.00.*flat meniscus/);assert.ok(Number.isNaN(fn(r,1)(.03)));assert.ok(!r.stages[1].calls.some(c=>c[0]==='dot'));r.controls[1].set('water');r.controls[2].set(.5);r.controls[3].set(true);r.draw();near(fn(r,1)(.5),2*.07274/(998*9.80665*.0005)*1000-.5/3,1e-12);
});
