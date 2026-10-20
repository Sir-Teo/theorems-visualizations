// Demography — Chapter 4: Fertility and reproduction (part a: 4.1–4.6)
import { reproductionRates } from './source-audit-reproduction.js';
import { AGE22 } from './ch04.shared.js';
import { clamp, sum, fx, int, CTRY, CNAME, SEXY, FAGES, FMID, FLAB, FY0, FY1, asfr, women, indAt, tfrOf, macOf, lerpAt, femSurv, lAtAge, stepPath, cOpts } from './ch04.shared.js';

const yearTicks = (a = 1950, b = 2020, d = 10) => { const t = []; for (let y = a; y <= b; y += d) t.push([y, String(y)]); return t; };

export default {
  collection: 'demo',
  chapter: 4,
  title: 'Fertility and reproduction',
  summary: String.raw`Fertility is measured by age-specific rates, summed into the total fertility rate; folding in survival gives the net reproduction rate, which is exactly one at replacement. Period measures can mislead when people postpone childbearing, and a few proximate determinants (marriage, contraception, breastfeeding, abortion) account for most variation between societies. Sampling quirks also matter: children see larger families than mothers have, and the sex ratio at birth, close to 105 boys per 100 girls, shapes the sex ratio at every later age.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Age-specific fertility rates',
      statement: String.raw`For women of age group $a$ in a given period, the **age-specific fertility rate** is $f_a = B_a / W_a$: the births $B_a$ to women of that group divided by the person-years $W_a$ they lived in the period (for a calendar year, roughly the mid-year number of women). It is an occurrence–exposure rate in the sense of 1.2, with births as the event and women of the age group as the population at risk, and it is usually quoted per 1 000 women per year. In five-year groups the rates are positive from about 15 to 49, peak in the twenties or early thirties, and the whole schedule $a \mapsto f_a$ is the basic description of a population's fertility.`,
      idea: String.raw`Dividing by the women of the same age corrects for the fact that a young population has many women in the fertile ages (the crude birth rate of 1.3 mixes age structure and behaviour). Because each rate is an exposure rate, its numerator and denominator must refer to the same women: births are classified by the mother's age at the birth and the exposure by age during the period, which is why 1.2 comes first. The schedule's height, location and spread are what later items compress into a few summary numbers: area (the total fertility rate, 4.2), centre (the mean age, 4.5) and shape (4.8).`,
      caption: String.raw`Pick a country and a year (blue bars) and optionally a second country and year (orange outline). Choose an age group to see its births and women at risk behind the rate, and how that group's rate has moved since 1950 on the right. Compare Nigeria in 1990 with Japan in 2023: the peak moves from the early twenties to about 30 and the whole curve falls.`,
      deps: ['demo-1.2'],
      refs: ['PHG ch. 5'],
      tags: ['fertility', 'rates'],
      scope: String.raw`UN World Population Prospects 2024 estimates (medium variant) for 1950–2023, five-year groups of mothers from 10–14 to 50–54. Births and women at risk are given for the calendar year; "women" shown here are recovered as births divided by the rate, so they are consistent but rounded. Single years of age would show finer detail.`,
      links: { data: 'https://population.un.org/wpp/' },
      viz(v) {
        const co = v.select('country', cOpts(), 'JPN');
        const yr = v.slider('year', FY0, FY1, 2023, { int: true });
        const on = v.toggle('compare', true);
        const co2 = v.select('compare with', cOpts(), 'NGA');
        const yr2 = v.slider('compare year', FY0, FY1, 1990, { int: true });
        const gr = v.select('age group', FLAB.slice(1, 8).map((l, i) => ({ value: String(i + 1), label: l })), '2');
        const s = v.stage({ x: [10, 55], y: [0, 300], axes: 'box', gutter: true, xlabel: 'age of mother', ylabel: 'births per 1 000 women per year', height: 360, title: 'Fertility schedule' });
        const t = v.stage({ x: [FY0, FY1], y: [0, 300], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'births per 1 000 women', height: 360, xticks: yearTicks(), title: 'One age group through time' });
        let R = null;
        v.render(() => {
          const g = +gr.value;
          const f = asfr(co.value, yr.value).map((x) => x * 1000), f2 = asfr(co2.value, yr2.value).map((x) => x * 1000);
          const top = Math.max(...f, ...(on.value ? f2 : [0]), 40) * 1.2;
          s.setView([10, 55], [0, top]);
          FAGES.forEach((a, i) => s.rect(a, 0, a + 5, f[i], { fill: i === g ? 'gold' : 'accent', fillAlpha: i === g ? 0.55 : 0.3, color: i === g ? 'gold' : 'accent', width: 1.5 }));
          FAGES.forEach((a, i) => { if (f[i] >= 1) s.text(v.fix(f[i], 0), a + 2.5, f[i] + top * 0.02, { size: 11, color: 'ink', align: 'center', baseline: 'bottom' }); });
          if (on.value) s.path(stepPath(f2), { color: 'orange', width: 2.4 });
          const series = (c) => Array.from({ length: FY1 - FY0 + 1 }, (_, i) => [FY0 + i, asfr(c, FY0 + i)[g] * 1000]);
          const a1 = series(co.value), a2 = on.value ? series(co2.value) : null;
          const tmax = Math.max(...a1.map((p) => p[1]), ...(a2 ? a2.map((p) => p[1]) : [0]), 20) * 1.1;
          t.setView([FY0, FY1], [0, tmax]);
          if (a2) { t.path(a2, { color: 'orange', width: 2 }); t.dot(yr2.value, a2[yr2.value - FY0][1], { color: 'orange' }); }
          t.path(a1, { color: 'accent', width: 2.4 });
          t.dot(yr.value, a1[yr.value - FY0][1], { color: 'gold', r: 6 });
          const W = women(co.value, yr.value)[g], F = f[g] / 1000;
          R = { g, W, B: W * F, rate: f[g], tfr: tfrOf(f.map((x) => x / 1000)), mac: macOf(f) };
        });
        v.legend([['accent', 'country and year'], ['orange', 'comparison']]);
        v.readout(() => `${CNAME[co.value]} ${yr.value}, mothers aged ${FLAB[R.g]}: ${int(R.B)} thousand births ÷ ${int(R.W)} thousand women = **${v.fix(R.rate, 1)}** per 1 000 per year.\nSumming the whole schedule: $5\\sum f_a$ = ${v.fix(R.tfr, 2)} births per woman (4.2); mean age of the schedule ${v.fix(R.mac, 1)} years.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Total fertility rate',
      statement: String.raw`The **total fertility rate** of a period is the sum of its age-specific fertility rates over all single years of age. With five-year groups of rates $f_a$ this is $\mathrm{TFR} = 5\sum_a f_a$. It is the number of children a hypothetical woman would bear if she lived through the childbearing years experiencing, at each age, the rates of the period. It is a **synthetic-cohort** measure: no real group of women need have the experience it describes, and it can differ from the completed family size of any real cohort when the timing of childbearing is changing (4.6).`,
      idea: String.raw`A rate $f_a$ of births per woman-year, applied for the five years of an age group, gives $5 f_a$ births per woman in that group. Stacking these contributions over age is just the integral of the schedule of 4.1, so the TFR is the **area** under the age-specific curve; unlike the crude birth rate it does not depend on the age distribution of the women. It is the fertility counterpart of the period life expectancy of 2.7, which likewise cuts the age-specific rates of one period into an imaginary lifetime. For the displayed piecewise-constant schedule, refining partitions around the finitely many age boundaries makes the upper and lower sums in pma 6.1 approach the same value. Its integral is exactly the sum of rate times band width; the factor five comes from that width, not from a probability assumption.`,
      caption: String.raw`Left: the five-year contributions $5 f_a$ stacked into one column per population; the top of the column is the TFR and the dashed line marks 2.1, near replacement (4.4). Right: the TFR of every country since 1950 with your pick highlighted. Slide the year and watch the stack shrink and its bands shift to older ages; the readout compares the sum computed here with the TFR published by the UN.`,
      deps: ['demo-4.1', 'pma-6.1'],
      refs: ['PHG ch. 5'],
      tags: ['fertility', 'synthetic cohort'],
      scope: String.raw`Computed from the nine five-year groups 10–14 … 50–54 of the UN estimates; the UN publishes TFR from single-year rates, so the two differ by a few hundredths. Period measure: it does not predict the completed fertility of any cohort.`,
      links: { data: 'https://population.un.org/wpp/' },
      viz(v) {
        const co = v.select('country', cOpts(), 'NGA');
        const yr = v.slider('year', FY0, FY1, 1990, { int: true });
        const co2 = v.select('compare with', cOpts(), 'JPN');
        const s = v.stage({ x: [0, 3], y: [0, 8], axes: 'box', gutter: true, ylabel: 'children per woman', height: 380, title: 'Stacking the schedule', xticks: [] });
        const t = v.stage({ x: [FY0, FY1], y: [0, 8], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'total fertility rate', height: 380, xticks: yearTicks(), title: 'TFR since 1950' });
        const col = (i) => v.ramp(i / 8, 'accent', 'panel');
        let R = null;
        v.render(() => {
          const stack = (x0, c, y) => {
            const f = asfr(c, y); let h = 0;
            f.forEach((x, i) => { const d = 5 * x; if (d > 0) { s.rect(x0, h, x0 + 1, h + d, { fill: v.ramp(0.15 + 0.85 * i / 8, 'accent', 'panel'), fillAlpha: 0.85, color: 'panel', width: 1 }); if (d > 0.22) s.text(FLAB[i], x0 + 0.5, h + d / 2, { size: 10, color: 'ink', align: 'center', baseline: 'middle', plate: true }); } h += d; });
            return h;
          };
          const h1 = stack(0.3, co.value, yr.value), h2 = stack(1.7, co2.value, yr.value);
          s.hline(2.1, { color: 'green', dash: true, width: 1.5 });
          s.text('2.1', 2.95, 2.1, { size: 11, color: 'green', align: 'right', baseline: 'bottom' });
          s.text(CNAME[co.value], 0.8, h1 + 0.2, { size: 12, color: 'accent', align: 'center', baseline: 'bottom' });
          s.text(CNAME[co2.value], 2.2, h2 + 0.2, { size: 12, color: 'ink', align: 'center', baseline: 'bottom' });
          CTRY.forEach((c) => { if (c !== co.value && c !== co2.value) t.path(FYEARSx.map((y) => [y, tfrOf(asfr(c, y))]), { color: 'muted', width: 1, alpha: 0.35 }); });
          t.path(FYEARSx.map((y) => [y, tfrOf(asfr(co2.value, y))]), { color: 'ink', width: 2, alpha: 0.7 });
          t.path(FYEARSx.map((y) => [y, tfrOf(asfr(co.value, y))]), { color: 'accent', width: 2.6 });
          t.hline(2.1, { color: 'green', dash: true, width: 1.2 });
          t.vline(yr.value, { color: 'gold', width: 1.5 });
          R = { h1, h2, pub: indAt(co.value, 'tfr', yr.value), pub2: indAt(co2.value, 'tfr', yr.value) };
        });
        v.readout(() => `${CNAME[co.value]} ${yr.value}: TFR = $5\\sum f_a$ = **${v.fix(R.h1, 2)}** (UN published ${v.fix(R.pub, 2)}); ${CNAME[co2.value]}: ${v.fix(R.h2, 2)} (published ${v.fix(R.pub2, 2)}).\nA woman living through the rates of ${CNAME[co.value]} in ${yr.value} would have ${v.fix(R.h1, 1)} children, ${R.h1 > 2.1 ? 'more' : 'fewer'} than the 2.1 that just replaces a population with low mortality.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3', kind: 'Definition', name: 'Gross and net reproduction rates',
      statement: String.raw`Reproduction rates count **live daughters born**, per woman in a hypothetical female birth cohort. If fertility $f_a$ is in births per woman-year over five-year age bands and $s$ is boys per girl at birth, assume the same daughter share $b=1/(1+s)$ at every maternal age. Then
$$\mathrm{GRR}=b\sum_a 5f_a,$$
$$\mathrm{NRR}=b\sum_a f_a\frac{{}_5L_a}{\ell_0}.$$
Here $\,{}_5L_a/\ell_0$ is expected **person-years lived by the prospective mother** in the age band per newborn girl. GRR ignores her mortality; NRR accounts for her survival to and through childbearing. It does not additionally require each daughter to survive to adulthood.

For nonnegative fertility and a valid female life table, $0\le\mathrm{NRR}\le\mathrm{GRR}$. These are period, synthetic-cohort measures, not observed completed fertility or a prediction of next year's population growth.`,
      idea: String.raw`With female survival $S(x)=\ell(x)/\ell_0$, the continuous form is $\mathrm{NRR}=b\int f(x)S(x)\,dx$. The units cancel: births per woman-year times expected years lived, times the daughter share. Life-table person-years (demo-2.3) supply the grouped version.

For the slider, an **authored reconstruction** joins the female survivor knots by constant hazards within each age interval. Scaling those hazards by $k$ gives $S_k(x)=S(x)^k$. The net bars use the exact interval averages of this same curve, rather than raising an interval's average survival to a power. At $k=0$ there is no mortality and NRR equals GRR; increasing $k$ cannot raise NRR. Under fixed future fertility/mortality and no migration, NRR 1 describes generational replacement; age structure can still produce short-run growth or decline.`,
      caption: String.raw`**Left:** gross daughters per woman-year (blue), the net contribution after the prospective mother's mortality in the local reconstruction (green), and their difference (red). All nine fertility bands, ages 10–14 through 50–54, enter the areas.

**Right:** the same reconstructed female survival used by the net bars; grey points are the abridged UN survivor knots. Choose a country/year and scale the reconstructed hazard from 0 to 3. At 1, compare the reconstructed NRR with the separate official-person-years aggregation and UN's published NRR in the readout. The interpolation is not asserted to reproduce their finer-age method exactly.`,
      deps: ['demo-4.2', 'demo-2.3'], see: ['mathbio-4.5', 'demo-4.4'],
      refs: ['UN Demographic Yearbook, natality Table 3 technical notes: definitions, computation and limitations', 'UN World Population Prospects 2024, fertility by age5, female abridged life tables and demographic indicators'],
      tags: ['reproduction', 'net maternity'],
      verify: false,
      scope: String.raw`Period estimates for ten countries at 1950,1970,1990,2010,2023, with fertility and female mortality matched to the same year. The birth-sex fraction is assumed constant across maternal ages; SRB data are boys per 100 girls, converted to 100/(100+SRB). The official grouped comparison treats each five-year fertility rate as constant in its band. The slider instead uses a declared log-linear survivorship reconstruction, integrating its powered survival exactly. Published NRR, official-person-years aggregation and reconstructed NRR are distinct quantities. Replacement interpretation assumes unchanged schedules and no migration; neither male fertility constraints nor population momentum is modeled.`,
      links: { source: 'https://unstats.un.org/unsd/Demographic/products/dyb/DYBNat/NotesNatStatTab03.htm', data: 'https://population.un.org/wpp/' },
      viz(v) {
        const country=v.select('country',cOpts(),'NGA');
        const year=v.select('matched fertility/life-table year',SEXY.map(y=>({value:String(y),label:String(y)})),'1990');
        const hazard=v.slider('reconstructed mortality hazard ×',0,3,1,{step:.05});
        const A=v.stage({x:[8,57],y:[-.005,.12],axes:'box',gutter:true,xlabel:'maternal age (years)',ylabel:'live daughters per woman-year',height:360,minWidth:280,title:'gross and reconstructed net maternity'});
        const B=v.stage({x:[-4,104],y:[-.05,1.08],axes:'box',gutter:true,xlabel:'prospective mother’s age (years)',ylabel:'survival from female birth S(x)',height:360,minWidth:280,title:'the same reconstructed survival behind the bars'});
        v.legend([['accent','gross maternity'],['green','reconstructed net maternity / survival'],['red','maternal mortality loss',{area:true}],['muted','UN survivor knots / baseline reconstruction'],['accent','offered fertility ages 10–54',{area:true}]]);
        let st;
        v.render(()=>{
          const c=country.value,y=+year.value,sv=femSurv(c,y),f=asfr(c,y),srb=indAt(c,'srb',y),k=hazard.value;
          const model=reproductionRates({ages:AGE22,survivors:sv.l,personYears:sv.L,fertilityAges:FAGES,fertility:f,boysPer100Girls:srb,multiplier:k});
          const top=Math.max(.02,...model.gross);A.setView([8,57],[-.03*top,1.16*top]);
          FAGES.forEach((a,i)=>{A.rect(a,0,a+5,model.gross[i],{fill:'accent',fillAlpha:.2,color:'accent',width:1.5});A.rect(a,model.net[i],a+5,model.gross[i],{fill:'red',fillAlpha:.35,stroke:false});A.rect(a,0,a+5,model.net[i],{fill:'green',fillAlpha:.45,color:'green',width:1.2});});
          B.vband(10,55,{color:'accent',alpha:.07});B.path(model.baselineCurve,{color:'muted',width:1.4,dash:[4,4]});B.path(model.adjustedCurve,{color:'green',width:2.6});B.dots(model.knots,{color:'muted',r:2.5});
          st={country:c,year:y,multiplier:k,srb,fertility:f,model,published:indAt(c,'nrr',y),publishedTFR:indAt(c,'tfr',y)};
        });
        v.readout(()=>{const{model:m}=st;const side=m.NRR>1?'above':m.NRR<1?'below':'at';return `${CNAME[st.country]} ${st.year}: SRB ${v.fix(st.srb,1)} boys per 100 girls; daughter share ${v.fix(m.daughterShare,6)}. **GRR ${v.fix(m.GRR,4)}**, **reconstructed NRR(${v.fix(st.multiplier,2)}) ${v.fix(m.NRR,4)}**, mortality difference ${v.fix(m.loss,4)} live daughters per newborn prospective mother. Reconstructed survival to age 30: ${v.fix(100*m.survival30,3)}%.\n\nAt baseline mortality only: official-L grouped NRR ${v.fix(m.grouped,4)}, reconstructed NRR(1) ${v.fix(m.reconstructedBaseline,4)}, UN published NRR ${v.fix(st.published,4)}. The local interpolation and grouped fertility may differ from UN's finer-age calculation; the published reference does not change with the hypothetical slider. The selected reconstructed NRR is ${side} 1. This describes replacement under unchanged schedules and no migration, not current or next-year population growth.`;});
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Replacement-level fertility',
      statement: String.raw`**Replacement-level fertility** is the total fertility rate at which the net reproduction rate equals 1, so that each generation of women exactly replaces itself (with no migration and constant rates). Holding the age pattern of fertility fixed, $\mathrm{NRR} = \mathrm{TFR}\cdot\bar\ell/(1+\mathrm{SRB})$, where $\bar\ell$ is the fertility-weighted survival of girls to the ages of childbearing, so the replacement level is $\mathrm{TFR}^{*} = (1+\mathrm{SRB})/\bar\ell$. It is **about 2.1** where nearly all girls survive to their thirties and **above 3** where a third of them do not.`,
      idea: String.raw`Two corrections lift replacement above 2.0: about 105 boys are born per 100 girls (so 2.05 births yield one girl), and a few girls die before they can reproduce, so a little more than $1/\bar\ell$ of them must be born. When mortality is high the second correction dominates, which is why 2.1 is a rich-country rule of thumb and not a constant of nature. The NRR of 4.3 is simply $\mathrm{TFR}/\mathrm{TFR}^{*}$ if the schedule's shape does not change; only the long-run population growth rate also depends on the timing, which is why replacement is a statement about a generation, not about the next ten years.`,
      caption: String.raw`Left: the replacement TFR against the probability that a girl survives to 30. The curve is $(1+\mathrm{SRB})/\ell$; dots are the real country–year pairs of our data, with replacement computed as TFR ÷ NRR from the UN estimates (1950–2023). Drag the handle along the curve, or change the sex ratio at birth. Right: NRR as a function of TFR for three mortality levels; each crosses 1 at its own replacement level.`,
      deps: ['demo-4.3'],
      refs: ['PHG ch. 5'],
      tags: ['replacement', 'net reproduction'],
      credit: 'Espenshade, Guzman & Westoff, 2003 (variation of replacement fertility with mortality)',
      scope: String.raw`Holds with no migration and with age-specific rates held constant; the dots use the UN's period NRR, which weights survival by the observed age pattern of fertility, while the horizontal axis uses survival to exactly 30, so the points scatter around the curve rather than on it.`,
      links: { doi: 'https://doi.org/10.1023/b:popu.0000020882.29684.8e' },
      viz(v) {
        const srbS = v.slider('boys per 100 girls at birth', 100, 112, 105, { step: 0.1 });
        const s = v.stage({ x: [0.4, 1], y: [1.8, 5], axes: 'box', gutter: true, xlabel: 'probability a girl survives to age 30', ylabel: 'replacement TFR', height: 380, title: 'Replacement depends on mortality' });
        const t = v.stage({ x: [0, 6], y: [0, 3], axes: 'box', gutter: true, xlabel: 'total fertility rate', ylabel: 'net reproduction rate', height: 380, title: 'NRR = TFR ÷ replacement' });
        const h = s.handle(0.97, 2.1, { color: 'gold', label: 'you', labelPos: 'n', constrain: (x) => { const l = clamp(x, 0.45, 1); return [l, (1 + srbS.value / 100) / l]; } });
        const pts = [];
        for (const c of CTRY) for (const y of SEXY) { const tfr = indAt(c, 'tfr', y), nrr = indAt(c, 'nrr', y); if (nrr > 0.2 && tfr > 0.5) pts.push({ c, y, x: femSurv(c, y).l30, v: tfr / nrr }); }
        let R = null;
        v.render(() => {
          const sr = srbS.value / 100, rep = (l) => (1 + sr) / l;
          s.fn((l) => rep(l), { domain: [0.4, 1], color: 'accent', width: 2.6 });
          s.hline(2.1, { color: 'green', dash: true, alpha: 0.7 });
          s.dots(pts.map((p) => [p.x, p.v]), { r: 3.5, color: 'orange', alpha: 0.7 });
          const l = clamp(h.x, 0.45, 1); h.set(l, rep(l));
          s.text('rich countries today', 0.985, 2.0, { size: 11, color: 'muted', align: 'right', baseline: 'top' });
          const ls = [0.6, l, 0.99];
          ls.forEach((li, j) => t.fn((tfr) => tfr * li / (1 + sr), { domain: [0, 6], color: j === 1 ? 'gold' : 'muted', width: j === 1 ? 2.6 : 1.6, dash: j !== 1 }));
          t.hline(1, { color: 'green', dash: true });
          t.vline(rep(l), { color: 'gold', dash: true });
          t.dot(rep(l), 1, { color: 'gold', r: 6 });
          const hi = pts.filter((p) => p.x < 0.75);
          R = { l, rep: rep(l), sr, nHi: hi.length, meanHi: hi.length ? sum(hi.map((p) => p.v)) / hi.length : NaN, nLo: pts.filter((p) => p.x > 0.97).length, meanLo: sum(pts.filter((p) => p.x > 0.97).map((p) => p.v)) / Math.max(1, pts.filter((p) => p.x > 0.97).length) };
        });
        v.legend([['accent', 'curve (1+SRB)/ℓ'], ['orange', 'country–year, TFR ÷ NRR', { dot: true }]]);
        v.readout(() => `Survival to 30 of ${v.fix(R.l * 100, 1)}% and ${v.fix(srbS.value, 1)} boys per 100 girls give a replacement TFR of **${v.fix(R.rep, 2)}**.\nIn our data, the ${R.nLo} country–years with survival above 97% average ${v.fix(R.meanLo, 2)}; the ${R.nHi} below 75% average ${v.fix(R.meanHi, 2)}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Mean age at childbearing and generation length',
      statement: String.raw`The **mean age at childbearing** of a schedule is the average age of mothers at their births, $\bar a_f = \sum_a a\,f_a / \sum_a f_a$ (mid-point ages). The **mean length of a generation** uses the net maternity function instead, $T = \sum_a a\,\varphi(a)\big/\sum_a \varphi(a)$ with $\varphi(a) = f(a)\ell(a)/(1+\mathrm{SRB})$: the mean age at which women bear their daughters, after mortality has thinned the mothers. $T$ is a little lower than $\bar a_f$ because survival declines with age, and for a population with reproduction rate $R_0 = \mathrm{NRR}$ the intrinsic growth rate $r$ solves $\int e^{-ra}\varphi(a)\,da = 1$ and satisfies $r \approx \ln R_0 / T$.`,
      idea: String.raw`Growth per generation is $R_0$, and a generation lasts about $T$ years, so growth per year is about $\ln R_0 / T$; the exact equation is the Euler–Lotka equation of Chapter 6. Postponing births raises $T$ without changing the number of daughters (if $R_0$ is held fixed), so the same net reproduction rate gives slower growth, and a population that is above replacement but with late childbearing grows slowly. Late births also meet more mortality, which is the second, smaller way timing enters (mathbio 4.5 for the generation time of a species).`,
      caption: String.raw`Blue: the fertility schedule $f(a)$; green: the net maternity function $\varphi(a)$; vertical lines mark their centres of mass $\bar a_f$ and $T$. Slide **postpone births** to shift the schedule later by that many years. With the toggle on, the schedule is rescaled to keep $R_0$ fixed so that only timing changes. Right: the exact growth rate $r$ from the Euler–Lotka equation as a function of the shift, with the approximation $\ln R_0/T$ as a dashed line.`,
      deps: ['demo-4.1', 'mathbio-4.5'],
      refs: ['PHG ch. 5'],
      tags: ['generation length', 'timing'],
      scope: String.raw`Built from UN WPP 2024 five-year schedules and female life tables (years with tables: 1950, 1970, 1990, 2010, 2023). Shifting a schedule later is a thought experiment; real postponement also changes its shape (4.6).`,
      links: { data: 'https://population.un.org/wpp/' },
      viz(v) {
        const co = v.select('country', cOpts(), 'NGA');
        const yr = v.select('life table year', SEXY.map((y) => ({ value: String(y), label: String(y) })), '1990');
        const sh = v.slider('postpone births by (years)', -6, 10, 4, { step: 0.25 });
        const hold = v.toggle('hold R₀ fixed', true);
        const s = v.stage({ x: [10, 60], y: [0, 0.1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'per woman-year', height: 360, title: 'Fertility f(a) and net maternity φ(a)' });
        const t = v.stage({ x: [-6, 10], y: [-0.02, 0.03], axes: 'box', gutter: true, xlabel: 'postponement (years)', ylabel: 'growth rate r per year', height: 360, title: 'Later births, slower growth' });
        const AG = []; for (let a = 8; a <= 65; a += 0.25) AG.push(a);
        let cache = null;
        const key = () => co.value + yr.value;
        const model = (c, y, shift, holdR, base) => {
          const f = asfr(c, y), srb = indAt(c, 'srb', y) / 100, sv = femSurv(c, y);
          const fa = AG.map((a) => lerpAt(FMID, f, a - shift)), ph = AG.map((a, i) => fa[i] * lAtAge(sv.l, a) / (1 + srb));
          let R0 = sum(ph) * 0.25, kap = 1;
          if (holdR && base) { kap = base / R0; R0 = base; }
          const phs = ph.map((x) => x * kap), fas = fa.map((x) => x * kap);
          const m1 = sum(AG.map((a, i) => a * fas[i])) / sum(fas), T = sum(AG.map((a, i) => a * phs[i])) / sum(phs);
          const g = (r) => sum(AG.map((a, i) => Math.exp(-r * a) * phs[i])) * 0.25;
          let lo = -0.12, hi = 0.12; for (let it = 0; it < 50; it++) { const mid = (lo + hi) / 2; if (g(mid) > 1) lo = mid; else hi = mid; }
          return { f: fas, ph: phs, R0, m1, T, r: (lo + hi) / 2, approx: Math.log(R0) / T };
        };
        let R = null;
        v.render(() => {
          const c = co.value, y = +yr.value;
          const base = model(c, y, 0, false).R0;
          const M = model(c, y, sh.value, hold.value, base);
          s.setView([10, 60], [0, Math.max(...M.f, 0.05) * 1.2]);
          s.path(AG.map((a, i) => [a, M.f[i]]), { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.12, base: 0 });
          s.path(AG.map((a, i) => [a, M.ph[i]]), { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.18, base: 0 });
          s.vline(M.m1, { color: 'accent', dash: true, width: 1.6 });
          s.vline(M.T, { color: 'green', dash: true, width: 1.6 });
          s.text('mean age ' + v.fix(M.m1, 1), M.m1 - 0.6, Math.max(...M.f, 0.05) * 1.12, { size: 11, color: 'accent', align: 'right' });
          s.text('T = ' + v.fix(M.T, 1), M.T + 0.6, Math.max(...M.f, 0.05) * 1.04, { size: 11, color: 'green', align: 'left' });
          const rs = [], as = [];
          for (let d = -6; d <= 10.001; d += 0.5) { const m = model(c, y, d, hold.value, base); rs.push([d, m.r]); as.push([d, m.approx]); }
          const lo = Math.min(...rs.map((p) => p[1]), 0), hi = Math.max(...rs.map((p) => p[1]), 0.001);
          t.setView([-6, 10], [lo - 0.004, hi + 0.004]);
          t.hline(0, { color: 'muted', alpha: 0.6 });
          t.path(as, { color: 'orange', width: 2, dash: true });
          t.path(rs, { color: 'purple', width: 2.6 });
          t.dot(sh.value, M.r, { color: 'gold', r: 6 });
          R = { ...M, c, y };
        });
        v.legend([['accent', 'f(a)'], ['green', 'φ(a)'], ['purple', 'r exact'], ['orange', 'ln R₀ / T', { dash: true }]]);
        v.readout(() => `${CNAME[R.c]} ${R.y}, births shifted ${fx(sh.value, 2)} years: mean age at childbearing **${v.fix(R.m1, 1)}**, generation length $T$ = **${v.fix(R.T, 1)}** years, $R_0$ = ${v.fix(R.R0, 3)}.\nGrowth rate: exact $r$ = **${v.fix(R.r * 100, 2)}%** per year; $\\ln R_0/T$ = ${v.fix(R.approx * 100, 2)}%. ${hold.value ? 'With $R_0$ held fixed, a longer generation alone slows growth.' : 'Without rescaling, later births also lose more daughters to mortality.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'The tempo effect (Bongaarts–Feeney)',
      statement: String.raw`When women postpone childbearing, the period total fertility rate falls below the completed fertility of the cohorts living through the period, even if every cohort ends with the same number of children. If the mean age at childbearing rises by $r$ years per calendar year, the period TFR is depressed by the factor $(1-r)$ for births of a given order; Bongaarts and Feeney proposed the **tempo-adjusted** rate $\mathrm{TFR}^{*} = \mathrm{TFR}/(1-r)$, computed order by order, as an estimate of what the TFR would be without the change in timing. The adjusted rate separates **tempo** (when) from **quantum** (how many); it assumes the shape of the schedule is unchanged by postponement.`,
      idea: String.raw`A cohort's births are spread over its reproductive life, but a period gathers one slice of ages from each of many cohorts. If successive cohorts have their births later, the slice of the period is made up of cohorts that are still postponing, and each age group contributes fewer births than it would have in a stable calendar. Formally, if the cohort schedule just slides along the age axis at speed $r$ per birth cohort, period rates are the cohort schedule squeezed by a factor $1/(1+r)$ in age, and the area under them is smaller by exactly that factor. Using the life-table analogy of 2.7, the period measure is the rate of a synthetic cohort, which differs from real cohorts whenever the rates move.`,
      caption: String.raw`A model: every woman has exactly 2 children, with ages at birth spread around a mean of 27 (standard deviation 5), and from the cohort of the start year each cohort is $r$ years later than the last for the duration you set. The orange line is the period TFR, which dips while postponement lasts and rebounds when it stops; the dashed green line is the cohort total (2). Purple is the adjusted TFR computed only from the period schedules. The adjustment is exact only when the schedule slides at a steady speed; where postponement starts, stops or speeds up it wobbles around 2. The spread slider lets the schedule get wider as it moves, which breaks the assumption behind the adjustment altogether.`,
      deps: ['demo-4.2', 'demo-1.5'],
      refs: ['PHG ch. 5'],
      tags: ['tempo', 'period vs cohort'],
      credit: 'Bongaarts & Feeney, 1998',
      scope: String.raw`This is a one-order model (a single birth order with a fixed normal-shaped schedule), not a reconstruction of any country. The published method adjusts each birth order separately, using order-specific births and women, then sums; with a widening schedule the single-order formula no longer returns the true cohort rate.`,
      links: { doi: 'https://doi.org/10.2307/2807974' },
      viz(v) {
        const rate = v.slider('postponement, years per cohort', 0, 0.3, 0.15, { step: 0.01 });
        const dur = v.slider('cohorts postponing', 5, 30, 20, { int: true });
        const spread = v.slider('widening: sd per cohort', 0, 0.1, 0, { step: 0.005 });
        const c0 = 1960, m0 = 27, sd0 = 5;
        const s = v.stage({ x: [1975, 2045], y: [1.4, 2.4], axes: 'box', gutter: true, xlabel: 'calendar year', ylabel: 'total fertility rate', height: 380, xticks: yearTicks(1980, 2040, 10), title: 'Period and cohort fertility' });
        const t = v.stage({ x: [1975, 2045], y: [26, 32], axes: 'box', gutter: true, xlabel: 'calendar year', ylabel: 'period mean age at birth', height: 380, xticks: yearTicks(1980, 2040, 10), title: 'The period mean age rises' });
        const erf = v.M.erf, Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
        const X0 = 14, X1 = 52, dx = 0.5;
        const sim = () => {
          const r = rate.value, D = dur.value, k = spread.value, out = [];
          for (let ty = 1970; ty <= 2051; ty++) {
            let tf = 0, mx = 0;
            for (let x = X0 + dx / 2; x < X1; x += dx) {
              const c = ty - x, u = clamp(c - c0, 0, D), m = m0 + r * u, sd = sd0 + k * u;
              const z = (x - m) / sd, Z = Phi((X1 - m) / sd) - Phi((X0 - m) / sd);
              const d = 2 * Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI)) / Z;
              tf += d * dx; mx += x * d * dx;
            }
            out.push({ y: ty, tfr: tf, mac: mx / tf });
          }
          return out;
        };
        let R = null;
        v.render(() => {
          const S = sim();
          const adj = [];
          for (let i = 1; i < S.length - 1; i++) { const rp = (S[i + 1].mac - S[i - 1].mac) / 2; adj.push([S[i].y, S[i].tfr / (1 - rp)]); }
          s.hline(2, { color: 'green', dash: true, width: 1.8 });
          s.path(S.map((p) => [p.y, p.tfr]), { color: 'orange', width: 2.8 });
          s.path(adj, { color: 'purple', width: 2.2 });
          t.path(S.map((p) => [p.y, p.mac]), { color: 'orange', width: 2.8 });
          const mn = Math.min(...S.map((p) => p.tfr)), im = S.findIndex((p) => p.tfr === mn);
          s.dot(S[im].y, mn, { color: 'red', r: 6 });
          const a = adj.find((p) => p[0] === S[im].y);
          const worst = Math.max(...adj.map((p) => Math.abs(p[1] - 2)));
          R = { mn, y: S[im].y, adjAt: a ? a[1] : NaN, worst, macEnd: S[S.length - 1].mac };
        });
        v.legend([['orange', 'period TFR'], ['purple', 'tempo-adjusted TFR*'], ['green', 'cohort total = 2', { dash: true }]]);
        v.readout(() => `Every cohort has exactly 2 children, yet the period TFR falls to **${v.fix(R.mn, 2)}** in ${R.y} while the mean age at birth rises. The adjusted rate there is ${v.fix(R.adjAt, 2)}; its largest departure from the true 2 is ${v.fix(R.worst, 3)}${spread.value > 0 ? ' (the widening schedule violates the shape assumption)' : ''}.\nPeriod mean age ends at ${v.fix(R.macEnd, 1)} against ${m0} before; with $r$ = ${v.fix(rate.value, 2)} per cohort the period TFR is pulled down by the factor $1/(1+r)$ = ${v.fix(1 / (1 + rate.value), 3)}.`);
      },
    },
  ],
};
const FYEARSx = Array.from({ length: FY1 - FY0 + 1 }, (_, i) => FY0 + i);
