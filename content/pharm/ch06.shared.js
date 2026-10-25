// Chapter-local pharmacodynamic teaching models; no fitted drug or patient data.
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const O={step:'any',sig:5,fmt},I={step:1,int:true};
export const lin=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1)),sum=a=>a.reduce((s,x)=>s+x,0);
export const axes=(title,x,y,extra={})=>({title,x,y,height:340,axes:'box',gutter:true,...extra});
export function finite(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside its finite domain');return x;}
export function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
export const logSum=xs=>xs.reduce(logAdd,-Infinity),log=x=>x===0?-Infinity:Math.log(x);
const softplus=x=>x>36?x:Math.log1p(Math.exp(x));
export function magnitude(l){if(l===-Infinity)return{value:0,log:null,status:'zero'};if(!Number.isFinite(l))throw RangeError('finite log magnitude');const x=Math.exp(l);return{value:x===Infinity?null:x,log:l,status:x===0?'positive below binary64 range':x===Infinity?'positive above binary64 range':'positive'};}
const signed=(sign,l)=>{if(l===-Infinity)sign=0;return{sign,...magnitude(sign===0?-Infinity:l)};};
export function fraction(logOdds){return{S:magnitude(-softplus(-logOdds)),U:magnitude(-softplus(logOdds))};}
const concentration=(x,name)=>finite(x,0,100,name),affinity=(x,name='binding Kd')=>finite(x,.001,10,name);
export function binding({L=1,Kd=1,receptors=1,mode='maintained free ligand'}={}){
 concentration(L,'supplied ligand');affinity(Kd);finite(receptors,0,10,'receptor inventory');if(!['maintained free ligand','closed total ligand'].includes(mode))throw RangeError('binding mode');let ll=log(L);
 if(mode==='closed total ligand'&&L>0&&receptors>0){const b=receptors+Kd-L,d=Math.hypot(b,2*Math.sqrt(Kd)*Math.sqrt(L));ll=b>=0?Math.LN2+Math.log(Kd)+Math.log(L)-Math.log(b+d):Math.log((-b+d)/2);}
 const p=fraction(ll-Math.log(Kd)),bound=magnitude(log(receptors)+(p.S.log??-Infinity)),freeReceptors=magnitude(log(receptors)+(p.U.log??-Infinity)),freeLigand=magnitude(ll),totalLigand=mode==='closed total ligand'?magnitude(log(L)):magnitude(logAdd(ll,bound.log??-Infinity));
 return{L,Kd,receptors,mode,probability:p.S,unoccupied:p.U,occupancy:receptors===0?null:p.S,bound,freeReceptors,freeLigand,totalLigand};
}
export function effect({L=1,K=1,n=1,baseline=0,maximum=1}={}){
 concentration(L,'free ligand');affinity(K,'response concentration scale');finite(n,1,4,'Hill exponent');finite(baseline,0,1,'baseline response');finite(maximum,0,1,'limiting response');const p=fraction(n*(log(L)-Math.log(K))),span=maximum-baseline,sign=Math.sign(span),response=magnitude(span===0?log(baseline):logAdd(log(baseline)+(p.U.log??-Infinity),log(maximum)+(p.S.log??-Infinity))),change=signed(sign,log(Math.abs(span))+(p.S.log??-Infinity)),slope=signed(sign,log(Math.abs(span))+Math.log(n)+(p.S.log??-Infinity)+(p.U.log??-Infinity));
 return{L,K,n,baseline,maximum,span,...p,response,change,slope,EC50:span===0?null:K};
}
export function inverseEffect(target,{K=1,n=1,baseline=0,maximum=1}={}){
 finite(target,0,1,'absolute target response');effect({L:0,K,n,baseline,maximum});if(maximum===baseline)return{concentration:null,status:target===baseline?'flat response: concentration unidentifiable':'unattainable target'};
 if(target<Math.min(baseline,maximum)||target>Math.max(baseline,maximum))return{concentration:null,status:'unattainable target'};
 if(target===baseline)return{concentration:magnitude(-Infinity),status:'baseline at zero ligand'};if(target===maximum)return{concentration:null,status:'limiting response requires unbounded concentration'};
 return{concentration:magnitude(Math.log(K)+(Math.log(Math.abs(target-baseline))-Math.log(Math.abs(maximum-target)))/n),status:'unique finite target concentration'};
}
export function constitutive({L=1,Kd=1,basal=.15,efficacy=1}={}){
 concentration(L,'free ligand');affinity(Kd);finite(basal,0,.5,'unbound active fraction');finite(efficacy,0,1,'bound active fraction');const p=fraction(log(L)-Math.log(Kd)),logs=[log(1-basal)+(p.U.log??-Infinity),log(basal)+(p.U.log??-Infinity),log(1-efficacy)+(p.S.log??-Infinity),log(efficacy)+(p.S.log??-Infinity)],active=magnitude(basal===efficacy?log(basal):logAdd(logs[1],logs[3])),span=efficacy-basal;
 return{L,Kd,basal,efficacy,occupancy:p.S,probabilities:logs.map(Math.exp),logProbabilities:logs,active,change:signed(Math.sign(span),log(Math.abs(span))+(p.S.log??-Infinity)),classification:span>0?(efficacy===1?'full agonist':'partial agonist'):span<0?'inverse agonist':'neutral antagonist'};
}
function operationalLog({L,Kd,logInventory,scale}){
 const binding=fraction(log(L)-Math.log(Kd)),logTau=logInventory-Math.log(scale),max=fraction(logTau).S,bound=magnitude(logInventory+(binding.S.log??-Infinity)),response=fraction((bound.log??-Infinity)-Math.log(scale)).S,EC50=logInventory===-Infinity?null:magnitude(Math.log(Kd)-softplus(logTau)),normalized=logInventory===-Infinity?null:magnitude((response.log??-Infinity)-(max.log??-Infinity));
 return{L,Kd,scale,tau:magnitude(logTau),inventory:magnitude(logInventory),occupancy:logInventory===-Infinity?null:binding.S,bound,response,maximum:max,EC50,normalized,halfShift:magnitude(Math.log(Kd)+(max.log??-Infinity))};
}
export function operational({L=1,Kd=1,receptors=1,scale=.1}={}){
 concentration(L,'free ligand');affinity(Kd);finite(receptors,0,10,'receptor inventory');finite(scale,.001,10,'transduction concentration scale');return operationalLog({L,Kd,logInventory:log(receptors),scale});
}
export function inactivation({L=1,Kd=1,receptors=1,scale=.1,remaining=.5}={}){
 operational({L,Kd,receptors,scale});finite(remaining,0,1,'remaining receptor fraction');return{remaining,reference:operationalLog({L,Kd,logInventory:log(receptors),scale}),chosen:operationalLog({L,Kd,logInventory:log(receptors)+log(remaining),scale})};
}
export function gating({L=1,Kmic=1,g=4}={}){
 concentration(L,'free ligand');affinity(Kmic,'microscopic closed binding constant');finite(g,0,100,'opening/closing ratio');const a=log(L)-Math.log(Kmic),weights=[0,a,a+log(g)],Z=logSum(weights),probabilities=weights.map(w=>Math.exp(w-Z)),occupancy=magnitude(logAdd(weights[1],weights[2])-Z),open=magnitude(weights[2]-Z),maximum=fraction(log(g)).S,logHalf=Math.log(Kmic)-Math.log1p(g);
 return{L,Kmic,g,probabilities,occupancy,open,maximum,bindingHalf:magnitude(logHalf),EC50:g===0?null:magnitude(logHalf)};
}
export function competitive({A=1,B=1,KA=1,KB=1}={}){
 concentration(A,'free agonist');concentration(B,'free antagonist');affinity(KA,'agonist binding constant');affinity(KB,'antagonist binding constant');const a=log(A)-Math.log(KA),b=log(B)-Math.log(KB),weights=[0,a,b],Z=logSum(weights),logDR=softplus(b),excess=magnitude(b);
 return{A,B,KA,KB,probabilities:weights.map(w=>Math.exp(w-Z)),agonist:magnitude(a-Z),antagonist:magnitude(b-Z),doseRatio:Math.exp(logDR),excess,halfConcentration:magnitude(Math.log(KA)+logDR),halfShift:magnitude(Math.log(KA)+b),pA2:6-Math.log(KB)/Math.LN10,schildX:B===0?null:Math.log(B)/Math.LN10-6,schildY:B===0?null:b/Math.LN10};
}
function freeReceptorLog(R,L,I,K,Ki){
 if(R===0)return-Infinity;const lr=Math.log(R),lk=Math.log(K),li=Math.log(Ki),ll=log(L),ii=log(I);let lo=lr-logSum([0,ll-lk,ii-li]),hi=lr;
 const mass=x=>logSum([x,x+ll-logAdd(lk,x),x+ii-logAdd(li,x)]);
 for(let j=0;j<110;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(mass(mid)<lr)lo=mid;else hi=mid;}return(lo+hi)/2;
}
export function tracerDisplacement({L=1,I=1,Kd=1,Ki=1,receptors=1,mode='maintained free ligands'}={}){
 concentration(L,'tracer concentration');concentration(I,'inhibitor concentration');affinity(Kd,'tracer dissociation constant');affinity(Ki,'inhibitor dissociation constant');finite(receptors,0,10,'receptor inventory');if(!['maintained free ligands','closed total ligands'].includes(mode))throw RangeError('displacement mode');
 const lk=Math.log(Kd),li=Math.log(Ki),ll=log(L),ii=log(I),lr=log(receptors),closed=mode==='closed total ligands',idealIC50=magnitude(li+softplus(ll-lk));
 if(!closed){const Z=logSum([0,ll-lk,ii-li]),inhibited=fraction(ii-(idealIC50.log??-Infinity));return{L,I,Kd,Ki,receptors,mode,freeReceptor:magnitude(lr-Z),freeTracer:magnitude(ll),freeInhibitor:magnitude(ii),boundTracer:magnitude(lr+ll-lk-Z),boundInhibitor:magnitude(lr+ii-li-Z),baselineBound:magnitude(lr+ll-lk-softplus(ll-lk)),ratio:L===0||receptors===0?null:inhibited.U,inhibition:L===0||receptors===0?null:inhibited.S,IC50:L===0||receptors===0?null:idealIC50,idealIC50:L===0||receptors===0?null:idealIC50,naiveKi:L===0||receptors===0?null:magnitude(li)};}
 const r=freeReceptorLog(receptors,L,I,Kd,Ki),r0=I===0?r:freeReceptorLog(receptors,L,0,Kd,Ki),logKPlusR=logAdd(lk,r),logKPlusR0=logAdd(lk,r0),logKiPlusR=logAdd(li,r),factor=softplus(ll+lk-logKPlusR-logKPlusR0),inhibited=fraction(lk+ii-logKiPlusR-factor-logKPlusR0),measurable=L>0&&receptors>0;
 let IC50=null;
 if(measurable){const denominator=logAdd(Math.LN2+lk,r0),half=lk+r0-denominator,delta=r0+logKPlusR0-denominator,halfFactor=softplus(ll+lk-logKPlusR0-logAdd(lk,half));IC50=magnitude(logAdd(li,half)-half+delta+halfFactor);}
 return{L,I,Kd,Ki,receptors,mode,freeReceptor:magnitude(r),freeTracer:magnitude(ll+lk-logKPlusR),freeInhibitor:magnitude(ii+li-logKiPlusR),boundTracer:magnitude(r+ll-logKPlusR),boundInhibitor:magnitude(r+ii-logKiPlusR),baselineBound:magnitude(r0+ll-logKPlusR0),ratio:measurable?inhibited.U:null,inhibition:measurable?inhibited.S:null,IC50,idealIC50:measurable?idealIC50:null,naiveKi:measurable?magnitude(IC50.log-softplus(ll-lk)):null};
}
export function allosteric({A=1,B=1,KA=1,KB=1,alpha=4,beta=1,scale=.3}={}){
 concentration(A,'free orthosteric ligand');concentration(B,'free allosteric ligand');affinity(KA,'orthosteric dissociation constant');affinity(KB,'allosteric dissociation constant');finite(alpha,.05,20,'joint binding-weight multiplier');finite(beta,0,3,'joint efficacy multiplier');finite(scale,.01,3,'transduction scale');const a=log(A)-Math.log(KA),b=log(B)-Math.log(KB),ab=Math.log(alpha)+a+b,weights=[0,a,b,ab],Z=logSum(weights),occupancy=magnitude(logAdd(a,ab)-Z),modulator=magnitude(logAdd(b,ab)-Z),stimulus=magnitude(logAdd(a,log(beta)+ab)-Z),response=fraction((stimulus.log??-Infinity)-Math.log(scale)).S,referenceStimulus=fraction(a).S,reference=fraction((referenceStimulus.log??-Infinity)-Math.log(scale)).S;
 const limit=fraction(Math.log(alpha)+a),limitingStimulus=magnitude(log(beta)+(limit.S.log??-Infinity)),limitingResponse=fraction((limitingStimulus.log??-Infinity)-Math.log(scale)).S;
 return{A,B,KA,KB,alpha,beta,scale,probabilities:weights.map(w=>Math.exp(w-Z)),occupancy,modulator,stimulus,response,reference,limitingResponse,apparentBindingKd:magnitude(Math.log(KA)+softplus(b)-softplus(Math.log(alpha)+b))};
}
// log(1-exp(-exp(x))), including positive relaxation smaller than binary64.
function logRelaxed(x){return x===-Infinity?-Infinity:x< -36?x:Math.log(-Math.expm1(-Math.exp(x)));}
function occupancyPulse(t,{L,Kd,koff,pulse}){
 if(t===0||pulse===0||L===0)return magnitude(-Infinity);const on=Math.min(t,pulse),logRate=Math.log(koff)+softplus(Math.log(L)-Math.log(Kd)),p=fraction(Math.log(L)-Math.log(Kd)),loaded=(p.S.log??-Infinity)+logRelaxed(logRate+Math.log(on));return magnitude(loaded-koff*Math.max(0,t-pulse));
}
// Resolve each positive relaxation scale as well as the global observation interval.
function relaxationTimes(T,scale){return [...lin(73,-5,2),-5,-4,-3,-2,-1,0,1,2].map(e=>scale*10**e).filter(t=>t>0&&t<T);}
export function kineticPulse({L=1,Kd=1,koff=.2,pulse=20,T=120}={}){
 concentration(L,'maintained pulse concentration');affinity(Kd);finite(koff,.0001,2,'dissociation rate');finite(pulse,0,200,'pulse duration');finite(T,0,1200,'observation interval');const args={L,Kd,koff,pulse},times=[...new Set([...lin(241,0,T),...(pulse>0&&pulse<T?[pulse]:[])])].sort((a,b)=>a-b),peakTime=Math.min(T,pulse),peak=occupancyPulse(peakTime,args),input=t=>pulse>0&&t<pulse?L:0,trace=times.map(t=>({t,input:input(t),occupancy:occupancyPulse(t,args)}));
 const inputPath=T===0?[[0,input(0)]]:pulse===0||L===0?[[0,0],[T,0]]:pulse<T?[[0,0],[0,L],[pulse,L],[pulse,0],[T,0]]:pulse===T?[[0,0],[0,L],[T,L],[T,0]]:[[0,0],[0,L],[T,L]];
 const onTime=Math.exp(-Math.log(koff)-softplus(log(L)-Math.log(Kd))),plotTimes=[...new Set([...times,...relaxationTimes(Math.min(T,pulse),onTime),...relaxationTimes(Math.max(0,T-pulse),1/koff).map(t=>pulse+t)])].sort((a,b)=>a-b),plotTrace=plotTimes.map(t=>({t,input:input(t),occupancy:occupancyPulse(t,args)}));
 return{L,Kd,koff,pulse,T,kon:koff/Kd,residence:1/koff,washoutHalfTime:Math.LN2/koff,onTime,peakTime,peak,exposure:magnitude(log(L)+log(peakTime)),trace,plotTrace,inputPath};
}
function evolveAvailability(state,logDesens,logRecovery,t){
 if(t===0||(state[1]===-Infinity&&logDesens===-Infinity)||(state[0]===-Infinity&&logRecovery===-Infinity))return state.slice();const rate=logAdd(logDesens,logRecovery);if(rate===-Infinity)return state.slice();const lt=rate+Math.log(t),decay=-Math.exp(lt),jump=logRelaxed(lt);
 return[logAdd(state[0]+decay,logRecovery-rate+jump),logAdd(state[1]+decay,logDesens-rate+jump)];
}
export function adaptation({L=1,Kd=1,desensitization=.2,recovery=.04,pulse=20,gap=20,pulses=3,duration=120,mode='repeated pulses'}={}){
 concentration(L,'maintained ligand');affinity(Kd);finite(desensitization,0,2,'desensitization rate');finite(recovery,0,1,'recovery rate');finite(pulse,1,60,'pulse interval');finite(gap,1,60,'gap interval');finite(pulses,1,6,'pulse count');if(!Number.isInteger(pulses))throw RangeError('pulse count must be integral');finite(duration,1,360,'continuous exposure duration');if(!['repeated pulses','continuous exposure'].includes(mode))throw RangeError('exposure architecture');const theta=fraction(log(L)-Math.log(Kd)).S,segments=[];
 if(mode==='continuous exposure')segments.push({length:duration,on:true});else for(let j=0;j<pulses;j++){segments.push({length:pulse,on:true});if(j<pulses-1)segments.push({length:gap,on:false});}segments.push({length:60,on:false});
 let clock=0,state=[0,-Infinity];const trace=[],plotTrace=[],peaks=[];
 for(const segment of segments){const before=state.slice(),ld=segment.on?log(desensitization)+(theta.log??-Infinity):-Infinity,lr=log(recovery);if(segment.on)peaks.push({t:clock,response:magnitude(before[0]+(theta.log??-Infinity))});const sample=elapsed=>{const at=evolveAvailability(before,ld,lr,elapsed);return{t:clock+elapsed,input:segment.on?L:0,availability:magnitude(at[0]),desensitized:magnitude(at[1]),response:magnitude(segment.on?at[0]+(theta.log??-Infinity):-Infinity)};},uniform=lin(61,0,segment.length),rate=logAdd(ld,lr),adaptive=rate===-Infinity?[]:relaxationTimes(segment.length,Math.exp(-rate));for(const elapsed of uniform)trace.push(sample(elapsed));for(const elapsed of [...new Set([...uniform,...adaptive])].sort((a,b)=>a-b))plotTrace.push(sample(elapsed));state=evolveAvailability(before,ld,lr,segment.length);clock+=segment.length;}
 return{L,Kd,desensitization,recovery,pulse,gap,pulses,duration,mode,theta,T:clock,trace,plotTrace,peaks,finalAvailability:magnitude(state[0]),finalDesensitized:magnitude(state[1])};
}
function mixtureLogit(A,B,KA,KB,nA,nB,interaction){
 const a=log(A)-Math.log(KA),b=log(B)-Math.log(KB);if(A===0)return nB*b;if(B===0)return nA*a;if(interaction===0&&nA===nB)return nA*logAdd(a,b);
 let lo=Math.max(nA*a,nB*b),hi=lo+Math.max(nA,nB)*Math.log(4*Math.max(1,1+interaction/4));
 const equation=t=>{const u=a-t/nA,v=b-t/nB,Z=logAdd(u,v),p=Math.exp(u-Z);return Z+Math.log1p(interaction*p*(1-p));};
 for(let j=0;j<120;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(equation(mid)>0)lo=mid;else hi=mid;}return(lo+hi)/2;
}
export function loewe({A=.5,B=.5,KA=1,KB=2,nA=1,nB=2,interaction=0,target=.5}={}){
 concentration(A,'drug A concentration');concentration(B,'drug B concentration');affinity(KA,'drug A response scale');affinity(KB,'drug B response scale');finite(nA,1,4,'drug A Hill exponent');finite(nB,1,4,'drug B Hill exponent');finite(interaction,-.8,2,'authored interaction coefficient');finite(target,.01,.99,'isobole effect');const t=mixtureLogit(A,B,KA,KB,nA,nB,interaction),referenceT=interaction===0?t:mixtureLogit(A,B,KA,KB,nA,nB,0),response=fraction(t).S,reference=fraction(referenceT).S,tt=Math.log(target)-Math.log1p(-target),doseA=KA*Math.exp(tt/nA),doseB=KB*Math.exp(tt/nB),isobole=lin(121,0,1).map(u=>{if(u===0)return[0,doseB];if(u===1)return[doseA,0];if(interaction===0)return[u*doseA,(1-u)*doseB];const b=(2+interaction)*u-1,c=u*(u-1),d=Math.sqrt(b*b-4*c),v=b>=0?-2*c/(b+d):(-b+d)/2;return[u*doseA,v*doseB];});
 const index=A===0&&B===0?null:A===0||B===0?magnitude(0):magnitude(logAdd(log(A)-Math.log(KA)-t/nA,log(B)-Math.log(KB)-t/nB));
 const halfSum=logAdd(log(A)-Math.log(KA),log(B)-Math.log(KB)),share=A===0&&B===0?0:Math.exp(log(A)-Math.log(KA)-halfSum),halfMultiplier=A===0&&B===0?null:magnitude(-halfSum-Math.log1p(interaction*share*(1-share)));
 return{A,B,KA,KB,nA,nB,interaction,target,logit:t,response,reference,combinationIndex:index,doseA,doseB,isobole,halfMultiplier,status:A===0&&B===0?'zero exposure: equivalent-dose index undefined':A===0||B===0?'single-agent boundary':interaction===0?'Loewe additive construction':interaction>0?'authored departure stronger than Loewe':'authored departure weaker than Loewe'};
}
