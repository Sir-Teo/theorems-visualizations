import test from 'node:test';import assert from 'node:assert/strict';
import {coreCurveY,coreInterval,coreAllocationState,dominantFirmState}from'../content/micro/source-audit-core-fringe.js';
const close=(a,b,t=2e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`),U=(a,x,y)=>x<=0||y<=0?0:Math.exp(a*Math.log(x)+(1-a)*Math.log(y));
test('All 5,041 offered taste pairs at every endowment corner have true core endpoints and marginal/individual-rationality identities',()=>{
 for(let ia=0;ia<=70;ia++)for(let ib=0;ib<=70;ib++)for(const wx of[.3,9.7])for(const wy of[.3,9.7]){
  const a=.15+ia*.01,b=.15+ib*.01,c=coreInterval(a,b,wx,wy);assert.ok(c.lower<=c.upper+1e-11);assert.ok(c.lower>0&&c.upper<10);
  close(U(a,...c.lowPoint),U(a,wx,wy));close(U(b,10-c.highPoint[0],10-c.highPoint[1]),U(b,10-wx,10-wy));
  assert.ok(U(b,10-c.lowPoint[0],10-c.lowPoint[1])>=U(b,10-wx,10-wy)-1e-9);assert.ok(U(a,...c.highPoint)>=U(a,wx,wy)-1e-9);
  for(const[x,y]of[c.lowPoint,c.highPoint])close(a/(1-a)*y/x,b/(1-b)*(10-y)/(10-x));
 }
});
test('Direct global weighted-log optimization and independent indifference solves verify the rational contract curve and interval',()=>{
 for(const a of[.15,.3,.65,.85])for(const b of[.15,.3,.65,.85])for(const x of[.001,.2,1,5,9,9.8,9.999]){
  const y=coreCurveY(a,b,x),lambda=(b/(10-x))/(a/x+b/(10-x)),score=(xx,yy)=>lambda*(a*Math.log(xx)+(1-a)*Math.log(yy))+(1-lambda)*(b*Math.log(10-xx)+(1-b)*Math.log(10-yy)),best=score(x,y);
  for(let i=1;i<30;i++)for(let j=1;j<30;j++)assert.ok(score(10*i/30,10*j/30)<=best+1e-10);
 }
 // Independently invert A's reservation indifference curve, then solve tangency in y.
 const a=.65,b=.3,wx=3,wy=3,target=U(a,wx,wy),indiff=x=>(target/x**a)**(1/(1-a));let lo=.1,hi=9.9;
 for(let i=0;i<100;i++){const x=(lo+hi)/2,y=indiff(x),r=a/(1-a)*y/x-b/(1-b)*(10-y)/(10-x);if(r>0)lo=x;else hi=x;}
 close(coreInterval(a,b,wx,wy).lower,(lo+hi)/2);
});
test('Every actual control corner is classified by independent utilities and boundary efficiency; inefficient cases supply genuine feasible blocking witnesses',()=>{
 for(const a of[.15,.85])for(const b of[.15,.85])for(const wx of[.3,9.7])for(const wy of[.3,9.7])for(const x of[0,10])for(const y of[0,10]){
  const s=coreAllocationState(a,b,wx,wy,x,y),irA=U(a,x,y)>=U(a,wx,wy)-1e-10,irB=U(b,10-x,10-y)>=U(b,10-wx,10-wy)-1e-10,efficient=(x===0&&y===0)||(x===10&&y===10);
  assert.equal(s.inCore,irA&&irB&&efficient);assert.equal(s.efficient,efficient);
  if(s.witness){const[xx,yy]=s.witness.point;assert.ok(xx>=0&&xx<=10&&yy>=0&&yy<=10);assert.ok(U(a,xx,yy)>U(a,x,y));assert.ok(U(b,10-xx,10-yy)>U(b,10-x,10-y));}
 }
 const oldFalse=coreAllocationState(.65,.3,3,3,5,1.9);assert.equal(oldFalse.verdict,'blocked by the pair');assert.ok(oldFalse.witness.gains.every(g=>g>0));
 const nearCurve=coreAllocationState(.65,.3,3,3,5,coreCurveY(.65,.3,5)+1e-8);assert.equal(nearCurve.efficient,false);assert.equal(nearCurve.witness.resolved,false);
 for(const a of[.15,.65,.85])for(const b of[.15,.3,.85])for(let i=1;i<20;i++)for(let j=1;j<20;j++){
  const x=i/2,y=j/2,s=coreAllocationState(a,b,3,3,x,y);if(s.witness)assert.ok(s.witness.gains.every(g=>g>=-2e-12)&&s.witness.gains.some(g=>g>1e-12));
 }
 for(const a of[.15,.65,.85])for(const b of[.15,.3,.85]){const y=coreCurveY(a,b,5),c=coreInterval(a,b,5,y);close(c.lower,5);close(c.upper,5);assert.equal(c.lower,c.upper);assert.equal(coreAllocationState(a,b,5,y,5,y).inCore,true);}
});
test('All 665,091 actual leader-control settings obey quantity KKT, market clearing and monopoly/competitive benchmark ordering',()=>{
 for(let is=0;is<=80;is++)for(let ic=0;ic<=160;ic++)for(let im=0;im<=50;im++){
  const sf=.05*is,c=.05*ic,m=.01*im,s=dominantFirmState(sf,c,m);close(s.quantity+s.fringeQuantity,s.total);close(s.total,20-s.price);close(s.fringeQuantity,sf*s.price);
  const derivative=(20-2*s.quantity)/(1+sf)-c-m*s.quantity;close(s.derivative,derivative);assert.ok(s.quantity>=0&&s.quantity<=10);assert.ok(derivative<=1e-10);close(s.quantity*derivative,0);
  assert.ok(s.price<=s.monopolyPrice+1e-10&&s.price>=s.competitivePrice-1e-10);assert.ok(s.profit>=-1e-10);
 }
});
test('Independent complete price/quantity searches verify global profit and competitive supply, including exit and exact off-grid boundaries',()=>{
 for(const sf of[0,.2,1.5,2.7,4])for(const c of[0,2,4,8])for(const m of[0,.1,.5]){
  const s=dominantFirmState(sf,c,m),cost=q=>c*q+m*q*q/2;
  for(let k=0;k<=400;k++){const q=k/20,p=(20-q)/(1+sf);assert.ok(p*q-cost(q)<=s.profit+1e-10);const pp=20/(1+sf)*k/400,qq=20-(1+sf)*pp;assert.ok(pp*qq-cost(qq)<=s.profit+1e-10);}
  const p=s.competitivePrice,leader=m?Math.max(0,(p-c)/m):p<c-1e-10?0:20-p-sf*p;close(leader+sf*p,20-p);
 }
 for(const sf of[1.5,2.7,4]){const s=dominantFirmState(sf,20/(1+sf),.13);assert.equal(s.quantity,0);close(s.mr,s.mc);close(s.profit,0);}
 const exit=dominantFirmState(4,8,.5);assert.equal(exit.quantity,0);close(exit.price,4);assert.ok(exit.derivative<0);
});
test('The costless flat-MC leader retains output10 and asymptotic half share; positive costs or slopes have different large-fringe limits',()=>{
 for(const sf of[0,4,100,1e6]){const s=dominantFirmState(sf,0,0);close(s.quantity,10);close(s.price,10/(1+sf));close(s.share,10/(20-10/(1+sf)));}
 close(dominantFirmState(1e9,0,0).share,.5,1e-8);assert.ok(dominantFirmState(1e6,0,.1).quantity<.001);assert.equal(dominantFirmState(1e6,2,0).quantity,0);
});
