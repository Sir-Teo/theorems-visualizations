// Solid Mechanics & Structures — Chapter 4, part b (items 4.6–4.10): residual stress, fatigue (S–N, Miner, Goodman), plastic collapse
//
// The fatigue pictures use the illustrative S–N model of ch04.shared.js (a straight line on log–log axes between 0.9 Su at 10^3 cycles and
// the endurance strength Se; Se = 0.5 Su for steel at 10^6 cycles, 0.3 Su at 5·10^8 cycles for aluminium): a textbook idealisation, not test data;
// scatter is a seeded log-normal model. Credits checked: Miner 1945 (Crossref 10.1115/1.4009458), Drucker–Greenberg–Prager 1951 (AMS review record).
// From memory (flagged verify): Wöhler 1850s–70, Basquin 1910, Palmgren 1924, Goodman 1899 (Wikipedia: book "Mechanics Applied to Engineering"),
// Gerber, Soderberg, Gvozdev, Kazinczy, Marco–Starkey (the nonlinear damage model of 4.8 is a generic illustration with invented exponents).

import { num as num0, rad, SN, snStress, snLife, cyc, curveOf } from './ch04.shared.js';

const num = (x, d = 1) => num0(x, d).replace('-', '−');
void curveOf;

export default {
  collection: 'solid',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Residual stresses after plastic loading',
      statement: String.raw`Let a structure in which different parts are forced to deform together (a statically indeterminate set of bars, a beam, a plate with a hole) be loaded so that some parts yield and others stay elastic, and then be completely unloaded. Unloading is elastic and linear (4.5), so the stresses after unloading are the stresses at the peak load **minus** the purely elastic response to the same load. They do not vanish: the **residual stresses** form a self-equilibrated field (zero resultant force and moment), and they are opposite in sign to the plastic strains that caused them: the parts that yielded in tension are left in compression, the elastic parts in tension.`,
      idea: String.raw`Compatibility (1.10) forces all bars to share one strain, and equilibrium fixes the total force. Beyond first yield the bars that yielded carry the constant force $\sigma_yA$ and the elastic ones carry the rest. On unloading every bar recovers along a line of slope $E$ (4.5) by the *same* strain, so the stress drop is the same in all bars of equal stiffness, but they started from different stresses; the differences remain. As long as no bar yields again in reverse, residual $=$ peak $-$ elastic solution, and the sum of the forces is still zero.`,
      caption: String.raw`Three bars of equal area and stiffness connect two rigid plates; the two outer bars yield at $250$ MPa and the centre bar (a stronger alloy) at $450$ MPa. Pull to a peak strain (in units of the outer bars' yield strain) and then reduce the load with the second slider: at $0\%$ load the bars are left with locked-in stresses although nothing pulls on them (blue tension, red compression). The plot shows each bar's path in the $\sigma$–$\varepsilon$ plane. Pull to less than $\varepsilon_y$ and nothing is left over; pull far enough and the centre bar yields too and the residual stresses change again.`,
      deps: ['solid-4.5','solid-1.10','solid-8.3','mech-6.4'],
      refs: ['Gere–Goodno §2.12'],
      tags: ['plasticity', 'residual stress'],
      scope: String.raw`Rate-independent elastic–perfectly plastic bars with a common Young's modulus, small strains, no reverse yielding unless the plot shows it. The syllabus sketch (three bars of unequal length) is replaced by three equal-length bars of different strength: the mechanism (an elastic part forced to carry the unloading of a plastically deformed part) is the same.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Residual_stress' },
      viz(v) {
        const E = 200000, Ar = 200, ys = [250, 450, 250], ey = 250 / E, cols = ['orange', 'accent', 'orange'];
        const pk = v.slider('peak strain $\\varepsilon_{\\max}/\\varepsilon_y$', 0, 3.5, 2.2, { step: 0.05 });
        const lam = v.slider('load as % of the peak load', 0, 100, 0, { step: 1 });
        const A = v.stage({ x: [-3.2, 3.2], y: [-1.1, 5.2], equal: true, axes: false, height: 380, title: 'three bars between rigid plates' });
        const B = v.stage({ x: [-0.4, 4], y: [-520, 520], axes: 'box', gutter: true, height: 380, xlabel: 'ε/εy', ylabel: 'σ (MPa)', title: 'σ–ε path of each bar' });
        v.legend([['orange', 'outer bars (σy = 250 MPa)'], ['accent', 'centre bar (σy = 450 MPa)']]);
        const F = (sg) => (sg[0] + sg[1] + sg[2]) * Ar / 1000; // kN
        const upd = (sg, de) => sg.map((s, i) => Math.max(-ys[i], Math.min(ys[i], s + E * de)));
        function run(p, l) {
          let sg = [0, 0, 0], e = 0; const h = [[[0, 0]], [[0, 0]], [[0, 0]]], de = 0.01 * ey, push = () => sg.forEach((s, i) => h[i].push([e / ey, s]));
          while (e < p * ey - 1e-12) { const st = Math.min(de, p * ey - e); sg = upd(sg, st); e += st; push(); }
          const Fp = F(sg), tg = (l / 100) * Fp, sgp = sg.slice(); let g = 0;
          while (F(sg) > tg + 1e-9 && g++ < 3000) {
            const s2 = upd(sg, -de), F1 = F(sg), F2 = F(s2);
            if (F2 <= tg) { const t = (F1 - tg) / (F1 - F2); sg = sg.map((s, i) => s + t * (s2[i] - s)); e -= t * de; push(); break; }
            sg = s2; e -= de; push();
          }
          return { sg, e, h, Fp, sgp };
        }
        let R = run(pk.value, lam.value);
        v.render(() => {
          R = run(pk.value, lam.value);
          const { sg, e, h } = R, top = 4 + 0.3 * (e / ey);
          A.rect(-2.6, 4, 2.6, 4.45 + 0.3 * (e / ey), { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.35 });
          A.rect(-2.6, -0.45, 2.6, 0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.35 });
          const xs = [-1.6, 0, 1.6];
          sg.forEach((s, i) => {
            const t = Math.min(1, Math.abs(s) / ys[i]);
            A.rect(xs[i] - 0.4, 0, xs[i] + 0.4, top, { color: Math.abs(s) >= ys[i] - 1e-6 ? 'ink' : 'muted', width: Math.abs(s) >= ys[i] - 1e-6 ? 3 : 1.2, fill: s >= 0 ? 'accent' : 'red', fillAlpha: 0.08 + 0.5 * t });
            A.text(`${num(s, 0)} MPa`, xs[i], -0.85, { size: 12, color: s >= 0 ? 'accent' : 'red', align: 'center' });
            A.text(i === 1 ? 'strong bar' : 'bar', xs[i], 2, { size: 11, color: 'ink', align: 'center' });
          });
          const P = F(sg), pl = lam.value / 100;
          if (P > 1) { A.arrow(0, top + 0.5, 0, top + 0.5 + Math.min(0.9, P / 150), { color: 'gold', width: 4 }); }
          A.text(`load ${num(P, 1)} kN`, 0, top + 1.8, { size: 12, color: 'ink', align: 'center' });
          void pl;
          B.hline(0, { color: 'faint', width: 1 });
          [0, 1].forEach((i) => B.path(h[i], { color: cols[i], width: 2.6 }));
          [0, 1].forEach((i) => B.dot(e / ey, sg[i], { r: 6, color: cols[i] }));
          B.vline(Math.max(0, e / ey), { color: 'muted', width: 1, dash: [4, 4] });
        });
        v.readout(() => {
          const { sg, sgp, e } = R, P = F(sg), p = pk.value;
          const elastic = p <= 1.8, mean = (2 * 250 + 250 * p) / 3;
          const th = elastic && p >= 1 && lam.value === 0 ? ` · Theory (centre still elastic at the peak): outer $=250-\\tfrac13(500+250\\,\\varepsilon_{\\max}/\\varepsilon_y)=${num(250 - mean, 1)}$, centre $=${num(250 * p - mean, 1)}$ MPa.` : '';
          return `Stresses (outer, centre, outer): $(${num(sg[0], 1)},\\,${num(sg[1], 1)},\\,${num(sg[2], 1)})$ MPa at peak $(${num(sgp[0], 0)},\\,${num(sgp[1], 0)},\\,${num(sgp[2], 0)})$; strain $${num(e / ey, 2)}\\,\\varepsilon_y$. · Equilibrium: load $\\sum A\\sigma_i=${num(P, 3)}$ kN${lam.value === 0 ? ' — the bars carry no external load, yet the stresses above are not zero, and sum to zero' : ''}.${th}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Fatigue: S–N curves and the endurance limit',
      statement: String.raw`A metal part subjected to a repeated stress of amplitude $S$ well below its yield strength can still fail after $N$ cycles. Plotted as stress amplitude $S$ against the number of cycles to failure $N$ (the **S–N** or Wöhler curve), the data fall on a falling curve that is nearly straight on log–log axes (Basquin's law $S=S_f'(2N)^b$). Some steels show an approximately flat regime near $10^6$–$10^7$ cycles at the **endurance limit** $S_e$: below it, the idealized model predicts unlimited life; a finite run-out test does not prove this. Most non-ferrous metals, aluminium among them, show no such limit, and are quoted by their **fatigue strength** at a stated number of cycles (often $5\times10^8$). The scatter in life at fixed amplitude can be large; the example uses an explicitly chosen log-life spread.`,
      idea: String.raw`Cyclic slip builds persistent bands, from which microcracks start at the surface and grow a little every cycle until the remaining section fails in one overload. A high stress amplitude produces a crack in a few cycles, a lower one takes many orders of magnitude longer. Under some conditions small fatigue cracks can arrest; an endurance plateau is an empirical idealization rather than a universal guarantee for steel. The life depends on the stress amplitude, not on the peak stress alone, as Wöhler found with railway axles in the nineteenth century.`,
      caption: String.raw`Choose the material and move the amplitude slider: the dots are ten simulated specimens tested at that amplitude (seeded log-normal scatter, **model data**, press Resample for another batch). For steel the amplitude can be pushed below the endurance limit, and the hollow dots at $10^7$ cycles are run-outs (the test is stopped without failure). For aluminium the curve keeps falling. On the right, the fully reversed load history of one test.`,
      deps: ['solid-1.3'],
      refs: ['Roylance, MIT Fatigue, pp.1–4; GeorgiaTech primary Ni-fatigue dissertation, §4.2, Eq.(4.1), p.62'],
      tags: ['fatigue', 'S-N curve'],
      scope: String.raw`High-cycle fatigue of smooth specimens under fully reversed stress ($R=-1$). The curves are an illustrative idealisation: $S=0.9S_u$ at $10^3$ cycles, $S_e=0.5S_u$ at $10^6$ cycles for steel ($S_u=490$ MPa), $0.3S_u$ at $5\times10^8$ cycles for aluminium ($S_u=310$ MPa); real curves depend on surface, size, temperature and environment.`,
      credit: 'Wöhler stress–life curves and the Basquin power-law model',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/S-N_curve' },
      viz(v) {
        const mat = v.select('material', [{ value: 'steel', label: 'steel' }, { value: 'al', label: 'aluminium' }], 'steel');
        const Sa = v.slider('stress amplitude $S$ (MPa)', 80, 440, 300, { step: 1 });
        let seed = 7;
        v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [1e3, 1e9], y: [0, 480], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'cycles to failure N', ylabel: 'stress amplitude S (MPa)', title: 'S–N curve and ten simulated tests' });
        const B = v.stage({ x: [0, 4], y: [-480, 480], axes: 'box', gutter: true, height: 380, xlabel: 'time (cycles)', ylabel: 'σ (MPa)', title: 'the load history', xticks: [0, 1, 2, 3, 4] });
        v.legend([['accent', 'S–N curve'], ['gold', 'failed specimen', { dot: true }], ['muted', 'run-out (no failure)', { dot: true }]]);
        const tests = (m, S) => {
          const r = v.rng(seed * 1000 + Math.round(S)), Nm = snLife(m, S), out = [];
          for (let i = 0; i < 10; i++) {
            const z = r.normal(), n = Number.isFinite(Nm) ? 10 ** (Math.log10(Nm) + 0.25 * z) : Infinity;
            const stop=m.limit?1e7:1e9;out.push(n>stop?{N:stop,run:true}:{N:n,run:false});
          }
          return { Nm, out };
        };
        v.render(() => {
          const m = SN[mat.value], S = Sa.value;
          const sample=tests(m,S);A.setView([Math.min(1e3,...sample.out.map(o=>o.N))*.8,1.3e9],[0,480]);
          A.fn((N) => snStress(m, N), { color: m.color, width: 3, domain: [1e3, 1e9], n: 400 });
          if (m.limit) { A.hline(m.Se, { color: 'muted', width: 1, dash: [5, 4] }); A.text(`endurance limit S_e = ${m.Se} MPa`, 8e8, m.Se + 14, { size: 12, color: 'muted', align: 'right' }); }
          else { A.dot(m.Nk, m.Se, { r: 4, color: 'muted', hollow: true }); A.text('strength at 5·10⁸ cycles', 4e8, m.Se - 28, { size: 12, color: 'muted', align: 'right' }); }
          A.hline(S, { color: 'gold', width: 1.2, dash: [4, 4] });
          const t = tests(m, S);
          t.out.forEach((o, i) => {
            const y = S + (i % 2 ? 1 : -1) * 0; // all on the amplitude line
            A.dot(o.N, y, { r: 5.5, color: o.run ? 'muted' : 'gold', hollow: o.run });
            if (o.run) A.arrow(o.N * 1.2, y, o.N * 5, y, { color: 'muted', width: 1.4, head: 6 });
          });
          A.vline(1e3, { color: 'faint', width: 1 });
          // waveform
          const Ss = Math.min(S, 470);
          B.fn((x) => Ss * Math.sin(2 * Math.PI * x), { color: 'gold', width: 2.4, domain: [0, 4], n: 200 });
          B.hline(m.Se, { color: 'muted', width: 1, dash: [5, 4] }); B.hline(-m.Se, { color: 'muted', width: 1, dash: [5, 4] });
          B.text(m.limit?'±S_e':'±S(N_k)', 3.95, m.Se + 24, { size: 12, color: 'muted', align: 'right' });
        });
        v.readout(() => {
          const m = SN[mat.value], S = Sa.value, N = snLife(m, S), t = tests(m, S), ru = t.out.filter((o) => o.run).length;
          const f = t.out.filter((o) => !o.run).map((o) => o.N);
          return `${m.name}, $S=${S}$ MPa ($${num((100 * S) / m.Su, 0)}\\,\\%$ of $S_u=${m.Su}$): ${Number.isFinite(N) ? `median life $N\\approx${cyc(N)}$ cycles` : `**below the endurance limit** $S_e=${m.Se}$ MPa: unlimited life in this idealized model`}. · Batch: ${f.length} failed${f.length ? ` (shortest $${cyc(Math.min(...f))}$, longest $${cyc(Math.max(...f))}$)` : ''}, ${ru} run-out${ru === 1 ? '' : 's'}. · The curve is a straight line in $\\log S$–$\\log N$: each factor 10 in life costs a factor $${num(10 ** (-Math.log10(snStress(m, 1e5) / snStress(m, 1e4))), 3)}$ in strength between $10^4$ and $10^5$ cycles.${S>m.Sy ? " Above model yield strength: high-cycle extrapolation, not a calibrated prediction." : ""}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Law',
      name: 'Miner’s rule for cumulative damage',
      statement: String.raw`A part is loaded in blocks, $n_i$ cycles at stress amplitude $S_i$, and an S–N curve (4.7) says that constant amplitude $S_i$ would cause failure after $N_i$ cycles. **Miner's rule** assumes that each block uses up the fraction $n_i/N_i$ of the part's life independently of the order, and that failure occurs when the fractions add to one:
$$D=\sum_i\frac{n_i}{N_i}=1 .$$
Amplitudes at or below the endurance limit contribute no damage in the simplest form of the rule. The rule is linear and independent of sequence. Real damage can depend on sequence, overloads and evolving cracks; the nonlinear comparison below is invented to illustrate that limitation, not a measured uncertainty range.`,
      idea: String.raw`The rule treats damage as a conserved quantity, like a fuel gauge: a cycle at amplitude $S_i$ always spends $1/N_i$ of it, whatever the history. It is exact if the damage per cycle depends only on the present amplitude; real crack growth is not like that, because a crack started at a high amplitude has already grown and then the low amplitude cycles propagate it further (that is why high-first sequences fail early), while overloads can retard growth later. Despite this, the rule is the standard first estimate for variable-amplitude fatigue, and it makes load spectra countable (4.7).`,
      caption: String.raw`Two amplitudes (high $S_h$ and low $S_l$) are applied in blocks; the first high block has $aN_h$ cycles and the first low block has $(1-a)N_l$ cycles. In the linear limit these are matching cycle counts in either order. Left: damage against cycles (log axis) for the order high→low (red) and low→high (blue). With the nonlinear option off, both reach $D=1$ exactly (Miner). With it on, damage follows $D=(n/N)^{x}$ with an exponent that grows with $N$: a generic **illustrative model** with invented exponents, not fitted to data. Right: the Miner sum $\sum n_i/N_i$ at failure for each reference fraction $a$: below one for high-first, above one for low-first, and equal to one everywhere under the linear rule.`,
      deps: ['solid-4.7'],
      refs: ['Roylance, MIT Fatigue, pp.4–6, Miner Eq.(1)'],
      tags: ['fatigue', 'damage'],
      credit: 'Linear cumulative-damage model',
      scope: String.raw`Variable-amplitude loading at stresses above the endurance limit, crack initiation dominated life; ignores sequence, mean-stress and overload effects, so its accuracy depends on the material and load history. Historical priority is not asserted here. S–N values are the illustrative steel curve of 4.7.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fatigue_(material)#Miner%27s_rule' },
      viz(v) {
        const m = SN.steel;
        const Sh = v.slider('high amplitude $S_h$ (MPa)', 300,440,380,{step:1,onChange:x=>{if(Sl.value>x)Sl.set(x)}});
        const Sl = v.slider('low amplitude $S_l$', 260,380,290,{step:1,onChange:x=>{if(Sh.value<x)Sh.set(x)}});
        const a = v.slider('high-block cycle fraction $a$ (linear reference)', 0.02, 0.98, 0.5, { step: 0.01 });
        const nl = v.toggle('nonlinear damage (illustrative)', true);
        const A = v.stage({ x: [10, 1e6], y: [0, 1.15], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'cycles n', ylabel: 'damage D', title: 'damage against cycles for the two orders' });
        const B = v.stage({ x: [0, 1], y: [0.4, 1.8], axes: 'box', gutter: true, height: 380, xlabel:'reference high-block cycle fraction a', ylabel: 'Miner sum Σ n/N at failure', title: 'sum of cycle ratios at failure' });
        v.legend([['red', 'high → low'], ['accent', 'low → high'], ['muted', 'Miner: D = Σ n/N = 1', { dash: true }]]);
        const xp = (N) => (nl.value ? Math.min(1.2, Math.max(0.4, 0.5 + 0.12 * (Math.log10(N) - 2))) : 1);
        // two-block failure: first level P (N1), second Q (N2), D after first block = a
        const seq = (N1, N2, aa) => {
          const x1=xp(N1),x2=xp(N2),r1=aa,r2=1-aa**(x1/x2);
          return { x1, x2, n1: r1 * N1, n2: r2 * N2, sum: r1 + r2 };
        };
        const Nh = () => snLife(m, Sh.value), Nl = () => snLife(m, Sl.value);
        v.render(() => {
          const hi = Sh.value, N1h = snLife(m, hi), N2l = snLife(m, Sl.value);
          A.hline(1, { color: 'muted', width: 1.2, dash: [5, 4] });
          const path=(N1,N2,share,col)=>{
            const q=seq(N1,N2,share),pts=[];
            for (let i = 0; i <= 60; i++) { const n = Math.max(.001,q.n1/1000)*(q.n1/Math.max(.001,q.n1/1000))**(i/60); pts.push([n, (n / N1) ** q.x1]); }
            const r0=share**(q.x1/q.x2);
            for (let i = 0; i <= 80; i++) { const n2 = (q.n2 * i) / 80; pts.push([q.n1 + n2, Math.min(1, (n2 / N2 + r0) ** q.x2)]); }
            A.path(pts, { color: col, width: 2.8 });
            A.dot(q.n1 + q.n2, 1, { r: 6, color: col });
            A.dot(q.n1,share**q.x1, { r: 4.5, color: col, hollow: true });
            return q;
          };
          A.setView([.9*Math.min(a.value*N1h,(1-a.value)*N2l)/1000,Math.max(N1h,N2l)*1.15],[0,1.15]);path(N1h,N2l,a.value,'red');path(N2l,N1h,1-a.value,'accent');
          B.hline(1, { color: 'muted', width: 1.4, dash: [5, 4] });
          B.fn((x) => seq(N1h, N2l, x).sum, { color: 'red', width: 2.6, domain: [0.02, 0.98], n: 97 });
          B.fn((x) => seq(N2l,N1h,1-x).sum, { color: 'accent', width: 2.6, domain: [0.02, 0.98], n: 97 });
          B.vline(a.value, { color: 'gold', width: 1.2, dash: [4, 4] });
          B.dot(a.value, seq(N1h, N2l, a.value).sum, { r: 6, color: 'red' }); B.dot(a.value, seq(N2l,N1h,1-a.value).sum, { r: 6, color: 'accent' });
        });
        v.readout(() => {
          const hi = snLife(m, Sh.value), lo = snLife(m, Sl.value), q1 = seq(hi, lo, a.value), q2=seq(lo,hi,1-a.value);
          return `$N_h=${cyc(hi)}$, $N_l=${cyc(lo)}$ cycles. · High→low: $n_h=${cyc(q1.n1)}$, then $n_l=${cyc(q1.n2)}$; $\\sum n/N=${num(q1.sum, 3)}$. · Low→high: $n_l=${cyc(q2.n1)}$, then $n_h=${cyc(q2.n2)}$; $\\sum n/N=${num(q2.sum, 3)}$. · Total life: ${num((q1.n1 + q1.n2) / 1, 0)} against ${num(q2.n1 + q2.n2, 0)} cycles (linear-limit cycle counts match between the orders).${nl.value ? '' : ' Linear rule: both sums are exactly 1.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Law',
      name: 'Goodman relation for mean stress',
      statement: String.raw`Fatigue strength falls when the cycle has a tensile mean stress. For a stress that oscillates with amplitude $\sigma_a$ about the mean $\sigma_m$ (so $\sigma_{\max,\min}=\sigma_m\pm\sigma_a$), the **Goodman relation** takes the safe boundary to be the straight line joining the fully reversed endurance limit $S_e$ on the $\sigma_a$-axis to the ultimate strength $S_u$ on the $\sigma_m$-axis:
$$\frac{\sigma_a}{S_e}+\frac{\sigma_m}{S_u}=\frac1n,$$
$n$ being the factor of safety for a load line through the origin. Variants replace the line by Gerber's parabola $\frac{\sigma_a}{S_e}+\big(\frac{\sigma_m}{S_u}\big)^2=1$ or by Soderberg's line to the yield strength $S_y$. Compressive mean stress is usually left at $\sigma_a=S_e$, and symmetric tension/compression yielding is checked separately by $\max(|\sigma_{\max}|,|\sigma_{\min}|)=|\sigma_m|+\sigma_a\le S_y$.`,
      idea: String.raw`A tensile mean stress opens the microcracks of 4.7 and speeds their growth, so less alternating stress is tolerable; at the extreme $\sigma_a=0$ the part is simply loaded statically to its strength. The straight line is the simplest interpolation between these two experimentally anchored points. Test data for ductile metals tend to lie between the Goodman line (conservative) and the Gerber parabola (closer to the data), and Soderberg's line is more conservative still.`,
      caption: String.raw`Drag the gold operating point in the $(\sigma_m,\sigma_a)$ plane: the point is safe if it lies under the Goodman line and under the symmetric yield boundary $\sigma_a+|\sigma_m|=S_y$. The dashed ray is the load line through the origin; where it meets each boundary gives that criterion's safety factor. The right panel shows the stress cycle your point stands for. Values for $S_e$ are the model values of 4.7 ($S_e=0.5S_u$ for steel; $0.3S_u$ for aluminium, taken at $5\times10^8$ cycles).`,
      deps: ['solid-4.7'],
      refs: ['Roylance, MIT Fatigue, p.4 Goodman diagram; RamaMachineDesign lectures29–30, pp.142–148'],
      tags: ['fatigue', 'mean stress'],
      credit: 'Goodman/Gerber/Soderberg mean-stress models',
      scope: String.raw`Ductile metals under uniaxial high-cycle fatigue, load line with constant ratio $\sigma_a/\sigma_m$. Goodman's line is a conservative design rule, not a law of nature. Model material constants are illustrative. No beneficial compressive mean-stress correction is assumed; symmetric yielding is checked at both peaks.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Goodman_relation' },
      viz(v) {
        const mat = v.select('material', [{ value: 'steel', label: 'steel' }, { value: 'al', label: 'aluminium' }], 'steel');
        const showG = v.toggle('Gerber parabola', true), showS = v.toggle('Soderberg line', false);
        const A = v.stage({ x: [-200, 560], y: [0, 300], axes: 'box', gutter: true, height: 380, xlabel: 'mean stress σm (MPa)', ylabel: 'alternating stress σa (MPa)', title: 'Haigh diagram' });
        const B = v.stage({ x: [0, 3], y: [-520, 520], axes: 'box', gutter: true, height: 380, xlabel: 'time (cycles)', ylabel: 'σ (MPa)', title: 'the stress cycle', xticks: [0, 1, 2, 3] });
        const H = A.handle(180, 90, { color: 'gold', r: 8, constrain: (x, y) => [Math.max(-200, Math.min(560, x)), Math.max(0, Math.min(300, y))] });
        v.legend([['accent', 'Goodman'], ['purple', 'Gerber'], ['teal', 'Soderberg'], ['red','yield |σm| + σa = Sy']]);
        const mm = () => SN[mat.value];
        const good = (m, sm) => (sm <= 0 ? m.Se : Math.max(0, m.Se * (1 - sm / m.Su)));
        v.render(() => {
          const m = mm(), sm = H.x, sa = H.y;
          A.fn((x) => good(m, x), { color: 'accent', width: 3, domain: [-200, m.Su], n: 120, fill: true, base: 0 });
          A.hline(m.Se, { color: 'faint', width: 1, dash: [4, 4] });
          if (showG.value) A.fn((x) => (x <= 0 ? m.Se : Math.max(0, m.Se * (1 - (x / m.Su) ** 2))), { color: 'purple', width: 2.2, domain: [-200, m.Su], n: 160 });
          if (showS.value) A.fn((x) => (x <= 0 ? m.Se : Math.max(0, m.Se * (1 - x / m.Sy))), { color: 'teal', width: 2.2, domain: [-200, m.Sy], n: 100 });
          A.path([[-200,m.Sy-200],[0,m.Sy],[m.Sy,0]],{color:'red',width:2.2});
          A.line(0, 0, sm * 1.5 + 0, sa * 1.5, { color: 'muted', width: 1.2, dash: [4, 4] });
          const safe=sa<=good(m,sm)&&sa+Math.abs(sm)<=m.Sy;B.setView([0,3],[Math.min(-520,1.12*(sm-sa)),Math.max(520,1.12*(sm+sa))]);
          A.dot(sm, sa, { r: 7, color: safe ? 'green' : 'red' });
          A.text('Su', m.Su, 14, { size: 12, color: 'muted', align: 'center' }); A.text(`S_e = ${m.Se}`, -190, m.Se + 14, { size: 12, color: 'muted', align: 'left' });
          B.fn((x) => sm + sa * Math.sin(2 * Math.PI * x), { color: 'gold', width: 2.4, domain: [0, 3], n: 200 });
          B.hline(sm, { color: 'muted', width: 1, dash: [4, 4] }); B.hline(0, { color: 'faint', width: 1 });
          B.hline(m.Sy, { color: 'red', width: 1, dash: [5, 4] });
        });
        v.readout(() => {
          const m = mm(), sm = H.x, sa = H.y, mx = sm + sa, mn = sm - sa;
          const nG=1/(sa/m.Se+Math.max(sm,0)/m.Su);
          const qa = (sm / m.Su) ** 2, qb = sa / m.Se, nGe = sm > 0 ? (2/(qb+Math.sqrt(qb*qb+4*qa))) : nG;
          const nY=m.Sy/(Math.abs(sm)+sa);
          const f = (x) => (Number.isFinite(x) ? num(x, 2) : '∞');
          return `$\\sigma_m=${num(sm, 0)}$, $\\sigma_a=${num(sa, 0)}$ MPa → $\\sigma_{\\max}=${num(mx, 0)}$, $\\sigma_{\\min}=${num(mn, 0)}$, $R=${mx !== 0 ? num(mn / mx, 2) : '—'}$. · Safety factors: Goodman $n=${f(nG)}$, Gerber $n=${f(nGe)}$ (where the same ray meets the parabola), yield $n_y=${f(nY)}$ → **${Math.min(nG, nY) >= 1 ? 'safe' : 'unsafe'}** by Goodman and yield. · Goodman line: $\\sigma_a=S_e(1-\\sigma_m/S_u)$ with $S_e=${m.Se}$, $S_u=${m.Su}$, $S_y=${m.Sy}$ MPa.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Plastic collapse: lower- and upper-bound theorems',
      statement: String.raw`Consider a structure of elastic–perfectly plastic material (4.5) under proportional loading $\lambda\mathbf P_0$, with true collapse load factor $\lambda_c$ (the load at which it deforms without limit). Then:
(a) **Lower bound (static theorem).** If there is a stress field (or bending-moment distribution) that is in equilibrium with $\lambda\mathbf P_0$ and violates the yield condition nowhere, then $\lambda\le\lambda_c$: the structure certainly carries $\lambda\mathbf P_0$.
(b) **Upper bound (kinematic theorem).** If there is a mechanism (a pattern of hinges and rigid motions) for which the work of $\lambda\mathbf P_0$ equals the energy dissipated in the hinges, then $\lambda\ge\lambda_c$: the structure certainly cannot carry more.
(c) When one admissible field and one mechanism give the same $\lambda$, that is the collapse load. The result is stated for small displacements, a convex yield condition and associated flow (maximum plastic dissipation); the example drawn is a beam fixed at both ends with a point load at mid-span, with plastic moment $M_p$.`,
      idea: String.raw`For (a), compare the equilibrium field with the true collapse state: the difference of the two stress fields is in equilibrium with a load difference, and the virtual-work principle (solid-8.3, the static case of mech-6.4) together with the fact that the real field is at yield in the hinges gives $\lambda\le\lambda_c$. For (b), the work of the real, yielded state on the mechanism cannot exceed the maximum dissipation allowed by the yield condition, which the mechanism's hinges attain. For the fixed-ended beam, equilibrium gives $M_C+\tfrac12(M_A+M_B)=PL/4$ (with end moments counted hogging), and each moment is at most $M_p$ in size; the mechanism with hinges at the ends and the centre gives $P\,\tfrac L2\theta=M_p(\theta+2\theta+\theta)$. Both give $8M_p/L$. Statically indeterminate structures (1.10) show the point: collapse needs several hinges, and not the first one.`,
      caption: String.raw`**Left (lower bound):** choose the end moments $m_A,m_B$ (hogging) with the sliders; the moment diagram stays inside the plastic band $\pm M_p$ and the largest load it can carry in equilibrium is shown. **Middle (upper bound):** drag the interior hinge along the span; the beam rotates about the end hinges and the hinge you placed, and the work balance gives a load that is never below the collapse load. **Right:** the bounds squeezed on one line: the lower one climbs as you raise the end moments to $M_p$, the upper one falls as the middle hinge moves to mid-span, and both meet at $8M_p/L$.`,
      deps: ['solid-4.5','solid-1.10','solid-8.3','mech-6.4'],
      refs: ['Bower, Applied Mechanics of Solids §§6.2.1–6.2.5, complete bounding-theorem derivations'],
      tags: ['plasticity', 'limit analysis'],
      credit: 'Plastic limit-analysis bounds',
      scope: String.raw`Rigid- or elastic–perfectly plastic structures, small displacements, proportional loading, no instability or fracture. For beams, the yield condition is $|M|\le M_p$. Associated flow and maximum plastic dissipation are required. The beam example uses a symmetric moment capacity; no unverified historical priority is asserted.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Plastic_analysis' },
      viz(v) {
        const Mp = 100, L = 6, Pc = (8 * Mp) / L; // kN·m, m, kN
        const mA = v.slider('end moment $m_A$ (kN·m, hogging)', -100, 100, 0, { step: 1 });
        const mB = v.slider('end moment $m_B$', -100, 100, 0, { step: 1 });
        const A = v.stage({ x: [0, L], y: [-135, 135], axes: 'box', gutter: true, height: 340, xlabel: 'x (m)', ylabel: 'M (kN·m, sagging +)', title: 'a safe moment diagram (lower bound)' });
        const B = v.stage({ x: [-0.4, L + 0.4], y: [-1.5, 2.4], equal: true, axes: false, height: 340, title: 'a collapse mechanism (upper bound)' });
        const C = v.stage({ x: [0, 2.2 * Pc], y: [0, 1], axes: 'box', gutter: true, height: 190, xlabel: 'load P (kN)', title: 'the bounds on the collapse load', full: true });
        const Hh = B.handle(L / 4, 0, { color: 'gold', r: 8, constrain: { x: [0.4, L - 0.4], y: [0, 0] } });
        v.legend([['green', 'lower bound'], ['red', 'upper bound'], ['ink', 'collapse load 8Mp/L']]);
        const lower = () => (4 * (Mp + (mA.value + mB.value) / 2)) / L;
        const upper = (x) => {
          // unit deflection at the interior hinge; rotations θA = 1/x, θB = 1/(L−x), θx = θA+θB; load point at L/2
          const tA = 1 / x, tB = 1 / (L - x), W = Mp * (tA + tB + tA + tB);
          const dL = L / 2 <= x ? (L / 2) / x : (L - L / 2) / (L - x);
          return { P: W / dL, tA, tB, dL };
        };
        v.render(() => {
          const x = Hh.x, u = upper(x), Pl = lower();C.setView([0,Math.max(2.2*Pc,1.08*u.P)],[0,1]);
          // moment diagram for the load Pl
          const M0 = -mA.value, M1 = Pl * L / 4 - (mA.value + mB.value) / 2, M2 = -mB.value; // end, centre (sagging), end
          A.rect(0, -Mp, L, Mp, { color: 'orange', width: 1.2, fill: 'orange', fillAlpha: 0.07 });
          A.hline(Mp, { color: 'orange', width: 1.4, dash: [5, 4] }); A.hline(-Mp, { color: 'orange', width: 1.4, dash: [5, 4] });
          A.text('+Mp', 0.05, Mp + 14, { size: 12, color: 'orange', align: 'left' }); A.text('−Mp', 0.05, -Mp - 14, { size: 12, color: 'orange', align: 'left' });
          A.poly([[0, 0], [0, M0], [L / 2, M1], [L, M2], [L, 0]], { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2.6 });
          A.dots([[0, M0], [L / 2, M1], [L, M2]], { r: 5, color: 'green' });
          A.text(`P = ${num(Pl, 1)} kN`, L / 2, 118, { size: 12, color: 'green', align: 'center' });
          // mechanism
          const s = 0.9, xh = x, defl = (t) => (t <= xh ? (t / xh) * s : ((L - t) / (L - xh)) * s);
          B.line(0, 0, L, 0, { color: 'faint', width: 1.2, dash: [4, 4] });
          B.path([[0, 0], [xh, s], [L, 0]], { color: 'red', width: 4 });
          B.dot(0, 0, { r: 7, color: 'red' }); B.dot(L, 0, { r: 7, color: 'red' }); B.dot(xh, s, { r: 7, color: 'red' });
          B.text('hinge', 0.15, -0.35, { size: 11, color: 'red', align: 'left' }); B.text('hinge', L - 0.15, -0.35, { size: 11, color: 'red', align: 'right' });
          B.arrow(L / 2, defl(L / 2) + 1.2, L / 2, defl(L / 2) + 0.12, { color: 'ink', width: 3 });
          B.dot(L / 2, defl(L / 2), { r: 4, color: 'ink' }); B.text(`P = ${num(u.P, 1)} kN`, L / 2 + 0.2, defl(L / 2) + 1.2, { size: 12, color: 'red', align: 'left' });
          B.rect(-0.1, -1.1, 0.0, 1.0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.4 }); B.rect(L, -1.1, L + 0.1, 1.0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.4 });
          // bounds
          C.rect(Pl, 0.35, u.P, 0.65, { color: 'orange', width: 1, fill: 'orange', fillAlpha: 0.2 });
          C.line(Pc, 0.2, Pc, 0.8, { color: 'ink', width: 2 });
          C.dot(Pl, 0.5, { r: 8, color: 'green' }); C.dot(u.P, 0.5, { r: 8, color: 'red' });
          C.text('lower', Pl, 0.9, { size: 12, color: 'green', align: 'center' }); C.text('upper', u.P, 0.9, { size: 12, color: 'red', align: 'center' });
          C.text('8Mp/L', Pc, 0.08, { size: 12, color: 'ink', align: 'center' });
        });
        v.readout(() => {
          const Pl = lower(), u = upper(Hh.x), gap = u.P - Pl;
          return `$M_p=${Mp}$ kN·m, $L=${L}$ m. · Lower bound: $P=\\tfrac4L\\big(M_p+\\tfrac{m_A+m_B}2\\big)=${num(Pl, 1)}$ kN. · Upper bound (hinge at $x=${num(Hh.x, 2)}$ m): internal work $M_p(\\theta_A+\\theta_x+\\theta_B)=${num(Mp * 2 * (u.tA + u.tB), 1)}$ per unit deflection, load-point deflection ${num(u.dL, 3)} → $P=${num(u.P, 1)}$ kN (equals $4M_p/\\min(x,L-x)$). · Collapse load $8M_p/L=${num(Pc, 1)}$ kN lies between: ${num(Pl, 1)} ≤ ${num(Pc, 1)} ≤ ${num(u.P, 1)}; gap ${num(gap, 1)} kN${gap < 0.01 * Pc ? ' — the bounds have met' : ''}.`;
        });
      },
    },
  ],
};
void rad;
