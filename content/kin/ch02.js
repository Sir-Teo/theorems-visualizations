// Chemical Kinetics — Chapter 2: Temperature dependence and collision theory (items 2.1–2.6)
import { R, clamp, saddle, mep, leps, vRel, vXY, toXY, fromXY, hessXY, eig2, launch, trajectory, M_EFF, DiscGas } from './ch02.shared.js';

export default {
  collection: 'kin',
  chapter: 2,
  title: 'Temperature dependence and collision theory',
  summary: String.raw`Most rate constants grow exponentially with temperature, as Arrhenius found; the activation energy is the slope of $\ln k$ against $1/T$. Collision theory explains why: only the fraction of collisions with enough energy along the line of centres react, and a steric factor accounts for orientation. Potential energy surfaces make the barrier concrete, and Polanyi's rules say which form of energy best gets a reaction over it.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Law', name: 'Arrhenius equation',
      statement: String.raw`For many elementary reactions, and for the overall rate constants of many complex ones, the rate constant depends on absolute temperature as
$$k(T) \;=\; A\,e^{-E_a/RT},\qquad\text{equivalently}\qquad \ln k = \ln A - \frac{E_a}{R}\cdot\frac1T .$$
The **activation energy** $E_a$ (J/mol) and the **pre-exponential factor** $A$ (same units as $k$) are constants over a limited temperature range, so a plot of $\ln k$ against $1/T$ is a straight line of slope $-E_a/R$. Equivalently, $E_a = RT^2\,\dfrac{d\ln k}{dT}$.`,
      idea: String.raw`Arrhenius read the van't Hoff equation for the temperature dependence of an equilibrium constant, $d\ln K/dT=\Delta U/RT^2$, as a statement about each direction of a reversible reaction: $k$ responds to $T$ through an energy $E_a$ that plays the role of $\Delta U$. Integrating $d\ln k/dT=E_a/RT^2$ with $E_a$ constant gives the exponential law. Statistical mechanics later supplied the reading used here: $e^{-E_a/RT}$ is the Boltzmann fraction of molecules (or collisions) that have at least the energy $E_a$ (see the collision-theory items below).`,
      caption: String.raw`Synthetic rate data (7 temperatures, 6% scatter, seed fixed) for a reaction with $E_a=50$ kJ/mol. Drag the two orange handles to lay a straight line through the points by eye and read the activation energy from its slope; switch on the least-squares line to compare. The right panel shows the same rate constants on a linear scale: the exponential climb that the straight line encodes. Slide $T$ to see how much a 10 K warming multiplies the rate.`,
      deps: ['kin-1.2', 'pchem-9.1'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['activation energy', 'temperature'],
      credit: 'Arrhenius, 1889 (building on van’t Hoff, 1884)',
      scope: String.raw`Holds over a limited temperature range for a single rate-determining step; over wide ranges $\ln k$ against $1/T$ curves (see 2.11), and for composite mechanisms the slope is an apparent $E_a$ that may even be negative (2.10).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrhenius_equation' },
      viz(v) {
        const Ets = 50, lnA = Math.log(1e13), rr = v.rng(11);
        const Ts = [280, 300, 320, 340, 360, 380, 400];
        const pts = Ts.map((T) => ({ T, x: 1000 / T, y: lnA - Ets / (R * T) + 0.06 * rr.normal() }));
        const fit = v.M.linreg(pts.map((p) => p.x), pts.map((p) => p.y));
        const s = v.stage({ x: [2.3, 3.8], y: [7, 16.5], axes: 'box', gutter: true, height: 340, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln k', title: 'Arrhenius plot', weight: 1.15 });
        const t = v.stage({ x: [260, 420], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'T (K)', ylabel: 'k / k(300 K)', title: 'the same data, linear scale', weight: 1 });
        const h1 = s.handle(2.6, 13.4, { color: 'orange', label: 'a' }), h2 = s.handle(3.5, 10.6, { color: 'orange', label: 'b', labelPos: 'ne' });
        const show = v.toggle('show least-squares line', false);
        const Ts_ = v.slider('$T$ (K)', 260, 400, 310, { step: 1 });
        const lineHand = () => { const m = (h2.y - h1.y) / (h2.x - h1.x); return { m, c: h1.y - m * h1.x }; };
        let info = {};
        v.render(() => {
          const L = lineHand(), Eh = -L.m * R * 1000;
          s.line(2.3, L.m * 2.3 + L.c, 3.8, L.m * 3.8 + L.c, { color: 'orange', width: 2 });
          if (show.value) s.line(2.3, fit.slope * 2.3 + fit.intercept, 3.8, fit.slope * 3.8 + fit.intercept, { color: 'green', width: 2.2, dash: [7, 4] });
          pts.forEach((p) => s.dot(p.x, p.y, { r: 5, color: 'accent' }));
          const T0 = Ts_.value; s.vline(1000 / T0, { color: 'gold', width: 1.2, dash: [3, 4] });
          // right panel: k relative to k(300) for the hand line and the data
          const k = (T, m, c) => Math.exp(m * 1000 / T + c - (m * 1000 / 300 + c));
          const Efit = -fit.slope * R * 1000, mH = L.m, cH = L.c;
          t.setView([260, 420], [0, Math.min(1500, k(420, fit.slope, fit.intercept) * 1.05)]);
          t.fn((T) => k(T, fit.slope, fit.intercept), { color: show.value ? 'green' : 'faint', width: 2, domain: [260, 420] });
          t.fn((T) => k(T, mH, cH), { color: 'orange', width: 2, domain: [260, 420] });
          pts.forEach((p) => t.dot(p.T, Math.exp(p.y - (fit.slope * 1000 / 300 + fit.intercept)), { r: 4, color: 'accent' }));
          const f10 = Math.exp(Efit / R / 1000 * (1 / T0 - 1 / (T0 + 10)) * 1000);
          t.dot(T0, k(T0, fit.slope, fit.intercept), { r: 5, color: 'gold' }); t.dot(T0 + 10, k(T0 + 10, fit.slope, fit.intercept), { r: 5, color: 'gold' });
          info = { Eh, Efit, f10, r2: fit.r2, T0 };
        });
        v.legend([['accent', 'data', { dot: true }], ['orange', 'your line'], ['green', 'least squares', { dash: true }], ['gold', '$T$ and $T+10$ K', { dot: true }]]);
        v.readout(() => `your line: $E_a = -R\\cdot\\text{slope} = ${v.fix(info.Eh, 1)}$ kJ/mol` + (show.value ? ` · least squares: $E_a = ${v.fix(info.Efit, 1)}$ kJ/mol, $r^2=${v.fix(info.r2, 4)}$ (true value 50)` : ' (switch on the least-squares line to compare)') + `\nat $T=${info.T0}$ K: warming by 10 K multiplies $k$ by $\\exp\\!\\big[\\tfrac{E_a}{R}\\big(\\tfrac1T-\\tfrac1{T+10}\\big)\\big]=${v.fix(info.f10, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Paradox', name: 'The “doubling every 10 °C” rule of thumb',
      statement: String.raw`A common rule says that a reaction's rate roughly doubles for every 10 °C rise. If $k=Ae^{-E_a/RT}$, the factor gained per 10 K is
$$Q_{10}(T,E_a)\;=\;\frac{k(T+10)}{k(T)}\;=\;\exp\!\Big[\frac{E_a}{R}\Big(\frac1T-\frac1{T+10}\Big)\Big]\;\approx\;\exp\!\Big[\frac{10\,E_a}{RT^2}\Big].$$
$Q_{10}=2$ needs $E_a\approx RT(T+10)\ln 2/10$, about 53 kJ/mol near 300 K. It is not a law: $Q_{10}$ grows with $E_a$ and falls steeply with $T$, so the rule fails for high barriers (enzyme denaturation, $Q_{10}$ of order 100 or more) and for hot systems (flames, where it is close to 1).`,
      idea: String.raw`The Arrhenius law makes $\ln Q_{10}$ proportional to $E_a/T^2$. Fix $E_a$ and the factor drops as $T^{-2}$; fix $T$ and it rises exponentially with $E_a$. The rule of thumb is just the coincidence that typical activation energies of solution reactions, 40–60 kJ/mol, sit near the 53 kJ/mol that gives 2 at room temperature. Taylor's theorem pma 5.15 applied to $f(T)=1/T$ at positive T gives $1/(T+\Delta T)=1/T-\Delta T/T^2+O(\Delta T^2/T^3)$ when $|\Delta T|/T$ is small. With $\Delta T=10$ this justifies the approximate exponent; the exact reciprocal-temperature difference should be retained for larger relative jumps.`,
      caption: String.raw`Left: $Q_{10}$ against $E_a$ at your temperature (blue) and at three reference temperatures (grey); the shaded band marks factors between 2 and 3. Right: $Q_{10}$ against $T$ for your $E_a$. Try the presets, then slide $E_a$ and $T$ to find where the rule holds.`,
      deps: ['kin-2.1', 'pma-5.15'],
      refs: ['Houston'],
      tags: ['rule of thumb', 'temperature'],
      viz(v) {
        const q10 = (Ea, T) => Math.exp(Ea / R * (1 / T - 1 / (T + 10)));
        const eaS = v.slider('$E_a$ (kJ/mol)', 5, 300, 52, { step: 1 });
        const tS = v.slider('$T$ (K)', 250, 2500, 300, { step: 5, log: true, sig: 3 });
        const preset = v.select('preset', [{ value: 'c', label: 'custom' }, { value: 'r', label: 'rule of thumb' }, { value: 'e', label: 'enzyme denaturation' }, { value: 'f', label: 'flame chemistry' }, { value: 'l', label: 'radical, low barrier' }], 'c', {
          onChange(val) { const P = { r: [52, 300], e: [250, 310], f: [150, 2000], l: [10, 300] }[val]; if (P) { eaS.set(P[0]); tS.set(P[1]); } },
        });
        const A = v.stage({ x: [0, 300], y: [1, 200], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'Eₐ (kJ/mol)', ylabel: 'Q₁₀ = k(T+10)/k(T)', title: '$Q_{10}$ against activation energy' });
        const B = v.stage({ x: [250, 2500], y: [1, 200], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'Q₁₀', title: '$Q_{10}$ against temperature, at your $E_a$' });
        const hE = A.handle(52, 2, { color: 'gold', constrain: (x) => [clamp(x, 5, 300), 1] }); hE.visible = false;
        let info = {};
        v.render(() => {
          const Ea = eaS.value, T = tS.value;
          A.hband(2, 3, { color: 'green', alpha: 0.12 }); B.hband(2, 3, { color: 'green', alpha: 0.12 });
          for (const T0 of [300, 600, 2000]) A.fn((e) => q10(e, T0), { color: 'faint', width: 1.4, domain: [5, 300] });
          [[300, 40], [600, 25], [2000, 8]].forEach(([T0, x]) => A.text(`${T0} K`, 292, q10(300, T0) > 1 ? q10(292, T0) * 1.12 : 1.1, { size: 10.5, color: 'muted', align: 'right' }));
          A.fn((e) => q10(e, T), { color: 'accent', width: 2.6, domain: [5, 300] });
          A.dot(Ea, q10(Ea, T), { r: 6, color: 'gold' });
          B.fn((t) => q10(Ea, t), { color: 'accent', width: 2.6, domain: [250, 2500] });
          B.dot(T, q10(Ea, T), { r: 6, color: 'gold' });
          info = { q: q10(Ea, T), Ea, T, E2: R * T * (T + 10) * Math.log(2) / 10 };
        });
        v.legend([['accent', '$Q_{10}$ at the chosen $T$'], ['faint', '$T=300,600,2000$ K'], ['green', 'the “2 to 3” band', { area: true }], ['gold', 'your point', { dot: true }]]);
        v.readout(() => `$E_a=${v.fix(info.Ea, 0)}$ kJ/mol at $T=${v.fix(info.T, 0)}$ K: $Q_{10}=${v.fix(info.q, info.q < 10 ? 2 : 0)}$ — ${info.q >= 1.8 && info.q <= 3 ? 'the rule of thumb happens to hold' : info.q > 3 ? 'much faster than doubling' : 'much slower than doubling'} · the barrier giving exactly 2 here is $E_a=RT(T+10)\\ln2/10=${v.fix(info.E2, 0)}$ kJ/mol`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Model', name: 'Hard-sphere collision theory',
      statement: String.raw`Treat reactant molecules as hard spheres of diameters $d_A,d_B$ (so the centre–centre distance at contact is $d=\tfrac12(d_A+d_B)$) and suppose a collision reacts if and only if the relative kinetic energy **along the line of centres** exceeds a threshold $E_0$. Then the bimolecular rate constant is
$$k(T)\;=\;\pi d^2\sqrt{\frac{8k_BT}{\pi\mu}}\;N_A\,e^{-E_0/k_BT},\qquad \mu=\frac{m_Am_B}{m_A+m_B}.$$
The prefactor is the collision frequency per unit concentration, $\sigma\langle v_{\rm rel}\rangle$ with $\sigma=\pi d^2$; the exponential is the fraction of collisions that are energetic enough. The Arrhenius activation energy is $E_a=E_0+\tfrac12RT$.`,
      idea: String.raw`In a Maxwell gas, the relative speed has the distribution of a single particle of mass $\mu$ (kinetic theory, pchem-1.7). The collision rate weights each relative velocity by $|u_n|$, the component along the line of centres, and the weight makes the distribution of $E_n=\tfrac12\mu u_n^2$ exactly exponential, so $P(E_n\ge E_0)=e^{-E_0/k_BT}$ in any number of dimensions. The model's flaw is that it ignores orientation and internal energy, which is why it overestimates $k$ for complex molecules (2.4).`,
      caption: String.raw`A **two-dimensional** gas of hard discs (reduced units, 110 discs, elastic collisions, reflecting walls), the closest thing to the model that fits on a screen. Collisions whose normal energy exceeds $E_0$ flash orange. Right: every collision's normal energy is recorded; $\ln(\text{rate of collisions with }E_n\ge E)$ against $E/k_BT$ is a straight line of slope $-1$ (dashed theory). In 2D the collision width is $2d$ and the theory carries the Enskog pair-contact factor $g$ for the packing fraction.`,
      deps: ['pchem-1.7', 'pchem-1.9', 'kin-2.1'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['collision theory', 'kinetic theory'],
      credit: 'Trautz, 1916 and Lewis, 1918 (independently)',
      scope: String.raw`Dilute gas, spherical structureless molecules, reactivity decided by energy alone; the simulation is a 2D analogue of the 3D formula.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Collision_theory' },
      viz(v) {
        const g = new DiscGas(110, 0.025, 1, 21, v);
        for (let i = 0; i < 3000; i++) g.step(0.0015);
        g.resetCounts(); g.recent = [];
        for (let i = 0; i < 18000; i++) { g.step(0.0015); g.recent.length = 0; }
        const kT = v.slider('$k_BT$ (reduced)', 0.4, 2.5, 1, { step: 0.05, onChange: (x) => g.setKT(x) });
        const E0 = v.slider('threshold $E_0/k_BT$', 0, 5, 2, { step: 0.1 });
        v.button('Reset counts', () => g.resetCounts());
        const box = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 330, title: 'hard discs; energetic collisions flash', weight: 0.9, minWidth: 250 });
        const pl = v.stage({ x: [0, 6], y: [-1, 7], axes: 'box', gutter: true, height: 330, xlabel: 'E / kT', ylabel: 'ln (collisions with Eₙ ≥ E per time)', title: 'the Boltzmann factor, counted', weight: 1.1 });
        let flash = [], info = {};
        v.animate((t) => {
          for (let i = 0; i < 8; i++) g.step(0.0015);
          const e0 = E0.value;
          for (const c of g.recent) if (c.E >= e0) flash.push({ ...c, age: 0 });
          g.recent.length = 0; flash = flash.filter((f) => ++f.age < 14);
          box.rect(0, 0, 1, 1, { color: 'faint', stroke: true, fill: false });
          for (let i = 0; i < g.N; i++) box.circle(g.x[i], g.y[i], g.d / 2, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 });
          for (const f of flash) box.circle(f.x, f.y, 0.012 + 0.002 * f.age, { color: 'orange', width: 2, alpha: 1 - f.age / 14 });
          const th = g.theory(0);
          const Eg = [], ys = [];
          for (let e = 0; e <= 6.001; e += 0.25) { const c = g.count(e); if (c >= 1) Eg.push([e, Math.log(c / g.time)]); }
          pl.line(0, Math.log(th.Z0 * th.g), 6, Math.log(th.Z0 * th.g) - 6, { color: 'green', width: 2, dash: [7, 4] });
          pl.dots(Eg, { r: 3.5, color: 'accent' });
          pl.vline(e0, { color: 'orange', dash: [4, 4] });
          const rate = g.count(e0) / g.time, th0 = th.Z0 * th.g * Math.exp(-e0);
          info = { rate, th: th0, frac: g.count(e0) / Math.max(1, g.total), e: Math.exp(-e0), g: th.g, total: g.total, time: g.time, eta: th.eta };
        }, { still: 0.5 });
        v.legend([['accent', 'simulation', { dot: true }], ['green', 'theory, slope −1', { dash: true }], ['orange', 'threshold $E_0$']]);
        v.readout(() => `collisions so far: ${info.total} in $t=${v.fix(info.time, 0)}$ · energetic collisions per unit time: simulated $${v.fix(info.rate, 1)}$ vs theory $Z\\,e^{-E_0/k_BT}=${v.fix(info.th, 1)}$ (Enskog factor $g=${v.fix(info.g, 2)}$, packing $\\eta=${v.fix(info.eta, 3)}$)\nenergetic fraction: simulated $${v.fix(info.frac, 3)}$ vs $e^{-E_0/k_BT}=${v.fix(info.e, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Definition', name: 'Steric factor',
      statement: String.raw`The **steric factor** $P$ is the factor by which the measured pre-exponential factor of a bimolecular reaction falls short of the hard-sphere collision-theory value:
$$k \;=\; P\,\pi d^2\sqrt{\frac{8k_BT}{\pi\mu}}\,N_A\,e^{-E_0/k_BT},\qquad 0<P\le 1 \text{ (usually)}.$$
It lumps together everything the model ignores about orientation. If only collisions in which a reactive region of each molecule faces the partner react, and these regions are cones of half-angle $\alpha$ on each molecule, then for randomly oriented molecules $P=\big(\tfrac{1-\cos\alpha}{2}\big)^2$.`,
      idea: String.raw`Orientation at the moment of collision is independent of the relative energy, so the probabilities multiply: (the collision is energetic) × (molecule 1 faces the partner with its reactive patch) × (so does molecule 2). The solid-angle fraction of a cone of half-angle $\alpha$ is $(1-\cos\alpha)/2$, one factor per molecule. Measured values of $P$ range from near 1 (atom + atom, simple radicals) to $10^{-6}$ or less (large molecules that need a particular approach). The independence product in prob 2.1.1a is used for the two patch-facing events and the energetic-collision event. Under independent uniform orientations, each patch has the stated solid-angle probability, so the joint orientation factor is its square. Correlated orientations or orientation-dependent energy transfer would invalidate this factorization.`,
      caption: String.raw`Left: two molecules at contact, each with a reactive cone (drawn as a 2D cross-section of a 3D cone); drag the orange handles to rotate each cone: the contact is reactive (green) only when both cones face the partner. Right: 20 000 pre-drawn random collisions (random orientations, energies drawn from the collision distribution); choose how many are counted. The bars show how many are energetic, correctly oriented, or both, with the theoretical expectation as outlines.`,
      deps: ['kin-2.3', 'prob-2.1.1a'],
      refs: ['Houston'],
      tags: ['collision theory', 'orientation'],
      viz(v) {
        const rr = v.rng(5), NMAX = 20000;
        const C1 = new Float64Array(NMAX), C2 = new Float64Array(NMAX), EN = new Float64Array(NMAX);
        for (let i = 0; i < NMAX; i++) { C1[i] = 2 * rr() - 1; C2[i] = 2 * rr() - 1; EN[i] = -Math.log(1 - rr()); }
        const al = v.slider('cone half-angle $\\alpha$ (°)', 5, 180, 70, { step: 1 });
        const E0 = v.slider('threshold $E_0/k_BT$', 0, 5, 1, { step: 0.1 });
        const nS = v.slider('collisions counted', 100, NMAX, 3000, { log: true, int: true, sig: 2 });
        const L = v.stage({ x: [-3, 3], y: [-1.9, 1.9], equal: true, axes: false, height: 300, title: 'one collision', weight: 1, minWidth: 260 });
        const Rr = v.stage({ x: [0, 4], y: [0, 1.05], axes: 'box', gutter: true, height: 300, ylabel: 'fraction of all collisions', title: 'counting a sample of collisions', weight: 1, minWidth: 260 });
        Rr.setTicks([[0.5, 'all'], [1.5, 'energetic'], [2.5, 'oriented'], [3.5, 'energetic + oriented']], null);
        // positions: molecule 1 at (-1,0), 2 at (1,0), radius 1. a1 = angle of cone axis of molecule 1, a2 of molecule 2
        const r = 1.0;
        const h1 = L.handle(-1 + r * Math.cos(0.9), r * Math.sin(0.9), { color: 'orange', label: '1', constrain: (x, y) => { const a = Math.atan2(y, x + 1); return [-1 + r * Math.cos(a), r * Math.sin(a)]; } });
        const h2 = L.handle(1 + r * Math.cos(Math.PI + 0.8), r * Math.sin(Math.PI + 0.8), { color: 'orange', label: '2', constrain: (x, y) => { const a = Math.atan2(y, x - 1); return [1 + r * Math.cos(a), r * Math.sin(a)]; } });
        const wedge = (cx, cy, a, half, color, alpha) => {
          const pts = [[cx, cy]]; for (let i = 0; i <= 24; i++) { const q = a - half + 2 * half * i / 24; pts.push([cx + 1.0 * Math.cos(q), cy + 1.0 * Math.sin(q)]); }
          L.poly(pts, { fill: color, fillAlpha: alpha, color, width: 1.4 });
        };
        let info = {};
        v.render(() => {
          const A = al.value * Math.PI / 180, ca = Math.cos(A), e0 = E0.value;
          const a1 = Math.atan2(h1.y, h1.x + 1), a2 = Math.atan2(h2.y, h2.x - 1);
          const f1 = Math.cos(a1), f2 = Math.cos(a2 - Math.PI); // facing the partner: angle between axis and line of centres
          const ok1 = f1 >= ca - 1e-9, ok2 = f2 >= ca - 1e-9, ok = ok1 && ok2;
          L.circle(-1, 0, r, { color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.08 }); L.circle(1, 0, r, { color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.08 });
          wedge(-1, 0, a1, Math.min(A, Math.PI - 1e-6), ok1 ? 'green' : 'red', 0.3); wedge(1, 0, a2, Math.min(A, Math.PI - 1e-6), ok2 ? 'green' : 'red', 0.3);
          L.line(-1, 0, 1, 0, { color: 'faint', dash: [4, 4] });
          L.dot(0, 0, { r: 4, color: ok ? 'green' : 'muted' });
          L.text(ok ? 'both cones face the partner: reactive geometry' : 'a cone points away: no reaction', 0, -1.6, { align: 'center', color: ok ? 'green' : 'red', size: 13, weight: 650 });
          const n = Math.round(nS.value); let ne = 0, no = 0, nb = 0;
          for (let i = 0; i < n; i++) { const en = EN[i] >= e0, or = C1[i] >= ca && C2[i] >= ca; if (en) ne++; if (or) no++; if (en && or) nb++; }
          const P = ((1 - ca) / 2) ** 2, pe = Math.exp(-e0);
          const fr = [1, ne / n, no / n, nb / n];
          Rr.bars(fr, { x0: 0.5, dx: 1, color: (val, i) => v.color(['faint', 'orange', 'purple', 'green'][i], 0.85) });
          const th = [1, pe, P, P * pe];
          th.forEach((y, i) => Rr.rect(i + 0.15, 0, i + 0.85, y, { color: 'ink', width: 1.4, fill: false }));
          info = { P, pe, n, ne, no, nb, P_est: no / n, both: nb / n, ok };
        });
        v.legend([['ink', 'expected: $1,\\ e^{-E_0/k_BT},\\ P,\\ Pe^{-E_0/k_BT}$']]);
        v.readout(() => `$P=\\big(\\tfrac{1-\\cos\\alpha}{2}\\big)^2=${v.fix(info.P, 4)}$ · counted ${info.n} collisions: oriented fraction $${v.fix(info.P_est, 4)}$, energetic $${v.fix(info.ne / info.n, 3)}$ (vs $e^{-E_0/k_BT}=${v.fix(info.pe, 3)}$), both $${v.fix(info.both, 4)}$ (vs $Pe^{-E_0/k_BT}=${v.fix(info.P * info.pe, 4)}$)\nthe measured rate constant is $P\\times$ the hard-sphere value: here $k/k_{\\rm HS}=${v.fix(info.P, 4)}$. At $\\alpha=180^\\circ$ the cones are the whole sphere and $P=1$.`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Definition', name: 'Reaction cross-section and excitation function',
      statement: String.raw`The **reactive cross-section** $\sigma_r(E)$ is the effective area, perpendicular to the relative velocity, that a target presents to reaction at relative translational energy $E$: the reaction probability integrated over impact parameter, $\sigma_r(E)=\int_0^\infty P(b,E)\,2\pi b\,db$. Its graph against $E$ is the **excitation function**. The thermal rate constant is its Maxwell–Boltzmann average,
$$k(T)\;=\;\sqrt{\frac{8}{\pi\mu}}\,\frac{N_A}{(k_BT)^{3/2}}\int_0^\infty \sigma_r(E)\,E\,e^{-E/k_BT}\,dE .$$
For the line-of-centres model, $\sigma_r=\pi d^2(1-E_0/E)$ for $E>E_0$ and $0$ below, which reproduces $k=\pi d^2\sqrt{8k_BT/\pi\mu}\,e^{-E_0/k_BT}$.`,
      idea: String.raw`For a projectile at impact parameter $b$ the energy along the line of centres at contact is $E(1-b^2/d^2)$; it must exceed $E_0$, so reaction occurs for $b<b_{\max}=d\sqrt{1-E_0/E}$ and $\sigma_r=\pi b_{\max}^2$. Thermal averaging is the integral over the Maxwell–Boltzmann distribution of relative speeds, rewritten as one over energy, with weight $E\,e^{-E/k_BT}$ coming from $v^2dv\cdot v$ (flux) and the density of states. Beam experiments measure $\sigma_r(E)$ directly (2.9).`,
      caption: String.raw`Left: a projectile aimed at a target of radius $d$ (centre–centre distance at contact); the green core of radius $b_{\max}$ is the reactive cross-section. Middle: the excitation function with your energy marked. Right: the integrand $\sigma_r E e^{-E/k_BT}$ whose area is the thermal rate constant, here compared with the closed form. Switch to a hard threshold ($\sigma_r=\pi d^2$ above $E_0$) to see why the line-of-centres ramp matters.`,
      deps: ['kin-2.3', 'mech-8.17'],
      refs: ['Steinfeld et al.'],
      tags: ['cross-section', 'scattering'],
      viz(v) {
        const model = v.select('model', [{ value: 'loc', label: 'line of centres' }, { value: 'step', label: 'hard threshold' }], 'loc');
        const E0 = v.slider('$E_0$ (kJ/mol)', 5, 100, 40, { step: 1 });
        const Tsl = v.slider('$T$ (K)', 200, 1500, 900, { step: 10 });
        const Es = v.slider('collision energy $E$ (kJ/mol)', 1, 200, 70, { step: 1 });
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 300, title: 'impact geometry', weight: 0.8, minWidth: 240 });
        const B = v.stage({ x: [0, 200], y: [0, 1.15], axes: 'box', gutter: true, height: 300, xlabel: 'E (kJ/mol)', ylabel: 'σᵣ / πd²', title: 'excitation function', weight: 1, minWidth: 240 });
        const C = v.stage({ x: [0, 200], y: [0, 1.1], axes: 'box', gutter: true, height: 300, xlabel: 'E (kJ/mol)', ylabel: 'integrand (relative)', title: 'thermal average', weight: 1, minWidth: 240 });
        const hb = A.handle(-1.3, 0.5, { color: 'gold', label: 'b', constrain: (x, y) => [-1.3, clamp(y, -1.4, 1.4)] });
        const sig = (E) => model.value === 'loc' ? (E > E0.value ? 1 - E0.value / E : 0) : (E > E0.value ? 1 : 0);
        let info = {};
        v.render(() => {
          const E = Es.value, kT = R * Tsl.value, e0 = E0.value;
          const bmax = Math.sqrt(sig(E));
          A.circle(0, 0, 1, { color: 'ink', width: 1.8, fill: 'accent', fillAlpha: 0.08 });
          A.circle(0, 0, bmax, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.3 });
          const b = Math.abs(hb.y); A.arrow(-1.5, hb.y, 1.5, hb.y, { color: b < bmax ? 'green' : 'red', width: 2, head: 8 });
          A.text(b < bmax ? 'reacts' : (b < 1 ? 'hits, bounces off' : 'misses'), 0, -1.35, { align: 'center', color: b < bmax ? 'green' : 'muted', size: 13 });
          A.measure(0, 0, 0, bmax, ''); A.tex('b_{\\max}', 0.08, bmax / 2 + 0.05, { color: 'green' });
          B.fn((x) => sig(x), { color: 'accent', width: 2.6, domain: [0.01, 200] }); B.vline(e0, { color: 'faint', dash: [4, 4] }); B.dot(E, sig(E), { r: 6, color: 'gold' });
          const f = (x) => sig(x) * x * Math.exp(-x / kT) / (kT * kT);
          const w0 = (x) => x * Math.exp(-x / kT) / (kT * kT);
          let top = 0, ex = 1; for (let x = 0.5; x <= 200; x += 0.5) { const q = f(x); if (q > top) { top = q; ex = x; } }
          top = Math.max(top, 1e-300); const sw = top / w0(ex); // the dashed weight is scaled to touch the integrand's peak
          C.fn((x) => f(Math.max(x, 1e-6)) / top, { color: 'accent', width: 2.2, fill: 'accent', domain: [0.01, 200] });
          C.fn((x) => sw * w0(x) / top, { color: 'faint', width: 1.4, dash: [5, 4], domain: [0.01, 200] });
          const num = v.M.integrate((x) => f(x), 0, 12 * kT + e0, 3000);
          const closed = model.value === 'loc' ? Math.exp(-e0 / kT) : (1 + e0 / kT) * Math.exp(-e0 / kT);
          info = { num, closed, kT, b, bmax, sigE: sig(E) };
        });
        v.legend([['accent', 'integrand'], ['faint', 'weight $Ee^{-E/k_BT}$ (rescaled)', { dash: true }], ['green', 'reactive core', { area: true }]]);
        v.readout(() => `$k_BT=${v.fix(info.kT, 2)}$ kJ/mol · $\\sigma_r(E)/\\pi d^2=${v.fix(info.sigE, 3)}$, $b_{\\max}=${v.fix(info.bmax, 3)}\\,d$ · thermal average $k/\\big(\\pi d^2\\sqrt{8k_BT/\\pi\\mu}\\big)=${v.sci(info.num, 4)}$ by numerical integration vs closed form ${model.value === 'loc' ? '$e^{-E_0/k_BT}$' : '$(1+E_0/k_BT)e^{-E_0/k_BT}$'} $=${v.sci(info.closed, 4)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Concept', name: 'Potential energy surfaces',
      statement: String.raw`Because electrons adjust almost instantly to nuclear motion (Born–Oppenheimer approximation), the energy of a reacting system is a function $V(\mathbf R)$ of the nuclear coordinates alone, its **potential energy surface**, and the nuclei move on it as a classical (or quantum) particle. For the atom-transfer reaction $\mathrm A+\mathrm{BC}\to\mathrm{AB}+\mathrm C$ restricted to a line, $V$ depends on the two bond lengths $r_{AB}$, $r_{BC}$: reactants lie in one valley ($r_{AB}$ large, $r_{BC}\approx r_e$), products in another, and the **minimum-energy path** connects them over a pass whose height is the classical barrier.`,
      idea: String.raw`Plotting the surface in coordinates in which the kinetic energy is a plain $\tfrac12M(\dot X^2+\dot Y^2)$ (for equal masses the bond-length axes meet at 60°) turns the motion into a ball rolling on a landscape. The surface here is the London–Eyring–Polanyi–Sato (LEPS) construction: Morse curves for each pair, combined by a quantum-mechanical mixing rule that lets the three pair interactions compete. The mixing weight $w$ of the repulsive triplet curve controls the barrier.`,
      caption: String.raw`A model **LEPS surface** for a collinear H + H₂-like system (all masses 1.008 u, Morse constants of H₂; the weight $w$ is tuned so the barrier is near 0.4 eV; this is a textbook-style model, not an accurate $H_3$ surface). The green dashed line is the minimum-energy path from steepest descent. Choose translational energy, vibrational energy and phase of the incoming H₂ and watch the classical trajectory cross the saddle (reaction) or turn back. The right panel plots potential, kinetic and total energy along the trajectory.`,
      deps: ['qchem-5.2'],
      refs: ['Steinfeld et al.'],
      tags: ['potential energy surface', 'dynamics'],
      credit: 'London, 1928–29; Eyring & Polanyi, 1931; Sato, 1955',
      scope: String.raw`Collinear approach only, classical nuclei; a real surface needs the third (bending) coordinate and electronic-structure input.`,
      viz(v) {
        const wS = v.slider('barrier weight $w$', 0.6, 0.95, 0.75, { step: 0.01 });
        const Et = v.slider('translational energy $E_t$ (eV)', 0, 1.2, 0.45, { step: 0.01 });
        const Ev = v.slider('vibrational energy $E_v$ (eV)', 0.05, 1.0, 0.27, { step: 0.01 });
        const ph = v.slider('vibrational phase', 0, 1, 0.25, { step: 0.01 });
        const A = v.stage({ x: [0, 5.4], y: [0, 3.2], equal: true, axes: false, height: 340, title: 'potential energy surface (contours every 0.2 eV above the reactants; red: level of the saddle)', weight: 1.35 });
        const B = v.stage({ x: [0, 200], y: [-1, 3], axes: 'box', gutter: true, height: 340, xlabel: 't (fs)', ylabel: 'energy (eV)', title: 'energy along the trajectory', weight: 1, minWidth: 260 });
        let cache = null, key = '';
        const prep = () => {
          const k = String(wS.value); if (k === key) return cache; key = k;
          const P = { w: wS.value }, sd = saddle(P), path = mep(P, sd), E = eig2(hessXY(sd.X, sd.Y, P));
          cache = { P, sd, path, E }; return cache;
        };
        let info = {};
        v.render(() => {
          const { P, sd, path } = prep();
          const field = (X, Y) => { const [x, y] = fromXY(X, Y); return (x < 0.3 || y < 0.3) ? 9 : Math.min(9, vRel(x, y, P)); };
          A.heat((X, Y) => { const [x, y] = fromXY(X, Y); return (x < 0.3 || y < 0.3) ? NaN : Math.min(vRel(x, y, P), 3); }, { range: [0, 2.5], cmap: 'theme', res: 3, key: 'pes' + wS.value });
          A.clip(() => { A.contour(field, Array.from({ length: 13 }, (_, i) => 0.05 + 0.2 * i), { color: 'ink', width: 1, alpha: 0.5, res: 160 }); A.contour(field, [sd.V], { color: 'red', width: 1.8, res: 160 }); });
          A.path(path, { color: 'green', width: 2.2, dash: [8, 5] });
          A.dot(sd.X, sd.Y, { r: 6, color: 'red', label: 'saddle', labelPos: 'ne' });
          const L = launch(P, Et.value, Ev.value, ph.value), tr = trajectory(P, L.X, L.Y, L.VX, L.VY, { tmax: 220 });
          A.path(tr.pts, { color: 'gold', width: 2.4 }); A.dot(tr.pts[0][0], tr.pts[0][1], { r: 4, color: 'gold' });
          A.text('A + BC', 4.2, 1.15, { color: 'ink', size: 14, weight: 650, align: 'center' }); A.text('AB + C', 1.0, 2.95, { color: 'ink', size: 14, weight: 650, align: 'center' });
          A.text('r(AB) →', 5.0, 0.2, { color: 'muted', size: 11, align: 'center' });
          // energies
          const V = tr.pts.map((p) => vXY(p[0], p[1], P)), n = V.length, T = Array.from({ length: n }, (_, i) => i * tr.dtStore);
          B.setView([0, Math.max(40, T[n - 1])], [-1, 3]);
          B.path(T.map((t, i) => [t, V[i]]), { color: 'accent', width: 2 }); B.path(T.map((t, i) => [t, tr.en[i] - V[i]]), { color: 'orange', width: 2 }); B.path(T.map((t, i) => [t, tr.en[i]]), { color: 'ink', width: 1.6, dash: [6, 4] });
          B.hline(sd.V, { color: 'red', dash: [3, 4] });
          const drift = Math.max(...tr.en) - Math.min(...tr.en);
          info = { out: tr.outcome, bar: sd.V, E: Et.value + Ev.value, drift, nu: Math.sqrt(Math.abs(prep().E.values[0]) / M_EFF) / (2 * Math.PI * 2.99792458e-5) };
        });
        v.legend([['gold', 'trajectory'], ['green', 'minimum-energy path', { dash: true }], ['accent', '$V$'], ['orange', 'kinetic'], ['ink', 'total', { dash: true }], ['red', 'barrier', { dash: true }]]);
        v.readout(() => `barrier above the reactants: $${v.fix(info.bar, 3)}$ eV (${v.fix(info.bar * 96.485, 1)} kJ/mol) · total energy $E_t+E_v=${v.fix(info.E, 2)}$ eV → outcome: **${info.out === 'reaction' ? 'reaction (AB + C)' : info.out === 'reflected' ? 'reflected (A + BC)' : 'no clean exit within 220 fs'}**\ntotal energy conserved to $${v.fix(info.drift * 1000, 2)}$ meV over the run (velocity-Verlet integration). Raise $w$ and the barrier rises; with only translation the trajectory needs more than the barrier unless vibration helps.`);
      },
    },
  ],
};
