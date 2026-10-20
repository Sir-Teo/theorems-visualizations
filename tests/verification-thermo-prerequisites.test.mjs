import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./thermo-prerequisite-baseline.json',import.meta.url)));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v)).digest('hex');
test('THERMO prerequisite batch preserves all 112 objects and functions outside authorized idea/deps, and entire syllabus outside owned deps',async()=>{
 let count=0;for(const [num,row]of Object.entries(spec.baseline)){const m=(await import('../'+row.file)).default,x={...m.items.find(x=>x.num===num)};assert.ok(x.num);if(spec.edges[num]){assert.deepEqual(x.deps,[...row.deps,...spec.edges[num]]);assert.ok(x.idea.startsWith(row.idea+' '));delete x.idea;delete x.deps;}assert.equal(hash(x),row.hash,num);count++;}assert.equal(count,112);assert.equal(hash((await import('../content/thermo/syllabus.js')).default),spec.syllabusHash);
});
test('FTC paths independently reproduce adiabatic, entropy and exergy integrals',()=>{
 const integrate=(f,a,b)=>{let s=0,n=8192;for(let i=0;i<n;i++)s+=f(a+(i+.5)*(b-a)/n);return s*(b-a)/n;};
 for(const [a,b]of [[.5,1],[1,5],[50,100],[273,600]]){assert.ok(Math.abs(integrate(x=>1/x,a,b)-Math.log(b/a))<1e-7);const t=300,C=4,Ti=t+b;assert.ok(Math.abs(integrate(x=>C*(1-t/x),t,Ti)-C*((Ti-t)-t*Math.log(Ti/t)))<1e-5);}
 for(const f of [3,5,7])for(const V of [.5,1,4]){const T=300*V**(-2/f);assert.ok(Math.abs(f/2*Math.log(T/300)+Math.log(V))<1e-12);}
});
test('chain rule Euler identity and positive interior nucleation barrier',()=>{
 for(const U of [1,3,10])for(const V of [1,2,7])for(const N of [.5,2,5]){const S=N*(1.5*Math.log(U/N)+Math.log(V/N)),Su=1.5*N/U,Sv=N/V,Sn=S/N-2.5;assert.ok(Math.abs(U*Su+V*Sv+N*Sn-S)<1e-12);}
 for(const gamma of [.1,1,5])for(const dg of [.2,1,4]){const r=2*gamma/dg,G=x=>4*Math.PI*x*x*gamma-4/3*Math.PI*x**3*dg;assert.ok(G(r)>G(.9*r)&&G(r)>G(1.1*r));assert.ok(Math.abs(G(r)-16*Math.PI*gamma**3/(3*dg**2))<1e-9);}
});
test('canonical variance, product independence, Gaussian normalization, and Stirling correction',()=>{
 for(const beta of [.1,1,3]){const ea=[0,1,3],eb=[-1,2],wa=ea.map(x=>Math.exp(-beta*x)),wb=eb.map(x=>Math.exp(-beta*x)),za=wa.reduce((a,b)=>a+b),zb=wb.reduce((a,b)=>a+b);let mean=0,second=0,centered=0;for(let i=0;i<3;i++)for(let j=0;j<2;j++){const p=wa[i]*wb[j]/(za*zb);mean+=p*(ea[i]+eb[j]);second+=p*(ea[i]+eb[j])**2;assert.ok(Math.abs(p-wa[i]/za*wb[j]/zb)<1e-15);}for(let i=0;i<3;i++)for(let j=0;j<2;j++)centered+=wa[i]*wb[j]/(za*zb)*(ea[i]+eb[j]-mean)**2;assert.ok(Math.abs(centered-(second-mean*mean))<1e-12);const variance=(es,ws,z)=>{const m=es.reduce((s,e,i)=>s+e*ws[i]/z,0);return es.reduce((s,e,i)=>s+(e-m)**2*ws[i]/z,0);};assert.ok(Math.abs(centered-variance(ea,wa,za)-variance(eb,wb,zb))<1e-12);}
 for(const a of [.25,1,4]){let integral=0,n=40000,dx=16/Math.sqrt(a)/n;for(let i=0;i<n;i++){const x=(-8/Math.sqrt(a))+(i+.5)*dx;integral+=Math.exp(-a*x*x)*dx;}assert.ok(Math.abs(integral-Math.sqrt(Math.PI/a))<1e-11);}
 for(const N of [10,100,1000]){let logfac=0;for(let i=1;i<=N;i++)logfac+=Math.log(i);const correction=logfac-(N*Math.log(N)-N);assert.ok(correction>0&&Math.abs(correction-.5*Math.log(2*Math.PI*N))<1/(11*N));}
});
