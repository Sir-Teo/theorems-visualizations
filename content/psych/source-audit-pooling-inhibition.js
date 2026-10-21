// Authored finite models. Source context and numerical limits are recorded in the audit.
const inRange=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const G=[1,2,3,4,6,8,12],N=48;
// Exact nonnegative binary64 numerator in units of 2^-1074; no coordinate subtraction rounds a boundary away.
const bits=new DataView(new ArrayBuffer(8));
function dyadic(x){bits.setFloat64(0,x,false);const raw=bits.getBigUint64(0,false),e=Number((raw>>52n)&2047n),m=raw&((1n<<52n)-1n);return e===0?m:((1n<<52n)|m)<<BigInt(e-1);}
const pointNumerators=Array.from({length:N},(_,i)=>BigInt(2*i+1)<<1073n);
const need=(ok)=>{if(!ok)throw new RangeError('Outside the declared finite model domain');};

export function aperture(g,f){
  need(G.includes(g)&&inRange(f,0,.5));
  let re=0,im=0;
  for(let j=0;j<g;j++){re+=Math.cos(2*Math.PI*f*j);im-=Math.sin(2*Math.PI*f*j);}
  re/=g;im/=g;
  return{re,im,gain:Math.hypot(re,im)};
}

export function discretePool(g=4,f=.11,phase=0,signal=.45,position=23,width=6,mode='grat'){
  need(G.includes(g)&&inRange(f,0,.5)&&inRange(phase,0,1)&&inRange(signal,0,1.5)&&inRange(position,0,N)&&inRange(width,0,12)&&['grat','spot'].includes(mode));
  const a=position-width/2,b=position+width/2,centres=Array.from({length:N},(_,i)=>i+.5),cExact=dyadic(position),wExact=dyadic(width),covered=pointNumerators.map(x=>{const d=2n*(x-cExact);return wExact>0n&&d>=-wExact&&d<wExact;}),grating=centres.map(x=>.5+.45*Math.cos(2*Math.PI*(f*x+phase))),spot=covered.map(x=>x?signal:0),input=mode==='grat'?grating:spot;
  const groupsFor=size=>Array.from({length:N/size},(_,j)=>{const lo=j*size,hi=lo+size,count=covered.slice(lo,hi).filter(Boolean).length;return{a:lo,b:hi,centre:(lo+hi)/2,count,mean:input.slice(lo,hi).reduce((s,x)=>s+x,0)/size,noiseSD:1/Math.sqrt(size),snr:signal*(count/Math.sqrt(size))};});
  const groups=groupsFor(g),scores=G.map(size=>{const rows=groupsFor(size),count=Math.max(...rows.map(x=>x.count));return{g:size,count,snr:signal*(count/Math.sqrt(size))};});
  // Positive common signal does not affect ranking: integer cross-products avoid subnormal underflow and retain exact ties.
  const winner=scores.reduce((a,b)=>b.count*b.count*a.g>a.count*a.count*b.g?b:a),best=signal===0?scores:scores.filter(z=>z.count*z.count*winner.g===winner.count*winner.count*z.g),bestValue=best[0].snr,selected=signal*(Math.max(...groups.map(x=>x.count))/Math.sqrt(g));
  const frequencies=[0,.5,f,.5/g,...Array.from({length:251},(_,i)=>i/500),...Array.from({length:Math.floor(g/2)},(_,i)=>(i+1)/g)].sort((x,y)=>x-y),curve=[...new Set(frequencies)].map(x=>[x,aperture(g,x).gain]);
  return{g,f,phase,signal,position,width,mode,a,b,centres,covered:covered.filter(Boolean).length,input,groups,scores,best,bestValue,selected,gain:aperture(g,f).gain,nyquist:.5/g,aliasFrequency:Math.abs(f-Math.round(f*g)/g),curve};
}

const M=25,threshold=.1;
export function inhibitionMatrix(q,spread){
  need(inRange(q,0,.9)&&inRange(spread,.5,5));
  const W=Array.from({length:M},(_,i)=>Array.from({length:M},(_,j)=>{const d=Math.abs(i-j);return d>0&&d<=8?Math.exp(-(d-1)/spread):0;})),normalizer=Math.max(...W.map(row=>row.reduce((s,x)=>s+x,0))),K=W.map(row=>row.map(x=>q*x/normalizer)),rowBound=Math.max(...K.map(row=>row.reduce((s,x)=>s+x,0)));
  return{K,normalizer,rowBound};
}
export function inhibitionMap(e,K,r){return e.map((x,i)=>Math.max(0,x-K[i].reduce((s,k,j)=>s+k*Math.max(r[j]-threshold,0),0)));}
function fixed(e,K,rowBound){
  let r=e.slice(),residual=Infinity,iterations=0;
  for(;iterations<2000;iterations++){
    const next=inhibitionMap(e,K,r);residual=Math.max(...r.map((x,i)=>Math.abs(x-next[i])));
    if(residual/(1-rowBound)<=5e-13)break;
    r=next;
  }
  if(iterations===2000)throw new Error('Declared contraction did not reach the requested residual');
  return{r,residual,errorEstimate:residual/(1-rowBound),iterations};
}
export function inhibitionRow(q=.4,spread=2,width=5,position=12,pattern='edge',mode='rec'){
  need(inRange(q,0,.9)&&inRange(spread,.5,5)&&Number.isInteger(width)&&inRange(width,1,12)&&Number.isInteger(position)&&inRange(position,0,M-1)&&['one','patch','edge'].includes(pattern)&&['rec','one'].includes(mode));
  const{K,normalizer,rowBound}=inhibitionMatrix(q,spread),start=position-Math.floor(width/2),end=start+width,e=Array.from({length:M},(_,i)=>(pattern==='one'?i===position:pattern==='patch'?i>=start&&i<end:i>=position)?1:.35),solved=fixed(e,K,rowBound),one=inhibitionMap(e,K,e),baseline=fixed(Array(M).fill(.35),K,rowBound),r=mode==='rec'?solved.r:one,next=inhibitionMap(e,K,r),residual=Math.max(...r.map((x,i)=>Math.abs(x-next[i])));
  return{q,spread,width,position,pattern,mode,threshold,K,normalizer,rowBound,e,r,one,recurrent:solved.r,baseline:baseline.r,residual,errorEstimate:residual/(1-rowBound),iterations:mode==='rec'?solved.iterations:1,lit:e.filter(x=>x===1).length,start,end};
}
