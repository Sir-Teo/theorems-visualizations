// WAVES6: scalar/Jones interference, lossless normal-incidence layers, and explicit stochastic models.
export const TAU=2*Math.PI, C=299792458;
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]], scale=(a,x)=>[a[0]*x,a[1]*x], abs2=a=>a[0]**2+a[1]**2;
export const expi=x=>[Math.cos(x),Math.sin(x)];
export function div(a,b){const d=abs2(b);return[(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}
export function sinc(x){if(Math.abs(x)<1e-4)return 1-x*x/6+x**4/120;return Math.sin(x)/x;}
export function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return(x+.5)/4294967296;};}
export function normal(random){return Math.sqrt(-2*Math.log(random()))*Math.cos(TAU*random());}
export function coherent(I1=1,I2=1,phase=0,angle=0){const a=Math.sqrt(I1),b=Math.sqrt(I2),u=expi(phase),Ex=add([a,0],scale(u,b*Math.cos(angle))),Ey=scale(u,b*Math.sin(angle));return{Ex,Ey,intensity:abs2(Ex)+abs2(Ey),cross:2*a*b*Math.cos(angle)*Math.cos(phase),incoherent:I1+I2};}
// Exact path difference evaluated without subtracting almost equal distances.
export function doubleSlit(x,d,L,lambda,mode='both'){
 const r1=Math.hypot(L,x-d/2),r2=Math.hypot(L,x+d/2),delta=-2*x*d/(r1+r2),phase=TAU*delta/lambda,a=mode==='right only'?0:L/r1,b=mode==='left only'?0:L/r2;
 return{r1,r2,delta,phase,amplitudes:[a,b],intensity:(a-b)**2+4*a*b*Math.cos(phase/2)**2,paraxial:(mode==='both'?4*Math.cos(Math.PI*d*x/(lambda*L))**2:1),spacing:lambda*L/d};
}
export function visibility(ratio,sigma,background,seed=17,count=256){const random=rng(seed);let re=0,im=0;const phases=[];for(let i=0;i<count;i++){const p=sigma*normal(random);phases.push(p);re+=Math.cos(p);im+=Math.sin(p);}re/=count;im/=count;const gamma=Math.exp(-sigma*sigma/2),base=1+ratio+background,a=2*Math.sqrt(ratio);return{phases,gamma,sampledGamma:[re,im],visibility:a*gamma/base,sampledVisibility:a*Math.hypot(re,im)/base,minimum:base-a*gamma,maximum:base+a*gamma,exact:p=>base+a*gamma*Math.cos(p),sample:p=>base+a*(re*Math.cos(p)-im*Math.sin(p))};}
export function lloyd(y,h,L,lambda,reflection=1){const direct=Math.hypot(L,y-h),image=Math.hypot(L,y+h),delta=4*y*h/(direct+image),phase=TAU*delta/lambda,a=L/direct,b=reflection*L/image;return{direct,image,delta,phase,intensity:(a-b)**2+4*a*b*Math.sin(phase/2)**2,spacing:lambda*L/(2*h),a,b};}
export function interfaceRT(n0,ns){return{r:(n0-ns)/(n0+ns),t:2*n0/(n0+ns)};}
// Recursion sums every internal round trip. Indices real positive, layers lossless, normal incidence.
export function stack(lambda,layers,n0=1,ns=1.5){
 if(!(lambda>0&&n0>0&&ns>0&&layers.every(l=>l.n>0&&l.d>=0)))throw Error('Positive wavelength/indices and nonnegative thickness required.');
 const last=layers.length?layers.at(-1).n:n0,edge=interfaceRT(last,ns);let r=[edge.r,0],t=[edge.t,0];
 for(let j=layers.length-1;j>=0;j--){const layer=layers[j],front=interfaceRT(j?layers[j-1].n:n0,layer.n),e=expi(TAU*layer.n*layer.d/lambda),round=mul(r,mul(e,e)),den=add([1,0],scale(round,front.r));t=div(scale(mul(t,e),front.t),den);r=div(add([front.r,0],round),den);}
 return{r,t,R:abs2(r),T:ns/n0*abs2(t)};
}
export const film=(lambda,d,n=1.33,n0=1,ns=1)=>stack(lambda,[{n,d}],n0,ns);
export function coating(lambda,n,d,ns=1.5,design=550e-9){return{...film(lambda,d,n,1,ns),idealIndex:Math.sqrt(ns),idealThickness:design/(4*Math.sqrt(ns)),bare:interfaceRT(1,ns).r**2};}
export function newtonGap(r,R,gap=0){if(Math.abs(r)>R)throw Error('Radius beyond sphere.');return gap+r*r/(R+Math.sqrt((R-r)*(R+r)));}
export function newtonRings(lambda,R,gap,order){const t=order*lambda/2-gap,radius=t>=0&&t<=R?Math.sqrt(t*(2*R-t)):null;return{radius,paraxialRadius:t>=0?Math.sqrt(2*R*t):null,intensity:r=>film(lambda,newtonGap(r,R,gap),1,1.5,1.5).R};}
export function michelson(x,plate,index,lambda){const opd=2*x+2*(index-1)*plate,phase=TAU*opd/lambda;return{opd,phase,cycles:opd/lambda,bright:Math.cos(phase/2)**2,dark:Math.sin(phase/2)**2,mirrorPeriod:lambda/2};}
export function machZehnder(split,phase,transmission=1){const a=Math.sqrt(split),b=Math.sqrt(1-split),arms=[[a,0],[0,b]],first=scale(expi(phase),a*Math.sqrt(transmission)),second=arms[1];const out1=add(scale(first,a),mul([0,b],second)),out2=add(mul([0,b],first),scale(second,a));return{arms,afterPlate:[first,second],out:[out1,out2],ports:[abs2(out1),abs2(out2)],absorbed:split*(1-transmission),surviving:split*transmission+1-split};}
export function fabry(R,delta,terms=20){if(!(R>=0&&R<1))throw Error('Mirror power reflectance must be below one.');const e=expi(delta),den=sub([1,0],scale(e,R)),t=div(scale(expi(delta/2),1-R),den),r=div(scale(sub([1,0],e),Math.sqrt(R)),den),F=4*R/(1-R)**2;let sum=[0,0],term=scale(expi(delta/2),1-R);const partials=[[0,0]];for(let j=0;j<terms;j++){sum=add(sum,term);partials.push(sum);term=mul(term,scale(e,R));}const width=F>=1?4*Math.asin(1/Math.sqrt(F)):null;return{t,r,T:abs2(t),R:abs2(r),F,partials,finiteT:abs2(sum),tailBound:R**terms,width,finesse:width===null?null:TAU/width,approxFinesse:R?Math.PI*Math.sqrt(R)/(1-R):0};}
export function bragg(ratio,pairs,high=2.2,low=1.45,substrate=1.5){const layers=Array.from({length:2*pairs},(_,i)=>{const n=i%2?low:high;return{n,d:1/(4*n)};}),q=stack(1/ratio,layers,1,substrate),delta=Math.PI*ratio/2,Y=substrate*(high/low)**(2*pairs),halfWidth=2/Math.PI*Math.asin(Math.abs(high-low)/(high+low));return{...q,layers,centerR:((1-Y)/(1+Y))**2,halfTrace:Math.cos(delta)**2-(high/low+low/high)*Math.sin(delta)**2/2,band:[1-halfWidth,1+halfWidth]};}
// Bandwidth uses cycles/time, never angular frequency. Gaussian parameter is rms; box is full width.
export function temporal(tau,width,shape='Gaussian'){const x=width*tau;return shape==='Gaussian'?Math.exp(-2*Math.PI**2*x*x):sinc(Math.PI*x);}
export function spectralShape(detuning,width,shape='Gaussian'){return shape==='Gaussian'?Math.exp(-.5*(detuning/width)**2)/(Math.sqrt(TAU)*width):Math.abs(detuning)<=width/2?1/width:0;}
export const dense=a=>Array.isArray(a)&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
export function checkedLines(value){if(!dense(value)||value.length<1||value.length>6)throw Error('Use 1–6 [frequency in THz, positive weight] pairs.');return value.map(row=>{if(!dense(row)||row.length!==2||!row.every(Number.isFinite)||row[0]<350||row[0]>650||row[1]<=0||row[1]>4)throw Error('Each frequency must be 350–650 THz and each weight above 0 and at most 4.');return[...row];});}
export function interferogram(lines,T=40,window='rectangle'){
 lines=checkedLines(lines);const m=Math.ceil(T/.4),dt=T/m,total=lines.reduce((s,p)=>s+p[1],0),samples=Array.from({length:2*m+1},(_,j)=>{const tau=(j-m)*dt,c=lines.reduce((s,[f,w])=>s+w*Math.cos(TAU*f*tau/1000),0),win=window==='Hann'?.5*(1+Math.cos(Math.PI*tau/T)):1;return{tau,c,intensity:(total+c)/2,weight:win*(j===0||j===2*m?.5:1)};}),norm=samples.reduce((s,p)=>s+p.weight,0);
 const estimate=f=>2*samples.reduce((s,p)=>s+p.weight*p.c*Math.cos(TAU*f*p.tau/1000),0)/norm;
 return{lines,samples,dt,nyquist:500/dt,spacing:500/T,total,estimate};
}
// Independent Legendre quadrature nodes calculated at module load, not a copied special-function table.
export function gaussRule(n){const nodes=[],weights=[];for(let i=0;i<n;i++){let x=Math.cos(Math.PI*(i+.75)/(n+.5)),dp;for(let k=0;k<30;k++){let a=1,b=x;for(let j=2;j<=n;j++){const c=((2*j-1)*x*b-(j-1)*a)/j;a=b;b=c;}dp=n*(x*b-a)/(x*x-1);const dx=b/dp;x-=dx;if(Math.abs(dx)<2e-16)break;}nodes.push(x);weights.push(2/((1-x*x)*dp*dp));}return{nodes,weights};}
const G16=gaussRule(16);
export function integrateGauss(fn,a,b,rule=G16){const mid=(a+b)/2,half=(b-a)/2;return half*rule.nodes.reduce((s,x,i)=>s+rule.weights[i]*fn(mid+half*x),0);}
export function diskCoherence(x){if(Math.abs(x)<1){let sum=1,term=1;for(let k=1;k<20;k++){term*=-x*x/(4*k*(k+1));sum+=term;}return sum;}const segments=Math.max(2,Math.ceil(Math.abs(x)/4));let sum=0;for(let i=0;i<segments;i++)sum+=integrateGauss(t=>Math.cos(t-x*Math.sin(t)),Math.PI*i/segments,Math.PI*(i+1)/segments);return 2*sum/(Math.PI*x);}
export function spatial(baseline,angle,lambda,shape='strip'){const x=Math.PI*baseline*angle/lambda;return shape==='disk'?diskCoherence(x):sinc(x);}
export const J1_FIRST_ZERO=3.8317059702075125;
export function stellar(baseline,diameter,lambda){const x=Math.PI*baseline*diameter/lambda,gamma=diskCoherence(x);return{x,gamma,visibility:Math.abs(gamma),firstNull:diameter>0?J1_FIRST_ZERO*lambda/(Math.PI*diameter):Infinity};}
// M independent proper complex Gaussian stationary AR(1) modes. A second detector has spatial gamma.
export function hbt({gamma=1,coherence=8,modes=1,count=1024,seed=23,kind='thermal'}={}){
 if(Math.abs(gamma)>1+1e-12)throw Error('Coherence magnitude exceeds one.');const random=rng(seed),a=Math.exp(-1/coherence),noise=Math.sqrt(-Math.expm1(-2/coherence)),g=Math.max(-1,Math.min(1,gamma)),independent=Math.sqrt(Math.max(0,1-g*g)),z=()=>[normal(random)/Math.SQRT2,normal(random)/Math.SQRT2],states=Array.from({length:modes},()=>[z(),z()]),records=[];
 for(let k=0;k<count;k++){let i1=0,i2=0;for(const s of states){if(k){s[0]=add(scale(s[0],a),scale(z(),noise));s[1]=add(scale(s[1],a),scale(z(),noise));}i1+=abs2(s[0])/modes;i2+=abs2(add(scale(s[0],g),scale(s[1],independent)))/modes;}records.push(kind==='constant'?[1,1]:[i1,i2]);}
 const means=[0,1].map(j=>records.reduce((s,p)=>s+p[j],0)/count),correlation=lag=>records.slice(0,count-lag).reduce((s,p,i)=>s+p[0]*records[i+lag][1],0)/((count-lag)*means[0]*means[1]),expected=lag=>kind==='constant'?1:1+g*g*Math.exp(-2*Math.abs(lag)/coherence)/modes;return{records,means,correlation,expected};
}
export function fresnel(u){const sign=Math.sign(u),a=Math.abs(u),segments=Math.max(1,Math.ceil(a*a/4));let re=0,im=0;for(let i=0;i<segments;i++){const l=a*i/segments,r=a*(i+1)/segments;re+=integrateGauss(t=>Math.cos(Math.PI*t*t/2),l,r);im+=integrateGauss(t=>Math.sin(Math.PI*t*t/2),l,r);}return[sign*re,sign*im];}
// Paraxial monochromatic plane-wave reconstruction of an opaque infinite strip, half-width a.
export function youngCard(x,a,z,lambda,mode='both edges'){
 const k=Math.sqrt(2/(lambda*z)),fL=fresnel((-a-x)*k),fR=fresnel((a-x)*k),left=div(add([.5,.5],fL),[1,1]),right=div(sub([.5,.5],fR),[1,1]),field=mode==='left edge'?left:mode==='right edge'?right:add(left,right);
 return{left,right,field,intensity:abs2(field),leftIntensity:abs2(left),rightIntensity:abs2(right),cross:2*(left[0]*right[0]+left[1]*right[1]),fresnelNumber:a*a/(lambda*z)};
}
