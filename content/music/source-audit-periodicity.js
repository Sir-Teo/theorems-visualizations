import{weRenderAudio,WE_C4}from'./source-audit-wolf-equal.js';
// Fokker's 1969 article, hosted transcription, section "Periodicity blocks":
// one of the displayed two-dimensional determinant pairs for each offered n.
export const PERIODICITY_PRESETS=Object.freeze([
 {n:12,u:[0,-3],v:[4,-1],m3:19,m5:28},
 {n:19,u:[4,-1],v:[-1,5],m3:30,m5:44},
 {n:31,u:[4,-1],v:[3,7],m3:49,m5:72},
 {n:41,u:[8,1],v:[-1,5],m3:65,m5:95},
 {n:53,u:[8,1],v:[-5,6],m3:84,m5:123},
].map(x=>Object.freeze({...x,u:Object.freeze(x.u),v:Object.freeze(x.v)})));
const mod=(a,n)=>((a%n)+n)%n;
const vec=x=>Array.isArray(x)&&x.length===2&&[0,1].every(i=>Object.hasOwn(x,i)&&Number.isInteger(x[i])&&x[i]>=-12&&x[i]<=12);
export function periodicityRatio(a,b){
 if(!Number.isInteger(a)||!Number.isInteger(b)||Math.abs(a)>24||Math.abs(b)>24)throw new RangeError('Integer displayed lattice point required');
 let p=3n**BigInt(Math.max(0,a))*5n**BigInt(Math.max(0,b)),q=3n**BigInt(Math.max(0,-a))*5n**BigInt(Math.max(0,-b));
 while(p<q)p*=2n;while(p>=2n*q)q*=2n;const ratio=Number(p)/Number(q);return{p:String(p),q:String(q),ratio,cents:1200*Math.log2(ratio)};
}
export function periodicityModel(n=12,u=[0,-3],v=[4,-1],tempered=false,selected=[0,0]){
 if(![0,...PERIODICITY_PRESETS.map(x=>x.n)].includes(n)||!vec(u)||!vec(v)||typeof tempered!=='boolean'||!Array.isArray(selected)||selected.length!==2||![0,1].every(i=>Object.hasOwn(selected,i)&&Number.isInteger(selected[i])))throw new RangeError('Offered division, bounded integer vectors and lattice selection required');
 const preset=PERIODICITY_PRESETS.find(x=>x.n===n);if(preset){u=[...preset.u];v=[...preset.v];}
 const D=u[0]*v[1]-u[1]*v[0],size=Math.abs(D),sign=Math.sign(D),vertices=[[0,0],u,[u[0]+v[0],u[1]+v[1]],v],x=vertices.map(p=>p[0]),y=vertices.map(p=>p[1]),points=[];
 if(D)for(let a=Math.min(...x);a<=Math.max(...x);a++)for(let b=Math.min(...y);b<=Math.max(...y);b++){
  const s=sign*(a*v[1]-b*v[0]),t=sign*(u[0]*b-u[1]*a);
  if(s>=0&&s<size&&t>=0&&t<size){const r=periodicityRatio(a,b),step=preset?mod(a*preset.m3+b*preset.m5,n):null,cents=tempered&&preset?1200*step/n:r.cents;points.push({a,b,s,t,x:s/size,y:t/size,...r,step,cents,hz:WE_C4*2**(cents/1200)});}
 }
 points.sort((a,b)=>a.a-b.a||a.b-b.b);
 const chosen=points.find(p=>p.a===selected[0]&&p.b===selected[1])??points.find(p=>p.a===0&&p.b===0)??null;
 return{n,u,v,D,size,valid:D!==0,tempered:tempered&&!!preset,m3:preset?.m3??null,m5:preset?.m5??null,vertices,points,chosen,bounds:{x:[Math.min(...x)-1.4,Math.max(...x)+1.4],y:[Math.min(...y)-1.4,Math.max(...y)+1.4]},sequence:[...points].sort((a,b)=>a.cents-b.cents||a.a-b.a||a.b-b.b).slice(0,12)};
}
export function periodicityHit(model,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;return model.points.find(p=>Math.hypot(p.a-x,p.b-y)<.33)??null;}
export function periodicitySelection(model,p){return Array.isArray(p)&&p.length===2&&[0,1].every(i=>Object.hasOwn(p,i)&&Number.isInteger(p[i]))&&model.points.some(q=>q.a===p[0]&&q.b===p[1]);}
export function periodicityAudio(model,action){if(!['selected','sequence'].includes(action)||!model.valid)throw new RangeError('A valid block and offered action are required');return weRenderAudio(action==='selected'?[[model.chosen.hz]]:model.sequence.map(p=>[p.hz]),action==='selected'?.8:.25,action==='selected'?0:.03);}
// Custom validators run before controls restore. Validate the saved block on its own;
// the adapter setter separately checks that it matches the restored controls.
export function periodicityStateValid(data){try{if(!data||typeof data!=='object'||Array.isArray(data)||!['n','u','v','point'].every(k=>Object.hasOwn(data,k))||typeof data.n!=='number'||!vec(data.u)||!vec(data.v))return false;const m=periodicityModel(data.n,data.u,data.v,false,data.point);return m.valid?periodicitySelection(m,data.point):data.point[0]===0&&data.point[1]===0;}catch{return false;}}
