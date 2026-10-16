// Systems Biology — Chapter 1: Transcription networks: basic concepts (after U. Alon, An Introduction to Systems Biology)
import { LN2, hillAct, hillRep, relax, trajectory, rk4Path, crossing, birthDeath, stepAt, TFS, ECOLI_EDGES, findFFLs } from './ch01.shared.js';

export default {
  collection: 'sysbio',
  chapter: 1,
  title: 'Transcription networks: basic concepts',
  summary: String.raw`A cell senses its world through transcription factors that switch genes on and off, and the resulting web of interactions is a directed graph. Each edge carries an input function — usually a Hill curve or a logic gate — and each gene follows production–degradation dynamics whose response time is set by the removal rate, in a growing bacterium mostly by dilution. Comparing real networks with randomized ones reveals network motifs, small circuits that occur far more often than chance, which the next chapters dissect.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Transcription networks as directed graphs',
      statement: String.raw`A **transcription network** has a node for every gene (or operon) and a directed edge $X\to Y$ whenever the protein product of $X$ is a transcription factor that binds the promoter of $Y$ and changes its transcription rate. Each edge carries a sign — **activation** ($+$) or **repression** ($-$) — and an *input function* (1.2–1.4) giving the strength of the effect. An edge from a gene to itself is **autoregulation**.

Scope: this is the "who regulates whom" skeleton; it ignores the signals (small molecules, phosphorylation) that switch a factor between active and inactive forms, and it treats each edge as direct DNA binding.`,
      idea: String.raw`A transcription factor $X$ is a protein; when active it binds short DNA sites near the promoter of $Y$ and raises or lowers the rate at which RNA polymerase starts transcripts. Listing every such pair produces a directed graph, and graph language (in-degree, out-degree, paths, cycles) becomes a language for regulation: a node with large out-degree is a global regulator such as CRP, a node with large in-degree integrates many signals. In *E. coli* the network is sparse and mostly shallow, and about half of the transcription factors regulate themselves (Shen-Orr et al. 2002) — the first hint that particular small subgraphs are favoured (1.9).`,
      caption: String.raw`A curated subset of well-known *E. coli* interactions (about 50 edges; green = activation, dashed red = repression). **Click a gene**: the genes it regulates turn green-rimmed (its outputs), the genes that regulate it turn orange-rimmed (its inputs), and everything else fades. Drag nodes to rearrange. Turn on *feed-forward loops* to light up every triple $X\to Y\to Z$, $X\to Z$ in this subset.`,
      deps: [],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['networks', 'transcription'],
      credit: 'Shen-Orr, Milo, Mangan & Alon, Nature Genetics 2002 (E. coli network analysis)',
      scope: String.raw`The drawn network is an *illustrative subset* written from memory of textbook systems (lac, ara, mal, gal, SOS, arginine, tryptophan, anaerobic respiration, flagella), not RegulonDB. The full data set analysed by Shen-Orr et al. had 577 interactions among 424 operons and 116 transcription factors.`,
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 7], equal: true, axes: false, height: 500, full: true });
        const tfset = new Set(TFS);
        const ids = []; for (const [a, b] of ECOLI_EDGES) { if (!ids.includes(a)) ids.push(a); if (!ids.includes(b)) ids.push(b); }
        const edges = ECOLI_EDGES.map(([a, b, sg]) => ({ from: a, to: b, sign: sg, color: sg > 0 ? 'green' : 'red', dash: sg < 0 ? [5, 3] : undefined }));
        const G = v.graph(s, { directed: true, nodes: ids.map((id) => ({ id, label: id, shape: 'box' })), edges, layout: 'force', seed: 11, restarts: 8, iterations: 400, fontSize: 11, r: 9, shape: 'box' });
        let sel = 'CRP';
        G.onClick = undefined;
        const showFFL = v.toggle('highlight feed-forward loops', false);
        const showSign = v.toggle('write the sign on every edge', false);
        const ffls = findFFLs(ids.length, ECOLI_EDGES.map(([a, b, sg]) => [ids.indexOf(a), ids.indexOf(b), sg]));
        const fflEdges = new Set(), fflNodes = new Set();
        for (const [x, y, z] of ffls) { fflNodes.add(ids[x]); fflNodes.add(ids[y]); fflNodes.add(ids[z]); fflEdges.add(ids[x] + '>' + ids[y]); fflEdges.add(ids[y] + '>' + ids[z]); fflEdges.add(ids[x] + '>' + ids[z]); }
        s.onClick((x, y) => { const h = G.hitNode(x, y); if (h) { sel = h.id; v.invalidate(); } });
        let laid = false;
        v.render(() => {
          if (!laid) { laid = true; G.layout('force', { seed: 11, restarts: 8, iterations: 400 }); }
          const outs = new Set(G.edges.filter((e) => e.from === sel && e.to !== sel).map((e) => e.to));
          const ins = new Set(G.edges.filter((e) => e.to === sel && e.from !== sel).map((e) => e.from));
          const dimN = G.nodes.filter((n) => n.id !== sel && !outs.has(n.id) && !ins.has(n.id)).map((n) => n.id);
          const dimE = G.edges.filter((e) => e.from !== sel && e.to !== sel);
          G.draw({
            nodeColor: (id) => (id === sel ? 'gold' : tfset.has(id) ? 'accent' : 'muted'),
            nodeFill: (id) => (id === sel ? 'gold' : null),
            nodeRing: (id) => (id === sel ? null : outs.has(id) ? 'green' : ins.has(id) ? 'orange' : showFFL.value && fflNodes.has(id) ? 'purple' : null),
            dim: showFFL.value ? [] : [...dimN, ...dimE],
            edgeWidth: (e) => (showFFL.value && fflEdges.has(e.from + '>' + e.to) ? 3.2 : e.from === sel || e.to === sel ? 2.6 : 1.5),
            edgeColor: (e) => (showFFL.value && fflEdges.has(e.from + '>' + e.to) ? 'purple' : null),
            edgeLabel: showSign.value ? (e) => (e.sign > 0 ? '+' : '−') : undefined,
          });
        });
        v.legend([['accent', 'transcription factor (gene encoding one)'], ['muted', 'target operon'], ['green', 'activation edge ( + )'], ['red', 'repression edge ( − )', { dash: true }]]);
        v.readout(() => {
          const outs = G.edges.filter((e) => e.from === sel && e.to !== sel), ins = G.edges.filter((e) => e.to === sel && e.from !== sel);
          const auto = G.edges.find((e) => e.from === sel && e.to === sel);
          const nTF = TFS.length, nAuto = TFS.filter((t) => G.edges.some((e) => e.from === t && e.to === t)).length;
          return `**${sel}**: out-degree ${outs.length} (${outs.filter((e) => e.sign > 0).length} activated, ${outs.filter((e) => e.sign < 0).length} repressed), in-degree ${ins.length}${auto ? `, autoregulation (${auto.sign > 0 ? 'positive' : 'negative'})` : ', no autoregulation'}.\nWhole subset: ${G.nodes.length} nodes, ${G.edges.length} edges, ${nTF} transcription factors of which ${nAuto} regulate themselves — and ${ffls.length} feed-forward loops. (Full E. coli network, Shen-Orr 2002: roughly half of all factors autoregulate; 34 coherent + 6 incoherent loops.)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'Gene input functions: activators and repressors',
      statement: String.raw`The **input function** of a gene gives its production rate $\beta$ as a function of the concentration $x$ of the active regulator that binds its promoter. If binding is fast compared with everything downstream, the promoter is occupied with equilibrium probability $P(x)$, and (for non-cooperative binding of one site, dissociation constant $K$)

- an **activator** gives $\beta(x) = \beta_{\max}\,\dfrac{x}{K+x}$ (RNA polymerase is recruited when $X$ is bound);
- a **repressor** gives $\beta(x) = \beta_{\max}\,\dfrac{1}{1+x/K}$ (bound $X$ blocks polymerase).

At the same $K$ the two curves are mirror images, $\beta_{\rm act}(x) = \beta_{\rm rep}(K^2/x)$, and $\beta_{\rm act}+\beta_{\rm rep}=\beta_{\max}$. A leaky promoter adds a basal rate $\beta_0$.`,
      idea: String.raw`Think of an ensemble of promoters, each either free or holding a regulator. Mass action for $X + \text{DNA} \rightleftharpoons X{\cdot}\text{DNA}$ gives the bound fraction $x/(K+x)$ with $K=k_{\rm off}/k_{\rm on}$ (the Michaelis–Menten/Hill form of mathbio-5.8 with $n=1$). An activator makes transcription proportional to the bound fraction, a repressor proportional to the free fraction $1-x/(K+x)$. Because $K$ is the concentration at half occupancy, activation and repression are reflections of each other about $x=K$ on a logarithmic axis.`,
      caption: String.raw`Slide the regulator concentration $x/K$. Each small box in the upper panel is one cell's promoter, with a fixed random draw: it holds a regulator when that draw is below the bound probability $P(x)$, so boxes fill up in the same order as $x$ rises. The lower panel plots promoter activity against $x$ on a log axis; the dashed link joins $x$ on the activator curve to its mirror point $K^2/x$ on the repressor curve (same height). Presets use constants fitted by Setty et al. (2003) for the *lac* promoter; raise $n$ to see cooperative sharpening and add leakiness to lift both floors.`,
      deps: ['sysbio-1.1', 'mathbio-5.8'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['input function', 'regulation'],
      credit: 'Jacob & Monod 1961 (repressor); Hill 1910 (binding curve)',
      scope: String.raw`Quasi-equilibrium binding of the regulator to its operator, one regulator species, steady state of the promoter. Presets $K_{\rm cAMP}\approx1.8$ mM, $n=2$ and $K_{\rm IPTG}\approx1.2\,\mu$M, $m=4$ are the fit values reported by Setty et al. (PNAS 2003) for *E. coli* in a GFP-reporter experiment; they describe cAMP acting on CRP and IPTG acting on LacI, not the free regulator itself.`,
      viz(v) {
        const PRE = { generic: { n: 1, K: 1, unit: 'K' }, crp: { n: 2, K: 1.8, unit: 'mM cAMP' }, laci: { n: 4, K: 1.2, unit: 'µM IPTG' } };
        const preset = v.select('constants', [{ value: 'generic', label: 'generic ($n=1$)' }, { value: 'crp', label: 'CRP·cAMP, activator' }, { value: 'laci', label: 'IPTG → LacI, derepression' }], 'generic', { onChange: (p) => { n.set(PRE[p].n); } });
        const n = v.slider('Hill coefficient $n$', 1, 6, 1, { step: 0.1 });
        const lx = v.slider('regulator $\\log_{10}(x/K)$', -2, 2, -0.3, { step: 0.01, fmt: (t) => v.fix(10 ** t, 2) });
        const leak = v.slider('leakiness $\\beta_0/\\beta_{\\max}$', 0, 0.4, 0, { step: 0.01 });
        const C = v.stage({ x: [0, 10], y: [0, 3.6], axes: false, height: 175, minWidth: 300, title: 'one box = one cell’s promoter, fixed random draw', full: true });
        const P = v.stage({ x: [0.01, 100], xlog: true, y: [0, 1.05], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'regulator concentration x / K', ylabel: 'promoter activity β / β_max' });
        const rr = v.rng(5); const U = Array.from({ length: 30 }, () => rr());
        const act = (x) => leak.value + (1 - leak.value) * hillAct(x, 1, n.value);
        const rep = (x) => leak.value + (1 - leak.value) * hillRep(x, 1, n.value);
        v.render(() => {
          const x = 10 ** lx.value, pb = hillAct(x, 1, n.value);
          // cartoon: 30 promoters in 2 rows of 15 (x from 0.3 to 9.7)
          for (let i = 0; i < 30; i++) {
            const cx = 0.45 + (i % 15) * 0.65, cy = i < 15 ? 2.55 : 0.85, bound = U[i] < pb;
            C.rect(cx - 0.24, cy - 0.32, cx + 0.24, cy + 0.32, { fill: 'faint', fillAlpha: 0.25, color: 'muted', radius: 3 });
            C.line(cx - 0.3, cy - 0.32, cx + 0.3, cy - 0.32, { color: 'ink', width: 2 });
            if (bound) C.dot(cx, cy + 0.06, { r: 7, color: 'accent' });
            else C.dot(cx, cy + 0.06, { r: 7, color: 'muted', hollow: true });
          }
          C.corner(`bound: ${Math.round(pb * 30)} of 30 (expected ${v.fix(pb * 30, 1)})`, 'tr', { plate: true });
          const pfx = (f) => (X) => f(X);
          P.fn(pfx(act), { color: 'green', width: 2.6 });
          P.fn(pfx(rep), { color: 'red', width: 2.6 });
          P.vline(1, { color: 'muted', dash: true });
          P.hline(1 / 2 * (1 + leak.value), { color: 'faint', dash: true });
          const xm = 1 / x;
          P.segment([x, act(x)], [xm, rep(xm)], { color: 'gold', dash: true, width: 1.5 });
          P.dot(x, act(x), { r: 6, color: 'green' });
          P.dot(xm, rep(xm), { r: 6, color: 'red' });
          P.dot(x, rep(x), { r: 5, color: 'red', hollow: true });
          P.tex(String.raw`\text{activator}`, 14, act(14), { color: 'green', dy: 18 });
          P.tex(String.raw`\text{repressor}`, 0.07, rep(0.07), { color: 'red', dy: 18 });
          P.text('x = K', 1, 0.04, { size: 11, color: 'muted', dx: 14, baseline: 'bottom' });
        });
        v.legend([['green', 'activator'], ['red', 'repressor'], ['gold', 'mirror pair x ↔ K²/x', { dash: true }]]);
        v.readout(() => {
          const x = 10 ** lx.value, K = PRE[preset.value].K, un = PRE[preset.value].unit;
          const a = act(x), r = rep(1 / x), s = act(x) + rep(x);
          return `$x = ${v.fix(x, 2)}\\,K$${preset.value === 'generic' ? '' : ` = ${v.fix(x * K, 2)} ${un}`}: activator $${v.fix(a, 3)}$, repressor $${v.fix(rep(x), 3)}$; mirror $\\beta_{\\rm rep}(K^2/x) = ${v.fix(r, 3)}$ ${Math.abs(a - r) < 1e-9 ? '= $\\beta_{\\rm act}(x)$ ✓' : '≠'} ; sum $\\beta_{\\rm act}+\\beta_{\\rm rep} = ${v.fix(s, 3)}$ (= $1+\\beta_0/\\beta_{\\max}$ = ${v.fix(1 + leak.value, 3)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Model',
      name: 'Hill input function',
      statement: String.raw`When binding is cooperative, the input function of an activator and of a repressor take the **Hill form**
$$f_{\rm act}(x)=\beta\,\frac{(x/K)^n}{1+(x/K)^n},\qquad f_{\rm rep}(x)=\beta\,\frac{1}{1+(x/K)^n},$$
with maximal rate $\beta$, activation threshold $K$ (the concentration giving half-maximal activity, whatever $n$ is) and Hill coefficient $n\ge 1$. The activity rises from 10% to 90% of $\beta$ as $x$ goes from $x_{10}=K\,9^{-1/n}$ to $x_{90}=K\,9^{1/n}$, an input range of $x_{90}/x_{10} = 81^{1/n}$.`,
      idea: String.raw`If $n$ regulator molecules must bind together (all-or-none cooperativity), mass action gives bound probability $x^n/(K^n+x^n)$. Setting $f=0.1$ or $0.9$ gives $(x/K)^n = 1/9$ or $9$, and dividing yields $81^{1/n}$. Larger $n$ squeezes the transition into a narrower band, so the curve tends to a step function at $x=K$ as $n\to\infty$; $n=1$ needs an 81-fold change of the input. Measured promoters often have effective $n$ between 1 and 4: Setty et al. (2003) fitted $n=2\pm0.4$ for cAMP acting through CRP and $m=4\pm0.6$ for IPTG acting on LacI.`,
      caption: String.raw`Slide the Hill coefficient $n$ and the threshold $K$. The orange band marks the 10%–90% input range; it narrows as $n$ grows, on the linear axis (left) and on the log axis (right) where its width is the same for any $K$. Switch on the dotted curves to compare with the shape of the Setty et al. fits ($n=2$ for CRP, $n=4$ for LacI/IPTG), drawn with the same $K$.`,
      deps: ['sysbio-1.2', 'mathbio-5.8'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['Hill function', 'cooperativity'],
      credit: 'A. V. Hill, 1910',
      scope: String.raw`Valid when the cooperative binding step is fast and effectively all-or-none; for real promoters $n$ is an *effective* exponent fitted to data (it need not be an integer), and the function is the steady-state response to a constant concentration of the active regulator.`,
      viz(v) {
        const n = v.slider('Hill coefficient $n$', 1, 10, 2, { step: 0.1 });
        const lK = v.slider('threshold $K$', 0.3, 2.5, 1, { step: 0.01 });
        const cmp = v.toggle('compare with measured $n$ (Setty 2003)', false);
        const L = v.stage({ x: [0, 4], y: [0, 1.05], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'regulator x (arbitrary units)', ylabel: 'f / β' });
        const R = v.stage({ x: [0.03, 30], xlog: true, y: [0, 1.05], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'regulator x (log scale)', ylabel: 'f / β' });
        v.render(() => {
          const N = n.value, K = lK.value, f = (x) => hillAct(x, K, N);
          const x10 = K * 9 ** (-1 / N), x90 = K * 9 ** (1 / N);
          for (const S of [L, R]) {
            S.vband(x10, x90, { color: 'orange', alpha: 0.16 });
            S.hline(0.1, { color: 'faint', dash: true }); S.hline(0.9, { color: 'faint', dash: true });
            S.vline(K, { color: 'muted', dash: true });
            if (cmp.value) { S.fn((x) => hillAct(x, K, 2), { color: 'teal', width: 1.8, dash: [2, 3] }); S.fn((x) => hillAct(x, K, 4), { color: 'purple', width: 1.8, dash: [2, 3] }); }
            S.fn(f, { color: 'accent', width: 3 });
            S.dot(K, 0.5, { r: 6, color: 'gold' });
            S.dot(x10, 0.1, { r: 5, color: 'orange' }); S.dot(x90, 0.9, { r: 5, color: 'orange' });
          }
          L.tex('K', K, 0.03, { dx: 8, color: 'muted' });
        });
        v.legend([['accent', 'Hill function'], ['orange', '10%–90% input range', { area: true }], ['gold', 'half-maximum at K', { dot: true }]]);
        v.readout(() => {
          const N = n.value, K = lK.value, f = (x) => hillAct(x, K, N);
          const x10 = K * 9 ** (-1 / N), x90 = K * 9 ** (1 / N), ratio = x90 / x10;
          // numerical check: invert f by bisection
          let lo = 1e-9, hi = 1e3; for (let i = 0; i < 100; i++) { const m = Math.sqrt(lo * hi); if (f(m) < 0.9) lo = m; else hi = m; }
          const x90n = lo; lo = 1e-9; hi = 1e3; for (let i = 0; i < 100; i++) { const m = Math.sqrt(lo * hi); if (f(m) < 0.1) lo = m; else hi = m; }
          const x10n = lo;
          return `$x_{10}=${v.fix(x10, 3)}$, $x_{90}=${v.fix(x90, 3)}$; ratio $x_{90}/x_{10} = ${v.fix(ratio, 2)}$ = $81^{1/n}$ (numerical root-finding: ${v.fix(x90n / x10n, 2)}). Slope at $K$: $n/4K = ${v.fix(N / (4 * K), 2)}$. $n=1$: 81-fold; $n=2$: 9-fold; $n=4$: 3-fold.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Logic input functions',
      statement: String.raw`A promoter often listens to two regulators $X$ and $Y$. With steep (near step-like) single-input functions, the combined input function is then a **logic gate** of the two on/off signals $a=H_X(x)$, $b=H_Y(y)$:

- **AND**: $f\approx a\,b$ — transcription needs both signals;
- **OR**: $f\approx a+b-ab$ — either signal suffices;
- **SUM-like**: $f\approx (a+b)/2$ — each signal alone gives partial expression (several plateaus).

Real promoters need not be pure gates: the *lac* promoter of *E. coli*, driven by CRP·cAMP and relieved from LacI by IPTG, shows four plateaus (relative activity 0.07, 0.12, 0.29 and 1.0) and four thresholds.`,
      idea: String.raw`Two independent regulatory events multiply when both must happen (AND, as in RNA polymerase needing a recruiter *and* a free operator) and add or combine when each can switch the gene on alone (OR/SUM). With Hill-type single inputs $a, b\in[0,1]$ the surface $f(a,b)$ is a smooth interpolation between the four corners "neither", "only $X$", "only $Y$" and "both". What distinguishes a gate is the pattern of those four corner values: $(0,0,0,1)$ for AND, $(0,1,1,1)$ for OR. Setty et al. (2003) measured the corners of the *lac* promoter and found $(0.07,\,0.12,\,0.29,\,1)$.`,
      caption: String.raw`Axes: cAMP (activates CRP) and IPTG (inactivates LacI), both on log scales. Choose a gate; the colour is promoter activity. The contour is a digital threshold $\theta$; click the plot to read a point and see its truth-table row. The right panel shows the IPTG dose–response at low and high cAMP: in the *lac* model the two plateaus are 0.29 and 1 (0.07 and 0.12 without IPTG), far from an ideal AND, whose low-cAMP curve would stay at 0.`,
      deps: ['sysbio-1.3'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['logic', 'input function'],
      credit: 'Setty, Mayo, Surette & Alon, PNAS 2003',
      scope: String.raw`The "lac" surface is a bilinear interpolation, in the two Hill-activated signals, between the four plateau heights quoted by Setty et al. (GFP assay; $n=2$, $K_{\rm cAMP}\approx1.8$ mM, $m=4$, $K_{\rm IPTG}\approx1.2\,\mu$M). Their own closed-form model has more parameters; this is a faithful reduction of the corner values, not their fit of the intermediate region.`,
      viz(v) {
        const gate = v.select('promoter', [{ value: 'and', label: 'AND' }, { value: 'or', label: 'OR' }, { value: 'sum', label: 'SUM-like' }, { value: 'lac', label: 'lac (Setty)' }], 'lac');
        const theta = v.slider('digital threshold $\\theta$', 0.05, 0.95, 0.5, { step: 0.01 });
        const KX = 1.8, KY = 1.2, nX = 2, nY = 4;
        const A = (x) => hillAct(x, KX, nX), D = (y) => hillAct(y, KY, nY);
        const corners = [0.07, 0.12, 0.29, 1]; // (low,low) (cAMP only) (IPTG only) (both)
        const F = (x, y, g = gate.value) => {
          const a = A(x), d = D(y);
          if (g === 'and') return a * d;
          if (g === 'or') return a + d - a * d;
          if (g === 'sum') return (a + d) / 2;
          return corners[0] * (1 - a) * (1 - d) + corners[1] * a * (1 - d) + corners[2] * (1 - a) * d + corners[3] * a * d;
        };
        const S = v.stage({ x: [0.03, 60], xlog: true, y: [0.03, 300], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.2, minWidth: 300, xlabel: 'cAMP (mM) — activates CRP', ylabel: 'IPTG (µM) — inactivates LacI', title: 'promoter activity' });
        const T = v.stage({ x: [0.03, 300], xlog: true, y: [0, 1.05], axes: 'box', gutter: true, height: 380, minWidth: 260, xlabel: 'IPTG (µM)', ylabel: 'promoter activity' });
        let pt = { x: 20, y: 40 };
        S.onClick((x, y) => { pt = { x, y }; v.invalidate(); });
        v.render(() => {
          const g = gate.value;
          S.heat((x, y) => F(x, y, g), { range: [0, 1], cmap: 'viridis', res: 220, key: g });
          S.contour((x, y) => F(x, y, g), [theta.value], { color: 'ink', width: 2.4 });
          S.vline(KX, { color: 'faint', dash: true }); S.hline(KY, { color: 'faint', dash: true });
          S.dot(pt.x, pt.y, { r: 7, color: 'gold' });
          T.fn((y) => F(0.05, y, g), { color: 'blue', width: 2.6 });
          T.fn((y) => F(50, y, g), { color: 'orange', width: 2.6 });
          T.hline(theta.value, { color: 'ink', dash: true, width: 1.4 });
          T.dot(pt.y, F(pt.x, pt.y, g), { r: 6, color: 'gold' });
        });
        v.legend([['blue', 'low cAMP (0.05 mM)'], ['orange', 'high cAMP (50 mM)'], ['ink', 'digital threshold', { dash: true }]]);
        v.readout(() => {
          const g = gate.value, f = F(pt.x, pt.y, g), xa = pt.x > KX ? 1 : 0, yb = pt.y > KY ? 1 : 0;
          const c = [F(0.03, 0.03, g), F(60, 0.03, g), F(0.03, 300, g), F(60, 300, g)];
          const dig = c.map((q) => (q > theta.value ? 1 : 0)).join('');
          const name = { '0001': 'AND', '0111': 'OR', '0000': 'always off', '1111': 'always on', '0011': 'IPTG only', '0101': 'cAMP only' }[dig] || 'other';
          return `corner plateaus (neither, cAMP only, IPTG only, both): ${c.map((q) => v.fix(q, 2)).join(', ')} → digital pattern ${dig} (${name}).\nclicked point: cAMP ${v.fix(pt.x, 2)} mM, IPTG ${v.fix(pt.y, 1)} µM → activity **${v.fix(f, 2)}**; inputs (cAMP, IPTG) = (${xa}, ${yb}) → output ${f > theta.value ? 1 : 0}.${g === 'lac' ? '\nSetty et al. measured plateaus 0.07, 0.12, 0.29, 1.0.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Production–degradation dynamics',
      statement: String.raw`The concentration $p$ of a gene product obeys
$$\frac{dp}{dt}=\beta-\alpha\,p,$$
where $\beta$ is the production rate (given by the input function, 1.2–1.4) and $\alpha$ the **removal rate**, the sum of active degradation and dilution by cell growth. For constant $\beta$ the solution is
$$p(t)=\frac{\beta}{\alpha}+\Big(p_0-\frac{\beta}{\alpha}\Big)e^{-\alpha t}:$$
the level relaxes exponentially to the steady state $p_{\rm st}=\beta/\alpha$. The steady state depends on both rates; the *speed* of approach depends only on $\alpha$.`,
      idea: String.raw`The equation is first-order linear (ode-1.x): production is a constant inflow, removal an outflow proportional to the level, so the deviation $p-\beta/\alpha$ decays as $e^{-\alpha t}$. Switching production off sends $p\to0$ with the same rate; switching it on from zero gives $p=p_{\rm st}(1-e^{-\alpha t})$. In a stochastic treatment the same two reactions $\varnothing\to p$ (rate $\beta$) and $p\to\varnothing$ (rate $\alpha p$) give a Poisson steady state with mean $\beta/\alpha$ and standard deviation $\sqrt{\beta/\alpha}$ (chapter 9).`,
      caption: String.raw`Choose a production schedule (always on, on-then-off, or pulsed) and slide $\beta$ and the doubling time (which sets $\alpha=\ln2/T_{\rm div}$ for a stable protein). **Top**: the exact solution (blue) together with the RK4 solution of the ODE (black dots) and six seeded Gillespie single-cell simulations (gold), inside a $\pm\sqrt{p_{\rm st}}$ band. **Bottom**: the rate balance — constant production $\beta$ against removal $\alpha p$ — with the point at the time shown by the cursor $t$.`,
      deps: ['sysbio-1.2'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['production-degradation', 'dynamics'],
      scope: String.raw`Deterministic mean-field description of a protein (or mRNA) whose production rate is set by the input function and whose removal is first order. Bursting, delays, saturating degradation and autoregulation break the simple form (chapters 2, 5, 9).`,
      viz(v) {
        const sched = v.select('production', [{ value: 'on', label: 'on from $t=0$' }, { value: 'off', label: 'on, then off' }, { value: 'pulse', label: 'pulsed' }], 'on');
        const lb = v.slider('production rate $\\beta$ (molecules / min)', 0.1, 30, 4, { log: true, sig: 2, step: 0.01 });
        const Td = v.slider('doubling time (min)', 20, 180, 60, { step: 1 });
        const tcur = v.slider('time cursor $t$', 0, 1, 0.35, { step: 0.001, fmt: () => '' });
        const cells = v.toggle('show 6 Gillespie cells', true);
        const B = v.button('new random cells', () => { seed += 1; });
        let seed = 7;
        const S1 = v.stage({ x: [0, 360], y: [0, 100], axes: 'box', gutter: true, height: 300, weight: 1.4, minWidth: 300, xlabel: 'time (min)', ylabel: 'protein (molecules per cell)' });
        const S2 = v.stage({ x: [0, 100], y: [0, 10], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'protein level p', ylabel: 'rate (molecules / min)' });
        let cache = { key: '', paths: [] };
        v.render(() => {
          const T = Td.value, a = LN2 / T, b = lb.value, tmax = 6 * T, pst = b / a;
          const sw = sched.value === 'on' ? [] : sched.value === 'off' ? [3 * T] : [2 * T, 4 * T];
          const bets = sched.value === 'on' ? [b] : sched.value === 'off' ? [b, 0] : [b, 0, b];
          const betaOf = (t) => bets[sw.filter((s) => t >= s).length];
          const traj = trajectory(betaOf, a, 0, tmax, T / 400);
          // RK4 check of the same ODE
          const rk = rk4Path((t, y) => [betaOf(t) - a * y[0]], [0], tmax, 4000, 10);
          let err = 0; for (const [t, y] of rk) { const i = Math.min(traj.length - 1, Math.round(t / (T / 400))); err = Math.max(err, Math.abs(y - traj[i][1])); }
          const hi = Math.max(10, (pst + 3 * Math.sqrt(pst)) * 1.15);
          S1.setView([0, tmax], [0, hi]);
          S2.setView([0, hi], [0, Math.max(b, a * hi) * 1.1]);
          S1.hline(pst, { color: 'green', dash: true, width: 1.5 });
          if (sched.value === 'on') S1.hband(Math.max(0, pst - Math.sqrt(pst)), pst + Math.sqrt(pst), { color: 'green', alpha: 0.12 });
          for (const s of sw) S1.vline(s, { color: 'faint', dash: true });
          if (cells.value) {
            const key = [b.toFixed(4), T, sched.value, seed].join('|');
            if (cache.key !== key) cache = { key, paths: Array.from({ length: 6 }, (_, k) => birthDeath(v.rng(seed * 100 + k), bets, sw, a, 0, tmax)) };
            for (const p of cache.paths) S1.path(p.flatMap((q, i) => (i ? [[q[0], p[i - 1][1]], q] : [q])), { color: 'gold', width: 1.2, alpha: 0.75 });
          }
          S1.path(traj, { color: 'accent', width: 3 });
          S1.dots(rk.filter((_, i) => i % 6 === 0), { r: 2, color: 'ink' });
          const tc = tcur.value * tmax, pc = traj[Math.min(traj.length - 1, Math.round(tc / (T / 400)))][1];
          S1.vline(tc, { color: 'muted', dash: true }); S1.dot(tc, pc, { r: 6, color: 'accent' });
          // rate balance
          S2.line(0, betaOf(tc), hi, betaOf(tc), { color: 'green', width: 3 });
          S2.line(0, 0, hi, a * hi, { color: 'red', width: 3 });
          S2.dot(pc, a * pc, { r: 7, color: 'accent' });
          if (betaOf(tc) > 0) S2.dot(pst, a * pst, { r: 6, color: 'gold', hollow: true, width: 2 });
          S2.arrow(pc, a * pc * 0 + (betaOf(tc) + a * pc) / 2, pc, a * pc, { color: 'muted', head: 6 });
          cache.err = err;
        });
        v.legend([['accent', 'ODE solution (exact)'], ['ink', 'RK4', { dot: true }], ['gold', 'Gillespie cells'], ['green', 'production β / steady state'], ['red', 'removal αp']]);
        v.readout(() => {
          const T = Td.value, a = LN2 / T, b = lb.value, pst = b / a;
          return `$\\alpha=\\ln2/T_{\\rm div}=${v.fix(a, 4)}\\,\\text{min}^{-1}$, steady state $\\beta/\\alpha = ${v.fix(pst, 1)}$ molecules (Poisson spread ±${v.fix(Math.sqrt(pst), 1)}); half-time of approach $\\ln2/\\alpha=${v.fix(T, 0)}$ min. Max |exact − RK4| = $${v.sci(cache.err ?? 0, 2)}$ molecules. Halving $\\beta$ halves the plateau but not the speed.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Response time T½ = ln 2 / α',
      statement: String.raw`For $\dot p=\beta-\alpha p$ with $\beta$ switched on (from $p=0$) or off (from $p=\beta/\alpha$) at $t=0$, the time at which $p$ is halfway between its initial and final steady states is
$$T_{1/2}=\frac{\ln 2}{\alpha},$$
independent of the production rate $\beta$ and of the steady state. If $\alpha$ is due only to dilution by growth, $\alpha=\ln 2/T_{\rm div}$ and therefore $T_{1/2}=T_{\rm div}$: the response time of a stable protein equals one cell-cycle time. Making a protein unstable ($\alpha=\alpha_{\rm deg}+\alpha_{\rm dil}$) is the way to speed a circuit up.`,
      idea: String.raw`Write the deviation $\Delta=p-p_{\rm final}$; it satisfies $\dot\Delta=-\alpha\Delta$ with $\Delta(0)=p_{\rm initial}-p_{\rm final}$, so $\Delta(t)=\Delta(0)e^{-\alpha t}$. Half-way means $|\Delta|=|\Delta(0)|/2$, i.e. $e^{-\alpha t}=1/2$. The proof therefore uses the closed-form solution of 1.5 and nothing about $\beta$, which only shifts the final level. The theorem fails when production is itself still changing — for instance when the regulator is made by an upstream gene that has its own response time — the delays then add, which is why gene cascades are slow.`,
      caption: String.raw`Three genes with production rates in ratio $1:2:4$ are switched on together (or off, using the toggle). Their half-way marks (gold dots) fall on one vertical line at $\ln2/\alpha$. Move $\alpha$ via the doubling time: the line slides, and the log–log plot on the right shows $T_{1/2}\propto 1/\alpha$ with slope $-1$, with $E.\,coli$ doubling times of 40 and 63.5 min marked. Switch on *upstream gene still rising* to see the theorem's hypothesis fail: the measured half-time (numerical) moves to the right of $\ln2/\alpha$.`,
      deps: ['sysbio-1.5'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['response time', 'dilution'],
      scope: String.raw`Needs a constant removal rate $\alpha$ and a production rate that switches abruptly (a step in $\beta$). E. coli doubling times: about 40 min for B/r in aerobic glucose minimal medium at 37 °C (BioNumbers) and about 63 min for MG1655 in MOPS 0.1% glucose (Univ. Wisconsin growth curve); Rosenfeld, Elowitz & Alon (2002) report that the rise time of an unregulated synthetic gene is about one cell cycle.`,
      viz(v) {
        const Td = v.slider('doubling time $T_{\\rm div}$ (min)', 15, 150, 60, { step: 1 });
        const dir = v.select('switch', [{ value: 'on', label: 'production ON' }, { value: 'off', label: 'production OFF' }], 'on');
        const delay = v.toggle('upstream gene still rising (breaks the theorem)', false);
        const lu = v.slider('upstream removal rate $\\alpha_u$ (min$^{-1}$)', 0.005, 0.5, 0.03, { log: true, sig: 2, step: 0.001 });
        const S1 = v.stage({ x: [0, 300], y: [0, 4.4], axes: 'box', gutter: true, height: 320, weight: 1.25, minWidth: 300, xlabel: 'time since switch (min)', ylabel: 'protein level (β₁ = 1 per min)' });
        const S2 = v.stage({ x: [10, 200], xlog: true, y: [10, 200], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'doubling time (min)', ylabel: 'T½ (min)' });
        const BET = [1, 2, 4], COL = ['blue', 'teal', 'purple'];
        const halfTime = (T, k, mode, useDelay) => {
          const a = LN2 / T, au = lu.value;
          const F = (t, y) => { const b = useDelay ? BET[k] * (1 - Math.exp(-au * t)) : BET[k]; return [(mode === 'on' ? b : 0) - a * y[0]]; };
          const y0 = mode === 'on' ? 0 : BET[k] / a;
          const path = rk4Path(F, [y0], 6 * Math.max(T, 1 / au), 3000, 1);
          const fin = mode === 'on' ? BET[k] / a : 0;
          return { path, t: crossing(path, (y0 + fin) / 2), y0, fin };
        };
        v.render(() => {
          const T = Td.value, a = LN2 / T, mode = dir.value, d = delay.value;
          lu.el.hidden = !d;
          S1.setView([0, Math.max(5 * T, 1)], [0, (4 / a) * 1.1]);
          for (let k = 0; k < 3; k++) {
            const h = halfTime(T, k, mode, d), p = h.path.filter((q) => q[0] <= 5 * T);
            S1.path(p.map((q) => [q[0], q[1]]), { color: COL[k], width: 2.6 });
            S1.hline((h.y0 + h.fin) / 2, { color: COL[k], dash: true, width: 1, alpha: 0.5 });
            S1.dot(h.t, (h.y0 + h.fin) / 2, { r: 6, color: 'gold' });
          }
          S1.vline(T, { color: 'green', width: 2, dash: [6, 3] });
          S1.tex(String.raw`\ln2/\alpha`, T, (4 / a) * 1.07, { color: 'green', dx: 6 });
          // log-log
          S2.fn((x) => x, { color: 'green', dash: true, width: 2 });
          for (const t of [40, 63.5]) { S2.vline(t, { color: 'faint', dash: true }); }
          S2.text('B/r 40 min', 40, 12, { size: 10, color: 'muted', dx: -4, align: 'right' });
          S2.text('MG1655 63.5 min', 63.5, 12, { size: 10, color: 'muted', dx: 4, align: 'left' });
          const pts = []; for (let j = 0; j <= 10; j++) { const t = 12 * (190 / 12) ** (j / 10); pts.push([t, halfTime(t, 2, mode, d).t]); }
          S2.dots(pts, { r: 4, color: 'gold' });
          S2.dot(T, halfTime(T, 1, mode, d).t, { r: 7, color: 'accent' });
        });
        v.legend([['blue', 'β = 1'], ['teal', 'β = 2'], ['purple', 'β = 4'], ['gold', 'half-way point (numerical)', { dot: true }], ['green', 'T½ = ln2/α', { dash: true }]]);
        v.readout(() => {
          const T = Td.value, mode = dir.value, d = delay.value, ts = [0, 1, 2].map((k) => halfTime(T, k, mode, d).t);
          return `$\\alpha=\\ln2/${v.fix(T, 0)}\\,\\text{min}=${v.fix(LN2 / T, 4)}\\,\\text{min}^{-1}$ → predicted $T_{1/2}=\\ln2/\\alpha = ${v.fix(T, 1)}$ min. Measured half-times for $\\beta=1,2,4$: ${ts.map((t) => v.fix(t, 1)).join(', ')} min ${d ? '— upstream delay adds roughly its own response time' : '— identical, whatever β is ✓'}.`;
        });
      },
    },
  ],
};
