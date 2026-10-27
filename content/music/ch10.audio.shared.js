// Declared generated excerpts. The plotted line spectrum is the steady-state
// periodic signal; finite ramps add window leakage to the played excerpt.
import {ratio,fejer} from './ch10.shared.js';
const rate=44100;
function extent(duration,sampleRate){if(sampleRate!==rate||!Number.isFinite(duration)||duration<=0||duration>60)throw new RangeError('audio extent');return Math.ceil(duration*sampleRate);}
export function eventAudio({events,duration,sampleRate=rate}) {
  const n=extent(duration,sampleRate),raw=new Float64Array(n),width=.04;
  for(const e of events){
    if(!e||!Number.isFinite(e.time)||e.time<0||e.time>=duration||!Number.isFinite(e.frequency)||e.frequency<100||e.frequency>2000||!Number.isFinite(e.gain)||e.gain<0||e.gain>1)throw new RangeError('audio event');
    const start=Math.ceil(e.time*sampleRate),end=Math.min(n,Math.ceil((e.time+width)*sampleRate));
    for(let i=start;i<end;i++){const u=i/sampleRate-e.time;raw[i]+=e.gain*Math.sin(Math.PI*u/width)**2*Math.exp(-80*u)*Math.sin(2*Math.PI*e.frequency*u);}
  }
  // A finite excerpt may cut through the last click. Prescribe a10-ms end fade.
  for(let i=0;i<n;i++)raw[i]*=Math.max(0,Math.min(1,(n-1-i)/(.01*sampleRate)));
  let peak=0;for(const y of raw)peak=Math.max(peak,Math.abs(y));
  const gain=peak>.72?.72/peak:1,data=Float32Array.from(raw,x=>x*gain);
  return {data,sampleRate,duration:n/sampleRate,unscaledPeak:peak,gain,events:events.map(e=>({...e}))};
}
export function ratioAudio({pair='3:2',rate=50,duration=3,sampleRate=44100}={}) {
  const n=extent(duration,sampleRate),z=ratio({pair,rate}),data=new Float32Array(n);
  for(let i=0;i<n;i++){
    const ramp=Math.max(0,Math.min(1,i/(.01*sampleRate),(n-1-i)/(.01*sampleRate)));
    data[i]=.32*(fejer(z.frequencies[0]*i/sampleRate,z.harmonics[0])+fejer(z.frequencies[1]*i/sampleRate,z.harmonics[1]))*ramp;
  }
  return {data,sampleRate,duration:n/sampleRate,frequencies:z.frequencies,harmonics:z.harmonics};
}
