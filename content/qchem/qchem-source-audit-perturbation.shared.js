import { lagL, boxX } from './ch04.shared.js';

export function starkBasis(M,options={}) {
        const {LAM=.6,KB=7,LM=5,NR=1600,RMAX=70}=options, AQ6=RMAX/(NR*NR);
        // basis u_{kl}(r) = r^{l+1} e^{-λr} L_k^{(2l+2)}(2λr); matrices H0, S, Z (z-coupling) precomputed once (quadrature r = a(i+½)²)
        const fns = []; for (let l = 0; l <= LM; l++) for (let k = 0; k < KB; k++) fns.push({ l, k });
        const nF = fns.length, r = Float64Array.from({ length: NR }, (_, i) => AQ6 * (i + 0.5) ** 2), wq = Float64Array.from({ length: NR }, (_, i) => 2 * AQ6 * (i + 0.5));
        const U = fns.map(({ l, k }) => Float64Array.from(r, (x) => x ** (l + 1) * Math.exp(-LAM * x) * lagL(k, 2 * l + 2, 2 * LAM * x)));
        const dU = fns.map(({ l, k }) => Float64Array.from(r, (x) => { const L = lagL(k, 2 * l + 2, 2 * LAM * x), Lp = k > 0 ? -lagL(k - 1, 2 * l + 3, 2 * LAM * x) : 0; return Math.exp(-LAM * x) * ((l + 1) * x ** l * L - LAM * x ** (l + 1) * L + x ** (l + 1) * 2 * LAM * Lp); }));
        const S = [], H0 = [], Zm = [];
        for (let i = 0; i < nF; i++) { S.push(new Array(nF).fill(0)); H0.push(new Array(nF).fill(0)); Zm.push(new Array(nF).fill(0)); }
        for (let i = 0; i < nF; i++) for (let j = i; j < nF; j++) {
          const A = fns[i], B = fns[j]; let s = 0, hh = 0, z = 0;
          if (A.l === B.l) { for (let q = 0; q < NR; q++) { const w = wq[q]; s += w * U[i][q] * U[j][q]; hh += w * (0.5 * dU[i][q] * dU[j][q] + ((A.l * (A.l + 1)) / (2 * r[q] * r[q]) - 1 / r[q]) * U[i][q] * U[j][q]); } }
          else if (Math.abs(A.l - B.l) === 1) { const l = Math.min(A.l, B.l); for (let q = 0; q < NR; q++) z += wq[q] * U[i][q] * r[q] * U[j][q]; z *= (l + 1) / Math.sqrt((2 * l + 1) * (2 * l + 3)); }
          S[i][j] = S[j][i] = s; H0[i][j] = H0[j][i] = hh; Zm[i][j] = Zm[j][i] = z;
        }
        const solve = (F) => M.genEig(H0.map((row, i) => row.map((x, j) => x + F * Zm[i][j])), S);

return {LAM,KB,LM,NR,RMAX,fns,nF,r,wq,U,dU,S,H0,Zm,solve};
}
export const fieldSaddle=F=>F>0?-2*Math.sqrt(F):null;
export function fieldSecant(solve,F,k,hi=.004,h=1e-6){const a=Math.max(0,F-h),b=Math.min(hi,F+h);return(solve(b).values[k]-solve(a).values[k])/(b-a);}
export const squareX2=(m,n)=>m===n?1/3-1/(2*n*n*Math.PI**2):8*m*n*((m+n)%2?-1:1)/(Math.PI**2*(m*m-n*n)**2);
export function squareBasis(M,N=6){const size=N*N,P=1,Q=N,energy=Array.from({length:size},(_,i)=>Math.PI**2/2*((Math.floor(i/N)+1)**2+((i%N)+1)**2)),X=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>boxX(i+1,j+1))),X2=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>squareX2(i+1,j+1))),W={};
 for(const kind of['xy','x2','x'])W[kind]=Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>{const a=Math.floor(i/N),b=i%N,c=Math.floor(j/N),d=j%N;return kind==='xy'?X[a][c]*X[b][d]:(kind==='x2'?X2[a][c]:X[a][c])*(b===d?1:0);}));
 const pair=(kind,lam)=>{const H=W[kind].map((row,i)=>row.map((w,j)=>lam*w+(i===j?energy[i]:0))),eg=M.eigSym(H),sc=eg.vecs.map((c,k)=>({k,w:c[P]**2+c[Q]**2})).sort((a,b)=>b.w-a.w).slice(0,2).sort((a,b)=>eg.values[a.k]-eg.values[b.k]);return{E:sc.map(o=>eg.values[o.k]),c:sc.map(o=>eg.vecs[o.k]),weight:sc.map(o=>o.w),H};};
 return{N,P,Q,energy,W,pair};}
export function squareWave(c,N,x,y){let sum=0;for(let i=0;i<c.length;i++)sum+=2*c[i]*Math.sin((Math.floor(i/N)+1)*Math.PI*x)*Math.sin(((i%N)+1)*Math.PI*y);return sum;}
