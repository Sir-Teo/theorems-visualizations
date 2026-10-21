// Explicit-only exact-boundary equivalence and full-preservation audit.
import assert from 'node:assert/strict';
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const baseline=process.env.POPGEN_WRAP_BASELINE;assert.ok(baseline,'immutable baseline required');
const ids=['1.16','2.1','2.3','3.2','4.2','4.4','4.12'];
const normalize=s=>s.replace(/\\(?:begin|end)\{gathered\}/g,'').replace(/\\\\/g,'').replace(/\s/g,'');
const serial=x=>JSON.stringify(x,(_,v)=>typeof v==='function'?v.toString():v);
const load=async(r,f)=>(await import(pathToFileURL(resolve(r,'content/popgen',f)))).default;
let count=0;const changed=[];
for(const f of await readdir('content/popgen')){
 if(/^ch.*\.js$/.test(f)&&!f.includes('shared')){
  const old=await load(baseline,f),now=await load('.',f);assert.equal(old.items.length,now.items.length);
  for(let j=0;j<old.items.length;j++){
   const a=old.items[j],b=now.items[j];count++;
   if(ids.includes(b.num)){assert.notEqual(a.statement,b.statement);assert.equal(normalize(a.statement),normalize(b.statement));assert.equal(serial({...b,statement:a.statement}),serial(a));changed.push(b.num);}
   else assert.equal(serial(a),serial(b));
  }
  assert.equal(serial({...now,items:old.items}),serial(old));
 }else assert.equal(await readFile(resolve(baseline,'content/popgen',f),'utf8'),await readFile(resolve('content/popgen',f),'utf8'));
}
assert.equal(count,62);assert.deepEqual(changed.sort(),[...ids].sort());
console.log('PASS all62 full objects/functions/flags, all raw deps/syllabus/private helpers unchanged; exactly7 statements preserve every non-whitespace token after removing added gathered wrappers and linebreaks');
if(process.argv.includes('--guard-only'))process.exit(0);
const out=process.env.POPGEN_WRAP_OUTPUT||'/tmp/atlas-new-arch-source/popgen-wrap/native';await mkdir(out,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const results=[];
try{for(const theme of ['light','dark']){const page=await browser.newPage({viewport:{width:320,height:2400},colorScheme:theme,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const num of ids){await page.goto(`http://localhost:${server.address().port}/#/t/popgen-${num}`);await page.locator('.statement').waitFor();await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});const q=await page.locator('.statement').evaluate(e=>({w:e.clientWidth,sw:e.scrollWidth,height:e.getBoundingClientRect().height,math:[...e.querySelectorAll('.katex-display')].map(x=>({w:x.clientWidth,sw:x.scrollWidth}))}));assert.ok(q.sw<=q.w+1,JSON.stringify({num,theme,q}));for(const m of q.math)assert.ok(m.sw<=m.w+1,JSON.stringify({num,theme,m}));assert.equal(await page.locator('.katex-error').count(),0);await page.locator('.statement').screenshot({path:`${out}/${num}-${theme}.png`});results.push({num,theme,...q});console.log('PASS',num,theme,q);}assert.deepEqual(errors,[]);await page.close();}}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/native.json`,JSON.stringify(results,null,2));}
