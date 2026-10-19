import assert from 'node:assert/strict';
import {test} from 'node:test';
import {barrierPath} from '../content/algo/ch11-d.js';

const rectangle=[{a:[-1,0],b:0},{a:[1,0],b:6},{a:[0,-1],b:0},{a:[0,1],b:4}];
test('Log-barrier Newton path matches the independent closed-form rectangle solution',()=>{
  for(const {t,x} of barrierPath(rectangle,[1,0],40)){
    // Maximize t*x + log(x)+log(6-x)+log(y)+log(4-y).
    // The positive stationary root is x=3+(sqrt(1+9t²)-1)/t, y=2.
    const exact=3+9*t/(Math.sqrt(1+9*t*t)+1);
    assert.ok(Math.abs(x[0]-exact)<2e-8,`weight${t}: x${x[0]} versus${exact}`);
    assert.ok(Math.abs(x[1]-2)<1e-12);
  }
});

test('Atlas barrier points stay strictly feasible, centered and inside the theoretical objective-gap bound',()=>{
  const cons=[{a:[-1,0],b:-.5},{a:[0,-1],b:-.5},{a:[1,1],b:8},{a:[1,0],b:6},{a:[0,1],b:5},{a:[-1,1],b:3}];
  const vertices=[];
  for(let i=0;i<cons.length;i++)for(let j=0;j<i;j++){
    const u=cons[i],v=cons[j],d=u.a[0]*v.a[1]-u.a[1]*v.a[0];if(!d)continue;
    const z=[(u.b*v.a[1]-u.a[1]*v.b)/d,(u.a[0]*v.b-u.b*v.a[0])/d];
    if(cons.every(q=>q.a[0]*z[0]+q.a[1]*z[1]<=q.b+1e-12))vertices.push(z);
  }
  for(const degrees of [0,40,45,90]){
    const c=[Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)],opt=Math.max(...vertices.map(z=>c[0]*z[0]+c[1]*z[1]));let previous=-Infinity;
    for(const {t,x}of barrierPath(cons,c,100)){
      const slacks=cons.map(q=>q.b-q.a[0]*x[0]-q.a[1]*x[1]);assert.ok(slacks.every(s=>s>0));
      const gradient=c.map((ci,j)=>t*ci-cons.reduce((s,q,k)=>s+q.a[j]/slacks[k],0));
      assert.ok(Math.hypot(...gradient)/(1+t)<2e-7,`centering at${degrees}degrees,weight${t}`);
      const value=c[0]*x[0]+c[1]*x[1];assert.ok(value>=previous-1e-8);previous=value;
      assert.ok(opt-value<=cons.length/t+1e-7);
    }
  }
});

test('Ellipsoid factors enclose retained half-ellipses and keep finite areas under parallel cuts',async()=>{
  const {ellipsoidRun}=await import('../content/algo/ch11-d.js');
  const cons=[{a:[-1,0],b:-.5},{a:[0,-1],b:-.5},{a:[1,1],b:8},{a:[1,0],b:6},{a:[0,1],b:5},{a:[-1,1],b:3}],ratio=4/(3*Math.sqrt(3));
  for(const degrees of [0,40,45,90]){
    const run=ellipsoidRun(cons,[Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)],60);assert.equal(run.length,61);
    for(const [k,e]of run.entries()){
      assert.ok([...e.c,...e.B.flat(),e.area].every(Number.isFinite));assert.ok(e.area>0);
      assert.ok(Math.abs(e.area/(100*Math.PI*ratio**k)-1)<1e-13);
      if(k>=12)continue;
      const next=run[k+1],D=next.B[0][0]*next.B[1][1]-next.B[0][1]*next.B[1][0];
      for(let j=0;j<720;j++){
        const th=2*Math.PI*j/720,d=e.B.map(r=>r[0]*Math.cos(th)+r[1]*Math.sin(th));
        if(e.cut[0]*d[0]+e.cut[1]*d[1]>1e-10)continue;
        const z=e.c.map((x,i)=>x+d[i]-next.c[i]);
        const local=[(next.B[1][1]*z[0]-next.B[0][1]*z[1])/D,(-next.B[1][0]*z[0]+next.B[0][0]*z[1])/D];
        assert.ok(Math.hypot(...local)<=1+1e-10);
      }
    }
  }
});
