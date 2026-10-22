// Exact finite models for integer partitions. Counts remain BigInts until plotting.
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const range=n=>Array.from({length:n},(_,i)=>i);
export const zeros=n=>Array(n).fill(0n);
export function partitions(n,max=n){
  if(!Number.isInteger(n)||n<0)return[];
  if(n===0)return[[]];
  const out=[];
  for(let k=Math.min(n,max);k>=1;k--)for(const tail of partitions(n-k,k))out.push([k,...tail]);
  return out;
}
export const conjugate=a=>range(a[0]??0).map(j=>a.filter(x=>x>j).length);
export const distinct=a=>a.every((x,i)=>i===0||x<a[i-1]);
export function multiply(a,b,N=a.length-1){const c=zeros(N+1);for(let i=0;i<a.length&&i<=N;i++)if(a[i])for(let j=0;j<b.length&&i+j<=N;j++)if(b[j])c[i+j]+=a[i]*b[j];return c;}
export function productCounts(N,{maxPart=N,allowed=()=>true,cap=Infinity,copies=()=>1}={}){
  let a=zeros(N+1);a[0]=1n;
  for(let k=1;k<=Math.min(N,maxPart);k++)if(allowed(k))for(let c=0;c<copies(k);c++){
    if(cap===Infinity){for(let n=k;n<=N;n++)a[n]+=a[n-k];}
    else{const factor=zeros(N+1);for(let j=0;j<=cap&&j*k<=N;j++)factor[j*k]=1n;a=multiply(a,factor,N);}
  }
  return a;
}
export function glaisher(a,d=2){
  const counts=new Map();for(const k of a){if(k%d===0)throw Error('input part divisible by d');counts.set(k,(counts.get(k)??0)+1);}
  const b=[];for(const[k,m]of counts){let left=m,power=k;while(left){const digit=left%d;for(let j=0;j<digit;j++)b.push(power);left=Math.floor(left/d);power*=d;}}
  return b.sort((x,y)=>y-x);
}
export function unglaisher(a,d=2){const b=[];for(let k of a){let m=1;while(k%d===0){k/=d;m*=d;}for(let j=0;j<m;j++)b.push(k);}return b.sort((x,y)=>y-x);}
export function franklin(a){
  if(!a.length)return{partner:[],fixed:true,smallest:0,slope:0,move:'empty'};
  if(!distinct(a))throw Error('Franklin requires distinct positive parts');
  const r=a.length,s=a[r-1];let g=1;while(g<r&&a[g-1]===a[g]+1)g++;
  if((s===g&&g===r)||(g===r&&s===g+1))return{partner:[...a],fixed:true,smallest:s,slope:g,move:'pentagonal exception'};
  let b;
  if(s<=g){b=a.slice(0,-1);for(let i=0;i<s;i++)b[i]++;}
  else{b=[...a];for(let i=0;i<g;i++)b[i]--;b.push(g);}
  return{partner:b,fixed:false,smallest:s,slope:g,move:s<=g?'smallest row to slope':'slope to new row'};
}
export function pentagonalTerms(n){const terms=[];for(let k=1;k*(3*k-1)/2<=n;k++)for(const offset of[k*(3*k-1)/2,k*(3*k+1)/2])if(offset<=n)terms.push({k,offset,sign:k%2?1n:-1n});return terms;}
export function recurrence(N){const a=zeros(N+1);a[0]=1n;for(let n=1;n<=N;n++)for(const t of pentagonalTerms(n))a[n]+=t.sign*a[n-t.offset];return a;}
export function eulerProduct(N){const a=zeros(N+1);a[0]=1n;for(let k=1;k<=N;k++)for(let n=N;n>=k;n--)a[n]-=a[n-k];return a;}
const key=(n,k)=>`${n},${k}`;
export function tripleProduct(N,factors=Math.ceil(N/2)){
  let a=new Map([[key(0,0),1n]]);
  for(let r=1;r<=factors;r++)for(const[degree,power,sign]of[[2*r,0,-1n],[2*r-1,1,1n],[2*r-1,-1,1n]]){
    if(degree>N)continue;const b=new Map(a);
    for(const[id,value]of a){const[n,k]=id.split(',').map(Number);if(n+degree<=N){const to=key(n+degree,k+power);b.set(to,(b.get(to)??0n)+sign*value);}}
    for(const[id,value]of b)if(value===0n)b.delete(id);a=b;
  }
  return a;
}
export function thetaCoefficients(N){const a=new Map();for(let k=-Math.floor(Math.sqrt(N));k*k<=N&&k<=Math.floor(Math.sqrt(N));k++)a.set(key(k*k,k),1n);return a;}
export function gapCounts(N,minimum=1,maxPart=N){
  let prev=zeros(N+1),before=zeros(N+1);prev[0]=before[0]=1n;
  for(let m=minimum;m<=maxPart;m++){const next=[...prev];for(let n=m;n<=N;n++)next[n]+=before[n-m];before=prev;prev=next;}
  return prev;
}
export function rogersSeries(N,second=false){const out=zeros(N+1);for(let k=0;k*(k+(second?1:0))<=N;k++){const shift=k*(k+(second?1:0)),p=productCounts(N-shift,{maxPart:k});for(let n=0;n<p.length;n++)out[n+shift]+=p[n];}return out;}
export function rogersProduct(N,second=false){const residues=second?[2,3]:[1,4];return productCounts(N,{allowed:k=>residues.includes(k%5)});}
export function gaussian(n,k){
  if(k<0||k>n)return[0n];let row=[[1n]];
  for(let m=1;m<=n;m++){const next=[];for(let j=0;j<=m;j++){const p=zeros(j*(m-j)+1),a=row[j]??[],b=row[j-1]??[];for(let i=0;i<a.length;i++)p[i]+=a[i];for(let i=0;i<b.length;i++)p[i+m-j]+=b[i];next.push(p);}row=next;}
  return row[k];
}
export function boxPartitions(rows,cols){const out=[];function walk(left,max,a){if(!left){out.push(a.filter(x=>x>0));return;}for(let k=max;k>=0;k--)walk(left-1,k,[...a,k]);}walk(rows,cols,[]);return out;}
export const complement=(a,rows,cols)=>range(rows).map(i=>cols-(a[rows-1-i]??0)).filter(x=>x>0);
export function boxMatching(rows,cols,level){
  const all=boxPartitions(rows,cols),lower=all.filter(a=>sum(a)===level),upper=all.filter(a=>sum(a)===level+1),links=lower.map(a=>upper.flatMap((b,j)=>range(rows).every(i=>(a[i]??0)<=(b[i]??0))?[j]:[])),owner=Array(upper.length).fill(-1);
  function assign(i,seen){for(const j of links[i])if(!seen.has(j)){seen.add(j);if(owner[j]<0||assign(owner[j],seen)){owner[j]=i;return true;}}return false;}
  for(let i=0;i<lower.length;i++)assign(i,new Set());
  return{lower,upper,links,pairs:owner.flatMap((i,j)=>i<0?[]:[[i,j]])};
}
// Rows are partitions, nested coordinatewise. Positive rows only, so no duplicates.
export function planePartitions(n){
  if(n===0)return[[]];const out=[];
  function walk(left,previous,rows){if(left===0){out.push(rows);return;}for(let total=1;total<=left;total++)for(const row of partitions(total,previous?.[0]??left))if(!previous||row.every((x,j)=>x<=(previous[j]??0)))walk(left-total,row,[...rows,row]);}
  walk(n,null,[]);return out;
}
export const planeProduct=N=>productCounts(N,{copies:k=>k});
export function logBigInt(n){if(n<=0n)return-Infinity;const s=n.toString(),leading=Number(s.slice(0,15));return Math.log(leading)+(s.length-Math.min(15,s.length))*Math.LN10;}
