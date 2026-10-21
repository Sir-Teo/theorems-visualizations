// Manifolds & Riemannian Geometry — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
export * from './ch02.shared.js';
import { TAU } from './ch02.shared.js';

/** Singular values (large, small) of a 2x2 matrix given as rows. */
export function sv2(A) {
  const p = A[0][0] * A[0][0] + A[1][0] * A[1][0], q = A[0][0] * A[0][1] + A[1][0] * A[1][1], r = A[0][1] * A[0][1] + A[1][1] * A[1][1];
  const tr = p + r, d = Math.sqrt(Math.max(0, (tr * tr) / 4 - (p * r - q * q)));
  return [Math.sqrt(tr / 2 + d), Math.sqrt(Math.max(0, tr / 2 - d))];
}

/** Torus of revolution (big radius R, tube radius r) and its outward unit normal; (a, b) are the two angles. */
export const torusPt = (a, b, R = 1.25, r = 0.5) => [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)];
export const torusN = (a, b) => [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];

/** Number of maximal runs of true in a boolean array (cyclic when `cyc`). */
export function runs(flags, cyc) {
  let n = 0;
  for (let i = 0; i < flags.length; i++) if (flags[i] && !(i > 0 ? flags[i - 1] : cyc ? flags[flags.length - 1] : false)) n++;
  if (cyc && n === 0 && flags.length && flags.every(Boolean)) n = 1;
  return n;
}

/** Newton projection of (x, y) onto the zero set of g (gradient by differences); returns [x, y, |grad|]. */
export function project0(g, x, y, it = 30) {
  const h = 1e-6;
  let gx = 0, gy = 0;
  for (let k = 0; k < it; k++) {
    const val = g(x, y);
    gx = (g(x + h, y) - g(x - h, y)) / (2 * h); gy = (g(x, y + h) - g(x, y - h)) / (2 * h);
    const n2 = gx * gx + gy * gy;
    if (n2 < 1e-14) break;
    x -= (val * gx) / n2; y -= (val * gy) / n2;
    if (Math.abs(val) < 1e-12) break;
  }
  return [x, y, Math.hypot(gx, gy)];
}

/** Marsaglia-free tiny helper: wrap an angle difference into (-pi, pi]. */
export const adiff = (a) => { let d = ((a % TAU) + TAU) % TAU; if (d > Math.PI) d -= TAU; return d; };

/** Exact critical data for tilted height on the torus of revolution (R=1.25, r=.5). */
export function torusHeightData(tau) {
 const s=Math.sin(tau),c=Math.cos(tau),h=(a,b)=>s*(1.25+.5*Math.cos(b))*Math.cos(a)+.5*c*Math.sin(b);
 if(tau===0)return {h,critical:[],degenerate:true};
 const beta=Math.PI/2-tau;
 const critical=[[0,beta],[Math.PI,Math.PI-beta],[Math.PI,-beta],[0,beta-Math.PI]].map(([a,b])=>{
  b=((b%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
  const haa=-s*(1.25+.5*Math.cos(b))*Math.cos(a),hbb=-.5*(s*Math.cos(a)*Math.cos(b)+c*Math.sin(b));
  const l=[haa,hbb].sort((a,b)=>a-b);return {a,b,val:h(a,b),H:[[haa,0],[0,hbb]],l,idx:l.filter(x=>x<0).length};
 }).sort((p,q)=>p.val-q.val);
 return {h,critical,degenerate:false};
}
