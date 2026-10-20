// Explicit immutable-candidate peer guard; never part of default test glob.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [before,after]=process.argv.slice(2);assert.ok(before&&after,'pass parent and candidate archive paths');
const additions={'1.2':['pde-1.4'],'2.2':['pma-8.6'],'2.4':['ode-1.4'],'2.10':['ode-1.4'],'3.3':['ladr-6.55'],'3.6':['ladr-7.29'],'3.9':['mech-10.1'],'4.1':['pma-6.21'],'4.2':['pma-6.21'],'4.3':['pma-5.5'],'4.4':['pma-6.22'],'4.5':['pma-6.20','pma-6.19'],'4.6':['pde-4.1'],'4.7':['pma-5.8']};
const load=async(root,file)=>(await import(pathToFileURL(path.join(root,'content/geol',file)))).default;
const encode=x=>JSON.stringify(x,(_,v)=>typeof v==='function'?v.toString():v);
let objects=0,functions=0;
for(const f of fs.readdirSync(path.join(before,'content/geol'))){const a=fs.readFileSync(path.join(before,'content/geol',f),'utf8'),b=fs.readFileSync(path.join(after,'content/geol',f),'utf8');
 if(!/^ch\d+(?:-[a-z]+)?\.js$/.test(f)&&f!=='syllabus.js'){assert.equal(b,a,f);continue;}
 if(f==='syllabus.js')continue;
 const A=await load(before,f),B=await load(after,f);assert.equal(A.items.length,B.items.length);
 for(let j=0;j<A.items.length;j++){const x=A.items[j],y=B.items[j],extra=additions[x.num];objects++;if(x.viz){assert.equal(String(x.viz),String(y.viz));functions++;}
 assert.equal(encode({...y,idea:x.idea,deps:x.deps}),encode(x),`${f}/${x.num} complete preservation`);
 if(extra){assert.deepEqual(y.deps,[...x.deps,...extra]);let old=x.idea;if(x.num==='4.2')old=old.replace('$$T(z)=T_0+\\frac{q_mz}{k}+\\frac{A_0h^2}{k}(1-e^{-z/h}).$$',()=> '$$\\begin{aligned}T(z)&=T_0+\\frac{q_mz}{k}\\\\&\\quad+\\frac{A_0h^2}{k}(1-e^{-z/h}).\\end{aligned}$$');assert.ok(y.idea.startsWith(old),x.num+' previous explanation');}
 else assert.equal(encode(y),encode(x));
 }
 const strip=s=>s.replace(/idea\s*:\s*String\.raw`[^`]*`/g,'idea:OWNED').replace(/deps\s*:\s*\[[^\]]*\]/g,'deps:OWNED');assert.equal(strip(b),strip(a),f+' non-owned bytes');
}
const A=await load(before,'syllabus.js'),B=await load(after,'syllabus.js');let rows=0;
function walk(a,b){if(!a||typeof a!=='object')return; if(a.num){rows++;const extra=additions[a.num];assert.deepEqual(b.deps,extra?[...a.deps,...extra]:a.deps);if(Object.hasOwn(a,'deps'))b.deps=a.deps;else delete b.deps;}for(const k of Object.keys(a))walk(a[k],b[k]);}walk(A,B);assert.equal(encode(A),encode(B),'all syllabus data and dependency lists');assert.equal(objects,48);assert.equal(rows,100);
const near=(a,b)=>assert.ok(Math.abs(a-b)<2e-8*(1+Math.abs(b)),`${a} != ${b}`);
const integrate=(f,a,b,n=2000)=>{let s=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
// Independent finite integration-by-parts identity, then Gaussian-tail truncation.
let witnesses=0;for(let j=1;j<=80;j++){const R=j/20;const tail=x=>2/Math.sqrt(Math.PI)*integrate(t=>Math.exp(-t*t),x,12,400);near(integrate(tail,0,R,200),R*tail(R)+(1-Math.exp(-R*R))/Math.sqrt(Math.PI));witnesses++;const k=j/25,critical=Math.PI/Math.sqrt(2),Ra=x=>(x*x+Math.PI**2)**3/x**2;assert.ok(Ra(k)>=27*Math.PI**4/4-1e-9);near(Ra(critical),27*Math.PI**4/4);witnesses++;}
// Three-dimensional normal projection: signed coefficient and orthogonal remainder.
for(let j=1;j<=120;j++){const n=[Math.cos(j),Math.sin(j)*Math.cos(j/3),Math.sin(j)*Math.sin(j/3)],v=[j/10-3,2-j/80,j/70],c=n.reduce((s,x,i)=>s+x*v[i],0),r=v.map((x,i)=>x-c*n[i]);near(n.reduce((s,x,i)=>s+x*r[i],0),0);near(c*c+r.reduce((s,x)=>s+x*x,0),v.reduce((s,x)=>s+x*x,0));witnesses++;}
console.log(JSON.stringify({objects,functions,syllabusRows:rows,addedEdges:Object.values(additions).flat().length,independentWitnesses:witnesses,status:'PASS'}));
