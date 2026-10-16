// Mathematical Biology — Chapter 1 (part b): outbreaks, harvesting and delays
import { traj1, roots1, d1, ddeRun, lambertRoots } from './ch01.shared.js';

// ---- spruce budworm (Ludwig–Jones–Holling, nondimensional): du/dt = r u (1 - u/q) - u^2/(1+u^2) ----
const bwF = (r, q) => (u) => r * u * (1 - u / q) - (u * u) / (1 + u * u);
function bwEq(r, q) {
  const F = bwF(r, q), G = (u) => r * (1 - u / q) - u / (1 + u * u);
  return roots1(G, 1e-6, q, 1800).map((u) => ({ u, lam: d1(F, u, 1e-5) }));
}
/** The equilibrium curve q(u) = r u (1+u²) / (r(1+u²) − u), split into runs of constant stability. */
function bwBranches(r, umax) {
  const runs = []; let cur = null;
  for (let i = 1; i <= 1600; i++) {
    const u = (umax * i) / 1600, den = r * (1 + u * u) - u;
    if (den <= 1e-9) { cur = null; continue; }
    const q = (r * u * (1 + u * u)) / den;
    const stable = r * (1 - (2 * u) / q) - (2 * u) / Math.pow(1 + u * u, 2) < 0;
    if (!cur || cur.stable !== stable) { const prev = cur && cur.pts[cur.pts.length - 1]; cur = { stable, pts: prev ? [prev] : [] }; runs.push(cur); }
    cur.pts.push([q, u]);
  }
  return runs;
}
/** Folds (saddle-node points): local max and min of q(u). */
function bwFolds(r) {
  let prevq = null, prevd = 0, out = {};
  for (let i = 1; i <= 8000; i++) {
    const u = (30 * i) / 8000, den = r * (1 + u * u) - u;
    if (den <= 1e-9) { prevq = null; continue; }
    const q = (r * u * (1 + u * u)) / den;
    if (prevq != null) {
      const dq = q - prevq;
      if (prevd > 0 && dq < 0) out.B = { q: prevq, u };
      if (prevd < 0 && dq > 0) out.A = { q: prevq, u };
      prevd = dq || prevd;
    }
    prevq = q;
  }
  return out;
}

export default {
  collection: 'mathbio',
  chapter: 1,
  items: [
    {
      num: '1.10',
      kind: 'Model',
      name: 'Spruce budworm outbreak model',
      credit: 'Ludwig, Jones & Holling, 1978',
      statement: String.raw`In dimensionless form the budworm density $u$ obeys
$$\frac{du}{dt}=r\,u\Bigl(1-\frac uq\Bigr)-\frac{u^2}{1+u^2},$$
logistic growth with scaled capacity $q$ (set by the foliage of the forest) and a sigmoidal (type III) loss to bird predation that saturates at $1$. Equilibria $u>0$ are the intersections of the line $r(1-u/q)$ with the hump $u/(1+u^2)$: for suitable $r$ there is one intersection at small and large $q$, but three for intermediate $q$ (a low "refuge" level, an unstable threshold and a high "outbreak" level); $u=0$ is always unstable.`,
      idea: String.raw`Birds eat little when budworms are rare, eat a nearly fixed number when they are abundant, and hence control the population only in a middle range. Growth minus predation is a cubic-like function of $u$ whose shape depends on $q$, and its zeros come and go as the line $r(1-u/q)$ tilts: sliding $q$ moves the line's intercept, and tangencies with the hump create or destroy pairs of equilibria (a saddle-node, studied in 1.11).`,
      scope: String.raw`A slow–fast caricature of one stand of fir: the model treats foliage ($q$) as a fixed parameter although it varies on a much slower timescale than the budworm. Three equilibria occur for $r$ roughly between $0.5$ and $0.66$ in these units.`,
      caption: String.raw`Left: growth line and predation curve; their crossings are the equilibria (green stable, hollow red unstable). Slowly raise the forest capacity $q$: the number of crossings goes $1\to3\to1$. Middle: populations started at several sizes settle on the refuge or the outbreak level. Right: the full equilibrium curve against $q$ with the current $q$ marked.`,
      deps: ['mathbio-1.4', 'mathbio-1.5'],
      tags: ['outbreaks', 'bistability'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$', 0.45, 0.65, 0.55, { step: 0.005 });
        const q = v.slider('forest capacity $q$', 2, 20, 8, { step: 0.05 });
        const TM = 40;
        const L = v.stage({ x: [0, 14], y: [0, 0.7], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'u', ylabel: 'rate', title: 'growth line against predation curve' });
        const M = v.stage({ x: [0, TM], y: [0, 14], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 't', ylabel: 'u(t)', title: 'budworm density' });
        const R = v.stage({ x: [0, 20], y: [0, 20], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'q', ylabel: 'equilibrium u', title: 'equilibria against $q$' });
        let eq = [], branches = [], bkey = null;
        v.legend([['accent', 'growth $r(1-u/q)$'], ['orange', 'predation $u/(1+u^2)$'], ['green', 'stable', { dot: true }], ['red', 'unstable', { dot: true }]]);
        v.render(() => {
          const rv = r.value, qv = q.value, F = bwF(rv, qv);
          eq = bwEq(rv, qv);
          const top = Math.min(22, Math.max(6, qv * 1.1));
          L.setView([0, top], [-0.05, 0.75]);
          M.setView([0, TM], [0, top]);
          L.hline(0, { color: 'muted' });
          L.fn((u) => rv * (1 - u / qv), { domain: [0, Math.min(qv, top)], color: 'accent', width: 3 });
          L.fn((u) => u / (1 + u * u), { domain: [0, top], color: 'orange', width: 3 });
          for (const e of eq) L.dot(e.u, e.u / (1 + e.u * e.u), { r: 6.5, color: e.lam < 0 ? 'green' : 'red', hollow: e.lam > 0, width: 2.4 });
          for (const u0 of [0.15, 0.5, 1, 1.8, 2.6, 4, 7, 11, 16]) if (u0 < top) M.path(traj1((t, u) => F(u), u0, TM, 300), { color: 'muted', width: 1.3, alpha: 0.65 });
          for (const e of eq) M.hline(e.u, { color: e.lam < 0 ? 'green' : 'red', dash: [5, 5], alpha: 0.7 });
          if (bkey !== rv) { bkey = rv; branches = bwBranches(rv, 24); }
          for (const b of branches) R.path(b.pts, { color: b.stable ? 'green' : 'red', width: 2.6, dash: b.stable ? undefined : [5, 4] });
          R.vline(qv, { color: 'gold', width: 1.6 });
          for (const e of eq) R.dot(qv, e.u, { r: 5.5, color: 'gold' });
        });
        v.readout(() => String.raw`$q=${v.fix(q.value, 2)}$: ${eq.length} positive equilibri${eq.length === 1 ? 'um' : 'a'} (${eq.length === 3 ? 'refuge, threshold, outbreak' : eq[0] && eq[0].u < 2.5 ? 'only the refuge state' : 'only the outbreak state'}): ` + eq.map((e) => String.raw`$u^*=${v.fix(e.u, 2)}$ (${e.lam < 0 ? 'stable' : 'unstable'})`).join(', '));
      },
    },
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Saddle-node bifurcation and hysteresis',
      statement: String.raw`For $\dot u=F(u;q)$ a **saddle-node bifurcation** occurs at $(u_c,q_c)$ when $F=0$ and $\partial_uF=0$ but $\partial_qF\neq0$ and $\partial_u^2F\neq0$: two equilibria, one stable and one unstable, merge and vanish as $q$ passes $q_c$. In the budworm model the equilibrium curve is S-shaped with two such folds $q_A<q_B$. If $q$ is varied slowly the population stays on its current branch: it jumps up to the outbreak branch only when $q$ exceeds $q_B$, and falls back only when $q$ drops below the lower value $q_A$. The state therefore depends on the history of $q$, not on $q$ alone: **hysteresis**.`,
      idea: String.raw`Between $q_A$ and $q_B$ two different stable states coexist (1.10). A stable branch is followed adiabatically until it ceases to exist at a fold, where $\partial_uF=0$ and the stable direction disappears; the state then relaxes quickly to the only remaining attractor. The jump up and the jump down happen at different folds, which opens the loop. Recovery from an outbreak therefore requires lowering $q$ far below the value at which the outbreak began (via, for example, forest thinning).`,
      scope: String.raw`Adiabatic parameter sweep: the loop gets wider if $q$ changes faster than the population relaxes. Needs $r$ in the range with three equilibria.`,
      caption: String.raw`Watch $q$ rise from $3$ to $18$ and fall back (orange up, teal down). The trace sticks to its branch, jumps up only beyond the fold $q_B$ and returns only below $q_A\ne q_B$. Shorten the sweep time and the jumps are delayed further past the folds (a very fast sweep never jumps at all); lengthen it and they approach the folds.`,
      deps: ['mathbio-1.10', 'ode-8.3'],
      tags: ['hysteresis', 'saddle-node'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$', 0.5, 0.64, 0.55, { step: 0.005 });
        const P = v.slider('sweep time', 40, 4000, 2000, { log: true, sig: 2 });
        const QLO = 3, QHI = 18, DT = 0.1;
        const L = v.stage({ x: [0, QHI + 1], y: [0, 16], axes: 'box', gutter: true, height: 340, weight: 1.15, minWidth: 300, xlabel: 'q', ylabel: 'u', title: 'population against forest capacity $q$' });
        const T = v.stage({ x: [0, 1], y: [0, 16], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'time (fraction of sweep)', ylabel: 'u', title: 'population through the sweep' });
        let cache = { key: '' }, branches = [], folds = {}, bk = null, rep = {};
        const simulate = () => {
          const rv = r.value, Pv = P.value, key = `${rv}|${Pv}`;
          if (cache.key === key) return cache;
          let u = 0.1; { const F0 = bwF(rv, QLO); for (let i = 0; i < 3000; i++) u += 0.1 * F0(u); }
          const n = Math.round(Pv / DT), qs = new Float64Array(n + 1), us = new Float64Array(n + 1);
          const qt = (t) => (t < Pv / 2 ? QLO + ((QHI - QLO) * 2 * t) / Pv : QHI - ((QHI - QLO) * 2 * (t - Pv / 2)) / Pv);
          for (let i = 0; i <= n; i++) {
            const t = i * DT; qs[i] = qt(t); us[i] = u;
            const f = (tt, x) => bwF(rv, qt(tt))(x);
            const k1 = f(t, u), k2 = f(t + DT / 2, u + (DT / 2) * k1), k3 = f(t + DT / 2, u + (DT / 2) * k2), k4 = f(t + DT, u + DT * k3);
            u = Math.max(1e-6, u + (DT / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
          }
          cache = { key, n, qs, us };
          return cache;
        };
        v.legend([['orange', 'q increasing'], ['teal', 'q decreasing'], ['green', 'stable branch', { dash: false }], ['red', 'unstable branch', { dash: true }]]);
        v.animate((tt) => {
          const rv = r.value, c = simulate();
          if (bk !== rv) { bk = rv; branches = bwBranches(rv, 24); folds = bwFolds(rv); }
          const idx = Math.max(1, Math.min(c.n, Math.round((tt / 14) * c.n)));
          for (const b of branches) L.path(b.pts, { color: b.stable ? 'green' : 'red', width: 2, alpha: 0.55, dash: b.stable ? undefined : [5, 4] });
          const half = c.n / 2;
          const up = [], dn = [];
          for (let i = 0; i <= idx; i += 3) (i <= half ? up : dn).push([c.qs[i], c.us[i]]);
          if (idx > half && dn.length && up.length) dn.unshift(up[up.length - 1]);
          L.path(up, { color: 'orange', width: 3.2 }); L.path(dn, { color: 'teal', width: 3.2 });
          L.dot(c.qs[idx], c.us[idx], { r: 7, color: 'gold' });
          if (folds.A && folds.B) { L.vline(folds.A.q, { color: 'teal', dash: [3, 5], alpha: 0.8 }); L.vline(folds.B.q, { color: 'orange', dash: [3, 5], alpha: 0.8 }); L.tex('q_A', folds.A.q, 15.2, { color: 'teal', align: 'center' }); L.tex('q_B', folds.B.q, 15.2, { color: 'orange', align: 'center' }); }
          // time plot
          T.vband(0, 0.5, { color: 'orange', alpha: 0.07 }); T.vband(0.5, 1, { color: 'teal', alpha: 0.07 });
          const pts = []; for (let i = 0; i <= idx; i += 3) pts.push([i / c.n, c.us[i]]);
          T.path(pts, { color: 'accent', width: 2.8 });
          T.dot(idx / c.n, c.us[idx], { r: 6, color: 'gold' });
          T.tex('q\\ \\text{rising}', 0.25, 15, { color: 'orange', align: 'center' }); T.tex('q\\ \\text{falling}', 0.75, 15, { color: 'teal', align: 'center' });
          // observed jumps (full sweep)
          let jUp = null, jDn = null;
          if (folds.A && folds.B) {
            for (let i = 1; i <= c.n; i++) {
              if (jUp == null && i <= half && c.us[i] > folds.A.u && c.us[i - 1] <= folds.A.u ) jUp = c.qs[i];
              if (jDn == null && i > half && c.us[i] < folds.B.u && c.us[i - 1] >= folds.B.u) jDn = c.qs[i];
            }
          }
          rep = { jUp, jDn };
        }, { period: 14, still: 13.9 });
        v.readout(() => folds.A && folds.B ? String.raw`folds from $\partial_uF=0$: $q_B=${v.fix(folds.B.q, 2)}$ (up), $q_A=${v.fix(folds.A.q, 2)}$ (down)
 observed jumps in this sweep: up at $q\approx${rep.jUp == null ? '\\text{—}' : v.fix(rep.jUp, 2)}$, down at $q\approx${rep.jDn == null ? '\\text{—}' : v.fix(rep.jDn, 2)}$ — width of the hysteresis loop $\approx ${rep.jUp != null && rep.jDn != null ? v.fix(rep.jUp - rep.jDn, 2) : '\\text{—}'}$` : String.raw`at this $r$ the equilibrium curve has no folds: no hysteresis`);
      },
    },
    {
      num: '1.12',
      kind: 'Model',
      name: 'Harvesting: constant quota versus constant effort',
      statement: String.raw`Harvest a logistic stock, $\dot N = rN(1-N/K) - H(N)$. With a **constant quota** $H(N)=h$, equilibria solve $rN(1-N/K)=h$: for $h<rK/4$ there are two, $N_\pm=\tfrac K2\bigl(1\pm\sqrt{1-4h/(rK)}\bigr)$ with $N_+$ stable and $N_-$ unstable; for $h>rK/4$ there are none and every stock is driven to extinction in finite time. With **constant effort** $H(N)=EN$ (catch proportional to stock; $E$ the harvest rate), equilibria are $N=0$ and $N^*=K(1-E/r)$; for $E<r$ the latter is stable and the stock never collapses by itself, for $E>r$ extinction is the only equilibrium.`,
      idea: String.raw`Equilibria are intersections of the growth parabola $rN(1-N/K)$ with the harvest curve (a horizontal line, or a line of slope $E$ through the origin); stability is read off from whether growth exceeds or falls short of harvest on each side (1.5). A quota ignores the stock, so below $N_-$ the harvest exceeds the growth and drives the stock down faster as it shrinks; effort scales down with the stock and so is self-limiting.`,
      caption: String.raw`Choose quota or effort and drag the harvest level. Left: the intersection points (green stable, hollow red unstable). Right: the integrated stock from the gold starting size; try a quota above $rK/4 = 12.5$ or a starting stock below the unstable $N_-$.`,
      deps: ['mathbio-1.4', 'ode-1.11'],
      tags: ['harvesting', 'fisheries'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const R0 = 0.5, K = 100;
        const mode = v.select('harvesting policy', [{ value: 'quota', label: 'constant quota' }, { value: 'effort', label: 'constant effort' }], 'quota');
        const hq = v.slider('quota $h$', 0, 16, 9, { step: 0.1 });
        const he = v.slider('effort $E$', 0, 0.7, 0.2, { step: 0.005 });
        const TM = 40;
        const A = v.stage({ x: [0, 110], y: [-2, 16], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'N', ylabel: 'growth, harvest', title: 'growth and harvest curves' });
        const B = v.stage({ x: [0, TM], y: [0, 120], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 't (years)', ylabel: 'N(t)', title: 'the stock through time' });
        const H = B.handle(0, 35, { color: 'gold', label: '$N_0$', labelPos: 'ne', constrain: (x, y) => [0, v.M.clamp(y, 1, 115)] });
        let eq = [], tail = '', yieldv = 0;
        v.legend([['accent', 'growth $rN(1-N/K)$'], ['red', 'harvest'], ['green', 'stable', { dot: true }], ['gold', 'stock', { dash: false }]]);
        v.render(() => {
          const quota = mode.value === 'quota';
          hq.el.hidden = !quota; he.el.hidden = quota;
          const harv = quota ? () => hq.value : (n) => he.value * n;
          const f = (n) => R0 * n * (1 - n / K);
          const G = (n) => f(n) - harv(n);
          A.hline(0, { color: 'muted' });
          A.fn(f, { domain: [0, 110], color: 'accent', width: 3 });
          A.fn(harv, { domain: [0, 110], color: 'red', width: 2.6 });
          A.fn((n) => Math.max(f(n), harv(n)), { domain: [0, 110], color: 'faint', width: 0 });
          eq = roots1(G, 0, 110, 1100).map((x) => ({ x, lam: d1(G, x, 1e-4) }));
          if (!quota) { /* the origin is always an equilibrium of effort harvesting */ if (!eq.some((e) => e.x < 1e-6)) eq.unshift({ x: 0, lam: R0 - he.value }); }
          for (const e of eq) { A.dot(e.x, harv(e.x), { r: 6.5, color: e.lam < 0 ? 'green' : 'red', hollow: e.lam > 0, width: 2.4 }); }
          const tr = traj1((t, n) => G(n), H.y, TM, 400, 0);
          const dead = tr[tr.length - 1][1] <= 0;
          B.path(tr, { color: 'gold', width: 3.2 });
          for (const e of eq) if (e.x > 0.5) B.hline(e.x, { color: e.lam < 0 ? 'green' : 'red', dash: [5, 5], alpha: 0.7 });
          if (dead) B.dot(tr[tr.length - 1][0], 0, { r: 7, color: 'red' });
          const fin = tr[tr.length - 1][1];
          tail = dead ? String.raw`the stock collapses at $t=${v.fix(tr[tr.length - 1][0], 1)}$ years` : String.raw`the stock settles at $N=${v.fix(fin, 1)}$, a sustained yield of $${v.fix(quota ? hq.value : he.value * fin, 2)}$ per year`;
        });
        v.readout(() => (mode.value === 'quota' ? String.raw`$h=${v.fix(hq.value, 1)}$ vs $rK/4=${v.fix((R0 * K) / 4, 1)}$: ${hq.value < (R0 * K) / 4 ? 'two equilibria' : 'no equilibrium with positive stock'}` : String.raw`$E=${v.fix(he.value, 3)}$ vs $r=${R0}$: ${he.value < R0 ? String.raw`stable stock $N^*=K(1-E/r)=${v.fix(K * (1 - he.value / R0), 1)}$` : 'extinction is the only equilibrium'}`) + '\n' + tail + '; equilibria: ' + eq.map((e) => String.raw`$${v.fix(e.x, 1)}$ (${e.lam < 0 ? 'stable' : 'unstable'})`).join(', '));
      },
    },
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Maximum sustainable yield at K/2',
      statement: String.raw`For logistic growth under constant-effort harvesting at rate $E$ the equilibrium stock is $N^*(E)=K(1-E/r)$ and the sustained yield is $Y(E)=EN^*=EK(1-E/r)$, $0\le E\le r$. The yield is maximal at $E_{\rm MSY}=r/2$, where $N^*=K/2$ and the **maximum sustainable yield** is $Y_{\max}=rK/4$, the peak of the growth parabola. More effort beyond $E_{\rm MSY}$ lowers the yield while lowering the stock.`,
      idea: String.raw`At equilibrium the catch equals the growth rate $f(N^*)=rN^*(1-N^*/K)$ — so the best sustainable catch is the maximum of $f$ — and that maximum, by the vertex of a parabola (pma-5.8: set $f'=0$), is at $N=K/2$. The effort line $EN$ passes through that peak exactly when $E=r/2$. Equivalently $Y(E)$ is itself a downward parabola in $E$ with zeros $0$ and $r$.`,
      scope: String.raw`Deterministic logistic stock, harvest proportional to stock, immediate response. In practice the target is usually set below MSY because the stock and $r$ are uncertain (1.14).`,
      credit: 'Schaefer, 1954; Graham, 1935',
      caption: String.raw`Drag the gold handle along the yield curve (horizontal axis: effort $E$). Right: the effort line meets the growth parabola at $N^*$; the vertical gap there is the yield. The line passes through the top of the parabola exactly at the maximum of $Y(E)$.`,
      deps: ['mathbio-1.12', 'pma-5.8'],
      tags: ['harvesting', 'maximum sustainable yield'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$', 0.2, 1, 0.5, { step: 0.01 });
        const K = v.slider('$K$', 50, 200, 100, { step: 1 });
        const A = v.stage({ x: [0, 1], y: [0, 30], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'effort E', ylabel: 'sustained yield Y(E)', title: 'yield against effort' });
        const B = v.stage({ x: [0, 200], y: [0, 30], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'N', ylabel: 'growth, catch', title: 'growth parabola and effort line' });
        const hE = A.handle(0.25, 0, { color: 'gold', constrain: (x) => { const e = v.M.clamp(x, 0, r.value); return [e, e * K.value * (1 - e / r.value)]; } });
        let rep = {};
        v.legend([['accent', 'yield $Y(E)$'], ['green', 'MSY', { dot: true }], ['red', 'effort line $EN$'], ['orange', 'growth $f(N)$']]);
        v.render(() => {
          const rv = r.value, Kv = K.value, Y = (e) => e * Kv * (1 - e / rv), msy = (rv * Kv) / 4;
          A.setView([0, 1.02 * rv], [0, msy * 1.18]); B.setView([0, 1.1 * Kv], [0, msy * 1.18]);
          hE.set(v.M.clamp(hE.x, 0, rv), Y(v.M.clamp(hE.x, 0, rv)));
          const E = hE.x, Ns = Kv * (1 - E / rv), y = E * Ns;
          A.fn(Y, { domain: [0, rv], color: 'accent', width: 3 });
          A.hline(msy, { color: 'green', dash: [5, 4], alpha: 0.7 });
          A.dot(rv / 2, msy, { r: 7, color: 'green', hollow: true, width: 2.4 });
          A.vline(E, { color: 'faint', dash: true });
          B.fn((n) => rv * n * (1 - n / Kv), { domain: [0, Kv], color: 'orange', width: 3 });
          B.fn((n) => E * n, { domain: [0, 1.1 * Kv], color: 'red', width: 2.4 });
          B.vline(Kv / 2, { color: 'green', dash: [5, 4], alpha: 0.7 });
          B.dot(Kv / 2, msy, { r: 7, color: 'green', hollow: true, width: 2.4 });
          B.segment([Ns, 0], [Ns, y], { color: 'gold', width: 4 });
          B.dot(Ns, y, { r: 6, color: 'gold' });
          // brute-force check of the maximum
          let best = 0, be = 0; for (let i = 0; i <= 4000; i++) { const e = (rv * i) / 4000, yy = Y(e); if (yy > best) { best = yy; be = e; } }
          rep = { E, Ns, y, best, be, msy };
        });
        v.readout(() => String.raw`$E=${v.fix(rep.E, 3)}$: stock $N^*=${v.fix(rep.Ns, 1)}$ ($${v.fix(rep.Ns / K.value, 3)}K$), yield $Y=${v.fix(rep.y, 2)}$ = $${v.fix(rep.y / rep.msy, 3)}\,rK/4$
 brute-force maximum of $Y$: $${v.fix(rep.best, 3)}$ at $E=${v.fix(rep.be, 3)}$ — theory: $rK/4=${v.fix(rep.msy, 3)}$ at $E=r/2=${v.fix(r.value / 2, 3)}$, $N^*=K/2=${v.fix(K.value / 2, 1)}$`);
      },
    },
    {
      num: '1.14',
      kind: 'Phenomenon',
      name: 'Fishery collapse under a fixed quota',
      statement: String.raw`Under a constant quota $h<rK/4$ the deterministic model has a stable stock $N_+>K/2$ and an unstable threshold $N_-<K/2$ (1.12). If the stock is also buffeted by random year-to-year fluctuations, then however close to $N_+$ it starts, sooner or later a bad year (or several) pushes it below $N_-$, after which the quota exceeds the growth and the stock collapses to zero. The nearer the quota to $rK/4$, the closer $N_-$ is to $N_+$ and the more likely and sooner the collapse; the probability of surviving for $T$ years falls steadily with $T$.`,
      idea: String.raw`The quota creates a stable state and an unstable one that separates survival from collapse (1.11, 1.12); at the maximum yield the two merge (saddle-node). Noise turns a deterministic safe state into a metastable one: the stable stock is only locally attracting, and noise of size comparable to the distance $N_+-N_-$ eventually carries the stock over the threshold. A catch that is sustainable on paper is therefore too close to the edge in practice.`,
      scope: String.raw`Illustrative simulation: each year the stock receives a lognormal shock of relative size $\sigma$, then logistic growth less the quota act for a year (RK4); "collapse" means the stock reaches $0.5\%$ of $K$ (a crash within the year counts too). Parameters $r=0.5$, $K=100$.`,
      caption: String.raw`Thirty simulated stocks under a quota set as a fraction of $rK/4$ (red = the run collapses). Raise the quota fraction or the noise $\sigma$ and more runs cross the dashed threshold $N_-$ and crash. The right panel estimates the probability of collapse by each year from 300 runs, against a more cautious quota of $70\%$.`,
      deps: ['mathbio-1.12', 'mathbio-1.11'],
      tags: ['fisheries', 'collapse', 'stochasticity'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const frac = v.slider('quota as fraction of MSY', 0.5, 1.05, 0.9, { step: 0.01 });
        const sig = v.slider('year-to-year noise $\\sigma$', 0.02, 0.3, 0.12, { step: 0.01 });
        let seed = 1;
        v.button('New runs', () => { seed++; });
        const R0 = 0.5, K = 100, Y = 60, MSY = (R0 * K) / 4;
        const A = v.stage({ x: [0, Y], y: [0, 125], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'year', ylabel: 'stock N', title: 'thirty fished stocks' });
        const B = v.stage({ x: [0, Y], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 260, xlabel: 'year', ylabel: 'probability of collapse', title: 'collapse probability (300 runs)' });
        const run = (fr, s, sd, keep) => {
          const rg = v.rng(sd), H = fr * MSY, disc = Math.max(0, 1 - fr);
          let N = (K / 2) * (1 + Math.sqrt(disc));
          const path = keep ? [[0, N]] : null;
          for (let y = 0; y < Y; y++) {
            N *= Math.exp(s * rg.normal() - (s * s) / 2);
            for (let i = 0; i < 8; i++) {
              const f = (n) => R0 * n * (1 - n / K) - H, h = 1 / 8;
              const k1 = f(N), k2 = f(N + (h / 2) * k1), k3 = f(N + (h / 2) * k2), k4 = f(N + h * k3);
              N += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
              if (N <= 0.5) { if (keep) path.push([y + (i + 1) / 8, 0]); return { y: y + 1, path }; }
            }
            if (keep) path.push([y + 1, N]);
          }
          return { y: -1, path };
        };
        let cache = { key: '' }, rep = {};
        v.legend([['green', 'survives'], ['red', 'collapses'], ['red', '$N_-$ (unstable threshold)', { dash: true }], ['green', '$N_+$', { dash: true }]]);
        v.render(() => {
          const fr = frac.value, s = sig.value, key = `${fr}|${s}|${seed}`;
          if (cache.key !== key) {
            const paths = Array.from({ length: 30 }, (_, i) => run(fr, s, seed * 1000 + i, true));
            const cum = (f2) => { const c = new Float64Array(Y + 1); for (let i = 0; i < 300; i++) { const o = run(f2, s, seed * 7919 + 500 + i, false); if (o.y > 0) for (let y = o.y; y <= Y; y++) c[y]++; } return Array.from(c, (x, y) => [y, x / 300]); };
            cache = { key, paths, c1: cum(fr), c2: cum(0.7) };
          }
          const d = Math.max(0, 1 - fr), Np = (K / 2) * (1 + Math.sqrt(d)), Nm = (K / 2) * (1 - Math.sqrt(d));
          A.hline(Np, { color: 'green', dash: [6, 4], alpha: 0.8 }); A.hline(Nm, { color: 'red', dash: [6, 4], alpha: 0.8 });
          cache.paths.forEach((o) => A.path(o.path, { color: o.y > 0 ? 'red' : 'green', width: o.y > 0 ? 1.8 : 1.2, alpha: o.y > 0 ? 0.9 : 0.45 }));
          B.path(cache.c1, { color: 'red', width: 3 });
          if (Math.abs(fr - 0.7) > 0.005) B.path(cache.c2, { color: 'muted', width: 2, dash: [6, 4] });
          B.tex('70\\%\\ \\text{of MSY}', Y - 1, cache.c2[Y][1], { color: 'muted', align: 'right', baseline: 'bottom', dy: -6 });
          rep = { n: cache.paths.filter((o) => o.y > 0).length, p: cache.c1[Y][1], Np, Nm, h: fr * MSY };
        });
        v.readout(() => String.raw`quota $h=${v.fix(rep.h, 2)}$ (MSY $=${MSY}$): $N_+=${v.fix(rep.Np, 1)}$, $N_-=${v.fix(rep.Nm, 1)}$ (gap $${v.fix(rep.Np - rep.Nm, 1)}$)
 ${rep.n} of the 30 displayed runs collapse within ${Y} years; estimated probability from 300 runs: $${v.fix(rep.p, 2)}$`);
      },
    },
    {
      num: '1.15',
      kind: 'Model',
      name: 'Hutchinson’s delayed logistic equation',
      credit: 'Hutchinson, 1948',
      statement: String.raw`Hutchinson's equation lets the density-dependent brake respond to the population a time $\tau>0$ ago:
$$\frac{dN}{dt}=rN(t)\Bigl(1-\frac{N(t-\tau)}{K}\Bigr).$$
A history $N(t)$ on $[-\tau,0]$ is needed to start it. $N=K$ remains an equilibrium. The qualitative behaviour depends only on $r\tau$: for $r\tau<1/e$ solutions approach $K$ monotonically, for $1/e<r\tau<\pi/2$ they oscillate with decaying amplitude, and for $r\tau>\pi/2$ they settle onto sustained oscillations (a limit cycle) of period a little over $4\tau$.`,
      idea: String.raw`Growth responds to what the crowd was, not what it is: after a rise the stock overshoots $K$ because the brake lags, then undershoots when the lagged brake is still on. Setting $N=K(1+u)$ and linearizing gives $\dot u(t)=-r\,u(t-\tau)$, whose exponential solutions $e^{\lambda t}$ satisfy $\lambda=-re^{-\lambda\tau}$; the three regimes are the three kinds of root (1.16).`,
      scope: String.raw`Delay differential equation with constant initial history (here $N\equiv N_0$ on $[-\tau,0]$); the thresholds $1/e$ and $\pi/2$ are exact for the linearization and give the amplitude regime for the full equation.`,
      caption: String.raw`Set $r$ and the delay $\tau$ and read the product $r\tau$. Left: the population. Right: the delay portrait $N(t)$ against $N(t-\tau)$ (grey: the transient, blue: the last 60% of the run), in which an approach to $K$ spirals into the point $(K,K)$ and a sustained oscillation is a closed loop. Cross $r\tau=1/e\approx0.37$ and $\pi/2\approx1.57$.`,
      deps: ['mathbio-1.4'],
      tags: ['delay equation', 'oscillations'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$', 0.2, 3, 1, { step: 0.01 });
        const tau = v.slider('delay $\\tau$', 0.05, 6, 1.2, { step: 0.05 });
        const N0 = v.slider('history level $N_0/K$', 0.1, 0.9, 0.4, { step: 0.01 });
        const TM = 60, h = 0.02;
        const A = v.stage({ x: [0, TM], y: [0, 2.2], axes: 'box', gutter: true, height: 320, weight: 1.3, minWidth: 300, xlabel: 't', ylabel: 'N / K', title: 'population through time' });
        const B = v.stage({ x: [0, 2.2], y: [0, 2.2], equal: true, axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 260, xlabel: 'N(t − τ) / K', ylabel: 'N(t) / K', title: 'delay portrait' });
        let rep = {};
        v.legend([['accent', '$N(t)/K$'], ['green', '$K$', { dash: true }]]);
        v.render(() => {
          const rv = r.value, m = Math.max(1, Math.round(tau.value / h)), T = m * h;
          const X = ddeRun((x, xd) => rv * x * (1 - xd), N0.value, m, h, Math.round(TM / h));
          const pts = [], ph = [], pre = [];
          for (let i = m; i < X.length; i += 5) pts.push([(i - m) * h, X[i]]);
          const start = Math.round(0.4 * X.length);
          for (let i = m; i < X.length; i += 3) (i < start ? pre : ph).push([X[i - m], X[i]]);
          const hi = Math.max(1.1, ...pts.map((p) => p[1])) * 1.05;
          A.setView([0, TM], [0, hi]); B.setView([0, hi], [0, hi]);
          A.hline(1, { color: 'green', dash: [6, 4] });
          A.path(pts, { color: 'accent', width: 2.4 });
          B.line(0, 1, hi, 1, { color: 'faint', dash: true }); B.line(1, 0, 1, hi, { color: 'faint', dash: true });
          B.path(pre, { color: 'muted', width: 1.4, alpha: 0.7 }); B.path(ph, { color: 'accent', width: 2.2 });
          B.dot(1, 1, { r: 5, color: 'green' });
          const tail = X.slice(X.length - Math.round(15 / h)), amp = (Math.max(...tail) - Math.min(...tail)) / 2;
          rep = { x: rv * T, amp };
        });
        v.readout(() => String.raw`$r\tau=${v.fix(rep.x, 3)}$: ${rep.x < 1 / Math.E ? 'below $1/e$, monotone approach to $K$' : rep.x < Math.PI / 2 ? 'between $1/e$ and $\\pi/2$, damped oscillation' : 'above $\\pi/2$, sustained oscillation'}
 late amplitude (half the range over the last 15 time units): $${v.fix(rep.amp, 4)}\,K$`);
      },
    },
    {
      num: '1.16',
      kind: 'Theorem',
      name: 'Delay-induced oscillations: Hopf at rτ = π/2',
      statement: String.raw`Linearize Hutchinson's equation about $N=K$: $\dot u(t)=-r\,u(t-\tau)$. Solutions $e^{\lambda t}$ require $\lambda=-re^{-\lambda\tau}$, equivalently $w e^{w}=-r\tau$ with $w=\lambda\tau$, so $\lambda=W_k(-r\tau)/\tau$ with infinitely many roots (the branches of the Lambert $W$ function). For $r\tau<1/e$ all roots are real and negative; for $1/e<r\tau<\pi/2$ the leading roots are a complex pair with negative real part; at $r\tau=\pi/2$ that pair is $\lambda=\pm ir$ on the imaginary axis; for $r\tau>\pi/2$ it has positive real part. At $r\tau=\pi/2$ a **Hopf bifurcation** occurs: $K$ loses stability and a stable periodic solution of period near $2\pi/r=4\tau$ is born.`,
      idea: String.raw`Substitute $\lambda=i\omega$, $\omega>0$: $i\omega=-re^{-i\omega\tau}=-r\cos\omega\tau+ir\sin\omega\tau$, so $\cos\omega\tau=0$ and $\omega=r\sin\omega\tau$; the smallest solution is $\omega\tau=\pi/2$ and $\omega=r$, hence $r\tau=\pi/2$. A root crossing the imaginary axis transversally (the derivative $d\,\mathrm{Re}\lambda/d\tau>0$ there; see the complex-analytic argument in rca-10.43) is exactly the situation of the Hopf theorem.`,
      caption: String.raw`Left: the roots $w=\lambda\tau$ in the complex plane (leading pair gold; the gold curve is their path as $r\tau$ grows; red region = unstable). Slide $r\tau$ through $\pi/2\approx1.571$ and the pair crosses the imaginary axis. Right: a simulation of the full nonlinear equation ($r=1$, $\tau=r\tau$), showing the heights of successive swings of $N-K$ on a log scale (start: $0.3\%$ perturbation). While swings are small (below the dashed line) they lie on a straight line whose slope is $\mathrm{Re}\,\lambda$ (gold); beyond $r\tau=\pi/2$ they grow until the nonlinearity saturates them in a limit cycle.`,
      deps: ['mathbio-1.15', 'rca-10.43'],
      tags: ['Hopf bifurcation', 'delay equation'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const x = v.slider('$r\\tau$', 0.05, 3, 1.2, { step: 0.01 });
        const A = v.stage({ x: [-4, 2], y: [-13, 13], axes: true, height: 340, weight: 1, minWidth: 280, title: 'roots $w=\\lambda\\tau$ of $we^w=-r\\tau$' });
        const B = v.stage({ x: [0, 120], y: [1e-8, 3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 300, xlabel: 't', ylabel: '|N − K| at its swings', title: 'swings of the nonlinear equation (log scale, $r=1$, $K=1$)' });
        let rep = {}, locus = null;
        v.legend([['gold', 'leading pair / predicted slope', { dot: true }], ['muted', 'other roots', { dot: true }], ['accent', 'swings of $|N-K|$', { dot: true }], ['red', 'unstable half-plane', { area: true }]]);
        v.render(() => {
          const h = 0.01, m = Math.max(1, Math.round(x.value / h)), xv = m * h;
          if (!locus) { locus = [[], []]; for (let q = 0.02; q <= 3.0001; q += 0.02) { const L = lambertRoots(q, 0).filter((w) => w[1] >= 0).sort((a, b) => b[0] - a[0])[0]; locus[0].push([L[0], L[1]]); locus[1].push([L[0], -L[1]]); } }
          A.vband(0, 2, { color: 'red', alpha: 0.07 });
          A.path(locus[0], { color: 'gold', width: 1.6, alpha: 0.7 }); A.path(locus[1], { color: 'gold', width: 1.6, alpha: 0.7 });
          const ro = lambertRoots(xv, 2);
          ro.forEach((w, i) => A.dot(w[0], w[1], { r: i < 2 && Math.abs(w[1]) < 3 ? 7 : 4.5, color: i < 2 && Math.abs(w[1]) < 3 ? 'gold' : 'muted' }));
          A.text('Re w', 1.95, 0, { align: 'right', dy: -10, color: 'muted', size: 12 }); A.text('Im w', 0, 12.4, { align: 'left', dx: 8, color: 'muted', size: 12 });
          // nonlinear simulation, r = 1, tau = xv
          const u0 = 0.003, TT = 120, X = ddeRun((y, yd) => y * (1 - yd), 1 + u0, m, h, Math.round(TT / h));
          // extrema of u = N - K: their heights follow exp(Re(lambda) t) while the oscillation is small
          const ex = [];
          for (let i = m + 1; i < X.length - 1; i++) { const a = X[i - 1] - 1, b = X[i] - 1, c = X[i + 1] - 1; if (Math.abs(b) > 1e-9 && ((b > a && b > c) || (b < a && b < c))) ex.push([(i - m) * h, Math.abs(b)]); }
          const win = ex.filter((e, k) => k >= 2 && e[1] < 0.06);
          B.dots(ex.map((e) => [e[0], e[1]]), { r: 3.5, color: 'accent' });
          let meas = NaN;
          if (win.length >= 2) {
            let num = 0, cnt = 0;
            for (let k = 0; k + 1 < win.length && k < 8; k++) { num += Math.log(win[k + 1][1] / win[k][1]) / (win[k + 1][0] - win[k][0]); cnt++; }
            meas = num / cnt;
          }
          const lead0 = lambertRoots(xv, 2)[0], predRate = lead0[0] / xv;
          if (win.length) { const [t0, y0] = win[0], t1 = win[Math.min(win.length - 1, 12)][0]; B.line(t0, y0, t1, y0 * Math.exp(predRate * (t1 - t0)), { color: 'gold', width: 2.6 }); }
          B.hline(0.06, { color: 'faint', dash: [4, 4] });
          const lead = ro[0], pred = lead[0] / xv;
          rep = { xv, lead, pred, meas, cross: Math.abs(xv - Math.PI / 2) };
        });
        v.readout(() => String.raw`$r\tau=${v.fix(rep.xv, 2)}$ ($\pi/2=${v.fix(Math.PI / 2, 3)}$): leading root $w=${v.fix(rep.lead[0], 4)}${rep.lead[1] >= 0 ? '+' : '-'}${v.fix(Math.abs(rep.lead[1]), 4)}i$, so $\mathrm{Re}\,\lambda=${v.fix(rep.pred, 4)}$ per unit time ${rep.pred > 1e-9 ? '(growing: unstable)' : '(decaying: stable)'}
 measured rate from the simulation's successive swings: ${isFinite(rep.meas) ? '$' + v.fix(rep.meas, 4) + '$' : 'not available (no small swings to compare)'}; frequency $\mathrm{Im}\,\lambda=${v.fix(rep.lead[1] / rep.xv, 3)}$ (at $r\tau=\pi/2$ it equals $r=1$)`);
      },
    },
    {
      num: '1.17',
      kind: 'Model',
      name: 'Mackey–Glass equation and dynamical diseases',
      credit: 'Mackey & Glass, 1977',
      statement: String.raw`Mackey and Glass modelled blood-cell production controlled by cells present one maturation time $\tau$ ago:
$$\frac{dx}{dt}=\frac{\beta\,x(t-\tau)}{1+x(t-\tau)^n}-\gamma\,x(t),\qquad \beta,\gamma,n>0 .$$
The production term is a decreasing function of the delayed level (for $n>1$ it first rises and then falls), and the loss is proportional to $x$. With $\beta=0.2$, $\gamma=0.1$, $n=10$ the fixed point is $x^*=1$; it is stable for short delays, becomes unstable as $\tau$ passes about $4.7$, and increasing $\tau$ further gives periodic orbits, period-doubling cascades and chaos (the classic case $\tau=17$). Mackey and Glass proposed that periodic and aperiodic fluctuations in blood counts (some leukaemias) are such "dynamical diseases" arising from a change of a physiological parameter.`,
      idea: String.raw`A long delay in a negative-feedback loop turns restoring force into driving force, as in Hutchinson's equation (1.15–1.16); here the steep ($n=10$) nonlinearity folds the oscillation back and the delay supplies an infinite-dimensional state, so a scalar equation can behave chaotically. Linearizing at $x^*$ gives the same Hopf mechanism as before, with a root crossing the imaginary axis at a critical delay.`,
      scope: String.raw`A qualitative model: parameters are those of the standard numerical benchmark, not fitted patient data. Time units are arbitrary (about days in the blood-cell setting); $\tau$ is rounded to multiples of $0.25$.`,
      caption: String.raw`Slide the delay $\tau$. Left: the time series after transients; middle: the delay portrait $x(t-\tau)$ against $x(t)$; right: peak heights of $x$ for each $\tau$ (a bifurcation diagram — one dot per local maximum) with the current $\tau$ marked. Steady, periodic and irregular regimes appear as $\tau$ increases.`,
      deps: ['mathbio-1.16'],
      tags: ['delay equation', 'chaos', 'physiology'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const tau = v.slider('delay $\\tau$', 2, 30, 17, { step: 0.25 });
        const B = 0.2, G = 0.1, NN = 10, h = 0.25;
        const F = (x, xd) => (B * xd) / (1 + Math.pow(xd, NN)) - G * x;
        const run = (t, burn, span) => { const m = Math.round(t / h); const X = ddeRun(F, 0.9, m, h, Math.round((burn + span) / h)); return { X, m, off: Math.round(burn / h) + m }; };
        const A = v.stage({ x: [0, 400], y: [0, 1.6], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 280, xlabel: 't', ylabel: 'x(t)', title: 'time series (after transients)' });
        const P = v.stage({ x: [0, 1.6], y: [0, 1.6], equal: true, axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 240, xlabel: 'x(t − τ)', ylabel: 'x(t)', title: 'delay portrait' });
        const D = v.stage({ x: [2, 30], y: [0, 1.6], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 280, xlabel: 'delay τ', ylabel: 'peak values of x', title: 'bifurcation diagram' });
        let diag = null, rep = {};
        const peaks = (X, from, to) => { const out = []; for (let i = from + 1; i < to - 1; i++) if (X[i] > X[i - 1] && X[i] >= X[i + 1] && X[i] > 0.01) out.push(X[i]); return out; };
        const buildDiag = () => {
          const cols = [];
          for (let t = 2; t <= 30.001; t += 0.25) { const o = run(t, 1000, 1000); let pk = peaks(o.X, o.off, o.X.length); if (!pk.length) pk = [o.X[o.X.length - 1]]; cols.push([t, pk.slice(-40)]); }
          return cols;
        };
        v.render(() => {
          if (!diag) diag = buildDiag();
          const o = run(tau.value, 1000, 400), { X, m, off } = o;
          const pts = [], ph = [];
          for (let i = off; i < X.length; i += 2) { pts.push([(i - off) * h, X[i]]); }
          for (let i = off; i < X.length; i += 1) ph.push([X[i - m], X[i]]);
          A.hline(1, { color: 'green', dash: [6, 4] });
          A.path(pts, { color: 'accent', width: 2 });
          P.line(0, 0, 1.6, 1.6, { color: 'faint', dash: true });
          P.path(ph, { color: 'accent', width: 1.3, alpha: 0.85 });
          P.dot(1, 1, { r: 5, color: 'green' });
          const ctx = D.ctx; ctx.save(); ctx.fillStyle = v.color('accent', 0.55);
          for (const [t, pk] of diag) for (const y of pk) ctx.fillRect(D.X(t) - 0.9, D.Y(y) - 0.9, 1.8, 1.8);
          ctx.restore();
          D.vline(tau.value, { color: 'gold', width: 1.8 });
          const pk = peaks(X, off, X.length).slice(-40);
          const uniq = []; for (const y of pk) if (!uniq.some((w) => Math.abs(w - y) < 0.01 * Math.max(y, 1))) uniq.push(y);
          const amp = Math.max(...X.slice(off)) - Math.min(...X.slice(off));
          rep = { n: uniq.length, amp };
        });
        v.readout(() => String.raw`$\tau=${v.fix(tau.value, 2)}$: ` + (rep.amp < 0.01 ? String.raw`steady state $x^*=1$ (stable)` : rep.n <= 8 ? String.raw`periodic with ${rep.n} distinct peak height${rep.n === 1 ? '' : 's'} per cycle (period-${rep.n} orbit)` : String.raw`${rep.n} distinct peak heights among the last 40: irregular, chaotic-looking`) + String.raw`; oscillation range $${v.fix(rep.amp, 3)}$`);
      },
    },
  ],
};
