// OPT5 exact finite models. Binary64 evaluation is distinct from theorem certification.
export const SOURCE='https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf';
export const SLIDES='https://web.stanford.edu/class/ee364a/lectures/duality.pdf';
export const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
export const samples=(f,a,b,n=201)=>Array.from({length:n},(_,j)=>{const x=a+(b-a)*j/(n-1);return[x,f(x)];});
export function quadratic(a,b,lambda=0){const x=Math.min(a,b),l=Math.max(a-b,0);return{x,lambda:l,p:.5*(x-a)**2,xL:a-lambda,g:lambda*(a-b)-.5*lambda**2};}
export const qL=(x,a,b,l)=>.5*(x-a)**2+l*(x-b);
export function collapse(r,l){return{p:-r,g:l>0?-r*r*l-.25/l:-Infinity,x:-r,lambda:r>0?1/(2*r):Infinity,attained:r>0};}
export function finiteGap(c,l=2){const points=[[-1,2],[0,c],[1,-2]],values=points.map(([u,f])=>f+l*u);return{points,values,g:Math.min(...values),p:Math.min(2,c),d:Math.min(c,0),gap:Math.min(2,c)-Math.min(c,0)};}
export function lowerHalf(a){const x=Math.max(a,0);return{x,lambda:x,p:.5*x*x};}
export function boxQP(a,b){const x=clip(a,0,b),lo=Math.max(-a,0),hi=Math.max(a-b,0);return{x,lo,hi,p:.5*(x-a)**2,slacks:[x,b-x],products:[lo*x,hi*(b-x)]};}
export function orthant(c,x,l){return{gradient:x.map((z,j)=>z-c[j]),stationarity:x.map((z,j)=>z-c[j]-l[j]),primal:Math.max(0,...x.map(z=>-z)),dual:Math.max(0,...l.map(z=>-z)),complementarity:Math.max(...x.map((z,j)=>Math.abs(z*l[j]))),opt:c.map(z=>Math.max(z,0))};}
export function resourceQP(alpha,b,x,y,l){const xo=b/(1+1/alpha),yo=b/(1+alpha),p=.5*b*xo,f=.5*(x*x+alpha*y*y),g=l*b-.5*l*l*(1+1/alpha);return{xo,yo,lambda:xo,p,f,g,feasible:x>=0&&y>=0&&x+y>=b,stationarity:[x-l,alpha*y-l],slack:x+y-b};}
export function cusp(epsilon){return{opt:0,gradient:epsilon,lambda:epsilon>0?1/epsilon:Infinity,exists:epsilon>0};}
export function sensitivity(a,b,u){const d=Math.max(a-b-u,0);return{p:.5*d*d,lambda:d,slope:-d};}
// max c1*x+c2*y, x,y>=0, x<=a, x+y<=b. The product widget uses its minimization negative.
export function linearProgram(a,b,c1,c2){const vertices=[[0,0],[Math.min(a,b),0],[0,b]];if(a<=b)vertices.push([a,b-a]);const scores=vertices.map(([x,y])=>c1*x+c2*y),best=Math.max(...scores),x=vertices[scores.indexOf(best)];const candidates=[0,c1,c2].filter(u=>u>=c2).map(u=>({u,v:Math.max(0,c1-u)})),costs=candidates.map(z=>b*z.u+a*z.v),cost=Math.min(...costs),dual=candidates[costs.indexOf(cost)];return{vertices,x,profit:best,p:-best,d:-cost,...dual,reduced:[dual.u+dual.v-c1,dual.u-c2]};}
// Euclidean projection onto a two-ray, pointed planar cone (0<angle<pi).
export function coneWitness(theta,b){const c=Math.cos(theta),s=Math.sin(theta),q=[c,s],d=b[0]*c+b[1]*s,coeff=[b[0]-c*b[1]/s,b[1]/s],inside=coeff.every(z=>z>=0);const candidates=[[0,0],[Math.max(0,b[0]),0],q.map(z=>z*Math.max(0,d))];if(inside)candidates.push([...b]);const ds=candidates.map(p=>(p[0]-b[0])**2+(p[1]-b[1])**2),p=candidates[ds.indexOf(Math.min(...ds))],y=p.map((z,j)=>z-b[j]);return{q,coeff,p,y,distance:Math.hypot(...y),AtY:[y[0],y[0]*c+y[1]*s],btY:b[0]*y[0]+b[1]*y[1],inside};}
export function gordan(mode,scale=1){const t={feasible:-.5,boundary:0,infeasible:.5}[mode];if(t===undefined)throw new RangeError('unknown alternative');const c=Math.cos(t),s=Math.sin(t),A=[[1,0],[-c,s],[0,-1]];if(t<0){const x=[-scale,scale*(c+1)/(-s)];return{A,x,values:A.map(a=>a[0]*x[0]+a[1]*x[1]),y:null};}const sum=c+1+s,y=[c/sum,1/sum,s/sum];return{A,x:null,y,AtY:[y[0]-c*y[1],s*y[1]-y[2]]};}
export function fenchel(alpha,a,beta,y=0){const x=Math.sign(a)*Math.max(Math.abs(a)-beta/alpha,0),ystar=clip(alpha*a,-beta,beta),p=.5*alpha*(x-a)**2+beta*Math.abs(x);return{x,ystar,p,g:Math.abs(y)<=beta?a*y-.5*y*y/alpha:-Infinity,subgradient:alpha*(a-x)};}
export const fConjugate=(s,alpha,a)=>a*s+.5*s*s/alpha;
export const paperCusp=(x,e=0)=>(1-x)**3+e*(1-x);
export function demandStatus(x,y,b){const slack=x+y-b,tol=64*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(y),Math.abs(b));return{slack,tol,status:slack < -tol?'violated':slack>tol?'positive':'boundary'};}
