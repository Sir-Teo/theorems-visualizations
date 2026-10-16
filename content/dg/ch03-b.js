// Differential Geometry of Curves & Surfaces — Chapter 3 (part b): 3.7–3.12
import {
  TAU, clamp, add, sub, mul, dot, cross, len, unit, mkCurve, derivs, trigInterp, CURVES, scene, plot, plane, bbox, sphereWire, drawTrack,
  hueAlong, fourier2, ringPts, numEval, sampleClosed, crossings, periodicExtrema, SHAPES, widthDir, reuleaux, widthCurve, rotPts, polyLen, polyArea,
} from './ch03.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Four-vertex theorem',
      statement: String.raw`A simple closed plane curve of class $C^\infty$ with non-constant curvature has at least four vertices: its curvature has at least two local maxima and at least two local minima (so at least four points where $\kappa_s'=0$ are extreme points of $\kappa_s$). The hypothesis that the curve is simple cannot be dropped: a limaçon with an inner loop is a closed curve with only two vertices (one maximum and one minimum of the curvature).`,
      idea: String.raw`Suppose a convex curve had only two extreme points $P$ (maximum) and $Q$ (minimum) of $\kappa_s$. Then $\kappa_s'$ has one sign on each of the two arcs between them. Let $\ell(x)=a\cdot x+b$ be the affine function that vanishes on the line through $P$ and $Q$; since the curve is convex, $\ell(\alpha(s))$ changes sign exactly at $P$ and $Q$, so $\kappa_s'\,\ell(\alpha)$ has one sign and $\int\kappa_s'\,\ell(\alpha)\,ds\ne0$. But integrating by parts, $\int\kappa_s'\,\ell(\alpha)\,ds=-a\cdot\int\kappa_s\,T\,ds=a\cdot\int N'\,ds=0$ by the Frenet equation $N'=-\kappa_sT$ and periodicity (dg-1.4, dg-3.6): contradiction. This is Mukhopadhyaya's convex case; Kneser's extension to every simple closed curve needs a different (projective) argument, and the limaçon shows that simplicity enters.`,
      caption: String.raw`Choose *curve through points* and drag the nine orange points to mould a simple closed curve (or use a preset), and watch the curvature plot underneath: red dots mark local maxima and blue dots local minima, copied onto the curve together with the dashed osculating circle at each vertex (circles too large for the window are left out; the toggle hides them). Try to build a curve with fewer than two of each. Then switch to the **limaçon** $r=b+\cos\theta$ and slide $b$: for $b<1$ it has an inner loop, crosses itself, and has only one maximum and one minimum; for $b>1$ it is simple and the four vertices return.`,
      deps: ['dg-3.6', 'dg-3.3'],
      refs: ['do Carmo §1-7', 'Pressley Ch. 3'],
      tags: ['vertices', 'curvature'],
      credit: 'S. Mukhopadhyaya, 1909 (convex curves); A. Kneser, 1912 (all simple closed curves)',
      scope: String.raw`Simple closed regular plane curves ($C^2$ suffices) with non-constant curvature; the converse (any prescribed curvature function with the right number of extrema comes from a simple curve) was settled much later.`,
      viz(v) {
        const N = 9;
        const sel = v.select('curve', [{ value: 'pts', label: 'curve through points' }, { value: 'lim', label: 'limaçon $r=b+\\cos\\theta$' }], 'pts');
        const presets = { egg: SHAPES.egg, bean: SHAPES.bean, ellipse: SHAPES.ellipse, rosette: SHAPES.rosette };
        const S = plane(v, { title: 'the curve, its vertices and osculating circles', height: 400, weight: 1.15 });
        const P = plot(v, { x: [0, 1], y: [-1, 1], xlabel: 'arc length $s/L$', ylabel: '$\\kappa_s$', title: 'signed curvature', height: 400, weight: 1 });
        const hs = ringPts(presets.egg.f, N).map((p) => S.handle(p[0], p[1], { color: 'orange', r: 7 }));
        const pre = v.select('preset', [{ value: 'egg', label: 'egg' }, { value: 'bean', label: 'bean' }, { value: 'ellipse', label: 'ellipse' }, { value: 'rosette', label: 'rosette' }], 'egg', {
          onChange: (val) => ringPts(presets[val].f, N).forEach((p, i) => hs[i].set(p[0], p[1])),
        });
        const showC = v.toggle('osculating circles', true);
        const bS = v.slider('limaçon parameter $b$', 0.15, 3, 0.55, { step: 0.005 });
        let info = {};
        v.render(() => {
          const lim = sel.value === 'lim';
          hs.forEach((h) => { h.visible = !lim; }); pre.el.hidden = lim; bS.el.hidden = !lim;
          let sm;
          if (lim) {
            const b = bS.value, r = (t) => [(b + Math.cos(t)) * Math.cos(t), (b + Math.cos(t)) * Math.sin(t)];
            const q = sampleClosed(numEval(r), 720), xs = q.P.map((p) => p[0]), ys = q.P.map((p) => p[1]);
            const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2, sf = 1.4 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 2;
            const base = numEval(r);
            sm = sampleClosed((t) => { const e = base(t); return { p: [(e.p[0] - cx) * sf, (e.p[1] - cy) * sf], d1: [e.d1[0] * sf, e.d1[1] * sf], d2: [e.d2[0] * sf, e.d2[1] * sf] }; }, 720);
          } else sm = sampleClosed(fourier2(hs.map((h) => [h.x, h.y])), 720);
          const m = sm.m, k = sm.kappa.slice(0, m), kmin = Math.min(...k), kmax = Math.max(...k);
          const ex = periodicExtrema(k, 2e-3 * (kmax - kmin) + 1e-6), X = crossings(sm.P.filter((_, i) => i % 2 === 0));
          S.path(sm.P, { close: true, color: 'accent', width: 3 });
          const vert = [...ex.max.map((j) => [j, 'red']), ...ex.min.map((j) => [j, 'blue'])];
          for (const [j, col] of vert) {
            const kk = sm.kappa[j], T = sm.T[j], p = sm.P[j];
            if (Math.abs(kk) > 0.25) { const R = 1 / Math.abs(kk), c = [p[0] - (T[1] * 1) / kk, p[1] + (T[0] * 1) / kk]; if (R < 1.8 && showC.value) S.clip(() => S.circle(c[0], c[1], R, { color: col, width: 1.6, alpha: 0.7, dash: [5, 4] })); }
          }
          for (const [j, col] of vert) S.dot(sm.P[j][0], sm.P[j][1], { color: col, r: 6.5 });
          for (const x of X) S.dot(x[0], x[1], { color: 'ink', r: 4.5, hollow: true });
          const pad = 0.12 * (kmax - kmin || 1);
          P.setView([0, 1], [Math.min(kmin, 0) - pad, kmax + pad]);
          P.hline(0, { color: 'muted', alpha: 0.5 });
          P.path(k.map((kk, j) => [sm.s[j] / sm.L, kk]).concat([[1, sm.kappa[m]]]), { color: 'ink', width: 2.6 });
          for (const [j, col] of vert) P.dot(sm.s[j] / sm.L, sm.kappa[j], { color: col, r: 6.5 });
          info = { nmax: ex.max.length, nmin: ex.min.length, cross: X.length, simple: X.length === 0, flat: ex.max.length === 0, rot: sm.rot };
        });
        v.legend([['red', 'curvature maximum'], ['blue', 'curvature minimum'], ['muted', 'osculating circle at a vertex', { dash: true }]]);
        v.readout(() => String.raw`local maxima of $\kappa_s$: $${info.nmax}$ · local minima: $${info.nmin}$ · self-intersections: $${info.cross}$ · rotation index $${v.fix(info.rot, 2)}$
${info.flat ? 'curvature is constant (a circle): no strict vertices, the theorem excludes this case' : info.simple ? (info.nmax >= 2 && info.nmin >= 2 ? '**simple curve ⇒ at least 2 maxima and 2 minima**, as the theorem says' : '**fewer than four vertices on a simple curve?** — this would contradict the theorem; check the sampling') : '**not simple**: the theorem does not apply, and fewer than four vertices is possible'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Cauchy–Crofton formula',
      statement: String.raw`Parametrize the straight lines of the plane by $\ell(p,\theta)=\{x:\ x\cdot(\cos\theta,\sin\theta)=p\}$ with $0\le\theta<\pi$ and $p\in\R$. For a piecewise-$C^1$ plane curve $\gamma$ of length $L$, let $n_\gamma(p,\theta)$ be the number of points of $\gamma\cap\ell(p,\theta)$. Then
$$\int_0^{\pi}\!\!\int_{-\infty}^{\infty} n_\gamma(p,\theta)\,dp\,d\theta \;=\; 2L .$$
Equivalently, if $\gamma$ lies in a disc of radius $R$ and a line is chosen with $\theta$ uniform in $[0,\pi)$ and $p$ uniform in $[-R,R]$, the expected number of crossings is $L/(\pi R)$; so $L=\pi R\,\mathbb E[n]$. The measure $dp\,d\theta$ is the one on lines that is invariant under rigid motions.`,
      idea: String.raw`Both sides are additive under cutting the curve into pieces, so it suffices to check short, nearly straight arcs. For a straight segment of length $\ell$ and a fixed direction $\theta$, the lines of that direction which meet it have $p$ filling an interval of length $\ell\,|\sin(\theta-\theta_0)|$ (the width of the segment seen from direction $\theta$); integrating over $\theta$ gives $\ell\int_0^\pi|\sin\phi|\,d\phi=2\ell$. A curve is a limit of polygons, and the length of the curve is the limit of the polygonal lengths (dg-1.2), which gives $2L$ in general. The picture is Buffon's needle in disguise: random lines instead of random needles.`,
      caption: String.raw`Random lines (uniform in $p$ and $\theta$) are thrown across the disc of radius $R$; the first few are drawn with their crossings with the curve in gold. The right panel shows the running estimate $\hat L_n=\pi R\cdot(\text{average number of crossings over the first } n\text{ lines})$ against the exact length of the curve (green), with a band of $\pm2$ standard errors. Drag the slider to throw more lines (it is logarithmic): the estimate settles at $L$ at the rate $1/\sqrt n$. **New lines** reseeds the random generator.`,
      deps: ['dg-1.2'],
      refs: ['do Carmo §1-7'],
      tags: ['integral geometry', 'length'],
      credit: 'M. W. Crofton, 1860s (the formula bears his name; the earlier Buffon-needle problem and Barbier’s 1860 solution lie behind it)',
      scope: String.raw`Rectifiable curves; lines are counted with multiplicity; the formula uses the rigid-motion-invariant measure $dp\,d\theta$ on the space of lines. The run here is a Monte Carlo experiment, not a proof.`,
      viz(v) {
        const R = 2.05, NMAX = 20000;
        const sel = v.select('curve', ['circle', 'ellipse', 'bean', 'figure8', 'rosette', 'limacon'].map((k) => ({ value: k, label: SHAPES[k].name })), 'bean');
        const nS = v.slider('number of lines $n$', 10, NMAX, 400, { log: true, int: true, sig: 3 });
        let seed = 11;
        v.button('new lines', () => { seed++; });
        const S = plane(v, { title: 'random lines and their crossings with the curve', height: 400, weight: 1.15 });
        const E = v.stage({ x: [10, NMAX], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 270, xlabel: 'number of lines $n$', ylabel: 'estimate of $L$', title: 'running estimate $\\pi R\\,\\bar n$' });
        let key = '', P = null, polyL = 0, lines = null, counts = null, cum = null, est = null;
        const build = () => {
          const f = fourier2(ringPts(SHAPES[sel.value].f, 9)), sm = sampleClosed(f, 600);
          P = sm.P; polyL = polyLen(P);
          const r = v.rng(seed), m = P.length, xs = Float64Array.from(P, (p) => p[0]), ys = Float64Array.from(P, (p) => p[1]);
          lines = []; counts = new Uint8Array(NMAX);
          cum = new Float64Array(NMAX + 1); const cum2 = new Float64Array(NMAX + 1);
          for (let i = 0; i < NMAX; i++) {
            const th = r.uniform(0, PI), p = r.uniform(-R, R), c = Math.cos(th), s = Math.sin(th);
            lines.push([th, p]);
            let n = 0, prev = xs[m - 1] * c + ys[m - 1] * s - p;
            for (let j = 0; j < m; j++) { const d = xs[j] * c + ys[j] * s - p; if ((d > 0) !== (prev > 0)) n++; prev = d; }
            counts[i] = n; cum[i + 1] = cum[i] + n; cum2[i + 1] = cum2[i] + n * n;
          }
          est = { cum, cum2 };
        };
        let info = {};
        v.render(() => {
          const k = `${sel.value}|${seed}`;
          if (k !== key) { key = k; build(); E.setView([10, NMAX], [polyL * 0.45, polyL * 1.55]); }
          const n = Math.round(nS.value);
          S.circle(0, 0, R, { color: 'faint', width: 1.2, dash: [3, 5] });
          S.path(P, { close: true, color: 'accent', width: 3.4 });
          for (let i = 0; i < Math.min(n, 40); i++) {
            const [th, p] = lines[i], c = Math.cos(th), s = Math.sin(th);
            S.clip(() => S.segment([p * c + 6 * s, p * s - 6 * c], [p * c - 6 * s, p * s + 6 * c], { color: 'muted', width: 1, alpha: 0.55 }));
            for (let j = 0; j < P.length; j++) {
              const a = P[j], b = P[(j + 1) % P.length], da = a[0] * c + a[1] * s - p, db = b[0] * c + b[1] * s - p;
              if ((da > 0) !== (db > 0)) { const w = da / (da - db); S.dot(a[0] + w * (b[0] - a[0]), a[1] + w * (b[1] - a[1]), { color: 'gold', r: 3.6 }); }
            }
          }
          const lo = [], mid = [], hi = [];
          for (let i = 0; i <= 160; i++) {
            const nn = Math.max(2, Math.round(10 * Math.pow(NMAX / 10, i / 160)));
            if (nn > n) break;
            const mean = est.cum[nn] / nn, varr = Math.max(0, est.cum2[nn] / nn - mean * mean), se = (PI * R * Math.sqrt(varr / nn));
            mid.push([nn, PI * R * mean]); lo.push([nn, PI * R * mean - 2 * se]); hi.push([nn, PI * R * mean + 2 * se]);
          }
          E.hline(polyL, { color: 'green', width: 2 });
          if (mid.length > 1) {
            E.path(lo, { color: 'orange', alpha: 0.6, width: 1.2 }); E.path(hi, { color: 'orange', alpha: 0.6, width: 1.2 });
            E.path(mid, { color: 'accent', width: 2.6 });
          }
          const mean = est.cum[n] / n, varr = Math.max(0, est.cum2[n] / n - mean * mean), se = PI * R * Math.sqrt(varr / n);
          E.dot(n, PI * R * mean, { color: 'gold', r: 6 });
          info = { n, mean, est: PI * R * mean, se };
        });
        v.legend([['accent', 'running estimate'], ['orange', '$\\pm 2$ standard errors'], ['green', 'length of the curve'], ['gold', 'a crossing']]);
        v.readout(() => String.raw`$n=${info.n}$ random lines · average number of crossings $\bar n = ${v.fix(info.mean, 4)}$ · estimate $\pi R\,\bar n = ${v.fix(info.est, 3)}$ ($\pm ${v.fix(2 * info.se, 3)}$) · length of the curve $L=${v.fix(polyL, 3)}$ · error ${v.fix((100 * Math.abs(info.est - polyL)) / polyL, 2)}%
$R=${R}$ is the radius of the disc the lines are drawn across; $\int\!\!\int n\,dp\,d\theta=2L$ predicts $\bar n=L/(\pi R)=${v.fix(polyL / (PI * R), 4)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Curves of constant width',
      statement: String.raw`The **width** of a bounded convex set $K\subset\R^2$ in direction $u$ (a unit vector) is the distance between the two parallel support lines orthogonal to $u$, $w_K(u)=h_K(u)+h_K(-u)$, where $h_K(u)=\max_{x\in K}x\cdot u$ is the support function. The boundary of $K$ is a **curve of constant width** $w$ if $w_K(u)=w$ for every $u$: $K$ fits exactly between any two parallel lines that bound it, whichever direction they take, so it can be rotated freely between two parallel rails a distance $w$ apart while always touching both. The disc is the obvious example; the **Reuleaux triangle** (three circular arcs of radius $w$, each centred at the opposite vertex of an equilateral triangle of side $w$) and its odd-sided analogues, and also many smooth curves, are others.`,
      idea: String.raw`In terms of the support function, constant width means $h(\theta)+h(\theta+\pi)=w$ for all $\theta$: the even part of $h$ is the constant $w/2$ and only odd harmonics $\cos k\theta$, $\sin k\theta$ ($k$ odd) may be added. The boundary has radius of curvature $\rho=h+h''$, which therefore satisfies $\rho(\theta)+\rho(\theta+\pi)=w$ (the two points with parallel tangents are the two centres of curvature of one another): for the Reuleaux triangle $\rho$ jumps between $0$ at the vertices and $w$ along the arcs. Convexity needs $\rho\ge0$, which bounds the odd harmonics; the Reuleaux triangle sits exactly on this boundary.`,
      caption: String.raw`The shape rotates about its own centre between two horizontal rails a fixed distance apart (drag $\varphi$ or press play); it is translated vertically so that it always touches the lower rail, and the two contact points are marked. For a curve of constant width the upper contact never leaves the upper rail, the right-hand plot of the width against the rotation angle is a horizontal line, and the centre only bobs up and down (grey). Switch to the **ellipse**, which is not of constant width: it pushes through the upper rail. For **smooth**, slide $r_3, r_5$ to add odd harmonics to the circle until the radius of curvature touches $0$ (the sliders are rescaled when it would go negative).`,
      deps: ['dg-3.6'],
      refs: ['do Carmo §1-7'],
      tags: ['constant width', 'convex curves'],
      credit: 'Euler studied such curves through his “triangular curves” (18th century); the Reuleaux triangle is named after Franz Reuleaux (19th century)',
      viz(v) {
        const W = 2;
        const sel = v.select('shape', [{ value: 'r3', label: 'Reuleaux triangle' }, { value: 'r5', label: 'Reuleaux pentagon' }, { value: 'sm', label: 'smooth' }, { value: 'circle', label: 'circle' }, { value: 'ell', label: 'ellipse' }], 'r3');
        const r3S = v.slider('$r_3$', -1, 1, 0.8, { step: 0.01 }), r5S = v.slider('$r_5$', -1, 1, 0.3, { step: 0.01 });
        const phiS = v.slider('rotation $\\varphi$', 0, TAU, 0.5, { step: 0.001 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-0.45, 2.75], equal: true, axes: false, height: 340, weight: 1.1, minWidth: 290, title: 'shape between two rails' });
        const Pl = v.stage({ x: [0, TAU], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'rotation angle $\\varphi$', ylabel: 'height', title: 'width and height of the centre', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']] });
        v.legend([['accent', 'width between the support lines'], ['muted', 'height of the centre above the lower rail']]);
        const PER = 12;
        let key = '', P = null, wid = null, cen = null, w0 = 0, wmin = 0, wmax = 0, cmin = 0, cmax = 0, cur = {};
        const shape = () => {
          const s = sel.value;
          if (s === 'r3') return reuleaux(3, W, 120).pts;
          if (s === 'r5') return reuleaux(5, W, 72).pts;
          if (s === 'circle') return Array.from({ length: 360 }, (_, i) => [Math.cos((TAU * i) / 360), Math.sin((TAU * i) / 360)]);
          if (s === 'ell') return Array.from({ length: 360 }, (_, i) => [1.3 * Math.cos((TAU * i) / 360), 0.75 * Math.sin((TAU * i) / 360)]);
          return widthCurve(W, r3S.value, r5S.value, 0, 720).pts;
        };
        v.animate((t) => {
          if (v.playing) phiS.set(((t / PER) * TAU) % TAU);
          r3S.el.hidden = r5S.el.hidden = sel.value !== 'sm';
          const k = `${sel.value}|${sel.value === 'sm' ? r3S.value + ',' + r5S.value : ''}`;
          if (k !== key) {
            key = k; P = shape(); w0 = widthDir(P, PI / 2);
            wid = []; cen = [];
            for (let i = 0; i <= 240; i++) {
              const ph = (TAU * i) / 240, R = rotPts(P, ph), ys = R.map((p) => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
              wid.push([ph, hi - lo]); cen.push([ph, -lo]);
            }
            wmin = Math.min(...wid.map((p) => p[1])); wmax = Math.max(...wid.map((p) => p[1]));
            cmin = Math.min(...cen.map((p) => p[1])); cmax = Math.max(...cen.map((p) => p[1]));
          }
          const phi = phiS.value, R = rotPts(P, phi), ys = R.map((p) => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
          const Q = R.map((p) => [p[0], p[1] - lo]);
          S.hline(0, { color: 'ink', width: 3 }); S.hline(w0, { color: 'ink', width: 3 });
          S.path(Q, { close: true, color: 'accent', width: 3, fill: 'accent', fillAlpha: 0.12 });
          const iLo = ys.indexOf(lo), iHi = ys.indexOf(hi);
          S.dot(Q[iLo][0], 0, { color: 'gold', r: 6 }); S.dot(Q[iHi][0], hi - lo, { color: 'gold', r: 6 });
          S.dot(0, -lo, { color: 'ink', r: 3.5 });
          S.measure(-2.2, 0, -2.2, w0, `w = ${w0.toFixed(2)}`);
          if (hi - lo > w0 + 1e-3) S.corner('the shape pokes through the upper rail', 'tl', { color: 'red' });
          Pl.path(wid, { color: 'accent', width: 2.8 });
          Pl.path(cen, { color: 'muted', width: 2 });
          Pl.dot(phi, hi - lo, { color: 'gold', r: 6 }); Pl.dot(phi, -lo, { color: 'gold', r: 5, hollow: true });
          Pl.hline(w0, { color: 'green', alpha: 0.5, dash: true });
          cur = { w: hi - lo };
        }, { period: PER, still: 2.2 });
        v.readout(() => String.raw`width in the direction now between the rails: $${v.fix(cur.w, 4)}$ · over a full turn the width ranges from $${v.fix(wmin, 4)}$ to $${v.fix(wmax, 4)}$ → ${wmax - wmin < 2e-3 ? '**constant width**' : '**not of constant width**'} · the centre moves between heights $${v.fix(cmin, 3)}$ and $${v.fix(cmax, 3)}$`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Barbier’s theorem',
      statement: String.raw`Every curve of constant width $w$ has perimeter $\pi w$. More generally, the perimeter of any convex curve is $\int_0^{\pi}w(\varphi)\,d\varphi$, the integral of its width over the half-turn of directions; for constant width this is $\pi w$. In particular all curves of the same constant width have the same length as the circle of that width: the Reuleaux triangle of width $w$ has perimeter $\pi w$ but encloses area $\tfrac12(\pi-\sqrt3)\,w^2$, less than the disc's $\pi w^2/4$.`,
      idea: String.raw`The perimeter of a convex curve is the integral of its radius of curvature, $L=\int_0^{2\pi}\rho\,d\theta$, and for constant width $\rho(\theta)+\rho(\theta+\pi)=w$ (dg-3.9). Splitting $[0,2\pi]$ into two half-turns, $L=\int_0^\pi\bigl(\rho(\theta)+\rho(\theta+\pi)\bigr)\,d\theta=\pi w$. The same computation is the Cauchy–Crofton formula (dg-3.8) in disguise: a random line meets a convex curve in $0$ or $2$ points, and the lines meeting it are those between two parallel support lines, so $2L=\int_0^\pi 2\,w(\varphi)\,d\varphi$. For the Reuleaux triangle one can check it directly: three arcs of radius $w$ and angle $\pi/3$ have total length $\pi w$.`,
      caption: String.raw`Generate curves of constant width $w$: choose a family, set the width, and for **random smooth** press **new curve** to draw random odd-harmonic coefficients (the shape changes, the width does not). The left panel shows the curve with a rotating caliper (drag $\varphi$); the middle panel is the width against the direction; the bars record $L/w$ for the last curves generated, all at the green line $\pi$. The readout computes the perimeter independently (by summing chord lengths of the sampled curve) and also as $\int_0^\pi w\,d\varphi$. The **ellipse** has varying width: its perimeter is no longer $\pi$ times the width, but the integral formula still holds.`,
      deps: ['dg-3.9', 'dg-3.8'],
      refs: ['do Carmo §1-7'],
      tags: ['constant width', 'perimeter'],
      credit: 'J.-É. Barbier, 1860',
      viz(v) {
        const fam = v.select('family', [{ value: 'rand', label: 'random smooth' }, { value: 'r3', label: 'Reuleaux 3' }, { value: 'r5', label: 'Reuleaux 5' }, { value: 'r7', label: 'Reuleaux 7' }, { value: 'ell', label: 'ellipse' }], 'rand');
        const wS = v.slider('width $w$', 0.6, 2.4, 1.6, { step: 0.01 });
        const phiS = v.slider('caliper direction $\\varphi$', 0, PI, 0.6, { step: 0.001 });
        const rng = v.rng(77);
        const randR = () => [rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)];
        let coef = [0.8, 0.5, 0.3];
        const hist = [];
        const ratio = (c) => { const q = widthCurve(1, c[0], c[1], c[2], 720).pts; return polyLen(q); };
        for (let i = 0; i < 7; i++) { const c = randR(); hist.push(ratio(c)); }
        v.button('new curve', () => { coef = randR(); hist.push(ratio(coef)); if (hist.length > 12) hist.shift(); });
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.7, 1.7], equal: true, axes: false, height: 370, weight: 1.05, minWidth: 270, title: 'a curve of width $w$ and a caliper' });
        const Pl = v.stage({ x: [0, PI], y: [0, 3], axes: 'box', gutter: true, height: 370, weight: 0.8, minWidth: 220, xlabel: 'direction $\\varphi$', ylabel: 'width', title: 'width $w(\\varphi)$', xticks: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π']] });
        const Hb = v.stage({ x: [0.3, 12.7], y: [0, 3.8], axes: 'box', gutter: true, height: 370, weight: 0.8, minWidth: 220, xlabel: 'curve generated (latest at the right)', ylabel: '$L/w$', title: 'perimeter divided by width' });
        let info = {};
        v.render(() => {
          const w = wS.value, f = fam.value;
          let P;
          if (f === 'rand') P = widthCurve(w, coef[0], coef[1], coef[2], 720).pts;
          else if (f === 'ell') P = Array.from({ length: 720 }, (_, i) => [0.5 * w * 1.45 * Math.cos((TAU * i) / 720) * 1.0, 0.5 * w * 0.8 * Math.sin((TAU * i) / 720)]);
          else P = reuleaux(Number(f.slice(1)), w, Math.round(720 / Number(f.slice(1)))).pts;
          const L = polyLen(P), A = polyArea(P), phis = [], wd = [];
          let integ = 0, wlo = Infinity, whi = 0; const NN = 360;
          for (let i = 0; i <= NN; i++) { const ph = (PI * i) / NN, ww = widthDir(P, ph); phis.push(ph); wd.push(ww); if (i < NN) integ += ww * (PI / NN); wlo = Math.min(wlo, ww); whi = Math.max(whi, ww); }
          S.path(P, { close: true, color: 'accent', width: 3.2, fill: 'accent', fillAlpha: 0.12 });
          const ph = phiS.value, c = Math.cos(ph), s = Math.sin(ph);
          let hi = -Infinity, lo = Infinity;
          for (const p of P) { const d = p[0] * c + p[1] * s; hi = Math.max(hi, d); lo = Math.min(lo, d); }
          S.clip(() => { S.segment([hi * c - 5 * s, hi * s + 5 * c], [hi * c + 5 * s, hi * s - 5 * c], { color: 'orange', width: 2 }); S.segment([lo * c - 5 * s, lo * s + 5 * c], [lo * c + 5 * s, lo * s - 5 * c], { color: 'orange', width: 2 }); });
          S.arrow(lo * c, lo * s, hi * c, hi * s, { color: 'gold', width: 2.6, both: true });
          Pl.setView([0, PI], [0, Math.max(3, 1.25 * whi)]);
          Pl.path(phis.map((x, i) => [x, wd[i]]), { color: 'accent', width: 2.8 });
          Pl.dot(ph, hi - lo, { color: 'gold', r: 6 });
          const shown = hist.map((r) => r), mine = f === 'rand' ? shown : [L / w];
          Hb.bars(mine.map((x, i) => x), { x0: 1, dx: 1, color: 'accent' });
          Hb.hline(PI, { color: 'green', width: 2 });
          info = { w, L, A, integ, wlo, whi, f, n: mine.length };
        });
        v.readout(() => {
          const i = info, cw = i.whi - i.wlo < 2e-3, ampl = (PI * i.w * i.w) / 4, lb = ((PI - Math.sqrt(3)) / 2) * i.w * i.w;
          return String.raw`width between $${v.fix(i.wlo, 4)}$ and $${v.fix(i.whi, 4)}$ → ${cw ? '**constant width** $w=' + v.fix(i.w, 3) + '$' : '**not constant**'} · perimeter by summing chords: $L=${v.fix(i.L, 4)}$ · $\int_0^\pi w\,d\varphi=${v.fix(i.integ, 4)}$ ${cw ? '· $L/w=' + v.fix(i.L / i.w, 4) + '$ vs $\\pi=' + v.fix(PI, 4) + '$' : '· $L/w_{\\max}=' + v.fix(i.L / i.whi, 3) + '$, $L/w_{\\min}=' + v.fix(i.L / i.wlo, 3) + '$ bracket $\\pi$'}
area $A=${v.fix(i.A, 4)}$ ${cw ? '(between the Reuleaux triangle’s ' + v.fix(lb, 3) + ' and the disc’s ' + v.fix(ampl, 3) + ' for this width)' : ''}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Fenchel’s theorem',
      statement: String.raw`The total curvature of any closed regular space curve satisfies
$$\int_0^L\kappa(s)\,ds \;\ge\; 2\pi ,$$
with equality if and only if the curve is a convex plane curve. Equivalently, the tangent indicatrix $T:[0,L]\to S^2$ of a closed curve is a closed curve of length at least $2\pi$ on the unit sphere.`,
      idea: String.raw`Because the curve is closed, $\int_0^L T\,ds=\alpha(L)-\alpha(0)=0$. Hence for every unit vector $u$ the function $T\cdot u$ has integral $0$: it cannot be strictly positive everywhere, so the tangent indicatrix is **not contained in any open hemisphere**. A closed curve on $S^2$ that is not contained in an open hemisphere has length at least $2\pi$ (a closed curve shorter than $2\pi$ always fits inside some open hemisphere), and its length is the total curvature (dg-2.13, since $|T'|=\kappa$). Equality forces the indicatrix to be a great circle traversed once, i.e. a plane curve whose tangent turns monotonically once around: a convex curve (dg-3.6).`,
      caption: String.raw`Drag the seven orange points to deform a closed space curve (left); its tangent indicatrix (right) is drawn on the unit sphere in matching colours. The slider squashes the curve onto the $xy$-plane. Choose a direction $u$ with the longitude and latitude sliders: the plane through the origin orthogonal to $u$ cuts the sphere in a great circle, and the part of the indicatrix on the side $T\cdot u>0$ is drawn gold, on the other side blue — both always occur, and $\int T\cdot u\,ds=0$. The readout compares the total curvature (length of the indicatrix) with $2\pi$, and reports the best open hemisphere found, by search over 300 directions: $\max_u\min T\cdot u$ is never positive.`,
      deps: ['dg-2.13', 'dg-3.1'],
      refs: ['do Carmo Ch. 5'],
      tags: ['total curvature', 'tangent indicatrix'],
      credit: 'W. Fenchel, 1929',
      scope: String.raw`Closed curves of class $C^2$ in $\R^3$ with $\alpha'\ne0$ (also in $\R^n$, and for polygons with the exterior angles in place of curvature).`,
      viz(v) {
        const N = 7, tref = (j) => (TAU * j) / N;
        const presets = {
          trefoil: Array.from({ length: N }, (_, j) => CURVES.trefoil.r(tref(j))),
          wavy: Array.from({ length: N }, (_, j) => [1.3 * Math.cos(tref(j)), 1.3 * Math.sin(tref(j)), 0.55 * Math.sin(3 * tref(j))]),
          ellipse: Array.from({ length: N }, (_, j) => [1.5 * Math.cos(tref(j)), 0.8 * Math.sin(tref(j)), 0.0]),
          saddle: Array.from({ length: N }, (_, j) => [1.5 * Math.cos(tref(j)), 0.9 * Math.sin(tref(j)), 0.6 * Math.sin(2 * tref(j))]),
        };
        const A = scene(v, { title: 'closed space curve (drag the orange points)', weight: 1.1, height: 380, minWidth: 280 });
        const Bs = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'tangent indicatrix on the unit sphere' });
        const scA = A.sc, scB = v.scene3(Bs, { yaw: -0.7, pitch: 0.5, axes: false, hint: false, lim: 1.2 });
        const hs = presets.trefoil.map((p) => scA.handle(p, { color: 'orange', r: 7, lim: 1.8 }));
        v.select('preset', [{ value: 'trefoil', label: 'trefoil knot' }, { value: 'wavy', label: 'wavy circle' }, { value: 'saddle', label: 'saddle ellipse' }, { value: 'ellipse', label: 'plane ellipse ($K=2\\pi$)' }], 'trefoil', {
          onChange: (val) => presets[val].forEach((p, i) => hs[i].set(p)),
        });
        const lamS = v.slider('squash $z$ by $\\lambda$', 0, 1.4, 1, { step: 0.005 });
        const lonS = v.slider('direction $u$: longitude', -180, 180, 40, { step: 1 });
        const latS = v.slider('direction $u$: latitude', -90, 90, 25, { step: 1 });
        // fixed set of 300 directions (Fibonacci sphere) for the hemisphere search
        const dirs = Array.from({ length: 300 }, (_, i) => { const z = 1 - (2 * (i + 0.5)) / 300, r = Math.sqrt(1 - z * z), a = i * 2.399963; return [r * Math.cos(a), r * Math.sin(a), z]; });
        let last = [scA.yaw, scA.pitch], info = {};
        v.render(() => {
          if (scA.yaw !== last[0] || scA.pitch !== last[1]) { scB.yaw = scA.yaw; scB.pitch = scA.pitch; }
          else if (scB.yaw !== last[0] || scB.pitch !== last[1]) { scA.yaw = scB.yaw; scA.pitch = scB.pitch; }
          last = [scA.yaw, scA.pitch];
          const lam = lamS.value, g0 = trigInterp(hs.map((h) => h.p)), g = (t) => { const p = g0(t); return [p[0], p[1], lam * p[2]]; };
          const m = 360, pts = [], Ts = [], dt = TAU / m;
          let K = 0, tl = 0;
          for (let i = 0; i <= m; i++) {
            const t = i * dt, [d1, d2] = derivs(g, t, 0.02), sp = len(d1), cr = len(cross(d1, d2));
            pts.push(g(t)); Ts.push(mul(d1, 1 / sp));
            if (i < m) K += (cr / (sp * sp * sp)) * sp * dt;
          }
          for (let i = 0; i < m; i++) tl += Math.acos(clamp(dot(Ts[i], Ts[i + 1]), -1, 1));
          const lon = (lonS.value * PI) / 180, lat = (latS.value * PI) / 180, u = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
          let tmin = Infinity, tmax = -Infinity, integ = 0;
          const d = Ts.map((T) => dot(T, u));
          for (let i = 0; i < m; i++) { tmin = Math.min(tmin, d[i]); tmax = Math.max(tmax, d[i]); }
          // ∫ T·u ds = u·(α(L) − α(0)): computed with the speeds
          for (let i = 0; i < m; i++) { const t = i * dt, sp = len(derivs(g, t, 0.02)[0]); integ += d[i] * sp * dt; }
          let best = -Infinity;
          for (const w of dirs) { let mn = Infinity; for (let i = 0; i < m; i += 3) mn = Math.min(mn, dot(Ts[i], w)); if (mn > best) best = mn; }
          const bb = bbox(pts);
          scA.begin();
          drawTrack(scA, pts, { width: 3.2 }, pts.slice(0, -1).map((_, i) => hueAlong(v, i / m)));
          for (let i = 0; i < hs.length; i++) scA.line(hs[i].p, hs[(i + 1) % hs.length].p, { color: 'faint', width: 0.8, alpha: 0.4 }, 1);
          scA.flush();
          scB.begin();
          sphereWire(scB, 1);
          scB.disc(...basis(u), 1, { fill: 'gold', fillAlpha: 0.06, color: 'gold', grid: false }, [0, 0, 0]);
          for (let i = 0; i < m; i++) scB.line(Ts[i], Ts[i + 1], { color: d[i] > 0 ? 'gold' : 'blue', width: 3.4 }, 1);
          scB.arrow([0, 0, 0], mul(u, 1.25), { color: 'gold', width: 2.4, head: 9 });
          scB.tex('u', mul(u, 1.4), { color: 'gold', size: 15 });
          scB.flush();
          info = { K, tl, tmin, tmax, integ, best, flat: Math.abs(lam) < 1e-9 };
        });
        v.readout(() => String.raw`total curvature $\int\kappa\,ds=${v.fix(info.K, 4)}$ $=${v.fix(info.K / TAU, 4)}\cdot2\pi$ · length of the indicatrix (sum of angles): $${v.fix(info.tl, 4)}$ → ${info.K >= TAU - 1e-3 ? '$\\ge 2\\pi$ ✓' : 'below $2\\pi$?!'}
for this $u$: $\min T\cdot u=${v.fix(info.tmin, 3)}$, $\max T\cdot u=${v.fix(info.tmax, 3)}$ (both signs occur) · $\int T\cdot u\,ds=${v.fix(info.integ, 5)}$ · best open hemisphere over 300 directions: $\max_u\min_s T\cdot u=${v.fix(info.best, 3)}\le 0$`);
        function basis(u) {
          const a = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = unit(cross(u, a)), e2 = cross(u, e1);
          return [e1, e2];
        }
      },
    },

    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Fáry–Milnor theorem',
      statement: String.raw`If a closed regular space curve is knotted, i.e. not isotopic to a round circle, then its total curvature is strictly greater than $4\pi$:
$$\int_0^L \kappa\,ds \;>\; 4\pi .$$
Contrast Fenchel's bound $2\pi$ for every closed curve (dg-3.11): the threshold doubles as soon as the curve is tied in a knot. The converse is false: an unknotted curve can have arbitrarily large total curvature, so only the inequality for knots is claimed.`,
      idea: String.raw`Milnor's argument counts local maxima of height functions: for a unit vector $u$ let $\mu(u)$ be the number of local maxima of $x\mapsto x\cdot u$ along the curve. A Crofton-type averaging over $u\in S^2$ (compare dg-3.8, and $\kappa=|T'|$ as in dg-2.13) gives total curvature $=\tfrac12\int_{S^2}\mu(u)\,du$: a circle has $\mu=1$ in almost every direction and total curvature $2\pi$, which is Fenchel's bound (dg-3.11). Total curvature $4\pi$ corresponds to an average of $2$ maxima. A knotted curve cannot have at most two maxima in almost every direction, since such a curve could be untied, so on a set of directions of positive measure the height function has at least three maxima, and the average exceeds $2$. Fáry gave an independent proof; later proofs use quadrisecants of the knot. (This paragraph is a sketch of the argument, written from the standard accounts.)`,
      caption: String.raw`The curve is the $(2,3)$ torus knot $\bigl((1.3+0.3\cos3\theta)\cos2\theta,\ (1.3+0.3\cos3\theta)\sin2\theta,\ \varepsilon\sin3\theta\bigr)$ (a trefoil for every $\varepsilon>0$: at each of the three crossings of its shadow the two strands differ in height by $2\varepsilon$), or the unknot $(1.3\cos\theta,1.3\sin\theta,\varepsilon\sin2\theta)$. Slide $\varepsilon$: the plot on the right records the total curvature in units of $\pi$ along each family. The trefoil family always stays above the green line $4\pi$ — it tends to it as $\varepsilon\to0$, where the shadow is a curve with $\kappa>0$ that winds twice — while the unknot family tends to $2\pi$. An unknot can have arbitrarily large total curvature (wrinkle a circle as much as you like), so the bound only works in one direction; in the window shown this unknot family stays below $4\pi$.`,
      deps: ['dg-3.11', 'top-11.14'],
      verify: true,
      refs: ['do Carmo Ch. 5'],
      tags: ['knots', 'total curvature'],
      credit: 'I. Fáry (1949) and J. Milnor (1950), independently',
      scope: String.raw`Closed curves of class $C^2$ (and, with total curvature defined by polygons, rectifiable ones). The curve here is a specific family, a worked example and not a proof.`,
      viz(v) {
        const kn = v.select('curve', [{ value: 'tre', label: 'trefoil knot' }, { value: 'unk', label: 'unknot' }], 'tre');
        const eS = v.slider('height $\\varepsilon$', 0.02, 1.6, 0.6, { step: 0.005 });
        const mk = (kind, e) => kind === 'tre'
          ? mkCurve((t) => { const R = 1.3 + 0.3 * Math.cos(3 * t); return [R * Math.cos(2 * t), R * Math.sin(2 * t), e * Math.sin(3 * t)]; }, 0, TAU, { closed: true })
          : mkCurve((t) => [1.3 * Math.cos(t), 1.3 * Math.sin(t), e * Math.sin(2 * t)], 0, TAU, { closed: true });
        const totK = (c, n = 360) => { let K = 0; const dt = TAU / n; for (let i = 0; i < n; i++) { const f = c.at(i * dt); K += f.kappa * f.sp * dt; } return K; };
        const { S, sc } = scene(v, { title: 'the closed curve (drag the background to rotate)', height: 400, weight: 1.1, minWidth: 290, lim: 2.2, axis: 1.8, yaw: 0.35, pitch: 0.85 });
        const P = v.stage({ x: [0, 1.6], y: [0, 8], axes: 'box', gutter: true, height: 400, weight: 0.95, minWidth: 270, xlabel: 'height $\\varepsilon$', ylabel: 'total curvature $/\\pi$', title: 'total curvature along each family' });
        v.legend([['pink', 'trefoil family'], ['teal', 'unknot family'], ['green', '$4\\pi$ (Fáry–Milnor)'], ['orange', '$2\\pi$ (Fenchel)']]);
        let tre = null, unk = null, info = {};
        v.render(() => {
          if (!tre) {
            const es = Array.from({ length: 81 }, (_, i) => 0.02 + (1.58 * i) / 80);
            tre = es.map((e) => [e, totK(mk('tre', e)) / PI]); unk = es.map((e) => [e, totK(mk('unk', e)) / PI]);
            P.setView([0, 1.6], [0, Math.max(6, Math.ceil(Math.max(...tre.map((p) => p[1]), ...unk.map((p) => p[1])) + 0.5))]);
          }
          const e = eS.value, c = mk(kn.value, e), tab = [];
          for (let i = 0; i <= 360; i++) tab.push(c.r((TAU * i) / 360));
          sc.begin();
          drawTrack(sc, tab, { width: 3.4 }, tab.slice(0, -1).map((_, i) => hueAlong(v, i / 360)));
          sc.flush();
          P.hline(4, { color: 'green', width: 2 }); P.hline(2, { color: 'orange', width: 2 });
          P.path(tre, { color: 'pink', width: 2.8 }); P.path(unk, { color: 'teal', width: 2.8 });
          const K = totK(c) / PI;
          P.dot(e, K, { color: 'gold', r: 7 });
          info = { K, e, kind: kn.value };
        });
        v.readout(() => String.raw`${info.kind === 'tre' ? '**trefoil**' : '**unknot**'} with $\varepsilon=${v.fix(info.e, 3)}$: total curvature $=${v.fix(info.K, 4)}\,\pi$ ${info.kind === 'tre' ? `$=4\\pi+${v.fix(info.K - 4, 4)}\\pi$ — above $4\\pi$, as the theorem demands` : info.K > 4 ? '— above $4\\pi$ although the curve is unknotted' : info.K >= 2 ? '— above Fenchel’s $2\\pi$' : ''}${info.kind === 'tre' ? '' : ''}
a trefoil with $\varepsilon\to0$ gets as close to $4\pi$ as we like along this family, but the theorem says it never reaches it`);
      },
    },
  ],
};
