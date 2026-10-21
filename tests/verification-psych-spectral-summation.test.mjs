import test from 'node:test';import assert from 'node:assert/strict';
import {CIE_PHOTOPIC as P,CIE_SCOTOPIC as S,spectralPair,summationCuts,summationValue} from '../content/psych/source-audit-spectral-summation.js';
const near=(a,b,t=3e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
test('CIE source records preserve actual supports, positive samples, validation sums and all peak ties',()=>{
 for(const[d,n,lo,hi,sum]of[[P,471,360,830,106.8569171011719],[S,401,380,780,97.071316574]]){assert.equal(d.length,n);assert.equal(d[0][0],lo);assert.equal(d.at(-1)[0],hi);d.forEach(([x,y],i)=>{assert.equal(x,lo+i);assert.ok(Number.isFinite(y)&&y>0&&y<=1);});near(d.reduce((s,p)=>s+p[1],0),sum);}
 assert.deepEqual(P.filter(x=>x[1]===1).map(x=>x[0]),[555]);assert.deepEqual(S.filter(x=>x[1]===1).map(x=>x[0]),[506,507,508]);
 assert.deepEqual(P[0],[360,.000003917]);assert.deepEqual(P.at(-1),[830,.00000045181]);assert.deepEqual(S[0],[380,.000589]);assert.deepEqual(S.at(-1),[780,.000000139]);
});
test('all 160,801 admissible monochromatic pairs satisfy independently cross-multiplied balance, shares, exchange symmetry and finite tails',()=>{
 for(let a=380;a<=780;a++)for(let b=380;b<=780;b++){
  const q=spectralPair(a,b),pa=P[a-360][1],pb=P[b-360][1],ra=S[a-380][1],rb=S[b-380][1];
  // Eliminate the potentially large power ratio: normalize cross-products directly.
  const numerator=ra*pb,denominator=rb*pa,expected=numerator/(numerator+denominator);
  near(q.scotopic[0],expected);near(q.scotopic[1],1-expected);near(q.powerB*pb,pa);near(q.ratio, numerator/denominator);near(q.scotopic.reduce((x,y)=>x+y),1);
  for(const x of[q.powerB,q.ratio,...q.scotopic])assert.ok(Number.isFinite(x)&&x>0);
  near(q.ratio*spectralPair(b,a).ratio,1);if(a===b)assert.deepEqual(q.scotopic,[.5,.5]);
 }
 const q=spectralPair(450,650);assert.ok(q.ratio>100);assert.ok(q.scotopic[0]>.99);
});
test('separate authored cuts obey fixed-total-signal reciprocity, post-critical power scaling, continuity and exact log slopes over full reference grid',()=>{
 let n=0;for(let ia=0;ia<=36;ia++)for(let it=0;it<=27;it++)for(let ib=0;ib<=9;ib++){
  const a=.3+ia/10,t=.3+it/10,b=ib/10,p=summationCuts(Math.min(a,3.9),Math.min(t,3),b);n++;
  for(const q of[p.area,p.time]){
   assert.deepEqual(q.threshold.map(x=>x[0]),[0,q.c,q.end]);near(q.threshold[1][1],0);near(q.product[1][1],0);
   for(const z of[0,q.c/3,q.c,q.c+(q.end-q.c)/2,q.end]){
    const x=10**z,xc=10**q.c,h=10**summationValue(z,q.c,b),expected=x<=xc?xc/x:(xc/x)**b;
    near(h,expected);if(z<=q.c)near(h*x/xc,1);else near(h*x/xc,(x/xc)**(1-b));
   }
   const [l,k,r]=q.threshold;near((k[1]-l[1])/(k[0]-l[0]),-1);near((r[1]-k[1])/(r[0]-k[0]),-b);near(q.product[2][1]/(q.end-q.c),1-b);
   assert.ok(q.threshold.every(([,y])=>y>=-4.2&&y<=3.9));assert.ok(q.product.every(([,y])=>y>=0&&y<=3.9+1e-12));
   near(summationValue(q.c-1e-9,q.c,b),0,2e-9);near(summationValue(q.c+1e-9,q.c,b),0,2e-9);
  }
 }assert.equal(n,10360);
 for(const [a,t,b]of[[.423456789,2.123456789,.123456789],[3.899999999,.300000001,.899999999]]){const p=summationCuts(a,t,b);assert.equal(p.area.c,a);assert.equal(p.time.c,t);assert.equal(p.beta,b);}
});
test('model domains reject malformed values and retain exact closed endpoints',()=>{
 for(const bad of[NaN,Infinity,-Infinity,null,'450',[],{},379,781,450.5])assert.throws(()=>spectralPair(bad,450),RangeError);
 for(const bad of[NaN,Infinity,null,'1',[],{},.299999,3.900001])assert.throws(()=>summationCuts(bad),RangeError);
 for(const bad of[NaN,Infinity,null,'1',[],{},.29999,3.00001])assert.throws(()=>summationCuts(1,bad),RangeError);
 for(const bad of[NaN,Infinity,null,'0',[],{},-.00001,.900001])assert.throws(()=>summationCuts(1,1,bad),RangeError);
 for(const a of[.3,3.9])for(const t of[.3,3])for(const b of[0,.9]){const p=summationCuts(a,t,b);assert.equal(p.area.c,a);assert.equal(p.time.c,t);assert.equal(p.beta,b);}
});
