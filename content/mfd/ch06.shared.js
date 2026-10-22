// Concrete coordinate models for MFD6. No integration identity is inferred from a picture.
export const SOURCES={mein:'https://www.math.toronto.edu/mein/teaching/LectureNotes/Man.pdf',sjam:'https://pi.math.cornell.edu/~sjamaar/manifolds/manifold.pdf',etingof:'https://math.mit.edu/~etingof/lnlg.pdf'};
export const SCOPE='Smooth real Hausdorff, second-countable manifolds; dimensions and orientations are stated where needed. Examples use dimensionless coordinates. Finite drawings and numerical checks illustrate the supplied arguments.';
export const TAU=2*Math.PI;
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const scale=(a,t)=>a.map(x=>x*t);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const det=(a,b)=>a[0]*b[1]-a[1]*b[0];
export const mv=(A,x)=>A.map(row=>dot(row,x));
export const transpose=A=>A[0].map((_,i)=>A.map(row=>row[i]));
export const mm=(A,B)=>A.map(row=>transpose(B).map(col=>dot(row,col)));
export const lin=(a,b,n=100)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
export function trigTurn(t){const q=Math.floor(4*t),a=TAU*(t-q/4),c=Math.cos(a),s=Math.sin(a);return [[c,s],[-s,c],[-c,-s],[s,-c]][((q%4)+4)%4];}
export function covector(a,b,v,s){const B=[[1,s],[0,1]],alpha=[a,b],local=[v[0]-s*v[1],v[1]],coeff=mv(transpose(B),alpha);return{B,alpha,v,local,coeff,value:dot(alpha,v),localValue:dot(coeff,local)};}
export function differential(x,y,c,turn,h){const v=trigTurn(turn),f=(u,w)=>(u*u+c*w*w)/2,value=x*v[0]+c*y*v[1],quadratic=(v[0]*v[0]+c*v[1]*v[1])/2;return{p:[x,y],v,df:[x,c*y],f,value,quadratic,increment:h*value+h*h*quadratic,secant:value+h*quadratic};}
export function pathData(b,k,s,reverse=false){const phi=(1-k)*s+k*s*s,dp=1-k+2*k*s,t=reverse?1-phi:phi,dt=(reverse?-1:1)*dp,start=reverse?1:0;return{t,dt,p:[t,b*t*(1-t)],density:-b*t*t*dt/2,partial:-b*(t*t*t-start)/6,total:(reverse?1:-1)*b/6};}
export function conservative(mode,path,s){const end=path==='loop'?1:path==='upper'?.5:-.5,t=end*s,[x,y]=trigTurn(t),primitive=x+.4*y*y;return{p:[x,y],angle:TAU*t,integral:mode==='exact'?primitive-1:TAU*t,total:mode==='exact'?(path==='loop'?0:-2):TAU*end};}
export function tensor(mode,s,v,w){const A=mode==='positive'?[[2,.4],[.4,1]]:mode==='indefinite'?[[1,0],[0,-1]]:[[0,1],[-1,0]],B=[[1,s],[0,1]],local=x=>[x[0]-s*x[1],x[1]],C=mm(transpose(B),mm(A,B));return{A,C,v,w,localV:local(v),localW:local(w),value:dot(v,mv(A,w)),localValue:dot(local(v),mv(C,local(w))),reverse:dot(w,mv(A,v))};}
export function wedge(a,b,turn,swap=false){let v=[1,0],w=trigTurn(turn);if(swap)[v,w]=[w,v];const A=[[1,a],[b,1]],V=mv(A,v),W=mv(A,w),factor=1-a*b;return{v,w,V,W,factor,area:det(v,w),imageArea:det(V,W),value:factor*det(v,w)};}
export function sphereForm(longitude,latitude,swap=false){const[C,S]=trigTurn(longitude),[c,s]=trigTurn(latitude),p=[c*C,c*S,s],e1=[-S,C,0],e2=[-s*C,-s*S,c],Xtheta=scale(e1,c),sign=swap?-1:1;return{p,e1,e2,Xtheta,coefficient:sign*c,orthValue:sign,chartRegular:c!==0,coordinateValue:sign*dot(p,cross(Xtheta,e2))};}
export function pullback(u,v,c,eps,turn){const w=trigTurn(turn),F=[u,eps*v+c*u*u],J=[[1,0],[2*c*u,eps]],pushed=mv(J,w),alpha=[0,u],coeff=[2*c*u*u,eps*u];return{F,J,w,pushed,alpha,coeff,value:dot(alpha,pushed),localValue:dot(coeff,w),area:eps};}
export function circulation(x,y,h){const f=(x,y)=>[-y*y*y/3,x*x*x/3],density=x*x+y*y,area=4*h*h,average=density+2*h*h/3;return{f,density,area,average,total:area*average,error:2*h*h/3};}
export function vectorCalculus(x,y,z){const F=[y*z+x*x,x*x*z+y*y,x*y*y+z*z],curl=[2*x*y-x*x,y-y*y,2*x*z-z],div=2*(x+y+z),f=x*x*y+y*z*z,grad=[2*x*y,x*x+z*z,2*y*z],divCurlTerms=[2*y-2*x,1-2*y,2*x-1];return{F,curl,div,f,grad,divCurlTerms};}
export function contraction(a,b,x,turn){const rho=1+.3*x,X=[a,b],v=trigTurn(turn),coeff=[-rho*b,rho*a];return{rho,X,v,coeff,value:dot(coeff,v),area:rho*det(X,v)};}
export function cartan(mode,a,b,h,x=.6,y=.4){
 const expDifference=c=>h===0?c:Math.sinh(c*h)/h;
 if(mode==='one-form')return{dInterior:[b*y,b*x],interiorD:[-b*y,a*x],lie:[0,(a+b)*x],difference:[0,x*expDifference(a+b)],increment:t=>x*Math.expm1((a+b)*t),coefficient:t=>x*Math.exp((a+b)*t)};
 return{dInterior:[(a+b)+(3*a+b)*x*x],interiorD:[0],lie:[(a+b)+(3*a+b)*x*x],difference:[expDifference(a+b)+x*x*expDifference(3*a+b)],increment:t=>Math.expm1((a+b)*t)+x*x*Math.expm1((3*a+b)*t),coefficient:t=>Math.exp((a+b)*t)+x*x*Math.exp((3*a+b)*t)};
}
export function stripPoint(turn,s,twisted){const[c,t]=trigTurn(turn),[C,S]=twisted?trigTurn(turn/2):[0,1];return[(1.3+s*C)*c,(1.3+s*C)*t,s*S];}
export function stripFrame(turn,twisted){const[c,s]=trigTurn(turn),[C,S]=twisted?trigTurn(turn/2):[0,1],p=[1.3*c,1.3*s,0],tangent=[-s,c,0],width=[C*c,C*s,S],normal=cross(tangent,width);return{p,tangent,width,normal,alignment:twisted?C:c};}
export function orientationCover(turn,twisted,sheet=0){const base=trigTurn(turn),lift=trigTurn(twisted?(turn+sheet)/2:turn);return{base,lift,component:twisted?0:sheet,components:twisted?1:2,returnsAfterOneLoop:!twisted};}
export function volumeDensity(mode,a,turn){const c=trigTurn(mode==='circle'?turn:turn/2)[0];return{value:mode==='circle'?1+a*c:c,nonvanishing:mode==='circle'&&a<1,zeros:mode==='circle'?(a<1?[]:a===1?[.5]:[Math.acos(-1/a)/TAU,1-Math.acos(-1/a)/TAU]):[.5]};}
export function partition(turn,bias=1){const weights=[0,1/3,2/3].map((center,i)=>{const d=TAU*(turn-center-Math.floor(turn-center+.5));const q=d/2.4;return Math.abs(q)<1?(i===0?bias:1)*Math.exp(-1/(1-q*q)):0;});const sum=weights.reduce((a,b)=>a+b,0);return weights.map(x=>x/sum);}
export function partitionIntegrals(bias,n=1024){const sums=[0,0,0];for(let i=0;i<n;i++){const t=i/n,weight=TAU/n*(1+.4*trigTurn(t)[0]);partition(t,bias).forEach((x,j)=>sums[j]+=x*weight);}return{pieces:sums,total:sums.reduce((a,b)=>a+b,0),exact:TAU,n};}
export function annulus(R,q,orientation=1,wrongInner=false){const r=R*q,outer=orientation*Math.PI*R*R,inner=(wrongInner?1:-1)*orientation*Math.PI*r*r,area=orientation*Math.PI*R*R*(1-q)*(1+q);return{R,r,outer,inner,area,boundary:outer+inner,defect:wrongInner?2*orientation*Math.PI*r*r:0};}
export function classical(R,h,c,orientation=1){return{surface:(r,t)=>[r*Math.cos(t),r*Math.sin(t),h*(1-(r/R)**2)],F:(x,y)=>[-y/2,x/2,c*x],curl:[0,-c,1],density:y=>orientation*(1-2*c*h*y/(R*R)),integral:orientation*Math.PI*R*R};}
export function exactCap(z,mode='exact'){const radius=Math.sqrt((1-z)*(1+z)),boundary=TAU*z*(1-z)*(1+z);return{radius,boundary,integral:mode==='exact'?boundary:TAU*(1-z),density:w=>mode==='exact'?3*w*w-1:1};}
export function affineVolume(v,c,side,h=.35,w=.35){const factor=side==='left'?1:Math.exp(-v),map=([u,b])=>side==='left'?[u+v,c+Math.exp(v)*b]:[u+v,b+Math.exp(u)*c],jacobian=side==='left'?Math.exp(v):1,original=4*w*Math.sinh(h);return{map,jacobian,factor,original,image:original*factor,densityRatio:Math.exp(-v)*jacobian};}
