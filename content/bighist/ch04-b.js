// Big History & Quantitative History — Chapter 4, part b: items 4.5–4.8
//
// Sources checked (Oct 2026); Crossref was used for bibliographic details.
//   4.5 Green et al., Science 328: 710 (2010) (Neanderthal ancestry of non-Africans, 1–4%); Reich et al., Nature 468: 1053 (2010)
//     (Denisova); Fu et al., Nature 514: 445 (2014) (Ust'-Ishim: Neanderthal segments longer than in present people, gene flow
//     7–13 kyr before he lived, i.e. 50–60 ka; earlier estimates 37–86 ka). Relevant original Green/Reich/Fu results and Fu's
//     assumed generation time of 29 years were read; see docs/verification/bighist-4-5-source.md. The painting is an illustrative continuous-time (Markov) model of
//     admixture-segment lengths with mean 1/(T(1-f)) Morgans; it is a model, not a map of any genome.
//   4.6 Full Rampino & Self1992 NASA scan and Ambrose1998 primary transcription read; Storey2012 complete original
//     Results/Methods/Table1/Figs1–3 confirm73.88±0.32ka (1sigma full external errors). Full Lane2013 main text,
//     including Results/Discussion/Methods, read after retrying the primary PMC route. Full Yost2018 methods remain
//     access-blocked, retaining the flag. Coalescence is an illustrative
//     effective-size model, not a genomic detectability test or an estimate of actual survivors. See dedicated source report.
//   4.7 Henrich2004 full model pp200–205 and AppendicesA–D pp210–211; Powell2009 full main paper pp1298–1301;
//     Kline/Boyd2010 full main Results/Tables1–3/limitations read. Christian TED2011 primary transcript12:22–14:08 checked. The simulation is a model in the spirit of Henrich's (best-model copying with a
//     Gumbel error; the exact maximum of m Gumbel draws is sampled), with parameters chosen for display, not fitted.
//   4.8 Full relevant Roberts2001 primary text, Faith & Surovell2009 main text, Cooper2015 and Saltre2016 main papers read.
//     NorthAmerica13.8–11.4ka calendarBP verified; Australia46.4ka95%CI39.8–51.2 differs from the schematic40–50bar.
//     Full Dillehay2008 main article supports MonteVerdeII14.6–14.2ka, not a continent-wide14.5–16arrival CI.
//     Several remaining regional endpoints lack original provenance; uniform bars are schematic, not published posteriors.
//     NewZealand blue bar uses Wilmshurst2008Fig1 archaeology1sigma1280–1382CE =0.568–0.670calendar kaBP1950,
//     not an arrival-time confidence interval. Moa endpoints remain unverified. Flag retained; see dedicated source ledger.

import { clamp, gumbel01, EULER_GAMMA, paintSegments } from './ch04.shared.js';
import { completeSegmentDensity, estimateSegmentRate, coalescenceCDF, uniformTiming } from './source-models.shared.js';

// ── 4.8 data: arrival window, extinction window, climate window (or null); ages in ka before present ─────────
const REG = [
  { name: 'Australia', a: [50, 65], e: [40, 50], c: null, note: 'humans ≥ 50 ka (Madjedbebe 65 ka disputed); losses ≈ 46 ka (Roberts 2001); no clear climate event (Saltré 2016)' },
  { name: 'Eurasia', a: [45, 60], e: [10, 40], c: [11.7, 14.7], note: 'hominins long present; piecemeal losses, 40 ka to 10 ka and later; abrupt warmings (Cooper 2015)' },
  { name: 'N. America', a: [13, 23], e: [11.4, 13.8], c: [11.7, 14.7], note: 'Clovis ≈ 13 ka; White Sands 21–23 ka (contested); loss window ≈ 13.8–11.4 ka (Faith & Surovell 2009)' },
  { name: 'S. America', a: [14.5, 16], e: [8, 13], c: [11.7, 14.7], note: 'Monte Verde ≈ 14.5 ka; loss window broad and poorly dated' },
  { name: 'Madagascar', a: [1.9, 2.5], e: [0.9, 1.6], c: null, note: 'humans ≈ 2 ka (earlier claims disputed); losses within the last 2 kyr' },
  { name: 'New Zealand', a: [0.568, 0.670], e: [0.55, 0.70], c: null, note: 'blue: oldest archaeological site, calibrated 1σ interval 1280–1382 CE (0.568–0.670 ka before 1950; Wilmshurst et al., 2008, Fig.1), not a confidence interval for first human arrival; red: schematic moa-disappearance range, exact endpoints still unverified' },
];
const UX = (age) => -Math.log10(age);      // plotting coordinate: older on the left
const AGE = (x) => 10 ** -x;

export default {
  collection: 'bighist',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.5',
      kind: 'Event',
      name: 'Neanderthal and Denisovan admixture',
      statement: String.raw`Modern humans met and had children with Neanderthals and Denisovans. Green et al. (2010) estimated that $1$–$4\%$ of the genomes of their sampled non-African populations derived from Neanderthals; Reich et al. (2010) estimated about $4$–$6\%$ Denisovan ancestry in the Melanesian populations they studied. These historical estimates depend on their samples and population models, rather than describing every person today. Recombination fragments inherited ancestry: in the single-pulse model below, if gene flow happened $T$ generations ago and a fraction $f$ of the genome is archaic, the archaic segments along a chromosome have approximately exponential lengths with mean
$$\bar\ell \approx \frac{1}{T(1-f)}\ \text{Morgans},$$
so their length carries information about the admixture date. Fu et al. (2014) found substantially longer Neanderthal segments in the approximately $45\,000$-year-old Ust'-Ishim genome than in their present-day comparison genomes. Derived-allele covariance implied $232$–$430$ generations before he lived under a single-event interpretation; with an assumed 29 years per generation, the paper summarizes this as about $7\,000$–$13\,000$ years before him, or $50\,000$–$60\,000$ years ago.

**Scope.** One pulse of admixture and neutral segments are simplifying assumptions. Additional episodes, selection and uncertainty in generation time or the recombination map can change the interpretation.`,
      idea: String.raw`Each generation, a chromosome inherited from a mixed parent is a patchwork cut at an average rate of one crossover per Morgan. After $T$ generations the cuts form a Poisson process of rate $T$ per Morgan, and the two ancestries alternate along the chromosome as a two-state Markov chain whose leaving rates are $T(1-f)$ (out of an archaic segment) and $Tf$ (out of a human one). The mean archaic length is the reciprocal of the first rate. Reading that backwards, the observed mean length gives $\hat T = 1/\bigl(\bar\ell(1-f)\bigr)$. Detection thresholds remove short segments, and excluding tracts cut by the ends of a finite window also favours short complete tracts. The complete-tract density is proportional to $(W-\ell)e^{-T(1-f)\ell}$ on the observed interval. The picture fits that window-conditioned law; merely subtracting the detection threshold from the mean would leave a window-selection bias.`,
      caption: String.raw`Each bar is a stretch of one chromosome copy in a window of the chosen width; red is Neanderthal-derived (and orange Denisovan, if you add it). Pick a preset (an ancient Siberian genome, whose segments are long, or a present-day genome, whose segments are short) or set the date and fraction. The histogram uses complete Neanderthal tracts from 200 simulated copies, conditioned on the selected detection threshold; its curve and date estimate account for the finite window. Years use an assumed 29 years per generation. The optional orange layer is a separate illustrative Denisovan process, so its overlaps with red are not an exclusive three-ancestry reconstruction.`,
      deps: ['bighist-4.3', 'prob-3.7.2a', 'prob-3.7.4'],
      see: ['bighist-4.4'],
      refs: ['Green et al. 2010, Science 328:710–722, ancestry estimate and discussion pp. 720–722', 'Reich et al. 2010, Nature 468:1053–1060, Denisovan gene flow and population-history model (NIH manuscript pp. 8–10)', 'Fu et al. 2014, Nature 514:445–449, dating p. 445 and Neanderthal admixture/Figs. 5–6 pp. 448–449'],
      credit: 'Green et al., 2010 (Neanderthal genome); Reich et al., 2010 (Denisovans); Fu et al., 2014 (dating by derived-allele covariance)',
      tags: ['admixture', 'ancient DNA', 'recombination'],
      scope: String.raw`Illustrative single-pulse model with neutral segments and an assumed generation time of 29 years, also the conversion assumed by Fu et al.; it is not fitted to any genome. Fu's reported inference fits decay of covariance in shared derived alleles, not this histogram of complete simulated tracts. Its calibrated age is 46,880–43,210 years BP at 95.4% probability. Fu et al. also note that unusually long fragments could indicate later admixture, so one pulse is a simplifying interpretation. Reich's Denisovan estimate concerns sampled Papuan and Bougainville populations and is not a uniform Oceanian ancestry fraction.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neanderthal_genetics', doi: 'https://doi.org/10.1038/nature13810' },
      viz(v) {
        const P = { 'Ust’-Ishim (long segments)': [330, 2.3], 'present-day (short segments)': [1800, 2.0] };
        let Ts, fs;
        const pre = v.select('preset', Object.keys(P), 'present-day (short segments)', { onChange: (k) => { Ts.set(P[k][0]); fs.set(P[k][1]); } });
        Ts = v.slider('Neanderthal gene flow: generations ago $T$', 20, 4000, 1800, { step: 1, log: true });
        fs = v.slider('Neanderthal fraction $f$ (%)', 0.2, 8, 2, { step: 0.1 });
        const W = v.slider('window (cM)', 2, 40, 10, { step: 1 });
        const thr = v.slider('detection threshold (cM)', 0, 0.3, 0.05, { step: 0.01 });
        const den = v.toggle('add Denisovan ancestry', false);
        const T2 = v.slider('Denisovan gene flow: generations ago', 100, 4000, 1500, { step: 1, log: true });
        const f2 = v.slider('Denisovan fraction (%)', 0.5, 8, 3, { step: 0.1 });
        const A = v.stage({ x: [0, 1], y: [0, 15], axes: false, height: 320, weight: 1.35, title: 'ancestry along a stretch of chromosome' });
        const B = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'segment length (cM)', ylabel: 'density', title: 'Neanderthal segment lengths' });
        let cache = null, key = '';
        const NROW = 200;
        const run = () => {
          const k = `${Ts.value}|${fs.value}|${W.value}|${den.value}|${T2.value}|${f2.value}`;
          if (k === key) return cache;
          key = k;
          const r = v.rng(11);
          const rows = [], lens = [];
          for (let i = 0; i < NROW; i++) {
            const n = paintSegments(r, W.value / 100, Ts.value, fs.value / 100);
            const d = den.value ? paintSegments(r, W.value / 100, T2.value, f2.value / 100) : [];
            rows.push({ n, d });
            for (const [a, b] of n) if (a > 0 && b < W.value / 100) lens.push((b - a) * 100); // exclude segments cut by the window edge
          }
          cache = { rows, lens }; return cache;
        };
        v.render(() => {
          const { rows, lens } = run();
          const NS = 16;
          for (let i = 0; i < NS; i++) {
            const y = 14.4 - i * 0.9;
            A.rect(0, y - 0.28, 1, y + 0.28, { fill: 'muted', fillAlpha: 0.2, stroke: false });
            for (const [a, b] of rows[i].n) A.rect(a / (W.value / 100), y - 0.34, Math.max(b / (W.value / 100), a / (W.value / 100) + 0.0015), y + 0.34, { fill: 'red', fillAlpha: 0.9, stroke: false });
            for (const [a, b] of rows[i].d) A.rect(a / (W.value / 100), y - 0.34, Math.max(b / (W.value / 100), a / (W.value / 100) + 0.0015), y + 0.34, { fill: 'orange', fillAlpha: 0.9, stroke: false });
          }
          A.text(`0`, 0, -0.1, { size: 10, color: 'muted', align: 'left', baseline: 'top' });
          A.text(`${W.value} cM`, 1, -0.1, { size: 10, color: 'muted', align: 'right', baseline: 'top' });
          const mean = 100 / (Ts.value * (1 - fs.value / 100));
          const xm = Math.min(W.value, Math.max(3 * mean, 0.5));
          const peak = completeSegmentDensity(thr.value, 1 / mean, W.value, thr.value);
          B.setView([0, xm], [0, Math.max(1, 1.15 * peak)]);
          const kept = lens.filter((l) => l >= thr.value);
          if (kept.length > 3) {
            const h = v.M.histogram(kept, { bins: 30, range: [0, xm] });
            const dens = h.density, mx = Math.max(...dens, 1 / mean);
            B.setView([0, xm], [0, mx * 1.15]);
            B.hist(kept, { bins: 30, range: [0, xm], density: true, color: 'red', fillAlpha: 0.3 });
          }
          const lam = 1 / mean;
          B.fn((x) => (x >= thr.value ? completeSegmentDensity(x, lam, W.value, thr.value) : 0), { color: 'accent', width: 2.4, domain: [0, xm] });
          B.vband(0, thr.value, { color: 'faint', alpha: 0.2, edges: false });
          v.legend([['red', 'Neanderthal-derived'], ['orange', 'Denisovan-derived'], ['accent', 'complete-tract law (finite window and threshold)']]);
        });
        v.readout(() => {
          const { lens } = run();
          const kept = lens.filter((l) => l >= thr.value);
          if (kept.length < 3) return 'Too few segments in this window: widen it or lower the threshold.';
          const mu = kept.reduce((s, l) => s + l, 0) / kept.length;
          const rate = estimateSegmentRate(kept, W.value, thr.value);
          if (!(rate > 0) || !Number.isFinite(rate)) return `${kept.length} complete tracts; no finite positive date estimate (likelihood maximum at a rate boundary). Widen the window for more information.`;
          const That = 100 * rate / (1 - fs.value / 100);
          return `${kept.length} segments kept; mean length **${v.fix(mu, 3)} cM**. Finite-window likelihood estimate: **${v.fix(That, 0)} generations** (true ${v.fix(Ts.value, 0)}) ≈ **${v.fix((That * 29) / 1000, 1)} kyr** before the person lived.\nLiterature: the Ust’-Ishim genome (45 ka) puts the gene flow 7–13 kyr before him, about 50–60 ka; earlier estimates ranged 37–86 ka. The presets are illustrations, not fits.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.6',
      kind: 'Hypothesis',
      name: 'The Toba bottleneck (contested)',
      statement: String.raw`About $74\,000$ years ago the Toba volcano in Sumatra produced the largest known eruption of the last two million years. Rampino and Self (1992) proposed severe short-term volcanic cooling and possible amplification of glaciation. Ambrose (1998) hypothesized that this environmental shock caused bottlenecks in geographically subdivided human populations, with more survivors in tropical African refuges. He proposed that these bottlenecks could help explain low overall genetic diversity and differences between populations; the small breeding-population estimates he discussed were genetic effective sizes, not a direct census of survivors.

**Scope.** This causal hypothesis is contested. Lake Malawi studies (Lane et al., 2013; Yost et al., 2018) report regional environmental evidence against a severe East African volcanic winter. Such proxy records constrain regional impacts; they do not by themselves measure every human population's size or genetic history. Storey et al. (2012) dated the eruption to $73.88\pm0.32$ ka ($1\sigma$, full external uncertainty), rather than an exact date without error.`,
      idea: String.raw`Genetic diversity depends on the history of lineage coalescence as well as mutation. Going backwards in a diploid Wright–Fisher population, two separate lineages coalesce with probability $1/(2N_e)$ per generation. In the continuous-time approximation, **conditional on still being separate at $t_1$**, the chance of coalescing by $t_2$ is $1-\exp\bigl(-\int_{t_1}^{t_2}\tfrac{dt}{2N_e(t)}\bigr)$. A bottleneck of effective size $N_b$ for $d$ generations therefore coalesces a fraction $1-e^{-d/(2N_b)}$ of pairs still separate when it begins. This fraction becomes of order one when $d$ is comparable to $2N_b$; this is not a statistical threshold for detection in genomic data. The model is the finite-population drift of Wright–Fisher (popgen-2.1) viewed in reverse, as in the serial founder effect (bighist-4.4).`,
      caption: String.raw`Left: an illustrative effective-population-size history with a bottleneck at the Toba date. Right: the cumulative fraction of lineage pairs coalesced, with and without that bottleneck. With the defaults (effective size 3,000 for 1,000 years, 25 years per generation), about 0.66% of pairs still separate at the bottleneck's beginning coalesce during it, compared with 0.20% at the ancestral size. These are model probabilities; statistical detectability also depends on sampled genomes, loci and the inference method.`,
      deps: ['bighist-4.3', 'popgen-2.9', 'popgen-2.1'],
      see: ['bighist-4.4', 'bighist-4.2'],
      refs: ['Christian'],
      credit: 'Rampino & Self, 1992; Ambrose, 1998 (hypothesis); Lane et al., 2013 and Yost et al., 2018 (sediment evidence against a volcanic winter)',
      tags: ['bottleneck', 'volcanism', 'coalescence'],
      scope: String.raw`Single panmictic diploid population with a constant ancestral effective size, neutral pairwise coalescence and generation times chosen by the reader. This simplifies Ambrose's subdivided-population hypothesis and is not an inference from genomic or archaeological observations.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Toba_catastrophe_theory', doi: 'https://doi.org/10.1006/jhev.1998.0219' },
      verify: true,
      viz(v) {
        const N0 = v.slider('ancestral size $N_0$', 2000, 50000, 10000, { step: 100, log: true });
        const Nb = v.slider('bottleneck size $N_b$', 50, 20000, 3000, { step: 10, log: true });
        const dur = v.slider('duration (years)', 20, 30000, 1000, { step: 10, log: true });
        const tb = v.slider('bottleneck time (ka ago)', 30, 140, 74, { step: 1 });
        const gen = v.slider('generation time (years)', 20, 30, 25, { step: 1 });
        const A = v.stage({ x: [-200, 0], y: [30, 3e4], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time (ka ago, negative)', ylabel: 'population size N', title: 'size history' });
        const B = v.stage({ x: [-300, 0], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'time (ka ago, negative)', ylabel: 'fraction of pairs coalesced (looking back)', title: 'coalescence of lineage pairs' });
        const calc = () => {
          const win = [tb.value - dur.value / 1000, tb.value];
          const times = [...new Set([...Array.from({ length: 151 }, (_, i) => i * 2), ...win])].sort((a, b) => a - b);
          const c1 = times.map(t => [-t, coalescenceCDF(t, N0.value, Nb.value, tb.value, dur.value, gen.value)]);
          const c0 = times.map(t => [-t, coalescenceCDF(t, N0.value, N0.value, tb.value, dur.value, gen.value)]);
          return { c1, c0, win };
        };
        v.render(() => {
          const { c1, c0, win } = calc();
          const w0 = Math.max(win[0], 0);
          A.path([[-200, N0.value], [-win[1], N0.value], [-win[1], Nb.value], [-w0, Nb.value], [-w0, N0.value], [0, N0.value]], { color: 'accent', width: 2.6 });
          A.vline(-tb.value, { color: 'red', width: 1.2, dash: [4, 3] }); A.text('Toba eruption', -tb.value - 2, 40, { size: 10.5, color: 'red', align: 'right' });
          B.path(c0, { color: 'muted', width: 2, dash: [5, 4] });
          B.path(c1, { color: 'accent', width: 2.6 });
          B.vband(-win[1], -w0, { color: 'red', alpha: 0.15, edges: false });
          v.legend([['muted', 'no bottleneck', { dash: true }], ['accent', 'with the bottleneck']]);
        });
        v.readout(() => {
          const d = (dur.value / gen.value), P = 1 - Math.exp(-d / (2 * Nb.value));
          const base = 1 - Math.exp(-d / (2 * N0.value));
          return `The bottleneck lasts **${v.fix(d, 0)} generations**; a pair still separate at its beginning coalesces inside it with probability **${v.fix(100 * P, 2)}%** (against ${v.fix(100 * base, 2)}% without it). An order-one conditional probability requires $d/(2N_b)$ of order one; this is not a test of genomic detectability.\nLake Malawi environmental proxies constrain regional impacts. This demographic curve contains no genomic or archaeological observations.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.7',
      kind: 'Concept',
      name: 'Collective learning',
      statement: String.raw`**Collective learning**, in David Christian's phrase, is the ability of a species to share what its members have learned precisely and abundantly enough that knowledge accumulates across generations and beyond any single lifetime. Christian presents this as a central mechanism in human history; it is a conceptual explanation, not a claim that human biology stopped evolving. Cultural-evolution models make the idea quantitative: skills are acquired by copying the best available model with some error, so the skill level of a population grows when the pool of models is large enough that the best of them beats the loss in copying. In Henrich's (2004) model, with copying loss $\alpha$ and a spread $\beta$ of skill among learners (a Gumbel distribution), the average skill changes per generation by
$$\Delta z \approx -\alpha + \beta\,(\ln N + \gamma),$$
where $\gamma\approx0.577$; skills grow if $N > N^* = e^{\alpha/\beta-\gamma}$ and decay otherwise, so **more difficult skills need larger interacting populations**. Powell, Shennan and Thomas (2009) modeled how migration and population structure could sustain archaeological complexity; their demographic comparison had regional mismatches and inference limitations. Kline and Boyd (2010) found population size associated with marine-foraging tool-kit richness and complexity across ten Oceanic island populations; this observational comparison does not establish causation.

**Scope.** A stylised model: skills are independent numbers, learners copy the best model they can see, and the demographic interpretation of the Tasmanian, Pleistocene and Oceanic records is disputed.`,
      idea: String.raw`The best of $N$ noisy learners is an extreme-value problem. If each learner's skill is the model's skill minus $\alpha$ plus a Gumbel-distributed $\beta G$, the maximum of $N$ such draws is again Gumbel, shifted by $\beta\ln N$ (bioinf-3.5), so its mean is $-\alpha+\beta(\ln N+\gamma)$ above the model. Population size enters only through the logarithm, so doubling the pool adds a fixed amount $\beta\ln2$ per generation: the gain from a bigger population is small but relentless, while the loss $\alpha$ for a hard skill is large. Connectivity matters because what counts is the number of models a learner can see: groups of $N/4$ that rarely meet need about four times the total population to meet the same within-group threshold. This is the step beyond the brain growth of 4.1: a large brain can learn, but a large network lets learning accumulate.`,
      caption: String.raw`Left: the skill level of three skills of increasing difficulty (green simple, orange moderate, red complex) over 120 generations in 10 runs (thin) and their mean (bold), for a population split into four balanced groups (sizes differ by at most one; the plotted score is the best group, not the population mean). Slide the total size and the connectivity (the chance a learner copies the best of all four groups instead of the best of its own); complex scores tend to deteriorate at small $N$. The zero floor is a display convention; it is not an absorbing loss. Right: the net change per generation against $N$, with the thresholds where it crosses zero.`,
      deps: ['bighist-4.1', 'bioinf-3.5'],
      see: ['bighist-4.8', 'bighist-4.3'],
      refs: ['David Christian, The history of our world in18minutes, TED2011, transcript12:22–14:08: https://www.ted.com/talks/david_christian_the_history_of_our_world_in_18_minutes?view=transcript', 'Henrich (2004), American Antiquity69:197–214, model pp200–205 and AppendicesA–D pp210–211: https://coevolution.fas.harvard.edu/sites/g/files/omnuum5841/files/culture_cognition_coevol_lab/files/henrich_2004-2.pdf', 'Powell, Shennan & Thomas (2009), Science324:1298–1301, complete main paper: https://cognitionandculture.net/wp-content/uploads/PAL_E4401.pdf', 'Kline & Boyd (2010), Proceedings of the Royal Society B277:2559–2564, complete main text, Tables1–3 and limitations: https://pmc.ncbi.nlm.nih.gov/articles/PMC2894932/'],
      credit: 'Christian (collective learning, TED2011 presentation); Henrich, 2004; Powell, Shennan & Thomas, 2009; Kline & Boyd, 2010',
      tags: ['cultural evolution', 'population size', 'technology'],
      scope: String.raw`Model in the spirit of Henrich (2004): independent skills, best-model copying, Gumbel error, four balanced groups.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cumulative_cultural_evolution', doi: 'https://doi.org/10.2307/4128416' },
      viz(v) {
        const N = v.slider('population size $N$', 4, 5000, 200, { step: 1, int: true, log: true });
        const c = v.slider('connectivity (chance of copying the global best)', 0, 1, 0.3, { step: 0.05 });
        const beta = v.slider('spread of learners $\\beta$', 0.5, 2, 1, { step: 0.05 });
        const AL = [['simple', 3, 'green'], ['moderate', 5, 'orange'], ['complex', 7, 'red']];
        const GENS = 120, K = 4, R = 10, Z0 = 12;
        const A = v.stage({ x: [0, GENS], y: [0, 40], axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'generation', ylabel: 'skill level', title: 'skill level over time' });
        const B = v.stage({ x: [4, 5000], y: [-8, 8], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'population size N', ylabel: 'change per generation Δz', title: 'net growth rate' });
        let key = '', cache = null;
        const run = () => {
          const k = `${N.value}|${c.value}|${beta.value}`;
          if (k === key) return cache; key = k;
          const out = AL.map(([, al]) => {
            const runs = [];
            for (let q = 0; q < R; q++) {
              const r = v.rng(100 + q * 17 + al);
              let z = Array(K).fill(Z0); const tr = [Z0];
              const sizes = Array.from({ length: K }, (_, i) => Math.floor(N.value / K) + Number(i < N.value % K));
              for (let g = 0; g < GENS; g++) {
                const gb = Math.max(...z);
                z = z.map((zz, i) => {
                  const own = Math.round((1 - c.value) * sizes[i]), glob = sizes[i] - own;
                  let best = -Infinity;
                  if (own > 0) best = Math.max(best, zz - al + beta.value * (Math.log(own) + gumbel01(r)));
                  if (glob > 0) best = Math.max(best, gb - al + beta.value * (Math.log(glob) + gumbel01(r)));
                  return Math.max(0, best);
                });
                tr.push(Math.max(...z));
              }
              runs.push(tr);
            }
            return runs;
          });
          cache = out; return out;
        };
        v.render(() => {
          const out = run(); let ymax = 20;
          out.forEach((runs) => runs.forEach((t) => { ymax = Math.max(ymax, ...t); }));
          A.setView([0, GENS], [0, ymax * 1.05]);
          out.forEach((runs, i) => {
            const col = AL[i][2];
            runs.forEach((t) => A.path(t.map((y, g) => [g, y]), { color: col, width: 1, alpha: 0.25 }));
            A.path(Array.from({ length: GENS + 1 }, (_, g) => [g, runs.reduce((s, t) => s + t[g], 0) / R]), { color: col, width: 3 });
          });
          A.hline(Z0, { color: 'faint', width: 1, dash: [3, 3] });
          AL.forEach(([nm, al, col]) => {
            B.fn((n) => beta.value * (EULER_GAMMA + Math.log(n)) - al, { color: col, width: 2, domain: [4, 5000] });
            B.fn((n) => beta.value * (EULER_GAMMA + Math.log(n / K)) - al, { color: col, width: 1.4, dash: [4, 3], domain: [4 * K, 5000] });
          });
          B.hline(0, { color: 'ink', width: 1.2 });
          B.vline(N.value, { color: 'gold', width: 1.6 });
          v.legend([['green', 'simple (α = 3)'], ['orange', 'moderate (α = 5)'], ['red', 'complex (α = 7)'], ['muted', 'solid: all N models; dashed: only the group, N/4', { dash: true }]]);
        });
        v.readout(() => {
          const th = (al) => Math.exp(al / beta.value - EULER_GAMMA);
          const fmt = (x) => (x < 1e4 ? v.fix(x, x < 10 ? 1 : 0) : '> 10⁴');
          const out = run();
          const fin = out.map((runs) => runs.reduce((s, t) => s + t[GENS], 0) / R);
          return `Thresholds $N^*=e^{\\alpha/\\beta-\\gamma}$ (all models visible): simple **${fmt(th(3))}**, moderate **${fmt(th(5))}**, complex **${fmt(th(7))}**; with isolated groups of $N/4$ the total must be four times larger.\nAfter ${GENS} generations the mean best-group score across ${R} runs is ${v.fix(fin[0], 0)} (simple), ${v.fix(fin[1], 0)} (moderate), ${v.fix(fin[2], 0)} (complex), started at ${Z0}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.8',
      kind: 'Hypothesis',
      name: 'Megafaunal extinctions: overkill or climate?',
      statement: String.raw`Late Quaternary extinctions removed many large vertebrates from Australia, the Americas, Eurasia and islands. The term *megafauna* commonly uses a mass threshold of roughly 40–45 kg, with conventions varying by study. In the **overkill** hypothesis, human hunting drove losses; other human impacts include habitat modification. **Climate** hypotheses emphasize environmental change, and human–climate interactions are also possible. Chronology constrains these explanations: when did people arrive, when did particular species disappear, and which environmental changes accompanied them?

**Scope.** Regional and species histories differ. Roberts et al. (2001) inferred Australian extinction near 46.4 ka, well before the Last Glacial Maximum, while allowing several causal explanations. Saltré et al. (2016) found no continent-scale relationship with their tested Australian climate proxies; they explicitly allow local or synergistic climate effects. Cooper et al. (2015) associated Holarctic population turnover with abrupt warming episodes, including events long before the terminal Pleistocene. A shared time window alone does not establish which mechanism caused a loss.`,
      idea: String.raw`Compare an arrival window with a disappearance window and an environmental interval. Earlier human arrival is compatible with a human contribution; losses apparently predating arrival weaken that interpretation only to the extent that the archaeological and fossil chronologies are reliable. Overlap with a climate interval is also compatible with several causes. Radiocarbon dates (geol-2.6) become difficult near the method's limit. Incomplete sampling usually places the last observed fossil **earlier than true extinction** (the Signor–Lipps effect; Kirchner & Weil, 2000, p.179); an inferred extinction interval may already correct for this. The display assumes independent uniform ages inside its chosen windows. Its probabilities describe that illustrative timing model, not posterior causal probabilities or the full dating analyses of the cited papers.`,
      caption: String.raw`Each row is a region on a log-time axis: blue = illustrative human-arrival range, red = illustrative disappearance range, gold = a selected terminal-Pleistocene climate interval. Drag the selected region's four handles to explore timing. Reset restores schematic comparison ranges; these are not a common set of published confidence intervals. The 14.7–11.7 ka band groups warming and cooling phases and does not represent every abrupt warming considered by Cooper et al.`,
      deps: ['bighist-4.3', 'bighist-4.2'],
      see: ['bighist-4.7'],
      refs: ['Christian'],
      credit: 'Martin, 1967 (overkill); Roberts et al., 2001; Faith & Surovell, 2009; Cooper et al., 2015; Saltré et al., 2016',
      tags: ['extinction', 'megafauna', 'climate'],
      scope: String.raw`Schematic comparison ranges modeled as independent uniform distributions, not calibrated age posteriors. Full source provenance remains incomplete for several regional endpoints. Eurasia's blue range concerns a modern-human dispersal scenario, not the first hominin presence. A missing gold band supplies no evidence that climate was absent.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quaternary_extinction_event', doi: 'https://doi.org/10.1126/science.1060264' },
      verify: true,
      viz(v) {
        const base = () => REG.map((r) => ({ name: r.name, a: r.a.slice(), e: r.e.slice(), c: r.c ? r.c.slice() : null, note: r.note }));
        let data = base();
        const sel = v.select('region', REG.map((r, i) => ({ value: String(i), label: r.name })), '2');
        v.button('Reset', () => { data = base(); });
        const S = v.stage({ x: [UX(120), UX(0.4)], y: [-0.6, 6.0], axes: 'box', gutter: true, height: 400, full: true, xlabel: 'time (ka before present, log scale)', xticks: [100, 50, 20, 10, 5, 2, 1, 0.5].map((a) => [UX(a), String(a)]), yticks: [], title: 'arrival of people and loss of the megafauna' });
        const rowY = (i) => 5 - i;
        const mk = (key, idx, color, off) => {
          const h = S.handle(UX(1), 0, { color, r: 6, constrain: 'x' });
          h.onDrag = () => {
            const d = data[+sel.value], y = key === 'a' ? d.a : d.e;
            y[idx] = clamp(AGE(h.x), 0.3, 150);
            y.sort((p, q) => p - q);
          };
          h.off = off; h.key = key; h.idx = idx; return h;
        };
        const hs = [mk('a', 0, 'accent', 0.2), mk('a', 1, 'accent', 0.2), mk('e', 0, 'red', -0.2), mk('e', 1, 'red', -0.2)];
        function stats(d) {
          return uniformTiming(d.a, d.e, d.c);
        }
        v.render(() => {
          const idx = +sel.value;
          data.forEach((d, i) => {
            const y = rowY(i), me = i === idx;
            if (d.c) S.rect(UX(d.c[1]), y - 0.46, UX(d.c[0]), y + 0.46, { fill: 'gold', fillAlpha: me ? 0.28 : 0.14, stroke: false });
            S.rect(UX(d.a[1]), y + 0.08, UX(d.a[0]), y + 0.32, { fill: 'accent', fillAlpha: me ? 0.55 : 0.3, color: 'accent', width: 1 });
            S.rect(UX(d.e[1]), y - 0.32, UX(d.e[0]), y - 0.08, { fill: 'red', fillAlpha: me ? 0.55 : 0.3, color: 'red', width: 1 });
            S.text(d.name, UX(120) + 0.03, y + 0.01, { size: 11, color: me ? 'ink' : 'muted', align: 'left', baseline: 'middle' });
          });
          const d = data[idx], y = rowY(idx);
          const vals = { a: d.a, e: d.e };
          for (const h of hs) h.set(UX(vals[h.key][h.idx]), y + h.off);
          S.vline(UX(11.7), { color: 'gold', width: 1, dash: [2, 3], alpha: 0.7 });
          S.text('Holocene begins', UX(11.7) - 0.03, 5.85, { size: 10, color: 'muted', align: 'right' });
          v.legend([['accent', 'humans arrive'], ['red', 'last megafauna'], ['gold', 'climate event (14.7–11.7 ka)']]);
        });
        v.readout(() => {
          const d = data[+sel.value], st = stats(d);
          const f = (x) => (x >= 10 ? v.fix(x, 0) : x >= 1 ? v.fix(x, 1) : v.fix(x, 2));
          const ov = st.pAfter < 0.05 ? 'Fewer than 5% of independent draws put people before the losses. This timing weakens overkill under the chosen windows; it does not exclude it.' : st.pAfter > 0.95 ? `People arrive first in nearly every draw, **${f(st.lag)} kyr** before the losses on average: consistent with overkill (and with a climate cause, if there is one).` : `The windows overlap: people arrive before the loss in ${v.fix(100 * st.pAfter, 0)}% of draws.`;
          const cl = d.c ? `P(loss inside the 14.7–11.7 ka climate window) = **${v.fix(100 * st.pClim, 0)}%**.` : 'No climate-event window is supplied in this simplified comparison; this is not evidence that climate had no role.';
          return `**${d.name}** — ${d.note}.\n${ov} ${cl}`;
        });
      },
    },
  ],
};
