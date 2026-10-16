// Epidemiology & Evidence — Chapter 4: Causation and confounding
// (items 4.2–4.6, 4.12, 4.13; the landmark papers 4.14–4.17 are in ch04-papers.js; 4.1 and 4.7–4.11 are cross-listed)
import { int, pc, pcs, sig3, iconArray, SNOW_DEATHS, SNOW_PUMPS, SNOW_BROAD, SNOW_DATES, SEMM_YEARLY } from './ch04.shared.js';

const expit = (x) => 1 / (1 + Math.exp(-x));
const fromOdds = (o) => o / (1 + o);
const RATIO_TICKS = [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8'], [16, '16']];

/** Calendar label of day i of Snow's table (0 = 19 August 1854). */
const snowDay = (i) => (i <= 12 ? `${19 + i} Aug` : `${i - 12} Sep`);

export default {
  collection: 'epi',
  chapter: 4,
  title: 'Causation and confounding',
  summary: String.raw`An association is not yet a cause. Counterfactual thinking defines causal effects, the sufficient-component model explains why causes interact, and Bradford Hill’s viewpoints guide judgement. Confounding — a common cause of exposure and outcome — is the central threat, and causal diagrams show which variables to adjust for and which (colliders, mediators) not to. Classic investigations from Snow to Doll and Hill show the reasoning at work.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Sufficient-component cause model (causal pies)',
      statement: String.raw`A **sufficient cause** is a minimal set of **component causes** that, once all present, inevitably produces the disease; draw it as a pie whose slices are the components. A disease can have many sufficient causes (many pies), the same component can sit in several of them, and a person gets the disease if *any* pie is completed. Two consequences follow. A component that belongs to every pie is **necessary**; one that completes a pie only together with others **interacts** with them, so no pie has a share of the cause that is its own. Hence, the fractions of cases that would have been prevented had one particular component been absent, added over components, can exceed 100%:
$$\sum_k \mathrm{AF}_k=\sum_k\frac{P(D)-P(D\mid\text{component }k\text{ absent})}{P(D)}\;>\;1\quad\text{whenever components share pies.}$$`,
      idea: String.raw`With two components $A,B$ in one pie and nothing else causing the disease, removing $A$ prevents every case and so does removing $B$: each “explains” 100% and together 200%. The paradox disappears once causes are seen as completing a pie jointly, not as shares of a sum (compare the potential-outcomes view, causal-1.1, where a cause is defined by contrasting two worlds). Attributable fractions answer “what if this component were absent?”, not “whose fault is it?”.`,
      caption: String.raw`Each pie is a sufficient cause (components A–F in three pies, plus an unknown background cause G). Click a person in the grid of 100 to see which components they carry and whether a pie is complete (red outline). Slide the **prevalence** of the components, **remove** one component for everyone, and read the bars: the fraction of cases each component's removal would prevent, with the sum in the stacked bar at the right. Raise the prevalence and the sum climbs well past 100%.`,
      scope: String.raw`A deterministic, qualitative model of causation: it assumes the components are binary and (in the picture) independent across people. The three-pie structure and all numbers are illustrative, not data.`,
      deps: ['causal-1.1'],
      refs: ['Rothman ch. 2'],
      credit: 'Kenneth Rothman, 1976',
      tags: ['causation', 'interaction', 'attributable fraction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Causal_pie_model', doi: '10.1093/oxfordjournals.aje.a112335' },
      viz(v) {
        const M = v.M;
        const COMP = ['A', 'B', 'C', 'D', 'E', 'F'], COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink'];
        const PIES = [[0, 1, 2], [0, 3, 4], [1, 4, 5]];
        const NP = 100, NG = 6;
        const rng = M.rng(11), U = Array.from({ length: NP }, () => Array.from({ length: 7 }, () => rng()));
        const prev = v.slider('prevalence of each component', 0.05, 0.95, 0.5, { step: 0.01, fmt: (x) => pc(x, 0) });
        const bg = v.slider('background cause G', 0, 0.2, 0.02, { step: 0.005, fmt: (x) => pcs(x) });
        const rem = v.select('remove for everyone', ['none', ...COMP], 'none');
        const sP = v.stage({ x: [0, 12.9], y: [-0.4, 3.7], equal: true, axes: false, height: 270, full: true, title: 'sufficient causes: a person is diseased when any pie is complete' });
        const sG = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 290, weight: 1, minWidth: 260, title: '100 people (click one)' });
        const sB = v.stage({ x: [-0.6, 7.7], y: [0, 120], axes: 'box', gutter: true, height: 290, weight: 1.4, minWidth: 300, ylabel: 'cases prevented (%)', xticks: [...COMP.map((c, i) => [i, c]), [6.5, 'Σ']], title: 'if this component were absent' });
        let sel = -1;
        sG.onClick((x, y) => { const c = Math.floor(x), r = Math.floor(10 - y); if (c >= 0 && c < 10 && r >= 0 && r < 10) { sel = r * 10 + c; v.invalidate(); } });
        const pDis = (p, g) => {
          let tot = 0;
          for (let m = 0; m < 1 << NG; m++) {
            let pr = 1; for (let k = 0; k < NG; k++) pr *= m >> k & 1 ? p[k] : 1 - p[k];
            if (PIES.some((pie) => pie.every((k) => m >> k & 1))) tot += pr;
          }
          return 1 - (1 - tot) * (1 - g);
        };
        const slice = (cx, cy, R, j, n) => { const a0 = Math.PI / 2 - (j * 2 * Math.PI) / n, a1 = Math.PI / 2 - ((j + 1) * 2 * Math.PI) / n, pts = [[cx, cy]]; for (let t = 0; t <= 16; t++) { const a = a0 + ((a1 - a0) * t) / 16; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return [pts, (a0 + a1) / 2]; };
        let st = null;
        v.render(() => {
          const p = COMP.map((_, k) => (rem.value === COMP[k] ? 0 : prev.value));
          const g = bg.value, rk = COMP.indexOf(rem.value);
          const has = (i, k) => k < NG ? (k === rk ? false : U[i][k] < prev.value) : U[i][k] < g;
          const dis = (i) => U[i][6] < g || PIES.some((pie) => pie.every((k) => has(i, k)));
          if (sel < 0) { sel = 0; for (let i = 0; i < NP; i++) if (PIES.some((pie) => pie.every((k) => has(i, k)))) { sel = i; break; } }
          const base = pDis(COMP.map(() => prev.value), g), now = pDis(p, g);
          const af = COMP.map((_, k) => { const q = COMP.map(() => prev.value); q[k] = 0; return (base - pDis(q, g)) / base; });
          const sum = af.reduce((a, b) => a + b, 0);
          // pies
          const cxs = [1.7, 5.0, 8.3];
          PIES.forEach((pie, pi) => {
            const cx = cxs[pi], cy = 1.55, R = 1.3, done = pie.every((k) => has(sel, k));
            pie.forEach((k, j) => {
              const [pts, am] = slice(cx, cy, R, j, 3), on = has(sel, k);
              s_poly(sP, pts, on ? COL[k] : 'muted', on ? 0.75 : 0.1, done ? 'red' : 'ink', done ? 3 : 1.2, k === rk);
              sP.text(COMP[k], cx + 0.62 * R * Math.cos(am), cy + 0.62 * R * Math.sin(am), { align: 'center', baseline: 'middle', size: 19, weight: 700, color: on ? 'ink' : 'muted', math: false });
            });
            sP.text(`sufficient cause ${['I', 'II', 'III'][pi]}`, cx, cy + R + 0.32, { align: 'center', size: 12, color: 'muted' });
            if (done) sP.text('complete: disease', cx, cy - R - 0.3, { align: 'center', size: 12.5, weight: 700, color: 'red' });
          });
          { const cx = 11.6, cy = 1.55, R = 1.0, on = U[sel][6] < g; sP.circle(cx, cy, R, { fill: on ? 'gold' : 'muted', fillAlpha: on ? 0.75 : 0.1, color: on ? 'red' : 'ink', width: on ? 3 : 1.2 }); sP.text('G', cx, cy, { align: 'center', baseline: 'middle', size: 19, weight: 700, color: on ? 'ink' : 'muted' }); sP.text('unknown causes', cx, cy + R + 0.32, { align: 'center', size: 12, color: 'muted' }); if (on) sP.text('complete: disease', cx, cy - R - 0.3, { align: 'center', size: 12.5, weight: 700, color: 'red' }); }
          // people
          const d = [], h = []; let nd = 0;
          for (let i = 0; i < NP; i++) { const x = (i % 10) + 0.5, y = 9.5 - Math.floor(i / 10); if (dis(i)) { d.push([x, y]); nd++; } else h.push([x, y]); }
          sG.dots(h, { r: 5, color: 'blue', alpha: 0.45 }); sG.dots(d, { r: 6, color: 'red' });
          sG.circle((sel % 10) + 0.5, 9.5 - Math.floor(sel / 10), 0.46, { color: 'gold', width: 2.4 });
          // bars
          sB.setView([-0.6, 7.7], [0, Math.max(120, Math.ceil((sum * 100 + 10) / 20) * 20)]);
          sB.hline(100, { color: 'ink', width: 1.2, dash: [5, 4] }); sB.text('100% of cases', -0.55, 100, { dy: -9, align: 'left', size: 11, color: 'muted' });
          af.forEach((a, k) => { sB.rect(k - 0.36, 0, k + 0.36, 100 * a, { fill: COL[k], fillAlpha: k === rk ? 0.25 : 0.75, stroke: false }); sB.text(`${(100 * a).toFixed(0)}%`, k, 100 * a, { dy: -9, align: 'center', size: 11.5, weight: 600 }); });
          let acc = 0; af.forEach((a, k) => { sB.rect(6.1, 100 * acc, 6.9, 100 * (acc + a), { fill: COL[k], fillAlpha: 0.75, stroke: false }); acc += a; });
          sB.text(`${(100 * sum).toFixed(0)}%`, 6.5, 100 * sum, { dy: -9, align: 'center', size: 13, weight: 700, color: sum > 1.005 ? 'red' : 'ink' });
          st = { base, now, af, sum, nd };
        });
        function s_poly(s, pts, fill, fa, color, w, hatch) { s.poly(pts, { fill, fillAlpha: fa, color, width: w, hatch: hatch ? 'red' : undefined }); }
        v.legend([['red', 'complete pie / disease'], ['gold', 'selected person']]);
        v.readout(() => {
          if (!st) return '';
          const { base, now, af, sum, nd } = st;
          return `risk of disease with everyone as drawn: **${pcs(base)}**${rem.value === 'none' ? '' : `; with component ${rem.value} removed: **${pcs(now)}** (${nd} of the 100 people diseased)`}\nfraction of cases prevented by removing one component: ${af.map((a, k) => `${COMP[k]} ${(100 * a).toFixed(0)}%`).join(', ')} · sum **${(100 * sum).toFixed(0)}%**${sum > 1.005 ? ' — more than all the cases, because every case needs several components' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Principle',
      name: 'Bradford Hill viewpoints',
      statement: String.raw`To judge whether an association between an environmental exposure and a disease is causal, Austin Bradford Hill (1965) listed nine aspects of the association to consider once chance and bias have been looked at: **strength**, **consistency** across studies, **specificity**, **temporality** (cause before effect), **biological gradient** (dose–response), **plausibility**, **coherence** with what is known, **experiment**, and **analogy**. He insisted that none is a necessary condition except temporality, none a sufficient one, and that they are aids to the question “is there any other way of explaining the facts as satisfactorily?”, not a checklist to be scored.`,
      idea: String.raw`Each viewpoint is evidence of a different kind, and each can mislead. A confounder (4.6) can produce a strong, consistent, graded association; a real cause can be weak (cigarettes and coronary thrombosis), non-specific (smoking causes many diseases) or biologically implausible until the mechanism is found (Snow's cholera, 4.4). What the viewpoints cannot do is replace design: temporality is a matter of how the data were collected, and an experiment changes the exposure while breaking its links with confounders. The simulation below builds worlds where the cause is real, where it is only a marker of a hidden common cause, or where the disease changes the exposure, and shows which viewpoints can tell them apart.`,
      caption: String.raw`Choose the **world** that generates the data: the exposure really causes the disease, only a hidden common cause links them, or early disease changes the exposure (reverse causation). **Left**: risk of disease at five exposure levels (a cohort of 20 000). **Middle**: the risk ratio of the top against the bottom level in six independent studies of the chosen size. **Right**: the viewpoints that a simulation can check. Compare the confounded world with the causal one: strength, consistency and gradient look the same, and only the randomized experiment tells them apart. **New studies** draws fresh samples.`,
      scope: String.raw`The worlds are stylised simulations built for this page (a 10% disease frequency in the reverse-causation world, a hidden common cause with correlation 0.85 to the exposure); they are not data. Hill's own examples are discussed in the paper-item 4.17.`,
      deps: ['causal-1.1', 'epi-3.2'],
      refs: ['Rothman ch. 2', 'Gordis ch. 14'],
      credit: 'Austin Bradford Hill, 1965',
      tags: ['causal inference', 'evidence', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bradford_Hill_criteria', doi: '10.1177/003591576505800503' },
      viz(v) {
        const M = v.M;
        const world = v.select('world', [{ value: 'causal', label: 'the exposure causes the disease' }, { value: 'conf', label: 'a hidden common cause' }, { value: 'rev', label: 'the disease changes the exposure' }], 'conf');
        const str = v.slider('strength of the mechanism', 0.1, 1, 0.5, { step: 0.05 });
        const nS = v.slider('people per study', 300, 5000, 1500, { step: 100, int: true, log: true });
        let epoch = 0;
        v.button('New studies', () => { epoch++; });
        const sR = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xticks: [[0, 'none'], [1, 'low'], [2, 'mid'], [3, 'high'], [4, 'top']], xlabel: 'exposure level (fifths)', ylabel: 'risk of disease', title: 'one large cohort' });
        const sF = v.stage({ x: [0.25, 100], xlog: true, y: [0.3, 6.7], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xticks: [...RATIO_TICKS, [32, '32'], [64, '64']], yticks: [], xlabel: 'risk ratio, top vs bottom level', title: 'six studies' });
        const sC = v.stage({ x: [0, 1], y: [0, 10], axes: false, height: 300, weight: 1.15, minWidth: 300, title: 'the viewpoints' });
        const a = 0.85;
        function sim(kind, s, n, r, randomize) {
          const Z = new Float64Array(n), Z0 = new Float64Array(n), U = new Float64Array(n), D0 = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            const u = r.normal(), e = r.normal(), d0 = r() < 0.1 ? 1 : 0;
            U[i] = u; D0[i] = d0;
            const z = kind === 'conf' && !randomize ? a * u + Math.sqrt(1 - a * a) * e : e;
            Z0[i] = z; Z[i] = z + (kind === 'rev' && !randomize ? 1.6 * s * d0 : 0);
          }
          const quint = (arr) => { const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => arr[p] - arr[q]), X = new Uint8Array(n); idx.forEach((i, rank) => { X[i] = Math.floor((5 * rank) / n); }); return X; };
          const X = quint(Z), X0 = kind === 'rev' ? quint(Z0) : X;
          const cnt = [0, 0, 0, 0, 0], dz = [0, 0, 0, 0, 0]; let cases = 0, after = 0;
          for (let i = 0; i < n; i++) {
            let d;
            if (kind === 'rev') d = D0[i]; else if (kind === 'conf') d = r() < expit(-3 + 2.4 * s * U[i]) ? 1 : 0; else d = r() < expit(-3 + 0.9 * s * X[i]) ? 1 : 0;
            cnt[X[i]]++; dz[X[i]] += d; if (d) { cases++; if (X[i] > X0[i]) after++; }
          }
          const risk = cnt.map((c, k) => dz[k] / c), a4 = dz[4] || 0.5, a0 = dz[0] || 0.5;
          const rr = (a4 / cnt[4]) / (a0 / cnt[0]), se = Math.sqrt(1 / a4 - 1 / cnt[4] + 1 / a0 - 1 / cnt[0]);
          return { risk, rr, lo: rr * Math.exp(-1.96 * se), hi: rr * Math.exp(1.96 * se), afterShare: cases ? after / cases : 0 };
        }
        let key = '', S = null;
        const compute = () => {
          const k = `${world.value}|${str.value}|${nS.value}|${epoch}`;
          if (k === key) return; key = k;
          const r = M.rng(100 + epoch);
          S = { big: sim(world.value, str.value, 20000, M.rng(5), false), exp: sim(world.value, str.value, 20000, M.rng(6), true), studies: Array.from({ length: 6 }, (_, i) => sim(world.value, str.value, Math.round(nS.value), M.rng(1000 * (epoch + 1) + i), false)) };
        };
        let st = null;
        v.render(() => {
          compute();
          const { big, exp, studies } = S, col = { causal: 'green', conf: 'orange', rev: 'purple' }[world.value];
          // cohort
          const ymax = Math.max(0.1, ...big.risk) * 1.2; sR.setView([-0.6, 4.6], [0, ymax]);
          big.risk.forEach((p, k) => { sR.rect(k - 0.36, 0, k + 0.36, p, { fill: col, fillAlpha: 0.6, stroke: false }); sR.text(pcs(p), k, p, { dy: -9, align: 'center', size: 11.5, weight: 600 }); });
          // studies
          sF.vline(1, { color: 'ink', width: 1.2, dash: [5, 4] });
          studies.forEach((t, i) => { const y = 6 - i; sF.line(Math.max(0.26, t.lo), y, Math.min(95, t.hi), y, { color: col, width: 2.2 }); sF.dot(t.rr, y, { r: 5, color: col }); sF.text(`RR ${t.rr.toFixed(1)}`, 0.27, y, { dy: -10, size: 10.5, color: 'muted', align: 'left' }); });
          // scorecard
          const sig = studies.filter((t) => t.lo > 1).length, mono = big.risk.every((r, k) => k === 0 || r > big.risk[k - 1] * 1.02);
          const temp = 1 - big.afterShare;
          const rows = [
            ['strength', `RR ${big.rr.toFixed(1)}`, big.rr >= 3 ? 'green' : big.rr > 1.5 ? 'gold' : 'red'],
            ['consistency', `${sig} of 6 studies RR > 1`, sig >= 5 ? 'green' : sig >= 3 ? 'gold' : 'red'],
            ['specificity', 'one disease only: not simulated', 'muted'],
            ['temporality', `exposure first in ${(100 * temp).toFixed(0)}% of cases`, temp > 0.95 ? 'green' : 'red'],
            ['biological gradient', mono ? 'risk rises at every step' : 'no steady rise', mono ? 'green' : 'red'],
            ['plausibility', 'judgement: needs biology', 'muted'],
            ['coherence', 'judgement', 'muted'],
            ['experiment (randomize)', `RR ${exp.rr.toFixed(1)}`, exp.rr > 1.5 ? 'green' : 'red'],
            ['analogy', 'judgement', 'muted'],
          ];
          rows.forEach(([nm, res, c], i) => { const y = 9.2 - i * 1.0; sC.dot(0.045, y, { r: 6, color: c }); sC.text(nm, 0.1, y, { size: 12.5, weight: 700, baseline: 'middle' }); sC.text(res, 0.52, y, { size: 12, color: 'ink', baseline: 'middle' }); });
          st = { big, exp, sig, mono, temp };
        });
        v.legend([['green', 'supports a causal reading', { dot: true }], ['gold', 'weak', { dot: true }], ['red', 'against', { dot: true }], ['muted', 'cannot be simulated', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { big, exp, sig, mono, temp } = st;
          const verdict = world.value === 'conf' ? `**no causal effect at all**, yet strength (RR ${big.rr.toFixed(1)}), consistency (${sig}/6) and gradient all pass; only the randomized experiment (RR ${exp.rr.toFixed(1)}) reveals it` : world.value === 'rev' ? `**the disease causes the exposure**: strength and consistency pass, but only ${(100 * temp).toFixed(0)}% of cases had the exposure before the disease, and randomizing the exposure gives RR ${exp.rr.toFixed(1)}` : `**a real cause**: the association survives randomization (RR ${exp.rr.toFixed(1)})`;
          return `${verdict}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Event',
      name: 'John Snow and the Broad Street pump (1854)',
      statement: String.raw`In the cholera outbreak that began in Soho, London, at the end of August 1854, the physician John Snow plotted the fatal cases on a map and found them clustered around the public pump in Broad Street; on 7 September he persuaded the parish Board of Guardians, and the next day the pump handle was removed. The outbreak was already falling by then, a point Snow made himself, so the removal cannot be shown from the epidemic curve to have ended it. What made the case was the comparison: deaths decreased with distance from that pump, most of the dead lived nearer to it than to any other pump (62% by straight-line distance on the digitised map below; Snow himself used walking distance), and some apparent exceptions had explanations (workers at a nearby brewery had their own supply; a woman living far away had water from the pump sent to her). Snow's larger test of the water-borne hypothesis was the comparison of customers of two water companies in south London, where houses supplied from the more polluted source of the Southwark & Vauxhall Company suffered about 8 times the death rate of the Lambeth Company's (1,263 deaths in 40,046 houses against 98 in 26,107 in the first seven weeks).`,
      idea: String.raw`Snow reasoned by elimination from the pattern of cases in space and time, with the epidemic curve (1.11) giving the time and the map the place. Spatial clustering only suggests a common source; what turns it into evidence is the **dose gradient** (the closer to the pump, the more deaths per unit area) and the **exceptions that prove the rule**. The pump-handle story is the textbook example of an intervention whose effect cannot be read off a curve that was already declining: separating the effect of the intervention from the natural decline needs a counterfactual, which the curve alone does not supply.`,
      caption: String.raw`**Top left**: Snow's fatal attacks per day in 1854 (red: before the handle was taken off on 8 September) with a log-linear fit to the decline from a day you choose; the green curve continues that trend past the removal. **Right and bottom left**: the 578 deaths on Snow's map as digitised by Tobler; pick any of the 13 **pumps** and a **ring radius**: the bars show deaths per unit of map area in rings around the chosen pump. Around the Broad Street pump the density is far higher at short range and falls off; around any other pump it is low.`,
      scope: String.raw`The death coordinates are Tobler's digitisation of Snow's printed map in the map's own units (stacked deaths are counted individually, 578 of the 616 dated or undated fatal attacks in Snow's table); densities per unit of map area include streets and unbuilt ground, so they are a picture of clustering, not of risk. The log-linear trend line is a descriptive device for this page and is not Snow's analysis.`,
      deps: ['epi-1.11'],
      refs: ['Gordis ch. 1'],
      credit: 'John Snow, 1854',
      tags: ['cholera', 'mapping', 'history'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/1854_Broad_Street_cholera_outbreak' },
      viz(v) {
        const M = v.M, N = SNOW_DEATHS.length, ATT = SNOW_DATES.attacks, REM = 20;
        const fitFrom = v.slider('fit the decline from', 13, 18, 14, { step: 1, int: true, fmt: (i) => snowDay(i) });
        const pump = v.slider('pump', 1, SNOW_PUMPS.length, SNOW_BROAD + 1, { step: 1, int: true, fmt: (i) => SNOW_PUMPS[i - 1][0] });
        const rad = v.slider('ring radius (map units)', 0.5, 6, 2, { step: 0.1 });
        const sA = v.stage({ x: [-0.7, 42.7], y: [0, 160], axes: 'box', gutter: true, height: 270, weight: 1.25, minWidth: 320, xticks: [[0, '19 Aug'], [12, '31 Aug'], [20, '8 Sep'], [30, '18 Sep'], [42, '30 Sep']], ylabel: 'fatal attacks per day', title: 'the epidemic curve and the pump handle' });
        const sM = v.stage({ x: [6.2, 20.4], y: [3.4, 19.2], equal: true, axes: false, height: 330, weight: 1, minWidth: 300, title: 'Soho, 1854: deaths (dots) and pumps (triangles)' });
        const sD = v.stage({ x: [0, 8], y: [0, 10], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 280, xlabel: 'distance from the chosen pump (map units)', ylabel: 'deaths per unit area', title: 'deaths in rings around the pump' });
        const dist = (p, k) => Math.hypot(p[0] - SNOW_PUMPS[k][1], p[1] - SNOW_PUMPS[k][2]);
        let st = null;
        v.render(() => {
          const k = pump.value - 1, f0 = fitFrom.value;
          // epidemic curve and trend
          let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
          for (let i = f0; i < REM; i++) { const w = ATT[i] + 0.5, y = Math.log(ATT[i] + 0.5); sw += w; sx += w * i; sy += w * y; sxx += w * i * i; sxy += w * i * y; }
          const slope = (sw * sxy - sx * sy) / (sw * sxx - sx * sx), icpt = (sy - slope * sx) / sw;
          const pred = (i) => Math.exp(icpt + slope * i) - 0.5;
          ATT.forEach((a, i) => sA.rect(i - 0.4, 0, i + 0.4, a, { fill: i < REM ? 'red' : 'teal', fillAlpha: 0.7, stroke: false }));
          sA.vline(REM - 0.5, { color: 'ink', width: 1.4, dash: [4, 3] }); sA.text('handle removed 8 Sep', REM - 0.5, 150, { dx: 6, size: 11.5, weight: 600, align: 'left' });
          sA.curve((t) => [t, Math.max(0, pred(t))], f0, 42, { color: 'green', width: 2.4, dash: [6, 4] });
          const obsAfter = ATT.slice(REM).reduce((a, b) => a + b, 0), predAfter = Array.from({ length: 43 - REM }, (_, j) => Math.max(0, pred(REM + j))).reduce((a, b) => a + b, 0);
          // map
          const ds = SNOW_DEATHS.map((p) => dist(p, k));
          sM.circle(SNOW_PUMPS[k][1], SNOW_PUMPS[k][2], rad.value, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 2 });
          SNOW_DEATHS.forEach((p, i) => { /* batched below */ });
          const inside = [], outside = [];
          SNOW_DEATHS.forEach((p, i) => (ds[i] <= rad.value ? inside : outside).push(p));
          sM.dots(outside, { r: 2, color: 'ink', alpha: 0.55 }); sM.dots(inside, { r: 2.6, color: 'red' });
          SNOW_PUMPS.forEach((p, j) => { const X = p[1], Y = p[2], me = j === k; sM.poly([[X, Y + 0.3], [X - 0.26, Y - 0.18], [X + 0.26, Y - 0.18]], { fill: me ? 'gold' : j === SNOW_BROAD ? 'red' : 'panel', fillAlpha: 1, color: j === SNOW_BROAD ? 'red' : 'blue', width: 1.6 }); });
          sM.text('Broad St pump', SNOW_PUMPS[SNOW_BROAD][1], SNOW_PUMPS[SNOW_BROAD][2], { dy: 18, size: 12, weight: 700, color: 'red', align: 'center', plate: true });
          // density by ring
          const dr = 0.5, bins = Array.from({ length: 16 }, () => 0);
          ds.forEach((d) => { const b = Math.floor(d / dr); if (b < 16) bins[b]++; });
          const dens = bins.map((c, b) => c / (Math.PI * ((b + 1) * dr) ** 2 - Math.PI * (b * dr) ** 2));
          const ymax = Math.max(1, ...dens) * 1.15; sD.setView([0, 8], [0, ymax]);
          dens.forEach((d, b) => sD.rect(b * dr + 0.04, 0, (b + 1) * dr - 0.04, d, { fill: k === SNOW_BROAD ? 'red' : 'blue', fillAlpha: 0.6, stroke: false }));
          sD.vline(rad.value, { color: 'gold', width: 2 });
          st = { k, slope, obsAfter, predAfter, nIn: inside.length, nearest: SNOW_DEATHS.filter((p) => { let b = -1, bd = Infinity; SNOW_PUMPS.forEach((q, j) => { const d = dist(p, j); if (d < bd) { bd = d; b = j; } }); return b === k; }).length };
        });
        v.legend([['red', 'fatal attacks before the removal', { area: true }], ['teal', 'after', { area: true }], ['green', 'trend of the decline, continued', { dash: true }], ['gold', 'ring', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, slope, obsAfter, predAfter, nIn, nearest } = st;
          return `the attacks were falling by a factor ${v.fix(Math.exp(-slope), 2)} a day before the removal; continuing that trend predicts about **${v.fix(predAfter, 0)}** more fatal attacks from 8 September on, and ${obsAfter} were recorded, so the curve alone cannot isolate an effect of the handle\n${SNOW_PUMPS[k][0]}: **${nIn} of ${N}** deaths within ${v.fix(rad.value, 1)} map units; **${nearest}** of the ${N} are nearer (straight line) to this pump than to any other · Snow's water-company comparison: (1,263 ÷ 40,046) ÷ (98 ÷ 26,107) = **${v.fix(1263 / 40046 / (98 / 26107), 1)}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Event',
      name: 'Semmelweis and handwashing (1847)',
      statement: String.raw`In the First Obstetric Clinic of the Vienna General Hospital, staffed by doctors and medical students, many more women died of childbed fever than in the Second Clinic, which trained midwives: in 1841–46 the First lost 1,989 of 20,042 mothers (9.9%) and the Second 691 of 17,791 (3.9%). Ignaz Semmelweis concluded that examiners coming from the autopsy room carried “cadaverous matter” to the women, and from mid-May 1847 required everyone to wash their hands in chlorinated lime. The First Clinic's mortality, 18.3% in April 1847, dropped to a few per cent within weeks and was 1.3% in 1848, matching the midwives' clinic. Handwashing is the first documented hospital infection-control intervention backed by a before-and-after comparison.`,
      idea: String.raw`The comparison of the two clinics is a natural experiment: women were admitted to each on alternating days, and the one difference that fitted was who examined them. The mechanism is a chain of small risks, repeated at every examination: if each examination by contaminated hands carries a small risk, the woman's total risk compounds over her examinations (the form of the constant-rate law in 1.5), and cutting the contamination per examination by a fixed fraction cuts the deaths from the hands by nearly the same fraction. The model below is not Semmelweis's: it is the simplest chain that reproduces the before-and-after figures, and it shows how complete the washing had to be to bring the First Clinic down to the midwives' level and below.`,
      caption: String.raw`The curve is the **modelled mortality of the First Clinic** as a function of the **effectiveness of handwashing**: the fraction of contaminating examinations that washing removes. Drag the gold handle (or the sliders for the number of examinations per woman, the share of examinations by hands that had been in the dissecting room, and the background mortality). The dashed lines are the observed rates (First Clinic 1841–46 and 1848, Second Clinic 1841–46). Below, 1 000 women: red dots die from the hands, dark dots from the background causes. The defaults are tuned so that no washing gives 9.9% and the effectiveness needed to reach the 1848 rate is read off in the readout.`,
      scope: String.raw`An illustrative model, not Semmelweis's data or a fit to it: examinations are independent, and the per-examination risk of 3.8% is chosen so that the unwashed First Clinic matches the observed 9.9%. The observed rates are Semmelweis's tables (1861) as in item 4.15.`,
      deps: ['epi-3.2', 'epi-1.5'],
      refs: ['Gordis ch. 1'],
      credit: 'Ignaz Semmelweis, 1847',
      tags: ['hand hygiene', 'infection', 'history'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ignaz_Semmelweis' },
      viz(v) {
        const Y = SEMM_YEARLY.filter((r) => r[0] >= 1841 && r[0] <= 1846), sm = (k) => Y.reduce((a, r) => a + r[k], 0);
        const R1 = sm(2) / sm(1), R2 = sm(4) / sm(3), r48 = SEMM_YEARLY.find((r) => r[0] === 1848), R48 = r48[2] / r48[1];
        const nEx = v.slider('examinations per woman', 1, 20, 6, { step: 1, int: true });
        const fAut = v.slider('share of examinations by unwashed hands from the dissecting room', 0.05, 1, 0.4, { step: 0.01, fmt: (x) => pc(x, 0) });
        const bgm = v.slider('background mortality', 0, 0.03, 0.012, { step: 0.001, fmt: (x) => pcs(x) });
        const s = v.stage({ x: [0, 1], y: [0, 0.16], axes: 'box', gutter: true, height: 320, weight: 1.3, minWidth: 320, xlabel: 'effectiveness of handwashing', ylabel: 'deaths (% of births)', xticks: [0, 0.25, 0.5, 0.75, 1].map((x) => [x, `${100 * x}%`]), yticks: [0, 0.04, 0.08, 0.12, 0.16].map((y) => [y, `${100 * y}%`]), title: 'model: mortality in the First Clinic' });
        const sI = v.stage({ x: [0, 40], y: [0, 25], equal: true, axes: false, height: 320, weight: 1, minWidth: 280, title: '1 000 women' });
        const e = s.handle(0, 0.099, { color: 'gold', r: 8, labelPos: 'ne', constrain: (x) => [Math.max(0, Math.min(1, x)), 0] });
        // calibrate per-examination risk so that no washing gives the observed First Clinic rate
        const h = () => { const q = Math.pow((1 - R1) / (1 - bgm.value), 1 / nEx.value); return Math.min(1, (1 - q) / fAut.value); };
        const mort = (eff) => 1 - (1 - bgm.value) * Math.pow(1 - fAut.value * (1 - eff) * h(), nEx.value);
        let st = null;
        v.render(() => {
          const eff = e.x, hh = h();
          e.set(eff, mort(eff));
          s.fn((x) => mort(x), { color: 'blue', width: 2.6 });
          [[R1, 'First Clinic 1841–46', 'red', 0.3], [R2, 'Second Clinic 1841–46', 'purple', 0.98], [R48, 'First Clinic 1848', 'green', 0.98]].forEach(([r, lab, c, x]) => { s.hline(r, { color: c, width: 1.6, dash: [6, 4] }); s.text(`${lab}: ${pcs(r)}`, x, r, { dy: -9, size: 11.5, color: c, weight: 600, align: x > 0.5 ? 'right' : 'left' }); });
          const m = mort(eff), dBg = bgm.value, dHands = Math.max(0, m - dBg * (1 - m) / (1)) ;
          const nDead = Math.round(1000 * m), nBg = Math.round(1000 * dBg * Math.min(1, 1));
          iconArray(sI, 1000, 40, (i) => (i < Math.min(nBg, nDead) ? { color: 'ink', r: 3 } : i < nDead ? { color: 'red', r: 3 } : { color: 'blue', alpha: 0.3, r: 2.4 }), (i) => i);
          // effectiveness needed for the 1848 rate
          let lo = 0, hi = 1; if (mort(1) > R48) { lo = hi = NaN; } else if (mort(0) <= R48) { lo = hi = 0; } else for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (mort(mid) > R48) lo = mid; else hi = mid; }
          st = { m, nDead, hh, need: (lo + hi) / 2, eff };
        });
        v.legend([['red', 'deaths from contaminated hands', { dot: true }], ['ink', 'deaths from background causes', { dot: true }], ['blue', 'survive', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, nDead, hh, need, eff } = st;
          return `effectiveness ${pc(eff, 0)}: model mortality **${pcs(m)}** (${nDead} of 1 000 women) · risk per unwashed contaminating examination ${pcs(hh)} · observed: ${pcs(R1)} → ${pcs(R48)} (First Clinic, 1841–46 → 1848), risk ratio of the clinics in 1841–46 = ${v.fix(R1 / R2, 1)} · ${isNaN(need) ? 'the background alone exceeds the 1848 rate' : `washing must remove **${pc(need, 0)}** of contaminations to reach the 1848 rate`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'Confounding',
      statement: String.raw`A third variable $C$ **confounds** the effect of an exposure $E$ on a disease $D$ when it is a common cause of both (or marks one): the crude comparison of the exposed with the unexposed then mixes the effect of $E$ with the effect of $C$, and the crude risk ratio differs from the causal one. If $C$ is a confounder, comparing exposed and unexposed *within* levels of $C$, and then averaging, removes the bias:
$$\mathrm{RR}_{\text{crude}}=\frac{P(D\mid E=1)}{P(D\mid E=0)}\ne \mathrm{RR}_{\text{causal}}=\frac{\sum_c P(c)\,P(D\mid E=1,c)}{\sum_c P(c)\,P(D\mid E=0,c)} .$$
Not every variable associated with $E$ and $D$ should be adjusted for: a **mediator** on the path from $E$ to $D$ should not be (adjusting removes part of the effect one wants), and a **collider**, an effect of both, must not be (adjusting creates an association that did not exist).`,
      idea: String.raw`Confounding is a property of the causal structure, not of the numbers: the three variables below can have the same pairwise associations whether $C$ is a common cause, a link in the chain, or a common effect, and only the diagram says what to do. The back-door criterion (causal-4.3) turns this into a rule: adjust for a set that blocks all non-causal paths from $E$ to $D$ and opens none. The standardised estimate above is that adjustment for a single binary variable; the d-separation rules (causal-3.5) say why conditioning on a collider opens a path.`,
      caption: String.raw`Pick what **C** is in the diagram and set the true effect (the risk ratio of $E$ on $D$) and the strength of the links of C. The right panel shows, on a log scale, the crude risk ratio, the ratio within each stratum of C, and the ratio standardised over C, with the true causal effect as a dashed green line. With the true ratio at 1, a confounder alone produces an association; adjusting removes it. Switch C to a **mediator** or a **collider** and watch adjusting do harm. The gold ring marks the analysis you would report.`,
      scope: String.raw`Three binary variables with all links multiplicative (risk ratios) or on the odds scale, a baseline risk of 3%, and no other confounding. The collider and mediator worlds contain no confounding: the crude ratio is then the causal one (the total effect).`,
      deps: ['causal-1.1', 'causal-3.5'],
      refs: ['Rothman ch. 12', 'Gordis ch. 15'],
      tags: ['confounding', 'adjustment', 'causal diagrams'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confounding' },
      viz(v) {
        const kind = v.select('C is', [{ value: 'conf', label: 'a common cause (confounder)' }, { value: 'med', label: 'on the pathway (mediator)' }, { value: 'coll', label: 'a common effect (collider)' }], 'conf');
        const adj = v.toggle('adjust for C', false);
        const rrE = v.slider('true effect of E on D (risk ratio)', 0.25, 4, 1, { log: true, sig: 2 });
        const orCE = v.slider('link C–E (odds ratio)', 1, 12, 4, { log: true, sig: 2 });
        const rrCD = v.slider('link C–D (risk ratio, or odds ratio for the collider)', 1, 8, 4, { log: true, sig: 2 });
        const sG = v.stage({ x: [0, 10], y: [0, 6.2], equal: true, axes: false, height: 290, weight: 1, minWidth: 270, title: 'the causal diagram' });
        const sR = v.stage({ x: [0.2, 24], xlog: true, y: [-0.8, 3.9], axes: 'box', gutter: true, height: 290, weight: 1.2, minWidth: 300, xticks: RATIO_TICKS, yticks: [], xlabel: 'risk ratio of E on D', title: 'what the analysis estimates' });
        const r0 = 0.03;
        function joint(k, RE, OE, RC) {
          const J = [[[0, 0], [0, 0]], [[0, 0], [0, 0]]]; // J[c][e][d]
          for (let c = 0; c < 2; c++) for (let e = 0; e < 2; e++) for (let d = 0; d < 2; d++) {
            let pr;
            if (k === 'conf') { const pe = fromOdds(0.25 * (c ? OE : 1)), rk = r0 * RE ** e * RC ** c; pr = (c ? 0.3 : 0.7) * (e ? pe : 1 - pe) * (d ? rk : 1 - rk); }
            else if (k === 'med') { const pc1 = fromOdds(0.25 * (e ? OE : 1)), rk = r0 * RE ** e * RC ** c; pr = (e ? 0.4 : 0.6) * (c ? pc1 : 1 - pc1) * (d ? rk : 1 - rk); }
            else { const rk = r0 * RE ** e, pc1 = fromOdds(0.25 * OE ** e * RC ** d); pr = (e ? 0.4 : 0.6) * (d ? rk : 1 - rk) * (c ? pc1 : 1 - pc1); }
            J[c][e][d] = pr;
          }
          return J;
        }
        function est(J) {
          const tot = (c, e) => J[c][e][0] + J[c][e][1], risk = (c, e) => J[c][e][1] / tot(c, e);
          const pe = (e) => tot(0, e) + tot(1, e), crude = ((J[0][1][1] + J[1][1][1]) / pe(1)) / ((J[0][0][1] + J[1][0][1]) / pe(0));
          const w = [tot(0, 0) + tot(0, 1), tot(1, 0) + tot(1, 1)];
          return { crude, s0: risk(0, 1) / risk(0, 0), s1: risk(1, 1) / risk(1, 0), std: (w[0] * risk(0, 1) + w[1] * risk(1, 1)) / (w[0] * risk(0, 0) + w[1] * risk(1, 0)) };
        }
        const node = (x, y, lab, sub, col, sq, up) => { sG.dot(x, y, { r: 24, color: col, hollow: false }); sG.text(lab, x, y, { align: 'center', baseline: 'middle', size: 18, weight: 700, color: 'panel' }); sG.text(sub, x, y, { dy: up ? -38 : 38, align: 'center', size: 11.5, color: 'muted' }); if (sq) sG.rect(x - 0.7, y - 0.7, x + 0.7, y + 0.7, { color: 'gold', width: 3, fill: false, radius: 6 }); };
        const edge = (x1, y1, x2, y2, strength, col, dash) => { const w = 1.4 + 2.2 * Math.abs(Math.log2(strength)) / 3; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; sG.arrow(x1 + ux * 0.85, y1 + uy * 0.85, x2 - ux * 0.95, y2 - uy * 0.95, { color: col, width: Math.min(6, w), dash }); };
        let st = null;
        v.render(() => {
          const k = kind.value, J = joint(k, rrE.value, orCE.value, rrCD.value), e = est(J);
          const truth = k === 'med' ? e.crude : rrE.value;
          const E = [1.6, 1.6], D = [8.4, 1.6], C = k === 'conf' ? [5, 5] : [5, 4.8];
          edge(E[0], E[1], D[0], D[1], Math.max(rrE.value, 1.05), 'green', Math.abs(Math.log(rrE.value)) < 0.03 ? [5, 4] : undefined);
          if (k === 'conf') { edge(C[0], C[1], E[0], E[1], orCE.value, 'red'); edge(C[0], C[1], D[0], D[1], rrCD.value, 'red'); }
          if (k === 'med') { edge(E[0], E[1], C[0], C[1], orCE.value, 'orange'); edge(C[0], C[1], D[0], D[1], rrCD.value, 'orange'); }
          if (k === 'coll') { edge(E[0], E[1], C[0], C[1], orCE.value, 'purple'); edge(D[0], D[1], C[0], C[1], rrCD.value, 'purple'); }
          node(E[0], E[1], 'E', 'exposure', 'blue'); node(D[0], D[1], 'D', 'disease', 'red'); node(C[0], C[1], 'C', { conf: 'confounder', med: 'mediator', coll: 'collider' }[k], 'ink', adj.value, true);
          // estimates
          sR.vline(truth, { color: 'green', width: 2, dash: [6, 4] }); sR.vline(1, { color: 'ink', width: 1, alpha: 0.5 });
          sR.text('causal effect', truth, 3.75, { dx: 6, size: 11.5, color: 'green', weight: 600, align: 'left' });
          sR.dot(adj.value ? e.std : e.crude, adj.value ? 0 : 3, { r: 12, hollow: true, color: 'gold', width: 3 });
          const rows = [['crude', e.crude, 3, 'ink'], ['within C = 0', e.s0, 2, 'blue'], ['within C = 1', e.s1, 1, 'blue'], ['adjusted for C', e.std, 0, 'accent']];
          rows.forEach(([lab, val, y, col]) => { sR.dot(Math.max(0.21, Math.min(23.5, val)), y, { r: 7, color: col }); sR.text(`${lab}: ${val.toFixed(2)}`, 0.22, y, { dy: -14, size: 12, weight: 600, align: 'left' }); });
          st = { e, truth, used: adj.value ? e.std : e.crude };
        });
        v.legend([['gold', 'the analysis you report', { dot: true }], ['green', 'true causal effect', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { e, truth, used } = st, bias = used / truth;
          return `crude **${v.fix(e.crude, 2)}**, within strata ${v.fix(e.s0, 2)} and ${v.fix(e.s1, 2)}, standardised **${v.fix(e.std, 2)}**, true effect **${v.fix(truth, 2)}** · reported (${adj.value ? 'adjusted' : 'crude'}) ${v.fix(used, 2)}: ${Math.abs(Math.log(bias)) < 0.02 ? 'unbiased' : `biased by a factor ${v.fix(bias, 2)}`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Event',
      name: 'Doll and Hill: smoking and lung cancer (1950–2004)',
      statement: String.raw`In 1950 Richard Doll and Austin Bradford Hill reported that, in London hospitals, patients with lung cancer were far more often smokers than matched patients with other diseases; in 1951 they began a prospective study of British doctors (34,439 men analysed over 50 years) whose reports of 1954 and 1956 found lung cancer death rates rising steeply with the amount smoked, from about 0.07 per 1,000 men a year among non-smokers to about 1.7 in those smoking 25 or more cigarettes a day. The 2004 report of the full 50 years found that men born 1900–30 who smoked only cigarettes lived on average about 10 years less than lifelong non-smokers and that stopping at age 60, 50, 40 or 30 gained about 3, 6, 9 or 10 years. The statistician Jerome Cornfield and colleagues (1959) answered the argument that a hidden constitutional factor might cause both smoking and cancer: such a factor would have to be at least as many times more common among smokers as the observed risk ratio.`,
      idea: String.raw`Two designs reached the same answer from opposite directions (cases back to exposure, exposure forward to cases), which weakens any bias particular to one; the dose gradient and the fall in risk after quitting are evidence of the kind Hill listed (4.3); and Cornfield's inequality converts the size of the effect into a quantitative requirement for any confounder. If a confounder $U$ has prevalence $p_0$ among non-smokers, it can be at most $1/p_0$ times as common among smokers, so it cannot account for any observed risk ratio larger than $1/p_0$. A risk ratio of about 24 needs a factor present in under 4% of non-smokers and in nearly all smokers. (Modern sensitivity analysis, the E-value, is the same idea.)`,
      caption: String.raw`Switch between the **1950 case–control study** (odds ratio of non-smoking, from the 649 men with lung cancer and 649 controls) and the **cohort** (risk ratios by cigarettes a day, relative to non-smokers). The gold line is Cornfield's bound for a hidden confounder with the prevalence among non-smokers that you set: any bar **above the line** cannot be explained away by it. At the right, drag the handle to the **age at which a smoker stopped** and read the life gained (the 2004 report).`,
      scope: String.raw`The case–control counts are from the 1950 paper (item 4.16) and the 2004 numbers from the 50-year report; the 1951–55 death rates per 1,000 men a year by amount smoked (0.07, 0.47, 0.86, 1.66) are quoted from memory of the 1956 report and secondary sources and are not verified. Cornfield's inequality is a necessary condition on a confounder, not a test of the causal claim.`,
      deps: ['epi-4.3', 'epi-3.6'],
      refs: ['Gordis ch. 14'],
      credit: 'Richard Doll & Austin Bradford Hill, 1950; Doll, Peto, Boreham & Sutherland, 2004; Cornfield et al., 1959',
      tags: ['smoking', 'cohort', 'history'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/British_Doctors_Study', doi: '10.1136/bmj.38142.554479.ae' },
      viz(v) {
        const view = v.select('evidence', [{ value: 'cc', label: '1950 case–control' }, { value: 'co', label: 'cohort, 1951–55 deaths' }], 'co');
        const p0 = v.slider('hidden confounder: prevalence among non-smokers', 0.01, 0.5, 0.04, { log: true, sig: 2, fmt: (x) => pcs(x) });
        const sB = v.stage({ x: [-0.6, 3.6], y: [0, 30], axes: 'box', gutter: true, height: 300, weight: 1.2, minWidth: 300, ylabel: 'ratio', title: 'how large is the association?' });
        const sQ = v.stage({ x: [25, 65], y: [0, 12], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280, xlabel: 'age at which a cigarette smoker stopped', ylabel: 'years of life gained', xticks: [30, 40, 50, 60].map((x) => [x, `${x}`]), title: 'stopping: 2004 report' });
        const RATES = [['none', 0.07], ['1–14 a day', 0.47], ['15–24', 0.86], ['25 or more', 1.66]];
        // case-control counts (Doll & Hill 1950, men): non-smokers 2 of 649 cases, 27 of 649 controls
        const cc = (() => { const a = 2, b = 647, c = 27, d = 622, or = (b * c) / (a * d), se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d); return { or, lo: or * Math.exp(-1.96 * se), hi: or * Math.exp(1.96 * se) }; })();
        const GAIN = [[30, 10], [40, 9], [50, 6], [60, 3]];
        const gain = (a) => { const q = GAIN; if (a <= q[0][0]) return q[0][1]; for (let i = 1; i < q.length; i++) if (a <= q[i][0]) return q[i - 1][1] + ((q[i][1] - q[i - 1][1]) * (a - q[i - 1][0])) / (q[i][0] - q[i - 1][0]); return q[q.length - 1][1]; };
        const H = sQ.handle(50, 6, { color: 'gold', r: 8, constrain: (x) => { const a = Math.max(30, Math.min(60, x)); return [a, gain(a)]; } });
        let st = null;
        v.render(() => {
          const cap = 1 / p0.value;
          sB.hline(1, { color: 'ink', width: 1, alpha: 0.5 });
          const cc1 = view.value === 'cc';
          let bars;
          if (cc1) { bars = [[cc.or, 'smokers vs non-smokers', 'red']]; sB.setView([0.3, 3.7], [0, 70]); sB.setTicks([[2, 'smokers vs non-smokers (men)']], null); }
          else { bars = RATES.slice(1).map(([lab, r]) => [r / RATES[0][1], lab, 'orange']); sB.setView([0.3, 3.7], [0, 30]); sB.setTicks([[1, '1–14 a day'], [2, '15–24 a day'], [3, '25 or more']], null); }
          sB.setLabels(undefined, cc1 ? 'odds ratio of lung cancer' : 'death-rate ratio, lung cancer');
          bars.forEach(([val, lab, col], i) => {
            const x = cc1 ? 2 : i + 1;
            sB.rect(x - 0.38, 0, x + 0.38, val, { fill: col, fillAlpha: 0.65, stroke: false });
            if (cc1) { sB.line(x, cc.lo, x, cc.hi, { color: 'ink', width: 2 }); sB.text(`${val.toFixed(1)}  (95% CI ${cc.lo.toFixed(1)}–${cc.hi.toFixed(0)})`, x, cc.hi, { dy: -10, align: 'center', size: 12, weight: 700 }); }
            else sB.text(val.toFixed(1), x, val, { dy: 14, align: 'center', size: 13, weight: 700 });
          });
          sB.hline(cap, { color: 'gold', width: 2.6 }); sB.text(`confounder bound: ${cap.toFixed(1)}`, 0.35, cap, { dy: -9, size: 11.5, color: 'gold', weight: 700, align: 'left', plate: true });
          // stopping
          sQ.path(GAIN.map(([a, g]) => [a, g]), { color: 'blue', width: 2.4 }); sQ.dots(GAIN, { r: 5, color: 'blue' });
          GAIN.forEach(([a, g]) => sQ.text(`${g}`, a, g, { dy: -12, size: 11.5, color: 'blue', weight: 600, align: 'center' }));
          sQ.hline(10, { color: 'ink', width: 1, dash: [4, 4] }); sQ.text('smoking all along: about 10 years lost', 64.5, 10, { dy: 12, size: 11, color: 'muted', align: 'right' });
          st = { cap, gainNow: gain(H.x) };
        });
        v.readout(() => {
          if (!st) return '';
          const { cap, gainNow } = st;
          const need = view.value === 'cc' ? cc.or : RATES[3][1] / RATES[0][1];
          return `case–control odds ratio (647 × 27) ÷ (2 × 622) = **${v.fix(cc.or, 1)}**; cohort ratios ${RATES.slice(1).map(([, r]) => v.fix(r / RATES[0][1], 1)).join(', ')} · Cornfield: a confounder with ${pcs(p0.value)} prevalence among non-smokers can explain at most **${v.fix(cap, 1)}**-fold; the ${view.value === 'cc' ? 'odds ratio' : 'heaviest-smoking group'} (${v.fix(need, 1)}) ${need > cap ? 'is **beyond** that bound: no such confounder can explain it' : 'could in principle be explained by such a confounder'} · stopping at ${v.fix(H.x, 0)} gains about **${v.fix(gainNow, 1)}** years (interpolated between the four published ages)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Concept',
      name: 'Confounding by indication',
      statement: String.raw`When a treatment is given *because of* a prognostic factor (typically the severity of the disease), treated and untreated patients differ in their baseline risk and a naive comparison of outcomes is **confounded by indication**. If sicker patients are more likely to be treated, the treated may fare worse on average even when the drug lowers the risk at every level of severity: with severity $S$, treatment $T$ and outcome $D$,
$$P(D\mid T=1)>P(D\mid T=0)\quad\text{although}\quad P(D\mid T=1,S=s)<P(D\mid T=0,S=s)\ \text{ for all } s .$$
Adjusting for severity restores the right sign provided severity is measured well; if it is measured with error, some confounding remains (**residual confounding**).`,
      idea: String.raw`Severity is a common cause of treatment and outcome, the confounder of 4.6 in its most clinical form, and Simpson's paradox (causal-4.4) is the pattern in the numbers. Randomization (causal-2.1) is the cure because it cuts the arrow from severity to treatment; observational studies of treatments therefore have to measure the reasons for prescribing, and the adjustment is only as good as the measurement of them. Because the reasons are often unrecorded (frailty, the clinician's impression), adjustment for a noisy proxy of severity leaves part of the bias in place, which is why such studies can persistently show harm from useful drugs.`,
      caption: String.raw`A hypothetical drug and a continuous baseline severity. **Top left**: how many treated and untreated patients there are at each severity: the stronger the **indication**, the further treated patients sit to the right. **Top right**: the true risk of death at each severity with and without the drug (the drug **lowers** it by the odds ratio you set), with each group's overall risk as dashed lines. **Bottom**: the crude risk ratio, the ratio standardised over a **measured severity** (drag the reliability below 1 to add measurement error), and the true causal ratio. Set the indication to zero and the bias disappears.`,
      scope: String.raw`An illustrative model: severity is normal, treatment is logistic in severity, the baseline risk of death is logistic in severity, and the drug acts on the odds of death. The "true" causal risk ratio is the risk ratio if everyone were treated against if no one were. The numbers are not from any real drug.`,
      deps: ['epi-4.6'],
      refs: ['Rothman ch. 12'],
      tags: ['confounding', 'bias', 'treatment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confounding_by_indication' },
      viz(v) {
        const orD = v.slider('drug: odds ratio for death (below 1 helps)', 0.25, 1.6, 0.6, { log: true, sig: 2 });
        const kS = v.slider('strength of the indication', 0, 2, 1.2, { step: 0.05 });
        const rel = v.slider('reliability of the severity measure', 0.2, 1, 1, { step: 0.02, fmt: (x) => pc(x, 0) });
        const sA = v.stage({ x: [-3.5, 3.5], y: [0, 0.5], axes: 'box', gutter: true, height: 240, weight: 1, minWidth: 260, xlabel: 'baseline severity', ylabel: 'share of all patients', yticks: [], title: 'who gets the drug' });
        const sB = v.stage({ x: [-3.5, 3.5], y: [0, 1], axes: 'box', gutter: true, height: 240, weight: 1, minWidth: 260, xlabel: 'baseline severity', ylabel: 'risk of death', title: 'what the drug does at each severity' });
        const sC = v.stage({ x: [0.25, 8], xlog: true, y: [-0.7, 2.9], axes: 'box', gutter: true, height: 190, full: true, xticks: [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8']], yticks: [], xlabel: 'risk ratio for death, treated vs untreated', title: 'what an analysis would conclude' });
        const grid = Array.from({ length: 161 }, (_, i) => -4 + 0.05 * i), phi = (x, m = 0, sd = 1) => Math.exp(-0.5 * ((x - m) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
        let key = '', R = null;
        function calc() {
          const k = `${orD.value}|${kS.value}|${rel.value}`; if (k === key) return R; key = k;
          const lo = Math.log(orD.value), pT = grid.map((s) => expit(-1 + kS.value * s)), pD = (t, s) => expit(-1.8 + 1.2 * s + lo * t), w = grid.map((s) => phi(s) * 0.05);
          let nT = 0, dT = 0, nU = 0, dU = 0, R1 = 0, R0 = 0;
          grid.forEach((s, i) => { nT += w[i] * pT[i]; dT += w[i] * pT[i] * pD(1, s); nU += w[i] * (1 - pT[i]); dU += w[i] * (1 - pT[i]) * pD(0, s); R1 += w[i] * pD(1, s); R0 += w[i] * pD(0, s); });
          let adj;
          const vv = (1 - rel.value) / rel.value;
          if (vv < 1e-6) adj = R1 / R0;
          else {
            const sdS = Math.sqrt(1 + vv), n = 121; let a1 = 0, a0 = 0, ws = 0;
            for (let j = 0; j < n; j++) {
              const ss = -4 * sdS + (8 * sdS * j) / (n - 1), ww = phi(ss, 0, sdS), m = ss / (1 + vv), sd = Math.sqrt(vv / (1 + vv));
              let g = grid.map((s) => phi(s, m, sd)), gs = g.reduce((a, b) => a + b, 0); g = g.map((x) => x / gs);
              let n1 = 0, d1 = 0, n0 = 0, d0 = 0;
              grid.forEach((s, i) => { n1 += g[i] * pT[i]; d1 += g[i] * pT[i] * pD(1, s); n0 += g[i] * (1 - pT[i]); d0 += g[i] * (1 - pT[i]) * pD(0, s); });
              a1 += ww * (n1 > 1e-12 ? d1 / n1 : 0); a0 += ww * (n0 > 1e-12 ? d0 / n0 : 0); ws += ww;
            }
            adj = a1 / a0;
          }
          R = { crude: dT / nT / (dU / nU), rT: dT / nT, rU: dU / nU, adj, truth: R1 / R0, pTall: nT, pD, pT, w };
          return R;
        }
        let st = null;
        v.render(() => {
          const r = calc();
          sA.fn((s) => phi(s) * expit(-1 + kS.value * s), { color: 'orange', fill: true, width: 2 }); sA.fn((s) => phi(s) * (1 - expit(-1 + kS.value * s)), { color: 'blue', fill: true, width: 2 });
          sA.text('treated', 1.8, 0.13, { color: 'orange', weight: 700, size: 12.5, align: 'left' }); sA.text('untreated', -2.7, 0.3, { color: 'blue', weight: 700, size: 12.5, align: 'left' });
          sB.fn((s) => r.pD(0, s), { color: 'blue', width: 2.6 }); sB.fn((s) => r.pD(1, s), { color: 'orange', width: 2.6 });
          sB.hline(r.rU, { color: 'blue', width: 1.6, dash: [6, 4] }); sB.hline(r.rT, { color: 'orange', width: 1.6, dash: [6, 4] });
          sB.text(`all treated: ${pcs(r.rT)}`, -3.4, r.rT, { dy: r.rT > r.rU ? -9 : 12, size: 11.5, color: 'orange', weight: 600, align: 'left' }); sB.text(`all untreated: ${pcs(r.rU)}`, -3.4, r.rU, { dy: r.rT > r.rU ? 12 : -9, size: 11.5, color: 'blue', weight: 600, align: 'left' });
          sC.vline(1, { color: 'ink', width: 1.2, dash: [5, 4] });
          [['crude', r.crude, 2, 'red'], ['standardised for measured severity', r.adj, 1, 'accent'], ['true causal effect', r.truth, 0, 'green']].forEach(([lab, val, y, col]) => { sC.dot(val, y, { r: 8, color: col }); sC.text(`${lab}: ${val.toFixed(2)}`, 0.27, y, { dy: -14, size: 12, weight: 600, align: 'left' }); });
          st = r;
        });
        v.readout(() => {
          if (!st) return '';
          const r = st;
          return `treated patients are ${pcs(r.pTall)} of the cohort · crude risk ratio **${v.fix(r.crude, 2)}** (${r.crude > 1 ? 'the drug looks harmful' : 'the drug looks protective'}), adjusted for the measured severity **${v.fix(r.adj, 2)}**, true **${v.fix(r.truth, 2)}**${r.crude > 1 && r.truth < 1 ? ' — the sign is wrong until severity is adjusted for' : ''}${Math.abs(r.adj - r.truth) > 0.02 ? ` · residual confounding: ${v.fix(r.adj / r.truth, 2)}-fold` : ''}`;
        });
      },
    },
  ],
};
