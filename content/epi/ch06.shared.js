// Chapter-local probability models. All populations and sortie damage are authored examples.
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const O={step:'any',sig:5,fmt},I={step:1,int:true};
export const lin=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const axes=(title,x,y,extra={})=>({title,x,y,height:340,axes:'box',gutter:true,...extra});
export function finite(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside its finite domain');return x;}
export function integer(x,a,b,name){finite(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be an integer');return x;}
const prob=(x,name)=>finite(x,0,1,name),lp=x=>x===0?-Infinity:Math.log(x),lc=x=>x===1?-Infinity:Math.log1p(-x);
export function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
export const logSum=xs=>xs.reduce(logAdd,-Infinity);
export function magnitude(l){if(l===-Infinity)return{value:0,log:null,status:'zero'};if(!Number.isFinite(l))throw RangeError('finite log magnitude');const value=Math.exp(l);return{value:value===Infinity?null:value,log:l,status:l<Math.log(2**-1022)?'positive below normal binary64 range':value===Infinity?'positive above binary64 range':'positive'};}
const L=z=>z.log??-Infinity;
const signed=(sign,l)=>({sign:l===-Infinity?0:sign,...magnitude(l)});
// Construct complements from their smaller independently calculated side, retaining tiny positive tails.
function pair(a,b){if(a<=b)b=a===-Infinity?0:Math.log1p(-Math.exp(a));else a=b===-Infinity?0:Math.log1p(-Math.exp(b));return{yes:magnitude(a),no:magnitude(b)};}
function difference(a,b){if(a===b)return{sign:0,...magnitude(-Infinity)};if(a===-Infinity)return{sign:-1,...magnitude(b)};if(b===-Infinity)return{sign:1,...magnitude(a)};const m=Math.max(a,b);return{sign:a>b?1:-1,...magnitude(m+Math.log(-Math.expm1(Math.min(a,b)-m)))};}
function ratio(a,b){if(b===-Infinity)return a===-Infinity?null:{value:null,log:null,status:'unbounded'};return magnitude(a===-Infinity?-Infinity:a-b);}
function conditional(a,b){const d=logAdd(a,b);return d===-Infinity?null:pair(a-d,b-d);}
export function summarize(logCells){
 const total=logSum(logCells),mass=logCells.map(magnitude),normalized=total===-Infinity?null:logCells.map(x=>magnitude(x===-Infinity?-Infinity:x-total)),exposed=conditional(logCells[0],logCells[1]),unexposed=conditional(logCells[2],logCells[3]),cases=conditional(logCells[0],logCells[2]),controls=conditional(logCells[1],logCells[3]);
 return{mass,normalized,total:magnitude(total),exposed,unexposed,cases,controls,RR:exposed===null||unexposed===null?null:ratio(L(exposed.yes),L(unexposed.yes)),OR:ratio(logCells[0]+logCells[3],logCells[1]+logCells[2])};
}
export function population({prevalence=.4,risk0=.1,risk1=.25}={}){
 prob(prevalence,'true exposure prevalence');prob(risk0,'unexposed outcome risk');prob(risk1,'exposed outcome risk');
 const logs=[lp(prevalence)+lp(risk1),lp(prevalence)+lc(risk1),lc(prevalence)+lp(risk0),lc(prevalence)+lc(risk0)];
 return{prevalence,risk0,risk1,logs,...summarize(logs)};
}
export function selection({prevalence=.4,risk0=.1,risk1=.25,s11=.8,s10=.3,s01=.6,s00=.9}={}){
 const full=population({prevalence,risk0,risk1}),rates=[s11,s10,s01,s00];rates.forEach((x,i)=>prob(x,'participation '+i));const selected=summarize(full.logs.map((x,i)=>x+lp(rates[i]))),factor=ratio(lp(s11)+lp(s00),lp(s10)+lp(s01));
 return{prevalence,risk0,risk1,s11,s10,s01,s00,rates,full,selected,factor,positiveSelection:rates.every(x=>x>0)};
}
export function misclassification({prevalence=.4,risk0=.1,risk1=.25,se=.8,sp=.9,se0=se,sp0=sp}={}){
 const full=population({prevalence,risk0,risk1});for(const[x,n]of[[se,'case sensitivity'],[sp,'case specificity'],[se0,'control sensitivity'],[sp0,'control specificity']])prob(x,n);
 const [a,b,c,d]=full.logs,logs=[logAdd(a+lp(se),c+lc(sp)),logAdd(b+lp(se0),d+lc(sp0)),logAdd(a+lc(se),c+lp(sp)),logAdd(b+lc(se0),d+lp(sp0))],recorded=summarize(logs),trueAmongPositive=conditional(lp(prevalence)+lp(se),lc(prevalence)+lc(sp)),trueAmongNegative=conditional(lp(prevalence)+lc(se),lc(prevalence)+lp(sp));
 return{prevalence,risk0,risk1,se,sp,se0,sp0,full,recorded,logs,youden:se+sp-1,nondifferential:se===se0&&sp===sp0,trueAmongPositive,trueAmongNegative};
}
export function healthyWorker({vulnerable=.35,workHealthy=.9,workVulnerable=.2,riskHealthy=.02,riskVulnerable=.3,harm=.1}={}){
 for(const[x,n]of[[vulnerable,'vulnerable fraction'],[workHealthy,'healthy employment'],[workVulnerable,'vulnerable employment'],[riskHealthy,'healthy baseline risk'],[riskVulnerable,'vulnerable baseline risk'],[harm,'occupational excess fraction']])prob(x,n);
 const health=[lc(vulnerable),lp(vulnerable)],work=[lp(workHealthy),lp(workVulnerable)],off=[lc(workHealthy),lc(workVulnerable)],base=[riskHealthy,riskVulnerable],on=base.map(r=>pair(logAdd(lp(r),lp(harm)+lc(r)),lc(harm)+lc(r))),workerMass=logSum(health.map((h,i)=>h+work[i])),offMass=logSum(health.map((h,i)=>h+off[i]));
 const mixedRisk=(weights,risks)=>{const total=logSum(weights);return total===-Infinity?null:magnitude(logSum(weights.map((w,i)=>w+L(risks[i])))-total);},baseMetrics=base.map(x=>magnitude(lp(x))),workerRisk=mixedRisk(health.map((h,i)=>h+work[i]),on.map(x=>x.yes)),offRisk=mixedRisk(health.map((h,i)=>h+off[i]),baseMetrics),general=magnitude(logSum(health.map((h,i)=>h+logAdd(work[i]+L(on[i].yes),off[i]+lp(base[i]))))),standardizedOn=mixedRisk(health,on.map(x=>x.yes)),standardizedOff=mixedRisk(health,baseMetrics);
 const baselineSign=Math.sign(riskVulnerable-riskHealthy)*Math.sign(workVulnerable-workHealthy),baselineLog=lp(vulnerable)+lc(vulnerable)+lp(Math.abs(riskVulnerable-riskHealthy))+lp(Math.abs(workVulnerable-workHealthy))-workerMass,workerComplement=logSum(health.map((h,i)=>h+work[i]+lc(base[i])))-workerMass,harmLog=offMass+lp(harm)+workerComplement,crudeDifference=workerMass===-Infinity?null:offMass===-Infinity?{sign:0,...magnitude(-Infinity)}:baselineSign<0?difference(harmLog,baselineLog):signed(1,logAdd(baselineSign===0?-Infinity:baselineLog,harmLog)),standardizedDifference=signed(1,lp(harm)+logSum(health.map((h,i)=>h+lc(base[i]))));
 return{vulnerable,workHealthy,workVulnerable,riskHealthy,riskVulnerable,harm,on,workerMass:magnitude(workerMass),offMass:magnitude(offMass),workerVulnerable:workerMass===-Infinity?null:magnitude(health[1]+work[1]-workerMass),offVulnerable:offMass===-Infinity?null:magnitude(health[1]+off[1]-offMass),workerRisk,offRisk,general,standardizedOn,standardizedOff,crudeDifference,standardizedDifference,crudeRR:workerRisk===null?null:ratio(L(workerRisk),L(general)),nonworkerRR:workerRisk===null||offRisk===null?null:ratio(L(workerRisk),L(offRisk)),standardizedRR:ratio(L(standardizedOn),L(standardizedOff))};
}
export function rng(seed){let t=integer(seed,1,9999,'seed')>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let z=t;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return(((z^(z>>>14))>>>0)+.5)/4294967296;};}
export function binomialError({truth=.2,contamination=.25,reference=.6,n=100,seed=31}={}){
 prob(truth,'target risk');prob(contamination,'contaminated fraction');prob(reference,'replacement recording probability');integer(n,10,2000,'study size');const random=rng(seed),q=pair(logAdd(lc(contamination)+lp(truth),lp(contamination)+lp(reference)),logAdd(lc(contamination)+lc(truth),lp(contamination)+lc(reference))),bias=reference===truth||contamination===0?{sign:0,...magnitude(-Infinity)}:{sign:Math.sign(reference-truth),...magnitude(lp(contamination)+lp(Math.abs(reference-truth)))},variance=magnitude(L(q.yes)+L(q.no)-Math.log(n)),biasSquared=magnitude(2*L(bias)),MSE=magnitude(logAdd(L(variance),L(biasSquared)));
 let logChoose=0;const raw=[];for(let k=0;k<=n;k++){if(k>0)logChoose+=Math.log(n-k+1)-Math.log(k);raw.push(logChoose+(k===0?0:k*L(q.yes))+(k===n?0:(n-k)*L(q.no)));}const norm=logSum(raw),pmf=raw.map(x=>magnitude(x===-Infinity?-Infinity:x-norm)),bins=Array(100).fill(-Infinity);pmf.forEach((p,k)=>{const i=Math.min(99,Math.floor(100*k/n));bins[i]=logAdd(bins[i],L(p));});
 const cdf=[];let total=0;pmf.forEach(p=>{total+=p.value;cdf.push(total);});cdf[cdf.length-1]=1;const repetitions=Array.from({length:80},()=>{const u=random();let l=0,h=n;while(l<h){const m=(l+h)>>1;if(cdf[m]<u)l=m+1;else h=m;}return l/n;});
 return{truth,contamination,reference,n,seed,q,bias,variance,biasSquared,MSE,pmf,bins:bins.map(magnitude),repetitions,empiricalMean:repetitions.reduce((a,b)=>a+b,0)/repetitions.length};
}
function poisson(rate,random){if(rate===0)return 0;const limit=Math.exp(-rate);let product=1,k=0;do{k++;product*=random();}while(product>limit);return k-1;}
export function survivorship({incoming=1.6,wing=.05,body=.8,tail=.1,seed=51,architecture='common incoming rates'}={}){
 finite(incoming,0,6,'incoming hits per region');[wing,body,tail].forEach((q,i)=>prob(q,'per-hit loss probability '+i));if(!['common incoming rates','same survivor means, alternate exposure'].includes(architecture))throw RangeError('sortie architecture');const sourceLoss=[wing,body,tail],originalRates=[incoming,incoming,incoming],sameMeans=sourceLoss.map(q=>magnitude(lp(incoming)+lc(q))),loss=architecture==='common incoming rates'?sourceLoss:[.05,.05,.05],rates=architecture==='common incoming rates'?originalRates:sameMeans.map(q=>q.value/.95),rateLogs=architecture==='common incoming rates'?rates.map(lp):sameMeans.map(q=>L(q)-Math.log(.95)),lethal=rateLogs.map((l,i)=>l+lp(loss[i])),totalLethal=magnitude(logSum(lethal)),returnProbability=magnitude(-totalLethal.value),lossProbability=magnitude(totalLethal.log===null?-Infinity:totalLethal.value<1e-5?totalLethal.log+Math.log1p(-totalLethal.value/2+totalLethal.value**2/6):Math.log(-Math.expm1(-totalLethal.value))),conditionalMeans=rateLogs.map((l,i)=>magnitude(l+lc(loss[i]))),random=rng(seed),fleet=[];
 for(let i=0;i<100;i++){const hits=[];let returned=true;for(let j=0;j<3;j++){const n=poisson(rates[j],random);for(let k=0;k<n;k++){const fatal=random()<loss[j],u=random(),v=random();hits.push({region:j,fatal,u,v});if(fatal)returned=false;}}fleet.push({i,returned,hits});}
 const survivors=fleet.filter(x=>x.returned),totals=ids=>[0,1,2].map(j=>ids.reduce((a,p)=>a+p.hits.filter(h=>h.region===j).length,0)),allTotals=totals(fleet),returnedTotals=totals(survivors);
 return{incoming,wing,body,tail,seed,architecture,rates:rateLogs.map(magnitude),loss,sourceLoss,sameMeans,totalLethal,returnProbability,lossProbability,conditionalMeans,fleet,survivors:survivors.length,allTotals,returnedTotals,allMeans:allTotals.map(x=>x/100),returnedMeans:survivors.length===0?null:returnedTotals.map(x=>x/survivors.length)};
}
