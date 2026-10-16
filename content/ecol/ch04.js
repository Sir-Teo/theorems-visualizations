// Ecology — Chapter 4: Competition and coexistence
import { rcSpec, rcRun, monoEq, invasionOutcome, zngiCross, drawZngi, lvComp, hwStep, hwMu, monodK, spcol, SPCOL } from './ch04.shared.js';

const OUT = { A: 'A excludes B', B: 'B excludes A', coexist: 'stable coexistence', either: 'either can win (priority effect)', none: 'neither persists' };

export default {
  collection: 'ecol',
  chapter: 4,
  title: 'Competition and coexistence',
  summary: String.raw`Competitive exclusion predicts that similar species cannot coexist on one resource, yet nature is full of competitors living side by side. Field experiments separate fundamental from realized niches; Tilman’s resource-ratio theory says when coexistence is possible; Hutchinson’s plankton paradox and its resolutions — non-equilibrium dynamics, fluctuations, natural enemies, colonization trade-offs — show how. Modern coexistence theory sorts mechanisms into stabilizing and equalizing ones.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Fundamental and realized niche (Connell’s barnacles)',
      credit: 'J. H. Connell, 1961 (building on G. E. Hutchinson’s 1957 niche concept)',
      statement: String.raw`The **fundamental niche** of a species is the range of conditions in which it could survive and reproduce if no other species interfered; its **realized niche** is the smaller range it actually occupies in the presence of competitors, predators and other enemies. On a rocky shore, adults of the small barnacle *Chthamalus stellatus* live high on the shore, although its larvae settle over a much wider band; in Connell’s experiments, the larvae that settled lower down survived and grew when the larger barnacle *Semibalanus balanoides* was removed, but were crowded off and undercut by it when it was present.`,
      scope: String.raw`The picture is for a physical gradient with one dominant competitor. The upper limit of each species was set by physical stress (desiccation) and the lower limit of *Chthamalus* by competition, an asymmetry that is typical of rocky shores but not a general law. The curves below are a schematic model, not Connell’s counts.`,
      idea: String.raw`Competition can only *shrink* a niche: it subtracts from the fundamental niche the set of conditions where a rival does better. So the realized niche is the fundamental niche minus the region of competitive loss, and the way to measure the fundamental niche is to remove the competitor and see how far the species spreads. Connell did exactly this on a Scottish shore: scraping off *Semibalanus* let *Chthamalus* occupy the lower zone, showing that the lower boundary of its realized range was set by competition while the upper boundary was physiological.`,
      caption: String.raw`The horizontal axis is height on the shore. Dashed blue is where *Chthamalus* could survive on physiology alone (its fundamental niche); the solid blue area is where it survives given the crowding by *Semibalanus* (orange). Switch on **remove *Semibalanus*** and the blue area expands downward to the dashed curve. Raise the competition strength, or lower the orange species’ upper limit, to see how the realized niche responds.`,
      deps: ['ecol-1.1'],
      refs: ['Begon ch. 8'],
      tags: ['niche', 'competition', 'field experiment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Niche_differentiation', doi: 'https://doi.org/10.2307/1933500' },
      verify: true,
      viz(v) {
        const kS = v.slider('competition strength (crowding and undercutting)', 0, 6, 4, { step: 0.1 });
        const hS = v.slider('upper limit of the dominant barnacle (desiccation)', 4, 8, 6, { step: 0.1 });
        const rem = v.toggle('remove Semibalanus', false);
        const A = v.stage({ x: [0, 10], y: [0, 1.18], axes: 'box', gutter: true, height: 340, xlabel: 'height on the shore (low tide → high tide)', ylabel: 'relative survival to adult', title: 'barnacles along an intertidal gradient (schematic model)', xticks: [[0.5, 'low'], [5, 'mid'], [9.5, 'high']] });
        const sg = (x, c, w) => 1 / (1 + Math.exp((x - c) / w));
        const phC = (h) => sg(h, 9.3, 0.25);
        let info = null;
        v.render(() => {
          const hb = hS.value, k = kS.value, off = rem.value;
          const B = (h) => (off ? 0 : sg(h, hb, 0.2));
          const real = (h) => phC(h) * Math.exp(-k * B(h));
          A.fn(B, { color: 'orange', width: 2.4, fill: true, fillAlpha: 0.2, domain: [0, 10] });
          A.fn(real, { color: 'accent', width: 2.8, fill: true, fillAlpha: 0.3, domain: [0, 10] });
          A.fn(phC, { color: 'accent', width: 2, dash: [6, 4], domain: [0, 10] });
          const low = (f) => { for (let h = 0; h <= 10; h += 0.02) if (f(h) >= 0.1) return h; return NaN; };
          const lr = low(real), lf = low(phC);
          if (isFinite(lr)) A.vline(lr, { color: 'green', width: 1.2, dash: true });
          A.text('Semibalanus', Math.max(0.3, hb - 3), 0.5, { color: 'orange', size: 13 });
          A.text('Chthamalus', 8.4, 1.1, { color: 'accent', size: 13 });
          info = { lr, lf };
        });
        v.legend([['accent', 'Chthamalus realized'], ['accent', 'Chthamalus fundamental (physiology only)', { dash: true }], ['orange', 'Semibalanus']]);
        v.readout(() => info && (isFinite(info.lr) ? String.raw`Lowest height where *Chthamalus* reaches 10 % survival: realized **${v.fix(info.lr, 1)}**, fundamental **${v.fix(info.lf, 1)}** (axis units). The niche lost to competition spans **${v.fix(Math.max(0, info.lr - info.lf), 1)}** units of shore height.` : 'Chthamalus cannot survive anywhere.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Gause’s Paramecium experiments',
      credit: 'G. F. Gause, 1932–1934',
      statement: String.raw`Gause grew the ciliates *Paramecium aurelia*, *P. caudatum* and *P. bursaria* in small tubes of a bacteria-fed medium. Each species alone grew along a logistic curve to its own carrying capacity. Mixed in one tube, *P. aurelia* drove *P. caudatum* extinct, whereas *P. caudatum* and *P. bursaria*, which use different parts of the tube (bacteria in the open water versus yeast at the bottom), persisted together. Gause interpreted the first outcome with the Lotka–Volterra competition equations, which he fitted to the monocultures and used to predict the mixture.`,
      scope: String.raw`Laboratory microcosms with a constant, controlled feeding schedule. Gause's culture medium was replaced regularly, so the growth rates and competition coefficients are fitted constants of a particular protocol. The curves below are a model reconstruction with illustrative parameters of the right order of magnitude, not Gause’s raw counts.`,
      idea: String.raw`Alone, each species obeys $dN/dt=rN(1-N/K)$. Together, each one's growth is reduced by the other as if every individual of the rival were $\alpha$ individuals of its own kind. Species 1 wins when its carrying capacity is high enough that species 2 cannot invade at $N_1=K_1$ (and vice versa), the four cases of mathbio-3.16; Gause's *aurelia*/*caudatum* tubes were the classic example of exclusion (mathbio-3.17), and the *caudatum*/*bursaria* tubes of coexistence through niche differentiation.`,
      caption: String.raw`Choose the pair. Left: monocultures follow logistic curves. Middle: the same species mixed, with the model's competition coefficients (sliders). Right: the phase plane with the two isoclines, the trajectory and the final state. For *aurelia*/*caudatum* the default coefficients let *aurelia* win; lower both coefficients (less overlap) and they coexist, raise both and the winner depends on who starts ahead.`,
      deps: ['mathbio-3.17'],
      refs: ['Begon ch. 8'],
      tags: ['competitive exclusion', 'experiment', 'Lotka–Volterra'],
      links: { doi: 'https://doi.org/10.1126/science.79.2036.16.b', wikipedia: 'https://en.wikipedia.org/wiki/Competitive_exclusion_principle' },
      verify: true,
      viz(v) {
        const PAIRS = {
          ac: { n1: 'P. caudatum', n2: 'P. aurelia', r1: 0.6, r2: 0.8, K1: 60, K2: 200, a12: 0.5, a21: 0.9 },
          cb: { n1: 'P. caudatum', n2: 'P. bursaria', r1: 0.6, r2: 0.4, K1: 60, K2: 100, a12: 0.3, a21: 0.5 },
        };
        const pair = v.select('pair of species', [{ value: 'ac', label: 'caudatum + aurelia' }, { value: 'cb', label: 'caudatum + bursaria' }], 'ac', { onChange: () => { s12.set(PAIRS[pair.value].a12); s21.set(PAIRS[pair.value].a21); } });
        const s12 = v.slider('effect of the rival on caudatum $\\alpha_{12}$', 0, 2, 0.5, { step: 0.05 });
        const s21 = v.slider('effect of caudatum on the rival $\\alpha_{21}$', 0, 2, 0.9, { step: 0.05 });
        const T = 25;
        const A = v.stage({ x: [0, T], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'days', ylabel: 'cells per 0.5 mL', title: 'monocultures', weight: 1 });
        const B = v.stage({ x: [0, T], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'days', ylabel: 'cells per 0.5 mL', title: 'mixed culture', weight: 1 });
        const C = v.stage({ x: [0, 90], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'caudatum', ylabel: 'rival', title: 'phase plane', weight: 1 });
        let info = null;
        v.render(() => {
          const P = { ...PAIRS[pair.value], a12: s12.value, a21: s21.value };
          const m1 = lvComp({ ...P, a12: 0, a21: 0 }, 2, 2, T), m2 = m1;
          A.path(m1.t.map((t, i) => [t, m1.x[i]]), { color: 'accent', width: 2.4 });
          A.path(m1.t.map((t, i) => [t, m1.y[i]]), { color: 'orange', width: 2.4 });
          const run = lvComp(P, 2, 2, T);
          B.path(run.t.map((t, i) => [t, run.x[i]]), { color: 'accent', width: 2.4 });
          B.path(run.t.map((t, i) => [t, run.y[i]]), { color: 'orange', width: 2.4 });
          // isoclines of the (x = caudatum, y = rival) system
          C.path([[0, P.K1 / P.a12], [P.K1, 0]], { color: 'accent', width: 1.8, dash: true });
          C.path([[0, P.K2], [P.K2 / P.a21, 0]], { color: 'orange', width: 1.8, dash: true });
          for (const [x0, y0] of [[2, 2], [50, 5], [5, 150], [60, 120], [85, 20]]) {
            const q = lvComp(P, x0, y0, 60, 240);
            C.path(q.t.map((t, i) => [q.x[i], q.y[i]]), { color: 'muted', width: 1, alpha: 0.5 });
          }
          C.path(run.t.map((t, i) => [run.x[i], run.y[i]]), { color: 'gold', width: 2.6 });
          const end = lvComp(P, 2, 2, 400, 800), xe = end.x[end.x.length - 1], ye = end.y[end.y.length - 1];
          C.dot(xe, ye, { r: 6, color: 'green' });
          const inv1 = P.K1 - P.a12 * P.K2 > 0, inv2 = P.K2 - P.a21 * P.K1 > 0;
          info = { xe, ye, inv1, inv2, P, m1: m1.x[m1.x.length - 1], m2: m1.y[m1.y.length - 1] };
        });
        v.legend([['accent', 'P. caudatum'], ['orange', 'the rival species'], ['gold', 'trajectory from 2 + 2 cells'], ['green', 'final state', { dot: true }]]);
        v.readout(() => info && String.raw`Rival = *${info.P.n2}*. Species can invade the other's carrying-capacity state: caudatum **${info.inv1 ? 'yes' : 'no'}**, rival **${info.inv2 ? 'yes' : 'no'}** → ${info.inv1 && info.inv2 ? 'coexistence' : info.inv2 ? 'the rival excludes *caudatum*' : info.inv1 ? '*caudatum* excludes the rival' : 'outcome depends on starting numbers'}. After 400 days the model gives caudatum $${v.fix(info.xe, 1)}$, rival $${v.fix(info.ye, 1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Tilman’s resource-ratio theory',
      credit: 'D. Tilman, 1980–1982',
      statement: String.raw`Two species consume two essential resources $R_1,R_2$ (each is required, and growth is set by the scarcer one) that are supplied to a well-mixed system. Each species has a **zero-net-growth isocline** (ZNGI): the L-shaped curve in resource space on which its growth just balances its losses, with corner $(R_1^*,R_2^*)$. It grows when the resources lie above and to the right of its ZNGI. Each species also has a **consumption vector**, the ratio in which it draws the two resources down. The outcome depends on the ZNGIs, the consumption vectors and the supply point $(S_1,S_2)$: either species can win, both can coexist, or whichever is established first can win.`,
      scope: String.raw`Essential resources (growth set by the scarcest, Liebig-style), a continuously supplied, well-mixed chemostat-like system, constant consumption ratios, and no other limiting factors. Substitutable resources, spatial structure and fluctuating supply change the geometry.`,
      idea: String.raw`A species left alone draws the resources down until they reach its ZNGI, and sits at the point on the ZNGI where its consumption vector balances the supply (the mono-culture equilibrium). A rival can invade only if that point lies above the rival's own ZNGI. Looking at this invasion test for both species gives the four outcomes. The one-resource special case is the $R^*$ rule of mathbio-3.20: the species that can live on the least of the limiting resource wins.`,
      caption: String.raw`Drag the two ZNGI corners (blue = species A, orange = species B) and the supply point (gold). The sliders turn each species’ consumption vector. Dashed lines run from the supply point to each species’ single-species equilibrium (pulling in the direction $-c$). The gold path is the resource trajectory from a full simulation of the chemostat, shown on the right as abundances. The readout compares the graphical prediction with the simulation.`,
      deps: ['mathbio-3.20'],
      refs: ['Begon ch. 8'],
      tags: ['resource competition', 'Tilman', 'ZNGI'],
      links: { doi: 'https://doi.org/10.1086/283633' },
      viz(v) {
        let key = '', run = null, info = null, prog = 1;
        const tA = v.slider('consumption angle of A (°, from the $R_1$ axis)', 5, 85, 30, { step: 1 });
        const tB = v.slider('consumption angle of B (°)', 5, 85, 60, { step: 1 });
        const A = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: 'box', gutter: true, height: 340, xlabel: 'resource 1', ylabel: 'resource 2', title: 'resource space', weight: 1 });
        const B = v.stage({ x: [0, 150], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: 'abundance', title: 'abundances', weight: 1 });
        const ha = A.handle(5, 2, { color: 'accent', r: 8, label: 'A', constrain: { x: [0.5, 9.5], y: [0.5, 9.5] } });
        const hb = A.handle(2, 5, { color: 'orange', r: 8, label: 'B', constrain: { x: [0.5, 9.5], y: [0.5, 9.5] } });
        const hs = A.handle(9, 9, { color: 'gold', r: 8, label: 'S', constrain: { x: [0.5, 9.8], y: [0.5, 9.8] } });
        v.render(() => {
          const sa = rcSpec([ha.x, ha.y], tA.value), sb = rcSpec([hb.x, hb.y], tB.value), S = [hs.x, hs.y];
          const k = [ha.x, ha.y, hb.x, hb.y, hs.x, hs.y, tA.value, tB.value].map((x) => x.toFixed(3)).join('|');
          if (k !== key) { key = k; run = rcRun(sa, sb, S, [0.5, 0.5], 150, 0.05, 8); }
          drawZngi(A, sa.z, { color: 'accent', width: 2.8 });
          drawZngi(A, sb.z, { color: 'orange', width: 2.8 });
          const ea = monoEq(sa, S), eb = monoEq(sb, S);
          for (const [e, c, col] of [[ea, sa.c, 'accent'], [eb, sb.c, 'orange']]) {
            if (!e) continue;
            A.line(S[0], S[1], e.eq[0], e.eq[1], { color: col, width: 1.3, dash: [5, 4], alpha: 0.8 });
            A.arrow(e.eq[0], e.eq[1], e.eq[0] - 1.4 * c[0], e.eq[1] - 1.4 * c[1], { color: col, width: 2 });
            A.dot(e.eq[0], e.eq[1], { r: 4, color: col, hollow: true });
          }
          const x = zngiCross(sa, sb);
          if (x) A.dot(x[0], x[1], { r: 5, color: 'ink' });
          const idx = Math.min(run.t.length - 1, Math.floor(prog * (run.t.length - 1)));
          A.path(run.R.slice(0, idx + 1), { color: 'gold', width: 2 });
          A.dot(run.R[idx][0], run.R[idx][1], { r: 5, color: 'gold' });
          const mx = Math.max(1, ...run.NA, ...run.NB) * 1.1;
          B.setView([0, 150], [0, mx]);
          B.path(run.t.slice(0, idx + 1).map((t, i) => [t, run.NA[i]]), { color: 'accent', width: 2.4 });
          B.path(run.t.slice(0, idx + 1).map((t, i) => [t, run.NB[i]]), { color: 'orange', width: 2.4 });
          const th = invasionOutcome(sa, sb, S), n = run.NA.length - 1;
          const ra = run.NA[n], rb = run.NB[n], sim = ra > 0.01 && rb > 0.01 ? 'coexist' : ra > 0.01 ? 'A' : rb > 0.01 ? 'B' : 'none';
          info = { th, sim, ra, rb, sa, sb };
        });
        v.animate((t) => { prog = Math.min(1, t / 12); v.invalidate(); }, { period: 14, still: 13.9 });
        v.legend([['accent', 'A: ZNGI and abundance'], ['orange', 'B: ZNGI and abundance'], ['gold', 'resource trajectory']]);
        v.readout(() => info && String.raw`Graphical prediction (invasion test): **${OUT[info.th]}**. Simulation at $t=150$: $N_A=${v.fix(info.ra, 2)}$, $N_B=${v.fix(info.rb, 2)}$ → ${info.sim === info.th || (info.th === 'either' && info.sim !== 'coexist') ? 'agrees' : 'differs (see the slow approach or the starting abundances)'}.
$R^*_A=(${v.fix(info.sa.z[0], 1)},${v.fix(info.sa.z[1], 1)})$, $R^*_B=(${v.fix(info.sb.z[0], 1)},${v.fix(info.sb.z[1], 1)})$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Two-resource coexistence: isoclines and consumption vectors',
      credit: 'D. Tilman, 1980–1982',
      statement: String.raw`Two species compete for two essential resources. They can coexist at a stable equilibrium only if (i) their ZNGIs cross, so that each species is the better competitor for a different resource (species A needs less of $R_2$, species B needs less of $R_1$); (ii) each species consumes proportionally more of the resource that limits **it** at the crossing point (A, limited by $R_1$ there, consumes relatively more $R_1$ than B does; B consumes relatively more $R_2$); and (iii) the supply point lies in the cone spanned by the two consumption vectors drawn from the crossing point. If the ZNGIs cross but (ii) is reversed, the crossing point is an unstable equilibrium and the species that gets ahead excludes the other.`,
      scope: String.raw`The same essential-resource chemostat as 4.3. The statement describes generic parameter values; in the borderline case of equal consumption ratios there is no equilibrium with both species.`,
      idea: String.raw`At the crossing point both species just break even. For the resource levels to stay put, the supply vector $S-R^*$ has to be balanced by the consumption of both species, so it must be a positive combination of their consumption vectors: that is the cone condition. Stability comes from self-limitation: if A's abundance rises, it depletes mostly $R_1$, which is the resource limiting A itself, so A is held back; with the vectors reversed, A depletes the resource that limits B instead and helps B at its own expense.`,
      caption: String.raw`The ZNGIs are fixed (A in blue, B in orange); they cross at the black dot. Turn the consumption vectors with the sliders and drag the supply point (gold). The shaded wedge is the cone in which coexistence is possible. The right panel starts the chemostat from three different mixes and plots the fraction of A: when coexistence is stable all three curves converge to the same value; when the consumption vectors are reversed they separate to 0 or 1.`,
      deps: ['ecol-4.3'],
      refs: ['Begon ch. 8'],
      tags: ['coexistence', 'stability', 'Tilman'],
      verify: true,
      viz(v) {
        const tA = v.slider('A consumes $R_1$ more: angle of A (°)', 5, 85, 30, { step: 1 });
        const tB = v.slider('angle of B (°)', 5, 85, 60, { step: 1 });
        const A = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: 'box', gutter: true, height: 340, xlabel: 'resource 1', ylabel: 'resource 2', title: 'resource space', weight: 1 });
        const B = v.stage({ x: [0, 400], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: 'fraction of A', title: 'three starting mixes', weight: 1 });
        const hs = A.handle(9, 9, { color: 'gold', r: 8, label: 'S', constrain: { x: [5.2, 9.8], y: [5.2, 9.8] } });
        let key = '', runs = [], info = null;
        const mixes = [[2, 0.2], [0.8, 0.8], [0.2, 2]];
        v.render(() => {
          const sa = rcSpec([5, 2], tA.value), sb = rcSpec([2, 5], tB.value), S = [hs.x, hs.y];
          const k = [tA.value, tB.value, hs.x.toFixed(3), hs.y.toFixed(3)].join('|');
          if (k !== key) { key = k; runs = mixes.map((m) => rcRun(sa, sb, S, m, 400, 0.1, 10)); }
          const X = [5, 5];
          // cone between the consumption vectors, drawn from the crossing point (in the +c direction: the supply must be their positive combination)
          const L = 8;
          A.poly([X, [X[0] + L * sa.c[0], X[1] + L * sa.c[1]], [X[0] + L * sb.c[0], X[1] + L * sb.c[1]]], { fill: 'green', fillAlpha: 0.16, stroke: false });
          A.arrow(X[0], X[1], X[0] + 2.2 * sa.c[0], X[1] + 2.2 * sa.c[1], { color: 'accent', width: 2.4 });
          A.arrow(X[0], X[1], X[0] + 2.2 * sb.c[0], X[1] + 2.2 * sb.c[1], { color: 'orange', width: 2.4 });
          drawZngi(A, sa.z, { color: 'accent', width: 2.8 });
          drawZngi(A, sb.z, { color: 'orange', width: 2.8 });
          A.dot(X[0], X[1], { r: 5, color: 'ink' });
          A.text('cone: coexistence region for S', 5.4, 3.4, { color: 'green', size: 12, align: 'left' });
          const th = invasionOutcome(sa, sb, S);
          B.hline(0.5, { color: 'grid' });
          const cols = ['accent', 'gold', 'orange'];
          let fr = [];
          runs.forEach((r, q) => {
            B.path(r.t.map((t, i) => [t, r.NA[i] / Math.max(1e-9, r.NA[i] + r.NB[i])]), { color: cols[q], width: 2.2 });
            const n = r.t.length - 1; fr.push(r.NA[n] / Math.max(1e-9, r.NA[n] + r.NB[n]));
          });
          info = { th, fr, stable: tA.value < tB.value };
        });
        v.legend([['accent', 'start: mostly A'], ['gold', 'start: even'], ['orange', 'start: mostly B']]);
        v.readout(() => info && String.raw`Consumption condition (A takes relatively more $R_1$ than B): **${info.stable ? 'satisfied' : 'violated'}**. Invasion test: **${OUT[info.th]}**. Final fraction of A from the three starts: $${info.fr.map((x) => v.fix(x, 2)).join(',\\ ')}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Paradox',
      name: 'Paradox of the plankton (Hutchinson)',
      credit: 'G. E. Hutchinson, 1961',
      statement: String.raw`Phytoplankton in a well-mixed lake or ocean draw on a handful of resources (light, nitrogen, phosphorus, silicon, iron…), yet dozens of species coexist in one small water sample. Competitive exclusion theory for resource competition says that, in a constant environment, at equilibrium no more species than limiting resources can persist. The apparent contradiction is Hutchinson's paradox of the plankton.`,
      scope: String.raw`The expected-number limit holds for generic parameters at a steady state; it is a statement about equilibria, which is exactly the loophole that the resolutions in 4.6–4.12 use (non-equilibrium dynamics, a fluctuating environment, natural enemies, spatial structure). The random species below are a model, not a census.`,
      idea: String.raw`At an equilibrium each coexisting species must be held at break-even by the resource levels; with $k$ resources there are only $k$ free numbers, and demanding $n$ different species to break even at once generically needs $n\le k$ (Tilman's geometry of 4.3–4.4 in $k$ dimensions). Hutchinson proposed that the environment never settles long enough for the exclusion to finish, an idea that Huisman and Weissing made precise (4.6).`,
      caption: String.raw`A random community of $n$ species competes for $k$ essential resources in a chemostat (random half-saturation constants and resource-use ratios, a fixed draw). Raise $n$ above $k$: the curves of the extra species die away and at most $k$ remain, as the bars on the right count (blue: species present, green: persisting). **New draw** reshuffles the species; some draws oscillate rather than settle, which already hints at the resolution in 4.6.`,
      deps: ['ecol-4.3'],
      refs: ['Begon ch. 19'],
      tags: ['paradox', 'plankton', 'competitive exclusion'],
      links: { doi: 'https://doi.org/10.1086/282171', wikipedia: 'https://en.wikipedia.org/wiki/Paradox_of_the_plankton' },
      viz(v) {
        const kS = v.slider('number of limiting resources $k$', 1, 5, 3, { int: true });
        const nS = v.slider('number of species $n$', 2, 12, 10, { int: true });
        let seed = 11;
        v.button('New draw', () => { seed += 1; });
        const A = v.stage({ x: [0, 600], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: 'abundance', title: 'abundances in the chemostat', weight: 1.5 });
        const B = v.stage({ x: [0, 4], y: [0, 13], axes: 'box', gutter: true, height: 330, xticks: [[1, 'k'], [2, 'present'], [3, 'persisting']], ylabel: 'number of species', title: 'species vs resources', weight: 0.8 });
        let key = '', res = null, info = null;
        v.render(() => {
          const k = kS.value, n = nS.value, kk = k + '|' + n + '|' + seed;
          if (kk !== key) {
            key = kk;
            const r = v.rng(seed * 101 + 7), K = [], Q = [], S = [];
            for (let i = 0; i < 12; i++) { K.push([]); Q.push([]); for (let j = 0; j < 5; j++) { K[i].push(r.uniform(0.05, 0.5)); Q[i].push(r.uniform(0.03, 0.15)); } }
            for (let j = 0; j < 5; j++) S.push(r.uniform(5, 15));
            const P = { K: K.slice(0, n).map((x) => x.slice(0, k)), Q: Q.slice(0, n).map((x) => x.slice(0, k)), S: S.slice(0, k), D: 0.25, m: 0.25, r: 1 };
            const st = { N: Array.from({ length: n }, (_, i) => 0.1 + 0.01 * (i + 1)), R: P.S.slice(), t: 0 };
            const T = [], H = Array.from({ length: n }, () => []);
            const dt = 0.1;
            for (let s = 0; s <= 6000; s++) {
              if (s % 20 === 0) { T.push(st.t); st.N.forEach((x, i) => H[i].push(x)); }
              hwStep(P, st, dt);
            }
            const tot = st.N.reduce((a, b) => a + b, 0);
            const alive = st.N.map((x) => x > 0.01 * tot);
            // fluctuation of survivors over the last 20 % of the run
            let cv = 0;
            H.forEach((h, i) => { if (!alive[i]) return; const w = h.slice(-60), mn = w.reduce((a, b) => a + b, 0) / w.length; const sd = Math.sqrt(w.reduce((a, b) => a + (b - mn) ** 2, 0) / w.length); cv = Math.max(cv, sd / Math.max(mn, 1e-9)); });
            res = { T, H, alive, cv, n: n, k: k, count: alive.filter(Boolean).length, mx: Math.max(...H.flat()) };
          }
          A.setView([0, 600], [0, res.mx * 1.1]);
          res.H.forEach((h, i) => A.path(h.map((x, q) => [res.T[q], x]), { color: spcol(i), width: res.alive[i] ? 2.2 : 1.2, alpha: res.alive[i] ? 1 : 0.45, dash: res.alive[i] ? false : [4, 3] }));
          B.bars([res.k, res.n, res.count], { x0: 1, dx: 1, color: (val, i) => ['ink', 'accent', 'green'][i] });
          info = res;
        });
        v.readout(() => info && String.raw`$k=${info.k}$ resources, $n=${info.n}$ species introduced → **${info.count}** persist at $t=600$ (more than $k$ would signal non-equilibrium coexistence). Largest relative fluctuation among survivors over the last 120 time units: ${v.fix(info.cv * 100, 1)} %${info.cv > 0.05 ? ' — this community has not settled to an equilibrium' : ''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Chaotic coexistence of plankton (Huisman–Weissing)',
      credit: 'J. Huisman & F. J. Weissing, 1999',
      statement: String.raw`In a chemostat model of species competing for essential resources, species can generate sustained oscillations and chaos. Huisman and Weissing showed that five species competing for five resources can fluctuate chaotically without any species being lost, and that with twelve species on five resources all twelve can persist: more species coexist than there are resources, because the resource supply is never at equilibrium and the identity of the limiting resource keeps changing.`,
      scope: String.raw`A deterministic model with a parameter set that Huisman and Weissing chose to produce chaos (here the five- and twelve-species sets of their Figs 2 and 4, as reproduced in the R package *rescomp*). Persistence of all twelve species was found in long numerical runs, not proved; numerical chaotic trajectories depend on the integrator and its step size, so only the qualitative behaviour is reproducible.`,
      idea: String.raw`Each species is limited by whichever resource is scarcest for it, and each draws that resource down, so the limiting resource flips back and forth as species rise and fall. When consumption is arranged so that each species has most impact on the resource for which it is an intermediate competitor, the cycle of limiting resources becomes irregular. Because no species can ever fully exclude the others during a transient, the system never reaches the equilibrium to which the competitive-exclusion argument of 4.5 applies.`,
      caption: String.raw`Left: abundances of the five species (chemostat model, essential resources). Right: two copies of the system started with a difference of $10^{-6}$ in one abundance; the difference grows by many orders of magnitude, the signature of chaos. Switch to **12 species** to see Huisman–Weissing's staged introduction of the extra species (at times 1000, 3000 and 5000), which here all keep persisting for 10 000 time units; the 12-species run takes a moment to compute.`,
      deps: ['ecol-4.5', 'ecol-4.4'],
      refs: ['Begon ch. 19'],
      tags: ['chaos', 'plankton', 'coexistence'],
      links: { doi: 'https://doi.org/10.1038/46540' },
      verify: true,
      viz(v) {
        const K = [[0.39, 0.22, 0.27, 0.30, 0.34], [0.34, 0.39, 0.22, 0.24, 0.30], [0.30, 0.34, 0.39, 0.22, 0.22], [0.24, 0.30, 0.34, 0.39, 0.20], [0.23, 0.27, 0.30, 0.34, 0.39],
          [0.41, 0.16, 0.07, 0.28, 0.40], [0.20, 0.15, 0.11, 0.12, 0.50], [0.45, 0.05, 0.05, 0.13, 0.26], [0.14, 0.38, 0.38, 0.27, 0.12], [0.15, 0.29, 0.41, 0.33, 0.29], [0.38, 0.37, 0.24, 0.04, 0.09], [0.28, 0.31, 0.25, 0.41, 0.16]];
        const Q = [[0.04, 0.08, 0.10, 0.05, 0.07], [0.04, 0.08, 0.10, 0.03, 0.09], [0.07, 0.08, 0.10, 0.03, 0.07], [0.04, 0.10, 0.10, 0.03, 0.07], [0.04, 0.08, 0.14, 0.03, 0.07],
          [0.22, 0.14, 0.22, 0.09, 0.05], [0.10, 0.22, 0.24, 0.07, 0.24], [0.08, 0.04, 0.12, 0.06, 0.05], [0.02, 0.18, 0.03, 0.03, 0.08], [0.17, 0.06, 0.24, 0.03, 0.10], [0.25, 0.20, 0.17, 0.11, 0.02], [0.03, 0.04, 0.01, 0.05, 0.04]];
        const S = [6, 10, 14, 4, 9];
        const mode = v.select('community', [{ value: '5', label: '5 species' }, { value: '12', label: '12 species' }], '5');
        const A = v.stage({ x: [0, 1000], y: [0, 60], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: 'abundance', title: 'species abundances', weight: 1.4 });
        const B = v.stage({ x: [0, 1000], y: [-8, 2], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: '$\\log_{10}$ |difference|', title: 'sensitive dependence (5 species)', weight: 1 });
        const cache = {};
        const run = (n, T, intro, N0, pert) => {
          const P = { K: K.slice(0, n), Q: Q.slice(0, n), S, D: 0.25, m: 0.25, r: 1 };
          const st = { N: Array(n).fill(0), R: S.slice(), t: 0 };
          const dt = 0.05, rec = []; const rate = Math.round(5 / dt);
          for (let s = 0; s <= Math.round(T / dt); s++) {
            const t = s * dt;
            if (Math.abs(t - Math.round(t)) < 1e-9) for (const [ti, ids] of intro) if (ti === Math.round(t)) ids.forEach((i) => { st.N[i] = 0.1 + (i + 1) / 100 + (i === 0 ? pert : 0); });
            if (s % rate === 0) rec.push(Float64Array.from(st.N));
            hwStep(P, st, dt);
          }
          return rec;
        };
        let info = null;
        v.render(() => {
          const m = mode.value;
          if (!cache[m]) {
            if (m === '5') {
              const a = run(5, 1000, [[0, [0, 1, 2, 3, 4]]], 0, 0), b = run(5, 1000, [[0, [0, 1, 2, 3, 4]]], 0, 1e-6);
              cache[m] = { a, b, T: 1000 };
            } else {
              const a = run(12, 10000, [[0, [0, 1, 2, 3, 4]], [1000, [5, 6, 7]], [3000, [8, 9]], [5000, [10, 11]]], 0, 0);
              cache[m] = { a, T: 10000 };
            }
          }
          const c = cache[m], n = c.a[0].length;
          const mx = Math.max(...c.a.map((r) => Math.max(...r)));
          A.setView([0, c.T], m === '5' ? [0, mx * 1.08] : [0.0005, mx * 1.5]);
          A.setScale({ ylog: m === '12', y: m === '12' ? [0.001, mx * 1.5] : [0, mx * 1.08] });
          for (let i = 0; i < n; i++) A.path(c.a.map((r, q) => [q * 5, m === '12' ? Math.max(r[i], 0.0011) : r[i]]), { color: spcol(i), width: 1.5 });
          B.el.style.display = m === '5' ? '' : 'none';
          if (m === '5') {
            B.path(c.a.map((r, q) => [q * 5, Math.log10(Math.max(1e-9, Math.hypot(...Array.from(r).map((x, i) => x - c.b[q][i]))))]), { color: 'red', width: 2.2 });
          }
          const last = c.a[c.a.length - 1], mxl = Math.max(...last);
          info = { alive: Array.from(last).filter((x) => x > 0.01).length, m, n };
        });
        v.readout(() => info && String.raw`${info.n} species on 5 resources: **${info.alive}** have abundance above 0.01 at the end of the run${info.alive > 5 ? ' — more species than resources, with no equilibrium in sight' : ''}.`);
      },
    },
  ],
};
