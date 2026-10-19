// Manifolds & Riemannian Geometry — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
export * from './ch03.shared.js';
import { gexp } from './ch03.shared.js';

/** Classical RK4 for x' = F(x) (autonomous, x an array of any length): n steps of size t/n; returns the new array.
 *  Stops early (returns null) when a coordinate leaves [-big, big] or becomes non-finite (finite-time escape). */
export function flowN(F, x0, t, n = 40, big = 1e4) {
  let x = x0.slice();
  const h = t / n, d = x.length;
  for (let i = 0; i < n; i++) {
    const k1 = F(x), y2 = x.map((a, j) => a + (h / 2) * k1[j]), k2 = F(y2), y3 = x.map((a, j) => a + (h / 2) * k2[j]), k3 = F(y3);
    const y4 = x.map((a, j) => a + h * k3[j]), k4 = F(y4);
    for (let j = 0; j < d; j++) x[j] += (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
    for (let j = 0; j < d; j++) if (!(Math.abs(x[j]) < big)) return null;
  }
  return x;
}
/** Planar flow of a field written (x, y) => [u, v]. Steps scale with |t| so accuracy is uniform. */
export const flow2 = (X, p, t, per = 60) => (t === 0 ? p.slice() : flowN((q) => X(q[0], q[1]), p, t, Math.max(4, Math.ceil(Math.abs(t) * per))));

/** Lie bracket [X,Y]^i = X^j d_j Y^i - Y^j d_j X^i in the plane, by central differences (h is the difference step). */
export function bracket2(X, Y, x, y, h = 1e-4) {
  const dd = (F, dx, dy) => { const a = F(x + dx, y + dy), b = F(x - dx, y - dy); return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; };
  const x0 = X(x, y), y0 = Y(x, y);
  const YX = dd(Y, h, 0), YY = dd(Y, 0, h), XX = dd(X, h, 0), XY = dd(X, 0, h);
  return [x0[0] * YX[0] + x0[1] * YY[0] - y0[0] * XX[0] - y0[1] * XY[0], x0[0] * YX[1] + x0[1] * YY[1] - y0[0] * XX[1] - y0[1] * XY[1]];
}

/** Pairs of planar vector fields used by the bracket items. `br` is the exact bracket (for the readouts that quote it). */
export const PAIRS = {
  coord: { label: '$\\partial_x,\\ \\partial_y$', X: () => [1, 0], Y: () => [0, 1], br: () => [0, 0], note: 'coordinate fields' },
  rotdil: { label: 'rotation, dilation', X: (x, y) => [-y, x], Y: (x, y) => [x, y], br: () => [0, 0], note: 'rotation $-y\\partial_x+x\\partial_y$ and dilation $x\\partial_x+y\\partial_y$' },
  rottr: { label: 'rotation, $\\partial_x$', X: (x, y) => [-y, x], Y: () => [1, 0], br: () => [0, -1], note: 'rotation and the translation $\\partial_x$' },
  shear: { label: '$\\partial_x,\\ x\\partial_y$', X: () => [1, 0], Y: (x) => [0, x], br: () => [0, 1], note: '$\\partial_x$ and $x\\partial_y$' },
  nonlin: { label: '$y\\partial_x,\\ \\sin x\\,\\partial_y$', X: (x, y) => [y, 0], Y: (x) => [0, Math.sin(x)], br: (x, y) => [-Math.sin(x), y * Math.cos(x)], note: '$y\\partial_x$ and $\\sin x\\,\\partial_y$' },
};

/** Plane fields in R^3 (kernels of 1-forms alpha) with explicit spanning fields X1, X2 (smooth, linearly independent). */
export const DISTS = {
  dz: { label: '$\\ker dz$', alpha: () => [0, 0, 1], X1: () => [1, 0, 0], X2: () => [0, 1, 0], form: 'dz' },
  dh: { label: '$\\ker(dz-d\\tfrac{x^2+y^2}2)$', alpha: (x, y) => [-x, -y, 1], X1: (x, y) => [1, 0, x], X2: (x, y) => [0, 1, y], form: 'dz-x\\,dx-y\\,dy' },
  rad: { label: '$\\ker(x\\,dy-y\\,dx)$', alpha: (x, y) => [-y, x, 0], X1: () => [0, 0, 1], X2: (x, y) => [x, y, 0], form: 'x\\,dy-y\\,dx' },
  contact: { label: '$\\ker(dz-y\\,dx)$', alpha: (x, y) => [-y, 0, 1], X1: () => [0, 1, 0], X2: (x, y) => [1, 0, y], form: 'dz-y\\,dx' },
  twist: { label: '$\\ker(\\cos z\\,dx+\\sin z\\,dy)$', alpha: (x, y, z) => [Math.cos(z), Math.sin(z), 0], X1: () => [0, 0, 1], X2: (x, y, z) => [-Math.sin(z), Math.cos(z), 0], form: '\\cos z\\,dx+\\sin z\\,dy' },
};
/** Bracket of the two spanning fields of a plane field at a point of R^3. */
export function bracket3(D, p, h = 1e-4) {
  const J = (F) => [0, 1, 2].map((k) => { const a = p.slice(), b = p.slice(); a[k] += h; b[k] -= h; const fa = F(...a), fb = F(...b); return fa.map((_, i) => (fa[i] - fb[i]) / (2 * h)); });
  const X1 = D.X1(...p), X2 = D.X2(...p), J1 = J(D.X1), J2 = J(D.X2);
  // J[k][i] = d_k F^i;  [X1,X2]^i = X1^k d_k X2^i - X2^k d_k X1^i
  return [0, 1, 2].map((i) => X1[0] * J2[0][i] + X1[1] * J2[1][i] + X1[2] * J2[2][i] - X2[0] * J1[0][i] - X2[1] * J1[1][i] - X2[2] * J1[2][i]);
}

/** Smooth cutoff: 1 for |x| <= r, 0 for |x| >= r + 1, smooth in between. */
export function cutoff(x, r) {
  const t = Math.abs(x) - r;
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  const a = gexp(1 - t), b = gexp(t);
  return a / (a + b);
}

/** Complete planar fields for the Lie-derivative example, with analytic Jacobians. */
export const LIE_FIELDS={
 rot:{label:'rotation $(-y,x)$',f:(x,y)=>[-y,x],J:()=>[[0,-1],[1,0]]},
 dil:{label:'dilation $\\tfrac12(x,y)$',f:(x,y)=>[.5*x,.5*y],J:()=>[[.5,0],[0,.5]]},
 shear:{label:'shear $(y,0)$',f:(x,y)=>[y,0],J:()=>[[0,1],[0,0]]},
 wave:{label:'$(0.6\\sin y,\\ 0.6\\cos x)$',f:(x,y)=>[.6*Math.sin(y),.6*Math.cos(x)],J:(x,y)=>[[0,.6*Math.cos(y)],[-.6*Math.sin(x),0]]},
};
export const lieFunction=(x,y)=>Math.sin(1.2*x)*Math.cos(1.1*y)+.15*x;
export const lieFunctionGradient=(x,y)=>[1.2*Math.cos(1.2*x)*Math.cos(1.1*y)+.15,-1.1*Math.sin(1.2*x)*Math.sin(1.1*y)];
export const lieVector=(x,y)=>[.8*Math.cos(y),.8*Math.sin(x)];
/** Flow and its differential. Linear fields are exact; wave integrates the variational equation. */
export function lieFlow(key,p,t,per=100) {
 const [x,y]=p;
 if(key==='rot'){const c=Math.cos(t),s=Math.sin(t);return {q:[c*x-s*y,s*x+c*y],D:[[c,-s],[s,c]]};}
 if(key==='dil'){const a=Math.exp(t/2);return {q:[a*x,a*y],D:[[a,0],[0,a]]};}
 if(key==='shear')return {q:[x+t*y,y],D:[[1,t],[0,1]]};
 const X=LIE_FIELDS[key],z=flowN(z=>{const f=X.f(z[0],z[1]),A=X.J(z[0],z[1]);return [...f,A[0][0]*z[2]+A[0][1]*z[4],A[0][0]*z[3]+A[0][1]*z[5],A[1][0]*z[2]+A[1][1]*z[4],A[1][0]*z[3]+A[1][1]*z[5]];},[x,y,1,0,0,1],t,Math.max(4,Math.ceil(Math.abs(t)*per)));
 return {q:z.slice(0,2),D:[z.slice(2,4),z.slice(4,6)]};
}
export function liePullback(key,p,t) {
 const {q,D:[[a,b],[c,d]]}=lieFlow(key,p,t),v=lieVector(...q),det=a*d-b*c;
 return [(d*v[0]-b*v[1])/det,(-c*v[0]+a*v[1])/det];
}
export function lieExact(key,kind,p,w=[1,0]) {
 const [x,y]=p,X=LIE_FIELDS[key],u=X.f(x,y),A=X.J(x,y);
 if(kind==='f'){const g=lieFunctionGradient(x,y);return g[0]*u[0]+g[1]*u[1];}
 if(kind==='Y'){const v=lieVector(x,y);return [-.8*Math.sin(y)*u[1]-A[0][0]*v[0]-A[0][1]*v[1],.8*Math.cos(x)*u[0]-A[1][0]*v[0]-A[1][1]*v[1]];}
 return 2*(w[0]*(A[0][0]*w[0]+A[0][1]*w[1])+w[1]*(A[1][0]*w[0]+A[1][1]*w[1]));
}
/** At t=0 the displayed quotient is its analytic limiting derivative, explicitly labeled. */
export function lieQuotient(key,kind,p,t,w=[1,0]) {
 if(t===0)return lieExact(key,kind,p,w);
 if(kind==='f'){const {q}=lieFlow(key,p,t);return (lieFunction(...q)-lieFunction(...p))/t;}
 if(kind==='Y'){const a=liePullback(key,p,t),b=lieVector(...p);return a.map((x,i)=>(x-b[i])/t);}
 if(key==='rot')return 0;
 if(key==='dil')return Math.expm1(t)/t*(w[0]*w[0]+w[1]*w[1]);
 if(key==='shear')return 2*w[0]*w[1]+t*w[1]*w[1];
 const {D}=lieFlow(key,p,t),a=D[0][0]*w[0]+D[0][1]*w[1],b=D[1][0]*w[0]+D[1][1]*w[1];return (a*a+b*b-w[0]*w[0]-w[1]*w[1])/t;
}
