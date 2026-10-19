// Source-audited idealized models. Energies in k_B kelvin unless explicitly SI.
import {canonical} from './canonical-source-audit.shared.js';
export const K=1.380649e-23,H=6.62607015e-34,A=1.66053906660e-27;
export const wavelength=(m,T,f=1)=>f*H/Math.sqrt(2*Math.PI*m*A*K*T);
export const gasEntropy=(m,T,P,f=1)=>Math.log(K*T/(P*wavelength(m,T,f)**3))+2.5;
export const degeneracyTemperature=(m,P,f=1)=>(P*(f*H)**3/(K*(2*Math.PI*m*A*K)**1.5))**.4;
export function ratchet(T,e,w){const rf=Math.exp(-(e+w)/T),rb=Math.exp(-e),drift=rf-rb,stall=e*(T-1);return{rf,rb,drift,stall,eta:drift>0&&w>0?w/(e+w):null,entropyProduction:drift*Math.log(rf/rb)};}
export const MOLECULES={h2e:{B:60.853,we:4401.213,wx:121.336},h2n:{B:60.853,we:4401.213,wx:121.336},n2:{B:1.998241,we:2358.57,wx:14.324}};
export const C2=1.438777;
export function rotationalLevels(key,T,parity=null,cutoff=55){const g=MOLECULES[key],out=[];for(let J=0;J<2000;J++){if(parity===null||(J%2===0)===(parity==='even'))out.push({E:C2*g.B*J*(J+1),g:(2*J+1)*(key==='h2e'?(J%2?3:1):key==='n2'?(J%2?3:6):1)});if(J>4&&C2*g.B*J*(J+1)/T>cutoff)break;}return out;}
export function vibrationalLevels(key){const{we,wx}=MOLECULES[key],out=[];for(let n=0;n+.5<we/(2*wx);n++)out.push({E:C2*(we*n-wx*(n*n+n)),g:1});return out;}
export function molecularParts(key,T,cutoff=55){const b=1/T;const rot=key==='h2n'?.25*canonical(rotationalLevels(key,T,'even',cutoff),b).C+.75*canonical(rotationalLevels(key,T,'odd',cutoff),b).C:canonical(rotationalLevels(key,T,null,cutoff),b).C,vib=canonical(vibrationalLevels(key),b).C;return{tr:1.5,rot,vib,tot:1.5+rot+vib};}
export const microTemperature=(N,q)=>{if(N<2||q<1)throw Error('Requires N≥2 and q≥1');return 1/Math.log1p((N-1)/q);};
export const canonicalTemperature=(N,q)=>1/Math.log1p(N/q);
export const temperatureDifference=(N,q)=>microTemperature(N,q)/canonicalTemperature(N,q)-1;
export const temperatureAsymptote=u=>1/((1+u)*Math.log1p(1/u));
export function unitDirection(x,z,fallback=[.6,.8]){const n=Math.hypot(x,z);return n>0?[x/n,z/n]:[...fallback];}
export function thermalSpin(T,nx,nz){const[x,z]=unitDirection(nx,nz),r=Math.tanh(.5/T),p=(1+r)/2,q=(1-r)/2;return{rho:[[.5*(1-r*z),-.5*r*x],[-.5*r*x,.5*(1+r*z)]],r,purity:(1+r*r)/2,S:-p*Math.log(p)-(q>0?q*Math.log(q):0)};}
