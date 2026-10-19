import assert from 'node:assert/strict';
import test from 'node:test';
import {record,near} from './verification-physics-utils.mjs';
import c5 from '../content/thermo/ch05-b.js';
import c6 from '../content/thermo/ch06.js';
import c6b from '../content/thermo/ch06-b.js';
import {canon,cEin,brillouin,langevin,KB,HP,AMU} from '../content/thermo/ch06.shared.js';
const item=n=>[...c5.items,...c6.items,...c6b.items].find(i=>i.num===n);
const fn=(r,stage=0,i=0)=>r.stages[stage].calls.filter(c=>c[0]==='fn')[i][1];
const choose=(n,k)=>{let p=1;for(let j=1;j<=k;j++)p*= (n-k+j)/j;return p};
test('Sackur–Tetrode degeneracy boundary satisfies n lambda^3 = 1 when h is changed',()=>{
 const r=record(item('5.11'));for(const f of[.5,1,2])for(const bar of[1,1000]){r.controls[2].set(bar);r.controls[3].set(f);r.draw();const td=r.stages[0].calls.find(c=>c[0]==='vband')[2],m=4.002602*AMU,lambda=f*HP/Math.sqrt(2*Math.PI*m*KB*td);near(bar*1e5/(KB*td)*lambda**3,1,1e-12)}
});
test('finite reservoir probabilities use all q+1 states and zero probability beyond the energy budget',()=>{
 const r=record(item('6.1'));for(const N of[3,8,40])for(const u of[.3,1.5,4]){r.controls[0].set(N);r.controls[1].set(u);r.draw();const q=Math.round(N*u),dots=r.stages[0].calls.find(c=>c[0]==='dots'&&c[2].color==='orange')[1];for(const [n,p]of dots)near(p,n<=q?choose(q-n+N-1,N-1)/choose(q+N,N):0,3e-11);assert.doesNotMatch(r.text(),/NaN|Infinity/);const p=Array.from({length:q+1},(_,n)=>choose(q-n+N-1,N-1)/choose(q+N,N));near(p.reduce((a,b)=>a+b),1,1e-12);near(p.reduce((a,b,n)=>a+n*b,0),q/(N+1),1e-11)}
});
test('canonical central moments and entropy survive large energy-zero shifts and reproduce direct microstate sums',()=>{
 const levels=[{E:0,g:2},{E:1,g:3},{E:4,g:1}];for(const b of[.01,.7,10,-.7]){const a=canon(levels,b),c=canon(levels.map(l=>({...l,E:l.E+1e12})),b);a.p.forEach((p,i)=>near(c.p[i],p,1e-13));near(c.C,a.C,1e-13);near(c.S,a.S,1e-13);const states=[0,0,1,1,1,4],w=states.map(E=>Math.exp(-b*E)),Z=w.reduce((a,b)=>a+b),p=w.map(v=>v/Z),U=p.reduce((s,p,i)=>s+p*states[i],0);near(a.U,U,1e-12);near(a.varE,p.reduce((s,p,i)=>s+p*(states[i]-U)**2,0),1e-12);near(a.S,-p.reduce((s,p)=>s+p*Math.log(p),0),1e-12)}
 for(const y of[1e-8,.1,1,20,400,700]){near(cEin(y),y<1e-5?1-y*y/12:y*y*Math.exp(-y)/(1-Math.exp(-y))**2,1e-12);if(y>=400)assert.ok(cEin(y)>0)}
});
test('partition weights honor degeneracy and dragged levels at both temperature extremes',()=>{
 const r=record(item('6.2'));r.controls[1].set('c');r.stages[0].handles[0].set(.2,.3);for(const T of[.05,8]){r.controls[0].set(T);r.draw();const bars=r.stages[1].calls.filter(c=>c[0]==='rect'),levels=[0,.3,1.3,2.1,3,4.1];bars.forEach((c,i)=>near(c[4],2**i*Math.exp(-levels[i]/T),1e-12))}
});
test('oscillator fluctuations equal T squared C, with independent geometric moments and N scaling',()=>{
 const r=record(item('6.4'));for(const N of[1,50,500])for(const T of[.3,5]){r.controls[0].set(N);r.controls[1].set(T);r.draw();const x=Math.exp(-1/T),mean=N/Math.expm1(1/T),variance=N*x/(1-x)**2;near(T*T*N*cEin(1/T),variance,1e-12);near(fn(r,1)(N),Math.sqrt(variance)/mean,1e-12);assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
test('free-energy slopes agree with analytic oscillator entropy and volume force across control corners',()=>{
 const r=record(item('6.5'));for(const T of[.1,4])for(const V of[.5,2])for(const gamma of[.3,3]){r.controls[0].set(T);r.controls[1].set(V);r.controls[2].set(gamma);r.draw();const omega=V**-gamma,U=omega*(.5+1/Math.expm1(omega/T)),F=omega/2+T*Math.log1p(-Math.exp(-omega/T));near(fn(r)(T),F,1e-12);const h=1e-5;near(-(fn(r,1)(V+h)-fn(r,1)(V-h))/(2*h),gamma*U/V,2e-7);const view=r.stages[0].calls.find(c=>c[0]==='setView')[2];assert.ok(F>=view[0]&&F<=view[1]);assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
test('Gibbs entropy includes zero probabilities, pure distributions, and degeneracy-normalized canonical law',()=>{
 const r=record(item('6.6'));r.controls[0].set('uni');for(const m of[1,6]){r.controls[1].set(m);r.draw();assert.match(r.text(),new RegExp(Math.log(m).toFixed(4)))}r.controls[0].set('boltz');r.controls[2].set(.2);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('Schottky peak and entropy integral follow direct two-state probabilities for every degeneracy',()=>{
 const r=record(item('6.9'));for(const g of[1,3,6]){r.controls[0].set(g);r.draw();const C=fn(r),S=fn(r,2);for(const T of[.05,.42,5]){const p=g*Math.exp(-1/T)/(1+g*Math.exp(-1/T));near(C(T),p*(1-p)/(T*T),1e-12);near(S(T),canon([{E:0},{E:1,g}],1/T).S,1e-12)}let sum=0;const n=10000,a=Math.log(.01),h=(Math.log(1e5)-a)/n;for(let i=0;i<n;i++)sum+=C(Math.exp(a+(i+.5)*h))*h;near(sum,Math.log(1+g),1e-9)}
});
test('Brillouin magnetization matches independently enumerated Zeeman states and keeps high B/T visible',()=>{
 for(const J of[.5,1,1.5,3.5,7.5])for(const x of[1e-7,.1,3,300]){const m=Array.from({length:2*J+1},(_,i)=>J-i),w=m.map(v=>Math.exp(x*(v/J-1))),Z=w.reduce((a,b)=>a+b);near(brillouin(J,x),m.reduce((s,v,i)=>s+v*w[i]/Z,0)/J,1e-10)}near(langevin(1e-7),1e-7/3,1e-15);
 const r=record(item('6.10'));r.controls[1].set(10);r.controls[2].set(.3);r.draw();const h=r.stages[0].handles[0],view=r.stages[0].calls.find(c=>c[0]==='setView')[1];assert.ok(h.x>100&&h.x<view[1]);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('equipartition simulation equilibrates the actual quadratic/quartic/absolute/quantum energies',()=>{
 const r=record(item('6.12'),{time:20});const bars=r.stages[1].calls.filter(c=>c[0]==='rect'),expected=[.5,1,.25,1,4/Math.expm1(4)];bars.forEach((c,i)=>assert.ok(Math.abs(c[4]-expected[i])<.045,`${i}: ${c[4]} vs ${expected[i]}`));
});
test('diatomic models distinguish equilibrium conversion from frozen 3:1 mixture and retain table values',()=>{
 const r=record(item('6.14'));r.controls[1].set(50);r.draw();assert.match(r.text(),/2.068 \(rotation\)/);r.controls[0].set('h2n');r.draw();assert.match(r.text(),/0.004 \(rotation\)/);r.controls[0].set('n2');r.controls[1].set(300);r.draw();assert.match(r.text(),/1.000 \(rotation\)/);const dots=r.stages[0].calls.filter(c=>c[0]==='dot'&&c[3]?.color==='gold');near(dots.find(c=>c[1]===298.15)[2],29.124/8.314462618-1,1e-12);
});
test('canonical ideal-gas entropy matches all five NIST review values and numerical EOS derivatives',()=>{
 const r=record(item('6.16'));for(const gas of['He','Ne','Ar','Kr','Xe']){r.controls[0].set(gas);r.draw();const match=r.text().match(/Sackur–Tetrode.*?=([\d.]+)\$.*?vs NIST ([\d.]+)/s);assert.ok(match);near(+match[1],+match[2],.00005);assert.match(r.text(),/1.000000/)}
});
test('ensemble comparison uses normalized negative-binomial law and states the N=1 flat-density failure',()=>{
 const r=record(item('6.17'));r.controls[0].set(1);r.draw();assert.match(r.text(),/undefined \(flat/);assert.doesNotMatch(r.text(),/NaN|Infinity/);for(const N of[10,100,1000]){r.controls[0].set(N);r.draw();const p=r.stages[0].calls.filter(c=>c[0]==='rect').reduce((s,c)=>s+c[4],0);assert.ok(p>.99&&p<=1+1e-10);const txt=r.text(),e=+txt.match(/relative difference ([\d.]+)/)[1];assert.ok(e<110/N)}
});
test('thermal density matrix agrees with a separate Pauli exponential and normalized mixed-state invariants',()=>{
 const r=record(item('6.19'));for(const T of[.05,.5,5])for(const [nx,nz]of[[0,1],[1,0],[-.6,.8]]){r.controls[0].set(T);r.stages[0].handles[0].set(nx,nz);r.draw();const mag=Math.tanh(.5/T),rho=[[(1-mag*nz)/2,-mag*nx/2],[-mag*nx/2,(1+mag*nz)/2]],pur=rho.flat().reduce((s,x)=>s+x*x,0);near(pur,(1+mag*mag)/2,1e-12);assert.match(r.text(),new RegExp(pur.toFixed(3)));assert.doesNotMatch(r.text(),/NaN|Infinity/)}
});
test('Feynman two-rate ratchet obeys load-dependent detailed balance and zero-current Carnot limit',()=>{
 const r=record(item('5.19'),{time:3});for(const T of[1,2,4])for(const eps of[.5,3,6]){r.controls[0].set(T);r.controls[1].set(eps);r.draw();const net=fn(r,2),stall=eps*(T-1);near(net(stall),0,1e-14);near(net(0),Math.exp(-eps/T)-Math.exp(-eps),1e-14);near(stall/(eps+stall),1-1/T,1e-14);if(T===1)assert.ok(net(1)<0);else assert.ok(net(stall*.5)>0)}
});
