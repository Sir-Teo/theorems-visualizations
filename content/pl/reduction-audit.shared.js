// Bounded computation reports witnesses and resource limits separately from mathematical theorems.
import {V,L,A,key,size,redexes,contract,subst,allNames,parAll,normalize,clNormalForm,clKeyApp,lamAppKey,CA,clFV,clSize,CK,CI,CS,fromLambda} from './ch03.shared.js';
import {allSteps,tKey,tSize,genTyped,typeOf,tyEq,tL,tC} from './ch04.shared.js';

export function oneStepDiamond(a,b,maxSize=2000){
  const successors=t=>{const list=[],rs=redexes(t);let complete=true;for(const p of rs){const u=contract(t,p);if(size(u)>maxSize)complete=false;else list.push(u);}return{list,complete};};
  const l=successors(a),r=successors(b),R=new Set(r.list.map(u=>key(u))),meet=l.list.find(t=>R.has(key(t)));
  return {value:meet?true:l.complete&&r.complete?false:null,meet:meet||null};
}
export function finiteOneStepDiamond(succ,a,b){return succ[a].some(d=>succ[b].includes(d));}

class Budget extends Error{}
// Free occurrence count under binders; substitution output size is known before copying.
function occurrences(t,x){if(t.t==='v')return +(t.x===x);if(t.t==='l')return t.x===x?0:occurrences(t.b,x);return occurrences(t.f,x)+occurrences(t.a,x);}
export function limitedParallel(t,S,{maxSize=1000,all=false}={}){
  const checked=u=>{if(size(u)>maxSize)throw new Budget();return u;};
  const go=(u,p)=>{if(u.t==='v')return u;if(u.t==='l')return checked(L(u.x,go(u.b,p?p+'.b':'b')));
    const sub=q=>p?p+'.'+q:q;
    if(u.f.t==='l'&&(all||S.has(p))){const body=go(u.f.b,sub('f.b')),arg=go(u.a,sub('a'));if(size(body)+occurrences(body,u.f.x)*(size(arg)-1)>maxSize)throw new Budget();return checked(subst(body,u.f.x,arg));}
    return checked(A(go(u.f,sub('f')),go(u.a,sub('a'))));};
  try{if(size(t)>maxSize)throw new Budget();return{term:go(t,''),complete:true};}catch(e){if(e instanceof Budget)return{term:null,complete:false,reason:'term-size budget'};throw e;}
}
export function parallelMembership(t,u){
  if(size(t)>80||redexes(t).length>8||size(u)>1000)return null;
  const r=parAll(t,400);if(r.list.some(v=>key(v)===key(u)))return true;return r.complete?false:null;
}

export function boundedBracket(lam,eta=false,maxSize=20000,maxBinders=200){
  const checked=u=>{if(clSize(u)>maxSize)throw new Budget();return u;};
  const bracket=(x,m)=>{if(m.t==='v'&&m.x===x)return CI;if(!clFV(m).has(x))return checked(CA(CK,m));if(eta&&m.t==='a'&&m.a.t==='v'&&m.a.x===x&&!clFV(m.f).has(x))return m.f;return checked(CA(CS,bracket(x,m.f),bracket(x,m.a)));};
  const hasLam=u=>u.t==='l'||u.t==='a'&&(hasLam(u.f)||hasLam(u.a));
  const states=[fromLambda(lam)],removed=[];
  function step(u){if(u.t==='l'){if(!hasLam(u.b)){const r=bracket(u.x,u.b);removed.push(u.x);return r;}return checked(L(u.x,step(u.b)));}if(u.t==='a')return hasLam(u.f)?checked(CA(step(u.f),u.a)):checked(CA(u.f,step(u.a)));return u;}
  try{checked(states[0]);while(hasLam(states.at(-1))){if(removed.length>=maxBinders)return{states,removed,complete:false,reason:'binder budget'};states.push(step(states.at(-1)));}return{states,removed,complete:true};}catch(e){if(e instanceof Budget)return{states,removed:removed.slice(0,states.length-1),complete:false,reason:'translation-size budget'};throw e;}
}
export function freshObservation(lam,cl,maxArgs=4){
  const avoid=allNames(lam),names=[];for(let i=0;names.length<maxArgs;i++){const x='p'+i;if(!avoid.has(x))names.push(x);}
  for(let n=0;n<=maxArgs;n++){
    let tl=lam,tc=cl;for(let i=0;i<n;i++){tl=A(tl,V(names[i]));tc=CA(tc,V(names[i]));}
    const r=normalize(tl,150,500);if(!r.ok)continue;
    const lk=lamAppKey(r.t);if(lk===null)continue;
    const c=clNormalForm(tc,500,1000);
    return{n,names:names.slice(0,n),lam:lk,cl:c.ok?clKeyApp(c.t):null,lamSteps:r.steps,clSteps:c.steps,complete:c.ok};
  }
  return null;
}

/** Fully explored finite acyclic graph gives exact min/max. A directed cycle is a witness; a budget is unknown. */
export function reductionGraph(t0,{cap=2500,maxSize=260,maxDepth=200}={}){
  const start=tKey(t0),states=new Map([[start,{term:t0,depth:0,next:[]}]]),queue=[start],limits=new Set();let expanded=0;
  for(let i=0;i<queue.length;i++){
    const k=queue[i],node=states.get(k);
    if(tSize(node.term)>maxSize){limits.add('term size');continue;}
    const next=allSteps(node.term);
    if(node.depth>=maxDepth&&next.length){limits.add('depth');continue;}
    expanded++;
    for(const u of next){if(tSize(u)>maxSize){limits.add('term size');continue;}const z=tKey(u);if(!states.has(z)){if(states.size>=cap){limits.add('state count');continue;}states.set(z,{term:u,depth:node.depth+1,next:[]});queue.push(z);}node.next.push(z);}
  }
  const colors=new Map(),order=[];let cycle=false;
  function dfs(k){if(colors.get(k)===1){cycle=true;return;}if(colors.has(k))return;colors.set(k,1);for(const j of states.get(k).next)dfs(j);colors.set(k,2);order.push(k);}
  dfs(start);
  if(cycle)return{status:'cycle',states:states.size,expanded,limits:[...limits],min:null,max:null};
  if(limits.size)return{status:'unknown',states:states.size,expanded,limits:[...limits],min:null,max:null};
  const result=new Map();for(const k of order){const es=states.get(k).next;result.set(k,es.length?{min:1+Math.min(...es.map(z=>result.get(z).min)),max:1+Math.max(...es.map(z=>result.get(z).max))}:{min:0,max:0});}
  return{status:'complete',states:states.size,expanded,limits:[],...result.get(start)};
}
export function validatedTyped(r,ty,n){
  let rejected=0;for(let i=0;i<40;i++){const t=genTyped(r,ty,[],n),T=typeOf(t);if(T&&tyEq(T,ty))return{term:t,rejected};rejected++;}
  const inhabit=(T,k=0)=>T.k==='f'?tL('q'+k,T.a,inhabit(T.b,k+1)):tC(T.k==='B'?'false':'zero');
  return{term:inhabit(ty),rejected};
}
