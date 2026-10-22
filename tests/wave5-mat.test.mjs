import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import * as M from '../content/mat/ch05.shared.js';
import chapter from '../content/mat/ch05.js';
import syllabus from '../content/mat/syllabus.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const python=(src,data)=>{const r=spawnSync('python3',['-c',src],{input:JSON.stringify(data),encoding:'utf8',maxBuffer:8e6});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
test('monotonic law: independent piecewise stress integrals and strain decomposition',()=>{
 for(const brittle of [true,false])for(const e of [0,.001,.005,.01,.011,.05,.1,.3]){
  const q=M.tensile(e,{brittle}),ey=.01,k=1000*30/1030;
  const expected=brittle||e<=ey?500*e*e:.05+10*(e-ey)+.5*k*(e-ey)**2;
  near(q.work,expected);near(q.stress,1000*(e-q.p));if(!brittle&&e>ey)near(q.stress,10+30*q.p);
 }assert.throws(()=>M.tensile(-1));
});
test('Inglis boundary: independent hyperbolic formula, endpoints, rotation and exact circle',()=>{
 let count=0;
 for(const k of [.05,.1,.3,.7,.9])for(let j=0;j<=72;j++){
  const t=j*Math.PI/36,alpha=Math.atanh(k),source=Math.exp(2*alpha)*(Math.sinh(2*alpha)*(1+Math.exp(-2*alpha))/(Math.cosh(2*alpha)-Math.cos(2*t))-1);
  near(M.ellipse(t,k),source,2e-10);near(M.ellipse(t,k,'x'),M.ellipse(Math.PI/2-t,1/k,'y'));count++;
 }for(let j=0;j<=180;j++){const t=j*Math.PI/90;near(M.ellipse(t,1),1+2*Math.cos(2*t));}
 for(const k of [.05,.3,1]){near(M.ellipse(0,k),1+2/k);near(M.ellipse(Math.PI/2,k),-1);near(M.ellipse(Math.PI/2,k,'x'),1+2*k);}assert.equal(count,365);
});
test('Griffith factors and SI dimensions, independent differential energy release',()=>{
 for(const a of [.0001,.001,.006])for(const sigma of [0,1e6,20e6,40e6])for(const plane of ['stress','strain']){
  const q=M.griffith(a,sigma,70e9,.3,10,plane),Ep=plane==='strain'?70e9/.91:70e9;
  near(q.surface,40*a);near(q.potential,-Math.PI*sigma*sigma*a*a/Ep);near(q.G,Math.PI*sigma*sigma*a/Ep);
  const h=a*1e-4,plus=M.griffith(a+h,sigma,70e9,.3,10,plane),minus=M.griffith(a-h,sigma,70e9,.3,10,plane);
  near(-(plus.potential-minus.potential)/(4*h),q.G,1e-9);
  if(sigma)near(M.griffith(q.critical,sigma,70e9,.3,10,plane).G,20);else assert.equal(q.critical,Infinity);
 }
});
test('fixed load and fixed displacement potentials: true derivative at current force',()=>{
 for(const mode of ['load','displacement'])for(const q of [0,.1,.8,1,2,3])for(const P of [.2,1,3]){
  const z=M.compliance(q,P,mode),h=1e-5,up=M.compliance(q+h,P,mode),dn=M.compliance(Math.max(0,q-h),P,mode);
  if(q)near(-(up.elastic-dn.elastic)/(2*h),z.driving,1e-9);near(z.total,z.surface+z.elastic);
  if(mode==='displacement')near(z.P*z.C,P);else near(z.P,P);
 }
 assert.ok(M.compliance(3,2,'load').driving>M.compliance(3,2,'displacement').driving);
});
test('K-G conversion independently in SI: plane stress/strain and plastic-zone diagnostic',()=>{
 for(const a of [.0001,.002,.01])for(const s of [0,100,500])for(const Y of [1,1.12]){
  const p=M.intensity(a,s,Y,70000,.3,'stress'),e=M.intensity(a,s,Y,70000,.3,'strain');
  const kSI=Y*s*1e6*Math.sqrt(Math.PI*a),gSI=kSI*kSI/(70e9);
  near(p.K,kSI/1e6);near(p.G,gSI);near(e.G,.91*gSI);near(p.rp,(p.K/500)**2/(2*Math.PI));
 }assert.throws(()=>M.intensity(0,10,1,1e5,.3));
});
test('authored transition inverse: criterion is not automatically its midpoint',()=>{
 for(const mid of [-60,0,60])for(const w of [5,25,60])for(const energy of [11,20,60,90,109]){
  const t=M.transitionTemperature(energy,mid,w);near(M.transition(t,mid,w),energy);
  if(energy===60)near(t,mid);
 }assert.equal(M.transitionTemperature(10,0,25),null);assert.equal(M.transitionTemperature(110,0,25),null);
});
test('Weibull spatial integral: independent Simpson quadrature and weakest-link products',()=>{
 for(const m of [2,2.7,5,11.9,12])for(const V of [.25,1,8])for(const s of [0,30,100,200]){
  let integral=0;const N=20000;
  for(let j=0;j<=N;j++){const z=j/N;integral+=(j===0||j===N?1:j%2?4:2)*z**m;}integral/=3*N;
  const bend=M.survival(s,m,V,'bend'),uniform=M.survival(s,m,V);
  near(bend.hazard,V*.5*integral*(s/100)**m,3e-11);
  near(uniform.survival,M.survival(s,m,V/2).survival**2);
  near(bend.failure,-Math.expm1(-bend.hazard));
 }assert.equal(M.survival(0,5,1).failure,0);
 const a=M.strengths(5,1,'uniform',17),b=M.strengths(5,8,'uniform',17);assert.equal(a.length,200);a.forEach((x,i)=>near(b[i],x/8**.2));
 assert.deepEqual(a,M.strengths(5,1,'uniform',17));assert.notDeepEqual(a,M.strengths(5,1,'uniform',18));
});
test('Basquin cycles versus reversals and additional floor convention',()=>{
 for(const b of [-.2,-.12,-.05])for(const N of [1,1e3,1e6,1e10])near(M.fatigueLife(M.basquin(N,1000,b),1000,b),N);
 assert.equal(M.fatigueLife(120,1000,-.12,120),Infinity);assert.equal(M.fatigueLife(119,1000,-.12,120),Infinity);
 assert.ok(Number.isFinite(M.fatigueLife(120.0000001,1000,-.12,120)));assert.equal(M.basquin(1e100,1000,-.12,120),120);
});
test('chosen creep exact integration matches independently integrated ODE trajectories',()=>{
 const states=[];for(const r of [.002,.01,.03])for(const n of [2,4,6])for(const mode of ['load','stress'])for(const t of [1,5,10]){const q=M.creep(t,r,n,mode);if(q.valid)states.push({r,n,mode,t,expected:q});}
 const oracle=python(`import sys,json,math\na=json.load(sys.stdin);out=[]\nfor z in a:\n y=0.;N=16000;dt=z['t']/N\n def rate(t,y):return z['r']*(.2+.8*math.exp(-t/2))*(math.exp(z['n']*y) if z['mode']=='load' else 1)\n for i in range(N):\n  t=i*dt;k1=rate(t,y);k2=rate(t+dt/2,y+dt*k1/2);k3=rate(t+dt/2,y+dt*k2/2);k4=rate(t+dt,y+dt*k3);y+=dt*(k1+2*k2+2*k3+k4)/6\n out.append([y,rate(z['t'],y)])\nprint(json.dumps(out))`,states);
 states.forEach((z,i)=>{near(z.expected.strain,oracle[i][0],2e-10);near(z.expected.rate,oracle[i][1],2e-10);near(z.expected.area,Math.exp(-z.expected.strain));});
 for(const r of [.002,.03])for(const n of [2,6]){const h=M.creepHorizon(r,n);assert.ok(M.creep(.95*h,r,n).valid);assert.equal(M.creep(1.01*h,r,n).valid,false);}
});
test('rate and rupture correlation have independent parameters and declared units',()=>{
 for(const s of [30,100,300])for(const T of [700,900,1100])for(const n of [2,4,8]){
  const rate=M.powerLog10(s,T,n),direct=1e-6*(s/100)**n*Math.exp(-150000/M.R*(1/T-1/900));near(rate,Math.log10(direct));
  for(const C of [15,20,25]){const p=M.ruptureLog10(s,T,C);near(T*(C+p.logTime),p.parameter);}
 }near(M.powerLog10(100,900,4),-6);
});
test('mechanism superposition: actual candidates, alternative exclusion, independent Python rates',()=>{
 const states=[];for(const t of [.3,.6,.95])for(const s of [-5,-3,Math.log10(.03)])for(const d of [1e2,1e4,1e5])states.push([t,s,d]);
 const oracle=python(`import sys,json,math\nout=[]\nfor t,s,d in json.load(sys.stdin):\n S=10**s;delta=1/t-1/.6\n r=[1e-7*(S/.001)*(d/1e4)**-2*math.exp(-8*delta),2e-7*(S/.001)*(d/1e4)**-3*math.exp(-5*delta),1e-8*(S/.001)**4*math.exp(-10*delta),math.exp(-30/t*max(0,1-S/.02)**2)]\n active=r[:];active[3 if r[2]>=r[3] else 2]=0;total=sum(active)\n out.append([math.log10(total),[x/total for x in active],r.index(max(r))])\nprint(json.dumps(out))`,states);
 states.forEach((z,i)=>{const q=M.mechanisms(...z);near(q.log10Total,oracle[i][0]);q.shares.forEach((s,j)=>near(s,oracle[i][1][j]));assert.equal(q.dominant,oracle[i][2]);near(q.shares.reduce((a,b)=>a+b),1);assert.ok(q.shares[2]===0||q.shares[3]===0);});
});
test('contours are finite bounded numerical segments, not empirical map boundaries',()=>{
 const fn=(x,y)=>M.mechanisms(x,y,1e4).log10Total;
 let count=0;for(const l of [-12,-9,-6,-3,0])for(const seg of M.contour(fn,l)){count++;for(const [x,y] of seg){assert.ok(x>=.3&&x<=.95&&y>=-5&&y<=Math.log10(.03));assert.ok(Math.abs(fn(x,y)-l)<.08);}}
 assert.ok(count>40);
});
test('frozen ten identities and exact preexisting aliases survive chapter metadata',()=>{
 const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(x=>x.collection==='mat'&&x.chapter===5);
 assert.deepEqual(chapter.items.map(({num,kind,name})=>({num,kind,name})),plan.items.map(({num,kind,name})=>({num,kind,name})));
 const row=syllabus.chapters.find(x=>x.n===5);for(const [num,alias,name] of [['5.8','solid-11.8','Paris law for fatigue crack growth'],['5.9','solid-4.8','Miner’s rule of cumulative damage'],['5.13','solid-11.12','The Phenomena of Rupture and Flow in Solids']])assert.deepEqual(row.items.find(x=>x.num===num),{num,alias,name});
 for(const item of chapter.items){assert.ok(item.statement&&item.idea&&item.scope&&item.caption);assert.equal(typeof item.viz,'function');assert.ok(!item.deps.some(d=>['solid-11.4','solid-11.6'].includes(d)));}
});
