// Supplied finite models for DEEP 7. No browser state; M is the atlas math library.
export const sum = xs => xs.reduce((a, b) => a + b, 0);
export const mean = xs => sum(xs) / xs.length;
export const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
export const seq = (a, b, n) => Array.from({length: n}, (_, i) => a + (b-a)*i/(n-1));
export const mse = (a, b) => mean(a.map((x, i) => (x-b[i])**2));
export const target = x => Math.sin(2*x) + .2*Math.cos(3*x);
export const defaultData = () => seq(-1.8, 1.8, 9).map(x => [x, target(x)]);
export const validData = p => Array.isArray(p) && p.length <= 16 && p.every(q => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite) && Math.abs(q[0]) <= 2 && Math.abs(q[1]) <= 2);
export const covariance = (x, y) => .5*(Math.exp(-.5*(x-y)**2)-Math.exp(-.5*((x+y)**2+4)));
export const cosineCovariance = (x, y) => .5*(Math.exp(-.5*(x-y)**2)+Math.exp(-.5*((x+y)**2+4)));
export const tangentLimit = (x, y) => covariance(x,y)+(x*y+1)*cosineCovariance(x,y);
export function initialize(M, width, seed=1) {
  const rng=M.rng(seed), N=M.dist.normal(0,1), theta=[];
  for(let j=0;j<width;j++) theta.push(rng()<.5?-1:1,N.sample(rng),N.sample(rng));
  return theta;
}
export function prediction(theta,x) {
  let s=0;for(let j=0;j<theta.length;j+=3)s+=theta[j]*Math.sin(theta[j+1]*x+theta[j+2]);
  return s/Math.sqrt(theta.length/3);
}
export function gradient(theta,x) {
  const g=[],scale=1/Math.sqrt(theta.length/3);
  for(let j=0;j<theta.length;j+=3){const z=theta[j+1]*x+theta[j+2],c=theta[j]*Math.cos(z)*scale;g.push(Math.sin(z)*scale,x*c,c);}
  return g;
}
export function tangentGram(theta,xs,ys=xs) {
  const gx=xs.map(x=>gradient(theta,x)),gy=ys===xs?gx:ys.map(x=>gradient(theta,x));
  return gx.map(g=>gy.map(h=>dot(g,h)));
}
export const frobenius = A => Math.sqrt(sum(A.flat().map(x=>x*x)));
export const matrixDifference = (A,B) => A.map((row,i)=>row.map((x,j)=>x-B[i][j]));
export function summary(values) {
  const n=values.length,avg=mean(values),variance=n>1?sum(values.map(x=>(x-avg)**2))/(n-1):null;
  return {mean:avg,variance,se:variance===null?null:Math.sqrt(variance/n)};
}
export function cloud(M,{width=32,reps=500,seed=1,x=-.7,y=.7}={}) {
  // Each independent network has its own seed. Widths reuse its initial neuron prefix.
  const points=Array.from({length:reps},(_,i)=>{const t=initialize(M,width,seed*100003+i);return [prediction(t,x),prediction(t,y)];});
  const products=points.map(p=>p[0]*p[1]),projection=points.map(p=>(p[0]+p[1])/Math.sqrt(2));
  return {points,projection,products:summary(products),covariance:covariance(x,y),variance:.5*(covariance(x,x)+covariance(y,y)+2*covariance(x,y)),matrix:[[covariance(x,x),covariance(x,y)],[covariance(x,y),covariance(y,y)]]};
}
function forward(L,b) {
  const y=[];for(let i=0;i<b.length;i++){let s=b[i];for(let j=0;j<i;j++)s-=L[i][j]*y[j];y.push(s/L[i][i]);}return y;
}
function backward(L,b) {
  const x=Array(b.length);for(let i=b.length-1;i>=0;i--){let s=b[i];for(let j=i+1;j<b.length;j++)s-=L[j][i]*x[j];x[i]=s/L[i][i];}return x;
}
export function gpPosterior(M,data,noise=.15) {
  if(!(noise>0))throw new Error('Positive observation noise is part of this GP model.');
  const A=data.map(([x],i)=>data.map(([y],j)=>covariance(x,y)+(i===j?noise*noise:0))),L=M.cholesky(A);
  if(!L)throw new Error('GP covariance factorization failed; no hidden jitter added.');
  const alpha=backward(L,forward(L,data.map(p=>p[1])));
  return {A,L,alpha,at(x){const k=data.map(p=>covariance(x,p[0])),v=forward(L,k),rawVariance=covariance(x,x)-dot(v,v);if(rawVariance < -1e-10)throw new Error('Negative GP conditional variance.');return {mean:dot(k,alpha),variance:Math.max(0,rawVariance),futureVariance:Math.max(0,rawVariance)+noise*noise};}};
}
export function rk4(state,dt,velocity) {
  const a=velocity(state),b=velocity(state.map((x,i)=>x+dt*a[i]/2)),c=velocity(state.map((x,i)=>x+dt*b[i]/2)),d=velocity(state.map((x,i)=>x+dt*c[i]));
  return state.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6);
}
// Loss = mean squared residual / 2. For centered alpha*h, optimize loss/alpha².
export function networkVelocity(theta,data,{alpha=1,initial=null}={}) {
  const g=Array(theta.length).fill(0);if(!data.length)return g;
  for(const [x,y] of data){const output=alpha*(prediction(theta,x)-(initial?prediction(initial,x):0)),r=(output-y)/(data.length*alpha),j=gradient(theta,x);for(let k=0;k<g.length;k++)g[k]-=r*j[k];}
  return g;
}
export function kernelFlow(M,K,initial,labels,time) {
  const n=labels.length;if(!n)return {output:[],coefficients:[],eigenvalues:[]};
  const E=M.eigSym(K),residual=labels.map((y,i)=>y-initial[i]),coefficients=Array(n).fill(0),output=initial.slice();
  E.values.forEach((raw,k)=>{if(raw < -1e-8)throw new Error('Kernel Gram matrix is not positive semidefinite.');const lambda=Math.max(0,raw),c=dot(E.vecs[k],residual),factor=lambda>1e-12?-Math.expm1(-lambda*time/n)/lambda:time/n;for(let i=0;i<n;i++){coefficients[i]+=c*factor*E.vecs[k][i];output[i]+=c*(-Math.expm1(-lambda*time/n))*E.vecs[k][i];}});
  return {output,coefficients,eigenvalues:E.values};
}
export function trainNetwork(M,{width=32,seed=1,data=defaultData(),time=3,dt=.05,alpha=1,centered=false,xs=seq(-2,2,101)}={}) {
  const initial=initialize(M,width,seed),inputs=data.map(p=>p[0]),labels=data.map(p=>p[1]),K=tangentGram(initial,inputs),f0=inputs.map(x=>centered?0:alpha*prediction(initial,x)),velocity=t=>networkVelocity(t,data,{alpha,initial:centered?initial:null});
  let theta=initial.slice();const count=Math.ceil(time/dt),step=count?time/count:0,trace=[];
  const output=(t,x)=>alpha*(prediction(t,x)-(centered?prediction(initial,x):0));
  const capture=t=>{const outputTrain=inputs.map(x=>output(theta,x)),Kt=tangentGram(theta,inputs),move=Array.from({length:width},(_,j)=>Math.hypot(...theta.slice(3*j,3*j+3).map((x,k)=>x-initial[3*j+k])));trace.push({time:t,loss:data.length?mse(outputTrain,labels)/2:0,drift:K.length?frobenius(matrixDifference(Kt,K))/frobenius(K):0,maxMove:Math.max(...move),totalMove:Math.hypot(...theta.map((x,i)=>x-initial[i]))});};
  capture(0);for(let k=0;k<count;k++){theta=rk4(theta,step,velocity);if(k%Math.max(1,Math.floor(count/30))===0||k===count-1)capture((k+1)*step);}
  const exact=kernelFlow(M,K,f0,labels,time),cross=tangentGram(initial,xs,inputs),actual=xs.map(x=>output(theta,x)),frozen=xs.map((x,i)=>(centered?0:alpha*prediction(initial,x))+dot(cross[i],exact.coefficients));
  return {initial,theta,K,exact,xs,actual,frozen,initialCurve:xs.map(x=>centered?0:alpha*prediction(initial,x)),trace,final:trace.at(-1),gap:Math.max(...actual.map((x,i)=>Math.abs(x-frozen[i]))),testMSE:mse(actual,xs.map(target)),trainMSE:data.length?2*trace.at(-1).loss:null,step,count,alpha};
}
export function kernelRegression(M,{data=defaultData(),time=3,seed=1,zero=false,xs=seq(-2,2,101)}={}) {
  const theta=initialize(M,64,seed),f0=x=>zero?0:prediction(theta,x),inputs=data.map(p=>p[0]),K=inputs.map(x=>inputs.map(y=>tangentLimit(x,y))),labels=data.map(p=>p[1]),initial=inputs.map(f0),flow=kernelFlow(M,K,initial,labels,time),actual=xs.map(x=>f0(x)+dot(inputs.map(y=>tangentLimit(x,y)),flow.coefficients));
  const E=M.eigSym(K),residual=labels.map((y,i)=>y-initial[i]),modes=E.values.map((lambda,k)=>({lambda,initial:dot(E.vecs[k],residual),remaining:dot(E.vecs[k],residual)*Math.exp(-Math.max(0,lambda)*time/Math.max(1,labels.length))}));
  return {xs,actual,K,flow,modes,initial:xs.map(f0),trainMSE:data.length?mse(flow.output,labels):null,testMSE:mse(actual,xs.map(target))};
}
export function rff(M,{pairs=32,length=1,seed=1,xs=seq(-2,2,25)}={}) {
  const rng=M.rng(seed),normal=M.dist.normal(0,1/length),omega=Array.from({length:pairs},()=>normal.sample(rng)),kernel=(x,y)=>mean(omega.map(w=>Math.cos(w*(x-y)))),exact=(x,y)=>Math.exp(-.5*((x-y)/length)**2);
  const approximation=xs.map(x=>xs.map(y=>kernel(x,y))),truth=xs.map(x=>xs.map(y=>exact(x,y))),errors=matrixDifference(approximation,truth).flat();
  const variance=(x,y)=>{const q=((x-y)/length)**2;return .5*(-Math.expm1(-q))**2/pairs;};
  return {omega,kernel,exact,variance,approximation,truth,rmse:Math.sqrt(mean(errors.map(e=>e*e))),maxError:Math.max(...errors.map(Math.abs)),expectedSquaredRMSE:mean(xs.flatMap(x=>xs.map(y=>variance(x,y))))};
}
export function spectrum(time=2,mode='low frequencies first') {
  const rates=mode==='low frequencies first'?[1,.25,.08]:[.08,.25,1],frequencies=[1,3,7],amplitudes=[1,.5,.35],learned=amplitudes.map((a,i)=>a*(-Math.expm1(-rates[i]*time)));
  const evaluate=(x,coeffs)=>sum(coeffs.map((a,i)=>a*Math.sin(frequencies[i]*x)));
  return {rates,frequencies,amplitudes,learned,target:x=>evaluate(x,amplitudes),fit:x=>evaluate(x,learned),error:time=>.5*sum(amplitudes.map((a,i)=>a*a*Math.exp(-2*rates[i]*time)))};
}
export function initializeParticles(M,width,seed=1) {
  const rng=M.rng(seed),theta=[];for(let j=0;j<width;j++)theta.push((rng()-.5)*Math.PI,2*(rng()-.5));return theta;
}
export function particlePrediction(theta,x) {
  let s=0;for(let j=0;j<theta.length;j+=2)s+=Math.sin(theta[j])*Math.sin(theta[j+1]*x);return s/(theta.length/2);
}
export function particleVelocity(theta,data) {
  const g=Array(theta.length).fill(0);if(!data.length)return g;
  for(const [x,y] of data){const r=(particlePrediction(theta,x)-y)/data.length;for(let j=0;j<theta.length;j+=2){g[j]-=r*Math.cos(theta[j])*Math.sin(theta[j+1]*x);g[j+1]-=r*Math.sin(theta[j])*x*Math.cos(theta[j+1]*x);}}return g;
}
export function trainParticles(M,{width=64,seed=1,data=defaultData(),time=3,dt=.05,xs=seq(-2,2,101)}={}) {
  const initial=initializeParticles(M,width,seed),count=Math.ceil(time/dt),step=count?time/count:0;let theta=initial.slice();const trace=[];
  const capture=t=>trace.push([t,data.length?mean(data.map(([x,y])=>(particlePrediction(theta,x)-y)**2))/2:0]);
  capture(0);for(let k=0;k<count;k++){theta=rk4(theta,step,t=>particleVelocity(t,data));if(k%Math.max(1,Math.floor(count/30))===0||k===count-1)capture((k+1)*step);}
  const actual=xs.map(x=>particlePrediction(theta,x));return {initial,theta,trace,xs,actual,trainMSE:data.length?2*trace.at(-1)[1]:null,testMSE:mse(actual,xs.map(target)),step,count};
}
export function physicalInitialization(M,width,seed=1,mode='μP') {
  const rng=M.rng(seed),N=M.dist.normal(0,1),theta=[];for(let j=0;j<width;j++)theta.push(N.sample(rng),N.sample(rng)/(mode==='μP'?width:Math.sqrt(width)));return theta;
}
export function physicalPrediction(theta,x) {
  let s=0;for(let j=0;j<theta.length;j+=2)s+=theta[j+1]*Math.tanh(theta[j]*x);return s;
}
export function physicalStep(theta,data,eta,mode='μP') {
  const width=theta.length/2,g=Array(theta.length).fill(0);if(!data.length)return theta.slice();
  for(const [x,y] of data){const r=(physicalPrediction(theta,x)-y)/data.length;for(let j=0;j<theta.length;j+=2){const h=Math.tanh(theta[j]*x);g[j]+=r*theta[j+1]*(1-h*h)*x;g[j+1]+=r*h;}}
  return theta.map((x,j)=>x-eta*(mode==='μP'?(j%2?1/width:width):1)*g[j]);
}
export function physicalTrain(M,{width=32,seed=1,mode='μP',eta=.1,steps=30,data=defaultData(),xs=seq(-2,2,101)}={}) {
  let theta=physicalInitialization(M,width,seed,mode),diverged=false,completed=0;
  // An explicit numerical ceiling, never a clipped successful fit.
  for(let i=0;i<steps;i++){theta=physicalStep(theta,data,eta,mode);completed=i+1;if(theta.some(x=>!Number.isFinite(x)||Math.abs(x)>1e6)){diverged=true;break;}}
  const actual=diverged?[]:xs.map(x=>physicalPrediction(theta,x)),trainMSE=diverged?Infinity:data.length?mean(data.map(([x,y])=>(physicalPrediction(theta,x)-y)**2)):null,testMSE=diverged?Infinity:mse(actual,xs.map(target));
  return {theta,xs,actual,trainMSE,testMSE,diverged,completed};
}
export const sweepWidths=[8,32,128,512];
export const sweepExponents=seq(-3,.5,11);
export function transferSweep(M,{seed=1,mode='μP',steps=30,data=defaultData()}={}) {
  const xs=seq(-2,2,41);
  return sweepWidths.map(width=>{const runs=sweepExponents.map(exponent=>({exponent,eta:10**exponent,...physicalTrain(M,{width,seed,mode,steps,data,xs,eta:10**exponent})})),finite=runs.filter(r=>Number.isFinite(r.testMSE)),best=finite.reduce((a,b)=>!a||b.testMSE<a.testMSE?b:a,null);return {width,runs,best};});
}
