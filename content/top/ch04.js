// Topology — Chapter 4: Compactness (items 4.1–4.6 here; 4.7–4.12 are in ch04-b.js, 4.13–4.18 in ch04-c.js)
import { randIntervals, greedyCover, drawBars, CYC, mn } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'top',
  chapter: 4,
  title: 'Compactness',
  summary: String.raw`Compactness — every open cover has a finite subcover — is the property that makes infinitely many points behave like finitely many. It survives continuous images and finite products, interacts with the Hausdorff property to make closed and compact agree, and in $\R^n$ means closed and bounded. Metric spaces add the equivalent sequential forms and the Lebesgue number, and local compactness is exactly what is needed to add a single point at infinity.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Compact spaces',
      statement: String.raw`An **open cover** of a space $X$ is a family of open sets whose union is $X$. The space $X$ is **compact** if every open cover has a **finite subcover**, a finite subfamily that still covers $X$. A subset $A\subset X$ is compact when it is compact in the subspace topology, equivalently when every cover of $A$ by open subsets of $X$ has a finite subfamily covering $A$.`,
      idea: String.raw`Compactness says that no matter how an infinite family of open sets is arranged, finitely many of them already do the whole job. It is a statement about *all* covers, so to refute it one good cover is enough, and to prove it one needs an argument that works for every cover. $[0,1]$ is compact (4.10), $(0,1]$ is not: the sets $(1/n,2)$ cover it, but any finite subfamily is contained in its largest member $(1/N,2)$, which misses the points of $(0,1/N]$. Adding one open set that contains $0$ to the cover of $[0,1]$ repairs this.`,
      caption: String.raw`Choose a space and a cover. In the random cover of $[0,1]$ (each bar is an open interval, hollow ends), the extractor picks, from the point it has reached, the set that reaches farthest right: the coloured bars below are a finite subcover. Switch to $(0,1]$ with the sets $(1/n,2)$ and increase $N$: the uncovered stretch $(0,1/N]$ (red) never closes up. In the third mode a single extra set around $0$ rescues the cover as soon as it is larger than $1/N$.`,
      credit: String.raw`Borel, 1895 (countable covers of $[0,1]$); Lebesgue, 1898, and others for arbitrary covers; the word “compact” in this sense is due to Fréchet, 1906`,
      deps: ['top-1.1'],
      see: ['pma-2.32'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'covers'],
      verify: true,
      viz(v) {
        const sp = v.select('space and cover', [{ value: 'rand', label: '$[0,1]$, random cover' }, { value: 'half', label: '$(0,1]$, sets $(1/n,2)$' }, { value: 'closed', label: '$[0,1]$, those sets plus a set around $0$' }], 'rand');
        const nI = v.slider('intervals in the random cover', 8, 60, 30, { int: true });
        const rad = v.slider('largest radius', 0.04, 0.25, 0.12, { step: 0.01 });
        const N = v.slider('sets $U_1,\\dots,U_N$', 1, 40, 12, { int: true });
        const r0 = v.slider('radius of the set at $0$', 0.02, 0.5, 0.1, { step: 0.01 });
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [-0.12, 1.12], y: [-0.06, 1.04], axes: false, height: 380 });
        let info = null;
        v.render(() => {
          const mode = sp.value;
          nI.el.hidden = rad.el.hidden = mode !== 'rand'; N.el.hidden = mode === 'rand'; r0.el.hidden = mode !== 'closed';
          let ints, lo = 0;
          if (mode === 'rand') { const rmin = 0.56 / nI.value; ints = randIntervals(v.rng(seed), nI.value, rmin, Math.max(rmin + 0.01, rad.value)); }
          else { ints = Array.from({ length: N.value }, (_, k) => [1 / (k + 1), 2]); if (mode === 'closed') ints.push([-0.5, r0.value]); }
          const m = ints.length;
          drawBars(s, ints, (i) => i, 0.97, -0.5 / Math.max(m, 12), () => 'blue', { width: 2.4, alpha: 0.4, r: 2 });
          s.text('the cover', 0.5, 1.02, { size: 11, color: 'muted', align: 'center' });
          let res;
          if (mode === 'half') {
            const g = 1 / N.value;
            s.rect(0, 0.0, g, 0.1, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.2 });
            s.line(0, 0.03, 1, 0.03, { color: 'ink', width: 5, cap: 'butt' });
            s.dot(0, 0.03, { r: 5, hollow: true, color: 'ink' });
            s.dot(1, 0.03, { r: 5, color: 'ink' });
            s.text('$(0,1/N]$ is not covered', Math.max(g, 0.15) + 0.04, 0.1, { align: 'left', size: 12, color: 'red' });
            res = { mode, gap: g };
          } else {
            const gc = greedyCover(ints, 0, 1);
            s.line(0, 0.03, 1, 0.03, { color: 'ink', width: 5, cap: 'butt' });
            s.dot(0, 0.03, { r: 5, color: 'ink' }); s.dot(1, 0.03, { r: 5, color: 'ink' });
            if (gc.ok) {
              const dy = Math.min(0.055, 0.4 / Math.max(gc.chosen.length, 1));
              drawBars(s, gc.chosen.map((i) => ints[i]), (k) => k, 0.4, -dy, (k) => CYC[k % CYC.length], { width: 5, r: 3 });
              s.text('finite subcover', 0.5, 0.45, { size: 11, color: 'muted', align: 'center' });
            } else {
              s.rect(gc.stuck, 0, gc.reach.length ? (ints.filter(([a, b]) => a > gc.stuck).map(([a]) => a).sort((x, y) => x - y)[0] ?? 1) : 1, 0.1, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.2 });
            }
            res = { mode, gc, m, stuck: gc.stuck };
          }
          info = res;
        });
        v.legend([['blue', 'open sets of the cover'], ['green', 'a finite subcover'], ['red', 'points left uncovered']]);
        v.readout(() => {
          if (!info) return '';
          if (info.mode === 'half') return `With $N=${N.value}$ sets $(1/n,2)$ the point $1/N=${v.fix(info.gap, 3)}\\in(0,1]$ is **not covered**, and neither is anything below it. A finite subfamily of this cover always lies inside its largest member, so $(0,1]$ has **no finite subcover**: not compact.`;
          if (!info.gc.ok) return `These ${info.m} sets do not cover $[0,1]$: the point $${v.fix(info.stuck, 3)}$ is in none of them (raise $N$ or the radius $r_0$ at 0).`;
          return `The ${info.m} sets cover $[0,1]$ and **${info.gc.chosen.length}** of them suffice — a finite subcover. Compactness promises such a subfamily for *every* open cover.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Closed subsets of compact spaces are compact',
      statement: String.raw`If $X$ is compact and $C\subset X$ is closed, then $C$ is compact.`,
      idea: String.raw`Take any cover of $C$ by open subsets of $X$. Add the open set $X\setminus C$ (open exactly because $C$ is closed). Together they cover $X$, so by compactness of $X$ finitely many of them cover $X$. Discard $X\setminus C$ from that finite family if it occurs: the rest still cover $C$, because $X\setminus C$ contains no point of $C$. If $C$ is not closed the first step fails, and so does the theorem for the same reason: a non-closed subset of $[0,1]$ such as $(0.1,0.9)$ has covers without finite subcovers.`,
      caption: String.raw`Step through the proof on $X=[0,1]$. First the random cover of $C$ by open intervals; then the open complement is thrown in; then a finite subcover of $X$ is extracted; finally the complement is discarded and what is left covers $C$. Switch to the non-closed set $(0.1,0.9)$ and the second step becomes impossible: $[0,0.1]\cup[0.9,1]$ is not open, and the sets $(0.1+\tfrac{0.8}{n+1},0.95)$ have no finite subcover.`,
      deps: ['top-4.1'],
      see: ['pma-2.35'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'closed sets'],
      viz(v) {
        const sel = v.select('subset $C$', [{ value: 'closed', label: 'closed: three pieces' }, { value: 'open', label: 'not closed: $(0.1,0.9)$' }], 'closed', { onChange: () => S.reset({ at: 'start' }) });
        const s = v.stage({ x: [-0.1, 1.1], y: [0, 1.02], axes: false, height: 340 });
        const P = [[0.1, 0.3], [0.45, 0.55], [0.7, 0.9]];
        const G = [[-0.3, 0.1], [0.3, 0.45], [0.55, 0.7], [0.9, 1.3]];
        const frames = () => {
          if (sel.value === 'closed') {
            const R = v.rng(11), A = [];
            for (const [a, b] of P) { const n = 6; const rmin = (0.55 * (b - a)) / n + 0.01; A.push(...randIntervals(R, n, rmin, rmin + 0.045, a, b)); }
            const all = [...A, ...G], gc = greedyCover(all, 0, 1);
            const ch = gc.chosen, chA = ch.filter((i) => i < A.length);
            return [
              { A, G: [], pick: [], note: String.raw`Cover $C$ by open sets of $X=[0,1]$ (blue). There are infinitely many ways to do it; here ${A.length} intervals.` },
              { A, G, pick: [], note: String.raw`Add the open set $X\setminus C$, in pieces (orange). This needs $C$ to be **closed**. Now the family covers all of $X$.` },
              { A, G, pick: ch, note: String.raw`$X$ is compact: finitely many of these sets (highlighted, ${ch.length} of them) already cover $X$.` },
              { A, G: [], pick: chA, note: String.raw`The complement contains no point of $C$, so drop it: the remaining **${chA.length}** blue sets cover $C$. Hence $C$ is compact.` },
            ];
          }
          const A = Array.from({ length: 14 }, (_, k) => [0.1 + 0.8 / (k + 2), 0.95]);
          return [
            { A, G: [], pick: [], open: true, note: String.raw`Cover $C=(0.1,0.9)$ by the sets $(0.1+\tfrac{0.8}{n+1},\,0.95)$, $n=1,2,\dots$ (first 14 drawn). Their union is $(0.1,0.95)\supset C$.` },
            { A, G: [], pick: [], open: true, bad: true, note: String.raw`To run the proof we would add $X\setminus C=[0,0.1]\cup[0.9,1]$, but it is **not open** in $X$ ($C$ is not closed), so it is not an allowed member of a cover.` },
            { A, G: [], pick: [A.length - 1], open: true, bad: true, gap: true, note: String.raw`And indeed no finite subfamily works: the largest set used, $n=${A.length}$, misses $(0.1,\,0.1+\tfrac{0.8}{${A.length + 1}}]$. $C$ is not compact.` },
          ];
        };
        const S = v.steps({ frames, speed: 0.6, still: 2 });
        v.render(() => {
          const f = S.frame; if (!f.A) return;
          const cOpen = !!f.open;
          s.line(0, 0.05, 1, 0.05, { color: 'muted', width: 2 });
          if (!cOpen) for (const [a, b] of P) s.interval(a, b, 0.05, { color: 'accent', width: 8, r: 4 });
          else s.interval(0.1, 0.9, 0.05, { color: 'accent', width: 8, r: 4, open: [true, true] });
          s.text('$X=[0,1]$', 1.02, 0.05, { align: 'left', size: 12, color: 'muted' });
          const all = [...f.A, ...f.G], pk = new Set(f.pick);
          drawBars(s, all, (i) => (i < f.A.length ? i : f.A.length + 0), 0.12, 0.012, (i) => (pk.size && !pk.has(i) ? null : i < f.A.length ? 'blue' : 'orange'), { width: 3, alpha: pk.size ? 1 : 0.5, r: 2.4 });
          if (pk.size) {
            const list = [...pk];
            list.forEach((i, k) => { const [a, b] = all[i]; const y = 0.5 + 0.06 * k; s.line(Math.max(a, -0.08), y, Math.min(b, 1.08), y, { color: i < f.A.length ? 'blue' : 'orange', width: 5, cap: 'butt' }); });
          }
          if (f.bad && !f.gap) { s.rect(0, 0.03, 0.1, 0.07, { color: 'red', width: 1.8, dash: true }); s.rect(0.9, 0.03, 1, 0.07, { color: 'red', width: 1.8, dash: true }); }
          if (f.gap) s.rect(0.1, 0.0, 0.1 + 0.8 / (f.A.length + 1), 0.1, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1.2 });
        });
        v.legend([['blue', 'cover of $C$'], ['orange', 'the open set $X\\setminus C$ (pieces)'], ['accent', 'the subset $C$']]);
        v.readout(() => {
          const f = S.frame; if (!f.A) return '';
          return `Step ${S.i + 1}: ${f.pick.length ? `${f.pick.length} sets highlighted.` : `${f.A.length + f.G.length} sets in the family.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Compact subsets of Hausdorff spaces are closed',
      statement: String.raw`Let $X$ be a Hausdorff space and $K\subset X$ compact. Then $K$ is closed in $X$. More precisely, for every $p\in X\setminus K$ there are disjoint open sets $U\supset K$ and $V\ni p$.`,
      idea: String.raw`For each $k\in K$ the Hausdorff property gives disjoint open sets $U_k\ni k$ and $V_k\ni p$. The $U_k$ cover $K$, so finitely many, $U_{k_1},\dots,U_{k_m}$, suffice. Put $U=\bigcup U_{k_i}$ and $V=\bigcap V_{k_i}$: the union is an open set containing $K$, the *finite* intersection is an open neighbourhood of $p$, and $U\cap V=\varnothing$. The step that needs compactness is that the intersection is finite. In the cofinite topology (not Hausdorff) every subset is compact and the construction collapses: nonempty open sets meet.`,
      caption: String.raw`The blob is the compact set $K\subset\R^2$; drag $p$ outside it. Every $k\in K$ gets a ball of radius $|pk|/2$ (so the ball at $k$ and the ball at $p$ of the same radius are disjoint). A greedy finite family of these balls (orange) covers $K$; the intersection of the matching balls around $p$ is the green disc, an open neighbourhood of $p$ missing $K$. In the cofinite line the same attempt fails: a neighbourhood of $p$ is everything except finitely many points, so it meets an infinite set $K$.`,
      deps: ['top-4.1', 'top-1.11'],
      see: ['pma-2.34', 'rca-2.5a'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'hausdorff'],
      viz(v) {
        const sp = v.select('space', [{ value: 'plane', label: '$\\R^2$ (Hausdorff)' }, { value: 'cof', label: 'cofinite topology (not Hausdorff)' }], 'plane');
        const nK = v.slider('points of $K$ drawn (cofinite mode)', 3, 40, 14, { int: true });
        const s = v.stage({ x: [-2.7, 2.7], y: [-1.7, 1.7], equal: true, axes: false, height: 360 });
        const K = v.M.blob(-0.9, 0, 0.95, 3, 0.3, 120);
        const pts = [];
        for (let x = -2.1; x <= 0.4; x += 0.1) for (let y = -1.3; y <= 1.3; y += 0.1) if (v.M.pointInPoly([x, y], K)) pts.push([x, y]);
        const hp = s.handle(1.5, 0.6, { color: 'gold', label: 'p', labelPos: 'ne', r: 7 });
        let cache = { key: '', val: null };
        const separate = (p) => {
          const key = p[0].toFixed(2) + ',' + p[1].toFixed(2); if (cache.key === key) return cache.val;
          const n = pts.length, rr = pts.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) / 2), unc = new Uint8Array(n).fill(1), picks = [];
          let left = n;
          while (left > 0 && picks.length < 80) {
            let best = -1, bc = 0;
            for (let k = 0; k < n; k++) { let c = 0; const r2 = rr[k] * rr[k]; for (let j = 0; j < n; j++) if (unc[j] && (pts[j][0] - pts[k][0]) ** 2 + (pts[j][1] - pts[k][1]) ** 2 < r2) c++; if (c > bc) { bc = c; best = k; } }
            if (best < 0) break;
            const r2 = rr[best] * rr[best]; for (let j = 0; j < n; j++) if (unc[j] && (pts[j][0] - pts[best][0]) ** 2 + (pts[j][1] - pts[best][1]) ** 2 < r2) { unc[j] = 0; left--; }
            picks.push(best);
          }
          const val = { picks, vr: Math.min(...picks.map((k) => rr[k])), left };
          cache = { key, val }; return val;
        };
        let info = null;
        v.render(() => {
          const cof = sp.value === 'cof'; nK.el.hidden = !cof; hp.visible = !cof;
          if (!cof) {
            s.poly(K, { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 2 });
            s.text('$K$', -0.9, 0, { size: 16, color: 'blue' });
            const p = [hp.x, hp.y];
            if (v.M.pointInPoly(p, K)) { info = { inside: true }; return; }
            const R = separate(p);
            for (const k of R.picks) { const q = pts[k]; s.circle(q[0], q[1], Math.hypot(q[0] - p[0], q[1] - p[1]) / 2, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.2 }); s.dot(q[0], q[1], { r: 2.5, color: 'orange' }); }
            s.circle(p[0], p[1], R.vr, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2.4 });
            info = { m: R.picks.length, vr: R.vr, left: R.left };
          } else {
            const n = nK.value; s.text('$K$ (infinite set; only some of its points are drawn)', 0.4, 1.2, { size: 12, color: 'blue' });
            for (let k = 0; k < n; k++) { const x = -1.7 + (3.9 * k) / (n - 1); s.dot(x, 0, { r: 5, color: 'blue' }); s.line(x - 0.07, -0.55, x + 0.07, -0.45, { color: 'red', width: 2 }); s.line(x - 0.07, -0.45, x + 0.07, -0.55, { color: 'red', width: 2 }); }
            s.text('...', 2.5, 0, { size: 18, color: 'blue' });
            s.dot(-2.3, 0, { r: 7, color: 'gold', label: 'p', labelPos: 'n' });
            s.text('a neighbourhood of $p$ is $X\\setminus F$, $F$ finite; to miss $K$ it must remove every point of $K$ (red crosses)', 0, -1.2, { size: 12, color: 'muted' });
            info = { cof: true, n };
          }
        });
        v.legend([['blue', 'compact set $K$'], ['orange', 'balls around points of $K$'], ['green', 'neighbourhood $V$ of $p$ missing $K$']]);
        v.readout(() => {
          if (!info) return '';
          if (info.cof) return `Every nonempty open set of the cofinite line contains all but finitely many points. To miss $K$, the finite set $F$ must contain all of $K$, i.e. $|F|\\ge${info.n}$ here, and the number of points of $K$ is unbounded: **no** neighbourhood of $p$ misses $K$, so $K$ is compact (every subset is) but not closed.`;
          if (info.inside) return 'Drag $p$ outside $K$: for $p\\in K$ there is nothing to separate.';
          return `Finitely many balls (**${info.m}**) cover $K$; the matching balls around $p$ intersect in a disc of radius $${v.fix(info.vr, 3)}$ that misses $K$ completely${info.left ? ` (${info.left} sample points left over, so lower bound only)` : ''}. A finite intersection of open sets is open — that is where compactness is spent.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Continuous images of compact spaces are compact',
      statement: String.raw`If $f\colon X\to Y$ is continuous and $X$ is compact, then $f(X)$ is compact. Hence compactness is a topological invariant.`,
      idea: String.raw`Let $\{V_\alpha\}$ be an open cover of $f(X)$ by open subsets of $Y$. By continuity the sets $f^{-1}(V_\alpha)$ are open and cover $X$, so finitely many of them, $f^{-1}(V_{\alpha_1}),\dots,f^{-1}(V_{\alpha_n})$, do. Then $V_{\alpha_1},\dots,V_{\alpha_n}$ cover $f(X)$. The proof pulls a cover back, extracts, and pushes forward; each of the two directions is used exactly once.`,
      caption: String.raw`Drag the four control points: the parameter interval $[0,1]$ (left) is sent by a Bézier curve $f$ to the plane (right). The faint discs cover the curve; the bold ones are a finite subcover found by the greedy rule. On the left you see their *pull-backs* $f^{-1}(\text{disc})$ — open subsets of $[0,1]$ — which do cover the interval. Shrink the radius until the family stops covering the curve.`,
      deps: ['top-4.1', 'top-2.1'],
      see: ['pma-4.14'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'continuity'],
      viz(v) {
        const rad = v.slider('radius of the discs', 0.08, 0.7, 0.3, { step: 0.01 });
        const nd = v.slider('discs in the cover', 6, 50, 22, { int: true });
        const tt = v.slider('parameter $t$', 0, 1, 0.35, { step: 0.005 });
        const D = v.stage({ x: [-0.05, 1.05], y: [-0.1, 1.05], axes: false, height: 340, title: 'the domain $[0,1]$ and the pull-backs' });
        const Y = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'the image $f([0,1])\\subset\\R^2$' });
        const H = [[-1.8, -0.8], [-0.9, 1.4], [0.9, -1.4], [1.8, 0.8]].map(([x, y], k) => Y.handle(x, y, { color: 'blue', r: 6, label: 'P' + k, labelPos: 'n' }));
        const f = (t) => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * H[0].x + b * H[1].x + c * H[2].x + d * H[3].x, a * H[0].y + b * H[1].y + c * H[2].y + d * H[3].y]; };
        const M = 700;
        let info = null;
        v.render(() => {
          const R = rad.value, m = nd.value, rg = v.rng(5);
          const T = Array.from({ length: M + 1 }, (_, j) => j / M), F = T.map(f);
          const discs = Array.from({ length: m + 1 }, (_, k) => { const c = f(k / m); return { c, r: R * (0.7 + 0.6 * rg()) }; });
          const cov = discs.map((d) => { const a = new Uint8Array(M + 1); for (let j = 0; j <= M; j++) a[j] = Math.hypot(F[j][0] - d.c[0], F[j][1] - d.c[1]) < d.r ? 1 : 0; return a; });
          const unc = new Uint8Array(M + 1).fill(1); let left = M + 1; const pick = [];
          for (;;) {
            let best = -1, bc = 0;
            cov.forEach((a, i) => { let c = 0; for (let j = 0; j <= M; j++) if (unc[j] && a[j]) c++; if (c > bc) { bc = c; best = i; } });
            if (best < 0) break;
            for (let j = 0; j <= M; j++) if (cov[best][j] && unc[j]) { unc[j] = 0; left--; }
            pick.push(best);
          }
          discs.forEach((d) => Y.circle(d.c[0], d.c[1], d.r, { color: 'faint', width: 1, alpha: 0.6 }));
          Y.curve(f, 0, 1, { color: 'ink', width: 3, n: 200 });
          pick.forEach((i, k) => {
            const d = discs[i], col = CYC[k % CYC.length];
            Y.circle(d.c[0], d.c[1], d.r, { fill: col, fillAlpha: 0.14, color: col, width: 2 });
            let j = 0; const dy = Math.min(0.05, 0.8 / Math.max(pick.length, 1));
            while (j <= M) { if (!cov[i][j]) { j++; continue; } let e = j; while (e + 1 <= M && cov[i][e + 1]) e++; D.line(T[j], 0.95 - dy * k, T[e], 0.95 - dy * k, { color: col, width: 4, cap: 'butt' }); j = e + 1; }
          });
          D.line(0, 0, 1, 0, { color: 'ink', width: 4, cap: 'butt' });
          unc.forEach((u, j) => { if (u) D.dot(T[j], 0, { r: 1.5, color: 'red' }); });
          const fp = f(tt.value);
          D.dot(tt.value, 0, { r: 6, color: 'gold' }); Y.dot(fp[0], fp[1], { r: 6, color: 'gold' });
          info = { pick: pick.length, m: m + 1, left };
        });
        v.legend([['faint', 'cover of the image'], ['green', 'finite subcover (bold) and its pull-backs'], ['red', 'parameters not covered', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          if (info.left) return `These ${info.m} discs do **not** cover the whole curve (${info.left} sampled parameters lie outside every disc, red): enlarge the radius or add discs.`;
          return `The ${info.m} discs cover the image. The pull-backs of **${info.pick}** of them already cover $[0,1]$; pushing forward, those ${info.pick} discs cover $f([0,1])$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Compact-to-Hausdorff bijections are homeomorphisms',
      statement: String.raw`If $f\colon X\to Y$ is a continuous bijection, $X$ is compact and $Y$ is Hausdorff, then $f$ is a homeomorphism.`,
      idea: String.raw`It is enough to show that $f$ is a closed map, since then $f^{-1}$ is continuous. A closed $C\subset X$ is compact (4.2), so $f(C)$ is compact (4.4), hence closed in the Hausdorff space $Y$ (4.3). Every hypothesis is used: without compactness of $X$ or the Hausdorff property of $Y$, a continuous bijection can fail to be a homeomorphism (2.4).`,
      caption: String.raw`Left: the interval with the closed set $A=[a,1]$ (or $[a,1)$) highlighted; right: its image on the circle. With $[0,1]$ and the end points glued ($t\mapsto e^{2\pi it}$ on the quotient) the image of every closed set is closed. With $[0,1)$, a continuous bijection onto the circle, the image of the closed set $[a,1)$ is an arc missing its end point $(1,0)$. Drag $z$ around the circle: $f^{-1}(z)$ jumps from near $1$ back to $0$ as $z$ passes $(1,0)$ in the second case.`,
      deps: ['top-4.2', 'top-4.3', 'top-4.4'],
      see: ['pma-4.17'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'homeomorphism'],
      viz(v) {
        const sp = v.select('map', [{ value: 'q', label: '$[0,1]/\\{0\\sim1\\}\\to S^1$ (compact domain)' }, { value: 'h', label: '$[0,1)\\to S^1$ (not compact)' }], 'q');
        const a = v.slider('closed set starts at $a$', 0.1, 0.9, 0.55, { step: 0.01 });
        const D = v.stage({ x: [-0.08, 1.12], y: [-0.5, 0.6], axes: false, height: 200, title: 'domain' });
        const C = v.stage({ x: [-1.5, 1.5], y: [-1.4, 1.4], equal: true, axes: false, height: 330, title: 'the circle' });
        const hz = C.handle(Math.cos(1.2), Math.sin(1.2), { color: 'gold', label: 'z', labelPos: 'ne', r: 7, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        let info = null;
        v.render(() => {
          const q = sp.value === 'q', A = a.value;
          D.line(0, 0, 1, 0, { color: 'muted', width: 3, cap: 'butt' });
          D.interval(A, 1, 0, { color: 'blue', width: 8, r: 5, open: [false, !q] });
          D.dot(0, 0, { r: 5, color: 'ink' });
          if (q) D.dot(1, 0, { r: 5, color: 'ink' }); else D.dot(1, 0, { r: 5, hollow: true, color: 'ink' });
          D.text(q ? '0 and 1 are glued to one point' : '1 is not in the domain', 0.5, -0.3, { align: 'center', size: 12, color: 'muted' });
          D.text('$A$', (A + 1) / 2, 0.22, { size: 15, color: 'blue' });
          C.circle(0, 0, 1, { color: 'muted', width: 2 });
          const th = (t) => 2 * Math.PI * t;
          C.curve((t) => [Math.cos(th(A + (1 - A) * t)), Math.sin(th(A + (1 - A) * t))], 0, 1, { color: 'blue', width: 7, n: 120 });
          C.dot(1, 0, { r: 6, color: q ? 'blue' : 'red', hollow: !q, label: '(1,0)', labelPos: 'e' });
          if (!q) C.dot(Math.cos(th(A)), Math.sin(th(A)), { r: 4, color: 'blue' });
          let ang = Math.atan2(hz.y, hz.x); if (ang < 0) ang += 2 * Math.PI;
          const t = ang / (2 * Math.PI);
          D.dot(t, 0, { r: 6.5, color: 'gold' });
          info = { q, A, t };
        });
        v.legend([['blue', 'closed set $A$ and its image'], ['gold', '$z$ and $f^{-1}(z)$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { q, t } = info;
          if (q) return `Domain compact, circle Hausdorff: the image of $A=[a,1]$ is the closed arc from angle $2\\pi a$ to $2\\pi$ (it contains $(1,0)$). $f^{-1}(z)=${v.fix(t, 3)}$ moves continuously, and through $(1,0)$ it passes from $1$ to $0$ — the same point of the quotient.`;
          return `$[0,1)$ is not compact. $A=[a,1)$ is closed in $[0,1)$ but its image is the arc **without** its end point $(1,0)$: not closed, so $f$ is not a closed map. Equivalently $f^{-1}(z)=${v.fix(t, 3)}$ jumps from $\\approx1$ to $0$ as $z$ crosses $(1,0)$: $f^{-1}$ is discontinuous.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Lemma',
      name: 'Tube lemma',
      statement: String.raw`Let $Y$ be compact and $x_0\in X$. If $N$ is an open subset of $X\times Y$ containing the slice $\{x_0\}\times Y$, then there is an open neighbourhood $W$ of $x_0$ in $X$ such that the whole **tube** $W\times Y\subset N$.`,
      idea: String.raw`Each point $(x_0,y)$ of the slice lies in a basic open box $A_y\times B_y\subset N$. The $B_y$ cover the compact $Y$, so finitely many, $B_{y_1},\dots,B_{y_m}$, do. Take $W=A_{y_1}\cap\dots\cap A_{y_m}$, open because the intersection is finite. Then for $(x,y)\in W\times Y$, pick $i$ with $y\in B_{y_i}$: $x\in A_{y_i}$, so $(x,y)\in A_{y_i}\times B_{y_i}\subset N$.`,
      caption: String.raw`The region $N=\{|x|<1/(1+c\,y^2)\}$ (blue) contains the slice $x=0$. Take $Y=[-L,L]$: the narrowest width of $N$ over $Y$ is $1/(1+cL^2)>0$, and any tube $|x|<\delta$ below that width (green) fits inside $N$. Switch to $Y=\R$: the width tends to $0$ as $|y|\to\infty$, and every tube sticks out of $N$ (red) at some height.`,
      deps: ['top-4.1', 'top-2.8'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'product topology'],
      viz(v) {
        const sp = v.select('the factor $Y$', [{ value: 'c', label: 'compact $[-L,L]$' }, { value: 'r', label: '$\\R$ (not compact)' }], 'c');
        const L = v.slider('$L$', 0.5, 5, 2.5, { step: 0.05 });
        const c = v.slider('narrowing rate $c$', 0.2, 4, 1.2, { step: 0.05 });
        const dl = v.slider('tube half-width $\\delta$', 0.02, 1, 0.3, { step: 0.01 });
        const s = v.stage({ x: [-1.25, 1.25], y: [-6, 6], axes: 'box', gutter: true, height: 380, xlabel: '$x$', ylabel: '$y$' });
        let info = null;
        v.render(() => {
          const compact = sp.value === 'c', w = (y) => 1 / (1 + c.value * y * y), Lc = compact ? L.value : 6, d = dl.value;
          L.el.hidden = !compact;
          const ys = Array.from({ length: 241 }, (_, k) => -6 + (12 * k) / 240);
          s.poly([...ys.map((y) => [w(y), y]), ...ys.map((y) => [-w(y), y]).reverse()], { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 2 });
          if (compact) { s.rect(-1.25, -6, 1.25, -L.value, { fill: 'muted', fillAlpha: 0.12, stroke: false, hatch: true }); s.rect(-1.25, L.value, 1.25, 6, { fill: 'muted', fillAlpha: 0.12, stroke: false, hatch: true }); }
          s.line(0, -Lc, 0, Lc, { color: 'ink', width: 2.2, dash: [5, 4] });
          const inf = compact ? w(L.value) : 0;
          const fits = d <= inf + 1e-12, ystar = Math.sqrt(Math.max(0, (1 / d - 1) / c.value));
          s.rect(-d, -Lc, d, Lc, { fill: fits ? 'green' : 'red', fillAlpha: 0.2, color: fits ? 'green' : 'red', width: 2 });
          if (!fits && ystar <= Lc) { s.dot(d, ystar, { r: 5, color: 'red' }); s.dot(d, -ystar, { r: 5, color: 'red' }); }
          if (compact) s.vline(inf, { color: 'orange', width: 1.4, dash: [4, 4] });
          info = { compact, inf, fits, ystar, d };
        });
        v.legend([['blue', 'the open set $N$'], ['ink', 'the slice $\\{x_0\\}\\times Y$', { dash: true }], ['green', 'tube $W\\times Y$'], ['orange', 'minimal width of $N$']]);
        v.readout(() => {
          if (!info) return '';
          const { compact, inf, fits, ystar, d } = info;
          if (compact) return `Narrowest width of $N$ over $Y=[-${v.fix(L.value, 2)},${v.fix(L.value, 2)}]$ is $\\min_y 1/(1+cy^2)=${v.fix(inf, 3)}$. A tube of half-width $\\delta=${v.fix(d, 2)}$ ${fits ? '**fits** inside $N$ (it is narrower than that minimum)' : `leaves $N$ at heights $|y|\\ge${v.fix(ystar, 2)}$ (red dots): shrink $\\delta$ to ≤ ${v.fix(inf, 3)}`}.`;
          return `Over $Y=\\R$ the width of $N$ is $\\inf_y 1/(1+cy^2)=0$, so **no** tube $|x|<\\delta$ lies in $N$: the tube of half-width $\\delta=${v.fix(d, 2)}$ already sticks out for $|y|>${v.fix(ystar, 2)}$. The slice is contained in $N$, but compactness of $Y$ is what produces a tube.`;
        });
      },
    },
  ],
};
