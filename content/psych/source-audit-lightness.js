// Authored finite illustrations. Gray encodings are not calibrated luminances.
const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const need=ok=>{if(!ok)throw new RangeError('Outside the declared illustration domain');};
export function cornsweet(a=.16,w=1.4,centre=5,half=.8,cutoff=.35,cover=true,shape='cusp'){
 need(finite(a,.04,.3)&&finite(w,.3,3)&&finite(centre,2.5,7.5)&&finite(half,0,2.5)&&finite(cutoff,0,1.5)&&typeof cover==='boolean'&&['cusp','step'].includes(shape));
 const N=501,dx=.02,xs=Array.from({length:N},(_,i)=>i*dx),L=xs.map(x=>{if(cover&&half>0&&Math.abs(x-centre)<=half)return .5;const s=x<5?1:-1;return shape==='step'?.5+s*a:.5+s*a*Math.max(0,1-Math.abs(x-5)/w)**2;}),increments=L.slice(1).map((x,i)=>x-L[i]),kept=increments.map(d=>Math.abs(d)/dx>=cutoff?d:0),raw=[L[0]];for(const d of kept)raw.push(raw.at(-1)+d);
 const shift=.5-(raw[0]+raw.at(-1))/2,P=raw.map(x=>x+shift),low=Math.min(...L,...P),high=Math.max(...L,...P),margin=Math.max(.08,(high-low)*.15);
 return{a,w,centre,half,cutoff,cover,shape,N,dx,xs,L,P,increments,kept,low,high,y:[low-margin,high+margin],physicalDifference:L[0]-L.at(-1),modelDifference:P[0]-P.at(-1),clipped:P.filter(x=>x<0||x>1).length};
}
export const REFLECTANCES=[.35,.9,.09,.6,.03,.18,.6,.35,.03,.9,.18,.09,.6,.35];
export function anchors(strength=10,weight=.9,centre=7){
 need(finite(strength,1,30)&&finite(weight,0,1)&&Number.isInteger(centre)&&finite(centre,3,11));
 const R=REFLECTANCES.slice(),lit=R.map((_,i)=>i>=centre-3&&i<centre+3),L=R.map((r,i)=>r*(lit[i]?strength:1)),global=Math.max(...L),inside=Math.max(...L.filter((_,i)=>lit[i])),outside=Math.max(...L.filter((_,i)=>!lit[i])),local=L.map((l,i)=>strength===1?global:lit[i]?inside:outside),localP=L.map((l,i)=>.9*l/local[i]),globalP=L.map(l=>.9*l/global),P=localP.map((x,i)=>weight*x+(1-weight)*globalP[i]),logError=P.map((p,i)=>Math.abs(Math.log10(p/R[i]))),low=Math.min(...R,...P),high=Math.max(...R,...P);
 return{strength,weight,centre,R,lit,L,global,inside,outside,local,localP,globalP,P,logError,meanAbsLogError:logError.reduce((s,x)=>s+x,0)/R.length,worstLogError:Math.max(...logError),x:[Math.log10(low)-.22,Math.log10(high)+.22],rangeL:Math.max(...L)/Math.min(...L),rangeP:Math.max(...P)/Math.min(...P)};
}
const E=[3.5,5,6.5,8,9.5,11];
export function adaptingUnit(t,tau,amplitude,frequency=.8){
 need(finite(t,0,20)&&finite(tau,.1,10)&&finite(amplitude,0,.45)&&finite(frequency,.1,3));
 const omega=2*Math.PI*frequency,z=omega*tau,decay=Math.exp(-t/tau),sn=Math.sin(omega*t),cs=Math.cos(omega*t),u=.5+amplitude*sn,a=.5*(1-decay)+amplitude*(sn-z*cs+z*decay)/(1+z*z),r=u-a;
 return{t,tau,amplitude,frequency,u,a,r,proxy:Math.min(1,2*Math.abs(r))};
}
export function fading(time=3.5,blur=1.4,motion=.03){
 need(finite(time,0,20)&&finite(blur,.05,3)&&finite(motion,0,.4));
 const amplitude=.45*motion/(motion+blur),taus=E.map(e=>6/(.6+.35*e)),units=taus.map(tau=>adaptingUnit(time,tau,amplitude)),curves=taus.map(tau=>Array.from({length:201},(_,i)=>[i/10,adaptingUnit(i/10,tau,amplitude).proxy]));
 return{time,blur,motion,amplitude,E:E.slice(),taus,units,curves};
}
