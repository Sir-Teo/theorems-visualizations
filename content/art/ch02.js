// Visual Art & Color — Chapter 2: Anamorphosis, optical devices and painters' machines (items 2.1–2.5; 2.6–2.10 are in ch02-b.js)
import { camera, seg3, rad, densify, skull, face, gridShapes } from './ch02.shared.js';

// Bessel J0 (series for small x, Hankel asymptotics beyond 9).
function J0(x) {
  const ax = Math.abs(x);
  if (ax < 9) { const t = ax / 2; let term = 1, s = 0; for (let k = 0; k < 40; k++) { s += term; term *= -(t * t) / ((k + 1) * (k + 1)); } return s; }
  const P = 1 - 9 / (128 * ax * ax), Q = -1 / (8 * ax) + 225 / (6 * (8 * ax) ** 3);
  const chi = ax - Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * ax)) * (P * Math.cos(chi) - Q * Math.sin(chi));
}

export default {
  collection: 'art',
  chapter: 2,
  title: 'Anamorphosis, optical devices and painters’ machines',
  summary: String.raw`Once perspective is understood as projection, it can be abused: stretch an image so that it resolves only from one extreme viewpoint, or only in a curved mirror. The same geometry explains the camera obscura and the lens, the drawing frames and thread machines of Dürer, and the illusions of painted ceilings and the Ames room. Whether great painters secretly traced optical projections is still disputed, and the last items set out what a measurement can and cannot decide.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Method',
      name: 'Oblique anamorphosis (Holbein’s skull)',
      credit: 'Hans Holbein the Younger, The Ambassadors, 1533',
      statement: String.raw`Choose an eye point $E$ and a canvas plane $\Pi$. To paint an object so that it looks undistorted from $E$, imagine it drawn normally on a picture plane $\Pi'$ perpendicular to the line of sight from $E$, and then **project it from $E$ onto $\Pi$**: each point $P$ of the intended picture is painted where the line $EP$ crosses the canvas.

Seen from $E$, the painted canvas and the intended picture send the eye the same rays, so they look identical. Seen from anywhere else, the painting is a smear: if the line of sight meets the canvas at the angle $\varphi$, the image is stretched across the canvas by the factor $1/\sin\varphi$, which is large for a grazing point of view.`,
      idea: String.raw`This is central projection (art-1.2) used backwards. A perspective picture is the cross-section of the visual pyramid with the canvas; the intended picture and its shadow on the canvas are two cross-sections of the same pyramid, so from the apex they cover each other exactly. Tilting the canvas relative to the plane perpendicular to the sight line stretches distances along the tilt by $1/\sin\varphi$ and leaves the perpendicular direction alone, which is why Holbein's skull is a long sliver along the floor of the picture.`,
      caption: String.raw`The gold eye is the painter's point, set by the angle and distance sliders; the blue handle in the plan is the viewer. With the viewer on the gold point the retina (right) holds an undistorted skull, even though the canvas (middle) shows a long smear. Drag the viewer away, or press “in front”, and the skull collapses into the smear again.`,
      deps: ['art-1.2'],
      refs: ['Kemp ch. 2'],
      tags: ['anamorphosis', 'projection'],
      scope: String.raw`Exact for a flat canvas and a single fixed eye; both eyes, and a viewer who knows the trick, soften the effect in practice.`,
      viz(v) {
        const M = v.M;
        const phi = v.slider('angle $\\varphi$ of the line of sight to the canvas (°)', 8, 90, 24, { step: 0.5 });
        const dist = v.slider('painter’s distance', 2.5, 7, 4, { step: 0.05 });
        const plan = v.stage({ x: [-6, 6], y: [-5.2, 1.6], equal: true, axes: false, height: 300, weight: 1.15, title: 'plan: canvas, painter’s point, viewer' });
        const can = v.stage({ x: [-4.6, 4.6], y: [-2.1, 2.1], equal: true, axes: false, height: 300, weight: 1.15, title: 'the canvas as it is painted' });
        const ret = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 300, weight: 0.8, title: 'what the viewer’s eye receives' });
        const viewer = plan.handle(4 * Math.cos(rad(24)), -4 * Math.sin(rad(24)), { color: 'accent', label: 'viewer', labelPos: 'n', constrain: (x, y) => [M.clamp(x, -5.5, 5.5), M.clamp(y, -5.2, -0.4)] });
        v.button('viewer → painter’s point', () => { const e = eyeD(); viewer.set(e[0], e[1]); });
        v.button('viewer → in front of the canvas', () => viewer.set(0, -4.2));
        const SK = 0.9, CW = 4, CH = 2, shapes = skull().map((s) => ({ ...s, pts: densify(s.pts, 0.08) }));
        const eyeD = () => [dist.value * Math.cos(rad(phi.value)), -dist.value * Math.sin(rad(phi.value))];
        let info = {};
        const unit = (a) => { const n = Math.hypot(a[0], a[1]) || 1; return [a[0] / n, a[1] / n]; };
        v.render(() => {
          const e = eyeD(), E = [e[0], e[1], 0], fwd = unit([-e[0], -e[1]]), r = [fwd[1], -fwd[0]];
          const L = Math.hypot(e[0], e[1]);
          // intended picture P(a, b) = C + SK (a r + b z) is projected from E onto the canvas plane y = 0
          const paint = ([a, b]) => {
            const P = [SK * a * r[0], SK * a * r[1], SK * b], dy = P[1] - E[1], s = -E[1] / dy;
            return [E[0] + s * (P[0] - E[0]), E[2] + s * (P[2] - E[2])];
          };
          const painted = shapes.map((sh) => ({ ...sh, q: sh.pts.map(paint) }));
          // plan
          plan.line(-CW - 1, 0, CW + 1, 0, { color: 'orange', width: 4 });
          plan.text('canvas', CW + 1, 0.12, { align: 'right', baseline: 'bottom', size: 11, color: 'orange' });
          const half = [[-SK, 0], [SK, 0]].map(([a]) => [SK * 0 + a * r[0], a * r[1]]);
          plan.line(half[0][0], half[0][1], half[1][0], half[1][1], { color: 'gold', width: 2.4, dash: [6, 4] });
          plan.text('intended skull', half[1][0] + 0.15, half[1][1] + 0.35, { align: 'left', size: 11, color: 'gold' });
          let xs = painted.flatMap((s) => s.q.map((p) => p[0]));
          const xmin = Math.min(...xs), xmax = Math.max(...xs);
          plan.line(xmin, 0, xmax, 0, { color: 'accent', width: 5, alpha: 0.9 });
          for (const x of [xmin, xmax]) { plan.line(e[0], e[1], x, 0, { color: 'gold', width: 1.1, alpha: 0.75 }); }
          const vw = [viewer.x, viewer.y];
          for (const x of [xmin, xmax]) plan.line(vw[0], vw[1], x, 0, { color: 'accent', width: 1, alpha: 0.5, dash: [4, 4] });
          plan.dot(e[0], e[1], { r: 6, color: 'gold', label: 'painter’s point', labelPos: 's' });
          // canvas
          can.rect(-CW, -CH, CW, CH, { fill: 'orange', fillAlpha: 0.05, color: 'orange', width: 1.5 });
          can.clip(() => {
            for (const sh of painted) {
              if (sh.fill) can.poly(sh.q, { fill: 'ink', fillAlpha: 0.85, stroke: false });
              else can.path(sh.q, { color: 'accent', width: 2, close: sh.close });
            }
            for (const sh of painted) if (sh.close && !sh.fill) can.poly(sh.q, { fill: 'accent', fillAlpha: 0.06, stroke: false });
          });
          can.text(`stretched ${v.fix(1 / Math.sin(rad(phi.value)), 2)}×`, -CW + 0.15, CH - 0.15, { align: 'left', baseline: 'top', size: 12, color: 'muted' });
          // the viewer's retina: a pinhole camera at the viewer, aimed at the canvas centre, same focal distance L as the design
          const vf = unit([-vw[0], -vw[1]]), cam = camera([vw[0], vw[1], 0], { yaw: Math.atan2(vf[0], vf[1]), d: L });
          ret.rect(-1.7, -1.7, 1.7, 1.7, { color: 'faint', width: 1 });
          ret.clip(() => {
            const edge = (A, B) => seg3(ret, cam, [A[0], 0, A[1]], [B[0], 0, B[1]], { color: 'orange', width: 1.4, alpha: 0.8 });
            edge([-CW, -CH], [CW, -CH]); edge([CW, -CH], [CW, CH]); edge([CW, CH], [-CW, CH]); edge([-CW, CH], [-CW, -CH]);
            for (const sh of painted) {
              const pr = sh.q.map((q) => cam.proj([q[0], 0, q[1]]));
              if (pr.some((p) => !p)) continue;
              const pts = pr.map((p) => [p[0], p[1]]);
              if (sh.fill) ret.poly(pts, { fill: 'ink', fillAlpha: 0.85, stroke: false });
              else { ret.path(pts, { color: 'accent', width: 2, close: sh.close }); if (sh.close) ret.poly(pts, { fill: 'accent', fillAlpha: 0.06, stroke: false }); }
            }
            for (const sh of shapes) if (!sh.fill && sh.close) ret.path(sh.pts.map(([a, b]) => [SK * a, SK * b]), { color: 'green', width: 1, dash: [3, 3], alpha: 0.9, close: true });
          });
          // deviation of what the viewer receives from the intended picture, in units of the skull's width
          let dev = 0, n = 0;
          for (const sh of painted) for (let i = 0; i < sh.q.length; i += 3) {
            const p = cam.proj([sh.q[i][0], 0, sh.q[i][1]]); if (!p) continue;
            const t = [SK * shapes[painted.indexOf(sh)].pts[i][0], SK * shapes[painted.indexOf(sh)].pts[i][1]];
            dev = Math.max(dev, Math.hypot(p[0] - t[0], p[1] - t[1])); n++;
          }
          info = { width: xmax - xmin, dev: dev / (2 * SK * 0.8), moved: Math.hypot(vw[0] - e[0], vw[1] - e[1]) };
        });
        v.legend([['gold', 'painter’s point, rays and intended skull', { dash: true }], ['accent', 'the painted smear'], ['green', 'intended skull (drawn on the retina when you stand at the painter’s point)', { dash: true }]]);
        v.readout(() => `$\\varphi=${v.fix(phi.value, 1)}^\\circ$: stretch at the middle of the skull $1/\\sin\\varphi=${v.fix(1 / Math.sin(rad(phi.value)), 2)}$; the whole smear is $${v.fix(info.width / (2 * SK * 0.8), 2)}$ skull-widths wide, because the end farther from the painter's point is stretched more\nviewer ${v.fix(info.moved, 2)} from the painter’s point: largest departure of the retinal image from the intended skull, as a fraction of its width: $${info.dev < 1e-6 ? '<10^{-6}' : v.fix(info.dev, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Method',
      name: 'Mirror anamorphosis with a cylinder',
      credit: 'Popular from the seventeenth century on; see Kemp ch. 4',
      statement: String.raw`A polished vertical cylinder of radius $R$ stands on a table and an eye looks at it from a fixed point $E$. To make a drawing that appears as an upright, undistorted picture in the mirror, take each point $(a,b)$ of the wanted picture, follow the ray from $E$ through that point of the view to the cylinder, reflect it there by the law of reflection, and mark the table point $T$ where the reflected ray lands.

The set of all such $T$ is the anamorphic drawing: a distorted ring-shaped fan around the base of the mirror. Replacing the mirror by nothing, the drawing is unrecognisable; with the mirror in place, every point $T$ is seen at its intended place $(a,b)$.`,
      idea: String.raw`Reflection in a vertical mirror leaves the height of a ray's direction unchanged and reflects only its horizontal part, so the plan view reduces to reflection in a circle, which is the equal-angle rule that Fermat's principle selects (mech-5.2). The map $(a,b)\mapsto T$ is therefore explicit: intersect a line with a circle, mirror its direction about the normal, and descend to the table. Because the cylinder curves only horizontally, the picture is stretched strongly across the cylinder (a thin fan in the drawing) and only mildly up it. Art-2.1 is the flat-mirror, no-curvature version of the same inversion: find the drawing whose rays reach the eye from the right directions.`,
      caption: String.raw`Change the cylinder radius, and the eye's height and distance: the drawing on the table (left) is recomputed by ray tracing from the picture. On the right the table points are traced back through the mirror by an independent search for the reflection point (path of least length), and land on the intended face to within the error shown. Try the grid picture to see the warp itself.`,
      deps: ['art-2.1', 'mech-5.2'],
      refs: ['Kemp ch. 4'],
      tags: ['anamorphosis', 'mirror', 'reflection'],
      scope: String.raw`A vertical, perfectly specular cylinder, a point eye and a flat table; rays that miss the cylinder or leave it above its top are not drawn.`,
      viz(v) {
        const M = v.M;
        const Rs = v.slider('mirror radius $R$', 0.3, 1.2, 0.7, { step: 0.01 });
        const Hs = v.slider('eye height $H$', 2.5, 9, 6, { step: 0.05 });
        const Ds = v.slider('eye distance $D$', 3, 9, 4.5, { step: 0.05 });
        const img = v.select('picture', [{ value: 'face', label: 'face' }, { value: 'grid', label: 'grid' }], 'face');
        const rays = v.toggle('show rays', true);
        const plan = v.stage({ x: [-2.6, 2.6], y: [-2.6, 1.3], equal: true, axes: false, height: 440, weight: 1.1, title: 'the table seen from above' });
        const seen = v.stage({ x: [-2.8, 2.8], y: [-1.9, 1.9], equal: true, axes: false, height: 440, weight: 0.9, title: 'what the eye sees in the mirror' });
        const shapesFor = () => (img.value === 'face' ? face() : gridShapes(8)).map((s) => ({ ...s, pts: densify(s.pts, 0.04) }));
        let info = {};
        v.render(() => {
          const R = Rs.value, H = Hs.value, D = Ds.value, HC = 3, A = [0, 0, -0.4];
          const E = [0, -D, H];
          const fl = Math.hypot(A[1] - E[1], A[2] - E[2]), f = [0, (A[1] - E[1]) / fl, (A[2] - E[2]) / fl], rr = [1, 0, 0], uu = [0, -f[2], f[1]];
          const aMax = (f[1] * R) / Math.sqrt(D * D - R * R), hw = 0.45 * aMax;
          // forward trace of the view point (a, b) to the table
          const trace = (a, b) => {
            const d = [a * rr[0] + f[0] + b * uu[0], a * rr[1] + f[1] + b * uu[1], a * rr[2] + f[2] + b * uu[2]];
            const A2 = d[0] * d[0] + d[1] * d[1], B2 = E[1] * d[1], C2 = E[1] * E[1] - R * R, disc = B2 * B2 - A2 * C2;
            if (disc < 0) return null;
            const t = (-B2 - Math.sqrt(disc)) / A2, Q = [t * d[0], E[1] + t * d[1], E[2] + t * d[2]];
            if (t <= 0 || Q[2] < 0 || Q[2] > HC) return null;
            const n = [Q[0] / R, Q[1] / R], dn = d[0] * n[0] + d[1] * n[1], d2 = [d[0] - 2 * dn * n[0], d[1] - 2 * dn * n[1], d[2]];
            if (d2[2] >= -1e-9) return null;
            const tau = -Q[2] / d2[2];
            return { Q, T: [Q[0] + tau * d2[0], Q[1] + tau * d2[1]] };
          };
          // inverse: the reflection point of a table point T by the path of least length around the visible arc
          const E2 = [0, -D];
          const pathLen = (th, T) => { const q = [R * Math.cos(th), R * Math.sin(th)]; return Math.hypot(E2[0] - q[0], E2[1] - q[1]) + Math.hypot(T[0] - q[0], T[1] - q[1]); };
          const inverse = (T) => {
            let best = null, bl = Infinity;
            for (let i = 0; i < 360; i++) {
              const th = (2 * Math.PI * i) / 360, n = [Math.cos(th), Math.sin(th)], q = [R * n[0], R * n[1]];
              if (n[0] * (E2[0] - q[0]) + n[1] * (E2[1] - q[1]) <= 0 || n[0] * (T[0] - q[0]) + n[1] * (T[1] - q[1]) <= 0) continue;
              const l = pathLen(th, T); if (l < bl) { bl = l; best = th; }
            }
            if (best == null) return null;
            let lo = best - Math.PI / 180, hi = best + Math.PI / 180;
            for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (pathLen(m1, T) < pathLen(m2, T)) hi = m2; else lo = m1; }
            const th = (lo + hi) / 2, q = [R * Math.cos(th), R * Math.sin(th)];
            const l1 = Math.hypot(E2[0] - q[0], E2[1] - q[1]), l2 = Math.hypot(T[0] - q[0], T[1] - q[1]);
            const Q = [q[0], q[1], H * (l2 / (l1 + l2))];
            const d = [Q[0] - E[0], Q[1] - E[1], Q[2] - E[2]], dep = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
            return [(d[0] * rr[0] + d[1] * rr[1] + d[2] * rr[2]) / dep, (d[0] * uu[0] + d[1] * uu[1] + d[2] * uu[2]) / dep, Q];
          };
          const sh = shapesFor();
          plan.circle(0, 0, R, { fill: 'purple', fillAlpha: 0.22, color: 'purple', width: 2 });
          plan.text(`to the eye ${v.fix(D, 1)} away ↓`, 0, -2.45, { align: 'center', baseline: 'bottom', size: 11, color: 'gold' });
          plan.text('mirror', R + 0.1, R * 0.4, { align: 'left', size: 11, color: 'purple' });
          let maxErr = 0, count = 0, ok = 0;
          const keyPts = [];
          for (const s of sh) {
            const segs = []; let cur = [];
            for (const [x, y] of s.pts) {
              const t = trace(hw * x, hw * y);
              if (t) { cur.push(t.T); if (s.fill !== true && Math.abs(x) > 0.94 && Math.abs(y) < 0.1) keyPts.push(t); } else { if (cur.length) segs.push(cur); cur = []; }
            }
            if (cur.length) segs.push(cur);
            for (const sg of segs) {
              if (s.fill && s.close) plan.poly(sg, { fill: 'ink', fillAlpha: 0.85, stroke: false });
              else plan.path(sg, { color: img.value === 'face' ? 'accent' : 'accent', width: s.alpha ? 1 : 1.6, alpha: s.alpha ?? 1, close: s.close && segs.length === 1 && sg.length === s.pts.length });
            }
          }
          if (rays.value) {
            for (const [x, y] of [[-1, 0], [1, 0], [0, 1], [0, -1], [0.55, 0.55], [-0.55, 0.55]]) {
              const t = trace(hw * x, hw * y); if (!t) continue;
              plan.path([[0, -D], [t.Q[0], t.Q[1]], t.T], { color: 'gold', width: 1.1, alpha: 0.8 });
              plan.dot(t.T[0], t.T[1], { r: 3, color: 'gold' });
            }
          }
          // the view in the mirror: recovered through the independent inverse
          seen.rect(-aMax / hw, -1.9, aMax / hw, 1.9, { color: 'purple', width: 1.4, fill: 'purple', fillAlpha: 0.05 });
          seen.text('edges of the mirror', -aMax / hw + 0.1, 1.75, { align: 'left', size: 11, color: 'purple' });
          for (const s of sh) {
            const rec = [];
            for (const [x, y] of s.pts) {
              const t = trace(hw * x, hw * y); if (!t) { rec.push(null); continue; }
              const w = inverse(t.T); if (!w) { rec.push(null); continue; }
              const X = w[0] / hw, Y = w[1] / hw;
              rec.push([X, Y]); count++;
              const e = Math.hypot(X - x, Y - y); maxErr = Math.max(maxErr, e); if (e < 1e-3) ok++;
            }
            seen.path(s.pts, { color: 'faint', width: 1, dash: [3, 3], alpha: 0.9, close: s.close });
            if (s.fill && s.close && rec.every(Boolean)) seen.poly(rec, { fill: 'green', fillAlpha: 0.85, stroke: false });
            else seen.path(rec, { color: 'green', width: s.alpha ? 1 : 1.8, alpha: s.alpha ?? 1, close: s.close && rec.every(Boolean) });
          }
          info = { maxErr, count, ok, aMax, width: 2 * hw };
        });
        v.legend([['accent', 'drawing on the table'], ['purple', 'mirror'], ['gold', 'reflected rays', { dash: false }], ['green', 'recovered by searching for the reflection point']]);
        v.readout(() => `${info.count} points traced back through the mirror by minimising the path length $|EQ|+|QT|$: largest distance from the intended point $${v.sci(Math.max(info.maxErr, 1e-12), 2)}$ (in picture half-widths; ${info.ok} of ${info.count} within $10^{-3}$)\nthe picture spans $${v.fix((100 * info.width) / (2 * info.aMax), 0)}\\%$ of the mirror's apparent width`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Invention',
      name: 'The camera obscura',
      credit: 'Known to Mozi (c. 400 BC) and Aristotle; Ibn al-Haytham (c. 1020) analysed it',
      statement: String.raw`A **camera obscura** is a dark room or box with a small hole $H$ in one wall. Light from each point $P$ of a lit scene outside passes through the hole along the straight line $PH$ and lands on the opposite wall, or a screen at distance $L$ behind the hole. If the object lies at distance $D$ in front of the hole, the image on the screen is **inverted**, upside down and left to right, and its size is the object's size times $L/D$.

A hole of width $w$ lets each object point spread into a patch of width about $w(1+L/D)$, so the image is sharp only for a small hole, and bright only for a large one. Several holes give several overlapping images.`,
      idea: String.raw`Light travels in straight lines, so the hole selects exactly one direction from each point: the ray $PH$ (art-1.1 with the hole as the eye). Similar triangles about the hole (art-1.2) give the scale $L/D$, and because the rays cross at the hole a point above the axis arrives below it. A finite hole is a bundle of such rays, whose width on the screen is again fixed by similar triangles. This is the same central projection that the painter's pane realises, but made by nature on a wall.`,
      caption: String.raw`Drag the orange tip of the candle to change its distance and height; slide the screen with $L$ and widen the hole with $w$. Three object points send their central rays through the hole to the screen, giving an upside-down candle (right panel). Add a second or third hole and you see two or three candles: the reason a lens was needed.`,
      deps: ['art-1.2'],
      refs: ['Kemp ch. 4'],
      tags: ['camera obscura', 'pinhole'],
      scope: String.raw`Geometric optics with a hole much larger than the wavelength; for very small holes diffraction takes over (art-2.4).`,
      viz(v) {
        const M = v.M;
        const Ls = v.slider('screen distance $L$', 1.2, 6, 3.4, { step: 0.05 });
        const ws = v.slider('hole width $w$', 0.02, 0.9, 0.06, { step: 0.01, log: true });
        const nh = v.select('holes', ['1', '2', '3'], '1');
        const side = v.stage({ x: [-9.5, 7], y: [-3.6, 3.6], equal: true, axes: false, height: 340, weight: 1.6, title: 'the dark room, from the side' });
        const wall = v.stage({ x: [-2.4, 2.4], y: [-3.6, 3.6], equal: true, axes: false, height: 340, weight: 0.7, title: 'the screen, seen from inside the room' });
        const BASE = -0.9;
        const tip = side.handle(-4.6, 1.9, { color: 'orange', label: 'tip', labelPos: 'ne', constrain: (x, y) => [M.clamp(x, -9, -1.6), M.clamp(y, 0.4, 3.2)] });
        let info = {};
        v.render(() => {
          const D = -tip.x, L = Ls.value, w = ws.value, n = +nh.value, top = tip.y;
          const holes = Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * 1.2);
          // wall with holes
          const cuts = [-3.6, ...holes.flatMap((h) => [h - w / 2, h + w / 2]), 3.6];
          for (let i = 0; i < cuts.length; i += 2) side.line(0, cuts[i], 0, cuts[i + 1], { color: 'ink', width: 5 });
          side.text('wall with hole', -0.2, -3.3, { align: 'right', size: 11, color: 'muted' });
          side.line(L, -3.6, L, 3.6, { color: 'orange', width: 3 });
          side.text('screen', L - 0.1, 3.3, { align: 'right', size: 11, color: 'orange' });
          // object
          side.line(-D, BASE, -D, top, { color: 'ink', width: 5, alpha: 0.8 });
          side.poly([[-D - 0.12, top], [-D + 0.12, top], [-D, top + 0.4]], { fill: 'gold', fillAlpha: 0.9, stroke: false });
          side.line(-9.5, 0, 7, 0, { color: 'faint', width: 1, dash: [2, 5] });
          const pts = [[top, 'orange'], [(top + BASE) / 2, 'gold'], [BASE, 'teal']];
          const img = (yp, h) => h + (h - yp) * (L / D);
          for (const [yp, col] of pts) {
            side.dot(-D, yp, { r: 3.5, color: col });
            holes.forEach((h, k) => {
              side.line(-D, yp, 0, h, { color: col, width: 1.4, alpha: 0.9 });
              side.line(0, h, L, img(yp, h), { color: col, width: 1.4, alpha: 0.9 });
              if (k === 0) for (const e of [-w / 2, w / 2]) { side.line(-D, yp, 0, h + e, { color: col, width: 0.8, alpha: 0.35 }); side.line(0, h + e, L, img(yp, h + e), { color: col, width: 0.8, alpha: 0.35 }); }
            });
          }
          // image strips on the screen
          holes.forEach((h) => side.line(L + 0.08, img(top, h), L + 0.08, img(BASE, h), { color: 'accent', width: 4, alpha: 0.7 }));
          // the screen as seen from inside: candle copies scaled by L/D, inverted
          const m = L / D, B = w * (1 + L / D), px = Math.max(1.2, Math.min(34, B * wall.sx));
          wall.rect(-2.4, -3.6, 2.4, 3.6, { fill: 'orange', fillAlpha: 0.05, color: 'orange', width: 1.4 });
          wall.clip(() => holes.forEach((h) => {
            const Y = (y) => img(y, h), Z = (z) => -m * z;
            const body = [[-0.4, BASE], [0.4, BASE], [0.4, top], [-0.4, top]].map(([z, y]) => [Z(z), Y(y)]);
            wall.poly(body, { fill: 'ink', fillAlpha: 0.22 / Math.sqrt(n), color: 'ink', width: px, alpha: 0.5 / Math.sqrt(n) });
            const flame = [[-0.14, top], [0.14, top], [0.05, top + 0.45], [0, top + 0.6], [-0.05, top + 0.45]].map(([z, y]) => [Z(z), Y(y)]);
            wall.poly(flame, { fill: 'gold', fillAlpha: 0.7 / Math.sqrt(n), color: 'gold', width: px, alpha: 0.45 });
          }));
          info = { m, B, imgH: (top - BASE) * m, top: img(top, holes[0]), base: img(BASE, holes[0]), D, w };
        });
        v.readout(() => `$D=${v.fix(info.D, 2)}$, $L=${v.fix(Ls.value, 2)}$: image height $${v.fix(info.imgH, 3)}$ = object height $\\times L/D$, measured on the screen $${v.fix(Math.abs(info.top - info.base), 3)}$ (scale $-L/D=${v.fix(-info.m, 3)}$: the minus sign is the inversion)\nblur patch $w(1+L/D)=${v.fix(info.B, 3)}$, i.e. ${v.fix(100 * info.B / info.imgH, 1)}% of the image height; each added hole adds a copy`);
        v.legend([['orange', 'tip'], ['gold', 'middle'], ['teal', 'base'], ['accent', 'image on the screen']]);
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'Pinhole size: geometric blur versus diffraction',
      credit: 'Lord Rayleigh, 1891 (optimum pinhole)',
      statement: String.raw`For a pinhole of diameter $d$ at distance $f$ in front of the screen, the image of a distant point has two competing widths. The **geometric blur**, the shadow of the hole, is $b_g\approx d$ and shrinks with the hole. The **diffraction blur**, the Airy pattern of a circular aperture, has width $b_d\approx 2.44\,\lambda f/d$ and grows as the hole shrinks. The total is smallest when the two are comparable,
$$d_{\rm opt}\approx\sqrt{2.44\,\lambda f},\qquad b_{\min}\approx\sqrt2\,d_{\rm opt},$$
with the factor depending on how the blurs are combined and measured (Rayleigh's own optimum has a slightly different constant). No pinhole gives a sharper picture than this, which is why photographic pinholes are about $0.2$–$0.4$ mm wide.`,
      idea: String.raw`Geometry (art-2.3) says the blur grows linearly in $d$. Wave optics says a circular aperture of diameter $d$ cannot send light into an angle smaller than about $1.22\,\lambda/d$, so at distance $f$ the spot has diameter $2.44\,\lambda f/d$, falling as $1/d$. A decreasing and an increasing function of $d$ have a minimum where they cross. The picture below does not use these two formulas to draw the spot: it integrates the Fresnel diffraction integral of the circular hole, so the blur is the true one in between the two regimes too.`,
      caption: String.raw`Slide the pinhole diameter $d$ across the valley of the curve (left, logarithmic axes): the exact spot size, from the Fresnel integral, follows the two asymptotes and bottoms out near $d_{\rm opt}$. On the right, two point sources are imaged; at small $d$ the Airy rings appear, at large $d$ the two geometric discs overlap. Change the screen distance $f$, the wavelength, and the separation of the two sources.`,
      deps: ['art-2.3'],
      refs: ['Kemp ch. 4'],
      tags: ['pinhole', 'diffraction'],
      scope: String.raw`Scalar paraxial (Fresnel) diffraction of a plane wave from a distant point source by a circular hole in an opaque screen; the “blur” is the diameter that holds 84% of the light (the Airy first ring).`,
      viz(v) {
        const ds = v.slider('pinhole diameter $d$ (mm)', 0.04, 2.5, 0.8, { log: true, sig: 2, step: 0.01 });
        const fs = v.slider('screen distance $f$ (mm)', 20, 300, 100, { step: 1 });
        const ls = v.slider('wavelength $\\lambda$ (nm)', 400, 700, 550, { step: 1 });
        const sep = v.slider('angular separation of two stars (mrad)', 1, 20, 6, { step: 0.1 });
        const plot = v.stage({ x: [0.03, 3.2], y: [0.05, 4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'pinhole diameter d (mm)', ylabel: 'spot diameter (mm)' });
        const pic = v.stage({ x: [-1.5, 1.5], y: [-1.1, 1.1], equal: true, axes: false, height: 340, weight: 0.85, title: 'image of two point sources' });
        // radial intensity (plane of the screen) of a circular hole, Fresnel integral, point source at infinity
        const psf = (a, lam, f, nR, rmax) => {
          const k = (2 * Math.PI) / lam, NF = (a * a) / (lam * f), M = Math.max(120, Math.min(900, Math.ceil(10 * NF) + 80));
          const I = new Float64Array(nR + 1);
          for (let i = 0; i <= nR; i++) {
            const r = (rmax * i) / nR; let re = 0, im = 0;
            for (let j = 0; j <= M; j++) {
              const rho = (a * j) / M, wgt = j === 0 || j === M ? 0.5 : 1, ph = (k * rho * rho) / (2 * f), bj = J0((k * rho * r) / f) * rho * wgt;
              re += bj * Math.cos(ph); im += bj * Math.sin(ph);
            }
            const sc = (k / f) * (a / M); I[i] = (re * re + im * im) * sc * sc;
          }
          return I;
        };
        const d84 = (I, rmax, a) => { // diameter of the circle holding 84% of the total power pi a^2
          const nR = I.length - 1, tot = Math.PI * a * a; let E = 0;
          for (let i = 1; i <= nR; i++) {
            const r0 = (rmax * (i - 1)) / nR, r1 = (rmax * i) / nR, dE = 0.5 * (I[i - 1] * r0 + I[i] * r1) * 2 * Math.PI * (r1 - r0);
            if (E + dE >= 0.84 * tot) return 2 * (r0 + ((0.84 * tot - E) / dE) * (r1 - r0));
            E += dE;
          }
          return 2 * rmax;
        };
        let cacheKey = '', curve = [];
        const getCurve = (f, lam) => {
          const key = `${f}|${lam}`; if (key === cacheKey) return curve;
          const out = [];
          for (let i = 0; i <= 64; i++) {
            const d = Math.exp(Math.log(0.04) + (Math.log(3) - Math.log(0.04)) * (i / 64)), a = d / 2, lamMm = lam * 1e-6;
            const rmax = 3.2 * Math.max(d, (2.44 * lamMm * f) / d) / 2;
            out.push([d, d84(psf(a, lamMm, f, 90, rmax), rmax, a)]);
          }
          cacheKey = key; curve = out; return out;
        };
        let info = {};
        v.render(() => {
          const d = ds.value, f = fs.value, lam = ls.value, lamMm = lam * 1e-6;
          const cv = getCurve(f, lam);
          const dopt = Math.sqrt(2.44 * lamMm * f);
          plot.fn((x) => x, { color: 'orange', width: 1.4, dash: [6, 4] });
          plot.fn((x) => (2.44 * lamMm * f) / x, { color: 'purple', width: 1.4, dash: [6, 4] });
          plot.fn((x) => Math.hypot(x, (2.44 * lamMm * f) / x), { color: 'muted', width: 1.2, alpha: 0.8, dash: [2, 3] });
          plot.path(cv, { color: 'accent', width: 2.6 });
          plot.vline(dopt, { color: 'green', width: 1.2, dash: [4, 4] });
          plot.text('$\\sqrt{2.44\\lambda f}$', dopt * 1.06, 0.075, { align: 'left', size: 12, color: 'green' });
          // current hole: exact spot
          const rmax = 3.2 * Math.max(d, (2.44 * lamMm * f) / d) / 2, nR = 220, I = psf(d / 2, lamMm, f, nR, rmax), spot = d84(I, rmax, d / 2);
          plot.dot(d, spot, { r: 6, color: 'gold', label: `${v.fix(spot, 2)} mm`, labelPos: 'ne' });
          let imin = 0; cv.forEach((p, i) => { if (p[1] < cv[imin][1]) imin = i; });
          // the picture of two stars
          const s = (sep.value * 1e-3) * f, half = s / 2, peak = I[0];
          const at = (r) => { const t = (r / rmax) * nR; if (t >= nR) return 0; const i = Math.floor(t), u = t - i; return I[i] * (1 - u) + I[i + 1] * u; };
          const val = (x, y) => at(Math.hypot(x - half, y)) + at(Math.hypot(x + half, y));
          let norm = val(half, 0) || 1; norm = Math.max(norm, val(0, 0));
          pic.heat((x, y) => Math.min(1, val(x, y) / norm), { range: [0, 1], cmap: 'theme', color: 'accent', res: 3, key: `${d}|${f}|${lam}|${sep.value}` });
          pic.dot(half, 0, { r: 2, color: 'gold' }); pic.dot(-half, 0, { r: 2, color: 'gold' });
          pic.line(-1.3, -0.95, -0.3, -0.95, { color: 'ink', width: 2 });
          pic.text('1 mm', -0.8, -0.85, { size: 11, color: 'ink', align: 'center', baseline: 'bottom' });
          info = { spot, dopt, dmin: cv[imin][0], smin: cv[imin][1], dip: val(0, 0) / val(half, 0), s, peak };
        });
        v.legend([['orange', 'geometric blur $d$', { dash: true }], ['purple', 'Airy blur $2.44\\lambda f/d$', { dash: true }], ['accent', 'exact (Fresnel integral)'], ['gold', 'your pinhole', { dot: true }]]);
        v.readout(() => `$d=${v.fix(ds.value, 3)}$ mm: exact 84%-spot $${v.fix(info.spot, 3)}$ mm. Sharpest exact spot $${v.fix(info.smin, 3)}$ mm at $d\\approx${v.fix(info.dmin, 2)}$ mm; $\\sqrt{2.44\\lambda f}=${v.fix(info.dopt, 3)}$ mm\nthe two stars' images are $${v.fix(info.s, 2)}$ mm apart; brightness at the midpoint over the peak: $${v.fix(info.dip, 2)}$ ${info.dip < 0.735 ? '(resolved by Rayleigh’s 0.735 criterion)' : '(blurred together)'}`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Invention',
      name: 'The lens camera: image formation and focus',
      credit: 'Lens in the camera obscura: Cardano, 1550; Barbaro, 1568 (lens with diaphragm)',
      statement: String.raw`Fit a thin convex lens of focal length $f$ in the hole of the camera obscura. A point at distance $u$ in front of the lens is brought to a sharp point at distance $v$ behind it, where
$$\frac1u+\frac1v=\frac1f,$$
and the image has magnification $m=-v/u$ (inverted). The image is sharp only on the one screen distance $v$; with the screen at another distance $s$ each point becomes a disc of diameter $A\,|s-v|/v$, for a lens of diameter $A$. A lens of diameter $A$ gathers about $(A/w)^2$ times the light of a pinhole of width $w$ and gives a sharper picture than a pinhole of comparable brightness.

For $u<f$ no real image exists: the rays leave the lens still diverging and appear to come from a virtual image on the object's side.`,
      idea: String.raw`The thin-lens equation (waves-5.6) says that all rays from a point converge to one point. Three rays suffice to find it: one parallel to the axis goes through the far focus, one through the lens centre is undeviated, one through the near focus leaves parallel to the axis. Where they cross is the image; the similar triangles of the central ray give $m=-v/u$ (art-1.2). The pinhole of art-2.3 selects a single ray per object point, the lens collects a whole cone of them and bends them together, which is why focus matters and brightness does not cost sharpness.`,
      caption: String.raw`Drag the orange tip of the object along the axis and up and down; change $f$ and the lens diameter $A$. Three principal rays (solid) fix the image; its location agrees with $1/u+1/v=1/f$ in the readout. The screen is a separate control: slide it away from $v$ and the grey marginal rays through the rim of the lens make a blur disc. Move the object inside $f$ and the image turns virtual.`,
      deps: ['art-2.3', 'waves-5.6'],
      refs: ['Kemp ch. 4'],
      tags: ['lens', 'imaging'],
      scope: String.raw`Thin lens, paraxial rays, monochromatic light; aberrations (waves-5.13, waves-5.15) are ignored.`,
      viz(v) {
        const M = v.M;
        const fS = v.slider('focal length $f$ (cm)', 2, 8, 4, { step: 0.05 });
        const aS = v.slider('lens diameter $A$ (cm)', 1, 6, 4, { step: 0.05 });
        const sS = v.slider('screen position $s$ (cm)', 1.5, 22, 8, { step: 0.05 });
        const st = v.stage({ x: [-17, 24], y: [-3.8, 3.8], equal: true, axes: false, height: 330, title: 'object, lens and screen (side view)' });
        const tip = st.handle(-9, 1.6, { color: 'orange', label: 'object', labelPos: 'ne', constrain: (x, y) => [M.clamp(x, -16, -0.6 * fS.value), M.clamp(y, 0.4, 2.4)] });
        v.button('put the screen at the image', () => { const u = -tip.x, f = fS.value; if (u > f) sS.set(Math.min(22, 1 / (1 / f - 1 / u))); });
        let info = {};
        v.render(() => {
          const f = fS.value, A = aS.value, u = -tip.x, h = tip.y, s = sS.value;
          const real = u > f * 1.0000001, vv = 1 / (1 / f - 1 / u); // negative when virtual
          const hi = (-vv / u) * h; // image height (signed)
          st.line(-17, 0, 24, 0, { color: 'faint', width: 1 });
          // lens
          const lens = []; for (let i = 0; i <= 30; i++) { const y = -A / 2 + (A * i) / 30; lens.push([0.18 * (1 - (2 * y / A) ** 2) * (A / 4) ** 0.5 + 0, y]); }
          st.poly([...lens.map(([x, y]) => [x, y]), ...lens.map(([x, y]) => [-x, y]).reverse()], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.6 });
          st.dot(f, 0, { r: 3, color: 'muted', label: 'F', labelPos: 's' }); st.dot(-f, 0, { r: 3, color: 'muted', label: 'F', labelPos: 's' });
          // screen
          st.line(s, -4.4, s, 4.4, { color: 'orange', width: 3 }); st.text('screen', s - 0.3, 4.1, { align: 'right', size: 11, color: 'orange' });
          // object
          st.arrow(-u, 0, -u, h, { color: 'orange', width: 3 });
          const ok = (y) => Math.abs(y) <= A / 2 + 1e-9;
          const R1 = (x) => h * (1 - x / f);                // ray 1 after the lens: through the far focus
          const R2 = (x) => (-h / u) * x;                    // ray 2: straight through the centre
          const yL3 = (h * f) / (f - u);                     // ray 3 meets the lens here, then runs parallel to the axis
          const xr = 23;
          st.path([[-u, h], [0, h], [xr, R1(xr)]], { color: 'gold', width: 1.6 });
          st.path([[-u, h], [xr, R2(xr)]], { color: 'teal', width: 1.6 });
          st.path([[-u, h], [0, yL3], [xr, yL3]], { color: 'purple', width: 1.6 });
          // the image: where rays 1 and 3 cross (an independent check of the lens equation)
          const vRay = f * (1 - yL3 / h);
          const xi = vv, yi = R2(xi);
          if (!real) {
            st.path([[0, h], [xi, R1(xi)]], { color: 'gold', width: 1.2, dash: [5, 4], alpha: 0.8 });
            st.path([[0, yL3], [xi, yL3]], { color: 'purple', width: 1.2, dash: [5, 4], alpha: 0.8 });
            st.path([[0, 0], [xi, R2(xi)]], { color: 'teal', width: 1.2, dash: [5, 4], alpha: 0.8 });
          }
          st.arrow(xi, 0, xi, yi, { color: 'green', width: 3 });
          // marginal rays from the tip through the rim, and their blur on the screen
          let blur = NaN;
          if (real) {
            for (const rim of [A / 2, -A / 2]) {
              const slope = (yi - rim) / xi, xe = Math.max(s, xi);
              st.path([[-u, h], [0, rim], [xe, rim + slope * xe]], { color: 'muted', width: 1, alpha: 0.6 });
            }
            blur = (A * Math.abs(s - vv)) / vv;
            st.line(s + 0.2, yi - blur / 2, s + 0.2, yi + blur / 2, { color: 'red', width: 4, alpha: 0.85 });
          }
          const m = -vv / u;
          info = { u, v: vv, f, m, hi, blur, real, eq: 1 / u + 1 / vv - 1 / f, vRay, A, light: (A / 0.1) ** 2, clipped: !ok(h) || !ok(yL3) };
        });
        v.legend([['gold', 'parallel ray → far focus'], ['teal', 'ray through the centre'], ['purple', 'ray through the near focus'], ['green', 'image'], ['red', 'blur on the screen']]);
        v.readout(() => `$u=${v.fix(info.u, 2)}$, $f=${v.fix(info.f, 2)}$ → $v=${v.fix(info.v, 3)}$ cm (${info.real ? 'real, behind the lens' : 'virtual, on the object side'}); $1/u+1/v-1/f=${v.sci(Math.abs(info.eq) + 1e-17, 1)}$; crossing of the rays at $x=${v.fix(info.vRay, 3)}$\nmagnification $m=-v/u=${v.fix(info.m, 3)}$, image height $${v.fix(info.hi, 3)}$; ${info.real ? `blur disc on the screen $A|s-v|/v=${v.fix(info.blur, 3)}$ cm` : 'no real image to focus'}\nthe lens collects $(A/w)^2=${v.fix(info.light, 0)}$ times the light of a 1 mm pinhole${info.clipped ? ' · a principal ray misses the lens: enlarge $A$' : ''}`);
      },
    },
  ],
};
