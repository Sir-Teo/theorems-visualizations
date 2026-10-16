// History of Technology — Chapter 1: Prehistoric foundations (items 1.1–1.5; 1.6–1.9 are in ch01-b.js)
import { evidenceStage, drawEvidence } from './ch01.shared.js';

// ---------- shared helpers ----------
const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Boussinesq point load on an elastic half-space (units P/2π = 1, tension positive, z = depth): in-plane stresses at (r, z). */
function bous(r, z, nu) {
  const rho = Math.hypot(r, z), r2 = r * r, r5 = rho ** 5;
  const sr = (1 - 2 * nu) / (rho * (rho + z)) - (3 * z * r2) / r5; // (1 − z/ρ)/r² written without cancellation
  return [sr, (-3 * z ** 3) / r5, (-3 * r * z * z) / r5];
}
/** Principal stresses in the r–z plane and the angle of σ1 from the r axis. */
function principal(r, z, nu) {
  const [a, b, c] = bous(r, z, nu), m = (a + b) / 2, R = Math.hypot((a - b) / 2, c);
  return { s1: m + R, s3: m - R, phi: 0.5 * Math.atan2(2 * c, a - b) };
}
/** Trace a σ3 stress trajectory (the path of a crack that stays perpendicular to the greatest tension) from (r0, 0). */
function traceCone(nu, r0 = 1, rMax = 6, zMax = 6) {
  let r = r0, z = 0.003, d = [0, 1];
  const pts = [[r0, 0], [r, z]];
  for (let i = 0; i < 6000; i++) {
    const { phi } = principal(r, z, nu);
    let e = [-Math.sin(phi), Math.cos(phi)];
    if (e[0] * d[0] + e[1] * d[1] < 0) e = [-e[0], -e[1]];
    const h = 0.006 * (1 + 0.6 * Math.hypot(r, z));
    r += h * e[0]; z += h * e[1]; d = e; pts.push([r, z]);
    if (r > rMax || z > zMax) break;
  }
  return pts;
}
/** Cone angle to the surface: chord from the ring at r0 to where the crack reaches depth 2 r0. */
function coneAngle(track) {
  const r0 = track[0][0], p = track.find(([, z]) => z >= 2 * r0) || track[track.length - 1];
  return Math.atan2(p[1], p[0] - r0) / D2R;
}
/** Shoelace area of a polygon. */
function polyArea(P) { let A = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) A += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(A) / 2; }

export default {
  collection: 'tech',
  chapter: 1,
  title: 'Prehistoric foundations',
  summary: String.raw`The oldest technologies are older than our species. Flaked stone, from about 2.6 million years ago, exploits the way brittle rock breaks; the hand axe adds a planned, symmetric shape; fire turns chemistry into warmth, light and cooked food. Much later come machines that store and release mechanical energy, the spear-thrower and the bow, and the soft technologies of the last ice age: sewn clothing, fired clay, spun and woven fibre. The domestication of plants and animals then changed what people could build and how many could live together. Every later chapter rests on these.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Invention',
      name: 'Oldowan stone tools: conchoidal fracture',
      credit: 'Early hominins in East Africa, c. 2.6 million years ago',
      statement: String.raw`By about 2.6 million years ago hominins in East Africa were striking cobbles with a hammerstone to knock off sharp flakes. These **Oldowan** tools (after Olduvai Gorge) are the flakes and the flaked cores, used to cut meat from bones, break bones for marrow and work plants. The oldest securely dated assemblages are at Gona, Ethiopia (2.6–2.5 million years, Semaw et al. 1997), Ledi-Geraru, Ethiopia (at least 2.58 million, Braun et al. 2019) and Nyayanga, Kenya (2.6–3.0 million, Plummer et al. 2023). Flaked and battered stones from Lomekwi 3, Kenya, dated to 3.3 million years (Harmand et al. 2015) would be older still, but they are **contested**: critics argue that they may not lie in the layer that was dated (Domínguez-Rodrigo & Alcalá 2016).

The technique exploits **conchoidal fracture**. In a brittle stone without cleavage planes (flint, chert, obsidian, fine-grained lava), a hard blow on a flat surface, the *platform*, opens a ring crack at the rim of the contact that grows into a cone, the **Hertzian cone**. Near the edge of the platform the side of the cone facing the edge is steered along the outer face of the stone and a flake comes away. Its inner face carries the bulb of percussion left by the cone, and its far end thins to a feather edge. In controlled experiments the size and shape of the flake are set mainly by the **exterior platform angle** between the platform and the outer face and by the **platform depth**, the distance from the point of impact to the edge. When the platform angle reaches about 90° or more, no flake runs.`,
      idea: String.raw`A blow puts a large force on a tiny contact. Just outside it the surface is stretched radially: for a point load $P$ on a half-space the radial stress at the surface is $\sigma_r=(1-2\nu)P/(2\pi r^2)$ (Boussinesq), largest at the rim of the contact. Stone is far weaker in tension than in compression, so a ring crack opens there. As it deepens it turns so as to stay perpendicular to the greatest tension, following a trajectory of the least principal stress $\sigma_3$, and flares into a cone (Frank & Lawn 1967). A stone with no grain or cleavage cannot deflect the crack, which is why the broken surfaces are smooth, shell-like curves ("conchoidal").

Near an edge, the thin slab between the crack and the outer face bends outward under the blow, and the bending keeps the crack running roughly parallel to that face until it fades out at a feather edge (Cotterell & Kamminga 1987). This gives the rules found in the flaking experiments of Dibble and colleagues (Li et al. 2023). Flake thickness follows platform depth. Flakes get longer as the platform angle approaches 90°. Beyond about 90° the stone in front of the crack is too thick to bend away.`,
      caption: String.raw`**Left:** stress under the hammerstone in a block of stone, shaded by the greatest principal stress (deeper red, more tension). The black curves are the cone crack, traced from the rim of the contact along the computed $\sigma_3$ trajectories; grey curves are other trajectories. Change Poisson's ratio $\nu$ and the cone angle changes. **Right:** drag the **strike point** (platform depth) and the **outer face** (platform angle), and tilt the blow. The edge-side flank of the cone starts the crack, which then runs along the face, and the gold flake comes off. **Map:** green is where a flake detaches. Elsewhere the edge crushes (purple), the flake overshoots and takes the base of the core with it (gold), or nothing detaches (red). Click the map to jump there.`,
      deps: ['solid-11.11'],
      see: ['solid-11.4', 'mat-5.1', 'bighist-4.1'],
      refs: ['Cardwell', 'Cotterell & Kamminga 1987, Amer. Antiquity 52:675', 'Li et al. 2023, J. Archaeol. Method Theory 30:1284'],
      tags: ['prehistory', 'c. 2.6 mya', 'fracture'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oldowan' },
      viz(v) {
        // ---- left: the Hertzian cone in a block (units of the contact radius a)
        const A = v.stage({ x: [-4.4, 4.4], y: [-5.2, 1.5], equal: true, axes: false, height: 300, weight: 1, minWidth: 320, title: 'under the hammerstone (block of stone)' });
        // ---- right: a flake from the edge of a core (millimetres)
        const B = v.stage({ x: [-30, 50], y: [-66, 16], equal: true, axes: false, height: 300, weight: 1.25, minWidth: 400, title: 'at the edge of a core (mm)' });
        const C = v.stage({ x: [40, 105], y: [0, 25], height: 200, axes: 'box', gutter: true, weight: 0.85, minWidth: 260, xlabel: 'platform angle (°)', ylabel: 'platform depth (mm)', title: 'the flaking window' });
        const D = evidenceStage(v, [3.8e6, 1.3e6], { height: 200, weight: 1.4, minWidth: 380, title: 'the oldest stone tools (years ago, log scale)' });
        const nuS = v.slider('Poisson’s ratio $\\nu$ of the stone', 0.05, 0.4, 0.15, { step: 0.01 });
        const betaS = v.slider('blow tilted toward the edge', -30, 30, 0, { step: 1, fmt: (x) => `${x}°` });
        const XR = 48, YB = -62, AMM = 1.5; // core box (mm) and hammer contact radius (mm)
        let epa = 76, pd = 10;
        const S = B.handle(pd, 0, { color: 'accent', label: 'strike', labelPos: 'e', constrain: (x) => [clamp(x, 0.8, 24), 0] });
        const faceH = B.handle(40 * Math.cos(epa * D2R), -40 * Math.sin(epa * D2R), { color: 'orange', label: 'outer face', labelPos: 'e', constrain: (x, y) => {
          let e = Math.atan2(-y, x) / D2R; e = clamp(e, 40, 105); return [40 * Math.cos(e * D2R), -40 * Math.sin(e * D2R)];
        } });
        S.onDrag = () => { pd = S.x; };
        faceH.onDrag = () => { epa = Math.atan2(-faceH.y, faceH.x) / D2R; };
        C.onClick((x, y) => { epa = clamp(x, 40, 105); pd = clamp(y, 0.8, 24); S.set(pd, 0); faceH.set(40 * Math.cos(epa * D2R), -40 * Math.sin(epa * D2R)); });
        // trajectories are cached per ν
        let cacheNu = null, crack = null, field = [], track = null;
        const tracks = () => {
          if (cacheNu === nuS.value) return;
          cacheNu = nuS.value;
          crack = traceCone(cacheNu, 1, 4.6, 5.4);
          field = [1.7, 2.6, 3.6].map((r0) => traceCone(cacheNu, r0, 4.6, 5.4));
          track = traceCone(cacheNu, 1, 60, 80);
        };
        /** The flake model: initiation along the computed cone flank, then propagation along the face (see caption). */
        function flake(epaDeg, pdmm, betaDeg) {
          const e = epaDeg * D2R, b = betaDeg * D2R;
          const f = [Math.cos(e), -Math.sin(e)], n = [Math.sin(e), Math.cos(e)];
          const ax = [-Math.sin(b), -Math.cos(b)], pe = [-Math.cos(b), Math.sin(b)];
          const W = (r, z) => [pdmm + AMM * (r * pe[0] + z * ax[0]), AMM * (r * pe[1] + z * ax[1])];
          const dist = (P) => P[0] * n[0] + P[1] * n[1];
          const dS = pdmm * Math.sin(e), tStar = 0.6 * dS;
          const out = { f, n, W, dS, tStar, crack: [], kind: 'flake' };
          if (pdmm < 1.8) { out.kind = 'crush'; return out; }
          if (epaDeg >= 90) { out.kind = 'none'; return out; }
          // initiation: follow the computed cone flank for a length set by the platform depth
          let P = null, dir = null, sArc = 0;
          const sInit = 0.15 * pdmm + 0.8;
          for (let i = 1; i < track.length; i++) {
            const Q = W(track[i][0], track[i][1]), Q0 = out.crack.length ? out.crack[out.crack.length - 1] : W(track[0][0], track[0][1]);
            const L = Math.hypot(Q[0] - Q0[0], Q[1] - Q0[1]); sArc += L; out.crack.push(Q);
            if ((sArc >= sInit || dist(Q) <= 0.6 * dS) && L > 0) { P = Q; dir = [(Q[0] - Q0[0]) / L, (Q[1] - Q0[1]) / L]; break; }
          }
          if (!P) { out.kind = 'none'; return out; }
          out.turn = P;
          // propagation: bending steers the crack to run along the face, converging on it at a small taper angle
          const del = clamp(3 + (12 * (90 - epaDeg)) / 50, 3, 15) * D2R; out.delta = del;
          const g = [Math.cos(del) * f[0] - Math.sin(del) * n[0], Math.cos(del) * f[1] - Math.sin(del) * n[1]];
          const th0 = Math.atan2(dir[1], dir[0]), thg = Math.atan2(g[1], g[0]);
          let dth = thg - th0; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI;
          const ad = Math.max(Math.abs(dth), 0.05), Si = ad - ad ** 3 / 18 + ad ** 5 / 600; // ∫ sin(Δθ e^(−s/ℓ)) ds = ℓ·Si(Δθ)
          const ell = Math.max(0.4, (0.2 * dist(P)) / Si), h = 0.25;
          let s = 0;
          for (let k = 0; k < 4000; k++) {
            const ang = thg - dth * Math.exp(-s / ell), Pn = [P[0] + h * Math.cos(ang), P[1] + h * Math.sin(ang)]; s += h;
            const dn = dist(Pn);
            if (dn <= 0) { const u = dist(P) / (dist(P) - dn); out.crack.push([P[0] + u * (Pn[0] - P[0]), P[1] + u * (Pn[1] - P[1])]); out.kind = 'flake'; break; }
            if (Pn[1] <= YB || Pn[0] >= XR) { out.crack.push(Pn); out.kind = 'overshot'; break; }
            out.crack.push(Pn); P = Pn;
          }
          // the flake outline: platform strip from the edge to the strike, the crack, then back up the face
          const faceEnd = (() => { const uB = -YB / Math.sin(e), uR = f[0] > 1e-9 ? XR / f[0] : Infinity, u = Math.min(uB, uR); return [u * f[0], u * f[1]]; })();
          out.faceEnd = faceEnd;
          out.poly = [[0, 0], [pdmm - AMM * Math.cos(b), 0], ...out.crack];
          if (out.kind === 'overshot') out.poly.push(faceEnd);
          const end = out.crack[out.crack.length - 1];
          out.length = Math.hypot(end[0], end[1]);
          let tmax = 0; for (const Q of out.crack) tmax = Math.max(tmax, dist(Q)); out.thick = tmax;
          out.area = polyArea(out.poly);
          return out;
        }
        let cur = null;
        const corePoly = () => {
          const e = epa * D2R, f = [Math.cos(e), -Math.sin(e)];
          const uB = -YB / Math.sin(e), uR = f[0] > 1e-9 ? XR / f[0] : Infinity;
          if (uR < uB) return [[0, 0], [XR, 0], [XR, uR * f[1]]];
          return [[0, 0], [XR, 0], [XR, YB], [uB * f[0], YB]];
        };
        let mapKey = '', mapCells = [];
        const KIND = { flake: 'green', overshot: 'gold', none: 'red', crush: 'purple' };
        v.render(() => {
          tracks();
          const nu = nuS.value, beta = betaS.value, ang = coneAngle(crack);
          // ======== A: stress field and cone
          const sRing = 1 - 2 * nu;
          A.raster((x, y) => {
            if (y > 0) return null;
            const r = Math.abs(x), z = -y; if (Math.hypot(r, z) < 0.55) return null;
            const { s1 } = principal(Math.max(r, 1e-6), z, nu);
            return v.ramp(0.88 * Math.tanh((1.4 * Math.max(s1, 0)) / sRing), 'red');
          }, { key: `cone${nu}`, res: 2 });
          A.circle(0, 0, 0.55, { fill: 'muted', fillAlpha: 0.35, stroke: false });
          A.line(-4.4, 0, 4.4, 0, { color: 'ink', width: 1.5 });
          for (const t of field) for (const sg of [1, -1]) A.path(t.map(([r, z]) => [sg * r, -z]), { color: 'ink', alpha: 0.35, width: 1 });
          for (const sg of [1, -1]) A.path(crack.map(([r, z]) => [sg * r, -z]), { color: 'ink', width: 3 });
          A.circle(0, 1.75, 1.75, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 });
          A.arrow(0, 1.45, 0, 0.62, { color: 'ink', width: 2 });
          A.text('blow', 0.18, 1.12, { size: 11.5, color: 'ink', align: 'left' });
          // the cone angle at the right-hand ring
          const arc = []; for (let k = 0; k <= 20; k++) { const t = (-ang * D2R * k) / 20; arc.push([1 + 1.15 * Math.cos(t), 1.15 * Math.sin(t)]); }
          A.path(arc, { color: 'orange', width: 1.6 });
          A.text(`${Math.round(ang)}°`, 1 + 1.45 * Math.cos((-ang * D2R) / 2), 1.45 * Math.sin((-ang * D2R) / 2), { size: 12.5, color: 'orange', weight: 700, align: 'left' });
          A.text('ring crack', -1.05, 0.28, { size: 11, color: 'ink', align: 'right' });
          A.text('cone crack', -2.9, -1.9, { size: 11.5, color: 'ink', align: 'center', plate: true });
          A.text('tension under the contact', 0, -1.15, { size: 11, color: 'red', align: 'center' });
          // ======== B: the core and the flake
          cur = flake(epa, pd, beta);
          const core = corePoly();
          B.poly(core, { fill: 'muted', fillAlpha: 0.22, color: 'muted', width: 1.5 });
          B.line(0, 0, XR, 0, { color: 'ink', width: 2 });
          B.line(0, 0, core[core.length - 1][0], core[core.length - 1][1], { color: 'orange', width: 2.4 });
          const b = beta * D2R, ax = [-Math.sin(b), -Math.cos(b)];
          B.circle(pd - ax[0] * 12.5, -ax[1] * 12.5, 6, { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1.2 });
          B.arrow(pd - ax[0] * 6.4, -ax[1] * 6.4, pd - ax[0] * 1.8, -ax[1] * 1.8, { color: 'ink', width: 2 });
          // platform-angle arc at the edge
          const arcB = []; for (let k = 0; k <= 24; k++) { const t = (-epa * D2R * k) / 24; arcB.push([7 * Math.cos(t), 7 * Math.sin(t)]); }
          B.path(arcB, { color: 'orange', width: 1.3 });
          B.text(`${Math.round(epa)}°`, 9.5 * Math.cos((-epa * D2R) / 2), 9.5 * Math.sin((-epa * D2R) / 2), { size: 12, color: 'orange', weight: 700, align: 'left' });
          if (cur.kind === 'flake' || cur.kind === 'overshot') {
            B.poly(cur.poly, { fill: 'panel', fillAlpha: 1, stroke: false });
            B.path(cur.crack, { color: 'ink', width: 1.6 });
            const off = [-cur.n[0] * 5, -cur.n[1] * 5];
            B.poly(cur.poly.map(([x, y]) => [x + off[0], y + off[1]]), { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.6 });
            const mid = cur.crack[Math.floor(cur.crack.length * 0.55)];
            B.text(cur.kind === 'flake' ? 'flake' : 'overshot flake', mid[0] + off[0] - 6, mid[1] + off[1], { size: 11.5, color: 'ink', align: 'right', plate: true });
            if (cur.turn) B.dot(cur.turn[0], cur.turn[1], { r: 3, color: 'ink' });
          } else if (cur.kind === 'none') {
            for (const sg of [1, -1]) B.path(track.filter(([r, z]) => Math.hypot(r, z) < 2.2 * pd + 6).map(([r, z]) => cur.W(sg * r, z)), { color: 'red', width: 2, dash: [5, 4] });
            B.text('no flake: the crack dives into the core', 18, -40, { size: 12, color: 'red', align: 'center', plate: true });
          } else {
            for (let k = 0; k < 5; k++) B.poly([[k * 0.5, 0], [k * 0.5 + 0.9, -0.4 - 0.5 * (k % 2)], [k * 0.5 + 0.2, -1.1]], { fill: 'purple', fillAlpha: 0.6, stroke: false });
            B.text('edge crushed: platform too thin', 18, -40, { size: 12, color: 'purple', align: 'center', plate: true });
          }
          // ======== C: the flaking window (EPA × platform depth) for the current tilt and ν
          const key = `${nu}|${beta}`;
          if (key !== mapKey) {
            mapKey = key; mapCells = [];
            for (let i = 0; i < 52; i++) for (let j = 0; j < 30; j++) {
              const x0 = 40 + (65 * i) / 52, y0 = (25 * j) / 30, fk = flake(x0 + 0.625, y0 + 0.4167, beta);
              mapCells.push([x0, y0, KIND[fk.kind]]);
            }
          }
          for (const [x0, y0, c] of mapCells) C.rect(x0, y0, x0 + 65 / 52, y0 + 25 / 30, { fill: c, fillAlpha: 0.45, stroke: false });
          C.line(90, 0, 90, 25, { color: 'ink', width: 1, dash: [4, 3] });
          C.dot(epa, pd, { r: 5.5, color: 'ink' });
          C.text('flake', 64, 7, { size: 12, color: 'ink', weight: 700, align: 'center' });
          C.text('no flake', 97.5, 13, { size: 11.5, color: 'ink', align: 'center' });
          // ======== D: dated evidence
          drawEvidence(v, D, [
            { ago: 3.3e6, label: 'Lomekwi 3', contested: true },
            { ago: [2.6e6, 3.0e6], label: 'Nyayanga' },
            { ago: 2.58e6, label: 'Ledi-Geraru' },
            { ago: [2.5e6, 2.6e6], label: 'Gona' },
            { ago: 1.76e6, label: 'first hand axes', color: 'orange' },
          ], { ticks: [3.5e6, 3e6, 2.5e6, 2e6, 1.5e6], lanes: 3, laneH: 0.22 });
        });
        v.legend([['red', 'tension (greatest principal stress)', { area: true }], ['ink', 'crack path'], ['gold', 'detached flake', { area: true }], ['orange', 'outer face and platform angle']]);
        v.readout(() => {
          const ang = coneAngle(crack), k = cur.kind;
          const cone = `cone angle for $\\nu = ${v.fix(nuS.value, 2)}$: **${Math.round(ang)}°** to the surface (cones in soda-lime glass, $\\nu \\approx 0.22$, are measured at about 22°, shallower than the stress trajectory)`;
          const head = `platform angle **${Math.round(epa)}°**, platform depth **${v.fix(pd, 1)} mm**`;
          if (k === 'none') return `${head}: **no flake**, at 90° or more the stone in front of the crack is too thick to bend away · ${cone}`;
          if (k === 'crush') return `${head}: **edge crushed**, too little stone behind the edge to carry the blow · ${cone}`;
          const mass = 2.6e-3 * cur.area * 0.8 * cur.length; // flint 2.6 g/cm³; flake width taken as 0.8 × length
          return `${head}: **${k === 'flake' ? 'flake, feather termination' : 'overshot flake'}**, ${v.fix(cur.length, 0)} mm long, up to ${v.fix(cur.thick, 1)} mm thick, edge angle ${v.fix(cur.delta / D2R, 1)}°, about ${v.fix(mass, 0)} g · ${cone}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Invention',
      name: 'The Acheulean hand axe',
      credit: 'Homo erectus and later hominins, from c. 1.76 million years ago',
      statement: String.raw`From about 1.76 million years ago hominins in East Africa began to make large **bifacial** tools, chiefly hand axes, shaped by striking flakes alternately from both faces all around the margin of a cobble or a big flake. The oldest are at Kokiselei 4, West Turkana, Kenya (1.76 million years, Lepre et al. 2011) and Konso, Ethiopia (about 1.75 million, Beyene et al. 2013), alongside Oldowan tools. The result has a long continuous cutting edge, a lens-shaped (lenticular) cross-section and, often, a striking bilateral symmetry in plan view. The **Acheulean** tradition (after Saint-Acheul, France) spread across Africa, western Eurasia and South Asia and lasted for well over a million years, the longest-lived tool design in human history.

Unlike an Oldowan flake, a hand axe is imposed on the stone: the maker must plan a sequence of removals in which each blow leaves an edge angle suitable for the next one, from the other face.`,
      idea: String.raw`Flakes run only where the edge angle is below about 90° (tech-1.1). A rounded cobble has few such places, but every flake removed from one face makes the edge more acute where it ends, so the knapper can turn the piece over and strike from the new platform. Alternating faces walks this sharpening all the way round, thinning the piece into a lens and giving it a long edge relative to its mass.

Symmetry is not forced by the mechanics. It is measured with the *flip test* (Hardaker & Dunn 2005): mirror the outline about its long axis and see how much fails to overlap. Experiments have not found that symmetric hand axes butcher better (Machin et al. 2007). Why their makers pursued symmetry, whether for handling, as a signal of skill or for some other reason, is debated.`,
      caption: String.raw`**Click near the margin** in the plan view to strike a flake off the chosen face (shift-click: the other face). The margin is coloured by its edge angle: green edges are sharp, orange still flakeable, red too blunt (a blow there only crushes the edge). Watch an edge turn green after a flake comes off the opposite face. Drag the orange handle to move the cross-section, which is shown on the right against the original cobble (dashed). **Auto-knap** runs a scripted biface sequence; **Oldowan chopper** strikes a few flakes from one face at one end. The score row compares symmetry and cutting edge per kilogram.`,
      deps: ['tech-1.1'],
      refs: ['Cardwell', 'Lepre et al. 2011, Nature 477:82', 'Beyene et al. 2013, PNAS 110:1584'],
      tags: ['prehistory', 'c. 1.7 mya', 'symmetry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Acheulean' },
      viz(v) {
        // grid model (cm): every cell holds the heights of the upper face (A) and lower face (B)
        const NX = 84, NY = 124, X0 = -6.3, Y0 = -9.3, H = 0.15, RHO = 2.6; // 2.6 g/cm³: flint
        const P = v.stage({ x: [-6.6, 6.6], y: [-9.6, 9.6], equal: true, axes: false, height: 360, weight: 0.9, minWidth: 300, title: 'plan view (cm)' });
        const Q = v.stage({ x: [-6.6, 6.6], y: [-3.1, 3.1], equal: true, axes: false, height: 360, weight: 1.3, minWidth: 420, title: 'cross-section along the orange line (cm)' });
        const R = v.stage({ x: [0, 1], y: [0, 3], axes: false, height: 132, full: true });
        const faceSel = v.select('strike on', [{ value: 'A', label: 'face A (up)' }, { value: 'B', label: 'face B (down)' }, { value: 'alt', label: 'alternate' }], 'alt');
        const hamSel = v.select('hammer', [{ value: 'hard', label: 'hard stone' }, { value: 'soft', label: 'soft antler' }], 'hard');
        const depthS = v.slider('blow depth behind the edge', 0.1, 0.6, 0.3, { step: 0.01 });
        const view = v.toggle('show face B (turn the piece over)', false);
        const idx = (i, j) => j * NX + i, cx = (i) => X0 + (i + 0.5) * H, cy = (j) => Y0 + (j + 0.5) * H;
        let zt, zb, z0t, z0b, nRem = [0, 0], nextFace = 'A', last = null, msg = '', ver = 0;
        const stack = [];
        function cobble() {
          zt = new Float32Array(NX * NY); zb = new Float32Array(NX * NY);
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
            const x = cx(i), y = cy(j), th = Math.atan2(y, x);
            const a = 4.7 * (1 - 0.18 * Math.max(0, y) / 8) * (1 + 0.04 * Math.sin(3 * th + 1) + 0.03 * Math.cos(5 * th)), b = 7.9 * (1 + 0.03 * Math.sin(2 * th + 0.4));
            const q = (x / a) ** 2 + (y / b) ** 2;
            if (q < 1) { const sq = (1 - q) ** 0.6; const md = Math.hypot(x, y) / (Math.hypot(x, y) + 1.5); zt[idx(i, j)] = 1.75 * sq * (1 + 0.16 * md * Math.sin(2 * th + 1)); zb[idx(i, j)] = -1.15 * sq * (1 + 0.16 * md * Math.cos(2 * th - 0.5)); }
          }
          ver++; z0t = zt.slice(); z0b = zb.slice(); nRem = [0, 0]; nextFace = 'A'; last = null; msg = ''; stack.length = 0;
        }
        const has = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY && zt[idx(i, j)] - zb[idx(i, j)] > 0.02;
        const sample = (A, x, y) => { // bilinear, NaN outside the piece
          const fi = (x - X0) / H - 0.5, fj = (y - Y0) / H - 0.5, i = Math.floor(fi), j = Math.floor(fj);
          if (!has(i, j) || !has(i + 1, j) || !has(i, j + 1) || !has(i + 1, j + 1)) return NaN;
          const u = fi - i, w = fj - j;
          return (1 - u) * (1 - w) * A[idx(i, j)] + u * (1 - w) * A[idx(i + 1, j)] + (1 - u) * w * A[idx(i, j + 1)] + u * w * A[idx(i + 1, j + 1)];
        };
        const isMargin = (i, j) => has(i, j) && (!has(i + 1, j) || !has(i - 1, j) || !has(i, j + 1) || !has(i, j - 1));
        function inward(i, j) { // inward normal from the local centroid of the piece
          let sx = 0, sy = 0, n = 0;
          for (let dj = -7; dj <= 7; dj++) for (let di = -7; di <= 7; di++) if (di * di + dj * dj <= 49 && has(i + di, j + dj)) { sx += di; sy += dj; n++; }
          const L = Math.hypot(sx, sy) || 1; return [sx / L, sy / L];
        }
        function edgeAngle(i, j) { // angle at which the two faces meet: from the middle of the rim to the faces 0.6 cm inside
          const [nx, ny] = inward(i, j), x = cx(i), y = cy(j), k = idx(i, j), mid = (zt[k] + zb[k]) / 2;
          const ta = sample(zt, x + 0.6 * nx, y + 0.6 * ny), ba = sample(zb, x + 0.6 * nx, y + 0.6 * ny);
          if (!isFinite(ta) || !isFinite(ba)) return 120;
          return (Math.atan2(ta - mid, 0.6) + Math.atan2(mid - ba, 0.6)) / D2R;
        }
        function strike(x, y, face, depth = depthS.value, soft = hamSel.value === 'soft', skipBlunt = false) {
          // nearest margin cell within 1.3 cm of the click
          let best = null, bd = 1.3;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isMargin(i, j)) { const d = Math.hypot(cx(i) - x, cy(j) - y); if (d < bd) { bd = d; best = [i, j]; } }
          if (!best) { msg = 'click closer to the edge of the piece'; return false; }
          const [i, j] = best, ang = edgeAngle(i, j), [nx, ny] = inward(i, j), mx = cx(i), my = cy(j);
          if (skipBlunt && ang >= 90) return false;
          ver++; stack.push([zt.slice(), zb.slice(), nRem.slice(), nextFace]); if (stack.length > 60) stack.shift();
          if (ang >= 90) { // too blunt: the edge crumbles a little, no flake
            for (let jj = j - 2; jj <= j + 2; jj++) for (let ii = i - 2; ii <= i + 2; ii++) if (has(ii, jj) && Math.hypot(cx(ii) - mx, cy(jj) - my) < 0.28) { zt[idx(ii, jj)] = 0; zb[idx(ii, jj)] = 0; }
            last = { x: mx, y: my, face, ok: false }; msg = `edge angle ${Math.round(ang)}° is too blunt: the blow crushes the edge`; return false;
          }
          const px = mx + 0.5 * nx, py = my + 0.5 * ny, t0 = sample(zt, px, py), b0 = sample(zb, px, py);
          if (!isFinite(t0) || !isFinite(b0)) { stack.pop(); msg = 'no platform here'; return false; }
          const mid = (t0 + b0) / 2, tau = t0 - b0, slope = soft ? 0.13 : 0.24, kap = soft ? 0.09 : 0.16, sgn = face === 'A' ? 1 : -1;
          const zStart = mid - sgn * depth * tau / 2, tx = -ny, ty = nx;
          let removed = 0;
          for (let jj = 0; jj < NY; jj++) for (let ii = 0; ii < NX; ii++) {
            if (!has(ii, jj)) continue;
            const dx = cx(ii) - mx, dy = cy(jj) - my, u = dx * nx + dy * ny, w = dx * tx + dy * ty;
            if (u < -0.6 || Math.abs(w) > 1.0 + 0.7 * Math.max(u, 0) || Math.abs(w) > 3.2) continue;
            const uu = Math.max(u, 0), Sz = zStart + sgn * (uu * slope + (soft ? 0.025 : 0.05) * uu * uu + kap * w * w), k = idx(ii, jj);
            if (face === 'A' && zt[k] > Sz) { removed += (zt[k] - Math.max(Sz, zb[k])) * H * H; zt[k] = Sz; }
            if (face === 'B' && zb[k] < Sz) { removed += (Math.min(Sz, zt[k]) - zb[k]) * H * H; zb[k] = Sz; }
            if (zt[k] - zb[k] <= 0.03) { zt[k] = 0; zb[k] = 0; }
          }
          nRem[face === 'A' ? 0 : 1]++; last = { x: mx, y: my, face, ok: true, nx, ny };
          msg = `flake of ${v.fix(removed * RHO, 0)} g off face ${face} (edge angle was ${Math.round(ang)}°)`; return true;
        }
        function metrics() {
          let m = 0, sx = 0, sy = 0, n = 0;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (has(i, j)) { const k = idx(i, j); m += (zt[k] - zb[k]) * H * H; sx += cx(i); sy += cy(j); n++; }
          if (!n) return null;
          const gx = sx / n, gy = sy / n; let sxx = 0, syy = 0, sxy = 0;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (has(i, j)) { const dx = cx(i) - gx, dy = cy(j) - gy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
          const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(th), uy = Math.sin(th); // long axis
          let inter = 0, uni = 0;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
            const a = has(i, j), dx = cx(i) - gx, dy = cy(j) - gy, d = dx * ux + dy * uy, rx = gx + 2 * d * ux - dx, ry = gy + 2 * d * uy - dy;
            const b = has(Math.floor((rx - X0) / H), Math.floor((ry - Y0) / H));
            if (a && b) inter++; if (a || b) uni++;
          }
          let edge = 0, sharp = 0;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isMargin(i, j)) { edge += H; if (edgeAngle(i, j) < 70) sharp += H; }
          return { mass: m * RHO / 1000, sym: inter / uni, g: [gx, gy], axis: [ux, uy], edge, sharp, n };
        }
        function sectionAt(y) {
          const top = [], bot = [], top0 = [], bot0 = [];
          const j = Math.round((y - Y0) / H - 0.5);
          for (let i = 0; i < NX; i++) { const k = idx(i, j); if (has(i, j)) { top.push([cx(i), zt[k]]); bot.push([cx(i), zb[k]]); } if (z0t[k] - z0b[k] > 0.02) { top0.push([cx(i), z0t[k]]); bot0.push([cx(i), z0b[k]]); } }
          return { top, bot, top0, bot0 };
        }
        const autoPlan = () => {
          const out = [];
          for (let pass = 0; pass < 3; pass++) for (let k = 0; k < 18; k++) {
            const phi = (2 * Math.PI * (k + 0.5 * pass)) / 18;
            out.push({ phi, face: (k + pass) % 2 ? 'B' : 'A', depth: [0.42, 0.3, 0.2][pass], soft: pass === 2 });
          }
          return out;
        };
        function strikeDir(phi, face, depth, soft) { // strike the margin in direction phi from the centroid
          let sx = 0, sy = 0, n = 0;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (has(i, j)) { sx += cx(i); sy += cy(j); n++; }
          if (!n) return; const M0 = { g: [sx / n, sy / n] };
          let x = M0.g[0], y = M0.g[1];
          for (let r = 0; r < 12; r += 0.05) { const xx = M0.g[0] + r * Math.cos(phi), yy = M0.g[1] + r * Math.sin(phi); if (!has(Math.floor((xx - X0) / H), Math.floor((yy - Y0) / H))) break; x = xx; y = yy; }
          strike(x, y, face, depth, soft, true);
        }
        // reference: an Oldowan chopper made from the same cobble in the same model
        function chopper() { cobble(); for (const [phi, d] of [[-1.25, 0.45], [-1.57, 0.45], [-1.9, 0.45], [-1.42, 0.3], [-1.72, 0.3]]) strikeDir(phi, 'A', d, false); }
        chopper(); const ref = metrics(); cobble(); for (const p of autoPlan().slice(0, 18)) strikeDir(p.phi, p.face, p.depth, p.soft); msg = 'a first round of flakes has been struck: carry on'; // start part-worked
        const secH = P.handle(6.1, 0, { color: 'orange', constrain: (x, y) => [6.1, clamp(y, -8.6, 8.6)] });
        P.onClick((x, y, mod) => {
          const xx = view.value ? -x : x;
          let face = faceSel.value === 'alt' ? nextFace : faceSel.value;
          if (mod.shift) face = face === 'A' ? 'B' : 'A';
          if (strike(xx, y, face) && faceSel.value === 'alt') nextFace = face === 'A' ? 'B' : 'A';
          v.invalidate();
        });
        v.button('Undo', () => { const st = stack.pop(); if (st) { [zt, zb, nRem, nextFace] = st; ver++; last = null; msg = 'undone'; } });
        v.button('Auto-knap', () => { cobble(); for (const p of autoPlan()) strikeDir(p.phi, p.face, p.depth, p.soft); msg = 'scripted biface: three passes round the margin, alternating faces, last pass with a soft hammer'; });
        v.button('Oldowan chopper', () => { chopper(); msg = 'five flakes off one face at one end'; });
        v.button('New cobble', () => cobble());
        v.render(() => {
          const flip = view.value, F = flip ? zb : zt, sg = flip ? -1 : 1, cP = v.rgb('panel'), cM = v.rgb('muted');
          // plan view: hill-shaded upper (or lower) face
          P.raster((x, y) => {
            const xx = flip ? -x : x, i = Math.floor((xx - X0) / H), j = Math.floor((y - Y0) / H);
            if (!has(i, j)) return null;
            const k = idx(i, j), gx = has(i + 1, j) && has(i - 1, j) ? (F[idx(i + 1, j)] - F[idx(i - 1, j)]) / (2 * H) : 0, gy = has(i, j + 1) && has(i, j - 1) ? (F[idx(i, j + 1)] - F[idx(i, j - 1)]) / (2 * H) : 0;
            const nx = -sg * gx * (flip ? -1 : 1), ny = -sg * gy, nz = 1, L = Math.hypot(nx, ny, nz), lit = (nx * -0.55 + ny * 0.6 + nz * 0.58) / L;
            const z = sg * F[k], t = clamp(0.25 + 0.75 * lit, 0, 1) * (0.8 + 0.1 * z);
            const u = clamp(1.05 - t, 0.1, 1); return [0, 1, 2].map((q) => Math.round(cP[q] + (cM[q] - cP[q]) * u));
          }, { key: `${ver}|${flip}`, res: 2 });
          // margin coloured by edge angle
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isMargin(i, j)) {
            const a = edgeAngle(i, j), c = a < 70 ? 'green' : a < 90 ? 'orange' : 'red', x = flip ? -cx(i) : cx(i);
            P.rect(x - H / 2, cy(j) - H / 2, x + H / 2, cy(j) + H / 2, { fill: c, fillAlpha: 0.95, stroke: false });
          }
          const Mt = metrics();
          if (Mt) {
            const L = 9; P.line((flip ? -1 : 1) * (Mt.g[0] - L * Mt.axis[0]), Mt.g[1] - L * Mt.axis[1], (flip ? -1 : 1) * (Mt.g[0] + L * Mt.axis[0]), Mt.g[1] + L * Mt.axis[1], { color: 'purple', width: 1.2, dash: [6, 4], alpha: 0.8 });
          }
          P.line(-6.6, secH.y, 6.1, secH.y, { color: 'orange', width: 1.4, alpha: 0.9 });
          if (last) P.dot(flip ? -last.x : last.x, last.y, { r: 4, color: last.ok ? 'accent' : 'red' });
          P.corner(flip ? 'face B' : 'face A', 'tl', { size: 12, color: 'ink', weight: 700 });
          // cross-section
          const sec = sectionAt(secH.y);
          Q.line(-6.6, 0, 6.6, 0, { color: 'faint', width: 1, dash: [3, 4] });
          if (sec.top0.length) Q.poly([...sec.top0, ...sec.bot0.slice().reverse()], { color: 'muted', width: 1.2, dash: [5, 4] });
          if (sec.top.length > 1) {
            // contiguous runs only
            Q.poly([...sec.top, ...sec.bot.slice().reverse()], { fill: 'muted', fillAlpha: 0.45, color: 'ink', width: 1.6 });
            const l = sec.top[0], r = sec.top[sec.top.length - 1];
            const jr = Math.round((secH.y - Y0) / H - 0.5), il = Math.round((l[0] - X0) / H - 0.5), ir = Math.round((r[0] - X0) / H - 0.5);
            const aL = edgeAngle(il, jr), aR = edgeAngle(ir, jr);
            Q.text(`${Math.round(aL)}°`, l[0] - 0.15, 0.05, { size: 12, color: aL < 70 ? 'green' : aL < 90 ? 'orange' : 'red', align: 'right', weight: 700 });
            Q.text(`${Math.round(aR)}°`, r[0] + 0.15, 0.05, { size: 12, color: aR < 70 ? 'green' : aR < 90 ? 'orange' : 'red', align: 'left', weight: 700 });
            let tmax = 0; for (let k = 0; k < sec.top.length; k++) tmax = Math.max(tmax, sec.top[k][1] - sec.bot[k][1]);
            Q.text(`width ${v.fix(r[0] - l[0], 1)} cm · thickness ${v.fix(tmax, 1)} cm`, 0, -2.75, { size: 12, color: 'ink', align: 'center' });
          } else Q.text('the section line misses the piece', 0, 0, { size: 12, color: 'muted', align: 'center' });
          Q.text('face A', -6.4, 2.75, { size: 11, color: 'muted', align: 'left' });
          Q.text('face B', -6.4, -2.75, { size: 11, color: 'muted', align: 'left' });
          // score row
          if (Mt) {
            const rows = [['flip-test symmetry', Mt.sym, ref.sym, (x) => `${Math.round(100 * x)}%`, 1],
              ['cutting edge per kg', Mt.sharp / Mt.mass, ref.sharp / ref.mass, (x) => `${Math.round(x)} cm/kg`, 160],
              ['margin sharper than 70°', Mt.sharp / Mt.edge, ref.sharp / ref.edge, (x) => `${Math.round(100 * x)}%`, 1]];
            rows.forEach(([lab, val, rv, fmt, max], k) => {
              const y = 2.5 - k;
              R.text(lab, 0.01, y, { size: 12, color: 'ink', align: 'left' });
              R.rect(0.24, y - 0.3, 0.24 + 0.4 * clamp(val / max, 0, 1), y + 0.02, { fill: 'accent', fillAlpha: 0.7, stroke: false });
              R.rect(0.24, y + 0.02, 0.24 + 0.4 * clamp(rv / max, 0, 1), y + 0.3, { fill: 'orange', fillAlpha: 0.55, stroke: false });
              R.text(`this piece ${fmt(val)}`, 0.67, y - 0.14, { size: 11.5, color: 'accent', align: 'left', weight: 700 });
              R.text(`chopper ${fmt(rv)}`, 0.67, y + 0.16, { size: 11, color: 'orange', align: 'left' });
            });
          }
        });
        v.legend([['green', 'sharp edge (< 70°)'], ['orange', 'flakeable (70–90°)'], ['red', 'too blunt (≥ 90°)'], ['purple', 'long axis (flip test)', { dash: true }]]);
        v.readout(() => {
          const Mt = metrics(); if (!Mt) return 'nothing left — press New cobble';
          return `${msg ? msg + ' · ' : ''}${nRem[0] + nRem[1]} flakes (${nRem[0]} off face A, ${nRem[1]} off face B) · mass **${v.fix(Mt.mass * 1000, 0)} g** · flip-test symmetry **${Math.round(100 * Mt.sym)}%** · sharp edge **${v.fix(Mt.sharp, 0)} cm**, i.e. **${Math.round(Mt.sharp / Mt.mass)} cm per kg** (Oldowan chopper from the same cobble: ${Math.round(ref.sharp / ref.mass)} cm/kg) · next blow: face ${faceSel.value === 'alt' ? nextFace : faceSel.value}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Invention',
      name: 'Control of fire',
      credit: 'Homo erectus or later hominins; fire use by c. 1 million years ago, fire-making by c. 400,000 years ago',
      statement: String.raw`Hominins learned first to keep and use fire, and much later to make it at will. The earliest secure evidence of fire inside an inhabited site is burned bone and plant ash in Acheulean layers of Wonderwerk Cave, South Africa, about 1.0 million years old (Berna et al. 2012). Older claims, such as reddened sediment at Koobi Fora, Kenya (about 1.5 million years), are **contested** because wildfires leave similar traces. Burned seeds, wood and flint at Gesher Benot Ya'aqov, Israel, show repeated fire use about 790,000 years ago (Goren-Inbar et al. 2004), and hearths become common in Europe only after about 400,000 years ago (Roebroeks & Villa 2011). The oldest evidence of **making** fire is at Barnham, England, about 400,000 years ago: heated sediments, fire-cracked hand axes and pyrite, a mineral that throws sparks when struck with flint, brought to a site where it does not occur naturally (Davis et al. 2025).

A fire burns where three things meet, the **fire triangle**: fuel, oxygen and enough heat. It sustains itself only when the heat released by burning exceeds the heat lost to the surroundings at the fire's own temperature. Wood ignites at about 250 °C by glowing and at roughly 300–365 °C with a flame when the heating is slow; reported values span 200–500 °C depending on the heating and the wood (Babrauskas 2002). Water in the wood must be boiled off first and lowers the heat available.`,
      idea: String.raw`Burning is a chemical reaction whose rate rises steeply with temperature (Arrhenius): heat release $G(T)$ climbs from almost nothing to a plateau set by how fast air can bring oxygen in. Heat losses $L(T)$, by convection and radiation, rise smoothly. The curves cross three times (Semenov's picture of thermal runaway, kin-4.12). The cold crossing and the hot crossing are stable; the middle one is the **ignition point**. Heat a patch of fuel past it, with an ember, a friction drill or a spark on tinder, and the fire runs away to the hot state; stop short and it dies back.

Each side of the triangle moves a curve. Fine, dry fuel (tinder) reacts faster, lowering the ignition point. Air sets the plateau: smother a fire and the hot crossing disappears. Moisture costs about 2.4 MJ per kilogram of water against roughly 19 MJ per kilogram of dry wood, and while the water boils the fuel is pinned near 100 °C. Keeping fire gave warmth, light, protection and cooked food. Cooking makes food easier to chew and digest, and Wrangham's hypothesis that it shaped human evolution is debated.`,
      caption: String.raw`**Left:** heat release $G$ (orange) against heat loss $L$ (blue) as functions of the fire's temperature, in kW per m² of fuel bed. Where orange is above blue the fire heats itself. **Drag the gold handle** to set how hot your ember or spark makes the fuel. Past the red ignition point the fire runs away to the green burning state (middle panel); below it the fire dies. Change the fuel, the air supply and the wood's moisture and watch the triangle (bottom left) lose a side. Wet wood stalls near 100 °C while its water boils off.`,
      deps: ['kin-4.12'],
      see: ['pchem-2.14', 'energy-3.1', 'ecol-9.7', 'bighist-4.1'],
      refs: ['Cardwell', 'Berna et al. 2012, PNAS 109:E1215', 'Davis et al. 2025, Nature (doi 10.1038/s41586-025-09855-6)', 'Babrauskas 2002, J. Fire Prot. Eng. 12:163'],
      tags: ['prehistory', 'combustion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Control_of_fire_by_early_humans' },
      viz(v) {
        const SIG = 5.67e-8, T0 = 293, TH = 650, ER = 12000, GMAX = 150, CAP = 5, LV = 2260, BETA = 0.06;
        const A = v.stage({ x: [0, 1300], y: [0, 180], axes: 'box', gutter: true, height: 290, weight: 1.35, minWidth: 400, xlabel: 'temperature (°C)', ylabel: 'kW per m²', title: 'heat released and heat lost' });
        const B = v.stage({ x: [0, 150], y: [0, 1300], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 300, xlabel: 'time (s)', ylabel: 'temperature (°C)', title: 'what the fire does' });
        const C = v.stage({ x: [-1.25, 1.25], y: [-0.95, 1.2], equal: true, axes: false, height: 190, weight: 0.6, minWidth: 220, title: 'the fire triangle' });
        const D = evidenceStage(v, [2e6, 3e4], { height: 190, weight: 1.6, minWidth: 420, title: 'fire in the archaeological record (years ago, log scale)' });
        const fuelSel = v.select('fuel', [{ value: 3, label: 'dry grass tinder' }, { value: 1, label: 'kindling' }, { value: 0.3, label: 'thick logs' }], 1);
        const airS = v.slider('air supply (draft)', 0, 1, 0.8, { step: 0.01 });
        const wetS = v.slider('moisture in the wood', 0, 0.7, 0.15, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const hS = A.handle(380, 4, { color: 'gold', label: 'spark / ember', labelPos: 'n', constrain: (x) => [clamp(x, 20, 1250), 4] });
        const lhv = () => (18.7 * (1 - wetS.value) - 2.44 * wetS.value) / 18.7; // lower heating value relative to dry wood
        const G = (Tc) => { const T = Tc + 273, d = Math.max(airS.value, 1e-4), x = (fuelSel.value / d) * Math.exp(ER * (1 / TH - 1 / T)); return Math.max(0, GMAX * airS.value * lhv() * x / (1 + x)); };
        const L = (Tc) => { const T = Tc + 273; return 0.015 * (T - T0) + (0.6 * SIG * (T ** 4 - T0 ** 4)) / 1000; };
        function crossings() {
          const out = []; let prev = G(21) - L(21);
          for (let T = 22; T <= 1300; T += 1) { const d = G(T) - L(T); if (d * prev < 0 || (d === 0 && prev !== 0)) out.push({ T: T - 0.5, stable: d < prev }); prev = d; }
          return out;
        }
        function run(Tstart) { // C dT/dt = G − L − evaporation; water boils off at 100 °C
          const w = wetS.value, pts = []; let T = Tstart, W = (3 * w) / (1 - w), t = 0; const dt = 0.05;
          pts.push([0, T]);
          for (let k = 0; k < 3000; k++) {
            const ev = T > 100 && W > 0 ? BETA * W * (T - 100) + 2 * W : 0;
            let dT = (G(T) - L(T) - ev) / CAP;
            if (W > 0 && T > 100) W = Math.max(0, W - (ev * dt) / LV * 40);
            T = clamp(T + dT * dt, 20, 1400); t += dt;
            if (k % 10 === 9) pts.push([t, T]);
          }
          return pts;
        }
        v.render(() => {
          const X = crossings(), ign = X.find((c) => !c.stable), burn = [...X].reverse().find((c) => c.stable && c.T > 150);
          // ---- A
          A.vband(250, 365, { color: 'red', alpha: 0.08 });
          A.text('wood ignites', 307, 172, { size: 10.5, color: 'red', align: 'center' });
          A.fn(G, { color: 'orange', width: 2.6, domain: [20, 1300] });
          A.fn(L, { color: 'blue', width: 2.2, domain: [20, 1300] });
          A.clip(() => { A.between((T) => Math.max(G(T), L(T)), L, 20, 1300, { fill: 'green', fillAlpha: 0.16 }); });
          if (ign) { A.dot(ign.T, L(ign.T), { r: 5.5, color: 'red', hollow: true }); A.text(`ignition ${Math.round(ign.T)} °C`, ign.T + 18, L(ign.T) + 14, { size: 11.5, color: 'red', align: 'left' }); }
          if (burn) { A.dot(burn.T, L(burn.T), { r: 6, color: 'green' }); A.text(`burning ${Math.round(burn.T)} °C`, burn.T - 12, L(burn.T) + 14, { size: 11.5, color: 'green', align: 'right', weight: 700 }); }
          A.text('G: heat released', 1290, Math.min(170, G(1290) + 9), { size: 11.5, color: 'orange', align: 'right' });
          A.text('L: heat lost', 1290, Math.min(176, L(1290)) - 10, { size: 11.5, color: 'blue', align: 'right', baseline: 'top' });
          A.line(hS.x, 0, hS.x, 180, { color: 'gold', width: 1, dash: [4, 4] });
          // ---- B
          const pts = run(hS.x), Tend = pts[pts.length - 1][1], lit = Tend > 150;
          B.hline(100, { color: 'faint', dash: [3, 4] }); B.text('water boils', 148, 108, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          if (ign) { B.hline(ign.T, { color: 'red', dash: [5, 4], width: 1 }); B.text('ignition point', 148, ign.T + 8, { size: 10.5, color: 'red', align: 'right', baseline: 'bottom' }); }
          B.path(pts, { color: lit ? 'orange' : 'blue', width: 2.6 });
          B.text(lit ? 'the fire takes hold' : 'the fire dies', 75, lit ? Math.min(1240, Tend + 40) : Math.max(60, Tend + 60), { size: 12.5, color: lit ? 'orange' : 'blue', align: 'center', weight: 700 });
          // ---- C: the triangle
          const P = [[0, 1.0], [-0.95, -0.65], [0.95, -0.65]], sides = [[P[1], P[2], 'fuel', fuelSel.value / 3, 0, -0.84], [P[0], P[1], 'oxygen', airS.value, -0.82, 0.32], [P[2], P[0], 'heat', clamp(hS.x / 600, 0, 1), 0.82, 0.32]];
          for (const [p, q, lab, val, lx, ly] of sides) {
            C.line(p[0], p[1], q[0], q[1], { color: val > 0.05 ? 'orange' : 'faint', width: 2 + 8 * val, alpha: 0.35 + 0.65 * val });
            C.text(lab, lx, ly, { size: 12, color: 'ink', align: 'center' });
          }
          if (lit) { const fl = [[0, 0.45], [-0.2, -0.25], [0, -0.38], [0.2, -0.25]]; C.poly(fl, { fill: 'orange', fillAlpha: 0.8, stroke: false }); C.poly([[0, 0.12], [-0.09, -0.24], [0, -0.32], [0.09, -0.24]], { fill: 'gold', fillAlpha: 0.95, stroke: false }); }
          else C.text('out', 0, -0.1, { size: 14, color: 'muted', align: 'center', weight: 700 });
          // ---- D
          drawEvidence(v, D, [
            { ago: 1.5e6, label: 'Koobi Fora', contested: true },
            { ago: 1.0e6, label: 'Wonderwerk Cave' },
            { ago: 7.9e5, label: 'Gesher Benot Ya‘aqov' },
            { ago: 4.0e5, label: 'Barnham: fire-making', color: 'orange' },
            { ago: [3e5, 4e5], label: 'hearths common in Europe' },
            { ago: 5e4, label: 'Neanderthal strike-a-lights' },
          ], { lanes: 3, laneH: 0.22 });
        });
        v.legend([['orange', 'heat released $G(T)$'], ['blue', 'heat lost $L(T)$'], ['green', 'fire heats itself', { area: true }], ['red', 'wood ignition range (250–365 °C)', { area: true }]]);
        v.readout(() => {
          const X = crossings(), ign = X.find((c) => !c.stable), burn = [...X].reverse().find((c) => c.stable && c.T > 150);
          const pts = run(hS.x), lit = pts[pts.length - 1][1] > 150;
          const heat = `${v.fix(18.7 * lhv(), 1)} MJ per kg of wood (dry wood 18.7)`;
          if (!burn) return `**no self-sustaining fire** with this fuel and air: the loss curve stays above the release curve at every temperature · heat available ${heat}`;
          return `ignition point **${Math.round(ign.T)} °C**, burning state **${Math.round(burn.T)} °C** · start at ${Math.round(hS.x)} °C → **${lit ? 'the fire takes hold' : 'it dies back'}** · heat available ${heat}`;
        });
      },
    },
  ],
};
