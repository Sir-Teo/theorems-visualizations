// Networks & Collective Behavior — Chapter 4: Random graphs, small worlds and power laws (items 4.1–4.6)
//
// Sources checked for this part (Oct 2026): Dodds, Muhamad & Watts, Science 301: 827 (2003) — 98,847 registrants, 61,168 active
// participants from 166 countries, 18 targets in 13 countries, 24,163 distinct chains of which 384 completed, mean length of the
// completed chains 4.01 (text of the paper); Ugander et al. (arXiv 1111.4503): 721 million users, 68.7 billion edges, mean degree
// ~190, median 99, average distance 4.7, 99.91% in the largest component; Edunov et al. (Facebook Research blog, Feb 2016):
// 1.59 billion users, average distance 4.57 (3.57 intermediaries). Items 4.5–4.6 additionally checked against
// Watts & Strogatz, Nature393:440–442 (1998), and Kleinberg’s complete author paper, Theorems2–3, pp.4–12.
// Everything drawn from a simulation is labelled as a model on the page.
import {
  rng32, components, triangleStats, poissonPmf, pairUniforms, gnpCoupled, growthCurve, giantTheory,
} from './ch04.shared.js';
import { erSeed, erValidSeed, erUniforms, erCircle, erGnp, erDegreeLaw, erCenti, erGiant, erEdgeOrder, erGrowth, erGrowthAt } from './source-audit-erdos-renyi.js';
import { swSeedValid, swSkeleton, swBuild, navigationGraph, navigationLaw, navigationRoute, navigationSummary, navigationHalving } from './source-audit-smallworld.js';

export default {
  collection: 'soc',
  chapter: 4,
  title: 'Random graphs, small worlds and power laws',
  summary: String.raw`Random graphs are the baseline: a giant component appears suddenly once the average degree passes one, and distances grow only logarithmically. Real social networks are both clustered and small, which the Watts–Strogatz model reproduces, and Milgram’s letters showed that people can find short paths without a map, which Kleinberg’s model explains. Many networks have heavy-tailed degree distributions, which preferential attachment explains — though how often real networks are truly scale-free is disputed. The chapter ends with the same ideas in the wild: cultural markets, city sizes, the long tail of sales and the bow-tie shape of the Web.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num:'4.1',kind:'Model',name:'Erdős–Rényi random graph',
      statement:String.raw`In $G(n,p)$, each unordered pair of distinct labelled vertices is an edge independently with probability $p\in[0,1]$. This independent-edge convention is explicit in Gilbert (1959); Erdős and Rényi (1960) study the uniform-edge growth convention $G(n,M)$.

For a fixed vertex its degree $D$ is exactly
$$D\sim\operatorname{Bin}(n-1,p).$$
Thus $\mathbb ED=c=(n-1)p$, $\operatorname{Var}D=c(1-p)$, and the expected edge count is $nc/2$. If $p=c/(n-1)$ with fixed $c>0$ and $n\to\infty$, then $D$ converges in distribution to $\operatorname{Poisson}(c)$. For $c=0$ it is identically zero.

Conditional on a vertex’s incident edges giving at least two neighbours, any specified pair of those neighbours is linked with probability $p$, whenever the conditioning event has positive probability. This is a conditional closure probability, not a claim that a sampled graph’s transitivity equals $p$.`,
      idea:String.raw`Degree is a sum of $n-1$ independent Bernoulli variables. The rare-event limit in prob-3.6.1 applies because the sum of their probabilities is $c$ and their largest probability tends to zero. Degrees of different vertices are dependent: they share their possible connecting edge. The histogram therefore compares dependent finite graph data with a single vertex’s marginal law; it is not $n$ independent degree trials.

An edge between two neighbours is independent of the incident edges used to identify those neighbours. This proves the conditional closure statement when that incident configuration is possible. At $p=0$ there is no event with two neighbours to condition on. A graph-level ratio of triangle and wedge counts has a different expectation. Also, conditional on its edge count being $M$ with positive probability, $G(n,p)$ is uniform over all $M$-edge graphs: every such graph has the same probability $p^M(1-p)^{\binom n2-M}$.`,
      caption:String.raw`One authored, reproducible graph supplies **both** panels. Every selected vertex is drawn; one largest component is gold (ties go to its smallest vertex label). Change the continuous edge probability $p$: at fixed size and seed, the same pair uniforms are reused, so edges nest. The histogram counts every degree, including zero. The final bucket $k\ge n$ contains the entire Poisson overflow; a finite simple graph has no such degrees. The Poisson comparison is most useful in the sparse regime.`,
      scope:String.raw`These are finite simple undirected graph laws and a stated sparse limit, not a fit to a social network. Random drawings use a finite seeded pseudorandom generator; the probability laws assume ideal independent choices. “Transitivity” in the readout is three times the triangle count divided by the number of centred neighbour pairs and is undefined if that denominator is zero. No general distance formula or unconditional expected global clustering identity is asserted.`,
      deps:['soc-2.3','prob-3.6.1'],
      refs:['Gilbert (1959), §1, p.1141','Erdős & Rényi (1960), introduction pp.17–19'],
      tags:['random graphs','networks'],credit:'Gilbert, 1959; Erdős & Rényi, 1960 (uniform-edge growth)',
      links:{source:'https://www.stat.cmu.edu/~brian/780/bibliography/09%20Other%20Models/Gilbert%20-%201959%20-%20Random%20graphs.pdf',original:'https://combinatorica.hu/~p_erdos/1960-10.pdf'},verify: false,
      viz(v){
        let seed=7,cache=null,info;
        v.shareState('graph-seed',{get:()=>seed,validate:erValidSeed,set:x=>{seed=erSeed(x);cache=null;}});
        const n=v.select('vertices $n$',[20,60,120].map(value=>({value,label:String(value)})),60);
        const p=v.slider('edge probability $p$',0,1,2/59,{step:'any',fmt:x=>String(+x.toFixed(6))});
        v.button('Empty',()=>p.set(0));v.button('Expected degree 1',()=>p.set(1/(n.value-1)));v.button('Complete',()=>p.set(1));v.button('Resample',()=>{seed=(seed+1)>>>0;cache=null;});
        const A=v.stage({x:[-1.18,1.18],y:[-1.18,1.18],equal:true,axes:false,height:340,minWidth:280,title:'same graph as the degree histogram'});
        const B=v.stage({x:[-5,65],y:[-.1,1.15],axes:'box',gutter:true,height:340,minWidth:280,weight:1.3,xlabel:'degree k; final bucket k ≥ n',ylabel:'share / probability',title:'finite degree law and Poisson comparison'});
        v.render(()=>{
          const N=+n.value;if(!cache||cache.n!==N||cache.seed!==seed)cache={n:N,seed,U:erUniforms(N,seed),pos:erCircle(N)};
          const g=erGnp(N,cache.U,p.value),law=erDegreeLaw(N,p.value),largest=new Set(g.components[0]);info={...g,law,seed,p:p.value};
          for(const[a,b]of g.edges)A.line(...cache.pos[a],...cache.pos[b],{color:'muted',width:.6,alpha:.24});
          cache.pos.forEach(([x,y],j)=>A.dot(x,y,{r:3,ring:false,color:largest.has(j)?'gold':'muted'}));
          const peak=Math.max(...g.counts.map(x=>x/N),...law.binomial,...law.poisson,.01);B.setView([-5,N+5],[-.13*peak,1.17*peak]);
          g.counts.forEach((count,k)=>{if(count)B.rect(k-.38,0,k+.38,count/N,{fill:'accent',fillAlpha:.55,stroke:false});});
          law.binomial.forEach((q,k)=>B.dot(k,q,{r:2.6,ring:false,color:'green'}));law.poisson.forEach((q,k)=>B.dot(k,q,{r:2.1,ring:false,color:'orange',hollow:true,width:1.1}));
        });
        v.legend([['accent','observed degree shares',{area:true}],['green','exact Binomial marginal',{dot:true}],['orange','Poisson comparison + overflow',{dot:true}],['gold','one largest component',{dot:true}]]);
        v.readout(()=>{const g=info,L=g.law;return String.raw`Seed ${g.seed}; $n=${g.n}$, $p=${v.fix(g.p,6)}$, edges **${g.m}** (expected ${v.fix(L.expectedEdges,3)}). Observed mean $2M/n=${v.fix(g.mean,6)}$ and variance ${v.fix(g.variance,6)}; finite marginal mean $c=${v.fix(L.c,6)}$ and variance ${v.fix(L.variance,6)}.
Largest / second component: **${g.largest} / ${g.second}** vertices. Triangles ${g.triangles}; centred neighbour pairs ${g.wedges}; sampled transitivity ${g.transitivity===null?'**undefined** (no neighbour pairs)':v.fix(g.transitivity,6)}. Conditional neighbour-pair closure ${L.conditionalClosure===null?'**undefined** (the conditioning event has probability zero)':`$p=${v.fix(L.conditionalClosure,6)}$`}. Poisson mass in $k\ge n$: $${v.sci(L.poisson[g.n],4)}$.`;});
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num:'4.2',kind:'Theorem',name:'The giant component appears at mean degree one',
      statement:String.raw`Fix $c\ge0$ and let $n\to\infty$ in $G(n,c/n)$ (with $n>c$). The finite expected degree is $c(1-1/n)$, not exactly $c$. Write $L_1,L_2$ for the largest and second-largest component sizes.

For $0<c<1$, $L_1=O(\log n)$ with high probability. For $c>1$, there is a unique giant component: $L_1/n$ converges in probability to the unique positive solution $S(c)$ of
$$S=1-e^{-cS},$$
and $L_2=O(\log n)$ with high probability. For $c\le1$, the limiting fraction is $S(c)=0$; at $c=0$ the graph is exactly empty and $L_1=1$.

At $c=1$, $L_1=\Theta_{\mathbb P}(n^{2/3})$: for every $\varepsilon>0$, sufficiently large constants $A$ bound $L_1/n^{2/3}$ between $1/A$ and $A$ with probability at least $1-\varepsilon$ for large $n$. This does not assert fixed deterministic bounds with probability tending to one. Just above one, $S(c)\sim2(c-1)$.`,
      idea:String.raw`Early component exploration in a sparse graph is locally approximated by a Galton–Watson process with Poisson($c$) offspring. Its generating function is $f(q)=e^{c(q-1)}$. The least-fixed-point extinction theorem stoch-3.10 gives $q=f(q)$; setting $S=1-q$ yields the displayed equation. A finite graph exploration always terminates; equating the branching-process survival probability with the limiting giant fraction requires the random-graph theorem, not a literal finite “survival forever” argument.

For $c>1$, $1-e^{-cS}-S$ has positive derivative at zero, strictly negative second derivative, and is negative at $S=1$. Hence exactly one positive root exists. For $c\le1$ there is none. Expanding the equation near $c=1$ gives $S\sim2(c-1)$. The critical $n^{2/3}$ probability bounds are a separate result (Frieze–Karoński, Theorem 2.21), not a conclusion from that fixed-point equation.`,
      caption:String.raw`**Left:** three authored uniform-edge growth samples $G(n,M)$, plotted as their complete component-size staircases against the realised degree $2M/n$, alongside the limiting curve. For the selected hundredth-grid parameter $c$, the sample uses $M=\lfloor cn/2\rfloor$; coloured dots mark the actual selected prefixes. The readout distinguishes $c$ from $2M/n$. **Right:** the zero root is always present; a second crossing appears for $c>1$.`,
      scope:String.raw`The theorem is an asymptotic probability statement. The uniform-edge ensemble with $M=\lfloor cn/2\rfloor$ has the same limiting giant fraction, but is a different finite ensemble from independent-edge $G(n,c/n)$. One finite seeded sample at each size neither proves convergence nor certifies a giant from its size alone. The critical statement above is for $G(n,1/n)$; the finite growth pictures illustrate fluctuations without establishing its distribution. Original Erdős–Rényi notation uses edges/vertices, so its critical parameter is $1/2$; here $c$ is twice that parameter.`,
      deps:['soc-4.1','stoch-3.10'],
      refs:['Erdős & Rényi (1960), introduction; §9, Theorem 9b','Frieze & Karoński, author text 9 September 2024, Theorems 2.9, 2.14, 2.21'],
      tags:['random graphs','phase transition','giant component'],credit:'Erdős & Rényi, 1960; critical bounds as stated in Frieze–Karoński',
      links:{original:'https://combinatorica.hu/~p_erdos/1960-10.pdf',account:'https://www.math.cmu.edu/~af1p/Teaching/RandomGraphs/Undergraduate/BOOK.pdf'},verify: false,
      viz(v){
        const sizes=[100,1000,10000],cols=['orange','green','accent'];let seed=11,cache=null,info;
        v.shareState('growth-seed',{get:()=>seed,validate:erValidSeed,set:x=>{seed=erSeed(x);cache=null;}});
        const c=v.slider('limit parameter $c$',0,3,1.5,{step:.01,onChange:erCenti,fmt:x=>x.toFixed(2)});
        v.button('c = 0',()=>c.set(0));v.button('c = 1',()=>c.set(1));v.button('c = 3',()=>c.set(3));v.button('Resample',()=>{seed=(seed+1)>>>0;cache=null;});
        const A=v.stage({x:[-.12,3.12],y:[-.08,1.10],axes:'box',gutter:true,height:340,minWidth:280,weight:1.2,xlabel:'c (limit); 2M/n (finite samples)',ylabel:'largest component / n',title:'limit curve and finite growth samples'});
        const B=v.stage({x:[-.08,1.08],y:[-.08,1.08],axes:'box',gutter:true,height:340,minWidth:280,xlabel:'S',ylabel:'y',title:'zero root and positive root'});
        v.render(()=>{
          if(!cache||cache.seed!==seed)cache={seed,runs:sizes.map((n,j)=>erGrowth(n,erEdgeOrder(n,Math.floor(1.5*n),(seed+j)>>>0)))};
          const C=c.value,S=erGiant(C),samples=cache.runs.map(run=>erGrowthAt(run,C));info={seed,c:C,S,samples};
          A.fn(erGiant,{color:'ink',width:2.2,n:450,domain:[0,3]});cache.runs.forEach((run,j)=>A.path(run.points,{color:cols[j],width:1.5,alpha:.85}));
          A.line(1,0,1,1.025,{color:'muted',width:1,dash:true});A.line(C,-.025,C,1.025,{color:'gold',width:1.3,dash:true});samples.forEach((s,j)=>A.dot(s.realizedMean,s.fraction,{r:4,ring:false,color:cols[j]}));
          A.text('c = 1',1,1.03,{size:11,align:'center',baseline:'middle',color:'muted'});
          B.line(0,0,1,1,{color:'muted',width:1.2});B.fn(s=>-Math.expm1(-C*s),{domain:[0,1],color:'purple',width:2.2});
          B.dot(0,0,{r:4,ring:false,color:S>0?'red':'green',hollow:S>0,width:1.4});if(S>0)B.dot(S,S,{r:5,ring:false,color:'green'});
          B.text(`limit S: ${v.fix(S,6)}`,.95,.08,{size:11,align:'right',baseline:'middle',color:'green'});
        });
        v.legend([['ink','limiting fraction S(c)'],['orange','finite n = 100'],['green','finite n = 1000'],['accent','finite n = 10,000'],['purple','1 − exp(−cS)']]);
        v.readout(()=>{const{c:C,S,samples}=info;return String.raw`Seed ${info.seed}; $c=${C.toFixed(2)}$, limiting fraction $S(c)=${v.fix(S,6)}$. ${C===1?'Exactly critical: the n^(2/3) statement is a probability-scale result.':C<1?'Subcritical limit: the largest fraction tends to zero.':'Supercritical limit: one positive root and one asymptotic giant.'}
${samples.map(s=>String.raw`$n=${s.n}$: $M=${s.m}$, realised $2M/n=${v.fix(s.realizedMean,4)}$; largest / second **${s.largest} / ${s.second}**, ${s.components} components, largest fraction ${v.fix(s.fraction,6)}.`).join('\n')}`;});
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Event',
      name: 'Milgram’s small-world experiment',
      statement: String.raw`In 1967 Stanley Milgram and his collaborators asked volunteers in Nebraska and Boston to forward a folder to a named target, a stockbroker in the Boston area, by handing it only to a first-name acquaintance who seemed more likely to know him; each chain's length was recorded when the folder arrived. In the published 1969 account (Travers and Milgram, soc-4.17), 64 of 296 starting chains arrived, after about five intermediaries on average, and the "six degrees of separation" slogan followed.

The experiment was repeated by e-mail in 2003 (Dodds, Muhamad and Watts): 98,847 people registered and 61,168 took part from 166 countries, trying to reach 18 targets in 13 countries; of 24,163 distinct chains only 384 (1.6%) were completed, with mean length 4.01 for the completed ones. Correcting for attrition, the authors estimate a median chain length of five to seven.

The lesson is twofold: people can find short paths in a network they cannot see, and the **observed** lengths understate the true ones, because long chains are the ones that die.`,
      idea: String.raw`The experiment runs a distributed, greedy search: each holder knows only their own acquaintances and the target's location and occupation, and passes the folder to the one that looks nearest. It works only if the network is both small (soc-4.5) and *searchable*: acquaintances at every geographic scale, which Kleinberg's model (4.6) isolates. Attrition is the statistical trap: if each hand-over loses a fraction $d$ of the folders, a chain of length $L$ survives with probability $(1-d)^L$, so the arrivals are weighted toward short chains; the 2003 study corrects for this using the observed per-step drop-out rates.`,
      caption: String.raw`A model, not the data: 1200 people placed at random in a square know their five nearest neighbours and two long-range acquaintances (probability $\propto1/d^2$). Drag the source and the target; the gold chain follows Milgram's rule (hand the folder to the acquaintance nearest the target), the green dashed path is the true shortest route. The histogram compares the two over 600 random pairs, and the slider adds attrition per hand-over.`,
      scope: String.raw`The simulated population is illustrative (it has no occupations or institutions, and only one kind of tie). The numbers for the 1969 and 2003 experiments are as reported in the papers; the 2003 study's total of participants and chains is quoted from the paper's text.`,
      deps: ['soc-2.2'],
      refs: ['E&K §20.1'],
      tags: ['small world', 'history', 'search'],
      credit: 'Milgram, 1967; Travers & Milgram, 1969; Dodds, Muhamad & Watts, 2003',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-world_experiment' },
      viz(v) {
        const N = 1200, R = rng32(41);
        const X = new Float64Array(N), Y = new Float64Array(N);
        for (let i = 0; i < N; i++) { X[i] = R(); Y[i] = R(); }
        const d2 = (a, b) => (X[a] - X[b]) ** 2 + (Y[a] - Y[b]) ** 2;
        const adj = Array.from({ length: N }, () => new Set());
        for (let i = 0; i < N; i++) {
          const ds = []; for (let j = 0; j < N; j++) if (j !== i) ds.push([d2(i, j), j]);
          ds.sort((a, b) => a[0] - b[0]);
          for (let k = 0; k < 5; k++) { adj[i].add(ds[k][1]); adj[ds[k][1]].add(i); }
          const w = ds.map(([d]) => 1 / (d + 1e-6)); let tot = 0; for (const x of w) tot += x;
          for (let t = 0; t < 2; t++) { let r = R() * tot, k = 0; while (k < w.length - 1 && r > w[k]) { r -= w[k]; k++; } adj[i].add(ds[k][1]); adj[ds[k][1]].add(i); }
        }
        const nbr = adj.map((s) => [...s]);
        const nearest = (x, y) => { let b = 0, bd = 9; for (let i = 0; i < N; i++) { const d = (X[i] - x) ** 2 + (Y[i] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
        const greedy = (s, t) => {
          const path = [s]; let u = s;
          while (u !== t && path.length < 200) { let best = -1, bd = d2(u, t); for (const w of nbr[u]) { const d = d2(w, t); if (d < bd) { bd = d; best = w; } } if (best < 0) return { path, ok: false }; u = best; path.push(u); }
          return { path, ok: u === t };
        };
        const bfsPath = (s, t) => { const prev = new Int32Array(N).fill(-2); prev[s] = -1; const q = [s]; for (let h = 0; h < q.length && prev[t] === -2; h++) for (const w of nbr[q[h]]) if (prev[w] === -2) { prev[w] = q[h]; q.push(w); } const p = []; for (let x = t; x !== -1; x = prev[x]) p.push(x); return p.reverse(); };
        // 600 random pairs
        const RP = rng32(5), pairs = []; let gl = new Array(25).fill(0), sl = new Array(25).fill(0), okN = 0;
        for (let i = 0; i < 600; i++) { const a = Math.floor(RP() * N), b = Math.floor(RP() * N); if (a === b) { i--; continue; } const g = greedy(a, b), s = bfsPath(a, b).length - 1; sl[Math.min(24, s)]++; if (g.ok) { gl[Math.min(24, g.path.length - 1)]++; okN++; } pairs.push(1); }
        const dS = v.slider('attrition per hand-over', 0, 0.6, 0.25, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const M = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, title: 'a population of 1200 people', minWidth: 300, weight: 1.1 });
        const H = v.stage({ x: [-0.5, 20.5], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'chain length (hand-overs)', ylabel: 'share of the 600 pairs', title: 'how long are the chains?', minWidth: 280, weight: 1 });
        const src = M.handle(0.12, 0.3, { color: 'green', label: 'Nebraska' }), tgt = M.handle(0.88, 0.68, { color: 'red', label: 'Boston' });
        for (let i = 0; i < N; i++) for (const w of nbr[i]) if (w > i) { /* edges drawn lazily below */ }
        let st = null;
        v.render(() => {
          for (let i = 0; i < N; i++) for (const w of nbr[i]) if (w > i && d2(i, w) > 0.004) M.line(X[i], Y[i], X[w], Y[w], { color: 'faint', width: 0.5, alpha: 0.5 });
          M.dots(Array.from({ length: N }, (_, i) => [X[i], Y[i]]), { r: 1.8, color: 'muted' });
          const s = nearest(src.x, src.y), t = nearest(tgt.x, tgt.y), g = greedy(s, t), sp = bfsPath(s, t);
          M.path(sp.map((i) => [X[i], Y[i]]), { color: 'green', width: 2.6, dash: [6, 4] });
          M.path(g.path.map((i) => [X[i], Y[i]]), { color: 'gold', width: 2.8 });
          M.dots(g.path.map((i) => [X[i], Y[i]]), { r: 3.6, color: 'gold' });
          M.dot(X[s], Y[s], { r: 6, color: 'green' }); M.dot(X[t], Y[t], { r: 6, color: 'red' });
          const d = dS.value, surv = (L) => Math.pow(1 - d, L);
          const mx = Math.max(...sl) / 600;
          H.setView([-0.5, 20.5], [0, mx * 1.35]);
          let comp = 0, cmean = 0, gtot = 0, gmean = 0;
          for (let L = 1; L <= 24; L++) {
            if (L <= 20) {
              if (sl[L]) H.rect(L - 0.45, 0, L - 0.05, sl[L] / 600, { fill: 'green', fillAlpha: 0.55, stroke: false });
              if (gl[L]) H.rect(L + 0.05, 0, L + 0.45, gl[L] / 600, { fill: 'gold', fillAlpha: 0.75, stroke: false });
              if (gl[L]) H.rect(L + 0.05, 0, L + 0.45, gl[L] * surv(L) / 600, { fill: 'orange', fillAlpha: 0.9, stroke: false });
            }
            comp += gl[L] * surv(L); cmean += L * gl[L] * surv(L); gtot += gl[L]; gmean += L * gl[L];
          }
          st = { len: g.path.length - 1, ok: g.ok, sp: sp.length - 1, okN, gmean: gmean / gtot, cmean: cmean / comp, frac: comp / 600, d, Lmean: sl.reduce((a, c, L) => a + c * L, 0) / 600 };
        });
        v.legend([['green', 'shortest route', { area: true }], ['gold', 'greedy chains that arrive', { area: true }], ['orange', 'arrive despite attrition', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { len, ok, sp, okN, gmean, cmean, frac, d, Lmean } = st;
          return `This pair: the greedy chain ${ok ? `arrives after **${len}** hand-overs` : 'gets stuck (no acquaintance is closer to the target)'}; the shortest route has **${sp}**. Over 600 pairs the greedy rule arrives ${Math.round(100 * okN / 600)}% of the time, in ${v.fix(gmean, 1)} hand-overs on average (shortest routes: ${v.fix(Lmean, 1)}); with ${Math.round(100 * d)}% attrition per hand-over only **${v.fix(100 * frac, 1)}%** arrive, with mean ${v.fix(cmean, 1)}.
Reported experiments: Travers–Milgram 64 of 296 chains arrived (22%), Dodds et al. 384 of 24,163 (1.6%), mean length of arrivals 4.01.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num:'4.4',kind:'Phenomenon',name:'Six degrees in online networks',
      statement:String.raw`Backstrom and colleagues' Facebook study reports a mean shortest-path distance of **4.74 friendship links** among reachable pairs in its May 2011 active-user graph, with approximately 721 million users and 69 billion undirected friendships. Their probabilistic HyperANF computation estimates network distances; it does not trace how people actually forward messages.

Their convention calls distance minus one the number of intermediaries or “degrees of separation”: 4.74 links corresponds to 3.74 intermediaries. Facebook's official announcement of 4 February 2016 reports a newer separation statistic of **3.57**, down from 3.74 in 2011. Under that convention this corresponds to 4.57 links.

These reported figures concern the measured Facebook populations and graph definitions; they are not maximum distances, universal claims about all people, or evidence that a decentralized search will find a shortest route.`,
      idea:String.raw`A route with $d$ friendship links has $d+1$ people, including its source and target, hence $d-1$ intermediaries. An average may be fractional even though each individual path length is an integer. Subtracting one from every connected pair's distance also subtracts one from their mean.

The 2011 technical study distinguishes finite distances between connected pairs from pairs in different components. Its companion analysis by Ugander and colleagues reports 99.91% of the active-user graph in the largest component. Neither a finite connected-pair average nor that large component makes the distance between disconnected pairs finite. Changes in the reported numbers alone do not identify a cause such as growth, clustering or degree heterogeneity.`,
      caption:String.raw`Switch between links and intermediaries to compare the two published summaries under one counting convention. No distance histogram is inferred from those values. The second panel is an authored individual path: change its integer link count and count the people between its two endpoints. It is a counting example, not a sampled Facebook route.`,
      scope:String.raw`Sources are the complete 2011 author papers and Facebook's accessible 2016 official announcement. The latter supplies the reported comparison, not a newly reproduced 2016 computation or raw dataset. Its population size, unpublished degree distribution and error bars are not invented here. The plotted 2011 value is an estimate from probabilistic graph analysis, not an exhaustive BFS of every pair.`,
      deps:['soc-2.2','soc-4.3'],refs:['Backstrom et al., arXiv:1111.4570v3, abstract and §§3–4','Ugander et al., arXiv:1111.4503v1, Path lengths and Component sizes, PDFpp.4–5','Facebook, Friends Day: Celebrating the Importance of Connections, 4 February 2016'],
      tags:['small world','social networks','online'],credit:'Backstrom, Boldi, Rosa, Ugander & Vigna, 2011/2012; Ugander, Karrer, Backstrom & Marlow, 2011; Facebook, 2016.',
      links:{study:'https://arxiv.org/abs/1111.4570v3',structure:'https://arxiv.org/abs/1111.4503v1',announcement:'https://about.fb.com/news/2016/02/friends-day/'},verify:false,
      viz(v){
        const mode=v.select('count',[{value:'links',label:'friendship links'},{value:'between',label:'intermediaries'}],'links'),d=v.slider('links in the example path',1,8,5,{int:true});
        const A=v.stage({x:[-.2,2.2],y:[-.45,6],axes:'box',gutter:true,height:320,minWidth:260,xticks:[[.5,'2011'],[1.5,'2016']],ylabel:'reported count',title:'two reported summaries; switch the convention'}),B=v.stage({x:[-.6,10.6],y:[-1,1],axes:false,height:260,minWidth:260,title:'authored individual path; integer links'});
        v.render(()=>{
          [4.74,4.57].forEach((x,j)=>{const value=x-(mode.value==='between'?1:0),at=.5+j;A.rect(at-.25,0,at+.25,value,{fill:j?'purple':'accent',fillAlpha:.65,stroke:false});A.text(value.toFixed(2),at,value+.2,{align:'center',baseline:'middle',color:j?'purple':'accent',weight:700,size:13});});
          for(let j=0;j<d.value;j++)B.line(10*j/d.value,0,10*(j+1)/d.value,0,{color:'muted',width:2});
          for(let j=0;j<=d.value;j++)B.dot(10*j/d.value,0,{r:5,ring:false,color:j===0?'purple':j===d.value?'green':'orange'});
          B.text('source',0,-.35,{align:'left',baseline:'middle',color:'purple',size:11});B.text('target',10,-.35,{align:'right',baseline:'middle',color:'green',size:11});B.text(`${d.value} links; ${d.value-1} intermediaries`,5,.4,{align:'center',baseline:'middle',color:'ink',size:12});
        });
        v.legend([['accent','2011 reported mean'],['purple','2016 reported statistic / example source'],['orange','example intermediaries'],['green','example target']]);
        v.readout(()=>`Reported ${mode.value==='links'?'friendship links: 2011 4.74, 2016 4.57':'intermediaries: 2011 3.74, 2016 3.57'}. The change is 0.17 in either convention. Authored path: ${d.value} links, ${d.value+1} people in total, ${d.value-1} intermediaries. No measured distance distribution, maximum path length or routing success is inferred.`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num:'4.5',kind:'Model',name:'Watts–Strogatz small-world model',
      statement:String.raw`Watts and Strogatz start with an undirected ring of $n$ vertices, each joined to its $k$ nearest neighbours, with even $2\le k<n$. Consider each clockwise lattice edge once, in successive distance laps. Independently mark it with probability $p$. A marked edge keeps its first endpoint and chooses a uniformly admissible new endpoint; loops and duplicate edges are forbidden. The number of edges remains $nk/2$.

The original paper's numerical evidence shows a regime with short paths and substantial local clustering. It is not an identity for every finite sample or a universal transition at $p=0.01$. The fully rewired distribution is not exactly an independent-edge random graph.

Here $C$ means the **mean of local coefficients** $C_i$, with $C_i=0$ for degree below two. Transitivity is a different ratio: three times the triangle count divided by the number of centred neighbour pairs. Global mean distance $L$ is infinite if any distinct pair is disconnected; a mean restricted to reachable pairs is reported separately.`,
      idea:String.raw`The local fraction in soc-2.5 counts edges among each vertex's neighbours. Averaging these fractions and taking one ratio of total counts give different summaries. All distances here come from complete breadth-first searches (soc-2.2), not a sample of paths.

For the unrewired ring, distance is $\lceil d_{\rm ring}/(k/2)\rceil$. In our size/degree domain, each neighbourhood has $3k(k-2)/8$ edges, giving $C(0)=3(k-2)/[4(k-1)]$. Rewiring removes local edges and creates other triangles while changing degrees: survival of an original triangle's three unmarked edges does not prove $C(p)/C(0)=(1-p)^3$.

The explicitly authored **ring retained** comparison instead includes a fixed list of distinct extra candidate edges independently with probability $p$. That family nests, so adding edges cannot increase any shortest distance. The rewiring family does not nest, and neither model guarantees monotone clustering.`,
      caption:String.raw`Both panels use the selected size, degree and seed. Every vertex and edge of the current graph is drawn. Orange edges were rewired or added. Curves give complete-graph statistics at nine marked probabilities; gold gives the current continuous $p$. The probability axis uses $\log_{10}(1+999p)/3$ to include zero. Infinite global distances appear as gaps. Change the seed to inspect a different finite realization.`,
      scope:String.raw`A bounded authored diagnostic at $n=24,48,96$ and $k=4,6$, not the original paper's 1,000-vertex, degree-10, twenty-realization experiment. If no new endpoint is admissible, the edge is retained and counted as blocked. Ideal probabilities assume independent uniforms; the demonstration uses a seeded finite pseudorandom generator. The ring-retained comparison is authored here and is not claimed to reproduce Newman–Watts. No fit to a real network or finite-sample asymptotic certificate is asserted.`,
      deps:['soc-2.2','soc-2.5'],see:['soc-4.1','soc-4.6'],refs:['Watts & Strogatz (1998), pp.440–442, Figs.1–2'],
      tags:['small world','clustering','path length'],credit:'Watts & Strogatz, 1998; bounded finite diagnostics and ring-retained comparison authored here.',links:{source:'https://www.cs.cornell.edu/courses/cs6241/2020sp/readings/Watts-1998-smallworld.pdf'},verify:false,
      viz(v){
        let seed=3,cache=new Map(),info;
        v.shareState('small-world seed',{get:()=>seed,validate:swSeedValid,set:x=>{seed=x;cache.clear();}});
        const size=v.select('vertices n',[24,48,96].map(value=>({value,label:String(value)})),24),degree=v.select('initial degree k',[4,6].map(value=>({value,label:String(value)})),4),mode=v.select('construction',[{value:'rewire',label:'rewire (Watts–Strogatz)'},{value:'retain',label:'ring retained (authored)'}],'rewire');
        const p=v.slider('probability p',0,1,.05,{step:'any',fmt:x=>x.toPrecision(6)});
        v.button('Lattice',()=>p.set(0));v.button('All marked',()=>p.set(1));v.button('Resample',()=>{seed=(seed+1)>>>0;cache.clear();});
        const A=v.stage({x:[-1.18,1.18],y:[-1.18,1.18],equal:true,axes:false,height:340,minWidth:260,title:'complete selected graph'}),B=v.stage({x:[-.06,1.06],y:[-.1,1.2],axes:'box',gutter:true,height:340,minWidth:260,xlabel:'p (transformed axis, including zero)',ylabel:'relative to the lattice',xticks:[0,.001,.01,.1,1].map(x=>[Math.log10(1+999*x)/3,String(x)]),title:'complete-graph L and mean local C'});
        const grid=[0,.001,.003,.01,.03,.1,.3,.6,1],tx=x=>Math.log10(1+999*x)/3;
        v.render(()=>{
          const key=`${size.value}|${degree.value}|${mode.value}|${seed}`;let c=cache.get(key);if(!c){cache.clear();const sk=swSkeleton(size.value,degree.value,seed),base=swBuild(sk,0,mode.value),pts=grid.map(x=>{const g=swBuild(sk,x,mode.value);return[x,g.stats.globalL===null?null:g.stats.globalL/base.stats.globalL,g.stats.meanLocal/base.stats.meanLocal];});c={sk,base,pts};cache.set(key,c);}
          const g=swBuild(c.sk,p.value,mode.value),R=Array.from({length:g.n},(_,i)=>[Math.cos(2*Math.PI*i/g.n),Math.sin(2*Math.PI*i/g.n)]),moved=new Set(g.moved.map(([a,b])=>a<b?`${a},${b}`:`${b},${a}`));
          for(const[a,b]of g.edges)A.line(...R[a],...R[b],{color:moved.has(a<b?`${a},${b}`:`${b},${a}`)?'orange':'muted',width:.9,alpha:.65});R.forEach(([x,y])=>A.dot(x,y,{r:g.n===24?4:g.n===48?3.2:2.5,ring:false,color:'accent'}));
          const ll=g.stats.globalL===null?null:g.stats.globalL/c.base.stats.globalL,cc=g.stats.meanLocal/c.base.stats.meanLocal,top=Math.max(1,...c.pts.flatMap(x=>x.slice(1).filter(y=>y!==null)),ll??0,cc);B.setView([-.06,1.06],[-.12*top,1.2*top]);
          B.path(c.pts.map(([x,l])=>l===null?null:[tx(x),l]),{color:'accent',width:2});B.path(c.pts.map(([x,,c])=>[tx(x),c]),{color:'green',width:2});c.pts.forEach(([x,l,c])=>{if(l!==null)B.dot(tx(x),l,{r:2.8,ring:false,color:'accent'});B.dot(tx(x),c,{r:2.8,ring:false,color:'green'});});B.line(tx(p.value),0,tx(p.value),top,{color:'gold',width:1,dash:[4,4]});if(ll!==null)B.dot(tx(p.value),ll,{r:4,ring:false,color:'gold'});B.dot(tx(p.value),cc,{r:4,ring:false,color:'gold'});info={g,base:c.base.stats,seed};
        });
        v.legend([['accent','global L / lattice L'],['green','mean local C / lattice C'],['gold','current p',{dot:true}],['orange','changed edges']]);
        v.readout(()=>{const{g,base,seed}=info,s=g.stats;return `Seed ${seed}; n=${g.n}, k=${degree.value}, p=${p.value.toPrecision(12)}. Edges ${g.edges.length}; marked ${g.marked}, changed ${g.moved.length}, blocked ${g.blocked}. Components ${s.components}; reachable ordered pairs ${s.reachable}/${s.pairs}. Global L: ${s.globalL===null?'infinite (disconnected)':v.fix(s.globalL,6)}; reachable-pair mean: ${s.reachableL===null?'undefined':v.fix(s.reachableL,6)}. Mean local C=${v.fix(s.meanLocal,6)} (degree<2 contributes zero); transitivity=${s.transitivity===null?'undefined (no neighbour pairs)':v.fix(s.transitivity,6)}. Triangles ${s.triangles}; centred neighbour pairs ${s.wedges}. Lattice L=${v.fix(base.globalL,6)}, mean local C=${v.fix(base.meanLocal,6)}. All pairs and all local neighbourhoods were counted; these finite curves are not an asymptotic or empirical certificate.`;});
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num:'4.6',kind:'Theorem',name:'Kleinberg’s navigability theorem',
      statement:String.raw`Use a bounded $n\times n$ square of lattice points, with nonwrapping Manhattan distance $d$. Every vertex has directed links to its lattice neighbours and one independently chosen directed long-range contact, with endpoint law $d(u,v)^{-r}/Z_u$ for $v\ne u$, where $r\ge0$ is fixed and $Z_u=\sum_{v\ne u}d(u,v)^{-r}$. A long-range contact may also be a lattice neighbour.

Expected delivery time averages over the random network and independently uniform source and target. A decentralized rule knows the grid, target position and contacts revealed by all vertices already touched by the message, but not unrevealed long-range contacts.

At $r=2$, greedy routing has expected time $O((\log n)^2)$. For each fixed $0\le r<2$, every decentralized rule has expected time $\Omega(n^{(2-r)/3})$. For each fixed $r>2$, the lower bound is $\Omega(n^{(r-2)/(r-1)})$. Constants may depend on $r$. Here $n$ is the **side length**, not the number $n^2$ of vertices. These asymptotic expectations do not say that the best finite-sample exponent is exactly two.`,
      idea:String.raw`Greedy routing strictly decreases integer distance because a local neighbour is one step nearer. It never revisits a vertex, so deferred independent contacts remain fresh. At $r=2$, counting at most $4h$ nodes at distance $h$ gives $Z_u\le4\ln(6n)$.

For a phase with $R<d(u,t)\le2R$, let $B$ be the target ball of radius $R$. Boundary phases also need a count: choose the direction with more room in each coordinate at $t$. The resulting quadrant contains a square of side $\lfloor\min(R,n-1)/2\rfloor+1$ inside $B$. Since $R<2(n-1)$, this gives $|B|\ge R^2/16$. Every vertex in $B$ is within $3R$ of $u$, so the next long contact enters $B$ with probability at least $a=1/[576\ln(6n)]$.

Thus the phase tail is bounded by $(1-a)^{m-1}$. The tail-expectation identity (prob-2.2.13) and geometric sum give expected phase time at most $1/a$. Linearity of expectation (prob-1.6.1) sums the $O(\log n)$ phases; distance at most two takes at most two final steps. Independence of phase lengths is not required.

For $r<2$, the normalizer is at least a constant times $n^{2-r}$. Put $\delta=(2-r)/3$. A final ball of radius $n^\delta$ has $O(n^{2\delta})$ vertices. The union bound (prob-1.1.1) makes the chance of discovering a link into it in $\lambda n^\delta$ trials small for sufficiently small fixed $\lambda$. Without such a link, the final local walk takes at least this order of steps, on a positive-probability event that source and target start far apart.

For $r>2$, write $\varepsilon=r-2$. For an integer $m\ge1$, the correctly counted tail is
$\Pr\{d(u,V)>m\}\le4\sum_{h>m}h^{1-r}$. Bounding the sum by its integral gives $4m^{2-r}/(r-2)$.
Set $\gamma=1/(r-1)$, $\beta=(r-2)/(r-1)$, the integer threshold $m=\lceil n^\gamma\rceil$ and $\lambda=\min(\varepsilon,1)/32$. In the first $\lfloor\lambda n^\beta\rfloor$ trials, the union bound gives probability at most $4\lambda/\varepsilon\le1/8$ of seeing a jump longer than $m$. Otherwise, since $m\le2n^\gamma$, total travel is at most $2\lambda n^{\beta+\gamma}<n/4$. A positive fraction of source–target pairs start at least $n/4$ apart. These obstacles prove the polynomial lower bounds; a plotted finite mean is not their proof.`,
      caption:String.raw`A fully specified authored 16×16 square matches the theorem's edge conventions. Every vertex's seeded contact is fixed before route queries. Choose source, target and a trace step; after delivery, later steps remain at the target. Left: all local links, the selected greedy route, and the current vertex's directed long contact. Centre: its entire distance trace. Right: the current vertex's finite-law probability masses from complete endpoint sums in dyadic distance bins. These bars need not be flat at $r=2$. The readout also counts all 65,280 distinct ordered pairs in this one graph, comparing greedy routes with omniscient directed BFS.`,
      scope:String.raw`The theorem assumes ideal independent choices; this finite realization uses 32-bit seeded pseudorandom uniforms and binary64 probabilities. The 16×16 diagnostics do not estimate a success probability, certify an asymptotic exponent or fit a social network. Greedy always arrives because local links enforce progress, for every offered r. The all-pairs finite comparison conditions on this single graph and excludes source=target; the theorem's averaging includes independently uniform sources and targets. Ties use the smallest vertex label. Original source: Kleinberg's complete author paper, Theorems2–3 and §§2–3; the finite model and controls are authored here.`,
      deps:['soc-2.2','prob-1.1.1','prob-1.6.1','prob-2.2.13'],see:['soc-4.5'],refs:['Kleinberg, The Small-World Phenomenon: An Algorithmic Perspective, author version, pp.4–12, Theorems2–3','Easley & Kleinberg, draft10 June2010, §§20.3–20.4 and20.7'],tags:['small world','navigation','decentralised search'],credit:'Jon Kleinberg, 2000; bounded graph diagnostics authored here.',links:{source:'https://www.cs.cornell.edu/home/kleinber/swn.pdf'},verify:false,
      viz(v){
        let seed=5,cache=null,info;v.shareState('navigation seed',{get:()=>seed,validate:swSeedValid,set:x=>{seed=x;cache=null;}});
        const r=v.slider('long-link exponent r',0,4,2,{step:'any',fmt:x=>x.toPrecision(6)}),s=v.slider('source vertex',0,255,0,{int:true}),t=v.slider('target vertex',0,255,255,{int:true}),step=v.slider('trace step (stays after delivery)',0,30,0,{int:true});v.button('Inverse square',()=>r.set(2));v.button('Same source and target',()=>t.set(s.value));v.button('Resample',()=>{seed=(seed+1)>>>0;cache=null;});
        const A=v.stage({x:[-1,16],y:[-1,16],equal:true,axes:false,height:350,minWidth:260,title:'16×16 bounded square; selected route'}),B=v.stage({x:[-1,31],y:[-2,33],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'greedy hop',ylabel:'Manhattan distance to target',title:'complete selected trace'}),C=v.stage({x:[-.7,4.7],y:[-.12,1.2],axes:'box',gutter:true,height:310,minWidth:260,xticks:[[0,'1–<2'],[1,'2–<4'],[2,'4–<8'],[3,'8–<16'],[4,'16–<32']],xlabel:'long-contact distance bin',ylabel:'finite probability mass',title:'current vertex’s endpoint law'});
        const xy=u=>[u%16,Math.floor(u/16)];
        v.render(()=>{if(!cache||cache.r!==r.value||cache.seed!==seed){const g=navigationGraph(r.value,seed);cache={r:r.value,seed,g,summary:navigationSummary(g)};}const g=cache.g,route=navigationRoute(g,s.value,t.value),at=Math.min(step.value,route.hops),u=route.path[at],law=navigationLaw(r.value,u);
          for(let vtx=0;vtx<256;vtx++){if(vtx%16<15)A.line(...xy(vtx),...xy(vtx+1),{color:'faint',width:.65});if(vtx<240)A.line(...xy(vtx),...xy(vtx+16),{color:'faint',width:.65});}A.path(route.path.map(xy),{color:'accent',width:2});A.arrow(...xy(u),...xy(g.contacts[u]),{color:'orange',width:1.5,head:6});A.dot(...xy(u),{r:7,hollow:true,ring:false,color:'gold',width:1.6});for(let vtx=0;vtx<256;vtx++)A.dot(...xy(vtx),{r:1.8,ring:false,color:'muted'});A.dot(...xy(s.value),{r:4,ring:false,color:'purple'});A.dot(...xy(t.value),{r:4,ring:false,color:'green'});
          B.path(route.distances.map((d,j)=>[j,d]),{color:'accent',width:2});route.distances.forEach((d,j)=>B.dot(j,d,{r:2.5,ring:false,color:'accent'}));B.dot(at,route.distances[at],{r:4,ring:false,color:'gold'});law.bins.forEach((p,j)=>C.rect(j-.3,0,j+.3,p,{fill:'accent',fillAlpha:.65,stroke:false}));info={g,route,at,u,law,halving:navigationHalving(law,t.value),summary:cache.summary,seed};
        });
        v.legend([['accent','greedy route / probability'],['orange','current long contact'],['purple','source',{dot:true}],['green','target',{dot:true}],['gold','current step',{dot:true}]]);
        v.readout(()=>{const a=info,h=a.summary;return `Seed ${a.seed}; r=${r.value.toPrecision(12)}; 256 vertices, side length16. Source ${s.value}, target ${t.value}; ${a.route.hops} hops, initial lattice distance ${a.route.distances[0]}; shown step ${a.at} of requested ${step.value}. Current vertex ${a.u}, fixed directed long contact ${a.g.contacts[a.u]}; normalizer Z=${v.fix(a.law.Z,9)}, mass sum=${v.fix(a.law.bins.reduce((x,y)=>x+y,0),9)}. Probability its long contact halves target distance: ${a.halving===null?'not applicable (delivered)':v.fix(a.halving,9)}. All ${h.pairs} distinct ordered pairs: greedy mean ${v.fix(h.greedyMean,6)}, shortest directed BFS mean ${v.fix(h.shortestMean,6)}; greedy is strictly longer for ${h.strict} pairs. These are complete finite-realization diagnostics, not an asymptotic or sampled-success certificate.`;});
      },
    },
  ],
};
