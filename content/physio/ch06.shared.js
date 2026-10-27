// Own oxygen-transport families. Numerical parameters are declared teaching choices.
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const lin=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export function finite(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside its finite domain');return x;}
export function integer(x,a,b,name='integer'){finite(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be integral');return x;}
export const O={step:'any',sig:5,fmt},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,height:340,axes:'box',gutter:true,...extra});
export const CAPACITY=1.36,DISSOLVED=.003;
export function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
export const logSum=xs=>xs.reduce(logAdd,-Infinity);
const softplus=x=>x>36?x+Math.log1p(Math.exp(-x)):Math.log1p(Math.exp(x));
export function magnitude(log){if(log===-Infinity)return{value:0,log:null,status:'zero'};if(!Number.isFinite(log))throw RangeError('finite log magnitude');const value=Math.exp(log);return{value:value===Infinity?null:value,log,status:value===0?'positive below binary64 range':value===Infinity?'positive above binary64 range':'positive'};}
export function hill({P=100,P50=27,n=2.7}={}){
 finite(P,0,200,'oxygen pressure');finite(P50,.1,100,'half pressure');finite(n,1,4,'Hill exponent');const odds=P===0?-Infinity:n*(Math.log(P)-Math.log(P50)),logS=-softplus(-odds),logFree=-softplus(odds),S=magnitude(logS),unoccupied=magnitude(logFree),slope=magnitude(Math.log(n)+logS+logFree);
 return{P,P50,n,S,unoccupied,slope,logOdds:P===0?null:odds};
}
export function content({P=100,Hb=15,P50=27,n=2.7}={}){
 finite(Hb,0,20,'hemoglobin concentration');const z=hill({P,P50,n}),bound=magnitude(Hb===0?-Infinity:Math.log(CAPACITY)+Math.log(Hb)+(z.S.log??-Infinity)),dissolved=magnitude(P===0?-Infinity:Math.log(DISSOLVED)+Math.log(P)),total=magnitude(logAdd(bound.log??-Infinity,dissolved.log??-Infinity));
 return{...z,Hb,bound,dissolved,total,dissolvedFraction:total.log===null?null:magnitude((dissolved.log??-Infinity)-total.log)};
}
export function bindingDifference(Pa,Pv,P50=27,n=2.7){
 finite(Pa,0,200,'first pressure');finite(Pv,0,200,'second pressure');finite(P50,.1,100,'half pressure');finite(n,1,4,'Hill exponent');if(Pa===Pv)return{sign:0,...magnitude(-Infinity)};if(Pa<Pv){const q=bindingDifference(Pv,Pa,P50,n);return{...q,sign:-1};}
 const a=hill({P:Pa,P50,n}),b=hill({P:Pv,P50,n}),relative=Pv===0?Infinity:(Pa-Pv)/Pv,delta=Pv===0?Infinity:n*(Number.isFinite(relative)?Math.log1p(relative):Math.log(Pa)-Math.log(Pv)),contrast=Math.log(-Math.expm1(-delta));return{sign:1,...magnitude((a.S.log??-Infinity)+(b.unoccupied.log??-Infinity)+contrast)};
}
export function contentDifference(Pa,Pv,Hb=15,P50=27,n=2.7){
 finite(Hb,0,20,'hemoglobin concentration');const q=bindingDifference(Pa,Pv,P50,n);if(q.sign===0)return q;const logBound=Hb===0?-Infinity:Math.log(CAPACITY)+Math.log(Hb)+(q.log??-Infinity),logDiss=Math.log(DISSOLVED)+Math.log(Math.abs(Pa-Pv));return{sign:q.sign,...magnitude(logAdd(logBound,logDiss))};
}
export function inverseContent(target,{Hb=15,P50=27,n=2.7}={}){
 finite(target,0,100,'oxygen content');finite(Hb,0,20,'hemoglobin concentration');finite(P50,.1,100,'half pressure');finite(n,1,4,'Hill exponent');if(target===0)return magnitude(-Infinity);
 const logTarget=Math.log(target),logCapacity=Hb===0?-Infinity:Math.log(CAPACITY)+Math.log(Hb),at=logP=>logAdd(logCapacity-softplus(-n*(logP-Math.log(P50))),Math.log(DISSOLVED)+logP);
 const endpoint=content({P:200,Hb,P50,n}).total.value;if(target>endpoint)throw RangeError('content exceeds pressure domain');if(target===endpoint)return magnitude(Math.log(200));
 // For n>=1, alpha P <= C(P) <= (alpha+q Hb/P50) P. These bounds
 // keep the logarithmic root bracket narrow even below the smallest float.
 let lo=logTarget-logAdd(Math.log(DISSOLVED),logCapacity-Math.log(P50)),hi=Math.min(Math.log(200),logTarget-Math.log(DISSOLVED));for(let j=0;j<110;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(at(mid)<logTarget)lo=mid;else hi=mid;}return magnitude((lo+hi)/2);
}
const CHOOSE=[1,4,6,4,1];
export function polynomial({P=40,logCoefficients=[0,0,0,0,0]}={}){
 finite(P,0,200,'oxygen pressure');if(!Array.isArray(logCoefficients)||logCoefficients.length!==5||logCoefficients.some(x=>!Number.isFinite(x)))throw RangeError('five finite log coefficients');const logP=P===0?-Infinity:Math.log(P),weights=logCoefficients.map((b,j)=>j===0?b:P===0?-Infinity:b+j*logP),Z=logSum(weights),logProbabilities=weights.map(w=>w-Z),probabilities=logProbabilities.map(Math.exp),logMean=logSum(logProbabilities.slice(1).map((w,j)=>w+Math.log(j+1))),logMissing=logSum(logProbabilities.slice(0,4).map((w,j)=>w+Math.log(4-j))),mean=Math.exp(logMean),logVariance=logSum(logProbabilities.map((w,j)=>j===mean?-Infinity:w+2*Math.log(Math.abs(j-mean)))),S=magnitude(logMean-Math.log(4));
 return{P,logCoefficients:logCoefficients.slice(),logProbabilities,probabilities,S,mean,variance:magnitude(logVariance),localHill:P===0?null:magnitude(logVariance-logMean-logMissing+Math.log(4))};
}
function mwcFraction(alpha,L,c,m=4){const lr=m*Math.log1p(alpha),lt=Math.log(L)+m*Math.log1p(c*alpha),pR=Math.exp(lr-logAdd(lr,lt));return pR*alpha/(1+alpha)+(1-pR)*c*alpha/(1+c*alpha);}
export function mwcScale(L=1e4,c=.01){finite(L,1,1e6,'allosteric weight');finite(c,.001,1,'affinity ratio');let lo=0,hi=1/c;for(let j=0;j<100;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(mwcFraction(mid,L,c)<.5)lo=mid;else hi=mid;}const KR=27/((lo+hi)/2);return{L,c,KR,KT:KR/c};}
export function adairMWC({P=40,L=1e4,c=.01,third=1,family='MWC-derived'}={}){
 finite(third,.1,10,'third coefficient multiplier');if(!['MWC-derived','independent sites','modified Adair'].includes(family))throw RangeError('binding family');const z=mwcScale(L,c),logCoefficients=CHOOSE.map((q,j)=>Math.log(q)+logAdd(-j*Math.log(z.KR),Math.log(L)-j*Math.log(z.KT))-Math.log1p(L)),base=polynomial({P,logCoefficients}),chosen=family==='independent sites'?CHOOSE.map((q,j)=>Math.log(q)-j*Math.log(27)):logCoefficients.slice();if(family==='modified Adair')chosen[3]+=Math.log(third);const model=polynomial({P,logCoefficients:chosen}),alpha=P/z.KR,pR=Math.exp(4*Math.log1p(alpha)-logAdd(4*Math.log1p(alpha),Math.log(L)+4*Math.log1p(c*alpha))),normalizedAffinities=chosen.slice(1).map((b,j)=>magnitude(b-chosen[j]+Math.log((j+1)/(4-j))));
 return{...z,...model,base,family,third,mwcRelaxedProbability:pR,normalizedAffinities};
}
export function carbonMonoxide({P=40,Hb=15,occupied=1,bias=4}={}){
 finite(P,0,200,'oxygen pressure');finite(Hb,0,20,'hemoglobin concentration');integer(occupied,0,4,'fixed CO sites');finite(bias,3,6,'R stabilization per CO');const z=mwcScale(),m=4-occupied,L=z.L*Math.exp(-occupied*bias),a=P/z.KR,lr=m*Math.log1p(a),lt=Math.log(L)+m*Math.log1p(z.c*a),logZ=logAdd(lr,lt),logR=lr-logZ,logT=lt-logZ,logConditional=P===0?-Infinity:logAdd(logR+Math.log(P)-Math.log(z.KR+P),logT+Math.log(P)-Math.log(z.KT+P)),remaining=m===0?null:magnitude(logConditional),absolute=magnitude(m===0?-Infinity:Math.log(m/4)+logConditional),normal=adairMWC({P}),capacityOnly=magnitude(m===0?-Infinity:Math.log(m/4)+(normal.S.log??-Infinity)),bound=magnitude(Hb===0?-Infinity:Math.log(CAPACITY)+Math.log(Hb)+(absolute.log??-Infinity)),dissolved=magnitude(P===0?-Infinity:Math.log(DISSOLVED)+Math.log(P));
 return{P,Hb,occupied,bias,remaining,absolute,capacityOnly,bound,dissolved,total:magnitude(logAdd(bound.log??-Infinity,dissolved.log??-Infinity)),relaxedProbability:Math.exp(logR),availableFraction:m/4};
}
// Two oxygen states (0/4), six proton sites and two carbamate sites.
// Carbamate formation releases a proton, hence its weight contains 1/h.
const H0=10**-7.4,PC0=40,PKA=6.1,ALPHA_CO2=.03,PROTON_SITES=6,CARBAMATE_SITES=2,KH_D=10**-7.2,KH_O=10**-6.7,KC_D=.2*H0/PC0,KC_O=.05*H0/PC0;
const linkedWeight=(h,pc,KH,KC)=>PROTON_SITES*Math.log1p(h/KH)+CARBAMATE_SITES*Math.log1p(KC*pc/h);
const LINKED_KP=27/Math.exp((linkedWeight(H0,PC0,KH_D,KC_D)-linkedWeight(H0,PC0,KH_O,KC_O))/4);
function linkedState(P,h,pc,Hb){
 const ld=linkedWeight(h,pc,KH_D,KC_D),ao=linkedWeight(h,pc,KH_O,KC_O),lo=P===0?-Infinity:4*(Math.log(P)-Math.log(LINKED_KP))+ao,logY=lo-logAdd(ld,lo),Y=Math.exp(logY),mean=(KH,KC)=>{const H=h/(KH+h),C=KC*pc/(h+KC*pc);return{H:6*H,C:2*C,N:6*H-2*C,variance:6*H*(1-H)+2*C*(1-C)};},d=mean(KH_D,KC_D),o=mean(KH_O,KC_O),THb=Hb/6.45,logTHb=Hb===0?-Infinity:Math.log(Hb)-Math.log(6.45),protons=(1-Y)*d.H+Y*o.H,carbamates=(1-Y)*d.C+Y*o.C;
 return{P,h,pc,Hb,pH:-Math.log10(h),Y,oxygenFraction:magnitude(logY),P50:LINKED_KP*Math.exp((ld-ao)/4),N:THb*((1-Y)*d.N+Y*o.N),Hbound:THb*protons,carb:THb*carbamates,protonMetric:magnitude(logTHb+Math.log(protons)),carbamateMetric:magnitude(logTHb+Math.log(carbamates)),protonVariance:THb*((1-Y)*d.variance+Y*o.variance+Y*(1-Y)*(d.N-o.N)**2)};
}
export function linkedFixed({P=40,pH=7.4,pc=40,Hb=15}={}){finite(P,0,200,'oxygen pressure');finite(pH,6.8,7.8,'maintained pH');finite(pc,10,80,'carbon dioxide pressure');finite(Hb,0,20,'hemoglobin concentration');return linkedState(P,10**-pH,pc,Hb);}
export function linkedBlood({P=40,pc=40,Hb=15}={}){
 finite(P,0,200,'oxygen pressure');finite(pc,10,80,'carbon dioxide pressure');finite(Hb,0,20,'hemoglobin concentration');const ref=linkedState(100,H0,PC0,Hb),B0=ALPHA_CO2*PC0*10**(7.4-PKA),target=ALPHA_CO2*pc*10**-PKA;
 const at=lh=>{const h=Math.exp(lh),s=linkedState(P,h,pc,Hb),B=B0+1000*(h-H0)+s.N-ref.N;return{...s,B,dissolvedCO2:ALPHA_CO2*pc,totalCO2:ALPHA_CO2*pc+B+s.carb,residual:h*B-target,referenceBicarbonate:B0};};
 let lo=Math.log(1e-14),hi=Math.log(1e-3);if(at(lo).residual>=0||at(hi).residual<=0)throw Error('hydrogen root not bracketed');for(let i=0;i<120;i++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(at(mid).residual>0)hi=mid;else lo=mid;}return at((lo+hi)/2);
}
export function affinityShift({Pa=100,Pv=40,Hb=15,factor=1.3}={}){
 finite(Pa,0,200,'arterial pressure');finite(Pv,0,200,'tissue pressure');finite(Hb,0,20,'hemoglobin concentration');finite(factor,.7,1.8,'relative BPG shift');const P50=27*factor,before=contentDifference(Pa,Pv,Hb,27),after=contentDifference(Pa,Pv,Hb,P50),optimum=Pa>Pv&&Pv>0?Math.exp((Math.log(Pa)+Math.log(Pv))/2):null;
 return{Pa,Pv,Hb,factor,P50,before,after,optimum,status:Pa>Pv?'arterial-to-tissue release':Pa===Pv?'equal pressures: no unloading interval':'reversed pressure ordering'};
}
export function fetalTransfer({maternal=40,fetal=25,conductance=.2}={}){
 finite(maternal,0,100,'maternal pressure');finite(fetal,0,100,'fetal pressure');finite(conductance,0,1,'illustrative conductance');const sign=maternal===fetal||conductance===0?0:Math.sign(maternal-fetal),fluxMetric={sign,...magnitude(sign===0?-Infinity:Math.log(conductance)+Math.log(Math.abs(maternal-fetal)))};return{maternal,fetal,conductance,maternalS:hill({P:maternal,P50:27}),fetalS:hill({P:fetal,P50:19}),flux:sign*fluxMetric.value,fluxMetric,direction:sign===0?'zero flux':sign>0?'mother to fetus':'fetus to mother'};
}
export function fick({uptake=250,Pa=100,Pv=40,Hb=15}={}){
 finite(uptake,0,1500,'oxygen uptake');const a=content({P:Pa,Hb}),v=content({P:Pv,Hb}),difference=contentDifference(Pa,Pv,Hb);if(difference.sign<=0)return{uptake,Pa,Pv,Hb,a,v,difference,flow:null,status:uptake===0&&difference.sign===0?'zero uptake and zero gradient: flow unidentifiable':'positive arterial-minus-venous content is required'};
 const flow=magnitude(uptake===0?-Infinity:Math.log(uptake)-Math.log(10)-(difference.log??-Infinity));return{uptake,Pa,Pv,Hb,a,v,difference,flow,status:'steady mass-balance inference'};
}
export function delivery({Q=5,Pa=100,Hb=15,demand=250,maximumExtraction=.6}={}){
 finite(Q,0,15,'blood flow');finite(demand,0,1500,'oxygen demand');finite(maximumExtraction,.1,1,'authored extraction ceiling');const blood=content({P:Pa,Hb}),supply=magnitude(Q===0||blood.total.log===null?-Infinity:Math.log(10)+Math.log(Q)+blood.total.log),capacity=magnitude(supply.log===null?-Infinity:supply.log+Math.log(maximumExtraction)),logDemand=demand===0?-Infinity:Math.log(demand),uptake=magnitude(Math.min(logDemand,capacity.log??-Infinity)),extraction=supply.log===null?null:magnitude((uptake.log??-Infinity)-supply.log),critical=magnitude(demand===0?-Infinity:logDemand-Math.log(maximumExtraction));
 return{Q,Pa,Hb,demand,maximumExtraction,blood,supply,capacity,uptake,extraction,critical,demandMet:logDemand<=(capacity.log??-Infinity)};
}
function integrate(rhs,y0,times,physical){
 const step=(y,h)=>{const k1=rhs(y),b=y.map((x,j)=>x+h*k1[j]/2);if(!physical(b))return null;const k2=rhs(b),c=y.map((x,j)=>x+h*k2[j]/2);if(!physical(c))return null;const k3=rhs(c),d=y.map((x,j)=>x+h*k3[j]);if(!physical(d))return null;const k4=rhs(d),z=y.map((x,j)=>x+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);return physical(z)?z:null;};
 if(!physical(y0))throw Error('unphysical initial state');let y=y0.slice(),t=0,h=.02,steps=0,rejected=0;const rows=[];
 for(const target of times){while(t<target){if(++steps>60000)throw Error('positive integration budget exceeded');const dt=Math.min(h,target-t),full=step(y,dt),first=step(y,dt/2),half=first&&step(first,dt/2),next=full&&half&&half.map((x,j)=>x+(x-full[j])/15),valid=next&&physical(next),error=valid?Math.max(...next.map((x,j)=>Math.abs(half[j]-full[j])/(15*(2e-12+1e-9*Math.max(Math.abs(x),Math.abs(y[j])))))):Infinity;
   if(error<=1){y=next;t+=dt;h=dt*(error===0?2:Math.max(.2,Math.min(3,.9*error**(-.2))));}else{rejected++;h=dt*(valid?Math.max(.1,.8*error**(-.2)):.5);if(t+h===t)throw Error('time step unresolved');}}
  rows.push([target,...y]);}
 return{rows,steps,rejected};
}
export function chloride({dose=1.9,catalyst=4,exchange=true,T=20}={}){
 finite(dose,0,4,'initial extracellular CO2');finite(catalyst,0,20,'relative hydration catalyst');finite(T,0,30,'observation time');if(typeof exchange!=='boolean')throw RangeError('chloride exchanger switch');const totalCarbon=dose+.9,rate=.2*(1+catalyst),reverse=.02*(1+catalyst),expand=y=>{const[ci,bi,bo,carb]=y,BH=bi+bo+carb;return{ci,co:dose+(.1-ci)+(.2-bi)+(.5-bo)+(.1-carb),bi,bo,carb,amine:.4-carb,B:3-BH,BH,Cli:.5+bo,Clo:2.5-bo};},fluxes=y=>{const z=expand(y);return{diffusion:1.5*(z.co-z.ci),hydration:rate*z.ci*z.B-reverse*z.bi*z.BH,carbamino:5*z.ci*z.amine*z.B-.5*z.carb*z.BH,exchange:exchange?z.bi*z.Clo-.5*z.bo*z.Cli:0};},rhs=y=>{const q=fluxes(y);return[q.diffusion-q.hydration-q.carbamino,q.hydration-q.exchange,q.exchange,q.carbamino];},physical=y=>Object.values(expand(y)).every(x=>Number.isFinite(x)&&x>=0),solution=integrate(rhs,[.1,.2,.5,.1],lin(241,0,T),physical),trace=solution.rows.map(([t,...y])=>{const z=expand(y),f=fluxes(y);return{t,...z,fluxes:f,dissolved:z.ci+z.co,bicarbonate:z.bi+z.bo,carbon:z.ci+z.co+z.bi+z.bo+z.carb,chloride:z.Cli+z.Clo,buffer:z.B+z.BH,amineTotal:z.amine+z.carb,negativeCharge:z.B+z.bi+z.bo+z.carb+z.Cli+z.Clo,insideNegativeCharge:z.B+z.bi+z.carb+z.Cli,outsideNegativeCharge:z.bo+z.Clo};});
 return{dose,catalyst,exchange,T,totalCarbon,hydrationEquilibriumRatio:10,trace,steps:solution.steps,rejected:solution.rejected};
}
export function erythropoiesisSteady({availability=.7,hillExponent=8}={}){
 finite(availability,.4,1.2,'oxygen availability per red-cell mass');finite(hillExponent,1,20,'feedback exponent');const f=R=>2/(1+(availability*R)**hillExponent);let lo=0,hi=2;for(let j=0;j<100;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(mid<f(mid))lo=mid;else hi=mid;}const R=(lo+hi)/2;
 return{availability,hillExponent,R,oxygen:availability*R,loopGain:hillExponent*(1-R/2)};
}
export function maturationBoundary(delay=7){
 finite(delay,1,160,'mean maturation lag');const gamma=1/120,m=4,phase=w=>Math.atan(w)+m*Math.atan(w*delay*gamma/m);let lo=0,hi=1;while(phase(hi)<Math.PI)hi*=2;for(let j=0;j<100;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(phase(mid)<Math.PI)lo=mid;else hi=mid;}const w=(lo+hi)/2,criticalGain=Math.sqrt(1+w*w)*(1+(w*delay*gamma/m)**2)**(m/2);
 return{delay,criticalGain,omega:w*gamma};
}
export function erythropoiesis({availability=.7,hillExponent=8,delay=7,deficit=0,T=400,mode='four-stage maturation'}={}){
 finite(delay,1,160,'mean maturation lag');finite(deficit,0,.5,'initial red-cell deficit');finite(T,0,600,'observation time');if(!['four-stage maturation','instantaneous feedback'].includes(mode))throw RangeError('maturation mode');const steady=erythropoiesisSteady({availability,hillExponent}),gamma=1/120,a=4/delay,f=R=>2/(1+(availability*R)**hillExponent),instant=mode==='instantaneous feedback',y0=instant?[1-deficit]:[1,1,1,1,1-deficit],rhs=instant?y=>[gamma*(f(y[0])-y[0])]:y=>[a*(f(y[4])-y[0]),a*(y[0]-y[1]),a*(y[1]-y[2]),a*(y[2]-y[3]),gamma*(y[3]-y[4])],solution=integrate(rhs,y0,lin(241,0,T),y=>y.every(x=>Number.isFinite(x)&&x>=0&&x<=2)),trace=solution.rows.map(([t,...y])=>{const R=y.at(-1);return[t,R,f(R),instant?f(R):y[3],availability*R];}),boundary=instant?null:maturationBoundary(delay),margin=instant?null:Math.log(steady.loopGain/boundary.criticalGain),stability=instant?'linearly stable':Math.abs(margin)<1e-11?'near the linear stability boundary':margin<0?'linearly stable':'linearly unstable';
 return{availability,hillExponent,delay,deficit,T,mode,initialResolved:deficit===0||1-deficit!==1,steady,boundary,margin,stability,trace,states:solution.rows,steps:solution.steps,rejected:solution.rejected};
}
export function krogh({capillaryRadius=3,tissueRadius=30,length=500,speed=500,consumption=.0005,Pa=100,Hb=15,nZ=41,nR=31}={}){
 finite(capillaryRadius,2,5,'capillary radius');finite(tissueRadius,10,60,'tissue radius');finite(length,100,1000,'capillary length');finite(speed,100,2000,'blood speed');finite(consumption,0,.003,'zero-order consumption');finite(Pa,20,150,'inlet oxygen pressure');finite(Hb,0,20,'hemoglobin concentration');integer(nZ,2,101,'axial samples');integer(nR,2,81,'radial samples');
 const D=2e-5,alphaT=3e-5,Rc=capillaryRadius*1e-4,Rt=tissueRadius*1e-4,ratio=tissueRadius/capillaryRadius,g=ratio*ratio-1,inlet=content({P:Pa,Hb}),criticalConsumption=speed*inlet.total.value/(100*g*length),flow=Math.PI*Rc*Rc*speed*1e-4,radii=lin(nR,capillaryRadius,tissueRadius),radialDrops=radii.map((_,i)=>{if(consumption===0||i===0)return magnitude(-Infinity);const delta=i/(nR-1)*(ratio-1),bracket=2*ratio*ratio*Math.log1p(delta)/delta-2-delta;return magnitude(Math.log(consumption)-Math.log(4*D*alphaT)+2*Math.log(Rc)+Math.log(delta)+Math.log(bracket));});
 const columns=lin(nZ,0,1).map(fraction=>{
  if(consumption===0||fraction===0)return{z:length*fraction,fraction,status:'computed',pressure:{value:Pa,log:Math.log(Pa),status:'positive'},remaining:inlet.total,loss:magnitude(-Infinity)};
  const terms=[Math.log(100),Math.log(consumption),Math.log(g),Math.log(length),Math.log(fraction),-Math.log(speed),-inlet.total.log],logRatio=sum(terms),uncertainty=64*Number.EPSILON*sum(terms.map(Math.abs)),loss=magnitude(inlet.total.log+logRatio);
  if(Math.abs(logRatio)<=uncertainty)return{z:length*fraction,fraction,status:'axial balance unresolved near zero',pressure:null,remaining:null,loss,logRatio,uncertainty};
  if(logRatio>0)return{z:length*fraction,fraction,status:'axial demand exceeds convective oxygen',pressure:null,remaining:null,loss,logRatio,uncertainty};
  const remaining=magnitude(inlet.total.log+Math.log(-Math.expm1(logRatio))),pressure=inverseContent(remaining.value,{Hb});return{z:length*fraction,fraction,status:'computed',pressure,remaining,loss,logRatio,uncertainty};
 });
 const field=columns.map(c=>radialDrops.map(drop=>c.pressure===null?null:c.pressure.value-drop.value)),finiteValues=field.flat().filter(x=>x!==null),minimum=Math.min(...finiteValues),boundaryTolerance=128*Number.EPSILON*Math.max(1,Pa,...radialDrops.map(q=>q.value)),negativeCells=finiteValues.filter(x=>x<0).length,nearZeroCells=finiteValues.filter(x=>Math.abs(x)<=boundaryTolerance).length,uncomputedColumns=columns.filter(x=>x.pressure===null).length;
 return{capillaryRadius,tissueRadius,length,speed,consumption,Pa,Hb,nZ,nR,D,alphaT,flow,inlet,criticalConsumption,radii,radialDrops,columns,field,minimum,maximum:Math.max(...finiteValues),boundaryTolerance,negativeCells,nearZeroCells,uncomputedColumns,status:uncomputedColumns?'convective supply incomplete':minimum < -boundaryTolerance?'negative zero-order tissue prediction':nearZeroCells?'near the zero-order tissue boundary':'positive zero-order tissue prediction'};
}
// Table IV in the UDel1997 translation of Bohr–Hasselbalch–Krogh1904.
// These are the authors' interpolated/corrected summaries, not80 raw assays.
export const HISTORICAL_PRESSURES=Object.freeze([5,10,15,20,25,30,35,40,45,50,60,70,80,90,100,150]);
export const HISTORICAL_CO2=Object.freeze([5,10,20,40,80]);
export const HISTORICAL_UPTAKE=Object.freeze([
 [11,28.5,51,67.5,76,82,86,89,91,92.5,95,97,98,98.5,99,100],
 [7.5,20.5,36,54,67,74.5,79.5,84,87.5,90,93.5,95.5,97,98,98.5,100],
 [5,14,27,41,54,63.5,71,77,82,86,90.5,94,96,97,98,100],
 [3,9,18.5,29.5,40,50,58,66.5,73,78.5,86,91,94.5,96,97,99.8],
 [1.5,4,8,14,22,31,40,49,56,62.5,73,80.5,87,91.5,95,99.5]
].map(Object.freeze));
export function historical({P=25,co2Index=3}={}){
 finite(P,5,150,'historical oxygen pressure');integer(co2Index,0,4,'tabulated CO2 index');let i=0;while(i<HISTORICAL_PRESSURES.length-2&&P>HISTORICAL_PRESSURES[i+1])i++;const f=(P-HISTORICAL_PRESSURES[i])/(HISTORICAL_PRESSURES[i+1]-HISTORICAL_PRESSURES[i]),values=HISTORICAL_UPTAKE.map(row=>row[i]+f*(row[i+1]-row[i]));
 return{P,co2Index,co2:HISTORICAL_CO2[co2Index],uptake:values[co2Index],values,differenceFromLowCO2:values[0]-values[co2Index],isTabulated:HISTORICAL_PRESSURES.includes(P),bracket:[HISTORICAL_PRESSURES[i],HISTORICAL_PRESSURES[i+1]]};
}
