import test from 'node:test';
import assert from 'node:assert/strict';
import {convexOperationInputs as inputs,convexOperationOuters as outers,convexCompositionRule as rule} from '../content/opt/ch03.js';
const h=(i,o,x)=>outers[o](inputs[i].f(x));
const gap=(i,o,x,y,t=.5)=>h(i,o,t*x+(1-t)*y)-t*h(i,o,x)-(1-t)*h(i,o,y);
test('all four exact input ranges agree with dense independent samples on the displayed domain',()=>{
 const ranges={sq:[0,4.5],abs:[0,4],exp:[Math.exp(-2),Math.exp(2)],conc:[-1,2]};
 for(const[i,bounds]of Object.entries(ranges)){
  assert.deepEqual(inputs[i].range,bounds);
  for(let n=0;n<=1200;n++){const y=inputs[i].f(-3+n/200);assert.ok(y>=bounds[0]-1e-14&&y<=bounds[1]+1e-14)}
 }
});
test('quadratic composed with square is x^4/4, whose independent second derivative is 3x^2',()=>{
 assert.equal(rule('sq','sq').applies,true);
 for(let n=0;n<=600;n++){const x=-3+n/100;assert.ok(Math.abs(h('sq','sq',x)-x**4/4)<2e-14);assert.ok(3*x*x>=0)}
 for(let i=0;i<=40;i++)for(let j=0;j<=40;j++)for(const t of [.1,.3,.5,.8])assert.ok(gap('sq','sq',-3+i*.15,-3+j*.15,t)<2e-13);
});
test('all twelve composition diagnoses use analytic sufficient hypotheses, not a finite chord verdict',()=>{
 for(const i of Object.keys(inputs))for(const o of Object.keys(outers)){
  const expected=i!=='conc'&&o!=='sqrt';assert.equal(rule(i,o).applies,expected,`${i}/${o}`);
  if(expected)for(let n=0;n<=24;n++)for(let m=0;m<=24;m++)assert.ok(gap(i,o,-3+n/4,-3+m/4)<1e-8,`${i}/${o}`);
 }
 // |x-1| squared and exponential squared simplify independently to convex functions.
 for(const x of [-3,-1,0,1,2,3]){assert.ok(Math.abs(h('abs','sq',x)-(x-1)**2)<1e-14);assert.ok(Math.abs(h('exp','sq',x)-Math.exp(4*x/3))<1e-12)}
});
test('genuine failures have explicit independent Jensen witnesses',()=>{
 for(const[i,o,x,y]of [['conc','sq',-1,1],['conc','exp',-1,1],['conc','sqrt',-1,1],['abs','sqrt',1,3]]){
  assert.equal(rule(i,o).applies,false);assert.ok(gap(i,o,x,y)>1e-3,`${i}/${o} must violate midpoint convexity`);
 }
});
test('a failed sufficient hypothesis does not imply a nonconvex composition',()=>{
 for(const i of ['sq','exp']){
  assert.equal(rule(i,'sqrt').applies,false);
  for(let n=0;n<=30;n++)for(let m=0;m<=30;m++)assert.ok(gap(i,'sqrt',-3+n/5,-3+m/5)<1e-12);
 }
 // sqrt(x²/2+3) has second derivative 1.5/(x²/2+3)^(3/2)>0.
 // sqrt(exp(2x/3)+3) has second derivative a(a+6)/(9(a+3)^(3/2))>0.
 for(const x of [-3,-1,0,2,3]){assert.ok(1.5/(x*x/2+3)**1.5>0);const a=Math.exp(2*x/3);assert.ok(a*(a+6)/(9*(a+3)**1.5)>0)}
});
