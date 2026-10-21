import test from 'node:test';import assert from 'node:assert/strict';
import{CUBE_BOARDS,CUBE_BUDGETS,cubeSize,cubeLines,cubeSearch,cubeModel,cubeHit,cubeSelectionValid}from'../content/game/source-audit-hypercube.js';
const canon=l=>l.slice().sort((a,b)=>a-b).join(',');
function endpointLines(board){const{n,d,N}=cubeSize(board),coords=i=>Array.from({length:d},(_,j)=>Math.floor(i/n**j)%n),lines=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const a=coords(i),b=coords(j);if(a.some((x,k)=>x!==b[k]&&Math.abs(x-b[k])!==n-1))continue;lines.push(Array.from({length:n},(_,t)=>a.reduce((s,x,k)=>s+(x+t*(b[k]-x)/(n-1))*n**k,0)));}return lines;}
const avoids=(mask,lines)=>lines.every(l=>l.some(i=>!!(mask&(2**i)))&&l.some(i=>!(mask&(2**i))));
test('all fifteen complete geometric line families agree with an independent pair-of-endpoints construction',()=>{
 for(const{value:b}of CUBE_BOARDS){const{n,d}=cubeSize(b),a=cubeLines(b),e=endpointLines(b);assert.deepEqual(a.map(canon).sort(),e.map(canon).sort());assert.equal(a.length,((n+2)**d-n**d)/2);for(const l of a){assert.equal(l.length,n);assert.equal(new Set(l).size,n);}}
});
test('independent full small-colouring enumeration and three-plane exhaustion certify returned nonexistence',()=>{
 for(const{value:b}of CUBE_BOARDS){const{N}=cubeSize(b);if(N>16)continue;const lines=endpointLines(b);let found=false;for(let mask=0;mask<2**N&&!found;mask++)found=avoids(mask,lines);assert.equal(cubeSearch(b).result,found?'found':'none',b);}
 const plane=endpointLines('3^2'),planes=[];for(let mask=0;mask<512;mask++)if(avoids(mask,plane))planes.push(mask);assert.ok(planes.length>0);
 const crossing=endpointLines('3^3').filter(l=>new Set(l.map(i=>Math.floor(i/9))).size>1);let combinations=0,survivors=0;for(const a of planes)for(const b of planes)for(const c of planes){combinations++;const mask=a+b*512+c*262144;if(avoids(mask,crossing))survivors++;}assert.ok(combinations>1000);assert.equal(survivors,0);assert.equal(cubeSearch('3^3').result,'none');assert.equal(cubeSearch('3^4').result,'none','contains the same impossible3^3 slice');
});
test('every returned full/partial witness is valid; node budgets and colour counts do not become game values',()=>{
 for(const{value:b}of CUBE_BOARDS)for(const budget of CUBE_BUDGETS){const p=cubeSearch(b,budget);assert.ok(p.nodes<=budget);assert.equal(p.shown.filter(x=>x>=0).length,p.depth);assert.deepEqual(p.shown.slice(p.depth),Array(p.N-p.depth).fill(-1));assert.ok(p.shown.slice(0,p.depth).every(x=>x===0||x===1));for(const l of endpointLines(b)){const values=l.map(i=>p.shown[i]);if(values.every(x=>x>=0))assert.ok(new Set(values).size>1);}if(p.result==='found'){assert.equal(p.depth,p.N);assert.equal(p.compatible,Math.abs(p.counts[0]-p.counts[1])<=1);}if(p.result==='unknown')assert.equal(p.nodes,budget);}
 assert.equal(cubeSearch('4^3',1000).result,'unknown');assert.equal(cubeSearch('4^3',300000).result,'found');assert.equal(cubeSearch('4^3').compatible,false);assert.equal(cubeSearch('3^2').compatible,true);const q=cubeSearch('3^2');q.shown[0]=9;q.lines[0][0]=-5;assert.equal(cubeSearch('3^2').shown[0],0);assert.ok(cubeSearch('3^2').lines.every(l=>l.every(i=>i>=0)));
});
test('actual square hits, complete incidence highlights and strict restored-state domains',()=>{
 for(const{value:b}of CUBE_BOARDS){const p=cubeModel(b,1000,0);for(let i=0;i<p.N;i++){const[x,y]=p.positions[i];assert.equal(cubeHit(p,x+.5,y+.5),i);assert.equal(cubeHit(p,x+.061,y+.061),i);assert.equal(cubeHit(p,x-.01,y-.01),null);}assert.equal(cubeHit(p,-.6,-.6),null);assert.equal(cubeHit(p,NaN,0),null);assert.deepEqual(p.through.map(canon).sort(),endpointLines(b).filter(l=>l.includes(0)).map(canon).sort());assert.ok(cubeSelectionValid({board:b,pick:p.N-1}));assert.equal(cubeSelectionValid({board:b,pick:p.N}),false);}
 for(const b of ['5^4','1^2','3^0',null])assert.throws(()=>cubeSearch(b),RangeError);for(const budget of [0,1,999,300001,Infinity])assert.throws(()=>cubeSearch('3^2',budget),RangeError);for(const p of [-1,.1,9])assert.throws(()=>cubeModel('3^2',1000,p),RangeError);for(const s of [null,{},[],{board:'5^4',pick:0},{board:'3^2',pick:0,extra:1}])assert.equal(cubeSelectionValid(s),false);
});
