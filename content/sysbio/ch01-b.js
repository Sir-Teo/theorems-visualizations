// Systems Biology — Chapter 1 (part b): time scales, dilution, network motifs, effective Hill coefficient, Jacob–Monod
import { LN2, hillAct, relax, rk4Path, crossing, pchip, countMotifs, findFFLs, randomize, makeNetwork } from './ch01.shared.js';

export default {
  collection: 'sysbio',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Separation of time scales in gene circuits',
      statement: String.raw`The processes in a gene circuit run on very different time scales: transcription-factor binding and unbinding take about a second or less, making an mRNA or a protein about a minute, mRNA lifetimes are minutes (most *E. coli* mRNAs have half-lives of 3–8 min), and a stable protein is removed by dilution on the time scale of the cell cycle (tens of minutes to hours). When one process is much faster than the rest, its variable sits at its quasi-steady state, so the promoter can be replaced by an instantaneous input function $f(x)=x/(K+x)$ and, if mRNA is also fast, the circuit reduces to the single equation $\dot p = \alpha\,(f(x) - p)$.`,
      idea: String.raw`Fast variables relax to the (moving) equilibrium of the slow ones: for the binding equation $\dot B = k_{\rm on}x(1-B)-k_{\rm off}B$ the relaxation rate $k_{\rm on}x+k_{\rm off}$ is huge compared with the rates in $\dot m=\gamma(B-m)$ and $\dot p=\alpha(m-p)$, so $B\approx x/(K+x)$ (Tikhonov-type reduction; mathbio-5.4). Likewise if $\gamma\gg\alpha$ the mRNA tracks $B$ and only $p$ is left. The reduction is a controlled approximation: it becomes poor exactly when the ratio of time scales approaches one.`,
      caption: String.raw`**Top**: the characteristic times of binding, mRNA decay and dilution on one logarithmic axis (seconds to days); gold markers show your current settings. **Bottom**: the input $x(t)$ steps on and off and the protein level is integrated for the full three-variable model (binding, mRNA, protein; blue) and for two reductions — binding in quasi-steady state (dashed orange) and binding and mRNA both in quasi-steady state (dotted green). Lengthen the binding time or the mRNA half-life toward the protein time scale and watch the reductions fail.`,
      deps: ['sysbio-1.5', 'mathbio-5.4'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['time scales', 'quasi-steady state'],
      scope: String.raw`Ranges drawn on the ruler are order-of-magnitude values: mRNA half-lives 3–8 min for about 80% of *E. coli* genes (Bernstein et al., PNAS 2002); doubling times 40–65 min in minimal media (see 1.6); binding times of seconds and a minute for transcription and translation are textbook-scale estimates (illustrative, quoted from memory of Alon's discussion).`,
      viz(v) {
        const ST = {};
        const tb = v.slider('binding / unbinding time $\\tau_b$ (s)', 0.3, 3000, 1, { log: true, sig: 2, step: 0.01 });
        const th = v.slider('mRNA half-life (min)', 1, 120, 5, { log: true, sig: 2, step: 0.1 });
        const Td = v.slider('doubling time (min)', 20, 120, 60, { step: 1 });
        const R = v.stage({ x: [0.1, 2e5], xlog: true, y: [0, 4.6], axes: 'box', gutter: true, height: 250, full: true, xlabel: 'time (s)', xticks: [[1, '1 s'], [10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h'], [36000, '10 h'], [86400, '1 day']], yticks: [] });
        const L = v.stage({ x: [0, 360], y: [0, 1.15], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'time (min)', ylabel: 'protein level (fraction of maximum)' });
        const rows = [['TF binding / unbinding', 0.1, 10, 'blue'], ['transcription + translation (1 gene)', 20, 120, 'teal'], ['mRNA lifetime (half-life)', 180, 480, 'orange'], ['protein dilution (doubling time)', 2400, 3900, 'purple']];
        const X = (t, Td) => { const u = t / Td; return u >= 0.3 && u < 3 ? 4 : 0.05; };
        v.render(() => {
          const T = Td.value, gam = LN2 / th.value, al = LN2 / T, koff = 60 / tb.value, kon = koff; // K = 1
          rows.forEach(([nm, a, b, c], i) => {
            const y = 3.9 - i;
            R.rect(a, y - 0.3, b, y + 0.3, { fill: c, fillAlpha: 0.35, color: c, radius: 4 });
            R.tex(String.raw`\text{${nm}}`, Math.sqrt(a * b), y + 0.58, { size: 12, color: c });
          });
          R.dot(tb.value, 3.9, { r: 7, color: 'gold' }); R.dot(th.value * 60, 1.9, { r: 7, color: 'gold' }); R.dot(T * 60, 0.9, { r: 7, color: 'gold' });
          // integration: B exact relaxation within a step, m and p by midpoint on the B average
          const dt = 0.02, n = Math.round(360 / dt); let B = hillAct(0.05, 1, 1), m = B, p = B, m2 = B, p2 = B, p3 = B;
          const pf = [], p1 = [], pr = [], px = [];
          for (let i = 0; i < n; i++) {
            const t = (i + 0.5) * dt, x = X(t, T), Beq = x / (1 + x), lam = kon * x + koff, e = Math.exp(-lam * dt);
            const Bbar = Beq + (B - Beq) * ((1 - e) / (lam * dt)); B = Beq + (B - Beq) * e;
            const mh = m + 0.5 * dt * gam * (Bbar - m), ph = p + 0.5 * dt * al * (m - p);
            m += dt * gam * (Bbar - mh); p += dt * al * (mh - ph);
            const mq = m2 + 0.5 * dt * gam * (Beq - m2), pq = p2 + 0.5 * dt * al * (m2 - p2);
            m2 += dt * gam * (Beq - mq); p2 += dt * al * (mq - pq);
            p3 += dt * al * (Beq - p3);
            if (i % 10 === 0) { px.push((i + 1) * dt); pf.push(p); p1.push(p2); pr.push(p3); }
          }
          L.path(px.map((t, i) => [t, X(t, T) / (1 + X(t, T))]), { color: 'faint', width: 1.4, dash: true });
          L.path(px.map((t, i) => [t, pf[i]]), { color: 'accent', width: 3 });
          L.path(px.map((t, i) => [t, p1[i]]), { color: 'orange', width: 2.2, dash: [7, 3] });
          L.path(px.map((t, i) => [t, pr[i]]), { color: 'green', width: 2.4, dash: [2, 3] });
          let e1 = 0, e2 = 0; for (let i = 0; i < px.length; i++) { e1 = Math.max(e1, Math.abs(pf[i] - p1[i])); e2 = Math.max(e2, Math.abs(pf[i] - pr[i])); }
          ST.err = [e1, e2];
        });
        v.legend([['accent', 'full model (binding, mRNA, protein)'], ['orange', 'binding in quasi-steady state', { dash: true }], ['green', 'binding and mRNA quasi-steady', { dash: true }], ['faint', 'input x(t) → promoter equilibrium', { dash: true }]]);
        v.readout(() => {
          const [e1, e2] = ST.err || [0, 0];
          return `ratios: binding time / mRNA half-life = $${v.sci(tb.value / 60 / th.value, 2)}$, mRNA half-life / doubling time = $${v.fix(th.value / Td.value, 3)}$. Worst error of the reductions (fraction of maximum): binding-only **${v.fix(e1, 3)}**, binding + mRNA **${v.fix(e2, 3)}**. Both are small at the default values (1 s, 5 min, 60 min) and grow as the time scales merge.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Concept',
      name: 'Dilution by growth versus active degradation',
      statement: String.raw`In a growing cell the concentration $c=N/V$ of a protein falls both because molecules are degraded (rate $\alpha_{\rm deg}$) and because the cell volume grows. For exponential growth with doubling time $T_{\rm div}$, $V\propto e^{\mu t}$ with $\mu=\ln2/T_{\rm div}$, and
$$\frac{dc}{dt}=\beta-(\alpha_{\rm deg}+\mu)\,c .$$
So **dilution acts as first-order removal with $\alpha_{\rm dil}=\mu$**: a stable protein has $\alpha=\mu$ and halves its concentration each cell cycle (when production stops), and adding a degradation tag makes $\alpha=\alpha_{\rm deg}+\mu$, which is larger and gives a faster response (1.6).`,
      idea: String.raw`Number of molecules $N$ obeys $\dot N=\beta V-\alpha_{\rm deg}N$ while $\dot V=\mu V$; then $\dot c=\dot N/V-c\,\dot V/V=\beta-\alpha_{\rm deg}c-\mu c$. At division the molecules are partitioned between daughters (binomially, so with noise) and the volume is halved, so the *average* concentration is unchanged by division — the sawtooth in $N$ and $V$ cancels in $c$. This is why the deterministic equation with $\alpha_{\rm dil}=\ln 2/T_{\rm div}$ describes the cell population mean.`,
      caption: String.raw`**Left**: one cell lineage followed through successive divisions (faint lines mark divisions): the concentration (gold) and the deterministic ODE with $\alpha=\mu+\alpha_{\rm deg}$ (blue). **Right**: the average of 60 independent lineages against the same ODE; the marks give the measured half-time and $\ln2/\alpha$. Choose *switch ON* (protein starts at zero) or *switch OFF* (starts at steady state). With no degradation the concentration halves at every doubling time; add the tag and the response speeds up. Seeded; press *new lineages* to resample.`,
      deps: ['sysbio-1.6'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['dilution', 'degradation'],
      scope: String.raw`Balanced exponential growth, constant production per volume, binomial partition at division. Half-lives of fluorescent proteins carrying C-terminal degradation tags in *E. coli* were measured by Andersen et al. (Appl. Environ. Microbiol. 1998): about 40 min for Gfp(LVA)/(LAA), about 60 min (AAV), about 110 min (ASV); untagged Gfp is stable (more than a day). The default 40 min follows the LVA/LAA value.`,
      viz(v) {
        const ST = {};
        const Td = v.slider('doubling time $T_{\\rm div}$ (min)', 20, 120, 50, { step: 1 });
        const tag = v.toggle('add a degradation tag', false);
        const th = v.slider('tag half-life (min)', 10, 200, 40, { log: true, sig: 2, step: 1 });
        const mode = v.select('experiment', [{ value: 'on', label: 'switch ON' }, { value: 'off', label: 'switch OFF' }], 'on');
        let seed = 1; v.button('new lineages', () => { seed++; });
        const A = v.stage({ x: [0, 250], y: [0, 1.6], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'time (min)', ylabel: 'concentration (relative to steady state)', title: 'one lineage' });
        const B = v.stage({ x: [0, 250], y: [0, 1.1], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'time (min)', ylabel: 'concentration (relative to steady state)', title: 'mean of 60 lineages' });
        let cache = { key: '' };
        const poisson = (r, m) => { if (m > 30) return Math.max(0, Math.round(m + Math.sqrt(m) * r.normal())); const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
        const binom = (r, n, p) => { if (n <= 0 || p <= 0) return 0; if (p >= 1) return n; if (n * p * (1 - p) > 25) return Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * r.normal()))); let k = 0; for (let i = 0; i < n; i++) if (r() < p) k++; return k; };
        function simulate(T, gam, md, sd) {
          const mu = LN2 / T, al = mu + gam, cst = 150, b = cst * al, dt = 0.25, nst = Math.round(250 / dt), M = 60, rec = [], lin = [];
          for (let L = 0; L < M; L++) {
            const r = v.rng(sd * 1000 + L); let V = 1 + r(), N = md === 'off' ? poisson(r, cst * V) : 0; const tr = [], vol = [], divs = [];
            for (let i = 0; i <= nst; i++) {
              tr.push(N / V / cst); vol.push(V);
              N += poisson(r, b * V * dt); if (gam > 0) N -= binom(r, N, 1 - Math.exp(-gam * dt));
              V *= Math.pow(2, dt / T); if (V >= 2) { V /= 2; N = binom(r, N, 0.5); divs.push((i + 1) * dt); }
            }
            rec.push(tr); if (L === 0) lin.push({ tr, vol, divs });
          }
          const mean = rec[0].map((_, i) => rec.reduce((s, tr) => s + tr[i], 0) / M);
          return { mean, one: lin[0], al, mu };
        }
        v.render(() => {
          const T = Td.value, gam = tag.value ? LN2 / th.value : 0; th.el.hidden = !tag.value;
          const key = [T, gam, mode.value, seed].join('|');
          if (cache.key !== key) cache = { key, ...simulate(T, gam, mode.value, seed) };
          const { mean, one, al } = cache, on = mode.value === 'on', dt = 0.25;
          const ode = (t) => (on ? 1 - Math.exp(-al * t) : Math.exp(-al * t));
          const tmax = 250; A.setView([0, tmax], [0, on ? 1.5 : 1.7]);
          for (const d of one.divs) A.vline(d, { color: 'faint', alpha: 0.6 });
          A.path(one.tr.map((c, i) => [i * dt, c]), { color: 'gold', width: 1.8 });
          A.path(Array.from({ length: 251 }, (_, i) => [i, ode(i)]), { color: 'accent', width: 2.8 });
          B.path(mean.map((c, i) => [i * dt, c]), { color: 'gold', width: 2.2 });
          B.path(Array.from({ length: 251 }, (_, i) => [i, ode(i)]), { color: 'accent', width: 2.8 });
          const th_m = crossing(mean.map((c, i) => [i * dt, c]), 0.5), th_p = Math.LN2 / al;
          B.vline(th_p, { color: 'green', dash: [6, 3], width: 2 }); B.hline(0.5, { color: 'faint', dash: true });
          if (Number.isFinite(th_m)) B.dot(th_m, 0.5, { r: 6, color: 'gold' });
          cache.th_m = th_m;
        });
        v.legend([['gold', 'simulated cells (binomial partition)'], ['accent', 'ODE with α = μ + α_deg'], ['green', 'ln2 / α', { dash: true }]]);
        v.readout(() => {
          const T = Td.value, gam = tag.value ? LN2 / th.value : 0, mu = LN2 / T, al = mu + gam;
          return `growth $\\mu=\\ln2/T_{\\rm div}=${v.fix(mu, 4)}\\,\\text{min}^{-1}$, degradation $\\alpha_{\\rm deg}=${v.fix(gam, 4)}$, total removal $\\alpha=${v.fix(al, 4)}$ → predicted half-time $\\ln2/\\alpha = ${v.fix(Math.LN2 / al, 1)}$ min; measured on the 60-lineage mean: **${v.fix(cache.th_m ?? NaN, 1)}** min. ${tag.value ? `The tag shortens the response from ${v.fix(T, 0)} min (dilution alone) by a factor ${v.fix(al / mu, 2)}.` : `Without a tag the half-time equals the doubling time, ${v.fix(T, 0)} min.`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Network motifs and randomized-network null models',
      statement: String.raw`A **network motif** is a directed subgraph pattern that occurs in a real network significantly more often than in randomized networks that preserve the degree of every node. For a pattern with count $N_{\rm real}$ and randomized counts of mean $\langle N_{\rm rand}\rangle$ and standard deviation $\sigma$ the significance is the **Z-score**
$$Z=\frac{N_{\rm real}-\langle N_{\rm rand}\rangle}{\sigma}.$$
In the *E. coli* transcription network (577 interactions among 424 operons) Shen-Orr et al. (2002) found 34 coherent and 6 incoherent feed-forward loops against $4.4\pm3$ and $2.5\pm2$ in randomized networks, and large single-input modules and dense overlapping regulons far above chance.`,
      idea: String.raw`The null model matters: a pattern can be common merely because a few hubs have huge degree. Randomizing by *edge switching* (replace $A\to B$, $C\to D$ by $A\to D$, $C\to B$) keeps every in- and out-degree fixed while destroying all higher structure, so patterns that are fixed by degrees alone (such as pairs of targets of one regulator) have $Z=0$ by construction, whereas an excess of triangles like $X\to Y\to Z$, $X\to Z$ points to selection for function — the feed-forward loop is then analysed in chapter 3.`,
      caption: String.raw`A **synthetic** transcription network (not data: three global regulators, twelve specific ones and 70 target operons, wired with a tunable tendency to close feed-forward loops). Choose a pattern; its instances are highlighted in orange in the graph (feed-forward loops) and its count is compared, in the middle panel, with 150 degree-preserving randomizations made by edge switching. The right panel gives $Z$ for all five patterns. Slide the loop bias to zero and the FFL's $Z$ collapses toward 0; press *new network* to resample.`,
      deps: ['sysbio-1.1'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['network motifs', 'randomization'],
      credit: 'Milo et al., Science 2002; Shen-Orr et al., Nature Genetics 2002',
      scope: String.raw`Counts are for three-node patterns in a directed graph without multiple edges; autoregulation edges are excluded from the counts and left fixed in the randomization. Quoted *E. coli* numbers are from Table 1 of Shen-Orr et al. (2002), read from the paper's text; the network drawn here is synthetic.`,
      viz(v) {
        const ST = {};
        const PAT = [['ffl', 'feed-forward loop'], ['cycle3', '3-cycle (feedback loop)'], ['cascade', 'cascade X→Y→Z'], ['bifan', 'bi-fan'], ['fanout', 'fan-out (two targets)']];
        const pat = v.select('pattern', PAT.map(([value, label]) => ({ value, label })), 'ffl');
        const bias = v.slider('feed-forward loop bias', 0, 1, 0.8, { step: 0.05 });
        let seed = 3; v.button('new network', () => { seed++; });
        const G0 = v.stage({ x: [0, 10], y: [0, 7], equal: true, axes: false, height: 440, full: true });
        const H = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 290, minWidth: 280, xlabel: 'number of instances in a randomized network', ylabel: 'networks (of 150)' });
        const Z = v.stage({ x: [0.3, 5.7], y: [-3, 10], axes: 'box', gutter: true, height: 290, minWidth: 260, xlabel: 'pattern', ylabel: 'Z-score', xticks: [[1, 'FFL'], [2, '3-cycle'], [3, 'cascade'], [4, 'bi-fan'], [5, 'fan-out']] });
        let cache = { key: '' }, G = null, lastKey = '';
        const R = () => {
          const key = `${bias.value}|${seed}`;
          if (cache.key === key) return cache;
          const net = makeNetwork(v.rng(seed * 17 + 1), { nGen: 3, nSpec: 12, nTar: 70, bias: bias.value });
          const real = countMotifs(net.n, net.edges), rs = v.rng(seed * 31 + 5), nulls = [];
          for (let i = 0; i < 150; i++) nulls.push(countMotifs(net.n, randomize(net.n, net.edges, rs, 10)));
          const stats = {};
          for (const [k] of PAT) { const xs = nulls.map((q) => q[k]), mu = xs.reduce((a, b) => a + b, 0) / xs.length, sd = Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / xs.length); stats[k] = { xs, mu, sd, z: sd > 0 ? (real[k] - mu) / sd : 0 }; }
          cache = { key, net, real, stats, ffl: findFFLs(net.n, net.edges) };
          return cache;
        };
        v.render(() => {
          const c = R();
          if (lastKey !== c.key) {
            lastKey = c.key;
            const ids = c.net.names;
            G = v.graph(G0, { directed: true, nodes: ids.map((id, i) => ({ id, label: '', r: 3.5, layer: i < 3 ? 0 : i < 15 ? 1 : 2 })), edges: c.net.edges.filter((e) => e[0] !== e[1]).map(([a, b, sg]) => ({ from: ids[a], to: ids[b], sign: sg })), layout: 'layered', rankdir: 'down', gap: 26, draggable: false, autoRadius: false, shape: 'circle' });
          }
          const ids = c.net.names, hl = new Set(), hn = new Set();
          if (pat.value === 'ffl') for (const [x, y, z] of c.ffl) { hl.add(ids[x] + '>' + ids[y]); hl.add(ids[y] + '>' + ids[z]); hl.add(ids[x] + '>' + ids[z]); hn.add(ids[x]); hn.add(ids[y]); hn.add(ids[z]); }
          G.draw({
            nodeColor: (id) => (hn.has(id) ? 'orange' : id.startsWith('G') ? 'accent' : id.startsWith('S') ? 'teal' : 'muted'),
            nodeFill: (id) => (id.startsWith('o') ? null : id.startsWith('G') ? 'accent' : 'teal'),
            edgeColor: (e) => (hl.has(e.from + '>' + e.to) ? 'orange' : null), edgeWidth: (e) => (hl.has(e.from + '>' + e.to) ? 2.6 : 1),
            dim: pat.value === 'ffl' ? [] : [],
          });
          const st = c.stats[pat.value], xs = st.xs, real = c.real[pat.value];
          const lo = Math.floor(Math.min(real, ...xs)) - 1, hi = Math.ceil(Math.max(real, ...xs)) + 2;
          const counts = new Map(); for (const x of xs) counts.set(x, (counts.get(x) || 0) + 1);
          const ymax = Math.max(...counts.values()) * 1.15;
          H.setView([lo, hi], [0, ymax]);
          for (const [x, k] of counts) H.rect(x - 0.4, 0, x + 0.4, k, { fill: 'muted', fillAlpha: 0.45, color: 'muted' });
          H.vline(st.mu, { color: 'blue', dash: true, width: 1.6 });
          H.vband(st.mu - st.sd, st.mu + st.sd, { color: 'blue', alpha: 0.08 });
          H.vline(real, { color: 'orange', width: 3 });
          H.tex(String.raw`\text{real}=${real}`, real, ymax * 0.92, { color: 'orange', dx: real > (lo + hi) / 2 ? -8 : 8, align: real > (lo + hi) / 2 ? 'right' : 'left' });
          Z.hline(0, { color: 'muted' }); Z.hline(2, { color: 'faint', dash: true });
          const zs = PAT.map(([k]) => c.stats[k].z), zmax = Math.max(8, ...zs) * 1.1;
          Z.setView([0.3, 5.7], [-3, zmax]);
          PAT.forEach(([k], i) => Z.rect(i + 0.6, 0, i + 1.4, zs[i], { fill: k === pat.value ? 'orange' : 'muted', fillAlpha: 0.7, color: k === pat.value ? 'orange' : 'muted' }));
          Z.text('Z = 2', 5.6, 2, { size: 10, color: 'muted', align: 'right', dy: -6 });
        });
        v.legend([['orange', 'real (synthetic) network'], ['muted', 'randomized networks', { area: true }], ['blue', 'null mean ± 1 s.d.', { dash: true }]]);
        v.readout(() => {
          const c = R(), st = c.stats[pat.value], real = c.real[pat.value], name = PAT.find((p) => p[0] === pat.value)[1];
          const coh = c.ffl.filter(([x, y, z]) => { const s = (a, b) => c.net.edges.find((e) => e[0] === a && e[1] === b)[2]; return s(x, z) === s(x, y) * s(y, z); }).length;
          return `${name}: real **${real}**, randomized ${v.fix(st.mu, 1)} ± ${v.fix(st.sd, 1)} → **Z = ${st.sd > 0 ? v.fix(st.z, 1) : '0 (fixed by the degrees)'}**. This network: ${c.net.n} nodes, ${c.net.edges.length} edges, ${c.ffl.length} feed-forward loops (${coh} coherent).\nReal *E. coli* (Shen-Orr 2002): coherent FFL 34 vs 4.4 ± 3 (Z ≈ ${v.fix((34 - 4.4) / 3, 0)}), incoherent FFL 6 vs 2.5 ± 2 (Z ≈ ${v.fix((6 - 2.5) / 2, 1)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Effective Hill coefficient and response sensitivity',
      statement: String.raw`For any increasing input function $f$ with range $[f_{\min},f_{\max}]$ let $x_{10}$ and $x_{90}$ be the inputs at which the normalised response $\tilde f=(f-f_{\min})/(f_{\max}-f_{\min})$ equals 10% and 90%. The **effective Hill coefficient** is
$$n_{\rm eff}=\frac{\ln 81}{\ln (x_{90}/x_{10})}.$$
For a Hill function $n_{\rm eff}=n$. The local steepness is the **logarithmic sensitivity** $S=d\ln\tilde f/d\ln x$; for a Hill function it equals $n/2$ at half-maximum and falls from $n$ at small $x$, so $2S_{50}$ is a second estimate of $n$ that agrees with $n_{\rm eff}$ for Hill functions and differs for other shapes.`,
      idea: String.raw`The definition simply inverts the Hill identity $x_{90}/x_{10}=81^{1/n}$ of 1.3, which makes the number meaningful for curves that are not Hill functions: it measures how many-fold the input must change to sweep the response from 10% to 90%. The two estimates answer different questions — $n_{\rm eff}$ is a *global* width, $S_{50}$ a *local* slope at the midpoint — and they disagree when the curve has a shoulder, a plateau or several thresholds, as in the multi-plateau *lac* input function.`,
      caption: String.raw`Drag the seven blue handles to draw any increasing input function (a monotone cubic through them), or choose a preset. The left panel shows the curve, the 10%/90% inputs and the Hill curve with the same $n_{\rm eff}$ (dashed) through the same half-maximum; the right panel shows the logarithmic sensitivity along the curve. Presets: ordinary Hill functions, a leaky one, a two-step curve like the four-plateau *lac* promoter, and a titration threshold. Notice how the two-step curve gets a modest $n_{\rm eff}$ although its steps are steep.`,
      deps: ['sysbio-1.3'],
      refs: ['Alon: Transcription Networks: Basic Concepts'],
      tags: ['Hill function', 'sensitivity'],
      viz(v) {
        const ST = {};
        const XS = [0.03, 0.1, 0.3, 1, 3, 10, 30], LX = XS.map(Math.log10);
        const PRE = {
          h1: (x) => hillAct(x, 1, 1), h2: (x) => hillAct(x, 1, 2), h4: (x) => hillAct(x, 1, 4),
          leaky: (x) => 0.15 + 0.85 * hillAct(x, 1, 3), two: (x) => 0.5 * hillAct(x, 0.15, 4) + 0.5 * hillAct(x, 6, 4),
          titr: (x) => Math.max(0, Math.min(1, (x - 0.5) / 1)),
        };
        const pre = v.select('preset', [{ value: 'h1', label: 'Hill $n=1$' }, { value: 'h2', label: '$n=2$' }, { value: 'h4', label: '$n=4$' }, { value: 'leaky', label: 'leaky' }, { value: 'two', label: 'two-step' }, { value: 'titr', label: 'titration' }], 'h2', { onChange: (k) => { hs.forEach((h, i) => h.set(h.x, PRE[k](XS[i]))); } });
        const A = v.stage({ x: [0.01, 100], xlog: true, y: [0, 1.1], axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'regulator x (log)', ylabel: 'response f' });
        const B = v.stage({ x: [0.01, 100], xlog: true, y: [0, 4.5], axes: 'box', gutter: true, height: 330, minWidth: 260, xlabel: 'regulator x (log)', ylabel: 'sensitivity d ln f̃ / d ln x' });
        const hs = XS.map((x, i) => A.handle(x, PRE.h2(x), { color: 'blue', r: 8, constrain: 'y' }));
        const fcurve = () => { const ys = hs.map((h) => h.y); for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1]); return pchip(LX, ys); };
        v.render(() => {
          const f = fcurve(), N = 600, xs = [], ys = [];
          for (let i = 0; i <= N; i++) { const lx = -2 + (4 * i) / N; xs.push(10 ** lx); ys.push(f(lx)); }
          const fmin = ys[0], fmax = ys[N], rng = Math.max(fmax - fmin, 1e-9), ft = ys.map((y) => (y - fmin) / rng);
          const cross = (lv) => { for (let i = 1; i <= N; i++) if (ft[i - 1] < lv && ft[i] >= lv) { const t = (lv - ft[i - 1]) / (ft[i] - ft[i - 1]); return 10 ** (-2 + (4 * (i - 1 + t)) / N); } return NaN; };
          const x10 = cross(0.1), x90 = cross(0.9), x50 = cross(0.5), neff = Math.log(81) / Math.log(x90 / x10);
          // sensitivity of normalised response
          const dl = 4 / N, sens = ft.map((y, i) => (i === 0 || i === N || y < 1e-3 ? NaN : ((ft[i + 1] - ft[i - 1]) / (2 * dl * Math.LN10)) / y));
          const i50 = ft.findIndex((y) => y >= 0.5), S50 = sens[i50];
          A.path(xs.map((x, i) => [x, ys[i]]), { color: 'accent', width: 3 });
          if (Number.isFinite(neff)) A.fn((x) => fmin + rng * hillAct(x, x50, neff), { color: 'green', dash: [6, 4], width: 2 });
          for (const [xq, c] of [[x10, 0.1], [x90, 0.9]]) if (Number.isFinite(xq)) { A.vline(xq, { color: 'orange', dash: true }); A.dot(xq, fmin + rng * c, { r: 5, color: 'orange' }); }
          if (Number.isFinite(x50)) A.dot(x50, fmin + rng * 0.5, { r: 6, color: 'gold' });
          B.path(xs.map((x, i) => [x, sens[i]]), { color: 'purple', width: 2.6 });
          if (Number.isFinite(S50)) { B.dot(x50, S50, { r: 6, color: 'gold' }); B.hline(neff / 2, { color: 'green', dash: true }); }
          ST.m = { neff, S50, x10, x90, x50 };
        });
        v.legend([['accent', 'your input function'], ['green', 'Hill curve with the same n_eff', { dash: true }], ['orange', 'x₁₀, x₉₀', { dot: true }], ['purple', 'logarithmic sensitivity'], ['gold', 'half-maximum', { dot: true }]]);
        v.readout(() => {
          const m = ST.m; if (!m) return '';
          return `$x_{10}=${v.fix(m.x10, 3)}$, $x_{90}=${v.fix(m.x90, 3)}$, ratio ${v.fix(m.x90 / m.x10, 2)} → $n_{\\rm eff}=\\ln81/\\ln(x_{90}/x_{10}) = ${v.fix(m.neff, 2)}$. Sensitivity at half-maximum $S_{50}=${v.fix(m.S50, 2)}$ → $2S_{50}=${v.fix(2 * m.S50, 2)}$ ${Math.abs(2 * m.S50 - m.neff) < 0.15 * m.neff ? '(agrees with $n_{\\rm eff}$: Hill-like)' : '(differs from $n_{\\rm eff}$: not a Hill shape)'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Paper',
      name: 'Genetic Regulatory Mechanisms in the Synthesis of Proteins',
      paper: { authors: 'François Jacob and Jacques Monod', year: 1961, title: 'Genetic regulatory mechanisms in the synthesis of proteins', venue: 'Journal of Molecular Biology 3 (3): 318–356', doi: '10.1016/S0022-2836(61)80072-7' },
      introduces: ['sysbio-1.2'],
      statement: String.raw`Using *E. coli* strains that carry two copies of the *lac* region — one on the chromosome and one on an F′ episome — Jacob and Monod showed that expression of the structural gene $z$ (β-galactosidase) is controlled by two different genetic elements acting in different ways. The regulator gene $i$ makes a diffusible repressor that acts **in trans**: one functional $i^+$ copy keeps *both* copies of the operon off without inducer, so $i^+$ is dominant over $i^-$. The **operator** $o$ acts only **in cis**: an operator-constitutive mutation $o^c$ makes only the structural genes on the same DNA molecule constitutive, and is not corrected by an $o^+$ operator on the other molecule. The repressor is inactivated by inducer, giving the inducible *lac* system, and these results define a repressor that binds an operator in front of a group of genes (the operon).

Scope: the logic is that of negative control by a repressor binding at one operator; the 1961 paper itself left the chemical nature of the repressor open (later shown to be a protein, the LacI tetramer).`,
      idea: String.raw`Before 1961 the picture of enzyme induction was unclear: did the inducer act on the enzyme-forming system or on a regulator? Jacob and Monod used genetics, constructing partial diploids (merodiploids) and asking, for each mutant gene, whether its effect was *dominant* and whether it acted on the same molecule only. Constitutive mutations of two kinds ($i^-$, $o^c$) looked alike in haploids but behaved differently in diploids — a recessive trans-acting defect for $i$ versus a dominant cis-acting defect for $o$. That is exactly what a diffusible repressor (made by $i$) and a DNA binding site (the operator $o$) predict (sysbio-1.2: repressor-controlled input function).`,
      caption: String.raw`Build a genotype: for the **chromosome** and the **F′ episome** choose the alleles of $i$ (regulator), $o$ (operator) and $z$ (structural gene) — or load one of the paper's classic partial diploids. The picture traces where repressor reaches (blue arrows, in trans) and which operators are blocked; bars give β-galactosidase made without and with inducer, in units of one fully induced haploid $z^+$ gene (illustrative: a repressed gene is set to 0.1% and an $o^c$ operon is constitutive at the full level). Compare: $i^-z^+$ with $F'\,i^+z^-$ is inducible (trans dominance of $i^+$), while $o^cz^+$ with $F'\,o^+z^-$ stays constitutive and $o^cz^-$ with $F'\,o^+z^+$ does not.`,
      deps: ['bioinf-1.1'],
      refs: [],
      tags: ['lac operon', 'repressor', 'genetics'],
      credit: 'François Jacob & Jacques Monod, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lac_operon' },
      viz(v) {
        const ST = {};
        const AL = { i: [['+', '$i^+$'], ['-', '$i^-$']], o: [['+', '$o^+$'], ['c', '$o^c$']], z: [['+', '$z^+$'], ['-', '$z^-$']] };
        const mk = (lab, def) => v.select(lab, AL[lab.match(/\$([a-z])\$/)[1]].map(([value, label]) => ({ value, label })), def);
        const ch = { i: mk('chromosome $i$', '+'), o: mk('chromosome $o$', '+'), z: mk('chromosome $z$', '+') };
        const ep = { i: mk('F′ episome $i$', '-'), o: mk('F′ episome $o$', '+'), z: mk('F′ episome $z$', '-') };
        const dip = v.toggle('F′ episome present (partial diploid)', true);
        const PRESETS = {
          wt: ['+', '+', '+', null], dom: ['+', '+', '+', ['-', '+', '-']], trans: ['-', '+', '+', ['+', '+', '-']], cis1: ['+', 'c', '-', ['+', '+', '+']], cis2: ['+', 'c', '+', ['+', '+', '-']], con: ['-', '+', '+', null],
        };
        const pre = v.select('classic genotypes', [{ value: 'dom', label: '$i^+z^+ / i^-z^-$' }, { value: 'trans', label: '$i^-z^+ / i^+z^-$' }, { value: 'cis1', label: '$o^cz^- / o^+z^+$' }, { value: 'cis2', label: '$o^cz^+ / o^+z^-$' }, { value: 'con', label: 'haploid $i^-$' }, { value: 'wt', label: 'wild type' }], 'trans', {
          onChange: (k) => { const [i, o, z, e] = PRESETS[k]; ch.i.set(i); ch.o.set(o); ch.z.set(z); if (e) { ep.i.set(e[0]); ep.o.set(e[1]); ep.z.set(e[2]); dip.value = true; } else dip.value = false; },
        });
        const S = v.stage({ x: [0, 10], y: [0, 4.2], axes: false, height: 250, full: true });
        const Bs = v.stage({ x: [0.3, 3.7], y: [0, 2.3], axes: 'box', gutter: true, height: 240, full: true, ylabel: 'β-galactosidase (haploid induced = 1)', xticks: [[1, 'no inducer'], [3, 'with inducer']] });
        const REP = 0.001;
        const mol = () => { const m = [{ name: 'chromosome', i: ch.i.value, o: ch.o.value, z: ch.z.value }]; if (dip.value) m.push({ name: 'F′ episome', i: ep.i.value, o: ep.o.value, z: ep.z.value }); return m; };
        const out = (m, ind) => {
          const repressor = m.some((d) => d.i === '+') && !ind; // active repressor present (inducer inactivates it)
          return m.map((d) => { const on = d.o === 'c' || !repressor; return { on, level: d.z === '+' ? (on ? 1 : REP) : 0 }; });
        };
        v.render(() => {
          const m = mol(), un = out(m, false), ind = out(m, true);
          const yRow = (k) => (m.length === 1 ? 2.2 : 3.2 - k * 1.8);
          const rep = m.some((d) => d.i === '+');
          m.forEach((d, k) => {
            const y = yRow(k), x0 = 1.6;
            S.line(0.9, y, 9.3, y, { color: 'ink', width: 3 });
            S.text(d.name, 0.9, y + 0.62, { size: 12, color: 'muted', align: 'left' });
            const genes = [['i', 2.0], ['o', 5.0], ['z', 7.4]];
            for (const [g, gx] of genes) {
              const al = d[g], bad = (g === 'i' && al === '-') || (g === 'o' && al === 'c') || (g === 'z' && al === '-');
              const col = bad ? 'red' : g === 'i' ? 'blue' : g === 'o' ? 'orange' : 'green';
              const w = g === 'o' ? 0.55 : 1.0;
              S.rect(gx - w / 2, y - 0.3, gx + w / 2, y + 0.3, { fill: col, fillAlpha: bad ? 0.2 : 0.45, color: col, radius: 4 });
              S.text(g === 'i' ? (al === '+' ? 'i⁺' : 'i⁻') : g === 'o' ? (al === '+' ? 'o⁺' : 'oᶜ') : (al === '+' ? 'z⁺' : 'z⁻'), gx, y, { size: 13, color: 'ink', align: 'center', baseline: 'middle' });
            }
            const opBlocked = !(un[k].on), opCol = opBlocked ? 'red' : 'green';
            S.text(opBlocked ? 'blocked' : 'open', 5.0, y - 0.62, { size: 11, color: opCol, align: 'center' });
            if (m[k].z === '+') S.arrow(7.0, y + 0.45, 7.0 + (un[k].on ? 1.0 : 0.2), y + 0.45, { color: opCol, width: un[k].on ? 3 : 1.5, head: 6 });
            // repressor from every i+ in trans to every operator (uninduced)
            if (d.i === '+') for (let j = 0; j < m.length; j++) {
              const yj = yRow(j);
              if (j === k) S.curve((t) => [2.0 + 3.0 * t, y - 0.3 - 0.35 * Math.sin(Math.PI * t) * 0.7], 0, 1, { color: 'blue', width: 1.5 });
              else S.arrow(2.35, y - 0.35, 4.75, yj + (yj < y ? 0.3 : -0.3), { color: 'blue', width: 1.8, head: 6 });
            }
          });
          S.corner(rep ? 'repressor made (diffuses to every operator, cis and trans)' : 'no active repressor made', 'tr', { plate: true });
          const tot = (a) => a.reduce((s, q) => s + q.level, 0), u = tot(un), i2 = tot(ind);
          Bs.setView([0.3, 3.7], [0, Math.max(2.3, i2 * 1.2)]);
          m.forEach((d, k) => { Bs.rect(0.65 + k * 0.35, 0, 0.65 + k * 0.35 + 0.3, un[k].level, { fill: k ? 'teal' : 'accent', fillAlpha: 0.7, color: k ? 'teal' : 'accent' }); Bs.rect(2.65 + k * 0.35, 0, 2.65 + k * 0.35 + 0.3, ind[k].level, { fill: k ? 'teal' : 'accent', fillAlpha: 0.7, color: k ? 'teal' : 'accent' }); });
          Bs.text(`${v.fix(u, 3)}`, 1.1, Math.max(u, 0) + 0.06, { size: 12, color: 'ink', align: 'center', baseline: 'bottom' });
          Bs.text(`${v.fix(i2, 2)}`, 3.1, i2 + 0.06, { size: 12, color: 'ink', align: 'center', baseline: 'bottom' });
          ST.res = { u, i2, m };
        });
        v.legend([['accent', 'gene on chromosome'], ['teal', 'gene on F′ episome']]);
        v.readout(() => {
          const { u, i2, m } = ST.res || { u: 0, i2: 0, m: [] };
          const g = m.map((d) => `${d.i === '+' ? 'i⁺' : 'i⁻'}${d.o === '+' ? 'o⁺' : 'oᶜ'}${d.z === '+' ? 'z⁺' : 'z⁻'}`).join(' / F′ ');
          let verdict;
          if (i2 === 0) verdict = 'no enzyme at all (no functional z gene)';
          else if (u > 0.3 * i2) verdict = '**constitutive**';
          else if (u < 0.02 * i2) verdict = `**inducible** (induction ratio about ${v.fix(i2 / Math.max(u, 1e-9), 0)}-fold)`;
          else verdict = 'partly constitutive';
          return `${g}: without inducer ${v.fix(u, 3)}, with inducer ${v.fix(i2, 2)} → ${verdict}.\nRules used: any $i^+$ copy makes repressor that reaches all operators (trans); an operator $o^+$ is blocked unless inducer is present; $o^c$ never binds repressor, and affects only the $z$ on its own molecule (cis). Paper's conclusions reproduced: $i^+$ dominant over $i^-$; $o^c$ cis-dominant.`;
        });
      },
    },
  ],
};
