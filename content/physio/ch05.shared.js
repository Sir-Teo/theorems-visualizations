// Chapter-local respiration models. Units and approximations are declared by each item.
export const CO2_K=310*760/273;
const inRange=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const need=(ok,msg)=>{if(!ok)throw new RangeError(msg);};
export function periodicBreath({time=0,period=4,amplitude=5,compliance=.1,resistance=2,baseline=3}={}){
 need(inRange(time,0,100)&&inRange(period,2,10)&&inRange(amplitude,0,8)&&inRange(compliance,.03,.2)&&inRange(resistance,.2,10)&&inRange(baseline,2,5),'Declared breathing domain');
 const omega=2*Math.PI/period,lag=omega*resistance*compliance,den=1+lag*lag,phase=omega*time,drive=amplitude*Math.sin(phase);
 const displacement=compliance*amplitude*(Math.sin(phase)-lag*Math.cos(phase))/den;
 const flow=compliance*amplitude*omega*(Math.cos(phase)+lag*Math.sin(phase))/den;
 return {time,omega,drive,displacement,volume:baseline+displacement,flow,alveolarGauge:-resistance*flow,elastic:displacement/compliance,phaseLag:Math.atan(lag),volumeAmplitude:compliance*amplitude/Math.hypot(1,lag)};
}
export function sealedGas(volume=3,baseline=3,ambient=1033){
 need(inRange(volume,1,6)&&inRange(baseline,2,5)&&inRange(ambient,500,1200),'Positive sealed volume/absolute pressure');
 return{volume,absolutePressure:ambient*baseline/volume,gauge:ambient*(baseline/volume-1),product:ambient*baseline};
}
export function complianceModel(u=.5,{elastic=10,surface=12,hysteresis=1,capacity=4,branch=1}={}){
 need(inRange(u,0,1)&&inRange(elastic,10,25)&&inRange(surface,0,20)&&inRange(hysteresis,0,2)&&inRange(capacity,1,6)&&[1,-1].includes(branch),'Positive-slope illustrative constitutive family');
 const derivative=elastic+2*surface*u+4*branch*hysteresis*(1-2*u),pressure=elastic*u+surface*u*u+4*branch*hysteresis*u*(1-u);
 return{u,pressure,salinePressure:elastic*u,volume:capacity*u,derivative,compliance:capacity/derivative,salineCompliance:capacity/elastic,loopArea:4*hysteresis*capacity/3};
}
export function bubblePair(fraction=.35,exponent=0){
 need(inRange(fraction,.1,.9)&&inRange(exponent,0,1.5),'Positive sphere volumes and constitutive exponent');
 const ratios=[2*fraction,2*(1-fraction)],radii=ratios.map(x=>Math.cbrt(x)),tensions=radii.map(r=>Math.pow(r,2*exponent)),pressures=radii.map((r,i)=>tensions[i]/r),difference=pressures[0]-pressures[1];
 return{fraction,exponent,radii,tensions,pressures,difference,flowToFirst:-difference,stability:exponent>.5?'stable':exponent<.5?'unstable':'neutral',equalSlope:(2*exponent-1)*2/3};
}
export function spirogram(t=1,{vitalCapacity=4,tau=.5,residual=1.2}={}){
 need(inRange(t,0,10)&&inRange(vitalCapacity,1,6)&&inRange(tau,.15,3)&&inRange(residual,.5,3),'Illustrative exponential expiration');
 const fraction=-Math.expm1(-t/tau),ratio=-Math.expm1(-1/tau);
 return{expired:vitalCapacity*fraction,remainingAboveResidual:vitalCapacity*Math.exp(-t/tau),flow:vitalCapacity*Math.exp(-t/tau)/tau,FEV1:vitalCapacity*ratio,ratio,FVC:vitalCapacity,TLC:residual+vitalCapacity,residual};
}
export function ventilation(tidal=.5,dead=.15,frequency=12,co2production=200){
 need(inRange(tidal,.1,2)&&inRange(dead,0,.4)&&inRange(frequency,.5,150)&&inRange(co2production,50,500),'Ventilation and CO2 production domain');
 const minute=tidal*frequency,alveolar=Math.max(tidal-dead,0)*frequency;
 return{tidal,dead,frequency,minute,alveolar,deadVentilation:minute-alveolar,steadyCO2:alveolar>0?CO2_K/1000*co2production/alveolar:null};
}
export function alveolarGas({inspiredOxygen=.21,co2=40,quotient=.8,barometric=760,water=47}={}){
 need(inRange(inspiredOxygen,.1,1)&&inRange(co2,0,100)&&inRange(quotient,.5,1.2)&&inRange(barometric,300,800)&&inRange(water,0,60)&&water<barometric,'Dry gas mixture and positive respiratory quotient');
 const dry=barometric-water,inspired=inspiredOxygen*dry,full=inspired-co2*(inspiredOxygen+(1-inspiredOxygen)/quotient),approximate=inspired-co2/quotient,exhaledNitrogen=(1-inspiredOxygen)*(dry-co2+co2/quotient);
 const valid=full>=0&&full<=dry&&exhaledNitrogen>=0;
 return{dry,inspired,full,approximate,correction:co2*inspiredOxygen*(1/quotient-1),valid,exhaledNitrogen};
}
export function diffusingCapacity(area=1,thickness=1,permeability=1,gradient=60,base=30){
 need(inRange(area,.1,2)&&inRange(thickness,.25,5)&&inRange(permeability,.1,2)&&inRange(gradient,-100,100)&&inRange(base,1,100),'Chosen linear diffusing capacity model');
 const relative=area*permeability/thickness,capacity=base*relative;
 return{relative,capacity,gradient,rate:capacity*gradient};
}
export function capillaryTransfer(t=1,{alveolar=100,venous=40,capacity=1,conductance=3,transit=1}={}){
 need(inRange(t,0,5)&&inRange(alveolar,0,200)&&inRange(venous,0,200)&&inRange(capacity,.1,30)&&inRange(conductance,.1,10)&&inRange(transit,.1,3),'Constant blood capacitance illustration');
 const rate=conductance/capacity,remaining=Math.exp(-rate*t),fraction=-Math.expm1(-rate*transit);
 return{pressure:venous+(alveolar-venous)*(-Math.expm1(-rate*t)),fraction,transitPressure:venous+(alveolar-venous)*fraction,timeConstant:1/rate,initialGradient:alveolar-venous};
}
export function oxygenContent(pressure,{bindingCapacity=20,p50=26,hill=2.5,dissolved=.003}={}){
 need(Number.isFinite(pressure)&&pressure>=0&&pressure<=1000&&inRange(bindingCapacity,0,25)&&inRange(p50,10,50)&&inRange(hill,1,4)&&inRange(dissolved,.001,.01),'Chosen positive Hill content law');
 const power=(pressure/p50)**hill,saturation=power/(1+power);
 let bound=hill===1?pressure*(bindingCapacity/p50)/(1+pressure/p50):bindingCapacity*saturation;
 if(bound===0&&pressure>0&&bindingCapacity>0)bound=Math.exp(Math.log(bindingCapacity)+hill*(Math.log(pressure)-Math.log(p50))-Math.log1p(power));
 const dissolvedAmount=dissolved*pressure;
 return{pressure,saturation,bound,dissolved:dissolvedAmount,total:bound+dissolvedAmount,boundUnderflow:bound===0&&pressure>0&&bindingCapacity>0,dissolvedUnderflow:dissolvedAmount===0&&pressure>0};
}
const bisect=(fn,lo,hi,n=90)=>{let fl=fn(lo),fh=fn(hi);need(Number.isFinite(fl)&&Number.isFinite(fh)&&fl<=0&&fh>=0,'Root must have a finite monotone bracket');if(fl===0)return lo;if(fh===0)return hi;for(let i=0;i<n;i++){const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;if(fn(mid)>0)hi=mid;else lo=mid;}return lo+(hi-lo)/2;};
export function invertContent(content,law={}){
 const lo=oxygenContent(0,law).total,hi=oxygenContent(1000,law).total;need(Number.isFinite(content)&&content>=lo&&content<=hi,'Content must lie in the chosen positive inverse domain');
 let upper=Math.min(1000,content/(law.dissolved??.003));
 if(oxygenContent(upper,law).total<content)upper=Math.min(1000,2*upper);
 return bisect(p=>oxygenContent(p,law).total-content,0,upper);
}
export function gasUnit(ratio=1,{dry=713,inspiredOxygen=.21,inspiredCO2=0,venousOxygen=40,venousCO2=46,co2Slope=.5,law={}}={}){
 need((Number.isFinite(ratio)&&ratio>=0||ratio===Infinity)&&inRange(dry,300,800)&&inRange(inspiredOxygen,.1,1)&&inRange(inspiredCO2,0,.02)&&inspiredOxygen+inspiredCO2<=1&&inRange(venousOxygen,10,80)&&inRange(venousCO2,20,80)&&inRange(co2Slope,.1,1),'Positive V/Q mass balance');
 const inspiredPressure=dry*inspiredOxygen,co2Inspired=dry*inspiredCO2,venousContent=oxygenContent(venousOxygen,law).total;
 if(ratio===Infinity)return{ratio,oxygen:inspiredPressure,co2:co2Inspired,oxygenContent:oxygenContent(inspiredPressure,law).total,oxygenFluxPerPerfusion:null,co2FluxPerPerfusion:null};
 // ratio uses STPD gas volume / blood volume. 100 converts L/L to mL/dL.
 const scale=100*ratio,oxygen=bisect(p=>oxygenContent(p,law).total-venousContent-scale*(inspiredOxygen-p/dry),Math.min(venousOxygen,inspiredPressure),Math.max(venousOxygen,inspiredPressure));
 const co2=(co2Slope*venousCO2+scale*inspiredCO2)/(co2Slope+scale/dry),content=oxygenContent(oxygen,law).total;
 return{ratio,oxygen,co2,oxygenContent:content,oxygenFluxPerPerfusion:content-venousContent,co2FluxPerPerfusion:co2Slope*(venousCO2-co2),oxygenBalanceResidual:content-venousContent-scale*(inspiredOxygen-oxygen/dry)};
}
export function mixUnits(units,weights,law={}){
 need(Array.isArray(units)&&units.length>0&&units.length===weights.length&&weights.every(x=>Number.isFinite(x)&&x>=0)&&weights.some(x=>x>0),'Nonnegative perfusion weights with positive total');
 const total=weights.reduce((x,y)=>x+y,0),content=units.reduce((s,u,i)=>s+weights[i]/total*u.oxygenContent,0),pressureAverage=units.reduce((s,u,i)=>s+weights[i]/total*u.oxygen,0);
 return{content,oxygen:invertContent(content,law),pressureAverage,co2:units.reduce((s,u,i)=>s+weights[i]/total*u.co2,0)};
}
export function westZone(height=15,{arterialBase=32,venousBase=12,alveolar=0,gradient=1,resistance=1}={}){
 need(inRange(height,0,30)&&inRange(arterialBase,15,50)&&inRange(venousBase,0,14)&&inRange(alveolar,-5,15)&&inRange(gradient,.5,1.2)&&inRange(resistance,.5,5),'Local hydrostatic collapsible resistor');
 const arterial=arterialBase-gradient*height,venous=venousBase-gradient*height,downstream=Math.max(alveolar,venous),flow=Math.max(arterial-downstream,0)/resistance;
 return{height,arterial,venous,alveolar,flow,zone:arterial<=alveolar?1:venous<=alveolar?2:3,downstream};
}
export function co2Steady({production=200,inspired=0,baseline=2,gain=.3,threshold=35}={}){
 need(inRange(production,50,500)&&inRange(inspired,0,20)&&inRange(baseline,0,10)&&inRange(gain,0,2)&&inRange(threshold,20,50),'Chosen static CO2 controller');
 const metabolic=CO2_K/1000*production;
 if(baseline===0&&gain===0)return{equilibrium:null,reason:'No positive attainable ventilation'};
 const passive=baseline>0?inspired+metabolic/baseline:Infinity;
 if(passive<=threshold||gain===0)return Number.isFinite(passive)?{equilibrium:passive,ventilation:baseline,active:false,residual:0}:{equilibrium:null,reason:'Positive equilibrium exceeds finite numeric range'};
 const d=threshold-inspired,B=baseline+gain*d,C=metabolic-baseline*d;
 // Active y=P-threshold solves gain*y²+B*y-C=0. The division avoids cancellation.
 const root=Math.hypot(B,2*Math.sqrt(gain)*Math.sqrt(C)),y=2*C/(B+root),P=threshold+y,V=baseline+gain*y;
 return{equilibrium:P,ventilation:V,active:true,residual:(P-inspired)*V-metabolic};
}
export function hillVentilation(state,n=3){
 need(Number.isFinite(state)&&state>=0&&state<=10000&&Number.isInteger(n)&&n>=2&&n<=6,'Nonnegative state and integer Hill exponent2–6');
 const power=state**n;return power/(1+power);
}
export function delayEquilibrium({state=.8,n=3}={}){
 need(inRange(state,.25,2)&&Number.isInteger(n)&&n>=2&&n<=6,'Equilibrium state .25–2 and integer exponent2–6');
 const F=hillVentilation(state,n),production=state*F,a=F,b=n*F*(1-F),power=state**n,margin=n-1-power,uncertain=Math.abs(margin)<=32*Number.EPSILON*Math.max(n-1,power);
 const frequency=margin>0&&!uncertain?Math.sqrt((b-a)*(b+a)):null,criticalDelay=frequency?Math.acos(-a/b)/frequency:null;
 return{state,n,ventilation:F,production,a,b,margin,numericBoundary:uncertain,criticalDelay,frequency,active:true};
}
export function delayTrace({state=.8,n=3,delay=5,horizon=60,step=.01,perturbation=.05}={}){
 need(inRange(delay,0,12)&&inRange(horizon,10,80)&&inRange(step,.0001,.02)&&inRange(perturbation,-.2,.2),'Finite method-of-steps domain');
 const eq=delayEquilibrium({state,n}),dt=delay>0?Math.min(step,delay*step/.02):step;
 if(dt<.00001||horizon/dt>24000)return{unresolved:true,reason:'Positive delay needs a finer history grid than the 24000-step budget',equilibrium:eq};
 const count=Math.ceil(horizon/dt),h=horizon/count,history=eq.state*(1+perturbation),xs=[history],times=[0],vs=[];
 const past=t=>{if(t<=0)return history;const j=Math.min(xs.length-2,Math.floor(t/h));if(j<0)return history;const u=(t-j*h)/h;return xs[j]+u*(xs[j+1]-xs[j]);};
 const rhs=(t,x)=>eq.production-x*hillVentilation(delay===0?x:past(t-delay),n);
 for(let i=0;i<count;i++){
  const t=i*h,x=xs[i],k1=rhs(t,x),k2=rhs(t+h/2,x+h*k1/2),k3=rhs(t+h/2,x+h*k2/2),k4=rhs(t+h,x+h*k3),next=x+h*(k1+2*k2+2*k3+k4)/6;
  if(!Number.isFinite(next)||next<=0)return{unresolved:true,reason:'Numerical positivity/finite-state failure; reduce step',equilibrium:eq};
  vs.push(hillVentilation(delay===0?x:past(t-delay),n));xs.push(next);times.push((i+1)*h);
 }
 vs.push(hillVentilation(delay===0?xs.at(-1):past(horizon-delay),n));
 return{unresolved:false,equilibrium:eq,step:h,times,states:xs,ventilations:vs};
}
export function henryPlasma(pressure=100,gas='oxygen'){
 need(inRange(pressure,0,200)&&['oxygen','carbon dioxide'].includes(gas),'Listed plasma coefficients and pressure0–200mmHg');
 const alpha=gas==='oxygen'?1.4e-6:3.3e-5;
 return{gas,pressure,alpha,molar:alpha*pressure,micromolar:(alpha*1e6)*pressure,molarUnderflow:alpha*pressure===0&&pressure>0,listedRatio:3.3e-5/1.4e-6};
}
export function btpsToStpd(volume=4,barometric=760,water=47){
 need(inRange(volume,0,20)&&inRange(barometric,300,800)&&inRange(water,0,60)&&water<barometric,'BTPS gas volume at rounded310K, STPD at273K');
 const conversion=273*(barometric-water)/(310*760);
 return{volume,conversion,standard:volume*conversion,K:310*760/273};
}
