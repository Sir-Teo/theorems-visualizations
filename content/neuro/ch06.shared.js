// NEURO6: synthetic stimuli and declared point-process models, in seconds.
import {rng,lgamma,erfc,integrate as quadrature} from '../../assets/js/viz/math.js';
import {finite,integer,lin,sum,fmt} from '../mathbio/ch06.shared.js';
export {finite,integer,lin,sum,fmt};
export const TAU=2*Math.PI,O={step:'any',sig:5,fmt},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:320,...extra});
export const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
export function random(seed=1){integer(seed,1,0xffffffff,'seed');const r=rng(seed);return{u:()=>r()+2**-33,normal:()=>r.normal()};}
export const exponential=r=>-Math.log(r.u());
export function erlang(r,k,rate){let s=0;for(let j=0;j<k;j++)s+=exponential(r);return s/rate;}
// Arrival counting, rather than a Gaussian approximation or a one-event cap.
export function poissonCount(r,mean){finite(mean,0,1e6,'Poisson mean');if(mean===0)return 0;let s=0,n=0;while((s+=exponential(r))<mean)n++;return n;}
export function stats(a){if(!a.length)return{mean:null,variance:null,cv:null};const mean=sum(a)/a.length,variance=a.length>1?sum(a.map(x=>(x-mean)**2))/(a.length-1):null;return{mean,variance,cv:mean>0&&variance!==null?Math.sqrt(variance)/mean:null};}
export function histogram(a,lo,hi,n=20){const w=(hi-lo)/n,bins=Array(n).fill(0);let outside=0;for(const x of a){if(x<lo||x>hi){outside++;continue;}bins[Math.min(n-1,Math.floor((x-lo)/w))]++;}return{rows:bins.map((k,j)=>[lo+(j+.5)*w,a.length?k/(a.length*w):0]),counts:bins,outside,width:w};}
const sinc=x=>x===0?1:Math.sin(x)/x;
export const rateAverage=(rate,m,f,a,b)=>rate*(1+m*sinc(TAU*f*(b-a)/2)*Math.cos(TAU*f*(a+b)/2));
export function rateIntegral(rate,m,f,a,b){const w=TAU*f,dt=b-a;return rate*dt*(1+m*sinc(w*dt/2)*Math.cos(w*(a+b)/2));}
export function poissonEvents({rate=20,m=.7,f=2,T=2,seed=1}={}){
 finite(rate,0,60,'rate');finite(m,0,.9,'modulation');finite(f,0,10,'frequency');finite(T,0,6,'duration');const r=random(seed),bound=rate*(1+m),events=[];if(bound===0)return events;
 let t=0;while((t+=exponential(r)/bound)<T)if(r.u()<(1+m*Math.cos(TAU*f*t))/(1+m))events.push(t);return events;
}
export function psth({rate=20,m=.7,f=2,trials=30,binMs=40,seed=1,T=2}={}){
 finite(T,.05,6,'duration');integer(trials,8,100,'trials');finite(binMs,5,200,'bin width');integer(seed,1,99999,'seed');const trains=Array.from({length:trials},(_,i)=>poissonEvents({rate,m,f,T,seed:seed+104729*i})),width=binMs/1000,n=Math.ceil(T/width),bins=Array(n).fill(0);
 for(const train of trains)for(const t of train)bins[Math.min(n-1,Math.floor(t/width))]++;
 const rows=bins.map((count,j)=>{const a=j*width,b=Math.min(T,(j+1)*width),exposure=trials*(b-a);return{a,b,count,exposure,observed:count/exposure,expected:rateAverage(rate,m,f,a,b)};});
 return{trains,rows,total:sum(bins),rate:sum(bins)/(trials*T)};
}
export function poissonPMF(n,mean){integer(n,0,1000,'count');finite(mean,0,1000,'mean');return mean===0?(n===0?1:0):Math.exp(n*Math.log(mean)-mean-lgamma(n+1));}
export function poissonSummary({rate=20,m=0,seed=1,trials=200}={}){
 integer(trials,20,500,'trials');const p=psth({rate,m,f:2,trials:Math.min(100,trials),binMs:40,seed}),counts=Array.from({length:trials},(_,i)=>poissonEvents({rate,m,f:2,T:1,seed:seed+104729*i}).length),s=stats(counts),r=random(seed+700001),intervals=rate>0?Array.from({length:400},()=>exponential(r)):[];
 return{...p,counts,meanCount:rate,fano:s.mean>0?s.variance/s.mean:null,normalizedIntervals:intervals};
}
export function renewalLaw(mode='regular',rate=20,refMs=8,k=4){
 if(!['Poisson','regular','bursty'].includes(mode))throw RangeError('renewal family');finite(rate,5,40,'rate');finite(refMs,0,15,'dead time');integer(k,1,5,'Erlang order');const ref=mode==='regular'?refMs/1000:0,gamma=mode==='regular'?k*rate/(1-rate*ref):rate,fast=5*rate,slow=(.2/.84)*rate,cv2=mode==='Poisson'?1:mode==='bursty'?6.12:(1-rate*ref)**2/k;
 return{mode,rate,ref,k,gamma,fast,slow,cv2,mean:1/rate};
}
export function renewalInterval(r,q){return q.mode==='bursty'?exponential(r)/(r.u()<.8?q.fast:q.slow):q.ref+erlang(r,q.mode==='Poisson'?1:q.k,q.gamma);}
export function residualInterval(r,q){
 if(q.mode==='Poisson')return exponential(r)/q.rate;
 if(q.mode==='bursty'){const rate=r.u()<.16?q.fast:q.slow;return r.u()*erlang(r,2,rate);}
 // Size-bias the full interval, then choose a uniform observation point in it.
 const k=q.k+(r.u()<q.ref/q.mean?0:1),length=q.ref+erlang(r,k,q.gamma);return r.u()*length;
}
export function renewalEvents(q,T=2,seed=1){finite(T,.05,6,'duration');const r=random(seed),events=[];let t=residualInterval(r,q);while(t<T){events.push(t);t+=renewalInterval(r,q);}return events;}
export function variability({mode='regular',rate=20,refMs=8,window=.5,trials=200,seed=1}={}){
 finite(window,.05,2,'window');integer(trials,40,300,'trials');integer(seed,1,99999,'seed');const q=renewalLaw(mode,rate,refMs),counts=Array.from({length:trials},(_,i)=>renewalEvents(q,window,seed+104729*i).length),r=random(seed+700001),intervals=Array.from({length:600},()=>renewalInterval(r,q)),cs=stats(counts),is=stats(intervals);
 return{q,counts,intervals,meanCount:cs.mean,fano:cs.mean>0?cs.variance/cs.mean:null,cv:is.cv,cv2:q.cv2,trains:Array.from({length:16},(_,i)=>renewalEvents(q,2,seed+104729*i))};
}
export function erlangHazard(age,refMs=8,k=3,gamma=50){
 finite(age,0,.3,'age');finite(refMs,0,30,'dead time');integer(k,1,5,'Erlang order');finite(gamma,10,100,'phase rate');const ref=refMs/1000;if(age<ref)return{survivor:1,density:0,hazard:0};const x=gamma*(age-ref);let term=1,poly=1;for(let j=1;j<k;j++){term*=x/j;poly+=term;}const e=Math.exp(-x),survivor=e*poly,density=gamma*e*term;return{survivor,density,hazard:gamma*term/poly};
}
export function renewalPSD(q,f){
 finite(f,0,100,'frequency');if(f===0)return q.rate*q.cv2;if(q.mode==='Poisson')return q.rate;const w=TAU*f;
 if(q.mode==='bursty'){const c=.8*q.fast+.2*q.slow,d=.2*q.fast+.8*q.slow;return q.rate*(1+2*(c-q.rate)*d/(d*d+w*w));}
 const angle=-w*q.ref-q.k*Math.atan(w/q.gamma),logR=-q.k*Math.log1p((w/q.gamma)**2)/2,R=Math.exp(logR),oneMinusR=-Math.expm1(logR),den=oneMinusR**2+4*R*Math.sin(angle/2)**2;return q.rate*(-Math.expm1(2*logR))/den;
}
export function pairDensity(q,lag){
 finite(lag,0,.3,'lag');if(q.mode==='Poisson')return q.rate*q.rate;
 if(q.mode==='bursty'){const c=.8*q.fast+.2*q.slow,d=.2*q.fast+.8*q.slow;return q.rate*(q.rate+(c-q.rate)*Math.exp(-d*lag));}
 let density=0;for(let j=1;j<=200;j++){const age=lag-j*q.ref;if(age<0)break;const order=j*q.k,x=q.gamma*age,log=x===0?(order===1?Math.log(q.gamma):-Infinity):Math.log(q.gamma)+(order-1)*Math.log(x)-x-lgamma(order);density+=Math.exp(log);}return q.rate*density;
}
export function periodogram(events,T,f){let re=0,im=0;for(const t of events){re+=Math.cos(TAU*f*t);im-=Math.sin(TAU*f*t);}return(re*re+im*im)/T;}
export function spectrum({mode='regular',rate=20,refMs=8,T=4,seed=1}={}){
 if(!['Poisson','regular','bursty','oscillatory'].includes(mode))throw RangeError('spectral family');integer(T,2,6,'duration');integer(seed,1,99999,'seed');const q=renewalLaw(mode==='oscillatory'?'Poisson':mode,rate,refMs),trains=Array.from({length:8},(_,i)=>mode==='oscillatory'?poissonEvents({rate,m:.8,f:10,T,seed:seed+104729*i}):renewalEvents(q,T,seed+104729*i)),freq=Array.from({length:100*T},(_,j)=>(j+1)/T),psd=freq.map(f=>[f,sum(trains.map(a=>periodogram(a,T,f)))/trains.length,mode==='oscillatory'?rate+(f===10?rate*rate*.8**2*T/4:0):renewalPSD(q,f)]),bin=.005,n=40,counts=Array(n).fill(0);
 for(const train of trains)for(let i=0;i<train.length;i++)for(let j=i+1;j<train.length;j++){const u=train[j]-train[i];if(u>=n*bin)break;counts[Math.floor(u/bin)]++;}
 const pairs=counts.map((count,j)=>{const a=j*bin,b=(j+1)*bin,exposure=T*(b-a)-(b*b-a*a)/2;let theory;if(mode==='oscillatory'){const w=TAU*10,m=.8;theory=quadrature(u=>rate*rate*((T-u)*(1+m*m*Math.cos(w*u)/2)-(2*m+m*m/2)*Math.sin(w*u)/w),a,b,40)/exposure;}else theory=quadrature(u=>(T-u)*pairDensity(q,u),a,b,80)/exposure;return[(a+b)/2,count/(trains.length*exposure),theory];});
 return{q,trains,psd,pairs,continuousZero:mode==='oscillatory'?null:rate*q.cv2,total:sum(trains.map(a=>a.length))};
}
export const orientationRate=(theta,pref=60,base=5,gain=35,kappa=2)=>base+gain*Math.exp(kappa*(Math.cos(2*Math.PI*(theta-pref)/180)-1));
export function tuning({pref=60,base=5,gain=35,kappa=2,trials=30,seed=1}={}){
 finite(pref,0,180,'preferred orientation');finite(base,1,20,'baseline');finite(gain,0,60,'amplitude');finite(kappa,0,6,'sharpness');integer(trials,5,100,'trials');const r=random(seed),duration=.25,rows=lin(13,0,180).map(theta=>{const rate=orientationRate(theta,pref,base,gain,kappa),count=poissonCount(r,trials*duration*rate);return[theta,rate,count/(trials*duration),Math.sqrt(trials*duration*rate)/(trials*duration)];});return{rows,duration,total:sum(rows.map(r=>r[2]*trials*duration))};
}
// Pivoted elimination, scoped to the small positive definite fitting systems.
export function linearSolve(A,b){const n=b.length,M=A.map((row,i)=>[...row,b[i]]);for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;[M[k],M[p]]=[M[p],M[k]];if(!(Math.abs(M[k][k])>0))throw Error('Singular fitting system');for(let i=k+1;i<n;i++){const c=M[i][k]/M[k][k];for(let j=k;j<=n;j++)M[i][j]-=c*M[k][j];}}const x=Array(n).fill(0);for(let i=n-1;i>=0;i--)x[i]=(M[i][n]-sum(M[i].slice(i+1,n).map((c,j)=>c*x[i+1+j])))/M[i][i];return x;}
export function filter(gain=1){const a=[.2,.7,1,.45,-.35,-.65,-.35,-.1],norm=Math.hypot(...a);return a.map(x=>gain*x/norm);}
export function lnpData({N=512,rho=0,base=15,gain=1,exposure=.02,seed=1}={}){
 integer(N,128,8192,'sample count');finite(rho,0,.9,'input correlation');finite(base,1,40,'baseline');finite(gain,0,1.2,'filter gain');finite(exposure,.001,1,'exposure');const r=random(seed),c=random(seed+700001),stim=[];let x=r.normal();for(let i=0;i<N+7;i++){if(i)x=rho*x+Math.sqrt(1-rho*rho)*r.normal();stim.push(x);}const w=filter(gain),X=Array.from({length:N},(_,i)=>Array.from({length:8},(_,j)=>stim[i+7-j])),rates=X.map(row=>base*Math.exp(dot(row,w))),counts=rates.map(rate=>poissonCount(c,exposure*rate));return{X,rates,counts,w,exposure,rho,base,gain};
}
export function sta(data,ridge=.01){finite(ridge,.0001,1,'covariance ridge');const{X,counts,w,rho}=data,N=X.length,p=w.length,total=sum(counts),mean=Array.from({length:p},(_,j)=>sum(X.map(a=>a[j]))/N),raw=total?mean.map((v,j)=>sum(X.map((a,i)=>counts[i]*(a[j]-v)))/total):null,cov=mean.map((v,j)=>mean.map((u,k)=>sum(X.map(a=>(a[j]-v)*(a[k]-u)))/N)),corrected=raw?linearSolve(cov.map((row,j)=>row.map((v,k)=>v+(j===k?ridge:0))),raw):null,expected=w.map((_,j)=>sum(w.map((v,k)=>v*rho**Math.abs(j-k))));return{raw,corrected,expected,total,cov,mean};}
export function poissonObjective(data,beta,ridge=.02){let value=ridge*dot(beta,beta)/2;for(let i=0;i<data.X.length;i++){const eta=beta[0]+dot(data.X[i],beta.slice(1));value+=data.exposure*Math.exp(eta)-data.counts[i]*eta;}return value;}
// Stable exponential Bregman remainder, without subtracting large objectives.
function expRemainder(x){if(Math.abs(x)>.01)return Math.expm1(x)-x;let term=x*x/2,total=term;for(let k=3;k<=14;k++){term*=x/k;total+=term;}return total;}
export function fitLNP(data,ridge=.02){
 finite(ridge,.001,2,'penalty');const p=9,beta=Array(p).fill(0),features=data.X.map(x=>[1,...x]);beta[0]=Math.log((sum(data.counts)+.5)/(data.X.length*data.exposure));let objective=poissonObjective(data,beta,ridge),iterations=0,gradientNorm=Infinity;const history=[objective];
 for(;iterations<60;iterations++){const g=beta.map(b=>ridge*b),H=Array.from({length:p},(_,j)=>Array.from({length:p},(_,k)=>j===k?ridge:0)),mus=[];for(let i=0;i<features.length;i++){const x=features[i],mu=data.exposure*Math.exp(dot(x,beta)),delta=mu-data.counts[i];mus.push(mu);for(let j=0;j<p;j++){g[j]+=delta*x[j];for(let k=0;k<p;k++)H[j][k]+=mu*x[j]*x[k];}}gradientNorm=Math.max(...g.map(Math.abs));if(gradientNorm<1e-10)break;const step=linearSolve(H,g),stepNorm=Math.max(...step.map(Math.abs)),slope=dot(g,step);if(stepNorm<5e-13)break;let fraction=1,candidate,next,accepted=false;
  for(let back=0;back<60;back++){const changes=features.map(x=>-fraction*dot(x,step)),change=-fraction*slope+sum(changes.map((d,i)=>mus[i]*expRemainder(d)))+ridge*fraction*fraction*dot(step,step)/2;candidate=beta.map((b,j)=>b-fraction*step[j]);if(Number.isFinite(change)&&change<=-1e-4*fraction*slope){next=poissonObjective(data,candidate,ridge);if(Number.isFinite(next)){accepted=true;break;}}fraction/=2;}
  if(!accepted)throw Error('Poisson line search failed');beta.splice(0,p,...candidate);objective=next;history.push(objective);
 }
 if(iterations===60)throw Error('Poisson fitting iteration budget exhausted');
 return{beta,objective,iterations,gradientNorm,history,predict:X=>X.map(x=>Math.exp(beta[0]+dot(x,beta.slice(1))))};
}
export function lnpFit({rho=0,base=15,gain=1,trials=10,seed=1,ridge=.02}={}){integer(trials,1,40,'repeats');const exposure=.02*trials,train=lnpData({rho,base,gain,exposure,seed}),test=lnpData({N:256,rho,base,gain,exposure,seed:seed+1000003}),fit=fitLNP(train,ridge),predicted=fit.predict(test.X),rmse=Math.sqrt(sum(predicted.map((v,i)=>(v-test.rates[i])**2))/predicted.length);return{train,test,fit,predicted,rmse};}
export function receptive({mode='Gabor',theta=45,phase=0,frequency=1,sigma=.55,balance=true}={}){
 if(!['Gabor','DoG'].includes(mode)||typeof balance!=='boolean')throw RangeError('receptive-field mode');finite(theta,0,180,'orientation');finite(phase,0,360,'phase');finite(frequency,0,2,'spatial frequency');finite(sigma,.25,.8,'spatial width');const n=41,xy=lin(n,-2,2),angle=theta*Math.PI/180,phi=phase*Math.PI/180,raw=[];
 const g1=[],g2=[];for(const y of xy)for(const x of xy){const r2=x*x+y*y;g1.push(Math.exp(-r2/(2*sigma*sigma)));g2.push(Math.exp(-r2/(8*sigma*sigma)));raw.push(Math.exp(-r2/(2*sigma*sigma))*Math.cos(TAU*.8*x));}const s1=sum(g1),s2=sum(g2);let kernel=mode==='DoG'?g1.map((v,i)=>v/s1-.8*g2[i]/s2):raw;if(balance){const dc=sum(kernel)/kernel.length;kernel=kernel.map(x=>x-dc);}const norm=sum(kernel.map(Math.abs));kernel=kernel.map(x=>x/norm);let A=0,B=0;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=TAU*frequency*(xy[i]*Math.cos(angle)+xy[j]*Math.sin(angle));A+=kernel[j*n+i]*Math.cos(u);B-=kernel[j*n+i]*Math.sin(u);}const response=(x,y)=>A*Math.cos(TAU*frequency*(x*Math.cos(angle)+y*Math.sin(angle))+phi)+B*Math.sin(TAU*frequency*(x*Math.cos(angle)+y*Math.sin(angle))+phi);return{n,xy,kernel,A,B,response,dc:sum(kernel),center:response(0,0),amplitude:Math.hypot(A,B)};
}
export function unitDegrees(degrees){const q=Math.round(degrees/90),t=(degrees-90*q)*Math.PI/180,c=Math.cos(t),s=Math.sin(t),z=((q%4)+4)%4;return[[c,s],[-s,c],[-c,-s],[s,-c]][z].map(x=>x===0?0:x);}
export function populationVector(counts,prefs,center=true){if(counts.length!==prefs.length||!counts.length)throw RangeError('population dimensions');counts.forEach(x=>integer(x,0,1e6,'count'));prefs.forEach(x=>finite(x,-360,720,'preference'));const mean=center?sum(counts)/counts.length:0,weights=counts.map(x=>x-mean),v=[0,0];for(let i=0;i<counts.length;i++){const u=unitDegrees(prefs[i]);v[0]+=weights[i]*u[0];v[1]+=weights[i]*u[1];}const norm=Math.hypot(...v),budget=sum(weights.map(Math.abs)),zero=weights.every(x=>x===0)||norm===0,unresolved=!zero&&norm<=64*Number.EPSILON*budget;let angle=zero||unresolved?null:Math.atan2(v[1],v[0])*180/Math.PI;if(angle!==null&&angle<0)angle+=360;return{v,norm,angle,status:zero?'zero vector':unresolved?'numerically unresolved':'defined'};}
export function population({N=12,theta=75,modulation=.7,rate=20,duration=.25,seed=1}={}){
 integer(N,4,24,'population');finite(theta,0,360,'direction');finite(modulation,0,.9,'tuning depth');finite(rate,5,40,'baseline');finite(duration,.01,1,'duration');const prefs=Array.from({length:N},(_,i)=>360*i/N),rates=prefs.map(p=>rate*(1+modulation*unitDegrees(theta-p)[0])),r=random(seed),counts=rates.map(x=>poissonCount(r,duration*x)),vector=populationVector(counts,prefs),u=unitDegrees(theta),expected=u.map(x=>x*duration*rate*modulation*N/2),error=vector.angle===null?null:Math.atan2(Math.sin((vector.angle-theta)*Math.PI/180),Math.cos((vector.angle-theta)*Math.PI/180))*180/Math.PI;return{prefs,rates,counts,vector,expected,error,total:sum(counts)};
}
export function fisherPopulation({N=8,s=.2,width=.4,base=2,gain=30,duration=.25}={}){
 integer(N,1,16,'population');finite(s,-1,1,'stimulus');finite(width,.15,1,'tuning width');finite(base,1,10,'baseline');finite(gain,0,50,'amplitude');finite(duration,.01,1,'duration');const prefs=N===1?[0]:lin(N,-1,1),excess=prefs.map(p=>gain*Math.exp(-(((s-p)/width)**2)/2)),rates=excess.map(x=>base+x),derivatives=excess.map((x,i)=>x*(prefs[i]-s)/(width*width)),logSlopes=prefs.map(p=>gain===0||p===s?-Infinity:Math.log(gain)-((s-p)/width)**2/2+Math.log(Math.abs(p-s))-2*Math.log(width)),logs=logSlopes.map((x,i)=>Math.log(duration)+2*x-Math.log(rates[i])),maximum=Math.max(...logs),logInformation=maximum===-Infinity?null:maximum+Math.log(sum(logs.map(x=>Math.exp(x-maximum)))),information=logInformation===null?0:Math.exp(logInformation),terms=logs.map(x=>Math.exp(x)),boundValue=logInformation===null?null:Math.exp(-logInformation),bound=Number.isFinite(boundValue)?boundValue:null,scoreWeights=logInformation===null?null:logSlopes.map((x,i)=>Math.sign(prefs[i]-s)*Math.exp(x-Math.log(rates[i])-logInformation/2));
 return{prefs,rates,derivatives,terms,information,logInformation,bound,scoreWeights,status:logInformation===null?'zero':information===0?'positive below binary64 range':'positive',s,duration};
}
export function fisherSamples(args={},seed=1,trials=400){integer(trials,20,800,'trials');const q=fisherPopulation(args),r=random(seed),standardized=q.scoreWeights?Array.from({length:trials},()=>sum(q.rates.map((rate,i)=>(poissonCount(r,q.duration*rate)-q.duration*rate)*q.scoreWeights[i]))):[],factor=q.logInformation===null?null:Math.exp(-q.logInformation/2),raw=Number.isFinite(factor)?standardized.map(x=>x*factor):[],errors=raw.every(Number.isFinite)?raw:[],st=stats(standardized),variance=q.bound!==null&&st.variance!==null?st.variance*q.bound:null,meanError=Number.isFinite(factor)&&st.mean!==null?st.mean*factor:null;return{...q,errors,standardized,variance:Number.isFinite(variance)?variance:null,meanError:Number.isFinite(meanError)?meanError:null,trials,standardVariance:st.variance,standardMean:st.mean};}
export function posteriorFromCounts(counts,prefs,{rate=15,modulation=.7,duration=.25,prior=1,priorDirection=90}={}){
 const hypotheses=lin(9,0,360).slice(0,8),logScores=hypotheses.map(t=>{let value=prior*unitDegrees(t-priorDirection)[0];for(let i=0;i<counts.length;i++){const baseline=rate*(1+.3*Math.cos(TAU*i/counts.length)),mu=duration*baseline*(1+modulation*unitDegrees(t-prefs[i])[0]);value+=counts[i]*Math.log(mu)-mu;}return value;}),maximum=Math.max(...logScores),weights=logScores.map(x=>Math.exp(x-maximum)),normalizer=sum(weights),posterior=weights.map(x=>x/normalizer),tolerance=64*Number.EPSILON*Math.max(1,...logScores.map(Math.abs)),modes=hypotheses.filter((x,i)=>maximum-logScores[i]<=tolerance);return{hypotheses,logScores,posterior,modes,tolerance};
}
export function mapDecode({N=10,truth=90,skew=.5,rate=15,modulation=.7,duration=.25,prior=1,priorDirection=90,seed=1}={}){
 integer(N,4,24,'population');if(![0,45,90,135,180,225,270,315].includes(truth))throw RangeError('hypothesis');finite(skew,0,1,'coverage skew');finite(rate,5,30,'baseline');finite(modulation,0,.9,'tuning depth');finite(duration,.01,1,'duration');finite(prior,0,6,'prior concentration');finite(priorDirection,0,360,'prior direction');const prefs=Array.from({length:N},(_,i)=>360*i/N+skew*180/Math.PI*Math.sin(TAU*i/N)),r=random(seed),rates=prefs.map((p,i)=>rate*(1+.3*Math.cos(TAU*i/N))*(1+modulation*unitDegrees(truth-p)[0])),counts=rates.map(x=>poissonCount(r,duration*x)),posterior=posteriorFromCounts(counts,prefs,{rate,modulation,duration,prior,priorDirection}),vector=populationVector(counts,prefs,false);return{prefs,rates,counts,...posterior,vector,total:sum(counts)};
}
const choose=(n,k)=>{let s=1;for(let j=1;j<=k;j++)s*=((n-j+1)/j);return s;};
export function betaCDF(x,a,b){finite(x,0,1,'stimulus');integer(a,1,6,'shape');integer(b,1,6,'shape');if(x===0||x===1)return x;const n=a+b-1;return sum(Array.from({length:n-a+1},(_,i)=>{const j=i+a;return choose(n,j)*x**j*(1-x)**(n-j);}));}
export function betaDensity(x,a,b){return choose(a+b-1,a-1)*b*x**(a-1)*(1-x)**(b-1);}
export function equalization({a=2,b=5,N=1000,seed=1}={}){integer(a,1,6,'shape');integer(b,1,6,'shape');integer(N,100,4000,'samples');const r=random(seed),stimuli=Array.from({length:N},()=>{const x=erlang(r,a,1),y=erlang(r,b,1);return x/(x+y);}),responses=stimuli.map(x=>betaCDF(x,a,b));return{stimuli,responses,input:histogram(stimuli,0,1),output:histogram(responses,0,1)};}
export function ksUniform(u){const a=[...u].sort((x,y)=>x-y),N=a.length;return Math.max(...a.map((x,i)=>Math.max((i+1)/N-x,x-i/N)));}
export function rescale({refMs=10,gamma=40,N=300,seed=1,wrong=false}={}){
 finite(refMs,0,30,'dead time');finite(gamma,10,100,'post-refractory hazard');integer(N,40,800,'intervals');if(typeof wrong!=='boolean')throw RangeError('hazard choice');const r=random(seed),ref=refMs/1000,intervals=Array.from({length:N},()=>ref+exponential(r)/gamma),z=intervals.map(t=>wrong?gamma*t/(1+gamma*ref):gamma*(t-ref)),u=z.map(x=>-Math.expm1(-x));return{intervals,z,u,ks:ksUniform(u),band:1.36/Math.sqrt(N),mean:sum(z)/N};
}
export function ouStep(u,I,sigma,dt,z,tau=.02){const e=Math.exp(-dt/tau);return I+(u-I)*e+sigma*Math.sqrt(-Math.expm1(-2*dt/tau))*z;}
export function noisyNeuron({mode='escape',drive=.8,softness=.15,sigma=.25,T=2,dt=.00005,seed=1}={}){
 if(!['escape','diffusion'].includes(mode))throw RangeError('noise mechanism');finite(drive,0,1.2,'drive');finite(softness,.05,.3,'softness');finite(sigma,0,.5,'voltage noise');finite(T,.1,5,'duration');finite(dt,.00001,.001,'step');const r=random(seed),ref=.002,tau=.02,events=[],rows=[[0,0]];
 if(mode==='escape'){const envelope=50*Math.exp((Math.max(drive,0)-1)/softness);let last=-ref,t=0,candidate=0;while((candidate+=exponential(r)/envelope)<T){if(candidate<last+ref)continue;const age=candidate-last-ref,u=drive*(-Math.expm1(-age/tau)),hazard=50*Math.exp((u-1)/softness);if(r.u()<hazard/envelope){events.push(candidate);last=candidate;}}let j=0,previous=-ref;for(const t of lin(2001,0,T)){while(j<events.length&&events[j]<=t)previous=events[j++];const age=t-previous-ref;rows.push([t,age<0?0:drive*(-Math.expm1(-age/tau))]);}}
 else if(sigma===0){if(drive>1){const free=tau*Math.log1p(1/(drive-1)),period=free+ref;for(let j=0;;j++){const t=free+j*period;if(t>T)break;events.push(t);}}let j=0,last=-ref;for(const t of lin(2001,0,T)){while(j<events.length&&events[j]<=t)last=events[j++];const age=t-last-ref;rows.push([t,age<0?0:drive*(-Math.expm1(-age/tau))]);}}
 else{let u=0,nextFree=0;const count=Math.ceil(T/dt),saveEvery=Math.max(1,Math.floor(.001/dt));for(let j=1;j<=count;j++){const t=Math.min(T,j*dt),a=(j-1)*dt,h=t-Math.max(a,nextFree);if(h>0){u=ouStep(u,drive,sigma,h,r.normal(),tau);if(u>=1){events.push(t);u=0;nextFree=t+ref;}}else u=0;if(j%saveEvery===0||j===count)rows.push([t,u]);}}
 const intervals=events.slice(1).map((t,i)=>t-events[i]);return{events,rows,rate:events.length/T,intervals,cv:stats(intervals).cv,dt,mode};
}
export function binaryEntropy(p){if(p===0||p===1)return 0;return(-p*Math.log(p)-(1-p)*Math.log1p(-p))/Math.LN2;}
function normalLogTail(x){if(x<26)return Math.log(erfc(x/Math.SQRT2)/2);const inv=1/(x*x);let term=1,series=1;for(let j=1;j<=12;j++){term*=-(2*j-1)*inv;series+=term;}return-x*x/2-Math.log(x)-Math.log(2*Math.PI)/2+Math.log(series);}
// Symmetric Bernoulli KL expansion: F(x)=(1+x)log(1+x)+(1-x)log(1-x).
// Its even power series retains information far below entropy-subtraction error.
function evenKL(x){if(x===1)return 2*Math.LN2;if(x<.1){let power=x*x,value=power;for(let k=2;k<=12;k++){power*=x*x;value+=power/(k*(2*k-1));}return value;}return(1+x)*Math.log1p(x)+(1-x)*Math.log1p(-x);}
function logEvenKL(x){return x<1e-100?2*Math.log(x):Math.log(evenKL(x));}
function tailSeries(x){const inv=1/(x*x);let term=1,series=1;for(let j=1;j<=12;j++){term*=-(2*j-1)*inv;series+=term;}return series;}
export function resonanceInformation(amplitude=.6,sigma=1){
 finite(amplitude,0,.9,'signal amplitude');finite(sigma,0,10,'noise');if(sigma===0||amplitude===0){const p=sigma===0?0:Math.exp(normalLogTail(1/sigma));return{plus:p,minus:p,information:0,logInformation:null,underflow:false};}
 const x=(1-amplitude)/sigma,y=(1+amplitude)/sigma,lp=normalLogTail(x),lm=normalLogTail(y),p=Math.exp(lp),m=Math.exp(lm),constant=Math.log(2*Math.LN2);let logInformation,information;
 // Small-signal Fisher expansion has relative O([A(1+1/sigma²)]²) error.
 // The threshold bounds that error below 1e-8 and preserves sub-ulp amplitudes.
 if(amplitude*(1+(1/sigma)**2)<1e-4){const z=1/sigma,l0=normalLogTail(z),p0=Math.exp(l0);logInformation=2*Math.log(amplitude)-2*Math.log(sigma)-z*z-Math.log(2*Math.PI)-constant-l0-Math.log1p(-p0);information=Math.exp(logInformation);}
 else if(!Number.isFinite(lp)){logInformation=-Infinity;information=0;}
 else{const delta=x>=26?-2*(amplitude/sigma)/sigma-Math.log1p(2*amplitude/(1-amplitude))+Math.log(tailSeries(y))-Math.log(tailSeries(x)):lm-lp,ratio=Math.exp(delta),difference=-Math.expm1(delta),t=(1+ratio)/2,u=difference/(1+ratio),average=p*t;
  if(p===0){logInformation=lp+Math.log(t)+logEvenKL(u)-constant;information=0;}
  else{const v=p*difference/(2*(1-average)),first=average*evenKL(u),second=(1-average)*evenKL(v);information=(first+second)/(2*Math.LN2);logInformation=information>0?Math.log(information):lp+Math.log(t)+logEvenKL(u)-constant;}
 }
 return{plus:p,minus:m,information,logInformation:Number.isFinite(logInformation)?logInformation:null,underflow:information===0};
}
export function resonance({amplitude=.6,sigma=.8,N=200,seed=1}={}){integer(N,40,600,'samples');const q=resonanceInformation(amplitude,sigma),r=random(seed),samples=Array.from({length:N},(_,i)=>{const signal=Math.floor(i/10)%2===0?1:-1;return[i,signal,r.u()<(signal>0?q.plus:q.minus)?1:0];});return{...q,samples,total:sum(samples.map(x=>x[2]))};}
export function quadratureField({theta=30,phase=0,contrast=1,width=.55,frequency=.8}={}){
 finite(theta,0,180,'orientation');finite(phase,0,360,'phase');finite(contrast,0,1,'contrast');finite(width,.25,.8,'width');finite(frequency,0,2,'frequency');const u=unitDegrees(theta),kx=TAU*frequency*u[0],ky=TAU*frequency*u[1],k0=TAU*.8,H=(x,y)=>Math.exp(-width*width*(x*x+y*y)/2),minus=H(kx-k0,ky),plus=H(kx+k0,ky),c=(minus+plus)/2,s=(minus-plus)/2,p=unitDegrees(phase),Rc=contrast*c*p[0],Rs=-contrast*s*p[1],energy=Math.hypot(Rc,Rs);return{Rc,Rs,energy,simple:Math.max(0,Rc),c,s,oppositeLobe:plus,rateSimple:3+60*Math.max(0,Rc),rateComplex:3+60*energy};
}
export function cortexDemo(args={},seed=1){const q=quadratureField(args),r=random(seed),events=rate=>{const out=[];let t=0;while((t+=exponential(r)/rate)<1)out.push(t);return out;};return{...q,simpleEvents:events(q.rateSimple),complexEvents:events(q.rateComplex)};}
