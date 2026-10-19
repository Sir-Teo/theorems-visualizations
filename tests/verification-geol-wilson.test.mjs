import test from'node:test';import assert from'node:assert/strict';import{wilsonEvents,wilsonState,wilsonTrajectory,wilsonFloorAge}from'../content/geol/wilson-audit.shared.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e*(1+Math.abs(b)),`${a} != ${b}`);
test('exact ridge/collision event roots and continuity agree with independently eliminated flank equations',()=>{
 for(const u of[10,40,120])for(const c of[10,30,50,150])for(const ts of[50,155,400]){const p={u,c,ts},e=wilsonEvents(p);if(c<=u/2){assert.equal(e.ridgeTime,Infinity);assert.equal(e.collisionTime,Infinity);continue;}
 near(u*ts/2+(u/2-c)*(e.ridgeTime-ts),0);near(u*e.ridgeTime/2-c*(e.collisionTime-e.ridgeTime),0);near(e.collisionTime,ts*(2*c+u)/(2*c-u));
 for(const t of[ts,e.ridgeTime,e.collisionTime]){const a=wilsonState(p,t-1e-7),b=wilsonState(p,t+1e-7);near(a.a,b.a,1e-4);near(a.b,b.b,1e-4);assert.ok(b.w>=0);}assert.ok(wilsonState(p,e.collisionTime).col);}
});
test('piecewise width slopes, monotone flank behavior and source/sink budget hold across1296 sampled states',()=>{
 for(const u of[10,40,120])for(const c of[10,30,100,150])for(const ts of[50,150,400]){const p={u,c,ts},e=wilsonEvents(p);for(let t=.3;t<501;t+=14){if([ts,e.ridgeTime,e.collisionTime].some(x=>Math.abs(t-x)<.01))continue;const S=wilsonState(p,t),a=wilsonState(p,t-1e-4),b=wilsonState(p,t+1e-4);near((b.w-a.w)/2e-4,S.dwdt,1e-6);assert.ok(S.a>=0&&S.b>=0);near(S.w,S.a+S.b);if(!S.col){const production=S.ridge?u:0,consumption=t>=ts?c:0;near(S.w,u*Math.min(t,e.ridgeTime)-consumption*Math.max(0,t-ts),1e-8);if(!S.ridge)near(S.w,u*e.ridgeTime-c*(t-ts),1e-8);}}}
});
test('continued widening with active subduction can end in ridge consumption and collision',()=>{
 const p={u:100,c:75,ts:50},e=wilsonEvents(p);near(e.ridgeTime,150);near(e.collisionTime,250);assert.match(wilsonState(p,100).stage,/still widening/);near(wilsonState(p,100).dwdt,25);near(wilsonState(p,200).dwdt,-75);assert.ok(wilsonState(p,250).col);
 const equal={u:100,c:100,ts:50};near(wilsonState(equal,75).w,5000);assert.match(wilsonState(equal,75).stage,/constant width/);
});
test('trajectory includes exact noninteger events, peak and full large-width extrema',()=>{
 for(let mask=0;mask<8;mask++){const p={u:mask&1?120:10,c:mask&2?150:10,ts:mask&4?400:50},T=wilsonTrajectory(p);for(const t of[p.ts,T.ridgeTime,T.collisionTime])if(Number.isFinite(t)&&t<=500)assert.ok(T.rows.some(q=>q.t===t));for(let i=0;i<=10000;i++)assert.ok(wilsonState(p,i/20).w<=T.peak.w+1e-7);}
 const T=wilsonTrajectory({u:120,c:10,ts:50});assert.ok(T.peak.w>50000);
});
test('surviving seafloor ages follow independent birth-time transport; oldest does not decrease after ridge loss',()=>{
 const p={u:40,c:50,ts:150};for(const t of[10,149,160,260,300]){const S=wilsonState(p,t);for(const f of[0,.25,.5,1]){const west=wilsonFloorAge(S,p.u,'west',f);near(west,t-(2*S.a*f/p.u));assert.ok(west>=0&&west<=t+1e-8);if(S.b>0)near(wilsonFloorAge(S,p.u,'east',f),2*S.b*f/p.u);}near(S.oldest,t);}assert.equal(wilsonState(p,500).oldest,null);
});
