// Big History & Quantitative History — Chapter 3, part b: items 3.6–3.10
//
// Sources checked (Oct 2026):
//   3.6 Budyko, Tellus 21: 611 (1969); Sellers, J. Appl. Meteorol. 8: 392 (1969); North, Cahalan & Coakley, Rev. Geophys. 19: 91
//     (1981) (energy balance models: OLR = A + B T with A = 203.3 W/m2, B = 2.09 W/m2/K, diffusion D = 0.649 W/m2/K,
//     S(x) = 1 - 0.482 P2(x), albedo 0.32 ice free and 0.62 when T < -10 C; here smoothed over a few kelvin); Gough, Sol. Phys.
//     74: 21 (1981) (L/L0 = 1/(1 + 0.4 (1 - t/t0))); Myhre et al., GRL 25: 2715 (1998) (5.35 ln C); Kirschvink (1992); Hoffman et
//     al., Science 281: 1342 (1998); Caldeira & Kasting, Nature 359: 226 (1992) (about 0.12 bar CO2 to melt; not re-checked).
//   3.7 Dates are rounded from the ICS chart and the cited literature: base of the Cambrian 538.8 +- 0.6 Ma (Linnemann et al.,
//     2019), Cloudina about 550-543 Ma (Grotzinger et al., 1995), first trilobites about 521 Ma, Chengjiang about 518 Ma, Burgess
//     Shale about 508 Ma, Mistaken Point about 574 Ma (all checked only to the stated rounding). Trigger windows are broad
//     literature ranges (Marshall, Annu. Rev. Earth Planet. Sci. 34: 355, 2006) and drawn as such.
//   3.8 Raup & Sepkoski, Science 215: 1501 (1982); Barnosky et al., Nature 471: 51 (2011) for the commonly quoted species-loss
//     estimates (86, 75, 96, 80, 76%: recalled, not re-checked; other sources give different values and metrics); Kirchner &
//     Weil, Nature 404: 177 (2000) (recovery lag of the order of 10 Myr). The recovery curve is a logistic model.
//   3.9 Hildebrand et al., Geology 19: 867 (1991); Renne et al., Science 339: 684 (2013) (boundary 66.038 +- 0.049 Ma, impact and
//     boundary within 32 kyr); Morgan et al., Science 354: 878 (2016); Collins, Melosh & Marcus, Meteorit. Planet. Sci. 40: 817
//     (2005) (crater scaling constants recalled, flagged); Alvarez et al. (1980): enhancement 30, 160, 20 times at the three sites.
//   3.10 Alvarez, Alvarez, Asaro & Michel, Science 208: 1095 (1980), doi 10.1126/science.208.4448.1095. Abstract numbers only
//     (enhancements 30, 160 and 20, diameter 10 +- 4 km from four estimates, about 60 times the impactor mass thrown up). The
//     concentration profile is a labelled schematic, because the paper's table could not be fetched.

import { clamp, tridiag } from './ch03.shared.js';

// ── 3.6 helpers: Budyko–Sellers energy balance model on x = sin(latitude) in [0, 1] (one hemisphere) ──────────────────────
const EB = { n: 24, D: 0.649, A: 203.3, B: 2.09, Q0: 340.25, C: 10 };
const ebAlbedo = (T) => 0.32 + 0.3 * 0.5 * (1 - Math.tanh((T + 10) / 2));
const ebS = (x) => 1 - 0.482 * 0.5 * (3 * x * x - 1);
/** Advance temperatures T (length n) by `steps` implicit pseudo-time steps toward an attractor. */
function ebRelax(T, L, co2, steps = 60) {
  const { n, D, A, B, Q0, C } = EB, dx = 1 / n, dd = D / (dx * dx), Aeff = A - 5.35 * Math.log(co2);
  const e = (j) => j / n, a = [], b = [], c = [];
  for (let i = 0; i < n; i++) {
    const wl = i > 0 ? 1 - e(i) ** 2 : 0, wr = 1 - e(i + 1) ** 2;
    a.push(-dd * wl); c.push(-dd * wr); b.push(C + B + dd * (wl + wr));
  }
  let t = T.slice();
  for (let s = 0; s < steps; s++) {
    const d = t.map((Ti, i) => C * Ti + EB.Q0 * L * ebS((i + 0.5) / n) * (1 - ebAlbedo(Ti)) - Aeff);
    t = tridiag(a, b, c, d);
  }
  return t;
}
/** Ice-edge latitude in degrees: 90 if ice free, 0 if the equator is frozen. */
function iceEdge(T) {
  const n = T.length; if (T[0] < -10) return 0; if (T[n - 1] > -10) return 90;
  for (let i = 0; i < n - 1; i++) if (T[i] >= -10 && T[i + 1] < -10) { const u = (T[i] + 10) / (T[i] - T[i + 1]); const x = (i + 0.5 + u) / n; return (Math.asin(clamp(x, 0, 1)) * 180) / Math.PI; }
  return 90;
}
const ebMean = (T) => T.reduce((s, t) => s + t, 0) / T.length;
const sunL = (maAgo) => 1 / (1 + 0.4 * (1 - (4570 - maAgo) / 4570));
const CO2_SWEEP = Array.from({ length: 45 }, (_, i) => 10 ** (-0.5 + (5 * i) / 44));
function ebSweeps(L) {
  const down = [], up = [];
  let T = Array(EB.n).fill(30); T = ebRelax(T, L, 30000, 200);
  for (let i = CO2_SWEEP.length - 1; i >= 0; i--) { T = ebRelax(T, L, CO2_SWEEP[i], 40); down.push([CO2_SWEEP[i], iceEdge(T)]); }
  T = Array(EB.n).fill(-45); T = ebRelax(T, L, 0.3, 200);
  for (let i = 0; i < CO2_SWEEP.length; i++) { T = ebRelax(T, L, CO2_SWEEP[i], 40); up.push([CO2_SWEEP[i], iceEdge(T)]); }
  return { down, up };
}

// ── 3.8 helpers: logistic diversity with kill pulses ─────────────────────────────────────────────────────────────────────
const BIG5 = [
  { name: 'End-Ordovician', t: 445, f: 0.86, col: 'purple' },
  { name: 'Late Devonian', t: 372, f: 0.75, col: 'teal' },
  { name: 'End-Permian', t: 252, f: 0.96, col: 'red' },
  { name: 'End-Triassic', t: 201, f: 0.8, col: 'orange' },
  { name: 'End-Cretaceous', t: 66, f: 0.76, col: 'pink' },
];
const logit = (p) => Math.log(p / (1 - p));

// ── 3.9 helpers: impact scaling (Collins, Melosh & Marcus 2005, SI units) ─────────────────────────────────────────────────
const G_EARTH = 9.81;
function crater(Lkm, vkms, thetaDeg, rhoI, rhoT = 2500) {
  const L = Lkm * 1e3, vi = vkms * 1e3, s = Math.sin((thetaDeg * Math.PI) / 180);
  const Dtc = 1.161 * (rhoI / rhoT) ** (1 / 3) * L ** 0.78 * vi ** 0.44 * G_EARTH ** (-0.22) * s ** (1 / 3); // m
  const Dfin = Dtc > 2560 ? (1.17 * Dtc ** 1.13) / 3200 ** 0.13 : 1.25 * Dtc;
  return { Dtc: Dtc / 1e3, D: Dfin / 1e3 };
}
const impactorMass = (Lkm, rho) => (Math.PI / 6) * (Lkm * 1e3) ** 3 * rho; // kg
const MT = 4.184e15, EARTH_AREA = 5.1e14;

export default {
  collection: 'bighist',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Hypothesis',
      name: 'Snowball Earth',
      statement: String.raw`The **Snowball Earth** hypothesis (Kirschvink, 1992; Hoffman and others, 1998) holds that in the Cryogenian period (about $720$–$635$ million years ago) glaciers reached sea level in the tropics and the oceans were largely or wholly covered by ice, twice, and perhaps earlier in the Palaeoproterozoic. The evidence is glacial deposits (diamictites, dropstones) that palaeomagnetism places at low latitude, capped by carbonate rocks that suggest a hot, CO$_2$-rich aftermath, and banded iron formations returning in the middle of the ice ages. A variant, the “slushball”, keeps a strip of open water at the equator.

The mechanism proposed is the **ice–albedo feedback**: ice reflects sunlight, so cooling spreads ice, which cools further. Below a critical solar input or CO$_2$ level, a planet can run away to a frozen state, and escape requires an enormous CO$_2$ greenhouse accumulated from volcanoes over millions of years.`,
      idea: String.raw`Balance incoming and outgoing energy at each latitude $x=\sin\phi$: absorbed sunlight $Q\,S(x)\,(1-\alpha(T))$ equals outgoing infrared $A+BT$ plus transport by diffusion $D\,\partial_x\big((1-x^2)\partial_xT\big)$ (Budyko and Sellers, 1969). The albedo $\alpha$ jumps from about $0.3$ to $0.6$ where $T$ is below about $-10\,{}^{\circ}\mathrm{C}$. Because $\alpha$ depends on $T$, the same sunlight can support two climates, a warm one with polar ice and a frozen one, and the ice line is unstable once it passes about $30^\circ$: it runs to the equator. The Sun was about 6% fainter 700 Ma ago ($L\approx 1/(1+0.4(1-t/t_0))$), so only a modest fall in CO$_2$ was needed. To thaw the frozen state, the albedo must be overcome by a large greenhouse forcing; full radiative models give a much higher threshold than the simple logarithmic CO$_2$ law used below.`,
      caption: String.raw`A one-dimensional energy balance model (Budyko–Sellers), run live. Left: temperature against latitude and the ice cap; right: the ice-line against CO$_2$ for the Sun's brightness at the time you choose: a **cooling** sweep (blue) and a **warming** sweep (red) follow different branches, the hysteresis loop. Lower the CO$_2$ until the ice reaches the equator, then raise it to thaw it. The dot is your current state; the buttons restart from a warm or a frozen planet.`,
      deps: ['bighist-3.4'],
      see: ['bighist-3.7', 'bighist-3.4'],
      refs: ['Christian'],
      credit: 'Budyko and Sellers, 1969 (model); Kirschvink, 1992; Hoffman et al., 1998',
      tags: ['climate', 'ice–albedo feedback'],
      scope: String.raw`A zero-ocean, one-layer model: it shows the feedback and its hysteresis, not the thresholds of the real Cryogenian. The CO$_2$ forcing is the small-change logarithmic law extrapolated; the real melt threshold in radiative-transfer studies is of order 0.1 bar (Caldeira and Kasting, 1992).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Snowball_Earth', doi: 'https://doi.org/10.1126/science.281.5381.1342' },
      verify: true,
      viz(v) {
        const age = v.slider('time (Ma ago)', 0, 1000, 700, { step: 10, int: true });
        const co2 = v.slider('CO₂ (× pre-industrial)', 0.3, 30000, 1, { log: true, sig: 3 });
        const T0 = () => { let T = Array(EB.n).fill(25); return ebRelax(T, sunL(age.value), co2.value, 150); };
        let T = ebRelax(Array(EB.n).fill(25), sunL(0), 1, 200);
        v.button('start warm', () => { T = Array(EB.n).fill(25); });
        v.button('start frozen', () => { T = Array(EB.n).fill(-45); });
        const P = v.stage({ x: [0, 90], y: [-60, 40], axes: 'box', gutter: true, height: 320, xlabel: 'latitude (°)', ylabel: 'temperature (°C)', title: 'temperature against latitude' });
        const H = v.stage({ x: [0.3, 30000], y: [-3, 93], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'CO₂ (× pre-industrial)', ylabel: 'ice-edge latitude (°)', title: 'hysteresis: ice line against CO₂' });
        let sweepKey = null, sweeps = null;
        v.render(() => {
          const L = sunL(age.value);
          for (let k = 0; k < 3; k++) T = ebRelax(T, L, co2.value, 60);
          const edge = iceEdge(T), mean = ebMean(T);
          if (sweepKey !== Math.round(L * 1000)) { sweepKey = Math.round(L * 1000); sweeps = ebSweeps(L); }
          P.vband(edge, 90, { color: 'blue', alpha: 0.12, edges: false });
          P.hline(-10, { color: 'muted', width: 1, dash: [4, 3] }); P.text('−10 °C', 88, -8, { size: 10, color: 'muted', align: 'right' });
          const pts = T.map((t, i) => [(Math.asin((i + 0.5) / EB.n) * 180) / Math.PI, t]);
          P.path([[0, T[0]], ...pts], { color: 'accent', width: 2.6 });
          P.text(edge >= 89.9 ? 'ice free' : edge <= 0.1 ? 'snowball' : `ice from ${v.fix(edge, 0)}°`, 88, 34, { size: 11, color: 'blue', align: 'right' });
          H.path(sweeps.down, { color: 'blue', width: 2.2 });
          H.path(sweeps.up, { color: 'red', width: 2.2 });
          H.dot(co2.value, edge, { r: 7, color: 'gold' });
          H.vline(1, { color: 'faint', width: 1, dash: [2, 3] });
          v.legend([['blue', 'cooling sweep (from warm)'], ['red', 'warming sweep (from frozen)'], ['gold', 'your state', { dot: true }]]);
        });
        v.readout(() => {
          const L = sunL(age.value), edge = iceEdge(T);
          const dn = sweeps ? sweeps.down.find((p) => p[1] <= 0.5) : null, up = sweeps ? sweeps.up.find((p) => p[1] > 0.5) : null;
          return `Sun at **${v.fix(100 * L, 1)}%** of today's output; global mean ${v.fix(ebMean(T), 1)} °C; ice edge ${edge >= 89.9 ? 'none' : edge <= 0.1 ? '0° (frozen to the equator)' : v.fix(edge, 0) + '°'}.\nThis model freezes completely when CO₂ falls below ≈ ${dn ? v.fix(dn[0], 1) + '×' : 'the range shown'} and thaws only when it exceeds ≈ ${up ? v.fix(up[0], 0) + '×' : 'the range shown (> 30,000×)'} (log forcing, extrapolated; Caldeira & Kasting, 1992: about 0.12 bar).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Event',
      name: 'The Cambrian explosion',
      statement: String.raw`In the geological moment between about $539$ and $515$ million years ago the fossil record shows the first appearance of most of the major animal body plans, with mineralised skeletons, eyes, shells, burrowing and complex food webs; the soft-bodied Ediacaran biota that preceded it (about $574$–$539$ Ma) were mostly different. The *explosion* is fast on geological scales (a few tens of millions of years) but not instantaneous, and molecular clocks suggest that the animal lineages themselves began to diverge much earlier, perhaps in the Cryogenian, so part of the “explosion” is the first fossilisation of existing groups.

Proposed triggers, which are not exclusive: a rise in oxygen, the evolution of predation and an arms race, the origin of developmental gene networks, and the changes in ocean chemistry after Snowball Earth. None is accepted as the cause.`,
      idea: String.raw`An abrupt change in a record does not need an abrupt cause. If the growth of diversity is switched on by a condition that is slowly approached, such as oxygen passing the level needed for large, active animals, or predators arriving so that skeletons pay off, the response can look like a step: diversity grows exponentially, then saturates. The toy model below makes this explicit with a gate that opens over a chosen interval. The dated picture on the left shows how the candidate triggers line up with the rocks. Fossil preservation, first appearances in particular places, and the dating of boundaries make the observed timing uncertain.`,
      caption: String.raw`Left: dated fossil events (Ma, with the Cambrian time scale running left to right) and, with the toggles, the windows in which the proposed triggers are thought to have operated (broad literature ranges). Right: a toy model, not data: a diversity that grows logistically once a gate opens at the date you choose, over the width you choose. Narrow the gate or raise the growth rate and the rise sharpens, but a slow gate gives a gradual rise.`,
      deps: ['bighist-3.5'],
      see: ['bighist-3.4', 'bighist-3.6', 'bighist-3.8'],
      refs: ['Christian'],
      credit: 'recognised from the 19th century (Darwin’s “Origin of Species” puzzle); explored by Marshall, 2006, and many others',
      tags: ['animals', 'diversification'],
      scope: String.raw`The toy model has one rate and one gate; it illustrates how a slow condition can produce a sudden-looking rise, not what happened.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cambrian_explosion' },
      verify: true,
      viz(v) {
        const tg = [
          v.toggle('oxygenation (800–540 Ma)', true), v.toggle('predation and arms race (550–500 Ma)', false), v.toggle('gene toolkit (850–600 Ma)', false),
        ];
        const tauS = v.slider('gate opens (Ma ago)', 500, 580, 540, { step: 1 });
        const wS = v.slider('gate width (Myr)', 2, 60, 12, { step: 1 });
        const rS = v.slider('growth rate (per Myr)', 0.05, 0.6, 0.3, { step: 0.01 });
        const A = v.stage({ x: [-600, -495], y: [-0.8, 10.5], axes: false, height: 330, title: 'fossil events and proposed trigger windows' });
        const B = v.stage({ x: [-600, -495], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'time (Ma ago, negative)', ylabel: 'diversity / saturation', title: 'toy model: a gate switches growth on' });
        const ev = [[-574, 'Mistaken Point', 6.6], [-546, 'Cloudina', 8.2], [-538.8, 'base of the Cambrian', 9.4], [-521, 'trilobites', 6.6], [-518, 'Chengjiang', 8.2], [-508, 'Burgess Shale', 9.4]];
        const win = [[-800, -540, 'teal', 'oxygenation'], [-550, -500, 'orange', 'predation'], [-850, -600, 'purple', 'gene toolkit']];
        v.render(() => {
          A.line(-600, 1.2, -495, 1.2, { color: 'muted', width: 1.2 });
          for (let t = -580; t <= -500; t += 20) { A.line(t, 1.0, t, 1.4, { color: 'muted', width: 1 }); A.text(String(-t), t, 0.6, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); }
          A.text('Ma ago', -497, -0.4, { size: 10.5, color: 'muted', align: 'right', baseline: 'middle' });
          A.vband(-571, -539, { color: 'faint', alpha: 0.1, edges: false }); A.text('Ediacaran biota', -569, 2.3, { size: 10.5, color: 'muted', align: 'left' });
          A.vband(-538.8, -515, { color: 'pink', alpha: 0.15, edges: false }); A.text('the “explosion”', -536.6, 2.3, { size: 10.5, color: 'pink', align: 'left' });
          win.forEach(([a, b, col, lab], k) => { if (!tg[k].value) return; const y = 3.2 + 0.7 * k; A.rect(Math.max(a, -600), y - 0.25, Math.min(b, -495), y + 0.25, { fill: col, fillAlpha: 0.35, color: col, width: 1.2, radius: 3 }); A.text(lab + (a < -600 ? ' ← earlier' : ''), Math.max(a, -600) + 1.5, y, { size: 10, color: 'ink', align: 'left', baseline: 'middle' }); });
          for (const [t, lab, y] of ev) { A.line(t, 1.2, t, y - 0.3, { color: 'ink', width: 1, alpha: 0.5 }); A.dot(t, 1.2, { r: 4, color: 'ink' }); A.text(lab, t, y, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); }
          const tau = -tauS.value, w = wS.value, r = rS.value, dt = 0.25, pts = [], gp = [];
          let N = 1e-4;
          for (let t = -600; t <= -495; t += dt) {
            const g = clamp((t - (tau - w / 2)) / w, 0, 1), gate = g * g * (3 - 2 * g);
            N += dt * r * gate * N * (1 - N); pts.push([t, N]); gp.push([t, gate]);
          }
          B.path(gp, { color: 'orange', width: 1.5, dash: [4, 3], alpha: 0.8 });
          B.path(pts, { color: 'accent', width: 2.8 });
          B.vband(-538.8, -515, { color: 'pink', alpha: 0.12, edges: false });
          v.legend([['accent', 'diversity (model)'], ['orange', 'gate', { dash: true }], ['pink', 'the “explosion” interval']]);
        });
        v.readout(() => {
          const tau = -tauS.value, w = wS.value, r = rS.value, dt = 0.05; let N = 1e-4, t10 = null, t90 = null;
          for (let t = -600; t <= -495; t += dt) { const g = clamp((t - (tau - w / 2)) / w, 0, 1), gate = g * g * (3 - 2 * g); N += dt * r * gate * N * (1 - N); if (t10 === null && N > 0.1) t10 = t; if (t90 === null && N > 0.9) t90 = t; }
          const dur = t10 !== null && t90 !== null ? `${v.fix(t90 - t10, 1)} Myr from 10% to 90%` : 'no full rise in this window';
          return `Model: ${dur} (a logistic with no gate needs ln 81 / r = ${v.fix(Math.log(81) / r, 1)} Myr). Fossil record: base of the Cambrian 538.8 Ma, trilobites ≈ 521 Ma, Chengjiang ≈ 518 Ma.\nThe trigger windows are broad and uncertain; molecular clocks put animal origins well before the Cambrian.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Mass extinctions and recoveries',
      statement: String.raw`Raup and Sepkoski (1982) showed that extinction rates in the marine fossil record are not smooth: five episodes in the Phanerozoic stand out as the **Big Five** mass extinctions, at the ends of the Ordovician ($\approx 445$ Ma), Devonian ($\approx 372$ Ma), Permian ($\approx 252$ Ma), Triassic ($\approx 201$ Ma) and Cretaceous ($\approx 66$ Ma). Commonly quoted losses of *species* are roughly $86\%$, $75\%$, $96\%$, $80\%$ and $76\%$ respectively; estimates for genera are lower and vary between studies and methods. After each, diversity recovered, over several million years to tens of millions.

The causes differ: glaciation and sea-level fall (Ordovician), anoxia (Devonian), the Siberian Traps volcanism and its consequences (Permian, the largest), the Central Atlantic Magmatic Province (Triassic), and an asteroid impact with Deccan volcanism (Cretaceous, 3.9).`,
      idea: String.raw`If a clade of $N$ taxa grows logistically, $\dot N = rN(1-N/K)$, and a catastrophe removes a fraction $f$ of it, the time to regain $90\%$ of the old level is $\tfrac{1}{r}\,[\operatorname{logit}(0.9)-\operatorname{logit}((1-f)N_0)]$: it rises only logarithmically with the severity, so the worst event, with $96\%$ lost, needs about twice the time of one with $75\%$ lost. Recoveries in the fossil record are slower than a free exponential would allow (Kirchner and Weil, 2000, found delays of the order of 10 Myr), which suggests that rebuilding ecosystems, not just numbers, is the limit.`,
      caption: String.raw`A deliberately simple model: one stock of taxa with constant capacity, hit by five kills at the real dates. Drag the dip under each event to change the fraction lost, and change the growth rate $r$. The model reproduces the saw-tooth but not the long-term rise of real diversity (the capacity is held fixed). The kill fractions start at the commonly quoted species losses (sources vary).`,
      deps: ['bighist-3.7'],
      see: ['bighist-3.9'],
      refs: ['Christian'],
      credit: 'Raup & Sepkoski, 1982',
      tags: ['extinction', 'diversity'],
      scope: String.raw`Quoted losses depend on the taxonomic level, the data set and the method; the dates are rounded.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Extinction_event' },
      verify: true,
      viz(v) {
        const rS = v.slider('regrowth rate r (per Myr)', 0.1, 2, 0.5, { step: 0.01 });
        const s = v.stage({ x: [-541, 0], y: [0, 1.08], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'time (Ma ago, negative)', ylabel: 'diversity / capacity', title: 'logistic diversity with five kills (model)' });
        const f = BIG5.map((e) => e.f);
        const sim = (r, out) => {
          // returns pre-event levels, post-event levels and recovery times; fills a path if out given
          let N = 0.04, t = -541; const pre = [], post = [], rec = [];
          const grow = (N0, dtM) => 1 / (1 + (1 / N0 - 1) * Math.exp(-r * dtM));
          BIG5.forEach((e, i) => {
            const te = -e.t;
            if (out) for (let k = 1; k <= 24; k++) out.push([t + ((te - t) * k) / 24, grow(N, ((te - t) * k) / 24)]);
            N = grow(N, te - t); t = te; pre.push(N);
            if (out) out.push([te, N]);
            N *= 1 - f[i]; post.push(N); if (out) out.push([te, N]);
            rec.push((logit(0.9 * pre[i]) - logit(N)) / r);
          });
          if (out) for (let k = 1; k <= 24; k++) out.push([t + (-t * k) / 24, grow(N, (-t * k) / 24)]);
          return { pre, post, rec };
        };
        const hs = BIG5.map((e, i) => {
          const h = s.handle(-e.t, 0.1, { color: e.col, r: 7, constrain: 'y' });
          h.onDrag = () => { const { pre } = sim(rS.value); f[i] = clamp(1 - h.y / pre[i], 0.05, 0.995); v.invalidate(); };
          return h;
        });
        v.render(() => {
          const r = rS.value, path = [], { pre, post, rec } = sim(r, path);
          s.hline(1, { color: 'faint', width: 1, dash: [3, 3] });
          s.path(path, { color: 'accent', width: 2.6 });
          BIG5.forEach((e, i) => {
            s.vline(-e.t, { color: e.col, width: 1, dash: [3, 4], alpha: 0.6 });
            hs[i].set(-e.t, post[i]);
            s.text(`${e.name}`, -e.t + 4, 1.04, { size: 10.5, color: e.col, align: 'left' });
            s.text(`−${v.fix(100 * f[i], 0)}%`, -e.t + 4, Math.max(0.03, post[i] - 0.05), { size: 10.5, color: e.col, align: 'left' });
          });
        });
        v.readout(() => {
          const { rec } = sim(rS.value);
          return BIG5.map((e, i) => `${e.name} (${e.t} Ma): ${v.fix(100 * f[i], 0)}% lost, back to 90% in ${v.fix(rec[i], 1)} Myr`).join('\n') + '\nObserved recoveries are slower than free regrowth: lags of ~10 Myr (Kirchner & Weil 2000).';
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Event',
      name: 'The end-Cretaceous impact',
      statement: String.raw`About $66$ million years ago an asteroid several kilometres across struck the Yucatán peninsula at Chicxulub, Mexico, making a crater of roughly $180$–$200$ km diameter. Its fall coincides, to within the dating error (about $30{,}000$ years in the best radiometric work), with the Cretaceous–Palaeogene boundary and the extinction of the non-avian dinosaurs, ammonites and about three quarters of species. The boundary clay carries an iridium anomaly, shocked quartz, spherules and soot found worldwide, and the crater itself was recognised and drilled (Hildebrand and others, 1991; drilling of its peak ring in 2016).

The impact was not the only stress of the time (the Deccan Traps erupted around the same epoch), but it is the best-supported trigger of the mass extinction at the boundary.`,
      idea: String.raw`The kinetic energy of an impactor of diameter $L$, density $\rho$ and speed $v$ is $E=\tfrac12\cdot\tfrac{\pi}{6}\rho L^3v^2$: a $10$ km body at $20$ km/s carries about $3\times10^{23}$ J, roughly $10^{8}$ megatons of TNT. Laboratory-calibrated scaling laws give the size of the crater from the impactor's size, speed, angle and density (Collins, Melosh and Marcus, 2005): the transient crater is $D_{tc}\propto L^{0.78}v^{0.44}g^{-0.22}$, and craters above a few kilometres slump into a wider complex crater. Inverting the scaling for the observed $\sim$180 km crater gives an impactor of roughly 12–20 km for plausible speeds and angles, somewhat above the $10\pm4$ km that Alvarez and colleagues had inferred in 1980 from iridium alone (3.10); published estimates of the impactor lie in the range of about 10–15 km. The consequences, in the order they are inferred: blast and tsunamis, a thermal pulse from re-entering ejecta, and then dust, sulfate aerosols and soot cutting light for months to years.`,
      caption: String.raw`Impactor diameter against final crater diameter on log axes, for the speed, angle and density you set. The green band marks the Chicxulub crater (about 180–200 km); the orange band is Alvarez's 1980 estimate for the diameter, $10\pm4$ km. Drag the handle along the curve to choose the impactor, and see the energy and the diameter needed to match the crater. Left: the iridium enhancements found at three boundary sites.`,
      deps: ['bighist-3.8', 'bighist-1.3'],
      see: ['bighist-3.10'],
      refs: ['Christian'],
      credit: 'Alvarez et al., 1980 (hypothesis); Hildebrand et al., 1991 (crater)',
      tags: ['impact', 'extinction'],
      scope: String.raw`Crater scaling is calibrated to impacts up to a few hundred kilometres and carries factor-of-two uncertainty; the impactor's speed, angle and density are not measured.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chicxulub_crater' },
      verify: true,
      viz(v) {
        const vS = v.slider('impact speed (km/s)', 12, 35, 20, { step: 0.5 });
        const aS = v.slider('angle from horizontal (°)', 15, 90, 45, { step: 1 });
        const rS = v.slider('impactor density (kg/m³)', 1500, 3500, 2700, { step: 50 });
        const A = v.stage({ x: [0.3, 3.6], y: [1, 1000], ylog: true, axes: 'box', gutter: true, height: 300, xticks: [[1, 'Gubbio'], [2, 'Stevns Klint'], [3, 'Woodside Ck']], ylabel: 'iridium (× background)', title: 'iridium at the boundary (Alvarez et al. 1980)' });
        const B = v.stage({ x: [1, 30], y: [3, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'impactor diameter L (km)', ylabel: 'final crater diameter (km)', title: 'crater scaling (Collins–Melosh–Marcus)' });
        const h = B.handle(11, 100, { color: 'accent', r: 7, label: 'impactor' });
        h.onDrag = () => { h.x = clamp(h.x, 1, 30); };
        const need = () => { let lo = 1, hi = 60; for (let i = 0; i < 50; i++) { const m = Math.sqrt(lo * hi); if (crater(m, vS.value, aS.value, rS.value).D < 180) lo = m; else hi = m; } return lo; };
        v.render(() => {
          [[1, 30], [2, 160], [3, 20]].forEach(([x, y]) => A.rect(x - 0.3, 1, x + 0.3, y, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.2 }));
          [[1, 30], [2, 160], [3, 20]].forEach(([x, y]) => A.text(`${y}×`, x, y * 1.35, { size: 11.5, color: 'ink', align: 'center' }));
          A.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          const pts = []; for (let i = 0; i <= 80; i++) { const L = 10 ** (Math.log10(1) + (Math.log10(30) * i) / 80); pts.push([L, crater(L, vS.value, aS.value, rS.value).D]); }
          B.hband(180, 200, { color: 'green', alpha: 0.25 }); B.text('Chicxulub ≈ 180–200 km', 1.2, 230, { size: 10.5, color: 'green', align: 'left' });
          B.vband(6, 14, { color: 'orange', alpha: 0.16, edges: false }); B.text('Alvarez 1980: 10 ± 4 km', 6.2, 4.3, { size: 10.5, color: 'orange', align: 'left' });
          B.path(pts, { color: 'accent', width: 2.4 });
          h.set(h.x, crater(h.x, vS.value, aS.value, rS.value).D);
          const Ln = need(); B.dot(Ln, crater(Ln, vS.value, aS.value, rS.value).D, { r: 5, hollow: true, color: 'green' });
        });
        v.readout(() => {
          const L = h.x, m = impactorMass(L, rS.value), E = 0.5 * m * (vS.value * 1e3) ** 2, c = crater(L, vS.value, aS.value, rS.value);
          return `Impactor ${v.fix(L, 1)} km: mass ${m.toExponential(1)} kg, energy **${E.toExponential(1)} J = ${(E / MT).toExponential(1)} Mt TNT** (${(E / (6.3e13)).toExponential(1)} Hiroshima bombs), transient crater ${v.fix(c.Dtc, 0)} km, final crater **${v.fix(c.D, 0)} km**.\nA 180 km crater needs ${v.fix(need(), 1)} km at these settings. Boundary age 66.04 Ma, within 32 kyr of the impact (Renne et al. 2013).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Paper',
      name: 'Extraterrestrial Cause for the K–T Extinction',
      paper: { authors: 'Luis W. Alvarez, Walter Alvarez, Frank Asaro and Helen V. Michel', year: 1980, title: 'Extraterrestrial Cause for the Cretaceous-Tertiary Extinction', venue: 'Science 208 (4448): 1095–1108', doi: '10.1126/science.208.4448.1095' },
      introduces: ['bighist-3.9'],
      statement: String.raw`Alvarez and colleagues measured iridium, an element that is rare in the Earth's crust but common in meteorites, across the Cretaceous–Tertiary boundary in marine limestones at Gubbio (Italy), Stevns Klint (Denmark) and Woodside Creek (New Zealand). Each had a thin boundary clay, and each showed a sharp iridium enhancement over the background in the surrounding rock: about **30 times** at Gubbio, **160 times** in Denmark and **20 times** in New Zealand. They argued that the iridium came from outside the Earth, and from an impact rather than a nearby supernova (no plutonium-244 signature), and they estimated the object's diameter as about $10\pm4$ km from four independent lines. An impact would throw up about 60 times the impactor's mass as dust, darkening the planet, stopping photosynthesis and collapsing food chains.

**Scope.** The paper's claim was an extraterrestrial cause; the crater was found a decade later, and the relative roles of the impact and of volcanism are still discussed.`,
      idea: String.raw`In 1977 Walter Alvarez, a geologist, was studying the boundary clay at Gubbio; his father Luis, a physicist, suggested measuring a quantity that scales with the time the clay took to deposit. Iridium, which falls to Earth at a steady rate in cosmic dust, served as a clock, and they expected it to show that the clay was laid down slowly. Instead the iridium was far too high to be a slow rain of cosmic dust, so they proposed a single large impact. Before the paper, extinctions were attributed to climate, sea level or slow causes; the paper introduced the *impact hypothesis* (3.9), the use of iridium as a boundary marker, and the mass-extinction-by-dust-darkening scenario.`,
      caption: String.raw`Left: a concentration profile through the boundary clay for a site you choose, as a multiple of the local background. The peak heights (30, 160, 20) are the paper's; the thickness and tails are a schematic, since the paper's table is not reproduced here. Right: the impactor diameter sets the mass, the 60-fold dust load and what that dust would be as a uniform layer over the whole Earth; the orange band is the paper's $10\pm4$ km.`,
      deps: ['bighist-3.8'],
      see: ['bighist-3.9'],
      refs: [],
      credit: 'L. W. Alvarez, W. Alvarez, F. Asaro & H. V. Michel, 1980',
      tags: ['impact', 'extinction', 'iridium'],
      scope: String.raw`Iridium enhancement is evidence of an extraterrestrial component; the dust-darkening mechanism is a scenario that later work refined (soot, sulfate aerosols).`,
      links: { doi: 'https://doi.org/10.1126/science.208.4448.1095', wikipedia: 'https://en.wikipedia.org/wiki/Alvarez_hypothesis' },
      verify: true,
      viz(v) {
        const site = v.select('site', [{ value: '30', label: 'Gubbio, Italy' }, { value: '160', label: 'Stevns Klint, Denmark' }, { value: '20', label: 'Woodside Creek, N.Z.' }], '30');
        const LS = v.slider('impactor diameter (km)', 2, 20, 10, { step: 0.5 });
        const rhoS = v.slider('dust layer bulk density (kg/m³)', 1000, 2700, 2000, { step: 50 });
        const A = v.stage({ x: [-6, 6], y: [0.7, 300], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'height above the boundary clay (cm, schematic)', ylabel: 'iridium / background', title: 'iridium through the boundary (schematic profile)' });
        const B = v.stage({ x: [2, 20], y: [0.1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'impactor diameter (km)', ylabel: 'dust thickness if spread over Earth (mm)', title: 'the 60-fold dust load' });
        const h = B.handle(10, 1, { color: 'accent', r: 7 });
        const thick = (L) => (60 * impactorMass(L, 3000)) / (rhoS.value * EARTH_AREA) * 1000; // mm
        h.onDrag = () => { LS.set(clamp(h.x, 2, 20)); };
        v.render(() => {
          const F = Number(site.value);
          const pts = []; for (let i = 0; i <= 200; i++) { const z = -6 + (12 * i) / 200; const bump = (F - 1) * (Math.exp(-((z / 0.5) ** 2)) + 0.35 * Math.exp(-((z / 2.5) ** 2)) * (z > 0 ? 1 : 0.25)); pts.push([z, 1 + bump]); }
          A.vband(-0.5, 0.5, { color: 'orange', alpha: 0.18, edges: false }); A.text('boundary clay', 0, 0.85, { size: 10.5, color: 'orange', align: 'center' });
          A.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          A.path(pts, { color: 'accent', width: 2.6 });
          A.dot(0, F, { r: 5, color: 'gold', label: `${F}×`, labelPos: 'ne' });
          const T = []; for (let i = 0; i <= 60; i++) { const L = 2 * 10 ** ((Math.log10(10) * i) / 60); T.push([L, thick(L)]); }
          B.vband(6, 14, { color: 'orange', alpha: 0.18, edges: false }); B.text('paper: 10 ± 4 km', 6.2, 0.2, { size: 10.5, color: 'orange', align: 'left' });
          B.path(T, { color: 'accent', width: 2.4 });
          h.set(LS.value, thick(LS.value));
        });
        v.readout(() => {
          const L = LS.value, m = impactorMass(L, 3000), E = 0.5 * m * (20e3) ** 2;
          return `${v.fix(L, 1)} km body of density 3000 kg/m³: mass ${m.toExponential(1)} kg; 60 × that mass of dust is ${(60 * m).toExponential(1)} kg, a uniform layer **${thick(L) >= 10 ? v.fix(thick(L), 0) : v.fix(thick(L), 1)} mm** thick over the whole Earth (the boundary clay is about a centimetre, since not all of it is carried worldwide).\nEnergy at 20 km/s ≈ ${E.toExponential(1)} J. Peak enhancement at ${site.value === '30' ? 'Gubbio' : site.value === '160' ? 'Stevns Klint' : 'Woodside Creek'}: ${site.value}× (the paper); schematic shape.`;
        });
      },
    },
  ],
};
