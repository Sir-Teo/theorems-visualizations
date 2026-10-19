// Big History & Quantitative History — Chapter 3, part b: items 3.6–3.10
//
// Sources checked (Oct 2026):
//   3.6 Full North1981 manuscript (Eq22, original S2=-.477), Gough1981 p28 Eq1, Myhre1998 Table3,
//     Kirschvink1992, Hoffman1998 and Caldeira1992 including Box1 reviewed; hybrid parameters and finite sweeps labelled.
//   3.7 Full Matthews2020, Yang2018, Marshall2006 and Paterson2019 formulations reviewed; current ICS2026/06.
//     Drook574.17 differs from the Mistaken Point E surface565.00; Chengjiang518.03 is a maximum age.
//     Exact Cloudina representative placement still lacks the full original dating source. Trigger endpoints are chosen.
//   3.8 Full Raup/Sepkoski1982 and Kirchner/Weil2000 originals read; Barnosky2011 Table1 species-loss estimates
//     and causes checked separately from marine-family statistics. Current ICS2026/06 ages checked.
//   3.9 Collins/Melosh/Marcus2005 energy and crater-dimension derivations pp817–824 read in full;
//     Alvarez1980 complete published original read. Full Hildebrand1991, Renne2013, Morgan2016, Schulte2010 and Harvey2008
//     source comparisons complete; age difference5±27kyr at68%confidence, spatial indicator variation and modelled consequences explicit.
//   3.10 Complete published Alvarez/Alvarez/Asaro/Michel1980 pp1095–1108 read, tables/diameter estimates inspected.
//     30/160 are acid-insoluble-residue ratios, 20 is whole-rock; the profile is schematic. Excavated material60×,
//     assumed stratospheric fraction.22, original impactor density2200kg/m3; the display's3000 is explicitly chosen.

import { clamp, tridiag } from './ch03.shared.js';
import { logisticValue, logisticRecovery, iridiumSchematic } from './source-models.shared.js';

// ── 3.6 helpers: Budyko–Sellers energy balance model on x = sin(latitude) in [0, 1] (one hemisphere) ──────────────────────
const EB = { n: 24, D: 0.649, A: 203.3, B: 2.09, Q0: 340.25, C: 10 };
const ebAlbedo = (T) => 0.32 + 0.3 * 0.5 * (1 - Math.tanh((T + 10) / 2));
const ebS = (x) => 1 - 0.477 * 0.5 * (3 * x * x - 1);
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
const CO2_SWEEP = Array.from({ length: 45 }, (_, i) => 0.3 * 10 ** ((5 * i) / 44));
function ebSweeps(L) {
  const down = [], up = [];
  let T = Array(EB.n).fill(30); T = ebRelax(T, L, 30000, 200);
  for (let i = CO2_SWEEP.length - 1; i >= 0; i--) { T = ebRelax(T, L, CO2_SWEEP[i], 200); down.push([CO2_SWEEP[i], iceEdge(T)]); }
  T = Array(EB.n).fill(-45); T = ebRelax(T, L, 0.3, 200);
  for (let i = 0; i < CO2_SWEEP.length; i++) { T = ebRelax(T, L, CO2_SWEEP[i], 200); up.push([CO2_SWEEP[i], iceEdge(T)]); }
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

The mechanism proposed is the **ice–albedo feedback**: ice reflects sunlight, so cooling spreads ice, which cools further. Below a critical solar input or CO$_2$ level, a planet can run away to a frozen state, and volcanic CO$_2$ accumulation is a proposed escape mechanism, operating over millions of years.`,
      idea: String.raw`Balance incoming and outgoing energy at each latitude $x=\sin\phi$: absorbed sunlight $Q\,S(x)\,(1-\alpha(T))$ plus diffusive heat convergence $D\,\partial_x\big((1-x^2)\partial_xT\big)$ equals outgoing infrared $A+BT$ (Budyko and Sellers, 1969). The albedo $\alpha$ jumps from about $0.3$ to $0.6$ where $T$ is below about $-10\,{}^{\circ}\mathrm{C}$. Because $\alpha$ depends on $T$, the same sunlight can support two climates, a warm one with polar ice and a frozen one, and some parameter choices have no stable low-latitude ice line: advancing ice then runs to the equator. The often quoted $30^\circ$ threshold is model dependent. The Sun was about 6% fainter 700 Ma ago ($L\approx 1/(1+0.4(1-t/t_0))$), which makes freezing easier for a given greenhouse forcing. To thaw the frozen state, the albedo must be overcome by a large greenhouse forcing; Caldeira and Kasting’s more detailed model requires about $0.12$ bar CO$_2$ under the present Sun, with different behaviour under a fainter Sun. The simple logarithmic forcing below is an extrapolated illustration. The temperature-dependent albedo uses the ice feedback in {{climate-4.4}}; the diffusive extension is {{climate-5.1}}.`,
      caption: String.raw`A one-dimensional energy balance model (Budyko–Sellers), run live. Left: temperature against latitude and the ice cap; right: the ice-line against CO$_2$ for the Sun's brightness at the time you choose: sampled **cooling** (blue) and **warming** (red) sweeps follow different approximate attractor branches, the hysteresis loop. Lower the CO$_2$ until the ice reaches the equator, then raise it to thaw it. The dot is your current state; the buttons restart from a warm or a frozen planet.`,
      deps: ['bighist-3.4', 'climate-4.4', 'geol-3.11'],
      see: ['bighist-3.7', 'bighist-3.4'],
      refs: ['North, Cahalan & Coakley (1981), complete NASA manuscript, Eqs20–24, insolation and albedo sections: https://ntrs.nasa.gov/api/citations/19810008165/downloads/19810008165.pdf', 'Gough (1981), Solar Physics74:21–34, solar-luminosity approximation: https://articles.adsabs.harvard.edu/pdf/1981SoPh...74...21G', 'Myhre et al. (1998), Table3: https://sealevel.info/Myhre1998_98GL01908.pdf', 'Kirschvink (1992), complete original: https://courses.seas.harvard.edu/climate/eli/Courses/EPS281r/Sources/Snowball/kirschvink-1992.pdf', 'Hoffman et al. (1998), complete original: https://www.snowballearth.org/pdf/Hoffman_Science1998.pdf', 'Caldeira & Kasting (1992), full original including Box1, author copy: https://ciunit.org/publications/caldeira-1992-irreversible-glaciation.html'],
      credit: 'Budyko and Sellers, 1969 (model); Kirschvink, 1992; Hoffman et al., 1998',
      tags: ['climate', 'ice–albedo feedback'],
      scope: String.raw`An annual-mean latitude model with one surface temperature, parameterised heat transport and no separate ocean dynamics. North et al.’s $A=203.3$, $B=2.09$, $D=0.649$, and insolation coefficient $-0.477$ are combined with chosen modern $Q_0=340.25\,\mathrm{W\,m^{-2}}$, a 2 K smoothed albedo transition, and extrapolated Myhre logarithmic forcing. The luminosity approximation uses a chosen present solar age of 4.57 Gyr. The 24 equal-area cells and pseudo-time relaxation illustrate approximate attractors, not physical durations or Cryogenian thaw thresholds. Caldeira and Kasting’s $0.12$ bar estimate applies to the present Sun; their fainter-Sun analysis also discusses CO$_2$ clouds.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Snowball_Earth', doi: 'https://doi.org/10.1126/science.281.5381.1342' },
      viz(v) {
        const age = v.slider('time (Ma ago)', 0, 1000, 700, { step: 10, int: true });
        const co2 = v.slider('CO₂ (× pre-industrial)', 0.3, 30000, 1, { log: true, sig: 3 });
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
          const ymin = Math.min(-60, Math.floor(Math.min(...T) / 10) * 10 - 5), ymax = Math.max(40, Math.ceil(Math.max(...T) / 10) * 10 + 8);
          P.setView([0, 90], [ymin, ymax]);
          P.vband(edge, 90, { color: 'blue', alpha: 0.12, edges: false });
          P.hline(-10, { color: 'muted', width: 1, dash: [4, 3] }); P.text('−10 °C', 88, -8, { size: 10, color: 'muted', align: 'right' });
          const pts = T.map((t, i) => [(Math.asin((i + 0.5) / EB.n) * 180) / Math.PI, t]);
          P.path([[0, T[0]], ...pts], { color: 'accent', width: 2.6 });
          P.text(edge >= 89.9 ? 'ice free' : edge <= 0.1 ? 'snowball' : `ice from ${v.fix(edge, 0)}°`, 88, ymax - 6, { size: 11, color: 'blue', align: 'right' });
          H.path(sweeps.down, { color: 'blue', width: 2.2 });
          H.path(sweeps.up, { color: 'red', width: 2.2 });
          H.dot(co2.value, edge, { r: 7, color: 'gold' });
          H.vline(1, { color: 'faint', width: 1, dash: [2, 3] });
          v.legend([['blue', 'cooling sweep (from warm)'], ['red', 'warming sweep (from frozen)'], ['gold', 'your state', { dot: true }]]);
        });
        v.readout(() => {
          const L = sunL(age.value), edge = iceEdge(T);
          const dn = sweeps ? sweeps.down.find((p) => p[1] <= 0.5) : null, up = sweeps ? sweeps.up.find((p) => p[1] > 0.5) : null;
          return `Sun at **${v.fix(100 * L, 1)}%** of today's output; global mean ${v.fix(ebMean(T), 1)} °C; ice edge ${edge >= 89.9 ? 'none' : edge <= 0.1 ? '0° (frozen to the equator)' : v.fix(edge, 0) + '°'}.\nSampled model branches: frozen state first reached on cooling at ≈ ${dn ? v.fix(dn[0], 1) + '×' : 'below the range shown'} and thaw first reached on warming at ≈ ${up ? v.fix(up[0], 0) + '×' : 'the range shown (> 30,000×)'} (finite sweeps; log forcing extrapolated). These are model samples, not measured thresholds. Caldeira & Kasting’s ≈0.12 bar result uses the present Sun.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Event',
      name: 'The Cambrian explosion',
      statement: String.raw`In the geological moment between about $539$ and $515$ million years ago the fossil record shows the rapid appearance of many readily fossilised animal body plans, with mineralised skeletons, eyes, shells, burrowing and complex food webs; the soft-bodied Ediacaran biota that preceded it (about $574$–$539$ Ma) were mostly different. The *explosion* is fast on geological scales (a few tens of millions of years) but not instantaneous, and molecular clocks suggest that the animal lineages themselves began to diverge much earlier, perhaps in the Cryogenian, so part of the “explosion” is the first fossilisation of existing groups.

Proposed triggers, which are not exclusive: a rise in oxygen, the evolution of predation and an arms race, the origin of developmental gene networks, and the changes in ocean chemistry after Snowball Earth. Their relative roles remain debated; no single factor provides a complete explanation.`,
      idea: String.raw`An abrupt change in a record does not need an abrupt cause. If the growth of diversity is switched on by a condition that is slowly approached, such as oxygen passing the level needed for large, active animals, or predators arriving so that skeletons pay off, the response can look like a step: diversity grows exponentially, then saturates. The toy model below makes this explicit with a gate that opens over a chosen interval. The dated picture on the left distinguishes fossil observations from chosen illustrative trigger intervals. Fossil preservation, first appearances in particular places, and the dating of boundaries make the observed timing uncertain.`,
      caption: String.raw`Left: dated fossil events (Ma, with the Cambrian time scale running left to right) and, with the toggles, chosen illustrative windows for proposed triggers; their numerical endpoints are not estimates from data. Right: a toy model, not data: a diversity that grows logistically once a gate opens at the date you choose, over the width you choose. Narrow the gate or raise the growth rate and the rise sharpens, but a slow gate gives a gradual rise.`,
      deps: ['bighist-3.5'],
      see: ['bighist-3.4', 'bighist-3.6', 'bighist-3.8'],
      refs: ['Marshall (2006), complete review, pp355–370: https://cs.brynmawr.edu/Courses/cs361/spring2008/Readings/Marshall2006.pdf', 'ICS chart v2026/06: https://stratigraphy.org/ICSchart/ChronostratChart2026-06.pdf', 'Matthews et al. (2020), sections5–8, Drook and Mistaken Point horizons: https://api.repository.cam.ac.uk/server/api/core/bitstreams/7ec82bc9-e734-4e84-93ca-1e44355235f0/content', 'Yang et al. (2018), complete accepted manuscript, Results and Discussion: https://nora.nerc.ac.uk/id/eprint/521412/1/2018-JGS-Chuan%20Yang%20et%20al.pdf', 'Paterson et al. (2019), full article: https://pmc.ncbi.nlm.nih.gov/articles/PMC6410820/', 'Royal Ontario Museum, Burgess Shale dating explanation: https://burgess-shale.rom.on.ca/science/the-burgess-shale/geological-background/how-old-is-the-burgess-shale/'],
      credit: 'recognised from the 19th century (Darwin’s “Origin of Species” puzzle); explored by Marshall, 2006, and many others',
      tags: ['animals', 'diversification'],
      scope: String.raw`The toy model has one rate and one smooth gate; it illustrates a possible response, not reconstructed diversity. Its exact solution uses the integral of the gate in the logistic log-odds. The highlighted 539–515 Ma interval is a display convention, not a universally dated duration. Fossil points are rounded representatives: Drook is 574.17 ± 0.66 Ma, the Mistaken Point E surface is 565.00 ± 0.64 Ma, Chengjiang’s 518.03 ± 0.71 Ma zircon result is a maximum depositional age, and the Burgess Shale is shown near 508 Ma within the ROM’s 505–510 Ma estimate. Cloudina’s representative placement still needs its complete primary dating source.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cambrian_explosion' },
      verify: true,
      viz(v) {
        const tg = [
          v.toggle('oxygenation (chosen 800–540 Ma)', true), v.toggle('predation (chosen 550–500 Ma)', false), v.toggle('gene toolkit (chosen 850–600 Ma)', false),
        ];
        const tauS = v.slider('gate midpoint (Ma ago)', 500, 580, 540, { step: 1 });
        const wS = v.slider('gate width (Myr)', 2, 60, 12, { step: 1 });
        const rS = v.slider('growth rate (per Myr)', 0.05, 0.6, 0.3, { step: 0.01 });
        const A = v.stage({ x: [-600, -495], y: [-0.8, 10.5], axes: false, height: 330, title: 'fossil events and proposed trigger windows' });
        const B = v.stage({ x: [-600, -495], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'time (Ma ago, negative)', ylabel: 'diversity / saturation', title: 'toy model: a gate switches growth on' });
        const ev = [[-574.17, 'Drook fossils', 6.6], [-546, 'Cloudina', 8.2], [-538.8, 'base of the Cambrian', 9.4], [-521, 'trilobites', 6.6], [-518, 'Chengjiang (max age)', 8.2], [-508, 'Burgess Shale', 9.4]];
        const win = [[-800, -540, 'teal', 'oxygenation'], [-550, -500, 'orange', 'predation'], [-850, -600, 'purple', 'gene toolkit']];
        const curves = () => {
          const tau = -tauS.value, w = wS.value, r = rS.value, start = tau - w / 2;
          const gate = t => { const u = clamp((t - start) / w, 0, 1); return u * u * (3 - 2 * u); };
          const exposure = t => { const u = (t - start) / w; return u <= 0 ? 0 : u >= 1 ? t - tau : w * (u ** 3 - u ** 4 / 2); };
          const diversity = t => logisticValue(1e-4, r, exposure(t) - exposure(-600));
          const crossing = target => { if (diversity(-495) < target) return null; let lo = -600, hi = -495; for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (diversity(mid) < target) lo = mid; else hi = mid; } return (lo + hi) / 2; };
          return { gate, diversity, crossing };
        };
        v.render(() => {
          A.line(-600, 1.2, -495, 1.2, { color: 'muted', width: 1.2 });
          for (let t = -580; t <= -500; t += 20) { A.line(t, 1.0, t, 1.4, { color: 'muted', width: 1 }); A.text(String(-t), t, 0.6, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); }
          A.text('Ma ago', -497, -0.4, { size: 10.5, color: 'muted', align: 'right', baseline: 'middle' });
          A.vband(-574.17, -538.8, { color: 'faint', alpha: 0.1, edges: false }); A.text('selected Ediacaran fossils', -573, 2.3, { size: 10.5, color: 'muted', align: 'left' });
          A.vband(-538.8, -515, { color: 'pink', alpha: 0.15, edges: false }); A.text('the “explosion”', -536.6, 2.3, { size: 10.5, color: 'pink', align: 'left' });
          win.forEach(([a, b, col, lab], k) => { if (!tg[k].value) return; const y = 3.2 + 0.7 * k; if (b > -600) A.rect(Math.max(a, -600), y - 0.25, Math.min(b, -495), y + 0.25, { fill: col, fillAlpha: 0.35, color: col, width: 1.2, radius: 3 }); A.text((b <= -600 ? '← ' : '') + lab + (a < -600 && b > -600 ? ' ← earlier' : ''), Math.max(a, -600) + 1.5, y, { size: 10, color: 'ink', align: 'left', baseline: 'middle' }); });
          for (const [t, lab, y] of ev) { A.line(t, 1.2, t, y - 0.3, { color: 'ink', width: 1, alpha: 0.5 }); A.dot(t, 1.2, { r: 4, color: 'ink' }); A.text(lab, t, y, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); }
          const { gate, diversity } = curves(), pts = [], gp = [];
          for (let k = 0; k <= 420; k++) { const t = -600 + k / 4; pts.push([t, diversity(t)]); gp.push([t, gate(t)]); }
          B.path(gp, { color: 'orange', width: 1.5, dash: [4, 3], alpha: 0.8 });
          B.path(pts, { color: 'accent', width: 2.8 });
          B.vband(-538.8, -515, { color: 'pink', alpha: 0.12, edges: false });
          v.legend([['accent', 'diversity (model)'], ['orange', 'gate', { dash: true }], ['pink', 'the “explosion” interval']]);
        });
        v.readout(() => {
          const { crossing } = curves(), t10 = crossing(0.1), t90 = crossing(0.9), r = rS.value;
          const dur = t10 !== null && t90 !== null ? `${v.fix(t90 - t10, 1)} Myr from 10% to 90%` : 'no full rise in this window';
          return `Model: ${dur} (a logistic with no gate needs ln 81 / r = ${v.fix(Math.log(81) / r, 1)} Myr). Fossil record: base of the Cambrian 538.8 Ma, trilobites ≈ 521 Ma, Chengjiang ≈ 518 Ma.\nThe trigger windows have chosen illustrative endpoints, not measured confidence intervals. Drook ≈574 Ma; Mistaken Point E surface ≈565 Ma. Chengjiang ≈518 Ma is a maximum depositional age. Molecular-clock origins remain uncertain.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Mass extinctions and recoveries',
      statement: String.raw`Raup and Sepkoski (1982) identified five conspicuous drops in marine family diversity; four were statistically distinct from background extinction in their data, while the prolonged Devonian event was not. These episodes are the **Big Five**: Late Ordovician (roughly $445$–$443$ Ma), Devonian (a prolonged interval, roughly $372$–$359$ Ma), Permian ($\approx 252$ Ma), Triassic ($\approx 201$ Ma) and Cretaceous ($\approx 66$ Ma). Commonly quoted losses of *species* are roughly $86\%$, $75\%$, $96\%$, $80\%$ and $76\%$ respectively; estimates for genera are lower and vary between studies and methods. After each, diversity recovered, over several million years to tens of millions.

The causes differ: glaciation and sea-level fall (Ordovician), anoxia (Devonian), the Siberian Traps volcanism and its consequences (Permian, the largest), the Central Atlantic Magmatic Province (Triassic), and an asteroid impact with Deccan volcanism (Cretaceous, 3.9).`,
      idea: String.raw`If a clade of $N$ taxa grows logistically, $\dot N = rN(1-N/K)$, and a catastrophe removes a fraction $f$ of it, write $n_0=N_0/K$ for the pre-event fraction of capacity. For $f>0.1$, the time to regain $90\%$ of that old level is $\tfrac{1}{r}\,[\operatorname{logit}(0.9n_0)-\operatorname{logit}((1-f)n_0)]$; if less than $10\%$ was lost, that target is already met. Recovery rises only logarithmically with severity. Kirchner and Weil (2000) found extinction–origination cross-correlations peaking at a lag of roughly 10 Myr in their marine genus/family data. This is a lag between rate peaks, not the model’s time to regain 90% of a previous stock. They proposed ecosystem rebuilding as an explanation.`,
      caption: String.raw`A deliberately simple model: one stock of taxa with constant capacity, hit by five instantaneous illustrative kills at representative dates (the prolonged Devonian crisis is reduced to its ≈372 Ma pulse). Drag the dip under each event to change the fraction lost, and change the growth rate $r$. The model reproduces the saw-tooth but not the long-term rise of real diversity (the capacity is held fixed). The kill fractions start at the commonly quoted species losses (sources vary).`,
      deps: ['bighist-3.7', 'mathbio-1.6'],
      see: ['bighist-3.9'],
      refs: ['Raup & Sepkoski (1982), Science215:1501–1503, complete original, Figs1–2 and Devonian caveat: https://coleoguy.github.io/reading.group/Raup_Sepkoski_1982.pdf', 'Barnosky et al. (2011), Nature471:51–57, Table1 (estimated species losses and proposed causes): https://ib.berkeley.edu/labs/barnosky/Barnosky%20et%20al%20Sixth%20Extinction%20Nature.pdf', 'Kirchner & Weil (2000), Nature404:177–180, complete original and Methods: https://seismo.berkeley.edu/~kirchner/reprints/2000_34_delayed_recovery.pdf', 'ICS International Chronostratigraphic Chart v2026/06, representative boundary ages: https://stratigraphy.org/ICSchart/ChronostratChart2026-06.pdf'],
      credit: 'Raup & Sepkoski, 1982',
      tags: ['extinction', 'diversity'],
      scope: String.raw`Quoted losses depend on the taxonomic level, the data set and the method; the dates are rounded.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Extinction_event' },
      viz(v) {
        const rS = v.slider('regrowth rate r (per Myr)', 0.1, 2, 0.5, { step: 0.01 });
        const s = v.stage({ x: [-541, 0], y: [0, 1.08], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'time (Ma ago, negative)', ylabel: 'diversity / capacity', title: 'logistic diversity with five kills (model)' });
        const f = BIG5.map((e) => e.f);
        const sim = (r, out) => {
          // returns pre-event levels, post-event levels and recovery times; fills a path if out given
          let N = 0.04, t = -541; const pre = [], post = [], rec = [];
          const grow = (N0, dtM) => logisticValue(N0, r, dtM);
          BIG5.forEach((e, i) => {
            const te = -e.t;
            if (out) for (let k = 1; k <= 24; k++) out.push([t + ((te - t) * k) / 24, grow(N, ((te - t) * k) / 24)]);
            N = grow(N, te - t); t = te; pre.push(N);
            if (out) out.push([te, N]);
            N *= 1 - f[i]; post.push(N); if (out) out.push([te, N]);
            rec.push(logisticRecovery(pre[i], f[i], r));
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
          return BIG5.map((e, i) => `${e.name} (${e.t} Ma): ${v.fix(100 * f[i], 0)}% lost, back to 90% in ${v.fix(rec[i], 1)} Myr`).join('\n') + '\nMarine extinction–origination rate peaks have a ~10 Myr lag (Kirchner & Weil2000), a different statistic from these stock-recovery times.';
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Event',
      name: 'The end-Cretaceous impact',
      statement: String.raw`About $66$ million years ago an asteroid struck the Yucatán peninsula at Chicxulub, Mexico, making an impact structure roughly $180$–$200$ km across. Renne and colleagues' 2013 dating found impact tektites and a boundary-proxy ash indistinguishable: their relative age difference was $5\pm27$ thousand years at $68\%$ confidence. This is a dating uncertainty, not a hard limit on the duration of extinction. The boundary marks the loss of non-avian dinosaurs, ammonites and roughly three quarters of species. A globally distributed ejecta layer contains iridium anomalies, shocked minerals and impact spherules; soot is also documented at widely separated sites. The indicators vary with distance and preservation, rather than all occurring in every sample. Hildebrand and colleagues (1991) described the crater evidence; its peak ring was drilled in 2016.

The impact was not the only environmental stress of the time: Deccan volcanism also occurred. Schulte and colleagues' 2010 geological synthesis identified the impact as the best-supported trigger of the boundary extinction.`,
      idea: String.raw`An impactor of diameter $L$, density $\rho$ and speed $v$ carries $E=\tfrac12\cdot\tfrac{\pi}{6}\rho L^3v^2$: a $10$ km body at $20$ km/s and $2700$ kg/m³ has about $3\times10^{23}$ J, roughly $10^8$ megatons of TNT. Collins, Melosh and Marcus (2005) give crater-scaling laws with transient diameter $D_{tc}\propto L^{0.78}v^{0.44}g^{-0.22}$, followed by collapse into a wider complex crater. The explorer inverts this solid-rock scaling at your chosen speed, angle and density. Its inferred diameter is model-dependent; Alvarez's historical $10\pm4$ km estimate instead combined four arguments, including iridium (3.10).

Geological observations and models implicate regional blast and tsunamis, a possible thermal pulse from re-entering ejecta, and atmospheric dust, soot and sulfate aerosols as mechanisms for darkness and cooling. Their relative importance and durations remain uncertain; sulfate-cooling estimates in the 2010 synthesis extend for years to decades. This crater calculator does not compute those atmospheric or biological effects.`,
      caption: String.raw`Impactor diameter against final crater diameter on log axes, for the speed, angle and density you set. The green band marks the Chicxulub crater (about 180–200 km); the orange band is Alvarez's 1980 estimate for the diameter, $10\pm4$ km. Drag the handle along the curve to choose the impactor, and see the energy and the diameter needed to match the crater. Left: the paper’s reported iridium enhancements; Italy/Denmark compare acid-insoluble residues, New Zealand whole rock, so their heights are not directly comparable concentrations.`,
      deps: ['bighist-3.8', 'bighist-1.3', 'geol-2.7', 'mech-3.1'],
      see: ['bighist-3.10'],
      refs: ['Collins, Melosh & Marcus (2005), Meteoritics & Planetary Science40:817–840, crater-dimension derivation pp817–824: https://spiral.imperial.ac.uk/bitstreams/8065368c-096c-4787-aab7-cbaf1a7d7277/download', 'Alvarez et al. (1980), Science208:1095–1108, complete original; see bighist-3.10', 'Hildebrand et al. (1991), Geology19:867–871, complete crater identification and age discussion; DOI10.1130/0091-7613(1991)019<0867:CCAPCT>2.3.CO;2', 'Renne et al. (2013), Science339:684–687, complete original, p684 relative dating and p687 notes9/11 uncertainty conventions; DOI10.1126/science.1230492', 'Morgan et al. (2016), Science354:878–882, complete peak-ring drilling paper: https://www.pure.ed.ac.uk/ws/portalfiles/portal/30050008/morgan_science_2016.pdf', 'Schulte et al. (2010), Science327:1214–1218, complete geological synthesis, distance regimes pp1215–1216 and modelled effects p1217; DOI10.1126/science.1177265', 'Harvey et al. (2008), Geology36:355–358, complete original, site-specific soot and preservation limits; DOI10.1130/G24646A.1'],
      credit: 'Alvarez et al., 1980 (hypothesis); Hildebrand et al., 1991 (crater)',
      tags: ['impact', 'extinction'],
      scope: String.raw`This solid-rock scaling extrapolates small laboratory experiments to large impacts. It predicts a fresh rim-to-rim crater diameter, which should be compared cautiously with an apparent impact-structure diameter; the impactor’s speed, angle and density are not measured.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chicxulub_crater' },
      viz(v) {
        const vS = v.slider('impact speed (km/s)', 12, 35, 20, { step: 0.5 });
        const aS = v.slider('angle from horizontal (°)', 15, 90, 45, { step: 1 });
        const rS = v.slider('impactor density (kg/m³)', 1500, 3500, 2700, { step: 50 });
        const A = v.stage({ x: [0.3, 3.6], y: [1, 1000], ylog: true, axes: 'box', gutter: true, height: 300, xticks: [[1, 'Gubbio'], [2, 'Stevns Klint'], [3, 'Woodside Ck']], ylabel: 'iridium (× background)', title: 'iridium at the boundary (Alvarez et al. 1980)' });
        const B = v.stage({ x: [1, 50], y: [3, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'impactor diameter L (km)', ylabel: 'final crater diameter (km)', title: 'crater scaling (Collins–Melosh–Marcus)' });
        const h = B.handle(11, 100, { color: 'accent', r: 7, label: 'impactor' });
        h.onDrag = () => { h.x = clamp(h.x, 1, 50); };
        const need = () => { let lo = 1, hi = 60; for (let i = 0; i < 50; i++) { const m = Math.sqrt(lo * hi); if (crater(m, vS.value, aS.value, rS.value).D < 180) lo = m; else hi = m; } return lo; };
        v.render(() => {
          [[1, 30], [2, 160], [3, 20]].forEach(([x, y]) => A.rect(x - 0.3, 1, x + 0.3, y, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.2 }));
          [[1, 30], [2, 160], [3, 20]].forEach(([x, y]) => A.text(`${y}×`, x, y * 1.35, { size: 11.5, color: 'ink', align: 'center' }));
          A.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          const pts = []; for (let i = 0; i <= 80; i++) { const L = 10 ** (Math.log10(1) + (Math.log10(50) * i) / 80); pts.push([L, crater(L, vS.value, aS.value, rS.value).D]); }
          B.hband(180, 200, { color: 'green', alpha: 0.25 }); B.text('Chicxulub ≈ 180–200 km', 1.2, 230, { size: 10.5, color: 'green', align: 'left' });
          B.vband(6, 14, { color: 'orange', alpha: 0.16, edges: false }); B.text('Alvarez 1980: 10 ± 4 km', 6.2, 4.3, { size: 10.5, color: 'orange', align: 'left' });
          B.path(pts, { color: 'accent', width: 2.4 });
          h.set(h.x, crater(h.x, vS.value, aS.value, rS.value).D);
          const Ln = need(); B.dot(Ln, crater(Ln, vS.value, aS.value, rS.value).D, { r: 5, hollow: true, color: 'green' });
        });
        v.readout(() => {
          const L = h.x, m = impactorMass(L, rS.value), E = 0.5 * m * (vS.value * 1e3) ** 2, c = crater(L, vS.value, aS.value, rS.value);
          return `Impactor ${v.fix(L, 1)} km: mass ${m.toExponential(1)} kg, energy **${E.toExponential(1)} J = ${(E / MT).toExponential(1)} Mt TNT**, transient crater ${v.fix(c.Dtc, 0)} km, final crater **${v.fix(c.D, 0)} km**.\nA 180 km crater needs ${v.fix(need(), 1)} km at these settings. Renne et al. (2013): impact/boundary-proxy relative age difference 5 ± 27 kyr (68% confidence); the absolute tektite date was 66.038 ± 0.049 Ma including systematic uncertainty.`;
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
      statement: String.raw`Alvarez and colleagues measured iridium across the Cretaceous–Tertiary boundary at Gubbio (Italy), Stevns Klint (Denmark) and Woodside Creek (New Zealand). Their reported enhancements were about **30 times**, **160 times** and **20 times** the respective backgrounds. The first two compare acid-insoluble residues; the New Zealand result compares whole rock. These are site-specific ratios, not directly comparable absolute concentrations. They argued for an extraterrestrial component and tested a supernova explanation using plutonium-244 and iridium isotopes; the negative plutonium result alone was not conclusive. Four lines of argument were consistent with an impactor diameter of about $10\pm4$ km, although their fourth, optical estimate was only a broad consistency check.

Their proposed mechanism was dust-darkening, suppressed photosynthesis and disrupted food chains. An estimated 60 times the impactor's mass was excavated; the model assumed a fraction 0.22 reached the stratosphere, borrowed from Krakatoa and explicitly uncertain. The paper did not identify the impact crater.`,
      idea: String.raw`The original aim was to estimate how long the boundary clay took to deposit using iridium delivered in cosmic dust. Its unexpectedly high abundance motivated tests of its source. The article compared many elements, isotope ratios and possible terrestrial and extraterrestrial explanations before developing a quantitative asteroid-impact scenario. It cited earlier impact proposals; its contribution should not be described as the first suggestion of every astronomical extinction mechanism. Its diameter arguments used iridium inventory, impact frequency, boundary-layer mass and optical attenuation, with substantial assumptions.`,
      caption: String.raw`Left: a schematic profile whose peaks are the reported ratios (30, 160, 20); widths and tails are chosen, not measured stratigraphic profiles. Italy/Denmark use acid-insoluble residues and New Zealand whole rock. Right: the thickness if all 60 times the chosen impactor mass were spread uniformly over Earth, using chosen impactor density 3000 kg/m³. This illustrates mass scaling; the paper used 2200 kg/m³ and assumed only 0.22 of the excavated material reached the stratosphere. Orange: its $10\pm4$ km estimate.`,
      deps: ['bighist-3.8'],
      see: ['bighist-3.9'],
      refs: ['Alvarez, Alvarez, Asaro & Michel (1980), Science208(4448):1095–1108, complete original, especially pp1096–1100 and1104–1107; DOI10.1126/science.208.4448.1095; public scanned original: https://studylib.net/doc/28049591/alvarez-article--science-1980'],
      credit: 'L. W. Alvarez, W. Alvarez, F. Asaro & H. V. Michel, 1980',
      tags: ['impact', 'extinction', 'iridium'],
      scope: String.raw`A reconstruction of the 1980 argument, with a schematic profile and a chosen-density mass illustration; it does not reproduce a measured global dust layer or establish a unique cause from iridium alone.`,
      links: { doi: 'https://doi.org/10.1126/science.208.4448.1095', wikipedia: 'https://en.wikipedia.org/wiki/Alvarez_hypothesis' },
      viz(v) {
        const site = v.select('site', [{ value: '30', label: 'Gubbio, Italy' }, { value: '160', label: 'Stevns Klint, Denmark' }, { value: '20', label: 'Woodside Creek, N.Z.' }], '30');
        const LS = v.slider('impactor diameter (km)', 2, 20, 10, { step: 0.5 });
        const rhoS = v.slider('excavated layer bulk density (kg/m³)', 1000, 2700, 2000, { step: 50 });
        const A = v.stage({ x: [-6, 6], y: [0.7, 300], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'height above the boundary clay (cm, schematic)', ylabel: 'iridium / background', title: 'iridium through the boundary (schematic profile)' });
        const B = v.stage({ x: [2, 20], y: [0.1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'impactor diameter (km)', ylabel: 'dust thickness if spread over Earth (mm)', title: '60-fold excavated-mass illustration' });
        const h = B.handle(10, 1, { color: 'accent', r: 7 });
        const thick = (L) => (60 * impactorMass(L, 3000)) / (rhoS.value * EARTH_AREA) * 1000; // mm
        h.onDrag = () => { LS.set(clamp(h.x, 2, 20)); };
        v.render(() => {
          const F = Number(site.value);
          const pts = []; for (let i = 0; i <= 200; i++) { const z = -6 + (12 * i) / 200; pts.push([z, iridiumSchematic(z, F)]); }
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
          return `${v.fix(L, 1)} km body of density 3000 kg/m³: mass ${m.toExponential(1)} kg; 60 × that mass of excavated material is ${(60 * m).toExponential(1)} kg, a uniform layer **${thick(L) >= 10 ? v.fix(thick(L), 0) : v.fix(thick(L), 1)} mm** thick if all that material were spread over Earth. This is total excavated mass; the paper assumed only 0.22 reached the stratosphere.\nEnergy at 20 km/s ≈ ${E.toExponential(1)} J. Peak enhancement at ${site.value === '30' ? 'Gubbio' : site.value === '160' ? 'Stevns Klint' : 'Woodside Creek'}: ${site.value}× (the paper; ${site.value === '20' ? 'whole rock' : 'acid-insoluble residue'}); schematic shape.`;
        });
      },
    },
  ],
};

export { crater, impactorMass, ebRelax, iceEdge, ebMean, sunL, EB };
