// Expected schedules from registered scientific state, independently of browser
// audio wrapper arguments. Numerical synthesis has its own Python reference gate.
import assert from 'node:assert/strict';
import * as H from '../content/music/ch10.shared.js';
import * as Audio from '../content/music/ch10.audio.shared.js';
import {musicArguments,musicState} from './wave6-music-native-science.mjs';
export function expectedMusicAudio(id,q){
 const{controls:c}=musicState(q),[family,a]=musicArguments(id,q),z=H[family](a),events=[];let duration;
 const cycles=(positions,period,frequency=800,gain=.8)=>{for(let cycle=0;cycle<2;cycle++)for(const x of positions)events.push({time:(cycle+x)*period,frequency,gain});return 2*period;};
 if(id===1){duration=480/a.bpm;for(let i=0;i<8;i++)events.push({time:i*60/a.bpm,frequency:900,gain:.8});}
 if(id===2){const T=60/c['eighth-note pulses per minute'];duration=2*z.n*T;for(let i=0;i<2*z.n;i++)events.push({time:i*T,frequency:i%z.n===0?1000:i%z.beat===0?750:500,gain:.25+.15*z.weights[i%z.n]});}
 if(id===3)duration=cycles(z.onsets.map(i=>i/a.n),a.n*60/c['step pulses per minute']);
 if(id===4)return{family:'ratioAudio',parameters:{pair:a.pair,rate:a.rate,duration:3}};
 if(id===5||id===6)duration=cycles(z.onsets.map(i=>i/a.n),a.n*.15);
 if(id===7)duration=cycles(z.bits.flatMap((x,i)=>x?[i/16]:[]),2.4);
 if(id===8){duration=2*z.duration/1000;for(let cycle=0;cycle<2;cycle++)for(const e of z.events)events.push({time:cycle*z.duration/1000+e.actual/1000,frequency:e.i%2?650:900,gain:e.i%2?.55:.9});}
 if(id===9){duration=6;for(const e of z.events)events.push({time:e.sample/100,frequency:1000,gain:.8*e.strength/20});for(const sample of z.predictedSamples)events.push({time:sample/100,frequency:600,gain:.5});}
 if(id===10)duration=cycles(z.starts.map(i=>i/z.n),z.n*.2);
 if(id===11){duration=12;const start=c['starting elapsed time (seconds)'];for(let voice=0;voice<2;voice++){const rate=a.bpm+voice*a.delta;for(let cycle=Math.floor(rate*start/(60*z.n))-1;cycle<=Math.ceil(rate*(start+duration)/(60*z.n));cycle++)for(const onset of z.onsets){const time=(60*(cycle*z.n+onset)-rate*start)/rate;if(time>=0&&time<duration)events.push({time,frequency:voice?650:1000,gain:.7});}}}
 if(id===12){duration=z.bars*.5;for(const r of z.rows)events.push({time:r.position*.5,frequency:r.sourceStrong?1000:r.source===null?500:700,gain:r.sourceWeight===null?.4:.25+.12*r.sourceWeight});}
 if(id===13){duration=2*z.duration;for(let cycle=0;cycle<2;cycle++){for(const time of z.quarters)events.push({time:cycle*z.duration+time,frequency:400,gain:.2});if(a.mode!=='one bar of 3/2')for(const e of z.first)events.push({time:cycle*z.duration+e.time,frequency:1000,gain:.8});if(a.mode!=='two bars of 3/4')for(const e of z.second)events.push({time:cycle*z.duration+e.time,frequency:700,gain:.8});}}
 return{family:'eventAudio',parameters:{duration,events}};
}
export function compareBackendAudio(expected,actual){
 assert.equal(actual.spec.family,expected.family);const near=(x,y)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=2e-12+2e-12*Math.abs(y),'actual audio schedule '+x+' expected '+y);
 near(actual.spec.parameters.duration,expected.parameters.duration);
 if(expected.family==='eventAudio'){assert.equal(actual.spec.parameters.events.length,expected.parameters.events.length);for(let i=0;i<expected.parameters.events.length;i++)for(const key of['time','frequency','gain'])near(actual.spec.parameters.events[i][key],expected.parameters.events[i][key]);}else for(const key of['pair','rate'])assert.equal(actual.spec.parameters[key],expected.parameters[key]);
 assert.equal(actual.channels,1);assert.equal(actual.sampleRate,44100);assert.equal(actual.loop,false);assert.equal(actual.playbackRate,1);assert.equal(actual.call.sampleRate,44100);assert.deepEqual(actual.call.options,{gain:.8,normalize:false});
 const reference=Audio[expected.family](expected.parameters),bytes=Buffer.from(actual.base64,'base64'),samples=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);assert.equal(samples.length,reference.data.length);assert.equal(actual.call.length,samples.length);assert.equal(actual.spec.length,samples.length);
 let maxNormalizedError=0,peak=0;for(let i=0;i<samples.length;i++){const x=samples[i],y=reference.data[i],ulp=y?2**(Math.floor(Math.log2(Math.abs(y)))-23):2**-149,error=Math.abs(x-y)/Math.max(1e-12,2*ulp);assert.ok(Number.isFinite(x)&&error<=1,'backend Float32 sample '+i);maxNormalizedError=Math.max(maxNormalizedError,error);peak=Math.max(peak,Math.abs(x));}
 assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);assert.ok(peak<=.7200001);return{bytes,samples:samples.length,maxNormalizedError,peak};
}
