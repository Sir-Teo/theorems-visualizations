// Control Theory — Chapter 3: Dynamic behaviour and stability
import {
  clamp, nTeX, matTeX, cTeX, eigs, rk2, flow2, ring, linField, jac2, quad, shapeP, lyap2, drawOrbits, samples, xMark,
} from './ch03.shared.js';

const rep = (x, d = 2) => (Math.abs(x) < 5e-3 ? '0' : String(+x.toFixed(d)).replace('-', '−'));
/** Frobenius norm of a matrix. */
const fro = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((q, x) => q + x * x, 0), 0));

export default {
  collection: 'ctrl',
  chapter: 3,
  title: 'Dynamic behaviour and stability',
  summary: String.raw`Before designing controllers we need to know when a system is stable. For linear systems the answer lies in the eigenvalues of the dynamics matrix, through the matrix exponential; for nonlinear ones, linearisation decides locally (when it is conclusive), and Lyapunov's energy-like functions give certificates that need no solution of the equations at all. The chapter builds the definitions (equilibrium, Lyapunov stability, regions of attraction), the two methods of Lyapunov, the Lyapunov equation, LaSalle's principle for the common case where the energy only decreases weakly, the classification of planar linear phase portraits, and then the phenomena that feedback adds: limit cycles, their birth in a Hopf bifurcation as a gain is raised, and the difference between internal and input–output stability.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Equilibria and Lyapunov stability',
      statement: String.raw`For $\dot x=f(x)$ a point $x_e$ with $f(x_e)=0$ is an **equilibrium**. It is **(Lyapunov) stable** if for every $\varepsilon>0$ there is a $\delta>0$ such that $|x(0)-x_e|<\delta$ implies $|x(t)-x_e|<\varepsilon$ for **all** $t\ge0$. It is **asymptotically stable** if it is stable and, in addition, solutions starting close enough converge to it, $x(t)\to x_e$. An equilibrium that is not stable is **unstable**.

The order of the quantifiers is the point: the tolerance $\varepsilon$ is chosen first, by whoever cares about the behaviour, and the system must answer with a starting neighbourhood $\delta$.`,
      idea: String.raw`Stability is continuity of the solution map at the equilibrium, uniformly in time: small perturbations of the initial state produce small perturbations of the whole future. It is weaker than convergence (a frictionless pendulum is stable but never settles) and independent of it (solutions can converge while first making a large excursion, which violates stability). Existence and continuous dependence of solutions (ode-5.6 names the notions for ordinary differential equations) make the definition meaningful, and the state-space setting of ctrl-2.1 supplies the picture: a point in the plane and the ball around it.`,
      caption: String.raw`Pick a system and drag the tolerance $\varepsilon$ (the **blue** disc). The tool searches, by simulation over 25 s from many starting points, for the largest disc $\delta$ (**orange**) such that every start inside it stays inside the blue disc; the orange curves are trajectories starting on its rim. The **gold** handle is any initial state, with $|x(t)|$ plotted below. Switch to the upright pendulum or the unstable focus and no useful $\delta$ exists. With the undamped pendulum and $\varepsilon$ near $\pi$ the largest $\delta$ collapses, because the blue disc then reaches the separatrix.`,
      deps: ['ctrl-2.1', 'mech-3.12', 'ode-5.6'],
      refs: ['Åström–Murray §5.3'],
      tags: ['stability', 'equilibrium'],
      credit: 'A. M. Lyapunov, 1892',
      scope: String.raw`The search samples 36 directions and radii down to $2\cdot10^{-4}\varepsilon$ over a horizon of 25 s: it illustrates the definition and does not prove it.`,
      viz(v) {
        const H = 25, hh = 0.05;
        const SYS = {
          damped: { f: (x, y) => [y, -Math.sin(x) - 0.3 * y], t: 'hanging pendulum with friction' },
          undamped: { f: (x, y) => [y, -Math.sin(x)], t: 'hanging pendulum, no friction' },
          upright: { f: (x, y) => [y, Math.sin(x) - 0.3 * y], t: 'upright pendulum' },
          spiral: { f: (x, y) => [0.2 * x + y, -x + 0.2 * y], t: 'unstable focus' },
        };
        const sysS = v.select('system', [{ value: 'damped', label: 'damped, hanging' }, { value: 'undamped', label: 'undamped' }, { value: 'upright', label: 'upright' }, { value: 'spiral', label: 'unstable focus' }], 'damped');
        const eS = v.slider('tolerance $\\varepsilon$', 0.2, 3, 1, { step: 0.05 });
        const ph = v.stage({ x: [-4, 4], y: [-3.4, 3.4], equal: true, axes: true, height: 380, xlabel: 'φ', ylabel: 'φ̇' });
        const tm = v.stage({ x: [0, H], y: [0, 3.4], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'distance |x(t)|', height: 380 });
        const h0 = ph.handle(0.45, 0.3, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        const stays = (f, x0, y0, eps) => {
          let x = x0, y = y0; const n = Math.round(H / hh);
          for (let i = 0; i < n; i++) { [x, y] = rk2(f, x, y, hh); if (!(x * x + y * y <= eps * eps)) return false; }
          return true;
        };
        const FL = eS.value * 0.72 ** 26;
        let key = '', res = null;
        const search = () => {
          const k = sysS.value + '|' + eS.value;
          if (k !== key) {
            key = k; const f = SYS[sysS.value].f, eps = eS.value; let delta = Infinity;
            for (let d = 0; d < 36; d++) {
              const a = (2 * Math.PI * d) / 36 + 0.05; let found = null;
              for (let j = 0; j <= 26; j++) {
                const r = eps * 0.72 ** j;
                if (stays(f, r * Math.cos(a), r * Math.sin(a), eps) && stays(f, 0.72 * r * Math.cos(a), 0.72 * r * Math.sin(a), eps)) { found = r; break; }
              }
              delta = Math.min(delta, found ?? eps * 0.72 ** 26);
            }
            res = { delta, none: delta <= eps * 0.72 ** 26 * 1.001, orbits: ring(14, delta, 0.05).map(([x, y]) => flow2(f, x, y, H, hh, 50)) };
          }
          return res;
        };
        v.render(() => {
          const f = SYS[sysS.value].f, eps = eS.value, r = search();
          ph.circle(0, 0, eps, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 2.2 });
          ph.clip(() => {
            if (!r.none) ph.circle(0, 0, r.delta, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 2.2 });
            drawOrbits(ph, r.orbits, { color: 'orange', width: 1.4, alpha: 0.85, arrows: false });
          });
          const o = flow2(f, h0.x, h0.y, H, hh, 50), inside = Math.hypot(h0.x, h0.y) < r.delta;
          ph.clip(() => ph.path(o, { color: 'gold', width: 2.4 }));
          ph.dot(0, 0, { r: 4, color: 'ink' });
          tm.hline(eps, { color: 'accent', width: 2, dash: [6, 4] });
          tm.path(o.map((p, i) => [(i * H) / (o.length - 1 || 1), Math.hypot(p[0], p[1])]), { color: 'gold', width: 2.4 });
          tm.text('ε', 0.4, eps, { size: 13, color: 'accent', baseline: 'bottom', weight: 700 });
          const out = o.find((p) => Math.hypot(p[0], p[1]) > eps);
          if (out) { const i = o.indexOf(out); tm.dot((i * H) / (o.length - 1), Math.hypot(out[0], out[1]), { r: 5, color: 'red' }); }
          res.inside = inside; res.exits = !!out;
        });
        v.legend([['accent', 'tolerance ball $|x|<\\varepsilon$'], ['orange', 'start ball $|x|<\\delta$ and orbits from its rim'], ['gold', 'orbit from the handle']]);
        v.readout(() => {
          const r = res; if (!r) return '';
          const d = r.none ? `\\text{no }\\delta>${v.sci(FL, 2)}\\text{ works}` : `\\delta\\approx${v.fix(r.delta, 3)}`;
          return `${SYS[sysS.value].t}: for $\\varepsilon=${v.fix(eS.value, 2)}$, ${d}` + (r.none ? ' (unstable, or $\\varepsilon$ too large)' : '') + '\n' +
            `handle: $|x(0)|=${v.fix(Math.hypot(h0.x, h0.y), 3)}$ is ${r.inside ? '**inside** the $\\delta$-ball, so the orbit must stay in the $\\varepsilon$-ball' : 'outside the $\\delta$-ball'}; the orbit ${r.exits ? '**leaves** the $\\varepsilon$-ball' : 'stays in the $\\varepsilon$-ball'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'The matrix exponential solves ẋ = Ax',
      statement: String.raw`For a constant square matrix $A$ the series $e^{At}=\sum_{k\ge0}(tA)^k/k!$ converges for every real $t$, uniformly on bounded intervals, and $x(t)=e^{At}x_0$ is the unique solution of $\dot x=Ax$ with $x(0)=x_0$. With an input, $\dot x=Ax+Bu$ is solved by $x(t)=e^{At}x_0+\int_0^te^{A(t-s)}Bu(s)\,ds$. The matrix $e^{At}$ satisfies $e^{A(t+s)}=e^{At}e^{As}$; if $A=T\Lambda T^{-1}$ with $\Lambda$ diagonal it equals $Te^{\Lambda t}T^{-1}$, and a Jordan block of size two with eigenvalue $\lambda$ contributes $e^{\lambda t}\begin{pmatrix}1&t\\0&1\end{pmatrix}$, with the **secular** term $te^{\lambda t}$.`,
      idea: String.raw`Differentiate the series term by term (justified by its uniform convergence, since $\|(tA)^k/k!\|\le(\|A\|t)^k/k!$) to get $\frac d{dt}e^{At}=Ae^{At}$ and $e^{A0}=I$; uniqueness of the solution of a linear equation (ode-3.3 gives the flow) then identifies it. In an eigenbasis the series acts coordinatewise and sums to scalar exponentials, which is why eigenvalues govern everything. A defective $A=\lambda I+N$ with $N^2=0$ gives the series $e^{\lambda t}(I+tN)$ exactly, so the linear growth factor $t$ is the finite remainder of the Jordan structure of ladr-8.46.`,
      caption: String.raw`The dotted unit circle and its lattice are mapped by the partial sum $S_N(t)=\sum_{k\le N}(tA)^k/k!$ (**blue**) and by the true $e^{At}$ (**green**). Raise $N$: the blue image closes in on the green one, faster for small $t$. The **gold** handle is an initial state; the right panel plots its first coordinate over time for the truth and for the truncated series, which is always a polynomial and so eventually fails. Choose the Jordan block to see $te^{\lambda t}$: the lattice is sheared, with the shear growing in time.`,
      deps: ['ctrl-2.1', 'ladr-8.46', 'ode-3.3'],
      refs: ['Åström–Murray §6.2'],
      tags: ['matrix exponential', 'linear systems'],
      viz(v) {
        const Ms = {
          rot: [[0, 1.5], [-1.5, 0]],
          spiral: [[-0.3, 1.6], [-1.6, -0.3]],
          saddle: [[0.6, 0.5], [0.5, -0.9]],
          jordan: [[-0.5, 1], [0, -0.5]],
        };
        const aS = v.select('matrix $A$', [{ value: 'rot', label: 'rotation' }, { value: 'spiral', label: 'spiral' }, { value: 'saddle', label: 'saddle' }, { value: 'jordan', label: 'Jordan block' }], 'spiral');
        const nS = v.slider('partial-sum order $N$', 0, 16, 3, { int: true });
        const tS = v.slider('time $t$', 0, 3, 1.5, { step: 0.01 });
        const pl = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: true, height: 380, xlabel: 'x₁', ylabel: 'x₂' });
        const tm = v.stage({ x: [0, 4], y: [-2.5, 2.5], axes: 'box', gutter: true, xlabel: 't', ylabel: 'x₁(t)', height: 380 });
        const h0 = pl.handle(1, 0.4, { color: 'gold', label: 'x₀', labelPos: 'ne' });
        const lat = [], circ = [];
        for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j <= 9) lat.push([i / 3, j / 3]);
        for (let k = 0; k <= 72; k++) circ.push([Math.cos((k / 72) * 2 * Math.PI), Math.sin((k / 72) * 2 * Math.PI)]);
        const partial = (A, t, N) => {
          const I = v.M.identity(2); let S = I.map((r) => r.slice()), P = I;
          const tA = A.map((r) => r.map((x) => x * t));
          for (let k = 1; k <= N; k++) { P = v.M.matMul(P, tA).map((r) => r.map((x) => x / k)); S = S.map((r, i) => r.map((x, j) => x + P[i][j])); }
          return S;
        };
        const app = (E, p) => [E[0][0] * p[0] + E[0][1] * p[1], E[1][0] * p[0] + E[1][1] * p[1]];
        let info = {};
        v.render(() => {
          const A = Ms[aS.value], t = tS.value, N = nS.value;
          const E = v.M.expm(A.map((r) => r.map((x) => x * t))), S = partial(A, t, N);
          pl.path(circ, { color: 'faint', width: 1.4, dash: [3, 4] });
          pl.dots(lat, { r: 2.2, color: 'faint' });
          pl.clip(() => {
            pl.path(circ.map((p) => app(E, p)), { color: 'green', width: 2.4 });
            pl.dots(lat.map((p) => app(E, p)), { r: 3.3, color: 'green' });
            pl.path(circ.map((p) => app(S, p)), { color: 'accent', width: 2 });
            pl.dots(lat.map((p) => app(S, p)), { r: 2.2, color: 'accent' });
          });
          const x0 = [h0.x, h0.y], a = app(E, x0), b = app(S, x0);
          pl.dot(a[0], a[1], { r: 5.5, color: 'green' });
          pl.dot(b[0], b[1], { r: 4, color: 'accent' });
          tm.hline(0, { color: 'faint' });
          tm.clip(() => {
            tm.path(samples((s) => app(v.M.expm(A.map((r) => r.map((x) => x * s))), x0)[0], 0, 4, 120), { color: 'green', width: 2.6 });
            tm.path(samples((s) => app(partial(A, s, N), x0)[0], 0, 4, 160), { color: 'accent', width: 2 });
          });
          tm.vline(t, { color: 'gold', width: 1.4 });
          const nt = fro(A) * t;
          info = { err: fro(E.map((r, i) => r.map((x, j) => x - S[i][j]))), bound: (nt ** (N + 1) / v.M.factorial(N + 1)) * Math.exp(nt), E };
        });
        v.legend([['green', 'true $e^{At}$'], ['accent', 'partial sum $S_N(t)$'], ['gold', 'initial state / time cursor']]);
        v.readout(() => {
          const A = Ms[aS.value], E = info.E, extra = aS.value === 'jordan'
            ? `\nJordan block, $\\lambda=-0.5$: $e^{At}=e^{\\lambda t}\\begin{pmatrix}1&t\\\\0&1\\end{pmatrix}$, so the shear entry is $te^{\\lambda t}=${v.fix(tS.value * Math.exp(-0.5 * tS.value), 4)}$ and the computed one is $${v.fix(E[0][1], 4)}$` : '';
          return `$A=${matTeX(A, 3)}$, $t=${v.fix(tS.value, 2)}$: $\\|e^{At}-S_{${nS.value}}\\|_F=${v.sci(info.err, 2)}$, below the tail bound $\\frac{(\\|A\\|t)^{N+1}}{(N+1)!}e^{\\|A\\|t}=${v.sci(info.bound, 2)}$` + extra;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Linear stability iff all eigenvalues have negative real part',
      statement: String.raw`For $\dot x=Ax$ with $A\in\R^{n\times n}$:
(a) the origin is asymptotically stable (and then every solution decays exponentially, $|x(t)|\le Ce^{-\alpha t}|x(0)|$ for some $C,\alpha>0$) **if and only if** every eigenvalue of $A$ has negative real part;
(b) it is unstable if some eigenvalue has positive real part;
(c) if the largest real part is $0$, the origin is stable exactly when every eigenvalue on the imaginary axis is semisimple (its Jordan blocks are $1\times1$), and otherwise unstable, with solutions growing polynomially.`,
      idea: String.raw`Solutions are $e^{At}x_0$ (ctrl-3.2), and in Jordan form every entry of $e^{At}$ is a combination of terms $t^je^{\lambda t}$ with $\lambda$ an eigenvalue (ladr-5.5) and $j$ smaller than the block size. Such a term decays when $\operatorname{Re}\lambda<0$, because the exponential beats any power, and grows when $\operatorname{Re}\lambda>0$. On the imaginary axis $|e^{\lambda t}|=1$, so only a power $t^j$ with $j\ge1$, which exists exactly for a non-trivial Jordan block, can make the solution grow. The same argument for the scalar linear equation is ode-3.9.`,
      caption: String.raw`The **left** panel is the complex plane with the eigenvalues of $A$ (drag the **red** crosses; choose a complex-conjugate pair or two real ones). The **middle** panel shows the phase portrait of $\dot x=Ax$ in real coordinates, with a **gold** trajectory from the draggable initial state. The **right** panel plots $|x(t)|$ against the envelope $e^{\sigma t}|x(0)|$ for the rightmost real part $\sigma$. Drag across the imaginary axis: spirals in, circles forever on the axis, spirals out. The $2\times2$ portrait uses a fixed skew change of basis so the eigendirections are not axis-parallel.`,
      deps: ['ctrl-3.2', 'ladr-5.5', 'ode-3.9'],
      refs: ['Åström–Murray §5.3', 'Franklin–Powell §3.6'],
      tags: ['stability', 'eigenvalues'],
      viz(v) {
        const T = 10;
        const mS = v.select('eigenvalues', [{ value: 'c', label: 'complex pair' }, { value: 'r', label: 'two real' }], 'c');
        const sp = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: true, height: 340, xlabel: 'Re λ', ylabel: 'Im λ', title: 'eigenvalues of $A$' });
        const ph = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 340, title: 'phase portrait' });
        const tm = v.stage({ x: [0, T], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 't', ylabel: '|x(t)|', height: 340 });
        const hc = sp.handle(-0.4, 1.4, { color: 'red', label: 'λ', labelPos: 'ne' });
        const r1 = sp.handle(-0.8, 0, { color: 'red', label: 'λ₁', labelPos: 'n', constrain: 'x' });
        const r2 = sp.handle(0.3, 0, { color: 'orange', label: 'λ₂', labelPos: 'n', constrain: 'x' });
        const x0 = ph.handle(1.6, 1.2, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        hc.onDrag = () => { if (hc.y < 0.12) hc.set(hc.x, 0.12); };
        const Tm = [[1, 0.6], [0.25, 1]], Ti = v.M.inverse(Tm);
        const build = () => {
          const J = mS.value === 'c' ? [[hc.x, -hc.y], [hc.y, hc.x]] : [[r1.x, 0], [0, r2.x]];
          return v.M.matMul(v.M.matMul(Tm, J), Ti);
        };
        let info = {};
        v.render(() => {
          const c = mS.value === 'c';
          hc.visible = c; r1.visible = !c; r2.visible = !c;
          const A = build(), f = linField(A), ev = c ? [[hc.x, hc.y], [hc.x, -hc.y]] : [[r1.x, 0], [r2.x, 0]];
          sp.vband(0, 2.5, { color: 'red', alpha: 0.06 }); sp.vband(-2.5, 0, { color: 'green', alpha: 0.06 });
          sp.vline(0, { color: 'ink', width: 1.2 });
          sp.text('stable half-plane', -2.4, 2.3, { size: 12, color: 'green' }); sp.text('unstable', 2.4, 2.3, { size: 12, color: 'red', align: 'right' });
          if (c) xMark(sp, hc.x, -hc.y, { color: 'red' });
          const E = v.M.expm(A.map((r) => r.map((x) => x * 0.05)));
          const orb = (p, n) => { const pts = [p]; let q = p; for (let i = 0; i < n; i++) { q = [E[0][0] * q[0] + E[0][1] * q[1], E[1][0] * q[0] + E[1][1] * q[1]]; if (Math.hypot(q[0], q[1]) > 40) break; pts.push(q); } return pts; };
          const starts = ring(10, 2.2, 0.3).concat(ring(10, 1.0, 0.6));
          ph.clip(() => drawOrbits(ph, starts.map((p) => orb(p, 220)), { color: 'accent', width: 1.2, alpha: 0.55 }));
          const mine = orb([x0.x, x0.y], T / 0.05);
          ph.clip(() => ph.path(mine, { color: 'gold', width: 2.6 }));
          ph.dot(0, 0, { r: 3.5, color: 'ink' });
          const sg = Math.max(ev[0][0], ev[1][0]), n0 = Math.hypot(x0.x, x0.y);
          tm.path(mine.map((p, i) => [i * 0.05, Math.hypot(p[0], p[1])]), { color: 'gold', width: 2.6 });
          tm.path(samples((t) => n0 * Math.exp(sg * t), 0, T, 100).map(([a, b]) => [a, Math.min(b, 50)]), { color: 'muted', width: 1.6, dash: [6, 4] });
          tm.clip(() => tm.hline(0, { color: 'faint' }));
          info = { ev, sg, f, end: Math.hypot(...mine[mine.length - 1]), n0 };
        });
        v.legend([['gold', 'trajectory'], ['muted', 'envelope $e^{\\sigma t}|x(0)|$', { dash: true }], ['accent', 'other trajectories']]);
        v.readout(() => {
          const { ev, sg, end, n0 } = info; if (!ev) return '';
          const verdict = sg < -1e-6 ? '**asymptotically stable**: all real parts negative' : sg > 1e-6 ? '**unstable**: a real part is positive' : '**borderline**: the largest real part is 0 (and these eigenvalues are semisimple, so solutions stay bounded)';
          return `$\\lambda=${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$, $\\sigma=\\max\\operatorname{Re}\\lambda=${v.fix(sg, 3)}$: ${verdict}\n$|x(${T})|=${v.fix(end, 3)}$ against $|x(0)|=${v.fix(n0, 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Stability by linearisation (Lyapunov’s indirect method)',
      statement: String.raw`Let $f$ be continuously differentiable with $f(x_e)=0$, and let $A=\partial f/\partial x(x_e)$.
(a) If every eigenvalue of $A$ has negative real part, then $x_e$ is an asymptotically stable equilibrium of $\dot x=f(x)$.
(b) If some eigenvalue has positive real part, $x_e$ is unstable.
(c) If $A$ has eigenvalues on the imaginary axis and none in the right half-plane, the linearisation **does not decide**: the nonlinear terms can make $x_e$ stable or unstable.
More precisely, when no eigenvalue is on the imaginary axis ($x_e$ is *hyperbolic*) the nonlinear phase portrait near $x_e$ is a continuous deformation of the linear one.`,
      idea: String.raw`Write $f(x)=A(x-x_e)+g(x)$ with $|g(x)|=o(|x-x_e|)$ (this is ctrl-2.2). If $A$ is Hurwitz there is a quadratic Lyapunov function $V=x^\top Px$ (ctrl-3.7), and its derivative along the nonlinear system is $-|x|^2+O(|x|^3)$, which is still negative in a small ball; the direct method concludes (ode-6.3 is the same statement for the general theory). A positive real part is handled with the mirror-image argument. When the real part is $0$ the linear term is not strong enough to dominate $g$, so the sign of the cubic terms decides.`,
      caption: String.raw`The **left** panel shows the nonlinear system, the **right** panel its linearisation, in the same window of half-width $\rho$. Shrink $\rho$ with the slider: for the saddle and the focus the two portraits become indistinguishable. Choose the *centre* system $\dot x=y+\mu x r^2,\ \dot y=-x+\mu y r^2$ ($r^2=x^2+y^2$): its linearisation is the same circling centre for every $\mu$, but the nonlinear orbits spiral in for $\mu<0$ and out for $\mu>0$ (slowly at small $\rho$), so the linearisation cannot decide.`,
      deps: ['ctrl-3.3', 'ctrl-2.2', 'ode-6.3'],
      refs: ['Åström–Murray §5.3'],
      tags: ['linearisation', 'stability'],
      credit: 'A. M. Lyapunov, 1892',
      viz(v) {
        const mu = v.slider('cubic coefficient $\\mu$ (centre case)', -0.5, 0.5, -0.25, { step: 0.01 });
        const sysS = v.select('system', [{ value: 'saddle', label: 'saddle' }, { value: 'focus', label: 'stable focus' }, { value: 'centre', label: 'centre' }], 'saddle');
        const rho = v.slider('window half-width $\\rho$', 0.05, 3, 2, { log: true, sig: 2 });
        const a = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 380, title: 'nonlinear system' });
        const b = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 380, title: 'its linearisation $\\dot x=Ax$' });
        const F = {
          saddle: (x, y) => [x + y * y, -2 * y + x * x],
          focus: (x, y) => [y, -x - 0.5 * y + x * x * x * 0.8 - 0.6 * x * x],
          centre: (x, y) => { const r2 = x * x + y * y; return [y + mu.value * x * r2, -x + mu.value * y * r2]; },
        };
                let info = {};
        v.render(() => {
          const r = rho.value, f = F[sysS.value], A = jac2(f, 0, 0), g = linField(A);
          mu.el.hidden = sysS.value !== 'centre';
          a.setView([-r, r], [-r, r]); b.setView([-r, r], [-r, r]);
          const Tn = sysS.value === 'centre' ? 80 : 30, hh = 0.04;
          const starts = ring(12, 0.9 * r, 0.2).concat(ring(8, 0.45 * r, 0.5));
          if (sysS.value === 'saddle') starts.push([0.9 * r, 0], [-0.9 * r, 0], [0, 0.9 * r], [0, -0.9 * r]);
          for (const [s, ff] of [[a, f], [b, g]]) {
            const orb = starts.map(([x, y]) => flow2(ff, x, y, Tn, hh, 40 * r + 1).concat(flow2(ff, x, y, -Tn, hh, 40 * r + 1).slice(1).reverse().slice(0, 0)));
            s.clip(() => drawOrbits(s, orb, { color: s === a ? 'accent' : 'orange', width: 1.4, alpha: 0.75, at: 0.12 }));
            s.dot(0, 0, { r: 4, color: 'ink' });
          }
          let worst = 0;
          for (const [x, y] of ring(32, r)) { const p = f(x, y), q = g(x, y), d = Math.hypot(p[0] - q[0], p[1] - q[1]), m = Math.hypot(q[0], q[1]); if (m > 0) worst = Math.max(worst, d / m); }
          info = { A, ev: eigs(v.M, A), worst };
        });
        v.legend([['accent', 'nonlinear orbits'], ['orange', 'linear orbits']]);
        v.readout(() => {
          const { A, ev, worst } = info; if (!A) return '';
          const sg = Math.max(ev[0][0], ev[1][0]), eps = 1e-3;
          const verdict = Math.abs(ev[0][0]) < eps || Math.abs(ev[1][0]) < eps ? '**inconclusive**: an eigenvalue sits on the imaginary axis' : sg < 0 ? '**asymptotically stable** (all real parts negative)' : '**unstable** (a positive real part)';
          return `$A=${matTeX(A, 2)}$, eigenvalues $${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$: ${verdict}\nrelative mismatch of the two vector fields on the window boundary, $\\max|f-Ax|/|Ax|=${v.fix(worst, 3)}$ (it shrinks like $\\rho$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Lyapunov functions',
      statement: String.raw`Let $x_e=0$ be an equilibrium of $\dot x=f(x)$ and $D$ a neighbourhood of it. A continuously differentiable function $V:D\to\R$ is a **Lyapunov function** (for stability) if
(i) $V(0)=0$ and $V(x)>0$ for $x\ne0$ ($V$ is positive definite), and
(ii) its derivative along solutions, $\dot V(x)=\nabla V(x)\cdot f(x)$, satisfies $\dot V(x)\le0$ on $D$.
It is a **strict** Lyapunov function if $\dot V<0$ for $x\ne0$. The point is that $\dot V$ is computed from $f$ alone, without solving the differential equation.`,
      idea: String.raw`$V$ plays the role of a generalised energy: the level sets $\{V=c\}$ are closed curves around the origin, and $\dot V\le0$ says that the vector field never points out of any of them. The notion generalises the total energy of a mechanical system, whose derivative is minus the dissipation (ode-5.8 treats the same notion for differential equations, and ctrl-3.1 supplies the stability being certified). Finding $V$ is the art; checking the sign of $\dot V$ is mechanical.`,
      caption: String.raw`The system is a damped pendulum, $\dot\varphi=\omega,\ \dot\omega=-\sin\varphi-0.4\omega$. Choose a candidate $V$: the pendulum's **energy**, or a **quadratic** $x^\top Px$ whose ellipses you rotate ($\theta$) and stretch ($r$). The curves are level sets of $V$. Arrows are the direction of motion, **green** where $\dot V<0$ (the flow crosses the level sets inward) and **red** where $\dot V>0$ (outward); the shading repeats this. The slider chooses a level $c$; the readout reports whether $\dot V\le0$ holds on the whole set $\{V\le c\}$, which is what a certificate needs.`,
      deps: ['ctrl-3.1', 'ode-5.8'],
      refs: ['Åström–Murray §5.4'],
      tags: ['lyapunov', 'certificate'],
      credit: 'A. M. Lyapunov, 1892',
      viz(v) {
        const cD = 0.4;
        const candS = v.select('candidate $V$', [{ value: 'energy', label: 'energy' }, { value: 'quad', label: 'quadratic' }], 'quad');
        const thS = v.slider('ellipse angle $\\theta$', -1.57, 1.57, 0.5, { step: 0.01 });
        const rS = v.slider('axis ratio $r$', 0.1, 6, 1, { log: true, sig: 2 });
        const cS = v.slider('level $c$', 0.1, 4, 1, { step: 0.05 });
        const ph = v.stage({ x: [-3.6, 3.6], y: [-3, 3], equal: true, axes: true, height: 460, xlabel: 'φ', ylabel: 'ω' });
        const f = (x, y) => [y, -Math.sin(x) - cD * y];
        const Vf = () => {
          if (candS.value === 'energy') return { V: (x, y) => 0.5 * y * y + 1 - Math.cos(x), dV: (x, y) => -cD * y * y };
          const P = shapeP(thS.value, rS.value);
          return { V: (x, y) => quad(P, x, y), dV: (x, y) => { const q = f(x, y); return 2 * ((P[0][0] * x + P[0][1] * y) * q[0] + (P[1][0] * x + P[1][1] * y) * q[1]); } };
        };
        let info = {};
        v.render(() => {
          const { V, dV } = Vf(), c = cS.value;
          thS.el.hidden = rS.el.hidden = candS.value === 'energy';
          const tintG = v.rgb('green'), tintR = v.rgb('red'), pn = v.rgb('panel'), mix = (cl, t) => [pn[0] + (cl[0] - pn[0]) * t, pn[1] + (cl[1] - pn[1]) * t, pn[2] + (cl[2] - pn[2]) * t];
          ph.raster((x, y) => { const d = dV(x, y); if (Math.abs(d) < 1e-9) return null; return mix(d < 0 ? tintG : tintR, 0.14); }, { res: 4, key: `${candS.value}|${thS.value}|${rS.value}|${v.color('panel')}` });
          ph.contour(V, [0.1, 0.25, 0.5, 1, 2, 4, 8, 16].filter((l) => Math.abs(l - c) > 0.02), { color: 'muted', width: 1, alpha: 0.8, res: 160 });
          ph.contour(V, [c], { color: 'accent', width: 3, res: 220 });
          const sub = (x, y) => V(x, y) <= c;
          for (let i = -8; i <= 8; i++) for (let j = -6; j <= 6; j++) {
            const x = i * 0.42, y = j * 0.46, q = f(x, y), m = Math.hypot(q[0], q[1]) || 1, L = 0.17, d = dV(x, y);
            ph.arrow(x - (L * q[0]) / m, y - (L * q[1]) / m, x + (L * q[0]) / m, y + (L * q[1]) / m, { color: d < 0 ? 'green' : 'red', width: sub(x, y) ? 2 : 1.2, head: 5, alpha: sub(x, y) ? 1 : 0.55 });
          }
          ph.dot(0, 0, { r: 4, color: 'ink' });
          let worst = -Infinity, bad = 0, tot = 0;
          for (let i = -80; i <= 80; i++) for (let j = -64; j <= 64; j++) {
            const x = i * 0.045, y = j * 0.047; if ((i === 0 && j === 0) || V(x, y) > c) continue;
            tot++; const d = dV(x, y); if (d > 1e-9) bad++; worst = Math.max(worst, d);
          }
          let posdef = true; for (let k = 0; k < 40; k++) { const a = (k / 40) * 2 * Math.PI; if (V(0.3 * Math.cos(a), 0.3 * Math.sin(a)) <= 0) posdef = false; }
          info = { worst, bad, tot, posdef };
        });
        v.legend([['accent', 'level set $V=c$'], ['green', '$\\dot V<0$ (inward)'], ['red', '$\\dot V>0$ (outward)']]);
        v.readout(() => {
          const { worst, bad, tot, posdef } = info; if (tot === undefined) return '';
          const ok = bad === 0;
          return `$V$ is ${posdef ? 'positive near 0' : '**not** positive near 0'}; on $\\{V\\le${v.fix(cS.value, 2)}\\}$: $\\dot V>0$ at ${bad} of ${tot} sample points, largest $\\dot V=${v.fix(worst, 3)}$\n` +
            (ok ? '**certificate holds on this set**: $\\dot V\\le0$ everywhere inside' : '**not a certificate on this set**: the flow leaves the level curves somewhere (the pendulum itself is not affected; only this $V$)');
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Lyapunov’s direct method',
      statement: String.raw`Let $0$ be an equilibrium of $\dot x=f(x)$ and $V$ a $C^1$ function on a neighbourhood $D$ of $0$, positive definite.
(a) If $\dot V\le0$ on $D$, the origin is stable.
(b) If $\dot V<0$ on $D\setminus\{0\}$, the origin is asymptotically stable; moreover every sublevel set $\Omega_c=\{V\le c\}\subset D$ that is bounded is positively invariant and lies in the region of attraction.
(c) If $D=\R^n$, $\dot V<0$ away from $0$ and $V$ is radially unbounded ($V\to\infty$ as $|x|\to\infty$), the origin is globally asymptotically stable.`,
      idea: String.raw`If $\dot V\le0$ a trajectory can never move to a higher level set, and the level sets $\{V\le c\}$ shrink to the origin as $c\to0$ (this uses the positive definiteness and the compactness of the spheres, via ode-5.9). Given $\varepsilon$, pick a level $c$ below the minimum of $V$ on $|x|=\varepsilon$ and a $\delta$ with $V<c$ on $|x|<\delta$: this is exactly the $\delta$ that ctrl-3.1 asks for. Under $\dot V<0$ the value $V(x(t))$ decreases to a limit that must be zero, because a positive limit would leave the trajectory in a compact annulus where $\dot V\le-m<0$.`,
      caption: String.raw`Drag the **gold** initial state. The ellipse is the level set of $V=x^\top Px$ through it, the **orange** curve the trajectory, and the lower plot shows $V(x(t))$, coloured **green** where it falls and **red** where it rises. Rotate and stretch $V$ with $\theta$ and $r$: for the linear system with a good shape $\dot V<0$ everywhere and $V(t)$ falls monotonically; with a bad shape the certificate fails (the readout says where) and $V(t)$ rises in places, **although the true trajectory is the same and still converges**. Failure of one $V$ never says anything about stability.`,
      deps: ['ctrl-3.5', 'ode-5.9'],
      refs: ['Åström–Murray §5.4', 'Franklin–Powell §9.5'],
      tags: ['lyapunov', 'stability'],
      credit: 'A. M. Lyapunov, 1892',
      scope: String.raw`The sublevel-set test samples the set on a polar grid, 90 directions and 24 radii, so it is numerical evidence.`,
      viz(v) {
        const T = 14, N = 700;
        const sysS = v.select('system', [{ value: 'lin', label: 'linear' }, { value: 'pend', label: 'damped pendulum' }], 'lin');
        const thS = v.slider('ellipse angle $\\theta$', -1.57, 1.57, 0, { step: 0.01 });
        const rS = v.slider('axis ratio $r$', 0.1, 6, 1, { log: true, sig: 2 });
        const ph = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: true, height: 400, xlabel: 'x₁', ylabel: 'x₂' });
        const tm = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, xlabel: 't', ylabel: 'V(x(t))', height: 400 });
        const h0 = ph.handle(1.8, 1.3, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        const A = [[0, 2], [-1, -0.4]];
        const F = { lin: linField(A), pend: (x, y) => [y, -Math.sin(x) - 0.4 * y] };
        let info = {};
        v.render(() => {
          const f = F[sysS.value], P = shapeP(thS.value, rS.value);
          const V = (x, y) => quad(P, x, y), dV = (x, y) => { const q = f(x, y); return 2 * ((P[0][0] * x + P[0][1] * y) * q[0] + (P[1][0] * x + P[1][1] * y) * q[1]); };
          const c0 = V(h0.x, h0.y), o = flow2(f, h0.x, h0.y, T, T / N, 50);
          ph.contour(V, [0.25 * c0, 0.5 * c0, 0.75 * c0], { color: 'muted', width: 1, alpha: 0.7, res: 160 });
          ph.contour(V, [c0], { color: 'accent', width: 3, res: 240 });
          ph.clip(() => drawOrbits(ph, ring(8, 3.0, 0.3).map(([x, y]) => flow2(f, x, y, T, 0.03, 50)), { color: 'faint', width: 1, alpha: 0.9, at: 0.15 }));
          ph.clip(() => ph.path(o, { color: 'orange', width: 2.6 }));
          ph.dot(0, 0, { r: 4, color: 'ink' });
          // certificate on {V <= c0}
          let worst = -Infinity, bad = 0, tot = 0;
          for (let k = 0; k < 90; k++) {
            const a = (2 * Math.PI * k) / 90, ux = Math.cos(a), uy = Math.sin(a), q = quad(P, ux, uy);
            for (let m = 1; m <= 24; m++) { const s = Math.sqrt(c0 / q) * (m / 24); tot++; const d = dV(s * ux, s * uy); if (d >= 0) bad++; worst = Math.max(worst, d); }
          }
          const Vt = o.map((p) => V(p[0], p[1]));
          let rises = 0; for (let i = 1; i < Vt.length; i++) if (Vt[i] > Vt[i - 1] + 1e-9) rises++;
          tm.setView([0, T], [0, Math.max(1e-6, Math.max(...Vt)) * 1.08]);
          for (let i = 1; i < Vt.length; i++) tm.line((i - 1) * (T / N), Vt[i - 1], i * (T / N), Vt[i], { color: Vt[i] > Vt[i - 1] ? 'red' : 'green', width: 2.6 });
          info = { worst, bad, tot, rises, c0, last: Vt[Vt.length - 1] };
        });
        v.legend([['accent', 'level set through $x(0)$'], ['orange', 'trajectory'], ['green', '$V$ falling'], ['red', '$V$ rising']]);
        v.readout(() => {
          const { worst, bad, tot, rises, c0, last } = info; if (tot === undefined) return '';
          return `on $\\{V\\le${v.fix(c0, 2)}\\}$: $\\dot V\\ge0$ at ${bad} of ${tot} samples (largest $\\dot V=${v.fix(worst, 3)}$): ${bad === 0 ? '**certified**, so $V(x(t))$ must fall, and it does' : '**no certificate** from this $V$'}\n` +
            `along the trajectory $V$ rises on ${rises} of ${N} steps and ends at $V(x(${T}))=${v.sci(Math.max(last, 1e-12), 2)}$ from $V(x(0))=${v.fix(c0, 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'The Lyapunov equation AᵀP + PA = −Q',
      statement: String.raw`Let $A\in\R^{n\times n}$ and $Q=Q^\top\succ0$. The matrix equation
$$A^\top P+PA=-Q$$
has a unique solution $P$ whenever no two eigenvalues of $A$ satisfy $\lambda_i+\lambda_j=0$. If $A$ is Hurwitz (all eigenvalues in the open left half-plane), that solution is symmetric and positive definite, namely $P=\int_0^\infty e^{A^\top t}Qe^{At}\,dt$, and $V(x)=x^\top Px$ is a strict quadratic Lyapunov function for $\dot x=Ax$. Conversely, if for some $Q\succ0$ the solution $P$ is positive definite, then $A$ is Hurwitz.`,
      idea: String.raw`Along $\dot x=Ax$ the quadratic form $V=x^\top Px$ has $\dot V=x^\top(A^\top P+PA)x=-x^\top Qx<0$, so the equation says exactly that $V$ is a Lyapunov function with prescribed decay rate (ctrl-3.6). Integrating $\dot V$ from $0$ to $\infty$, using $x(t)\to0$ for a Hurwitz $A$ (ctrl-3.3), gives $x_0^\top Px_0=\int_0^\infty x^\top Qx\,dt$, which is positive for $x_0\neq0$ and shows $P\succ0$ (ladr-7.62). In the other direction, an eigenvector of $A$ with eigenvalue $\lambda$ gives $2\operatorname{Re}\lambda\,v^*Pv=-v^*Qv<0$, so $\operatorname{Re}\lambda<0$ if $P\succ0$.`,
      caption: String.raw`Drag the **red** eigenvalue (or choose two real eigenvalues). The matrix $A=T J T^{-1}$ is built from them with a fixed skew $T$; the tool solves the four linear equations for $P$ and draws the level sets $x^\top Px=c$ with the **gold** trajectory from the draggable start. In the left half-plane the level sets are ellipses and $V$ falls along the trajectory. Drag the eigenvalue to the right: $P$ stays computable but stops being positive definite (hyperbolas, or negative definite when both eigenvalues are unstable), exactly when stability is lost. On the imaginary axis the equation has no solution at all.`,
      deps: ['ctrl-3.6', 'ctrl-3.3', 'ladr-7.62'],
      refs: ['Åström–Murray §5.4'],
      tags: ['lyapunov equation', 'quadratic'],
      credit: 'A. M. Lyapunov, 1892',
      viz(v) {
        const T = 10;
        const mS = v.select('eigenvalues', [{ value: 'c', label: 'complex pair' }, { value: 'r', label: 'two real' }], 'c');
        const qS = v.select('$Q$', [{ value: 'i', label: '$I$' }, { value: 'a', label: 'diag(1, 6)' }, { value: 'b', label: 'diag(6, 1)' }], 'i');
        const sp = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: true, height: 360, xlabel: 'Re λ', ylabel: 'Im λ', title: 'eigenvalues of $A$' });
        const ph = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 360, title: 'level sets of $V=x^\\top Px$' });
        const hc = sp.handle(-0.5, 1.2, { color: 'red', label: 'λ', labelPos: 'ne' });
        const r1 = sp.handle(-0.8, 0, { color: 'red', label: 'λ₁', labelPos: 'n', constrain: 'x' });
        const r2 = sp.handle(-1.6, 0, { color: 'orange', label: 'λ₂', labelPos: 'n', constrain: 'x' });
        const x0 = ph.handle(1.6, 1.0, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        hc.onDrag = () => { if (hc.y < 0.12) hc.set(hc.x, 0.12); };
        const Tm = [[1, 0.7], [0.2, 1]], Ti = v.M.inverse(Tm);
        let info = {};
        v.render(() => {
          const c = mS.value === 'c';
          hc.visible = c; r1.visible = !c; r2.visible = !c;
          const J = c ? [[hc.x, -hc.y], [hc.y, hc.x]] : [[r1.x, 0], [0, r2.x]];
          const A = v.M.matMul(v.M.matMul(Tm, J), Ti), Q = { i: [[1, 0], [0, 1]], a: [[1, 0], [0, 6]], b: [[6, 0], [0, 1]] }[qS.value];
          const ev = c ? [[hc.x, hc.y], [hc.x, -hc.y]] : [[r1.x, 0], [r2.x, 0]];
          sp.vband(0, 2.5, { color: 'red', alpha: 0.06 }); sp.vband(-2.5, 0, { color: 'green', alpha: 0.06 }); sp.vline(0, { color: 'ink', width: 1.2 });
          if (c) xMark(sp, hc.x, -hc.y, { color: 'red' });
          const P = lyap2(v.M, A, Q);
          const f = linField(A), o = flow2(f, x0.x, x0.y, T, 0.02, 30);
          if (P) {
            const levels = [0.5, 1, 2, 4, 8, 16, 32];
            ph.contour((x, y) => quad(P, x, y), levels.concat(levels.map((l) => -l)), { color: 'accent', width: 1.4, res: 160 });
          } else ph.text('no unique solution: $\\lambda_i+\\lambda_j=0$', 0, 0, { size: 13, color: 'red', align: 'center' });
          ph.clip(() => ph.path(o, { color: 'gold', width: 2.6 }));
          ph.dot(0, 0, { r: 3.5, color: 'ink' });
          let evP = null, res = null;
          if (P) { evP = v.M.eigSym(P).values; const R = v.M.matMul(v.M.transpose(A), P), S = v.M.matMul(P, A); res = fro(R.map((r, i) => r.map((x, j) => x + S[i][j] + Q[i][j]))); }
          info = { A, P, ev, evP, res, V: P ? o.map((p) => quad(P, p[0], p[1])) : null };
        });
        v.legend([['accent', 'level sets $x^\\top Px=c$'], ['gold', 'trajectory']]);
        v.readout(() => {
          const { A, P, ev, evP, res, V } = info; if (!A) return '';
          if (!P) return `$\\lambda=${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$: the operator $P\\mapsto A^\\top P+PA$ is singular, so $A^\\top P+PA=-Q$ has no unique solution (on the imaginary axis it has none)`;
          const pd = evP[0] > 0 && evP[1] > 0, mono = V.every((x, i) => i === 0 || x <= V[i - 1] + 1e-9);
          return `$\\lambda=${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$, $P=${matTeX(P, 3)}$ with eigenvalues $${evP.map((x) => nTeX(x, 3)).join(',\\; ')}$: $P$ is **${pd ? 'positive definite' : 'not positive definite'}**, so $A$ is **${pd ? 'Hurwitz' : 'not Hurwitz'}**\n` +
            `residual $\\|A^\\top P+PA+Q\\|=${v.sci(Math.max(res, 1e-15), 2)}$; along the trajectory $V$ is ${mono ? 'monotonically decreasing' : '**not** monotone (indefinite $V$)'}`;
        });
      },
    },
  ],
};
