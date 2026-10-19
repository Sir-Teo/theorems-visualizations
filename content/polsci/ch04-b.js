// Political Science & Social Choice — Chapter 4 (part b): items 4.8-4.13
import { CC, sum, range, clamp, txt, rr, chip, Phi, phi, PhiInv, median, mean, pct, dist2, votesFor, mixGrid, binX, gridMedian, gridMean, LINE, cdfOf, votes2, tallyBins } from './ch04.shared.js';

import { isStrictSinglePeaked } from './verification-models.js';

const LET = 'ABCDEFGHIJ';
const pointSeg = (a, b) => [a, b];
/** Winset sample: fraction of an m x m grid over [-L, L]^2 satisfying pred(x, y). */
const areaOf = (pred, L, m = 60) => { let k = 0; for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (pred(-L + (2 * L * (i + 0.5)) / m, -L + (2 * L * (j + 0.5)) / m)) k++; return (k / (m * m)) * (2 * L) ** 2; };

export default {
  collection: 'polsci',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'The agenda-setter model (Romer–Rosenthal)',
      statement: String.raw`One policy dimension, an odd number of voters with symmetric single-peaked preferences and median ideal point $m$, and a **setter** with ideal point $s$ who alone may put a proposal $x$ to a vote. The legislature votes $x$ against the **reversion point** $q$ (the status quo, or what happens if the proposal fails), and the outcome is $x$ if a majority prefers it and $q$ otherwise. Voters are fully informed, so the setter proposes the point she likes best among those that pass.

The median voter accepts $x$ exactly when $|x - m| \le |q - m|$, so with $s > m$ the equilibrium outcome is
$$x^*(q) = \min\{\, s,\; m + |q - m| \,\},$$
and symmetrically $x^* = \max\{s,\, m - |q - m|\}$ when $s < m$. The outcome equals the median $m$ only when the reversion point is $q = m$; the farther $q$ is from $m$, the nearer the outcome is to the setter's own ideal point, until $x^* = s$. If the setter's proposal may be amended freely by the floor (an *open rule*), the outcome is $m$ whatever $q$ is.`,
      idea: String.raw`By single-peakedness (polsci-4.1) a voter with peak $p$ prefers $x$ to $q$ exactly when $x$ is nearer $p$, and by Black's theorem (polsci-4.2) only the median voter matters for a majority. Her acceptance set is the interval $[m - d, m + d]$ with $d = |q - m|$, centred on herself and reaching exactly to $q$ and to its mirror image $2m - q$. A setter with $s > m$ wants the accepted point nearest to her ideal, which is $s$ if $s$ is inside the interval and its right end $m + d$ otherwise. The model shows that agenda power, not the median, determines the outcome as soon as the proposer controls what is voted on and the fallback is extreme: the median voter's power over the *set* of acceptable proposals is complete, but over *which* of them is chosen it is nil.`,
      caption: String.raw`Drag the voters (small dots), the setter $s$ (purple) and the reversion point $q$ (gold). The shaded band is the set of proposals the median voter will accept against $q$; the setter proposes its point nearest $s$ (green). Below, the outcome $x^*(q)$ for every $q$: it follows the diagonal $x^*=q$ only for $q$ between the median and the setter's ideal point, is flat at $s$ once $q$ is farther out than $s$ (or than the mirror image of $s$), and equals $m$ at $q = m$. Switch to the open rule and the whole curve collapses to the median.`,
      deps: ['polsci-4.2'],
      see: ['polsci-4.9', 'polsci-4.10'],
      refs: ['Shepsle: agenda power', 'Romer & Rosenthal (1978), Public Choice 33(4): 27–43'],
      tags: ['agenda setter', 'take-it-or-leave-it'],
      credit: 'Thomas Romer and Howard Rosenthal, 1978',
      scope: String.raw`Complete information, one dimension, symmetric single-peaked preferences, a setter with exclusive proposal power and a fixed reversion point. The figures come from the closed-form solution above, which the page also checks by searching all proposals.`,
      links: { doi: 'https://doi.org/10.1007/BF03187594' },
      viz(v) {
        const S = v.stage({ x: [0, 10], y: [-0.55, 1.25], axes: 'box', gutter: true, height: 270, full: true, yticks: [], xlabel: 'policy line', ylabel: 'median voter’s utility', title: 'voters, the setter, the reversion point and the proposal that wins' });
        const O = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 270, full: true, equal: false, xlabel: 'reversion point q', ylabel: 'outcome', title: 'the outcome for every reversion point' });
        const rule = v.select('rule', [{ value: 'closed', label: 'closed rule: take it or leave it' }, { value: 'open', label: 'open rule: free amendment' }], 'closed');
        const PK = [1.6, 3.0, 4.4, 6.0, 7.2];
        const VH = PK.map((p, i) => S.handle(p, 0.05, { color: CC[i], r: 6.5, constrain: 'x', label: `${i + 1}`, labelPos: 's' }));
        const SH = S.handle(8.6, 0.32, { color: 'purple', r: 9, constrain: 'x', label: 's', labelPos: 'n' });
        const QH = S.handle(1.0, -0.3, { color: 'gold', r: 9, constrain: 'x', label: 'q', labelPos: 's' });
        let info = null;
        v.render(() => {
          const P = VH.map((h) => h.x), m = median(P), s = SH.x, q = QH.x, d = Math.abs(q - m);
          // honest search: every proposal on a fine grid, accepted if a majority of voters weakly prefers it to q
          let best = q, bd = Math.abs(q - s);
          for (let x = 0; x <= 10 + 1e-9; x += 0.01) {
            const yes = sum(P.map((p) => (Math.abs(x - p) <= Math.abs(q - p) + 1e-12 ? 1 : 0)));
            if (yes > P.length / 2 && Math.abs(x - s) < bd - 1e-12) { bd = Math.abs(x - s); best = x; }
          }
          const open = rule.value === 'open', out = open ? m : best, form = s >= m ? Math.min(s, m + d) : Math.max(s, m - d);
          S.rect(Math.max(0, m - d), -0.5, Math.min(10, m + d), 1.2, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          S.fn((x) => 1 - Math.abs(x - m) / 10, { color: 'ink', width: 1.8 });
          S.vline(m, { color: 'green', width: 2 }); S.text('m', m, 1.17, { color: 'green', size: 13, weight: 700 });
          S.vline(2 * m - q, { color: 'gold', dash: true, alpha: 0.7 }); S.text('mirror of q', 2 * m - q, 0.9, { color: 'gold', size: 10.5 });
          S.vline(q, { color: 'gold', width: 1.5 });
          S.arrow(m, 0.62, out, 0.62, { color: 'green', width: 2.4 });
          S.dot(out, 1 - Math.abs(out - m) / 10, { r: 7, color: 'green', label: 'outcome', labelPos: 'se' });
          O.line(0, 0, 10, 10, { color: 'faint', dash: true }); O.text('x = q', 9.2, 9.8, { size: 10.5, color: 'muted' });
          O.hline(m, { color: 'green', dash: true, alpha: 0.6 }); O.hline(s, { color: 'purple', dash: true, alpha: 0.6 });
          const f = (qq) => (s >= m ? Math.min(s, m + Math.abs(qq - m)) : Math.max(s, m - Math.abs(qq - m)));
          O.fn(f, { color: 'purple', width: 2.6, n: 300, alpha: open ? 0.3 : 1 });
          O.fn(() => m, { color: 'green', width: 2.6, alpha: open ? 1 : 0.0 });
          O.dot(q, out, { r: 7, color: 'gold' });
          info = { m, s, q, d, out, form, open, lo: m - d, hi: m + d };
        });
        v.legend([['accent', 'proposals the median accepts', { area: true }], ['green', 'median $m$ / outcome'], ['purple', 'setter’s ideal $s$']]);
        v.readout(() => {
          const { m, s, q, d, out, form, open, lo, hi } = info, g = (x) => v.fix(x, 2);
          return `Median $m=${g(m)}$, setter $s=${g(s)}$, reversion $q=${g(q)}$. The median accepts proposals in $[${g(Math.max(0, lo))}, ${g(Math.min(10, hi))}]$. ${open ? `Under the open rule the floor amends toward the median: outcome **${g(m)}**.` : `The setter proposes **${g(out)}** (formula $\\min\\{s, m+|q-m|\\} = ${g(form)}$), which is ${g(Math.abs(out - m))} from the median, **${pct(Math.abs(s - m) < 1e-9 ? 0 : Math.abs(out - m) / Math.abs(s - m), 0)}** of the way to her ideal point.`}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Veto players and policy stability (Tsebelis)',
      statement: String.raw`A **veto player** is an individual or collective actor whose agreement is required to change the status quo; the veto players are fixed by a country's constitution (institutional veto players, such as a president or a second chamber) and by its party system (partisan ones, such as the parties of a coalition). Model each veto player $i$ by an ideal point $p_i$ in a policy space with Euclidean preferences. A policy $y$ can replace the status quo $q$ only if **every** veto player prefers it:
$$W(q) = \bigcap_i \{\, y : |y - p_i| < |q - p_i| \,\},$$
the **winset** of $q$. Tsebelis's proposition is that policy stability, the difficulty of changing the status quo, is greater the **larger the number of veto players, the greater the distance between them, and the greater the internal cohesion** of collective ones; a veto player whose ideal point lies inside the winset of the others is **absorbed** and adds nothing. A status quo in the convex hull of the veto players' ideal points (the **unanimity core**) has an empty winset: it cannot be changed.`,
      idea: String.raw`Each veto player carves out the disc of policies she weakly prefers to $q$, centred on her ideal point and passing through $q$; the winset is the intersection of these discs, and adding a player can only shrink it (a smaller or equal intersection). In one dimension the winset is the intersection of intervals, so only the two outermost players matter and everyone between them is absorbed; in several dimensions each additional player generally cuts the winset further. This gives an institutional counterpart to the instability of the unrestricted model (polsci-4.6): it is the *requirement of unanimity among a fixed set of actors*, not majority rule, that makes policy stick, and the agenda setter of polsci-4.8 can only choose within the winset.`,
      caption: String.raw`Choose the number of veto players, drag their ideal points and the status quo $q$ (gold). The orange region is the winset of $q$: policies every veto player prefers to $q$. The grey triangle (or segment) is the unanimity core: put $q$ inside it and the winset vanishes. A player drawn with a dashed ring is **absorbed**: removing her would not change the winset. On the right, averaged over many random placements of the veto players, the winset area falls and the share of status quos that no change can touch rises with every added veto player.`,
      deps: ['polsci-4.8'],
      see: ['polsci-4.10', 'polsci-4.6'],
      refs: ['Shepsle: institutions', 'Tsebelis (1995), British Journal of Political Science 25: 289–325'],
      tags: ['veto players', 'policy stability'],
      credit: 'George Tsebelis, 1995',
      scope: String.raw`Euclidean preferences and one status quo. The right panel averages over uniformly random ideal points and a uniformly random status quo in $[-2,2]^2$, 400 draws with a fixed seed. Collective veto players with internal majority rule are not modelled, only individual ones.`,
      viz(v) {
        const L = 3.2;
        const S = v.stage({ x: [-L, L], y: [-L, L], equal: true, axes: false, height: 400, minWidth: 360, weight: 1.3, title: 'veto players, status quo and its winset' });
        const E = v.stage({ x: [0.5, 6.5], y: [0, 1], axes: 'box', gutter: true, height: 400, minWidth: 300, xlabel: 'number of veto players', ylabel: 'average over 400 draws', title: 'random veto players and a random status quo', xticks: [1, 2, 3, 4, 5, 6] });
        const kS = v.slider('veto players', 1, 5, 3, { int: true });
        const BASE = [[-1.6, 0.9], [1.5, 1.3], [0.3, -1.7], [2.0, -0.6], [-1.3, -1.1]];
        const H = BASE.map((p, i) => S.handle(p[0], p[1], { color: CC[i], r: 9, label: `${i + 1}`, labelPos: 'n' }));
        const Q = S.handle(0.4, 2.3, { color: 'gold', r: 9, label: 'q', labelPos: 'n' });
        v.button('put q inside the core', () => { const k = kS.value; const c = [mean(range(k).map((i) => H[i].x)), mean(range(k).map((i) => H[i].y))]; Q.set(c[0], c[1]); });
        const hull = (pts) => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
        // Monte Carlo (fixed seed): random veto players and a random status quo, both uniform in [-2,2]^2
        const MC = (() => {
          const rng = v.rng(5), TR = 400, GM = 28, area = range(7).map(() => 0), core = range(7).map(() => 0);
          for (let t = 0; t < TR; t++) {
            const P = range(6).map(() => [rng() * 4 - 2, rng() * 4 - 2]), q = [rng() * 4 - 2, rng() * 4 - 2];
            for (let kk = 1; kk <= 6; kk++) {
              let c = 0;
              for (let a = 0; a < GM; a++) for (let b = 0; b < GM; b++) { const x = -L + (2 * L * (a + 0.5)) / GM, y = -L + (2 * L * (b + 0.5)) / GM; let ok = true; for (let i = 0; i < kk && ok; i++) if (dist2(P[i], [x, y]) >= dist2(P[i], q)) ok = false; if (ok) c++; }
              area[kk] += c / (GM * GM);
              if (kk >= 3) { const hp = hull(P.slice(0, kk)); if (hp.length >= 3 && hp.every((a, i) => { const b = hp[(i + 1) % hp.length]; return (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) >= 0; })) core[kk]++; }
            }
          }
          return { pa: range(6).map((i) => [i + 1, area[i + 1] / TR]), pe: range(6).map((i) => [i + 1, core[i + 1] / TR]) };
        })();
        let info = null;
        v.render(() => {
          const k = kS.value, V = range(k).map((i) => [H[i].x, H[i].y]), q = [Q.x, Q.y];
          H.forEach((h, i) => { h.visible = i < k; });
          const inW = (x, y, skip = -1) => V.every((p, i) => i === skip || dist2(p, [x, y]) < dist2(p, q));
          const key = V.map((p) => p[0].toFixed(3) + p[1].toFixed(3)).join('|') + q.map((x) => x.toFixed(3));
          const col = v.ramp(0.45, 'orange');
          S.raster((x, y) => (inW(x, y) ? col : null), { res: 3, key: `w${key}` });
          if (k >= 2) { const hp = k === 2 ? V : hull(V); S.poly(hp, { fill: 'ink', fillAlpha: 0.1, color: 'muted', width: 1.4 }); }
          V.forEach((p, i) => S.circle(p[0], p[1], Math.sqrt(dist2(p, q)), { color: CC[i], alpha: 0.35, width: 1.2 }));
          // absorbed players: dropping them leaves the winset unchanged (grid test)
          const m = 56, cells = [];
          const full = range(k).map(() => 0);
          let area = 0;
          for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
            const x = -L + (2 * L * (a + 0.5)) / m, y = -L + (2 * L * (b + 0.5)) / m;
            const miss = V.map((p, i) => dist2(p, [x, y]) >= dist2(p, q));
            const nmiss = miss.filter(Boolean).length;
            if (nmiss === 0) area++; else if (nmiss === 1) full[miss.indexOf(true)]++;
          }
          const cellA = ((2 * L) / m) ** 2, absorbed = full.map((c) => k > 1 && c === 0);
          absorbed.forEach((ab, i) => { if (ab) S.dot(V[i][0], V[i][1], { r: 15, hollow: true, color: 'muted' }); });
          const inCore = k >= 2 && (() => { const hp = k === 2 ? null : hull(V); if (k === 2) { const [a, b] = V, dx = b[0] - a[0], dy = b[1] - a[1], t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy); return t >= 0 && t <= 1 && Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dy) < 0.03; } return hp.every((a, i) => { const b = hp[(i + 1) % hp.length]; return (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) >= -1e-9; }); })();
          V.forEach((p, i) => S.dot(p[0], p[1], { r: 8.5, color: CC[i] }));
          const { pa: pa0, pe: pe0 } = MC;
          const pa = pa0, pe = pe0;
          E.path(pa, { color: 'orange', width: 2.4 }); E.path(pe, { color: 'green', width: 2.4 });
          pa.forEach((p) => E.dot(p[0], p[1], { r: 3.5, color: 'orange' })); pe.forEach((p) => E.dot(p[0], p[1], { r: 3.5, color: 'green' }));
          E.vline(k, { color: 'gold', dash: true });
          E.text('winset area (share of the window)', 6.4, pa[5][1] + 0.07, { size: 10.5, color: 'orange', align: 'right' });
          E.text('share of status quos that cannot be changed', 6.4, Math.min(0.95, pe[5][1] - 0.07), { size: 10.5, color: 'green', align: 'right' });
          info = { k, area: area * cellA, absorbed, inCore, pa, pe, eff: absorbed.filter((a) => !a).length };
        });
        v.legend([['orange', 'winset of $q$', { area: true }], ['muted', 'unanimity core', { area: true }]]);
        v.readout(() => {
          const { k, area, absorbed, inCore, pa, pe, eff } = info;
          const ab = absorbed.map((a, i) => (a ? i + 1 : null)).filter(Boolean);
          return `${k} veto player${k > 1 ? 's' : ''}: the winset of $q$ has area **${v.fix(area, 2)}** (${v.fix(100 * area / 40.96, 1)}% of the window)${inCore ? ', and $q$ lies in the unanimity core, so it **cannot be changed**' : ''}. ${ab.length ? `Absorbed: player${ab.length > 1 ? 's' : ''} ${ab.join(', ')}; effectively ${eff} veto players.` : 'No player is absorbed.'} Random placements, 1 to 6 players (area as a share of the window; chance of no change): mean winset area ${pa.map((p) => v.fix(p[1], 2)).join(' → ')}; chance of no change ${pe.map((p) => v.fix(p[1], 2)).join(' → ')}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Structure-induced equilibrium (Shepsle–Weingast)',
      statement: String.raw`Let a committee of an odd number of voters with Euclidean preferences choose a point $(x, y)$ in a two-dimensional policy space, where the two dimensions are two separate issues. If any alternative may be proposed against any other, there is generally no majority-rule equilibrium and the outcome can be led anywhere (polsci-4.6). Now add a **jurisdictional rule**: each issue is decided by its own committee, and a proposal may change only one issue at a time, leaving the other as it is. Then a point $(x^*, y^*)$ is a **structure-induced equilibrium** if no majority prefers any amendment that changes one coordinate: $x^*$ is a majority-preferred point among all $(x, y^*)$ and $y^*$ among all $(x^*, y)$. With separable (circular) preferences, $x^*$ is the median of the voters' ideal $x$-coordinates and $y^*$ the median of their $y$-coordinates. When the voters' preferences are not separable, each issue-by-issue median depends on the other coordinate, and the equilibrium is the fixed point of the two conditional medians.

The equilibrium is "induced by structure": it has a non-empty winset in the unrestricted model, but no member of that winset is a germane amendment.`,
      idea: String.raw`Restricted to a line parallel to an axis, each voter's preference is single-peaked in the one free coordinate, so Black's median voter theorem (polsci-4.2) applies issue by issue: along the line through the current point, the point at the median of the voters' conditional peaks beats every other. Alternating the two issues therefore never cycles; each vote moves to the conditional median and the process stops at the fixed point. The structure (the rules saying what can be proposed) supplies the stability that preferences alone lack. This is the answer of Shepsle and Weingast to the chaos of polsci-4.6: stability is a property of preferences together with institutions.`,
      caption: String.raw`Five voters (coloured dots), a starting status quo (gold; drag it), and the same sequence of votes under two sets of rules. **Red path:** any amendment that a majority prefers to the current point may be proposed; the next point is drawn at random from the winset, and the process wanders over the whole window. **Green path:** the two issues are decided one after the other; each vote moves to the median along the free axis, and the path stops at the star, the structure-induced equilibrium. The orange area is the winset of the star in the *unrestricted* game: it is not empty, but none of its points can be reached by changing one issue. The tilt slider makes the issues interact; the star moves, and it is still where the two conditional medians agree.`,
      deps: ['polsci-4.6'],
      see: ['polsci-4.7', 'polsci-4.9'],
      refs: ['Shepsle: institutions', 'Shepsle (1979), AJPS 23: 27–59', 'Shepsle & Weingast (1981), Public Choice 37: 503–519'],
      tags: ['committees', 'institutions'],
      credit: 'Kenneth A. Shepsle, 1979; Shepsle and Weingast, 1981',
      scope: String.raw`Quadratic preferences $-\big[(x-a_i)^2 + 2\rho\,(x-a_i)(y-b_i) + (y-b_i)^2\big]$ with the same tilt $\rho$ for all voters; one-issue-at-a-time amendments; no strategic behaviour by the voters. The red path is one random draw, not the typical or worst case.`,
      viz(v) {
        const L = 3.4;
        const S = v.stage({ x: [-L, L], y: [-L, L], equal: true, axes: false, height: 430, minWidth: 380, weight: 1.35, title: 'two issues: unrestricted amendments against one issue at a time' });
        const D = v.stage({ x: [0, 40], y: [0, 4], axes: 'box', gutter: true, height: 430, minWidth: 270, xlabel: 'vote number', ylabel: 'distance from the star', title: 'distance from the equilibrium' });
        const nS = v.slider('votes', 1, 40, 30, { int: true });
        const tS = v.slider('tilt $\\rho$ (issues interact)', -0.7, 0.7, 0, { step: 0.05 });
        const BASE = [[-1.8, 0.6], [-0.4, 1.9], [1.7, 1.1], [0.9, -1.5], [-1.0, -1.2]];
        const H = BASE.map((p, i) => S.handle(p[0], p[1], { color: CC[i], r: 9, label: `${i + 1}`, labelPos: 'n' }));
        const Q = S.handle(2.5, -2.4, { color: 'gold', r: 9, label: 'start', labelPos: 'n' });
        let seed = 3;
        v.button('new random walk', () => { seed += 1; });
        v.button('reset voters', () => BASE.forEach((p, i) => H[i].set(p[0], p[1])));
        let info = null;
        v.render(() => {
          const V = H.map((h) => [h.x, h.y]), rho = tS.value, nv = nS.value, q0 = [Q.x, Q.y];
          const u = (p, x, y) => { const a = x - p[0], b = y - p[1]; return -(a * a + 2 * rho * a * b + b * b); };
          const beatsQ = (z, w) => sum(V.map((p) => (u(p, z[0], z[1]) > u(p, w[0], w[1]) ? 1 : 0))) > V.length / 2;
          // conditional medians: voter i's best x given y is a_i - rho (y - b_i)
          const medX = (y) => median(V.map((p) => p[0] - rho * (y - p[1]))), medY = (x) => median(V.map((p) => p[1] - rho * (x - p[0])));
          let eq = [0, 0]; for (let it = 0; it < 300; it++) { eq = [medX(eq[1]), medY(medX(eq[1]))]; }
          // the jurisdictional path: alternately issue 1 and issue 2
          const jp = [q0.slice()]; let cur = q0.slice();
          for (let t = 0; t < 40; t++) { const nx = t % 2 === 0 ? [medX(cur[1]), cur[1]] : [cur[0], medY(cur[0])]; cur = nx; jp.push(cur.slice()); }
          // the unrestricted walk: a random point from the winset of the current point
          const rng = v.rng(seed), wp = [q0.slice()]; cur = q0.slice();
          for (let t = 0; t < 40; t++) {
            for (let tr = 0; tr < 700; tr++) { const c = [(rng() * 2 - 1) * L, (rng() * 2 - 1) * L]; if (beatsQ(c, cur)) { cur = c; break; } }
            wp.push(cur.slice());
          }
          const col = v.ramp(0.4, 'orange'), key = V.map((p) => p[0].toFixed(3) + p[1].toFixed(3)).join('|') + rho;
          S.raster((x, y) => (beatsQ([x, y], eq) ? col : null), { res: 3, key: `w${key}` });
          S.path(wp.slice(0, nv + 1), { color: 'red', width: 1.6, alpha: 0.75 });
          wp.slice(0, nv + 1).forEach((p, k) => { if (k > 0) S.dot(p[0], p[1], { r: 3, color: 'red', alpha: 0.7 }); });
          S.path(jp.slice(0, nv + 1), { color: 'green', width: 2.6 });
          jp.slice(0, nv + 1).forEach((p, k) => { if (k > 0 && (k < 5 || k === nv)) S.dot(p[0], p[1], { r: 3.5, color: 'green' }); });
          if (rho === 0) { S.vline(eq[0], { color: 'green', alpha: 0.35, dash: true }); S.hline(eq[1], { color: 'green', alpha: 0.35, dash: true }); }
          V.forEach((p, i) => S.dot(p[0], p[1], { r: 8.5, color: CC[i] }));
          S.dot(eq[0], eq[1], { r: 11, hollow: true, color: 'green' }); S.text('★', eq[0], eq[1], { color: 'green', size: 15 });
          const dd = (p) => Math.hypot(p[0] - eq[0], p[1] - eq[1]);
          D.path(wp.map((p, k) => [k, dd(p)]).slice(0, nv + 1), { color: 'red', width: 1.8 });
          D.path(jp.map((p, k) => [k, dd(p)]).slice(0, nv + 1), { color: 'green', width: 2.6 });
          const wa = areaOf((x, y) => beatsQ([x, y], eq), L, 50) / (2 * L) ** 2;
          info = { eq, wa, jEnd: dd(jp[nv]), wEnd: dd(wp[nv]), wMax: Math.max(...wp.slice(0, nv + 1).map(dd)), medians: [median(V.map((p) => p[0])), median(V.map((p) => p[1]))], nv, rho, jSteps: jp.findIndex((p) => dd(p) < 0.01) };
        });
        v.legend([['red', 'any amendment allowed (random winset points)'], ['green', 'one issue at a time'], ['orange', 'winset of the star', { area: true }]]);
        v.readout(() => {
          const { eq, wa, jEnd, wEnd, wMax, medians, nv, rho, jSteps } = info, g = (x) => v.fix(x, 2);
          return `Structure-induced equilibrium (star): $(${g(eq[0])}, ${g(eq[1])})$${rho === 0 ? `, the coordinatewise medians $(${g(medians[0])}, ${g(medians[1])})$` : ''}. After ${nv} votes the issue-by-issue process is ${g(jEnd)} from it${jSteps >= 0 ? ` (it arrived after ${jSteps} votes and stays)` : ''}; the unrestricted process is ${g(wEnd)} away and has been as far as ${g(wMax)}. The star has a non-empty unrestricted winset (${v.fix(100 * wa, 0)}% of the window), but none of it is a one-issue amendment.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Meltzer–Richard: the median voter and redistribution',
      statement: String.raw`Voters differ in pre-tax income $y_i$, with mean income $\bar y$. A linear income tax at rate $\tau \in [0, 1]$ funds an equal lump-sum transfer to everyone, but taxation distorts work and saving, which is modelled here in reduced form by an efficiency loss of $\tfrac{\alpha}{2}\tau^2\bar y$ per head. Voter $i$'s consumption is
$$c_i(\tau) = (1 - \tau)\,y_i + \bar y\Big(\tau - \tfrac{\alpha}{2}\tau^2\Big),$$
which is a concave function of $\tau$ (so preferences over $\tau$ are single-peaked) with peak
$$\tau_i = \max\Big\{0,\ \frac{1}{\alpha}\Big(1 - \frac{y_i}{\bar y}\Big)\Big\}.$$
By the median voter theorem (polsci-4.2), the tax rate chosen by majority vote is the median voter's, $\tau^* = \tau_{\text{med}}$. It rises as the median income $y_{\text{med}}$ falls further below the mean $\bar y$, and falls as the efficiency loss $\alpha$ rises. Income distributions are right-skewed, so the median lies below the mean and a majority gains from redistribution; extending the franchise to poorer voters lowers the decisive voter's income and raises $\tau^*$.`,
      idea: String.raw`Each voter's consumption is a downward parabola in $\tau$, so her preferences are single-peaked and the median of the peaks is the majority winner (polsci-4.1, polsci-4.2). Because $\tau_i$ is a decreasing function of $y_i$, the median of the $\tau_i$ belongs to the voter with median income. Setting $\partial c_i/\partial\tau = 0$ balances what she pays, $y_i$ per unit of tax, against what she receives, $\bar y(1 - \alpha\tau)$ per unit, net of the deadweight loss; the gap $\bar y - y_i$ is the gain from redistribution, and the factor $1/\alpha$ is the brake from distortions. This captures the comparative statics of Meltzer and Richard's rational theory of the size of government in a few lines, though not their treatment of labour supply, which makes the mean income itself depend on $\tau$.`,
      caption: String.raw`**Left:** a log-normal income distribution scaled to mean $1$. Raise the skew $\sigma$ and the median (green) slides below the mean (gold). The franchise slider removes the poorest share of the population from the electorate, so that the decisive voter moves up the distribution. **Middle:** consumption as a function of the tax rate for four voters (ranked by income): each peaks at her own preferred rate, and the median voter's peak (green dot) is the tax that wins. **Right:** the winning tax rate as a function of the ratio of decisive income to mean income, for three efficiency losses $\alpha$; the dot shows where the current distribution puts you.`,
      deps: ['polsci-4.2'],
      see: ['polsci-4.1'],
      refs: ['Shepsle: spatial model', 'Meltzer & Richard (1981), Journal of Political Economy 89(5): 914–927'],
      tags: ['redistribution', 'median voter'],
      credit: 'Allan H. Meltzer and Scott F. Richard, 1981',
      scope: String.raw`A stylized version: linear tax, equal lump-sum transfer, a quadratic efficiency loss in place of the original endogenous labour supply, a log-normal income distribution and full turnout among those eligible. The prediction that more redistribution goes with a lower median-to-mean ratio is the model's; the empirical record is mixed and not represented here.`,
      viz(v) {
        const A = v.stage({ x: [0, 3.2], y: [0, 1.15], axes: 'box', gutter: true, height: 300, minWidth: 300, yticks: [], xlabel: 'income (mean = 1)', ylabel: 'density', title: 'the income distribution' });
        const B = v.stage({ x: [0, 1], y: [0.2, 1.4], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'tax rate τ', ylabel: 'consumption', title: 'preferred tax rates' });
        const C = v.stage({ x: [0, 1.2], y: [0, 0.8], axes: 'box', gutter: true, height: 300, minWidth: 260, xlabel: 'decisive income ÷ mean income', ylabel: 'winning tax rate τ*', title: 'tax rate against the median-to-mean ratio' });
        const sg = v.slider('income skew $\\sigma$', 0.1, 1.4, 0.8, { step: 0.02 });
        const al = v.slider('efficiency loss $\\alpha$', 1, 4, 2, { step: 0.05 });
        const fr = v.slider('poorest share excluded from voting', 0, 0.5, 0, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        let info = null;
        v.render(() => {
          const s = sg.value, a = al.value, f = fr.value, mu = -s * s / 2;
          const yq = (p) => Math.exp(mu + s * PhiInv(p));
          const dens = (y) => (y <= 0 ? 0 : phi((Math.log(y) - mu) / s) / (y * s));
          const med = yq(0.5), dec = yq(f + (1 - f) / 2), tauOf = (y) => clamp((1 - y) / a, 0, 1);
          A.fn(dens, { color: 'accent', fill: true, fillAlpha: 0.2, width: 1.8, n: 300, domain: [0.01, 3.2] });
          if (f > 0) A.fn(dens, { color: 'muted', fill: true, fillAlpha: 0.25, width: 0, n: 100, domain: [0.01, yq(f)] });
          const top = Math.max(dens(med), dens(0.7)) * 0.98;
          A.vline(1, { color: 'gold', width: 2 }); A.text('mean', 1.03, 1.07, { color: 'gold', size: 11, align: 'left', weight: 700 });
          A.vline(med, { color: 'green', width: 2, dash: f > 0 }); A.text('median', med - 0.03, 1.07, { color: 'green', size: 11, align: 'right', weight: 700 });
          if (f > 0) { A.vline(dec, { color: 'green', width: 2.4 }); A.text('decisive', dec + 0.03, 0.95, { color: 'green', size: 11, align: 'left', weight: 700 }); }
          // preferred rates of four voters
          const voters = [[0.1, 'poor (10th pct.)', 'purple'], [f + (1 - f) / 2, 'decisive', 'green'], [0.5 + 0.0, 'median', 'teal'], [0.9, 'rich (90th pct.)', 'orange']];
          const vs = [[0.1, 'purple', 'poorer'], [f + (1 - f) / 2, 'green', 'decisive'], [0.9, 'orange', 'richer']];
          vs.forEach(([p, c, nm]) => {
            const y = yq(p), cf = (t) => (1 - t) * y + t - (a / 2) * t * t, ti = tauOf(y);
            B.fn(cf, { color: c, width: nm === 'decisive' ? 2.8 : 1.8, domain: [0, 1] });
            B.dot(ti, cf(ti), { r: nm === 'decisive' ? 6.5 : 4.5, color: c });
          });
          const ymean = (t) => 1 - (a / 2) * t * t; // consumption of a voter with mean income
          B.fn(ymean, { color: 'gold', width: 1.8, domain: [0, 1] }); B.dot(0, 1, { r: 4.5, color: 'gold' });
          // tau against ratio
          [1.5, 2.5, 4].forEach((a2) => { C.fn((r) => clamp((1 - r) / a2, 0, 1), { color: a2 === a ? 'accent' : 'muted', width: a2 === a ? 2.6 : 1.4, alpha: a2 === a ? 1 : 0.5, domain: [0, 1.2] }); C.text(`α = ${a2}`, 0.02, clamp(1 / a2, 0, 0.78) - 0.03, { size: 10, color: 'muted', align: 'left' }); });
          C.fn((r) => clamp((1 - r) / a, 0, 1), { color: 'accent', width: 2.6, domain: [0, 1.2] });
          C.dot(clamp(dec, 0, 1.2), tauOf(dec), { r: 7, color: 'green' });
          C.vline(1, { color: 'gold', dash: true });
          info = { med, dec, tau: tauOf(dec), a, s, ratio: med, f, mean: 1, ymed: med };
        });
        v.legend([['gold', 'mean income / mean voter'], ['green', 'median or decisive voter'], ['purple', 'poorer voter'], ['orange', 'richer voter']]);
        v.readout(() => {
          const { med, dec, tau, a, s, f } = info, g = (x) => v.fix(x, 2);
          return `Median income ${g(med)} of the mean (log-normal with $\\sigma=${g(s)}$)${f > 0 ? `; with the poorest ${Math.round(100 * f)}% excluded the decisive voter has ${g(dec)} of the mean` : ''}. Her preferred tax rate is $\\tau^*=(1-${g(dec)})/${g(a)}=$ **${g(tau)}**. At full franchise the winning rate would be ${g(Math.max(0, (1 - med) / a))}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Paper',
      name: 'On the Rationale of Group Decision-making',
      paper: { authors: 'Duncan Black', year: 1948, title: 'On the Rationale of Group Decision-making', venue: 'Journal of Political Economy 56 (1): 23–34', doi: '10.1086/256633' },
      introduces: ['polsci-4.1', 'polsci-4.2'],
      statement: String.raw`Black asks when the decision of a committee by majority vote is determinate, and answers by restricting the preferences of its members. Suppose the options can be arranged on a line and every member's preference is single-peaked, drawn as a curve over the options with one maximum. Then, with an odd number of members, the option at the **median of the members' peaks** beats every other option in a vote between two, so the committee's pairwise decisions form a consistent ordering with that option on top (polsci-4.2). When some member's curve has two peaks, the majority relation can cycle, and the committee has no determinate decision (polsci-2.1).`,
      idea: String.raw`The context is the question of whether voting among several options yields a decision at all, which the cyclic majorities of Condorcet's paradox (polsci-2.1) put in doubt. Black's paper (1948), which predates Arrow's impossibility theorem (1950), identified a condition on the *domain* of preferences, single-peakedness (polsci-4.1), that removes the difficulty, and the median voter theorem (polsci-4.2) as its consequence. It changed the question from "is majority rule well-defined?" to "which restrictions on preferences make it so?", and the one-dimensional case it solved is the basis of the spatial theory of parties and elections in the rest of this chapter.`,
      caption: String.raw`Five committee members rank seven options $A$–$G$, drawn as curves over the options. Pick a member (buttons) and **drag the dots on her curve** to reshape her preferences; the other members' curves are faint. At the start everyone is single-peaked: the table on the right (row $a$, column $b$: votes for $a$ minus votes for $b$) shows the option at the median peak (marked $m$) beating all others. Bend one member's curve to two peaks (the **bend** button does it for member 3) and a cycle appears. The editable curves are our own reconstruction; the complete original’s single-peaked and cyclic examples are in §II/Figs2–5 and §III/Figs7–8.`,
      deps: ['polsci-2.1'],
      see: ['polsci-4.1', 'polsci-4.2', 'polsci-3.14'],
      refs: [],
      tags: ['paper', 'single-peaked', 'median voter'],
      credit: 'Duncan Black, 1948',
      scope: String.raw`Odd committee size; each eligible curve has a unique peak and is strictly increasing/decreasing on its two sides. Equal values on opposite sides are allowed. Flat segments or multiple peaks are reported outside this strict-curve version. This page re-derives the theorem on an editable committee; it does not reproduce a table or figure from the paper.`,
      links: { doi: 'https://doi.org/10.1086/256633' },
      viz(v) {
        const NO = 7, NM = 5;
        const C = v.stage({ x: [-0.6, NO - 0.4], y: [0, 1.15], axes: 'box', gutter: true, height: 340, minWidth: 340, yticks: [], xticks: range(NO).map((k) => [k, LET[k]]), xlabel: 'options on the line', ylabel: 'member’s value', title: 'committee members’ curves' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 340, title: 'votes between pairs of options' });
        const mem = v.select('member to edit', range(NM).map((i) => ({ value: i, label: String(i + 1) })), 2, { onChange: () => syncHandles() });
        const tent = (pk) => range(NO).map((k) => 1 - Math.abs(k - pk) / 7.5);
        const PEAKS = [0, 1, 3, 4, 6];
        const BASE = () => PEAKS.map((p) => tent(p));
        let U = BASE();
        const HH = range(NO).map((k) => C.handle(k, U[2][k], { color: 'gold', r: 8, constrain: (x, y) => [k, clamp(y, 0.02, 1.1)] }));
        function syncHandles() { HH.forEach((h, k) => h.set(k, U[mem.value][k])); HH.forEach((h) => { h.color = CC[mem.value]; }); }
        HH.forEach((h, k) => { h.onDrag = () => { U[mem.value][k] = h.y; }; });
        v.button('bend member 3', () => { U[2] = [0.84, 0.3, 0.12, 0.35, 0.55, 0.75, 0.95]; syncHandles(); });
        v.button('reset', () => { U = BASE(); syncHandles(); });
        let info = null;
        v.render(() => {
          const peaks = U.map((u) => u.indexOf(Math.max(...u))), uni = U.map(isStrictSinglePeaked);
          range(NM).forEach((i) => {
            const act = i === mem.value;
            C.path(U[i].map((y, k) => [k, y]), { color: CC[i], width: act ? 3 : 1.6, alpha: act ? 1 : 0.4 });
            U[i].forEach((y, k) => { if (!act) C.dot(k, y, { r: 3, color: CC[i], alpha: 0.5 }); });
          });
          HH.forEach((h, k) => { if (Math.abs(h.y - U[mem.value][k]) > 1e-9) h.set(k, U[mem.value][k]); });
          const M = range(NO).map((a) => range(NO).map((b) => (a === b ? 0 : sum(U.map((u) => Math.sign(u[a] - u[b]))))));
          const cw = range(NO).filter((a) => range(NO).every((b) => b === a || M[a][b] > 0));
          let cyc = null; for (let a = 0; a < NO && !cyc; a++) for (let b = 0; b < NO && !cyc; b++) if (M[a][b] > 0) for (let c = 0; c < NO; c++) if (M[b][c] > 0 && M[c][a] > 0) { cyc = [a, b, c]; break; }
          const mp = [...peaks].sort((x, y) => x - y)[(NM - 1) / 2];
          // pair table
          const c = T.ctx, W = T.width, H = T.height, cs = Math.min((W - 60) / NO, (H - 70) / NO), x0 = 40 + (W - 60 - cs * NO) / 2, y0 = 40;
          range(NO).forEach((k) => { txt(v, c, LET[k], x0 + k * cs + cs / 2, y0 - 14, { size: 12, weight: 700, color: k === mp ? 'green' : 'muted' }); txt(v, c, LET[k], x0 - 14, y0 + k * cs + cs / 2, { size: 12, weight: 700, color: k === mp ? 'green' : 'muted' }); });
          range(NO).forEach((a) => range(NO).forEach((b) => {
            const X = x0 + b * cs, Y = y0 + a * cs, val = M[a][b];
            rr(c, X + 1.5, Y + 1.5, cs - 3, cs - 3, 5);
            c.fillStyle = v.color(a === b ? 'grid' : val > 0 ? (a === mp ? 'green' : 'accent') : 'orange', a === b ? 0.3 : val > 0 ? 0.4 : 0.12); c.fill();
            if (a !== b) txt(v, c, (val > 0 ? '+' : val < 0 ? '−' : '') + Math.abs(val), X + cs / 2, Y + cs / 2, { size: 11.5, weight: val > 0 ? 750 : 500, color: val > 0 ? 'ink' : 'muted' });
          }));
          txt(v, c, 'row beats column when positive', W / 2, H - 14, { size: 10.5, color: 'muted' });
          info = { uni, peaks, mp, cw, cyc, M, allUni: uni.every(Boolean) };
        });
        v.legend([['green', 'row of the option at the median peak'], ['accent', 'a majority prefers the row option', { area: true }]]);
        v.readout(() => {
          const { uni, mp, cw, cyc, allUni } = info;
          const head = allUni ? `All five curves satisfy strict single-peakedness. Black’s claim: option **${LET[mp]}**, at the median of the peaks, beats every other option. Computed: ${cw.length ? `Condorcet winner **${cw.map((a) => LET[a]).join(', ')}**${cw[0] === mp ? ' — agreement' : ' — DISAGREEMENT'}` : 'no Condorcet winner — DISAGREEMENT'}.`
            : `Member${uni.filter((u) => !u).length > 1 ? 's' : ''} ${uni.map((u, i) => (u ? null : i + 1)).filter(Boolean).join(', ')} ${uni.filter((u) => !u).length > 1 ? 'fail' : 'fails'} strict single-peakedness, so the theorem does not apply. ${cyc ? `The majority relation cycles: ${cyc.map((a) => LET[a]).join(' ≻ ')} ≻ ${LET[cyc[0]]}.` : cw.length ? `A Condorcet winner still exists (${cw.map((a) => LET[a]).join(', ')}): single-peakedness is sufficient, not necessary.` : 'There is no Condorcet winner.'}`;
          return head;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Paper',
      name: 'An Economic Theory of Political Action in a Democracy',
      paper: { authors: 'Anthony Downs', year: 1957, title: 'An Economic Theory of Political Action in a Democracy', venue: 'Journal of Political Economy 65 (2): 135–150', doi: '10.1086/257897' },
      introduces: ['polsci-4.3'],
      statement: String.raw`Downs models office-seeking parties that formulate policies to gain votes, and uses Hotelling’s spatial analogy to explain convergence and differentiation. His1957 article’s §VI imposes ideological continuity: parties cannot leap across one another, and extremists may abstain as their party moves inward. Its single-mode example converges toward the centre; its polarized example can diverge because of lost extremist support. Its multiparty example can settle at separate modes under the nonleaping restriction. In the simpler modern two-party model with compulsory turnout and unrestricted positions, both parties at a median are an equilibrium for any voter distribution, including a bimodal one.`,
      idea: String.raw`The paper builds on Hotelling's analysis of two sellers on a line (1929; micro-10.17, geog-9.3) and carries it from market to polity, with parties in place of firms and a vote in place of a sale, and the nearest-party median logic connects it to single-peaked voting (polsci-4.12). The article’s own account adds imperfect information, ideological continuity and abstention, so its conclusions are broader and more qualified than an unrestricted median-location game. It introduced the idea that the *shape* of the distribution of voters, not only its centre, decides how parties behave, and that rationality may lead voters to stay home (polsci-5.1). The convergence prediction, polsci-4.3, has been criticized and refined ever since (polsci-4.4).`,
      caption: String.raw`**Top:** voters along the left–right scale. Choose one of four distributions (single-peaked and symmetric, skewed, two-humped, and two-humped with abstention by voters more than $d$ from every party), then drag parties $A$ and $B$ (and add $C$) to see their vote shares. **Bottom:** the game itself. Each point of the plane is a pair of positions $(x_A, x_B)$, coloured by $A$'s margin over $B$; the blue and orange curves are each party's best response to the other, and **green dots** are the pure equilibria, where the curves cross. Drag the gold point in the plane or the parties above; they are the same pair. With full turnout, median convergence remains possible even for a two-humped distribution. Alienation can produce separated or absent pure grid equilibria. These are numerical results of the displayed model, not exact reproductions of Downs’s figures.`,
      deps: ['polsci-4.12', 'micro-10.17'],
      see: ['polsci-4.3', 'polsci-4.4'],
      refs: [],
      tags: ['paper', 'party competition', 'median voter'],
      credit: 'Anthony Downs, 1957',
      scope: String.raw`The demo is a modern one-dimensional nearest-party, vote-share game with full information and unrestricted crossing of party positions. Unlike the original article, its parties may leap over each other and it models alienation by a fixed distance cutoff. The four distributions are my reconstruction of the cases usually discussed, not figures taken from the paper; equilibria are found on a grid of positions with spacing $0.1$.`,
      links: { doi: 'https://doi.org/10.1086/257897' },
      viz(v) {
        const N = 201, Y0 = -0.1, GS = 0.1;
        const D = v.stage({ x: [0, 10], y: [-0.2, 1.25], axes: 'box', gutter: true, height: 270, full: true, yticks: [], xlabel: 'left–right position', ylabel: 'voters', title: 'the electorate and the parties' });
        const P = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 380, minWidth: 360, equal: true, xlabel: 'position of A', ylabel: 'position of B', title: 'the game: A’s margin over B, best responses and equilibria' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 260, title: 'vote shares' });
        const PRE = {
          uni: { label: 'single-peaked', comps: [[1, 5, 1.6]], d: 10.5 },
          skew: { label: 'skewed', comps: [[0.6, 3.5, 1.1], [0.4, 6.6, 2.1]], d: 10.5 },
          bi: { label: 'two-humped', comps: [[0.5, 2.8, 1.1], [0.5, 7.2, 1.1]], d: 10.5 },
          bia: { label: 'two-humped, abstention', comps: [[0.5, 2.8, 1.1], [0.5, 7.2, 1.1]], d: 2.2 },
        };
        const dist = v.select('electorate', Object.entries(PRE).map(([value, p]) => ({ value, label: p.label })), 'uni', { onChange: () => { dth.set(PRE[dist.value].d); } });
        const dth = v.slider('alienation threshold $d$', 0.8, 10.5, 10.5, { step: 0.1, fmt: (x) => (x >= 10.4 ? '∞ (all vote)' : v.fix(x, 1)) });
        const third = v.toggle('add a third party C', false, { onChange: () => { HC.visible = third.value; } });
        const PCOL = ['blue', 'orange', 'teal'], NM = ['A', 'B', 'C'];
        const HA = D.handle(3.5, Y0, { color: 'blue', r: 9, constrain: 'x', label: 'A', labelPos: 'n' });
        const HB = D.handle(6.5, Y0, { color: 'orange', r: 9, constrain: 'x', label: 'B', labelPos: 'n' });
        const HC = D.handle(5, Y0, { color: 'teal', r: 9, constrain: 'x', label: 'C', labelPos: 'n' });
        HC.visible = false;
        const G = P.handle(3.5, 6.5, { color: 'gold', r: 8, constrain: { x: [0, 10], y: [0, 10] } });
        HA.onDrag = () => G.set(HA.x, HB.x); HB.onDrag = () => G.set(HA.x, HB.x);
        G.onDrag = () => { HA.set(G.x, Y0); HB.set(G.y, Y0); };
        let cache = { key: '', eq: [], BRA: [], BRB: [], F: null };
        const weights = () => mixGrid(N, PRE[dist.value].comps);
        function solve(w, d) {
          const F = cdfOf(w), cand = range(Math.round(10 / GS) + 1).map((i) => i * GS);
          const BRA = [], BRB = [];
          const bestA = (xb) => { let b = -1, arg = []; for (const z of cand) { const val = votes2(F, z, xb, d)[0]; if (val > b + 1e-9) { b = val; arg = [z]; } else if (val > b - 1e-9) arg.push(z); } return { b, arg }; };
          const bestB = (xa) => { let b = -1, arg = []; for (const z of cand) { const val = votes2(F, xa, z, d)[1]; if (val > b + 1e-9) { b = val; arg = [z]; } else if (val > b - 1e-9) arg.push(z); } return { b, arg }; };
          const ba = cand.map(bestA), bb = cand.map(bestB), eq = [];
          cand.forEach((xa, i) => cand.forEach((xb, j) => { if (votes2(F, xa, xb, d)[0] >= ba[j].b - 1e-7 && votes2(F, xa, xb, d)[1] >= bb[i].b - 1e-7) eq.push([xa, xb]); }));
          return { F, cand, ba, bb, eq };
        }
        let info = null;
        v.render(() => {
          const w = weights(), d = dth.value, key = dist.value + '|' + d.toFixed(2);
          if (cache.key !== key) cache = { key, ...solve(w, d) };
          const { F, cand, ba, bb, eq } = cache, mx = Math.max(...w);
          const act = third.value ? [0, 1, 2] : [0, 1], Hs = [HA, HB, HC], Ps = act.map((j) => Hs[j].x), tl = tallyBins(Ps, w, d);
          for (let i = 0; i < N; i++) {
            const x0 = (i * 10) / N, g = tl.who[i];
            D.rect(x0, 0, x0 + 10 / N, w[i] / mx, { fill: g < 0 ? 'gray' : PCOL[act[g]], fillAlpha: g < 0 ? 0.28 : 0.5, stroke: false });
          }
          D.fn((x) => w[clamp(Math.floor((x / 10) * N), 0, N - 1)] / mx, { color: 'ink', width: 1.4, n: 300 });
          const med = gridMedian(w); D.vline(med, { color: 'green', width: 2 }); D.text('median', med, 1.17, { color: 'green', size: 11.5, weight: 700 });
          // the plane
          P.heat((xa, xb) => { const [a, b] = votes2(F, xa, xb, d); return a - b; }, { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'blue', res: 4, key: `h${key}` });
          P.line(0, 0, 10, 10, { color: 'faint', dash: true, alpha: 0.7 });
          P.path(cand.map((xb, j) => [ba[j].arg.reduce((p, q) => (Math.abs(q - xb) < Math.abs(p - xb) ? q : p)), xb]), { color: 'blue', width: 2 });
          P.path(cand.map((xa, i) => [xa, bb[i].arg.reduce((p, q) => (Math.abs(q - xa) < Math.abs(p - xa) ? q : p))]), { color: 'orange', width: 2 });
          eq.forEach(([a, b]) => P.dot(a, b, { r: 6, color: 'green' }));
          P.vline(med, { color: 'green', alpha: 0.35, dash: true }); P.hline(med, { color: 'green', alpha: 0.35, dash: true });
          // shares panel
          const c = R.ctx, W = R.width, H = R.height, bw = Math.min(46, W / 6);
          const items = [...act.map((j, k) => [NM[j], tl.vt[k], PCOL[j]]), ['abstain', tl.ab, 'gray']];
          items.forEach(([nm, val, col], k) => {
            const X = 30 + (k + 0.5) * ((W - 40) / items.length), h = val * (H - 100);
            rr(c, X - bw / 2, H - 40 - h, bw, Math.max(2, h), 5); c.fillStyle = v.color(col, 0.6); c.fill();
            txt(v, c, pct(val, 1), X, H - 48 - h, { size: 12, weight: 700 }); txt(v, c, nm, X, H - 22, { size: 12, weight: 700, color: col });
          });
          info = { Ps, tl, med, eq, act };
        });
        v.legend([['blue', 'A’s best response'], ['orange', 'B’s best response'], ['green', 'pure equilibria', { dot: true }], ['gold', 'current positions', { dot: true }]]);
        v.readout(() => {
          const { Ps, tl, med, eq, act } = info, g = (x) => v.fix(x, 2);
          const eqs = eq.length ? eq.slice(0, 4).map(([a, b]) => `(${g(a)}, ${g(b)})`).join(', ') + (eq.length > 4 ? ` and ${eq.length - 4} more` : '') : 'none';
          const near = Math.abs(Ps[0] - med) < 0.15 && Math.abs(Ps[1] - med) < 0.15;
          return `Median voter at ${g(med)}. Positions ${act.map((j, k) => `${NM[j]} = ${g(Ps[k])}`).join(', ')}; shares ${act.map((j, k) => `${NM[j]} ${pct(tl.vt[k], 1)}`).join(', ')}, abstaining ${pct(tl.ab, 1)}. Pure equilibria of the two-party game: **${eqs}**. ${eq.length === 1 && Math.abs(eq[0][0] - med) < 0.16 && Math.abs(eq[0][1] - med) < 0.16 ? 'Downs’s convergence: the only equilibrium puts both parties at the median.' : eq.length && !eq.some(([a, b]) => Math.abs(a - med) < 0.16 && Math.abs(b - med) < 0.16) ? 'No equilibrium at the median: the parties stay apart.' : ''}${near ? ' (Your positions are at the median.)' : ''}`;
        });
      },
    },
  ],
};
