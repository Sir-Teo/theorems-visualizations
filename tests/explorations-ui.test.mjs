import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile, mkdir } from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
let browser, server, base;
const shots = process.env.ATLAS_PILOT_SCREENSHOTS || '/tmp/atlas-pilot-review-20261022/screenshots';
before(async () => {
  const files = createServer();
  server = http.createServer((req,res) => {
    if (req.url.startsWith('/project/')) req.url = req.url.slice('/project'.length);
    files.emit('request',req,res);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:findBrowser(),headless:true});
  await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();if(server) await new Promise(resolve=>server.close(resolve));});
async function run(fn,options={}) {
  const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:'light',reducedMotion:'reduce',...options});
  const page=await context.newPage(), errors=[], external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
    if (!route.request().url().startsWith(base)) {external.push(route.request().url());return route.abort();}
    return route.continue();
  });
  try {await fn(page,context);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);}
  finally{await context.close();}
}
const historyPath='/labs/atlas/x-history-0001/', literaturePath='/labs/atlas/x-literature-0001/';
test('history task works by keyboard, with meaningful evidence feedback',async()=>run(async page=>{
  await page.goto(base+historyPath);
  // Native select type-ahead works consistently in the installed macOS headless browser.
  await page.locator('#task').focus();await page.keyboard.press('m');await page.keyboard.press('Tab');
  assert.equal(await page.locator('#task').inputValue(),'accepted-alliance');
  await page.locator('#category').focus();await page.keyboard.press('n');await page.keyboard.press('Tab');
  await page.locator('#check').focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('#feedback').textContent(),/Your selection fits/);
  assert.match(await page.locator('#feedback').textContent(),/does not prove rejection/);
  await page.locator('#evidence').selectOption('proposal');await page.locator('#check').click();
  assert.match(await page.locator('#feedback').textContent(),/Reconsider which passage/);
}));
test('literature notes, reload, sharing and erasure preserve privacy',async()=>run(async(page,context)=>{
  await page.goto(base+literaturePath);
  await page.locator('#lens').selectOption('punctuation');
  assert.match(await page.locator('#lens-detail').textContent(),/exclamation/);
  await page.locator('#notes').fill('PRIVATE reading <img src=x onerror=alert(1)>');
  await page.reload();assert.match(await page.locator('#notes').inputValue(),/PRIVATE/);
  assert.equal(await page.locator('#lens').inputValue(),'punctuation');
  await page.locator('#share').click();
  const shared=await page.locator('#share-url').inputValue();assert.ok(!shared.includes('PRIVATE'));assert.ok(shared.includes('lens=punctuation'));
  const download=page.waitForEvent('download');await page.locator('#export').click();
  const file=await download;const notes=JSON.parse(await readFile(await file.path(),'utf8'));
  assert.equal(notes.explorationId,'x-literature-0001');assert.match(notes.notes,/PRIVATE/);
  await page.locator('#reset').click();await page.reload();assert.equal(await page.locator('#notes').inputValue(),'');
  assert.equal(await page.locator('#lens').inputValue(),'number');
}));
test('saved-state errors and denied storage fail gracefully',async()=>run(async(page)=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('disabled')};Storage.prototype.setItem=()=>{throw new Error('disabled')};});
  await page.goto(base+historyPath+'#v=99&task=anything');
  await page.locator('#task').waitFor();assert.match(await page.locator('#state-status').textContent(),/unsupported/);
  await page.locator('#notes').fill('Local only');assert.match(await page.locator('#save-status').textContent(),/unavailable/);
  await page.locator('#check').click();assert.ok((await page.locator('#feedback').textContent()).length>0);
}));
test('all content and comparison guides remain usable with JavaScript disabled',async()=>run(async page=>{
  for(const path of [historyPath,literaturePath]){
    await page.goto(base+path);
    assert.ok(await page.locator('h1').isVisible());assert.equal(await page.locator('blockquote').count(),3);
    await page.locator('.static-guide summary').click();assert.ok(await page.locator('.static-guide section').first().isVisible());
    assert.match(await page.locator('.transfer').textContent(),/careful explanation/);
  }
  assert.equal(await page.locator('blockquote[lang="ja"]').textContent(),'古池や蛙飛こむ水のおと');
},{javaScriptEnabled:false}));
test('desktop and phone layouts work in both themes without overflow',async()=>{
  for(const width of [1280,320])for(const colorScheme of ['light','dark'])await run(async page=>{
    for(const [name,path] of [['history',historyPath],['literature',literaturePath]]){
      await page.goto(base+path);await page.locator('#notes').waitFor();
      for(const summary of await page.locator('details summary').all())await summary.click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' overflow');
      await page.screenshot({path:shots+'/'+name+'-'+width+'-'+colorScheme+'.png',fullPage:true});
    }
  },{viewport:{width,height:900},colorScheme});
});
test('direct loading and relative assets work under a static project prefix',async()=>run(async page=>{
  await page.goto(base+'/project'+historyPath+'#v=1&task=single-cause&evidence=none&category=unsupported');
  await page.locator('#check').click();assert.match(await page.locator('#feedback').textContent(),/Your selection fits/);
  const href=await page.locator('.related a').first().getAttribute('href');
  assert.ok(new URL(href,page.url()).pathname==='/project/');
  await page.reload();assert.equal(await page.locator('#task').inputValue(),'single-cause');
}));


test('page anchors preserve work and changed selections invalidate a displayed share link',async()=>run(async page=>{
  await page.goto(base+historyPath);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>new Promise((resolve,reject)=>{window.rejectClipboard=reject;})}});});
  await page.locator('#task').selectOption('single-cause');
  await page.locator('#notes').fill('Keep my evidence note');
  await page.locator('#share').click();assert.ok(await page.locator('#share-url').isVisible());
  await page.locator('#category').selectOption('unsupported');
  await page.evaluate(()=>window.rejectClipboard(new Error('Permission denied after the selection changed')));
  assert.equal(await page.locator('#share-url').isVisible(),false);
  await page.locator('.skip').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#task').inputValue(),'single-cause');
  assert.equal(await page.locator('#notes').inputValue(),'Keep my evidence note');
  assert.equal(await page.locator('#state-status').textContent(),'');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
  await page.reload();assert.equal(await page.locator('#task').inputValue(),'single-cause');
  await page.locator('.static-guide summary').click();
  await page.locator('.static-guide a').first().click();
  assert.equal(await page.locator('#task').inputValue(),'single-cause');
}));
test('corrupt saved notes survive edits and failed erasure is never reported as success',async()=>run(async page=>{
  await page.goto(base+literaturePath);
  const key=await page.evaluate(()=>{const r=JSON.parse(document.querySelector('#exploration-data').textContent);return 'atlas.exploration.v1.'+r.id+'.'+r.revision;});
  await page.evaluate(key=>localStorage.setItem(key,'BROKEN saved data worth recovering'),key);
  await page.reload();assert.match(await page.locator('#save-status').textContent(),/not been overwritten/);
  await page.locator('#notes').fill('New unsaved note');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'BROKEN saved data worth recovering');
  const pending=page.waitForEvent('download');await page.locator('#export').click();
  const downloaded=await pending, exported=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.equal(exported.unrestoredSavedData,'BROKEN saved data worth recovering');assert.equal(exported.notes,'New unsaved note');
  await page.evaluate(()=>{Storage.prototype.removeItem=()=>{throw new Error('Denied')};});
  await page.locator('#reset').click();assert.match(await page.locator('#save-status').textContent(),/erasure could not be confirmed/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'BROKEN saved data worth recovering');
}));
test('revision upgrades keep earlier notes exportable and reset only the current revision',async()=>run(async page=>{
  await page.goto(base+literaturePath);
  const oldKey='atlas.exploration.v1.x-literature-0001.0.1.1';
  await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({revision:'0.1.1',state:{lens:'order'},notes:'Earlier reading'}));localStorage.setItem('atlas.progress.test','existing atlas progress');},oldKey);
  await page.reload();assert.equal(await page.locator('#notes').inputValue(),'');
  const pending=page.waitForEvent('download');await page.locator('#previous-notes').click();
  const downloaded=await pending, exported=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.equal(JSON.parse(exported.earlier[0].savedData).notes,'Earlier reading');
  await page.locator('#notes').fill('Current reading');await page.locator('#reset').click();
  assert.match(await page.evaluate(key=>localStorage.getItem(key),oldKey),/Earlier reading/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('atlas.progress.test')),'existing atlas progress');
}));
test('text and control contrast plus enlarged text remain usable in both themes',async()=>{
  for(const colorScheme of ['light','dark'])await run(async page=>{
    for(const path of [historyPath,literaturePath]){
      await page.goto(base+path);await page.locator('#notes').waitFor();
      const ratios=await page.evaluate(()=>{
        const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
        const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
        const body=getComputedStyle(document.body), control=getComputedStyle(document.querySelector('#notes')), muted=getComputedStyle(document.querySelector('.scope'));
        return {body:contrast(body.color,body.backgroundColor),muted:contrast(muted.color,body.backgroundColor),boundary:contrast(control.borderTopColor,control.backgroundColor)};
      });
      assert.ok(ratios.body>=4.5);assert.ok(ratios.muted>=4.5);assert.ok(ratios.boundary>=3);
      await page.addStyleTag({content:'html{font-size:200%} body{font-size:32px}'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('#notes').getAttribute('aria-describedby'),'notes-help');
    }
  },{viewport:{width:320,height:900},colorScheme});
});

test('argument editing supports keyboard moves, role changes and private notes',async()=>run(async page=>{
  await page.goto(base+'/labs/atlas/x-philosophy-0001/');
  await page.locator('#premise-choice').selectOption('ask-fair-terms');assert.match(await page.locator('#premise-preview').textContent(),/reasonably accept/);
  await page.locator('#load-guide').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#argument-list li').count(),3);
  const down=page.locator('#argument-list button[data-move="down"]').first();await down.focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('#argument-list li').first().textContent(),/actual need/);
  await page.locator('#actor').selectOption('quiet');assert.match(await page.locator('#role-context').textContent(),/other person still enjoys music/);
  await page.locator('#argument-list button[data-move="remove"]').first().click();assert.equal(await page.locator('#argument-list li').count(),2);
  await page.locator('#notes').fill('PRIVATE argument');await page.reload();
  assert.equal(await page.locator('#argument-list li').count(),2);assert.equal(await page.locator('#notes').inputValue(),'PRIVATE argument');
  await page.locator('#share').click();const url=await page.locator('#share-url').inputValue();assert.ok(!url.includes('PRIVATE'));assert.ok(url.includes('premises='));
  await page.locator('#guide').selectOption('attention');await page.locator('#load-guide').click();assert.equal(await page.locator('#action').inputValue(),'negotiate');
  assert.match(await page.locator('#argument-feedback').textContent(),/does not establish/);
}));
test('data point selection keeps duplicate magnitudes, sample identities and synthetic model separate',async()=>run(async page=>{
  await page.goto(base+'/labs/atlas/x-agriculture-0001/');
  await page.locator('#point').selectOption('902');assert.match(await page.locator('#point-detail').textContent(),/19.12%/);
  await page.locator('#point').selectOption('904');assert.match(await page.locator('#point-detail').textContent(),/12.21%/);
  await page.locator('#compare').selectOption('US-DFC_1_010');assert.equal(await page.locator('#measured-plot .point-compare').count(),93);
  const observed=await page.locator('#point-detail').textContent();
  await page.locator('#upper').fill('0.1');await page.locator('#lower').focus();assert.match(await page.locator('#model-result').textContent(),/upper fraction must be at least/);
  await page.locator('#upper').fill('0.30');await page.locator('#lower').focus();assert.match(await page.locator('#model-result').textContent(),/60 mm/);
  assert.equal(await page.locator('#point-detail').textContent(),observed);
  await page.locator('#sample').selectOption('US-DFC_1_050');assert.equal(await page.locator('#point option').count(),83);assert.ok(!(await page.locator('#point-detail').textContent()).includes('row 904'));
  await page.locator('#notes').fill('PRIVATE soil');await page.locator('#share').click();const url=await page.locator('#share-url').inputValue();assert.ok(!url.includes('PRIVATE'));assert.ok(url.includes('sample=US-DFC_1_050'));
  await page.reload();assert.equal(await page.locator('#sample').inputValue(),'US-DFC_1_050');assert.equal(await page.locator('#notes').inputValue(),'PRIVATE soil');
}));
test('new methods retain complete text and tables with JavaScript disabled',async()=>run(async page=>{
  await page.goto(base+'/labs/atlas/x-philosophy-0001/');await page.locator('.static-guide summary').click();assert.equal(await page.locator('.static-guide section').count(),2);
  await page.goto(base+'/labs/atlas/x-agriculture-0001/');assert.equal(await page.locator('tbody tr').count(),278);
  await page.locator('.data-table summary').first().click();assert.ok(await page.locator('tbody tr').first().isVisible());assert.match(await page.locator('.synthetic').textContent(),/60 mm/);
},{javaScriptEnabled:false}));
test('new methods fit narrow layouts in both themes and enlarged text',async()=>{
  for(const colorScheme of ['light','dark']) await run(async page=>{
    for(const slug of ['philosophy','agriculture']){
      await page.goto(base+'/labs/atlas/x-'+slug+'-0001/');await page.locator('#notes').waitFor();
      if(slug==='philosophy')await page.locator('#load-guide').click();else {await page.locator('.data-table summary').first().click();assert.ok(await page.locator('#measured-plot').evaluate(el=>el.scrollWidth>el.clientWidth));assert.equal(await page.locator('#measured-plot').getAttribute('tabindex'),'0');await page.locator('#measured-plot').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.getElementById('measured-plot').scrollLeft>0);assert.match(await page.locator('#plot-legend').textContent(),/scroll the chart horizontally/);}
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:shots+'/'+slug+'-'+colorScheme+'-320.png',fullPage:true});
      await page.addStyleTag({content:'html{font-size:200%} body{font-size:32px}'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
  },{viewport:{width:320,height:900},colorScheme});
});
const craftPath='/labs/atlas/x-craft-0001/',performancePath='/labs/atlas/x-performance-0001/';
test('weave controls preserve crossing identity, whole-strip repair and private saved work',async()=>run(async page=>{
 await page.goto(base+craftPath);await page.locator('#row').selectOption('3');await page.locator('#column').selectOption('2');
 assert.match(await page.locator('#crossing-readout').textContent(),/F3\/W2; screen column 2.*Warp W2 is visible/);
 await page.locator('#view').selectOption('back');assert.match(await page.locator('#crossing-readout').textContent(),/F3\/W2; screen column 5.*Weft F3 is visible/);
 await page.locator('#weave-error').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#weave-diagnosis').textContent(),/1 crossings differ/);
 await page.locator('#row').selectOption('4');await page.locator('#weave-error').click();assert.match(await page.locator('#weave-diagnosis').textContent(),/2 crossings differ/);
 await page.locator('#weave-repair').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#weave-diagnosis').textContent(),/1 crossings differ/);assert.match(await page.locator('#repair-history').textContent(),/F4/);
 await page.locator('#step').selectOption('2');assert.equal(await page.locator('#weave-error').isDisabled(),true);assert.equal(await page.locator('#weave-repair').isDisabled(),true);
 await page.locator('#notes').fill('PRIVATE making note');await page.reload();assert.equal(await page.locator('#view').inputValue(),'back');assert.equal(await page.locator('#step').inputValue(),'2');assert.equal(await page.locator('#notes').inputValue(),'PRIVATE making note');
 await page.locator('#share').click();const url=await page.locator('#share-url').inputValue();assert.ok(url.includes('view=back')&&url.includes('cells='));assert.ok(!url.includes('PRIVATE'));
 await page.locator('#weave-restore').click();assert.match(await page.locator('#weave-diagnosis').textContent(),/0 crossings differ/);
}));
test('real native audio plays, pauses, resumes and stops the exact rendered replay region',async()=>run(async page=>{
 await page.goto(base+performancePath);assert.equal(await page.locator('#phrase-player').getAttribute('src'),null);
 await page.locator('#bpm').selectOption('120');await page.locator('#region').selectOption('first');await page.locator('#phrase-play').click();
 await page.waitForFunction(()=>{const a=document.getElementById('phrase-player');return !a.paused&&a.currentTime>.2;});
 assert.equal(await page.locator('#phrase-player').evaluate(a=>a.duration),2);
 const before=await page.locator('#phrase-player').evaluate(a=>a.currentTime);await page.locator('#phrase-play').click();assert.ok(await page.locator('#phrase-player').evaluate(a=>a.currentTime)>=before);
 await page.locator('#phrase-pause').click();const paused=await page.locator('#phrase-player').evaluate(a=>({paused:a.paused,time:a.currentTime}));assert.ok(paused.paused&&paused.time>.2);
 await page.waitForTimeout(180);assert.ok(Math.abs(await page.locator('#phrase-player').evaluate(a=>a.currentTime)-paused.time)<.01);
 await page.locator('#phrase-play').click();await page.waitForFunction(t=>document.getElementById('phrase-player').currentTime>t+.1,paused.time);
 await page.locator('#phrase-stop').click();assert.equal(await page.locator('#phrase-player').evaluate(a=>a.paused),true);assert.equal(await page.locator('#playback-position').getAttribute('data-beat'),'0');
 await page.locator('#region').selectOption('second');await page.locator('#phrase-play').click();await page.waitForFunction(()=>document.getElementById('phrase-player').ended);assert.equal(await page.locator('#playback-position').getAttribute('data-beat'),'8');assert.match(await page.locator('#playback-status').textContent(),/finished/);
}));
test('event seek, source changes and reset use media time without stale playback',async()=>run(async page=>{
 await page.goto(base+performancePath);await page.locator('#event').selectOption('e7');await page.locator('#phrase-seek').click();
 assert.equal(await page.locator('#playback-position').getAttribute('data-beat'),'5.5');await page.locator('#phrase-play').click();
 await page.waitForFunction(()=>{const a=document.getElementById('phrase-player');return !a.paused&&a.currentTime>5.5*60/90;});
 await page.locator('#version').selectOption('sustained');assert.equal(await page.locator('#phrase-player').evaluate(a=>a.paused),true);assert.equal(await page.locator('#phrase-player').getAttribute('src'),null);
 await page.locator('#phrase-play').click();await page.waitForFunction(()=>!document.getElementById('phrase-player').paused);await page.locator('#volume').fill('0.1');assert.equal(await page.locator('#phrase-player').evaluate(a=>a.volume),.1);
 await page.locator('#bpm').selectOption('120');assert.equal(await page.locator('#phrase-player').evaluate(a=>a.paused),true);
 await page.locator('#reset').click();await page.locator('#phrase-play').click();await page.waitForFunction(()=>!document.getElementById('phrase-player').paused);await page.locator('#reset').click();assert.equal(await page.locator('#phrase-player').evaluate(a=>a.paused),true);assert.equal(await page.locator('#playback-position').getAttribute('data-beat'),'0');
}));
test('blocked audio and stale play promises leave honest, usable text alternatives',async()=>run(async page=>{
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Blocked for test','NotAllowedError'));});
 await page.goto(base+performancePath);await page.locator('#phrase-play').click();await page.waitForFunction(()=>document.getElementById('playback-status').textContent.includes('could not start'));
 assert.equal(await page.locator('#event-table tbody tr').count(),9);
 await page.evaluate(()=>{HTMLMediaElement.prototype.play=()=>new Promise(resolve=>{window.resolvePlay=resolve;});});
 await page.locator('#phrase-play').click();await page.locator('#region').selectOption('second');await page.evaluate(()=>window.resolvePlay());assert.match(await page.locator('#playback-status').textContent(),/Stopped/);assert.equal(await page.locator('#phrase-player').evaluate(a=>a.paused),true);
}));
test('WAV download retains exact provenance and pending terms without sharing private notes',async()=>run(async page=>{
 await page.goto(base+performancePath);await page.locator('#version').selectOption('sustained');await page.locator('#bpm').selectOption('120');await page.locator('#region').selectOption('second');await page.locator('#notes').fill('PRIVATE listener note');
 const pending=page.waitForEvent('download');await page.locator('#phrase-download').click();const download=await pending,bytes=await readFile(await download.path()),offset=44+bytes.readUInt32LE(40),length=bytes.readUInt32LE(offset+16);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.readUInt32LE(40),96000*2);assert.equal(bytes.subarray(offset+8,offset+16).toString(),'INFOICMT');
 const meta=JSON.parse(bytes.subarray(offset+20,offset+20+length-1).toString());assert.equal(meta.events.length,9);assert.equal(meta.selection.region,'second');assert.equal(meta.synthesis.frequencyHz,440);assert.equal(meta.assetRights.status,'local-draft');assert.ok(!JSON.stringify(meta).includes('PRIVATE'));
 await page.locator('#share').click();assert.ok(!(await page.locator('#share-url').inputValue()).includes('PRIVATE'));await page.reload();assert.equal(await page.locator('#notes').inputValue(),'PRIVATE listener note');assert.equal(await page.locator('#phrase-player').getAttribute('src'),null);
}));
test('studio static alternatives expose all seven stages and both full event tables',async()=>run(async page=>{
 await page.goto(base+craftPath);await page.locator('.static-guide summary').click();assert.equal(await page.locator('.static-guide section').count(),7);assert.equal(await page.locator('#weave-table tbody tr').count(),6);
 await page.goto(base+performancePath);await page.locator('.static-guide summary').click();assert.equal(await page.locator('.static-guide tbody tr').count(),18);assert.match(await page.locator('.static-guide').textContent(),/does not reproduce hearing/);
},{javaScriptEnabled:false}));
test('studio diagrams remain keyboard scrollable and readable at narrow widths and enlarged text',async()=>{
 for(const width of [1280,320])for(const colorScheme of ['light','dark'])await run(async page=>{
  for(const [slug,diagram] of [['craft','weave'],['performance','phrase']]){
   await page.goto(base+'/labs/atlas/x-'+slug+'-0001/');await page.locator('#notes').waitFor();const figure=page.locator('#'+diagram+'-diagram');await figure.scrollIntoViewIfNeeded();
   if(slug==='performance')assert.ok((await page.locator('#event-table th').first().boundingBox()).height<100);
   if(width===320){assert.ok(await figure.evaluate(el=>el.scrollWidth>el.clientWidth));await figure.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(id=>document.getElementById(id).scrollLeft>0,diagram+'-diagram');}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:shots+'/'+slug+'-'+width+'-'+colorScheme+'.png'});
   await page.addStyleTag({content:'html{font-size:200%} body{font-size:32px}'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
 },{viewport:{width,height:900},colorScheme});
});
