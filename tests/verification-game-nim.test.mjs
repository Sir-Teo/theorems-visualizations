import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES,grundyTable,sumSolver,nimSum,nimReply,validNimState } from '../content/game/nim-audit.js';

// Direct pin bitmaps retain the geometry, rather than production's row partitions.
function pinGrundy(N){const memo=new Map([[0,0]]);const g=mask=>{if(memo.has(mask))return memo.get(mask);const seen=new Set();for(let i=0;i<N;i++)if(mask&(1<<i)){seen.add(g(mask^(1<<i)));if(i+1<N&&(mask&(2<<i)))seen.add(g(mask^(3<<i)));}let n=0;while(seen.has(n))n++;memo.set(mask,n);return n;};return{g,memo};}
test('all offered row Grundy values agree with direct rules, including occupied-pin Kayles geometry',()=>{
 const pins=pinGrundy(12);for(let n=0;n<=12;n++)assert.equal(grundyTable('kayles',12)[n],pins.g((1<<n)-1));
 assert.equal(pins.memo.size,4096);
 for(const key of['nim','sub123','sub25']){const ref=[0];for(let n=1;n<=12;n++){const moves=key==='nim'?Array.from({length:n},(_,i)=>i):key==='sub123'?[n-1,n-2,n-3].filter(i=>i>=0):[n-2,n-5].filter(i=>i>=0);const reachable=moves.map(i=>ref[i]);let v=0;while(reachable.includes(v))v++;ref.push(v);}assert.deepEqual(grundyTable(key,12),ref);}
});
test('all676 displayed two-row outcomes satisfy the source XOR criterion and all legal heap responses',()=>{
 for(const key of Object.keys(GAMES)){const g=grundyTable(key,12),s=sumSolver(key);for(let a=0;a<=12;a++)for(let b=0;b<=12;b++)assert.equal(s.lost([a,b].filter(Boolean).sort((a,b)=>a-b)),g[a]===g[b]);}
 const cache=new Map();function lost(h){const k=h.join();if(cache.has(k))return cache.get(k);let v=true;outer:for(let i=0;i<h.length;i++)for(let n=0;n<h[i];n++){const next=h.slice();next[i]=n;if(lost(next)){v=false;break outer;}}cache.set(k,v);return v;}
 for(let a=0;a<=7;a++)for(let b=0;b<=7;b++)for(let c=0;c<=7;c++)for(let d=0;d<=7;d++){
  const h=[a,b,c,d],next=nimReply(h);assert.equal(lost(h),nimSum(h)===0);
  if(h.some(Boolean)){const changed=h.flatMap((n,i)=>n!==next[i]?[i]:[]);assert.equal(changed.length,1);assert.ok(next[changed[0]]<h[changed[0]]);if(nimSum(h)!==0)assert.equal(nimSum(next),0);else assert.notEqual(nimSum(next),0);}else assert.deepEqual(next,h);
 }
});
test('finite DAG sum theorem: every pair of four-node ordered DAGs has XOR mex at every node',()=>{
 const graphs=[];for(let mask=0;mask<64;mask++){const edges=Array.from({length:4},()=>[]);let bit=0;for(let i=0;i<4;i++)for(let j=0;j<i;j++,bit++)if(mask&(1<<bit))edges[i].push(j);const g=[];for(const e of edges){let v=0;while(e.some(j=>g[j]===v))v++;g.push(v);}graphs.push({edges,g});}
 for(const A of graphs)for(const B of graphs){const sum=[];for(let i=0;i<4;i++){sum[i]=[];for(let j=0;j<4;j++){const choices=[...A.edges[i].map(x=>sum[x][j]),...B.edges[j].map(y=>sum[i][y])];let v=0;while(choices.includes(v))v++;sum[i][j]=v;assert.equal(v,A.g[i]^B.g[j]);}}}
});
test('replay accepts only finite heaps, exact seed and consistent last-token result',()=>{
 assert.ok(validNimState({heaps:[3,4,5],seed:1,outcome:null}));assert.ok(validNimState({heaps:[0,0],seed:4294967295,outcome:'human'}));
 for(const d of[null,{heaps:[3],seed:1,outcome:null},{heaps:[3.5,2],seed:1,outcome:null},{heaps:[8,2],seed:1,outcome:null},{heaps:[0,0],seed:1,outcome:null},{heaps:[1,0],seed:1,outcome:'computer'},{heaps:[1,0],seed:1.5,outcome:null},{heaps:[1,0],seed:1,outcome:[]}])assert.equal(validNimState(d),false);
 assert.throws(()=>nimReply([8,1]),RangeError);
});
