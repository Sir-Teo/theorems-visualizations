// Topology — Chapter 2 (part b): items 2.9–2.15 — products continued, quotients, gluing
import { psFrom, psUnion, psInter, psComp, psInt, psTex, psHas, drawPSet, EMPTYSET } from './ch01.shared.js';
import { GLUE, gluePath, squarePaint, folded, gridInvariants, glueKey, surfaceName, drawGlueSquare, psAffine, psEmpty } from './ch02.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Catmull–Rom interpolation through equally spaced values ys on [0, 1]. */
function spline(ys, t) {
  const n = ys.length - 1, x = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  const p0 = ys[Math.max(0, i - 1)], p1 = ys[i], p2 = ys[i + 1], p3 = ys[Math.min(n, i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
}
/** Runs of true in a boolean sample array over [a, b] → list of [t0, t1]. */
function runs(flags, a, b) {
  const out = [], N = flags.length - 1; let s = null;
  for (let i = 0; i <= N; i++) { if (flags[i] && s === null) s = i; if ((!flags[i] || i === N) && s !== null) { out.push([a + ((b - a) * s) / N, a + ((b - a) * (flags[i] ? i : i - 1)) / N]); s = null; } }
  return out;
}
const fmt2 = (x) => (Math.round(x * 100) / 100).toString().replace('-', '−');

export default {
  collection: 'top',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Maps into products are continuous iff coordinates are',
      statement: String.raw`Let $f\colon A\to\prod_{\alpha\in J}X_\alpha$ be given by $f(a)=(f_\alpha(a))_\alpha$, where the product carries the product topology. Then $f$ is continuous if and only if every coordinate function $f_\alpha=\pi_\alpha\circ f$ is continuous. (For the box topology on an infinite product the "if" direction fails; see 2.10.)`,
      idea: String.raw`If $f$ is continuous, so is each $\pi_\alpha\circ f$, since projections are continuous. Conversely, it suffices to check preimages of subbasic sets $\pi_\beta^{-1}(U_\beta)$, and $f^{-1}(\pi_\beta^{-1}(U_\beta))=f_\beta^{-1}(U_\beta)$ is open by hypothesis; a basic set involves only finitely many coordinates, so its preimage is a *finite* intersection of open sets. For a plane curve this is the familiar fact that $t\mapsto(x(t),y(t))$ is continuous exactly when $x$ and $y$ are.`,
      caption: String.raw`Drag the control points of the coordinate graphs $x(t)$ (top) and $y(t)$ (bottom) and the parameter $t_0$. A basic neighbourhood $U\times V$ of $\gamma(t_0)$ is the orange square on the right; its preimage is $x^{-1}(U)\cap y^{-1}(V)$, built on the lanes between the graphs. Add a **jump** to one coordinate and put $t_0$ on it: one lane, and with it the preimage, stops being open.`,
      deps: ['top-2.8', 'top-2.1'],
      see: ['pma-4.10'],
      refs: ['Munkres §19'],
      tags: ['product', 'continuity'],
      viz(v) {
        const jw = v.select('jump in', [{ value: 'none', label: 'none' }, { value: 'x', label: '$x(t)$' }, { value: 'y', label: '$y(t)$' }], 'x');
        const J = v.slider('jump size', 0, 0.9, 0.55, { step: 0.01 });
        const eps = v.slider('half-side $\\varepsilon$ of $U\\times V$', 0.05, 0.6, 0.25, { step: 0.01 });
        const L = v.stage({ x: [-0.06, 1.06], y: [-2.45, 2.45], height: 380, weight: 1.2, axes: false, title: 'coordinates and preimages' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: true, height: 380, title: 'the curve $\\gamma=(x,y)$ in $\\R\\times\\R$' });
        const TOP = 1.45, BOT = -1.45, SC = 0.7, TS = [0, 0.25, 0.5, 0.75, 1];
        const xs = [-0.9, -0.2, 0.3, 0.1, 0.8], ys = [-0.6, 0.6, 0.1, -0.7, 0.5];
        const hx = TS.map((t, i) => L.handle(t, TOP + SC * xs[i], { color: 'blue', r: 5, constrain: (x, y) => [t, clamp(y, TOP - SC * 1.2, TOP + SC * 1.2)] }));
        const hy = TS.map((t, i) => L.handle(t, BOT + SC * ys[i], { color: 'purple', r: 5, constrain: (x, y) => [t, clamp(y, BOT - SC * 1.2, BOT + SC * 1.2)] }));
        const ht = L.handle(0.5, 0, { color: 'gold', label: '$t_0$', labelPos: 'n', constrain: (x) => [Math.abs(x - 0.5) < 0.015 ? 0.5 : clamp(x, 0, 1), 0] });
        let st = null;
        v.render(() => {
          const X0 = hx.map((h) => (h.y - TOP) / SC), Y0 = hy.map((h) => (h.y - BOT) / SC), j = J.value;
          const xf = (t) => spline(X0, t) + (jw.value === 'x' && t >= 0.5 ? j : 0), yf = (t) => spline(Y0, t) + (jw.value === 'y' && t >= 0.5 ? j : 0);
          const t0 = ht.x, c = [xf(t0), yf(t0)], e = eps.value;
          // bands
          for (const [base, f, col] of [[TOP, xf, 'blue'], [BOT, yf, 'purple']]) {
            L.line(0, base, 1, base, { color: 'faint', width: 1 });
            const v0 = f(t0); L.hband(base + SC * (v0 - e), base + SC * (v0 + e), { color: 'orange', alpha: 0.12 });
            const pts = []; for (let i = 0; i <= 400; i++) { const t = i / 400; pts.push([t, base + SC * f(t)]); if (jw.value !== 'none' && i === 199) pts.push(null); }
            L.path(pts, { color: col, width: 2.6 });
            if (jw.value !== 'none' && ((col === 'blue') === (jw.value === 'x'))) { L.dot(0.5, base + SC * (f(0.5) - j), { r: 4.2, hollow: true, color: col }); L.dot(0.5, base + SC * f(0.5), { r: 4.2, color: col }); }
          }
          L.text('x(t)', -0.05, TOP + 0.95, { math: true, size: 15, color: 'blue' });
          L.text('y(t)', -0.05, BOT + 0.95, { math: true, size: 15, color: 'purple' });
          // preimages on lanes
          const N = 1000, fx = [], fy = [], fb = [];
          for (let i = 0; i <= N; i++) { const t = i / N, a = Math.abs(xf(t) - c[0]) < e, b = Math.abs(yf(t) - c[1]) < e; fx.push(a); fy.push(b); fb.push(a && b); }
          const lanes = [[0.36, fx, 'blue', '$x^{-1}(U)$'], [-0.36, fy, 'purple', '$y^{-1}(V)$'], [0, fb, 'green', '']];
          let openFail = false;
          for (const [yL, fl, col] of lanes) {
            L.line(0, yL, 1, yL, { color: 'faint', width: 1 });
            for (const [a, b] of runs(fl, 0, 1)) {
              L.line(a, yL, b, yL, { color: col, width: 6, cap: 'butt' });
              // a run that starts exactly at t0 = ½ (on the jump) is half-open there
              if (jw.value !== 'none' && Math.abs(a - 0.5) < 1e-9 && Math.abs(t0 - 0.5) < 1e-9) { L.dot(0.5, yL, { r: 5.5, color: 'red' }); openFail = true; }
            }
          }
          L.vline(t0, { color: 'gold', width: 1, dash: [3, 3] });
          L.text('γ⁻¹(U×V) = x⁻¹(U) ∩ y⁻¹(V)', 1.0, 0.17, { size: 10.5, color: 'green', align: 'right' });
          // the plane curve
          const seg = (a, b) => { const p = []; for (let i = 0; i <= 300; i++) { const t = a + ((b - a) * i) / 300; p.push([xf(t), yf(t)]); } return p; };
          if (jw.value === 'none') R.path(seg(0, 1), { color: 'accent', width: 2.6 });
          else { R.path(seg(0, 0.4999), { color: 'accent', width: 2.6 }); R.path(seg(0.5, 1), { color: 'accent', width: 2.6 }); const l = [jw.value === 'x' ? xf(0.5) - j : xf(0.5), jw.value === 'y' ? yf(0.5) - j : yf(0.5)]; R.dot(l[0], l[1], { r: 4.2, hollow: true, color: 'accent' }); }
          R.rect(c[0] - e, c[1] - e, c[0] + e, c[1] + e, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.12 });
          for (const [a, b] of runs(fb, 0, 1)) R.path(seg(a, b), { color: 'green', width: 5 });
          R.dot(c[0], c[1], { r: 5, color: 'gold', label: 'γ(t₀)' });
          st = { t0, c, openFail, comps: runs(fb, 0, 1).length };
        });
        v.legend([['blue', '$x(t)$, $x^{-1}(U)$'], ['purple', '$y(t)$, $y^{-1}(V)$'], ['orange', '$U$, $V$, $U\\times V$', { area: true }], ['green', '$\\gamma^{-1}(U\\times V)$'], ['red', 'not open at $t_0$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `$t_0=${v.fix(st.t0, 3)}$, $\\gamma(t_0)=(${v.fix(st.c[0], 2)},${v.fix(st.c[1], 2)})$.`;
          if (st.openFail) return `${head} The ${jw.value === 'x' ? '$x$' : '$y$'}-lane starts *at* $t_0$: $t_0$ is in the preimage but no interval around it is, so the preimage of the open square is **not open** — the coordinate jumps, and so does $\\gamma$.`;
          return `${head} Every point of $\\gamma^{-1}(U\\times V)$ (${st.comps} interval${st.comps === 1 ? '' : 's'}) has an interval around it inside both lanes: **open**, as the theorem promises when both coordinates are continuous near $t_0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Proposition',
      name: 'Box versus product topology on ℝ^ω',
      statement: String.raw`On $\R^\omega=\prod_{n\ge1}\R$ the box topology is strictly finer than the product topology. The diagonal map $\Delta\colon\R\to\R^\omega$, $\Delta(t)=(t,t,t,\dots)$, is continuous for the product topology (each coordinate is the identity) but not for the box topology: the box neighbourhood $B=\prod_n(-\tfrac1n,\tfrac1n)$ of $\Delta(0)$ has $\Delta^{-1}(B)=\{0\}$, which is not open.`,
      idea: String.raw`A basic product neighbourhood restricts only finitely many coordinates, say $n\le k$, to intervals $(-\varepsilon_n,\varepsilon_n)$, so its preimage under $\Delta$ is $\bigcap_{n\le k}(-\varepsilon_n,\varepsilon_n)$ — a finite intersection of open intervals, open. In the box topology all coordinates may be restricted at once, and $t\ne0$ escapes the $n$-th factor as soon as $\tfrac1n\le\abs t$. That is why 2.9 needs the product topology: it is exactly the topology in which "continuous coordinatewise" is enough.`,
      caption: String.raw`Each column $n$ is a coordinate of $\R^\omega$; the orange bars are the factors $U_n$ of a neighbourhood of $\Delta(0)$ (arrows mean the whole line). Gold dots are $\Delta(t)$. Drag $t$: in the **product** neighbourhood only the first $k$ columns are restricted; in the **box** one every column is, and some column always catches $t\ne0$ (red). The strip below shows $\Delta^{-1}(U)$.`,
      deps: ['top-2.9'],
      refs: ['Munkres §19'],
      tags: ['product', 'box topology'],
      viz(v) {
        const md = v.select('neighbourhood', [{ value: 'prod', label: 'product: $n\\le k$ restricted' }, { value: 'box', label: 'box: all $n$ restricted' }], 'box');
        const k = v.slider('$k$', 1, 12, 4, { int: true });
        const tt = v.slider('$t$', -0.6, 0.6, 0.12, { step: 0.002 });
        const NC = 30;
        const S = v.stage({ x: [0.2, NC + 0.8], y: [-1.15, 1.15], height: 300, full: true, axes: 'box', gutter: true, xlabel: 'coordinate n', xticks: [1, 5, 10, 15, 20, 25, 30] });
        const T = v.stage({ x: [-0.65, 0.65], y: [-0.5, 0.6], height: 110, full: true, axes: false, title: '$\\Delta^{-1}(U)\\subset\\R$' });
        let st = null;
        v.render(() => {
          const box = md.value === 'box', K = k.value, t = tt.value;
          k.el.hidden = box;
          const a = (n) => (box || n <= K ? 1 / n : Infinity);
          let firstOut = null;
          for (let n = 1; n <= NC; n++) {
            const h = a(n);
            if (isFinite(h)) S.rect(n - 0.32, -h, n + 0.32, h, { fill: 'orange', fillAlpha: 0.28, color: 'orange', width: 1.2, radius: 2 });
            else { S.rect(n - 0.32, -1.15, n + 0.32, 1.15, { fill: 'orange', fillAlpha: 0.07, stroke: false }); S.arrow(n, 0.75, n, 1.1, { color: 'orange', width: 1.4, head: 6 }); S.arrow(n, -0.75, n, -1.1, { color: 'orange', width: 1.4, head: 6 }); }
            const inside = Math.abs(t) < h;
            if (!inside && firstOut === null) firstOut = n;
            S.dot(n, t, { r: 4.2, color: inside ? 'gold' : 'red' });
          }
          S.hline(0, { color: 'faint', width: 1 });
          if (box) S.fn((x) => 1 / x, { domain: [1, NC + 0.8], color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 }), S.fn((x) => -1 / x, { domain: [1, NC + 0.8], color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 });
          // the preimage on the t-line
          T.line(-0.62, 0, 0.62, 0, { color: 'accent', width: 2 });
          for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) { T.line(x, -0.06, x, 0.06, { color: 'muted', width: 1 }); T.text(fmt2(x), x, -0.28, { size: 10.5, color: 'muted', align: 'center' }); }
          if (box) T.dot(0, 0, { r: 6, color: 'green' });
          else { const h = 1 / K; T.line(-h, 0, h, 0, { color: 'green', width: 8, cap: 'butt' }); T.dot(-h, 0, { r: 4.5, hollow: true, color: 'green' }); T.dot(h, 0, { r: 4.5, hollow: true, color: 'green' }); }
          T.dot(t, 0.25, { r: 4.5, color: firstOut ? 'red' : 'gold' }); T.text('t', t, 0.48, { math: true, size: 14, color: 'ink', align: 'center' });
          st = { box, K, t, firstOut };
        });
        v.legend([['orange', 'factor $U_n$', { area: true }], ['gold', '$\\Delta(t)_n=t\\in U_n$', { dot: true }], ['red', '$t\\notin U_n$', { dot: true }], ['green', '$\\Delta^{-1}(U)$']]);
        v.readout(() => {
          if (!st) return '';
          const { box, K, t, firstOut } = st;
          if (box) {
            const n = t === 0 ? null : Math.floor(1 / Math.abs(t) + 1e-12) + (Math.abs(1 / Math.abs(t) - Math.round(1 / Math.abs(t))) < 1e-9 ? 0 : 1);
            return `Box: $U=\\prod_n(-\\tfrac1n,\\tfrac1n)$. ${t === 0 ? '$\\Delta(0)\\in U$.' : `$\\Delta(${v.fix(t, 3)})\\notin U$: coordinate $n=${n}$ already has $\\abs t\\ge\\tfrac1n$.`} Every $t\\ne0$ escapes some factor, so $\\Delta^{-1}(U)=\\{0\\}$ — **not open**: $\\Delta$ is not box-continuous.`;
          }
          return `Product: $U=\\prod_{n\\le ${K}}(-\\tfrac1n,\\tfrac1n)\\times\\prod_{n>${K}}\\R$. $\\Delta^{-1}(U)=(-\\tfrac1{${K}},\\tfrac1{${K}})$ — **open**. ${firstOut ? `$\\Delta(${v.fix(t, 3)})$ leaves through coordinate $${firstOut}\\le k$.` : `$\\Delta(${v.fix(t, 3)})\\in U$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Proposition',
      name: 'The Cantor set is homeomorphic to {0,1}^ℕ',
      statement: String.raw`Give $\{0,1\}$ the discrete topology and $\{0,1\}^{\N}$ the product topology. The map
$$h(b_1,b_2,\dots)=\sum_{i\ge1}\frac{2b_i}{3^i}$$
is a homeomorphism of $\{0,1\}^{\N}$ onto the middle-thirds Cantor set $C\subset[0,1]$. Basic open sets of the product (fix the first $k$ bits) correspond to the sets $C\cap I$, $I$ one of the $2^k$ intervals of the $k$-th stage of the construction.`,
      idea: String.raw`Points of $C$ are exactly the numbers with a ternary expansion using only the digits $0$ and $2$, and this expansion is unique, so $h$ is a bijection; the bit $b_i$ records whether the point went left or right at stage $i$. If two sequences first differ at bit $k+1$, the points lie in the same stage-$k$ interval (length $3^{-k}$) but in different stage-$(k+1)$ intervals, separated by a removed middle third of length $3^{-(k+1)}$: $3^{-(k+1)}\le\abs{h(b)-h(b')}\le3^{-k}$. So "close" means "long common prefix" on both sides, which makes $h$ and $h^{-1}$ continuous (alternatively: a continuous bijection from a compact space to a Hausdorff space).`,
      caption: String.raw`The Cantor construction, stage by stage. Drag the two points (they snap to $C$); each path down the tree spells its address, left $=0$, right $=1$. The shared prefix is green, and the stage-$k$ interval where the paths split — a basic open set of the product — is shaded. The readout checks $3^{-(k+1)}\le\abs{x-y}\le3^{-k}$.`,
      deps: ['top-2.8', 'pma-2.44'],
      refs: ['Munkres §19'],
      tags: ['Cantor set', 'product'],
      viz(v) {
        const D = 7, DEEP = 30;
        const S = v.stage({ x: [-0.04, 1.04], y: [-1.5, D + 0.6], height: 400, full: true, axes: false });
        const addr = (x) => { const b = []; let lo = 0, w = 1; for (let i = 0; i < DEEP; i++) { w /= 3; const r = (x - lo) / w; if (r < 1) b.push(0); else if (r >= 2) { b.push(1); lo += 2 * w; } else if (r - 1 < 0.5) b.push(0); else { b.push(1); lo += 2 * w; } } return b; };
        const val = (b) => b.reduce((s, bi, i) => s + (2 * bi) / 3 ** (i + 1), 0);
        const snapC = (x) => val(addr(clamp(x, 0, 1)));
        const hx = S.handle(snapC(0.23), -0.9, { color: 'gold', label: 'x', labelPos: 's', constrain: (x) => [snapC(x), -0.9] });
        const hy = S.handle(snapC(0.31), -0.9, { color: 'purple', label: 'y', labelPos: 's', constrain: (x) => [snapC(x), -0.9] });
        let st = null;
        v.render(() => {
          const bx = addr(hx.x), by = addr(hy.x);
          let k = 0; while (k < DEEP && bx[k] === by[k]) k++;
          const Y = (lev) => D - lev;
          // the stages
          for (let lev = 0; lev <= D; lev++) {
            const w = 3 ** -lev;
            for (let m = 0; m < 2 ** lev; m++) {
              let lo = 0; for (let i = 0; i < lev; i++) if ((m >> (lev - 1 - i)) & 1) lo += 2 * 3 ** -(i + 1);
              const shared = lev <= k && lev <= D && (() => { for (let i = 0; i < lev; i++) if (((m >> (lev - 1 - i)) & 1) !== bx[i]) return false; return true; })();
              S.line(lo, Y(lev), lo + w, Y(lev), { color: shared ? 'green' : 'muted', width: shared ? 6 : 4, cap: 'butt', alpha: shared ? 1 : 0.55 });
            }
            S.text(String(lev), -0.035, Y(lev), { size: 10.5, color: 'muted', align: 'center' });
          }
          // the split interval
          if (k <= D) { let lo = 0; for (let i = 0; i < k; i++) if (bx[i]) lo += 2 * 3 ** -(i + 1); S.rect(lo, -1.25, lo + 3 ** -k, Y(k) + 0.25, { fill: 'green', fillAlpha: 0.08, stroke: false }); }
          // paths
          for (const [b, col, off] of [[bx, 'gold', -0.06], [by, 'purple', 0.06]]) {
            const pts = []; let lo = 0;
            for (let lev = 0; lev <= D; lev++) { const w = 3 ** -lev; pts.push([lo + w / 2, Y(lev) + off]); if (lev < D && b[lev]) lo += 2 * 3 ** -(lev + 1); }
            S.path(pts, { color: col, width: 2 });
            pts.forEach((p, i) => { if (i < D) S.text(String(b[i]), p[0] + (b[i] ? 0.012 : -0.012), p[1] - 0.5, { size: 10, color: col, align: b[i] ? 'left' : 'right', weight: 600 }); });
            S.line(pts[D][0], Y(D), b === bx ? hx.x : hy.x, -0.9, { color: col, width: 1, dash: [3, 3] });
          }
          S.line(0, -0.9, 1, -0.9, { color: 'faint', width: 1 });
          st = { bx, by, k, d: Math.abs(hx.x - hy.x) };
        });
        v.legend([['gold', 'address of $x$'], ['purple', 'address of $y$'], ['green', 'common prefix / basic open set']]);
        v.readout(() => {
          if (!st) return '';
          const { bx, by, k, d } = st;
          const show = (b) => b.slice(0, 14).map((x, i) => (i < k ? `\\color{green}{${x}}` : x)).join('');
          if (k >= DEEP) return `$x=y$: the same address $${show(bx)}\\dots$`;
          const lo = 3 ** -(k + 1), hi = 3 ** -k, ok = d >= lo * (1 - 1e-9) && d <= hi * (1 + 1e-9);
          return `$x\\leftrightarrow ${show(bx)}\\dots$, $y\\leftrightarrow ${show(by)}\\dots$ — first difference at bit $${k + 1}$. $3^{-${k + 1}}=${v.fix(lo, 5)}\\le\\abs{x-y}=${v.fix(d, 5)}\\le3^{-${k}}=${v.fix(hi, 5)}$ ${ok ? '✓' : '✗'}; in the product metric $d=2^{-${k + 1}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Definition',
      name: 'Quotient topology and quotient maps',
      statement: String.raw`Let $X$ be a space and $q\colon X\to Y$ a surjection onto a set $Y$. The **quotient topology** on $Y$ declares $U\subset Y$ open exactly when $q^{-1}(U)$ is open in $X$; it is the finest topology making $q$ continuous. A surjection between spaces is a **quotient map** when $Y$ carries this topology. For an equivalence relation $\sim$ on $X$, the quotient space $X/{\sim}$ is the set of classes with the quotient topology of $x\mapsto[x]$; its open sets correspond to the open **saturated** sets of $X$ (unions of whole classes).`,
      idea: String.raw`The definition is forced by two wishes: $q$ should be continuous, and $Y$ should have as many open sets as that allows. Openness downstairs is tested upstairs on the saturation $q^{-1}(q(A))$, which can be much larger than $A$. A quotient map need not be open: on the circle $[0,1]/(0\sim1)$ the set $[0,\tfrac14)$ is open in $[0,1]$, but its saturation $[0,\tfrac14)\cup\{1\}$ is not, so its image — a half-open arc ending at the glued point — is not open.`,
      caption: String.raw`Choose an identification of $[0,1]$ and drag the ends of the set $A$ (orange, bottom line; choose which ends it contains). Upstairs, its saturation $q^{-1}(q(A))$ is computed exactly — green where it is open in $[0,1]$, red at the points that spoil it. Downstairs, $q(A)$ is drawn on the quotient; it is open precisely when no red remains.`,
      deps: ['top-2.1'],
      refs: ['Munkres §22'],
      tags: ['quotient'],
      viz(v) {
        const EQ = {
          circ: { label: '$0\\sim1$' },
          eight: { label: '$0\\sim\\tfrac12\\sim1$' },
          fold: { label: '$x\\sim1-x$' },
          crush: { label: 'crush $[\\tfrac13,\\tfrac23]$' },
        };
        const eq = v.select('identify', Object.entries(EQ).map(([value, o]) => ({ value, label: o.label })), 'circ');
        const ends = v.select('$A$', ['(c,d)', '[c,d)', '(c,d]', '[c,d]'].map((x) => ({ value: x, label: `$${x}$` })), '[c,d)');
        const S = v.stage({ x: [-1.75, 1.75], y: [-2.05, 2.0], equal: true, axes: false, height: 400, full: true });
        const YU = -1.55, X = (s) => -1.5 + 3 * s, sOf = (x) => clamp((x + 1.5) / 3, 0, 1);
        const sn = (x) => { const s = sOf(x), c = [0, 1 / 3, 0.5, 2 / 3, 1].find((p) => Math.abs(p - s) < 0.012); return X(c ?? Math.round(s * 100) / 100); };
        const hc = S.handle(X(0), YU, { color: 'orange', label: 'c', labelPos: 's', constrain: (x) => [sn(x), YU] });
        const hd = S.handle(X(0.25), YU, { color: 'orange', label: 'd', labelPos: 's', constrain: (x) => [sn(x), YU] });
        // the quotient as a picture: q(s) ∈ ℝ²
        const qmap = {
          circ: (s) => [-0.95 * Math.sin(TAU * s), 0.55 - 0.95 * Math.cos(TAU * s)],
          eight: (s) => { if (s <= 0.5) { const th = TAU * 2 * s; return [-0.62 + 0.62 * Math.cos(th), 0.55 + 0.62 * Math.sin(th)]; } const th = TAU * (2 * s - 1); return [0.62 - 0.62 * Math.cos(th), 0.55 - 0.62 * Math.sin(th)]; },
          fold: (s) => [-1.5 + 6 * Math.min(s, 1 - s), 0.55],
          crush: (s) => [-1 + 3 * (s < 1 / 3 ? s : s > 2 / 3 ? s - 1 / 3 : 1 / 3), 0.55],
        };
        const saturate = (A, e) => {
          if (e === 'circ') return psHas(A, 0) || psHas(A, 1) ? psUnion(A, psFrom([], [0, 1])) : A;
          if (e === 'eight') return [0, 0.5, 1].some((p) => psHas(A, p)) ? psUnion(A, psFrom([], [0, 0.5, 1])) : A;
          if (e === 'fold') return psUnion(A, psAffine(A, -1, 1));
          const mid = psFrom([[1 / 3, 2 / 3, 3, true, true]]);
          return psEmpty(psInter(A, mid)) ? A : psUnion(A, mid);
        };
        let st = null;
        v.render(() => {
          const e = eq.value, c = Math.min(sOf(hc.x), sOf(hd.x)), d = Math.max(sOf(hc.x), sOf(hd.x)), E = ends.value;
          const A = psFrom([[c, d, 3, E[0] === '[', E[E.length - 1] === ']']]);
          const I = psFrom([[0, 1, 3, true, true]]);
          const sat = psInter(saturate(A, e), I);
          // relative openness in [0,1]: add the outside of [0,1], test openness in ℝ
          const ext = psUnion(sat, psComp(I)), bad = psInter(ext, psComp(psInt(ext)));
          const badPts = []; for (let i = 0; i < bad.bp.length; i++) if (bad.pt[i] && bad.bp[i] >= 0 && bad.bp[i] <= 1) badPts.push(bad.bp[i]);
          const open = badPts.length === 0;
          // upstairs
          S.line(X(0), YU, X(1), YU, { color: 'accent', width: 3 });
          S.dot(X(0), YU, { r: 3.5, color: 'accent' }); S.dot(X(1), YU, { r: 3.5, color: 'accent' });
          for (const [s0, lab] of [[0, '0'], [0.5, '½'], [1, '1'], [1 / 3, '⅓'], [2 / 3, '⅔']]) S.text(lab, X(s0), YU + 0.32, { size: 11, color: 'muted', align: 'center' });
          const lane = YU - 0.0;
          drawPSet(S, (() => { const B = sat; return { bp: B.bp.map(X), pt: B.pt, pc: B.pc }; })(), lane, { color: open ? 'green' : 'red', labels: false, width: 9, alpha: 0.55 });
          drawPSet(S, { bp: A.bp.map(X), pt: A.pt, pc: A.pc }, lane, { color: 'orange', labels: false, width: 4 });
          for (const s0 of badPts) S.dot(X(s0), lane, { r: 7, color: 'red', hollow: true, width: 2.4 });
          // downstairs: the whole quotient, then q(A) = q(saturation)
          const q = qmap[e], N = 600;
          const all = []; for (let i = 0; i <= N; i++) all.push(q(i / N)); S.path(all, { color: 'accent', width: 3 });
          let run = [];
          const flush = () => { if (run.length > 1) S.path(run, { color: open ? 'green' : 'red', width: 7 }); run = []; };
          for (let i = 0; i <= N; i++) { const s = i / N; if (psHas(sat, s, false) || psHas(sat, s)) run.push(q(s)); else flush(); }
          flush();
          for (let i = 0; i < sat.bp.length; i++) if (sat.pt[i] && !sat.pc[i] && !sat.pc[i + 1]) { const p = q(sat.bp[i]); S.dot(p[0], p[1], { r: 6, color: open ? 'green' : 'red' }); }
          // glued points marked, with guides to their images
          const glued = e === 'circ' ? [0, 1] : e === 'eight' ? [0, 0.5, 1] : [];
          for (const s0 of glued) { const p = q(s0); S.line(X(s0), YU + 0.12, p[0], p[1] - 0.08, { color: 'faint', width: 1, dash: [3, 4] }); }
          if (glued.length) { const p = q(0); S.dot(p[0], p[1], { r: 5, color: 'ink' }); }
          if (e === 'crush') { const p = q(0.5); S.dot(p[0], p[1], { r: 6, color: 'ink' }); S.text('[⅓, ⅔] ↦ one point', p[0], p[1] + 0.35, { size: 11, color: 'muted', align: 'center' }); }
          if (e === 'fold') S.text('the quotient [0, ½] (each point = a pair {x, 1 − x})', 0, 0.9, { size: 11, color: 'muted', align: 'center' });
          S.text('upstairs: X = [0, 1]', -1.72, YU - 0.42, { size: 11, color: 'muted' });
          S.text('downstairs: X/∼', -1.72, 1.85, { size: 11, color: 'muted' });
          st = { A, sat, open, badPts, e };
        });
        v.legend([['orange', '$A$'], ['green', 'saturation $q^{-1}(q(A))$ / $q(A)$, open'], ['red', 'not open (offending points ringed)'], ['accent', '$[0,1]$ and $X/{\\sim}$']]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => { const r = [[0, '0'], [0.5, '\\tfrac12'], [1, '1'], [1 / 3, '\\tfrac13'], [2 / 3, '\\tfrac23']].find(([p]) => Math.abs(p - x) < 1e-9); return r ? r[1] : fmt2(x); };
          return `$A=${psTex(st.A, f)}$, saturation $q^{-1}(q(A))=${psTex(st.sat, f)}$ — ${st.open ? '**open** in $[0,1]$, so $q(A)$ is **open** in $X/{\\sim}$.' : `**not open** in $[0,1]$ (no interval around $${st.badPts.map(f).join(',')}$ stays inside), so $q(A)$ is **not open** in $X/{\\sim}$${psEq0(st.A, st.sat) ? '' : ' — even if $A$ itself is open: quotient maps need not be open maps'}.`}`;
          function psEq0(a, b) { return psTex(a) === psTex(b); }
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Universal property of quotient maps',
      statement: String.raw`Let $q\colon X\to Y$ be a quotient map and $g\colon X\to Z$ a continuous map that is constant on each fibre $q^{-1}(y)$. Then there is a unique function $\bar g\colon Y\to Z$ with $\bar g\circ q=g$, and $\bar g$ is continuous. Moreover a function $\bar g\colon Y\to Z$ is continuous if and only if $\bar g\circ q$ is continuous.`,
      idea: String.raw`$\bar g(q(x))=g(x)$ is well defined because $g$ is constant on fibres. For $V$ open in $Z$, $q^{-1}(\bar g^{-1}(V))=g^{-1}(V)$ is open, so $\bar g^{-1}(V)$ is open by the very definition of the quotient topology (2.12). On the torus $[0,1]^2/{\sim}$ this says: continuous functions on the torus are exactly the continuous functions on the square that take equal values at glued boundary points. A function that disagrees across an edge does not descend at all — on the torus it would have to take two values on the glued circle.`,
      caption: String.raw`A temperature $g$ on the square: a bump around the hot spot (drag it). With the **periodic** distance the bump wraps across the edges, $g$ agrees on glued points, and the colouring of the torus is seamless. With the **plain** distance the bump is cut off at the edges: on the torus the colours tear along the glued circles (red), and the readout measures the jump.`,
      deps: ['top-2.12'],
      refs: ['Munkres §22'],
      tags: ['quotient', 'universal property'],
      viz(v) {
        const md = v.select('distance', [{ value: 'per', label: 'periodic (respects the gluing)' }, { value: 'plain', label: 'plain (ignores it)' }], 'per');
        const sg = v.slider('bump width', 0.08, 0.35, 0.2, { step: 0.01 });
        const L = v.stage({ x: [-0.12, 1.12], y: [-0.12, 1.12], equal: true, axes: false, height: 360, title: '$g$ on the square' });
        const S = v.stage3d({ range: 1.55, height: 360, yaw: -0.5, pitch: 0.75, axes: false, title: '$\\bar g$ on the torus' });
        const hh = L.handle(0.86, 0.2, { color: 'ink', label: 'hot spot', constrain: (x, y) => [clamp(x, 0, 1), clamp(y, 0, 1)] });
        const T = folded('tor', 1);
        const g = (x, y) => {
          let dx = x - hh.x, dy = y - hh.y;
          if (md.value === 'per') { dx -= Math.round(dx); dy -= Math.round(dy); }
          const s = sg.value; return Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
        };
        let st = null;
        v.render(() => {
          const col = (t) => v.ramp(0.15 + 0.85 * t, 'orange');
          L.raster((x, y) => (x < 0 || x > 1 || y < 0 || y > 1 ? null : col(g(x, y))), { key: [md.value, hh.x, hh.y, sg.value].join(','), res: 3 });
          drawGlueSquare(L, 'tor');
          // the jump across the glued edges
          let jx = 0, jy = 0, ax = 0, ay = 0;
          for (let i = 0; i <= 200; i++) { const s = i / 200, a = Math.abs(g(0, s) - g(1, s)), b = Math.abs(g(s, 0) - g(s, 1)); if (a > jx) { jx = a; ax = s; } if (b > jy) { jy = b; ay = s; } }
          S.surface(T, [0, 1], [0, 1], { nu: 64, nv: 32, alpha: 0.97, colorFn: (u, w) => col(g(u + 1 / 128, w + 1 / 64)) });
          const seam = (f, bad) => S.curve(f, 0, 1, { color: bad ? 'red' : 'faint', width: bad ? 3.5 : 1.2, n: 80 });
          seam((s) => T(0, s).map((c, i) => c * 1.01), jx > 1e-3);
          seam((s) => T(s, 0).map((c, i) => c * 1.01), jy > 1e-3);
          if (jx > 1e-3) L.line(0, ax, 1, ax, { color: 'red', width: 1, dash: [3, 4] });
          if (jy > 1e-3) L.line(ay, 0, ay, 1, { color: 'red', width: 1, dash: [3, 4] });
          st = { jx, jy };
        });
        v.legend([['orange', 'value of $g$ (darker = hotter)', { area: true }], ['red', 'glued edges', {}], ['teal', 'the other glued pair']]);
        v.readout(() => {
          if (!st) return '';
          const J = Math.max(st.jx, st.jy);
          return `Largest disagreement at glued points: $\\max\\abs{g(0,y)-g(1,y)}=${v.fix(st.jx, 4)}$, $\\max\\abs{g(x,0)-g(x,1)}=${v.fix(st.jy, 4)}$. ${J < 1e-9 ? '$g$ is constant on the fibres of $q$, so it **descends** to a continuous $\\bar g$ on the torus.' : '$g$ is **not** constant on fibres: no function $\\bar g$ on the torus has $\\bar g\\circ q=g$ (the torus would need two values on the red circle).'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Definition',
      name: 'Gluing a square: torus, Möbius band, Klein bottle, ℝP²',
      statement: String.raw`Identify edges of the square $I^2=[0,1]^2$ and take the quotient topology:

- **cylinder**: $(0,y)\sim(1,y)$; **Möbius band**: $(0,y)\sim(1,1-y)$;

- **torus** $T^2$: $(0,y)\sim(1,y)$ and $(x,0)\sim(x,1)$;

- **Klein bottle** $K$: $(0,y)\sim(1,y)$ and $(x,0)\sim(1-x,1)$;

- **projective plane** $\R P^2$: $(0,y)\sim(1,1-y)$ and $(x,0)\sim(1-x,1)$.

The cylinder, Möbius band and torus embed in $\R^3$; the Klein bottle and $\R P^2$ do not, though they can be drawn with self-intersections (immersions).`,
      idea: String.raw`Each picture in $\R^3$ is the image of a continuous map of the square that is injective except on the identified boundary points, so by 2.13 it descends to a continuous bijection from the quotient — a homeomorphism once compactness is available (later). The arrow pattern decides everything: a flipped pair reverses orientation, so a walker who crosses it comes back mirror-reversed — that is non-orientability, and it is detected combinatorially by trying to orient the triangles of the glued grid consistently. The Euler characteristic $V-E+F$ of the glued grid is $0$ for the cylinder, band, torus and Klein bottle and $1$ for $\R P^2$.`,
      caption: String.raw`Pick a gluing and slide **fold**: the square is rolled by curvature, bent and (for the band and the Klein bottle) twisted until the arrows meet; for $\R P^2$ the square becomes a hemisphere that is pushed onto a cross-cap. Drag the walker's start and change its heading and distance: it re-enters through the partner edge — mirrored (red flag) across a flipped pair — and its path is drawn on the surface too. The readout classifies the glued grid by counting.`,
      deps: ['top-2.12'],
      refs: ['Munkres §22', 'Hatcher Ch. 0'],
      tags: ['quotient', 'surfaces'],
      viz(v) {
        const kind = v.select('gluing', Object.entries(GLUE).map(([value, o]) => ({ value, label: o.name })), 'kln');
        const fold = v.slider('fold', 0, 1, 0.8, { step: 0.005 });
        const head = v.slider('heading (°)', 0, 360, 62, { step: 1 });
        const dist = v.slider('walk distance', 0, 3, 1.35, { step: 0.01 });
        const L = v.stage({ x: [-0.16, 1.16], y: [-0.16, 1.16], equal: true, axes: false, height: 380, weight: 0.85, title: 'the square with its gluing' });
        const S = v.stage3d({ range: 1.6, height: 380, yaw: -0.6, pitch: 0.5, axes: false, weight: 1.15, title: 'the quotient in $\\R^3$' });
        const hs = L.handle(0.3, 0.3, { color: 'gold', constrain: (x, y) => [clamp(x, 0.01, 0.99), clamp(y, 0.01, 0.99)] });
        let inv = null, ikey = '', st = null;
        v.render(() => {
          const K = kind.value, paint = squarePaint(v), t = fold.value;
          L.raster((x, y) => (x < 0 || x > 1 || y < 0 || y > 1 ? null : paint(x, y)), { key: 'sq', res: 3 });
          for (let k = 1; k < 6; k++) { L.line(k / 6, 0, k / 6, 1, { color: 'panel', width: 0.6, alpha: 0.5 }); L.line(0, k / 6, 1, k / 6, { color: 'panel', width: 0.6, alpha: 0.5 }); }
          drawGlueSquare(L, K, { width: 3.2 });
          // walker
          const th = (head.value * Math.PI) / 180, W = gluePath(K, [hs.x, hs.y], th, dist.value);
          for (const seg of W.segs) if (seg.length > 1) L.path(seg, { color: 'ink', width: 2.6 });
          const [ex, ey] = W.end, dir = W.dir, nrm = W.flips % 2 ? [dir[1], -dir[0]] : [-dir[1], dir[0]], mir = W.flips % 2 === 1;
          L.arrow(ex - 0.06 * dir[0], ey - 0.06 * dir[1], ex + 0.04 * dir[0], ey + 0.04 * dir[1], { color: mir ? 'red' : 'green', width: 3, head: 9 });
          L.line(ex - 0.06 * dir[0], ey - 0.06 * dir[1], ex - 0.06 * dir[0] + 0.045 * nrm[0], ey - 0.06 * dir[1] + 0.045 * nrm[1], { color: mir ? 'red' : 'green', width: 3 });
          // the start glyph (reference orientation)
          const d0 = [Math.cos(th), Math.sin(th)], n0 = [-d0[1], d0[0]];
          L.line(hs.x - 0.06 * d0[0], hs.y - 0.06 * d0[1], hs.x - 0.06 * d0[0] + 0.045 * n0[0], hs.y - 0.06 * d0[1] + 0.045 * n0[1], { color: 'gold', width: 3 });
          // 3D
          const F = folded(K, t);
          S.surface(F, [0, 1], [0, 1], { nu: 46, nv: 46, alpha: 0.9, colorFn: (u, w) => paint(u + 1 / 92, w + 1 / 92) });
          const G = GLUE[K];
          S.curve((s) => F(0, s), 0, 1, { color: G.x ? 'red' : 'muted', width: 3, n: 60 }); S.curve((s) => F(1, s), 0, 1, { color: G.x ? 'red' : 'muted', width: 3, n: 60 });
          S.curve((s) => F(s, 0), 0, 1, { color: G.y ? 'teal' : 'muted', width: 3, n: 60 }); S.curve((s) => F(s, 1), 0, 1, { color: G.y ? 'teal' : 'muted', width: 3, n: 60 });
          for (const seg of W.segs) { const P3 = seg.filter((_, i) => i % 3 === 0 || i === seg.length - 1).map(([a, b]) => F(a, b)); S.path(P3, { color: 'ink', width: 2.6, bias: -0.05 }); }
          S.dot(F(ex, ey), { r: 5, color: mir ? 'red' : 'green' });
          S.dot(F(hs.x, hs.y), { r: 4.5, color: 'gold' });
          if (ikey !== K) { ikey = K; inv = gridInvariants(24, 24, glueKey(K, 24, 24)); }
          st = { K, W, mir, t };
        });
        v.legend([['red', 'first pair of edges (one arrow)'], ['teal', 'second pair (two arrows)'], ['gold', 'walker start', { dot: true }], ['red', 'arrives mirrored', { dot: true }], ['green', 'arrives unmirrored', { dot: true }]]);
        v.readout(() => {
          if (!st || !inv) return '';
          const { W, mir } = st;
          const walk = `The walker crossed ${W.crossings} glued edge${W.crossings === 1 ? '' : 's'}, ${W.flips} of them flipped: it arrives **${mir ? 'mirror-reversed' : 'with its orientation'}**.`;
          return `${walk} Glued $24\\times24$ grid: $V-E+F=${inv.V}-${inv.E}+${inv.F}=${inv.chi}$, ${inv.circles} boundary circle${inv.circles === 1 ? '' : 's'}, ${inv.orientable ? '**orientable**' : '**non-orientable** (the orientation of the triangles cannot be propagated consistently)'} — a **${surfaceName(inv)}**.${st.t < 0.999 ? ' Slide fold to 1 to close it up.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Definition',
      name: 'Cones, suspensions, wedges and collapsing X/A',
      statement: String.raw`For $A\subset X$, the space $X/A$ is the quotient of $X$ in which $A$ is collapsed to a single point (all other points untouched). Standard instances:

- the **cone** $CX=(X\times[0,1])/(X\times\{1\})$;

- the **suspension** $SX$: the quotient of $X\times[0,1]$ collapsing $X\times\{0\}$ to one point and $X\times\{1\}$ to another;

- the **wedge** $X\vee Y=(X\sqcup Y)/(x_0\sim y_0)$ of pointed spaces.

For example $D^2/\partial D^2\cong S^2$, $C S^1\cong D^2$, $S S^1\cong S^2$, and collapsing a meridian circle of the torus gives the pinched torus.`,
      idea: String.raw`A continuous map out of $X$ that is constant on $A$ and injective elsewhere descends to $X/A$ (2.13); the pictures are such maps — for $D^2/\partial D^2$, wrap the disc around a sphere so the whole rim lands on the south pole. Counting cells shows what collapsing does: crushing a contractible-free subcomplex $A$ to one vertex changes the Euler characteristic by $\chi(X/A)=\chi(X)-\chi(A)+1$, which the readout verifies by counting vertices, edges and triangles of the collapsed grid.`,
      caption: String.raw`Pick a construction and slide **collapse** from $0$ (the space $X$) to $1$ (the quotient): the set $A$ (red) shrinks to a point while everything else stays apart. The readout counts cells of the glued, collapsed grid and checks $\chi(X/A)=\chi(X)-\chi(A)+1$.`,
      deps: ['top-2.12'],
      refs: ['Hatcher Ch. 0'],
      tags: ['quotient', 'cones'],
      viz(v) {
        const CASES = {
          disc: { label: '$D^2/\\partial D^2$', X: 'disc', A: 'boundary circle', chiX: 1, chiA: 0, res: 'sphere $S^2$' },
          cone: { label: 'cone $CS^1$', X: 'cylinder $S^1\\times I$', A: 'top circle', chiX: 0, chiA: 0, res: 'disc' },
          susp: { label: 'suspension $SS^1$', X: 'cylinder $S^1\\times I$', A: 'both end circles (to two points)', chiX: 0, chiA: 0, res: 'sphere $S^2$' },
          pinch: { label: 'torus / meridian', X: 'torus', A: 'a meridian circle', chiX: 0, chiA: 0, res: 'pinched torus' },
          wedge: { label: '$S^1\\vee S^1$', X: 'two circles', A: 'one point on each', chiX: 0, chiA: 2, res: 'figure eight' },
        };
        const cs = v.select('construction', Object.entries(CASES).map(([value, o]) => ({ value, label: o.label })), 'disc');
        const tt = v.slider('collapse', 0, 1, 0.7, { step: 0.005 });
        const S = v.stage3d({ range: 1.55, height: 400, yaw: -0.6, pitch: 0.45, axes: false, full: true });
        const n = 24, m = 24;
        let inv = null, ikey = '';
        const surf = (c, t) => {
          if (c === 'disc') return (r, a) => {
            const R0 = 1.45, phi = TAU * a;
            if (t < 1e-4) return [R0 * r * Math.cos(phi), R0 * r * Math.sin(phi), 0];
            const rho = R0 / (Math.PI * t), al = (R0 * r) / rho;
            return [rho * Math.sin(al) * Math.cos(phi), rho * Math.sin(al) * Math.sin(phi), -rho * (1 - Math.cos(al)) + rho * (1 - Math.cos(Math.PI * t)) / 2 + 0.2 * (1 - t)];
          };
          if (c === 'cone') return (h, a) => { const R = 0.95 * (1 - t * h); return [R * Math.cos(TAU * a), R * Math.sin(TAU * a), 2.2 * h - 1.1]; };
          if (c === 'susp') return (h, a) => { const R = 0.95 * ((1 - t) + t * Math.sin(Math.PI * h)); return [R * Math.cos(TAU * a), R * Math.sin(TAU * a), 2.2 * h - 1.1]; };
          return (u, a) => { // pinch: tube radius shrinks to 0 at u = 0
            const d = Math.min(u, 1 - u), r = 0.42 * (1 - t * Math.max(0, 1 - d / 0.5) ** 2), th = TAU * u, ph = TAU * a;
            return [(1 + r * Math.cos(ph)) * Math.cos(th), (1 + r * Math.cos(ph)) * Math.sin(th), r * Math.sin(ph)];
          };
        };
        v.render(() => {
          const c = cs.value, t = tt.value;
          if (c === 'wedge') {
            const off = 0.9 + 0.15 * (1 - t) * 3; // the circles slide together until the two marked points meet
            const C1 = (s) => [-off + 0.9 * Math.cos(TAU * s), 0, 0.9 * Math.sin(TAU * s)], C2 = (s) => [off - 0.9 * Math.cos(TAU * s), 0, 0.9 * Math.sin(TAU * s)];
            S.curve(C1, 0, 1, { color: 'blue', width: 3.5, n: 120 }); S.curve(C2, 0, 1, { color: 'purple', width: 3.5, n: 120 });
            S.dot(C1(0), { r: 6, color: 'red' }); S.dot(C2(0), { r: 6, color: 'red' });
            if (t > 0.999) S.text('one point', [0, 0, -0.35], { color: 'red', size: 12 });
          } else {
            const F = surf(c, t), pal = [v.rgb('blue'), v.rgb('teal')];
            S.surface(F, [0, 1], [0, 1], { nu: 40, nv: 48, alpha: 0.9, wire: true, wireColor: 'ink', colorFn: (u, w) => [0, 1, 2].map((i) => pal[0][i] + u * (pal[1][i] - pal[0][i])) });
            const red = { color: 'red', width: 4, n: 100 };
            if (c === 'disc') S.curve((a) => F(1, a), 0, 1, red);
            if (c === 'cone' || c === 'susp') S.curve((a) => F(1, a), 0, 1, red);
            if (c === 'susp') S.curve((a) => F(0, a), 0, 1, red);
            if (c === 'pinch') S.curve((a) => F(0, a), 0, 1, red);
          }
          const key = c;
          if (key !== ikey) {
            ikey = key;
            if (c === 'wedge') { const N = 24; inv = { X: { chi: 0 }, Q: { V: 2 * N - 1, E: 2 * N, F: 0, chi: 2 * N - 1 - 2 * N }, A: 2 }; }
            else {
              // keys: grid (i along u/r/h, j around), periodic in j; collapse rows
              const base = (i, j) => (j === m ? 0 : j);
              const kX = c === 'disc' ? (i, j) => (i === 0 ? 'c' : `${i},${base(i, j)}`) : c === 'pinch' ? (i, j) => `${i === n ? 0 : i},${base(i, j)}` : (i, j) => `${i},${base(i, j)}`;
              const kQ = c === 'disc' ? (i, j) => (i === 0 ? 'c' : i === n ? 'A' : `${i},${base(i, j)}`)
                : c === 'cone' ? (i, j) => (i === n ? 'A' : `${i},${base(i, j)}`)
                : c === 'susp' ? (i, j) => (i === n ? 'A1' : i === 0 ? 'A0' : `${i},${base(i, j)}`)
                : (i, j) => (i === 0 || i === n ? 'A' : `${i},${base(i, j)}`);
              inv = { X: gridInvariants(n, m, kX, { dedupe: true }), Q: gridInvariants(n, m, kQ, { dedupe: true }) };
            }
          }
        });
        v.legend([['red', 'the set $A$ that is collapsed'], ['blue', 'the space $X$']]);
        v.readout(() => {
          if (!inv) return '';
          const C = CASES[cs.value], Q = inv.Q, two = cs.value === 'susp';
          const pred = two ? C.chiX - C.chiA + 2 : C.chiX - C.chiA + 1;
          return `$X$ = ${C.X} ($\\chi=${inv.X.chi}$), $A$ = ${C.A} ($\\chi=${C.chiA}$). Collapsed grid: $V-E+F=${Q.V}-${Q.E}+${Q.F}=${Q.chi}$; formula ${two ? '(two collapses) $\\chi(X)-\\chi(A)+2' : '$\\chi(X)-\\chi(A)+1'}=${pred}$ ${Q.chi === pred ? '✓' : '✗'}. The quotient is the **${C.res}**.`;
        });
      },
    },
  ],
};
