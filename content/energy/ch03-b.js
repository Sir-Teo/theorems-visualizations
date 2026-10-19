// Energy Systems — Chapter 3: Fuels and nuclear energy (items 3.6–3.10; part b)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   3.6 Thermal cross sections at 2200 m/s from the NIST Center for Neutron Research table: U-235 absorption 680.9 b, U-238 2.68 b, H 0.3326 b, D 0.000519 b, C 0.0035 b,
//     O 0.00019 b; U-235 fission 585 b (0.0253 eV). ν = 2.43 neutrons per thermal fission is a round value from memory (evaluated data give about 2.43–2.44; the Wikipedia
//     article on nuclear fission quotes 2.5). Moderating powers ξΣs per molecule/atom (H2O 40 b, D2O 5.3 b, graphite 0.75 b) are from memory of textbook tables (Lamarsh).
//     The effective resonance integral I_eff = 25 b and the fast-fission factor ε = 1.03 are ILLUSTRATIVE tuning values chosen so that the model reproduces the textbook
//     facts that natural uranium cannot go critical in light water but can in graphite or heavy water; the picture is a model of a homogeneous lattice, not a lattice code.
//     Sanity check: η of natural uranium comes out 1.35 (textbook 1.34); Wikipedia's "typical" thermal-reactor factors 1.65, 0.71, 0.87, 1.02 multiply to k∞ ≈ 1.04.
//   3.7, 3.8 Reviewed 2026-10-18: DOE-HDBK-1019/1-93, NP-02 Table 3; beta is the sum of the rounded group fractions, lambda = ln(2)/half-life.
//     Equations checked against Argonne SAS4A/SASSYS-1 §§4.2–4.3. Prompt jump is an approximation; exact ODE power stays continuous.
//   3.9 Way–Wigner fit P/P0 = 0.066 [t^−0.2 − (t+T)^−0.2] with the coefficient and validity range (10 s to 100 days) as printed in Wikipedia "Decay heat", which also
//     gives the typical values 6.5 % at shutdown, 1.5 % after 1 h and 0.4 % after 1 day. The fit gives about 1.1 % at 1 h, so it is only a rough guide (a factor-of-two fit).
//     Latent heat of boiling at 1 atm is 2257 kJ/kg (from the IAPWS-IF97 tables in ch02.shared.js). The Fukushima Daiichi event (11 March 2011) is mentioned qualitatively.
//   3.10 D–T reactivity: Bosch & Hale, Nucl. Fusion 32, 611 (1992), S-factor coefficients (as quoted in the WarpX source), Maxwell-averaged here. Bremsstrahlung
//     5.35e-37 n² √T W/m³ (T in keV) is the standard non-relativistic coefficient, from memory; no cyclotron loss, no impurities, equal D and T. Check: the minimum of the
//     ignition triple product comes out 2.9×10²¹ keV s/m³ at 14 keV, matching the "about 3×10²¹ at about 14 keV" of Wikipedia "Lawson criterion". Lawson, Proc. Phys. Soc.
//     B 70, 6 (1957) was checked in Crossref. Experiments: JT-60U reported triple product 1.53×10²¹ keV s/m³ (disputed as a steady-state value); JET 1991 Q ≈ 0.12;
//     TFTR 1994 10.7 MW, Q ≈ 0.27; JET 1997 16.1 MW, Q ≈ 0.62–0.67 depending on the definition; NIF 5 Dec 2022 3.15 MJ from 2.05 MJ of laser energy on target (target gain 1.5).

import { clamp, lerp, BETA, DN_BETA, DN_LAM, kinMatrix, kinEq, inhour, wayWigner, sigmavDT, tripleNeeded, gainQ, E_ALPHA, E_FUS, satT } from './ch03.shared.js';

const f1 = (v, x) => v.fix(x, 1), f2 = (v, x) => v.fix(x, 2);

export default {
  collection: 'energy',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6', kind: 'Model', name: 'Chain reaction and the multiplication factor',
      statement: String.raw`Let $k$ be the average number of neutrons of the next generation produced by one neutron of the present generation. If $k<1$ the chain is **subcritical** and dies out, if $k=1$ it is **critical** and steady, and if $k>1$ it is **supercritical** and the population grows as $k^g$ after $g$ generations. For an infinite uniform medium the multiplication factor is the product of four factors,
$$k_\infty = \eta\, f\, p\, \varepsilon,$$
the neutrons produced per neutron absorbed in fuel ($\eta$), the fraction of thermal neutrons absorbed in fuel ($f$), the probability of escaping resonance capture while slowing down ($p$) and the fast-fission boost ($\varepsilon$); a finite core multiplies by the probability $P_{NL}$ of not leaking out, $k_{\mathrm{eff}} = k_\infty P_{NL}$. A single neutron starts a growing chain with probability less than one even when $k_{\mathrm{eff}}>1$, because the lineage can die out by chance.`,
      idea: String.raw`Each factor is a ratio of cross sections. Enrichment raises $\eta$ by adding U-235, whose fission-to-absorption ratio is high, and lowers the share of U-238 that only absorbs. A moderator must slow neutrons without absorbing them: light water is a superb slowing-down medium but absorbs enough neutrons (hydrogen's absorption cross section is 0.33 b against 0.0005 b for deuterium) that natural uranium cannot reach $k_\infty=1$ in it, whereas graphite and heavy water allow natural uranium. The branching statistics are those of a Galton–Watson process: with Poisson offspring of mean $k$, extinction probability is the smaller root of $q = e^{k(q-1)}$.`,
      caption: String.raw`Choose a moderator, then move the enrichment, the moderator-to-uranium ratio, the control absorber and the leakage: the four bars show $\eta,f,p,\varepsilon$ and the product turns green once $k_{\mathrm{eff}}\ge 1$. The tree follows four source neutrons through the generations (each neutron leaves a Poisson number of successors); press *Resample* for another run. Try natural uranium (0.72 %) in light water, then in graphite.`,
      deps: ['energy-3.5'],
      refs: ['Tester ch. 9'],
      tags: ['chain reaction', 'criticality', 'neutron multiplication'],
      scope: String.raw`A homogeneous four-factor model of a thermal reactor with illustrative resonance and fast-fission parameters (see the source note), real thermal cross sections, no spatial structure and no burnup. It shows trends and thresholds (natural uranium in light water versus graphite or heavy water), not the $k$ of any real design.`,
      verify: true,
      viz(v) {
        const MOD = {
          h2o: { n: 'light water', sa: 2 * 0.3326 + 0.00019, xs: 40, N0: 3, lab: 'H₂O molecules per U atom' },
          d2o: { n: 'heavy water', sa: 2 * 0.000519 + 0.00019, xs: 5.3, N0: 150, lab: 'D₂O molecules per U atom' },
          c: { n: 'graphite', sa: 0.0035, xs: 0.75, N0: 400, lab: 'C atoms per U atom' },
        };
        const NU = 2.43, SF5 = 585, SA5 = 680.9, SA8 = 2.68, IEFF = 25, EPS = 1.03;
        const s = v.stage({ x: [0, 5.4], y: [-0.3, 2.3], axes: false, height: 270, minWidth: 340 });
        const s2 = v.stage({ x: [0, 10], y: [-0.14, 1.14], axes: false, height: 270, minWidth: 340 });
        const mod = v.select('moderator', Object.entries(MOD).map(([k, m]) => ({ value: k, label: m.n })), 'h2o', { onChange: () => { ratio.set(MOD[mod.value].N0); } });
        const en = v.slider('enrichment (% U-235)', 0.72, 20, 3, { step: 0.01, log: true });
        const ratio = v.slider('moderator per uranium atom', 0.3, 1000, 3, { step: 0.1, log: true });
        const ctl = v.slider('control absorber (barns per U atom)', 0, 30, 6, { step: 0.5 });
        const leak = v.slider('non-leakage probability $P_{NL}$', 0.5, 1, 0.97, { step: 0.005 });
        let seed = 7; v.button('Resample', () => { seed++; });
        const calc = () => {
          const m = MOD[mod.value], e = en.value / 100, SaF = e * SA5 + (1 - e) * SA8, SaM = ratio.value * m.sa;
          const eta = NU * e * SF5 / SaF, f = SaF / (SaF + SaM + ctl.value);
          const p = Math.exp(-(1 - e) * IEFF / (ratio.value * m.xs)), kinf = eta * f * p * EPS;
          return { eta, f, p, eps: EPS, kinf, keff: kinf * leak.value };
        };
        const extinct = (k) => { if (k <= 1) return 1; let q = 0.5; for (let i = 0; i < 200; i++) q = Math.exp(k * (q - 1)); return q; };
        const pois = (r, lam) => { if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal())); const L = Math.exp(-lam); let k = 0, pp = 1; do { k++; pp *= r(); } while (pp > L); return k - 1; };
        let C = null;
        v.render(() => {
          C = calc(); const keff = C.keff;
          const fac = [['η', C.eta, 'accent'], ['f', C.f, 'orange'], ['p', C.p, 'purple'], ['ε', C.eps, 'teal'], ['k∞', C.kinf, 'gold'], ['k_eff', keff, keff >= 1 ? 'green' : 'red']];
          fac.forEach(([n, val, col], i) => { s.rect(i * 0.9 + 0.15, 0, i * 0.9 + 0.8, Math.min(val, 2.2), { fill: col, fillAlpha: 0.55, color: col }); s.text(n, i * 0.9 + 0.475, -0.16, { size: 13, weight: 700, color: col, align: 'center' }); s.text(v.fix(val, 3), i * 0.9 + 0.475, Math.min(val, 2.2) + 0.1, { size: 12, weight: 700, color: 'ink', align: 'center' }); });
          s.hline(1, { color: 'ink', dash: true, alpha: 0.6 }); s.text('k = 1', 5.35, 1.07, { size: 11, color: 'muted', align: 'right' });
          // lineage tree
          const r = v.rng(seed * 101 + 3), G = 9, gens = [[0]], edges = [], pop = [1]; let ids = [{ g: 0, i: 0, par: -1 }]; let cur = [0]; const layers = [[{ par: -1 }, { par: -1 }, { par: -1 }, { par: -1 }]];
          for (let g = 1; g <= G; g++) { const prev = layers[g - 1], lay = []; let total = 0; for (let i = 0; i < prev.length && lay.length < 60; i++) { const c = pois(r, keff); for (let j = 0; j < c && lay.length < 60; j++) lay.push({ par: i }); total += c; } pop.push(lay.length >= 60 ? 60 : lay.length); layers.push(lay); if (!lay.length) break; }
          const cx = (g) => 0.4 + g * (9.2 / G);
          layers.forEach((lay, g) => { const n = lay.length; lay.forEach((nd, i) => { nd.y = (i + 0.5) / Math.max(n, 1); if (g > 0) { const p = layers[g - 1][nd.par]; s2.line(cx(g - 1), p.y, cx(g), nd.y, { color: 'faint', width: 1 }); } });
            { const c = s2.ctx; c.fillStyle = v.color(g === 0 ? 'gold' : 'accent'); for (const nd of lay) { c.beginPath(); c.arc(s2.X(cx(g)), s2.Y(nd.y), n > 30 ? 3 : 5, 0, 6.2832); c.fill(); } } s2.text(`g${g}`, cx(g), -0.07, { size: 10.5, color: 'muted', align: 'center' }); });
          const last = layers.length - 1; if (!layers[last].length) s2.text('chain died out (press Resample)', Math.min(cx(last) + 0.25, 5.6), 0.78, { size: 13, weight: 700, color: 'red', align: 'left' });
          s2.text(`four source neutrons, Poisson(${f2(v, keff)}) offspring each`, 0.1, 1.07, { size: 11.5, color: 'muted', align: 'left' });
        });
        v.readout(() => {
          const k = C.keff, q = extinct(k);
          const note = k < 1 ? 'subcritical: every lineage dies out.' : k === 1 ? 'critical.' : `supercritical: a single neutron seeds a growing chain with probability ${f1(v, 100 * (1 - q))} %.`;
          return `$\\eta f p \\varepsilon = ${v.fix(C.eta, 3)}\\times${v.fix(C.f, 3)}\\times${v.fix(C.p, 3)}\\times${v.fix(C.eps, 3)} = ${v.fix(C.kinf, 3)}$, and $k_{\\mathrm{eff}} = k_\\infty P_{NL} = ${v.fix(k, 3)}$: ${note}\nExpected population after 10 generations: $k^{10} = ${v.sci(k ** 10, 3)}$ neutrons per starting neutron.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7', kind: 'Concept', name: 'Delayed neutrons make reactors controllable',
      statement: String.raw`Almost all neutrons of a fission appear within about $10^{-13}$ s (**prompt**), but a fraction $\beta\approx 0.0065$ for thermal fission of U-235 come out later, from the decay of fission products, with delays from a fraction of a second to about a minute (**delayed**). Because the prompt neutron generation time $\Lambda$ is of order $10^{-4}$ s, a reactivity $\rho=(k-1)/k$ that keeps the reactor **below prompt critical** ($\rho<\beta$, one "dollar") makes the power change with the slow delayed-neutron time scale, seconds, rather than with $\Lambda$. If $\rho>\beta$ the chain is critical on prompt neutrons alone and power rises on the millisecond scale.`,
      idea: String.raw`A neutron generation then has two kinds of members: the prompt ones, fast, and the delayed ones, lagging by an average of about 13 s. Averaged over both, the effective generation time is $\Lambda + \sum_i \beta_i/\lambda_i\approx 0.085$ s, about a thousand times longer than $\Lambda$. For positive reactivity the asymptotic growth rate $\omega$ solves the inhour equation $\rho = \Lambda\omega + \sum_i \beta_i\omega/(\omega+\lambda_i)$ (derived in 3.8): for small $\rho$ the delayed groups dominate, for $\rho>\beta$ the prompt term does.`,
      caption: String.raw`Power after a sudden reactivity step $\rho$ (in dollars, $\$1 = \beta$), on log–log axes from 0.1 ms to 100 s. Blue: the six-group point model. Red: the same reactor with delayed neutrons removed. Slide $\rho$ up toward \$1 and beyond, and change $\Lambda$: below a dollar, the blue curve makes a small prompt jump and then rises with a period of seconds; near and above a dollar the delayed model accelerates sharply, while the prompt-only comparison remains a different model.`,
      deps: ['energy-3.6'],
      refs: ['DOE-HDBK-1019/1-93, NP-02 pp. 29–32, Table 3', 'Argonne SAS4A/SASSYS-1 manual, §4.2, Eq. (4.2-4), and §4.3, Eqs. (4.3-1)–(4.3-3)'],
      tags: ['delayed neutrons', 'reactor control', 'reactor period'],
      scope: String.raw`Zero-power point-kinetics model with the six-group thermal U-235 delayed-neutron data, constant reactivity step from an exactly critical steady state, no feedback and no spatial effects. The value $\beta=0.0065$ is for U-235; plutonium-239 has $\beta\approx 0.002$ and the effective fraction also depends on spectrum and neutron importance.`,
      credit: 'Six-group data: DOE-HDBK-1019/1-93, NP-02 Table 3 (rounded thermal U-235 values)',
      viz(v) {
        const s = v.stage({ x: [1e-4, 100], y: [0.5, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'time since the step (s)', ylabel: 'power relative to initial', minWidth: 340 });
        const sb = v.stage({ x: [0, 7], y: [0, 1], axes: false, height: 350, minWidth: 300 });
        const rho = v.slider('reactivity step $\\rho$ (dollars, $\\$1=\\beta$)', 0.05, 1.3, 0.34, { step: 0.01 });
        const Lam = v.slider('prompt generation time $\\Lambda$ (s)', 1e-5, 1e-3, 1e-4, { log: true });
        const ts = Array.from({ length: 70 }, (_, i) => 1e-4 * 10 ** (6 * i / 69));
        let res = null;
        v.render(() => {
          const L = Lam.value, r = rho.value * BETA, A = (t) => v.M.expm(kinMatrix(r, L, t));
          const y0 = kinEq(L);
          const omega = inhour(v.M, r, L), jump = r < BETA ? BETA / (BETA - r) : null;
          // Do not evaluate matrix exponentials or exponentials beyond the displayed power range.
          const del = ts.filter(t => omega * t < Math.log(1e7)).map((t) => [t, v.M.matVec(A(t), y0)[0]]);
          const pr = ts.filter(t => r * t / L < Math.log(1e7)).map((t) => [t, Math.exp(r * t / L)]);
          s.clip(() => { s.path(pr.filter((p) => p[1] < 1e7), { color: 'red', width: 2.2 }); s.path(del, { color: 'accent', width: 2.6 }); });
          if (jump) s.hline(jump, { color: 'green', dash: true, alpha: 0.7 });
          if (omega > 0) s.vline(1 / omega, { color: 'gold', dash: true, alpha: 0.7 });
          s.hline(1, { color: 'faint' });
          if (jump) s.text(`prompt jump ${f2(v, jump)}`, 2e-4, jump * 1.6, { size: 11.5, color: 'green', align: 'left' });
          if (omega > 0) s.text(`1/ω = ${v.fmt(1 / omega, 3)} s`, 1 / omega / 1.15, 3, { size: 11.5, color: 'gold', align: 'right' });
          res = { omega, jump, tPrompt: r > 0 ? L / r : Infinity, r };
          // delayed groups bar chart
          const mx = Math.max(...DN_BETA);
          sb.text('delayed-neutron groups (U-235, thermal)', 0.1, 0.96, { size: 12, weight: 700, color: 'ink', align: 'left' });
          DN_BETA.forEach((b, i) => { const x0 = i + 0.6; sb.rect(x0 - 0.3, 0.12, x0 + 0.3, 0.12 + 0.55 * b / mx, { fill: 'orange', fillAlpha: 0.55, color: 'orange' });
            sb.text(`${(b * 1e5).toFixed(0)}`, x0, 0.12 + 0.55 * b / mx + 0.05, { size: 11, weight: 700, color: 'ink', align: 'center' });
            sb.text(`${f2(v, Math.LN2 / DN_LAM[i])} s`, x0, 0.05, { size: 10.5, color: 'muted', align: 'center' }); });
          sb.text('bars: β_i in pcm (10⁻⁵); labels: half-life', 0.1, 0.85, { size: 11, color: 'muted', align: 'left' });
          sb.text(`total β = ${BETA.toFixed(4)}   mean delay ${f1(v, DN_BETA.reduce((a, b, i) => a + b / DN_LAM[i], 0) / BETA)} s`, 0.1, 0.78, { size: 12, weight: 700, color: 'orange', align: 'left' });
        });
        v.legend([['accent', 'with delayed neutrons'], ['red', 'prompt neutrons only'], ['green', 'prompt jump $\\beta/(\\beta-\\rho)$', { dash: true }], ['gold', 'stable period', { dash: true }]]);
        v.readout(() => {
          const lam = DN_BETA.reduce((a, b, i) => a + b / DN_LAM[i], 0), T = res.omega > 0 ? 1 / res.omega : Infinity;
          return `$\\rho=${f2(v, rho.value)}\\,\\$ = ${v.fix(res.r * 1e5, 0)}$ pcm. Prompt-only e-folding time $\\Lambda/\\rho = ${v.fmt(res.tPrompt, 3)}$ s; with delayed neutrons the stable period is $1/\\omega = ${v.fmt(T, 3)}$ s (inhour equation), ${v.fmt(T / res.tPrompt, 3)} times slower.\nEffective generation time $\\Lambda+\\sum\\beta_i/\\lambda_i = ${v.fmt(Lam.value + lam, 3)}$ s versus $\\Lambda = ${v.fmt(Lam.value, 2)}$ s. ${rho.value >= 1 ? '**Prompt critical: the delayed neutrons no longer set the time scale.**' : `Prompt jump factor $\\beta/(\\beta-\\rho) = ${f2(v, res.jump)}$.`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8', kind: 'Model', name: 'Point reactor kinetics',
      statement: String.raw`For a reactor treated as a single point, the neutron population $n(t)$ (relative power) and the concentrations $c_i(t)$ of the six delayed-neutron precursor groups obey
$$\frac{dn}{dt} = \frac{\rho(t)-\beta}{\Lambda}\,n + \sum_{i=1}^{6}\lambda_i c_i,\qquad \frac{dc_i}{dt} = \frac{\beta_i}{\Lambda}\,n - \lambda_i c_i,$$
with $\beta=\sum\beta_i$. For constant $\rho$ this is a linear system $\dot y = A y$ with 7 eigenvalues, and the largest, $\omega$, is the root of the inhour equation $\rho = \Lambda\omega + \sum_i \beta_i\omega/(\omega+\lambda_i)$. For a step below prompt critical, a sufficiently separated prompt transient approaches the approximate factor $\beta/(\beta-\rho)$ before delayed evolution dominates; power is continuous in these ODEs. The stable period is $1/\omega$; for $\rho>\beta$ there is no prompt jump to speak of, and the period is of order $\Lambda/(\rho-\beta)$.`,
      idea: String.raw`Neutron balance: of the $k$ neutrons per generation, a fraction $\beta_i$ is held back in precursor group $i$ and released at rate $\lambda_i$; the rest return within a time $\Lambda$. Because the prompt time is so short, the power adjusts almost instantaneously to the "quasi-static" level $n\approx \beta/(\beta-\rho)$ (the prompt jump) while the precursors slowly catch up. The system is stiff (rates from $0.01$ to $10^{4}$ per second), so we propagate it with the exact matrix exponential $y(t+\Delta t)=e^{A\Delta t}y(t)$, which is exact for a piecewise-constant reactivity.`,
      caption: String.raw`Choose a reactivity program (step, slow rod withdrawal, or a step followed by a scram) and a size in dollars. The top curve is power on a log scale against time; the dashed lines are the predicted prompt jump and the asymptotic exponential from the inhour equation. Push the step past \$1: the power runs away on the scale of $\Lambda$. Switch on the energy feedback and the same excursion is cut short, as in a Doppler-damped reactor.`,
      deps: ['energy-3.7', 'ode-3.1', 'ode-3.3'],
      refs: ['Argonne SAS4A/SASSYS-1 manual, §4.2, Eq. (4.2-4), and §4.3, Eqs. (4.3-1)–(4.3-3); inhour follows by exponential substitution', 'DOE-HDBK-1019/1-93, NP-02 Table 3 (six-group inputs)'],
      tags: ['reactor kinetics', 'stiff ODE', 'inhour equation'],
      scope: String.raw`Zero-dimensional kinetics with six delayed groups and constant $\Lambda=10^{-4}$ s (adjustable). The feedback option subtracts $\alpha E$ from the reactivity, with $E$ the energy released since the start in full-power seconds and $\alpha$ an illustrative coefficient; real feedback involves fuel and coolant temperatures with their own delays. Not valid when the core changes shape or the power gets so high that materials change state.`,
      viz(v) {
        const s = v.stage({ x: [1e-3, 60], y: [0.3, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'time (s)', ylabel: 'power relative to initial', minWidth: 340 });
        const sr = v.stage({ x: [1e-3, 60], y: [-6, 1.6], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'time (s)', ylabel: 'reactivity (dollars)', minWidth: 340 });
        const prog = v.select('program', [{ value: 'step', label: 'step' }, { value: 'ramp', label: 'slow ramp (0.02 \\$/s)' }, { value: 'scram', label: 'step, scram at 10 s' }], 'step');
        const rho = v.slider('reactivity $\\rho$ (dollars)', -1, 1.4, 0.3, { step: 0.01 });
        const Lam = v.slider('$\\Lambda$ (s)', 1e-5, 1e-3, 1e-4, { log: true });
        const fb = v.toggle('energy feedback', false);
        const alpha = v.slider('feedback $\\alpha$ (\\$ per full-power second)', 0.005, 0.2, 0.05, { step: 0.005, log: true });
        let sim = null;
        const run = () => {
          const L = Lam.value, M = v.M, cache = new Map();
          const E = (r, dt) => { const k = `${r.toFixed(9)}|${dt.toFixed(9)}`; let m = cache.get(k); if (!m) { m = M.expm(kinMatrix(r, L, dt)); if (cache.size > 300) cache.clear(); cache.set(k, m); } return m; };
          let y = kinEq(L), t = 0, En = 0; const out = [[1e-3, 1]], rr = [], T = 60; let guard = 0;
          const ext = (tt) => (prog.value === 'step' ? rho.value : prog.value === 'ramp' ? 0.02 * tt : tt < 10 ? rho.value : -6) * BETA;
          while (t < T && guard++ < 2500) {
            const r0 = ext(t + 1e-9) - (fb.value ? alpha.value * BETA * En : 0);
            const growth = Math.max(0, (r0 - BETA) / L, inhour(M, Math.min(r0, 0.9999 * BETA * 5), L) * 1);
            let dt = Math.max(t * 0.025, 1e-3); if (fb.value || prog.value === 'ramp') dt = Math.min(dt, 0.04 / Math.max(growth, 1));
            if (growth > 0) dt = Math.min(dt, 0.5 / growth);
            if (prog.value === 'scram' && t < 10 && t + dt > 10) dt = 10 - t;
            dt = Math.min(dt, T - t);
            const rm = ext(t + dt / 2) - (fb.value ? alpha.value * BETA * En : 0);
            const mt = fb.value || prog.value === 'ramp' ? rm : r0;
            y = M.matVec(E(mt, dt), y); En += 0.5 * (out[out.length - 1][1] + y[0]) * dt; t += dt;
            out.push([t, Math.max(y[0], 1e-6)]); rr.push([t, mt / BETA]);
            if (y[0] > 1e12) break; // stop an unphysical zero-feedback extrapolation before numeric overflow
          }
          const L2 = rr.length ? rr : [[1e-3, 0]];
          sim = { out, rr: L2, E: En, endTime: t, omega: inhour(M, ext(1e-6) , L) };
        };
        v.render(() => {
          run(); const r = rho.value * BETA;
          s.clip(() => s.path(sim.out, { color: 'accent', width: 2.5 }));
          if (prog.value !== 'ramp' && r < BETA && r > 0) s.hline(BETA / (BETA - r), { color: 'green', dash: true, alpha: 0.7 });
          if (prog.value === 'step' && !fb.value && r > 0 && sim.omega > 0) { const tt = 0.5 * sim.out[sim.out.length - 1][0], pt = sim.out.reduce((b, p) => (Math.abs(p[0] - tt) < Math.abs(b[0] - tt) ? p : b)), A = pt[1] / Math.exp(sim.omega * pt[0]); s.clip(() => s.fn((t) => A * Math.exp(sim.omega * t), { color: 'gold', dash: true, width: 1.8, domain: [0.05, 60] })); }
          sr.path(sim.rr, { color: 'purple', width: 2.2 }); sr.hline(0, { color: 'faint' }); sr.hline(1, { color: 'red', dash: true, alpha: 0.7 });
          sr.text('prompt critical ($1)', 0.0015, 1.17, { size: 11, color: 'red', align: 'left' });
        });
        v.legend([['accent', 'power $n(t)$'], ['green', 'prompt jump', { dash: true }], ['gold', 'inhour asymptote', { dash: true }], ['purple', 'net reactivity'], ['red', 'prompt critical', { dash: true }]]);
        v.readout(() => {
          const r = rho.value * BETA, pk = Math.max(...sim.out.map((p) => p[1])), end = sim.out[sim.out.length - 1][1];
          const jump = prog.value !== 'ramp' && r < BETA ? `predicted prompt jump $\\beta/(\\beta-\\rho)=${f2(v, BETA / (BETA - r))}$, ` : '';
          const per = sim.omega > 0 && prog.value !== 'ramp' && r > 0 ? `stable period $1/\\omega = ${v.fmt(1 / sim.omega, 3)}$ s (inhour), ` : '';
          return `${jump}${per}peak power $${v.sci(pk, 3)}$ of initial, power at ${f2(v, sim.endTime)} s $${v.sci(end, 3)}$.\nEnergy released $${v.sci(sim.E, 3)}$ full-power seconds. ${sim.endTime < 59.999 ? "The trace stops at its numerical/model range limit before 60 s." : ""} ${rho.value >= 1 && !fb.value && prog.value === 'step' ? '**Above \\$1 the power runs away on the scale of $\\Lambda$; only feedback or a scram stops it.**' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9', kind: 'Phenomenon', name: 'Decay heat after shutdown',
      statement: String.raw`When a reactor is shut down, fission stops within seconds, but the fission products, accumulated during operation, keep decaying and releasing heat. Right after shutdown this **decay heat** is about 6–7 % of the pre-shutdown thermal power, falling to about 1.5 % after an hour and about 0.4 % after a day. A useful fit for $P(t)/P_0$ at $t$ seconds after shutdown of a reactor that ran for $T$ seconds is
$$\frac{P(t)}{P_0} \approx 0.066\Bigl[t^{-0.2}-(t+T)^{-0.2}\Bigr],$$
valid roughly from 10 s to 100 days. The heat must be removed for days: for a 3000 MW(th) reactor, 1 % is still 30 MW.`,
      idea: String.raw`Fission products are a large family of unstable nuclides with half-lives from fractions of a second to years; the total decay power is a sum of exponentials which, spread over many time scales, looks like a power law $t^{-0.2}$ (the Way–Wigner fit). The longer the reactor ran, the more long-lived products have built up, hence the dependence on $T$. Boil-off after a loss of cooling follows from an energy balance with the latent heat of water: this is the situation that arose at Fukushima Daiichi in March 2011, when a tsunami disabled the cooling of reactors that had already shut down.`,
      caption: String.raw`The curve is the fit on log axes; dots mark typical quoted values (6.5 % at shutdown lies off the left edge, 1.5 % at 1 h, 0.4 % at 1 day). Drag the handle to choose when cooling is lost. The lower panel shows the water level (a vessel with the given inventory, started at 40 °C) falling as decay heat boils it away: the earlier cooling is lost, the faster the level drops.`,
      deps: ['energy-3.6', 'thermo-4.5'],
      refs: ['Tester ch. 9'],
      tags: ['decay heat', 'nuclear safety', 'fission products'],
      scope: String.raw`A fit, not a calculation: Way–Wigner is good to roughly a factor of two against detailed summations (it gives about 1.1 % at one hour where typical quoted values are 1.5 %), and the standard design tool is a summation over fission-product nuclides. The boil-off estimate is adiabatic at 1 atm: it ignores pressure, metal heat capacity, steam condensation and any makeup water.`,
      verify: true,
      viz(v) {
        const s = v.stage({ x: [10, 8.64e6], y: [3e-4, 0.1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time after shutdown', ylabel: 'decay heat / full power', minWidth: 340,
          xticks: [[10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h'], [86400, '1 d'], [864000, '10 d'], [8.64e6, '100 d']] });
        const sl = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 260, xlabel: 'hours after cooling is lost', ylabel: 'water left (%)', minWidth: 340 });
        const P0 = v.slider('thermal power $P_0$ (MW)', 100, 4000, 3000, { step: 50 });
        const Top = v.slider('operating time $T$ (days)', 10, 1500, 365, { step: 5, log: true });
        const inv = v.slider('water above the fuel (tonnes)', 20, 600, 150, { step: 5 });
        const h = s.handle(3600, wayWigner(3600, 365 * 86400), { color: 'gold', label: 'cooling lost', constrain: (x) => { x = clamp(x, 10, 8.64e6); return [x, wayWigner(x, Top.value * 86400)]; } });
        const HFG = (satT(100).hg - satT(100).hf) * 1000; // J/kg at 1 atm
        const CP = 4186, DT = 60;
        const boil = (t0, m, P, T) => { // integrate P(t) from t0 until energy = m (cp ΔT + hfg); step in log time
          const Etot = m * (CP * DT + HFG); let E = 0, t = t0; const pts = [[0, 100]];
          while (E < Etot && t < t0 + 3e7) { const dt = Math.max(30, (t - t0) * 0.01); const p = P * wayWigner(t + dt / 2, T) * 1e6; E += p * dt; t += dt; pts.push([(t - t0) / 3600, 100 * Math.max(0, 1 - Math.max(0, E - m * CP * DT) / (m * HFG))]); }
          return { t: t - t0, pts };
        };
        let B = null;
        v.render(() => {
          const T = Top.value * 86400; h.set(h.x, wayWigner(h.x, T));
          s.fn((t) => wayWigner(t, T), { color: 'accent', width: 2.6 });
          s.dots([[3600, 0.015], [86400, 0.004]], { r: 5, color: 'purple' });
          s.text('typical 1.5 %', 3600 / 1.3, 0.0185, { size: 11, color: 'purple', align: 'right' }); s.text('typical 0.4 %', 86400 * 1.3, 0.0037, { size: 11, color: 'purple', align: 'left' });
          s.hline(0.01, { color: 'faint', dash: true }); s.text('1 %', 12, 0.0112, { size: 11, color: 'muted', align: 'left' });
          B = boil(h.x, inv.value * 1000, P0.value, T);
          sl.setView([0, Math.max(B.t / 3600 * 1.08, 0.5)], [0, 105]);
          sl.path(B.pts.filter((p) => p[0] <= 100), { color: 'accent', width: 2.6 });
        });
        v.readout(() => {
          const T = Top.value * 86400, f = wayWigner(h.x, T), P = f * P0.value, m = P * 1e6 / HFG;
          const hrs = h.x / 3600, tl = h.x < 3600 ? `${f1(v, h.x / 60)} min` : h.x < 172800 ? `${f1(v, hrs)} h` : `${f1(v, hrs / 24)} d`;
          return `${tl} after shutdown: decay heat $${v.fix(100 * f, 2)}\\ \\%$ of full power $= ${f1(v, P)}$ MW, enough to boil ${f1(v, m)} kg/s (${Math.round(m * 3.6)} t/h) of water at 1 atm.\nIf cooling is lost then, the ${Math.round(inv.value)} t of water is gone after ${B.t / 3600 > 99 ? 'more than 100' : f1(v, B.t / 3600)} h. Fit check: 1 h gives ${v.fix(100 * wayWigner(3600, T), 2)} % and 1 day ${v.fix(100 * wayWigner(86400, T), 2)} % (quoted 1.5 % and 0.4 %).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10', kind: 'Law', name: 'Fusion and the Lawson criterion',
      statement: String.raw`For a deuterium–tritium plasma of density $n$ (each ion species $n/2$), ion and electron temperature $T$ and energy confinement time $\tau_E$, energy balance requires that fusion power $P_{\mathrm{fus}} = \tfrac14 n^2\langle\sigma v\rangle E_{\mathrm{fus}}$ ($E_{\mathrm{fus}}=17.6$ MeV) cover the losses, of which the alpha particles' share $E_\alpha=3.5$ MeV heats the plasma. Heating by external power $P_{\mathrm{ext}}=P_{\mathrm{fus}}/Q$ and the bremsstrahlung loss $P_B$ give
$$n\,\tau_E \;\ge\; \frac{3T}{\tfrac14\langle\sigma v\rangle\bigl(E_\alpha + E_{\mathrm{fus}}/Q\bigr)-C_B\sqrt T},$$
and for ignition ($Q\to\infty$) the triple product $n T \tau_E$ must exceed a minimum of about $3\times10^{21}\ \mathrm{keV\,s\,m^{-3}}$, reached near $T\approx 14$ keV. The reactivity $\langle\sigma v\rangle$ rises steeply with temperature because only the tail of the Maxwellian can tunnel through the Coulomb barrier.`,
      idea: String.raw`Fusion releases energy because it moves nucleons up the binding-energy curve (3.5), but the nuclei repel each other, so the fuel must be hot (about $10^8$ K) and held long enough for enough of it to burn: the criterion balances the rate of fusion heating of the plasma against the rate at which it loses energy by conduction ($3nT/\tau_E$) and radiation. The product $nT\tau_E$ is the natural figure of merit because the best temperature, where $\langle\sigma v\rangle/T^2$ is largest, is nearly fixed by the cross section. J. D. Lawson derived the criterion in 1955–57.`,
      caption: String.raw`The curves give the triple product needed for fusion gain $Q=1$ (scientific breakeven), 5, 20 and ignition ($Q=\infty$) against temperature, from the Bosch–Hale D–T cross section integrated over a Maxwellian. Set density, temperature and confinement time with the sliders: the gold point is your plasma and the readout gives its $Q$ (or "ignited"). The bars give gains reported by real experiments, which sit between $Q=0.1$ and 0.7 for magnetic devices.`,
      deps: ['energy-3.5'],
      refs: ['Tester ch. 9'],
      tags: ['fusion', 'Lawson criterion', 'plasma'],
      scope: String.raw`Zero-dimensional steady-state balance for a pure D–T plasma with $T_i=T_e$, parabolic profiles ignored, only bremsstrahlung radiation (no synchrotron, no impurities, no fuel dilution by helium ash), and all alpha power absorbed. Real devices have profiles and pulses, so a quoted $Q$ is defined differently in magnetic and inertial fusion; the inertial point (NIF) is a target gain, not comparable to a magnetic $Q$. The experimental values are the published headline figures and were not recomputed.`,
      credit: 'J. D. Lawson, 1957',
      verify: true,
      links: { crossref: 'https://doi.org/10.1088/0370-1301/70/1/303' },
      viz(v) {
        const s = v.stage({ x: [1, 100], y: [1e19, 1e23], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'ion temperature T (keV)', ylabel: 'n T τE (keV s m⁻³)', minWidth: 340 });
        const sq = v.stage({ x: [0, 1.7], y: [0, 5.5], axes: false, height: 360, minWidth: 320 });
        const n = v.slider('density $n$ (m⁻³)', 1e19, 3e21, 1e20, { log: true, fmt: (x) => x.toExponential(1) });
        const T = v.slider('temperature $T$ (keV)', 2, 80, 15, { step: 0.5 });
        const tau = v.slider('confinement time $\\tau_E$ (s)', 0.01, 20, 1, { log: true });
        const Qs = [1, 5, 20, Infinity], cols = ['red', 'orange', 'purple', 'green'];
        const exps = [['JET 1991', 0.12, 'about 10 % tritium, 1.7 MW peak'], ['TFTR 1994', 0.27, '10.7 MW'], ['JET 1997', 0.62, 'Q 0.62–0.67; 16 MW'], ['NIF 2022', 1.5, 'target gain (not Q)']];
        const Ts = Array.from({ length: 90 }, (_, i) => 1 * 100 ** (i / 89));
        let st = null;
        v.render(() => {
          Qs.forEach((Q, i) => { const pts = Ts.map((t) => [t, tripleNeeded(t, Q)]).filter((p) => isFinite(p[1])); s.path(pts, { color: cols[i], width: i === 3 ? 3 : 2 }); });
          s.hline(1.53e21, { color: 'muted', dash: true, alpha: 0.7 }); s.text('JT-60U: 1.5×10²¹ (disputed)', 1.1, 1.53e21 * 0.62, { size: 11, color: 'muted', align: 'left' });
          const tp = n.value * T.value * tau.value, Q = gainQ(n.value, T.value, tau.value);
          s.dot(T.value, tp, { r: 7, color: 'gold' });
          st = { tp, Q, need: tripleNeeded(T.value) };
          // experiments ladder
          sq.text('gain reported by experiments', 0.02, 5.2, { size: 12.5, weight: 700, color: 'ink', align: 'left' });
          exps.forEach(([nm, q, note], i) => { const y = 4.1 - i * 1.0; sq.rect(0.02, y - 0.22, 0.02 + q * 0.7, y + 0.22, { fill: i === 3 ? 'teal' : 'accent', fillAlpha: 0.5, color: i === 3 ? 'teal' : 'accent' }); sq.text(`${nm}:  ${q}`, 0.02, y + 0.46, { size: 12, weight: 700, color: 'ink', align: 'left' }); sq.text(note, 0.02 + q * 0.7 + 0.04, y - 0.02, { size: 11, color: 'muted', align: 'left' }); });
          sq.vline(0.02 + 0.7, { color: 'red', dash: true, alpha: 0.5 }); sq.text('Q = 1', 0.02 + 0.7, 0.2, { size: 11.5, color: 'red', align: 'center' });
          sq.text(`your plasma: ${isFinite(Q) ? 'Q = ' + f2(v, Q) : 'ignited'}`, 0.02, 0.7, { size: 12.5, weight: 700, color: 'gold', align: 'left' });
        });
        v.legend([['red', '$Q=1$'], ['orange', '$Q=5$'], ['purple', '$Q=20$'], ['green', 'ignition'], ['gold', 'your plasma', { dot: true }]]);
        v.readout(() => {
          const sv = sigmavDT(T.value);
          const tmin = Ts.reduce((b, t) => (tripleNeeded(t) < tripleNeeded(b) ? t : b), 1);
          return `At $T=${f1(v, T.value)}$ keV, $\\langle\\sigma v\\rangle = ${v.sci(sv, 3)}$ m$^3$/s. Your triple product is $${v.sci(st.tp, 3)}$ keV s m$^{-3}$; ignition needs $${isFinite(st.need) ? v.sci(st.need, 3) : '\\infty'}$ at this temperature, so **${isFinite(st.Q) ? 'Q = ' + f2(v, st.Q) : 'the plasma ignites (self-heated)'}**.\nMinimum ignition triple product in this model: $${v.sci(tripleNeeded(tmin), 3)}$ keV s m$^{-3}$ at $T\\approx${f1(v, tmin)}$ keV (Lawson-criterion references give about $3\\times10^{21}$ near 14 keV).`;
        });
      },
    },
  ],
};
