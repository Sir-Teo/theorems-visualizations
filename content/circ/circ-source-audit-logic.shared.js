import {mos,bisectDec} from './ch04.shared.js';
import {mosSmallSignal} from './circ-source-audit-devices.shared.js';
export function cmosPoint(vin,V,vt=.7,k=.002,lam=.03){
 const vo=bisectDec(y=>mos(V-vin,V-y,vt,k,lam)-mos(vin,y,vt,k,lam),0,V);
 const n=mosSmallSignal(vin,vo,vt,k,lam),p=mosSmallSignal(V-vin,V-vo,vt,k,lam);
 return{vo,current:mos(vin,vo,vt,k,lam),gain:-(n.gm+p.gm)/(n.gds+p.gds)};
}
export const NAND_NETS={
 not:{name:'NOT',gates:[['A','A']],f:a=>!a},
 and:{name:'AND',gates:[['A','B'],[0,0]],f:(a,b)=>a&&b},
 or:{name:'OR',gates:[['A','A'],['B','B'],[0,1]],f:(a,b)=>a||b},
 nor:{name:'NOR',gates:[['A','A'],['B','B'],[0,1],[2,2]],f:(a,b)=>!(a||b)},
 xor:{name:'XOR',gates:[['A','B'],['A',0],['B',0],[1,2]],f:(a,b)=>a!==b},
};
export function evalNand(net,a,b,broken=false){const out=[],val=r=>r==='A'?a:r==='B'?b:out[r];net.gates.forEach((g,i)=>{out[i]=broken&&i===0?true:!(val(g[0])&&val(g[1]));});return out;}
export const latchF=(x,g,V=5)=>V/2*(1-Math.tanh(g*(2*x/V-1)));
export const latchDF=(x,g,V=5)=>-g/Math.cosh(g*(2*x/V-1))**2;
// Odd symmetry forces every equilibrium onto x+y=V; positive roots obey atanh(z)/z=g.
export function latchEquilibria(g,V=5){
 const center={x:V/2,y:V/2,stable:g<=1,critical:g===1};if(g<=1)return[center];
 const h=z=>z<.001?1+z*z/3+z**4/5+z**6/7:Math.atanh(z)/z;
 let lo=0,hi=1-Number.EPSILON;for(let j=0;j<90;j++){const m=(lo+hi)/2;if(h(m)<g)lo=m;else hi=m;}const z=(lo+hi)/2,x=V/2*(1-z);
 return[{x,y:V-x,stable:true,critical:false},center,{x:V-x,y:x,stable:true,critical:false}];
}
export function latchTrace(x,y,g,V=5,T=8,dt=.02){
 const F=(a,b)=>[latchF(b,g,V)-a,latchF(a,g,V)-b],steps=Math.ceil(T/dt),d=T/steps,tr=[[x,y]],ser1=[[0,x]],ser2=[[0,y]];
 for(let n=1;n<=steps;n++){const k1=F(x,y),k2=F(x+d*k1[0]/2,y+d*k1[1]/2),k3=F(x+d*k2[0]/2,y+d*k2[1]/2),k4=F(x+d*k3[0],y+d*k3[1]);x+=d/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);y+=d/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);if(n%3===0||n===steps){tr.push([x,y]);ser1.push([n*d,x]);ser2.push([n*d,y]);}}
 return{tr,ser1,ser2,end:[x,y],residual:Math.hypot(...F(x,y))};
}
