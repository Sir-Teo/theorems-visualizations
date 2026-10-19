// Stochastic Processes — Chapter 3 (part b): items 3.9–3.13 (branching processes and the two landmark papers)
import { STATE_COL, offspring, meanOf, pgf, extinction, cumOf, draw, growTree, layoutTree, preorder, simGen, progenyLaw, genDist, uSeq, returnedBy, simWalkersZd } from './ch03.shared.js';

import { WATSON_BINOMIAL, WATSON_TERNARY, evenCdfSteps } from './source-audit.shared.js';

const FAMILIES = [{ value: 'poisson', label: 'Poisson' }, { value: 'binary', label: '0 or 2 children' }, { value: 'geometric', label: 'geometric' }];
const famName = { poisson: 'Poisson', binary: 'binary splitting', geometric: 'geometric' };

/** Bar chart of an offspring law on a small stage. */
function drawLaw(s, p, color) {
  const K = Math.min(p.length, 8);
  s.bars(p.slice(0, K), { x0: 0, dx: 1, color });
}

export default {
  collection: 'stoch',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9', kind: 'Model', name: 'Galton–Watson branching process',
      statement: String.raw`Let $\xi$ be a random variable on $\{0,1,2,\dots\}$ with law $(p_k)$ (the **offspring distribution**) and mean $\mu=\mathbb E\xi$. Start with one individual, $Z_0=1$. Each individual of generation $n$ has an independent number of children with the law of $\xi$, so $Z_{n+1}=\xi^{(n,1)}+\dots+\xi^{(n,Z_n)}$. The sequence $(Z_n)$ is a Markov chain on $\{0,1,2,\dots\}$ in which $0$ is absorbing, and $\mathbb E[Z_n]=\mu^n$. The process is **subcritical**, **critical** or **supercritical** according as $\mu<1$, $=1$ or $>1$.`,
      scope: String.raw`Individuals reproduce independently and identically; no interaction, no dependence on generation or on the population size. Critical case: $\xi\equiv1$ is excluded (the population never changes).`,
      idea: String.raw`Conditioning on $Z_n$ gives $\mathbb E[Z_{n+1}\mid Z_n]=\mu Z_n$ (Wald's identity for a random sum), so $\mathbb E Z_n=\mu^n$ by induction: on average the population grows or shrinks by the factor $\mu$ per generation. Because $0$ is absorbing, the chain is not irreducible: the state $0$ is recurrent and every other state is transient (when $p_0>0$, a population of $k\ge1$ has a positive chance $p_0^k$ of dying out in one step; the nondegenerate no-zero-offspring case instead grows without settling at a positive finite size). So $Z_n\to0$ or $Z_n\to\infty$; the question of which has which probability is 3.10.`,
      caption: String.raw`Pick an offspring law and its mean $\mu$. Left: the law. Middle: one family tree grown for up to 8 generations (orange discs: still alive at the cut-off; red rings: lines that ended; the tree stops at 250 individuals). Right: population sizes of 25 independent runs on a log scale (a red cross marks extinction; runs above $10^4$ individuals are no longer followed) beside the mean $\mu^n$ (dashed). For $\mu\le1$ nearly everything dies; for $\mu>1$ some runs die early but the survivors grow like $\mu^n$.`,
      deps: ['stoch-1.1'], refs: ['Grimmett–Stirzaker §5.4', 'Norris §5.1'], credit: 'I. J. Bienaymé 1845; F. Galton and H. W. Watson 1873–75', tags: ['branching', 'Galton–Watson'],
      viz(v) {
        const fam = v.select('offspring law', FAMILIES, 'poisson', { onChange: () => rebuild() });
        const mu = v.slider('mean $\\mu$', 0.3, 2, 1.3, { step: 0.05, onChange: () => rebuild() });
        const nGen = v.slider('generation $n$ for the average', 1, 10, 6, { int: true, step: 1 });
        let seed = 11; v.button('new tree and runs', () => { seed++; rebuild(); });
        const s0 = v.stage({ x: [-0.7, 8.7], y: [0, 1], axes: 'box', gutter: true, height: 280, xlabel: 'children $k$', ylabel: '$p_k$', title: 'offspring law', weight: 0.6, minWidth: 200 });
        const s1 = v.stage({ x: [-1, 10], y: [-8.5, 0.7], axes: false, height: 280, title: 'a family tree' });
        const s2 = v.stage({ x: [0, 18], y: [0.8, 3e4], ylog: true, axes: 'box', gutter: true, height: 280, xlabel: 'generation $n$', ylabel: 'population $Z_n$', title: '25 runs' });
        let p, m, tree, runs, avg;
        function rebuild() {
          p = offspring(fam.value, mu.value); m = meanOf(p);
          const R = v.rng(seed * 19 + 3);
          tree = growTree(p, R, 8, 250); const leaves = layoutTree(tree);
          const gmax = Math.max(...tree.map((n) => n.gen));
          s1.setView([-1, Math.max(leaves, 6)], [-gmax - 0.7, 0.7]);
          const C = cumOf(p);
          runs = Array.from({ length: 25 }, () => simGen(C, R, 18, 10000));
          const avgRuns = Array.from({ length: 500 }, () => simGen(C, R, 10, 1e6));
          avg = Array.from({ length: 11 }, (_, g) => avgRuns.reduce((a, z) => a + (isFinite(z[g]) ? z[g] : 0), 0) / avgRuns.length);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          drawLaw(s0, p, 'accent');
          s0.setView([-0.7, 8.7], [0, Math.max(0.1, ...p.slice(0, 9)) * 1.15]);
          tree.forEach((n) => { if (n.parent >= 0) { const q = tree[n.parent]; s1.line(q.x, q.y, n.x, n.y, { color: 'muted', width: 1.3 }); } });
          tree.forEach((n) => {
            if (n.open) s1.dot(n.x, n.y, { r: 4, color: 'orange' });
            else if (!n.kids.length) s1.dot(n.x, n.y, { r: 3.5, color: 'red', hollow: true });
            else s1.dot(n.x, n.y, { r: 3.5, color: 'accent' });
          });
          s1.dot(tree[0].x, 0, { r: 6, color: 'ink' });
          runs.forEach((z, i) => {
            const pts = []; let died = -1;
            for (let g = 0; g < z.length; g++) { if (z[g] === 0) { died = g; break; } if (!(z[g] > 0)) break; pts.push([g, z[g]]); }
            s2.path(pts, { color: STATE_COL[i % 8], width: 1.4, alpha: 0.8 });
            if (died > 0) s2.dot(died, 1, { color: 'red', r: 3.5, hollow: true });
          });
          s2.fn((g) => m ** g, { color: 'ink', dash: true, width: 2, domain: [0, 18], n: 60 });
        });
        v.legend([['ink', 'mean $\\mu^n$', { dash: true }], ['orange', 'alive at the cut-off', { dot: true }], ['red', 'line ended', { dot: true }]]);
        v.readout(() => {
          const g = nGen.value, alive = runs.filter((z) => z[18] > 0 || Number.isNaN(z[18])).length;
          return `${famName[fam.value]} offspring, $\\mu=${v.fix(m, 3)}$ — ${m < 1 - 1e-9 ? 'subcritical' : Math.abs(m - 1) < 1e-9 ? 'critical' : 'supercritical'}. Average of $Z_{${g}}$ over 500 runs: **${v.fix(avg[g], 2)}**, against $\\mu^{${g}}=${v.fix(m ** g, 2)}$. Of the 25 plotted runs, ${alive} are still alive after 18 generations.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10', kind: 'Theorem', name: 'Extinction probability is the least fixed point of the offspring PGF',
      statement: String.raw`Let $f(s)=\sum_kp_ks^k$ be the offspring generating function, with $0<p_0<1$ (if $p_0=0$ there is never extinction; if $p_0=1$ it is immediate). The probability of eventual extinction $\rho=\Pr(Z_n=0\text{ for some }n)$ is the smallest root of $s=f(s)$ in $[0,1]$. Moreover $\Pr(Z_n=0)=f^{(n)}(0)$ (the $n$-fold composition) increases to $\rho$. If $\mu\le1$ then $\rho=1$; if $\mu>1$ then $\rho<1$ is the unique root in $[0,1)$.`,
      idea: String.raw`The generating function of $Z_{n+1}$ is $f_n\circ f$, hence $\Pr(Z_n=0)=f^{(n)}(0)$ by induction. The sequence $0,f(0),f(f(0)),\dots$ is increasing (as $f$ is increasing and $f(0)\ge0$) and bounded by 1, so it converges to a fixed point, and a monotone comparison shows that it is the smallest one. The function $f$ is convex with $f(1)=1$ and $f'(1)=\mu$: when $\mu\le1$ the graph stays above the diagonal until $s=1$, when $\mu>1$ it dips below the diagonal near $s=1$ and, by the intermediate value theorem (pma-4.23), must cross it at some $\rho<1$ since $f(0)=p_0>0$.`,
      caption: String.raw`The cobweb starts at $s=0$: go up to the graph of $f$, across to the diagonal, up again, and so on. Raise the number of steps $n$ and the staircase climbs to the first crossing of the diagonal (green disc). Drag the mean $\mu$ across 1: below it the only crossing is at $s=1$ and the staircase creeps toward it ever more slowly near $\mu=1$; above it a new crossing $\rho<1$ appears and the staircase stops there. Right: $\Pr(Z_n=0)=f^{(n)}(0)$ (line) against the fraction of 1500 simulated families extinct by generation $n$ (dots; later outcomes are unobserved once a family passes 400 individuals, so these are known-extinction fractions and can undercount extinctions).`,
      deps: ['stoch-3.9', 'pma-4.23'], refs: ['Grimmett–Stirzaker §5.4'], tags: ['branching', 'generating functions', 'fixed point'],
      viz(v) {
        const fam = v.select('offspring law', FAMILIES, 'poisson', { onChange: () => rebuild() });
        const mu = v.slider('mean $\\mu$', 0.4, 2, 1.5, { step: 0.01, onChange: () => rebuild() });
        const nSt = v.slider('cobweb steps $n$', 0, 60, 8, { int: true, step: 1 });
        let seed = 21; v.button('resample', () => { seed++; rebuild(); });
        const GEN = 60, NR = 1500;
        const s1 = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$s$', ylabel: '$f(s)$', title: 'cobweb of $s\\mapsto f(s)$ from $0$' });
        const s2 = v.stage({ x: [0, GEN], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'generation $n$', ylabel: '$\\Pr(Z_n=0)$', title: 'extinct by generation $n$' });
        let p, m, rho, orbit, simExt;
        function rebuild() {
          p = offspring(fam.value, mu.value); m = meanOf(p); rho = extinction(p);
          orbit = [0]; for (let i = 0; i < GEN; i++) orbit.push(pgf(p, orbit[i]));
          const R = v.rng(seed * 23 + 1), C = cumOf(p), ext = new Int32Array(GEN + 1);
          for (let r = 0; r < NR; r++) {
            let z = 1, g = 0;
            while (g < GEN && z > 0 && z <= 400) { let s = 0; for (let i = 0; i < z; i++) s += draw(C, R()); z = s; g++; }
            if (z === 0) ext[g]++;
          }
          simExt = []; let c = 0; for (let g = 0; g <= GEN; g++) { c += ext[g]; simExt.push(c / NR); }
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.fn((s) => pgf(p, s), { color: 'accent', width: 2.5, domain: [0, 1], n: 100 });
          s1.line(0, 0, 1, 1, { color: 'muted', width: 1.5 });
          const k = nSt.value; let s = 0; const pts = [[0, 0]];
          for (let i = 0; i < k; i++) { const t = pgf(p, s); pts.push([s, t], [t, t]); s = t; }
          s1.path(pts, { color: 'gold', width: 1.8 });
          s1.dot(s, s, { color: 'gold', r: 5 });
          s1.dot(rho, rho, { color: 'green', r: 7 });
          if (rho < 1 - 1e-9) s1.dot(1, 1, { color: 'ink', r: 5, hollow: true });
          s2.path(orbit.map((x, i) => [i, x]), { color: 'accent', width: 2.5 });
          s2.dots(simExt.map((x, i) => [i, x]), { r: 3.5, color: 'gold' });
          s2.hline(rho, { color: 'green', dash: true, width: 2 });
          s2.hline(1, { color: 'faint', dash: true });
          s2.vline(k, { color: 'faint', dash: true });
        });
        v.legend([['accent', '$f^{(n)}(0)$', {}], ['gold', 'simulation', { dot: true }], ['green', '$\\rho$ (least fixed point)', { dash: true }]]);
        v.readout(() => {
          const k = nSt.value;
          return `${famName[fam.value]}, $\\mu=${v.fix(m, 3)}$: least root of $f(s)=s$ is $\\rho=${v.fix(rho, 5)}$${m <= 1 + 1e-12 ? ' (because $\\mu\\le1$)' : ''}. After $n=${k}$ steps the cobweb is at $f^{(${k})}(0)=${v.fix(orbit[k], 5)}$ and the known simulated fraction extinct by generation ${k} is ${v.fix(simExt[Math.min(k, GEN)], 3)}; by generation ${GEN} it is ${v.fix(simExt[GEN], 3)}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11', kind: 'Theorem', name: 'Total progeny and the hitting-time theorem',
      statement: String.raw`Let $T=\sum_{n\ge0}Z_n$ be the total number of individuals ever born in a Galton–Watson process (with $T=\infty$ if the family survives). Then for $n\ge1$
$$\Pr(T=n)=\frac1n\Pr(\xi_1+\dots+\xi_n=n-1),$$
where $\xi_1,\xi_2,\dots$ are i.i.d. with the offspring law. For Poisson($\mu$) offspring this is the **Borel distribution** $\Pr(T=n)=e^{-\mu n}(\mu n)^{n-1}/n!$. Except for deterministic one-child offspring, for $\mu\le1$ we have $T<\infty$ almost surely; for $\mu>1$ the probabilities add up only to the extinction probability $\rho$.`,
      scope: String.raw`Independent identical offspring; the formula is for the total progeny of a single ancestor.`,
      idea: String.raw`Explore the tree depth first (preorder). Keep $S_k=\sum_{i\le k}(\xi_i-1)$, where $\xi_i$ is the number of children of the $i$-th explored individual: $S_k+1$ counts the individuals discovered but not yet explored. The exploration stops exactly when $S_k$ first hits $-1$, and the number of explored individuals is $T$. So $T$ is the hitting time of $-1$ for a walk with steps $\xi-1\ge-1$ (skip-free to the left), and the hitting-time theorem (2.11) says $\Pr(T=n)=\frac1n\Pr(S_n=-1)$, which is the displayed formula. Equivalently, the generating function $h$ of $T$ solves $h(z)=z\,f(h(z))$ and Lagrange inversion (comb-4.13) reads off its coefficients as $\frac1n[w^{n-1}]f(w)^n$.`,
      caption: String.raw`Left: a tree selected for readability (up to 200 draws seeking a completed tree of 7–28 individuals), numbered in depth-first order. Slide $k$: the first $k$ explored individuals are filled in. Middle: the exploration walk $S_k$, which rises by (children − 1) at each explored individual; the family is complete exactly when it first touches $-1$ (green), at $k=T$. Right: histogram of $T$ over 4000 random families against the formula $\frac1n\Pr(\xi_1+\dots+\xi_n=n-1)$ (dots) computed by convolution. The displayed bars only count $T\le40$; completed families up to 300 contribute to the completion fraction, while outcomes beyond 300 are censored, not declared infinite. A cropped tree has unknown total progeny, and its exploration stops at the first individual whose offspring were not sampled. For nondegenerate finite-variance critical offspring, the total-progeny mass has order $n^{-3/2}$ on its support.`,
      deps: ['stoch-3.10', 'stoch-2.11', 'comb-4.13'], refs: ['Grimmett–Stirzaker §5.4'], credit: 'R. Otter 1949 (one ancestor); M. Dwass 1969 (hitting-time form); É. Borel 1942 (Poisson case)', tags: ['branching', 'hitting time', 'Lagrange inversion'],
      viz(v) {
        const fam = v.select('offspring law', FAMILIES, 'poisson', { onChange: () => rebuild() });
        const mu = v.slider('mean $\\mu$', 0.4, 1.4, 0.9, { step: 0.05, onChange: () => rebuild() });
        const kk = v.slider('explored individuals $k$', 0, 60, 8, { int: true, step: 1 });
        let seed = 31; v.button('new tree', () => { seed++; rebuild(); });
        const NB = 40;
        const s1 = v.stage({ x: [-1, 10], y: [-8, 0.7], axes: false, height: 320, title: 'tree, individuals numbered depth-first' });
        const s2 = v.stage({ x: [0, 40], y: [-3, 6], axes: 'box', gutter: true, height: 320, xlabel: '$k$', ylabel: '$S_k$', title: 'exploration walk' });
        const s3 = v.stage({ x: [0, NB + 1], y: [0, 0.5], axes: 'box', gutter: true, height: 320, xlabel: 'total progeny $n$', ylabel: '$\\Pr(T=n)$', title: 'total progeny' });
        let p, m, rho, tree, order, walk, Tsize, sim, law, finiteFrac;
        function rebuild() {
          p = offspring(fam.value, mu.value); m = meanOf(p); rho = extinction(p);
          const R = v.rng(seed * 41 + 7);
          let tries = 0;
          do { tree = growTree(p, R, 40, 70); tries++; } while (tries < 200 && (tree.some((n) => n.open) || tree.length < 7 || tree.length > 28));
          const leaves = layoutTree(tree); const gmax = Math.max(...tree.map((n) => n.gen));
          s1.setView([-1, Math.max(leaves, 5)], [-gmax - 0.7, 0.7]);
          order = preorder(tree); const rank = new Array(tree.length); order.forEach((id, k) => { rank[id] = k + 1; });
          tree.forEach((n, i) => { n.rank = rank[i]; });
          walk = [0]; let S = 0; for (const id of order) { if (tree[id].childCount === undefined) break; S += tree[id].childCount - 1; walk.push(S); }
          Tsize = tree.some((n) => n.open) ? undefined : tree.length;
          s2.setView([0, walk.length], [Math.min(-2, ...walk) - 0.7, Math.max(3, ...walk) + 0.7]);
          kk.input.max = walk.length - 1; kk.set(Math.min(kk.value, walk.length - 1));
          // histogram of total progeny
          const C = cumOf(p), counts = new Array(NB + 2).fill(0); let fin = 0; const NT = 4000;
          for (let r = 0; r < NT; r++) {
            let open = 1, tot = 0;
            while (open > 0 && tot < 300) { open += draw(C, R()) - 1; tot++; }
            if (open === 0) { fin++; counts[Math.min(NB + 1, tot)]++; }
          }
          sim = counts.map((c) => c / NT); finiteFrac = fin / NT;
          law = progenyLaw(p, NB);
          const top = Math.max(0.05, ...sim.slice(1, NB + 1), ...law) * 1.15; s3.setView([0, NB + 1], [0, top]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const k = Math.min(kk.value, walk.length - 1);
          tree.forEach((n) => { if (n.parent >= 0) { const q = tree[n.parent]; s1.line(q.x, q.y, n.x, n.y, { color: 'muted', width: 1.3 }); } });
          tree.forEach((n) => {
            const done = n.rank <= k;
            s1.dot(n.x, n.y, { r: done ? 8 : 5, color: n.rank === k ? 'gold' : done ? 'accent' : 'faint', hollow: !done });
            if (done) s1.text(String(n.rank), n.x, n.y, { size: 9, align: 'center', baseline: 'middle', color: 'panel' });
          });
          s2.path(walk.map((w, i) => [i, w]), { color: 'faint', width: 1.4 });
          s2.path(walk.slice(0, k + 1).map((w, i) => [i, w]), { color: 'accent', width: 2.6 });
          s2.hline(-1, { color: 'green', dash: true, width: 2 });
          s2.dot(k, walk[k], { color: 'gold', r: 5 });
          if (isFinite(Tsize)) { s2.dot(Tsize, -1, { color: 'green', r: 6 }); s2.text(`$T=${Tsize}$`, Tsize, -1, { color: 'green', dy: 16, dx: -6, align: 'right', size: 13 }); }
          s3.bars(sim.slice(1, NB + 1), { x0: 1, dx: 1, color: 'accent' });
          law.slice(1).forEach((q, i) => s3.dot(i + 1, q, { color: 'ink', r: 3.5 }));
        });
        v.legend([['accent', 'simulated $T$', { area: true }], ['ink', '$\\frac1n\\Pr(\\xi_1+\\dots+\\xi_n=n-1)$', { dot: true }], ['green', 'hits $-1$ at $k=T$', { dash: true }]]);
        v.readout(() => {
          const sumLaw = law.reduce((a, b) => a + b, 0);
          const k = Math.min(kk.value, walk.length - 1);
          return `${famName[fam.value]}, $\\mu=${v.fix(m, 2)}$. This tree has ${isFinite(Tsize) ? `$T=${Tsize}$ individuals` : 'unknown total progeny beyond the drawing cutoffs'}; at $k=${k}$ the walk stands at $S_k=${walk[k]}$. Completed by 300: $${v.fix(finiteFrac, 3)}$ of samples, a censored comparison with eventual extinction probability $\\rho=${v.fix(rho, 3)}$; the formula's mass for $n\\le${NB}$ is ${v.fix(sumLaw, 3)} against ${v.fix(sim.slice(1, NB + 1).reduce((a, b) => a + b, 0), 3)} simulated.${fam.value === 'poisson' ? ` (Poisson: $\\Pr(T=5)=e^{-5\\mu}(5\\mu)^4/5!=${v.fix(Math.exp(-5 * m) * (5 * m) ** 4 / 120, 4)}$ from the Borel formula, ${v.fix(law[5], 4)} from the convolution.)` : ''}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12', kind: 'Paper', name: 'On the probability of the extinction of families',
      paper: { authors: 'H. W. Watson and Francis Galton', year: 1875, title: 'On the Probability of the Extinction of Families', venue: 'Journal of the Anthropological Institute of Great Britain and Ireland 4: 138–144', doi: '10.2307/2841222' },
      introduces: ['stoch-3.9', 'prob-4.3.8a'],
      statement: String.raw`Galton asks how many surnames disappear, or have exactly $m$ male bearers, after $r$ generations. Watson obtains the iterated offspring generating function $f^{(r)}$, with extinction probability $f^{(r)}(0)$. On p.143 he incorrectly identifies the limiting fixed point with $1$ for his binomial family; on p.144 he conjectures the same conclusion more generally. The modern limit is the **least** root $\rho$ of $f(s)=s$. For a nondegenerate finite offspring law, extinction is certain when $\mu\le1$; the exception $\Pr(\xi=1)=1$ has $\rho=0$.`,
      scope: String.raw`The paper's problem uses independent identical numbers of adult sons on $0,\ldots,5$; its subsequent algebra permits other finite offspring laws. This is a modern reconstruction. Buttons reproduce the laws used on pp.141–143: uniform on $\{0,1,2\}$ and $\operatorname{Binomial}(5,1/4)$. They are mathematical examples, not observations of real families.`,
      idea: String.raw`Conditioning on one generation composes generating functions, so the coefficient of $s^m$ in $f^{(r)}(s)$ answers Galton's second question. Iteration from zero increases to the least fixed point. Watson's binomial example has $f(s)=((3+s)/4)^5$ and $\mu=5/4$; its least root is about $0.55271867$, even though $1$ is also a root. This gives a direct counterexample to the conclusion printed on p.143. The critical exception and modern extinction theorem are stated in Durrett 4.3.10–4.3.12.`,
      caption: String.raw`Adjust six nonnegative weights, normalized to sum to one; all zero means no sons. Left: exact PGF extinction probabilities (blue), observed extinctions in 2000 sampled families (gold), and the least fixed point (green). Once a generation exceeds 4000, that family's later outcomes are unobserved. The grey band runs from known extinctions to known extinctions plus these censored families; it is an uncertainty range for the sample, not a confidence interval. Right: observed counts for $1\le m\le20$ and exact PGF expectations. Censored families can contribute unknown additional counts; mass at zero and above 20 is omitted.`,
      deps: ['comb-4.1'], refs: ['Watson–Galton (1875), pp.139–144', 'Durrett 4.3.10–4.3.12'], credit: 'H. W. Watson and F. Galton, 1875', tags: ['branching', 'extinction', 'surnames'],
      links: { source: 'https://math.uchicago.edu/~shmuel/Modeling/Galton%20Watson.pdf' },
      viz(v) {
        const defs = [0.34, 0.30, 0.20, 0.10, 0.05, 0.01];
        const sl = defs.map((d, k) => v.slider(`$a_${k}$`, 0, 1, d, { step: 0.01, onChange: () => rebuild() }));
        const rr = v.slider('generation $r$', 1, 12, 5, { int: true, step: 1 });
        const preset = (p) => { p.forEach((x, k) => sl[k].set(x)); rebuild(); };
        v.button('Watson: uniform 0, 1, 2', () => preset(WATSON_TERNARY));
        v.button('Watson: binomial (5, 1/4)', () => preset(WATSON_BINOMIAL));
        v.button('one child with certainty', () => preset([0, 1, 0, 0, 0, 0]));
        const wat = v.toggle("show Watson's conclusion (ρ = 1)", true);
        let seed = 41; v.button('resample', () => { seed++; rebuild(); });
        const NS = 2000, GEN = 25, MM = 20;
        const s1 = v.stage({ x: [0, GEN], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'generation $r$', ylabel: 'proportion of surnames extinct', title: 'extinct surnames' });
        const s2 = v.stage({ x: [0, MM + 1], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'men $m$ bearing a surname', ylabel: 'number of surnames', title: 'surnames held by $m$ men' });
        let p, m, rho, orbit, ext, censored, sizes, exactSizes;
        function rebuild() {
          let w = sl.map((s) => s.value); let tot = w.reduce((a, b) => a + b, 0); if (tot < 1e-9) { w = [1, 0, 0, 0, 0, 0]; tot = 1; }
          p = w.map((x) => x / tot); m = meanOf(p); rho = extinction(p);
          orbit = [0]; for (let i = 0; i < GEN; i++) orbit.push(pgf(p, orbit[i]));
          const R = v.rng(seed * 43 + 5), C = cumOf(p);
          const runs = Array.from({ length: NS }, () => simGen(C, R, GEN, 4000));
          ext = Array.from({ length: GEN + 1 }, (_, g) => runs.filter((z) => z[g] === 0).length / NS);
          censored = Array.from({ length: GEN + 1 }, (_, g) => runs.filter(z => Number.isNaN(z[g])).length);
          sizes = Array.from({ length: 13 }, (_, r) => { const c = new Array(MM + 1).fill(0); runs.forEach((z) => { const x = z[r]; if (x >= 1 && x <= MM) c[x]++; }); return c; });
          exactSizes = Array.from({ length: 13 }, (_, r) => genDist(p, r, MM).map((x) => x * NS));
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.poly([...ext.map((x, i) => [i, x + censored[i] / NS]), ...ext.map((x, i) => [i, x]).reverse()], { fill: 'muted', fillAlpha: .25, stroke: false });
          s1.path(orbit.map((x, i) => [i, x]), { color: 'accent', width: 2.5 });
          s1.dots(ext.map((x, i) => [i, x]), { r: 3.5, color: 'gold' });
          s1.hline(rho, { color: 'green', dash: true, width: 2 });
          if (wat.value && rho < 1 - 1e-9) { s1.hline(1, { color: 'red', dash: true, width: 2 }); s1.text('Watson: 1', GEN, 1, { color: 'red', align: 'right', dy: 14, size: 12 }); }
          s1.vline(rr.value, { color: 'faint', dash: true });
          const r = rr.value, c = sizes[r], ex = exactSizes[r];
          const top = Math.max(5, ...c.slice(1), ...ex.slice(1)) * 1.15; s2.setView([0, MM + 1], [0, top]);
          s2.bars(c.map((x, i) => (i === 0 ? 0 : x)), { x0: 0, dx: 1, color: 'accent' });
          ex.forEach((x, i) => { if (i >= 1) s2.dot(i, x, { color: 'ink', r: 3.5 }); });
        });
        v.legend([['accent', 'PGF curve / sampled count bars'], ['gold', 'known sampled extinctions', { dot: true }], ['ink', 'PGF count expectations', { dot: true }], ['muted', 'censoring range', { area: true }], ['green', '$\\rho$', { dash: true }]]);
        v.readout(() => {
          const r = rr.value;
          return String.raw`Mean $\mu=${v.fix(m, 6)}$. At $r=${r}$, exact extinction probability $${v.fix(orbit[r], 6)}$; ${Math.round(ext[r] * NS)} known sampled extinctions, ${censored[r]} censored families (possible fraction ${v.fix(ext[r], 3)}–${v.fix(ext[r] + censored[r] / NS, 3)}). Least fixed point $\rho=${v.fix(rho, 8)}$${p[1] === 1 ? ': deterministic one-child exception; no surname dies' : rho < 1 ? `; survival probability ${v.fix(1 - rho, 6)}` : '; eventual extinction is certain'}. For $m=1$: PGF expectation ${v.fix(exactSizes[r][1], 2)} surnames; sampled counts omit unknown censored outcomes. At generation ${GEN}: ${censored[GEN]} of ${NS} families censored.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13', kind: 'Paper', name: 'Über eine Aufgabe … betreffend die Irrfahrt im Straßennetz',
      paper: { authors: 'Georg Pólya', year: 1921, title: 'Über eine Aufgabe der Wahrscheinlichkeitsrechnung betreffend die Irrfahrt im Straßennetz', venue: 'Mathematische Annalen 84: 149–160', doi: '10.1007/BF01458701' },
      introduces: ['stoch-3.5'],
      statement: String.raw`For symmetric nearest-neighbour walk on $\mathbb Z^d$, each of the $2d$ directions has probability $1/(2d)$. Pólya's 1921 paper proves that the walk returns to its starting point with probability one for $d=1,2$, and with probability strictly below one for $d\ge3$. Reapplying the Markov property gives infinitely many returns almost surely in the recurrent cases. The dimension dichotomy follows from the divergence or convergence of $\sum_n\Pr_0(S_{2n}=0)$, whose terms have order $n^{-d/2}$.`,
      scope: String.raw`Original paper: pp.149–150 define the walk and state the dimension result; §§3–5, pp.153–157 give the return asymptotics and first-hit generating-function argument. The figure is a modern simulation. Its approximate three-dimensional limit $0.34053733$ is a modern reference value (Durrett, fifth edition, p.298), not a number claimed to have been computed in the 1921 paper.`,
      idea: String.raw`Pólya expresses transition probabilities by a Fourier integral and identifies its asymptotically important neighborhoods. His return and first-hit generating functions then connect the infinite return sum with eventual hitting probability. In one dimension $\Pr(S_{2n}=0)=\binom{2n}{n}/4^n$; in two it is the square of this quantity. A renewal equation separates the first return from subsequent returns, giving the finite-time CDF drawn here.`,
      caption: String.raw`500 independent walkers start at the origin. Green marks a walker that has returned by the selected integer time; blue means no return yet. One-dimensional walkers have artificial vertical jitter for visibility; the three-dimensional picture projects onto the first two coordinates, while return detection uses all three. All current positions fit in the displayed window. Right: integer-time step CDFs, sampled (gold) and computed from exact combinatorial return formulas in floating point (blue), with the limiting probability dashed. Sampling error remains; failure to return by time 2000 does not mean never returning.`,
      deps: ['comb-1.6', 'stoch-3.1'], refs: ['Pólya (1921), §§1–5', 'Durrett, fifth edition, p.298'], credit: 'G. Pólya, 1921', tags: ['random walk', 'recurrence', 'dimension'],
      links: { source: 'https://gdz.sub.uni-goettingen.de/download/pdf/PPN235181684_0084/LOG_0016.pdf' },
      viz(v) {
        const dd = v.select('dimension $d$', ['1', '2', '3'], '2', { onChange: () => rebuild() });
        const TT = v.slider('time $t$', 1, 2000, 100, { int: true, step: 1 });
        let seed = 51; v.button('resample', () => { seed++; rebuild(); });
        const M = 500, T = 2000;
        const s1 = v.stage({ x: [-10, 10], y: [-10, 10], equal: true, axes: false, height: 340, title: 'walkers on the street network' });
        const s2 = v.stage({ x: [0, T], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'time $t$', ylabel: 'fraction that has been home', title: 'who has come home?' });
        let sim, d, Fex, simCurve, jit;
        function rebuild() {
          d = +dd.value; const R = v.rng(seed * 61 + d);
          sim = simWalkersZd(R, d, M, T, true);
          jit = Array.from({ length: M }, () => R() * 2 - 1);
          Fex = returnedBy(uSeq(d, T / 2)).F;
          const f = Array.from(sim.first).filter((x) => x > 0).sort((a, b) => a - b);
          const sampled = new Array(T / 2 + 1).fill(0); let k = 0; for (let n = 0; n <= T / 2; n++) { while (k < f.length && f[k] <= 2 * n) k++; sampled[n] = k / M; }
          simCurve = evenCdfSteps(sampled);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const t = TT.value, base = t * M * d;
          let extent = 0; for (let w = 0; w < M; w++) for (let a = 0; a < Math.min(2, d); a++) extent = Math.max(extent, Math.abs(sim.pos[base + w * d + a]));
          const L = Math.max(6, extent + 1);
          s1.setView([-L, L], [-L, L]);
          if (d === 2 && L < 30) { for (let g = -Math.floor(L); g <= Math.floor(L); g++) { s1.line(g, -L, g, L, { color: 'grid', width: 0.7 }); s1.line(-L, g, L, g, { color: 'grid', width: 0.7 }); } }
          let home = 0;
          for (let w = 0; w < M; w++) {
            const x = sim.pos[base + w * d], y = d === 1 ? jit[w] * L * 0.6 : sim.pos[base + w * d + 1];
            const been = sim.first[w] > 0 && sim.first[w] <= t; if (been) home++;
            s1.dot(x, y, { r: 3, color: been ? 'green' : 'accent' });
          }
          s1.dot(0, 0, { r: 7, color: 'ink', hollow: true });
          s1.text('home', 0, 0, { dy: -14, size: 12, color: 'ink', align: 'center' });
          s2.path(evenCdfSteps(Fex), { color: 'accent', width: 2.5 });
          s2.path(simCurve, { color: 'gold', width: 2 });
          const lim = d === 3 ? .34053733 : 1; s2.hline(lim, { color: 'muted', dash: true });
          s2.vline(t, { color: 'faint', dash: true });
        });
        v.legend([['green', 'has been home', { dot: true }], ['accent', 'never yet', { dot: true }], ['gold', 'simulated fraction', {}], ['muted', 'Pólya limit', { dash: true }]]);
        v.readout(() => {
          const t = TT.value; let home = 0; for (let w = 0; w < M; w++) if (sim.first[w] > 0 && sim.first[w] <= t) home++;
          return `$d=${d}$, $t=${t}$: ${home} of ${M} walkers have been home (**${v.fix(home / M, 3)}**); computed finite-time probability ${v.fix(Fex[Math.floor(t / 2)], 6)}; estimated sampling s.e. ${v.fix(Math.sqrt(home / M * (1 - home / M) / M), 4)}. Limit: ${d <= 2 ? '1 (recurrent: $\\sum_n n^{-d/2}$ diverges)' : `${.34053733} (transient: $\\sum_n n^{-3/2}$ converges)`}.`;
        });
      },
    },
  ],
};
