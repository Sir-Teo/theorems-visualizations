// Run with node tests/verification-interactions.mjs. Exercises real Web Audio after browser gestures.
// Checks actual signal energy, finite source samples and absence of autoplay; no audio mocks.
import {chromium} from 'playwright-core';
import {loadAll} from '../scripts/lib.mjs';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {items}=await loadAll();
const targets=new Set(process.argv.slice(2));
const selected=items.filter(x=>['sig-3.15','sig-4.12','physio-4.14','pde-4.2'].includes(x.id)||(x.col==='music'&&[7,8].includes(x.chapter))||x.col==='ling').filter(x=>/\.sound(?:Button)?\(/.test(String(x.viz))).filter(x=>!targets.size||targets.has(x.id));
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1400}});const results=[];let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 const probe=window.__audioProbe={contexts:[],analysers:[],starts:[],invalid:[]};
 const Native=window.AudioContext;
 window.AudioContext=class extends Native {constructor(...a){super(...a);probe.contexts.push(this);}};
 const connect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(dest,...args){
   const out=connect.call(this,dest,...args);
   if(dest instanceof AudioDestinationNode){const ac=this.context,an=ac.createAnalyser(),mute=ac.createGain();an.fftSize=2048;mute.gain.value=0;connect.call(this,an);connect.call(an,mute);connect.call(mute,dest);probe.analysers.push(an);}
   return out;
 };
 for(const Klass of [AudioBufferSourceNode,OscillatorNode]){const start=Klass.prototype.start;Klass.prototype.start=function(...args){
   const rec={type:Klass.name};
   if(this.buffer){let peak=0;for(let c=0;c<this.buffer.numberOfChannels;c++)for(const x of this.buffer.getChannelData(c)){if(!Number.isFinite(x))probe.invalid.push('non-finite audio sample');peak=Math.max(peak,Math.abs(x));}rec.peak=peak;rec.frames=this.buffer.length;rec.rate=this.buffer.sampleRate;}
   else rec.frequency=this.frequency.value;
   probe.starts.push(rec);return start.apply(this,args);
 };}
});
try{
 for(const item of selected){
  errors=[];await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=${item.file}&id=${item.id}&wait=100`);await page.waitForFunction(()=>window.__done);
  if(item.id==='physio-4.14'){
    const listen=page.getByRole('button',{name:'Listen to synthetic noise',exact:true});await listen.click();await page.waitForTimeout(120);
    const silent=await page.evaluate(()=>window.__audioProbe.starts.length===0);
    if(!silent)throw new Error('Laminar stethoscope should be silent');
    await page.locator('input[type=range]').first().focus();await page.keyboard.press('Home');await page.waitForTimeout(120);
  }
  const before=await page.evaluate(()=>window.__audioProbe.starts.length);
  const btn=page.locator('#viz button').filter({has:page.locator('svg')}); const count=await btn.count();const buttons=[];
  for(let i=0;i<count;i++){
   if(!await btn.nth(i).isVisible())continue;
   const label=(await btn.nth(i).innerText()).trim(); if(!label)continue;
   await page.evaluate(()=>{window.__audioProbe.starts=[];window.__audioProbe.invalid=[];});
   await btn.nth(i).click();
   let energy=0;
   for(let k=0;k<8;k++){await page.waitForTimeout(100);energy=Math.max(energy,await page.evaluate(()=>Math.max(0,...window.__audioProbe.analysers.map(an=>{const a=new Float32Array(an.fftSize);an.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);}))));if(energy>1e-5)break;}
   const state=await page.evaluate(()=>({states:window.__audioProbe.contexts.map(x=>x.state),starts:window.__audioProbe.starts,invalid:window.__audioProbe.invalid}));
   buttons.push({label,energy,...state,ok:state.starts.length>0&&state.invalid.length===0&&energy>1e-5});
  }
  if(item.id==='music-8.17'){
    const canvases=page.locator('#viz canvas');
    for(let i=0;i<3;i++){
      await page.evaluate(()=>{window.__audioProbe.starts=[];window.__audioProbe.invalid=[];});
      const box=await canvases.nth(i).boundingBox();
      await canvases.nth(i).click({position:{x:box.width*0.55,y:box.height*0.6}});await page.waitForTimeout(160);
      const state=await page.evaluate(()=>({states:window.__audioProbe.contexts.map(x=>x.state),starts:window.__audioProbe.starts,invalid:window.__audioProbe.invalid,energy:Math.max(0,...window.__audioProbe.analysers.map(an=>{const a=new Float32Array(an.fftSize);an.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);}))}));
      buttons.push({label:['staff click','keyboard click','frequency-axis click'][i],...state,ok:state.starts.length>0&&state.invalid.length===0&&state.energy>1e-5});
    }
  }
  const r={id:item.id,autoplay:before>0,buttons,errors:[...errors],ok:before===0&&buttons.length>0&&buttons.every(x=>x.ok)&&errors.length===0};results.push(r);console.log(`${r.ok?'PASS':'FAIL'} ${item.id}: ${buttons.length} audio buttons${r.ok?'':JSON.stringify(r)}`);
 }
}finally{writeFileSync(join(tmpdir(),'atlas-audio-results.json'),JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify({items:results.length,buttons:results.reduce((s,x)=>s+x.buttons.length,0),failed:results.filter(x=>!x.ok).map(x=>x.id)}));
if(results.some(x=>!x.ok))process.exitCode=1;
