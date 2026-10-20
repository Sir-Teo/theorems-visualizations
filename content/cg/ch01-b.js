// Computational Geometry & Graphics — Chapter 1, part 2: robustness (1.7–1.9)
import { sgn, floatDet, floatOrient, exactOrient, orientAdaptive, cost, hullWith, orientSoS, inCircleSoS, inCircle, det3 } from './ch01.shared.js';

const rgba = (v, name, a) => [...v.rgb(name).slice(0, 3), a];
const U = 2 ** -53; // ulp of numbers in [1/2, 1)
const NG = 96; // the grid is NG × NG consecutive-ish doubles
const sg = (k) => (k > 0 ? '+' : k < 0 ? '−' : '0');
const grid = (v, title, o = {}) => v.stage({ x: [0, NG], y: [0, NG], equal: true, axes: false, minWidth: 230, height: 300, title, ...o });
/** The classroom configuration: p moves over a grid of doubles around (1/2, 1/2); q = (12,12), r = (24,24) fixed. */
const pCell = (i, j, k) => [0.5 + (i - NG / 2) * k * U, 0.5 + (j - NG / 2) * k * U];
const Q = [12, 12], R = [24, 24];
const SIGCOL = (v, s, a = 0.62) => rgba(v, s > 0 ? 'blue' : s < 0 ? 'red' : 'gold', a);

/** Sign grids (floating-point variants 0–2, exact) for spacing k·2^-53. */
const cache = new Map();
function signGrids(k) {
  if (cache.has(k)) return cache.get(k);
  const ex = new Int8Array(NG * NG), fl = [0, 1, 2].map(() => new Int8Array(NG * NG));
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const p = pCell(i, j, k), n = j * NG + i;
    ex[n] = exactOrient(p[0], p[1], Q[0], Q[1], R[0], R[1]);
    for (let t = 0; t < 3; t++) fl[t][n] = floatOrient(t, p, Q, R);
  }
  const g = { ex, fl }; cache.clear(); cache.set(k, g); return g;
}
const cellOf = (x, y) => { const i = Math.floor(x), j = Math.floor(y); return i >= 0 && j >= 0 && i < NG && j < NG ? j * NG + i : -1; };

export default {
  collection: 'cg',
  chapter: 1,
  items: [
    // ================================================================== 1.7
    {
      num: '1.7', kind: 'Phenomenon', name: 'Floating-point failures of geometric predicates',
      statement: String.raw`Evaluating $\operatorname{orient}(p,q,r)$ as $\operatorname{sgn}\bigl((q_x-p_x)(r_y-p_y)-(q_y-p_y)(r_x-p_x)\bigr)$ in IEEE double precision can return the wrong sign — or $0$ — when $p,q,r$ are nearly collinear, because each subtraction and product is rounded and the two products nearly cancel. The failure is not just inaccuracy: the three algebraically identical cyclic evaluations of the same triple can give *different* signs, so the predicate contradicts itself, and algorithms that assume consistent answers (convex hulls, triangulations, point location) can return invalid output or fail.`,
      idea: String.raw`A double has a 53-bit significand, so a difference of nearby coordinates is exact (Sterbenz) only when the operands are within a factor of two; here $q-p$ and $r-p$ are around 12 and 24 and are rounded to a spacing of $2^{-49}$ and $2^{-48}$, much coarser than the $2^{-53}$ offsets of $p$. The determinant of two nearly parallel vectors is a difference of two nearly equal rounded products, so its sign is decided by rounding noise inside a band around the line $qr$, whose width is a few units of the coordinate ulp times $|q|$, regardless of how the answer "should" come out. The exact sign (computed here with BigInt on the exact binary values) is a clean half-plane.`,
      caption: String.raw`Left: the sign of the floating-point determinant for $p=(\tfrac12+i\,k u,\tfrac12+j\,k u)$, $u=2^{-53}$, with $q=(12,12)$, $r=(24,24)$ — the exact answer (middle) is the two half-planes on either side of the diagonal $y=x$; right: cells where double precision is wrong. Choose which of the three cyclic forms to evaluate, and raise the spacing $k$ to leave the noisy band. Bottom: points on a line, nudged by integer multiples of the ulp (vertical axis, in ulps); the plain monotone-chain hull with the double-precision predicate omits points the exact hull contains. Drag points; the button finds another failing set.`,
      deps: ['cg-1.2'], refs: ['de Berg §1.2', 'PBRT 4e §6.8'], tags: ['floating point', 'robustness', 'predicates'],
      credit: 'Kettner, Mehlhorn, Pion, Schirra & Yap, 2008 (classroom examples); Shewchuk, 1997',
      links: { doi: 'https://doi.org/10.1016/j.comgeo.2007.06.003' },
      viz(v) {
        const form = v.select('evaluate', [{ value: 0, label: 'orient(p,q,r)' }, { value: 1, label: 'orient(q,r,p)' }, { value: 2, label: 'orient(r,p,q)' }], 0);
        const kk = v.slider('spacing $k$ (in $u$)', 1, 4096, 1, { log: true, int: true, step: 1 });
        const L = grid(v, 'floating-point sign'), E = grid(v, 'exact sign'), W = grid(v, 'wrong cells');
        const probe = L.handle(NG * 0.62, NG * 0.38, { color: 'gold', r: 6, label: 'p', labelPos: 'ne', constrain: (x, y) => [Math.floor(x) + 0.5, Math.floor(y) + 0.5] });
        // ---- hull panel
        const H = v.stage({ x: [0.5, 1], y: [-5.2, 5.2], axes: 'box', gutter: true, full: true, height: 300, xlabel: 'x', ylabel: '(y − x) / 2⁻⁵³  (ulps)', title: 'points on the line y = x, offset by whole ulps of y (vertical axis magnified by 2⁵³)' });
        const NP = 10;
        const gen = (seed) => { let r = seed; const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648; return Array.from({ length: NP }, (_, i) => [Math.round((0.5 + ((i + rnd() * 0.9) / NP) * 0.5) * 4096) / 4096, Math.floor(rnd() * 7) - 3]); };
        const pts = (arr) => arr.map(([x, k], i) => [x, x + k * U, i]);
        const eo = (a, b, c) => exactOrient(a[0], a[1], b[0], b[1], c[0], c[1]);
        const fo = (a, b, c) => floatOrient(+form.value, a, b, c);
        const fails = (seed) => { const P = pts(gen(seed)); return hullWith(P, fo).map((p) => p[2]).join() !== hullWith(P, eo).map((p) => p[2]).join(); };
        let seed = 6; while (!fails(seed)) seed++;
        const Hh = gen(seed).map(([x, k], i) => H.handle(x, k, { color: 'accent', r: 6, constrain: (xx, yy) => [Math.round(xx * 4096) / 4096, Math.round(yy)] }));
        v.button('find another failing set', () => { seed++; while (!fails(seed)) seed++; gen(seed).forEach(([x, k], i) => Hh[i].set(x, k)); });
        let stats = {};
        v.render(() => {
          const k = kk.value, g = signGrids(k), fl = g.fl[+form.value], key = `${k}|${form.value}`;
          L.raster((x, y) => { const c = cellOf(x, y); return c < 0 ? null : SIGCOL(v, fl[c]); }, { res: 2, key: `f${key}` });
          E.raster((x, y) => { const c = cellOf(x, y); return c < 0 ? null : SIGCOL(v, g.ex[c]); }, { res: 2, key: `e${k}` });
          W.raster((x, y) => { const c = cellOf(x, y); return c < 0 ? null : fl[c] !== g.ex[c] ? rgba(v, 'red', 0.85) : rgba(v, 'faint', 0.12); }, { res: 2, key: `w${key}` });
          let wrong = 0, zero = 0, incons = 0;
          for (let n = 0; n < NG * NG; n++) { if (fl[n] !== g.ex[n]) wrong++; if (fl[n] === 0) zero++; if (g.fl[0][n] !== g.fl[1][n] || g.fl[1][n] !== g.fl[2][n]) incons++; }
          const pc = cellOf(probe.x, probe.y);
          for (const S of [L, E, W]) { S.line(0, 0, NG, NG, { color: 'ink', alpha: 0.35, width: 1, dash: true }); if (S !== L && pc >= 0) S.dot(probe.x, probe.y, { r: 5, hollow: true, color: 'ink' }); }
          // hull panel
          const P = Hh.map((h, i) => [h.x, h.x + Math.round(h.y) * U, i]);
          const hf = hullWith(P, fo), he = hullWith(P, eo);
          const poly = (hl) => hl.map((p) => [p[0], Math.round(Hh[p[2]].y)]);
          H.hline(0, { color: 'grid' });
          H.path(poly(he), { close: true, color: 'green', width: 5, alpha: 0.35 });
          H.path(poly(hf), { close: true, color: 'red', width: 2, dash: true });
          const inF = new Set(hf.map((p) => p[2]));
          let outside = 0;
          Hh.forEach((h, i) => { const bad = hf.some((a, t) => eo(a, hf[(t + 1) % hf.length], P[i]) < 0); if (bad) { outside++; H.dot(h.x, Math.round(h.y), { r: 12, hollow: true, color: 'red' }); } });
          stats = { wrong, zero, incons, pc, nf: hf.length, ne: he.length, outside, fl, g };
        });
        v.legend([['blue', 'sign $+$', { area: true }], ['red', 'sign $-$', { area: true }], ['gold', 'sign $0$', { area: true }], ['green', 'exact hull'], ['red', 'hull from double-precision predicate', { dash: true }]]);
        v.readout(() => {
          const s = stats, N = NG * NG, c = s.pc, p = c >= 0 ? pCell(c % NG, Math.floor(c / NG), kk.value) : [0, 0];
          const dv = floatDet(p[0], p[1], Q[0], Q[1], R[0], R[1]);
          return `spacing $k=${kk.value}$: **${(100 * s.wrong / N).toFixed(1)}%** of the ${N} cells have a wrong sign (${s.zero} computed as zero); in **${(100 * s.incons / N).toFixed(1)}%** the three cyclic evaluations of the same triple disagree.\n` +
            `probe cell: double precision gives $\\Delta=${dv.toExponential(1).replace('e', '\\times10^{').replace('{+','{')}}$ (${sg(sgn(dv))}), exact sign ${sg(c >= 0 ? s.g.ex[c] : 0)}. Hull: exact has ${s.ne} vertices, double-precision version ${s.nf}, leaving ${s.outside} input point${s.outside === 1 ? '' : 's'} outside its "hull".`;
        });
      },
    },
    // ================================================================== 1.8
    {
      num: '1.8', kind: 'Method', name: 'Exact and adaptive-precision predicates',
      statement: String.raw`A predicate can be made always correct without being always slow. **Exact arithmetic** (integers, rationals, or expansions) gives the true sign at a cost many times that of a float. An **adaptive predicate** (Shewchuk) first evaluates the plain double-precision determinant together with an *a priori* bound on its rounding error; whenever $|\Delta|$ exceeds the bound the sign is certain and the computation stops. Only when it does not does it escalate — first an exact evaluation for the rounded differences, then correction terms, finally the full exact expansion — so the result is always the exact sign and the cost is that of a float except near degeneracy.`,
      idea: String.raw`Floating-point error is bounded: for the determinant $\Delta$ the computed value satisfies $|\hat\Delta-\Delta|\le \varepsilon_A\bigl(|\ell|+|r|\bigr)$ for the two products $\ell,r$, with $\varepsilon_A=(3+16\varepsilon)\varepsilon$ and $\varepsilon=2^{-53}$. If $|\hat\Delta|$ exceeds that, its sign is right. Otherwise error-free transformations (two-sum, two-product via Dekker's splitting) represent a sum or product of doubles *exactly* as an unevaluated sum of non-overlapping doubles (an *expansion*), whose sign is the sign of its largest term. Each stage reuses the previous work.`,
      caption: String.raw`The grid of 1.7 again. Left: the signs from the adaptive predicate, compared with BigInt rational arithmetic (zero mismatches, always). Middle: which stage was needed (A: plain float; B: exact products of rounded differences; C: first-order correction; D: full expansion). Right: average floating-point operations per call, measured by instrumenting every operation, against the exact-always variant. Raise the spacing $k$ to move away from the degeneracy and watch the cost fall back to a plain float; the operation counts are those of this implementation, illustrative of the trend rather than of any library.`,
      deps: ['cg-1.7'], refs: ['de Berg §1.2'], tags: ['exact arithmetic', 'adaptive precision', 'robustness'],
      credit: 'Shewchuk, 1997; Fortune & Van Wyk, 1993 (exact arithmetic for geometry)',
      links: { doi: 'https://doi.org/10.1007/PL00009321' },
      viz(v) {
        const kk = v.slider('spacing $k$ (in $u$)', 1, 2 ** 20, 1, { log: true, int: true });
        const A = grid(v, 'adaptive sign'), S = grid(v, 'stage needed');
        const B = v.stage({ x: [0.4, 3.6], y: [0, 1], axes: false, minWidth: 230, height: 300, title: 'flops per predicate call' });
        const STC = { A: 'green', B: 'gold', C: 'orange', D: 'red' };
        let res = null;
        const compute = (k) => {
          const sign = new Int8Array(NG * NG), stage = new Array(NG * NG), cnt = { A: 0, B: 0, C: 0, D: 0 }; let bad = 0, flops = 0, n = 0;
          for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
            const p = pCell(i, j, k), c = j * NG + i; cost.flops = 0;
            const o = orientAdaptive(p[0], p[1], Q[0], Q[1], R[0], R[1]); flops += cost.flops; n++;
            // orient(r? ...): the adaptive form is (a−c)×(b−c) = orient(c,a,b); here a=p, b=q, c=r → equals orient(p,q,r)
            sign[c] = o.sign; stage[c] = o.stage; cnt[o.stage]++;
            if (o.sign !== exactOrient(p[0], p[1], Q[0], Q[1], R[0], R[1])) bad++;
          }
          let fe = 0, m = 0; for (let t = 0; t < 400; t++) { const p = pCell((t * 37) % NG, (t * 53) % NG, k); cost.flops = 0; orientAdaptive(p[0], p[1], Q[0], Q[1], R[0], R[1], true); fe += cost.flops; m++; }
          return { sign, stage, cnt, bad, avg: flops / n, exact: fe / m };
        };
        v.render(() => {
          const k = kk.value; if (!res || res.k !== k) { res = compute(k); res.k = k; }
          A.raster((x, y) => { const c = cellOf(x, y); return c < 0 ? null : SIGCOL(v, res.sign[c]); }, { res: 2, key: `a${k}` });
          S.raster((x, y) => { const c = cellOf(x, y); return c < 0 ? null : rgba(v, STC[res.stage[c]], 0.75); }, { res: 2, key: `s${k}` });
          for (const T of [A, S]) T.line(0, 0, NG, NG, { color: 'ink', alpha: 0.3, width: 1, dash: true });
          const vals = [11, res.avg, res.exact], mx = Math.max(...vals) * 1.15;
          B.setView([0.4, 3.6], [-0.1 * mx, mx]);
          vals.forEach((val, i) => { B.rect(i + 1 - 0.32, 0, i + 1 + 0.32, val, { fill: ['green', 'gold', 'red'][i], color: ['green', 'gold', 'red'][i], fillAlpha: 0.45, width: 1.5 }); B.text(Math.round(val).toString(), i + 1, val, { dy: -10, align: 'center', size: 13, color: 'ink' }); });
          ['float only', 'adaptive', 'always exact'].forEach((t, i) => B.text(t, i + 1, 0, { dy: 16, align: 'center', size: 11, color: 'muted' }));
        });
        v.legend([['green', 'A: plain float suffices', { area: true }], ['gold', 'B', { area: true }], ['orange', 'C', { area: true }], ['red', 'D: full exact expansion', { area: true }]]);
        v.readout(() => {
          const c = res.cnt, N = NG * NG, pc = (x) => (100 * x / N).toFixed(1);
          return `spacing $k=${kk.value}$ · stages A/B/C/D: ${pc(c.A)}% / ${pc(c.B)}% / ${pc(c.C)}% / ${pc(c.D)}%\nmismatches with exact BigInt arithmetic: **${res.bad}** of ${N} · average ${res.avg.toFixed(0)} flops per call vs ${res.exact.toFixed(0)} always exact (${(res.exact / res.avg).toFixed(1)}× more) and 11 for a bare float`;
        });
      },
    },
    // ================================================================== 1.9
    {
      num: '1.9', kind: 'Method', name: 'Symbolic perturbation of degeneracies',
      statement: String.raw`Instead of special-casing degenerate inputs (three collinear points, four cocircular points), one may regard each input coordinate as slightly perturbed by an infinitesimal $x_i\mapsto x_i+\varepsilon^{a_i}$, $y_i\mapsto y_i+\varepsilon^{b_i}$ with distinct, rapidly growing exponents depending on the point's index. Every predicate is then a polynomial in $\varepsilon$ whose sign is the sign of its lowest-order nonzero term: it is never zero for distinct points, it agrees with the unperturbed sign whenever that is nonzero, and — being the predicate of one fixed (if infinitesimal) input — it is consistent. An algorithm written for general position then runs unchanged and returns the correct answer for the perturbed input, a legitimate answer for the original.`,
      idea: String.raw`Expand the determinant with the perturbed entries. The constant term is the ordinary determinant; if it vanishes, the next term involves the first perturbation exponent, and so on. Choosing exponents so that all monomials are distinct (powers $2^{2i},2^{2i+1}$ here, in the spirit of Edelsbrunner–Mücke's *Simulation of Simplicity*) guarantees that the lowest term can not cancel, so some term decides. Because the answer is the sign of a fixed polynomial, permuting two points flips it exactly as a determinant should, which is what keeps the combinatorics consistent.

Once a predicate polynomial has first nonzero coefficient $a$ at exponent $k$, factor it as $\varepsilon^k Q(\varepsilon)$ with $Q(0)=a$. The sum/product continuity rules of PMA 4.9 make the polynomial $Q$ continuous at zero. Thus for all sufficiently small positive $\varepsilon$, its distance from $a$ is less than $|a|/2$, so its sign is the sign of $a$; the positive factor does not change that sign. This justifies the leading-coefficient decision once nonvanishing has been established by the perturbation construction, not a nonvanishing theorem for arbitrary perturbations.`,
      caption: String.raw`Click lattice points to add or remove them (numbers show the index, i.e. the perturbation priority). *Hull*: a monotone chain with the ordinary test drops every collinear boundary point; with the perturbed test it keeps a consistent strictly convex polygon whose own orientation tests all verify. *Delaunay*: twelve lattice points on a circle of radius 5 are cocircular; with ties counted as "not inside" every triangle has an empty circle (hundreds of overlapping triangles), but the perturbed in-circle test picks out exactly $n-2$ triangles forming a triangulation.`,
      deps: ['cg-1.7', 'pma-4.9'], refs: ['de Berg §1.2'], tags: ['degeneracy', 'perturbation', 'robustness'],
      credit: 'Edelsbrunner & Mücke, 1990 (Simulation of Simplicity; first presented at SoCG 1988)',
      links: { doi: 'https://doi.org/10.1145/73393.73406' },
      viz(v) {
        const mode = v.select('input', [{ value: 'hull', label: 'collinear points: convex hull' }, { value: 'del', label: 'cocircular points: Delaunay' }], 'hull', { onChange: () => reset() });
        const rule = v.select('predicate', [{ value: 'plain', label: 'ordinary (ties special)' }, { value: 'sos', label: 'perturbed (never 0)' }], 'sos');
        const s = v.stage({ x: [-1.2, 8.2], y: [-1.2, 7.2], equal: true, axes: false, grid: false, height: 380 });
        // hull mode: lattice 0..7 × 0..6; points toggled by click
        let on = []; // list of [x, y, id]
        let nextId = 0;
        const CIRC = [[5, 0], [4, 3], [3, 4], [0, 5], [-3, 4], [-4, 3], [-5, 0], [-4, -3], [-3, -4], [0, -5], [3, -4], [4, -3]].map(([x, y]) => [x + 3.5 + 1, y + 3 + 0.5]);
        let cset = new Set();
        function reset() {
          if (mode.value === 'hull') { on = [[1, 1], [3, 1], [5, 1], [7, 1], [1, 3], [3, 3], [5, 3], [7, 3], [1, 5], [3, 5], [5, 5], [4, 2], [2, 1]].filter((p, i, a) => a.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i).map((p, i) => [p[0], p[1], i]); nextId = on.length; s.setView([-1.2, 8.2], [-1.2, 7.2]); }
          else { cset = new Set(CIRC.map((_, i) => i)); s.setView([-1.6, 10.6], [-2.2, 9.2]); }
        }
        reset();
        s.onClick((x, y) => {
          if (mode.value === 'hull') {
            const gx = Math.round(x), gy = Math.round(y); if (gx < 0 || gx > 7 || gy < 0 || gy > 6) return;
            const k = on.findIndex((p) => p[0] === gx && p[1] === gy); if (k >= 0) on.splice(k, 1); else on.push([gx, gy, nextId++]);
          } else {
            let best = -1, bd = 0.8; CIRC.forEach((c, i) => { const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = i; } });
            if (best >= 0) { if (cset.has(best)) cset.delete(best); else cset.add(best); }
          }
        });
        let info = '';
        v.render(() => {
          if (mode.value === 'hull') {
            for (let gx = 0; gx <= 7; gx++) for (let gy = 0; gy <= 6; gy++) s.dot(gx, gy, { r: 2, color: 'faint' });
            const P = on.map((p) => p.slice());
            const plain = (a, b, c) => sgn(det3(a, b, c)), sos = (a, b, c) => orientSoS(a, a[2], b, b[2], c, c[2]);
            // monotone chain pops on <= 0 for ordinary (drops collinear); the perturbed test is never 0
            const hp = P.length >= 3 ? hullWith(P, plain) : P, hs = P.length >= 3 ? hullWith(P, sos) : P;
            const H = rule.value === 'sos' ? hs : hp;
            if (H.length > 2) s.poly(H.map((p) => [p[0], p[1]]), { color: rule.value === 'sos' ? 'green' : 'orange', fill: rule.value === 'sos' ? 'green' : 'orange', fillAlpha: 0.12, width: 2.5 });
            const inH = new Set(H.map((p) => p[2]));
            P.forEach((p) => { s.dot(p[0], p[1], { r: 8, color: inH.has(p[2]) ? (rule.value === 'sos' ? 'green' : 'orange') : 'accent' }); s.text(String(p[2]), p[0], p[1], { dy: -16, size: 11, color: 'muted', align: 'center' }); });
            // collinear triples
            let col = 0; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) for (let k = j + 1; k < P.length; k++) if (det3(P[i], P[j], P[k]) === 0) col++;
            // verification of the perturbed hull
            let ok = H.length >= 3; for (let t = 0; ok && t < H.length; t++) { const a = H[t], b = H[(t + 1) % H.length]; for (const p of P) if (p[2] !== a[2] && p[2] !== b[2] && sos(a, b, p) < 0) { ok = false; break; } }
            const bd = P.filter((p) => !inH.has(p[2]) && hp.length && P.some(() => false)).length;
            info = `${P.length} points, **${col}** collinear triples (ordinary orientation 0). Ordinary hull: ${hp.length} vertices — all collinear boundary points dropped. Perturbed hull: ${hs.length} vertices; every other point is on its inner side under the perturbed test: **${ok ? 'verified' : 'FAILED'}**; showing the ${rule.value === 'sos' ? 'perturbed' : 'ordinary'} hull.`;
          } else {
            const idx = [...cset].sort((a, b) => a - b), pts = idx.map((i) => CIRC[i]);
            s.circle(4.5, 3.5, 5, { color: 'muted', width: 1.2, dash: true, fill: false });
            const n = idx.length, tris = []; let plainCount = 0;
            for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) {
              let A = pts[a], B = pts[b], Cc = pts[c], ia = idx[a], ib = idx[b], ic = idx[c];
              if (det3(A, B, Cc) < 0) { [B, Cc] = [Cc, B]; [ib, ic] = [ic, ib]; }
              let empPlain = true, empSos = true;
              for (let d = 0; d < n; d++) { if (d === a || d === b || d === c) continue; if (inCircle(A, B, Cc, pts[d]) > 0) empPlain = false; if (inCircleSoS([A, B, Cc, pts[d]], [ia, ib, ic, idx[d]]) > 0) empSos = false; }
              if (empPlain) plainCount++;
              if ((rule.value === 'sos' ? empSos : empPlain)) tris.push([A, B, Cc]);
            }
            tris.forEach((t) => s.poly(t, { color: rule.value === 'sos' ? 'green' : 'orange', fill: rule.value === 'sos' ? 'green' : 'orange', fillAlpha: rule.value === 'sos' ? 0.14 : 0.025, width: rule.value === 'sos' ? 1.8 : 0.8, alpha: rule.value === 'sos' ? 1 : 0.5 }));
            CIRC.forEach((c, i) => { s.dot(c[0], c[1], { r: cset.has(i) ? 7 : 5, hollow: !cset.has(i), color: cset.has(i) ? 'accent' : 'faint' }); if (cset.has(i)) s.text(String(i), c[0], c[1], { dy: -15, size: 11, color: 'muted', align: 'center' }); });
            const area = tris.reduce((t, [a, b, c]) => t + Math.abs(det3(a, b, c)) / 2, 0), hullA = n >= 3 ? Math.abs(pts.reduce((t, p, i) => t + (p[0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * p[1]), 0)) / 2 : 0;
            info = `${n} cocircular points. Ordinary in-circle test (ties = not inside): **${plainCount}** triangles have an empty circle — far more than $n-2=${Math.max(0, n - 2)}$. Perturbed test: **${rule.value === 'sos' ? tris.length : '—'}** triangles${rule.value === 'sos' ? `, total area ${area.toFixed(2)} vs hull area ${hullA.toFixed(2)}: ${tris.length === n - 2 && Math.abs(area - hullA) < 1e-9 ? 'a triangulation (verified)' : 'not a triangulation'}` : ' (switch the predicate to perturbed)'}.`;
          }
        });
        v.legend([['accent', 'input point', { dot: true }], ['green', 'perturbed result'], ['orange', 'ordinary result']]);
        v.readout(() => info);
      },
    },
  ],
};
