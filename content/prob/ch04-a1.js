// Probability: Theory and Examples (Durrett) — Chapter 4, part A1: §4.1 (second half) and the start of §4.2
import { clampN, cornerIn, fr, GN, SNAP, gridOf, cellMeans, project, meanOf, maxAbsDiff, drawGrid, drawSteps, drawCuts, cutLane, cellOf, XF, xfOpts, Y_RANGE, PHI, PhiN, simpson, walkPaths, meanPaths } from './ch04-a.shared.js';

const Ylo = Y_RANGE[0];
const fx = (x, d = 3) => fr(x, d);
const Phi = (M, z) => PhiN(M, z);

/** Draggable heights, one per cell, sitting at the cell centres: returns {vals, sync(cuts)}; n handles, extras hidden. */
function heightHandles(S, init, color, range) {
  const vals = init.slice(), ctr = init.map((_, k) => (k + 0.5) / init.length), hs = [];
  init.forEach((y, k) => {
    const h = S.handle(ctr[k], y, { color, r: 7, constrain: (x, yy) => [ctr[k], clampN(yy, range[0], range[1])] });
    h.onDrag = () => { vals[k] = h.y; };
    hs.push(h);
  });
  return { vals, hs, sync(cuts) { hs.forEach((h, k) => { const vis = k + 1 < cuts.length; h.visible = vis; if (vis) { ctr[k] = (cuts[k] + cuts[k + 1]) / 2; h.set(ctr[k], vals[k]); } }); } };
}

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    {
      num: '4.1.14',
      kind: 'Theorem',
      name: 'Taking out what is known',
      statement: String.raw`If $X\in\mathcal F$ and $E|Y|,E|XY|<\infty$, then
$$E(XY\mid\mathcal F)=X\,E(Y\mid\mathcal F)\quad\text{a.s.}$$
Given $\mathcal F$, an $\mathcal F$-measurable factor behaves like a constant.`,
      idea: String.raw`The right side is $\mathcal F$-measurable, so only (ii) needs checking. For $X=1_B$ with $B\in\mathcal F$, $\int_A1_BE(Y\mid\mathcal F)=\int_{A\cap B}E(Y\mid\mathcal F)=\int_{A\cap B}Y=\int_A1_BY$, because $A\cap B\in\mathcal F$. Linearity (4.1.9) extends this to simple $X$, monotone convergence (4.1.9c) to $X,Y\ge0$, and the decomposition into positive and negative parts to the general case.`,
      caption: String.raw`The partition has four cells; drag the three orange cut handles at the bottom. With the toggle on, $X$ is the step function whose heights are the green handles: it is constant on each cell, and $E(XY\mid\mathcal F)$ (thick orange) coincides with $X\,E(Y\mid\mathcal F)$ (green dashed) cell by cell. Switch the toggle off and $X$ becomes the continuous ramp $\omega$, which is not $\mathcal F$-measurable: the product $X\,E(Y\mid\mathcal F)$ now bends inside cells while $E(XY\mid\mathcal F)$ is still flat, and the identity fails.`,
      deps: ['prob-4.1.9'],
      tags: ['conditional expectation'],
      viz(v) {
        const meas = v.toggle('$X\\in\\mathcal F$ (constant on cells)', true);
        const sel = v.select('$Y$', xfOpts(['saw', 'wave', 'bump']), 'saw');
        const s = v.stage({ x: [0, 1], y: [-2.6, 3.2], axes: 'box', gutter: true, height: 380, xlabel: '$\\omega$', title: '$XY$ and $E(XY\\mid\\mathcal F)$ against $X\\,E(Y\\mid\\mathcal F)$' });
        const lane = cutLane(s, [0.25, 0.5, 0.75], -2.25);
        const H = heightHandles(s, [1.1, -0.6, 1.5, 0.4], 'green', [-1.8, 2.2]);
        let st = null;
        v.render(() => {
          const cuts = lane.get(); H.sync(cuts);
          H.hs.forEach((h) => { h.visible = h.visible && meas.value; });
          const Y = gridOf(XF[sel.value].f), n = cuts.length - 1;
          const Xg = new Float64Array(GN); for (let i = 0; i < GN; i++) { const w = (i + 0.5) / GN; Xg[i] = meas.value ? H.vals[Math.min(cellOf(cuts, w), 3)] : 2 * w - 0.4; }
          const XY = Xg.map((x, i) => x * Y[i]), EY = project(Y, cuts), lhs = project(XY, cuts), rhs = Xg.map((x, i) => x * EY[i]);
          drawCuts(s, cuts);
          drawGrid(s, XY, { color: 'muted', width: 1.2, alpha: 0.7 }); drawGrid(s, Xg, { color: 'accent', width: 1.8 });
          drawGrid(s, lhs, { color: 'orange', width: 4.5 }); drawGrid(s, rhs, { color: 'green', width: 2.4, dash: [7, 5] });
          st = { d: maxAbsDiff(lhs, rhs), n };
        });
        v.legend([['accent', '$X$'], ['muted', '$XY$'], ['orange', '$E(XY\\mid\\mathcal F)$'], ['green', '$X\\,E(Y\\mid\\mathcal F)$', { dash: [7, 5] }]]);
        v.readout(() => st && `$\\sup_\\omega|E(XY\\mid\\mathcal F)-X\\,E(Y\\mid\\mathcal F)|=${fx(st.d, 6)}$: ${st.d < 1e-9 ? 'the identity holds exactly' : 'it **fails**, since $X$ is not $\\mathcal F$-measurable'}.`);
      },
    },
    {
      num: '4.1.15',
      kind: 'Theorem',
      name: 'Conditional expectation as an L² projection',
      statement: String.raw`If $EX^2<\infty$, then $E(X\mid\mathcal F)$ is the $\mathcal F$-measurable $Y$ that minimizes the mean square error $E(X-Y)^2$ over $L^2(\mathcal F)$. Equivalently, it is the orthogonal projection of $X$ onto the closed subspace $L^2(\mathcal F)\subset L^2(\mathcal F_0)$, and for every $Y\in L^2(\mathcal F)$
$$E(X-Y)^2=E\big(X-E(X\mid\mathcal F)\big)^2+E\big(E(X\mid\mathcal F)-Y\big)^2 .$$`,
      idea: String.raw`Taking out what is known (4.1.14) gives $Z\,E(X\mid\mathcal F)=E(ZX\mid\mathcal F)$ for $Z\in L^2(\mathcal F)$, and then the tower identity $E(E(\cdot\mid\mathcal F))=E(\cdot)$ yields $E[Z(X-E(X\mid\mathcal F))]=0$: the error is orthogonal to the subspace. Writing $X-Y=(X-E(X\mid\mathcal F))+(E(X\mid\mathcal F)-Y)$, the cross term vanishes and Pythagoras finishes. See Hilbert-space projection in rca-4.11.`,
      caption: String.raw`Cells are the quarters of $[0,1)$ with $X$ in blue. Drag the four orange handles: they set the heights of a candidate $Y\in L^2(\mathcal F)$ (orange steps). The green dashed steps are $E(X\mid\mathcal F)$. Right: the right triangle in $L^2$ with legs $\|X-E(X\mid\mathcal F)\|$ (vertical, fixed) and $\|E(X\mid\mathcal F)-Y\|$ (horizontal, grows as your $Y$ moves away) and hypotenuse $\|X-Y\|$. The error is smallest, equal to the vertical leg, exactly at the green steps; the button puts $Y$ there.`,
      deps: ['prob-4.1.14'],
      see: ['rca-4.11'],
      tags: ['conditional expectation', 'hilbert space'],
      viz(v) {
        const sel = v.select('$X$', xfOpts(), 'wave');
        const s = v.stage({ x: [0, 1], y: Y_RANGE, axes: 'box', gutter: true, height: 340, xlabel: '$\\omega$', title: 'a candidate $Y$ against the cell averages' });
        const cuts = [0, 0.25, 0.5, 0.75, 1];
        const H = heightHandles(s, [1.8, -1.2, 0.2, -1.5], 'orange', [-1.8, 2.3]);
        v.button('Put $Y=E(X\\mid\\mathcal F)$', () => { const m = cellMeans(gridOf(XF[sel.value].f), cuts); m.forEach((x, k) => { H.vals[k] = x; }); });
        const T = v.stage({ x: [-0.6, 1.5], y: [-0.2, 1.1], equal: true, axes: false, height: 340, minWidth: 280, weight: 0.75, title: 'Pythagoras in $L^2$' });
        let st = null;
        v.render(() => {
          H.sync(cuts);
          const X = gridOf(XF[sel.value].f), m = cellMeans(X, cuts), E = project(X, cuts);
          const Y = new Float64Array(GN); for (let i = 0; i < GN; i++) Y[i] = H.vals[Math.min(3, Math.floor((i / GN) * 4))];
          drawCuts(s, cuts); drawGrid(s, X, { color: 'accent', width: 1.8 });
          drawSteps(s, cuts, m, { color: 'green', width: 2.6, dash: [7, 5] }); drawSteps(s, cuts, H.vals, { color: 'orange', width: 3.6 });
          let a2 = 0, b2 = 0, c2 = 0; for (let i = 0; i < GN; i++) { a2 += (X[i] - E[i]) ** 2 / GN; b2 += (E[i] - Y[i]) ** 2 / GN; c2 += (X[i] - Y[i]) ** 2 / GN; }
          const a = Math.sqrt(a2), b = Math.sqrt(b2), sc = 1 / Math.max(1.3, a + 0.2, b);
          T.line(0, 0, 1.4, 0, { color: 'muted', width: 6, alpha: 0.25 });
          T.text('$L^2(\\mathcal F)$', 1.45, -0.12, { size: 13, color: 'muted', align: 'right' });
          T.line(0, 0, 0, a * sc, { color: 'red', width: 3 }); T.line(0, 0, b * sc, 0, { color: 'orange', width: 3 }); T.line(0, a * sc, b * sc, 0, { color: 'accent', width: 2.4, dash: [6, 4] });
          T.line(0.07, 0, 0.07, 0.07, { color: 'ink', width: 1 }); T.line(0, 0.07, 0.07, 0.07, { color: 'ink', width: 1 });
          T.dot(0, a * sc, { r: 6, color: 'accent', label: '$X$', labelPos: 'nw' }); T.dot(0, 0, { r: 6, color: 'green', label: '$E(X\\mid\\mathcal F)$', labelPos: 'sw' }); T.dot(b * sc, 0, { r: 6, color: 'orange', label: '$Y$', labelPos: 'se' });
          st = { a2, b2, c2 };
        });
        v.legend([['accent', '$X$'], ['green', '$E(X\\mid\\mathcal F)$', { dash: [7, 5] }], ['orange', 'candidate $Y$']]);
        v.readout(() => st && `$E(X-Y)^2=${fx(st.c2, 4)}$ $=\\ E(X-E(X\\mid\\mathcal F))^2+E(E(X\\mid\\mathcal F)-Y)^2=${fx(st.a2, 4)}+${fx(st.b2, 4)}=${fx(st.a2 + st.b2, 4)}$. The minimum possible is $${fx(st.a2, 4)}$, reached when $Y=E(X\\mid\\mathcal F)$.`);
      },
    },
    {
      num: '4.1.15a',
      kind: 'Definition',
      name: 'Regular conditional distribution',
      verify: true,
      statement: String.raw`Let $X:(\Omega,\mathcal F_0)\to(S,\mathcal S)$ be measurable and $\mathcal G\subset\mathcal F_0$ a σ-field. A **regular conditional distribution** for $X$ given $\mathcal G$ is a function $\mu:\Omega\times\mathcal S\to[0,1]$ such that

(i) for each $A\in\mathcal S$, $\omega\mapsto\mu(\omega,A)$ is a version of $P(X\in A\mid\mathcal G)$;

(ii) for a.e. $\omega$, $A\mapsto\mu(\omega,A)$ is a probability measure on $(S,\mathcal S)$.

For conditioning on $Y$ one asks for $\mu(Y(\omega),A)$ with $\mu(y,\cdot)$ a probability measure for each $y$.`,
      idea: String.raw`Each conditional probability $P(X\in A\mid\mathcal G)$ is only defined up to a null set that depends on $A$. A regular conditional distribution asks for one choice of versions that is a genuine probability measure in $A$ for almost every $\omega$, so that conditional expectations of all functions of $X$ can be computed by integrating (4.1.16). When $(X,Y)$ has a joint density $f(x,y)>0$, $\mu(y,A)=\int_Af(x,y)\,dx\big/\int f(x,y)\,dx$ works.`,
      caption: String.raw`A standard Gaussian pair $(X,Y)$ with correlation $\rho$. Left: the kernel $\mu(y,\cdot)$ as a heat map (one density per column, each integrating to $1$) with 400 seeded sample points from the joint law; the vertical gold line is the conditioning value $y$. Right: the density $\mu(y,\cdot)=N(\rho y,1-\rho^2)$ and the set $A=[a,b]$ (shaded): $\mu(y,A)$ is its mass. The readout checks both parts of the definition: total mass $1$ for every $y$ (ii), and $\int_C\mu(y,A)\,P_Y(dy)=P(X\in A,Y\in C)$ against a Monte Carlo estimate (i).`,
      deps: ['prob-4.1.1a'],
      tags: ['conditional expectation', 'kernels'],
      viz(v) {
        const rho = v.slider('$\\rho$', -0.95, 0.95, 0.7, { step: 0.01 });
        const yS = v.slider('$y$', -2.5, 2.5, 1, { step: 0.01 });
        const aS = v.slider('$A=[a,b]$: $a$', -3, 3, -0.5, { step: 0.05 });
        const bS = v.slider('$b$', -3, 3, 1.5, { step: 0.05 });
        const cS = v.slider('$C=[-c,c]$: $c$', 0.2, 3, 1, { step: 0.05 });
        const L = v.stage({ x: [-3, 3], y: [-3.5, 3.5], axes: 'box', gutter: true, height: 340, xlabel: '$y$', ylabel: '$x$', title: 'the kernel $\\mu(y,dx)$' });
        const R = v.stage({ x: [-3.5, 3.5], y: [0, 1.3], axes: 'box', gutter: true, height: 340, xlabel: '$x$', title: '$\\mu(y,\\cdot)$ at the chosen $y$', minWidth: 280 });
        const r = v.rng(7), Z1 = [], Z2 = []; for (let i = 0; i < 20000; i++) { Z1.push(r.normal()); Z2.push(r.normal()); }
        let st = null;
        v.render(() => {
          const p = rho.value, sg = Math.sqrt(1 - p * p), y0 = yS.value, a = Math.min(aS.value, bS.value), b = Math.max(aS.value, bS.value);
          L.heat((y, x) => PHI((x - p * y) / sg) / sg, { range: [0, 1.6 / Math.max(0.35, sg) * 0.4], cmap: 'viridis', res: 3, key: `k${p}` });
          L.dots(Z1.slice(0, 400).map((z, i) => [z, p * z + sg * Z2[i]]), { r: 2, color: 'ink', alpha: 0.5 });
          L.vline(y0, { color: 'gold', width: 2 }); L.line(-3, p * -3, 3, p * 3, { color: 'orange', width: 1.4, dash: [5, 4] });
          const m = p * y0, f = (x) => PHI((x - m) / sg) / sg;
          R.setView([-3.5, 3.5], [0, 0.5 / sg + 0.05]);
          R.fn(f, { color: 'accent', width: 2.4, n: 300 });
          R.between(f, () => 0, a, b, { fill: 'gold', fillAlpha: 0.4 });
          R.vline(m, { color: 'orange', dash: [4, 4] });
          const muA = Phi(v.M, (b - m) / sg) - Phi(v.M, (a - m) / sg);
          const c = cS.value, lhs = simpson((y) => (Phi(v.M, (b - p * y) / sg) - Phi(v.M, (a - p * y) / sg)) * PHI(y), -c, c, 400);
          let k = 0, tot = 0; for (let i = 0; i < Z1.length; i++) { if (Math.abs(Z1[i]) <= c) { tot++; const x = p * Z1[i] + sg * Z2[i]; if (x >= a && x <= b) k++; } }
          st = { muA, mass: simpson(f, -8 + m, 8 + m, 600), lhs, mc: k / Z1.length, a, b, m, c };
        });
        v.legend([['gold', 'conditioning value $y$'], ['orange', 'conditional mean $\\rho y$', { dash: [5, 4] }], ['ink', 'joint sample', { dot: true }]]);
        v.readout(() => st && `$\\mu(y,\\mathbb R)=${fx(st.mass, 6)}$ (a probability measure for each $y$). $\\mu(y,[${fx(st.a, 2)},${fx(st.b, 2)}])=${fx(st.muA, 4)}$. Averaging over $C$: $\\int_C\\mu(y,A)P_Y(dy)=${fx(st.lhs, 4)}$ versus $P(X\\in A,Y\\in C)\\approx${fx(st.mc, 4)}$ (Monte Carlo, $n=20000$).`);
      },
    },
    {
      num: '4.1.16',
      kind: 'Theorem',
      name: 'Integrating against a regular conditional distribution',
      statement: String.raw`Let $\mu(\omega,A)$ be a regular conditional distribution for $X$ given $\mathcal F$. If $f:(S,\mathcal S)\to(\R,\mathcal R)$ has $E|f(X)|<\infty$, then
$$E\big(f(X)\mid\mathcal F\big)(\omega)=\int\mu(\omega,dx)\,f(x)\quad\text{a.s.}$$`,
      idea: String.raw`For $f=1_A$ this is the definition of $\mu$ (i). Linearity extends it to simple functions, monotone convergence (4.1.9c) to nonnegative $f$, and splitting $f=f^+-f^-$ to every integrable $f$. The point of having a *regular* version is that one kernel serves every $f$ simultaneously, instead of one exceptional null set per function.`,
      caption: String.raw`Gaussian pair with correlation $\rho$, $Y$ the conditioning variable. Left: 3000 seeded sample points $(Y,X)$, the gold dots are averages of $f(X)$ over narrow bins of $Y$, and the curve is $h(y)=\int f(x)\mu(y,dx)$ computed by numerical integration against $N(\rho y,1-\rho^2)$. They agree. Right: at the chosen $y$, the integrand $f(x)\mu(y,dx)$ whose area is $h(y)$; the dots on the left curve show where you are.`,
      deps: ['prob-4.1.15a', 'prob-4.1.9'],
      tags: ['conditional expectation', 'kernels'],
      viz(v) {
        const F = { sq: { l: '$x^2$', f: (x) => x * x }, ab: { l: '$|x|$', f: Math.abs }, ind: { l: '$1_{\\{x>1\\}}$', f: (x) => (x > 1 ? 1 : 0) }, cu: { l: '$x^3$', f: (x) => x ** 3 } };
        const fs = v.select('$f$', Object.keys(F).map((k) => ({ value: k, label: F[k].l })), 'sq');
        const rho = v.slider('$\\rho$', -0.95, 0.95, 0.7, { step: 0.01 });
        const yS = v.slider('$y$', -2.5, 2.5, 1, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-1, 8], axes: 'box', gutter: true, height: 340, xlabel: '$y$', ylabel: '$E(f(X)\\mid Y=y)$', title: 'conditional means: kernel formula against binned data' });
        const R = v.stage({ x: [-3.5, 4.5], y: [-1, 4], axes: 'box', gutter: true, height: 340, xlabel: '$x$', title: 'the integrand $f(x)\\mu(y,dx)$', minWidth: 280 });
        const r = v.rng(21), Z1 = [], Z2 = []; for (let i = 0; i < 3000; i++) { Z1.push(r.normal()); Z2.push(r.normal()); }
        let st = null;
        v.render(() => {
          const f = F[fs.value].f, p = rho.value, sg = Math.sqrt(1 - p * p), y0 = yS.value;
          const h = (y) => simpson((x) => f(x) * PHI((x - p * y) / sg) / sg, p * y - 8 * sg, p * y + 8 * sg, 600);
          const pts = Z1.map((z, i) => [z, f(p * z + sg * Z2[i])]);
          const hv = []; for (let y = -3; y <= 3; y += 0.1) hv.push(h(y));
          const lo = Math.min(...hv, 0), hi = Math.max(...hv);
          L.setView([-3, 3], [lo - 0.15 * (hi - lo) - 0.2, hi + 0.2 * (hi - lo) + 0.2]);
          L.dots(pts, { r: 1.6, color: 'muted', alpha: 0.25 });
          L.fn(h, { color: 'accent', width: 2.6, n: 120 });
          const nb = 14, bins = Array.from({ length: nb }, () => [0, 0]);
          for (const [y, fv] of pts) { const k = Math.floor(((y + 3) / 6) * nb); if (k >= 0 && k < nb) { bins[k][0] += fv; bins[k][1]++; } }
          bins.forEach((b, k) => { if (b[1] > 15) L.dot(-3 + (k + 0.5) * (6 / nb), b[0] / b[1], { r: 5, color: 'gold' }); });
          L.vline(y0, { color: 'orange', dash: [4, 4] }); L.dot(y0, h(y0), { r: 6, color: 'orange' });
          const m = p * y0, mu = (x) => PHI((x - m) / sg) / sg;
          R.setView([m - 4.5, m + 4.5], [-0.4, Math.max(2.2, ...[...Array(60)].map((_, i) => f(m - 4 + i * 0.14)) .map((q, i) => q * mu(m - 4 + i * 0.14)) .map((q) => q * 1.2), 1.2)]);
          R.fn(mu, { color: 'accent', width: 1.4, alpha: 0.6 });
          R.fn((x) => f(x) * mu(x), { color: 'green', width: 2.4, fill: true, fillAlpha: 0.22, n: 400 });
          R.hline(0, { color: 'grid' });
          const inb = Z1.map((z, i) => [z, pts[i][1]]).filter(([z]) => Math.abs(z - y0) < 0.25), mb = meanOf(inb.map((q) => q[1]));
          st = { hy: h(y0), mb, nb: inb.length };
        });
        v.legend([['accent', '$\\int f\\,d\\mu(y,\\cdot)$'], ['gold', 'binned average of $f(X)$', { dot: true }], ['green', '$f\\,\\mu(y,\\cdot)$', { area: true }]]);
        v.readout(() => st && `At $y=${fx(yS.value, 2)}$: kernel integral $\\int f\\,d\\mu(y,\\cdot)=${fx(st.hy, 4)}$; average of $f(X)$ over the ${st.nb} sample points with $|Y-y|<0.25$: $${fx(st.mb, 4)}$.`);
      },
    },
    {
      num: '4.1.17',
      kind: 'Theorem',
      name: 'Regular conditional distributions exist on nice spaces',
      statement: String.raw`If $(S,\mathcal S)$ is *nice* (there is a one-to-one map $\varphi:S\to\R$ with $\varphi$ and $\varphi^{-1}$ measurable; by 2.1.22 this holds for Borel subsets of complete separable metric spaces), then for every $X:\Omega\to S$ and σ-field $\mathcal G$ a regular conditional distribution of $X$ given $\mathcal G$ exists.

(Without such structure it can fail: the first counterexample was given by Dieudonné in 1948, as reported by Durrett.)`,
      idea: String.raw`Transport to $\R$ with $\varphi$. For each rational $q$ pick a version $G(q,\omega)$ of $P(\varphi(X)\le q\mid\mathcal G)$. Monotonicity (4.1.9b) holds off a null set for each pair $q<q'$; there are countably many, so one null set suffices, outside of which $q\mapsto G(q,\omega)$ is nondecreasing. Set $F(x,\omega)=\inf_{q>x}G(q,\omega)$. As in Helly's selection argument (3.2.12) this is a distribution function; monotone convergence for conditional expectations shows $F(x,\cdot)$ is still a version of $P(\varphi(X)\le x\mid\mathcal G)$. The measures defined by $F$, and the π–λ theorem, extend this from half-lines to all Borel sets, and $\varphi^{-1}$ pulls back to $S$.`,
      caption: String.raw`Here $S=\R$ and $\varphi=\mathrm{id}$, for one conditioning value (slide the mean $m$). The dots are versions $G(q)$ of $P(X\le q\mid\mathcal G)$ at rational points $q$ (you choose how many); since each version is only defined a.s., every point carries an independent error, drawn here between $-0.3\epsilon$ and $\epsilon$ (red = out of order). The blue step curve is $F(x)=\inf_{q>x}G(q)$. With the toggle on, the exceptional null set is discarded ($\epsilon$ becomes $0$) and $F$ is the true conditional distribution function (green dashed). With it off, $F$ is still nondecreasing and right-continuous, but it does not reach $0$ at $-\infty$ and misses the truth: this is exactly why the null sets must be thrown away.`,
      deps: ['prob-4.1.15a', 'prob-3.2.12', 'prob-4.1.9', 'prob-2.1.22'],
      credit: 'Existence on nice spaces as in Durrett; counterexample by Dieudonné, 1948 (as cited by Durrett)',
      verify: true,
      tags: ['conditional expectation', 'kernels'],
      viz(v) {
        const mS = v.slider('conditioning value (mean $m$)', -1.5, 1.5, 0.3, { step: 0.05 });
        const nS = v.slider('number of rationals $q$', 8, 80, 30, { int: true });
        const eS = v.slider('version error $\\epsilon$', 0, 0.25, 0.1, { step: 0.005 });
        const fix = v.toggle('discard the exceptional null set', false);
        let seed = 1; v.button('New versions', () => { seed++; });
        const s = v.stage({ x: [-4.5, 4.5], y: [-0.05, 1.12], axes: 'box', gutter: true, height: 360, xlabel: '$x$', title: 'from versions $G(q)$ to a distribution function $F(x)$' });
        let st = null;
        v.render(() => {
          const m = mS.value, n = nS.value, eps = fix.value ? 0 : eS.value, r = v.rng(seed * 13 + 3);
          const qs = Array.from({ length: n }, (_, k) => -4 + (8 * k) / (n - 1)), F0 = (x) => Phi(v.M, x - m);
          const G = qs.map((q) => clampN(F0(q) + (1.3 * r() - 0.3) * eps, 0, 1));
          // F(x) = inf over q > x of G(q)
          const suf = new Array(n + 1).fill(1); for (let k = n - 1; k >= 0; k--) suf[k] = Math.min(suf[k + 1], G[k]);
          const Fx = (x) => { let k = qs.findIndex((q) => q > x); if (k < 0) k = n; return suf[k]; };
          const pts = [[-4.5, suf[0]]]; qs.forEach((q, k) => { pts.push([q, suf[k]], [q, suf[k + 1]]); }); pts.push([4.5, suf[n]]);
          s.fn(F0, { color: 'green', width: 2.2, dash: [6, 4], n: 300 });
          s.path(pts, { color: 'accent', width: 3 });
          let bad = 0; G.forEach((g, k) => { const viol = (k > 0 && G[k - 1] > g + 1e-12) || (k + 1 < n && g > G[k + 1] + 1e-12); if (viol) bad++; s.dot(qs[k], g, { r: 3.6, color: viol ? 'red' : 'ink', alpha: 0.9 }); });
          let sup = 0; for (let i = 0; i <= 400; i++) { const x = -4 + (8 * i) / 400; sup = Math.max(sup, Math.abs(Fx(x) - F0(x))); }
          st = { bad, sup, low: Fx(-4.4), hi: Fx(4.4), n };
        });
        v.legend([['ink', 'versions $G(q)$', { dot: true }], ['red', 'out of order', { dot: true }], ['accent', '$F(x)=\\inf_{q>x}G(q)$'], ['green', 'true $P(X\\le x\\mid\\mathcal G)$', { dash: [6, 4] }]]);
        v.readout(() => st && `${st.bad} of ${st.n} versions violate monotonicity. $F(-4.4)=${fx(st.low, 3)}$ (should tend to $0$), $F(4.4)=${fx(st.hi, 3)}$ (should tend to $1$); $\\sup_x|F-\\text{truth}|=${fx(st.sup, 3)}$.`);
      },
    },
    {
      num: '4.1.18',
      kind: 'Theorem',
      name: 'Conditional law of X given Y as a kernel',
      statement: String.raw`Let $X,Y$ take values in a nice space $(S,\mathcal S)$ and $\mathcal G=\sigma(Y)$. Then there is a function $\mu:S\times\mathcal S\to[0,1]$ such that

(i) for each $A\in\mathcal S$, $\mu(Y(\omega),A)$ is a version of $P(X\in A\mid\mathcal G)$;

(ii) for a.e. $\omega$, $A\mapsto\mu(Y(\omega),A)$ is a probability measure on $(S,\mathcal S)$.

So the conditional law is a kernel in the *value* $y$ of $Y$, not merely a function of $\omega$.`,
      idea: String.raw`Run the construction of 4.1.17 with $\mathcal G=\sigma(Y)$. Each $G(q,\omega)$ is $\sigma(Y)$-measurable, hence of the form $H(q,Y(\omega))$ by the Doob–Dynkin factorization (a $\sigma(Y)$-measurable function is a measurable function of $Y$). Define $F(x,y)=\inf_{q>x}H(q,y)$; the same argument gives distribution functions for $P_Y$-almost every $y$, and the measures they define give $\mu(y,\cdot)$.`,
      caption: String.raw`Here $Y\sim N(0,1)$ and $X\mid Y=y\sim N(\sin(1.5\,y),\,(0.3+0.2|y|)^2)$. Left: a ridge plot of the kernel $\mu(y,\cdot)$ for several $y$. Middle: $n$ seeded points $(Y_i,X_i)$ from the joint law. Right: the same $Y_i$ with $X_i'$ drawn **from the kernel** $\mu(Y_i,\cdot)$ using fresh uniforms: the scatter looks the same. Switch the kernel to the marginal law of $X$ (forgetting $Y$) and the dependence disappears, as the correlation readout shows.`,
      deps: ['prob-4.1.17'],
      tags: ['conditional expectation', 'kernels'],
      viz(v) {
        const mode = v.select('kernel', [{ value: 'true', label: '$\\mu(y,\\cdot)$' }, { value: 'marg', label: 'marginal of $X$ (ignores $y$)' }], 'true');
        const nS = v.slider('$n$', 200, 4000, 1500, { log: true, int: true });
        const mean = (y) => Math.sin(1.5 * y), sd = (y) => 0.3 + 0.2 * Math.abs(y);
        const K = v.stage({ x: [-3.2, 3.2], y: [-2.15, 1.75], axes: 'box', gutter: true, height: 340, yticks: [], xlabel: '$x$ (ridges are shifted by $y$)', title: 'kernel densities $\\mu(y,\\cdot)$' });
        const A = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, height: 340, xlabel: '$Y$', ylabel: '$X$', title: 'joint sample $(Y,X)$', minWidth: 240 });
        const B = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, height: 340, xlabel: '$Y$', ylabel: "$X'\\sim\\mu(Y,\\cdot)$", title: 'rebuilt from the kernel', minWidth: 240 });
        const r = v.rng(5), Y = [], Z = [], U = []; for (let i = 0; i < 4000; i++) { Y.push(r.normal()); Z.push(r.normal()); U.push(r.normal()); }
        // marginal law of X by Monte Carlo from the same sample (for the 'marginal' kernel we resample X from the joint sample's X values)
        const Xs = Y.map((y, i) => mean(y) + sd(y) * Z[i]);
        const corr = (a, b) => { const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
        let st = null;
        v.render(() => {
          const n = nS.value, tr = mode.value === 'true';
          [-2, -1.2, -0.5, 0, 0.5, 1.2, 2].forEach((y, k) => {
            const sh = (y + 2) * 0.68 - 1.9, mu = (x) => (tr ? PHI((x - mean(y)) / sd(y)) / sd(y) : null);
            const dens = tr ? mu : (x) => { let c = 0; for (let i = 0; i < 400; i++) c += PHI((x - Xs[i]) / 0.25) / 0.25; return c / 400; };
            K.fn((x) => sh + 0.55 * dens(x) / 1.6, { color: tr ? 'accent' : 'purple', width: 1.8, n: 200, domain: [-3.2, 3.2] });
            K.hline(sh, { color: 'grid', width: 0.6 });
            K.tex(`y=${y}`, -3.1, sh + 0.12, { size: 11, color: 'muted', align: 'left' });
          });
          const ptsA = [], ptsB = [], xb = [];
          for (let i = 0; i < n; i++) {
            ptsA.push([Y[i], Xs[i]]);
            const xp = tr ? mean(Y[i]) + sd(Y[i]) * U[i] : Xs[(i * 7919 + 13) % 4000]; xb.push(xp); ptsB.push([Y[i], xp]);
          }
          A.dots(ptsA, { r: 1.7, color: 'accent', alpha: 0.4 }); B.dots(ptsB, { r: 1.7, color: tr ? 'green' : 'purple', alpha: 0.4 });
          const ya = Y.slice(0, n);
          A.fn(mean, { color: 'ink', width: 1.4, alpha: 0.7 }); B.fn(mean, { color: 'ink', width: 1.4, alpha: 0.7 });
          st = { c1: corr(ya, Xs.slice(0, n)), c2: corr(ya, xb), tr, m1: corr(ya.map((y) => y * y), Xs.slice(0, n).map((x) => Math.abs(x))), m2: corr(ya.map((y) => y * y), xb.map((x) => Math.abs(x))) };
        });
        v.legend([['accent', 'original $(Y,X)$'], ['green', "$(Y,X')$ via kernel"], ['purple', 'marginal instead'], ['ink', '$E(X\\mid Y=y)=\\sin 1.5y$']]);
        v.readout(() => st && `Correlation of $X$ with $Y$ in the original sample: $${fx(st.c1, 3)}$; in the rebuilt sample: $${fx(st.c2, 3)}$. Correlation of $|X|$ with $Y^2$ (the spread): $${fx(st.m1, 3)}$ original, $${fx(st.m2, 3)}$ rebuilt. ${st.tr ? 'The kernel reproduces the joint law.' : 'Ignoring $y$ destroys the dependence.'}`);
      },
    },
    {
      num: '4.2.1a',
      kind: 'Definition',
      name: 'Filtration and martingale (sub-, super-)',
      verify: true,
      statement: String.raw`A **filtration** is an increasing sequence of σ-fields $\mathcal F_0\subset\mathcal F_1\subset\cdots$. A sequence $X_n$ is **adapted** to $(\mathcal F_n)$ if $X_n\in\mathcal F_n$ for every $n$. An adapted sequence with $E|X_n|<\infty$ is a

- **martingale** if $E(X_{n+1}\mid\mathcal F_n)=X_n$ for all $n$ (a fair game);
- **supermartingale** if $E(X_{n+1}\mid\mathcal F_n)\le X_n$ (an unfavourable game);
- **submartingale** if $E(X_{n+1}\mid\mathcal F_n)\ge X_n$ (a favourable game).`,
      idea: String.raw`$\mathcal F_n$ is the information available at time $n$ and $X_n$ is your fortune. The definition asks that the best prediction of tomorrow's fortune from today's information equals (or is below, or above) today's fortune. The names are historical: "super" refers to superharmonic functions, for which the value at a point is at least the average over a ball, not to a favourable game. The word *martingale* in this probabilistic sense is due to Ville (1939), after earlier work of Lévy.`,
      caption: String.raw`A game of $\pm1$ steps that is won with probability $p$. The thin grey curves are 39 of 2000 seeded plays; the blue path is the one followed. Drag the gold handle along it to move the current time $m$: the two arrows show the possible next values, and the ring marks $E(X_{m+1}\mid\mathcal F_m)=X_m+2p-1$. For $p=\tfrac12$ it sits exactly on the current value (martingale); for $p>\tfrac12$ above it (submartingale); below for $p<\tfrac12$ (supermartingale). The dashed orange line is the mean over the 2000 plays, which tracks $X_0+n(2p-1)$.`,
      deps: ['prob-4.1.1a'],
      see: ['stoch-12.1'],
      credit: 'Ville, 1939 (the term); developed by Doob',
      tags: ['martingales', 'foundations'],
      viz(v) {
        const pS = v.slider('win probability $p$', 0.2, 0.8, 0.5, { step: 0.01 });
        const NN = 40;
        const s = v.stage({ x: [0, NN], y: [-16, 16], axes: 'box', gutter: true, height: 380, xlabel: 'time $n$', ylabel: '$X_n$', title: 'a game and its conditional mean one step ahead' });
        const r = v.rng(31), U = []; for (let k = 0; k < 2000; k++) { const u = new Float64Array(NN); for (let i = 0; i < NN; i++) u[i] = r(); U.push(u); }
        let mT = 12;
        const hd = s.handle(mT, 0, { color: 'gold', r: 8, label: '$m$', labelPos: 'n', constrain: (x) => { const m = clampN(Math.round(x), 0, NN - 1); return [m, cur[m]]; } });
        let cur = new Float64Array(NN + 1);
        let st = null;
        v.render(() => {
          const p = pS.value, paths = U.map((u) => { const a = new Float64Array(NN + 1); for (let i = 1; i <= NN; i++) a[i] = a[i - 1] + (u[i - 1] < p ? 1 : -1); return a; });
          cur = paths[0]; const mt = clampN(Math.round(hd.x), 0, NN - 1); hd.set(mt, cur[mt]);
          for (let k = 1; k < 40; k++) s.path(Array.from(paths[k], (y, i) => [i, y]), { color: 'muted', width: 0.8, alpha: 0.3 });
          const mean = meanPaths(paths); s.path(Array.from(mean, (y, i) => [i, y]), { color: 'orange', width: 2.2, dash: [6, 4] });
          s.path(Array.from(cur, (y, i) => [i, y]), { color: 'accent', width: 2.6 });
          const x0 = cur[mt], c = x0 + 2 * p - 1;
          s.line(mt, x0, mt + 1, x0 + 1, { color: 'green', width: 2.2 }); s.line(mt, x0, mt + 1, x0 - 1, { color: 'red', width: 2.2 });
          s.dot(mt + 1, x0 + 1, { r: 3.5, color: 'green' }); s.dot(mt + 1, x0 - 1, { r: 3.5, color: 'red' });
          s.dot(mt + 1, c, { r: 7, color: 'ink', hollow: true });
          cornerIn(s, `ring = $E(X_{m+1}\\mid\\mathcal F_m)$ at $m=${mt}$; green / red dots: the two possible next values`, 'tl');
          s.vline(mt, { color: 'faint', dash: [3, 4] });
          st = { mt, x0, c, p, mean: mean[NN] };
        });
        v.legend([['accent', 'followed play'], ['muted', 'other plays'], ['orange', 'mean over 2000 plays', { dash: [6, 4] }]]);
        v.readout(() => st && `At $m=${st.mt}$: $X_m=${st.x0}$ and $E(X_{m+1}\\mid\\mathcal F_m)=X_m+2p-1=${fx(st.c, 2)}$ ⇒ **${Math.abs(st.p - 0.5) < 0.005 ? 'martingale' : st.p > 0.5 ? 'submartingale' : 'supermartingale'}**. Mean of $X_{${NN}}$ over the plays: $${fx(st.mean, 2)}$ (theory $${fx(NN * (2 * st.p - 1), 2)}$).`);
      },
    },
    {
      num: '4.2.4',
      kind: 'Theorem',
      name: 'Supermartingales over several steps',
      statement: String.raw`If $X_n$ is a supermartingale, then for all $n>m$,
$$E(X_n\mid\mathcal F_m)\le X_m .$$`,
      idea: String.raw`The defining inequality gives the case $n=m+1$. For $n=m+k$ use the tower property (4.1.13): $E(X_{m+k}\mid\mathcal F_m)=E\big(E(X_{m+k}\mid\mathcal F_{m+k-1})\mid\mathcal F_m\big)\le E(X_{m+k-1}\mid\mathcal F_m)$, the inequality coming from the definition and monotonicity of conditional expectation (4.1.9b), and induct on $k$.`,
      caption: String.raw`A game with win probability $p$ (a supermartingale when $p\le\tfrac12$). Drag the gold handle along the blue base path to choose $m$. From that state $X_m$, 2000 independent continuations are simulated (a few are drawn faintly); their average at each later time $n$ is the orange curve, the estimate of $E(X_n\mid\mathcal F_m)$, which stays below the level $X_m$ (dashed) and follows the theoretical line $X_m+(n-m)(2p-1)$ (green). For $p>\tfrac12$ the process is no longer a supermartingale and the curve climbs above $X_m$.`,
      deps: ['prob-4.2.1a', 'prob-4.1.13'],
      tags: ['martingales'],
      viz(v) {
        const pS = v.slider('win probability $p$', 0.3, 0.7, 0.45, { step: 0.01 });
        const NN = 50;
        const s = v.stage({ x: [0, NN], y: [-24, 24], axes: 'box', gutter: true, height: 380, xlabel: 'time $n$', ylabel: '$X_n$', title: 'branching simulations from the state at time $m$' });
        const r = v.rng(77), Ub = new Float64Array(NN), Uc = []; for (let i = 0; i < NN; i++) Ub[i] = r(); for (let k = 0; k < 2000; k++) { const u = new Float64Array(NN); for (let i = 0; i < NN; i++) u[i] = r(); Uc.push(u); }
        let base = new Float64Array(NN + 1);
        const hd = s.handle(15, 0, { color: 'gold', r: 8, label: '$m$', labelPos: 'n', constrain: (x) => { const m = clampN(Math.round(x), 1, NN - 5); return [m, base[m]]; } });
        let st = null;
        v.render(() => {
          const p = pS.value; base = new Float64Array(NN + 1); for (let i = 1; i <= NN; i++) base[i] = base[i - 1] + (Ub[i - 1] < p ? 1 : -1);
          const m = clampN(Math.round(hd.x), 1, NN - 5); hd.set(m, base[m]);
          const sum = new Float64Array(NN + 1);
          for (let k = 0; k < Uc.length; k++) { let x = base[m]; sum[m] += x; const pts = [[m, x]]; for (let i = m + 1; i <= NN; i++) { x += Uc[k][i - 1] < p ? 1 : -1; sum[i] += x; pts.push([i, x]); } if (k < 14) s.path(pts, { color: 'muted', width: 0.8, alpha: 0.4 }); }
          s.path(Array.from(base.slice(0, m + 1), (y, i) => [i, y]), { color: 'accent', width: 2.8 });
          s.path(Array.from(base.slice(m), (y, i) => [m + i, y]), { color: 'accent', width: 1.2, alpha: 0.35 });
          s.line(m, base[m], NN, base[m], { color: 'ink', dash: [5, 4], width: 1.4 });
          s.line(m, base[m], NN, base[m] + (NN - m) * (2 * p - 1), { color: 'green', width: 1.8 });
          s.path(Array.from({ length: NN - m + 1 }, (_, i) => [m + i, sum[m + i] / Uc.length]), { color: 'orange', width: 3 });
          st = { m, xm: base[m], est: sum[NN] / Uc.length, th: base[m] + (NN - m) * (2 * p - 1), p };
        });
        v.legend([['accent', 'path up to $m$'], ['muted', 'continuations'], ['orange', 'estimate of $E(X_n\\mid\\mathcal F_m)$'], ['green', '$X_m+(n-m)(2p-1)$'], ['ink', '$X_m$', { dash: [5, 4] }]]);
        v.readout(() => st && `$m=${st.m}$, $X_m=${st.xm}$. At $n=${NN}$: estimated $E(X_n\\mid\\mathcal F_m)=${fx(st.est, 2)}$, exact $${fx(st.th, 2)}$; ${st.th <= st.xm + 1e-9 ? 'below $X_m$ as the theorem says' : '**above** $X_m$ since $p>\\tfrac12$ (not a supermartingale)'}.`);
      },
    },
    {
      num: '4.2.5',
      kind: 'Theorem',
      name: 'Submartingales and martingales over several steps',
      statement: String.raw`(i) If $X_n$ is a submartingale, then $E(X_n\mid\mathcal F_m)\ge X_m$ for $n>m$.

(ii) If $X_n$ is a martingale, then $E(X_n\mid\mathcal F_m)=X_m$ for $n>m$.`,
      idea: String.raw`If $X_n$ is a submartingale then $-X_n$ is a supermartingale, so 4.2.4 applies after changing signs (linearity of conditional expectation). A martingale is simultaneously a sub- and a supermartingale, which gives both inequalities, hence equality.`,
      caption: String.raw`A multiplicative game: $X_{n+1}=X_n\,Y_{n+1}$ with $Y=\exp(\sigma Z-\sigma^2/2+\delta)$, $Z$ standard normal, so $EY=e^{\delta}$. At $\delta=0$ it is a martingale; $\delta>0$ a submartingale. Drag the gold handle to pick $m$. From that state, 3000 seeded continuations are averaged (orange): for $\delta=0$ the average stays flat at $X_m$ (martingale, all $n>m$), for $\delta>0$ it grows like $X_me^{\delta(n-m)}$ (green), and for $\delta<0$ it falls.`,
      deps: ['prob-4.2.4'],
      tags: ['martingales'],
      viz(v) {
        const dS = v.slider('drift $\\delta$', -0.05, 0.05, 0, { step: 0.005 });
        const sS = v.slider('volatility $\\sigma$', 0.05, 0.4, 0.2, { step: 0.01 });
        const NN = 40;
        const s = v.stage({ x: [0, NN], y: [0, 3], axes: 'box', gutter: true, height: 380, xlabel: 'time $n$', ylabel: '$X_n$', title: 'multiplicative game, conditional mean from time $m$' });
        const r = v.rng(55), Zb = new Float64Array(NN), Zc = []; for (let i = 0; i < NN; i++) Zb[i] = r.normal(); for (let k = 0; k < 3000; k++) { const z = new Float64Array(NN); for (let i = 0; i < NN; i++) z[i] = r.normal(); Zc.push(z); }
        let base = new Float64Array(NN + 1);
        const hd = s.handle(12, 1, { color: 'gold', r: 8, label: '$m$', labelPos: 'n', constrain: (x) => { const m = clampN(Math.round(x), 1, NN - 5); return [m, base[m]]; } });
        let st = null;
        v.render(() => {
          const d = dS.value, sg = sS.value; base = new Float64Array(NN + 1); base[0] = 1; for (let i = 1; i <= NN; i++) base[i] = base[i - 1] * Math.exp(sg * Zb[i - 1] - sg * sg / 2 + d);
          const m = clampN(Math.round(hd.x), 1, NN - 5); hd.set(m, base[m]);
          const sum = new Float64Array(NN + 1), paths = [];
          for (let k = 0; k < Zc.length; k++) { let x = base[m]; sum[m] += x; const pts = [[m, x]]; for (let i = m + 1; i <= NN; i++) { x *= Math.exp(sg * Zc[k][i - 1] - sg * sg / 2 + d); sum[i] += x; pts.push([i, x]); } if (k < 14) paths.push(pts); }
          const top = Math.max(2.4, base[m] * 2.2);
          s.setView([0, NN], [0, top]);
          paths.forEach((pt) => s.path(pt, { color: 'muted', width: 0.8, alpha: 0.4 }));
          s.path(Array.from(base.slice(0, m + 1), (y, i) => [i, y]), { color: 'accent', width: 2.8 });
          s.line(m, base[m], NN, base[m], { color: 'ink', dash: [5, 4], width: 1.4 });
          s.fn((n) => base[m] * Math.exp(d * (n - m)), { domain: [m, NN], color: 'green', width: 1.8 });
          s.path(Array.from({ length: NN - m + 1 }, (_, i) => [m + i, sum[m + i] / Zc.length]), { color: 'orange', width: 3 });
          st = { m, xm: base[m], est: sum[NN] / Zc.length, th: base[m] * Math.exp(d * (NN - m)), d };
        });
        v.legend([['accent', 'path up to $m$'], ['muted', 'continuations'], ['orange', 'estimate of $E(X_n\\mid\\mathcal F_m)$'], ['green', '$X_me^{\\delta(n-m)}$'], ['ink', '$X_m$', { dash: [5, 4] }]]);
        v.readout(() => st && `$m=${st.m}$, $X_m=${fx(st.xm, 3)}$. At $n=${NN}$: estimate $${fx(st.est, 3)}$, exact $${fx(st.th, 3)}$ ⇒ **${Math.abs(st.d) < 1e-9 ? 'flat: martingale' : st.d > 0 ? 'rising: submartingale' : 'falling: supermartingale'}**.`);
      },
    },
  ],
};
