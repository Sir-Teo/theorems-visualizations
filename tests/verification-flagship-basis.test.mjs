import test from 'node:test';
import assert from 'node:assert/strict';
import chapter from '../content/ladr/ch02-b.js';
import * as M from '../assets/js/viz/math.js';

// Execute the real item's frame builder; references below use exact integer
// determinants, rather than the production orthogonalization or least squares.
function fixture() {
  const handles=[],buttons=new Map();let config,adapter;
  const stage={handle(x,y,o){const h={x,y,...o};handles.push(h);return h;}};
  const v={M,stage:()=>stage,steps:o=>(config=o,{reset(){}}),button:(s,f)=>buttons.set(s,f),shareState:(key,a)=>{adapter=a;},legend(){},render(){},readout(){}};
  chapter.items.find(i=>i.num==='2.30').viz(v);
  return {handles,buttons,adapter,frames:()=>config.frames()};
}
const rank=vs=>{if(vs.every(([x,y])=>x===0&&y===0))return 0;return vs.some(a=>vs.some(b=>a[0]*b[1]!==a[1]*b[0]))?2:1;};
test('All 59,049 five-vector integer-grid lists preserve exact prefix rank, deletion witnesses and final independent span',()=>{
  const f=fixture(),grid=[-1,0,1].flatMap(x=>[-1,0,1].map(y=>[x,y]));
  for(let code=0;code<9**5;code++){
    let n=code;const vs=f.handles.map(h=>{const p=grid[n%9];n=Math.floor(n/9);h.x=p[0];h.y=p[1];return p;});
    const frames=f.frames();assert.equal(frames.length,7);assert.deepEqual(frames[0].before,[]);
    for(let k=0;k<5;k++){
      const row=frames[k+1],before=vs.slice(0,k),expected=rank([...before,vs[k]])===rank(before);
      assert.equal(row.inSp,expected);assert.equal(row.kept.length,rank(vs.slice(0,k+1)));
      assert.equal(rank(row.kept.map(i=>vs[i])),row.kept.length);
      assert.equal(row.del.includes(k),expected);
      if(row.c){const sum=row.c.reduce((s,c,j)=>s.map((a,d)=>a+c*vs[row.before[j]][d]),[0,0]);assert.ok(Math.hypot(sum[0]-vs[k][0],sum[1]-vs[k][1])<1e-10);}
      assert.equal(row.distance<=row.tolerance,expected);
    }
    const last=frames.at(-1);assert.equal(last.kept.length,rank(vs));assert.equal(last.del.length,5-rank(vs));
  }
});
test('Actual plane/line/zero buttons and constrained drags expose degeneracy without promising two survivors',()=>{
  const f=fixture(),item=chapter.items.find(i=>i.num==='2.30');
  for(const[label,n]of[['Plane-spanning example',2],['Collinear example',1],['All zero example',0]]){f.buttons.get(label)();const frames=f.frames();assert.equal(frames.at(-1).kept.length,n);assert.doesNotMatch(frames.at(-1).note,/still spans.*R\^2/);if(!n){assert.match(frames.at(-1).note,/\(\\,\)/);frames.slice(1,6).forEach((r,k)=>assert.ok(r.note.includes(`v_${k+1}`)));}}
  for(const h of f.handles)for(const[x,y]of[[-100,-100],[-100,100],[100,-100],[100,100],[0,0]]){const p=h.constrain(x,y);assert.ok(Math.abs(p[0])<=2.5&&Math.abs(p[1])<=1.6);}
  assert.match(item.caption,/do not certify exact rank/);assert.doesNotMatch(item.caption,/exactly two vectors survive/);
  const nearDependent=[[1,0],[1,5e-7],[2,0],[0,0],[0,0]];nearDependent.forEach((p,i)=>{f.handles[i].x=p[0];f.handles[i].y=p[1];});
  assert.equal(rank(nearDependent),2);assert.equal(f.frames().at(-1).kept.length,1,'tolerance cannot certify exact rank');assert.equal(f.frames()[2].inSp,true);
});
test('Scoped complete-vector state preserves exact finite values and rejects malformed/out-of-domain arrays',()=>{
  const f=fixture(),ps=[[.9,.45],[1.8,.9],[-.5,1.3],[1.4,-1],[-1.5,-.55]];
  assert.equal(f.adapter.validate(ps),true);f.adapter.set(ps);assert.deepEqual(f.adapter.get(),ps);
  const copy=f.adapter.get();copy[0][0]=2;assert.deepEqual(f.adapter.get(),ps);
  for(const bad of[[],ps.slice(1),[[Infinity,0],...ps.slice(1)],[[2.6,0],...ps.slice(1)],[[0,-1.7],...ps.slice(1)],[[0,0,0],...ps.slice(1)]])assert.equal(f.adapter.validate(bad),false);
});
