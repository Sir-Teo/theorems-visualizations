import{jacobiSym}from'./ch03.shared.js';
// Chosen capacities, flows and partitions; no species/drug fit is claimed.
export const PBPK_ORGANS=[['brain',1.4,.7,'brain','purple'],['liver',1.8,1.5,'liver','orange'],['muscle',28,1,'muscle','green'],['fat',14,.3,'fat','gold'],['rest',18,2.5,'rest of body','muted']];
export const PBPK_PARTITIONS={lip:[3,4,2,25,2],mod:[1,2,1,4,1],hyd:[.15,.8,.4,.2,.6]};
export function pbpkModel(kind,flowScale,capacity){
  const kp=PBPK_PARTITIONS[kind],W=[5,...PBPK_ORGANS.map((o,i)=>o[1]*kp[i])],Q=PBPK_ORGANS.map(o=>o[2]*flowScale),Qt=Q.reduce((a,b)=>a+b),G=Array.from({length:6},()=>Array(6).fill(0));G[0][0]=-Qt;
  for(let i=0;i<5;i++){G[0][i+1]=G[i+1][0]=Q[i];G[i+1][i+1]=-Q[i]-(i===1?capacity:0);}
  const M=G.map((row,i)=>row.map((g,j)=>g/Math.sqrt(W[i]*W[j]))),e=jacobiSym(M),modes=e.values.map((value,i)=>({rate:-value,u:e.vectors[i]})).sort((a,b)=>a.rate-b.rate),state=t=>{
    if(t===0)return{z:[20,0,0,0,0,0],el:0,total:100};
    const z=Array(6).fill(0);let el=0;
    for(const {rate,u}of modes){const a=100/Math.sqrt(5)*u[0],decay=Math.exp(-rate*t);for(let i=0;i<6;i++)z[i]+=a*u[i]*decay/Math.sqrt(W[i]);el+=capacity*a*u[2]/Math.sqrt(W[2])*(-Math.expm1(-rate*t))/rate;}
    return{z,el,total:z.reduce((sum,c,i)=>sum+c*W[i],0)};
  };
  return{kp,W,Q,Qt,G,M,modes,state};
}
export function pbpkTrace(model,end=3000){const out={t:[],z:[],el:[],tot:[]};for(let t=0;t<=end;t++){const s=model.state(t);out.t.push(t);out.z.push(s.z);out.el.push(s.el);out.tot.push(s.total);}return out;}
