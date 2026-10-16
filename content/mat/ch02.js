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
// Metals and interstitials: D0 and Q as tabulated in Callister's table of diffusion data (recalled from memory, see the report).
// Dopants in silicon: Fair/Sze-type intrinsic values (cm²/s converted), also recalled from memory.
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
      idea: String.raw`Making $n$ vacancies costs energy $nQ_v$, which grows linearly. But the vacancies can be placed on the $N$ sites in $\binom{N}{n}$ ways, and the Boltzmann entropy $k_B\ln\binom Nn$ lowers the free energy as $-TS$ by an amount that starts out steeper than any line (the slope of $n\ln n$ is infinite at zero). A free energy that falls steeply and then rises linearly must have a minimum at $n>0$; setting $dG/dn=0$ with Stirling's formula gives the exponential. It is the Boltzmann distribution applied to the single question "is this site occupied?".`,
      caption: String.raw`Left: the two terms of $G(n)$ in units of $kT$ per excess vacancy, so the minimum can be read as the point where the energy line and the entropy curve are furthest apart. Middle: their sum, zoomed in; the dashed curve is the dilute-limit formula $u(\ln u-1)$ with $u=n/n^\ast$. Right: the Arrhenius plot for the chosen metal; drag the gold point along it. Push $T$ past the melting mark and see the formula leave the regime where it describes a crystal.`,
      deps: ['pchem-9.1', 'pchem-3.10'],
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
      statement: String.raw`In an ionic crystal a point defect must not upset charge neutrality, so defects come in charged groups. A **Schottky defect** is a cation vacancy together with an anion vacancy (for $\mathrm{MX}$ salts; the ratio follows the formula unit in other compounds), the missing ions having moved to the surface or a boundary. A **Frenkel defect** is a vacancy together with the same ion sitting in an interstitial site nearby. Both are present in equilibrium, in the numbers $$\frac{n_S}{N}\approx \exp\!\Big(-\frac{E_S}{2k_BT}\Big),\qquad \frac{n_F}{\sqrt{NN_i}}\approx\exp\!\Big(-\frac{E_F}{2k_BT}\Big),$$ where $E_S$ and $E_F$ are the formation energies of a whole pair and $N_i$ is the number of interstitial sites. The crystal's dominant defect is the one with the smaller pair energy.`,
      idea: String.raw`Each kind of pair is a bound-defect version of the single vacancy of 2.1: the free energy has an energy cost $E$ per pair, and entropy from placing the two partners independently, so the product of the two defect fractions is fixed by $e^{-E/kT}$ (a mass-action law). For a pair the two partners have equal numbers, which turns that product into a square, and the half in the exponent. Schottky pairs prevail in crystals with similar cation and anion size and high coordination (NaCl), where an interstitial would be crowded; Frenkel pairs prevail where one ion is small and the structure open (AgCl, with its small Ag$^+$).`,
      caption: String.raw`Left: a slice of a rock-salt crystal (small cations, large anions). Add pairs of each kind, or remove a lone cation and watch the net-charge ledger fail. Right: how many defects there are at temperature $T$ for the two energies set below; drag the gold point and see that the cheaper mechanism wins by a factor that grows as $T$ falls. The crystal drawn has very many more defects than a real one.`,
      deps: ['mat-2.1', 'xtal-1.9'],
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
  ],
};
