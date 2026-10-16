// Topology — Chapter 3 (part b): items 3.8–3.14 — path-connected ⇒ connected, the sine curve, components,
// local connectedness, open connected sets in ℝⁿ, the comb, and cut points
import { sampleGrid, labelGrid, gridPath, shortcut, inShapes, shapeComponents, sineArc, sineLength, combTeeth } from './ch03.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const CYC = ['blue', 'orange', 'green', 'pink', 'purple', 'teal', 'gold', 'red'];

export default {
  collection: 'top',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Path-connected spaces are connected',
      statement: String.raw`Every path-connected space is connected.`,
      idea: String.raw`Suppose $X=U\cup V$ is a separation and pick $x\in U$, $y\in V$. A path $\gamma\colon[0,1]\to X$ from $x$ to $y$ pulls the separation back: $\gamma^{-1}(U)$ and $\gamma^{-1}(V)$ are disjoint, open in $[0,1]$ by continuity, cover $[0,1]$, and contain $0$ and $1$ respectively. That is a separation of $[0,1]$, contradicting 3.2 (an interval is a linear continuum) — equivalently 3.3, since $\gamma([0,1])$ is a connected subset of $X$ meeting both $U$ and $V$.`,
      caption: String.raw`Choose a region, place the endpoints $x,y$ (green, they pick the path), and drag the orange line that tries to cut the region. The path found is pulled back to the parameter bar below: each parameter value is coloured by the side of the line on which $\gamma(t)$ falls. Wherever the path crosses the line the bar has a gold mark — those parameters belong to neither piece, so the colouring never gives a separation of $[0,1]$.`,
      deps: ['top-3.7', 'top-3.2', 'top-3.3'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'paths'],
      viz(v) {
        const reg = v.select('region $X$', [{ value: 'ring', label: 'annulus' }, { value: 'bell', label: 'dumbbell' }, { value: 'disc', label: 'disc' }], 'ring');
        const IN = {
          ring: (x, y) => { const r = Math.hypot(x, y); return r > 0.9 && r < 1.8; },
          bell: (x, y) => Math.hypot(x + 1.6, y) < 0.85 || Math.hypot(x - 1.6, y) < 0.85 || (Math.abs(x) < 1.0 && Math.abs(y) < 0.1),
          disc: (x, y) => Math.hypot(x, y) < 1.7,
        };
        const G = {}; for (const k of Object.keys(IN)) G[k] = sampleGrid(IN[k], [-2.6, 2.6], [-2.1, 2.1], 160, 130);
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, axes: false, height: 340, title: 'the region and a cut' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-1, 1], axes: false, height: 340, title: 'pull-back to the parameter space $[0,1]$' });
        const hp = S.handle(-1.35, 0.1, { color: 'green', label: 'x' }), hq = S.handle(1.35, -0.1, { color: 'green', label: 'y' });
        const h1 = S.handle(0.35, -1.95, { color: 'orange', label: '', r: 6 }), h2 = S.handle(0.4, 1.95, { color: 'orange', label: '', r: 6 });
        let info = null;
        v.render(() => {
          const f = IN[reg.value], g = G[reg.value];
          let dx = h2.x - h1.x, dy = h2.y - h1.y; const L = Math.hypot(dx, dy) || 1, n = [-dy / L, dx / L], c = n[0] * h1.x + n[1] * h1.y;
          const sd = (x, y) => n[0] * x + n[1] * y - c;
          S.raster((x, y) => (f(x, y) ? [...v.rgb(sd(x, y) > 0 ? 'blue' : 'red').slice(0, 3), 0.28] : null), { key: [reg.value, h1.x.toFixed(2), h1.y.toFixed(2), h2.x.toFixed(2), h2.y.toFixed(2)].join(), res: 3 });
          S.line(h1.x - dx * 20 / L, h1.y - dy * 20 / L, h1.x + dx * 20 / L, h1.y + dy * 20 / L, { color: 'orange', width: 1.6, dash: [6, 4] });
          const raw = gridPath(g, [hp.x, hp.y], [hq.x, hq.y]);
          if (!raw) { info = { none: true }; return; }
          const P = shortcut(raw, f);
          const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
          const tot = cum[cum.length - 1] || 1, at = (t) => { const s = t * tot; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const w = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [P[i - 1][0] + w * (P[i][0] - P[i - 1][0]), P[i - 1][1] + w * (P[i][1] - P[i - 1][1])]; };
          S.path(P, { color: 'green', width: 3.5 });
          const N = 400; let nu = 0, nv = 0, no = 0, prev = null, flips = 0;
          for (let i = 0; i < N; i++) {
            const t = (i + 0.5) / N, p = at(t), d = sd(p[0], p[1]);
            const cls = Math.abs(d) < 0.012 ? 0 : d > 0 ? 1 : 2;
            if (cls === 0) no++; else if (cls === 1) nu++; else nv++;
            B.line(i / N, 0, (i + 1) / N, 0, { color: cls === 0 ? 'gold' : cls === 1 ? 'blue' : 'red', width: cls === 0 ? 22 : 14, cap: 'butt' });
            if (cls && prev && cls !== prev) flips++; if (cls) prev = cls;
          }
          B.text('t = 0', 0.01, -0.45, { size: 11, color: 'muted' }); B.text('t = 1', 0.99, -0.45, { size: 11, color: 'muted', align: 'right' });
          B.text('$\\gamma^{-1}(U)$ blue, $\\gamma^{-1}(V)$ red, gold = neither', 0.5, 0.55, { align: 'center', size: 12, color: 'muted' });
          // does the line separate X itself?
          let meets = false, pos = false, neg = false;
          for (let j = 0; j < g.M; j++) for (let i = 0; i < g.N; i++) if (g.a[j * g.N + i]) { const d = sd(g.cx(i), g.cy(j)); if (Math.abs(d) < 0.03) meets = true; else if (d > 0) pos = true; else neg = true; }
          info = { nu: nu / N, nv: nv / N, no: no / N, meets, pos, neg, flips };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.none) return 'No path joins $x$ and $y$ (a handle is outside the region, or the region is not path-connected).';
          const { nu, nv, no, meets, pos, neg } = info, sep = !meets && pos && neg;
          return `Along the path: ${(100 * nu).toFixed(0)}% of the parameters fall in $\\gamma^{-1}(U)$, ${(100 * nv).toFixed(0)}% in $\\gamma^{-1}(V)$, ${(100 * no).toFixed(0)}% on the line. ${sep ? '**This line does separate $X$** — but then it misses the path (the path would stay on one side) because $X$ was a disconnected set; for a path-connected region that cannot happen.' : meets ? 'The line meets $X$, so it is not even a candidate separation of $X$; and wherever the path crosses it, the gold marks keep $\\gamma^{-1}(U)$ and $\\gamma^{-1}(V)$ from covering $[0,1]$.' : `The line misses $X$ and one side is empty: the path stays on one side, so one pull-back is all of $[0,1]$ and the other is empty.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Proposition',
      name: 'Topologist’s sine curve',
      statement: String.raw`Let $S=\{(x,\sin(1/x)):0<x\le1\}\cup(\{0\}\times[-1,1])\subset\R^2$. Then $S$ is connected (it is the closure of the connected graph, 3.5), but **not path-connected**: there is no path in $S$ from a point of the vertical segment $\{0\}\times[-1,1]$ to a point of the graph.`,
      idea: String.raw`Suppose $\gamma=(\gamma_1,\gamma_2)\colon[0,1]\to S$ is a path starting on the segment and let $t_0=\sup\{t:\gamma_1(t)=0\}$ be the last time it is on the segment; after $t_0$ it lies on the graph, so $\gamma_2(t)=\sin(1/\gamma_1(t))$ with $\gamma_1(t)\to0$ as $t\downarrow t_0$. By the intermediate value theorem (3.4) applied to $\gamma_1$, which takes every value in $(0,\gamma_1(t_1))$ on $(t_0,t_1)$, $\gamma_2$ takes the values $+1$ and $-1$ infinitely often in every interval $(t_0,t_0+\delta)$, so $\gamma_2$ has no limit at $t_0$: $\gamma$ is not continuous.`,
      caption: String.raw`Top: zoom in on the origin; the curve oscillates without end and fills out the segment (drawn down to $x\approx4\cdot10^{-4}$; the rest is solid at this resolution). Bottom: any parametrisation of the graph approaching the segment, here $x(t)=(1-t)^{p}$, has second coordinate $\sin(1/x(t))$. Pick a candidate limit $L$ and a $\delta$: the gold window is $t>1-\delta$, and the red dot is a time inside it where $|{\gamma_2-L}|\ge 1$ — outside the $\tfrac12$-band for **every** $L$ and every $\delta$.`,
      deps: ['top-3.8', 'top-3.5'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'counterexample'],
      viz(v) {
        const zoom = v.slider('window width $w$', 0.02, 1, 1, { log: true, sig: 2 });
        const pw = v.slider('speed profile $p$', 0.5, 3, 1, { step: 0.05 });
        const Lc = v.slider('candidate limit $L$', -1, 1, 0.2, { step: 0.01 });
        const dk = v.slider('$\\delta=10^{-k}$, $k=$', 0.3, 3.5, 1.2, { step: 0.05 });
        const A = v.stage({ x: [-0.15, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 'y', title: '$S$ near the origin' });
        const B = v.stage({ x: [0, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 280, xlabel: 't', ylabel: '$\\gamma_2(t)=\\sin(1/x(t))$', title: 'a would-be path $t\\mapsto(x(t),\\gamma_2(t))$ with $x(t)=(1-t)^p$' });
        let info = null;
        v.render(() => {
          const w = zoom.value, p = pw.value, L = Lc.value, delta = Math.pow(10, -dk.value);
          A.setView([-0.15 * w, w], [-1.4, 1.4]);
          const x0 = Math.max(w * 0.004, 4e-4);
          A.line(0, -1, 0, 1, { color: 'green', width: 4 });
          A.path(sineArc(x0, w, 16), { color: 'blue', width: 1.6 });
          A.text('segment $\\{0\\}\\times[-1,1]$', -0.12 * w, 1.2, { size: 11, color: 'green', align: 'left' });
          // lower panel
          const PH = 4000, step = TAU / 14, pts = [];
          for (let ph = 1; ph <= PH; ph += step) pts.push([1 - Math.pow(ph, -1 / p), Math.sin(ph)]);
          B.hband(L - 0.5, L + 0.5, { color: 'orange', alpha: 0.14 });
          B.hline(L, { color: 'orange', width: 1, dash: [4, 3] });
          B.path(pts, { color: 'blue', width: 1.3 });
          B.vband(1 - delta, 1, { color: 'gold', alpha: 0.2 });
          const base = L >= 0 ? 1.5 * Math.PI : 0.5 * Math.PI, target = Math.pow(delta, -p);
          const m = Math.max(0, Math.ceil((target - base) / TAU)), phw = base + TAU * m, tw = 1 - Math.pow(phw, -1 / p), yw = Math.sin(phw);
          B.dot(tw, yw, { r: 6, color: 'red', label: 'γ₂ = ' + (yw < 0 ? '−1' : '1'), labelPos: 'w' });
          info = { len: sineLength(x0), x0, tw, yw, L, dev: Math.abs(yw - L), delta, swings: Math.floor(1 / (Math.PI * 1e-4)) };
        });
        v.readout(() => {
          if (!info) return '';
          return `The graph from $x=1$ down to $x=${v.sci(info.x0, 2)}$ already has length $${v.fix(info.len, 0)}$ (about $\\tfrac{2}{\\pi x}$, so infinite in the limit) — but a continuous path may have infinite length; the real obstruction is the oscillation.\nWith $\\delta=${v.sci(info.delta, 1)}$ the witness time is $t=${info.tw.toFixed(6)}>1-\\delta$, where $\\gamma_2=${info.yw < 0 ? '-1' : '1'}$ and $|\\gamma_2-L|=${v.fix(info.dev, 2)}\\ge 1$: no $L$ is the limit of $\\gamma_2$ at $t=1$, so $\\gamma$ cannot be continuous there.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Components and path components',
      statement: String.raw`The **components** of $X$ are the equivalence classes of the relation "$x,y$ lie in a common connected subset"; each is a maximal connected subset, they partition $X$, and they are closed. The **path components** are the classes of "$x,y$ are joined by a path"; they are maximal path-connected subsets. Every path component lies in a single component, so $\#\{\text{path components}\}\ge\#\{\text{components}\}$, with equality for the nice spaces of 3.12 but not in general.`,
      idea: String.raw`Union of connected sets through a point is connected (3.5a), so the union of all connected sets containing $x$ is the largest connected set containing $x$; its closure is connected too (3.5b), hence equal to it — components are closed. Paths can be concatenated and a path is a connected image (3.8), so a path component sits inside a component. For the topologist's sine curve the graph of $\sin(1/x)$ is path-connected, the segment is path-connected, nothing joins them (3.9) — one component, two path components.`,
      caption: String.raw`Drag the point $p$ (it snaps onto the set). Switch between colouring by component and by path component. For the four blobs the two colourings agree (two overlapping discs, a separate disc and two open discs touching at a left-out point: four components). For the sine curve one component splits into two path components, and for the double curve one component into three.`,
      deps: ['top-3.1', 'top-3.7'],
      refs: ['Munkres §25'],
      tags: ['connectedness', 'components'],
      viz(v) {
        const set = v.select('set', [{ value: 'blobs', label: 'four blobs' }, { value: 'sine', label: 'sine curve' }, { value: 'dsine', label: 'double sine curve' }], 'blobs');
        const mode = v.select('colour by', [{ value: 'c', label: 'component' }, { value: 'p', label: 'path component' }], 'c');
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.5], equal: true, axes: false, height: 340 });
        const blobs = [{ t: 'disc', c: [-1.15, 0.45], r: 0.55 }, { t: 'disc', c: [-0.6, 0.1], r: 0.55 }, { t: 'disc', c: [-1.15, -1.0], r: 0.35 }, { t: 'disc', c: [0.4, 0.6], r: 0.5, open: true }, { t: 'disc', c: [1.4, 0.6], r: 0.5, open: true }, { t: 'disc', c: [0.9, -0.5], r: 0.01 }];
        blobs.pop();
        const BC = shapeComponents(blobs);
        const hp = S.handle(-1.15, 0.45, { color: 'gold', label: 'p', r: 7, constrain: (x, y) => {
          if (set.value === 'blobs') return [x, y];
          const sx = set.value === 'sine' ? clamp(x, 0, 1.8) : clamp(x, -1.8, 1.8);
          if (Math.abs(sx) < 0.02) return [0, clamp(y, -1, 1)];
          return [sx, Math.sin(1 / Math.abs(sx))];
        } });
        let info = null;
        v.render(() => {
          const kind = set.value, byPath = mode.value === 'p';
          if (kind === 'blobs') {
            blobs.forEach((b, i) => { const col = CYC[BC.comp[i] % CYC.length]; S.circle(b.c[0], b.c[1], b.r, { fill: col, fillAlpha: 0.35, color: col, width: 2, dash: b.open ? [5, 4] : false }); });
            let mine = -1; blobs.forEach((b, i) => { if (Math.hypot(hp.x - b.c[0], hp.y - b.c[1]) < b.r && mine < 0) mine = i; });
            if (mine >= 0) { const b = blobs[mine]; S.circle(b.c[0], b.c[1], b.r + 0.05, { color: 'ink', width: 2.5 }); }
            info = { kind, kc: BC.k, kp: BC.k, mine: mine >= 0 };
          } else {
            const dbl = kind === 'dsine', comp = (path) => (path ? ['blue', 'orange', 'green'] : ['blue', 'blue', 'blue']);
            const C = comp(byPath);
            S.line(0, -1, 0, 1, { color: byPath ? 'green' : 'blue', width: 4 });
            S.path(sineArc(5e-4, 1.8, 16), { color: byPath ? 'orange' : 'blue', width: 2 });
            if (dbl) S.path(sineArc(5e-4, 1.8, 16).map(([x, y]) => [-x, y]), { color: byPath ? 'blue' : 'blue', width: 2 });
            const side = Math.abs(hp.x) < 0.02 ? 'seg' : hp.x > 0 ? 'right' : 'left';
            // thicken the path component of p
            if (byPath) {
              if (side === 'seg') S.line(0, -1, 0, 1, { color: 'ink', width: 7, alpha: 0.35 });
              else S.path(sineArc(5e-4, 1.8, 16).map(([x, y]) => [side === 'right' ? x : -x, y]), { color: 'ink', width: 5, alpha: 0.3 });
            } else S.text('this one connected set is a single component', 0, -1.3, { align: 'center', size: 11.5, color: 'muted' });
            info = { kind, kc: 1, kp: dbl ? 3 : 2, side };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.kind === 'blobs') return `Components: **${info.kc}**; path components: **${info.kp}** (here they coincide, computed from which discs touch: open discs that meet only at a missing point do not join).`;
          return `Components: **1** (the closure of a connected graph is connected, 3.5). Path components: **${info.kp}** — ${info.kind === 'sine' ? 'the graph and the vertical segment' : 'the right graph, the left graph and the segment'}, because no path can run onto the segment (3.9). The point $p$ lies on the ${info.side === 'seg' ? 'segment' : info.side + ' graph'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Locally connected and locally path-connected spaces',
      statement: String.raw`A space $X$ is **locally connected at $x$** if for every neighbourhood $U$ of $x$ there is a connected open neighbourhood $V$ of $x$ with $V\subset U$; it is **locally connected** if this holds at every point. **Locally path-connected** is defined the same way with path-connected neighbourhoods. Equivalently $X$ is locally connected iff the components of every open subset of $X$ are open. Neither global property implies the local one.`,
      idea: String.raw`If every point has small connected neighbourhoods, each component $C$ of an open set $W$ is open: a point $x\in C$ has a connected neighbourhood inside $W$, which must lie in $C$. Conversely, if components of open sets are open, the component of $x$ in $U$ is the required $V$. Checking a failure at one point only needs a single bad $U$: a ball so small that the piece of $X$ inside it containing $x$ is not a neighbourhood of $x$.`,
      caption: String.raw`Drag $p$ (it snaps onto the space) and the radius $\varepsilon$. Pieces of $X\cap B(p,\varepsilon)$ are coloured by component; the piece of $p$ is outlined. In the disc every ball gives one piece. In the comb space, at a point of the limit tooth the ball falls into many slivers, and the component of $p$ is only a short segment of the limit tooth — not a neighbourhood — unless $\varepsilon$ is large enough to reach the base.`,
      deps: ['top-3.10'],
      refs: ['Munkres §25'],
      tags: ['connectedness', 'local'],
      viz(v) {
        const sp = v.select('space', [{ value: 'comb', label: 'comb space' }, { value: 'disc', label: 'open disc' }], 'comb');
        const eps = v.slider('radius $\\varepsilon$', 0.03, 0.7, 0.2, { step: 0.005 });
        const S = v.stage({ x: [-0.25, 1.15], y: [-0.2, 1.2], equal: true, axes: false, height: 360 });
        const T = combTeeth(60);
        const proj = (x, y) => {
          if (sp.value === 'disc') { const r = Math.hypot(x - 0.45, y - 0.5); return r < 0.45 ? [x, y] : [0.45 + ((x - 0.45) * 0.45) / r, 0.5 + ((y - 0.5) * 0.45) / r]; }
          let best = [clamp(x, 0, 1), 0], bd = Math.hypot(x - best[0], y);
          for (const tx of T) { const q = [tx, clamp(y, 0, 1)], d = Math.hypot(x - q[0], y - q[1]); if (d < bd) { bd = d; best = q; } }
          return best;
        };
        const hp = S.handle(0, 0.55, { color: 'gold', label: 'p', r: 7, constrain: proj });
        let info = null;
        v.render(() => {
          const e = eps.value, x0 = hp.x, y0 = hp.y;
          if (sp.value === 'disc') {
            S.circle(0.45, 0.5, 0.45, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 1.5, dash: [5, 4] });
            S.raster((x, y) => (Math.hypot(x - 0.45, y - 0.5) < 0.45 && Math.hypot(x - x0, y - y0) < e ? [...v.rgb('orange').slice(0, 3), 0.5] : null), { key: [x0.toFixed(3), y0.toFixed(3), e].join(), res: 2 });
            S.circle(x0, y0, e, { color: 'ink', width: 1.4, dash: [4, 3] });
            info = { sp: 'disc', k: 1 };
            return;
          }
          // comb: pieces of the ball
          const pieces = []; // {kind, x, lo, hi, comp}
          for (const tx of T) { const dx = Math.abs(tx - x0); if (dx >= e) continue; const h = Math.sqrt(e * e - dx * dx), lo = Math.max(0, y0 - h), hi = Math.min(1, y0 + h); if (hi > lo || (hi === lo && lo === y0)) pieces.push({ x: tx, lo, hi }); }
          let base = null; if (y0 < e) { const h = Math.sqrt(e * e - y0 * y0); base = [Math.max(0, x0 - h), Math.min(1, x0 + h)]; }
          let nc = 0; const comp = new Map();
          const baseId = base ? nc++ : -1;
          for (const p of pieces) { if (base && p.lo <= 1e-12) p.c = baseId; else p.c = nc++; }
          const pc = (() => { const q = pieces.find((p) => Math.abs(p.x - x0) < 1e-9); return q ? q.c : baseId; })();
          S.line(0, 0, 1, 0, { color: 'faint', width: 3 });
          for (const tx of T) S.line(tx, 0, tx, 1, { color: 'faint', width: tx === 0 ? 2.4 : 1.2 });
          const OTH = ['blue', 'green', 'pink', 'purple', 'teal', 'red'], colOf = (c) => (c === pc ? 'orange' : OTH[c % 6]);
          if (base) S.line(base[0], 0, base[1], 0, { color: colOf(baseId), width: 5, cap: 'butt' });
          for (const p of pieces) S.line(p.x, p.lo, p.x, p.hi, { color: colOf(p.c), width: p.c === pc ? 5 : 3.2, cap: 'butt' });
          S.circle(x0, y0, e, { color: 'ink', width: 1.4, dash: [4, 3] });
          const others = pieces.filter((p) => p.c !== pc);
          const near = others.length ? Math.min(...others.map((p) => Math.hypot(p.x - x0, (y0 < p.lo ? p.lo - y0 : y0 > p.hi ? y0 - p.hi : 0)))) : Infinity;
          info = { sp: 'comb', k: nc, near, onLimit: Math.abs(x0) < 1e-9, nPieces: pieces.length, e, neigh: !others.length, x0 };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.sp === 'disc') return `$B(p,\\varepsilon)\\cap D$ is convex, so **one** piece for every $\\varepsilon$ (and $p$ has path-connected neighbourhoods of every size): the open disc is locally connected and locally path-connected.`;
          const { k, near, onLimit, neigh } = info;
          return `$B(p,\\varepsilon)\\cap X$ has **${k}** component${k > 1 ? 's' : ''}. ${neigh ? `The component of $p$ is all of $B(p,\\varepsilon)\\cap X$, so for this $\\varepsilon$ it is a neighbourhood of $p$.` : `The component of $p$ is **not** a neighbourhood of $p$: other pieces come within $${v.fix(near, 3)}$ of $p$${onLimit ? ' — and teeth $x=1/n$ for every larger $n$ come arbitrarily closer, so no smaller ball helps' : ''}.`} ${onLimit && !neigh ? 'The comb is not locally connected at points of the limit tooth.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Open connected subsets of ℝⁿ are path-connected',
      statement: String.raw`If $U\subset\R^n$ is open and connected, then $U$ is path-connected — indeed any two points of $U$ are joined by a polygonal path (finitely many segments) lying in $U$. More generally a connected, locally path-connected space is path-connected, and the path components of a locally path-connected space are open and closed.`,
      idea: String.raw`Fix $x_0\in U$ and let $A$ be the set of points reachable from $x_0$ by polygonal paths in $U$. $A$ is open: if $a\in A$, a small ball $B(a,r)\subset U$ is convex, so every point of it is reached by adding one segment. The complement $U\setminus A$ is open for the same reason: if $b\notin A$, then no point of a ball $B(b,r)\subset U$ is in $A$ (else $b$ would be reachable from it). So $A$ is clopen and nonempty, hence $A=U$ by connectedness (3.1).`,
      caption: String.raw`Choose an open region and drag the base point $x_0$. Slide the allowed path length: the green set of points reachable from $x_0$ by a polygonal path of at most that length grows by flood fill. The small gold disc is a ball around the front point that lies entirely inside the reachable set — openness of $A$. At full length the green region is the whole component of the region; for two blobs it stops at the gap, because the region was not connected.`,
      deps: ['top-3.11', 'top-3.8'],
      refs: ['Munkres §25'],
      tags: ['connectedness', 'paths'],
      viz(v) {
        const reg = v.select('open region $U$', [{ value: 'C', label: 'C-shaped corridor' }, { value: 'ring', label: 'annulus' }, { value: 'two', label: 'two blobs' }], 'C');
        const len = v.slider('path length $\\le$', 0, 14, 4, { step: 0.05 });
        const IN = {
          C: (x, y) => { const r = Math.hypot(x, y); return r > 1.3 && r < 2.0 && !(x > 0 && Math.abs(y) < 0.55 + 0.0) ? true : false; },
          ring: (x, y) => { const r = Math.hypot(x, y); return r > 1.0 && r < 2.0; },
          two: (x, y) => Math.hypot(x + 1.3, y) < 1.0 || Math.hypot(x - 1.3, y) < 1.0,
        };
        const NX = 130, NY = 100, bx = [-2.6, 2.6], by = [-2.1, 2.1];
        const G = {}, LB = {}; for (const k of Object.keys(IN)) { G[k] = sampleGrid(IN[k], bx, by, NX, NY); LB[k] = labelGrid(G[k]); }
        const S = v.stage({ x: bx, y: by, equal: true, axes: false, height: 360 });
        const h0 = S.handle(-1.6, 0.1, { color: 'gold', label: 'x₀', r: 7 });
        let cache = { key: '', dist: null };
        const bfs = (g, s) => { // octile distance from cell s in data units
          const d = new Float64Array(g.N * g.M).fill(Infinity); d[s] = 0;
          const cx = g.dx, cy = g.dy, dg = Math.hypot(cx, cy);
          // Dijkstra-ish with bucketed order: simple label-correcting loop is fine at this size
          const heap = [[0, s]];
          while (heap.length) {
            let bi = 0; for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i;
            const [dd, c] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop(); if (dd > d[c]) continue;
            const ci = c % g.N, cj = (c - ci) / g.N;
            for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= g.N || j >= g.M) continue; const t = j * g.N + i; if (!g.a[t]) continue; const nd = dd + (di && dj ? dg : di ? cx : cy); if (nd < d[t]) { d[t] = nd; heap.push([nd, t]); } }
          }
          return d;
        };
        let info = null;
        v.render(() => {
          const g = G[reg.value], f = IN[reg.value];
          const [i0, j0] = g.ij(h0.x, h0.y), s = j0 * g.N + i0, key = reg.value + ',' + s;
          if (cache.key !== key) cache = { key, dist: g.a[s] ? bfs(g, s) : null };
          const dist = cache.dist, L = len.value;
          S.raster((x, y) => {
            if (!f(x, y)) return null;
            const [i, j] = g.ij(x, y), dd = dist ? dist[j * g.N + i] : Infinity;
            return dd <= L ? [...v.rgb('green').slice(0, 3), 0.55] : [...v.rgb('blue').slice(0, 3), 0.22];
          }, { key: key + ',' + L.toFixed(2), res: 3 });
          if (!dist) { info = { none: true }; return; }
          // reached count, frontier point, ball around it
          let reached = 0, tot = 0, front = null, fd = -1; const lab = LB[reg.value].lab[s];
          for (let t = 0; t < dist.length; t++) { if (g.a[t] && LB[reg.value].lab[t] === lab) { tot++; if (dist[t] <= L) { reached++; if (dist[t] > fd) { fd = dist[t]; front = t; } } } }
          if (front !== null && L > 0.3) {
            const fi = front % g.N, fj = (front - fi) / g.N, fx = g.cx(fi), fy = g.cy(fj);
            // radius of the largest ball around the point inside the region and inside the reachable set (use a point slightly behind the front)
            let r = 0; for (let k = 1; k < 80; k++) { const rr = k * 0.025; let ok = true; for (let a = 0; a < 48 && ok; a++) { const px = fx + rr * Math.cos((TAU * a) / 48), py = fy + rr * Math.sin((TAU * a) / 48); if (!f(px, py)) ok = false; } if (!ok) break; r = rr; }
            if (r > 0.04) S.circle(fx, fy, r, { color: 'gold', width: 2, fill: 'gold', fillAlpha: 0.2 });
            S.dot(fx, fy, { r: 4, color: 'gold' });
          }
          info = { reached, tot, frac: reached / tot, comps: LB[reg.value].k, full: reached === tot };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.none) return 'Move $x_0$ inside the region.';
          return `Reached by polygonal paths of length $\\le${v.fix(len.value, 1)}$: **${(100 * info.frac).toFixed(0)}%** of the component of $x_0$ ($U$ has ${info.comps} component${info.comps > 1 ? 's' : ''}). ${info.full ? `The reached set is the whole component: open (the gold balls) and closed in it, hence everything. ${info.comps > 1 ? 'The other blob is untouched — a different component, never reachable.' : ''}` : 'Every ball around a reached point lies in the reached set (that is why the front keeps moving) — the process can only stop when the reached set is everything.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Proposition',
      name: 'The comb space',
      statement: String.raw`Let $C=([0,1]\times\{0\})\cup(\{0\}\times[0,1])\cup\bigcup_{n\ge1}(\{1/n\}\times[0,1])\subset\R^2$ (a base, the teeth at $x=1/n$, and the limit tooth at $x=0$). Then $C$ is path-connected, hence connected, but **not locally connected** at any point $(0,y)$ with $0<y\le1$ of the limit tooth.`,
      idea: String.raw`Any point is joined to $(0,0)$ by going straight down its tooth and then left along the base: two segments, so $C$ is path-connected (3.8 gives connected). At $p=(0,y)$ with $y>0$ take the ball of radius $\varepsilon<y$: it misses the base, and meets every tooth $x=1/n$ with $1/n<\varepsilon$ in a segment not joined to the others inside the ball. Any connected neighbourhood of $p$ inside the ball would then have to sit in the limit tooth alone, which is not a neighbourhood of $p$.`,
      caption: String.raw`Left: drag the point $q$ onto any tooth; the gold walker (slide $\tau$) goes down to the base and along it to the origin — a continuous path. Right: the zoom into the limit tooth. Slide $\varepsilon$ and the height of $p$: all teeth with $n>1/\varepsilon$ cut the ball in separate slivers, infinitely many of them, for every radius.`,
      deps: ['top-3.11'],
      refs: ['Munkres §25'],
      tags: ['connectedness', 'counterexample'],
      viz(v) {
        const tau = v.slider('walker position $\\tau$', 0, 1, 0.35, { step: 0.005 });
        const ep = v.slider('radius $\\varepsilon$', 0.01, 0.4, 0.12, { step: 0.005, log: true });
        const yp = v.slider('height of $p$', 0.3, 1, 0.65, { step: 0.01 });
        const A = v.stage({ x: [-0.15, 1.15], y: [-0.15, 1.15], equal: true, axes: false, height: 330, title: 'the comb: a path from $q$ to the origin' });
        const B = v.stage({ x: [-0.05, 0.05], y: [0, 1], equal: true, axes: false, height: 330, title: 'zoom at $p=(0,y)$ on the limit tooth' });
        const T = combTeeth(80);
        const hq = A.handle(0.25, 0.7, { color: 'orange', label: 'q', r: 7, constrain: (x, y) => {
          let best = [clamp(x, 0, 1), 0], bd = Math.hypot(x - best[0], y);
          for (const tx of T) { const q = [tx, clamp(y, 0, 1)], d = Math.hypot(x - q[0], y - q[1]); if (d < bd) { bd = d; best = q; } }
          return best;
        } });
        let info = null;
        v.render(() => {
          for (const tx of T.slice(0, 41)) A.line(tx, 0, tx, 1, { color: 'faint', width: tx === 0 ? 2.5 : 1.2 });
          A.line(0, 0, 1, 0, { color: 'faint', width: 3 });
          A.dot(0, 0, { r: 4, color: 'muted', label: '(0,0)', labelPos: 'sw' });
          // path from (0,0) to q: along the base, then up the tooth
          const qx = hq.x, qy = hq.y, L1 = qx, L2 = qy, tot = L1 + L2 || 1, s = tau.value * tot;
          A.path([[0, 0], [qx, 0], [qx, qy]], { color: 'orange', width: 3 });
          const w = s <= L1 ? [s, 0] : [qx, s - L1];
          A.dot(w[0], w[1], { r: 6, color: 'gold' });
          // zoom
          const e = ep.value, y0 = yp.value;
          B.setView([-e * 1.25, e * 1.25], [y0 - e * 1.25, y0 + e * 1.25]);
          B.line(0, y0 - e * 1.25, 0, y0 + e * 1.25, { color: 'green', width: 3 });
          let cnt = 0;
          for (let n = 1; n <= 4000; n++) {
            const x = 1 / n; if (x >= e) continue; cnt++;
            const h = Math.sqrt(e * e - x * x); const col = cnt % 2 ? 'blue' : 'orange';
            if (x > e * 0.02 || cnt < 3) B.line(x, y0 - h, x, y0 + h, { color: col, width: 2.2, cap: 'butt' }); else B.line(x, y0 - h, x, y0 + h, { color: col, width: 1, alpha: 0.5 });
            B.line(x, y0 + h, x, Math.min(1, y0 + e * 1.25), { color: 'faint', width: 0.8 });
            B.line(x, Math.max(0, y0 - e * 1.25), x, y0 - h, { color: 'faint', width: 0.8 });
          }
          B.circle(0, y0, e, { color: 'ink', width: 1.4, dash: [4, 3] });
          B.dot(0, y0, { r: 5, color: 'gold' });
          info = { len: L1 + L2, n0: Math.floor(1 / e) + 1, y0, e, near: e < y0 };
        });
        v.readout(() => {
          if (!info) return '';
          return `Path from $(0,0)$ to $q$: along the base ($${v.fix(hq.x, 2)}$) then up the tooth ($${v.fix(hq.y, 2)}$), total length $${v.fix(info.len, 2)}$ — so $C$ is path-connected.\nBall of radius $\\varepsilon=${v.fix(info.e, 3)}$ about $p=(0,${v.fix(info.y0, 2)})$: ${info.near ? `it misses the base, and meets the teeth $n=${info.n0},${info.n0 + 1},\\dots$ — **infinitely many** separate slivers — so $p$ has no connected neighbourhood inside it.` : 'it reaches the base, which would join the slivers; shrink $\\varepsilon$ below the height of $p$ and the base drops out.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Cut points tell ℝ from ℝ² and the circle from an interval',
      statement: String.raw`Removing a point from $\R$ leaves a disconnected space, while $\R^2\setminus\{q\}$ is connected for every $q$; hence $\R$ and $\R^2$ are **not homeomorphic**. Likewise $S^1\setminus\{q\}\cong\R$ is connected for every $q$, while $[0,1]\setminus\{t\}$ is disconnected for every $0<t<1$; hence $S^1$ and $[0,1]$ are not homeomorphic.`,
      idea: String.raw`A homeomorphism $h\colon X\to Y$ restricts to a homeomorphism $X\setminus\{x\}\to Y\setminus\{h(x)\}$ for every $x$, and homeomorphic spaces are connected together or not at all (3.3). So the existence of a *cut point* — one whose removal disconnects — is a topological invariant, and counting the components left after removing $k$ points is a finer one. $\R^2\setminus\{q\}$ is connected: it is path-connected, since two points are joined by a segment unless $q$ lies between them, and then by a small detour.`,
      caption: String.raw`Four spaces; drag the removed point (or points: switch to two) in each and read the number of pieces left. The line and the interval fall apart (the interval only if the point is interior — try its endpoint), while the plane and the circle stay in one piece. With two points removed the counts become $3,\,1,\,2,\,3$ and the contrasts persist.`,
      deps: ['top-3.3', 'top-2.3'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'invariants'],
      viz(v) {
        const kk = v.select('points removed', [{ value: 1, label: 'one' }, { value: 2, label: 'two' }], 1);
        const S = v.stage({ x: [0, 12], y: [0, 4.2], equal: true, axes: false, height: 330 });
        const cell = [0, 3, 6, 9], mid = (i) => cell[i] + 1.5;
        const names = ['$\\R$', '$\\R^2$', '$S^1$', '$[0,1]$'];
        // handles: line (x along [0.2, 2.8]), plane (free in square), circle (angle), interval (x along [3+..])
        const lineX = (x) => clamp(x, 0.25, 2.75), intX = (x) => clamp(x, cell[3] + 0.25, cell[3] + 2.75);
        const mk = (i, x, y, con, c) => S.handle(x, y, { color: c, r: 6.5, constrain: con });
        const circ = (i) => (x, y) => { const dx = x - mid(i), dy = y - 2, r = Math.hypot(dx, dy) || 1; return [mid(i) + (dx * 1.05) / r, 2 + (dy * 1.05) / r]; };
        const H = [
          [mk(0, 1.0, 2, (x) => [lineX(x), 2], 'gold'), mk(0, 2.0, 2, (x) => [lineX(x), 2], 'pink')],
          [mk(1, 4.0, 2.4, (x, y) => [clamp(x, 3.2, 5.8), clamp(y, 0.4, 3.6)], 'gold'), mk(1, 5.0, 1.4, (x, y) => [clamp(x, 3.2, 5.8), clamp(y, 0.4, 3.6)], 'pink')],
          [mk(2, mid(2) + 1.05, 2, circ(2), 'gold'), mk(2, mid(2) - 1.05 * 0.7, 2 + 1.05 * 0.7, circ(2), 'pink')],
          [mk(3, cell[3] + 0.25, 2, (x) => [intX(x), 2], 'gold'), mk(3, cell[3] + 1.9, 2, (x) => [intX(x), 2], 'pink')],
        ];
        let info = null;
        v.render(() => {
          const k = +kk.value, cnt = [];
          H.forEach((pair, i) => { pair[1].visible = k === 2; pair[0].visible = true; });
          // ℝ: segment with arrow ends
          { const xs = H[0].slice(0, k).map((h) => h.x).sort((a, b) => a - b), uniq = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-6), cuts = [0.25, ...uniq, 2.75];
            for (let j = 0; j + 1 < cuts.length; j++) S.line(cuts[j] + (j ? 0.06 : 0), 2, cuts[j + 1] - (j + 2 < cuts.length ? 0.06 : 0), 2, { color: CYC[j], width: 6, cap: 'butt' });
            S.arrow(2.6, 2, 2.9, 2, { color: CYC[cuts.length - 2] }); S.arrow(0.4, 2, 0.1, 2, { color: CYC[0] });
            uniq.forEach((x) => S.dot(x, 2, { r: 5, hollow: true, color: 'ink' })); cnt.push(uniq.length + 1); }
          // plane: filled square with hollow dots
          { S.rect(3.1, 0.3, 5.9, 3.7, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 1.5 });
            H[1].slice(0, k).forEach((h) => S.dot(h.x, h.y, { r: 5, hollow: true, color: 'ink' })); cnt.push(1); }
          // circle: arcs between removed angles
          { const th = H[2].slice(0, k).map((h) => Math.atan2(h.y - 2, h.x - mid(2))), a = th.map((t) => ((t % TAU) + TAU) % TAU).sort((x, y) => x - y).filter((x, i, arr) => i === 0 || x - arr[i - 1] > 1e-3);
            for (let j = 0; j < a.length; j++) { const t0 = a[j] + 0.06, t1 = (j + 1 < a.length ? a[j + 1] : a[0] + TAU) - 0.06; if (t1 <= t0) continue; const pts = []; for (let m = 0; m <= 40; m++) { const t = t0 + ((t1 - t0) * m) / 40; pts.push([mid(2) + 1.05 * Math.cos(t), 2 + 1.05 * Math.sin(t)]); } S.path(pts, { color: CYC[j], width: 6 }); }
            a.forEach((t) => S.dot(mid(2) + 1.05 * Math.cos(t), 2 + 1.05 * Math.sin(t), { r: 5, hollow: true, color: 'ink' })); cnt.push(Math.max(1, a.length)); }
          // interval
          { const lo = cell[3] + 0.25, hi = cell[3] + 2.75, xs = H[3].slice(0, k).map((h) => h.x).sort((a, b) => a - b).filter((x, i, arr) => i === 0 || x - arr[i - 1] > 1e-6), interior = xs.filter((x) => x > lo + 0.02 && x < hi - 0.02), ends = xs.filter((x) => x <= lo + 0.02 || x >= hi - 0.02);
            const cuts = [lo, ...interior, hi];
            for (let j = 0; j + 1 < cuts.length; j++) S.line(cuts[j] + (j || ends.includes(lo) ? 0.05 : 0), 2, cuts[j + 1] - (j + 2 < cuts.length || ends.some((e) => e >= hi - 0.02) ? 0.05 : 0), 2, { color: CYC[j], width: 6, cap: 'butt' });
            S.dot(lo, 2, { r: 4, color: 'ink' }); S.dot(hi, 2, { r: 4, color: 'ink' });
            xs.forEach((x) => S.dot(x, 2, { r: 6, hollow: true, color: 'ink' })); cnt.push(interior.length + 1); }
          for (let i = 0; i < 4; i++) S.text(names[i], mid(i), 3.95, { align: 'center', size: 14, color: 'ink' });
          info = { cnt, k };
        });
        v.readout(() => {
          if (!info) return '';
          const [a, b, c, d] = info.cnt;
          return `Pieces left: $\\R$: **${a}**, $\\R^2$: **${b}**, $S^1$: **${c}**, $[0,1]$: **${d}**.\n${a !== b ? `$\\R\\setminus\\{\\dots\\}$ has ${a} pieces but $\\R^2\\setminus\\{\\dots\\}$ has ${b}: a homeomorphism $\\R\\to\\R^2$ would restrict to a homeomorphism of the punctured spaces, so none exists. ` : ''}${c !== d ? `$S^1$ and $[0,1]$ lose ${c} and ${d} pieces: not homeomorphic. ` : 'Move the interval’s removed point to the interior: it separates, no point of the circle does.'}`;
        });
      },
    },
  ],
};
