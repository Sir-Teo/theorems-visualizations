// Exact finite restrictions and explicitly bounded experiments for UML chapter 6.
export const dense = a => Array.isArray(a) && Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
export function parsePoints(text, plane=false) {
  try {const a=JSON.parse(text);if(!dense(a)||a.length>8)throw Error('Use a dense array of at most 8 points.');
    if(plane){if(!a.every(p=>dense(p)&&p.length===2&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=8)))throw Error('Each point must be [x,y] in [-8,8].');}
    else if(!a.every(x=>Number.isFinite(x)&&Math.abs(x)<=8))throw Error('Use finite coordinates in [-8,8].');
    return {points:a,error:null};
  }catch(e){return {points:[],error:e.message};}
}
export const bit=(mask,i)=>(mask>>i)&1;
export const pop=mask=>{let n=0;for(;mask;mask>>>=1)n+=mask&1;return n;};
export function restrictions(points,kind='threshold') {
  const n=points.length, out=[];
  for(let mask=0;mask<2**n;mask++){
    if(kind==='all'){out.push(mask);continue;}
    if(kind==='rectangle'){
      const positive=points.filter((_,i)=>bit(mask,i));
      if(!positive.length){out.push(mask);continue;}
      const box=[Math.min(...positive.map(p=>p[0])),Math.max(...positive.map(p=>p[0])),Math.min(...positive.map(p=>p[1])),Math.max(...positive.map(p=>p[1]))];
      if(points.every((p,i)=>+(p[0]>=box[0]&&p[0]<=box[1]&&p[1]>=box[2]&&p[1]<=box[3])===bit(mask,i)))out.push(mask);
      continue;
    }
    const order=points.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]);let ok=true,runs=0,last=0;
    for(let j=0;j<n;j++){const [x,i]=order[j],b=bit(mask,i);if(j&&x===order[j-1][0]&&b!==bit(mask,order[j-1][1]))ok=false;if(b&&!last)runs++;if(kind==='threshold'&&j&&b>last)ok=false;last=b;}
    if(ok&&(kind==='threshold'||runs<=(kind==='interval'?1:2)))out.push(mask);
  }
  return out;
}
export function project(mask,columns){return columns.reduce((a,i,j)=>a+(bit(mask,i)<<j),0);}
export function shattered(family,columns){return new Set(family.map(mask=>project(mask,columns))).size===2**columns.length;}
export function finiteVC(family,n){let d=0,witness=[];for(let subset=0;subset<2**n;subset++){const c=Array.from({length:n},(_,i)=>i).filter(i=>bit(subset,i));if(c.length>d&&shattered(family,c)){d=c.length;witness=c;}}return {dimension:d,witness};}
export function missing(family,n){const have=new Set(family);return Array.from({length:2**n},(_,i)=>i).filter(x=>!have.has(x));}
export function choose(n,k){if(k<0||k>n)return 0;k=Math.min(k,n-k);let x=1;for(let j=1;j<=k;j++)x=x*(n-k+j)/j;return Math.round(x);}
export const sauer=(m,d)=>Array.from({length:Math.min(m,d)+1},(_,i)=>choose(m,i)).reduce((a,b)=>a+b,0);
export function splitFamily(family,n){const zero=new Set(),one=new Set();for(const h of family)(bit(h,n-1)?one:zero).add(h&((1<<(n-1))-1));const union=[...new Set([...zero,...one])],intersection=[...zero].filter(h=>one.has(h));return {zero:[...zero],one:[...one],union,intersection};}
// Exact rational phase θx_j/π, with the enormous integer θ/π kept symbolic.
export function sineEncoding(labels){if(!dense(labels)||labels.length>32||!labels.every(x=>x===0||x===1))throw Error('Use up to 32 binary labels.');const N=labels.reduce((a,b,j)=>a+BigInt(1-b)*10n**BigInt(j+1),0n);return {thetaNumerator:String(2n*N+1n),thetaDenominator:'2',rows:labels.map((label,j)=>{const den=2n*10n**BigInt(j+1),num=(2n*N+1n)%(2n*den),rem=num%den,distance=rem<den-rem?rem:den-rem,sign=num<den?1:-1;return {j:j+1,numerator:String(num),denominator:String(den),label:num>0n&&num<den?1:0,phase:Number(num)/Number(den),sine:sign*Math.sin(Math.PI*Number(distance)/Number(den)),residualNumerator:String(rem)};})};}
export function maskLaw(n,m){let law=Array(2**n).fill(0);law[0]=1;for(let t=0;t<m;t++){const next=law.map(()=>0);for(let mask=0;mask<law.length;mask++)if(law[mask])for(let i=0;i<n;i++)next[mask|(1<<i)]+=law[mask]/n;law=next;}return law;}
export function thresholdLaw(weights,target,m,epsilon,riskFlags=null){const n=weights.length,family=Array.from({length:n+1},(_,k)=>(1<<k)-1),risk=family.map(h=>weights.reduce((a,p,i)=>a+p*(bit(h,i)!==bit(target,i)),0));let law=Array(2**n).fill(0);law[0]=1;
  for(let t=0;t<m;t++){const next=law.map(()=>0);for(let mask=0;mask<law.length;mask++)if(law[mask])for(let i=0;i<n;i++)next[mask|(1<<i)]+=law[mask]*weights[i];law=next;}
  let bad=0,meanWorst=0;const rows=law.map((p,mask)=>{const consistent=family.map((h,k)=>({h,k})).filter(({h})=>((h^target)&mask)===0),worst=Math.max(...consistent.map(({k})=>risk[k]));const isBad=riskFlags?consistent.some(({k})=>riskFlags[k]):worst>epsilon;if(isBad)bad+=p;meanWorst+=p*worst;return {mask,p,worst,bad:isBad};});return {family,risk,bad,meanWorst,rows,bound:Math.min(1,2*Math.exp(-epsilon*m))};}
export function nflMixture(m){const n=2*m,occupancy=Array(n+1).fill(0);occupancy[0]=1;for(let t=0;t<m;t++){const q=Array(n+1).fill(0);for(let k=0;k<=n;k++){q[k]+=occupancy[k]*k/n;if(k<n)q[k+1]+=occupancy[k]*(n-k)/n;}occupancy.splice(0,n+1,...q);}let mean=0,tail=0;for(let k=0;k<=n;k++){const u=n-k;mean+=occupancy[k]*u/(2*n);for(let e=0;e<=u;e++)if(e/n>=1/8)tail+=occupancy[k]*choose(u,e)/2**u;}return {occupancy,mean,tail};}
export function expectedGap(family,probabilities,labels,m){const n=probabilities.length,risks=family.map(h=>probabilities.reduce((a,p,i)=>a+p*(bit(h,i)!==labels[i]),0));let total=0,mean=0;const counts=Array(n).fill(0),hist=[];
 const walk=(i,left,p)=>{if(i===n-1){counts[i]=left;let prob=p*probabilities[i]**left;for(let z=2;z<=left;z++)prob/=z;let gap=0;family.forEach((h,k)=>{const empirical=counts.reduce((a,c,j)=>a+c*(bit(h,j)!==labels[j]),0)/m;gap=Math.max(gap,Math.abs(empirical-risks[k]));});total+=prob;mean+=prob*gap;hist.push({gap,p:prob});return;}for(let c=0;c<=left;c++){counts[i]=c;let q=p*probabilities[i]**c;for(let z=2;z<=c;z++)q/=z;walk(i+1,left-c,q);}};
 let factorial=1;for(let j=2;j<=m;j++)factorial*=j;walk(0,m,factorial);return {mean,total,hist,risks};}
export function seededSample(n,m,seed){let x=seed>>>0||1;return Array.from({length:m},()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n;});}
export function finiteFit(family,points,labels,draws){const losses=family.map(h=>draws.reduce((a,i)=>a+(bit(h,i)!==labels[i]),0)/draws.length),best=Math.min(...losses),index=losses.indexOf(best);return {index,h:family[index],training:best,risk:points.reduce((a,_,i)=>a+(bit(family[index],i)!==labels[i]),0)/points.length};}

// Exact comparison in the atomic widget's ORIGINAL binary64 parameter model.
// Three masses are the rational (1-a)/3, not separately rounded empirical inputs.
export function binaryRatio(value){const buffer=new ArrayBuffer(8),view=new DataView(buffer);view.setFloat64(0,value);const bits=view.getBigUint64(0),e=Number((bits>>52n)&2047n),f=bits&((1n<<52n)-1n);if(value===0)return [0n,1n];const n=e?f+(1n<<52n):f,p=e?e-1075:-1074;return p>=0?[n<<BigInt(p),1n]:[n,1n<<BigInt(-p)];}
export function atomicThresholdLaw(atom,m,epsilon){const weights=[(1-atom)/3,(1-atom)/3,atom,(1-atom)/3],[an,ad]=binaryRatio(atom),[en,ed]=binaryRatio(epsilon),riskFlags=Array.from({length:5},(_,cut)=>{const h=(1<<cut)-1;let k=0,b=0;for(let i=0;i<4;i++)if(bit(h,i)!==bit(3,i)){if(i===2)b=1;else k++;}return (BigInt(k)*ad+an*BigInt(3*b-k))*ed>3n*en*ad;});return {...thresholdLaw(weights,3,m,epsilon,riskFlags),riskFlags};}
