// Chapter-local educational kinetic models. Parameters are chosen, not patient fits.
const domain=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const need=(ok,message)=>{if(!ok)throw new RangeError(message);};
// Bounded nonnegative factors: apply rescuing large factors before tiny factors.
const product=(...xs)=>xs.sort((a,b)=>b-a).reduce((a,b)=>a*b,1);
const bisect=(fn,lo,hi,count=100)=>{let f=fn(lo);if(f===0)return lo;if(fn(hi)===0)return hi;need(f<=0&&fn(hi)>=0,'Monotone finite root bracket');for(let i=0;i<count;i++){const m=lo+(hi-lo)/2;if(m===lo||m===hi)break;if(fn(m)>0)hi=m;else lo=m;}return lo+(hi-lo)/2;};
export function saturableDecline(time=2,{initial=4,capacity=1,michaelis=1}={}){
 need(domain(time,0,40)&&domain(initial,0,20)&&domain(capacity,.1,3)&&domain(michaelis,.1,4),'Declared positive saturation model');
 if(initial===0)return{time,initial,concentration:0,logConcentration:null,logRatio:null,removed:0,rate:0,effectiveClearance:capacity/michaelis,underflow:false};
 // For t≤1e−100 the relative higher-order correction is at most O(30t),
 // far below binary64 resolution. Evaluate the lost amount before u quantizes.
 if(time>0&&time<=1e-100){const clearance=capacity/(michaelis+initial),removed=product(initial,clearance,time),u=-clearance*time;
  return{time,initial,concentration:initial-removed,logConcentration:Math.log(initial)+u,logRatio:u,removed,rate:initial*clearance,effectiveClearance:clearance,underflow:false,logRatioUnderflow:removed>0&&u===0,tinyTimeLimit:true,implicitResidual:-removed+michaelis*u+capacity*time};}
 const exposure=capacity*time,lo=-exposure/michaelis,u=exposure===0?0:bisect(x=>initial*Math.expm1(x)+michaelis*x+exposure,lo,0),logConcentration=Math.log(initial)+u,concentration=u>=-.5?initial+initial*Math.expm1(u):Math.exp(logConcentration),removed=initial*(-Math.expm1(u));
 return{time,initial,concentration,logConcentration,logRatio:u,removed,rate:concentration*(capacity/(michaelis+concentration)),effectiveClearance:capacity/(michaelis+concentration),underflow:concentration===0,implicitResidual:initial*Math.expm1(u)+michaelis*u+exposure};
}
export function saturatedSteady(fraction=.6,michaelis=1){
 need(domain(fraction,0,1.2)&&domain(michaelis,.1,4),'Input/capacity ratio0–1.2 and positive Michaelis scale');
 if(fraction>=1)return{fraction,steady:null,reason:'No finite steady concentration at or above elimination capacity'};
 const steady=michaelis*(fraction/(1-fraction));return{fraction,steady,steadyUnderflow:fraction>0&&steady===0,elasticity:1/(1-fraction),normalized:fraction/(1-fraction)};
}
export function enzymeStep(time=2,{inhibitor=1,inducer=1,maxInduction=3,turnover=.3}={}){
 need(domain(time,0,40)&&domain(inhibitor,0,20)&&domain(inducer,0,20)&&domain(maxInduction,0,5)&&domain(turnover,.02,2),'Chosen free inhibitor/inducer ratios and turnover');
 const inhibition=1/(1+inhibitor),targetIncrement=maxInduction*(inducer/(1+inducer)),increment=turnover*time>1e-100?targetIncrement*(-Math.expm1(-turnover*time)):product(targetIncrement,turnover,time,expRatio(turnover*time));
 return{time,inhibition,enzyme:1+increment,enzymeIncrement:increment,targetEnzyme:1+targetIncrement,intrinsicFactor:(1+increment)*inhibition,inhibitionDecrease:inhibitor/(1+inhibitor),factorChange:(increment-inhibitor)/(1+inhibitor)};
}
export function interactionRatio(fraction=.8,inhibitorRatio=1){
 need(domain(fraction,0,1)&&domain(inhibitorRatio,0,100),'Baseline total-clearance fraction and free inhibitor/Ki');
 const pathwayFactor=1/(1+inhibitorRatio),clearanceRatio=(1-fraction)+fraction*pathwayFactor,aucRatio=1/clearanceRatio;
 // Preserve a representable small increment even when 1+increment rounds to one.
 const aucIncrement=(fraction*inhibitorRatio)/(1+(1-fraction)*inhibitorRatio);
 return{fraction,inhibitorRatio,pathwayFactor,clearanceRatio,aucRatio,aucIncrement,limit:fraction<1?1/(1-fraction):null};
}
export function wellStirred(intrinsic=1,{flow=1,freeFraction=.2,inhibitorRatio=0,other=.2}={}){
 need(domain(intrinsic,.05,50)&&domain(flow,.2,5)&&domain(freeFraction,.01,1)&&domain(inhibitorRatio,0,100)&&domain(other,0,2),'Chosen well-stirred parallel-clearance model');
 const x=freeFraction*intrinsic,after=x/(1+inhibitorRatio),hepatic=flow*x/(flow+x),inhibited=flow*after/(flow+after);
 return{hepatic,inhibited,total:hepatic+other,afterTotal:inhibited+other,aucRatio:(hepatic+other)/(inhibited+other),extraction:hepatic/flow};
}
export const CYP_CASES=[
 {label:'*1 / *1',scores:[2]},
 {label:'*1 / *5',scores:[1]},
 {label:'*10 / *10',scores:[.5]},
 {label:'*1 / *41',scores:[1.25]},
 {label:'*41 / *41',scores:[.5]},
 {label:'*1×2 / *1',scores:[3]},
 {label:'*4×2 / *4',scores:[0]},
 {label:'*1 / *4, three copies, phase unknown',scores:[1,2]},
 {label:'*1 / uncertain-function allele',scores:[]},
];
export function cypPhenotype(score){
 need(domain(score,0,12),'Nonnegative activity score');
 return score===0?'poor':score<1.25?'intermediate':score<=2.25?'normal':'ultrarapid';
}
export function cypCase(index=0,inhibition='none'){
 need(Number.isInteger(index)&&index>=0&&index<CYP_CASES.length&&['none','moderate','strong'].includes(inhibition),'Known selected diplotype and declared inhibitor category');
 const c=CYP_CASES[index],factor=inhibition==='strong'?0:inhibition==='moderate'?.5:1;
 return{label:c.label,scores:[...c.scores],phenotypes:c.scores.map(cypPhenotype),adjusted:c.scores.map(x=>x*factor),adjustedPhenotypes:c.scores.map(x=>cypPhenotype(x*factor)),indeterminate:c.scores.length===0,ambiguous:c.scores.length>1,inhibition};
}
export function haplotypePool(frequency=.5,first=.25,second=1){
 need(domain(frequency,0,1)&&[0,.25,.5,1,2].includes(first)&&[0,.25,.5,1,2].includes(second),'Chosen two-haplotype pool');
 const q=1-frequency,rows=[{label:'A/A',frequency:frequency*frequency,score:2*first},{label:'A/B',frequency:2*frequency*q,score:first+second},{label:'B/B',frequency:q*q,score:2*second}];
 return{frequency,first,second,rows:rows.map((r,j)=>({...r,phenotype:cypPhenotype(r.score),underflow:r.frequency===0&&(j===0?frequency>0:j===2?q>0:frequency>0&&q>0)})),total:rows.reduce((s,r)=>s+r.frequency,0)};
}
const rk4=(rhs,start,horizon,step)=>{
 const count=Math.ceil(horizon/step),h=horizon/count,states=[start.slice()],times=[0];let y=start.slice();
 for(let j=0;j<count;j++){
  const t=j*h,a=rhs(t,y),b=rhs(t+h/2,y.map((x,i)=>x+h*a[i]/2)),c=rhs(t+h/2,y.map((x,i)=>x+h*b[i]/2)),d=rhs(t+h,y.map((x,i)=>x+h*c[i]));
  y=y.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
  if(y.some(x=>!Number.isFinite(x)||x<0))return{unresolved:true,reason:'Numerical positivity/finite-state failure; reduce step',times,states,step:h};
  states.push(y);times.push((j+1)*h);
 }
 return{unresolved:false,times,states,step:h};
};
export function autoinduction({input=1,baseline=.3,turnover=.15,maxInduction=4,halfResponse=1,horizon=40,step=.01}={}){
 need(domain(input,0,2)&&domain(baseline,.05,1)&&domain(turnover,.02,2)&&domain(maxInduction,0,5)&&domain(halfResponse,.1,3)&&domain(horizon,1,40)&&domain(step,.001,.02),'Chosen positive induction model');
 const scale=input||1,rhs=(_,y)=>{const[c,E]=y,C=scale*c,removal=baseline*E*c;return[(input?1:0)-removal,turnover*(maxInduction*(C/(halfResponse+C))-(E-1)),removal];};
 const normalized=rk4(rhs,[0,1,0],horizon,step),trace={...normalized,states:normalized.states.map(([c,E,d])=>[scale*c,E,scale*d])},A=baseline*(1+maxInduction),B=baseline*halfResponse-input,disc=Math.hypot(B,2*Math.sqrt(A*input*halfResponse)),steady=input===0?0:B>=0?input*(2*halfResponse/(B+disc)):(disc-B)/(2*A);
 const maximum=trace.states.reduce((s,y)=>Math.max(s,y[0]),0),last=trace.states.at(-1);
 return{...trace,steady,steadyEnzyme:1+maxInduction*steady/(halfResponse+steady),maximum,final:last[0],enzyme:last[1],massResidual:last[0]+last[2]-input*trace.times.at(-1)};
}
const expRatio=z=>z===0?1:-Math.expm1(-z)/z;
function twoStageEliminated(dose,x,y){
 if(x===0||y===0)return 0;
 if(x+y<.5){let h0=1,h1=x+y,factorial=2,sum=.5,sign=-1;for(let k=1;k<30;k++){const hk=k===1?h1:(x+y)*h1-x*y*h0;factorial*=k+2;const term=hk/factorial;sum+=sign*term;if(k>1){h0=h1;h1=hk;}sign=-sign;if(term<Math.abs(sum)*1e-17)break;}return((dose*x)*y)*sum;}
 const small=Math.min(x,y),large=Math.max(x,y);
 if(small<1e-5){const m0=-Math.expm1(-large),m1=1-m0/large,m2=1-2*m1/large,m3=1-3*m2/large;return(dose*small)*(m1-small*m2/2+small*small*m3/6);}
 return dose*(-Math.expm1(-x)-x*Math.exp(-Math.min(x,y))*expRatio(Math.abs(x-y)));
}
export function parentMetabolite(time=2,{initial=1,parentRate=.7,metaboliteRate=.3,fraction=.8}={}){
 need(domain(time,0,40)&&domain(initial,0,20)&&domain(parentRate,.05,3)&&domain(metaboliteRate,.05,3)&&domain(fraction,0,1),'Positive first-order parent/metabolite rates and molar-equivalent dose');
 const x=parentRate*time,y=metaboliteRate*time,parent=initial*Math.exp(-x),metabolite=x>1e-100?product(fraction,initial,x*Math.exp(-Math.min(x,y))*expRatio(Math.abs(x-y))):product(fraction,initial,parentRate,time,Math.exp(-Math.min(x,y)),expRatio(Math.abs(x-y))),other=x<1e-100?product(1-fraction,initial,parentRate,time,expRatio(x)):(1-fraction)*initial*(-Math.expm1(-x)),metaboliteEliminated=twoStageEliminated(fraction*initial,x,y),eliminated=other+metaboliteEliminated;
 return{time,parent,metabolite,eliminated,other,metaboliteEliminated,massResidual:parent+metabolite+eliminated-initial,equalRates:parentRate===metaboliteRate,parentUnderflow:initial>0&&parent===0,metaboliteUnderflow:initial>0&&fraction>0&&time>0&&metabolite===0,eliminatedUnderflow:initial>0&&time>0&&eliminated===0};
}
export function proteinBinding(total=2,{sites=4,dissociation=1}={}){
 need(domain(total,0,40)&&domain(sites,0,10)&&domain(dissociation,.1,5),'Nonnegative total concentration/sites and positive dissociation constant');
 if(total===0)return{total,free:0,bound:0,freeFraction:null,limitingFraction:dissociation/(dissociation+sites),derivative:1+sites/dissociation,freeUnderflow:false,boundUnderflow:false,massResidual:0};
 const B=dissociation+sites-total,disc=Math.hypot(B,2*Math.sqrt(dissociation)*Math.sqrt(total)),free=sites===0?total:B>=0?total*(2*dissociation/(B+disc)):(disc-B)/2;
 const freeFraction=(dissociation+free)/(dissociation+free+sites),bound=total*(sites/(dissociation+free+sites));
 return{total,free,bound,freeFraction,limitingFraction:dissociation/(dissociation+sites),derivative:1+sites*dissociation/(dissociation+free)**2,freeUnderflow:free===0,boundUnderflow:sites>0&&bound===0,massResidual:free+bound-total};
}
export function bindingSteady(input=1,{unboundClearance=1,sites=4,dissociation=1}={}){
 need(domain(input,0,4)&&domain(unboundClearance,.2,2)&&domain(sites,0,10)&&domain(dissociation,.1,5),'Chosen constant unbound clearance');
 const free=input/unboundClearance,bound=input*(sites/(unboundClearance*dissociation+input));
 return{input,unboundClearance,free,bound,total:free+bound,freeUnderflow:input>0&&free===0,boundUnderflow:input>0&&sites>0&&bound===0};
}
export function targetMediated({initial=2,target=1,association=.5,dissociation=.2,internalization=.3,linear=.1,turnover=.2,horizon=20,step=.0025}={}){
 need(domain(initial,0,10)&&domain(target,.5,3)&&domain(association,0,2)&&domain(dissociation,0,1)&&domain(internalization,0,2)&&domain(linear,.05,1)&&domain(turnover,.1,1)&&domain(horizon,1,20)&&domain(step,.0005,.005),'Chosen mass-action target/ligand turnover model');
 const synthesis=turnover*target,scale=initial||1,rhs=(_,y)=>{const[l,R,c]=y,bind=association*l*R,release=dissociation*association*c;
  // c=C/(initial*kon) when kon>0 keeps tiny association transients resolved.
  return[-linear*l-bind+release,turnover*(target-R)-scale*bind+scale*release,association>0?l*R-(dissociation+internalization)*c:0,linear*l+internalization*association*c];};
 const normalized=rk4(rhs,[initial?1:0,target,0,0],horizon,step),trace={...normalized,states:normalized.states.map(([l,R,c,d])=>[scale*l,R,product(scale,association,c),scale*d])},last=trace.states.at(-1),massResidual=last[0]+last[2]+last[3]-initial;
 return{...trace,initial,target,synthesis,freeUnderflow:initial>0&&last[0]===0,eliminatedUnderflow:initial>0&&last[3]===0,complexUnderflow:initial>0&&association>0&&last[2]===0,final:{free:last[0],target:last[1],complex:last[2],eliminated:last[3],totalDrug:last[0]+last[2],totalTarget:last[1]+last[2]},massResidual};
}
