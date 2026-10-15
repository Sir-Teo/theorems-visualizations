// Human Physiology — Chapter 1: Homeostasis and membrane transport (part b: 1.7–1.12)
import {
  VT, ION_COL, ION_Z, NEURON, SQUID, HK_REST, HK_PEAK, nernst, ghkV, ghkFlux, ghkCurrent,
  clamp, rk4, trace, idxAt, clocked, bilayer, PL, pumpLeak,
} from './ch01.shared.js';

// ---------- helpers for this file ----------
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
/** A small ion disc with its charge sign. */
function ion(s, x, y, kind, r = 0.17, alpha = 1) {
  s.circle(x, y, r, { fill: ION_COL[kind], fillAlpha: 0.85 * alpha, color: ION_COL[kind], width: 1, alpha });
}
/** Cannon (1.12): three small regulated systems, each with its effectors. */
function cannonRun(sc, fb) {
  const out = { t: [], x: [], e1: [], e2: [] };
  if (sc === 'meal' || sc === 'fast') {
    // glucose (mg/dL) and relative insulin; counter-regulation switches on below 68 mg/dL (Schwartz et al. 1987)
    const U0 = 1.0, kI = 0.012, H0 = U0 + kI * 90, Hcr = 2.6, tauI = 15;
    const meal = (t) => (sc === 'meal' && t > 30 ? (150 * (t - 30)) / 625 * Math.exp(-(t - 30) / 25) : 0);
    const ex = (t) => (sc === 'fast' && t > 30 && t < 240 ? 1.15 : 0);
    const sec = (G) => Math.max(0, (G - 70) / 20), cr = (G) => clamp((68 - G) / 12, 0, 1);
    const f = (y, t) => { const [G, I] = y; return [meal(t) + H0 + (fb ? Hcr * cr(G) : 0) - kI * I * G - U0 - ex(t), ((fb ? sec(G) : 1) - I) / tauI]; };
    let y = [90, 1];
    for (let k = 0, dt = 0.5; k <= 720; k++) { const t = k * dt; out.t.push(t); out.x.push(y[0]); out.e1.push(clamp(y[1] / 2.5, 0, 1)); out.e2.push(fb ? cr(y[0]) : 0); y = rk4(f, y, t, dt); y[0] = Math.max(y[0], 20); }
    return out;
  }
  if (sc === 'cold') {
    // core temperature (°C), hours; vasoconstriction first (threshold 37.0 °C), shivering second (36.8 °C)
    const C = 245e3, M0 = 80, k = 80 / 12;
    const av = (T) => (fb ? clamp((37 - T) / 0.25, 0, 1) : 0), sh = (T) => (fb ? clamp((36.8 - T) / 0.5, 0, 1) : 0);
    const Ta = (t) => (t < 0.5 ? 25 : 5);
    const f = (y, t) => [(3600 * (M0 + 320 * sh(y[0]) - k * (1 - 0.45 * av(y[0])) * (y[0] - Ta(t)))) / C];
    let y = [37];
    for (let i = 0, dt = 0.01; i <= 600; i++) { const t = i * dt; out.t.push(t); out.x.push(y[0]); out.e1.push(av(y[0])); out.e2.push(sh(y[0])); y = rk4(f, y, t, dt); }
    return out;
  }
  // haemorrhage: mean arterial pressure (mmHg), minutes; baroreflex gain 2 (Guyton), refill time constant 90 min
  const K = 2, taub = 0.3, taur = 90;
  const f = (y, t) => { const [dv, b] = y, map = 93 - 50 * dv + b; return [t > 10 && fb ? -dv / taur : 0, fb ? (-K * (map - 93) - b) / taub : -b / taub]; };
  let y = [0, 0];
  for (let i = 0, dt = 0.05; i <= 3600; i++) {
    const t = i * dt; if (i > 0 && Math.abs(t - 10) < dt / 2) y[0] += 1.0;
    const map = 93 - 50 * y[0] + y[1]; out.t.push(t); out.x.push(map); out.e1.push(clamp(y[1] / 40, 0, 1)); out.e2.push(fb && t > 10 ? clamp(y[0] / 1.0, 0, 1) : 0);
    y = rk4(f, y, t, dt);
  }
  return out;
}
const CANNON = {
  meal: { name: 'blood glucose', unit: 'mg/dL', range: [70, 110], view: [40, 230], tEnd: 360, tUnit: 'min', e: ['insulin secretion', 'glucagon + adrenaline'], lines: [[68, 'counter-regulation 68'], [53, 'symptoms 53']] },
  fast: { name: 'blood glucose', unit: 'mg/dL', range: [70, 110], view: [20, 120], tEnd: 360, tUnit: 'min', e: ['insulin secretion', 'glucagon + adrenaline'], lines: [[68, 'counter-regulation 68'], [53, 'symptoms 53']] },
  cold: { name: 'core temperature', unit: '°C', range: [36.5, 37.5], view: [32, 38], tEnd: 6, tUnit: 'h', e: ['skin vasoconstriction', 'shivering'], lines: [[37.0, 'vasoconstriction 37.0'], [36.8, 'shivering 36.8']] },
  bleed: { name: 'arterial pressure', unit: 'mmHg', range: [70, 105], view: [30, 110], tEnd: 180, tUnit: 'min', e: ['baroreflex (heart rate, vessels)', 'refill, ADH, renin'], lines: [] },
};

export default {
  collection: 'physio',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Na⁺/K⁺-ATPase: three sodium out, two potassium in',
      statement: String.raw`The sodium–potassium pump of the plasma membrane hydrolyses one ATP per cycle to export **3 Na⁺** and import **2 K⁺** against their electrochemical gradients. In the Post–Albers scheme the protein alternates between an inward-facing state $E_1$, with high affinity for Na⁺, and an outward-facing phosphorylated state $E_2P$, with high affinity for K⁺, occluding the ions in between. Each cycle moves one net positive charge outward, so the pump is **electrogenic**. The pump rate rises steeply with internal Na⁺ (three sites) and is blocked from outside by cardiac glycosides such as ouabain. When it is blocked, the Na⁺ and K⁺ gradients run down by passive leak over minutes to hours.`,
      idea: String.raw`The pump is a carrier (1.6) whose conformational change is driven by phosphorylation, so the cycle can run uphill. Coupling is enforced by the order of events: phosphorylation requires bound Na⁺, and dephosphorylation requires bound K⁺. The free energy of ATP hydrolysis (about 50–60 kJ/mol in cells) exceeds the roughly 40 kJ/mol needed to move 3 Na⁺ out and 2 K⁺ in against the resting gradients and voltage. At steady state the pump fluxes exactly balance the passive leaks, 3 pump cycles per 3 leaking Na⁺ and 2 leaking K⁺. That balance sets the gradients, which in turn set the Nernst potentials (1.8) and the resting potential (1.9, 1.11). The cost is large: about 20–30 % of the ATP-coupled oxygen use of a resting mammal and half or more of the brain's (Rolfe and Brown 1997). Each pump turns over at roughly 100 cycles per second.`,
      caption: String.raw`Step through the Post–Albers cycle with the player, or press play. Na⁺ is orange, K⁺ purple and phosphate gold, and the gates open and close. Count what one turn achieves: 3 Na⁺ out, 2 K⁺ in, 1 ATP spent, one positive charge exported. Right: a model neuron, using the pump–leak model of 1.11 at fixed volume, with its internal Na⁺ and K⁺ and its membrane potential below. Toggle **ouabain** to block the pump at $t = 5$ min. The voltage loses the pump's few millivolts at once, then the gradients run down by passive leak over the next hour and the cell slowly depolarizes. Raise the leak and the run-down speeds up.`,
      scope: String.raw`The 3:2:1 stoichiometry holds under physiological conditions; the kinetic rates in the model are illustrative (fitted to give a −70 mV resting potential with 12 mM internal Na⁺).`,
      deps: ['physio-1.6'],
      see: ['physio-1.11', 'pharm-6.7'],
      refs: ['Keener–Sneyd ch. 2', 'Rolfe & Brown, Physiol. Rev. 77 (1997)'],
      tags: ['ion pump', 'membrane transport'],
      credit: 'Jens Christian Skou, 1957 (discovery; Nobel 1997); R. L. Post and R. W. Albers, 1960s (cycle)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Na%2B/K%2B-ATPase' },
      viz(v) {
        const NA0 = [[-2.6, -2.5], [-1.7, -2.85], [-0.9, -2.35]], SITE_NA = [[-0.32, 0.18], [0.32, 0.18], [0, -0.32]], OUT_NA = [[-1.4, 2.3], [0.2, 2.8], [1.5, 2.25]], FAR_NA = [[-2.5, 3.1], [0.9, 3.25], [2.7, 3.0]];
        const K0 = [[1.0, 2.6], [2.2, 2.3]], SITE_K = [[-0.28, 0], [0.28, 0]], IN_K = [[1.3, -2.3], [2.3, -2.75]], FAR_K = [[2.2, -3.15], [3.3, -2.6]];
        const frames = [
          { na: SITE_NA, k: IN_K, inner: 1, outer: 0, P: 0, atp: 'bind', note: String.raw`**$E_1$, facing in.** Three Na⁺ bind from the cytoplasm to high-affinity sites; the two K⁺ of the last cycle have just left.` },
          { na: SITE_NA, k: FAR_K, inner: 0, outer: 0, P: 1, atp: 'P', note: String.raw`**Phosphorylation.** ATP transfers its phosphate to an aspartate and ADP leaves: $E_1P\cdot 3\mathrm{Na}$, with the Na⁺ occluded (both gates shut).` },
          { na: OUT_NA, k: FAR_K, inner: 0, outer: 1, P: 1, atp: '', note: String.raw`**$E_2P$, facing out.** The conformational change opens the outer gate and lowers the Na⁺ affinity: three Na⁺ are released outside, against their gradient.` },
          { na: FAR_NA, k: SITE_K, inner: 0, outer: 1, P: 1, atp: '', note: String.raw`**Two K⁺ bind** from the outside to the now high-affinity K⁺ sites.` },
          { na: FAR_NA, k: SITE_K, inner: 0, outer: 0, P: 0, atp: 'Pi', note: String.raw`**Dephosphorylation.** Bound K⁺ triggers hydrolysis of the phospho-aspartate; Pi leaves and the K⁺ are occluded ($E_2\cdot 2\mathrm{K}$).` },
          { na: NA0, k: IN_K, inner: 1, outer: 0, P: 0, atp: 'ATP', note: String.raw`**Back to $E_1$.** ATP binding (not yet hydrolysed) speeds the return to the inward-facing state, which releases the two K⁺ into the cytoplasm. Net per cycle: 3 Na⁺ out, 2 K⁺ in, one ATP, **one positive charge exported**.` },
        ];
        const S = v.steps({ frames, transition: 0.6, loop: true, speed: 0.7, still: 2 });
        const ouab = v.toggle('ouabain at 5 min', false);
        const leak = v.slider('Na⁺ leak ×', 0.5, 3, 1, { step: 0.1 });
        const sp = v.stage({ x: [-4.2, 4.2], y: [-3.5, 3.6], equal: true, axes: false, height: 300, weight: 1 });
        const sc = v.stage({ x: [0, 90], y: [0, 160], height: 300, axes: 'box', xlabel: 't (min)', ylabel: 'internal concentration (mM)', weight: 1 });
        const sv = v.stage({ x: [0, 90], y: [-80, -20], height: 150, axes: 'box', xlabel: 't (min)', ylabel: 'V (mV)', full: true, yticks: [-80, -70, -60, -50, -40, -30, -20] });
        let key = '', run = null;
        const get = () => { const k = `${ouab.value}|${leak.value}`; if (k !== key) { key = k; run = pumpLeak({ tEnd: 90, dt: 0.1, fixedVolume: true, leak: leak.value, pumpOn: (t) => (ouab.value && t >= 5 ? 0 : 1) }); } return run; };
        v.render(() => {
          const f = S.frame, p = S.prev && S.prev.na ? S.prev : f, u = S.tween;
          // compartments and membrane
          sp.rect(-4.2, 1.0, 4.2, 3.6, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          sp.rect(-4.2, -3.5, 4.2, -1.0, { fill: 'gold', fillAlpha: 0.05, stroke: false });
          bilayer(sp, -4.2, 4.2, -1.0, 1.0, { vertical: false, spacing: 9, gaps: [[-1.25, 1.25]] });
          sp.text('outside: Na⁺ 145, K⁺ 5 mM', -4.1, 3.5, { size: 10.5, color: 'muted', align: 'left', baseline: 'top' });
          sp.text('cytoplasm: Na⁺ 12, K⁺ 140 mM', -4.1, -3.4, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          // the pump: two subunits around a central pathway; gates as bars
          const og = lerp(p.outer, f.outer, u), ig = lerp(p.inner, f.inner, u);
          const L = [[-1.2, -1.5], [-0.62 - 0.18 * ig, -1.5], [-0.55, 0], [-0.62 - 0.18 * og, 1.5], [-1.2, 1.5]];
          sp.poly(L, { fill: 'teal', fillAlpha: 0.45, color: 'teal', width: 1.6 });
          sp.poly(L.map(([x, y]) => [-x, y]), { fill: 'teal', fillAlpha: 0.45, color: 'teal', width: 1.6 });
          sp.line(-0.62 + 0.64 * og, 1.18, 0.62 - 0.64 * og, 1.18, { color: 'ink', width: 3 });
          sp.line(-0.62 + 0.64 * ig, -1.18, 0.62 - 0.64 * ig, -1.18, { color: 'ink', width: 3 });
          // phosphate on the cytoplasmic domain
          const Pa = lerp(p.P, f.P, u);
          if (Pa > 0.02) { sp.circle(1.05, -1.75, 0.2, { fill: 'gold', fillAlpha: 0.9 * Pa, color: 'gold', alpha: Pa }); sp.text('P', 1.05, -1.75, { size: 10, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); }
          if (f.atp === 'bind' || f.atp === 'ATP') sp.text('ATP', 1.75, -1.9, { size: 11, color: 'gold', align: 'left', weight: 700 });
          if (f.atp === 'P') sp.text('ADP leaves', 1.45, -2.1, { size: 10.5, color: 'muted', align: 'left' });
          if (f.atp === 'Pi') sp.text('Pi leaves', 1.45, -2.1, { size: 10.5, color: 'muted', align: 'left' });
          // ions gliding between positions
          for (let i = 0; i < 3; i++) { const q = lerp2(p.na[i], f.na[i], u); const far = f.na === FAR_NA ? 1 - 0.6 * u : p.na === FAR_NA ? 0.4 + 0.6 * u : 1; ion(sp, q[0], q[1], 'Na', 0.19, far); }
          for (let i = 0; i < 2; i++) { const q = lerp2(p.k[i], f.k[i], u); const far = f.k === FAR_K ? 1 - 0.6 * u : p.k === FAR_K ? 0.4 + 0.6 * u : 1; ion(sp, q[0], q[1], 'K', 0.21, far); }
          sp.text('+1 charge out per cycle', 4.1, 1.35, { size: 10.5, color: 'red', align: 'right', baseline: 'bottom', weight: 600 });
          // run-down after ouabain
          const R = get();
          if (ouab.value) { sc.vline(5, { color: 'red', dash: [3, 3] }); sv.vline(5, { color: 'red', dash: [3, 3] }); sc.text('ouabain', 6, 155, { size: 10.5, color: 'red', align: 'left', baseline: 'top' }); }
          trace(sc, R.t, R.K, { color: ION_COL.K, width: 2.4 });
          trace(sc, R.t, R.Na, { color: ION_COL.Na, width: 2.4 });
          trace(sc, R.t, R.Cl, { color: ION_COL.Cl, width: 1.6, dash: [5, 3] });
          sc.text('K⁺ᵢ', 88, R.K.at(-1), { size: 11, color: ION_COL.K, align: 'right', baseline: 'bottom', dy: -3, weight: 700 });
          sc.text('Na⁺ᵢ', 88, R.Na.at(-1), { size: 11, color: ION_COL.Na, align: 'right', baseline: 'bottom', dy: -3, weight: 700 });
          trace(sv, R.t, R.V, { color: 'accent', width: 2.2 });
          sv.hline(nernst(1, PL.out.K, R.K.at(-1), PL.T), { color: ION_COL.K, dash: [2, 3], width: 1 });
        });
        v.legend([[ION_COL.Na, 'Na⁺', { dot: true }], [ION_COL.K, 'K⁺', { dot: true }], [ION_COL.Cl, 'Cl⁻ᵢ', { dash: true }], ['accent', 'membrane potential'], [ION_COL.K, '$E_K$ at the end', { dash: true }]]);
        v.readout(() => {
          const R = get(), i5 = idxAt(R.t, 4.99), i6 = idxAt(R.t, 5.01), iE = R.t.length - 1, i30 = idxAt(R.t, 35);
          const jump = R.V[i6] - R.V[i5];
          return ouab.value
            ? `pump blocked: $V$ jumps by ${v.fix(jump, 1)} mV at once (the pump's electrogenic share), then Na⁺ᵢ rises ${v.fix((R.Na[i30] - R.Na[i6]) / 30, 2)} mM/min over the first half hour · after 85 min: Na⁺ᵢ ${v.fix(R.Na[iE], 0)}, K⁺ᵢ ${v.fix(R.K[iE], 0)} mM, $V = ${v.fix(R.V[iE], 1)}$ mV ($E_K$ now ${v.fix(nernst(1, PL.out.K, R.K[iE], PL.T), 1)} mV)`
            : `steady state: Na⁺ᵢ ${v.fix(R.Na[iE], 1)}, K⁺ᵢ ${v.fix(R.K[iE], 1)} mM, $V = ${v.fix(R.V[iE], 1)}$ mV · pump ${v.fix(R.pump[iE], 2)} cycles·(mM/min) = passive Na⁺ influx ÷ 3 = K⁺ efflux ÷ 2 (balance of 1.11)`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Law',
      name: 'Nernst equation',
      statement: String.raw`If a membrane is permeable to a single ion species of valence $z$, present at concentrations $c_{\text{in}}$ and $c_{\text{out}}$, there is no net flux of that ion exactly when the membrane potential $V = \phi_{\text{in}} - \phi_{\text{out}}$ equals its **equilibrium (Nernst) potential**
$$E = \frac{RT}{zF}\,\ln\frac{c_{\text{out}}}{c_{\text{in}}} \;\approx\; \frac{61.5\ \mathrm{mV}}{z}\,\log_{10}\frac{c_{\text{out}}}{c_{\text{in}}}\quad\text{at } 37\,^\circ\mathrm{C}.$$
For a mammalian neuron ($\mathrm{K^+}$ 140/5, $\mathrm{Na^+}$ 12/145, $\mathrm{Cl^-}$ 4/110 mM inside/outside) this gives $E_K \approx -89$ mV, $E_{Na} \approx +67$ mV and $E_{Cl} \approx -89$ mV. Only a tiny number of ions has to cross to charge the membrane capacitance to $E$, so the concentrations themselves barely change.`,
      idea: String.raw`Equilibrium means equal electrochemical potential on both sides: $RT\ln c_{\text{in}} + zF\phi_{\text{in}} = RT\ln c_{\text{out}} + zF\phi_{\text{out}}$, which rearranges to Nernst's formula. Equivalently, by the Boltzmann distribution (thermo-6.1) the concentration ratio of particles of charge $ze$ across a potential step $V$ is $e^{-zeV/kT}$. Kinetically, ions diffuse down their concentration gradient. Each one that crosses carries charge, which builds a voltage across the membrane capacitance (about $1\ \mu\mathrm{F/cm^2}$). That voltage drives a return drift until the two fluxes balance, the Nernst–Planck picture. To charge $1\ \mathrm{cm^2}$ to 90 mV takes only about $10^{-12}$ mol of $\mathrm{K^+}$, a negligible fraction of the cell's content. The same formula is the electrode potential of electrochemistry (pchem-8.6).`,
      caption: String.raw`A membrane patch with three open channels; the cell is on the left. Each dot is a permeant ion doing a Brownian random walk. A crossing is accepted with the Boltzmann factor of the energy it costs against the membrane voltage, and that voltage is produced by the ions that have already crossed: their charges line up along the two faces of the membrane, the capacitor. The two arrows above compare the push of diffusion (the concentration gradient) with the pull of the voltage, and they balance at the Nernst potential. Right: the voltage over time (thermal fluctuations of a small patch) and its running mean, against the Nernst prediction (dashed). Change the ion or drag the concentrations.`,
      scope: String.raw`Holds at equilibrium for one permeant ion species (ideal dilute solutions, activities ≈ concentrations); with several permeant species the membrane sits at a weighted compromise (1.9) and no single ion is at equilibrium.`,
      deps: ['thermo-6.1', 'pchem-8.6'],
      see: ['neuro-1.3', 'pchem-5.16', 'pchem-10.8', 'thermo-3.2'],
      refs: ['Keener–Sneyd ch. 2'],
      tags: ['membrane potential', 'electrochemistry'],
      credit: 'Walther Nernst, 1889',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nernst_equation' },
      viz(v) {
        const ionSel = v.select('permeant ion', [{ value: 'K', label: 'K⁺' }, { value: 'Na', label: 'Na⁺' }, { value: 'Cl', label: 'Cl⁻' }], 'K', { onChange: (k) => { cin.set(NEURON[k].i); cout.set(NEURON[k].o); } });
        const cin = v.slider('$c_{\\text{in}}$', 2, 150, NEURON.K.i, { log: true, fmt: (x) => `${v.fix(x, 1)} mM` });
        const cout = v.slider('$c_{\\text{out}}$', 2, 150, NEURON.K.o, { log: true, fmt: (x) => `${v.fix(x, 1)} mM` });
        const Tc = v.slider('temperature', 0, 40, 37, { step: 1, fmt: (x) => `${x} °C` });
        const sb = v.stage({ x: [-1.05, 1.05], y: [-0.08, 1.32], equal: true, axes: false, height: 320, weight: 1.15 });
        const sv = v.stage({ x: [0, 20], y: [-120, 120], height: 320, axes: 'box', xlabel: 't (s)', ylabel: 'V = φ_in − φ_out (mV)', weight: 1, yticks: [-120, -90, -60, -30, 0, 30, 60, 90, 120] });
        const DEN = 4, DELTA = 2.5, SIG = 0.022, SPS = 700, GAPS = [[0.18, 0.26], [0.46, 0.54], [0.74, 0.82]], P0 = 0.25, TP = 20;
        let key = '', sim = null;
        const make = () => {
          const k = ionSel.value, z = ION_Z[k], ci = cin.value, co = cout.value, vt = VT(Tc.value);
          return clocked(1 / SPS, () => {
            const r = v.rng(5), P = [];
            const nIn = Math.round(ci * DEN), nOut = Math.round(co * DEN);
            for (let i = 0; i < nIn; i++) P.push([-1 + r() * 0.97, r()]);
            for (let i = 0; i < nOut; i++) P.push([0.03 + r() * 0.97, r()]);
            return { P, r, n: 0, hist: { t: [0], V: [0] }, acc: 0, accN: 0, steps: 0, out: 0, inn: 0 };
          }, (S) => {
            const r = S.r, P = S.P, aOut = Math.min(1, Math.exp((-z * z * DELTA * (S.n + 0.5)) / vt)), aIn = Math.min(1, Math.exp((-z * z * DELTA * (0.5 - S.n)) / vt));
            for (const q of P) {
              const nx = q[0] + SIG * r.normal(), ny = q[1] + SIG * r.normal();
              let y = ny < 0 ? -ny : ny > 1 ? 2 - ny : ny;
              if ((q[0] < 0) !== (nx < 0)) {
                const inGap = GAPS.some(([a, b]) => y > a && y < b);
                const leaving = q[0] < 0;
                if (inGap && r() < P0 * (leaving ? aOut : aIn)) { q[0] = nx; q[1] = y; if (leaving) { S.n++; S.out++; } else { S.n--; S.inn++; } }
                else { q[1] = y; }
                continue;
              }
              let x = nx; if (x < -1) x = -2 - x; if (x > 1) x = 2 - x;
              q[0] = x; q[1] = y;
            }
            // reservoirs: hold the concentration in the outer strips (bulk solutions)
            for (const [lo, hi, c] of [[-1, -0.85, ci], [0.85, 1, co]]) {
              const want = c * DEN * (hi - lo), have = [];
              for (let i = 0; i < P.length; i++) if (P[i][0] >= lo && P[i][0] <= hi) have.push(i);
              const target = Math.floor(want) + (r() < want - Math.floor(want) ? 1 : 0);
              if (have.length > target + 1) { const i = have[Math.floor(r() * have.length)]; P[i] = P[P.length - 1]; P.pop(); }
              else if (have.length < target - 1) P.push([lo + r() * (hi - lo), r()]);
            }
            S.steps++;
            const V = -z * S.n * DELTA;
            if (S.steps > SPS) { S.acc += V; S.accN++; }
            if (S.steps % 14 === 0) { S.hist.t.push(S.steps / SPS); S.hist.V.push(V); }
          });
        };
        let S = null;
        v.animate((t) => {
          const k = `${ionSel.value}|${cin.value}|${cout.value}|${Tc.value}`;
          if (k !== key) { key = k; sim = make(); }
          S = sim.to(t % TP);
          const kind = ionSel.value, z = ION_Z[kind], E = nernst(z, cout.value, cin.value, Tc.value), V = -z * S.n * DELTA;
          // compartments
          sb.rect(-1, 0, 0, 1, { fill: 'gold', fillAlpha: 0.06, stroke: false });
          sb.rect(0, 0, 1, 1, { fill: 'blue', fillAlpha: 0.06, stroke: false });
          sb.rect(-1, 0, 1, 1, { color: 'muted', width: 1.2 });
          bilayer(sb, -0.035, 0.035, 0, 1, { spacing: 8, r: 2, gaps: GAPS });
          for (const [a, b] of GAPS) { sb.rect(-0.035, a, 0.035, b, { fill: 'teal', fillAlpha: 0.25, stroke: false }); sb.line(-0.035, a, 0.035, a, { color: 'teal', width: 2 }); sb.line(-0.035, b, 0.035, b, { color: 'teal', width: 2 }); }
          sb.dots(S.P.map((q) => [q[0], q[1]]), { r: 2.1, color: ION_COL[kind] });
          // the capacitor: separated charges along the two faces
          const nn = Math.min(60, Math.abs(S.n)), sideOut = S.n > 0 ? 1 : -1, qOut = z * Math.sign(S.n), plus = [], minus = [];
          for (let i = 0; i < nn; i++) { const y = 0.03 + (0.94 * (i + 0.5)) / Math.max(nn, 1); (qOut > 0 ? plus : minus).push([0.06 * sideOut, y]); (qOut > 0 ? minus : plus).push([-0.06 * sideOut, y]); }
          for (const [x, y] of plus) sb.text('+', x, y, { size: 11, color: 'red', align: 'center', baseline: 'middle', weight: 700 });
          for (const [x, y] of minus) sb.text('−', x, y, { size: 12, color: 'blue', align: 'center', baseline: 'middle', weight: 700 });
          sb.text('inside (cell)', -0.98, -0.02, { size: 11, color: 'muted', align: 'left', baseline: 'top' });
          sb.text('outside', 0.98, -0.02, { size: 11, color: 'muted', align: 'right', baseline: 'top' });
          // force arrows: diffusion push (chemical) vs electrical pull, in mV of driving force for this ion
          const chem = (vtE) => vtE; void chem;
          const sc = 0.0042, dif = -E, ele = V; // outward-positive "push" on the ion (per unit charge sign handled by z below)
          const yA = 1.12, yB = 1.24;
          // outward push from diffusion = z(V − E) sign convention: drift ∝ −zV (outward when inside positive for cations)
          const pd = z * dif, pe = z * ele; // positive = pushes the ion outward
          const arr = (y, pushOut, col, lab) => { const L = clamp(pushOut * sc, -0.95, 0.95); if (Math.abs(L) > 0.01) sb.arrow(0, y, L, y, { color: col, width: 3, head: 9 }); sb.text(lab, L >= 0 ? -0.04 : 0.04, y, { size: 10.5, color: col, align: L >= 0 ? 'right' : 'left', baseline: 'middle', weight: 600 }); };
          arr(yB, pd, 'orange', `diffusion ${v.fix(Math.abs(E), 0)} mV`);
          arr(yA, pe, 'accent', `voltage ${v.fix(Math.abs(V), 0)} mV`);
          sb.line(0, 1.05, 0, 1.3, { color: 'faint', width: 1 });
          // voltage trace
          sv.hline(E, { color: 'green', dash: [6, 4], width: 1.6 });
          sv.text(`Nernst E = ${v.fix(E, 1)} mV`, 19.7, E, { size: 11, color: 'green', align: 'right', baseline: E > 80 ? 'top' : 'bottom', dy: E > 80 ? 3 : -3, weight: 600 });
          sv.hline(0, { color: 'faint', width: 1 });
          trace(sv, S.hist.t, S.hist.V, { color: 'gold', width: 1 });
          const mean = []; let acc = 0, cnt = 0; for (let i = 0; i < S.hist.t.length; i++) { if (S.hist.t[i] > 1) { acc += S.hist.V[i]; cnt++; mean.push([S.hist.t[i], acc / cnt]); } }
          sv.path(mean, { color: 'accent', width: 2.4 });
        }, { period: TP, still: 14 });
        v.legend([['orange', 'diffusion push (∝ ln of the ratio)'], ['accent', 'electrical pull / running mean of V'], ['gold', 'instantaneous V'], ['green', 'Nernst potential', { dash: true }]]);
        v.readout(() => {
          if (!S) return '';
          const z = ION_Z[ionSel.value], E = nernst(z, cout.value, cin.value, Tc.value), m = S.accN ? S.acc / S.accN : NaN;
          return `$E = \\frac{RT}{zF}\\ln\\frac{c_{out}}{c_{in}} = \\frac{${v.fix(VT(Tc.value), 2)}\\text{ mV}}{${z > 0 ? '' : '-'}1}\\ln\\frac{${v.fix(cout.value, 1)}}{${v.fix(cin.value, 1)}} = ${v.fix(E, 1)}$ mV · simulated mean $V = ${isFinite(m) ? v.fix(m, 1) : '…'}$ mV after ${S.out} outward and ${S.inn} inward crossings; net ${Math.abs(S.n)} ions (${v.fix((100 * Math.abs(S.n)) / Math.max(1, cin.value * DEN), 1)} % of the cell's) charge the membrane`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Law',
      name: 'Goldman–Hodgkin–Katz voltage equation',
      statement: String.raw`When a membrane is permeable to several monovalent ions, the potential at which their currents cancel, the **resting potential**, is
$$V = \frac{RT}{F}\,\ln\frac{P_K[\mathrm K^+]_o + P_{Na}[\mathrm{Na}^+]_o + P_{Cl}[\mathrm{Cl}^-]_i}{P_K[\mathrm K^+]_i + P_{Na}[\mathrm{Na}^+]_i + P_{Cl}[\mathrm{Cl}^-]_o}.$$
The permeabilities $P$ weight each ion, and the anion's concentrations enter upside down. $V$ always lies between the most negative and the most positive Nernst potential (1.8). It is close to $E_K$ when $P_K$ dominates, as at rest, and swings toward $E_{Na}$ when $P_{Na}$ rises, as at the peak of an action potential. It reduces to the Nernst equation when only one permeability is nonzero. The resting membrane is *not* at equilibrium: Na⁺ leaks in and K⁺ leaks out continuously, and the pump (1.7) must balance them.`,
      idea: String.raw`Goldman assumed a constant electric field inside the membrane. Each ion then obeys a Nernst–Planck equation that integrates in closed form, giving the GHK current $I_i = P_i z_i^2 \frac{F^2V}{RT}\frac{c_i - c_o e^{-z_iFV/RT}}{1 - e^{-z_iFV/RT}}$, which builds on Fick (1.3) plus drift. Setting the sum of the currents to zero and solving for $V$ gives the formula. Hodgkin and Katz (1949) fitted squid-axon potentials with permeability ratios $P_K:P_{Na}:P_{Cl} = 1:0.04:0.45$ at rest and $1:20:0.45$ at the peak of the spike. The action potential is therefore a transient permeability change, the sodium hypothesis (physio-2.11). With mammalian concentrations the resting ratios give about $-72$ mV.`,
      caption: String.raw`Left: the GHK current–voltage curves of K⁺ (purple), Na⁺ (orange), Cl⁻ (green) and their sum (black). The resting potential is where the black curve crosses zero, between the Nernst potentials marked below the axis. Drag the permeability ratios, or pick *spike peak* to set Hodgkin and Katz's active permeabilities. Right: resting potential against external K⁺ on a log axis, with the Nernst line for $E_K$ (slope 61.5 mV per tenfold change). At high $[\mathrm K^+]_o$ the membrane follows $E_K$, and at low $[\mathrm K^+]_o$ the sodium leak pulls it away. Moving $[\mathrm K^+]_o$ from 4 to 8 mM shows the depolarization of hyperkalaemia.`,
      scope: String.raw`Assumes independent ions crossing a uniform membrane with a constant field and steady state, with fixed concentrations; divalent ions (Ca²⁺) and electrogenic pumps need extra terms. Permeability ratios are fitted, not measured directly.`,
      deps: ['physio-1.8', 'physio-1.3'],
      see: ['neuro-1.4', 'physio-2.11', 'pchem-8.13'],
      refs: ['Keener–Sneyd ch. 2', 'Keener–Sneyd ch. 3', 'Hodgkin & Katz, J. Physiol. 108 (1949)'],
      tags: ['membrane potential', 'permeability'],
      credit: 'D. E. Goldman, 1943; A. L. Hodgkin and B. Katz, 1949',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Goldman_equation' },
      viz(v) {
        const cell = v.select('cell', [{ value: 'neuron', label: 'mammalian neuron, 37 °C' }, { value: 'squid', label: 'squid axon, 20 °C' }], 'neuron', { onChange: (c) => Ko.set(c === 'squid' ? SQUID.K.o : NEURON.K.o) });
        const state = v.select('permeabilities', [{ value: 'rest', label: 'rest 1 : 0.04 : 0.45' }, { value: 'peak', label: 'spike peak 1 : 20 : 0.45' }], 'rest', { onChange: (s) => { const P = s === 'peak' ? HK_PEAK : HK_REST; pNa.set(P.Na); pCl.set(P.Cl); } });
        const pNa = v.slider('$P_{Na}/P_K$', 0.001, 30, 0.04, { log: true, sig: 2 });
        const pCl = v.slider('$P_{Cl}/P_K$', 0, 2, 0.45, { step: 0.01 });
        const Ko = v.slider('$[\\mathrm{K^+}]_o$', 1, 150, 5, { log: true, fmt: (x) => `${v.fix(x, 1)} mM` });
        const si = v.stage({ x: [-110, 80], y: [-3, 3], height: 320, axes: true, xlabel: 'V (mV)', ylabel: 'outward current (rel.)', weight: 1.1, ticks: true });
        const sk = v.stage({ x: [1, 200], y: [-110, 40], xlog: true, height: 320, axes: 'box', xlabel: '[K⁺]ₒ (mM)', ylabel: 'resting potential (mV)', weight: 1 });
        const conc = () => { const base = cell.value === 'squid' ? SQUID : NEURON; return { K: { i: base.K.i, o: Ko.value }, Na: base.Na, Cl: base.Cl }; };
        const T = () => (cell.value === 'squid' ? 20 : 37);
        const P = () => ({ K: 1, Na: pNa.value, Cl: pCl.value });
        v.render(() => {
          const c = conc(), Tc = T(), p = P(), Vr = ghkV(p, c, Tc), norm = cell.value === 'squid' ? 1 / 300 : 1 / 120;
          const I = (k, V) => p[k] * ghkCurrent(ION_Z[k], c[k].i, c[k].o, V, Tc) * norm;
          let ymax = 0.5; for (let V = -110; V <= 80; V += 10) for (const k of ['K', 'Na', 'Cl']) ymax = Math.max(ymax, Math.abs(I(k, V)));
          const tot = (V) => I('K', V) + I('Na', V) + I('Cl', V);
          ymax = Math.min(ymax, 4 * Math.max(0.5, Math.abs(tot(-110)), Math.abs(tot(80))));
          si.setView([-110, 80], [-ymax * 1.1, ymax * 1.1]);
          for (const k of ['K', 'Na', 'Cl']) {
            const E = nernst(ION_Z[k], c[k].o, c[k].i, Tc);
            si.fn((V) => I(k, V), { color: ION_COL[k], width: 1.8 });
            if (E > -110 && E < 80) { si.dot(E, 0, { r: 3.5, color: ION_COL[k], hollow: true }); si.text(`E_${k}`, E, -ymax * 0.08, { size: 10.5, color: ION_COL[k], align: 'center', baseline: 'top', dy: k === 'Cl' ? 13 : 0, weight: 600 }); }
          }
          si.fn(tot, { color: 'ink', width: 2.6 });
          si.vline(Vr, { color: 'accent', dash: [4, 3] });
          si.dot(Vr, 0, { r: 6, color: 'accent' });
          si.text(`V_rest = ${v.fix(Vr, 1)} mV`, Vr, ymax * 0.98, { size: 11.5, color: 'accent', align: Vr > 20 ? 'right' : 'left', baseline: 'top', dx: Vr > 20 ? -5 : 5, weight: 700 });
          // V vs [K]o
          const ek = (k) => nernst(1, k, c.K.i, Tc);
          sk.fn(ek, { color: ION_COL.K, dash: [6, 4], width: 1.6 });
          sk.fn((k) => ghkV(p, { ...c, K: { i: c.K.i, o: k } }, Tc), { color: 'accent', width: 2.4 });
          sk.dot(Ko.value, Vr, { r: 5.5, color: 'accent' });
          sk.text('E_K (Nernst)', 160, ek(160), { size: 11, color: ION_COL.K, align: 'right', baseline: 'bottom', dx: -4, dy: -4 });
          sk.vband(3.5, 5, { color: 'green', alpha: 0.08 });
        });
        v.legend([[ION_COL.K, 'K⁺'], [ION_COL.Na, 'Na⁺'], [ION_COL.Cl, 'Cl⁻'], ['ink', 'total current'], ['accent', 'GHK resting potential'], ['green', 'normal plasma K⁺ 3.5–5 mM', { area: true }]]);
        v.readout(() => {
          const c = conc(), Tc = T(), p = P(), Vr = ghkV(p, c, Tc), E = (k) => nernst(ION_Z[k], c[k].o, c[k].i, Tc);
          const V4 = ghkV(p, { ...c, K: { i: c.K.i, o: 4 } }, Tc), V8 = ghkV(p, { ...c, K: { i: c.K.i, o: 8 } }, Tc);
          return `$V_{GHK} = ${v.fix(Vr, 1)}$ mV between $E_K = ${v.fix(E('K'), 1)}$, $E_{Cl} = ${v.fix(E('Cl'), 1)}$ and $E_{Na} = ${v.fix(E('Na'), 1)}$ mV · net current at $V_{GHK}$: ${v.fix(p.K * ghkCurrent(1, c.K.i, c.K.o, Vr, Tc) + p.Na * ghkCurrent(1, c.Na.i, c.Na.o, Vr, Tc) + p.Cl * ghkCurrent(-1, c.Cl.i, c.Cl.o, Vr, Tc), 6)} · $[\\mathrm K^+]_o$ 4 → 8 mM moves $V$ from ${v.fix(V4, 1)} to ${v.fix(V8, 1)} mV${cell.value === 'squid' ? ' · Hodgkin & Katz predicted about −59 mV at rest and a 97 mV action potential from these ratios' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Donnan equilibrium',
      statement: String.raw`Let compartment 1 contain charged molecules, such as proteins carrying total anionic charge $a$ (mol/L of charge), that cannot cross a membrane, while small ions such as $\mathrm K^+$ and $\mathrm{Cl^-}$ can. At equilibrium every permeant ion obeys Nernst with the *same* membrane potential, so
$$\frac{[\mathrm K^+]_1}{[\mathrm K^+]_2} = \frac{[\mathrm{Cl}^-]_2}{[\mathrm{Cl}^-]_1} = r,\qquad [\mathrm K^+]_1[\mathrm{Cl}^-]_1 = [\mathrm K^+]_2[\mathrm{Cl}^-]_2,$$
with electroneutrality $[\mathrm K^+]_1 = [\mathrm{Cl}^-]_1 + a$ in compartment 1. The **Donnan ratio** $r > 1$ produces a **Donnan potential** $V_D = -\frac{RT}{F}\ln r$, compartment 1 negative. Compartment 1 always ends up with *more* osmotically active particles than compartment 2, so water tends to flow in. A cell with impermeant contents is therefore never in true equilibrium: it would swell without limit unless it pumps (1.11) or has a rigid wall.`,
      idea: String.raw`The trapped anions attract extra cations into compartment 1 and repel permeant anions. Requiring equal electrochemical potentials for both permeant ions (1.8) at one common voltage gives the product rule. Combined with electroneutrality it fixes all concentrations, and with equal volumes the amount of salt that redistributes is $x = ac_0/(4c_0 + a)$. Because $[\mathrm K^+]_1 + [\mathrm{Cl}^-]_1 = \sqrt{a^2 + 4[\mathrm K^+]_1[\mathrm{Cl}^-]_1} > 2\sqrt{[\mathrm K^+]_2[\mathrm{Cl}^-]_2}$, the small ions alone already make compartment 1 hypertonic, before the proteins' own osmotic pressure is counted (1.4). Donnan analysed this in 1911, and it explains the oncotic pressure of plasma proteins (pchem-8.13) and why animal cells must spend energy on volume control.`,
      caption: String.raw`A rigid box divided by a membrane. Compartment 1 (left) holds impermeant protein anions (grey, ten charges each) with K⁺ as counter-ions, and both sides start with the same KCl. Press play: KCl leaks out of compartment 1 until the Donnan state is reached. The dots follow the concentrations. Right: the charge balance of each side, cations against anions, which stays electroneutral throughout, with the osmotic excess of compartment 1 shaded. Raise the protein charge $a$: the Donnan ratio, the potential and the osmotic imbalance all grow, while at high salt they fade.`,
      scope: String.raw`Ideal solutions, equal fixed volumes (a rigid wall), and only K⁺ and Cl⁻ permeant; in a real cell the extra osmotic pressure would drive water in unless balanced by pumping.`,
      deps: ['physio-1.8', 'physio-1.4', 'pchem-8.13'],
      see: ['physio-1.11', 'physio-4.20'],
      refs: ['Keener–Sneyd ch. 2'],
      tags: ['membrane potential', 'osmosis'],
      credit: 'Frederick G. Donnan, 1911',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs%E2%80%93Donnan_effect' },
      viz(v) {
        const As = v.slider('protein charge $a$ in compartment 1', 0, 150, 80, { step: 1, fmt: (x) => `${Math.round(x)} mM` });
        const Cs = v.slider('KCl $c_0$ (both sides)', 10, 150, 50, { step: 1, fmt: (x) => `${Math.round(x)} mM` });
        const sb = v.stage({ x: [-1.05, 1.05], y: [-0.12, 1.08], equal: true, axes: false, height: 300, weight: 1.1 });
        const sg = v.stage({ x: [0, 4.4], y: [0, 300], height: 300, axes: 'box', ylabel: 'mM (charge)', weight: 1, xticks: [[1, 'cmpt 1'], [3.2, 'cmpt 2']] });
        const ZP = 10, PERM = 0.5, Tc = 37, TE = 12;
        let key = '', run = null;
        const simulate = () => {
          const a = As.value, c0 = Cs.value, vt = VT(Tc);
          let y = [c0 + a, c0, c0, c0]; // K1, Cl1, K2, Cl2
          const Vof = (s) => vt * Math.log((s[2] + s[1]) / (s[0] + s[3])); // zero current, P_K = P_Cl
          const f = (s) => { const V = Vof(s), jK = PERM * ghkFlux(1, s[0], s[2], V, Tc), jCl = PERM * ghkFlux(-1, s[1], s[3], V, Tc); return [-jK, -jCl, jK, jCl]; };
          const out = { t: [], y: [], V: [] };
          for (let k = 0, dt = 0.02; k <= TE / dt; k++) { out.t.push(k * dt); out.y.push(y.slice()); out.V.push(Vof(y)); y = rk4(f, y, 0, dt); }
          const x = (a * c0) / (4 * c0 + a); out.eq = [c0 + a - x, c0 - x, c0 + x, c0 + x];
          return out;
        };
        const get = () => { const k = `${As.value}|${Cs.value}`; if (k !== key) { key = k; run = simulate(); } return run; };
        const pool = (() => { const r = v.rng(9), a = []; for (let i = 0; i < 1400; i++) a.push([r(), r()]); return a; })();
        let cur = 0;
        v.animate((t) => {
          const R = get(), tt = Math.min(TE, t % (TE + 3)), i = idxAt(R.t, tt); cur = i;
          const [K1, Cl1, K2, Cl2] = R.y[i], a = As.value, DOT = 1.2;
          sb.rect(-1, 0, 0, 1, { fill: 'gold', fillAlpha: 0.05, stroke: false });
          sb.rect(0, 0, 1, 1, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          sb.rect(-1, 0, 1, 1, { color: 'muted', width: 1.4 });
          bilayer(sb, -0.03, 0.03, 0, 1, { spacing: 8, r: 2 });
          const put = (from, n, x0, col, r = 2.1) => sb.dots(pool.slice(from, from + Math.round(n)).map(([u, w]) => [x0 + 0.04 + u * 0.92, 0.02 + w * 0.96]), { r, color: col });
          // proteins: big discs
          const nP = Math.round((a / ZP) * DOT * 1.0), r2 = v.rng(13);
          for (let k = 0; k < nP; k++) { const x = -0.92 + 0.84 * r2(), y = 0.06 + 0.88 * r2(); sb.circle(x, y, 0.035, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 }); sb.text('−', x, y, { size: 10, color: 'ink', align: 'center', baseline: 'middle' }); }
          put(0, K1 * DOT * 0.5, -1, ION_COL.K); put(300, Cl1 * DOT * 0.5, -1, ION_COL.Cl);
          put(700, K2 * DOT * 0.5, 0, ION_COL.K); put(1000, Cl2 * DOT * 0.5, 0, ION_COL.Cl);
          sb.text('compartment 1', -0.5, 1.02, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text('compartment 2', 0.5, 1.02, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text(`V₁ − V₂ = ${v.fix(R.V[i], 1)} mV`, 0, -0.03, { size: 11.5, color: 'accent', align: 'center', baseline: 'top', weight: 700 });
          // charge balance bars
          const bar = (x, w, y0, h, col, lab) => { if (h <= 0.01) return; sg.rect(x, y0, x + w, y0 + h, { fill: col, fillAlpha: 0.55, color: col, width: 1 }); if (h > 14) sg.text(lab, x + w / 2, y0 + h / 2, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle', weight: 600 }); };
          const ymax = Math.max(120, (K1 + Cl1 + a / ZP) * 1.15, (K2 + Cl2) * 1.15);
          sg.setView([0, 4.4], [0, ymax]);
          bar(0.3, 0.6, 0, K1, ION_COL.K, 'K⁺'); bar(1.1, 0.6, 0, Cl1, ION_COL.Cl, 'Cl⁻'); bar(1.1, 0.6, Cl1, a, 'muted', 'protein');
          bar(2.5, 0.6, 0, K2, ION_COL.K, 'K⁺'); bar(3.3, 0.6, 0, Cl2, ION_COL.Cl, 'Cl⁻');
          sg.text('+', 0.6, K1, { size: 12, color: 'muted', align: 'center', baseline: 'bottom' }); sg.text('−', 1.4, Cl1 + a, { size: 12, color: 'muted', align: 'center', baseline: 'bottom' });
          // osmotic particles: K1 + Cl1 + a/ZP vs K2 + Cl2, drawn as outline columns
          const o1 = K1 + Cl1 + a / ZP, o2 = K2 + Cl2;
          sg.rect(1.85, 0, 2.15, o1, { color: 'ink', width: 1.4, fill: 'ink', fillAlpha: 0.06 });
          sg.rect(4.05, 0, 4.35, o2, { color: 'ink', width: 1.4, fill: 'ink', fillAlpha: 0.06 });
          if (o1 > o2) sg.rect(1.85, o2, 2.15, o1, { fill: 'red', fillAlpha: 0.45, stroke: false });
          sg.text('osm', 2.0, o1, { size: 10, color: 'muted', align: 'center', baseline: 'bottom', dy: -2 });
          sg.text('osm', 4.2, o2, { size: 10, color: 'muted', align: 'center', baseline: 'bottom', dy: -2 });
        }, { period: TE + 3, still: TE });
        v.legend([[ION_COL.K, 'K⁺', { dot: true }], [ION_COL.Cl, 'Cl⁻', { dot: true }], ['muted', 'impermeant protein (−10 each)', { dot: true }], ['red', 'osmotic excess of compartment 1', { area: true }]]);
        v.readout(() => {
          const R = get(), [K1, Cl1, K2, Cl2] = R.y[cur], a = As.value, eq = R.eq, r = eq[0] / eq[2], dOsm = eq[0] + eq[1] + a / ZP - eq[2] - eq[3];
          return `now: $[\\mathrm K^+]_1/[\\mathrm K^+]_2 = ${v.fix(K1 / K2, 3)}$, $[\\mathrm{Cl}^-]_2/[\\mathrm{Cl}^-]_1 = ${v.fix(Cl2 / Cl1, 3)}$, products ${v.fix(K1 * Cl1, 0)} vs ${v.fix(K2 * Cl2, 0)} · Donnan (closed form): $r = ${v.fix(r, 3)}$, $V_D = -\\frac{RT}{F}\\ln r = ${v.fix(-VT(Tc) * Math.log(r), 1)}$ mV, salt moved $x = ac_0/(4c_0+a) = ${v.fix((a * Cs.value) / (4 * Cs.value + a), 2)}$ mM · osmotic excess ${v.fix(dOsm, 1)} mOsm/L $\\Rightarrow \\Delta\\Pi = ${v.fix((8.314 * 310.15 * dOsm) / 133.322, 0)}$ mmHg`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Pump–leak model of resting potential and cell volume',
      statement: String.raw`A cell containing impermeant anions $X$ (fixed amount, valence $-1$) keeps both its membrane potential and its volume steady by balancing passive leaks against active pumping. The model has five ingredients:

- **leaks**: GHK fluxes of Na⁺, K⁺ and Cl⁻ (1.9);
- **the pump**: 3 Na⁺ out and 2 K⁺ in per cycle, at a rate $p$ that rises with $[\mathrm{Na^+}]_i$ (1.7);
- **zero net current**: $\sum_i z_i J_i + p = 0$, which fixes $V$ at each instant;
- **electroneutrality**: $[\mathrm{Na^+}]_i + [\mathrm{K^+}]_i = [\mathrm{Cl^-}]_i + [X]_i$;
- **isotonicity**: water follows so quickly that internal and external osmolarity are equal, which fixes the volume $w$.

At steady state the pump makes the cell *effectively* impermeable to Na⁺: sodium pumped out balances sodium leaking in. That offsets the Donnan excess of its trapped anions (1.10), so the cell keeps a finite volume and a resting potential near $-70$ mV. If the pump stops, the cell runs toward a Donnan state it can never reach: it gains Na⁺ and Cl⁻, loses K⁺, depolarizes and swells.`,
      idea: String.raw`Without a pump the only steady state is Donnan equilibrium, which is hypertonic inside (1.10), so water would enter for ever. Pumping 3 Na⁺ out for each 2 K⁺ in exports net solute and net charge. Sodium then behaves as if it were impermeant outside the cell and balances the impermeant anions inside, which is the "double Donnan" picture of Tosteson and Hoffman (1960). The resting potential is the GHK potential, shifted a few millivolts negative by the pump current. Chloride usually ends up passively distributed at $E_{Cl} = V$. Turning the pump off reveals the time scales: the voltage loses the electrogenic component instantly, the gradients decay over the leak time, and the volume rises as Na⁺ and Cl⁻ accumulate. This is cytotoxic oedema, the swelling of cells in ischaemia when ATP fails.`,
      caption: String.raw`The cell's membrane potential, volume and ion contents, integrated together (RK4, with $V$ solved from zero net current at each step). The pump stops at $t = 5$ min and restarts at the time you choose. Watch the cell swell and depolarize, and then recover with a brief hyperpolarization: the pump runs fast while internal Na⁺ is high. Raise the Na⁺ leak and the steady state needs more pumping and sits more depolarized. With *never*, the cell keeps swelling with no end in sight.`,
      scope: String.raw`A lumped, well-mixed cell with fixed external concentrations and instantaneous water balance; parameters are chosen to give a neuron-like resting state (Na⁺ᵢ 12, K⁺ᵢ 140 mM, −70 mV) and minute-scale leak times, not fitted to a particular cell type.`,
      deps: ['physio-1.7', 'physio-1.9', 'physio-1.5'],
      see: ['physio-1.10', 'neuro-1.4'],
      refs: ['Keener–Sneyd ch. 2', 'Tosteson & Hoffman, J. Gen. Physiol. 44 (1960)'],
      tags: ['membrane potential', 'cell volume'],
      credit: 'D. C. Tosteson and J. F. Hoffman, 1960',
      viz(v) {
        const restart = v.slider('pump back on at', 15, 120, 45, { step: 1, fmt: (x) => (x >= 120 ? 'never' : `${Math.round(x)} min`) });
        const leak = v.slider('Na⁺ leak ×', 0.5, 3, 1, { step: 0.1 });
        const sc = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 300, weight: 0.85 });
        const sv = v.stage({ x: [0, 120], y: [-80, -10], height: 300, axes: 'box', xlabel: 't (min)', ylabel: 'V (mV)', weight: 1.15 });
        const sn = v.stage({ x: [0, 120], y: [0, 160], height: 210, axes: 'box', xlabel: 't (min)', ylabel: 'mM  ·  volume (% of initial)', full: true });
        const TEND = 120;
        let key = '', run = null;
        const get = () => { const k = `${restart.value}|${leak.value}`; if (k !== key) { key = k; const on = restart.value; run = pumpLeak({ tEnd: TEND, dt: 0.1, leak: leak.value, pumpOn: (t) => (t < 5 || (on < 120 && t >= on) ? 1 : 0) }); } return run; };
        let cur = 0;
        v.animate((t) => {
          const R = get(), tm = Math.min(TEND, ((t % 17) / 14) * TEND), i = idxAt(R.t, tm); cur = i;
          const w = R.w[i], rad = 1.25 * Math.cbrt(w), on = R.pump[i] > 1e-9, V = R.V[i];
          // the cell: tint by voltage, pumps and leak channels on the rim
          const depol = clamp((V + 75) / 60, 0, 1);
          sc.circle(0, 0, 1.25, { color: 'faint', dash: [4, 4], width: 1 });
          sc.circle(0, 0, rad, { fill: v.mix('blue', 'red', depol), fillAlpha: 0.14, color: 'ink', width: 2.2 });
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * 2 * Math.PI + 0.3, x = rad * Math.cos(a), y = rad * Math.sin(a), ux = Math.cos(a), uy = Math.sin(a);
            if (k % 2 === 0) {
              sc.circle(x, y, 0.16, { fill: 'teal', fillAlpha: on ? 0.8 : 0.15, color: 'teal', width: 1.2 });
              if (on) { sc.arrow(x + ux * 0.2, y + uy * 0.2, x + ux * 0.62, y + uy * 0.62, { color: ION_COL.Na, width: 2, head: 6 }); sc.arrow(x + ux * 0.62 - uy * 0.18, y + uy * 0.62 + ux * 0.18, x + ux * 0.2 - uy * 0.18, y + uy * 0.2 + ux * 0.18, { color: ION_COL.K, width: 1.6, head: 5 }); }
              else sc.text('×', x, y, { size: 13, color: 'red', align: 'center', baseline: 'middle', weight: 700 });
            } else {
              sc.rect(x - 0.07, y - 0.07, x + 0.07, y + 0.07, { fill: 'muted', fillAlpha: 0.6, stroke: false });
              sc.arrow(x + ux * 0.62, y + uy * 0.62, x + ux * 0.18, y + uy * 0.18, { color: ION_COL.Na, width: 1.2, head: 5, alpha: 0.7 });
            }
          }
          sc.text(`${v.fix(V, 1)} mV`, 0, 0.18, { size: 15, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          sc.text(`volume ${v.fix(100 * w, 1)} %`, 0, -0.22, { size: 11.5, color: 'muted', align: 'center', baseline: 'middle' });
          sc.text(on ? 'pump on' : 'pump off', 0, -2.1, { size: 11.5, color: on ? 'teal' : 'red', align: 'center', baseline: 'bottom', weight: 700 });
          // traces
          for (const s of [sv, sn]) { s.vband(5, restart.value < 120 ? restart.value : TEND, { color: 'red', alpha: 0.06 }); }
          sv.hline(-70, { color: 'faint', dash: [2, 3] });
          trace(sv, R.t, R.V, { color: 'accent', width: 1.2, alpha: 0.3 });
          trace(sv, R.t.slice(0, i + 1), R.V.slice(0, i + 1), { color: 'accent', width: 2.4 });
          sv.dot(R.t[i], V, { r: 4.5, color: 'accent' });
          const Ek = R.K.map((k) => nernst(1, PL.out.K, k, PL.T));
          trace(sv, R.t, Ek, { color: ION_COL.K, dash: [5, 3], width: 1.3 });
          sv.text('E_K', 119, Ek.at(-1), { size: 10.5, color: ION_COL.K, align: 'right', baseline: 'bottom', dy: -2 });
          const ser = [['K', ION_COL.K], ['Na', ION_COL.Na], ['Cl', ION_COL.Cl]];
          for (const [k, col] of ser) { trace(sn, R.t, R[k], { color: col, width: 1.2, alpha: 0.3 }); trace(sn, R.t.slice(0, i + 1), R[k].slice(0, i + 1), { color: col, width: 2.2 }); }
          const vol = R.w.map((x) => 100 * x);
          trace(sn, R.t, vol, { color: 'ink', width: 1.2, alpha: 0.3, dash: [6, 4] }); trace(sn, R.t.slice(0, i + 1), vol.slice(0, i + 1), { color: 'ink', width: 2.2, dash: [6, 4] });
          sn.vline(tm, { color: 'gold', width: 1.2 }); sv.vline(tm, { color: 'gold', width: 1.2 });
        }, { period: 17, still: 9 });
        v.legend([['accent', 'membrane potential'], [ION_COL.K, 'K⁺ᵢ / $E_K$'], [ION_COL.Na, 'Na⁺ᵢ'], [ION_COL.Cl, 'Cl⁻ᵢ'], ['ink', 'cell volume (%)', { dash: true }], ['red', 'pump off', { area: true }]]);
        v.readout(() => {
          const R = get(), i = cur, Na = R.Na[i], K = R.K[i], Cl = R.Cl[i], X = PL.X / R.w[i];
          const neutral = Na + K - Cl - X, osm = Na + K + Cl + X;
          return `$t = ${v.fix(R.t[i], 1)}$ min: Na⁺ᵢ ${v.fix(Na, 1)}, K⁺ᵢ ${v.fix(K, 1)}, Cl⁻ᵢ ${v.fix(Cl, 1)}, $X$ ${v.fix(X, 1)} mM · electroneutral to ${v.sci(Math.abs(neutral) + 1e-16, 1)} mM, osmolarity ${v.fix(osm, 1)} = outside ${PL.osmE} mOsm · $E_{Cl} = ${v.fix(nernst(-1, PL.out.Cl, Cl, PL.T), 1)}$ vs $V = ${v.fix(R.V[i], 1)}$ mV · pump ${v.fix(R.pump[i], 2)} mM/min (resting ${v.fix(PL.pss, 2)})`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Paper',
      name: 'Organization for Physiological Homeostasis',
      paper: { authors: 'Walter B. Cannon', year: 1929, title: 'Organization for Physiological Homeostasis', venue: 'Physiological Reviews 9 (3): 399–431', doi: '10.1152/physrev.1929.9.3.399' },
      introduces: ['physio-1.1'],
      statement: String.raw`Cannon's review set out, under the name **homeostasis** (a word he had introduced in 1926), the coordinated physiological processes that keep most of the steady states of the body. It surveyed regulated *supplies* (glucose, protein, fat, water, salt, calcium, oxygen), which are held by storing excess and releasing it in need, and regulated *conditions* (body temperature, the neutrality of the blood, osmotic pressure), which are held by adjusting the rates of continuous processes. In each case he identified opposing, cooperating mechanisms, with a large role for the sympathetic nervous system and the adrenal medulla. He drew general conclusions, restated in *The Wisdom of the Body* (1932):

- an open system needs active mechanisms to stay constant;
- any tendency to change meets factors that resist it;
- a regulated state usually depends on several mechanisms acting together or in succession;
- homeostasis is organized self-government, not chance.`,
      idea: String.raw`Claude Bernard had argued in the 1860s that the constancy of the *milieu intérieur* is the condition of free life. Cannon turned that slogan into a research programme. He catalogued the regulated variables, the sensors and the effectors, and showed experimentally, for example in his work on adrenaline and hypoglycaemia, that disturbances call out graded, often sequential defences. He avoided "equilibrium", because the body is an open system kept steady by continuous work, and coined "homeostasis" with "stasis" meaning a condition that may vary within limits. The concept became the organizing principle of physiology. It anticipated the negative-feedback theory of cybernetics (Wiener, 1948) and underlies the gain analysis of 1.2 and all the endocrine loops of chapter 9.`,
      caption: String.raw`A simulated body in the spirit of Cannon's survey. Pick a disturbance: a meal or a fast with exercise (blood glucose), a cold room (core temperature) or a 1 L haemorrhage (arterial pressure). The dashboard shows four of his regulated variables against their normal ranges. Below, the disturbed variable over time and the effectors it recruits. For glucose, counter-regulation switches on at the measured thresholds: glucagon and adrenaline at about 68 mg/dL, with symptoms at about 53 mg/dL (Schwartz et al. 1987). In the cold, vasoconstriction acts first and shivering joins later, two mechanisms in succession. Switch the effectors off to see what each loop prevents.`,
      deps: [],
      refs: [],
      tags: ['homeostasis', 'history of physiology'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Walter_Bradford_Cannon' },
      viz(v) {
        const sc = v.select('disturbance', [{ value: 'meal', label: 'meal' }, { value: 'fast', label: 'fast + exercise' }, { value: 'cold', label: 'cold room 5 °C' }, { value: 'bleed', label: 'haemorrhage 1 L' }], 'meal');
        const fbT = v.toggle('effectors working', true);
        const sd = v.stage({ x: [0, 10], y: [0, 6.2], axes: false, height: 290, weight: 0.95 });
        const sx = v.stage({ x: [0, 360], y: [40, 230], height: 290, axes: 'box', xlabel: 't', ylabel: '', weight: 1.15 });
        const se = v.stage({ x: [0, 360], y: [0, 1.05], height: 140, axes: 'box', xlabel: 't', ylabel: 'effector activity', full: true, yticks: [0, 0.5, 1] });
        let key = '', runs = null;
        const get = () => { const k = sc.value; if (k !== key) { key = k; runs = { on: cannonRun(k, true), off: cannonRun(k, false) }; } return runs; };
        const GAUGES = [['blood glucose', 'mg/dL', 40, 200, [70, 110], 92, ['meal', 'fast']], ['core temperature', '°C', 33, 39, [36.5, 37.5], 37, ['cold']], ['arterial pressure', 'mmHg', 40, 120, [70, 105], 93, ['bleed']], ['plasma osmolality', 'mOsm/kg', 270, 310, [280, 295], 288, []]];
        let cur = 0;
        v.animate((t) => {
          const C = CANNON[sc.value], R = get(), run = fbT.value ? R.on : R.off, tc = Math.min(C.tEnd, ((t % 16) / 13.5) * C.tEnd), i = idxAt(run.t, tc); cur = i;
          // dashboard
          GAUGES.forEach(([name, unit, lo, hi, rg, def, scs], k) => {
            const y = 5.6 - k * 1.05, x0 = 3.4, x1 = 9.6, X = (q) => x0 + ((clamp(q, lo, hi) - lo) / (hi - lo)) * (x1 - x0);
            const active = scs.includes(sc.value), val = active ? run.x[i] : def, ok = val >= rg[0] && val <= rg[1];
            sd.text(name, 0.1, y + 0.05, { size: 11.5, color: active ? 'ink' : 'muted', align: 'left', baseline: 'middle', weight: active ? 700 : 500 });
            sd.rect(x0, y - 0.13, x1, y + 0.13, { fill: 'grid', fillAlpha: 1, stroke: false, radius: 4 });
            sd.rect(X(rg[0]), y - 0.13, X(rg[1]), y + 0.13, { fill: 'green', fillAlpha: 0.35, stroke: false, radius: 4 });
            sd.dot(X(val), y, { r: 6, color: ok ? 'green' : 'red' });
            sd.text(`${v.fix(val, unit === '°C' ? 2 : 0)} ${unit}`, X(val), y + 0.2, { size: 10.5, color: ok ? 'ink' : 'red', align: 'center', baseline: 'bottom', weight: 600 });
          });
          sd.text('effectors', 0.1, 1.2, { size: 11.5, color: 'ink', align: 'left', baseline: 'middle', weight: 700 });
          [[C.e[0], run.e1[i], 'teal'], [C.e[1], run.e2[i], 'orange']].forEach(([lab, a, col], k) => {
            const y = 0.75 - k * 0.5;
            sd.rect(3.4, y - 0.12, 3.4 + 2.4 * a, y + 0.12, { fill: col, fillAlpha: 0.7, stroke: false, radius: 3 });
            sd.rect(3.4, y - 0.12, 5.8, y + 0.12, { color: col, width: 1, radius: 3 });
            sd.text(lab, 6.0, y, { size: 10.5, color: col, align: 'left', baseline: 'middle', weight: 600 });
          });
          // the disturbed variable
          sx.setView([0, C.tEnd], C.view); se.setView([0, C.tEnd], [0, 1.05]);
          sx.setLabels(`t (${C.tUnit})`, `${C.name} (${C.unit})`); se.setLabels(`t (${C.tUnit})`, undefined);
          sx.hband(C.range[0], C.range[1], { color: 'green', alpha: 0.1 });
          for (const [y, lab] of C.lines) { sx.hline(y, { color: 'faint', dash: [3, 3] }); sx.text(lab, C.tEnd * 0.99, y, { size: 10, color: 'muted', align: 'right', baseline: 'bottom', dy: -1 }); }
          const other = fbT.value ? R.off : R.on;
          sx.clip(() => {
            trace(sx, other.t, other.x, { color: fbT.value ? 'red' : 'green', width: 1.4, alpha: 0.45, dash: [5, 4] });
            trace(sx, run.t, run.x, { color: fbT.value ? 'green' : 'red', width: 1.2, alpha: 0.25 });
            trace(sx, run.t.slice(0, i + 1), run.x.slice(0, i + 1), { color: fbT.value ? 'green' : 'red', width: 2.4 });
          });
          sx.dot(run.t[i], clamp(run.x[i], C.view[0], C.view[1]), { r: 4.5, color: fbT.value ? 'green' : 'red' });
          sx.vline(tc, { color: 'gold', width: 1 });
          trace(se, run.t, run.e1, { color: 'teal', width: 2 }); trace(se, run.t, run.e2, { color: 'orange', width: 2 });
          se.vline(tc, { color: 'gold', width: 1 });
        }, { period: 16, still: 13.5 });
        v.legend([['green', 'effectors working'], ['red', 'effectors switched off', { dash: true }], ['teal', 'first effector'], ['orange', 'second effector']]);
        v.readout(() => {
          const C = CANNON[sc.value], R = get(), ext = (r) => { let lo = Infinity, hi = -Infinity; for (const x of r.x) { lo = Math.min(lo, x); hi = Math.max(hi, x); } return [lo, hi]; };
          const [lo1, hi1] = ext(R.on), [lo0, hi0] = ext(R.off), d = C.unit === '°C' ? 2 : 0;
          const end1 = R.on.x.at(-1), end0 = R.off.x.at(-1);
          return `with effectors: range ${v.fix(lo1, d)}–${v.fix(hi1, d)} ${C.unit}, ending at ${v.fix(end1, d)} · without: ${v.fix(lo0, d)}–${v.fix(hi0, d)} ${C.unit}, ending at ${v.fix(end0, d)} · normal ${C.range[0]}–${C.range[1]} ${C.unit}${sc.value === 'fast' ? ` · lowest glucose ${v.fix(lo1, 0)} mg/dL with counter-regulation vs ${v.fix(lo0, 0)} without (symptoms below ≈ 53)` : ''}`;
        });
      },
    },
  ],
};
