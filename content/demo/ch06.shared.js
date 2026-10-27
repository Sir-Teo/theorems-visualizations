import{lifeAges,years,countries,schedules}from'./ch06.data.shared.js';
import*as Q from'./ch06.exact.shared.js';
export{Q,lifeAges,years,countries,schedules};
const int=(x,a,b,label)=>{if(typeof x!=='number'||!Number.isInteger(x)||x<a||x>b)throw RangeError(label+' outside its integer domain');return x;};
const choice=(x,xs,label)=>{if(!xs.includes(x))throw RangeError('Unknown '+label);return x;};
const bool=(x,label)=>{if(typeof x!=='boolean')throw TypeError(label+' must be boolean');return x;};
const memo=fn=>{let key,result;return p=>{const s=JSON.stringify(p);if(s!==key){result=fn(p);key=s;}return structuredClone(result);};};
const sum=xs=>xs.reduce((s,x)=>s+x,0),range=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
const defaults={country:'JPN',year:2023,fertility:100,hazard:100,child:100,late:100,extra:0};
function parameters(p={}){const x={...defaults,...p};choice(x.country,countries.map(c=>c.country),'country');choice(x.year,years,'year');int(x.fertility,0,300,'fertility percent');for(const k of['hazard','child','late'])int(x[k],25,250,k+' hazard percent');int(x.extra,0,20,'extra annual hazard per1000');return x;}
// Exact formulas for integrals of 1,u,u^2 times exp(-k*u), evaluated stably.
function localMoments(k,w){
 const z=k*w;
 if(Math.abs(z)<=.5){const s=[0,0,0];let t=1;for(let j=0;j<60;j++){for(let m=0;m<3;m++)s[m]+=t/(j+m+1);t*=-z/(j+1);if(j>12&&Math.abs(t)<1e-19)break;}return s.map((v,m)=>v*w**(m+1));}
 const e=Math.exp(-z),a=-Math.expm1(-z);return[w*a/z,w*w*(a-z*e)/(z*z),w*w*w*(2*a-e*(2*z+z*z))/(z*z*z)];
}
function pieceMoments(s,r,from=s.a,to=s.b){const a=from,w=to-from,S=s.S*Math.exp(-s.mu*(a-s.a)),[i0,i1,i2]=localMoments(s.mu+r,w),f=S*Math.exp(-r*a);return[f*i0,f*(a*i0+i1),f*(a*a*i0+2*a*i1+i2)];}
function makeLaw(p){
 const args=parameters(p),data=schedules.find(s=>s.country===args.country&&s.year===args.year),segments=[];let S=1;
 for(let i=0;i<lifeAges.length-1;i++){
  const a=lifeAges[i],b=lifeAges[i+1],mu=Math.log(data.survivors[i]/data.survivors[i+1])/(b-a)*args.hazard/100*(a<5?args.child/100:a>=60?args.late/100:1)+args.extra/1000;
  const j=(a-10)/5,m=a>=10&&a<55?data.fertility[j]*100/(100+data.boysPer100Girls)*args.fertility/100:0;
  segments.push({a,b,S,mu,m});S*=Math.exp(-mu*(b-a));
 }
 const tailMu=data.survivors.at(-1)/data.personYears.at(-1)*args.hazard/100*args.late/100+args.extra/1000;
 return{args,data,segments,tail:{a:100,S,mu:tailMu}};
}
function kernelMoments(law,r=0){const out=[0,0,0];for(const s of law.segments)if(s.m){const xs=pieceMoments(s,r);for(let j=0;j<3;j++)out[j]+=s.m*xs[j];}return out;}
function populationMoments(law,r=0){
 const k=law.tail.mu+r;if(!(k>0))return null;const out=[0,0,0];for(const s of law.segments){const xs=pieceMoments(s,r);for(let j=0;j<3;j++)out[j]+=xs[j];}
 const tail=law.tail.S*Math.exp(-100*r)/k;out[0]+=tail;out[1]+=tail*(100+1/k);out[2]+=tail*(10000+200/k+2/(k*k));return{moments:out,tail};
}
function survivalAt(law,a){const s=law.segments.find(s=>a<s.b)||law.tail;return s.S*Math.exp(-s.mu*(a-s.a));}
function maternityAt(law,a){return law.segments.find(s=>a>=s.a&&a<s.b)?.m||0;}
function solveRoot(fn){let lo=-1,hi=1;for(let i=0;i<110;i++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(fn(mid)>1)lo=mid;else hi=mid;}return Math.abs(Math.log(fn(lo)))<Math.abs(Math.log(fn(hi)))?lo:hi;}
function continuousRoot(law){return law.segments.some(s=>s.m>0)?solveRoot(r=>kernelMoments(law,r)[0]):null;}
function describe(law,r){
 const raw=kernelMoments(law),NRR=raw[0],T=NRR?raw[1]/NRR:null,variance=NRR?Math.max(0,raw[2]/NRR-T*T):null,integral=r===null?null:populationMoments(law,r);
 const profile=integral?range(101,a=>[a,Math.exp(-r*a)*survivalAt(law,a)/integral.moments[0]]):null;
 const b=integral?1/integral.moments[0]:null;let d=null;
 if(integral){let deaths=0;for(const s of law.segments)deaths+=s.mu*pieceMoments(s,r)[0];deaths+=law.tail.mu*integral.tail;d=deaths*b;}
 return{NRR,T,variance,r,normalizable:!!integral,b,d,meanAge:integral?integral.moments[1]/integral.moments[0]:null,tailShare:integral?integral.tail/integral.moments[0]:null,profile,rootExists:r!==null,model:'continuous piecewise-hazard law with explicit exponential100+tail'};
}
const stableMemo=memo(p=>{const law=makeLaw(p),r=continuousRoot(law);return{args:law.args,countryName:law.data.name,...describe(law,r),survival:range(101,a=>[a,survivalAt(law,a)]),maternity:range(221,i=>{const a=i/4;return[a,maternityAt(law,a)];}),netMaternity:range(221,i=>{const a=i/4;return[a,survivalAt(law,a)*maternityAt(law,a)];}),sourceNRR:law.data.publishedNRR,sourceTFR:law.data.publishedTFR,sourceKnots:lifeAges.map((a,i)=>[a,law.data.survivors[i]/law.data.survivors[0]]),tailHazard:law.tail.mu};});
export function stable(p={}){return stableMemo(parameters(p));}
export function lotka({trial=0,...p}={}){
 int(trial,-100,100,'trial annual growth per1000');const law=makeLaw(p),result=stable(p),trialRate=trial/1000;
 const lo=Math.min(-.06,(result.r??0)-.025,trialRate),hi=Math.max(.06,(result.r??0)+.025,trialRate);
 const curve=range(161,i=>{const r=lo+(hi-lo)*i/160,F=kernelMoments(law,r)[0];return{r,F,logF:F>0?Math.log(F):null};});
 const contributions=law.segments.filter(s=>s.m>0).map(s=>({age:s.a,years:s.b-s.a,trial:s.m*pieceMoments(s,trialRate)[0],atRoot:result.r===null?null:s.m*pieceMoments(s,result.r)[0]}));
 return{...result,trial,trialRate,trialIntegral:kernelMoments(law,trialRate)[0],rootIntegral:result.r===null?null:kernelMoments(law,result.r)[0],curve,contributions};
}
const approximationMemo=memo(({fertility})=>schedules.map(s=>{const z=stable({country:s.country,year:s.year,fertility});const first=z.NRR?Math.log(z.NRR)/z.T:null;return{country:s.country,name:s.name,year:s.year,NRR:z.NRR,T:z.T,variance:z.variance,r:z.r,first,second:first===null?null:first+z.variance*first*first/(2*z.T),error:first===null?null:z.r-first};}));
export function approximation({country='JPN',year=2023,fertility=100}={}){parameters({country,year,fertility});const points=approximationMemo({fertility}),selected=points.find(s=>s.country===country&&s.year===year);return{country,year,fertility,points,selected,selectedSchedule:stable({country,year,fertility})};}
export function tilt({growth=0,age=30,...p}={}){int(growth,-50,50,'growth per1000');int(age,0,100,'selected age');const law=makeLaw({...p,fertility:100}),r=growth/1000,F=kernelMoments(law,r)[0],description=describe(law,r),S=survivalAt(law,age),weight=Math.exp(-r*age);return{args:law.args,growth,age,...description,originalNRR:description.NRR,NRR:description.NRR/F,maternityRescale:1/F,survival:range(101,a=>[a,survivalAt(law,a)]),tilt:range(101,a=>[a,Math.exp(-r*a)]),selected:{age,survival:S,weight,b:description.b,density:description.b===null?null:description.b*S*weight}};}
export function stationary({hazard=100,country='JPN',year=2023}={}){const law=makeLaw({country,year,hazard}),z=describe(law,0),life=populationMoments(law,0),K=kernelMoments(law)[0];return{args:law.args,...z,stationaryByConstruction:true,originalNRR:z.NRR,NRR:1,maternityRescale:1/K,e0:life.moments[0],secondLifeMoment:2*life.moments[1],meanAgeAtDeath:life.moments[0],survival:range(101,a=>[a,survivalAt(law,a)]),survivalAreaThrough100:life.moments[0]-life.tail,tailLifeYears:life.tail};}
export function coale({country='JPN',year=2023,fertility=100,child=100,late=100,extra=10}={}){
 parameters({country,year,fertility,child,late,extra});const baseline=stable({country,year}),changed=stable({country,year,fertility,child,late}),fertilityOnly=stable({country,year,fertility}),earlyOnly=stable({country,year,child}),lateOnly=stable({country,year,late});
 // Uniform additional hazard changes r by -delta and preserves exp(-r*a)l(a).
 const delta=extra/1000,uniformLaw=makeLaw({country,year,extra}),uniformR=baseline.r-delta,uniform=describe(uniformLaw,uniformR);
 return{country,year,fertility,child,late,extra,baseline,changed,fertilityOnly,earlyOnly,lateOnly,uniform:{...uniform,delta,analyticSameProfile:true},uniformHazard:range(101,a=>[a,survivalAt(uniformLaw,a)])};
}
function discreteLaw(law){const K=range(55,i=>{const a=i,b=i+1,s=law.segments.find(s=>a>=s.a&&a<s.b);return s?.m?s.m*pieceMoments(s,0,a,b)[0]:0;}),l=range(101,a=>survivalAt(law,a)),F=K.map((k,i)=>k/l[i]),survival=range(100,i=>l[i+1]/l[i]);survival.push(Math.exp(-law.tail.mu));return{K,l,F,survival};}
function discreteTarget(d){if(!d.K.some(k=>k>0))return{r:null,lambda:null,vector:null};const r=solveRoot(r=>sum(d.K.map((k,i)=>k*Math.exp(-r*(i+1))))),lambda=Math.exp(r);if(!(lambda>d.survival[100]))return{r,lambda,vector:null};const v=range(100,a=>d.l[a]*Math.exp(-r*a));v.push(d.l[100]*Math.exp(-100*r)/(1-d.survival[100]/lambda));const total=sum(v);return{r,lambda,vector:v.map(x=>x/total)};}
export function projection({steps=100,initial='young',...p}={}){
 int(steps,0,300,'annual census steps');choice(initial,['young','old','uniform','older-only','empty'],'initial age profile');const law=makeLaw(p),d=discreteLaw(law),target=discreteTarget(d);
 let n=range(101,a=>initial==='empty'?0:initial==='older-only'?(a>=65?1:0):initial==='uniform'?1:Math.exp(-.5*((a-(initial==='young'?15:55))/15)**2));const startTotal=sum(n);if(startTotal)n=n.map(x=>100*x/startTotal);
 const history=[],atStep=[];let previous=null;
 for(let t=0;t<=300;t++){
  const total=sum(n),shares=total?n.map(x=>x/total):null,TV=shares&&target.vector?.length?sum(shares.map((x,i)=>Math.abs(x-target.vector[i])))/2:null;
  if(t%5===0||t===steps)history.push({step:t,total,growth:previous>0&&total>0?Math.log(total/previous):null,distance:TV});
  if(t===steps)atStep.push({total,shares,vector:[...n],distance:TV,growth:previous>0&&total>0?Math.log(total/previous):null});
  if(t===300)break;const next=Array(101).fill(0);next[0]=sum(d.F.map((f,i)=>f*n[i]));for(let a=1;a<100;a++)next[a]=d.survival[a-1]*n[a-1];next[100]=d.survival[99]*n[99]+d.survival[100]*n[100];previous=total;n=next;
 }
 const selected=atStep[0],group=shares=>shares?range(21,i=>i===20?shares[100]:sum(shares.slice(5*i,5*i+5))):null;
 return{args:law.args,steps,initial,discrete:target,continuousRoot:continuousRoot(law),history,selected,selectedGroups:group(selected.shares),targetGroups:group(target.vector),netMaternityBins:d.K,survivalSteps:d.survival,futureReproductionPossible:initial!=='empty'&&initial!=='older-only'&&d.K.some(x=>x>0)};
}
function residueProbability(k,z){
 if(z===0)return{corrected:1,forcing:1,renewed:0};
 const forcing=Math.exp(-z);let term=forcing,renewed=0;
 for(let j=1;j<=Math.ceil(z+15*Math.sqrt(z+1)+3*k);j++){term*=z/j;if(j%k===0)renewed+=term;}
 return{corrected:forcing+renewed,forcing,renewed};
}
export function renewal({shape=6,mean=30,reproduction=150,time=100}={}){
 int(shape,3,8,'Erlang shape');int(mean,20,40,'mean generation years');int(reproduction,25,400,'net reproduction percent');int(time,0,300,'selected time');const R=reproduction/100,theta=mean/shape,c=R**(1/shape),r=(c-1)/theta;
 const roots=range(shape,j=>({real:(c*Math.cos(2*Math.PI*j/shape)-1)/theta,imag:j===0||2*j===shape?0:c*Math.sin(2*Math.PI*j/shape)/theta,dominant:j===0}));
 const history=range(301,t=>{const z=c*t/theta,parts=residueProbability(shape,z);return{time:t,...parts,births:Math.exp(r*t)*parts.corrected};});return{shape,mean,reproduction,time,R,theta,r,roots,history,selected:history[time],correctedLimit:1/shape};
}
// Gaussian integration of a smooth periodic factor over one full period.
function gauss(n){const nodes=[];for(let i=1;i<=n;i++){let z=Math.cos(Math.PI*(i-.25)/(n+.5)),p,dp;for(let k=0;k<20;k++){let p0=1,p1=z;for(let j=2;j<=n;j++){const q=((2*j-1)*z*p1-(j-1)*p0)/j;p0=p1;p1=q;}p=p1;dp=n*(z*p-p0)/(z*z-1);const d=p/dp;z-=d;if(Math.abs(d)<2e-16)break;}nodes.push([z,2/((1-z*z)*dp*dp)]);}return nodes;}
const gauss64=gauss(64);
function integrateSmooth(fn,a,b){const mid=(a+b)/2,half=(b-a)/2;return half*sum(gauss64.map(([x,w])=>w*fn(mid+half*x)));}
export function variable({growth=10,amplitude=60,period=40,time=20,census=10}={}){
 int(growth,-10,30,'baseline growth per1000');int(amplitude,0,100,'birth-cycle amplitude percent');int(period,20,60,'birth-cycle period');int(time,0,120,'current time');int(census,1,30,'census separation');
 const r0=growth/1000,A=amplitude/100,omega=2*Math.PI/period,mu=1/40,k=mu+r0;
 const logB=t=>r0*t+A*Math.sin(omega*t),instant=a=>r0+A*omega*Math.cos(omega*(time-a)),finite=a=>r0+A*(Math.sin(omega*(time+census-a))-Math.sin(omega*(time-a)))/census;
 const logAgeFactor=a=>-r0*a+A*(Math.sin(omega*(time-a))-Math.sin(omega*time));
 const accumulatedInstant=a=>r0*a+A*(Math.sin(omega*time)-Math.sin(omega*(time-a)));
 const accumulatedFinite=a=>r0*a+A/(omega*census)*(Math.cos(omega*(time+census-a))-Math.cos(omega*(time+census))-Math.cos(omega*(time-a))+Math.cos(omega*time));
 const densityFactor=a=>Math.exp(logAgeFactor(a)-mu*a),finiteFactor=a=>Math.exp(-accumulatedFinite(a)-mu*a),decay=Math.exp(-k*period);
 const integral=integrateSmooth(densityFactor,0,period)/(1-decay),finiteIntegral=integrateSmooth(finiteFactor,0,period)/(1-decay),b=1/integral;
 const profile=range(121,a=>({age:a,survival:Math.exp(-mu*a),instant:instant(a),finite:finite(a),accumulatedInstant:accumulatedInstant(a),accumulatedFinite:accumulatedFinite(a),actual:densityFactor(a)/integral,reconstructed:Math.exp(-accumulatedInstant(a)-mu*a)/integral,censusRaw:finiteFactor(a)/integral,censusReconstructed:finiteFactor(a)/finiteIntegral}));
 const tailAt=120,remaining=integrateSmooth(densityFactor,tailAt,tailAt+period)/(1-decay)/integral;
 const logDifference=a=>logAgeFactor(a)+accumulatedFinite(a)-Math.log(integral/finiteIntegral),v0=logDifference(0),v2=logDifference(period/2),constant=(v0+v2)/2,cosine=(v0-v2)/2,sine=logDifference(period/4)-constant,radius=Math.hypot(cosine,sine),cuts=[0,period];
 if(radius>0&&Math.abs(constant)<radius){const phase=Math.atan2(sine,cosine),angle=Math.acos(-constant/radius);for(const x of[phase-angle,phase+angle]){const a=((x%(2*Math.PI)+2*Math.PI)%(2*Math.PI))/omega;if(a>0&&a<period)cuts.push(a);}}
 cuts.sort((a,b)=>a-b);let errorArea=0;
 if(amplitude)for(let i=1;i<cuts.length;i++)errorArea+=integrateSmooth(a=>Math.abs(densityFactor(a)/integral-finiteFactor(a)/finiteIntegral),cuts[i-1],cuts[i]);
 errorArea/=2*(1-decay);
 return{growth,amplitude,period,time,census,r0,A,omega,mu,b,finiteB:1/finiteIntegral,finiteUnnormalizedMass:finiteIntegral/integral,profile,births:range(241,i=>{const offset=i/2-120;return[offset,Math.exp(logB(time+offset)-logB(time))];}),tailShareBeyond120:remaining,finiteReconstructionTV:errorArea,exactInstantaneousIdentity:true};
}
const rat=(n,d=1)=>Q.rational(n,d),plus=Q.add,times=Q.mul,minus=Q.sub,divide=Q.div,approx=Q.approximate;
const qpow=(x,n)=>{let p=Q.ONE;for(let i=0;i<n;i++)p=times(p,x);return p;};
const exactQuantity=x=>({exact:{...x},value:approx(x)}),qsum=xs=>xs.reduce(plus,Q.ZERO),qabs=x=>Q.sign(x)<0?Q.neg(x):x;
const toyLow=[[0,0,.6,.8],[.95,0,0,0],[0,.9,0,0],[0,0,.7,0]],toyHigh=[[0,0,1.2,1.5],[.98,0,0,0],[0,.95,0,0],[0,0,.85,0]];
const qmatrix=M=>M.map(row=>row.map(x=>Q.exact(x))),qmv=(M,v)=>M.map(row=>qsum(row.map((x,j)=>times(x,v[j])))),qmm=(A,B)=>A.map(row=>B[0].map((_,j)=>qsum(row.map((x,k)=>times(x,B[k][j]))))),qpower=(M,n)=>{let P=M;for(let i=1;i<n;i++)P=qmm(M,P);return P;};
const qmin=xs=>xs.reduce((a,b)=>Q.sign(minus(a,b))<=0?a:b),qmax=xs=>xs.reduce((a,b)=>Q.sign(minus(a,b))>=0?a:b);
function toyMatrix(high){return(high?toyHigh:toyLow).map(row=>row.map(x=>rat(Math.round(x*100),100)));}
const low=toyMatrix(false),high=toyMatrix(true),lowerBlock=qpower(low,10),upperBlock=qpower(high,10),blockMin=qmin(lowerBlock.flat()),blockMax=qmax(upperBlock.flat()),epsilon=divide(blockMin,blockMax);
function normalized(v){const total=qsum(v);return Q.sign(total)?v.map(x=>divide(x,total)):null;}
export function changing({steps=40,sequence='periodic',initial='opposed'}={}){
 int(steps,0,80,'ten-year census steps');choice(sequence,['periodic','Thue–Morse'],'changing-law sequence');choice(initial,['opposed','near','same'],'starting profiles');
 let x=(initial==='near'?[26,25,25,24]:[40,30,20,10]).map(x=>rat(x)),y=(initial==='same'?[40,30,20,10]:initial==='near'?[24,25,25,26]:[10,20,30,40]).map(x=>rat(x));
 const history=[];let firstRange=null,firstLower=null,selected;
 for(let t=0;t<=80;t++){
  const px=normalized(x),py=normalized(y),ratios=x.map((z,i)=>divide(z,y[i])),lo=qmin(ratios),hi=qmax(ratios),spread=minus(hi,lo),distance=divide(qsum(px.map((z,i)=>qabs(minus(z,py[i])))),rat(2));
  if(t===10){firstRange=spread;firstLower=lo;}
  const block=Math.floor(t/10),contract=block>=1?qpow(minus(Q.ONE,epsilon),block-1):null,relativeSpread=block>=1&&Q.sign(firstRange)?divide(spread,firstRange):block>=1?Q.ZERO:null;
  const row={step:t,distance:exactQuantity(distance),ratioSpread:exactQuantity(spread),relativeSpread:relativeSpread===null?null:exactQuantity(relativeSpread),blockBound:contract===null?null:exactQuantity(contract)};
  history.push(row);if(t===steps)selected={...row,first:px.map(exactQuantity),second:py.map(exactQuantity)};
  if(t===80)break;const useHigh=sequence==='periodic'?Math.floor(t/2)%2===1:t.toString(2).split('').filter(c=>c==='1').length%2===1,M=useHigh?high:low;x=qmv(M,x);y=qmv(M,y);
 }
 return{steps,sequence,initial,history,selected,blockLength:10,blockMin:exactQuantity(blockMin),blockMax:exactQuantity(blockMax),epsilon:exactQuantity(epsilon),firstPositiveLowerRatio:exactQuantity(firstLower),terminalAge:40,yearsPerStep:10,ageLabels:['0–9','10–19','20–29','30–39'],lowerMatrix:low.map(row=>row.map(exactQuantity)),upperMatrix:high.map(row=>row.map(exactQuantity))};
}
function linearIntrinsic(f,s){const K=f.map((x,i)=>x*s.slice(0,i).reduce((a,b)=>a*b,1));if(!K.some(x=>x))return null;return solveRoot(r=>sum(K.map((x,i)=>x*Math.exp(-r*(i+1)))))/10;}
export function twoSex({steps=20,females=50,daughterShare=50,utilization=50,maleFertility=100}={}){
 int(steps,0,40,'ten-year census steps');int(females,0,100,'initial female percent');int(daughterShare,40,60,'female birth percent');int(utilization,0,50,'capacity utilization percent');int(maleFertility,0,200,'male capacity percent');
 const q=daughterShare/100,eta=utilization/100,sf=[.95,.9,.7],sm=[.9,.85,.65],ff=[0,0,1.2,.8],fm=[0,0,.8,1.2].map(x=>x*maleFertility/100),shape=[.4,.3,.2,.1];
 const modes=['female-only','male-only','two-sex'],tracks={};
 for(const mode of modes){let F=shape.map(x=>x*females),M=shape.map(x=>x*(100-females)),previous=null;const history=[];for(let t=0;t<=40;t++){
   const total=sum(F)+sum(M),fc=sum(F.map((x,i)=>x*ff[i])),mc=sum(M.map((x,i)=>x*fm[i])),births=mode==='female-only'?eta*fc:mode==='male-only'?eta*mc:fc&&mc?2*eta*fc*mc/(fc+mc):0;
   history.push({step:t,total,femaleShare:total?sum(F)/total:null,femaleCapacity:fc,maleCapacity:mc,births,annualGrowth:previous>0&&total>0?Math.log(total/previous)/10:null,female:[...F],male:[...M]});
   if(t===40)break;previous=total;F=[q*births,...sf.map((s,i)=>s*F[i])];M=[(1-q)*births,...sm.map((s,i)=>s*M[i])];
  }tracks[mode]={history,selected:history[steps]};}
 return{steps,females,daughterShare,utilization,maleFertility,tracks,femaleIntrinsic:linearIntrinsic(ff.map(x=>q*eta*x),sf),maleIntrinsic:linearIntrinsic(fm.map(x=>(1-q)*eta*x),sm),yearsPerStep:10,ageLabels:['0–9','10–19','20–29','30–39'],terminalAge:40,closure:'B=2 eta F G/(F+G); eta<=1/2; chosen capacity closure, not literal pair counts'};
}
const historicalFemale={ageLabels:['0–5','5–10','10–15','15–20','20–25','25–35','35–45','45–55','55–65','65–75','75+'],calculated:[136,115,104,95,87,148,116,88,62,35,15],observed:[132,117,104,95,91,149,115,87,61,35,15]};
export function historical({age=30,growth=14,country='JPN',year=2023}={}){int(age,0,100,'selected age');int(growth,-30,50,'growth per1000');const law=makeLaw({country,year}),r=growth/1000,S=survivalAt(law,age),birthRatio=Math.exp(-r*age);return{country,year,age,growth,r,survival:S,birthCohortRelativeToCurrent:birthRatio,relativeAgeDensity:S*birthRatio,table:structuredClone(historicalFemale),reportedCalculatedSum:sum(historicalFemale.calculated),reportedObservedSum:sum(historicalFemale.observed),historicalYears:'England and Wales1871–1880',sourceReprintPage:100};}
export function periodSwap({country='SWE',first=1950,second=2023}={}){
 parameters({country,year:first});choice(second,years,'second year');const data1=schedules.find(s=>s.country===country&&s.year===first),data2=schedules.find(s=>s.country===country&&s.year===second);
 const rows=[];
 for(const[mortality,fertility]of[[first,first],[first,second],[second,first],[second,second]]){
  const mortalityData=mortality===first?data1:data2,fertilityData=fertility===first?data1:data2,law=makeLaw({country,year:mortality});
  for(const s of law.segments)if(s.a>=10&&s.a<55)s.m=fertilityData.fertility[(s.a-10)/5]*100/(100+fertilityData.boysPer100Girls);
  rows.push({mortalityYear:mortality,fertilityYear:fertility,...describe(law,continuousRoot(law)),e0:populationMoments(law,0).moments[0]});
 }
 return{country,name:data1.name,first,second,rows,historicalContext:{country:'Sweden',oldLifeExpectancy:45.4,newLifeExpectancy:71.6,oldYears:'1860',newYears:'1946–1950',scope:'Reported in Coale1957reprint; no historical curves digitized. Widget profiles use distinct UNWPP2024period inputs.'}};
}
