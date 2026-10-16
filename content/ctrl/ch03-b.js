// Control Theory — Chapter 3 (part b): LaSalle, regions of attraction, phase portraits, limit cycles, Hopf, BIBO
import {
  clamp, nTeX, matTeX, cTeX, eigs, rk2, flow2, ring, linField, jac2, quad, lyap2, drawOrbits, samples, simulate, rk4, tf, tfTeX,
} from './ch03.shared.js';

export default {
  collection: 'ctrl',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'LaSalle’s invariance principle',
      statement: String.raw`Let $\Omega\subset\R^n$ be a compact set that is positively invariant for $\dot x=f(x)$, and let $V:\Omega\to\R$ be $C^1$ with $\dot V\le0$ on $\Omega$. Let $E=\{x\in\Omega:\dot V(x)=0\}$ and let $M$ be the **largest invariant set** contained in $E$ (the union of all complete trajectories that stay in $E$ for all time). Then every solution starting in $\Omega$ converges to $M$ as $t\to\infty$.

In particular, if $M=\{0\}$ and $V$ is positive definite, the origin is asymptotically stable, even though $\dot V$ is only negative **semi**definite.`,
      idea: String.raw`Along a solution $V$ is non-increasing and bounded below on the compact $\Omega$, so it tends to a limit $c$. The limit set of the trajectory (the points it keeps approaching) is non-empty, compact and invariant, and $V\equiv c$ on it, so $\dot V\equiv0$ along the trajectories inside it. Hence the limit set lies in $E$, and being invariant it lies in $M$ (ode-5.10 is the statement for general flows). This is what makes the pendulum with friction, whose energy only loses power when it moves, a case where Lyapunov's direct method (ctrl-3.6) would stall.`,
      caption: String.raw`A pendulum with friction, $\dot\varphi=\omega,\ \dot\omega=-\sin\varphi-g(\omega)$, and the energy $V=\tfrac12\omega^2+1-\cos\varphi$ whose derivative $\dot V=-\omega g(\omega)$ vanishes on the whole line $\omega=0$ (**red**). Drag the **gold** start inside the separatrix: the trajectory crosses the red line again and again but never stays on it, because there $\dot\omega=-\sin\varphi\neq0$ except at the origin. $V(t)$ shows the plateaus (gold dots) at each crossing and still falls to $0$. Set the damping to $0$ and $E$ is everything: nothing converges. Start outside the separatrix (energy $\ge2$) and $\Omega$ is no longer the compact set the theorem needs.`,
      deps: ['ctrl-3.6', 'ode-5.10'],
      refs: ['Åström–Murray §5.4'],
      tags: ['lasalle', 'invariance'],
      credit: 'J. P. LaSalle, 1960 (the principle is also called the Krasovskii–LaSalle principle)',
      scope: String.raw`Needs a compact positively invariant $\Omega$; here the sublevel set $\{V\le c\}$ with $c<2$, in the strip $|\varphi|<\pi$.`,
      viz(v) {
        const T = 50, N = 2500;
        const cS = v.slider('damping $c$', 0, 1, 0.3, { step: 0.01 });
        const gS = v.select('friction law $g(\\omega)$', [{ value: 'lin', label: '$c\\,\\omega$' }, { value: 'cub', label: '$c\\,\\omega^3$' }], 'lin');
        const ph = v.stage({ x: [-4.2, 4.2], y: [-3, 3], equal: true, axes: true, height: 380, xlabel: 'φ', ylabel: 'ω' });
        const tm = v.stage({ x: [0, T], y: [0, 2.6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'V(t)', height: 380 });
        const h0 = ph.handle(2.0, 0.5, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        const V = (x, y) => 0.5 * y * y + 1 - Math.cos(x);
        let info = {};
        v.render(() => {
          const c = cS.value, g = gS.value === 'lin' ? (w) => c * w : (w) => c * w * w * w;
          const f = (x, y) => [y, -Math.sin(x) - g(y)], V0 = V(h0.x, h0.y);
          ph.contour(V, [0.5, 1, 1.5], { color: 'faint', width: 1, res: 160 });
          ph.contour(V, [2], { color: 'muted', width: 1.8, res: 220 });
          if (V0 < 2) ph.contour(V, [V0], { color: 'accent', width: 2.6, res: 220 });
          ph.hline(0, { color: 'red', width: 2.6, dash: [7, 5] });
          ph.text('$\\dot V=0$ on $\\omega=0$', 4.1, -0.3, { size: 12, color: 'red', align: 'right', baseline: 'top' });
          const o = flow2(f, h0.x, h0.y, T, T / N, 50);
          ph.clip(() => ph.path(o, { color: 'gold', width: 2.6 }));
          ph.dot(0, 0, { r: 4, color: 'ink' }); ph.dot(Math.PI, 0, { r: 4, color: 'red', hollow: true }); ph.dot(-Math.PI, 0, { r: 4, color: 'red', hollow: true });
          const Vt = o.map((p) => V(p[0], p[1]));
          tm.hline(2, { color: 'muted', dash: [5, 4] });
          tm.path(Vt.map((q, i) => [(i * T) / N, q]), { color: 'accent', width: 2.4 });
          const pl = []; for (let i = 1; i < o.length; i++) if (o[i - 1][1] * o[i][1] <= 0) pl.push([(i * T) / N, Vt[i]]);
          tm.dots(pl, { r: 3.5, color: 'gold' });
          const last = o[o.length - 1];
          info = { V0, Vend: Vt[Vt.length - 1], xend: last[0], cross: pl.length, c };
        });
        v.legend([['accent', 'energy $V(t)$ and the level set through $x(0)$'], ['red', '$E=\\{\\dot V=0\\}$: the line $\\omega=0$', { dash: true }], ['gold', 'crossings of $E$']]);
        v.readout(() => {
          const { V0, Vend, xend, cross, c } = info; if (V0 === undefined) return '';
          const k = Math.round(xend / (2 * Math.PI));
          const verdict = c === 0 ? '**no damping**: $\\dot V\\equiv0$, so $E=\\Omega$ and the orbit stays on its level set forever' : V0 >= 2 ? `**outside the separatrix** ($V(0)\\ge2$): no compact $\\Omega$ around the origin contains this orbit; it ends at the equilibrium $\\varphi=${k}\\cdot2\\pi$` : `**inside** $\\Omega=\\{V\\le${nTeX(V0, 3)}\\}$: the only invariant set in $E$ is the origin ($\\dot\\omega=-\\sin\\varphi\\ne0$ elsewhere on the line), so the orbit goes to $0$`;
          return `$V(0)=${v.fix(V0, 3)}$, $V(${T})=${v.sci(Math.max(Vend, 1e-12), 2)}$, ${cross} crossings of $E$; ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Region of attraction',
      statement: String.raw`If $x_e$ is an asymptotically stable equilibrium of $\dot x=f(x)$, its **region of attraction** (basin) is the set
$$\mathcal R=\{x_0:\ x(t;x_0)\to x_e\text{ as }t\to\infty\}.$$
It is open, connected and invariant, and its boundary consists of trajectories. The equilibrium is **globally** asymptotically stable if $\mathcal R=\R^n$. For linear systems $\mathcal R$ is all of $\R^n$ or nothing; for nonlinear ones it can be small, and it is rarely computable in closed form. By the direct method (ctrl-3.6) every bounded sublevel set $\{V\le c\}$ on which $\dot V<0$ is a **certified estimate** inside $\mathcal R$.`,
      idea: String.raw`A guarantee of local stability from linearisation (ctrl-3.4) says only that $\mathcal R$ contains some ball, with no size. A Lyapunov function turns the question into a computation: the largest $c$ for which $\dot V<0$ on $\{V\le c\}\setminus\{0\}$ gives a region that provably lies inside $\mathcal R$ (ode-5.12 treats basins of attraction for differential equations). The estimate depends on the choice of $V$, here a quadratic form from the Lyapunov equation, and is generally conservative.`,
      caption: String.raw`Every pixel is an initial state, coloured by where its trajectory ends up (by simulation over 60 s). **Blue** is the basin of the origin; **red** escapes. Choose the reversed van der Pol system, whose basin is bounded by an unstable limit cycle, or the damped pendulum, whose basin of the origin is a spiral band between the basins of the neighbouring downward positions (other colours). The **green** ellipse is the certified estimate $\{x^\top Px\le c^*\}$ with $P$ from $A^\top P+PA=-\mathrm{diag}(1,q)$ and $c^*$ the largest level with $\dot V<0$ inside (searched on a grid). Change $q$ and the estimate changes: always inside the basin, never exact. Drag the **gold** start to test.`,
      deps: ['ctrl-3.6', 'ode-5.12'],
      refs: ['Åström–Murray §5.4'],
      tags: ['region of attraction', 'lyapunov'],
      scope: String.raw`Basins are found by simulation on a pixel grid and $c^*$ by a grid search over the window; both are numerical.`,
      viz(v) {
        const SYS = {
          rvdp: { f: (x, y) => [-y, x + (x * x - 1) * y], win: [[-3.5, 3.5], [-3.5, 3.5]], name: 'reversed van der Pol: $\\dot x=-y,\\ \\dot y=x+(x^2-1)y$' },
          pend: { f: (x, y) => [y, -Math.sin(x) - 0.25 * y], win: [[-9.5, 9.5], [-4.2, 4.2]], name: 'damped pendulum: $\\dot x=y,\\ \\dot y=-\\sin x-0.25y$' },
        };
        const sysS = v.select('system', [{ value: 'rvdp', label: 'reversed van der Pol' }, { value: 'pend', label: 'damped pendulum' }], 'rvdp');
        const qS = v.slider('$Q=\\mathrm{diag}(1,q)$: $q$', 0.1, 10, 1, { log: true, sig: 2 });
        const ph = v.stage({ x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, axes: true, height: 460, xlabel: 'x', ylabel: 'y' });
        const h0 = ph.handle(1.2, 0.8, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        const classify = (key, x0, y0) => {
          const f = SYS[key].f; let x = x0, y = y0;
          if (key === 'rvdp') {
            for (let i = 0; i < 1200; i++) { [x, y] = rk2(f, x, y, 0.05); const r = Math.hypot(x, y); if (r < 0.05) return 0; if (r > 6) return -1; }
            return Math.hypot(x, y) < 1 ? 0 : -1;
          }
          for (let i = 0; i < 500; i++) {
            [x, y] = rk2(f, x, y, 0.1); const n = Math.round(x / (2 * Math.PI)), e = 0.5 * y * y + 1 - Math.cos(x - 2 * Math.PI * n);
            if (e < 0.02) return n;
          }
          return null;
        };
        const pn0 = () => v.rgb('panel');
        let est = null, estKey = '';
        const estimate = () => {
          const k = sysS.value + '|' + qS.value;
          if (k === estKey) return est; estKey = k;
          const s = SYS[sysS.value], A = jac2(s.f, 0, 0), P = lyap2(v.M, A, [[1, 0], [0, qS.value]]);
          let cs = Infinity; const [[x0, x1], [y0, y1]] = s.win;
          for (let x = x0; x <= x1; x += 0.04) for (let y = y0; y <= y1; y += 0.04) {
            if (Math.hypot(x, y) < 0.03) continue;
            const q = s.f(x, y), d = 2 * ((P[0][0] * x + P[0][1] * y) * q[0] + (P[1][0] * x + P[1][1] * y) * q[1]);
            if (d >= 0) cs = Math.min(cs, quad(P, x, y));
          }
          // test boundary points of the estimate
          let ok = 0, tot = 0;
          if (isFinite(cs)) {
            const ev = v.M.eigSym(P), L = ev.values;
            for (let k2 = 0; k2 < 48; k2++) {
              const a = (2 * Math.PI * k2) / 48, u = [Math.cos(a), Math.sin(a)], sc = Math.sqrt((0.995 * cs) / quad(P, u[0], u[1]));
              tot++; if (classify(sysS.value, sc * u[0], sc * u[1]) === 0) ok++;
            }
          }
          est = { P, cs, ok, tot };
          return est;
        };
        let info = {};
        v.render(() => {
          const key = sysS.value, s = SYS[key], e = estimate(), pn = pn0();
          ph.setView(s.win[0], s.win[1]);
          const cols = [v.rgb('blue'), v.rgb('orange'), v.rgb('green'), v.rgb('purple'), v.rgb('teal')], red = v.rgb('red');
          const mix = (c, t) => [pn[0] + (c[0] - pn[0]) * t, pn[1] + (c[1] - pn[1]) * t, pn[2] + (c[2] - pn[2]) * t];
          ph.raster((x, y) => {
            const c = classify(key, x, y);
            if (c === 0) return mix(cols[0], 0.32);
            if (c === -1) return mix(red, 0.16);
            if (c === null) return null;
            return mix(cols[1 + (((c % 4) + 4) % 4)], 0.22);
          }, { res: 5, key: `${key}|${v.color('panel')}` });
          if (isFinite(e.cs)) ph.contour((x, y) => quad(e.P, x, y), [e.cs], { color: 'green', width: 3, res: 240 });
          const o = flow2(s.f, h0.x, h0.y, 50, 0.05, 50);
          ph.clip(() => ph.path(o, { color: 'gold', width: 2.4 }));
          ph.dot(0, 0, { r: 4, color: 'ink' });
          const inEst = isFinite(e.cs) && quad(e.P, h0.x, h0.y) <= e.cs;
          info = { cls: classify(key, h0.x, h0.y), inEst };
        });
        v.legend([['blue', 'basin of the origin'], ['red', 'escapes'], ['green', 'certified estimate $\\{V\\le c^*\\}$'], ['gold', 'orbit from the handle']]);
        v.readout(() => {
          const e = est; if (!e) return '';
          const f = info.cls === 0 ? 'converges to the origin' : info.cls === -1 ? 'escapes' : `converges to the equilibrium $x=${info.cls}\\cdot2\\pi$`;
          return `${SYS[sysS.value].name}\n$P=${matTeX(e.P, 3)}$, $c^*=${isFinite(e.cs) ? v.fix(e.cs, 3) : '\\infty\\ (\\text{no violation in the window})'}$; ${e.tot ? `${e.ok} of ${e.tot} points on the boundary of the estimate converge to the origin` : ''}\nhandle: ${info.inEst ? 'inside the certified set, so it **must** converge' : 'outside the certified set'}; it ${f}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Phase portraits of planar linear systems',
      statement: String.raw`For $\dot x=Ax$ with $A\in\R^{2\times2}$ let $\tau=\operatorname{tr}A$, $\Delta=\det A$, so the eigenvalues solve $\lambda^2-\tau\lambda+\Delta=0$. The origin is
- a **saddle** if $\Delta<0$ (real eigenvalues of opposite signs);
- a **node** if $\Delta>0$ and $\tau^2\ge4\Delta$ (real eigenvalues of the same sign), stable for $\tau<0$ and unstable for $\tau>0$;
- a **focus** (spiral) if $\Delta>0$ and $\tau^2<4\Delta$ (complex eigenvalues), stable for $\tau<0$ and unstable for $\tau>0$;
- a **centre** if $\tau=0$ and $\Delta>0$ (closed orbits).
On the parabola $\tau^2=4\Delta$ the node is degenerate (equal eigenvalues), and for $\Delta=0$ there is a line of equilibria.`,
      idea: String.raw`The qualitative picture depends only on the eigenvalues (ctrl-3.3), and for a real $2\times2$ matrix these are fixed by $\tau$ and $\Delta$ alone, through the discriminant $\tau^2-4\Delta$ and the signs of the real parts. Crossing the parabola changes real eigenvalues to complex ones (a node turns into a focus without changing stability); crossing $\tau=0$ with $\Delta>0$ changes the sign of the real part; crossing $\Delta=0$ makes an eigenvalue pass through zero (ode-3.8 gives the classification in full).`,
      caption: String.raw`Drag the **gold** point in the trace–determinant plane: the regions are shaded by stability (green stable, red unstable, orange saddle) and the right panel redraws the phase portrait of the companion system $\ddot x=\tau\dot x-\Delta x$, in coordinates $(x,\dot x)$, from 16 starting points run forward and backward in time. Dashed lines are the real eigendirections $(1,\lambda)$. Cross the parabola, the vertical axis and the horizontal axis, and watch exactly which feature of the portrait changes.`,
      deps: ['ctrl-3.3', 'ode-3.8'],
      refs: ['Åström–Murray §5.2'],
      tags: ['phase portrait', 'classification'],
      viz(v) {
        const td = v.stage({ x: [-4, 4], y: [-1.6, 5], axes: true, height: 400, xlabel: 'trace τ', ylabel: 'determinant Δ' });
        const ph = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 400, xlabel: 'x', ylabel: 'ẋ' });
        const hd = td.handle(-1, 2.2, { color: 'gold', r: 8, label: '(τ, Δ)', labelPos: 'ne', constrain: { x: [-3.95, 3.95], y: [-1.5, 4.9] } });
        const cls = (tr, d) => {
          const disc = tr * tr - 4 * d;
          if (d < -0.02) return 'saddle';
          if (Math.abs(d) <= 0.02) return 'line';
          if (Math.abs(tr) < 0.04) return 'centre';
          if (Math.abs(disc) < 0.04) return tr < 0 ? 'degenerate stable node' : 'degenerate unstable node';
          if (disc > 0) return tr < 0 ? 'stable node' : 'unstable node';
          return tr < 0 ? 'stable focus' : 'unstable focus';
        };
        const colOf = (c) => (c === 'saddle' ? 'orange' : c.startsWith('stable') || c.includes('stable node') && !c.includes('unstable') ? 'green' : c === 'centre' ? 'purple' : c === 'line' ? 'muted' : 'red');
        let info = {};
        v.render(() => {
          const tr = hd.x, d = hd.y, c = cls(tr, d), col = colOf(c);
          const pn = v.rgb('panel'), mix = (cl, t) => [pn[0] + (cl[0] - pn[0]) * t, pn[1] + (cl[1] - pn[1]) * t, pn[2] + (cl[2] - pn[2]) * t];
          const G = v.rgb('green'), R = v.rgb('red'), O = v.rgb('orange');
          td.raster((x, y) => (y < 0 ? mix(O, 0.2) : mix(x < 0 ? G : R, 0.17)), { res: 6, key: `td|${v.color('panel')}` });
          td.axes();
          td.path(samples((x) => x * x / 4, -4, 4, 120), { color: 'ink', width: 1.8, dash: [6, 4] });
          td.text('$\\tau^2=4\\Delta$', 2.6, 4.5, { size: 12, color: 'ink' });
          td.path([[0, 0], [0, 5]], { color: 'purple', width: 3 });
          td.text('stable node', -3.7, 0.55, { size: 12, color: 'green' }); td.text('stable focus', -3.7, 3.0, { size: 12, color: 'green' });
          td.text('unstable node', 3.7, 0.55, { size: 12, color: 'red', align: 'right' }); td.text('unstable focus', 3.7, 3.0, { size: 12, color: 'red', align: 'right' });
          td.text('saddle', 0, -0.8, { size: 12, color: 'orange', align: 'center' }); td.text('centres', 0.1, 4.55, { size: 12, color: 'purple' });
          // portrait
          const A = [[0, 1], [-d, tr]], h = 0.03, E = v.M.expm(A.map((r) => r.map((x) => x * h)));
          let Ei = null; try { Ei = v.M.inverse(E); } catch (e) { Ei = null; }
          const step = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
          const run = (M, p0, n) => { const pts = [p0]; let p = p0; for (let i = 0; i < n; i++) { p = step(M, p); if (Math.hypot(p[0], p[1]) > 40) break; pts.push(p); } return pts; };
          const seeds = ring(16, 2.6, 0.2);
          const orbs = seeds.map((p) => run(E, p, 260)).concat(Ei ? seeds.map((p) => run(Ei, p, 260)) : []);
          ph.clip(() => drawOrbits(ph, orbs, { color: col, width: 1.5, alpha: 0.85, at: 0.1 }));
          const disc = tr * tr - 4 * d;
          if (disc >= 0 && d !== 0) for (const l of [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2]) ph.clip(() => ph.line(-3.2, -3.2 * l, 3.2, 3.2 * l, { color: 'muted', width: 1.6, dash: [6, 4] }));
          ph.dot(0, 0, { r: 4, color: 'ink' });
          info = { tr, d, c, ev: eigs(v.M, A) };
        });
        v.readout(() => {
          const { tr, d, c, ev } = info; if (c === undefined) return '';
          return `$\\tau=${v.fix(tr, 2)}$, $\\Delta=${v.fix(d, 2)}$, $\\tau^2-4\\Delta=${v.fix(tr * tr - 4 * d, 2)}$: eigenvalues $\\,${ev.map((z) => cTeX(z, 3)).join(',\; ')}$ — **${c}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Phenomenon',
      name: 'Limit cycles in feedback systems',
      statement: String.raw`A **limit cycle** is an isolated closed orbit of a nonlinear system: a periodic solution that nearby trajectories approach (stable) or leave (unstable) as $t\to\infty$. Linear systems have no isolated periodic orbits (a centre comes in a continuum of orbits whose size is set by the initial state), so a limit cycle is a purely nonlinear **self-sustained oscillation**: its amplitude and period are properties of the system and not of the initial condition.

The prototype is the van der Pol oscillator $\ddot x-\mu(1-x^2)\dot x+x=0$, $\mu>0$: a linear oscillator in feedback with a nonlinear damping that is negative at small amplitude and positive at large amplitude. It has exactly one limit cycle, which is stable, and attracts every trajectory except the origin.`,
      idea: String.raw`For small $|x|$ the damping term $-\mu(1-x^2)\dot x$ feeds energy in, and for $|x|>1$ it removes energy; a trajectory that is too small grows and one that is too large decays, and between them lies a balanced orbit. The linearisation at the origin has eigenvalues $\tfrac\mu2\pm i\sqrt{1-\mu^2/4}$, an unstable focus (or node), which is why the origin repels (ctrl-3.10). Existence of the closed orbit follows from the Poincaré–Bendixson theorem and uniqueness from Liénard's theorem; for small $\mu$ it is nearly the circle of radius $2$ with period $2\pi$, and for large $\mu$ it becomes a relaxation oscillation with period near $(3-2\ln2)\mu$.`,
      caption: String.raw`Two trajectories, one starting **inside** the cycle (near the origin) and one **outside**, are integrated for many periods: both wind onto the same closed curve (**green**, computed from the long-time orbit). Change $\mu$: the cycle stays at $|x|\approx2$ but its shape and period change, from a circle to a lopsided relaxation oscillation. The right panel plots the measured period against $\mu$ with its two asymptotes $2\pi$ (small $\mu$) and $(3-2\ln2)\mu$ (large $\mu$).`,
      deps: ['ctrl-3.10', 'mech-4.19', 'ode-7.1'],
      refs: ['Åström–Murray §5.2'],
      tags: ['limit cycle', 'oscillation'],
      credit: 'B. van der Pol, 1926 (oscillator); limit cycles named by H. Poincaré',
      scope: String.raw`Measured numerically by simulation; the period asymptotes are classical results for $\mu\to0$ and $\mu\to\infty$.`,
      viz(v) {
        const mu = v.slider('nonlinearity $\\mu$', 0.1, 5, 1, { log: true, sig: 2 });
        const ph = v.stage({ x: [-3.4, 3.4], y: [-7, 7], axes: true, height: 400, xlabel: 'x', ylabel: 'ẋ' });
        const pl = v.stage({ x: [0, 5], y: [0, 12], axes: 'box', gutter: true, xlabel: 'μ', ylabel: 'period', height: 400, weight: 0.8 });
        const hi = ph.handle(0.3, 0.2, { color: 'orange', label: 'inside', labelPos: 'ne' });
        const ho = ph.handle(-3, 5, { color: 'gold', label: 'outside', labelPos: 'ne' });
        const F = (m) => (x, y) => [y, m * (1 - x * x) * y - x];
        /** Long run from (2, 0): returns the last cycle as points and its period/amplitudes. */
        const cycle = (m) => {
          const f = F(m), h = Math.min(0.01, 0.02 / Math.max(1, m)), Tt = 20 + 40 * Math.max(1, m), n = Math.round(Tt / h);
          let x = 2, y = 0; const cross = [], pts = [];
          for (let i = 0; i < n; i++) {
            const [nx, ny] = rk2(f, x, y, h);
            if (y > 0 && ny <= 0 && i * h > Tt * 0.4) cross.push({ t: (i + y / (y - ny)) * h, x: x + (nx - x) * (y / (y - ny)) });
            x = nx; y = ny; if (i * h > Tt * 0.4) pts.push([x, y]);
          }
          const k = cross.length - 1, period = k >= 1 ? cross[k].t - cross[k - 1].t : NaN, amp = k >= 0 ? cross[k].x : NaN;
          const cyc = []; let t0 = cross[k - 1] ? cross[k - 1].t : 0; // points between the last two crossings
          let xx = 2, yy = 0; for (let i = 0; i < n; i++) { [xx, yy] = rk2(f, xx, yy, h); const t = (i + 1) * h; if (t >= t0 && t <= t0 + period) cyc.push([xx, yy]); }
          return { period, amp, cyc, ymax: Math.max(...cyc.map((p) => p[1])) };
        };
        let curve = null;
        const ensure = () => { if (!curve) { curve = []; for (let i = 0; i <= 24; i++) { const m = 0.1 * (5 / 0.1) ** (i / 24); curve.push([m, cycle(m).period]); } } return curve; };
        let info = {};
        v.render(() => {
          const m = mu.value, f = F(m), c = cycle(m), per = 6;
          ph.path(c.cyc, { color: 'green', width: 3.4 });
          for (const [h, col] of [[hi, 'orange'], [ho, 'gold']]) {
            const o = flow2(f, h.x, h.y, Math.max(40, 8 * c.period), 0.01, 100), n = o.length;
            ph.clip(() => { ph.path(o.slice(0, Math.floor(n * 0.5)), { color: col, width: 1.8, alpha: 0.9 }); ph.path(o.slice(Math.floor(n * 0.5)), { color: col, width: 1.2, alpha: 0.5 }); });
          }
          ph.dot(0, 0, { r: 4, color: 'ink' });
          const cv = ensure();
          pl.path(samples((x) => 2 * Math.PI, 0, 5, 2), { color: 'muted', width: 1.5, dash: [6, 4] });
          pl.path(samples((x) => (3 - 2 * Math.LN2) * x, 0, 5, 2), { color: 'muted', width: 1.5, dash: [3, 4] });
          pl.path(cv, { color: 'green', width: 2.6 });
          pl.dot(m, c.period, { r: 6, color: 'gold' });
          info = { c, m };
        });
        v.legend([['green', 'limit cycle'], ['orange', 'start inside'], ['gold', 'start outside']]);
        v.readout(() => {
          const { c, m } = info; if (!c) return '';
          return `$\\mu=${v.fix(m, 2)}$: limit cycle amplitude $\\max x=${v.fix(c.amp, 3)}$, $\\max\\dot x=${v.fix(c.ymax, 2)}$, period $T=${v.fix(c.period, 3)}$ (asymptotes: $2\\pi=${v.fix(2 * Math.PI, 2)}$, $(3-2\\ln2)\\mu=${v.fix((3 - 2 * Math.LN2) * m, 2)}$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Phenomenon',
      name: 'Hopf bifurcation as a gain is raised',
      statement: String.raw`Consider a feedback loop with a stable linear plant and a nonlinear static feedback whose strength is set by a gain $k$. As $k$ increases past a critical value $k_c$, a complex-conjugate pair of eigenvalues of the linearisation about the equilibrium crosses the imaginary axis at $\pm i\omega_c$ with non-zero speed. In the **supercritical Hopf bifurcation** the equilibrium loses stability at $k_c$ and a small stable limit cycle is born, with frequency near $\omega_c$ and amplitude growing like $\sqrt{k-k_c}$. (In the subcritical case an unstable cycle collapses onto the equilibrium and the jump to a large oscillation is abrupt.)`,
      idea: String.raw`At $k_c$ the linearisation has purely imaginary eigenvalues, so the linear theory is inconclusive (ctrl-3.4) and the cubic term of the nonlinearity decides the fate. If it reduces the effective gain at larger amplitude, the oscillation saturates at a small amplitude where the effective gain returns to $k_c$: the amplitude squared is proportional to $k-k_c$. This is the **describing-function** argument, accurate near the bifurcation. The eigenvalue crossing itself is ctrl-3.3 applied to the loop, as in Maxwell's analysis of governors (ctrl-1.14), and the limit cycle is the object of ctrl-3.11.`,
      caption: String.raw`The loop is the plant $G(s)=1/(s+1)^3$ (three cascaded lags) with the static feedback $u=-(k\,y-b\,y^3)$, whose effective gain falls with amplitude. Raise $k$: the **left** panel shows the roots of $(s+1)^3+k$ marching to the right and crossing the imaginary axis at $k=8$, $\omega=\sqrt3$; the **middle** panel shows $y(t)$ from a tiny disturbance, which decays, creeps outward, then settles into a steady oscillation; the **right** panel plots the measured oscillation amplitude against $k$ (each point a separate simulation) with the describing-function square-root law as a dashed curve.`,
      deps: ['ctrl-3.11', 'ctrl-3.3', 'ode-8.13', 'ctrl-1.14'],
      refs: ['Åström–Murray §5.5'],
      tags: ['hopf', 'bifurcation'],
      credit: 'E. Hopf, 1942',
      scope: String.raw`The plant and the cubic feedback are an illustrative model chosen so that $k_c=8$ is exact; amplitudes are measured on $y$ by simulation and the square-root law is the first-order describing-function estimate.`,
      viz(v) {
        const T = 200, h = 0.05;
        const kS = v.slider('loop gain $k$', 4, 14, 9.5, { step: 0.05 });
        const bS = v.slider('cubic coefficient $b$', 0.5, 3, 1, { step: 0.05 });
        const sp = v.stage({ x: [-3.2, 2], y: [-3, 3], equal: true, axes: true, height: 340, xlabel: 'Re s', ylabel: 'Im s', title: 'roots of $(s+1)^3+k$' });
        const tm = v.stage({ x: [0, T], y: [-2, 2], axes: 'box', gutter: true, xlabel: 't', ylabel: 'y(t)', height: 340 });
        const bf = v.stage({ x: [4, 14], y: [0, 3], axes: 'box', gutter: true, xlabel: 'gain k', ylabel: 'oscillation amplitude', height: 340 });
        const run = (k, b, Tt, record) => {
          const f = (x) => { const y = x[2], u = -(k * y - b * y * y * y); return [-x[0] + u, -x[1] + x[0], -x[2] + x[1]]; };
          let x = [0, 0, 0.05]; const ys = [], n = Math.round(Tt / h);
          for (let i = 0; i <= n; i++) { if (record) ys.push(x[2]); x = rk4(f, x, i * h, h); if (Math.abs(x[2]) > 50) { x = [0, 0, 50]; } }
          return { ys, x };
        };
        const amp = (k, b) => { const r = run(k, b, 600, true).ys, m = r.slice(-Math.round(40 / h)); return (Math.max(...m) - Math.min(...m)) / 2; };
        let bfKey = '', bfPts = [];
        const ensure = () => { if (bfKey !== String(bS.value)) { bfKey = String(bS.value); bfPts = []; for (let k = 6; k <= 14.01; k += 0.5) bfPts.push([k, amp(k, bS.value)]); } return bfPts; };
        let info = {};
        v.render(() => {
          const k = kS.value, b = bS.value, kc = 8;
          const c = Math.cbrt(k);
          sp.vband(0, 2, { color: 'red', alpha: 0.07 });
          for (const sg of [1, -1]) sp.path(samples((q) => -1 + Math.cbrt(q) * 0.5, 0, 14, 40).map(([q, x]) => [x, sg * Math.cbrt(q) * Math.sqrt(3) / 2]), { color: 'muted', width: 1.6 });
          sp.path(samples((q) => -1 - Math.cbrt(q), 0, 14, 40).map(([q, x]) => [x, 0]), { color: 'muted', width: 1.6 });
          sp.vline(0, { color: 'ink', width: 1.4 });
          const roots = [[-1 - c, 0], [-1 + c / 2, (c * Math.sqrt(3)) / 2], [-1 + c / 2, -(c * Math.sqrt(3)) / 2]];
          for (const r of roots) sp.dot(r[0], r[1], { r: 5, color: r[0] > 0 ? 'red' : 'accent' });
          sp.dot(0, Math.sqrt(3), { r: 4, color: 'gold', hollow: true }); sp.dot(0, -Math.sqrt(3), { r: 4, color: 'gold', hollow: true });
          const r = run(k, b, T, true), ys = r.ys;
          tm.hline(0, { color: 'faint' });
          tm.path(ys.map((y, i) => [i * h, y]).filter((_, i) => i % 4 === 0), { color: 'accent', width: 1.8 });
          const ba = ensure();
          bf.path(samples((q) => Math.sqrt(Math.max(0, (4 * (q - kc)) / (3 * b))), kc, 14, 80), { color: 'muted', width: 1.8, dash: [6, 4] });
          bf.dots(ba, { r: 3.8, color: 'green' });
          bf.vline(kc, { color: 'faint', dash: [3, 4] });
          bf.vline(k, { color: 'gold', width: 1.6 });
          const m = ys.slice(-Math.round(30 / h));
          info = { k, b, roots, a: (Math.max(...m) - Math.min(...m)) / 2, pred: Math.sqrt(Math.max(0, (4 * (k - kc)) / (3 * b))) };
        });
        v.legend([['accent', 'output $y(t)$'], ['green', 'measured amplitude', { dot: true }], ['muted', '$\\sqrt{4(k-8)/3b}$', { dash: true }]]);
        v.readout(() => {
          const { k, b, roots, a, pred } = info; if (!roots) return '';
          const re = roots[1][0];
          return `$k=${v.fix(k, 2)}$: complex roots $\\,${v.fix(re, 3)}\\pm${v.fix(roots[1][1], 3)}i$ (real part ${re > 0 ? '**positive: the equilibrium is unstable**' : 'negative: stable'}; critical gain $k_c=8$, $\\omega_c=\\sqrt3=1.732$)\nmeasured amplitude at the end of the run $=${v.fix(a, 3)}$, square-root law $\\sqrt{4(k-8)/(3b)}=${v.fix(pred, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'BIBO stability of state-space systems',
      statement: String.raw`A system $\dot x=Ax+Bu$, $y=Cx+Du$, started from $x(0)=0$, is **bounded-input bounded-output (BIBO) stable** if every bounded input gives a bounded output. This holds if and only if every pole of the transfer function $G(s)=C(sI-A)^{-1}B+D$ (after cancellations) lies in the open left half-plane, equivalently $\int_0^\infty|h(t)|\,dt<\infty$ for the impulse response $h$.

If $A$ is Hurwitz the system is BIBO stable, but **not conversely**: the poles of $G$ are among the eigenvalues of $A$ and a mode that is **uncontrollable or unobservable** is cancelled in $G$. For a *minimal* realisation (controllable and observable) the poles of $G$ are exactly the eigenvalues of $A$, and BIBO stability is equivalent to internal asymptotic stability.`,
      idea: String.raw`BIBO stability is a statement about the input–output map, whose kernel is the impulse response $h=Ce^{At}B$ (sig-3.6: a convolution system is BIBO stable iff $\int|h|<\infty$). The eigenvalues of $A$ (ctrl-3.3) enter $h$ only through the modes that both the input excites and the output sees; a unstable mode that the output does not see leaves no trace in $G$ (ctrl-2.7 computes $G$ from the state-space data) although the state grows without limit. Any small coupling of that mode into the output makes it visible and the output blows up.`,
      caption: String.raw`The plant has $A=\mathrm{diag}(-1,+1)$, $B=(1,1)^\top$ and output $y=x_1+c\,x_2$. With $c=0$ the unstable mode $x_2$ is **unobservable**: the transfer function is $1/(s+1)$, the output stays bounded for the bounded input you choose, yet the state $x_2$ grows like $e^t$ (note the log axis). Slide $c$ slightly away from $0$: the output now contains $c\,x_2$ and escapes, however small $c$ is. The lesson: an input–output test alone cannot certify internal stability.`,
      deps: ['ctrl-3.3', 'sig-3.6', 'ctrl-2.7'],
      refs: ['Åström–Murray §6.3'],
      tags: ['bibo', 'internal stability'],
      viz(v) {
        const T = 10, N = 1000;
        const inS = v.select('bounded input $u$', [{ value: 'step', label: 'step' }, { value: 'sq', label: 'square wave' }, { value: 'sin', label: 'sine' }], 'step');
        const cS = v.slider('coupling $c$ of $x_2$ into $y$', 0, 0.02, 0, { step: 0.0005 });
        const st = v.stage({ x: [0, T], y: [0.01, 1e5], ylog: true, axes: 'box', gutter: true, xlabel: 't', ylabel: '|state|', height: 360, title: 'internal state' });
        const ot = v.stage({ x: [0, T], y: [-2.5, 2.5], axes: 'box', gutter: true, xlabel: 't', ylabel: 'y(t)', height: 360, title: 'output (input in grey)' });
        const U = (t) => (inS.value === 'step' ? 1 : inS.value === 'sq' ? (Math.floor(t / 1.5) % 2 === 0 ? 1 : -1) : Math.sin(2 * t));
        let info = {};
        v.render(() => {
          const c = cS.value, sol = simulate((x, t) => [-x[0] + U(t), x[1] + U(t)], [0, 0], T, N);
          const x1 = sol.x.map((s) => Math.abs(s[0])), x2 = sol.x.map((s) => Math.abs(s[1])), y = sol.x.map((s) => s[0] + c * s[1]);
          st.path(sol.t.map((t, i) => [t, Math.max(x1[i], 1e-3)]), { color: 'accent', width: 2.4 });
          st.path(sol.t.map((t, i) => [t, Math.max(x2[i], 1e-3)]), { color: 'red', width: 2.4 });
          const ym = Math.max(1.5, Math.min(60, Math.max(...y.map(Math.abs)) * 1.1));
          ot.setView([0, T], [-ym, ym]); ot.hline(0, { color: 'faint' });
          ot.path(samples(U, 0, T, 300), { color: 'muted', width: 1.3, dash: [5, 4] });
          ot.clip(() => ot.path(sol.t.map((t, i) => [t, y[i]]), { color: 'green', width: 2.6 }));
          info = { c, x2: x2[N], y: Math.max(...y.map(Math.abs)), x1: Math.max(...x1) };
        });
        v.legend([['accent', '$|x_1|$ (observed mode)'], ['red', '$|x_2|$ (unstable mode)'], ['green', 'output $y$'], ['muted', 'input', { dash: true }]]);
        v.readout(() => {
          const { c, x2, y, x1 } = info; if (c === undefined) return '';
          const num = [c - 1, 1 + c], G = c === 0 ? '$G(s)=\\dfrac{s-1}{(s+1)(s-1)}=\\dfrac1{s+1}$ (the unstable pole $s=1$ cancels)' : `$G(s)=\\dfrac1{s+1}+\\dfrac{c}{s-1}=\\dfrac{${nTeX(num[1], 4)}\\,s${num[0] < 0 ? '-' : '+'}${nTeX(Math.abs(num[0]), 4)}}{(s+1)(s-1)}$ (a pole at $s=+1$ survives)`;
          return `eigenvalues of $A$: $-1,\\ +1$ (**internally unstable**). ${G}\n$\\max|y|=${v.fix(y, 2)}$ ${c === 0 ? '(bounded: **BIBO stable**)' : '(grows without bound: **not BIBO stable**)'}, while $|x_2(${T})|=${v.fix(x2, 0)}$`;
        });
      },
    },
  ],
};
