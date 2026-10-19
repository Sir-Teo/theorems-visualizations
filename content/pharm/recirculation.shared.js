import { rk4 } from './ch03.shared.js';
/** Instantaneous repeated meal emptying in an illustrative linear gut–blood–bile model. */
export function simulateRecirculation({ dose=100, volume=40, clearance=6, ka=1.2, biliary=.5, reabsorbed=.8, firstMeal=4, mealGap=6, duration=72, dt=.01 }={}) {
 const k=clearance/volume,N=Math.round(duration/dt),h=duration/N;
 let G=dose,A=0,GB=0,feces=0,el=0,nextMeal=firstMeal;
 const out={t:[],c:[],gb:[],g:[],meals:[]};
 for(let i=0;i<=N;i++){
  const t=i*h;
  if(t>=nextMeal-1e-9){G+=reabsorbed*GB;feces+=(1-reabsorbed)*GB;GB=0;out.meals.push(nextMeal);nextMeal+=mealGap;}
  if(i%5===0||i===N){out.t.push(t);out.c.push(A/volume);out.gb.push(GB);out.g.push(G);}
  if(i===N)break;
  const f=([g,a,gb,e])=>[-ka*g,ka*g-k*a,biliary*k*a,(1-biliary)*k*a];
  [G,A,GB,el]=rk4(f,[G,A,GB,el],t,h);
 }
 out.end={G,A,GB,feces,el};return out;
}
/** With continuing meals, A+G+fr·GB is conserved at meals and drains at CL·C·(1−fb·fr). */
export const recirculationTailAUC=(state,clearance,biliary,reabsorbed)=>(state.A+state.G+reabsorbed*state.GB)/(clearance*(1-biliary*reabsorbed));
