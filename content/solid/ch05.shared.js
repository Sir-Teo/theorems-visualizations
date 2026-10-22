// SOLID5 pure models. All dimensions and loads are chosen consistent units.
function finite(x,label){if(!Number.isFinite(x))throw new RangeError(label+' must be finite');return x;}
function positive(x,label){finite(x,label);if(x<=0)throw new RangeError(label+' must be positive');return x;}
export function circular({torque=1,radius=1,ratio=0,modulus=2,length=2}={}){
 finite(torque,'torque');positive(radius,'radius');positive(modulus,'modulus');positive(length,'length');if(!Number.isFinite(ratio)||ratio<0||ratio>=1)throw new RangeError('inner/outer ratio must be in [0,1)');
 const wall=(1-ratio)*(1+ratio),four=wall*(1+ratio*ratio),area=Math.PI*radius**2*wall,J=Math.PI/2*radius**4*four;
 const twist=torque*(length/(modulus*J)),stress=torque*(radius/J),energy=.5*torque*twist;
 return {area,J,twist,stress,energy,rate:torque/(modulus*J),twistUnderflow:torque!==0&&twist===0,stressUnderflow:torque!==0&&stress===0,energyUnderflow:torque!==0&&energy===0};
}
// Keep the smaller original factor last: either torque or selected radius can be subnormal.
export function radialStress(torque,radius,fraction){
 finite(torque,'torque');positive(radius,'radius');if(!Number.isFinite(fraction)||fraction<0||fraction>1)throw new RangeError('selected radius fraction must be in [0,1]');
 const J=Math.PI/2*radius**4,c=radius/J,value=Math.abs(torque)<=fraction?torque*(c*fraction):fraction*(c*torque);return value===0?0:value;
}
export function segmented({torque=1,radius=1,length=2,modulus=2,contrast=2,split=.5}={}){
 if(!Number.isFinite(split)||split<=0||split>=1)throw new RangeError('split');positive(contrast,'contrast');const q=circular({torque,radius,length,modulus}),coefficient=length/(modulus*q.J),totalCoefficient=coefficient*(split+(1-split)/contrast);
 return {...q,twist:torque*totalCoefficient,twistUnderflow:torque!==0&&torque*totalCoefficient===0,energy:.5*torque*(torque*totalCoefficient),energyUnderflow:torque!==0&&.5*torque*(torque*totalCoefficient)===0,at:z=>torque*(coefficient*(Math.min(z,split)+Math.max(0,z-split)/contrast))};
}
export function transmission(power,speed,allowable=1){
 finite(power,'power');finite(speed,'speed');positive(allowable,'allowable');if(speed===0)return{torque:null,radius:null,status:power===0?'underdetermined':'incompatible'};
 const torque=power/speed,radius=power===0?0:Math.cbrt(Math.abs(power))/Math.cbrt(Math.abs(speed))*Math.cbrt(2/(Math.PI*allowable));
 if(!Number.isFinite(torque))return{torque:null,radius,status:'outside numeric range'};
 return{torque,radius,status:'finite',torqueUnderflow:power!==0&&torque===0,torqueRoundingLimited:power!==0&&Math.abs(torque)<1e-300,power:torque*speed};
}
export function hollow(ratio,mode='fixed outer radius'){
 if(!Number.isFinite(ratio)||ratio<0||ratio>=1)throw new RangeError('ratio');const wall=(1-ratio)*(1+ratio),j=wall*(1+ratio*ratio);
 if(mode==='fixed outer radius')return{radius:1,inner:ratio,areaRatio:wall,JRatio:j,capacityRatio:j,efficiency:1+ratio*ratio};
 if(mode!=='fixed material area')throw new RangeError('mode');return{radius:1/Math.sqrt(wall),inner:ratio/Math.sqrt(wall),areaRatio:1,JRatio:(1+ratio*ratio)/wall,capacityRatio:(1+ratio*ratio)/Math.sqrt(wall),efficiency:(1+ratio*ratio)/wall};
}
export function pureShear(tau,angle){finite(tau,'stress');finite(angle,'angle');return{normal:tau*Math.sin(2*angle),shear:tau*Math.cos(2*angle),principal:[Math.abs(tau),-Math.abs(tau)],tensionAngle:tau>0?Math.PI/4:tau<0?-Math.PI/4:null};}
export function closedCell({width=3,height=2,thickness=.08,topFactor=.5,torque=1,modulus=2}={}){
 for(const[k,x]of Object.entries({width,height,thickness,topFactor,modulus}))positive(x,k);finite(torque,'torque');const lengths=[width,height,width,height],walls=[thickness*topFactor,thickness,thickness,thickness],area=width*height,integral=lengths.reduce((s,l,i)=>s+l/walls[i],0),J=4*area*area/integral,q=torque/(2*area),rate=torque*(integral/(4*area*area*modulus));
 return{area,J,q,rate,lengths,walls,stress:walls.map(t=>torque*(1/(2*area*t))),thinness:Math.max(...walls)/Math.min(width,height),compatibility:torque*(integral/(2*area)),circulation:torque*(integral/(2*area)),qUnderflow:torque!==0&&q===0,roundingLimited:torque!==0&&Math.abs(torque)<1e-300};
}
export function ellipse({a=1.5,b=.7,torque=1,modulus=2}={}){
 positive(a,'a');positive(b,'b');positive(modulus,'modulus');finite(torque,'torque');const sum=a*a+b*b,J=Math.PI*a**3*b**3/sum,rate=torque/(modulus*J),C=torque/(Math.PI*a*b),warpCoefficient=a===b?0:torque*((b*b-a*a)/(modulus*Math.PI*a**3*b**3)),stressMax=Math.abs(torque)*(2/(Math.PI*a*b*Math.min(a,b)));
 return{a,b,J,rate,C,stressMax,warpCoefficient,phi:(x,y)=>torque*((1-(x/a)**2-(y/b)**2)/(Math.PI*a*b)),stress:(x,y)=>[torque*(-2*y/(Math.PI*a*b**3)),torque*(2*x/(Math.PI*a**3*b))],warp:(x,y)=>warpCoefficient*x*y,laplacian:torque*(-2*(a*a+b*b)/(Math.PI*a**3*b**3)),boundary:t=>[a*Math.cos(t),b*Math.sin(t)]};
}
export function membrane({a=1.5,b=.7,pressure=.2,tension=2}={}){
 positive(a,'a');positive(b,'b');finite(pressure,'pressure');positive(tension,'tension');const C=pressure*((a*a*b*b)/(2*tension*(a*a+b*b))),volume=pressure*(Math.PI*a**3*b**3/(4*tension*(a*a+b*b))),slope=Math.abs(pressure)*(a*a*b*b/(tension*(a*a+b*b)*Math.min(a,b)));return{C,volume,slope,laplacian:-pressure/tension,height:(x,y)=>C*(1-(x/a)**2-(y/b)**2),gradient:(x,y)=>[-2*C*x/(a*a),-2*C*y/(b*b)]};
}
export function slitTube({radius=1,thickness=.08,torque=1,modulus=2}={}){
 positive(radius,'radius');positive(thickness,'thickness');positive(modulus,'modulus');finite(torque,'torque');if(thickness>=radius)throw new RangeError('thinness domain');const perimeter=2*Math.PI*radius,closedJ=2*Math.PI*radius**3*thickness,openJ=perimeter*thickness**3/3,outer=radius+thickness/2,inner=radius-thickness/2,exactJ=Math.PI/2*(outer-inner)*(outer+inner)*(outer*outer+inner*inner);
 return{perimeter,closedJ,openJ,exactJ,ratio:3*(radius/thickness)**2,closedRate:torque/(modulus*closedJ),openRate:torque/(modulus*openJ),closedStress:torque/(2*Math.PI*radius*radius*thickness),openStress:torque*(thickness/openJ),relativeClosedError:(thickness/radius)**2/4};
}
export function corner({angle=1.5*Math.PI,amplitude=1,cutoff=.05}={}){
 if(!Number.isFinite(angle)||angle<=Math.PI||angle>=2*Math.PI)throw new RangeError('reentrant angle');finite(amplitude,'amplitude');if(!Number.isFinite(cutoff)||cutoff<=0||cutoff>1)throw new RangeError('cutoff');const nu=Math.PI/angle;
 const stress=r=>Math.abs(amplitude)*(nu*Math.exp((nu-1)*Math.log(r)));return{nu,exponent:nu-1,stress,cutoffStress:stress(cutoff),ratio:Math.exp((nu-1)*Math.log(cutoff)),phi:(r,t)=>amplitude*r**nu*Math.sin(nu*t)};
}
export function safe(x){return x===null?'unavailable':!Number.isFinite(x)?'outside numeric range':x===0?'0':Math.abs(x)<.0001||Math.abs(x)>=1e5?x.toExponential(5):x.toFixed(5).replace('-','−');}
