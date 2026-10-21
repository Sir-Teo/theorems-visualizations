// Explicit authored illustrations; material and historical observations are stated separately.
const valid=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const need=ok=>{if(!ok)throw new RangeError('Outside the declared illustration domain');};
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function mortarCell(environment,age,ratio,depth){
 need(['dry','damp','sea'].includes(environment)&&valid(age,.005,2000)&&valid(ratio,0,5)&&valid(depth,0,.3));
 const capacity=Math.min(1,ratio/2.5),moist={dry:.12,damp:1,sea:1}[environment],hydraulic=capacity*(-Math.expm1(-age*moist/.3)),front={dry:1,damp:.35,sea:0}[environment]*.02*Math.sqrt(age),carbon=front===0?0:1/(1+Math.exp((depth-front)/Math.max(.004,.08*front))),converted=hydraulic+(1-hydraulic)*carbon;
 return{capacity,hydraulic,front,carbon,converted};
}
export function mortar(environment='sea',age=.5,ratio=2){
 const depths=Array.from({length:60},(_,i)=>Math.min(i+.5,59.5-i)*.01),plain=depths.map(x=>mortarCell(environment,age,0,x).converted),mixed=depths.map(x=>mortarCell(environment,age,ratio,x).converted),xs=Array.from({length:201},(_,i)=>Math.log10(.005)+i/200*(Math.log10(2000)-Math.log10(.005))),curves=[0,ratio].map(r=>xs.map(x=>[x,mean(depths.map(d=>mortarCell(environment,Math.max(.005,Math.min(2000,10**x)),r,d).converted))]));
 return{environment,age,ratio,depths,plain,mixed,meanPlain:mean(plain),meanMixed:mean(mixed),front:mortarCell(environment,age,ratio,0).front,hydraulic:mortarCell(environment,age,ratio,0).hydraulic,curves};
}
const H1=.15;
export function clockHead(tau,p){need(valid(tau,0,1)&&valid(p,0,1));if(tau===0)return 1;if(tau===1)return H1;if(p===.25)return 1-(1-H1)*tau;const n=2*p+.5,B=-Math.expm1(n*Math.log(H1));return Math.exp(Math.log1p(-tau*B)/n);}
export function clockTime(head,p){need(valid(head,H1,1)&&valid(p,0,1));const n=2*p+.5;return Math.expm1(n*Math.log(head))/Math.expm1(n*Math.log(H1));}
export function waterClock(p=0,hours=4,constant=false){
 need(valid(p,0,1)&&valid(hours,0,12)&&typeof constant==='boolean');
 const tau=hours/12,head=constant?1:clockHead(tau,p),linearHours=constant?hours:12*(1-head)/(1-H1),error=60*(linearHours-hours),curve=Array.from({length:241},(_,i)=>{const t=i/240,h=clockHead(t,p);return[12*t,constant?0:720*((1-h)/(1-H1)-t)];}),worst=curve.reduce((a,b)=>Math.abs(b[1])>Math.abs(a[1])?b:a),ticks=Array.from({length:13},(_,k)=>({hour:k,equal:1-(k/12)*(1-H1),true:clockHead(k/12,p)})),M=Math.max(10,...curve.map(x=>Math.abs(x[1])),Math.abs(error));
 return{p,hours,constant,tau,head,linearHours,error,curve,worst,ticks,range:[-M*1.18,M*1.18],firstDrop:clockHead(0,p)-clockHead(1/12,p),lastDrop:clockHead(11/12,p)-clockHead(1,p)};
}
export const AQUEDUCT={spring:300,city:268,length:30,x1:12.5,x2:19.5,rho:1000,g:9.81,f:.02};
export function routeTerrain(x,depth){const bump=q=>11*Math.sin(.8*q)+7*Math.sin(.31*q+2);return 300-1.25*x+bump(x)-bump(0)-(bump(30)-bump(0))*x/30-depth*Math.exp(-(((x-16)/2.2)**2));}
export function aqueduct(gradient=.8,depth=60,demand=100,diameter=.3,pipes=4,wallRatio=.05,mode='arcade'){
 need(valid(gradient,.1,2)&&valid(depth,20,110)&&valid(demand,20,600)&&valid(diameter,.1,.4)&&Number.isInteger(pipes)&&valid(pipes,1,9)&&valid(wallRatio,.01,.1)&&['arcade','siphon'].includes(mode));
 const a=AQUEDUCT,headIn=a.spring-gradient*a.x1,headOut=a.spring-gradient*a.x2,available=headIn-headOut,pipe=[[a.x1,headIn-2]],count=140;
 for(let i=0;i<=count;i++){const x=a.x1+(a.x2-a.x1)*i/count;pipe.push([x,Math.min(routeTerrain(x,depth)+1.5,a.spring-gradient*x-2)]);}pipe.push([a.x2,headOut-2]);
 const lengths=[0];for(let i=1;i<pipe.length;i++)lengths.push(lengths.at(-1)+Math.hypot(1000*(pipe[i][0]-pipe[i-1][0]),pipe[i][1]-pipe[i-1][1]));
 const length=lengths.at(-1),speed=Math.sqrt(2*a.g*available*diameter/(a.f*length)),capacity=1000*pipes*Math.PI*diameter**2/4*speed,requestedSpeed=(demand/1000/pipes)/(Math.PI*diameter**2/4),requestedLoss=a.f*(length/diameter)*requestedSpeed**2/(2*a.g),grade=pipe.map(([x],i)=>[x,headIn-available*lengths[i]/length]),pressure=pipe.map(([x,z],i)=>[x,grade[i][1]-z]),maxPressureHead=Math.max(...pressure.map(p=>p[1])),minPressureHead=Math.min(...pressure.map(p=>p[1])),nominalStress=a.rho*a.g*maxPressureHead/wallRatio,arrival=a.spring-gradient*a.length,terrain=Array.from({length:301},(_,i)=>[i/10,routeTerrain(i/10,depth)]),segments=[];let tunnel=0,arcade=0,maxArcade=0;
 for(let i=0;i<300;i++){const x=i/10,x1=(i+1)/10,m=(x+x1)/2;if(mode==='siphon'&&m>=a.x1&&m<=a.x2)continue;const z=a.spring-gradient*m,t=routeTerrain(m,depth),kind=t>z+.3?'tunnel':t<z-.3?'arcade':'ground';if(kind==='tunnel')tunnel+=.1;if(kind==='arcade'){arcade+=.1;maxArcade=Math.max(maxArcade,z-t);}segments.push({points:[[x,a.spring-gradient*x],[x1,a.spring-gradient*x1]],kind});}
 const ys=[...terrain.map(p=>p[1]),...pipe.map(p=>p[1]),a.spring,a.city,arrival],low=Math.min(...ys),high=Math.max(...ys),pad=.12*(high-low)+4;
 return{gradient,depth,demand,diameter,pipes,wallRatio,mode,headIn,headOut,available,pipe,lengths,length,speed,capacity,requestedSpeed,requestedLoss,grade,pressure,maxPressureHead,minPressureHead,nominalStress,arrival,terrain,segments,tunnel,arcade,maxArcade,y:[low-pad,high+pad],pressureY:[-Math.max(2,.1*maxPressureHead),Math.max(5,1.18*maxPressureHead)],cityHighEnough:arrival>=a.city,demandSupported:demand<=capacity};
}
