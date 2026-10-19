// Ecology — Chapter 4: Competition and coexistence
import { rcSpec, rcRun, monoEq, invasionOutcome, zngiCross, drawZngi, lvComp, hwStep, hwMu, monodK, spcol, SPCOL } from './ch04.shared.js';

import { resourceCrossing, resourceInvasions, resourceCone } from './ecol-source-audit-resources.shared.js';

import { barnaclePhysiology, barnacleCompetitor, barnacleSurvival, firstSurvivalThreshold, lvInvasions, lvNullclines } from './ecol-source-audit-historical.shared.js';

import { runPlankton, positiveLogRange } from './ecol-source-audit-plankton.shared.js';

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
      credit: 'Connell (1961), Ecology 42:710–723, original field experiment',
      statement: String.raw`The **fundamental niche** describes conditions permitting population persistence with specified adverse biotic interactions absent; the **realized niche** describes persistence under the actual biotic setting. With only adverse interactions added and other conditions fixed, the realized range can shrink. This subset statement need not hold when facilitation, mutualism or indirect effects are included. On a rocky shore, adults of the small barnacle *Chthamalus stellatus* live high on the shore, although its larvae settle over a much wider band; in Connell’s experiments, the larvae that settled lower down survived and grew when the larger barnacle *Balanus balanoides* was removed, but were crowded off and undercut by it when it was present.`,
      scope: String.raw`Connell’s original paper uses the names Chthamalus stellatus and Balanus balanoides; they are retained here without a retrospective taxonomic reassignment. This is one shore-height comparison, not the entire multidimensional niche. He followed mapped settled individuals, removed neighbors touching or surrounding them, transplanted stones and excluded predators with cages. Better survival after competitor removal does not by itself measure every condition for long-term reproduction or recruitment. The smooth curves and 10% threshold below are atlas choices, not Connell’s observations.`,
      idea: String.raw`Connell’s paired controls and removal treatment tested whether contact with Balanus caused mortality, rather than simply correlating species with shore height. The removal increased survival of Chthamalus lower on the shore; censuses recorded smothering, undercutting and crushing. Heat/desiccation tolerance helped explain the contrasting upper limits, while low-shore settlement also mattered. Predation on Balanus could reduce its competition with Chthamalus, an indirect benefit which the one-competitor survival curve does not model.`,
      caption: String.raw`The horizontal axis is height on the shore. Dashed blue is a chosen physiology-only survival curve; solid blue includes direct crowding by *Balanus* (orange). These survival curves illustrate competitive release, rather than measure the full fundamental and realized niches. Switch on **remove *Balanus*** and the blue area expands downward to the dashed curve. Raise the competition strength, or lower the orange species’ upper limit, to see how the realized niche responds.`,
      deps: ['ecol-1.1'],
      refs: ['Connell (1961), Ecology 42:710–723, Methods pp.711–713; Results pp.714–720; Discussion/Figure 5/Summary pp.720–722'],
      tags: ['niche', 'competition', 'field experiment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Niche_differentiation', doi: 'https://doi.org/10.2307/1933500' },
      verify: false,
      viz(v) {
        const kS = v.slider('competition strength (crowding and undercutting)', 0, 6, 4, { step: 0.1 });
        const hS = v.slider('upper limit of the dominant barnacle (desiccation)', 4, 8, 6, { step: 0.1 });
        const rem = v.toggle('remove Balanus', false);
        const A = v.stage({ x: [0, 10], y: [0, 1.18], axes: 'box', gutter: true, height: 340, xlabel: 'height on the shore (low tide → high tide)', ylabel: 'relative survival to adult', title: 'barnacles along an intertidal gradient (schematic model)', xticks: [[0.5, 'low'], [5, 'mid'], [9.5, 'high']] });
        const phC = barnaclePhysiology;
        let info = null;
        v.render(() => {
          const hb = hS.value, k = kS.value, off = rem.value;
          const B = (h) => barnacleCompetitor(h,hb,off);
          const real = (h) => barnacleSurvival(h,k,hb,off);
          A.fn(B, { color: 'orange', width: 2.4, fill: true, fillAlpha: 0.2, domain: [0, 10] });
          A.fn(real, { color: 'accent', width: 2.8, fill: true, fillAlpha: 0.3, domain: [0, 10] });
          A.fn(phC, { color: 'accent', width: 2, dash: [6, 4], domain: [0, 10] });
          const low = firstSurvivalThreshold;
          const lr = low(real), lf = low(phC);
          if (lr!=null) A.vline(lr, { color: 'green', width: 1.2, dash: true });
          A.text('Balanus', Math.max(0.3, hb - 3), 0.5, { color: 'orange', size: 13 });
          A.text('Chthamalus', 8.4, 1.1, { color: 'accent', size: 13 });
          info = { lr, lf };
        });
        v.legend([['accent', 'Chthamalus with direct competitor'], ['accent', 'physiology-only survival (schematic)', { dash: true }], ['orange', 'Balanus']]);
        v.readout(() => info && (info.lr!=null ? String.raw`Lowest height where *Chthamalus* reaches 10 % survival: with the competitor **${v.fix(info.lr, 1)}**, physiology-only **${v.fix(info.lf, 1)}** (axis units). The model’s lower-threshold displacement is **${v.fix(Math.max(0, info.lr - info.lf), 1)}** units of shore height.` : 'No height reaches the model’s 10% survival threshold; this is not an extinction inference.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Gause’s Paramecium experiments',
      credit: 'Gause, The Struggle for Existence (1934), Chapter V',
      statement: String.raw`In his 1934 book, Gause described controlled mixed cultures of Paramecium aurelia and P. caudatum supplied with bacterial food. In the standardized bacterial-food comparisons of Figures 22,24 and25, aurelia displaced caudatum. The account combines monoculture growth measurements, mixed-culture observations and food-consumption reasoning; it is not a prediction from monocultures alone. Gause explicitly noted changing interaction coefficients, an early growth benefit to caudatum in some mixtures, and the role of daily population removal. The constant-coefficient Lotka–Volterra model below is a simpler conceptual illustration of exclusion versus coexistence.`,
      scope: String.raw`Primary evidence: the complete 1934 book, Chapter V, especially pp.96–110 and Figures 21–25. Cultures contained 5 mL; a 0.5 mL daily sample was counted and discarded, and medium/food was renewed. Gause distinguished cell counts from volume/biomass, discussed variable coefficients, and showed that relative advantages depend on the culture conditions. Here all growth rates, carrying capacities and competition coefficients are chosen examples, not fits or digitized experimental counts. The alternate pair is a hypothetical coexistence contrast; no unverified caudatum–bursaria experiment or its date is claimed. Times and abundances on the diagrams are model units.`,
      idea: String.raw`The chosen model has dNᵢ/dt=rᵢNᵢ[1−(Nᵢ+αᵢⱼNⱼ)/Kᵢ]. Each isolated population is logistic; in a mixture, each rival adds an imposed competitive load. Invasion rates at the two monoculture equilibria classify generic coexistence, exclusion or priority effects. A zero invasion rate is a boundary case requiring further analysis. These exact statements concern this constant-coefficient model, whose simple monotone adverse interactions do not reproduce all of Gause’s reported mechanisms.`,
      caption: String.raw`Choose the pair. Left: monocultures follow logistic curves. Middle: the same species mixed, with the model's competition coefficients (sliders). Right: the phase plane with the two isoclines, the trajectory and the final state. The historical-name pair illustrates aurelia winning with the default chosen coefficients; the alternate pair is hypothetical. Lower both coefficients for coexistence, or raise both far enough for priority effects. The green endpoint is the 400-unit numerical trajectory, not proof that an exact equilibrium or extinction was reached.`,
      deps: ['mathbio-3.17'],
      refs: ['Gause, The Struggle for Existence (1934), Chapter V, pp.96–110, Figures 21–25, Appendix Table 3 pp.144–145'],
      tags: ['competitive exclusion', 'experiment', 'Lotka–Volterra'],
      links: { original: 'https://archive.org/details/struggleforexist00gauz', wikipedia: 'https://en.wikipedia.org/wiki/Competitive_exclusion_principle' },
      verify: false,
      viz(v) {
        const PAIRS = {
          ac: { n1: 'P. caudatum', n2: 'P. aurelia', r1: 0.6, r2: 0.8, K1: 60, K2: 200, a12: 0.5, a21: 0.9 },
          cb: { n1: 'hypothetical species A', n2: 'hypothetical species B', r1: 0.6, r2: 0.4, K1: 60, K2: 100, a12: 0.3, a21: 0.5 },
        };
        const pair = v.select('pair of species', [{ value: 'ac', label: 'caudatum + aurelia' }, { value: 'cb', label: 'hypothetical coexistence contrast' }], 'ac', { onChange: () => { s12.set(PAIRS[pair.value].a12); s21.set(PAIRS[pair.value].a21); } });
        const s12 = v.slider('effect of species 2 on species 1 $\\alpha_{12}$', 0, 4, 0.5, { step: 0.05 });
        const s21 = v.slider('effect of species 1 on species 2 $\\alpha_{21}$', 0, 4, 0.9, { step: 0.05 });
        const T = 25;
        const A = v.stage({ x: [0, T], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'model time', ylabel: 'model abundance', title: 'monocultures', weight: 1 });
        const B = v.stage({ x: [0, T], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'model time', ylabel: 'model abundance', title: 'mixed culture', weight: 1 });
        const C = v.stage({ x: [0, 90], y: [0, 230], axes: 'box', gutter: true, height: 300, xlabel: 'species 1', ylabel: 'species 2', title: 'phase plane', weight: 1 });
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
          const lines=lvNullclines(P);C.path(lines[0], { color:'accent',width:1.8,dash:true });C.path(lines[1],{color:'orange',width:1.8,dash:true});
          for (const [x0, y0] of [[2, 2], [50, 5], [5, 150], [60, 120], [85, 20]]) {
            const q = lvComp(P, x0, y0, 60, 240);
            C.path(q.t.map((t, i) => [q.x[i], q.y[i]]), { color: 'muted', width: 1, alpha: 0.5 });
          }
          C.path(run.t.map((t, i) => [run.x[i], run.y[i]]), { color: 'gold', width: 2.6 });
          const end = lvComp(P, 2, 2, 400, 800), xe = end.x[end.x.length - 1], ye = end.y[end.y.length - 1];
          C.dot(xe, ye, { r: 6, color: 'green' });
          const rates=lvInvasions(P), inv1=rates.g1>1e-10,inv2=rates.g2>1e-10;
          info = { xe, ye, inv1, inv2, rates, P, m1: m1.x[m1.x.length - 1], m2: m1.y[m1.y.length - 1] };
        });
        v.legend([['accent', 'species 1 (names in readout)'], ['orange', 'species 2 (names in readout)'], ['gold', 'trajectory from 2+2 model units'], ['green', 'final state', { dot: true }]]);
        v.readout(() => info && String.raw`Species1 = *${info.P.n1}*, species 2 = *${info.P.n2}*. Invasion growth rates at the other's carrying capacity: $g_1=${v.fix(info.rates.g1,4)}$, $g_2=${v.fix(info.rates.g2,4)}$ per model-time unit → **${({boundary:'zero invasion-rate boundary: linear test inconclusive',coexist:'stable model coexistence',priority:'priority effect: initial conditions matter',one:'species 1 excludes species 2',two:'species 2 excludes species 1'})[info.rates.outcome]}**. After 400 model-time units the selected trajectory gives $N_1=${v.fix(info.xe,1)}$, $N_2=${v.fix(info.ye,1)}$; this finite run is not an extinction observation.`);
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
      credit: 'Tilman graphical framework; explicit chemostat specialization derived here; compare Kooi, Dutta & Feudel (2013)',
      statement: String.raw`In the displayed two-species/two-essential-resource chemostat, the crossed ZNGIs meet at R*=(5,5), where A is limited by resource 1 and B by resource 2. A positive crossing equilibrium exists only when the supply displacement S−R* is a strictly positive combination of the consumption directions cA and cB. For distinct directions it is unique. It is locally asymptotically stable if A consumes relatively more of its own limiting resource 1 than B (angle A<angle B); reversing this order gives a saddle. Equal directions are degenerate: an aligned supply can support a continuum of positive equilibria, while an unaligned supply cannot support positive coexistence at the crossing.`,
      scope: String.raw`A well-mixed chemostat with constant supply, constant positive per-biomass resource coefficients, Liebig minimum of Monod growth terms, common maximum growth 1 and mortality=turnover=0.25 in chosen units; both species start positive. These hypotheses are essential to the explicit mass-balance reduction used here. At the crossing each species has a unique limiting resource, so derivatives there are smooth. Strict local stability does not assert convergence from every initial state or that a finite 400-unit run has equilibrated. The primary 2013 author analysis independently discusses the same graphical outcomes and the nonunique equal-consumption case; parameters and derivation here are atlas choices.`,
      idea: String.raw`At equilibrium growth equals mortality, so resource balance and equal turnover/mortality give S−R*=cA NA+cB NB. The quantities Mj=Rj+cAj NA+cBj NB obey Mj′=0.25(Sj−Mj), yielding two decaying directions. On the limiting plane M=S the remaining Jacobian is −diag(NA qA,NB qB)C, where C has consumption vectors as columns and qA=qB=0.0375 are the positive limiting-resource growth slopes at5. Its trace is negative and its determinant has the sign of det(C)=sin(angle B−angle A): positive gives two negative eigenvalues, negative a saddle, zero a neutral composition direction. With reversed vectors, an A increase depletes the resource limiting B and harms B, reinforcing A’s advantage rather than helping B.`,
      caption: String.raw`Left: fixed ZNGIs, consumption arrows and the full positive-combination cone clipped to the plotting window. Green denotes the stable orientation; red the saddle orientation. Drag the supply point or turn the vectors. Right: fractions of A from three positive starting mixtures through 400 chosen units; the dashed line marks the crossing-equilibrium fraction when positive and unique. At equal consumption directions, an aligned supply gives a neutral continuum with no unique reference fraction. Finite endpoints illustrate dynamics and do not prove convergence.`,
      deps: ['ecol-4.3'],
      refs: ['Kooi, Dutta & Feudel (2013), Math.Model.Nat.Phenom.8(6):165–185: eq2.1 p167; eq3.7–3.11 pp171–173; eq3.21–3.22/nonunique case p177; slope stability p178. Displayed equal-mortality mass reduction derived here.'],
      tags: ['coexistence', 'stability', 'Tilman'],
      verify: false,
      viz(v) {
        const tA = v.slider('angle of A (° from resource 1 axis)', 5, 85, 30, { step: 1 });
        const tB = v.slider('angle of B (°)', 5, 85, 60, { step: 1 });
        const A = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: 'box', gutter: true, height: 340, xlabel: 'resource 1', ylabel: 'resource 2', title: 'resource space', weight: 1 });
        const B = v.stage({ x: [0, 400], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: 'fraction of A', title: 'three starting mixes', weight: 1 });
        const hs = A.handle(9, 9, { color: 'gold', r: 8, label: 'S', constrain: { x: [5.2, 9.8], y: [5.2, 9.8] } });
        v.button('equal-consumption reference',()=>{tA.set(45);tB.set(45);hs.set(9,9);});
        let key = '', runs = [], info = null;
        const mixes = [[2, 0.2], [0.8, 0.8], [0.2, 2]];
        v.render(() => {
          const sa = rcSpec([5, 2], tA.value), sb = rcSpec([2, 5], tB.value), S = [hs.x, hs.y];
          const k = [tA.value, tB.value, hs.x.toFixed(3), hs.y.toFixed(3)].join('|');
          if (k !== key) { key = k; runs = mixes.map((m) => rcRun(sa, sb, S, m, 400, 0.1, 10)); }
          const X = [5, 5];
          const eq=resourceCrossing(sa,sb,S),cone=resourceCone(sa,sb);if(cone.length)A.poly(cone,{fill:eq.det>0?'green':'red',fillAlpha:.16,stroke:false});else{const q=Math.min(5/sa.c[0],5/sa.c[1]);A.line(5,5,5+q*sa.c[0],5+q*sa.c[1],{color:'muted',width:1.5,dash:[4,3]});}
          A.arrow(X[0], X[1], X[0] + 2.2 * sa.c[0], X[1] + 2.2 * sa.c[1], { color: 'accent', width: 2.4 });
          A.arrow(X[0], X[1], X[0] + 2.2 * sb.c[0], X[1] + 2.2 * sb.c[1], { color: 'orange', width: 2.4 });
          drawZngi(A, sa.z, { color: 'accent', width: 2.8 });
          drawZngi(A, sb.z, { color: 'orange', width: 2.8 });
          A.dot(X[0], X[1], { r: 5, color: 'ink' });
          A.text('positive cone', 5.4, 3.4, { color: eq.det>0?'green':eq.det<0?'red':'muted', size: 12, align: 'left' });
          const inv=resourceInvasions(sa,sb,S);
          B.hline(0.5, { color: 'grid' });
          const cols = ['accent', 'gold', 'orange'];
          let fr = [];
          runs.forEach((r, q) => {
            B.path(r.t.map((t, i) => [t, r.NA[i] / Math.max(1e-9, r.NA[i] + r.NB[i])]), { color: cols[q], width: 2.2 });
            const n = r.t.length - 1; fr.push(r.NA[n] / Math.max(1e-9, r.NA[n] + r.NB[n]));
          });
          if(eq.N&&eq.N.every(x=>x>0))B.hline(eq.N[0]/(eq.N[0]+eq.N[1]),{color:'green',width:1.5,dash:[4,3]});
          info={inv,fr,eq,angle:tB.value-tA.value};
        });
        v.legend([['accent', 'start: mostly A'], ['gold', 'start: even'], ['orange', 'start: mostly B'],['green','unique positive equilibrium',{dash:true}]]);
        v.readout(() => info && `Consumption orientation: **${info.angle>0?'locally stable':info.angle<0?'saddle':'equal directions: degenerate'}** if a positive crossing equilibrium exists. Supply test: **${info.eq.kind}**. Invasion test: **${info.inv.outcome}**. Finite t=400 fractions of A: ${info.fr.map(x=>v.fix(x,3)).join(', ')}. ${info.eq.N&&info.eq.N.every(x=>x>0)?`Crossing-equilibrium fraction ${v.fix(info.eq.N[0]/(info.eq.N[0]+info.eq.N[1]),3)}.`:'No unique positive crossing-equilibrium fraction.'}`);
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
      statement: String.raw`In a chemostat model of species competing for essential resources, species can generate sustained oscillations and chaos. Huisman and Weissing showed that five species competing for five resources can fluctuate chaotically without any species being lost, and that with twelve species on five resources all twelve can persist: more species coexist than there are resources, because species and resource concentrations do not settle to equilibrium (the external supply concentrations are constant) and the identity of the limiting resource keeps changing.`,
      scope: String.raw`The original 1999 paper was read in full, including equations 1–3 and the matrices/introductions on p.410. Matrices are transposed to species-first storage here. Initial species have Nᵢ=0.1+i/100; later introductions all have Nᵢ=0.1, as stated in the paper. The authors report persistence beyond 250,000 days in simulations, not a permanence theorem; this display runs only 1,000 or 10,000 days with fixed-step RK4. Sensitive dependence is numerical evidence, not a proof of a positive asymptotic Lyapunov exponent. Source parameters are dimensioned per day; exact chaotic paths depend on numerical method and step.`,
      idea: String.raw`Each species is limited by whichever resource is scarcest for it, and each draws that resource down, so the limiting resource flips back and forth as species rise and fall. When consumption is arranged so that each species has most impact on the resource for which it is an intermediate competitor, the cycle of limiting resources becomes irregular. For the reported parameter combinations, simulated non-equilibrium dynamics permit more species than the equilibrium resource-count bound. It is not true that transient dynamics can never lead to exclusion; different parameters in the same original paper do produce exclusion. The equilibrium-only argument of 4.5 does not prove a bound for these fluctuating numerical examples.`,
      caption: String.raw`Left: model abundances in the essential-resource chemostat; time is in days. Right: two copies of the system started with a difference of $10^{-6}$ in one abundance; the finite trajectory difference can grow by many orders of magnitude, consistent with the paper’s chaotic regime but not by itself a proof of chaos. Switch to **12 species** to see Huisman–Weissing's staged introduction of the extra species (at times 1000, 3000 and 5000), with their exact 0.1 introduction abundances, followed until 10,000 days. Zero abundance before introduction is omitted from the logarithmic plot; values are never lifted to a positive plotting floor. The final count uses an explicit finite threshold; the 12-species run takes a moment to compute.`,
      deps: ['ecol-4.5', 'ecol-4.4'],
      refs: ['Huisman & Weissing (1999), Nature 402:407–410, equations 1–3, Figures 2–4, Methods p.410'],
      tags: ['chaos', 'plankton', 'coexistence'],
      links: { doi: 'https://doi.org/10.1038/46540' },
      verify: false,
      viz(v) {
        const mode = v.select('community', [{ value: '5', label: '5 species' }, { value: '12', label: '12 species' }], '5');
        const A = v.stage({ x: [0, 1000], y: [0, 60], axes: 'box', gutter: true, height: 330, xlabel: 'time (days)', ylabel: 'abundance', title: 'species abundances', weight: 1.4 });
        const B = v.stage({ x: [0, 1000], y: [-8, 2], axes: 'box', gutter: true, height: 330, xlabel: 'time (days)', ylabel: '$\\log_{10}$ |difference|', title: 'sensitive dependence (5 species)', weight: 1 });
        const cache = {};
        let info = null;
        v.render(() => {
          const m = mode.value;
          if (!cache[m]) {
            if (m === '5') {
              const a=runPlankton(5,1000),b=runPlankton(5,1000,{perturb:1e-6});cache[m]={a:a.N,b:b.N,t:a.t,T:1000};
            } else {
              const a=runPlankton(12,10000);cache[m]={a:a.N,t:a.t,T:10000};
            }
          }
          const c = cache[m], n = c.a[0].length;
          const mx = Math.max(...c.a.map((r) => Math.max(...r)));
          const yr=m==='12'?positiveLogRange(c.a):[0,mx*1.08];A.setView([0,c.T],yr);A.setScale({ylog:m==='12',y:yr});
          for(let i=0;i<n;i++)A.path(c.a.map((r,q)=>m==='12'&&r[i]<=0?null:[c.t[q],r[i]]),{color:spcol(i),width:1.5,dash:i>=8?[4,3]:undefined});
          v.legend(Array.from({length:n},(_,i)=>[spcol(i),'species '+(i+1),{dash:i>=8}]));
          B.el.style.display = m === '5' ? '' : 'none';
          if (m === '5') {
            const diff=c.a.map((r,q)=>{const d=Math.hypot(...r.map((x,i)=>x-c.b[q][i]));return d>0?[c.t[q],Math.log10(d)]:null;}),ys=diff.filter(Boolean).map(p=>p[1]);B.setView([0,c.T],[Math.min(...ys)-.3,Math.max(...ys)+.3]);B.path(diff,{color:'red',width:2.2});
          }
          const last = c.a[c.a.length - 1];
          info = { alive: Array.from(last).filter((x) => x > 0.01).length, m, n };
        });
        v.readout(() => info && String.raw`${info.n} species on 5 resources: **${info.alive}** have abundance above 0.01 at the end of the run${info.alive > 5 ? ' — more species than resources above this finite threshold' : ''}. This finite-time numerical count is not a permanence or chaos proof.`);
      },
    },
  ],
};
