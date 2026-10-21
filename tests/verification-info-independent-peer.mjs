// Explicit immutable-candidate peer guard; never part of default test glob.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [before,after]=process.argv.slice(2);assert.ok(before&&after,'pass parent and candidate archive paths');
const additions={
  "1.3": [
    "pma-5.15"
  ],
  "1.7": [
    "prob-1.6.1"
  ],
  "1.10": [
    "pma-5.13"
  ],
  "2.3": [
    "rca-3.3"
  ],
  "2.4": [
    "prob-2.2.14"
  ],
  "2.8": [
    "prob-1.6.1"
  ],
  "2.13": [
    "pma-5.11"
  ],
  "3.1": [
    "prob-2.2.3",
    "prob-1.6.4"
  ],
  "3.10": [
    "prob-2.2.3"
  ],
  "3.11": [
    "pma-3.14"
  ],
  "3.13": [
    "stoch-4.9"
  ],
  "3.14": [
    "stoch-4.7"
  ],
  "3.15": [
    "stoch-4.13"
  ],
  "4.4": [
    "pma-3.20"
  ],
  "4.14": [
    "pma-3.26"
  ]
};
const load=async(root,file)=>(await import(pathToFileURL(path.join(root,'content/info',file)))).default;
const encode=x=>JSON.stringify(x,(_,v)=>typeof v==='function'?v.toString():v);
let objects=0,functions=0;
for(const f of fs.readdirSync(path.join(before,'content/info'))){const a=fs.readFileSync(path.join(before,'content/info',f),'utf8'),b=fs.readFileSync(path.join(after,'content/info',f),'utf8');
 if(!/^ch\d+(?:-[a-z]+)?\.js$/.test(f)&&f!=='syllabus.js'){assert.equal(b,a,f);continue;}
 if(f==='syllabus.js')continue;
 const A=await load(before,f),B=await load(after,f);assert.equal(A.items.length,B.items.length);
 for(let j=0;j<A.items.length;j++){const x=A.items[j],y=B.items[j],extra=additions[x.num];objects++;if(x.viz){assert.equal(String(x.viz),String(y.viz));functions++;}
 assert.equal(encode({...y,idea:x.idea,deps:x.deps}),encode(x),`${f}/${x.num} complete preservation`);
 if(extra){assert.deepEqual(y.deps,[...x.deps,...extra]);assert.ok(y.idea.startsWith(x.idea+'\n\n'),x.num+' append-only idea');}
 else assert.equal(encode(y),encode(x));
 }
 const strip=s=>s.replace(/idea\s*:\s*String\.raw`[^`]*`/g,'idea:OWNED').replace(/deps\s*:\s*\[[^\]]*\]/g,'deps:OWNED');assert.equal(strip(b),strip(a),f+' non-owned bytes');
}
const A=await load(before,'syllabus.js'),B=await load(after,'syllabus.js');let rows=0;
function walk(a,b){if(!a||typeof a!=='object')return; if(a.num){rows++;const extra=additions[a.num];assert.deepEqual(b.deps,extra?[...a.deps,...extra]:a.deps);if(Object.hasOwn(a,'deps'))b.deps=a.deps;else delete b.deps;}for(const k of Object.keys(a))walk(a[k],b[k]);}walk(A,B);assert.equal(encode(A),encode(B),'all syllabus data and dependency lists');assert.equal(objects,57);assert.equal(rows,154);
// Exhaust every three-state directed support with nonempty rows and strong connectivity.
let supports=0,pairs=0;const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-10);
const reaches=(A,start)=>{let seen=new Set([start]),todo=[start];while(todo.length){const i=todo.pop();for(let j=0;j<A.length;j++)if(A[i][j]>0&&!seen.has(j)){seen.add(j);todo.push(j);}}return seen.size===A.length;};
const solve=(A,b)=>{A=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<b.length;c++){let r=c;while(Math.abs(A[r][c])<1e-12)r++;[A[c],A[r]]=[A[r],A[c]];let d=A[c][c];for(let j=c;j<=b.length;j++)A[c][j]/=d;for(let i=0;i<b.length;i++)if(i!==c){d=A[i][c];for(let j=c;j<=b.length;j++)A[i][j]-=d*A[c][j];}}return A.map(r=>r.at(-1));};
for(let mask=0;mask<512;mask++){let P=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>(mask>>(3*i+j))&1));if(P.some(r=>!r.some(Boolean))||!P.every((_,i)=>reaches(P,i)))continue;P=P.map(r=>r.map(x=>x/r.reduce((a,b)=>a+b)));let pi=solve([[P[0][0]-1,P[1][0],P[2][0]],[P[0][1],P[1][1]-1,P[2][1]],[1,1,1]],[0,0,1]);assert.ok(pi.every(x=>x>0));let E=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(P[i][j])E.push([i,j]);let Q=E.map(([i,j])=>E.map(([k,l])=>j===k?P[j][l]:0)),w=E.map(([i,j])=>pi[i]*P[i][j]);for(let v=0;v<E.length;v++){assert.ok(reaches(Q,v));near(w[v],w.reduce((s,x,u)=>s+x*Q[u][v],0));near(Q[v].reduce((a,b)=>a+b),1);}near(w.reduce((s,x,u)=>s-x*Math.log2(P[E[u][0]][E[u][1]]),0),pi.reduce((s,x,i)=>s-x*P[i].reduce((z,p)=>z+(p?p*Math.log2(p):0),0),0));supports++;pairs+=E.length;}
// Equal starting laws can diverge under different kernels; ordinary entropy may decrease.
const H=p=>-p.reduce((s,x)=>s+(x?x*Math.log2(x):0),0),D=(p,q)=>p.reduce((s,x,i)=>s+(x?x*Math.log2(x/q[i]):0),0);assert.equal(D([.5,.5],[.5,.5]),0);assert.ok(D([.8,.2],[.3,.7])>0);assert.ok(H([.9,.1])<H([.5,.5]));near(D([1,0],[.5,.5]),D([0,1],[.5,.5]));
console.log(JSON.stringify({objects,functions,syllabusRows:rows,addedEdges:Object.values(additions).flat().length,stronglyConnectedSupports:supports,allowedPairStates:pairs,status:'PASS'}));
