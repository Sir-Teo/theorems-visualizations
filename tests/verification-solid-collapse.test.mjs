import test from 'node:test';
import assert from 'node:assert/strict';
import {collapseStatic as lower,collapseMechanism as upper} from '../content/solid/source-audit-collapse.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('All 40401 integer end-moment states give equilibrium reactions and a fully yield-admissible piecewise moment field',()=>{
  for(let a=-100;a<=100;a++)for(let b=-100;b<=100;b++){
    const s=lower(100,6,a,b);close(s.leftReaction+s.rightReaction,s.load);close(s.leftReaction*3-a,100);close(s.rightReaction*3-b,100);
    assert.ok(s.load>=0&&s.load<=800/6);close(s.moment(0),-a);close(s.moment(3),100);close(s.moment(6),-b);
    for(const x of[.75,2.25,3.75,5.25])assert.ok(Math.abs(s.moment(x))<=100);
  }
});
test('Independent unit-displacement work checks all hinge locations against every end-moment corner; maximum virtual work proves the upper certificate',()=>{
  for(let j=0;j<=520;j++){
    const x=.4+j*.01,u=upper(100,6,x);close(u.deflection(0),0);close(u.deflection(6),0);close(u.deflection(x),1);
    const left=(u.deflection(x)-u.deflection(0))/x,right=(u.deflection(6)-u.deflection(x))/(6-x),diss=100*(Math.abs(left)+Math.abs(right-left)+Math.abs(right));
    close(u.work,diss);close(u.load*u.deflection(3),diss);close(u.load,400/Math.min(x,6-x));assert.ok(u.load>=800/6-1e-10);
    for(const a of[-100,100])for(const b of[-100,100]){
      const s=lower(100,6,a,b),virtualWork=-s.moment(0)*left+s.moment(x)*(left-right)+s.moment(6)*right;
      close(virtualWork,s.load*u.deflection(3));assert.ok(virtualWork<=diss+1e-9);
    }
  }
});
test('Independent static-cube optimization and kinematic minimization certify the common exact load, including the formerly off-screen upper bound',()=>{
  const vertices=[];for(const MA of[-100,100])for(const MB of[-100,100])for(const MC of[-100,100])vertices.push((4*MC-2*MA-2*MB)/6);
  const pc=Math.max(...vertices);close(pc,800/6);close(lower(100,6,100,100).load,pc);close(upper(100,6,3).load,pc);
  const samples=Array.from({length:521},(_,j)=>upper(100,6,.4+j*.01).load);close(Math.min(...samples),pc);close(Math.max(...samples),1000);
  assert.ok(upper(100,6,.4).load>2.2*pc);
});
