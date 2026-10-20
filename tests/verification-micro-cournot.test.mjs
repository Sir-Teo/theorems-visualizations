import test from 'node:test';import assert from 'node:assert/strict';
import {COURNOT_EQUILIBRIUM as E,cournotProfit as profit,cournotReply as reply,cournotProject as project,cournotTrace as trace,cournotMany as many,cournotState as state} from '../content/micro/source-audit-cournot.js';
const near=(a,b,t=5e-14)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function formula(start,s){if(!s)return [...start];const m=Math.floor(s/2),d=(start[1]-1/3)/4**m;return s%2?[1/3-d/2,1/3+d]:[1/3-2*d,1/3+d];}
test('Global own-output maximization, exact improvement identity and boundary alternatives independently verify the quadratic game and distinguish a price-floor game',()=>{
 for(let ir=0;ir<=300;ir++){const r=ir/100,b=reply(r);near(b,Math.max(0,(1-r)/2));assert.ok(b>=0);for(let iq=0;iq<=400;iq++){const q=iq/100,p=q*(1-q-r);near(profit(q,r),p);assert.ok(p<=profit(b,r)+1e-13);if(r<=1)near(profit(b,r)-p,(q-b)**2);else near(profit(b,r)-p,q*(q+r-1));}}
 for(let i=1;i<100;i++){const q=i/100,r=1-q;near(profit(q,r),0);near(profit(q/2,r),q*q/4);assert.ok(profit(q/2,r)>profit(q,r));}
 const floor=(q,r)=>q*Math.max(1-q-r,0);for(let iq=0;iq<=400;iq++)assert.equal(floor(iq/100,1),0);assert.equal(profit(1,1),-1);assert.equal(profit(0,1),0);assert.equal(reply(1),0);assert.equal(reply(3),0);assert.throws(()=>reply(-1),RangeError);assert.throws(()=>profit(-1,0),RangeError);
});
test('All5151 offered hundredth-grid triangle starts retain initial plus all18 replies, equal independent closed forms and satisfy the global two-reply contraction including every boundary and exact fixed point',()=>{
 let count=0;for(let i=0;i<=100;i++)for(let j=0;j<=100-i;j++){const start=[i/100,j/100],p=trace(start);count++;assert.equal(p.length,19);assert.deepEqual(p[0],start);for(let s=0;s<=18;s++){const expected=formula(start,s);p[s].forEach((v,g)=>near(v,expected[g]));assert.ok(p[s].every(x=>x>=0&&x<=1));assert.ok(p[s][0]+p[s][1]<=1+1e-15);if(s){const changed=(s-1)%2,other=1-changed;assert.equal(p[s][other],p[s-1][other]);near(p[s][changed],Math.max(0,(1-p[s][other])/2));assert.ok(profit(p[s][changed],p[s][other])>=profit(p[s-1][changed],p[s][other])-1e-14);}if(s>=2&&s%2===0)near(p[s][1]-1/3,(p[s-2][1]-1/3)/4);}}
 assert.equal(count,5151);assert.deepEqual(trace([E,E]),Array.from({length:19},()=>[E,E]));for(const start of[[0,0],[1,0],[0,1],[.5,.5],[E,E]])for(let s=0;s<=18;s++){const p=state(start,s,30);assert.deepEqual(p.point,p.path[s]);near(p.price,1-p.point[0]-p.point[1]);p.profits.forEach((v,g)=>near(v,p.point[g]*(1-p.point[0]-p.point[1])));}
 assert.equal(trace([0,0],0).length,1);for(const x of[[1,1],[-1,0],[NaN,0]])assert.throws(()=>trace(x),RangeError);assert.throws(()=>trace([0,0],-.1),RangeError);assert.throws(()=>state([0,0],19,2),RangeError);
});
test('Projection KKT inequalities on all triangle vertices certify closest feasible starts, including edges, corners and large exterior coordinates',()=>{
 const vertices=[[0,0],[1,0],[0,1]];for(let i=-30;i<=30;i++)for(let j=-30;j<=30;j++){const raw=[i/10,j/10],p=project(...raw);assert.ok(p.every(x=>x>=0&&x<=1));assert.ok(p[0]+p[1]<=1+1e-15);for(const z of vertices)assert.ok((z[0]-p[0])*(raw[0]-p[0])+(z[1]-p[1])*(raw[1]-p[1])<=1e-12,JSON.stringify({raw,p,z}));}
 for(let i=0;i<=100;i++)for(let j=0;j<=100-i;j++)assert.deepEqual(project(i/100,j/100),[i/100,j/100]);for(const p of vertices)assert.deepEqual(project(...p),p);assert.deepEqual(project(1,1),[.5,.5]);assert.deepEqual(project(-10,20),[0,1]);assert.deepEqual(project(20,-10),[1,0]);assert.throws(()=>project(Infinity,0),RangeError);
});
test('All30 discrete static equilibria satisfy independent FOCs and global deviations, monopoly/coincident outcomes and the competitive limit; they imply no n-firm dynamics',()=>{
 let prev={price:1,total:0};for(let n=1;n<=30;n++){const p=many(n);near(p.q,1/(n+1));near(n*p.q,p.total);near(1-p.total,p.price);near(p.firmProfit,p.q**2);near(1-(n-1)*p.q-2*p.q,0);assert.ok(p.price<prev.price&&p.total>prev.total);for(let j=0;j<=1000;j++){const deviation=j/500;assert.ok(deviation*(1-deviation-(n-1)*p.q)<=p.firmProfit+1e-13);}prev=p;}
 assert.equal(many(1).price,.5);assert.equal(many(1).total,.5);assert.equal(many(30).q,1/31);for(const n of[100,1000,1e6]){assert.ok(many(n).price<1/n);near(1-many(n).total,many(n).price);}
 for(const n of[0,-1,1.5,Infinity,NaN])assert.throws(()=>many(n),RangeError);
});
