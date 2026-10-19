import {bromineChain,branchingPopulation,branchingLimits} from './verification-models.shared.js';
// Chemical Kinetics — Chapter 4: Chains, explosions and polymerization (items 4.10–4.13)
import { clamp, ode, logspace, nz } from './ch04.shared.js';

export default {
  collection: 'kin',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Model', name: 'Chain reactions: H₂ + Br₂',
      statement: String.raw`The reaction $\mathrm H_2+\mathrm{Br}_2\to2\,\mathrm{HBr}$ does not follow its stoichiometry. Its rate is
$$\frac{d[\mathrm{HBr}]}{dt}=\frac{2k_2\sqrt{k_1/k_5}\;[\mathrm H_2][\mathrm{Br}_2]^{1/2}}{1+k'\,[\mathrm{HBr}]/[\mathrm{Br}_2]},\qquad k'=\frac{k_4}{k_3},$$
half order in bromine and *inhibited* by the product. It follows from a radical chain with
$$\begin{aligned}&\text{initiation}&\mathrm{Br}_2+\mathrm M&\xrightarrow{k_1}2\,\mathrm{Br}+\mathrm M\\&\text{propagation}&\mathrm{Br}+\mathrm H_2&\xrightarrow{k_2}\mathrm{HBr}+\mathrm H,\qquad \mathrm H+\mathrm{Br}_2\xrightarrow{k_3}\mathrm{HBr}+\mathrm{Br}\\&\text{inhibition}&\mathrm H+\mathrm{HBr}&\xrightarrow{k_4}\mathrm H_2+\mathrm{Br}\\&\text{termination}&2\,\mathrm{Br}+\mathrm M&\xrightarrow{k_5}\mathrm{Br}_2+\mathrm M\end{aligned}$$
by applying the steady-state approximation (4.3) to the two radicals: initiation balances termination, $[\mathrm{Br}]=(k_1[\mathrm{Br}_2]/k_5)^{1/2}$, and $[\mathrm H]=k_2[\mathrm{Br}][\mathrm H_2]/(k_3[\mathrm{Br}_2]+k_4[\mathrm{HBr}])$. One initiation event triggers many propagation cycles (a *kinetic chain length* whose value depends on initiation and termination rates).`,
      idea: String.raw`The radicals are the intermediates of 4.3: they are made slowly (initiation), destroyed in pairs (termination) and recycled many times in between (the propagation pair, which consumes no radicals). Balancing the two sources and sinks of Br gives its square-root dependence, and the product of that with the propagation step gives the half-order law. HBr slows the reaction because H atoms that meet HBr instead of Br₂ regenerate H₂ and no HBr is made. Bodenstein and Lind (1906–07) found the empirical rate law; Christiansen, Herzfeld and Polanyi independently proposed the chain mechanism in 1919–20; the analogous H₂ + Cl₂ and H₂ + I₂ reactions behave differently.`,
      caption: String.raw`The full mechanism integrated numerically (rate constants are round illustrative numbers in arbitrary units, not measured values; $k_3\gg k_2$, as in the real system). Left: reactants and product. Middle: radical concentrations (note the scale: about a hundredth of the reactants) against their steady-state values (dashed). Right: the numerical rate of HBr formation against the half-order formula; after the fast radical transient the rate is close to the steady-state approximation; equality is an approximation, not an exact identity along a changing batch trajectory. Add HBr at the start to inhibit the reaction, and raise $k_4/k_3$ to strengthen the inhibition.`,
      deps: ['kin-4.3'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['chain reactions', 'radicals'],
      credit: 'Bodenstein & Lind, 1906–07 (rate law); Christiansen, Herzfeld & Polanyi, 1919–20 (mechanism)',
      verify: true,
      scope: String.raw`Valid in the early part of the reaction at moderate temperature, ignoring the reverse of the propagation step $\mathrm H+\mathrm{HBr}$ beyond $k_4$ and wall effects; rate constants here are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chain_reaction#Chemical_chain_reactions' },
      viz(v) {
        const k4r = v.slider('$k_4/k_3$', 0.01, 3, 0.1, { log: true, sig: 2 });
        const hb0 = v.slider('initial [HBr]', 0, 2, 0, { step: 0.05 });
        const b20 = v.slider('initial [Br₂]', 0.1, 2, 1.5, { step: 0.05 });
        const tS = v.slider('time $t$', 0, 20, 8, { step: 0.1 });
        const K1 = 1, K2 = 10, K3 = 200, K5 = 1e4;
        const a = v.stage({ x: [0, 20], y: [0, 2.1], axes: 'box', gutter: true, height: 300, xlabel: 'time', ylabel: 'concentration', title: 'stable species', weight: 1 });
        const b = v.stage({ x: [0, 20], y: [0, 0.02], axes: 'box', gutter: true, height: 300, xlabel: 'time', ylabel: 'concentration', title: 'radicals (full) and steady state', weight: 1 });
        const c = v.stage({ x: [0, 20], y: [0, 0.3], axes: 'box', gutter: true, height: 300, xlabel: 'time', ylabel: 'd[HBr]/dt', title: 'rate of HBr formation', weight: 1 });
        let info = {};
        v.render(() => {
          const K4 = K3 * k4r.value, T = 20;
          const {field:F,BrSS,HSS,rate} = bromineChain(k4r.value);
          const sol = ode(F, [1, b20.value, hb0.value, 0, 0], T, { kmax: 700, n: 4000 });
          const ts = Array.from({ length: 301 }, (_, i) => T * i / 300), ys = ts.map((t) => sol.at(t));
          a.setView([0,T],[0,1.12*Math.max(2.1,...ys.flatMap(y=>y.slice(0,3)))]);
          b.setView([0,T],[0,1.12*Math.max(.02,...ys.flatMap(y=>[y[3],20*y[4],BrSS(y),20*HSS(y)]))]);
          const cols = ['blue', 'orange', 'green'];
          [0, 1, 2].forEach((j) => a.path(ts.map((t, i) => [t, ys[i][j]]), { color: cols[j], width: 2.4 }));
          b.path(ts.map((t, i) => [t, ys[i][3]]), { color: 'purple', width: 2.4 });
          b.path(ts.map((t, i) => [t, ys[i][4] * 20]), { color: 'teal', width: 2.4 });
          b.path(ts.map((t, i) => [t, BrSS(ys[i])]), { color: 'purple', width: 1.5, dash: true });
          b.path(ts.map((t, i) => [t, HSS(ys[i]) * 20]), { color: 'teal', width: 1.5, dash: true });
          const num = (y) => { const [H2, , HBr, Br, H] = y; return K2 * Br * H2 + K3 * H * y[1] - K4 * H * HBr; };
          c.path(ts.map((t, i) => [t, num(ys[i])]), { color: 'accent', width: 2.6 });
          c.path(ts.map((t, i) => [t, rate(ys[i])]), { color: 'orange', width: 1.8, dash: true });
          const ymax = Math.max(0.02, ...ts.map((t, i) => num(ys[i])), ...ts.map((t, i) => rate(ys[i]))) * 1.1;
          c.setView([0, T], [0, ymax]);
          [a, b, c].forEach((s) => s.vline(tS.value, { color: 'muted', dash: true }));
          const y = sol.at(tS.value);
          info = { y, num: num(y), form: rate(y), Br: y[3], BrSS: BrSS(y), H: y[4], HSS: HSS(y), t: tS.value };
        });
        v.legend([['blue', 'H₂'], ['orange', 'Br₂'], ['green', 'HBr'], ['purple', 'Br (×1)'], ['teal', 'H (×20)'], ['accent', 'rate, full mechanism'], ['orange', 'half-order formula', { dash: true }]]);
        v.readout(() => `At $t=${v.fix(info.t, 1)}$: [Br] $=${v.sci(info.Br, 3)}$ (steady state $${v.sci(info.BrSS, 3)}$), [H] $=${v.sci(info.H, 3)}$ (steady state $${v.sci(info.HSS, 3)}$).\nRate from the full mechanism $${v.fix(info.num, 4)}$ against the formula $2k_2\\sqrt{k_1/k_5}\\,[\\mathrm H_2][\\mathrm{Br}_2]^{1/2}/(1+k'[\\mathrm{HBr}]/[\\mathrm{Br}_2])=${v.fix(info.form, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Phenomenon', name: 'Branching chains and explosion limits',
      statement: String.raw`In a chain with **branching**, one radical produces more than one radical. For the radical balance $dn/dt=\nu+(\varphi-g)\,n$, with initiation rate $\nu$, branching rate constant $\varphi$ and termination rate constant $g$, the radical number is
$$n(t)=\frac{\nu}{\varphi-g}\Bigl(e^{(\varphi-g)t}-1\Bigr):$$
it levels off at $\nu/(g-\varphi)$ when $\varphi<g$ (a slow, steady reaction) but grows exponentially in this constant-fuel linearization when $\varphi>g$: an isothermal chain instability. It predicts the onset, not unbounded radical creation in a finite vessel. At equality the continuous limit is n(t)=νt, for n(0)=0. In $\mathrm H_2/\mathrm O_2$, branching is $\mathrm H+\mathrm O_2\to\mathrm{OH}+\mathrm O$ followed by $\mathrm O+\mathrm H_2\to\mathrm{OH}+\mathrm H$ and $\mathrm{OH}+\mathrm H_2\to\mathrm{H_2O}+\mathrm H$ (net: one H becomes three), and termination happens at the vessel wall (efficient at low pressure: *first limit*) and by $\mathrm H+\mathrm O_2+\mathrm M\to\mathrm{HO_2}+\mathrm M$ (efficient at high pressure: *second limit*). Branching grows with pressure like $p$, wall termination falls like $1/p$ and three-body termination grows like $p^2$, so the explosive region in the pressure–temperature plane is a peninsula bounded below by $p_1(T)$ and above by $p_2(T)$ and closed below a minimum temperature. At still higher pressure a third limit, thermal and involving $\mathrm{HO_2}$ and $\mathrm{H_2O_2}$ chemistry, reopens the explosion; it is not in this model.`,
      idea: String.raw`Treat the radical pool as the single intermediate of a chain. If branching outruns termination, the linear equation for $n$ has a positive exponent and the population explodes; when termination wins, $n$ is bounded and the steady-state approximation (4.3) applies. The limits are the curves where the exponent $\lambda=\varphi-g$ changes sign: here $\lambda(p,T)=\kappa(T)\,p-\tau p^2-a/p$ with $\kappa$ Arrhenius (the branching step has a barrier of tens of kJ/mol), so the explosion region is where the cubic $\tau p^3-\kappa p^2+a=0$ has two positive roots. That the explosion is *isothermal* (a pure chain effect) and appears as a sharp threshold in pressure was the key observation of Semenov's and Hinshelwood's chain theories of combustion.`,
      caption: String.raw`Drag the point across the pressure–temperature map (log pressure; shaded: $\lambda>0$, explosive). Right: the radical number $n(t)$ at that point, on a log scale: asymptotic exponential growth inside the peninsula, a plateau outside it; the initiation term curves the early trace. Strengthen wall termination (smaller vessel, poorer surface) and the first limit rises; increase the third-body efficiency and the second limit falls. The rate constants are chosen to give a peninsula with the right topology near 800 K; the pressures (in Torr-like model units) are not measured limits.`,
      deps: ['kin-4.10', 'ode-1.4'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['explosion limits', 'chain branching'],
      credit: 'Hinshelwood & Thompson (1920s, H₂/O₂ kinetics); Semenov, chain theory of combustion (1930s)',
      verify: true,
      scope: String.raw`Isothermal chain-branching model with three terms (branching, wall termination, three-body termination); the third explosion limit, finite-reactant depletion, radical–radical saturation and heat release are not included. Exponential growth is an early-stage linearization, not an infinite supply of matter; the numbers are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Explosion_limits' },
      viz(v) {
        const aS = v.slider('wall termination $a$', 0.1, 10, 1, { log: true, sig: 2 });
        const tS = v.slider('third-body termination $\\tau$', 0.003, 0.03, 0.01, { log: true, sig: 2 });
        const EB = 70;   // kJ/mol, model branching barrier
        const kap = (T) => Math.exp(-(EB * 1000 / 8.314) * (1 / T - 1 / 800));
        const lam = (p, T) => kap(T) * p - tS.value * p * p - aS.value / p;
        const m = v.stage({ x: [550, 900], y: [0.1, 1000], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'temperature T (K)', ylabel: 'pressure p (model Torr)', title: 'explosion peninsula', weight: 1.2 });
        const n = v.stage({ x: [0, 1], y: [-2, 8], axes: 'box', gutter: true, height: 380, xlabel: 'time (s)', ylabel: 'log₁₀ n', title: 'radical number at the chosen point', weight: 1 });
        const h = m.handle(780, 30, { color: 'gold', r: 8, constrain: { x: [550, 900], y: [0.15, 900] } });
        let info = {};
        v.render(() => {
          const A = aS.value, tau = tS.value;
          m.raster((T, p) => (kap(T) * p - tau * p * p - A / p > 0 ? [214, 60, 60, 70] : null), { res: 3, key: `${A}|${tau}` });
          const lo = [], hi = [];
          for (let T=550;T<=900.1;T+=4){const roots=branchingLimits(kap(T),tau,A);if(roots){lo.push([T,roots.lower]);hi.push([T,roots.upper]);}}
          m.path(lo, { color: 'red', width: 2.4 }); m.path(hi, { color: 'red', width: 2.4 });
          const T0 = h.x, p0 = h.y, l = lam(p0, T0);
          const tEnd = Math.min(60, 12 / Math.max(Math.abs(l), 0.3));
          const last=branchingPopulation(l,tEnd);
          n.setView([0,tEnd],[Math.min(-2,Math.log10(last)-3),Math.max(2,Math.log10(last)+1)]);
          n.fn((t) => { const nn = branchingPopulation(l,t); return Math.log10(Math.max(1e-30, nn)); }, { color: l > 0 ? 'red' : 'green', width: 2.6, domain: [0, tEnd] });
          if (l < 0) n.hline(Math.log10(1 / -l), { color: 'green', dash: true });
          const limits=branchingLimits(kap(T0),tau,A);
          info={l,T0,p0,p1:limits?.lower??NaN,p2:limits?.upper??NaN,kap:kap(T0)};
        });
        v.legend([['red', 'explosion limits'], ['gold', 'state point', { dot: true }]]);
        v.readout(() => `$T=${v.fix(info.T0, 0)}$ K, $p=${nz(v, info.p0, 2)}$: net growth rate $\\lambda=\\varphi-g=\\kappa p-\\tau p^2-a/p=${nz(v, info.l, 2)}$ s$^{-1}$ — ${info.l > 0 ? `chain instability: asymptotic doubling time $${nz(v, Math.LN2 / info.l, 2)}$ s` : info.l === 0 ? 'critical: n=νt grows linearly' : `steady: $n\\to\\nu/|\\lambda|=${nz(v, 1 / -info.l, 2)}\\,\\nu$ (dashed)`}.\n${isFinite(info.p1) ? `At this temperature the first limit is $p_1\\approx${nz(v, info.p1, 2)}$ and the second $p_2\\approx${nz(v, info.p2, 2)}$ (model units).` : 'At this temperature there is no explosive pressure range (below the nose of the peninsula).'}`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Model', name: 'Thermal explosion (Semenov theory)',
      statement: String.raw`An exothermic reaction in a vessel with wall temperature $T_0$ generates heat at the Arrhenius rate $Q_+(T)=Q_*e^{-E/RT}$ (the reactant burn-out is neglected) and loses it to the wall at the rate $Q_-(T)=h\,(T-T_0)$, so $C\,dT/dt=Q_+-Q_-$. For low $T_0$ the curves cross twice: a stable steady state (slow reaction) and an unstable one. As $T_0$ rises the two merge in a tangency, at the **critical wall temperature** $T_{0,\rm cr}$, and above it no steady state exists, so the temperature runs away. At the tangency, $T_*-T_{0}\approx RT_{0}^2/E$ (a few tens of kelvin for typical activation energies), and the explosion criterion is the **Semenov parameter**
$$\psi=\frac{E\,Q_+(T_0)}{R\,T_0^{2}\,h}\ \ge\ \frac1e\approx0.37.$$`,
      idea: String.raw`Heat release is a rapidly rising exponential in $T$, heat loss a straight line, and a straight line can fail to intersect a convex exponential: the two states at which they cross are born in a saddle–node (fold) bifurcation. Linearizing the Arrhenius factor, $e^{-E/RT}\approx e^{-E/RT_0}e^{E(T-T_0)/RT_0^2}$, shows the tangency occurs at a temperature excess of $RT_0^2/E$ and gives the factor $e$ in the criterion. The explosion is thermal and delayed (an induction period near critical), not a chain-branching one (4.11); Semenov's 1928 paper developed the theory, and it is the basis of safe storage and transport of reactive materials.`,
      caption: String.raw`Left: heat generation (red curve) and heat loss (line) against the reaction temperature, with stable (green) and unstable (red ring) steady states marked. Right: the temperature of a vessel started at $T_0$, from the energy balance. Raise the wall temperature $T_0$ across the critical value (marked) and the crossings merge and vanish; the right panel then shows a runaway after an induction time. Increase the loss coefficient $h$ to move the critical temperature up.`,
      deps: ['kin-2.1', 'thermo-1.13'],
      refs: ['Steinfeld et al.'],
      tags: ['thermal explosion', 'bifurcation'],
      credit: 'Semenov, Z. Phys. 48, 571 (1928)',
      scope: String.raw`Well-stirred (spatially uniform) vessel, zeroth-order burn-out neglected; with temperature gradients the Frank-Kamenetskii theory gives a different critical constant. Heat capacity and units are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermal_runaway' },
      viz(v) {
        const T0S = v.slider('wall temperature $T_0$ (K)', 640, 780, 685, { step: 0.5 });
        const hS = v.slider('loss coefficient $h$', 0.4, 2.5, 1, { log: true, sig: 2 });
        const ES = v.slider('$E$ (kJ/mol)', 100, 250, 160, { step: 5 });
        const R = 8.314e-3, Tref = 725;
        const gen = (T, E) => 27.31 * Math.exp(-(E / R) * (1 / T - 1 / Tref));
        const C = 5;
        const L = v.stage({ x: [640, 800], y: [0, 100], axes: 'box', gutter: true, height: 340, xlabel: 'temperature T (K)', ylabel: 'heat rate (arb.)', title: 'heat generation and heat loss', weight: 1.2 });
        const Rt = v.stage({ x: [0, 150], y: [640, 1000], axes: 'box', gutter: true, height: 340, xlabel: 'time (arb.)', ylabel: 'T (K)', title: 'temperature of the vessel', weight: 1 });
        const roots = (T0, h, E) => {
          const r = []; let prev = null;
          for (let T = T0; T <= T0 + 400; T += 0.05) { const f = gen(T, E) - h * (T - T0); if (prev !== null && (prev > 0) !== (f > 0)) r.push(T); prev = f; }
          return r;
        };
        const crit = (h, E) => { let lo = 400, hi = 1000; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; (roots(mid, h, E).length > 0 ? (lo = mid) : (hi = mid)); } return lo; };
        let info = {};
        v.render(() => {
          const T0 = T0S.value, h = hS.value, E = ES.value, Tc = crit(h, E);
          const xr = [T0 - 10, T0 + 140], ymax = Math.max(40, h * 150);
          L.setView(xr, [0, ymax]);
          L.fn((T) => gen(T, E), { color: 'red', width: 2.6, domain: xr });
          L.line(T0, 0, xr[1], h * (xr[1] - T0), { color: 'ink', width: 2.2 });
          L.vline(T0, { color: 'muted', dash: true });
          const rs = roots(T0, h, E);
          rs.forEach((T, i) => L.dot(T, h * (T - T0), { r: 6, color: i % 2 === 0 ? 'green' : 'red', hollow: i % 2 === 1 }));
          const sol = ode((t, y) => [(gen(y[0], E) - h * (y[0] - T0)) / C], [T0], 150, { kmax: 2, n: 6000 });
          const pts = []; let tIgn = NaN;
          for (let i = 0; i <= 400; i++) { const t = 150 * i / 400, T = sol.at(t)[0]; if (T > T0 + 300) { if (isNaN(tIgn)) tIgn = t; break; } pts.push([t, T]); }
          if (pts.length && pts[pts.length - 1][0] < 149 && isNaN(tIgn)) tIgn = NaN;
          const Tm = Math.max(...pts.map((q) => q[1]));
          Rt.setView([0, 150], [T0 - 5, Math.max(T0 + 60, Math.min(T0 + 330, Tm + 20))]);
          Rt.path(pts, { color: tIgn >= 0 ? 'red' : 'green', width: 2.6 });
          Rt.hline(T0, { color: 'muted', dash: true });
          const psi = E * gen(T0, E) / (R * T0 * T0 * h);
          info = { Tc, psi, T0, tIgn, n: rs.length, rs, E };
        });
        v.legend([['red', 'heat generation'], ['ink', 'heat loss'], ['green', 'stable steady state', { dot: true }], ['red', 'unstable steady state', { dot: true, hollow: true }]]);
        v.readout(() => `Critical wall temperature $T_{0,\\rm cr}=${v.fix(info.Tc, 1)}$ K; now $T_0=${v.fix(info.T0, 1)}$ K — ${info.T0 > info.Tc ? `no steady state: ${isNaN(info.tIgn) ? 'runaway after a long induction period (beyond the plotted time)' : `runaway after $t\\approx${v.fix(info.tIgn, 1)}$`}` : `${info.n} steady states, the vessel settles at ${v.fix(info.rs[0], 1)} K`}.\nSemenov parameter $\\psi=E\\,Q_+(T_0)/(RT_0^2h)=${v.fix(info.psi, 3)}$ against $1/e=0.368$ (the criterion is approximate: it uses the linearized exponent); $RT_0^2/E=${v.fix(8.314e-3 * info.T0 ** 2 / info.E, 1)}$ K.`);
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13', kind: 'Model', name: 'Polymerization kinetics: chain growth and step growth',
      statement: String.raw`**Step growth** (condensation) joins any two molecules carrying complementary end groups. With $p$ the fraction of end groups reacted, the number-average degree of polymerization is the **Carothers equation**
$$\overline X_n=\frac{1}{1-p},\qquad\text{or}\qquad \overline X_n=\frac{1+r}{1+r-2rp}$$
for a stoichiometric ratio $r\le1$ of the two kinds of group: long chains appear only at very high conversion ($p=0.99$ gives $\overline X_n=100$). The most probable (Flory) distribution has weight fractions $w_n=n(1-p)^2p^{\,n-1}$ and $\overline X_w/\overline X_n=1+p\to2$. **Chain growth** (radical addition) makes each chain by initiation, rapid propagation and termination; the monomer is consumed gradually, but each chain is long from the start. With steady-state radicals the kinetic chain length is $\nu=k_p[\mathrm M]/(2\sqrt{fk_dk_t[\mathrm I]})$ (initiator with decomposition rate $k_d$, efficiency $f$, termination constant $k_t$), the polymer's degree of polymerization is $\nu$ (disproportionation) or $2\nu$ (combination) *independent of conversion*, and only the amount of polymer grows with $p$.`,
      idea: String.raw`In step growth every species reacts with every other, so molecules grow slowly together and the number of molecules falls as $N_0(1-p)$; the mean length is the ratio of monomer units to molecules, which gives Carothers' result, and the Flory distribution is the statement that a randomly chosen unit continues the chain with probability $p$. In chain growth, an active centre adds monomer with probability $k_p[\mathrm M]/(k_p[\mathrm M]+k_t[\mathrm R])$ each time, so chain length is geometric with mean $\nu$ set by the ratio of propagation to termination, which steady state fixes (4.3, 4.10); growth is fast relative to initiation, so at any moment the mixture is monomer plus fully grown chains. Carothers (1936) gave the equation; Flory (1936) the distribution.`,
      caption: String.raw`Left: mean chain length against conversion on a log scale for step growth (blue; use the stoichiometry slider $r$ to see the effect of an imbalance, which caps the length) and for chain growth (orange: the chains in the mixture; green: the average over all molecules including unreacted monomer). Right: the weight distribution of chain lengths at the chosen conversion for the two mechanisms on a logarithmic length axis (step growth: Flory, $r=1$; chain growth: geometric lengths of mean $\nu$ plus the monomer spike at $n=1$). Raise $p$ and watch the step-growth peak sweep out to long chains, while the chain-growth peak stays put.`,
      deps: ['kin-4.3', 'pma-3.26'],
      refs: ['Houston'],
      tags: ['polymerization', 'degree of polymerization'],
      credit: 'Carothers, Trans. Faraday Soc. 32, 39 (1936); Flory, J. Am. Chem. Soc. 58, 1877 (1936)',
      scope: String.raw`Idealized models: linear step growth with equal reactivity of all end groups and no cyclization; chain growth by steady-state radicals with termination by disproportionation and no transfer.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carothers_equation' },
      viz(v) {
        const pS = v.slider('conversion $p$', 0.01, 0.999, 0.9, { step: 0.001 });
        const nu = v.slider('kinetic chain length $\\nu$', 10, 5000, 200, { log: true, int: true, sig: 2 });
        const rS = v.slider('stoichiometric ratio $r$ (step growth)', 0.9, 1, 1, { step: 0.005 });
        const a = v.stage({ x: [0, 1], y: [1, 2000], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'conversion p', ylabel: 'mean chain length', title: 'degree of polymerization against conversion', weight: 1 });
        const b = v.stage({ x: [1, 1e4], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'chain length n', ylabel: 'weight fraction per ln n', title: 'weight distribution of chain lengths', weight: 1 });
        let info = {};
        v.render(() => {
          const p = pS.value, N = nu.value, r = rS.value;
          const xn = (q) => (1 + r) / (1 + r - 2 * r * q);
          a.fn(xn, { color: 'blue', width: 2.6, domain: [0, 0.999] });
          a.hline(N, { color: 'orange', width: 2.4, domain: [0, 1] });
          a.fn((q) => 1 / ((1 - q) + q / N), { color: 'green', width: 2.2, domain: [0, 0.999] });
          a.vline(p, { color: 'muted', dash: true });
          a.dot(p, xn(p), { r: 5.5, color: 'blue' }); a.dot(p, 1 / ((1 - p) + p / N), { r: 5.5, color: 'green' });
          // distributions on ln n
          const ns = Array.from({ length: 400 }, (_, i) => Math.pow(1e4, i / 399));
          const step = (n) => n * n * Math.pow(1 - p, 2) * Math.pow(p, n - 1);
          const am = 1 - 1 / N, chain = (n) => p * n * n * Math.pow(1 - am, 2) * Math.pow(am, n - 1);
          b.path(ns.map((n) => [n, step(n)]), { color: 'blue', width: 2.4 });
          b.path(ns.map((n) => [n, chain(n)]), { color: 'orange', width: 2.4 });
          b.dot(1, 1 - p, { r: 6, color: 'green' });
          b.text('monomer', 1.4, 1 - p, { size: 11, color: 'green', dx: 4 });
          info = { xs: 1 / (1 - p), xr: xn(p), xc: N, xall: 1 / ((1 - p) + p / N), p, pdi: 1 + p, N };
        });
        v.legend([['blue', 'step growth'], ['orange', 'chain growth: polymer chains'], ['green', 'chain growth: all molecules, incl. monomer']]);
        v.readout(() => `At $p=${v.fix(info.p, 3)}$: step growth $\\overline X_n=${v.fix(info.xr, 1)}$ ($r=1$: $1/(1-p)=${v.fix(info.xs, 1)}$; $\\overline X_w/\\overline X_n=1+p=${v.fix(info.pdi, 2)}$); chain growth: polymer chains have $\\overline X_n=\\nu=${info.N}$ at every conversion, the average over all molecules is $${v.fix(info.xall, 1)}$, and $${v.fix(100 * (1 - info.p), 1)}\\%$ of the material is still monomer.`);
      },
    },
  ],
};
