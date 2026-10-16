// Number Theory — Chapter 2 shared helpers (plain functions, no imports).
export const PAL = ['blue', 'teal', 'purple', 'orange', 'pink', 'gold', 'green', 'red'];
/** Palette colour for residue class k. */
export const pcol = (k) => PAL[((k % 8) + 8) % 8];
export const mod = (a, n) => ((a % n) + n) % n;
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
/** b^e mod m for Numbers with m < 2^26 (products stay exact). */
export function powmod(b, e, m) { let r = 1 % m; b = mod(b, m); while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; }
export const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
export function primeFactors(n) { const out = []; for (let d = 2; d * d <= n; d++) if (n % d === 0) { out.push(d); while (n % d === 0) n /= d; } if (n > 1) out.push(n); return out; }
export function totient(n) { let r = n; for (const p of primeFactors(n)) r = (r / p) * (p - 1); return r; }
export function divisors(n) { const lo = [], hi = []; for (let d = 1; d * d <= n; d++) if (n % d === 0) { lo.push(d); if (d * d !== n) hi.unshift(n / d); } return lo.concat(hi); }
/** Multiplicative order of a mod n (a coprime to n), or 0. */
export function ord(a, n) { if (n === 1) return 1; if (gcd(a, n) !== 1) return 0; let x = mod(a, n), k = 1; while (x !== 1) { x = (x * a) % n; k++; } return k; }
/** Inverse of a mod n or null. */
export function inv(a, n) { a = mod(a, n); for (let x = 1; x < n; x++) if ((a * x) % n === 1) return x; return n === 1 ? 0 : null; }
/** p-adic valuation of a positive Number. */
export function vp(n, p) { let k = 0; while (n > 0 && n % p === 0) { n /= p; k++; } return k; }
/** Base-p digits, least significant first (at least `len` of them). */
export function digitsOf(n, p, len = 0) { const d = []; while (n > 0) { d.push(n % p); n = Math.floor(n / p); } while (d.length < len) d.push(0); return d; }
/** Position of residue k on a clock with n hours (hour 0 at the top, clockwise), radius R. */
export function clockXY(k, n, R = 1) { const t = Math.PI / 2 - (2 * Math.PI * k) / n; return [R * Math.cos(t), R * Math.sin(t)]; }
/** Draw the clock face: ring of n dots coloured by class, labelled. opts.units marks non-units faintly. */
export function drawClock(S, n, o = {}) {
  const R = o.R ?? 1, lab = o.labels ?? (n <= 36), r = o.r ?? (n <= 24 ? 5 : n <= 48 ? 3.6 : 2.4);
  S.circle(0, 0, R, { color: 'grid', width: 1.2 });
  for (let k = 0; k < n; k++) {
    const [x, y] = clockXY(k, n, R), dim = o.dim && o.dim(k);
    S.dot(x, y, { r, color: o.color ? o.color(k) : pcol(k), alpha: dim ? 0.3 : 1 });
    if (lab) { const [lx, ly] = clockXY(k, n, R + (o.labelGap ?? 0.13)); S.text(String(k), lx, ly, { align: 'center', baseline: 'middle', size: n <= 24 ? 11.5 : 10, color: dim ? 'faint' : 'muted' }); }
  }
}
/** Straight arrow between clock residues i → j (shortened at both ends). */
export function clockArrow(S, i, j, n, o = {}) {
  const [x1, y1] = clockXY(i, n, o.R ?? 1), [x2, y2] = clockXY(j, n, o.R ?? 1);
  if (i === j) { S.circle(x1 * 1.0, y1 * 1.0, 0.07, { color: o.color || 'accent', width: o.width || 1.4, alpha: o.alpha ?? 1 }); return; }
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), sh = (o.shrink ?? 0.05) / L;
  S.arrow(x1 + dx * sh, y1 + dy * sh, x2 - dx * sh, y2 - dy * sh, { color: o.color || 'accent', width: o.width || 1.4, alpha: o.alpha ?? 1, head: o.head ?? 7 });
}
export const sub = (s) => s;
/** Lay `count` square cells out in the pixel area of stage S (view is set to pixel coordinates, y up). */
export function pixGrid(S, count, o = {}) {
  const W = S.width, H = S.height, pad = o.pad ?? 8, top = o.top ?? 0;
  S.setView([0, W], [0, H]);
  let best = null;
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols), cs = Math.min((W - 2 * pad) / cols, (H - 2 * pad - top) / rows, o.max ?? 1e9);
    if (!best || cs > best.cs + 1e-9) best = { cols, rows, cs };
  }
  const { cols, rows, cs } = best, x0 = (W - cols * cs) / 2, y0 = pad + top + (H - 2 * pad - top - rows * cs) / 2;
  const cell = (i) => { const c = i % cols, r = Math.floor(i / cols); const xa = x0 + c * cs, yb = H - (y0 + r * cs); return [xa, yb - cs, xa + cs, yb]; };
  const at = (px, py) => { const c = Math.floor((px - x0) / cs), r = Math.floor((H - py - y0) / cs); if (c < 0 || c >= cols || r < 0 || r >= rows) return -1; const i = r * cols + c; return i < count ? i : -1; };
  return { cols, rows, cs, cell, at };
}
