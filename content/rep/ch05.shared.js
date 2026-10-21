// Chapter-local finite algebra. Group labels are r^a s^b, with s r s = r^{-1}.
export const source='https://math.mit.edu/~etingof/reprbook.pdf';
export const TAU=2*Math.PI, mod=(x,n)=>(x%n+n)%n;
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],scale=(a,t)=>[a[0]*t,a[1]*t],conj=a=>[a[0],-a[1]],abs=a=>Math.hypot(...a),cis=t=>[Math.cos(t),Math.sin(t)];
export const sci=x=>Number(x).toExponential(3),cz=(z,d=4)=>`${z[0].toFixed(d)}${z[1]<0?'−':'+'}${Math.abs(z[1]).toFixed(d)}i`;
export function dihedral(n=3){const N=2*n,mult=(g,h)=>mod(g%n+(g<n?1:-1)*(h%n),n)+n*((Math.floor(g/n)+Math.floor(h/n))%2),inv=g=>g<n?mod(-g,n):g;return{N,n,e:0,mult,inv,label:g=>g<n?(g===0?'e':g===1?'r':`r${g}`):(g===n?'s':g===n+1?'rs':`r${g-n}s`)};}
export const S3=dihedral(3),S3classes=[[0],[1,2],[3,4,5]],S3chars=[[1,1,1,1,1,1],[1,1,1,-1,-1,-1],[2,-1,-1,0,0,0]],degrees=[1,1,2];
export function conv(f,h,G=S3){const out=new Array(G.N).fill(0);for(let a=0;a<G.N;a++)for(let b=0;b<G.N;b++)out[G.mult(a,b)]+=f[a]*h[b];return out;}
export const delta=(g,N=6)=>Array.from({length:N},(_,j)=>+(j===g));
export const mm=(A,B)=>[[A[0][0]*B[0][0]+A[0][1]*B[1][0],A[0][0]*B[0][1]+A[0][1]*B[1][1]],[A[1][0]*B[0][0]+A[1][1]*B[1][0],A[1][0]*B[0][1]+A[1][1]*B[1][1]]];
export const mscale=(A,t)=>A.map(r=>r.map(x=>x*t)),madd=(A,B)=>A.map((r,i)=>r.map((x,j)=>x+B[i][j])),transpose=A=>[[A[0][0],A[1][0]],[A[0][1],A[1][1]]],frob=A=>Math.hypot(...A.flat());
export function rho(g){const a=TAU*(g%3)/3,c=Math.cos(a),s=Math.sin(a),b=g<3?1:-1;return[[c,-b*s],[s,b*c]];}
export function fourier(f){return[f.reduce((a,b)=>a+b,0),f.reduce((a,b,g)=>a+b*(g<3?1:-1),0),f.reduce((A,w,g)=>madd(A,mscale(rho(g),w)),[[0,0],[0,0]])];}
export function blockProduct(A,B){return[A[0]*B[0],A[1]*B[1],mm(A[2],B[2])];}
export function inverse(A){return Array.from({length:6},(_,g)=>{const M=mm(rho(S3.inv(g)),A[2]);return(A[0]+(g<3?1:-1)*A[1]+2*(M[0][0]+M[1][1]))/6;});}
export const blockError=(A,B)=>Math.max(Math.abs(A[0]-B[0]),Math.abs(A[1]-B[1]),...A[2].flat().map((x,i)=>Math.abs(x-B[2].flat()[i])));
export const energy=f=>f.reduce((a,x)=>a+x*x,0),blockEnergy=A=>(A[0]*A[0]+A[1]*A[1]+2*frob(A[2])**2)/6;
export function dft(f){const N=f.length;return Array.from({length:N},(_,k)=>f.reduce((s,x,j)=>add(s,scale(cis(TAU*k*j/N),x)),[0,0]));}
export function idft(F){const N=F.length;return Array.from({length:N},(_,j)=>scale(F.reduce((s,x,k)=>add(s,mul(x,cis(-TAU*k*j/N))),[0,0]),1/N));}
export function cyclicConv(f,h){const N=f.length,out=new Array(N).fill(0);for(let a=0;a<N;a++)for(let b=0;b<N;b++)out[(a+b)%N]+=f[a]*h[b];return out;}
export function classes(G){const out=[],seen=new Set();for(let x=0;x<G.N;x++)if(!seen.has(x)){const C=[...new Set(Array.from({length:G.N},(_,g)=>G.mult(G.mult(g,x),G.inv(g))))].sort((a,b)=>a-b);C.forEach(x=>seen.add(x));out.push(C);}return out;}
export function classMultiplication(G,C,index){return C.map((_,row)=>C.map((D,col)=>{let n=0;for(const x of C[index])for(const y of D)if(G.mult(x,y)===C[row][0])n++;return n;}));}
export function charpoly3(M){const t=M[0][0]+M[1][1]+M[2][2],t2=M.reduce((s,r,i)=>s+r.reduce((a,x,j)=>a+x*M[j][i],0),0),det=M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);return[-det,(t*t-t2)/2,-t,1];}
export function polynomial(p,z){return p.reduceRight((a,c)=>add(mul(a,z),[c,0]),[0,0]);}
export function walk(lazy,steps){const mu=[lazy,0,0,(1-lazy)/3,(1-lazy)/3,(1-lazy)/3];let p=delta(0),history=[];for(let t=0;t<=steps;t++){history.push({t,p:p.slice(),tv:p.reduce((s,x)=>s+Math.abs(x-1/6),0)/2,bound:Math.min(1,Math.sqrt((2*lazy-1)**(2*t)+4*lazy**(2*t))/2)});p=conv(p,mu);}return history;}
export function subgroup(G,generators){const set=new Set([G.e,...generators]);let old;do{old=set.size;const a=[...set];for(const x of a)for(const y of a)set.add(G.mult(x,y));}while(set.size!==old);return[...set].sort((a,b)=>a-b);}
export function derived(G,H=Array.from({length:G.N},(_,i)=>i)){return subgroup(G,H.flatMap(x=>H.map(y=>G.mult(G.mult(G.mult(x,y),G.inv(x)),G.inv(y)))));}
export function product72(){const H=S3;return{N:72,e:0,mult:(x,y)=>H.mult(x%6,y%6)+6*((Math.floor(x/6)+Math.floor(y/6))%12),inv:x=>H.inv(x%6)+6*mod(-Math.floor(x/6),12),label:x=>`${H.label(x%6)},${Math.floor(x/6)}`};}
export function plot(v,title,x=[-.7,5.7],y=[-2,3],xlabel='group element',ylabel='coefficient',equal=false){const s=v.stage({x,y,equal,axes:'box',gutter:true,height:300,minWidth:260,title,xlabel,ylabel});if(equal){s.el.style.maxWidth='560px';s.el.style.marginInline='auto';}return s;}
export function bars(s,series,colors=['accent'],labels=S3.label){const N=series[0].length,all=series.flat(),lo=Math.min(0,...all),hi=Math.max(0,...all),pad=Math.max(.3,(hi-lo)*.17);s.setView([-.7,N-.3],[lo-pad,hi+pad]);const m=series.length,w=.7/m;series.forEach((values,k)=>values.forEach((y,i)=>s.rect(i-.35+k*w,Math.min(0,y),i-.35+(k+1)*w,Math.max(0,y),{fill:colors[k],fillAlpha:.7,stroke:false})));}
export function table(v,title){const s=v.stage({x:[0,1],y:[0,1],axes:false,height:310,minWidth:260,title});return v.table(s,{square:false,maxCell:64,minCell:12,size:12,labelSize:11,margin:8});}
export function drawBlocks(T,A){T.draw({rows:2,cols:4,rowLabels:i=>String(i+1),colLabels:i=>['triv','sign','std1','std2'][i],value:(i,j)=>j<2?(i===0?A[j].toFixed(4):'—'):A[2][i][j-2].toFixed(4)});}
export const scope=String.raw`Finite authored examples illustrate exact complex representation theory. Integer group multiplication and class counts are exact in the offered sizes; trigonometric matrices and transforms use binary64 arithmetic. Reported residuals diagnose roundoff, not proofs of exact equality or integrality.`;
export function degreeData(name){const G=dihedral(name==='S3'?3:4),C=classes(G);let rows;if(name==='S3')rows=S3chars;else rows=[[1,1],[1,-1],[-1,1],[-1,-1]].map(([a,b])=>Array.from({length:8},(_,g)=>a**(g%4)*b**Math.floor(g/4))).concat([Array.from({length:8},(_,g)=>g<4?[2,0,-2,0][g]:0)]);return{G,C,rows,d:rows.map(r=>r[0])};}
