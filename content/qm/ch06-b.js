// Quantum Mechanics — Chapter 6, part b: items 6.5–6.8 (stationary phase, minimal coupling and gauge invariance, Aharonov–Bohm, Landau levels)
// Units: ħ = m = 1 (and e = 1 for the charge in 6.6–6.8) unless an item says otherwise.
import { TAU, phaseLUT, drawPsi, drawReal, phaseWheel, fz, sub, grid, interp } from './ch06.shared.js';

export default {
  collection: 'qm',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5',
      kind: 'Theorem',
      name: 'Stationary phase selects the classical path',
      statement: String.raw`Let $S[x]=\int_0^T L\,dt$ be the action of a path with fixed end points, and suppose $x_{\rm cl}$ is a path at which $S$ is stationary and nondegenerate (the second variation $\delta^2S$ has no zero eigenvalue). Then for $\hbar\to0$
$$\int e^{iS[x]/\hbar}\,\mathcal Dx\;\sim\;(\text{prefactor})\;e^{iS[x_{\rm cl}]/\hbar}\,e^{-i\pi\nu/2}\ ,$$
where $\nu$ is the number of negative eigenvalues of $\delta^2S$ at $x_{\rm cl}$ (the Morse index); contributions from paths whose action differs from $S[x_{\rm cl}]$ at first order cancel by rapid oscillation. In a one-parameter family $x_a=x_{\rm cl}+a\,\eta$ with $S(a)=S_{\rm cl}+\tfrac12S''a^2$ the oscillatory integral is $\int e^{iS(a)/\hbar}da=\sqrt{2\pi\hbar/|S''|}\,e^{iS_{\rm cl}/\hbar}\,e^{\pm i\pi/4}$, dominated by $|a|\lesssim\sqrt{2\pi\hbar/|S''|}$ — a window that closes on the classical path as $\hbar\to0$.`,
      idea: String.raw`The method of stationary phase (waves-5.2 uses it to get Fermat’s principle): where the phase $S/\hbar$ changes at first order along the family, neighbouring contributions point in different directions and sum to almost nothing; only near a stationary point do phasors line up. Expanding $S$ to second order and doing the Fresnel integral gives the width $\sqrt{2\pi\hbar/|S''|}$ and the phase $\pm\pi/4$. Hamilton’s principle (mech-6.5) says the stationary path is the classical trajectory, so the path integral (6.4) reduces to classical mechanics plus a fluctuation factor as $\hbar\to0$. When $S''$ changes sign (at a conjugate point, e.g. $T=\pi$ for the oscillator) the phase jumps by $\pi/2$ — the Maslov/Morse index.`,
      caption: String.raw`Fix the end points and vary a single mode $x_a(t)=x_{\rm cl}(t)+a\sin(\pi t/T)$. **Slide $\hbar$ down**: in the first panel only the paths in the green bundle (those with $|a|<\sqrt{2\pi\hbar/S''}$) keep nearly the same phase, and the bundle contracts onto the classical path; the middle plot shows $\cos[(S(a)-S_{\rm cl})/\hbar]$, which oscillates ever faster away from $a=0$. The right-hand curve is the running integral $\int_{-A}^{a}e^{i(S-S_{\rm cl})/\hbar}da'$ (a Cornu spiral): it ends at the Fresnel value $\sqrt{2\pi\hbar/S''}\,e^{i\pi/4}$ (large square). For the oscillator raise $T$ towards $\pi$: $S''\to0$, the window widens, and past $\pi$ the sign flips.`,
      deps: ['qm-6.4', 'waves-5.2'],
      refs: ['Sakurai ch. 2'],
      credit: 'Dirac, 1933; Feynman, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_stationary_phase' },
      tags: ['stationary phase', 'classical limit', 'action'],
      viz(v) {
        const M = v.M, XA = -1, XB = 1, AM = 3, NA = 6001, G0 = 1;
        const sys = v.select('system', [{ value: 'free', label: 'free' }, { value: 'osc', label: 'oscillator $\\tfrac12x^2$' }, { value: 'grav', label: 'uniform gravity' }], 'free', { onChange: () => { key = ''; } });
        const tS = v.slider('duration $T$', 0.6, 3.6, 1.6, { step: 0.05, onChange: () => { key = ''; } });
        const hS = v.slider('$\\hbar$', 0.02, 3, 0.4, { log: true });
        const A = v.stage({ x: [0, 4], y: [-3.4, 3.4], height: 260, axes: 'box', gutter: true, xlabel: 't', ylabel: 'x', title: 'paths $x_{\\rm cl}+a\\sin(\\pi t/T)$' });
        const B = v.stage({ x: [-AM, AM], y: [-1.25, 1.25], height: 260, axes: 'box', gutter: true, xlabel: 'a', ylabel: '$\\cos[(S-S_{cl})/\\hbar]$', title: 'phase of the contribution of each path' });
        const C = v.stage({ x: [-1, 1], y: [-1, 1], height: 260, equal: true, axes: true, title: 'running phasor sum (Cornu spiral)' });
        let key = '', S = null, S0 = 0, S2 = 0, xcl = null, Tn = 1;
        function build() {
          Tn = tS.value; const T = Tn, sn = Math.sin(T), cs = Math.cos(T), s = sys.value;
          const cOsc = Math.abs(sn) < 1e-6 ? 0 : (XB - XA * cs) / sn;
          xcl = s === 'free' ? (t) => XA + ((XB - XA) * t) / T : s === 'osc' ? (t) => XA * Math.cos(t) + cOsc * Math.sin(t) : (t) => XA + ((XB - XA) * t) / T + (G0 / 2) * (T * t - t * t);
          const vcl = s === 'free' ? () => (XB - XA) / T : s === 'osc' ? (t) => -XA * Math.sin(t) + cOsc * Math.cos(t) : (t) => (XB - XA) / T + (G0 / 2) * (T - 2 * t);
          const V = s === 'free' ? () => 0 : s === 'osc' ? (x) => 0.5 * x * x : (x) => G0 * x;
          const act = (a) => M.integrate((t) => { const x = xcl(t) + a * Math.sin((Math.PI * t) / T), xd = vcl(t) + a * (Math.PI / T) * Math.cos((Math.PI * t) / T); return 0.5 * xd * xd - V(x); }, 0, T, 120);
          S = new Float64Array(NA); for (let i = 0; i < NA; i++) S[i] = act(-AM + (2 * AM * i) / (NA - 1));
          S0 = act(0); S2 = act(1) + act(-1) - 2 * S0;
        }
        let st = null;
        v.render(() => {
          const sk = `${sys.value}|${tS.value}`; if (sk !== key) { key = sk; build(); }
          const col = phaseLUT(v), hb = hS.value, T = Tn, da = (2 * AM) / (NA - 1);
          const w = S2 > 1e-9 ? Math.sqrt((2 * Math.PI * hb) / S2) : Infinity;
          A.setView([0, T * 1.0], [-3.4, 3.4]);
          for (let k = 0; k <= 40; k++) {
            const a = -AM + (2 * AM * k) / 40, i = Math.round(((a + AM) / (2 * AM)) * (NA - 1)), inside = Math.abs(a) < w;
            A.curve((t) => [t, xcl(t) + a * Math.sin((Math.PI * t) / T)], 0, T, { color: col((S[i] - S0) / hb), width: inside ? 2 : 1, alpha: inside ? 0.95 : 0.35, n: 50 });
          }
          A.curve((t) => [t, xcl(t)], 0, T, { color: 'ink', width: 2.4, n: 80 });
          A.dot(0, XA, { r: 5, color: 'ink' }); A.dot(T, XB, { r: 5, color: 'ink' });
          phaseWheel(A, col, A.W - 42, 60, 11, 'phase of S/ħ');
          B.fn((a) => Math.cos(((S[Math.max(0, Math.min(NA - 1, Math.round(((a + AM) / (2 * AM)) * (NA - 1))))] - S0) / hb)), { color: 'accent', width: 1.6, n: 1500 });
          if (Number.isFinite(w)) B.vband(-w, w, { color: 'green', alpha: 0.18 });
          B.hline(0, { color: 'faint' });
          // running phasor integral
          let ir = 0, ii = 0; const path = [[0, 0]], cut = [], step = 6; let pr = 1, pi = 0;
          let totR = 0, totI = 0, win = [0, 0], wl = [0, 0]; let first = true;
          for (let i = 0; i < NA; i++) {
            const a = -AM + i * da, ang = (S[i] - S0) / hb, cr = Math.cos(ang), ci = Math.sin(ang);
            if (i > 0) { ir += 0.5 * (pr + cr) * da; ii += 0.5 * (pi + ci) * da; }
            pr = cr; pi = ci;
            if (i % step === 0) path.push([ir, ii]);
            if (Number.isFinite(w)) { if (a >= -w && first) { wl = [ir, ii]; first = false; } if (a <= w) win = [ir, ii]; }
          }
          totR = ir; totI = ii;
          const pred = Number.isFinite(w) ? [w * Math.cos(Math.PI / 4), w * Math.sin(Math.PI / 4)] : null;
          const Rr = Math.max(0.35, 1.25 * Math.max(...path.map((q) => Math.hypot(q[0], q[1]))));
          C.setView([-Rr, Rr], [-Rr, Rr]);
          C.path(path, { color: 'accent', width: 1.6 });
          C.dot(0, 0, { r: 4, color: 'ink' });
          if (Number.isFinite(w)) { C.dot(wl[0], wl[1], { r: 4, color: 'green' }); C.dot(win[0], win[1], { r: 4, color: 'green' }); C.line(wl[0], wl[1], win[0], win[1], { color: 'green', width: 2 }); }
          C.dot(totR, totI, { r: 6, color: 'gold' });
          if (pred) C.dot(pred[0], pred[1], { r: 8, hollow: true, color: 'red' });
          const frac = Number.isFinite(w) ? Math.hypot(win[0] - wl[0], win[1] - wl[1]) / Math.hypot(totR, totI) : null;
          st = { w, S2, tot: [totR, totI], pred, frac, S0, hb };
        });
        v.legend([['ink', 'classical path'], ['green', 'bundle $|a|<\\sqrt{2\\pi\\hbar/S\'\'}$'], ['gold', 'full integral', { dot: true }], ['red', 'Fresnel prediction', { dot: true }]]);
        v.readout(() => st && `$S_{\\rm cl}=${v.fix(st.S0, 4)}$, $S''=${v.fix(st.S2, 4)}$ ${st.S2 <= 0 ? '(≤ 0: beyond the conjugate point, the phase flips)' : ''} · window $\\sqrt{2\\pi\\hbar/S''}=${Number.isFinite(st.w) ? v.fix(st.w, 3) : '\\infty'}$ · $\\int e^{i(S-S_{cl})/\\hbar}da=${v.fix(st.tot[0], 4)}${st.tot[1] < 0 ? '-' : '+'}${v.fix(Math.abs(st.tot[1]), 4)}i$` + (st.pred ? ` vs. Fresnel $${v.fix(st.pred[0], 4)}+${v.fix(st.pred[1], 4)}i$; the green bundle's own phasor sum has ${v.fix(st.frac, 2)} times the length of the full integral.` : '.'));
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'Minimal coupling and gauge invariance',
      statement: String.raw`A particle of charge $q$ in electromagnetic potentials $(\Phi,\mathbf A)$ has Hamiltonian $H=\frac1{2m}\big(\mathbf p-q\mathbf A\big)^2+q\Phi$ (**minimal coupling**: $\mathbf p\to\mathbf p-q\mathbf A$, $E\to E-q\Phi$). For any smooth function $\chi(\mathbf x,t)$, the simultaneous replacement
$$\psi\to e^{iq\chi/\hbar}\psi,\qquad \mathbf A\to\mathbf A+\nabla\chi,\qquad \Phi\to\Phi-\partial_t\chi$$
maps solutions of the Schrödinger equation to solutions: $i\hbar\partial_t\psi=H\psi$ is **gauge covariant**. The density $|\psi|^2$, the gauge-invariant current $\mathbf j=\frac1m\operatorname{Im}\!\big(\bar\psi(\hbar\nabla-iq\mathbf A)\psi\big)$, the fields $\mathbf E=-\nabla\Phi-\partial_t\mathbf A$, $\mathbf B=\nabla\times\mathbf A$ and all expectation values of kinetic momentum $m\mathbf v=\mathbf p-q\mathbf A$ are unchanged. Transforming only $\psi$ or only the potentials does not give a solution.`,
      idea: String.raw`The kinetic momentum operator $\boldsymbol\pi=\mathbf p-q\mathbf A$ turns into $e^{iq\chi/\hbar}\boldsymbol\pi\,e^{-iq\chi/\hbar}$ under the transformation: $-i\hbar\nabla(e^{iq\chi/\hbar}\psi)=e^{iq\chi/\hbar}(-i\hbar\nabla\psi+q\nabla\chi\,\psi)$, and the extra $q\nabla\chi$ is exactly what $\mathbf A\to\mathbf A+\nabla\chi$ removes. Likewise $i\hbar\partial_t(e^{iq\chi/\hbar}\psi)=e^{iq\chi/\hbar}(i\hbar\partial_t\psi-q\partial_t\chi\,\psi)$ is compensated by $\Phi\to\Phi-\partial_t\chi$. The gauge freedom of the potentials of em-10.9 therefore acts on quantum states as a local change of phase. Only gauge-invariant combinations can be measured — until a loop makes the phase physical (6.7).`,
      caption: String.raw`A displaced oscillator packet (an exact coherent state) is shown in a gauge given by the travelling phase $\chi=\alpha\sin(\kappa x-\Omega t)$. Raise $\alpha$: the colours of $\psi'$ twist (the phase is gauge-dependent) while $|\psi'|^2$ and the kinetic current stay put. The bottom panel is the residual $|i\partial_t\psi'-H'\psi'|$ (log scale), computed by finite differences from the closed forms: it sits at numerical zero when **both** ψ and the potentials are transformed ("both"), and jumps by many orders of magnitude if only the wave function ("ψ only") or only the potentials ("potentials only") is changed.`,
      deps: ['qm-2.4', 'em-10.9', 'mech-6.14'],
      refs: ['Griffiths §4.5', 'Sakurai ch. 2'],
      credit: 'Weyl, 1929; Fock, 1926 (gauge phase of ψ)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gauge_theory#Classical_gauge_theory' },
      tags: ['gauge invariance', 'minimal coupling', 'vector potential'],
      verify: true,
      viz(v) {
        const aS = v.slider('gauge function amplitude $\\alpha$', 0, 3, 1.5, { step: 0.05 });
        const kS = v.slider('wavenumber $\\kappa$', 0.5, 4, 2, { step: 0.1 });
        const wS = v.slider('frequency $\\Omega$', 0, 4, 1.5, { step: 0.1 });
        const tS = v.slider('time $t$', 0, 6.2, 1, { step: 0.05 });
        const opt = v.select('transform', [{ value: 'both', label: 'both ψ and potentials' }, { value: 'psi', label: 'ψ only' }, { value: 'pot', label: 'potentials only' }], 'both');
        const X0 = 1.8;
        const psi = (x, t) => { // coherent state of ½p²+½x²
          const xc = X0 * Math.cos(t), pc = -X0 * Math.sin(t), ph = pc * x - 0.5 * xc * pc - 0.5 * t, am = Math.PI ** -0.25 * Math.exp(-0.5 * (x - xc) ** 2);
          return [am * Math.cos(ph), am * Math.sin(ph)];
        };
        const chi = (x, t) => aS.value * Math.sin(kS.value * x - wS.value * t);
        const chiX = (x, t) => aS.value * kS.value * Math.cos(kS.value * x - wS.value * t);
        const chiT = (x, t) => -aS.value * wS.value * Math.cos(kS.value * x - wS.value * t);
        const gauged = (x, t, o) => { const [a, b] = psi(x, t); if (o === 'pot' || o === 'zero') return [a, b]; const c = Math.cos(chi(x, t)), s = Math.sin(chi(x, t)); return [a * c - b * s, a * s + b * c]; };
        const Af = (x, t, o) => (o === 'psi' || o === 'zero' ? 0 : chiX(x, t)), Pf = (x, t, o) => (o === 'psi' || o === 'zero' ? 0 : -chiT(x, t));
        const d1 = (f, x, h) => [(-f(x + 2 * h)[0] + 8 * f(x + h)[0] - 8 * f(x - h)[0] + f(x - 2 * h)[0]) / (12 * h), (-f(x + 2 * h)[1] + 8 * f(x + h)[1] - 8 * f(x - h)[1] + f(x - 2 * h)[1]) / (12 * h)];
        const d2 = (f, x, h) => { const m = f(x); return [(-f(x + 2 * h)[0] + 16 * f(x + h)[0] - 30 * m[0] + 16 * f(x - h)[0] - f(x - 2 * h)[0]) / (12 * h * h), (-f(x + 2 * h)[1] + 16 * f(x + h)[1] - 30 * m[1] + 16 * f(x - h)[1] - f(x - 2 * h)[1]) / (12 * h * h)]; };
        /** Residual of i∂_tψ' = H'ψ' with H' = ½(−i∂ − A')² + ½x² + Φ' (ħ = m = q = 1). */
        function residual(x, t, o) {
          const f = (X) => gauged(X, t, o), h = 0.005, ht = 0.002;
          const dt = [(-gauged(x, t + 2 * ht, o)[0] + 8 * gauged(x, t + ht, o)[0] - 8 * gauged(x, t - ht, o)[0] + gauged(x, t - 2 * ht, o)[0]) / (12 * ht), (-gauged(x, t + 2 * ht, o)[1] + 8 * gauged(x, t + ht, o)[1] - 8 * gauged(x, t - ht, o)[1] + gauged(x, t - 2 * ht, o)[1]) / (12 * ht)];
          const p = f(x), px = d1(f, x, h), pxx = d2(f, x, h), A = Af(x, t, o), P = Pf(x, t, o);
          // (−i∂−A)²ψ = −ψ'' + 2iAψ' + iA'ψ + A²ψ   (A' = ∂_xA)
          const Ax = (Af(x + 1e-4, t, o) - Af(x - 1e-4, t, o)) / 2e-4;
          const kin = [-pxx[0] - 2 * A * px[1] - Ax * p[1] + A * A * p[0], -pxx[1] + 2 * A * px[0] + Ax * p[0] + A * A * p[1]];
          const Hp = [0.5 * kin[0] + (0.5 * x * x + P) * p[0], 0.5 * kin[1] + (0.5 * x * x + P) * p[1]];
          return Math.hypot(-dt[1] - Hp[0], dt[0] - Hp[1]); // i∂_tψ = (−Im, Re) of ∂_tψ ... : i(a+ib) = −b + ia
        }
        const current = (x, t, o) => { const f = (X) => gauged(X, t, o), p = f(x), px = d1(f, x, 0.005); return p[0] * px[1] - p[1] * px[0] - Af(x, t, o) * (p[0] * p[0] + p[1] * p[1]); };
        const S1 = v.stage({ x: [-5, 5], y: [-0.1, 0.85], height: 230, axes: 'box', gutter: true, xlabel: 'x', ylabel: '$|\\psi|$', title: 'the state $\\psi\'=e^{i\\chi}\\psi$ (height $|\\psi|$, colour $\\arg\\psi\'$)' });
        const S2 = v.stage({ x: [-5, 5], y: [-4, 4], height: 230, axes: 'box', gutter: true, xlabel: 'x', title: 'potentials: $A\'=\\partial_x\\chi$ and $\\Phi\'=-\\partial_t\\chi$; kinetic current' });
        const S3 = v.stage({ x: [-5, 5], y: [-15, 2], height: 200, axes: 'box', gutter: true, full: true, xlabel: 'x', ylabel: '$\\log_{10}|R|$', title: 'residual of the Schrödinger equation $|i\\partial_t\\psi\'-H\'\\psi\'|$' });
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), t = tS.value, o = opt.value, NX = 241, xs = Float64Array.from({ length: NX }, (_, i) => -5 + (10 * i) / (NX - 1));
          const re = new Float64Array(NX), im = new Float64Array(NX); let dRho = 0, dJ = 0, rmax = 0; const rs = [], j0 = [], j1 = [];
          for (let i = 0; i < NX; i++) {
            const g = gauged(xs[i], t, o), p0 = psi(xs[i], t); re[i] = g[0]; im[i] = g[1];
            dRho = Math.max(dRho, Math.abs(g[0] * g[0] + g[1] * g[1] - p0[0] * p0[0] - p0[1] * p0[1]));
            const r = residual(xs[i], t, o), jj = current(xs[i], t, o), j00 = current(xs[i], t, 'zero');
            rs.push([xs[i], Math.log10(r + 1e-16)]); rmax = Math.max(rmax, r); j0.push([xs[i], j00]); j1.push([xs[i], jj]); dJ = Math.max(dJ, Math.abs(jj - j00));
          }
          const pr = []; for (let i = 0; i < NX; i++) pr.push([xs[i], Math.hypot(...psi(xs[i], t))]);
          S1.path(pr, { color: 'muted', width: 1.2, dash: [4, 3] });
          drawPsi(S1, xs, re, im, { col, alpha: 0.7 });
          phaseWheel(S1, col, S1.W - 42, 60, 11);
          S2.fn((x) => Af(x, t, o), { color: 'orange', width: 2, n: 400 });
          S2.fn((x) => Pf(x, t, o), { color: 'purple', width: 2, n: 400 });
          S2.path(j1, { color: 'accent', width: 2.2 });
          S2.path(j0, { color: 'ink', width: 1.2, dash: [4, 3] });
          S3.path(rs, { color: 'red', width: 2 });
          S3.hline(-8, { color: 'faint', dash: [3, 3] });
          st = { dRho, dJ, rmax, o };
        });
        v.legend([['muted', '$|\\psi|$ before the transformation', { dash: true }], ['orange', '$A\'$'], ['purple', '$\\Phi\'$'], ['accent', 'kinetic current $j$ after'], ['ink', '$j$ before', { dash: true }]]);
        v.readout(() => st && `Max change of density: $${v.sci(Math.max(st.dRho, 1e-17), 1)}$ (always 0 — a phase never changes $|\\psi|^2$). Max change of the kinetic current $\\operatorname{Im}\\bar\\psi(\\partial_x-iA)\\psi$: $${v.sci(Math.max(st.dJ, 1e-17), 1)}$. Largest Schrödinger residual: $${v.sci(Math.max(st.rmax, 1e-17), 1)}$ — ${st.rmax < 1e-4 ? '**a solution**.' : '**not a solution**: the equation is not covariant under a partial transformation.'}`);
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7',
      kind: 'Phenomenon',
      name: 'Aharonov–Bohm effect',
      statement: String.raw`A charged particle that travels around a region containing magnetic flux $\Phi$ acquires the phase $\frac q\hbar\oint\mathbf A\cdot d\mathbf l=\frac{q\Phi}{\hbar}$ — even if the particle moves only where $\mathbf B=0$ and feels no classical force. In a double-slit experiment with a thin, shielded solenoid between the two paths, the interference pattern is displaced by $\Delta\varphi=q\Phi/\hbar=2\pi\,\Phi/\Phi_0$, i.e. by $\Phi/\Phi_0$ fringe spacings, where $\Phi_0=h/|q|$ is the **flux quantum** ($\Phi_0=h/e\approx4.136\times10^{-15}$ Wb for an electron). The pattern is periodic in $\Phi$ with period $\Phi_0$: the observable is the gauge-invariant phase of the loop (a holonomy), not $\mathbf A$ itself.`,
      idea: String.raw`Where $\mathbf B=0$ the potential is locally a gauge transformation, $\mathbf A=\nabla\chi$, so on each path separately the wave function is the free one times $e^{iq\chi/\hbar}$ with $\chi(\mathbf x)=\int^{\mathbf x}\mathbf A\cdot d\mathbf l$ (qm-6.6) — locally unobservable. But on a region that is not simply connected $\chi$ is multivalued: the two paths from the slits to the same screen point differ by $\oint\mathbf A\cdot d\mathbf l=\Phi$ (Stokes, em-7.14), a phase difference that interference (qm-1.11) turns into a visible shift. Ehrenberg and Siday (1949) had the phase in electron optics; Aharonov and Bohm (1959) stated the effect for $\mathbf B=0$ paths; Chambers (1960) and Tonomura et al. (1986, with the field shielded by a superconductor) observed it.`,
      caption: String.raw`**Slide the flux** through the solenoid (circular arrows: $\mathbf A\propto1/r$ outside, where $\mathbf B=0$) and **drag the point $P$** on the screen. The lower-left panel is the two-slit intensity $|\psi_1e^{i\varphi}+\psi_2|^2$ computed from the exact path lengths with the Aharonov–Bohm phase $\varphi=2\pi\Phi/\Phi_0$ on the upper path: the whole pattern slides by $\Phi/\Phi_0$ fringes (dashed: no flux), and returns to itself at every integer. The map at the lower right shows the intensity as a function of $y$ and $\Phi/\Phi_0$: the fringes are diagonal lines, repeating with period 1. (The geometry is a schematic with $\lambda=0.2$; the numbers for $\Phi_0$ are SI.)`,
      deps: ['qm-6.6', 'qm-1.11', 'em-7.14'],
      refs: ['Griffiths §4.5'],
      credit: 'Ehrenberg & Siday, 1949; Aharonov & Bohm, 1959; Chambers, 1960; Tonomura et al., 1986',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Aharonov%E2%80%93Bohm_effect' },
      tags: ['Aharonov–Bohm', 'holonomy', 'interference'],
      viz(v) {
        const M = v.M, PHI0 = M.CONST.h / M.CONST.e, LAM = 0.2, L = 10, D = 2, K = (2 * Math.PI) / LAM;
        const phiS = v.slider('enclosed flux $\\Phi/\\Phi_0$', 0, 3, 0.5, { step: 0.01 });
        const G = v.stage({ x: [-2, 11.3], y: [-3.6, 4.0], equal: true, axes: false, height: 300, full: true, title: 'two slits, a shielded solenoid between the paths, and a screen' });
        const I = v.stage({ x: [-3.2, 3.2], y: [0, 1.25], height: 230, axes: 'box', gutter: true, xlabel: 'y on the screen', ylabel: 'intensity', title: 'interference pattern' });
        const H = v.stage({ x: [0, 3], y: [-3.2, 3.2], height: 230, axes: 'box', gutter: true, xlabel: '$\\Phi/\\Phi_0$', ylabel: 'y', title: 'intensity vs. flux: period $\\Phi_0$' });
        const P = G.handle(L, 0.7, { color: 'gold', r: 6.5, label: 'P', labelPos: 'e', constrain: { x: [L, L], y: [-3, 3] } });
        const Iy = (y, ph) => {
          const r1 = Math.hypot(L, y - D / 2), r2 = Math.hypot(L, y + D / 2), a1 = K * r1 + 2 * Math.PI * ph, a2 = K * r2;
          const re = Math.cos(a1) / Math.sqrt(r1) + Math.cos(a2) / Math.sqrt(r2), im = Math.sin(a1) / Math.sqrt(r1) + Math.sin(a2) / Math.sqrt(r2);
          return (((re * re + im * im) * L) / 4) * Math.exp(-(y * y) / (2 * 2.6 * 2.6));
        };
        const peakNear = (yc, ph, hw) => { let b = yc, bv = -1; for (let k = 0; k <= 400; k++) { const y = yc - hw + (2 * hw * k) / 400, q = Iy(y, ph); if (q > bv) { bv = q; b = y; } } return b; };
        const sp = peakNear(1, 0, 0.5) - peakNear(0, 0, 0.5);
        let st = null;
        v.render(() => {
          const ph = phiS.value, yP = P.y;
          G.line(L, -3.4, L, 3.4, { color: 'ink', width: 3 });
          G.line(0, -3.4, 0, -D / 2 - 0.12, { color: 'ink', width: 4 }); G.line(0, -D / 2 + 0.12, 0, D / 2 - 0.12, { color: 'ink', width: 4 }); G.line(0, D / 2 + 0.12, 0, 3.4, { color: 'ink', width: 4 });
          G.dot(-1.6, 0, { r: 6, color: 'purple', label: 'source', labelPos: 's' });
          G.line(-1.6, 0, 0, D / 2, { color: 'muted', width: 1, dash: [3, 3] }); G.line(-1.6, 0, 0, -D / 2, { color: 'muted', width: 1, dash: [3, 3] });
          G.line(0, D / 2, L, yP, { color: 'accent', width: 2 }); G.line(0, -D / 2, L, yP, { color: 'orange', width: 2 });
          G.circle(3.4, 0, 0.32, { color: 'ink', fill: 'red', fillAlpha: 0.25, width: 1.6 });
          G.text('B', 3.4, 0, { align: 'center', baseline: 'middle', size: 13, color: 'red', math: true });
          if (ph > 1e-6) for (const r of [0.62, 0.95, 1.4]) for (let k = 0; k < 10; k++) {
            const a = (k / 10) * TAU, len = Math.min(0.5, (0.34 * Math.min(ph, 1.5)) / r), x0 = 3.4 + r * Math.cos(a), y0 = r * Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a);
            G.arrow(x0 - 0.5 * len * tx, y0 - 0.5 * len * ty, x0 + 0.5 * len * tx, y0 + 0.5 * len * ty, { color: 'orange', width: 1.4 });
          }
          G.text('slits', 0, 3.65, { align: 'center', size: 11, color: 'muted' }); G.text('screen', L, 3.65, { align: 'center', size: 11, color: 'muted' });
          G.text('$\\mathbf B=0$ along both paths', 6.8, -2.9, { align: 'center', size: 12, color: 'muted' });
          I.fn((y) => Iy(y, 0), { color: 'muted', width: 1.4, dash: [5, 4], n: 700 });
          I.fn((y) => Iy(y, ph), { color: 'accent', width: 2.4, n: 700, fill: true, fillAlpha: 0.12 });
          I.vline(yP, { color: 'gold', width: 1.6, dash: [3, 3] });
          const yc = peakNear(ph * sp, ph, 0.5 * sp), shift = yc / sp;
          I.vline(yc, { color: 'green', width: 1.4 });
          H.raster((f, y) => v.ramp(Math.min(1, Iy(y, f) / 1.15), 'accent'), { res: 2, key: 'ab' });
          H.vline(ph, { color: 'gold', width: 1.8 }); H.hline(yP, { color: 'gold', width: 1.2, dash: [3, 3] });
          H.line(0, 0, 3, 3 * sp, { color: 'green', width: 1.4, dash: [6, 4] });
          st = { ph, shift, yP, IP: Iy(yP, ph), I0: Iy(yP, 0) };
        });
        v.legend([['accent', 'with flux'], ['muted', 'no flux', { dash: true }], ['green', 'central maximum']]);
        v.readout(() => st && `Phase shift $2\\pi\\Phi/\\Phi_0=${v.fix(2 * Math.PI * st.ph, 3)}$: the central fringe moved by $${v.fix(st.shift, 3)}$ fringe spacings (prediction $\\Phi/\\Phi_0=${v.fix(st.ph, 3)}$). $I(P)=${v.fix(st.IP, 3)}$ vs. $${v.fix(st.I0, 3)}$ without flux. SI scale: $\\Phi_0=h/e=${v.sci(PHI0, 4)}$ Wb, so $\\Phi=${v.sci(st.ph * PHI0, 3)}$ Wb — in a solenoid of radius 1 µm this is a field of $${v.fix(((st.ph * PHI0) / (Math.PI * 1e-12)) * 1e3, 3)}$ mT.${Math.abs(st.ph - Math.round(st.ph)) < 0.01 ? ' **At a whole number of flux quanta the pattern is back where it started.**' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8',
      kind: 'Phenomenon',
      name: 'Landau levels',
      statement: String.raw`A particle of charge $q$ and mass $m$ moving in a plane perpendicular to a uniform magnetic field $B$ has the energy levels
$$E_n=\hbar\omega_c\big(n+\tfrac12\big),\qquad \omega_c=\frac{|q|B}{m},\qquad n=0,1,2,\dots,$$
equally spaced like an oscillator (with the *cyclotron* frequency) and each infinitely degenerate in the plane. For an area $\mathcal A$ each level holds $N=\dfrac{|q|B\mathcal A}{h}=\dfrac{\Phi}{\Phi_0}$ states — one per flux quantum $\Phi_0=h/|q|$ threading the sample. In Landau gauge $\mathbf A=(-By,0)$ the states are $e^{ikx}\varphi_n(y-y_k)$, with $\varphi_n$ the oscillator eigenfunctions and the guiding centre $y_k=-\hbar k/qB$ (the energy does not depend on $k$).`,
      idea: String.raw`In Landau gauge $p_x=\hbar k$ is conserved and the Hamiltonian $\frac1{2m}\big[p_y^2+(\hbar k+qBy)^2\big]$ becomes, for each $k$, a harmonic oscillator in $y$ centred at $y_k$ with frequency $\omega_c$ (qm-4.3: the ladder algebra gives the spectrum). The energy does not depend on $k$, which only shifts the centre: that is the degeneracy. With periodic length $L_x$ the allowed $k=2\pi j/L_x$ place centres $y_k$ a distance $2\pi\hbar/(qBL_x)$ apart, so a strip of width $W$ holds $qBWL_x/h$ of them. Classically $\omega_c$ is the cyclotron frequency of em-7.2; the orbit radius is quantised as $r_n=\sqrt{(2n+1)\hbar/qB}$.`,
      caption: String.raw`Units $\hbar=m=q=1$, so $\omega_c=B$, in a strip of width $12$ with hard walls. **Left:** the energies $E_n(k)$ of the lowest levels: flat (independent of $k$) in the bulk at exactly $(n+\tfrac12)B$ (dashed), and bending upward where the guiding centre $y_k=-k/B$ reaches a wall (edge states). **Raise $B$**: the continuum $E=k^2/2$ collapses onto widely spaced levels. **Middle:** the eigenfunctions $\varphi_n(y)$ for the guiding centre chosen by the slider, in the shifted oscillator potential. **Right:** each stripe is one allowed $k=2\pi j/L_x$ ($L_x=10$): the number of stripes in the strip grows in proportion to $B$ — it equals the number of flux quanta.`,
      deps: ['qm-6.6', 'qm-4.3', 'em-7.2'],
      refs: ['Sakurai ch. 2'],
      credit: 'Landau, 1930',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Landau_quantization' },
      tags: ['Landau levels', 'magnetic field', 'degeneracy'],
      viz(v) {
        const M = v.M, W = 12, NY = 220, KN = 41, LX = 10;
        const bS = v.slider('field $B$ ($\\omega_c=B$)', 0.4, 3, 1, { step: 0.05 });
        const yS = v.slider('guiding centre $y_k$', -6, 6, 0, { step: 0.1 });
        const cache = {};
        function spec(B) {
          const key = B.toFixed(3); if (cache[key]) return cache[key];
          const kmax = (B * W) / 2 + 2.5, ks = Array.from({ length: KN }, (_, i) => -kmax + (2 * kmax * i) / (KN - 1)), E = ks.map((k) => M.schrodinger1D((y) => 0.5 * (k + B * y) ** 2, [-W / 2, W / 2], { n: NY, k: 6 }).E);
          return (cache[key] = { ks, E, kmax });
        }
        const A = v.stage({ x: [-3, 3], y: [0, 7], height: 280, axes: 'box', gutter: true, xlabel: '$k$', ylabel: 'E', title: 'energy vs. canonical momentum $k$' });
        const Bst = v.stage({ x: [-W / 2, W / 2], y: [0, 7], height: 280, axes: 'box', gutter: true, xlabel: 'y', ylabel: 'E', title: 'eigenfunctions at the guiding centre' });
        const C = v.stage({ x: [-6.6, 6.6], y: [-6.6, 6.6], equal: true, axes: false, height: 280, title: 'guiding-centre stripes, one per allowed $k$' });
        let st = null;
        v.render(() => {
          const B = bS.value, S = spec(B), yk = yS.value, k0 = -B * yk, top = Math.max(7 * B, 3);
          A.setView([-S.kmax, S.kmax], [0, top]);
          for (let n = 0; n < 6; n++) A.hline((n + 0.5) * B, { color: 'muted', width: 1, dash: [5, 4], alpha: 0.7 });
          for (let n = 0; n < 6; n++) A.path(S.ks.map((k, i) => [k, S.E[i][n]]), { color: n % 2 ? 'orange' : 'accent', width: 2 });
          A.vline(k0, { color: 'gold', width: 1.6, dash: [4, 3] });
          A.vline(-(B * W) / 2, { color: 'red', width: 1, alpha: 0.5 }); A.vline((B * W) / 2, { color: 'red', width: 1, alpha: 0.5 });
          const R = M.schrodinger1D((y) => 0.5 * (k0 + B * y) ** 2, [-W / 2, W / 2], { n: 400, k: 5 });
          Bst.setView([-W / 2, W / 2], [0, top]);
          Bst.fn((y) => 0.5 * (k0 + B * y) ** 2, { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.1, base: 0, n: 300 });
          for (let n = 0; n < 5; n++) {
            Bst.hline(R.E[n], { color: 'faint', width: 1 });
            drawReal(Bst, R.x, R.psi[n], { col: phaseLUT(v), base: R.E[n], scale: 0.9 * B ** 0.25, alpha: 0.55 });
            Bst.text(`n=${n}`, W / 2 - 0.2, R.E[n], { align: 'right', size: 11, dy: -8, color: 'muted' });
          }
          Bst.vline(yk, { color: 'gold', dash: [4, 3] });
          const stripes = []; for (let j = -60; j <= 60; j++) { const kk = (2 * Math.PI * j) / LX, y = -kk / B; if (Math.abs(y) <= W / 2) stripes.push(y); }
          C.rect(-6.4, -6, 6.4, 6, { color: 'ink', width: 1.5, stroke: true });
          for (const y of stripes) C.line(-6.4, y, 6.4, y, { color: Math.abs(y - yk) < Math.PI / (B * LX) ? 'gold' : 'accent', width: 1.3, alpha: 0.7 });
          const ykk = Math.max(-5.6, Math.min(5.6, yk));
          for (let n = 0; n < 3; n++) C.circle(0, ykk, Math.sqrt((2 * n + 1) / B), { color: ['green', 'orange', 'purple'][n], width: 1.6, alpha: 0.9 });
          const mid = (KN - 1) / 2;
          st = { B, E0: Array.from(S.E[mid]).slice(0, 5), N: stripes.length, flux: (B * W * LX) / (2 * Math.PI) };
        });
        v.legend([['accent', 'even $n$'], ['orange', 'odd $n$'], ['muted', '$(n+\\tfrac12)B$', { dash: true }]]);
        v.readout(() => st && `$\\omega_c=B=${v.fix(st.B, 2)}$. In the bulk ($k=0$): $E_0\\ldots E_4=${st.E0.map((e) => v.fix(e, 4)).join(',\\ ')}$ vs. $(n+\\tfrac12)B=${[0, 1, 2, 3, 4].map((n) => v.fix((n + 0.5) * st.B, 4)).join(',\\ ')}$. Stripes in the strip: **${st.N}** per level; flux through it $B\\,W L_x/2\\pi=${v.fix(st.flux, 2)}$ quanta — the degeneracy per area is $B/2\\pi$ ($=eB/h$). Circles: classical orbits of radii $\\sqrt{(2n+1)/B}$ for $n=0,1,2$.`);
      },
    },
  ],
};
