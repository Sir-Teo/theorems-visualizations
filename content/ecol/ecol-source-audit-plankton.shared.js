import { hwStep } from './ch04.shared.js';
// Huisman & Weissing1999, p410: original matrices have resources as rows;
// these arrays are transposed so species index comes first.
export const PLANKTON_K=[[.39,.22,.27,.30,.34],[.34,.39,.22,.24,.30],[.30,.34,.39,.22,.22],[.24,.30,.34,.39,.20],[.23,.27,.30,.34,.39],[.41,.16,.07,.28,.40],[.20,.15,.11,.12,.50],[.45,.05,.05,.13,.26],[.14,.38,.38,.27,.12],[.15,.29,.41,.33,.29],[.38,.37,.24,.04,.09],[.28,.31,.25,.41,.16]];
export const PLANKTON_Q=[[.04,.08,.10,.05,.07],[.04,.08,.10,.03,.09],[.07,.08,.10,.03,.07],[.04,.10,.10,.03,.07],[.04,.08,.14,.03,.07],[.22,.14,.22,.09,.05],[.10,.22,.24,.07,.24],[.08,.04,.12,.06,.05],[.02,.18,.03,.03,.08],[.17,.06,.24,.03,.10],[.25,.20,.17,.11,.02],[.03,.04,.01,.05,.04]];
export const planktonParameters=n=>({K:PLANKTON_K.slice(0,n),Q:PLANKTON_Q.slice(0,n),S:[6,10,14,4,9],D:.25,m:.25,r:1});
export const PLANKTON_INTRO=[[0,[0,1,2,3,4]],[1000,[5,6,7]],[3000,[8,9]],[5000,[10,11]]];
export function runPlankton(n,T,{dt=.05,recordEvery=5,perturb=0}={}){const P=planktonParameters(n),st={N:Array(n).fill(0),R:P.S.slice(),t:0},rec=[],times=[],resources=[],rate=Math.round(recordEvery/dt),steps=Math.round(T/dt);let intro=0;for(let step=0;step<=steps;step++){const t=step*dt;while(intro<PLANKTON_INTRO.length&&t>=PLANKTON_INTRO[intro][0]-1e-8){const[at,ids]=PLANKTON_INTRO[intro++];for(const i of ids)if(i<n)st.N[i]=at===0?.1+(i+1)/100+(i===0?perturb:0):.1;}if(step%rate===0){rec.push([...st.N]);resources.push([...st.R]);times.push(t);}if(step<steps)hwStep(P,st,dt);}return{N:rec,R:resources,t:times,final:{N:[...st.N],R:[...st.R]}};}
export function positiveLogRange(rows){const a=rows.flat().filter(x=>x>0);return[Math.min(...a)/1.5,Math.max(...a)*1.5];}
