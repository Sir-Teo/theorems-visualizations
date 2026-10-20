// Explicit independent source and production-field audit; no frozen default assertions.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {findBrowser} from '../scripts/browser.mjs';
const [base,root,out]=process.argv.slice(2); assert.ok(base&&root&&out);
await fs.mkdir(out,{recursive:true});
const load=async(r,f)=>(await import(pathToFileURL(path.join(r,'content/astro',f)))).default;
const encode=x=>JSON.stringify(x,(_,v)=>typeof v==='function'?v.toString():v);
const manifest=JSON.parse(await fs.readFile(root+'/tests/astro-remaining-prerequisites-manifest.json'));
const scope=JSON.parse(await fs.readFile(root+'/tests/astro-hill-component-scope-manifest.json'));
const wrap=JSON.parse(await fs.readFile(root+'/tests/astro-remaining-wrap-manifest.json'));
const mapping={'1.7':'pma-8.10','2.2':'pma-4.22','2.5':'pma-5.15','4.8':'prob-1.1.1a'};
assert.deepEqual(Object.fromEntries(manifest.mapping.map(x=>[x.num,x.target])),mapping);
assert.deepEqual(Object.keys(scope),['2.2']); assert.deepEqual(Object.keys(wrap),['1.7']);
const exact=(s,a,b)=>{assert.equal(s.split(a).length,2);return s.replace(a,()=>b);};
const deps=(s,num,ids)=>s.replace(new RegExp("(num:\\s*'"+num.replace('.','\\.')+"'[\\s\\S]*?deps:\\s*)\\[[^\\]]*\\]"),(_,p)=>p+'['+ids.map(x=>"'"+x+"'").join(', ')+']');
const rows=[];let objects=0,functions=0;
for(const file of await fs.readdir(base+'/content/astro')){
 const before=await fs.readFile(base+'/content/astro/'+file,'utf8'),after=await fs.readFile(root+'/content/astro/'+file,'utf8');
 if(file==='syllabus.js')continue;
 if(!/^ch\d+(?:-[a-z]+)?\.js$/.test(file)){assert.equal(after,before,file+' helpers/audit/metadata');continue;}
 let reconstructed=before;const A=await load(base,file),B=await load(root,file);
 assert.equal(encode({...A,items:[]}),encode({...B,items:[]}));assert.equal(A.items.length,B.items.length);
 for(let j=0;j<A.items.length;j++){
  const old=A.items[j],now=B.items[j],expected={...old},m=manifest.mapping.find(x=>x.num===old.num);objects++;functions+=Object.values(old).filter(x=>typeof x==='function').length;
  if(m){assert.deepEqual(old.deps,m.before);expected.idea+='\n\n'+m.paragraph;expected.deps=[...old.deps,mapping[old.num]];assert.deepEqual(expected.deps,m.after);reconstructed=exact(reconstructed,'idea: String.raw`'+old.idea+'`','idea: String.raw`'+expected.idea+'`');reconstructed=deps(reconstructed,old.num,expected.deps);}
  for(const fixes of[scope,wrap])for(const[field,z]of Object.entries(fixes[old.num]||{})){
   assert.equal(expected[field],z.before);
   if(fixes===wrap){const canon=s=>s.replace(/\\(?:begin|end)\{gathered\}|\\\\|\s/g,'');assert.equal(canon(z.before),canon(z.after),'ordered equivalent wrap');}
   reconstructed=exact(reconstructed,field+': String.raw`'+z.before+'`',field+': String.raw`'+z.after+'`');expected[field]=z.after;
  }
  assert.equal(encode(now),encode(expected),old.num+' complete object/functions/flags');rows.push({num:old.num,before:old.deps,after:now.deps});
 }
 assert.equal(reconstructed,after,file+' every undeclared byte');
}
assert.equal(objects,48);assert.equal(functions,48);
const S=await load(base,'syllabus.js'),T=await load(root,'syllabus.js'),expected=structuredClone(S);
let source=await fs.readFile(base+'/content/astro/syllabus.js','utf8');
for(const row of expected.chapters.flatMap(c=>c.items))if(mapping[row.num]){row.deps=[...row.deps,mapping[row.num]];source=deps(source,row.num,row.deps);}
assert.equal(encode(T),encode(expected));assert.equal(source,await fs.readFile(root+'/content/astro/syllabus.js','utf8'));
for(const row of rows)assert.deepEqual(row.after,T.chapters.flatMap(c=>c.items).find(x=>x.num===row.num).deps);
assert.equal(T.chapters.flatMap(c=>c.items).length,128);
const {loadAll}=await import(pathToFileURL(root+'/scripts/lib.mjs'));const atlas=await loadAll(),fields=new Map(atlas.collections.map(c=>[c.id,c.field]));
assert.equal(fields.get('astro'),'physics');for(const id of Object.values(mapping)){const target=atlas.items.find(x=>x.id===id);assert.ok(target);assert.equal(fields.get(target.col),'math');}
await fs.writeFile(out+'/preservation.json',JSON.stringify({objects,functions,syllabusRows:128,mapping,fullLists:rows,status:'PASS'},null,2));
console.log('PASS independent48 objects/functions/flags/helpers/all raw128 rows and exact allowed source bytes');
if(process.env.ASTRO_ROOT_NATIVE!=='1')process.exit(0);
const {createServer}=await import(pathToFileURL(root+'/scripts/serve.mjs')),server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),issues=[],bounds=[];
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:320,height:2400},colorScheme:theme,reducedMotion:'reduce'});await context.addInitScript(t=>localStorage.setItem('theme',t),theme);
  const page=await context.newPage();page.on('pageerror',e=>issues.push({theme,error:e.message}));
  for(const num of Object.keys(mapping)){
   const file=manifest.mapping.find(m=>m.num===num).file;
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/astro/${file}&id=astro-${num}&w=284&theme=${theme}&still=1&wait=150`);
   await page.waitForFunction(()=>window.__done);const mounted=await page.evaluate(()=>window.__done);
   for(const key of ['errors','texErrors','blank'])if(mounted[key]?.length)issues.push({theme,num,key,value:mounted[key]});
   await page.goto(`http://127.0.0.1:${server.address().port}/#/t/astro-${num}`);await page.locator('#idea').waitFor();
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   for(const [kind,selector]of [['statement','.statement'],['idea','#idea']]){
    const el=page.locator(selector),data=await el.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,text:e.textContent,displays:[...e.querySelectorAll('.katex-display')].map(k=>({width:k.clientWidth,scroll:k.scrollWidth})),math:[...e.querySelectorAll('.katex-html')].map(k=>{const r=k.getBoundingClientRect();return{left:r.left,right:r.right};}),texErrors:e.querySelectorAll('.katex-error').length}));
    bounds.push({theme,num,kind,...data});
    if(!data.text.trim()||data.texErrors||data.scroll>data.width+1||data.displays.some(x=>x.scroll>x.width+1)||data.math.some(x=>x.left< -1||x.right>321))issues.push({theme,num,kind,data});
    await el.screenshot({path:out+`/${num}-${theme}-${kind}.png`});
    if(kind==='idea')await el.evaluate(e=>{e.style.width='253px';e.style.boxSizing='content-box';e.style.minWidth='0';e.style.maxWidth='none';});
    const narrow=await el.evaluate(e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect(),left=b.left+parseFloat(c.borderLeftWidth)+parseFloat(c.paddingLeft),right=b.right-parseFloat(c.borderRightWidth)-parseFloat(c.paddingRight),rects=[],walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){if(n.parentElement.closest('.katex-mathml,annotation,script,style'))continue;const r=document.createRange();r.selectNodeContents(n);for(const x of r.getClientRects())if(x.width>0)rects.push({left:x.left,right:x.right});}return{contentWidth:right-left,overflow:rects.filter(x=>x.left<left-1||x.right>right+1)};});
    bounds.push({theme,num,kind:kind+'-text253',...narrow});
    if(Math.abs(narrow.contentWidth-253)>.01||narrow.overflow.length)issues.push({theme,num,kind:kind+'-text253',narrow});
    await el.screenshot({path:out+`/${num}-${theme}-${kind}-text253.png`});
   }
  }
  await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
await fs.writeFile(out+'/native.json',JSON.stringify({browser:browser.version(),bounds,issues},null,2));assert.deepEqual(issues,[]);
console.log('PASS8 actual320 native mounts,16 complete production fields and16 controlled253px text fields');
