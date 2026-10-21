// Exact quadratic-field arithmetic for the prescribed irrational example.
// [a,b] represents a+b*r, r=(sqrt(5)-1)/2 and r*r=1-r.
import { fordFulkerson, resArcs, resDist, bipNet, matchingOf } from './ch11.shared.js';
export const golden = {
  q:(a,b=0)=>[BigInt(a),BigInt(b)],
  add:([a,b],[c,d])=>[a+c,b+d],
  sub:([a,b],[c,d])=>[a-c,b-d],
  mul:([a,b],[c,d])=>[a*c+b*d,a*d+b*c-b*d],
  sign([a,b]) {
    const A=2n*a-b,B=b;
    if(A===0n)return B<0n?-1:B>0n?1:0;
    if(B===0n)return A<0n?-1:1;
    if((A>0n)===(B>0n))return A>0n?1:-1;
    const z=A*A-5n*B*B;
    return (A>0n?1:-1)*(z>0n?1:-1);
  },
  number([a,b]) {
    const r=(Math.sqrt(5)-1)/2;
    if(a*b>=0n)return Number(a)+Number(b)*r;
    // Use the conjugate and exact norm instead of subtracting large doubles.
    const norm=a*a-a*b-b*b,shift=Math.max(0,Math.max(a.toString(2).length,b.toString(2).length)-53),ns=Math.max(0,norm.toString(2).length-53),s=BigInt(shift);
    return Number(norm>>BigInt(ns))/(Number(a>>s)+Number(b>>s)*(-1-r))*2**(ns-shift);
  },
};
const Q=golden.q,Z=Q(0),R=Q(0,1);
export const irrationalExample = (M=4) => ({
  irrational:true,M,
  pos:{s:[.7,3],v1:[3.1,5.2],v2:[3.1,.8],v4:[5.8,5.2],v3:[5.8,.8],t:[8.6,3]},
  arcs:[['s','v1',M],['s','v2',M],['s','v4',M],['v2','v3',1],['v4','v3',golden.number(R)],['v2','v1',1],['v1','t',M],['v3','t',M],['v4','t',M]],
  capacities:[Q(M),Q(M),Q(M),Q(1),R,Q(1),Q(M),Q(M),Q(M)],
  seq:[['s','v4','v3','v2','v1','t'],['s','v2','v3','v4','t'],['s','v4','v3','v2','v1','t'],['s','v1','v2','v3','t']],
  first:['s','v2','v3','t'],
});
export const unitMiddleExample = C => ({
  irrational:false,
  pos:{s:[.9,3],a:[4.4,5.1],b:[4.4,.9],t:[8.1,3]},
  arcs:[['s','a',C],['s','b',C],['a','b',1],['a','t',C],['b','t',C]],
  capacities:[Q(C),Q(C),Q(1),Q(C),Q(C)],
  seq:[['s','a','b','t'],['s','b','a','t']],first:null,
});

export function exactResidual(example,f) {
  const out=[];
  example.arcs.forEach(([from,to],i)=>{
    const slack=golden.sub(example.capacities[i],f[i]);
    if(golden.sign(slack)>0)out.push({from,to,i,fwd:true,exact:slack,w:golden.number(slack)});
    if(golden.sign(f[i])>0)out.push({from:to,to:from,i,fwd:false,exact:f[i],w:golden.number(f[i])});
  });
  return out;
}
export function exactAdversarialRun(example,limit=30) {
  const frames=[],steps=[];let f=example.arcs.map(()=>Z);
  const value=()=>example.arcs.reduce((s,[u,v],i)=>golden.add(s,u==='s'?f[i]:v==='s'?golden.sub(Z,f[i]):Z),Z);
  const mk=(type,extra={})=>frames.push({type,f:f.map(golden.number),exact:f.map(x=>x.slice()),value:golden.number(value()),exactValue:value(),res:exactResidual(example,f),...extra});
  mk('init',{note:'Start from the zero flow. Irrational updates use exact quadratic-field arithmetic.'});
  const bound=example.irrational?limit:2*Number(example.capacities[0][0]);
  for(let k=0;k<bound;k++) {
    const nodes=k===0&&example.first?example.first:example.seq[(example.first?k-1:k)%example.seq.length],res=exactResidual(example,f),path=[];
    for(let j=0;j+1<nodes.length;j++){const arc=res.find(a=>a.from===nodes[j]&&a.to===nodes[j+1]);if(!arc)throw new Error('prescribed exact residual path is unavailable');path.push(arc);}
    const b=path.reduce((x,a)=>golden.sign(golden.sub(a.exact,x))<0?a.exact:x,path[0].exact),amount=golden.number(b);
    mk('path',{path,bottleneck:amount,k:k+1,note:`Augmentation ${k+1}: ${nodes.join('→')}; exact positive bottleneck, approximately ${amount.toPrecision(6)}.`});
    f=f.map(x=>x.slice());for(const a of path)f[a.i]=golden.add(f[a.i],a.fwd?b:golden.sub(Z,b));
    steps.push({path,b:amount,exactB:b});mk('push',{path,bottleneck:amount,k:k+1,note:`Pushed approximately ${amount.toPrecision(6)}; the flow value is ${golden.number(value()).toPrecision(7)}.`});
  }
  mk('end',{note:example.irrational?`Display cutoff after ${bound} exact augmentations. Positive residual paths remain; this is not algorithmic completion.`:`Completed ${bound} unit augmentations; the flow reaches the cut bound.`});
  return {frames,steps,f:f.map(golden.number),exact:f,value:golden.number(value()),exactValue:value(),cutoff:example.irrational};
}

export function edmondsKarpAudit(ids,arcs) {
  const run=fordFulkerson(ids,arcs,'s','t','bfs');
  const states=run.frames.filter(fr=>fr.type==='init'||fr.type==='push').map(fr=>({dist:resDist(resArcs(arcs,fr.f),'s',ids),f:fr.f}));
  const events=run.steps.map(st=>st.path.filter(a=>Math.abs(a.w-st.b)<1e-9).map(a=>({key:`${a.i}:${a.fwd?'f':'b'}`,from:a.from,to:a.to,edge:a.i,fwd:a.fwd})));
  return {...run,states,events};
}
export function criticalTally(events,completed=events.length) {
  const tally=new Map();for(const row of events.slice(0,completed))for(const event of row){const old=tally.get(event.key);tally.set(event.key,{...event,count:(old?.count||0)+1});}
  return [...tally.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
}
export function konigCertificate(nL,nR,E) {
  const net=bipNet(nL,nR,E),run=fordFulkerson(net.ids,net.arcs,'s','t','bfs'),matching=matchingOf(net,E,run.f),Z=run.S;
  const cover=new Set([...net.L.filter(l=>!Z.has(l)),...net.R.filter(r=>Z.has(r))]);
  return {net,run,matching,Z,cover};
}
