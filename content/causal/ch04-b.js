// Causal Inference — Chapter 4: Interventions and identification (items 4.8–4.13; 4.1–4.7 in ch04.js)
//
// Notes (Oct 2026): all models are simulated; the smoking–tar–cancer parameters are invented here (a reconstruction of the structure of the
// example in Pearl 1995, NOT the paper's numbers). Attributions checked: Pearl, Biometrika 82(4):669–688 (1995); Shpitser & Pearl, AAAI 2006,
// pp. 1219–1226; Huang & Valtorta, UAI 2006 (Pearl’s calculus of intervention is complete; arXiv 1206.6831); Richardson & Robins, CSSS Working
// Paper 128, University of Washington (April 2013); Lord, Psychological Bulletin 68(5):304–305 (1967), DOI 10.1037/h0025105.
import {
  clamp, logistic, fx, mean, rng, memo, histPanel,
  parentsOf, hasCycle, topoOrder, descendants, ancestors, dSep, allPaths, pathReport,
  semCov, coefMatrix, sampleSEM, sampleCov, pcorrCov, makeDag, edgesOf, solveSmall, ols,
  binModel, jointP, probOf, condProb, sampleTable, popReg, sampleReg, setTex,
} from './ch04.shared.js';

/** Front-door estimate of P(Y=1 | do(X=x)) from a table P over nodes (x, m, y) given by indices; U is never touched. */
function frontDoor(P, n, ix, im, iy, x) {
  let tot = 0;
  for (const m of [0, 1]) {
    const pm = condProb(P, n, im, { [ix]: x }); const pmx = m ? pm : 1 - pm;
    let inner = 0;
    for (const xp of [0, 1]) { const px = probOf(P, n, { [ix]: xp }); const py = condProb(P, n, iy, { [ix]: xp, [im]: m }); inner += (Number.isNaN(py) ? 0 : py) * px; }
    tot += (Number.isNaN(pmx) ? 0 : pmx) * inner;
  }
  return tot;
}

export default {
  collection: 'causal',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Theorem', name: 'Front-door criterion',
      statement: String.raw`A set $M$ satisfies the **front-door criterion** relative to $(X,Y)$ if (i) $M$ intercepts every directed path from $X$ to $Y$, (ii) there is no unblocked back-door path from $X$ to $M$, and (iii) every back-door path from $M$ to $Y$ is blocked by $X$. If it does, and $P(x,m)>0$, the effect is identifiable **even when $X$ and $Y$ share an unmeasured cause**:
$$P(y\mid \mathrm{do}(x))=\sum_{m}P(m\mid x)\sum_{x'}P(y\mid x',m)\,P(x').$$`,
      idea: String.raw`Split the effect into two links that can each be identified. $X\to M$ has no back-door path, so $P(m\mid \mathrm{do}(x))=P(m\mid x)$. For $M\to Y$ the only back-door path runs through $X$, which can be adjusted for by the back-door formula (4.3): $P(y\mid \mathrm{do}(m))=\sum_{x'}P(y\mid x',m)P(x')$. Chaining the two links gives the formula, although the confounder of $X$ and $Y$ is never measured. The derivation is a three-line application of the do-calculus (4.9).`,
      caption: String.raw`Pearl’s smoking–tar–cancer structure with an unmeasured genotype $U$. The three bars are the true effect of $X$ on $Y$ (risk difference under $\mathrm{do}$), the naïve observational contrast (red) and the front-door estimate computed from the observed $(X,M,Y)$ table only (blue: exact; dots: 40 studies of $n$ units). Add a direct arrow $X\to Y$ with the slider and condition (i) fails: the formula misses, however large $n$.`,
      deps: ['causal-4.2'], refs: ['Pearl §3.3'], tags: ['front-door', 'identification'],
      credit: 'Pearl, 1995 (Biometrika 82)',
      scope: String.raw`Binary model with invented parameters (not the data of any real study); the genotype $U$ is hidden from the estimator. Needs $0<P(x)<1$ and all strata present; with a direct $X\to Y$ arrow or a confounder of $X$ and $M$ the criterion is violated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Causal_graph' },
      viz(v) {
        const names = ['genotype U', 'smoking X', 'tar M', 'cancer Y'], pos = [[5, 5.1], [1.5, 1.3], [5, 1.3], [8.5, 1.3]];
        const cS = v.slider(String.raw`$U\to X$`, 0, 3, 1.8, { step: 0.05 }), dS = v.slider(String.raw`$U\to Y$`, 0, 3, 1.8, { step: 0.05 });
        const eS = v.slider(String.raw`$M\to Y$`, 0, 3, 1.6, { step: 0.05 }), wS = v.slider(String.raw`direct $X\to Y$`, -2, 2, 0, { step: 0.05 });
        const nS = v.slider('sample size $n$', 200, 50000, 3000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('resample', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 300, title: 'the structure', minWidth: 270 });
        const sb = v.stage({ x: [0, 4.4], y: [-0.2, 0.8], axes: 'box', gutter: true, height: 300, ylabel: 'risk difference of cancer', title: 'effect of smoking: truth and estimates', minWidth: 320 });
        sb.setTicks([[0.9, 'truth'], [1.9, 'naïve'], [2.9, 'front-door']], null);
        const E0 = [[0, 1], [0, 3], [1, 2], [2, 3]];
        const G = makeDag(v, sgr, { names, pos, edges: E0, draggable: false, r: 19, fontSize: 12.5 });
        v.legend([['green', 'true effect', { area: true }], ['red', 'naïve contrast', { area: true }], ['accent', 'front-door formula', { area: true }], ['ink', 'simulated studies', { dot: true }]]);
        const key = memo(); let info = {};
        v.render(() => {
          const w = wS.value, E = w !== 0 ? [...E0, [1, 3]] : E0;
          const m = binModel(4, E, { seed: 2, W: { '0>1': cS.value, '0>3': dS.value, '1>2': 2.2, '2>3': eS.value, '1>3': w }, B: { 0: 0, 1: 0, 2: 0, 3: -0.2 } });
          const P = jointP(m), truth = probOf(jointP(m, { 1: 1 }), 4, { 3: 1 }) - probOf(jointP(m, { 1: 0 }), 4, { 3: 1 });
          const naive = condProb(P, 4, 3, { 1: 1 }) - condProb(P, 4, 3, { 1: 0 });
          const fd = frontDoor(P, 4, 1, 2, 3, 1) - frontDoor(P, 4, 1, 2, 3, 0);
          const est = key(`${cS.value}|${dS.value}|${eS.value}|${w}|${nS.value}|${seed}`, () => Array.from({ length: 40 }, (_, k) => { const Q = sampleTable(P, nS.value, seed * 100 + k); return { n: condProb(Q, 4, 3, { 1: 1 }) - condProb(Q, 4, 3, { 1: 0 }), f: frontDoor(Q, 4, 1, 2, 3, 1) - frontDoor(Q, 4, 1, 2, 3, 0) }; }));
          const vals = [truth, naive, fd, ...est.map((e) => e.n), ...est.map((e) => e.f)], lo = Math.min(-0.05, ...vals) - 0.05, hi = Math.max(0.3, ...vals) + 0.05;
          sb.setView([0, 4.4], [lo, hi]); sb.hline(0, { color: 'grid', width: 1.2 });
          [[0.9, truth, 'green'], [1.9, naive, 'red'], [2.9, fd, 'accent']].forEach(([x, val, col]) => sb.rect(x - 0.35, 0, x + 0.35, val, { fill: col, fillAlpha: 0.4, color: col }));
          est.forEach((e, k) => { const j = ((k * 37) % 11 - 5) * 0.045; sb.dot(1.9 + j, e.n, { r: 2.6, color: 'ink', alpha: 0.65 }); sb.dot(2.9 + j, e.f, { r: 2.6, color: 'ink', alpha: 0.65 }); });
          G.set({ nodes: names.map((c, i) => ({ id: i, label: c, x: pos[i][0], y: pos[i][1] })), edges: E.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none' });
          G.draw({ nodeColor: (id) => (id === 0 ? 'muted' : id === 1 ? 'orange' : id === 3 ? 'green' : 'accent'), edgeColor: (e) => (e.from === 1 && e.to === 3 ? 'red' : null), edgeWidth: (e) => (e.from === 1 && e.to === 3 ? 3 : null) });
          const me = est.reduce((s, e) => s + e.f, 0) / est.length;
          info = { truth, naive, fd, me, w };
        });
        v.readout(() => `True effect **${fx(info.truth, 3)}**; naïve contrast **${fx(info.naive, 3)}** (bias ${fx(info.naive - info.truth, 3)}); front-door formula on the exact observed table **${fx(info.fd, 3)}** (mean of 40 studies ${fx(info.me, 3)}).\n` +
          `${info.w === 0 ? 'Smoking acts only through tar, so conditions (i)–(iii) hold: the hidden genotype is no obstacle.' : '**Condition (i) fails** — a direct arrow bypasses tar — and the formula now returns the effect through tar only, wrong by ' + fx(info.fd - info.truth, 3) + '.'}`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Theorem', name: 'Rules of the do-calculus',
      statement: String.raw`Let $G$ be a causal graph (hidden variables allowed) and $X,Y,Z,W$ disjoint sets of nodes; $G_{\overline X}$ deletes the arrows into $X$, $G_{\underline Z}$ the arrows out of $Z$. Then, for every distribution compatible with $G$:
(1) *Insertion/deletion of observations:* $P(y\mid \mathrm{do}(x),z,w)=P(y\mid \mathrm{do}(x),w)$ if $(Y\perp\!\!\!\perp Z\mid X,W)$ in $G_{\overline X}$.
(2) *Action/observation exchange:* $P(y\mid \mathrm{do}(x),\mathrm{do}(z),w)=P(y\mid \mathrm{do}(x),z,w)$ if $(Y\perp\!\!\!\perp Z\mid X,W)$ in $G_{\overline X\,\underline Z}$.
(3) *Insertion/deletion of actions:* $P(y\mid \mathrm{do}(x),\mathrm{do}(z),w)=P(y\mid \mathrm{do}(x),w)$ if $(Y\perp\!\!\!\perp Z\mid X,W)$ in $G_{\overline X\,\overline{Z(W)}}$, where $Z(W)$ is the set of nodes of $Z$ that are not ancestors of $W$ in $G_{\overline X}$.`,
      idea: String.raw`Each rule is d-separation (3.5) applied to a graph edited to match the experiment: deleting arrows into $X$ represents setting it (4.1), and deleting arrows out of $Z$ represents ignoring the effects of $Z$, so that observing $Z$ is as good as setting it. Rule 1 is the Markov property of the mutilated model; rule 2 says that when the only association left is causal-free, observation equals action; rule 3 says an action with no path to the outcome can be dropped. Together with the probability calculus they rewrite a $\mathrm{do}$-query step by step.`,
      caption: String.raw`Pick a graph and step through the derivation of $P(y\mid \mathrm{do}(x))$. Each rewriting step names its rule, and the **graph shows the mutilated graph that rule inspects**: red dashed arrows are the deleted ones, blue nodes are conditioned on, orange are the $Z$ of the rule, green the $Y$. The d-separation test is run live on that graph. Switch on the hidden confounder or the extra arrow and watch the step that must fail.`,
      deps: ['causal-4.2', 'causal-3.6'], refs: ['Pearl §3.4'], tags: ['do-calculus', 'identification'],
      credit: 'Pearl, 1995 (Biometrika 82)',
      scope: String.raw`Rules are stated for any causal model with the given graph, hidden variables included (they are drawn but never conditioned on). A derivation is a proof of identifiability only if the final expression has no $\mathrm{do}$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Do-calculus' },
      viz(v) {
        const EX = {
          bd: { label: 'back-door: covariate $Z$', names: ['X', 'Y', 'Z', 'U'], pos: [[1.5, 1.3], [8.5, 1.3], [5, 5], [5, 2.9]], e: [[2, 0], [2, 1], [0, 1]], brk: [[3, 0], [3, 1]], brkLabel: 'add a hidden common cause $U$ of $X$ and $Y$', hid: [3], X: 0, Y: 1 },
          fd: { label: 'front-door: mediator $M$', names: ['X', 'M', 'Y', 'U'], pos: [[1.5, 1.3], [5, 1.3], [8.5, 1.3], [5, 5]], e: [[3, 0], [3, 2], [0, 1], [1, 2]], brk: [[0, 2]], brkLabel: 'add a direct arrow $X\\to Y$', hid: [3], X: 0, Y: 2 },
        };
        const ex = v.select('graph', Object.entries(EX).map(([k, o]) => ({ value: k, label: o.label })), 'fd', { onChange() { S.reset(); } });
        const brk = v.toggle('break it', false, { onChange() { S.reset(); } });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 320, title: 'the graph that the rule inspects', minWidth: 300 });
        const cur = () => EX[ex.value];
        const graphEdges = () => { const o = cur(); return brk.value ? [...o.e, ...o.brk] : o.e; };
        const G = makeDag(v, sgr, { names: EX.fd.names, pos: EX.fd.pos, edges: EX.fd.e, draggable: false, r: 17 });
        const cutIn = (E, S_) => E.filter(([, b]) => !S_.includes(b)), cutOut = (E, S_) => E.filter(([a]) => !S_.includes(a));
        /** Evaluate one rule application; returns {E (edges kept), cut (edges deleted), ok, cond}. */
        const test = (E0, n, sp) => {
          let E = cutIn(E0, sp.do || []);
          if (sp.rule === 2) E = cutOut(E, sp.Z);
          if (sp.rule === 3) { const anc = ancestors(n, E, sp.W || []); const ZW = sp.Z.filter((z) => !anc.has(z)); E = cutIn(E, ZW); }
          const cond = new Set([...(sp.do || []), ...(sp.W || [])]); let ok = true;
          for (const y of sp.Y) for (const z of sp.Z) if (!dSep(n, E, y, z, cond)) ok = false;
          const kept = new Set(E.map((e) => e.join('>'))); return { E, cut: E0.filter((e) => !kept.has(e.join('>'))), ok, cond, sp };
        };
        const build = () => {
          const o = cur(), E0 = graphEdges(), n = 4, F = [];
          const add = (tex, note, sp) => F.push({ tex, note, sp, res: sp ? test(E0, n, sp) : null });
          if (ex.value === 'bd') {
            add(String.raw`P(y\mid \mathrm{do}(x))`, 'The target: an effect with a $\\mathrm{do}$ in it. Goal: write it with ordinary conditional probabilities of the observed variables.', null);
            add(String.raw`=\sum_z P(y\mid \mathrm{do}(x),z)\,P(z\mid \mathrm{do}(x))`, 'Probability calculus: condition on $Z$ and sum it out (no rule needed).', null);
            add(String.raw`P(z\mid \mathrm{do}(x))=P(z)`, 'Rule 3: delete the action $\\mathrm{do}(x)$ from $P(z\\mid\\mathrm{do}(x))$. Needs $(Z\\perp\\!\\!\\!\\perp X)$ after deleting the arrows into $X$.', { rule: 3, Y: [2], Z: [0], do: [], W: [] });
            add(String.raw`P(y\mid \mathrm{do}(x),z)=P(y\mid x,z)`, 'Rule 2: turn the action into an observation. Needs $(Y\\perp\\!\\!\\!\\perp X\\mid Z)$ after deleting the arrows **out of** $X$.', { rule: 2, Y: [1], Z: [0], do: [], W: [2] });
            add(String.raw`P(y\mid \mathrm{do}(x))=\sum_z P(y\mid x,z)\,P(z)`, 'No $\\mathrm{do}$ is left: identified, and this is the back-door formula (4.3).', null);
          } else {
            add(String.raw`P(y\mid \mathrm{do}(x))`, 'The target. The hidden $U$ confounds $X$ and $Y$, so no covariate can be adjusted for.', null);
            add(String.raw`=\sum_m P(m\mid \mathrm{do}(x))\,P(y\mid \mathrm{do}(x),m)`, 'Probability calculus: condition on the mediator $M$ and sum it out.', null);
            add(String.raw`P(m\mid \mathrm{do}(x))=P(m\mid x)`, 'Rule 2: $X\\to M$ has no back-door path. Needs $(M\\perp\\!\\!\\!\\perp X)$ with the arrows out of $X$ deleted.', { rule: 2, Y: [1], Z: [0], do: [], W: [] });
            add(String.raw`P(y\mid \mathrm{do}(x),m)=P(y\mid \mathrm{do}(x),\mathrm{do}(m))`, 'Rule 2 again: $M$ may be set instead of observed once $X$ is held. Needs $(Y\\perp\\!\\!\\!\\perp M\\mid X)$ with the arrows into $X$ and out of $M$ deleted.', { rule: 2, Y: [2], Z: [1], do: [0], W: [] });
            add(String.raw`P(y\mid \mathrm{do}(x),\mathrm{do}(m))=P(y\mid \mathrm{do}(m))`, 'Rule 3: drop the action on $X$; it can only reach $Y$ through $M$, which is now set. Needs $(Y\\perp\\!\\!\\!\\perp X)$ after deleting the arrows into $M$ and into $X$.', { rule: 3, Y: [2], Z: [0], do: [1], W: [] });
            add(String.raw`P(y\mid \mathrm{do}(m))=\sum_{x'}P(y\mid \mathrm{do}(m),x')\,P(x'\mid \mathrm{do}(m))`, 'Probability calculus: now condition on $X$ (the back-door route for $M\\to Y$).', null);
            add(String.raw`P(x'\mid \mathrm{do}(m))=P(x')`, 'Rule 3: setting $M$ cannot move its ancestor $X$. Needs $(X\\perp\\!\\!\\!\\perp M)$ after deleting the arrows into $M$.', { rule: 3, Y: [0], Z: [1], do: [], W: [] });
            add(String.raw`P(y\mid \mathrm{do}(m),x')=P(y\mid m,x')`, 'Rule 2: observe instead of set. Needs $(Y\\perp\\!\\!\\!\\perp M\\mid X)$ with the arrows out of $M$ deleted.', { rule: 2, Y: [2], Z: [1], do: [], W: [0] });
            add(String.raw`P(y\mid \mathrm{do}(x))=\sum_m P(m\mid x)\sum_{x'}P(y\mid m,x')\,P(x')`, 'No $\\mathrm{do}$ left: the front-door formula (4.8), derived from the three rules.', null);
          }
          return F;
        };
        const S = v.steps({ frames: build, note: (f) => f.note + (f.res ? (f.res.ok ? ' **Condition met: d-separated.**' : ' **Condition fails: not d-separated, this rewriting is not licensed.**') : ''), start: 0, still: 4 });
        v.render(() => {
          const o = cur(), f = S.frame, E0 = graphEdges();
          G.set({ nodes: o.names.map((c, i) => ({ id: i, label: c, x: o.pos[i][0], y: o.pos[i][1] })), edges: E0.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none' });
          const r = f.res, cutK = r ? new Set(r.cut.map((e) => e.join('>'))) : new Set(), sp = r ? r.sp : null;
          G.draw({
            nodeColor: (id) => (sp && sp.Y.includes(id) ? 'green' : sp && sp.Z.includes(id) ? 'orange' : o.hid.includes(id) ? 'muted' : null),
            nodeFill: (id) => (r && r.cond.has(id) ? 'accent' : null),
            edgeColor: (e) => (cutK.has(e.from + '>' + e.to) ? 'red' : null), edgeDash: (e) => (cutK.has(e.from + '>' + e.to) ? true : null),
            edgeWidth: (e) => (cutK.has(e.from + '>' + e.to) ? 2.4 : null),
          });
          sgr.corner(r ? `rule ${r.sp.rule}:  ${r.ok ? '✓ d-separated' : '✗ d-connected'}` : 'probability calculus', 'tl', { color: r ? (r.ok ? 'green' : 'red') : 'muted', weight: 700 });
        });
        v.readout(() => { const fr = S.frames.slice(0, S.i + 1); return fr.map((f) => '$$' + f.tex + (f.res ? (f.res.ok ? '\\quad\\checkmark' : '\\quad\\text{✗ not licensed}') : '') + '$$').join('\n'); });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Theorem', name: 'Completeness of do-calculus; non-identifiable effects',
      statement: String.raw`The three rules of the do-calculus are **complete** for identifiability of causal effects: if $P(y\mid \mathrm{do}(x))$ can be computed from the observational distribution of a causal graph with hidden variables, then some finite sequence of the rules derives it; if no such derivation exists, the effect is *not identifiable* — there exist two models with the graph that agree on every observable distribution and disagree on $P(y\mid \mathrm{do}(x))$. The simplest non-identifiable graph is the **bow**: $X\to Y$ together with an unmeasured common cause of $X$ and $Y$.`,
      idea: String.raw`Completeness was proved by two groups (Shpitser–Pearl 2006, who gave an algorithm that finds an expression or a *hedge* that rules it out, and Huang–Valtorta 2006), settling Pearl’s 1995 conjecture. For the bow the failure can be seen directly: an observed association between $X$ and $Y$ can be produced by a causal effect, by hidden confounding alone, or by any mixture, and the observational table cannot tell them apart while the interventional answers differ.`,
      caption: String.raw`Fix an observed table with the three sliders ($P(X{=}1)$ and the two outcome rates). The model has $X$ a copy of the hidden $U$; with probability $1-\lambda$ a unit’s $Y$ responds to $X$, with probability $\lambda$ it responds to $U$. Every $\lambda$ gives the **same** observational table (left, two models overlaid) but a different interventional answer (right): at $\lambda=0$ the whole association is causal, at $\lambda=1$ none of it is.`,
      deps: ['causal-4.9'], refs: ['Pearl §3.5'], tags: ['identifiability', 'bow graph'],
      credit: 'Shpitser & Pearl, 2006 (AAAI); Huang & Valtorta, 2006 (UAI); conjectured by Pearl, 1995',
      verify: true,
      scope: String.raw`Completeness is for do-calculus identification of (conditional) interventional distributions in nonparametric semi-Markovian models; extra assumptions (linearity, an instrument, monotonicity) can identify effects the graph alone cannot. The two-line model here is one family of observationally equivalent models for the bow, not all of them.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Do-calculus' },
      viz(v) {
        const pS = v.slider('$P(X=1)$', 0.1, 0.9, 0.4, { step: 0.01 });
        const q0S = v.slider('$P(Y=1\\mid X=0)$', 0.05, 0.95, 0.25, { step: 0.01 }), q1S = v.slider('$P(Y=1\\mid X=1)$', 0.05, 0.95, 0.65, { step: 0.01 });
        const l1S = v.slider('model 1: $\\lambda_1$ (confounded share)', 0, 1, 0, { step: 0.01 }), l2S = v.slider('model 2: $\\lambda_2$', 0, 1, 1, { step: 0.01 });
        let seed = 1; v.button('resample 3,000 units', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 5.6], equal: true, axes: false, height: 250, title: 'the bow graph', minWidth: 230 });
        const so = v.stage({ x: [0, 5], y: [0, 0.8], axes: 'box', gutter: true, height: 250, ylabel: '$P(x,y)$', title: 'observational table: identical', minWidth: 280 });
        so.setTicks([[0.9, 'x0,y0'], [1.9, 'x0,y1'], [2.9, 'x1,y0'], [3.9, 'x1,y1']], null);
        const si = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 250, ylabel: '$P(Y=1)$', title: 'interventional answers: different', minWidth: 280 });
        si.setTicks([[0.6, 'do(X=0)'], [1.5, 'do(X=1)'], [2.7, 'seen 0'], [3.5, 'seen 1']], null);
        const G = makeDag(v, sgr, { names: ['X', 'Y', 'U'], pos: [[1.5, 1.2], [8.5, 1.2], [5, 4.6]], edges: [[0, 1], [2, 0], [2, 1]], draggable: false, r: 18 });
        v.legend([['accent', 'model 1', { area: true }], ['orange', 'model 2', { area: true }], ['ink', 'simulated units (model 1)', { dot: true }], ['gold', 'simulated units (model 2)', { dot: true }]]);
        /** Exact joint P(x,y) and P(Y=1 | do(x)) of the model with confounded share lam, by enumerating U and the response type. */
        const model = (p, q, lam) => {
          const J = [[0, 0], [0, 0]], D = [0, 0];
          for (const u of [0, 1]) for (const t of [0, 1]) {
            const pu = u ? p : 1 - p, pt = t ? lam : 1 - lam, x = u;                                    // X := U
            const py = t ? q[u] : q[x];                                                              // type 1 reads U, type 0 reads X
            J[x][1] += pu * pt * py; J[x][0] += pu * pt * (1 - py);
            for (const xd of [0, 1]) D[xd] += pu * pt * (t ? q[u] : q[xd]);                         // do(X=xd): U keeps its law
          }
          return { J, D };
        };
        const simulate = (p, q, lam, sd) => {
          const r = rng(sd), C = [[0, 0], [0, 0]]; const N = 3000;
          for (let i = 0; i < N; i++) { const u = r() < p ? 1 : 0, t = r() < lam ? 1 : 0, x = u, y = r() < (t ? q[u] : q[x]) ? 1 : 0; C[x][y]++; }
          return C.map((row) => row.map((c) => c / N));
        };
        let info = {};
        v.render(() => {
          const p = pS.value, q = [q0S.value, q1S.value], ms = [model(p, q, l1S.value), model(p, q, l2S.value)];
          const sims = [simulate(p, q, l1S.value, seed * 3 + 1), simulate(p, q, l2S.value, seed * 3 + 2)];
          const cells = [[0, 0], [0, 1], [1, 0], [1, 1]];
          cells.forEach(([x, y], k) => {
            const cx = k + 0.9;
            sims.forEach((_, mi) => { const val = ms[mi].J[x][y]; const x0 = cx - 0.34 + mi * 0.36; so.rect(x0, 0, x0 + 0.32, val, { fill: mi ? 'orange' : 'accent', fillAlpha: 0.4, color: mi ? 'orange' : 'accent' }); so.dot(x0 + 0.16, sims[mi][x][y], { r: 3.4, color: mi ? 'gold' : 'ink' }); });
          });
          const bars = [[0.6, ms[0].D[0], ms[1].D[0]], [1.5, ms[0].D[1], ms[1].D[1]]];
          bars.forEach(([x, a, b]) => { si.rect(x - 0.4, 0, x - 0.02, a, { fill: 'accent', fillAlpha: 0.4, color: 'accent' }); si.rect(x + 0.02, 0, x + 0.4, b, { fill: 'orange', fillAlpha: 0.4, color: 'orange' }); });
          [[2.7, q[0]], [3.5, q[1]]].forEach(([x, val]) => si.rect(x - 0.3, 0, x + 0.3, val, { fill: 'muted', fillAlpha: 0.3, color: 'muted' }));
          G.draw({ nodeColor: (id) => (id === 2 ? 'muted' : id === 0 ? 'orange' : 'green'), edgeWidth: (e) => (e.from === 0 && e.to === 1 ? 1 + 3 * (1 - (l1S.value + l2S.value) / 2) : 1.7) });
          sgr.corner(`X→Y used: ${Math.round(100 * (1 - l1S.value))}% | ${Math.round(100 * (1 - l2S.value))}%`, 'tl', { color: 'muted' });
          const tv = Math.max(...cells.map(([x, y]) => Math.abs(ms[0].J[x][y] - ms[1].J[x][y])));
          info = { ate: ms.map((m) => m.D[1] - m.D[0]), tv };
        });
        v.readout(() => `Largest difference between the two models’ observational cells: **${v.fix(info.tv, 12).replace(/0+$/, '0')}** — the data are the same.\n` +
          `Average causal effect of $X$ on $Y$: model 1 **${fx(info.ate[0], 3)}**, model 2 **${fx(info.ate[1], 3)}**. The observed contrast $P(Y{=}1\\mid X{=}1)-P(Y{=}1\\mid X{=}0)=${fx(q1S.value - q0S.value, 3)}$ equals the first only when there is no confounding at all.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Definition', name: 'Single-world intervention graphs',
      statement: String.raw`Given a causal DAG $G$ and a treatment node $A$, the **single-world intervention graph** $G(a)$ (SWIG) is obtained by **splitting** $A$ into two nodes: the **natural value** $A$, which keeps all the arrows *into* $A$ and no arrows out, and the **fixed value** $a$, which keeps all the arrows *out of* $A$ and none in. Every descendant $V$ of $A$ is relabelled with its counterfactual $V^{a}$. The SWIG represents the joint law of the factual variables that precede treatment, the natural treatment $A$, and the counterfactuals $V^a$ in a single hypothetical world, and satisfies the same d-separation rules (the fixed node $a$ counts as conditioned on). In particular, $Y^{a}\perp\!\!\!\perp A\mid Z$ **holds** exactly when $Y^a$ and $A$ are d-separated by $Z$ (and $a$) in $G(a)$.`,
      idea: String.raw`Potential-outcome independences such as conditional exchangeability (1.7) are exactly the statements one wants for identification, but the plain DAG only talks about the factual world. Splitting the treatment makes the graph describe the world in which treatment was set to $a$ *and* the natural treatment is still around, so $A$ and $Y^a$ can sit in one picture and be tested by d-separation — the back-door criterion becomes a statement about the SWIG. The cut at $A$ is the graphical form of $G_{\overline A}$ together with the original $G$.`,
      caption: String.raw`Choose a causal story; the left panel is the ordinary DAG and the right its SWIG for treatment $A$ (the node splits into $A\mid a$ and descendants become counterfactuals). Click pre-treatment covariates to condition on them (blue). The verdict reads exchangeability $Y^{a}\perp\!\!\!\perp A\mid Z$ off the SWIG by d-separation, and the simulation checks it: the partial correlation of $Y^a$ and $A$ given $Z$ (exact, and from 4,000 units).`,
      deps: ['causal-4.1', 'causal-1.7'], refs: ['Hernán–Robins §7.5'], tags: ['swig', 'exchangeability', 'counterfactuals'],
      credit: 'Richardson & Robins, 2013 (CSSS Working Paper 128)',
      verify: true,
      scope: String.raw`Shown for a single point treatment and a linear Gaussian realization (zero partial correlation then coincides with conditional independence). SWIGs extend to several treatments and dynamic regimes; hidden variables stay in the graph, drawn but never conditioned on.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Causal_graph' },
      viz(v) {
        const PRE = {
          conf: { label: 'confounder $L$', names: ['L', 'A', 'Y'], pos: [[5, 5], [1.7, 1.4], [8.3, 1.4]], e: [[0, 1], [0, 2], [1, 2]], t: 1, y: 2, hid: [] },
          hid: { label: 'hidden $U$ (proxy $L$)', names: ['U', 'A', 'Y', 'L'], pos: [[5, 5], [1.7, 1.4], [8.3, 1.4], [5, 2.4]], e: [[0, 1], [0, 2], [1, 2], [0, 3]], t: 1, y: 2, hid: [0] },
          rand: { label: 'randomized', names: ['A', 'Y', 'L'], pos: [[1.7, 1.4], [8.3, 1.4], [5, 5]], e: [[2, 1], [0, 1]], t: 0, y: 1, hid: [] },
          mb: { label: 'M-shaped', names: ['U₁', 'U₂', 'L', 'A', 'Y'], pos: [[1.7, 5], [8.3, 5], [5, 5], [1.7, 1.4], [8.3, 1.4]], e: [[0, 2], [1, 2], [0, 3], [1, 4], [3, 4]], t: 3, y: 4, hid: [0, 1] },
        };
        const ps = v.select('story', Object.entries(PRE).map(([k, o]) => ({ value: k, label: o.label })), 'conf', { onChange() { Z.clear(); } });
        const Z = new Set();
        const s1 = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 290, title: 'the DAG', minWidth: 250 });
        const s2 = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 290, title: 'the SWIG G(a)', minWidth: 250 });
        const cur = () => PRE[ps.value];
        const G1 = makeDag(v, s1, { names: PRE.conf.names, pos: PRE.conf.pos, edges: PRE.conf.e, draggable: false, r: 17, onClick: (c) => clickNode(c) });
        const G2 = makeDag(v, s2, { names: ['L', 'A', 'Y', 'a'], pos: PRE.conf.pos.concat([[3, 1.4]]), edges: PRE.conf.e, draggable: false, r: 17, onClick: (c) => clickNode(c) });
        function clickNode(c) {
          if (c.node == null) return false; const o = cur(), id = c.id ?? c.node.id, de = descendants(o.names.length, o.e, o.t);
          if (de.has(id) || o.hid.includes(id)) return true; if (Z.has(id)) Z.delete(id); else Z.add(id); v.invalidate(); return true;
        }
        const coefOf = (a, b) => 0.55 + 0.2 * ((a * 3 + b) % 3);
        let info = {};
        v.render(() => {
          const o = cur(), n = o.names.length, de = descendants(n, o.e, o.t), t = o.t, an = n; // 'a' gets index n
          // SWIG edges: arrows out of A come from the fixed node a
          const Es = o.e.map(([p, q]) => (p === t ? [an, q] : [p, q]));
          const lbl = (i) => (i === t ? o.names[i] : de.has(i) ? `$${o.names[i]}^{a}$` : o.names[i]);
          // positions: A on the left, a on the right of A's slot
          const px = o.pos.map((p) => p.slice()); const ax = px[t][0], ay = px[t][1];
          px[t] = [ax - 0.75, ay]; const aPos = [ax + 0.75, ay];
          G1.set({ nodes: o.names.map((c, i) => ({ id: i, label: c, x: o.pos[i][0], y: o.pos[i][1] })), edges: o.e.map(([p, q]) => ({ from: p, to: q })), directed: true, layout: 'none' });
          G2.set({ nodes: [...o.names.map((c, i) => ({ id: i, label: lbl(i), x: px[i][0], y: px[i][1] })), { id: an, label: 'a', x: aPos[0], y: aPos[1] }], edges: Es.map(([p, q]) => ({ from: p, to: q })), directed: true, layout: 'none' });
          // verdict by d-separation in G(a), with the fixed node a conditioned on
          const cond = new Set([...Z, an]); const sep = dSep(n + 1, Es, t, o.y, cond);
          // exact and simulated partial correlation of A and Y^a given Z in the SWIG model (a is constant: drop it)
          const Eq = Es.filter(([p]) => p !== an), Bm = coefMatrix(n, Eq, coefOf), Sg = semCov(n, Bm, new Array(n).fill(1));
          const zl = [...Z].sort((a, b) => a - b), exact = pcorrCov(Sg, t, o.y, zl);
          const X = sampleSEM(n, Eq, Bm, new Array(n).fill(1), 4000, 31); const emp = pcorrCov(sampleCov(X), t, o.y, zl);
          const nodeFill = (id) => (Z.has(id) ? 'accent' : null), nodeColor = (id) => (o.hid.includes(id) ? 'muted' : id === t ? 'orange' : id === o.y ? 'green' : null);
          G1.draw({ nodeColor, nodeFill });
          G2.draw({ nodeColor: (id) => (id === an ? 'gold' : nodeColor(id)), nodeFill });
          info = { sep, exact, emp, zl, names: o.names };
        });
        v.readout(() => `Conditioning set $Z=${setTex(info.names, new Set(info.zl))}$. In $G(a)$: $Y^{a}$ and $A$ are **${info.sep ? 'd-separated' : 'd-connected'}** given $Z$, so conditional exchangeability $Y^{a}\\perp\\!\\!\\!\\perp A\\mid Z$ **${info.sep ? 'holds' : 'fails'}**.\n` +
          `Partial correlation of $Y^{a}$ and $A$ given $Z$: exact **${fx(info.exact, 3)}**, simulated **${fx(info.emp, 3)}**. ` +
          `${info.sep ? 'Zero, as the graph predicts.' : 'Non-zero: some unblocked path joins them, so adjusting for this $Z$ does not remove confounding.'}`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Paradox', name: 'Lord’s paradox',
      statement: String.raw`Lord (1967) described two groups (the weights of students of each sex) measured before and after a period in which the same diet applies to both. Each group’s mean weight is unchanged, so one statistician concludes that the diet has no differential effect (the *change scores* do not differ between groups). A second adjusts for initial weight (analysis of covariance) and finds that, at equal initial weight, the group with the higher mean ends up heavier — a significant differential effect. Both computations are correct; they answer different causal questions and rest on different assumptions about what each group’s final weight would have been *without* the diet.`,
      idea: String.raw`Within a group the final weight regresses toward the group’s mean: the regression slope on initial weight is less than one (here equal to the reliability $\rho$), so at equal initial weights the group with the higher mean has a higher expected final weight even if nothing happens to anyone. If initial weights are noisy measurements of stable weights, that is regression to the mean and the change-score comparison is right; if weights would drift toward a common mean without intervention, the same data show an effect and the adjusted comparison is right. The data are identical; the **causal graph** (what produces final weight) tells which contrast estimates the effect. Holland and Rubin (1983) and Pearl (2016) give the resolution.`,
      caption: String.raw`Scatter of final against initial weight for two groups of 100, simulated so that nobody’s expected weight changes. Drag reliability $\rho$ down: the group lines stay parallel but flatten, and the ANCOVA gap between them opens although both group means stay on the 45° line. Choose the causal story; the third bar is the true differential effect under that story (a modelling assumption, not something the data can reveal).`,
      deps: ['causal-4.3', 'stat-12.9'], refs: ['Pearl §6'], tags: ['lord', 'ancova', 'regression to the mean'],
      credit: 'Lord, 1967 (Psychological Bulletin 68(5):304–305); Holland & Rubin, 1983; Pearl, 2016 (Lord’s paradox revisited)',
      verify: true,
      scope: String.raw`A linear-Gaussian simulation with the same sampling variance in both groups; sex plays the role of the “treatment” only formally (nobody can be assigned a sex), which is part of Lord’s point: the contrasts target different counterfactuals. The data here are simulated, not Lord’s.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lord%27s_paradox' },
      viz(v) {
        const rS = v.slider(String.raw`reliability $\rho$ (slope within a group)`, 0.2, 1, 0.6, { step: 0.01 });
        const gS = v.slider('gap between group means (kg)', 0, 30, 20, { step: 0.5 });
        const story = v.select('causal story', [{ value: 'trait', label: 'stable weight + noise' }, { value: 'drift', label: 'drifts to common mean' }], 'trait');
        let seed = 1; v.button('resample', () => { seed++; });
        const sp = v.stage({ x: [35, 100], y: [35, 100], axes: 'box', gutter: true, height: 330, xlabel: 'initial weight (kg)', ylabel: 'final weight (kg)', title: 'two groups, same diet', minWidth: 330 });
        const sa = v.stage({ x: [0, 4], y: [-8, 8], axes: 'box', gutter: true, height: 330, ylabel: 'difference, higher-mean group minus other (kg)', title: 'two analyses, one truth per story', minWidth: 300 });
        sa.setTicks([[0.8, 'change scores'], [1.8, 'ANCOVA'], [3.0, 'true effect']], null);
        const sgr = v.stage({ x: [0, 10], y: [0, 5], equal: true, axes: false, height: 230, title: 'the story as a graph', minWidth: 240 });
        const G = makeDag(v, sgr, { names: ['sex', 'W₀', 'W₁'], pos: [[5, 4], [1.5, 1.2], [8.5, 1.2]], edges: [[0, 1], [1, 2], [0, 2]], draggable: false, r: 17 });
        v.legend([['accent', 'lower-mean group', { dot: true }], ['orange', 'higher-mean group', { dot: true }], ['faint', '45° line: no change', { dash: true }]]);
        const gen = (rho, gap, sd) => {
          const r = rng(sd * 131 + 7), n = 100, tot = 8, sT = Math.sqrt(rho) * tot, sE = Math.sqrt(1 - rho) * tot, out = [];
          for (let g = 0; g < 2; g++) for (let i = 0; i < n; i++) { const mu = 60 + (g ? gap / 2 : -gap / 2), T = mu + sT * r.normal(); out.push({ g, w0: T + sE * r.normal(), w1: T + sE * r.normal() }); }
          return out;
        };
        const fitAll = (D) => {
          // W1 ~ 1 + group + W0 (ANCOVA) and change ~ 1 + group
          const rows = D.map((d) => [1, d.g, d.w0]), y1 = D.map((d) => d.w1), b = ols(rows, y1);
          const A = Array.from({ length: 3 }, () => [0, 0, 0]); for (const r of rows) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j];
          const inv = [0, 1, 2].map((c) => solveSmall(A, [0, 1, 2].map((i) => (i === c ? 1 : 0))));
          let rss = 0; D.forEach((d, i) => { const e = y1[i] - (b[0] + b[1] * d.g + b[2] * d.w0); rss += e * e; });
          const seA = Math.sqrt(rss / (D.length - 3) * inv[1][1]);
          const ch = D.map((d) => d.w1 - d.w0), m = [0, 1].map((g) => mean(ch.filter((_, i) => D[i].g === g))), vv = [0, 1].map((g) => { const c = ch.filter((_, i) => D[i].g === g), mm = mean(c); return c.reduce((s, x) => s + (x - mm) ** 2, 0) / (c.length - 1); });
          return { slope: b[2], ancova: b[1], seA, change: m[1] - m[0], seC: Math.sqrt(vv[0] / 100 + vv[1] / 100), m, b, D };
        };
        let info = {};
        v.render(() => {
          const rho = rS.value, gap = gS.value, D = gen(rho, gap, seed), F = fitAll(D);
          sp.line(35, 35, 100, 100, { color: 'faint', dash: true, width: 1.3 });
          const col = ['accent', 'orange'];
          D.forEach((d) => sp.dot(d.w0, d.w1, { r: 2.8, color: col[d.g], alpha: 0.55 }));
          for (let g = 0; g < 2; g++) {
            const pts = D.filter((d) => d.g === g), mx = mean(pts.map((p) => p.w0)), my = mean(pts.map((p) => p.w1));
            sp.line(35, my + F.slope * (35 - mx), 100, my + F.slope * (100 - mx), { color: col[g], width: 2.4 });
            sp.dot(mx, my, { r: 7, color: col[g], hollow: false });
          }
          const truth = story.value === 'trait' ? 0 : (1 - rho) * gap;
          const bars = [[0.8, F.change, F.seC], [1.8, F.ancova, F.seA], [3.0, truth, 0]];
          bars.forEach(([x, val, se], k) => { sa.rect(x - 0.4, 0, x + 0.4, val, { fill: k === 2 ? 'green' : k === 0 ? 'blue' : 'red', fillAlpha: 0.4, color: k === 2 ? 'green' : k === 0 ? 'blue' : 'red' }); if (se) sa.segment([x, val - 1.96 * se], [x, val + 1.96 * se], { color: 'ink', width: 1.6 }); });
          sa.hline(0, { color: 'grid' });
          const names = story.value === 'trait' ? ['sex', 'W₀', 'W₁'] : ['sex', 'W₀', 'W₁'];
          if (story.value === 'trait') G.set({ nodes: [{ id: 0, label: 'sex', x: 5, y: 4.3 }, { id: 1, label: 'true wt', x: 5, y: 2.5, r: 20 }, { id: 2, label: 'W₀', x: 1.5, y: 0.8 }, { id: 3, label: 'W₁', x: 8.5, y: 0.8 }], edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }], directed: true, layout: 'none' });
          else G.set({ nodes: [{ id: 0, label: 'sex', x: 5, y: 4.3 }, { id: 1, label: 'W₀', x: 1.5, y: 1 }, { id: 2, label: 'W₁', x: 8.5, y: 1 }], edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 2 }], directed: true, layout: 'none' });
          G.draw({ nodeColor: (id) => (id === 0 ? 'orange' : null), edgeColor: (e) => (story.value === 'drift' && e.from === 0 && e.to === 2 ? 'red' : null) });
          info = { ...F, truth, names };
        });
        v.readout(() => `Statistician 1 (change scores): difference in mean change **${fx(info.change, 2)}** kg (±${v.fix(1.96 * info.seC, 2)}). Statistician 2 (ANCOVA, same initial weight): group difference **${fx(info.ancova, 2)}** kg (±${v.fix(1.96 * info.seA, 2)}); within-group slope ${v.fix(info.slope, 2)}.\n` +
          `Under the “${story.value === 'trait' ? 'stable weight + noise' : 'drifts to the common mean'}” story the true differential effect is **${fx(info.truth, 2)}** kg, so ${story.value === 'trait' ? 'the change-score analysis answers the question and the ANCOVA gap is regression to the mean' : 'the ANCOVA gap is the effect and the zero change scores hide it'}.`);
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13', kind: 'Paper', name: 'Causal diagrams for empirical research',
      paper: { authors: 'Judea Pearl', year: 1995, title: 'Causal diagrams for empirical research', venue: 'Biometrika 82 (4): 669–688', doi: '10.1093/biomet/82.4.669' },
      introduces: ['causal-4.1', 'causal-4.8', 'causal-4.9'],
      statement: String.raw`The paper shows how a causal diagram, combined with observed data, can decide quantitative causal questions without assuming that all confounders are measured. It gives (i) a calculus with three inference rules, each a d-separation test in a graph edited to represent an intervention, for deriving $P(y\mid \mathrm{do}(x))$ from observational probabilities; (ii) the back-door criterion for choosing sufficient covariates; and (iii) the **front-door criterion**, with an example (smoking, tar deposits, cancer, and an unobserved genotype) in which the effect is identified although no sufficient adjustment set is measured. The paper also asks which effects are identifiable at all, a question settled for the calculus by the completeness results of 2006 (4.10).`,
      idea: String.raw`Before 1995 causal modelling in statistics mostly meant regression with a list of covariates, and the choice of covariates rested on judgment; structural-equation modellers had graphs but no non-parametric theory, and the potential-outcome school had no graphical way to see which independences hold. Pearl’s paper connected the two with d-separation, introduced the notation $\mathrm{do}(x)$ for intervention, put the rules of the calculus on graphs, and derived adjustment and front-door formulas from them. It is the source of 4.1, 4.8 and 4.9 and the starting point of the identification programme that ends in 4.10.`,
      caption: String.raw`Edit the paper’s smoking–tar–cancer diagram (click one node, then another, to add or remove an arrow; $U$ is the unobserved genotype). The three front-door conditions are checked on your graph by d-separation, and the front-door formula is applied to data simulated from it. Delete an arrow the paper needs, or add one it rules out, and the checks and the estimate fail together. The parameters are invented here; they are not the paper’s numbers.`,
      deps: ['causal-3.5', 'causal-4.3', 'causal-3.3'], refs: [], tags: ['do-calculus', 'front-door', 'paper'],
      credit: 'Pearl, 1995 (Biometrika 82(4):669–688); discussion by Cox, Rubin, Freedman and others; Pearl’s rejoinder',
      verify: true,
      scope: String.raw`The reconstruction uses a binary model with invented parameters and checks conditions (i)–(iii) as stated in the statement above; it does not reproduce the paper’s figures. The paper’s own hypothetical smoking–tar–cancer data table is not used because the exact numbers could not be re-checked.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Judea_Pearl' },
      viz(v) {
        const names = ['genotype U', 'smoking X', 'tar M', 'cancer Y'], pos = [[5, 5.1], [1.5, 1.3], [5, 1.3], [8.5, 1.3]];
        const cS = v.slider(String.raw`strength of the genotype’s arrows`, 0, 3, 1.8, { step: 0.05 });
        const nS = v.slider('sample size $n$', 200, 50000, 5000, { log: true, int: true, sig: 2 });
        let seed = 1, msg = ''; v.button('resample', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 300, title: 'edit the diagram', minWidth: 270 });
        const sb = v.stage({ x: [0, 4.4], y: [-0.2, 0.8], axes: 'box', gutter: true, height: 300, ylabel: 'risk difference of cancer', title: 'truth and estimates', minWidth: 300 });
        sb.setTicks([[0.9, 'truth'], [1.9, 'naïve'], [2.9, 'front-door']], null);
        const G = makeDag(v, sgr, {
          names, pos, edges: [[0, 1], [0, 3], [1, 2], [2, 3]], editable: true, r: 19, fontSize: 12.5,
          onChange(kind, obj) { if (kind === 'add-edge') { if (hasCycle(4, edgesOf(G))) { G.removeEdge(obj); msg = 'That arrow would close a cycle: refused.'; } else msg = ''; } else msg = ''; v.invalidate(); },
        });
        v.legend([['green', 'true effect', { area: true }], ['red', 'naïve', { area: true }], ['accent', 'front-door formula', { area: true }], ['ink', '30 studies', { dot: true }]]);
        const key = memo(); let info = {};
        v.render(() => {
          const E = edgesOf(G), n = 4;
          const hasE = (a, b) => E.some(([p, q]) => p === a && q === b);
          // front-door conditions with M = node 2, X = 1, Y = 3
          const noM = E.filter(([a, b]) => a !== 2 && b !== 2), reach = descendants(n, noM, 1);
          const cond1b = !reach.has(3);
          const Gx = E.filter(([a]) => a !== 1);                       // arrows out of X deleted: back-door paths from X
          const cond2 = dSep(n, Gx, 1, 2, new Set());
          const Gm = E.filter(([a]) => a !== 2);                       // arrows out of M deleted: back-door paths from M
          const cond3 = dSep(n, Gm, 2, 3, new Set([1]));
          const m = binModel(n, E, { seed: 2, W: { '0>1': cS.value, '0>3': cS.value, '1>2': 2.2, '2>3': 1.6 }, B: { 3: -0.2 } });
          const P = jointP(m), truth = probOf(jointP(m, { 1: 1 }), n, { 3: 1 }) - probOf(jointP(m, { 1: 0 }), n, { 3: 1 });
          const naive = condProb(P, n, 3, { 1: 1 }) - condProb(P, n, 3, { 1: 0 }), fd = frontDoor(P, n, 1, 2, 3, 1) - frontDoor(P, n, 1, 2, 3, 0);
          const est = key(E.map((e) => e.join('')).sort().join('|') + `|${cS.value}|${nS.value}|${seed}`, () => Array.from({ length: 30 }, (_, k) => { const Q = sampleTable(P, nS.value, seed * 100 + k); return { n: condProb(Q, n, 3, { 1: 1 }) - condProb(Q, n, 3, { 1: 0 }), f: frontDoor(Q, n, 1, 2, 3, 1) - frontDoor(Q, n, 1, 2, 3, 0) }; }));
          const vals = [truth, naive, fd, ...est.map((e) => e.n), ...est.map((e) => e.f)], lo = Math.min(-0.05, ...vals) - 0.05, hi = Math.max(0.3, ...vals) + 0.05;
          sb.setView([0, 4.4], [lo, hi]); sb.hline(0, { color: 'grid', width: 1.2 });
          [[0.9, truth, 'green'], [1.9, naive, 'red'], [2.9, fd, 'accent']].forEach(([x, val, col]) => sb.rect(x - 0.35, 0, x + 0.35, val, { fill: col, fillAlpha: 0.4, color: col }));
          est.forEach((e, k) => { const j = ((k * 37) % 11 - 5) * 0.045; sb.dot(1.9 + j, e.n, { r: 2.6, color: 'ink', alpha: 0.65 }); sb.dot(2.9 + j, e.f, { r: 2.6, color: 'ink', alpha: 0.65 }); });
          G.draw({ nodeColor: (id) => (id === 0 ? 'muted' : id === 1 ? 'orange' : id === 3 ? 'green' : 'accent') });
          info = { c1: cond1b, c2: cond2, c3: cond3, truth, naive, fd, E, bypass: hasE(1, 3) };
        });
        const tick = (b) => (b ? '✓' : '✗');
        v.readout(() => (msg ? `**${msg}**\n` : '') + `Front-door conditions for $M$: (i) $M$ intercepts all directed paths $X\\to Y$ **${tick(info.c1)}**; (ii) no open back-door path $X$ to $M$ **${tick(info.c2)}**; (iii) $X$ blocks all back-door paths $M$ to $Y$ **${tick(info.c3)}**.\n` +
          `True effect **${fx(info.truth, 3)}**; naïve **${fx(info.naive, 3)}**; front-door formula **${fx(info.fd, 3)}** — ${info.c1 && info.c2 && info.c3 ? 'conditions hold, so the formula recovers the truth' : 'at least one condition fails, so the formula has no licence to work'}.`);
      },
    },
  ],
};
