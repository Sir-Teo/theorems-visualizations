// Networks & Collective Behavior — Chapter 4: Random graphs, small worlds and power laws (items 4.1–4.6)
//
// Sources checked for this part (Oct 2026): Dodds, Muhamad & Watts, Science 301: 827 (2003) — 98,847 registrants, 61,168 active
// participants from 166 countries, 18 targets in 13 countries, 24,163 distinct chains of which 384 completed, mean length of the
// completed chains 4.01 (text of the paper); Ugander et al. (arXiv 1111.4503): 721 million users, 68.7 billion edges, mean degree
// ~190, median 99, average distance 4.7, 99.91% in the largest component; Edunov et al. (Facebook Research blog, Feb 2016):
// 1.59 billion users, average distance 4.57 (3.57 intermediaries); Kleinberg, Nature 406: 845 (2000), the delivery-time bounds
// as stated in course notes (side length n of an n × n lattice; q < 2: Omega(n^((2-q)/3)); q > 2: Omega(n^((q-2)/(q-1)))),
// not checked against the paper. Everything drawn from a simulation is labelled as a model on the page.
import {
  rng32, components, meanDistER, triangleStats, poissonPmf, pairUniforms, gnpCoupled, growthCurve, giantTheory,
  wsSkeleton, wsBuild, pathAndClustering, meanDelivery, linkLengthShares, circlePos,
} from './ch04.shared.js';
import { erSeed, erValidSeed, erUniforms, erCircle, erGnp, erDegreeLaw, erCenti, erGiant, erEdgeOrder, erGrowth, erGrowthAt } from './source-audit-erdos-renyi.js';

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
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Six degrees in online networks',
      statement: String.raw`When the whole graph is available, distances can be measured directly instead of by letters. Facebook's friendship graph was measured in May 2011 (Ugander et al., 721 million active users, 68.7 billion friendships, mean degree about 190, median 99): the average distance was **4.7 hops** (3.7 intermediaries) and 99.91% of users lay in one connected component. A 2016 measurement by Facebook's data team (Edunov et al., 1.59 billion active users) gave an average distance of **4.57** hops, i.e. 3.57 intermediaries.

So online social networks are "small" in the sense of 4.3, and have become smaller as they grew and densified. A random graph with the same number of vertices and mean degree predicts a distance of $\approx(\ln N-\gamma)/\ln c+\tfrac12$ with $\gamma\approx0.577$ (Euler's constant); for $N=721$ million and $c=190$ this is about 4.3, a little below the measured 4.7: the real network is slightly less efficient than a random one because it is clustered and has heterogeneous degrees.`,
      idea: String.raw`Growth of a neighbourhood: starting from one vertex, about $c^d$ vertices are within $d$ steps while that is much less than $N$, so the whole graph is reached when $c^d\approx N$, i.e. at $d\approx\ln N/\ln c$. Distances therefore grow with the *logarithm* of the population: multiplying $N$ by 1000 adds only $\ln1000/\ln c\approx1.3$ steps at $c=190$. Clustering and degree heterogeneity both reduce the number of *new* vertices per step, which is why real networks sit above the random-graph value.`,
      caption: String.raw`**Left**: a model: about $c^d$ people lie within $d$ hops, so the neighbourhood fills the population in a few steps; the bars give the share of people at each distance (drag $c$ and $N$). **Right**: the mean distance predicted for a random graph as the population $N$ grows, for the chosen $c$, with the two Facebook measurements marked. Dragging $N$ over six orders of magnitude moves the prediction by only a few hops.`,
      scope: String.raw`The measured averages are for Facebook's active users at the stated dates (not the whole world's population) and count hops along friendship links. The random-graph curve is a model; the 2016 post does not report a mean degree, so no prediction is drawn for it. "Degrees of separation" in the 2016 report equals the distance minus one.`,
      deps: ['soc-4.3'],
      refs: ['E&K §20.4'],
      tags: ['small world', 'social networks', 'online'],
      credit: 'Ugander, Karrer, Backstrom & Marlow, 2011; Edunov et al., 2016',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Six_degrees_of_separation', arxiv: 'https://arxiv.org/abs/1111.4503' },
      verify: true,
      viz(v) {
        const fmtN = (x) => (x >= 1e9 ? `${(x / 1e9).toPrecision(3)} billion` : x >= 1e6 ? `${(x / 1e6).toPrecision(3)} million` : x >= 1e3 ? `${Math.round(x / 1e3 * 10) / 10} thousand` : `${Math.round(x)}`);
        const cS = v.slider('mean degree $c$', 3, 400, 190, { step: 1, int: true });
        const NS = v.slider('population $N$', 1e3, 1e10, 7.21e8, { log: true, fmt: fmtN });
        const A = v.stage({ x: [-0.5, 9.5], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'distance $d$ (hops)', ylabel: 'share of the population at distance $d$', title: 'model: how a neighbourhood fills the network', minWidth: 280, weight: 1 });
        const B = v.stage({ x: [1e3, 1e10], y: [0, 9], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: 'population $N$', ylabel: 'mean distance', title: 'random-graph prediction vs Facebook', minWidth: 300, weight: 1.2 });
        // occupancy model: within d hops the expected share of the population is 1 − exp(−c^d / N)
        const reach = (c, N, d) => (d === 0 ? 1 / N : 1 - Math.exp(-Math.pow(c, d) / N));
        let st = null;
        v.render(() => {
          const c = cS.value, N = NS.value; let mean = 0, pk = 0;
          const P = []; for (let d = 1; d <= 9; d++) { const x = reach(c, N, d) - reach(c, N, d - 1); P[d] = x; mean += d * x; pk = Math.max(pk, x); }
          P.forEach((x, d) => { if (x > 1e-4) A.rect(d - 0.4, 0, d + 0.4, x, { fill: 'accent', fillAlpha: 0.6, stroke: false }); });
          A.setView([-0.5, 9.5], [0, pk * 1.25]);
          A.vline(mean, { color: 'gold', width: 2 });
          A.text(`mean ${v.fix(mean, 2)}`, mean, pk * 1.12, { dx: 6, size: 11.5, color: 'gold', weight: 700, align: 'left' });
          B.fn((x) => meanDistER(x, c), { color: 'accent', width: 2.4, n: 200 });
          B.dot(7.21e8, 4.74, { r: 6, color: 'red' }); B.text('2011: 4.74', 7.21e8, 4.74, { dx: -9, dy: -14, size: 11.5, weight: 700, color: 'red', align: 'right' });
          B.dot(7.21e8, meanDistER(7.21e8, 190), { r: 5, hollow: true, color: 'green' });
          B.dot(1.59e9, 4.57, { r: 6, color: 'purple' }); B.text('2016: 4.57', 1.59e9, 4.57, { dx: 10, dy: 20, size: 11.5, weight: 700, color: 'purple', align: 'left' });
          B.vline(N, { color: 'gold', width: 1.4, dash: true });
          B.dot(N, meanDistER(N, c), { r: 5, color: 'gold' });
          st = { c, N, sm: mean, pred: meanDistER(N, c), p2011: meanDistER(7.21e8, 190) };
        });
        v.legend([['accent', 'random graph with mean degree $c$'], ['red', 'Facebook, May 2011 (measured)', { dot: true }], ['purple', 'Facebook, 2016 (measured)', { dot: true }], ['green', 'random graph, same $N$ and $c$ as 2011', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, N, sm, pred, p2011 } = st;
          return String.raw`$c=${c}$, $N=$ ${fmtN(N)}: neighbourhood-growth model mean **${v.fix(sm, 2)}**, formula $(\ln N-\gamma)/\ln c+\tfrac12=$ **${v.fix(pred, 2)}** · within $d$ hops about $c^d$ people (at $c=${c}$: ${[1, 2, 3, 4].map((d) => fmtN(Math.pow(c, d))).join(', ')} for $d=1,\dots,4$) · each factor of 1000 in $N$ adds $\ln1000/\ln c=${v.fix(Math.log(1000) / Math.log(c), 2)}$ hops
2011: measured 4.74 vs random-graph value ${v.fix(p2011, 2)} ($N=721$ million, $c=190$); 2016: measured 4.57 with 1.59 billion users`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Watts–Strogatz small-world model',
      statement: String.raw`Start with $n$ vertices on a ring, each joined to its $k$ nearest neighbours ($k$ even). With probability $p$ rewire each edge: keep one end and move the other to a vertex chosen uniformly at random (no loops or repeated edges). Let $L(p)$ be the mean shortest-path length and $C(p)$ the mean clustering coefficient.

(a) $p=0$ is a **regular lattice**: highly clustered, $C(0)\approx\tfrac34$ for $k\gg1$, but with long distances, $L(0)\approx n/2k$.

(b) $p=1$ is essentially a **random graph**: $C\approx k/n$ and $L\approx\ln n/\ln k$.

(c) In between, for small $p$ a few random shortcuts cut $L$ drastically while $C$ barely moves: $L(p)/L(0)$ collapses by $p\sim10^{-2}$ while $C(p)/C(0)\approx(1-p)^3$ stays near 1. A wide range of $p$ gives a network that is **both clustered and small**, like the real networks measured in the original paper.`,
      idea: String.raw`Clustering is a *local* property: rewiring one edge destroys only the triangles through that edge, so $C$ falls in proportion to $(1-p)^3$ (an original triangle survives only if all three of its edges do). Path length is a *global* property: a single shortcut links two distant parts of the ring and shortens the paths of everyone near both ends, so a handful of shortcuts, $pnk/2\gtrsim1$, changes the scaling of $L$ from linear in $n$ to logarithmic. The two properties therefore respond at very different values of $p$, which opens the window in which both are satisfied.`,
      caption: String.raw`**Left**: a 24-vertex ring; the shortcuts (orange) appear as you raise $p$ (the same random choices are reused, so the graphs nest). **Right**: simulated $L(p)/L(0)$ and $C(p)/C(0)$ on a log-$p$ axis for a 300-vertex ring with $k=6$ (average of 4 runs per point), the formula $(1-p)^3$ (dashed), and the live value for the current $p$. Switch to *add shortcuts* (Newman–Watts) to keep the lattice intact.`,
      scope: String.raw`Stated for $n\gg k\gg\ln n\gg1$ (the limits in the original paper). The curves use $n=300$, $k=6$, a much smaller ring than the paper's 1000 vertices with $k=10$, so the collapse sits at somewhat larger $p$. The shortcut variant is due to Newman and Watts (1999, from memory).`,
      deps: ['soc-2.5', 'soc-4.1'],
      refs: ['E&K §20.2'],
      tags: ['small world', 'clustering', 'path length'],
      credit: 'Watts & Strogatz, 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model' },
      verify: true,
      viz(v) {
        const mode = v.select('model', [{ value: 'rewire', label: 'rewire edges (Watts–Strogatz)' }, { value: 'add', label: 'add shortcuts (Newman–Watts)' }], 'rewire');
        const pS = v.slider('probability $p$', 0.001, 1, 0.05, { log: true, sig: 2 });
        const SD = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 340, title: 'a ring of 24 (k = 4)', minWidth: 280 });
        const SC = v.stage({ x: [1e-3, 1], y: [0, 1.08], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'probability $p$', ylabel: 'relative to $p=0$', title: 'n = 300, k = 6', minWidth: 320, weight: 1.3 });
        const sk24 = wsSkeleton(24, 4, 3), sk300 = wsSkeleton(300, 6, 9);
        const ring = circlePos(24, 1, Math.PI / 2);
        const G = v.graph(SD, { nodes: ring.map(([x, y], i) => ({ id: i, x, y })), edges: [], layout: 'none', r: 6, autoRadius: false, draggable: false });
        const PG = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1], curves = {};
        const curveOf = (m) => curves[m] ??= (() => {
          const b = pathAndClustering(wsBuild(sk300, 0, m).g);
          const pts = PG.map((p) => { let Ls = 0, Cs = 0; for (let r = 0; r < 4; r++) { const r2 = pathAndClustering(wsBuild(wsSkeleton(300, 6, 100 + r), p, m).g); Ls += r2.L; Cs += r2.C; } return [p, Ls / 4 / b.L, Cs / 4 / b.C]; });
          return { base: b, pts };
        })();
        let st = null;
        v.render(() => {
          const p = pS.value, m = mode.value, W = wsBuild(sk24, p, m), moved = new Set(W.moved.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
          G.edges = W.g.edges.map(([a, b]) => ({ from: a, to: b, mv: moved.has(a < b ? `${a}-${b}` : `${b}-${a}`) }));
          G.draw({ nodeColor: () => 'accent', nodeLabel: () => '', edgeColor: (e) => (e.mv ? 'orange' : 'muted'), edgeWidth: (e) => (e.mv ? 2.4 : 1.4) });
          const cv = curveOf(m);
          SC.fn((x) => Math.pow(1 - x, 3), { color: 'orange', width: 1.5, dash: [6, 4] });
          SC.path(cv.pts.map(([x, l]) => [x, l]), { color: 'accent', width: 2.4 }); SC.dots(cv.pts.map(([x, l]) => [x, l]), { r: 3.5, color: 'accent' });
          SC.path(cv.pts.map(([x, , c]) => [x, c]), { color: 'orange', width: 2.4 }); SC.dots(cv.pts.map(([x, , c]) => [x, c]), { r: 3.5, color: 'orange' });
          const live = pathAndClustering(wsBuild(sk300, p, m).g);
          SC.vline(p, { color: 'gold', width: 1.4, dash: true });
          SC.dot(p, live.L / cv.base.L, { r: 5.5, color: 'gold' }); SC.dot(p, live.C / cv.base.C, { r: 5.5, color: 'gold' });
          st = { p, live, base: cv.base, moved: W.moved.length, m };
        });
        v.legend([['accent', 'path length $L(p)/L(0)$'], ['orange', 'clustering $C(p)/C(0)$'], ['orange', '$(1-p)^3$', { dash: true }], ['gold', 'current $p$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, live, base, moved } = st;
          return String.raw`$p=${v.fix(p, 3)}$ · on the ring of 24: ${moved} ${st.m === 'add' ? 'shortcuts added' : 'edges rewired'} of 48 · on $n=300$: $L=${v.fix(live.L, 2)}$ (lattice ${v.fix(base.L, 2)}, $n/2k=25$), $C=${v.fix(live.C, 3)}$ (lattice ${v.fix(base.C, 3)}, $\tfrac34(k-2)/(k-1)=${v.fix(0.75 * 4 / 5, 3)}$) → $L/L(0)=${v.fix(live.L / base.L, 2)}$, $C/C(0)=${v.fix(live.C / base.C, 2)}$, $(1-p)^3=${v.fix(Math.pow(1 - p, 3), 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Kleinberg’s navigability theorem',
      statement: String.raw`Take an $n\times n$ lattice of people; each knows its four lattice neighbours and one extra *long-range contact* $w$, chosen with probability proportional to $d(u,w)^{-q}$, where $d$ is lattice distance. A message is sent from a random source to a random target using a **decentralised** rule: every holder knows only its own contacts and the lattice position of the target, and passes the message to the contact closest to the target (greedy routing).

(a) For $q=2$ (the dimension of the lattice) the expected delivery time is $O((\log n)^2)$: polylogarithmic in the side length.

(b) For every other exponent no decentralised rule is polylogarithmic: the expected time is at least a power of $n$: $\Omega(n^{(2-q)/3})$ for $q<2$ and $\Omega(n^{(q-2)/(q-1)})$ for $q>2$.

So short paths may exist without being **findable**: without a map, a message can be routed efficiently only when long links are spread evenly over all distance scales.`,
      idea: String.raw`At $q=2$ the probability that the long link of $u$ has length in $[2^j,2^{j+1})$ is about the same for every $j$: a link falls in each "distance scale" equally often (the number of vertices at that scale grows like $d^2$ and each is chosen with weight $d^{-2}$). The greedy message needs to halve its distance to the target, and in each such phase it has a chance of order $1/\log n$ per step of finding a link that does it, so each phase costs $O(\log n)$ steps and there are $O(\log n)$ phases. For $q<2$ links are too long, so they are rarely close enough to the target to help in the final approach; for $q>2$ links are too short to cross the lattice quickly. In both cases the missing scales cost a polynomial factor.`,
      caption: String.raw`A model run on real routes: **left**, mean greedy delivery time against $q$ for lattices of side 32, 128 and 512 (200 random messages per point); **middle**, delivery time against side length for the chosen $q$ on log–log axes, with the theorem's lower-bound slopes dashed; **right**, the share of long links in each distance scale $[2^j,2^{j+1})$: flat only at $q=2$. Finite lattices are small, so the best $q$ drifts towards 2 only slowly as the side grows.`,
      scope: String.raw`Statement as given in course notes for the $n\times n$ lattice with one long-range contact per node; the lower bounds in terms of the side length are quoted from those notes and were not checked against Kleinberg's paper. The simulated lattice is a torus with Manhattan distance, for sizes up to 512×512; the optimum at finite size is below 2, and the theorem is asymptotic.`,
      deps: ['soc-4.5'],
      refs: ['E&K §20.3'],
      tags: ['small world', 'navigation', 'decentralised search'],
      credit: 'Jon Kleinberg, 2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-world_routing' },
      verify: true,
      viz(v) {
        const qS = v.slider('exponent $q$', 0, 4, 2, { step: 0.05 });
        const A = v.stage({ x: [0, 4], y: [2, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'exponent $q$', ylabel: 'mean delivery time', title: 'delivery time vs q', minWidth: 260, weight: 1 });
        const B = v.stage({ x: [8, 512], y: [1, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'side length $n$', ylabel: 'mean delivery time', title: 'scaling at the chosen q', minWidth: 260, weight: 1 });
        const C = v.stage({ x: [-0.6, 9.6], y: [0, 0.6], axes: 'box', gutter: true, height: 320, xlabel: 'scale $j$: link length in $[2^j, 2^{j+1})$', ylabel: 'share of long links', title: 'long links by distance scale', minWidth: 260, weight: 1 });
        const SIZES = [32, 128, 512], SC = ['green', 'accent', 'purple'], GRID = [];
        for (let q = 0; q <= 4.001; q += 0.25) GRID.push(+q.toFixed(2));
        let curves = null;
        const mkCurves = () => (curves ??= SIZES.map((L) => GRID.map((q) => meanDelivery(L, q, 200, 5))));
        let st = null;
        v.render(() => {
          const q = qS.value, cv = mkCurves();
          cv.forEach((row, i) => { A.path(GRID.map((g, j) => [g, row[j]]), { color: SC[i], width: 2.2 }); A.dots(GRID.map((g, j) => [g, row[j]]), { r: 2.6, color: SC[i] }); });
          A.vline(q, { color: 'gold', width: 1.5, dash: true }); A.vline(2, { color: 'muted', width: 1, dash: [3, 4] });
          const sides = [8, 16, 32, 64, 128, 256, 512], T = sides.map((L) => meanDelivery(L, q, 200, 5));
          B.path(sides.map((L, i) => [L, T[i]]), { color: 'gold', width: 2.4 }); B.dots(sides.map((L, i) => [L, T[i]]), { r: 3.8, color: 'gold' });
          const e = q < 2 ? (2 - q) / 3 : q > 2 ? (q - 2) / (q - 1) : 0;
          if (q !== 2) B.fn((x) => T[0] * Math.pow(x / 8, e), { color: 'red', width: 1.5, dash: [6, 4], domain: [8, 512] });
          else B.fn((x) => T[0] * (Math.log2(x) / 3) ** 2, { color: 'green', width: 1.5, dash: [6, 4], domain: [8, 512] });
          const sh = linkLengthShares(512, q);
          sh.forEach((s, j) => { C.rect(j - 0.4, 0, j + 0.4, s, { fill: 'accent', fillAlpha: 0.65, stroke: false }); });
          C.setView([-0.6, 9.6], [0, Math.max(0.2, ...sh) * 1.15]);
          const slope = Math.log(T[6] / T[2]) / Math.log(512 / 32);
          st = { q, T, e, slope, best: GRID[cv[2].indexOf(Math.min(...cv[2]))] };
        });
        v.legend([['green', 'side 32'], ['accent', 'side 128'], ['purple', 'side 512'], ['gold', 'chosen $q$', { dot: true }], ['red', 'lower-bound slope (or $\\log^2n$ at $q=2$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { q, T, e, slope, best } = st;
          return String.raw`$q=${v.fix(q, 2)}$: delivery time ${v.fix(T[0], 1)} (side 8) → ${v.fix(T[6], 1)} (side 512); measured log–log slope between sides 32 and 512: **${v.fix(slope, 2)}**; the theorem's lower-bound exponent: **${v.fix(e, 2)}**${q === 2 ? ' (none: polylogarithmic)' : ''}
best exponent on the 512 × 512 lattice (grid step 0.25): $q=${best}$ — the optimum sits below 2 at these sizes and creeps towards 2 as $n$ grows`;
        });
      },
    },
  ],
};
