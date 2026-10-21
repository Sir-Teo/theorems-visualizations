// Partial Differential Equations — Chapter 4: Separation of variables and Fourier series (part a: 4.1–4.4)
import { pluckCoefficient, eigModes, sineCoeffs, cosineCoeffs, spline, extend } from './ch04.shared.js';

export default {
  collection: 'pde',
  chapter: 4,
  title: 'Separation of variables and Fourier series',
  summary: String.raw`On a bounded interval, looking for solutions that are products of a function of $x$ and a function of $t$ turns the PDE into an eigenvalue problem. The eigenfunctions for the standard boundary conditions are sines and cosines, so solving a problem means expanding the data in a Fourier series. Convergence in mean square, pointwise and uniformly depends on the smoothness of the data, and jumps produce the Gibbs overshoot. Fourier invented the whole scheme to solve the heat equation in 1807–1822.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Method',
      name: 'Separation of variables with Dirichlet conditions',
      statement: String.raw`Consider $u_t=k\,u_{xx}$ (heat) or $u_{tt}=c^2u_{xx}$ (wave) on $0<x<\ell$, with $k,c,\ell>0$ and $u(0,t)=u(\ell,t)=0$. Look for product solutions $u=X(x)T(t)$. Dividing by $XT$ separates the variables: $X''/X=T'/(kT)$ (resp. $T''/(c^2T)$) is a function of $x$ alone and of $t$ alone, hence a constant $-\lambda$. The spatial problem $-X''=\lambda X$, $X(0)=X(\ell)=0$ has nontrivial solutions only for $\lambda_n=(n\pi/\ell)^2$, $X_n=\sin(n\pi x/\ell)$, $n=1,2,\dots$; the time factors are $T_n=e^{-k\lambda_nt}$ (heat) or $T_n=A\cos(c\sqrt{\lambda_n}t)+B\sin(c\sqrt{\lambda_n}t)$ (wave). Because both equations and the boundary conditions are linear and homogeneous, every finite sum $\sum c_nX_nT_n$ is again a solution, and the series with coefficients fitted to the initial data is the candidate for the full problem. Heat requires initial temperature; wave motion requires both displacement and velocity, determining its cosine and sine time coefficients respectively.`,
      idea: String.raw`The product ansatz works because $\partial_t$ acts only on $T$ and $\partial_x^2$ only on $X$, so the PDE becomes an identity between a function of $t$ and a function of $x$, which forces both to be constant. The eigenvalue $\lambda$ must be positive (otherwise the only function vanishing at both ends is $0$, an elementary ODE fact), and the boundary conditions then quantise it. The set of solutions is a vector space (superposition, 1.1), so one assembles arbitrary data from the product solutions; whether the infinite sum really represents the data is the question answered by the Fourier convergence theorems later in this chapter.`,
      caption: String.raw`Choose the heat or the wave equation and drag the four coefficient handles $c_1,\dots,c_4$ (right). The left panel shows $u(x,t)$ animated; the orange curve is the single product solution $c_n\sin(n\pi x)T_n(t)$ for the highlighted $n$, the faint ones are the others. Heat: higher modes die at rate $n^2\pi^2$ and the lowest mode with a nonzero initial coefficient eventually dominates the decaying profile; wave: every mode oscillates at its own frequency $n\pi c$. The readout evaluates the PDE residual by finite differences of the whole sum, so you are checking that superposition really solves the equation.`,
      deps: ['pde-1.6', 'ode-4.6'],
      refs: ['Ivrii §4.1 (separation, eigenvalues and both wave initial data)'],
      credit: 'Presentation follows Ivrii, Partial Differential Equations, chapter 4',
      tags: ['separation of variables', 'eigenvalues', 'superposition'],
      links: { source: 'https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.1.html', wikipedia: 'https://en.wikipedia.org/wiki/Separation_of_variables' },
      viz(v) {
        const M = v.M;
        const eq = v.select('equation', [{ value: 'heat', label: 'heat $u_t=u_{xx}$' }, { value: 'wave', label: 'wave $u_{tt}=u_{xx}$' }], 'heat');
        const nS = v.slider('highlight mode $n$', 1, 4, 1, { int: true });
        const A = v.stage({ x: [0, 1], y: [-1.9, 1.9], axes: 'box', gutter: true, height: 270, xlabel: 'x', title: '$u(x,t)=\\sum c_n\\sin(n\\pi x)\\,T_n(t)$', minWidth: 300 });
        const B = v.stage({ x: [0.5, 4.5], y: [-1.15, 1.15], axes: 'box', gutter: true, height: 270, xlabel: 'mode n', title: 'initial coefficients $c_n$ (drag)', minWidth: 240, xticks: [1, 2, 3, 4], weight: 0.6 });
        const c0 = [0.9, -0.5, 0.45, 0.25];
        const H = c0.map((c, i) => B.handle(i + 1, c, { color: 'accent', r: 7, constrain: (x, y) => [i + 1, M.clamp(y, -1.1, 1.1)] }));
        const Tn = (n, tt) => (eq.value === 'heat' ? Math.exp(-n * n * Math.PI * Math.PI * tt) : Math.cos(n * Math.PI * tt));
        const uAt = (x, tt) => H.reduce((s, h, i) => s + h.y * Math.sin((i + 1) * Math.PI * x) * Tn(i + 1, tt), 0);
        let tphys = 0, res = 0, bdry = 0;
        v.animate((t) => {
          const bound = 1.12 * Math.max(.2, H.reduce((a, h) => a + Math.abs(h.y), 0));
          A.setView([0, 1], [-bound, bound]);
          tphys = eq.value === 'heat' ? 0.012 * t : 0.5 * t;
          for (let n = 1; n <= 4; n++) if (n !== nS.value) A.fn((x) => H[n - 1].y * Math.sin(n * Math.PI * x) * Tn(n, tphys), { color: 'muted', width: 1.4, alpha: 0.6 });
          A.fn((x) => uAt(x, tphys), { color: 'accent', width: 3.2, n: 300 });
          const nn = nS.value;
          A.fn((x) => H[nn - 1].y * Math.sin(nn * Math.PI * x) * Tn(nn, tphys), { color: 'orange', width: 2.4 });
          A.corner(`t = ${v.fix(tphys, 3)}`, 'tr', { color: 'ink', weight: 600 });
          // PDE residual by finite differences of the full sum
          const h = 1e-4, ht = eq.value === 'heat' ? 1e-5 : h; res = 0;
          for (let i = 1; i <= 15; i++) {
            const x = i / 16, ut = (uAt(x, tphys + ht) - uAt(x, tphys - ht)) / (2 * ht), utt = (uAt(x, tphys + ht) - 2 * uAt(x, tphys) + uAt(x, tphys - ht)) / (ht * ht);
            const uxx = (uAt(x + h, tphys) - 2 * uAt(x, tphys) + uAt(x - h, tphys)) / (h * h);
            res = Math.max(res, eq.value === 'heat' ? Math.abs(ut - uxx) : Math.abs(utt - uxx));
          }
          bdry = Math.max(Math.abs(uAt(0, tphys)), Math.abs(uAt(1, tphys)));
        }, { period: 4, still: 1.0 });
        v.legend([['accent', 'the sum $u$'], ['orange', 'highlighted mode'], ['muted', 'other modes']]);
        v.readout(() => {
          const n = nS.value, lam = (n * Math.PI) ** 2;
          return `mode $n=${n}$: $X''/X=-\\lambda_n=-(n\\pi)^2=${v.fix(-lam, 2)}$, and $T'/(kT)$ is the same constant for $T=e^{-\\lambda_nt}$ (heat), $T''/T=-\\lambda_n$ for $T=\\cos(n\\pi t)$ (wave)\n` +
            `max over $x$ of the residual of the PDE for the whole sum: $${v.sci(res, 2)}$ · $\\max|u|$ at the ends: $${v.sci(bdry, 2)}$ (numerical differences include truncation and roundoff error)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Normal modes of a vibrating string',
      statement: String.raw`A string of length $\ell$ fixed at both ends and released from rest in a continuous piecewise-smooth shape $\varphi$ with $\varphi(0)=\varphi(\ell)=0$ has the Fourier solution $u(x,t)=\sum_{n\ge1}b_n\sin(n\pi x/\ell)\cos(n\pi ct/\ell)$ with $b_n=\frac2\ell\int_0^\ell\varphi(x)\sin(n\pi x/\ell)\,dx$. It is a superposition of *normal modes*: standing waves with nodes at $x=j\ell/n$ vibrating at the frequencies $f_n=nc/(2\ell)$, integer multiples of the fundamental. For a string plucked into a triangle with peak height $h$ at $x=p\ell$, $b_n=\dfrac{2h}{n^2\pi^2p(1-p)}\sin(n\pi p)$. The $n$-th harmonic is absent when $np$ is an integer, and a pickup placed at a node of the $n$-th mode does not register it.`,
      idea: String.raw`Each normal mode is a separated solution (4.1) whose time factor is a pure cosine, so the whole motion is periodic with period $2\ell/c$ and its spectrum consists of the harmonics of one fundamental. The amplitudes are the sine coefficients of the initial shape, here computed by integrating a piecewise-linear function by parts twice, which produces the $1/n^2$ decay (the kink of the pluck) and the factor $\sin(n\pi p)$ (the value of the $n$-th mode at the pluck point). Plucking at a node of a mode puts zero energy into it, because the coefficient formula contains $\sin(n\pi p)$. A pluck shape has a kink, so the resulting wave solution is understood weakly across the travelling kinks.`,
      caption: String.raw`Drag the gold handle to choose where and how high to pluck the string (with *snap* on, the pluck point jumps to multiples of $1/12$ so you can hit exact nodes). The top panel animates the motion. The bar chart shows the pluck's harmonic content $|b_n|$ (blue bars); the gold dots are $|b_n\sin(n\pi x_{\rm p})|$, what a pickup at the position $x_{\rm p}$ (the pickup slider) would register. Pluck at $p=1/3$ and the 3rd, 6th, … harmonics vanish; place the pickup at the middle and all even harmonics vanish. The speaker plays the string's first sixteen partials with exactly these weights (a model, not a physical string synthesis: no damping, no stiffness).`,
      deps: ['pde-4.1'],
      refs: ['Ivrii §4.1, equations (4.1.14)–(4.1.17); triangle coefficients derived by two integrations by parts'],
      credit: 'Presentation follows Ivrii, Partial Differential Equations, chapter 4',
      tags: ['vibrating string', 'harmonics', 'normal modes'],
      links: { source: 'https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.1.html', wikipedia: 'https://en.wikipedia.org/wiki/Normal_mode' },
      viz(v) {
        const M = v.M, NB = 16, f0 = 196;
        const snap = v.toggle('snap pluck point to $k/12$', true);
        const pick = v.slider('pickup position $x_{\\rm p}$', 0.05, 0.95, 0.25, { step: 0.01 });
        const S = v.stage({ x: [0, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 240, xlabel: 'x', title: 'the string', minWidth: 300 });
        const B = v.stage({ x: [0.4, NB + 0.6], y: [0, 1.0], axes: 'box', gutter: true, height: 240, xlabel: 'harmonic n', title: 'harmonic content', minWidth: 300 });
        const Hd = S.handle(1 / 3, 1.0, { color: 'gold', r: 8, label: 'pluck', constrain: (x, y) => [snap.value ? M.clamp(Math.round(x * 12) / 12, 1 / 12, 11 / 12) : M.clamp(x, 0.04, 0.96), M.clamp(y, 0.1, 1.4)] });
        const bn = pluckCoefficient;
        const shape = (p, h) => (x) => (x <= p ? (h * x) / p : (h * (1 - x)) / (1 - p));
        let b = [], eShare = [];
        v.animate((t) => {
          const p = Hd.x, h = Hd.y, tau = 0.5 * t;
          b = Array.from({ length: NB }, (_, i) => bn(i + 1, p, h));
          S.fn(shape(p, h), { color: 'muted', width: 1.4, dash: [5, 4] });
          S.vline(pick.value, { color: 'green', width: 1.5, dash: [3, 3] });
          const u = (x) => { let s = 0; for (let n = 1; n <= 80; n++) s += bn(n, p, h) * Math.sin(n * Math.PI * x) * Math.cos(n * Math.PI * tau); return s; };
          S.fn(u, { color: 'accent', width: 3, n: 300 });
          S.dot(pick.value, u(pick.value), { color: 'green', r: 5 });
          B.setView([0.4, NB + 0.6], [0, Math.max(.2, ...b.map(Math.abs)) * 1.15]);
          B.bars(b.map(Math.abs), { x0: 1, dx: 1, color: (val, i) => (Math.abs(val) < 1e-6 ? 'red' : 'accent') });
          B.dots(b.map((q, i) => [i + 1, Math.abs(q * Math.sin((i + 1) * Math.PI * pick.value))]), { color: 'gold', r: 4.5 });
          const e = 2 * h * h / (Math.PI * Math.PI * p * (1 - p)); const es = []; for (let n = 1; n <= 4; n++) es.push((n * bn(n, p, h)) ** 2);
          eShare = es.slice(0, 4).map((q) => q / e);
        }, { period: 4, still: 0.7 });
        v.legend([['accent', 'pluck content $|b_n|$', { area: true }], ['gold', 'heard at the pickup', { dot: true }], ['red', 'absent harmonic']]);
        v.soundButton('hear this string', (snd) => {
          const w = b.map((q, i) => [f0 * (i + 1), Math.abs(q * Math.sin((i + 1) * Math.PI * pick.value))]);
          snd.tone(w, { duration: 1.6, gain: 0.3, release: 0.8 });
        });
        v.readout(() => {
          const p = Hd.x, miss = [];
          for (let n = 1; n <= NB; n++) if (Math.abs(Math.sin(n * Math.PI * p)) < 1e-9) miss.push(n);
          const missAt = []; for (let n = 1; n <= NB; n++) if (Math.abs(Math.sin(n * Math.PI * pick.value)) < 1e-9) missAt.push(n);
          return `pluck at $p=${v.fix(p, 3)}$: absent harmonics ${miss.length ? miss.join(', ') : 'none'} · silent at the pickup: ${missAt.length ? missAt.join(', ') : 'none'}\n` +
            `energy shares of modes 1–4: ${eShare.map((q) => v.fix(100 * q, 1) + '%').join(', ')} (each mode's energy $\\propto n^2b_n^2$, conserved separately)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Method',
      name: 'Neumann and Robin boundary conditions',
      statement: String.raw`On $0<x<\ell$ the eigenvalue problem $-X''=\lambda X$ with the end conditions $X'(0)=0$ (insulated, Neumann) or $X(0)=0$ (Dirichlet) at the left and the Robin condition $X'(\ell)+hX(\ell)=0$ at the right ($h=0$ is Neumann, $h\to\infty$ is Dirichlet) has, for positive eigenvalues, $X=\cos\mu x$ or $\sin\mu x$ with $\lambda=\mu^2$ and the *transcendental* equation for $\mu$ obtained from the right end: $-\mu\sin\mu\ell+h\cos\mu\ell=0$, i.e. $\mu\tan\mu\ell=h$ (left Neumann), resp. $\mu\cos\mu\ell+h\sin\mu\ell=0$, i.e. $\tan\mu\ell=-\mu/h$ when $h\ne0$ (left Dirichlet). For $h\ge0$ eigenvalues are nonnegative: zero occurs only for Neumann at both ends ($h=0$, $X=1$), and otherwise they are positive. At $h=-1/\ell$ with Dirichlet left there is also a zero eigenvalue, with $X=x$. For $h<0$ (the boundary *adds* heat in proportion to the temperature) one eigenvalue can be negative, $\lambda=-\kappa^2$ with $X=\cosh\kappa x$ or $\sinh\kappa x$, and the corresponding heat mode grows like $e^{\kappa^2kt}$.`,
      idea: String.raw`Separation (4.1) is unchanged; only the boundary condition at the end where the sine or cosine was fixed changes the quantisation. Substituting $X=\cos\mu x$ (or $\sin\mu x$) into the right-hand condition gives a nonlinear equation for $\mu$ with infinitely many roots, interlaced with $n\pi/\ell$ shifts; no closed form, so they are found numerically. The sign of $h$ is the energy story: $\int_0^\ell X'^2\,dx=\lambda\int X^2+\dots$ after integrating by parts picks up the boundary term $-hX(\ell)^2$, which for $h\ge0$ is non-positive for the heat energy balance and for $h<0$ can overpower the interior diffusion.`,
      caption: String.raw`Choose the left end (insulated or held at zero) and slide the Robin coefficient $h$ at the right end. Top: the first five eigenfunctions (the selected one thick, a growing mode in red). Bottom: that mode evolving under the heat equation, with its spatial envelope $\pm\|X_j\|_\infty e^{-\lambda kt}$: it decays for $\lambda>0$ and *grows* for the red mode. With Neumann left, $h=0$ gives cosines and a constant mode; with Dirichlet left it gives half-integer sines; as $h$ grows, the right end approaches Dirichlet (sines for Dirichlet left, half-integer cosines for Neumann left); go negative (heat gain at the end) and a negative eigenvalue enters once $h<-1$ (Dirichlet left) or already at any $h<0$ (Neumann left). The eigenvalues are found numerically by scanning the boundary residual and bisecting.`,
      deps: ['pde-4.1'],
      refs: ['Ivrii §4.2, Examples 1–3 and 6–7; zero-mode threshold'],
      credit: 'Presentation follows Ivrii, Partial Differential Equations, chapter 4',
      tags: ['boundary conditions', 'eigenvalues', 'Robin'],
      links: { source: 'https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.2.html', wikipedia: 'https://en.wikipedia.org/wiki/Robin_boundary_condition' },
      viz(v) {
        const M = v.M;
        const left = v.select('left end', [{ value: 'D', label: 'held at 0 (Dirichlet)' }, { value: 'N', label: 'insulated (Neumann)' }], 'N');
        const hS = v.slider('Robin coefficient $h$ at $x=1$', -3, 20, 2, { step: 0.25 });
        const jS = v.slider('mode shown (sorted by $\\lambda$)', 1, 5, 1, { int: true });
        const A = v.stage({ x: [0, 1], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'eigenfunctions $X_j$', minWidth: 290 });
        const B = v.stage({ x: [0, 1], y: [-3, 3], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'that mode under the heat equation', minWidth: 290 });
        let key = '', modes = [];
        const get = () => {
          const k = left.value + hS.value;
          if (k !== key) { key = k; modes = eigModes(left.value, 'R', 0, hS.value, 5); }
          return modes;
        };
        v.animate((t) => {
          const ms = get(), j = Math.min(jS.value, ms.length) - 1, tt = 0.03 * t;
          const amp = Math.max(...Array.from({ length: 401 }, (_, i) => Math.abs(ms[j].X(i / 400)))), allAmp = Math.max(...ms.flatMap(m => Array.from({ length: 401 }, (_, i) => Math.abs(m.X(i / 400)))));
          A.setView([0, 1], [-1.12 * allAmp, 1.12 * allAmp]);
          ms.forEach((m, i) => { if (i !== j) A.fn(m.X, { color: m.kind === 'growing' ? 'red' : 'muted', width: 1.4, alpha: 0.7 }); });
          const sel = ms[j];
          A.fn(sel.X, { color: sel.kind === 'growing' ? 'red' : 'accent', width: 3.2 });
          A.vline(1, { color: 'orange', width: 1.5, dash: [4, 3] });
          const env = Math.exp(-sel.lam * tt);
          B.setView([0, 1], [-1.12 * amp * Math.max(1, env), 1.12 * amp * Math.max(1, env)]);
          B.fn(sel.X, { color: 'muted', width: 1.2, dash: [5, 4] });
          B.fn((x) => sel.X(x) * env, { color: sel.kind === 'growing' ? 'red' : 'green', width: 3 });
          B.fn((x) => env * amp, { color: 'faint', width: 1, dash: [3, 3] }); B.fn((x) => -env * amp, { color: 'faint', width: 1, dash: [3, 3] });
          B.corner(`t = ${v.fix(tt, 3)}  ·  amplitude ×${v.fix(env, 3)}`, 'tr', { color: 'ink', weight: 600 });
        }, { period: 4, still: 2.5 });
        v.legend([['accent', 'selected eigenfunction'], ['muted', 'the other modes'], ['red', 'negative eigenvalue (growing)'], ['faint', 'spatial amplitude envelope']]);
        v.readout(() => {
          const ms = get();
          const lamTxt = ms.map((m) => `$${v.fix(m.lam, 3)}$`).join(', ');
          const neg = ms.some((m) => m.lam < -1e-9), zero = ms.some((m) => Math.abs(m.lam) < 1e-9);
          return `lowest eigenvalues $\\lambda_j$: ${lamTxt}\n` + (neg ? 'a NEGATIVE eigenvalue: this heat mode grows without bound (heat gain at the boundary beats diffusion) ✓ matches $h<0$' : zero ? 'a zero eigenvalue with constant (or linear) eigenfunction: the mode neither decays nor grows' : 'all eigenvalues positive: every mode decays');
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Fourier sine, cosine and full series',
      statement: String.raw`For a function $f$ on $[0,\ell]$ (here $\ell=1$) there are three Fourier series. The *sine series* $\sum_{n\ge1}b_n\sin(n\pi x)$, $b_n=2\int_0^1f\sin n\pi x\,dx$, is the full series of the *odd* extension of $f$ to $[-1,1]$, $2$-periodically continued. The *cosine series* $\frac{a_0}2+\sum_{n\ge1}a_n\cos(n\pi x)$, $a_n=2\int_0^1f\cos n\pi x\,dx$, is that of the *even* extension. The *full series* $\frac{a_0}2+\sum_{n\ge1}\big(a_n\cos2\pi nx+b_n\sin2\pi nx\big)$, $a_n=2\int_0^1f\cos2\pi nx\,dx$, $b_n=2\int_0^1f\sin2\pi nx\,dx$, is that of the $1$-periodic continuation of $f$. On $(0,1)$ they represent the same $f$ (under conditions given in 4.7), but outside $[0,1]$ they represent three different functions, and the odd and periodic continuations are discontinuous at the ends unless $f(0)=f(1)=0$ (resp. $f(0)=f(1)$).`,
      idea: String.raw`Each series is the expansion of $f$ in one of the orthogonal systems $\{\sin n\pi x\}$, $\{\cos n\pi x\}$, $\{1,\cos2\pi nx,\sin2\pi nx\}$ (orthogonality is computed in 4.5), and the coefficients are the orthogonal projections, $\langle f,e_n\rangle/\langle e_n,e_n\rangle$. Which one to use is dictated by the boundary condition (Dirichlet: sines, Neumann: cosines, periodic: the full series). The choice of extension matters for how fast the series converges: for a piecewise $C^2$ function $f$, its continuous even extension gives cosine coefficients decaying faster ($O(n^{-2})$) than sine series of a function with $f(0)\ne0$ ($O(n^{-1})$), see 4.9.`,
      caption: String.raw`Shape $f$ on $[0,1]$ by dragging the five handles, pick the series and the number of harmonics $N$. The window shows $[-2,2]$: the dashed grey curve is the extension that the series actually represents (odd, even or periodic), the orange curve its partial sum, and the shaded band $[0,1]$ is where it must agree with $f$. Try nonzero endpoint values with $f(0)\ne f(1)$: the odd and the periodic extensions jump at integers and the partial sums overshoot there, while the even extension stays continuous. The lower panel shows the coefficient sizes.`,
      deps: ['pma-8.9', 'pma-8.10'],
      refs: ['Strauss §5.1', 'Strauss §5.2'],
      credit: 'J. Fourier, 1807–1822',
      tags: ['Fourier series', 'extensions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series' },
      viz(v) {
        const M = v.M, K = 60;
        const ext = v.select('series', [{ value: 'odd', label: 'sine (odd)' }, { value: 'even', label: 'cosine (even)' }, { value: 'per', label: 'full (periodic)' }], 'odd');
        const nS = v.slider('harmonics $N$', 1, 40, 8, { int: true });
        const A = v.stage({ x: [-2, 2], y: [-1.6, 1.8], axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'the extension and its partial sum', full: true });
        const B = v.stage({ x: [0.4, 40.6], y: [0, 1], axes: 'box', gutter: true, height: 150, xlabel: 'n', title: 'coefficient sizes', full: true });
        const xs = [0, 0.25, 0.5, 0.75, 1], y0 = [0.8, 1.2, 0.2, 0.7, -0.4];
        const H = xs.map((x, i) => A.handle(x, y0[i], { color: 'orange', r: 6.5, constrain: (xx, y) => [x, M.clamp(y, -1.5, 1.7)] }));
        let key = '', C = null;
        const coeffs = (f) => {
          const kind = ext.value;
          if (kind === 'odd') return { a0: 0, a: [], b: Array.from(sineCoeffs(f, K)) };
          if (kind === 'even') { const c = cosineCoeffs(f, K); return { a0: 2 * c[0], a: Array.from(c).slice(1), b: [] }; }
          const nq = 1500, a = [], b = []; let a0 = 0;
          for (let j = 0; j < nq; j++) a0 += (2 * f((j + 0.5) / nq)) / nq;
          for (let n = 1; n <= K; n++) { let sa = 0, sb = 0; for (let j = 0; j < nq; j++) { const x = (j + 0.5) / nq, fv = f(x); sa += fv * Math.cos(2 * Math.PI * n * x); sb += fv * Math.sin(2 * Math.PI * n * x); } a.push((2 * sa) / nq); b.push((2 * sb) / nq); }
          return { a0, a, b };
        };
        const partial = (c, N, x) => {
          const kind = ext.value;
          let s = c.a0 / 2;
          for (let n = 1; n <= N; n++) {
            if (kind === 'odd') s += c.b[n - 1] * Math.sin(n * Math.PI * x);
            else if (kind === 'even') s += c.a[n - 1] * Math.cos(n * Math.PI * x);
            else s += c.a[n - 1] * Math.cos(2 * Math.PI * n * x) + c.b[n - 1] * Math.sin(2 * Math.PI * n * x);
          }
          return s;
        };
        let f = null, fe = null, err = 0, jump = 0;
        v.render(() => {
          f = spline(xs, H.map((h) => h.y));
          const k = ext.value + H.map((h) => h.y.toFixed(4)).join();
          if (k !== key) { key = k; C = coeffs(f); }
          fe = ext.value === 'odd' ? extend(f, 1, -1, -1) : ext.value === 'even' ? extend(f, 1, 1, 1) : (x) => f(((x % 1) + 1) % 1);
          const N = nS.value;
          A.rect(0, -1.6, 1, 1.8, { fill: 'accent', fillAlpha: 0.07, stroke: false });
          A.fn(fe, { color: 'muted', width: 1.6, dash: [6, 4], n: 800 });
          A.fn((x) => partial(C, N, x), { color: 'orange', width: 2.6, n: 900 });
          A.fn(f, { color: 'accent', width: 2.2, domain: [0, 1] });
          // coefficient sizes
          const mag = Array.from({ length: 40 }, (_, i) => Math.hypot(C.a[i] || 0, C.b[i] || 0));
          B.setView([0.4, 40.6], [0, Math.max(0.2, ...mag) * 1.1]);
          B.bars(mag, { x0: 1, dx: 1, color: (val, i) => (i < N ? 'orange' : 'faint') });
          let s2 = 0; for (let i = 0; i < 400; i++) { const x = (i + 0.5) / 400; s2 += (f(x) - partial(C, N, x)) ** 2 / 400; }
          err = Math.sqrt(s2);
          jump = fe(0 + 1e-9) - fe(0 - 1e-9);
        });
        v.legend([['accent', '$f$ on $[0,1]$'], ['muted', 'extension represented', { dash: true }], ['orange', 'partial sum $S_N$']]);
        v.readout(() => `$L^2$ error of $S_N$ on $[0,1]$: ${v.fix(err, 4)} · jump of the extension at $x=0$: ${v.fix(jump, 3)}${Math.abs(jump) < 1e-6 ? ' (continuous: coefficients decay fast)' : ' (discontinuous: expect overshoot and slow $1/n$ decay)'} · series value at $x=0$: ${v.fix(partial(C, K, 0), 3)} while $f(0)=${v.fix(f(0), 3)}$`);
      },
    },
  ],
};
