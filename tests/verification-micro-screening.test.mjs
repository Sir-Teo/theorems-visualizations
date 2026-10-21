import test from'node:test';import assert from'node:assert/strict';
import{screeningBenefit as V,screeningOptimum as opt,screeningMenuState as menu}from'../content/micro/source-audit-screening.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Independent linear-program vertex search in the two total payments.
function paymentLP(phi,theta,l,h){
 const B=(type,q)=>type*q-.5*q*q;
 const cs=[[1,0,B(theta,l)],[0,1,B(10,h)],[1,-1,B(theta,l)-B(theta,h)],[-1,1,B(10,h)-B(10,l)],[-1,0,0],[0,-1,0]];
 let best=-Infinity,chosen=null;
 for(let i=0;i<cs.length;i++)for(let j=0;j<i;j++){
  const[a,b,c]=cs[i],[d,e,f]=cs[j],det=a*e-b*d;if(!det)continue;
  const x=(c*e-b*f)/det,y=(a*f-c*d)/det;
  if(cs.every(([A,B,C])=>A*x+B*y<=C+1e-9)){
   const profit=(1-phi)*(x-2*l)+phi*(y-2*h);
   if(profit>best){best=profit;chosen=[x,y];}
  }
 }
 return{best,chosen};
}
test('All actual type-share settings satisfy independent IR/IC, correct marginal distortion, exact high efficiency and exclusion KKT conditions',()=>{
 for(let pi=0;pi<=70;pi++)for(let ti=0;ti<=100;ti++){
  const phi=(10+pi)/100,theta=(60+ti)/20,p=opt(phi,theta),s=menu(phi,theta,p.qLow,p.tLow,p.qHigh,p.tHigh);
  assert.equal(s.feasible,true);assert.ok(p.qLow>=0&&p.qLow<p.efficientLow&&p.qLow<p.qHigh);close(p.qHigh,8);close(10-p.qHigh,2);
  close(s.slacks[0],0);close(s.slacks[3],0);assert.ok(s.slacks[1]>=-1e-10&&s.slacks[2]>=-1e-10);close(s.uHigh,(10-theta)*p.qLow);
  const derivative=(1-phi)*(theta-p.qLow-2)-phi*(10-theta);
  if(p.qLow>0){close(derivative,0);assert.ok(theta-p.qLow>2);}else assert.ok(derivative<=1e-10);
  close(p.profit,s.assignedProfit);
 }
 for(let ti=0;ti<=100;ti++){const theta=(60+ti)/20,phi=(theta-2)/8,p=opt(phi,theta);assert.equal(p.qLow,0);assert.equal(p.excluded,true);close(p.rentHigh,0);close(p.profit,32*phi);}
});
test('Independent payment-linear-program vertices verify the binding constraints and complete feasible payment optima',()=>{
 for(const theta of[3,4.55,6,8])for(const phi of[.1,.35,.8]){
  const p=opt(phi,theta),at=paymentLP(phi,theta,p.qLow,p.qHigh);close(at.best,p.profit);
  for(const l of[0,1,2.75,5,8,10])for(const h of[0,1,2.75,5,8,10]){
   const q=paymentLP(phi,theta,l,h);
   if(l>h||theta*l-l*l/2<0){assert.equal(q.chosen,null);continue;}
   assert.ok(q.chosen);const s=menu(phi,theta,l,q.chosen[0],h,q.chosen[1]);assert.equal(s.feasible,true);
   assert.ok(q.best<=p.profit+1e-9);const upper=(1-phi)*((theta-2)*l-l*l/2)+phi*(8*h-h*h/2-(10-theta)*l);close(q.best,upper);
  }
 }
});
test('Independent complete quantity searches and feasible random menus confirm global expected-profit dominance including the low-type exclusion corner',()=>{
 const cases=[[.1,3],[.8,3],[.1,8],[.8,8],[.3,6],[.125,3],[.75,8],[.124,3],[.126,3]];
 let seed=773;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(const[phi,theta]of cases){
  const p=opt(phi,theta);
  for(let li=0;li<=240;li++)for(let hi=0;hi<=240;hi++){
   const l=li/20,h=hi/20,upper=(1-phi)*((theta-2)*l-.5*l*l)+phi*(8*h-.5*h*h-(10-theta)*l);
   assert.ok(upper<=p.profit+1e-9);
  }
  for(let i=0;i<2000;i++){
   const l=12*rand(),h=12*rand(),lo=50*rand(),hp=50*rand(),s=menu(phi,theta,l,lo,h,hp);
   if(s.feasible)assert.ok(s.assignedProfit<=p.profit+1e-9);
  }
 }
 const excluded=opt(.8,3);assert.equal(excluded.qLow,0);assert.equal(excluded.tLow,0);close(excluded.tHigh,48);close(excluded.profit,25.6);
});
test('Independent integral welfare and all actual menu-control corners distinguish implementable profits from failed constraints',()=>{
 const integrate=(theta,q)=>{const n=200,h=q/n;let total=theta-2+(theta-q-2);for(let i=1;i<n;i++)total+=(i%2?4:2)*(theta-i*h-2);return total*h/3;};
 for(const theta of[3,5.15,8])for(const phi of[.1,.35,.8]){
  const p=opt(phi,theta),w=(1-phi)*integrate(theta,p.qLow)+phi*integrate(10,p.qHigh);
  close(p.welfare,w);close(p.efficientWelfare,(1-phi)*integrate(theta,theta-2)+phi*integrate(10,8));close(p.loss,(1-phi)*(p.efficientLow-p.qLow)**2/2);close(p.welfare,p.profit+phi*p.rentHigh);
 }
 for(const theta of[3,8])for(const phi of[.1,.8])for(let mask=0;mask<16;mask++){
  const l=mask&1?10:0,lo=mask&2?50:0,h=mask&4?10:0,hp=mask&8?50:0,s=menu(phi,theta,l,lo,h,hp);
  const ll=theta*l-l*l/2-lo,lh=theta*h-h*h/2-hp,hh=10*h-h*h/2-hp,hl=10*l-l*l/2-lo;
  s.slacks.forEach((x,i)=>close(x,[ll,hh,ll-lh,hh-hl][i]));assert.equal(s.feasible,[ll,hh,ll-lh,hh-hl].every(x=>x>=-1e-9));
 }
 const failed=menu(.3,6,3,12.01,6,30);assert.ok(failed.slacks.some(x=>x<0));assert.equal(failed.feasible,false);
 close(V(3,10),-20);
});
