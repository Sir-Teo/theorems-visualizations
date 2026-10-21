// Population Genetics & Evolution — Chapter 4 (part b): dominance, overdominance, sickle-cell, underdominance, adaptive landscapes
import { clamp, memo, selStep, wbarD, dpSel, intEq, selPath } from './ch04.shared.js';
import { sickleHistory } from './source-audit-empirical.shared.js';
import { overdominance } from './source-audit-selection.shared.js';

export default {
  collection: 'popgen',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Dominance controls the speed of selection',
      statement: String.raw`Let $A$ be favoured, with fitnesses $w_{AA}=1+s$, $w_{Aa}=1+hs$, $w_{aa}=1$. For weak selection ($s$ small) the change per generation is $\Delta p\approx s\,p\,q\,\big[h+(1-2h)p\big]$. The dominance coefficient $h$ therefore changes the shape of the sweep: for a **dominant** allele ($h=1$) $\Delta p\approx s\,p\,q^2$, so a rare allele grows exponentially but stalls near fixation, where the few remaining $a$ copies hide in heterozygotes; for a **recessive** allele ($h=0$) $\Delta p\approx s\,p^2q$, so the allele is almost invisible to selection while rare and takes of order $1/(sp_0)$ generations to get going; the **additive** case ($h=\tfrac12$) is the symmetric logistic curve of 4.2 with $s/2$ per copy.`,
      idea: String.raw`Selection acts on a rare allele $A$ mostly through its heterozygotes ($Aa$ carry almost all rare copies), so the initial rate is proportional to the *heterozygote's* advantage $hs$ — large for a dominant allele, zero for a recessive one — whereas near fixation the rare allele is $a$ and the same argument applies with $1-h$ in place of $h$. Writing out $\Delta p=pq(w_A-w_a)/\bar w$ (4.3) with $w_A-w_a=s\,[h+(1-2h)p]$ gives the formula above. The contrast is a main reason why recessive favourable alleles are slow to spread from a single new mutant and why rare recessive deleterious alleles are hard to purge (1.11, 5.1).`,
      caption: String.raw`Set the selection coefficient and the starting frequency. **Left** (logarithmic time axis): the frequency of $A$ for a dominant (orange), an additive (blue) and a recessive (purple) favourable allele; dots mark the first generation at which the frequency reaches ½. **Right**: $\Delta p$ against $p$ for the same three cases. Look for the recessive allele’s long delay at small $p$ and the dominant allele’s long tail near $p=1$; the readout gives the generation counts.`,
      deps: ['popgen-4.3'],
      refs: ['Gillespie'],
      scope: String.raw`Large population, constant fitnesses, random mating, weak selection for the approximate formula (the curves themselves are exact iterations of 4.3). Real new mutations start as a single copy, where drift dominates; see 6.2.`,
      tags: ['selection', 'dominance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dominance_(genetics)' },
      viz(v) {
        const sS = v.slider('selection coefficient $s$', 0.005, 0.3, 0.05, { log: true, sig: 2 });
        const p0S = v.slider('start frequency $p_0$', 0.0005, 0.2, 0.01, { log: true, sig: 2 });
        const CASES = [['dominant', 1, 'orange'], ['additive', 0.5, 'accent'], ['recessive', 0, 'purple']];
        const L = v.stage({ x: [1, 1e5], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: 'generation (log scale)', ylabel: 'frequency of $A$', title: 'Three S-curves', minWidth: 300 });
        const R = v.stage({ x: [0, 1], y: [0, 0.05], axes: 'box', gutter: true, height: 330, xlabel: 'frequency $p$ of $A$', ylabel: 'change per generation $\\Delta p$', title: 'Where selection pulls hardest', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const s = sS.value, p0 = p0S.value, TMAX = 1e5;
          const data = sim(`${s}|${p0}`, () => CASES.map(([, h]) => {
            const w = [1 + s, 1 + h * s, 1]; let p = p0; const pts = [[1, p0]]; let t50 = null, t99 = null, nxt = 1.05;
            for (let t = 1; t <= TMAX; t++) { p = selStep(p, w); if (t50 === null && p >= 0.5) t50 = t; if (t99 === null && p >= 0.99) t99 = t; if (t >= nxt) { pts.push([t, p]); nxt = t * 1.05; } }
            pts.push([TMAX, p]);
            return { pts, t50, t99, w };
          }));
          let top = 0.01;
          CASES.forEach(([, h], i) => {
            const c = CASES[i][2], d = data[i];
            L.path(d.pts, { color: c, width: 2.6 });
            if (d.t50) L.dot(d.t50, 0.5, { r: 5.5, color: c });
            for (let k = 1; k < 200; k++) top = Math.max(top, dpSel(k / 200, d.w));
          });
          L.hline(0.5, { color: 'muted', dash: true, width: 1 });
          R.setView([0, 1], [0, top * 1.15]);
          CASES.forEach(([, , c], i) => R.fn((x) => dpSel(x, data[i].w), { color: c, width: 2.6 }));
          info = data.map((d) => [d.t50, d.t99]);
        });
        v.legend(CASES.map(([n, h, c]) => [c, `${n} ($h=${h}$)`]));
        const fm = (x) => (x === null ? '> 10⁵' : String(x));
        v.readout(() => CASES.map(([n], i) => `${n}: ½ after ${fm(info[i][0])} generations, 99% after ${fm(info[i][1])}`).join('\n') + '\n(Exact iteration of the diploid recursion. Weak-selection estimates: recessive start ≈ $1/(sp_0)$; dominant end ≈ $1/s$.)');
      },
    },

    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Heterozygote advantage maintains a stable polymorphism',
      statement: String.raw`For random mating and constant one-locus viabilities $w_{AA}=1-s$, $w_{Aa}=1$, $w_{aa}=1-t$ with $0<s,t<1$, the unique interior equilibrium is $$\hat p=\frac{t}{s+t}.$$ Every interior starting frequency converges monotonically to it; the exact boundary states remain fixed. Mean fitness $1-sp^2-t(1-p)^2$ is maximized there. Near equilibrium the deviation has multiplier $\lambda=(1-2h)/(1-h)$ with $h=st/(s+t)$, so $0<\lambda<1$.`,
      idea: String.raw`Writing $q=1-p$ gives $\Delta p=pq(s+t)(\hat p-p)/\bar w$, hence $$p'-\hat p=(p-\hat p)\left[1-\frac{(s+t)pq}{\bar w}\right].$$ The bracket lies strictly between zero and one because $\bar w-(s+t)pq=(1-s)p+(1-t)q>0$. Thus the map moves toward equilibrium without crossing it. Taking the limit in the recursion identifies the only interior limit as $\hat p$. At that point the bracket equals $(1-2h)/(1-h)$, giving the local convergence factor.`,
      caption: String.raw`Change the two homozygote disadvantages. Eleven interior starting frequencies move toward the same equilibrium, with the actual largest remaining distance reported after a finite number of generations. Drag the gold start on the fitness parabola to inspect another trajectory. The estimated near-equilibrium multiplier is shown only when the run supplies a measurable nonzero deviation; an exact equilibrium provides no such ratio.`,
      deps: ['popgen-4.3', 'mathbio-1.5'],
      refs: ['Bürger, Elementary Population Genetics, §4.3 pp. 14–15 Eq. (4.13), monotone global convergence: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf', 'Felsenstein, Theoretical Evolutionary Genetics (2019), §II.7 pp. 84–88 Eqs. (II-101)–(II-107): https://felsenst.github.io/pgbook/pgbook.pdf'],
      credit: 'Equilibrium and stability follow the complete author treatments cited here; original historical priority is not newly audited.',
      scope: String.raw`Infinite population, one autosomal locus, random mating, constant positive genotype viabilities, no mutation, migration or drift. The global claim is for $0<p_0<1$; an allele absent at a boundary cannot return. In a finite population overdominance does not by itself rule out eventual loss, and no universal fixation-time scaling is asserted here.`,
      tags: ['selection', 'polymorphism', 'balancing selection'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heterozygote_advantage' },
      viz(v) {
        const sS = v.slider('$s$ (selection against $AA$)', 0.02, 0.8, 0.3, { step: 0.01 });
        const tS = v.slider('$t$ (selection against $aa$)', 0.02, 0.8, 0.15, { step: 0.01 });
        const L = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'frequency of $A$', title: 'Eleven starting points, one destination', minWidth: 300 });
        const R = v.stage({ x: [0, 1], y: [0.5, 1.02], axes: 'box', gutter: true, height: 330, xlabel: 'frequency $p$ of $A$', ylabel: 'mean fitness $\\bar w$', title: 'Mean fitness peaks at $\\hat p$', minWidth: 260 });
        const h = R.handle(0.05, 0.6, { color: 'gold', r: 8, label: 'start', labelPos: 's', constrain: (x) => [clamp(x, 0.01, 0.99), 0.6] });
        let info = {};
        v.render(() => {
          const s=sS.value,t=tS.value,w=[1-s,1,1-t],eq=overdominance(s,t),ph=eq.p,lam=eq.lambda;
          const T = Math.min(400, Math.max(30, Math.ceil(7 / -Math.log(Math.max(lam, 0.0001)) * 1.0)));
          L.setView([0, T], [0, 1]);
          let maxRemaining=0; for(let i=0;i<11;i++){const path=selPath(.02+i*.096,w,T);maxRemaining=Math.max(maxRemaining,Math.abs(path[T]-ph));L.path(Array.from(path,(x,k)=>[k,x]),{color:'accent',width:1.6,alpha:.75});}
          L.hline(ph, { color: 'green', dash: true, width: 2 });
          const lo = Math.min(wbarD(0, w), wbarD(1, w)), top = wbarD(ph, w);
          R.setView([0, 1], [lo - 0.08 * (top - lo) - 0.02, top + 0.15 * (top - lo) + 0.02]);
          R.fn((x) => wbarD(x, w), { color: 'accent', width: 2.8 });
          R.vline(ph, { color: 'green', dash: true, width: 1.5 });
          R.dot(ph, top, { r: 6.5, color: 'green' });
          const p0 = h.x; h.set(p0, wbarD(p0, w));
          const path = selPath(p0, w, 40);
          R.dots(Array.from(path, (x) => [x, wbarD(x, w)]), { r: 3, color: 'gold' });
          // measured convergence factor
          let q = p0, meas = NaN; for (let k = 0; k < 2000; k++) { const nx = selStep(q, w); if (Math.abs(q - ph) < 1e-5 && Math.abs(q - ph) > 1e-13) { meas = Math.abs(nx - ph) / Math.abs(q - ph); break; } q = nx; }
          info = { s, t, ph, lam, meas, top, end: path[40], T, maxRemaining };
        });
        v.legend([['accent', 'trajectories / $\\bar w(p)$'], ['green', 'equilibrium $\\hat p=t/(s+t)$', { dash: true }], ['gold', 'start and next 40 generations']]);
        v.readout(() => `$\\hat p=t/(s+t)=${v.fix(info.ph, 4)}$, $\\bar w(\\hat p)=1-\\frac{st}{s+t}=${v.fix(info.top, 4)}$ (the top of the parabola). After ${info.T} generations, the largest remaining distance among the eleven curves is $${v.sci(info.maxRemaining,3)}$.\nConvergence factor: formula $\\lambda=\\frac{1-2h}{1-h}=${v.fix(info.lam, 4)}$; measured from the recursion near $\\hat p$: ${Number.isNaN(info.meas) ? 'unavailable (no measurable near-equilibrium deviation)' : v.fix(info.meas, 4)}. Gold start after 40 generations: $p=${v.fix(info.end, 4)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Sickle-cell polymorphism and malaria',
      statement: String.raw`The haemoglobin-$S$ allele illustrates a trade-off between homozygous disease burden and partial malaria protection associated with the $AS$ genotype. Piel et al.’s 2010 geostatistical study found a geographical association between HbS frequency and historical malaria endemicity, driven mainly by Africa; it did not resolve the association in Asia or the Americas. In the idealized random-mating viability model $w_{AA}=1-s$, $w_{AS}=1$, $w_{SS}=1-t$, with $0<s<1$ and $0<t\le1$, the interior equilibrium allele frequency is $\hat q=s/(s+t)$. For $s=0$, an initially interior allele is recessively deleterious and declines asymptotically. The measured geographical association does not by itself estimate these fitnesses or prove local equilibrium.`,
      idea: String.raw`At equilibrium, the marginal viabilities of $A$ and $S$ agree. Subtracting them gives $s(1-q)-tq=0$, hence the stated frequency. Once $s=0$, the exact recursion is $q'=q(1-tq)/(1-tq^2)$ and $\Delta q=-tq^2(1-q)/(1-tq^2)$. Its rare-allele decline is quadratic, not rapid elimination. Williams et al.’s Kenyan cohort found partial protection against **mild clinical malaria** in HbAS, with adjusted incidence-rate ratio 0.62 (95% interval 0.51–0.76); that study explicitly left the relevance of its age-pattern results to severe disease unresolved. Such clinical incidence ratios are not the genotype viability parameters in this synthetic model.`,
      caption: String.raw`**A synthetic transect, not a map or patient forecast.** A chosen smooth profile determines selection $s$ against $AA$, shown in orange; the blue equilibrium $q$ follows from the chosen viabilities. Drag the location. The right panel follows 100 generations either after removing that modeled advantage or while retaining it, as selected by the toggle. All reference locations use the same toggle. The view includes the full possible equilibrium range, including frequencies above 0.35. Reported $2q(1-q)$ and $q^2$ are model newborn genotype proportions before viability selection.`,
      deps: ['popgen-4.7'],
      refs: ['Piel et al. (2010), Nature Communications 1:104, complete original, Results pp.2–4, Discussion pp.4–5 and Methods pp.5–6: https://ora.ox.ac.uk/objects/uuid%3Adbb79f47-ef1b-4088-ac44-152d4af29126/files/m87eae47db3033c767ee5166696afd234', 'Williams et al. (2005), An Immune Basis for Malaria Protection by the Sickle Cell Trait, complete original, Results/Table 1 printed 442–443 and limitations 444: https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.0020128', 'Bürger, Elementary Population Genetics, §4.3 pp.14–15, complete two-allele stability argument: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf'],
      credit: 'Empirical context follows the original studies by Piel et al. (2010) and Williams et al. (2005); the displayed viabilities are chosen model parameters.',
      scope: String.raw`One locus, random mating, no mutation, migration, admixture, drift, age structure or changing treatment; the sites are independent model populations. The chosen intensities are not measured. Piel’s map assembled indigenous population surveys and historical malaria categories, explicitly was not a contemporary distribution map, and had uneven coverage and prediction uncertainty. Neither that association nor this toy model supplies a present-day clinical prognosis or a causal estimate of local fitness.`,
      tags: ['balancing selection', 'human', 'malaria'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sickle_cell_disease#Epidemiology' },
      viz(v) {
        const m0S = v.slider('malaria intensity in the lowland', 0, 1, 0.75, { step: 0.01 });
        const smaxS = v.slider('selection against $AA$ at full intensity, $s_{\\max}$', 0.05, 0.3, 0.15, { step: 0.01 });
        const tS = v.slider('selection against $SS$, $t$', 0.3, 1, 0.8, { step: 0.01 });
        const cS = v.slider('highland begins at', 0.2, 0.9, 0.55, { step: 0.01 });
        const off = v.toggle('malaria eliminated (right panel)', true);
        const L = v.stage({ x: [0, 1], y: [0, 0.35], axes: 'box', gutter: true, height: 320, xlabel: 'chosen synthetic transect coordinate', ylabel: 'frequency of $S$  /  $s$', title: 'Equilibrium under chosen viabilities', minWidth: 300 });
        const R = v.stage({ x: [0, 100], y: [0, 0.35], axes: 'box', gutter: true, height: 320, xlabel: 'generations from the chosen equilibrium', ylabel: 'frequency of $S$', title: 'Toggle removal or retention of the modeled advantage', minWidth: 280 });
        const hnd = L.handle(0.15, 0, { color: 'gold', r: 8, label: 'here', labelPos: 'n', constrain: (x) => [clamp(x, 0, 1), 0] });
        let info = {};
        v.render(() => {
          const m0 = m0S.value, smax = smaxS.value, t = tS.value, c = cS.value, wd = 0.07;
          const m = (x) => m0 / (1 + Math.exp((x - c) / wd));
          const qh = (x) => { const s = smax * m(x); return s / (s + t); };
          const ymax=Math.max(.1,qh(0),smax*m(0))*1.15; L.setView([0,1],[0,ymax]);R.setView([0,100],[0,ymax]);
          L.fn((x) => smax * m(x), { color: 'orange', width: 2.2 });
          L.fn(qh, { color: 'accent', width: 3 });
          const x0 = hnd.x; hnd.set(x0, 0);
          L.dot(x0, qh(x0), { r: 6, color: 'gold' });
          L.vline(x0, { color: 'gold', dash: true, width: 1 });
          [0.05,0.3,0.6].forEach(xx=>R.path(sickleHistory(qh(xx),off.value?0:smax*m(xx),t),{color:'muted',width:1.2,dash:true}));
          const q0=qh(x0),pts=sickleHistory(q0,off.value?0:smax*m(x0),t);
          R.path(pts, { color: 'accent', width: 3 });
          R.dot(0, q0, { r: 5, color: 'gold' });
          info = { x0, s: smax * m(x0), q0, end: pts[100][1], t, carriers: 2 * q0 * (1 - q0), ss: q0 * q0, half: pts.findIndex(([, y]) => y <= q0 / 2) };
        });
        v.legend([['orange', 'selection $s$ against $AA$ (malaria)'], ['accent', 'equilibrium frequency of $S$'], ['gold', 'chosen location']]);
        v.readout(() => `Here: $s=${v.fix(info.s, 3)}$, $t=${v.fix(info.t, 2)}$ ⇒ $\\hat q=s/(s+t)=${v.fix(info.q0, 3)}$; carriers $2\\hat q\\hat p=${v.fix(100 * info.carriers, 1)}\\%$, modeled SS newborn genotype $\\hat q^2=${v.fix(100 * info.ss, 2)}\\%$.\n${off.value ? `After 100 modeled generations without the advantage: $q=${info.end<.001?v.sci(info.end,2):v.fix(info.end,3)}$${info.half > 0 ? `; half the initial frequency after ${info.half} generations` : ''}.` : 'Modeled advantage retained: the chosen and reference frequencies stay at their equilibria.'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Underdominance: an unstable interior equilibrium',
      statement: String.raw`Let the heterozygote be the least fit: $w_{AA}=1$, $w_{Aa}=1-s$, $w_{aa}=1-t$ with $0<t<s$ (more generally $w_{Aa}<\min(w_{AA},w_{aa})$). Then the one-locus selection recursion has an interior equilibrium
$$\hat p=\frac{s-t}{2s-t}\in(0,1),$$
and it is **unstable**: if $p_0>\hat p$ then $p_n\to1$ (A fixes), if $p_0<\hat p$ then $p_n\to0$ (A is lost). The two boundary equilibria are stable. The mean fitness has a *minimum* at $\hat p$.`,
      idea: String.raw`With $w_A=1-sq$ and $w_a=1-sp-tq$, the difference $w_A-w_a=(2s-t)p-(s-t)$ is linear in $p$, negative below $\hat p$ and positive above it (the rarer allele sits mostly in heterozygotes and is penalised by them), and $\Delta p=pq(w_A-w_a)/\bar w$ (4.3) inherits its sign. The sign pattern is the reverse of 4.7: both boundaries attract and $\hat p$ repels, and $\bar w$ (a convex parabola) has its valley at $\hat p$ (4.4). The outcome depends on the starting frequency: selection is bistable, like an Allee threshold (mathbio-1.9). The same threshold appears in chromosomal rearrangements with semisterile heterozygotes and in proposals for gene-drive and population-replacement strategies that use engineered underdominance, where a release above the threshold spreads and one below it disappears.`,
      caption: String.raw`Set $s$ (cost of the heterozygote) and $t$ (cost of $aa$). **Left**: populations started above (blue) and below (orange) the threshold $\hat p$ (red dashed) are driven to opposite ends; drag the gold handle at generation 0 to set your own start. **Right**: $\Delta p(p)$ with arrows showing the direction of flow; the unstable equilibrium is the hollow red circle. Raise $t$ until it exceeds $s$: the threshold leaves the interval and the polymorphism question disappears.`,
      deps: ['popgen-4.3'],
      refs: ['Ewens §1.4'],
      scope: String.raw`Large population, constant fitnesses, random mating. In a finite population drift moves $p$ across the threshold with probability that falls rapidly as $N|s|$ grows, so the threshold acts as a barrier to establishment; in a spatially structured population it produces sharp clines (7.6, 7.10).`,
      tags: ['selection', 'bistability', 'threshold'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heterozygote_advantage#Heterozygote_disadvantage' },
      viz(v) {
        const sS = v.slider('$s$ (cost of the heterozygote)', 0.05, 0.6, 0.3, { step: 0.01 });
        const tS = v.slider('$t$ (cost of $aa$)', -0.2, 0.6, 0.1, { step: 0.01 });
        const L = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'frequency of $A$', title: 'Which side of the threshold decides', minWidth: 300 });
        const R = v.stage({ x: [0, 1], y: [-0.05, 0.05], axes: 'box', gutter: true, height: 330, xlabel: 'frequency $p$ of $A$', ylabel: 'change per generation $\\Delta p$', title: 'Flow on the frequency axis', minWidth: 260 });
        const h = L.handle(0, 0.5, { color: 'gold', r: 8, label: 'start', labelPos: 'e', constrain: (x, y) => [0, clamp(y, 0.01, 0.99)] });
        let info = {};
        v.render(() => {
          const s = sS.value, t = tS.value, w = [1, 1 - s, 1 - t], ph = intEq(w), T = 60;
          const starts = ph === null ? [0.1, 0.3, 0.5, 0.7, 0.9] : [ph - 0.3, ph - 0.15, ph - 0.05, ph - 0.01, ph + 0.01, ph + 0.05, ph + 0.15, ph + 0.3].map((x) => clamp(x, 0.01, 0.99));
          starts.forEach((p0) => { const path = selPath(p0, w, T); L.path(Array.from(path, (x, k) => [k, x]), { color: path[T] > 0.5 ? 'accent' : 'orange', width: 1.5, alpha: 0.7 }); });
          if (ph !== null) L.hline(ph, { color: 'red', dash: true, width: 2 });
          h.set(0, h.y);
          const mine = selPath(h.y, w, T);
          L.path(Array.from(mine, (x, k) => [k, x]), { color: 'gold', width: 3 });
          let m = 0.02; for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(dpSel(i / 200, w)));
          R.setView([0, 1], [-1.3 * m, 1.3 * m]);
          R.hline(0, { color: 'muted', width: 1 });
          R.fn((x) => dpSel(x, w), { color: 'accent', width: 2.8 });
          for (let i = 1; i < 10; i++) { const x = i / 10, d = dpSel(x, w), a = d > 0 ? 1 : -1; R.arrow(x - a * 0.025, -0.55 * m, x + a * 0.025, -0.55 * m, { color: d > 0 ? 'accent' : 'orange', width: 2 }); }
          R.dot(0, 0, { r: 6, color: 'green' }); R.dot(1, 0, { r: 6, color: 'green' });
          if (ph !== null) R.dot(ph, 0, { r: 6.5, hollow: true, color: 'red' });
          R.dot(h.y, dpSel(h.y, w), { r: 5.5, color: 'gold' });
          info = { s, t, ph, end: mine[T], p0: h.y, wmin: ph === null ? null : wbarD(ph, w) };
        });
        v.legend([['accent', 'starts above the threshold'], ['orange', 'starts below'], ['red', 'unstable equilibrium $\\hat p$', { dash: true }], ['gold', 'your start']]);
        v.readout(() => info.ph === null ? `With $t\\ge s$ the heterozygote is no longer the least fit: no interior equilibrium; selection favours $A$ throughout (your start ends at $p=${v.fix(info.end, 3)}$).` : `Threshold $\\hat p=(s-t)/(2s-t)=${v.fix(info.ph, 4)}$ (mean fitness there, its minimum: ${v.fix(info.wmin, 3)}). Your start $p_0=${v.fix(info.p0, 3)}$ is ${info.p0 > info.ph ? 'above' : 'below'} it and after 60 generations $p=${v.fix(info.end, 3)}$ — ${info.end > 0.5 ? 'A heads for fixation' : 'A heads for loss'}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Adaptive landscapes',
      statement: String.raw`Wright’s **adaptive landscape** is the graph of mean fitness $\bar w$ as a function of the allele frequencies, here $\bar w(p,q)$ for two loci with frequencies $p,q$ in linkage equilibrium. With constant fitnesses and weak selection, the frequencies move uphill in $\bar w$, along the (Wright-metric) gradient, $\Delta p\approx\frac{p(1-p)}{2\bar w}\frac{\partial\bar w}{\partial p}$ and similarly for $q$ (4.4). With interaction (epistasis) the surface can have several peaks separated by valleys; the peak a population reaches then depends on where it starts, and a population on a lower peak cannot climb to a higher one by selection alone.`,
      idea: String.raw`For one locus with two alleles the landscape is a curve and, by 4.4, selection always climbs it, so the only question is which peak is nearest. With two loci the genotype fitnesses can be non-additive: in the example here $w_{ij}=1+e\,(i-1)(j-1)+g\,\tfrac{i+j-2}{2}+h\,[i=j=1]$, with $i,j\in\{0,1,2\}$ the numbers of $A$ and $B$ alleles. Averaging over Hardy–Weinberg genotypes gives $\bar w(p,q)=1+e(2p-1)(2q-1)+g(p+q-1)+4h\,p(1-p)q(1-q)$. For $e>0$ the corners $AB$ and $ab$ are peaks and $Ab$, $aB$ are valleys (“reciprocal sign epistasis”); a strong heterozygote bonus $h>2e$ adds an interior peak. Wright (1932) used such pictures, with many loci and rugged landscapes, to ask how a population can cross a valley (drift and the shifting-balance process, 7.8).`,
      caption: String.raw`**Left**: a map of the landscape on the unit square of allele frequencies $(p,q)$: the contours are lines of equal $\bar w$, and the colour of each pixel shows *which peak* a population starting there would reach by hill climbing (basins of attraction). Drag the gold start point; its path (gold) climbs to a peak. Switch on “rain” to start many populations. **Right**: the same landscape as a surface with the paths as balls rolling uphill (drag to rotate). Raise the heterozygote bonus to make a new peak and its basin appear.`,
      deps: ['popgen-4.5'],
      refs: ['Gillespie'],
      credit: 'Sewall Wright, 1932',
      scope: String.raw`Wright’s approximation: linkage equilibrium is maintained (loose linkage, weak selection) so that the state is described by the two allele frequencies; with tight linkage or strong selection the full two-locus dynamics with linkage disequilibrium (8.5, 8.6) are needed, and mean fitness need not increase. The surface is a model (nine genotype fitnesses given by $e,g,h$), not an estimated landscape.`,
      tags: ['adaptive landscape', 'epistasis', 'Wright'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fitness_landscape' },
      viz(v) {
        const eS = v.slider('epistasis $e$', 0, 0.3, 0.2, { step: 0.01 });
        const gS = v.slider('tilt $g$ (favours $A$, $B$)', -0.06, 0.06, 0.03, { step: 0.005 });
        const hS = v.slider('heterozygote bonus $h$', 0, 0.8, 0.1, { step: 0.01 });
        const rain = v.toggle('rain: start many populations', false);
        const L = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'frequency $p$ of $A$ (locus 1)', ylabel: 'frequency $q$ of $B$ (locus 2)', title: 'Landscape and basins of attraction', minWidth: 320 });
        const S3 = v.stage3d({ range: 1.5, height: 360, yaw: 0.55, pitch: 0.42, axes: false, title: 'The same landscape as a surface', minWidth: 300 });
        const st = L.handle(0.62, 0.15, { color: 'gold', r: 8, label: 'start', labelPos: 'n', constrain: { x: [0.01, 0.99], y: [0.01, 0.99] } });
        const rast = memo();
        const BASIN = [['blue', 0, 0], ['orange', 2, 2], ['red', 2, 0], ['purple', 0, 2], ['green', 1, 1]];
        const cell = (p) => (p < 0.25 ? 0 : p > 0.75 ? 2 : 1);
        const mk = (e, g, hh) => {
          const wb = (p, q) => 1 + e * (2 * p - 1) * (2 * q - 1) + g * (p + q - 1) + 4 * hh * p * (1 - p) * q * (1 - q);
          const gp = (p, q) => 2 * e * (2 * q - 1) + g + 4 * hh * (1 - 2 * p) * q * (1 - q);
          const gq = (p, q) => 2 * e * (2 * p - 1) + g + 4 * hh * (1 - 2 * q) * p * (1 - p);
          const step = (p, q) => { const b = wb(p, q); return [clamp(p + (p * (1 - p) / (2 * b)) * gp(p, q) * 2, 0, 1), clamp(q + (q * (1 - q) / (2 * b)) * gq(p, q) * 2, 0, 1)]; };
          return { wb, step };
        };
        const climb = (M, p, q, n) => { const pts = [[p, q]]; for (let i = 0; i < n; i++) { [p, q] = M.step(p, q); pts.push([p, q]); } return pts; };
        let info = {};
        v.render(() => {
          const e = eS.value, g = gS.value, hh = hS.value, M = mk(e, g, hh), key = `${e}|${g}|${hh}`;
          const colOf = (p, q) => { const id = `${cell(p)}${cell(q)}`; const b = BASIN.find(([, a, c]) => `${a}${c}` === id); return b ? b[0] : 'muted'; };
          L.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const pts = climb(M, clamp(x, 0.002, 0.998), clamp(y, 0.002, 0.998), 250); const f = pts[pts.length - 1];
            const c = v.rgb(colOf(f[0], f[1])); return [c[0], c[1], c[2], 0.32];
          }, { res: 5, key, rect: [0, 0, 1, 1] });
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const b = M.wb(i / 30, j / 30); lo = Math.min(lo, b); hi = Math.max(hi, b); }
          const levels = Array.from({ length: 9 }, (_, k) => lo + ((k + 1) * (hi - lo)) / 10);
          L.clip(() => L.contour((x, y) => M.wb(x, y), levels, { color: 'ink', width: 1, alpha: 0.45 }), [0, 1], [0, 1]);
          L.rect(0, 0, 1, 1, { stroke: true, color: 'ink', fill: false, width: 1.2 });
          const starts = rain.value ? Array.from({ length: 14 }, (_, k) => [0.07 + 0.86 * ((k * 0.381966 + 0.1) % 1), 0.07 + 0.86 * ((k * 0.618034 + 0.3) % 1)]) : [];
          starts.forEach(([a, b]) => { const pts = climb(M, a, b, 250); L.path(pts, { color: colOf(...pts[pts.length - 1]), width: 1.4 }); L.dot(a, b, { r: 3, color: 'ink' }); });
          const mine = climb(M, st.x, st.y, 400), fin = mine[mine.length - 1];
          L.path(mine, { color: 'gold', width: 3 });
          L.dot(fin[0], fin[1], { r: 6, color: 'ink' });
          // 3D surface
          const zs = 1.1 / Math.max(hi - lo, 1e-6), mid = (hi + lo) / 2;
          const P = (a, b) => [2 * a - 1, 2 * b - 1, zs * (M.wb(a, b) - mid) * 1.25];
          S3.surface((a, b) => P(a, b), [0, 1], [0, 1], { n: 30, alpha: 0.75, color: 'accent', wire: true, colorFn: (a, b) => v.mix('panel', 'accent', (M.wb(a, b) - lo) / (hi - lo + 1e-9)) });
          const lift = (pt) => { const z = P(pt[0], pt[1]); return [z[0], z[1], z[2] + 0.04]; };
          starts.forEach(([a, b]) => { const pts = climb(M, a, b, 250); S3.path(pts.filter((_, k) => k % 3 === 0).map(lift), { color: 'ink', width: 1 }); });
          S3.path(mine.filter((_, k) => k % 3 === 0).map(lift), { color: 'gold', width: 3 });
          S3.dot(lift(fin), { r: 6, color: 'gold' });
          let gmax = -Infinity, gp = [0, 0];
          for (let i = 0; i <= 100; i++) for (let j = 0; j <= 100; j++) { const b = M.wb(i / 100, j / 100); if (b > gmax) { gmax = b; gp = [i / 100, j / 100]; } }
          info = { fin, wfin: M.wb(fin[0], fin[1]), gmax, gp, w0: M.wb(st.x, st.y) };
        });
        v.legend([['blue', 'basin of peak $ab$ (0,0)', { area: true }], ['orange', 'peak $AB$ (1,1)', { area: true }], ['red', 'peak $Ab$', { area: true }], ['purple', 'peak $aB$', { area: true }], ['green', 'interior peak', { area: true }]]);
        v.readout(() => `Start: $\\bar w=${v.fix(info.w0, 4)}$ → climbs to $(p,q)=(${v.fix(info.fin[0], 2)},${v.fix(info.fin[1], 2)})$ with $\\bar w=${v.fix(info.wfin, 4)}$. Highest point of the landscape (grid search): $\\bar w=${v.fix(info.gmax, 4)}$ at $(${v.fix(info.gp[0], 2)},${v.fix(info.gp[1], 2)})$ — ${info.gmax - info.wfin < 1e-3 ? 'this population reaches the global peak' : 'this population is stuck on a lower, local peak'}.`);
      },
    },
  ],
};
