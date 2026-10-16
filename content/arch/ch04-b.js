// Architecture & Structural Form — Chapter 4: Vaults and domes (items 4.6–4.11; 4.1–4.5 are in ch04.js)
//
// Sources checked (Oct 2026):
//   Poleni and St Peter's: Giovanni Poleni, Memorie istoriche della gran cupola del tempio vaticano (Padua, 1748). Historical outline
//     (cracks noted in 1742, an expert report by Boscovich, Le Seur and Jacquier recommending iron rings, Poleni called to Rome in 1743,
//     Vanvitelli carrying out the work, first five iron rings by Zabaglia with a sixth added later, book 1748; his catenary analysis
//     described as an early use of the safe theorem) from a literature search: López Manzanares, "Poleni's manuscripts about the Dome of
//     Saint Peter's" (Univ. Alcalá repository) and MacTutor's Poleni biography; not re-checked against the Memorie itself.
//     The number of slices (50) is quoted from memory and flagged verify. The dome profile and weights drawn here are a MODEL, not Poleni's data.
//   Pantheon: Wikipedia "Pantheon, Rome" (read in Oct 2026): interior diameter 43.3 m = height to the oculus; oculus about 9 m across;
//     dome thickness about 6.4 m at the base and 1.2 m at the oculus; aggregate from travertine and tufa/terracotta at the base to tufa and
//     pumice at the top; five rings of 28 coffers; dedicated about 126 (Hadrian), construction possibly begun about 114. The stepped rings on the
//     haunch, the density values and the coffer void fraction used below are illustrative, labelled as such.
//   Brunelleschi: Wikipedia "Florence Cathedral" (read in Oct 2026): competition 19 Aug 1418; dome begun 1420, finished 1436 (cathedral consecrated
//     25 Mar 1436), lantern 1446–1461; span about 44 m; double shell of brick; herringbone brickwork; four stone-and-iron chains plus a wooden chain.
//     The "quinto acuto" profile (arcs of radius 4/5 of the span) is the usual description in the literature; it is not on the Wikipedia page
//     and is flagged verify.
//   Pendentives: geometry computed here; Hagia Sophia's dome on pendentives, built 532–537 under Justinian by Anthemius of Tralles and Isidore of
//     Miletus (rebuilt after a collapse in 558), main dome about 31 m across (flagged verify).
//   Thrust network analysis: P. Block and J. Ochsendorf, "Thrust network analysis: A new methodology for three-dimensional equilibrium",
//     J. Int. Assoc. Shell and Spatial Structures 48 (3): 167–173 (2007), as cited in the SIGGRAPH history database; and P. Block, Thrust Network
//     Analysis: Exploring Three-dimensional Equilibrium, PhD thesis, MIT (2009), https://dspace.mit.edu/handle/1721.1/49539. No DOI was found for the 2007 paper.

import { domeSlice, profile, membrane, hoopZero, deg, centralLine, bestFit, thrustLine, thrustLP, thrustRange, hinges, drawThrust, clamp, f2, tnaSolve } from './ch04.shared.js';

const D2R = Math.PI / 180;
const kN = (x, d = 3) => `${Math.abs(x) < 0.05 ? 0 : x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;

export default {
  collection: 'arch',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Event',
      name: 'Poleni’s hanging-chain analysis of St Peter’s (1748)',
      statement: String.raw`When the dome of St Peter's in Rome was found to be cracked in the 1740s, Giovanni Poleni examined it for the Pope and published his study in 1748. He treated the dome as a set of slices (gores) cut by its meridional cracks, computed the weight of each part of a slice, hung a chain loaded with weights in the same proportions, and compared the inverted shape of the chain with the section of the dome. The chain fitted inside the masonry, so there existed a line of compressive force that the dome could carry its weight on: the cracked dome was in equilibrium, and what was needed was to confine its outward thrust with iron hoops, which were added to the dome and drum between 1743 and 1748.`,
      idea: String.raw`This is Hooke's inversion (arch-3.1) applied to a dome with the argument of arch-4.5: after cracking, a dome is a set of arches, and for each of them the funicular of its own weights is a possible line of thrust. If *one* such line lies inside the stone, the safe theorem (arch-3.5) says the dome stands, whatever the true, unknowable state of stress. Poleni did not state the theorem, and a modern reader sees in his argument its first application to a real building; the iron rings were a precaution against further spreading of the base, not a cure for a failing structure. The quantity the chain supplies is the horizontal thrust, and with it the force that the hoops must resist, $T=nH/2\pi$ for $n$ gores.`,
      caption: String.raw`The left panel is a model of a pointed dome of the St Peter's type (the profile and sizes are my reconstruction from round numbers, not Poleni's drawing or data). The shell is cut into a gore and its opposite; the **thrust** slider moves through the range of horizontal thrusts for which a line fits, and the green line is the line of thrust. The right panel is the same line turned upside down: the chain with weights proportional to the stones, hanging from the crown joint. Add the lantern, thin the shell, and see when the chain no longer fits.`,
      deps: ['arch-4.5', 'arch-3.1'],
      see: ['arch-3.5', 'arch-3.13'],
      tags: ['poleni', 'hanging chain', 'history'],
      refs: ['Heyman'],
      credit: 'Giovanni Poleni, Memorie istoriche della gran cupola del tempio vaticano, 1748 (analysis of the cracked dome of St Peter\'s, made from 1743)',
      scope: String.raw`Model of a dome of revolution cut into $n$ gores by radial cracks; masonry unit weight 20 kN/m³, no tensile strength, no sliding. The dimensions are a round-number reconstruction (span 42 m, base thickness a variable), the lantern load is a free parameter.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Giovanni_Poleni', mactutor: 'https://mathshistory.st-andrews.ac.uk/Biographies/Poleni.html' },
      viz(v) {
        const GAM = 20, S = 42, m = 24;
        const prof = profile({ type: 'pointed', S, k: 0.62, n: m });
        const mid = prof.map((q) => [q.r, q.z]); mid[0][0] = 0;
        const tb = v.slider('thickness at the base (m)', 1.0, 6, 3.2, { step: 0.05 });
        const lant = v.slider('lantern weight (MN)', 0, 12, 4, { step: 0.1 });
        const ngs = v.slider('number of gores (cracks)', 16, 64, 50, { int: true });
        const thr = v.slider('thrust: min (0) → max (1)', 0, 1, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-24, 24], y: [-3, 33], equal: true, axes: false, height: 340, weight: 1.15, minWidth: 300, title: 'the dome slice and its line of thrust' });
        const B = v.stage({ x: [-24, 24], y: [-33, 3], equal: true, axes: false, height: 340, weight: 1.15, minWidth: 300, title: 'the chain, hung from the crown' });
        let Mo = null;
        const model = () => {
          const mk = (sc) => domeSlice(mid, (i) => sc * (0.4 + 0.6 * (i / m) ** 1.4) * (tb.value / 1), { gamma: GAM, dtheta: (2 * Math.PI) / ngs.value });
          const g = mk(1), Lg = (lant.value * 1000) / ngs.value, half = g.half;
          const loads = Lg > 0 ? [{ x: -0.3, P: Lg, k: half - 1 }, { x: 0.3, P: Lg, k: half }] : [];
          const rng = thrustRange(g, loads, {});
          const fit = bestFit((sc) => mk(sc), () => loads, {}, 0.05, 3, 22);
          let u = null, tl = null;
          if (rng) { const h = rng.Hmin + thr.value * (rng.Hmax - rng.Hmin), r = thrustLP(g, loads, [0, 1, 0], { extra: [{ c: [1, 0, 0], d: h }, { c: [-1, 0, 0], d: -h }] }); u = r ? r.x : rng.min; tl = thrustLine(g, loads, u); }
          return { g, loads, rng, fit, u, tl, Lg, half };
        };
        v.render(() => {
          const d = Mo = model(), { g } = d;
          g.blocks.forEach((b, i) => A.poly(b.poly, { fill: 'muted', fillAlpha: 0.16 + (i % 2) * 0.06, color: 'ink', width: 0.8, alpha: 0.85 }));
          if (d.tl) drawThrust(v, A, d.tl, { color: 'green', bad: 'orange', width: 2.8 });
          A.line(-23, 0, 23, 0, { color: 'faint', dash: [3, 4], width: 1 });
          d.loads.forEach((l) => A.arrow(l.x, mid[0][1] + 7, l.x, mid[0][1] + 1.2, { color: 'accent', width: 2, head: 7 }));
          // chain: the thrust line turned upside down, weights proportional to the blocks
          if (d.tl) {
            const pts = d.tl.map((q) => [q.p[0], -q.p[1]]);
            B.path(pts, { color: 'green', width: 2.6 });
            d.g.blocks.forEach((b, k) => { const a = pts[k], c = pts[k + 1], x = (a[0] + c[0]) / 2, y = (a[1] + c[1]) / 2; B.dot(x, y, { r: 2 + 7 * Math.sqrt(b.W / Math.max(...d.g.blocks.map((q) => q.W))), color: 'accent' }); });
            B.dot(pts[0][0], pts[0][1], { r: 4, color: 'ink' }); B.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], { r: 4, color: 'ink' });
          }
          B.line(-23, 0, 23, 0, { color: 'faint', dash: [3, 4], width: 1 });
          v.legend([['green', 'thrust line / chain'], ['muted', 'masonry', { area: true }], ['accent', 'weights (area ∝ block weight)', { dot: true }]]);
        });
        v.readout(() => {
          const d = Mo;
          if (!d.rng) return `**No thrust line fits** the gore with this thickness: the dome would collapse. It needs the base thickness scaled by at least ${d.fit ? f2(d.fit.t * tb.value, 2) : '—'} m (about ${d.fit ? f2(d.fit.t, 2) : '—'} × the current).`;
          const H = d.u[0], T = (H * ngs.value) / (2 * Math.PI);
          return `Range of horizontal thrust per gore: ${f2(d.rng.Hmin, 0)} to ${f2(d.rng.Hmax, 0)} kN; at the chosen value $H=${f2(H, 0)}$ kN the hoops at the base must resist $T=nH/2\\pi=${f2(T / 1000, 2)}$ MN. The thinnest shell of this shape that still holds a line would be ${f2(d.fit.t, 2)}× the current thickness (${f2(d.fit.t * tb.value, 2)} m at the base). Dome weight: ${f2((d.g.W * ngs.value) / 1000, 0)} MN (model).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'The Pantheon: step rings, coffers and graded concrete',
      statement: String.raw`The dome of the Pantheon in Rome (interior diameter about 43.3 m, equal to its height to the oculus) is a mass-concrete hemisphere, unreinforced, whose builders managed its weight in three ways: the thickness grows from about 1.2 m at the oculus to about 6.4 m at the base, with stepped rings on the outside of the haunch that add weight where it presses the springing inward and upward; the concrete is made with lighter and lighter aggregate with height, from travertine and tufa low down to tufa and pumice near the top; and sunken coffers in the inside surface remove material where it is least needed. Together they lighten the upper dome and keep the lower dome heavy, which reduces the hoop tension that a uniform shell would develop (arch-4.4).`,
      idea: String.raw`The membrane forces of arch-4.3 depend on the weight of the cap above each parallel circle, and the hoop force at a given level is the difference between the weight carried by the meridians and the weight sitting on that level itself. Weight placed *high* on the dome (a heavy crown) raises the meridional thrust and therefore the hoop tension below; weight placed *low* (the step rings) loads the haunch directly and presses the parallels together. So lightening the top and loading the bottom both move the hoop force toward compression. The thick base is also its own buttress, so the thrust line stays inside the wall (arch-3.9). The oculus does the converse job: it removes the heaviest part of a closed crown.`,
      caption: String.raw`The left panel is the dome in section (a schematic reconstruction from the published thicknesses; the step rings are schematic and their number is not claimed). Pick the **concrete** (as built: heavy low, light high; uniform heavy; uniform light), vary the density at the top and the coffer void fraction, and switch the stepped extrados on or off. The right panel is the hoop force $N_\theta$ from the membrane theory with the true variable weight; the dashed curve is the same dome made of uniform heavy concrete with no coffers. The densities and the coffer fraction are illustrative, not measured.`,
      deps: ['arch-4.4'],
      see: ['arch-4.3', 'arch-3.9'],
      tags: ['pantheon', 'roman concrete', 'dome'],
      refs: ['Salvadori'],
      scope: String.raw`Membrane model on the inner sphere of radius 21.65 m with the weight of the thick shell reduced to the inner surface (weight per inner area $\rho g\,[(a+t)^3-a^3]/(3a^2)$); the real dome has bending near the base and meridional cracks that this model ignores. The thickness law, the aggregate zones and the coffer zone (25°–75° from the crown) are schematic.`,
      credit: 'built under the emperor Hadrian, dedicated about 126 CE (construction possibly begun about 114 CE)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pantheon,_Rome' },
      viz(v) {
        const a = 21.65, G = 9.81, phi0 = 12;
        const mix = v.select('concrete', [{ value: 'graded', label: 'as built (graded)' }, { value: 'dense', label: 'uniform heavy' }, { value: 'light', label: 'uniform light' }], 'graded');
        const rtop = v.slider('density near the oculus (t/m³)', 1.0, 2.0, 1.4, { step: 0.05 });
        const rbase = v.slider('density at the base (t/m³)', 1.8, 2.5, 2.2, { step: 0.05 });
        const coff = v.slider('coffer void fraction', 0, 0.35, 0.2, { step: 0.01 });
        const steps = v.toggle('stepped rings on the extrados', true);
        const A = v.stage({ x: [-31, 31], y: [-1, 30], equal: true, axes: false, height: 340, weight: 1.05, minWidth: 300, title: 'section of the dome (schematic)' });
        const B = v.stage({ x: [10, 90], y: [-650, 650], axes: 'box', gutter: true, xlabel: 'angle from the crown, φ (°)', ylabel: 'hoop force N_θ (kN/m)', height: 340, weight: 1.15, minWidth: 320 });
        let data = null;
        const thick = (phi, st) => { const f = clamp((phi - 30) / 60, 0, 1), g = st ? Math.ceil(f * 6) / 6 : f; return 1.2 + 5.2 * g ** 1.0; };
        const rho = (phi, kind, rt, rb) => (kind === 'dense' ? rb : kind === 'light' ? rt : rt + (rb - rt) * clamp((phi - 15) / 70, 0, 1));
        const dome = (kind, cf, st) => {
          const P = profile({ type: 'sphere', R: a, phi0, phi1: 90, n: 300 });
          const wfn = (q) => { const phi = deg(q.psi), t = thick(phi, st), r = rho(phi, kind, rtop.value, rbase.value), vf = phi > 25 && phi < 75 ? 1 - cf : 1; return r * G * vf * ((a + t) ** 3 - a ** 3) / (3 * a * a); };
          const m = membrane(P, wfn);
          const mass = (P.reduce((s, q, i) => (i ? s + 0.5 * (wfn(q) * q.r + wfn(P[i - 1]) * P[i - 1].r) * 2 * Math.PI * (q.s - P[i - 1].s) : s), 0)) / G;
          return { P, m, mass, wfn };
        };
        v.render(() => {
          const d = data = { cur: dome(mix.value, coff.value, steps.value), ref: dome('dense', 0, steps.value) };
          const P = d.cur.P;
          for (let i = 1; i < P.length; i++) {
            const p0 = P[i - 1], p1 = P[i], phi = deg((p0.psi + p1.psi) / 2), t0 = thick(deg(p0.psi), steps.value), t1 = thick(deg(p1.psi), steps.value);
            const r = rho(phi, mix.value, rtop.value, rbase.value), al = 0.12 + 0.45 * ((r - 1.0) / 1.5);
            const o = (p, t) => [p.r * (1 + t / a), (p.z + 0 ) * (1 + t / a)];
            const z0 = 0;
            for (const sg of [-1, 1]) A.poly([[sg * p0.r, p0.z + z0], [sg * p1.r, p1.z + z0], [sg * o(p1, t1)[0], o(p1, t1)[1]], [sg * o(p0, t0)[0], o(p0, t0)[1]]], { fill: 'muted', fillAlpha: clamp(al, 0.1, 0.7), stroke: false });
          }
          // inner and outer outlines; coffers as faint inner marks
          for (const sg of [-1, 1]) {
            A.path(P.map((q) => [sg * q.r, q.z]), { color: 'ink', width: 1.6 });
            A.path(P.map((q) => { const t = thick(deg(q.psi), steps.value); return [sg * q.r * (1 + t / a), q.z * (1 + t / a)]; }), { color: 'ink', width: 1.6 });
          }
          if (coff.value > 0) for (let k = 0; k < 5; k++) { const ph = (25 + 10 * k + 5) * D2R; for (const sg of [-1, 1]) A.dot(sg * a * Math.sin(ph) * 0.97, a * Math.cos(ph) * 0.97, { r: 3 + 8 * coff.value, color: 'ink', hollow: true }); }
          A.line(-30, 0, 30, 0, { color: 'faint', dash: [3, 4], width: 1 });
          A.text('oculus', 0, a + 1, { size: 12, color: 'muted', align: 'center' });
          // plot
          const pts = (o) => o.P.map((q, i) => [deg(q.psi), o.m.Ntheta[i]]).filter((p) => p[0] >= 10);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(pts(d.ref), { color: 'muted', width: 1.6, dash: [4, 4], alpha: 0.9 });
          B.path(pts(d.cur), { color: 'red', width: 2.8 });
          const z = hoopZero(P, d.cur.m.Ntheta); if (z !== null && deg(z) > 10) B.dot(deg(z), 0, { r: 5, color: 'green' });
          v.legend([['red', 'this dome'], ['muted', 'uniform heavy, no coffers', { dash: true }], ['green', 'sign change']]);
        });
        v.readout(() => {
          const { cur, ref } = data, tmax = (o) => Math.max(...o.m.Ntheta.map((x, i) => (deg(o.P[i].psi) >= 12 ? x : -1e9)));
          const tc = Math.max(0, tmax(cur)), tr = Math.max(0, tmax(ref)), z = hoopZero(cur.P, cur.m.Ntheta);
          return `Model dome mass: ${f2(cur.mass / 1000, 0)} kt (uniform heavy, no coffers: ${f2(ref.mass / 1000, 0)} kt, so ${f2(100 * (1 - cur.mass / ref.mass), 0)}% lighter). Peak membrane hoop tension at the base: **${f2(tc, 0)} kN/m** (${f2(tc / thick(90, steps.value), 0)} kPa on the section) against ${f2(tr, 0)} kN/m for the uniform heavy dome. Hoop force changes sign at ${z !== null && deg(z) > 12 ? `$\\varphi=${f2(deg(z), 1)}^\\circ$` : 'no angle (compression above the base band)'}. These are membrane estimates under invented densities, not a structural assessment of the Pantheon.`;
        });
      },
    },
  ],
};
