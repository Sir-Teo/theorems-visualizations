import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../scripts/serve.mjs';
async function server(verificationAssets,fn){const s=createServer({verificationAssets});await new Promise(r=>s.listen(0,'127.0.0.1',r));try{await fn(`http://127.0.0.1:${s.address().port}`)}finally{await new Promise(r=>s.close(r))}}
test('default server keeps public harness URLs and no-store transport',()=>server(false,async base=>{
 const h=await fetch(base+'/tools/harness.html');assert.equal(h.headers.get('cache-control'),'no-store');const html=await h.text();assert.match(html,/https:\/\/cdn.jsdelivr.net\/npm\/katex@0.16.11\/dist\/katex.min.js/);assert.match(html,/fonts.googleapis.com/);
 const a=await fetch(base+'/assets/js/viz/core.js');assert.equal(a.headers.get('cache-control'),'no-store');
}));
test('verification transport caches stable assets only and serves the pinned renderer without external requests',()=>server(true,async base=>{
 for(const path of['/assets/js/viz/core.js','/assets/css/style.css','/node_modules/katex/dist/katex.min.js','/node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2']){
  const r=await fetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'public, max-age=3600');
 }
 for(const path of['/tools/harness.html','/content/pde/ch03-c.js','/data/atlas.css']){const r=await fetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');}
 const html=await(await fetch(base+'/tools/harness.html')).text();assert.match(html,/src="\/node_modules\/katex\/dist\/katex.min.js"/);assert.match(html,/href="\/node_modules\/katex\/dist\/katex.min.css"/);assert.doesNotMatch(html,/fonts.googleapis.com|https:\/\/cdn.jsdelivr.net/);
 const font=await fetch(base+'/node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2');assert.equal(font.headers.get('content-type'),'font/woff2');
}));
