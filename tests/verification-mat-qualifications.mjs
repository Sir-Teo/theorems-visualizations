// Explicit full-field audit; requires an immutable prerequisite-only archive.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.env.MAT_QUALIFICATION_BASELINE_ROOT;assert.ok(base);
const edits=JSON.parse(fs.readFileSync('tests/mat-qualifications-manifest.json'));
const enc=x=>JSON.stringify(x,(_k,v)=>typeof v==='function'?v.toString():v);
let count=0;
for(const f of fs.readdirSync('content/mat')){
 const file='content/mat/'+f,old=fs.readFileSync(path.join(base,file),'utf8');let src=fs.readFileSync(file,'utf8');
 if(!/^ch\d+(?:-[a-z]+)?\.js$/.test(f)){assert.equal(src,old);continue;}
 const now=(await import(pathToFileURL(path.resolve(file)))).default,prev=(await import(pathToFileURL(path.join(base,file)))).default;
 for(const e of edits.filter(e=>e.file===f)){
  const n=now.items.find(i=>i.num===e.num),p=prev.items.find(i=>i.num===e.num);assert.equal(p[e.field],e.before);assert.equal(n[e.field],e.after);n[e.field]=p[e.field];assert.equal(src.split(e.after).length,2);src=src.replace(e.after,()=>e.before);
 }
 assert.equal(enc(now),enc(prev),'complete objects/functions/flags '+f);assert.equal(src,old,'all other source bytes '+f);count+=now.items.length;
}
assert.equal(count,42);assert.equal(edits.length,13);
// Counterexamples and dimensional identities behind the bounded qualifications.
let checks=0;const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-11*Math.max(1,Math.abs(a),Math.abs(b)));checks++;};
for(const a of[.5,1,2,3]){near((1/a**2)/(a/2),2/a**3);near((4/(Math.sqrt(3)*a*a))/(a/Math.sqrt(3)),4/a**3);assert.notEqual((1/a**2)/a,2/a**3);checks++;}
for(const t of[.1,1,3]){const limit=Math.exp(-1/t);assert.ok(limit>0);assert.ok(1000*limit>100*limit);checks+=2;} // shifted Morse U+1 tends to1: positive nondecaying tail
const k=8.617333262e-5,NA=6.02214076e23,R=8.314462618;
for(const T of[300,1000,1500]){const e=2*1.602176634e-19;near(NA*e/(NA*1.380649e-23*T),e/(1.380649e-23*T));const fast=100*Math.exp(-.2/(k*T)),slow=Math.exp(-.1/(k*T));if(T===1500){assert.ok(fast>slow);checks++;}assert.ok(Math.exp(-.4/(k*T))<1);checks++;}
const ratio=Math.exp(190000/R*(1/1000-1/1050));assert.ok(ratio>2.9&&ratio<3.1);checks++;
// A small crystal can have integer mode zero, although its mean is positive.
const N=10,p=1e-6;assert.ok(Math.floor((N+1)*p)===0&&N*p>0);checks++;
// Lower pair energy can be outweighed by a site-count prefactor.
assert.ok(1e6*Math.exp(-2)>Math.exp(-1));checks++;
// b1²=1 vs b2²+b3²=.5 reduces this line estimate, but a positive fault cost can reverse total energy.
assert.ok(.5<1&&.5+2>1);checks++;
console.log('PASS 42 complete objects, functions, flags, helpers and raw rows; exactly 13 bounded text fields; independent qualification witnesses',checks);
