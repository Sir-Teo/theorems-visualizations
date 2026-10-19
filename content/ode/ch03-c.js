// Ordinary Differential Equations & Dynamical Systems — Chapter 3 (part c): resonance, Laplace transform, Floquet theory, invariant subspaces, robustness
import { mathieuFloquet } from './mathieu.shared.js';
import { flow, mmul, madd, mscale, mvec, eye, fro, opnorm, expm, eig2, matFlow, C } from './ch03.shared.js';

const trim = (pts, cap = 1e5) => { const o = []; for (const p of pts) { if (!p.every((q) => isFinite(q) && Math.abs(q) <= cap)) break; o.push(p); } return o; };
// real polynomials, ascending coefficients
const pmul = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j] += a[i] * b[j]; return o; };
const padd = (a, b) => { const n = Math.max(a.length, b.length), o = []; for (let i = 0; i < n; i++) o.push((a[i] || 0) + (b[i] || 0)); return o; };
const pevalC = (p, z) => { let s = [0, 0]; for (let i = p.length - 1; i >= 0; i--) s = C.add(C.mul(s, z), [p[i], 0]); return s; };

export default {
  collection: 'ode',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Phenomenon',
      name: 'Resonance in the forced oscillator',
      statement: String.raw`For $\ddot x+2\zeta\omega_0\dot x+\omega_0^2x=F\cos\omega t$ with $0\le\zeta<1$, every solution is the sum of a transient, which decays like $e^{-\zeta\omega_0t}$ if $\zeta>0$, and the unique periodic *steady state* $x_p(t)=\mathcal A(\omega)\cos(\omega t-\varphi)$ with
$$\mathcal A(\omega)=\frac{F}{\sqrt{(\omega_0^2-\omega^2)^2+4\zeta^2\omega_0^2\omega^2}} ,\qquad \tan\varphi=\frac{2\zeta\omega_0\omega}{\omega_0^2-\omega^2}.$$
For $\zeta<1/\sqrt2$ the amplitude has its maximum at $\omega_{\max}=\omega_0\sqrt{1-2\zeta^2}$, with $\mathcal A(\omega_{\max})=F/(2\zeta\omega_0^2\sqrt{1-\zeta^2})$; the peak grows without bound as $\zeta\to0$. For $\zeta=0$ and $\omega=\omega_0$ there is no steady state: the solution from rest is $x=\frac{F}{2\omega_0}\,t\sin\omega_0t$, an oscillation whose amplitude grows linearly.`,
      idea: String.raw`Variation of constants (3.12) writes the response as the convolution of the cosine force with the impulse response $h(t)=e^{-\zeta\omega_0t}\sin(\omega_dt)/\omega_d$; the part that decays is the transient and what survives is the steady state, found fastest by trying $x=\operatorname{Re}\,\mathcal H e^{i\omega t}$ with the transfer function $\mathcal H=1/(\omega_0^2-\omega^2+2i\zeta\omega_0\omega)$, whose modulus is $\mathcal A/F$. The denominator is smallest, relative to its real part, when the driving frequency sits near the natural frequency $\omega_0$; without damping the forcing is a *root* of the characteristic polynomial, and then the particular solution gets a factor $t$, as for Jordan blocks (3.7).`,
      caption: String.raw`Drag the driving frequency $\omega$ along the resonance curve (left; the faint curves show other dampings) and set $\zeta$. The right panel integrates $\ddot x+2\zeta\dot x+x=\cos\omega t$ from rest ($\omega_0=1$): after the transient dies the motion settles inside the dashed band $\pm\mathcal A(\omega)$. Lower the damping and the band at $\omega\approx1$ rises; switch to *undamped* and at $\omega=1$ the amplitude grows like $t/2$ (dashed envelope), while elsewhere you see beats.`,
      deps: ['mech-4.7', 'ode-3.12'],
      refs: ['Teschl §3.3'],
      scope: String.raw`Holds for the linear oscillator with constant coefficients and a sinusoidal drive; real structures soften or saturate long before the linear growth shown at $\zeta=0$.`,
      tags: ['resonance', 'forced oscillator'],
      viz(v) {
        const zeta = v.slider('damping $\\zeta$', 0.03, 1, 0.12, { step: 0.01 });
        const und = v.toggle('undamped ($\\zeta=0$)', false);
        const sA = v.stage({ x: [0, 2.2], y: [0, 9], axes: 'box', gutter: true, height: 360, xlabel: 'ω', ylabel: 'amplitude', title: 'steady-state amplitude $\\mathcal A(\\omega)$', weight: 1, minWidth: 260 });
        const sT = v.stage({ x: [0, 100], y: [-8, 8], axes: 'box', gutter: true, height: 360, xlabel: 't', ylabel: 'x', title: 'response from rest', weight: 1.4 });
        const amp = (w, z) => 1 / Math.sqrt((1 - w * w) ** 2 + 4 * z * z * w * w);
        const Hw = sA.handle(0.8, amp(0.8, 0.12), { color: 'accent', label: '$\\omega$', labelPos: 'ne', constrain: (x) => { const w = Math.max(0.05, Math.min(2.15, x)), z = und.value ? 0 : zeta.value; return [w, Math.min(8.8, amp(w, z))]; } });
        v.legend([['accent', 'response $x(t)$'], ['orange', 'band $\\pm\\mathcal A(\\omega)$', { dash: true }], ['red', 'envelope $t/2$ (undamped)', { dash: true }]]);
        let info = null;
        v.render(() => {
          const z = und.value ? 0 : zeta.value, w = Hw.x;
          for (const zz of [0.05, 0.1, 0.2, 0.4, 0.8]) sA.fn((x) => Math.min(9, amp(x, zz)), { color: 'muted', width: 1, alpha: 0.35, domain: [0.02, 2.2], n: 500 });
          sA.fn((x) => Math.min(9, amp(x, z)), { color: 'accent', width: 2.6, domain: [0.02, 2.2], n: 800 });
          sA.vline(1, { color: 'muted', width: 1, dash: [4, 4] });
          Hw.set(w, Math.min(8.8, amp(w, z)));
          if (z > 0 && z < Math.SQRT1_2) { const wm = Math.sqrt(1 - 2 * z * z); sA.dot(wm, Math.min(8.9, amp(wm, z)), { r: 5, color: 'gold', hollow: true }); }
          const Tend = 100, N = 3400, F = (t, x) => [x[1], Math.cos(w * t) - 2 * z * x[1] - x[0]];
          const tr = flow(F, 0, [0, 0], Tend, N);
          const yr = Math.min(60, Math.max(2.5, 1.6 * Math.min(amp(w, z), 60)));
          sT.setView([0, Tend], z === 0 && Math.abs(w - 1) < 0.02 ? [-55, 55] : [-yr, yr]);
          sT.clip(() => {
            if (z > 0 || Math.abs(w - 1) > 1e-3) { const a = z === 0 && Math.abs(w - 1) < 1e-3 ? 0 : amp(w, z); sT.hline(a, { color: 'orange', width: 1.6, dash: [6, 4] }); sT.hline(-a, { color: 'orange', width: 1.6, dash: [6, 4] }); }
            if (z === 0 && Math.abs(w - 1) < 0.02) { sT.fn((t) => t / 2, { color: 'red', width: 1.4, dash: [6, 4], domain: [0, Tend] }); sT.fn((t) => -t / 2, { color: 'red', width: 1.4, dash: [6, 4], domain: [0, Tend] }); }
            sT.path(tr.map(([t, x]) => [t, x[0]]), { color: 'accent', width: 1.8 });
          });
          let mx = 0; const k0 = Math.floor(0.8 * N); for (let i = k0; i <= N; i++) mx = Math.max(mx, Math.abs(tr[i][1][0]));
          info = { z, w, mx, a: amp(w, z), settled: z > 0 && z * Tend * 0.8 > 6, ph: Math.atan2(2 * z * w, 1 - w * w) };
        });
        v.readout(() => {
          if (!info) return '';
          const { z, w, mx, a, settled, ph } = info;
          if (z === 0) return `Undamped, $\\omega=${v.fix(w, 2)}$: ${Math.abs(w - 1) < 0.02 ? `near $\\omega_0=1$ the amplitude after $t=100$ is $${v.fix(mx, 1)}$, close to $t/2=50$ (exactly $t/2$ at $\\omega=1$).` : `no steady state is approached; the solution is a beat between $\\omega$ and $\\omega_0=1$ of amplitude $\\le 2\\mathcal A=${v.fix(2 * a, 2)}$ (observed maximum $${v.fix(mx, 2)}$).`}`;
          const pk = z < Math.SQRT1_2 ? `peak at $\\omega_{\\max}=\\sqrt{1-2\\zeta^2}=${v.fix(Math.sqrt(1 - 2 * z * z), 3)}$ with height $1/(2\\zeta\\sqrt{1-\\zeta^2})=${v.fix(1 / (2 * z * Math.sqrt(1 - z * z)), 2)}$` : 'no interior peak ($\\zeta\\ge1/\\sqrt2$)';
          return `$\\zeta=${v.fix(z, 2)}$, $\\omega=${v.fix(w, 2)}$: formula $\\mathcal A=${v.fix(a, 3)}$, observed amplitude in the last 20% of the run $${v.fix(mx, 3)}$${settled ? '' : ' (transient not yet gone)'}; phase lag $\\varphi=${v.fix(ph, 2)}$ rad. ${pk}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.16
    {
      num: '3.16',
      kind: 'Method',
      name: 'Laplace transform for linear initial value problems',
      statement: String.raw`The Laplace transform $\mathcal L[y](s)=\int_0^\infty e^{-st}y(t)\,dt$ (for $y$ of exponential order, $\operatorname{Re}s$ large) turns differentiation into multiplication: $\mathcal L[y']=s\mathcal L[y]-y(0)$, $\mathcal L[y'']=s^2\mathcal L[y]-sy(0)-y'(0)$. Hence the initial value problem $y''+2\zeta y'+y=f(t)$ becomes the algebraic equation
$$Y(s)=\frac{(s+2\zeta)y(0)+y'(0)+F(s)}{s^2+2\zeta s+1}.$$
If $Y$ is rational with simple poles $p_k$, then $y(t)=\sum_k\operatorname{Res}_{s=p_k}Y(s)\,e^{p_kt}$ for $t\ge0$. In general the poles of $Y$ are the roots of the characteristic polynomial together with the poles of $F$: the former produce the free response, the latter the forced response.`,
      idea: String.raw`Integration by parts, $\int_0^\infty e^{-st}y'\,dt=-y(0)+s\int_0^\infty e^{-st}y\,dt$, trades derivatives for powers of $s$ and builds in the initial data. Inverting a rational function amounts to the residue theorem (rca-10.42) applied to the Bromwich contour $\operatorname{Re}s=c$ closed to the left: each simple pole contributes $\operatorname{Res}\,e^{pt}$; a double pole would contribute $t\,e^{pt}$, which is the Jordan phenomenon of 3.7 in disguise.`,
      caption: String.raw`Choose the forcing, the damping $\zeta$ and the initial data. Left: the poles of $Y(s)$ in the $s$-plane — blue for the oscillator's own poles, orange for the poles of the forcing. Right: each pole contributes a term $\operatorname{Res}\,e^{pt}$ (faint; conjugate poles are combined); their sum (accent) is the solution, and it lies on the numerically integrated one (green, dashed). Keep the forcing pole away from the blue ones: when they merge, the residues blow up and a $te^{pt}$ term is needed (the readout warns you).`,
      deps: ['ode-3.13', 'rca-10.42'],
      refs: ['Teschl ch. 3'],
      tags: ['laplace transform', 'transfer function'],
      viz(v) {
        const zeta = v.slider('damping $\\zeta$', 0.05, 1.6, 0.25, { step: 0.01 });
        const forc = v.select('forcing $f(t)=$', [{ value: 'step', label: '$1$' }, { value: 'sin', label: '$\\sin\\omega t$' }, { value: 'exp', label: '$e^{-at}$' }], 'sin');
        const par = v.slider('$\\omega$ or $a$', 0.2, 3, 1.6, { step: 0.02 });
        const y0 = v.slider('$y(0)$', -2, 2, 1, { step: 0.05 });
        const y1 = v.slider('$y\'(0)$', -2, 2, 0, { step: 0.05 });
        const sS = v.stage({ x: [-2.4, 1.2], y: [-3.4, 3.4], axes: true, height: 380, xlabel: 'Re s', ylabel: 'Im s', title: 'poles of $Y(s)$', weight: 0.9, minWidth: 240 });
        const T = 20;
        const sY = v.stage({ x: [0, T], y: [-3, 3], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'y', title: 'time domain: residues $\\times\\,e^{pt}$', weight: 1.4 });
        v.legend([['accent', 'sum of residue terms'], ['green', 'RK4 solution', { dash: true }], ['faint', 'single pole terms']]);
        let info = null;
        v.render(() => {
          const z = zeta.value, p = par.value, a0 = y0.value, a1 = y1.value;
          // denominators/numerators as ascending real polynomials
          const Q1 = [1, 2 * z, 1], N1 = [2 * z * a0 + a1, a0];       // (s + 2ζ) y0 + y1  = y0 s + (2ζ y0 + y1)
          let Qf, Pf, fr; // forcing poles and numerator
          if (forc.value === 'step') { Qf = [0, 1]; Pf = [1]; fr = [[0, 0]]; }
          else if (forc.value === 'sin') { Qf = [p * p, 0, 1]; Pf = [p]; fr = [[0, p], [0, -p]]; }
          else { Qf = [p, 1]; Pf = [1]; fr = [[-p, 0]]; }
          const Q = pmul(Q1, Qf), P = padd(pmul(N1, Qf), Pf);
          const sysRoots = z < 1 ? [[-z, Math.sqrt(1 - z * z)], [-z, -Math.sqrt(1 - z * z)]] : [[-z + Math.sqrt(z * z - 1), 0], [-z - Math.sqrt(z * z - 1), 0]];
          const roots = sysRoots.concat(fr);
          let close = Infinity; for (let i = 0; i < roots.length; i++) for (let j = i + 1; j < roots.length; j++) close = Math.min(close, C.abs(C.sub(roots[i], roots[j])));
          const res = roots.map((r, i) => { let d = [1, 0]; roots.forEach((q, j) => { if (j !== i) d = C.mul(d, C.sub(r, q)); }); return C.div(pevalC(P, r), d); });
          const f = forc.value === 'step' ? () => 1 : forc.value === 'sin' ? (t) => Math.sin(p * t) : (t) => Math.exp(-p * t);
          const rk = flow((t, x) => [x[1], f(t) - 2 * z * x[1] - x[0]], 0, [a0, a1], T, 1000);
          sY.path(rk.map(([t, x]) => [t, x[0]]), { color: 'green', width: 2.4, dash: [7, 5] });
          const ok = close > 1e-2, tt = []; for (let i = 0; i <= 500; i++) tt.push((T * i) / 500);
          let dev = null;
          if (ok) {
            const tot = tt.map(() => 0);
            roots.forEach((r, i) => {
              if (r[1] < -1e-12) return;
              const pair = r[1] > 1e-12, k = pair ? roots.findIndex((q, j) => j !== i && Math.abs(q[0] - r[0]) < 1e-12 && Math.abs(q[1] + r[1]) < 1e-12) : -1;
              const vals = tt.map((t) => { const e = C.mul(res[i], C.exp([r[0] * t, r[1] * t])); return pair ? 2 * e[0] : e[0]; });
              vals.forEach((q, j) => { tot[j] += q; });
              sY.path(tt.map((t, j) => [t, vals[j]]), { color: 'faint', width: 1.2, alpha: 0.9 });
            });
            sY.path(tt.map((t, j) => [t, tot[j]]), { color: 'accent', width: 2.6 });
            dev = 0; for (let j = 0; j <= 500; j++) dev = Math.max(dev, Math.abs(tot[j] - rk[2 * j][1][0]));
          }
          roots.forEach((r, i) => { const sys = i < 2; if (r[1] >= -1e-12) sS.dot(r[0], r[1], { r: 6, color: sys ? 'accent' : 'orange' }); else sS.dot(r[0], r[1], { r: 6, color: sys ? 'accent' : 'orange' }); });
          sS.vline(0, { color: 'red', width: 1.2, alpha: 0.5 });
          const mxr = Math.max(...res.map(C.abs));
          info = { ok, dev, close, mxr };
        });
        v.readout(() => {
          if (!info) return '';
          if (!info.ok) return `Two poles are only $${v.fix(info.close, 3)}$ apart (resonance): the simple-pole formula degenerates (residues of size $${v.sci(info.mxr, 1)}$ cancel against each other); the exact solution contains a term $t\\,e^{pt}$. Move $\\omega$ or $a$ away from the blue poles.`;
          return `All poles simple; largest residue modulus $${v.fix(info.mxr, 2)}$. The sum of residue terms and the RK4 solution differ by at most $${info.dev < 1e-3 ? v.sci(Math.max(info.dev, 1e-16), 1) : v.fix(info.dev, 4)}$ over $[0,20]$ (integration and plotting error).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.17
    {
      num: '3.17',
      kind: 'Theorem',
      name: 'Floquet theory for periodic linear systems',
      statement: String.raw`Let $A(t+T)=A(t)$ be continuous and $\Phi$ the fundamental matrix of $\dot x=A(t)x$ with $\Phi(0)=I$. The *monodromy matrix* $\Phi(T)$ is invertible, and
$$\Phi(t+T)=\Phi(t)\,\Phi(T).$$
Its eigenvalues $\mu_1,\dots,\mu_n$ (the *Floquet multipliers*) do not depend on the choice of initial time; $\prod\mu_j=\exp\int_0^T\operatorname{tr}A$. Moreover $\Phi(t)=P(t)e^{tR}$ with $P$ $T$-periodic and $e^{TR}=\Phi(T)$ ($R$ may be complex). Consequently every solution tends to $0$ if all $|\mu_j|<1$; all solutions are bounded if all $|\mu_j|\le1$ and those on the circle are semisimple; some solution is unbounded if some $|\mu_j|>1$. A solution started on an eigenvector of $\Phi(T)$ satisfies $x(t+T)=\mu\,x(t)$.`,
      idea: String.raw`The shifted function $t\mapsto\Phi(t+T)$ solves the same equation because $A$ is periodic, so by 3.10 it equals $\Phi(t)C$ for a constant matrix $C$; putting $t=0$ gives $C=\Phi(T)$. Iterating, $x(nT)=\Phi(T)^nx(0)$: the stroboscopic sequence is just the powers of the monodromy matrix, whose size is governed by its spectrum (3.9, as for a discrete-time system). The product formula is Liouville's formula (3.11) at $t=T$. Writing $\Phi(T)=e^{TR}$ (a matrix logarithm) and $P(t)=\Phi(t)e^{-tR}$, one checks $P(t+T)=P(t)$.`,
      caption: String.raw`The equation is $\ddot y+c\dot y+(\delta+\varepsilon\cos t)y=0$, period $T=2\pi$. The monodromy matrix $\Phi(2\pi)$ is computed by RK4 and its multipliers appear against the unit circle (left, the dotted circle is $|\mu|=1$). Right: the gold dots are $x(nT)$ for the solution through the draggable start (the continuous curve is the solution itself). Inside the unit disc they spiral to $0$, on the circle they stay on an ellipse, outside they run off along the dominant eigendirection. Try $\delta\approx0.3$ with $\varepsilon\approx0.5$.`,
      deps: ['ode-3.10', 'ode-3.9', 'ode-3.11'],
      refs: ['Teschl §3.6'],
      credit: 'G. Floquet, 1883 (Annales de l’École Normale Supérieure 12, 47–88)',
      tags: ['floquet', 'monodromy', 'periodic coefficients'],
      viz(v) {
        const dl = v.slider('$\\delta$', -0.2, 1.5, 0.8, { step: 0.01 });
        const ep = v.slider('$\\varepsilon$', 0, 1.2, 0.5, { step: 0.01 });
        const cd = v.slider('damping $c$', 0, 0.3, 0, { step: 0.005 });
        const np = v.slider('number of periods', 2, 30, 14, { int: true });
        const T = 2 * Math.PI;
        const sM = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, axes: true, height: 360, xlabel: 'Re μ', ylabel: 'Im μ', title: 'Floquet multipliers', weight: 0.9, minWidth: 240 });
        const sX = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'y', ylabel: "y′", title: 'stroboscopic samples $x(nT)$', weight: 1.2 });
        const X0 = sX.handle(1, 0, { color: 'gold', label: '$x_0$', labelPos: 'ne', constrain: { x: [-2.5, 2.5], y: [-2.5, 2.5] } });
        let info = null;
        v.render(() => {
          const Af = (t) => [[0, 1], [-(dl.value + ep.value * Math.cos(t)), -cd.value]];
          const Phi = matFlow(Af, eye(2), 0, T, 480);
          const e = eig2(Phi), det = Phi[0][0] * Phi[1][1] - Phi[0][1] * Phi[1][0];
          const th = Array.from({ length: 121 }, (_, i) => [Math.cos((2 * Math.PI * i) / 120), Math.sin((2 * Math.PI * i) / 120)]);
          sM.path(th, { color: 'muted', width: 1.4, dash: [3, 4] });
          const m1 = e.l1, m2 = e.l2;
          sM.dot(m1[0], m1[1], { r: 6, color: 'accent' }); sM.dot(m2[0], m2[1], { r: 6, color: 'orange' });
          const rmax = Math.max(C.abs(m1), C.abs(m2));
          // stroboscopic samples
          const n = np.value, tr = flow((t, x) => mvec(Af(t), x), 0, [X0.x, X0.y], n * T, n * 200);
          const dots = []; for (let k = 0; k <= n; k++) dots.push(tr[k * 200][1]);
          const cont = tr.map((q) => q[1]);
          const rr = Math.max(2.4, ...dots.map((d) => Math.hypot(d[0], d[1])).filter(isFinite)) * 1.1;
          const R = Math.min(rr, 1e4); sX.setView([-R, R], [-R, R]);
          sX.path(cont, { color: 'accent', width: 1.2, alpha: 0.5 });
          sX.path(dots, { color: 'gold', width: 1, alpha: 0.5 });
          dots.forEach((d, k) => sX.dot(d[0], d[1], { r: k === 0 ? 5 : 3.4, color: 'gold' }));
          if (e.vecs) for (const [vx, vy] of e.vecs) sX.line(-R * vx, -R * vy, R * vx, R * vy, { color: 'red', width: 1, alpha: 0.4, dash: [4, 4] });
          info = { e, rmax, det, tr: Phi[0][0] + Phi[1][1], lam: Math.log(rmax) / T };
        });
        v.readout(() => {
          if (!info) return '';
          const { e, rmax, det, tr, lam } = info;
          const mu = e.disc >= 0 ? `$\\mu=${v.fix(e.l1[0], 3)},\\ ${v.fix(e.l2[0], 3)}$` : `$\\mu=${v.fix(e.l1[0], 3)}\\pm${v.fix(e.l1[1], 3)}i$, $|\\mu|=${v.fix(rmax, 4)}$`;
          return `$\\operatorname{tr}\\Phi(T)=${v.fix(tr, 3)}$, $\\det\\Phi(T)=${v.fix(det, 5)}$ ($=e^{-cT}=${v.fix(Math.exp(-cdv()), 5)}$ by Liouville); ${mu}.\nLargest multiplier modulus $${v.fix(rmax, 4)}$: ${rmax > 1 + 1e-6 ? '**outside** the unit circle — solutions grow like $e^{' + v.fix(lam, 3) + 't}$.' : rmax < 1 - 1e-6 ? 'inside the unit circle — every solution decays.' : 'on the unit circle — solutions stay bounded.'}`;
        });
        function cdv() { return cd.value * T; }
      },
    },
    // ───────────────────────────────────────────────────────────── 3.18
    {
      num: '3.18',
      kind: 'Phenomenon',
      name: 'Parametric resonance (Mathieu equation)',
      statement: String.raw`In the Mathieu equation $\ddot y+(\delta+\varepsilon\cos t)\,y=0$ the $(\delta,\varepsilon)$ plane is divided by Floquet theory (3.17) into stable regions ($|\operatorname{tr}\Phi(2\pi)|<2$, bounded solutions) and *tongues* of instability ($|\operatorname{tr}\Phi(2\pi)|>2$, exponential growth) that emanate from the points $\delta=n^2/4$, $n=1,2,3,\dots$ of the axis $\varepsilon=0$. To first order in $\varepsilon$ the first tongue is $|\delta-\tfrac14|<\tfrac\varepsilon2$: the system, whose natural frequency is $\sqrt\delta$, is destabilised by a modulation of *twice* its natural frequency. Damping $c$ in $\ddot y+c\dot y+(\delta+\varepsilon\cos t)y=0$ shifts and lifts the tongues, so the modulation must exceed a threshold in order to pump the oscillator.`,
      idea: String.raw`At $\varepsilon=0$ the multipliers are $e^{\pm i\sqrt\delta\,2\pi}$ and lie on the unit circle; they leave it only by colliding at $\pm1$, which happens exactly when $\sqrt\delta\cdot2\pi\in\pi\mathbb Z$, i.e. $\delta=n^2/4$. For $\varepsilon\ne0$ the collision point opens into an interval, because $\det\Phi=1$ forces a collided pair of multipliers to split into a real pair $\mu,1/\mu$, one of which exceeds $1$. Substitution $y=e^{-ct/2}z$ gives $\ddot z+(\delta-c^2/4+\varepsilon\cos t)z=0$. Thus the damped multipliers are $e^{-cT/2}$ times those of the undamped equation at the shifted parameter $\delta-c^2/4$, and instability needs that shifted growth rate to exceed $c/2$.`,
      caption: String.raw`The chart colours each $(\delta,\varepsilon)$ by the growth rate of the Floquet multipliers (red = growth, pale green = bounded), computed pixel by pixel from the monodromy matrix; dashed lines are the first-order tongue boundary $\delta=\frac14\pm\frac\varepsilon2$. Drag the point in the chart: the right panel integrates the solution that starts at rest from $y=0.1$ — like a swing pushed by modulating its effective length at twice its natural frequency. Add damping and the tongue lifts off the $\delta$-axis.`,
      deps: ['ode-3.17'],
      refs: ['Teschl §3.6'],
      credit: 'É. Mathieu, 1868 (the equation arose in his study of the vibrations of an elliptic membrane)',
      scope: String.raw`Linear model; real parametrically driven systems saturate by nonlinearity once the amplitude has grown. The first-order tongue boundary is accurate for small $\varepsilon$ only.`,
      tags: ['mathieu', 'parametric resonance', 'instability tongues'],
      viz(v) {
        const cd = v.slider('damping $c$', 0, 0.4, 0, { step: 0.01 });
        const s = v.stage({ x: [0, 1.6], y: [0, 1.5], axes: 'box', gutter: true, height: 400, xlabel: 'δ', ylabel: 'ε', title: 'stability chart of $\\ddot y+c\\dot y+(\\delta+\\varepsilon\\cos t)y=0$', weight: 1.2 });
        const sy = v.stage({ x: [0, 40], y: [-3, 3], axes: 'box', gutter: true, height: 400, xlabel: 't', ylabel: 'y', title: 'the solution from $y(0)=0.1$, $\\dot y(0)=0$', weight: 1, minWidth: 260 });
        const H = s.handle(0.3, 0.5, { color: 'ink', label: '$(\\delta,\\varepsilon)$', labelPos: 'ne', constrain: { x: [0.01, 1.58], y: [0.01, 1.48] } });
        const T = 2 * Math.PI;
        const growth = (d, e, c) => mathieuFloquet(d, e, c).growth;
        const green = v.rgb('green'), red = v.rgb('red');
        v.legend([['red', 'unstable: growth rate (darker = faster)'], ['green', 'stable (bounded, or decaying with damping)'], ['ink', 'first-order tongue $|\\delta-\\frac14|=\\frac\\varepsilon2$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const c = cd.value;
          s.raster((d, e) => { const g = growth(d, e, c); if (g > 1e-4) { const k = Math.min(1, 0.35 + g * 2.2); return [red[0], red[1], red[2], 0.18 + 0.7 * k]; } return [green[0], green[1], green[2], 0.16]; }, { res: 4, key: 'mathieu' + c.toFixed(3) });
          s.axes();
          for (const sg of [-1, 1]) s.line(0.25, 0, 0.25 + sg * 0.75, 1.5, { color: 'ink', width: 1.3, dash: [6, 4] });
          for (const n of [1, 2]) { const x = (n * n) / 4; if (x < 1.6) { s.dot(x, 0, { r: 4, color: 'ink' }); s.text(n === 1 ? '1/4' : '1', x, 0.06, { size: 11, color: 'ink', align: 'center' }); } }
          const d = H.x, e = H.y, g = growth(d, e, c);
          const Af = (t) => [[0, 1], [-(d + e * Math.cos(t)), -c]];
          const tr = flow((t, x) => mvec(Af(t), x), 0, [0.1, 0], 40, 2000).map(([t, x]) => [t, x[0]]);
          const mx = Math.max(0.3, ...tr.map((q) => Math.abs(q[1])).filter(isFinite));
          sy.setView([0, 40], [-Math.min(mx * 1.15, 1e4), Math.min(mx * 1.15, 1e4)]);
          sy.clip(() => { sy.path(tr, { color: 'accent', width: 1.8 }); if (g > 1e-3) { sy.fn((t) => 0.1 * Math.exp(g * t), { color: 'red', width: 1.2, dash: [5, 4], domain: [0, 40] }); sy.fn((t) => -0.1 * Math.exp(g * t), { color: 'red', width: 1.2, dash: [5, 4], domain: [0, 40] }); } });
          let late = 0; for (let i = 1500; i < tr.length; i++) late = Math.max(late, Math.abs(tr[i][1]));
          info = { g, late, d, e, pred: Math.abs(d - 0.25) < e / 2 };
        });
        v.readout(() => {
          if (!info) return '';
          const { g, late, d, e, pred } = info;
          return `$(\\delta,\\varepsilon)=(${v.fix(d, 2)},\\,${v.fix(e, 2)})$: Floquet growth rate $\\frac1T\\ln|\\mu|_{\\max}=${v.fix(g, 4)}$ — ${g > 1e-4 ? 'inside a tongue: the amplitude grows' : 'outside: bounded' + (g < -1e-4 ? ' and decaying' : '')}. Largest $|y|$ in the last quarter of the run: $${v.fix(late, 2)}$ (started at $0.1$). First-order prediction for the first tongue: ${pred ? 'inside' : 'outside'}${Math.abs(d - 0.25) < e / 2 !== g > 1e-4 ? ' (the first-order boundary is only approximate for large $\\varepsilon$ or near higher tongues)' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.19
    {
      num: '3.19',
      kind: 'Theorem',
      name: 'Stable, unstable and centre subspaces',
      statement: String.raw`Let $A$ be a real $n\times n$ matrix. The space $\R^n$ splits as a direct sum
$$\R^n=E^s\oplus E^c\oplus E^u,$$
where $E^s$, $E^c$, $E^u$ are the real parts of the sums of the generalized eigenspaces for the eigenvalues with $\operatorname{Re}\lambda<0$, $=0$ and $>0$ respectively. Each is invariant under $e^{tA}$. A solution starting in $E^s$ decays exponentially as $t\to\infty$, one starting in $E^u$ decays exponentially as $t\to-\infty$ (and grows as $t\to+\infty$), and on $E^c$ solutions grow at most polynomially in both directions. A general solution is the sum of its three components.`,
      idea: String.raw`Group the Jordan blocks (3.7) of $A$ according to the sign of the real part of the eigenvalue; the generalized eigenspace decomposition (ladr-8.22) says the corresponding spaces are complementary and each is $A$-invariant, hence invariant under every power of $A$ and under $e^{tA}$. On each piece the exponential estimate of 3.9 applies. Since $e^{tA}$ acts on each summand separately, the solution through $x_0=x_s+x_c+x_u$ is $e^{tA}x_s+e^{tA}x_c+e^{tA}x_u$.`,
      caption: String.raw`The matrix has a real eigenvalue $\lambda$ (a line) and a complex pair $\alpha\pm i\beta$ (a plane); the line and the disc are coloured by type: green $=E^s$, red $=E^u$, blue $=E^c$ (drag to rotate the scene). Drag the gold start point: its trajectory (gold) is the sum of the two component trajectories (faint, one in the line, one in the plane). Set $\alpha$ or $\lambda$ to $0$ and the corresponding piece becomes the centre subspace. Trajectories launched inside a subspace never leave it, as the readout verifies.`,
      deps: ['ode-3.7', 'ladr-8.22'],
      refs: ['Teschl §3.2', 'Teschl §9.1'],
      tags: ['invariant subspaces', 'stable manifold'],
      viz(v) {
        const lam = v.slider('real eigenvalue $\\lambda$', -1.5, 1.5, -0.7, { step: 0.05 });
        const alp = v.slider('$\\alpha$ (real part of the pair)', -0.8, 0.8, 0, { step: 0.05 });
        const bet = v.slider('$\\beta$ (frequency)', 0.5, 2.5, 1.3, { step: 0.05 });
        const Tm = v.slider('time span $T$', 1, 8, 5, { step: 0.1 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-2.1, 2.1], equal: true, axes: false, height: 440, title: 'invariant subspaces of a $3\\times3$ matrix' });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.35, axis: 2, lim: 1.8, labels: ['x₁', 'x₂', 'x₃'] });
        const G = sc.handle([0.9, 0.7, 0.8], { color: 'gold', label: '$x_0$' });
        const v1 = [1, 0.25, 0.1], uu = [0.15, 1, 0.1], ww = [0.0, 0.3, 1];
        const P = [[v1[0], uu[0], ww[0]], [v1[1], uu[1], ww[1]], [v1[2], uu[2], ww[2]]];
        const inv3 = (M) => { const a = M.map((r, i) => [...r, ...[0, 1, 2].map((j) => (i === j ? 1 : 0))]); for (let i = 0; i < 3; i++) { let p = i; for (let r = i + 1; r < 3; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r; [a[i], a[p]] = [a[p], a[i]]; const d = a[i][i]; for (let j = 0; j < 6; j++) a[i][j] /= d; for (let r = 0; r < 3; r++) if (r !== i) { const f = a[r][i]; for (let j = 0; j < 6; j++) a[r][j] -= f * a[i][j]; } } return a.map((r) => r.slice(3)); };
        const Pi = inv3(P);
        const nrm = (a) => Math.hypot(...a), sub = (a, b) => a.map((x, i) => x - b[i]), dotp = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
        const e1 = (() => { const n = nrm(uu); return uu.map((x) => x / n); })();
        const e2 = (() => { const p = dotp(ww, e1), r = sub(ww, e1.map((x) => x * p)), n = nrm(r); return r.map((x) => x / n); })();
        const type = (re) => (re < -0.04 ? 's' : re > 0.04 ? 'u' : 'c'), COL = { s: 'green', u: 'red', c: 'accent' }, NAME = { s: 'stable', u: 'unstable', c: 'centre' };
        v.legend([['green', 'stable $E^s$'], ['red', 'unstable $E^u$'], ['accent', 'centre $E^c$'], ['gold', 'trajectory of $x_0$ = sum of its two components']]);
        let info = null;
        v.render(() => {
          const l = lam.value, a = alp.value, b = bet.value, T = Tm.value;
          const D = [[l, 0, 0], [0, a, -b], [0, b, a]], A = mmul(mmul(P, D), Pi);
          const E = expm(A, T / 160), tl = type(l), tp = type(a);
          sc.begin();
          sc.disc(e1, e2, 1.7, { fill: COL[tp], fillAlpha: 0.1, color: COL[tp], grid: true });
          sc.line(v1.map((x) => -1.9 * x), v1.map((x) => 1.9 * x), { color: COL[tl], width: 3 });
          const path = (x0, col, w, al) => { let x = x0; const pts = [x0]; for (let k = 0; k < 160; k++) { x = mvec(E, x); if (nrm(x) > 3.2) break; pts.push(x); } sc.path(pts, { color: col, width: w, alpha: al }); return pts; };
          // starts inside each subspace
          const sLine = v1.map((x) => 0.8 * x), sPlane = e1.map((x, i) => 1.1 * x + 0.3 * e2[i]);
          path(sLine, COL[tl], 2.2, 1); path(sPlane, COL[tp], 2.2, 1);
          const x0 = G.p, c = mvec(Pi, x0);
          const xl = v1.map((q) => c[0] * q), xp = [0, 1, 2].map((i) => c[1] * uu[i] + c[2] * ww[i]);
          path(xl, COL[tl], 1.3, 0.55); path(xp, COL[tp], 1.3, 0.55); path(x0, 'gold', 3, 1);
          sc.arrow(x0.map(() => 0), xl, { color: COL[tl], width: 1.6 }); sc.arrow(xl, x0, { color: COL[tp], width: 1.6 });
          sc.flush();
          // invariance check: leave-the-subspace distance for the two start points
          let off = 0; const Et = expm(A, T);
          const y1 = mvec(Et, sLine), c1 = mvec(Pi, y1); off = Math.max(off, Math.hypot(c1[1], c1[2]) / Math.max(1e-9, Math.abs(c1[0])));
          const y2 = mvec(Et, sPlane), c2 = mvec(Pi, y2); off = Math.max(off, Math.abs(c2[0]) / Math.max(1e-9, Math.hypot(c2[1], c2[2])));
          const ex = mvec(Et, x0), cx = mvec(Pi, ex);
          const comp = mvec(Et, xl).map((q, i) => q + mvec(Et, xp)[i]);
          info = { tl, tp, l, a, off, split: nrm(sub(comp, ex)), c };
        });
        v.readout(() => {
          if (!info) return '';
          const { tl, tp, l, a, off, split, c } = info;
          const dims = { s: 0, u: 0, c: 0 }; dims[tl] += 1; dims[tp] += 2;
          return `Eigenvalues $${v.fix(l, 2)}$ and $${v.fix(a, 2)}\\pm i\\beta$: $\\dim E^s=${dims.s}$, $\\dim E^c=${dims.c}$, $\\dim E^u=${dims.u}$ (the line is **${NAME[tl]}**, the plane is **${NAME[tp]}**).\nStarts inside a subspace leave it by relative amount $${off < 1e-9 ? '<10^{-9}' : v.sci(off, 1)}$; the sum of the evolved components equals the evolved $x_0$ to $${v.sci(Math.max(split, 1e-17), 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Robustness of stability under small perturbations',
      statement: String.raw`Let $A$ be a constant matrix with $\|e^{tA}\|\le Ce^{-\mu t}$ for $t\ge0$ (possible for every $\mu<-s(A)$, see 3.9) and let $B(t)$ be continuous with $\|B(t)\|\le\beta$. Then every solution of $\dot x=(A+B(t))x$ satisfies
$$|x(t)|\le C\,|x(0)|\,e^{(-\mu+C\beta)t}\qquad(t\ge0).$$
In particular, if $\beta<\mu/C$ the origin of the perturbed system is still exponentially stable. The constant $C$ measures the non-normality of $A$: if $A$ is normal ($C=1$ is possible) the threshold $\mu$ is sharp, otherwise the guaranteed tolerance $\mu/C$ can be far smaller than the size of the smallest destabilizing perturbation.`,
      idea: String.raw`Treat $B(t)x$ as a forcing term and use variation of constants (3.12): $x(t)=e^{tA}x_0+\int_0^te^{(t-s)A}B(s)x(s)\,ds$. Multiply by $e^{\mu t}$ and set $u(t)=e^{\mu t}|x(t)|$: then $u(t)\le C|x_0|+C\beta\int_0^tu(s)\,ds$, which is exactly the hypothesis of Grönwall's inequality (2.5) and yields $u(t)\le C|x_0|e^{C\beta t}$.`,
      caption: String.raw`Pick a normal or a non-normal stable matrix $A$ (its eigenvalues are the same, $-1$ and $-2$). Left: the largest spectral abscissa of $A+B$ over a sampled family of constant perturbations of size $\beta$ (accent); it crosses $0$ at the numerically found threshold $\beta_{\rm found}$ (red). The green line is the Grönwall guarantee $\beta=\mu/C$, always to the left of it. Drag $\beta$ and watch (right) $\log|x|$ under a worst constant, a rotating and a randomly switching perturbation stay below the dashed Grönwall line.`,
      deps: ['ode-3.9', 'ode-2.5'],
      refs: ['Teschl §3.7'],
      scope: String.raw`The perturbation theorem is a sufficient condition. The numerically found threshold comes from sampling a three-parameter family of $2\times2$ perturbations and is therefore an upper bound for the true distance to instability (for real, constant, norm-bounded $B$).`,
      tags: ['robustness', 'gronwall', 'non-normality'],
      viz(v) {
        const sel = v.select('stable matrix $A=$', [{ value: 'n', label: 'normal $\\mathrm{diag}(-1,-2)$' }, { value: 'nn', label: 'non-normal $\\begin{pmatrix}-1&6\\\\0&-2\\end{pmatrix}$' }], 'nn');
        const pert = v.select('perturbation', [{ value: 'worst', label: 'worst constant' }, { value: 'rot', label: 'rotating' }, { value: 'rand', label: 'random switching' }], 'worst');
        const sB = v.stage({ x: [0, 1.6], y: [-1.2, 1.2], axes: 'box', gutter: true, height: 380, xlabel: 'β = ‖B‖', ylabel: 'max Re λ(A+B)', title: 'worst spectral abscissa over sampled $B$', weight: 1, minWidth: 260 });
        const sT = v.stage({ x: [0, 14], y: [-8, 8], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'log |x|', title: '$\\log|x(t)|$ for $\\dot x=(A+B(t))x$', weight: 1.2 });
        const HB = sB.handle(0.3, 0, { color: 'gold', label: '$\\beta$', labelPos: 'ne', constrain: { x: [0.02, 1.58], y: [0, 0] } });
        const mats = { n: [[-1, 0], [0, -2]], nn: [[-1, 6], [0, -2]] };
        const uvs = []; // rank-structure samples: B = β U diag(1,s) V^T
        for (let i = 0; i < 48; i++) for (let j = 0; j < 48; j++) for (const sv of [0, 0.5, 1]) uvs.push([(Math.PI * i) / 48, (2 * Math.PI * j) / 48, sv]);
        const mk = (b, th, ph, sv) => { const cu = Math.cos(th), su = Math.sin(th), cv = Math.cos(ph), sv_ = Math.sin(ph); const U = [[cu, -su], [su, cu]], Vt = [[cv, sv_], [-sv_, cv]]; return mmul(mmul(U, [[b, 0], [0, b * sv]]), Vt); };
        const absc = (M) => { const e = eig2(M); return Math.max(e.l1[0], e.l2[0]); };
        let cache = null;
        const prep = (key) => {
          if (cache && cache.key === key) return cache;
          const A = mats[key], sA = absc(A), m = 0.9 * (-sA);
          let Cc = 0; for (let i = 0; i <= 600; i++) { const t = i * 0.05; Cc = Math.max(Cc, opnorm(expm(A, t)) * Math.exp(m * t)); }
          const worst = (b) => { let best = -Infinity, arg = null; for (const [th, ph, sv] of uvs) { const a = absc(madd(A, mk(b, th, ph, sv))); if (a > best) { best = a; arg = [th, ph, sv]; } } return { best, arg }; };
          const curve = []; for (let i = 0; i <= 80; i++) { const b = (1.6 * i) / 80; curve.push([b, worst(b).best]); }
          let crit = null; for (let i = 1; i < curve.length; i++) if (curve[i - 1][1] < 0 && curve[i][1] >= 0) { crit = curve[i - 1][0] + (1.6 / 80) * (-curve[i - 1][1]) / (curve[i][1] - curve[i - 1][1]); break; }
          cache = { key, A, sA, mu: m, Cc, worst, curve, crit };
          return cache;
        };
        v.legend([['accent', 'worst sampled spectral abscissa'], ['green', 'Grönwall guarantee $\\mu/C$', { dash: true }], ['red', 'threshold found numerically', { dash: true }], ['accent', 'perturbed $\\log|x|$'], ['ink', 'Grönwall bound', { dash: true }], ['muted', 'unperturbed']]);
        let info = null;
        v.render(() => {
          const K = prep(sel.value), { A, mu, Cc, worst, curve, crit } = K, b = HB.x;
          sB.path(curve, { color: 'accent', width: 2.6 }); sB.hline(0, { color: 'muted', width: 1.2 });
          sB.vline(mu / Cc, { color: 'green', width: 2, dash: [6, 4] }); if (crit) sB.vline(crit, { color: 'red', width: 2, dash: [6, 4] });
          const w = worst(b); HB.set(b, w.best);
          // perturbation functions
          const Bw = mk(b, ...w.arg), rng = v.rng(7);
          const sw = Array.from({ length: 40 }, () => [rng() * Math.PI, rng() * 2 * Math.PI, rng()]);
          const Bf = pert.value === 'worst' ? () => Bw : pert.value === 'rot' ? (t) => [[b * Math.cos(2.2 * t), -b * Math.sin(2.2 * t)], [b * Math.sin(2.2 * t), b * Math.cos(2.2 * t)]] : (t) => { const q = sw[Math.min(39, Math.floor(t / 0.35))]; return mk(b, q[0], q[1], 1); };
          const T = 14, tr = flow((t, x) => mvec(madd(A, Bf(t)), x), 0, [Math.cos(0.4), Math.sin(0.4)], T, 1400), ln = tr.map(([t, x]) => [t, Math.log(Math.hypot(...x))]);
          const t0 = flow((t, x) => mvec(A, x), 0, [Math.cos(0.4), Math.sin(0.4)], T, 700).map(([t, x]) => [t, Math.log(Math.hypot(...x))]);
          sT.clip(() => {
            sT.path(t0, { color: 'muted', width: 1.4 });
            sT.fn((t) => Math.log(Cc) + (-mu + Cc * b) * t, { color: 'ink', width: 1.6, dash: [6, 4], domain: [0, T] });
            sT.path(ln, { color: 'accent', width: 2.4 });
          });
          let over = -Infinity; for (const [t, y] of ln) over = Math.max(over, y - (Math.log(Cc) + (-mu + Cc * b) * t));
          info = { b, Cc, mu, thrG: mu / Cc, crit, ab: w.best, over, rate: (ln[1400][1] - ln[700][1]) / (T / 2) };
        });
        v.readout(() => {
          if (!info) return '';
          const { b, Cc, mu, thrG, crit, ab, over, rate } = info;
          return `$\\mu=${v.fix(mu, 2)}$, $C=\\sup_t\\|e^{tA}\\|e^{\\mu t}=${v.fix(Cc, 2)}$: guaranteed tolerance $\\beta<\\mu/C=${v.fix(thrG, 3)}$; threshold found by search $\\beta\\approx${crit ? v.fix(crit, 3) : '>1.6'}$ (${crit ? v.fix(crit / thrG, 1) : '—'}$\\times$ larger).\nAt $\\beta=${v.fix(b, 2)}$ the worst sampled constant perturbation has $\\max\\operatorname{Re}\\lambda=${v.fix(ab, 3)}$; the plotted solution grows at mean rate $${v.fix(rate, 2)}$ and stays ${over <= 1e-6 ? 'below' : 'ABOVE'} the Grönwall bound (maximum margin $${v.fix(-over, 2)}$).`;
        });
      },
    },
  ],
};
