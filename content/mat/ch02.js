// Materials Science — Chapter 2: Point defects and diffusion in solids

const KB = 8.617333262e-5; // Boltzmann constant, eV/K
const RG = 8.314462618; // gas constant, J/(mol K)
const EV_KJ = 96.485; // 1 eV per atom = 96.485 kJ/mol
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const SUPD = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const pow10 = (k) => '10' + String(k).split('').map((c) => SUPD[c]).join('');

/** Time in seconds as text with a sensible unit. */
function fmtTime(s) {
  if (!isFinite(s)) return '∞';
  const a = Math.abs(s), f = (x) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2));
  if (a < 1e-6) return f(s * 1e9) + ' ns';
  if (a < 1e-3) return f(s * 1e6) + ' µs';
  if (a < 1) return f(s * 1e3) + ' ms';
  if (a < 60) return f(s) + ' s';
  if (a < 3600) return f(s / 60) + ' min';
  if (a < 86400) return f(s / 3600) + ' h';
  if (a < 3.15576e7) return f(s / 86400) + ' d';
  if (a < 3.15576e10) return f(s / 3.15576e7) + ' yr';
  return (s / 3.15576e7).toExponential(1).replace('e+', '×10^') + ' yr';
}
/** Length in metres as text. */
function fmtLen(m) {
  const a = Math.abs(m);
  if (a < 1e-9) return (m * 1e12).toFixed(0) + ' pm';
  if (a < 1e-6) return (m * 1e9).toPrecision(3) + ' nm';
  if (a < 1e-3) return (m * 1e6).toPrecision(3) + ' µm';
  if (a < 1) return (m * 1e3).toPrecision(3) + ' mm';
  return m.toPrecision(3) + ' m';
}
/** Golden-section minimum of f on [a,b]. */
function golden(f, a, b, it = 80) {
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < it; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
  }
  return (a + b) / 2;
}
/** One implicit (backward-Euler) step of c_t = (D c_x)_x on a uniform grid. D: array of nodal diffusivities.
 *  bl, br: a number = Dirichlet value, null = no flux. Thomas algorithm, in place. */
function implicitStep(c, D, dt, dx, bl, br) {
  const n = c.length, a = new Float64Array(n), b = new Float64Array(n), cc = new Float64Array(n), d = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const w = i > 0 ? (0.5 * (D[i] + D[i - 1]) * dt) / (dx * dx) : 0, e = i < n - 1 ? (0.5 * (D[i] + D[i + 1]) * dt) / (dx * dx) : 0;
    if (i === 0 && bl !== null) { b[i] = 1; cc[i] = 0; d[i] = bl; continue; }
    if (i === n - 1 && br !== null) { a[i] = 0; b[i] = 1; d[i] = br; continue; }
    if (i === 0) { b[i] = 1 + 2 * e; cc[i] = -2 * e; d[i] = c[i]; continue; }
    if (i === n - 1) { a[i] = -2 * w; b[i] = 1 + 2 * w; d[i] = c[i]; continue; }
    a[i] = -w; b[i] = 1 + w + e; cc[i] = -e; d[i] = c[i];
  }
  for (let i = 1; i < n; i++) { const m = a[i] / b[i - 1]; b[i] -= m * cc[i - 1]; d[i] -= m * d[i - 1]; }
  c[n - 1] = d[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) c[i] = (d[i] - cc[i] * c[i + 1]) / b[i];
  return c;
}

// ── diffusion data (D0 in m²/s, Q in kJ/mol) ─────────────────────────────────────────────────────────────────────────
// Metals and interstitials: D0 and Q as tabulated in Callister's table of diffusion data (checked against Callister's Table 5.2; C in α-Fe is the older-edition value, newer editions give 1.1e-6 m²/s and 87.4 kJ/mol).
// Dopants in silicon: Fair/Sze-type intrinsic values (cm²/s converted), D0 = 0.76, 3.85, 22.9 cm²/s and Q = 3.46, 3.66, 4.1 eV for B, P, As (Fair/Sze).
const DIFF = [
  { id: 'C-a', label: 'C in α-Fe (bcc)', D0: 6.2e-7, Q: 80, mech: 'int' },
  { id: 'C-g', label: 'C in γ-Fe (fcc)', D0: 2.3e-5, Q: 148, mech: 'int' },
  { id: 'Fe-a', label: 'Fe in α-Fe', D0: 2.8e-4, Q: 251, mech: 'self' },
  { id: 'Fe-g', label: 'Fe in γ-Fe', D0: 5.0e-5, Q: 284, mech: 'self' },
  { id: 'Cu-Cu', label: 'Cu in Cu', D0: 2.5e-5, Q: 200, mech: 'self' },
  { id: 'Al-Al', label: 'Al in Al', D0: 2.3e-4, Q: 144, mech: 'self' },
  { id: 'Zn-Cu', label: 'Zn in Cu', D0: 3.0e-5, Q: 189, mech: 'sub' },
  { id: 'Cu-Al', label: 'Cu in Al', D0: 6.5e-5, Q: 136, mech: 'sub' },
  { id: 'Mg-Al', label: 'Mg in Al', D0: 1.2e-4, Q: 131, mech: 'sub' },
  { id: 'Cu-Ni', label: 'Cu in Ni', D0: 2.7e-5, Q: 256, mech: 'sub' },
  { id: 'B-Si', label: 'B in Si', D0: 7.6e-5, Q: 3.46 * EV_KJ, mech: 'dop' },
  { id: 'P-Si', label: 'P in Si', D0: 3.85e-4, Q: 3.66 * EV_KJ, mech: 'dop' },
  { id: 'As-Si', label: 'As in Si', D0: 2.29e-3, Q: 4.1 * EV_KJ, mech: 'dop' },
];
const DID = Object.fromEntries(DIFF.map((d) => [d.id, d]));
const Dof = (d, T) => d.D0 * Math.exp(-(d.Q * 1000) / (RG * T));
const MECH = { int: ['orange', 'interstitial'], self: ['accent', 'self-diffusion'], sub: ['purple', 'substitutional solute'], dop: ['teal', 'dopant in silicon'] };

export default {
  collection: 'mat',
  chapter: 2,
  title: 'Point defects and diffusion in solids',
  summary: String.raw`Even a perfect-looking crystal contains vacancies in equilibrium numbers that grow exponentially with temperature, and these defects let atoms move. Solute atoms dissolve substitutionally or interstitially according to the Hume-Rothery rules. Fick's laws describe the resulting diffusion, an Arrhenius law gives its temperature dependence, and the Kirkendall effect proves that the vacancy mechanism is real.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Proposition',
      name: 'Equilibrium vacancy concentration',
      statement: String.raw`A crystal of $N$ lattice sites in contact with a heat bath at temperature $T$ minimises its Gibbs energy by containing $n_v$ empty sites, where $$\frac{n_v}{N}=\exp\!\Big(\frac{S_f}{k_B}\Big)\exp\!\Big(-\frac{Q_v}{k_BT}\Big)\qquad(n_v\ll N).$$ Here $Q_v$ is the energy needed to create one vacancy (take an atom from the interior and put it on the surface) and $S_f$ is the vibrational entropy it brings. The fraction of empty sites therefore rises exponentially with $T$; with $Q_v$ of order $1\,\mathrm{eV}$ it is about $10^{-4}$ at the melting point of a metal and utterly negligible at room temperature.`,
      idea: String.raw`Making $n$ vacancies costs energy $nQ_v$, which grows linearly. But the vacancies can be placed on the $N$ sites in $\binom{N}{n}$ ways, and the Boltzmann entropy $k_B\ln\binom Nn$ lowers the free energy as $-TS$ by an amount that starts out steeper than any line (the slope of $n\ln n$ is infinite at zero). In the large-population smooth Stirling approximation, this free energy has a positive interior minimum; setting $dG/dn=0$ gives the dilute exponential. This is a continuum population estimate, not a guarantee of a nonzero most probable integer vacancy count in a small crystal. It is the Boltzmann distribution applied to the single question "is this site occupied?".

The vacancy microstate count is exactly the binomial coefficient in comb 1.6: select n empty sites from N distinguishable sites. Differentiation is applied only after the thermodynamic, large-population Stirling approximation replaces that discrete count by a smooth free energy. Its positive interior minimum obeys pma 5.8; the dilute approximation gives $Q_v-TS_f+k_BT\log(n/N)=0$, with positive curvature $k_BT/n$. Solving yields the stated dilute fraction. This is not an exact stationary-point calculation on an integer count or a guarantee that the minimizing count of every small finite crystal is nonzero.`,
      caption: String.raw`Left: the two terms of $G(n)$ in units of $kT$ per excess vacancy, so the minimum can be read as the point where the energy line and the entropy curve are furthest apart. Middle: their sum, zoomed in; the dashed curve is the dilute-limit formula $u(\ln u-1)$ with $u=n/n^\ast$. Right: the Arrhenius plot for the chosen metal; drag the gold point along it. Push $T$ past the melting mark and see the formula leave the regime where it describes a crystal.`,
      deps: ['pchem-9.1','pchem-3.10','comb-1.6','pma-5.8'],
      refs: ['Callister §4.2'],
      tags: ['vacancies', 'entropy', 'thermal defects'],
      scope: String.raw`Dilute, non-interacting vacancies ($n_v\ll N$) in a crystal at equilibrium; $Q_v$ and $S_f$ are treated as independent of $T$. The vacancy formation energies of the presets are rounded literature values; $S_f$ defaults to zero.`,
      viz(v) {
        const PRE = { Al: { Q: 0.67, Tm: 933 }, Ag: { Q: 1.11, Tm: 1235 }, Au: { Q: 0.93, Tm: 1337 }, Cu: { Q: 1.28, Tm: 1358 }, Ni: { Q: 1.6, Tm: 1728 }, W: { Q: 3.6, Tm: 3695 } };
        const Qs = v.slider('$Q_v$ (eV)', 0.3, 4, 1.28, { step: 0.01 });
        const Ss = v.slider('$S_f/k_B$', 0, 4, 0, { step: 0.1 });
        const Ts = v.slider('$T$ (K)', 300, 4000, 1000, { step: 10 });
        const sel = v.select('preset metal', [...Object.keys(PRE), 'custom'], 'Cu', { onChange: (m) => { if (PRE[m]) Qs.set(PRE[m].Q); } });
        const q = (T, Q = Qs.value) => Q / (KB * T) - Ss.value;
        const xs = (T, Q = Qs.value) => 1 / (1 + Math.exp(q(T, Q)));
        const sA = v.stage({ x: [0, 4], y: [-5, 5], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'vacancies  $u=n/n^\\ast$', ylabel: 'free energy / ($n^\\ast kT$)', title: 'the two competing terms', xticks: [0, 1, 2, 3, 4] });
        const sB = v.stage({ x: [0, 4], y: [-1.6, 2.4], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'vacancies  $u=n/n^\\ast$', ylabel: '$G(n)/(n^\\ast kT)$', title: 'their sum has a minimum', xticks: [0, 1, 2, 3, 4] });
        const sC = v.stage({ x: [0.25, 3.4], y: [1e-30, 1], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1.2, minWidth: 280, xlabel: '1000 / T  (K⁻¹)', ylabel: '$n_v/N$', title: 'Arrhenius plot of the vacancy fraction' });
        const h = sC.handle(1, 1e-5, { color: 'gold', r: 8, label: 'T', labelPos: 'ne' });
        h.constrain = (x) => { const xx = clamp(x, 0.26, 3.39); return [xx, Math.max(1e-29, xs(1000 / xx))]; };
        h.onDrag = () => Ts.set(Math.round(1000 / h.x));
        const floor = (y) => (y < 1.2e-30 ? NaN : y);
        let info = {};
        v.render(() => {
          const T = Ts.value, qq = q(T), xd = Math.exp(-qq), um = 4;
          const conf = (u) => { const x = u * xd; if (!(x > 0) || x >= 1) return x === 0 ? 0 : NaN; return (x * Math.log(x) + (1 - x) * Math.log(1 - x)) / xd; };
          const cost = (u) => u * qq;
          const total = (u) => cost(u) + conf(u);
          // panel A
          const lo = Math.min(0, conf(um) || 0, conf(2) || 0), hi = Math.max(1, cost(um));
          sA.setView([0, um], [lo * 1.08 - 0.5, hi * 1.08 + 0.5]);
          sA.hline(0, { color: 'faint' });
          sA.fn(cost, { n: 60, color: 'orange', width: 2.4 });
          sA.fn(conf, { n: 160, color: 'accent', width: 2.4 });
          sA.fn(total, { n: 160, color: 'green', width: 3 });
          sA.text('$nQ_v-nTS_f$ (energy)', 3.95, cost(3.95), { size: 12, color: 'orange', align: 'right', dy: -14 });
          sA.text('$-TS_{\\rm conf}$ (entropy)', 3.95, conf(3.95), { size: 12, color: 'accent', align: 'right', dy: -16 });
          sA.text('sum', 3.95, total(3.95), { size: 12, color: 'green', align: 'right', dy: -10 });
          // panel B
          sB.hline(0, { color: 'faint' });
          sB.fn((u) => u * (Math.log(u) - 1), { n: 200, domain: [1e-4, um], color: 'muted', dash: [6, 4], width: 1.6 });
          sB.fn(total, { n: 200, color: 'green', width: 3 });
          const um0 = golden((lu) => total(Math.exp(lu)), Math.log(1e-4), Math.log(um));
          const umin = Math.exp(um0);
          sB.vline(umin, { color: 'green', dash: [3, 4], alpha: 0.7 });
          sB.dot(umin, total(umin), { r: 6, color: 'gold' });
          sB.text('minimum', umin, total(umin), { size: 12, color: 'ink', dx: 10, dy: 20, align: 'left' });
          // panel C
          const Tm = (PRE[sel.value] || PRE[Object.keys(PRE).reduce((b, k) => (Math.abs(PRE[k].Q - Qs.value) < Math.abs(PRE[b].Q - Qs.value) ? k : b), 'Cu')]).Tm;
          for (const k of Object.keys(PRE)) sC.fn((x) => floor(xs(1000 / x, PRE[k].Q)), { color: 'muted', alpha: 0.35, width: 1.2 });
          sC.fn((x) => floor(xs(1000 / x)), { color: 'green', width: 3 });
          sC.vline(1000 / Tm, { color: 'red', dash: [5, 4] });
          sC.text('$T_m$', 1000 / Tm, 1e-27, { size: 12, color: 'red', dx: -6, align: 'right' });
          sC.dot(1000 / Tm, xs(Tm), { r: 5, color: 'red' });
          h.set(1000 / T, Math.max(1e-29, xs(T)));
          info = { T, qq, xm: xs(T), umin, xTm: xs(Tm), Tm, xd };
        });
        v.legend([['orange', 'energy cost'], ['accent', 'entropy gain'], ['green', 'total / equilibrium'], ['muted', 'dilute-limit formula', { dash: [6, 4] }], ['red', 'melting point']]);
        v.readout(() => {
          const I = info; if (!I.T) return '';
          return `At $T=${v.fmt(I.T, 4)}$ K the free energy per vacancy is $\\Delta G_f/kT=${v.fix(I.qq, 2)}$, so the minimum of $G(n)$ sits at $n_v/N=${v.sci(I.xm, 3)}$: one empty site in $${v.sci(1 / I.xm, 2)}$. The numerical minimum is at $u=${v.fix(I.umin, 3)}$ (formula: $1$ in the dilute limit).\nAt the melting mark ($T_m=${v.fmt(I.Tm, 4)}$ K) the fraction is $${v.sci(I.xTm, 2)}$ and at $300$ K it is $${v.sci(xs(300), 2)}$.${I.T > I.Tm ? '\n**Above $T_m$ the crystal no longer exists:** the formula is outside its regime.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Frenkel and Schottky defects',
      statement: String.raw`In an ionic crystal a point defect must not upset charge neutrality, so defects come in charged groups. A **Schottky defect** is a cation vacancy together with an anion vacancy (for $\mathrm{MX}$ salts; the ratio follows the formula unit in other compounds), the missing ions having moved to the surface or a boundary. A **Frenkel defect** is a vacancy together with the same ion sitting in an interstitial site nearby. Both are present in equilibrium, in the numbers $$\frac{n_S}{N}\approx \exp\!\Big(-\frac{E_S}{2k_BT}\Big),\qquad \frac{n_F}{\sqrt{NN_i}}\approx\exp\!\Big(-\frac{E_F}{2k_BT}\Big),$$ where $E_S$ and $E_F$ are the formation energies of a whole pair and $N_i$ is the number of interstitial sites. At comparable site-count and formation-entropy prefactors, the smaller pair energy favors the larger dilute equilibrium population; pair energy alone does not determine the ranking when those prefactors differ.`,
      idea: String.raw`Each kind of pair is a charge-balanced two-defect version of the single vacancy of 2.1: the free energy has an energy cost $E$ per pair, and entropy from placing the two partners independently, so the product of the two defect fractions is fixed by $e^{-E/kT}$ (a mass-action law). For a pair the two partners have equal numbers, which turns that product into a square, and the half in the exponent. Schottky pairs prevail in crystals with similar cation and anion size and high coordination (NaCl), where an interstitial would be crowded; Frenkel pairs prevail where one ion is small and the structure open (AgCl, with its small Ag$^+$).

For a dilute ideal placement model, the choices of vacancy sites and partner sites form a Cartesian product. The product rule (comb 1.1) multiplies their counts: for Schottky pairs $\binom Nn^2$, and for Frenkel pairs $\binom Nn\binom{N_i}n$. Their logarithms therefore add in the configurational entropy. The equal partner populations make the dilute mass-action product a square and produce the half activation exponent. This counting assumes noninteracting placements and fixed site populations; it does not compare two mechanisms while silently discarding different site-count or entropy prefactors.`,
      caption: String.raw`Left: a slice of a rock-salt crystal (small cations, large anions). Add pairs of each kind, or remove a lone cation and watch the net-charge ledger fail. Right: how many defects there are at temperature $T$ for the two energies set below; drag the gold point and see that the cheaper mechanism wins by a factor that grows as $T$ falls. The crystal drawn has very many more defects than a real one.`,
      deps: ['mat-2.1','xtal-1.9','comb-1.1'],
      refs: ['Callister §12.5'],
      tags: ['ionic crystals', 'defects', 'charge neutrality'],
      credit: 'J. Frenkel, 1926; W. Schottky and C. Wagner, around 1930',
      scope: String.raw`Dilute defects in a stoichiometric ionic crystal, no impurities and no interaction between the partners (they are drawn far apart; in reality they attract). The preset energies are rounded and illustrative.`,
      viz(v) {
        const NX = 12, NY = 9;
        const ions = [];
        for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) ions.push({ i, j, q: (i + j) % 2 === 0 ? 1 : -1, present: true, hole: null });
        const rng = v.rng(5);
        const at = (i, j) => ions[i * NY + j];
        let log = [];
        const pick = (q, avoid) => {
          for (let tries = 0; tries < 200; tries++) {
            const o = at(rng.int(1, NX - 2), rng.int(1, NY - 2));
            if (o.q !== q || !o.present || o.hole) continue;
            if (avoid && Math.hypot(o.i - avoid.i, o.j - avoid.j) < 3) continue;
            if (ions.some((p) => (!p.present || p.hole) && Math.hypot(p.i - o.i, p.j - o.j) < 2.5)) continue;
            return o;
          }
          return null;
        };
        v.button('add Schottky pair', () => { const c = pick(1); if (!c) return; const a = pick(-1, c); if (!a) return; c.present = false; a.present = false; log.push('S'); });
        v.button('add Frenkel pair', () => { const c = pick(1); if (!c) return; const k = rng.int(0, 3); c.hole = [c.i + (k & 1 ? 1 : 0), c.j + (k & 2 ? 1 : 0)]; log.push('F'); });
        v.button('remove a lone cation', () => { const c = pick(1); if (!c) return; c.present = false; log.push('C'); });
        v.button('clear', () => { for (const o of ions) { o.present = true; o.hole = null; } log = []; });
        const PRE = { 'NaCl-like': [2.3, 5.0], 'AgCl-like': [1.9, 1.4], 'equal': [2.0, 2.0] };
        const ES = v.slider('$E_S$ (eV per pair)', 0.5, 6, 2.3, { step: 0.05 });
        const EF = v.slider('$E_F$ (eV per pair)', 0.5, 6, 5.0, { step: 0.05 });
        v.select('preset', Object.keys(PRE), 'NaCl-like', { onChange: (k) => { ES.set(PRE[k][0]); EF.set(PRE[k][1]); } });
        const Ts = v.slider('$T$ (K)', 300, 1100, 800, { step: 10 });
        const sL = v.stage({ x: [-0.3, NX + 0.3], y: [-0.3, NY + 0.3], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 280, title: 'rock-salt slice  (small cations, large anions)' });
        const sR = v.stage({ x: [0.9, 3.4], y: [1e-24, 1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: '1000 / T  (K⁻¹)', ylabel: 'defect fraction', title: 'equilibrium defect fractions' });
        const h = sR.handle(1.25, 1e-5, { color: 'gold', r: 8, label: 'T', labelPos: 'ne' });
        const fS = (T) => Math.exp(-ES.value / (2 * KB * T)), fF = (T) => Math.exp(-EF.value / (2 * KB * T));
        h.constrain = (x) => { const xx = clamp(x, 0.92, 3.38); return [xx, clamp(Math.max(fS(1000 / xx), fF(1000 / xx)), 1e-23, 1)]; };
        h.onDrag = () => Ts.set(Math.round(1000 / h.x));
        let info = {};
        v.render(() => {
          const rc = 0.2, ra = 0.36;
          // ions
          for (const o of ions) {
            const x = o.i + 0.5, y = o.j + 0.5;
            if (!o.present) { sL.dot(x, y, { r: o.q > 0 ? 7 : 11, hollow: true, color: o.q > 0 ? 'orange' : 'teal' }); continue; }
            if (o.hole) {
              sL.dot(x, y, { r: 7, hollow: true, color: 'orange' });
              sL.arrow(x, y, o.hole[0], o.hole[1], { color: 'orange', width: 1.5 });
              continue;
            }
            sL.circle(x, y, o.q > 0 ? rc : ra, { fill: o.q > 0 ? 'orange' : 'teal', fillAlpha: 0.75, color: o.q > 0 ? 'orange' : 'teal', width: 1 });
          }
          for (const o of ions) if (o.hole) sL.circle(o.hole[0], o.hole[1], rc, { fill: 'orange', fillAlpha: 0.95, color: 'ink', width: 1.4 });
          sL.text('surface (the removed ions end up here) ↑', NX / 2, NY + 0.18, { size: 11, color: 'muted', align: 'center' });
          // ledger
          let qsum = 0, nvc = 0, nva = 0, ni = 0;
          for (const o of ions) { if (o.present) qsum += o.q; else if (o.q > 0) nvc++; else nva++; if (o.hole) { qsum += 0; ni++; } }
          const ref = 0; // a full 12x9 slice has equal numbers of cations and anions
          // right panel
          for (const [f, c, nm] of [[fS, 'teal', 'Schottky'], [fF, 'orange', 'Frenkel']]) {
            sR.fn((x) => (f(1000 / x) < 1.2e-24 ? NaN : f(1000 / x)), { color: c, width: 3 });
          }
          const T = Ts.value;
          sR.dot(1000 / T, fS(T), { r: 5, color: 'teal' });
          sR.dot(1000 / T, fF(T), { r: 5, color: 'orange' });
          h.set(1000 / T, clamp(Math.max(fS(T), fF(T)), 1e-23, 1));
          info = { qsum: qsum - ref, nvc, nva, ni, T, s: fS(T), f: fF(T) };
        });
        v.legend([['teal', 'Schottky: anion and cation vacancy'], ['orange', 'Frenkel: vacancy and interstitial cation']]);
        v.readout(() => {
          const I = info; if (I.T === undefined) return '';
          const neutral = I.qsum === 0;
          return `**Ledger of the slice:** cation vacancies ${I.nvc}, anion vacancies ${I.nva}, interstitial cations ${I.ni}; total charge of the ions that remain $=${I.qsum > 0 ? '+' : ''}${I.qsum}\\,e$ — ${neutral ? 'neutral, so every defect group drawn is allowed.' : '**not neutral**: a lone cation vacancy would carry an enormous electrostatic energy, so such a defect never forms alone.'}\nAt $T=${I.T}$ K: $n_S/N=${v.sci(I.s, 2)}$ and $n_F/N=${v.sci(I.f, 2)}$; ${I.s > I.f ? 'Schottky' : 'Frenkel'} defects dominate by a factor $${v.sci(Math.max(I.s / I.f, I.f / I.s), 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Principle',
      name: 'Hume-Rothery rules for solid solutions',
      statement: String.raw`Two metals form an extensive substitutional solid solution only if (usually) all of the following hold: (i) the **atomic radii** differ by less than about $15\%$; (ii) the two have the **same crystal structure**; (iii) their **electronegativities** are similar (a difference of up to about $0.4$ on the Pauling scale), otherwise they prefer to form compounds; (iv) they have the same **valence**, a metal dissolving more of a solute of higher valence than the reverse being the exception that is easiest to accept. Complete solubility needs all four; failing the size rule alone is usually fatal. They are empirical guidelines with exceptions, not a theorem.`,
      idea: String.raw`Each rule guards against a different energy penalty: a size misfit strains the lattice around the solute (elastic energy $\propto(\Delta r/r)^2$); a different structure means the solute would need to change its own packing; a large electronegativity difference makes unlike pairs bond more strongly than like pairs, driving ordering or compound formation; and a valence difference changes the electron concentration of the host's band. In the Darken–Gurry map, size difference against electronegativity difference, good solutes lie inside an ellipse around the origin.`,
      caption: String.raw`Each dot is a solute in copper, placed by its size and electronegativity difference from copper; the dashed ellipse is the Darken–Gurry region of the rules; colour is the measured maximum solubility. Click a dot to run the four tests, or drag the grey probe to see how a hypothetical solute fares. Gold and silver are the instructive misfits.`,
      deps: ['xtal-1.9'],
      refs: ['Callister §4.3'],
      tags: ['solid solutions', 'alloys', 'empirical rules'],
      credit: 'W. Hume-Rothery, 1920s–30s',
      scope: String.raw`Empirical rules for **metallic** substitutional solutes; they predict only the tendency, and the measured maximum solubilities depend on temperature (the values below are the largest on each phase diagram).`,
      viz(v) {
        const Cu = { r: 1.28, chi: 1.9, st: 'fcc', val: 2 };
        // r: metallic radius (Å); chi: Pauling electronegativity; val: valence (Callister's convention for Cu); sol: max solubility in fcc Cu (at.%)
        const S = [
          { s: 'Ni', r: 1.25, chi: 1.91, st: 'fcc', val: 2, sol: 100 },
          { s: 'Pd', r: 1.37, chi: 2.2, st: 'fcc', val: 2, sol: 100 },
          { s: 'Au', r: 1.44, chi: 2.54, st: 'fcc', val: 1, sol: 100 },
          { s: 'Zn', r: 1.33, chi: 1.65, st: 'hcp', val: 2, sol: 38 },
          { s: 'Al', r: 1.43, chi: 1.61, st: 'fcc', val: 3, sol: 19.7 },
          { s: 'Ga', r: 1.35, chi: 1.81, st: 'orthorhombic', val: 3, sol: 20 },
          { s: 'Si', r: 1.18, chi: 1.9, st: 'diamond', val: 4, sol: 11 },
          { s: 'Sn', r: 1.51, chi: 1.96, st: 'tetragonal', val: 4, sol: 9 },
          { s: 'Ag', r: 1.44, chi: 1.93, st: 'fcc', val: 1, sol: 4.9 },
          { s: 'Pb', r: 1.75, chi: 1.87, st: 'fcc', val: 2, sol: 0.1 },
        ];
        const colOf = (sol) => (sol >= 99 ? 'green' : sol >= 10 ? 'gold' : sol >= 1 ? 'orange' : 'red');
        const dr = (e) => (e.r - Cu.r) / Cu.r, dchi = (e) => e.chi - Cu.chi;
        const tests = (e) => [
          { name: 'size', ok: Math.abs(dr(e)) <= 0.15, txt: `radius ${dr(e) >= 0 ? '+' : '−'}${(Math.abs(dr(e)) * 100).toFixed(1)} % (limit 15 %)` },
          { name: 'structure', ok: e.st === Cu.st, txt: `${e.st} against fcc` },
          { name: 'electronegativity', ok: Math.abs(dchi(e)) <= 0.4, txt: `Δχ = ${dchi(e) >= 0 ? '+' : '−'}${Math.abs(dchi(e)).toFixed(2)} (limit 0.4)` },
          { name: 'valence', ok: e.val <= Cu.val, txt: `${e.val}+ against ${Cu.val}+ in Cu` },
        ];
        const verdict = (e) => { const t = tests(e); if (!t[0].ok) return 'negligible'; return t.every((x) => x.ok) ? 'extensive' : 'limited'; };
        const matches = (e) => { const p = verdict(e); return p === 'extensive' ? e.sol >= 4 : p === 'negligible' ? e.sol < 1 : e.sol >= 1 && e.sol < 99.5; };
        let cur = 3;
        const sM = v.stage({ x: [-0.28, 0.5], y: [-0.55, 0.85], axes: 'box', gutter: true, height: 380, weight: 1.35, minWidth: 280, xlabel: 'radius difference  $(r-r_{\\rm Cu})/r_{\\rm Cu}$', ylabel: 'electronegativity difference  $\\Delta\\chi$', title: 'solutes in copper: Darken–Gurry map' });
        const sB = v.stage({ x: [0.3, S.length + 0.7], y: [0, 105], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xticks: S.map((e, i) => [i + 1, e.s]), ylabel: 'measured maximum solubility (at.%)', title: 'what the phase diagram says' });
        const probe = sM.handle(0.05, 0.1, { color: 'muted', r: 8, label: 'probe', labelPos: 'ne' });
        sM.onClick((x, y) => { let b = -1, bd = 0.06; S.forEach((e, i) => { const d = Math.hypot((dr(e) - x) / 0.78, (dchi(e) - y) / 1.4); if (d < bd) { bd = d; b = i; } }); if (b >= 0) cur = b; });
        sB.onClick((x) => { const i = Math.round(x) - 1; if (i >= 0 && i < S.length) cur = i; });
        v.render(() => {
          sM.vline(0, { color: 'faint' }); sM.hline(0, { color: 'faint' });
          sM.curve((t) => [0.15 * Math.cos(t), 0.4 * Math.sin(t)], 0, 2 * Math.PI, { n: 200, color: 'muted', dash: [6, 5], width: 1.6 });
          sM.curve((t) => [0.15 * Math.cos(t), 0.4 * Math.sin(t)], 0, 2 * Math.PI, { n: 200, fill: 'muted', fillAlpha: 0.06, stroke: false });
          sM.corner('ellipse: size within 15 %, |Δχ| within 0.4', 'bl', { color: 'muted' });
          S.forEach((e, i) => {
            const on = i === cur;
            if (on) sM.dot(dr(e), dchi(e), { r: 12, hollow: true, color: 'ink' });
            sM.dot(dr(e), dchi(e), { r: on ? 8 : 6, color: colOf(e.sol), label: e.s, labelPos: 'ne' });
          });
          sB.bars(S.map((e) => Math.max(e.sol, 0.6)), { color: (val, i) => colOf(S[i].sol) });
          sB.rect(cur + 0.55, 0, cur + 1.45, 105, { stroke: false, fill: 'ink', fillAlpha: 0.06 });
          S.forEach((e, i) => sB.text(e.sol >= 99 ? '100' : String(e.sol), i + 1, Math.max(e.sol, 0.6), { size: 11, color: 'ink', align: 'center', dy: -9 }));
          sM.dot(0, 0, { r: 5, hollow: true, color: 'ink', label: 'Cu', labelPos: 'sw' });
        });
        v.legend([['green', 'complete'], ['gold', '10–99 at.%'], ['orange', '1–10 at.%'], ['red', 'below 1 at.%']]);
        v.readout(() => {
          const e = S[cur], t = tests(e), pv = verdict(e);
          const px = probe.x, py = probe.y, inside = (px / 0.15) ** 2 + (py / 0.4) ** 2 <= 1;
          return `**${e.s} in Cu:** ${t.map((x) => `${x.name} ${x.ok ? '✓' : '✗'} (${x.txt})`).join('; ')}.\nThe rules predict **${pv}** solubility; the measured maximum is about ${e.sol >= 99 ? '100' : e.sol} at.% — ${matches(e) ? 'consistent with the rules.' : '**the rules miss here**: they are guidelines, not a law.'}\nProbe: size ${px >= 0 ? '+' : '−'}${(Math.abs(px) * 100).toFixed(0)} %, $\\Delta\\chi=${v.fix(py, 2)}$ — ${inside ? 'inside' : 'outside'} the ellipse.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Interstitial solid solutions: carbon in iron',
      statement: String.raw`Small atoms (H, C, N, O) dissolve in a metal by sitting in the **interstices** between the host atoms instead of replacing them. The solubility is set by how well the solute fits the hole and by how much the host lattice must distort to take it. In iron the sites are the same in kind but not in size: the octahedral hole of fcc $\gamma$-iron (austenite) has a radius of about $0.41R$, that of bcc $\alpha$-iron (ferrite) only about $0.15R$, where $R$ is the radius of an iron atom. Carbon, of radius about $0.77\,$Å, therefore dissolves up to about $2.1$ wt\% in austenite but only about $0.02$ wt\% in ferrite.`,
      idea: String.raw`Hard-sphere geometry gives the hole radius: in fcc the six nearest iron atoms sit at $a/2$ and touch along face diagonals ($4R=\sqrt2a$), leaving $r=a/2-R=(\sqrt2-1)R$; in bcc ($4R=\sqrt3a$) the octahedral site at $(a/2,0,0)$ has only two close neighbours at $a/2$ and $r=a/2-R\approx0.155R$. The bcc tetrahedral hole is larger ($0.29R$), but carbon still prefers the octahedral one because it can push apart just two atoms along one axis, which is why carbon in ferrite and martensite stretches the lattice into a tetragonal shape.`,
      caption: String.raw`A section of the lattice through the hole (left; the structure and the carbon radius are yours to change). When the carbon is too big, the iron atoms touching it must move apart by the overlap $\delta=r_{\rm C}-r_{\rm hole}$; switch the relaxation on and off to see the distortion. Right: the radii of the four interstitial holes against the carbon radius; green means it fits.`,
      deps: ['xtal-1.7', 'mat-1.4'],
      refs: ['Callister §4.3'],
      tags: ['interstitials', 'iron', 'steel'],
      scope: String.raw`Hard-sphere geometry with $a_\gamma\approx3.65$ Å and $a_\alpha\approx2.866$ Å; real atoms are soft and the solubility limits (at $1147\,^\circ$C for austenite, $727\,^\circ$C for ferrite) are measured values rounded to two figures.`,
      viz(v) {
        const A = { fcc: { a: 3.65, R: 3.65 / (2 * Math.SQRT2), roct: 3.65 / 2 - 3.65 / (2 * Math.SQRT2), rtet: (3.65 * Math.sqrt(3)) / 4 - 3.65 / (2 * Math.SQRT2) }, bcc: { a: 2.866, R: (2.866 * Math.sqrt(3)) / 4, roct: 2.866 / 2 - (2.866 * Math.sqrt(3)) / 4, rtet: (2.866 * Math.sqrt(5)) / 4 - (2.866 * Math.sqrt(3)) / 4 } };
        const host = v.select('host', [{ value: 'fcc', label: 'γ-Fe (fcc)' }, { value: 'bcc', label: 'α-Fe (bcc)' }], 'fcc');
        const rC = v.slider('carbon radius (Å)', 0.4, 1.0, 0.77, { step: 0.01 });
        const relax = v.toggle('push the neighbours apart', true);
        const sL = v.stage({ x: [-4.6, 4.6], y: [-3.2, 3.2], equal: true, axes: false, height: 340, weight: 1.25, minWidth: 280, title: 'section through an octahedral hole' });
        const sB = v.stage({ x: [0.4, 4.6], y: [0, 1.0], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xticks: [[1, 'fcc oct.'], [2, 'fcc tet.'], [3, 'bcc oct.'], [4, 'bcc tet.']], ylabel: 'hole radius  (Å)', title: 'sizes of the interstices' });
        let info = {};
        v.render(() => {
          const H = A[host.value], a = H.a, R = H.R, r = rC.value, rh = H.roct, dlt = Math.max(0, r - rh);
          const fcc = host.value === 'fcc';
          const atoms = [];
          if (fcc) {
            for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { atoms.push([i * a - a / 2, j * a]); atoms.push([i * a, a / 2 + j * a]); }
          } else for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) atoms.push([i * a - a / 2, j * a]);
          const close = (p) => (fcc ? Math.abs(Math.hypot(p[0], p[1]) - a / 2) < 1e-6 : Math.abs(p[1]) < 1e-6 && Math.abs(Math.abs(p[0]) - a / 2) < 1e-6);
          for (const p of atoms) {
            let [x, y] = p;
            if (relax.value && close(p)) { const L = Math.hypot(x, y); x += (x / L) * dlt; y += (y / L) * dlt; }
            if (Math.abs(x) > 5.2 || Math.abs(y) > 3.8) continue;
            sL.circle(x, y, R, { fill: 'accent', fillAlpha: close(p) ? 0.34 : 0.2, color: 'accent', width: close(p) ? 1.8 : 1 });
          }
          sL.circle(0, 0, rh, { color: 'green', width: 2, dash: [5, 4] });
          sL.circle(0, 0, r, { fill: 'orange', fillAlpha: 0.85, color: 'ink', width: 1.5 });
          sL.text('C', 0, 0, { size: 13, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          sL.text(`hole radius ${rh.toFixed(2)} Å`, 0, -2.0, { size: 12, color: 'green', align: 'center' });
          sL.corner(fcc ? 'fcc: 6 atoms touch the hole (4 in this plane)' : 'bcc: only 2 atoms (on the x axis) touch the hole', 'tl', { color: 'muted', plate: true });
          // bars
          const vals = [A.fcc.roct, A.fcc.rtet, A.bcc.roct, A.bcc.rtet];
          sB.bars(vals, { color: (val) => (val >= r ? 'green' : 'red'), fillAlpha: 0.7 });
          sB.hline(r, { color: 'orange', width: 2.4 });
          sB.text('carbon', 4.55, r, { size: 12, color: 'orange', align: 'right', dy: -10 });
          vals.forEach((val, i) => sB.text(val.toFixed(2), i + 1, val, { size: 11, color: 'ink', align: 'center', dy: -9 }));
          const wt = (w) => { const n = w / 12.011, m = (100 - w) / 55.845; return (100 * n) / (n + m); };
          info = { rh, r, dlt, fcc, a, R, atG: wt(2.14), atA: wt(0.022) };
        });
        v.legend([['orange', 'carbon atom'], ['accent', 'iron atoms'], ['green', 'hole radius / fits'], ['red', 'too small']]);
        v.readout(() => {
          const I = info; if (!I.rh) return '';
          const Nsite = I.fcc ? 1 : 3, at = I.fcc ? I.atG : I.atA;
          return `${I.fcc ? 'γ-Fe' : 'α-Fe'}: $a=${v.fix(I.a, 3)}$ Å, $R=${v.fix(I.R, 3)}$ Å, octahedral hole $r=${v.fix(I.rh, 3)}$ Å $=${v.fix(I.rh / I.R, 3)}R$. Carbon $r_{\\rm C}=${v.fix(I.r, 2)}$ Å is ${I.dlt > 0 ? `**${v.fix((100 * (I.r - I.rh)) / I.rh, 0)}% too large**: the neighbours must move apart by $\\delta=${v.fix(I.dlt, 2)}$ Å (${v.fix((100 * I.dlt) / I.R, 0)}% of $R$)` : 'small enough to fit without strain'}.\nMeasured maximum solubility: ${I.fcc ? '2.1 wt% at 1147 °C' : '0.022 wt% at 727 °C'} $=${v.fix(at, I.fcc ? 1 : 2)}$ at.% C, i.e. $${v.fix(((at / 100) / (1 - at / 100)) / Nsite * 100, 2)}\\%$ of the octahedral sites occupied. Austenite takes up about ${v.fix(I.atG / I.atA, 0)} times more carbon (atom fraction) than ferrite.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Concept',
      name: 'Vacancy and interstitial diffusion mechanisms',
      statement: String.raw`Atoms move through a crystal by thermally activated jumps of two kinds. In the **vacancy mechanism** a host or substitutional atom jumps into a neighbouring empty site; it can jump only when a vacancy happens to be next to it, so its mean jump rate is $\Gamma_{\rm atom}\approx z\,x_v\,\nu\,e^{-E_m/kT}$ with $x_v=e^{-E_f/kT}$ (2.1) and the activation energy is $E_f+E_m$. In the **interstitial mechanism** a small solute jumps between interstitial sites, always available, at the rate $\nu\,z\,e^{-E_i/kT}$, with activation energy $E_i$ only. In both cases the random-walk diffusivity is $D\approx\tfrac16\Gamma a^2$ in three dimensions.`,
      idea: String.raw`A jump needs an empty destination and enough thermal energy to squeeze past the saddle point between the neighbours. For a vacancy jump both conditions cost energy: $E_f$ to have the vacancy, $E_m$ to cross the barrier. An interstitial solute does not pay the vacancy-formation cost, but it still crosses an interstitial migration barrier $E_i$. Accessible interstitial destinations and a lower migration barrier can make it much faster in the model; the comparison also depends on the prefactors, available sites and material. Vacancy jumps also make the host atoms' walks **correlated** (a jumped atom is likely to jump back), reducing $D$ by a factor $f<1$.

For an ideal unbiased walk with fixed n jumps of length a, finite-variance uncorrelated coordinate increments satisfy variance additivity (prob 2.2.1). Isotropy gives variance $na^2/d$ in each of d dimensions, hence total mean-square displacement $na^2$. With mean jump count $\Gamma t$, comparison with $2dDt$ gives $D=\Gamma a^2/(2d)$: one sixth in three dimensions, one fourth for a square-lattice drawing. Vacancy return correlations violate the uncorrelated-step hypothesis and require the separate correlation correction mentioned above; the ideal variance argument does not remove it.`,
      caption: String.raw`Left, the vacancy mechanism on a square lattice with a few vacancies (far more than reality; each atom's colour is its starting column, so mixing is visible); middle, interstitials hopping between the sites of a host lattice; right, the diffusivity each would have, measured from the mean-square displacement of the simulation and scaled to the true equilibrium vacancy fraction, against the random-walk formula. Raise $T$ or lower $E_m$ and $E_i$, and compare the two.`,
      deps: ['mat-2.1','mat-2.4','prob-2.2.1'],
      refs: ['Callister §5.2'],
      tags: ['diffusion', 'vacancies', 'kinetic Monte Carlo'],
      scope: String.raw`A two-dimensional square-lattice toy with attempt frequency $\nu=10^{13}\,\mathrm{s}^{-1}$ and a fixed neighbour distance $a=2.55$ Å; the barrier heights (sliders) are illustrative values of the right order for copper-like metals. Times are simulated physical times.`,
      viz(v) {
        const NX = 12, NY = 9, N = NX * NY, NU = 1e13, AA = 2.55e-10;
        const Tt = v.slider('$T$ (K)', 400, 1400, 900, { step: 10 });
        const Ef = v.slider('vacancy $E_f$ (eV)', 0.6, 1.8, 1.28, { step: 0.01 });
        const Em = v.slider('vacancy hop $E_m$ (eV)', 0.3, 1.2, 0.7, { step: 0.01 });
        const Ei = v.slider('interstitial hop $E_i$ (eV)', 0.05, 0.9, 0.35, { step: 0.01 });
        const nV = v.slider('vacancies drawn', 1, 12, 4, { int: true });
        const NI = 6;
        const sV = v.stage({ x: [-0.8, NX - 0.2], y: [-0.8, NY - 0.2], equal: true, axes: false, height: 320, weight: 1, minWidth: 250, title: 'vacancy mechanism' });
        const sI = v.stage({ x: [-0.8, NX - 0.2], y: [-0.8, NY - 0.2], equal: true, axes: false, height: 320, weight: 1, minWidth: 250, title: 'interstitial mechanism' });
        const sD = v.stage({ x: [0.4, 2.6], y: [1e-30, 1e-4], ylog: true, axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 230, xticks: [[1, 'vacancy'], [2, 'interstitial']], ylabel: 'diffusivity  $D$ (m²/s)', title: 'the resulting diffusivity' });
        const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const init = () => {
          const nv = nV.value, rng = v.rng(21 + nv);
          const occ = new Int16Array(N).fill(-1), x0 = [], y0 = [], ux = [], uy = [], vac = [];
          let id = 0;
          const vset = new Set();
          while (vset.size < nv) vset.add(rng.int(0, N - 1));
          for (let k = 0; k < N; k++) { if (vset.has(k)) { vac.push(k); continue; } occ[k] = id; const i = Math.floor(k / NY), j = k % NY; x0.push(i); y0.push(j); ux.push(i); uy.push(j); id++; }
          const iocc = new Int16Array(N).fill(-1), ipos = [], ix0 = [], iy0 = [], iux = [], iuy = [];
          for (let m = 0; m < NI; m++) { let k; do k = rng.int(0, N - 1); while (iocc[k] >= 0); iocc[k] = m; ipos.push(k); const i = Math.floor(k / NY), j = k % NY; ix0.push(i); iy0.push(j); iux.push(i); iuy.push(j); }
          return { nv, rng, occ, x0, y0, ux, uy, vac, tV: 0, hV: 0, iocc, ipos, ix0, iy0, iux, iuy, tI: 0, hI: 0 };
        };
        const S = v.sim(init, (st) => {
          const T = Tt.value, kT = KB * T, gv = NU * Math.exp(-Em.value / kT), gi = NU * Math.exp(-Ei.value / kT);
          for (let e = 0; e < 10; e++) {
            // vacancy panel
            st.tV += -Math.log(1 - st.rng()) / (st.nv * 4 * gv);
            const m = st.rng.int(0, st.nv - 1), d = DIR[st.rng.int(0, 3)], k = st.vac[m], i = Math.floor(k / NY), j = k % NY;
            const ni = (i + d[0] + NX) % NX, nj = (j + d[1] + NY) % NY, kk = ni * NY + nj, a = st.occ[kk];
            if (a >= 0) { st.occ[k] = a; st.occ[kk] = -1; st.vac[m] = kk; st.ux[a] -= d[0]; st.uy[a] -= d[1]; st.hV++; }
            // interstitial panel
            st.tI += -Math.log(1 - st.rng()) / (NI * 4 * gi);
            const q = st.rng.int(0, NI - 1), d2 = DIR[st.rng.int(0, 3)], k2 = st.ipos[q], i2 = Math.floor(k2 / NY), j2 = k2 % NY;
            const n2 = ((i2 + d2[0] + NX) % NX) * NY + ((j2 + d2[1] + NY) % NY);
            if (st.iocc[n2] < 0) { st.iocc[n2] = q; st.iocc[k2] = -1; st.ipos[q] = n2; st.iux[q] += d2[0]; st.iuy[q] += d2[1]; st.hI++; }
          }
        }, { dt: 0.05 });
        let info = {};
        v.animate((t) => {
          if (S.state.nv !== nV.value) S.reset();
          S.advance(t);
          const st = S.state;
          for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const a = st.occ[i * NY + j]; if (a < 0) { sV.rect(i - 0.38, j - 0.38, i + 0.38, j + 0.38, { color: 'red', dash: [3, 3], width: 1.4, fillAlpha: 0 }); continue; } sV.circle(i, j, 0.4, { fill: v.mix('accent', 'orange', st.x0[a] / (NX - 1)), fillAlpha: 0.9, color: 'ink', width: 0.6, alpha: 0.5 }); }
          for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) sI.circle(i, j, 0.33, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 0.8, alpha: 0.6 });
          for (let m = 0; m < NI; m++) { const k = st.ipos[m], i = Math.floor(k / NY), j = k % NY; sI.circle(i + 0.5, j + 0.5, 0.2, { fill: 'orange', fillAlpha: 0.95, color: 'ink', width: 1 }); }
          let sv = 0; for (let a = 0; a < st.ux.length; a++) sv += (st.ux[a] - st.x0[a]) ** 2 + (st.uy[a] - st.y0[a]) ** 2;
          sv /= st.ux.length;
          let si = 0; for (let m = 0; m < NI; m++) si += (st.iux[m] - st.ix0[m]) ** 2 + (st.iuy[m] - st.iy0[m]) ** 2;
          si /= NI;
          const T = Tt.value, kT = KB * T, gv = NU * Math.exp(-Em.value / kT), gi = NU * Math.exp(-Ei.value / kT);
          const xSim = st.nv / N, xReal = Math.exp(-Ef.value / kT);
          const Dv = st.tV > 0 ? (AA * AA * sv) / (4 * st.tV) * (xReal / xSim) : 0, Di = st.tI > 0 ? (AA * AA * si) / (4 * st.tI) : 0;
          const DvT = AA * AA * xReal * gv, DiT = AA * AA * gi * (1 - NI / N);
          const bar = (x, val, col) => { if (val > 1e-30) sD.rect(x - 0.28, 1e-30, x + 0.28, val, { fill: col, fillAlpha: 0.7, stroke: false }); };
          bar(1, Dv, 'accent'); bar(2, Di, 'orange');
          for (const [x, val] of [[1, DvT], [2, DiT]]) sD.segment([x - 0.38, val], [x + 0.38, val], { color: 'ink', width: 3 });
          sV.corner(`t = ${fmtTime(st.tV)},  ${st.hV} jumps`, 'tr', { color: 'ink', plate: true });
          sI.corner(`t = ${fmtTime(st.tI)},  ${st.hI} jumps`, 'tr', { color: 'ink', plate: true });
          info = { Dv, Di, DvT, DiT, xReal, gv, gi, fcorr: st.tV > 0 && sv > 0 ? ((AA * AA * sv) / (4 * st.tV)) / (AA * AA * xSim * gv * (1 - xSim)) : null, T, hV: st.hV };
        }, { period: 40, still: 8 });
        v.legend([['accent', 'vacancy mechanism (sim.)'], ['orange', 'interstitial (sim.)'], ['ink', 'random-walk formula']]);
        v.readout(() => {
          const I = info; if (I.T === undefined) return '';
          return `At $T=${I.T}$ K the equilibrium vacancy fraction is $x_v=${v.sci(I.xReal, 2)}$, the jump rates are $\\nu e^{-E_m/kT}=${v.sci(I.gv, 2)}\\,\\mathrm{s^{-1}}$ (vacancy hop) and $\\nu e^{-E_i/kT}=${v.sci(I.gi, 2)}\\,\\mathrm{s^{-1}}$ (interstitial).\nRandom-walk formula: $D_v\\approx a^2x_v\\Gamma_m=${v.sci(I.DvT, 2)}$, $D_i\\approx a^2\\Gamma_i=${v.sci(I.DiT, 2)}\\ \\mathrm{m^2/s}$ — the interstitial is faster by a factor $${v.sci(I.DiT / I.DvT, 2)}$.\nSimulation: $D_v=${v.sci(I.Dv || 1e-99, 2)}$, $D_i=${v.sci(I.Di || 1e-99, 2)}$ m²/s${I.fcorr && I.hV > 150 ? `; the host atoms' correlation factor measured here is $f\\approx${v.fix(I.fcorr, 2)}$ (below 1: a jump is often undone)` : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Method',
      name: 'Fick’s laws in solids: erfc profiles and carburizing',
      statement: String.raw`Fick's first law says the flux of the diffusing species is proportional to the concentration gradient, $J=-D\,\partial C/\partial x$, and conservation of matter then gives the second law $\partial C/\partial t=D\,\partial^2C/\partial x^2$ for constant $D$. For a semi-infinite solid with uniform initial concentration $C_0$ whose surface is held at $C_s$ (carburizing, decarburizing, gas-phase doping), the solution is $$C(x,t)=C_s-(C_s-C_0)\,\operatorname{erf}\!\Big(\frac{x}{2\sqrt{Dt}}\Big).$$ Every concentration level moves inward as $x_c=2z\sqrt{Dt}$, where $z$ is fixed by $\operatorname{erf}z=(C_s-C_c)/(C_s-C_0)$, so the case depth grows as $\sqrt t$.`,
      idea: String.raw`The equation has no length or time scale of its own, so the profile can depend on $x$ and $t$ only through the single combination $x/\sqrt{Dt}$; substituting that similarity variable turns the PDE into an ODE whose solution satisfying the two boundary conditions is the error function. This is why doubling the depth needs four times the time, a rule used in every heat-treatment schedule. To harden a gear, hold it in a carbon-rich atmosphere at austenitizing temperature until the carbon content at the required depth exceeds the level at which quenching gives hard martensite.

Subtract the fixed surface value and apply the odd-reflection half-line heat construction pde 3.8 with diffusivity D. The initial datum on the positive half-line is the constant $C_0-C_s$; convolution of its odd extension with the heat kernel gives $(C_0-C_s)\operatorname{erf}(x/(2\sqrt{Dt}))$. Adding back $C_s$ yields the displayed profile. The instantaneous surface step is incompatible with corner continuity at $x=t=0$; the formula concerns $x\ge0,t>0$ and the initial limit at each $x>0$. Constant D and the semi-infinite geometry remain essential.`,
      caption: String.raw`Set the furnace temperature and the time. The green curve is the formula, the gold dots a finite-difference solution of the diffusion equation; the handle probes the profile. The orange level is the carbon content that defines the case; the dashed red line is the depth the gear needs, and the readout says how long that takes at this temperature. The right panel shows the $\sqrt t$ growth of the case at three temperatures.`,
      deps: ['pchem-10.2','mat-2.5','pde-3.8'],
      refs: ['Callister §5.3', 'Callister §5.4'],
      credit: 'A. Fick, 1855',
      tags: ['Fick’s laws', 'carburizing', 'error function'],
      scope: String.raw`Constant $D$ (independent of composition), a semi-infinite solid, constant surface concentration. Carbon in austenite uses $D_0=2.3\times10^{-5}\,\mathrm{m^2/s}$, $Q=148$ kJ/mol; in reality $D$ rises with carbon content and the surface content is set by the atmosphere's carbon potential.`,
      viz(v) {
        const M = v.M;
        const Tc = v.slider('furnace $T$ (°C)', 800, 1100, 930, { step: 5 });
        const th = v.slider('time (h)', 0.25, 100, 8, { log: true, sig: 2 });
        const Cs = v.slider('surface carbon $C_s$ (wt%)', 0.9, 1.4, 1.0, { step: 0.01 });
        const C0 = v.slider('core carbon $C_0$ (wt%)', 0.05, 0.3, 0.2, { step: 0.01 });
        const Cc = v.slider('case boundary $C_c$ (wt%)', 0.35, 0.8, 0.45, { step: 0.01 });
        const Xt = v.slider('required case depth (mm)', 0.2, 3, 1.0, { step: 0.05 });
        const Dmm = (TC) => Dof(DID['C-g'], TC + 273.15) * 1e6; // mm²/s
        const erfinv = (y) => M.bisect((z) => M.erf(z) - y, 0, 6, 1e-12);
        const depth = (TC, hrs) => 2 * Math.sqrt(Dmm(TC) * hrs * 3600) * erfinv((Cs.value - Cc.value) / (Cs.value - C0.value));
        const sA = v.stage({ x: [0, 3], y: [0, 1.5], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 280, xlabel: 'depth below the surface  $x$ (mm)', ylabel: 'carbon (wt%)', title: 'carbon profile' });
        const sB = v.stage({ x: [0.25, 100], y: [0.05, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'time (h)', ylabel: 'case depth (mm)', title: 'case depth grows as √t' });
        const h = sA.handle(0.5, 0.7, { color: 'gold', r: 8, label: 'probe', labelPos: 'ne' });
        let info = {};
        h.constrain = (x) => { const xx = Math.max(0, x); return [xx, prof(xx)]; };
        let prof = () => 0;
        v.render(() => {
          const T = Tc.value, hrs = th.value, t = hrs * 3600, D = Dmm(T), cs = Cs.value, c0 = C0.value, cc = Cc.value;
          const L = 2 * Math.sqrt(D * t); // diffusion length scale 2√(Dt) in mm
          const X = Math.max(3, 3.2 * L);
          sA.setView([0, X], [0, Math.max(1.3, cs * 1.12)]);
          prof = (x) => cs - (cs - c0) * M.erf(x / L);
          // numerical solution
          const n = 241, dx = X / (n - 1), c = new Float64Array(n).fill(c0), Dn = new Float64Array(n).fill(D);
          c[0] = cs;
          let tp = 0;
          const ns = 70;
          for (let k = 1; k <= ns; k++) { const tk = t * (k / ns) ** 2; implicitStep(c, Dn, tk - tp, dx, cs, c0); tp = tk; }
          let err = 0; for (let i = 0; i < n; i++) err = Math.max(err, Math.abs(c[i] - prof(i * dx)));
          sA.fn(prof, { n: 300, color: 'green', width: 3 });
          const pts = []; for (let i = 0; i < n; i += Math.max(1, Math.round(n / 40))) pts.push([i * dx, c[i]]);
          sA.dots(pts, { r: 2.8, color: 'gold' });
          sA.hline(cc, { color: 'orange', dash: [6, 4] });
          sA.hline(c0, { color: 'faint', dash: [2, 4] });
          const z = erfinv((cs - cc) / (cs - c0)), xc = L * z;
          sA.vline(xc, { color: 'orange', alpha: 0.6 });
          sA.dot(xc, cc, { r: 6, color: 'orange' });
          sA.vline(Xt.value, { color: 'red', dash: [6, 4] });
          sA.text('required depth', Xt.value, 1.2, { size: 11, color: 'red', dx: 6, align: 'left' });
          sA.text('$C_c$', 0, cc, { size: 12, color: 'orange', dx: 6, dy: -9, align: 'left' });
          sA.text('$C_0$', X, c0, { size: 12, color: 'muted', dx: -6, dy: -9, align: 'right' });
          h.set(h.x, prof(h.x));
          // case depth against time
          for (const [dT, col] of [[-50, 'blue'], [0, 'green'], [50, 'red']]) sB.fn((hh) => depth(T + dT, hh), { color: col, width: dT === 0 ? 3 : 1.8 });
          sB.hline(Xt.value, { color: 'red', dash: [6, 4] });
          sB.dot(hrs, xc, { r: 6, color: 'gold' });
          const tNeed = ((Xt.value / (2 * z)) ** 2 / D) / 3600;
          info = { D, xc, tNeed, err, L, T, z, probe: h.x, cp: prof(h.x) };
        });
        v.legend([['green', 'erf solution'], ['gold', 'finite differences', { dot: true }], ['orange', 'case boundary'], ['red', 'required depth']]);
        v.readout(() => {
          const I = info; if (I.D === undefined) return '';
          return `At ${I.T} °C, $D_{\\rm C}=${v.sci(I.D * 1e-6, 2)}\\ \\mathrm{m^2/s}$, so $2\\sqrt{Dt}=${v.fix(I.L, 2)}$ mm. Level $C_c$ lies at $x=2z\\sqrt{Dt}=${v.fix(I.xc, 2)}$ mm ($z=${v.fix(I.z, 3)}$); the finite-difference solution agrees with the formula to $${v.sci(I.err, 1)}$ wt%.\nThe required ${v.fix(Xt.value, 2)} mm case takes **${fmtTime(I.tNeed * 3600)}** at this temperature. Probe at $x=${v.fix(I.probe, 2)}$ mm: $C=${v.fix(I.cp, 3)}$ wt%.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Law',
      name: 'Arrhenius temperature dependence of diffusivity',
      statement: String.raw`The diffusion coefficient of an atomic species in a crystal depends on temperature as $$D=D_0\exp\!\Big(-\frac{Q}{RT}\Big),$$ where $D_0$ is a (nearly) temperature-independent prefactor and $Q$ the activation energy per mole. With per-atom activation energy $E_a$, the exponent is instead $-E_a/(k_BT)$, with $Q=N_AE_a$. On a plot of $\ln D$ against $1/T$ the data fall on a straight line of slope $-Q/R$ and intercept $\ln D_0$. Using molar energies consistently, the vacancy mechanism has $Q=E_f+E_m$, whereas an interstitial jump has only its migration contribution. A lower activation energy makes a shallower Arrhenius line, but the diffusivity ranking also depends on $D_0$, the host phase and the mechanisms present.`,
      idea: String.raw`Diffusion is the net outcome of many thermally activated jumps (2.5), and a jump rate is $\nu\,e^{-E/kT}$ by the Boltzmann factor of the barrier (kin-2.1). Writing $D=\tfrac16\Gamma a^2$ and collecting the geometric factors, the attempt frequency, and any entropy of migration into $D_0$ gives the law. Because $Q$ is large (a typical $2$ eV $=190$ kJ/mol), for $Q=190$ kJ/mol the constant-parameter law increases $D$ by about $3$ on heating from $1000$ to $1050$ K, which is why heat treatments are so sensitive to furnace temperature.

With positive $D_0,T$ and fixed activation parameters, the inverse-exponential and product laws pma 8.6 give $\log D=\log D_0-Q/(RT)$. This is the exact affine dependence on reciprocal temperature used by the plot. For two temperatures the same laws give the diffusivity ratio without estimating a numerical slope from the picture. The line interpretation holds for the chosen single mechanism; adding mechanisms or changing phase does not preserve one constant activation slope.`,
      caption: String.raw`Every line is one diffusing species, in the standard Arrhenius plot ($\log D$ against $1000/T$). Hover to identify a line, click to select it; drag the gold handle along the temperature axis to read $D$ at that temperature. The two grey guide lines mark the diffusivities at which an atom spreads $1\,\mu\mathrm m$ in an hour and in a year. Interstitial carbon (orange) crosses both at much lower temperature than the substitutional species (blue, purple); dopants in silicon (teal) lie on the steep end.`,
      deps: ['mat-2.5','kin-2.1','pma-8.6'],
      refs: ['Callister §5.5'],
      credit: 'S. Arrhenius, 1889; first applied to solid-state diffusion by Dushman and Langmuir, 1922',
      tags: ['Arrhenius', 'diffusion', 'activation energy'],
      scope: String.raw`Holds for a single, thermally activated mechanism over a modest range of temperature; the curve bends when a second mechanism (grain-boundary, 2.10) takes over, or at a phase transformation (the $\alpha$/$\gamma$ switch of iron). $D_0$ and $Q$ are the tabulated textbook values (Callister Table 5.2; Fair/Sze for the dopants).`,
      viz(v) {
        const s = v.stage({ x: [0.6, 2.6], y: [1e-30, 1e-6], ylog: true, axes: 'box', gutter: true, height: 420, hover: true, xlabel: '1000 / T  (K⁻¹)      ← hotter', ylabel: '$D$ (m²/s)', title: 'diffusivity of each species', xticks: [[0.6, '0.6'], [0.8, '0.8'], [1, '1.0'], [1.25, '1.25'], [1.5, '1.5'], [2, '2.0'], [2.5, '2.5']] });
        let cur = DIFF.findIndex((d) => d.id === 'C-g');
        const Dx = (d, x) => Dof(d, 1000 / x);
        const h = s.handle(1.0, 3e-28, { color: 'gold', r: 8, constrain: 'x', label: 'T', labelPos: 'n' });
        const near = (x, y, tol = 0.7) => { let b = -1, bd = tol; DIFF.forEach((d, i) => { const dd = Math.abs(Math.log10(Dx(d, x)) - Math.log10(y)); if (dd < bd) { bd = dd; b = i; } }); return b; };
        s.onClick((x, y) => { const b = near(x, y, 1.2); if (b >= 0) cur = b; });
        let hov = -1;
        v.render(() => {
          s.hline(1e-12 / 3600, { color: 'muted', dash: [4, 4], alpha: 0.8 });
          s.hline(1e-12 / 3.15576e7, { color: 'muted', dash: [4, 4], alpha: 0.8 });
          s.text('1 µm in 1 hour', 2.58, 1e-12 / 3600, { size: 11, color: 'muted', align: 'right', dy: -9 });
          s.text('1 µm in 1 year', 2.58, 1e-12 / 3.15576e7, { size: 11, color: 'muted', align: 'right', dy: -9 });
          DIFF.forEach((d, i) => s.fn((x) => Dx(d, x), { color: MECH[d.mech][0], width: i === cur ? 4 : 1.8, alpha: i === cur ? 1 : 0.55 }));
          const c = DIFF[cur];
          s.text(c.label, 2.0, Dx(c, 2.0), { size: 13, color: MECH[c.mech][0], weight: 700, dy: -14, plate: true });
          hov = s.pointer && s.pointer.inside ? near(s.pointer.x, s.pointer.y) : -1;
          if (hov >= 0 && hov !== cur) s.text(DIFF[hov].label, s.pointer.x, s.pointer.y, { size: 12, color: 'ink', dy: -14, plate: true });
          s.vline(h.x, { color: 'gold', alpha: 0.7 });
          for (const d of DIFF) s.dot(h.x, Dx(d, h.x), { r: d === c ? 6 : 3.5, color: MECH[d.mech][0] });
        });
        v.legend(Object.values(MECH).map(([c, l]) => [c, l]));
        v.readout(() => {
          const T = 1000 / h.x, c = DIFF[cur];
          const vals = DIFF.map((d) => Dof(d, T)), imax = vals.indexOf(Math.max(...vals)), imin = vals.indexOf(Math.min(...vals));
          const x1 = 0.9, x2 = 1.9, slope = (Math.log(Dx(c, x2)) - Math.log(Dx(c, x1))) / (x2 - x1);
          return `**${c.label}**: $D_0=${v.sci(c.D0, 2)}\\ \\mathrm{m^2/s}$, $Q=${v.fix(c.Q, 0)}$ kJ/mol $=${v.fix(c.Q / EV_KJ, 2)}$ eV. At $T=${v.fix(T, 0)}$ K: $D=${v.sci(Dof(c, T), 2)}\\ \\mathrm{m^2/s}$, so $\\sqrt{Dt}$ is ${fmtLen(Math.sqrt(Dof(c, T) * 3600))} in an hour and ${fmtLen(Math.sqrt(Dof(c, T) * 3.15576e7))} in a year.\nSlope of the line: $Q=-R\\,d\\ln D/d(1/T)=${v.fix(-RG * slope, 0)}$ kJ/mol, as tabulated. At this temperature the fastest species here is ${DIFF[imax].label} and the slowest ${DIFF[imin].label}, a ratio of $${v.sci(vals[imax] / vals[imin], 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Proposition',
      name: 'Diffusion length √(Dt) and heat-treatment scaling',
      statement: String.raw`Diffusion over a time $t$ spreads atoms over a distance of order $\ell\approx\sqrt{Dt}$ (up to a numerical factor of order one: $2\sqrt{Dt}$ for the erfc profile, $\sqrt{2Dt}$ per dimension for $\langle x^2\rangle=2Dt$). To spread atoms over a given distance $\ell$ one therefore needs a time $$t\approx\frac{\ell^2}{D(T)}=\frac{\ell^2}{D_0}\,e^{Q/RT},$$ which grows as the square of the distance and falls exponentially with temperature. Raising the temperature from $T$ to $T+\Delta T$ shortens the treatment by the factor $\exp\!\big[\tfrac{Q}{R}\big(\tfrac1T-\tfrac1{T+\Delta T}\big)\big]\approx\exp\!\big(Q\,\Delta T/RT^2\big)$.`,
      idea: String.raw`In Fick's second law (2.6) the only combination of $D$, $x$ and $t$ with no units left over is $x/\sqrt{Dt}$, so the free or semi-infinite, single-scale profiles considered here have length scale $\sqrt{Dt}$; finite boundaries or other imposed scales can change this similarity description; this is the same fact that makes a random walk spread as $\sqrt t$ ($\langle x^2\rangle=2Dt$, Einstein–Smoluchowski). Combine it with the Arrhenius law (2.7) and the time to reach a given scale is $\ell^2/D(T)$: an anneal of a week at $T$ is an anneal of hours at $T+100$ K if $Q\gtrsim 200$ kJ/mol near $1000$ K.

Taylor's theorem (pma 5.15) applies to $f(T)=1/T$ on any closed positive-temperature interval joining $T$ and $T+\Delta T$. It gives $f(T+\Delta T)=1/T-\Delta T/T^2+(\Delta T)^2/\xi^3$ for an intermediate positive xi. Substitution in the exact logarithm of the treatment-time ratio gives the stated first-order exponent and its quadratic remainder. The approximation requires a sufficiently small temperature step relative to T; the exact exponential ratio is the comparison for finite steps.`,
      caption: String.raw`Choose the species and the length you want atoms to move; the left plot gives the anneal time as a function of temperature. Drag the gold point and set the temperature step: the second point shows how much time a hotter treatment saves. On the right, the same two temperatures as $\sqrt{Dt}$ against time on log axes: two parallel lines of slope ½.`,
      deps: ['mat-2.6','pchem-10.3','pma-5.15'],
      refs: ['Callister §5.4'],
      tags: ['diffusion length', 'heat treatment', 'scaling'],
      scope: String.raw`Order-of-magnitude statement: the numerical factor depends on the geometry and on which profile level one calls the "depth". Uses the same textbook $D_0$, $Q$ values as 2.7 and assumes one mechanism over the temperature range shown.`,
      viz(v) {
        const systems = [['C-g', 'C in γ-Fe', 1100, 300], ['Cu-Cu', 'Cu in Cu', 900, 100], ['Fe-a', 'Fe in α-Fe', 1000, 100], ['B-Si', 'B in Si', 1400, 1]];
        const sys = v.select('species', systems.map(([value, label]) => ({ value, label })), 'C-g', { onChange: (k) => { const s = systems.find((q) => q[0] === k); Ts.set(s[2]); Ls.set(s[3]); } });
        const Ls = v.slider('target length $\\sqrt{Dt}$ (µm)', 0.1, 10000, 300, { log: true, sig: 2 });
        const Ts = v.slider('$T$ (K)', 600, 1600, 1100, { step: 5 });
        const dT = v.slider('hotter by $\\Delta T$ (K)', 0, 300, 100, { step: 5 });
        const tOf = (T) => { const D = Dof(DID[sys.value], T); return (Ls.value * 1e-6) ** 2 / D; };
        const sA = v.stage({ x: [600, 1600], y: [1e-1, 1e16], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.3, minWidth: 280, xlabel: 'temperature $T$ (K)', ylabel: 'time needed', title: 'anneal time for the chosen length', yticks: [[1, '1 s'], [3600, '1 h'], [86400, '1 d'], [3.15576e7, '1 yr'], [3.15576e10, '1 kyr'], [3.15576e13, '1 Myr']] });
        const sB = v.stage({ x: [1, 1e10], y: [1e-2, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xlabel: 'time  $t$ (s)', ylabel: '$\\sqrt{Dt}$ (µm)', title: 'the diffusion length against time', xticks: [[1, '1 s'], [3600, '1 h'], [86400, '1 d'], [3.15576e7, '1 yr'], [3.15576e9, '100 yr']] });
        const h = sA.handle(1100, 1e8, { color: 'gold', r: 8, label: 'T', labelPos: 'ne' });
        h.constrain = (x) => { const xx = clamp(x, 610, 1590); return [xx, clamp(tOf(xx), 0.11, 1e15)]; };
        h.onDrag = () => Ts.set(Math.round(h.x));
        let info = {};
        v.render(() => {
          const d = DID[sys.value], T = Ts.value, T2 = T + dT.value, t1 = tOf(T), t2 = tOf(T2);
          for (const [sec, lab] of [[3600, '1 hour'], [86400, '1 day'], [6.048e5, '1 week'], [3.15576e7, '1 year']]) { sA.hline(sec, { color: 'muted', alpha: 0.5, dash: [3, 4] }); }
          sA.fn((T_) => tOf(T_), { n: 200, color: 'accent', width: 3 });
          sA.vline(T, { color: 'gold', alpha: 0.6 }); sA.vline(T2, { color: 'green', alpha: 0.6, dash: [5, 4] });
          sA.dot(T2, clamp(t2, 0.11, 1e15), { r: 7, color: 'green' });
          sA.segment([T, clamp(t1, 0.11, 1e15)], [T2, clamp(t2, 0.11, 1e15)], { color: 'green', width: 2, alpha: 0.8 });
          h.set(T, clamp(t1, 0.11, 1e15));
          const L = Ls.value;
          for (const [TT, col, w] of [[T, 'gold', 3], [T2, 'green', 2.4]]) { const Dd = Dof(d, TT); sB.fn((t) => Math.sqrt(Dd * t) * 1e6, { color: col, width: w }); }
          sB.hline(L, { color: 'red', dash: [6, 4] });
          sB.dot(clamp(t1, 1.01, 9e9), L, { r: 6, color: 'gold' });
          sB.dot(clamp(t2, 1.01, 9e9), L, { r: 6, color: 'green' });
          info = { t1, t2, T, T2, ratio: t1 / t2, approx: Math.exp((d.Q * 1000 * dT.value) / (RG * T * T2)), d };
        });
        v.legend([['accent', 'time needed'], ['gold', 'at T'], ['green', 'at T + ΔT'], ['red', 'target length']]);
        v.readout(() => {
          const I = info; if (!I.t1) return '';
          return `${I.d.label}, $\\sqrt{Dt}=${v.fix(Ls.value, Ls.value < 10 ? 1 : 0)}$ µm: at $T=${I.T}$ K the anneal takes **${fmtTime(I.t1)}**; at $T+\\Delta T=${I.T2}$ K it takes **${fmtTime(I.t2)}**, shorter by a factor $${v.sci(I.ratio, 2)}$ (the exponential estimate gives $${v.sci(I.approx, 2)}$, using $Q=${v.fix(I.d.Q, 0)}$ kJ/mol).\nDoubling the length instead would multiply the time by 4 at either temperature.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Kirkendall effect',
      statement: String.raw`When two metals A and B are welded together and annealed, inert markers (fine wires) placed at the original interface do not stay put relative to the ends of the specimen: they drift toward the side that is losing the **faster** diffuser (the brass, when zinc outruns copper), and the shift grows as $\sqrt t$. Pores often form on that same side, where the vacancies pile up. If the intrinsic diffusivities are $D_A$ and $D_B$ and $N$ is the mole fraction of A, the lattice (and marker) velocity is $$v_m=(D_A-D_B)\,\frac{\partial N}{\partial x},$$ and the observed interdiffusion coefficient is Darken's $\tilde D=N_BD_A+N_AD_B$. Only if $D_A=D_B$ are the markers stationary.`,
      idea: String.raw`If atoms exchanged places directly, equal numbers of A and B atoms would cross any plane and nothing could move. With a vacancy mechanism (2.5), the faster species A takes more atoms out of its side than the slower B puts back, so there is a net flow of atoms one way and an equal and opposite flow of vacancies. The lattice planes must absorb the vacancies (by climbing dislocations), shifting the whole lattice, markers included, by the net amount; where the vacancies cannot be absorbed they condense into pores. Because the effect cannot occur by direct exchange, it was the decisive evidence that diffusion in metals goes by vacancies.`,
      caption: String.raw`Left: the zinc profile of a copper/brass couple after time $t$ (dashed: the starting step), with five markers carried by the lattice flow. Middle: how far the marker that began at the interface has moved, against $\sqrt t$: a straight line. Bottom: the specimen itself, coloured by composition, with markers and the pores that open where vacancies pile up. Set $D_{\rm Zn}=D_{\rm Cu}$ and the markers stay still.`,
      deps: ['mat-2.5', 'mat-2.6'],
      refs: ['Callister §5.2'],
      credit: 'A. D. Smigelskas and E. O. Kirkendall, 1947; analysed by L. S. Darken, 1948',
      tags: ['Kirkendall', 'interdiffusion', 'vacancy mechanism'],
      scope: String.raw`Constant molar volume, intrinsic diffusivities that do not depend on composition, and vacancies in local equilibrium (perfect sinks) when computing the marker motion. Pores need supersaturation that real dislocation climb often relieves; the pore threshold shown is illustrative. Lengths are in units of $\sqrt{D_{\rm Cu}t_0}$.`,
      viz(v) {
        const rS = v.slider('$D_{\\rm Zn}/D_{\\rm Cu}$', 1, 8, 3, { step: 0.1 });
        const NS = v.slider('zinc in the brass (at.%)', 10, 45, 30, { step: 1 });
        const tS = v.slider('time $t$', 0.02, 0.5, 0.25, { step: 0.01 });
        const n = 401, L = 4, dx = (2 * L) / (n - 1), xs = Array.from({ length: n }, (_, i) => -L + i * dx);
        const run = () => {
          const r = rS.value, N0 = NS.value / 100, tEnd = tS.value;
          const N = new Float64Array(n), ex = new Float64Array(n), Dt = new Float64Array(n);
          for (let i = 0; i < n; i++) N[i] = xs[i] > 0 ? N0 : 0;
          const mk = [-0.8, -0.4, 0, 0.4, 0.8], hist = [[0, 0]];
          const dN = (i) => (N[Math.min(n - 1, i + 1)] - N[Math.max(0, i - 1)]) / (2 * dx);
          const vel = (x) => { const f = (x + L) / dx, i = clamp(Math.floor(f), 1, n - 3), w = f - i; return (r - 1) * ((1 - w) * dN(i) + w * dN(i + 1)); };
          const ns = 120; let tp = 0;
          for (let k = 1; k <= ns; k++) {
            const tk = tEnd * (k / ns) ** 2, dt = tk - tp;
            for (let i = 0; i < n; i++) Dt[i] = (1 - N[i]) * r + N[i];
            for (let m = 0; m < mk.length; m++) mk[m] += vel(mk[m]) * dt;
            for (let i = 1; i < n - 1; i++) ex[i] += -(r - 1) * ((N[i + 1] - 2 * N[i] + N[i - 1]) / (dx * dx)) * dt;
            implicitStep(N, Dt, dt, dx, 0, N0);
            tp = tk; hist.push([Math.sqrt(tk), mk[2] - 0]);
          }
          return { N, ex, mk, hist, r, N0, dN };
        };
        const sA = v.stage({ x: [-2.6, 2.6], y: [0, 0.5], axes: 'box', gutter: true, height: 300, weight: 1.3, minWidth: 280, xlabel: 'position  $x$', ylabel: 'zinc fraction $N$', title: 'concentration profile and markers' });
        const sB = v.stage({ x: [0, 0.75], y: [0, 0.6], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 240, xlabel: '$\\sqrt t$', ylabel: 'marker shift', title: 'Kirkendall shift grows as √t' });
        const sC = v.stage({ x: [-2.6, 2.6], y: [0, 1], axes: false, height: 140, full: true, title: 'the specimen: copper (left), brass (right), markers and pores' });
        let R = null, ver = 0;
        const rng = v.rng(9);
        const voids = Array.from({ length: 600 }, () => [rng(), rng()]);
        v.render(() => {
          R = run(); ver++;
          const { N, ex, mk, hist, r, N0 } = R;
          sA.setView([-2.6, 2.6], [0, N0 * 1.2]);
          sA.path([[-2.6, 0], [0, 0], [0, N0], [2.6, N0]], { color: 'muted', dash: [5, 4], width: 1.6 });
          sA.path(xs.map((x, i) => [x, N[i]]), { color: 'accent', width: 3 });
          sA.vline(0, { color: 'faint' });
          const prof = (x) => { const f = (x + L) / dx, i = clamp(Math.floor(f), 0, n - 2), w = f - i; return (1 - w) * N[i] + w * N[i + 1]; };
          mk.forEach((x, m) => sA.dot(x, prof(x), { r: m === 2 ? 8 : 5, color: 'gold' }));
          sA.text('markers', mk[2], prof(mk[2]), { size: 11, color: 'gold', dx: 8, dy: 22, align: 'left' });
          sB.setView([0, 0.75], [0, Math.max(0.12, 1.15 * (mk[2] || 0))]);
          const shift = hist[hist.length - 1][1];
          sB.path(hist, { color: 'gold', width: 3 });
          sB.line(0, 0, hist[hist.length - 1][0], shift, { color: 'muted', dash: [4, 4] });
          sB.dot(hist[hist.length - 1][0], shift, { r: 6, color: 'gold' });
          // specimen strip
          const c1 = v.rgb('orange'), c2 = v.rgb('gold');
          sC.raster((x) => { const w = clamp(prof(x) / N0, 0, 1); return [c1[0] + (c2[0] - c1[0]) * w, c1[1] + (c2[1] - c1[1]) * w, c1[2] + (c2[2] - c1[2]) * w, 0.55]; }, { res: 3, key: `${rS.value}|${NS.value}|${tS.value}|${ver}|${v.color('ink')}` });
          const thr = 0.03;
          for (let i = 1; i < n - 1; i++) { const cnt = Math.min(9, Math.floor(Math.max(0, ex[i]) / thr)); for (let k = 0; k < cnt; k++) { const q = voids[(i * 7 + k * 13) % voids.length]; sC.dot(xs[i] + (q[0] - 0.5) * dx * 6, 0.15 + 0.7 * q[1], { r: 2 + (k % 3) * 0.8, hollow: true, color: 'ink' }); } }
          for (const x of mk) sC.vline(x, { color: 'ink', width: 2.2 });
          sC.vline(0, { color: 'faint', dash: [3, 4] });
          sC.text('Cu', -2.4, 0.5, { size: 14, color: 'ink', weight: 700 });
          sC.text('Cu–Zn brass', 2.5, 0.08, { size: 13, color: 'ink', weight: 700, align: 'right' });
        });
        v.legend([['accent', 'Zn profile'], ['gold', 'inert markers', { dot: true }], ['ink', 'pores (vacancy condensation)']]);
        v.readout(() => {
          if (!R) return '';
          const { mk, hist, r, N0, N, ex } = R, sh = hist[hist.length - 1][1], sq = hist[hist.length - 1][0];
          let ip = 0; for (let i = 0; i < n; i++) if (ex[i] > ex[ip]) ip = i;
          const nb = Math.round(0.5 * n), dn = R.dN(nb), JZn = -r * dn, JCu = dn;
          return `Marker shift $=${v.fix(sh, 3)}$ (towards the **${sh >= 0 ? 'zinc-rich' : 'copper'}** side), i.e. $${sq > 0 ? v.fix(sh / sq, 3) : '0'}\\sqrt t$ at every instant. At the interface the zinc flux is $J_{\\rm Zn}=${v.fix(JZn, 3)}$ and the copper flux $J_{\\rm Cu}=${v.fix(JCu, 3)}$ (in units of $\\rho D_{\\rm Cu}/x_0$); they do not cancel, the difference $${v.fix(JZn + JCu, 3)}$ being carried by vacancies.\n${r === 1 ? '$D_{\\rm Zn}=D_{\\rm Cu}$: no shift.' : `Vacancies pile up most near $x=${v.fix(xs[ip], 2)}$ on the brass side (the pores).`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Short-circuit diffusion along grain boundaries and surfaces',
      statement: String.raw`Atoms move much faster along grain boundaries, dislocation cores and free surfaces than through the perfect lattice, because these regions are open and have no need of a vacancy. Their activation energies are lower, roughly $Q_{\rm surface}<Q_{\rm gb}<Q_{\rm lattice}$ (a rule of thumb is $Q_{\rm gb}\approx 0.5$–$0.6\,Q_{\rm l}$), though their prefactors are of similar size. For a polycrystal of grain size $d$ and boundary width $\delta$ the effective diffusivity is the weighted sum $D_{\rm eff}=(1-f)D_{\rm l}+fD_{\rm gb}$ with the boundary volume fraction $f\approx3\delta/d$, so on an Arrhenius plot it follows the lattice line at high temperature and bends to the boundary line at low temperature.`,
      idea: String.raw`Two parallel paths add their conductances. The lattice path has the large activation energy $Q_{\rm l}$ but all the volume; the boundary path has the small $Q_{\rm gb}$ but only the fraction $f$ of it. The ratio of the two contributions, $fD_{\rm gb}/D_{\rm l}\propto e^{(Q_{\rm l}-Q_{\rm gb})/RT}/d$, rises as $T$ falls, so there is always a crossover temperature below which the boundaries carry most of the flux, and it moves up when the grains are made finer (larger $f$). This is why nanocrystalline materials diffuse and sinter at low temperature and why thin metallic films fail by electromigration along their boundaries.`,
      caption: String.raw`Left: a polycrystal of 25 grains with their boundaries (width exaggerated for visibility). Right: the lattice (blue), boundary (orange) and surface (pink) diffusivities and the effective value in the polycrystal (heavy line) for the grain size and boundary width you choose; the dot marks the crossover. Make the grains finer and watch the boundary regime take over at higher temperature; drag the gold handle to read the share of the flux carried by the boundaries.`,
      deps: ['mat-2.7'],
      refs: ['Callister §5.7'],
      tags: ['grain boundaries', 'short-circuit diffusion', 'nanocrystalline'],
      scope: String.raw`Illustrative silver-like parameters ($Q_{\rm l}=1.9$ eV, $Q_{\rm gb}=0.95$ eV, $Q_{\rm s}=0.45$ eV; prefactors chosen to be of the same order), not data for one metal. Hart's formula holds for fast boundaries that do not exchange much solute with the grains (Harrison type-C and type-A limits).`,
      viz(v) {
        const Dl = (T) => 4e-5 * Math.exp(-1.9 / (KB * T)), Dg = (T) => 1e-5 * Math.exp(-0.95 / (KB * T)), Ds = (T) => 1e-5 * Math.exp(-0.45 / (KB * T));
        const dS = v.slider('grain size $d$ (µm)', 0.01, 100, 10, { log: true, sig: 2 });
        const delS = v.slider('boundary width $\\delta$ (nm)', 0.3, 2, 0.5, { step: 0.05 });
        const Ts = v.slider('$T$ (K)', 450, 1300, 800, { step: 5 });
        const fOf = () => Math.min(0.9, (3 * delS.value * 1e-9) / (dS.value * 1e-6));
        const Deff = (T) => (1 - fOf()) * Dl(T) + fOf() * Dg(T);
        const sP = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 340, weight: 0.9, minWidth: 250, title: 'polycrystal and its grain boundaries' });
        const sA = v.stage({ x: [0.75, 2.2], y: [1e-26, 1e-4], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 280, xlabel: '1000 / T  (K⁻¹)', ylabel: '$D$ (m²/s)', title: 'Arrhenius plot: four diffusivities' });
        const rng = v.rng(14);
        const seeds = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) seeds.push([(i + 0.15 + 0.7 * rng()) / 5, (j + 0.15 + 0.7 * rng()) / 5]);
        const tint = seeds.map(() => 0.1 + 0.18 * rng());
        const ca = v.rgb('accent'), co = v.rgb('orange');
        const h = sA.handle(1.25, 1e-24, { color: 'gold', r: 8, constrain: 'x', label: 'T', labelPos: 'n' });
        h.onDrag = () => Ts.set(Math.round(1000 / h.x));
        let info = {};
        v.render(() => {
          sP.raster((x, y) => {
            let d1 = 9, d2 = 9, i1 = 0;
            for (let k = 0; k < seeds.length; k++) { const d = Math.hypot(x - seeds[k][0], y - seeds[k][1]); if (d < d1) { d2 = d1; d1 = d; i1 = k; } else if (d < d2) d2 = d; }
            return d2 - d1 < 0.012 ? [co[0], co[1], co[2], 0.95] : [ca[0], ca[1], ca[2], tint[i1]];
          }, { res: 3, key: `v${v.color('ink')}` });
          sP.text(`grain size d = ${dS.value < 1 ? (dS.value * 1000).toFixed(0) + ' nm' : dS.value.toFixed(dS.value < 10 ? 1 : 0) + ' µm'}  (5 grains across ≈ 5d)`, 0.5, 0.06, { size: 12, color: 'ink', align: 'center', plate: true });
          const f = fOf();
          sA.vline(1000 / 1235, { color: 'red', dash: [5, 4], alpha: 0.6 });
          sA.text('$T_m$ (silver-like)', 1000 / 1235, 3e-25, { size: 11, color: 'red', dx: 5, align: 'left' });
          for (const [fn, c, w] of [[Ds, 'pink', 2], [Dg, 'orange', 2], [Dl, 'accent', 2]]) sA.fn((x) => fn(1000 / x), { color: c, width: w });
          sA.fn((x) => Deff(1000 / x), { color: 'ink', width: 4 });
          // crossover temperature: f D_gb = (1-f) D_l
          let xc = null; for (let x = 0.76; x < 2.2; x += 0.002) { const T = 1000 / x; if (f * Dg(T) >= (1 - f) * Dl(T)) { xc = x; break; } }
          if (xc) { sA.dot(xc, Deff(1000 / xc), { r: 7, color: 'gold' }); sA.text('crossover', xc, Deff(1000 / xc), { size: 12, color: 'ink', dx: 10, dy: -14, align: 'left' }); }
          h.set(1000 / Ts.value, 1e-24);
          const T = Ts.value, share = (f * Dg(T)) / ((1 - f) * Dl(T) + f * Dg(T));
          sA.vline(1000 / T, { color: 'gold', alpha: 0.7 });
          info = { f, xc, T, share, De: Deff(T), Dl: Dl(T), Dg: Dg(T) };
        });
        v.legend([['pink', 'surface'], ['orange', 'grain boundary'], ['accent', 'lattice'], ['ink', 'effective, polycrystal']]);
        v.readout(() => {
          const I = info; if (I.f === undefined) return '';
          return `Boundary fraction $f=3\\delta/d=${v.sci(I.f, 2)}$. At $T=${I.T}$ K: $D_{\\rm l}=${v.sci(I.Dl, 2)}$, $D_{\\rm gb}=${v.sci(I.Dg, 2)}$, $D_{\\rm eff}=${v.sci(I.De, 2)}\\ \\mathrm{m^2/s}$; the boundaries carry **${v.fix(100 * I.share, I.share > 0.99 || I.share < 0.01 ? 2 : 0)}%** of the flux.\n${I.xc ? `Crossover at $T\\approx${v.fix(1000 / I.xc, 0)}$ K${1000 / I.xc > 1235 ? ' (above the melting point: boundaries dominate at every temperature)' : ''}.` : 'The lattice dominates over the whole range shown.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Method',
      name: 'Dopant diffusion in silicon',
      statement: String.raw`Junctions in silicon devices are made by a two-step diffusion. In the **pre-deposition** a surface is held at the dopant's solid-solubility concentration $C_s$ at temperature $T_1$ for time $t_1$, giving $C(x)=C_s\operatorname{erfc}\!\big(x/2\sqrt{D_1t_1}\big)$ and a total dose $Q=2C_s\sqrt{D_1t_1/\pi}$. In the **drive-in** the dopant source is removed and the wafer is annealed at a higher $T_2$ for $t_2$, so the dose stays fixed and spreads into a Gaussian $$C(x,t_2)=\frac{Q}{\sqrt{\pi D_2t_2}}\exp\!\Big(-\frac{x^2}{4D_2t_2}\Big)$$ (valid when $D_2t_2\gg D_1t_1$). The **junction depth** $x_j$ is where $C$ falls to the background doping $C_B$ of the opposite type.`,
      idea: String.raw`Both steps solve Fick's second law (2.6) with different boundary conditions: a fixed surface concentration gives the erfc, and a closed surface with a fixed amount of dopant gives the Gaussian; the second is the first one's dose spreading out by the same $\sqrt{Dt}$ law. The dopants' $D(T)$ obeys the Arrhenius law (2.7) with $Q\approx3.5$–$4$ eV, so a few tens of degrees change the junction depth appreciably and the temperature must be controlled within a degree or so.

The normalization proved for the standard normal density (prob 1.2.5), followed by scaling and its even symmetry, gives $\int_0^\infty e^{-x^2/(4Dt)}dx=\sqrt{\pi Dt}$. The drive-in Gaussian therefore integrates to Q on the half-line, as required by the no-flux surface and fixed dose. This checks its amplitude, not merely its width. Its use as the late drive-in approximation still requires $D_2t_2\gg D_1t_1$ and the constant-diffusivity hypotheses; it does not make every finite pre-deposition profile exactly Gaussian.`,
      caption: String.raw`Choose the dopant and the two steps. The blue dashed curve is the erfc profile after pre-deposition; the solid curve is a numerical solution of the diffusion equation through the drive-in (no flux at the surface); the green dashed curve is the Gaussian formula. The red line is the background doping and the dots mark the junctions. The readout checks that the dose is conserved and compares the two junction depths.`,
      deps: ['mat-2.6','prob-1.2.5'],
      refs: ['Callister §5.6'],
      tags: ['semiconductors', 'doping', 'junction depth'],
      scope: String.raw`Constant (intrinsic) diffusivity, which holds at dopant concentrations below the intrinsic carrier density $n_i$ ($\approx10^{19}\,\mathrm{cm^{-3}}$ at $1100\,{}^\circ$C); at higher concentrations $D$ depends on $C$ and the profiles are no longer erfc or Gaussian. The surface concentration cannot exceed the dopant's solid solubility ($\sim10^{20}$–$10^{21}\,\mathrm{cm^{-3}}$).`,
      viz(v) {
        const M = v.M;
        const dop = v.select('dopant', [{ value: 'B-Si', label: 'boron' }, { value: 'P-Si', label: 'phosphorus' }, { value: 'As-Si', label: 'arsenic' }], 'B-Si');
        const T1 = v.slider('pre-deposition $T_1$ (°C)', 800, 1100, 950, { step: 5 });
        const t1 = v.slider('$t_1$ (min)', 2, 240, 30, { log: true, sig: 2 });
        const T2 = v.slider('drive-in $T_2$ (°C)', 1000, 1250, 1100, { step: 5 });
        const t2 = v.slider('$t_2$ (min)', 5, 600, 90, { log: true, sig: 2 });
        const Cs = v.slider('surface $C_s$ (cm⁻³)', 1e18, 1e21, 2e20, { log: true, sig: 2, fmt: (x) => x.toExponential(1).replace('e+', '×10^') });
        const CB = v.slider('background $C_B$ (cm⁻³)', 1e14, 1e17, 1e15, { log: true, sig: 2, fmt: (x) => x.toExponential(1).replace('e+', '×10^') });
        const s = v.stage({ x: [0, 1], y: [1e13, 1e21], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'depth  $x$ (µm)', ylabel: 'dopant concentration (cm⁻³)', title: 'dopant profiles' });
        let info = {};
        v.render(() => {
          const d = DID[dop.value], Da = Dof(d, T1.value + 273.15) * 1e12, Db = Dof(d, T2.value + 273.15) * 1e12; // µm²/s
          const ta = t1.value * 60, tb = t2.value * 60, cs = Cs.value, cb = CB.value;
          const L1 = 2 * Math.sqrt(Da * ta), L2 = 2 * Math.sqrt(Db * tb);
          const dose = 2 * cs * Math.sqrt((Da * 1e-8 * ta) / Math.PI); // cm⁻²  (D in cm²/s = µm²/s ×1e-8)
          const C2 = (x) => (dose / Math.sqrt(Math.PI * Db * 1e-8 * tb)) * Math.exp(-(x * x) / (L2 * L2)); // x in µm
          const peak = C2(0);
          const xjG = peak > cb ? L2 * Math.sqrt(Math.log(peak / cb)) : NaN;
          const xjP = cs > cb ? L1 * M.bisect((z) => M.erfc(z) - cb / cs, 0, 12, 1e-10) : NaN;
          const X = Math.max(0.25, 1.6 * (xjG || 0), 1.6 * (xjP || 0), 3 * L1);
          s.setView([0, X], [Math.min(1e13, cb / 10), cs * 4]);
          // numerical drive-in
          const n = 481, dx = X / (n - 1), c = new Float64Array(n), Dn = new Float64Array(n).fill(Db);
          for (let i = 0; i < n; i++) c[i] = cs * M.erfc((i * dx) / L1);
          const ns = 80; for (let k = 0; k < ns; k++) implicitStep(c, Dn, tb / ns, dx, null, 0);
          let doseN = 0; for (let i = 0; i < n - 1; i++) doseN += 0.5 * (c[i] + c[i + 1]) * dx * 1e-4;
          let xjN = NaN; for (let i = n - 1; i > 0; i--) if (c[i - 1] > cb && c[i] <= cb) { const w = (Math.log(c[i - 1]) - Math.log(cb)) / (Math.log(c[i - 1]) - Math.log(Math.max(c[i], 1e-300))); xjN = (i - 1 + w) * dx; break; }
          s.fn((x) => cs * M.erfc(x / L1), { n: 300, color: 'blue', dash: [6, 4], width: 2.2 });
          s.fn(C2, { n: 300, color: 'green', dash: [3, 4], width: 2.4 });
          s.path(Array.from(c, (y, i) => [i * dx, Math.max(y, 1e-300)]), { color: 'accent', width: 3.2 });
          s.hline(cb, { color: 'red', dash: [6, 4], width: 2 });
          s.text('background $C_B$', X * 0.99, cb, { size: 12, color: 'red', align: 'right', dy: -10 });
          if (xjP) s.dot(xjP, cb, { r: 6, color: 'blue' });
          if (xjN) s.dot(xjN, cb, { r: 7, color: 'gold' });
          info = { Da, Db, L1, L2, dose, doseN, xjG, xjP, xjN, peak, ratio: (Db * tb) / (Da * ta), cs };
        });
        v.legend([['blue', 'after pre-deposition (erfc)', { dash: [6, 4] }], ['accent', 'after drive-in (numerical)'], ['green', 'Gaussian formula', { dash: [3, 4] }], ['red', 'background doping']]);
        v.readout(() => {
          const I = info; if (I.Da === undefined) return '';
          const um = (x) => (isFinite(x) ? `${v.fix(x, x < 1 ? 3 : 2)}` : '—');
          return `$D_1=${v.sci(I.Da * 1e-12, 2)}$, $D_2=${v.sci(I.Db * 1e-12, 2)}\\ \\mathrm{m^2/s}$; $D_2t_2/D_1t_1=${v.fix(I.ratio, 0)}$. Dose $Q=${v.sci(I.dose, 2)}\\ \\mathrm{cm^{-2}}$; the numerical drive-in holds $${v.sci(I.doseN, 2)}$ (conserved to ${v.fix(100 * Math.abs(I.doseN / I.dose - 1), 2)}%).\nJunction after pre-deposition $x_j=${um(I.xjP)}$ µm; after drive-in: **numerical ${um(I.xjN)} µm**, Gaussian formula ${um(I.xjG)} µm${I.ratio < 10 ? ' (the formula is poor here: $D_2t_2$ is not much larger than $D_1t_1$)' : ''}. Surface concentration drops from $${v.sci(I.cs, 2)}$ to $${v.sci(I.peak, 2)}\\ \\mathrm{cm^{-3}}$.`;
        });
      },
    },
  ],
};
