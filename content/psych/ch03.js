// Psychology & Perception — Chapter 3: Scaling sensation (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
import { EXPS, EXP, logTicks, sig, pc } from './ch03.shared.js';

export default {
  collection: 'psych',
  chapter: 3,
  title: 'Scaling sensation',
  summary: String.raw`Chapter 1 asked how much stimulus is needed to notice a change; this chapter asks how big a sensation feels. Direct methods let people assign numbers to sensations (magnitude estimation) or match one kind of sensation with another, and the results fall on straight lines in log–log coordinates: Stevens' power law, with an exponent that is compressive for brightness, nearly linear for length and strongly expansive for electric shock. That challenges Fechner's logarithm, and the question of which law is right turns out to depend on what a just-noticeable difference measures. The second half turns to indirect scales built from choices and judgments instead of numbers: category ratings that depend on the context (Parducci), Thurstone's law of comparative judgment and Luce's choice axiom, the sone scale for loudness, and multidimensional scaling, which recovers a map of stimuli from their judged similarities.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Magnitude estimation',
      statement: String.raw`In **magnitude estimation** the experimenter presents stimuli of various intensities $I$ in irregular order and the observer assigns each a number proportional to how strong it seems. Usually one stimulus is shown first as a **standard** or *modulus* with a number fixed by the experimenter (here, 10), and every other stimulus is judged relative to it: “twice as strong” means 20, “a tenth as strong” means 1. The numbers from many observers are combined by their geometric mean (the number of one observer is arbitrary up to a unit, so averages are taken in logs), and the result is plotted against $I$ on log–log axes. If the points fall near a straight line $\log\psi=n\log I+\log k$, the sensation $\psi$ is a power function of the stimulus with exponent $n$ (3.2); the fitted slope is the observer's estimate of $n$.`,
      idea: String.raw`The method takes at face value that people can report ratios of sensations. The assumption that numbers can be assigned to sensations in this way is exactly what Fechner's school doubted, and later critics have continued to doubt it; its evidence is internal consistency (straight log–log lines, the agreement of different modulus choices) and the cross-modality matches of 3.4. A just-noticeable difference (psych-1.2) was Fechner's unit of sensation; magnitude estimation replaces the unit by a ratio judgment, so the scale it yields is a ratio scale (zero means no sensation) rather than a count of discriminable steps.`,
      caption: String.raw`**Left:** seven squares of different area; the **standard** (outlined, area 1) is worth 10. **Right:** the log–log plot of your estimates against area. Drag each **blue** handle up or down to the number you would call out for that square; the **green** line is the least-squares fit and the dashed line is what judging number $\propto$ area would give (slope 1). *New simulated judge* (or the sliders) gives a judge with the chosen exponent and noise; try to match the judge's slope with your own handles, and see how a few noisy points move the fitted slope and its standard error. The data are simulated, not from a real experiment.`,
      deps: ['psych-1.2'],
      refs: ['Gescheider ch. 11'],
      tags: ['magnitude estimation', 'scaling', 'ratio scale'],
      credit: 'S. S. Stevens, 1950s (Stevens 1956, Am. J. Psychol. 69: 1–25, for loudness; Stevens 1957, Psychol. Rev. 64: 153–181)',
      scope: String.raw`The slope depends somewhat on the procedure (instructions, whether a modulus is given and what number it carries, the range of the stimuli) and individual observers differ widely; people also tend to prefer round numbers, and estimates are biased toward the middle of the range used (a regression effect). Whether the numbers measure sensation, or only reflect how people use numbers, is disputed.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Magnitude_estimation' },
      viz(v) {
        const M = v.M, AREAS = [0.15, 0.3, 0.55, 1, 1.8, 3.3, 6], STD = 3, LX = AREAS.map((a) => Math.log10(a));
        let seed = 4, last = 0.7;
        const nSl = v.slider('simulated judge’s exponent', 0.2, 1.6, 0.7, { step: 0.01, onChange: () => gen() });
        const sdSl = v.slider('noise (log₁₀ units)', 0, 0.3, 0.07, { step: 0.01, onChange: () => gen() });
        v.button('New simulated judge', () => { seed = 1 + ((Math.random() * 1e9) | 0); gen(); });
        const sq = v.stage({ x: [0, 17], y: [-1.7, 3.4], equal: true, axes: false, height: 230, weight: 1.05, minWidth: 300, title: 'the stimuli: squares of different area' });
        const ll = v.stage({ x: [-0.95, 0.95], y: [-0.2, 2.6], axes: 'box', gutter: true, height: 300, weight: 0.95, xlabel: 'area (standard = 1)', ylabel: 'your number', xticks: logTicks(-0.95, 0.95), yticks: logTicks(-0.2, 2.6), title: 'log–log plot of the estimates' });
        const H = AREAS.map((a, i) => ll.handle(LX[i], 1 + 0.7 * LX[i], { color: i === STD ? 'muted' : 'accent', r: 7, constrain: (x, y) => [LX[i], i === STD ? 1 : M.clamp(y, -0.15, 2.55)] }));
        function gen() {
          const R = v.rng(seed); const n = nSl.value; last = n;
          AREAS.forEach((a, i) => { const e = R.normal() * sdSl.value; H[i].set(LX[i], i === STD ? 1 : 1 + n * LX[i] + e); });
        }
        gen();
        v.legend([['accent', 'your estimate'], ['green', 'least-squares line'], ['muted', 'number ∝ area', { dash: true }]]);
        let fit = null;
        v.render(() => {
          const ys = H.map((h) => h.y); fit = M.linreg(LX, ys);
          // squares
          let x = 0.4; const side = (a) => 1.55 * Math.sqrt(a);
          AREAS.forEach((a, i) => {
            const w = side(a);
            sq.rect(x, 0, x + w, w, { fill: i === STD ? 'accent' : 'muted', fillAlpha: i === STD ? 0.32 : 0.2, color: i === STD ? 'accent' : 'muted', width: i === STD ? 2.4 : 1.2 });
            sq.text(String(Math.round(Math.pow(10, ys[i]) * (Math.abs(ys[i]) < 1.5 ? 10 : 1)) / (Math.abs(ys[i]) < 1.5 ? 10 : 1)), x + w / 2, -0.6, { align: 'center', size: 13, weight: 700, color: i === STD ? 'ink' : 'accent' });
            if (i === STD) sq.text('standard', x + w / 2, w + 0.35, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            x += w + 0.45;
          });
          sq.text('number you assign', 8.5, -1.35, { align: 'center', size: 11.5, color: 'muted' });
          // log-log
          ll.line(-0.95, 1 - 0.95, 0.95, 1 + 0.95, { color: 'muted', dash: [5, 4], width: 1.4 });
          ll.line(-0.95, fit.predict(-0.95), 0.95, fit.predict(0.95), { color: 'green', width: 2.4 });
          ll.text('slope ' + v.fix(fit.slope, 2), 0.93, fit.predict(0.93), { align: 'right', dy: 16, color: 'green', weight: 700, size: 12.5 });
          ll.dot(0, 1, { r: 3, color: 'muted' });
        });
        v.readout(() => {
          if (!fit) return '';
          return `Fitted exponent $n$ = ${v.fix(fit.slope, 2)} ± ${v.fix(fit.seSlope, 2)} (standard error, 5 degrees of freedom) · $r^2$ = ${v.fix(fit.r2, 3)} · the last simulated judge had $n$ = ${v.fix(last, 2)} · judging by area would give $n$ = 1 · estimated number for area 4 = ${v.fix(Math.pow(10, fit.predict(Math.log10(4))), 0)} (a square four times the standard)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Law',
      name: 'Stevens’ power law',
      statement: String.raw`For many sensory continua, the magnitude $\psi$ of the sensation reported by observers grows as a power of the physical intensity $I$ of the stimulus:
$$\psi=k\,I^{\,n}.$$
The constant $k$ depends on the units; the **exponent** $n$ characterises the continuum and the stimulus conditions. Consequently every multiplication of the stimulus by a fixed factor $r$ multiplies the sensation by the fixed factor $r^{n}$ (equal stimulus *ratios* give equal sensation ratios), and on log–log axes the law is a straight line of slope $n$. Where $n<1$ the scale is compressive (the sensation grows more slowly than the stimulus), when $n>1$ it is expansive. Near threshold the power law is usually written with the effective stimulus $I-I_0$ ($I_0$ a small constant), which bends the log–log line at low intensities.`,
      idea: String.raw`The law is an empirical summary of magnitude estimates (3.1), cross-modality matches (3.4) and other ratio judgments, not a derived result. A power function is the only continuous family that turns equal ratios of the stimulus into equal ratios of the sensation (setting $\psi(rI)=g(r)\psi(I)$ forces $g(r)=r^n$), and that is what makes its log–log graph a line. It replaced Fechner's logarithmic law (psych-1.11, see 3.5), which the same data contradict: a logarithm turns equal ratios into equal *differences*.`,
      caption: String.raw`**Left:** sensation against intensity on ordinary axes (scaled so that $\psi(1)=10$). **Right:** the same curve on log–log axes, where it is a straight line. Move the **exponent** between 0.2 and 3.6, or press a preset: brightness is compressive, length about linear, heaviness and shock expansive. The two markers show a doubling of the stimulus ($I=1\to2$) and the sensation ratio $2^n$ it produces. Turn on the **threshold** offset $I_0$ to see the low-intensity bend: the apparent log–log slope drops below $n$ for faint stimuli.`,
      deps: ['psych-3.1', 'psych-1.11'],
      refs: ['Gescheider ch. 13'],
      tags: ['power law', 'Stevens', 'exponent'],
      credit: 'S. S. Stevens, “On the psychophysical law”, Psychological Review 64 (1957): 153–181',
      scope: String.raw`An empirical regularity for ratio-scale judgments over several decades of intensity, not an exact law: the exponent varies with the procedure, the stimulus range and the observer; it is approximate near threshold and for stimuli close to damaging levels; and it describes judgments of apparent magnitude, which may not coincide with discrimination (3.5).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stevens%27s_power_law' },
      viz(v) {
        const M = v.M, PRE = [['bright', 'brightness'], ['loud', 'loudness'], ['len', 'length'], ['heavy', 'heaviness'], ['shock', 'shock']];
        const nSl = v.slider('exponent $n$', 0.2, 3.6, 0.67, { step: 0.01 });
        const pre = v.select('preset', PRE.map(([id, l]) => ({ value: id, label: l + ' ' + EXP[id].n })), 'loud', { onChange: (id) => nSl.set(EXP[id].n) });
        const thr = v.toggle('threshold offset $I_0$', false);
        const i0Sl = v.slider('$I_0$', 0.05, 0.6, 0.3, { step: 0.01 });
        const lin = v.stage({ x: [0, 4], y: [0, 10], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'stimulus intensity $I$', ylabel: 'sensation $\\psi$', title: 'ordinary axes' });
        const lg = v.stage({ x: [-1, 0.85], y: [0, 2], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'stimulus $I$', ylabel: 'sensation $\\psi$', xticks: logTicks(-1, 0.85, { mult: [1, 2, 5] }), yticks: logTicks(0, 2), title: 'log–log axes' });
        v.legend([['accent', 'power law $\\psi=k(I-I_0)^n$'], ['gold', 'doubling $I=1\\to2$', { dot: true }], ['muted', 'straight line, slope $n$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const n = nSl.value, I0 = thr.value ? i0Sl.value : 0, psi = (I) => (I > I0 ? 10 * Math.pow((I - I0) / (1 - I0), n) : 0);
          i0Sl.el.hidden = !thr.value;
          const top = psi(4) * 1.06;
          lin.setView([0, 4], [0, top]);
          lin.fn(psi, { domain: [0, 4], color: 'accent', width: 2.8, n: 240 });
          lin.line(1, 0, 1, psi(1), { color: 'gold', dash: [3, 3] }); lin.line(2, 0, 2, psi(2), { color: 'gold', dash: [3, 3] });
          lin.line(0, psi(1), 1, psi(1), { color: 'gold', dash: [3, 3] }); lin.line(0, psi(2), 2, psi(2), { color: 'gold', dash: [3, 3] });
          lin.dot(1, psi(1), { r: 5.5, color: 'gold' }); lin.dot(2, psi(2), { r: 5.5, color: 'gold' });
          lin.text('ψ = ' + sig(psi(1)), 0.04, psi(1), { dy: -9, align: 'left', size: 11.5, color: 'muted', weight: 600 });
          lin.text('ψ = ' + sig(psi(2)), 0.04, psi(2), { dy: -9, align: 'left', size: 11.5, color: 'muted', weight: 600 });
          const ylo = 1 - 1.05 * n - 0.2, yhi = 1 + 0.85 * n + 0.2;
          lg.setView([-1, 0.85], [ylo, yhi]); lg.setTicks(logTicks(-1, 0.85), logTicks(ylo, yhi));
          lg.line(-1, 1 - n, 0.85, 1 + 0.85 * n, { color: 'muted', dash: [5, 4], width: 1.3 });
          const pts = []; for (let k = 0; k <= 240; k++) { const x = -1 + (1.85 * k) / 240, I = Math.pow(10, x), p = psi(I); pts.push(p > 0 ? [x, Math.log10(p)] : null); }
          lg.path(pts, { color: 'accent', width: 2.8 });
          lg.dot(0, Math.log10(psi(1)), { r: 5.5, color: 'gold' }); lg.dot(Math.log10(2), Math.log10(psi(2)), { r: 5.5, color: 'gold' });
          const sl = (Math.log10(psi(2)) - Math.log10(psi(1))) / Math.log10(2);
          const lo = I0 + 0.1 * (1 - I0), sl2 = I0 > 0 ? (Math.log10(psi(lo * 1.5)) - Math.log10(psi(lo))) / Math.log10(1.5) : n;
          st = { n, I0, r: psi(2) / psi(1), sl, sl2, lo };
        });
        v.readout(() => st ? `$n$ = ${v.fix(st.n, 2)} · doubling the stimulus multiplies the sensation by $2^n$ = ${v.fix(Math.pow(2, st.n), 3)} (measured from the curve: ${v.fix(st.r, 3)}) · log–log slope between $I=1$ and $2$: ${v.fix(st.sl, 3)}${st.I0 > 0 ? ` · near threshold ($I$ = ${v.fix(st.lo, 2)}–${v.fix(st.lo * 1.5, 2)}) the apparent slope is ${v.fix(st.sl2, 2)}` : ''} · sensation doubles when the stimulus grows by $2^{1/n}$ = ${v.fix(Math.pow(2, 1 / st.n), 3)}` : '');
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Exponents across sensory continua',
      statement: String.raw`The exponent of the power law (3.2) is a signature of the sensory continuum. In the values usually quoted from Stevens, brightness of a $5^\circ$ target in the dark has $n\approx0.33$ and loudness (as a function of sound *pressure*) $n\approx0.67$, so both are compressive; apparent length of a projected line is about $1$; the heaviness of lifted weights is $1.45$, warmth on the skin $1.6$; and electric shock through the fingers $3.5$. Exponents below $1$ mean the stimulus factor needed to double the sensation exceeds 2, exponents above $1$ that it is smaller than 2. The exponent depends on the stimulus conditions (a point source of light has $n\approx0.5$, the extended target $0.33$), so the number belongs to a continuum *and* a procedure.`,
      idea: String.raw`Every exponent is the slope of a magnitude-estimation line (3.1) on log–log axes. The gallery shows that sensation systems are not built to the same plan: the senses that must cover a huge range of energies (brightness, loudness) are compressive, and those that signal threatening intensities (shock, muscle effort, heat) are expansive, a pattern often read as a trade between range and resolution. All the lines are drawn through the same point (a standard stimulus with sensation 10), so differences in slope are the only difference between them.`,
      caption: String.raw`**Left:** each line is $\log\psi$ against $\log I$ for one continuum, all passing through the standard. **Right:** the exponents as bars; the dashed line at 1 separates compressive from expansive. Click a line or a bar to select a continuum. Use the **stimulus ratio** slider: each bar then ends with the sensation ratio $r^n$ that such a stimulus ratio produces (for $r=2$: brightness barely changes, shock grows more than elevenfold). The values are transcribed from the commonly reproduced table of Stevens' exponents, not from the original papers.`,
      deps: ['psych-3.2'],
      refs: ['Gescheider ch. 13'],
      tags: ['power law', 'exponents', 'sensory modalities'],
      credit: 'Table of exponents from S. S. Stevens (1957; 1975, Psychophysics)',
      scope: String.raw`Typical values from magnitude-estimation experiments; published exponents for the same continuum range widely with the conditions (stimulus range, instructions, adapting state, body site).`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stevens%27s_power_law' },
      viz(v) {
        const M = v.M, N = EXPS.length;
        let sel = 'loud';
        const rSl = v.slider('stimulus ratio $r=I_2/I_1$', 1.2, 10, 2, { step: 0.1 });
        const lg = v.stage({ x: [0, 1], y: [0.8, 4.7], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'stimulus (decades above the standard)', ylabel: 'sensation', xticks: [[0, '1'], [0.301, '2'], [0.699, '5'], [1, '10']], yticks: logTicks(0.8, 4.7, { mult: [1, 3] }), title: 'every continuum is a line through the standard' });
        const br = v.stage({ x: [-3.7, 5.3], y: [-0.2, N + 0.2], axes: false, height: 340, weight: 1.05, minWidth: 300, title: 'exponent $n$ (bar) and sensation ratio for $r$' });
        const rows = EXPS.slice().sort((a, b) => a.n - b.n);
        lg.onClick((x, y) => { let best = null, bd = 1e9; for (const e of EXPS) { const d = Math.abs(1 + e.n * M.clamp(x, 0, 1) - y); if (d < bd) { bd = d; best = e; } } if (best) sel = best.id; });
        br.onClick((x, y) => { const k = N - 1 - Math.round(y - 0.5); if (k >= 0 && k < N) sel = rows[k].id; });
        v.legend([['accent', 'selected'], ['muted', 'others'], ['muted', 'linear ($n=1$)', { dash: true }]]);
        let st = null;
        v.render(() => {
          const r = rSl.value;
          for (const e of EXPS) if (e.id !== sel) lg.line(0, 1, 1, 1 + e.n, { color: 'muted', alpha: 0.5, width: 1.4 });
          const S = EXP[sel];
          lg.line(0, 1, 1, 1 + S.n, { color: 'accent', width: 3.2 });
          lg.dot(0, 1, { r: 4.5, color: 'ink' });
          lg.text(S.short + '  n = ' + S.n, 0.96, 1 + 0.96 * S.n, { align: 'right', dy: -12, color: 'accent', weight: 700, size: 12.5 });
          // bars
          br.line(1, -0.2, 1, N + 0.2, { color: 'muted', dash: [4, 4], width: 1.2 });
          br.text('n = 1', 1, N + 0.05, { align: 'center', size: 11, color: 'muted', baseline: 'bottom' });
          rows.forEach((e, i) => {
            const y = N - 1 - i + 0.5, on = e.id === sel;
            br.rect(0, y - 0.32, e.n, y + 0.32, { fill: on ? 'accent' : e.c, fillAlpha: on ? 0.55 : 0.28, color: on ? 'accent' : e.c, width: on ? 2 : 1 });
            br.text(e.short, -0.08, y, { align: 'right', size: 12, weight: on ? 700 : 500, color: on ? 'accent' : 'ink' });
            br.text(e.n + '  (×' + sig(Math.pow(r, e.n), 3) + ')', e.n + 0.08, y, { align: 'left', size: 11, color: on ? 'accent' : 'muted', weight: on ? 700 : 500 });
          });
          st = { S, r };
        });
        v.readout(() => st ? `**${st.S.name}**: $n$ = ${st.S.n} · a stimulus ratio $r$ = ${v.fix(st.r, 1)} multiplies the sensation by $r^n$ = ${v.fix(Math.pow(st.r, st.S.n), 2)} · doubling the stimulus gives ×${v.fix(Math.pow(2, st.S.n), 2)}, and the sensation doubles when the stimulus grows by ×${v.fix(Math.pow(2, 1 / st.S.n), 2)} · the lines run over one decade of stimulus: the sensation changes by a factor of ${v.fix(Math.pow(10, st.S.n), 1)}` : '');
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Method',
      name: 'Cross-modality matching',
      statement: String.raw`In **cross-modality matching** the observer adjusts the intensity of a stimulus on one continuum $B$ (say, a line length) until it seems as strong as a stimulus on another continuum $A$ (say, the loudness of a tone). If sensation is a power function on each continuum, $\psi_A=k_AI_A^{a}$ and $\psi_B=k_BI_B^{b}$, then matching means $\psi_A=\psi_B$, and so
$$\log I_B=\frac ab\,\log I_A+\text{const}.$$
The matching function is a straight line on log–log axes whose slope is the *ratio of the two exponents*, which can be compared with the ratio of the exponents found by magnitude estimation (3.1) on each continuum separately. The exponents then are tested without asking for numbers at all.`,
      idea: String.raw`Each match equates two sensations, so the number scale of magnitude estimation drops out: only the power laws themselves (3.2) are assumed. If the exponents are consistent, matches also chain: the slope for $A\to C$ is the product of the slopes for $A\to B$ and $B\to C$, an additional check not available to a single scale. Matches of this sort (for example line length to loudness) were used by Stevens and colleagues to support the power law; their consistency is the evidence, and the finding that people agree about such matches is the reason the method is credited.`,
      caption: String.raw`The **simulated matcher** has the exponents of the two chosen continua. **Left:** both power laws on log–log axes; drag the **gold** handle up and down the sensation axis to choose a sensation level, and read the two stimulus levels (dropped vertically) that produce it. **Right:** the matching function, each trial a point (the dashed line is the predicted slope $a/b$). Choose the two continua and the match noise, and press *Run matches*: the green fitted slope tracks $a/b$, except that the fit of $B$ on $A$ tends to flatten when the noise is placed in $A$ (an errors-in-variables effect; compare the two fitted slopes in the readout). Illustrative simulation using the exponents of 3.3, not Stevens' data.`,
      deps: ['psych-3.2'],
      refs: ['Gescheider ch. 12'],
      tags: ['cross-modality matching', 'power law', 'scaling'],
      credit: 'S. S. Stevens and collaborators, 1950s–60s (e.g. Stevens & Guirao, 1963, J. Exp. Psychol. 66: 177–186, matched length to loudness and brightness)',
      scope: String.raw`Holds when each continuum obeys a power law over the range used; the fitted slope depends on which continuum the observer adjusts (regression effects) and on the stimulus range, and real matches only approximately agree with the predicted ratio of exponents.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stevens%27s_power_law' },
      viz(v) {
        const M = v.M, CH = ['bright', 'loud', 'len', 'heavy', 'shock'], opts = CH.map((id) => ({ value: id, label: EXP[id].short }));
        let seed = 8, data = null;
        const selA = v.select('continuum $A$ (standard)', opts, 'loud', { onChange: () => redo() });
        const selB = v.select('continuum $B$ (adjusted)', opts, 'len', { onChange: () => redo() });
        const noise = v.slider('match noise (log₁₀ sensation)', 0, 0.25, 0.06, { step: 0.01, onChange: () => redo() });
        v.button('Run matches', () => { seed = 1 + ((Math.random() * 1e9) | 0); redo(); });
        const s1 = v.stage({ x: [0, 4], y: [0.8, 3.2], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'stimulus level (decades above its reference)', ylabel: 'sensation ψ', yticks: logTicks(0.8, 3.2, { mult: [1, 3] }), title: 'two power laws, one sensation level' });
        const s2 = v.stage({ x: [0, 4], y: [0, 4], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'log₁₀ level of $A$', ylabel: 'log₁₀ level of $B$', title: 'the matching function' });
        const hl = s1.handle(0, 2, { color: 'gold', r: 8, constrain: (x, y) => [0, M.clamp(y, 1, 3)] });
        function redo() {
          const a = EXP[selA.value].n, b = EXP[selB.value].n, R = v.rng(seed), L = M.range(9).map((k) => 1 + k / 4);
          // A fixed, B adjusted: noise in B; and B fixed, A adjusted: noise in A
          const sd = noise.value;
          const AB = L.map((p) => { const q = p + sd * R.normal(); return [p / a - 1 / a, (q - 1) / b]; });
          const BA = L.map((p) => { const q = p + sd * R.normal(); return [(q - 1) / a, (p - 1) / b]; });
          const f1 = M.linreg(AB.map((t) => t[0]), AB.map((t) => t[1]));
          const f2 = M.linreg(BA.map((t) => t[0]), BA.map((t) => t[1]));
          const g = M.linreg(BA.map((t) => t[1]), BA.map((t) => t[0]));
          data = { a, b, AB, BA, f1, f2, inv: 1 / g.slope };
        }
        redo();
        v.legend([['accent', '$A$ fixed, observer sets $B$', { dot: true }], ['orange', '$B$ fixed, observer sets $A$', { dot: true }], ['green', 'fit of $B$ on $A$'], ['muted', 'predicted slope $a/b$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const D = data, a = D.a, b = D.b, A = EXP[selA.value], B = EXP[selB.value], ps = hl.y;
          const xa = (ps - 1) / a, xb = (ps - 1) / b, xmax = Math.max(2 / a, 2 / b) * 1.02;
          s1.setView([-0.05 * xmax, xmax], [0.8, 3.2]); s1.setTicks(null, logTicks(0.8, 3.2, { mult: [1, 3] }));
          s1.line(0, 1, 2 / a, 3, { color: 'accent', width: 2.8 }); s1.line(0, 1, 2 / b, 3, { color: 'orange', width: 2.8 });
          s1.text(A.short + ' (n = ' + A.n + ')', 2 / a, 3, { dx: -6, dy: 14, align: 'right', color: 'accent', weight: 700, size: 12 });
          s1.text(B.short + ' (n = ' + B.n + ')', 2 / b, 3, { dx: -6, dy: A === B || Math.abs(a - b) < 0.5 ? 30 : 14, align: 'right', color: 'orange', weight: 700, size: 12 });
          s1.line(0, ps, Math.max(xa, xb), ps, { color: 'gold', dash: [4, 3], width: 1.4 });
          s1.line(xa, 0.8, xa, ps, { color: 'accent', dash: [3, 3] }); s1.line(xb, 0.8, xb, ps, { color: 'orange', dash: [3, 3] });
          s1.dot(xa, ps, { r: 5, color: 'accent' }); s1.dot(xb, ps, { r: 5, color: 'orange' });
          const X1 = 2 / a, Y1 = 2 / b;
          s2.setView([-0.04 * X1, X1], [-0.04 * Y1, Y1]);
          s2.line(0, 0, X1, Y1, { color: 'muted', dash: [5, 4], width: 1.6 });
          s2.line(0, D.f1.predict(0), X1, D.f1.predict(X1), { color: 'green', width: 2.2 });
          for (const [x, y] of D.AB) s2.dot(x, y, { r: 4.2, color: 'accent', ring: false });
          for (const [x, y] of D.BA) s2.dot(x, y, { r: 4.2, color: 'orange', ring: false });
          s2.dot(xa, xb, { r: 8, color: 'gold', hollow: true, width: 2.2 });
          st = { D, A, B };
        });
        v.readout(() => st ? `Predicted slope $a/b$ = ${st.A.n}/${st.B.n} = ${v.fix(st.D.a / st.D.b, 3)} · fitted slope when $B$ is adjusted: ${v.fix(st.D.f1.slope, 3)} ± ${v.fix(st.D.f1.seSlope, 3)} · when $A$ is adjusted and $B$ regressed on $A$: ${v.fix(st.D.f2.slope, 3)} (tends to be flattened); inverse of the regression of $A$ on $B$: ${v.fix(st.D.inv, 3)} · geometric mean of the two unbiased estimates: ${v.fix(Math.sqrt(st.D.f1.slope * st.D.inv), 3)}` : '');
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Paradox',
      name: 'Fechner versus Stevens: which psychophysical law?',
      statement: String.raw`Two scales of sensation can be built for the same stimulus continuum. **Fechner's scale** counts just-noticeable differences (psych-1.2) upward from threshold; if Weber's law holds (psych-1.9, $\Delta I=wI$) the count after $N$ steps is $I_N=I_0(1+w)^N$, so $N=\ln(I/I_0)/\ln(1+w)$: a logarithm (psych-1.11). **Stevens' scale** comes from direct ratio judgments (3.1), and gives a power function $\psi=I^{\,n}$ (3.2). The two scales have different shapes for the same observer and the same stimuli, which seems to contradict the idea that a JND is a fixed unit of sensation. The resolution is that they measure different things: if the noise that limits discrimination grows in proportion to the sensation, equal JND steps are *not* equal sensation steps, and a Weber-law observer can have both a logarithmic JND count and a power-law magnitude scale. If instead discrimination noise were constant in sensation units, JND steps would be equal steps of $\psi$, the two scales would coincide, and Weber's law would fail.`,
      idea: String.raw`Fechner's derivation integrates $d\psi=dI/(wI)$, which assumes that one JND is a constant increment of sensation. Stevens' data say that $\psi=I^n$, for which $d\psi=n\,\psi\,dI/I$: if $\Delta I/I$ is constant at threshold (Weber), then the sensation difference that is just noticeable is *proportional to the sensation level*. Both laws can therefore be right about their data, but they are not scales of the same thing: one counts discriminable steps, the other records ratio judgments, and which of the two is “sensation” is partly a matter of definition. This is the standard way of reading the dispute; it does not say which scale is the right one for other purposes.`,
      caption: String.raw`A simulated observer has $\psi=I^n$ (the magnitude-estimation scale). **Left:** the two scales, each normalised to 1 at $I=1000$: **blue** is the power law, **orange** the count of JND steps up from $I=1$. With *discrimination noise $\propto\psi$* (Weber's law holds) they differ: the JND count is a logarithm. Switch to *noise constant in $\psi$* and the curves fall on top of each other, but the **right** panel shows the price: the Weber fraction $\Delta I/I$ falls with intensity, as $I^{-n}$, and Weber's law fails. Drag the **gold** handle to compare the two scales at a given intensity. This is a model, not data.`,
      deps: ['psych-1.11', 'psych-3.2'],
      refs: ['Gescheider ch. 13', 'Gescheider ch. 14'],
      tags: ['Fechner', 'Stevens', 'JND', 'Weber'],
      credit: 'Debate between Fechner (1860) and S. S. Stevens (1957; “To honor Fechner and repeal his law”, Science 133, 1961: 80–86)',
      scope: String.raw`A schematic observer with a power-law sensation and a single noise source. Real discrimination data show Weber fractions that vary with intensity (psych-1.10) and judgment data that depend on procedure, so neither scale is a pure measure of one underlying quantity.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law' },
      viz(v) {
        const M = v.M, IMAX = 1000;
        const nSl = v.slider('magnitude exponent $n$', 0.2, 1.2, 0.67, { step: 0.01 });
        const wSl = v.slider('Weber fraction $w$ at $I=30$', 0.02, 0.3, 0.1, { step: 0.005 });
        const mode = v.select('discrimination noise', [{ value: 'prop', label: 'proportional to $\\psi$ (Weber holds)' }, { value: 'const', label: 'constant in $\\psi$' }], 'prop');
        const sc = v.stage({ x: [0, IMAX], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1.05, minWidth: 290, xlabel: 'stimulus intensity $I$ (threshold = 1)', ylabel: 'sensation scale (normalised)', title: 'two scales for one observer' });
        const wb = v.stage({ x: [0, 3], y: [0, 0.4], axes: 'box', gutter: true, height: 320, weight: 0.95, minWidth: 260, xlabel: 'stimulus intensity $I$', ylabel: 'Weber fraction $\\Delta I/I$', xticks: logTicks(0, 3, { mult: [1, 3] }), title: 'the Weber plot of the same observer' });
        const hd = sc.handle(150, 0, { color: 'gold', r: 8, constrain: (x) => [M.clamp(x, 2, IMAX), 0] });
        v.legend([['blue', 'magnitude estimation $\\psi=I^n$'], ['orange', 'JND count (Fechner)'], ['gold', 'chosen $I$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const n = nSl.value, w = wSl.value, prop = mode.value === 'prop', c = Math.pow(30, n) * (Math.pow(1 + w, n) - 1);
          const cnt = prop ? (I) => Math.log(I) / Math.log(1 + w) : (I) => (Math.pow(I, n) - 1) / c;
          const C = cnt(IMAX), ME = (I) => Math.pow(I / IMAX, n), FE = (I) => cnt(I) / C;
          sc.fn(ME, { domain: [1, IMAX], color: 'blue', width: 3, n: 260 });
          sc.fn(FE, { domain: [1, IMAX], color: 'orange', width: 3, n: 260, dash: prop ? undefined : [6, 4] });
          const I = hd.x; sc.line(I, 0, I, Math.max(ME(I), FE(I)), { color: 'gold', dash: [3, 3] });
          sc.dot(I, ME(I), { r: 5.5, color: 'blue' }); sc.dot(I, FE(I), { r: 5.5, color: 'orange' });
          const wf = (J) => (prop ? w : (Math.pow(Math.pow(J, n) + c, 1 / n) - J) / J);
          const top = Math.max(0.1, wf(1) * 1.12); wb.setView([0, 3], [0, top]);
          wb.fn((x) => wf(Math.pow(10, x)), { domain: [0, 3], color: prop ? 'green' : 'red', width: 3, n: 200 });
          wb.text(prop ? 'Weber’s law: constant' : 'falls as I^−n: Weber’s law fails', 1.5, wf(30), { dy: -14, align: 'center', size: 12, weight: 700, color: prop ? 'green' : 'red' });
          st = { n, w, prop, I, me: ME(I), fe: FE(I), C, w1: wf(1), w1000: wf(IMAX) };
        });
        v.readout(() => st ? `At $I$ = ${v.fix(st.I, 0)}: magnitude scale ${v.fix(st.me, 3)}, JND-count scale ${v.fix(st.fe, 3)} (difference ${v.fix(Math.abs(st.me - st.fe), 3)}) · total JNDs between $I=1$ and $1000$: ${v.fix(st.C, 0)} · Weber fraction at $I=1$: ${v.fix(st.w1, 3)}, at $I=1000$: ${v.fix(st.w1000, 3)} · ${st.prop ? `a tenfold rise in $I$ multiplies the magnitude estimate by $10^n$ = ${v.fix(Math.pow(10, st.n), 2)} but adds a fixed $\\ln 10/\\ln(1+w)$ = ${v.fix(Math.log(10) / Math.log(1 + st.w), 1)} JNDs` : 'the two scales coincide, Weber’s law fails'}` : '');
      },
    },
  ],
};
