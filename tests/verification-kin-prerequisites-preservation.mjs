// Explicit-only audit against a caller-provided immutable pre-batch content/kin snapshot.
import assert from 'node:assert/strict';import{readFileSync,readdirSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';
const root=process.cwd(),base=process.env.KIN_PREREQUISITES_BASELINE_ROOT;assert.ok(base,'Set KIN_PREREQUISITES_BASELINE_ROOT to the pre-batch archive root');
const spec=JSON.parse(readFileSync(new URL('./kin-prerequisites-manifest.json',import.meta.url))),encode=x=>JSON.stringify(x,(_k,v)=>typeof v==='function'?v.toString():v),load=(r,f)=>import(pathToFileURL(resolve(r,'content/kin',f)).href).then(x=>x.default);
const s=await load(root,'syllabus.js'),b=await load(base,'syllabus.js'),rows=new Map(s.chapters.flatMap(c=>c.items).map(i=>[i.num,i]));
let count=0,changed=0;const mismatches=[];
for(const f of readdirSync('content/kin')){
 if(/^ch\d+(?:-[a-z])?\.js$/.test(f)){
 const n=await load(root,f),o=await load(base,f);assert.equal(encode({...n,items:[]}),encode({...o,items:[]}));assert.equal(n.items.length,o.items.length);
 for(let j=0;j<n.items.length;j++){const i=n.items[j],p=o.items[j];count++;assert.equal(i.num,p.num);if(spec.edges[i.num]){assert.deepEqual(i.deps,[...p.deps,...spec.edges[i.num]]);assert.deepEqual(i.deps,rows.get(i.num).deps);assert.ok(i.idea.startsWith(p.idea));assert.equal(encode({...i,deps:p.deps,idea:p.idea}),encode(p));changed++;}else{assert.equal(encode(i),encode(p));assert.deepEqual(i.deps,rows.get(i.num).deps);if(encode(i.deps)!==encode(rows.get(i.num).deps))mismatches.push(i.num);}}
 }else if(f!=='syllabus.js')assert.equal(readFileSync(resolve(root,'content/kin',f),'utf8'),readFileSync(resolve(base,'content/kin',f),'utf8'),f);
}
for(const c of b.chapters)for(const i of c.items)if(spec.edges[i.num])i.deps=[...i.deps,...spec.edges[i.num]];
b.chapters.flatMap(c=>c.items).find(i=>i.num==='3.4').deps=['kin-3.2','qm-4.4'];
assert.deepEqual(s,b);assert.equal(changed,Object.keys(spec.edges).length);
console.log(`PASS all ${count} objects/functions/properties and helpers/flags; ${changed} append-only consumers and complete exact affected syllabus rows; only exact owned additions plus authorized3.4 alias canonicalization`);
console.log(`Remaining item/syllabus mismatches: ${mismatches.join(', ')||'none'}`);
