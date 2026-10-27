// Authored, bounded teaching mechanisms. Historical objects do not calibrate these parameters.
import {R,rat,add,sub,mul,div,numeric,bounded,integer} from '../phil/ch05.shared.js';
const B=bounded,I=integer,ONE=R(1),ZERO=R(0),cmp=(a,b)=>{const d=a[0]*b[1]-b[0]*a[1];return d>0n?1:d<0n?-1:0;};
const pack=x=>Array.isArray(x)?(x.length===2&&typeof x[0]==='bigint'?numeric(x):x.map(pack)):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,pack(v)])):x;
const grid=(n,f)=>Array.from({length:n+1},(_,i)=>f(i/n));
export function steamDevice({ambient=101.325,condensed=10,steam=200,area=.2,stroke=1}={}){
 B(ambient,50,120);B(condensed,0,150);B(steam,50,1000);B(area,.01,1);B(stroke,.1,3);
 const difference=ambient-condensed,pressureHead=difference*1000/(1000*9.81),dischargeHead=(steam-ambient)*1000/(1000*9.81),force=difference*area;
 return{ambient,condensed,steam,area,stroke,pressureHead,dischargeHead,suctionPossible:difference>0,dischargePossible:steam>ambient,force,work:force*stroke,displacedVolume:area*stroke};
}
function thermal(volume,mass,deltaT,reheat){return{latent:volume*.6*2257,reheat:mass*.46*deltaT*reheat};}
export function newcomen({area=.4,stroke=1.5,condensed=12,armRatio=1.5,pumpArea=.01,head=40,cylinderMass=300,deltaT=60}={}){
 B(area,.05,1);B(stroke,.2,3);B(condensed,0,100);B(armRatio,.5,3);B(pumpArea,.002,.05);B(head,0,150);B(cylinderMass,20,1000);B(deltaT,0,80);
 const force=(101.325-condensed)*area,pumpForce=force/armRatio,pumpLoad=1000*9.81*head*pumpArea/1000,pumpStroke=armRatio*stroke,volume=pumpArea*pumpStroke,work=force*stroke,heat=thermal(area*stroke,cylinderMass,deltaT,1),input=heat.latent+heat.reheat;
 return{area,stroke,condensed,armRatio,pumpArea,head,cylinderMass,deltaT,force,pumpForce,pumpLoad,pumpStroke,pumpVolume:volume,work,pumpWork:pumpLoad*pumpStroke,forceMargin:pumpForce-pumpLoad,loadFeasible:pumpForce>=pumpLoad,heat,input,indicatedFraction:work/input};
}
export function coke({iron=1000,carbonBudget=500,cokeCarbon=.85,charcoalCarbon=.75,cokePrice=.2,charcoalPrice=.5,charcoalYield=.25,woodYield=10000}={}){
 B(iron,100,2000);B(carbonBudget,0,2000);B(cokeCarbon,.5,1);B(charcoalCarbon,.5,1);B(cokePrice,0,2);B(charcoalPrice,0,2);B(charcoalYield,.1,.4);B(woodYield,1000,100000);
 // Rounded molar masses are declared constants. Fe2O3 + 3CO -> 2Fe + 3CO2.
 const Fe=55.845,O=15.999,C=12.011,moles=iron/(2*Fe),ore=moles*(2*Fe+3*O),co=moles*3*(C+O),co2=moles*3*(C+2*O),carbonInCO=moles*3*C,cokeMass=carbonBudget/cokeCarbon,charcoalMass=carbonBudget/charcoalCarbon,woodMass=charcoalMass/charcoalYield;
 return{iron,carbonBudget,cokeCarbon,charcoalCarbon,cokePrice,charcoalPrice,charcoalYield,woodYield,ore,co,co2,oxygenRemoved:ore-iron,carbonInCO,cokeMass,charcoalMass,cokeCost:cokeMass*cokePrice,charcoalCost:charcoalMass*charcoalPrice,woodMass,hypotheticalArea:woodMass/woodYield,carbonBudgetMeetsSinglePassCO:carbonBudget>=carbonInCO,massResidual:ore+co-iron-co2};
}
export function boring({length=1.5,diameter=.12,load=1000,modulus=180}={}){
 B(length,.5,3);B(diameter,.05,.3);B(load,0,3000);B(modulus,50,250);
 const inertia=Math.PI*diameter**4/64,EI=modulus*1e9*inertia,cantilever=load*length**3/(3*EI)*1000,supported=load*length**3/(48*EI)*1000;
 const curves=grid(40,u=>{const x=length*u,a=Math.min(x,length-x);return{x,cantilever:load*x*x*(3*length-x)/(6*EI)*1000,supported:load*a*(3*length*length-4*a*a)/(48*EI)*1000};});
 return{length,diameter,load,modulus,inertia,cantilever,supported,curves};
}
export function condenser({volume=.6,cylinderMass=300,deltaT=60,reheatFraction=.08,condensed=12}={}){
 B(volume,.05,3);B(cylinderMass,20,1000);B(deltaT,0,80);B(reheatFraction,0,1);B(condensed,0,100);
 const inside=thermal(volume,cylinderMass,deltaT,1),separate=thermal(volume,cylinderMass,deltaT,reheatFraction),work=(101.325-condensed)*volume,insideInput=inside.latent+inside.reheat,separateInput=separate.latent+separate.reheat;
 const chosenSaving=inside.reheat*(1-reheatFraction)/insideInput;
 return{volume,cylinderMass,deltaT,reheatFraction,condensed,inside,separate,work,insideInput,separateInput,chosenSaving,savingPositive:deltaT>0&&reheatFraction<1,savingUnderflow:deltaT>0&&reheatFraction<1&&chosenSaving===0,insideFraction:work/insideInput,separateFraction:work/separateInput};
}
export function sunPlanet(carrier=1.2,oscillation=.18){B(carrier,0,4*Math.PI);B(oscillation,0,.3);const planet=oscillation*Math.sin(carrier),sun=2*carrier-planet;return{carrier,oscillation,planet,sun,centre:[2*Math.cos(carrier),2*Math.sin(carrier)],sunTurns:sun/(2*Math.PI),carrierTurns:carrier/(2*Math.PI),constraintResidual:sun+planet-2*carrier};}
function engineAt(gain,lag,load,t){
 if(t<1e-5){let term=[-load*t,0],speed=term[0],throttle=0;for(let n=2;n<=16;n++){term=[(-term[0]+term[1])*t/n,(-gain*term[0]-term[1])*t/(lag*n)];speed+=term[0];throttle+=term[1];}return{time:t,speed,throttle};}
 const a=-(1+1/lag)/2,d=(1-1/lag)**2/4-gain/lag,e=Math.exp(a*t),steady=[-load/(1+gain),gain*load/(1+gain)],v=steady.map(x=>-x);let C,S;
 if(d===0){C=1;S=t;}else if(d>0){const r=Math.sqrt(d);C=Math.cosh(r*t);S=Math.sinh(r*t)/r;}else{const r=Math.sqrt(-d);C=Math.cos(r*t);S=Math.sin(r*t)/r;}
 return{time:t,speed:steady[0]+e*(C*v[0]+S*((-1-a)*v[0]+v[1])),throttle:steady[1]+e*(C*v[1]+S*((-gain/lag)*v[0]+(-1/lag-a)*v[1]))};
}
export function governor({gain=1.5,lag=.8,load=.3,time=4}={}){
 B(gain,0,5);B(lag,.1,4);B(load,0,.5);B(time,0,20);const current=engineAt(gain,lag,load,time),trace=grid(80,u=>engineAt(gain,lag,load,20*u));
 return{gain,lag,load,time,current,trace,steadySpeed:-load/(1+gain),steadyThrottle:gain*load/(1+gain),discriminant:(1-1/lag)**2/4-gain/lag};
}
export function governorCone(speed=1){
 B(speed,0,2);const omega2=mul(R(speed),R(speed)),gravity=R(.2);
 if(cmp(omega2,gravity)<0)return{speed,length:1,gravity:.2,status:'no-conical-equilibrium',cosine:null,radius:null,height:null,angle:null};
 const cosine=div(gravity,omega2),radius=Math.sqrt(numeric(sub(ONE,mul(cosine,cosine)))),height=numeric(cosine);
 return{speed,length:1,gravity:.2,status:'conical-branch',cosine:height,radius,height,angle:Math.atan2(radius,height)};
}
export function parallelLink(theta=.4){
 B(theta,-.55,.55);const dc=2*Math.sin(theta/2)**2,s=Math.sin(theta),D=1+2*dc+s,r=Math.sqrt((1-2*dc-s)/D),A=1-3*dc;
 // Rationalizing the midpoint x cancels the low-order terms analytically rather than subtracting two almost equal coordinates.
 const x=4*dc*dc*(2*dc+s)/(D*(A+(1+s)*r));
 const y=1.5*s+.5*(s*dc*dc+2*s*dc+2*s+2*dc**3+3*dc*dc+2*dc)/(D*(1+(1+dc)*r));
 const P=[-2*dc,1+2*s],M=[x,y],Q=[2*x-P[0],2*y-P[1]];
 return{theta,fixed:[[-2,1],[2,-1]],P,Q,M,deviation:x,deviationSign:Math.sign(theta),deviationUnderflow:theta!==0&&x===0,beamOnlyDeviation:P[0],arms:[Math.hypot(P[0]+2,P[1]-1),Math.hypot(Q[0]-2,Q[1]+1)],coupler:Math.hypot(Q[0]-P[0],Q[1]-P[1])};
}
const exprel=x=>Math.abs(x)<1e-6?1+x/2+x*x/6+x**3/24+x**4/120:Math.expm1(x)/x;
export function indicator({supply=200,back=20,swept=1,clearance=.1,cutoff=.3,exponent=1.1}={}){
 B(supply,50,800);B(back,0,900);B(swept,.05,3);B(clearance,.02,.3);B(cutoff,0,1);B(exponent,.7,1.5);
 const vmin=clearance*swept,vcut=(clearance+cutoff)*swept,vmax=(clearance+1)*swept,logRatio=Math.log(vmax/vcut),admission=numeric(mul(mul(R(supply),R(cutoff)),R(swept))),expansion=supply*vcut*logRatio*exprel((1-exponent)*logRatio),exhaust=numeric(mul(R(back),R(swept))),work=admission+expansion-exhaust;
 const outward=[...grid(20,u=>[vmin+(vcut-vmin)*u,supply]),...grid(60,u=>{const volume=vcut*Math.exp(logRatio*u);return[volume,supply*Math.exp(-exponent*logRatio*u)];}).slice(1)];
 return{supply,back,swept,clearance,cutoff,exponent,vmin,vcut,vmax,admission,expansion,exhaust,work,meanPressure:work/swept,endPressure:supply*Math.exp(-exponent*logRatio),positiveWork:work>0,outward,loop:[...outward,[vmax,back],[vmin,back],[vmin,supply]]};
}
export function highPressure({difference=200,power=10,frequency=1,radius=.4,thickness=.015}={}){
 B(difference,20,1000);B(power,1,50);B(frequency,.2,3);B(radius,.1,1);B(thickness,.001,.1);
 const volume=power/(difference*frequency),thinHoop=difference/1000*radius/thickness,outer=radius+thickness,lameHoop=difference/1000*(outer*outer+radius*radius)/(thickness*(2*radius+thickness));
 return{difference,power,frequency,radius,thickness,volume,work:power/frequency,thinHoop,lameHoop,thicknessRatio:thickness/radius,thinRegime:thickness/radius<=.05};
}
export function carnot({hot=600,cold=300,heat=100,utilization=.6}={}){
 B(hot,200,1500);B(cold,100,1200);B(heat,0,1000);B(utilization,0,1);if(hot<cold)return{hot,cold,heat,utilization,status:'reversed-reservoirs',bound:null,efficiency:null,work:null,rejected:null,entropy:null,workPositive:false,entropyPositive:false};
 const difference=sub(R(hot),R(cold)),bound=div(difference,R(hot)),efficiency=mul(R(utilization),bound),work=mul(R(heat),efficiency),rejected=sub(R(heat),work),entropy=div(mul(mul(R(heat),sub(ONE,R(utilization))),difference),mul(R(hot),R(cold)));
 return pack({hot,cold,heat,utilization,status:hot===cold?'equal-reservoirs':'heat-engine',bound,efficiency,work,rejected,entropy,workPositive:work[0]>0n,entropyPositive:entropy[0]>0n});
}
export function puddling({carbonFraction=.035,carbonRate=.6,ironRate=.03,time=4}={}){
 B(carbonFraction,0,.06);B(carbonRate,0,1);B(ironRate,0,1);B(time,0,10);
 const at=t=>{const carbon=1000*carbonFraction*Math.exp(-carbonRate*t),iron=1000*(1-carbonFraction)*Math.exp(-ironRate*t);return{time:t,carbon,iron,total:carbon+iron,fraction:carbon/(carbon+iron)};};
 return{carbonFraction,carbonRate,ironRate,time,current:at(time),trace:grid(60,u=>at(10*u)),concentrationTrend:carbonFraction===0||ironRate===carbonRate?'constant':ironRate>carbonRate?'rising':'falling'};
}
export function rolling({thickness=20,reduction=.5,width=100,length=1000}={}){
 B(thickness,5,50);B(reduction,0,.9);B(width,20,200);B(length,100,2000);const finalThickness=thickness*(1-reduction),finalLength=length/(1-reduction);
 return{thickness,reduction,width,length,finalThickness,finalLength,initialVolume:thickness*width*length,finalVolume:finalThickness*width*finalLength,logStrain:-Math.log1p(-reduction)};
}
export function bessemer({carbonFraction=.035,removed=.8,phosphorusFraction=.005,chosenHeat=10,chosenLoss=40}={}){
 B(carbonFraction,0,.06);B(removed,0,1);B(phosphorusFraction,0,.02);B(chosenHeat,0,30);B(chosenLoss,0,1000);
 const initialCarbon=1000*carbonFraction,initialPhosphorus=1000*phosphorusFraction,iron=1000-initialCarbon-initialPhosphorus,carbonRemoved=initialCarbon*removed,carbon=initialCarbon-carbonRemoved,total=1000-carbonRemoved,heat=carbonRemoved*chosenHeat;
 return{carbonFraction,removed,phosphorusFraction,chosenHeat,chosenLoss,initialCarbon,initialPhosphorus,iron,carbonRemoved,carbon,total,finalCarbonFraction:carbon/total,finalPhosphorusFraction:initialPhosphorus/total,heat,netHeat:heat-chosenLoss};
}
export function threads({lead=4,driver=20,driven=40,starts=1,turns=3,amplitude=.02,wavelength=50,slope=.001}={}){
 B(lead,1,8);I(driver,12,80);I(driven,12,80);I(starts,1,4);B(turns,0,10);B(amplitude,0,.1);B(wavelength,5,100);B(slope,-.005,.005);
 const ratio=div(R(driver),R(driven)),advance=mul(R(lead),ratio),pitch=div(advance,R(starts)),ideal=mul(R(turns),advance),x=numeric(ideal),error=amplitude*Math.sin(2*Math.PI*x/wavelength)+slope*x;
 return pack({lead,driver,driven,starts,turns,amplitude,wavelength,slope,ratio,advance,pitch,leadScrewTurns:mul(R(turns),ratio),ideal,error,actual:x+error});
}
const positive=x=>cmp(x,ZERO)>0?x:ZERO;
function uniformCDF(x,a,b){
 if(a[0]===0n&&b[0]===0n)return cmp(x,ZERO)<0?ZERO:ONE;
 if(a[0]===0n||b[0]===0n){const w=a[0]===0n?b:a,t=div(add(x,w),mul(R(2),w));return cmp(t,ZERO)<0?ZERO:cmp(t,ONE)>0?ONE:t;}
 const sq=x=>mul(positive(x),positive(x)),p=add(add(x,a),b),q=sub(add(x,a),b),r=add(sub(x,a),b),s=sub(sub(x,a),b);
 return div(add(sub(sub(sq(p),sq(q)),sq(r)),sq(s)),mul(R(8),mul(a,b)));
}
const uniforms=(()=>{let state=0x71c03a9d;return Array.from({length:288},()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return R((state+.5)/2**32);});})();
export function interchangeability({clearance=.04,holeWidth=.015,shaftWidth=.015,bias=0,minimum=.02,maximum=.06,count=64}={}){
 B(clearance,-.1,.2);B(holeWidth,0,.1);B(shaftWidth,0,.1);B(bias,-.1,.1);B(minimum,-.1,.2);B(maximum,minimum,.3);I(count,0,144);
 const c=add(R(clearance),R(bias)),h=R(holeWidth),s=R(shaftWidth),lo=sub(R(minimum),c),hi=sub(R(maximum),c),atom=holeWidth===0&&shaftWidth===0,probability=atom?(cmp(lo,ZERO)<=0&&cmp(hi,ZERO)>=0?ONE:ZERO):sub(uniformCDF(hi,h,s),uniformCDF(lo,h,s));
 const rows=Array.from({length:count},(_,i)=>{const hole=mul(sub(mul(R(2),uniforms[2*i]),ONE),h),shaft=mul(sub(mul(R(2),uniforms[2*i+1]),ONE),s),gap=add(c,sub(hole,shaft)),fit=cmp(gap,R(minimum))>=0&&cmp(gap,R(maximum))<=0;return{hole,shaft,gap,fit};}),passed=rows.filter(x=>x.fit).length;
 return pack({clearance,holeWidth,shaftWidth,bias,minimum,maximum,count,centre:c,support:[sub(sub(c,h),s),add(add(c,h),s)],atom,probability,probabilityPositive:probability[0]>0n,probabilityBelowOne:cmp(probability,ONE)<0,rows,passed,batchFraction:count?rat(BigInt(passed),BigInt(count)):null});
}
