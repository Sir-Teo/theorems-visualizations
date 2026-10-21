// Explicit immutable peer preservation boundary, never a default content snapshot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const [base,pre,root]=process.argv.slice(2), json=f=>JSON.parse(fs.readFileSync(root+'/tests/'+f)), m=json('arch-prerequisites-manifest.json'), q=json('arch-prerequisites-correction-manifest.json'), w=json('arch-prerequisites-wrap-manifest.json'), b=json('arch-banner-layout-manifest.json');
const expected={'1.3':'ladr-3.21','1.6':'vcalc-4.9','2.1':'ladr-3.65','2.3':'pma-5.15','2.6':'ode-3.13','3.2':'vcalc-4.9','3.3':'mech-2.3','3.5':'solid-4.10','3.7':'pma-5.11','3.9':'pma-5.11','4.1':'pma-6.27','4.2':'vcalc-4.9','4.3':'pma-10.46','4.6':'pma-5.15','4.7':'vcalc-4.7','4.8':'pma-6.21','4.9':'pma-10.46','4.11':'ladr-3.65'};
assert.deepEqual(Object.fromEntries(m.mapping.map(x=>[x.num,x.target])),expected);
assert.deepEqual(Object.fromEntries(Object.entries(q).map(([n,x])=>[n,Object.keys(x)])),{'3.2':['statement','scope'],'3.5':['statement','idea']});
assert.deepEqual(Object.fromEntries(Object.entries(w).map(([n,x])=>[n,Object.keys(x)])),{'3.7':['scope'],'4.6':['scope'],'4.3':['statement','idea'],'2.3':['statement']});
const enc=x=>JSON.stringify(x,(_,v)=>typeof v==='function'?String(v):v), load=async(r,f)=>(await import(pathToFileURL(r+'/content/arch/'+f))).default, flat=s=>s.replace(/\\(?:begin|end)\{(?:aligned|gathered)\}/g,'').replace(/\\\\|\\qquad|\\quad|\$|&|\s/g,'');
for(const x of Object.values(w))for(const e of Object.values(x))assert.equal(flat(e.before),flat(e.after),'equivalent token order');
let objects=0,functions=0;const finalRows=(await load(root,'syllabus.js')).chapters.flatMap(c=>c.items), list=[];
for(const file of fs.readdirSync(base+'/content/arch')){
 const paths=[base,pre,root].map(r=>r+'/content/arch/'+file),src=paths.map(p=>fs.readFileSync(p,'utf8'));
 if(file==='syllabus.js')continue;
 if(/^ch\d+(-[a-z]+)?\.js$/.test(file)){
  const [A,P,R]=await Promise.all([base,pre,root].map(r=>load(r,file)));assert.equal(A.items.length,P.items.length);assert.equal(A.items.length,R.items.length);
  for(let i=0;i<A.items.length;i++){
   const original=A.items[i],num=original.num,x={...original},z=m.mapping.find(x=>x.num===num);
   if(z){assert.deepEqual(x.deps,z.before);x.deps=[...x.deps,expected[num]];x.idea+='\n\n'+z.paragraph;assert.deepEqual(x.deps,z.after);}
   assert.equal(enc(x),enc(P.items[i]),num+' pristine prerequisite full object');
   for(const layer of[q,w])for(const [field,e]of Object.entries(layer[num]||{})){assert.equal(x[field],e.before);x[field]=e.after;}
   const r={...R.items[i]};if(num==='1.3'){assert.equal(b.num,num);const text=String(r.viz);assert.equal(text.split(b.after).length,2);r.viz=text.replace(b.after,()=>b.before);}
   assert.equal(enc(x),enc(r),num+' all flags/functions/full fields');
   assert.deepEqual(R.items[i].deps,finalRows.find(r=>r.num===num).deps,num+' exact full raw list');
   list.push({num,deps:R.items[i].deps});objects++;functions+=Object.values(original).filter(x=>typeof x==='function').length;
  }
  assert.equal(enc({...A,items:[]}),enc({...P,items:[]}));assert.equal(enc({...A,items:[]}),enc({...R,items:[]}));
 }
 const mask=s=>s.replace(/idea:\s*String\.raw`[^`]*`/g,'IDEA').replace(/deps:\s*\[[^\]]*\]/g,'DEPS');
 assert.equal(mask(src[0]),mask(src[1]),file+' pristine helper/source bytes');
 let wanted=src[1];for(const layer of[q,w])for(const x of Object.values(layer))for(const e of Object.values(x))if(e.file===file){assert.equal(wanted.split(e.before).length,2,file+' exact single text');wanted=wanted.replace(e.before,()=>e.after);}
 if(file===b.file){assert.equal(wanted.split(b.before).length,2);wanted=wanted.replace(b.before,()=>b.after);}
 assert.equal(wanted,src[2],file+' exact closing source bytes');
}
const sy=await load(base,'syllabus.js'),psy=await load(pre,'syllabus.js'),rsy=await load(root,'syllabus.js');for(const row of sy.chapters.flatMap(c=>c.items)){if(m.backfills[row.num]){assert.deepEqual(row.deps,m.oldRows[row.num]);row.deps=m.backfills[row.num];}if(expected[row.num])row.deps=[...row.deps,expected[row.num]];}
assert.equal(enc(sy),enc(psy));assert.equal(enc(psy),enc(rsy));assert.equal(objects,40);assert.equal(functions,40);assert.equal(finalRows.length,94);
const {loadAll}=await import(pathToFileURL(root+'/scripts/lib.mjs')),all=await loadAll(),fields=new Map(all.collections.map(c=>[c.id,c.field]));assert.equal(fields.get('arch'),'arts');for(const target of Object.values(expected)){const t=all.items.find(x=>x.id===target);assert.ok(t&&t.idea&&t.statement,target+' actual written proof');assert.notEqual(fields.get(t.col),'arts');}
const result={objects,functions,rawRows:94,fullLists:list,edges:18,consumers:18,uniqueTargets:new Set(Object.values(expected)).size,qualifications:4,wrapFields:5,runtimeExceptions:['1.3 banner literal only'],allOtherSourceBytesFlagsHelpers:'exact',pass:true};console.log(JSON.stringify(result,null,2));
