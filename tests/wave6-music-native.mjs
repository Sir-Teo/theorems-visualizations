import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import chapter from '../content/music/ch10.js';
import syllabus from '../content/music/syllabus.js';
import {stateURL} from '../assets/js/share-state.js';
import {installMusicProbe,captureMusic,musicScreenshot} from './wave6-music-browser.shared.mjs';
import {musicScience} from './wave6-music-native-science.mjs';
import {expectedMusicAudio,compareBackendAudio} from './wave6-music-native-audio.mjs';
import {criticalCases,rawControls} from './wave6-music-native-cases.mjs';
const built=JSON.parse(fs.readFileSync(new URL('../data/col/music.json',import.meta.url))),outline=syllabus.chapters.find(c=>c.n===10).items;
for(const item of chapter.items){const row=outline.find(i=>i.num===item.num);assert.equal(row.pic,item.caption,'preflight: exact researched caption mirror');assert.deepEqual(row.refs,item.refs,'preflight: researched references');assert.equal(built['music-'+item.num].st,item.statement,'preflight: build matches statement');assert.equal(built['music-'+item.num].scope,item.scope,'preflight: build matches scope');}
const out=process.env.MUSIC_SHOTS||'/tmp/wave6-music-native';fs.mkdirSync(out,{recursive:true});
const ids=(process.env.MUSIC_ITEMS||'1,2,3,4,5,6,7,8,9,10,11,12,13').split(',').map(Number),widths=(process.env.MUSIC_WIDTHS||'320,1200').split(',').map(Number),themes=(process.env.MUSIC_THEMES||'light,dark').split(',');
const server=createServer();await new Promise(r=>server.listen(0,r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});
await installMusicProbe(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const totals={layouts:0,actions:0,shares:0,invalid:0,raw:0,critical:0,checks:0,modelComparisons:0,domRangeRounding:0,audioBuffers:0,audioSamples:0,audioClocks:0,audioStops:0,audioNaturalEnds:0,audioParameterStops:0,customActions:0};const rows=[];
const sources=[...fs.readdirSync(new URL('../content/music/',import.meta.url)).filter(p=>/^ch10(?:\.[a-z]+)*\.js$/.test(p)).map(p=>'../content/music/'+p),'../content/music/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../assets/js/app.js','../assets/css/style.css','./fixtures/wave6-music-reference.json','./fixtures/wave6-music-audio-reference.json','./fixtures/wave6-music-source-facts.json','../data/col/music.json','../data/index.json','./wave6-music-native.mjs','./wave6-music-native-science.mjs','./wave6-music-native-cases.mjs','./wave6-music-browser.shared.mjs','../content/music/ch10.audio.shared.js','./wave6-music-native-audio.mjs'];
const sourceHashes=Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));
async function check(id,label){
 if(process.env.MUSIC_STOP_FILE&&fs.existsSync(process.env.MUSIC_STOP_FILE))throw Error('Native run stopped through its explicit stop file; finally closes browser/server.');
 const q=await captureMusic(page);assert.equal(q.drawErrors.length,0,label+' draw error '+q.drawErrors.join(' '));assert.equal(errors.length,0,label+' page errors '+errors.join(' '));assert.equal(q.issues.length,0,label+' ink/geometry '+JSON.stringify(q.issues.slice(0,6)));totals.modelComparisons+=musicScience(id,q);totals.domRangeRounding+=q.domThumbRoundingCount;totals.checks++;return q;
}
async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/music-10.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>document.querySelector('.viz-error')||window.__musicRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await check(id,`${id}/${theme}/${width}`);assert.equal(q.theme,theme);return q;
}
async function share(id,theme,width,label){
 const before=await check(id,label+' before Share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();totals.actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/music-10.${id}?s=`));const after=await open(id,theme,width,url);assert.deepEqual(after.state.parts,before.state.parts,label+' exact actual Share replay');assert.equal(after.readout,before.readout,label+' identical shared readout');totals.shares++;return after;
}
function intended(baseline,c){const state=structuredClone(baseline);for(const[label,value]of Object.entries(c.sliders??{})){const part=state.parts.find(([k])=>k.startsWith('slider:'+label+':'));assert.ok(part,'case slider '+label);part[1]=value;}for(const[label,value]of Object.entries(c.selects??{})){const part=state.parts.find(([k])=>k.startsWith('select:'+label+':'));assert.ok(part,'case select '+label);const i=part[1][1].findIndex(option=>String(option)===String(value));assert.ok(i>=0,'case option '+value);part[1][0]=i;}for(const[label,value]of Object.entries(c.toggles??{})){const part=state.parts.find(([k])=>k.startsWith('toggle:'+label+':'));assert.ok(part,'case toggle '+label);part[1]=value;}for(const[name,value]of Object.entries(c.custom??{})){const part=state.parts.find(([k])=>k.startsWith('custom:'+name+':'));assert.ok(part,'custom '+name);part[1]=structuredClone(value);}if(c.clock!==undefined)state.parts.find(([k])=>k.startsWith('clock:'))[1]=c.clock;if(c.camera)state.parts.find(([k])=>k.startsWith('camera:'))[1]=c.camera;return state;}

async function controls(id,theme,width,label){
 const seen=new Set();
 async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of['Home','End']){await el.press(key);totals.actions++;await check(id,label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);totals.actions++;await check(id,label+' native position '+name);await share(id,theme,width,label+' '+name);}}
 await sliders();
 const toggles=await page.locator('#viz .ctl-toggle').evaluateAll(es=>es.map(e=>e.textContent.trim()));
 for(const name of toggles){const el=page.getByLabel(name,{exact:true});if(!await el.isVisible())continue;const original=await el.isChecked();for(const value of[!original,original]){if(await el.isChecked()!==value)await el.locator('..').click();assert.equal(await el.isChecked(),value,'visible native switch toggled');totals.actions++;await check(id,label+' native toggle '+name+' '+value);await share(id,theme,width,label+' toggle '+name);if(width===320)await musicScreenshot(page,`${out}/${label}-toggle-${name.replace(/[^a-z0-9]/gi,'_')}-${value}.png`);}}
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const[name,options]of groups){let group=page.getByRole('group',{name,exact:true});if(!await group.isVisible())continue;const original=await group.locator('button.on').textContent();for(const option of options){group=page.getByRole('group',{name,exact:true});await group.getByRole('button',{name:option,exact:true}).click();totals.actions++;await check(id,label+' '+option);await sliders();await share(id,theme,width,label+' '+option);if(width===320)await musicScreenshot(page,`${out}/${label}-mode-${name.replace(/[^a-z0-9]/gi,'_')}-${option.replace(/[^a-z0-9]/gi,'_')}.png`);}await page.getByRole('group',{name,exact:true}).getByRole('button',{name:original,exact:true}).click();totals.actions++;await check(id,label+' restore '+name);}

}
async function animation(id,theme,width,label){

 const before=await check(id,label+' before animation'),gold=q=>q.stages.map(s=>({lines:s.lines.filter(x=>x.style.color==='gold'),dots:s.dots.filter(x=>x.style.color==='gold')}));
 await page.getByRole('button',{name:'Play animation',exact:true}).click();totals.actions++;await page.waitForTimeout(650);await page.getByRole('button',{name:'Pause animation',exact:true}).click();totals.actions++;
 const moved=await check(id,label+' actual clock advance');assert.ok(moved.state.parts.find(([k])=>k.startsWith('clock:'))[1]>0,'native clock advanced');assert.notDeepEqual(gold(moved),gold(before),'actual scientific cursor moved');await share(id,theme,width,label+' paused animation');
 await page.getByRole('button',{name:'Restart animation',exact:true}).click();totals.actions++;const reset=await check(id,label+' animation reset');assert.equal(reset.state.parts.find(([k])=>k.startsWith('clock:'))[1],0);

}
async function customControls(id,theme,width,label){
 if(id===1){for(const name of['Tap a pulse','Tap a pulse','Tap a pulse','Clear taps','Load authored taps']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(90);totals.actions++;totals.customActions++;const q=await check(id,label+' '+name);const taps=q.state.parts.find(([k])=>k.startsWith('custom:tap-offsets:'))[1];if(name==='Clear taps')assert.deepEqual(taps,[]);else assert.ok(taps.length>0);if(name!=='Tap a pulse'||taps.length===3)await share(id,theme,width,label+' '+name);}}
 if([3,6,7].includes(id)){
  for(const name of['Toggle selected step','Clear onsets','Reset pattern',...(id===7?['Load authored contrast']:[])]){const before=await check(id,label+' before '+name);await page.getByRole('button',{name,exact:true}).click();totals.actions++;totals.customActions++;const after=await check(id,label+' '+name);const word=after.state.parts.find(([k])=>k.startsWith('custom:onset-mask:'))[1];if(name==='Clear onsets')assert.equal(word,'0'.repeat(24));if(name==='Load authored contrast'){assert.equal(word,'0000000011111111'+'0'.repeat(8));assert.notEqual(after.models.syncopation.result.restContrast,after.models.syncopation.result.metricComplexity);}if(name==='Toggle selected step')assert.notDeepEqual(after.state.parts,before.state.parts);await share(id,theme,width,label+' '+name);if(width===320)await musicScreenshot(page,`${out}/${label}-custom-${name.replace(/[^a-z0-9]/gi,'_')}.png`);}
  const before=await check(id,label+' before canvas edit'),coords=await page.evaluate(id=>{const s=window.__musicRuntime.stages[0],rect=s.canvas.getBoundingClientRect(),x=id===7?3:1,y=0;return{x:rect.left+s.X(x),y:rect.top+s.Y(y)};},id);await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();const position=await page.evaluate(id=>{const s=window.__musicRuntime.stages[0],b=s.canvas.getBoundingClientRect();return{x:b.left+s.X(id===7?3:1),y:b.top+s.Y(0)};},id);await page.mouse.click(position.x,position.y);totals.actions++;totals.customActions++;const after=await check(id,label+' actual canvas edit');assert.notDeepEqual(after.state.parts,before.state.parts,'physical canvas click changes the saved word');await share(id,theme,width,label+' canvas edit');
 }
}
async function actualAudio(id,theme,width,label){
 const before=await check(id,label+' before Listen'),expected=expectedMusicAudio(id,before);
 await page.getByRole('button',{name:'Listen',exact:true}).click();totals.actions++;
 await page.waitForFunction(()=>window.__musicAC?.state==='running'&&window.__musicAudioNodes?.length>0);await page.waitForTimeout(180);
 const live=await page.evaluate(()=>{const rt=window.__musicRuntime;rt.frame();const entry=window.__musicAudioNodes.at(-1),ac=window.__musicAC;return{state:ac.state,time:ac.currentTime,start:entry.start,clock:rt.t,playing:rt.playing,ended:entry.ended};});
 assert.equal(live.state,'running');assert.ok(live.playing&&!live.ended);assert.ok(live.clock>0);assert.ok(Math.abs(live.clock-Math.max(0,live.time-live.start))<=.08,'visual clock follows actual scheduled audio time');totals.audioClocks++;
 const actual=await page.evaluate(()=>{const entry=window.__musicAudioNodes.at(-1),node=entry.node,data=node.buffer.getChannelData(0),bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return{base64:btoa(binary),spec:window.__musicAudioSpec,call:window.__musicSampleCalls.at(-1),channels:node.buffer.numberOfChannels,sampleRate:node.buffer.sampleRate,loop:node.loop,playbackRate:node.playbackRate.value};});
 const compared=compareBackendAudio(expected,actual);fs.writeFileSync(`${out}/${label}-actual-backend.f32`,compared.bytes);fs.writeFileSync(`${out}/${label}-audio.json`,JSON.stringify({expected,live,spec:actual.spec,call:actual.call,samples:compared.samples,peak:compared.peak,maxNormalizedError:compared.maxNormalizedError,bufferSHA256:createHash('sha256').update(compared.bytes).digest('hex')},null,2)+'\n');totals.audioBuffers++;totals.audioSamples+=compared.samples;
 await page.getByRole('button',{name:'Stop sound',exact:true}).click();totals.actions++;await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>window.__musicAudioNodes.every(x=>x.ended&&x.stopped)),'Stop ends actual backend nodes');totals.audioStops++;await check(id,label+' stopped audio');await share(id,theme,width,label+' paused audio cursor');
 for(const button of['Pause animation','Restart animation']){await page.getByRole('button',{name:'Listen',exact:true}).click();totals.actions++;await page.waitForTimeout(100);await page.getByRole('button',{name:button,exact:true}).click();totals.actions++;await page.waitForTimeout(120);await check(id,label+' '+button+' stops sound');assert.ok(await page.evaluate(()=>window.__musicAudioNodes.every(x=>x.ended&&x.stopped)),button+' ends actual backend');totals.audioStops++;}
 if(id===4){await page.getByRole('button',{name:'Listen',exact:true}).click();totals.actions++;await page.waitForFunction(()=>window.__musicAudioNodes.length&&window.__musicAudioNodes.every(x=>x.ended)&&!window.__musicRuntime.playing,null,{timeout:7000});totals.audioNaturalEnds++;await check(id,label+' natural audio end');}
 await page.getByRole('button',{name:'Listen',exact:true}).click();totals.actions++;await page.waitForTimeout(90);const slider=page.locator('#viz .ctl-slider input').first();if(await slider.count())await slider.press('ArrowRight');else{const options=page.locator('#viz .seg').first().locator('button:not(.on)');await options.first().click();}totals.actions++;await page.waitForTimeout(120);await check(id,label+' parameter edit stops sound');assert.ok(await page.evaluate(()=>window.__musicAudioNodes.every(x=>x.ended)&&window.__musicAudioNodes.at(-1).stopped), 'changing sound parameters ends prior actual backend');totals.audioParameterStops++;

}
function progress(){fs.writeFileSync(out+'/progress.json',JSON.stringify({totals,rows},null,2)+'\n');}
try{
 for(const id of ids)for(const theme of themes)for(const width of widths){
  const label=`${id}-${theme}-${width}`,start={...totals},baseline=await open(id,theme,width);await musicScreenshot(page,`${out}/${label}-default.png`);
  if(!process.env.MUSIC_SKIP_CONTROLS){await actualAudio(id,theme,width,label);await customControls(id,theme,width,label);await controls(id,theme,width,label);await animation(id,theme,width,label);}
  const custom=baseline.state.parts.find(([k])=>k.startsWith('custom:'));
  if(custom){for(const value of custom[0].includes('tap-offsets')?[[0,0],[1,2]]:['1','x'.repeat(24)]){const invalid=structuredClone(baseline.state);invalid.parts.find(([k])=>k===custom[0])[1]=value;invalid.parts.find(([k])=>k.startsWith('clock:'))[1]=1.25;const restored=await open(id,theme,width,stateURL(base,`music-10.${id}`,invalid));assert.deepEqual(restored.state.parts,baseline.state.parts,'invalid custom component rejects the whole payload');totals.invalid++;}}
 const bad=structuredClone(baseline.state),invalidSlider=bad.parts.find(([k])=>k.startsWith('slider:'));if(invalidSlider)invalidSlider[1]=1e99;else bad.parts.find(([k])=>k.startsWith('select:'))[1][0]=1e99;
  const rejected=await open(id,theme,width,stateURL(base,`music-10.${id}`,bad));assert.deepEqual(rejected.state.parts,baseline.state.parts,'whole invalid state returns fresh defaults');assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);totals.invalid++;if(invalidSlider){const fractional=structuredClone(baseline.state);fractional.parts.find(([k])=>k.startsWith('slider:'))[1]=baseline.controls[0].min+.5;const fallback=await open(id,theme,width,stateURL(base,`music-10.${id}`,fractional));assert.deepEqual(fallback.state.parts,baseline.state.parts,'fractional integer-control payload rejected whole');totals.invalid++;}
  if(rawControls[id]){const [rawName,rawValue]=rawControls[id],raw=intended(baseline.state,{sliders:{[rawName]:rawValue}}),rawAfter=await open(id,theme,width,stateURL(base,`music-10.${id}`,raw));assert.deepEqual(rawAfter.state.parts,raw.parts,'raw binary64 value restored exactly');await share(id,theme,width,label+' raw binary64');totals.raw++;}
  let caseNumber=0;
  for(const c of process.env.MUSIC_SKIP_CRITICAL?[]:criticalCases[id]){
   const wanted=intended(baseline.state,c),actual=await open(id,theme,width,stateURL(base,`music-10.${id}`,wanted));assert.deepEqual(actual.state.parts,wanted.parts,c.label+' exact intended components');await musicScreenshot(page,`${out}/${label}-critical-${caseNumber}.png`);await share(id,theme,width,label+' critical '+c.label);totals.critical++;caseNumber++;progress();
  }
  totals.layouts++;rows.push({id,theme,width,criticalCases:caseNumber,totals:Object.fromEntries(Object.keys(totals).map(k=>[k,totals[k]-start[k]]))});progress();console.log(JSON.stringify({label,totals}));
 }
 for(const[p,h]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex'),h,'tested source remained frozen: '+p);
 fs.writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',totals,rows,errors,sourceHashes},null,2)+'\n');
}catch(error){fs.writeFileSync(out+'/failure.txt',String(error.stack||error));try{fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await captureMusic(page),null,2));await page.screenshot({path:out+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
