import test from 'node:test';import assert from 'node:assert/strict';
import {criticalPath,criticalSurvival,exactDyadicTable,dyadicErrors,spikeTailSup,hiddenCoinPosterior,paretoXLogMoment} from '../content/prob/ch04-convergence.audit.js';
import {martPath}from'../content/prob/ch04-m3.js';
import {rng} from '../assets/js/viz/math.js';import {simpson,DFUN} from '../content/prob/ch04-z.shared.js';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('critical branching uses exact offspring draws even above 400 individuals',()=>{
 let draws=0;const z=criticalPath(()=>{draws++;return .75;},'binary',10);assert.equal(z[10],1024);assert.equal(draws,1023);
 for(const kind of ['poisson','binary','geom']){const s=criticalSurvival(kind,20000);assert.equal(s[0],1);for(let n=1;n<s.length;n++)assert.ok(s[n]>0&&s[n]<s[n-1]);near(20000*s[20000],kind==='geom'?1:2,.001);
  if(kind==='geom')for(const n of [1,2,30,300,20000])near(s[n],1/(n+1));
  const r=rng(3141+kind.length),N=30000,at=20;let alive=0,sum=0,sum2=0;for(let i=0;i<N;i++){const z=criticalPath(r,kind,at)[at];alive+=z>0;sum+=z;sum2+=z*z;}
  assert.ok(Math.abs(alive/N-s[at])<6*Math.sqrt(s[at]*(1-s[at])/N));assert.ok(Math.abs(sum/N-1)<6*Math.sqrt((sum2/N-(sum/N)**2)/N));
 }
});
test('exact dyadic means satisfy tower identities and integrals independently',()=>{
 for(const key of Object.keys(DFUN)){const tab=exactDyadicTable(key,11);for(let n=0;n<11;n++)for(let j=0;j<2**n;j++)near(tab[n][j],(tab[n+1][2*j]+tab[n+1][2*j+1])/2,5e-11);
  near(tab[0][0],{smooth:.3,jump:.75,rough:0,blow:2}[key]);
  const e=dyadicErrors(key,0,tab[0],DFUN[key].f);assert.ok(e.l1>=0&&Number.isFinite(e.sampledMax));if(key==='blow')near(e.l1,1);if(key==='jump')near(e.l1,11/12);
  if(key==='smooth'||key==='rough'){for(const [n,j] of [[3,2],[7,17],[11,500]]){const a=j/2**n,b=(j+1)/2**n;near(tab[n][j],simpson(DFUN[key].f,a,b,10000)/(b-a),5e-10);}}
 }
 const t=exactDyadicTable('blow');for(const n of [0,3,7]){let integral=0;for(let j=0;j<2**n;j++){const c=t[n][j],a=Math.sqrt(j/2**n),b=Math.sqrt((j+1)/2**n),cross=1/c;integral+=simpson(u=>2*Math.abs(c*u-1),a,cross,10)+simpson(u=>2*Math.abs(c*u-1),cross,b,10);}near(dyadicErrors('blow',n,t[n],DFUN.blow.f).l1,integral);}assert.ok(dyadicErrors('blow',11,t[11],DFUN.blow.f).l1<.03);
});
test('spike tail strict threshold, escaping mass and infinity',()=>{
 assert.equal(spikeTailSup(1,100,1),1);assert.equal(spikeTailSup(1.1,100,10000),Infinity);
 for(const a of [.1,.5,.95])for(const M of [1,4,10])for(const n of [1,30,200]){const first=Math.max(n,Math.floor(M**(1/a))+1);near(spikeTailSup(a,M,n),first**(a-1));assert.ok(first**a>M);if(first>n)assert.ok((first-1)**a<=M*(1+1e-14));}
 assert.equal(spikeTailSup(.5,2,1),1/Math.sqrt(5));
});
test('hidden-coin posterior equals full path Bayes likelihood and has independent mixture limit',()=>{
 for(const d of [.03,.08,.2])for(let n=0;n<=14;n++)for(let up=0;up<=n;up++){const pos=(.5+d)**up*(.5-d)**(n-up),neg=(.5-d)**up*(.5+d)**(n-up);near(hiddenCoinPosterior(d,2*up-n),pos/(pos+neg));}
 assert.equal(hiddenCoinPosterior(.2,10000),1);assert.equal(hiddenCoinPosterior(.2,-10000),0);assert.equal(hiddenCoinPosterior(.2,0),.5);
});
test('logarithmic Pareto moment quadrature agrees with independent transformed integration',()=>{
 // x=1/u: a ∫_0^1 u^(a-2) log(1+1/u) du; a=2,3,4 avoid singular endpoint by t transform u=v^8.
 for(const a of [2,3,4]){const got=paretoXLogMoment(a,simpson);const independent=a*simpson(v=>v===0?0:8*v**(8*(a-1)-1)*Math.log1p(v**-8),0,1,50000);near(got.estimate,independent,3e-9);assert.ok(got.remainder<1e-89);assert.ok(got.estimate<got.upper);}
 const low=paretoXLogMoment(1.2,simpson);assert.ok(low.estimate>30&&low.remainder<1e-14);
});
test('Doob inequalities hold by exact enumeration of finite walks',()=>{
 for(const n of [4,8,12])for(const kind of ['abs','sq','exp']){const rows=[];for(let bits=0;bits<2**n;bits++){let s=0,mx=kind==='exp'?1:0,x=mx;for(let k=1;k<=n;k++){s+=(bits>>(k-1))&1?1:-1;x=kind==='abs'?Math.abs(s):kind==='sq'?s*s:Math.exp(.1*s)/Math.cosh(.1)**k;mx=Math.max(mx,x);}rows.push([mx,x]);}
  for(const lam of [.5,1,2,4,8]){let a=0,b=0,c=0;for(const [mx,x]of rows){if(mx>=lam){a+=lam;b+=x;}c+=x;}assert.ok(a<=b+1e-9&&b<=c+1e-9);}
  for(const p of [1.05,2,5]){let a=0,b=0;for(const[mx,x]of rows){a+=mx**p;b+=x**p;}assert.ok(a<=(p/(p-1))**p*b*(1+1e-12));}
 }
});

test('predictable increasing process has exact conditional compensated-square identities',()=>{
 const n=8;
 for(const kind of ['const','poly','adapt','coin'])for(const coin of [.25,.75]){const paths=[];let ex2=0,ea=0;
  for(let bits=0;bits<2**n;bits++){let calls=0;const r=()=>calls++===0?coin:((bits>>(calls-2))&1)?.75:.25;const row=martPath(r,n,kind);paths.push(row);ex2+=row.X[n]**2/2**n;ea+=row.A[n]/2**n;for(let k=1;k<=n;k++)assert.ok(row.A[k]>=row.A[k-1]);}near(ex2,ea);
  for(let k=0;k<n;k++)for(let prefix=0;prefix<2**k;prefix++){let next=0,parent=null,count=0;for(let bits=0;bits<2**n;bits++)if((bits&((1<<k)-1))===prefix){const{X,A}=paths[bits];parent=X[k]**2-A[k];next+=X[k+1]**2-A[k+1];count++;}near(next/count,parent);}
 }
});
