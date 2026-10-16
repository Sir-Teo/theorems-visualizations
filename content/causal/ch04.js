// Causal Inference — Chapter 4: Interventions and identification (items 4.1–4.7; 4.8–4.13 in ch04-b.js)
//
// Honesty notes (Oct 2026): every model is simulated or computed exactly (binary tables, linear-Gaussian covariances); no printed number is a
// measurement except the two real tables in 4.4 (Charig et al. 1986 kidney-stone counts; Bickel–Hammel–O'Connell 1973 Berkeley counts, the
// six largest departments as distributed in R's UCBAdmissions, whose totals 2691/1198 and 1835/557 were re-added here).
// Attributions checked: Simpson, JRSS B 13:238–241 (1951); Bickel, Hammel & O'Connell, Science 187:398–404 (1975); Greenland, Epidemiology 14:300–306
// (2003); Ding & Miratrix, J. Causal Inference 3(1):41–57 (2015); Bhattacharya & Vogt, NBER Technical Working Paper 343 (2007); Pearl, UAI 2010,
// PMLR R8:424–431 (Pearl credits Bhattacharya–Vogt and Wooldridge 2009). Pearl's 1993 Statistical Science comment could not be page-checked: verify.
import {
  clamp, logistic, pct, sg, fx, mean, rng, memo, lab, svar, histPanel,
  parentsOf, hasCycle, topoOrder, descendants, ancestors, dSep, allPaths, pathReport, pathText,
  semCov, coefMatrix, sampleSEM, makeDag, edgesOf,
  binModel, condP1, jointP, probOf, condProb, sampleTable, popReg, totalEffect, sampleReg, setTex,
} from './ch04.shared.js';

export default {
  collection: 'causal',
  chapter: 4,
  title: 'Interventions and identification',
  summary: String.raw`An intervention replaces a variable’s mechanism, which on the graph means deleting the arrows into it; the interventional distribution then follows from the truncated factorization. The back-door criterion says which covariates to adjust for, and its failures explain Simpson’s paradox, M-bias, bias from controlling for mediators, colliders or instruments, and Lord’s paradox. When no adjustment set exists, the front-door criterion and, in general, the three rules of the do-calculus decide whether an effect can be computed from observational data at all; single-world intervention graphs bring potential outcomes into the same picture.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Definition', name: 'Intervention and the do-operator',
      statement: String.raw`In a structural causal model, the **intervention** $\mathrm{do}(X=x)$ replaces the structural equation of $X$ by the constant assignment $X:=x$ and leaves every other equation untouched. The resulting model has the graph $G_{\overline X}$ (all arrows into $X$ deleted), and its distribution is written $P(y\mid \mathrm{do}(x))$ or $P_x(y)$. In general
$$P(y\mid \mathrm{do}(x))\ \ne\ P(y\mid X=x),$$
because seeing $X=x$ is evidence about the causes of $X$, while setting $X=x$ cuts $X$ off from them. The two coincide when nothing influences both $X$ and $Y$ other than through $X$.`,
      idea: String.raw`Conditioning *selects* the units whose own mechanism produced $x$, so it also selects their values of every common cause; doing *overrides* the mechanism, so the common causes keep their natural distribution. That is why the graph surgery deletes only the arrows *into* $X$: the arrows out of $X$ (the mechanisms of its effects) are separate, stable equations that survive. This modularity, built into the structural model of 3.3, is what lets a model predict what an experiment would do from a description of how nature works.`,
      caption: String.raw`A confounder $Z$ pushes units into treatment $X$ and also moves the outcome. Choose observe or intervene (the arrow into $X$ turns into a dashed red cut). Bars: exact $P(Y{=}1\mid X{=}x)$ in blue and exact $P(Y{=}1\mid \mathrm{do}(X{=}x))$ in green; dots: estimates from 1,500 simulated units in each world. Set the two confounding sliders to 0 and the bars meet; make $Z$ push the other way and watch observation reverse the sign of the truth.`,
      deps: ['causal-3.3'], refs: ['Pearl §3.2'], tags: ['do-operator', 'intervention'],
      credit: 'Pearl, 1993–95 (do-operator and graph surgery); Spirtes, Glymour & Scheines, 1993 (manipulation theorem); Strotz & Wold, 1960 (earlier “wiping out an equation”)',
      verify: true,
      scope: String.raw`Perfect (“surgical”) interventions that fix $X$ without disturbing other mechanisms. A real-world action may also change other variables (a drug with side effects), in which case it is a different intervention.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Causal_model' },
      viz(v) {
        const names = ['Z', 'X', 'Y'], pos = [[5, 5], [1.6, 1.1], [8.4, 1.1]], E = [[0, 1], [0, 2], [1, 2]], N = 1500;
        const cS = v.slider(String.raw`$Z\to X$ (who gets treated)`, -2.5, 2.5, 1.6, { step: 0.05 });
        const dS = v.slider(String.raw`$Z\to Y$ (who does well)`, -2.5, 2.5, -1.6, { step: 0.05 });
        const eS = v.slider(String.raw`true effect $X\to Y$`, -2, 2, 0.6, { step: 0.05 });
        const world = v.select('world', [{ value: 'obs', label: 'observe' }, { value: 'do', label: String.raw`intervene: $\mathrm{do}(X)$` }], 'obs');
        let seed = 1; v.button('resample', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0, 6.2], equal: true, axes: false, height: 300, title: 'the model (or the mutilated model)', minWidth: 280 });
        const sb = v.stage({ x: [0, 6], y: [0, 1], axes: 'box', gutter: true, height: 300, ylabel: String.raw`$P(Y=1\mid\cdot)$`, title: 'seeing versus doing', minWidth: 300 });
        sb.setTicks([[1, 'X=0'], [2, 'X=1'], [3.9, 'do(X=0)'], [4.9, 'do(X=1)']], [[0, '0'], [0.25, '.25'], [0.5, '.5'], [0.75, '.75'], [1, '1']]);
        const G = makeDag(v, sgr, { names, pos, edges: E, draggable: false, r: 18 });
        v.legend([['accent', 'seeing: exact', { area: true }], ['green', 'doing: exact', { area: true }], ['ink', 'simulated units', { dot: true }]]);
        let info = {};
        v.render(() => {
          const m = binModel(3, E, { seed: 5, W: { '0>1': cS.value, '0>2': dS.value, '1>2': eS.value } });
          const P = jointP(m), obs = [0, 1].map((x) => condProb(P, 3, 2, { 1: x }));
          const Pd = [0, 1].map((x) => jointP(m, { 1: x })), dov = [0, 1].map((x) => probOf(Pd[x], 3, { 2: 1 }));
          const Q = sampleTable(P, N, seed), estObs = [0, 1].map((x) => { const d = probOf(Q, 3, { 1: x }); return d > 0 ? probOf(Q, 3, { 1: x, 2: 1 }) / d : NaN; });
          const estDo = [0, 1].map((x) => probOf(sampleTable(Pd[x], N, seed * 3 + x), 3, { 2: 1 }));
          const isDo = world.value === 'do', aO = isDo ? 0.14 : 0.42, aD = isDo ? 0.42 : 0.14;
          [[1, 0], [2, 1]].forEach(([px, x]) => { sb.rect(px - 0.38, 0, px + 0.38, obs[x], { fill: 'accent', fillAlpha: aO, color: 'accent' }); sb.dot(px, estObs[x], { r: 5, color: 'ink' }); });
          [[3.9, 0], [4.9, 1]].forEach(([px, x]) => { sb.rect(px - 0.38, 0, px + 0.38, dov[x], { fill: 'green', fillAlpha: aD, color: 'green' }); sb.dot(px, estDo[x], { r: 5, color: 'ink' }); });
          G.draw({
            nodeColor: (id) => (id === 1 ? 'orange' : 'accent'), nodeFill: (id) => (isDo && id === 1 ? 'gold' : null),
            edgeColor: (e) => (isDo && e.to === 1 ? 'red' : null), edgeDash: (e) => (isDo && e.to === 1 ? true : null), edgeWidth: (e) => (isDo && e.to === 1 ? 2.2 : null),
          });
          if (isDo) sgr.text(String.raw`X := x  (no longer listens to Z)`, 1.6, 2.6, { size: 12, color: 'red', plate: true });
          info = { rdObs: obs[1] - obs[0], rdDo: dov[1] - dov[0], obs, dov };
        });
        v.readout(() => `Seeing: $P(Y{=}1\\mid X{=}1)-P(Y{=}1\\mid X{=}0)=${fx(info.obs[1], 3)}-${fx(info.obs[0], 3)}=$ **${fx(info.rdObs, 3)}**.\n` +
          `Doing: $P(Y{=}1\\mid \\mathrm{do}(X{=}1))-P(Y{=}1\\mid \\mathrm{do}(X{=}0))=${fx(info.dov[1], 3)}-${fx(info.dov[0], 3)}=$ **${fx(info.rdDo, 3)}**` +
          `${Math.abs(info.rdObs - info.rdDo) < 1e-6 ? ' (equal: no confounding left to cut)' : ` — they differ by **${fx(info.rdObs - info.rdDo, 3)}**, the confounding bias.`}`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Theorem', name: 'Truncated factorization (g-formula)',
      statement: String.raw`Let $P$ be generated by a Markovian causal model with graph $G$ on discrete $V=\{V_1,\dots,V_k\}$ (no unmeasured common causes), so $P(v)=\prod_i P(v_i\mid \mathrm{pa}_i)$. For a set $X\subseteq V$ and a value $x$,
$$P\big(v\mid \mathrm{do}(X=x)\big)=\begin{cases}\displaystyle\prod_{i:\,V_i\notin X}P(v_i\mid \mathrm{pa}_i) & \text{if } v \text{ is consistent with } x,\\[4pt] 0&\text{otherwise,}\end{cases}$$
the observational factorization with the factors of the intervened variables deleted. Summing out gives, for instance, $P(y\mid \mathrm{do}(x))=\sum_{z,m}P(z)P(m\mid x,\dots)P(y\mid \dots)$ over the remaining variables. This is Robins’s **g-formula** for point treatments.`,
      idea: String.raw`The intervention swaps one equation, so the new joint law is the product of the same conditionals with the replaced factor gone: every remaining $V_i$ still draws from its own mechanism given its parents, but $X$ no longer draws from $P(x\mid \mathrm{pa}_X)$. That makes the interventional law computable from observational conditionals, provided every parent is measured. It uses the Markov factorization (3.2) and the surgery of 4.1.`,
      caption: String.raw`Pick a graph on $Z,X,M,Y$ and a value $x$. Left: every cell of $(Z,M,Y)$ carries the product of all the factors except $X$’s (the truncated joint); green cells have $Y=1$ and their sum is the formula’s answer. Right: that sum, the answer of 3,000 simulated units whose $X$ is forced to $x$, and the naïve conditional $P(Y{=}1\mid X{=}x)$. The first two agree; the third does not when there is a back-door.`,
      deps: ['causal-4.1', 'causal-3.2'], refs: ['Pearl §3.2', 'Hernán–Robins §13'], tags: ['g-formula', 'factorization'],
      credit: 'Robins, 1986 (g-computation formula); Pearl, 1993 (truncated factorization); Spirtes, Glymour & Scheines, 1993 (manipulation theorem)',
      scope: String.raw`Needs all parents of the intervened variables to be measured and the model to be Markovian; with latent common causes the factors involving them are unavailable and identification needs the criteria of 4.3–4.10.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/G-formula' },
      viz(v) {
        const names = ['Z', 'X', 'M', 'Y'], pos = [[1.4, 4.6], [1.4, 1.2], [5, 2.9], [8.6, 2.9]];
        const DAGS = {
          conf: { label: 'confounder $Z$, mediator $M$', e: [[0, 1], [0, 3], [1, 2], [2, 3]] },
          coll: { label: '$M$ caused by $X$ and $Y$', e: [[0, 1], [0, 3], [1, 3], [1, 2], [3, 2]] },
          none: { label: 'no back-door path', e: [[0, 3], [1, 2], [2, 3], [1, 3]] },
        };
        const dg = v.select('graph', Object.entries(DAGS).map(([k, o]) => ({ value: k, label: o.label })), 'conf');
        const xv = v.select('set $X$ to', [{ value: 0, label: '0' }, { value: 1, label: '1' }], 1);
        let seed = 1; v.button('resample units', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 5.6], equal: true, axes: false, height: 270, title: 'graph (arrows into X cut)', minWidth: 250 });
        const sc = v.stage({ x: [-0.6, 7.6], y: [0, 0.3], axes: 'box', gutter: true, height: 270, xlabel: 'cell of the truncated joint: (Z M Y)', ylabel: 'product of factors', title: 'the truncated joint', minWidth: 300 });
        const sr = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 270, ylabel: String.raw`$P(Y{=}1)$`, title: 'three ways to get an answer', minWidth: 250 });
        sr.setTicks([[1, 'formula'], [2, 'simulated'], [3, 'seen']], [[0, '0'], [0.25, '.25'], [0.5, '.5'], [0.75, '.75'], [1, '1']]);
        const G = makeDag(v, sgr, { names, pos, edges: DAGS.conf.e, draggable: false, r: 17 });
        let info = {};
        v.render(() => {
          const E = DAGS[dg.value].e, x = xv.value, m = binModel(4, E, { seed: 11, scale: 1.1 });
          G.set({ nodes: names.map((c, i) => ({ id: i, label: c, x: pos[i][0], y: pos[i][1] })), edges: E.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none' });
          const Pd = jointP(m, { 1: x }), P = jointP(m);
          // cells of (Z, M, Y) with X = x
          const cells = []; for (let k = 0; k < 8; k++) { const z = k & 1, mm = (k >> 1) & 1, y = (k >> 2) & 1; const c = z | (x << 1) | (mm << 2) | (y << 3); cells.push({ z, m: mm, y, p: Pd[c] }); }
          const top = Math.max(...cells.map((c) => c.p)) * 1.25; sc.setView([-0.6, 7.6], [0, top]);
          const tk = cells.map((c, k) => [k, `${c.z}${c.m}${c.y}`]); sc.setTicks(tk, null);
          cells.forEach((c, k) => sc.rect(k - 0.36, 0, k + 0.36, c.p, c.y ? { fill: 'green', fillAlpha: 0.5, color: 'green' } : { fill: 'muted', fillAlpha: 0.22, color: 'muted' }));
          const formula = cells.reduce((s, c) => s + (c.y ? c.p : 0), 0);
          // independent experiment: units simulated one by one with X forced
          const order = topoOrder(4, E), r = rng(seed * 7919 + 13 * x + dg.value.length); let hit = 0; const NN = 3000;
          for (let t = 0; t < NN; t++) { let c = 0; for (const i of order) { const bit = i === 1 ? x : (r() < condP1(m, i, c) ? 1 : 0); c |= bit << i; } hit += (c >> 3) & 1; }
          const exper = hit / NN, naive = condProb(P, 4, 3, { 1: x });
          [[1, formula, 'green'], [2, exper, 'gold'], [3, naive, 'red']].forEach(([px, val, col]) => { sr.rect(px - 0.32, 0, px + 0.32, val, { fill: col, fillAlpha: 0.35, color: col }); });
          G.draw({ nodeColor: (id) => (id === 1 ? 'orange' : id === 3 ? 'green' : 'accent'), edgeColor: (e) => (e.to === 1 ? 'red' : null), edgeDash: (e) => (e.to === 1 ? true : null) });
          const pa = m.pa, lw = (i) => names[i].toLowerCase();
          const fac = [0, 2, 3].map((i) => `P(${lw(i)}${pa[i].length ? '\\mid ' + pa[i].map((p) => (p === 1 ? 'x' : lw(p))).join(',') : ''})`).join('\\,');
          info = { formula, exper, naive, fac, E };
        });
        v.readout(() => `Truncated factorization: $P(z,m,y\\mid \\mathrm{do}(x))=${info.fac}$ for cells with $X=${xv.value}$.\n` +
          `Sum over the green cells: **${v.fix(info.formula, 3)}**; simulated experiment (n = 3,000): **${v.fix(info.exper, 3)}**; seeing instead of doing: **${v.fix(info.naive, 3)}** ` +
          `${Math.abs(info.naive - info.formula) < 1e-6 ? '(identical: no back-door path)' : `(off by ${fx(info.naive - info.formula, 3)})`}.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Theorem', name: 'Back-door criterion',
      statement: String.raw`Let $X$ and $Y$ be two variables of a causal DAG $G$. A set $Z$ of variables satisfies the **back-door criterion** relative to $(X,Y)$ if (i) no member of $Z$ is a descendant of $X$, and (ii) $Z$ blocks (d-separates) every path between $X$ and $Y$ that begins with an arrow *into* $X$, i.e. $(X\perp\!\!\!\perp Y\mid Z)$ in the graph $G_{\underline X}$ with the arrows out of $X$ deleted. If $Z$ satisfies it, the causal effect is identifiable by adjustment:
$$P(y\mid \mathrm{do}(x))=\sum_{z}P(y\mid x,z)\,P(z).$$`,
      idea: String.raw`Condition (ii) says that once $Z$ is held fixed, the only association left between $X$ and $Y$ flows along directed paths out of $X$ — the causal paths. Condition (i) keeps $Z$ from blocking those causal paths or opening a collider through a consequence of $X$. In the truncated model (4.2) $X$ has no parents, so $Y$ is independent of $X$ given $Z$ exactly when $(X\perp\!\!\!\perp Y\mid Z)$ holds in $G_{\underline X}$, and averaging $P(y\mid x,z)$ over the *natural* law of $Z$ then reproduces the interventional answer.`,
      caption: String.raw`A linear-Gaussian world on the graph below. In “pick the adjustment set” mode click covariates to put them in $Z$ (filled blue); in “edit arrows” mode click one node and then another to add or remove an arrow (cycles are refused). The verdict lists the open back-door paths and any descendants of $X$ in $Z$. Right: the coefficient of $X$ in a regression on $Z$ over 300 simulated studies of 200 units, against the true total effect (green line). Valid sets centre on it; invalid ones do not.`,
      deps: ['causal-4.2', 'causal-3.5'], refs: ['Pearl §3.3', 'Hernán–Robins §7.3'], tags: ['back-door', 'adjustment'],
      credit: 'Pearl, 1993 (back-door criterion); Pearl, Biometrika 82, 1995',
      verify: true,
      scope: String.raw`Sufficient for identification by covariate adjustment, not necessary for identifiability (the front-door criterion, 4.8, identifies effects no adjustment set can). The simulation is linear and Gaussian with unit-variance noise.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confounding#Decreasing_the_potential_for_confounding' },
      viz(v) {
        const names = ['X', 'Y', 'A', 'B', 'C', 'D'], pos = [[1.1, 2.4], [8.9, 2.4], [5, 5.5], [2.0, 4.4], [7.2, 4.4], [5, 1.1]];
        const E0 = [[2, 0], [2, 1], [3, 0], [3, 4], [4, 1], [0, 1], [0, 5], [5, 1]];
        const thS = v.slider(String.raw`true direct effect of $X$ on $Y$`, -1, 2, 1, { step: 0.1 });
        const mode = v.select('click', [{ value: 'set', label: 'pick the adjustment set' }, { value: 'edit', label: 'edit arrows' }], 'set');
        const Z = new Set(); let msg = '';
        const sgr = v.stage({ x: [0, 10], y: [0, 6.4], equal: true, axes: false, height: 330, title: 'the graph — which covariates to adjust for?', minWidth: 300 });
        const sh = v.stage({ x: [-1, 3], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: String.raw`estimated coefficient of $X$`, ylabel: 'share of studies', title: '300 simulated studies', minWidth: 280 });
        const G = makeDag(v, sgr, {
          names, pos, edges: E0, editable: true, r: 17,
          onChange(kind, obj) {
            if (kind === 'add-edge') { if (hasCycle(6, edgesOf(G))) { G.removeEdge(obj); msg = 'That arrow would close a cycle: refused.'; } else msg = ''; } else msg = '';
            v.invalidate();
          },
          onClick(c) {
            if (mode.value !== 'set' || c.node == null) return false;
            const id = c.id ?? c.node.id; if (id === 0 || id === 1) return true;
            if (Z.has(id)) Z.delete(id); else Z.add(id); v.invalidate(); return true;
          },
        });
        const coef = (th) => (a, b) => (a === 0 && b === 1 ? th : 0.45 + 0.15 * ((a + 2 * b) % 3));
        const key = memo(); let info = {};
        v.render(() => {
          const E = edgesOf(G), th = thS.value, B = coefMatrix(6, E, coef(th)), truth = totalEffect(6, B, 1, 0);
          const zl = [...Z].sort((a, b) => a - b), ones = new Array(6).fill(1);
          const ests = key(E.map((e) => e.join('')).sort().join('|') + '#' + zl.join('') + '#' + th, () => {
            const out = new Float64Array(300);
            for (let r = 0; r < 300; r++) { const X = sampleSEM(6, E, B, ones, 200, 1000 + r); out[r] = sampleReg(X, 1, [0, ...zl])[0]; }
            return out;
          });
          const lo = Math.min(truth - 0.8, ...ests) - 0.05, hi = Math.max(truth + 0.8, ...ests) + 0.05;
          sh.setView([lo, hi], [0, 1]);
          histPanel(sh, [{ vals: Array.from(ests), color: 'accent' }], lo, hi, 36);
          sh.vline(truth, { color: 'green', width: 2.4 });
          // back-door check
          const desc = descendants(6, E, 0), bad = zl.filter((z) => desc.has(z));
          const Gb = E.filter(([a]) => a !== 0), open = allPaths(6, Gb, 0, 1).filter((p) => pathReport(6, Gb, p, Z).open);
          const ok = bad.length === 0 && open.length === 0;
          G.draw({
            nodeColor: (id) => (id === 0 ? 'orange' : id === 1 ? 'green' : Z.has(id) ? 'accent' : null), nodeFill: (id) => (Z.has(id) ? 'accent' : null),
            nodeRing: (id) => (Z.has(id) && desc.has(id) ? 'red' : null),
          });
          let m = 0; for (const e of ests) m += e; m /= ests.length;
          info = { truth, mean: m, bad, open, ok, E, zl };
        });
        v.readout(() => (msg ? `**${msg}**\n` : '') +
          `$Z=${setTex(names, new Set(info.zl))}$: ${info.bad.length ? `**not allowed** — ${info.bad.map((i) => names[i]).join(', ')} descend${info.bad.length === 1 ? 's' : ''} from $X$. ` : ''}` +
          `${info.open.length ? `Open back-door path${info.open.length > 1 ? 's' : ''}: ${info.open.slice(0, 3).map((p) => '$' + pathText(info.E.filter(([a]) => a !== 0), p, (i) => names[i]).replace(/→/g, '\\to ').replace(/←/g, '\\leftarrow ') + '$').join(';  ')}.` : 'No open back-door path.'} ` +
          `Back-door criterion: **${info.ok ? 'satisfied' : 'violated'}**.\n` +
          `Average estimate **${fx(info.mean, 3)}** against the true total effect **${fx(info.truth, 3)}** (bias ${fx(info.mean - info.truth, 3)}).`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Paradox', name: 'Simpson’s paradox',
      statement: String.raw`A comparison can reverse when data are pooled: for two groups $a$ and $b$ and strata $s$ it is possible that $P(Y{=}1\mid a,s)>P(Y{=}1\mid b,s)$ in **every** stratum $s$, yet $P(Y{=}1\mid a)<P(Y{=}1\mid b)$ overall, because the groups have different stratum mixes $P(s\mid a)\ne P(s\mid b)$. Arithmetic permits both; **which** comparison answers a causal question depends on the causal graph: if $S$ is a common cause of the group and the outcome, adjust ($\sum_s P(Y{=}1\mid g,s)P(s)$, 4.3); if $S$ lies on the path from group to outcome (a mediator), the pooled comparison is the total effect.`,
      idea: String.raw`The overall rate is a weighted average of the stratum rates with weights $P(s\mid g)$ that depend on the group. A group concentrated in easy strata can win overall without winning anywhere, and a group concentrated in hard strata can lose overall while winning everywhere. The reversal disappears if the mixes are equalized. The data alone cannot say which table to read; the story (the graph) can: in the kidney-stone data the surgeon’s choice of treatment depended on stone size, so size is a confounder and the stratified rates answer the question.`,
      caption: String.raw`Choose a data set: Charig et al.’s kidney-stone counts (open surgery versus percutaneous nephrolithotomy) or the six largest Berkeley departments of 1973 (women versus men). Bars are success or admission rates by stratum and, at the right, pooled; the numbers under each bar are counts. Drag **mix shift** to move the first group’s stratum mix toward the second’s (rates unchanged): the reversal dissolves exactly when the two mixes agree.`,
      deps: ['causal-4.3'], refs: ['Pearl §6.1'], tags: ['simpson', 'paradox', 'confounding'],
      credit: 'Pearson, 1899, and Yule, 1903 (the effect); Simpson, 1951; Blyth, 1972 (the name); Charig et al., BMJ 292:879–882 (1986); Bickel, Hammel & O’Connell, Science 187:398–404 (1975)',
      verify: true,
      scope: String.raw`The kidney-stone counts are as commonly reproduced from Charig et al. (1986); the Berkeley table is the six-department extract distributed with R, which keeps only the largest departments (its totals are 2,691 men with 1,198 admitted and 1,835 women with 557 admitted). Both are real, observational tables, not experiments.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Simpson%27s_paradox' },
      viz(v) {
        const DATA = {
          kidney: { g: ['open surgery', 'PCNL'], st: ['small', 'large'], n: [[87, 263], [270, 80]], s: [[81, 192], [234, 55]], out: 'success', title: 'kidney-stone treatments (Charig et al. 1986)',
            nodes: ['stone size', 'treatment', 'success'], gpos: [[5, 4.9], [1.6, 1.3], [8.4, 1.3]], ge: [[0, 1], [0, 2], [1, 2]], note: 'stone size causes both the choice of treatment and the outcome: it is a confounder, so the stratified answer is the causal one' },
          ucb: { g: ['women', 'men'], st: ['A', 'B', 'C', 'D', 'E', 'F'], n: [[108, 25, 593, 375, 393, 341], [825, 560, 325, 417, 191, 373]], s: [[89, 17, 202, 131, 94, 24], [512, 353, 120, 138, 53, 22]], out: 'admitted', title: 'Berkeley graduate admissions, 1973, six largest departments',
            nodes: ['sex', 'department', 'admitted'], gpos: [[1.6, 1.3], [5, 4.9], [8.4, 1.3]], ge: [[0, 1], [1, 2], [0, 2]], note: 'department is on the path from sex to admission (applicants choose it): the pooled gap is the total effect of sex, the stratified one the effect within departments, so the two answer different questions' },
        };
        const ds = v.select('data', [{ value: 'kidney', label: 'kidney stones' }, { value: 'ucb', label: 'Berkeley admissions' }], 'kidney');
        const lam = v.slider('mix shift of the first group toward the second’s', 0, 1, 0, { step: 0.01 });
        const sb = v.stage({ x: [-0.6, 8], y: [-0.16, 1.05], axes: 'box', gutter: true, height: 320, ylabel: 'rate', title: 'rate by stratum, and pooled', minWidth: 360 });
        const sgr = v.stage({ x: [0, 10], y: [0, 6.2], equal: true, axes: false, height: 320, title: 'the causal story', minWidth: 260 });
        const G = makeDag(v, sgr, { names: ['a', 'b', 'c'], pos: [[5, 4.9], [1.6, 1.3], [8.4, 1.3]], edges: [[0, 1], [0, 2], [1, 2]], draggable: false, r: 17 });
        let info = {};
        v.render(() => {
          const D = DATA[ds.value], K = D.st.length, l = lam.value;
          const n0 = D.n[0].reduce((a, b) => a + b, 0), n1 = D.n[1].reduce((a, b) => a + b, 0);
          const nn = [D.n[0].map((c, k) => n0 * ((1 - l) * c / n0 + l * D.n[1][k] / n1)), D.n[1].slice()];
          const r = [D.s[0].map((c, k) => c / D.n[0][k]), D.s[1].map((c, k) => c / D.n[1][k])];
          const pool = [0, 1].map((g) => nn[g].reduce((a, c, k) => a + c * r[g][k], 0) / nn[g].reduce((a, c) => a + c, 0));
          const sh = (g) => nn[g].map((c) => c / nn[g].reduce((a, b) => a + b, 0));
          const pi = nn[0].map((c, k) => (c + nn[1][k])), tot = pi.reduce((a, b) => a + b, 0);
          const stdz = [0, 1].map((g) => pi.reduce((a, c, k) => a + c / tot * r[g][k], 0));
          const xs = D.st.map((_, k) => k * 1.15 + 0.5), xo = K * 1.15 + 0.9;
          sb.setView([-0.6, xo + 1.0], [-0.16, 1.05]); sb.setTicks([...xs.map((x, k) => [x, D.st[k]]), [xo, 'pooled']], [[0, '0'], [0.5, '.5'], [1, '1']]);
          const col = ['accent', 'orange'];
          const bar = (x, g, val, cnt, strong) => {
            const x0 = x - 0.5 + g * 0.5; sb.rect(x0, 0, x0 + 0.45, val, { fill: col[g], fillAlpha: strong ? 0.5 : 0.36, color: col[g], width: strong ? 2.2 : 1.4 });
            sb.text(String(Math.round(cnt)), x0 + 0.225, -0.05, { size: 9.5, color: 'muted', align: 'center' });
          };
          D.st.forEach((_, k) => { [0, 1].forEach((g) => bar(xs[k], g, r[g][k], nn[g][k], false)); });
          [0, 1].forEach((g) => bar(xo, g, pool[g], nn[g].reduce((a, c) => a + c, 0), true));
          sb.vline((xs[K - 1] + xo) / 2, { color: 'faint', dash: true, width: 1 });
          const wins = r[0].filter((x, k) => x > r[1][k]).length;
          G.set({ nodes: D.nodes.map((c, i) => ({ id: i, label: c, x: D.gpos[i][0], y: D.gpos[i][1] })), edges: D.ge.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none', shape: 'box' });
          G.draw({ nodeColor: (id) => (id === 2 ? 'green' : id === 1 && ds.value === 'kidney' ? 'orange' : 'accent') });
          info = { D, r, pool, wins, K, stdz, shares: [sh(0), sh(1)] };
        });
        v.legend([['accent', 'first group', { area: true }], ['orange', 'second group', { area: true }]]);
        v.readout(() => {
          const { D, wins, K, pool, stdz } = info; const G0 = D.g[0], G1 = D.g[1];
          return `**${D.title}.** Legend: first group = ${G0} (blue), second = ${G1} (orange); outcome = ${D.out}.\n` +
            `${G0} have the higher rate in **${wins} of ${K}** strata, and pooled **${v.fix(100 * pool[0], 1)}%** against **${v.fix(100 * pool[1], 1)}%** for ${G1} — ${(pool[0] > pool[1]) === (wins * 2 > K) ? 'the pooled comparison points the same way as most strata.' : 'the pooled comparison points the **opposite** way.'}\n` +
            `Standardized to the combined stratum mix (adjusting for the stratum): ${v.fix(100 * stdz[0], 1)}% against ${v.fix(100 * stdz[1], 1)}%. In the graph: ${D.note}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Concept', name: 'M-bias: adjusting for a pre-treatment collider',
      statement: String.raw`Let $U_1\to X$, $U_2\to Y$ and $X\to Y$, with a pre-treatment variable $Z$ that is a *common effect* of the two unmeasured causes: $U_1\to Z\leftarrow U_2$ (the graph is shaped like an M). Then $X$ and $Y$ have no back-door path, so the unadjusted estimate is unbiased; but conditioning on $Z$ opens the collider path $X\leftarrow U_1\to Z\leftarrow U_2\to Y$ and **creates** bias. Being measured before treatment does not make a covariate safe to adjust for.`,
      idea: String.raw`This is conditioning on a collider (3.4, 3.9) in the service of causal estimation: before adjustment $U_1$ and $U_2$ are independent, so $X$ and $Y$ share nothing; after conditioning on a common effect they become dependent, and the dependence passes along $U_1\to X$ and $U_2\to Y$. In linear models the induced bias is the product of four path coefficients divided by variance terms, so it is usually modest unless the arrows into $Z$ are strong — one reason the practical advice is to adjust for pre-treatment covariates unless the M-structure is known and strong.`,
      caption: String.raw`Histograms of the estimated effect of $X$ over 300 simulated studies: without $Z$ (blue) and adjusting for $Z$ (red); the green line is the true effect. Drag the strength of the two arrows into $Z$, or add an arrow $Z\to X$ (which makes $Z$ also a legitimate-looking confounder and creates the dilemma of real data). The readout gives the exact biases from the population covariance.`,
      deps: ['causal-4.3', 'causal-3.9'], refs: ['Hernán–Robins §18.2', 'Hernán–Robins §7.4'], tags: ['m-bias', 'collider'],
      credit: 'Greenland, 2003 (collider stratification and pre-treatment variables); name and sensitivity analysis: Ding & Miratrix, 2015',
      verify: true,
      scope: String.raw`Linear Gaussian illustration with unit-variance noise, unit-size arrows $U_1\to X$ and $U_2\to Y$. With the arrow $Z\to X$ switched on, $Z$ is no longer a pure collider and neither choice of adjustment set is unbiased.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Collider_(statistics)' },
      viz(v) {
        const names = [String.raw`$U_1$`, String.raw`$U_2$`, 'Z', 'X', 'Y'], pos = [[1.6, 5], [8.4, 5], [5, 5], [1.6, 1.3], [8.4, 1.3]];
        const sS = v.slider(String.raw`strength of $U_1\to Z$ and $U_2\to Z$`, 0, 2, 1, { step: 0.05 });
        const zS = v.slider(String.raw`extra arrow $Z\to X$`, 0, 1.5, 0, { step: 0.05 });
        const tS = v.slider('true effect of $X$ on $Y$', 0, 2, 1, { step: 0.1 });
        let seed = 1; v.button('new studies', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 6], equal: true, axes: false, height: 290, title: 'the M-shaped graph', minWidth: 260 });
        const sh = v.stage({ x: [-1, 3], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: String.raw`estimated effect of $X$`, ylabel: 'share of studies', title: '300 studies of 200 units', minWidth: 300 });
        const G = makeDag(v, sgr, { names, pos, edges: [[0, 2], [1, 2], [0, 3], [1, 4], [3, 4]], draggable: false, r: 18 });
        v.legend([['accent', 'unadjusted', { area: true }], ['red', 'adjusted for $Z$', { area: true }], ['green', 'true effect']]);
        const key = memo(); let info = {};
        v.render(() => {
          const s = sS.value, ez = zS.value, th = tS.value;
          const E = [[0, 2], [1, 2], [0, 3], [1, 4], [3, 4]]; if (ez > 0) E.push([2, 3]);
          const cf = (a, b) => (b === 2 ? s : a === 3 && b === 4 ? th : a === 2 && b === 3 ? ez : 1);
          const B = coefMatrix(5, E, cf), S = semCov(5, B, [1, 1, 1, 1, 1]);
          const bu = popReg(S, 4, [3])[0] - th, ba = popReg(S, 4, [3, 2])[0] - th;
          const R = key(`${s}|${ez}|${th}|${seed}`, () => {
            const u = new Float64Array(300), a = new Float64Array(300);
            for (let r = 0; r < 300; r++) { const X = sampleSEM(5, E, B, [1, 1, 1, 1, 1], 200, seed * 1000 + r); u[r] = sampleReg(X, 4, [3])[0]; a[r] = sampleReg(X, 4, [3, 2])[0]; }
            return { u, a };
          });
          const lo = th - 1.2, hi = th + 1.2; sh.setView([lo, hi], [0, 1]);
          histPanel(sh, [{ vals: Array.from(R.u), color: 'accent' }, { vals: Array.from(R.a), color: 'red' }], lo, hi, 40);
          sh.vline(th, { color: 'green', width: 2.4 });
          G.set({ nodes: names.map((c, i) => ({ id: i, label: c, x: pos[i][0], y: pos[i][1] })), edges: E.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none' });
          G.draw({ nodeColor: (id) => (id <= 1 ? 'muted' : id === 2 ? 'red' : id === 3 ? 'orange' : id === 4 ? 'green' : null), edgeColor: (e) => (e.from === 2 && e.to === 3 ? 'gold' : null) });
          sgr.text('hidden', 1.6, 5.8, { size: 11, color: 'muted' }); sgr.text('hidden', 8.4, 5.8, { size: 11, color: 'muted' });
          info = { bu, ba, mu: Array.from(R.u).reduce((a, b) => a + b, 0) / 300 - th, ma: Array.from(R.a).reduce((a, b) => a + b, 0) / 300 - th };
        });
        v.readout(() => `Exact bias without $Z$: **${fx(info.bu, 3)}** (simulated mean ${fx(info.mu, 3)}).  Exact bias adjusting for $Z$: **${fx(info.ba, 3)}** (simulated mean ${fx(info.ma, 3)}).\n` +
          `${zS.value === 0 ? 'With no arrow $Z\\to X$ the unadjusted estimate is unbiased and adjustment is what hurts; it hurts more the stronger $Z$ listens to its two causes.' : 'With $Z\\to X$ present there is a back-door path through $Z$ as well, so both choices are biased; only adjusting for $U_1$ or $U_2$ (hidden) would help.'}`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Concept', name: 'Bad controls: mediators and descendants',
      statement: String.raw`Adding a covariate to a regression is not harmless. Relative to the **total** effect of $X$ on $Y$: (i) controlling for a **mediator** $M$ ($X\to M\to Y$) removes the part of the effect that passes through it, estimating only the direct effect; (ii) controlling for a **descendant of the outcome** $D$ ($Y\to D$) partly conditions on $Y$ itself and biases the estimate toward zero; (iii) controlling for a **collider** $K$ of $X$ and $Y$ ($X\to K\leftarrow Y$) opens a path and biases it; (iv) controlling for a **proxy** $W$ of a confounder $L$ ($L\to W$) is helpful but incomplete. Which variables to include is decided by the graph and the back-door criterion, not by their predictive power or by whether they are measured before the outcome.`,
      idea: String.raw`Each rule is the back-door criterion (4.3) read off one case: a mediator and a descendant of $X$ break condition (i) by blocking or contaminating the causal path; a collider breaks condition (ii) by opening a path that was closed (3.4); a descendant of a confounder only partly blocks the path it sits on. Everything here is exact for linear Gaussian models, where the coefficient on $X$ is a ratio of path sums.`,
      caption: String.raw`The graph at left has confounder $L$, mediator $M$, a child $D$ of the outcome, a collider $K$, and a proxy $W$ of $L$. Switch variables in and out of the regression: the black bar is the estimated coefficient of $X$ for your choice; the grey bars below are every standard choice for comparison. Green line: true total effect; blue line: direct effect only.`,
      deps: ['causal-4.3'], refs: ['Hernán–Robins §18.2'], tags: ['bad controls', 'mediation'],
      credit: 'Angrist & Pischke, 2009 (“bad control”); Cinelli, Forney & Pearl, 2022 (A crash course in good and bad controls)',
      verify: true,
      scope: String.raw`Linear Gaussian model with unit-variance noise; the coefficients are exact population values, not simulation. “Bad” and “good” are relative to the target: total effect here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confounding' },
      viz(v) {
        const names = ['X', 'Y', 'L', 'M', 'D', 'K', 'W'], pos = [[1.1, 2.4], [8.9, 2.4], [5, 5.4], [5, 2.4], [8.9, 5.4], [5, 0.7], [1.5, 5.4]];
        const E = [[2, 0], [2, 1], [0, 3], [3, 1], [0, 1], [1, 4], [0, 5], [1, 5], [2, 6]];
        const gS = v.slider(String.raw`strength of arrows into $D$, $K$`, 0, 1.5, 0.8, { step: 0.05 });
        const T = {
          L: v.toggle('adjust for $L$ (confounder)', true), M: v.toggle('adjust for $M$ (mediator)', false), D: v.toggle('adjust for $D$ (child of $Y$)', false),
          K: v.toggle('adjust for $K$ (collider)', false), W: v.toggle('adjust for $W$ (proxy of $L$)', false),
        };
        const idx = { L: 2, M: 3, D: 4, K: 5, W: 6 };
        const sgr = v.stage({ x: [0, 10], y: [0, 6.4], equal: true, axes: false, height: 320, title: 'the graph', minWidth: 270 });
        const sb = v.stage({ x: [-0.2, 1.8], y: [0, 9], axes: 'box', gutter: true, height: 320, xlabel: String.raw`coefficient of $X$ in the regression`, title: 'what each choice of controls estimates', minWidth: 330 });
        sb.setTicks(null, []);
        const G = makeDag(v, sgr, { names, pos, edges: E, draggable: false, r: 16 });
        const mk = (g) => { const cf = { '0>3': 0.9, '3>1': 0.7, '0>1': 0.5, '2>0': 0.8, '2>1': 0.8, '1>4': g, '0>5': g, '1>5': g, '2>6': 0.9 }; return (a, b) => cf[`${a}>${b}`] ?? 0; };
        let info = {};
        v.render(() => {
          const g = gS.value, B = coefMatrix(7, E, mk(g)), S = semCov(7, B, new Array(7).fill(1)), total = totalEffect(7, B, 1, 0), direct = B[1][0];
          const est = (set) => popReg(S, 1, [0, ...set])[0];
          const rows = [['nothing', []], ['L', [2]], ['L, W', [2, 6]], ['L, M', [2, 3]], ['L, D', [2, 4]], ['L, K', [2, 5]], ['everything', [2, 3, 4, 5, 6]]];
          const cur = Object.keys(T).filter((k) => T[k].value).map((k) => idx[k]);
          sb.setView([-0.2, 1.8], [0, rows.length + 1.8]);
          rows.forEach(([lab_, set], i) => {
            const y = rows.length - i, val = est(set);
            sb.rect(0, y - 0.32, val, y + 0.32, { fill: 'muted', fillAlpha: 0.3, color: 'muted' });
            sb.text(lab_, 1.78, y, { size: 11, color: 'muted', align: 'right' });
          });
          const c = est(cur), y0 = rows.length + 1.05;
          sb.rect(0, y0 - 0.38, c, y0 + 0.38, { fill: 'ink', fillAlpha: 0.55, color: 'ink' }); sb.text('your choice', 1.78, y0, { size: 11.5, color: 'ink', align: 'right', weight: 700 });
          sb.vline(total, { color: 'green', width: 2.4 }); sb.vline(direct, { color: 'accent', width: 2, dash: true });
          G.draw({ nodeColor: (id) => (id === 0 ? 'orange' : id === 1 ? 'green' : null), nodeFill: (id) => (cur.includes(id) ? 'accent' : null) });
          info = { c, total, direct, cur };
        });
        v.legend([['green', 'true total effect'], ['accent', 'direct effect only', { dash: true }], ['muted', 'standard choices', { area: true }]]);
        v.readout(() => `Controls: ${info.cur.length ? '$' + info.cur.map((i) => names[i]).join(',') + '$' : 'none'}.  Estimate **${fx(info.c, 3)}**; total effect **${fx(info.total, 3)}**, direct effect ${fx(info.direct, 3)}. ` +
          `Error against the total effect: **${fx(info.c - info.total, 3)}**.`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Phenomenon', name: 'Z-bias: adjusting for a cause of treatment only',
      statement: String.raw`Suppose an unmeasured confounder $U$ of $X$ and $Y$ makes the unadjusted estimate biased. A further variable $Z$ that causes $X$ but affects $Y$ only through $X$ (an instrument, 6.1) is not a confounder, yet adjusting for it **increases** the bias: in a linear model with $X=aZ+\beta U+e_X$ the bias of the unadjusted coefficient is $\dfrac{\gamma\beta}{a^2+\beta^2+1}$, while after adjusting for $Z$ it is $\dfrac{\gamma\beta}{\beta^2+1}$, larger by the factor $1+\dfrac{a^2}{\beta^2+1}$. The stronger $Z$ is, the worse the amplification.`,
      idea: String.raw`Regression uses only the variation in $X$ that $Z$ does not explain. A cause of $X$ lends *clean* variation, uncorrelated with the confounder, to $X$; adjusting for $Z$ throws that clean variation away and leaves the residual variation of $X$, in which the confounded part $\beta U$ makes up a larger share. Nothing was gained and the signal-to-confounding ratio fell. When $Z$ also affects $Y$ directly it is a confounder and adjusting is right again.`,
      caption: String.raw`The curves plot the exact bias of the estimated effect of $X$ against the strength $a$ of $Z\to X$: unadjusted (blue, falling) and adjusted for $Z$ (red, flat at its larger value). Dots: 40 simulated studies of 400 units each at the current $a$. Raise the confounding, or give $Z$ a direct arrow to $Y$ to see adjustment become correct.`,
      deps: ['causal-4.3'], refs: ['Hernán–Robins §18.2'], tags: ['bias amplification', 'instrument'],
      credit: 'Bhattacharya & Vogt, 2007; Wooldridge, 2009; Pearl, 2010 (UAI) named and generalized the bias-amplification result',
      scope: String.raw`Linear Gaussian illustration with unit-variance noise and true effect 1; with a nonlinear model the amplification can also occur but the formulas differ. Requires $Z$ to be associated with $X$ only through the arrow shown.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Instrumental_variables_estimation' },
      viz(v) {
        const names = ['U', 'Z', 'X', 'Y'], pos = [[5, 5.2], [1.3, 1.4], [4.6, 1.4], [8.7, 1.4]];
        const aS = v.slider(String.raw`strength $a$ of $Z\to X$`, 0, 3, 1.5, { step: 0.05 });
        const bS = v.slider(String.raw`confounding $\beta$ of $U\to X$`, 0, 2, 0.8, { step: 0.05 });
        const gS = v.slider(String.raw`confounding $\gamma$ of $U\to Y$`, 0, 2, 1, { step: 0.05 });
        const zS = v.slider(String.raw`direct arrow $Z\to Y$`, 0, 1.5, 0, { step: 0.05 });
        let seed = 1; v.button('resample', () => { seed++; });
        const sgr = v.stage({ x: [0, 10], y: [0.2, 6.2], equal: true, axes: false, height: 290, title: 'the graph', minWidth: 250 });
        const sp = v.stage({ x: [0, 3], y: [-0.1, 1], axes: 'box', gutter: true, height: 290, xlabel: String.raw`strength $a$ of $Z\to X$`, ylabel: 'bias of the estimate', title: 'bias against the strength of Z', minWidth: 320 });
        const G = makeDag(v, sgr, { names, pos, edges: [[0, 2], [0, 3], [1, 2], [2, 3]], draggable: false, r: 18 });
        v.legend([['accent', 'unadjusted (exact)'], ['red', 'adjusted for $Z$ (exact)'], ['ink', 'simulated studies', { dot: true }]]);
        const exact = (a, b, g, z) => {
          const E = [[0, 2], [0, 3], [1, 2], [2, 3]]; if (z > 0) E.push([1, 3]);
          const cf = (p, q) => (p === 0 && q === 2 ? b : p === 0 && q === 3 ? g : p === 1 && q === 2 ? a : p === 2 && q === 3 ? 1 : z);
          const B = coefMatrix(4, E, cf), S = semCov(4, B, [1, 1, 1, 1]);
          return { u: popReg(S, 3, [2])[0] - 1, a: popReg(S, 3, [2, 1])[0] - 1, E, B };
        };
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, g = gS.value, z = zS.value;
          const cu = [], ca = []; for (let i = 0; i <= 60; i++) { const t = 3 * i / 60, e = exact(t, b, g, z); cu.push([t, e.u]); ca.push([t, e.a]); }
          const mx = Math.max(0.2, ...cu.map((p) => Math.abs(p[1])), ...ca.map((p) => Math.abs(p[1]))) * 1.15;
          sp.setView([0, 3], [-mx * 0.15, mx]);
          sp.hline(0, { color: 'grid', width: 1.2 });
          sp.path(cu, { color: 'accent', width: 2.6 }); sp.path(ca, { color: 'red', width: 2.6 });
          const e0 = exact(a, b, g, z); sp.vline(a, { color: 'gold', dash: true, width: 1.4 });
          sp.dot(a, e0.u, { r: 6, color: 'accent' }); sp.dot(a, e0.a, { r: 6, color: 'red' });
          const rr = rng(seed * 31 + 7);
          for (let t = 0; t < 40; t++) { const X = sampleSEM(4, e0.E, e0.B, [1, 1, 1, 1], 400, seed * 500 + t); const ju = (rr() - 0.5) * 0.08; sp.dot(a - 0.06 + ju, sampleReg(X, 3, [2])[0] - 1, { r: 2.2, color: 'ink', alpha: 0.6 }); sp.dot(a + 0.06 + ju, sampleReg(X, 3, [2, 1])[0] - 1, { r: 2.2, color: 'ink', alpha: 0.6 }); }
          G.set({ nodes: names.map((c, i) => ({ id: i, label: c, x: pos[i][0], y: pos[i][1] })), edges: e0.E.map(([p, q]) => ({ from: p, to: q })), directed: true, layout: 'none' });
          G.draw({ nodeColor: (id) => (id === 0 ? 'muted' : id === 2 ? 'orange' : id === 3 ? 'green' : null), edgeColor: (e) => (e.from === 1 && e.to === 3 ? 'gold' : null) });
          info = { u: e0.u, ad: e0.a, a, b, g, z };
        });
        v.readout(() => `At $a=${v.fix(info.a, 2)}$: bias unadjusted **${fx(info.u, 3)}**, adjusted for $Z$ **${fx(info.ad, 3)}**` +
          `${info.z === 0 ? ` — amplification factor ${v.fix(info.ad / info.u, 2)} (formula $1+a^2/(\\beta^2+1)=${v.fix(1 + info.a ** 2 / (info.b ** 2 + 1), 2)}$ when the unit-variance noise assumptions hold).` : '. With a direct arrow $Z\\to Y$, $Z$ is a confounder and adjusting for it removes bias.'}`);
      },
    },
  ],
};
