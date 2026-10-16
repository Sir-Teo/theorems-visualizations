// Deep Learning Theory — Chapter 2: Universal approximation and expressivity (items 2.7–2.11; 2.1–2.6 in ch02.js)
import {
  clamp, sigm, rand, hashStr, memo, lstsq, makeNet, forward, makeTrainer, patternHash, firstDiffLayer, regionColors, rampLUT,
  tent, yarotsky, note, titler, mnus, tsci, tbig, binom, modulus,
} from './ch02.shared.js';

const CYC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'blue'];
/** Product of Zaslavsky counts, layer by layer: an upper bound on the linear regions of a ReLU net with input dimension d. */
function regionBound(d, widths) { let prod = 1, eff = d; for (const n of widths) { let s = 0; for (let j = 0; j <= Math.min(eff, n); j++) s += binom(n, j); prod *= s; eff = Math.min(eff, n); } return prod; }
/** Montúfar-style folding network on [0,1]²: each layer applies the tent map to both coordinates (4 ReLUs). */
function foldNet(k) {
  const net = makeNet([2, ...Array(k).fill(4), 1], { act: 'relu', seed: 1 });
  net.W[0] = Float64Array.from([1, 0, 1, 0, 0, 1, 0, 1]); net.b[0] = Float64Array.from([0, -0.5, 0, -0.5]);
  for (let l = 1; l < k; l++) { net.W[l] = Float64Array.from([2, -4, 0, 0, 2, -4, 0, 0, 0, 0, 2, -4, 0, 0, 2, -4]); net.b[l] = Float64Array.from([0, -0.5, 0, -0.5]); }
  net.W[k] = Float64Array.from([2, -4, 2, -4]); net.b[k] = Float64Array.from([0]);
  return net;
}
/** Distinct activation patterns on an N×N grid of a window. */
function countRegions(net, [x0, x1], [y0, y1], N) { const S = new Set(); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) S.add(patternHash(net, [x0 + ((x1 - x0) * (i + 0.5)) / N, y0 + ((y1 - y0) * (j + 0.5)) / N])); return S.size; }

export default {
  collection: 'deep',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Counting linear regions of ReLU networks',
      credit: 'Pascanu, Montúfar & Bengio, 2014; Montúfar, Pascanu, Cho & Bengio, 2014; Serra, Tjandraatmadja & Ramalingam, 2018',
      statement: String.raw`Let a ReLU network on $\R^d$ have hidden widths $n_1,\dots,n_L$. **Upper bound:** its number of linear regions is at most
$$\prod_{\ell=1}^{L}\ \sum_{j=0}^{d_\ell}\binom{n_\ell}{j},\qquad d_\ell=\min(d,n_1,\dots,n_{\ell-1}),$$
because within each region of the first $\ell-1$ layers the $n_\ell$ units of layer $\ell$ act as $n_\ell$ hyperplanes in a space of dimension at most $d_\ell$, which cut it into at most $\sum_{j\le d_\ell}\binom{n_\ell}j$ pieces (Zaslavsky). For one layer the bound $\sum_{j\le d}\binom nj$ is attained by hyperplanes in general position. **Lower bound:** depth can realise exponentially many regions — with $L$ layers of width $n\ge d$, folding constructions reach at least $\lfloor n/d\rfloor^{d(L-1)}\sum_{j\le d}\binom{n}{j}$ regions (Montúfar et al.), whereas one layer with the same $nL$ units has only $O((nL)^d)$. Networks with random (e.g. He-initialised) weights typically have far fewer regions than the maximum, on the order of $(\text{number of neurons})^d$ per unit volume (Hanin & Rolnick 2019).`,
      idea: String.raw`Induct over layers as in 1.6: inside a region of the first $\ell-1$ layers, layer $\ell$'s pre-activations are affine, so its units contribute hyperplanes there and Zaslavsky's count for an arrangement of $n$ hyperplanes in $\R^{k}$ bounds the subdivision; multiplying gives the product bound. The construction folds the input: a layer of tent maps (2.6) applied to each coordinate maps each of $2^d$ subcubes onto the whole cube, so every region the later layers create is replicated in every subcube; $k$ such layers on $[0,1]^2$ make $4^k$ squares with only $4k$ units. Random weights waste this potential because few of their folds line up.`,
      caption: String.raw`Left: the input plane cut into linear regions; each boundary is coloured by the layer whose unit switches there (layer 1 blue, 2 orange, 3 green, …), so you see layer 1's straight lines bent by later layers. **Random**: seeded He-initialised networks of the chosen width and depth. **Folding**: the construction with 4 units per layer, which produces $4^k$ squares. Right, on a log scale: regions counted on a grid against depth — measured (dots), the product upper bound (dashed) and the one-layer maximum with the same number of units (orange).`,
      deps: ['deep-1.6'],
      refs: ['Prince §4.5'],
      tags: ['linear regions', 'depth'],
      viz(v) {
        const modeS = v.select('weights', [{ value: 'rand', label: 'random (He init)' }, { value: 'fold', label: 'folding construction' }], 'rand');
        const wS = v.slider('width', 2, 10, 5, { int: true });
        const dS = v.slider('depth', 1, 5, 3, { int: true });
        let seed = 1; const nb = v.button('new random network', () => { seed++; });
        const sL = v.stage({ x: [-2, 2], y: [-2, 2], height: 350, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'linear regions, boundaries coloured by layer' });
        const sR = v.stage({ x: [0.6, 5.4], y: [1, 1e6], ylog: true, height: 350, axes: 'box', gutter: true, xlabel: 'depth (hidden layers)', title: 'number of linear regions' });
        const nets = memo(), sweep = memo(), cnt = memo();
        let info = null;
        v.render(() => {
          const fold = modeS.value === 'fold', W = fold ? 4 : wS.value, D = dS.value;
          wS.el.hidden = fold; nb.hidden = fold;
          const win = fold ? [[0, 1], [0, 1]] : [[-2, 2], [-2, 2]];
          sL.setView(win[0], win[1]);
          const key = [fold, W, D, seed].join('|');
          const net = nets(key, () => (fold ? foldNet(D) : makeNet([2, ...Array(D).fill(W), 1], { act: 'relu', seed: hashStr('lr|' + key), bias: 0.5 })));
          const cols = regionColors(v), lay = CYC.map((c) => v.rgb(c)), e = 2.4 / sL.scale, ey = 2.4 / Math.abs(sL.Y(0) - sL.Y(1));
          sL.raster((x, y) => {
            const l = firstDiffLayer(net, [x, y], [x + e, y]) || firstDiffLayer(net, [x, y], [x, y + ey]);
            if (l) { const c = lay[(l - 1) % lay.length]; return [c[0], c[1], c[2], 255]; }
            return cols[(patternHash(net, [x, y]) % 1000003) % cols.length];
          }, { res: 2, key });
          const bx = sL.bounds.x, by = sL.bounds.y;
          const n = cnt(key + bx + by, () => countRegions(net, bx, by, 300));
          // sweep over depth
          const sw = sweep([fold, W].join('|'), () => [1, 2, 3, 4, 5].map((L) => {
            if (fold) return [L, countRegions(foldNet(L), [0, 1], [0, 1], 260)];
            let s = 0; for (let r = 1; r <= 3; r++) s += countRegions(makeNet([2, ...Array(L).fill(W), 1], { act: 'relu', seed: hashStr('lrS|' + W + '|' + L + '|' + r), bias: 0.5 }), [-2, 2], [-2, 2], 170);
            return [L, s / 3];
          }));
          const bnd = [1, 2, 3, 4, 5].map((L) => [L, regionBound(2, Array(L).fill(W))]), one = [1, 2, 3, 4, 5].map((L) => [L, regionBound(2, [W * L])]);
          sR.path(bnd, { color: 'muted', width: 1.6, dash: [5, 4] });
          sR.path(one, { color: 'orange', width: 2 }); sR.dots(one, { r: 3, color: 'orange' });
          sR.path(sw, { color: 'accent', width: 2.4 }); sR.dots(sw, { r: 4, color: 'accent' });
          if (fold) { const ex = [1, 2, 3, 4, 5].map((L) => [L, 4 ** L]); sR.path(ex, { color: 'green', width: 1.4, dash: [2, 3] }); }
          sR.vline(D, { color: 'gold', width: 1.2 }); sR.dot(D, n, { r: 6, color: 'gold' });
          info = { fold, W, D, n, bound: regionBound(2, Array(D).fill(W)), one: regionBound(2, [W * D]) };
        });
        v.legend([['accent', 'measured (random: mean of 3 seeds)'], ['muted', 'product upper bound', { dash: true }], ['orange', 'one layer, same number of units (max)'], ['gold', 'the network on the left', { dot: true }]]);
        v.readout(() => info && String.raw`${info.D} hidden layer${info.D > 1 ? 's' : ''} of width ${info.W} (${info.W * info.D} units): **${info.n} regions** counted in the window (grid $300\times300$) · upper bound $\prod_\ell\sum_{j\le2}\binom{${info.W}}{j}=${tbig(info.bound)}$ · one layer of ${info.W * info.D} units: at most $1+${info.W * info.D}+\binom{${info.W * info.D}}{2}=${info.one}$` + (info.fold ? ` · folding: exactly $4^{${info.D}}=${4 ** info.D}$ squares, ${info.n >= 4 ** info.D ? 'all found ✓' : 'some too small for the grid'}` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Deep narrow ReLU networks are universal',
      credit: 'Hanin & Sellke, 2017; Lu, Pu, Wang, Hu & Wang, 2017; Johnson, 2019',
      statement: String.raw`ReLU networks of **width $d+1$** and unbounded depth are dense in $C(K)$ for every compact $K\subset\R^d$ (Hanin & Sellke; for the scalar-output case the minimal width is exactly $d+1$). Width $d$ is not enough: for a network of width at most $d$ with ReLU (indeed any continuous monotone) activation, every connected component of every level set $\{x:f(x)=c\}$ is unbounded (Johnson), so such networks cannot uniformly approximate a function with an isolated strict maximum, such as a bump $e^{-\lVert x\rVert^2}$, however deep they are. Depth can thus replace width, but only above a threshold set by the input dimension.`,
      idea: String.raw`With $d+1$ units per layer, $d$ of them can carry a copy of the input forward (ReLU is the identity on positive inputs after a shift) while the remaining unit computes and accumulates one piece of a max–min (or sum) representation of a piecewise-linear approximant, layer after layer; any continuous function is a uniform limit of such approximants (2.1, 2.2). With only $d$ units, the first layer maps $\R^d$ to $\R^d$ by an affine map followed by ReLU, which either collapses a direction or is a monotone injection on a cone; Johnson shows that the composite's level sets inherit unbounded components from this, so bounded "islands" are impossible.`,
      caption: String.raw`For each width, three seeded ReLU networks of the chosen depth are trained live by Adam (the best of the three is shown; deep narrow nets often get stuck with dead units, the thin curves below) on the bump $e^{-3\lVert x\rVert^2}$ (thin grey circles: its level sets). Left: width $3=d+1$ — its level sets close up around the peak. Right: width $2=d$ — however long it trains, its contours run off the edge of the window: the readout checks every component of $\{f\ge\tfrac12\max f\}$ and finds none bounded. Bottom: the training error of both (log scale). Change the depth or seed to restart.`,
      deps: ['deep-2.2'],
      refs: ['Prince §4.5'],
      tags: ['width', 'depth', 'universal approximation'],
      viz(v) {
        const dS = v.slider('hidden layers', 2, 8, 4, { int: true });
        const sdS = v.slider('seed group', 1, 6, 1, { int: true });
        const tgt = (x, y) => Math.exp(-3 * (x * x + y * y));
        const X = [], Y = []; for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++) { const x = -1 + (2 * i) / 14, y = -1 + (2 * j) / 14; X.push([x, y]); Y.push(tgt(x, y)); }
        const data = { X, Y };
        const sA = v.stage({ x: [-1, 1], y: [-1, 1], height: 290, axes: 'box', gutter: true, minWidth: 240, title: 'width 3 $=d+1$' });
        const sB = v.stage({ x: [-1, 1], y: [-1, 1], height: 290, axes: 'box', gutter: true, minWidth: 240, title: 'width 2 $=d$' });
        const sC = v.stage({ x: [0, 4000], y: [1e-3, 0.5], ylog: true, height: 200, full: true, axes: 'box', gutter: true, xlabel: 'Adam step', title: 'training RMS error' });
        const mk = () => { const L = dS.value, s = sdS.value; const one = (w, r) => { const net = makeNet([2, ...Array(L).fill(w), 1], { act: 'relu', seed: hashStr('narrow|' + w + '|' + L + '|' + s + '|' + r) }); net.b.forEach((b) => b.fill(0.1)); return makeTrainer(net, data, { head: 'mse', lr: (it) => 0.01 * Math.max(0.1, 1 - it / 3600) }); }; return { A: [0, 1, 2].map((r) => one(3, r)), B: [0, 1, 2].map((r) => one(2, r)) }; };
        const best = (Ts) => Ts.reduce((a, b) => (b.loss < a.loss ? b : a));
        const S = v.sim(mk, (st) => { if (st.A[0].iter < 4000) for (const T of [...st.A, ...st.B]) T.step(4); }, { dt: 1 / 30 });
        let lastKey = dS.value + '|' + sdS.value;
        /** components of {f ≥ c} on a grid: [count, how many touch the window edge] */
        const comps = (f, c, N = 70) => { const G = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) G.push(f(-1 + (2 * i) / (N - 1), -1 + (2 * j) / (N - 1)) >= c); const seen = new Uint8Array(N * N); let n = 0, edge = 0; for (let s = 0; s < N * N; s++) { if (!G[s] || seen[s]) continue; n++; let touch = false; const st = [s]; seen[s] = 1; while (st.length) { const q = st.pop(), i = Math.floor(q / N), j = q % N; if (i === 0 || j === 0 || i === N - 1 || j === N - 1) touch = true; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue; const r = a * N + b; if (G[r] && !seen[r]) { seen[r] = 1; st.push(r); } } } if (touch) edge++; } return [n, edge]; };
        let info = null;
        v.animate((t) => {
          const k = dS.value + '|' + sdS.value; if (k !== lastKey) { lastKey = k; S.reset(); v.restart(); }
          const st = S.advance(t);
          const res = {};
          for (const [s, T, name] of [[sA, best(st.A), 'A'], [sB, best(st.B), 'B']]) {
            const f = (x, y) => forward(T.net, [x, y])[0];
            s.heat(f, { cmap: 'theme', color: name === 'A' ? 'accent' : 'orange', range: [0, 1], res: 4, key: name + T.iter + k });
            s.contour(tgt, [0.25, 0.5, 0.75], { color: 'muted', width: 1, res: 60 });
            let mx = -Infinity; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) mx = Math.max(mx, f(-1 + i / 20, -1 + j / 20));
            s.contour(f, [0.25 * mx, 0.5 * mx, 0.75 * mx], { color: 'ink', width: 1.8, res: 70 });
            const [n, edge] = comps(f, 0.5 * mx);
            res[name] = { rmse: Math.sqrt(T.loss), n, edge, bounded: n - edge };
            note(s, `RMS ${Math.sqrt(T.loss).toFixed(3)}`, 'tl');
          }
          for (const [Ts, c] of [[st.A, 'accent'], [st.B, 'orange']]) { const bt = best(Ts); for (const T of Ts) { const pts = []; for (let i = 0; i < T.hist.length; i += 8) pts.push([i, Math.sqrt(T.hist[i])]); sC.path(pts, { color: c, width: T === bt ? 2.6 : 1, alpha: T === bt ? 1 : 0.45 }); } }
          info = { ...res, it: st.A[0].iter };
        }, { period: 36, once: true, still: 34 });
        v.legend([['accent', 'width 3'], ['orange', 'width 2'], ['ink', 'network level sets at ¼, ½, ¾ of its max'], ['muted', 'target level sets']]);
        v.readout(() => info && String.raw`step ${info.it} · width 3: RMS error ${info.A.rmse.toFixed(4)}, $\{f\ge\tfrac12\max\}$ has ${info.A.n} component${info.A.n === 1 ? '' : 's'}, **${info.A.bounded} bounded** · width 2: RMS error ${info.B.rmse.toFixed(4)}, ${info.B.n} component${info.B.n === 1 ? '' : 's'}, **${info.B.bounded} bounded**` + (info.B.bounded === 0 ? ' — every one runs off the window, as Johnson\'s theorem forces' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Deep ReLU networks approximate x² exponentially fast',
      credit: 'Yarotsky, 2017',
      statement: String.raw`Let $g_s=T^{\circ s}$ be the $s$-fold tent map (2.6). Then
$$f_m(x)=x-\sum_{s=1}^m\frac{g_s(x)}{4^s}$$
is the piecewise-linear interpolant of $x^2$ at the $2^m+1$ points $k2^{-m}$, and $\sup_{[0,1]}|f_m(x)-x^2|=4^{-(m+1)}$. It is computed by a ReLU network of depth $O(m)$ and constant width, so accuracy $\eps$ costs only $O(\log(1/\eps))$ units — exponentially fewer than the $\eps^{-1/2}$ pieces any shallow network needs. By polarization, $xy=2\bigl(\tfrac{x+y}2\bigr)^2-\tfrac{x^2}2-\tfrac{y^2}2$, so products on $[0,1]^2$ are approximated to $\tfrac32\cdot 4^{-m}$ with three copies; from products come polynomials and, by Taylor expansion, efficient approximation of smooth functions (Yarotsky).`,
      idea: String.raw`Interpolating $x^2$ on a grid of spacing $h$ leaves an error of $h^2/4$ at each midpoint. Halving the grid adds one new knot in every cell, and the correction needed — the gap between the coarse chord and the fine chord — is a row of identical tents of height $h^2/4$, which is exactly $g_s/4^s$ for $h=2^{-(s-1)}$. Each tent row is one more composition of the tent map, i.e. one more layer, so the error shrinks by $4$ per layer. Depth reuses computation that a shallow network would have to pay for separately in every cell.`,
      caption: String.raw`**Square**: $x^2$ (grey) and $f_m$ (blue), with the subtracted sawtooth layers $g_s/4^s$ drawn beneath in their own colours. **Product**: the error $|P_m(x,y)-xy|$ over the unit square for the polarization network. Right, on a log scale: the measured sup error against the number of layers $m$ — each layer divides it by exactly $4$ (line: $4^{-(m+1)}$, and the product bound).`,
      deps: ['deep-2.6'],
      refs: ['Prince §4.5'],
      tags: ['Yarotsky', 'depth efficiency'],
      viz(v) {
        const modeS = v.select('approximate', [{ value: 'sq', label: '$x^2$' }, { value: 'prod', label: '$xy$ (polarization)' }], 'sq');
        const mS = v.slider('layers $m$', 0, 8, 3, { int: true });
        const sL = v.stage({ x: [0, 1], y: [-0.05, 1.02], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: 'left' });
        const sR = v.stage({ x: [-0.5, 8.5], y: [1e-6, 1], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'layers $m$', title: 'sup error against depth' });
        const tL = titler(sL);
        const P = (x, y, m) => 2 * yarotsky((x + y) / 2, m) - 0.5 * yarotsky(x, m) - 0.5 * yarotsky(y, m);
        const supSq = (m) => { let e = 0; for (let i = 0; i <= 8192; i++) { const x = i / 8192; e = Math.max(e, Math.abs(yarotsky(x, m) - x * x)); } return e; };
        const supPr = (m) => { let e = 0; for (let i = 0; i <= 128; i++) for (let j = 0; j <= 128; j++) { const x = i / 128, y = j / 128; e = Math.max(e, Math.abs(P(x, y, m) - x * y)); } return e; };
        const cs = memo();
        let info = null;
        v.render(() => {
          const m = mS.value, prod = modeS.value === 'prod';
          const C = cs(modeS.value, () => Array.from({ length: 9 }, (_, k) => [k, prod ? supPr(k) : supSq(k)]));
          if (!prod) {
            sL.setView([0, 1], [-0.05, 1.02]); sL.setLabels('$x$', undefined); tL('$x^2$ and $f_m(x)=x-\\sum_{s\\le m}g_s(x)/4^s$');
            sL.fn((x) => x * x, { color: 'muted', width: 4 });
            sL.fn((x) => yarotsky(x, m), { color: 'accent', width: 2 });
            for (let s = 1; s <= m; s++) sL.fn((x) => { let g = x; for (let i = 0; i < s; i++) g = tent(g); return g / 4 ** s; }, { color: CYC[s % CYC.length], width: 1.3, alpha: 0.8, n: 2000 });
            sL.line(0, 0, 1, 1, { color: 'faint', width: 1, dash: [4, 4] });
            sL.fn((x) => 0.75 + 0.2 * (yarotsky(x, m) - x * x) * 4 ** (m + 1), { color: 'red', width: 1.6, fill: 'red', fillAlpha: 0.15, base: 0.75, n: 3000, domain: [0, 0.62] });
            sL.text(`error × 4^${m + 1} (rescaled): ${2 ** m} identical arches`, 0.02, 0.98, { size: 11.5, color: 'red', baseline: 'top' });
          } else {
            sL.setView([0, 1], [0, 1]); tL(`error $|P_m(x,y)-xy|$ (scale: 0 to $4^{-m}$)`);
            sL.heat((x, y) => Math.abs(P(x, y, m) - x * y), { cmap: 'theme', color: 'red', range: [0, 4 ** -m], res: 3, key: 'p' + m });
            sL.contour((x, y) => x * y, [0.1, 0.3, 0.5, 0.7, 0.9], { color: 'ink', width: 1, alpha: 0.5, res: 60 });
          }
          sR.fn((k) => (prod ? 1.5 * 4 ** -k : 4 ** -(k + 1)), { color: 'muted', width: 1.5, dash: [5, 4] });
          sR.path(C, { color: prod ? 'red' : 'accent', width: 2.2 }); sR.dots(C, { r: 4, color: prod ? 'red' : 'accent' });
          sR.dot(m, C[m][1], { r: 7, color: 'gold' });
          info = { m, e: C[m][1], prod, ratio: m > 0 ? C[m - 1][1] / C[m][1] : null };
        });
        v.legend([['accent', 'measured sup error ($x^2$)'], ['red', 'measured sup error ($xy$)'], ['muted', '$4^{-(m+1)}$ / $\\tfrac32 4^{-m}$', { dash: true }]]);
        v.readout(() => info && String.raw`$m=${info.m}$ layers: sup error $=${tsci(info.e, 3)}$` + (info.prod ? ` (bound $\\tfrac32\\cdot4^{-${info.m}}=${tsci(1.5 * 4 ** -info.m, 3)}$)` : ` $=4^{-${info.m + 1}}$ exactly: ${Math.abs(info.e - 4 ** -(info.m + 1)) < 1e-12 ? '✓' : '≈'}`) + (info.ratio ? ` · previous layer / this layer $=${info.ratio.toFixed(3)}$` : '') + ` · a network of depth $${info.m}$ and width 3 ($\\approx${3 * info.m + 1}$ units) versus $2^{${info.m}}=${2 ** info.m}$ pieces for a shallow interpolant of the same accuracy`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Finite-sample memorization by small networks',
      credit: 'Zhang, Bengio, Hardt, Recht & Vinyals, 2017 (earlier: Baum 1988; Huang & Babri 1998)',
      statement: String.raw`For any $n$ distinct points $x_1,\dots,x_n\in\R^d$ and any real labels $y_1,\dots,y_n$, there is a two-layer ReLU network with $n$ hidden units and $2n+d$ weights,
$$f(x)=\sum_{j=1}^n w_j\,\mathrm{ReLU}(a\cdot x-b_j),$$
with $f(x_i)=y_i$ for every $i$. One may take any direction $a$ for which the projections $u_i=a\cdot x_i$ are distinct (almost every $a$), interleave the biases $b_1<u_{(1)}<b_2<u_{(2)}<\cdots<b_n<u_{(n)}$, and solve for $w$. Such networks can therefore fit even random labels perfectly, so perfect training accuracy by itself says nothing about generalization.`,
      idea: String.raw`Project onto a generic direction to reduce the problem to one dimension. Sorted by projection, point $i$ activates exactly the units $j\le i$, so the conditions $f(x_i)=y_i$ form a lower-triangular linear system in $w$ whose diagonal entries $u_{(i)}-b_i$ are positive, solvable by forward substitution — the 1D interpolation of 2.1 with knots at the data. If two points of different label share a projection, no function of $a\cdot x$ can separate them; that is the only way the construction fails, and rotating $a$ fixes it.`,
      caption: String.raw`Left: click to add points with the selected label; the plane is coloured by the constructed network's output, which depends only on $a\cdot x$ — stripes perpendicular to the gold arrow $a$, which you can drag. Right: the same data projected onto $a$, with the network's piecewise-linear profile passing through every point (orange ticks: the biases $b_j$). Press *random labels* to memorise noise; rotate $a$ until two points align and watch the construction break.`,
      deps: ['deep-1.3'],
      refs: ['Prince §20.5'],
      tags: ['memorization', 'expressivity'],
      viz(v) {
        const labS = v.select('click adds label', [{ value: 1, label: '$+1$' }, { value: -1, label: '$-1$' }], 1);
        const sL = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'data and the network output $f(x)$' });
        const sR = v.stage({ x: [-3, 3], y: [-3, 3], height: 340, axes: 'box', gutter: true, xlabel: 'projection $u=a\\cdot x$', title: 'along $a$: the 1D interpolation' });
        const r0 = rand(12), pts = []; for (let i = 0; i < 9; i++) pts.push([r0.uniform(-1.7, 1.7), r0.uniform(-1.7, 1.7), r0() < 0.5 ? 1 : -1]);
        let ver = 0, rs = 1;
        sL.onClick((x, y) => { pts.push([x, y, +labS.value]); ver++; });
        v.button('random labels', () => { const r = rand(hashStr('lab' + rs++)); pts.forEach((p) => (p[2] = r() < 0.5 ? 1 : -1)); ver++; });
        v.button('add 5 random points', () => { const r = rand(hashStr('pts' + rs++)); for (let i = 0; i < 5; i++) pts.push([r.uniform(-1.8, 1.8), r.uniform(-1.8, 1.8), r() < 0.5 ? 1 : -1]); ver++; });
        v.button('clear', () => { pts.length = 0; ver++; });
        const A = sL.handle(1.1, 0.45, { color: 'gold', label: '$a$', labelPos: 'ne' });
        const build = () => {
          const a = [A.x, A.y], n = pts.length;
          const P = pts.map((p) => ({ u: a[0] * p[0] + a[1] * p[1], y: p[2] })).sort((p, q) => p.u - q.u);
          const span = n ? P[n - 1].u - P[0].u || 1 : 1; let gap = Infinity; for (let i = 1; i < n; i++) gap = Math.min(gap, P[i].u - P[i - 1].u);
          const b = P.map((p, i) => (i === 0 ? p.u - 0.3 * span / Math.max(1, n) - 0.05 : (P[i - 1].u + p.u) / 2)), w = [];
          for (let i = 0; i < n; i++) { let s = P[i].y; for (let j = 0; j < i; j++) s -= w[j] * (P[i].u - b[j]); w.push(s / (P[i].u - b[i])); }
          const f = (x) => { const u = a[0] * x[0] + a[1] * x[1]; let s = 0; for (let j = 0; j < n; j++) if (u > b[j]) s += w[j] * (u - b[j]); return s; };
          let err = 0; for (const p of pts) err = Math.max(err, Math.abs(f(p) - p[2]));
          return { a, P, b, w, f, gap, span, err, n };
        };
        const lutA = () => rampLUT(v, 'accent', 32, 'panel', 0.6), lutO = () => rampLUT(v, 'orange', 32, 'panel', 0.6);
        let info = null;
        v.render(() => {
          const B = build(), la = lutA(), lo = lutO();
          sL.raster((x, y) => { const z = B.f([x, y]), t = Math.round(Math.min(1, Math.abs(z) / 1.5) * 31); return z >= 0 ? lo[t] : la[t]; }, { res: 3, key: [ver, B.a].join('|') });
          sL.arrow(0, 0, A.x, A.y, { color: 'gold', width: 2.4 });
          pts.forEach((p) => { sL.dot(p[0], p[1], { r: 5.5, color: p[2] > 0 ? 'orange' : 'accent' }); if (Math.abs(B.f(p) - p[2]) > 1e-6) sL.dot(p[0], p[1], { r: 9, hollow: true, color: 'red', width: 2 }); });
          // right
          if (B.n) { const lo2 = B.P[0].u, hi2 = B.P[B.n - 1].u, pad = 0.15 * (hi2 - lo2 || 1); sR.setView([lo2 - pad, hi2 + pad], [-2.6, 2.6]); }
          sR.hline(0, { color: 'faint', width: 1 }); sR.hline(1, { color: 'faint', width: 1, dash: [3, 4] }); sR.hline(-1, { color: 'faint', width: 1, dash: [3, 4] });
          const bx = sR.bounds.x, prof = []; for (let i = 0; i <= 800; i++) { const u = bx[0] + ((bx[1] - bx[0]) * i) / 800; let s = 0; for (let j = 0; j < B.n; j++) if (u > B.b[j]) s += B.w[j] * (u - B.b[j]); prof.push([u, s]); }
          sR.path(prof, { color: 'ink', width: 2.2 });
          B.b.forEach((bb) => sR.line(bb, -2.6, bb, -2.35, { color: 'orange', width: 2 }));
          B.P.forEach((p) => sR.dot(p.u, p.y, { r: 5, color: p.y > 0 ? 'orange' : 'accent' }));
          info = B;
        });
        v.legend([['orange', 'label $+1$', { dot: true }], ['accent', 'label $-1$', { dot: true }], ['ink', 'network along $a$'], ['red', 'missed point', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { n, err, gap, span } = info, d = 2;
          const bad = n > 1 && gap < 1e-3 * span;
          return String.raw`$n=${n}$ points → $n=${n}$ hidden units, $2n+d=${2 * n + d}$ weights · largest miss $\max_i|f(x_i)-y_i|=${n ? tsci(err, 2) : '0'}$ · closest pair of projections ${n > 1 ? gap.toFixed(4) : '—'}` + (bad ? ' — **two projections (nearly) coincide: the triangular system is ill-conditioned; rotate $a$**' : n ? ' · **every label fitted**' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Paper',
      name: 'Approximation by superpositions of a sigmoidal function',
      paper: { authors: 'G. Cybenko', year: 1989, title: 'Approximation by superpositions of a sigmoidal function', venue: 'Mathematics of Control, Signals, and Systems 2 (4): 303–314', doi: '10.1007/BF02551274' },
      introduces: ['deep-2.2'],
      credit: 'Cybenko, 1989',
      statement: String.raw`Cybenko proved that for any continuous **sigmoidal** $\sigma$ (tending to $1$ at $+\infty$ and $0$ at $-\infty$), finite sums $G(x)=\sum_{j=1}^N\alpha_j\,\sigma(y_j\cdot x+\theta_j)$ are dense in $C([0,1]^n)$ in the sup norm: for every continuous $f$ and $\eps>0$ there is such a $G$ with $|G(x)-f(x)|<\eps$ on the cube. The key lemma is that bounded measurable sigmoidal functions are **discriminatory**: if a finite signed regular Borel measure $\mu$ on the cube satisfies $\int\sigma(y\cdot x+\theta)\,d\mu(x)=0$ for all $y,\theta$, then $\mu=0$. The paper also derives density of such sums in $L^1$ and corollaries for approximating decision regions (classification). It is an existence theorem: it gives neither the number $N$ of units nor a way to find the weights.`,
      idea: String.raw`Before 1989 it was known empirically that multilayer perceptrons fit many functions, and Kolmogorov's superposition theorem suggested two hidden layers suffice in principle, but there was no clean statement that a single hidden layer of standard sigmoids is universal. Cybenko's argument is short and functional-analytic: if the closure $S$ of the span were not all of $C([0,1]^n)$, Hahn–Banach (rca-5.16) gives a non-zero bounded functional vanishing on $S$, Riesz represents it by a measure $\mu$, and the discriminatory lemma — proved by letting $\sigma(\lambda(y\cdot x+\theta))$ tend to a step and then using Fourier analysis on half-spaces — forces $\mu=0$. Together with Hornik, Stinchcombe and White (1989) the paper established the **universal approximation theorem** (2.2), and its non-constructive character set the agenda for later work on rates (Barron 1993, 2.5) and on depth (2.6–2.9).`,
      caption: String.raw`**Steps**: in one dimension the proof's mechanism is visible directly. A steep sigmoid is nearly a step, and $N$ steps placed at the cell midpoints with heights $f(x_k)-f(x_{k-1})$ form a staircase that converges uniformly to $f$ as $N$ grows — provided the steepness $\lambda$ (relative to the cell width) is large; lower it and the steps blur. Right: sup error against $N$ for perfect steps, for your $\lambda$, and for the same sigmoids with least-squares heights. **Discriminatory**: drag the four masses of a signed measure $\mu$ on $[0,1]$ (height = mass); right, $I(\lambda,t)=\int\sigma(\lambda(x-t))\,d\mu$ over the plane. It vanishes identically only when $\mu=0$ — press *cancel the masses* to see it — and for large $\lambda$ its rows approach $t\mapsto\mu((t,1])$ (green, left).`,
      deps: ['deep-1.3', 'num-4.1', 'rca-5.16'],
      refs: [],
      tags: ['universal approximation', 'landmark paper'],
      links: { doi: 'https://doi.org/10.1007/BF02551274' },
      viz(v) {
        const modeS = v.select('construction', [{ value: 'steps', label: 'steps (1D)' }, { value: 'disc', label: 'discriminatory measure' }], 'steps');
        const tgS = v.select('target', [{ value: 'smooth', label: 'smooth' }, { value: 'kinks', label: 'kinks' }, { value: 'rough', label: 'rough (Weierstrass-type)' }], 'smooth');
        const nS = v.slider('units $N$', 1, 128, 10, { log: true, int: true });
        const lS = v.slider('steepness $\\lambda$ (× cell width)', 0.3, 100, 8, { log: true });
        const TG = {
          smooth: (x) => 0.5 + 0.3 * Math.sin(6 * x) + 0.12 * Math.cos(15 * x),
          kinks: (x) => 0.2 + 0.7 * Math.abs(x - 0.3) - 0.9 * Math.max(0, x - 0.65) + 0.3 * Math.max(0, x - 0.85),
          rough: (x) => { let s = 0.5; for (let k = 0; k < 9; k++) s += 0.16 * 2 ** (-k / 2) * Math.cos(2 ** k * Math.PI * x * 1.7 + k); return s; },
        };
        const sL = v.stage({ x: [0, 1], y: [-0.05, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$x$', ylabel: ' ', title: 'left' });
        const sR = v.stage({ x: [0.8, 160], y: [1e-3, 1], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: ' ', ylabel: ' ', title: 'right' });
        const tL = titler(sL), tR = titler(sR);
        const MH = [[0.2, 0.6], [0.45, -0.8], [0.62, 0.5], [0.85, -0.3]].map(([x, m], i) => sL.handle(x, m, { color: m > 0 ? 'accent' : 'red', r: 6, constrain: (px, py) => [clamp(px, 0, 1), clamp(py, -1, 1)] }));
        v.button('cancel the masses', () => { MH[1].set(MH[0].x, -MH[0].y); MH[3].set(MH[2].x, -MH[2].y); });
        v.button('random masses', () => { const r = rand(hashStr('cy' + Math.round(MH[0].x * 1e4))); MH.forEach((h) => h.set(r(), r() * 2 - 1)); });
        const stair = (f, N, lam, exact) => { const xs = Array.from({ length: N + 1 }, (_, k) => k / N); return (x) => { let s = f(0); for (let k = 1; k <= N; k++) { const t = (xs[k - 1] + xs[k]) / 2, h = f(xs[k]) - f(xs[k - 1]); s += h * (exact ? (x >= t ? 1 : 0) : sigm(lam * N * (x - t))); } return s; }; };
        const lsq = (f, N, lam) => { const ts = Array.from({ length: N }, (_, k) => (k + 0.5) / N), X = Array.from({ length: 401 }, (_, i) => i / 400); const c = lstsq(X.map((x) => [1, ...ts.map((t) => sigm(lam * N * (x - t)))]), X.map(f), 1e-10); return (x) => c[0] + ts.reduce((s, t, k) => s + c[k + 1] * sigm(lam * N * (x - t)), 0); };
        const supE = (f, g) => { let e = 0; for (let i = 0; i <= 2000; i++) { const x = i / 2000; e = Math.max(e, Math.abs(f(x) - g(x))); } return e; };
        const NS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128];
        const cs = memo();
        let info = null;
        v.render(() => {
          const disc = modeS.value === 'disc';
          tgS.el.hidden = nS.el.hidden = lS.el.hidden = disc; MH.forEach((h, i) => { h.visible = disc; h.color = h.y >= 0 ? 'accent' : 'red'; });
          if (!disc) {
            sL.setView([0, 1], [-0.05, 1.05]); sR.setScale({ xlog: true, ylog: true, x: [0.8, 160], y: [1e-3, 1] }); sL.setLabels('$x$', null); sR.setLabels('units $N$', null);
            tL('target $f$ and the staircase of $N$ steep sigmoids'); tR('sup error against $N$');
            const f = TG[tgS.value], N = nS.value, lam = lS.value, G = stair(f, N, lam, false);
            sL.fn(f, { color: 'muted', width: 3.5, n: 1500 });
            if (N <= 24) for (let k = 1; k <= N; k++) { const t = (k - 0.5) / N, h = f(k / N) - f((k - 1) / N); sL.fn((x) => 0.02 + Math.abs(h) * sigm(lam * N * (x - t)) * 0.9, { color: CYC[k % CYC.length], width: 1, alpha: 0.6, n: 600 }); }
            sL.fn(G, { color: 'accent', width: 2.2, n: 2000 });
            const C = cs(tgS.value + '|' + lam.toFixed(4), () => NS.map((n) => [n, supE(f, stair(f, n, lam, true)), supE(f, stair(f, n, lam, false)), supE(f, lsq(f, n, lam))]));
            sR.path(C.map((c) => [c[0], c[1]]), { color: 'muted', width: 2, dash: [5, 4] });
            sR.path(C.map((c) => [c[0], c[2]]), { color: 'accent', width: 2.4 }); sR.dots(C.map((c) => [c[0], c[2]]), { r: 3, color: 'accent' });
            sR.path(C.map((c) => [c[0], c[3]]), { color: 'green', width: 2.4 }); sR.dots(C.map((c) => [c[0], c[3]]), { r: 3, color: 'green' });
            const e = supE(f, G); sR.vline(N, { color: 'gold', width: 1.2 }); sR.dot(N, e, { r: 5.5, color: 'gold' });
            const need = (k) => { const c = C.find((q) => q[k] < 0.05); return c ? c[0] : '> 128'; };
            info = { disc, N, e, lam, needS: need(2), needL: need(3) };
            v.legend([['muted', 'target'], ['accent', 'staircase of sigmoids'], ['muted', 'perfect steps (λ → ∞)', { dash: true }], ['green', 'same sigmoids, least-squares heights']]);
          } else {
            sL.setView([0, 1], [-1.1, 1.1]); sR.setScale({ xlog: false, ylog: false, x: [-0.15, 1.15], y: [-60, 60] }); sL.setLabels('$x$', 'mass'); sR.setLabels('shift $t$', 'steepness $\\lambda$');
            tL('a signed measure $\\mu$ and $t\\mapsto\\mu((t,1])$'); tR('$I(\\lambda,t)=\\int\\sigma(\\lambda(x-t))\\,d\\mu(x)$');
            const ms = MH.map((h) => [h.x, h.y]);
            sL.hline(0, { color: 'faint', width: 1 });
            ms.forEach(([x, m]) => sL.line(x, 0, x, m, { color: m >= 0 ? 'accent' : 'red', width: 3 }));
            const F = (t) => ms.reduce((s, [x, m]) => s + (x > t ? m : 0), 0), st = [];
            for (let i = 0; i <= 1000; i++) { const t = i / 1000; st.push([t, F(t)]); }
            sL.path(st, { color: 'green', width: 2.2 });
            const I = (t, l) => ms.reduce((s, [x, m]) => s + m * sigm(l * (x - t)), 0);
            let mx = 0, at = [0, 0]; for (let i = 0; i <= 140; i++) for (let j = 0; j <= 120; j++) { const t = -0.15 + (1.3 * i) / 140, l = -60 + j; const z = Math.abs(I(t, l)); if (z > mx) { mx = z; at = [t, l]; } }
            const tot = ms.reduce((s, [, m]) => s + Math.abs(m), 0) || 1;
            sR.heat((t, l) => I(t, l), { cmap: 'theme-diverging', neg: 'red', pos: 'accent', range: [-Math.max(0.3, mx), Math.max(0.3, mx)], res: 3, key: ms.flat().map((u) => u.toFixed(4)).join(',') });
            sR.hline(0, { color: 'ink', width: 0.8, alpha: 0.4 });
            sR.dot(at[0], at[1], { r: 5, color: 'gold' });
            info = { disc, mx, at, tot, net: ms.reduce((s, [, m]) => s + m, 0) };
            v.legend([['accent', 'positive mass / $I>0$'], ['red', 'negative mass / $I<0$'], ['green', '$\\mu((t,1])$'], ['gold', 'largest $|I|$', { dot: true }]]);
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (!info.disc) return String.raw`$N=${info.N}$ sigmoids with $\lambda=${info.lam.toFixed(1)}$ per cell: sup error ${info.e.toFixed(4)} · error $0.05$ first reached at $N=${info.needS}$ (staircase) and $N=${info.needL}$ (least-squares heights) · Cybenko (1989): *some* finite $N$ exists for every $\varepsilon$, no bound given; today: $N=O(C_f^2/\varepsilon^2)$ for targets with finite Barron constant (Barron 1993), and $N\sim\omega_f^{-1}(\varepsilon)$ for this 1D construction`;
          return String.raw`$\max|I(\lambda,t)|=${info.mx.toFixed(4)}$ at $t=${info.at[0].toFixed(2)},\ \lambda=${info.at[1].toFixed(0)}$ · total variation of $\mu$: ${info.tot.toFixed(3)}, total mass $\mu([0,1])=${mnus(info.net.toFixed(3))}$ · ` + (info.mx < 1e-9 ? '**$I\\equiv0$ and $\\mu=0$**: the only measure annihilating every sigmoid' : '**$I\\not\\equiv0$**: $\\sigma$ discriminates this $\\mu\\neq0$');
        });
      },
    },
  ],
};
