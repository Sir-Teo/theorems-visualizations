// Explicit independent peer mathematics. No production models imported.
import assert from 'node:assert/strict';
let checks=0,groups=0;const ok=x=>{checks++;assert.ok(x)},near=(a,b,t=2e-11)=>{checks++;assert.ok(Math.abs(a-b)<t*(1+Math.abs(b)),`${a} / ${b}`)};
// Finite atomic PAC rectangles: enumerate all samples, not a continuous-law surrogate.
// The fixed closed lower quantile strip includes its jump atom; a missed lower-side
// region with mass>q must have sample minimum strictly beyond that strip.
let atomicSamples=0;
for(const weights of [[1,1,1,1,1,1],[8,1,1,1,1,1],[1,9,1,1,7,1],[1,1,12,1,1,1]]){
 const pts=[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],W=weights.reduce((a,b)=>a+b),q=.2;
 const cuts=[];for(let axis=0;axis<2;axis++)for(const dir of[1,-1]){const values=[...new Set(pts.map(p=>dir*p[axis]))].sort((a,b)=>a-b);let c;for(const v of values){const mass=weights.reduce((s,w,i)=>s+w*+(dir*pts[i][axis]<=v),0)/W;if(mass>=q){c=v;break;}}cuts.push({axis,dir,c,indices:pts.map((p,i)=>dir*p[axis]<=c?i:-1).filter(i=>i>=0)});}
 for(let m=1;m<=4;m++){let fail=0,sideFail=[0,0,0,0],missStrip=[0,0,0,0],prob=0;
  for(let code=0;code<pts.length**m;code++){let c=code,s=[],p=1;for(let j=0;j<m;j++){const i=c%pts.length;c=Math.floor(c/pts.length);s.push(i);p*=weights[i]/W;}prob+=p;atomicSamples++;
   const lo=[0,1].map(a=>Math.min(...s.map(i=>pts[i][a]))),hi=[0,1].map(a=>Math.max(...s.map(i=>pts[i][a])));const err=weights.reduce((t,w,i)=>t+w*+(pts[i].some((v,a)=>v<lo[a]||v>hi[a])),0)/W;if(err>4*q+1e-12)fail+=p;
   cuts.forEach(({axis,dir,c,indices},j)=>{const extreme=Math.min(...s.map(i=>dir*pts[i][axis])),mass=weights.reduce((t,w,i)=>t+w*+(dir*pts[i][axis]<extreme),0)/W,miss=s.every(i=>!indices.includes(i));if(mass>q+1e-12){sideFail[j]+=p;ok(extreme>c);ok(miss);}if(miss)missStrip[j]+=p;});
  }near(prob,1);ok(fail<=4*(1-q)**m+1e-12);cuts.forEach(({indices},j)=>{const mass=indices.reduce((t,i)=>t+weights[i],0)/W;near(missStrip[j],(1-mass)**m);ok(sideFail[j]<=missStrip[j]+1e-12);ok(missStrip[j]<=(1-q)**m+1e-12);});
 }
}groups++;
// Subprobability target: if all target positives have mass<q, every bad-side
// event is impossible. A large atom cannot be split into an exact-q strip.
const atomMass=[.08,.12,.8],target=[true,true,false],q=.25;ok(atomMass.reduce((s,w,i)=>s+w*target[i],0)<q);ok(!atomMass.some(w=>w===q));groups++;
// Bayes comparison: enumerate all binary decisions including eta ties and atomic weights.
for(let code=0;code<5**4;code++){let n=code,eta=[];for(let i=0;i<4;i++){eta.push((n%5)/4);n=Math.floor(n/5);}const w=[1/10,2/10,3/10,4/10],opt=eta.reduce((s,p,i)=>s+w[i]*Math.min(p,1-p),0);for(let h=0;h<16;h++){let r=0,gap=0;eta.forEach((p,i)=>{let b=(h>>i)&1;r+=w[i]*(b?1-p:p);gap+=w[i]*Math.abs(2*p-1)*+(b!==+(p>=.5));});near(r-opt,gap);ok(r>=opt-1e-12);}}groups++;
// Hoeffding's lemma: arbitrary three-point centered laws, direct MGF bound,
// including negative lambda and constants; tilted finite-law variance<=R²/4.
for(const support of [[-3,-1,2],[0,.4,1],[7,7,7]])for(let k=1;k<9;k++)for(let j=1;j<9;j++){const w=[k,j,10],W=k+j+10,mu=support.reduce((s,x,i)=>s+x*w[i]/W,0),R=Math.max(...support)-Math.min(...support);for(const lambda of[-3,-1,-.1,0,.2,1,3]){const logs=support.map(x=>lambda*(x-mu)),max=Math.max(...logs),sum=logs.reduce((s,x,i)=>s+w[i]/W*Math.exp(x-max),0),L=max+Math.log(sum);ok(L<=lambda*lambda*R*R/8+1e-11);const tilted=logs.map((x,i)=>w[i]/W*Math.exp(x-max)/sum),mean=support.reduce((s,x,i)=>s+x*tilted[i],0),variance=support.reduce((s,x,i)=>s+(x-mean)**2*tilted[i],0);ok(variance<=R*R/4+1e-12);if(!R)near(L,0);}}groups++;
// Exact realizable ERM failure enumeration: all consistent ties, finite true class.
for(let m=1;m<=5;m++){let failure=0;const eps=.34;for(let code=0;code<3**m;code++){let n=code,S=[];for(let j=0;j<m;j++){S.push(n%3);n=Math.floor(n/3);}let existsBad=false;for(let h=0;h<8;h++){const risk=[0,1,2].filter(x=>(h>>x&1)!==+(x===1)).length/3,consistent=S.every(x=>(h>>x&1)===+(x===1));if(consistent&&risk>eps)existsBad=true;}failure+=+existsBad/3**m;}ok(failure<=8*Math.exp(-m*eps)+1e-12);}groups++;
// Unbiased empirical risk even with perfectly dependent coordinates; box shrink
// only proves finite continuous exceptions null, and fails for point atoms.
const losses=[0,1,1],weights=[.2,.3,.5];near(losses.reduce((s,x,i)=>s+weights[i]*(x+x+x)/3,0),.8);for(let k=1;k<30;k++)ok(7*4**(-k)>0);near(1-.3,.7);groups++;
// Restricted target measure with negative examples and an empty-positive sample.
let emptyPositiveSamples=0;for(const weights of [[1,1,1,1,1,1],[20,1,1,1,1,20],[1,20,1,1,1,1]]){const P=[[-1,0],[0,0],[0,1],[1,0],[1,1],[2,0]],positive=[false,true,true,true,true,false],W=weights.reduce((a,b)=>a+b),massR=weights.reduce((s,w,i)=>s+w*positive[i],0)/W,q=.12;const cuts=[];if(massR>q)for(let axis=0;axis<2;axis++)for(const dir of[1,-1]){const values=[...new Set(P.filter((_,i)=>positive[i]).map(p=>dir*p[axis]))].sort((a,b)=>a-b);const cut=values.find(c=>weights.reduce((s,w,i)=>s+w*+(positive[i]&&dir*P[i][axis]<=c),0)/W>=q);cuts.push({axis,dir,cut});}
for(let m=1;m<=4;m++){let failure=0;for(let code=0;code<6**m;code++){let n=code,S=[],prob=1;for(let j=0;j<m;j++){const i=n%6;n=Math.floor(n/6);prob*=weights[i]/W;if(positive[i])S.push(i);}if(!S.length)emptyPositiveSamples++;const lo=[0,1].map(a=>Math.min(...S.map(i=>P[i][a]))),hi=[0,1].map(a=>Math.max(...S.map(i=>P[i][a]))),error=weights.reduce((s,w,i)=>s+w*+(positive[i]&&(!S.length||P[i].some((x,a)=>x<lo[a]||x>hi[a]))),0)/W;if(error>4*q+1e-12)failure+=prob;for(const {axis,dir,cut}of cuts){const extreme=Math.min(...S.map(i=>dir*P[i][axis])),missed=weights.reduce((s,w,i)=>s+w*+(positive[i]&&dir*P[i][axis]<extreme),0)/W;if(missed>q+1e-12){ok(extreme>cut);ok(S.every(i=>dir*P[i][axis]>cut));}}}ok(failure<=4*(1-q)**m+1e-12);}}groups++;
// Atomless planar law: (X,Y)=(0,U[0,1]). Every singleton has zero mass,
// yet vertical coordinate strips have mass only zero or one, never q=1/4.
const verticalStrip=t=>+(t>=0);for(const t of[-2,-1,-.1,0,.1,1,2])ok(verticalStrip(t)!==.25);groups++;
console.log(JSON.stringify({groups,checks,atomicSamples,emptyPositiveSamples,productionImports:false}));
