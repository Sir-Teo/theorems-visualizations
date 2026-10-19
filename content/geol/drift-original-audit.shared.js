// Full original Bullard1965 Table1 row2; dimensions are historical source values.
import{rotMat,rotApply,angDist,D,R_EARTH}from'./ch03.shared.js';
export const BULLARD_FIT=Object.freeze({pole:[-30.1,42.9],angle:57.1,rmsDegrees:.95,rmsKm:90,contourFathoms:500});
// Deliberately constructed reference pairs, NOT fossil sites/independent geological observations.
export const DRIFT_MARKERS=[[-40,-8],[-43,-22],[-57,-37]].map((a,i)=>({a,b:rotApply(rotMat(BULLARD_FIT.pole,BULLARD_FIT.angle),a),color:['green','gold','pink'][i]}));
export function driftDiagnostics(pole,percent){const angle=BULLARD_FIT.angle*percent/100,M=rotMat(pole,angle),distances=DRIFT_MARKERS.map(p=>angDist(rotApply(M,p.a),p.b)*D*R_EARTH);return{angle,pole:[...pole],percent,M,distances,mean:distances.reduce((a,b)=>a+b,0)/distances.length};}
export const HYP_LEVELS=Object.freeze({weight:.3,continent:.7,ocean:-4.3,sc:.5,so:1});
export function heightMoments(){const p=HYP_LEVELS,w=p.weight,mean=w*p.continent+(1-w)*p.ocean,variance=w*(p.sc*p.sc+(p.continent-mean)**2)+(1-w)*(p.so*p.so+(p.ocean-mean)**2);return{mean,sd:Math.sqrt(variance)};}
const normal=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
export function chosenHeightDensity(x,mode='two'){const p=HYP_LEVELS;if(mode==='one'){const m=heightMoments();return normal(x,m.mean,m.sd);}return p.weight*normal(x,p.continent,p.sc)+(1-p.weight)*normal(x,p.ocean,p.so);}
// Modern chosen two-crust Airy model, NOT Wegener's100km sal/sima model.
// Continental surface e above sea level; floor z may be exposed, with no negative water column.
export function driftColumns({tc=33,rc=2.8,to=7,ro=2.9,rm=3.3,e=.84,rw=1.03,equal=false}={}){
 if(equal){to=tc;ro=rc;}
 const A=(rm-rc)*tc-(rm-ro)*to-rm*e,wet=A>=0,d=wet?A/(rm-rw):0,z=wet?-d:-A/rm;
 const H=Math.max(tc-e,to-z)+5,continentMass=rc*tc+rm*(H+e-tc),otherMass=rw*d+ro*to+rm*(H+z-to);
 return{tc,rc,to,ro,rm,e,rw,equal,wet,d,z,H,continentMass,otherMass,residual:otherMass-continentMass};
}
