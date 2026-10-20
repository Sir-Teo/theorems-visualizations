// Systems Biology — Chapter 4: Positive feedback, bistability and memory (after U. Alon, An Introduction to Systems Biology)
//
// Units used in every picture: concentrations in units of the promoter's half-activation / half-repression constant K, time in units
// of 1/(removal rate), so a protein with no regulation relaxes as exp(-t). Part 1 (this file): 4.1-4.5. Part 2 (ch04-b.js): 4.6-4.10.
import { rep, toggleRoots, integrate } from './ch04.shared.js';
import {lacEquilibria as lacRoots,lacCulture,lacBranches} from './sysbio-source-audit-lac.shared.js';

const pw = (x, n) => Math.pow(Math.max(x, 0), n);

export default {
  collection: 'sysbio',
  chapter: 4,
  title: 'Positive feedback, bistability and memory',
  summary: String.raw`Two genes that repress each other, or one that activates itself, can sit in either of two stable states and remember which signal they last saw. The synthetic toggle switch proved the design, and cooperativity turned out to be essential. Natural switches — the lac operon, phage lambda, cell-fate decisions on Waddington's landscape — use the same logic, while titration and kinase cascades provide the ultrasensitivity that bistability needs.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Double-negative and double-positive feedback loops',
      statement: String.raw`Let two proteins $u$ and $v$ regulate each other's genes, each removed at rate $1$ (time in units of $1/\alpha_{\rm removal}$) and measured in units of the promoter constant $K$. In the **double-negative** loop (mutual repression)
$$\dot u=\frac{\alpha}{1+v^{\,n}}-u,\qquad \dot v=\frac{\alpha}{1+u^{\,n}}-v,$$
and in the **double-positive** loop (mutual activation) $\dot u=\alpha\,\dfrac{v^n}{1+v^n}-u$, $\dot v=\alpha\,\dfrac{u^n}{1+u^n}-v$. The sign of a feedback loop is the product of the signs of its edges, so both circuits are **positive feedback loops**: a change in $u$ comes back to $u$ with the same sign. The steady states are the crossings of the two nullclines $\dot u=0$ and $\dot v=0$; for strong promoters ($\alpha$ large) and cooperativity $n>1$ the nullclines cross three times, giving two stable states separated by an unstable saddle.`,
      idea: String.raw`A steady state of a two-gene system is where the two nullcline curves cross. Each nullcline is a (monotone) Hill curve, decreasing for repression and increasing for activation, and the two are mirror images of each other across the diagonal. Mutual repression: if $u$ is high it keeps $v$ low, which keeps $u$ high — and the same holds with the roles exchanged, so there are two "winner-take-all" states. Mutual activation gives an "off–off" and an "on–on" state in the same way. A positive loop is what makes several stable states possible at all (the rule that René Thomas conjectured and Soulé proved), and a sigmoid nullcline (Hill $n>1$, from 1.3) is what lets the curves cross three times. The middle crossing is a saddle: its stable manifold is the watershed between the two memories.

At a smooth equilibrium the Jacobian has diagonal entries minus one and off-diagonal slopes a and b of the two regulatory inputs. For these same-sign loops, ab is nonnegative and the eigenvalues are $-1\pm\sqrt{ab}$. The nonlinear linearisation theorem ctrl 3.4 gives local asymptotic stability for ab<1 and instability with a saddle direction for ab>1. At ab=1 it does not decide stability. This tests each actual crossing; a positive loop sign alone neither guarantees multiple crossings nor classifies a marginal one.`,
      caption: String.raw`Switch between the two wirings, then drag the strength $\alpha$ and the cooperativity $n$. The orange and purple curves are the nullclines of $u$ and $v$; filled green dots are stable states, hollow red ones unstable, and the half-filled dot is the saddle. Click anywhere to launch a trajectory and see which memory it falls into. Lower $n$ to 1 and the extra crossings vanish (mutual repression keeps a single state; mutual activation loses its stable "off" state).`,
      deps: ['sysbio-1.3', 'ctrl-1.12', 'ctrl-3.4'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['feedback', 'bistability', 'phase plane'],
      scope: String.raw`Deterministic, well-mixed model of two genes with Hill input functions, instantaneous binding and identical removal rates for the two proteins; real circuits add transcription–translation delays, mRNA, and noise.`,
      credit: 'R. Thomas, 1981 (positive loop needed for multistationarity); proved by C. Soulé, 2003',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Positive_feedback' },
      viz(v) {
        const kind = v.select('wiring', [{ value: 'rep', label: 'double-negative (mutual repression)' }, { value: 'act', label: 'double-positive (mutual activation)' }], 'rep');
        const A = v.slider(String.raw`strength $\alpha$`, 1.5, 30, 10, { log: true, sig: 2 });
        const N = v.slider(String.raw`cooperativity $n$`, 1, 4, 2, { step: 0.1 });
        const s = v.stage({ x: [0, 11], y: [0, 11], height: 400, axes: 'box', gutter: true, xlabel: 'protein u (units of K)', ylabel: 'protein v (units of K)', weight: 1.2 });
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => (p.rep
            ? [p.A / (1 + pw(y, p.N)) - x, p.A / (1 + pw(x, p.N)) - y]
            : [p.A * pw(y, p.N) / (1 + pw(y, p.N)) - x, p.A * pw(x, p.N) / (1 + pw(x, p.N)) - y]),
          params: { A, N, rep: () => (kind.value === 'rep' ? 1 : 0) },
          field: 'stream', nullclines: true, fixedPoints: true, separatrices: true, seeds: [[0.7, 0.5], [0.5, 0.7]], maxTraj: 8,
        });
        let m = 11;
        v.render(() => { m = Math.max(1.15 * A.value, 2); s.setView([0, m], [0, m]); pp.draw(); });
        pp.legend();
        v.readout(() => {
          const fps = pp.fixedPoints(), st = fps.filter((f) => f.stable).length;
          return `loop sign = ${kind.value === 'rep' ? '(−)(−)' : '(+)(+)'} = **+** · ${fps.length} steady state${fps.length === 1 ? '' : 's'}, ${st} stable → **${st >= 2 ? 'bistable' : 'monostable'}**\n${pp.describe({ max: 4 })}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Genetic toggle switch (Gardner–Cantor–Collins)',
      statement: String.raw`The **genetic toggle switch** is a synthetic circuit of two repressors $u$ and $v$ whose genes repress each other, built in *E. coli* from two repressible promoters. In dimensionless form
$$\dot u=\frac{\alpha_1}{1+v^{\,\beta}}-u,\qquad \dot v=\frac{\alpha_2}{1+u^{\,\gamma}}-v,$$
where $\alpha_{1,2}$ are the effective rates of synthesis and $\beta,\gamma$ the cooperativities of repression. With strong promoters and cooperative repression there are two stable states, "$u$ high, $v$ low" and "$v$ high, $u$ low". A transient chemical inducer that inactivates one repressor, or a thermal pulse that inactivates a temperature-sensitive repressor, flips the switch; after the inducer is removed the circuit stays in its new state, a one-bit cellular memory.`,
      idea: String.raw`The model is the double-negative loop of 4.1 with separate rates and Hill exponents. While an inducer is present, the inactivated repressor is effectively diluted, which removes the stable state it was supporting: the system has only one steady state left and every trajectory falls into it. When the inducer is washed away the second stable state returns, but the circuit sits in the basin of the state it was driven into, and the saddle between them keeps it there. Pulses that are too weak or too short never carry the state across the saddle's stable manifold, so the circuit relaxes back and the memory is not changed: the switch has a threshold.`,
      caption: String.raw`Time runs left to right with an automatic play-through (restart or scrub the animation). Orange bands are pulses of the inducer that inactivates $u$, pink bands pulses of the one that inactivates $v$. The traces are the two repressors; on the right the same run is a path in the $(u,v)$ plane with the nullclines of the uninduced circuit. Shorten the pulse or weaken the inducer until the flip fails, and lower the cooperativity to 1 to see the memory vanish: the two pulses then only produce temporary excursions around a single steady state. The inducer model (a division of the repressor level by $1+{\rm inducer}$) is my parametrisation, not the paper's.`,
      deps: ['sysbio-4.1'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['synthetic biology', 'bistability', 'memory'],
      scope: String.raw`A two-variable deterministic caricature; mRNA, delays and cell-to-cell noise are ignored, and the inducer terms (IPTG and temperature in the experiment) are idealised as a rescaling of the repressor concentration.`,
      credit: 'T. S. Gardner, C. R. Cantor & J. J. Collins, 2000 (Nature 403: 339–342)',
      links: { doi: 'https://doi.org/10.1038/35002131', wikipedia: 'https://en.wikipedia.org/wiki/Genetic_toggle_switch' },
      viz(v) {
        const al = v.slider(String.raw`promoter strength $\alpha$`, 2, 50, 10, { log: true, sig: 2 });
        const nn = v.slider(String.raw`cooperativity $n$ ($\beta=\gamma$)`, 1, 4, 2.5, { step: 0.1 });
        const Is = v.slider('inducer strength', 1, 30, 10, { log: true, sig: 2 });
        const Dp = v.slider('pulse length', 2, 40, 15, { step: 1 });
        const T = 170, pulses = [[20, 1], [70, -1], [120, 1]];
        const L = v.stage({ x: [0, T], y: [0, 10], axes: 'box', gutter: true, height: 320, weight: 1.4, minWidth: 300, xlabel: 'time (units of 1/removal rate)', ylabel: 'repressor level (K)' });
        const R = v.stage({ x: [0, 11], y: [0, 11], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xlabel: 'u (K)', ylabel: 'v (K)' });
        let key = '', tr = [], roots = [];
        const ind = (t) => { for (const [t0, sg] of pulses) if (t >= t0 && t < t0 + Dp.value) return sg * Is.value; return 0; };
        const compute = () => {
          const k = `${al.value}|${nn.value}|${Is.value}|${Dp.value}`;
          if (k === key) return; key = k;
          const a = al.value, n = nn.value;
          roots = toggleRoots(a, a, n, n);
          const st = roots.filter((r) => r.stable);
          const s0 = st.length ? st.reduce((p, q) => (p.u > q.u ? p : q)) : { u: a, v: 0 };
          const F = (y, t) => { const i = ind(t), iu = 1 + Math.max(i, 0), iv = 1 + Math.max(-i, 0); return [a * rep(y[1] / iv, n) - y[0], a * rep(y[0] / iu, n) - y[1]]; };
          tr = integrate(F, [s0.u, s0.v], T, 1700, 1);
        };
        const stateAt = (t) => { const r = tr[Math.min(tr.length - 1, Math.round(t * 10))]; return r[1] > r[2] ? 'u high' : 'v high'; };
        v.animate((tm) => {
          compute();
          const a = al.value, ymax = 1.12 * a, tt = (T * tm) / 14;
          L.setView([0, T], [0, ymax]); R.setView([0, ymax], [0, ymax]);
          pulses.forEach(([t0, sg]) => { L.vband(t0, t0 + Dp.value, { color: sg > 0 ? 'orange' : 'pink', alpha: 0.22 }); L.text(sg > 0 ? 'inactivate u' : 'inactivate v', t0 + Dp.value / 2, ymax * 0.96, { size: 10, color: sg > 0 ? 'orange' : 'pink', align: 'center' }); });
          L.path(tr.map((r) => [r[0], r[1]]), { color: 'accent', width: 1.5, alpha: 0.3 });
          L.path(tr.map((r) => [r[0], r[2]]), { color: 'green', width: 1.5, alpha: 0.3 });
          const cur = tr.filter((r) => r[0] <= tt);
          L.path(cur.map((r) => [r[0], r[1]]), { color: 'accent', width: 3 });
          L.path(cur.map((r) => [r[0], r[2]]), { color: 'green', width: 3 });
          L.vline(tt, { color: 'gold', width: 1.5 });
          // right: nullclines of the uninduced circuit and the path so far
          const n = nn.value;
          R.fn((x) => a * rep(x, n), { color: 'purple', width: 2 });
          R.curve((y) => [a * rep(y, n), y], 0, ymax, { color: 'orange', width: 2, n: 300 });
          roots.forEach((r) => R.dot(r.u, r.v, { r: 6, color: r.stable ? 'green' : 'red', hollow: !r.stable }));
          R.path(cur.map((r) => [r[1], r[2]]), { color: 'gold', width: 2 });
          const last = cur[cur.length - 1] || tr[0];
          R.dot(last[1], last[2], { r: 6, color: 'gold' });
        }, { period: 14, still: 13.9 });
        v.legend([['accent', 'u'], ['green', 'v'], ['orange', 'u-nullcline'], ['purple', 'v-nullcline'], ['gold', 'now']]);
        v.readout(() => {
          const st = roots.filter((r) => r.stable).length;
          if (!tr.length) return '';
          return `steady states without inducer: ${roots.length} (${st} stable) → **${st >= 2 ? 'bistable' : 'monostable'}**\nstate 5 time units after each pulse ends: ${pulses.map(([t0]) => stateAt(Math.min(T - 0.1, t0 + Dp.value + 5))).join(' → ')} (start: ${stateAt(0)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Toggle bistability requires cooperativity',
      statement: String.raw`For the toggle $\dot u=\alpha_1/(1+v^{\beta})-u$, $\dot v=\alpha_2/(1+u^{\gamma})-v$ with $\alpha_1,\alpha_2,\beta,\gamma>0$:
(a) if $\beta\gamma\le 1$ there is exactly one steady state, and it attracts all trajectories (a planar competitive system has no periodic orbits), so the circuit is monostable for every choice of $\alpha_1,\alpha_2$;
(b) bistability (two stable states and one saddle) therefore needs $\beta\gamma>1$, i.e. repression that is cooperative on at least one arm; and
(c) when $\beta\gamma>1$ it occurs once $\alpha_1,\alpha_2$ are large enough and balanced enough, and the bistable region in the $(\alpha_1,\alpha_2)$-plane widens with $\beta\gamma$.`,
      idea: String.raw`Eliminate $u$ with its nullcline, $u=\alpha_1/(1+v^\beta)$, and call $G(v)$ the resulting right-hand side of $\dot v$ at equilibrium; steady states are the solutions of $G(v)=v$. Take logarithmic derivatives: $d\ln u/d\ln v=-\beta\,v^\beta/(1+v^\beta)$ and $d\ln G/d\ln u=-\gamma\,u^\gamma/(1+u^\gamma)$, so the **loop gain** $d\ln G/d\ln v=\beta\gamma\,a\,b$ with $a,b\in(0,1)$, hence it is $<\beta\gamma$ everywhere. If $\beta\gamma\le1$ the gain is below 1, so $G(v)/v$ is strictly decreasing and crosses 1 once. With $\beta\gamma>1$ the gain can exceed 1 near the middle, which is exactly where the middle (unstable) crossing sits, and large $\alpha$'s push the sigmoid steep part out to meet the diagonal. This is the "simple theory" that Gardner, Cantor and Collins used as a design rule (4.10).

The chain rule (pma 5.5) applies to the positive nullcline maps and their logarithms. It multiplies the two logarithmic derivatives to give the stated loop gain. In particular $d\log(G(v)/v)/d\log v=\beta\gamma ab-1$, strictly negative when the product of exponents is at most one; endpoint limits then give the unique crossing. This derivative bound supplies the steady-state count, not the separate planar no-cycle or global-attraction argument, and exceeding one is a necessary possibility rather than a sufficient parameter test for bistability.`,
      caption: String.raw`**Left**: phase plane with the nullclines. **Right**: the plane of cooperativities $(\beta,\gamma)$ for the current $\alpha_1,\alpha_2$; green marks where the toggle is bistable (computed by counting steady states at each point), the black hyperbola is $\beta\gamma=1$. Drag the gold point (or the sliders): in the region below the hyperbola the nullclines cross once, whatever the promoter strengths; above it they cross three times if $\alpha$ is large enough. Make $\alpha_1$ and $\alpha_2$ very unequal and the green region shrinks, because one repressor then always wins.`,
      deps: ['sysbio-4.2', 'mathbio-3.2', 'pma-5.5'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['bistability', 'cooperativity', 'bifurcation'],
      scope: String.raw`Deterministic two-variable toggle with Hill repression and equal removal rates (the time scales of $u$ and $v$ do not matter for the steady-state count). Parts (a) and (b) are proved by the loop-gain bound in the idea; the shape of the bistable region in (c) is computed numerically.`,
      credit: 'Gardner, Cantor & Collins, 2000 (condition βγ > 1 as a design rule); the monotone-loop-gain argument is standard',
      links: { doi: 'https://doi.org/10.1038/35002131' },
      viz(v) {
        const a1 = v.slider(String.raw`$\alpha_1$`, 1.5, 100, 10, { log: true, sig: 2 });
        const a2 = v.slider(String.raw`$\alpha_2$`, 1.5, 100, 10, { log: true, sig: 2 });
        const P = v.stage({ x: [0, 11], y: [0, 11], height: 360, axes: 'box', gutter: true, xlabel: 'u (K)', ylabel: 'v (K)', weight: 1.1, minWidth: 280 });
        const Q = v.stage({ x: [0.3, 4], y: [0.3, 4], height: 360, axes: 'box', gutter: true, xlabel: 'β  (cooperativity of v repressing u)', ylabel: 'γ  (cooperativity of u repressing v)', weight: 1, minWidth: 280, title: 'where the toggle is bistable' });
        const hd = Q.handle(2, 2, { color: 'gold', r: 8, constrain: { x: [0.3, 4], y: [0.3, 4] } });
        const pp = v.phasePlane(P, {
          f: (x, y, t, p) => [p.a1 / (1 + pw(y, p.b)) - x, p.a2 / (1 + pw(x, p.g)) - y],
          params: { a1, a2, b: () => hd.x, g: () => hd.y }, field: 'arrows', nullclines: true, fixedPoints: true, separatrices: false, both: false, maxTraj: 6,
        });
        let info = null;
        v.render(() => {
          const A1 = a1.value, A2 = a2.value, b = hd.x, g = hd.y;
          const m = 1.12 * Math.max(A1, A2); P.setView([0, m], [0, m]); pp.draw();
          Q.raster((x, y) => (toggleRoots(A1, A2, x, y, 0, 200).filter((r) => r.stable).length >= 2 ? [...v.rgb('green').slice(0, 3), 90] : null), { res: 4, key: `${A1}|${A2}` });
          Q.fn((x) => 1 / x, { color: 'ink', width: 2, domain: [0.3, 4] });
          Q.text('βγ = 1', 2.4, 0.62, { size: 11, color: 'ink' });
          const roots = toggleRoots(A1, A2, b, g);
          info = { b, g, k: roots.length, st: roots.filter((r) => r.stable).length, gain: Math.max(0, ...roots.map((r) => r.gain)) };
        });
        pp.legend();
        v.readout(() => (info ? `$\\beta\\gamma=${v.fix(info.b * info.g, 2)}$ → ${info.b * info.g <= 1 ? 'at most 1 steady state guaranteed' : 'bistability possible'} · found ${info.k} steady state${info.k === 1 ? '' : 's'}, ${info.st} stable → **${info.st >= 2 ? 'bistable' : 'monostable'}**\nloop gain at the steady states ≤ ${v.fix(info.gain, 2)} (below $\\beta\\gamma$; a state with gain $>1$ is the saddle)` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Hysteresis and cellular memory',
      statement: String.raw`A bistable gene circuit driven by a slowly varying input shows **hysteresis**: the input level at which cells switch from state 1 to state 2 as the input is raised differs from the level at which they switch back when it is lowered, so for inputs between the two thresholds the state of a cell depends on its history. The population-level readout is a loop in the (input, fraction of cells in state 2) plane. The state in the window is a **cellular memory** that persists, without the input, for as long as the stable state does. Hysteresis disappears when the circuit is monostable, e.g. when the cooperativity of the toggle is too low.`,
      idea: String.raw`Slowly moving the input moves the stable states along their branches. A branch that is followed upward ends at a saddle–node bifurcation (a fold of the S-shaped steady-state curve, as in mathbio-1.11) where the state it was tracking disappears and the cell jumps to the other branch; the way back ends at a different fold. In between the system has two stable states, so the last fold passed decides which one a cell occupies. In the toggle of 4.3 the input is the net strength of an inducer that inactivates $u$ (positive) or $v$ (negative); the folds sit at symmetric positive and negative values, and the width of the loop grows with cooperativity. Cell-to-cell differences in promoter strength smear each fold into a distribution of thresholds, as in flow-cytometry experiments.`,
      caption: String.raw`**Left**: the fraction of 60 simulated cells (promoter strengths scattered log-normally) found in the $v$-high state while the net inducer is swept up (blue) or down (red). **Right**: the same cells at the net inducer value of the slider, one column that arrived from the left and one that arrived from the right: dot height is $\log_{10}(v/u)$, so green dots above 0 are $v$-high cells. Place the slider inside the loop and the two columns disagree. Lower $n$ to 1 and the loop closes; increase the variability and the steps become gradual.`,
      deps: ['sysbio-4.3', 'mathbio-1.11'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['hysteresis', 'memory', 'bistability'],
      scope: String.raw`Quasi-static sweep of a deterministic model: the sweep is slow enough that each cell relaxes to a steady state at every input value (we follow stable branches), and cells do not switch spontaneously by noise. The population is a model (60 seeded cells), not data.`,
      credit: 'observed in the lac operon by Novick & Weiner (1957) and in the synthetic toggle by Gardner et al. (2000)',
      viz(v) {
        const nn = v.slider(String.raw`cooperativity $n$`, 1, 4, 2.5, { step: 0.1 });
        const sg = v.slider('cell-to-cell variability (log-normal σ of promoter strength)', 0, 0.6, 0.2, { step: 0.02 });
        const C = v.slider('net inducer (+ inactivates u, − inactivates v)', -8, 8, 0.5, { step: 0.1 });
        const NC = 60, grid = []; for (let i = 0; i <= 80; i++) grid.push(-8 + (16 * i) / 80);
        const S1 = v.stage({ x: [-8, 8], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'net inducer', ylabel: 'fraction of cells v-high' });
        const S2 = v.stage({ x: [0, 4.4], y: [-3, 3], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xticks: [[1, 'from the left'], [3, 'from the right']], ylabel: 'log₁₀(v/u) per cell' });
        let key = '', cells = [], up = [], dn = [], thr = null, c_ = { fu: 0, fd: 0 };
        const rng = v.rng(11), jit = [], z = [];
        for (let i = 0; i < NC; i++) { z.push([rng.normal(), rng.normal()]); jit.push([rng(), rng()]); }
        const branch = (a1, a2, n, goUp) => {
          const seq = goUp ? grid : grid.slice().reverse(); let pv = null; const out = [];
          for (const c of seq) {
            const r = toggleRoots(a1, a2, n, n, c, 240).filter((q) => q.stable);
            let q;
            if (pv === null) q = goUp ? r.reduce((a, b) => (a.v < b.v ? a : b)) : r.reduce((a, b) => (a.v > b.v ? a : b));
            else q = r.reduce((a, b) => (Math.abs(Math.log(a.v / pv)) < Math.abs(Math.log(b.v / pv)) ? a : b));
            pv = q.v; out.push(Math.log10(q.v / q.u));
          }
          return goUp ? out : out.reverse();
        };
        const compute = () => {
          const k = `${nn.value}|${sg.value}`; if (k === key) return; key = k;
          cells = z.map(([x, y]) => ({ U: branch(10 * Math.exp(sg.value * x), 10 * Math.exp(sg.value * y), nn.value, true), D: branch(10 * Math.exp(sg.value * x), 10 * Math.exp(sg.value * y), nn.value, false) }));
          up = grid.map((_, i) => cells.filter((c) => c.U[i] > 0).length / NC);
          dn = grid.map((_, i) => cells.filter((c) => c.D[i] > 0).length / NC);
          const med = (a) => { const b = a.filter(Number.isFinite).sort((p, q) => p - q); return b.length ? b[b.length >> 1] : NaN; };
          const on = cells.map((c) => { const i = c.U.findIndex((x) => x > 0); return i < 0 ? NaN : grid[i]; });
          const off = cells.map((c) => { for (let i = c.D.length - 1; i >= 0; i--) if (c.D[i] <= 0) return grid[i]; return NaN; });
          thr = { on: med(on), off: med(off) };
        };
        v.render(() => {
          compute();
          const c = C.value, ix = Math.round(((c + 8) / 16) * 80);
          const lo = Math.min(thr.on, thr.off), hi = Math.max(thr.on, thr.off);
          if (Number.isFinite(lo) && hi - lo > 0.15) S1.vband(lo, hi, { color: 'purple', alpha: 0.1 });
          S1.path(grid.map((g, i) => [g, up[i]]), { color: 'accent', width: 3 });
          S1.path(grid.map((g, i) => [g, dn[i]]), { color: 'red', width: 3 });
          S1.vline(c, { color: 'gold', width: 2 });
          S2.hline(0, { color: 'faint', dash: true });
          cells.forEach((cl, i) => {
            const yu = cl.U[ix], yd = cl.D[ix];
            S2.dot(0.4 + 1.2 * jit[i][0], yu, { r: 4, color: yu > 0 ? 'green' : 'accent' });
            S2.dot(2.4 + 1.2 * jit[i][0], yd, { r: 4, color: yd > 0 ? 'green' : 'accent' });
          });
          S2.text('v-high', 4.35, 2.6, { size: 11, color: 'green', align: 'right' }); S2.text('u-high', 4.35, -2.6, { size: 11, color: 'accent', align: 'right' });
          c_ = { fu: up[ix], fd: dn[ix] };
        });
        v.legend([['accent', 'swept upward (left → right)'], ['red', 'swept downward'], ['purple', 'hysteresis window (median thresholds)', { area: true }]]);
        v.readout(() => `median switch-on threshold ${v.fix(thr.on, 1)} (rising), switch-off ${v.fix(thr.off, 1)} (falling) → loop width **${v.fix(Math.abs(thr.on - thr.off), 1)}** inducer units\nat the gold value: ${v.fix(100 * c_.fu, 0)}% of cells v-high if they came from the left, ${v.fix(100 * c_.fd, 0)}% if they came from the right`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Lac operon bistability',
      statement: String.raw`In *E. coli* the lactose permease LacY imports the inducer that inactivates the Lac repressor and so switches on the *lac* genes, including *lacY*: the inducer feeds back positively on its own uptake. A minimal model with permease level $P$ and internal inducer $X$ is
$$\dot P=\alpha\,\frac{\varepsilon+X^{n}}{1+X^{n}}-P,\qquad \dot X=\kappa\,(\varphi+P)\,\frac{e}{1+e}-X,$$
with a small basal expression $\varepsilon$, a permease-independent leak $\varphi$ and external inducer $e$ (units of the uptake constant). For suitable repression steepness, sufficiently small basal/leak terms and balanced uptake/production, there can be an external-inducer window with two stable states; $n>1$ and a strong promoter alone are not sufficient. Within a bistable window, induced and uninduced histories can retain distinct expression states; the original TMG experiment observed history dependence and bimodal single-cell fluorescence near switching boundaries. This is distinct from a universal lactose response.`,
      idea: String.raw`At steady state the permease is a function of the inducer inside, $P=\alpha D(X)$ with $D$ the sigmoidal derepression curve, and the inducer is the permease times a transport factor, so $X=\kappa\sigma(\varphi+\alpha D(X))$ with $\sigma=e/(1+e)$. The right side is a sigmoid in $X$, the left a line; for $e$ in a window the line cuts the sigmoid three times (two stable, one unstable), which is the double-positive loop of 4.1 realised through a transporter rather than a second gene. Where only one crossing remains, the two-state equilibrium memory is lost. The Jacobian has eigenvalues $-1\pm\sqrt{G'(X)}$, with $G(X)=\kappa\sigma(\varphi+\alpha D(X))$. A root is stable for $G'<1$, a saddle for $G'>1$, and marginal for equality. For this positive-leak model $n=1$ gives one positive stable root; steepness above one permits but does not guarantee multiple roots.

For this smooth two-variable model, the Jacobian has diagonal entries minus one and positive off-diagonal product $G\prime(X)$. Its eigenvalues are the two values quoted above. Applying nonlinear linearisation (ctrl 3.4) makes a root locally attracting when $G\prime<1$ and a saddle when $G\prime>1$; equality is marginal and requires further analysis. These local conclusions concern the prescribed uptake–permease model and do not turn a finite cohort endpoint into a universal experimental fate probability.`,
      caption: String.raw`**Left**: the steady-state internal inducer $X$ against external inducer $e$ (log axis): solid green = stable, dashed red = unstable. The gold line is the current $e$. Inside the S-shaped fold two stable states coexist. **Right**: a simulated culture of 200 cells (promoter strength scattered by a few percent) shown as a histogram of $\log_{10}X$, for three assigned histories. Each cell is assigned the lowest or highest stable equilibrium, rather than simulated through growth or stochastic switching. The readout counts lower/upper choices only for cells with two stable roots; variation can give different root counts across the culture. All 200 cells remain in the adaptive histogram range. Reduce $n$ or $\alpha$ until the fold disappears.`,
      deps: ['sysbio-4.1', 'sysbio-2.5', 'ctrl-3.4'],
      refs: ['Ozbudak et al. (2004), Nature427:737–740: Figure1/TMG loop p737, Figure2 history/hysteresis p738, Figure4 graded-vs-binary p739, Methods p740'],
      tags: ['lac operon', 'bistability', 'history dependence'],
      scope: String.raw`The original full four-page Ozbudak et al. article was checked. It measured lac-promoter GFP and gat-promoter HcRed in individual cells after defined induced/uninduced histories, varying TMG and glucose. The following equations and 200-cell branch assignment are an illustrative reduction with chosen parameters (not fitted): it keeps only the inducer–permease loop, ignores the *lacZ* and *lacA* products, glucose and cAMP control, growth-rate effects and noise, and treats the inducer as non-metabolised (TMG-like). Real lactose or IPTG experiments can differ in where and whether bistability appears.`,
      credit: 'E. M. Ozbudak, M. Thattai, H. N. Lim, B. I. Shraiman & A. van Oudenaarden, 2004 (Nature427:737–740; TMG/glucose experiment); illustrative reduced model chosen here',
      links: { doi: 'https://doi.org/10.1038/nature02298', wikipedia: 'https://en.wikipedia.org/wiki/Lac_operon' },
      verify: false,
      viz(v) {
        const le = v.slider('external inducer e (log₁₀, units of the uptake constant)', -1.5, 1.5, -0.3, { step: 0.01, fmt: (x) => v.fix(Math.pow(10, x), 2) });
        const al = v.slider(String.raw`promoter strength $\alpha$`, 3, 30, 10, { log: true, sig: 2 });
        const nn = v.slider(String.raw`cooperativity $n$`, 1, 4, 3, { step: 0.1 });
        const hist = v.select('culture history', [{ value: 'low', label: 'grown uninduced' }, { value: 'high', label: 'grown induced' }, { value: 'mix', label: 'half and half' }], 'mix');
        const S1 = v.stage({ x: [-1.5, 1.5], y: [0, 12], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 290, xlabel: 'external inducer e (log₁₀)', ylabel: 'internal inducer X (K)', xticks: [[-1, '0.1'], [0, '1'], [1, '10']] });
        const S2 = v.stage({ x: [-3, 1.3], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'log₁₀ X in each cell', ylabel: 'fraction of cells' });
        const base = { kap: 1, phi: 0.05, eps: 0.02 };
        const rng = v.rng(5), zs = []; for (let i = 0; i < 200; i++) zs.push(rng.normal());
        let info = null, ckey = '', curve = [];
        v.render(() => {
          const p = { ...base, al: al.value, n: nn.value };
          const k = `${al.value}|${nn.value}`;
          if(k!==ckey){ckey=k;curve=lacBranches(p);}
          const top=Math.max(2,...curve.flatMap(r=>r.points.map(q=>q[1])))*1.08;S1.setView([-1.5,1.5],[0,top]);
          curve.forEach(r=>S1.path(r.points,{color:r.stable?'green':'red',width:r.stable?3:2,dash:!r.stable}));
          S1.vline(le.value, { color: 'gold', width: 2 });
          const e = Math.pow(10, le.value), roots = lacRoots(e, p, 400), st = roots.filter((r) => r.stable).map((r) => r.X);
          // culture of 200 cells with scattered promoter strength; each relaxes to the stable state matching its history
          const culture=lacCulture(e,p,zs,hist.value),{vals,range}=culture;
          S2.setView(range,[0,1]);
          const hh=v.M.histogram(vals,{bins:52,range});
          S2.hist({edges:hh.edges,counts:hh.counts.map(c=>c/vals.length)},{color:'accent'});
          info={nst:st.length,marginal:roots.filter(r=>r.marginal).length,e,...culture};
        });
        v.legend([['green', 'stable steady state'], ['red', 'unstable', { dash: true }], ['gold', 'current e']]);
        v.readout(()=>info?`e = ${v.fix(info.e,2)}: ${info.nst} strictly stable state${info.nst===1?'':'s'}${info.marginal?`, ${info.marginal} marginal root`:''} → **${info.nst>=2?'bistable window':info.marginal?'fold boundary':'single stable state'}**\nculture (${hist.value} assigned history): ${info.lower} on a lower branch and ${info.upper} on an upper branch of a bistable cell; ${info.single} have one strictly stable root; ${info.marginal} marginal. Histogram includes all 200 cells; this branch assignment is not a measured population distribution.`:'');
      },
    },
  ],
};
