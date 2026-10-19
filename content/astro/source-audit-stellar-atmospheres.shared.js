// Scoped LTE models; SI inputs and explicit finite neutral-state partition.
import{planckL,wienPeak,eLevel,EV,K_B,M_E,H_PL,CHI_H}from'./ch04.shared.js';
export const AUDIT_LINES=[[656.28,1,'Hα'],[486.13,.6,'Hβ'],[434.05,.4,'Hγ'],[410.17,.3,'Hδ'],[588.995,.9,'Na D'],[589.5924,.9,'']];
export function lineOpacity(nm,strength){return strength*AUDIT_LINES.reduce((s,[l,w])=>s+w*Math.exp(-.5*((nm-l)/1.1)**2),0);}
export function transferSlab(background,source,tau){if(tau<0||background<0||source<0)throw new RangeError('nonnegative LTE intensities and optical depth required');return background*Math.exp(-tau)+source*(-Math.expm1(-tau));}
export function slabSpectrum(row,nm,Ts,Tg,strength){const bs=planckL(nm*1e-9,Ts),bg=planckL(nm*1e-9,Tg),tau=lineOpacity(nm,strength);return row===0?bs:transferSlab(row===1?bs:0,bg,tau);}
export function visiblePlanckMaximum(T){return planckL(Math.min(700e-9,Math.max(380e-9,wienPeak(T))),T);}
export function neutralLevels(T,nmax=10,weighted=true){const weights=Array.from({length:nmax},(_,i)=>{const n=i+1;return(weighted?n*n:1)*Math.exp(-eLevel(n)*EV/(K_B*T));}),Z=weights.reduce((a,b)=>a+b,0);return{weights,Z,fractions:weights.map(w=>w/Z),ratio21:(weighted?4:1)*Math.exp(-eLevel(2)*EV/(K_B*T))};}
export function sahaGroundRatio(T,Pe){if(!(T>0&&Pe>0))throw new RangeError('positive temperature and electron pressure required');const kT=K_B*T;return Math.exp(1.5*Math.log(2*Math.PI*M_E*kT/(H_PL*H_PL))+Math.log(kT/Pe)-CHI_H*EV/kT);}
export function hydrogenLTE(T,Pe,nmax=10){const levels=neutralLevels(T,nmax),R0=sahaGroundRatio(T,Pe),R=R0/levels.Z,neutral=1/(1+R),ionized=R/(1+R),ne=Pe/(K_B*T),nH=ne/ionized;return{...levels,R0,R,neutral,ionized,ne,nH,spacingNm:1e9/Math.cbrt(nH),n2total:(levels.weights[1]||0)/(levels.Z+R0)};}
