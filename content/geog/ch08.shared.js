// GEOG8: explicitly synthetic planar models; only the Snow point transcription
// is historical data. Coordinates below are arbitrary planar distance units.
export const O={step:'any',sig:5,decimals:5},I={step:1,int:true};
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:320,...extra});
export const sites=[[2,2],[8,2],[2,8],[8,8]];
export const observations=sites.map((p,i)=>[...p,[1,4,2,5][i]]);
export const sum=a=>a.reduce((s,x)=>s+x,0);
export function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function grid(n=3){return Array.from({length:n*n},(_,i)=>[i%n,Math.floor(i/n)]);}
export function field(mode='smooth',seed=12,n=3){const random=rng(seed);return grid(n).map(([x,y])=>mode==='smooth'?x+y:mode==='checkerboard'?(x+y)%2:mode==='constant'?1:random());}
export function weights(points,mode='rook'){
 return points.map((a,i)=>{const row=points.map((b,j)=>i===j?0:mode==='rook'?Number(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1):Number(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))===1)),s=sum(row);return s?row.map(x=>x/s):row;});
}
export function moran(values,W){
 const n=values.length,mean=sum(values)/n,z=values.map(x=>x-mean),den=sum(z.map(x=>x*x)),S0=sum(W.map(sum)),lag=W.map(row=>sum(row.map((w,j)=>w*z[j]))),num=sum(z.map((x,i)=>x*lag[i]));
 return {n,mean,z,lag,lagMean:sum(lag)/n,den,S0,I:den>0&&S0>0?n*num/(S0*den):null,expected:n>1?-1/(n-1):null};
}
export function permutation(values,W,seed=23,repetitions=199){
 const observed=moran(values,W),random=rng(seed),rep=[];if(observed.I===null)return {...observed,rep,p:null};
 let greater=0;for(let k=0;k<repetitions;k++){const a=values.slice();for(let j=a.length-1;j>0;j--){const i=Math.floor(random()*(j+1));[a[i],a[j]]=[a[j],a[i]];}const q=moran(a,W).I;rep.push(q);if(q>=observed.I-1e-13)greater++;}
 return {...observed,rep,p:(greater+1)/(repetitions+1)};
}
export function pairs(points,values){const out=[];for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)out.push({distance:Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1]),difference:(values[i]-values[j])**2/2});return out;}
// Clip a polygon by the closer-to-site half-plane, avoiding a square root.
export function clip(poly,a,b,c){
 const out=[];for(let j=0;j<poly.length;j++){const p=poly[j],q=poly[(j+1)%poly.length],u=a*p[0]+b*p[1]-c,w=a*q[0]+b*q[1]-c;if(u<=0)out.push(p);if((u<=0)!==(w<=0)){const t=u/(u-w);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}
 return out;
}
export function voronoi(points,box=[0,0,10,10]){
 const [x,y,X,Y]=box;return points.map((p,i)=>{if(points.slice(0,i).some(q=>p[0]===q[0]&&p[1]===q[1]))return [];let cell=[[x,y],[X,y],[X,Y],[x,Y]];for(let j=0;j<points.length&&cell.length;j++){if(i===j)continue;const q=points[j];cell=clip(cell,2*(q[0]-p[0]),2*(q[1]-p[1]),(q[0]-p[0])*(q[0]+p[0])+(q[1]-p[1])*(q[1]+p[1]));}return cell;});
}
export const area=poly=>Math.abs(sum(poly.map((p,i)=>p[0]*poly[(i+1)%poly.length][1]-p[1]*poly[(i+1)%poly.length][0])))/2;
export function nearest(points,x,y,metric='Euclidean'){
 const distances=points.map(p=>metric==='Manhattan'?Math.abs(p[0]-x)+Math.abs(p[1]-y):Math.hypot(p[0]-x,p[1]-y)),d=Math.min(...distances),ties=distances.map((v,i)=>v===d?i:-1).filter(i=>i>=0);
 return {index:ties[0],ties,d,distances};
}
export function idw(points,x,y,power=2){
 const ds=points.map(p=>Math.hypot(p[0]-x,p[1]-y)),zero=ds.map((x,i)=>x===0?i:-1).filter(i=>i>=0);
 let w;if(power===0)w=ds.map(()=>1/ds.length);else if(zero.length)w=ds.map((_,i)=>zero.includes(i)?1/zero.length:0);else{const m=Math.min(...ds);w=ds.map(d=>(m/d)**power);const total=sum(w);w=w.map(x=>x/total);}
 return {weights:w,value:sum(w.map((x,i)=>x*points[i][2])),variance:null};
}
export function solve(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;[M[k],M[p]]=[M[p],M[k]];if(Math.abs(M[k][k])<1e-14)throw Error('Kriging system is numerically singular.');for(let i=k+1;i<n;i++){const q=M[i][k]/M[k][k];for(let j=k;j<=n;j++)M[i][j]-=q*M[k][j];}}
 const x=Array(n).fill(0);for(let i=n-1;i>=0;i--)x[i]=(M[i][n]-sum(M[i].slice(i+1,n).map((v,j)=>v*x[i+1+j])))/M[i][i];return x;
}
const absoluteProducts=(a,b)=>sum(a.map((x,i)=>Math.abs(x*b[i])));
export function kriging(points,x,y,length=2,nugget=0){
 const n=points.length,cov=(a,b)=>Math.exp(-Math.hypot(a[0]-b[0],a[1]-b[1])/length),C=points.map((p,i)=>points.map((q,j)=>cov(p,q)+(i===j?nugget:0))),c=points.map(p=>cov(p,[x,y])),A=C.map(row=>[...row,1]);A.push([...Array(n).fill(1),0]);const solution=solve(A,[...c,1]),w=solution.slice(0,n),multiplier=solution[n],rawVariance=1-sum(w.map((x,i)=>x*c[i]))-multiplier,varianceTolerance=128*Number.EPSILON*(1+absoluteProducts(w,c)+Math.abs(multiplier)),variance=rawVariance<0&&rawVariance>=-varianceTolerance?0:rawVariance;
 return {weights:w,value:sum(w.map((x,i)=>x*points[i][2])),variance,rawVariance,varianceTolerance,lagrange:multiplier,C,c};
}
export function distanceKernel(distance,length=2,mode='exponential',power=2){return mode==='exponential'?Math.exp(-distance/length):(1+distance/length)**(-power);}
export function radialMass(radius,length=2,mode='exponential',power=2){
 const x=radius/length;if(x===0)return 0;let integral;
 if(x<.1){let coefficient=1,term=1,total=.5;for(let k=1;k<24;k++){coefficient*=mode==='exponential'?-1/k:-(power+k-1)/k;term*=x;total+=coefficient*term/(k+2);}integral=x*x*total;}
 else if(mode==='exponential')integral=-Math.expm1(-x)-x*Math.exp(-x);
 else{const L=Math.log1p(x),F=a=>a===0?L:Math.expm1(a*L)/a;integral=F(2-power)-F(1-power);}
 return 2*Math.PI*length*length*integral;
}
export function adoption({length=2,contact=3,external=.01,seed=12,generations=20,n=8}={}){
 const pts=grid(n),N=pts.length,K=pts.map((p,i)=>{const w=pts.map((q,j)=>i===j?0:Math.exp(-Math.hypot(p[0]-q[0],p[1]-q[1])/length)),s=sum(w);return w.map(x=>x/s);}),random=rng(seed),when=Array(N).fill(null);when[Math.floor(N/2)+Math.floor(n/2)]=0;const counts=[1],states=[when.map(x=>x!==null)];
 for(let t=1;t<=generations;t++){const previous=when.map(x=>x!==null);for(let i=0;i<N;i++)if(!previous[i]){const pressure=sum(K[i].map((w,j)=>previous[j]?w:0)),probability=-Math.expm1(-external-contact*pressure);if(random()<probability)when[i]=t;}counts.push(when.filter(x=>x!==null).length);states.push(when.map(x=>x!==null));}
 return {pts,when,counts,states,N,generations};
}
export function urban({length=1,mixing=.6,growth=.05,steps=12,n=15}={}){
 const kernel=[];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)kernel.push({x,y,w:Math.exp(-Math.hypot(x,y)/length)});const norm=sum(kernel.map(k=>k.w));kernel.forEach(k=>k.w/=norm);
 let P=grid(n).map(([x,y])=>Math.exp(-((x-(n-1)/2)**2+(y-(n-1)/2)**2)/2));const initial=P.slice(),totals=[sum(P)];
 for(let t=0;t<steps;t++){P=P.map((v,i)=>{const x=i%n,y=Math.floor(i/n),spread=sum(kernel.map(k=>k.w*P[((y+k.y+n)%n)*n+(x+k.x+n)%n]));return (1+growth)*((1-mixing)*v+mixing*spread);});totals.push(sum(P));}
 return {P,initial,kernel,totals,total:sum(P),initialTotal:sum(initial),n,steps,growth,mixing,length};
}
