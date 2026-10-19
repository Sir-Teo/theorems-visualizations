import { wholeDomeWeight, continuumRingTension, capProfile } from './assessment.shared.js';
// Architecture & Structural Form — Chapter 4: Vaults and domes (items 4.6–4.11; 4.1–4.5 are in ch04.js)
//
// Sources checked (Oct 2026):
//   Poleni and St Peter's: original Memorie (1748), ETH Rar 1229, doi:10.3931/e-rara-13403.
//     Read complete relevant Book I §§73–89, Book IV §§583–596 and Book V §§658–669 in the original OCR;
//     visually checked Plate E, Fig. XIV and the original weight table (pp. 47–48).
//     The 50 idealized sectors and 16 weighted links per side are not counts of observed cracks.
//     The dome profile and weights drawn here are an illustrative model, not Poleni's measured data.
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
      statement: String.raw`When the dome of St Peter's in Rome was found to be cracked in the 1740s, Giovanni Poleni examined it for the Pope and published his study in 1748. He idealized it as 50 sectors cut by 25 vertical planes through the axis, not as 50 observed cracks. He divided a pair of opposite sectors into 16 pieces per side and hung a chain with proportional weights, including the lantern contribution, then compared the inverted chain with the dome section (Book I, §§83–88). The weighted chain fitted inside the masonry in his drawing. In a modern no-tension interpretation this supplies an admissible compressive load path for the idealized slices; Poleni also recommended iron hoops, added to the dome and drum between 1743 and 1748.`,
      idea: String.raw`This is Hooke's inversion (arch-3.1) applied to a dome with the argument of arch-4.5: after cracking, a dome is a set of arches, and for each of them the funicular of its own weights is a possible line of thrust. If *one* such line lies inside the stone, the safe theorem (arch-3.5) says the dome stands, whatever the true, unknowable state of stress. Poleni did not state the modern safe theorem. He argued that the dome had continued to stand by its own strength even when old hoops had broken (§659), while recommending reinforcement; five new hoops were installed in 1743–44 (§595) and a sixth in 1748 (§§660–665). This is his historical assessment, not a present-day structural diagnosis. The chain supplies a horizontal thrust per gore. For that thrust spread uniformly around a circular hoop, $T\approx nH/(2\pi)$; retaining $n$ discrete radial gore forces gives $T=H/[2\sin(\pi/n)]$.`,
      caption: String.raw`The left panel is a model of a pointed dome of the St Peter's type (the profile and sizes are my reconstruction from round numbers, not Poleni's drawing or data). The shell is cut into a gore and its opposite; the **thrust** slider moves through the range of horizontal thrusts for which a line fits, and the green line is the line of thrust. The right panel is the same line turned upside down: the chain with weights proportional to the stones, hanging between the modeled end supports. Add the lantern, thin the shell, and see when the chain no longer fits.`,
      deps: ['arch-4.5', 'arch-3.1'],
      see: ['arch-3.5', 'arch-3.13'],
      tags: ['poleni', 'hanging chain', 'history'],
      refs: ['Poleni (1748), Memorie istoriche della gran cupola del tempio vaticano, Book I §§73–89 and Plate E; Book IV §595; Book V §§658–669; ETH Rar 1229, doi:10.3931/e-rara-13403', 'Heyman (1966), The stone skeleton, pp. 267–269 (modern limit-analysis interpretation)'],
      credit: 'Giovanni Poleni, Memorie istoriche della gran cupola del tempio vaticano, 1748 (analysis of the cracked dome of St Peter\'s, made from 1743)',
      scope: String.raw`Model of a dome of revolution divided into $n$ idealized gores by vertical planes; the subdivision does not count observed cracks; masonry unit weight 20 kN/m³, no tensile strength, no sliding. The dimensions are a round-number reconstruction (span 42 m, base thickness a variable), the lantern load is a free parameter.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Giovanni_Poleni', mactutor: 'https://mathshistory.st-andrews.ac.uk/Biographies/Poleni.html' },
      viz(v) {
        const GAM = 20, S = 42, m = 24;
        const prof = profile({ type: 'pointed', S, k: 0.62, n: m });
        const mid = prof.map((q) => [q.r, q.z]); mid[0][0] = 0;
        const tb = v.slider('thickness at the base (m)', 1.0, 6, 3.2, { step: 0.05 });
        const lant = v.slider('lantern weight (MN)', 0, 12, 4, { step: 0.1 });
        const ngs = v.slider('number of idealized gores', 16, 64, 50, { int: true });
        const thr = v.slider('thrust: min (0) → max (1)', 0, 1, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-24, 24], y: [-3, 33], equal: true, axes: false, height: 340, weight: 1.15, minWidth: 300, title: 'the dome slice and its line of thrust' });
        const B = v.stage({ x: [-24, 24], y: [-33, 3], equal: true, axes: false, height: 340, weight: 1.15, minWidth: 300, title: 'the chain, hung from the end supports' });
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
            d.g.blocks.forEach((b, k) => { const a = pts[k], c = pts[k + 1], x = (a[0] + c[0]) / 2, y = (a[1] + c[1]) / 2; B.dot(x, y, { r: 9 * Math.sqrt(b.W / Math.max(...d.g.blocks.map((q) => q.W))), color: 'accent' }); });
            B.dot(pts[0][0], pts[0][1], { r: 4, color: 'ink' }); B.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], { r: 4, color: 'ink' });
          }
          B.line(-23, 0, 23, 0, { color: 'faint', dash: [3, 4], width: 1 });
          v.legend([['green', 'thrust line / chain'], ['muted', 'masonry', { area: true }], ['accent', 'weights (area ∝ block weight)', { dot: true }]]);
        });
        v.readout(() => {
          const d = Mo;
          if (!d.rng) return `**No thrust line fits** the gore with this thickness: this discretized slice model does not certify equilibrium. Failure to find a line alone does not prove collapse of the real dome. It needs the base thickness scaled by at least ${d.fit ? f2(d.fit.t * tb.value, 2) : '—'} m (about ${d.fit ? f2(d.fit.t, 2) : '—'} × the current).`;
          const H = d.u[0], T = continuumRingTension(H, ngs.value);
          return `Range of horizontal thrust per gore: ${f2(d.rng.Hmin, 0)} to ${f2(d.rng.Hmax, 0)} kN; at the chosen value $H=${f2(H, 0)}$ kN the hoops at the base have the continuum estimate $T\\approx nH/(2\\pi)=${f2(T / 1000, 2)}$ MN. The thinnest shell of this shape that still holds a line would be ${f2(d.fit.t, 2)}× the current thickness (${f2(d.fit.t * tb.value, 2)} m at the base). Whole shell weight: ${f2(wholeDomeWeight(d.g.W, ngs.value) / 1000, 0)} MN (model; the diametral slice contains two opposite gores).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'The Pantheon: step rings, coffers and graded concrete',
      statement: String.raw`The dome of the Pantheon in Rome (interior diameter about 43.3 m, equal to its height to the oculus) is a mass-concrete hemisphere, unreinforced, whose builders managed its weight in three ways: the thickness grows from about 1.2 m at the oculus to about 6.4 m at the base, with stepped rings on the outside of the haunch that add weight where it presses the springing inward and upward; the concrete is made with lighter and lighter aggregate with height, from travertine and tufa low down to tufa and pumice near the top; and sunken coffers in the inside surface remove material where it is least needed. Together they lighten the upper dome and keep the lower dome heavy, which reduces the hoop tension that a uniform shell would develop (arch-4.4).`,
      idea: String.raw`The membrane forces of arch-4.3 depend on the weight of the cap above each parallel circle, and the hoop force at a given level is the difference between the weight carried by the meridians and the weight sitting on that level itself. Weight placed *high* on the dome (a heavy crown) raises the meridional thrust and therefore the hoop tension below; weight placed *low* (the step rings) loads the haunch directly and presses the parallels together. So lightening the top and loading the bottom both move the hoop force toward compression. The thick base is also its own buttress, so the thrust line stays inside the wall (arch-3.9). The oculus removes crown material and changes the top boundary condition; it does not remove the heaviest part of this thickened-base dome.`,
      caption: String.raw`The left panel is the dome in section (a schematic reconstruction from the published thicknesses; the step rings are schematic and their number is not claimed). Pick the **concrete** (as built: heavy low, light high; uniform heavy; uniform light), vary the density at the top and the coffer void fraction, and switch the stepped extrados on or off (the jumps in the stepped curve are where the thickness jumps: membrane theory cannot smooth them, a real shell would bend there). The right panel is the hoop force $N_\theta$ from the membrane theory with the true variable weight; the dashed curve is the same dome made of uniform heavy concrete with no coffers. The densities and the coffer fraction are illustrative, not measured.`,
      deps: ['arch-4.4'],
      see: ['arch-4.3', 'arch-3.9'],
      tags: ['pantheon', 'roman concrete', 'dome'],
      refs: ['Italian Ministry of Culture, Pantheon: Historical background, https://direzionemuseiroma.cultura.gov.it/en/pantheon/historical-background/ (dimensions and Hadrianic reconstruction)', 'Salvadori (thickness/aggregate survey remains to be checked)'],
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
        const steps = v.toggle('stepped rings on the extrados', false);
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
          const forceValues = [...d.cur.m.Ntheta, ...d.ref.m.Ntheta];
          B.setView([10, 90], [1.12 * Math.min(0, ...forceValues), 1.12 * Math.max(1, ...forceValues)]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(pts(d.ref), { color: 'muted', width: 1.6, dash: [4, 4], alpha: 0.9 });
          B.path(pts(d.cur), { color: 'red', width: 2.8 });
          const z = hoopZero(P, d.cur.m.Ntheta); if (z !== null && deg(z) > 10) B.dot(deg(z), 0, { r: 5, color: 'green' });
          v.legend([['red', 'this dome'], ['muted', 'uniform heavy, no coffers', { dash: true }], ['green', 'sign change']]);
        });
        v.readout(() => {
          const { cur, ref } = data, tmax = (o) => Math.max(...o.m.Ntheta.map((x, i) => (deg(o.P[i].psi) >= 12 ? x : -1e9)));
          const tc = Math.max(0, tmax(cur)), tr = Math.max(0, tmax(ref)), z = hoopZero(cur.P, cur.m.Ntheta);
          return `Model dome mass: ${f2(cur.mass / 1000, 0)} kt (uniform heavy, no coffers: ${f2(ref.mass / 1000, 0)} kt, so ${f2(100 * (1 - cur.mass / ref.mass), 0)}% lighter; masses of this model are not checked against any survey). Peak membrane hoop tension: **${f2(tc, 0)} kN/m** (${f2(tc / thick(90, steps.value), 0)} kPa on the section) against ${f2(tr, 0)} kN/m for the uniform heavy dome. Hoop force changes sign at ${z !== null && deg(z) > 12 ? `$\\varphi=${f2(deg(z), 1)}^\\circ$` : 'no angle (compression above the base band)'}. These are membrane estimates under invented densities, not a structural assessment of the Pantheon.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Invention',
      name: 'Brunelleschi’s dome in Florence',
      statement: String.raw`The dome of Florence Cathedral, designed by Filippo Brunelleschi after a competition announced in 1418, begun in 1420 and closed in 1436, has an interior diameter reported by the Opera di Santa Maria del Fiore as 45.5 m, on an octagonal drum. It combines several devices: a **pointed profile** (the "quinto acuto" arcs, steeper than a hemisphere, which lowers the hoop tension); a **double shell** of brick, the two shells joined by ribs and stairs, so that the dome is deep without being heavy; **herringbone brickwork** that locks each course into the ones below it; and **horizontal chains** of stone beams, wooden and iron elements at several levels that take the hoop tension the masonry cannot. Together they let the dome be built without a full timber centering supporting the whole shell.`,
      idea: String.raw`Each device answers a question from the statics of arch-4.4. The tension belt of a hemisphere starts at $51.8^\circ$ from the crown; a pointed profile is steeper at the base, so the meridional thrust is more vertical and the hoop tension is smaller and covers less of the dome. In this reconstruction each chain is assigned the positive part of its band’s net integrated hoop resultant. Compression and tension can cancel within that integral, so the displayed band resultant is not a validated design force for an actual chain. The courses can be laid without centering as long as the bed joints are not steeper than the friction of the mortar allows; above that height the courses are held by their interlocking bond and by closing each ring (a closed ring is an arch in its own plane). The numbers below are a membrane estimate for a single equivalent shell, not a model of Brunelleschi's structure.`,
      caption: String.raw`The left panel is the dome section: the part built so far is solid, the rest is outlined, and the courses where friction alone cannot hold the bed joints are orange. Drag the **gold handles** to move the chains and read the net hoop-force resultant assigned to each idealized band; change the profile between semicircle and quinto acuto (arcs of $0.8\times$ the span); set the friction of the mortar. The right panel is the hoop force (per unit weight of shell) against height, with the semicircular dome dashed.`,
      deps: ['arch-4.4', 'mech-1.15'],
      see: ['arch-4.5', 'arch-4.7'],
      tags: ['brunelleschi', 'chains', 'construction'],
      refs: ['Opera di Santa Maria del Fiore, official Dome page (interior diameter, double shell, ribs, herringbone)', 'Opera Magazine, On 30 August 1436 the work on Brunelleschi’s Dome was completed (archival construction dates)', 'Salvadori'],
      credit: 'Filippo Brunelleschi, competition 1418, dome begun 1420, completed 1436 (lantern completed 1461)',
      scope: String.raw`Membrane theory of an equivalent axisymmetric shell of uniform weight $w$ per unit area, with a pointed profile of two circular arcs of radius $k\cdot$span. The illustration uses a rounded 44-m span; it is not a dimensional survey of the actual 45.5-m interior. The real dome is an octagon of two shells with ribs; the friction check treats each course as a rigid ring on a bed that is normal to the meridian.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Florence_Cathedral' },
      viz(v) {
        const S = 44, W0 = 40;
        const kq = v.slider('profile: arc radius / span (0.5 semicircle, 0.8 quinto acuto)', 0.5, 1.0, 0.8, { step: 0.01 });
        const mu = v.slider('friction of the mortar bed, μ', 0.2, 1.0, 0.6, { step: 0.05 });
        const built = v.slider('built so far (share of the rise)', 0.05, 1, 0.6, { step: 0.01 });
        const A = v.stage({ x: [-27, 36], y: [-3, 36], equal: true, axes: false, height: 370, weight: 1.1, minWidth: 300, title: 'section: chains, courses, friction' });
        const B = v.stage({ x: [0, 36], y: [-30, 30], axes: 'box', gutter: true, xlabel: 'height above the springing (m)', ylabel: 'hoop force / w (m)', height: 370, weight: 1, minWidth: 300 });
        const chainZ = [11, 21, 30];
        const hs = chainZ.map((z) => A.handle(25, z, { color: 'gold', constrain: (x, y) => [25, clamp(y, 1, 34)] }));
        let data = null;
        const compute = (k) => { const P = profile({ type: 'pointed', S, k, n: 400 }), m = membrane(P, 1); return { P, m, rise: P[0].z }; };
        v.render(() => {
          const d = data = compute(kq.value), ref = compute(0.5), { P, m } = d;
          A.setView([-27, 36], [-3, Math.max(36, d.rise + 2)]); B.setView([0, Math.max(36, d.rise)], [-30, 30]);
          const psiC = 90 - deg(Math.atan(mu.value)), zb = built.value * d.rise;
          for (let i = 1; i < P.length; i++) {
            const q = P[i], p0 = P[i - 1], done = q.z <= zb, ok = deg(q.psi) >= psiC;
            for (const sg of [-1, 1]) A.line(sg * p0.r, p0.z, sg * q.r, q.z, { color: ok ? 'accent' : 'orange', width: done ? 8 : 2, alpha: done ? 0.75 : 0.5, dash: done ? undefined : [3, 3] });
          }
          const zs = [0.5, ...hs.map((h) => h.y)].sort((a, b) => a - b);
          for (const z of zs) A.line(-27, z, 27, z, { color: 'gold', width: 1.6, dash: [5, 4] });
          // chain forces: net hoop force of the band served
          const edges = [0, ...zs.slice(0, -1).map((z, i) => (z + zs[i + 1]) / 2), 1e9], T = [];
          zs.forEach((z, i) => {
            let sum = 0;
            for (let j = 1; j < P.length; j++) { const zm = (P[j].z + P[j - 1].z) / 2; if (zm >= edges[i] && zm < edges[i + 1]) sum += (m.Ntheta[j] + m.Ntheta[j - 1]) / 2 * (P[j].s - P[j - 1].s); }
            T.push(Math.max(0, sum));
          });
          d.T = T; d.zs = zs;
          zs.forEach((z, i) => A.text(`${f2((T[i] * W0) / 1000, 1)} MN`, 26.5, z, { size: 11, color: 'gold', align: 'left' }));
          A.line(-25, 0, 25, 0, { color: 'faint', width: 1 });
          const zf = (o) => o.P.map((q, i) => [q.z, o.m.Ntheta[i]]).reverse();
          B.hline(0, { color: 'faint', width: 1 });
          B.path(zf(ref), { color: 'muted', dash: [4, 4], width: 1.6 });
          B.path(zf(d), { color: 'red', width: 2.8 });
          for (const z of zs) B.vline(z, { color: 'gold', width: 1, alpha: 0.7 });
          v.legend([['red', 'hoop force, this profile'], ['muted', 'semicircular dome', { dash: true }], ['gold', 'chains']]);
        });
        v.readout(() => {
          const d = data, psiC = 90 - deg(Math.atan(mu.value)), fr = d.P.filter((q) => deg(q.psi) >= psiC).reduce((mx, q) => Math.max(0, mx, 0), 0);
          const zFric = Math.max(0, ...d.P.filter((q) => deg(q.psi) >= psiC).map((q) => q.z)), zero = hoopZero(d.P, d.m.Ntheta);
          const tot = d.T.reduce((a, b) => a + b, 0);
          return `Rise ${f2(d.rise, 1)} m. Hoop tension begins ${zero !== null ? `${f2(deg(zero), 1)}° from the crown` : 'nowhere'}; friction ($\\mu=${f2(mu.value, 2)}$) keeps the bed joints from sliding up to a height of ${f2(zFric, 1)} m (${f2((100 * zFric) / d.rise, 0)}% of the rise), above which bond and ring closure must do the work. Chain tensions for a shell of ${W0} kN/m² (a made-up equivalent weight): ${d.T.map((t) => `${f2((t * W0) / 1000, 1)} MN`).join(', ')}; total ${f2((tot * W0) / 1000, 1)} MN.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Pendentives: a dome on a square',
      statement: String.raw`A circular dome cannot sit directly on four arches over a square, because the circle and the square do not match. **Pendentives** solve this: take a sphere through the four corners of the square, cut it by the four vertical planes through the sides of the square (these cut four semicircular arches), and keep the four spherical triangles that remain between the arches below the horizontal circle that touches the arches' crowns. For a square of side $2a$ the sphere has radius $\sqrt2\,a$, the four cuts are semicircles of radius $a$, and the circle at height $a$ has radius $a$, so a dome can be built on it. The four pendentives carry the dome's weight to the four corner piers and create a circular transition for a dome; geometrical fit alone does not establish load-bearing capacity.`,
      idea: String.raw`The geometry is exact: at height $z$ the sphere $x^2+y^2+z^2=2a^2$ has horizontal radius $\sqrt{2a^2-z^2}$, which equals $a$ at $z=a$, where the vertical planes $x=\pm a$ and $y=\pm a$ are tangent to it; below that level the sphere is cut by those planes in the arches $z=\sqrt{a^2-y^2}$. The load path is the one of arch-4.1: a dome's weight comes down on a ring, the ring is carried by the arches through the pendentives, and everything reaches the four corner piers. The forces in the transition ring depend on the upper dome and its restraints; their sign does not follow from this geometry alone. The sphere through the corners is the smallest one that can serve, so the pendentive dome above it is a shell of the same sphere (a sail vault) or, as in Hagia Sophia, a different, shallower dome set on the ring.`,
      caption: String.raw`Drag the picture to rotate. **Dome** chooses a dome on the same sphere (a "sail" vault) or a separate spherical cap of chosen rise on the ring (the rise control can pass the hemispherical value). Move the **ring height** to see why it has to be at the arch crowns: lower, and the circle at that level pokes out through the arches (red) because the vertical planes cut the sphere away; higher, and a band of sphere is added below the dome. The plan shows the share of the square taken by the four pendentives.`,
      deps: ['arch-4.3', 'vcalc-1.5'],
      see: ['arch-4.10', 'arch-4.1'],
      tags: ['pendentive', 'byzantine', 'geometry'],
      refs: ['Salvadori'],
      credit: 'developed in Roman and Byzantine architecture; the great dome of Hagia Sophia (532–537, Anthemius of Tralles and Isidore of Miletus) is the famous example',
      scope: String.raw`Geometry of the spherical pendentive on a square plan, with the four arches semicircular. Real pendentives are built with courses of masonry and are not exactly spherical, and the main dome of Hagia Sophia has a diameter of about 31 m, a figure not used in the picture.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pendentive' },
      viz(v) {
        const type = v.select('dome', [{ value: 'sail', label: 'same sphere (sail)' }, { value: 'sep', label: 'separate spherical cap' }], 'sail');
        const z0 = v.slider('ring height z / a (1 = arch crowns)', 0.6, 1.4, 1, { step: 0.01 });
        const rise = v.slider('rise of the separate dome / a', 0.2, 1.2, 0.35, { step: 0.01 });
        const S3 = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.9], equal: true, axes: false, height: 370, weight: 1.15, minWidth: 300, title: 'a dome on a square' });
        const sc = v.scene3(S3, { yaw: -0.6, pitch: 0.38, axes: false });
        const PL = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 370, weight: 0.8, minWidth: 240, title: 'plan' });
        let info = {};
        v.render(() => {
          const G = 40, sep = type.value === 'sep', Z0 = sep ? 1 : z0.value, Rs = Math.SQRT2;
          const zs = (x, y) => Math.sqrt(Math.max(0, 2 - x * x - y * y));
          const P = (x, y, z) => [x * 0.95, y * 0.95, (z - 0.5) * 0.95];
          sc.begin();
          sc.poly([P(-1, -1, -0.0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0)], { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 1 });
          let areaP = 0, areaC = 0;
          for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const x0 = -1 + (2 * i) / G, x1 = x0 + 2 / G, y0 = -1 + (2 * j) / G, y1 = y0 + 2 / G, xc = (x0 + x1) / 2, yc = (y0 + y1) / 2, rc = Math.hypot(xc, yc), zc = zs(xc, yc);
            const gx = xc / zc, gy = yc / zc, dA = (4 / (G * G)) * Math.sqrt(1 + gx * gx + gy * gy);
            const inCircle = rc < 1, pend = !inCircle, band = !sep && zc > 1 && zc < Z0 && inCircle;
            if (pend) areaP += dA; else areaC += dA;
            if (inCircle && sep) continue;
            const below = zc <= Z0 + 1e-9, col = pend || band ? 'orange' : 'accent';
            if (!sep && !pend && !below && !band) { /* dome above the ring */ }
            sc.poly([P(x0, y0, zs(x0, y0)), P(x1, y0, zs(x1, y0)), P(x1, y1, zs(x1, y1)), P(x0, y1, zs(x0, y1))], { fill: !sep && below && !pend && zc <= Z0 ? 'orange' : col, fillAlpha: 0.2 + 0.1 * ((i + j) % 2), edge: false });
          }
          if (sep) {
            const h = rise.value, meridian = capProfile(1, h, 40), n = 12;
            for (let i = 0; i < 40; i++) for (let j = 0; j < n; j++) {
              const a0 = (2 * Math.PI * j) / n, a1 = (2 * Math.PI * (j + 1)) / n, [r0, z0] = meridian[i], [r1, z1] = meridian[i + 1];
              sc.poly([P(r0 * Math.cos(a0), r0 * Math.sin(a0), 1 + z0), P(r1 * Math.cos(a0), r1 * Math.sin(a0), 1 + z1), P(r1 * Math.cos(a1), r1 * Math.sin(a1), 1 + z1), P(r0 * Math.cos(a1), r0 * Math.sin(a1), 1 + z0)], { fill: 'accent', fillAlpha: 0.2 + 0.1 * ((i + j) % 2), edge: false });
            }
          }
          // arches
          for (const [fx, sx] of [[1, 1], [1, -1], [0, 1], [0, -1]]) sc.path(Array.from({ length: 31 }, (_, k) => { const s = -1 + (2 * k) / 30, zz = Math.sqrt(Math.max(0, 1 - s * s)); return fx ? P(sx, s, zz) : P(s, sx, zz); }), { color: 'ink', width: 2.2 });
          for (const x of [-1, 1]) for (const y of [-1, 1]) sc.line(P(x, y, 0), P(x, y, -0.9), { color: 'ink', width: 3.2 }, 1);
          // ring
          const r0 = Math.sqrt(Math.max(0, 2 - Z0 * Z0)), ringR = sep ? 1 : r0;
          const pts = Array.from({ length: 121 }, (_, k) => { const a = (2 * Math.PI * k) / 120; return [ringR * Math.cos(a), ringR * Math.sin(a)]; });
          let out = 0;
          for (let k = 0; k < 120; k++) { const a = pts[k], b = pts[k + 1], bad = Math.max(Math.abs(a[0]), Math.abs(a[1])) > 1.0005; if (bad) out++; sc.line(P(a[0], a[1], sep ? 1 : Z0), P(b[0], b[1], sep ? 1 : Z0), { color: bad ? 'red' : 'green', width: bad ? 3 : 2.4, top: true }, 1); }
          sc.flush();
          // plan
          PL.rect(-1, -1, 1, 1, { color: 'ink', width: 1.4, fill: 'orange', fillAlpha: 0.2 });
          PL.circle(0, 0, ringR, { color: out ? 'red' : 'green', fill: 'accent', fillAlpha: 0.2, width: 2 });
          PL.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          for (const x of [-1, 1]) for (const y of [-1, 1]) PL.rect(x - 0.07, y - 0.07, x + 0.07, y + 0.07, { fill: 'ink', fillAlpha: 0.8, color: 'ink' });
          PL.text('pendentive', 0.85, 0.85, { size: 11, color: 'orange', align: 'center' });
          info = { out, areaP, areaC, ringR, Z0, sep };
          v.legend([['orange', 'pendentives'], ['accent', 'dome'], ['green', 'ring (supported)'], ['red', 'ring outside the arches']]);
        });
        v.readout(() => `Square of side $2a$, sphere radius $\\sqrt2\\,a=1.414\\,a$; arches are semicircles of radius $a$. In plan the four pendentives cover $(4-\\pi)/4=${f2((4 - Math.PI) / 4, 3)}\\,a^2$ each, ${f2(100 * (1 - Math.PI / 4), 1)}% of the square. Ring: radius ${f2(info.ringR, 3)}$a$ at height ${f2(info.sep ? 1 : info.Z0, 2)}$a$ — ${info.out ? '**it leaves the square**: the arches cut it, so no dome can rest on it' : 'inside the square; any band above the arch crowns connects it to the pendentives'}. Surface area of the four pendentives ${f2(info.areaP, 2)}$a^2$ against ${f2(info.areaC, 2)}$a^2$ for the reference cap above $z=a$ of the original sphere.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Compression rings, oculi and lanterns',
      statement: String.raw`A dome with an opening at the crown (an oculus) is a shell whose upper edge must resist the horizontal part of the meridional compression that arrives there. If a lantern of weight $L$ stands on the edge circle at polar angle $\varphi_0$, the meridional force just below it is $N_\varphi=-L/(2\pi r_0\sin\varphi_0)$, with $r_0=a\sin\varphi_0$, and its horizontal inward component presses the edge circle together: the **compression ring** carries a hoop force
$$C=\frac{L}{2\pi}\cot\varphi_0 ,$$
larger for a small, flat-topped oculus and smaller for a steep one. The extra weight also increases the meridional force everywhere below, so a lantern pushes the belt of hoop tension (arch-4.4) up the dome.`,
      idea: String.raw`Vertical equilibrium of the ring: the lantern weight is balanced by the vertical components of the meridional force around the ring, which fixes $N_\varphi$; the horizontal components point at the axis and can only be balanced by a hoop force in the ring itself, which is the equilibrium of a closed ring under inward radial load (arch-1.3 for a circular ring: $C=$ load per unit length $\times$ radius). Without the ring the edge would move inward and the shell would split along its meridians. In the Pantheon the oculus is open and unloaded, so the ring only has to hold the shell's own meridional force; a lantern, as on St Peter's or Florence, loads it with its full weight.`,
      caption: String.raw`The section shows a dome of radius 10 m and its oculus at the angle $\varphi_0$ (slider), with a lantern of weight $L$ standing on it. The ring (gold) is drawn at the oculus and labelled with its compression. Remove the ring and the horizontal part of the thrust is unbalanced (arrow). The plot gives $N_\theta$ along the meridian with and without the lantern; the green dot is where tension begins (at the oculus edge itself when the lantern is heavy).`,
      deps: ['arch-4.3'],
      see: ['arch-4.9', 'arch-4.6'],
      tags: ['oculus', 'lantern', 'ring'],
      refs: ['Salvadori'],
      scope: String.raw`Spherical membrane dome of radius $a=10$ m and constant weight $w=10$ kN/m² (about 0.5 m of masonry) loaded by its own weight and a ring load $L$ at the oculus edge; ring and shell are connected without bending, and the ring is a thin circle of its own cross-section. The lantern weights are made up.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oculus' },
      viz(v) {
        const a = 10, w = 10;
        const p0s = v.slider('oculus angle φ₀ (°)', 5, 60, 14, { step: 0.5 });
        const L = v.slider('lantern weight L (kN)', 0, 3000, 800, { step: 10 });
        const ring = v.toggle('compression ring in place', true);
        const A = v.stage({ x: [-13, 13], y: [-2, 12.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 300, title: 'oculus, lantern and ring' });
        const B = v.stage({ x: [0, 90], y: [-60, 60], axes: 'box', gutter: true, xlabel: 'angle from the crown, φ (°)', ylabel: 'hoop force N_θ (kN/m)', height: 340, weight: 1.1, minWidth: 300 });
        let data = null;
        const calc = (Lv) => { const P = profile({ type: 'sphere', R: a, phi0: p0s.value, phi1: 90, n: 300 }), m = membrane(P, w, Lv); return { P, m, zero: hoopZero(P, m.Ntheta) }; };
        v.render(() => {
          const p0 = p0s.value * D2R, r0 = a * Math.sin(p0), z0 = a * Math.cos(p0), Lv = L.value;
          const d = data = { with: calc(Lv), base: calc(0) }, { P, m } = d.with;
          for (let i = 1; i < P.length; i++) { const nt = (m.Ntheta[i] + m.Ntheta[i - 1]) / 2; for (const sg of [-1, 1]) A.line(sg * P[i - 1].r, P[i - 1].z, sg * P[i].r, P[i].z, { color: nt > 0 ? 'red' : 'accent', width: 7, alpha: 0.7 }); }
          // lantern block
          const lh = 2.2 + Lv / 1200, lw = r0 * 0.9 + 0.2;
          A.rect(-lw, z0, lw, z0 + lh, { fill: 'muted', fillAlpha: 0.3, color: 'ink', width: 1.4 });
          A.arrow(0, z0 + lh + 2.4, 0, z0 + lh + 0.1, { color: 'accent', width: 2.6, head: 8 }); A.text(`L = ${Lv.toFixed(0)} kN`, 1.2, z0 + lh + 1.8, { size: 12, color: 'accent', align: 'left' });
          const C = (Lv / (2 * Math.PI)) * (Math.cos(p0) / Math.sin(p0));
          if (ring.value) { for (const sg of [-1, 1]) A.dot(sg * r0, z0, { r: 6, color: 'gold' }); A.text(`ring: ${C.toFixed(0)} kN`, -r0 - 0.8, z0 - 0.9, { size: 12, color: 'gold', align: 'right' }); }
          else if (Lv > 0) { const Np = Lv / (2 * Math.PI * r0 * Math.sin(p0)), hx = Np * Math.cos(p0); for (const sg of [-1, 1]) A.arrow(sg * r0, z0, sg * (r0 - Math.min(3, hx / 30)), z0, { color: 'red', width: 2.6, head: 8 }); A.text('unbalanced inward push', 0, z0 - 1.5, { size: 12, color: 'red', align: 'center' }); }
          A.line(-12, 0, 12, 0, { color: 'faint', dash: [3, 4], width: 1 });
          const pts = (o) => o.P.map((q, i) => [deg(q.psi), o.m.Ntheta[i]]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(pts(d.base), { color: 'muted', dash: [4, 4], width: 1.6 }); B.path(pts(d.with), { color: 'red', width: 2.8 });
          const zz = m.Ntheta[0] > 0 ? P[0].psi : d.with.zero; if (zz !== null) B.dot(deg(zz), m.Ntheta[0] > 0 ? m.Ntheta[0] : 0, { r: 5, color: 'green' });
          v.legend([['red', 'hoop force with the lantern'], ['muted', 'no lantern', { dash: true }], ['green', 'sign change']]);
        });
        v.readout(() => {
          const p0 = p0s.value * D2R, r0 = a * Math.sin(p0), Lv = L.value, d = data, C = (Lv / (2 * Math.PI)) / Math.tan(p0), Np = Lv / (2 * Math.PI * r0 * Math.sin(p0));
          const first = (o) => (o.m.Ntheta[0] > 0 ? o.P[0].psi : o.zero), zw = first(d.with), zb = first(d.base);
          return `Edge circle: $r_0=${f2(r0, 2)}$ m. Meridional force just below the ring $N_\\varphi=${f2(Np, 1)}$ kN/m; ring compression $C=\\frac{L}{2\\pi}\\cot\\varphi_0=${f2(C, 0)}$ kN${ring.value ? '' : ' (not provided: the edge is pushed inward)'}. Hoop tension begins at ${zw !== null ? `$\\varphi=${f2(deg(zw), 1)}^\\circ$` : 'no angle (compression throughout)'} with the lantern and at ${zb !== null ? `$\\varphi=${f2(deg(zb), 1)}^\\circ$` : 'no angle'} without it.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Method',
      name: 'Thrust network analysis',
      statement: String.raw`**Thrust network analysis** (Block and Ochsendorf, 2007) extends the graphic statics of arch-1.5 to vaults. A *thrust network* is a three-dimensional net of straight compressive members that carries the vertical loads. It is found in two linear steps. First, its plan is fixed and the **horizontal forces** are chosen: the plan network Γ and a force diagram Γ* are reciprocal (parallel edges, dual graphs), so every node is in horizontal equilibrium, and each edge gets a *force density* $q=F/\ell$, its horizontal force over its plan length. Second, with the $q$ known, the **heights** $z$ of the nodes follow from vertical equilibrium, which is *linear*: $\sum_j q_{ij}(z_i-z_j)=p_i$ at every free node, with the loads $p_i$ and the heights of the supports given. The vault is safe if some network found in this way fits inside the thickness of the masonry (the safe theorem, arch-3.5, in three dimensions).`,
      idea: String.raw`In a cable net under a given load, shape and force are coupled non-linearly. Fixing the plan and the horizontal forces first removes the coupling: vertical equilibrium becomes a weighted discrete Poisson equation (pde-1.5). With positive force densities and every free-node component connected to a fixed support, its matrix $L_{ff}$ is positive definite (ladr-7.62): extend a vector $u$ by zero at supports, so $u^T L_{ff}u=\sum_{\{i,j\}}q_{ij}(u_i-u_j)^2>0$ for every nonzero free vector. Indeed, a zero sum would make $u$ constant along every edge and hence zero along a path to a support. Positive definiteness gives invertibility, so the prescribed loads and support heights determine exactly one height solution. The designer's freedom is the force diagram, i.e. the distribution of horizontal thrust; moving it moves the network up and down inside the vault, the same freedom as the choice of the pole in arch-1.5. Here the force diagram is a degenerate one: straight lines of constant horizontal force (rows, columns and, optionally, diagonals), which makes equilibrium of the horizontal forces hold automatically; the general method takes any reciprocal pair.`,
      caption: String.raw`Pick a vault (sail, cross or cloister; its middle surface is the shaded band of thickness $t$) and press **find the best network**: the optimiser changes four numbers (force level and its centre/edge contrast, for the rows-and-columns family and for the diagonals) to bring the network inside the band. The left plot is the plan with line widths proportional to the horizontal force, nodes green when inside the vault and red when outside; the middle plot is a section; the right plot is the force diagram, the force of each line. Thin the vault, or turn the diagonals off, and see which networks stop fitting: a cross vault needs forces along its groins, which rows and columns alone cannot give.`,
      deps: ['arch-4.3', 'arch-1.5', 'pde-1.5', 'ladr-7.62'],
      see: ['arch-3.5', 'arch-4.1'],
      tags: ['form-finding', 'graphic statics', 'vaults'],
      refs: ['Allen & Zalewski'],
      credit: 'Philippe Block and John Ochsendorf, 2007 (J. Int. Assoc. Shell and Spatial Structures 48 (3): 167–173); Block, PhD thesis, MIT 2009',
      scope: String.raw`Regular $13\times13$ plan on a unit-half-span square with supports on the whole boundary at the height of the vault surface; loads from the weight of the middle surface (weight $\propto t\sqrt{1+|\nabla z|^2}$ per plan area); only compressive networks (all $F>0$). The envelope is the middle surface $\pm t/2$ measured vertically, a simplification of the true intrados/extrados.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thrust_network_analysis' },
      viz(v) {
        const n = 13, hx = 2 / (n - 1), X = (i) => -1 + i * hx;
        const shape = v.select('vault', [{ value: 'sail', label: 'sail vault' }, { value: 'cross', label: 'cross vault' }, { value: 'cloister', label: 'cloister vault' }], 'sail', { onChange: () => { optimise(); } });
        const diag = v.toggle('diagonal lines of thrust', true, { onChange: () => { optimise(); } });
        const tt = v.slider('thickness t / span', 0.03, 0.3, 0.12, { step: 0.005 });
        const lev = v.slider('force level (ln F)', -10, -0.5, -5.8, { step: 0.05 });
        const con = v.slider('rows/cols: centre vs edge', -0.9, 12, 3.7, { step: 0.05 });
        const dlev = v.slider('diagonals: force level (ln F)', -10, -0.5, -6.5, { step: 0.05 });
        const dcon = v.slider('diagonals: centre vs edge', -0.9, 12, 1, { step: 0.05 });
        const sec = v.select('section', [{ value: 'mid', label: 'y = 0' }, { value: 'q', label: 'y = 0.5' }, { value: 'd', label: 'diagonal' }], 'mid');
        const env = (x, y) => (shape.value === 'sail' ? Math.sqrt(Math.max(0, 2 - x * x - y * y)) : shape.value === 'cross' ? Math.min(Math.sqrt(Math.max(0, 1 - x * x)), Math.sqrt(Math.max(0, 1 - y * y))) : Math.max(Math.sqrt(Math.max(0, 1 - x * x)), Math.sqrt(Math.max(0, 1 - y * y))));
        const load = (i, j) => { const x = X(i), y = X(j), d = 1e-3, gx = (env(x + d, y) - env(x - d, y)) / (2 * d), gy = (env(x, y + d) - env(x, y - d)) / (2 * d); return tt.value * Math.sqrt(1 + gx * gx + gy * gy) * hx * hx; };
        const solve = (P, useDiag) => {
          const [a, b, c, d] = P, bc = clamp(b, -0.9, 12), dc = clamp(d, -0.9, 12);
          const Fr = (u) => Math.exp(a) * (1 + bc * (1 - u * u)), Fd = useDiag ? (u) => Math.exp(c) * (1 + dc * (1 - u * u)) : null;
          return tnaSolve(n, Fr, Fr, Fd, load, (i, j) => env(X(i), X(j)));
        };
        const dev = (r) => { let mx = 0; for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) mx = Math.max(mx, Math.abs(r.z[i][j] - env(X(i), X(j)))); return mx; };
        function optimise() {
          const rnd = v.rng(11), f = (P) => dev(solve(P, diag.value));
          let best = null;
          for (let k = 0; k < 70; k++) { const P = [-9 + 7 * rnd(), 8 * rnd(), -9 + 7 * rnd(), 8 * rnd()], c = f(P); if (!best || c < best.c) best = { P, c }; }
          const r = v.M.nelderMead(f, best.P, { step: 0.5, tol: 1e-6, maxIt: 140 });
          const [a, b, c, d] = r.x; lev.set(clamp(a, -10, -0.5)); con.set(clamp(b, -0.9, 12)); dlev.set(clamp(c, -10, -0.5)); dcon.set(clamp(d, -0.9, 12));
        }
        v.button('find the best network', () => optimise());
        const PL = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: false, height: 320, weight: 0.9, minWidth: 240, title: 'plan: lines of thrust' });
        const SE = v.stage({ x: [-1.05, 1.05], y: [-0.1, 1.65], axes: 'box', gutter: true, xlabel: 'position along the section', ylabel: 'height', height: 320, weight: 1.1, minWidth: 260, title: 'section' });
        const FD = v.stage({ x: [-1, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'normalized line offset', ylabel: 'force / max', height: 320, weight: 0.8, minWidth: 220, title: 'force diagram' });
        let info = {};
        optimise();
        v.render(() => {
          const P = [lev.value, con.value, dlev.value, dcon.value], r = solve(P, diag.value), t2 = tt.value / 2;
          const maxF = Math.max(...r.edges.map((e) => e.F));
          let bad = 0;
          for (const e of r.edges) { const x0 = X(e.a[0]), y0 = X(e.a[1]), x1 = X(e.b[0]), y1 = X(e.b[1]); if ((e.fam === 'r' || e.fam === 'c') && ((e.fam === 'r' && (e.a[1] === 0 || e.a[1] === n - 1)) || (e.fam === 'c' && (e.a[0] === 0 || e.a[0] === n - 1)))) continue; PL.line(x0, y0, x1, y1, { color: e.fam === 'r' || e.fam === 'c' ? 'accent' : 'orange', width: 0.6 + 4.6 * (e.F / maxF), alpha: 0.75 }); }
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const dv = Math.abs(r.z[i][j] - env(X(i), X(j))), okn = dv <= t2 + 1e-9; if (!okn) bad++; PL.dot(X(i), X(j), { r: i === 0 || j === 0 || i === n - 1 || j === n - 1 ? 3.2 : 4, color: okn ? 'green' : 'red' }); }
          const line = sec.value === 'mid' ? (k) => [k, (n - 1) / 2] : sec.value === 'q' ? (k) => [k, Math.round(((n - 1) * 0.75))] : (k) => [k, k];
          const pts = [], mids = [];
          for (let k = 0; k < n; k++) { const [i, j] = line(k), s = sec.value === 'd' ? X(k) * Math.SQRT2 : X(i); pts.push([s, r.z[i][j]]); mids.push([s, env(X(i), X(j))]); }
          const fine = Array.from({ length: 160 }, (_, k) => { const t = -1 + (2 * k) / 159, x = sec.value === 'd' ? t : t, y = sec.value === 'mid' ? 0 : sec.value === 'q' ? X(Math.round((n - 1) * 0.75)) : t; return [sec.value === 'd' ? t * Math.SQRT2 : t, env(x, y)]; });
          SE.between((x) => { const k = Math.round(((x + (sec.value === 'd' ? Math.SQRT2 : 1)) / (sec.value === 'd' ? 2 * Math.SQRT2 : 2)) * 159); const q = fine[clamp(k, 0, 159)]; return q[1] + t2; }, (x) => { const k = Math.round(((x + (sec.value === 'd' ? Math.SQRT2 : 1)) / (sec.value === 'd' ? 2 * Math.SQRT2 : 2)) * 159); const q = fine[clamp(k, 0, 159)]; return Math.max(0, q[1] - t2); }, sec.value === 'd' ? -1 : -1, sec.value === 'd' ? 1 : 1, { fill: 'muted', fillAlpha: 0.2 });
          SE.path(pts, { color: 'red', width: 2.6 }); SE.dots(pts, { r: 3.2, color: 'red' });
          // force diagram: force of each row (blue) and of each diagonal line (orange) by position
          const us = Array.from({ length: 41 }, (_, k) => -1 + k / 20), Fr = us.map((u) => Math.exp(P[0]) * (1 + clamp(P[1], -0.9, 12) * (1 - u * u))), Fdg = us.map((u) => Math.exp(P[2]) * (1 + clamp(P[3], -0.9, 12) * (1 - u * u)));
          const mx = Math.max(...Fr, diag.value ? Math.max(...Fdg) : 0);
          FD.path(us.map((u, k) => [u, Fr[k] / mx]), { color: 'accent', width: 2.6 });
          if (diag.value) FD.path(us.map((u, k) => [u, Fdg[k] / mx]), { color: 'orange', width: 2.6 });
          let W = 0; for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) W += load(i, j);
          let Hx = 0; for (let j = 1; j < n - 1; j++) Hx += Math.exp(P[0]) * (1 + clamp(P[1], -0.9, 12) * (1 - X(j) ** 2));
          info = { bad, dv: dev(r), W, Hx, t2 };
          v.legend([['accent', 'rows and columns'], ['orange', 'diagonals'], ['red', 'network (section)'], ['muted', 'vault thickness', { area: true }]]);
        });
        v.readout(() => `${info.bad === 0 ? '**The network fits** inside the vault' : `**${info.bad} node(s) outside** the vault`}: the largest distance from the middle surface is ${f2(info.dv, 3)} of the half-span against $t/2=${f2(info.t2, 3)}$. Total load ${f2(info.W, 3)}; total horizontal force carried to each pair of opposite walls by the rows ${f2(info.Hx, 3)}, a thrust-to-weight ratio of ${f2(info.Hx / info.W, 2)} (units: $\\gamma\\,\\mathrm{span}^3$).`);
      },
    },
  ],
};
