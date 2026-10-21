// Scoped, executable models for the chapter-4 source audit. These finite models
// check constructions; none decides a complexity-class separation or HALT.
import {newC,addIn,addG,foldC,evalC,sizeC,depthC,restrictCNF} from './ch04.shared.js';
export function synthesisDNF(f,n){
  const C=newC(),X=Array.from({length:n},(_,j)=>addIn(C,`x${j+1}`)),neg=new Map(),terms=[];
  for(let m=0;m<f.length;m++)if(f[m])terms.push(foldC(C,'and',X.map((x,j)=>{
    if(m>>(n-1-j)&1)return x;if(!neg.has(j))neg.set(j,addG(C,'not',[x]));return neg.get(j);
  }),'tree'));
  C.outs=[terms.length?foldC(C,'or',terms,'tree'):addG(C,'c0',[])];return C;
}
export function synthesisMux(f,n){
  const C=newC(),X=Array.from({length:n},(_,j)=>addIn(C,`x${j+1}`)),memo=new Map(),not=new Map();
  const visit=(t,j)=>{
    const key=`${j}:${t.join('')}`;if(memo.has(key))return memo.get(key);let out;
    if(t.every(x=>x===t[0]))out=addG(C,t[0]?'c1':'c0',[]);
    else{
      const h=t.length/2,lo=visit(t.slice(0,h),j+1),hi=visit(t.slice(h),j+1);
      if(!not.has(j))not.set(j,addG(C,'not',[X[j]]));
      out=addG(C,'or',[addG(C,'and',[not.get(j),lo]),addG(C,'and',[X[j],hi])]);
    }
    memo.set(key,out);return out;
  };C.outs=[visit(Array.from(f),0)];return C;
}
/** An explicit AND/OR/NOT realization: XOR(a,b)=(a OR b) AND NOT(a AND b). */
export function shallowCircuit(n,fn,design){
  const C=newC(),ins=Array.from({length:n},(_,j)=>addIn(C,`x${j+1}`));
  const combine=(a,b)=>fn==='xor'?addG(C,'and',[addG(C,'or',[a,b]),addG(C,'not',[addG(C,'and',[a,b])])]):addG(C,fn,[a,b]);
  if(design==='flat'&&fn==='xor')return null; // The exponential DNF is quoted, never allocated.
  if(design==='flat')C.outs=[addG(C,fn,ins)];
  else if(design==='chain'){let a=ins[0];for(let j=1;j<n;j++)a=combine(a,ins[j]);C.outs=[a];}
  else{let a=ins;while(a.length>1){const b=[];for(let j=0;j<a.length;j+=2)b.push(j+1<a.length?combine(a[j],a[j+1]):a[j]);a=b;}C.outs=[a[0]];}
  return C;
}
export function shallowMetrics(n,fn,design){
  const C=shallowCircuit(n,fn,design);
  return C?{C,size:sizeC(C),depth:depthC(C),binarySize:sizeC(C,true),binaryDepth:depthC(C,true)}:
    {C:null,size:n+2**(n-1)+1,depth:3,terms:2**(n-1),binarySize:null,binaryDepth:null};
}
/** Self-reduction is sound for ANY oracle, not just a low-error SAT oracle. */
export function satWitness(n,clauses,oracle){
  const assignment=new Map(),frames=[],root=oracle(clauses);frames.push({kind:'root',...root,asg:new Map()});
  if(!root.ans){frames.push({kind:'final',bad:-1,ok:false,asg:new Map()});return{frames,accepted:false,assignment};}
  for(let i=1;i<=n;i++){
    const tentative=new Map(assignment);tentative.set(i,0);const q=oracle(restrictCNF(clauses,tentative)),bit=q.ans?0:1;
    assignment.set(i,bit);frames.push({kind:'step',i,...q,bit,asg:new Map(assignment)});
  }
  const bad=clauses.filter(c=>!c.some(l=>(assignment.get(Math.abs(l))===1)===(l>0))).length;
  frames.push({kind:'final',bad,ok:bad===0,asg:new Map(assignment)});return{frames,accepted:bad===0,assignment};
}
export function tableauViolations(guess,init,rule){
  const bad=[],W=init.length;
  for(let j=0;j<W;j++)if(guess[0][j]!==init[j])bad.push([0,j]);
  for(let t=1;t<guess.length;t++)for(let j=0;j<W;j++){
    const a=guess[t-1],code=4*a[(j+W-1)%W]+2*a[j]+a[(j+1)%W];
    if(guess[t][j]!==((rule>>code)&1))bad.push([t,j]);
  }return bad;
}
/** O(depth) control record for an unfolded formula. No ancestor gate addresses
 * are stored. Its path is re-traversed from the root to recover the current gate.
 * Frames/history and the supplied node table are animation data, NOT workspace.
 * Account for branch bits, saved left values, current value, phase and counters.
 */
export function formulaWalk(nodes,d){
  const frames=[],path=[],left=[];let phase='enter',value=0;
  const snapshot=(k,act)=>frames.push({k,act,path:path.slice(),left:left.slice(),stack:path.map((b,i)=>[Number.parseInt('1'+path.slice(0,i).join(''),2),b?left[i]:null]),
    bits:path.length+left.filter(x=>x!==null).length+1+2+2*Math.ceil(Math.log2(d+2))});
  for(;;){
    // Recover the gate from a root-to-gate path, using one O(log size) address.
    let k=1;for(const bit of path)k=2*k+bit;
    const node=nodes[k];
    if(phase==='enter'){
      snapshot(k,'enter');
      if(path.length<d){path.push(0);left.push(null);continue;}
      value=typeof node==='number'?node:node.v;phase='return';snapshot(k,'exit');
    }
    if(!path.length)return{frames,value,maxBits:Math.max(...frames.map(f=>f.bits)),addressBits:d+1};
    const branch=path.at(-1);
    if(branch===0){left[left.length-1]=value;path[path.length-1]=1;phase='enter';snapshot(Math.floor(k/2),'mid');}
    else{
      const lv=left.pop();path.pop();const op=nodes[Math.floor(k/2)].op;
      value=op==='and'?lv&value:op==='or'?lv|value:lv^value;phase='return';snapshot(Math.floor(k/2),'exit');
    }
  }
}
export function squaredReachability(A,k){
  let P=A.map((r,i)=>r.map((x,j)=>i===j?1:+!!x));
  for(let q=0;q<k;q++){const old=P;P=old.map((r,i)=>r.map((_,j)=>+old.some((__,m)=>old[i][m]&&old[m][j])));}return P;
}
export function unaryAdviceAccept(input,advice){return /^1*$/.test(input)&&advice===1;}
export {evalC,sizeC,depthC};
