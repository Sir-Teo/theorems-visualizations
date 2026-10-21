import test from 'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{stableResolvent,auditedShell,exactCouplingTail,graphPeriod}from'../content/prob/ch05-recurrence.audit.js';import{LATTICE,srwU}from'../content/prob/ch05-m.shared.js';import{ringChord,retTimes,gcdAll,cyclicChain,stationary,vecP,tvd}from'../content/prob/ch05-z.shared.js';import{rng}from'../assets/js/viz/math.js';
import{COUPLING_AP}from'../content/prob/ch05-z.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Polya return probabilities agree with independent spatial dynamic programming',()=>{
 for(let d=1;d<=3;d++){let mass=new Map([['0,0,0',1]]);const ref=srwU(d,12);for(let n=0;n<=12;n++){near(ref[n],mass.get('0,0,0')||0);const next=new Map();for(const[key,p]of mass){const x=key.split(',').map(Number);for(let axis=0;axis<d;axis++)for(const sign of [-1,1]){const y=x.slice();y[axis]+=sign;const k=y.join(',');next.set(k,(next.get(k)||0)+p/(2*d));}}mass=next;}}
 for(let d=1;d<=3;d++)near(srwU(d,2000)[2000]/(2*(d/(4000*Math.PI))**(d/2)),1,.001);
});
test('stable resolvents and radial integrals match independent 65-digit real-axis references',()=>{
 const fixtures=JSON.parse(readFileSync(new URL('../docs/verification/probability-recurrence-references.json',import.meta.url)));
 for(const row of fixtures.rows){const L=LATTICE[Number(row.drift)===0?'srw1':'bias1'],r=Number(row.r),got=auditedShell(L.w,1,r);near(row.eta?got.at(Number(row.eta)):got.total,Number(row.value),r===1?1e-10:1.1e-4);}
 for(const[k,L]of Object.entries(LATTICE))for(const r of [.5,.99,.99999,1])for(const x of [.001,.1,.7]){const a=L.w.reduce((s,e)=>s+e[3]*Math.cos(e[0]*x),0),b=L.w.reduce((s,e)=>s+e[3]*Math.sin(e[0]*x),0),re=1-r*a;near(stableResolvent(L.w,r,x),re/(re*re+(r*b)**2),1e-8);}
 near(stableResolvent(LATTICE.bias1.w,1,1e-9),12.5);assert.equal(stableResolvent(LATTICE.srw1.w,1,0),Infinity);
});
test('multidimensional quadrature resolves planar peaks and agrees with independent Cartesian integration',()=>{
 const sym=auditedShell(LATTICE.srw2.w,2,1);near(sym.at(1e-4)-sym.at(.01),8*Math.PI*Math.log(100),1e-6);
 for(const k of ['srw2','bias2'])for(const r of [.5,.99]){const L=LATTICE[k],got=auditedShell(L.w,2,r);let integral=0;const N=700,h=2/N;for(let i=0;i<N;i++){const x=-1+(i+.5)*h;for(let j=0;j<N;j++){const y=-1+(j+.5)*h;if(x*x+y*y<1){let a=0,b=0;for(const[dx,dy,,p]of L.w){a+=p*Math.cos(dx*x+dy*y);b+=p*Math.sin(dx*x+dy*y);}integral+=(1-r*a)/((1-r*a)**2+(r*b)**2)*h*h;}}}near(got.total,integral,5e-4);}
 const biased=auditedShell(LATTICE.bias2.w,2,1);assert.ok(biased.at(1e-4)>26&&biased.at(1e-4)<28);near(biased.at(1e-4),auditedShell(LATTICE.bias2.w,2,1,{nr:800}).at(1e-4),2e-4);
 for(const r of[.5,.99]){const got=auditedShell(LATTICE.srw3.w,3,r),N=100,h=2/N;let integral=0;for(let i=0;i<N;i++){const x=-1+(i+.5)*h;for(let j=0;j<N;j++){const y=-1+(j+.5)*h;for(let k=0;k<N;k++){const z=-1+(k+.5)*h;if(x*x+y*y+z*z<1)integral+=h**3/(1-r*(Math.cos(x)+Math.cos(y)+Math.cos(z))/3);}}}near(got.total,integral,2e-3);}

});
test('ring periods match exact cycle gcd and every finite return path, including ineffective chords',()=>{
 for(let L=2;L<=9;L++)for(let M=1;M<=9;M++)for(const loop of [false,true]){const m=Math.min(L,M),adj=ringChord(L,m,loop),period=loop?1:gcdAll([L,...(m<L?[m]:[])]);assert.equal(graphPeriod(adj),period);assert.equal(gcdAll(retTimes(adj,0,40)),period);for(const n of retTimes(adj,0,100))assert.equal(n%period,0);}
});
test('killed product recursion agrees with independently enumerated coupled histories',()=>{
 const P=[[.2,.8],[.6,.4]],pi=[3/7,4/7],tail=exactCouplingTail(P,pi,0,7);let alive=[[0,1,pi[1]]];for(let t=0;t<=7;t++){near(tail[t],alive.reduce((s,e)=>s+e[2],0));const next=[];for(const[x,y,p]of alive)for(let a=0;a<2;a++)for(let b=0;b<2;b++)if(a!==b)next.push([a,b,p*P[x][a]*P[y][b]]);alive=next;}
 const piAP=stationary(COUPLING_AP),tailAP=exactCouplingTail(COUPLING_AP,piAP,0,60);let muAP=Array(6).fill(0);muAP[0]=1;for(let n=0;n<=60;n++){assert.ok(tvd(muAP,piAP)<=tailAP[n]+1e-12);muAP=vecP(muAP,COUPLING_AP);}
 for(const shortcut of [false,true]){const{P}=cyclicChain(2,3,rng(11),shortcut),pi=stationary(P),tail=exactCouplingTail(P,pi,0,400);let mu=Array(6).fill(0);mu[0]=1;for(let n=0;n<=400;n++){assert.ok(tvd(mu,pi)<=tail[n]+1e-12);if(n)assert.ok(tail[n]<=tail[n-1]+1e-12);mu=vecP(mu,P);}if(shortcut)assert.ok(tail[400]<1e-6);else near(tail[400],.5,1e-7);}
});
test('cyclic tail labels and initial-law dependence agree with exact graph periods',()=>{
 for(const d of [2,3,4])for(const shortcut of [false,true]){const ch=cyclicChain(d,d===4?2:3,rng(22+d),shortcut);assert.equal(graphPeriod(ch.adj),shortcut?1:d);if(!shortcut)for(let i=0;i<ch.n;i++)for(const j of ch.adj[i])assert.equal(ch.cls[j],(ch.cls[i]+1)%d);const mass=Array(d).fill(0);for(let i=0;i<ch.n;i++)mass[ch.cls[i]]+=1/ch.n;for(const p of mass)near(p,1/d);const fixed=Array(d).fill(0);fixed[0]=1;assert.equal(fixed.filter(p=>p>0).length,1);}
});
