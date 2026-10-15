// Logic & Foundations — Chapter 1: helpers shared by ch01.js and ch01-b.js.
// Real algebraic numbers listed by Cantor's height (1874): N = n − 1 + |a0| + |a1| + … + |an| for the
// irreducible, primitive equation a0·xⁿ + a1·xⁿ⁻¹ + … + an = 0 with a0 > 0.

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

function evalP(c, x) { let s = 0; for (let i = 0; i < c.length; i++) s = s * x + c[i]; return s; }
function deriv(c) { const n = c.length - 1, d = new Array(n); for (let i = 0; i < n; i++) d[i] = c[i] * (n - i); return d; }

/** Real roots of a polynomial with simple real roots (coefficients leading first): isolate between critical points, bisect. */
export function realRoots(c) {
  const n = c.length - 1;
  if (n < 1) return [];
  if (n === 1) return [-c[1] / c[0]];
  let B = 0; for (let i = 1; i <= n; i++) B = Math.max(B, Math.abs(c[i] / c[0])); B += 1;
  const crit = realRoots(deriv(c)).filter((x) => x > -B && x < B).sort((a, b) => a - b);
  const pts = [-B, ...crit, B], out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    let a = pts[i], b = pts[i + 1], fa = evalP(c, a); const fb = evalP(c, b);
    if (fa === 0) { out.push(a); continue; }
    if (fb === 0) { if (i + 2 === pts.length) out.push(b); continue; }
    if ((fa > 0) === (fb > 0)) continue;
    for (let k = 0; k < 120; k++) {
      const m = 0.5 * (a + b); if (m <= a || m >= b) break;
      const fm = evalP(c, m); if (fm === 0) { a = b = m; break; }
      if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
    }
    out.push(0.5 * (a + b));
  }
  return out;
}

function divisors(n) { n = Math.abs(n); const d = []; for (let k = 1; k * k <= n; k++) if (n % k === 0) { d.push(k); if (k * k !== n) d.push(n / k); } return d; }
/** Exact rational root test (integer arithmetic). */
function hasRationalRoot(c) {
  const n = c.length - 1; if (c[n] === 0) return true;
  const P = divisors(c[n]), Q = divisors(c[0]);
  for (const q of Q) for (const p of P) for (const s of [1, -1]) {
    let acc = c[0], qp = 1;
    for (let i = 1; i <= n; i++) { qp *= q; acc = acc * (s * p) + c[i] * qp; }
    if (acc === 0) return true;
  }
  return false;
}
/** All complex roots (Durand–Kerner). */
function complexRoots(c) {
  const n = c.length - 1, a = c.map((x) => x / c[0]), zr = new Float64Array(n), zi = new Float64Array(n);
  let R = 0; for (let k = 1; k <= n; k++) R = Math.max(R, Math.abs(a[k])); R += 1;
  for (let i = 0; i < n; i++) { const t = (2 * Math.PI * i) / n + 0.37; zr[i] = 0.7 * R * Math.cos(t); zi[i] = 0.7 * R * Math.sin(t); }
  for (let it = 0; it < 600; it++) {
    let mx = 0;
    for (let i = 0; i < n; i++) {
      let vr = 1, vi = 0;
      for (let k = 1; k <= n; k++) { const t = vr * zr[i] - vi * zi[i] + a[k]; vi = vr * zi[i] + vi * zr[i]; vr = t; }
      let dr = 1, di = 0;
      for (let j = 0; j < n; j++) if (j !== i) { const xr = zr[i] - zr[j], xi = zi[i] - zi[j]; const t = dr * xr - di * xi; di = dr * xi + di * xr; dr = t; }
      const d2 = dr * dr + di * di, qr = (vr * dr + vi * di) / d2, qi = (vi * dr - vr * di) / d2;
      zr[i] -= qr; zi[i] -= qi; mx = Math.max(mx, Math.abs(qr) + Math.abs(qi));
    }
    if (mx < 1e-13) break;
  }
  return [zr, zi];
}
/** Does the polynomial have an integer factor of degree k (2 ≤ k ≤ n/2)? Test products of k roots, scaled by divisors of a0. */
function hasFactor(c) {
  const n = c.length - 1, [zr, zi] = complexRoots(c), D = divisors(c[0]);
  let found = false;
  const rec = (start, k, pr, pi, depth) => {
    if (found) return;
    if (depth === k) {
      for (const d of D) {
        let ok = true;
        for (let j = 0; j < pr.length && ok; j++) if (Math.abs(pi[j] * d) > 1e-6 || Math.abs(pr[j] * d - Math.round(pr[j] * d)) > 1e-6) ok = false;
        if (ok) { found = true; return; }
      }
      return;
    }
    for (let i = start; i < n && !found; i++) {
      const L = pr.length, nr = new Array(L + 1).fill(0), ni = new Array(L + 1).fill(0);
      for (let j = 0; j < L; j++) { nr[j] += pr[j]; ni[j] += pi[j]; nr[j + 1] -= pr[j] * zr[i] - pi[j] * zi[i]; ni[j + 1] -= pr[j] * zi[i] + pi[j] * zr[i]; }
      rec(i + 1, k, nr, ni, depth + 1);
    }
  };
  for (let k = 2; k <= Math.floor(n / 2) && !found; k++) rec(0, k, [1], [0], 0);
  return found;
}
/** Irreducible over ℚ (for a primitive integer polynomial). Degree ≤ 3: no rational root; higher: no factor of degree ≤ n/2. */
export function irreducible(c) {
  const n = c.length - 1;
  if (n === 1) return true;
  if (hasRationalRoot(c)) return false;
  return n <= 3 ? true : !hasFactor(c);
}

/** Every coefficient vector (leading first, a0 > 0) of Cantor height exactly N. */
function polysOfHeight(N, out) {
  for (let n = 1; n <= N; n++) {
    const S = N - n + 1, c = new Array(n + 1).fill(0);
    const rec = (i, rem) => {
      if (i === n) { if (rem === 0) { c[i] = 0; out.push(c.slice()); } else { c[i] = rem; out.push(c.slice()); c[i] = -rem; out.push(c.slice()); } return; }
      for (let a = i === 0 ? 1 : 0; a <= rem; a++) {
        if (a === 0) { c[i] = 0; rec(i + 1, rem); }
        else { c[i] = a; rec(i + 1, rem - a); if (i > 0) { c[i] = -a; rec(i + 1, rem - a); } }
      }
    };
    rec(0, S);
  }
  return out;
}

const ALG = []; // ALG[N − 1] = real algebraic numbers of height N, ascending: {x, h, poly}
/** Real algebraic numbers of height 1 … Nmax (cached), each list ascending as in Cantor's §1. */
export function algebraicByHeight(Nmax) {
  while (ALG.length < Nmax) {
    const N = ALG.length + 1, list = [];
    for (const c of polysOfHeight(N, [])) {
      let g = 0; for (const a of c) g = gcd(g, a);
      if (g !== 1 || !irreducible(c)) continue;
      for (const x of realRoots(c)) list.push({ x, h: N, poly: c });
    }
    list.sort((a, b) => a.x - b.x);
    ALG.push(list);
  }
  return ALG.slice(0, Nmax);
}
/** Cantor's list ω1, ω2, … up to height Nmax: by height, ascending within a height. Entries get .k (1-based position). */
export function cantorList(Nmax) {
  const out = [];
  for (const L of algebraicByHeight(Nmax)) for (const e of L) out.push(e);
  out.forEach((e, i) => { e.k = i + 1; });
  return out;
}
/** TeX for a0 xⁿ + … + an (leading first). */
export function polyTex(c, v = 'x') {
  const n = c.length - 1; let s = '';
  c.forEach((a, i) => {
    if (a === 0) return;
    const p = n - i, abs = Math.abs(a);
    const mon = p === 0 ? String(abs) : (abs === 1 ? '' : abs) + v + (p > 1 ? `^{${p}}` : '');
    s += s ? (a < 0 ? ' - ' : ' + ') + mon : (a < 0 ? '-' : '') + mon;
  });
  return s || '0';
}

export const SUBS = '₀₁₂₃₄₅₆₇₈₉';
export const sub = (k) => String(k).split('').map((d) => SUBS[+d] ?? d).join('');
