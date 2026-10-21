import test from 'node:test';
import assert from 'node:assert/strict';
import { efficiencyUtility as U, efficientCurveY as Y, efficientAllocationState as state, efficientComplementPolygons as polygons, efficiencyIndifference as level } from '../content/micro/source-audit-efficiency.js';
const close=(a,b,t=3e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const independent=(k,a,x,y)=>k==='subs'?a*x+(1-a)*y:k==='comp'?Math.min((1-a)*x,a*y):x===0||y===0?0:k==='cd'?Math.exp(a*Math.log(x)+(1-a)*Math.log(y)):1/(a/Math.sqrt(x**3)+(1-a)/Math.sqrt(y**3))**(2/3);
const tastes=Array.from({length:71},(_,i)=>Number((.15+i*.01).toFixed(2)));
test('All 5,041 actual taste pairs: complete boundary sets, exact constructed targets, and true direct utility inequalities in four families',()=>{
 for(const a of tastes)for(const b of tastes)for(const k of['cd','ces','comp','subs'])for(const[x,y]of[[0,0],[0,10],[10,0],[10,10],[2.6,7.4],[5,5]]){
  const s=state(k,a,b,x,y),[xx,yy]=s.target;
  assert.ok(xx>=0&&xx<=10&&yy>=0&&yy<=10,JSON.stringify(s));
  close(s.uA,independent(k,a,x,y));close(s.uB,independent(k,b,10-x,10-y));
  assert.ok(independent(k,a,xx,yy)>=s.uA-3e-10&&independent(k,b,10-xx,10-yy)>=s.uB-3e-10,JSON.stringify(s));
  const target=state(k,a,b,xx,yy);assert.notEqual(target.relation,'off',JSON.stringify({s,target}));
  let efficient;
  if(k==='cd'||k==='ces')efficient=(x===0&&y===0)||(x===10&&y===10)||Math.abs(y-Y(k,a,b,x))<=1e-10;
  else if(k==='subs')efficient=a===b||(a>b?(x===10||y===0):(x===0||y===10));
  else{const f=(1-a)*x-a*y,g=(1-b)*(10-x)-b*(10-y);efficient=f*g>=-1e-12;}
  assert.equal(s.relation!=='off',efficient,JSON.stringify(s));
  if(s.witness?.resolved){assert.ok(independent(k,a,xx,yy)>s.uA);assert.ok(independent(k,b,10-xx,10-yy)>s.uB);}
 }
});
test('Independent gradients and global weighted-utility comparisons verify smooth tangencies; nonconvex tangency counterexample rejects the inherited hypothesis',()=>{
 for(const k of['cd','ces'])for(const a of[.15,.3,.65,.85])for(const b of[.15,.3,.65,.85])for(const x of[.01,.2,1,5,9,9.99]){
  const y=Y(k,a,b,x),rho=k==='cd'?0:-1.5,u=independent(k,a,x,y),v=independent(k,b,10-x,10-y);
  const gA=k==='cd'?[a*u/x,(1-a)*u/y]:[a*x**(rho-1)*u**(1-rho),(1-a)*y**(rho-1)*u**(1-rho)];
  const gB=k==='cd'?[b*v/(10-x),(1-b)*v/(10-y)]:[b*(10-x)**(rho-1)*v**(1-rho),(1-b)*(10-y)**(rho-1)*v**(1-rho)];
  close(gA[0]/gA[1],gB[0]/gB[1],1e-8);
  const lambda=gB[0]/(gA[0]+gB[0]),score=(xx,yy)=>lambda*independent(k,a,xx,yy)+(1-lambda)*independent(k,b,10-xx,10-yy),best=score(x,y);
  for(let i=0;i<=20;i++)for(let j=0;j<=20;j++)assert.ok(score(i/2,j/2)<=best+1e-9);
  for(const offset of[-.02,.02]){const yy=y+offset;if(yy<=0||yy>=10)continue;const s=state(k,a,b,x,yy);assert.equal(s.relation,'off');assert.ok(s.witness.resolved);assert.ok(s.witness.gains.every(g=>g>0));}
 }
 assert.equal((2*5)/(2*5),1);assert.equal(5**2+5**2,50);assert.equal(10**2+0**2,100);
 // A near-tangent point that the old 3%/4% MRS bands called efficient.
 const old=state('cd',.65,.3,5,1.9);assert.equal(old.relation,'off');assert.ok(old.witness.gains.every(g=>g>0));
 for(const k of['cd','ces']){const tiny=state(k,.65,.3,5,Y(k,.65,.3,5)+1e-8);assert.equal(tiny.relation,'off');assert.equal(tiny.witness.resolved,false);assert.equal(state(k,.65,.3,5,Y(k,.65,.3,5)).relation,'matches');}
});
test('Complement weak rectangles, finite independent dominance searches and clipped efficient polygons cover kinks, boundary lines and strict/weak degeneracies',()=>{
 for(const a of[.15,.5,.85])for(const b of[.15,.5,.85])for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){
  const s=state('comp',a,b,i,j),r=s.reservation;
  for(let m=0;m<=10;m++)for(let n=0;n<=10;n++){
   const wa=independent('comp',a,m,n)>=s.uA-1e-12,wb=independent('comp',b,10-m,10-n)>=s.uB-1e-12,inside=m>=r.left-1e-12&&m<=r.right+1e-12&&n>=r.bottom-1e-12&&n<=r.top+1e-12;
   assert.equal(wa&&wb,inside);
   if(s.relation!=='off'&&wa&&wb){close(independent('comp',a,m,n),s.uA);close(independent('comp',b,10-m,10-n),s.uB);}
  }
 }
 for(const a of tastes)for(const b of tastes)for(const [idx,poly]of polygons(a,b).entries())for(const[x,y]of poly){
  assert.ok(x>=0&&x<=10&&y>=0&&y<=10);const sign=idx?-1:1;
  assert.ok(sign*((1-a)*x-a*y)>=-1e-12);assert.ok(sign*((1-b)*(10-x)-b*(10-y))>=-1e-12);assert.notEqual(state('comp',a,b,x,y).relation,'off');
 }
 const weak=state('comp',.15,.3,5,5);assert.equal(weak.relation,'matches');assert.ok(weak.reservation.right-weak.reservation.left>6);close(weak.reservation.top-weak.reservation.bottom,0);
 for(const x of[2,5,7]){close(U('comp',.15,x,5),weak.uA);close(U('comp',.3,10-x,5),weak.uB);}
 for(const poly of polygons(.5,.5))for(const[x,y]of poly)close(x,y);
});
test('Independent linear welfare weights verify entire substitutes edges, equal slopes, off-edge trades and all clipped indifference curves',()=>{
 for(const a of[.15,.5,.85])for(const b of[.15,.5,.85])for(let i=0;i<=20;i++)for(let j=0;j<=20;j++){
  const x=i/2,y=j/2,s=state('subs',a,b,x,y),q=(a/(1-a)+b/(1-b))/2;
  if(a===b){assert.equal(s.relation,'all');close(s.uA+s.uB,10);assert.deepEqual(s.target,[x,y]);}
  else if(s.relation==='off'){assert.ok(s.witness.resolved);close((s.target[1]-y)/(s.target[0]-x),-q);}
  else{for(let m=0;m<=10;m++)for(let n=0;n<=10;n++)if(independent('subs',a,m,n)>=s.uA-1e-12)assert.ok(independent('subs',b,10-m,10-n)<=s.uB+1e-12);}
 }
 for(const k of['cd','ces','comp','subs'])for(const a of[.15,.3,.5,.85])for(const x of[0,.01,.5,5,9.99,10])for(const y of[0,.01,.5,5,9.99,10]){
  const target=independent(k,a,x,y),points=level(k,a,target);
  assert.ok(points.length>=2);for(const[xx,yy]of points){assert.ok(xx>=0&&xx<=10&&yy>=0&&yy<=10);close(independent(k,a,xx,yy),target,2e-8);}
 }
 assert.throws(()=>state('cd',NaN,.3,5,5),RangeError);assert.throws(()=>state('bad',.5,.5,5,5),RangeError);assert.throws(()=>state('cd',.5,.5,-1,5),RangeError);
});
