// Visual Art & Color — Chapter 1: Linear perspective (items 1.9–1.16)
import { camera, seg3, boxMesh, drawSolids, meet, lineDist, gridLines, drawFigure, clipSeg2 } from './ch01.shared.js';

const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
/** Orthocentre of the triangle abc (null if degenerate). */
const ortho = (a, b, c) => meet(a, [a[0] - (c[1] - b[1]), a[1] + (c[0] - b[0])], b, [b[0] - (c[1] - a[1]), b[1] + (c[0] - a[0])]);
/** Clip drawing to a polygon given in stage coordinates. */
function clipPoly(S, pts, fn) {
  const c = S.ctx; c.save(); c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(S.X(p[0]), S.Y(p[1])) : c.moveTo(S.X(p[0]), S.Y(p[1]))));
  c.closePath(); c.clip();
  try { fn(); } finally { c.restore(); }
}

export default {
  collection: 'art',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Method',
      name: 'Three-point perspective',
      statement: String.raw`When the picture plane is tilted, as when looking up at a tower, the vertical edges also converge, to a third vanishing point $V_3$ above (or below) the horizon: **three-point perspective**. For the three mutually perpendicular edge directions of a box, the vanishing points $V_1,V_2,V_3$ form an acute triangle whose orthocentre is the principal point $H$, the foot of the perpendicular from the eye. The eye’s distance $d$ from the picture satisfies
$$d^2=-\overrightarrow{HV_i}\cdot\overrightarrow{HV_j}\qquad(i\neq j).$$
Conversely, three points forming a right or obtuse triangle cannot be the vanishing points of three perpendicular directions.`,
      idea: String.raw`The sight lines from the eye $E$ to the vanishing points are parallel to the three edges (art-1.4), so they are mutually perpendicular. Writing $E=H+d\,\mathbf n$ with $\mathbf n$ normal to the picture, $(V_i-E)\cdot(V_j-E)=0$ becomes $(V_i-H)\cdot(V_j-H)+d^2=0$. Subtracting two of these equations gives $(V_1-H)\cdot(V_2-V_3)=0$: $H$ lies on the altitude from $V_1$, and likewise on the other two, so it is the orthocentre. All three products are negative, and $d$ is real, only when the orthocentre lies inside the triangle, that is when the triangle is acute. Two-point perspective (art-1.8) is the limit in which $V_3$ runs off to infinity.`,
      caption: String.raw`Tilt the camera with the slider, or drag any of the three vanishing points. The tower is redrawn by the camera those points imply: its principal point is the orthocentre $H$, where the dashed altitudes meet, and its eye distance $d$ comes from the dot products. Drag a vertex until the triangle is obtuse: no camera can produce that picture.`,
      deps: ['art-1.8'],
      refs: ['Kemp ch. 3'],
      tags: ['perspective', 'three-point', 'orthocentre'],
      viz(v) {
        const M = v.M;
        const pic = v.stage({ x: [-7.2, 7.2], y: [-5.2, 7.4], equal: true, axes: false, height: 430, title: 'looking up at a tower' });
        const fromCam = (pitch) => {
          const C = camera([0, 0, 0], { yaw: rad(35), pitch: rad(pitch), d: 3.4 });
          return [C.vp([0, 1, 0]), C.vp([1, 0, 0]), C.vp([0, 0, 1])];
        };
        const P0 = fromCam(28);
        const Vh = P0.map((p, i) => pic.handle(p[0], p[1], { color: ['orange', 'accent', 'purple'][i], label: `$V_${i + 1}$`, labelPos: i === 2 ? 'e' : 'n' }));
        v.slider('camera tilt (looking up)', 8, 60, 28, { step: 1, fmt: (x) => `${x}°`, onChange: (t) => { fromCam(t).forEach((p, i) => Vh[i].set(p[0], p[1])); } });
        const solve = () => {
          const V = Vh.map((h) => [h.x, h.y]), H = ortho(V[0], V[1], V[2]);
          if (!H) return { V, ok: false };
          const dots = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => (V[i][0] - H[0]) * (V[j][0] - H[0]) + (V[i][1] - H[1]) * (V[j][1] - H[1]));
          const d2 = -dots[0];
          if (!(d2 > 1e-6) || dots.some((x) => x >= 0)) return { V, H, ok: false, dots };
          const d = Math.sqrt(d2);
          let R = V.map((p) => M.normalize([p[0] - H[0], d, p[1] - H[1]])); // camera axes: [right, depth, up]
          if (M.dot(M.cross3(R[0], R[1]), R[2]) < 0) R = [R[1], R[0], R[2]];
          return { V, H, d, R, ok: true, dots };
        };
        v.render(() => {
          const s = solve(), [V1, V2, V3] = s.V, bx = pic.bounds.x, by = pic.bounds.y;
          if (s.ok) {
            const { H, d, R } = s;
            const map = (P) => (P[1] > 0.05 ? [H[0] + (d * P[0]) / P[1], H[1] + (d * P[2]) / P[1]] : null);
            const W = (a, b, c) => [0, 1, 2].map((k) => a * R[0][k] + b * R[1][k] + c * R[2][k]); // world (a, b, height) → camera
            // ground below the horizon V1V2
            const yl = V1[1] + ((bx[0] - V1[0]) * (V2[1] - V1[1])) / (V2[0] - V1[0]), yr = V1[1] + ((bx[1] - V1[0]) * (V2[1] - V1[1])) / (V2[0] - V1[0]);
            pic.poly([[bx[0], yl], [bx[1], yr], [bx[1], by[0] - 5], [bx[0], by[0] - 5]], { fill: 'faint', fillAlpha: 0.13, stroke: false });
            const f = [R[0][1], R[1][1]], fn = Math.hypot(f[0], f[1]) || 1, c0 = [(11 * f[0]) / fn, (11 * f[1]) / fn];
            for (let k = -10; k <= 10; k += 2) {
              for (const [p, q] of [[W(c0[0] + k, c0[1] - 10, -1.6), W(c0[0] + k, c0[1] + 10, -1.6)], [W(c0[0] - 10, c0[1] + k, -1.6), W(c0[0] + 10, c0[1] + k, -1.6)]]) {
                const A = map(p), B = map(q); if (A && B) pic.line(A[0], A[1], B[0], B[1], { color: 'faint', width: 0.8 });
              }
            }
            const box = boxMesh([0, 0, 0], [5.5, 5.5, 26]);
            const mesh = { ...box, V: box.V.map(([a, b, c]) => W(c0[0] + a, c0[1] + b, c - 1.6)) };
            drawSolids(pic, map, [0, 0, 0], [{ mesh, color: 'teal', alpha: 0.06 }]);
            for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0]]) { // storeys on the faces turned toward the eye
              const a = mesh.V[i], b = mesh.V[j], n = M.cross3(M.vsub(b, a), M.vsub(mesh.V[i + 4], a)), mid = M.vlerp(a, b, 0.5);
              if (M.dot(mid, n) >= 0) continue;
              for (let z = 3; z < 26; z += 3) { const A = map(M.vadd(a, M.vscale(R[2], z))), B = map(M.vadd(b, M.vscale(R[2], z))); if (A && B) pic.line(A[0], A[1], B[0], B[1], { color: 'teal', width: 1 }); }
            }
            // altitudes and the principal point
            for (const [p, a, b] of [[V1, V2, V3], [V2, V1, V3], [V3, V1, V2]]) { const foot = meet(a, b, p, [p[0] - (b[1] - a[1]), p[1] + (b[0] - a[0])]); if (foot) pic.line(p[0], p[1], foot[0], foot[1], { color: 'muted', width: 1, dash: [4, 4] }); }
            pic.dot(H[0], H[1], { r: 5, color: 'green', label: 'H', labelPos: 'sw' });
          }
          pic.poly([V1, V2, V3], { color: s.ok ? 'ink' : 'red', width: s.ok ? 1.2 : 2.2, fill: s.ok ? null : 'red', fillAlpha: 0.06 });
          pic.text('horizon', V2[0] + 0.3, V2[1] - 0.1, { align: 'left', baseline: 'top', size: 11, color: 'muted' });
          if (!s.ok) pic.corner('obtuse triangle: no eye sees these three directions at right angles', 'tl', { color: 'red', weight: 600, size: 12 });
        });
        v.legend([['green', 'principal point $H$ = orthocentre', { dot: true }], ['muted', 'altitudes', { dash: true }], ['teal', 'tower']]);
        v.readout(() => {
          const s = solve();
          if (!s.ok) return `the dot products $\\overrightarrow{HV_i}\\cdot\\overrightarrow{HV_j}$ are $${(s.dots || []).map((x) => v.fix(x, 2)).join(',\\ ')}$: not all negative, so no real eye distance exists`;
          const ang = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => deg(Math.acos(M.clamp(M.dot(s.R[i], s.R[j]), -1, 1))));
          const tilt = deg(Math.asin(M.clamp(s.R[2][1], -1, 1)));
          return `$\\overrightarrow{HV_i}\\cdot\\overrightarrow{HV_j} = ${s.dots.map((x) => v.fix(x, 3)).join(',\\ ')}$, so $d = ${v.fix(s.d, 3)}$ · angles between the three edge directions $${ang.map((a) => v.fix(a, 2)).join('°,\\ ')}°$ · the picture plane is tilted $${v.fix(tilt, 1)}°$ from vertical`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Viewing distance and the correct viewpoint',
      statement: String.raw`A perspective picture is exact from one point only, the **station point**: on the perpendicular through the centric point $C$, at the distance $d$ used to construct the picture. The picture itself records that point: in a picture of a square-tiled floor, the diagonals of the tiles meet the horizon at two *distance points*, each at distance $d$ from $C$.

A viewer standing elsewhere who takes the picture as a window reconstructs a different scene: standing nearer than $d$ compresses its depth, standing farther stretches it, and standing to one side shears it so that lines running straight back still point at the viewer.`,
      idea: String.raw`Each picture point fixes only a direction from the eye. A viewer at $V$, eye at the horizon’s height, who assumes that every floor point lies where his ray through the picture meets the ground, places the floor point that was at $(X,Y)$ at
$$\Bigl(X-\tfrac{v_x}{d}\,Y,\ \ \tfrac{v_d}{d}\,Y\Bigr),$$
where $v_x$ is his sideways offset and $v_d$ his distance (art-1.2); heights come out unchanged. Squares become rectangles or parallelograms. The tile diagonals vanish at distance $d$ from $C$ (art-1.7), so the picture tells the viewer where to stand. Real viewers compensate for much of the error when they can see the picture surface, which is why paintings survive being seen from the wrong place; the distortion becomes obvious when that cue is removed, as with a peephole (art-1.3).`,
      caption: String.raw`Left: the picture, with the tile diagonals carried to the two distance points, which give the correct viewing distance. Right: the floor plan that a viewer at the blue point reconstructs (blue), over the true floor (grey). Drag yourself closer, farther or sideways, or pick a position: the squares stretch, compress and shear, and they are squares again only at the station point.`,
      deps: ['art-1.7'],
      refs: ['Kemp ch. 1'],
      tags: ['perspective', 'viewpoint', 'distance point'],
      viz(v) {
        const M = v.M, d0 = 3, h0 = 1.5, FW = 2.4, FH = 2.4;
        const pic = v.stage({ x: [-3.5, 3.5], y: [-0.15, 2.55], equal: true, axes: false, height: 330, weight: 1.2, title: 'the picture and its distance points' });
        const plan = v.stage({ x: [-4.3, 4.3], y: [-6.3, 15.5], equal: true, axes: false, height: 330, weight: 0.8, minWidth: 230, title: 'the floor you reconstruct (plan)' });
        const spots = { station: [0, -3], closer: [0, -1.5], farther: [0, -5.5], side: [2.2, -3] };
        const V = plan.handle(0, -3, { color: 'accent', label: 'you', labelPos: 'e', constrain: (x, y) => [M.clamp(x, -3.2, 3.2), M.clamp(y, -6, -1.2)] });
        v.select('stand', [{ value: 'station', label: 'at the station point' }, { value: 'closer', label: 'closer' }, { value: 'farther', label: 'farther' }, { value: 'side', label: 'to the side' }], 'station', { onChange: (k) => V.set(...spots[k]) });
        const pp = (X, Y, Z = 0) => [(X * d0) / (Y + d0), h0 + ((Z - h0) * d0) / (Y + d0)]; // picture point of a floor/scene point
        const back = (q) => { const vx = V.x, vd = -V.y, s = h0 / (h0 - q[1]); return [vx + s * (q[0] - vx), vd * (s - 1)]; }; // the viewer's reconstruction
        const cubes = [[-1.8, 2, 1, 1], [0.6, 4.5, 1.2, 1.2]]; // x0, y0, side, height
        v.render(() => {
          // ---- picture
          pic.rect(-FW, 0, FW, FH, { fill: 'orange', fillAlpha: 0.04, color: 'orange', width: 1.6 });
          pic.clip(() => {
            for (let X = -6; X <= 6; X++) { const a = pp(X, 0), b = pp(X, 30); pic.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 0.9, alpha: 0.7 }); }
            for (let Y = 0; Y <= 30; Y++) { const a = pp(-8, Y), b = pp(8, Y); pic.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 0.9, alpha: 0.7 }); }
            drawSolids(pic, (P) => pp(P[0], P[1], P[2]), [0, -d0, h0], cubes.map(([x, y, s, hh], i) => ({ mesh: boxMesh([x + s / 2, y + s / 2, 0], [s, s, hh]), color: i ? 'purple' : 'teal' })));
          }, [-FW, FW], [0, FH]);
          pic.line(-3.5, h0, 3.5, h0, { color: 'muted', width: 1, dash: [5, 4] });
          for (const sg of [1, -1]) { // tile diagonals through corners (∓2, 0), (∓1, 1), … carried to the distance points
            const a = pp(-2 * sg, 0); pic.line(a[0], a[1], sg * d0, h0, { color: 'green', width: 1.3, dash: [5, 3] });
            for (let j = 0; j <= 4; j++) { const q = pp((-2 + j) * sg, j); pic.dot(q[0], q[1], { r: 2.6, color: 'green' }); }
            pic.dot(sg * d0, h0, { r: 5, color: 'green' });
          }
          pic.text('D', -d0 - 0.12, h0 + 0.12, { align: 'right', baseline: 'bottom', math: true, size: 15, color: 'green' });
          pic.text('D', d0 + 0.12, h0 + 0.12, { align: 'left', baseline: 'bottom', math: true, size: 15, color: 'green' });
          pic.dot(0, h0, { r: 4, color: 'accent', label: 'C', labelPos: 'n' });
          pic.measure(0, h0 + 0.3, d0, h0 + 0.3, 'd', { color: 'green' });
          // ---- plan: true floor, reconstructed floor, viewer
          plan.line(-FW, 0, FW, 0, { color: 'orange', width: 3 });
          plan.text('picture', 3.2, -0.1, { align: 'left', baseline: 'top', size: 10.5, color: 'orange' });
          for (let X = -3; X <= 3; X++) plan.line(X, 0, X, 10, { color: 'faint', width: 1 });
          for (let Y = 0; Y <= 10; Y++) plan.line(-3, Y, 3, Y, { color: 'faint', width: 1 });
          const R = (X, Y) => back(pp(X, Y));
          for (let X = -3; X <= 3; X++) { const a = R(X, 0), b = R(X, 10); plan.line(a[0], a[1], b[0], b[1], { color: 'accent', width: 1.2 }); }
          for (let Y = 0; Y <= 10; Y++) { const a = R(-3, Y), b = R(3, Y); plan.line(a[0], a[1], b[0], b[1], { color: 'accent', width: 1.2 }); }
          cubes.forEach(([x, y, s], i) => {
            plan.rect(x, y, x + s, y + s, { color: 'faint', width: 1.4, dash: [3, 3] });
            plan.poly([R(x, y), R(x + s, y), R(x + s, y + s), R(x, y + s)], { fill: i ? 'purple' : 'teal', fillAlpha: 0.3, color: i ? 'purple' : 'teal', width: 1.4 });
          });
          plan.dot(0, -d0, { r: 4.5, color: 'green' });
          plan.text('station point', -0.45, -d0, { align: 'right', size: 10.5, color: 'green' });
          plan.line(V.x, V.y, 0, 0, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.7 });
        });
        v.legend([['green', 'tile diagonals and distance points $D$'], ['faint', 'true floor (plan)'], ['accent', 'floor as you reconstruct it']]);
        v.readout(() => {
          const vx = V.x, vd = -V.y, a = back(pp(-1.8, 2)), b = back(pp(-0.8, 2)), c = back(pp(-1.8, 3));
          const w = Math.hypot(b[0] - a[0], b[1] - a[1]), dp = Math.abs(c[1] - a[1]), sh = (c[0] - a[0]) / dp;
          return `distance points $${v.fix(d0, 2)}$ from $C$: the station point is $${v.fix(d0, 2)}$ in front of $C$ · you stand $${v.fix(vd, 2)}$ away, $${v.fix(vx, 2)}$ to the side · the near cube comes out $${v.fix(w, 2)}$ wide, $${v.fix(dp, 2)}$ deep (ratio $v_d/d = ${v.fix(vd / d0, 2)}$) and sheared by $${v.fix(sh, 2)}$ $(=-v_x/d)$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Marginal distortion: spheres become ellipses',
      statement: String.raw`In a perspective picture on a flat plane, a sphere is drawn as a circle only when it lies on the central axis. Elsewhere its outline is an ellipse whose long axis points at the principal point. For a sphere that subtends the half-angle $\alpha$ and lies at the angle $\theta$ off the axis, the ratio of the axes is
$$\frac{\cos\alpha}{\sqrt{\cos^2\theta-\sin^2\alpha}}\;\approx\;\frac{1}{\cos\theta}.$$
The stretching grows without bound toward $90^\circ$, so wide-angle pictures smear spheres, faces and columns near their edges. From the exact station point the ellipses look round again, but at ordinary viewing distances they look wrong, and painters have often drawn off-axis spheres as circles anyway; the globes held by Ptolemy and Zoroaster in Raphael’s *School of Athens* are the classic case.`,
      idea: String.raw`The rays from the eye that graze a sphere form a circular cone around the line of sight to its centre (art-1.1), and the picture of the sphere is the section of that cone by the picture plane (art-1.2). For a sphere straight ahead the plane cuts the cone at right angles and the section is a circle; for a sphere at angle $\theta$ the cut is oblique, and an oblique section of a circular cone is an ellipse, stretched about $1/\cos\theta$ times along the radial direction. The cross-section on the right shows the chord on the picture line growing toward the margin even though every sphere subtends the same angle. The retina, curved around the eye, receives every sphere as a round patch, which is why the ellipses look wrong (art-1.10).`,
      caption: String.raw`Change the horizontal field of view; all the spheres are identical and equally far from the eye. Drag the gold sphere anywhere in the picture: its outline is computed by projecting the circle along which the tangent cone touches it, and the readout compares the measured axis ratio with the formula. Switch on the painter’s circles to compare.`,
      deps: ['art-1.10'],
      refs: ['Kemp ch. 2'],
      tags: ['perspective', 'distortion', 'wide angle'],
      viz(v) {
        const M = v.M, L = 3, r = 0.32, sa = r / L;
        const pic = v.stage({ x: [-1.06, 1.06], y: [-0.66, 0.66], equal: true, axes: false, height: 330, weight: 1.25, title: 'identical spheres on a flat picture' });
        const top = v.stage({ x: [-3.2, 3.2], y: [-0.25, 3.55], equal: true, axes: false, height: 330, weight: 0.75, minWidth: 230, title: 'from above: the tangent rays' });
        const fov = v.slider('horizontal field of view', 30, 150, 110, { step: 1, fmt: (x) => `${x}°` });
        const circ = v.toggle('painter’s circles', false);
        const gold = pic.handle(0.86, 0.36, { color: 'gold', constrain: (x, y) => [M.clamp(x, -1, 1), M.clamp(y, -0.62, 0.62)] });
        const grid = []; for (const gz of [-0.42, 0, 0.42]) for (const gx of [-0.8, -0.4, 0, 0.4, 0.8]) grid.push([gx, gz]);
        const outline = (c, d) => {
          const Lc = Math.hypot(...c), cc = c.map((x) => x * (1 - (r * r) / (Lc * Lc))), rho = r * Math.sqrt(1 - (r * r) / (Lc * Lc));
          const n = M.normalize(c), e1 = M.normalize(M.cross3(n, Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e2 = M.cross3(n, e1);
          const pts = [];
          for (let k = 0; k < 240; k++) { const t = (2 * Math.PI * k) / 240, p = cc.map((x, i) => x + rho * (Math.cos(t) * e1[i] + Math.sin(t) * e2[i])); if (p[1] <= 1e-6) return null; pts.push([(d * p[0]) / p[1], (d * p[2]) / p[1]]); }
          return pts;
        };
        const centreOf = (g, d) => M.normalize([g[0], d, g[1]]).map((x) => x * L);
        const measure = (pts, c) => { // the outline is symmetric about the radial line through the principal point
          const m = pts.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map((x) => x / pts.length), rr = Math.hypot(c[0], c[2]);
          const e = rr < 1e-9 ? [1, 0] : [c[0] / rr, c[2] / rr], q = [-e[1], e[0]];
          const pe = pts.map((p) => p[0] * e[0] + p[1] * e[1]), pq = pts.map((p) => p[0] * q[0] + p[1] * q[1]);
          return { a: (Math.max(...pe) - Math.min(...pe)) / 2, b: (Math.max(...pq) - Math.min(...pq)) / 2, m, e };
        };
        const sphere = (c, d, col, strong) => {
          const pts = outline(c, d); if (!pts) return null;
          const me = measure(pts, c);
          pic.poly(pts, { fill: col, fillAlpha: strong ? 0.35 : 0.22, color: col, width: strong ? 2 : 1.3 });
          if (me.a / me.b > 1.02) pic.line(me.m[0] - me.e[0] * me.a, me.m[1] - me.e[1] * me.a, me.m[0] + me.e[0] * me.a, me.m[1] + me.e[1] * me.a, { color: col, width: 1, dash: [3, 3] });
          if (circ.value) { const q = [(d * c[0]) / c[1], (d * c[2]) / c[1]]; pic.circle(q[0], q[1], me.b, { color: 'green', width: 1.6, dash: [5, 3] }); }
          return me;
        };
        v.render(() => {
          const F = rad(fov.value), d = 1 / Math.tan(F / 2);
          pic.rect(-1, -0.625, 1, 0.625, { color: 'orange', width: 1.4, fill: 'orange', fillAlpha: 0.03 });
          pic.line(-1, 0, 1, 0, { color: 'faint', width: 1, dash: [4, 4] }); pic.line(0, -0.625, 0, 0.625, { color: 'faint', width: 1, dash: [4, 4] });
          pic.clip(() => { for (const g of grid) sphere(centreOf(g, d), d, 'accent', false); sphere(centreOf([gold.x, gold.y], d), d, 'gold', true); }, [-1, 1], [-0.625, 0.625]);
          // ---- top view: eye, picture line, the middle row of spheres and their tangent rays
          const yp = 1.3, half = yp * Math.tan(F / 2);
          for (const s of [-1, 1]) top.line(0, 0, s * 3.4 * Math.sin(F / 2), 3.4 * Math.cos(F / 2), { color: 'faint', width: 1, dash: [4, 4] });
          top.line(-half, yp, half, yp, { color: 'orange', width: 2.6 });
          for (const g of grid.filter((g) => g[1] === 0)) {
            const c = centreOf(g, d), outer = Math.abs(g[0]) > 0.7 && g[0] > 0, mid = g[0] === 0;
            top.circle(c[0], c[1], r, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.2 });
            if (!outer && !mid) continue;
            const ang = Math.atan2(c[0], c[1]), al = Math.asin(sa), col = outer ? 'red' : 'green', hits = [];
            for (const sg of [-1, 1]) {
              const a = ang + sg * al, tl = Math.sqrt(L * L - r * r);
              top.line(0, 0, tl * Math.sin(a), tl * Math.cos(a), { color: col, width: 1, alpha: 0.8 });
              hits.push(yp * Math.tan(a));
            }
            top.line(hits[0], yp, hits[1], yp, { color: col, width: 5, alpha: 0.85 });
          }
          top.dot(0, 0, { r: 4.5, color: 'ink', label: 'eye', labelPos: 's' });
          top.text('picture line', -half - 0.1, yp + 0.12, { align: 'left', baseline: 'bottom', size: 10.5, color: 'orange' });
        });
        v.legend([['gold', 'the sphere you drag', { area: true }], ['green', 'chord of the centre sphere'], ['red', 'chord of the outer sphere']]);
        v.readout(() => {
          const F = rad(fov.value), d = 1 / Math.tan(F / 2), c = centreOf([gold.x, gold.y], d), pts = outline(c, d);
          const th = Math.acos(c[1] / L), me = measure(pts, c), al = Math.asin(sa);
          const pred = Math.cos(al) / Math.sqrt(Math.cos(th) ** 2 - Math.sin(al) ** 2);
          return `gold sphere $${v.fix(deg(th), 1)}°$ off the axis: measured axis ratio $${v.fix(me.a / me.b, 3)}$ · formula $\\cos\\alpha/\\sqrt{\\cos^2\\theta-\\sin^2\\alpha} = ${v.fix(pred, 3)}$ · $1/\\cos\\theta = ${v.fix(1 / Math.cos(th), 3)}$ (each sphere subtends $2\\alpha = ${v.fix(2 * deg(al), 1)}°$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'The cross-ratio survives projection',
      credit: 'Pappus of Alexandria (c. 320); Möbius 1827, Chasles 1837',
      statement: String.raw`Let four points $A,B,C,D$ lie on a line, at signed positions $a,b,c,d$ along it. Their **cross-ratio**
$$(A,B;C,D)=\frac{(c-a)(d-b)}{(c-b)(d-a)}$$
is unchanged by central projection: if the four points are projected from any centre $O$ onto any other line, the images $A',B',C',D'$ have the same cross-ratio. Lengths, ratios of lengths and midpoints are not preserved; the cross-ratio is the simplest quantity that is. In particular, four equally spaced points (fence posts, columns) have cross-ratio $4/3$ in every perspective picture.`,
      idea: String.raw`Express each length through the area of a triangle with apex $O$: $\overline{XY}=OX\cdot OY\,\sin\angle XOY/h$, where $h$ is the distance from $O$ to the line. In the cross-ratio the distances $OX$ and $h$ cancel, leaving
$$\frac{\sin\angle AOC\,\sin\angle BOD}{\sin\angle BOC\,\sin\angle AOD},$$
which depends only on the four rays through $O$. So every line cutting those rays, in particular the picture of the original line (art-1.2), shows the same value. Pappus knew the invariance; Möbius and Chasles made it a cornerstone of projective geometry.`,
      caption: String.raw`In “projection”, drag the four points along the bottom line, the centre $O$, and the ends of the two other lines: distances and their ratios change from line to line, the cross-ratio does not. In “colonnade”, equally spaced columns are pictured at uneven spacings, but any four in a row have cross-ratio $4/3$, which predicts where the next column must stand; drag the vanishing point and the first column.`,
      deps: ['art-1.2'],
      see: ['top-2.17'],
      refs: ['Kemp App. I'],
      tags: ['projective geometry', 'cross-ratio'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-5.2, 5.2], y: [-3.3, 3.6], equal: true, axes: false, height: 400 });
        const mode = v.select('', [{ value: 'proj', label: 'projection' }, { value: 'col', label: 'colonnade' }], 'proj');
        const Y0 = -2.6, cr = (a, b, c, d) => ((c - a) * (d - b)) / ((c - b) * (d - a));
        const P = [-3.6, -1.9, 0.2, 3.1].map((x, i) => S.handle(x, Y0, { color: 'accent', label: 'ABCD'[i], labelPos: 's', constrain: 'x' }));
        const O = S.handle(-1.2, 3.0, { color: 'ink', label: 'O', labelPos: 'n' });
        const m1 = S.handle(-4.6, 1.6, { color: 'orange' }), m2 = S.handle(4.4, -0.4, { color: 'orange' });
        const n1 = S.handle(-4.4, -1.55, { color: 'purple' }), n2 = S.handle(4.6, 0.15, { color: 'purple' });
        // colonnade mode: eye height 1.6, picture distance 2.4, horizon drawn at y = 1.4
        const HZ = 1.4, cam = camera([0, 0, 1.6], { d: 2.4 });
        const vpH = S.handle(3.0, HZ, { color: 'green', label: 'V', labelPos: 'n', constrain: (x) => [M.clamp(x, -5, 5), HZ] });
        const b0 = S.handle(-2.6, -2.2, { color: 'accent', label: 'first column', labelPos: 'w', constrain: (x, y) => [x, Math.min(y, HZ - 0.25)] });
        const projHandles = [...P, O, m1, m2, n1, n2], colHandles = [vpH, b0];
        const onLine = (X, a, b) => meet([O.x, O.y], X, a, b);
        const tpar = (X, a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return ((X[0] - a[0]) * (b[0] - a[0]) + (X[1] - a[1]) * (b[1] - a[1])) / L; };
        const colonnade = () => {
          const phi = Math.atan2(vpH.x, cam.d), u = [Math.sin(phi), Math.cos(phi), 0];
          const g = cam.ground(b0.x, b0.y - HZ) || [0, 4, 0];
          const cols = Array.from({ length: 9 }, (_, k) => { const B = [g[0] + 2.2 * k * u[0], g[1] + 2.2 * k * u[1], 0]; const p = cam.proj(B), q = cam.proj([B[0], B[1], 3.2]); return p && q ? { p: [p[0], p[1] + HZ], q: [q[0], q[1] + HZ] } : null; }).filter(Boolean);
          return { cols, V: [cam.d * Math.tan(phi), HZ] };
        };
        v.render(() => {
          const pm = mode.value === 'proj';
          projHandles.forEach((h) => (h.visible = pm)); colHandles.forEach((h) => (h.visible = !pm));
          if (pm) {
            const A = P.map((h) => [h.x, h.y]), Ob = [O.x, O.y];
            S.line(-9, Y0, 9, Y0, { color: 'accent', width: 2 }); S.text('ℓ', S.bounds.x[0] + 0.15, Y0 + 0.12, { align: 'left', baseline: 'bottom', math: true, size: 17, color: 'accent' });
            const lines = [[[m1.x, m1.y], [m2.x, m2.y], 'orange'], [[n1.x, n1.y], [n2.x, n2.y], 'purple']];
            for (const [a, b, col] of lines) { const dx = b[0] - a[0], dy = b[1] - a[1]; S.line(a[0] - dx * 3, a[1] - dy * 3, b[0] + dx * 3, b[1] + dy * 3, { color: col, width: 2 }); S.text(col === 'orange' ? 'm' : 'n', a[0], a[1] + 0.22, { align: 'center', baseline: 'bottom', math: true, size: 17, color: col }); }
            A.forEach((X, i) => {
              const hits = lines.map(([a, b]) => onLine(X, a, b)).filter(Boolean);
              const far = [X, ...hits].reduce((f, p) => (Math.hypot(p[0] - Ob[0], p[1] - Ob[1]) > Math.hypot(f[0] - Ob[0], f[1] - Ob[1]) ? p : f), X);
              S.line(Ob[0], Ob[1], Ob[0] + (far[0] - Ob[0]) * 1.08, Ob[1] + (far[1] - Ob[1]) * 1.08, { color: 'gold', width: 1.1, alpha: 0.8 });
              lines.forEach(([a, b, col]) => { const H = onLine(X, a, b); if (H) S.dot(H[0], H[1], { r: 4, color: col, label: 'ABCD'[i] + "'", labelPos: col === 'orange' ? 'ne' : 'se', labelSize: 13 }); });
            });
          } else {
            const { cols, V } = colonnade(), bx = S.bounds.x, by = S.bounds.y;
            S.rect(bx[0], by[0], bx[1], HZ, { fill: 'faint', fillAlpha: 0.12, stroke: false });
            S.line(bx[0], HZ, bx[1], HZ, { color: 'muted', width: 1, dash: [5, 4] });
            if (cols.length > 1) { const a = cols[0].p; S.line(a[0], a[1], V[0], V[1], { color: 'accent', width: 1.2, dash: [4, 4] }); const t = cols[0].q; S.line(t[0], t[1], V[0], V[1], { color: 'accent', width: 1.2, dash: [4, 4] }); }
            cols.slice().reverse().forEach((c, k) => {
              const i = cols.length - 1 - k, w = Math.max(2, Math.abs(c.q[1] - c.p[1]) * 0.12 * S.scale);
              S.line(c.p[0], c.p[1], c.q[0], c.q[1], { color: i < 4 ? 'accent' : i === 4 ? 'green' : 'gray', width: w });
            });
            // predicted 5th column from the cross-ratio of columns 2–4 (= 4/3)
            if (cols.length > 4) {
              const a = cols[0].p, e = [cols[3].p[0] - a[0], cols[3].p[1] - a[1]], L = Math.hypot(...e), t = cols.map((c) => ((c.p[0] - a[0]) * e[0] + (c.p[1] - a[1]) * e[1]) / L);
              const [t1, t2, t3] = [t[1], t[2], t[3]], k = 4 / 3, t4 = (k * (t3 - t2) * t1 - (t3 - t1) * t2) / (k * (t3 - t2) - (t3 - t1));
              const Q = [a[0] + (e[0] * t4) / L, a[1] + (e[1] * t4) / L];
              S.circle(Q[0], Q[1], 0.16, { color: 'green', width: 2.2 });
              S.text('predicted', Q[0], Q[1] - 0.25, { align: 'center', baseline: 'top', size: 11, color: 'green' });
            }
          }
        });
        v.legend([['accent', 'the four points (columns)'], ['gold', 'rays from $O$'], ['orange', 'image line $m$'], ['purple', 'image line $n$']]);
        v.readout(() => {
          if (mode.value === 'proj') {
            const A = P.map((h) => [h.x, h.y]), xs = A.map((p) => p[0]);
            const rows = [['\\ell', xs]];
            for (const [a, b, name] of [[[m1.x, m1.y], [m2.x, m2.y], 'm'], [[n1.x, n1.y], [n2.x, n2.y], 'n']]) {
              const H = A.map((X) => onLine(X, a, b)); if (H.some((h) => !h)) { rows.push([name, null]); continue; }
              rows.push([name, H.map((h) => tpar(h, a, b))]);
            }
            return rows.map(([nm, t]) => (t ? `on $${nm}$: $AB/BC = ${v.fix((t[1] - t[0]) / (t[2] - t[1]), 3)}$, $(A,B;C,D) = ${v.fix(cr(...t), 6)}$` : `on $${nm}$: a point goes to infinity`)).join(' · ');
          }
          const { cols } = colonnade();
          if (cols.length < 5) return 'move the colonnade into view';
          const a = cols[0].p, e = [cols[3].p[0] - a[0], cols[3].p[1] - a[1]], L = Math.hypot(...e), t = cols.map((c) => ((c.p[0] - a[0]) * e[0] + (c.p[1] - a[1]) * e[1]) / L);
          const k = 4 / 3, t4 = (k * (t[3] - t[2]) * t[1] - (t[3] - t[1]) * t[2]) / (k * (t[3] - t[2]) - (t[3] - t[1]));
          return `pictured spacings $${[1, 2, 3].map((i) => v.fix(t[i] - t[i - 1], 3)).join(',\\ ')}$ (unequal) · cross-ratio of the first four bases $${v.fix(cr(t[0], t[1], t[2], t[3]), 6)}$ $= 4/3$ · 5th column predicted at $${v.fix(t4, 4)}$, drawn at $${v.fix(t[4], 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Desargues’ theorem',
      credit: 'Girard Desargues (published by Abraham Bosse, 1648)',
      statement: String.raw`If two triangles $ABC$ and $A'B'C'$ are **in perspective from a point**, that is, the lines $AA'$, $BB'$, $CC'$ pass through one point $O$, then they are **in perspective from a line**: the three points
$$P=AB\cap A'B',\qquad Q=BC\cap B'C',\qquad R=CA\cap C'A'$$
lie on one line. (If two corresponding sides are parallel, their meeting point is at infinity and the line through the other two points is parallel to them.) The converse also holds.`,
      idea: String.raw`If the triangles lie in different planes the proof is one sentence: the planes of $ABC$ and $A'B'C'$ meet in a line, and each pair of corresponding sides lies in one plane through $O$, so the two sides meet at a point of both triangle planes, that is, on their common line (right panel). A plane configuration is a central projection of such a spatial one (art-1.2), and projection keeps lines and their intersections, so the three points stay collinear. Desargues’ work on perspective was published in 1648 by his pupil Abraham Bosse; the theorem became one of the foundations of projective geometry, alongside the cross-ratio (art-1.12).`,
      caption: String.raw`Drag $O$ and the corners of the blue triangle; the orange corners slide along the rays from $O$. The three meeting points of corresponding sides (gold) stay on one green line. Switch on “free A′” to pull $A'$ off its ray and watch $R$ leave the line. On the right, the same figure in space: tilt the second plane, and the green line is where the two planes meet.`,
      deps: ['art-1.12'],
      see: ['top-2.17'],
      refs: ['Kemp ch. 2'],
      tags: ['projective geometry', 'Desargues'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-4.6, 4.6], y: [-3.3, 3.6], equal: true, axes: false, height: 380, weight: 1.2, title: 'in the plane' });
        const T = v.stage({ x: [-2.2, 2.4], y: [-1.7, 1.9], equal: true, axes: false, height: 380, weight: 0.8, minWidth: 230, title: 'in space: two plane sections of one pyramid' });
        const free = v.toggle('free A′', false);
        const tilt = v.slider('tilt of the second plane', -0.8, -0.3, -0.45, { step: 0.01 });
        const O = S.handle(-2.8, 3.2, { color: 'ink', label: 'O', labelPos: 'e' });
        const A = S.handle(0.1, -1.8, { color: 'accent', label: 'A', labelPos: 'sw' }), B = S.handle(2.3, -1.45, { color: 'accent', label: 'B', labelPos: 'e' }), C = S.handle(1.1, 1.15, { color: 'accent', label: 'C', labelPos: 'e' });
        const t = { A: 0.68, B: 0.57, C: 0.34 };
        const mk = (X, k) => S.handle(0, 0, { color: 'orange', label: k + "'", labelPos: 'w', constrain: (x, y) => {
          if (k === 'A' && free.value) return [x, y];
          const dx = X.x - O.x, dy = X.y - O.y, tt = M.clamp(((x - O.x) * dx + (y - O.y) * dy) / (dx * dx + dy * dy || 1), 0.12, 1.6); t[k] = tt; return [O.x + tt * dx, O.y + tt * dy];
        } });
        const A2 = mk(A, 'A'), B2 = mk(B, 'B'), C2 = mk(C, 'C');
        const pts = () => {
          for (const [H, X, k] of [[A2, A, 'A'], [B2, B, 'B'], [C2, C, 'C']]) if (!H.dragging && !(k === 'A' && free.value)) { H.x = O.x + t[k] * (X.x - O.x); H.y = O.y + t[k] * (X.y - O.y); }
          const a = [A.x, A.y], b = [B.x, B.y], c = [C.x, C.y], a2 = [A2.x, A2.y], b2 = [B2.x, B2.y], c2 = [C2.x, C2.y];
          return { a, b, c, a2, b2, c2, P: meet(a, b, a2, b2), Q: meet(b, c, b2, c2), R: meet(c, a, c2, a2) };
        };
        const sc = v.scene3(T, { yaw: -0.5, pitch: 0.28, axes: false, hint: false });
        const z1 = (x) => -0.75 + 0.18 * x, O3 = [-0.4, 0.0, 1.5];
        const base = [[-1.3, -0.3], [0.9, -0.6], [-0.1, 0.55]].map(([x, y]) => [x, y, z1(x)]);
        v.render(() => {
          const g = pts(), { a, b, c, a2, b2, c2, P, Q, R } = g;
          // ---- plane picture
          for (const X of [a, b, c]) { const far = [O.x + (X[0] - O.x) * 1.15, O.y + (X[1] - O.y) * 1.15]; S.line(O.x, O.y, far[0], far[1], { color: 'muted', width: 1, alpha: 0.8 }); }
          for (const [p, q, Xp] of [[a, b, P], [b, c, Q], [c, a, R]]) if (Xp) { S.line(p[0], p[1], Xp[0], Xp[1], { color: 'accent', width: 1, dash: [4, 4], alpha: 0.8 }); }
          for (const [p, q, Xp] of [[a2, b2, P], [b2, c2, Q], [c2, a2, R]]) if (Xp) { S.line(p[0], p[1], Xp[0], Xp[1], { color: 'orange', width: 1, dash: [4, 4], alpha: 0.8 }); }
          S.poly([a, b, c], { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          S.poly([a2, b2, c2], { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 2 });
          if (P && Q) {
            const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy) || 1;
            S.line(P[0] - (dx / L) * 30, P[1] - (dy / L) * 30, Q[0] + (dx / L) * 30, Q[1] + (dy / L) * 30, { color: 'green', width: 2 });
          }
          const bad = free.value && P && Q && R && lineDist(R, P, Q) > 1e-3;
          [[P, 'P'], [Q, 'Q'], [R, 'R']].forEach(([X, nm]) => { if (X) S.dot(X[0], X[1], { r: 5, color: nm === 'R' && bad ? 'red' : 'gold', label: nm, labelPos: 'n' }); });
          // ---- spatial figure
          const k2 = tilt.value, z2 = (x) => 0.25 + k2 * x, xa = (0.25 + 0.75) / (0.18 - k2); // planes z1, z2 meet at x = xa
          const cut = (X) => { const D = M.vsub(X, O3), s = (0.25 + k2 * O3[0] - O3[2]) / (D[2] - k2 * D[0]); return M.vadd(O3, M.vscale(D, s)); };
          const top = base.map(cut);
          sc.begin();
          const quad = (zf, col) => sc.poly([[-1.8, -1.6], [xa, -1.6], [xa, 1.9], [-1.8, 1.9]].map(([x, y]) => [x, y, zf(x)]), { fill: col, fillAlpha: 0.07, color: col, width: 0.8, alpha: 0.4 });
          quad(z1, 'accent'); quad(z2, 'orange');
          sc.line([xa, -2.1, z1(xa)], [xa, 2.3, z1(xa)], { color: 'green', width: 2.4 }, 8);
          for (const X of base) sc.line(O3, X, { color: 'muted', width: 1.1 }, 6);
          sc.poly(base, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.8 });
          sc.poly(top, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.8 });
          for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
            const p = base[i], q = base[j], s = (xa - p[0]) / (q[0] - p[0]);
            if (!isFinite(s)) continue;
            const X = M.vlerp(p, q, s);
            sc.line(s > 1 ? q : p, X, { color: 'accent', width: 1, dash: true });
            const p2 = top[i], q2 = top[j]; sc.line(Math.hypot(...M.vsub(p2, X)) < Math.hypot(...M.vsub(q2, X)) ? p2 : q2, X, { color: 'orange', width: 1, dash: true });
            sc.dot(X, { r: 4.5, color: 'gold' });
          }
          sc.dot(O3, { r: 4.5, color: 'ink' }); sc.tex('O', [O3[0], O3[1], O3[2] + 0.18], { size: 14 });
          sc.flush();
          T.corner('drag the background to turn it', 'br', { size: 11, color: 'faint' });
        });
        v.legend([['accent', 'triangle $ABC$'], ['orange', "triangle $A'B'C'$"], ['gold', 'meeting points of corresponding sides', { dot: true }], ['green', 'the axis']]);
        v.readout(() => {
          const { P, Q, R } = pts();
          if (!P || !Q || !R) return 'two corresponding sides are parallel: their meeting point is at infinity, in the direction of the line through the other two';
          const L = Math.max(Math.hypot(P[0] - Q[0], P[1] - Q[1]), Math.hypot(P[0] - R[0], P[1] - R[1]), 1e-9), dv = lineDist(R, P, Q);
          return `distance of $R$ from the line $PQ$: $${v.fix(dv, 6)}$ (relative $${v.sci(dv / L, 2)}$)` + (free.value ? ' — with $A\'$ off its ray the triangles are no longer in perspective from $O$' : ' — the triangles are in perspective from $O$, so $P$, $Q$, $R$ are collinear');
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Concept',
      name: 'Curvilinear, fisheye and reverse perspective',
      statement: String.raw`Linear perspective projects the scene onto a plane: it keeps straight lines straight, but it cannot cover a field of view of $180^\circ$ and it stretches the margins (art-1.11). Other projection surfaces give other perspectives:

- *cylindrical* (panoramic) perspective projects onto a cylinder around the eye and unrolls it: verticals stay straight, other horizontals than the horizon bow into curves, and the field can reach $360^\circ$;
- *spherical* or *fisheye* (curvilinear) perspective projects onto a sphere around the eye and maps it to the page: only lines through the centre stay straight, the rest bend, and a whole hemisphere fits in a disc;
- *reverse perspective*, seen in Byzantine and Russian icons, makes receding parallels diverge instead of converge, as if the centre of projection lay beyond the scene.

Each keeps some properties of what we see and gives up others; none of them is “the” correct picture of a wide view.`,
      idea: String.raw`The first three are central projections from the eye followed by different ways of laying the projection surface flat. A straight line in space and the eye span a plane; that plane leaves a straight trace on a flat picture, but on a cylinder or a sphere it leaves an ellipse or a great circle, which appears curved once the surface is unrolled (art-1.10). André Barre and Albert Flocon codified a five-point curvilinear perspective in 1968; Pavel Florensky’s essay of 1920 defended the reverse perspective of icons as a deliberate system rather than a failure. Modelling reverse perspective as a projection from a point beyond the scene is a modern geometric reading, not a rule the icon painters wrote down.`,
      caption: String.raw`Switch between a flat picture, a cylinder, a fisheye and reverse perspective of the same street, and widen the field of view. The small diagram shows the projection surface from above. The readout measures how much a receding kerb, a kerb across the view and a lamp post bend: not at all on the flat picture, more or less on the curved surfaces. In reverse perspective lines stay straight but the street widens with distance.`,
      deps: ['art-1.10'],
      see: ['geog-5.1', 'geog-5.2'],
      refs: ['Kemp ch. 3'],
      tags: ['perspective', 'fisheye', 'panorama'],
      viz(v) {
        const M = v.M, EH = 1.6;
        const pic = v.stage({ x: [-1.04, 1.04], y: [-0.66, 0.66], equal: true, axes: false, height: 360, weight: 1.35, title: 'one street, four perspectives' });
        const sch = v.stage({ x: [-1.25, 1.25], y: [-0.25, 1.75], equal: true, axes: false, height: 360, weight: 0.5, minWidth: 190, title: 'surface, from above' });
        const kind = v.select('', [{ value: 'plane', label: 'flat picture' }, { value: 'cyl', label: 'cylinder' }, { value: 'fish', label: 'fisheye' }, { value: 'rev', label: 'reverse' }], 'plane');
        const fov = v.slider('field of view', 40, 170, 110, { step: 1, fmt: (x) => `${x}°` });
        const projF = (k, F) => {
          if (k === 'plane') { const f = 1 / Math.tan(Math.min(F, rad(160)) / 2); return (P) => (P[1] > 0.05 ? [(f * P[0]) / P[1], (f * (P[2] - EH)) / P[1]] : null); }
          if (k === 'cyl') { const R = 1 / (F / 2); return (P) => { const rho = Math.hypot(P[0], P[1]), ph = Math.atan2(P[0], P[1]); return rho > 0.05 && Math.abs(ph) < 3 ? [R * ph, (R * (P[2] - EH)) / rho] : null; }; }
          if (k === 'fish') { const R = 1 / (F / 2); return (P) => { const q = [P[0], P[1], P[2] - EH], Lq = Math.hypot(...q), th = Math.acos(M.clamp(q[1] / Lq, -1, 1)), s = Math.hypot(q[0], q[2]); return th < 2.9 && s > 1e-9 ? [(R * th * q[0]) / s, (R * th * q[2]) / s] : th < 1e-9 ? [0, 0] : null; }; }
          const Dr = 150, W0 = 7.5; return (P) => { const k2 = Dr / (Dr - P[1]); return P[1] > -1 ? [(P[0] * k2) / W0, ((P[2] - EH) * k2) / W0] : null; };
        };
        const path3 = (pr, A, B, n = 40) => { const out = []; let prev = null; for (let i = 0; i <= n; i++) { const p = pr(M.vlerp(A, B, i / n)); if (p && prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.6) out.push(null); out.push(p); prev = p; } return out; };
        // the street
        const blocks = [];
        for (const [sg, hs] of [[-1, [9, 13, 10, 12]], [1, [12, 8, 14, 9]]]) [[6, 18], [26, 44], [52, 68], [76, 92]].forEach(([y0, y1], i) => blocks.push({ x0: sg * 6, x1: sg * 15, y0, y1, h: hs[i], col: sg < 0 ? 'teal' : 'purple' }));
        const lines = [];
        for (const x of [-3.5, 3.5]) lines.push([[x, -30, 0], [x, 100, 0], 'ink', 1.6]);
        for (let y = -30; y < 100; y += 4) lines.push([[0, y, 0], [0, y + 2, 0], 'gold', 2]);
        for (const y of [18, 26, 44, 52]) for (const sg of [-1, 1]) lines.push([[sg * 6, y, 0], [sg * 60, y, 0], 'ink', 1.2]);
        const lamps = []; for (let y = 6; y < 100; y += 10) for (const sg of [-1, 1]) lamps.push([sg * 4.3, y + (sg > 0 ? 5 : 0)]);
        const facade = (b) => { const x = b.x0, out = []; out.push([[x, b.y0, 0], [x, b.y1, 0], [x, b.y1, b.h], [x, b.y0, b.h]]); out.push([[x, b.y0, 0], [b.x1, b.y0, 0], [b.x1, b.y0, b.h], [x, b.y0, b.h]]); return out; };
        v.render(() => {
          const k = kind.value, F = rad(fov.value), pr = projF(k, F);
          fov.el.hidden = k === 'rev';
          const bx = pic.bounds.x, by = pic.bounds.y;
          pic.clip(() => {
            // sky and ground: the horizon is the image of the plane z = EH
            const hz = path3(pr, [-200, 0.2, EH], [200, 0.2, EH], 200).filter(Boolean);
            pic.rect(bx[0], 0, bx[1], by[1], { fill: 'blue', fillAlpha: 0.05, stroke: false });
            pic.rect(bx[0], by[0], bx[1], 0, { fill: 'faint', fillAlpha: 0.14, stroke: false });
            for (const [A, B, col, w] of lines) pic.path(path3(pr, A, B, col === 'gold' ? 3 : 120), { color: col, width: w, alpha: col === 'ink' ? 0.75 : 0.9 });
            if (k === 'fish') { const R = 1 / (F / 2); pic.circle(0, 0, (R * Math.PI) / 2, { fill: 'faint', fillAlpha: 0.08, color: 'faint', width: 1 }); }
            for (const b of blocks.slice().sort((p, q) => q.y0 - p.y0)) for (const poly of facade(b)) {
              const ring = []; let ok = true;
              for (let i = 0; i < 4; i++) { const seg = path3(pr, poly[i], poly[(i + 1) % 4], 24); if (seg.some((p) => !p)) { ok = false; break; } ring.push(...seg); }
              if (!ok) continue;
              pic.poly(ring, { fill: 'panel', fillAlpha: 1, stroke: false });
              pic.poly(ring, { fill: b.col, fillAlpha: 0.16, color: b.col, width: 1.2 });
              for (let z = 3; z < b.h; z += 3) pic.path(path3(pr, [poly[0][0], poly[0][1], z], [poly[1][0], poly[1][1], z], 24), { color: b.col, width: 0.8, alpha: 0.7 });
            }
            for (const [x, y] of lamps) pic.path(path3(pr, [x, y, 0], [x, y, 5], 16), { color: 'orange', width: 2 });
            if (hz.length > 1) pic.path(hz, { color: 'muted', width: 1, dash: [5, 4] });
          });
          // ---- schematic of the surface (top view)
          for (const s of [-1, 1]) if (k !== 'rev') sch.line(0, 0, s * 1.6 * Math.sin(Math.min(F, 3.1) / 2), 1.6 * Math.cos(Math.min(F, 3.1) / 2), { color: 'faint', width: 1, dash: [4, 4] });
          if (k === 'plane') { const half = 0.7 * Math.tan(Math.min(F, rad(160)) / 2); sch.line(-Math.min(half, 1.3), 0.7, Math.min(half, 1.3), 0.7, { color: 'orange', width: 3 }); }
          else if (k === 'cyl' || k === 'fish') sch.curve((t) => [0.7 * Math.sin(t), 0.7 * Math.cos(t)], -F / 2, F / 2, { color: 'orange', width: 3 });
          else { sch.line(-1.1, 0.35, 1.1, 0.35, { color: 'orange', width: 3 }); sch.dot(0, 1.6, { r: 4.5, color: 'red', label: 'centre', labelPos: 'e' }); for (const x of [-1, -0.4, 0.4, 1]) sch.line(x, 0.35, 0, 1.6, { color: 'red', width: 1, alpha: 0.6 }); }
          if (k !== 'rev') { sch.dot(0, 0, { r: 4.5, color: 'ink', label: 'eye', labelPos: 's' }); for (const a of [-0.9, 0.35]) sch.line(0, 0, 1.6 * Math.sin(a), 1.6 * Math.cos(a), { color: 'gold', width: 1.2 }); }
          sch.text({ plane: 'plane', cyl: 'cylinder', fish: 'sphere', rev: 'picture' }[k], 0, k === 'rev' ? 0.2 : 0.55, { align: 'center', baseline: 'top', size: 11, color: 'orange' });
        });
        v.legend([['ink', 'kerbs'], ['orange', 'lamp posts'], ['muted', 'horizon', { dash: true }]]);
        v.readout(() => {
          const k = kind.value, pr = projF(k, rad(fov.value));
          const bend = (A, B) => { const pts = path3(pr, A, B, 60).filter(Boolean); if (pts.length < 3) return NaN; const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return Math.max(...pts.map((p) => lineDist(p, a, b))) / L; };
          const b1 = bend([3.5, 4, 0], [3.5, 40, 0]), b2 = bend([6, 26, 0], [40, 26, 0]), b3 = bend([4.3, 11, 0], [4.3, 11, 5]);
          const wide = k === 'rev' ? (() => { const n = pr([3.5, 4, 0]), f = pr([3.5, 60, 0]); return ` · the road is drawn $${v.fix(f[0] / n[0], 2)}$ times wider at 60 m than at 4 m`; })() : '';
          return `bending (sag ÷ chord): receding kerb $${v.fix(b1, 3)}$ · kerb across the view $${v.fix(b2, 3)}$ · lamp post $${v.fix(b3, 3)}$` + wide;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Method',
      name: 'Shadows and reflections in perspective',
      statement: String.raw`Shadows and reflections can be constructed inside the picture.

- **Sun.** Light rays are parallel, so they vanish at the image of the sun (or, with the sun behind the viewer, at the antisolar point below the horizon). Shadows of vertical posts on level ground are parallel lines vanishing at the point of the horizon directly below or above it. The tip of a shadow is where the light ray through the top of the post meets the shadow line through its foot.
- **Lamp.** Rays diverge from the lamp, and shadows on the ground radiate from the lamp’s foot, the point of the ground directly below it.
- **Still water.** The reflection of a point lies on the vertical through it, as far below the water level as the point is above it; a post standing at the water is continued by a reflection of the same length in the picture.`,
      idea: String.raw`Parallel rays form a family of parallel lines and share a vanishing point (art-1.4). The shadow of a vertical post lies in the vertical plane through the post that contains the light direction; that plane meets the ground in a horizontal line, whose vanishing point is on the horizon (art-1.5), directly below the sun’s image. A lamp is a finite centre of projection, so the shadows are the central projection of the objects onto the ground from the lamp (art-1.2), and the lamp’s foot takes the place of the vanishing point. A level mirror sends $(x,y,z)$ to $(x,y,-z)$; vertical lengths at one depth are drawn at one scale, so a post and its reflection have equal lengths when the post stands at the water.`,
      caption: String.raw`Choose the sun or a lamp, then drag the light source in the picture (for the lamp, also its foot on the ground). Dashed lines show the construction: light rays from the source through the tops of the posts, shadow lines from the shadow vanishing point or the lamp’s foot through their feet; the shadows end where the two meet. Drag the sun below the horizon to put it behind you. The pool reflects the post standing at its edge.`,
      deps: ['art-1.4'],
      see: ['mech-5.2'],
      refs: ['Kemp ch. 3'],
      tags: ['perspective', 'shadows', 'reflections'],
      viz(v) {
        const M = v.M, h = 1.6, d = 1.4, C = camera([0, 0, h], { d });
        const pic = v.stage({ x: [-2.3, 2.3], y: [-1.6, 1.35], equal: true, axes: false, height: 390 });
        const mode = v.select('light', [{ value: 'sun', label: 'sun' }, { value: 'lamp', label: 'lamp' }], 'sun');
        const refl = v.toggle('reflections in the pool', true);
        const sun = pic.handle(-0.75, -1.15, { color: 'gold', label: 'sun', labelPos: 'ne', constrain: (x, y) => [x, Math.abs(y) < 0.07 ? (y >= 0 ? 0.07 : -0.07) : y] });
        let foot = null;
        const lamp = pic.handle(0.75, 0.42, { color: 'gold', label: 'lamp', labelPos: 'ne', constrain: (x, y) => [x, Math.max(y, (foot ? foot.y : -0.6) + 0.15)], onDrag: () => { foot.x = lamp.x; } });
        foot = pic.handle(0.75, -0.62, { color: 'orange', label: 'foot', labelPos: 'e', constrain: (x, y) => [lamp.x, M.clamp(y, -1.5, -0.1)] });
        const posts = [[-1.9, 5.0, 2.4], [0.1, 8.5, 2.8], [2.9, 11.5, 3.2], [2.0, 6.2, 2.1]]; // x, y, height (the last one stands at the pool)
        const box = boxMesh([-0.4, 6.2, 0], [1.1, 1.1, 1.1], 0.45);
        const pool = [[0.7, 3.4, 0], [3.6, 3.4, 0], [3.6, 6.2, 0], [0.7, 6.2, 0]];
        const pj = (P) => { const q = C.proj(P); return q ? [q[0], q[1]] : null; };
        const light = () => {
          if (mode.value === 'sun') { const sg = sun.y > 0 ? -1 : 1; return { sun: true, L: [sg * sun.x, sg * d, sg * sun.y], src: [sun.x, sun.y], vp: [sun.x, 0] }; }
          const g = C.ground(foot.x, foot.y); if (!g) return null;
          const dep = g[1], Lz = h + (lamp.y * dep) / d; return { sun: false, P: [g[0], g[1], Lz], src: [lamp.x, lamp.y], vp: [foot.x, foot.y] };
        };
        const shadow = (lt, P) => {
          if (lt.sun) { if (lt.L[2] >= -1e-6) return null; const t = -P[2] / lt.L[2]; return [P[0] + t * lt.L[0], P[1] + t * lt.L[1], 0]; }
          if (P[2] >= lt.P[2] - 1e-6) return null; const s = lt.P[2] / (lt.P[2] - P[2]); return [lt.P[0] + s * (P[0] - lt.P[0]), lt.P[1] + s * (P[1] - lt.P[1]), 0];
        };
        v.render(() => {
          const sm = mode.value === 'sun'; sun.visible = sm; lamp.visible = !sm; foot.visible = !sm;
          const lt = light(), bx = pic.bounds.x, by = pic.bounds.y;
          pic.rect(bx[0], by[0], bx[1], 0, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          for (const [a, b] of gridLines(-8, 8, 2, 30, 2)) seg3(pic, C, a, b, { color: 'faint', width: 0.8 });
          pic.line(bx[0], 0, bx[1], 0, { color: 'muted', width: 1.2 });
          // pool and reflections
          const poolImg = pool.map(pj);
          pic.poly(poolImg, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.2 });
          if (refl.value) clipPoly(pic, poolImg, () => {
            for (const [x, y, H] of posts) { const a = pj([x, y, 0]), b = pj([x, y, -H]); pic.line(a[0], a[1], b[0], b[1], { color: 'ink', width: 4, alpha: 0.4 }); }
            const mirrored = { ...box, V: box.V.map(([x, y, z]) => [x, y, -z]), F: box.F.map((f) => f.slice().reverse()) };
            drawSolids(pic, pj, [0, 0, h], [{ mesh: mirrored, color: 'teal', alpha: 0.05 }]);
          });
          // shadows (drawn on the ground, before the objects)
          if (lt) {
            const sb = box.V.slice(0, 4).map((P) => P), stp = box.V.slice(4).map((P) => shadow(lt, P));
            if (stp.every(Boolean)) { const pts = M.hull([...sb, ...stp].map((P) => pj(P)).filter(Boolean)); pic.poly(pts, { fill: 'ink', fillAlpha: 0.22, stroke: false }); }
            for (const [x, y, H] of posts) {
              const T = shadow(lt, [x, y, H]); if (!T) continue;
              const a = pj([x, y, 0]), t = pj(T), top = pj([x, y, H]); if (!t) continue;
              pic.line(a[0], a[1], t[0], t[1], { color: 'ink', width: 5, alpha: 0.28 });
              pic.line(lt.src[0], lt.src[1], t[0], t[1], { color: 'gold', width: 1, dash: [4, 4], alpha: 0.85 });
              pic.line(lt.vp[0], lt.vp[1], t[0], t[1], { color: 'orange', width: 1, dash: [4, 4], alpha: 0.85 });
              void top;
            }
          }
          const objs = posts.map(([x, y, H]) => ({ y, f: () => { const a = pj([x, y, 0]), b = pj([x, y, H]); pic.line(a[0], a[1], b[0], b[1], { color: 'ink', width: 4 }); } }));
          objs.push({ y: 6.2, f: () => drawSolids(pic, pj, [0, 0, h], [{ mesh: box, color: 'teal' }]) });
          objs.sort((p, q) => q.y - p.y).forEach((o) => o.f());
          if (lt) {
            if (lt.sun) { pic.dot(lt.vp[0], 0, { r: 5, color: 'orange' }); pic.text('shadow vanishing point', lt.vp[0], lt.src[1] > 0 ? -0.08 : 0.08, { align: 'center', baseline: lt.src[1] > 0 ? 'top' : 'bottom', size: 10.5, color: 'orange' }); if (lt.src[1] < 0) pic.text('(sun behind you: antisolar point)', lt.src[0], lt.src[1] - 0.12, { align: 'center', baseline: 'top', size: 10.5, color: 'gold' }); }
            else { pic.line(lamp.x, lamp.y, foot.x, foot.y, { color: 'muted', width: 2.5 }); }
          }
        });
        v.legend([['gold', 'light rays', { dash: true }], ['orange', 'shadow lines', { dash: true }], ['blue', 'pool (level mirror)', { area: true }]]);
        v.readout(() => {
          const lt = light(); if (!lt) return 'move the foot of the lamp onto the ground';
          let missV = 0, missS = 0, n = 0;
          for (const [x, y, H] of posts) {
            const T = shadow(lt, [x, y, H]); if (!T) continue;
            const a = pj([x, y, 0]), t = pj(T), top = pj([x, y, H]); if (!t) continue;
            missV = Math.max(missV, lineDist(lt.vp, a, t)); missS = Math.max(missS, lineDist(lt.src, top, t)); n++;
          }
          const [x, y, H] = posts[3], a = pj([x, y, 0]), b = pj([x, y, H]), c = pj([x, y, -H]);
          return `${n} shadows: shadow lines miss the ${lt.sun ? 'shadow vanishing point' : 'lamp’s foot'} by at most $${v.fix(missV, 5)}$, light rays miss the ${lt.sun ? (lt.src[1] > 0 ? 'sun' : 'antisolar point') : 'lamp'} by at most $${v.fix(missS, 5)}$ · post at the pool: $${v.fix(b[1] - a[1], 3)}$ tall in the picture, reflection $${v.fix(a[1] - c[1], 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Paper',
      name: 'De pictura (On Painting)',
      paper: { authors: 'Leon Battista Alberti', year: 1435, title: 'De pictura',
               venue: 'Latin manuscript, 1435 (Italian version Della pittura, 1436); first printed Basel: Bartholomaeus Westheimer, 1540', url: 'https://archive.org/details/ARes22707' },
      introduces: ['art-1.1', 'art-1.7'],
      credit: 'Leon Battista Alberti, 1435',
      statement: String.raw`Alberti’s treatise, written in Latin in 1435 and in Italian in 1436 (the Italian version opens with a tribute to Brunelleschi), gave the first written method of geometric perspective. Book I defines a painting as an intersection of the visual pyramid, the cone of rays from the eye to the visible surfaces, by a plane treated as an “open window”, and gives the *costruzione legittima* for a floor of braccia squares: the centric point at the height of a man, orthogonals from the divisions of the base, transversals from a small side drawing, and the test that one straight line runs through the diagonal corners. Book II describes the *velo*, a veil of fine threads divided into squares by thicker ones and set between eye and subject, as a practical way to cut the pyramid and transfer outlines square by square; Book III treats the painter’s education. In modern terms the treatise gives the central projection $x'=dx/y$, $z'=dz/y$ in ruler-and-compass form, valid for one fixed eye.`,
      idea: String.raw`Before Alberti, fourteenth-century painters built convincing but geometrically inconsistent spaces by rules of thumb, and Brunelleschi’s panels (art-1.3) had shown that an exact method existed without explaining it. Alberti, a humanist who wrote that he spoke “not as a mathematician but as a painter”, turned the visual pyramid of medieval optics into a construction that any workshop could follow, and rejected the workshop rule of shrinking each band of the floor by a fixed ratio. The treatise introduced the picture plane as a window cutting the visual pyramid (art-1.1) and the tiled-floor construction (art-1.7). Piero della Francesca and Dürer elaborated the method, and through Guidobaldo del Monte and Desargues it grew into projective geometry. *De pictura* circulated in manuscript and was first printed in Basel in 1540.`,
      caption: String.raw`Drag the eye in the 3D view, or turn the scene. Gold rays from the eye to the floor’s corners pierce Alberti’s veil, a window of one-braccio squares, and trace the foreshortened floor. On the right is the painting with Alberti’s construction for the same eye: orthogonals to the centric point, transversals at $h\,k/(d+k)$ and the diagonal running to the distance point. Gold dots are the exact pierce points of the rays. The readout compares Alberti’s transversals with them, and with the workshop rule he rejected.`,
      deps: ['art-1.2', 'art-1.3'],
      refs: [],
      tags: ['Alberti', 'perspective', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/De_pictura' },
      viz(v) {
        const M = v.M, HW = 4, VH = 6, N = 8, VY = -1.2, G = -2.6; // veil half-width and height (braccia), rows of tiles, veil plane, ground
        const S = v.stage({ x: [-7.6, 7.2], y: [-4.6, 4.2], equal: true, axes: false, height: 390, weight: 1.15, title: 'the window, the veil and the visual pyramid' });
        const P = v.stage({ x: [-4.3, 5.8], y: [-0.35, 6.3], equal: true, axes: false, height: 390, weight: 0.85, minWidth: 240, title: 'the painting, by the costruzione legittima' });
        const sc = v.scene3(S, { yaw: -0.78, pitch: 0.2, axes: false, lim: 14 });
        const eye = sc.handle([0.6, VY - 4.5, G + 3], { color: 'accent', label: 'eye', snap: (p) => [M.clamp(p[0], -2.5, 2.5), M.clamp(p[1], VY - 11, VY - 2.5), M.clamp(p[2], G + 0.8, G + 4.4)] });
        const veil = v.toggle('veil threads in the painting', true);
        const man = [-2.6, VY + 1.5];
        const geo = () => { const E = eye.p; return { E, d: VY - E[1], h: E[2] - G, ex: E[0] }; };
        const pierce = (Q) => { const { E } = geo(), t = (VY - E[1]) / (Q[1] - E[1]); return [E[0] + t * (Q[0] - E[0]), E[2] + t * (Q[2] - E[2]) - G]; }; // painting coords (across, height)
        const alberti = (h, d) => Array.from({ length: N + 1 }, (_, k) => (h * k) / (d + k));
        v.render(() => {
          const { E, d, h, ex } = geo();
          sc.begin();
          sc.poly([[-HW - 1, VY - 12, G], [HW + 1, VY - 12, G], [HW + 1, VY + N + 1, G], [-HW - 1, VY + N + 1, G]], { fill: 'faint', fillAlpha: 0.06, edge: false, bias: 30 });
          for (let i = -HW; i <= HW; i++) sc.line([i, VY, G], [i, VY + N, G], { color: 'muted', width: 0.9, alpha: 0.8, bias: 2 }, 8);
          for (let k = 0; k <= N; k++) sc.line([-HW, VY + k, G], [HW, VY + k, G], { color: 'muted', width: 0.9, alpha: 0.8, bias: 2 }, 8);
          sc.line([-HW, VY, G], [-HW + N, VY + N, G], { color: 'green', width: 2, bias: 1 }, 8);
          // the veil: window with threads every braccio
          const vp = [[-HW, VY, G], [HW, VY, G], [HW, VY, G + VH], [-HW, VY, G + VH]];
          sc.poly(vp, { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 2 });
          for (let i = -HW + 1; i < HW; i++) sc.line([i, VY, G], [i, VY, G + VH], { color: 'orange', width: 0.6, alpha: 0.45 }, 4);
          for (let z = 1; z < VH; z++) sc.line([-HW, VY, G + z], [HW, VY, G + z], { color: 'orange', width: 0.6, alpha: 0.45 }, 4);
          // the visual pyramid over the floor, and rays to the far row and the diagonal
          const fl = [[-HW, VY, G], [HW, VY, G], [HW, VY + N, G], [-HW, VY + N, G]];
          for (let i = 0; i < 4; i++) sc.poly([E, fl[i], fl[(i + 1) % 4]], { fill: 'gold', fillAlpha: 0.05, edge: false });
          const rays = [];
          for (let i = -HW; i <= HW; i += 2) rays.push([i, VY + N, G]);
          for (let k = 1; k < N; k++) rays.push([-HW + k, VY + k, G]);
          for (const Q of rays) { const f = pierce(Q); const R = [f[0], VY, f[1] + G]; sc.line(E, R, { color: 'gold', width: 1, alpha: 0.85 }, 5); sc.line(R, Q, { color: 'gold', width: 0.8, alpha: 0.4 }, 5); }
          // the foreshortened floor traced on the veil
          for (let i = -HW; i <= HW; i++) { const a = pierce([i, VY, G]), b = pierce([i, VY + N, G]); sc.line([a[0], VY, a[1] + G], [b[0], VY, b[1] + G], { color: 'accent', width: 1.6, bias: -0.1 }, 2); }
          for (let k = 0; k <= N; k++) { const a = pierce([-HW, VY + k, G]), b = pierce([HW, VY + k, G]); sc.line([a[0], VY, a[1] + G], [b[0], VY, b[1] + G], { color: 'accent', width: 1.6, bias: -0.1 }, 2); }
          sc.line([man[0], man[1], G], [man[0], man[1], G + 2.75], { color: 'ink', width: 4 }, 3); sc.dot([man[0], man[1], G + 2.85], { r: 4, color: 'ink', top: false });
          sc.tex('E', [E[0], E[1], E[2] - 0.6], { color: 'accent', size: 15 });
          sc.flush();
          // ---- the painting
          P.rect(-HW, 0, HW, VH, { fill: 'orange', fillAlpha: 0.04, color: 'orange', width: 1.8 });
          if (veil.value) { for (let i = -HW + 1; i < HW; i++) P.line(i, 0, i, VH, { color: 'orange', width: 0.6, alpha: 0.35 }); for (let z = 1; z < VH; z++) P.line(-HW, z, HW, z, { color: 'orange', width: 0.6, alpha: 0.35 }); }
          const ys = alberti(h, d);
          P.clip(() => {
            for (let i = -HW; i <= HW; i++) P.line(i, 0, ex, h, { color: 'accent', width: 1.1, alpha: 0.85 });
            for (let k = 1; k <= N; k++) { const f = d / (d + k); P.line(ex + (-HW - ex) * f, ys[k], ex + (HW - ex) * f, ys[k], { color: 'accent', width: 1.3 }); }
            P.line(-HW, 0, ex + d, h, { color: 'green', width: 1.8 });
            drawFigure(P, (Q) => pierce(Q), [man[0], man[1], G], 3, { color: 'ink', alpha: 0.5 });
          }, [-HW, HW], [0, VH]);
          P.line(-HW, h, HW, h, { color: 'muted', width: 1, dash: [5, 4] });
          P.dot(ex, h, { r: 4.5, color: 'accent', label: 'centric point', labelPos: 'n', labelSize: 11 });
          for (let k = 0; k <= N; k++) for (let i = -HW; i <= HW; i++) { const q = pierce([i, VY + k, G]); if (q[1] <= VH) P.dot(q[0], q[1], { r: 1.8, color: 'gold' }); }
          const Dx = ex + d;
          if (Dx < P.bounds.x[1]) P.dot(Dx, h, { r: 4.5, color: 'green', label: 'D', labelPos: 'n' });
          else P.text('to the distance point →', P.bounds.x[1] - 0.05, h + 0.15, { align: 'right', baseline: 'bottom', size: 10.5, color: 'green' });
        });
        v.legend([['orange', 'window and veil (1 braccio squares)'], ['gold', 'rays and their exact pierce points'], ['accent', 'Alberti’s construction'], ['green', 'diagonal test, to the distance point $D$']]);
        v.readout(() => {
          const { d, h } = geo(), ys = alberti(h, d);
          let err = 0; for (let k = 0; k <= N; k++) err = Math.max(err, Math.abs(pierce([0, VY + k, G])[1] - ys[k]));
          const r = 2 / 3, b1 = ys[1], bot = (b1 * (1 - r ** N)) / (1 - r);
          return `eye ${v.fix(h, 2)} braccia high, ${v.fix(d, 2)} braccia from the veil · Alberti’s transversals $h\\,k/(d+k)$ vs the exact pierce points: largest difference $${v.sci(err, 1)}$ braccia · the fixed-ratio rule (bands of ⅔) puts row ${N} at $${v.fix(bot, 3)}$ instead of $${v.fix(ys[N], 3)}$, off by $${v.fix(Math.abs(bot - ys[N]), 3)}$ braccia · Alberti’s man of 3 braccia is about 1.75 m (1 braccio ≈ 58.4 cm)`;
        });
      },
    },
  ],
};
