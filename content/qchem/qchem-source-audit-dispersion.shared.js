import{KB_MEV}from'./ch04.shared.js';
// Rationalized zero-point shift avoids subtracting two nearly equal numbers.
export function drudeModeShift(k){if(Math.abs(k)>=1)return NaN;const t=Math.sqrt(1-k*k),s=Math.sqrt(2+2*t);return-2*k*k/((1+t)*(s+2));}
export const drudeEnergy=(R,a,w)=>{const k=2*a/R**3;return k>=1?NaN:.5*w*(drudeModeShift(k)+2*drudeModeShift(k/2));};
export function drudeCovariance(k){if(!(k>=0&&k<1))return null;const symmetric=1/(2*Math.sqrt(1-k)),antisymmetric=1/(2*Math.sqrt(1+k));return{symmetric,antisymmetric,variance:(symmetric+antisymmetric)/2,covariance:(symmetric-antisymmetric)/2,correlation:(symmetric-antisymmetric)/(symmetric+antisymmetric)};}
export const PAIR_EPS=119.8*KB_MEV,PAIR_SIG=3.405,PAIR_RM=2**(1/6)*PAIR_SIG,PAIR_NA=.602214076;
export function pairPotential(f,s,r){const x=PAIR_RM/r;if(f==='lj')return PAIR_EPS*(x**12-2*x**6);if(f==='nm')return PAIR_EPS/(s-6)*(6*x**s-s*x**6);return PAIR_EPS/(1-6/s)*(6/s*Math.exp(s*(1-r/PAIR_RM))-x**6);}
export const pairC6=(f,s)=>f==='lj'?2*PAIR_EPS*PAIR_RM**6:f==='nm'?PAIR_EPS*s*PAIR_RM**6/(s-6):PAIR_EPS*PAIR_RM**6/(1-6/s);
export function exp6Core(s){let lo=1e-14,hi=7/s;for(let i=0;i<80;i++){const x=(lo+hi)/2;if(s*(1-x)+7*Math.log(x)>0)hi=x;else lo=x;}return PAIR_RM*(lo+hi)/2;}
// Full infinite-range classical Mayer integral. Exp-6 is explicitly hard-core modified.
export function pairB2(f,s,T,{n=4096}={}){const rc=f==='exp'?exp6Core(s):0,kT=KB_MEV*T;let sum=0;for(let i=0;i<n;i++){const t=i/n;if(i===0){if(rc)sum+=-Math.expm1(-pairPotential(f,s,rc)/kT)*rc*rc*PAIR_RM;continue;}const r=rc+PAIR_RM*t/(1-t),val=-Math.expm1(-pairPotential(f,s,r)/kT)*r*r*PAIR_RM/(1-t)**2;sum+=(i%2?4:2)*val;}return 2*Math.PI*PAIR_NA*(rc**3/3+sum/(3*n));}
export function pairBoyle(f,s){let lo=60,hi=1000;if(pairB2(f,s,lo)*pairB2(f,s,hi)>0)return null;for(let i=0;i<32;i++){const m=(lo+hi)/2;if(pairB2(f,s,m)>0)hi=m;else lo=m;}return(lo+hi)/2;}
