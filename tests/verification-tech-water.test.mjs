import test from'node:test';import assert from'node:assert/strict';import{mortarCell,mortar,clockHead,clockTime,waterClock,aqueduct,AQUEDUCT}from'../content/tech/source-audit-water.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('conversion conserves remaining fraction, stays bounded, and uses exactly the drawn sixty cells',()=>{
 for(const e of['dry','damp','sea'])for(const age of[.005,.123456789,.5,2000])for(const ratio of[0,.123456789,2.5,5]){const p=mortar(e,age,ratio);let s=0,z=0;for(let i=0;i<60;i++){const d=Math.min((i+.5)*.01,.6-(i+.5)*.01),capacity=Math.min(1,ratio/2.5),h=capacity*(1-Math.exp(-age*({dry:.12,damp:1,sea:1}[e])/.3)),front=({dry:1,damp:.35,sea:0}[e])*.02*Math.sqrt(age),b=front?1/(1+Math.exp((d-front)/Math.max(.004,.08*front))):0,ref=1-(1-h)*(1-b);near(ref,p.mixed[i]);assert.ok(p.mixed[i]>=0&&p.mixed[i]<=1);assert.ok(p.mixed[i]>=p.plain[i]-1e-14);s+=ref;z+=p.plain[i];}near(p.meanMixed,s/60);near(p.meanPlain,z/60);if(!ratio)p.plain.forEach((x,i)=>near(x,p.mixed[i]));if(e==='sea')p.plain.forEach(x=>assert.equal(x,0));for(const curve of p.curves){assert.equal(curve.length,201);for(let i=1;i<curve.length;i++)assert.ok(curve[i][1]>=curve[i-1][1]-1e-13);}}
});
function simpson(f,a,b,N=2000){const h=(b-a)/N;let s=f(a)+f(b);for(let i=1;i<N;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
test('exact outflow inverts the separately integrated travel-time law across the full exponent family',()=>{
 for(const p of[0,.123456789,.25,.250000000000001,.75,1])for(const tau of[0,.0000001,.123456789,.5,.9999999,1]){const h=clockHead(tau,p),f=x=>x**(2*p-.5),ref=simpson(f,h,1)/simpson(f,.15,1);near(ref,tau,2e-11);near(clockTime(h,p),tau);assert.ok(h>=.15&&h<=1);if(p===.25)near((1-h)/.85,tau);}
});
test('clock display error includes complete samples, independent current state and a distinct constant-area receiver',()=>{
 for(const p of[0,.25,.123456789,1])for(const t of[0,.123456789,12])for(const constant of[false,true]){const a=waterClock(p,t,constant);assert.equal(a.curve.length,241);near(a.error,constant?0:60*(12*(1-a.head)/.85-t));if(constant){assert.equal(a.head,1);assert.equal(a.linearHours,t);assert.equal(a.tau,t/12);assert.ok(a.curve.every(x=>x[1]===0));}let max=0;for(const[x,y]of a.curve){max=Math.max(max,Math.abs(y));assert.ok(y>=a.range[0]&&y<=a.range[1]);if(p===.25)near(y,0);}near(Math.abs(a.worst[1]),max);if(!constant&&p===1)assert.ok(max>120,'old fixed plot clipped the cone error');}
});
test('complete pipe polyline, Darcy capacity and cumulative grade satisfy independently accumulated head balance',()=>{
 for(const gradient of[.1,.8123456789,2])for(const depth of[20,110])for(const diameter of[.1,.4])for(const pipes of[1,9])for(const wall of[.01,.1]){const p=aqueduct(gradient,depth,600,diameter,pipes,wall,'siphon');let length=0;const ls=[0];for(let i=1;i<p.pipe.length;i++){const a=p.pipe[i-1],b=p.pipe[i];length+=Math.sqrt((1000*(b[0]-a[0]))**2+(b[1]-a[1])**2);ls.push(length);}near(p.length,length);assert.ok(length>=7000);assert.ok(p.pipe[1][0]===p.pipe[0][0]&&p.pipe.at(-2)[0]===p.pipe.at(-1)[0]);const v=(p.capacity/1000/pipes)/(Math.PI*diameter*diameter/4),hf=.02*length/diameter*v*v/(2*9.81);near(hf,7*gradient);for(let i=0;i<p.pipe.length;i++){near(p.grade[i][1],p.headIn-hf*ls[i]/length);near(p.pressure[i][1],p.grade[i][1]-p.pipe[i][1]);assert.ok(p.pressure[i][1]>=0);assert.ok(p.pipe[i][1]>p.y[0]&&p.pipe[i][1]<p.y[1]);}near(p.nominalStress,1000*9.81*Math.max(...p.pressure.map(x=>x[1]))/wall);near(p.arrival,300-30*gradient);}
});
test('demand cannot move fixed tanks or gravity capacity; parallel pipes and wall ratios have the specified scaling',()=>{
 for(const gradient of[.1,2])for(const depth of[20,110]){const a=aqueduct(gradient,depth,20,.3,1,.01),b=aqueduct(gradient,depth,600,.3,9,.1);near(b.capacity,9*a.capacity);near(a.nominalStress,10*b.nominalStress);assert.deepEqual(a.pipe,b.pipe);near(a.headOut,b.headOut);near(a.arrival,b.arrival);near(a.requestedLoss/b.requestedLoss,(20*9/600)**2);assert.equal(a.demandSupported,a.demand<=a.capacity);assert.equal(b.cityHighEnough,gradient<=32/30);}
 const a=aqueduct(.1,110,600,.1,1);assert.equal(a.demandSupported,false);assert.ok(a.requestedLoss>1000);assert.ok(a.headOut>290,'unsupported demand must not move the outlet below the route');
});
test('declared finite controls reject unsupported and nonfinite states',()=>{
 for(const a of[['bad'],['sea',0],['sea',1,-1]])assert.throws(()=>mortar(...a),RangeError);
 for(const a of[[-1],[1.1],[.5,13],[.5,2,'true']])assert.throws(()=>waterClock(...a),RangeError);
 for(const a of[[0],[.1,0],[.1,20,0],[.1,20,20,.01],[.1,20,20,.1,1.5],[.1,20,20,.1,1,1]])assert.throws(()=>aqueduct(...a),RangeError);
});
