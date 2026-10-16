// Ordinary Differential Equations & Dynamical Systems — Chapter 4: Series solutions and boundary value problems
// (items 4.1–4.5 here; 4.6–4.10 in ch04-b.js, 4.11–4.15 in ch04-c.js)
import { flow, besselJ, besselY, besselZeros, legendreP, legendreSeriesCoef, polyHorner, frobCoef, frobEval, indicialRoots, simpson } from './ch04.shared.js';

export default {
  collection: 'ode',
  chapter: 4,
  title: 'Series solutions and boundary value problems',
  summary: String.raw`Equations with analytic coefficients have power series solutions, and at regular singular points the Frobenius method adds a fractional power or a logarithm — the source of the Bessel and Legendre functions. Boundary value problems behave very differently from initial value problems: they may have no solution or many. For Sturm–Liouville problems the self-adjoint structure gives real eigenvalues, orthogonal eigenfunctions and complete expansions, while Sturm's comparison theorems count the zeros of solutions.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Analytic coefficients give analytic solutions',
      statement: String.raw`Let $a_0,a_1,g$ be analytic in the disc $|z-z_0|<R$ (that is, given there by convergent power series). Then the equation $u''+a_1(z)u'+a_0(z)u=g(z)$ with initial data $u(z_0)=\xi_0$, $u'(z_0)=\xi_1$ has a unique solution, it is analytic in the *whole* disc $|z-z_0|<R$, and its Taylor coefficients are found by substituting $u=\sum_k c_k(z-z_0)^k$ and comparing coefficients, which gives each $c_{k+2}$ from the earlier ones. The same holds for systems and for equations of any order.`,
      idea: String.raw`Substitution turns the equation into a recursion for $c_k$; the work is to show the resulting series converges on the full disc and not just near $z_0$. One compares with a *majorant* problem whose coefficients dominate those of the given one and whose series solution is explicit and positive, and applies Picard iteration in the space of power series (a contraction, as in 2.4). The disc can be no larger than the distance to the nearest singularity of the coefficients in the complex plane, even if everything is perfectly smooth on the real line.`,
      caption: String.raw`The equation is $(c^2+x^2)u''+c^2u=0$, whose coefficient has poles at $z=\pm ic$ (the two red points on the left). Drag the pole up and down and the centre $x_0$ left and right: the green disc, centred at $x_0$, reaches exactly to the nearest pole. On the right the Taylor polynomial of degree $N$ (blue) follows the true solution (black, integrated numerically) inside the disc and explodes just outside it, however many terms you add.`,
      deps: ['ode-2.4', 'rca-10.16'],
      refs: ['Teschl §4.1'],
      tags: ['power series', 'analyticity', 'radius of convergence'],
      scope: String.raw`Holds for linear equations with coefficients analytic in a disc; the radius of convergence of the solution is at least the radius of the disc, and equal to it in the typical case where the singularity of the coefficients is genuinely felt by the solution.`,
      credit: 'A.-L. Cauchy (method of majorants, 1830s–40s)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Power_series_solution_of_differential_equations' },
      verify: true,
      viz(v) {
        const sc = v.stage({ x: [-3.6, 3.6], y: [-2.7, 2.7], equal: true, axes: true, height: 320, xlabel: 'Re z', ylabel: 'Im z', title: 'complex plane: poles of the coefficient', weight: 0.9, minWidth: 250 });
        const sr = v.stage({ x: [-3.6, 3.6], y: [-3.2, 3.2], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'u', title: 'real line: solution and Taylor polynomial', weight: 1.2, minWidth: 280 });
        const pole = sc.handle(0, 1, { color: 'red', label: '$ic$', labelPos: 'ne', constrain: (x, y) => [0, Math.min(2.3, Math.max(0.35, y))] });
        const cen = sc.handle(0, 0, { color: 'accent', label: '$x_0$', labelPos: 'sw', constrain: (x, y) => [Math.min(2, Math.max(-2, x)), 0] });
        const Ns = v.slider('degree $N$', 1, 70, 12, { int: true });
        v.legend([['ink', 'exact solution'], ['accent', 'Taylor polynomial of degree $N$'], ['green', 'disc of guaranteed convergence', { area: true }]]);
        let info = null;
        v.render(() => {
          const c = pole.y, x0 = cen.x, R = Math.hypot(x0, c), c2 = c * c, A = c2 + x0 * x0, K = 120;
          const a = [1, 0.4]; for (let k = 0; k + 2 <= K; k++) a[k + 2] = -(2 * x0 * (k + 1) * k * a[k + 1] + (k * (k - 1) + c2) * a[k]) / (A * (k + 2) * (k + 1));
          const F = (x, [u, w]) => [w, (-c2 * u) / (c2 + x * x)];
          const right = flow(F, x0, [1, 0.4], 3.6, 500), left = flow(F, x0, [1, 0.4], -3.6, 500).reverse();
          const ex = left.slice(0, -1).concat(right).map(([x, y]) => [x, y[0]]);
          const N = Ns.value, poly = a.slice(0, N + 1);
          // complex plane
          sc.circle(x0, 0, R, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
          sc.dot(0, c, { r: 5, color: 'red' }); sc.dot(0, -c, { r: 5, color: 'red', label: '$-ic$', labelPos: 'se' });
          sc.line(x0, 0, 0, c, { color: 'red', dash: true, width: 1, alpha: 0.7 });
          // real line
          sr.vband(x0 - R, x0 + R, { color: 'green', alpha: 0.1 });
          sr.vline(x0 - R, { color: 'green', dash: true, alpha: 0.8 }); sr.vline(x0 + R, { color: 'green', dash: true, alpha: 0.8 });
          const ts = []; for (let i = 0; i <= 600; i++) { const x = -3.6 + (7.2 * i) / 600, y = polyHorner(poly, x - x0); ts.push([x, Math.abs(y) > 50 ? (y > 0 ? 50 : -50) : y]); }
          sr.clip(() => { sr.path(ts, { color: 'accent', width: 2.4 }); sr.path(ex, { color: 'ink', width: 1.8 }); });
          sr.dot(x0, 1, { r: 4, color: 'gold' });
          let ein = 0, eout = 0, nin = 0, nout = 0;
          for (const [x, y] of ex) { const t = x - x0, e = Math.abs(polyHorner(poly, t) - y); if (Math.abs(t) < 0.8 * R) { ein = Math.max(ein, e); nin++; } else if (Math.abs(t) > 1.15 * R) { eout = Math.max(eout, e); nout++; } }
          const rootTest = a[K] !== 0 ? Math.pow(Math.abs(a[K]), -1 / K) : NaN, ratio = Math.sqrt(Math.abs(a[K - 2] / a[K]));
          info = { R, c, x0, N, ein, eout, nin, nout, rootTest, ratio };
        });
        v.readout(() => {
          if (!info) return '';
          const { R, c, x0, N, ein, eout, nin, nout, rootTest, ratio } = info;
          return `Nearest pole is at distance $\\sqrt{x_0^2+c^2}=${v.fix(R, 3)}$ from the centre $x_0=${v.fix(x0, 2)}$.\nCoefficient test on the first 120 Taylor coefficients: $|c_{120}|^{-1/120}=${v.fix(rootTest, 3)}$ and $\\sqrt{|c_{118}/c_{120}|}=${v.fix(ratio, 3)}$ (both tend to the radius of convergence).\nDegree $N=${N}$: largest error ${nin ? 'at distance $<0.8R$ is $' + v.sci(ein, 2) + '$' : 'inside the disc: n/a'}${nout ? '; at distance $>1.15R$ it is $' + v.sci(eout, 2) + '$ (and grows with $N$)' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Regular singular points',
      statement: String.raw`Write a second-order linear equation as $u''+p(z)u'+q(z)u=0$. A point $z_0$ is an *ordinary point* if $p,q$ are analytic there. It is a *regular singular point* if it is not ordinary but $(z-z_0)p(z)$ and $(z-z_0)^2q(z)$ are analytic at $z_0$ (poles of order at most $1$ and $2$); in terms of $t=z-z_0$ the equation then reads
$$t^2u''+t\,P(t)\,u'+Q(t)\,u=0,\qquad P(t)=\sum_{k\ge0}p_kt^k,\ Q(t)=\sum_{k\ge0}q_kt^k.$$
The *indicial equation* is $s(s-1)+p_0s+q_0=0$; its roots $r_1,r_2$ are the exponents of the local solutions $u\sim t^{r}$. A singular point that is not regular is *irregular*.`,
      idea: String.raw`Freeze the coefficients at their leading values: near $t=0$ the equation behaves like the Euler equation $t^2u''+p_0tu'+q_0u=0$, which is solved by powers $t^s$ exactly when $s(s-1)+p_0s+q_0=0$. The orders 1 and 2 are the *largest* poles for which this still works, since then both $t^2u''$ and $tp_0u'$ scale like $t^s$. Stronger poles make the dominant balance different (essential singularities of solutions, as for $u''+t^{-2}u'=0$).`,
      caption: String.raw`Drag the singular point $s$ along the axis and move the exponents with the sliders $p_0,q_0$ (the full equation is $(x-s)^2u''+(x-s)(p_0+0.6(x-s))u'+(q_0+0.8(x-s))u=0$). Left: the two local solutions (the real and imaginary parts when the roots are complex). Right: $\ln|u|$ against $\ln(x-s)$; as $x\to s$ the curves become straight lines whose slopes are the indicial roots, which the readout measures.`,
      deps: ['ode-4.1'],
      refs: ['Teschl §4.2'],
      tags: ['singular points', 'indicial equation'],
      credit: 'L. Fuchs, 1866',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Regular_singular_point' },
      viz(v) {
        const s1 = v.stage({ x: [-0.5, 3.5], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'u', title: 'local solutions near the singular point', weight: 1.1, minWidth: 270 });
        const s2 = v.stage({ x: [-7.4, 1], y: [-14, 14], axes: 'box', gutter: true, height: 320, xlabel: 'ln(x − s)', ylabel: 'ln |u|', title: 'log–log: slope = exponent', weight: 1, minWidth: 250 });
        const S = s1.handle(0.6, 0, { color: 'red', label: '$s$', labelPos: 'nw', constrain: (x, y) => [Math.min(1.6, Math.max(-0.2, x)), 0] });
        const p0 = v.slider('$p_0$', -1.5, 3, 1, { step: 0.05 }), q0 = v.slider('$q_0$', -3, 3, -0.5, { step: 0.05 });
        v.legend([['accent', 'first exponent (or real part)'], ['orange', 'second exponent (or imaginary part)'], ['ink', 'slope = exponent', { dash: true }]]);
        let info = null;
        v.render(() => {
          const s = S.x, P = [p0.value, 0.6, 0], Q = [q0.value, 0.8, 0], roots = indicialRoots(P[0], Q[0]);
          s1.setView([s - 0.9, s + 3], [-2.6, 2.6]);
          const cplx = Math.abs(roots[0][1]) > 1e-12, cs = cplx ? [frobCoef(P, Q, roots[0], 40)] : roots.map((r) => frobCoef(P, Q, r, 40));
          s1.vline(s, { color: 'red', width: 1.6, dash: [6, 4] }); s1.tex('\\text{singular}', s, -2.2, { color: 'red', size: 12, dx: 8, align: 'left' });
          const slopes = [];
          (cplx ? [0] : [0, 1]).forEach((i) => {
            const r = cplx ? roots[0] : roots[i], c = cs[i], pts1 = [], pts2 = [], lg = [];
            for (let k = 1; k <= 400; k++) { const t = 0.004 * Math.pow(1.0165, k); if (t > 3) break; const u = frobEval(c, r, t); pts1.push([s + t, u[0]]); pts2.push([s + t, u[1]]); }
            const keep = (a) => { const o = []; let br = false; for (const p of a) { if (Math.abs(p[1]) > 40) { if (!br) o.push(null); br = true; } else { o.push(p); br = false; } } return o; };
            s1.clip(() => { s1.path(keep(pts1), { color: 'accent', width: 2.4 }); if (cplx) s1.path(keep(pts2), { color: 'orange', width: 2.4 }); else if (i === 1) { /* second root drawn in orange below */ } });
            if (!cplx && i === 1) { s1.clip(() => { s1.path(keep(pts1), { color: 'orange', width: 2.4 }); }); }
            // log–log modulus
            for (let x = -7.4; x <= 1; x += 0.05) { const t = Math.exp(x), u = frobEval(c, r, t), m = Math.hypot(u[0], u[1]); lg.push([x, Math.log(m)]); }
            s2.clip(() => s2.path(lg, { color: cplx || i === 0 ? 'accent' : 'orange', width: 2.4 }));
            const f = (x) => Math.log(Math.hypot(...frobEval(c, r, Math.exp(x))));
            slopes.push((f(-6) - f(-8)) / 2);
            s2.line(-7.4, r[0] * -7.4, 1, r[0] * 1, { color: 'ink', dash: [5, 4], width: 1, alpha: 0.6 });
          });
          const resn = cs.map((c) => c.res.length > 0);
          info = { roots, slopes, cplx, resn, s };
        });
        v.readout(() => {
          if (!info) return '';
          const { roots, slopes, cplx } = info, f2 = (r) => (Math.abs(r[1]) < 1e-12 ? v.fix(r[0], 3) : `${v.fix(r[0], 3)}${r[1] >= 0 ? '+' : '-'}${v.fix(Math.abs(r[1]), 3)}i`);
          return `The point $s=${v.fix(info.s, 2)}$ is regular singular: $(x-s)p$ and $(x-s)^2q$ are analytic there. Indicial equation $r(r-1)+${v.fix(p0.value, 2)}\\,r+(${v.fix(q0.value, 2)})=0$, roots $r_1=${f2(roots[0])}$, $r_2=${f2(roots[1])}$.\nMeasured slopes of $\\ln|u|$ against $\\ln(x-s)$ on $[e^{-8},e^{-6}]$: ${slopes.map((x) => '$' + v.fix(x, 3) + '$').join(', ')}${cplx ? ' (the modulus has slope Re $r$; the oscillation comes from the factor $e^{i\\,\\mathrm{Im}\\,r\\,\\ln t}$)' : ''}.${info.resn.some(Boolean) ? '\nThe roots differ by a positive integer: the series for the smaller root hits a vanishing denominator (see 4.3).' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Method',
      name: 'Frobenius method',
      statement: String.raw`At a regular singular point $t=0$ of $t^2u''+tP(t)u'+Q(t)u=0$ let $r_1,r_2$ be the indicial roots, $\operatorname{Re}r_1\ge\operatorname{Re}r_2$, and let the series for $P,Q$ converge for $|t|<\rho$. Then
(a) for $r_1$ there is a solution $u_1=t^{r_1}\sum_{k\ge0}c_kt^k$, $c_0=1$, the series converging for $|t|<\rho$; its coefficients solve $F(r_1+k)c_k=-\sum_{j=1}^kc_{k-j}\big(p_j(r_1+k-j)+q_j\big)$ with $F(s)=s(s-1)+p_0s+q_0$;
(b) if $r_1-r_2$ is not an integer, the same recursion with $r_2$ gives a second independent solution;
(c) if $r_1=r_2$ or $r_1-r_2$ is a positive integer, the second solution is $u_2=\kappa\,u_1\ln t+t^{r_2}\sum d_kt^k$ with $\kappa\ne0$ forced by the recursion in the repeated case and possibly $\kappa=0$ otherwise.`,
      idea: String.raw`Insert $t^{r}\sum c_kt^k$ and collect powers of $t$: the lowest power gives the indicial equation, and each later power gives $F(r+k)c_k=\dots$, a recursion solvable as long as $F(r+k)\ne0$. For $r=r_1$ this never fails, because $F$ vanishes only at $r_1,r_2$ and $r_1+k$ is to the right of both. For the smaller root, $F(r_2+k)$ vanishes at $k=r_1-r_2$: if the right-hand side is nonzero there the recursion is inconsistent and a $\ln t$ term must be added (differentiate the solution with respect to the exponent to find it); if the right-hand side happens to vanish the series survives with a free constant.`,
      caption: String.raw`Bessel's equation $t^2u''+tu'+(t^2-\nu^2)u=0$ has indicial roots $\pm\nu$, so they differ by $2\nu$. Left: the first Frobenius coefficients $c_2,c_4,c_6$ of the series for $r=-\nu$ as functions of $\nu$ — each has a pole where $2\nu$ reaches the corresponding even integer. Right: $J_\nu$ and $J_{-\nu}$ (the two series solutions) and the logarithmic partner $Y_\nu$. Slide $\nu$ to an integer: $J_{-\nu}$ collapses onto $\pm J_\nu$, the Wronskian readout vanishes and only $Y_\nu$ (with its $\ln t$) is a second solution; at $\nu=\tfrac12,\tfrac32$ the poles cancel and no logarithm appears.`,
      deps: ['ode-4.2'],
      refs: ['Teschl §4.2', 'Teschl §4.4'],
      tags: ['Frobenius', 'indicial roots', 'logarithm'],
      credit: 'G. Frobenius, 1873',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frobenius_method' },
      viz(v) {
        const sA = v.stage({ x: [0, 3.5], y: [-3, 3], axes: 'box', gutter: true, height: 320, xlabel: 'ν', ylabel: 'coefficient', title: 'coefficients $c_2,c_4,c_6$ of the series for $r=-\\nu$', weight: 1, minWidth: 260 });
        const sB = v.stage({ x: [0, 12], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 320, xlabel: 't', ylabel: 'u', title: 'the solutions', weight: 1.1, minWidth: 270 });
        const nu = v.slider('$\\nu$', 0, 3.5, 0.37, { step: 0.01 });
        for (const [lab, val] of [['ν = ½', 0.5], ['ν = 1', 1], ['ν = 3/2', 1.5], ['ν = 2', 2]]) v.button(lab, () => nu.set(val));
        v.legend([['accent', '$J_\\nu$'], ['orange', '$J_{-\\nu}$ (Frobenius series for $r=-\\nu$)'], ['green', '$Y_\\nu$ (contains $\\ln t$)']]);
        const cols = ['accent', 'orange', 'purple'], ks = [2, 4, 6];
        const coef = (n, k) => { const P = [1, 0, 0], Q = [-n * n, 0, 1]; return frobCoef(P, Q, [-n, 0], k)[k][0]; };
        let curves = null;
        let info = null;
        v.render(() => {
          if (!curves) { curves = ks.map(() => []); for (let n = 0.0013; n <= 3.5; n += 0.0125) ks.forEach((k, i) => curves[i].push([n, coef(n, k)])); }
          curves.forEach((c, i) => { const o = []; let br = true; for (const p of c) { if (Math.abs(p[1]) > 3.2) { if (!br) o.push(null); br = true; } else { o.push(p); br = false; } } sA.path(o, { color: cols[i], width: 2.2 }); });
          for (let m = 1; m <= 3; m++) sA.vline(m, { color: 'faint', dash: [4, 4], width: 1 });
          const n = nu.value;
          ks.forEach((k, i) => { const y = coef(n, k); if (Math.abs(y) < 3.2) sA.dot(n, y, { r: 4.5, color: cols[i] }); });
          sA.vline(n, { color: 'red', width: 1.5, alpha: 0.7 });
          sA.tex('c_2', 0.18, -2.5, { color: 'accent' }); sA.tex('c_4', 0.18, -2.1, { color: 'orange' }); sA.tex('c_6', 0.18, -1.7, { color: 'purple' });
          const J = [], Jm = [], Y = [];
          for (let t = 0.05; t <= 12; t += 0.05) { J.push([t, besselJ(n, t)]); Jm.push([t, besselJ(-n, t)]); Y.push([t, besselY(n, t)]); }
          sB.clip(() => { sB.path(Y, { color: 'green', width: 2.2 }); sB.path(Jm, { color: 'orange', width: 2.4 }); sB.path(J, { color: 'accent', width: 2.4 }); });
          const co = frobCoef([1, 0, 0], [-n * n, 0, 1], [-n, 0], 8);
          const x = 2, d = 1e-4, Wn = x * (besselJ(n, x) * (besselJ(-n, x + d) - besselJ(-n, x - d)) / (2 * d) - (besselJ(n, x + d) - besselJ(n, x - d)) / (2 * d) * besselJ(-n, x));
          const isInt = Math.abs(n - Math.round(n)) < 0.005;
          info = { n, Wn, Wf: (-2 * Math.sin(n * Math.PI)) / Math.PI, co, isInt, half: Math.abs(2 * n - Math.round(2 * n)) < 0.005 && !isInt };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, Wn, Wf, co, isInt, half } = info;
          let r = `$\\nu=${v.fix(n, 2)}$: indicial roots $\\pm\\nu$ differ by $2\\nu=${v.fix(2 * n, 2)}$. Wronskian $t\\,W(J_\\nu,J_{-\\nu})$ measured at $t=2$: $${v.fix(Wn, 4)}$; formula $-2\\sin(\\nu\\pi)/\\pi=${v.fix(Wf, 4)}$.\n`;
          if (isInt) r += n < 0.005 ? 'Repeated root $0,0$: the second solution must contain $\\ln t$ ($Y_0$).' : `Roots differ by the integer $${Math.round(2 * n)}$ and the recursion for $r=-\\nu$ breaks down at $k=${Math.round(2 * n)}$ with a nonzero right-hand side: $J_{-\\nu}=\\pm J_\\nu$ is no longer independent, so $\\ln t$ is needed ($Y_\\nu$).`;
          else if (half) r += `The roots differ by the integer $${Math.round(2 * n)}$, but the right-hand side of the recursion vanishes there (all odd coefficients are $0$), so the series survives with a free constant: no logarithm.`;
          else r += 'Roots do not differ by an integer: both Frobenius series are genuine, independent solutions.';
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Bessel functions',
      statement: String.raw`*Bessel's equation* of order $\nu\ge0$ is $t^2u''+tu'+(t^2-\nu^2)u=0$. Its solution with leading behaviour $t^\nu$ is the *Bessel function of the first kind*
$$J_\nu(t)=\sum_{k\ge0}\frac{(-1)^k}{k!\,\Gamma(k+\nu+1)}\Big(\frac t2\Big)^{2k+\nu},$$
entire in $t$ times $t^\nu$. For $\nu\notin\mathbb Z$, $Y_\nu=\dfrac{J_\nu\cos\nu\pi-J_{-\nu}}{\sin\nu\pi}$ is a second solution (and $Y_n=\lim_{\nu\to n}Y_\nu$ for integers $n$), logarithmically or algebraically unbounded at $0$. $J_\nu$ has infinitely many simple positive zeros $j_{\nu,1}<j_{\nu,2}<\cdots$, those of $J_\nu$ and $J_{\nu+1}$ interlace, and $J_\nu(t)\approx\sqrt{2/(\pi t)}\cos(t-\tfrac{\nu\pi}2-\tfrac\pi4)$ as $t\to\infty$.`,
      idea: String.raw`The series is the Frobenius solution of 4.3 for the larger root $\nu$ of the indicial equation (the recursion is $c_k=-c_{k-2}/(k(k+2\nu))$, so the coefficients decay factorially). Substituting $u=t^{-1/2}w$ turns the equation into $w''+(1-\frac{\nu^2-1/4}{t^2})w=0$, a harmonic oscillator with a slowly vanishing perturbation: this explains the $t^{-1/2}$ decay of the amplitude, the almost constant spacing $\pi$ of the zeros, and (via Sturm comparison, 4.11) the interlacing.`,
      caption: String.raw`Left: $J_\nu$ (blue) and $Y_\nu$ (orange) for the order $\nu$ you choose, with the amplitude envelope $\pm\sqrt{2/(\pi t)}$; switch on $J_{\nu+1}$ to see its zeros interlace with those of $J_\nu$ (dots on the axis) and the large-$t$ cosine to see how quickly it takes over. Right: the vibrating circular drumhead $J_n(j_{n,m}r)\cos n\theta$ of angular order $n$ and radial order $m$; its nodal circles sit at $r=j_{n,k}/j_{n,m}$, $k<m$.`,
      deps: ['ode-4.3'],
      refs: ['Teschl §4.2'],
      tags: ['Bessel', 'special functions', 'vibrating drum'],
      credit: 'F. W. Bessel, 1824',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bessel_function' },
      viz(v) {
        const sA = v.stage({ x: [0, 20], y: [-1.1, 1.1], axes: 'box', gutter: true, height: 330, xlabel: 't', ylabel: 'u', title: 'Bessel functions $J_\\nu$, $Y_\\nu$', weight: 1.4, minWidth: 300 });
        const sD = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: false, height: 330, title: 'drumhead mode', weight: 0.8, minWidth: 240 });
        const nu = v.slider('order $\\nu$', 0, 5, 0, { step: 0.05 });
        const nxt = v.toggle('show $J_{\\nu+1}$ (interlacing zeros)', true), asy = v.toggle('large-$t$ cosine approximation', false);
        const dn = v.select('drum: angular order $n$', [0, 1, 2, 3].map((x) => ({ value: x, label: String(x) })), 1), dm = v.select('radial order $m$', [1, 2, 3].map((x) => ({ value: x, label: String(x) })), 2);
        v.legend([['accent', '$J_\\nu$'], ['orange', '$Y_\\nu$'], ['purple', '$J_{\\nu+1}$'], ['ink', 'envelope $\\sqrt{2/\\pi t}$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const n = nu.value, env = (t) => Math.sqrt(2 / (Math.PI * t));
          sA.fn((t) => env(t), { domain: [0.3, 20], color: 'ink', dash: true, width: 1, alpha: 0.6 }); sA.fn((t) => -env(t), { domain: [0.3, 20], color: 'ink', dash: true, width: 1, alpha: 0.6 });
          const Y = [], J = [], J1 = [], A = [];
          for (let t = 0.1; t <= 20; t += 0.05) { Y.push([t, besselY(n, t)]); J.push([t, besselJ(n, t)]); if (nxt.value) J1.push([t, besselJ(n + 1, t)]); if (asy.value) A.push([t, env(t) * Math.cos(t - (n * Math.PI) / 2 - Math.PI / 4)]); }
          sA.clip(() => { sA.path(Y, { color: 'orange', width: 2 }); if (nxt.value) sA.path(J1, { color: 'purple', width: 2 }); sA.path(J, { color: 'accent', width: 2.6 }); if (asy.value) sA.path(A, { color: 'green', width: 1.6, dash: [5, 4] }); });
          const z0 = besselZeros(n, 20), z1 = nxt.value ? besselZeros(n + 1, 20) : [];
          for (const z of z0) sA.dot(z, 0, { r: 4, color: 'accent' }); for (const z of z1) sA.dot(z, 0, { r: 4, color: 'purple', hollow: true });
          // interlacing check
          let inter = z1.length > 0; for (let i = 0; i < z0.length - 1 && inter; i++) { if (!(z0[i] < z1[i] && z1[i] < z0[i + 1])) inter = false; }
          // drum
          const N = dn.value, M = dm.value, zs = besselZeros(N, 40), jm = zs[M - 1], R = 80, prof = []; for (let i = 0; i <= R; i++) prof.push(besselJ(N, (jm * i) / R));
          const rad = (r) => { const q = r * R, i = Math.min(R - 1, Math.floor(q)); return prof[i] * (1 - (q - i)) + prof[i + 1] * (q - i); };
          const mx = Math.max(...prof.map(Math.abs));
          sD.raster((x, y) => { const r = Math.hypot(x, y); if (r > 1) return null; const val = (rad(r) * Math.cos(N * Math.atan2(y, x))) / mx; const c = v.diverge(val, 'blue', 'red'); return [c[0], c[1], c[2], 1]; }, { res: 3, key: `drum${N}-${M}-${v.diverge(1).join()}` });
          sD.circle(0, 0, 1, { color: 'ink', width: 2, fill: false });
          for (let k = 1; k < M; k++) sD.circle(0, 0, zs[k - 1] / jm, { color: 'ink', width: 1.4, dash: [5, 4] });
          if (N > 0) for (let k = 0; k < N; k++) { const a = (Math.PI * (k + 0.5)) / N; sD.line(Math.cos(a), Math.sin(a), -Math.cos(a), -Math.sin(a), { color: 'ink', width: 1.4, dash: [5, 4] }); }
          info = { n, z0, inter, jm, N, M, hasNext: nxt.value };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, z0, inter, jm, N, M, hasNext } = info, d = z0.length > 3 ? z0[z0.length - 1] - z0[z0.length - 2] : NaN;
          return `$J_{${v.fix(n, 2)}}$ has ${z0.length} zeros in $(0,20]$: $${z0.slice(0, 4).map((z) => v.fix(z, 3)).join(',\\ ')},\\dots$; spacing of the last two $=${v.fix(d, 3)}$ (tends to $\\pi=3.142$).${hasNext ? `\nZeros of $J_{\\nu}$ and $J_{\\nu+1}$ alternate on $(0,20]$: ${inter ? 'yes' : 'no (check: needs the same count)'}.` : ''}\nDrum mode $(n,m)=(${N},${M})$: frequency proportional to $j_{${N},${M}}=${v.fix(jm, 4)}$; ${M - 1} nodal circle(s) and ${N} nodal diameter(s).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Legendre polynomials',
      statement: String.raw`*Legendre's equation* is $(1-x^2)y''-2xy'+\ell(\ell+1)y=0$ on $(-1,1)$, with regular singular points $x=\pm1$. Its power series solutions about $0$ (an even and an odd one) are unbounded at $x=\pm1$ unless $\ell$ is a non-negative integer, when one of them terminates. The terminating solution, normalised by $P_n(1)=1$, is the *Legendre polynomial*
$$P_n(x)=\frac1{2^nn!}\frac{d^n}{dx^n}(x^2-1)^n,$$
of degree $n$ with parity $(-1)^n$. They satisfy $(n+1)P_{n+1}=(2n+1)xP_n-nP_{n-1}$ and are orthogonal, $\int_{-1}^1P_mP_n\,dx=\dfrac{2}{2n+1}\delta_{mn}$.`,
      idea: String.raw`In the power series recursion $a_{k+2}=\frac{k(k+1)-\ell(\ell+1)}{(k+1)(k+2)}a_k$ the numerator vanishes at $k=\ell$ if $\ell$ is an integer, cutting the series off. For non-integer $\ell$ the ratio $a_{k+2}/a_k\to1$, so the series behaves like $\sum x^k/k$ and diverges logarithmically at $\pm1$ (the exponents at the singular points $\pm1$ are $0,0$, so the second solution always carries a $\ln(1\mp x)$, as in 4.3). Orthogonality is a Sturm–Liouville fact: the operator $-(\,(1-x^2)y')'$ is symmetric on functions bounded at $\pm1$ (see 4.9).`,
      caption: String.raw`Left: $P_0,\dots,P_n$ on $[-1,1]$ (choose $n$). Middle: the matrix of integrals $\int_{-1}^1P_iP_j\,dx$, computed numerically — zero off the diagonal, $2/(2n+1)$ on it. Right: the even or odd *series* solution of Legendre's equation for a non-integer $\ell$ (summed to 3000 terms): drag $\ell$ and watch it blow up towards $x=\pm1$ except when $\ell$ is an integer of the right parity and the series stops.`,
      deps: ['ode-4.3'],
      refs: ['Teschl ch. 4'],
      tags: ['Legendre', 'orthogonal polynomials', 'special functions'],
      credit: 'A.-M. Legendre, 1782 (memoir published 1785)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre_polynomials' },
      viz(v) {
        const sP = v.stage({ x: [-1, 1], y: [-1.15, 1.15], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'P_n(x)', title: 'Legendre polynomials', weight: 1.1, minWidth: 260 });
        const sG = v.stage({ x: [-0.7, 9.2], y: [-0.1, 9.45], aspect: 1, axes: false, title: 'Gram matrix $\\int P_iP_j$', weight: 0.9, minWidth: 250 });
        const sS = v.stage({ x: [-1.05, 1.05], y: [-4, 4], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'y', title: 'power-series solution', weight: 1, minWidth: 250 });
        const Nn = v.slider('degrees up to $n$', 1, 8, 5, { int: true });
        const ell = v.slider('$\\ell$ in the series', 0, 6, 1.5, { step: 0.01 }), par = v.select('series', [{ value: 0, label: 'even' }, { value: 1, label: 'odd' }], 0);
        v.button('ℓ = 3', () => ell.set(3)); v.button('ℓ = 1.5', () => ell.set(1.5));
        const cols = ['accent', 'orange', 'green', 'purple', 'red', 'teal', 'gold', 'pink', 'muted'];
        const M = 600, xs = Array.from({ length: M + 1 }, (_, i) => -1 + (2 * i) / M);
        const gram = []; for (let i = 0; i <= 8; i++) { gram.push([]); for (let j = 0; j <= 8; j++) gram[i].push(simpson(xs.map((x) => legendreP(i, x) * legendreP(j, x)), 2 / M)); }
        let info = null;
        v.render(() => {
          const n = Nn.value;
          for (let k = 0; k <= n; k++) sP.fn((x) => legendreP(k, x), { color: cols[k], width: 2, domain: [-1, 1] });
          let off = 0, dg = 0;
          for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
            const val = gram[i][j], inn = i <= n && j <= n, y = 8 - i;
            if (i !== j) off = Math.max(off, i <= n && j <= n ? Math.abs(val) : 0); else if (inn) dg = Math.max(dg, Math.abs(val - 2 / (2 * i + 1)));
            const c = v.ramp(inn ? Math.min(1, Math.abs(val) / 1.0) : 0, 'accent');
            sG.rect(j + 0.04, y + 0.04, j + 0.96, y + 0.96, { fill: [c[0], c[1], c[2], inn ? 1 : 0.25], stroke: false });
            if (inn) sG.text(Math.abs(val) < 5e-7 ? '0' : v.fix(val, 3), j + 0.5, y + 0.5, { size: 10.5, align: 'center', baseline: 'middle', color: i === j ? 'ink' : 'muted' });
          }
          for (let k = 0; k <= 8; k++) { sG.text(String(k), k + 0.5, 9.05, { size: 11, align: 'center', color: 'muted' }); sG.text(String(k), -0.1, 8 - k + 0.5, { size: 11, align: 'right', baseline: 'middle', color: 'muted' }); }
          const L = ell.value, odd = par.value === 1, a = legendreSeriesCoef(L, odd, 3000), pts = [];
          for (let i = 0; i <= 400; i++) { const x = -0.999 + (1.998 * i) / 400; pts.push([x, polyHorner(a, x)]); }
          sS.vline(-1, { color: 'red', dash: true, alpha: 0.7 }); sS.vline(1, { color: 'red', dash: true, alpha: 0.7 });
          sS.clip(() => sS.path(pts, { color: Math.abs(L - Math.round(L)) < 0.004 && a.slice(Math.round(L) + 1).every((q) => Math.abs(q) < 1e-12) ? 'green' : 'accent', width: 2.6 }));
          const terminates = Math.abs(L - Math.round(L)) < 0.004 && Math.round(L) % 2 === (odd ? 1 : 0);
          info = { off, dg, L, odd, terminates, end: polyHorner(a, 0.999), n };
        });
        v.readout(() => {
          if (!info) return '';
          const { off, dg, L, odd, terminates, end, n } = info;
          return `Gram matrix up to $n=${n}$: largest off-diagonal entry $${v.sci(off || 1e-17, 2)}$, largest deviation of a diagonal entry from $2/(2n+1)$: $${v.sci(dg || 1e-17, 2)}$ (Simpson rule, 600 panels).\nSeries solution for $\\ell=${v.fix(L, 2)}$, ${odd ? 'odd' : 'even'}: value at $x=0.999$ is $${v.fix(end, 2)}$${terminates ? ' — it terminates (a polynomial, a multiple of $P_{' + Math.round(L) + '}$) and stays bounded.' : Math.abs(L - Math.round(L)) < 0.004 ? ' — $\\ell$ is an integer but of the wrong parity for this series, which therefore does not terminate and diverges at $\\pm1$.' : ' — it grows without bound as $x\\to\\pm1$.'}`;
        });
      },
    },
  ],
};
