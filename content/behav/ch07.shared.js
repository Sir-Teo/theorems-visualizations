// BEHAV7 chapter-local kernels. All curves are authored illustrations; study evidence is separately declared.
import * as Q from './ch07.exact.shared.js';
export {Q};
const{add,sub,mul,div,sign}=Q;
export const quantity=x=>{x=Q.exact(x);const value=Q.approximate(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};};
const pack=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v===null?null:quantity(v)]));
const max=(...xs)=>xs.map(Q.exact).reduce((a,b)=>sign(sub(a,b))<0?b:a);
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');return Q.exact(x);}
const ONE=Q.ONE,ZERO=Q.ZERO,frac=(n,d)=>Q.rational(n,d);
function profile(D,a,b,c,w){
 const area=div(mul(D,add(add(a,mul(6,b)),c)),8),peak=max(a,b,c),empty=sign(D)===0;
 return{duration:D,area,mean:empty?null:div(area,D),peak:empty?null:peak,end:empty?null:c,remembered:empty?null:add(mul(w,peak),mul(sub(1,w),c)),knots:empty?[]:[[ZERO,a],[div(D,4),b],[div(mul(3,D),4),b],[D,c]]};
}
export function episode({duration=60,start=2,middle=8,end=6,peakWeight=.5}={}){
 const D=bound(duration,0,180,'duration'),a=bound(start,0,10,'start rating'),b=bound(middle,0,10,'middle rating'),c=bound(end,0,10,'end rating'),w=bound(peakWeight,0,1,'peak weight'),z=profile(D,a,b,c,w);
 return{...pack({duration:z.duration,area:z.area,mean:z.mean,peak:z.peak,end:z.end,remembered:z.remembered}),knots:z.knots.map(([time,rating])=>pack({time,rating})),empty:sign(D)===0};
}
export function extension({duration=60,start=2,middle=8,end=6,tailDuration=30,reliefRatio=.5,peakWeight=.5}={}){
 const D=bound(duration,Number.MIN_VALUE,180,'base duration'),a=bound(start,0,10,'start rating'),b=bound(middle,0,10,'middle rating'),c=bound(end,0,10,'end rating'),T=bound(tailDuration,0,120,'tail duration'),r=bound(reliefRatio,0,1,'relative ending'),w=bound(peakWeight,0,1,'peak weight');
 const base=profile(D,a,b,c,w),E=sign(T)===0?c:mul(c,r),addedArea=div(mul(T,add(c,E)),2),totalDuration=add(D,T),totalArea=add(base.area,addedArea),longScore=add(mul(w,base.peak),mul(sub(1,w),E)),scoreChange=sub(longScore,base.remembered);
 return{base:episode({duration,start,middle,end,peakWeight}),...pack({tailDuration:T,finalRating:E,addedArea,totalDuration,totalArea,longMean:div(totalArea,totalDuration),longRemembered:longScore,scoreChange}),tail:sign(T)===0?[]:[[D,c],[totalDuration,E]].map(([time,rating])=>pack({time,rating})),moreBurden:sign(addedArea)>0,betterRecollection:sign(scoreChange)<0};
}
function response(S,r,tau,t){const temporary=div(mul(mul(S,sub(1,r)),tau),add(tau,t)),permanent=mul(S,r),remaining=add(temporary,permanent),derivative=Q.neg(div(mul(mul(S,sub(1,r)),tau),mul(add(tau,t),add(tau,t))));return{temporary,permanent,remaining,derivative};}
export function adaptation({shock=-2,lastingFraction=.25,halfTime=2,time=4}={}){
 const S=bound(shock,-4,4,'shock'),r=bound(lastingFraction,0,1,'lasting fraction'),tau=bound(halfTime,.25,10,'transient half time'),t=bound(time,0,12,'time'),z=response(S,r,tau,t);
 return{...pack(z),...pack({recovered:sub(S,z.remaining),initialShock:S,longRunChange:mul(S,r)}),type:sign(S)===0?'no shock':sign(r)===0?'full limiting recovery':sign(sub(r,1))===0?'no recovery':'partial limiting recovery'};
}
export function focusing({focalDifference=4,backgroundDifference=0,attention=.5,referenceAttention=.1}={}){
 const a=bound(focalDifference,-5,5,'focal difference'),b=bound(backgroundDifference,-5,5,'background difference'),w=bound(attention,0,1,'attention'),v=bound(referenceAttention,0,1,'reference attention'),focal=mul(w,a),background=mul(sub(1,w),b),difference=add(focal,background),reference=add(mul(v,a),mul(sub(1,v),b));
 return pack({focal,background,difference,reference,distortion:sub(difference,reference),weightSum:add(w,sub(1,w))});
}
export function forecasting({shock=-2,actualHalfTime=1,forecastHalfTime=5,time=4}={}){
 const S=bound(shock,-4,4,'shock'),a=bound(actualHalfTime,.25,10,'actual half time'),f=bound(forecastHalfTime,.25,10,'forecast half time'),t=bound(time,0,12,'time'),actual=response(S,ZERO,a,t).remaining,predicted=response(S,ZERO,f,t).remaining,error=sub(predicted,actual),absoluteError=sign(error)<0?Q.neg(error):error,magnitudeDifference=sub(sign(predicted)<0?Q.neg(predicted):predicted,sign(actual)<0?Q.neg(actual):actual);
 return{...pack({actual,predicted,error,absoluteError,magnitudeDifference}),classification:sign(magnitudeDifference)>0?'overstates magnitude':sign(magnitudeDifference)<0?'understates magnitude':'same magnitude'};
}
function ols(points){
 const n=Q.exact(points.length),mx=div(points.reduce((s,p)=>add(s,p.x),ZERO),n),my=div(points.reduce((s,p)=>add(s,p.y),ZERO),n),xx=points.reduce((s,p)=>add(s,mul(sub(p.x,mx),sub(p.x,mx))),ZERO),xy=points.reduce((s,p)=>add(s,mul(sub(p.x,mx),sub(p.y,my))),ZERO),slope=sign(xx)===0?null:div(xy,xx);
 return{n:points.length,...pack({meanX:mx,meanY:my,sumXX:xx,sumXY:xy,slope,intercept:slope===null?null:sub(my,mul(slope,mx))}),points:points.map(p=>pack(p))};
}
export function economicComparisons({withinSlope=1,betweenSlope=1,timeSlope=0,growth=.1,horizon=12,cycle=0,window='whole interval'}={}){
 const a=bound(withinSlope,-2,2,'within slope'),b=bound(betweenSlope,-2,2,'between slope'),c=bound(timeSlope,-2,2,'time slope'),g=bound(growth,0,2,'growth'),H=bound(horizon,1,30,'horizon'),C=bound(cycle,-3,3,'cycle');if(!['whole interval','first half'].includes(window))throw Error('unknown time window');
 const within=[-2,-1,0,1,2].map(i=>({x:add(3,div(i,2)),y:add(6,mul(a,div(i,2)))})),between=[-2,-1,0,1,2].map(i=>({x:add(3,div(i,2)),y:add(6,mul(b,div(i,2)))}));
 const time=[0,1,2,3,4].map(i=>{const t=div(mul(i,H),4),dx=mul(g,t),triangle=frac(i<=2?i:4-i,2);return{time:t,x:add(3,dx),y:add(add(6,mul(c,dx)),mul(C,triangle))};}),selected=window==='first half'?time.slice(0,3):time;
 return{within:ols(within),between:ols(between),time:ols(selected),fullTimePoints:time.map(p=>pack(p)),window};
}
const P0=frac(1,5),P1=frac(4,5);
function quantileQ(p,z){const base=add(20,mul(60,p));if(sign(sub(z,3))<=0)return add(base,z);const slope=sign(sub(p,P0))<=0?ZERO:sign(sub(p,P1))>=0?Q.exact(2):div(sub(mul(10,p),2),3);return add(add(base,3),mul(slope,sub(z,3)));}
export function incomeDistribution({logIncome=4,percentilePercent=15,threshold=60}={}){
 const z=bound(logIncome,0,6,'log2 income coordinate'),p=div(bound(percentilePercent,0,100,'conditional percentile percent'),100),c=bound(threshold,0,100,'binary threshold'),knots=[ZERO,P0,P1,ONE].map(u=>({percentile:u,value:quantileQ(u,z)}));let cdf;
 if(sign(sub(c,knots[0].value))<=0)cdf=ZERO;
 else if(sign(sub(c,knots[3].value))>=0)cdf=ONE;
 else{for(let i=0;i<3;i++){const a=knots[i],b=knots[i+1];if(sign(sub(c,b.value))<=0){cdf=add(a.percentile,mul(sub(b.percentile,a.percentile),div(sub(c,a.value),sub(b.value,a.value))));break;}}}
 const meanByIntegration=knots.slice(1).reduce((s,b,i)=>{const a=knots[i];return add(s,div(mul(sub(b.percentile,a.percentile),add(a.value,b.value)),2));},ZERO),mean=add(50,z);
 return{...pack({selectedQuantile:quantileQ(p,z),mean,meanByIntegration,meanIdentityResidual:sub(meanByIntegration,mean),median:quantileQ(frac(1,2),z),low:quantileQ(frac(3,20),z),high:quantileQ(frac(17,20),z),cdf,aboveThreshold:sub(1,cdf)}),knots:knots.map(k=>pack(k)),illustration:true};
}
const countRow=(label,long,short)=>({label,long,short,total:long+short,longFraction:quantity(frac(long,long+short))});
export function coldHandEvidence({sample='main'}={}){const samples={main:['Main analyzed sample',22,10],relief:['At least2point relief',17,4],little:['Little or no relief',5,6],replication:['Separate no-rating replication',24,13]};if(!Object.hasOwn(samples,sample))throw Error('unknown cold-hand evidence sample');return{...countRow(...samples[sample]),source:'Kahneman et al.1993,pp402–404',experimentUnchangedByIllustration:true};}
export function tenureEvidence({period='first five years'}={}){
 const rows={ 'first five years':[[590,524,25],[342,471,7]],'six to ten years':[[565,582,22],[497,523,13]]};if(!Object.hasOwn(rows,period))throw Error('unknown tenure evidence period');
 return{period,rows:rows[period].map(([forecast,experience,n],i)=>({outcome:i===0?'tenure awarded':'tenure denied',forecasters:33,experiencers:n,...pack({forecast:frac(forecast,100),experience:frac(experience,100),difference:frac(forecast-experience,100)})})),differentGroups:true,source:'Gilbert et al.1998,Table3,p624'};
}
// Different joint matchings can have identical conditional marginals. These five rows are an authored population, never study participants.
export function rankCoupling({pattern='fixed rank',person=2,lowLogIncome=2,highLogIncome=4}={}){
 const maps={'fixed rank':[0,1,2,3,4],'reversed ranks':[4,3,2,1,0],'shuffled ranks':[2,4,1,0,3]};if(!Object.hasOwn(maps,pattern))throw Error('unknown rank matching');if(!Number.isInteger(person)||person<0||person>4)throw Error('choose an authored row0–4');
 const a=bound(lowLogIncome,0,6,'first log income'),b=bound(highLogIncome,0,6,'second log income'),ps=[1,3,5,7,9].map(n=>frac(n,10)),low=ps.map(p=>quantileQ(p,a)),high=ps.map(p=>quantileQ(p,b)),rows=low.map((x,i)=>({person:i,rankFirst:i,rankSecond:maps[pattern][i],...pack({first:x,second:high[maps[pattern][i]],change:sub(high[maps[pattern][i]],x)})})),firstMean=div(low.reduce(add,ZERO),5),secondMean=div(high.reduce(add,ZERO),5);
 return{pattern,person,rows,...pack({firstMean,secondMean,meanChange:sub(secondMean,firstMean),selectedChange:rows[person].change.exact}),marginalSecond:high.map(quantity),illustration:true};
}
export function episodeAt({duration=60,start=2,middle=8,end=6,elapsedFraction=.5}={}){
 const D=bound(duration,0,180,'duration'),a=bound(start,0,10,'start rating'),b=bound(middle,0,10,'middle rating'),c=bound(end,0,10,'end rating'),f=bound(elapsedFraction,0,1,'elapsed fraction');
 if(sign(D)===0)return{...pack({time:ZERO,rating:null,cumulative:ZERO}),empty:true};
 const nodes=[[ZERO,a],[frac(1,4),b],[frac(3,4),b],[ONE,c]];let area=ZERO,rating=a;
 for(let i=0;i<3;i++){const[x0,y0]=nodes[i],[x1,y1]=nodes[i+1];if(sign(sub(f,x0))<0)break;const right=sign(sub(f,x1))<0?f:x1,width=sub(right,x0),endpoint=add(y0,mul(div(width,sub(x1,x0)),sub(y1,y0)));area=add(area,div(mul(mul(D,width),add(y0,endpoint)),2));rating=endpoint;if(sign(sub(f,x1))<=0)break;}
 return{...pack({time:mul(D,f),rating,cumulative:area}),empty:false};
}
