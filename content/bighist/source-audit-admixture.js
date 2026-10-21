// Authored stationary two-state Markov illustration, not a fit to genomic data.
export const ADMIXTURE_COPIES=200,ADMIXTURE_BINS=32;
export const ADMIXTURE_DOMAINS=[[20,4000,1],[.2,8,10],[2,40,1],[0,.3,100],[100,4000,1],[.2,10,10],[0,9999,1]];
export const admixtureTick=(x,[lo,hi,k])=>typeof x==='number'&&Number.isFinite(x)&&x>=lo&&x<=hi&&x===Math.round(x*k)/k;
export function admixtureRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return(((t^(t>>>14))>>>0)+.5)/4294967296;};}
export function admixturePaint(r,W,T,f){
 if(!(W>0&&T>0&&f>0&&f<1))throw new RangeError('Positive window/time and interior fraction required');
 let state=r()<f,x=0;const segments=[];
 while(x<W){const length=-Math.log(r())/(T*(state?1-f:f)),end=x+length,stop=Math.min(W,end);if(state)segments.push({start:x,stop,left:x===0,right:end>=W});x=end;state=!state;}
 return segments;
}
// Integral of (W-l) exp(-lambda*l), normalized above threshold a.
// Local integration avoids subtracting almost equal tail CDFs.
export function admixtureBinMass(lo,hi,W,a,lambda){
 if(!(lambda>0&&a>=0&&a<W&&lo>=a&&hi>=lo&&hi<=W))throw new RangeError('Supported ordered window bin required');
 const z=lambda*(hi-lo),b=lambda*(W-lo),t=lambda*(W-a),e=Math.exp(-z),k0=-Math.expm1(-z);
 let k1;
 if(z<.05){let power=z*z,fact=2,sum=power/2;for(let n=3;n<=14;n++){power*=z;fact*=n;sum+=(n%2?-1:1)*(n-1)*power/fact;}k1=sum;}else k1=1-(1+z)*e;
 return Math.exp(-lambda*(lo-a))*(b*k0-k1)/(t+Math.expm1(-t));
}
export function admixtureSummary(rows,W,T,f,a){
 const lambda=T*(1-f),lengths=[];let exposure=0,events=0,censored=0,left=0,foreign=0;
 for(const row of rows)for(const s of row){const length=s.stop-s.start;foreign+=length;if(s.left){left++;continue;}if(length>a){exposure+=length-a;if(s.right)censored++;else events++;}if(!s.right&&length>=a)lengths.push(length);}
 const xmax=Math.min(W,Math.max(a+5/lambda,...lengths.map(x=>x*1.03))),dx=(xmax-a)/ADMIXTURE_BINS,counts=Array(ADMIXTURE_BINS).fill(0);
 for(const x of lengths)counts[Math.min(ADMIXTURE_BINS-1,Math.floor((x-a)/dx))]++;
 const bins=counts.map((count,i)=>{const lo=a+i*dx,hi=i===ADMIXTURE_BINS-1?xmax:a+(i+1)*dx;return{lo,hi,count,observed:lengths.length?count/lengths.length:0,expected:admixtureBinMass(lo,hi,W,a,lambda)};});
 const t=lambda*(W-a),expectedCount=rows.length*f*Math.exp(-lambda*a)*(t+Math.expm1(-t)),estimate=exposure>0?events/(exposure*(1-f)):null;
 return{lambda,rows,lengths,exposure,events,censored,left,observedFraction:foreign/(rows.length*W),estimate,expectedCount,xmax,bins,tail:xmax===W?0:1-bins.reduce((s,b)=>s+b.expected,0)};
}
let lastKey='',lastModel;
export function admixtureModel(T=1800,percent=2,Wcm=10,acm=.05,DT=1500,Dpercent=4,seed=3,den=false){
 const xs=[T,percent,Wcm,acm,DT,Dpercent,seed];if(xs.some((x,i)=>!admixtureTick(x,ADMIXTURE_DOMAINS[i]))||typeof den!=='boolean')throw new RangeError('Supported saved admixture ticks and boolean required');
 const key=JSON.stringify([...xs,den]);if(key===lastKey)return structuredClone(lastModel);
 const W=Wcm/100,a=acm/100,make=(time,fraction,source)=>{const rows=Array.from({length:ADMIXTURE_COPIES},(_,i)=>admixturePaint(admixtureRng(seed+1009*i+10301*source),W,time,fraction));return admixtureSummary(rows,W,time,fraction,a);};
 const N=make(T,percent/100,1),D=den?make(DT,Dpercent/100,2):null;
 lastKey=key;lastModel={T,percent,Wcm,acm,DT,Dpercent,seed,den,W,a,N,D};return structuredClone(lastModel);
}
