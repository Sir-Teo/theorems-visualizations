// Chemical Kinetics — Chapter 4: Complex mechanisms (items 4.1–4.5)
import { clamp, ode, logspace, nz } from './ch04.shared.js';

/** exact A -> B -> C populations (starting from A = 1) */
const abc = (k1, k2, t) => {
  const A = Math.exp(-k1 * t);
  const B = Math.abs(k1 - k2) < 1e-9 * (k1 + k2) ? k1 * t * Math.exp(-k1 * t) : k1 / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t));
  return [A, B, Math.max(0, 1 - A - B)];
};

export default {
  collection: 'kin',
  chapter: 4,
  title: 'Complex mechanisms',
  summary: String.raw`Real reactions proceed through sequences of elementary steps, and the observed rate law is the shadow the mechanism casts. The steady-state and pre-equilibrium approximations turn coupled rate equations into algebra, the rate-determining step emerges when one barrier dominates, and the Lindemann mechanism explains why unimolecular reactions change order with pressure. Chain reactions, explosions and polymerization show what happens when intermediates regenerate themselves.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Proposition', name: 'Consecutive reactions A → B → C',
      statement: String.raw`For two successive first-order steps $\mathrm A\xrightarrow{k_1}\mathrm B\xrightarrow{k_2}\mathrm C$ with only A present at $t=0$,
$$[\mathrm A]=[\mathrm A]_0e^{-k_1t},\qquad [\mathrm B]=\frac{k_1[\mathrm A]_0}{k_2-k_1}\bigl(e^{-k_1t}-e^{-k_2t}\bigr),\qquad [\mathrm C]=[\mathrm A]_0-[\mathrm A]-[\mathrm B],$$
and $[\mathrm B]=k_1t\,e^{-k_1t}[\mathrm A]_0$ when $k_1=k_2$. The intermediate rises, passes a single maximum at
$$t_{\max}=\frac{\ln(k_1/k_2)}{k_1-k_2},\qquad [\mathrm B]_{\max}=[\mathrm A]_0\Bigl(\frac{k_1}{k_2}\Bigr)^{k_2/(k_2-k_1)},$$
and then decays; the product C starts with zero slope (an induction period), so it is not formed at its fastest at $t=0$.`,
      idea: String.raw`The rate equations are linear: $\dot A=-k_1A$ is solved at once (1.5), and $\dot B=k_1A-k_2B$ is a first-order equation driven by the known function $A(t)$, solved with an integrating factor $e^{k_2t}$; C follows from mass conservation. The maximum of B is where inflow equals outflow, $k_1A=k_2B$, which is why it lies where $\dot B=0$. The formula is symmetric in $k_1\leftrightarrow k_2$ for B and C's late-time behaviour is governed by the smaller of the two rate constants, the seed of the rate-determining step (4.2).`,
      caption: String.raw`Slide $k_1$ and $k_2$ (log scale). The curves are the closed forms; the dots are an independent numerical integration of the rate equations, and the vertical line marks $t_{\max}$. Make $k_2\gg k_1$ and the induction period of C shrinks; make $k_2\ll k_1$ and B piles up and C waits for it. Tick the box to show the tangent to C at the origin: it is horizontal.`,
      deps: ['kin-1.5', 'ode-3.5'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['consecutive reactions', 'intermediates'],
      credit: 'Closed form by Harcourt & Esson, 1866 (Phil. Trans. R. Soc. 156)',
      verify: true,
      scope: String.raw`Two irreversible first-order (or pseudo-first-order) steps in a closed, constant-volume system with no other fate for B.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chemical_kinetics' },
      viz(v) {
        const k1 = v.slider('$k_1$ (s$^{-1}$)', 0.05, 5, 1, { log: true, sig: 2 });
        const k2 = v.slider('$k_2$ (s$^{-1}$)', 0.05, 5, 0.4, { log: true, sig: 2 });
        const tang = v.toggle('tangent to C at the origin', false);
        const s = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'time t (s)', ylabel: 'fraction of initial A', title: 'concentrations in units of $[\\mathrm A]_0$' });
        let info = {};
        v.render(() => {
          const a = k1.value, b = k2.value, T = Math.min(60, 6 / Math.min(a, b));
          s.setView([0, T], [0, 1.05]);
          s.fn((t) => abc(a, b, t)[0], { color: 'accent', width: 2.4, domain: [0, T] });
          s.fn((t) => abc(a, b, t)[1], { color: 'orange', width: 2.4, domain: [0, T] });
          s.fn((t) => abc(a, b, t)[2], { color: 'green', width: 2.4, domain: [0, T] });
          const sol = ode((t, y) => [-a * y[0], a * y[0] - b * y[1], b * y[1]], [1, 0, 0], T, { kmax: Math.max(a, b) });
          const pts = []; for (let i = 0; i <= 24; i++) { const t = T * i / 24, y = sol.at(t); pts.push([t, y[1]]); }
          s.dots(pts, { r: 3, color: 'ink' });
          const tm = Math.abs(a - b) < 1e-9 ? 1 / a : Math.log(a / b) / (a - b);
          const Bm = abc(a, b, tm)[1];
          s.vline(tm, { color: 'muted', dash: true });
          s.dot(tm, Bm, { r: 5, color: 'orange' });
          if (tang.value) s.line(0, 0, T, 0, { color: 'red', width: 1.6, dash: true });
          let maxNum = 0, tn = 0; for (let i = 0; i <= sol.n; i++) if (sol.ys[i][1] > maxNum) { maxNum = sol.ys[i][1]; tn = i * sol.h; }
          info = { tm, Bm, maxNum, tn, T };
        });
        v.legend([['accent', 'A'], ['orange', 'B (intermediate)'], ['green', 'C (product)'], ['ink', 'numerical integration', { dot: true }]]);
        v.readout(() => `$t_{\\max}=\\ln(k_1/k_2)/(k_1-k_2)=${nz(v, info.tm)}$ s, $[\\mathrm B]_{\\max}=${v.fix(info.Bm, 3)}$ ; numerical maximum $${v.fix(info.maxNum, 3)}$ at $${nz(v, info.tn)}$ s.\n$k_1/k_2=${v.fix(k1.value / k2.value, 2)}$: ${k1.value > k2.value ? 'B accumulates, C is slow to appear' : 'B stays small and C follows A'}.`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Concept', name: 'Rate-determining step',
      statement: String.raw`In a mechanism made of irreversible steps in sequence, $\mathrm A_0\xrightarrow{k_1}\mathrm A_1\xrightarrow{k_2}\cdots\xrightarrow{k_n}\mathrm A_n$, the mean time for a molecule to reach the end is $\sum_i 1/k_i$. If one step is much slower than the others, $k_s\ll k_i$ for $i\ne s$, the overall conversion is approximately first order with the rate constant of that step, $[\mathrm A_n]\approx[\mathrm A_0](1-e^{-k_st})$ after a short delay, and only that step's rate constant (and the species before it) appears in the observed rate law. The step is called rate-determining or rate-limiting. For a *branching* or reversible mechanism the notion is more delicate: it is the step whose rate constant, among the transition states and intermediates, has the largest influence on the overall rate.`,
      idea: String.raw`The sequence is a chain of linear first-order steps, so the time to complete is a sum of independent exponential waiting times (4.1). The mean is $\sum1/k_i$, dominated by the largest term, the slowest step. Fast steps after the bottleneck are drained as soon as material arrives, so their intermediates never accumulate; fast steps before it only hurry the queue to the front. The idea has an energetic twin in transition-state theory (3.2): the step with the highest transition state relative to the preceding intermediate is the slow one.`,
      caption: String.raw`Four steps in series with adjustable rate constants (log scale). Left: populations of all five species; the dashed curve is the one-step model $1-e^{-k_{\rm s}t}$ for the slowest step. Right: bars show where the material is at the chosen time. Make one constant 100 times smaller than the rest and the queue builds in front of it, and the dashed model lies on the product curve; make them all equal and no step is singled out.`,
      deps: ['kin-4.1'],
      refs: ['Houston'],
      tags: ['rate-determining step', 'bottleneck'],
      scope: String.raw`Irreversible first-order steps in series. With reversible steps or branching the rate-determining step is not simply the smallest rate constant.`,
      viz(v) {
        const ks = [1, 2, 3, 4].map((i) => v.slider(`$k_${i}$ (s$^{-1}$)`, 0.02, 50, [5, 5, 0.1, 5][i - 1], { log: true, sig: 2 }));
        const tt = v.slider('time $t$ (s)', 0, 40, 10, { step: 0.1 });
        const s = v.stage({ x: [0, 40], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'time t (s)', ylabel: 'fraction', title: 'populations of A₀ … A₄' , weight: 1.4});
        const b = v.stage({ x: [0.4, 5.6], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xticks: [[1, 'A₀'], [2, 'A₁'], [3, 'A₂'], [4, 'A₃'], [5, 'A₄']], title: 'where the material is at time $t$', weight: 1 });
        const cols = ['accent', 'orange', 'purple', 'teal', 'green'];
        let info = {};
        v.render(() => {
          const k = ks.map((x) => x.value), kmin = Math.min(...k), ks_ = k.indexOf(kmin);
          const mean = k.reduce((q, x) => q + 1 / x, 0);
          const T = clamp(4 * mean, 2, 400);
          tt.set(clamp(tt.value, 0, 400));
          s.setView([0, T], [0, 1.05]);
          const F = (t, y) => [-k[0] * y[0], k[0] * y[0] - k[1] * y[1], k[1] * y[1] - k[2] * y[2], k[2] * y[2] - k[3] * y[3], k[3] * y[3]];
          const sol = ode(F, [1, 0, 0, 0, 0], T, { kmax: Math.max(...k) });
          for (let j = 0; j < 5; j++) {
            const pts = []; for (let i = 0; i <= 300; i++) { const t = T * i / 300; pts.push([t, sol.at(t)[j]]); }
            s.path(pts, { color: cols[j], width: j === 4 ? 2.8 : 1.8 });
          }
          s.fn((t) => 1 - Math.exp(-kmin * t), { color: 'ink', dash: true, width: 1.6, domain: [0, T] });
          const tc = clamp(tt.value, 0, T); s.vline(tc, { color: 'muted', dash: true });
          const y = sol.at(tc);
          b.bars(y, { x0: 1, dx: 1, color: (val, i) => cols[i] });
          b.text(`slowest: step ${ks_ + 1}`, 0.6, 1.0, { size: 12, color: 'muted' });
          // effective: time at which A4 reaches 50 %
          let t50 = NaN; for (let i = 1; i <= sol.n; i++) if (sol.ys[i][4] >= 0.5) { t50 = i * sol.h; break; }
          info = { mean, kmin, ks_, t50, y4: y[4], model: 1 - Math.exp(-kmin * tc), tc, share: (1 / kmin) / mean };
        });
        v.legend([['accent', 'A₀'], ['orange', 'A₁'], ['purple', 'A₂'], ['teal', 'A₃'], ['green', 'A₄ (final)'], ['ink', 'slowest step alone', { dash: true }]]);
        v.readout(() => `mean time to finish $\\sum1/k_i=${nz(v, info.mean)}$ s; the slowest step ($k_${info.ks_ + 1}$) contributes $${v.fix(100 * info.share, 0)}\\%$ of it. Half of the final species by $t_{1/2}=${nz(v, info.t50)}$ s (one-step model: $\\ln2/k_{\\rm s}=${nz(v, Math.LN2 / info.kmin)}$ s).\nAt $t=${v.fix(info.tc, 1)}$ s: A₄ $=${v.fix(info.y4, 3)}$ against the one-step model $${v.fix(info.model, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Method', name: 'Steady-state approximation',
      statement: String.raw`If a reactive intermediate I is consumed much faster than it is formed, its concentration stays small and nearly constant after a brief start-up, and one may set $d[\mathrm I]/dt\approx0$ and solve the resulting *algebraic* equation for $[\mathrm I]$. For $\mathrm A\xrightarrow{k_1}\mathrm I\xrightarrow{k_2}\mathrm P$ this gives
$$[\mathrm I]_{\rm ss}=\frac{k_1}{k_2}[\mathrm A],\qquad \frac{d[\mathrm P]}{dt}=k_1[\mathrm A]\quad\Rightarrow\quad [\mathrm P]=[\mathrm A]_0\bigl(1-e^{-k_1t}\bigr).$$
It is accurate when $k_2\gg k_1$ and after a time of order $1/k_2$; the leading relative error of the product curve is of order $k_1/k_2$. The method is applied in the same way to every intermediate of a longer mechanism, and it replaces the coupled differential equations by a rate law in terms of the stable species only.`,
      idea: String.raw`Compare with the exact solution (4.1): $[\mathrm I]=\frac{k_1}{k_2-k_1}(e^{-k_1t}-e^{-k_2t})[\mathrm A]_0$. Once $e^{-k_2t}$ has died out, $[\mathrm I]=\frac{k_1}{k_2-k_1}[\mathrm A]$, which equals the steady-state value times $1/(1-k_1/k_2)$: the approximation is the first term of an expansion in the small parameter $k_1/k_2$. What the approximation discards is the start-up transient (duration $1/k_2$) and the small amount of material sitting in I. In a singular-perturbation language it is the slow manifold of the system, reached after a fast initial layer.`,
      caption: String.raw`Left: exact $[\mathrm I]$ (blue) and the steady-state value $k_1[\mathrm A]/k_2$ (orange, dashed); the product P exact (solid) and from the approximation (dashed). Right: the largest deviation of the approximate P from the exact one over all times, against $k_2/k_1$ (log–log), with a dot at your setting. Push $k_2/k_1$ below about 10 and the approximation visibly fails, a case examined in 4.5.`,
      deps: ['kin-4.1'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['steady state', 'approximation'],
      credit: 'Bodenstein, 1913 (the "Bodenstein stationary-state principle"); Chapman & Underhill, 1913',
      verify: true,
      scope: String.raw`Valid when the intermediate is formed slowly and consumed quickly, and for times long compared with its lifetime; it can fail early in the reaction, or when the intermediate builds up.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Steady-state_approximation' },
      viz(v) {
        const ratio = v.slider('$k_2/k_1$', 0.2, 1000, 20, { log: true, sig: 2 });
        const a = 1;
        const s = v.stage({ x: [0, 5], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'time $t$ ($k_1=1$)', ylabel: 'concentration / [A]₀', title: 'intermediate and product', weight: 1.2 });
        const e = v.stage({ x: [0.2, 1000], y: [1e-4, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$k_2/k_1$', ylabel: 'max |ΔP|', title: 'worst error of the approximation', weight: 1 });
        const exact = (k2, t) => { const r = abc(a, k2, t); return { A: r[0], I: r[1], P: r[2] }; };
        const maxErr = (k2) => { let m = 0; for (let i = 1; i <= 400; i++) { const t = 12 * i / 400; m = Math.max(m, Math.abs(exact(k2, t).P - (1 - Math.exp(-t)))); } return m; };
        const curve = logspace(0.2, 1000, 60).map((r) => [r, maxErr(r)]);
        let info = {};
        v.render(() => {
          const k2 = ratio.value, T = 5;
          s.fn((t) => exact(k2, t).I, { color: 'accent', width: 2.4, domain: [0, T] });
          s.fn((t) => Math.exp(-t) / k2, { color: 'orange', width: 2, dash: true, domain: [0, T] });
          s.fn((t) => exact(k2, t).P, { color: 'green', width: 2.4, domain: [0, T] });
          s.fn((t) => 1 - Math.exp(-t), { color: 'ink', width: 1.8, dash: true, domain: [0, T] });
          s.setView([0, T], [0, Math.max(1.05, 0)]);
          e.path(curve, { color: 'accent', width: 2.2 });
          const me = maxErr(k2); e.dot(k2, Math.max(me, 1.5e-4), { r: 6, color: 'orange' });
          e.fn((r) => 1 / r, { color: 'faint', dash: true, domain: [0.2, 1000] });
          const t1 = 3; const ex = exact(k2, t1);
          info = { me, Iex: ex.I, Iss: Math.exp(-t1) / k2, t1 };
        });
        v.legend([['accent', 'I exact'], ['orange', 'I steady-state', { dash: true }], ['green', 'P exact'], ['ink', 'P steady-state', { dash: true }]]);
        v.readout(() => `$k_2/k_1=${nz(v, ratio.value, 3)}$: largest error in [P] $=${v.sci(info.me, 2)}$ (compare $k_1/k_2=${v.sci(1 / ratio.value, 2)}$, the faint line on the right).\nAt $t=${info.t1}/k_1$: $[\\mathrm I]_{\\rm exact}=${v.sci(info.Iex, 3)}$, $[\\mathrm I]_{\\rm ss}=${v.sci(info.Iss, 3)}$, ratio $${v.fix(info.Iex / info.Iss, 3)}$ (the exact value of this ratio is $1/(1-k_1/k_2)$ at long times).`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Method', name: 'Pre-equilibrium approximation',
      statement: String.raw`In $\mathrm A\underset{k_{-1}}{\overset{k_1}{\rightleftharpoons}}\mathrm B\xrightarrow{k_2}\mathrm P$ suppose the first step is much faster than the second, $k_{-1}\gg k_2$. Then A and B reach their equilibrium ratio $[\mathrm B]=K[\mathrm A]$, $K=k_1/k_{-1}$, at once and stay there while P forms slowly:
$$\frac{d[\mathrm P]}{dt}=k_2[\mathrm B]=k_2K[\mathrm A]=\frac{Kk_2}{1+K}\bigl([\mathrm A]_0-[\mathrm P]\bigr).$$
The observed rate constant is $k_{\rm eff}=Kk_2/(1+K)$, which reduces to $Kk_2$ when $K\ll1$: it contains the equilibrium constant of the fast step, so its temperature dependence is that of $K k_2$ with apparent activation energy $\Delta H^\circ+E_2$. The result agrees with the steady-state treatment of B in the limit $k_{-1}\gg k_2$ and breaks down when $k_2$ becomes comparable to $k_{-1}$.`,
      idea: String.raw`Treat the steady-state formula for B (4.3) with its two exit routes: $[\mathrm B]_{\rm ss}=k_1[\mathrm A]/(k_{-1}+k_2)$. If $k_2\ll k_{-1}$ the denominator is $k_{-1}$ and B sits at $K[\mathrm A]$, the thermodynamic ratio; the slow leak into P barely disturbs it. If $k_2$ is large, nearly every B goes forward and the first step, not the equilibrium, controls the rate ($k_{\rm eff}\to k_1$). The pre-equilibrium result is therefore the limit of the steady-state formula in which the first step stays at equilibrium; it is how thermodynamic quantities such as $K$ enter rate laws (1.9).`,
      caption: String.raw`Left: A, B (solid) and P for the full mechanism, with the pre-equilibrium prediction of P (dashed) and of B, $K[\mathrm A]$ (dotted). Right: the exact rate constant of the slow decay of A+B (from the 2×2 rate matrix) and the steady-state value against $k_2$, with the pre-equilibrium plateau $Kk_2/(1+K)$ drawn in orange. Raise $k_2$ toward $k_{-1}$ and the dashed curve peels off: the equilibrium is being drained faster than it is restored.`,
      deps: ['kin-1.9', 'kin-4.3'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['pre-equilibrium', 'equilibrium constant'],
      scope: String.raw`Requires a fast reversible first step ($k_{-1}\gg k_2$) and an intermediate that is not itself observed to accumulate beyond $K[\mathrm A]$.`,
      viz(v) {
        const K = v.slider('$K=k_1/k_{-1}$', 0.01, 3, 0.2, { log: true, sig: 2 });
        const kf = v.slider('$k_{-1}$ (s$^{-1}$)', 1, 1000, 100, { log: true, sig: 2 });
        const k2s = v.slider('$k_2$ (s$^{-1}$)', 0.01, 300, 1, { log: true, sig: 2 });
        const s = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'time t (s)', ylabel: 'concentration / [A]₀', title: 'full mechanism and pre-equilibrium', weight: 1.2 });
        const g = v.stage({ x: [0.01, 300], y: [1e-3, 300], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: '$k_2$ (s$^{-1}$)', ylabel: 'slow rate constant (s$^{-1}$)', title: 'effective first-order rate constant', weight: 1 });
        const lam = (K_, km, k2) => {   // slow eigenvalue magnitude of [[-k1, km],[k1, -km-k2]]
          const k1 = K_ * km, tr = k1 + km + k2, det = k1 * k2;
          return (tr - Math.sqrt(Math.max(0, tr * tr - 4 * det))) / 2;
        };
        let info = {};
        v.render(() => {
          const Kv = K.value, km = kf.value, k1 = Kv * km, k2 = k2s.value, keff = Kv * k2 / (1 + Kv), lamS = lam(Kv, km, k2);
          const T = clamp(4 / Math.min(lamS, 1e3), 0.02, 60);
          const sol = ode((t, y) => [-k1 * y[0] + km * y[1], k1 * y[0] - (km + k2) * y[1], k2 * y[1]], [1, 0, 0], T, { kmax: km * (1 + Kv) + k2 });
          s.setView([0, T], [0, 1.05]);
          const P = (j) => { const p = []; for (let i = 0; i <= 300; i++) { const t = T * i / 300; p.push([t, sol.at(t)[j]]); } return p; };
          s.path(P(0), { color: 'accent', width: 2.2 }); s.path(P(1), { color: 'orange', width: 2.2 }); s.path(P(2), { color: 'green', width: 2.4 });
          s.fn((t) => 1 - Math.exp(-keff * t), { color: 'ink', dash: true, width: 1.7, domain: [0, T] });
          s.path(P(0).map(([t]) => [t, Kv * Math.exp(-keff * t) / (1 + Kv)]), { color: 'muted', dash: [2, 3], width: 1.6 });
          g.fn((x) => lam(Kv, km, x), { color: 'accent', width: 2.4, domain: [0.01, 300] });
          g.fn((x) => Kv * x / (1 + Kv), { color: 'orange', width: 1.8, dash: true, domain: [0.01, 300] });
          g.fn((x) => Kv * km * x / (km + x), { color: 'purple', width: 1.5, dash: [2, 3], domain: [0.01, 300] });
          g.vline(km, { color: 'faint', dash: true });
          g.dot(k2, Math.max(lamS, 1.2e-3), { r: 6, color: 'gold' });
          const Pexact = sol.at(T / 2)[2], Ppre = 1 - Math.exp(-keff * T / 2);
          info = { keff, lamS, k2, km, Pexact, Ppre, T, Bratio: sol.at(T / 2)[1] / Math.max(1e-12, sol.at(T / 2)[0]) };
        });
        v.legend([['accent', 'A (full)'], ['orange', 'B (full)'], ['green', 'P (full)'], ['ink', 'P pre-equilibrium', { dash: true }], ['muted', 'B = K·A', { dash: [2, 3] }], ['purple', 'steady-state rate constant', { dash: [2, 3] }]]);
        v.readout(() => `$k_2/k_{-1}=${nz(v, info.k2 / info.km, 2)}$ — ${info.k2 / info.km < 0.1 ? 'the first step stays at equilibrium' : 'the equilibrium is being drained'}. Exact slow rate constant $${nz(v, info.lamS)}$ s$^{-1}$, pre-equilibrium $Kk_2/(1+K)=${nz(v, info.keff)}$ s$^{-1}$.\nHalfway through the run [B]/[A] $=${v.fix(info.Bratio, 3)}$ against $K=${v.fix(K.value, 3)}$; [P] exact $${v.fix(info.Pexact, 3)}$, pre-equilibrium $${v.fix(info.Ppre, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Paradox', name: 'When the steady-state approximation fails',
      statement: String.raw`"The intermediate is reactive, so set its rate of change to zero" is not a theorem. The steady-state approximation needs a *small parameter* and a *time scale separation*, not just a short-lived species: it holds on the slow manifold, reached after an initial layer of duration $\sim1/k_2$ in which the intermediate is still being established, and its error is of relative order $\varepsilon=k_1/k_2$. For $\mathrm A\xrightarrow{k_1}\mathrm I\xrightarrow{k_2}\mathrm P$ the exact long-time ratio is $[\mathrm I]/[\mathrm A]=k_1/(k_2-k_1)$, not $k_1/k_2$; for $k_2<k_1$ the intermediate accumulates and the approximation is wrong by a large factor. A highly reactive intermediate that is also formed in a burst (large initial amount, or a fast first step) is not in a steady state either.`,
      idea: String.raw`Write the exact equations as $\dot A=-k_1A,\ \dot I=k_1A-k_2I$. The line $I=\frac{k_1}{k_2-k_1}A$ is invariant (the eigenvector of the slow eigenvalue $-k_1$), and every trajectory is attracted to it at rate $k_2$. Setting $\dot I=0$ replaces it by $I=\frac{k_1}{k_2}A$, a different line unless $k_1\ll k_2$. What matters is therefore the ratio of the two eigenvalues, the separation of time scales (as in singular perturbation theory with small parameter $\varepsilon$), and the initial condition's distance from the slow manifold; "short-lived" only controls the first.`,
      caption: String.raw`Left: the phase plane of $(A,I)$ with the true slow manifold (green) and the steady-state line (orange dashed); the trajectory starts at $(1,I_0)$ and hugs the green line after the initial layer. Right: $[\mathrm I]$ against time, exact and steady-state. Lower $k_2/k_1$ toward 1, or start with $I_0>0$, and the orange line misses the trajectory; at $k_2<k_1$ the slow manifold is the steeper line and the approximation is useless.`,
      deps: ['kin-4.3'],
      refs: ['Steinfeld et al.'],
      tags: ['steady state', 'time scales'],
      scope: String.raw`Two-step linear example, where the slow manifold is known in closed form; in nonlinear mechanisms the same conditions apply with the manifold found numerically.`,
      viz(v) {
        const ratio = v.slider('$k_2/k_1$', 0.3, 200, 3, { log: true, sig: 2 });
        const I0 = v.slider('initial intermediate $[\\mathrm I]_0$', 0, 1, 0, { step: 0.01 });
        const ph = v.stage({ x: [0, 1.05], y: [0, 1.6], axes: 'box', gutter: true, height: 330, xlabel: '[A]', ylabel: '[I]', title: 'phase plane (A, I)', weight: 1 });
        const ts = v.stage({ x: [0, 6], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time ($k_1=1$)', ylabel: '[I]', title: 'intermediate against time', weight: 1 });
        let info = {};
        v.render(() => {
          const k2 = ratio.value, i0 = I0.value, T = 6;
          const F = (t, y) => [-y[0], y[0] - k2 * y[1]];
          const sol = ode(F, [1, i0], T, { kmax: Math.max(1, k2) });
          const slope = 1 / (k2 - 1), slopeSS = 1 / k2;
          const manifold = k2 > 1 + 1e-6 ? slope : null;
          ph.line(0, 0, 1.05, 1.05 * slopeSS, { color: 'orange', width: 2, dash: true });
          if (manifold !== null) ph.line(0, 0, 1.05, Math.min(1.6, 1.05 * manifold), { color: 'green', width: 2.2 });
          else ph.line(0, 0, 1.05, Math.min(1.6, 1.05 * 1.0), { color: 'faint', width: 1, dash: true });
          const tr = []; for (let i = 0; i <= 400; i++) { const y = sol.at(T * i / 400); tr.push([y[0], y[1]]); }
          ph.path(tr, { color: 'accent', width: 2.4 });
          ph.dot(1, i0, { r: 5, color: 'gold' });
          // time series
          const ex = []; for (let i = 0; i <= 400; i++) { const t = T * i / 400; ex.push([t, sol.at(t)[1]]); }
          ts.path(ex, { color: 'accent', width: 2.4 });
          ts.fn((t) => Math.exp(-t) / k2, { color: 'orange', width: 2, dash: true, domain: [0, T] });
          const ymax = Math.max(0.1, ...ex.map((p) => p[1])) * 1.1; ts.setView([0, T], [0, ymax]);
          const t3 = 3, y3 = sol.at(t3);
          info = { k2, ratioEx: y3[1] / y3[0], ratioSS: 1 / k2, long: k2 > 1 ? 1 / (k2 - 1) : NaN, t3 };
        });
        v.legend([['accent', 'exact trajectory'], ['green', 'true slow manifold'], ['orange', 'steady-state line', { dash: true }]]);
        v.readout(() => `At $t=${info.t3}/k_1$: $[\\mathrm I]/[\\mathrm A]=${nz(v, info.ratioEx)}$ (exact), steady-state prediction $k_1/k_2=${nz(v, info.ratioSS)}$ — error factor $${v.fix(info.ratioEx / info.ratioSS, 2)}$.\nSmall parameter $\\varepsilon=k_1/k_2=${nz(v, 1 / info.k2, 2)}$; ${info.k2 > 1 ? `slow-manifold slope $k_1/(k_2-k_1)=${nz(v, info.long)}$.` : 'for $k_2<k_1$ I accumulates and no steady state is reached.'}`);
      },
    },
  ],
};
