import assert from 'node:assert/strict';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
const {godelStage}=await import(process.env.LOGIC_PEER_ROOT ? pathToFileURL(process.env.LOGIC_PEER_ROOT+'/content/logic/source-audit-godel.js') : new URL('../content/logic/source-audit-godel.js',import.meta.url));
test('independent Gödel finite-prefix Boolean enumeration and delayed collision oracle',()=>{
// Four Boolean operators, independently evaluated on all finite assignments.
const ops=[['∧',(a,b)=>a&&b],['∨',(a,b)=>a||b],['→',(a,b)=>!a||b],['↔',(a,b)=>a===b]];
let cases=0, assignments=0;
for(const [op,f] of ops)for(const negP of[false,true])for(const negQ of[false,true])for(let n=1;n<=4;n++){
 const text=`∀x ∃y (${negP?'¬':''}P(x) ${op} ${negQ?'¬':''}Q(y))`,m=godelStage(text,n);
 let exists=false;
 for(let mask=0;mask<2**(2*n);mask++){
  let good=true;
  for(let j=0;j<n;j++)good&&=f(Boolean(mask&(1<<j))!==negP,Boolean(mask&(1<<(n+j)))!==negQ);
  exists||=good;assignments++;
 }
 assert.equal(m.status==='sat',exists,text);
 for(let j=0;j<n;j++){assert.deepEqual(m.instances[j].tuple,[j+1]);assert.deepEqual(m.instances[j].fresh,[j+2]);}
 if(m.assignment){const v=new Map(m.assignment);for(let j=0;j<n;j++)assert.equal(f(v.get(`P(${j+1})`)!==negP,v.get(`Q(${j+2})`)!==negQ),true,text);}
 cases++;
}
// Reconstruct the delayed contradiction without atlas grounding/parser/SAT.
const pairs=[];for(let sum=2;pairs.length<12;sum++)for(let a=1;a<sum;a++)pairs.push([a,sum-a]);
for(let n=1;n<=12;n++){
 const m=godelStage('∀x ∀y ∃z (R(z,z) ∧ ¬R(x,y))',n);
 const positive=new Set(Array.from({length:n},(_,j)=>`${j+2},${j+2}`));
 const collision=pairs.slice(0,n).some(p=>positive.has(p.join(',')));
 assert.equal(m.status,collision?'unsat':'sat');assert.equal(m.firstUnsat,5);
 assert.deepEqual(m.instances.map(x=>x.tuple),pairs.slice(0,n));
}
console.log(`PASS ${cases} independent unary prefix cases / ${assignments} enumerated assignments; 12 independently reconstructed delayed-contradiction prefixes.`);

});
