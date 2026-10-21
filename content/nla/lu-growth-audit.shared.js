// Checked elimination for the 4.1 player and 4.6 all-stage growth experiment.
// Separate from the existing p-bit algorithms used by neighboring entries.
export const maxEntry = A => Math.max(...A.flat().map(Math.abs));

export function partialFactors(frame) {
  const {W, completed} = frame;
  return {
    L: W.map((r, i) => r.map((x, j) => i === j ? 1 : j < i && j < completed ? x : 0)),
    B: W.map((r, i) => r.map((x, j) => j < i && j < completed ? 0 : x)),
  };
}

export function checkedElimination(A0, {pivot = false, record = true} = {}) {
  const n = A0.length, W = A0.map(r => r.slice()), perm = Array.from({length:n}, (_,i)=>i), steps = [];
  const initialMax = maxEntry(W);
  let maxGenerated = initialMax, completed = 0, flops = 0, stoppedAt = null;
  const snap = (kind, k) => { if(record) steps.push({kind,k,completed,flops,W:W.map(r=>r.slice()),perm:perm.slice()}); };
  snap('start', -1);
  for(let k=0;k<n-1;k++) {
    let p=k;
    if(pivot) for(let i=k+1;i<n;i++) if(Math.abs(W[i][k])>Math.abs(W[p][k]))p=i;
    if(p!==k){[W[k],W[p]]=[W[p],W[k]];[perm[k],perm[p]]=[perm[p],perm[k]];}
    if(W[k][k]===0){stoppedAt=k;snap('breakdown',k);break;}
    for(let i=k+1;i<n;i++) {
      const m=W[i][k]/W[k][k];flops++;
      for(let j=k+1;j<n;j++) {
        W[i][j]-=m*W[k][j];flops+=2;
        maxGenerated=Math.max(maxGenerated,Math.abs(W[i][j]));
      }
      W[i][k]=m; // multipliers are storage, not generated matrix entries
    }
    completed=k+1;
    snap('elim',k);
  }
  if(stoppedAt===null&&W[n-1][n-1]===0){stoppedAt=n-1;snap('breakdown',n-1);}
  if(stoppedAt===null){
    if(record&&steps.at(-1).kind==='elim')steps.at(-1).kind='done';
    else snap('done',n-1);
  }
  const factors=partialFactors({W,completed});
  return {steps,perm,...factors,flops,completed,stoppedAt,ok:stoppedAt===null,
    initialMax,maxGenerated,rho:initialMax>0?maxGenerated/initialMax:NaN};
}

export function fullHistogram(data, bins=28) {
  const hi=Math.max(8,Math.ceil(Math.max(...data)*1.15)),width=hi/bins;
  const edges=Array.from({length:bins+1},(_,i)=>i*width),counts=Array(bins).fill(0);
  for(const x of data)counts[Math.min(bins-1,Math.floor(x/width))]++;
  return {edges,counts,hi};
}

export function fittedExponent(points) {
  const xs=points.map(p=>Math.log(p[0])),ys=points.map(p=>Math.log(p[1]));
  const mx=xs.reduce((a,b)=>a+b)/xs.length,my=ys.reduce((a,b)=>a+b)/ys.length;
  return xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/xs.reduce((s,x)=>s+(x-mx)**2,0);
}

export function clippedWorstGrowth(top=1e3) {
  const end=1+Math.log2(top);
  return Array.from({length:60},(_,i)=>{const n=6+(end-6)*i/59;return[n,2**(n-1)];});
}
