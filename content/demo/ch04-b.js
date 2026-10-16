// Demography — Chapter 4: Fertility and reproduction (part b: 4.7–4.12)
import { clamp, sum, int, CNAME, SEXY, AGE22, NS22, FAGES, FMID, FY0, FY1, asfr, women, indAt, ind, tfrOf, HUT, lxSex, LxSex, SRBNAME, stepPath, cOpts } from './ch04.shared.js';

const yearTicks = (a = 1950, b = 2020, d = 10) => { const t = []; for (let y = a; y <= b; y += d) t.push([y, String(y)]); return t; };
/** Share ever married at age a: a logistic in age with mid-point A and ceiling E (an illustrative nuptiality curve, not a fitted model). */
const married = (a, A, E) => E / (1 + Math.exp(-(a - A) / 2.2));

export default {
  collection: 'demo',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Proximate determinants of fertility (Bongaarts)',
      statement: String.raw`Bongaarts's model writes the total fertility rate as a biological maximum multiplied by indices between 0 and 1, each describing how one proximate determinant cuts fertility: $\mathrm{TFR} = C_m\,C_c\,C_i\,C_a\,\mathrm{TF}$. $\mathrm{TF}\approx 15$ births is the total fecundity of women who are always in union, never use contraception and have no postpartum infecundability. Marriage: $C_m = \sum m(a) f_m(a)\big/\sum f_m(a)$, the fertility-weighted share of women in union. Contraception: $C_c = 1 - 1.08\,u\,e$ for prevalence $u$ among women in union and average effectiveness $e$. Postpartum infecundability: $C_i = 20/(18.5+i)$ for $i$ months of infecundability after a birth. Induced abortion: $C_a = \mathrm{TFR}/(\mathrm{TFR} + b\,\mathrm{TAR})$ with $b = 0.4(1+u)$ births averted per abortion and TAR the total abortion rate. Putting $C_a$ in the product and solving gives $\mathrm{TFR} = \mathrm{TF}\,C_mC_cC_i - b\,\mathrm{TAR}$.`,
      idea: String.raw`Any variation in fertility between populations must work through a few biological and behavioural channels, the proximate determinants of Davis and Blake; Bongaarts reduced them to four that matter most and made each an interchangeable multiplicative factor, so that a country's fertility can be decomposed by taking logarithms: the shortfall from the maximum is the sum of the four logarithmic effects. Marriage enters because it fixes the share of women exposed to intercourse at each age, weighted by the age pattern of natural fertility (4.8). The constants (the 1.08 for sterility overlap, the 18.5 and 20 months of an average birth interval, 0.4 births averted) are empirical, which makes the model a bookkeeping device, not a law.`,
      caption: String.raw`Left: start from about 15 births and apply the indices in turn; each red segment is the number of births forgone through that channel, and the column on the right is the resulting TFR. Move the sliders for marriage (average age at marriage and share who ever marry), contraception, breastfeeding-driven infecundability and abortion, or use the three illustrative settings. Right: where $C_m$ comes from, the share married by age weighted by Hutterite marital fertility (the weights).`,
      deps: ['demo-4.2'],
      refs: ['PHG ch. 5'],
      tags: ['proximate determinants', 'marriage', 'contraception'],
      credit: 'Bongaarts, 1978',
      scope: String.raw`The aggregate model: the formulas are those of the original paper (as summarised in Bongaarts's 2015 revision, which also gives the age-specific and updated versions). The marriage curve here is an illustrative logistic, and the three presets are illustrative parameter sets, not estimates for any named population. The model describes a period TFR and ignores differences in the pattern of ages.`,
      links: { doi: 'https://doi.org/10.2307/1972149' },
      viz(v) {
        const A = v.slider('mean age at marriage', 15, 35, 21, { step: 0.5 });
        const E = v.slider('share ever married', 0.5, 1, 0.95, { step: 0.01 });
        const u = v.slider('contraceptive use u (married women)', 0, 0.9, 0.3, { step: 0.01 });
        const e = v.slider('effectiveness e', 0.5, 1, 0.9, { step: 0.01 });
        const im = v.slider('postpartum infecundability i (months)', 1, 25, 12, { step: 0.5 });
        const ta = v.slider('total abortion rate TAR', 0, 3, 0.2, { step: 0.05 });
        const preset = (a, ee, uu, eff, ii, tt) => () => { A.set(a); E.set(ee); u.set(uu); e.set(eff); im.set(ii); ta.set(tt); };
        v.button('Early marriage, no contraception', preset(18, 0.99, 0.02, 0.8, 18, 0));
        v.button('Mid-transition', preset(21, 0.95, 0.4, 0.9, 12, 0.2));
        v.button('Late marriage, contraception', preset(29, 0.8, 0.7, 0.95, 3, 0.4));
        const TF = 15.3;
        const s = v.stage({ x: [0, 5], y: [0, 16], axes: 'box', gutter: true, ylabel: 'births per woman', height: 380, title: 'From total fecundity to the TFR', xticks: [[0.5, 'TF'], [1.5, '×Cm'], [2.5, '×Cc'], [3.5, '×Ci'], [4.5, '−abort.']] });
        const t = v.stage({ x: [12.5, 52.5], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'share married / weight', height: 380, title: 'Where the marriage index comes from' });
        let R = null;
        v.render(() => {
          const m = FMID.map((a) => married(a, A.value, E.value));
          const wt = HUT, sw = sum(wt);
          const Cm = sum(m.map((x, i) => x * wt[i])) / sw;
          const Cc = 1 - 1.08 * u.value * e.value, Ci = 20 / (18.5 + im.value);
          const b = 0.4 * (1 + u.value);
          const x1 = TF * Cm, x2 = x1 * Cc, x3 = x2 * Ci, tfr = Math.max(0, x3 - b * ta.value), Ca = tfr + b * ta.value > 0 ? tfr / (tfr + b * ta.value) : 1;
          const levels = [TF, x1, x2, x3, tfr];
          levels.forEach((h, i) => {
            if (i === 0) s.rect(0.1, 0, 0.9, h, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 });
            else { s.rect(i + 0.1, 0, i + 0.9, h, { fill: i === 4 ? 'green' : 'accent', fillAlpha: i === 4 ? 0.6 : 0.3, color: i === 4 ? 'green' : 'accent', width: 1.5 }); s.rect(i + 0.1, h, i + 0.9, levels[i - 1], { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1 }); if (levels[i - 1] - h > 0.4) s.text('−' + v.fix(levels[i - 1] - h, 1), i + 0.5, (h + levels[i - 1]) / 2, { size: 12, color: 'ink', align: 'center', baseline: 'middle', plate: true }); }
            s.text(v.fix(h, 1), i + 0.5, h + 0.2, { size: 12, color: 'ink', align: 'center', baseline: 'bottom' });
          });
          s.hline(2.1, { color: 'green', dash: true, width: 1.2 });
          const mx = Math.max(...wt) ;
          FAGES.forEach((a, i) => { if (wt[i] > 0) t.rect(a, 0, a + 5, wt[i] / mx * 0.5, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1 }); });
          t.path(FMID.map((a, i) => [a, m[i]]), { color: 'accent', width: 2.6 });
          t.dots(FMID.map((a, i) => [a, m[i]]), { r: 3.5, color: 'accent' });
          t.fn((a) => married(a, A.value, E.value), { domain: [12.5, 52.5], color: 'accent', width: 1.2, alpha: 0.5 });
          R = { Cm, Cc, Ci, Ca, tfr, b };
        });
        v.legend([['accent', 'share in union m(a)'], ['orange', 'Hutterite weights f_m(a) (scaled)', { area: true }], ['red', 'births forgone', { area: true }]]);
        v.readout(() => `$C_m$ = ${v.fix(R.Cm, 2)}, $C_c$ = ${v.fix(R.Cc, 2)}, $C_i$ = ${v.fix(R.Ci, 2)}, $C_a$ = ${v.fix(R.Ca, 2)} (abortion averts $b$ = ${v.fix(R.b, 2)} births each).\nTFR = ${TF} × ${v.fix(R.Cm, 2)} × ${v.fix(R.Cc, 2)} × ${v.fix(R.Ci, 2)} × ${v.fix(R.Ca, 2)} = **${v.fix(R.tfr, 2)}** (the same as $\\mathrm{TF}\\,C_mC_cC_i - b\\,\\mathrm{TAR}$).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Natural versus controlled fertility (Coale–Trussell)',
      statement: String.raw`In a population practising no deliberate limitation, marital fertility follows a characteristic age pattern $n(a)$ (**natural fertility**) that falls with age through declining fecundity. Coale and Trussell's model writes observed marital fertility at age $a$ as $r(a) = M\,n(a)\,\exp\bigl(m\,v(a)\bigr)$. The parameter $M$ scales the overall level relative to the standard; $v(a)$ is a standard pattern of departure from natural fertility that becomes more negative with age, because couples who control by **stopping** once they reach a desired family size cut fertility most at older ages; $m$ measures how far the population has gone in that direction ($m = 0$ is natural fertility). Taking logs, $\ln\bigl(r(a)/n(a)\bigr) = \ln M + m\,v(a)$ is a straight line in $v$, so $M$ and $m$ are read off a regression.`,
      idea: String.raw`Without parity-dependent control, the chance of a birth depends mostly on a woman's age, so schedules from different natural-fertility populations are close to one shape up to a scale factor. Birth control that responds to the number of children already born (stopping) removes births mainly at older ages, where women are further along in their families, and so tilts the schedule; the log ratio to natural fertility declines roughly in a pattern that is the same across populations, which is what the standard $v(a)$ encodes. The point of the model is that a single number, $m$, measures the degree of control from the age pattern alone, using no data on contraception.`,
      caption: String.raw`Choose a country and year. The model is fitted to the age-specific rates of ages 20–49 (blue bars) by a straight line of $\ln(r/n)$ against $v$ (right panel). The dashed curve is natural fertility at the fitted level, $M\,n(a)$, and the solid curve is the fit with control. Switch to **manual** to set $M$ and $m$ yourself and see how stopping bends the older ages down. Because these are rates for all women (not marital rates), a population where many women are unmarried shows a low $M$.`,
      deps: ['demo-4.1'],
      refs: ['PHG ch. 9'],
      tags: ['natural fertility', 'fertility control'],
      credit: 'Coale & Trussell, 1974',
      verify: true,
      scope: String.raw`The model form $r(a)=M\,n(a)\,e^{m v(a)}$ is the published one. The standard patterns used here are **reconstructions**: $n(a)$ is taken proportional to the Hutterite marital schedule (the 1920s benchmark of Coale's indices, 4.9) and $v(a)$ is a stylised decreasing pattern of about the right size, not the published Coale–Trussell tables. So $M$ and $m$ computed here are illustrative and are not comparable with published estimates. They are fitted to overall age-specific rates (WPP 2024) rather than the marital fertility the model describes.`,
      links: { doi: 'https://doi.org/10.2307/2733910' },
      viz(v) {
        const co = v.select('country', cOpts(), 'NGA');
        const yr = v.slider('year', FY0, FY1, 1990, { int: true });
        const man = v.toggle('manual M and m', false);
        const Ms = v.slider('M', 0.1, 1.2, 0.7, { step: 0.01 });
        const ms = v.slider('m (control)', 0, 4, 0.5, { step: 0.02 });
        const NAT = HUT.slice(2, 8), VST = [0, -0.279, -0.667, -1.042, -1.414, -1.671];
        const AG6 = FMID.slice(2, 8);
        const s = v.stage({ x: [10, 55], y: [0, 400], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'births per 1 000 women', height: 360, title: 'Observed rates and the model' });
        const t = v.stage({ x: [-2, 0.3], y: [-4, 0.5], axes: 'box', gutter: true, xlabel: 'v(a)', ylabel: 'ln( r(a) / n(a) )', height: 360, title: 'The log-linear fit' });
        let R = null;
        v.render(() => {
          const f = asfr(co.value, yr.value);
          const pts = f.slice(2, 8).map((x, i) => ({ v: VST[i], y: x > 0 ? Math.log(x / NAT[i]) : NaN, a: AG6[i], f: x })).filter((p) => isFinite(p.y));
          const n = pts.length, mv = sum(pts.map((p) => p.v)) / n, my = sum(pts.map((p) => p.y)) / n;
          const sxx = sum(pts.map((p) => (p.v - mv) ** 2)), sxy = sum(pts.map((p) => (p.v - mv) * (p.y - my))), syy = sum(pts.map((p) => (p.y - my) ** 2));
          const mfit = sxx > 0 ? sxy / sxx : 0, lnM = my - mfit * mv, r2 = syy > 0 ? (sxy * sxy) / (sxx * syy) : 1;
          const M = man.value ? Ms.value : Math.exp(lnM), mm = man.value ? ms.value : mfit;
          if (!man.value) { Ms.set(clamp(M, 0.1, 1.2)); ms.set(clamp(mm, 0, 4)); }
          s.setView([10, 55], [0, Math.max(...f.map((x) => x * 1000), M * 550, 100) * 1.15]);
          FAGES.forEach((a, i) => s.rect(a, 0, a + 5, f[i] * 1000, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.5 }));
          s.path(AG6.map((a, i) => [a, M * NAT[i] * 1000]), { color: 'muted', width: 2.2, dash: true });
          s.path(AG6.map((a, i) => [a, M * NAT[i] * Math.exp(mm * VST[i]) * 1000]), { color: 'green', width: 2.8 });
          s.dots(AG6.map((a, i) => [a, M * NAT[i] * Math.exp(mm * VST[i]) * 1000]), { r: 4, color: 'green' });
          t.hline(0, { color: 'muted', alpha: 0.5 });
          t.line(-1.9, Math.log(M) + mm * -1.9, 0.1, Math.log(M) + mm * 0.1, { color: 'green', width: 2.4 });
          pts.forEach((p) => t.dot(p.v, p.y, { color: 'accent', r: 5, label: (p.a - 2.5) + '–' + (p.a + 1.5), labelPos: 'n' }));
          R = { M, mm, r2, nat: 5 * M * sum(NAT) , obs: 5 * sum(f.slice(2, 8)), ctl: 5 * sum(AG6.map((a, i) => M * NAT[i] * Math.exp(mm * VST[i]))) };
        });
        v.legend([['accent', 'observed rates', { area: true }], ['muted', 'natural fertility M·n(a)', { dash: true }], ['green', 'with control']]);
        v.readout(() => `${man.value ? 'Manual' : 'Fitted'}: $M$ = **${v.fix(R.M, 2)}**, $m$ = **${v.fix(R.mm, 2)}**${man.value ? '' : ` ($R^2$ = ${v.fix(R.r2, 2)})`}.\nTFR from ages 20–49: natural $5M\\sum n$ = ${v.fix(R.nat, 2)}; with control = **${v.fix(R.ctl, 2)}**${man.value ? '' : `; observed ${v.fix(R.obs, 2)}`}. The gap is what stopping removes.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Princeton fertility indices (I_f, I_g, I_m)',
      statement: String.raw`The Princeton indices measure fertility against the **Hutterite schedule** of marital fertility $F^H_a$, the highest recorded for a large population (the Hutterites of the 1920s). With $B$ births, $W_a$ women and $M_a$ married women in age group $a$: the **overall index** is $I_f = B\big/\sum_a W_a F^H_a$; the **marital index** is $I_g = B^{\text{marital}}\big/\sum_a M_a F^H_a$; and the **proportion-married index** is $I_m = \sum_a M_a F^H_a\big/\sum_a W_a F^H_a$. If all births are marital, $I_f = I_g\,I_m$; in general $I_f = I_g I_m + I_h(1-I_m)$ with $I_h$ the same ratio for nonmarital births among unmarried women.`,
      idea: String.raw`By comparing a population's births with what the same women would have under a fixed high schedule, the indices remove the age structure, so they can be compared across times and places. Because $I_f$ is a product of how many women are married (weighted by when marital fertility is highest) and how fertile married women are, taking logs splits a decline in overall fertility into a marriage part and a marital part. In the Princeton European Fertility Project the marital index turned out to be the one that fell as the fertility transition spread across 19th-century European provinces.`,
      caption: String.raw`Blue bars: observed rates of the chosen country and year. Grey: the Hutterite marital schedule applied to every woman (its total is the denominator of $I_f$). Orange: the same schedule applied only to married women, for a nuptiality curve you set with the age at marriage and the share ever married. The bars on the right are the three indices: $I_f$ comes from the data (births and women of the UN estimates), while $I_m$ and $I_g$ depend on the nuptiality curve you assume; change it and watch $I_m$ and $I_g$ trade off while $I_f$ stays put.`,
      deps: ['demo-4.1'],
      refs: ['PHG ch. 5'],
      tags: ['Hutterite', 'fertility indices', 'marriage'],
      credit: 'Coale and the Princeton European Fertility Project, 1960s–1980s',
      verify: true,
      scope: String.raw`$I_f$ is computed from the UN WPP 2024 estimates of births and women by age (ages 15–49); the shares married are an illustrative logistic curve set by you, not census data, so $I_m$ and $I_g$ show how the decomposition works and are not estimates for these countries. The Hutterite rates for 20–49 are the standard values and the 15–19 value of 0.300 is quoted from memory.`,
      viz(v) {
        const co = v.select('country', cOpts(), 'FRA');
        const yr = v.slider('year', FY0, FY1, 1950, { int: true });
        const A = v.slider('mean age at marriage', 15, 32, 25, { step: 0.5 });
        const E = v.slider('share ever married', 0.4, 1, 0.9, { step: 0.01 });
        const h = v.slider('share of births nonmarital', 0, 0.6, 0, { step: 0.01 });
        const s = v.stage({ x: [10, 55], y: [0, 600], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'births per 1 000 women', height: 360, title: 'Observed rates against the Hutterite benchmark' });
        const t = v.stage({ x: [0, 4], y: [0, 1.1], axes: 'box', gutter: true, ylabel: 'index', height: 360, title: 'The indices', xticks: [[0.5, 'I_f'], [1.5, 'I_g'], [2.5, 'I_m'], [3.5, 'I_g · I_m']] });
        let R = null;
        v.render(() => {
          const c = co.value, y = yr.value, f = asfr(c, y), W = women(c, y);
          const m = FMID.map((a) => married(a, A.value, E.value));
          const B = sum(f.map((x, i) => x * W[i])), H = sum(HUT.map((x, i) => x * W[i])), Hm = sum(HUT.map((x, i) => x * W[i] * m[i])), Hu = H - Hm;
          const If = B / H, Im = Hm / H, Ig = (1 - h.value) * B / Hm, Ih = Hu > 0 ? h.value * B / Hu : 0;
          s.setView([10, 55], [0, Math.max(...f.map((x) => x * 1000), ...HUT.map((x) => x * 1000)) * 1.1]);
          FAGES.forEach((a, i) => { s.rect(a, 0, a + 5, f[i] * 1000, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.5 }); });
          s.path(stepPath(HUT, 1000), { color: 'muted', width: 2, dash: true });
          s.path(stepPath(HUT.map((x, i) => x * m[i]), 1000), { color: 'orange', width: 2.6 });
          const bars = [[If, 'accent'], [Ig, 'green'], [Im, 'orange'], [Ig * Im, 'purple']];
          bars.forEach(([val, col], i) => { t.rect(i + 0.15, 0, i + 0.85, val, { fill: col, fillAlpha: 0.45, color: col, width: 1.5 }); t.text(v.fix(val, 3), i + 0.5, val + 0.02, { size: 12, color: 'ink', align: 'center', baseline: 'bottom' }); });
          t.hline(1, { color: 'muted', dash: true, alpha: 0.6 });
          R = { If, Ig, Im, Ih, B, tfr: tfrOf(f), prod: Ig * Im + Ih * (1 - Im) };
        });
        v.legend([['accent', 'observed', { area: true }], ['muted', 'Hutterite, all women', { dash: true }], ['orange', 'Hutterite, married women only']]);
        v.readout(() => `$I_f$ = **${v.fix(R.If, 3)}** (births ${int(R.B)} thousand; TFR ${v.fix(R.tfr, 2)}).  For the nuptiality curve you set: $I_m$ = **${v.fix(R.Im, 3)}**, $I_g$ = **${v.fix(R.Ig, 3)}**${R.Ig > 1 ? ' (above 1: more births than the Hutterite maximum implies, so this marriage curve is too low for these data)' : ''}.\n$I_g I_m + I_h(1-I_m)$ = ${v.fix(R.prod, 3)} = $I_f$ (nonmarital index $I_h$ = ${v.fix(R.Ih, 3)}).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Paradox',
      name: 'Children come from larger families than women have',
      statement: String.raw`Let a woman's number of children be a random variable $K$ with mean $\mu$ and variance $\sigma^2$ (including women with none). The average family size **of women** is $\mu$, but a child chosen at random comes from a family whose size has the length-biased distribution $q_k = k\,p_k/\mu$, with mean $E[K^2]/\mu = \mu + \sigma^2/\mu$ (Preston, 1976). For $\sigma^2 > 0$ this exceeds $\mu$; for a Poisson number of births it is $\mu+1$. So the typical child has more siblings (counting itself) than the average woman has children, even though nothing is wrong with either number.`,
      idea: String.raw`It is the inspection paradox: sampling children rather than mothers gives each mother weight proportional to her number of children, so large families are over-represented and childless women vanish from the sample. The mean of the weighted distribution is $\sum k\cdot k p_k/\mu = E[K^2]/\mu$, and $E[K^2] = \sigma^2 + \mu^2$ turns it into $\mu + \sigma^2/\mu$. The more unequal the family sizes, the larger the gap; and the same arithmetic explains why the average class size experienced by students, or the crowd density seen by a person, exceeds the average.`,
      caption: String.raw`Blue bars: the distribution of family sizes among women (mean $\mu$). Orange: the distribution among children, $k p_k/\mu$. Set the mean and the dispersion (variance to mean ratio) and watch the orange mean exceed the blue by exactly $\sigma^2/\mu$. Right: a random sample of 24 women (one row each); the gold ring marks a child chosen at random from all of their children, whose family is highlighted. Press **Resample** to draw again; over many draws the chosen family is larger than the average row.`,
      deps: ['demo-4.2'],
      refs: ['PHG ch. 5'],
      tags: ['inspection paradox', 'sampling'],
      credit: 'Preston, 1976',
      scope: String.raw`Family sizes follow a negative binomial distribution (a Poisson when the variance equals the mean), a model chosen for its simple moments, not fitted to any survey. The identity is exact for any distribution; it concerns the number of children ever born to the woman who is the mother of the sampled child.`,
      links: { doi: 'https://doi.org/10.2307/2060423' },
      viz(v) {
        const mu = v.slider('mean children per woman μ', 1, 6, 2.5, { step: 0.1 });
        const ph = v.select('variance / mean', [{ value: '1', label: 'Poisson (1)' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '5', label: '5' }], '2');
        let seed = 7;
        v.button('Resample', () => { seed += 1; });
        const s = v.stage({ x: [-0.7, 16], y: [0, 0.4], axes: 'box', gutter: true, xlabel: 'family size k', ylabel: 'probability', height: 360, title: 'Women and their children' });
        const t = v.stage({ x: [-0.5, 14.5], y: [0, 25], axes: false, height: 360, title: 'A sample of 24 women' });
        const K = 40;
        const pmf = (m, f) => {
          const out = [];
          if (f <= 1.0001) for (let k = 0; k <= K; k++) out.push(Math.exp(-m + k * Math.log(m) - v.M.lgamma(k + 1)));
          else { const r = m / (f - 1), q = m / (m + r); for (let k = 0; k <= K; k++) out.push(Math.exp(v.M.lgamma(k + r) - v.M.lgamma(k + 1) - v.M.lgamma(r) + r * Math.log(1 - q) + k * Math.log(q))); }
          return out;
        };
        let R = null;
        v.render(() => {
          const f = +ph.value, p = pmf(mu.value, f), mean = sum(p.map((x, k) => k * x)), var_ = sum(p.map((x, k) => k * k * x)) - mean * mean;
          const q = p.map((x, k) => k * x / mean), meanQ = sum(q.map((x, k) => k * x));
          const pm = Math.max(...p, ...q) * 1.15;
          s.setView([-0.7, 16], [0, pm]);
          for (let k = 0; k <= 15; k++) { s.rect(k - 0.42, 0, k, p[k], { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 }); s.rect(k, 0, k + 0.42, q[k], { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1 }); }
          s.vline(mean, { color: 'accent', dash: true, width: 2 });
          s.vline(meanQ, { color: 'orange', dash: true, width: 2 });
          s.measure(mean, pm * 0.93, meanQ, pm * 0.93, '+σ²/μ');
          // a sample of 24 women
          const rng = v.rng(seed * 101 + Math.round(mu.value * 10) + f);
          const cdf = []; let acc = 0; for (let k = 0; k <= K; k++) { acc += p[k]; cdf.push(acc); }
          const draw = () => { const u = rng() * acc; let k = 0; while (k < K && cdf[k] < u) k++; return k; };
          const fam = Array.from({ length: 24 }, draw);
          const total = sum(fam);
          let pick = Math.floor(rng() * Math.max(total, 1)), chosen = 0, within = 0;
          for (let i = 0; i < 24; i++) { if (pick < fam[i]) { chosen = i; within = pick; break; } pick -= fam[i]; }
          fam.forEach((k, i) => {
            const y = 24 - i;
            if (i === chosen && total > 0) t.hband(y - 0.45, y + 0.45, { color: 'gold', alpha: 0.2 });
            for (let j = 0; j < Math.min(k, 14); j++) t.dot(j + 0.5, y, { r: 5, color: i === chosen ? 'orange' : 'accent' });
            if (k > 14) t.text('+' + (k - 14), 14.2, y, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
            if (k === 0) t.text('0', 0.2, y, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          });
          if (total > 0) t.dot(Math.min(within, 13) + 0.5, 24 - chosen, { r: 9, hollow: true, color: 'gold' });
          R = { mean, var_, meanQ, fam, chosen, avg: total / 24, total };
        });
        v.legend([['accent', 'women: family size k', { area: true }], ['orange', 'children: size of own family', { area: true }]]);
        v.readout(() => `Women: mean $\\mu$ = **${v.fix(R.mean, 2)}**, variance ${v.fix(R.var_, 2)}. Children: mean = **${v.fix(R.meanQ, 2)}** = $\\mu + \\sigma^2/\\mu$ = ${v.fix(R.mean + R.var_ / R.mean, 2)}.\nSample of 24 women: average family ${v.fix(R.avg, 2)}; the child drawn at random has ${R.fam[R.chosen]} ${R.fam[R.chosen] === 1 ? 'child' : 'children'} in its family.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Human sex ratios from birth to old age',
      statement: String.raw`More boys than girls are born, about **105 boys per 100 girls** in most populations (the sex ratio at birth, SRB). Because male mortality is higher at nearly every age, the ratio of males to females falls with age, passing 100 somewhere in the reproductive years or later depending on the mortality level, and ends far below 100 at the oldest ages, where women are a large majority. For a cohort closed to migration, the males per female at age $x$ is $\mathrm{SRB}\cdot\ell^m(x)/\ell^f(x)$, the birth ratio times the ratio of the two survivorship functions. Fisher's argument explains why the birth ratio sits close to equality in the first place: it is the evolutionary equilibrium of parental investment (see popgen 11.1).`,
      idea: String.raw`Fisher's argument balances parental investment in the two sexes up to the end of parental care, not the numbers at birth, and boys' higher mortality in childhood means a modest surplus of boys at birth is consistent with near-equal numbers of sons and daughters reaching adulthood. After that the survival ratio $\ell^m/\ell^f$ keeps falling, so the sex ratio crosses 100 and declines to well below 50 men per 100 women past 90. The picture needs only the male and female survivorship columns of the life table of 2.3 and one number for the SRB.`,
      caption: String.raw`Left: males per 100 females by age for a birth cohort, from the sex-specific life tables of the chosen year (blue) and a comparison year (orange), with 100 marked. Right: the male–female population pyramid of the stationary population implied by the same tables. Use the SRB slider to override the UN estimate and see that it shifts the curve proportionally at every age; compare a high-mortality life table (1950) with a low-mortality one (2023): the crossing age rises and the old-age deficit of men deepens.`,
      deps: ['demo-4.3', 'popgen-11.1'],
      refs: ['K&C: Understanding Population Characteristics'],
      tags: ['sex ratio', 'mortality differentials'],
      credit: 'R. A. Fisher, 1930 (principle)',
      scope: String.raw`Cohort calculation from UN WPP 2024 abridged life tables (tables for 1950, 1970, 1990, 2010 and 2023 in our data): it applies the period survivorship of that year to a closed cohort, so it describes the sex ratio of a stationary population, not of an actual age structure, which migration, wars and changing mortality alter.`,
      links: { data: 'https://population.un.org/wpp/' },
      viz(v) {
        const co = v.select('country', cOpts(), 'RUS');
        const yr = v.select('life table year', SEXY.map((y) => ({ value: String(y), label: String(y) })), '2023');
        const yr2 = v.select('compare with', SEXY.map((y) => ({ value: String(y), label: String(y) })), '1950');
        const un = v.toggle('use UN estimate of SRB', true);
        const sl = v.slider('boys per 100 girls at birth', 100, 112, 105, { step: 0.1 });
        const s = v.stage({ x: [0, 100], y: [0, 120], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'men per 100 women', height: 360, title: 'Sex ratio of a birth cohort' });
        const t = v.stage({ x: [-4, 4], y: [0, 100], axes: 'box', gutter: true, xlabel: 'share of population per year of age (%, men left, women right)', ylabel: 'age', height: 360, title: 'Stationary population' });
        const ratio = (c, y, srb) => { const lm = lxSex(c, 'm', y), lf = lxSex(c, 'f', y); return (a) => { const i = AGE22.findIndex((x, j) => a < (AGE22[j + 1] ?? 1e9)); const j = Math.min(i, 20); const w = (a - AGE22[j]) / (AGE22[j + 1] - AGE22[j]); const m = lm[j] * (1 - w) + lm[j + 1] * w, f = lf[j] * (1 - w) + lf[j + 1] * w; return (100 * srb * m) / f; }; };
        let R = null;
        v.render(() => {
          const c = co.value, y = +yr.value, y2 = +yr2.value;
          const srbOf = (yy) => (un.value ? indAt(c, 'srb', yy) : sl.value) / 100;
          const r1 = ratio(c, y, srbOf(y)), r2 = ratio(c, y2, srbOf(y2));
          s.hline(100, { color: 'muted', dash: true });
          s.path(Array.from({ length: 101 }, (_, a) => [a, r2(Math.min(a, 99.9))]), { color: 'orange', width: 2.4 });
          s.path(Array.from({ length: 101 }, (_, a) => [a, r1(Math.min(a, 99.9))]), { color: 'accent', width: 2.8 });
          const cross = (rr) => { for (let a = 0; a < 100; a += 0.25) if (rr(a) < 100) return a; return null; };
          const x1 = cross(r1);
          if (x1 !== null) s.dot(x1, 100, { color: 'gold', r: 6 });
          // pyramid of the stationary population
          const sr = srbOf(y), Lm = LxSex(c, 'm', y), Lf = LxSex(c, 'f', y);
          const tot = sum(Lm) * sr / (1 + sr) + sum(Lf) / (1 + sr);
          for (let i = 0; i < 21; i++) {
            const w = NS22[i], dm = (Lm[i] * sr / (1 + sr)) / tot / w * 100, df = (Lf[i] / (1 + sr)) / tot / w * 100;
            t.rect(-dm, AGE22[i], 0, AGE22[i] + w, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 });
            t.rect(0, AGE22[i], df, AGE22[i] + w, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1 });
          }
          R = { c, y, y2, sr, x1, at: (a) => r1(a), at2: (a) => r2(a), sr2: srbOf(y2) };
        });
        v.legend([['accent', 'year shown'], ['orange', 'comparison year']]);
        v.readout(() => `${CNAME[R.c]} ${R.y}: SRB ${v.fix(R.sr * 100, 1)}; men per 100 women at 20: ${v.fix(R.at(20), 1)}, at 50: ${v.fix(R.at(50), 1)}, at 75: ${v.fix(R.at(75), 1)}, at 90: ${v.fix(R.at(90), 1)}; parity crossed at age ${R.x1 === null ? 'never' : v.fix(R.x1, 1)}.\nComparison ${R.y2}: at 20 ${v.fix(R.at2(20), 1)}, at 50 ${v.fix(R.at2(50), 1)}, at 75 ${v.fix(R.at2(75), 1)}, at 90 ${v.fix(R.at2(90), 1)}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Sex ratio at birth and “missing women”',
      statement: String.raw`Where parents prefer sons and can choose, the sex ratio at birth rises well above the biological level. In several countries it climbed from about 105 to over 110 boys per 100 girls from the 1980s on, and the shortfall of girls relative to a norm $s_0$ is the number of **missing female births** $B_m/s_0 - B_f$ in each year, with $B_m$ and $B_f$ the births of boys and girls. Amartya Sen's 1990 estimate of more than 100 million **missing women** also counts excess female mortality after birth, so it is a larger concept than prenatal sex selection, which is what the sex ratio at birth detects.`,
      idea: String.raw`Without intervention, the sex of a child behaves like a fair coin biased slightly towards boys, so a country's births cannot depart far from about 105 except through selection: selective abortion after prenatal sex determination, or sex-selective neglect and infanticide. The numbers of missing girls follow by comparing observed girls with the number the norm would give; the choice of norm matters a little (the regional reference levels estimated by Chao and colleagues in 2019 run from about 1.03 in sub-Saharan Africa to about 1.06–1.07 in East Asia and Oceania), and the cumulative total over decades matters a lot. The ratio often returns toward the norm when son preference weakens or access to sex determination is restricted.`,
      caption: String.raw`Left: the sex ratio at birth, 1950–2023, of the country you choose (blue) against all others (grey) and the green band of 104–107 boys per 100 girls; drag the norm slider to move the reference line. Right: the missing female births implied each year (thousands, bars) and their running total from 1950 to the year you pick (line, millions). Compare China, South Korea, India and the Caucasus with Nigeria and the USA; years below the norm are counted as zero, not as a surplus of girls.`,
      deps: ['demo-4.11'],
      refs: ['PHG ch. 5'],
      tags: ['sex ratio at birth', 'son preference'],
      credit: 'Sen, 1990 (missing women); Coale, 1991',
      scope: String.raw`UN WPP 2024 estimates of the sex ratio at birth and of births (medium variant, 1950–2023), which are themselves model-based for many countries. "Missing female births" here is a simple calculation against the norm you choose (counting only years above it); it is a different quantity from Sen's or Coale's "missing women" (excess female mortality) and from published estimates of the national imbalances, which use fitted reference levels and uncertainty bounds.`,
      links: { doi: 'https://doi.org/10.1073/pnas.1812593116' },
      viz(v) {
        const list = ['CHN', 'IND', 'KOR', 'ARM', 'AZE', 'GEO', 'VNM', 'ALB', 'NGA', 'USA', 'BRA', 'FRA', 'JPN', 'SWE', 'MEX', 'RUS'];
        const co = v.select('country', list.map((c) => ({ value: c, label: SRBNAME[c] })), 'CHN');
        const norm = v.slider('norm: boys per 100 girls', 103, 108, 105, { step: 0.1 });
        const upto = v.slider('count through year', 1960, FY1, FY1, { int: true });
        const s = v.stage({ x: [FY0, FY1], y: [100, 122], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'boys per 100 girls at birth', height: 360, xticks: yearTicks(), title: 'Sex ratio at birth' });
        const t = v.stage({ x: [FY0, FY1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'missing female births (thousands)', height: 360, xticks: yearTicks(), title: 'Girls missing relative to the norm' });
        let R = null;
        v.render(() => {
          const c = co.value, s0 = norm.value / 100;
          s.hband(104, 107, { color: 'green', alpha: 0.12 });
          s.hline(norm.value, { color: 'green', dash: true, width: 1.6 });
          list.forEach((o) => { if (o !== c) s.path(ind(o, 'srb').map((x, i) => [FY0 + i, x]), { color: 'muted', width: 1, alpha: 0.35 }); });
          const srb = ind(c, 'srb'), B = ind(c, 'b');
          s.path(srb.map((x, i) => [FY0 + i, x]), { color: 'accent', width: 2.8 });
          const miss = srb.map((x, i) => { const r = x / 100, Bm = B[i] * r / (1 + r), Bf = B[i] / (1 + r); return Math.max(0, Bm / s0 - Bf); });
          const mx = Math.max(...miss, 10) * 1.15;
          t.setView([FY0, FY1], [0, mx]);
          miss.forEach((m, i) => { const yy = FY0 + i; if (m > 0) t.rect(yy - 0.4, 0, yy + 0.4, m, { fill: yy <= upto.value ? 'red' : 'muted', fillAlpha: yy <= upto.value ? 0.5 : 0.18, stroke: false }); });
          t.vline(upto.value, { color: 'gold', dash: true });
          const cum = miss.reduce((a, m, i) => (FY0 + i <= upto.value ? a + m : a), 0);
          const pk = miss.indexOf(Math.max(...miss));
          t.text('running total ' + v.fix(cum / 1000, 1) + ' million', FY0 + 2, mx * 0.93, { size: 12, color: 'red', align: 'left' });
          R = { c, cum, peak: miss[pk], py: FY0 + pk, maxSrb: Math.max(...srb), maxY: FY0 + srb.indexOf(Math.max(...srb)), s0 };
        });
        v.legend([['accent', 'selected country'], ['muted', 'others'], ['red', 'missing female births', { area: true }]]);
        v.readout(() => `${SRBNAME[R.c]}: highest SRB ${v.fix(R.maxSrb, 1)} (${R.maxY}). Against a norm of ${v.fix(R.s0 * 100, 1)}, missing female births peak at ${int(R.peak)} thousand in ${R.py}; counted through ${upto.value} they total **${v.fix(R.cum / 1000, 1)} million**.\nThe total depends on the norm (raise it and the total shrinks), which is why published estimates quote a range.`);
      },
    },
  ],
};
