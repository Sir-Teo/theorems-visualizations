// Electromagnetism — Chapter 4: The multipole expansion (items 4.1–4.6; 4.7–4.11 are in ch04-b.js)
import { TAU, KV, pot, fld, sgnCol, drawCharge, heatPot, levels, moments, multV, qlm, realY, rot3, eig3, nC } from './ch04.shared.js';

export default {
  collection: 'em',
  chapter: 4,
  title: 'The multipole expansion',
  summary: String.raw`Seen from far away, any localized charge distribution looks like a point charge, then a dipole, then a quadrupole, each term falling off one power of distance faster. The moments are the coefficients of a Legendre (or spherical-harmonic) expansion; the dipole is origin-independent only when the net charge vanishes, and point multipoles are exactly the derivatives of a delta. The same moments govern how a small charge cluster couples to an external field.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Method',
      name: 'Multipole expansion',
      statement: String.raw`Let a charge distribution lie inside the sphere $r'\le a$ about the origin. At every point with $r>a$ its potential is the convergent series
$$V(\mathbf r)=\frac1{4\pi\varepsilon_0}\sum_{\ell=0}^\infty\frac1{r^{\ell+1}}\int r'^{\,\ell}P_\ell(\cos\alpha)\,\rho(\mathbf r')\,d\tau',$$
where $\alpha$ is the angle between $\mathbf r$ and $\mathbf r'$. The term $\ell=0$ is the monopole, $\ell=1$ the dipole, $\ell=2$ the quadrupole. Stopping after order $L$ leaves an error of size at most $\dfrac{\sum|q_i|}{4\pi\varepsilon_0\,(r-a)}\Bigl(\dfrac ar\Bigr)^{L+1}$.`,
      idea: String.raw`The reciprocal distance $1/|\mathbf r-\mathbf r'|$ is the generating function of the Legendre polynomials: for $r'<r$ it equals $\sum_\ell r'^{\ell}P_\ell(\cos\alpha)/r^{\ell+1}$ (this is the same expansion that solves Laplace's equation in spherical coordinates, em-3.15). Insert it in the superposition integral for the potential (em-2.6) and integrate term by term. Since $|P_\ell|\le1$, the $\ell$-th term is at most $\sum|q_i|\,a^\ell/r^{\ell+1}$ in size, a geometric series in $a/r$: the series converges for $r>a$, and cutting it at order $L$ leaves a remainder of the stated size.`,
      caption: String.raw`Five charges (drag them; they must stay inside the orange circle of radius $a$, the farthest one sets $a$) form a small cluster. Choose the highest order $L$ kept in the series. The left map shows $\log_{10}$ of the error of the truncated expansion relative to the potential scale $\sum|q_i|/r$: dark far away, bright (error of order one) near and inside the cluster, where the series is useless. The right plot follows the probe's ray out to infinity on log–log axes: the error of order $L$ (blue) dies off like $(a/r)^{L+1}$, staying under the dashed bound; raising $L$ buys a faster slope, but only beyond $r=a$.`,
      scope: String.raw`Valid for $r$ larger than the radius $a$ of a sphere enclosing all of the charge; inside that sphere the series generally diverges. The pictures show point charges in a plane with the true three-dimensional $1/r$ law.`,
      credit: 'Legendre, 1782 (polynomials; memoir printed 1785); Laplace, 1782',
      deps: ['em-3.15', 'em-2.6'],
      refs: ['Griffiths §3.4'],
      tags: ['multipole', 'legendre'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multipole_expansion' },
      viz(v) {
        const A0 = 1.6, LM = 5;
        const s = v.stage({ x: [-7, 7], y: [-4.5, 4.5], equal: true, height: 340, axes: false, weight: 1.15, title: 'error of the truncated expansion' });
        const sp = v.stage({ x: [0.3, 30], y: [1e-8, 10], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'distance $r$ (cm) along the probe’s ray', ylabel: 'relative error', title: 'error against distance' });
        const Ls = v.slider('highest order $L$', 0, LM, 1, { int: true });
        const q0 = [2.5, -1.5, 1.5, -1, 2], P0 = [[-0.8, 0.5], [0.7, 0.8], [1.0, -0.5], [-0.3, -0.9], [0.2, 0.1]];
        const lim = (x, y, m, mn = 0) => { const r = Math.hypot(x, y); return r > m ? [(x / r) * m, (y / r) * m] : r < mn && r > 1e-9 ? [(x / r) * mn, (y / r) * mn] : [x, y]; };
        const hs = P0.map((p, k) => s.handle(p[0], p[1], { color: sgnCol(q0[k]), r: 7, constrain: (x, y) => lim(x, y, A0) }));
        const pr = s.handle(4.6, 1.9, { color: 'gold', r: 8, label: 'probe', labelPos: 'n', constrain: (x, y) => lim(x, y, 99, 0.4) });
        const errAt = (cl, L, x, y) => { const r = Math.hypot(x, y), sc = (KV * cl.reduce((t, c) => t + Math.abs(c.q), 0)) / r; return Math.abs(multV(cl, L, x, y) - pot(cl, x, y)) / sc; };
        let info = {};
        v.render(() => {
          const L = Ls.value, cl = hs.map((h, k) => ({ x: h.x, y: h.y, q: q0[k] })), a = Math.max(0.2, ...cl.map((c) => Math.hypot(c.x, c.y)));
          const key = cl.map((c) => c.x.toFixed(2) + c.y.toFixed(2)).join() + L;
          s.heat((x, y) => Math.max(-6, Math.min(0, Math.log10(errAt(cl, L, x, y) + 1e-12))), { range: [-6, 0], cmap: 'magma', res: 3, key: 'e' + key, alpha: 0.95 });
          s.colorbar([-6, 0], 'magma', { pos: 'bottom', label: 'log₁₀ error', ticks: [-6, -4, -2, 0] });
          s.circle(0, 0, a, { color: 'orange', width: 2, dash: true });
          s.tex('a', a * 0.72, -a * 0.72 - 0.25, { color: 'orange', size: 13 });
          cl.forEach((c, k) => { hs[k].color = sgnCol(c.q); });
          s.dot(0, 0, { r: 3, color: 'ink' });
          const ang = Math.atan2(pr.y, pr.x), R = Math.hypot(pr.x, pr.y);
          s.line(0, 0, 7 * Math.cos(ang), 7 * Math.sin(ang), { color: 'gold', alpha: 0.4, dash: true, width: 1 });
          for (let l = 0; l <= LM; l++) sp.fn((r) => Math.max(1e-12, errAt(cl, l, r * Math.cos(ang), r * Math.sin(ang))), { domain: [0.3, 30], n: 170, color: l === L ? 'accent' : 'faint', width: l === L ? 2.6 : 1.1, alpha: l === L ? 1 : 0.8 });
          sp.fn((r) => Math.pow(a / r, L + 1) * (r / Math.max(r - a, 1e-6)), { domain: [a * 1.02, 30], n: 120, color: 'orange', dash: true, width: 1.6 });
          sp.vline(a, { color: 'orange', alpha: 0.5, dash: true });
          const e = errAt(cl, L, pr.x, pr.y);
          sp.dot(R, Math.max(1e-12, e), { r: 5, color: 'gold' });
          info = { L, a, R, e, bound: R > a ? Math.pow(a / R, L + 1) * (R / (R - a)) : Infinity };
        });
        v.legend([['accent', 'error at order $L$'], ['faint', 'other orders $0\\ldots5$'], ['orange', 'bound $(a/r)^{L+1}\\,r/(r-a)$', { dash: true }]]);
        v.readout(() => info.R > info.a ? `At the probe ($r=${v.fix(info.R, 2)}$ cm, $a=${v.fix(info.a, 2)}$ cm) the order-${info.L} truncation is off by ${v.sci(info.e, 2).replace(/^/, '$')}$ of the potential scale; the guaranteed bound is ${v.sci(info.bound, 2).replace(/^/, '$')}$. Move the probe twice as far out: the error drops by about $2^{${info.L + 1}}=${2 ** (info.L + 1)}$.` : `The probe is inside the cluster's circle ($r<a$): the series has no right to converge there, and the error is of order one whatever $L$ is.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Monopole and dipole moments',
      statement: String.raw`For point charges $q_i$ at $\mathbf r_i$ (or a density $\rho$) the **monopole moment** is the total charge $Q=\sum_iq_i=\int\rho\,d\tau$, and the **dipole moment** is the vector
$$\mathbf p=\sum_iq_i\mathbf r_i=\int\mathbf r'\rho(\mathbf r')\,d\tau'.$$
The first two terms of the multipole expansion are $V=\dfrac1{4\pi\varepsilon_0}\Bigl[\dfrac Qr+\dfrac{\mathbf p\cdot\hat{\mathbf r}}{r^2}+\cdots\Bigr]$.`,
      idea: String.raw`Put $\ell=0$ and $\ell=1$ in the expansion of em-4.1: $P_0=1$ and $P_1(\cos\alpha)=\hat{\mathbf r}\cdot\hat{\mathbf r}'$, so the second term is $\frac1{r^2}\hat{\mathbf r}\cdot\int\mathbf r'\rho\,d\tau'=\hat{\mathbf r}\cdot\mathbf p/r^2$. The moments are the charge-weighted averages of $1$ and of $\mathbf r'$: they say how much charge there is and where its centre of positive and negative charge lie relative to the origin. For a ± pair $\mathbf p$ reduces to the familiar $q\mathbf d$ (em-1.11).`,
      caption: String.raw`Four charges (drag them; $q_4$ is set by the slider, the others are $+2$, $+1$, $-1.5$ nC). The left map is the potential of all four; the arrow is the dipole moment $\mathbf p$ about the origin. The right plot is the potential around a ring at $r=3.2$ cm: exact (ink), monopole alone (orange), monopole plus dipole (green). With $Q\neq0$ the ring potential is mostly a constant; press **balance** to set $Q=0$ and the pattern flips to a pure $\cos(\theta-\theta_p)$ dipole curve, with a nodal pair of directions perpendicular to $\mathbf p$.`,
      scope: String.raw`Point charges in a plane with the true $1/r$ law of three dimensions; moments taken about the origin. Far-field statements need the ring to lie well outside the cluster (here the cluster is within about 1.5 cm of the origin).`,
      deps: ['em-4.1'],
      refs: ['Griffiths §3.4'],
      tags: ['monopole', 'dipole'],
      viz(v) {
        const RR = 3.2;
        const s = v.stage({ x: [-5, 5], y: [-3.4, 3.4], equal: true, height: 340, axes: false, weight: 1.1, title: 'charges, dipole vector and potential' });
        const sp = v.stage({ x: [0, 360], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'angle $\\theta$ around the ring (degrees)', ylabel: '$V$ (volts)', xticks: [0, 90, 180, 270, 360], title: 'potential on the ring $r=3.2$ cm' });
        const q4 = v.slider('$q_4$', -6, 6, 0.5, { step: 0.1, fmt: (x) => nC(x) });
        v.button('balance: make $Q=0$', () => q4.set(Math.round(-(2 + 1 - 1.5) * 10) / 10));
        const qs = [2, 1, -1.5], P0 = [[-0.8, 0.5], [0.7, 0.8], [1.0, -0.5], [-0.4, -0.8]];
        const hs = P0.map((p, k) => s.handle(p[0], p[1], { color: sgnCol(k < 3 ? qs[k] : 1), r: 8, constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1.6 ? [(x / r) * 1.6, (y / r) * 1.6] : [x, y]; } }));
        let info = {};
        v.render(() => {
          const cl = hs.map((h, k) => ({ x: h.x, y: h.y, q: k < 3 ? qs[k] : q4.value })), m = moments(cl);
          cl.forEach((c, k) => { hs[k].color = sgnCol(c.q); });
          const ring = (L) => (t) => { const th = (t * Math.PI) / 180, x = RR * Math.cos(th), y = RR * Math.sin(th); return L < 0 ? pot(cl, x, y) : multV(cl, L, x, y); };
          let mx = 1e-6; for (let k = 0; k <= 72; k++) mx = Math.max(mx, Math.abs(ring(-1)(k * 5)));
          heatPot(s, (x, y) => pot(cl, x, y), Math.max(mx, 1) * 0.9, 'p' + cl.map((c) => c.x.toFixed(2) + c.y.toFixed(2) + c.q.toFixed(1)).join(), { res: 3, alpha: 0.8 });
          s.circle(0, 0, RR, { color: 'ink', alpha: 0.5, dash: true, width: 1.2 });
          const pm = Math.hypot(m.p[0], m.p[1]);
          if (pm > 0.05) { const len = Math.min(2.4, 0.7 * pm); s.arrow(0, 0, (m.p[0] / pm) * len, (m.p[1] / pm) * len, { color: 'green', width: 3.2, head: 11 }); s.tex('\\mathbf p', (m.p[0] / pm) * len * 1.12 + 0.2, (m.p[1] / pm) * len * 1.12 + 0.25, { color: 'green', size: 15 }); }
          s.dot(0, 0, { r: 3, color: 'ink' });
          const top = mx * 1.25; sp.setView([0, 360], [-top, top]); sp.hline(0, { color: 'faint' });
          sp.fn(ring(0), { color: 'orange', dash: true, width: 2, domain: [0, 360], n: 361 });
          sp.fn(ring(1), { color: 'green', width: 2.2, domain: [0, 360], n: 361 });
          sp.fn(ring(-1), { color: 'ink', width: 1.6, domain: [0, 360], n: 361, alpha: 0.9 });
          let lo = 1e30, hi = -1e30; for (let k = 0; k <= 72; k++) { const y = ring(-1)(k * 5); lo = Math.min(lo, y); hi = Math.max(hi, y); }
          info = { Q: m.Q, p: m.p, pm, spread: hi - lo, mean: (hi + lo) / 2, th: (Math.atan2(m.p[1], m.p[0]) * 180) / Math.PI };
        });
        v.legend([['ink', 'exact'], ['orange', 'monopole only', { dash: true }], ['green', 'monopole + dipole']]);
        v.readout(() => `$Q=${v.fix(info.Q, 2)}$ nC, $\\mathbf p=(${v.fix(info.p[0], 2)},\\,${v.fix(info.p[1], 2)})$ nC·cm, $|\\mathbf p|=${v.fix(info.pm, 2)}$ nC·cm at ${v.fix(info.th, 0)}°.\n` + (Math.abs(info.Q) < 0.05 ? `Net charge zero: the ring potential swings from $${v.fix(info.mean - info.spread / 2, 1)}$ V to $${v.fix(info.mean + info.spread / 2, 1)}$ V around zero — a pure dipole pattern.` : `Net charge $\\ne0$: the ring potential is $${v.fix(info.mean, 1)}$ V on average, with a dipole ripple of only $\\pm${v.fix(info.spread / 2, 1)}$ V on top.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Dipole moment of a neutral system is origin-free',
      statement: String.raw`If the origin is moved to $\mathbf r_0$, the dipole moment of a charge system with total charge $Q$ changes from $\mathbf p$ to
$$\mathbf p'=\sum_iq_i(\mathbf r_i-\mathbf r_0)=\mathbf p-Q\,\mathbf r_0 .$$
So $\mathbf p$ does not depend on the choice of origin exactly when $Q=0$. For $Q\ne0$ the dipole moment vanishes for one special origin, the "centre of charge" $\mathbf r_0=\mathbf p/Q$ (the centroid weighted by charge).`,
      idea: String.raw`Subtract $\mathbf r_0$ from every position and use linearity: $\sum q_i(\mathbf r_i-\mathbf r_0)=\sum q_i\mathbf r_i-\mathbf r_0\sum q_i$. The same fact in the far field: the monopole term $Q/r$ itself changes when seen from a shifted origin, and re-expanding it about the new origin produces a dipole piece $Q\,\mathbf r_0\cdot\hat{\mathbf r}/r^2$ which must be compensated. Only when $Q=0$ is there no monopole to be re-expanded, which is why "the dipole moment of a molecule" is a well-defined number but that of an ion is not.`,
      caption: String.raw`Four charges (drag them; $q_4$ is the balance slider). The orange handle $O$ is the origin used to compute the moment, the hollow dot $O_0$ the reference origin. The colour map is the length $|\mathbf p|$ of the dipole moment as a function of where the origin is put: it grows linearly away from the centre of charge when $Q\ne0$ and is perfectly flat when $Q=0$ (press **balance**). The right plot shows $p_x$ against the $x$ of the origin and $p_y$ against its $y$: straight lines of slope $-Q$.`,
      scope: String.raw`Any finite charge system (the same algebra holds for continuous $\rho$). The conclusion concerns the *dipole moment* only; the quadrupole moment and above remain origin-dependent unless all lower moments vanish.`,
      deps: ['em-4.2'],
      refs: ['Griffiths §3.4'],
      tags: ['dipole', 'origin'],
      viz(v) {
        const s = v.stage({ x: [-4.5, 4.5], y: [-3.4, 3.4], equal: true, height: 340, axes: false, weight: 1.1, title: '$|\\mathbf p|$ for every choice of origin' });
        const sp = v.stage({ x: [-4, 4], y: [-8, 8], height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'coordinate of the origin (cm)', ylabel: 'dipole component (nC·cm)', title: 'components against the origin' });
        const q4 = v.slider('$q_4$', -6, 6, 1.5, { step: 0.1, fmt: (x) => nC(x) });
        v.button('balance: make $Q=0$', () => q4.set(Math.round(-(2 + 1 - 1.5) * 10) / 10));
        const qs = [2, 1, -1.5], P0 = [[-1.4, 0.9], [0.8, 1.1], [1.2, -0.7], [-0.6, -1.0]];
        const hs = P0.map((p, k) => s.handle(p[0], p[1], { color: 'muted', r: 8 }));
        const O = s.handle(2.4, -1.6, { color: 'orange', r: 9, label: 'O', labelPos: 'ne', constrain: { x: [-4.3, 4.3], y: [-3.2, 3.2] } });
        let info = {};
        v.render(() => {
          const cl = hs.map((h, k) => ({ x: h.x, y: h.y, q: k < 3 ? qs[k] : q4.value })); cl.forEach((c, k) => { hs[k].color = sgnCol(c.q); });
          const pAt = (x, y) => { const m = moments(cl, x, y); return [m.p[0], m.p[1]]; };
          const m0 = moments(cl), Q = m0.Q, mag = (x, y) => Math.hypot(...pAt(x, y));
          const mx = Math.max(mag(-4.5, -3.4), mag(4.5, 3.4), mag(-4.5, 3.4), mag(4.5, -3.4), 0.5);
          s.heat((x, y) => mag(x, y) / mx, { range: [0, 1], cmap: 'viridis', res: 3, key: cl.map((c) => c.x.toFixed(2) + c.y.toFixed(2) + c.q.toFixed(1)).join(), alpha: 0.55 });
          if (Math.abs(Q) > 0.05) s.contour((x, y) => mag(x, y), [mx * 0.25, mx * 0.5, mx * 0.75], { color: 'ink', alpha: 0.35, width: 1, res: 60 });
          const pO = pAt(O.x, O.y), p0 = pAt(0, 0);
          s.dot(0, 0, { r: 6, hollow: true, color: 'ink', label: 'O₀', labelPos: 'sw' });
          s.arrow(0, 0, O.x, O.y, { color: 'orange', width: 1.6, head: 7, alpha: 0.7 });
          const pm = Math.hypot(...pO), sc = 0.55;
          if (pm > 0.05) { s.arrow(O.x, O.y, O.x + pO[0] * sc, O.y + pO[1] * sc, { color: 'green', width: 3, head: 10 }); s.tex('\\mathbf p', O.x + pO[0] * sc + 0.25, O.y + pO[1] * sc + 0.25, { color: 'green', size: 14 }); }
          const pr = Math.max(4, Math.abs(p0[0]) + 5 * Math.abs(Q) + 1, Math.abs(p0[1]) + 5 * Math.abs(Q) + 1); sp.setView([-4, 4], [-pr, pr]);
          sp.hline(0, { color: 'faint' }); sp.vline(0, { color: 'faint' });
          sp.fn((a) => pAt(a, 0)[0], { color: 'accent', width: 2.2, domain: [-4, 4], n: 9 });
          sp.fn((a) => pAt(0, a)[1], { color: 'orange', width: 2.2, domain: [-4, 4], n: 9 });
          sp.dot(O.x, pO[0], { r: 6, color: 'accent' }); sp.dot(O.y, pO[1], { r: 6, color: 'orange' });
          info = { Q, p0, pO, pred: [p0[0] - Q * O.x, p0[1] - Q * O.y] };
        });
        v.legend([['accent', '$p_x$ against the $x$ of the origin'], ['orange', '$p_y$ against the $y$ of the origin']]);
        v.readout(() => `$Q=${v.fix(info.Q, 2)}$ nC. About $O_0$: $\\mathbf p=(${v.fix(info.p0[0], 2)},${v.fix(info.p0[1], 2)})$. About $O$: $\\mathbf p'=(${v.fix(info.pO[0], 2)},${v.fix(info.pO[1], 2)})$, and $\\mathbf p-Q\\mathbf r_0=(${v.fix(info.pred[0], 2)},${v.fix(info.pred[1], 2)})$ — the same.\n` + (Math.abs(info.Q) < 0.05 ? 'With $Q=0$ the shift $Q\\mathbf r_0$ is zero: the dipole moment is the same wherever the origin is.' : `Moving the origin by $\\mathbf r_0$ changed $\\mathbf p$ by $${v.fix(Math.hypot(info.pO[0] - info.p0[0], info.pO[1] - info.p0[1]), 2)}$ nC·cm.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Quadrupole moment tensor',
      statement: String.raw`The **quadrupole moment tensor** of charges $q_i$ at $\mathbf r_i$ is the symmetric, traceless matrix
$$\Theta_{jk}=\sum_iq_i\bigl(3x_{ij}x_{ik}-r_i^2\delta_{jk}\bigr),\qquad\operatorname{tr}\Theta=0 .$$
The $\ell=2$ term of the potential is $V_2=\dfrac1{4\pi\varepsilon_0}\dfrac{1}{2r^3}\sum_{jk}\Theta_{jk}\,\hat n_j\hat n_k$ (with $\hat{\mathbf n}=\hat{\mathbf r}$). Being real and symmetric, $\Theta$ has three orthogonal principal axes and real eigenvalues summing to zero.`,
      idea: String.raw`In the expansion of em-4.1 the $\ell=2$ term has $P_2(\cos\alpha)=\tfrac12(3\cos^2\alpha-1)$, and $r'^2P_2(\cos\alpha)=\tfrac12\bigl(3(\hat{\mathbf n}\cdot\mathbf r')^2-r'^2\bigr)$, which is the quadratic form of the matrix above (the $r^2\delta_{jk}$ term makes it traceless, matching the fact that $P_2$ has no $\ell=0$ part). A real symmetric matrix can be diagonalized by an orthogonal change of axes (the spectral theorem, ladr-7.29): along the principal axes the potential is $V_2\propto(\lambda_1n_1^2+\lambda_2n_2^2+\lambda_3n_3^2)/2r^3$, so the eigenvalues are the quadrupole strengths and the sign pattern gives the lobes.`,
      caption: String.raw`A charge arrangement with zero net charge and zero dipole moment. Choose a **linear** (−q, +2q, −q) or **rectangle** (alternating ± at the corners) quadrupole, and set its size and orientation. Left: the cluster with the principal axes of $\Theta$ drawn through its centre (red: positive eigenvalue, blue: negative; length proportional to the eigenvalue). Right: the exact potential in a wide view with its four-lobed pattern, whose lobes line up with those axes. The readout writes out $\Theta$ and its eigenvalues (which always add to zero, the third one being along the unseen $z$ axis).`,
      scope: String.raw`Point charges lying in a plane (so one principal axis is the normal to the plane), the potential drawn in that plane at distances several times the cluster's size. The normalisation $\Theta_{jk}=\sum q(3x_jx_k-r^2\delta_{jk})$ is Griffiths's convention up to a factor 2; other books use $\sum qx_jx_k$ or half of this.`,
      deps: ['em-4.1', 'ladr-7.29'],
      refs: ['Griffiths §3.4', 'Feynman II ch. 6'],
      tags: ['quadrupole', 'tensor'],
      viz(v) {
        const sL = v.stage({ x: [-2.4, 2.4], y: [-1.9, 1.9], equal: true, height: 320, axes: false, weight: 0.9, minWidth: 240, title: 'cluster and principal axes of $\\Theta$' });
        const sR = v.stage({ x: [-6, 6], y: [-4.2, 4.2], equal: true, height: 320, axes: false, weight: 1.1, minWidth: 260, title: 'far potential' });
        const shape = v.select('shape', [{ value: 'lin', label: 'linear: −q, +2q, −q' }, { value: 'rect', label: 'rectangle: + − + −' }], 'lin');
        const qS = v.slider('$q$', 0.5, 3, 1.5, { step: 0.1, fmt: (x) => nC(x) });
        const aS = v.slider('half-length $a$', 0.3, 1.5, 0.8, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const bS = v.slider('half-width $b$', 0.2, 1.2, 0.5, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const psi = v.slider('orientation $\\psi$', 0, 180, 25, { step: 1, fmt: (x) => `${x}°` });
        let info = {};
        v.render(() => {
          const lin = shape.value === 'lin', q = qS.value, a = aS.value, b = bS.value, ps = (psi.value * Math.PI) / 180, c = Math.cos(ps), sn = Math.sin(ps);
          bS.el.hidden = lin;
          const base = lin ? [[-a, 0, -q], [0, 0, 2 * q], [a, 0, -q]] : [[a, b, q], [-a, b, -q], [-a, -b, q], [a, -b, -q]];
          const cl = base.map(([x, y, w]) => ({ x: x * c - y * sn, y: x * sn + y * c, q: w })), m = moments(cl), E = eig3(m.T);
          const key = shape.value + q + a + b + psi.value;
          const ring = Math.max(...[0, 45, 90, 135].map((d) => Math.abs(pot(cl, 3 * Math.cos((d * Math.PI) / 180), 3 * Math.sin((d * Math.PI) / 180))))) + 1e-6;
          heatPot(sR, (x, y) => pot(cl, x, y), ring * 1.1, 'r' + key, { res: 3, alpha: 0.85 });
          sR.contour((x, y) => (Math.hypot(x, y) < 1.8 ? NaN : pot(cl, x, y)), levels(ring / 4, 6).filter((z) => z), { color: 'ink', alpha: 0.3, width: 1, res: 110 });
          sR.circle(0, 0, 1.8, { color: 'faint', fill: 'panel', fillAlpha: 0.85, width: 1 });
          for (const k of cl) { drawCharge(sL, k.x, k.y, k.q, 9); sR.dot(k.x, k.y, { r: 3.5, color: sgnCol(k.q) }); }
          const emax = Math.max(...E.values.map(Math.abs), 1e-9);
          E.values.forEach((lam, i) => {
            const u = E.vectors[i]; if (Math.abs(u[2]) > 0.5) return; const L = (1.7 * Math.abs(lam)) / emax + 0.1, col = lam > 0 ? 'red' : 'blue';
            sL.arrow(-u[0] * L, -u[1] * L, u[0] * L, u[1] * L, { color: col, width: 2, head: 9, both: true, alpha: 0.85 });
            sR.arrow(-u[0] * L * 0.6, -u[1] * L * 0.6, u[0] * L * 0.6, u[1] * L * 0.6, { color: col, width: 1.5, head: 6, both: true, alpha: 0.6 });
          });
          info = { T: m.T, Q: m.Q, p: m.p, val: E.values };
        });
        v.readout(() => {
          const T = info.T, f = (x) => v.fix(Math.abs(x) < 5e-9 ? 0 : x, 2);
          return `$Q=${f(info.Q)}$, $|\\mathbf p|=${f(Math.hypot(...info.p))}$.  $\\Theta=\\begin{pmatrix}${f(T[0][0])}&${f(T[0][1])}&${f(T[0][2])}\\\\${f(T[1][0])}&${f(T[1][1])}&${f(T[1][2])}\\\\${f(T[2][0])}&${f(T[2][1])}&${f(T[2][2])}\\end{pmatrix}$ nC·cm², trace $${f(T[0][0] + T[1][1] + T[2][2])}$.\nPrincipal values $${info.val.map(f).join(',\\;')}$ (sum $${f(info.val[0] + info.val[1] + info.val[2])}$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Multipole fields fall off ever faster',
      statement: String.raw`Far from the sources, the field of the $\ell$-th multipole falls off as $r^{-(\ell+2)}$ and its potential as $r^{-(\ell+1)}$: monopole $E\sim Q/r^2$, dipole $E\sim p/r^3$, quadrupole $E\sim\Theta/r^4$. On a log–log plot the slopes are $-2,-3,-4,\dots$. A system whose lowest non-vanishing moment is of order $\ell$ has far field $\propto r^{-(\ell+2)}$; with mixed moments the field changes from the $\ell=0$ slope to the $\ell=1$ slope and so on as $r$ grows, with crossovers at $r\sim p/Q$, $\Theta/p$, …`,
      idea: String.raw`Every term in the expansion of em-4.1 has the form $r'^{\ell}P_\ell/r^{\ell+1}$ with an angular factor independent of $r$, so the potential of order $\ell$ is exactly $\propto r^{-(\ell+1)}$; the field is a gradient (em-2.4), one more power of $1/r$. Intuitively each higher multipole is a pair of the previous order with opposite signs displaced by a small distance, and the two fields cancel to leading order, leaving a difference that is smaller by a factor $d/r$ (em-1.11 for the dipole as two charges).`,
      caption: String.raw`Three unit sources on the $x$ axis: a point charge ($1$ nC), a dipole ($\pm1$ nC a distance $d$ apart) and a linear quadrupole ($-1,+2,-1$ nC spaced $d$), each with a weight slider; the field is evaluated along the axis. Left: $|E|$ on log–log axes for each source (dashed) and for their sum (ink); right: the local slope $d\ln|E|/d\ln r$ with guide lines at $-2$, $-3$, $-4$. Close in, the sum follows whichever source is largest; far out, the lowest multipole present takes over. The monopole starts weak (weight 0.03), so the slope runs from $-4$ through $-3$ to $-2$ as $r$ grows; raise its weight and the monopole wins earlier, set it to zero and the dipole wins at infinity, kill both and only the $r^{-4}$ quadrupole remains.`,
      scope: String.raw`Field on the axis of the linear arrangements, computed exactly from the point charges (no multipole approximation). The slopes $-2,-3,-4$ are reached only for $r\gg d$; inside $r\approx d$ the exact field is that of separate charges. Arbitrary directions give the same powers.`,
      deps: ['em-4.1'],
      refs: ['Griffiths §3.4'],
      tags: ['falloff', 'scaling'],
      viz(v) {
        const sp = v.stage({ x: [0.2, 100], y: [1e-7, 1e6], xlog: true, ylog: true, height: 350, axes: 'box', gutter: true, weight: 1.1, minWidth: 270, xlabel: 'distance $r$ along the axis (cm)', ylabel: '$|E|$ (V/cm)', title: 'field strength' });
        const ss = v.stage({ x: [0.2, 100], y: [-5.5, -1], xlog: true, height: 350, axes: 'box', gutter: true, weight: 0.9, minWidth: 250, xlabel: 'distance $r$ (cm)', ylabel: 'slope $d\\ln|E|/d\\ln r$', title: 'local power law', yticks: [-5, -4, -3, -2, -1] });
        const w0 = v.slider('monopole weight', 0, 1, 0.03, { step: 0.01 }), w1 = v.slider('dipole weight', 0, 1, 1, { step: 0.05 }), w2 = v.slider('quadrupole weight', 0, 1, 1, { step: 0.05 });
        const dS = v.slider('spacing $d$', 0.2, 2, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const rS = v.slider('probe distance $r$', 0.2, 100, 5, { log: true, fmt: (x) => `${v.fmt(x, 3)} cm` });
        const srcs = (d) => [[[0, 1]], [[-d / 2, -1], [d / 2, 1]], [[-d, -1], [0, 2], [d, -1]]];
        // on-axis field at r > 0 of charges [x_i, q_i], signed along +x; the sign of the pair is chosen so the field is positive far out
        const Ex = (S, r) => { let e = 0; for (const [x, q] of S) e += (KV * q) / ((r - x) * Math.abs(r - x)); return e; };
        let info = {};
        v.render(() => {
          const d = dS.value, ws = [w0.value, w1.value, w2.value], S = srcs(d), cols = ['orange', 'green', 'purple'];
          const f = (k) => (r) => Math.max(1e-12, Math.abs(ws[k] * Ex(S[k], r))), tot = (r) => Math.max(1e-12, Math.abs(ws.reduce((t, w, k) => t + w * Ex(S[k], r), 0)));
          const slope = (g, r) => (Math.log(g(r * 1.02)) - Math.log(g(r / 1.02))) / Math.log(1.02 * 1.02);
          for (let k = 0; k < 3; k++) if (ws[k] > 0.001) { sp.fn(f(k), { domain: [0.2, 100], n: 220, color: cols[k], dash: true, width: 1.6 }); ss.fn((r) => slope(f(k), r), { domain: [0.2, 100], n: 220, color: cols[k], dash: true, width: 1.6 }); }
          sp.fn(tot, { domain: [0.2, 100], n: 260, color: 'ink', width: 2.6 }); ss.fn((r) => slope(tot, r), { domain: [0.2, 100], n: 260, color: 'ink', width: 2.6 });
          [-2, -3, -4].forEach((s0) => { ss.hline(s0, { color: 'faint', alpha: 0.7 }); ss.text(`${s0}`.replace('-', '−'), 0.22, s0 + 0.15, { size: 10, color: 'muted' }); });
          const r = rS.value; sp.dot(r, tot(r), { r: 6, color: 'gold' }); ss.dot(r, slope(tot, r), { r: 6, color: 'gold' }); sp.vline(d, { color: 'faint', dash: true }); ss.vline(d, { color: 'faint', dash: true });
          info = { r, d, E: tot(r), sl: slope(tot, r), sk: [0, 1, 2].map((k) => (ws[k] > 0.001 ? slope(f(k), r) : NaN)) };
        });
        v.legend([['orange', 'monopole', { dash: true }], ['green', 'dipole', { dash: true }], ['purple', 'quadrupole', { dash: true }], ['ink', 'sum']]);
        v.readout(() => `At $r=${v.fmt(info.r, 3)}$ cm ($r/d=${v.fmt(info.r / info.d, 3)}$): $|E|=${v.sci(info.E, 3)}$ V/cm, total slope $${v.fix(info.sl, 2)}$. Slopes of the separate sources: ${info.sk.map((x, k) => (isNaN(x) ? '—' : `$${v.fix(x, 2)}$`)).join(', ')} (monopole, dipole, quadrupole; they approach $-2$, $-3$, $-4$ once $r\\gg d$).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Spherical-harmonic expansion of the potential',
      statement: String.raw`For charges inside the sphere $r'\le a$ the potential at $r>a$ is
$$V(r,\theta,\varphi)=\frac1{\varepsilon_0}\sum_{\ell=0}^\infty\sum_{m=-\ell}^{\ell}\frac1{2\ell+1}\,\frac{q_{\ell m}}{r^{\ell+1}}\,Y_{\ell m}(\theta,\varphi),\qquad q_{\ell m}=\int r'^{\,\ell}\,Y_{\ell m}(\theta',\varphi')\,\rho(\mathbf r')\,d\tau',$$
with $Y_{\ell m}$ the orthonormal real spherical harmonics. The $2\ell+1$ numbers $q_{\ell m}$ are the multipole moments of order $\ell$. Rotating the charge system mixes the $q_{\ell m}$ with the same $\ell$ among themselves and leaves $\sum_mq_{\ell m}^2$ unchanged.`,
      idea: String.raw`The addition theorem for spherical harmonics, $P_\ell(\cos\alpha)=\frac{4\pi}{2\ell+1}\sum_mY_{\ell m}(\theta,\varphi)Y_{\ell m}(\theta',\varphi')$, splits the Legendre term of em-4.1 into a product of a function of the field point and a function of the source point; the latter integrates to $q_{\ell m}$. A rotation acts on the $2\ell+1$ harmonics of one $\ell$ by an orthogonal matrix (the harmonics of a given $\ell$ form an invariant subspace, as in the separation of variables of em-3.15), so the length of the vector $(q_{\ell,-\ell},\dots,q_{\ell\ell})$ cannot change.`,
      caption: String.raw`Six charges in space (left: 3D view of the cluster, drag to rotate the view; the gold arrow is the probe direction) are rotated rigidly with the two sliders (about $z$, then about $y$). The bars show the real moments $q_{\ell m}$ for $\ell=0\ldots3$, $m=-\ell\ldots\ell$ (left to right within each group); the right-hand panel the power $\sum_mq_{\ell m}^2$ of each order. Rotating shuffles the heights within every group but leaves $q_{00}$ and the power bars exactly fixed. The readout compares the exact potential at the probe point with the expansion cut at $\ell\le L$.`,
      scope: String.raw`Valid outside a sphere containing all of the charge. The harmonics are real orthonormal ($\cos m\varphi$ for $m>0$, $\sin|m|\varphi$ for $m<0$, no Condon–Shortley phase), so the numerical values of $q_{\ell m}$ differ from the complex $q_{\ell m}$ of other texts by normalisation factors, though the power per order is the same up to those factors. The rotation here is of the charges, with the field point fixed.`,
      credit: 'Laplace, 1782 (harmonics); Gauss, 1839 (spherical-harmonic potential theory)',
      verify: true,
      deps: ['em-4.1', 'em-3.15'],
      refs: ['Griffiths §3.4'],
      tags: ['spherical harmonics', 'moments'],
      viz(v) {
        const base = [[0.6, 0.2, 0.3, 2], [-0.5, 0.4, -0.2, -1], [0.1, -0.7, 0.5, 1.5], [-0.3, -0.2, -0.7, -1.2], [0.7, -0.4, -0.5, 0.8], [-0.4, 0.6, 0.6, -0.6]];
        const s3 = v.stage3d({ range: 1.3, height: 330, yaw: -0.7, pitch: 0.35, axes: false, weight: 0.8, minWidth: 240, title: 'the cluster (rotated)' });
        const sB = v.stage({ x: [-0.5, 17.3], y: [-1, 1], height: 330, axes: 'box', gutter: true, weight: 1.1, minWidth: 280, xlabel: '$\\ell=0\\ldots3$, each group $m=-\\ell\\ldots\\ell$', ylabel: '$q_{\\ell m}$', xticks: [], title: 'moments $q_{\\ell m}$' });
        const sW = v.stage({ x: [-0.6, 3.6], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 0.6, minWidth: 200, xlabel: 'order $\\ell$', ylabel: '$\\sum_mq_{\\ell m}^2$', xticks: [0, 1, 2, 3], title: 'power per order'  });
        const az = v.slider('rotate about $z$', 0, 360, 0, { step: 1, fmt: (x) => `${x}°` }), tilt = v.slider('rotate about $y$', 0, 180, 0, { step: 1, fmt: (x) => `${x}°` });
        const Ls = v.slider('keep orders $\\ell\\le L$', 0, 3, 2, { int: true });
        const pn = [3, 2, 4], pn_r = Math.hypot(...pn), cols = ['ink', 'orange', 'green', 'purple'];
        const pos = []; { let x = 0; for (let l = 0; l <= 3; l++) { for (let m = -l; m <= l; m++) pos.push([l, m, x++]); x += 0.6; } }
        const mk = (a, b) => base.map(([x, y, z, q]) => { const p = rot3([x, y, z], a, b); return { x: p[0], y: p[1], z: p[2], q }; });
        // vertical scale: largest |q_lm| over a sweep of rotations
        let ymax = 0; for (let ia = 0; ia < 8; ia++) for (let ib = 0; ib < 5; ib++) { const cl = mk((ia * Math.PI) / 4, (ib * Math.PI) / 4); for (const [l, m] of pos) ymax = Math.max(ymax, Math.abs(qlm(cl, l, m))); }
        ymax *= 1.15;
        const P0 = []; { const cl = mk(0, 0); for (let l = 0; l <= 3; l++) { let t = 0; for (let m = -l; m <= l; m++) t += qlm(cl, l, m) ** 2; P0.push(t); } }
        let info = {};
        v.render(() => {
          const a = (az.value * Math.PI) / 180, b = (tilt.value * Math.PI) / 180, cl = mk(a, b), L = Ls.value;
          for (const [p, q] of [[[1.1, 0, 0], 'x'], [[0, 1.1, 0], 'y'], [[0, 0, 1.1], 'z']]) { s3.line([0, 0, 0], p, { color: 'faint' }); s3.text(q, p, { color: 'muted' }); }
          for (const c of cl) { s3.line([0, 0, 0], [c.x, c.y, c.z], { color: 'faint', alpha: 0.4 }); s3.dot([c.x, c.y, c.z], { r: 6 + 2.5 * Math.abs(c.q), color: sgnCol(c.q) }); }
          s3.arrow([0, 0, 0], [(pn[0] / pn_r) * 1.25, (pn[1] / pn_r) * 1.25, (pn[2] / pn_r) * 1.25], { color: 'gold', width: 2.6 });
          sB.setView([-0.5, 17.3], [-ymax, ymax]);
          for (const [l, m, x] of pos) { const q = qlm(cl, l, m); sB.rect(x - 0.4, 0, x + 0.4, q, { color: cols[l], fill: cols[l], fillAlpha: 0.5 }); }
          for (let l = 0; l <= 3; l++) { const xs = pos.filter((p) => p[0] === l).map((p) => p[2]); sB.tex(`\\ell=${l}`, (xs[0] + xs[xs.length - 1]) / 2, ymax * 0.9, { color: cols[l], size: 13, align: 'center' }); }
          sB.hline(0, { color: 'faint' });
          const pw = [], pm = Math.max(...P0);
          sW.setView([-0.6, 3.6], [0, pm * 1.25]);
          for (let l = 0; l <= 3; l++) { let t = 0; for (let m = -l; m <= l; m++) t += qlm(cl, l, m) ** 2; pw.push(t); sW.rect(l - 0.35, 0, l + 0.35, t, { color: cols[l], fill: cols[l], fillAlpha: 0.45, width: 2 }); sW.text(v.fix(t, 2), l, t + pm * 0.06, { align: 'center', size: 12, color: cols[l] }); }
          let V = 0; for (let l = 0; l <= L; l++) { let t = 0; for (let m = -l; m <= l; m++) t += qlm(cl, l, m) * realY(l, m, ...pn); V += ((4 * Math.PI) / (2 * l + 1)) * t / Math.pow(pn_r, l + 1); }
          info = { Vex: pot(cl, ...pn.slice(0, 2), pn[2]), Vl: KV * V, pw, L };
        });
        v.readout(() => `Exact potential at the probe point $(3,2,4)$ cm: $${v.fix(info.Vex, 3)}$ V.  Expansion with $\\ell\\le${info.L}$: $${v.fix(info.Vl, 3)}$ V (error ${v.sci(Math.abs(info.Vex - info.Vl) / Math.abs(info.Vex) + 1e-16, 2).replace(/^/, '$')}$).\nPower per order $\\sum_mq_{\\ell m}^2$: ${info.pw.map((x) => `$${v.fix(x, 3)}$`).join(', ')} for $\\ell=0,1,2,3$ — unchanged by rotation.`);
      },
    },
  ],
};
