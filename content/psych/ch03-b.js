// Psychology & Perception — Chapter 3: Scaling sensation (items 3.6–3.10; 3.1–3.5 are in ch03.js)
import { Phi, zq, logTicks, sig } from './ch03.shared.js';
import { luceState } from './source-audit-luce.js';
import { mdsSynthetic, mdsView } from './source-audit-mds.js';
import { loudnessModel, loudnessAudio } from './source-audit-loudness.js';

export default {
  collection: 'psych',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Method',
      name: 'Category scaling and range–frequency effects',
      statement: String.raw`In **category scaling** (rating) the observer assigns each stimulus to one of a small number of ordered categories (1 to 7, say) according to how large it seems. The resulting ratings are not a function of the stimulus alone but of the *set of stimuli* presented. The **range–frequency model** says that a stimulus $s$ in a context with smallest and largest values $s_{\min},s_{\max}$ gets the judgment
$$J(s)=w\,R(s)+(1-w)\,F(s),\qquad R(s)=\frac{s-s_{\min}}{s_{\max}-s_{\min}},\quad F(s)=\text{fraction of the context stimuli below }s,$$
and the rating is $J$ mapped onto the category scale (here $1+6J$). The **range value** $R$ places $s$ within the context's range; the **frequency value** $F$ is its percentile rank. The weight $w\in[0,1]$ is fitted to data and depends on the task. In a context crowded with small stimuli, the same medium stimulus has a higher percentile rank and so gets a *higher* rating than in a context crowded with large ones.`,
      idea: String.raw`Category ratings lack the anchor that a standard and a ratio instruction give magnitude estimation (3.1): the observer must spread a fixed number of categories over whatever stimuli appear. Two natural strategies are to divide the range into equal subranges and to use each category equally often; the model says that people compromise between them. Because $F$ depends on the distribution of the context, any rating experiment confounds the stimulus with its context: skewing the distribution is the simplest way to shift the ratings of an unchanged stimulus (and, in everyday terms, why a fixed salary or a fixed temperature feels different depending on the company it is judged in).`,
      caption: String.raw`Three contexts, each made of the same 21 stimuli between 1 and 10 (the squares' side, in arbitrary units): many **small** squares (skewed), evenly spaced (**uniform**), and many **large**. Drag the **gold** handle to choose a test stimulus: the **right** panel shows the 1–7 rating it would get in each context. With the range weight $w=1$ the three curves coincide (a pure range rule); with $w=0$ the ratings follow only the percentile rank and differ most. The curves are the model's predictions for chosen contexts, not data.`,
      deps: ['psych-3.1'],
      refs: ['Gescheider ch. 10'],
      tags: ['category scaling', 'context effects', 'range–frequency'],
      credit: 'A. Parducci, “Category judgment: a range-frequency model”, Psychological Review 72 (1965): 407–418',
      scope: String.raw`A descriptive model of category ratings of a single dimension with a fixed stimulus set; the weight $w$ is fitted, varies with the task and instructions, and the model says nothing about judgments of an isolated stimulus. The qualitative effect (ratings follow the skew of the context) is the part most often reported; the exact weights depend on the study.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Range%E2%80%93frequency_theory' },
      viz(v) {
        const M = v.M, NS = 21, LO = 1, HI = 10;
        const CTX = [
          { id: 'small', label: 'many small', c: 'orange', g: (u) => u * u },
          { id: 'unif', label: 'uniform', c: 'accent', g: (u) => u },
          { id: 'large', label: 'many large', c: 'green', g: (u) => 1 - (1 - u) * (1 - u) },
        ].map((c) => ({ ...c, xs: M.range(NS).map((k) => LO + (HI - LO) * c.g(k / (NS - 1))) }));
        const wSl = v.slider('range weight $w$', 0, 1, 0.5, { step: 0.01 });
        const st1 = v.stage({ x: [0.3, 10.7], y: [-0.2, 4.2], axes: false, height: 290, weight: 1, minWidth: 290, title: 'three contexts: the same range, different crowding' });
        const st2 = v.stage({ x: [1, 10], y: [1, 7], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 270, xlabel: 'test stimulus size', ylabel: 'rating (1–7)', yticks: [1, 2, 3, 4, 5, 6, 7], title: 'rating of the test stimulus in each context' });
        const hs = st1.handle(5.5, 3.75, { color: 'gold', r: 9, constrain: (x) => [M.clamp(x, LO, HI), 3.75] });
        const Fv = (c, s) => { const xs = c.xs; if (s <= xs[0]) return 0; if (s >= xs[NS - 1]) return 1; let k = 0; while (xs[k + 1] < s) k++; return (k + (s - xs[k]) / (xs[k + 1] - xs[k])) / (NS - 1); };
        const rate = (c, s, w) => 1 + 6 * (w * (s - LO) / (HI - LO) + (1 - w) * Fv(c, s));
        v.legend(CTX.map((c) => [c.c, c.label, { dot: true }]));
        let st = null;
        v.render(() => {
          const w = wSl.value, s = hs.x;
          CTX.forEach((c, i) => {
            const y = 2.7 - i * 1.15;
            st1.line(LO, y, HI, y, { color: 'grid', width: 1 });
            for (const x of c.xs) st1.dot(x, y, { r: 3.8, color: c.c, ring: false });
            st1.text(c.label, LO, y, { dy: 17, align: 'left', size: 11.5, color: c.c, weight: 700 });
          });
          st1.line(s, -0.1, s, 3.75, { color: 'gold', dash: [4, 3], width: 1.6 });
          st1.text('test stimulus  ' + v.fix(s, 1), s, 4.1, { align: 'center', size: 12, weight: 700, color: 'ink' });
          for (let k = 1; k <= 7; k++) st2.line(1, k, 10, k, { color: 'grid', width: 0.8 });
          for (const c of CTX) st2.fn((x) => rate(c, x, w), { domain: [LO, HI], color: c.c, width: 2.8, n: 220 });
          st2.line(s, 1, s, 7, { color: 'gold', dash: [4, 3], width: 1.4 });
          for (const c of CTX) st2.dot(s, rate(c, s, w), { r: 6, color: c.c });
          st = { s, w, r: CTX.map((c) => rate(c, s, w)) };
        });
        v.readout(() => st ? `Test size ${v.fix(st.s, 2)}, $w$ = ${v.fix(st.w, 2)}: rating ${v.fix(st.r[0], 2)} among many small, ${v.fix(st.r[1], 2)} among uniform, ${v.fix(st.r[2], 2)} among many large · context shifts the rating of the unchanged stimulus by up to ${v.fix(Math.max(...st.r) - Math.min(...st.r), 2)} categories (0 when $w=1$)` : '');
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Law',
      name: 'Thurstone’s law of comparative judgment',
      statement: String.raw`Suppose each of $m$ stimuli $i$ produces on each presentation a value of a “discriminal process” $x_i$, normally distributed with mean $S_i$ (the stimulus's position on the sensory scale) and standard deviation $\sigma_i$. In a paired comparison the observer says the stimulus with the larger momentary value is the “greater”. The **law of comparative judgment** gives the probability $p_{ij}=P(i\text{ judged greater than }j)$ through the normal quantile:
$$z_{ij}=\Phi^{-1}(p_{ij})=\frac{S_i-S_j}{\sqrt{\sigma_i^2+\sigma_j^2-2r_{ij}\sigma_i\sigma_j}} .$$
In **Case V**, the processes have equal spread and are uncorrelated, so $z_{ij}=(S_i-S_j)/(\sigma\sqrt2)$: the matrix of $z$ scores is a matrix of differences, and the scale values (up to origin and unit $\sigma\sqrt2$) are the row means $\bar z_i=\frac1m\sum_j z_{ij}=(S_i-\bar S)/(\sigma\sqrt2)$, with $z_{ii}=0$.`,
      idea: String.raw`It is the equal-variance Gaussian model of detection (psych-2.1) applied to two stimuli instead of signal and noise: the probability that $x_i>x_j$ is $\Phi$ of the mean difference over the standard deviation of the difference, so the z-transformed proportions are *linear* in the unknown scale values and a one-line average inverts them. The unit of the scale is the spread $\sigma$ of the noise itself, which is how the law turns proportions of choices (ordinal data) into an interval scale. Proportions of 0 or 1 give infinite $z$ and must be adjusted or dropped, which is why the stimuli must be close enough to be confusable.`,
      caption: String.raw`Five stimuli (think of lifted weights) with true positions $S_i$ on the sensory scale, each drawn as its bell curve of momentary values. Drag the **handles** to move the stimuli and the **noise** slider to widen the curves. Each pair is compared $n$ times by a simulated observer: the **table** shows the proportion of trials on which the row stimulus was judged greater, and the **scatter** plots the scale values recovered from the $z$ scores (Case V) against the true ones; they fall on the diagonal, closer for more trials. *New judgments* resamples. Simulated data.`,
      deps: ['psych-2.1'],
      refs: ['Gescheider ch. 9'],
      tags: ['Thurstone', 'paired comparison', 'scaling'],
      credit: 'L. L. Thurstone, “A law of comparative judgment”, Psychological Review 34 (1927): 273–286',
      scope: String.raw`Holds for the stated Gaussian model; Case V assumes equal discriminal dispersions and no correlation between the processes. Proportions near 0 or 1 give unstable $z$ scores. Real judgments often violate transitivity or equal dispersions (cases I–IV relax this), and the law fits choice proportions without saying that the scale measures a unit of sensation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_comparative_judgment' },
      viz(v) {
        const M = v.M, NI = 5, NAME = 'ABCDE', COL = ['accent', 'orange', 'green', 'purple', 'red'];
        let seed = 12, TR = null, tKey = '';
        const sg = v.slider('noise $\\sigma$', 0.3, 2, 0.8, { step: 0.05 });
        const nn = v.slider('judgments per pair $n$', 5, 400, 60, { step: 1, int: true });
        v.button('New judgments', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const sc = v.stage({ x: [0, 7], y: [-0.18, 0.56], axes: 'box', gutter: true, height: 250, weight: 1, minWidth: 320, full: true, xlabel: 'sensory scale (true positions $S_i$)', yticks: [], title: 'the discriminal processes' });
        const tb = v.stage({ x: [-0.2, 6.2], y: [-0.2, 6.4], axes: false, height: 300, weight: 1, minWidth: 260, title: 'proportion judged greater: row over column' });
        const sp = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: 'box', gutter: true, height: 300, weight: 0.9, minWidth: 260, xlabel: 'true scale value $(S_i-\\bar S)/(\\sigma\\sqrt2)$', ylabel: 'recovered $\\bar z_i$', title: 'Case V recovers the scale' });
        const S0 = [1.0, 2.1, 2.7, 4.2, 5.8];
        const H = S0.map((s, i) => sc.handle(s, 0.0, { color: COL[i], r: 8, label: NAME[i], constrain: (x) => [M.clamp(x, 0.3, 6.7), 0] }));
        const cnt = (S, s, n) => {
          const key = seed + '|' + n; if (key !== tKey) { const R = v.rng(seed); TR = []; for (let i = 0; i < NI; i++) { TR.push([]); for (let j = 0; j < NI; j++) TR[i].push(j > i ? M.range(400).map(() => [R.normal(), R.normal()]) : null); } tKey = key; }
          const P = M.zeros(NI, NI);
          for (let i = 0; i < NI; i++) for (let j = i + 1; j < NI; j++) { let k = 0; for (let t = 0; t < n; t++) { const [a, b] = TR[i][j][t]; if (S[i] + s * a > S[j] + s * b) k++; } P[i][j] = k; P[j][i] = n - k; }
          return P;
        };
        v.legend([['accent', 'recovered scale value', { dot: true }], ['muted', 'perfect recovery', { dash: true }]]);
        let st = null;
        v.render(() => {
          const s = sg.value, n = nn.value, S = H.map((h) => h.x), Sb = M.mean(S), P = cnt(S, s, n);
          const dens = (x, mu) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
          const top = Math.max(...S.map((m) => dens(m, m)));
          sc.setView([0, 7], [-0.14 * top, top * 1.12]);
          S.forEach((m, i) => { sc.fn((x) => dens(x, m), { domain: [0, 7], color: COL[i], width: 2.2, n: 160, fill: true }); sc.line(m, 0, m, dens(m, m), { color: COL[i], dash: [3, 3], width: 1 }); });
          // table
          const x0 = 0.6, y0 = 5.2, cw = 1.1, ch = 0.95;
          for (let j = 0; j < NI; j++) tb.text(NAME[j], x0 + (j + 0.5) * cw, y0 + 0.6, { align: 'center', size: 13, weight: 700, color: COL[j] });
          const z = M.zeros(NI, NI);
          for (let i = 0; i < NI; i++) {
            tb.text(NAME[i], x0 - 0.3, y0 - (i + 0.5) * ch, { align: 'center', size: 13, weight: 700, color: COL[i] });
            for (let j = 0; j < NI; j++) {
              const cx = x0 + j * cw, cy = y0 - (i + 1) * ch, pr = i === j ? 0.5 : P[i][j] / n;
              tb.rect(cx + 0.03, cy + 0.03, cx + cw - 0.03, cy + ch - 0.03, { fill: i === j ? 'faint' : 'accent', fillAlpha: i === j ? 0.1 : 0.08 + 0.55 * pr, stroke: false });
              tb.text(i === j ? '—' : pr.toFixed(2).replace(/^0/, ''), cx + cw / 2, cy + ch / 2, { align: 'center', size: 13, weight: 600, color: i === j ? 'muted' : 'ink' });
              z[i][j] = i === j ? 0 : zq(M, (P[i][j] + 0.5) / (n + 1));
            }
          }
          // recovered scale
          const est = z.map((r) => M.mean(r)), tru = S.map((x) => (x - Sb) / (s * Math.SQRT2));
          sp.setView([-1.5, 1.5], [-1.5, 1.5]);
          sp.line(-1.5, -1.5, 1.5, 1.5, { color: 'muted', dash: [5, 4], width: 1.4 });
          const lim = Math.max(1.5, ...tru.map(Math.abs), ...est.map(Math.abs)) * 1.05; sp.setView([-lim, lim], [-lim, lim]);
          est.forEach((e, i) => { sp.dot(tru[i], e, { r: 7, color: COL[i], label: NAME[i], labelPos: 'ne' }); });
          const rms = Math.sqrt(M.mean(est.map((e, i) => (e - tru[i]) ** 2)));
          st = { rms, n, s, nTot: n * 10 };
        });
        v.readout(() => st ? `${st.n} judgments × 10 pairs = ${st.nTot} trials · root-mean-square error of the recovered scale values: ${v.fix(st.rms, 3)} (in units of $\\sigma\\sqrt2$) · the table's proportions are $\\Phi$ of scale differences, e.g. a pair $1\\sigma\\sqrt2$ apart is judged correctly ${(100 * Phi(M, 1)).toFixed(0)}% of the time` : '');
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Principle', name: 'Luce’s choice axiom',
      statement: String.raw`Let $T$ be a finite nonempty set of alternatives. For **every nonempty** $S\subseteq T$, let $P_S$ be a probability distribution on $S$, with $P_S(i)>0$ for each offered $i$. Singletons have probability 1; larger menus have probabilities strictly below 1. In this positive case, the choice axiom requires, for $i\in S\subseteq U\subseteq T$,
$$P_U(i)=P_S(i)P_U(S),$$
where $P_U(S)=\sum_{k\in S}P_U(k)$. It is equivalent to **independence of irrelevant alternatives** (IIA): for distinct $i,j\in S\subseteq U\subseteq T$,
$$\frac{P_S(i)}{P_S(j)}=\frac{P_U(i)}{P_U(j)}.$$
It is also equivalent to positive weights, fixed across all menus, satisfying
$$P_S(i)=\frac{v_i}{\sum_{k\in S}v_k}.$$
The weights are determined up to a common positive multiplier. For two alternatives, the same formula is $P_{\{i,j\}}(i)=v_i/(v_i+v_j)$.

This is the positive, finitely additive setting in **Luce's own 2008 exposition** of his earlier axiom. His account also discusses an additional original clause for zero pairwise probabilities; that clause is outside the theorem stated here. Choice-set notation describes different choice contexts, rather than assuming ordinary conditioning on one preexisting probability space.`,
      idea: String.raw`Each menu has positive masses summing to one, using the finite probability-distribution definition in prob-1.1.1a. The axiom makes the common factor $P_U(S)$ cancel in each pair's odds. Conversely, IIA plus normalization gives $P_S(i)=P_U(i)/P_U(S)$ and hence the axiom. Set $v_i=P_T(i)$. IIA makes every ratio $P_S(i)/P_S(j)$ equal to $v_i/v_j$; normalization then forces the weight formula. Conversely that formula makes all menu denominators cancel in the odds. If weights $v$ and $w$ give the same full-menu probabilities, $w_i=cv_i$ with $c=(\sum w)/(\sum v)>0$. Thus absolute strengths are not identified. Writing $\theta_i=\log v_i$ gives logistic pairwise probabilities $1/(1+e^{\theta_j-\theta_i})$; log weights are identified up to a common additive constant.

A similarity label alone does not mathematically contradict IIA. The **authored copy rule** below supplies a specific counterexample: group B and C together, give that group its largest member weight, then split its probability proportionally within the group. When C copies B exactly, adding C leaves an outside option's probability unchanged and halves B's share. Its odds against B therefore double. This is a model assumption used to demonstrate failure, not an experimental finding or a claim that every similar pair behaves this way.`,
      caption: String.raw`Change the positive strengths with sliders or drag their bar tops; toggle any offered menu, including a singleton or the empty menu. With **C copies B** enabled, C's strength control is locked and its separate handle is hidden. The authored group rule is active only with this copy lock; without it, both rule selectors use individual Luce weights. The right bars show the selected menu, with current probabilities in a row beneath them; grey rings show the fixed A/B-only reference when both are offered. **Equal-clone counterexample** selects A,B,C at equal strength under the authored group rule: probabilities become $(1/2,1/4,1/4)$. Switching to Luce gives thirds. The readout compares the same current menu with C removed, holding D fixed, and audits all 15 nonempty menus and 54 nested-menu pair comparisons. A single displayed pair's unchanged odds cannot establish global IIA.`,
      scope: String.raw`The theorem assumes a full finite family of positive choice distributions. Empty menus have no choice distribution; zero-weight/deterministic multi-option cases and incomplete-menu identification require other hypotheses. No estimates from finite trial counts are fitted here. The group rule is a chosen alternative to IIA, not Luce's model, a fitted nested-logit model or a general law of similarity. Normalizing strengths changes their common scale only. A floating-point residual audit describes the specified four-option model; exact conclusions come from its formulas, and do not certify empirical choice data.`,
      deps: ['prob-1.1.1a'], see: ['psych-3.7'],
      refs: ['R. Duncan Luce (2008), Luce’s choice axiom, Scholarpedia 3(12):8077, §1 and §§2.1–2.4', 'http://www.scholarpedia.org/article/Luce%27s_choice_axiom'],
      tags: ['choice axiom','paired choice','iia'], credit: 'R. Duncan Luce, 2008 author exposition of the 1959 axiom', verify: false,
      links: { source:'http://www.scholarpedia.org/article/Luce%27s_choice_axiom',doi:'https://doi.org/10.4249/scholarpedia.8077' },
      viz(v) {
        const names='ABCD',colors=['accent','orange','green','purple'],initial=[4,3,3,1],strength=initial.map((x,i)=>v.slider('strength '+names[i],.3,10,x,{step:.1,decimals:3}));
        const offer=[...names].map((n,i)=>v.toggle('offer '+n,i<3)),copy=v.toggle('C copies B (lock strength)',true),model=v.select('choice rule',[{value:'luce',label:'Luce weights'},{value:'copies',label:'authored copy groups'}],'luce');
        const A=v.stage({x:[-.3,4.3],y:[-1.3,12],axes:'box',gutter:true,height:340,minWidth:270,xticks:[[.5,'A'],[1.5,'B'],[2.5,'C'],[3.5,'D']],ylabel:'positive strength',title:'strengths: full endpoints .3–10'});
        const B=v.stage({x:[-.3,4.3],y:[-.3,1.3],axes:'box',gutter:true,height:340,minWidth:270,xticks:[[.5,'A'],[1.5,'B'],[2.5,'C'],[3.5,'D']],ylabel:'choice probability',title:'current menu / A,B reference'});
        const handles=initial.map((x,i)=>A.handle(i+.5,x,{r:8,color:colors[i],constrain:(_,y)=>[i+.5,v.M.clamp(y,.3,10)],onDrag:h=>strength[i].set(h.y)}));
        v.legend([['muted','A/B-only reference when both are offered',{dot:true}],['accent','A'],['orange','B'],['green','C'],['purple','D']]);
        v.button('Equal-clone counterexample',()=>{strength.forEach(s=>s.set(1));offer.forEach((s,i)=>s.set(i<3));copy.set(true);model.set('copies');});
        v.button('Offer only A and B',()=>offer.forEach((s,i)=>s.set(i<2)));
        let info={};
        v.render(()=>{
          if(copy.value&&strength[2].value!==strength[1].value)strength[2].set(strength[1].value);
          strength[2].input.disabled=copy.value;handles[2].visible=!copy.value;
          const mask=offer.reduce((m,s,i)=>m+(s.value?1<<i:0),0),state=luceState(strength.map(s=>s.value),mask,model.value,copy.value);
          state.weights.forEach((x,i)=>{handles[i].set(i+.5,x);A.rect(i+.15,0,i+.85,x,{fill:colors[i],fillAlpha:mask&(1<<i)?.4:.1,color:colors[i],width:1.6});});
          if(!state.p){B.text('empty menu',2,.65,{align:'center',size:15,weight:700,color:'muted'});B.text('no choice distribution',2,.48,{align:'center',size:12,color:'muted'});}
          else for(let i=0;i<4;i++){
            if(mask&(1<<i)){const p=state.p[i];B.rect(i+.15,0,i+.85,p,{fill:colors[i],fillAlpha:.42,color:colors[i],width:1.8});B.text(v.fix(p,4),i+.5,-.15,{align:'center',size:12,weight:700,color:colors[i]});}
            else B.text('absent',i+.5,-.15,{align:'center',size:10.5,color:'muted'});
          }
          if((mask&3)===3)for(let i=0;i<2;i++)B.dot(i+.5,state.pair[i],{r:6,color:'muted',hollow:true,width:2});
          info=state;
        });
        const menu=m=>[...names].filter((_,i)=>m&(1<<i)).join(',')||'empty';
        v.readout(()=>{const p=info,a=p.audit,w=a.witness,head=p.p?`Menu {${menu(p.mask)}} probabilities (${p.p.map(x=>v.fix(x,6)).join(', ')}), sum ${v.fix(v.M.sum(p.p),10)}.`:'The empty menu is outside the theorem: no choice distribution is assigned.';
          const odds=p.odds===null?'Offer A and B together for their current-menu odds.':`A/B odds ${v.fix(p.odds,6)} in this menu, versus ${v.fix(p.pairOdds,6)} in {A,B}. This checks this pair/menu only.`;
          const removed=(p.mask&7)===7?`Removing C while holding the other offers fixed gives menu {${menu(p.withoutMask)}}: P(A) ${v.fix(p.without[0],6)} versus current ${v.fix(p.p[0],6)}.`:'The C-removal comparison is shown when A,B,C are all offered.';
          return `${head}\n${odds} ${removed}\nAll 15 nonempty menus and ${a.comparisons.length} nested-menu pair comparisons: largest absolute cross-product residual ${a.maxResidual.toExponential(3)}; largest full-menu weight reconstruction error ${a.reconstructionMax.toExponential(3)}. ${p.grouped?'This authored family violates IIA: {A,B} versus {A,B,C} doubles A/B odds.':'This family satisfies IIA algebraically by the fixed-weight formula.'}\n${p.grouped?`A largest numerical discrepancy is pair ${names[w.i]}/${names[w.j]} in {${menu(w.small)}} versus {${menu(w.large)}}: odds ${v.fix(w.smallOdds,6)} and ${v.fix(w.largeOdds,6)}.`:'Strengths are identifiable only up to a common multiplier; their normalized full-menu weights are ('+p.normalized.map(x=>v.fix(x,6)).join(', ')+').'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',kind:'Model',name:'Loudness in sones: a mid-level approximation',
      statement:String.raw`**Loudness** in sones and **loudness level** in phons describe perception, while sound pressure level (SPL) describes an RMS pressure relative to $20\,\mu\mathrm{Pa}$. One sone uses a 1-kHz reference tone at 40 dB SPL. A sound's loudness level in phons is the SPL of an equally loud 1-kHz reference; phons and SPL are therefore numerically aligned for that reference tone, not for every sound.

Moore's technical account describes approximate 10-dB doubling over **40–80 dB** for a steady 1-kHz sinusoid in quiet, with binaural, frontal free-field presentation in the normal-hearing reference setting. A simple nominal approximation is
$$N\approx2^{(L-40)/10}\ \text{sones},\qquad40\le L\le80.$$
This is a mid-level reference model, not an exact universal perceptual law or the full Cambridge loudness algorithm. Frequency, bandwidth, duration, hearing and presentation conditions matter. We do not extend this approximation below 40 or above 80 here.`,
      idea:String.raw`The power-law form (psych-3.2) and level conversion (music-1.8) explain the relation. For a progressive plane wave at fixed acoustic impedance, intensity ratios are squared RMS-pressure ratios, so
$$\begin{gathered}\Delta=10\log_{10}(I_2/I_1)\\=20\log_{10}(p_2/p_1).\end{gathered}$$
If the selected model is $N\propto I^m$, normalized to 1 sone at the reference level 40, then
$$\begin{gathered}N_m(L)=10^{m(L-40)/10},\\N_2/N_1=10^{m\Delta/10},\\\Delta_{\rm double}=10\log_{10}2/m.\end{gathered}$$
Exact 10-dB doubling **within the nominal formula** uses $m=\log_{10}2\approx0.301029996$, with pressure exponent $2m$. The rounded $m=0.3$ instead gives $10^{0.3}\approx1.995262$ per 10 dB and a doubling interval about 10.0343 dB. The custom exponent is an authored exploration, not a fitted observer or a reported range of human exponents. It does not change the acoustic pressure/intensity conversion.`,
      caption:String.raw`The base level $L$ ranges 40–80 and the **actual difference control is coupled** to $0\le\Delta\le80-L$, keeping both modeled tones inside 40–80. Raising $L$ reduces the displayed difference bound and reduces an excessive current difference to that bound; the slider's value/output and the plotted second level agree. At $L=80$, the difference control is disabled at 0. Drag the gold base-level handle or the right-hand difference handle. Choose the nominal exact-doubling formula, its rounded 0.3 version or the authored custom exponent. The colored curves show the chosen model; grey dashed curves show the nominal reference. Both vertical axes display logarithmic values with ordinary sone/ratio tick labels.

**Play relative 1-kHz pair** uses only the current difference, with two identical finite carriers/envelopes: the second digital peak is 0.02 of full scale and the first is $0.02\,10^{-\Delta/20}$. Playback is uncalibrated and does not represent the plotted absolute SPL. The shared audio limiter and your device may alter output levels; neither a precise acoustic difference nor exact perceived doubling is demonstrated.`,
      scope:String.raw`The empirical reference is an approximation for specified steady-tone listening conditions, not a rule for arbitrary frequencies, broadband/complex sounds, threshold-level sounds, impaired hearing or headphone transfer responses. Phons are not physical pressure or intensity, and sones are not decibels. The model curves are calculated formulas, not new perceptual measurements or an ISO/Cambridge implementation. The finite audio pair illustrates requested digital amplitude ratios only; no listener calibration or subjective-loudness test is performed.`,
      deps:['psych-3.2','music-1.8'],see:['music-1.9'],
      refs:['Brian C. J. Moore (2014), Development and Current Status of the Cambridge Loudness Models, Predictions of the 1997 Model/Figure 6','Karl D. Kryter (1966), Review of Research and Methods for Measuring the Loudness and Noisiness of Complex Sounds, printed pp. 2–5','David S. Pallett and Marilyn A. Cadoff (March 1977), NBSIR 75-938, §2.1.1 pp. 5–6'],
      tags:['loudness','sone','psychoacoustics'],credit:'Technical references: Kryter (1966); Moore (2014) author account; Pallett and Cadoff (1977)',verify: false,
      links:{source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4227665/',reference:'https://ntrs.nasa.gov/api/citations/19660011809/downloads/19660011809.pdf'},
      viz(v){
        const L=v.slider('modeled base $L$ (dB SPL)',40,80,50,{int:true}),D=v.slider('permitted difference $\\Delta$ (dB)',0,40,10,{int:true}),custom=v.slider('authored custom intensity exponent $m$',.2,.5,.3,{step:.001,decimals:6}),mode=v.select('power-law formula',[{value:'nominal',label:'nominal 10-dB reference'},{value:'rounded',label:'rounded m=0.3'},{value:'custom',label:'authored custom m'}],'nominal');
        const sync=()=>{const max=80-L.value;D.input.min='0';D.input.max=String(max);if(D.value>max)D.set(max);D.input.disabled=max===0;custom.input.disabled=mode.value!=='custom';return max;};
        const A=v.stage({x:[36,84],y:[-.2,2.35],height:340,minWidth:280,axes:'box',gutter:true,xlabel:'modeled 1-kHz level (dB SPL = phon)',ylabel:'model loudness (sones)',yticks:logTicks(-.2,2.35,{mult:[1,2,5]}),title:'mid-level approximation: 40–80 only'}),B=v.stage({x:[-3,43],y:[-.2,2.35],height:340,minWidth:280,axes:'box',gutter:true,xlabel:'permitted level difference (dB)',ylabel:'model loudness ratio',yticks:logTicks(-.2,2.35,{mult:[1,2,5]}),title:'ratio over the current permitted interval'});
        const hL=A.handle(50,0,{r:8,color:'gold',constrain:x=>[Math.round(v.M.clamp(x,40,80)),0],onDrag:h=>{L.set(h.x);sync();}}),hD=B.handle(10,0,{r:8,color:'gold',constrain:x=>[Math.round(v.M.clamp(x,0,80-L.value)),0],onDrag:h=>D.set(h.x)});
        v.legend([['accent','chosen power-law formula'],['muted','nominal 10-dB reference',{dash:true}],['gold','first modeled level/difference',{dot:true}],['orange','second modeled level',{dot:true}],['green','model doubling, when permitted',{dot:true}]]);
        let info,lastAudio=null;
        v.soundButton('Play relative 1-kHz pair (uncalibrated)',snd=>{const pair=loudnessAudio(D.value);snd.samples(pair.samples,pair.sampleRate,{gain:1,normalize:false});lastAudio={delta:pair.delta,gain1:pair.gain1,gain2:pair.gain2};});v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{sync();const state=loudnessModel(L.value,D.value,mode.value,custom.value);A.path(state.levelReference,{color:'muted',width:1.5,dash:[5,4]});A.path(state.levelCurve,{color:'accent',width:2.6});hL.set(state.L,state.logN1);A.dot(state.L2,state.logN2,{r:5,color:'orange'});hD.visible=state.maxDelta>0;hD.set(state.delta,state.logRatio);
          if(state.maxDelta>0){B.path(state.ratioReference,{color:'muted',width:1.5,dash:[5,4]});B.path(state.ratioCurve,{color:'accent',width:2.6});}else B.dot(0,0,{r:5,color:'gold'});
          if(state.doubling<=state.maxDelta)B.dot(state.doubling,Math.log10(2),{r:5,color:'green'});info={...state,lastAudio};});
        v.readout(()=>{if(!info)return'';const p=info;return `Modeled levels ${p.L} and ${p.L2} dB SPL (1-kHz reference phons); permitted Δ 0–${p.maxDelta} dB, actual Δ ${p.delta} dB. Chosen m=${p.m.toFixed(9)}; pressure exponent 2m=${(2*p.m).toFixed(9)}. Model sones ${p.N1.toFixed(6)} → ${p.N2.toFixed(6)}, ratio ${p.ratio.toFixed(6)}; nominal reference ratio ${p.referenceRatio.toFixed(6)}.\nAcoustic conversion at fixed impedance: RMS pressure ratio ${p.pressureRatio.toFixed(6)}, intensity ratio ${p.intensityRatio.toFixed(6)}. Modeled RMS pressures ${p.pressure1.toFixed(6)} and ${p.pressure2.toFixed(6)} Pa re 20 µPa; these are not measured device pressures. This formula doubles every ${p.doubling.toFixed(6)} dB${p.doubling>p.maxDelta?' (beyond the current permitted interval)':''}.\nUncalibrated digital pair uses Δ only, independent of modeled absolute L: first peak ${(0.02*10**(-p.delta/20)).toFixed(8)}, second 0.02000000 of full scale, before the shared limiter/device. ${p.lastAudio?`Last played Δ ${p.lastAudio.delta} dB.`:'No audio has been played.'} No calibrated SPL or perceived-doubling claim.`;});
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Method', name: 'Classical multidimensional scaling',
      statement: String.raw`Let $n\ge2$ and let $\Delta=[\delta_{ij}]$ be an $n\times n$ symmetric matrix of nonnegative dissimilarities, with $\delta_{ii}=0$. Write
$$J=I-\frac1n\mathbf1\mathbf1^{\mathsf T},\qquad B=-\tfrac12J[\delta_{ij}^2]J.$$
The dissimilarities are exact Euclidean distances **if and only if** the centered Gram matrix $B$ is positive semidefinite. If its rank is $r$, an exact centered configuration in $\mathbf R^r$ comes from its positive eigenvalues and orthonormal eigenvectors:
$$\begin{gathered}Y=Q_r\operatorname{diag}(\sqrt{\lambda_1},\ldots,\sqrt{\lambda_r}),\\ YY^{\mathsf T}=B.\end{gathered}$$
Keeping the largest $k$ positive directions gives classical spectral scaling in at most $k$ dimensions. Negative eigenvalues indicate that exact Euclidean reconstruction is impossible. This spectral construction does **not** directly minimize raw-distance stress. Full exact configurations differ only by rigid translation, rotation or reflection; the supplied distance scale is fixed. A truncated solution can depend on the chosen subspace when the eigenvalue at its cutoff is repeated.`,
      idea: String.raw`Expand $\|x_i-x_j\|^2=\|x_i\|^2+\|x_j\|^2-2x_i\cdot x_j$. Multiplying by $J$ on both sides removes the two norm terms because $J\mathbf1=0$, leaving $B=X_cX_c^{\mathsf T}$ for centered rows $X_c$. The real spectral theorem (ladr-7.29) gives orthonormal eigenvectors; the positive-operator characterizations (ladr-7.38) identify nonnegative eigenvalues and the Gram factorization. Conversely, for symmetric zero-diagonal input, $B_{ii}+B_{jj}-2B_{ij}=\delta_{ij}^2$, so a positive-semidefinite factorization reproduces all distances. Its rank is at most $n-1$ because $B\mathbf1=0$.

We report a directly defined **normalized distance error**,
$$E_k=\sqrt{\frac{\sum_{i<j}(\delta_{ij}-d_{ij}^{(k)})^2}{\sum_{i<j}\delta_{ij}^2}}.$$
It is a diagnostic of the spectral fit, not a claim that this fit minimizes it, not a universal Stress-1 convention and not an intrinsic-dimension certificate. If every target distance is zero, this ratio is undefined; the absolute RMS distance error is still defined. Metric least-squares scaling explicitly optimizes a distance criterion; nonmetric scaling can also fit a monotone transformation of dissimilarities. Neither optimizer runs here. The mathematical account used is Williams's own technical exposition, §2, rather than a claim to reproduce a historical psychological experiment.`,
      caption: String.raw`**Left:** 12 authored planar points; drag them inside the full $[-2.3,2.3]^2$ input box, or choose a circle, line, clusters, one outlier or coincident points. Every pair's synthetic dissimilarity is its true distance times $\exp(sZ_{ij})$, with a symmetric table of standard-normal draws (prob-1.2.5) and slider $s$. For $s>0$ the theoretical multiplier distribution has median 1 and mean greater than 1; at $s=0$ every multiplier equals 1. **Middle:** a two-dimensional classical fit, aligned by translation, rotation and possible reflection only—**no fitted rescaling**. Grey rings are centered truth, colored dots are recovered points and connecting segments are position errors. **Right:** the defined $E_k$ for dimensions 1–4. Exact noiseless planar data have zero error once enough dimensions are retained, up to rounding; noisy data need not. All coordinates and full glyphs determine padded plot bounds.`,
      scope: String.raw`Inputs here are complete, finite, symmetric, nonnegative dissimilarities with zero diagonal; asymmetric or missing data need another method. All point sets and noise are authored examples. No actual color judgments, nonmetric fitting or psychological dimension estimates are supplied. Positive/negative eigenvalue counts are numerical diagnostics using an explicit rounding cutoff, not exact PSD certificates. Tiny positive modes at or below that cutoff are omitted with negative modes. A zero distance denominator and zero truth radius receive explicit undefined status; neither is replaced by a fake ratio. Error dimensions 1–4 do not display every possible direction of a noisy 12-point matrix.`,
      deps: ['ladr-7.29','ladr-7.38','prob-1.2.5'], see: ['psych-3.7'],
      refs: ['Christopher K. I. Williams, On a Connection between Kernel PCA and Metric Multidimensional Scaling, NIPS2000, proceedings2001, §2.1–2.3'],
      tags: ['multidimensional scaling','dissimilarity','Gram matrices'], credit: 'Classical scaling; technical account: Christopher K. I. Williams, NIPS2000/2001, §2', verify: false,
      links: {source:'https://proceedings.neurips.cc/paper_files/paper/2000/file/d4b2aeb2453bdadaa45cbe9882ffefcf-Paper.pdf'},
      viz(v) {
        const NP=12,M=v.M,colors=M.range(NP).map(i=>M.hsl2rgb(i/NP,.7,.5));let seed=31,noiseSeed=null,Z;
        const presets={circle:M.range(NP).map(k=>[1.5*Math.cos(2*Math.PI*k/NP),1.5*Math.sin(2*Math.PI*k/NP)]),line:M.range(NP).map(k=>[-1.8+3.6*k/(NP-1),0]),clusters:M.range(NP).map(k=>{const c=[[-1.4,1],[1.4,.7],[0,-1.5]][k%3],a=k*2.399;return[c[0]+.45*Math.cos(a),c[1]+.45*Math.sin(a)];}),outlier:M.range(NP).map(k=>k===0?[2.3,2.3]:[-2.3,-2.3]),coincident:M.range(NP).map(()=>[0,0])};
        const noise=v.slider('authored normal log-noise $s$',0,.6,.1,{step:.01,decimals:2});
        v.select('authored point preset',[{value:'circle',label:'circle'},{value:'line',label:'line'},{value:'clusters',label:'clusters'},{value:'outlier',label:'one outlier'},{value:'coincident',label:'coincident'}],'circle',{onChange:k=>presets[k].forEach((p,i)=>H[i].set(...p))});
        v.button('New authored noise',()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;});
        const tr=v.stage({x:[-2.9,2.9],y:[-2.9,2.9],equal:true,axes:false,height:320,minWidth:260,title:'authored truth: drag all 12 points'}),rc=v.stage({x:[-2.9,2.9],y:[-2.9,2.9],equal:true,axes:false,height:320,minWidth:260,title:'2D fit: rigid alignment, scale 1'}),sb=v.stage({x:[.4,4.6],y:[-.1,.6],axes:'box',gutter:true,height:320,minWidth:260,xlabel:'retained dimensions',ylabel:'normalized distance error',xticks:[1,2,3,4],title:'spectral fit diagnostic, no stress optimizer'});
        const H=presets.circle.map((p,i)=>tr.handle(...p,{r:8,color:colors[i],constrain:(x,y)=>[M.clamp(x,-2.3,2.3),M.clamp(y,-2.3,2.3)]}));
        v.legend([['muted','centered truth',{dot:true}],['accent','recovered points (colors match handles)',{dot:true}],['muted','position difference',{dash:true}]]);let info;
        v.render(()=>{
          if(noiseSeed!==seed){const R=v.rng(seed);Z=M.zeros(NP,NP);for(let i=0;i<NP;i++)for(let j=i+1;j<NP;j++)Z[i][j]=Z[j][i]=R.normal();noiseSeed=seed;}
          const fit=mdsSynthetic(H.map(h=>[h.x,h.y]),noise.value,Z),a=fit.alignment,bounds=mdsView([...a.truth,...a.points]);rc.setView(bounds.x,bounds.y);
          a.points.forEach((p,i)=>{rc.line(...a.truth[i],...p,{color:'muted',width:1.2,alpha:.6});rc.dot(...a.truth[i],{r:8,color:'muted',hollow:true,width:1.4});rc.dot(...p,{r:5,color:colors[i]});});
          if(fit.targetSquares===0){sb.setView([.4,4.6],[-.1,.6]);sb.text('all target distances are 0',2.5,.32,{align:'center',size:13,weight:700,color:'muted'});sb.text('normalized error undefined (0/0)',2.5,.21,{align:'center',size:11,color:'muted'});}
          else{const high=Math.max(.2,...fit.fits.map(f=>f.normalized));sb.setView([.4,4.6],[-.14*high,1.32*high]);fit.fits.forEach(f=>{sb.rect(f.dimension-.3,0,f.dimension+.3,f.normalized,{fill:f.dimension===2?'accent':'muted',fillAlpha:.4,color:f.dimension===2?'accent':'muted',width:1.6});sb.text(f.normalized.toFixed(4),f.dimension,f.normalized,{dy:-13,align:'center',size:11.5,weight:700,color:'ink'});});}
          info={...fit,seed};
        });
        const number=x=>x.toExponential(3);
        v.readout(()=>{if(!info)return'';const p=info,a=p.alignment;return `Authored seed ${p.seed}; all ${p.pairs} symmetric pair dissimilarities retained. Normalized distance errors E1–E4: ${p.fits.map(f=>f.normalized===null?'undefined (0/0)':number(f.normalized)).join(', ')}. Absolute RMS distance errors: ${p.fits.map(f=>number(f.absoluteRms)).join(', ')} in the supplied distance units.\nRigid-only 2D position RMS ${number(a.rms)}; truth radius ${number(a.radius)}; relative position error ${a.relative===null?'undefined (zero radius)':number(a.relative)}. Fitted scale remains exactly 1.\nNumerically resolved positive/negative/near-zero eigenvalues: ${p.positive}/${p.negative}/${p.nearZero}; cutoff ${number(p.tolerance)}. All eigenvalues: ${p.eigenvalues.map(number).join(', ')}. These are numerical diagnostics; no exact PSD or empirical dimension certificate is inferred.\nThis is classical spectral scaling, not an optimized raw-distance stress or nonmetric solution.`;});
      },
    },
  ],
};
