// New chapter's pure, bounded rhythm models. No DOM or earlier product imports.
export const TAU = 2 * Math.PI;
export const mod = (x, n) => ((x % n) + n) % n;
const sum = a => a.reduce((s, x) => s + x, 0);
function integer(x, lo, hi, name) {
  if (!Number.isInteger(x) || x < lo || x > hi) throw new RangeError(name);
  return x;
}
function choice(x, values, name) {
  if (!values.includes(x)) throw new RangeError(name);
  return x;
}
export function bits(mask, n) {
  if (typeof mask !== 'string' || mask.length !== n || /[^01]/.test(mask)) throw new RangeError('binary rhythm');
  return [...mask].map(Number);
}
export const rotate = (a, r) => a.map((_, i) => a[mod(i - r, a.length)]);
export const canonical = a => Array.from({length:a.length}, (_,r) => rotate(a,r).join('')).sort()[0];
function cyclic(a) {
  const n = a.length, onsets = a.flatMap((x,i) => x ? [i] : []);
  const gaps = onsets.map((x,i) => mod(onsets[(i+1)%onsets.length]-x,n) || n);
  const period = Array.from({length:n},(_,i)=>i+1).find(r=>a.every((x,i)=>x===a[mod(i+r,n)]));
  const axes = Array.from({length:n},(_,i)=>i).filter(r=>a.every((x,i)=>x===a[mod(r-i,n)]));
  return {onsets,gaps,period,distinctRotations:period,stabilizer:n/period,canonical:canonical(a),reflectionAxes:axes};
}
function evenness(a) {
  const {onsets} = cyclic(a), n=a.length, k=onsets.length;
  const spans=Array.from({length:Math.max(0,k-1)},(_,j)=>{
    const q=j+1, values=onsets.map((x,i)=>mod(onsets[(i+q)%k]-x,n));
    return {q,min:Math.min(...values),max:Math.max(...values),values};
  });
  return {maximallyEven:spans.every(s=>s.max-s.min<=1),spans};
}
export function pulse({bpm=120,taps=[0,500,1000,1510,2000,2505]}={}) {
  integer(bpm,30,300,'bpm');
  if (!Array.isArray(taps)||taps.length>16||taps.some((x,i)=>!Number.isInteger(x)||x<0||x>180000||(i===0?x!==0:x<=taps[i-1]))) throw new RangeError('tap offsets');
  const period=60000/bpm, intervals=taps.slice(1).map((x,i)=>x-taps[i]);
  const mean=intervals.length?sum(intervals)/intervals.length:null, sorted=[...intervals].sort((a,b)=>a-b);
  const median=intervals.length?(sorted[Math.floor(sorted.length/2)]+sorted[Math.floor((sorted.length-1)/2)])/2:null;
  const variance=mean===null?null:sum(intervals.map(x=>(x-mean)**2))/intervals.length;
  return {args:{bpm,taps:[...taps]},period,intervals,mean,median,sd:variance===null?null:Math.sqrt(variance),cv:mean===null?null:Math.sqrt(variance)/mean,estimatedBpm:median===null?null:60000/median,intervalTempos:intervals.map(x=>60000/x),phaseErrors:taps.map((x,i)=>x-i*period),grid:Array.from({length:9},(_,i)=>i*period)};
}
export const METERS = Object.freeze({'3/4':{n:6,beat:2,levels:[1,2,6],names:['eighths','quarter beats','bar']},'4/4':{n:8,beat:2,levels:[1,2,4,8],names:['eighths','quarter beats','half bar','bar']},'6/8':{n:6,beat:3,levels:[1,3,6],names:['eighths','dotted-quarter beats','bar']},'12/8':{n:12,beat:3,levels:[1,3,6,12],names:['eighths','dotted-quarter beats','half bar','bar']}});
export function meter({signature='6/8'}={}) {
  choice(signature,Object.keys(METERS),'signature');const s=METERS[signature];
  const levels=s.levels.map((stride,i)=>({stride,name:s.names[i],positions:Array.from({length:s.n},(_,j)=>j).filter(j=>j%stride===0)}));
  return {args:{signature},n:s.n,beat:s.beat,levels,weights:Array.from({length:s.n},(_,i)=>levels.filter(l=>i%l.stride===0).length),groups:Array.from({length:s.n/s.beat},(_,i)=>({start:i*s.beat,end:(i+1)*s.beat}))};
}
export function necklace({n=16,mask='1001001000101000',rotation=0}={}) {
  integer(n,4,24,'steps');integer(rotation,0,23,'rotation');const original=bits(mask,n),a=rotate(original,rotation);
  return {args:{n,mask,rotation},bits:a,...cyclic(a),rotations:Array.from({length:n},(_,r)=>({rotation:r,mask:rotate(original,r).join(''),hamming:sum(rotate(original,r).map((x,i)=>Number(x!==original[i])))}))};
}
export function euclidean({n=13,k=5,rotation=0,progress=100}={}) {
  integer(n,2,24,'steps');integer(k,0,n,'onsets');integer(rotation,0,23,'rotation');integer(progress,0,100,'progress');
  let left=Array.from({length:k},()=>[1]),right=Array.from({length:n-k},()=>[0]);
  const frames=[{left:left.map(a=>[...a]),right:right.map(a=>[...a])}];
  while (left.length && right.length>1) {
    const m=Math.min(left.length,right.length),merged=left.slice(0,m).map((a,i)=>[...a,...right[i]]);
    right=(left.length>right.length?left:right).slice(m);left=merged;
    frames.push({left:left.map(a=>[...a]),right:right.map(a=>[...a])});
  }
  const original=[...left,...right].flat(),a=rotate(original,rotation),divisions=[];
  let x=Math.max(k,n-k),y=Math.min(k,n-k);
  while(y){const q=Math.floor(x/y),r=x%y;divisions.push({x,y,q,r});[x,y]=[y,r];}
  const floor=Array.from({length:n},(_,i)=>Number(Math.floor((i+1)*k/n)>Math.floor(i*k/n)));
  return {args:{n,k,rotation,progress},bits:a,...cyclic(a),...evenness(a),frames,selectedFrame:Math.floor(progress*(frames.length-1)/100),divisions,gcd:x,floorMask:floor.join(''),sameFloorNecklace:canonical(a)===canonical(floor)};
}
export function oddity({n=12,mask='100101001010',rotation=0}={}) {
  choice(n,[12,16,24],'even steps');integer(rotation,0,23,'rotation');const a=rotate(bits(mask,n),rotation),pairs=Array.from({length:n/2},(_,i)=>({a:i,b:i+n/2,first:a[i],second:a[i+n/2],conflict:!!(a[i]&&a[i+n/2])}));
  return {args:{n,mask,rotation},bits:a,...cyclic(a),pairs,conflicts:pairs.filter(p=>p.conflict).map(p=>[p.a,p.b]),holds:!pairs.some(p=>p.conflict),maximumOnsets:n/2};
}
export function syncopation({mask='1001001000101000',rotation=0}={}) {
  integer(rotation,0,15,'rotation');const a=rotate(bits(mask,16),rotation),weights=Array.from({length:16},(_,i)=>[1,2,4,8,16].filter(d=>i%d===0).length);
  function score(b){
    const onsets=b.flatMap((x,i)=>x?[i]:[]),contributions=onsets.map((onset,i)=>{
      const distance=mod(onsets[(i+1)%onsets.length]-onset,16)||16;
      const rests=Array.from({length:distance-1},(_,j)=>mod(onset+j+1,16));
      const strongest=rests.length?Math.max(...rests.map(i=>weights[i])):0,targets=rests.filter(i=>weights[i]===strongest);
      return {onset,onsetWeight:weights[onset],rests,strongest,targets,contribution:Math.max(0,strongest-weights[onset])};
    });
    const metricity=sum(b.map((x,i)=>x*weights[i])),maximum=sum([...weights].sort((a,b)=>b-a).slice(0,onsets.length));
    return {metricity,maximum,metricComplexity:maximum-metricity,restContrast:sum(contributions.map(c=>c.contribution)),contributions};
  }
  return {args:{mask,rotation},bits:a,weights,...score(a),rotations:Array.from({length:16},(_,rotation)=>({rotation,...score(rotate(bits(mask,16),rotation))}))};
}
export function swing({bpm=120,ratio=200,jitter=8,seed=1}={}) {
  integer(bpm,40,240,'bpm');integer(ratio,100,300,'ratio percent');integer(jitter,0,20,'jitter ms');integer(seed,0,4,'offset recipe');
  const period=60000/bpm,r=ratio/100,events=Array.from({length:8},(_,i)=>{
    const straight=i*period/2,nominal=(Math.floor(i/2)+(i%2?r/(1+r):0))*period,offset=i?(((i*37+seed*17)%101)-50)*jitter/50:0;
    return {i,straight,nominal,offset,actual:nominal+offset,deviation:nominal+offset-straight};
  });
  const intervals=events.map((e,i)=>(events[i+1]?.actual??4*period)-e.actual);
  return {args:{bpm,ratio,jitter,seed},period,nominalRatio:r,events,intervals,measuredRatios:Array.from({length:4},(_,i)=>intervals[2*i]/intervals[2*i+1]),duration:4*period};
}
export function autocorrelation({bpm=120,pattern='quarters'}={}) {
  integer(bpm,60,180,'bpm');choice(pattern,['quarters','equal eighths','alternating eighths','missing beats'],'pattern');
  const sampleRate=100,n=600,subdivisions=pattern.includes('eighths')?2:1,events=[],signal=Array(n).fill(0),kernel=[1,2,3,2,1];
  for(let k=0;;k++){
    const at=Math.floor(k*6000/(bpm*subdivisions)+.5);if(at>=n)break;
    if(pattern==='missing beats'&&k%3===1)continue;
    const strength=pattern==='alternating eighths'&&k%2?7:20;events.push({sample:at,strength});
    for(let j=-2;j<=2;j++)if(at+j>=0&&at+j<n)signal[at+j]+=strength*kernel[j+2];
  }
  const energy=sum(signal.map(x=>x*x)),lags=Array.from({length:151},(_,lag)=>{
    let numerator=0;for(let i=0;i<n-lag;i++)numerator+=signal[i]*signal[i+lag];
    return {lag,seconds:lag/sampleRate,numerator,correlation:numerator/energy};
  });
  const peaks=lags.filter((z,i)=>i>=25&&z.numerator>0&&z.numerator>=(lags[i-1]?.numerator??-1)&&z.numerator>(lags[i+1]?.numerator??-1)).map(z=>({...z,bpm:6000/z.lag})).sort((a,b)=>b.numerator-a.numerator||b.lag-a.lag);
  const candidates=peaks.slice(0,3),estimate=candidates[0]?.bpm??null,lag=candidates[0]?.lag??null;
  return {args:{bpm,pattern},sampleRate,n,subdivisions,events,signal,energy,lags,candidates,estimate,selectedLag:lag,predictedSamples:lag===null?[]:Array.from({length:Math.ceil(n/lag)},(_,i)=>i*lag),searchBpm:[40,240]};
}
export const ADDITIVE = Object.freeze({'2+2+3':[2,2,3],'3+2+2':[3,2,2],'2+2+2+3':[2,2,2,3],'2+3+2':[2,3,2],'3+2+3':[3,2,3],'2+2+3+3':[2,2,3,3]});
export function additive({grouping='2+2+3'}={}) {
  choice(grouping,Object.keys(ADDITIVE),'grouping');const cells=[...ADDITIVE[grouping]],n=sum(cells),starts=cells.map((_,i)=>sum(cells.slice(0,i))),a=Array.from({length:n},(_,i)=>Number(starts.includes(i))),e=euclidean({n,k:cells.length}).bits;
  return {args:{grouping},cells,n,starts,bits:a,...cyclic(a),euclideanBits:e,matchingRotations:Array.from({length:n},(_,i)=>i).filter(r=>rotate(e,r).every((x,i)=>x===a[i])),...evenness(a)};
}
export const PHASE_PATTERNS = Object.freeze({'E(5,12)':'100101001010','E(4,12)':'100100100100','Son16':'1001001000101000'});
export function phasing({pattern='E(5,12)',bpm=120,delta=1,time=60,millisecond=0}={}) {
  choice(pattern,Object.keys(PHASE_PATTERNS),'pattern');integer(bpm,60,180,'bpm');integer(delta,-6,6,'tempo difference');integer(time,0,900,'elapsed seconds');integer(millisecond,0,999,'fractional millisecond');if(time===900&&millisecond)throw new RangeError('elapsed limit');
  const a=bits(PHASE_PATTERNS[pattern],PHASE_PATTERNS[pattern].length),n=a.length,c=cyclic(a),ticks=time*1000+millisecond,drift=delta*ticks/60000,relativePhase=mod(delta*ticks,60000*n)/60000;
  const shifted=c.onsets.map(i=>mod(60000*i-delta*ticks,60000*n)/60000),phaseA=mod(bpm*ticks,60000*n)/60000,phaseB=mod((bpm+delta)*ticks,60000*n)/60000;
  const aligned=mod(delta*ticks,60000*c.period)===0,coincidences=mod(delta*ticks,60000)===0?c.onsets.filter(i=>a[mod(i+delta*ticks/60000,n)]).length:0;
  return {args:{pattern,bpm,delta,time,millisecond},bits:a,n,...c,phaseA,phaseB,drift,relativePhase,shifted,aligned,coincidences,realignmentSeconds:delta?60*c.period/Math.abs(delta):null,fullCycleDriftSeconds:delta?60*n/Math.abs(delta):null,bpmB:bpm+delta};
}
export function hypermeter({hyper=4,edit='insert',at=3}={}) {
  choice(hyper,[2,4,8],'hypermeasure');choice(edit,['none','insert','delete'],'edit');integer(at,0,15,'edit position');
  const sources=Array.from({length:16},(_,i)=>i);if(edit==='insert')sources.splice(at,0,null);if(edit==='delete')sources.splice(at,1);
  const strides=[1,2,4,8].filter(x=>x<=hyper),rows=sources.map((source,position)=>({position,source,expectedWeight:strides.filter(x=>position%x===0).length,sourceWeight:source===null?null:strides.filter(x=>source%x===0).length,expectedStrong:position%hyper===0,sourceStrong:source===null?null:source%hyper===0,displacement:source===null?null:source-position,phase:source===null?null:mod(source-position,hyper)}));
  return {args:{hyper,edit,at},strides,rows,bars:rows.length,mismatches:rows.filter(r=>r.sourceStrong!==null&&r.sourceStrong!==r.expectedStrong).map(r=>r.position)};
}
export function hemiola({bpm=120,mode='overlay'}={}) {
  integer(bpm,40,240,'quarter bpm');choice(mode,['two bars of 3/4','one bar of 3/2','overlay'],'accent grouping');const quarter=60/bpm;
  return {args:{bpm,mode},quarter,duration:6*quarter,quarters:Array.from({length:6},(_,i)=>i*quarter),first:[0,3].map(i=>({unit:i,time:i*quarter})),second:[0,2,4].map(i=>({unit:i,time:i*quarter})),firstGroupsPerSecond:2/(6*quarter),secondGroupsPerSecond:3/(6*quarter),commonBoundaryUnits:[0,6],groupRatio:[2,3]};
}
export function fejer(phase,harmonics) {
  const x=mod(phase+.5,1)-.5;if(x===0)return 1-1/(harmonics+1);
  const d=Math.sin(Math.PI*x),v=Math.sin((harmonics+1)*Math.PI*x)/((harmonics+1)*d);
  return v*v-1/(harmonics+1);
}
export function ratio({pair='3:2',rate=50}={}) {
  choice(pair,['3:2','4:3','5:4','2:1'],'frequency ratio');integer(rate,0,100,'rate');const[p,q]=pair.split(':').map(Number),base=.5*2**(rate/10),frequencies=[p*base,q*base],harmonics=frequencies.map(f=>Math.min(4096,Math.max(1,Math.floor(6000/f)))),lines=new Map();
  for(let voice=0;voice<2;voice++)for(let h=1;h<=harmonics[voice];h++){
    const unit=h*(voice?q:p),entry=lines.get(unit)??{unit,frequency:unit*base,first:0,second:0,rank:0},L=harmonics[voice]+1;entry[voice?'second':'first']=.64*(L-h)/(L*L);entry.rank+=(L-h)*(harmonics[1-voice]+1)**2;lines.set(unit,entry);
  }
  const all=[...lines.values()].map(z=>({...z,amplitude:z.first+z.second})),energy=sum(all.map(z=>z.amplitude*z.amplitude/2)),strongest=[...all].sort((a,b)=>b.rank-a.rank||a.unit-b.unit).slice(0,18).sort((a,b)=>a.unit-b.unit).map(({rank,...z})=>z);
  return {args:{pair,rate},p,q,base,frequencies,harmonics,commonCycleSeconds:1/base,firstOnsets:Array.from({length:p},(_,i)=>i/p),secondOnsets:Array.from({length:q},(_,i)=>i/q),lineCount:all.length,energy,strongest,cutoffHz:6000,sampleRate:44100};
}

export function fejerSample({numerator=1,denominator=8,harmonics=12}={}) {
  integer(numerator,-1000000000,1000000000,'phase numerator');integer(denominator,1,1000000000,'phase denominator');integer(harmonics,1,4096,'harmonic count');
  const phase=numerator/denominator;return {args:{numerator,denominator,harmonics},phase,value:fejer(phase,harmonics)};
}

for(const spec of Object.values(METERS)){Object.freeze(spec.levels);Object.freeze(spec.names);Object.freeze(spec);}
for(const cells of Object.values(ADDITIVE))Object.freeze(cells);
