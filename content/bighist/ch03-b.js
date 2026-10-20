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
//   3.8 Actual Raup1982 original, Barnosky2011 Table1 and Kirchner2000 primary/relevant supplement read.
//     See docs/verification/bighist-extinction-followup.md; candidate remains flagged pending peer review.
//   3.9/3.10 Actual original Alvarez1980, Collins2005 and Renne2013 source equations/tables checked.
//     Sources, finite model/state limits and evidence: docs/verification/bighist-impact-followup.md.
//     Both impact entries independently accepted; source/model scope remains explicit.


import { clamp, tridiag } from './ch03.shared.js';
import {impactEvent,impactPaper} from './impact-items.js';
import extinctionItem from './extinction-item.js';

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
    extinctionItem,
    impactEvent,
    impactPaper,
  ],
};
