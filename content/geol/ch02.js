// Geology & Geophysics — Chapter 2: Radiometric dating (part a: 2.1–2.6)
//
// Sources and provenance (Oct 2026):
//   decay constants and half-lives are conventional values quoted from memory (see ch02.shared.js): ²³⁸U 1.55125e-10/yr,
//   ²³⁵U 9.8485e-10/yr (Jaffey et al. 1971), ⁸⁷Rb 1.393e-11/yr (Nebel et al. 2011), ⁴⁰K 5.543e-10/yr, ¹⁴C half-life 5730 yr.
//   2.4  half-lives of the ²³⁸U series (²³⁴U 245.5 kyr, ²³⁰Th 75.4 kyr, ²²⁶Ra 1600 yr, ²²²Rn 3.82 d, ²¹⁰Pb 22.2 yr,
//        ²¹⁰Po 138.4 d) are from memory; the short-lived members between them are lumped (see the item).
//   2.6  the calibration curve is SCHEMATIC: anchor points typed from memory to follow the shape of IntCal20 (Reimer
//        et al. 2020) — ¹⁴C age ≈ cal age at 0–2 kyr, a plateau near 2 500 ¹⁴C yr, the offset growing to ≈ 4–5 kyr at
//        50 kyr — plus a 208-yr (de Vries) wiggle. It is not the real IntCal20 table.

import { LAM, U_RATIO, LN2, fmtYr, fmtMa, ageOf, ratioAt } from './ch02.shared.js';

const TAUC = 2 * Math.PI;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

export default {
  collection: 'geol',
  chapter: 2,
  title: 'Radiometric dating',
  summary: String.raw`Radioactive decay is a clock that heat, pressure and chemistry cannot reset. Measuring daughter and parent isotopes gives an age; the isochron method removes the need to know the initial daughter content; decay chains and concordia diagrams cross-check uranium–lead ages; and closure temperatures turn ages into thermal histories. Patterson's lead isotopes fixed the age of the Earth at 4.55 billion years.`,
  items: [
    // ───────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Law',
      name: 'Radioactive decay law',
      statement: String.raw`Each unstable nucleus of a given isotope has the same constant probability $\lambda\,dt$ of decaying in any short interval $dt$, whatever its age, temperature, pressure or chemical state. Hence a population of $N$ identical nuclei obeys $dN/dt=-\lambda N$, so
$$N(t)=N_0e^{-\lambda t}=N_02^{-t/T_{1/2}},\qquad T_{1/2}=\frac{\ln 2}{\lambda},$$
and for a daughter that is stable and absent at $t=0$, $D(t)=N_0-N(t)$. The decay of a single nucleus is random; the law is exact for the expected number and accurate to $\sim1/\sqrt N$ for the count.`,
      idea: String.raw`Memorylessness is the whole law: a nucleus that has survived to time $t$ is no more likely to decay than a fresh one, so the loss rate is proportional to the number left, the first-order equation of kinetics (kin-9.7) whose solution is the exponential. The nuclear decay constant depends on the strong, weak and electromagnetic forces inside the nucleus, which keV-scale chemical and thermal energies cannot touch (except for a few electron-capture cases at the per-cent level), which is why rocks can be used as clocks.`,
      caption: String.raw`Choose the number of atoms and drag the vertical handle along the time axis (in half-lives). Blue steps are the actual surviving fraction of this random sample, the smooth curves are $2^{-t/T}$ and $1-2^{-t/T}$; the grid shows each atom. Use few atoms to see the scatter, many to see the law. Press Resample for another random sample.`,
      deps: ['kin-9.7'],
      refs: ['Press–Siever', 'Turcotte–Schubert ch. 10'],
      tags: ['decay', 'exponential'],
      scope: String.raw`Holds for the nuclear decay of an isolated nucleus; the constant $\lambda$ may change only in extreme conditions (fully ionised atoms, electron-capture nuclides under enormous pressure), far outside any rock.`,
      viz(v) {
        const M_clamp = (x, a, b) => Math.max(a, Math.min(b, x));
        const iso = v.select('isotope', [
          { value: 5730, label: '$^{14}$C' }, { value: 7.04e8, label: '$^{235}$U' },
          { value: 4.468e9, label: '$^{238}$U' }, { value: 4.88e10, label: '$^{87}$Rb' },
        ], 4.468e9);
        const nsl = v.slider('atoms $N_0$', 10, 400, 100, { int: true, log: true });
        let seed = 7, dec = [];
        const draw = () => {
          const r = v.rng(seed), n = Math.round(nsl.value);
          dec = Array.from({ length: n }, () => -Math.log2(1 - r()));
          dec.sort((a, b) => a - b);
        };
        draw();
        v.button('Resample', () => { seed++; draw(); });
        let lastN = Math.round(nsl.value);
        const s = v.stage({ x: [0, 6], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'time (half-lives)', ylabel: 'fraction of atoms', height: 320 });
        const g = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 320, minWidth: 220, weight: 0.6 });
        const h = s.handle(1.6, 0.0, { color: 'gold', constrain: 'x', label: 't' });
        const count = (t) => { let k = 0; while (k < dec.length && dec[k] <= t) k++; return k; };
        let info = {};
        v.render(() => {
          const n = Math.round(nsl.value);
          if (n !== lastN) { lastN = n; draw(); }
          const t = M_clamp(h.x, 0, 6);
          s.fn((x) => Math.pow(2, -x), { color: 'blue', width: 2 });
          s.fn((x) => 1 - Math.pow(2, -x), { color: 'orange', width: 2 });
          const pts = [[0, 1]];
          dec.forEach((d, i) => { pts.push([d, 1 - i / n], [d, 1 - (i + 1) / n]); });
          pts.push([6, 1 - dec.filter((d) => d <= 6).length / n]);
          s.path(pts.filter((p) => p[0] <= 6), { color: 'blue', width: 1, alpha: 0.7 });
          const pts2 = [[0, 0]];
          dec.forEach((d, i) => { pts2.push([d, i / n], [d, (i + 1) / n]); });
          pts2.push([6, dec.filter((d) => d <= 6).length / n]);
          s.path(pts2.filter((p) => p[0] <= 6), { color: 'orange', width: 1, alpha: 0.7 });
          s.hline(0.5, { color: 'faint', dash: true });
          s.vline(1, { color: 'faint', dash: true });
          s.vline(t, { color: 'gold', width: 1.5 });
          const k = count(t), P = n - k;
          s.dot(t, P / n, { color: 'blue', r: 5 });
          s.dot(t, k / n, { color: 'orange', r: 5 });
          const cols = Math.ceil(Math.sqrt(n * 1.0)), rows = Math.ceil(n / cols), sz = 0.9 / cols;
          for (let i = 0; i < n; i++) {
            const cx = (i % cols) / cols + 0.05 * 1.0, cy = 1 - (Math.floor(i / cols) + 1) / Math.max(cols, rows) - 0.0;
            const gone = dec[i] <= t;
            g.rect(0.03 + (i % cols) / cols * 0.94, 0.97 - (Math.floor(i / cols) + 1) / cols * 0.94, 0.03 + ((i % cols) + 0.82) / cols * 0.94, 0.97 - (Math.floor(i / cols) + 0.18) / cols * 0.94, { fill: gone ? 'orange' : 'blue', fillAlpha: 0.9, stroke: false });
          }
          info = { t, k, P, n };
        });
        v.legend([['blue', 'parent'], ['orange', 'daughter']]);
        v.readout(() => {
          const { t, k, P, n } = info, T = iso.value, lam = LN2 / T;
          const est = k > 0 ? Math.log(1 + k / Math.max(P, 0.5)) / lam : 0;
          return String.raw`At $t=${v.fix(t, 2)}\,T_{1/2}=$ **${fmtYr(t * T)}** (${'$'}T_{1/2}=$ ${fmtYr(T)}): expected survivors $N_02^{-t/T}=${v.fix(n * Math.pow(2, -t), 1)}$, counted $P=${P}$, $D=${k}$.
Age from the counted ratio, $\ln(1+D/P)/\lambda=$ **${fmtYr(est)}** (true ${fmtYr(t * T)}); the scatter is $\sim\!1/\sqrt{N}\approx${v.fix(100 / Math.sqrt(n), 0)}%$.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Proposition',
      name: 'The age equation',
      statement: String.raw`Let a mineral have closed at time $t$ before present and have contained no daughter then. If today it holds $P$ atoms of a radioactive parent (decay constant $\lambda$) and $D^*$ atoms of its radiogenic stable daughter, then $D^*=P(e^{\lambda t}-1)$, so
$$t=\frac1\lambda\ln\!\Bigl(1+\frac{D^*}{P}\Bigr).$$
For ${'$'}^{40}$K, which decays to ${'$'}^{40}$Ar only by a branch $\lambda_e$ of its total $\lambda$, the factor $\lambda/\lambda_e$ multiplies $D^*/P$ inside the logarithm. A relative error $\sigma_R$ of the measured ratio gives $\delta t=\sigma_R R/[\lambda(1+R)]$ with $R=D^*/P$.`,
      idea: String.raw`Counting atoms is the decay law (geol-2.1) read backwards: every parent atom that decayed produced one daughter, so parent now is $P=P_0e^{-\lambda t}$ and parent plus daughter equals the original $P_0$, giving $D^*/P=e^{\lambda t}-1$. Solving for $t$ gives the logarithm. Because $R$ rises linearly with $t$ for $\lambda t\ll1$ but only logarithmically in age for $\lambda t\gg1$, each system has a window: ratios far below $10^{-3}$ are lost in analytical error, ratios far above $10$ leave too little parent to measure. The exponential's inverse logarithm (pma 8.6) is the step that recovers elapsed time from $1+D^*/P=e^{\lambda t}$. It requires positive parent abundance and a positive logarithm argument; the closed-system assumption supplies the physical interpretation.`,
      caption: String.raw`Pick an isotope system and drag the dot along its curve: $x$ is the measured daughter/parent ratio, $y$ the age. The shaded band is the age error from the relative error of the ratio (slider). Note how fast ages climb in the Gyr-range systems and where each system is usable (the horizontal line is the age of the Earth).`,
      deps: ['geol-2.1', 'pma-8.6'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['age equation', 'geochronology'],
      scope: String.raw`Valid for a closed system (no gain or loss of parent or daughter since closure) with no initial daughter. The last condition is removed by the isochron method (geol-2.3).`,
      viz(v) {
        const SYS = [
          { id: 'U238', label: '$^{238}$U→$^{206}$Pb', lam: LAM.U238, k: 1, c: 'blue', nm: '²³⁸U→²⁰⁶Pb' },
          { id: 'U235', label: '$^{235}$U→$^{207}$Pb', lam: LAM.U235, k: 1, c: 'teal', nm: '²³⁵U→²⁰⁷Pb' },
          { id: 'Rb', label: '$^{87}$Rb→$^{87}$Sr', lam: LAM.Rb87, k: 1, c: 'orange', nm: '⁸⁷Rb→⁸⁷Sr' },
          { id: 'K', label: '$^{40}$K→$^{40}$Ar', lam: LAM.K40, k: LAM.K40 / LAM.K40e, c: 'purple', nm: '⁴⁰K→⁴⁰Ar' },
          { id: 'Sm', label: '$^{147}$Sm→$^{143}$Nd', lam: LAM.Sm147, k: 1, c: 'pink', nm: '¹⁴⁷Sm→¹⁴³Nd' },
        ];
        const sel = v.select('system', SYS.map((q) => ({ value: q.id, label: q.label })), 'U238');
        const sig = v.slider('relative error of ratio (%)', 0.1, 20, 1, { log: true, sig: 2 });
        const age = (q, R) => Math.log(1 + q.k * R) / q.lam;
        const s = v.stage({ x: [1e-4, 10], y: [1e5, 3e10], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'measured $D^*/P$', ylabel: 'age (yr)', height: 360 });
        const cur = () => SYS.find((q) => q.id === sel.value);
        const h = s.handle(0.3, 1e9, { color: 'gold', r: 7, constrain: (x) => { const R = Math.min(Math.max(x, 1.2e-4), 9.5); return [R, age(cur(), R)]; } });
        let st = {};
        v.render(() => {
          const q = cur();
          for (const o of SYS) if (o !== q) s.fn((R) => age(o, R), { color: o.c, width: 1, alpha: 0.45 });
          const R = Math.min(Math.max(h.x, 1.2e-4), 9.5), sg = sig.value / 100;
          const up = [], lo = [];
          for (let i = 0; i <= 80; i++) { const x = Math.pow(10, -4 + 5 * i / 80); up.push([x, age(q, x * (1 + sg))]); lo.push([x, age(q, x * (1 - sg))]); }
          s.poly([...up, ...lo.reverse()], { fill: q.c, fillAlpha: 0.2, stroke: false });
          s.fn((x) => age(q, x), { color: q.c, width: 3 });
          s.hline(4.567e9, { color: 'red', dash: true });
          s.text('Earth 4.57 Gyr', 1.2e-4 * 1.5, 4.567e9 * 1.35, { color: 'red', size: 11 });
          h.set(R, age(q, R));
          const t = age(q, R), dt = (age(q, R * (1 + sg)) - age(q, R * (1 - sg))) / 2;
          st = { q, R, t, dt, sg };
          s.dot(R, t, { color: 'gold', r: 6 });
        });
        v.legend(SYS.map((q) => [q.c, q.nm]));
        v.readout(() => {
          const { q, R, t, dt, sg } = st;
          const Tmin = Math.log(2) / q.lam;
          return String.raw`${q.label}: $D^*/P=${v.sci(R, 3)}$ gives $t=\ln(1+${q.k > 1.001 ? '(\\lambda/\\lambda_e)' : ''}R)/\lambda=$ **${fmtYr(t)}** $\pm$ ${fmtYr(dt)} (${v.fix(100 * dt / t, 1)}%).
Half-life of this parent: ${fmtYr(Tmin)}; ${t > Tmin ? 'the sample is older than one half-life' : 'less than one half-life has passed, so the ratio grows nearly linearly with age'}; a ratio error of ${v.fix(sg * 100, 1)}% costs ${v.fix(100 * dt / t, 1)}% in age.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Method',
      name: 'The isochron method (Rb–Sr)',
      statement: String.raw`Several cogenetic minerals (one rock, one closure time $t$, the same initial ${'$'}^{87}$Sr/${'$'}^{86}$Sr $=(^{87}\mathrm{Sr}/^{86}\mathrm{Sr})_0$) have different Rb/Sr. Dividing the age equation by the stable reference isotope ${'$'}^{86}$Sr gives
$$\frac{^{87}\mathrm{Sr}}{^{86}\mathrm{Sr}}=\Bigl(\frac{^{87}\mathrm{Sr}}{^{86}\mathrm{Sr}}\Bigr)_0+\frac{^{87}\mathrm{Rb}}{^{86}\mathrm{Sr}}\,(e^{\lambda t}-1),$$
a straight line (the *isochron*) in the plane of ${'$'}^{87}$Rb/${'$'}^{86}$Sr against ${'$'}^{87}$Sr/${'$'}^{86}$Sr. Its slope gives $t=\ln(1+\text{slope})/\lambda$ and its intercept the initial ratio, with no assumption about either.`,
      idea: String.raw`Applying the age equation (geol-2.2) to each mineral and normalising to a non-radiogenic isotope of the same element turns the unknown initial daughter into a free intercept. All minerals shared the same initial ratio, so at closure they lay on a horizontal line; each then grew by the same factor $e^{\lambda t}-1$ times its own Rb/Sr, so the line rotates about its intercept. Linear regression (stat-12.2) fits slope and intercept, and a rock whose points do not fall on a line (excess scatter, a mineral off the line) announces that the closed-system assumption failed.`,
      caption: String.raw`Dots are six minerals of one rock with Rb/Sr from tiny (apatite) to huge (biotite); bars are the analytical error. Drag the age slider: the points rotate about the intercept. Raise the scatter, then switch on the re-equilibration of biotite at a later metamorphic event: it drops off the line, the fit's MSWD blows up and the age is wrong until biotite is excluded.`,
      deps: ['geol-2.2', 'stat-12.2'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['isochron', 'Rb–Sr'],
      scope: String.raw`Needs a closed system for Rb and Sr, a common initial ratio (cogenetic minerals), and enough spread in Rb/Sr.`,
      viz(v) {
        const MIN = [['apatite', 0.05, 'se'], ['plagioclase', 1.2, 'n'], ['whole rock', 3.5, 'se'], ['K-feldspar', 7, 'ne'], ['muscovite', 14, 'se'], ['biotite', 30, 'nw']];
        const tsl = v.slider('true age (Ga)', 0.2, 4.5, 1.8, { step: 0.01 });
        const y0s = v.slider('initial $^{87}$Sr/$^{86}$Sr', 0.700, 0.720, 0.705, { step: 0.0005, decimals: 4 });
        const sg = v.slider('analytical error $\\sigma$ (Sr ratio)', 0, 0.05, 0.01, { step: 0.001, decimals: 3 });
        const dist = v.toggle('biotite re-equilibrated in a later event', false);
        const evs = v.slider('event age (Ga)', 0.05, 1.5, 0.5, { step: 0.01 });
        const excl = v.toggle('exclude biotite from fit', false);
        const lam = LAM.Rb87 * 1e9;
        const r = v.rng(11), noise = MIN.map(() => r.normal());
        const s = v.stage({ x: [-1, 34], y: [0.64, 0.9], axes: 'box', gutter: true, xlabel: '$^{87}$Rb/$^{86}$Sr', ylabel: '$^{87}$Sr/$^{86}$Sr', height: 360 });
        let st = {};
        v.render(() => {
          const T = tsl.value, y0 = y0s.value, sd = sg.value;
          const ev = Math.min(evs.value, T * 0.95);
          const xwr = 3.5;
          const pts = MIN.map(([nm, x, lp], i) => {
            let y = y0 + x * Math.expm1(lam * T);
            if (dist.value && nm === 'biotite') {
              const rwr = y0 + xwr * Math.expm1(lam * (T - ev));
              y = rwr + x * Math.expm1(lam * ev);
            }
            return { nm, x, lp, y: y + sd * noise[i] };
          });
          const fitpts = excl.value ? pts.filter((p) => p.nm !== 'biotite') : pts;
          const f = v.M.linreg(fitpts.map((p) => p.x), fitpts.map((p) => p.y));
          const ymax = Math.max(...pts.map((p) => p.y)) + 0.01;
          s.setView([-1, 34], [y0 - 0.07, Math.max(y0 + 0.05, ymax + 0.02)]);
          s.hline(y0, { color: 'faint', dash: true });
          s.line(0, y0, 34, y0 + 34 * Math.expm1(lam * T), { color: 'faint', width: 1 });
          s.line(0, f.intercept, 34, f.intercept + 34 * f.slope, { color: 'green', width: 2.5 });
          s.dot(0, f.intercept, { color: 'green', r: 5, hollow: true });
          for (const p of pts) {
            if (sd > 0) s.segment([p.x, p.y - sd], [p.x, p.y + sd], { color: 'muted', width: 1 });
            const bad = dist.value && p.nm === 'biotite';
            s.dot(p.x, p.y, { color: bad ? 'red' : (excl.value && p.nm === 'biotite' ? 'faint' : 'accent'), r: 5, label: p.nm, labelPos: p.lp });
          }
          const n = fitpts.length;
          let chi = 0;
          if (sd > 0) for (const p of fitpts) chi += ((p.y - (f.intercept + f.slope * p.x)) / sd) ** 2;
          const mswd = sd > 0 ? chi / (n - 2) : NaN;
          const tf = f.slope > 0 ? Math.log(1 + f.slope) / lam : NaN;
          const dt = f.seSlope / (lam * (1 + f.slope));
          st = { f, tf, dt, T, mswd, y0 };
        });
        v.legend([['green', 'fitted isochron'], ['faint', 'true isochron (horizontal at $t=0$)']]);
        v.readout(() => {
          const { f, tf, dt, T, mswd, y0 } = st;
          const flag = isFinite(mswd) ? (mswd > 2.5 ? ' — **too much scatter: not a valid isochron**' : ' — consistent with the analytical error') : '';
          return String.raw`Fit: slope $=${v.fix(f.slope, 5)}$ ⇒ age **${v.fix(tf, 3)} Ga** $\pm\,${v.fix(dt, 3)}$ (true ${v.fix(T, 2)} Ga); intercept $=${v.fix(f.intercept, 4)}$ (true ${v.fix(y0, 4)}).
$r^2=${v.fix(f.r2, 5)}$, MSWD $=$ ${isFinite(mswd) ? v.fix(mswd, 1) : 'n/a (no error set)'}${flag}.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Decay chains and secular equilibrium',
      statement: String.raw`In a chain $N_1\to N_2\to\cdots\to N_k\to$ (stable) with decay constants $\lambda_1,\dots,\lambda_k$, $dN_i/dt=\lambda_{i-1}N_{i-1}-\lambda_iN_i$. If the parent is much longer-lived than every member of the chain ($\lambda_1\ll\lambda_i$) and the system stays closed for several half-lives of the longest-lived daughter, then the activities become equal, $\lambda_1N_1=\lambda_2N_2=\cdots=\lambda_kN_k$ (**secular equilibrium**). For a single daughter with $\lambda_2>\lambda_1$ the ratio of activities tends to $\lambda_2/(\lambda_2-\lambda_1)>1$ (*transient* equilibrium); with $\lambda_2<\lambda_1$ no equilibrium is reached.`,
      idea: String.raw`The daughter gains atoms at the rate $\lambda_1N_1$ and loses them at $\lambda_2N_2$. Its number therefore relaxes towards $N_2=\lambda_1N_1/\lambda_2$ with the time constant $1/\lambda_2$ (first-order kinetics, kin-4.1), while the parent hardly changes if $\lambda_1\ll\lambda_2$. Equal activities propagate down the chain, each member waiting for the one above it, so the full chain is in equilibrium after a few half-lives of its longest-lived intermediate; ${'$'}^{234}$U (245 kyr) sets the pace for the uranium series. The daughter's equation is a forced linear ODE (ode 1.4): multiplying by $e^{\lambda_2t}$ and integrating the parent source gives its transient, as well as the long-time activity ratio. The equal-decay-constant case uses the same integral and yields a factor $t$, rather than division by zero.`,
      caption: String.raw`Left: the ${'$'}^{238}$U series, activities relative to ${'$'}^{238}$U against time on a log axis. Choose how the chain was set up (freshly purified uranium, a coral that takes up U but not Th, radium leached, radon lost) and drag the vertical marker. Right: two-member chain; slide the half-life ratio and see the daughter's activity ratio approach 1 (secular) or $\lambda_2/(\lambda_2-\lambda_1)$ (transient), or never settle.`,
      deps: ['geol-2.1', 'kin-4.1', 'ode-1.4'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['decay chain', 'equilibrium'],
      scope: String.raw`Needs a closed system. The short-lived members between the drawn nuclides (²³⁴Th, ²³⁴ᵐPa, ²¹⁸Po, ²¹⁴Pb, ²¹⁴Bi, ²¹⁴Po, ²¹⁰Bi) are lumped into their drawn parents because their half-lives are minutes to weeks; the half-lives are from memory.`,
      viz(v) {
        const CH = [['²³⁸U', 4.468e9], ['²³⁴U', 2.455e5], ['²³⁰Th', 7.538e4], ['²²⁶Ra', 1600], ['²²²Rn', 3.8235 / 365.25], ['²¹⁰Pb', 22.2], ['²¹⁰Po', 138.376 / 365.25]];
        const lam = CH.map(([, T]) => LN2 / T), K = CH.length;
        const cols = ['ink', 'blue', 'teal', 'orange', 'purple', 'pink', 'gold'];
        const INIT = { fresh: [1, 0, 0, 0, 0, 0, 0], coral: [1, 1, 0, 0, 0, 0, 0], ra: [1, 1, 1, 0, 0, 0, 0], rn: [1, 1, 1, 1, 0, 1, 1] };
        const sc = v.select('start', [{ value: 'fresh', label: 'pure $^{238}$U' }, { value: 'coral', label: 'U, no Th' }, { value: 'ra', label: 'Ra leached' }, { value: 'rn', label: 'Rn lost' }], 'fresh');
        const ratioSl = v.slider('$T_{1/2}$ parent / daughter', 0.1, 1e4, 100, { log: true, sig: 2 });
        const Amat = Array.from({ length: K }, (_, i) => Array.from({ length: K }, (_, j) => (i === j ? -lam[i] : (j === i - 1 ? lam[j] : 0))));
        const cache = new Map();
        const acts = (t) => {
          const key = sc.value + '|' + t.toPrecision(4);
          if (cache.has(key)) return cache.get(key);
          const N0 = INIT[sc.value].map((a, i) => a / lam[i]);
          const E = v.M.expm(Amat.map((row) => row.map((a) => a * t)));
          const N = E.map((row) => row.reduce((s, e, j) => s + e * N0[j], 0));
          const A = N.map((n, i) => Math.max(0, n * lam[i]));
          cache.set(key, A);
          return A;
        };
        const s = v.stage({ x: [0.01, 1e7], y: [0, 1.25], xlog: true, axes: 'box', gutter: true, xlabel: 'time (yr)', ylabel: 'activity / activity of $^{238}$U', height: 340, weight: 1.4 });
        const s2 = v.stage({ x: [0, 8], y: [0, 3], axes: 'box', gutter: true, xlabel: 'time (daughter half-lives)', ylabel: '$A_2/A_1$', height: 340, weight: 1 });
        const h = s.handle(3e5, 0.0, { color: 'gold', constrain: 'x', label: 't' });
        const tvals = Array.from({ length: 101 }, (_, i) => Math.pow(10, -2 + 9 * i / 100));
        let info = {};
        v.render(() => {
          const curves = tvals.map(acts);
          for (let k = K - 1; k >= 0; k--) s.path(tvals.map((t, i) => [t, curves[i][k]]), { color: cols[k], width: k === 0 ? 3 : 2 });
          s.hline(1, { color: 'faint', dash: true });
          const t = Math.min(Math.max(h.x, 0.01), 1e7);
          s.vline(t, { color: 'gold', width: 1.5 });
          const A = acts(t);
          A.forEach((a, k) => s.dot(t, a, { color: cols[k], r: 4 }));
          // two-member chain
          const q = ratioSl.value, l1 = LN2 / q, l2 = LN2;
          const f = (x) => (Math.abs(l2 - l1) < 1e-9 ? l2 * x : l1 * (Math.exp(-l1 * x) - Math.exp(-l2 * x)) / (l2 - l1) * l2 / (l1 * Math.exp(-l1 * x)));
          s2.fn(f, { color: 'purple', width: 3, domain: [0.001, 8] });
          if (q > 1) s2.hline(l2 / (l2 - l1), { color: 'green', dash: true });
          s2.hline(1, { color: 'faint', dash: true });
          info = { A, t, q, lim: q > 1 ? l2 / (l2 - l1) : Infinity };
        });
        v.legend(CH.map(([n], k) => [cols[k], n]));
        v.readout(() => {
          const { A, t, q, lim } = info;
          return String.raw`At $t=$ **${fmtYr(t)}**, activities relative to ${'$'}^{238}$U: ${A.map((a, k) => `${CH[k][0]} ${v.fix(a, 2)}`).join(', ')}.
Two members with $T_1/T_2=${v.fmt(q, 3)}$: ${q > 30 ? `$A_2/A_1\\to1$ after about 5–7 daughter half-lives: **secular equilibrium**` : (q > 1 ? `$A_2/A_1\\to ${v.fix(lim, 2)}$ (transient equilibrium)` : 'the daughter outlives the parent: its activity ratio keeps growing, **no equilibrium**')}.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'U–Pb concordia',
      statement: String.raw`Uranium has two radioactive isotopes decaying to different lead isotopes, giving two independent clocks in a closed mineral such as zircon: $^{206}\mathrm{Pb}^*/^{238}\mathrm{U}=e^{\lambda_{238}t}-1$ and $^{207}\mathrm{Pb}^*/^{235}\mathrm{U}=e^{\lambda_{235}t}-1$. The curve traced by this pair of values as $t$ varies is the **concordia**; a closed system lies on it at its age. A sample that lost lead $t_2$ ago, in a single episode, falls on a chord of the concordia, the *discordia*, whose upper intercept is the crystallisation age $t_1$ and whose lower intercept is the age $t_2$ of the disturbance.`,
      idea: String.raw`Two age equations (geol-2.2) agree only if the system stayed closed, so the concordia is a built-in check. Lead loss removes the same fraction $f$ of both Pb isotopes accumulated up to the event, so a zircon moves from the concordia point of $t_1$ towards that of $t_2$ in a straight line, in proportion to $f$; zircons with different $f$ fill the chord, and its two intercepts with the curve are the two ages. Continuous loss by slow diffusion gives a convex curve instead, so a chord fitted to it does not recover true ages.`,
      caption: String.raw`Axes are $^{207}$Pb*/$^{235}$U and $^{206}$Pb*/$^{238}$U; dots on the curve mark ages in Ga. Six zircons share a crystallisation age but lost different fractions of lead. Slide the ages and the loss; the fitted chord's intercepts are read out. Switch the loss to continuous diffusion and watch the recovered ages drift from the truth.`,
      deps: ['geol-2.2'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['U–Pb', 'zircon', 'concordia'],
      scope: String.raw`Episodic loss of Pb (and no gain of U or Pb, no common lead) gives a straight chord; other histories give curves.`,
      viz(v) {
        const l8 = LAM.U238 * 1e9, l5 = LAM.U235 * 1e9;
        const T1 = v.slider('crystallisation age $t_1$ (Ga)', 0.3, 4.0, 2.5, { step: 0.01 });
        const T2 = v.slider('disturbance age $t_2$ (Ga)', 0, 3, 0.6, { step: 0.01 });
        const F = v.slider('maximum Pb loss', 0, 0.9, 0.6, { step: 0.01 });
        const mode = v.select('loss', [{ value: 'ep', label: 'episodic' }, { value: 'co', label: 'continuous' }], 'ep');
        const U = [0.05, 0.25, 0.4, 0.6, 0.8, 1.0];
        const conc = (t) => [Math.expm1(l5 * t), Math.expm1(l8 * t)];
        const s = v.stage({ x: [0, 20], y: [0, 0.7], axes: 'box', gutter: true, xlabel: '$^{207}$Pb*/$^{235}$U', ylabel: '$^{206}$Pb*/$^{238}$U', height: 380 });
        let st = {};
        v.render(() => {
          const t1 = T1.value, t2 = Math.min(T2.value, t1 * 0.98);
          const xs = conc(t1)[0], ys = conc(t1)[1];
          s.setView([0, Math.max(xs * 1.12, 1.5)], [0, Math.max(ys * 1.12, 0.1)]);
          s.curve((t) => conc(t), 0.0001, Math.min(4.5, t1 * 1.3), { n: 200, color: 'ink', width: 2 });
          const step = t1 > 2 ? 0.5 : 0.25;
          for (let a = step; a <= t1 * 1.25; a += step) { const c = conc(a); s.dot(c[0], c[1], { r: 3, color: 'ink' }); s.text(a.toFixed(2).replace(/\.?0+$/, ''), c[0], c[1], { size: 10, color: 'muted', dx: 5, dy: 10 }); }
          const pts = U.map((u) => {
            const f = F.value * u;
            if (mode.value === 'ep') {
              return [0, 1].map((m) => { const l = m ? l8 : l5; return (1 - f) * (Math.exp(l * t1) - Math.exp(l * t2)) + Math.expm1(l * t2); })  ;
            }
            const k = f * 0.45;
            return [l5, l8].map((l) => (l / (l - k)) * (Math.exp((l - k) * t1) - 1));
          });
          const P = pts.map(([x, y]) => [x, y]);
          // P: [x, y]; for 'ep' branch map reversed to give [x(207), y(206)]
          const fit = v.M.linreg(P.map((p) => p[0]), P.map((p) => p[1]));
          const spread = Math.max(...P.map((p) => p[0])) - Math.min(...P.map((p) => p[0]));
          let roots = [];
          if (spread > 1e-3 && F.value > 0) {
            let prev = null;
            for (let t = 0; t <= 4.6; t += 0.002) {
              const c = conc(t), g = c[1] - (fit.intercept + fit.slope * c[0]);
              if (prev && prev.g * g < 0) roots.push(prev.t + (t - prev.t) * prev.g / (prev.g - g));
              prev = { t, g };
            }
          }
          const xr = s.bounds ? null : null;
          if (isFinite(fit.slope) && spread > 1e-3) { s.line(0, fit.intercept, 1e3, fit.intercept + fit.slope * 1e3, { color: 'green', width: 2 }); }
          s.dot(xs, ys, { color: 'blue', r: 6, hollow: true });
          P.forEach(([x, y], i) => s.dot(x, y, { color: 'orange', r: 5 }));
          roots.forEach((t) => { const c = conc(t); s.dot(c[0], c[1], { color: 'green', r: 7, hollow: true }); });
          st = { roots, t1, t2, spread };
        });
        v.legend([['ink', 'concordia'], ['orange', 'zircons'], ['green', 'discordia and intercepts']]);
        v.readout(() => {
          const { roots, t1, t2, spread } = st;
          const rt = roots.map((t) => v.fix(t, 3) + ' Ga').join(' and ');
          return String.raw`True: crystallisation $t_1=${v.fix(t1, 2)}$ Ga, disturbance $t_2=${mode.value === 'ep' ? v.fix(t2, 2) : '\\text{continuous}'}$${mode.value === 'ep' ? ' Ga' : ''}.
${spread < 1e-3 || F.value === 0 ? 'No lead loss: all zircons sit together on the concordia at $t_1$.' : `Chord meets the concordia at **${rt || 'no point'}**${mode.value === 'ep' ? ' (upper = crystallisation, lower = disturbance)' : ' — not the true ages: the points follow a curve, not a chord'}.`}`;
        });
      },
    },
    // ───────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Method',
      name: 'Radiocarbon dating and calibration',
      statement: String.raw`Cosmic rays make ${'$'}^{14}$C in the atmosphere; living things hold it at the atmospheric ratio, and after death it decays with $T_{1/2}=5730$ yr. The measured fraction $F$ of the modern ratio gives a *radiocarbon age* by convention $t_{14}=-8033\ln F$ (the Libby mean life, from the old half-life 5568 yr). Because atmospheric ${'$'}^{14}$C has varied, radiocarbon age is not calendar age: a **calibration curve** (tree rings, corals, varves, cave deposits) maps calendar age $c$ to the radiocarbon age $r(c)$ that a sample of that age would show, and a measurement $r\pm\sigma$ becomes a probability distribution $p(c)\propto\exp[-(r(c)-r)^2/2\sigma^2]$, often several separate calendar ranges.`,
      idea: String.raw`The age equation (geol-2.2) with $\lambda_{14}=\ln2/5730$ yr$^{-1}$ gives a physical age, but it assumes a constant starting activity. Production changes with the geomagnetic field and solar activity, and the exchange between ocean and atmosphere changes too, so the starting activity wandered by per cent; the same radiocarbon age then fits several calendar ages wherever the curve is flat (plateaus) or turns. The curve is fixed by independent calendar clocks that also carry ${'$'}^{14}$C, such as tree rings and U–Th-dated corals. Usable range is about 50 kyr, when only about 0.2% of the modern ${'$'}^{14}$C remains.`,
      caption: String.raw`The curve is **schematic** (shaped after the real calibration curve, not its data). Drag the handle on the vertical axis to set the measured radiocarbon age and change the error; the lower panel shows the resulting calendar-age probability with its 95% range(s) shaded. Try $\approx2\,450$ yr: the plateau smears the answer over centuries.`,
      deps: ['geol-2.2'],
      refs: ['Press–Siever'],
      tags: ['radiocarbon', 'calibration'],
      scope: String.raw`Organic material up to roughly 50 kyr old, with no contamination by older carbon; reservoir effects (marine samples, hard-water lakes) need a separate offset.`,
      viz(v) {
        const ANC = [[0, 0], [500, 460], [1000, 1110], [1500, 1600], [2000, 2050], [2350, 2400], [2500, 2440], [2750, 2480], [2850, 2700], [3000, 2850], [4000, 3650], [5000, 4400], [6000, 5250], [7000, 6150], [8000, 7150], [9000, 8000], [10000, 8900], [11000, 9700], [11400, 9950], [12000, 10300], [13000, 11100], [14000, 12000], [15000, 12700], [17000, 14200], [20000, 16900], [25000, 21000], [30000, 26000], [35000, 30700], [40000, 35500], [45000, 40300], [50000, 44800]];
        const r = (c) => {
          let i = 0; while (i < ANC.length - 2 && ANC[i + 1][0] < c) i++;
          const [c0, r0] = ANC[i], [c1, r1] = ANC[i + 1], u = (c - c0) / (c1 - c0);
          return r0 + (r1 - r0) * u + 30 * Math.sin((TAUC * c) / 208) * Math.min(1, c / 800);
        };
        const view = v.select('window', [{ value: 12000, label: '0–12 kyr' }, { value: 25000, label: '0–25 kyr' }, { value: 50000, label: '0–50 kyr' }], 12000);
        const sg = v.slider('measurement error $\\sigma$ (yr)', 10, 400, 40, { log: true, sig: 2 });
        const s = v.stage({ x: [0, 12000], y: [0, 12000], axes: 'box', gutter: true, xlabel: 'calendar age (cal BP)', ylabel: '${}^{14}$C age (BP)', height: 340, weight: 1 });
        const p = v.stage({ x: [0, 12000], y: [0, 1.1], axes: 'box', gutter: true, xlabel: 'calendar age (cal BP)', ylabel: 'probability density (relative)', height: 340, weight: 1 });
        const hr = s.handle(600, 2450, { color: 'gold', r: 7, constrain: 'y', label: 'measured' });
        let st = {}, lastView = 0;
        v.render(() => {
          const W = view.value;
          if (W !== lastView) { lastView = W; s.setView([0, W * 1.04], [0, W * 1.04]); hr.set(W * 0.05, Math.min(hr.y, W * 0.95)); }
          hr.set(W * 0.05, Math.max(30, Math.min(hr.y, r(W) * 0.98)));
          const rm = hr.y, sd = sg.value;
          s.line(0, 0, W, W, { color: 'faint', dash: true });
          s.hband(rm - sd, rm + sd, { color: 'green', alpha: 0.18 });
          s.hline(rm, { color: 'green', width: 1 });
          s.fn(r, { color: 'accent', width: 2.5, n: 1200, domain: [0, W] });
          // density on a grid
          const n = 1500, xs = [], ds = [];
          let tot = 0;
          for (let i = 0; i <= n; i++) { const c = (W * i) / n; const d = Math.exp(-0.5 * ((r(c) - rm) / sd) ** 2); xs.push(c); ds.push(d); tot += d; }
          const order = ds.map((d, i) => [d, i]).sort((a, b) => b[0] - a[0]);
          let acc = 0; const inn = new Array(n + 1).fill(false);
          for (const [d, i] of order) { if (acc >= 0.95 * tot) break; acc += d; inn[i] = true; }
          const mx = Math.max(...ds) || 1;
          const ranges = []; let a0 = null;
          for (let i = 0; i <= n; i++) { if (inn[i] && a0 === null) a0 = xs[i]; if ((!inn[i] || i === n) && a0 !== null) { ranges.push([a0, xs[i - (inn[i] ? 0 : 1)]]); a0 = null; } }
          let i0 = 0, i1 = n; while (i0 < n && ds[i0] / mx < 0.01) i0++; while (i1 > 0 && ds[i1] / mx < 0.01) i1--;
          let lo = xs[i0], hi = xs[i1]; const wd = Math.max(hi - lo, 300), mid = (lo + hi) / 2;
          p.setView([Math.max(0, mid - wd * 0.8), mid + wd * 0.8], [0, 1.1]);
          p.path(xs.map((c, i) => [c, ds[i] / mx]), { color: 'ink', width: 1 });
          ranges.forEach(([a, b]) => { p.vband(a, b, { color: 'green', alpha: 0.2 }); });
          const poly = []; xs.forEach((c, i) => { if (inn[i]) poly.push([c, ds[i] / mx]); });
          for (let i = 0; i < n; i++) if (inn[i] && inn[i + 1]) p.poly([[xs[i], 0], [xs[i], ds[i] / mx], [xs[i + 1], ds[i + 1] / mx], [xs[i + 1], 0]], { fill: 'green', fillAlpha: 0.45, stroke: false });
          st = { rm, sd, ranges };
        });
        v.legend([['accent', 'calibration curve (schematic)'], ['green', 'measurement and 95% calendar range']]);
        v.readout(() => {
          const { rm, sd, ranges } = st;
          const F = Math.exp(-rm / 8033);
          const phys = -Math.log(F) * (5730 / LN2);
          return String.raw`Measured ${'$'}^{14}$C age $${v.fix(rm, 0)}\pm${v.fix(sd, 0)}$ BP ⇒ $F=${v.fix(F, 4)}$ of modern; the physical age from $T_{1/2}=5730$ yr would be ${v.fix(phys, 0)} yr.
Calibrated 95% range${ranges.length > 1 ? 's' : ''}: **${ranges.map(([a, b]) => `${v.fix(a, 0)}–${v.fix(b, 0)}`).join('; ')} cal BP**${ranges.length > 1 ? ` (${ranges.length} separate ranges)` : ''}, width ${v.fix(ranges.reduce((s, [a, b]) => s + b - a, 0), 0)} yr against $\pm$ ${v.fix(2 * sd, 0)} yr raw.`;
        });
      },
    },
  ],
};
