// Sheldon Axler, Linear Algebra Done Right (4th ed.) — Chapter 4: Polynomials

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');

/** Number for TeX: d decimals, trailing zeros trimmed, never "-0". */
function nm(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const t = Number(x.toFixed(d));
  return t === 0 ? '0' : String(t);
}
/** Same, with a typographic minus (for canvas text and table cells). */
const nmc = (x, d = 2) => nm(x, d).replace('-', '−');
/** (x)^2 in TeX, with brackets around negative numbers. */
const sqT = (x, d = 2) => (Number(x.toFixed(d)) < 0 ? `(${nm(x, d)})^2` : `${nm(x, d)}^2`);
/** a + bi as TeX. */
function cxT(re, im, d = 2) {
  const a = Number(re.toFixed(d)), b = Number(im.toFixed(d));
  if (b === 0) return nm(a, d);
  const bb = Math.abs(b) === 1 ? '' : nm(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bb}i`;
  return `${nm(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
/** The factor (v − λ) as TeX, λ = re + i·im. */
function facT(re, im, v = 'z', d = 2) {
  const a = Number(re.toFixed(d)), b = Number(im.toFixed(d));
  let s = v;
  if (a !== 0) s += ` ${a > 0 ? '-' : '+'} ${nm(Math.abs(a), d)}`;
  if (b !== 0) s += ` ${b > 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : nm(Math.abs(b), d)}i`;
  return `(${s})`;
}
/** Real polynomial with ascending coefficients c, as TeX in the variable v. */
function polyT(c, v = 'x', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const a = Number(c[k].toFixed(d)); if (a === 0) continue;
    const mag = Math.abs(a) === 1 && k > 0 ? '' : nm(Math.abs(a), d);
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    s += s ? ` ${a < 0 ? '-' : '+'} ${mag}${mon}` : `${a < 0 ? '-' : ''}${mag}${mon}`;
  }
  return s || '0';
}
/** Complex polynomial (ascending real and imaginary parts) as TeX. */
function polyCT(cr, ci, v = 'z', d = 2) {
  let s = '';
  for (let k = cr.length - 1; k >= 0; k--) {
    const a = Number(cr[k].toFixed(d)), b = Number(ci[k].toFixed(d)); if (a === 0 && b === 0) continue;
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    let term, neg = false;
    if (b === 0) { neg = a < 0; term = (Math.abs(a) === 1 && k ? '' : nm(Math.abs(a), d)) + mon; }
    else if (a === 0) { neg = b < 0; term = (Math.abs(b) === 1 ? '' : nm(Math.abs(b), d)) + 'i' + mon; }
    else term = `(${cxT(a, b, d)})${mon}`;
    s += s ? ` ${neg ? '-' : '+'} ${term}` : `${neg ? '-' : ''}${term}`;
  }
  return s || '0';
}
/** c·z^e as TeX. */
function monoT(c, e, v = 'z') {
  const a = Number(c.toFixed(2)), mon = e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`;
  if (a === 0) return '0';
  if (Math.abs(a) === 1 && e > 0) return (a < 0 ? '-' : '') + mon;
  return nm(a) + mon;
}

/** Value of a real polynomial (ascending coefficients) at x (Horner). */
const pval = (c, x) => { let s = 0; for (let k = c.length - 1; k >= 0; k--) s = s * x + c[k]; return s; };
/** Divide c (ascending) by (x − λ): quotient q (ascending) and remainder r = c(λ) — synthetic division. */
function deflate(c, lam) {
  const n = c.length - 1, q = new Array(Math.max(0, n)).fill(0);
  let b = c[n];
  for (let k = n - 1; k >= 0; k--) { q[k] = b; b = c[k] + lam * b; }
  return { q, r: b };
}
/** Degree of a real coefficient list (−1 for the zero polynomial). */
function degOf(c, tol = 1e-10) {
  const big = Math.max(1, ...c.map(Math.abs));
  let n = c.length - 1;
  while (n >= 0 && Math.abs(c[n]) <= tol * big) n--;
  return n;
}
/** Value at x + iy of the polynomial with complex coefficients cr + i·ci (ascending). */
function cEval(cr, ci, x, y) {
  let re = 0, im = 0;
  for (let k = cr.length - 1; k >= 0; k--) { const t = re * x - im * y + cr[k]; im = re * y + im * x + (ci ? ci[k] : 0); re = t; }
  return [re, im];
}
/**
 * All complex zeros of cr + i·ci (ascending coefficients) by the Weierstrass–Durand–Kerner iteration.
 * Leading coefficients that are (numerically) zero are dropped first. `init` (a previous answer of the same
 * length) warm-starts the iteration so that the zeros keep their identity while the coefficients move.
 */
function cRoots(cr, ci, init) {
  ci = ci || cr.map(() => 0);
  let n = cr.length - 1, big = 0;
  for (let k = 0; k <= n; k++) big = Math.max(big, Math.hypot(cr[k], ci[k]));
  while (n > 0 && Math.hypot(cr[n], ci[n]) <= 1e-12 * big) n--;
  if (n < 1 || big === 0) return [];
  const d = cr[n] * cr[n] + ci[n] * ci[n], ar = [], ai = [];
  for (let k = 0; k <= n; k++) { ar.push((cr[k] * cr[n] + ci[k] * ci[n]) / d); ai.push((ci[k] * cr[n] - cr[k] * ci[n]) / d); }
  let zr, zi;
  if (init && init.length === n && init.every((p) => isFinite(p[0]) && isFinite(p[1]))) {
    zr = init.map((p) => p[0]); zi = init.map((p) => p[1]);
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (Math.hypot(zr[i] - zr[j], zi[i] - zi[j]) < 1e-7) { zr[i] += 1e-4 * (i + 1); zi[i] += 1e-4; }
  } else {
    let R = 1e-3; for (let k = 0; k < n; k++) R = Math.max(R, 1.2 * Math.pow(Math.hypot(ar[k], ai[k]), 1 / (n - k)));
    zr = []; zi = []; for (let k = 0; k < n; k++) { const t = (TAU * k) / n + 0.4; zr.push(R * Math.cos(t)); zi.push(R * Math.sin(t)); }
  }
  for (let it = 0; it < 800; it++) {
    let mx = 0;
    for (let i = 0; i < n; i++) {
      let pr = 1, pi = 0;
      for (let k = n - 1; k >= 0; k--) { const t = pr * zr[i] - pi * zi[i] + ar[k]; pi = pr * zi[i] + pi * zr[i] + ai[k]; pr = t; }
      let qr = 1, qi = 0;
      for (let j = 0; j < n; j++) if (j !== i) { const dr = zr[i] - zr[j], di = zi[i] - zi[j], t = qr * dr - qi * di; qi = qr * di + qi * dr; qr = t; }
      const qd = qr * qr + qi * qi || 1e-300, wr = (pr * qr + pi * qi) / qd, wi = (pi * qr - pr * qi) / qd;
      zr[i] -= wr; zi[i] -= wi; mx = Math.max(mx, Math.hypot(wr, wi) / (1 + Math.hypot(zr[i], zi[i])));
    }
    if (mx < 1e-15) break;
  }
  return zr.map((x, i) => [x, zi[i]]);
}
/** Coefficients (ascending, complex) of c·∏(z − λ_k). */
function cFromRoots(roots, c = [1, 0]) {
  let cr = [c[0]], ci = [c[1]];
  for (const [a, b] of roots) {
    const nr = new Array(cr.length + 1).fill(0), ni = new Array(cr.length + 1).fill(0);
    for (let k = 0; k < cr.length; k++) { nr[k + 1] += cr[k]; ni[k + 1] += ci[k]; nr[k] -= a * cr[k] - b * ci[k]; ni[k] -= a * ci[k] + b * cr[k]; }
    cr = nr; ci = ni;
  }
  return { cr, ci };
}
/** The distinct real numbers among complex zeros, sorted. */
function realZeros(roots, tol = 1e-6) {
  const xs = roots.filter(([x, y]) => Math.abs(y) < tol * (1 + Math.abs(x))).map(([x]) => x).sort((a, b) => a - b);
  const out = [];
  for (const x of xs) if (!out.length || Math.abs(x - out[out.length - 1]) > 1e-5) out.push(x);
  return out;
}
/** Phase portrait of f(x, y) → [re, im] on the whole stage, washed towards the panel colour so overlays stay legible. */
function phase(S, f, key, fade = 0.25) {
  S.domain((z) => f(z.re, z.im), { key, res: 2 });
  if (fade > 0) { const b = S.bounds; S.rect(b.x[0], b.y[0], b.x[1], b.y[1], { fill: 'panel', fillAlpha: fade, stroke: false }); }
}
/** Small filled arrowhead at (x, y) pointing along (dx, dy) — for orienting curves. */
function chevron(v, S, x, y, dx, dy, color = 'ink', size = 9) {
  const X = S.X(x), Y = S.Y(y);
  let ux = S.X(x + dx) - X, uy = S.Y(y + dy) - Y; const L = Math.hypot(ux, uy); if (!(L > 1e-9)) return;
  ux /= L; uy /= L;
  const c = S.ctx; c.save(); c.beginPath();
  c.moveTo(X + ux * size * 0.6, Y + uy * size * 0.6);
  c.lineTo(X - ux * size * 0.5 - uy * size * 0.5, Y - uy * size * 0.5 + ux * size * 0.5);
  c.lineTo(X - ux * size * 0.5 + uy * size * 0.5, Y - uy * size * 0.5 - ux * size * 0.5);
  c.closePath(); c.fillStyle = v.color(color); c.fill(); c.restore();
}
/** Winding number (unrounded) of the closed polygon P about the origin. */
function windingOf(P) {
  let tot = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    let d = Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
    if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; tot += d;
  }
  return tot / TAU;
}
/** A small × marker. */
function xMark(S, x, y, color = 'ink', size = 6) {
  const X = S.X(x), Y = S.Y(y);
  S.line(S.invX(X - size), S.invY(Y - size), S.invX(X + size), S.invY(Y + size), { color, width: 2.4 });
  S.line(S.invX(X - size), S.invY(Y + size), S.invX(X + size), S.invY(Y - size), { color, width: 2.4 });
}

/** Long division of p by s (ascending coefficients), recorded as frames for the step player. */
function longDivide(p, sRaw) {
  const m = degOf(sRaw), n = p.length - 1;
  if (m < 0) return { fail: true, n, m, frames: [{ fail: true, note: String.raw`$s = 0$: the theorem needs $s \ne 0$. Since $\deg 0 = -\infty$, no remainder could ever satisfy $\deg r < \deg s$.` }] };
  const s = sRaw.slice(0, m + 1), frames = [];
  let r = p.slice(); const q = new Array(Math.max(0, n - m + 1)).fill(0);
  const sT = polyT(s, 'z');
  if (n < m) {
    frames.push({ phase: 'done', r: r.slice(), q: [0], note: String.raw`$\deg p = ${n} < ${m} = \deg s$: nothing to divide — $q = 0$ and $r = p$.` });
    return { s, n, m, q: [0], r, frames };
  }
  frames.push({ phase: 'start', r: r.slice(), q: q.slice(), note: String.raw`Divide $p$ by $s = ${sT}$. Start with $r = p$; each step cancels the leading term of $r$ with a multiple of $s$.` });
  for (let e = n - m; e >= 0; e--) {
    const lead = r[e + m], c = lead / s[m];
    frames.push({ phase: 'choose', e, c, r: r.slice(), q: q.slice(), note: String.raw`The $z^{${e + m}}$ coefficient of $r$ is $${nm(lead)}$; dividing by the leading coefficient $${nm(s[m])}$ of $s$ gives the next quotient term $${monoT(c, e)}$.` });
    q[e] = c;
    const sb = new Array(n + 1).fill(0); for (let k = 0; k <= m; k++) sb[k + e] = c * s[k];
    const r2 = r.map((x, k) => x - sb[k]); r2[e + m] = 0;
    frames.push({ phase: 'sub', e, c, r: r.slice(), sb, r2: r2.slice(), q: q.slice(), note: String.raw`Subtract $(${monoT(c, e)})\cdot s$ from $r$ (add the row $-(${monoT(c, e)})\,s$ column by column): the $z^{${e + m}}$ term cancels, so the degree of $r$ drops.` });
    r = r2;
  }
  const dr = degOf(r);
  frames.push({ phase: 'done', r: r.slice(), q: q.slice(), note: String.raw`$\deg r = ${dr < 0 ? '-\\infty' : dr} < ${m} = \deg s$: stop. Result: $q = ${polyT(q, 'z')}$, $\;r = ${polyT(r, 'z')}$.` });
  return { s, n, m, q, r, frames };
}

export default {
  collection: 'ladr',
  chapter: 4,
  title: 'Polynomials',
  summary: String.raw`A short toolkit chapter that the rest of the book leans on. It records the algebra of complex conjugates and absolute values, shows that zeros of a polynomial correspond to degree-one factors (so a polynomial of degree $m$ has at most $m$ zeros), and proves the division algorithm by a dimension count rather than by computation. The fundamental theorem of algebra then gives complete factorization over $\mathbf C$; pairing each nonreal zero of a real polynomial with its conjugate gives factorization over $\mathbf R$ into linear factors and irreducible quadratics.`,
  items: [
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Complex conjugate and absolute value',
      statement: String.raw`Let $z = a + bi$ with $a, b \in \mathbf R$, so that $\Re z = a$ and $\Im z = b$.
- The **complex conjugate** of $z$ is $\bar z = \Re z - (\Im z)\,i = a - bi$.
- The **absolute value** of $z$ is the nonnegative real number $|z| = \sqrt{(\Re z)^2 + (\Im z)^2} = \sqrt{a^2 + b^2}$.`,
      idea: String.raw`Picture $\mathbf C$ as the plane, with $z = a + bi$ at the point $(a, b)$. Conjugation is the reflection in the real axis: it keeps the real part and flips the sign of the imaginary part, so $\bar z = z$ exactly when $z$ is real. The absolute value is the Euclidean length of the arrow from $0$ to $z$ — Pythagoras applied to the right triangle with legs $\Re z$ and $\Im z$ — and it extends the absolute value of real numbers. Reflection preserves length, which is why $|\bar z| = |z|$ (4.4).`,
      caption: String.raw`Drag $z$. Its conjugate $\bar z$ (purple) is the mirror image across the real axis: the angle flips sign, the real part stays. $|z|$ is the length of the blue arrow — the hypotenuse of the triangle with legs $\Re z$ (orange) and $\Im z$ (teal) — and every point of the dashed circle, $\bar z$ included, has the same absolute value. Drop $z$ on the real axis to see $\bar z = z$.`,
      deps: ['ladr-1.1'],
      tags: ['complex numbers'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Complex_conjugate' },
      viz(v) {
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.25, 2.25], equal: true, height: 380, xlabel: 'Re', ylabel: 'Im' });
        const z = S.handle(1.9, 1.3, { color: 'accent', label: 'z', constrain: (x, y) => [x, Math.abs(y) < 0.07 ? 0 : y] });
        v.render(() => {
          const a = z.x, b = z.y, r = Math.hypot(a, b), th = Math.atan2(b, a);
          S.circle(0, 0, r, { color: 'muted', width: 1.2, dash: [4, 4] });
          S.line(a, b, a, -b, { color: 'purple', width: 1.3, dash: [5, 4] });
          S.line(0, 0, a, 0, { color: 'orange', width: 3.2 });
          S.line(a, 0, a, b, { color: 'teal', width: 3.2 });
          if (Math.abs(a) > 0.35 && Math.abs(b) > 0.35) { const ex = -0.15 * Math.sign(a), ey = 0.15 * Math.sign(b); S.path([[a + ex, 0], [a + ex, ey], [a, ey]], { color: 'muted', width: 1.2 }); }
          if (r > 0.45 && Math.abs(b) > 1e-9) {
            const rr = Math.min(0.6, r * 0.42);
            S.curve((t) => [rr * Math.cos(t), rr * Math.sin(t)], 0, th, { color: 'accent', width: 1.8, n: 60 });
            S.curve((t) => [0.78 * rr * Math.cos(t), 0.78 * rr * Math.sin(t)], 0, -th, { color: 'purple', width: 1.8, n: 60 });
          }
          if (Math.abs(b) > 1e-9) S.arrow(0, 0, a, -b, { color: 'purple', width: 2.2 });
          S.arrow(0, 0, a, b, { color: 'accent', width: 2.8 });
          if (Math.abs(b) > 1e-9) {
            S.dot(a, -b, { color: 'purple', r: 6 });
            S.tex('\\bar z', a, -b, { color: 'purple', align: a >= 0 ? 'left' : 'right', baseline: b > 0 ? 'top' : 'bottom', dx: a >= 0 ? 8 : -8, dy: b > 0 ? 4 : -4, size: 17 });
          }
          // labels: legs on their outer sides, |z| on the side of the arrow away from the triangle
          if (Math.abs(a) > 0.3) S.tex(`\\Re z = ${nm(a)}`, a * 0.6, 0, { color: 'orange', baseline: b >= 0 ? 'top' : 'bottom', dy: b >= 0 ? 7 : -7, size: 14 });
          if (Math.abs(b) > 0.3) S.tex(`\\Im z = ${nm(b)}`, a, b / 2, { color: 'teal', align: a >= 0 ? 'left' : 'right', dx: a >= 0 ? 9 : -9, size: 14 });
          if (r > 0.5) {
            const sgn = a * b >= 0 ? 1 : -1, nx = -Math.sin(th) * sgn, ny = Math.cos(th) * sgn;
            S.tex(`|z| = ${nm(r, 3)}`, a / 2 + nx * 0.34, b / 2 + ny * 0.34, { color: 'accent', size: 14 });
          }
          if (Math.abs(b) < 1e-9) S.corner('z is real, so z̄ = z', 'tl', { color: 'green', weight: 600 });
          v.legend([['accent', '$z$'], ['purple', '$\\bar z$ = mirror image'], ['orange', '$\\Re z$'], ['teal', '$\\Im z$'], ['muted', 'circle $|w| = |z|$', { dash: true }]]);
        });
        v.readout(() => {
          const a = z.x, b = z.y, r = Math.hypot(a, b);
          return `$z = ${cxT(a, b)}$, $\\;\\bar z = ${cxT(a, -b)}$, $\\;|z| = \\sqrt{${sqT(a)} + ${sqT(b)}} = ${nm(r, 3)} = |\\bar z|$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Properties of complex numbers',
      statement: String.raw`For all $w, z \in \mathbf C$:
(a) $z + \bar z = 2\Re z$;
(b) $z - \bar z = 2(\Im z)\,i$;
(c) $z\bar z = |z|^2$;
(d) $\overline{w + z} = \bar w + \bar z$ and $\overline{wz} = \bar w\,\bar z$;
(e) $\bar{\bar z} = z$;
(f) $|\Re z| \le |z|$ and $|\Im z| \le |z|$;
(g) $|\bar z| = |z|$;
(h) $|wz| = |w|\,|z|$;
(i) $|w + z| \le |w| + |z|$ (the triangle inequality).`,
      idea: String.raw`Parts (a)–(e) and (g) are one-line computations with $z = a + bi$, $w = c + di$. (f) holds because $|z|^2 = a^2 + b^2$ dominates both $a^2$ and $b^2$. For (h), compare squares: $|wz|^2 = wz\,\overline{wz} = w\bar w\, z\bar z = |w|^2|z|^2$ by (c) and (d). For (i), expand with (c), (d), (a):
$$|w+z|^2 = |w|^2 + |z|^2 + 2\Re(w\bar z) \le |w|^2 + |z|^2 + 2|w\bar z| = (|w| + |z|)^2,$$
using (f), (h) and (g) in the middle step. Equality forces $w\bar z \ge 0$, i.e. one of $w, z$ is a nonnegative multiple of the other.`,
      caption: String.raw`Drag $w$ (orange) and $z$ (blue) and pick a group of properties; the right panel evaluates both sides live. (a)(b): the rhombus on $z, \bar z$ closes on the real axis at $2\Re z$, the one on $z, -\bar z$ on the imaginary axis. (c)(h): multiplying by $w$ turns the triangle $0, 1, z$ into the similar triangle $0, w, wz$ — lengths multiply, angles add — and $z\bar z$ lands on the positive real axis. (d)(e)(g): reflecting the whole picture commutes with $+$ and $\times$. (f)(i): the triangle $0, w, w+z$; line $z$ up with $w$ (it snaps) to make it flat and reach equality.`,
      deps: ['ladr-4.2', 'ladr-1.3'],
      see: ['pma-1.33'],
      tags: ['complex numbers'],
      viz(v) {
        const mode = v.select('', [
          { value: 'ab', label: '(a)(b)' },
          { value: 'ch', label: '(c)(h)' },
          { value: 'dg', label: '(d)(e)(g)' },
          { value: 'fi', label: '(f)(i)' },
        ], 'fi');
        const S = v.stage({ x: [-3.2, 3.2], y: [-3.15, 3.15], equal: true, height: 400, xlabel: 'Re', ylabel: 'Im', weight: 1.35, title: 'the complex plane' });
        const T = v.stage({ x: [0, 1], y: [0, 1], height: 400, axes: false, minWidth: 250, title: 'both sides, computed' });
        const RAD = 1.5;
        const disk = (x, y) => { const r = Math.hypot(x, y); return r > RAD ? [(x * RAD) / r, (y * RAD) / r] : [x, y]; };
        const w = S.handle(-0.45, 1.3, { color: 'orange', label: 'w', constrain: disk });
        const z = S.handle(1.35, 0.55, {
          color: 'accent', label: 'z', constrain: (x, y) => {
            [x, y] = disk(x, y);
            if (mode.value === 'fi') { const rw = Math.hypot(w.x, w.y), rz = Math.hypot(x, y); if (rw > 0.1 && rz > 0.1 && (x * w.x + y * w.y) / (rw * rz) > Math.cos(0.07)) return [(w.x * rz) / rw, (w.y * rz) / rw]; }
            return [x, y];
          },
        });
        const arc = (r, t0, t1, color, width = 1.6) => { if (Math.abs(t1 - t0) > 0.02) S.curve((t) => [r * Math.cos(t), r * Math.sin(t)], t0, t1, { color, width, n: 60 }); };
        let lines = [];
        v.render(() => {
          const md = mode.value, a = z.x, b = z.y, c = w.x, d = w.y;
          const rz = Math.hypot(a, b), rw = Math.hypot(c, d);
          const wz = [c * a - d * b, c * b + d * a];
          w.visible = md !== 'ab';
          if (md === 'ab') {
            S.poly([[0, 0], [a, b], [2 * a, 0], [a, -b]], { fill: 'green', fillAlpha: 0.08, color: 'green', width: 1, dash: [4, 4] });
            S.poly([[0, 0], [a, b], [0, 2 * b], [-a, b]], { fill: 'orange', fillAlpha: 0.08, color: 'orange', width: 1, dash: [4, 4] });
            S.arrow(0, 0, -a, b, { color: 'purple', width: 1.4, dash: [5, 4] });
            S.arrow(0, 0, a, -b, { color: 'purple', width: 2.2 });
            S.arrow(0, 0, 2 * a, 0, { color: 'green', width: 3 });
            S.arrow(0, 0, 0, 2 * b, { color: 'orange', width: 3 });
            S.arrow(0, 0, a, b, { color: 'accent', width: 2.6 });
            S.tex('\\bar z', a, -b, { color: 'purple', dx: 12, dy: b > 0 ? 10 : -10, size: 16 });
            S.tex('-\\bar z', -a, b, { color: 'purple', dx: -a >= 0 ? 16 : -16, size: 15 });
            if (Math.abs(a) > 0.15) S.tex('2\\operatorname{Re} z', 2 * a, 0, { color: 'green', baseline: b >= 0 ? 'top' : 'bottom', dy: b >= 0 ? 20 : -20, size: 15 });
            if (Math.abs(b) > 0.15) S.tex('2(\\operatorname{Im} z)\\,i', 0, 2 * b, { color: 'orange', baseline: b >= 0 ? 'bottom' : 'top', dy: b >= 0 ? -8 : 8, size: 15 });
            lines = [
              [`z+\\bar z = ${cxT(2 * a, 0)} = 2\\operatorname{Re} z`, true],
              [`z-\\bar z = ${cxT(0, 2 * b)} = 2(\\operatorname{Im} z)\\,i`, true],
            ];
            v.legend([['accent', '$z$'], ['purple', '$\\bar z$, $-\\bar z$'], ['green', '$z+\\bar z$'], ['orange', '$z-\\bar z$']]);
          } else if (md === 'ch') {
            S.poly([[0, 0], [1, 0], [a, b]], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1, alpha: 0.6 });
            S.poly([[0, 0], [c, d], wz], { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1, alpha: 0.7 });
            const tz = Math.atan2(b, a), tw = Math.atan2(d, c);
            arc(0.32, 0, tz, 'accent'); arc(0.46, 0, tw, 'orange'); arc(0.6, tw, tw + tz, 'accent', 2.2);
            S.arrow(0, 0, a, -b, { color: 'purple', width: 1.4, dash: [5, 4] });
            S.arrow(0, 0, c, d, { color: 'orange', width: 2.4 });
            S.arrow(0, 0, a, b, { color: 'accent', width: 2.4 });
            S.arrow(0, 0, wz[0], wz[1], { color: 'green', width: 2.8 });
            S.dot(1, 0, { color: 'ink', r: 3.5, label: '1', labelPos: 's', math: false });
            S.dot(wz[0], wz[1], { color: 'green', r: 5, label: 'wz', labelPos: 'ne' });
            S.dot(rz * rz, 0, { color: 'green', r: 5.5 });
            S.tex('z\\bar z = |z|^2', rz * rz, 0, { color: 'green', baseline: 'top', dy: 20, size: 14 });
            S.tex('\\bar z', a, -b, { color: 'purple', dx: 12, dy: b > 0 ? 10 : -10, size: 15 });
            lines = [
              [`z\\bar z = ${nm(rz * rz, 3)} = |z|^2`, Math.abs((a * a + b * b) - rz * rz) < 1e-12],
              [`|wz| = ${nm(Math.hypot(...wz), 3)} = |w|\\,|z|`, Math.abs(Math.hypot(...wz) - rw * rz) < 1e-12],
              [`wz = ${cxT(wz[0], wz[1])}`, null],
              [`\\arg(wz) = ${nm((Math.atan2(wz[1], wz[0]) * 180) / Math.PI, 1)}^\\circ \\equiv \\arg w + \\arg z`, Math.abs(Math.cos(Math.atan2(wz[1], wz[0]) - tw - tz) - 1) < 1e-9],
            ];
            v.legend([['orange', '$w$'], ['accent', '$z$; triangle $0,1,z$'], ['green', '$wz$, $z\\bar z$; triangle $0,w,wz$'], ['purple', '$\\bar z$', { dash: true }]]);
          } else if (md === 'dg') {
            S.hline(0, { color: 'muted', width: 2, alpha: 0.7 });
            S.circle(0, 0, rz, { color: 'faint', width: 1, dash: [3, 4] });
            const sm = [a + c, b + d], wzb = [c * a - d * b, -(c * b + d * a)], wbzb = [c * a - (-d) * (-b), c * (-b) + (-d) * a];
            S.poly([[0, 0], [c, d], sm, [a, b]], { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1, dash: [4, 4] });
            S.poly([[0, 0], [c, -d], [sm[0], -b - d], [a, -b]], { fill: 'purple', fillAlpha: 0.07, color: 'purple', width: 1, dash: [4, 4] });
            S.line(wz[0], wz[1], wzb[0], wzb[1], { color: 'muted', width: 1, dash: [3, 3] });
            S.line(sm[0], sm[1], sm[0], -sm[1], { color: 'muted', width: 1, dash: [3, 3] });
            S.arrow(0, 0, c, d, { color: 'orange', width: 2.2 }); S.arrow(0, 0, a, b, { color: 'accent', width: 2.2 });
            S.arrow(0, 0, c, -d, { color: 'purple', width: 1.8 }); S.arrow(0, 0, a, -b, { color: 'purple', width: 1.8 });
            S.dot(sm[0], sm[1], { color: 'green', r: 5, label: 'w+z', labelPos: 'ne' });
            S.dot(wz[0], wz[1], { color: 'green', r: 5, label: 'wz', labelPos: 'nw' });
            S.dot(sm[0], -sm[1], { hollow: true, color: 'green', r: 9, width: 2 });
            S.dot(wzb[0], wzb[1], { hollow: true, color: 'green', r: 9, width: 2 });
            S.dot(c + a, -d - b, { color: 'purple', r: 4.5 });
            S.dot(wbzb[0], wbzb[1], { color: 'purple', r: 4.5 });
            S.tex('\\bar w', c, -d, { color: 'purple', dx: c >= 0 ? 12 : -12, dy: 8, size: 15 });
            S.tex('\\bar z', a, -b, { color: 'purple', dx: 12, dy: 8, size: 15 });
            S.tex('\\bar w + \\bar z', sm[0], -sm[1], { color: 'purple', align: 'left', dx: 12, dy: 10, size: 14 });
            S.tex('\\bar w\\,\\bar z', wzb[0], wzb[1], { color: 'purple', align: 'right', dx: -12, dy: 10, size: 14 });
            const cs = [sm[0], -sm[1]];
            lines = [
              [`\\overline{w+z} = ${cxT(cs[0], cs[1])} = \\bar w + \\bar z`, Math.hypot(cs[0] - (c + a), cs[1] - (-d - b)) < 1e-12],
              [`\\overline{wz} = ${cxT(wzb[0], wzb[1])} = \\bar w\\,\\bar z`, Math.hypot(wzb[0] - wbzb[0], wzb[1] - wbzb[1]) < 1e-12],
              [`\\bar{\\bar z} = ${cxT(a, b)} = z`, true],
              [`|\\bar z| = ${nm(rz, 3)} = |z|`, true],
            ];
            v.legend([['accent', '$w, z, w+z$'], ['purple', 'mirror images $\\bar w, \\bar z, \\bar w+\\bar z, \\bar w\\bar z$'], ['green', 'rings: $\\overline{w+z}$, $\\overline{wz}$', { dot: true }]]);
          } else {
            const sm = [a + c, b + d], rs = Math.hypot(...sm);
            const R = 9 / Math.max(rw, 1e-9);
            if (rw > 0.05) S.line(0, 0, c * R, d * R, { color: 'muted', width: 1, dash: [5, 5] });
            S.circle(0, 0, rz, { color: 'faint', width: 1, dash: [3, 4] });
            S.line(a, b, a, 0, { color: 'faint', width: 1, dash: [3, 3] }); S.line(a, b, 0, b, { color: 'faint', width: 1, dash: [3, 3] });
            S.line(0, 0, a, 0, { color: 'orange', width: 2.4, alpha: 0.65 }); S.line(0, 0, 0, b, { color: 'teal', width: 2.4, alpha: 0.65 });
            S.arrow(0, 0, a, b, { color: 'accent', width: 1.2, dash: [4, 4], alpha: 0.6 });
            S.poly([[0, 0], [c, d], sm], { fill: 'green', fillAlpha: 0.1, stroke: false });
            S.arrow(0, 0, c, d, { color: 'orange', width: 2.6 });
            S.arrow(c, d, sm[0], sm[1], { color: 'accent', width: 2.6 });
            S.arrow(0, 0, sm[0], sm[1], { color: 'green', width: 2.8 });
            S.dot(sm[0], sm[1], { color: 'green', r: 4.5, label: 'w+z', labelPos: 'ne' });
            const lab = (str, p, q, col) => {
              const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
              let nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L;
              const cx = (c + sm[0]) / 3 - mx, cy = (d + sm[1]) / 3 - my; if (nx * cx + ny * cy > 0) { nx = -nx; ny = -ny; }
              const k = 1 / S.scale, off = 7 * k + Math.abs(nx) * (str.length * 4.6 + 4) * k + Math.abs(ny) * 10 * k;
              S.tex(str, mx + nx * off, my + ny * off, { color: col, size: 14 });
            };
            if (rw > 0.3) lab('|w|', [0, 0], [c, d], 'orange');
            if (rz > 0.3) lab('|z|', [c, d], sm, 'accent');
            if (rs > 0.3) lab('|w+z|', [0, 0], sm, 'green');
            const slack = rw + rz - rs;
            if (slack < 1e-9) S.corner('equality: z is a nonnegative multiple of w', 'tl', { color: 'green', weight: 600 });
            lines = [
              [`|\\operatorname{Re} z| = ${nm(Math.abs(a), 3)} \\le ${nm(rz, 3)} = |z|`, Math.abs(a) <= rz + 1e-12],
              [`|\\operatorname{Im} z| = ${nm(Math.abs(b), 3)} \\le ${nm(rz, 3)} = |z|`, Math.abs(b) <= rz + 1e-12],
              [`|w+z| = ${nm(rs, 3)} \\le ${nm(rw + rz, 3)} = |w|+|z|`, rs <= rw + rz + 1e-12],
              [`|w|+|z|-|w+z| = ${nm(Math.max(0, slack), 3)}`, null],
            ];
            v.legend([['orange', '$w$'], ['accent', '$z$ (placed at the tip of $w$)'], ['green', '$w+z$'], ['muted', 'ray through $w$: equality', { dash: true }]]);
          }
          // the identities panel
          lines.forEach(([str, ok], i) => {
            const y = 0.84 - i * 0.16;
            T.tex(str, 0.05, y, { align: 'left', size: 16 });
            if (ok != null) T.text(ok ? '✓' : '✗', 0.95, y, { color: ok ? 'green' : 'red', size: 18, weight: 700, align: 'right' });
          });
        });
        v.readout(() => {
          const md = mode.value, a = z.x, b = z.y, c = w.x, d = w.y;
          if (md === 'fi') {
            const rw = Math.hypot(c, d), rz = Math.hypot(a, b), re = c * a + d * b, ab = rw * rz;
            return `$w = ${cxT(c, d)}$, $z = ${cxT(a, b)}$: $\\;\\operatorname{Re}(w\\bar z) = ${nm(re, 3)} \\le ${nm(ab, 3)} = |w\\bar z|$ — the gap is exactly half of $(|w|+|z|)^2 - |w+z|^2$.`;
          }
          return `$w = ${cxT(c, d)}$, $\\;z = ${cxT(a, b)}$ — every identity on the right is evaluated from these two numbers.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Zero of a polynomial',
      statement: String.raw`A number $\lambda \in \mathbf F$ is called a **zero** (or **root**) of a polynomial $p \in \mathcal P(\mathbf F)$ if $p(\lambda) = 0$.`,
      idea: String.raw`The definition depends on $\mathbf F$: the same coefficients can have more zeros in $\mathbf C$ than in $\mathbf R$. A real cubic always crosses the axis at least once (its values have opposite signs far to the left and far to the right), but its other two zeros may be a nonreal pair that only appears in $\mathbf C$. Zeros are where all the later structure attaches: each one splits off a factor $z - \lambda$ (4.6), and in Chapter 5 the zeros of the minimal polynomial will be the eigenvalues.`,
      caption: String.raw`Shape the cubic $p(z) = z^3 + a_2z^2 + a_1z + a_0$ with the sliders. Left: its graph over $\mathbf R$, real zeros in green. Right: the phase portrait of $p$ on $\mathbf C$ (hue = argument of $p(z)$); every zero is a point where all colours meet. Switch $\mathbf F$ between $\mathbf R$ and $\mathbf C$: with $\mathbf F = \mathbf R$ only the zeros on the real line count. Drag the gold point $\lambda$; it snaps onto zeros, where $p(\lambda) = 0$.`,
      deps: ['ladr-2.10'],
      tags: ['polynomials'],
      viz(v) {
        const F = v.select('', [{ value: 'R', label: '$\\mathbf F = \\mathbf R$' }, { value: 'C', label: '$\\mathbf F = \\mathbf C$' }], 'C');
        const a2 = v.slider('$a_2$', -3, 3, 0, { step: 0.05 });
        const a1 = v.slider('$a_1$', -4, 4, -1, { step: 0.05 });
        const a0 = v.slider('$a_0$', -3, 3, 1.2, { step: 0.05 });
        const G = v.stage({ x: [-3, 3], y: [-6, 6], height: 340, xlabel: 'x', title: '$y = p(x)$ for real $x$' });
        const Z = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, title: 'phase portrait of $p$ on $\\mathbf C$' });
        let roots = [], coef = [1.2, -1, 0, 1];
        const lam = Z.handle(0.6, 1.4, {
          color: 'gold', label: 'λ', constrain: (x, y) => {
            if (F.value === 'R') y = 0;
            for (const [rx, ry] of roots) if ((F.value === 'C' || Math.abs(ry) < 1e-6) && Math.hypot(x - rx, y - ry) < 0.13) return [rx, F.value === 'R' ? 0 : ry];
            return [x, y];
          },
        });
        let st = null;
        v.render(() => {
          coef = [a0.value, a1.value, a2.value, 1];
          roots = cRoots(coef, null, roots);
          const reals = realZeros(roots), isR = F.value === 'R';
          if (isR && lam.y !== 0) lam.y = 0;
          // graph over R
          G.fn((x) => pval(coef, x), { color: 'ink', width: 2.6 });
          reals.forEach((x0, k) => G.dot(x0, 0, { color: 'green', r: 5.5 }));
          const real = Math.abs(lam.y) < 1e-12;
          if (real) {
            const pv = pval(coef, lam.x);
            G.line(lam.x, 0, lam.x, pv, { color: 'gold', width: 2.2, dash: [4, 3] });
            G.dot(lam.x, pv, { color: 'gold', r: 4.5 });
            G.dot(lam.x, 0, { color: 'gold', r: 5, hollow: true, label: 'λ', labelPos: pv > 0 ? 's' : 'n' });
          }
          G.corner(`real zeros: ${reals.length}`, 'tl', { color: 'green', weight: 700 });
          // the complex plane
          phase(Z, (x, y) => cEval(coef, null, x, y), coef.join(','), 0.34);
          Z.axes();
          if (isR) { Z.hline(0, { color: 'accent', width: 4, alpha: 0.55 }); Z.text('F = R', Z.bounds.x[1], 0, { align: 'right', dx: -8, dy: -12, color: 'accent', weight: 700 }); }
          let nz = 0;
          for (const [x, y] of roots) {
            const inF = !isR || Math.abs(y) < 1e-6;
            if (inF) { nz++; Z.dot(x, y, { color: 'green', r: 6.5 }); }
            else { Z.dot(x, y, { color: 'muted', r: 7, hollow: true, width: 2 }); Z.text('∉ R', x, y, { dx: 11, color: 'muted', size: 12, weight: 600 }); }
          }
          Z.corner(`zeros in F: ${nz}`, 'tl', { color: 'green', weight: 700 });
          const pl = cEval(coef, null, lam.x, lam.y);
          st = { reals, isR, pl };
          v.legend([['ink', '$y = p(x)$'], ['green', 'zeros in $\\mathbf F$', { dot: true }], ['muted', 'zeros outside $\\mathbf F$', { dot: true }], ['gold', 'test point $\\lambda$', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const list = st.isR ? st.reals.map((x) => nm(x, 3)) : roots.map(([x, y]) => cxT(x, y, 3));
          const isZero = Math.hypot(...st.pl) < 1e-9;
          return `$p(z) = ${polyT(coef, 'z')}$. Zeros in $\\mathbf F$: ${list.length ? list.map((s) => `$${s}$`).join(', ') : 'none'}. At $\\lambda = ${cxT(lam.x, lam.y)}$: $p(\\lambda) = ${cxT(st.pl[0], st.pl[1], 3)}$${isZero ? ' — **a zero**.' : '.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Each zero of a polynomial gives a degree-one factor',
      statement: String.raw`Let $m$ be a positive integer, let $p \in \mathcal P(\mathbf F)$ have degree $m$, and let $\lambda \in \mathbf F$. Then $p(\lambda) = 0$ if and only if there is a polynomial $q \in \mathcal P(\mathbf F)$ of degree $m - 1$ with
$$p(z) = (z - \lambda)\,q(z) \quad\text{for every } z \in \mathbf F.$$`,
      idea: String.raw`If $p$ factors this way, then plainly $p(\lambda) = 0\cdot q(\lambda) = 0$. Conversely, write $p(z) = \sum_k a_kz^k$ and subtract $p(\lambda) = 0$:
$$p(z) = p(z) - p(\lambda) = \sum_{k=1}^m a_k\,(z^k - \lambda^k),$$
and each $z^k - \lambda^k = (z - \lambda)(z^{k-1} + z^{k-2}\lambda + \dots + \lambda^{k-1})$ contains the factor $z - \lambda$. For any $\lambda$ the same computation gives $p(z) = (z-\lambda)q(z) + p(\lambda)$; synthetic division (Horner's scheme) produces the coefficients of $q$ and the remainder $p(\lambda)$ in one sweep.`,
      caption: String.raw`Slide $\lambda$ along the graph of $p$ (thick curve). The table runs synthetic division by $x - \lambda$ live: bring down the leading coefficient, multiply by $\lambda$ (gold arrows), add, repeat. The last entry is the remainder $r = p(\lambda)$ and the others are the coefficients of $q$ (purple). The dashed blue curve $(x-\lambda)q(x)$ is $p$ shifted down by $r$ so that it passes through $(\lambda, 0)$; the gap closes — and the factorization is exact — precisely when $\lambda$ is a zero. The point snaps onto zeros.`,
      deps: ['ladr-4.5'],
      tags: ['polynomials'],
      viz(v) {
        const PS = {
          a: { label: '$x^3-2x^2-x+2$', c: [2, -1, -2, 1], x: [-1.7, 2.7], y: [-4.5, 5], l0: 0.45 },
          b: { label: '$x^4-5x^2+4$', c: [4, 0, -5, 0, 1], x: [-2.6, 2.6], y: [-3.5, 6.5], l0: 0.6 },
          c: { label: '$x^3-3x+1$', c: [1, -3, 0, 1], x: [-2.3, 2.3], y: [-4.5, 5.5], l0: -0.6 },
        };
        const which = v.select('$p =$', Object.entries(PS).map(([value, P]) => ({ value, label: P.label })), 'a');
        const G = v.stage({ x: PS.a.x, y: PS.a.y, height: 290, full: true, xlabel: 'x' });
        const T = v.stage({ x: [0, 1], y: [0, 1], height: 170, axes: false, full: true });
        const tab = v.table(T, { rows: 3, cols: 4, square: false, maxCell: 86, size: 14 });
        let zeros = realZeros(cRoots(PS.a.c));
        const inView = (P, y) => y >= P.y[0] && y <= P.y[1];
        const L = G.handle(PS.a.l0, pval(PS.a.c, PS.a.l0), {
          color: 'accent', label: 'λ', constrain: (x) => {
            const P = PS[which.value];
            for (const z0 of zeros) if (Math.abs(x - z0) < 0.07) x = z0;
            return inView(P, pval(P.c, x)) ? [x, pval(P.c, x)] : [L.x, L.y];
          },
        });
        let last = 'a', st = null;
        v.render(() => {
          const P = PS[which.value], c = P.c, n = c.length - 1;
          if (last !== which.value) { last = which.value; G.setView(P.x, P.y); zeros = realZeros(cRoots(c)); L.x = P.l0; }
          const lam = L.x; L.y = pval(c, lam);
          const { q, r } = deflate(c, lam), ok = Math.abs(r) < 1e-9;
          // graph
          G.fn((x) => pval(q, x), { color: 'purple', width: 1.6, alpha: 0.85 });
          G.fn((x) => pval(c, x), { color: 'ink', width: 2.6 });
          G.fn((x) => (x - lam) * pval(q, x), { color: 'accent', width: 2.2, dash: [7, 5] });
          zeros.forEach((z0) => G.dot(z0, 0, { color: 'green', r: 4 }));
          if (!ok) {
            G.line(lam, 0, lam, r, { color: 'red', width: 3.2 });
            G.text('r', lam, r / 2, { color: 'red', align: 'right', dx: -8, size: 17, math: true });
          }
          G.dot(lam, 0, { color: 'accent', r: 5, hollow: true });
          G.corner(ok ? `λ is a zero: p(x) = (x − λ)·q(x) exactly` : `remainder r = p(λ) = ${nmc(r, 3)} ≠ 0`, 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          // synthetic division table: rows = p, λ·(previous), q | r; columns = powers x^n … 1
          const A = c.slice().reverse(), B = [A[0]], Mv = [null];
          for (let j = 1; j <= n; j++) { Mv.push(lam * B[j - 1]); B.push(A[j] + Mv[j]); }
          tab.set({ cols: n + 1 });
          tab.draw({
            rowLabels: ['$p$', '$+\\lambda\\,\\cdot$', '$q\\;|\\;r$'],
            colLabels: (j) => (n - j === 0 ? '$1$' : n - j === 1 ? '$x$' : `$x^{${n - j}}$`),
            value: (i, j) => (i === 0 ? A[j] : i === 1 ? (j === 0 ? '' : Mv[j]) : B[j]),
            format: (val) => (typeof val === 'number' ? nmc(val, 2) : val),
            fill: (i, j) => (i === 2 ? (j === n ? (ok ? 'green' : 'red') : 'purple') : null),
            fillAlpha: 0.16,
            highlight: [[2, n, ok ? 'green' : 'red']],
          });
          for (let j = 0; j < n; j++) tab.arrow([2, j], [1, j + 1], { color: 'gold', width: 1.6 });
          st = { q, r, lam, ok };
          v.legend([['ink', '$p$'], ['accent', '$(x-\\lambda)\\,q(x)$', { dash: true }], ['purple', '$q$, degree $m-1$'], ['red', 'remainder $r = p(\\lambda)$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const { q, r, lam, ok } = st;
          return `$p(x) = ${facT(lam, 0, 'x')}\\,\\bigl(${polyT(q, 'x')}\\bigr) ${r < 0 ? '-' : '+'} ${nm(Math.abs(r), 3)}$` + (ok ? ' — remainder $0$: $\\lambda$ is a zero and $x - \\lambda$ divides $p$.' : ' — the remainder is $p(\\lambda) \\ne 0$, so $x - \\lambda$ does not divide $p$.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Degree m implies at most m zeros',
      statement: String.raw`Let $m$ be a positive integer and let $p \in \mathcal P(\mathbf F)$ be a polynomial of degree $m$. Then $p$ has at most $m$ zeros in $\mathbf F$.`,
      idea: String.raw`Induct on $m$. A polynomial of degree $1$, $a_1z + a_0$ with $a_1 \ne 0$, has exactly one zero. For degree $m > 1$: if $p$ has no zero we are done; otherwise take a zero $\lambda$ and use 4.6 to write $p = (z - \lambda)q$ with $\deg q = m - 1$. Any other zero $\mu \ne \lambda$ satisfies $0 = (\mu - \lambda)q(\mu)$, so $q(\mu) = 0$; by induction $q$ has at most $m - 1$ zeros, hence $p$ has at most $m$. The hypothesis $\deg p = m \ge 1$ excludes the zero polynomial, whose degree is $-\infty$ and which vanishes everywhere.`,
      caption: String.raw`The orange handles fix the values of $p$ at $m + 1$ equally spaced points, so $p$ has degree at most $m$. Try to make the graph cross the axis more than $m$ times — it cannot. The strip below runs the proof: each real zero (gold) is peeled off by dividing by $x - \lambda$ (4.6), the degree drops by one, and the remaining zeros survive in the quotient; the chain must stop before the degree runs out. Pull every handle to $0$ (they snap) to get the zero polynomial, the one exception.`,
      deps: ['ladr-4.6'],
      tags: ['polynomials'],
      viz(v) {
        const M = v.M;
        const mS = v.slider('degree bound $m$', 1, 6, 4, { int: true });
        const G = v.stage({ x: [-3, 3], y: [-3, 3], height: 290, full: true, xlabel: 'x' });
        const C = v.stage({ x: [0, 1], y: [0, 1], height: 165, axes: false, full: true });
        const node = (j, m) => -2.4 + (4.8 * Math.min(j, m)) / m;
        const init = [1.3, -1.0, 1.15, -1.2, 0.95, -0.85, 1.0];
        const H = init.map((y, j) => G.handle(node(j, 4), y, { color: 'orange', r: 6.5, constrain: (x, yy) => [node(j, mS.value), Math.abs(yy) < 0.1 ? 0 : yy] }));
        let lastM = 0, st = null;
        v.render(() => {
          const m = mS.value;
          if (m !== lastM) { lastM = m; H.forEach((h, j) => { h.visible = j <= m; h.x = node(j, m); }); }
          const xs = H.slice(0, m + 1).map((h) => h.x), ys = H.slice(0, m + 1).map((h) => h.y);
          const zero = ys.every((y) => y === 0);
          const coef = zero ? [0] : M.solve(xs.map((x) => M.range(m + 1).map((k) => x ** k)), ys);
          const d = zero ? -1 : degOf(coef, 1e-9), cf = coef.slice(0, Math.max(1, d + 1));
          const zs = d >= 1 ? realZeros(cRoots(cf)) : [];
          // graph
          for (const x of xs) G.line(x, 0, x, H[xs.indexOf(x)].y, { color: 'orange', width: 1, alpha: 0.35 });
          if (zero) { G.hline(0, { color: 'red', width: 4 }); G.corner('p = 0: every x is a zero (deg 0 = −∞)', 'tl', { color: 'red', weight: 700 }); }
          else {
            G.fn((x) => pval(cf, x), { color: 'accent', width: 2.6 });
            zs.forEach((x0, k) => G.dot(x0, 0, { color: 'gold', r: 5.5, label: `λ${sub(k + 1)}`, labelPos: k % 2 ? 'n' : 's' }));
            const off = zs.filter((x0) => x0 < G.bounds.x[0] || x0 > G.bounds.x[1]).length;
            G.corner(`deg p = ${d} · real zeros: ${zs.length}${off ? ` (${off} outside the window)` : ''} ≤ ${d}`, 'bl', { color: 'green', weight: 700 });
          }
          // the peeling chain q_0 = p, q_{i+1} = q_i / (x − λ_{i+1})
          const slots = Math.max(1, d + 1), W = 1 / slots, qs = [cf];
          for (let i = 0; i < zs.length; i++) qs.push(deflate(qs[i], zs[i]).q);
          for (let i = 0; i < slots; i++) {
            const x0 = i * W + 0.018, x1 = (i + 1) * W - 0.018, y0 = 0.08, y1 = 0.72, ym = (y0 + y1) / 2;
            const used = !zero && i < qs.length;
            C.rect(x0, y0, x1, y1, { color: used ? 'faint' : 'grid', width: 1, dash: used ? null : [4, 4], fill: used ? null : 'grid', fillAlpha: 0.25 });
            if (zero) { C.text('the zero polynomial has no degree to count down', 0.5, ym, { align: 'center', color: 'red', size: 13, weight: 600 }); break; }
            if (!used) { C.text('unused', (x0 + x1) / 2, ym, { align: 'center', color: 'muted', size: 11.5 }); continue; }
            const q = qs[i], dq = d - i;
            const X = (x) => x0 + ((x + 3) / 6) * (x1 - x0);
            // scale so that the part of the graph around the remaining zeros fills the box; clip the rest
            const rest = zs.slice(i), lo = rest.length ? Math.max(-2.8, rest[0] - 0.45) : -2.8, hi = rest.length ? Math.min(2.8, rest[rest.length - 1] + 0.45) : 2.8;
            let sc = 1e-9; for (let k = 0; k <= 80; k++) sc = Math.max(sc, Math.abs(pval(q, lo + ((hi - lo) * k) / 80)));
            if (dq === 0) sc *= 1.6;
            const Y = (y) => ym + (0.29 * y) / sc;
            C.line(x0, ym, x1, ym, { color: 'faint', width: 1 });
            const pts = []; for (let k = 0; k <= 160; k++) { const x = -3 + (6 * k) / 160; pts.push([X(x), Math.max(y0 - 0.2, Math.min(y1 + 0.2, Y(pval(q, x))))]); }
            const cx = C.ctx; cx.save(); cx.beginPath(); cx.rect(C.X(x0), C.Y(y1), C.X(x1) - C.X(x0), C.Y(y0) - C.Y(y1)); cx.clip();
            C.path(pts, { color: i === 0 ? 'accent' : 'purple', width: 1.8 });
            cx.restore();
            for (let k = i; k < zs.length; k++) if (zs[k] > -3 && zs[k] < 3) C.dot(X(zs[k]), ym, { color: k === i ? 'gold' : 'green', r: k === i ? 4.5 : 3 });
            C.tex(i === 0 ? `q_0 = p,\\ \\deg ${dq}` : `q_{${i}},\\ \\deg ${dq}`, (x0 + x1) / 2, 0.86, { size: 13, color: i === 0 ? 'accent' : 'purple' });
            if (i === qs.length - 1) C.text(dq === 0 ? 'nonzero constant' : 'no real zero left', (x0 + x1) / 2, y0 + 0.07, { align: 'center', color: 'muted', size: 11 });
            if (i > 0) { C.text('÷', i * W, ym, { align: 'center', color: 'gold', size: 14, weight: 700 }); }
          }
          st = { d, k: zs.length, zero };
          v.legend([['accent', '$p$'], ['orange', 'value handles', { dot: true }], ['gold', 'zero being divided out', { dot: true }], ['purple', 'quotients $q_i$']]);
        });
        v.readout(() => {
          if (!st) return '';
          if (st.zero) return 'All values are $0$: $p$ is the zero polynomial, which vanishes everywhere — the theorem needs $\\deg p = m \\ge 1$.';
          return `$\\deg p = ${st.d}$, real zeros $= ${st.k}$. Dividing them out one at a time leaves $q_{${st.k}}$ of degree $${st.d} - ${st.k} = ${st.d - st.k} \\ge 0$, so the number of zeros is at most $${st.d}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Division algorithm for polynomials',
      statement: String.raw`Let $p, s \in \mathcal P(\mathbf F)$ with $s \ne 0$. Then there are unique polynomials $q, r \in \mathcal P(\mathbf F)$ such that
$$p = s\,q + r \qquad\text{and}\qquad \deg r < \deg s.$$`,
      idea: String.raw`Let $n = \deg p$ and $m = \deg s$; if $n < m$ take $q = 0$, $r = p$. Otherwise Axler's proof counts dimensions: the $n+1$ polynomials
$$1,\ z,\ \dots,\ z^{m-1},\ s,\ zs,\ \dots,\ z^{n-m}s$$
have distinct degrees $0, 1, \dots, n$, so they are linearly independent, and a linearly independent list of length $n + 1 = \dim\mathcal P_n(\mathbf F)$ is a basis (2.38). Writing $p$ in this basis gives $p = (a_0 + \dots + a_{m-1}z^{m-1}) + s\,(b_0 + \dots + b_{n-m}z^{n-m})$, i.e. $r$ and $q$; uniqueness of coordinates gives uniqueness of $q, r$. In coordinates the basis matrix is triangular, and solving it from the top row down is exactly schoolbook long division.`,
      caption: String.raw`Choose $p$ and the coefficients of $s = s_2z^2 + s_1z + s_0$; the player runs long division step by step (it restarts at the result whenever you change something). Each step reads the leading coefficient of $r$ (gold), divides it by that of $s$, records the quotient term, and adds the row $-c\,z^e s$, killing the top coefficient (green). Right: $p$ (thick), $s\cdot q$ (blue) and $r$ (red); the gold dots of $s q + r$ sit on $p$ at every step. Switch to *basis* to see the same numbers as back-substitution in Axler's triangular basis. Set $s = 0$ to break the hypothesis.`,
      deps: ['ladr-2.38', 'ladr-2.10'],
      tags: ['polynomials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polynomial_long_division' },
      viz(v) {
        const PS = {
          a: { label: '$z^4-2z^3+3z-4$', c: [-4, 3, 0, -2, 1], x: [-2.1, 2.5] },
          b: { label: '$2z^5-z^3+4z^2-1$', c: [-1, 0, 4, -1, 0, 2], x: [-1.6, 1.5] },
          c: { label: '$z^3+1$', c: [1, 0, 0, 1], x: [-2, 2] },
        };
        const reset = () => S.reset({ at: 'end' });
        const pSel = v.select('$p =$', Object.entries(PS).map(([value, P]) => ({ value, label: P.label })), 'a', { onChange: reset });
        const view = v.select('', [{ value: 'div', label: 'long division' }, { value: 'basis', label: 'basis' }], 'div');
        const s2 = v.slider('$s_2$', -2, 2, 1, { step: 0.5, onChange: reset });
        const s1 = v.slider('$s_1$', -2, 2, 1, { step: 0.5, onChange: reset });
        const s0 = v.slider('$s_0$', -2, 2, -1, { step: 0.5, onChange: reset });
        const T = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: false, weight: 1.3 });
        const G = v.stage({ x: PS.a.x, y: [-10, 10], height: 330, xlabel: 'z' });
        const tab = v.table(T, { rows: 5, cols: 5, square: false, maxCell: 74, size: 13.5 });
        let run = null;
        const S = v.steps({ frames: () => (run = longDivide(PS[pSel.value].c, [s0.value, s1.value, s2.value])).frames, speed: 0.9, autoplay: true, still: 4 });
        v.render(() => {
          const P = PS[pSel.value], p = P.c, f = S.frame || {};
          // ---- graph
          let ym = 1; for (let k = 0; k <= 60; k++) ym = Math.max(ym, Math.abs(pval(p, P.x[0] + ((P.x[1] - P.x[0]) * k) / 60)));
          ym = Math.min(40, Math.max(4, ym * 1.12));
          G.setView(P.x, [-ym, ym]);
          G.fn((x) => pval(p, x), { color: 'ink', width: 2.8 });
          if (run.fail) {
            T.text('s = 0: division by the zero polynomial is undefined', 0.5, 0.5, { align: 'center', color: 'red', size: 14, weight: 700 });
            G.corner('s = 0', 'tl', { color: 'red', weight: 700 });
            v.legend([['ink', '$p$']]);
            return;
          }
          const s = run.s, n = run.n, m = run.m;
          const rNow = f.phase === 'sub' ? f.r2 : f.r, qNow = f.q;
          G.fn((x) => pval(s, x), { color: 'muted', width: 1.3, dash: [3, 4] });
          G.fn((x) => pval(s, x) * pval(qNow, x), { color: 'accent', width: 2.2 });
          G.fn((x) => pval(rNow, x), { color: 'red', width: 2.2 });
          const chk = []; for (let k = 0; k <= 22; k++) { const x = P.x[0] + ((P.x[1] - P.x[0]) * k) / 22; chk.push([x, pval(s, x) * pval(qNow, x) + pval(rNow, x)]); }
          G.dots(chk, { color: 'gold', r: 2.6 });
          const dr = degOf(rNow);
          G.corner(`deg r = ${dr < 0 ? '−∞' : dr}  ${dr < m ? '<' : '≥'}  deg s = ${m}`, 'tl', { color: dr < m ? 'green' : 'ink', weight: 700 });
          // ---- table
          const powT = (pw) => (pw === 0 ? '$1$' : pw === 1 ? '$z$' : `$z^{${pw}}$`);
          const fmt = (val) => (typeof val === 'number' ? nmc(val, 2) : val);
          const zeroCol = (val) => (val === 0 ? 'faint' : null);
          if (view.value === 'div') {
            const col = (pw) => n - pw;
            const known = (e) => f.phase === 'done' || (f.phase === 'sub' && e >= f.e) || (f.phase === 'choose' && e > f.e);
            const hl = [];
            if (f.phase === 'choose') hl.push([2, col(f.e + m), 'gold'], [0, col(m), 'gold'], [1, col(f.e), 'gold']);
            if (f.phase === 'sub') hl.push([3, col(f.e + m), 'gold'], [4, col(f.e + m), 'green'], [1, col(f.e), 'accent']);
            const val = (i, j) => {
              const pw = n - j;
              if (i === 0) return pw <= m ? s[pw] : '';
              if (i === 1) { if (pw > n - m) return ''; if (known(pw)) return f.q[pw]; return f.phase === 'choose' && pw === f.e ? '?' : ''; }
              if (i === 2) return f.r[pw];
              if (f.phase !== 'sub') return '';
              if (i === 3) return pw >= f.e && pw <= f.e + m ? -f.sb[pw] : '';
              return f.r2[pw];
            };
            tab.set({ rows: 5, cols: n + 1 });
            tab.draw({
              rowLabels: ['$s$', '$q$', f.phase === 'done' ? '$r\\ (\\text{final})$' : '$r$', f.phase === 'sub' ? `$-(${monoT(f.c, f.e)})\\,s$` : '$-c\\,z^e s$', "$r'$"],
              rowLabelColor: (i) => (i >= 3 && f.phase !== 'sub' ? 'faint' : null),
              colLabels: (j) => powT(n - j),
              value: val, format: fmt,
              textColor: (i, j) => zeroCol(val(i, j)),
              fill: (i, j) => (i === 1 && val(i, j) !== '' ? 'accent' : i === 2 && f.phase === 'done' && n - j < m ? 'red' : i === 0 && n - j <= m ? 'muted' : null),
              fillAlpha: 0.13,
              highlight: hl,
            });
          } else {
            const nb = n + 1, colOf = (pw) => 1 + (n - pw);
            const rowName = (k) => { if (k <= n - m) { const e = n - m - k; return e === 0 ? '$s$' : e === 1 ? '$zs$' : `$z^{${e}}s$`; } if (k <= n) return powT(n - k); return '$p$'; };
            const cur = f.phase === 'choose' || f.phase === 'sub' ? n - m - f.e : null;
            const val = (i, j) => {
              if (j === 0) {
                if (i <= n - m) { const e = n - m - i; if (f.phase === 'done' || (f.phase === 'sub' && e >= f.e) || (f.phase === 'choose' && e > f.e)) return f.q[e]; return i === cur ? '?' : ''; }
                if (i <= n) return f.phase === 'done' ? f.r[n - i] : '';
                return '';
              }
              const pw = n - (j - 1);
              if (i <= n - m) { const e = n - m - i, k = pw - e; return k >= 0 && k <= m ? s[k] : ''; }
              if (i <= n) return pw === n - i ? 1 : '';
              return p[pw];
            };
            tab.set({ rows: nb + 1, cols: nb + 1 });
            tab.draw({
              rowLabels: rowName,
              colLabels: (j) => (j === 0 ? 'coord.' : powT(n - (j - 1))),
              value: val, format: fmt,
              textColor: (i, j) => zeroCol(val(i, j)),
              fill: (i, j) => (i === nb ? 'muted' : j === 0 ? (val(i, j) !== '' && val(i, j) !== '?' ? (i <= n - m ? 'accent' : 'red') : null) : j - 1 === i ? 'gold' : null),
              fillAlpha: 0.16,
              activeRow: cur, activeCol: cur != null ? colOf(f.e + m) : null,
              highlight: cur != null ? [[cur, 0, 'gold']] : [],
            });
          }
          v.legend([['ink', '$p$'], ['muted', '$s$', { dash: true }], ['accent', '$s\\cdot q$ (so far)'], ['red', '$r$ (so far)'], ['gold', '$sq + r$', { dot: true }]]);
        });
        v.readout(() => {
          if (!run || run.fail) return 'The theorem requires $s \\ne 0$.';
          const f = S.frame || {}, rNow = f.phase === 'sub' ? f.r2 : f.r;
          let err = 0; const P = PS[pSel.value];
          for (let k = 0; k <= 40; k++) { const x = P.x[0] + ((P.x[1] - P.x[0]) * k) / 40; err = Math.max(err, Math.abs(pval(P.c, x) - pval(run.s, x) * pval(f.q, x) - pval(rNow, x))); }
          const tail = view.value === 'basis' ? ' In the basis view, the coordinate column holds $q$ (blue rows) and $r$ (red rows); the gold diagonal is never zero, so the triangular system has exactly one solution.' : '';
          return `$p = s\\,q + r$ with $q = ${polyT(f.q, 'z')}$, $r = ${polyT(rNow, 'z')}$ $\\;(\\max|p - sq - r| = ${v.sci(err, 2)}$ on the window).` + tail;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Fundamental theorem of algebra, first version',
      statement: String.raw`Every nonconstant polynomial with complex coefficients has a zero in $\mathbf C$.`,
      idea: String.raw`The elementary proof (as in Rudin's 8.8) minimises $|p|$: $|p(z)| \to \infty$ as $|z| \to \infty$, so the continuous function $|p|$ attains a global minimum at some $\zeta$, and if $p(\zeta) \ne 0$ a $k$-th root of a complex number points in a direction along which $|p|$ decreases — a contradiction. The picture shows the topological proof. Follow $p$ around the circle $|z| = R$ and count how often the image curve winds around $0$. For tiny $R$ the image stays near $p(0)$, so (if $p(0) \ne 0$) the count is $0$; for huge $R$ the leading term $c\,z^m$ dominates and the count is $m = \deg p \ge 1$. The winding number is an integer that varies continuously with $R$ (homotopy invariance, rca 10.40) as long as the curve avoids $0$, so at some radius in between the curve must pass through $0$ — that is a zero of $p$.`,
      caption: String.raw`Left: the phase portrait of $f$ and the circle $|z| = R$ (play, or drag the gold handle to set $R$). Middle: the image of that circle under $f$, drawn on a radially logarithmic scale so that small and huge loops both fit; the winding number about $0$ is counted live. Bottom: the winding number as a function of $R$ — it starts at $0$, ends at $\deg p$, and jumps exactly at the radii of the zeros (dashed), where the curve sweeps through $0$. Compare $e^z$: it has no dominant power, its curves never wind, and it has no zeros. A constant never winds either.`,
      deps: ['ladr-4.5', 'ladr-4.4'],
      see: ['pma-8.8', 'rca-10.10', 'rca-10.40', 'rca-10.43'],
      tags: ['polynomials', 'complex numbers'],
      credit: 'Gauss, 1799; Argand, 1806',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_theorem_of_algebra' },
      viz(v) {
        const FS = {
          p4: { label: '$z^4+z^3-2iz+1$', cr: [1, 0, 0, 1, 1], ci: [0, -2, 0, 0, 0] },
          p3: { label: '$z^3-2z+2$', cr: [2, -2, 0, 1], ci: [0, 0, 0, 0] },
          exp: { label: '$e^z$' },
          cst: { label: 'constant $1.5$', cr: [1.5], ci: [0] },
        };
        const fSel = v.select('$f =$', Object.entries(FS).map(([value, F]) => ({ value, label: F.label })), 'p4');
        const RMAX = 2.2, PERIOD = 14, PHI = 0.22;
        const Zs = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 320, title: '$z$-plane and the circle $|z| = R$' });
        const Ws = v.stage({ x: [-4.3, 4.3], y: [-4.3, 4.3], equal: true, height: 320, axes: false, title: 'image of the circle under $f$' });
        const B = v.stage({ x: [0, RMAX], y: [-0.6, 4.8], height: 150, full: true, axes: 'box', xlabel: 'R', yticks: [0, 1, 2, 3, 4], title: 'winding number about $0$ as a function of $R$' });
        const hR = Zs.handle(0.9 * Math.cos(PHI), 0.9 * Math.sin(PHI), {
          color: 'gold', label: 'R', constrain: (x, y) => { const r = Math.min(RMAX, Math.max(0.03, Math.hypot(x, y))), t = Math.atan2(y, x); return [r * Math.cos(t), r * Math.sin(t)]; },
        });
        hR.onDrag = () => { if (v.playing) v.pause(); };
        const fOf = (key) => (key === 'exp' ? (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; } : (x, y) => cEval(FS[key].cr, FS[key].ci, x, y));
        const comp = (w) => { const r = Math.hypot(w[0], w[1]); if (r < 1e-300) return [0, 0]; const g = Math.log1p(r) / r; return [w[0] * g, w[1] * g]; };
        const prof = {};
        const profile = (key) => {
          if (prof[key]) return prof[key];
          const f = fOf(key), K = 220, N = 360, pts = [];
          for (let i = 0; i <= K; i++) {
            const R = 0.01 + ((RMAX - 0.01) * i) / K, P = [];
            for (let j = 0; j < N; j++) { const t = (TAU * j) / N; P.push(f(R * Math.cos(t), R * Math.sin(t))); }
            pts.push([R, Math.round(windingOf(P))]);
          }
          const zs = key === 'exp' || key === 'cst' ? [] : cRoots(FS[key].cr, FS[key].ci);
          const deg = key === 'exp' || key === 'cst' ? 0 : FS[key].cr.length - 1;
          return (prof[key] = { pts, zs, deg });
        };
        v.t = 0.45 * PERIOD;
        let st = null;
        v.animate((t) => {
          const key = fSel.value, f = fOf(key), pr = profile(key);
          if (v.playing && !hR.dragging) { const R = 0.03 + ((RMAX - 0.03) * (t % PERIOD)) / PERIOD; hR.x = R * Math.cos(PHI); hR.y = R * Math.sin(PHI); }
          const R = Math.hypot(hR.x, hR.y);
          // z-plane
          phase(Zs, f, key, 0.22);
          Zs.axes();
          Zs.circle(0, 0, R, { color: 'panel', width: 5 });
          Zs.circle(0, 0, R, { color: 'ink', width: 2.2 });
          for (const a of [0.35, 1.9, 3.45, 5.0]) chevron(v, Zs, R * Math.cos(a), R * Math.sin(a), -Math.sin(a), Math.cos(a), 'ink', 10);
          let inside = 0;
          for (const [x, y] of pr.zs) { const on = Math.abs(Math.hypot(x, y) - R) < 0.03; if (Math.hypot(x, y) < R) inside++; Zs.dot(x, y, { hollow: true, color: on ? 'red' : 'ink', r: on ? 8 : 5.5, width: 2.2 }); }
          // w-plane: image curve, radially log-compressed
          const N = 720, P = [], Q = [];
          let minAbs = Infinity;
          for (let j = 0; j < N; j++) { const a = (TAU * j) / N, w = f(R * Math.cos(a), R * Math.sin(a)); P.push(w); Q.push(comp(w)); minAbs = Math.min(minAbs, Math.hypot(w[0], w[1])); }
          for (const [rr, lab] of [[1, '1'], [10, '10'], [50, '50']]) { const g = Math.log1p(rr); Ws.circle(0, 0, g, { color: 'grid', width: 1 }); Ws.text(lab, g * Math.cos(-0.5), g * Math.sin(-0.5), { color: 'muted', size: 10.5, dx: 3 }); }
          Ws.line(-4.3, 0, 4.3, 0, { color: 'faint', width: 1 }); Ws.line(0, -4.3, 0, 4.3, { color: 'faint', width: 1 });
          const wn = windingOf(P), k = Math.round(wn);
          const spread = Math.max(...Q.map((q) => Math.hypot(q[0] - Q[0][0], q[1] - Q[0][1])));
          if (spread < 1e-6) Ws.dot(Q[0][0], Q[0][1], { color: 'accent', r: 6, label: 'f(circle) = one point', labelPos: 'ne', math: false });
          else {
            Ws.path(Q, { color: 'accent', width: 2.2, close: true });
            for (const fr of [0.1, 0.35, 0.6, 0.85]) { const i = Math.floor(fr * N), q0 = Q[i], q1 = Q[(i + 2) % N]; chevron(v, Ws, q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1], 'accent', 10); }
          }
          const through = minAbs < 2e-3;
          xMark(Ws, 0, 0, through ? 'red' : 'green', 6);
          Ws.corner(through ? 'the curve passes through 0' : `winding number = ${k}`, 'tl', { color: through ? 'red' : 'ink', weight: 700 });
          Zs.corner(`R = ${nmc(R, 2)}`, 'tl', { color: 'ink', weight: 700 });
          // winding number versus R
          const top = Math.max(1, pr.deg);
          B.setView(null, [-0.6, top + 0.8]);
          B.setTicks(null, v.M.range(top + 1));
          for (const [x, y] of pr.zs) { const r = Math.hypot(x, y); B.vline(r, { color: 'faint', width: 1.2, dash: [4, 4] }); }
          const steps = []; pr.pts.forEach(([x, y], i) => { if (i) steps.push([x, pr.pts[i - 1][1]]); steps.push([x, y]); });
          B.path(steps, { color: 'accent', width: 2.6 });
          B.vline(R, { color: 'gold', width: 2 });
          B.dot(R, k, { color: 'gold', r: 5 });
          if (key === 'exp') B.corner('e^z: winding number 0 for every R — and no zeros', 'tr', { color: 'red', weight: 600 });
          else if (key === 'cst') B.corner('constant: always 0 — no zeros', 'tr', { color: 'red', weight: 600 });
          else B.corner(`0 for small R, ${pr.deg} = deg p for large R`, 'br', { color: 'green', weight: 600, dy: -14 });
          st = { R, k, wn, minAbs, inside, key, deg: pr.deg };
          v.legend([['ink', 'circle $|z| = R$'], ['accent', 'image curve $f(\\{|z| = R\\})$'], ['green', 'the origin $0$', { dot: true }], ['faint', 'radii of the zeros', { dash: true }]]);
        }, { period: PERIOD, still: 0.45 * PERIOD });
        v.readout(() => {
          if (!st) return '';
          const { R, k, minAbs, inside, key } = st;
          if (key === 'exp') return `$R = ${nm(R)}$: the image of the circle winds $${k}$ times around $0$. $e^z$ is entire but not a polynomial: no term $z^m$ dominates on large circles, nothing forces the winding number up, and indeed $e^z \\ne 0$ everywhere.`;
          if (key === 'cst') return 'A constant maps every circle to one point: the winding number is always $0$, and a nonzero constant has no zeros — the theorem needs $p$ nonconstant.';
          return `$R = ${nm(R)}$: winding number of $p(\\{|z| = R\\})$ about $0$ is $${k}$, and $p$ has $${inside}$ zero${inside === 1 ? '' : 's'} in $|z| < R$; $\\min_{|z| = R}|p(z)| = ${nm(minAbs, 3)}$. The count can only change when this minimum hits $0$ — at a zero of $p$ on the circle.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Fundamental theorem of algebra, second version',
      statement: String.raw`If $p \in \mathcal P(\mathbf C)$ is a nonconstant polynomial of degree $m$, then
$$p(z) = c\,(z - \lambda_1)\cdots(z - \lambda_m)$$
for some $c, \lambda_1, \dots, \lambda_m \in \mathbf C$ (necessarily $c \ne 0$ is the leading coefficient), and this factorization is unique apart from the order of the factors.`,
      idea: String.raw`Existence by induction on $m$: the first version 4.12 gives a zero $\lambda_1$, and 4.6 splits $p = (z - \lambda_1)q$ with $\deg q = m - 1$; factor $q$ the same way. Comparing the coefficients of $z^m$ shows $c$ is the leading coefficient of $p$. Uniqueness: if $c(z - \lambda_1)\cdots(z - \lambda_m) = c(z - \tau_1)\cdots(z - \tau_m)$, put $z = \lambda_1$ to see that some $\tau_j = \lambda_1$; cancel that factor (the two quotients agree off a finite set, hence everywhere by 4.8) and repeat. So a monic polynomial of degree $m$ is the same thing as an unordered list of $m$ complex numbers.`,
      caption: String.raw`Left: the five coefficients of the quartic $p(z) = c z^4 + a_3z^3 + a_2z^2 + a_1z + a_0$. Right: its phase portrait and its zeros. In *drag the coefficients* mode, move any coefficient and watch the four zeros move continuously (computed numerically). In *drag the zeros* mode it runs the other way: move the zeros and the coefficients follow by multiplying out $c\prod(z - \lambda_k)$. Push $c$ to $0$ (it snaps) and one zero runs off to infinity — the degree drops to $3$ and only three zeros remain.`,
      deps: ['ladr-4.12', 'ladr-4.6', 'ladr-4.8'],
      see: ['pma-8.8', 'rca-10.43'],
      tags: ['polynomials', 'complex numbers'],
      viz(v) {
        const M = v.M;
        const R0 = [[1.2, 0.6], [-0.9, 0.9], [-0.7, -1.0], [0.6, -0.8]];
        const c0 = cFromRoots(R0, [1, 0]);
        let roots = R0.map((p) => p.slice());
        const sync = (md) => {
          if (md === 'root') {
            if (Math.hypot(A[4].x, A[4].y) < 0.2) { A[4].x = 0.6; A[4].y = 0; roots = cRoots(A.map((h) => h.x), A.map((h) => h.y)); }
            L.forEach((h, k) => { h.x = M.clamp(roots[k][0], -2.5, 2.5); h.y = M.clamp(roots[k][1], -2.5, 2.5); });
          } else {
            const { cr, ci } = cFromRoots(L.map((h) => [h.x, h.y]), [A[4].x, A[4].y]);
            A.forEach((h, k) => { h.x = M.clamp(cr[k], -2.9, 2.9); h.y = M.clamp(ci[k], -2.9, 2.9); });
          }
        };
        const mode = v.select('', [{ value: 'coef', label: 'drag the coefficients' }, { value: 'root', label: 'drag the zeros' }], 'coef', { onChange: (md) => sync(md) });
        const K = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, title: 'coefficients of $p$' });
        const Z = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, title: 'zeros of $p$ (phase portrait)' });
        const snapC = (x, y) => {
          const r = Math.hypot(x, y);
          if (mode.value === 'coef') return r < 0.09 ? [0, 0] : [x, y];
          return r < 0.2 ? (r < 1e-9 ? [0.2, 0] : [(0.2 * x) / r, (0.2 * y) / r]) : [x, y];
        };
        const A = [0, 1, 2, 3, 4].map((k) => K.handle(c0.cr[k], c0.ci[k], { color: k === 4 ? 'purple' : 'orange', label: k === 4 ? 'c' : `a${sub(k)}`, constrain: k === 4 ? snapC : undefined }));
        const L = R0.map((p, k) => Z.handle(p[0], p[1], { color: 'accent', label: `λ${sub(k + 1)}` }));
        L.forEach((h) => { h.visible = false; });
        let st = null;
        const edgeArrow = (S, x, y, lab) => {
          const b = S.bounds, r = Math.hypot(x, y), m = Math.min(b.x[1], b.y[1]) * 0.9, px = (x / r) * m, py = (y / r) * m;
          S.arrow(px * 0.82, py * 0.82, px, py, { color: 'red', width: 2.2 });
          S.text(lab, px, py, { color: 'red', size: 11.5, weight: 600, align: px > 0 ? 'right' : 'left', dy: py > 0 ? 12 : -12 });
        };
        v.render(() => {
          const isC = mode.value === 'coef';
          A.slice(0, 4).forEach((h) => { h.visible = isC; });
          L.forEach((h) => { h.visible = !isC; });
          let cr, ci;
          if (isC) { cr = A.map((h) => h.x); ci = A.map((h) => h.y); roots = cRoots(cr, ci, roots); }
          else { roots = L.map((h) => [h.x, h.y]); ({ cr, ci } = cFromRoots(roots, [A[4].x, A[4].y])); }
          const deg = roots.length;
          // coefficient plane
          K.circle(0, 0, 1, { color: 'grid', width: 1 });
          if (!isC) for (let k = 0; k < 4; k++) {
            const x = cr[k], y = ci[k];
            if (Math.abs(x) < 3 && Math.abs(y) < 3) K.dot(x, y, { color: 'orange', r: 5.5, label: `a${sub(k)}`, labelPos: 'ne' });
            else edgeArrow(K, x, y, `a${sub(k)}`);
          }
          if (deg < 4) K.corner('c = 0: the degree drops to ' + deg, 'tl', { color: 'red', weight: 700 });
          // zero plane
          phase(Z, (x, y) => cEval(cr, ci, x, y), cr.map((x, k) => x.toFixed(4) + ',' + ci[k].toFixed(4)).join(';'), 0.28);
          Z.axes();
          roots.forEach(([x, y], k) => {
            const dbl = roots.some(([u, w], j) => j !== k && Math.hypot(u - x, w - y) < 0.03);
            if (isC) {
              if (Math.abs(x) < 2.55 && Math.abs(y) < 2.55) Z.dot(x, y, { color: 'accent', r: 6.5, label: `λ${sub(k + 1)}`, labelPos: k % 2 ? 'sw' : 'ne' });
              else edgeArrow(Z, x, y, `|λ| = ${nmc(Math.hypot(x, y), 1)}`);
            }
            if (dbl && k === roots.findIndex(([u, w]) => Math.hypot(u - x, w - y) < 0.03)) Z.text('double', x, y, { dy: 18, align: 'center', color: 'ink', size: 11.5, weight: 700 });
          });
          Z.corner(`deg p = ${deg}: ${deg} zeros, counted with multiplicity`, 'tl', { color: deg === 4 ? 'ink' : 'red', weight: 700 });
          let res = 0; for (const [x, y] of roots) res = Math.max(res, Math.hypot(...cEval(cr, ci, x, y)));
          st = { cr, ci, deg, res, isC };
          v.legend([['purple', 'leading coefficient $c$', { dot: true }], ['orange', '$a_0, \\dots, a_3$', { dot: true }], ['accent', 'zeros $\\lambda_k$', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { cr, ci, deg, res, isC } = st, c = [cr[deg], ci[deg]];
          const cT = Math.hypot(c[0] - 1, c[1]) < 5e-3 ? '' : `(${cxT(c[0], c[1])})\\,`;
          const fac = `${cT}${roots.map(([x, y]) => facT(x, y)).join('')}`;
          if (!isC) return `Multiplying out: $p(z) = ${fac}$ $= ${polyCT(cr.slice(0, deg + 1), ci.slice(0, deg + 1))}$.`;
          return `$p(z) = ${fac}$ $\\;$ — check: $\\max_k|p(\\lambda_k)| = ${res < 1e-13 ? '0' : v.sci(res, 1)}$ (numerical zeros).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Real polynomials have nonreal zeros in conjugate pairs',
      statement: String.raw`Let $p \in \mathcal P(\mathbf C)$ be a polynomial whose coefficients are all real. If $\lambda \in \mathbf C$ is a zero of $p$, then so is $\bar\lambda$.`,
      idea: String.raw`Write $p(z) = a_0 + a_1z + \dots + a_mz^m$ with every $a_k \in \mathbf R$, so $\bar a_k = a_k$. Conjugation respects sums and products (4.4(d)), hence
$$p(\bar z) = \sum a_k\,\bar z^{\,k} = \overline{\sum a_k z^k} = \overline{p(z)} \quad\text{for every } z \in \mathbf C.$$
At a zero, $p(\bar\lambda) = \overline{p(\lambda)} = \bar 0 = 0$. The identity $p(\bar z) = \overline{p(z)}$ is the whole story: it fails as soon as one coefficient is nonreal, and then the zeros lose their mirror symmetry.`,
      caption: String.raw`Shape a real quartic with the sliders. Left: its zeros (blue) and, in purple rings, the mirror image of each zero — every ring holds a zero. Drag the gold test point $z$; its mirror $\bar z$ is purple. Right: the values $p(z)$ (gold) and $p(\bar z)$ (purple). With real coefficients $p(\bar z)$ always sits in the ring at $\overline{p(z)}$, the mirror image of $p(z)$; snap $z$ onto a zero and both values land on $0$. Give $a_1$ an imaginary part and both symmetries break.`,
      deps: ['ladr-4.4', 'ladr-4.5'],
      tags: ['polynomials', 'complex numbers'],
      viz(v) {
        const a3 = v.slider('$a_3$', -3, 3, -0.5, { step: 0.01 });
        const a2 = v.slider('$a_2$', -3, 3, -0.73, { step: 0.01 });
        const a1 = v.slider('$a_1$', -3, 3, 2.27, { step: 0.01 });
        const a0 = v.slider('$a_0$', -3, 3, -0.61, { step: 0.01 });
        const eps = v.slider('$\\operatorname{Im} a_1$ (break it)', -1, 1, 0, { step: 0.01 });
        const Z = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, title: 'zeros of $p$ and their mirror images' });
        const W = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, title: 'the values $p(z)$ and $p(\\bar z)$' });
        let roots = [];
        const zh = Z.handle(0.95, 1.45, { color: 'gold', label: 'z', constrain: (x, y) => { for (const [rx, ry] of roots) if (Math.hypot(x - rx, y - ry) < 0.12) return [rx, ry]; return [x, y]; } });
        const LEV = [1.5, 3, 6, 12, 25, 50, 100, 200, 400];
        let st = null;
        v.render(() => {
          const cr = [a0.value, a1.value, a2.value, a3.value, 1], ci = [0, eps.value, 0, 0, 0], real = eps.value === 0;
          roots = cRoots(cr, ci, roots);
          // z-plane
          phase(Z, (x, y) => cEval(cr, ci, x, y), cr.join(',') + '|' + ci[1], 0.32);
          Z.axes();
          Z.hline(0, { color: 'ink', width: 1.6, alpha: 0.55 });
          let sym = 0;
          for (const [x, y] of roots) { let dm = Infinity; for (const [u, w] of roots) dm = Math.min(dm, Math.hypot(u - x, w + y)); sym = Math.max(sym, dm); }
          for (const [x, y] of roots) Z.dot(x, -y, { hollow: true, color: 'purple', r: 10, width: 2.2 });
          for (const [x, y] of roots) Z.dot(x, y, { color: 'accent', r: 5.5 });
          const zx = zh.x, zy = zh.y;
          Z.line(zx, zy, zx, -zy, { color: 'purple', width: 1.2, dash: [4, 4] });
          Z.dot(zx, -zy, { color: 'purple', r: 6 });
          Z.tex('\\bar z', zx, -zy, { color: 'purple', align: 'left', dx: 10, dy: zy > 0 ? 10 : -10, size: 16 });
          Z.corner(sym < 1e-6 ? 'every mirrored zero is a zero ✓' : 'mirror images are not zeros ✗', 'tl', { color: sym < 1e-6 ? 'green' : 'red', weight: 700 });
          // w-plane
          const pz = cEval(cr, ci, zx, zy), pzb = cEval(cr, ci, zx, -zy), cj = [pz[0], -pz[1]];
          const need = 1.2 * Math.max(1, Math.hypot(...pz), Math.hypot(...pzb));
          const ext = LEV.find((l) => l >= need) || need;
          W.setView([-ext, ext], [-ext, ext]);
          W.hline(0, { color: 'ink', width: 1.6, alpha: 0.55 });
          W.line(pz[0], pz[1], cj[0], cj[1], { color: 'muted', width: 1.2, dash: [4, 4] });
          W.dot(cj[0], cj[1], { hollow: true, color: 'gold', r: 11, width: 2.2 });
          W.tex('\\overline{p(z)}', cj[0], cj[1], { color: 'gold', align: 'right', dx: -14, size: 15 });
          W.dot(pzb[0], pzb[1], { color: 'purple', r: 6 });
          W.tex('p(\\bar z)', pzb[0], pzb[1], { color: 'purple', align: 'left', dx: 13, dy: pzb[1] > 0 ? -10 : 10, size: 15 });
          W.dot(pz[0], pz[1], { color: 'gold', r: 6 });
          W.tex('p(z)', pz[0], pz[1], { color: 'gold', align: 'left', dx: 12, dy: pz[1] >= 0 ? -10 : 10, size: 15 });
          const gap = Math.hypot(pzb[0] - cj[0], pzb[1] - cj[1]);
          W.corner(gap < 1e-9 * (1 + Math.hypot(...pz)) ? 'p(z̄) = conj p(z) ✓' : 'p(z̄) ≠ conj p(z) ✗', 'tl', { color: gap < 1e-9 * (1 + Math.hypot(...pz)) ? 'green' : 'red', weight: 700 });
          st = { pz, pzb, gap, sym, real };
          v.legend([['accent', 'zeros $\\lambda$', { dot: true }], ['purple', 'mirror images $\\bar\\lambda$ (rings), $\\bar z$, $p(\\bar z)$', { dot: true }], ['gold', 'test point $z$ and $p(z)$', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { pz, pzb, gap, sym, real } = st;
          const tiny = (x) => (x < 1e-12 ? '0' : v.sci(x, 2));
          return `$p(\\bar z) = ${cxT(pzb[0], pzb[1], 3)}$, $\\;\\overline{p(z)} = ${cxT(pz[0], -pz[1], 3)}$, difference $${tiny(gap)}$. Largest distance from a mirrored zero $\\bar\\lambda_k$ to the nearest zero: $${tiny(sym)}$` + (real ? ' — the coefficients are real.' : ` — $a_1$ is not real.`);
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Factorization of a quadratic polynomial',
      statement: String.raw`Let $b, c \in \mathbf R$. Then there are $\lambda_1, \lambda_2 \in \mathbf R$ with
$$x^2 + bx + c = (x - \lambda_1)(x - \lambda_2)$$
if and only if $b^2 \ge 4c$.`,
      idea: String.raw`Complete the square: $x^2 + bx + c = \bigl(x + \tfrac b2\bigr)^2 + \bigl(c - \tfrac{b^2}{4}\bigr)$. If $b^2 < 4c$ the right side is positive for every real $x$, so the polynomial has no real zero and cannot have a real linear factor. If $b^2 \ge 4c$, then $d = \sqrt{b^2/4 - c}$ is real and the right side is a difference of squares, $(x + \tfrac b2 - d)(x + \tfrac b2 + d)$, giving $\lambda_{1,2} = -\tfrac b2 \pm d$. When $b^2 < 4c$ the same formula over $\mathbf C$ gives the conjugate pair $-\tfrac b2 \pm i\sqrt{c - b^2/4}$, whose product is $c$ and whose sum is $-b$.`,
      caption: String.raw`Drag the point $(b, c)$ in the left panel. Below the parabola $c = b^2/4$ (green) the graph in the middle meets the axis twice and the two zeros sit on the real line (right). Cross the parabola (the handle snaps onto it, giving a double zero): the vertex lifts off the axis by $c - b^2/4$, and the zeros collide and leave the real line as a conjugate pair, moving along the vertical line $\operatorname{Re} z = -b/2$ and the circle $|z| = \sqrt c$.`,
      deps: [],
      tags: ['polynomials'],
      viz(v) {
        const P = v.stage({ x: [-4, 4], y: [-3, 5], height: 300, xlabel: 'b', ylabel: 'c', title: 'the $(b, c)$-plane', minWidth: 240 });
        const G = v.stage({ x: [-4, 4], y: [-3.5, 5.5], height: 300, xlabel: 'x', title: '$y = x^2 + bx + c$', minWidth: 240 });
        const Z = v.stage({ x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, height: 300, title: 'zeros in $\\mathbf C$', minWidth: 240 });
        const h = P.handle(-1.5, 1.6, { color: 'accent', label: '(b, c)', labelPos: 'e', constrain: (b, c) => [b, Math.abs(c - (b * b) / 4) < 0.07 ? (b * b) / 4 : c] });
        let st = null;
        v.render(() => {
          const b = h.x, c = h.y, D = b * b - 4 * c, real = D >= 0;
          // parameter plane
          P.between((x) => (x * x) / 4, () => -4, -4, 4, { fill: 'green', fillAlpha: 0.14 });
          P.between(() => 6, (x) => (x * x) / 4, -4, 4, { fill: 'red', fillAlpha: 0.1 });
          P.fn((x) => (x * x) / 4, { color: 'ink', width: 2 });
          P.tex('b^2 < 4c', 1.9, 4.2, { color: 'red', size: 14 });
          P.tex('b^2 > 4c', 2.1, -1.6, { color: 'green', size: 14 });
          P.vline(b, { color: 'accent', width: 1, dash: [4, 4], alpha: 0.6 });
          // graph
          const vx = -b / 2, vy = c - (b * b) / 4;
          G.fn((x) => x * x + b * x + c, { color: 'accent', width: 2.6 });
          G.line(vx, 0, vx, vy, { color: 'orange', width: 2, dash: [4, 3] });
          G.dot(vx, vy, { color: 'orange', r: 4.5 });
          G.text(`c − b²/4 = ${nmc(vy)}`, vx, vy, { color: 'orange', align: 'left', baseline: 'top', dx: 8, dy: 6, size: 13, weight: 600 });
          let l1, l2;
          if (real) { const d = Math.sqrt(D) / 2; l1 = [vx - d, 0]; l2 = [vx + d, 0]; G.dot(l1[0], 0, { color: 'green', r: 5.5 }); G.dot(l2[0], 0, { color: 'green', r: 5.5 }); }
          else { const d = Math.sqrt(-D) / 2; l1 = [vx, d]; l2 = [vx, -d]; }
          G.corner(real ? (D === 0 ? 'one double zero' : 'two real zeros') : 'no real zero', 'tl', { color: real ? 'green' : 'red', weight: 700 });
          // zeros in C
          Z.vline(vx, { color: 'faint', width: 1.2, dash: [4, 4] });
          if (c > 0) Z.circle(0, 0, Math.sqrt(c), { color: 'faint', width: 1.2, dash: [3, 4] });
          if (!real) Z.line(l1[0], l1[1], l2[0], l2[1], { color: 'orange', width: 1.2, dash: [4, 4] });
          const col = real ? 'green' : 'orange';
          if (real && D === 0) { Z.dot(l1[0], 0, { color: col, r: 7, label: 'λ₁ = λ₂', labelPos: 'n' }); }
          else {
            Z.dot(l1[0], l1[1], { color: col, r: 6.5, label: 'λ₁', labelPos: real ? 'n' : 'ne' });
            Z.dot(l2[0], l2[1], { color: col, r: 6.5, label: 'λ₂', labelPos: real ? 's' : 'se' });
          }
          Z.corner(real ? 'real zeros: real factorization' : 'conjugate pair: irreducible over R', 'tl', { color: real ? 'green' : 'red', weight: 700 });
          st = { b, c, D, l1, l2, real, vy };
          v.legend([['green', 'real zeros', { dot: true }], ['orange', 'conjugate pair', { dot: true }], ['faint', '$\\operatorname{Re} z = -b/2$ and $|z| = \\sqrt c$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { b, c, D, l1, l2, real, vy } = st, pT = polyT([c, b, 1], 'x');
          if (real) return `$b^2 - 4c = ${nm(D)} \\ge 0$: $\\;${pT} = ${facT(l1[0], 0, 'x')}${facT(l2[0], 0, 'x')}$ with real $\\lambda_1, \\lambda_2$.`;
          return `$b^2 - 4c = ${nm(D)} < 0$: $\\;${pT} = \\bigl(x ${b >= 0 ? '+' : '-'} ${nm(Math.abs(b / 2))}\\bigr)^2 + ${nm(vy)} > 0$ for every real $x$, so there is no real factorization; over $\\mathbf C$ it is $${facT(l1[0], l1[1], 'x')}${facT(l2[0], l2[1], 'x')}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'Factorization of a polynomial over R',
      statement: String.raw`If $p \in \mathcal P(\mathbf R)$ is nonconstant, then $p$ has a factorization
$$p(x) = c\,(x - \lambda_1)\cdots(x - \lambda_m)\,(x^2 + b_1x + c_1)\cdots(x^2 + b_Mx + c_M)$$
with $c, \lambda_1, \dots, \lambda_m, b_1, \dots, b_M, c_1, \dots, c_M \in \mathbf R$ and $b_k^2 < 4c_k$ for each $k$ (either $m$ or $M$ may be $0$). It is unique apart from the order of the factors.`,
      idea: String.raw`View $p$ as a polynomial with complex coefficients and factor it completely over $\mathbf C$ (4.13). Its real zeros give the real linear factors. By 4.14 the nonreal zeros come in conjugate pairs, and each pair multiplies to a real quadratic:
$$(x - \lambda)(x - \bar\lambda) = x^2 - 2(\operatorname{Re}\lambda)\,x + |\lambda|^2,$$
with $b^2 - 4c = -4(\operatorname{Im}\lambda)^2 < 0$, so it is irreducible over $\mathbf R$ by 4.15. Multiplicities need care — a pair repeated $k$ times must be paired off $k$ times — which is done by induction, dividing out one quadratic at a time. Uniqueness follows from uniqueness over $\mathbf C$.`,
      caption: String.raw`Drag the zeros of a real quintic: green ones live on the real axis, and each orange or purple zero drags its mirror image along (rings), because real coefficients force conjugate pairs. Right: the graph of $p$ crosses the axis only at the real zeros, while each pair contributes the dashed parabola $(x - \alpha)^2 + \beta^2$ with vertex $(\alpha, \beta^2)$, which never touches the axis. Pull a pair down onto the real axis (it snaps): the parabola touches, $b^2 = 4c$, and the quadratic splits into two equal linear factors.`,
      deps: ['ladr-4.13', 'ladr-4.14', 'ladr-4.8', 'ladr-4.15'],
      tags: ['polynomials'],
      viz(v) {
        const M = v.M;
        const CFG = { 5: { r: [-2.0, -1.1, -0.15, 0.8, 1.9], p: [] }, 3: { r: [-1.8, -0.5, 1.6], p: [[0.55, 1.1]] }, 1: { r: [-1.5], p: [[0.75, 1.0], [-0.5, 1.7]] } };
        const PC = ['orange', 'purple'];
        const place = (k) => { const C = CFG[k]; Rh.forEach((h, j) => { h.visible = j < C.r.length; if (j < C.r.length) { h.x = C.r[j]; h.y = 0; } }); Ph.forEach((h, j) => { h.visible = j < C.p.length; if (j < C.p.length) { h.x = C.p[j][0]; h.y = C.p[j][1]; } }); };
        const cfg = v.select('', [{ value: '5', label: '5 real zeros' }, { value: '3', label: '3 real + 1 pair' }, { value: '1', label: '1 real + 2 pairs' }], '3', { onChange: (k) => place(k) });
        const cS = v.slider('leading coefficient $c$', 0.1, 1.5, 0.35, { step: 0.05 });
        const Z = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, title: 'zeros in $\\mathbf C$' });
        const G = v.stage({ x: [-2.6, 2.6], y: [-4, 6], height: 340, xlabel: 'x', title: '$p$ on $\\mathbf R$ and its quadratic factors' });
        const Rh = [0, 1, 2, 3, 4].map(() => Z.handle(0, 0, { color: 'green', r: 6.5, constrain: (x) => [M.clamp(x, -2.4, 2.4), 0] }));
        const Ph = [0, 1].map((k) => Z.handle(0, 1, { color: PC[k], r: 6.5, label: k ? 'μ' : 'λ', constrain: (x, y) => [M.clamp(x, -2.4, 2.4), y < 0.07 ? 0 : M.clamp(y, 0, 2.3)] }));
        place('3');
        let st = null;
        v.render(() => {
          const c = cS.value;
          const reals = Rh.filter((h) => h.visible).map((h) => h.x);
          const pairs = Ph.filter((h) => h.visible).map((h, k) => ({ a: h.x, b: h.y, col: PC[k] }));
          const roots = [...reals.map((x) => [x, 0]), ...pairs.flatMap(({ a, b }) => [[a, b], [a, -b]])];
          const { cr, ci } = cFromRoots(roots, [c, 0]);
          const pr = (x) => { let s = c; for (const r of reals) s *= x - r; for (const { a, b } of pairs) s *= (x - a) ** 2 + b * b; return s; };
          // complex plane
          phase(Z, (x, y) => cEval(cr, ci, x, y), roots.flat().map((x) => x.toFixed(3)).join(',') + c, 0.3);
          Z.axes();
          for (const { a, b, col } of pairs) {
            Z.line(a, b, a, -b, { color: col, width: 1.2, dash: [4, 4] });
            Z.dot(a, -b, { hollow: true, color: col, r: 7, width: 2.4 });
            if (b > 0) Z.tex(col === PC[0] ? '\\bar\\lambda' : '\\bar\\mu', a, -b, { color: col, align: 'left', dx: 11, dy: 6, size: 15 });
          }
          const nR = reals.length + pairs.filter((q) => q.b === 0).length * 2, nP = pairs.filter((q) => q.b > 0).length;
          Z.corner(`${nR} real zero${nR === 1 ? '' : 's'}, ${nP} conjugate pair${nP === 1 ? '' : 's'}`, 'tl', { color: 'ink', weight: 700 });
          // graph over R
          for (const { a, b, col } of pairs) {
            G.fn((x) => (x - a) ** 2 + b * b, { color: col, width: 1.8, dash: [6, 4] });
            G.dot(a, b * b, { color: col, r: 4.5 });
            G.text(`(x ${a >= 0 ? '−' : '+'} ${nm(Math.abs(a))})²${b > 0 ? ` + ${nm(b * b)}` : ''}`, a, b * b, { color: col, align: 'center', baseline: 'top', dy: 8, size: 13, weight: 600 });
          }
          G.fn(pr, { color: 'ink', width: 2.8 });
          for (const r of reals) G.dot(r, 0, { color: 'green', r: 5 });
          for (const { a, b } of pairs) if (b === 0) G.dot(a, 0, { color: 'red', r: 5.5 });
          let maxIm = 0; for (const x of ci) maxIm = Math.max(maxIm, Math.abs(x));
          st = { c, reals, pairs, maxIm };
          v.legend([['ink', '$p$'], ['green', 'real zeros: linear factors', { dot: true }], ...pairs.map((q, k) => [q.col, `${k ? '$\\mu, \\bar\\mu$' : '$\\lambda, \\bar\\lambda$'} → quadratic factor`, { dash: true }])]);
        });
        v.readout(() => {
          if (!st) return '';
          const { c, reals, pairs, maxIm } = st;
          const lin = [...reals, ...pairs.filter((q) => q.b === 0).flatMap((q) => [q.a, q.a])].sort((x, y) => x - y).map((x) => facT(x, 0, 'x')).join('');
          const quad = pairs.filter((q) => q.b > 0).map((q) => `(${polyT([q.a * q.a + q.b * q.b, -2 * q.a, 1], 'x')})`).join('');
          const disc = pairs.filter((q) => q.b > 0).map((q) => nm(-4 * q.b * q.b)).join(', ');
          const merged = pairs.some((q) => q.b === 0);
          return `$p(x) = ${nm(c)}\\,${lin}${quad ? '\\,' + quad : ''}$` + (disc ? ` — quadratic factors with $b_k^2 - 4c_k = ${disc} < 0$.` : '.') + (merged ? ' A pair has landed on the real axis: its quadratic $(x - \\alpha)^2$ has $b^2 = 4c$ and splits into linear factors.' : '') + ` Multiplying out $c\\prod_j(x - \\lambda_j)$ over all five complex zeros: largest imaginary part of a coefficient $= ${v.sci(maxIm, 1)}$.`;
        });
      },
    },
  ],
};
