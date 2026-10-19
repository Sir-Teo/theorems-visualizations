import {JANAF} from './pchem-source-audit-calorimetry.data.js';
export {JANAF};
const R=8.31446261815324;
export function speciesThermo(key,T){const rows=JANAF[key].rows;if(T<rows[0][0]-1e-9||T>1000+1e-9)throw Error('JANAF interpolation domain is 298.15–1000 K');let H=1000*rows[0][5],S=rows[0][2],Cp=rows[0][1];for(let i=1;i<rows.length;i++){const[a,c]=rows[i-1],[b,d]=rows[i],end=Math.min(T,b);if(end>a){const slope=(d-c)/(b-a),intercept=c-slope*a;H+=intercept*(end-a)+slope*(end*end-a*a)/2;S+=intercept*Math.log(end/a)+slope*(end-a);Cp=c+slope*(end-a);}if(T<=b)break;}return{H,S,Cp,G:H-T*S};}
export function reactionThermo(stoich,T){return stoich.reduce((a,[k,n])=>{const s=speciesThermo(k,T);for(const x of['H','S','Cp','G'])a[x]+=n*s[x];return a;},{H:0,S:0,Cp:0,G:0});}
const simpson=(f,end,n=960)=>{const h=end/n;let s=f(0)+f(end);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(i*h);return s*h/3;};
export function debyeState(theta,T){if(T<=0)return{S:0,C:0};const x=theta/T,up=Math.min(x,60),I=simpson(t=>t===0?0:t**3/Math.expm1(t),up),J=simpson(t=>t===0?0:t**4*Math.exp(-t)/(-Math.expm1(-t))**2,up);return{S:R*(12*I/x**3-3*Math.log(-Math.expm1(-x))),C:R*9*J/x**3};}
export const ARGON={Tm:83.78,Tb:87.30,Hf:29.588*39.948,Hv:161.14*39.948,CpL:44.6,CpG:2.5*R,S298:154.846,Ppath:1.013};
export function argonEntropy(theta,extra,T,pressureCorrection=true){const{Tm,Tb,Hf,Hv,CpL,CpG,Ppath}=ARGON,t=Math.min(T,Tm),sol=debyeState(theta,t).S+extra/7*(t/Tm)**7,fus=T>Tm?Hf/Tm:0,liq=T>Tm?CpL*Math.log(Math.min(T,Tb)/Tm):0,vap=T>Tb?Hv/Tb:0,gas=T>Tb?CpG*Math.log(T/Tb)+(pressureCorrection?R*Math.log(Ppath):0):0;return{sol,fus,liq,vap,gas,total:sol+fus+liq+vap+gas};}
export function argonCp(theta,extra,T){return T<=ARGON.Tm?debyeState(theta,T).C+extra*(T/ARGON.Tm)**7:T<=ARGON.Tb?ARGON.CpL:ARGON.CpG;}
