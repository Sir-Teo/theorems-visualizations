// Rudin, Functional Analysis — Chapter 2: Completeness
// Items 2.1–2.6 (Baire category, Banach–Steinhaus). Later items live in ch02-a2.js, ch02-a3.js.

// ---------------------------------------------------------------- helpers
/** Children of a construction interval [l,r] at depth d: 'c3' = middle thirds, 'fat' = Smith–Volterra–Cantor (removes 4^-(d+1)). */
function cantorKids(kind, l, r, d) {
  if (kind === 'c3') { const w = (r - l) / 3; return [[l, l + w], [r - w, r]]; }
  const g = Math.pow(4, -(d + 1)), m = (l + r) / 2;
  return [[l, m - g / 2], [m + g / 2, r]];
}
/** Construction intervals narrower than tol that meet [a,b] (they cover the set there). */
function cantorCover(kind, a, b, tol, cap = 5000) {
  const out = [];
  const rec = (l, r, d) => {
    if (r < a || l > b || out.length > cap) return;
    if (r - l < tol || d > 48) { out.push([l, r]); return; }
    for (const [l2, r2] of cantorKids(kind, l, r, d)) rec(l2, r2, d + 1);
  };
  rec(0, 1, 0);
  return out;
}
/** Longest removed open gap meeting (a,b), clipped to (a,b): an open interval inside (a,b) that misses the set. */
function cantorGap(kind, a, b) {
  let best = null, bl = 0;
  const take = (l, r) => { const L = Math.max(l, a), R = Math.min(r, b); if (R - L > bl) { bl = R - L; best = [L, R]; } };
  if (a < 0) take(a, 0);
  if (b > 1) take(1, b);
  const rec = (l, r, d) => {
    if (r <= a || l >= b || d > 60) return;
    const [k1, k2] = cantorKids(kind, l, r, d);
    const gl = k1[1], gr = k2[0];
    if (gr - gl <= bl * 0.999 && bl > 0) return; // deeper gaps are even shorter
    take(gl, gr);
    rec(k1[0], k1[1], d + 1); rec(k2[0], k2[1], d + 1);
  };
  rec(0, 1, 0);
  return best;
}
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUBS[+d]).join('');
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
/** Rationals in [0,1] in order of increasing denominator: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, ... */
function rationals(count) {
  const out = [[0, 1], [1, 1]];
  for (let q = 2; out.length < count; q++) for (let p = 1; p < q; p++) if (gcd(p, q) === 1) out.push([p, q]);
  return out.slice(0, count);
}
/** Paint closed intervals as bars, at least 1px wide (sets finer than a pixel stay visible). */
function paintIntervals(S, list, y0, y1, color, alpha = 0.85) {
  const c = S.ctx; c.save(); c.fillStyle = color; c.globalAlpha = alpha;
  const Y0 = S.Y(y1), Y1 = S.Y(y0);
  for (const [l, r] of list) {
    let X0 = S.X(l), X1 = S.X(r);
    if (X1 - X0 < 1) { const m = (X0 + X1) / 2; X0 = m - 0.5; X1 = m + 0.5; }
    c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  }
  c.restore();
}
/** Keep {x : <a,x> <= c} of a convex polygon. */
function clipHalf(poly, a, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a[0] * P[0] + a[1] * P[1] - c, fq = a[0] * Q[0] + a[1] * Q[1] - c;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Draw the parallel lines {x : <x,u> = phi + k s} that cross the stage. */
function drawLineFamily(S, u, s, phi, st) {
  const b = S.bounds, cs = [[b.x[0], b.y[0]], [b.x[1], b.y[0]], [b.x[0], b.y[1]], [b.x[1], b.y[1]]];
  const pr = cs.map((p) => p[0] * u[0] + p[1] * u[1]);
  const lo = Math.ceil((Math.min(...pr) - phi) / s), hi = Math.floor((Math.max(...pr) - phi) / s);
  if (hi - lo > 600) return;
  const w = [-u[1], u[0]], D = Math.hypot(b.x[1] - b.x[0], b.y[1] - b.y[0]);
  const cx = (b.x[0] + b.x[1]) / 2, cy = (b.y[0] + b.y[1]) / 2, tc = cx * w[0] + cy * w[1];
  for (let k = lo; k <= hi; k++) {
    const t = phi + k * s, p = [u[0] * t + w[0] * tc, u[1] * t + w[1] * tc];
    S.line(p[0] - w[0] * D, p[1] - w[1] * D, p[0] + w[0] * D, p[1] + w[1] * D, st);
  }
}
const LOGTICKS = [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1000']];

export default {
  collection: 'fa',
  chapter: 2,
  title: 'Completeness',
  summary: String.raw`Completeness enters functional analysis through Baire's theorem: a complete metric space (or a locally compact Hausdorff space) is not a countable union of nowhere dense sets. From this one fact Rudin extracts the Banach–Steinhaus theorem — pointwise bounded families of operators on an F-space are equicontinuous, and pointwise limits of continuous operators are continuous — then the open mapping theorem with its corollaries on inverses and comparable topologies, the closed graph theorem, and the joint continuity of separately continuous bilinear maps.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Nowhere dense sets; first and second category',
      credit: 'Baire, 1899',
      statement: String.raw`Let $S$ be a topological space. A set $E\subset S$ is **nowhere dense** if its closure $\overline E$ has empty interior. $E$ is **of the first category** in $S$ if it is a countable union of nowhere dense sets; every subset of $S$ that is not of the first category is **of the second category** in $S$. Directly from the definitions:
(a) a subset of a set of the first category is of the first category;
(b) a countable union of sets of the first category is of the first category;
(c) a closed set with empty interior is of the first category;
(d) a homeomorphism of $S$ onto $S$ maps sets of either category onto sets of the same category.`,
      idea: String.raw`Category is a topological notion of smallness, parallel to (but independent of) measure zero: the fat Cantor set is nowhere dense yet has measure $\tfrac12$, while $\mathbb Q$ is dense yet of the first category. Properties (a)–(c) are immediate, and (d) holds because homeomorphisms preserve closures and interiors — in a topological vector space this applies to translations $x\mapsto x+a$ and dilations $x\mapsto\alpha x$, $\alpha\ne0$.`,
      caption: String.raw`Choose a set $E\subset[0,1]$, drag the centre of the window $I$ and shrink it with the slider; the lower panel zooms into $I$. The green interval $J$ is the longest open subinterval of $I$ that misses $\overline E$. A nowhere dense set leaves such a hole in every window, at every scale (for the fat Cantor set the holes become tiny but never vanish). $\mathbb Q$ leaves none, yet it is still of the first category, being a countable union of points.`,
      deps: [],
      see: ['rca-5.7', 'rca-5.6'],
      tags: ['Baire category', 'topology'],
      viz(v) {
        const M = v.M;
        const SETS = {
          c3: { label: 'Cantor set' },
          fat: { label: 'fat Cantor set' },
          inv: { label: '$\\{1/n\\}\\cup\\{0\\}$' },
          q: { label: '$\\mathbb Q\\cap[0,1]$' },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'c3');
        const width = v.slider('width of $I$', 1e-6, 0.6, 0.045, { log: true, fmt: (x) => v.fmt(x, 2) });
        const top = v.stage({ x: [-0.03, 1.03], y: [-0.42, 0.5], height: 120, axes: false, full: true, title: '$E\\subset[0,1]$ and the window $I$' });
        const zoom = v.stage({ x: [0, 1], y: [-0.55, 0.75], height: 210, axes: false, full: true, title: 'zoom into $I$' });
        const ch = top.handle(0.245, 0.3, { color: 'orange', label: 'I', constrain: (x) => [M.clamp(x, 0, 1), 0.3] });
        let info = {};

        // draw E on [a,b] inside stage S (band y0..y1); return extra info
        function drawSet(S, kind, a, b, y0, y1) {
          const tol = (b - a) / S.width * 0.8;
          if (kind === 'c3' || kind === 'fat') {
            const cov = cantorCover(kind, a, b, tol);
            paintIntervals(S, cov, y0, y1, v.color('accent'));
            let meas = 0; for (const [l, r] of cov) meas += Math.max(0, Math.min(r, b) - Math.max(l, a));
            return { meas };
          }
          if (kind === 'inv') {
            const nLo = Math.max(1, Math.floor(1 / b)), nHi = a > 0 ? Math.ceil(1 / a) : Infinity;
            const last = Math.min(nHi, nLo + 3000);
            const pts = [];
            for (let n = nLo; n <= last; n++) { const x = 1 / n; if (x >= a && x <= b) pts.push([x, x]); }
            paintIntervals(S, pts, y0, y1, v.color('accent'));
            if (last < nHi && a <= 1 / last) paintIntervals(S, [[Math.max(a, 0), 1 / last]], y0, y1, v.color('accent'), 0.85);
            if (a <= 0) paintIntervals(S, [[0, 0]], y0, y1, v.color('accent'));
            return {};
          }
          // rationals: ticks with height ~ 1/sqrt(q)
          const w = b - a, Qmax = Math.max(2, Math.min(6000, Math.floor(Math.sqrt(1400 / (w * 0.31 + 1e-12)))));
          const c = S.ctx; c.save(); c.strokeStyle = v.color('accent'); c.lineWidth = 1;
          let count = 0; c.beginPath();
          for (let q = 1; q <= Qmax; q++) {
            for (let p = Math.max(0, Math.ceil(a * q)); p <= Math.min(q, Math.floor(b * q)); p++) {
              if (gcd(p, q) !== 1) continue;
              const X = Math.round(S.X(p / q)) + 0.5, h = (y1 - y0) * (0.2 + 0.8 / Math.sqrt(q)) / 2, ym = (y0 + y1) / 2;
              c.moveTo(X, S.Y(ym - h)); c.lineTo(X, S.Y(ym + h)); count++;
            }
          }
          c.stroke(); c.restore();
          return { count, Qmax };
        }
        function gapOf(kind, a, b) {
          if (kind === 'c3' || kind === 'fat') return cantorGap(kind, a, b);
          if (kind === 'inv') {
            let best = null, bl = 0;
            const nLo = Math.max(1, Math.floor(1 / b) - 1), nHi = a > 0 ? Math.min(Math.ceil(1 / a) + 1, nLo + 4000) : nLo + 4000;
            for (let n = nLo; n <= nHi; n++) {
              const L = Math.max(1 / (n + 1), a), R = Math.min(1 / n, b);
              if (R - L > bl) { bl = R - L; best = [L, R]; }
            }
            if (b > 1 && b - Math.max(1, a) > bl) best = [Math.max(1, a), b];
            return best;
          }
          return null;
        }

        v.render(() => {
          const kind = which.value, w = width.value;
          let a = ch.x - w / 2, b = ch.x + w / 2;
          if (a < 0) { b -= a; a = 0; } if (b > 1) { a -= b - 1; b = 1; } a = Math.max(0, a);
          // top: the whole set
          top.line(0, 0, 1, 0, { color: 'faint', width: 1 });
          for (const [x, lab] of [[0, '0'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [1, '1']]) { top.line(x, -0.2, x, -0.16, { color: 'muted', width: 1 }); top.text(lab, x, -0.3, { align: 'center', size: 11, color: 'muted' }); }
          drawSet(top, kind, 0, 1, -0.11, 0.11);
          top.vband(a, b, { color: 'orange', alpha: 0.18 });
          const Xa = top.X(a), Xb = top.X(b);
          if (Xb - Xa < 3) { top.line(ch.x, -0.16, ch.x, 0.3, { color: 'orange', width: 1.5 }); }
          else { top.line(a, -0.14, a, 0.2, { color: 'orange', width: 1.4 }); top.line(b, -0.14, b, 0.2, { color: 'orange', width: 1.4 }); }
          // zoom
          const pad = (b - a) * 0.03;
          zoom.setView([a - pad, b + pad], null);
          zoom.vband(a, b, { color: 'orange', alpha: 0.06 });
          zoom.line(a - pad, 0, b + pad, 0, { color: 'faint', width: 1 });
          const extra = drawSet(zoom, kind, a, b, -0.16, 0.16);
          const J = gapOf(kind, a, b);
          if (J) {
            const [L, R] = J;
            let X0 = zoom.X(L), X1 = zoom.X(R); if (X1 - X0 < 2) { const m = (X0 + X1) / 2; X0 = m - 1; X1 = m + 1; }
            const c = zoom.ctx; c.save(); c.fillStyle = v.color('green', 0.18); c.fillRect(X0, 0, X1 - X0, zoom.height); c.restore();
            zoom.line(zoom.invX(X0), 0.42, zoom.invX(X1), 0.42, { color: 'green', width: 5, cap: 'butt' });
            zoom.tex('J', zoom.invX((X0 + X1) / 2), 0.42, { color: 'green', baseline: 'bottom', dy: -6 });
          } else {
            zoom.line(a, 0.42, b, 0.42, { color: 'red', width: 2, dash: [5, 4] });
            zoom.corner('no hole: the closure of E contains all of I', 'tr', { color: 'red', weight: 600 });
          }
          zoom.corner(v.fmt(a, 9), 'bl', { color: 'muted' });
          zoom.corner(v.fmt(b, 9), 'br', { color: 'muted' });
          zoom.setTitle(`zoom into $I$ — magnification $\\times${v.fmt(1 / (b - a), 3)}$`);
          info = { kind, a, b, J, ...extra };
          v.legend([['accent', '$E$ (closure drawn)', { area: true }], ['orange', 'window $I$', { area: true }], ['green', 'hole $J\\subset I\\setminus\\overline E$', { area: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.kind) return '';
          const w = s.b - s.a;
          if (s.kind === 'q') return `$\\overline{\\mathbb Q}\\supset I$: the ${s.count} rationals drawn (denominators $\\le ${s.Qmax}$) already crowd every subinterval. So $\\mathbb Q$ is **not** nowhere dense — but $\\mathbb Q=\\bigcup_k\\{q_k\\}$ is a countable union of nowhere dense points, hence of the first category.`;
          const J = s.J, jl = J ? J[1] - J[0] : 0;
          let msg = `$|I| = ${v.fmt(w, 3)}$, longest hole $|J| = ${v.fmt(jl, 3)}$ $\\;(${v.fmt(100 * jl / w, 3)}\\%$ of $I)$.`;
          if (s.kind === 'c3') msg += ' The Cantor set is closed with empty interior, and has measure $0$.';
          if (s.kind === 'fat') msg += ` Here $E$ fills $\\approx ${v.fmt(100 * s.meas / w, 3)}\\%$ of $I$ (total measure $\\tfrac12$), yet a hole is always left.`;
          if (s.kind === 'inv') msg += ' The points $1/n$ accumulate only at $0$; the closure adds just that point.';
          return msg;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: "Baire's theorem",
      credit: 'Baire, 1899',
      statement: String.raw`Suppose $S$ is either
(a) a complete metric space, or
(b) a locally compact Hausdorff space.
Then the intersection of every countable collection of dense open subsets of $S$ is dense in $S$. In particular $S$ is of the second category in itself: if $S$ (or any nonempty open subset of $S$) is covered by countably many closed sets, at least one of them has nonempty interior.`,
      idea: String.raw`Let $V_1,V_2,\dots$ be dense and open, and $B_0$ any nonempty open set. Because $V_1$ is dense and open, $B_0\cap V_1$ is a nonempty open set and so contains the closure of a smaller ball $B_1$; inductively $\overline{B_n}\subset B_{n-1}\cap V_n$ with radii tending to $0$. In case (a) the centres form a Cauchy sequence whose limit lies in every $\overline{B_n}$ — that is where completeness is used. In case (b) one takes the $\overline{B_n}$ compact and uses the finite intersection property. Either way $B_0\cap\bigcap_n V_n\neq\emptyset$.`,
      caption: String.raw`Drag the centre and the rim of $B_0$, then step through $n$. Each $E_n$ (red) is a family of parallel lines — closed and nowhere dense — so $V_n=\R^2\setminus E_n$ is dense and open. The right panel zooms into $B_{n-1}$ and shows the next closed ball $\overline{B_n}$ (green) fitting inside $B_{n-1}$ while dodging $E_n$. Switch to $\mathbb Q$: the same nested construction, dodging $q_1,q_2,\dots$, converges to a point that is not in $\mathbb Q$.`,
      deps: ['fa-2.1', 'pma-3.12', 'pma-2.36'],
      see: ['rca-5.6', 'pma-3.11', 'pma-3.10'],
      tags: ['Baire category', 'completeness'],
      viz(v) {
        const M = v.M;
        const NMAX = 12;
        const mode = v.select('space', [{ value: 'R2', label: '$\\R^2$ (complete)' }, { value: 'Q', label: '$\\mathbb Q$ (not complete)' }], 'R2');
        const step = v.slider('step $n$', 1, NMAX, 3, { int: true });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.1, 1.1], axes: false, height: 380, title: 'the space and the nested balls' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], axes: false, height: 380, title: 'zoom' });
        const c0 = L.handle(-0.12, 0.06, { color: 'ink' });
        const rh = L.handle(0.5, 0.06, { color: 'gray', r: 6 });
        let prev = [c0.x, c0.y];
        c0.onDrag = () => { rh.x += c0.x - prev[0]; rh.y += c0.y - prev[1]; prev = [c0.x, c0.y]; };
        // E_n: lines <x,u_n> = phi_n + k s_n
        const fam = (n) => { const th = 0.5 + 2.399963 * n; const s = 0.55 * Math.pow(0.45, n - 1); return { u: [Math.cos(th), Math.sin(th)], s, phi: 0.137 * s * n }; };
        function chain(c, r, N) {
          const out = [{ c, r }];
          for (let n = 1; n <= N; n++) {
            const { u, s, phi } = fam(n);
            const t0 = c[0] * u[0] + c[1] * u[1] - phi;
            let best = -1, bt = 0;
            for (let i = 0; i <= 600; i++) {
              const tau = -r + (2 * r * i) / 600, t = t0 + tau;
              const val = Math.min(Math.abs(t - s * Math.round(t / s)), r - Math.abs(tau));
              if (val > best) { best = val; bt = tau; }
            }
            const rn = Math.min(0.85 * best, r / 2);
            c = [c[0] + bt * u[0], c[1] + bt * u[1]]; r = rn;
            out.push({ c, r });
          }
          return out;
        }
        // Q mode: nested thirds dodging the enumerated rationals
        const QS = rationals(200);
        function qchain(N) {
          const out = [{ l: 0, r: 1, hit: false }];
          let l = 0, r = 1;
          for (let n = 1; n <= N; n++) {
            const q = QS[n - 1][0] / QS[n - 1][1], d = (r - l) / 3;
            const thirds = [[l, l + d], [l + d, l + 2 * d], [l + 2 * d, r]];
            const hit = q >= l && q <= r;
            const pref = Math.floor(3 * ((n * 0.6180339887498949) % 1));   // a non-periodic preference
            const [l2, r2] = [0, 1, 2].map((j) => thirds[(pref + j) % 3]).find(([a, b]) => q < a || q > b);
            l = l2; r = r2; out.push({ l, r, hit });
          }
          return out;
        }
        let info = {};
        const fitView = (S, cx, cy, hx, hy) => { const k = S.height / S.width; const HX = Math.max(hx, hy / k); S.setView([cx - HX, cx + HX], [cy - HX * k, cy + HX * k]); };

        v.render(() => {
          const n = step.value;
          if (mode.value === 'R2') {
            c0.visible = rh.visible = true;
            fitView(L, 0, 0, 1.25, 1.08);
            const r0 = M.clamp(Math.hypot(rh.x - c0.x, rh.y - c0.y), 0.25, 0.95);
            const ch = chain([c0.x, c0.y], r0, NMAX + 6);
            const xs = ch[ch.length - 1].c;
            // left: E_1..E_3 and the balls
            for (let k = 3; k >= 1; k--) { const f = fam(k); drawLineFamily(L, f.u, f.s, f.phi, { color: 'red', width: 1, alpha: [0, 0.55, 0.32, 0.18][k] }); }
            L.circle(c0.x, c0.y, r0, { fill: 'accent', fillAlpha: 0.08, color: 'ink', width: 2 });
            for (let k = 1; k <= n; k++) { const B = ch[k]; L.circle(B.c[0], B.c[1], B.r, k === n ? { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.8 } : { color: 'accent', width: 1.4 }); }
            const Bp = ch[n - 1], hz = 1.35 * Bp.r;
            if (hz * L.scale > 10) L.rect(Bp.c[0] - hz, Bp.c[1] - hz, Bp.c[0] + hz, Bp.c[1] + hz, { color: 'muted', width: 1, dash: [3, 3] });
            L.dot(xs[0], xs[1], { color: 'gold', r: 3.5 });
            L.tex('B_0', c0.x, c0.y + r0, { baseline: 'bottom', dy: -3, color: 'ink' });
            L.corner('E₁, E₂, E₃ drawn (red); E_n gets finer', 'bl', { size: 11 });
            // right: zoom on B_{n-1}
            fitView(R, Bp.c[0], Bp.c[1], hz, hz);
            for (let k = 1; k < n; k++) { const f = fam(k); drawLineFamily(R, f.u, f.s, f.phi, { color: 'red', width: 1, alpha: 0.22 }); }
            const f = fam(n); drawLineFamily(R, f.u, f.s, f.phi, { color: 'red', width: 1.8 });
            const B = ch[n];
            R.circle(Bp.c[0], Bp.c[1], Bp.r, { fill: 'accent', fillAlpha: 0.08, color: 'ink', width: 2 });
            R.circle(B.c[0], B.c[1], B.r, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2 });
            R.dot(B.c[0], B.c[1], { color: 'green', r: 3 });
            R.dot(xs[0], xs[1], { color: 'gold', r: 4, label: 'x*', labelPos: 'sw' });
            R.tex(`B_{${n - 1}}`, Bp.c[0] - Bp.r * 0.72, Bp.c[1] + Bp.r * 0.72, { align: 'right', baseline: 'bottom', color: 'ink' });
            R.tex(`\\overline{B_{${n}}}`, B.c[0] + B.r * 0.75, B.c[1] - B.r * 0.75, { align: 'left', baseline: 'top', dx: 3, dy: 2, color: 'green' });
            R.corner(`E${sub(n)} in bold red, earlier E_k faint`, 'bl', { color: 'red', size: 11 });
            R.setTitle(`zoom $\\times${v.fmt(1.25 / hz, 3)}$ on $B_{${n - 1}}$`);
            L.setTitle('$\\R^2$: $B_0$ and the nested balls $\\overline{B_1}\\supset\\overline{B_2}\\supset\\cdots$');
            info = { mode: 'R2', n, r: B.r, jump: Math.hypot(B.c[0] - Bp.c[0], B.c[1] - Bp.c[1]), xs, inB0: Math.hypot(xs[0] - c0.x, xs[1] - c0.y) < r0 };
            v.legend([['ink', '$B_0$ (any open ball)'], ['red', '$E_n$ — closed, nowhere dense'], ['green', '$\\overline{B_n}\\subset B_{n-1}\\setminus E_n$', { area: true }], ['gold', 'limit $x^*$', { dot: true }]]);
          } else {
            c0.visible = rh.visible = false;
            const ch = qchain(40);
            L.setView([-0.06, 1.06], [-0.32, 1.12]);
            L.line(0, 0, 1, 0, { color: 'faint', width: 1 });
            for (let i = 0; i < 60; i++) { const [p, q] = QS[i]; L.line(p / q, 0, p / q, 0.05 + 0.18 / q, { color: 'muted', width: 1, alpha: 0.6 }); }
            for (let k = 0; k <= n; k++) {
              const I = ch[k], y = 1.02 - 0.08 * k;
              L.interval(I.l, I.r, y, { color: k === n ? 'green' : 'accent', width: 4, r: 3 });
            }
            for (let k = 1; k <= n; k++) { const [p, q] = QS[k - 1]; L.dot(p / q, 0, { color: 'red', r: 3 }); }
            const [pn, qn] = QS[n - 1];
            L.text(`q${sub(n)} = ${pn}/${qn}`, pn / qn, -0.12, { color: 'red', align: 'center', size: 12 });
            L.text('ℚ ∩ [0,1]', 1.0, -0.24, { align: 'right', color: 'muted', size: 11 });
            L.setTitle('$I_0\\supset I_1\\supset\\cdots$, each a closed third avoiding $q_n$');
            const Ip = ch[n - 1], In = ch[n], d = Ip.r - Ip.l;
            R.setView([Ip.l - 0.25 * d, Ip.r + 0.25 * d], [-0.7, 0.9]);
            R.vband(Ip.l, Ip.r, { color: 'accent', alpha: 0.08 });
            R.line(Ip.l - d, 0, Ip.r + d, 0, { color: 'faint', width: 1 });
            // rationals in the window
            const a = Ip.l - 0.25 * d, b = Ip.r + 0.25 * d, Qmax = Math.min(4000, Math.floor(Math.sqrt(160 / (1.5 * d * 0.31))));
            const c = R.ctx; c.save(); c.strokeStyle = v.color('muted', 0.55); c.lineWidth = 1; c.beginPath();
            for (let q = 1; q <= Qmax; q++) for (let p = Math.ceil(a * q); p <= Math.floor(b * q); p++) {
              if (p < 0 || p > q || gcd(p, q) !== 1) continue;
              const X = Math.round(R.X(p / q)) + 0.5; c.moveTo(X, R.Y(0)); c.lineTo(X, R.Y(0.06 + 0.5 / Math.sqrt(q)));
            }
            c.stroke(); c.restore();
            R.interval(Ip.l, Ip.r, 0.62, { color: 'accent', width: 4 });
            R.tex(`I_{${n - 1}}`, (Ip.l + Ip.r) / 2, 0.62, { color: 'accent', baseline: 'bottom', dy: -8 });
            R.interval(In.l, In.r, -0.3, { color: 'green', width: 5 });
            R.tex(`I_{${n}}`, (In.l + In.r) / 2, -0.3, { color: 'green', baseline: 'top', dy: 8 });
            const qv = pn / qn;
            if (qv >= a && qv <= b) { R.line(qv, -0.45, qv, 0.75, { color: 'red', width: 2 }); R.tex(`q_{${n}}=\\tfrac{${pn}}{${qn}}`, qv, 0.78, { color: 'red', baseline: 'bottom' }); }
            else R.corner(`q${sub(n)} = ${pn}/${qn} lies outside I${sub(n - 1)} already`, 'tr', { color: 'red' });
            R.setTitle(`zoom $\\times${v.fmt(1 / d, 3)}$ on $I_{${n - 1}}$ (grey ticks: other rationals)`);
            const xs = (ch[40].l + ch[40].r) / 2;
            info = { mode: 'Q', n, xs, hits: ch.slice(1, n + 1).filter((I) => I.hit).length };
            v.legend([['accent', '$I_{n-1}$'], ['green', '$I_n$, missing $q_n$'], ['red', '$q_n$ (rationals in order of denominator)']]);
          }
        });
        v.readout(() => {
          const s = info; if (!s.mode) return '';
          if (s.mode === 'R2') return `$r_{${s.n}} = ${v.fmt(s.r, 3)}$, $\\;|c_{${s.n}}-c_{${s.n - 1}}| = ${v.fmt(s.jump, 3)}$. The centres $c_n$ are Cauchy; completeness gives $x^* = (${v.fix(s.xs[0], 5)}, ${v.fix(s.xs[1], 5)})$, which lies in $B_0$ and in every $V_n$ — so $B_0\\cap\\bigcap V_n\\neq\\emptyset$.`;
          return `$x^*=\\bigcap I_n\\approx ${v.fix(s.xs, 8)}$ avoids $q_1,\\dots,q_{${s.n}}$ (${s.hits} of them actually lay in the previous interval). Every rational is some $q_k$, so $x^*\\notin\\mathbb Q$: in the space $\\mathbb Q$ the dense open sets $\\mathbb Q\\setminus\\{q_k\\}$ have **empty** intersection — Baire fails without completeness.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Equicontinuity',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces and $\Gamma$ a collection of linear mappings of $X$ into $Y$. $\Gamma$ is **equicontinuous** if to every neighbourhood $W$ of $0$ in $Y$ there corresponds a neighbourhood $V$ of $0$ in $X$ such that $\Lambda(V)\subset W$ for every $\Lambda\in\Gamma$. When $X$ and $Y$ are normed spaces this says exactly that $\sup_{\Lambda\in\Gamma}\norm{\Lambda}<\infty$.`,
      idea: String.raw`Continuity of each $\Lambda$ gives a neighbourhood $V_\Lambda$ of its own; equicontinuity asks for one $V$ that serves the whole family. By linearity it suffices to check this at the origin — translating $V$ then gives uniform control at every point. In normed spaces $V$ can be a ball of radius $\eps/\sup\norm{\Lambda}$.`,
      caption: String.raw`$X=Y=\R^2$ and $\Gamma_N=\{\Lambda_1,\dots,\Lambda_N\}$ are $2\times2$ matrices. Drag the rim of $V$: each ellipse is an image $\Lambda_k(V)$, red when it leaves $W$. The bottom panel plots the largest admissible radius $\delta_N=\eps/\max_{k\le N}\norm{\Lambda_k}$. For the equicontinuous family it stays above a fixed positive level as $N$ grows; for the other it tends to $0$, so no single $V$ serves all of $\Gamma$.`,
      deps: ['fa-1.6'],
      see: ['pma-7.22'],
      tags: ['equicontinuity', 'operators'],
      viz(v) {
        const M = v.M;
        const NM = 30;
        const fam = v.select('family $\\Gamma$', [{ value: 'eq', label: 'equicontinuous' }, { value: 'neq', label: 'not equicontinuous' }], 'eq');
        const N = v.slider('maps shown $N$', 1, NM, 12, { int: true });
        const eps = v.slider('radius $\\varepsilon$ of $W$', 0.4, 1.2, 0.9, { step: 0.01 });
        const X = v.stage({ x: [-1.3, 1.3], y: [-1.05, 1.05], equal: true, axes: false, height: 300, title: '$X=\\R^2$: neighbourhood $V$ of $0$' });
        const Y = v.stage({ x: [-2.3, 2.3], y: [-1.8, 1.8], equal: true, axes: false, height: 300, title: '$Y=\\R^2$: $W$ and the images $\\Lambda_k(V)$' });
        const P = v.stage({ x: [0.3, NM + 0.7], y: [-0.28, 1.6], height: 160, axes: 'box', full: true, yticks: [0.5, 1, 1.5], title: '$\\delta_N=\\varepsilon/\\max_{k\\le N}\\|\\Lambda_k\\|$ — largest radius of $V$ that works for $\\Lambda_1,\\dots,\\Lambda_N$' });
        const dh = X.handle(0.5, 0, { color: 'orange', constrain: (x) => [M.clamp(x, 0.05, 1.25), 0] });
        const rot = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
        const lam = (k, f) => {
          const s1 = f === 'eq' ? 1.45 - 0.6 / k + 0.12 * Math.sin(1.3 * k) : 0.6 + 0.22 * k;
          const s2 = f === 'eq' ? 0.4 + 0.18 * Math.cos(2.1 * k) : 0.3 + 0.1 * Math.sin(k);
          return { A: M.matMul(M.matMul(rot(0.9 * k), [[s1, 0], [0, s2]]), rot(-0.37 * k * k)), n: s1 };
        };
        const supEq = Math.max(...M.range(5000, 1).map((k) => lam(k, 'eq').n));
        const circ = M.range(73).map((i) => [Math.cos(i * M.TAU / 72), Math.sin(i * M.TAU / 72)]);
        let info = {};
        v.render(() => {
          const f = fam.value, e = eps.value, d = dh.x, n = N.value;
          const maps = M.range(NM, 1).map((k) => lam(k, f));
          const dstar = M.range(NM).map((i) => e / Math.max(...maps.slice(0, i + 1).map((m) => m.n)));
          // X
          X.line(-2, 0, 2, 0, { color: 'faint', width: 1 }); X.line(0, -2, 0, 2, { color: 'faint', width: 1 });
          X.circle(0, 0, dstar[n - 1], { color: 'green', width: 1.6, dash: [5, 4] });
          X.circle(0, 0, d, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 2 });
          X.tex('V', -d * 0.7, d * 0.7, { color: 'orange', align: 'right', baseline: 'bottom' });
          X.tex('\\delta_N', dstar[n - 1] * 0.71, -dstar[n - 1] * 0.71, { color: 'green', align: 'left', baseline: 'top', dx: 3 });
          // Y
          const ext = Math.max(...maps.slice(0, n).map((m) => m.n * d));
          const yr = M.clamp(Math.max(1.3 * e, 1.08 * ext), 1.3, 4.2);
          Y.setView([-yr * 1.25, yr * 1.25], [-yr, yr]);
          Y.line(-9, 0, 9, 0, { color: 'faint', width: 1 }); Y.line(0, -9, 0, 9, { color: 'faint', width: 1 });
          Y.circle(0, 0, e, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 2 });
          let ok = 0;
          for (let k = n - 1; k >= 0; k--) {
            const m = maps[k], inside = m.n * d <= e + 1e-12; if (inside) ok++;
            const pts = circ.map((p) => M.matVec(m.A, [p[0] * d, p[1] * d]));
            Y.path(pts, inside ? { color: 'accent', width: 1.3, fill: 'accent', fillAlpha: 0.05 } : { color: 'red', width: 1.5, fill: 'red', fillAlpha: 0.06 });
          }
          Y.tex('W', -e * 0.72, -e * 0.72, { color: 'orange', align: 'right', baseline: 'top' });
          // P
          P.bars(dstar, { color: (val, i) => (i < n ? 'green' : 'faint'), fillAlpha: 0.7 });
          P.hline(d, { color: 'orange', width: 1.6, dash: [5, 4] });
          P.text('radius of V', NM + 0.4, d, { align: 'right', baseline: 'top', dy: 3, color: 'orange', size: 11 });
          if (f === 'eq') { P.hline(e / supEq, { color: 'green', width: 1.2, dash: [2, 3] }); P.corner(`inf δ_N = ε / sup‖Λ_k‖ = ${v.fix(e / supEq, 3)} > 0`, 'tr', { color: 'green', weight: 600 }); }
          else P.corner('δ_N → 0: no single V works', 'tr', { color: 'red', weight: 600 });
          info = { ok, n, d, ds: dstar[n - 1], f };
          v.legend([['orange', '$V$ and $W$', { area: true }], ['accent', '$\\Lambda_k(V)\\subset W$'], ['red', '$\\Lambda_k(V)\\not\\subset W$'], ['green', 'largest admissible $V$', { dash: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.n) return '';
          return `Radius of $V$: $${v.fix(s.d, 3)}$ — ${s.ok} of ${s.n} images lie in $W$. Largest radius that works for $\\Lambda_1,\\dots,\\Lambda_{${s.n}}$: $\\delta_{${s.n}} = ${v.fix(s.ds, 3)}$.` + (s.f === 'eq' ? ` Every $\\|\\Lambda_k\\|\\le ${v.fix(supEq, 2)}$, so one $V$ serves the whole infinite family.` : ` Here $\\|\\Lambda_k\\| = 0.6+0.22k\\to\\infty$, so $\\delta_N\\to0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Equicontinuous families are uniformly bounded',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces, $\Gamma$ an equicontinuous collection of linear mappings of $X$ into $Y$, and $E$ a bounded subset of $X$. Then $Y$ has a bounded subset $F$ such that $\Lambda(E)\subset F$ for every $\Lambda\in\Gamma$; in other words $\bigcup_{\Lambda\in\Gamma}\Lambda(E)$ is bounded.`,
      idea: String.raw`Given a neighbourhood $W$ of $0$ in $Y$, equicontinuity provides one neighbourhood $V$ of $0$ in $X$ with $\Lambda(V)\subset W$ for all $\Lambda\in\Gamma$. Since $E$ is bounded, $E\subset tV$ for all large $t$, and then linearity gives $\Lambda(E)\subset t\Lambda(V)\subset tW$ for every $\Lambda$ simultaneously. So the union $F$ of all the images is absorbed by every $W$, i.e. it is bounded.`,
      caption: String.raw`$X=Y=C(\T)$ with the sup norm, $W$ = ball of radius $\tfrac12$, and $E=\{\sin 2\pi kx: k\ge1\}$ (left, the first $K$ members). Right: the images under one member $\Lambda_s$ of the family. Moving averages $A_s$ all have norm $1$, so one $V$ works and every image lies in $tW$. Difference quotients $Q_s$ are each continuous, but $\norm{Q_s}=2/s$: the bottom panel shows $\sup_{f\in E}\norm{\Lambda_sf}$ exploding as $s\to0$, so $\bigcup_s Q_s(E)$ is unbounded.`,
      deps: ['fa-2.3'],
      tags: ['equicontinuity', 'boundedness'],
      viz(v) {
        const M = v.M;
        const fam = v.select('$\\Gamma$', [{ value: 'avg', label: 'averages $A_sf(x)=\\frac1s\\int_x^{x+s}f$' }, { value: 'dif', label: 'quotients $Q_sf(x)=\\frac{f(x+s)-f(x)}{s}$' }], 'avg');
        const sS = v.slider('$s$', 0.004, 0.5, 0.06, { log: true, fmt: (x) => v.fmt(x, 2) });
        const K = v.slider('members of $E$ shown $K$', 1, 40, 5, { int: true });
        const X = v.stage({ x: [0, 1], y: [-1.5, 1.5], height: 250, axes: 'box', title: '$E\\subset X$, inside $tV$' });
        const Y = v.stage({ x: [0, 1], y: [-1.5, 1.5], height: 250, axes: 'box', title: 'images $\\Lambda_s(E)\\subset Y$' });
        const P = v.stage({ x: [-2.45, -0.25], y: [-0.7, 3.1], height: 170, axes: 'box', full: true, xticks: [[-2, '0.01'], [-1, '0.1']], yticks: LOGTICKS, xlabel: 's', title: '$\\sup_{f\\in E}\\|\\Lambda_s f\\|_\\infty$ as a function of $s$ (log–log)' });
        const w = 0.5; // radius of W
        const img = (f, s, k, x) => f === 'avg'
          ? (Math.cos(M.TAU * k * x) - Math.cos(M.TAU * k * (x + s))) / (M.TAU * k * s)
          : (Math.sin(M.TAU * k * (x + s)) - Math.sin(M.TAU * k * x)) / s;
        const normOf = (f, s, k) => f === 'avg' ? Math.abs(Math.sin(Math.PI * k * s) / (Math.PI * k * s)) : 2 * Math.abs(Math.sin(Math.PI * k * s)) / s;
        const supK = (f, s, Kmax) => { let m = 0; for (let k = 1; k <= Kmax; k++) m = Math.max(m, normOf(f, s, k)); return m; };
        let info = {};
        v.render(() => {
          const f = fam.value, s = sS.value, Kn = K.value;
          const opn = f === 'avg' ? 1 : 2 / s;           // ||Lambda_s||
          const rV = w / opn, t = 1 / rV;                // V = ball(rV) works for this s; E subset tV
          // X panel
          X.hband(-rV, rV, { color: 'orange', alpha: 0.22 });
          X.hline(1, { color: 'green', dash: [5, 4], width: 1.4 }); X.hline(-1, { color: 'green', dash: [5, 4], width: 1.4 });
          for (let k = Kn; k >= 1; k--) X.fn((x) => Math.sin(M.TAU * k * x), { color: 'purple', width: k === 1 ? 1.8 : 1, alpha: 0.35 + 0.5 / k, n: Math.max(300, 24 * k) });
          X.tex(f === 'avg' ? 'V' : 'V_s', 0.98, rV, { color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          X.tex('tV', 0.98, 1, { color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          // Y panel
          let mx = 0, kmax = 1;
          for (let k = 1; k <= Kn; k++) { const nk = normOf(f, s, k); if (nk > mx) { mx = nk; kmax = k; } }
          const top = Math.max(1.5, 1.25 * t * w);
          Y.setView(null, [-top, top]);
          Y.hband(-w, w, { color: 'orange', alpha: 0.22 });
          Y.hline(t * w, { color: 'green', dash: [5, 4], width: 1.4 }); Y.hline(-t * w, { color: 'green', dash: [5, 4], width: 1.4 });
          for (let k = Kn; k >= 1; k--) if (k !== kmax) Y.fn((x) => img(f, s, k, x), { color: 'accent', width: 1, alpha: 0.45, n: Math.max(300, 24 * k) });
          Y.fn((x) => img(f, s, kmax, x), { color: 'gold', width: 2.2, n: Math.max(300, 24 * kmax) });
          Y.tex('W', 0.98, w, { color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          Y.tex('tW', 0.98, t * w, { color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          // P panel: log-log sup curve
          const xs = M.linspace(-2.45, -0.25, 260);
          const lg = (y) => Math.log10(Math.max(y, 1e-3));
          P.path(xs.map((u) => [u, lg(supK(f, Math.pow(10, u), Kn))]), { color: 'accent', width: 2 });
          P.path(xs.map((u) => { const ss = Math.pow(10, u); return [u, lg(supK(f, ss, Math.ceil(1 / ss) + 2))]; }), { color: f === 'avg' ? 'green' : 'red', width: 1.6, dash: [5, 4] });
          P.vline(Math.log10(s), { color: 'muted', width: 1, dash: [2, 3] });
          P.dot(Math.log10(s), lg(mx), { color: 'gold', r: 5 });
          P.hline(Math.log10(t * w), { color: 'green', width: 1, alpha: 0.5 });
          P.corner(f === 'avg' ? 'bounded by 1 for every s: F = ⋃ A_s(E) is bounded' : 'sup over all of E ≈ 2/s → ∞', 'tr', { color: f === 'avg' ? 'green' : 'red', weight: 600 });
          info = { f, s, mx, kmax, opn, t };
          v.legend([['purple', '$f_k=\\sin 2\\pi kx\\in E$'], ['accent', '$\\Lambda_s f_k$'], ['gold', 'largest image'], ['orange', '$V$, $W$', { area: true }], ['green', '$tV$, $tW$', { dash: true }], [f === 'avg' ? 'green' : 'red', '$\\sup$ over all $k$', { dash: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.f) return '';
          const base = `$\\|\\Lambda_s\\| = ${v.fmt(s.opn, 3)}$; largest image $\\|\\Lambda_s f_{${s.kmax}}\\|_\\infty = ${v.fmt(s.mx, 3)}\\le t\\cdot\\tfrac12 = ${v.fmt(s.t / 2, 3)}$.`;
          return base + (s.f === 'avg' ? ' The same $V$ (radius $\\tfrac12$) works for every $s$, so all images lie in one bounded set $F=tW$.' : ' Each $Q_s$ is continuous, but $V_s$ must shrink like $s/4$: no common $V$, and the images of the bounded set $E$ are unbounded.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Banach–Steinhaus theorem',
      credit: 'Banach & Steinhaus, 1927',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces, $\Gamma$ a collection of continuous linear mappings of $X$ into $Y$, and $B$ the set of all $x\in X$ whose orbits $\Gamma(x)=\{\Lambda x:\Lambda\in\Gamma\}$ are bounded in $Y$. If $B$ is of the second category in $X$, then $B=X$ and $\Gamma$ is equicontinuous.`,
      idea: String.raw`Fix a neighbourhood $W$ of $0$ in $Y$ and a balanced neighbourhood $U$ with $\overline U-\overline U\subset W$. The set $E=\bigcap_{\Lambda\in\Gamma}\Lambda^{-1}(\overline U)$ is closed, and every $x\in B$ lies in some $nE$, so $B\subset\bigcup_n nE$. If $B$ is of the second category, some $nE$ — hence $E$ itself (2.1(d)) — has an interior point $x$. Then $E-x$ contains a neighbourhood $V$ of $0$, and $\Lambda(V)\subset\overline U-\overline U\subset W$ for every $\Lambda$. So $\Gamma$ is equicontinuous, and by 2.4 every orbit is bounded: $B=X$.`,
      caption: String.raw`$X=\R^2$, $Y=\R$, $\Lambda_nx=\langle a_n,x\rangle$, $U=[-1,1]$. Each strip $|\Lambda_nx|\le1$ is closed, and their intersection $E$ (green) is the set of the proof; $B=\bigcup_k kE$. Drag $x$ and watch its orbit on the right. For the bounded family, $E$ contains the disc $V$ for every $N$. For the unbounded families, $E$ collapses as $N$ grows and $B$ is only a line or the point $0$, which has empty interior: $B$ is of the first category, as the theorem predicts for a family that is not equicontinuous.`,
      deps: ['fa-2.1', 'fa-2.3', 'fa-2.4'],
      see: ['rca-5.8'],
      tags: ['Banach–Steinhaus', 'uniform boundedness', 'Baire category'],
      viz(v) {
        const M = v.M;
        const NM = 60;
        const fam = v.select('family', [{ value: 'bdd', label: 'bounded $|a_n|\\le 0.9$' }, { value: 'line', label: '$a_n=(0.09n,\\,\\cdot)$' }, { value: 'zero', label: '$|a_n|=0.1n$' }], 'bdd');
        const N = v.slider('$N$ (strips used)', 1, NM, 24, { int: true });
        const L = v.stage({ x: [-3.4, 3.4], y: [-2.5, 2.5], equal: true, axes: false, height: 360, title: '$X=\\R^2$: $E=\\{x:|\\Lambda_nx|\\le1,\\ n\\le N\\}$' });
        const R = v.stage({ x: [0.3, NM + 0.7], y: [0, 3], axes: 'box', height: 360, xlabel: 'n', title: 'orbit $|\\Lambda_n x|$' });
        const xh = L.handle(1.1, 0.7, { color: 'gold', label: 'x' });
        v.button('move $x$ into $B$', () => { if (fam.value === 'line') xh.x = 0; if (fam.value === 'zero') { xh.x = 0; xh.y = 0; } });
        const gold = 2.399963;
        const vec = (n, f) => {
          if (f === 'bdd') { const r = 0.55 + 0.35 * Math.pow(Math.sin(1.7 * n), 2), t = gold * n; return [r * Math.cos(t), r * Math.sin(t)]; }
          if (f === 'line') return [0.09 * n * (n % 2 ? 1 : -1), 0.6 * Math.sin(2.3 * n)];
          const t = gold * n; return [0.1 * n * Math.cos(t), 0.1 * n * Math.sin(t)];
        };
        let info = {};
        v.render(() => {
          const f = fam.value, n = N.value;
          const as = M.range(n, 1).map((k) => vec(k, f));
          let E = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
          for (const a of as) { E = clipHalf(E, a, 1); E = clipHalf(E, [-a[0], -a[1]], 1); }
          const maxA = Math.max(...as.map((a) => Math.hypot(a[0], a[1])));
          const delta = 1 / maxA;
          // strips
          for (const a of as) { const L2 = Math.hypot(a[0], a[1]), u = [a[0] / L2, a[1] / L2]; for (const sgn of [-1, 1]) { const p = [u[0] * sgn / L2, u[1] * sgn / L2]; L.line(p[0] - u[1] * 9, p[1] + u[0] * 9, p[0] + u[1] * 9, p[1] - u[0] * 9, { color: 'muted', width: 0.7, alpha: 0.2 }); } }
          for (const k of [3, 2]) L.poly(E.map((p) => [p[0] * k, p[1] * k]), { color: 'green', width: 1, dash: [4, 4], alpha: 0.6 });
          L.poly(E, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
          L.circle(0, 0, delta, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.8, dash: [6, 3] });
          // B
          if (f === 'line') { L.line(0, -5, 0, 5, { color: 'red', width: 2.5 }); L.tex('B', 0, 2.0, { color: 'red', align: 'left', dx: 6 }); }
          if (f === 'zero') { L.dot(0, 0, { color: 'red', r: 4.5, label: 'B = {0}', labelPos: 'sw' }); }
          if (f === 'bdd') L.corner('B = X', 'tl', { color: 'green', weight: 600 });
          L.tex('E', Math.max(...E.map((p) => p[0])), 0, { color: 'green', align: 'left', dx: 5 });
          L.tex('2E', 0, Math.max(...E.map((p) => p[1])) * 2, { color: 'green', baseline: 'bottom', dy: -2, size: 13 });
          // orbit of x
          const x = [xh.x, xh.y];
          const orb = as.map((a) => Math.abs(a[0] * x[0] + a[1] * x[1]));
          const kx = Math.max(...orb);
          if (kx > 1e-9) L.poly(E.map((p) => [p[0] * kx, p[1] * kx]), { color: 'gold', width: 1.5, dash: [3, 3] });
          const top = Math.max(1.6, 1.15 * kx);
          R.setView([-0.6 - 0.035 * n, n + 0.7], [-0.09 * top, top]);
          R.bars(orb, { color: (val) => (val <= 1 ? 'green' : 'gold'), fillAlpha: 0.8 });
          R.hline(1, { color: 'orange', width: 1.5, dash: [5, 4] });
          R.corner('orange dashes: U = [−1, 1]', 'tr', { color: 'orange', weight: 600 });
          R.hline(kx, { color: 'gold', width: 1, dash: [2, 3] });
          info = { f, n, kx, delta };
          v.legend([['green', '$E$ (and $2E,3E$)', { area: true }], ['orange', 'disc $V\\subset E$', { area: true }], ['gold', '$x$ and $k(x)E$', { dash: true }], ['red', '$B$ when $B\\neq X$']]);
        });
        v.readout(() => {
          const s = info; if (!s.f) return '';
          const head = `$x\\in kE$ exactly for $k\\ge\\max_n|\\Lambda_nx| = ${v.fmt(s.kx, 3)}$. Disc $V$ inside $E$: radius $1/\\max_{n\\le N}|a_n| = ${v.fmt(s.delta, 3)}$.`;
          if (s.f === 'bdd') return head + ' The radius never drops below $1/0.9$: $E$ has interior, $\\Gamma$ is equicontinuous and $B=X$.';
          return head + ` As $N\\to\\infty$ it tends to $0$; ${s.f === 'line' ? '$B$ is the vertical axis' : '$B=\\{0\\}$'} — closed with empty interior, so $B$ is of the first category.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Pointwise bounded families on an F-space are equicontinuous',
      statement: String.raw`Let $\Gamma$ be a collection of continuous linear mappings of an F-space $X$ into a topological vector space $Y$. If the orbit $\Gamma(x)=\{\Lambda x:\Lambda\in\Gamma\}$ is bounded in $Y$ for every $x\in X$, then $\Gamma$ is equicontinuous. (For Banach spaces: if $\sup_{\Lambda}\norm{\Lambda x}<\infty$ for every $x$, then $\sup_\Lambda\norm{\Lambda}<\infty$.)`,
      idea: String.raw`An F-space is a complete metric space, so by Baire's theorem (2.2) it is of the second category in itself. The hypothesis says $B=X$, so the Banach–Steinhaus theorem (2.5) applies. Read backwards: if $\norm{\Lambda_n}\to\infty$ then some $x$ has an unbounded orbit — indeed, by 2.5, the bounded orbits form a set of the first category.`,
      caption: String.raw`$X=C(\T)$, $\Lambda_nf=S_nf(0)$ (Fourier partial sums at $0$) or $\sigma_nf(0)$ (Fejér means). Top: $f=f_0+\eps g_n$, where $g_n$ is a continuous version of the sign of the kernel, so $\norm{f-f_0}_\infty\le\eps$. Bottom left: the kernel; bottom right: $\norm{\Lambda_n}=\frac1{2\pi}\int|K_n|$. The Lebesgue constants grow like $\frac4{\pi^2}\log n$ (slowly — here up to $n=1000$), so the partial sums are not equicontinuous, and some continuous $f$ has $\sup_n|S_nf(0)|=\infty$. The Fejér means all have norm $1$.`,
      deps: ['fa-2.5', 'fa-2.2', 'fa-1.8'],
      see: ['rca-5.8', 'rca-5.11'],
      tags: ['uniform boundedness', 'Fourier series', 'F-space'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const ker = v.select('$\\Lambda_n$', [{ value: 'dir', label: 'partial sums $S_nf(0)$' }, { value: 'fej', label: 'Fejér means $\\sigma_nf(0)$' }], 'dir');
        const nS = v.slider('$n$', 1, 1000, 24, { log: true, int: true });
        const eS = v.slider('$\\varepsilon$', 0.05, 1, 0.35, { step: 0.01 });
        const A = v.stage({ x: [-PI, PI], y: [-1.9, 1.9], height: 220, axes: true, full: true, xticks: [[-PI, '−π'], [-PI / 2, '−π/2'], [PI / 2, 'π/2'], [PI, 'π']], title: '$f=f_0+\\varepsilon g_n$ stays within $\\varepsilon$ of $f_0$' });
        const B = v.stage({ x: [-PI, PI], y: [-7, 12], height: 230, axes: 'box', xticks: [[-PI, '−π'], [PI, 'π']], title: 'kernel $K_n$ (sign of $g_n$ = sign of $K_n$)' });
        const C = v.stage({ x: [-0.1, 3.2], y: [-0.35, 4.8], height: 230, axes: 'box', xticks: LOGTICKS.slice(1), yticks: [1, 2, 3, 4], title: '$\\|\\Lambda_n\\|=\\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi}|K_n|$' });
        const f0 = (t) => 0.5 * Math.cos(t) + 0.3 * Math.sin(2 * t) - 0.25 * Math.cos(3 * t);
        const K = (kind, n, t) => (kind === 'dir' ? M.dirichlet(n, t) : M.fejer(n, t));
        const gOf = (kind, n) => (t) => M.clamp(K(kind, n, t) / 0.15, -1, 1);
        // (1/2pi) * integral over [-pi,pi] of h(t) K_n(t) dt, midpoint rule fine enough for the kernel
        const apply = (kind, n, h) => { const m = Math.max(4000, 60 * n), dt = 2 * PI / m; let s = 0; for (let i = 0; i < m; i++) { const t = -PI + (i + 0.5) * dt; s += h(t) * K(kind, n, t); } return s * dt / (2 * PI); };
        const leb = new Map();
        const lebesgue = (n) => { if (!leb.has(n)) leb.set(n, apply('dir', n, (t) => Math.sign(M.dirichlet(n, t)))); return leb.get(n); };
        const grid = [...new Set(M.range(61).map((i) => Math.round(Math.pow(10, i / 20))))];
        let info = {};
        v.render(() => {
          const kind = ker.value, n = nS.value, e = eS.value;
          const g = gOf(kind, n), f = (t) => f0(t) + e * g(t);
          // A: functions
          A.between((t) => f0(t) + e, (t) => f0(t) - e, -PI, PI, { fill: 'orange', fillAlpha: 0.14, n: 300 });
          const ns = Math.min(14000, Math.max(900, 14 * n));
          A.path(M.range(ns + 1).map((i) => { const t = -PI + 2 * PI * i / ns; return [t, f(t)]; }), { color: 'accent', width: n > 150 ? 0.8 : 1.6 });
          A.fn(f0, { color: 'ink', width: 2.2 });
          A.dot(0, f(0), { color: 'gold', r: 4 });
          // B: kernel
          const k0 = K(kind, n, 0);
          B.setView(null, kind === 'dir' ? [-7, 12] : [-1.5, 12]);
          B.hline(0, { color: 'faint', width: 1 });
          const kn = (t) => K(kind, n, t);
          const nk = Math.min(16000, Math.max(800, 16 * n));
          const pts = M.range(nk + 1).map((i) => { const t = -PI + 2 * PI * i / nk; return [t, kn(t)]; });
          B.path([[-PI, 0], ...pts.map(([t, y]) => [t, Math.max(0, y)]), [PI, 0]], { fill: 'green', fillAlpha: 0.35, stroke: false, close: true });
          B.path([[-PI, 0], ...pts.map(([t, y]) => [t, Math.min(0, y)]), [PI, 0]], { fill: 'red', fillAlpha: 0.35, stroke: false, close: true });
          B.path(pts, { color: 'gold', width: n > 150 ? 0.6 : 1.2 });
          B.corner(`peak K_n(0) = ${v.fmt(k0, 4)}`, 'tr', { size: 11 });
          // C: norms
          const lx = (m) => Math.log10(m);
          if (kind === 'dir') {
            C.fn((u) => (4 / (PI * PI)) * Math.log(Math.pow(10, u)) + 1.27, { domain: [0, 3.05], color: 'muted', width: 1.2, dash: [5, 4] });
            for (const m of grid) { const Lm = lebesgue(m); C.line(lx(m), 0, lx(m), Lm, { color: 'accent', width: 1.5, alpha: 0.45 }); C.dot(lx(m), Lm, { color: 'accent', r: 2.6 }); }
            C.text('(4/π²) log n + 1.27', 2.95, 4.35, { align: 'right', color: 'muted', size: 11 });
          } else {
            for (const m of grid) { C.line(lx(m), 0, lx(m), 1, { color: 'green', width: 1.5, alpha: 0.45 }); C.dot(lx(m), 1, { color: 'green', r: 2.6 }); }
          }
          const nrm = kind === 'dir' ? lebesgue(n) : 1;
          C.dot(lx(n), nrm, { color: 'gold', r: 6, label: `n = ${n}`, labelPos: 'n', math: false });
          const Sf0 = apply(kind, n, f0), Sg = apply(kind, n, g);
          info = { kind, n, e, nrm, Sf0, Sg, Sf: Sf0 + e * Sg };
          v.legend([['ink', '$f_0$'], ['orange', '$\\varepsilon$-ball around $f_0$', { area: true }], ['accent', '$f=f_0+\\varepsilon g_n$'], ['gold', '$K_n$ / current $n$'], ['green', '$K_n>0$', { area: true }], ['red', '$K_n<0$', { area: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.kind) return '';
          const nm = s.kind === 'dir' ? 'S' : '\\sigma';
          const head = `$\\|f-f_0\\|_\\infty\\le${v.fix(s.e, 2)}$, $\\;${nm}_{${s.n}}f_0(0)=${v.fix(s.Sf0, 3)}$, $\\;${nm}_{${s.n}}f(0)=${v.fix(s.Sf, 3)}$, $\\;\\|\\Lambda_{${s.n}}\\| = ${v.fix(s.nrm, 3)}$.`;
          return head + (s.kind === 'dir'
            ? ' Raising $n$ pushes $S_nf(0)$ up by $\\approx\\varepsilon\\|\\Lambda_n\\|\\to\\infty$, so no ball around $f_0$ fits in any $\\{f:\\sup_n|S_nf(0)|\\le k\\}$.'
            : ' $|\\sigma_nf(0)|\\le\\|f\\|_\\infty$ for every $n$: the family is pointwise bounded and equicontinuous.');
        });
      },
    },
  ],
};
