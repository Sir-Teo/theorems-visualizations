// Explicit finite comparisons; historical sources establish mechanisms, not fitted parameters.
const valid=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const need=x=>{if(!x)throw new RangeError('Outside the declared illustration domain');};
const rad=Math.PI/180,g=9.81;
export const DISK_LIMIT=16/27;
export function windDisk(a=1/3,R=9,U=8,wind=55,face=20){
 need(valid(a,0,.4)&&valid(R,4,16)&&valid(U,2,20)&&valid(wind,-180,180)&&valid(face,-180,180));
 let psi=wind-face;if(psi>180)psi-=360;if(psi< -180)psi+=360;
 const factor=Math.abs(psi)>=90?0:Math.cos(psi*rad)**3,area=Math.PI*R*R,rho=1.225,cp=4*a*(1-a)**2,available=.5*rho*area*U**3,disk=U*(1-a),wake=U*(1-2*a),massFlow=rho*area*disk,thrust=massFlow*(U-wake),aligned=thrust*disk,power=aligned*factor,cpCurve=Array.from({length:201},(_,i)=>{const x=.4*i/200;return[x,4*x*(1-x)**2];}),powerCurves=[cp*factor,DISK_LIMIT].map(c=>Array.from({length:201},(_,i)=>{const x=i/10;return[x,.5*rho*area*x**3*c/1000];}));
 return{a,R,U,wind,face,psi,factor,area,rho,cp,available,disk,wake,massFlow,thrust,aligned,power,upstreamArea:area*(1-a),wakeArea:area*(1-a)/(1-2*a),cpCurve,powerCurves,yMax:Math.max(10,powerCurves[1].at(-1)[1])*1.18};
}
const smooth=s=>s*s*(3-2*s);
export function stampStroke(lugs=4,rpm=12,duty=.4,height=.4,mass=50,progress=.3){
 need(Number.isInteger(lugs)&&valid(lugs,1,8)&&valid(rpm,2,40)&&valid(duty,.1,.8)&&valid(height,.1,1)&&valid(mass,10,100)&&valid(progress,0,1));
 const T=60/(lugs*rpm),liftTime=duty*T,fallTime=Math.sqrt(2*height/g),impactTime=liftTime+fallTime,end=1.08*Math.max(T,impactTime),time=progress*end,
 at=t=>{if(t>=impactTime)return{y:0,v:0,phase:'after isolated impact'};if(t<=liftTime){const s=t/liftTime;return{y:height*smooth(s),v:6*height*s*(1-s)/liftTime,phase:'prescribed lift'};}const q=t-liftTime,y=height-g*q*q/2;return y>0?{y,v:-g*q,phase:'isolated gravity fall'}:{y:0,v:0,phase:'after isolated impact'};},current=at(time),times=[...new Set([...Array.from({length:401},(_,i)=>i/400*end),liftTime,T,impactTime])].sort((a,b)=>a-b),headCurve=times.map(t=>[t,at(t).y]),liftCurve=Array.from({length:121},(_,i)=>[liftTime*i/120,height*smooth(i/120)]),minGuideForce=mass*(g-6*height/(liftTime*liftTime)),maxGuideForce=mass*(g+6*height/(liftTime*liftTime)),hitBeforeNext=impactTime<=T,oneSided=minGuideForce>=0,energy=mass*g*height,impactSpeed=Math.sqrt(2*g*height);
 return{lugs,rpm,duty,height,mass,progress,T,liftTime,fallTime,impactTime,end,time,current,headCurve,liftCurve,minGuideForce,maxGuideForce,hitBeforeNext,oneSided,cycleCompatible:hitBeforeNext&&oneSided,energy,impactSpeed,nominalPower:energy/T};
}
export function lockChange(L=30,W=6,H=2.5,aperture=.6,progress=.5,direction='up'){
 need(valid(L,15,60)&&valid(W,3,9)&&valid(H,1,4)&&valid(aperture,.1,1.5)&&valid(progress,0,1)&&['up','down'].includes(direction));
 const area=L*W,volume=area*H,Cd=.6,duration=2*area*Math.sqrt(H)/(Cd*aperture*Math.sqrt(2*g)),time=progress*duration,remaining=H*(1-progress)**2,level=direction==='up'?H-remaining:remaining,transfer=volume*progress*(2-progress),flow=Cd*aperture*Math.sqrt(2*g*H)*(1-progress),upperIn=direction==='up'?transfer:0,lowerOut=direction==='down'?transfer:0,storageChange=upperIn-lowerOut,upperReady=(direction==='up'&&progress===1)||(direction==='down'&&progress===0),lowerReady=(direction==='up'&&progress===0)||(direction==='down'&&progress===1),levelCurve=Array.from({length:201},(_,i)=>{const p=i/200;return[p,direction==='up'?p*(2-p):(1-p)**2];}),transferCurve=Array.from({length:201},(_,i)=>{const p=i/200;return[p,p*(2-p)];});
 return{L,W,H,aperture,progress,direction,area,volume,Cd,duration,time,remaining,level,transfer,flow,upperIn,lowerOut,storageChange,upperReady,lowerReady,levelCurve,transferCurve};
}
