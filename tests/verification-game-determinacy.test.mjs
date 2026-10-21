import test from 'node:test';
import assert from 'node:assert/strict';
import { DETERMINACY_GAMES, solveLineGame, validLineHistory } from '../content/game/determinacy-audit.js';

// Independent breadth-first bitboard enumeration followed by bottom-up evaluation.
// Payoffs are for fixed player X; production instead uses recursive mover values.
function oracle({W,H,K,mis}) {
  const N=W*H, full=(1<<N)-1, masks=[];
  for(let cells=1;cells<=full;cells++) {
    const indices=Array.from({length:N},(_,i)=>i).filter(i=>cells&(1<<i));
    if(indices.length!==K)continue;
    const coords=indices.map(i=>[Math.floor(i/W),i%W]);
    const dr=coords[1][0]-coords[0][0],dc=coords[1][1]-coords[0][1];
    if(![[0,1],[1,-1],[1,0],[1,1]].some(([r,c])=>r===dr&&c===dc))continue;
    if(coords.every(([r,c],i)=>r===coords[0][0]+i*dr&&c===coords[0][1]+i*dc))masks.push(cells);
  }
  const layers=[new Map([['0/0',{x:0,o:0}]])],all=new Map();
  for(let n=0;n<=N;n++)for(const [key,state]of layers[n]||[]) {
    const {x,o}=state,winX=masks.some(m=>(x&m)===m),winO=masks.some(m=>(o&m)===m);
    const terminal=winX?(mis?-1:1):winO?(mis?1:-1):((x|o)===full?0:null);
    all.set(key,{...state,terminal,n});
    if(terminal!==null)continue;
    layers[n+1]||=new Map();
    for(let i=0;i<N;i++)if(!((x|o)&(1<<i))) {
      const next=n%2?{x,o:o|(1<<i)}:{x:x|(1<<i),o};
      layers[n+1].set(`${next.x}/${next.o}`,next);
    }
  }
  const values=new Map();
  for(let n=N;n>=0;n--)for(const [key,state]of layers[n]||[]) {
    const {x,o,terminal}=all.get(key),child=[];
    for(let i=0;terminal===null&&i<N;i++)if(!((x|o)&(1<<i)))child.push(values.get(n%2?`${x}/${o|(1<<i)}`:`${x|(1<<i)}/${o}`));
    values.set(key,terminal!==null?terminal:n%2?Math.min(...child):Math.max(...child));
  }
  return{all,values,masks};
}

for(const [key,rules]of Object.entries(DETERMINACY_GAMES))test(`${key}: every reachable position agrees with independent fixed-player bitboard evaluation`,()=>{
  const G=solveLineGame(rules),O=oracle(rules),counts=[0,0,0];
  assert.equal(G.memo.size,O.all.size);
  for(const [k,{x,o,n,terminal}]of O.all) {
    const board=Array.from({length:G.N},(_,i)=>x&(1<<i)?'X':o&(1<<i)?'O':'.').join('');
    const fixed=O.values.get(k),moverValue=fixed===0?0:n%2?-fixed:fixed;
    assert.equal(G.memo.get(board),moverValue,board);counts[moverValue+1]++;
    assert.equal(G.term(board),terminal===null?null:terminal===0?0:n%2?-terminal:terminal,board);
  }
  assert.deepEqual(G.counts,counts);
  assert.equal(G.rootVal,key==='t34'?1:0);
  assert.equal(G.memo.size,key==='t34'?111973:5478);
});

test('board replay validates actual move histories and forbids post-terminal or fabricated play',()=>{
  const G=solveLineGame(DETERMINACY_GAMES.ttt);
  assert.ok(validLineHistory(G,G.empty,[]));
  const path=['.........','X........','X..O.....','XX.O.....','XX.OO....','XXXOO....'];
  assert.ok(validLineHistory(G,path.at(-1),path.slice(0,-1)));
  assert.ok(validLineHistory(G,path[2],path.slice(0,2)));
  for(const [board,hist]of [[path[2],[]],[path[2],[path[1]]],[path[2],[path[0],path[0]]],['XXXOOO... ',path],['XXXOOO...',path],['XXXXXXXXX',[]],[path[2],[path[0],'X.......O']], [path[0],null]])assert.equal(validLineHistory(G,board,hist),false);
});
