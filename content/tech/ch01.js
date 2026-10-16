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
  ],
};
