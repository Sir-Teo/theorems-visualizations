// Probability: Theory and Examples (Durrett) — Chapter 5, part Z2: Harris chains on a general state space (§5.8)
import { PHI, gcd, phi, fx, minor, harrisStep, stationaryVar, gridAR, bookSplitGrid as splitGrid, vecP, vecM, matVecR, matMulS, cdfSample, tvNormal, stationary } from './ch05-z.shared.js';

const markovDef = 'prob-5.1.1a';
const SPLIT_CREDIT = 'Harris, 1956; Durrett follows Athreya and Ney, 1978';
const bars = (S, vals, x0, w, opts) => vals.forEach((h, i) => S.rect(x0 + i * w, 0, x0 + (i + 1) * w, h, opts));

/** Regeneration cycles of the AR(1) chain: occupation counts of the states X_0..X_{T-1} of each cycle (X_0 ~ nu). */
function cycles(mn, N, rng, nb, lo, hi, cap = 600000) {
  const counts = new Float64Array(nb), pending = new Float64Array(nb), w = (hi - lo) / nb; let x = mn.sample(rng), c = 0, steps = 0, T = 0, completeSteps = 0;
  while (c < N && steps < cap) {
    const b = Math.floor((x - lo) / w); if (b >= 0 && b < nb) pending[b]++; T++;
    const [y, reg] = harrisStep(x, mn, rng); steps++; x = y;
    if (reg) { c++; completeSteps += T; T = 0; pending.forEach((n,i) => counts[i] += n); pending.fill(0); }
  }
  return { counts, N: c, meanT: completeSteps / Math.max(1, c), steps: completeSteps, attemptedSteps: steps };
}
const dens = (counts, N, w) => Array.from(counts, (c) => c / (N * w));

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    {
      num: '5.8.1a',
      kind: 'Definition',
      name: 'Harris chain',
      statement: String.raw`A Markov chain on $(S,\mathcal S)$ is a **Harris chain** in Durrett's sense if there are measurable sets $A,B$, a probability measure $\nu$ concentrated on $B$, and $\eps>0$ such that
(i) $P_z(\tau_A<\infty)>0$ for every $z\in S$, where $\tau_A=\inf\{n\ge0:X_n\in A\}$;
(ii) $p(x,C)\ge\eps\nu(C)$ for $x\in A$ and every measurable $C$.
Durrett writes (ii) with a density $q(x,y)\ge\eps$ relative to a probability measure on $B$; the uniform lower bound gives this equivalent minorization. Access with positive probability does not require almost-sure access from every state.`,
      idea: String.raw`On a countable space, suppose every state can reach $a$ with positive probability. Take $A=\{a\}$ and $B=\{b\}$ for any $b$ with $p(a,b)>0$, and minorize by $p(a,b)\delta_b$. There is no reason to require $a=b$. In general the common part $\eps\nu$ can be sampled after an independent coin toss whenever the chain is in $A$. These successful tosses create an atom in the split chain and hence regeneration times.`,
      caption: String.raw`The chain $X_{n+1}=aX_n+\xi$ with $\xi\sim N(0,1)$ and $A=[-c,c]$, $B=\R$. Left: a path; gold dots mark steps where the minorization coin came up heads and the state was redrawn from $\nu$. Right: the transition densities $p(x,\cdot)$ from $x=-c,0,c$ (blue) all lie above the green shape $\varepsilon\nu$, the largest common minorant. Widen $c$ and $\varepsilon$ shrinks; make $a$ small and it grows.`,
      deps: [markovDef],
      credit: 'T. E. Harris, 1956; minorization formulation follows Durrett §5.8',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.8, pp. 322–323 (Harris definition, Examples 5.8.1–5.8.3 and history)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      tags: ['general state space'],
      scope: String.raw`The illustration uses $A=[-c,c]$, $B=\R$, and the common minorant $\eps\nu(y)=\inf_{x\in A}p(x,y)$ for the Gaussian AR(1) kernel. The sampled minorant is tabulated numerically on $[-14,14]$.`,
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.2, 0.95, 0.7, { step: 0.05 });
        const cS = v.slider('$c$', 0.25, 2, 1, { step: 0.05 });
        let seed = 1; v.button('New path', () => { seed++; });
        const P = v.stage({ x: [0, 150], y: [-5, 5], height: 330, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$X_n$', title: 'path and regeneration steps' });
        const D = v.stage({ x: [-5, 5], y: [0, 0.65], height: 330, axes: 'box', gutter: true, xlabel: '$y$', title: String.raw`$p(x,\cdot)$ and $\varepsilon\nu$`, weight: 0.8, minWidth: 260 });
        v.render(() => {
          const a = aS.value, c = cS.value, mn = minor(a, -c, c), r = v.rng(seed * 11 + 3); let x = 0, reg = 0, vis = 0; const path = [x], regs = [];
          for (let n = 1; n <= 150; n++) { if (Math.abs(x) <= c) vis++; const [y, g] = harrisStep(x, mn, r); x = Math.max(-9, Math.min(9, y)); path.push(x); if (g) { reg++; regs.push(n); } }
          P.hband(-c, c, { color: 'orange', alpha: 0.18 });
          P.path(path.map((y, n) => [n, y]), { color: 'accent', width: 1.5 });
          regs.forEach((n) => P.dot(n, path[n], { color: 'gold', r: 4.5 }));
          [-c, 0, c].forEach((x0, i) => D.fn((y) => phi(y - a * x0), { color: 'accent', width: 1.6, alpha: 0.4 + 0.3 * (i === 1) }));
          D.fn((y) => mn.eps * mn.nu(y), { color: 'green', width: 2.6, fill: true, fillAlpha: 0.35 });
          D.text(`ε = ${fx(mn.eps, 3)}`, 4.8, 0.58, { align: 'right', color: 'green', size: 14 });
          st.stats = { eps: mn.eps, reg, vis };
        });
        v.legend([['orange', 'the set $A=[-c,c]$'], ['gold', 'regeneration'], ['accent', '$p(x,\\cdot)$, $x=-c,0,c$'], ['green', '$\\varepsilon\\nu$']]);
        v.readout(() => { const s = st.stats || {}; return `$\\varepsilon=${fx(s.eps || 0, 3)}$. In 150 steps: ${s.vis} visits to $A$, ${s.reg} regenerations (expected about $\\varepsilon\\cdot${s.vis}=${fx((s.eps || 0) * (s.vis || 0), 1)}$).`; });
      },
    },
    {
      num: '5.8.4',
      kind: 'Lemma',
      name: 'Splitting identities for the auxiliary kernel',
      statement: String.raw`Suppose $p(x,\cdot)\ge\eps\nu$ for $x\in A$, where $\nu$ is a probability measure and $0<\eps\le1$. On $\bar S=S\cup\{\alpha\}$ define $\bar p(x,C)=p(x,C)-\eps\nu(C)$ and $\bar p(x,\{\alpha\})=\eps$ for $x\in A$; outside $A$ use $p$ with no mass at $\alpha$. Set $\bar p(\alpha,\cdot)=\int\nu(dx)\bar p(x,\cdot)$. Let $v$ leave each $x\in S$ fixed and replace $\alpha$ by a draw from $\nu$. Then
$$v\bar p=\bar p,\qquad\bar p v=p,$$
where the second identity is on $S$ (or on $\bar S$ after extending $p(\alpha,\cdot)=\nu p$).`,
      idea: String.raw`The atom represents a state whose original-space law is $\nu$. Expanding it first and then taking a split step has the same law as a split step directly, by the definition of $\bar p(\alpha,\cdot)$; this gives $v\bar p=\bar p$. A split step followed by expansion returns its removed mass $\eps\nu$ to the original space, giving $\bar pv=p$. The residual is not divided by $1-\eps$: the missing mass is already assigned to $\alpha$.`,
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Lemma 5.8.4, pp. 323–324 (split-kernel construction and both identities)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`The Gaussian AR(1) kernel on 41 cells, with tail probabilities folded into the end cells. The extra row and column represent $\alpha$. The heat maps show the extended $p$, the expansion $v$, and Durrett's split kernel $\bar p$. The readout checks both identities of Lemma 5.8.4 and the stochastic row sums.`,
      deps: ['prob-5.8.1a'],
      tags: ['general state space'],
      viz(v) {
        const a = v.slider('$a$', 0.2, 0.9, 0.6, { step: 0.05 });
        const c = v.slider('$c$', 0.25, 2.5, 1, { step: 0.05 });
        const K = 41, N = K + 1;
        const panels = ['$p$ (extended)', '$v$', String.raw`$\bar p$`].map(title => v.stage({ x: [0,N], y: [0,N], height: 280, axes: false, title, minWidth: 250 }));
        let result;
        v.render(() => {
          const sp = splitGrid(gridAR(a.value, K, 5), c.value), matrices = [sp.P, sp.V, sp.Pb];
          matrices.forEach((M, k) => {
            const mx = Math.max(...M.flat());
            panels[k].heat((x,y) => Math.sqrt((M[Math.min(N-1,Math.floor(N-y))]?.[Math.floor(x)] || 0)/mx), { range: [0,1], cmap: 'theme', color: 'accent', res: 3, rect: [0,0,N,N], key: `${a.value}|${c.value}` });
            panels[k].hline(1, { color: 'orange' }); panels[k].vline(K, { color: 'orange' });
          });
          const error = (A,B) => Math.max(...A.flatMap((row,i) => row.map((x,j) => Math.abs(x-B[i][j]))));
          result = { e1: error(matMulS(sp.V,sp.Pb),sp.Pb), e2: error(matMulS(sp.Pb,sp.V),sp.P), rows: Math.max(...sp.Pb.map(row => Math.abs(row.reduce((s,x)=>s+x,0)-1))), eps: sp.eps };
        });
        v.readout(() => result && String.raw`$\varepsilon=${fx(result.eps,3)}$; max errors: $v\bar p=\bar p$: ${result.e1.toExponential(1)}, $\bar pv=p$: ${result.e2.toExponential(1)}; stochastic-row error ${result.rows.toExponential(1)}.`);
      },
    },
    {
      num: '5.8.5',
      kind: 'Lemma',
      name: 'The split chain is a Markov chain',
      statement: String.raw`Let $Y_n$ be an alternating Markov chain on $\bar S$ whose transition at even times is $v$ and at odd times is $\bar p$, as defined in 5.8.4. Then $\bar X_n=Y_{2n}$ is a homogeneous Markov chain with kernel $\bar p$, and $X_n=Y_{2n+1}$ is a homogeneous Markov chain on $S$ with kernel $p$.`,
      idea: String.raw`Looking at every second state multiplies two consecutive kernels. The even-time chain has kernel $v\bar p=\bar p$; the odd-time chain has kernel $\bar pv=p$. At $\alpha$ the next split step has the fixed law $\nu\bar p$, independent of how the chain arrived there. This is the regeneration property illustrated below.`,
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Lemma 5.8.5, p. 324'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`Simulate Durrett's split kernel on 41 cells plus $\alpha$. Condition the state after a visit to $\alpha$ on three different preceding histories. Each conditional histogram approaches the same fixed row $\bar p(\alpha,\cdot)=\nu\bar p$. The readout includes the mass at $\alpha$, which is not plotted on the real axis.`,
      deps: ['prob-5.8.4'],
      tags: ['general state space'],
      viz(v) {
        const a = v.slider('$a$', 0.2, 0.9, 0.6, { step: 0.05 });
        const c = v.slider('$c$', 0.5, 2.5, 1.5, { step: 0.05 });
        const n = v.slider('steps', 2000, 80000, 30000, { log: true, int: true });
        let seed=1; v.button('New run',()=>seed++);
        const K=41, S=v.stage({ x:[-5,5], y:[0,.6], height:340, axes:'box', gutter:true, xlabel:'cell $x$', title:String.raw`law after a visit to $\alpha$` });
        let result;
        v.render(()=>{
          const g=gridAR(a.value,K,5), sp=splitGrid(g,c.value), r=v.rng(seed*29+1), counts=Array.from({length:3},()=>new Float64Array(K+1)), totals=[0,0,0];
          let z=0, previous=-1;
          for(let t=0;t<n.value;t++) { const next=cdfSample(sp.Pb[z],r); if(z===K && previous>=0) { const group=previous===K?2:g.xs[previous]<0?0:1; counts[group][next]++; totals[group]++; } previous=z; z=next; }
          const exact=sp.Pb[K], colors=['accent','orange','purple'];
          const ymax=Math.max(.6,...exact.slice(0,K).map(p=>p/g.h),...counts.flatMap((row,q)=>Array.from(row.slice(0,K),p=>p/Math.max(1,totals[q])/g.h)))*1.1; S.setView(null,[0,ymax]);
          counts.forEach((row,q)=>{ if(totals[q]) S.path(g.xs.map((x,i)=>[x,row[i]/totals[q]/g.h]),{color:colors[q],width:1.7}); });
          S.path(g.xs.map((x,i)=>[x,exact[i]/g.h]),{color:'green',width:2.6,dash:true});
          result={totals, atom:exact[K], tv:counts.map((row,q)=>totals[q]?row.reduce((s,p,i)=>s+Math.abs(p/totals[q]-exact[i]),0)/2:null)};
        });
        v.legend([['accent','previous cell negative'],['orange','previous cell nonnegative'],['purple',String.raw`previous state $\alpha$`],['green','exact atom row',{dash:true}]]);
        v.readout(()=>result && `Sample sizes ${result.totals.join(' / ')}; full-state TV errors ${result.tv.map(x=>x===null?'no observations':fx(x,3)).join(' / ')}; exact mass at the atom ${fx(result.atom,3)}.`);
      },
    },
    {
      num: '5.8.6',
      kind: 'Lemma',
      name: 'Expectations transfer to the split chain',
      statement: String.raw`For a probability measure $\mu$ on $S$ and a bounded measurable function $f:S\to\R$, extend $f$ to $\bar S$ by $\bar f=vf$: $\bar f(x)=f(x)$ on $S$ and $\bar f(\alpha)=\int f\,d\nu$. With original and split chains both started from $\mu$,
$$E_\mu f(X_n)=E_\mu\bar f(\bar X_n).$$`,
      idea: String.raw`In the alternating construction, $X_n$ is obtained from $\bar X_n$ by one expansion step $v$. Conditional expectation therefore replaces $f(X_n)$ by $(vf)(\bar X_n)$. Equivalently, $\mu\bar p^n v=\mu p^n$ on the original space. The extension agrees with $f$ at every original state; only the atom is averaged.`,
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Lemma 5.8.6 and proof, p. 324'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`Pick a bounded function on the finite cell model and a starting cell. The exact original expectation (blue) and split-chain expectation of $\bar f=vf$ (green dashes) coincide at the same time $n$. Gold dots estimate the latter with 3000 split-chain simulations.`,
      deps: ['prob-5.8.5'],
      tags: ['general state space'],
      viz(v) {
        const fS=v.select('$f$',[{value:'x',label:'$x$'},{value:'x2',label:'$x^2$'},{value:'ind',label:'$1_{x>1}$'},{value:'cos',label:String.raw`$\cos 2x$`}],'x2');
        const x0=v.slider('start $x_0$',-4.5,4.5,3,{step:.25}), a=v.slider('$a$',.3,.9,.7,{step:.05});
        let seed=1; v.button('Resimulate',()=>seed++);
        const K=41, N=14, S=v.stage({x:[0,N],y:[0,10],height:340,axes:'box',gutter:true,xlabel:'$n$',title:String.raw`$E f(X_n)=E\bar f(\bar X_n)$`});
        let result;
        v.render(()=>{
          const g=gridAR(a.value,K,5),sp=splitGrid(g,1), functions={x:x=>x,x2:x=>x*x,ind:x=>+(x>1),cos:x=>Math.cos(2*x)},f=[...g.xs.map(functions[fS.value]),0], fb=matVecR(sp.V,f),r=v.rng(seed*37+5);
          let i0=0;g.xs.forEach((x,i)=>{if(Math.abs(x-x0.value)<Math.abs(g.xs[i0]-x0.value))i0=i;});
          let mu=new Array(K+1).fill(0),mb=new Array(K+1).fill(0);mu[i0]=mb[i0]=1;
          const ex=[],split=[],mc=new Float64Array(N+1);
          for(let n=0;n<=N;n++){ex.push(mu.reduce((s,p,i)=>s+p*f[i],0));split.push(mb.reduce((s,p,i)=>s+p*fb[i],0));mu=vecM(mu,sp.P);mb=vecM(mb,sp.Pb);}
          for(let k=0;k<3000;k++){let z=i0;for(let n=0;n<=N;n++){mc[n]+=fb[z]/3000;z=cdfSample(sp.Pb[z],r);}}
          const all=[...ex,...split,...mc],lo=Math.min(...all),hi=Math.max(...all),pad=.12*(hi-lo||1);S.setView(null,[lo-pad,hi+pad]);
          S.path(ex.map((y,n)=>[n,y]),{color:'accent',width:3});S.path(split.map((y,n)=>[n,y]),{color:'green',width:2,dash:true});mc.forEach((y,n)=>S.dot(n,y,{color:'gold',r:4}));
          result={exact:Math.max(...ex.map((x,n)=>Math.abs(x-split[n]))),sample:Math.max(...ex.map((x,n)=>Math.abs(x-mc[n]))),alpha:fb[K]};
        });
        v.legend([['accent','original expectation'],['green','split expectation',{dash:true}],['gold','3000 split simulations',{dot:true}]]);
        v.readout(()=>result && String.raw`Maximum exact expectation error ${result.exact.toExponential(1)}; maximum sampling error ${fx(result.sample,3)}; $\bar f(\alpha)=\int f\,d\nu=${fx(result.alpha,3)}$.`);
      },
    },
    {
      num: '5.8.8',
      kind: 'Theorem',
      name: 'Recurrence of Harris chains',
      statement: String.raw`Write $R=\inf\{n\ge1:\bar X_n=\alpha\}$ and call the Harris chain recurrent if $P_\alpha(R<\infty)=1$. Define the measure
$$\lambda(C)=\sum_{n=1}^\infty2^{-n}\bar p^n(\alpha,C).$$
In the recurrent case, $\lambda(C)>0$ implies $P_\alpha(\bar X_n\in C\text{ i.o.})=1$. Also $P_x(R<\infty)=1$ for $\lambda$-almost every $x$. Almost-sure access from every starting state is not asserted.`,
      idea: String.raw`The atom's successive excursions are independent. Any set accessible from $\alpha$ with positive probability is therefore visited in infinitely many excursions. For the second assertion, a positive chance to move from $\alpha$ into states with a positive escape probability would contradict recurrence of $\alpha$. This establishes almost-everywhere access; Durrett's Example 5.8.7 shows why exceptional initial states cannot be discarded.`,
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.8.8, Example 5.8.7 and remark, p. 325'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`A long run of $X_{n+1}=aX_n+\xi$ with $A=[-1,1]$ and $\lambda=$ Lebesgue measure; gold ticks are visits to $\alpha$ (regenerations). Right: running counts of regenerations (gold) and of visits to $C=[1,1.5]$ (accent). For $a<1$ both grow linearly; at $a=1$ (recurrent, but only like a Gaussian random walk) they grow like $\sqrt n$; for $a=1.15$ the chain is transient, the counts stop and the path escapes.`,
      deps: ['prob-5.8.5', 'prob-5.2.5'],
      tags: ['general state space', 'recurrence'],
      scope: String.raw`The Gaussian AR(1) examples have almost-sure access from every point for $|a|\le1$, a stronger property than the theorem requires. Here $C=[1,1.5]$ is accessible from the regeneration law. Finite trajectories illustrate growth of visit counts without proving recurrence.`,
      viz(v) {
        const st = {};
        const aS = v.select('$a$', [0.5, 0.9, 1, 1.15].map((a) => ({ value: a, label: String(a) })), 0.9);
        const nS = v.slider('steps $N$', 500, 20000, 8000, { log: true, int: true });
        let seed = 1; v.button('New run', () => { seed++; });
        const P = v.stage({ x: [0, 8000], y: [-8, 8], height: 330, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$X_n$', title: 'path; ticks are visits to $\\alpha$' });
        const C = v.stage({ x: [0, 8000], y: [0, 100], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: 'running counts', weight: 0.9 });
        let key = '', R = null;
        const get = () => {
          const k = aS.value + '|' + nS.value + '|' + seed; if (k === key) return R; key = k;
          const a = aS.value, mn = minor(a, -1, 1), r = v.rng(seed * 41 + 2), N = nS.value; let x = 0;
          const path = [], regs = [], cReg = [], cC = []; let nr = 0, nc = 0;
          for (let n = 1; n <= N; n++) { const [y, g] = harrisStep(x, mn, r); x = Math.max(-1e9, Math.min(1e9, y)); if (g) { nr++; regs.push(n); } if (x >= 1 && x <= 1.5) nc++; if (n % Math.ceil(N / 400) === 0) { path.push([n, x]); cReg.push([n, nr]); cC.push([n, nc]); } }
          R = { path, regs, cReg, cC, nr, nc, eps: mn.eps, N }; return R;
        };
        v.render(() => {
          const { path, regs, cReg, cC, N } = get(); const mx = Math.max(6, ...path.map((p) => Math.abs(p[1]))), ym = Math.max(5, ...cReg.map((p) => p[1]), ...cC.map((p) => p[1]));
          P.setView([0, N], [-Math.min(mx, 15) * 1.05, Math.min(mx, 15) * 1.05]);
          P.hband(-1, 1, { color: 'orange', alpha: 0.25 });
          P.path(path, { color: 'accent', width: 1.2 });
          const vy = Math.min(mx, 15) * 1.05;
          regs.forEach((n) => P.line(n, -vy, n, -vy * 0.85, { color: 'gold', width: 1, alpha: 0.7 }));
          C.setView([0, N], [0, ym * 1.1]);
          C.path(cReg, { color: 'gold', width: 2.4 }); C.path(cC, { color: 'accent', width: 2 });
        });
        v.legend([['orange', '$A=[-1,1]$'], ['gold', 'regenerations'], ['accent', 'visits to $C=[1,1.5]$']]);
        v.readout(() => { const { nr, nc, eps, N } = get(); return `$\\varepsilon=${fx(eps, 3)}$. After ${N} steps: ${nr} visits to $\\alpha$, ${nc} visits to $C$ (Lebesgue measure ${0.5}).${aS.value > 1 ? ' The chain is transient: it escapes to infinity.' : ''}`; });
      },
    },
    {
      num: '5.8.9',
      kind: 'Theorem',
      name: 'Recurrent Harris chains have σ-finite stationary measures',
      statement: String.raw`For a recurrent Harris chain, define the split-chain excursion measure
$$\bar\mu(C)=E_\alpha\sum_{n=0}^{R-1}\mathbf1_{\{\bar X_n\in C\}},\qquad R=\inf\{n\ge1:\bar X_n=\alpha\}.$$
It is a $\sigma$-finite stationary measure for $\bar p$ and is absolutely continuous with respect to $\lambda$ of 5.8.8. The expanded measure $\mu=\bar\mu v$ is stationary for $p$. Both have total mass $E_\alpha R$, finite exactly when this mean return time is finite.`,
      idea: String.raw`The cycle trick counts visits before the first return to the atom. Advancing the excursion by one step replaces its initial visit to $\alpha$ by its final return, leaving the expected occupation measure unchanged. The sets where a return to $\alpha$ has probability at least $\delta$ within a fixed number of steps cover almost all excursion mass and have finite occupation mass, proving $\sigma$-finiteness. Finally $\bar\mu vp=\bar\mu\bar pv=\bar\mu v$. Expanding the atom is essential: simply dropping its mass does not preserve stationarity.`,
      caption: String.raw`For $X_{n+1}=aX_n+\xi$ with $A=[-c,c]$ and its regeneration law $\nu$, histogram the states $X_0,\dots,X_{T-1}$ visited during each cycle between regenerations, and divide by the number of cycles. After normalising, the histogram (accent) matches the exact stationary normal density $N(0,1/(1-a^2))$ (green). The un-normalised total mass per cycle is $E\,T$ (the mean cycle length).`,
      deps: ['prob-5.5.7', 'prob-5.8.4'],
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.8.9 and proof, p. 326'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.2, 0.9, 0.7, { step: 0.05 });
        const cS = v.slider('$c$', 0.5, 2.5, 1.2, { step: 0.05 });
        const nS = v.slider('cycles', 50, 20000, 1000, { log: true, int: true });
        let seed = 1; v.button('New cycles', () => { seed++; });
        const S = v.stage({ x: [-5, 5], y: [0, 0.8], height: 340, axes: 'box', gutter: true, xlabel: '$x$', title: 'occupation density of the cycles' });
        const NB = 50;
        v.render(() => {
          const a = aS.value, mn = minor(a, -cS.value, cS.value), res = cycles(mn, nS.value, v.rng(seed * 43 + 1), NB, -5, 5), w = 10 / NB;
          const d = Array.from(res.counts, (c) => c / (Math.max(1,res.steps) * w));
          bars(S, d, -5, w, { fill: 'accent', fillAlpha: 0.3, color: 'accent' });
          const s2 = stationaryVar(a);
          S.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          let tvv = 0; d.forEach((y, i) => { const x0 = -5 + i * w; tvv += Math.abs(y - (PHI((x0 + w) / Math.sqrt(s2)) - PHI(x0 / Math.sqrt(s2))) / w) * w; });
          st.out = { ET: res.meanT, N: res.N, eps: mn.eps, tv: tvv / 2, steps: res.steps };
        });
        v.legend([['accent', 'excursion occupation (normalised)'], ['green', 'exact $N(0,1/(1-a^2))$']]);
        v.readout(() => { const o = st.out || {}; return `$\\varepsilon=${fx(o.eps || 0, 3)}$; ${o.N} cycles, ${o.steps} steps; mean cycle length $E\\,T\\approx${fx(o.ET || 0, 2)}$ (total mass of $\\mu$). Half the binwise L1 error on the plotted window: ${fx(o.tv || 0, 3)}.`; });
      },
    },
    {
      num: '5.8.10',
      kind: 'Lemma',
      name: 'Stationary measures of chain and split chain correspond',
      statement: String.raw`If $\eta$ is a $\sigma$-finite stationary measure for $p$, then $\eta(A)<\infty$. The measure $\bar\eta=\eta\bar p$ on $\bar S$ is stationary for $\bar p$, with
$$\bar\eta(\alpha)=\eps\eta(A)<\infty,\qquad\bar\eta v=\eta.$$
Here $\bar p$ and $v$ are Durrett's split and expansion kernels from 5.8.4.`,
      idea: String.raw`If $\eta(A)$ were infinite, minorization and stationarity would give infinite $\eta$-mass to every set charged by $\nu$, contradicting a countable cover by sets of finite $\eta$-mass. Thus the removed mass $\eps\eta(A)$ is finite and $\bar\eta=\eta\bar p$ is well-defined. The identities of 5.8.4 give $\bar\eta v=\eta p=\eta$ and $\bar\eta\bar p=\bar\eta v\bar p=\eta\bar p=\bar\eta$.`,
      credit: SPLIT_CREDIT,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Lemma 5.8.10 and proof, p. 326'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`On the 41-cell Gaussian AR(1) model, the stationary vector $\pi$ (grey) is transformed into $\bar\pi=\pi\bar p$ (blue on $S$, orange at $\alpha$). The removed original-space mass is $\eps\pi(A)\nu$. The readout checks split-chain stationarity and recovery of $\pi$ by expansion.`,
      deps: ['prob-5.8.4'],
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const a=v.slider('$a$',.2,.9,.7,{step:.05}),c=v.slider('$c$',.25,2.5,1,{step:.05});
        const K=41,S=v.stage({x:[-5.5,7],y:[0,.3],height:340,axes:'box',gutter:true,xlabel:String.raw`cell $x$; extra bar at $6$ is $\alpha$`,title:String.raw`$\pi$ and $\bar\pi=\pi\bar p$`});
        let result;
        v.render(()=>{
          const g=gridAR(a.value,K,5),sp=splitGrid(g,c.value),pi=[...stationary(g.P,6000),0],pb=vecM(pi,sp.Pb),back=vecM(pb,sp.V),next=vecM(pb,sp.Pb),massA=pi.reduce((s,p,i)=>s+(sp.inA[i]?p:0),0);
          S.setView(null,[0,1.12*Math.max(...pi,...pb)]);
          g.xs.forEach((x,i)=>{S.rect(x-g.h/2,0,x+g.h/2,pi[i],{color:'ink',fill:false,width:1});S.rect(x-.4*g.h,0,x+.4*g.h,pb[i],{color:'accent',fill:'accent',fillAlpha:.5});});
          S.rect(5.75,0,6.25,pb[K],{color:'orange',fill:'orange',fillAlpha:.6});
          result={e1:Math.max(...pb.map((p,i)=>Math.abs(p-next[i]))),e2:Math.max(...pi.map((p,i)=>Math.abs(p-back[i]))),atom:pb[K],pred:sp.eps*massA};
        });
        v.legend([['ink',String.raw`$\pi$`],['accent',String.raw`$\bar\pi$ on $S$`],['orange',String.raw`$\bar\pi(\alpha)$`]]);
        v.readout(()=>result && String.raw`$\bar\pi(\alpha)=${fx(result.atom,4)}=\varepsilon\pi(A)=${fx(result.pred,4)}$. Split stationarity error ${result.e1.toExponential(1)}; expansion error ${result.e2.toExponential(1)}.`);
      },
    },
    {
      num: '5.8.11',
      kind: 'Theorem',
      name: 'Recurrent Harris chains: stationary measure is unique',
      statement: String.raw`For a recurrent Harris chain, every $\sigma$-finite stationary measure $\eta$ is a constant multiple of the measure $\mu$ constructed in 5.8.9; specifically,
$$\eta=\bar\eta(\alpha)\mu,\qquad\bar\eta=\eta\bar p.$$
Consequently different regeneration constructions give proportional measures. If their total mass is finite, their normalizations give the same stationary probability measure.`,
      idea: String.raw`Transfer to the split chain (5.8.10): a stationary measure of the original chain gives a stationary measure of the split chain, which is a recurrent chain with an atom $\alpha$ for which uniqueness holds (5.5.9). Hence $\mu$ is a multiple of the occupation measure $\mu_A$ of 5.8.9, and the multiple cancels on normalising, for whichever regeneration set was used.`,
      credit: 'Harris, 1956; splitting approach of Athreya and Ney, 1978',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.8.11 and proof, p. 326'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`Two regeneration sets for the same chain $X'=aX+\xi$: $A_1=[-c_1,c_1]$ and $A_2=[m-c_2,m+c_2]$. Left: the raw excursion occupation measures $\mu_{A_1}$ (blue) and $\mu_{A_2}$ (orange), whose total masses are the mean cycle lengths and so differ. Right: after dividing by total mass both histograms land on the one stationary normal density (green).`,
      deps: ['prob-5.8.9', 'prob-5.8.10', 'prob-5.5.9'],
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.3, 0.9, 0.7, { step: 0.05 });
        const c1 = v.slider('$c_1$', 0.5, 2.5, 1, { step: 0.05 });
        const mS = v.slider('$m$', -2, 3, 1.5, { step: 0.25 });
        const c2 = v.slider('$c_2$', 0.5, 2.5, 0.7, { step: 0.05 });
        let seed = 1; v.button('New cycles', () => { seed++; });
        const NB = 50, N = 4000;
        const L = v.stage({ x: [-5, 6], y: [0, 4], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: String.raw`raw measures $\mu_{A_1},\mu_{A_2}$ (mass per cycle)` });
        const R = v.stage({ x: [-5, 6], y: [0, 0.6], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'normalised' });
        v.render(() => {
          const a = aS.value, w = 11 / NB, s2 = stationaryVar(a);
          const m1 = minor(a, -c1.value, c1.value), m2 = minor(a, mS.value - c2.value, mS.value + c2.value);
          const r1 = cycles(m1, N, v.rng(seed * 5 + 1), NB, -5, 6), r2 = cycles(m2, N, v.rng(seed * 5 + 2), NB, -5, 6);
          const d1 = dens(r1.counts, r1.N, w), d2 = dens(r2.counts, r2.N, w);
          const mx = Math.max(...d1, ...d2) * 1.1;
          L.setView([-5, 6], [0, mx]);
          bars(L, d1, -5, w, { fill: 'accent', fillAlpha: 0.3, color: 'accent' }); bars(L, d2, -5, w, { fill: 'orange', fillAlpha: 0.3, color: 'orange' });
          const n1 = r1.meanT, n2 = r2.meanT;
          bars(R, d1.map((x) => x / n1), -5, w, { fill: 'accent', fillAlpha: 0.25, color: 'accent' }); bars(R, d2.map((x) => x / n2), -5, w, { fill: 'orange', fillAlpha: 0.25, color: 'orange' });
          R.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          st.out = { n1, n2, e1: m1.eps, e2: m2.eps };
        });
        v.legend([['accent', '$A_1$'], ['orange', '$A_2$'], ['green', 'exact stationary density']]);
        v.readout(() => { const o = st.out || {}; return `$\\varepsilon_1=${fx(o.e1 || 0, 3)}$, $\\varepsilon_2=${fx(o.e2 || 0, 3)}$. Total masses $E\\,T_1\\approx${fx(o.n1 || 0, 2)}$ and $E\\,T_2\\approx${fx(o.n2 || 0, 2)}$: the measures differ by a constant factor (ratio ${fx((o.n1 || 0) / (o.n2 || 1), 3)}); normalised, they agree.`; });
      },
    },
    {
      num: '5.8.12',
      kind: 'Theorem',
      name: 'Convergence theorem for Harris chains',
      statement: String.raw`Let the Harris chain be recurrent and aperiodic, meaning that the return times to its split-chain atom $\alpha$ have greatest common divisor $1$, and suppose it has a stationary probability measure $\pi$. For every starting state $x$ satisfying $P_x(R<\infty)=1$,
$$\|p^n(x,\cdot)-\pi\|_{TV}\longrightarrow0.$$
The access hypothesis holds for $\pi$-almost every $x$; the theorem does not assert it for every state of a general Harris chain.`,
      idea: String.raw`Expansion transfers expectations from the split chain to the original one. Positive recurrence gives finite mean regeneration cycles, and aperiodicity permits two independent copies, one started at $x$ and the other stationary, to reach $\alpha$ simultaneously almost surely. Coupling them thereafter bounds total variation by the probability that this meeting has not occurred. The initial-access hypothesis ensures the first chain reaches the regenerating class at all.`,
      credit: 'Harris, 1956; splitting approach of Athreya and Ney, 1978',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.8.12, note and proof, p. 327'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`The chain $X_{n+1}=aX_n+\xi$ started at $x_0$ far from the centre. Left: a histogram of $X_n$ over 4000 simulated chains at the chosen $n$, the exact law $N(a^nx_0,(1-a^{2n})/(1-a^2))$ (blue) and the stationary law $N(0,1/(1-a^2))$ (green). Right: the exact total variation distance against $n$ on a log scale — geometric decay for the available $0<a<1$. The plotted positive distances are clipped below at $10^{-4}$.`,
      deps: ['prob-5.8.8', 'prob-5.8.6', 'prob-5.8.11', 'prob-5.6.6'],
      tags: ['general state space', 'convergence'],
      viz(v) {
        const aS = v.slider('$a$', 0.3, 0.95, 0.8, { step: 0.05 });
        const x0 = v.slider('start $x_0$', -20, 20, 12, { step: 1 });
        const nS = v.slider('$n$', 0, 40, 5, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const H = v.stage({ x: [-8, 20], y: [0, 0.6], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: String.raw`law of $X_n$` });
        const T = v.stage({ x: [0, 40], y: [1e-4, 1.2], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: 'total variation distance to $\\pi$', weight: 0.9 });
        let key = '', sims = null;
        const getSims = () => {
          const k = aS.value + '|' + x0.value + '|' + seed; if (k === key) return sims; key = k;
          const r = v.rng(seed * 53 + 7), a = aS.value, R = 4000, xs = new Float64Array(R).fill(x0.value); sims = [Array.from(xs)];
          for (let n = 1; n <= 40; n++) { for (let k2 = 0; k2 < R; k2++) xs[k2] = a * xs[k2] + r.normal(); sims.push(Array.from(xs)); }
          return sims;
        };
        const law = (n, a, x) => ({ m: a ** n * x, v: n === 0 ? 1e-12 : (1 - a ** (2 * n)) / (1 - a * a) });
        v.render(() => {
          const a = aS.value, n = nS.value, s2 = stationaryVar(a), L = law(n, a, x0.value), xs = getSims()[n];
          const lo = Math.min(-8, x0.value - 8), hi = Math.max(20, x0.value + 8);
          H.setView([lo, hi], [0, 0.7]);
          H.hist(xs, { bins: 60, range: [lo, hi], density: true, color: 'accent', fillAlpha: 0.25 });
          const sd = Math.sqrt(L.v); if (n > 0) H.fn((x) => phi((x - L.m) / sd) / sd, { color: 'accent', width: 2.2 });
          H.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          const pts = []; for (let k = 0; k <= 40; k++) { const q = law(k, a, x0.value); pts.push([k, k === 0 ? 1 : Math.max(1e-4, tvNormal(q.m, q.v, 0, s2))]); }
          T.path(pts, { color: 'green', width: 2.4 }); T.dot(n, pts[n][1], { color: 'gold', r: 5 }); T.vline(n, { color: 'gold', width: 1.2, dash: true });
        });
        v.legend([['accent', 'simulated / exact law of $X_n$'], ['green', 'stationary law']]);
        v.readout(() => { const a = aS.value, n = nS.value, L = law(n, a, x0.value); return `$n=${n}$: $X_n\\sim N(${fx(L.m, 2)},${fx(L.v, 2)})$; stationary variance $${fx(stationaryVar(a), 2)}$; $\\|p^n(x_0,\\cdot)-\\pi\\|_{TV}=${fx(n === 0 ? 1 : tvNormal(L.m, L.v, 0, stationaryVar(a)), 4)}$.`; });
      },
    },
    {
      num: '5.8.13',
      kind: 'Lemma',
      name: 'Exponential minus independent Y has an exponential tail',
      statement: String.raw`Let $X$ be exponential with rate $\lambda$ and $Y\ge0$ independent of $X$. Then for $t\ge0$
$$P(X-Y>t)=P(X-Y>0)\,e^{-\lambda t},\qquad P(X-Y>0)=E\,e^{-\lambda Y}.$$
That is, conditionally on $X>Y$ the excess $X-Y$ is again exponential with rate $\lambda$.`,
      idea: String.raw`Condition on $Y=y\ge0$ and use the memoryless property of $X$: $P(X>y+t)=e^{-\lambda y}e^{-\lambda t}$. Integrating over the law of $Y$ gives $P(X-Y>t)=E e^{-\lambda Y}\,e^{-\lambda t}$. If $Y$ may be negative the identity fails for small $t$, because $P(X>y+t)=1$ when $y+t<0$.`,
      see: ['stoch-11.12'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Lemma 5.8.13 and proof, p. 327'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      scope: String.raw`Both variables are nonnegative and independent, exactly as in Durrett's Lemma 5.8.13. The final menu option deliberately violates nonnegativity of $Y$.`,
      tags: ['queues', 'distributions'],
      caption: String.raw`$X\sim\mathrm{Exp}(\lambda)$ and an independent $Y$ chosen from the menu. The accent curve is the empirical conditional tail $P(X-Y>t\mid X-Y>0)$ from 40000 samples on a log scale; the green line is $e^{-\lambda t}$. For $Y\ge0$ they coincide; the last menu entry lets $Y$ be negative (uniform on $[-1,2]$) and the curve bends for $t<1$.`,
      deps: ['prob-2.1.12'],
      viz(v) {
        const st = {};
        const yS = v.select('law of $Y$', [{ value: 'c', label: '$Y=0.7$' }, { value: 'u', label: '$U(0,3)$' }, { value: 'b', label: '$\\{0,2\\}$' }, { value: 'neg', label: '$U(-1,2)$ (can be $<0$)' }], 'u');
        const lS = v.slider('rate $\\lambda$', 0.3, 2, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [0, 6], y: [1e-3, 1.2], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$t$', title: String.raw`$P(X-Y>t\mid X-Y>0)$` });
        v.render(() => {
          const lam = lS.value, r = v.rng(seed * 59 + 4), N = 40000, ds = [];
          for (let k = 0; k < N; k++) { const x = -Math.log(1 - r()) / lam; let y; switch (yS.value) { case 'c': y = 0.7; break; case 'u': y = 3 * r(); break; case 'b': y = r() < 0.5 ? 0 : 2; break; default: y = -1 + 3 * r(); } if (x - y > 0) ds.push(x - y); }
          ds.sort((a, b) => a - b); const M = ds.length, pts = [];
          for (let i = 0; i <= 120; i++) { const t = (6 * i) / 120; let lo = 0, hi = M; while (lo < hi) { const mid = (lo + hi) >> 1; if (ds[mid] <= t) lo = mid + 1; else hi = mid; } const s = (M - lo) / M; pts.push([t, Math.max(1e-3, s)]); }
          S.path(pts, { color: 'accent', width: 2.6 });
          S.fn((t) => Math.exp(-lam * t), { color: 'green', width: 2.2, dash: [8, 5] });
          st.out = { p: M / N, N };
        });
        v.legend([['accent', 'empirical tail'], ['green', '$e^{-\\lambda t}$', { dash: true }]]);
        v.readout(() => { const lam = lS.value, p = (st.out || {}).p || 0; const ex = { c: Math.exp(-lam * 0.7), u: (1 - Math.exp(-3 * lam)) / (3 * lam), b: 0.5 * (1 + Math.exp(-2 * lam)), neg: null }[yS.value]; return `Empirical $P(X-Y>0)=${fx(p, 4)}$; ${ex === null ? 'for $Y$ taking negative values the formula $Ee^{-\\lambda Y}$ no longer applies and the tail is not a pure exponential.' : `$Ee^{-\\lambda Y}=${fx(ex, 4)}$.`}`; });
      },
    },
  ],
};
