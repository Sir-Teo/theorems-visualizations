// Exact finite histograms and analytic channel models. All logarithms in bits.
const LN2=Math.LN2;
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const xlogx=x=>x>0?x*Math.log2(x):0;
export function histogram(weights,width=1,left=0){
 if(!Array.isArray(weights)||!weights.length||weights.length>16||weights.some(x=>!Number.isFinite(x)||x<0||x>1e12)||!weights.some(x=>x>0))throw Error('Use 1–16 weights from 0 to 10^12, with positive total.');
 if(!(width>=1e-4&&width<=1e4)||!Number.isFinite(left)||Math.abs(left)>1000)throw Error('Cell width must be 0.0001–10000; offset must be within ±1000.');
 const total=sum(weights),p=weights.map(x=>x/total),centers=p.map((_,i)=>left+(i+.5)*width),indexMean=sum(p.map((x,i)=>x*(i+.5))),mean=left+width*indexMean,variance=width**2*sum(p.map((x,i)=>x*((i+.5-indexMean)**2+1/12))),entropy=-sum(p.map(x=>xlogx(x)))+Math.log2(width);
 return{p,width,left,right:left+weights.length*width,mean,variance,entropy,centers};
}
export function density(H,x){const i=Math.floor((x-H.left)/H.width);return i>=0&&i<H.p.length?H.p[i]/H.width:0;}
export function quantize(H,delta,phase=0){
 if(!(delta>=1e-6&&delta<=1e6)||!Number.isFinite(phase)||Math.abs(phase)>1000)throw Error('Use step 0.000001–1000000 and offset within ±1000.');
 const a=Math.floor((H.left-phase)/delta),b=Math.ceil((H.right-phase)/delta),n=b-a;if(n>1024)throw Error('At most1024 quantization bins.');
 const bins=Array.from({length:n},(_,i)=>{const l=phase+(a+i)*delta,r=l+delta,mass=sum(H.p.map((p,j)=>p*Math.max(0,Math.min(r,H.left+(j+1)*H.width)-Math.max(l,H.left+j*H.width))/H.width));return{left:l,right:r,mass};});
 const entropy=-sum(bins.map(b=>xlogx(b.mass)));return{bins,entropy,corrected:entropy+Math.log2(delta),mass:sum(bins.map(b=>b.mass))};
}
export function convolutionValue(A,B,x){const d=A.width,e=B.width;let y=0;for(let i=0;i<A.p.length;i++)for(let j=0;j<B.p.length;j++){const s=x-(A.left+i*d+B.left+j*e),overlap=Math.max(0,Math.min(d,s)-Math.max(0,s-e));y+=A.p[i]*B.p[j]*overlap/(d*e);}return y;}
// Integral of f ln f for a linear segment; scaled to avoid squared-density underflow.
export function linearLogIntegral(a,b,width){const M=Math.max(a,b),m=Math.min(a,b);if(!M)return 0;const d=(M-m)/M;let J=0;if(d<.1){J=-d/2;let power=d*d;for(let k=2;k<=20;k++){J+=power/(k*(k-1)*(k+1));power*=d;}}else{const q=m/M;J=-(2-d)/4-(q?q*q*Math.log(q)/(2*d):0);}return width*M*((1-d/2)*Math.log(M)+J);}
export function convolve(A,B){const knots=[],a0={...A,left:0},b0={...B,left:0};for(let i=0;i<A.p.length;i++)for(let j=0;j<B.p.length;j++){const a=i*A.width+j*B.width;knots.push(a,a+A.width,a+B.width,a+A.width+B.width);}const xs=[...new Set(knots)].sort((a,b)=>a-b),ys=xs.map(x=>convolutionValue(a0,b0,x));let mass=0,entropy=0;for(let k=1;k<xs.length;k++){const w=xs[k]-xs[k-1];mass+=w*(ys[k]+ys[k-1])/2;entropy-=linearLogIntegral(ys[k-1],ys[k],w)/LN2;}return{xs:xs.map(x=>x+A.left+B.left),ys,mass,entropy,mean:A.mean+B.mean,variance:A.variance+B.variance};}
export const entropyPower=h=>Math.exp(2*h*LN2)/(2*Math.PI*Math.E);
export const gaussianEntropy=variance=>.5*Math.log2(2*Math.PI*Math.E*variance);
export const awgn=(power,noise)=>{if(power<0||!(noise>0)||!Number.isFinite(power+noise))throw Error('Power must be nonnegative; noise positive.');return .5*Math.log1p(power/noise)/LN2;};
export const hartley=(power,n0,bandwidth)=>{if(!(bandwidth>0))throw Error('Bandwidth must be positive.');return 2*bandwidth*awgn(power,n0*bandwidth);};
export const bitEnergy=eta=>{if(!(eta>=0&&eta<=1000))throw Error('Use spectral efficiency from 0 to 1000.');return eta===0?LN2:Math.expm1(eta*LN2)/eta;};
export function waterfill(noises,power){
 if(!Array.isArray(noises)||!noises.length||noises.length>12||noises.some(n=>!(n>0)||!Number.isFinite(n))||power<0||!Number.isFinite(power))throw Error('Use 1–12 positive noises and nonnegative finite power.');
 const order=noises.map((n,i)=>({n,i})).sort((a,b)=>a.n-b.n);let base=order[0].n,left=power,k=1;
 const frames=[{line:1,base,left,k,allocation:noises.map(()=>0)}];
 for(;k<order.length;k++){const cost=(order[k].n-base)*k;if(cost>left)break;left-=cost;base=order[k].n;frames.push({line:2,base,left,k:k+1,cost,allocation:noises.map(n=>Math.max(0,base-n))});}
 const raise=left/k,allocation=noises.map(n=>n<=base?base-n+raise:0),capacity=sum(allocation.map((x,i)=>awgn(x,noises[i]))),used=sum(allocation);
 frames.push({line:3,base,left:0,k,raise,allocation,final:true});
 return{allocation,capacity,used,level:base+raise,base,raise,active:allocation.filter(p=>p>0).length,frames};
}

export function numbers(source,{min=0,max=1e12,limit=16,empty=false}={}) {
 const raw=String(source).trim();if(!raw&&empty)return[];
 const fields=raw.split(/[\s,;]+/),out=fields.map(Number);
 if(!raw||fields.length>limit||out.some(x=>!Number.isFinite(x)||x<min||x>max))throw Error(`Use 1–${limit} finite numbers from ${min} to ${max}.`);
 return out;
}
export function family(shape,variance=1,mean=0){
 if(!(variance>0)||!Number.isFinite(variance)||!Number.isFinite(mean))throw Error('Use positive variance and finite mean.');
 const sd=Math.sqrt(variance),g=gaussianEntropy(variance);
 if(shape==='gaussian')return{entropy:g,variance,mean,density:x=>Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI)),left:mean-5*sd,right:mean+5*sd};
 if(shape==='uniform'){const half=Math.sqrt(3)*sd;return{entropy:Math.log2(2*half),variance,mean,density:x=>Math.abs(x-mean)<=half?1/(2*half):0,left:mean-5*sd,right:mean+5*sd};}
 if(shape==='laplace'){const b=sd/Math.SQRT2;return{entropy:Math.log2(2*Math.E*b),variance,mean,density:x=>Math.exp(-Math.abs(x-mean)/b)/(2*b),left:mean-5*sd,right:mean+5*sd};}
 throw Error('Unknown density family.');
}
export function standardizedHistogram(weights,variance=1,mean=0){const base=histogram(weights),width=Math.sqrt(variance/base.variance),left=mean-width*base.mean;return histogram(weights,width,left);}
export function constraintExample(mode,scale,weights){
 if(!(scale>=.001&&scale<=100))throw Error('Constraint scale must be 0.001–100.');
 if(mode==='support'){const H=histogram(weights,scale/weights.length,0);return{H,bound:Math.log2(scale),entropy:H.entropy,mean:H.mean,variance:H.variance,reference:x=>x>=0&&x<=scale?1/scale:0,left:0,right:scale,winner:'uniform on the fixed interval'};}
 if(mode==='nonnegative mean'){const base=histogram(weights),H=histogram(weights,scale/base.mean);return{H,bound:Math.log2(Math.E*scale),entropy:H.entropy,mean:H.mean,variance:H.variance,reference:x=>x>=0?Math.exp(-x/scale)/scale:0,left:0,right:Math.max(H.right,6*scale),winner:'exponential on the nonnegative half-line'};}
 if(mode==='variance'){const H=standardizedHistogram(weights,scale),G=family('gaussian',scale);return{H,bound:G.entropy,entropy:H.entropy,mean:H.mean,variance:H.variance,reference:G.density,left:Math.min(H.left,G.left),right:Math.max(H.right,G.right),winner:'Gaussian with the prescribed variance'};}
 throw Error('Unknown constraint.');
}
export function parseConstellation(source){let points;try{points=JSON.parse(source);}catch{throw Error('Use a JSON list of 2–16 coordinate pairs.');}if(!Array.isArray(points)||points.length<2||points.length>16||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x)||Math.abs(x)>1000)))throw Error('Use 2–16 finite coordinate pairs within ±1000.');return points;}
export function seeded(seed=1){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/4294967296;};}
export function normalPair(random){const radius=Math.sqrt(-2*Math.log(random())),angle=2*Math.PI*random();return[radius*Math.cos(angle),radius*Math.sin(angle)];}
export function constellationExperiment(points,power,noise,{trials=256,seed=1}={}){
 const capacity=awgn(power,noise);if(!Number.isInteger(trials)||trials<1||trials>4096)throw Error('Use 1–4096 noise trials.');
 parseConstellation(JSON.stringify(points));const radius=Math.max(...points.map(p=>Math.hypot(...p))),factor=radius?Math.sqrt(2*power)/radius:0,code=points.map(p=>p.map(x=>x*factor)),random=seeded(seed),samples=[];let errors=0;
 for(let i=0;i<trials;i++){const sent=Math.floor(random()*code.length),z=normalPair(random).map(x=>x*Math.sqrt(noise)),received=code[sent].map((x,j)=>x+z[j]);let decoded=0,best=Infinity;for(let j=0;j<code.length;j++){const d=(code[j][0]-received[0])**2+(code[j][1]-received[1])**2;if(d<best){best=d;decoded=j;}}const error=decoded!==sent;errors+=+error;samples.push({sent,received,decoded,error});}
 return{code,samples,errors,trials,rate:Math.log2(code.length)/2,capacity,maxPower:Math.max(...code.map(p=>(p[0]**2+p[1]**2)/2)),averagePower:sum(code.map(p=>(p[0]**2+p[1]**2)/2))/code.length};
}
export const sinc=x=>x===0?1:Number.isInteger(x)?0:Math.sin(Math.PI*x)/(Math.PI*x);
export function waveform(coefficients,bandwidth){if(!(bandwidth>0)||!Number.isFinite(bandwidth))throw Error('Bandwidth must be positive.');const offset=Math.floor(coefficients.length/2),value=t=>sum(coefficients.map((a,j)=>a*Math.sqrt(2*bandwidth)*sinc(2*bandwidth*t-(j-offset))));return{value,energy:sum(coefficients.map(a=>a*a)),samples:coefficients.map((a,j)=>({time:(j-offset)/(2*bandwidth),value:a*Math.sqrt(2*bandwidth)}))};}
export function allocationComparison(noises,power,weights){if(weights.length!==noises.length||weights.some(x=>!Number.isFinite(x)||x<0)||!weights.some(x=>x>0))throw Error('Provide one nonnegative weight per channel, with positive total.');const norm=sum(weights),allocation=weights.map(x=>power*x/norm),optimal=waterfill(noises,power);return{allocation,capacity:sum(allocation.map((p,i)=>awgn(p,noises[i]))),optimal};}
