import test from'node:test';import assert from'node:assert/strict';import * as B from'../content/behav/ch06.shared.js';
const value=B.rationalNumber;
test('editable integer lists enforce their full declared token and size domain',()=>{
 assert.deepEqual(B.integerList('0, 20,10,10',4,4,0,20),[0,20,10,10]);
 for(const text of['','1,2','1.5,2,3,4','1e1,2,3,4','-1,2,3,4','21,2,3,4','1,'.repeat(121)])assert.throws(()=>B.integerList(text,4,4,0,20));
});
test('inequity utility agrees with independent pairwise rational arithmetic and normalized n-player comparisons',()=>{
 for(let a=0;a<=12;a++)for(let b=0;b<=Math.min(a,3);b++)for(let x=0;x<=10;x++)for(let y=0;y<=10;y++){
  const p=B.preference(a,4,b,4),u=B.inequityUtility([x,y],0,p),expected=4*x-a*Math.max(y-x,0)-b*Math.max(x-y,0);assert.equal(u.num*4n,BigInt(expected)*u.den);
 }
 const p=B.preference(2,1,1,2),u=B.inequityUtility([3,5,1],0,p);assert.equal(value(u),.5);assert.equal(value(B.inequityUtility([3,5,1,5,1],0,p)),.5);assert.throws(()=>B.preference(1,4,2,4));assert.throws(()=>B.preference(2,1,1,1));
});
test('ultimatum acceptance uses exact utility signs at rational indifference rather than rounded thresholds',()=>{
 for(let a=0;a<=10;a++)for(let total=1;total<=60;total++)for(let offer=0;offer<=total;offer++){
  const p=B.preference(a,3,0,1),z=B.ultimatum(total,offer,p,p),expected=offer*2>=total||offer*3-a*(total-2*offer)>=0;assert.equal(z.accept,expected);assert.deepEqual(z.outcome,expected?[total-offer,offer]:[0,0]);
 }
 const p=B.preference(1,1),at=B.ultimatum(3,1,p,p);assert.equal(at.responderUtility.num,0n);assert.equal(at.accept,true);
});
test('proposer and dictator best-response sets retain genuine ties and do not invent intermediate-giving fits',()=>{
 const r=B.preference(1,1),self=B.preference(0,1),guilty=B.preference(1,1,3,4),half=B.preference(1,1,1,2);
 assert.deepEqual(B.proposerOffers(12,self,r).offers,[4]);assert.deepEqual(B.proposerOffers(12,guilty,r).offers,[6]);assert.deepEqual(B.proposerOffers(12,half,r).offers,[4,5,6]);
 assert.deepEqual(B.dictatorOffers(12,self).offers,[0]);assert.deepEqual(B.dictatorOffers(12,guilty).offers,[6]);assert.deepEqual(B.dictatorOffers(12,half).offers,[0,1,2,3,4,5,6]);
 for(const result of[B.proposerOffers(9,guilty,r),B.dictatorOffers(9,guilty)])assert.ok(result.offers.length>0);
});
test('public-goods accounting separates private returns, social returns and actually assigned punishment costs',()=>{
 const z=B.publicGoods([20,0,10,10],20,2,5,[[0,2,0,0],[0,0,0,0],[0,1,0,0],[0,0,0,0]]);assert.deepEqual(z.baseNumerators,[80n,180n,130n,130n]);assert.deepEqual(z.costs,[2n,0n,1n,0n]);assert.deepEqual(z.losses,[0n,9n,0n,0n]);assert.deepEqual(z.payoffNumerators,[70n,135n,125n,130n]);assert.equal(z.payoffNumerators.reduce((a,b)=>a+b,0n),460n);
 for(let n=2;n<=6;n++){const base=Array(n).fill(0),z0=B.publicGoods(base),z1=B.publicGoods([1,...base.slice(1)]);assert.equal(z1.payoffNumerators[0]-z0.payoffNumerators[0],-3n);assert.equal(z1.payoffNumerators.reduce((a,b)=>a+b,0n)-z0.payoffNumerators.reduce((a,b)=>a+b,0n),BigInt(2*n-5));}
});
test('trust-game transfers preserve actual endowments and created resources, including zero sending',()=>{
 for(let s=0;s<=10;s++)for(let r=0;r<=3*s;r++){const z=B.trustGame(s,r);assert.equal(z.payoffs[0]+z.payoffs[1],20+2*s);assert.equal(z.payoffs[0],10-s+r);assert.equal(z.payoffs[1],10+3*s-r);}assert.throws(()=>B.trustGame(0,1));
});
test('published punishment uses the nonlinear sender cost and capped fractional recipient loss',()=>{
 const P=[[0,10,0,0],[0,0,0,0],[0,5,0,0],[0,0,0,0]],z=B.fehrGachterLedger([20,0,10,10],P);
 assert.deepEqual(z.costs,[30n,0n,9n,0n]);assert.deepEqual(z.received,[0,15,0,0]);assert.deepEqual(z.effective,[0,10,0,0]);
 assert.deepEqual(z.payoffNumerators,[-700n,0n,850n,1300n]);assert.equal(z.den,50n);
 for(let points=0;points<=10;points++){
  const p=Array.from({length:4},()=>Array(4).fill(0));p[0][1]=points;const a=B.fehrGachterLedger([0,0,0,0],p);
  assert.equal(Number(a.payoffNumerators[1])/Number(a.den),20*(10-points)/10);
 }
});
test('level-k guesses are exact finite-depth beliefs and beauty targets include each actual guess',()=>{
 for(let k=0;k<=12;k++){const z=B.levelK(k);assert.equal(z.num*3n**BigInt(k),50n*2n**BigInt(k)*z.den);}
 const z=B.beautyContest([0,25,25]);assert.equal(value(z.target),100/9);assert.deepEqual(z.winners,[0]);assert.deepEqual(B.beautyContest([0,0,0]).winners,[0,1,2]);assert.throws(()=>B.levelK(1,1,1));
});
test('unique diagonal zero-sum logit equilibrium solves both actual responses with small residual',()=>{
 for(const a of[.5,1,2,5])for(const b of[.5,1,2,5])for(const lambda of[0,.01,.1,1,3,10,30,100]){const z=B.diagonalQRE(a,b,lambda),s=x=>1/(1+Math.exp(-x));assert.ok(z.p>=0&&z.p<=1&&z.q>=0&&z.q<=1);assert.ok(Math.abs(z.p-s(lambda*((a+b)*z.q-b)))<2e-11);assert.ok(Math.abs(z.q-s(lambda*(b-(a+b)*z.p)))<2e-11);assert.ok(z.residual<2e-11);if(lambda===0)assert.deepEqual([z.p,z.q],[.5,.5]);if(a===b)assert.ok(Math.abs(z.p-.5)<1e-14&&Math.abs(z.q-.5)<1e-14);}
 assert.ok(Math.abs(B.diagonalQRE(2,1,100).p-1/3)<.01);assert.throws(()=>B.diagonalQRE(0,1,1));
});

test('daycare raw counts reproduce exact four-week periods and expose the published one-decimal truncation',async()=>{
 const{daycareRows:rows,daycarePrintedPeriods:printed}=await import('../content/behav/ch06.data.js');assert.equal(rows.length,10);assert.deepEqual(rows.map(r=>r[1]),[37,35,35,34,33,28,35,34,34,32]);assert.equal(rows.filter(r=>r[2]).length,6);
 const avg=(a,lo,hi)=>a.slice(lo,hi).reduce((x,y)=>x+y,0)/(hi-lo);
 rows.forEach((r,j)=>{assert.equal(r[3].length,20);assert.equal(avg(r[3],0,4),printed[j][0]);assert.equal(avg(r[3],4,8),printed[j][1]);assert.equal(avg(r[3],16,20),printed[j][3]);assert.equal(Math.floor(avg(r[3],4,16)*10)/10,printed[j][2]);});
 const z=B.daycareSummary(rows),scaled=B.daycareSummary(rows,true);assert.equal(z.treated.centres,6);assert.equal(z.control.centres,4);assert.ok(z.duringDID>0&&z.postDID>0);
 for(let week=0;week<20;week++){assert.equal(z.treated.weekly[week]*6,rows.slice(0,6).reduce((n,r)=>n+r[3][week],0));assert.equal(scaled.control.weekly[week],rows.slice(6).reduce((n,r)=>n+r[3][week],0)/135);}
 const swapped=B.daycareSummary(rows.map(r=>[r[0],r[1],!r[2],r[3]]));assert.ok(Math.abs(swapped.duringDID+z.duringDID)<1e-14);assert.throws(()=>B.daycareSummary(rows.slice(1)));
});
test('original bargaining rows retain observed counterexamples rather than a manufactured threshold',async()=>{
 const D=await import('../content/behav/ch06.data.js');assert.equal(D.ultimatumFirstRows.length,21);assert.equal(D.ultimatumRepeatRows.length,21);
 assert.equal(D.ultimatumFirstRows.filter(r=>!r[2]).length,2);assert.equal(D.ultimatumRepeatRows.filter(r=>!r[2]).length,6);
 assert.deepEqual(D.ultimatumFirstRows[16],[600,480,0]);assert.deepEqual(D.ultimatumFirstRows[20],[400,400,1]);assert.deepEqual(D.ultimatumRepeatRows[17],[700,400,0]);
 for(const r of[...D.ultimatumFirstRows,...D.ultimatumRepeatRows])assert.ok(r[0]>=r[1]&&r[1]>=0&&[0,1].includes(r[2]));
 assert.equal(D.publicGoodsStrangerRows.length,3);assert.equal(D.publicGoodsPartnerRows.length,10);for(const r of[...D.publicGoodsStrangerRows,...D.publicGoodsPartnerRows])assert.ok(r.slice(1).every(x=>x>=0&&x<=20));
 assert.deepEqual(D.beautyFirstSummaries[1],[2,3,36.73,33]);
});
test('chapter identities and all future syllabus chapters remain preserved',async()=>{
 const crypto=await import('node:crypto'),syllabus=(await import('../content/behav/syllabus.js')).default,a=(await import('../content/behav/ch06.js')).default,b=(await import('../content/behav/ch06-b.js')).default;
 const items=[...a.items,...b.items],planned=syllabus.chapters.find(c=>c.n===6).items;assert.equal(items.length,9);
 assert.deepEqual(items.map(({num,kind,name})=>({num,kind,name})),planned.map(({num,kind,name})=>({num,kind,name})));
 // BEHAV7 now has researched references and captions. Restore only those two
 // metadata fields for the original whole-future-syllabus hash; every identity,
 // dependency, flag, chapter summary and later chapter remains in that hash.
 const fs=await import('node:fs'),before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-behav-syllabus-before.json',import.meta.url))),old7=before.chapters.find(c=>c.n===7);
 const historical=syllabus.chapters.map(c=>c.n!==7?c:{...c,items:c.items.map(i=>{const old=old7.items.find(x=>x.num===i.num);assert.ok(old);return{...i,refs:old.refs,pic:old.pic};})});
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(historical.filter(c=>c.n!==6))).digest('hex'),'5496a33e262855a59212bb01c8aa4dee147a6a832b65154033b73ea5b964fb7c');
 assert.equal(items.filter(i=>i.verify).map(i=>i.num).join(','),'6.5');
 assert.deepEqual(items.find(i=>i.num==='6.3').deps,['game-1.9']);assert.ok(items.find(i=>i.num==='6.7').deps.includes('pma-4.23'));
});
