// Quantum Mechanics — Chapter 7: helpers shared by ch07.js, ch07-b.js and ch07-c.js.
// ħ = 1 throughout (angular momenta are pure numbers). Re-exports the chapter 6 helpers (complex matrices, spin matrices,
// Bloch-sphere frame, phase colours, …) and adds spherical harmonics, a view of a function on the sphere, and
// Clebsch–Gordan coefficients (Racah's formula, and by lowering from the top state).
export * from './ch06.shared.js';
import { cabs2, carg, cis, spinOps, propagator, mvec, spinAlong, basis } from './ch06.shared.js';

const fact = (n) => { let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
const half = (x) => Math.round(2 * x) / 2;

/** Associated Legendre P_l^m(x) with the Condon–Shortley phase, m ≥ 0. */
export function legendreP(l, m, x) {
  let pmm = 1;
  if (m > 0) { const s = Math.sqrt(Math.max(0, (1 - x) * (1 + x))); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
  if (l === m) return pmm;
  let pm1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pm1;
  let pl = 0;
  for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * pm1 - (ll + m - 1) * pmm) / (ll - m); pmm = pm1; pm1 = pl; }
  return pl;
}
/** Y_l^m(θ, φ) = N P_l^m(cos θ) e^{imφ} (Condon–Shortley), as [re, im]. */
export function ylm(l, m, th, ph) {
  const am = Math.abs(m), N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * fact(l - am) / fact(l + am));
  let P = N * legendreP(l, am, Math.cos(th)), c = [P * Math.cos(am * ph), P * Math.sin(am * ph)];
  if (m < 0) { const s = am % 2 ? -1 : 1; c = [s * c[0], -s * c[1]]; } // Y_l^{-m} = (−1)^m conj(Y_l^m)
  return c;
}
/** Real combination: m>0 → √2 Re Y_l^m (cos), m<0 → √2 Im Y_l^|m| (sin), 0 → Y_l^0. */
export function realY(l, m, th, ph) {
  if (m === 0) return ylm(l, 0, th, ph)[0];
  const y = ylm(l, Math.abs(m), th, ph), s = Math.abs(m) % 2 ? -1 : 1;
  return Math.SQRT2 * s * (m > 0 ? y[0] : y[1]);
}
/** Σ_m c_m Y_l^m with coefficient vector c ordered m = l, l−1, …, −l (as spinOps(l) basis). */
export function ySum(l, c, th, ph) {
  let re = 0, im = 0;
  for (let i = 0; i < c.length; i++) { const y = ylm(l, l - i, th, ph); re += c[i][0] * y[0] - c[i][1] * y[1]; im += c[i][0] * y[1] + c[i][1] * y[0]; }
  return [re, im];
}

// ------------------------------------------------------------------ view of a function on the sphere
/** Unit vector of the view direction pieces: map screen (x, y, depth z toward viewer) to world coordinates. */
export function viewToWorld(x, y, z, yaw, tilt) {
  let p = [x, -z, y]; // z (world) is "up" on the screen at tilt = 0
  const c = Math.cos(tilt), s = Math.sin(tilt);
  p = [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [p[0] * cy - p[1] * sy, p[0] * sy + p[1] * cy, p[2]];
}
/** World point → [screenX, screenY, depth toward viewer]. */
export function worldToView(p, yaw, tilt) {
  const cy = Math.cos(-yaw), sy = Math.sin(-yaw);
  let q = [p[0] * cy - p[1] * sy, p[0] * sy + p[1] * cy, p[2]];
  const c = Math.cos(-tilt), s = Math.sin(-tilt);
  q = [q[0], q[1] * c - q[2] * s, q[1] * s + q[2] * c];
  return [q[0], q[2], -q[1]];
}
/**
 * Paint a function f(θ, φ) → [re, im] (or → number when o.real) on the visible hemisphere of the unit sphere on an
 * equal-aspect stage s. Complex values: hue = arg, brightness = |f|/max; real values: red positive, blue negative.
 * o: {yaw, tilt, key, max, v (viz), res}. Lat/long outline is drawn on top.
 */
export function paintSphere(v, s, f, o) {
  const { yaw = 0.6, tilt = 0.35 } = o, mx = o.max || 1, real = o.real;
  const wheel = real ? null : phaseRGB2(v), bg = v.rgb('panel');
  s.raster((X, Y) => {
    const r2 = X * X + Y * Y; if (r2 > 1) return null;
    const w = viewToWorld(X, Y, Math.sqrt(1 - r2), yaw, tilt), th = Math.acos(Math.max(-1, Math.min(1, w[2]))), ph = Math.atan2(w[1], w[0]);
    const val = f(th, ph), shade = 0.78 + 0.22 * Math.sqrt(1 - r2);
    let col, a;
    if (real) { a = Math.min(1, Math.abs(val) / mx) ** 0.8; col = v.ramp(a, val >= 0 ? 'red' : 'accent'); }
    else { a = Math.min(1, Math.hypot(val[0], val[1]) / mx) ** 0.8; const c = wheel(Math.atan2(val[1], val[0]) + 4 * Math.PI); col = [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a]; }
    return [col[0] * shade, col[1] * shade, col[2] * shade];
  }, { res: o.res ?? 2, key: o.key });
  s.circle(0, 0, 1, { color: 'muted', width: 1.2, alpha: 0.7 });
  // equator and prime meridian, front side solid, back side faint
  for (const [fn, col] of [[(a) => [Math.cos(a), Math.sin(a), 0], 'faint'], [(a) => [Math.cos(a), 0, Math.sin(a)], 'faint'], [(a) => [0, Math.cos(a), Math.sin(a)], 'faint']]) {
    let seg = [];
    for (let k = 0; k <= 96; k++) { const q = worldToView(fn((2 * Math.PI * k) / 96), yaw, tilt); if (q[2] > 0) seg.push([q[0], q[1]]); else { if (seg.length > 1) s.path(seg, { color: col, width: 1, alpha: 0.7 }); seg = []; } }
    if (seg.length > 1) s.path(seg, { color: col, width: 1, alpha: 0.7 });
  }
  for (const [p, t] of [[[0, 0, 1], 'z'], [[1, 0, 0], 'x'], [[0, 1, 0], 'y']]) {
    const q = worldToView(p.map((x) => x * 1.16), yaw, tilt); if (q[2] > -0.2) s.text(t, q[0], q[1], { color: 'muted', math: true, size: 13, align: 'center', baseline: 'middle' });
  }
}
import { phaseRGB } from './ch06.shared.js';
function phaseRGB2(v) { return phaseRGB(v, 90); }

// Gauss-Legendre nodes in cos(theta): avoids the endpoint bias of a theta midpoint grid.
const quadratures = new Map();
function polarQuadrature(n) {
  if (quadratures.has(n)) return quadratures.get(n);
  const out=[];
  for(let i=0;i<n;i++){
    let x=Math.cos(Math.PI*(i+.75)/(n+.5)),d=0;
    for(let k=0;k<30;k++){
      let p0=1,p1=x;for(let l=2;l<=n;l++){const p=((2*l-1)*x*p1-(l-1)*p0)/l;p0=p1;p1=p;}
      d=n*(x*p1-p0)/(x*x-1);const dx=p1/d;x-=dx;if(Math.abs(dx)<2e-15)break;
    }
    out.push([Math.acos(x),2/((1-x*x)*d*d)]);
  }
  quadratures.set(n,out);return out;
}
/** ∫ f(θ,φ) conj(g(θ,φ)) dΩ by Gauss-Legendre in cosθ and periodic trapezoid in φ. */
export function sphereIP(f,g,nt=64,np=96){
  let re=0,im=0;
  for(const[th,wt]of polarQuadrature(nt))for(let j=0;j<np;j++){
    const ph=((j+.5)*2*Math.PI)/np,w=wt*2*Math.PI/np,a=f(th,ph),b=g(th,ph);
    re+=w*(a[0]*b[0]+a[1]*b[1]);im+=w*(a[1]*b[0]-a[0]*b[1]);
  }
  return[re,im];
}

// ------------------------------------------------------------------ Clebsch–Gordan
/** ⟨j1 m1; j2 m2 | J M⟩ by Racah's formula (Condon–Shortley convention). */
export function cg(j1, m1, j2, m2, J, M) {
  const integer=x=>Number.isFinite(x)&&Math.abs(x-Math.round(x))<1e-9;
  if([j1,j2,J].some(x=>x<0||!integer(2*x))||!integer(j1-m1)||!integer(j2-m2)||!integer(J-M)||!integer(j1+j2-J))return 0;
  if (Math.abs(m1 + m2 - M) > 1e-9 || J < Math.abs(j1 - j2) - 1e-9 || J > j1 + j2 + 1e-9) return 0;
  if (Math.abs(m1) > j1 + 1e-9 || Math.abs(m2) > j2 + 1e-9 || Math.abs(M) > J + 1e-9) return 0;
  const f = (x) => fact(Math.round(x));
  const pre = Math.sqrt(((2 * J + 1) * f(J + j1 - j2) * f(J - j1 + j2) * f(j1 + j2 - J)) / f(j1 + j2 + J + 1)) *
    Math.sqrt(f(J + M) * f(J - M) * f(j1 - m1) * f(j1 + m1) * f(j2 - m2) * f(j2 + m2));
  let sum = 0;
  for (let k = 0; k <= 60; k++) {
    const a = j1 + j2 - J - k, b = j1 - m1 - k, c = j2 + m2 - k, d = J - j2 + m1 + k, e = J - j1 - m2 + k;
    if (a < -1e-9 || b < -1e-9 || c < -1e-9) { if (a < -1e-9) break; continue; }
    if (d < -1e-9 || e < -1e-9) continue;
    sum += ((k % 2) ? -1 : 1) / (f(k) * f(a) * f(b) * f(c) * f(d) * f(e));
  }
  return pre * sum;
}
/** Product-basis index lists: states |m1, m2⟩ ordered m1 = j1…−j1 (outer), m2 = j2…−j2 (inner). */
export function productBasis(j1, j2) {
  const out = [];
  for (let a = 0; a <= Math.round(2 * j1); a++) for (let b = 0; b <= Math.round(2 * j2); b++) out.push({ m1: j1 - a, m2: j2 - b });
  return out;
}
/**
 * The coupled basis |J M⟩ built the way a table is made by hand: highest state |j1+j2, j1+j2⟩ = |j1 j1⟩|j2 j2⟩ lowered with
 * J₋ = J₁₋ + J₂₋; each new J starts from the vector in the M = J subspace orthogonal to the states already built and
 * with ⟨j1 j1; j2 J−j1|J J⟩ > 0. Returns {basis (product states), vec(J, M) → real vector, J list}.
 */
export function cgByLowering(j1, j2) {
  const pb = productBasis(j1, j2), n = pb.length, idx = new Map(pb.map((b, i) => [`${b.m1}|${b.m2}`, i]));
  const lower = (vec) => { // J₋ on a product-basis vector (unnormalised)
    const out = new Array(n).fill(0);
    pb.forEach((b, i) => {
      const c = vec[i]; if (!c) return;
      const t1 = Math.sqrt(j1 * (j1 + 1) - b.m1 * (b.m1 - 1)), t2 = Math.sqrt(j2 * (j2 + 1) - b.m2 * (b.m2 - 1));
      if (t1 > 1e-12) out[idx.get(`${b.m1 - 1}|${b.m2}`)] += c * t1;
      if (t2 > 1e-12) out[idx.get(`${b.m1}|${b.m2 - 1}`)] += c * t2;
    });
    return out;
  };
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), table = {}, Js = [];
  for (let J = j1 + j2; J >= Math.abs(j1 - j2) - 1e-9; J -= 1) {
    // M = J subspace
    const sub = pb.map((b, i) => (Math.abs(b.m1 + b.m2 - J) < 1e-9 ? i : -1)).filter((i) => i >= 0);
    let top = null;
    if (J === j1 + j2) { top = new Array(n).fill(0); top[sub[0]] = 1; } else {
      // orthogonal complement within the subspace of the |J' J⟩, J' > J, via Gram–Schmidt on basis vectors
      const prev = []; for (let Jp = J + 1; Jp <= j1 + j2 + 1e-9; Jp += 1) prev.push(table[Jp][J]);
      const cands = sub.map((i) => { const e = new Array(n).fill(0); e[i] = 1; return e; });
      const ortho = [];
      for (const c of cands) { let w = c.slice(); for (const p of [...prev, ...ortho]) { const d = dot(w, p); w = w.map((x, i) => x - d * p[i]); } const nn = Math.sqrt(dot(w, w)); if (nn > 1e-9) ortho.push(w.map((x) => x / nn)); }
      // the single remaining direction (dimension counting); fix its sign
      top = ortho[ortho.length - 1];
      const iTop = idx.get(`${j1}|${J - j1}`); // component with m1 = j1
      if (iTop !== undefined && top[iTop] < 0) top = top.map((x) => -x);
    }
    table[J] = {}; Js.push(J);
    let cur = top;
    for (let M = J; M >= -J - 1e-9; M -= 1) {
      table[J][M] = cur;
      if (M > -J + 1e-9) { const nx = lower(cur), nrm = Math.sqrt(dot(nx, nx)); cur = nx.map((x) => x / nrm); }
    }
  }
  return { basis: pb, vec: (J, M) => table[J][M], Js, index: idx };
}
