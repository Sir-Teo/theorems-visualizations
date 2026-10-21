// Seeded numerical experiments for statistical resampling. Population and conditional
// bootstrap laws are deliberately kept separate. All data are synthetic.
export {memo,mean,moments,qSorted,sortNum,binned} from './ch03.shared.js';
import {mean,moments,qSorted,binned} from './ch03.shared.js';
export const CMU='https://www.stat.cmu.edu/~larry/=stat705/Lecture20.pdf';
export const BCASOURCE='https://pmc.ncbi.nlm.nih.gov/articles/PMC7958418/';
export const PAPER='https://doi.org/10.1214/aos/1176344552';
export function rng(seed=1){let spare=null;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};r.normal=()=>{if(spare!==null){const z=spare;spare=null;return z;}const a=Math.sqrt(-2*Math.log(r())),b=2*Math.PI*r();spare=a*Math.sin(b);return a*Math.cos(b);};return r;}
export const sorted=a=>a.slice().sort((a,b)=>a-b);
export const quantile=(a,p)=>qSorted(sorted(a),p);
export const median=a=>quantile(a,.5);
export const seMean=a=>moments(a).sd/Math.sqrt(a.length);
export function correlation(a){const x=mean(a.map(p=>p[0])),y=mean(a.map(p=>p[1]));let xx=0,yy=0,xy=0;for(const p of a){xx+=(p[0]-x)**2;yy+=(p[1]-y)**2;xy+=(p[0]-x)*(p[1]-y);}return xx>0&&yy>0?xy/Math.sqrt(xx*yy):null;}
export function statistic(a,kind='mean'){return kind==='median'?median(a):kind==='correlation'?correlation(a):mean(a);}
export function draw(n,r,family='exponential',kind='mean') {return Array.from({length:n},()=>{if(kind==='correlation'){const x=r.normal();return[x,.5*x+Math.sqrt(.75)*r.normal()];}return family==='normal'?r.normal():family==='pareto1.5'?(1-r())**(-1/1.5):family==='pareto3'?(1-r())**(-1/3):-Math.log(1-r());});}
export const truth=(family,kind='mean')=>kind==='correlation'?.5:family==='normal'?0:kind==='median'?Math.LN2:family==='pareto1.5'?3:family==='pareto3'?1.5:1;
export function resample(a,r){return Array.from({length:a.length},()=>a[Math.floor(r()*a.length)]);}
export function bootstrap(a,B,r,kind='mean'){const values=[];let invalid=0;for(let b=0;b<B;b++){const t=statistic(resample(a,r),kind);if(t===null||!Number.isFinite(t))invalid++;else values.push(t);}return{values,invalid};}
export function jackknife(a,kind='mean'){const values=a.map((_,i)=>statistic(a.filter((_,j)=>j!==i),kind));if(values.some(x=>x===null||!Number.isFinite(x)))return{values,se:null,bias:null,acceleration:null};const avg=mean(values),ss=values.reduce((s,t)=>s+(avg-t)**2,0),cube=values.reduce((s,t)=>s+(avg-t)**3,0);return{values,se:Math.sqrt((a.length-1)/a.length*ss),bias:(a.length-1)*(avg-statistic(a,kind)),acceleration:ss>0?cube/(6*ss**1.5):null};}
// Standard normal CDF (absolute error < 8e-8); quantile by bounded bisection.
export function normalCDF(z){const t=1/(1+.2316419*Math.abs(z)),d=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),p=1-d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return z>=0?p:1-p;}
export function normalQuantile(p){if(!(p>0&&p<1))return null;let a=-10,b=10;for(let i=0;i<65;i++){const m=(a+b)/2;if(normalCDF(m)<p)a=m;else b=m;}return(a+b)/2;}
export function bca(a,values,kind,alpha=.05){const t=statistic(a,kind),frac=values.filter(x=>x<t).length/values.length,z0=normalQuantile(frac),acc=jackknife(a,kind).acceleration;if(z0===null||acc===null)return{interval:null,reason:'degenerate bias correction or jackknife acceleration'};const ps=[alpha/2,1-alpha/2].map(p=>{const z=normalQuantile(p),d=1-acc*(z0+z);return d<=0?null:normalCDF(z0+(z0+z)/d);});if(ps.some(p=>p===null||!(p>0&&p<1))||ps[0]>ps[1])return{interval:null,reason:'BCa tail outside stable range'};return{interval:ps.map(p=>quantile(values,p)),probs:ps,z0,acc};}
export function percentile(values,alpha=.05){return values.length>=2?[quantile(values,alpha/2),quantile(values,1-alpha/2)]:null;}
export function meanIntervals(a,B,r,alpha=.05){const t=mean(a),se=seMean(a),vals=[],roots=[];let invalid=0;for(let b=0;b<B;b++){const x=resample(a,r),m=mean(x),s=seMean(x);vals.push(m);if(s>0)roots.push((m-t)/s);else invalid++;}const z=normalQuantile(1-alpha/2);return{percentile:percentile(vals,alpha),normal:[t-z*se,t+z*se],studentized:roots.length>1?[t-quantile(roots,1-alpha/2)*se,t-quantile(roots,alpha/2)*se]:null,roots,values:vals,invalid};}
export function coverage({n=20,kind='mean',family='exponential',B=199,R=100,method='percentile',seed=101,alpha=.05}){const intervals=[],target=truth(family,kind);let covered=0,invalid=0,invalidResamples=0;for(let i=0;i<R;i++){const r=rng(seed+i*104729),a=draw(n,r,family,kind),boot=bootstrap(a,B,r,kind);invalidResamples+=boot.invalid;const ci=method==='BCa'?bca(a,boot.values,kind,alpha).interval:percentile(boot.values,alpha);if(ci&&ci.every(Number.isFinite)){intervals.push(ci);if(ci[0]<=target&&ci[1]>=target)covered++;}else{invalid++;intervals.push(null);}}const p=covered/R;return{intervals,target,covered,invalid,invalidResamples,p,se:Math.sqrt(p*(1-p)/R)};}
export function poisson(r,lambda){const limit=Math.exp(-lambda);let p=1,k=0;do{p*=r();k++;}while(p>limit);return k-1;}
export function counts(n,r,overdispersed=false){return Array.from({length:n},()=>overdispersed?Math.floor(Math.log(1-r())/Math.log(.75)):poisson(r,3));}
export function ar1(n,r,rho){let x=r.normal()/Math.sqrt(1-rho*rho);return Array.from({length:n},(_,i)=>{if(i)x=rho*x+r.normal();return x;});}
export function arMeanVariance(n,rho){let total=n;for(let k=1;k<n;k++)total+=2*(n-k)*rho**k;return total/(n*n*(1-rho*rho));}
export function blockSample(a,r,length){const out=[];while(out.length<a.length){const start=Math.floor(r()*a.length);for(let k=0;k<length&&out.length<a.length;k++)out.push(a[(start+k)%a.length]);}return out;}
export function gammaIntegerCDF(n,x){if(x<=0)return 0;let term=Math.exp(-x),sum=term;for(let k=1;k<n;k++){term*=x/k;sum+=term;}return Math.max(0,Math.min(1,1-sum));}
export function meanRootCDF(n,z,log=false){return gammaIntegerCDF(n,log?n*Math.exp(z/Math.sqrt(n)):n+z*Math.sqrt(n));}
export function kolmogorov(values,cdf){const a=sorted(values),N=a.length;let d=0;for(let i=0;i<N;i++){const p=cdf(a[i]);d=Math.max(d,Math.abs(p-i/N),Math.abs((i+1)/N-p));}return d;}
export function exactBootstrap(a,kind='median'){const values=[],n=a.length,buf=[];function walk(i){if(i===n){values.push(statistic(buf,kind));return;}for(const x of a){buf[i]=x;walk(i+1);}}walk(0);return values;}
export function bounds(arrays,pad=.08){const vals=arrays.flat().filter(Number.isFinite);let lo=Math.min(...vals),hi=Math.max(...vals);if(!(hi>lo)){lo-=.5;hi+=.5;}const d=(hi-lo)*pad;return[lo-d,hi+d];}
export function histogram(s,values,{color='accent',range=null,bins=28,overlay=false}={}){const [lo,hi]=range||bounds([values]),H=binned(values,lo,hi,bins),top=Math.max(H.max,1e-5);if(!overlay)s.setView([lo,hi],[0,top*1.22]);s.hist(H,{color,fillAlpha:.4,density:true});return{H,top};}
export const stage=(v,title,xlabel='statistic',height=300)=>v.stage({x:[0,1],y:[0,1],height,axes:'box',gutter:true,xlabel,ylabel:'density',title});
export const fixed=x=>x===null?'undefined':Number.isFinite(x)?x.toFixed(4):'undefined';
export function twoHists(s,a,b){const range=bounds([a,b]),A=binned(a,...range,28),B=binned(b,...range,28);s.setView(range,[0,Math.max(A.max,B.max)*1.2]);s.hist(A,{color:'accent',fillAlpha:.35,density:true});s.hist(B,{color:'orange',fillAlpha:.35,density:true});}
export function intervalPlot(s,intervals,target){const finite=intervals.filter(Boolean),range=bounds([finite.flat(),[target]]);s.setView(range,[0,intervals.length+1]);intervals.forEach((a,i)=>{if(a)s.line(a[0],i+1,a[1],i+1,{color:a[0]<=target&&a[1]>=target?'green':'red',width:1.5});});s.vline(target,{color:'ink',dash:true});}
export const mcNote='Seeded pseudorandom simulation; ±2 SE describes Monte Carlo uncertainty under the usual sampling interpretation, not an exact confidence guarantee.';
