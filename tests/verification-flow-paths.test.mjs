import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { golden as G, irrationalExample, unitMiddleExample, exactAdversarialRun, exactResidual, edmondsKarpAudit, criticalTally, konigCertificate } from '../content/algo/flow-paths-audit.shared.js';
import { fordFulkerson, minCutBrute, isFeasible, NETS, randNet, rngOf, matchBrute, coverBrute } from '../content/algo/ch11.shared.js';

const refs=JSON.parse(fs.readFileSync(new URL('../docs/verification/flow-paths-references.json',import.meta.url))),Q=G.q,Z=Q(0),r=Q(0,1);
const eq=(a,b)=>assert.deepEqual(a,b),near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const pow=n=>{let x=Q(1);for(let i=0;i<n;i++)x=G.mul(x,r);return x;};
test('quadratic-field comparisons and conversion preserve exact golden-ratio identities and small positive residuals',()=>{
  eq(G.mul(r,r),G.sub(Q(1),r));
  for(let n=0;n<=2000;n++) {
    const x=pow(n);assert.equal(G.sign(x),1);assert.equal(G.sign(G.sub(Z,x)),-1);
    eq(G.sub(x,G.mul(x,r)),G.mul(G.mul(x,r),r));
    const a=G.number(x),b=((Math.sqrt(5)-1)/2)**n;
    assert.ok(Math.abs(a-b)<=Math.max(5e-324,b*3e-12));
  }
});
test('all unit-middle capacities make exactly 2C adversarial pushes and two shortest pushes, including C=1',()=>{
  for(let C=1;C<=12;C++){
    const e=unitMiddleExample(C),run=exactAdversarialRun(e),short=fordFulkerson(Object.keys(e.pos),e.arcs,'s','t','bfs');
    assert.equal(run.steps.length,2*C);assert.equal(short.steps.length,2);assert.equal(run.value,2*C);assert.equal(short.value,2*C);
    assert.ok(run.steps.every(x=>x.b===1));assert.equal(exactResidual(e,run.exact).some(x=>x.from==='s'),false);
    assert.equal(minCutBrute(Object.keys(e.pos),e.arcs,'s','t').cap,2*C);
  }
});
test('1001 exact irrational augmentations match closed-form 150-digit references and have positive bottlenecks',()=>{
  const e=irrationalExample(4),run=exactAdversarialRun(e,1001);
  const pushes=run.frames.filter(x=>x.type==='push');assert.equal(pushes.length,1001);assert.equal(run.cutoff,true);
  for(let j=0;j<pushes.length;j++){
    const f=pushes[j].exact,b=run.steps[j].exactB;eq(b,j===0?Q(1):pow(Math.ceil(j/2)));
    assert.equal(G.sign(b),1);
    for(let k=0;k<f.length;k++){assert.ok(G.sign(f[k])>=0);assert.ok(G.sign(G.sub(e.capacities[k],f[k]))>=0);}
    for(const v of ['v1','v2','v3','v4']){
      const excess=e.arcs.reduce((s,[a,z],k)=>G.add(s,z===v?f[k]:a===v?G.sub(Z,f[k]):Z),Z);eq(excess,Z);
    }
    for(const k of [0,1,2,6,7,8])assert.ok(G.sign(G.sub(e.capacities[k],G.add(f[k],Q(2))))>=0);
  }
  for(const row of refs.rows){const fr=pushes[row.n-1];row.flow.forEach((v,k)=>near(fr.f[k],+v));near(fr.value,+row.value);near(run.steps[row.n-1].b,+row.bottleneck);}
  for(let n=0;n<=200;n++){
    const f=pushes[4*n].exact,k=2*n+1;
    eq(G.sub(e.capacities[5],f[5]),pow(k-1));eq(G.sub(e.capacities[3],f[3]),Z);eq(G.sub(e.capacities[4],f[4]),pow(k));
  }
  assert.equal(fordFulkerson(Object.keys(e.pos),e.arcs,'s','t','bfs').value,9);
  assert.equal(minCutBrute(Object.keys(e.pos),e.arcs,'s','t').cap,9);
  const limiting=[r,Q(2),Q(1,1),Q(1),r,Q(1),Q(1,1),Q(1,1),Q(1)];
  eq(e.arcs.reduce((s,[u],i)=>u==='s'?G.add(s,limiting[i]):s,Z),Q(3,2));
  near(G.number(Q(3,2)),+refs.limit);assert.equal(G.sign(G.sub(Q(9),Q(3,2))),1);
  assert.equal(run.frames.at(-1).type,'end');assert.match(run.frames.at(-1).note,/cutoff.*not algorithmic completion/);
});

function checkShortest(ids,arcs){
  const q=edmondsKarpAudit(ids,arcs);assert.ok(isFeasible(arcs,q.f,ids,'s','t'));near(q.value,minCutBrute(ids,arcs,'s','t').cap);
  assert.equal(q.states.length,q.steps.length+1);
  for(let k=0;k<q.steps.length;k++){
    const st=q.steps[k],d=q.states[k].dist;assert.equal(st.path.length,d.t);
    for(const a of st.path)assert.equal(d[a.to],d[a.from]+1);
    assert.ok(q.events[k].length>0);
    for(const v of ids)assert.ok(q.states[k+1].dist[v]>=d[v]);
  }
  for(const t of criticalTally(q.events))assert.ok(t.count<=Math.floor(ids.length/2));
  assert.ok(q.steps.length<=ids.length*arcs.length);assert.equal(q.states.at(-1).dist.t,Infinity);
  assert.equal(criticalTally(q.events,0).length,0);return q;
}
test('shortest-path distances, oriented critical counts and cut certificates hold on presets and independent integer networks',()=>{
  for(const e of Object.values(NETS))checkShortest(Object.keys(e.pos),e.arcs);
  for(let seed=1;seed<=100;seed++){const e=randNet(seed);checkShortest(Object.keys(e.pos),e.arcs);}
  const random=rngOf(719);
  for(let trial=0;trial<200;trial++){
    const n=2+Math.floor(random()*6),ids=['s',...Array.from({length:n-2},(_,j)=>`v${j}`),'t'],arcs=[];
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j&&random()<.3)arcs.push([ids[i],ids[j],Math.floor(random()*6)]);
    checkShortest(ids,arcs);
  }
});
test('König cover and alternating reachability agree with independent exhaustive checks for every 3×3 bipartite graph',()=>{
  for(let mask=0;mask<512;mask++){
    const E=[];for(let i=0;i<9;i++)if(mask>>i&1)E.push([Math.floor(i/3),i%3]);
    const q=konigCertificate(3,3,E),M=q.matching;
    assert.equal(M.length,matchBrute(3,3,E));assert.equal(q.cover.size,coverBrute(3,3,E));assert.equal(M.length,q.cover.size);
    assert.ok(E.every(([l,r])=>q.cover.has(`l${l}`)||q.cover.has(`r${r}`)));
    const reached=new Set(Array.from({length:3},(_,i)=>`l${i}`).filter(l=>!M.some(([a])=>l===`l${a}`))),queue=[...reached];
    for(let i=0;i<queue.length;i++)for(const[l,r]of E){const a=`l${l}`,b=`r${r}`,matched=M.some(([x,y])=>x===l&&y===r),next=queue[i]===a&&!matched?b:queue[i]===b&&matched?a:null;if(next&&!reached.has(next)){reached.add(next);queue.push(next);}}
    for(let i=0;i<3;i++)for(const side of ['l','r'])assert.equal(q.Z.has(`${side}${i}`),reached.has(`${side}${i}`));
    for(const[l,r]of M){assert.equal(Number(q.cover.has(`l${l}`))+Number(q.cover.has(`r${r}`)),1);assert.equal(q.Z.has(`l${l}`),q.Z.has(`r${r}`));}
    for(const id of q.cover)assert.ok(M.some(([l,r])=>id===`l${l}`||id===`r${r}`));
  }
  for(const[nL,nR,E]of [[0,3,[]],[3,0,[]],[4,2,[[0,0],[1,0],[2,1],[3,1]]]]){const q=konigCertificate(nL,nR,E);assert.equal(q.cover.size,q.matching.length);}
});
