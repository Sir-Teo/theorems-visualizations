import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright-core';
import { findBrowser } from '../scripts/browser.mjs';
import { buildStaticIdeas } from '../scripts/build-static-ideas.mjs';
import { ROOT } from '../scripts/lib.mjs';
let browser, server, origin, output, owned, report, manifest;
const shots=process.env.ATLAS_STATIC_SCREENSHOTS || '/tmp/atlas-static-reading-20261022-shots';
before(async()=>{
 output=process.env.ATLAS_STATIC_CANDIDATE;
 if(!output){owned=await mkdtemp(join(tmpdir(),'atlas-static-test-'));output=join(owned,'site');await buildStaticIdeas({out:output,base:'https://example.org/project/'});}
 output=resolve(output);report=JSON.parse(await readFile(join(output,'static-build.json'),'utf8'));manifest=JSON.parse(await readFile(join(ROOT,'static-pages/accepted.json'),'utf8'));
 const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.woff2':'font/woff2'};
 server=http.createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.startsWith('/project/'))path=path.slice('/project'.length);if(path.endsWith('/'))path+='index.html';const file=resolve(output,'.'+path);if(!file.startsWith(output+'/')){res.writeHead(403);res.end();return;}const s=await stat(file).catch(()=>null);if(!s?.isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));}catch{res.writeHead(500);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));if(owned)await rm(owned,{recursive:true,force:true});});
async function pageRun(fn,options={}){const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',...options});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[]);}finally{await context.close();}}
test('complete generated inventory has real pages, unique canonical URLs, resolved local links and no draft export',async()=>{
 assert.equal(report.items,manifest.ids.length);assert.equal(report.aliases,76);assert.equal(report.collections,85);assert.equal(report.mathErrors,0);
 const xml=await readFile(join(output,'sitemap.xml'),'utf8'),urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,manifest.ids.length+report.collections+1);assert.equal(new Set(urls).size,urls.length);
 const paths=urls.map(u=>new URL(u).pathname.slice(new URL(report.canonicalBase).pathname.length)+'index.html');
 const all=[...paths,...manifest.aliases.map(a=>'ideas/'+a.id+'/index.html')];let localLinks=0;
 const targets=new Set();
 for(const path of all){const html=await readFile(join(output,path),'utf8');assert.ok(!html.includes('class="katex-error"'),path);assert.ok(!html.includes('tex-fallback'),path);if(/^ideas\/[a-z0-9]+-[^/]+\//.test(path)&&!manifest.aliases.some(a=>path===`ideas/${a.id}/index.html`)){assert.ok(html.includes('<h2>Statement</h2>'),path);assert.ok(html.includes('<h2>Explanation</h2>'),path);}
  for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(?:https?:|#|data:)/.test(href))continue;const u=new URL(href.replaceAll('&amp;','&'),'https://local/'+path);let target=u.pathname.slice(1);if(!target || target.endsWith('/'))target+='index.html';targets.add(target);localLinks++;}
 }
 for(const target of targets)assert.ok((await stat(join(output,target)).catch(()=>null))?.isFile(),target);
 for(const a of manifest.aliases)assert.ok(!urls.some(u=>u.endsWith('/ideas/'+a.id+'/')));
 for(const path of ['labs','explorations','orientation','docs','static-pages'])assert.equal(await stat(join(output,path)).catch(()=>null),null,path);
 assert.ok(localLinks>40000);
 console.log(JSON.stringify({pages:all.length,localLinks,localTargets:targets.size,canonicalUrls:urls.length}));
});
test('no-JavaScript pages contain the explanation and typeset MathML, with navigable collections and prerequisites',()=>pageRun(async page=>{
 const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto(origin+'/project/ideas/pma-4.19/');await page.locator('h1').waitFor();assert.match(await page.locator('main').textContent(),/compactness extracts finitely many/);assert.ok(await page.locator('math').count()>0);assert.equal(await page.locator('canvas').count(),0);assert.ok(!requests.some(p=>p.endsWith('/data/index.json')));
 await page.getByRole('link',{name:'Principles of Mathematical Analysis',exact:true}).click();assert.match(new URL(page.url()).pathname,/\/project\/ideas\/collections\/pma\//);
 await page.getByRole('link',{name:'4.19 · Continuity on a compact space is uniform',exact:true}).click();await page.locator('a[href="../pma-4.18/"]').first().click();assert.match(new URL(page.url()).pathname,/\/project\/ideas\/pma-4.18\//);
}, {javaScriptEnabled:false}));
test('aliases retain opaque queries and fragments, and interactive return preserves all query bytes',()=>pageRun(async page=>{
 const a=manifest.aliases[0],suffix='?opaque=x%2By%3D&embed=1&unknown=a?b&empty=&dup=1&dup=2';
 await page.goto(origin+'/project/ideas/'+a.id+'/'+suffix+'#main');await page.waitForURL(u=>u.pathname.endsWith('/ideas/'+a.to+'/'));
 assert.equal(new URL(page.url()).search,suffix);assert.equal(new URL(page.url()).hash,'#main');
 await page.getByRole('link',{name:'Open the interactive explanation',exact:true}).click();await page.locator('.thm-page').waitFor();assert.equal(new URL(page.url()).pathname,'/project/');assert.equal(new URL(page.url()).hash,'#/t/'+a.to+suffix);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('embed-view')),true);
}));
test('a real visualization share round trip through the reading page restores its edited control',()=>pageRun(async page=>{
 await page.goto(origin+'/project/#/t/pma-4.19');const slider=page.locator('#viz input[type="range"]').first();await slider.waitFor();await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');const value=await slider.inputValue();
 await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();const shared=new URL(await page.locator('.share-url').inputValue()),query=shared.hash.slice(shared.hash.indexOf('?'));
 await page.goto(origin+'/project/ideas/pma-4.19/'+query);await page.getByRole('link',{name:'Open the interactive explanation',exact:true}).click();await page.locator('#viz canvas').first().waitFor();assert.equal(await page.locator('#viz input[type="range"]').first().inputValue(),value);assert.equal(new URL(page.url()).hash,'#/t/pma-4.19'+query);assert.ok(!(await page.locator('.share-status').textContent()).includes('could not'));
}));
test('root navigation reaches the reading library, and phone/desktop pages fit both themes',async()=>{
 await pageRun(async page=>{await page.goto(origin+'/project/');await page.getByRole('link',{name:'Read',exact:true}).click();assert.match(new URL(page.url()).pathname,/\/project\/ideas\//);assert.equal(await page.locator('.reading-collections a').count(),85);});
 for(const width of [320,1280])for(const theme of ['light','dark'])await pageRun(async page=>{await page.addInitScript(t=>localStorage.setItem('theme',t),theme);await page.goto(origin+'/project/ideas/pma-4.19/');await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:join(shots,`reading-${width}-${theme}.png`),fullPage:true});}, {viewport:{width,height:900}});
});

test('long mathematical and paper pages contain their formulas on a phone without JavaScript',async()=>{
 for(const id of ['mathbio-7.15','energy-1.5','imaging-3.7','game-3.11','astro-10.20'])for(const theme of ['light','dark'])await pageRun(async page=>{
  await page.goto(origin+'/project/ideas/'+id+'/');await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1 && e.getBoundingClientRect().width>0).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,120)})));
  await page.screenshot({path:join(shots,`reading-critical-${id}-${theme}.png`),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,id+' '+theme+' '+JSON.stringify(overflow));
 },{javaScriptEnabled:false,colorScheme:theme,viewport:{width:320,height:900}});
});
