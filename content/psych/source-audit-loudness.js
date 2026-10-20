/** A declared mid-level power-law approximation, not a Cambridge/ISO implementation. */
export const LOUDNESS_REFERENCE_M=Math.log10(2);
export function loudnessModel(L,delta,mode='nominal',custom=.3){
  if(!Number.isInteger(L)||L<40||L>80||!Number.isInteger(delta)||delta<0||delta>80-L||!['nominal','rounded','custom'].includes(mode)||!Number.isFinite(custom)||custom<.2||custom>.5)throw new RangeError('Levels40–80, integer permitted difference and declared exponent required');
  const m=mode==='nominal'?LOUDNESS_REFERENCE_M:mode==='rounded'?.3:custom,L2=L+delta,maxDelta=80-L,logN=x=>m*(x-40)/10,N=x=>10**logN(x),ref=x=>LOUDNESS_REFERENCE_M*(x-40)/10,doubling=10*Math.log10(2)/m;
  const dx=Array.from({length:maxDelta*2+1},(_,i)=>i/2);if(doubling<=maxDelta)dx.push(doubling);dx.sort((a,b)=>a-b);
  return{L,L2,delta,maxDelta,mode,custom,m,doubling,N1:N(L),N2:N(L2),ratio:10**(m*delta/10),referenceRatio:2**(delta/10),pressureRatio:10**(delta/20),intensityRatio:10**(delta/10),pressure1:20e-6*10**(L/20),pressure2:20e-6*10**(L2/20),levelCurve:Array.from({length:81},(_,i)=>[40+i/2,logN(40+i/2)]),levelReference:Array.from({length:81},(_,i)=>[40+i/2,ref(40+i/2)]),ratioCurve:[...new Set(dx)].map(d=>[d,m*d/10]),ratioReference:[...new Set(dx)].map(d=>[d,LOUDNESS_REFERENCE_M*d/10]),logN1:logN(L),logN2:logN(L2),logRatio:m*delta/10};
}
/** Two identical finite1-kHz carriers/envelopes with a specified digital RMS ratio.
 * Peak of the second tone is fixed.02; no difference cap or SPL calibration.
 */
export function loudnessAudio(delta){
  if(!Number.isInteger(delta)||delta<0||delta>40)throw new RangeError('Integer digital difference0–40dB required');
  const sampleRate=48000,frequency=1000,toneSamples=38400,gapSamples=19200,rampSamples=480,secondStart=toneSamples+gapSamples,gain2=.02,gain1=gain2*10**(-delta/20),samples=new Float32Array(toneSamples*2+gapSamples);
  for(let n=0;n<toneSamples;n++){const envelope=Math.min(1,n/rampSamples,(toneSamples-1-n)/rampSamples),wave=envelope*Math.sin(2*Math.PI*frequency*n/sampleRate);samples[n]=gain1*wave;samples[secondStart+n]=gain2*wave;}
  return{delta,sampleRate,frequency,toneSamples,gapSamples,rampSamples,secondStart,gain1,gain2,samples};
}
