import test from 'node:test';import assert from 'node:assert/strict';
import {luceMenu,luceAudit,luceState} from '../content/psych/source-audit-luce.js';
const near=(a,b,t=3e-13)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const present=m=>[0,1,2,3].filter(i=>m&(1<<i));
function direct(w,m,grouped=false){if(!m)return null;const p=[0,0,0,0];if(!grouped){const sum=present(m).reduce((s,i)=>s+w[i],0);present(m).forEach(i=>p[i]=w[i]/sum);return p;}const groups=[[0],[1,2],[3]].map(g=>g.filter(i=>m&(1<<i))).filter(g=>g.length),tot=groups.reduce((s,g)=>s+Math.max(...g.map(i=>w[i])),0);for(const g of groups){const value=Math.max(...g.map(i=>w[i])),sum=g.reduce((s,i)=>s+w[i],0);g.forEach(i=>p[i]=value/tot*w[i]/sum);}return p;}
test('The256-point strength grid and all menus retain finite positive distributions; empty menus are outside the theorem',()=>{
 for(const a of[.3,1,3,10])for(const b of[.3,1,3,10])for(const c of[.3,1,3,10])for(const d of[.3,1,3,10])for(const grouped of[false,true]){
  const w=[a,b,c,d];assert.equal(luceMenu(w,0,grouped),null);for(let m=1;m<16;m++){const p=luceMenu(w,m,grouped),expected=direct(w,m,grouped);near(p.reduce((s,x)=>s+x,0),1);for(let i=0;i<4;i++){near(p[i],expected[i]);if(m&(1<<i))assert.ok(p[i]>0&&p[i]<=1);else assert.equal(p[i],0);}if(present(m).length===1)assert.equal(p[present(m)[0]],1);}
 }
});
test('Independent subset enumeration verifies all54 IIA comparisons and full-menu identification; scale invariance and the logistic and product forms hold',()=>{
 const w=[3,7,11,17],a=luceAudit(w),pairs=[];for(let S=1;S<16;S++)for(let T=1;T<16;T++)if((S&T)===S)for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if((S&(1<<i))&&(S&(1<<j)))pairs.push([S,T,i,j]);assert.equal(pairs.length,54);assert.deepEqual(a.comparisons.map(x=>[x.small,x.large,x.i,x.j]),pairs);assert.equal(a.menus.length,15);
 for(const[S,T,i,j]of pairs){const ps=luceMenu(w,S),pt=luceMenu(w,T);near(ps[i]/ps[j],w[i]/w[j]);near(ps[i]*pt[j],ps[j]*pt[i]);}near(a.maxResidual,0);near(a.reconstructionMax,0);
 const full=luceMenu(w,15);for(let m=1;m<16;m++){const p=luceMenu(w,m),inferred=luceMenu(full,m);for(const scale of[1e-100,.01,7,1e100]){const q=luceMenu(w.map(x=>x*scale),m);for(let i=0;i<4;i++){near(q[i],p[i]);near(inferred[i],p[i]);}}}
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(i!==j){const p=luceMenu(w,(1<<i)|(1<<j));near(p[i],1/(1+Math.exp(Math.log(w[j])-Math.log(w[i]))));}
 const odds=(i,j)=>w[i]/w[j];near(odds(0,1)*odds(1,2)*odds(2,0),1);
 // Pairwise positivity alone is insufficient: an independently specified cycle
 // with P(A>B)=P(B>C)=P(C>A)=3/4 has odds-product27, not1.
 assert.equal((.75/.25)**3,27);
 // One A/B comparison can pass while other menu comparisons fail.
 const family=Object.fromEntries(a.menus.map(({mask,p})=>[mask,[...p]]));family[7]=[.15,.35,.5,0];near(family[3][0]/family[3][1],family[7][0]/family[7][1]);assert.notEqual(family[5][0]/family[5][2],family[7][0]/family[7][2]);
});
test('The authored exact-copy family supplies a genuine nested-menu violation, holds other offers fixed and cannot be reconstructed from full-menu weights',()=>{
 for(const A of[.3,1,10])for(const B of[.3,1,10])for(const D of[.3,1,10]){
  const w=[A,B,B,D],ab=luceMenu(w,3,true),abc=luceMenu(w,7,true),abd=luceMenu(w,11,true),abcd=luceMenu(w,15,true);near(abc[0],A/(A+B));near(abc[1],B/(2*(A+B)));near(abc[2],abc[1]);near(abc[0],ab[0]);near(abc[1],ab[1]/2);near((abc[0]/abc[1])/(ab[0]/ab[1]),2);near(abcd[0],abd[0]);near(abcd[3],abd[3]);near(abcd[1],abd[1]/2);const audit=luceAudit(w,true);assert.ok(audit.maxResidual>0&&audit.reconstructionMax>0);
 }
 assert.deepEqual(luceMenu([1,1,1,1],7,true),[.5,.25,.25,0]);const p=luceMenu([1,1,1,1],7);p.slice(0,3).forEach(x=>near(x,1/3));assert.equal(p[3],0);
 const input=[4,3,9,1],s=luceState(input,15,'copies',true);assert.deepEqual(input,[4,3,9,1]);assert.deepEqual(s.weights,[4,3,3,1]);assert.equal(s.withoutMask,11);near(s.p[0],s.without[0]);assert.equal(s.grouped,true);const unlocked=luceState(input,15,'copies',false);assert.deepEqual(unlocked.p,luceMenu(input,15));assert.equal(unlocked.grouped,false);assert.equal(luceState(input,4,'luce',false).without,null);assert.equal(luceState(input,0,'luce',false).p,null);
});
test('Every native strength endpoint corner and menu agrees with a separate direct group sum; disabled clone strength cannot silently affect the family',()=>{
 for(let corner=0;corner<16;corner++)for(const copy of[false,true])for(const model of['luce','copies'])for(let menu=0;menu<16;menu++){
  const w=Array.from({length:4},(_,i)=>corner&(1<<i)?10:.3),state=luceState(w,menu,model,copy),locked=[...w];if(copy)locked[2]=locked[1];const expected=direct(locked,menu,model==='copies'&&copy);assert.equal(state.audit.comparisons.length,54);if(menu===0)assert.equal(state.p,null);else state.p.forEach((x,i)=>near(x,expected[i]));if(!state.grouped)near(state.audit.maxResidual,0);
 }
 for(const bad of[[0,1,1,1],[-1,1,1,1],[NaN,1,1,1],[Infinity,1,1,1],[1,1,1]])assert.throws(()=>luceMenu(bad,7),RangeError);for(const m of[-1,.5,16,NaN])assert.throws(()=>luceMenu([1,1,1,1],m),RangeError);assert.throws(()=>luceState([1,1,1,1],3,'unread-model',false),RangeError);
});

test('The multiplicative event axiom follows for every nested nonempty event/menu pair and can fail in the authored family',()=>{
 const w=[3,7,11,17];let checks=0;for(let R=1;R<16;R++)for(let S=1;S<16;S++)if((R&S)===R)for(let T=1;T<16;T++)if((S&T)===S){
  const ps=luceMenu(w,S),pt=luceMenu(w,T),event=(p,m)=>present(m).reduce((z,i)=>z+p[i],0);near(event(pt,R),event(ps,R)*event(pt,S));
  checks++;
 }assert.equal(checks,175);const ab=luceMenu([1,1,1,1],3,true),abc=luceMenu([1,1,1,1],7,true);assert.notEqual(abc[0],ab[0]*(abc[0]+abc[1]));
});
