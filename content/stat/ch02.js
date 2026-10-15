// Statistical Inference — Chapter 2: Sufficiency and the likelihood principle (items 2.1–2.6; 2.7–2.12 in ch02-b.js, 2.13–2.17 in ch02-c.js)
//
// Sufficiency is abstract, so every item here is an experiment: data sets the reader edits, sample spaces small
// enough to enumerate, and repeated sampling seeded by the settings (helpers in ch02.shared.js).
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, corr, binned, viewPad, axisLabels, legender, titler,
  lfact, lchoose, choose, chi2Indep, fmtP, binorm, CYCLE, mnus,
} from './ch02.shared.js';

const popcount = (c) => { let k = 0; while (c) { k += c & 1; c >>= 1; } return k; };

export default {
  collection: 'stat',
  chapter: 2,
  title: 'Sufficiency and the likelihood principle',
  summary: String.raw`A sufficient statistic keeps everything a sample has to say about the parameter: once it is known, the rest of the data is a draw from a distribution that does not involve the parameter at all, and can be thrown away. The factorization theorem makes sufficiency easy to recognize, exponential families compress any sample to a statistic of fixed dimension, and minimal sufficiency, read off from likelihood ratios, says how far the compression can go. Ancillary statistics carry no information on their own, and when the sufficient statistic is also complete, Basu's theorem makes the two independent. The likelihood function then emerges as the carrier of evidence: the sufficiency and conditionality principles together imply the likelihood principle (Birnbaum), which significance tests violate, as the binomial and negative binomial readings of the same twelve coin tosses show.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Conditional distributions and conditional independence',
      statement: String.raw`Let $(X,Y)$ have a joint density $f(x,y)$ with respect to a product measure, and let $f_X(x)=\int f(x,y)\,dy$ be the marginal density of $X$ (Fubini). Where $f_X(x)>0$, the **conditional density** of $Y$ given $X=x$ is
$$f(y\mid x)=\frac{f(x,y)}{f_X(x)},$$
a probability density in $y$ for each fixed $x$, with $P(Y\in B\mid X)=\int_B f(y\mid X)\,dy$. Without densities, $P(Y\in B\mid X)$ is defined as the conditional expectation $E[\mathbf 1_B(Y)\mid X]$: the function $\varphi(X)$, unique up to $P$-null sets, with $P(Y\in B,\,X\in A)=\int_A\varphi\,dP_X$ for every $A$, which exists by the Radon–Nikodym theorem; on $\R^k$ these can be chosen to form a regular conditional distribution.

$X$ and $Y$ are **conditionally independent given $Z$**, written $X\perp Y\mid Z$, if $P(X\in A,\,Y\in B\mid Z)=P(X\in A\mid Z)\,P(Y\in B\mid Z)$ almost surely for all $A,B$; with densities, $f(x,y\mid z)=f(x\mid z)f(y\mid z)$, or equivalently $f(y\mid x,z)=f(y\mid z)$: once $Z$ is known, $X$ carries no further information about $Y$. Neither independence nor conditional independence implies the other.`,
      idea: String.raw`For a continuous $X$ the event $\{X=x\}$ has probability zero, so "conditioning on it" must be defined indirectly: cut the joint density along the line $X=x$ and rescale the slice to have area one, the area being exactly the marginal $f_X(x)$ by Fubini's theorem (rca-8.8). The measure-theoretic version is the Radon–Nikodym derivative (rca-6.10) of $A\mapsto P(Y\in B,\,X\in A)$ with respect to the law of $X$, which it is absolutely continuous to. Conditional independence is the notion sufficiency is made of: $T$ is sufficient when the data are conditionally independent of the parameter given $T$ (2.2). A common cause makes two variables dependent although they are independent within each of its levels; conditioning on a common effect does the reverse (Berkson's bias).`,
      caption: String.raw`Left: the joint density of $(X,Y)$, coloured by the level of a third variable $Z$. Drag the gold handle to move the slice $x=a$; right: the slice renormalised into $f(y\mid x=a)$ (blue), against the unsliced density of $Y$ (dashed) and a histogram of simulated points that fall in the gold strip. With a **common cause**, $X$ tells you about $Y$ (the blue curve moves as you drag), but condition on $Z=0$ or $Z=1$ and it stops moving: $X\perp Y\mid Z$. Make the within-level correlation non-zero to break conditional independence. With a **common effect** the picture reverses: independent overall, dependent once $Z$ is fixed.`,
      deps: ['rca-6.10', 'rca-8.8', 'prob-4.1.1a'],
      see: ['prob-4.1.15a', 'prob-4.1.8', 'prob-2.1.1a'],
      refs: ['Casella–Berger §4.2', 'Wasserman §17.2'],
      tags: ['conditional distribution', 'conditional independence'],
      viz(v) {
        const M = v.M;
        const strS = v.select('structure', [{ value: 'cause', label: 'common cause $X\\leftarrow Z\\rightarrow Y$' }, { value: 'effect', label: 'common effect $X\\rightarrow Z\\leftarrow Y$' }], 'cause');
        const condS = v.select('condition on', [{ value: 'none', label: 'nothing' }, { value: '0', label: '$Z=0$' }, { value: '1', label: '$Z=1$' }], 'none');
        const rhoS = v.slider('correlation within each level of $Z$', -0.8, 0.8, 0, { step: 0.05 });
        const sL = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], height: 350, axes: 'box', weight: 1.35, title: 'joint density of $(X,Y)$' });
        const sR = v.stage({ x: [0, 1], y: [-3.6, 3.6], height: 350, axes: 'box', weight: 0.75, minWidth: 220, title: 'the slice at $x=a$, renormalised' });
        const lg = legender(v), tR = titler(sR);
        const YT = 3.25;
        const h = sL.handle(0.9, YT, { color: 'gold', label: 'a', labelPos: 'e', constrain: (x) => [clamp(x, -3.1, 3.1), YT] });
        const C0 = [-1.1, -1.0], C1 = [1.1, 1.0], SD = 0.8;
        const dens = (x, y, str, cond, rho) => {
          if (str === 'cause') {
            const f0 = binorm(x, y, C0[0], C0[1], SD, rho), f1 = binorm(x, y, C1[0], C1[1], SD, rho);
            return cond === 'none' ? 0.5 * (f0 + f1) : cond === '0' ? f0 : f1;
          }
          const f = phi(x) * phi(y), s = x + y;
          return cond === 'none' ? f : cond === '1' ? (s > 0 ? 2 * f : 0) : s < 0 ? 2 * f : 0;
        };
        const pZ1 = (x, y, str, rho) => { if (str === 'effect') return x + y > 0 ? 1 : 0; const f0 = binorm(x, y, C0[0], C0[1], SD, rho), f1 = binorm(x, y, C1[0], C1[1], SD, rho); return f1 / (f0 + f1 || 1); };
        const NY = 241, Y0 = -3.6, Y1 = 3.6, dy = (Y1 - Y0) / (NY - 1), ys = Array.from({ length: NY }, (_, i) => Y0 + i * dy);
        const trapz = (f) => { let s = 0; for (let i = 0; i < f.length; i++) s += (i === 0 || i === f.length - 1 ? 0.5 : 1) * f[i]; return s * dy; };
        const sliceAt = (a, str, cond, rho) => { const f = ys.map((y) => dens(a, y, str, cond, rho)), Z = trapz(f); return Z > 1e-12 ? f.map((u) => u / Z) : null; };
        // marginal of Y within the condition, and the total-variation distance at every slice
        const mc = memo();
        const marg = (str, cond, rho) => mc([str, cond, rho].join('|'), () => {
          const xs = Array.from({ length: 301 }, (_, i) => -6 + (12 * i) / 300), g = ys.map(() => 0);
          for (const x of xs) for (let j = 0; j < NY; j++) g[j] += dens(x, ys[j], str, cond, rho);
          const Z = trapz(g), fy = g.map((u) => u / Z);
          let worst = 0, wa = 0;
          for (let k = 0; k <= 60; k++) { const a = -3 + k * 0.1, fs = sliceAt(a, str, cond, rho); if (!fs) continue; const tv = 0.5 * trapz(fs.map((u, j) => Math.abs(u - fy[j]))); if (tv > worst) { worst = tv; wa = a; } }
          let peak = 0; for (let i = 0; i <= 90; i++) for (let j = 0; j <= 90; j++) peak = Math.max(peak, dens(-3.6 + i * 0.08, -3.6 + j * 0.08, str, cond, rho));
          return { fy, worst, wa, peak };
        });
        // a seeded simulation of 40,000 triples (Z, X, Y)
        const sc = memo();
        const sim = (str, rho) => sc(str + '|' + rho, () => {
          const r = v.rng(hashStr('ci|' + str + '|' + rho)), N = 40000, X = new Float64Array(N), Yv = new Float64Array(N), Z = new Uint8Array(N);
          for (let i = 0; i < N; i++) {
            if (str === 'cause') { const z = r() < 0.5 ? 0 : 1, m = z ? C1 : C0, u = r.normal(), w = r.normal(); Z[i] = z; X[i] = m[0] + SD * u; Yv[i] = m[1] + SD * (rho * u + Math.sqrt(1 - rho * rho) * w); }
            else { X[i] = r.normal(); Yv[i] = r.normal(); Z[i] = X[i] + Yv[i] > 0 ? 1 : 0; }
          }
          return { N, X, Y: Yv, Z };
        });
        const pur = v.rgb('purple'), tea = v.rgb('teal');
        let info = null;
        v.render(() => {
          const str = strS.value, cond = condS.value, rho = str === 'cause' ? rhoS.value : 0, a = h.x;
          rhoS.el.hidden = str !== 'cause';
          viewPad(sL, [-3.6, 3.6], [-3.6, 3.6]);
          const mg = marg(str, cond, rho);
          sL.raster((x, y) => {
            const d = dens(x, y, str, cond, rho); if (d < mg.peak * 0.004) return null;
            const w = cond === 'none' ? pZ1(x, y, str, rho) : +cond, al = Math.pow(Math.min(1, d / mg.peak), 0.75);
            return [pur[0] + (tea[0] - pur[0]) * w, pur[1] + (tea[1] - pur[1]) * w, pur[2] + (tea[2] - pur[2]) * w, Math.round(235 * al)];
          }, { res: 3, key: [str, cond, rho].join('|') });
          sL.contour((x, y) => dens(x, y, str, cond, rho), [0.25, 0.5, 0.75].map((q) => q * mg.peak), { color: 'ink', width: 0.8, res: 90 });
          if (str === 'effect') sL.line(-3.6, 3.6, 3.6, -3.6, { color: 'muted', width: 1.2, dash: [5, 4] });
          sL.vband(a - 0.15, a + 0.15, { color: 'gold', alpha: 0.16 });
          sL.vline(a, { color: 'gold', width: 2.2 });
          axisLabels(sL, 'x', 'y');
          // right: the renormalised slice, rotated so that y runs up the page like on the left
          const fs = sliceAt(a, str, cond, rho), S = sim(str, rho);
          const hb = new Array(30).fill(0); let nIn = 0;
          for (let i = 0; i < S.N; i++) if (Math.abs(S.X[i] - a) < 0.15 && (cond === 'none' || S.Z[i] === +cond)) { const k = Math.floor(((S.Y[i] - Y0) / (Y1 - Y0)) * 30); if (k >= 0 && k < 30) hb[k]++; nIn++; }
          const bw = (Y1 - Y0) / 30, hd = hb.map((c) => (nIn ? c / (nIn * bw) : 0));
          const top = Math.max(0.5, ...(fs || [0]), ...mg.fy, ...hd) * 1.12;
          viewPad(sR, [0, top], [-3.6, 3.6]);
          hd.forEach((d, k) => { if (d > 0) sR.rect(0, Y0 + k * bw, d, Y0 + (k + 1) * bw, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 0.8 }); });
          if (fs) sR.path(ys.map((y, j) => [fs[j], y]), { color: 'accent', width: 3 });
          sR.path(ys.map((y, j) => [mg.fy[j], y]), { color: 'muted', width: 1.8, dash: [6, 4] });
          const tv = fs ? 0.5 * trapz(fs.map((u, j) => Math.abs(u - mg.fy[j]))) : NaN;
          tR(cond === 'none' ? 'slice at $x=a$, renormalised: $f(y\\mid x=a)$' : `slice within $Z=${cond}$: $f(y\\mid x=a,\\,Z=${cond})$`);
          const zl = cond === 'none' ? '' : `,\\,Z=${cond}`, zm = cond === 'none' ? '$f(y)$, no slice' : `$f(y\\mid Z=${cond})$, no slice`;
          lg([['purple', '$Z=0$', { area: true }], ['teal', '$Z=1$', { area: true }], ['accent', `$f(y\\mid x=a${zl})$`], ['muted', zm, { dash: true }], ['gold', `simulated points with $|X-a|<0.15$`, { area: true }]]);
          const pts = []; for (let i = 0; i < S.N; i++) if (cond === 'none' || S.Z[i] === +cond) pts.push(i);
          const rr = corr(pts, (i) => S.X[i], (i) => S.Y[i]);
          info = { tv, worst: mg.worst, wa: mg.wa, rr, nIn, str, cond, rho };
        });
        v.readout(() => {
          if (!info) return '';
          const { tv, worst, rr, nIn, str, cond, rho } = info, given = cond === 'none' ? '' : ` given $Z=${cond}$`;
          const ok = worst < 5e-3;
          const verdict = cond === 'none'
            ? (ok ? '**$X$ and $Y$ are independent**: every slice has the same shape' : '**$X$ and $Y$ are dependent**: the slice changes with $a$')
            : (ok ? `**$X\\perp Y\\mid Z$**: within $Z=${cond}$ every slice is the same` : `**not conditionally independent**: within $Z=${cond}$ the slice still moves with $a$`);
          return String.raw`simulated corr$(X,Y)$${given} = **${v.fix(rr, 3)}** · total-variation distance between the slice and the unsliced density: ${v.fix(tv, 3)} at $a=${v.fix(h.x, 2)}$, largest over all slices ${v.fix(worst, 3)} · ${verdict}` + (str === 'cause' && cond !== 'none' && Math.abs(rho) > 0 ? ` (within-level correlation ${v.fix(rho, 2)})` : '') + ` · ${commas(nIn)} simulated points in the strip`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Sufficient statistic',
      credit: 'Fisher, 1920 and 1922',
      statement: String.raw`Let the data $X$ have distribution $P_\theta$, $\theta\in\Theta$. A statistic $T=T(X)$ is **sufficient for $\theta$** if the conditional distribution of $X$ given $T$ does not depend on $\theta$: there is one version of $P_\theta(X\in A\mid T)$ that serves for every $\theta$.

Example: if $X_1,\dots,X_n$ are i.i.d. Bernoulli$(p)$ and $T=\sum X_i$, then for every 0–1 sequence $x$ with $t$ ones,
$$P_p(X=x\mid T=t)=\frac{p^t(1-p)^{n-t}}{\binom nt p^t(1-p)^{n-t}}=\binom nt^{-1},$$
uniform over the $\binom nt$ orderings whatever $p$ is. Consequences: the likelihood depends on $x$ only through $T(x)$ (up to a factor free of $\theta$), and for any procedure based on $X$ there is one based on $T$ alone (possibly randomised) with the same distribution under every $\theta$, hence the same risk.`,
      idea: String.raw`Given $T$, the full data are a draw from a known distribution, so a statistician who has only $T$ can regenerate a "fake" sample $X^*$ from $P(X\in\cdot\mid T)$, and $X^*$ has exactly the law of $X$ under every $\theta$ (this is conditioning, 2.1, run backwards). Nothing that could be done with $X$ is lost by keeping $T$: what is discarded is pure noise about $\theta$. In the Bernoulli case the parameter cancels between numerator and denominator because every sequence with $t$ heads has the same probability $p^t(1-p)^{n-t}$; the order of the heads is a uniformly random arrangement that tells nothing about $p$. The factorization theorem (2.3) turns this into a practical test.`,
      caption: String.raw`Top: two sequences of six tosses; click any coin to flip it. Bottom left: their likelihoods $p\mapsto P_p(X=x)$, which coincide exactly whenever the two sequences have the same number of heads. Bottom right: 40,000 sequences are simulated under $p_1$ (blue) and under $p_2$ (orange) and only those with the same $T$ as sequence A are kept; the bars are the conditional frequencies of the possible orderings (pictured under each bar). They are flat at $1/\binom6t$ (green) for both values of $p$. Switch the statistic to "heads in the first five tosses", which is not sufficient: the conditional frequencies now split and move with $p$.`,
      deps: ['stat-1.2', 'stat-2.1'],
      see: ['stat-2.3'],
      refs: ['Casella–Berger §6.2', 'Wasserman §9.13'],
      tags: ['sufficiency', 'data reduction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sufficient_statistic' },
      viz(v) {
        const M = v.M, n = 6;
        const statS = v.select('statistic', [{ value: 'sum', label: '$T=$ number of heads' }, { value: 'first5', label: 'heads in the first 5 tosses' }], 'sum');
        const p1S = v.slider('$p_1$', 0.05, 0.95, 0.3, { step: 0.01 });
        const p2S = v.slider('$p_2$', 0.05, 0.95, 0.75, { step: 0.01 });
        const sT = v.stage({ x: [0, 10.4], y: [0, 2.2], height: 128, axes: false, full: true, title: 'two data sets of six tosses (click a coin to flip it)' });
        const sL = v.stage({ x: [0, 1], y: [0, 0.02], height: 300, axes: 'box', weight: 0.9, title: 'likelihoods $L(p)=P_p(X=x)$' });
        const sR = v.stage({ x: [0, 21], y: [0, 0.1], height: 300, axes: 'box', weight: 1.2, xticks: [] });
        const tR = titler(sR);
        v.legend([['accent', 'data set A · simulated under $p_1$', { area: true }], ['orange', 'data set B · simulated under $p_2$', { area: true }], ['green', 'exact conditional probability']]);
        const data = { A: [1, 0, 1, 1, 0, 0], B: [0, 1, 1, 0, 1, 0] };
        sT.onClick((x, y) => { const row = y > 1.1 ? 'A' : 'B', i = Math.round(x) - 1; if (i >= 0 && i < n && Math.abs(x - (i + 1)) < 0.45) data[row][i] ^= 1; });
        let extra = 0;
        v.button('Shuffle B into a reordering of A', () => { const r = v.rng(hashStr('shuf' + data.A.join('') + extra++)); const a = data.A.slice(); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } data.B = a; });
        let more = 0; v.button('Simulate 40,000 more', () => { more++; });
        const code = (s) => s.reduce((c, b, i) => c | (b << i), 0);
        const cc = new Map();
        const counts = (p) => {
          const k = p.toFixed(3) + '|' + more; if (cc.has(k)) return cc.get(k);
          const cnt = new Float64Array(64); for (let m = 0; m <= more; m++) { const r = v.rng(hashStr('suff|' + p.toFixed(3) + '|' + m)); for (let i = 0; i < 40000; i++) { let c = 0; for (let b = 0; b < n; b++) if (r() < p) c |= 1 << b; cnt[c]++; } }
          if (cc.size > 40) cc.clear(); cc.set(k, cnt); return cnt;
        };
        const lik = (s, p) => { const t = s.reduce((a, b) => a + b, 0); return Math.pow(p, t) * Math.pow(1 - p, n - t); };
        let info = null;
        v.render(() => {
          // coins
          const tA = data.A.reduce((a, b) => a + b, 0), tB = data.B.reduce((a, b) => a + b, 0);
          for (const [row, yy] of [['A', 1.55], ['B', 0.6]]) {
            sT.text(row, 0.35, yy, { size: 16, weight: 700, color: row === 'A' ? 'accent' : 'orange' });
            data[row].forEach((b, i) => { sT.dot(i + 1, yy, { r: 15, color: b ? 'gold' : 'muted', hollow: !b, width: 2 }); sT.text(b ? 'H' : 'T', i + 1, yy, { align: 'center', size: 13, weight: 700, color: b ? 'ink' : 'muted', halo: false }); });
            const t = row === 'A' ? tA : tB;
            sT.tex(`T = ${t}\\qquad L(p)=p^{${t}}(1-p)^{${n - t}}`, 7.0, yy, { align: 'left', size: 16, color: row === 'A' ? 'accent' : 'orange' });
          }
          // likelihoods
          let top = 0; for (let i = 0; i <= 200; i++) { const p = i / 200; top = Math.max(top, lik(data.A, p), lik(data.B, p)); }
          viewPad(sL, [0, 1], [0, top * 1.15], { left: 46 });
          sL.fn((p) => lik(data.A, p), { domain: [0, 1], color: 'accent', width: 3.2 });
          sL.fn((p) => lik(data.B, p), { domain: [0, 1], color: 'orange', width: 2.2, dash: [7, 5] });
          sL.vline(tA / n, { color: 'accent', width: 1, dash: [3, 4] });
          axisLabels(sL, 'p', null);
          let gap = 0; for (let i = 0; i <= 400; i++) { const p = i / 400; gap = Math.max(gap, Math.abs(lik(data.A, p) - lik(data.B, p))); }
          // conditional frequencies of the orderings, given T(x) = T(A)
          const st = statS.value, TT = st === 'sum' ? (c) => popcount(c) : (c) => popcount(c & 31), t0 = TT(code(data.A));
          const cls = []; for (let c = 0; c < 64; c++) if (TT(c) === t0) cls.push(c);
          cls.sort((a, b) => { for (let i = 0; i < n; i++) { const d = ((b >> i) & 1) - ((a >> i) & 1); if (d) return d; } return 0; });
          const K = cls.length, c1 = counts(p1S.value), c2 = counts(p2S.value);
          const n1 = cls.reduce((s, c) => s + c1[c], 0), n2 = cls.reduce((s, c) => s + c2[c], 0);
          const f1 = cls.map((c) => (n1 ? c1[c] / n1 : 0)), f2 = cls.map((c) => (n2 ? c2[c] / n2 : 0));
          const exact = (c, p) => (st === 'sum' ? 1 / K : (1 / choose(5, t0)) * ((c >> 5) & 1 ? p : 1 - p));
          const e1 = cls.map((c) => exact(c, p1S.value)), e2 = cls.map((c) => exact(c, p2S.value));
          const yTop = Math.max(...f1, ...f2, ...e1, ...e2, 0.05) * 1.18;
          tR(st === 'sum' ? `given $T=${t0}$: the ${K} orderings, simulated under $p_1$ and $p_2$` : `given ${t0} head${t0 === 1 ? '' : 's'} in tosses 1–5: the ${K} sequences`);
          viewPad(sR, [0.2, K + 0.8], [0, yTop], { left: 40, bottom: 52 });
          for (let k = 0; k < K; k++) {
            sR.rect(k + 1 - 0.38, 0, k + 1 - 0.02, f1[k], { fill: 'accent', fillAlpha: 0.55, stroke: false });
            sR.rect(k + 1 + 0.02, 0, k + 1 + 0.38, f2[k], { fill: 'orange', fillAlpha: 0.55, stroke: false });
            if (st !== 'sum') { sR.line(k + 1 - 0.42, e1[k], k + 1 - 0.0, e1[k], { color: 'accent', width: 2.4 }); sR.line(k + 1, e2[k], k + 1 + 0.42, e2[k], { color: 'orange', width: 2.4 }); }
          }
          if (st === 'sum') sR.hline(1 / K, { color: 'green', width: 2.2 });
          // little pictures of the sequences under the bars
          const ctx = sR.ctx, Yb = sR.Y(0) + 6, sq = Math.max(3, Math.min(6, (sR.X(2) - sR.X(1)) * 0.32));
          ctx.save();
          for (let k = 0; k < K; k++) {
            const X = sR.X(k + 1), isA = cls[k] === code(data.A), isB = cls[k] === code(data.B);
            for (let b = 0; b < n; b++) {
              const on = (cls[k] >> b) & 1, Y = Yb + b * (sq + 1.2);
              ctx.fillStyle = on ? v.color('gold') : v.color('faint', 0.55); ctx.fillRect(X - sq / 2, Y, sq, sq);
            }
            if (isA) { ctx.strokeStyle = v.color('accent'); ctx.lineWidth = 1.6; ctx.strokeRect(X - sq / 2 - 2, Yb - 2, sq + 4, n * (sq + 1.2) + 2.8); }
            if (isB) { ctx.strokeStyle = v.color('orange'); ctx.lineWidth = 1.6; ctx.setLineDash([3, 2]); ctx.strokeRect(X - sq / 2 - 4, Yb - 4, sq + 8, n * (sq + 1.2) + 6.8); ctx.setLineDash([]); }
          }
          ctx.restore();
          const tab = [cls.map((c) => c1[c]), cls.map((c) => c2[c])], chi = chi2Indep(M, tab);
          info = { tA, tB, gap, K, n1, n2, f1, f2, chi, st, t0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { tA, tB, gap, K, n1, n2, f1, f2, chi, st } = info;
          const rng = (f) => `${v.fix(Math.min(...f), 3)}–${v.fix(Math.max(...f), 3)}`;
          const likTxt = tA === tB ? `$T(A)=T(B)=${tA}$: the two likelihoods are **identical** (largest gap $${gap === 0 ? '0' : v.sci(gap, 2)}$)` : `$T(A)=${tA}\\ne T(B)=${tB}$: different likelihoods (largest gap ${v.fix(gap, 4)})`;
          const condTxt = String.raw`kept ${commas(n1)} sequences under $p_1$ and ${commas(n2)} under $p_2$; conditional frequencies ${rng(f1)} and ${rng(f2)}` + (st === 'sum' ? ` (exact $1/${K}=${v.fix(1 / K, 3)}$ for every $p$)` : '');
          const test = `χ² test that both values of $p$ give the same conditional law: p-value ${fmtP(chi.p)}`;
          return `${likTxt} · ${condTxt} · ${test} — ` + (st === 'sum' ? '**the conditional law does not involve $p$: $T$ is sufficient**' : '**the conditional law moves with $p$: not sufficient**');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Fisher–Neyman factorization theorem',
      credit: 'Fisher, 1922; Neyman, 1935; Halmos & Savage, 1949',
      statement: String.raw`Let $\{f(x\mid\theta):\theta\in\Theta\}$ be densities of the data $X$ with respect to a common σ-finite measure (for example counting measure, or Lebesgue measure). A statistic $T$ is sufficient for $\theta$ if and only if there are non-negative functions $g$ and $h$ with
$$f(x\mid\theta)=g\big(T(x),\theta\big)\,h(x)\qquad\text{for all }x\text{ and }\theta$$
(almost everywhere, in the continuous case). The factor $g$ may depend on $\theta$ but sees the data only through $T(x)$; the factor $h$ may depend on the data in any way but not on $\theta$.

Examples: Poisson, $\prod_i e^{-\lambda}\lambda^{x_i}/x_i!=\big[e^{-n\lambda}\lambda^{\sum x_i}\big]\cdot\big[1/\prod x_i!\big]$, so $\sum X_i$ is sufficient; uniform on $\{0,\dots,\theta\}$ or $(0,\theta)$, $f=\big[(\text{const})^{-n}\mathbf 1\{\max x_i\le\theta\}\big]\cdot\mathbf 1\{\min x_i\ge0\}$, so $\max X_i$ is sufficient; $N(\mu,\sigma^2)$, where $(\sum X_i,\sum X_i^2)$ is.`,
      idea: String.raw`Discrete case. If $T$ is sufficient, take $g(t,\theta)=P_\theta(T=t)$ and $h(x)=P(X=x\mid T=T(x))$, which is free of $\theta$ by sufficiency; their product is $P_\theta(X=x)$. Conversely, given a factorization, $P_\theta(X=x\mid T=t)=g(t,\theta)h(x)\big/\sum_{T(y)=t}g(t,\theta)h(y)=h(x)/\sum_{T(y)=t}h(y)$, and $\theta$ cancels. The general dominated case replaces sums by Radon–Nikodym derivatives (rca-6.10), with Halmos and Savage's lemma that a dominated family has a countable subfamily with the same null sets supplying a single dominating probability.`,
      caption: String.raw`The sample space of two observations $(x_1,x_2)$, one cell per point ($x_1$ across, $x_2$ up), with a thread joining the cells of each level set of $T$ (gold: the level set of the selected cell). The three panels are the factors of the necessity proof: $g(T(x),\theta)=P_\theta(T=T(x))$ (constant on each level set), $h(x)=P(X=x\mid T=T(x))$, and their product $f(x\mid\theta)$. Drag $\lambda$ (or $\theta$): when $T$ is sufficient only $g$ and $f$ change and the middle panel stays frozen. Choose a statistic that is not sufficient for the model and the middle panel changes with the parameter: no $\theta$-free factor $h$ exists. Click a cell to read its numbers.`,
      deps: ['stat-2.2', 'rca-6.10'],
      refs: ['Casella–Berger §6.2'],
      tags: ['sufficiency', 'factorization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sufficient_statistic#Fisher%E2%80%93Neyman_factorization_theorem' },
      viz(v) {
        const K = 9;
        const modS = v.select('model', [{ value: 'pois', label: 'two Poisson$(\\lambda)$ counts' }, { value: 'unif', label: 'two uniforms on $\\{0,\\dots,\\theta\\}$' }], 'pois');
        const stS = v.select('statistic $T$', [{ value: 'sum', label: '$x_1+x_2$' }, { value: 'max', label: '$\\max(x_1,x_2)$' }, { value: 'x1', label: '$x_1$ alone' }], 'sum');
        const lamS = v.slider('$\\lambda$', 0.3, 6, 2.5, { step: 0.05 });
        const thS = v.slider('$\\theta$', 2, 9, 6, { int: true });
        const mk = (title) => v.stage({ x: [-0.6, K + 0.6], y: [-0.6, K + 0.6], equal: true, height: 290, axes: 'box', xticks: [0, 3, 6, 9], yticks: [0, 3, 6, 9], minWidth: 240, title });
        const sg = mk('$g(T(x),\\theta)=P_\\theta(T=T(x))$'), sh = mk('$h(x)=P(X=x\\mid T=T(x))$'), sf = mk('$f(x\\mid\\theta)=g\\cdot h$');
        let sel = [2, 3];
        for (const s of [sg, sh, sf]) s.onClick((x, y) => { const i = Math.round(x), j = Math.round(y); if (i >= 0 && i <= K && j >= 0 && j <= K) sel = [i, j]; });
        const Tf = { sum: (a, b) => a + b, max: (a, b) => Math.max(a, b), x1: (a) => a };
        const levelPaths = (st) => { const out = []; for (let t = 0; t <= 2 * K; t++) { let pts = []; if (st === 'sum') { for (let i = Math.max(0, t - K); i <= Math.min(t, K); i++) pts.push([i, t - i]); } else if (t <= K) pts = st === 'max' ? [[t, 0], [t, t], [0, t]] : [[t, 0], [t, K]]; if (pts.length > 1) out.push([t, pts]); } return out; };
        // marginal law q(k) of one observation, on 0..60
        const q = (mod, par) => { const out = new Float64Array(61); if (mod === 'pois') { out[0] = Math.exp(-par); for (let k = 1; k <= 60; k++) out[k] = (out[k - 1] * par) / k; } else for (let k = 0; k <= par; k++) out[k] = 1 / (par + 1); return out; };
        const gOf = (mod, st, par) => { // exact P(T = t) over the whole sample space
          const qq = q(mod, par), F = []; let c = 0; for (let k = 0; k <= 60; k++) { c += qq[k]; F.push(c); }
          return (t) => { if (st === 'x1') return qq[t]; if (st === 'max') return F[t] * F[t] - (t ? F[t - 1] * F[t - 1] : 0); let s = 0; for (let k = 0; k <= t; k++) s += qq[k] * qq[t - k]; return s; };
        };
        const table = (mod, st, par) => {
          const qq = q(mod, par), g = gOf(mod, st, par), out = [];
          for (let i = 0; i <= K; i++) { out.push([]); for (let j = 0; j <= K; j++) { const f = qq[i] * qq[j], G = g(Tf[st](i, j)); out[i].push({ f, g: G, h: G > 0 ? f / G : null }); } }
          return out;
        };
        const drift = memo();
        const hDrift = (mod, st, cur) => drift([mod, st, cur.map((r) => r.map((c) => (c.h == null ? '-' : c.h.toFixed(6))).join(',')).join(';')].join('|'), () => {
          const pars = mod === 'pois' ? Array.from({ length: 24 }, (_, k) => 0.3 + (5.7 * k) / 23) : [2, 3, 4, 5, 6, 7, 8, 9];
          let d = 0;
          for (const par of pars) { const t = table(mod, st, par); for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) { const a = t[i][j].h, b = cur[i][j].h; if (a != null && b != null) d = Math.max(d, Math.abs(a - b)); } }
          return d;
        });
        let info = null;
        v.render(() => {
          const mod = modS.value, st = stS.value, par = mod === 'pois' ? lamS.value : thS.value;
          lamS.el.hidden = mod !== 'pois'; thS.el.hidden = mod === 'pois';
          const tb = table(mod, st, par), T = Tf[st];
          let mg = 0, mh = 0, mf = 0; for (const r of tb) for (const c of r) { mg = Math.max(mg, c.g); mf = Math.max(mf, c.f); if (c.h != null) mh = Math.max(mh, c.h); }
          const [si, sj] = sel, ts = T(si, sj);
          const panels = [[sg, 'g', 'accent', mg], [sh, 'h', 'orange', mh], [sf, 'f', 'purple', mf]];
          const paths = levelPaths(st);
          for (const [s, key, col, mx] of panels) {
            viewPad(s, [-0.6, K + 0.6], [-0.6, K + 0.6], { left: 22, bottom: 18 });
            for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) {
              const val = tb[i][j][key];
              if (val == null) { s.rect(i - 0.5, j - 0.5, i + 0.5, j + 0.5, { fill: 'faint', fillAlpha: 0.12, hatch: 'faint', hatchGap: 5, stroke: false }); continue; }
              if (val > 0) s.rect(i - 0.5, j - 0.5, i + 0.5, j + 0.5, { fill: col, fillAlpha: 0.06 + 0.84 * Math.pow(val / mx, 0.6), stroke: false });
            }
            for (let i = 0; i <= K + 1; i++) { s.line(i - 0.5, -0.5, i - 0.5, K + 0.5, { color: 'panel', width: 1.2 }); s.line(-0.5, i - 0.5, K + 0.5, i - 0.5, { color: 'panel', width: 1.2 }); }
            // level sets of T, drawn as threads through the cells they contain
            for (const [t, pts] of paths) s.path(pts, { color: t === ts ? 'gold' : 'ink', width: t === ts ? 3.2 : 1.1, alpha: t === ts ? 1 : 0.38 });
            s.rect(si - 0.5, sj - 0.5, si + 0.5, sj + 0.5, { color: 'gold', width: 3.4 });
          }
          let sumH = 0; for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) if (T(i, j) === ts && tb[i][j].h != null) sumH += tb[i][j].h;
          info = { c: tb[si][sj], ts, sumH, drift: hDrift(mod, st, tb), mod, st, par };
        });
        v.readout(() => {
          if (!info) return '';
          const { c, ts, sumH, drift: d, mod, st } = info, P = mod === 'pois' ? '\\lambda' : '\\theta', [si, sj] = sel;
          const tn = { sum: 'x_1+x_2', max: '\\max(x_1,x_2)', x1: 'x_1' }[st];
          const cell = c.h == null ? `cell $x=(${si},${sj})$ lies outside the support: $f=0$ and $h$ is undefined` : String.raw`cell $x=(${si},${sj})$, $T(x)=${tn}=${ts}$: $f(x\mid ${P})=${v.fix(c.f, 5)}=g\cdot h=${v.fix(c.g, 5)}\times${v.fix(c.h, 5)}$; the gold level set's $h$ values add to ${v.fix(sumH, 4)}`;
          const verdict = d < 1e-9
            ? String.raw`over the whole range of $${P}$ the middle panel never changes (largest change $${v.sci(Math.max(d, 1e-17), 1)}$): **$h$ is free of $${P}$, so $T$ is sufficient**`
            : String.raw`as $${P}$ moves, $h$ changes by up to **${v.fix(d, 3)}**: no factor free of $${P}$ exists, **$T$ is not sufficient** for this model`;
          return `${cell} · ${verdict}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Proposition',
      name: 'Sufficient statistics of exponential families',
      credit: 'Darmois, 1935; Koopman, 1936; Pitman, 1936',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a $k$-parameter exponential family $p_\eta(x)=h(x)\exp\big(\eta\cdot T(x)-A(\eta)\big)$. Then the joint density is
$$\prod_{i=1}^n p_\eta(x_i)=\Big[\prod_i h(x_i)\Big]\exp\Big(\eta\cdot\sum_{i=1}^n T(x_i)-nA(\eta)\Big),$$
so the $k$-dimensional statistic $\sum_i T(X_i)$ (equivalently the average $\bar T$) is sufficient, whatever the sample size. For example $\sum X_i$ for Bernoulli, Poisson and exponential samples, $(\sum X_i,\sum X_i^2)$ for $N(\mu,\sigma^2)$, $(\sum\log X_i,\sum X_i)$ for the gamma and $(\sum\log X_i,\sum\log(1-X_i))$ for the beta family.

Conversely (the Pitman–Koopman–Darmois theorem), for i.i.d. samples from a family of smooth densities whose support does not depend on the parameter, a sufficient statistic whose dimension stays bounded as $n$ grows exists only if the family is exponential. The uniform $U(0,\theta)$ escapes because its support moves; for the Cauchy location family nothing smaller than the whole set of order statistics is sufficient.`,
      idea: String.raw`The exponential form puts all the interaction between data and parameter into the inner product $\eta\cdot T(x)$; multiplying $n$ densities adds the inner products, and the factorization theorem (2.3) does the rest with $g(t,\eta)=e^{\eta\cdot t-nA(\eta)}$ and $h=\prod h(x_i)$. Geometrically, each observation is mapped to the point $T(x_i)$ on a fixed curve or surface in $\R^k$, and the sample is summarised by their centroid, which lies in the convex hull of the curve; the log-likelihood $n\big(\eta\cdot\bar T-A(\eta)\big)$ is then a function of that one point (1.17 supplies $A$).`,
      caption: String.raw`Pick a family in the gallery (or with the selector). Left: each observation $x_i$ mapped to $T(x_i)$, on the curve $\{T(x)\}$ for two-parameter families, and their average $\bar T$ (green) — the whole sample compressed to $k$ numbers. Right: the log-likelihood from the full data (blue) and the one rebuilt from $(n,\bar T)$ alone (orange, dashed) coincide exactly; in two dimensions they are contours at the 50%, 90% and 99% levels. Grow $n$ or draw a new sample: the point moves, the dimension does not. The last two rows break the pattern: the uniform's support moves with $\theta$, and two Cauchy samples with the same $\sum x$ and $\sum x^2$ still have different likelihoods.`,
      deps: ['stat-2.3', 'stat-1.17'],
      refs: ['Casella–Berger §6.2', 'Casella–Berger §3.4'],
      tags: ['exponential family', 'sufficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exponential_family#Data_reduction' },
      viz(v) {
        const M = v.M, lg = M.lgamma, lb = M.lbeta;
        const ROWS = [
          { id: 'bern', fam: '$\\text{Bernoulli}(p)$', eta: '$\\log\\frac{p}{1-p}$', T: '$x$', A: '$\\log(1+e^{\\eta})$' },
          { id: 'pois', fam: '$\\text{Poisson}(\\lambda)$', eta: '$\\log\\lambda$', T: '$x$', A: '$e^{\\eta}$' },
          { id: 'expo', fam: '$\\text{Exp}(\\lambda)$', eta: '$-\\lambda$', T: '$x$', A: '$-\\log(-\\eta)$' },
          { id: 'norm', fam: '$N(\\mu,\\sigma^2)$', eta: '$\\big(\\frac{\\mu}{\\sigma^2},-\\frac{1}{2\\sigma^2}\\big)$', T: '$(x,\\,x^2)$', A: '$-\\frac{\\eta_1^2}{4\\eta_2}-\\frac12\\log(-2\\eta_2)$' },
          { id: 'gam', fam: '$\\text{Gamma}(\\alpha,\\beta)$', eta: '$(\\alpha-1,\\,-\\beta)$', T: '$(\\log x,\\,x)$', A: '$\\log\\Gamma(\\eta_1{+}1)-(\\eta_1{+}1)\\log(-\\eta_2)$' },
          { id: 'beta', fam: '$\\text{Beta}(a,b)$', eta: '$(a-1,\\,b-1)$', T: '$(\\log x,\\,\\log(1{-}x))$', A: '$\\log B(\\eta_1{+}1,\\,\\eta_2{+}1)$' },
          { id: 'unif', fam: '$U(0,\\theta)$', eta: '$\\text{none: support moves}$', T: '$\\max_i x_i$', A: '$\\text{not exponential}$' },
          { id: 'cauchy', fam: '$\\text{Cauchy}(\\theta,1)$', eta: '$\\text{none}$', T: '$(x_{(1)},\\dots,x_{(n)})$', A: '$\\text{not exponential}$' },
        ];
        const famS = v.select('family', ROWS.map((r) => ({ value: r.id, label: { bern: 'Bernoulli', pois: 'Poisson', expo: 'exponential', norm: 'normal', gam: 'gamma', beta: 'beta', unif: 'uniform', cauchy: 'Cauchy' }[r.id] })), 'norm');
        const nS = v.slider('sample size $n$', 5, 200, 30, { int: true, log: true });
        let seed = 1; v.button('New sample', () => { seed++; });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 262, axes: false, full: true });
        const tab = v.table(sT, { rows: ROWS.length, cols: 4, square: false, colWeights: [1.05, 1.25, 1.05, 1.75], maxCell: 28, cellAspect: 7, size: 13.5, colLabels: ['family', 'natural parameter η', 'sufficient statistic T', 'log-partition A(η)'], margin: 4 });
        sT.onClick((x, y) => { const c = tab.hit(x, y); if (c && c.i >= 0) famS.set(ROWS[c.i].id); });
        const sL = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', weight: 1 });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', weight: 1 });
        const tL = titler(sL), tR = titler(sR), lgd = legender(v);
        const TRUE = { bern: 0.35, pois: 3, expo: 1.5, norm: [1, 0.8], gam: [3, 2], beta: [2, 5], unif: 2 };
        const dc = memo();
        const data = () => dc([famS.value, nS.value, seed].join('|'), () => {
          const f = famS.value, n = nS.value, r = v.rng(hashStr('ef|' + f + '|' + seed)), D = M.dist, xs = [];
          const draw = { bern: () => (r() < 0.35 ? 1 : 0), pois: () => D.poisson(3).sample(r), expo: () => D.exponential(1.5).sample(r), norm: () => 1 + 0.8 * r.normal(), gam: () => D.gamma(3, 0.5).sample(r), beta: () => D.beta(2, 5).sample(r), unif: () => 2 * r(), cauchy: () => Math.tan(Math.PI * (r() - 0.5)) }[f];
          for (let i = 0; i < n; i++) xs.push(draw());
          const out = { f, n, xs };
          if (f === 'cauchy') { // sample B: rotate disjoint triples of A about the (1,1,1) axis, which keeps Σx and Σx² exactly
            const ys = xs.slice(), idx = xs.map((_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
            const c = Math.cos(Math.PI / 2), s3 = Math.sin(Math.PI / 2) / Math.sqrt(3);
            for (let k = 0; k + 2 < n; k += 3) {
              const [i, j, l] = [idx[k], idx[k + 1], idx[k + 2]], m = (xs[i] + xs[j] + xs[l]) / 3, d = [xs[i] - m, xs[j] - m, xs[l] - m];
              const ux = [d[2] - d[1], d[0] - d[2], d[1] - d[0]]; // (1,1,1) × d
              ys[i] = m + c * d[0] + s3 * ux[0]; ys[j] = m + c * d[1] + s3 * ux[1]; ys[l] = m + c * d[2] + s3 * ux[2];
            }
            out.ys = ys;
          }
          return out;
        });
        // full-data log-likelihood and the one computed from (n, T̄) alone (constants dropped)
        const LL = {
          bern: { full: (xs, p) => xs.reduce((s, x) => s + (x ? Math.log(p) : Math.log1p(-p)), 0), fromT: (n, S, p) => S * Math.log(p) + (n - S) * Math.log1p(-p), T: (xs) => xs.reduce((a, b) => a + b, 0), win: [0.005, 0.995], pl: 'p' },
          pois: { full: (xs, l) => xs.reduce((s, x) => s + x * Math.log(l) - l - lfact(x), 0), fromT: (n, S, l) => S * Math.log(l) - n * l, T: (xs) => xs.reduce((a, b) => a + b, 0), win: [0.05, 8], pl: '\\lambda' },
          expo: { full: (xs, l) => xs.reduce((s, x) => s + Math.log(l) - l * x, 0), fromT: (n, S, l) => n * Math.log(l) - l * S, T: (xs) => xs.reduce((a, b) => a + b, 0), win: [0.05, 5], pl: '\\lambda' },
          unif: { full: (xs, t) => xs.reduce((s, x) => s + (x <= t ? -Math.log(t) : -Infinity), 0), fromT: (n, mx, t) => (t >= mx ? -n * Math.log(t) : -Infinity), T: (xs) => Math.max(...xs), win: [0.02, 4], pl: '\\theta' },
          cauchy: { full: (xs, t) => xs.reduce((s, x) => s - Math.log1p((x - t) ** 2), 0), win: [-3, 3], pl: '\\theta' },
          norm: { full: (xs, m, s) => (s <= 0 ? -1e9 : xs.reduce((a, x) => a - Math.log(s) - ((x - m) ** 2) / (2 * s * s), 0)), fromT: (n, T, m, s) => (s <= 0 ? -1e9 : -n * Math.log(s) - (T[1] - 2 * m * T[0] + n * m * m) / (2 * s * s)), T: (xs) => [xs.reduce((a, b) => a + b, 0), xs.reduce((a, b) => a + b * b, 0)], win: [[-3, 5], [0.1, 4]], pl: ['\\mu', '\\sigma'], map: (x) => [x, x * x] },
          gam: { full: (xs, a, b) => (a <= 0 || b <= 0 ? -1e9 : xs.reduce((s, x) => s + a * Math.log(b) - lg(a) + (a - 1) * Math.log(x) - b * x, 0)), fromT: (n, T, a, b) => (a <= 0 || b <= 0 ? -1e9 : n * (a * Math.log(b) - lg(a)) + (a - 1) * T[0] - b * T[1]), T: (xs) => [xs.reduce((a, x) => a + Math.log(x), 0), xs.reduce((a, b) => a + b, 0)], win: [[0.2, 25], [0.1, 18]], pl: ['\\alpha', '\\beta'], map: (x) => [Math.log(x), x] },
          beta: { full: (xs, a, b) => (a <= 0 || b <= 0 ? -1e9 : xs.reduce((s, x) => s + (a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - lb(a, b), 0)), fromT: (n, T, a, b) => (a <= 0 || b <= 0 ? -1e9 : (a - 1) * T[0] + (b - 1) * T[1] - n * lb(a, b)), T: (xs) => [xs.reduce((a, x) => a + Math.log(x), 0), xs.reduce((a, x) => a + Math.log1p(-x), 0)], win: [[0.2, 15], [0.2, 35]], pl: ['a', 'b'], map: (x) => [Math.log(x), Math.log1p(-x)] },
        };
        const wc = memo();
        const window2 = (d) => wc(d.f + '|' + d.n + '|' + seed, () => { // adaptive window: the region where the relative log-likelihood exceeds −9
          const L = LL[d.f], T = L.T(d.xs), [[a0, a1], [b0, b1]] = L.win, G = 90; let best = -Infinity; const val = [];
          for (let i = 0; i <= G; i++) { val.push([]); for (let j = 0; j <= G; j++) { const a = a0 + ((a1 - a0) * i) / G, b = b0 + ((b1 - b0) * j) / G, l = L.fromT(d.n, T, a, b); val[i].push(l); if (l > best) best = l; } }
          let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
          for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) if (val[i][j] > best - 9) { const a = a0 + ((a1 - a0) * i) / G, b = b0 + ((b1 - b0) * j) / G; lo = [Math.min(lo[0], a), Math.min(lo[1], b)]; hi = [Math.max(hi[0], a), Math.max(hi[1], b)]; }
          const pa = 0.12 * (hi[0] - lo[0]) + 0.02, pb = 0.12 * (hi[1] - lo[1]) + 0.02;
          return { x: [Math.max(a0, lo[0] - pa), Math.min(a1, hi[0] + pa)], y: [Math.max(b0, lo[1] - pb), Math.min(b1, hi[1] + pb)], T };
        });
        let info = null;
        v.render(() => {
          const d = data(), f = d.f, L = LL[f], row = ROWS.findIndex((r) => r.id === f), n = d.n;
          tab.draw({ value: (i, j) => [ROWS[i].fam, ROWS[i].eta, ROWS[i].T, ROWS[i].A][j], activeRow: row, activeColor: row >= 6 ? 'red' : 'accent', fill: (i) => (i === row ? [row >= 6 ? 'red' : 'accent', 0.1] : i >= 6 ? ['faint', 0.08] : null) });
          // ── left: the data in T-space
          if (L.map) {
            const P = d.xs.map(L.map), Tb = [mean(P.map((p) => p[0])), mean(P.map((p) => p[1]))];
            let x0 = Math.min(...P.map((p) => p[0])), x1 = Math.max(...P.map((p) => p[0])), y0 = Math.min(...P.map((p) => p[1])), y1 = Math.max(...P.map((p) => p[1]));
            const px = 0.1 * (x1 - x0), py = 0.12 * (y1 - y0); viewPad(sL, [x0 - px, x1 + px], [y0 - py, y1 + py], { left: 40 }); sL.setTicks(undefined, null);
            const hull = M.hull(P); if (hull.length > 2) sL.poly(hull, { fill: 'gold', fillAlpha: 0.1, color: 'gold', width: 1, alpha: 0.5 });
            const xr = f === 'norm' ? [x0 - px, x1 + px] : f === 'gam' ? [Math.exp(x0 - px), Math.exp(x1 + px)] : [1e-4, 1 - 1e-4];
            sL.curve((t) => L.map(xr[0] + (xr[1] - xr[0]) * t), 0, 1, { color: 'muted', width: 1.6, n: 400 });
            sL.dots(P, { r: 3, color: 'gold' });
            sL.dot(Tb[0], Tb[1], { r: 7, color: 'green' });
            sL.tex('\\bar T', Tb[0], Tb[1], { dx: 12, dy: -10, color: 'green', size: 17, align: 'left' });
            tL(`${n} points $T(x_i)=${ROWS[row].T.slice(1, -1)}$ and their average $\\bar T$`);
            axisLabels(sL, { norm: 'x', gam: '\\log x', beta: '\\log x' }[f], { norm: 'x^2', gam: 'x', beta: '\\log(1-x)' }[f]);
          } else {
            const xs = d.xs, disc = f === 'bern' || f === 'pois';
            const lo = Math.min(...xs, f === 'cauchy' ? Math.min(...d.ys) : Infinity), hi = Math.max(...xs, f === 'cauchy' ? Math.max(...d.ys) : -Infinity);
            const a = f === 'cauchy' ? Math.max(-15, lo - 0.5) : disc ? -0.6 : 0, b = f === 'cauchy' ? Math.min(15, hi + 0.5) : disc ? Math.max(1.6, hi + 0.6) : hi * 1.08;
            viewPad(sL, [a, b], [0, 1], { left: 12 }); sL.setTicks(undefined, []);
            const row1 = (vals, y, col) => { if (disc) { const cnt = new Map(); vals.forEach((x) => { const c = cnt.get(x) || 0; cnt.set(x, c + 1); sL.dot(x, y + 0.035 * c, { r: 3.4, color: col }); }); } else vals.forEach((x, i) => sL.dot(x, y + 0.11 * (((i * 0.618034) % 1) - 0.5), { r: 3.2, color: col, alpha: 0.85 })); };
            if (f === 'cauchy') {
              row1(d.xs, 0.68, 'gold'); row1(d.ys, 0.25, 'red');
              const A = moments(d.xs); sL.vline(A.mean, { color: 'green', width: 2, dash: [5, 4] });
              sL.text('sample A', a, 0.86, { dx: 6, color: 'gold', weight: 700, size: 12, align: 'left' }); sL.text('sample B: same Σx and Σx²', a, 0.43, { dx: 6, color: 'red', weight: 700, size: 12, align: 'left' });
              tL('two Cauchy samples with equal $\\sum x_i$ and $\\sum x_i^2$');
            } else {
              row1(xs, 0.12, 'gold');
              const t = f === 'unif' ? Math.max(...xs) : mean(xs);
              sL.vline(t, { color: 'green', width: 2.6 });
              sL.tex(f === 'unif' ? '\\max_i x_i' : '\\bar T=\\bar x', t, 0.9, { dx: 8, align: 'left', color: 'green', size: 16 });
              tL(f === 'unif' ? `${n} observations: everything is in $\\max_i x_i$` : `${n} observations $T(x_i)=x_i$ and their average`);
            }
          }
          // ── right: log-likelihood from the full data vs from the sufficient statistic
          let maxDiff = 0, extra = '';
          if (L.map) {
            const W = window2(d), T = W.T;
            viewPad(sR, W.x, W.y, { left: 40 });
            const full = (a, b) => L.full(d.xs, a, b), fromT = (a, b) => L.fromT(n, T, a, b);
            let mF = -Infinity, mT = -Infinity, arg = [0, 0]; const G = 50, grid = [];
            for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) { const a = W.x[0] + ((W.x[1] - W.x[0]) * i) / G, b = W.y[0] + ((W.y[1] - W.y[0]) * j) / G, u = full(a, b), w = fromT(a, b); grid.push([u, w]); if (u > mF) { mF = u; arg = [a, b]; } if (w > mT) mT = w; }
            for (const [u, w] of grid) maxDiff = Math.max(maxDiff, Math.abs(u - mF - (w - mT)));
            const lev = [-0.69, -2.3, -4.6];
            sR.raster((a, b) => { const u = full(a, b) - mF; return u > -4.6 ? [...v.rgb('accent').slice(0, 3), Math.round(70 * Math.exp(u / 2))] : null; }, { res: 4, key: d.f + d.n + seed + W.x + W.y });
            sR.contour((a, b) => full(a, b) - mF, lev, { color: 'accent', width: 5, res: 70 });
            sR.contour((a, b) => fromT(a, b) - mT, lev, { color: 'orange', width: 1.8, dash: [6, 4], res: 70 });
            sR.dot(arg[0], arg[1], { r: 4.5, color: 'accent' });
            tR('relative log-likelihood: full data vs $(n,\\bar T)$ alone');
            axisLabels(sR, L.pl[0], L.pl[1]);
            extra = String.raw`$\bar T=(${v.fix(T[0] / n, 3)},\,${v.fix(T[1] / n, 3)})$`;
          } else {
            const [a, b] = L.win, N = 400, xsG = Array.from({ length: N + 1 }, (_, i) => a + ((b - a) * i) / N);
            const fF = xsG.map((t) => L.full(d.xs, t)), mF = Math.max(...fF.filter(isFinite));
            let fT, mT;
            if (f === 'cauchy') { fT = xsG.map((t) => L.full(d.ys, t)); mT = Math.max(...fT); }
            else { const T = L.T(d.xs); fT = xsG.map((t) => L.fromT(n, T, t)); mT = Math.max(...fT.filter(isFinite)); extra = f === 'unif' ? `$\\max_i x_i=${v.fix(T, 3)}$` : `$\\sum T(x_i)=${Number.isInteger(T) ? T : v.fix(T, 3)}$`; }
            const rF = fF.map((u) => u - mF), rT = fT.map((u) => u - mT);
            for (let i = 0; i <= N; i++) if (isFinite(rF[i]) && isFinite(rT[i]) && Math.max(rF[i], rT[i]) > -6) maxDiff = Math.max(maxDiff, Math.abs(rF[i] - rT[i]));
            viewPad(sR, [a, b], [-12, 1.2], { left: 34 });
            sR.hline(0, { color: 'faint', width: 1 });
            sR.clip(() => {
              sR.path(xsG.map((t, i) => [t, rF[i]]), { color: 'accent', width: 3 });
              sR.path(xsG.map((t, i) => [t, rT[i]]), { color: f === 'cauchy' ? 'red' : 'orange', width: 2, dash: [7, 5] });
            });
            tR(f === 'cauchy' ? 'Cauchy log-likelihoods of samples A and B' : 'relative log-likelihood: full data vs $(n,T)$ alone');
            axisLabels(sR, L.pl, '\\ell-\\max\\ell');
          }
          lgd(f === 'cauchy' ? [['gold', 'sample A', { dot: true }], ['red', 'sample B (same mean and SD)', { dot: true }], ['accent', 'log-likelihood of A'], ['red', 'log-likelihood of B', { dash: true }]]
            : [['gold', 'observations', { dot: true }], ['green', 'sufficient statistic', { dot: true }], ['accent', 'full-data log-likelihood'], ['orange', 'rebuilt from the sufficient statistic', { dash: true }]]);
          info = { f, n, maxDiff, extra, row };
        });
        v.readout(() => {
          if (!info) return '';
          const { f, n, maxDiff, extra } = info;
          if (f === 'cauchy') return String.raw`samples A and B share $\sum x_i$ and $\sum x_i^2$, yet where the likelihoods are not negligible (within 6 log-units of the top) their relative log-likelihoods differ by up to **${v.fix(maxDiff, 2)}** — no fixed-dimension summary is sufficient for the Cauchy family; only the ${n} order statistics are`;
          const k = f === 'norm' || f === 'gam' || f === 'beta' ? 2 : 1;
          return String.raw`${n} observations compressed to ${k} number${k > 1 ? 's' : ''}: ${extra} · largest gap between the full-data and the rebuilt relative log-likelihood: $${v.sci(Math.max(maxDiff, 1e-16), 1)}$ (rounding error) — **the sufficient statistic carries the whole likelihood**` + (f === 'unif' ? ' · sufficient of dimension 1, yet not an exponential family: its support moves with $\\theta$' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Minimal sufficient statistic',
      credit: 'Lehmann & Scheffé, 1950',
      statement: String.raw`A sufficient statistic $T$ is **minimal sufficient** if it is a function of every other sufficient statistic: for each sufficient $S$ there is a map $\varphi$ with $T=\varphi(S)$ (almost surely under every $\theta$). In terms of partitions of the sample space into level sets, the partition of $T$ is the coarsest among all sufficient partitions: every sufficient partition refines it.

A minimal sufficient statistic exists for any dominated family on a nice sample space and is unique up to one-to-one maps. It can be described explicitly: $x\sim y$ when the likelihood functions $\theta\mapsto f(x\mid\theta)$ and $\theta\mapsto f(y\mid\theta)$ are proportional, and $T(x)$ is the class of $x$ (for instance the normalised likelihood function itself). Examples: $\sum X_i$ for Bernoulli trials, while the whole sample is sufficient but not minimal; $\max X_i$ for uniforms on $\{0,\dots,\theta\}$; the unordered sample (order statistics) when the model is "all distributions".`,
      idea: String.raw`If $S$ is sufficient and $S(x)=S(y)$, the factorization (2.3) gives $f(x\mid\theta)/f(y\mid\theta)=h(x)/h(y)$, a constant, so $x$ and $y$ have proportional likelihoods: every sufficient partition sits inside the likelihood partition. The likelihood partition is itself sufficient (2.6 proves this), so it is the coarsest one, and it is minimal. Compressing further would merge two points with different likelihood shapes, and the conditional law given the merged class would then depend on $\theta$.`,
      caption: String.raw`The 25 points of the sample space of two draws from a law on $\{0,\dots,4\}$. Cells share a colour when their likelihood functions are proportional (the minimal sufficient partition); the label in each cell is the value of the candidate statistic (the last candidate labels each point by the shape of its likelihood, which is minimal sufficient by construction). A statistic is sufficient when equal numbers never straddle two colours, and minimal when, in addition, each colour carries a single number. Click a cell: on the right, the normalised likelihood functions of all points with the same candidate value. They coincide when the candidate is sufficient. Try each candidate under each model; the readout scores them all.`,
      deps: ['stat-2.2', 'stat-2.3'],
      refs: ['Casella–Berger §6.2'],
      tags: ['minimal sufficiency', 'partitions'],
      viz(v) {
        const M = v.M, K = 4;
        const modS = v.select('model', [{ value: 'bin', label: 'Binomial$(4,p)$' }, { value: 'unif', label: 'uniform on $\\{0,\\dots,\\theta\\}$' }, { value: 'any', label: 'any law on $\\{0,\\dots,4\\}$' }, { value: 'two', label: 'two simple hypotheses' }], 'bin');
        const CANDS = [{ value: 'id', label: '$(x_1,x_2)$', f: (a, b) => `${a},${b}` }, { value: 'sum', label: '$x_1+x_2$', f: (a, b) => `${a + b}` }, { value: 'max', label: '$\\max$', f: (a, b) => `${Math.max(a, b)}` }, { value: 'ord', label: '$\\{x_1,x_2\\}$', f: (a, b) => `${Math.min(a, b)}${Math.max(a, b)}` }, { value: 'x1', label: '$x_1$', f: (a) => `${a}` }, { value: 'L', label: 'shape of $L_x$', f: null }];
        const cS = v.select('candidate statistic', CANDS.map(({ value, label }) => ({ value, label })), 'sum');
        const sL = v.stage({ x: [-0.6, K + 0.6], y: [-0.6, K + 0.6], equal: true, height: 330, axes: 'box', xticks: [0, 1, 2, 3, 4], yticks: [0, 1, 2, 3, 4], weight: 1, title: 'sample space: colour = likelihood class' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', weight: 1.1 });
        const tR = titler(sR);
        let sel = [1, 3];
        sL.onClick((x, y) => { const i = Math.round(x), j = Math.round(y); if (i >= 0 && i <= K && j >= 0 && j <= K) sel = [i, j]; });
        // parameter points at which likelihoods are compared
        const r0 = v.rng(77), anyTh = Array.from({ length: 14 }, () => { const g = Array.from({ length: 5 }, () => -Math.log(1 - r0())); const s = g.reduce((a, b) => a + b, 0); return g.map((u) => u / s); });
        const P0 = [0.1, 0.2, 0.4, 0.2, 0.1], P1 = [0.2, 0.1, 0.4, 0.1, 0.2];
        const MODELS = {
          bin: { th: Array.from({ length: 31 }, (_, k) => 0.02 + (0.96 * k) / 30), pmf: (x, p) => Math.exp(lchoose(4, x) + x * Math.log(p) + (4 - x) * Math.log1p(-p)), axis: 'p' },
          unif: { th: [0, 1, 2, 3, 4], pmf: (x, t) => (x <= t ? 1 / (t + 1) : 0), axis: '\\theta' },
          any: { th: anyTh, pmf: (x, q) => q[x], axis: null },
          two: { th: [P0, P1], pmf: (x, q) => q[x], axis: null },
        };
        const classes = memo();
        const lr = (mod) => classes(mod, () => {
          const Md = MODELS[mod], vec = {};
          for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) { const w = Md.th.map((t) => Md.pmf(i, t) * Md.pmf(j, t)), s = w.reduce((a, b) => a + b, 0); vec[`${i},${j}`] = w.map((u) => u / s); }
          const reps = [], cls = {};
          for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) {
            const k = `${i},${j}`, w = vec[k]; let c = reps.findIndex((r) => r.every((u, m) => Math.abs(u - w[m]) < 1e-9));
            if (c < 0) { reps.push(w); c = reps.length - 1; } cls[k] = c;
          }
          // greedy colouring of the class adjacency graph so that touching classes differ
          const nC = reps.length, adj = Array.from({ length: nC }, () => new Set());
          for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) for (const [di, dj] of [[1, 0], [0, 1]]) { const a = cls[`${i},${j}`], b = cls[`${i + di},${j + dj}`]; if (b != null && a !== b) { adj[a].add(b); adj[b].add(a); } }
          const col = []; for (let c = 0; c < nC; c++) { const used = new Set([...adj[c]].map((d) => col[d]).filter((u) => u != null)); let k = c % CYCLE.length, tries = 0; while (used.has(k) && tries++ < CYCLE.length) k = (k + 1) % CYCLE.length; col[c] = k; }
          return { vec, cls, nC, col };
        });
        const candF = (mod, c) => (c.f ? c.f : (a, b) => String.fromCharCode(65 + lr(mod).cls[`${a},${b}`]));
        const score = (mod, cand) => {
          const L = lr(mod), C = { f: candF(mod, CANDS.find((c) => c.value === cand)) }, blocks = new Map();
          for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) { const t = C.f(i, j); if (!blocks.has(t)) blocks.set(t, new Set()); blocks.get(t).add(L.cls[`${i},${j}`]); }
          const suff = [...blocks.values()].every((s) => s.size === 1);
          return { nB: blocks.size, suff, minimal: suff && blocks.size === L.nC };
        };
        let info = null;
        v.render(() => {
          const mod = modS.value, c0 = CANDS.find((c) => c.value === cS.value), cand = { ...c0, f: candF(mod, c0) }, L = lr(mod), [si, sj] = sel, tSel = cand.f(si, sj);
          viewPad(sL, [-0.6, K + 0.6], [-0.6, K + 0.6], { left: 22, bottom: 16 });
          for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) {
            const c = L.cls[`${i},${j}`], col = CYCLE[L.col[c] % CYCLE.length], mine = cand.f(i, j) === tSel;
            sL.rect(i - 0.48, j - 0.48, i + 0.48, j + 0.48, { fill: col, fillAlpha: mine ? 0.62 : 0.3, color: mine ? 'ink' : col, width: mine ? 2 : 1, radius: 5 });
            const lab = cand.value === 'ord' ? `{${cand.f(i, j).split('').join(',')}}` : cand.f(i, j);
            sL.text(lab, i, j, { align: 'center', size: cand.value === 'id' || cand.value === 'ord' ? 12 : 15, weight: 700, color: 'ink', math: cand.value === 'L' });
          }
          sL.rect(si - 0.5, sj - 0.5, si + 0.5, sj + 0.5, { color: 'gold', width: 3.4, radius: 6 });
          // right: normalised likelihood functions of the selected candidate block
          const Md = MODELS[mod], members = []; for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) if (cand.f(i, j) === tSel) members.push([i, j]);
          const m = Md.th.length, xsP = Md.axis ? Md.th : Md.th.map((_, k) => k + 1);
          let top = 0; for (const [i, j] of members) top = Math.max(top, ...L.vec[`${i},${j}`]);
          viewPad(sR, [xsP[0] - (Md.axis ? 0 : 0.5), xsP[m - 1] + (Md.axis ? 0 : 0.5)], [0, top * 1.15], { left: 44 });
          if (!Md.axis) sR.setTicks(xsP.map((x) => [x, mod === 'two' ? ['θ₀', 'θ₁'][x - 1] : String(x)]), undefined); else sR.setTicks(null, undefined);
          const seen = new Set();
          members.forEach(([i, j], k) => {
            const c = L.cls[`${i},${j}`], col = CYCLE[L.col[c] % CYCLE.length], w = L.vec[`${i},${j}`], first = !seen.has(c); seen.add(c);
            const pts = xsP.map((x, q) => [x, w[q]]);
            if (Md.axis === 'p') sR.path(pts, { color: first ? col : 'ink', width: first ? 5 : 1.4, alpha: first ? 0.75 : 0.9, dash: first ? null : [6, 4] });
            else { pts.forEach(([x, y], q) => { sR.line(x + (k - (members.length - 1) / 2) * 0.06, 0, x + (k - (members.length - 1) / 2) * 0.06, y, { color: col, width: 2.2, alpha: 0.85 }); }); sR.dots(pts.map(([x, y]) => [x + (k - (members.length - 1) / 2) * 0.06, y]), { r: 3.2, color: col }); }
          });
          tR(`normalised likelihoods of the ${members.length} point${members.length > 1 ? 's' : ''} with value ${cand.value === 'ord' ? `{${tSel.split('').join(',')}}` : tSel}` + (Md.axis ? '' : mod === 'two' ? '' : ' at 14 random laws'));
          if (Md.axis) axisLabels(sR, Md.axis, null);
          sR.corner(seen.size === 1 ? `${members.length} curve${members.length > 1 ? 's' : ''} drawn on top of each other: one shape` : `${seen.size} different shapes`, 'tr', { color: seen.size === 1 ? 'green' : 'red', weight: 600 });
          info = { mod, cand: cand.value, L, nMem: members.length, nCls: seen.size };
        });
        v.readout(() => {
          if (!info) return '';
          const { mod, L, nCls } = info, own = score(mod, cS.value);
          const parts = CANDS.map((c) => { const s = score(mod, c.value); return `${c.label}: ${s.nB} blocks, ${s.suff ? (s.minimal ? '**minimal sufficient**' : 'sufficient, not minimal') : 'not sufficient'}`; });
          return String.raw`${L.nC} likelihood classes · the selected block meets ${nCls} class${nCls > 1 ? 'es' : ''} — ${own.suff ? 'its likelihoods all have one shape' : 'its likelihoods have different shapes, so conditioning on it leaves $\\theta$ in play'} · ` + parts.join(' · ');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Likelihood-ratio criterion for minimal sufficiency',
      credit: 'Lehmann & Scheffé, 1950',
      statement: String.raw`Let $f(x\mid\theta)$ be the densities of the data. Suppose $T$ is a statistic such that, for every two sample points $x$ and $y$,
$$\frac{f(x\mid\theta)}{f(y\mid\theta)}\ \text{is constant as a function of }\theta\quad\Longleftrightarrow\quad T(x)=T(y)$$
(where the ratio is read as constant when both densities vanish for the same $\theta$ and the ratio is the same elsewhere). Then $T$ is minimal sufficient.

Examples for a sample of size $n$: $\bar X$ for $N(\mu,1)$; $(\bar X,S^2)$ for $N(\mu,\sigma^2)$; $X_{(n)}$ for $U(0,\theta)$; $(X_{(1)},X_{(n)})$ for $U(\theta,\theta+1)$; for the Cauchy location family the ratio $\prod_i\frac{1+(y_i-\theta)^2}{1+(x_i-\theta)^2}$ is constant only when the $y_i$ are a rearrangement of the $x_i$, so the order statistics are minimal sufficient and no reduction is possible.`,
      idea: String.raw`Sufficiency: choose one representative $x_t$ in each level set $\{T=t\}$ and write $f(x\mid\theta)=f(x_{T(x)}\mid\theta)\cdot\frac{f(x\mid\theta)}{f(x_{T(x)}\mid\theta)}$; the first factor depends on $x$ only through $T(x)$ and the second, by the "⇐" half of the hypothesis, does not depend on $\theta$, so the factorization theorem (2.3) applies. Minimality: if $S$ is sufficient and $S(x)=S(y)$, the factorization of $S$ makes $f(x\mid\theta)/f(y\mid\theta)=h(x)/h(y)$ free of $\theta$, so $T(x)=T(y)$ by the "⇒" half: $T$ is a function of $S$ (2.5).`,
      caption: String.raw`Two data sets of four points (blue $x$ above, orange $y$ below); drag any point. Right: the log-likelihood ratio $\log f(x\mid\theta)-\log f(y\mid\theta)$ as a function of the parameter (for the two-parameter normal, at three values of $\sigma$). Press **match** to move $y$ until its statistic equals that of $x$: the curve goes flat, and only then. For the Cauchy model, matching the normal's statistic (mean and SD) leaves the curve bent; only a rearrangement of $x$ flattens it, so the order statistics are minimal sufficient.`,
      deps: ['stat-2.5', 'stat-2.3'],
      refs: ['Casella–Berger §6.2'],
      tags: ['minimal sufficiency', 'likelihood ratio'],
      viz(v) {
        const modS = v.select('model', [{ value: 'n1', label: '$N(\\mu,1)$' }, { value: 'n2', label: '$N(\\mu,\\sigma^2)$' }, { value: 'unif', label: '$U(0,\\theta)$' }, { value: 'cauchy', label: 'Cauchy$(\\theta,1)$' }], 'n1');
        const sL = v.stage({ x: [-3.2, 6.2], y: [-0.7, 1.7], height: 300, axes: false, weight: 1, title: 'two data sets of size 4 (drag the points)' });
        const sR = v.stage({ x: [-3, 6], y: [-6, 6], height: 300, axes: 'box', weight: 1.15 });
        const tR = titler(sR), lgd = legender(v);
        const X0 = [0.3, 1.2, 1.9, 3.1], Y0 = [-0.6, 1.6, 2.4, 4.0];
        const mkH = (x, y, col) => sL.handle(x, y, { color: col, r: 8, constrain: (a) => [clamp(a, modS.value === 'unif' ? 0.05 : -3, 6), y] });
        const hx = X0.map((x) => mkH(x, 1, 'accent')), hy = Y0.map((x) => mkH(x, 0, 'orange'));
        const xs = () => hx.map((h) => h.x), ysv = () => hy.map((h) => h.x);
        const stats = {
          n1: (a) => [mean(a)],
          n2: (a) => { const m = moments(a); return [m.mean, m.var]; },
          unif: (a) => [Math.max(...a)],
          cauchy: (a) => Array.from(a).sort((p, q) => p - q),
        };
        const fmtT = (mod, t, z) => (mod === 'n1' ? `\\bar ${z}=${v.fix(t[0], 3)}` : mod === 'n2' ? `(\\bar ${z},s_${z}^2)=(${v.fix(t[0], 3)},\\,${v.fix(t[1], 3)})` : mod === 'unif' ? `${z}_{(4)}=${v.fix(t[0], 3)}` : `${z}_{(\\cdot)}=(${t.map((u) => v.fix(u, 2)).join(',\\,')})`);
        const logf = (mod, a, th, s = 1) => {
          if (mod === 'unif') { if (Math.min(...a) < 0) return -Infinity; return Math.max(...a) <= th ? -a.length * Math.log(th) : -Infinity; }
          if (mod === 'cauchy') return a.reduce((t, x) => t - Math.log1p((x - th) ** 2), 0);
          return a.reduce((t, x) => t - Math.log(s) - ((x - th) ** 2) / (2 * s * s), 0);
        };
        let shuffleK = 0;
        v.button('match: move $y$ to the same statistic as $x$', () => {
          const mod = modS.value, a = xs(), b = ysv();
          let nb;
          if (mod === 'n1') { const d = mean(a) - mean(b); nb = b.map((u) => u + d); }
          else if (mod === 'n2') { const A = moments(a), B = moments(b); nb = b.map((u) => A.mean + (A.sd * (u - B.mean)) / B.sd); }
          else if (mod === 'unif') { const k = Math.max(...a) / Math.max(...b); nb = b.map((u) => u * k); }
          else { const r = v.rng(hashStr('perm' + shuffleK++)); nb = a.slice(); for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nb[i], nb[j]] = [nb[j], nb[i]]; } }
          nb.forEach((u, i) => hy[i].set(clamp(u, -3, 6), 0));
        });
        const cBtn = v.button('Cauchy: match only mean and SD', () => { const a = xs(), b = ysv(), A = moments(a), B = moments(b); b.map((u) => A.mean + (A.sd * (u - B.mean)) / B.sd).forEach((u, i) => hy[i].set(clamp(u, -3, 6), 0)); });
        v.button('Scramble $y$', () => { const r = v.rng(hashStr('scr' + shuffleK++)); hy.forEach((h) => h.set(modS.value === 'unif' ? 0.2 + 4.5 * r() : -2 + 6 * r(), 0)); });
        let info = null;
        v.render(() => {
          const mod = modS.value;
          cBtn.hidden = mod !== 'cauchy';
          if (mod === 'unif') for (const hd of [...hx, ...hy]) if (hd.x < 0.05) hd.set(Math.max(0.05, -hd.x), hd.y);
          const a = xs(), b = ysv();
          // left: the two data sets on number lines
          for (const [yy, col, nm] of [[1, 'accent', 'x'], [0, 'orange', 'y']]) { sL.line(-3, yy, 6, yy, { color: 'faint', width: 1.4 }); sL.tex(nm, -3.1, yy + 0.32, { color: col, size: 17, align: 'left' }); }
          for (let t = -3; t <= 6; t++) { sL.line(t, -0.06, t, 0.06, { color: 'faint' }); sL.line(t, 0.94, t, 1.06, { color: 'faint' }); sL.text(String(t).replace('-', '−'), t, -0.28, { align: 'center', size: 11, color: 'muted' }); }
          const Ta = stats[mod](a), Tb = stats[mod](b);
          sL.tex(fmtT(mod, Ta, 'x'), 1.5, 1.5, { color: 'accent', size: 14 }); sL.tex(fmtT(mod, Tb, 'y'), 1.5, 0.5, { color: 'orange', size: 14 });
          if (mod === 'unif') { sL.line(Math.max(...a), 0.8, Math.max(...a), 1.2, { color: 'accent', width: 2.5 }); sL.line(Math.max(...b), -0.2, Math.max(...b), 0.2, { color: 'orange', width: 2.5 }); }
          // right: log-likelihood ratio in θ
          const win = mod === 'unif' ? [0.01, 7] : [-3, 6];
          const sig = mod === 'n2' ? [[0.6, 'purple'], [1, 'accent'], [1.8, 'teal']] : [[1, 'accent']];
          let ylo = Infinity, yhi = -Infinity;
          for (const [s] of sig) for (let i = 0; i <= 90; i++) { const th = win[0] + ((win[1] - win[0]) * i) / 90, r = logf(mod, a, th, s) - logf(mod, b, th, s); if (isFinite(r)) { ylo = Math.min(ylo, r); yhi = Math.max(yhi, r); } }
          if (!isFinite(ylo)) { ylo = -1; yhi = 1; }
          const yc = (ylo + yhi) / 2, yh = clamp((yhi - ylo) / 2 * 1.15, 1.5, 14);
          viewPad(sR, win, [yc - yh, yc + yh], { left: 30 });
          sR.hline(0, { color: 'faint', width: 1 });
          let lo = Infinity, hi = -Infinity, flat = true;
          const N = 360;
          for (const [s, col] of sig) {
            const pts = [];
            for (let i = 0; i <= N; i++) { const th = win[0] + ((win[1] - win[0]) * i) / N, la = logf(mod, a, th, s), lb = logf(mod, b, th, s); let r = la - lb; if (la === -Infinity && lb === -Infinity) r = NaN; pts.push([th, r]); if (isFinite(r)) { lo = Math.min(lo, r); hi = Math.max(hi, r); } else if (!Number.isNaN(r)) flat = false; }
            if (mod === 'unif') {
              const ma = Math.max(...a), mb = Math.max(...b), m1 = Math.min(ma, mb), m2 = Math.max(ma, mb);
              sR.vband(0, m1, { color: 'faint', alpha: 0.18 });
              if (m2 > m1 + 1e-9) { sR.vband(m1, m2, { color: 'red', alpha: 0.14 }); sR.text(ma > mb ? 'ratio = 0' : 'ratio = ∞', (m1 + m2) / 2, yc + (ma > mb ? -0.8 : 0.8) * yh, { align: 'center', color: 'red', size: 12, weight: 600 }); }
              sR.text('both zero', m1 / 2, yc + 0.2 * yh, { align: 'center', color: 'muted', size: 11 });
            }
            sR.clip(() => sR.path(pts.map(([t, r]) => [t, isFinite(r) ? clamp(r, yc - 3 * yh, yc + 3 * yh) : NaN]), { color: col, width: 2.6 }));
          }
          const spread = !flat ? Infinity : isFinite(hi - lo) ? hi - lo : Infinity, isFlat = flat && spread < 1e-9;
          tR(`$\\log f(x\\mid\\theta)-\\log f(y\\mid\\theta)$: ${isFlat ? '**flat**' : 'not flat'}`);
          axisLabels(sR, mod === 'unif' ? '\\theta' : mod === 'cauchy' ? '\\theta' : '\\mu', null);
          lgd(mod === 'n2' ? [['purple', '$\\sigma=0.6$'], ['accent', '$\\sigma=1$'], ['teal', '$\\sigma=1.8$']] : [['accent', 'log-likelihood ratio'], ...(mod === 'unif' ? [['red', 'one likelihood is zero', { area: true }]] : [])]);
          const same = Ta.every((t, i) => Math.abs(t - Tb[i]) < 1e-6);
          info = { mod, isFlat, spread, same, flat };
        });
        v.readout(() => {
          if (!info) return '';
          const { mod, isFlat, spread, same } = info;
          const nm = { n1: '$\\bar x$', n2: '$(\\bar x,s^2)$', unif: '$x_{(4)}$', cauchy: 'the order statistics' }[mod];
          const sp = !isFinite(spread) ? '∞' : spread < 1e-9 ? '0' : v.fix(spread, spread < 0.1 ? 4 : 2);
          return String.raw`log-likelihood ratio varies by ${sp} over the window: **${isFlat ? 'flat' : 'not flat'}** · ${nm}: ${same ? '**equal** for $x$ and $y$' : 'different for $x$ and $y$'} · ` + (isFlat === same ? `flatness and equality go together, as the criterion says: ${nm} ${mod === 'cauchy' ? 'are' : 'is'} minimal sufficient` : 'equal only up to the drag tolerance: press match');
        });
      },
    },
  ],
};
