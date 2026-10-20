// Visual Art & Color — Chapter 2 (part b): depth of field, Dürer's machines, the Hockney–Falco thesis, quadratura and the Ames room (2.6–2.10)
import { camera, seg3, drawFigure, rad, deg, projectToFrame, luteCurves, placeLocal, vaseCurves } from './ch02.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// A stick figure made of lamps, in unit coordinates (height 1, centred on x = 0).
function lampFigure() {
  const P = [];
  for (let i = 0; i < 14; i++) { const a = (2 * Math.PI * i) / 14; P.push([0.07 * Math.cos(a), 0.9 + 0.07 * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) P.push([0, 0.82 - (0.42 * i) / 8]);
  for (let i = 1; i <= 5; i++) { P.push([-0.2 * (i / 5), 0.74 - 0.12 * (i / 5)]); P.push([0.2 * (i / 5), 0.74 - 0.12 * (i / 5)]); }
  for (let i = 1; i <= 7; i++) { P.push([-0.13 * (i / 7), 0.4 - 0.4 * (i / 7)]); P.push([0.13 * (i / 7), 0.4 - 0.4 * (i / 7)]); }
  return P;
}

// Fit a general projective camera (3x4 matrix, 11 parameters) to 3D points and their 2D images by the DLT; returns {project, rms}.
function fitCamera(P3, p2, M) {
  const n = P3.length;
  const c3 = [0, 1, 2].map((k) => P3.reduce((s, p) => s + p[k], 0) / n), s3 = Math.sqrt(P3.reduce((s, p) => s + (p[0] - c3[0]) ** 2 + (p[1] - c3[1]) ** 2 + (p[2] - c3[2]) ** 2, 0) / n) || 1;
  const c2 = [0, 1].map((k) => p2.reduce((s, p) => s + p[k], 0) / n), s2 = Math.sqrt(p2.reduce((s, p) => s + (p[0] - c2[0]) ** 2 + (p[1] - c2[1]) ** 2, 0) / n) || 1;
  const AtA = Array.from({ length: 12 }, () => new Array(12).fill(0));
  const add = (r) => { for (let i = 0; i < 12; i++) { const ri = r[i]; if (ri === 0) continue; for (let j = i; j < 12; j++) AtA[i][j] += ri * r[j]; } };
  for (let i = 0; i < n; i++) {
    const X = [(P3[i][0] - c3[0]) / s3, (P3[i][1] - c3[1]) / s3, (P3[i][2] - c3[2]) / s3, 1], u = (p2[i][0] - c2[0]) / s2, w = (p2[i][1] - c2[1]) / s2;
    add([...X, 0, 0, 0, 0, ...X.map((x) => -u * x)]);
    add([0, 0, 0, 0, ...X, ...X.map((x) => -w * x)]);
  }
  for (let i = 0; i < 12; i++) for (let j = 0; j < i; j++) AtA[i][j] = AtA[j][i];
  const E = M.eigSym(AtA), p = E.vecs[E.vecs.length - 1];
  const project = (Q) => {
    const X = [(Q[0] - c3[0]) / s3, (Q[1] - c3[1]) / s3, (Q[2] - c3[2]) / s3, 1];
    const a = p[0] * X[0] + p[1] * X[1] + p[2] * X[2] + p[3], b = p[4] * X[0] + p[5] * X[1] + p[6] * X[2] + p[7], c = p[8] * X[0] + p[9] * X[1] + p[10] * X[2] + p[11];
    return [(a / c) * s2 + c2[0], (b / c) * s2 + c2[1]];
  };
  let ss = 0; for (let i = 0; i < n; i++) { const q = project(P3[i]); ss += (q[0] - p2[i][0]) ** 2 + (q[1] - p2[i][1]) ** 2; }
  return { project, rms: Math.sqrt(ss / n) };
}

export default {
  collection: 'art',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Depth of field and the circle of confusion',
      statement: String.raw`A lens of focal length $f$ and f-number $N$ (aperture diameter $A=f/N$), focused on distance $s$, images a point at distance $u$ not as a point but as a disc, the **circle of confusion**, of diameter
$$c(u)=\frac{f^2}{N\,(s-f)}\;\frac{|u-s|}{u}.$$
The picture looks sharp wherever $c$ stays below a tolerance $c_0$ (the eye's resolving power at the print size; about $0.03$ mm on a 36 mm-wide frame is the convention). The distances where this holds form the **depth of field**, from $s_{\rm near}$ to $s_{\rm far}$, with the **hyperfocal distance** $H=f^2/(Nc_0)+f$: focused at $H$, everything from $H/2$ to infinity is acceptably sharp. A smaller aperture (larger $N$) shrinks every blur disc and widens the range.`,
      idea: String.raw`With the lens fixed at the distance that focuses $s$, a point at $u$ comes to a focus at the image distance $v_u$ given by the lens equation (art-2.5) instead of $v_s$, and the cone of light of width $A$ is cut by the sensor at distance $|v_s-v_u|$ from its apex, which gives a disc of diameter $A\,|v_s-v_u|/v_u$. Substituting the thin-lens $v$'s gives the formula above. It grows linearly with the aperture $A=f/N$, which is why stopping down helps, and it stays bounded as $u\to\infty$ (the background blur saturates at $f^2/(N(s-f))$).`,
      caption: String.raw`Drag the focus handle along the distance axis (left) or change $f$ and $N$. The curve is the blur disc of an object at each distance; the green band is where it stays under the tolerance $c_0$. On the right, three groups of lamps at 2.5, 5 and 12 m are photographed: each lamp becomes a disc of the computed diameter, fainter as it spreads. Focus on the middle group and stop down to watch the discs of the other two shrink.`,
      deps: ['art-2.5'],
      refs: ['Kemp ch. 4'],
      tags: ['lens', 'blur'],
      scope: String.raw`Thin-lens, geometric blur on a 36 mm × 24 mm sensor; diffraction (art-2.4) sets a limit on stopping down; the convention $c_0\approx f_{\rm sensor}/1500$ is a rule of thumb, not a law.`,
      viz(v) {
        const M = v.M;
        const fS = v.slider('focal length $f$ (mm)', 24, 200, 85, { step: 1 });
        const nS = v.slider('f-number $N$', 1.4, 22, 2, { log: true, sig: 2, step: 0.1 });
        const cS = v.slider('tolerance $c_0$ (mm)', 0.01, 0.06, 0.03, { step: 0.005 });
        const plot = v.stage({ x: [1, 20], y: [0, 0.9], axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'distance u (m)', ylabel: 'blur disc c (mm)' });
        const pic = v.stage({ x: [-18, 18], y: [-12, 12], equal: true, axes: false, height: 340, weight: 1, title: 'the photograph (sensor 36 × 24 mm)' });
        const foc = plot.handle(5, 0, { color: 'accent', label: 'focus', labelPos: 'n', constrain: (x) => [clamp(x, 1.6, 19), 0] });
        const U = [2.5, 5, 12], X = [-0.25, 0.0, 1.3], COL = ['orange', 'teal', 'purple'], fig = lampFigure(), NAME = ['near', 'middle', 'far'];
        let info = {};
        v.render(() => {
          const f = fS.value, N = nS.value, c0 = cS.value, s = foc.x * 1000;
          // blur straight from the thin-lens image distances
          const blurAt = (uMm) => { const vs = (s * f) / (s - f), vu = (uMm * f) / (uMm - f); return ((f / N) * Math.abs(vs - vu)) / vu; };
          const H = (f * f) / (N * c0) + f, near = (s * (H - f)) / (H + s - 2 * f), far = s < H ? (s * (H - f)) / (H - s) : Infinity;
          plot.vband(near / 1000, Math.min(far / 1000, 20), { color: 'green', alpha: 0.13 });
          plot.hline(c0, { color: 'green', width: 1.2, dash: [5, 4] });
          plot.text('tolerance $c_0$', 19.7, c0 + 0.03, { align: 'right', size: 11, color: 'green' });
          plot.fn((u) => blurAt(u * 1000), { color: 'accent', width: 2.4, domain: [1, 20], n: 400 });
          U.forEach((u, k) => plot.dot(u, Math.min(0.89, blurAt(u * 1000)), { r: 5, color: COL[k], label: k === 1 ? undefined : NAME[k], labelPos: 'ne' }));
          // the photograph: lamps as discs
          pic.rect(-18, -12, 18, 12, { color: 'faint', width: 1 });
          const cs = U.map((u) => blurAt(u * 1000));
          U.forEach((u, k) => {
            const c = cs[k], r = Math.max(c / 2, 0.07), a = clamp(0.9 * Math.min(1, 0.1 / Math.max(c, 1e-6)) ** 2, 0.12, 0.9);
            for (const [x, y] of fig) pic.circle((f * (X[k] + 0.45 * x * 0.5)) / u, -8 + (f * 0.45 * y) / u, r, { fill: COL[k], fillAlpha: a, stroke: false });
          });
          info = { near, far, H, cs, c0, s };
        });
        v.legend([['accent', 'blur disc of an object at distance $u$'], ['green', 'depth of field', { area: true }], ['orange', 'near group'], ['teal', 'middle group'], ['purple', 'far group']]);
        v.readout(() => `focus ${v.fix(info.s / 1000, 2)} m: depth of field ${v.fix(info.near / 1000, 2)} m to ${isFinite(info.far) ? v.fix(info.far / 1000, 2) + ' m' : '∞'}; hyperfocal distance $H=${v.fix(info.H / 1000, 2)}$ m\nblur discs: near $${v.fix(info.cs[0], 3)}$, middle $${v.fix(info.cs[1], 3)}$, far $${v.fix(info.cs[2], 3)}$ mm against $c_0=${v.fix(info.c0, 3)}$ mm, so the ${info.cs.map((c, k) => NAME[k] + (c <= info.c0 + 1e-9 ? ' group is sharp' : ' group is soft')).join(', the ')}`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Invention',
      name: 'Dürer’s drawing frame and perspective machines',
      credit: 'Albrecht Dürer, Underweysung der Messung; the thread machine (lute) in the 1525 edition; the gridded-frame machines (vase, reclining nude) first printed in the 1538 edition',
      statement: String.raw`Dürer's perspective machines turn the construction of art-1.1 into a piece of furniture. In the **thread machine** a thread is fixed to a ring (the eyelet) in the wall, so that the eyelet is the eye $E$; its free end is held on a point $P$ of the object and passes through a frame, and the place where it crosses the frame is marked: the marks are exactly the points $P'=EP\cap\Pi$. In the **sighting machine** a fixed peephole holds the draughtsman's eye at $E$ while he copies what he sees through a gridded frame onto a paper with the same grid, square by square.

Both give the central projection of the object from $E$ onto the plane $\Pi$ of the frame. The thread machine is exact whatever the operator does, because the thread is the ray. The sighting machine is exact only as long as the eye stays on the peephole.`,
      idea: String.raw`The drawn mark must lie on the ray from the object point to the eye (art-1.2); if the eye drifts to $E'$ between squares, the mark is placed on the ray from $E'$ instead, and the squares no longer fit together. A taut thread makes it impossible to sight from anywhere but the eyelet: the machine enforces the single viewpoint that the theory assumes, which is why the thread version became the emblem of perspective.`,
      caption: String.raw`The vase is drawn through the frame in the picture on the right. Drag the eyelet (blue) in the plan or change the eye height. With the thread machine the drawing is always the exact projection (grey). Switch to the sighting machine and raise “head sway”: each point is now sighted from a slightly different place and the contour wobbles away from the exact one.`,
      deps: ['art-1.2'],
      refs: ['Kemp ch. 2', 'Kemp ch. 4'],
      tags: ['perspective', 'machines'],
      scope: String.raw`Ideal pinhole eye, perfectly planar frame; the sway is a random displacement of the eye for each point, in units of the frame width.`,
      viz(v) {
        const M = v.M;
        const dev = v.select('machine', [{ value: 'thread', label: 'thread and eyelet' }, { value: 'sight', label: 'peephole and grid' }], 'thread');
        const sway = v.slider('head sway', 0, 0.12, 0.025, { step: 0.001 });
        const hs = v.slider('eye height', -0.4, 0.8, 0.15, { step: 0.01 });
        const plan = v.stage({ x: [-2.4, 2.4], y: [-2.6, 3.2], equal: true, axes: false, height: 330, weight: 0.8, title: 'plan: eye, frame, vase' });
        const fr = v.stage({ x: [-1.15, 1.15], y: [-0.85, 0.85], equal: true, axes: false, height: 330, weight: 1.2, title: 'the frame (and the paper copy)' });
        const eye = plan.handle(0.0, -1.7, { color: 'accent', label: 'eyelet / peephole', labelPos: 'w', constrain: (x, y) => [clamp(x, -1.8, 1.8), clamp(y, -2.4, -0.7)] });
        const curves = vaseCurves([0, 1.2, -1.15], 1.3);
        const jit = curves.map((c, i) => c.map((_, j) => { const r = M.rng(1000 + i * 97 + j); return [r.normal(), r.normal(), r.normal()]; }));
        const GX = 8, GY = 6;
        let info = {};
        v.render(() => {
          const thread = dev.value === 'thread';
          sway.el.hidden = thread;
          const E = [eye.x, eye.y, hs.value];
          plan.line(-1, 0, 1, 0, { color: 'orange', width: 4 });
          plan.text('frame', 1.05, 0.12, { align: 'left', size: 11, color: 'orange' });
          plan.circle(0, 1.2, 0.55, { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 1.4 });
          plan.text('vase', 0.65, 1.2, { align: 'left', size: 11, color: 'purple' });
          fr.rect(-1, -0.75, 1, 0.75, { fill: 'orange', fillAlpha: 0.04, color: 'orange', width: 1.5 });
          if (!thread) {
            for (let i = 1; i < GX; i++) fr.line(-1 + (2 * i) / GX, -0.75, -1 + (2 * i) / GX, 0.75, { color: 'faint', width: 0.8, alpha: 0.7 });
            for (let j = 1; j < GY; j++) fr.line(-1, -0.75 + (1.5 * j) / GY, 1, -0.75 + (1.5 * j) / GY, { color: 'faint', width: 0.8, alpha: 0.7 });
          }
          let ss = 0, n = 0, xmin = 9, xmax = -9;
          const draw = (rows, st) => rows.forEach((pts) => fr.path(pts, st));
          const exact = curves.map((c) => c.map((P) => projectToFrame(E, P)));
          const drawn = curves.map((c, i) => c.map((P, j) => {
            const k = sway.value, Ej = thread ? E : [E[0] + k * jit[i][j][0], E[1] + k * jit[i][j][1] * 0.6, E[2] + k * jit[i][j][2]];
            const q = projectToFrame(Ej, P), q0 = exact[i][j];
            if (q && q0) { ss += (q[0] - q0[0]) ** 2 + (q[1] - q0[1]) ** 2; n++; xmin = Math.min(xmin, q0[0]); xmax = Math.max(xmax, q0[0]); }
            return q;
          }));
          fr.clip(() => {
            draw(exact, { color: 'muted', width: 1.2, alpha: thread ? 0.35 : 0.8, dash: thread ? false : [4, 3] });
            draw(drawn, { color: thread ? 'accent' : 'red', width: 1.6, alpha: 0.95 });
          });
          // thread to one point of the rim
          const rim = curves[0][curves[0].length - 1], pr = projectToFrame(E, rim);
          plan.dot(E[0], E[1], { r: 5, color: 'accent' });
          plan.line(E[0], E[1], rim[0], rim[1], { color: thread ? 'gold' : 'faint', width: thread ? 2 : 1, dash: thread ? false : [3, 4] });
          if (pr) plan.dot(pr[0], 0, { r: 4, color: 'gold' });
          if (pr) fr.dot(pr[0], pr[1], { r: 4, color: 'gold' });
          info = { rms: n ? Math.sqrt(ss / n) : 0, w: xmax - xmin, thread };
        });
        v.readout(() => `${info.thread ? 'thread machine: every mark is on a ray through the eyelet, so the drawing equals the exact projection (difference 0 by construction)' : `peephole machine: root-mean-square displacement of the drawing from the exact projection $${v.fix(info.rms, 4)}$ frame units = ${v.fix((100 * info.rms) / Math.max(info.w, 1e-9), 1)}% of the vase's width`}`);
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Hypothesis',
      name: 'Hockney–Falco thesis: did old masters trace projections?',
      credit: 'David Hockney and Charles Falco, 2001',
      statement: String.raw`The **Hockney–Falco thesis** holds that, from about 1420, a number of Western painters, first in Flanders and then in Italy, used optical projections (from a concave mirror and later a lens) as drawing aids: they projected the scene onto a surface and traced or painted from it, and this accounts for a sudden rise in the accuracy of perspective and in the rendering of folds and patterns.

The evidence offered is circumstantial: the geometry of some paintings is unusually consistent, with details such as chandeliers and carpet patterns that fit a single projection, and certain features (reversed handedness, patched focal planes) are said to betray a lens. Critics reply that no written or physical trace of such a practice survives, that painters could reach the same accuracy with the geometrical methods of art-1.7 and measuring aids, and that a good fit to one projection **cannot by itself show how** the painting was made.`,
      idea: String.raw`Whatever the answer, the logic is a statistical one. The test is: fit a single projective camera (a $3\times4$ matrix with 11 parameters) by homogeneous DLT to the known 3D shape and its painted image, and look at the leftover misfit. A traced image has small misfit; but so does an image constructed with care, and a bigger misfit does not exclude tracing in pieces from several lens positions. The decisive quantity is therefore the unaided accuracy of the painters of the time, which is exactly what is in dispute. The experiment below is synthetic: a made-up chandelier and your own assumed error sizes, not measurements of any painting.

The actual camera fit is homogeneous DLT: the normalized point equations form a real matrix A and a unit camera vector p is chosen to minimize |Ap|². The real spectral theorem ladr 7.29 diagonalizes the symmetric matrix AᵀA in an orthonormal eigenbasis. Writing p in that basis makes pᵀAᵀAp a weighted average of its eigenvalues, so a smallest-eigenvalue eigenvector minimizes this algebraic residual. The subsequently reported reprojection RMS is a different quantity; this fit is not a guarantee of its global minimum or a historical test identifying tracing.`,
      caption: String.raw`The synthetic “painting” of the chandelier is generated either by tracing a lens image (small hand error, optionally patched together from slightly different lens positions) or by constructing it by eye. Open circles are the painted points; blue dots show the single camera fitted by homogeneous DLT; thin lines are the misfit, magnified. The histogram collects 200 paintings of each kind: painters differ in skill, so the histograms have width: when the assumed unaided accuracy is close to the tracer's, they overlap and the misfit of one painting says little about its method.`,
      deps: ["art-2.5", "art-2.3", "ladr-7.29"],
      refs: ['Kemp ch. 4'],
      tags: ['optics', 'art history', 'inference'],
      scope: String.raw`Contested. The claim is historical (that the practice existed), and the picture tests only what a misfit analysis can and cannot discriminate; the error sizes are assumptions of the reader, not data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hockney%E2%80%93Falco_thesis' },
      viz(v) {
        const M = v.M;
        const meth = v.select('show a painting made', [{ value: 'trace', label: 'by tracing a lens image' }, { value: 'eye', label: 'by eye (construction)' }], 'trace');
        const sT = v.slider('tracing: hand error σ (%)', 0, 2, 0.4, { step: 0.05 });
        const patch = v.toggle('tracer re-positions the lens between parts', false);
        const sC = v.slider('unaided: hand error σ (%)', 0, 3, 0.6, { step: 0.05 });
        const dC = v.slider('unaided: inconsistency between parts', 0, 0.2, 0.01, { step: 0.005 });
        const skill = v.slider('painters differ in skill (spread of σ)', 0, 1, 0.5, { step: 0.05 });
        const mag = v.slider('misfit magnified ×', 1, 40, 12, { step: 1 });
        const seed = { v: 1 };
        v.button('new sample', () => { seed.v++; });
        const pic = v.stage({ x: [-0.55, 0.55], y: [-0.55, 0.55], equal: true, axes: false, height: 360, weight: 1, title: 'one synthetic painting and its best single projection' });
        const hist = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'misfit of the best single projection (% of picture height)', ylabel: 'fraction of paintings' });
        // the chandelier: a stem and two tiers of six arms; part 0 = stem, 1 = upper tier, 2 = lower tier
        const pts = [], part = [], lines = [];
        const addLine = (arr, p) => { const idx = []; for (const q of arr) { idx.push(pts.length); pts.push(q); part.push(p); } lines.push(idx); };
        addLine(Array.from({ length: 8 }, (_, i) => [0, 0, (1.3 * i) / 7]), 0);
        [[1.0, 0.34, 1], [0.45, 0.52, 2]].forEach(([zt, R, p]) => {
          for (let a = 0; a < 6; a++) {
            const th = (a * Math.PI) / 3 + (p === 2 ? Math.PI / 6 : 0), arm = [];
            for (let j = 0; j <= 5; j++) { const t = j / 5; arm.push([R * t * Math.cos(th), R * t * Math.sin(th), zt - 0.12 * Math.sin(Math.PI * t * 0.9) + 0.18 * t * t]); }
            const end = arm[5]; arm.push([end[0], end[1], end[2] + 0.06], [end[0], end[1], end[2] + 0.2]);
            addLine(arm, p);
          }
        });
        const E0 = [0.35, -3.6, 0.55], aim = [0, 0, 0.62];
        const yaw0 = Math.atan2(aim[0] - E0[0], aim[1] - E0[1]), pitch0 = Math.atan2(aim[2] - E0[2], Math.hypot(aim[0] - E0[0], aim[1] - E0[1]));
        const cam = (dE) => camera([E0[0] + dE[0], E0[1] + dE[1], E0[2] + dE[2]], { yaw: yaw0, pitch: pitch0, d: 1 });
        const base = cam([0, 0, 0]);
        const truth = pts.map((P) => base.proj(P));
        const Himg = Math.max(...truth.map((p) => p[1])) - Math.min(...truth.map((p) => p[1]));
        const cx = (Math.max(...truth.map((p) => p[0])) + Math.min(...truth.map((p) => p[0]))) / 2, cy = (Math.max(...truth.map((p) => p[1])) + Math.min(...truth.map((p) => p[1]))) / 2, ext = 0.6 * Himg;
        const makePainting = (r, sigma, delta, parts) => {
          const shifts = [0, 1, 2].map(() => [r.normal() * delta, r.normal() * delta * 0.4, r.normal() * delta]);
          const sg = sigma * Math.exp(skill.value * r.normal() - (skill.value * skill.value) / 2);
          return pts.map((P, i) => { const q = parts ? cam(shifts[part[i]]).proj(P) : truth[i]; return [q[0] + (r.normal() * sg * Himg) / 100, q[1] + (r.normal() * sg * Himg) / 100]; });
        };
        const misfit = (pnt) => (fitCamera(pts, pnt, M).rms / Himg) * 100;
        let cacheKey = '', RT = [], RC = [];
        let info = {};
        v.render(() => {
          const key = `${sT.value}|${patch.value}|${sC.value}|${dC.value}|${skill.value}`;
          if (key !== cacheKey) {
            const r = v.rng(77); RT = []; RC = [];
            for (let i = 0; i < 200; i++) { RT.push(misfit(makePainting(r, sT.value, patch.value ? 0.12 : 0, patch.value))); RC.push(misfit(makePainting(r, sC.value, dC.value, true))); }
            cacheKey = key;
          }
          const r = v.rng(500 + seed.v), isT = meth.value === 'trace';
          const paint = isT ? makePainting(r, sT.value, patch.value ? 0.12 : 0, patch.value) : makePainting(r, sC.value, dC.value, true);
          const fit = fitCamera(pts, paint, M), k = mag.value;
          for (const idx of lines) pic.path(idx.map((i) => paint[i]), { color: 'faint', width: 1, alpha: 0.8 });
          pts.forEach((P, i) => {
            const q = fit.project(P), p = paint[i];
            pic.line(q[0], q[1], q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k, { color: 'red', width: 1, alpha: 0.8 });
            pic.dot(q[0], q[1], { r: 2, color: 'accent' });
            pic.dot(p[0], p[1], { r: 3, hollow: true, color: 'ink' });
          });
          const own = (fit.rms / Himg) * 100;
          const hi = Math.max(1.5, Math.ceil(Math.max(...RT, ...RC) * 1.1 * 2) / 2), bins = 24, bw = hi / bins;
          const norm = (R) => { const c = new Array(bins).fill(0); R.forEach((x) => { c[Math.min(bins - 1, Math.floor(x / bw))]++; }); return c.map((n) => n / 200); };
          const hT = norm(RT), hC = norm(RC), top = Math.max(0.1, ...hT, ...hC) * 1.15;
          hist.setView([0, hi], [0, top]);
          pic.setView([cx - ext, cx + ext], [cy - ext, cy + ext]);
          const edges = Array.from({ length: bins + 1 }, (_, i) => i * bw);
          hist.hist({ edges, counts: hT }, { color: 'accent', fillAlpha: 0.3, density: false });
          hist.hist({ edges, counts: hC }, { color: 'orange', fillAlpha: 0.3, density: false });
          hist.vline(own, { color: 'ink', width: 2 });
          const med = (a) => M.median(a);
          let gt = 0, eq = 0; for (const a of RC) for (const b of RT) { if (a > b) gt++; else if (a === b) eq++; }
          info = { own, mT: med(RT), mC: med(RC), auc: (gt + eq / 2) / (RT.length * RC.length), isT };
        });
        v.legend([['accent', 'traced lens images (200)', { area: true }], ['orange', 'built by eye (200)', { area: true }], ['ink', 'the painting shown']]);
        v.readout(() => `shown: misfit $${v.fix(info.own, 2)}\\%$ of the picture height (${info.isT ? 'traced' : 'by eye'}); median over 200 paintings: traced $${v.fix(info.mT, 2)}\\%$, by eye $${v.fix(info.mC, 2)}\\%$\nprobability that a painting built by eye has a larger misfit than a traced one: $${v.fix(info.auc, 2)}$ (0.5 = the fit tells the methods apart no better than a coin toss)`);
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Quadratura ceilings and the Ames room',
      credit: 'Andrea Pozzo, Sant’Ignazio, Rome, c. 1685–94; Adelbert Ames Jr., 1946',
      statement: String.raw`Two illusions use the fact that a picture fixes only the **directions** of rays from a chosen eye point, not distances.

**Quadratura.** A flat ceiling is painted with architecture that continues the real walls upward. If every painted point is placed where the ray from the marked eye point $E_0$ to the intended 3D point crosses the ceiling, then from $E_0$ the painted columns look like straight continuations of the real ones, and the vault seems to open to the sky; from any other point the lines no longer point where a real column would.

**Ames room.** A room with a slanted back wall and sloping floor and ceiling, built so that every wall edge lies on the same ray from a peephole as the corresponding edge of an ordinary rectangular room, gives through the peephole the same image as a rectangular room. Two people of the same height standing at the far and near corners are seen at depths the brain takes to be equal, so one looks small and one looks large.`,
      idea: String.raw`Both are consequences of art-1.10: the picture is a set of rays from $E_0$, and any scene whose points lie on those rays gives the same image. In the quadratura the ceiling replaces the painted architecture by its shadow from $E_0$; moving the eye changes the directions of the painted points but not those of the real architecture, so the join breaks. In the Ames room each point $P$ of the “apparent” rectangular room is slid along its ray to $\lambda P$; to keep the floor, ceiling and walls planar the factors at the four corners must satisfy $1/\lambda_{NL}+1/\lambda_{BR}=1/\lambda_{NR}+1/\lambda_{BL}$. The viewer, assuming the walls are square, assigns the depth $y$ instead of $\lambda y$ to a figure, hence the apparent height $h/\lambda$.

The planarity constraint can be checked by the determinant criterion ladr 9.50. Write each apparent corner as P_i=(x_i,y_i,z_i), scaled from the eye to λ_i P_i with λ_i>0. Four scaled corners are coplanar exactly when their augmented 4×4 coordinate matrix is singular. Factoring λ_i from each row replaces its last entry by 1/λ_i. For each nondegenerate apparent rectangular face whose plane does not contain the eye, the two affine-diagonal sums of the first three coordinates agree, so the remaining determinant condition is precisely the displayed equality of opposite reciprocal-scale sums. The condition is geometric planarity, not an inference about perceived depth.`,
      caption: String.raw`Quadratura: drag the viewer over the nave floor; the green dashed columns are the real tall columns the painting depicts, the blue ones are what is painted on the flat ceiling. They coincide only from the marked spot. Ames room: change how much farther the left corner is, how far the right near corner is moved, and the two people's places; the solid room and the dashed rectangular room coincide in the peephole's view while the plan shows how unlike they are. Move the eye off the peephole and the room is a wedge again.`,
      deps: ["art-1.10", "art-2.1", "ladr-9.50"],
      refs: ['Kemp ch. 3'],
      tags: ['illusion', 'perspective'],
      scope: String.raw`Exact for a point eye; two eyes and moving heads reveal depth, which is why the illusions need a peephole or a marked spot.`,
      viz(v) {
        const M = v.M;
        const mode = v.select('illusion', [{ value: 'pozzo', label: 'painted ceiling' }, { value: 'ames', label: 'Ames room' }], 'pozzo', { onChange: () => setMode() });
        // --- quadratura
        const pPlan = v.stage({ x: [-7.5, 7.5], y: [-11.5, 11.5], equal: true, axes: false, height: 400, weight: 0.8, title: 'the painted ceiling (plan) and the viewer on the floor' });
        const pView = v.stage({ x: [-1.7, 1.7], y: [-1.2, 1.5], equal: true, axes: false, height: 400, weight: 1.2, title: 'the view from the viewer (looking up)' });
        const viewer = pPlan.handle(2.2, -1.6, { color: 'accent', label: 'viewer', labelPos: 'sw', constrain: (x, y) => [clamp(x, -4.3, 4.3), clamp(y, -8.5, 8.5)] });
        // --- Ames room
        const aPlan = v.stage({ x: [-6, 4.4], y: [-1, 11], equal: true, axes: false, height: 380, weight: 0.9, title: 'plan: the real room and the rectangular room it imitates' });
        const aView = v.stage({ x: [-1.3, 1.3], y: [-0.8, 1.1], equal: true, axes: false, height: 380, weight: 1.1, title: 'through the peephole' });
        const Lc = v.slider('left back corner: how much farther', 1, 2.2, 1.6, { step: 0.01 });
        const Rn = v.slider('right near corner: how much nearer', 0.55, 1, 0.8, { step: 0.01 });
        const xl = v.slider('left person', -1.8, -0.2, -1.4, { step: 0.01 });
        const xr = v.slider('right person', 0.2, 1.8, 1.2, { step: 0.01 });
        const off = v.slider('eye off the peephole (sideways)', -1, 1, 0, { step: 0.01 });
        const spotBtn = v.button('viewer → marked spot', () => viewer.set(0, 0));
        const ctls = [spotBtn, Lc, Rn, xl, xr, off];
        const stages = { pozzo: [pPlan, pView], ames: [aPlan, aView] };
        function setMode() {
          for (const k of Object.keys(stages)) stages[k].forEach((s) => { s.el.style.display = mode.value === k ? '' : 'none'; });
          ctls.forEach((c, i) => { (c.el || c).hidden = i === 0 ? mode.value !== 'pozzo' : mode.value !== 'ames'; });
        }
        setMode();
        const HC = 11, HV = 10, FL = -1.6, XC = 4.5, YC = [-9, -3, 3, 9], KT = HC / (HC + HV);
        let info = {};
        v.render(() => {
          setMode();
          v.legend(mode.value === 'pozzo' ? [['ink', 'real architecture'], ['accent', 'painted on the flat ceiling'], ['green', 'the tall columns it depicts', { dash: true }]] : [['accent', 'the real (distorted) room'], ['gold', 'the rectangular room it imitates', { dash: true }], ['orange', 'left person'], ['teal', 'right person']]);
          if (mode.value === 'pozzo') {
            const E = [viewer.x, viewer.y, 0], C = camera(E, { yaw: 0, pitch: rad(52), d: 1 });
            // plan of the ceiling
            pPlan.rect(-XC, -9.5, XC, 9.5, { color: 'ink', width: 1.4 });
            pPlan.rect(-XC * KT, -9 * KT - 0.2, XC * KT, 9 * KT + 0.2, { color: 'accent', width: 1.2, alpha: 0.7 });
            for (const sx of [-1, 1]) for (const y of YC) { pPlan.line(sx * XC, y, sx * XC * KT, y * KT, { color: 'accent', width: 1.6 }); pPlan.dot(sx * XC, y, { r: 3, color: 'ink' }); }
            pPlan.dot(0, 0, { r: 9, color: 'gold', hollow: true, label: 'marked spot', labelPos: 'ne' });
            // the view
            let maxAng = 0;
            const ang = (a, b) => Math.acos(clamp(M.dot(a, b) / (Math.hypot(...a) * Math.hypot(...b)), -1, 1));
            pView.clip(() => {
              for (const sx of [-1, 1]) for (const y of YC) {
                seg3(pView, C, [sx * XC, y, FL], [sx * XC, y, HC], { color: 'ink', width: 2 });
                seg3(pView, C, [sx * XC, y, HC], [sx * XC, y, HC + HV], { color: 'green', width: 1.8, dash: [6, 4], alpha: 0.9 });
                seg3(pView, C, [sx * XC, y, HC], [sx * XC * KT, y * KT, HC], { color: 'accent', width: 2.4 });
                const top = [sx * XC, y, HC + HV], q = [sx * XC * KT, y * KT, HC];
                if (y > 0) maxAng = Math.max(maxAng, deg(ang(M.vsub(top, E), M.vsub(q, E))));
              }
              for (const [a, b] of [[[-XC, 9], [XC, 9]], [[-XC, 3], [XC, 3]]]) {
                seg3(pView, C, [a[0], a[1], HC], [b[0], b[1], HC], { color: 'ink', width: 1.6 });
                seg3(pView, C, [a[0] * KT, a[1] * KT, HC], [b[0] * KT, b[1] * KT, HC], { color: 'accent', width: 1.6 });
                seg3(pView, C, [a[0], a[1], HC + HV], [b[0], b[1], HC + HV], { color: 'green', width: 1.4, dash: [6, 4], alpha: 0.9 });
              }
            });
            info = { mode: 'pozzo', maxAng, off: Math.hypot(E[0], E[1]) };
          } else {
            const w = 2, D1 = 2, D = 6, zf = -1.2, zc = 1.8, rho = Rn.value, L = Lc.value;
            const lam = { NL: 1, NR: rho, BL: L, BR: 1 / (1 / rho + 1 / L - 1) };
            const corners = { NL: [-w, D1], NR: [w, D1], BL: [-w, D], BR: [w, D] };
            const g = (x, y) => { const u = (x + w) / (2 * w), t = (y - D1) / (D - D1); return 1 / lam.NL + (1 / lam.NR - 1 / lam.NL) * u + (1 / lam.BL - 1 / lam.NL) * t; };
            const room = (sc) => { const o = {}; for (const k of Object.keys(corners)) { const l = sc ? lam[k] : 1; o[k] = [[l * corners[k][0], l * corners[k][1], l * zf], [l * corners[k][0], l * corners[k][1], l * zc]]; } return o; };
            const real = room(true), cube = room(false);
            const people = [xl.value, xr.value].map((xc) => { const yc = D - 0.7, l = 1 / g(xc, yc); return { xc, yc, l, F: [l * xc, l * yc, l * zf] }; });
            // plan
            const quad = (R) => ['NL', 'NR', 'BR', 'BL'].map((k) => [R[k][0][0], R[k][0][1]]);
            aPlan.poly(quad(real), { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 2 });
            aPlan.path([...quad(cube), quad(cube)[0]], { color: 'gold', width: 1.4, dash: [6, 4] });
            aPlan.dot(0, 0, { r: 5, color: 'ink', label: 'peephole', labelPos: 'e' });
            people.forEach((p, i) => {
              aPlan.dot(p.F[0], p.F[1], { r: 5, color: i ? 'teal' : 'orange', label: i ? 'right' : 'left', labelPos: 'n' });
              aPlan.line(0, 0, p.F[0] * 1.15, p.F[1] * 1.15, { color: 'faint', width: 0.8, dash: [3, 4] });
            });
            aPlan.text('dashed: the rectangular room it imitates', -5.8, 10.3, { align: 'left', size: 11, color: 'gold' });
            // view
            const C0 = camera([0, 0, 0], { yaw: 0, d: 1 }), C1 = camera([off.value, 0, 0], { yaw: 0, d: 1 });
            const edges = (R, C, st) => {
              const e = (a, b) => seg3(aView, C, a, b, st);
              const q = ['NL', 'NR', 'BR', 'BL'];
              for (let i = 0; i < 4; i++) { const k = q[i], k2 = q[(i + 1) % 4]; e(R[k][0], R[k2][0]); e(R[k][1], R[k2][1]); e(R[k][0], R[k][1]); }
            };
            aView.clip(() => {
              edges(real, C1, { color: 'accent', width: 2.2 });
              edges(cube, C0, { color: 'gold', width: 1.4, dash: [6, 4] });
              people.forEach((p, i) => drawFigure(aView, (P) => { const r = C1.proj(P); return r ? [r[0], r[1]] : null; }, p.F, 1.7, { color: i ? 'teal' : 'orange', alpha: 0.7 }));
            });
            // check: the images of the real room and the rectangular room coincide from the peephole
            let dmax = 0;
            for (const k of Object.keys(corners)) for (const z of [0, 1]) { const a = C0.proj(real[k][z]), b = C0.proj(cube[k][z]); dmax = Math.max(dmax, Math.hypot(a[0] - b[0], a[1] - b[1])); }
            const h = people.map((p) => { const a = C0.proj(p.F), b = C0.proj([p.F[0], p.F[1], p.F[2] + 1.7]); return b[1] - a[1]; });
            info = { mode: 'ames', lam, dmax, h, apparent: people.map((p) => 1.7 / p.l), l: people.map((p) => p.l), off: off.value };
          }
        });
        v.readout(() => (info.mode === 'pozzo'
          ? `viewer ${v.fix(info.off, 2)} m from the marked spot: angle between each painted column top and the real column top as seen by the viewer, at worst $${v.fix(info.maxAng, 2)}^\\circ$ (0 at the spot)`
          : `from the peephole the image of the real room and of the rectangular room differ by $${info.dmax < 1e-9 ? '<10^{-9}' : v.fix(info.dmax, 6)}$ (picture units); back corners at distances $\\times${v.fix(info.lam.BL, 2)}$ and $\\times${v.fix(info.lam.BR, 2)}$\nthe left person (real height 1.70 m, scale $\\times${v.fix(info.l[0], 2)}$) appears ${v.fix(info.apparent[0], 2)} m tall, the right ($\\times${v.fix(info.l[1], 2)}$) appears ${v.fix(info.apparent[1], 2)} m: ratio ${v.fix(info.apparent[1] / info.apparent[0], 2)}${info.off ? ` · eye ${v.fix(Math.abs(info.off), 2)} m off the peephole: the real room no longer looks rectangular` : ''}`));
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Paper',
      name: 'Underweysung der Messung (Instruction in Measurement)',
      paper: { authors: 'Albrecht Dürer', year: 1525, title: 'Underweysung der Messung, mit dem Zirckel und Richtscheyt, in Linien, Ebenen unnd gantzen Corporen', venue: 'Nuremberg, 1525', url: 'https://archive.org/details/vnderweysungderm00drer' },
      introduces: ['art-2.7'],
      credit: 'Albrecht Dürer, 1525 (second edition 1538, with two further perspective woodcuts)',
      statement: String.raw`Dürer's treatise teaches a painter geometry with compass and ruler: curves, plane figures and solids, how to construct them, and, in the closing pages, how to draw them in perspective with the aid of apparatus (the lute and portrait woodcuts are in the 1525 edition; the second edition of 1538 adds two more, the vase and the reclining nude drawn through a gridded frame). The book introduced the German artists' world to a *mechanical* realisation of perspective: a thread fixed to a ring in the wall serves as the line of sight to a point of the object, a frame between them records where the thread crosses it, and the marks, joined, are the object in perspective. In modern terms the marks are the central projection of the object from the ring onto the plane of the frame, exact as long as the thread is taut.`,
      idea: String.raw`Before the book, perspective in the north rested on workshop rules and on Alberti's costruzione legittima (art-1.16), which Dürer knew of through Italian travel and teachers. The treatise did two things: it set out practical Euclidean geometry for craftsmen in German, and it showed that perspective is the intersection of the visual pyramid with a plane (art-1.1) by building one from string. The machine of art-2.7 follows from that picture, with the thread as the ray and the frame as the picture plane.`,
      caption: String.raw`The thread runs from the eyelet (blue, in the plan and the side view) to a pencil point that moves over a lute. Drag the slider, or press play, to move the end of the thread over the lute and watch the gold mark appear where the thread crosses the frame; the marks build the foreshortened lute. Move the eyelet and the whole drawing changes as a central projection from the new point. Let the thread sag and the marks drift off the exact projection (grey).`,
      deps: ['art-1.2', 'art-1.16'],
      refs: [],
      tags: ['Dürer', 'perspective', 'treatise'],
      links: { archive: 'https://archive.org/details/vnderweysungderm00drer' },
      viz(v) {
        const M = v.M;
        const prog = v.slider('pencil position along the lute', 0, 1, 1, { step: 0.001 });
        const sag = v.slider('thread sag (% of its length)', 0, 4, 0, { step: 0.05 });
        const top = v.stage({ x: [-2.2, 2.2], y: [-2.6, 3.6], equal: true, axes: false, height: 340, weight: 0.8, title: 'plan (from above)' });
        const side = v.stage({ x: [-2.8, 4.2], y: [-1.9, 2.6], equal: true, axes: false, height: 340, weight: 1.0, title: 'side view (depth to the right)' });
        const fr = v.stage({ x: [-1.15, 1.15], y: [-0.95, 1.0], equal: true, axes: false, height: 340, weight: 0.9, title: 'the frame: marks of the thread' });
        const E = [0.3, -1.8, 0.9];
        const eT = top.handle(E[0], E[1], { color: 'accent', label: 'eyelet', labelPos: 'w', constrain: (x, y) => [clamp(x, -1.8, 1.8), clamp(y, -2.4, -0.7)] });
        const eS = side.handle(E[1], E[2], { color: 'accent', label: 'eyelet', labelPos: 'n', constrain: (x, y) => [clamp(x, -2.4, -0.7), clamp(y, -0.5, 1.6)] });
        eT.onDrag = () => { E[0] = eT.x; E[1] = eT.y; eS.set(E[1], E[2]); };
        eS.onDrag = () => { E[1] = eS.x; E[2] = eS.y; eT.set(E[0], E[1]); };
        const place = (P) => placeLocal(P, [0.0, 0.9, -0.62], { pitch: 1.15, yaw: 0.3, scale: 1.5, belly: 1 });
        const curves = luteCurves().map((c) => c.map(place));
        const flat = []; curves.forEach((c, i) => c.forEach((P, j) => flat.push({ P, i, j })));
        let raf = 0;
        v.button('▶ trace the lute', () => {
          cancelAnimationFrame(raf);
          if (window.__vizStill) { prog.set(1); return; }
          const t0 = performance.now();
          const step = (now) => { const u = Math.min(1, (now - t0) / 8000); prog.set(u); if (u < 1) raf = requestAnimationFrame(step); };
          raf = requestAnimationFrame(step);
        });
        v.onCleanup(() => cancelAnimationFrame(raf));
        let info = {};
        v.render(() => {
          const k = Math.floor(prog.value * (flat.length - 1)), cur = flat[k];
          // the marks: crossing of the (possibly sagging) thread with the frame
          const mark = (P) => {
            const q = projectToFrame(E, P); if (!q) return null;
            const s = -E[1] / (P[1] - E[1]), len = Math.hypot(P[0] - E[0], P[1] - E[1], P[2] - E[2]);
            return [q[0], q[1] - 4 * (sag.value / 100) * len * s * (1 - s)];
          };
          const exact = curves.map((c) => c.map((P) => projectToFrame(E, P)));
          const marks = curves.map((c) => c.map(mark));
          fr.rect(-1, -0.8, 1, 0.9, { fill: 'orange', fillAlpha: 0.04, color: 'orange', width: 1.5 });
          fr.clip(() => {
            if (sag.value > 0) exact.forEach((c) => fr.path(c, { color: 'muted', width: 1, alpha: 0.6 }));
            marks.forEach((m, i) => {
              const upto = m.slice(0, cur.i === i ? cur.j + 1 : (i < cur.i ? m.length : 0));
              if (upto.length > 1) fr.path(upto, { color: 'accent', width: 1.8 });
            });
          });
          const mk = mark(cur.P);
          if (mk) { fr.dot(mk[0], mk[1], { r: 5, color: 'gold' }); fr.line(-1, mk[1], 1, mk[1], { color: 'gold', width: 0.8, alpha: 0.6, dash: [3, 3] }); fr.line(mk[0], -0.8, mk[0], 0.9, { color: 'gold', width: 0.8, alpha: 0.6, dash: [3, 3] }); }
          // plan
          top.line(-1, 0, 1, 0, { color: 'orange', width: 4 });
          top.text('frame', 1.05, 0.12, { align: 'left', size: 11, color: 'orange' });
          curves.forEach((c) => top.path(c.map((P) => [P[0], P[1]]), { color: 'muted', width: 0.8, alpha: 0.7 }));
          top.dot(E[0], E[1], { r: 5, color: 'accent' });
          top.line(E[0], E[1], cur.P[0], cur.P[1], { color: 'gold', width: 1.8 });
          top.dot(cur.P[0], cur.P[1], { r: 4, color: 'red' });
          // side view: horizontal = depth y, vertical = height z
          side.line(0, -1.9, 0, 2.6, { color: 'orange', width: 4 });
          side.text('frame', 0.1, 2.35, { align: 'left', size: 11, color: 'orange' });
          curves.forEach((c) => side.path(c.map((P) => [P[1], P[2]]), { color: 'muted', width: 0.8, alpha: 0.7 }));
          side.dot(E[1], E[2], { r: 5, color: 'accent' });
          const n = 24, th = [];
          for (let i = 0; i <= n; i++) { const s = i / n, Pt = [E[1] + s * (cur.P[1] - E[1]), E[2] + s * (cur.P[2] - E[2])]; th.push([Pt[0], Pt[1] - 4 * (sag.value / 100) * Math.hypot(cur.P[0] - E[0], cur.P[1] - E[1], cur.P[2] - E[2]) * s * (1 - s)]); }
          side.path(th, { color: 'gold', width: 1.8 });
          side.dot(cur.P[1], cur.P[2], { r: 4, color: 'red' });
          let dm = 0, hmin = 9, hmax = -9;
          marks.forEach((m, i) => m.forEach((q, j) => { const e = exact[i][j]; if (q && e) { dm = Math.max(dm, Math.hypot(q[0] - e[0], q[1] - e[1])); hmin = Math.min(hmin, e[1]); hmax = Math.max(hmax, e[1]); } }));
          // independent check of the marks without sag against the pinhole camera formula
          const Ci = (() => { const d = 1; return (P) => { const dy = P[1] - E[1]; return [E[0] + (-E[1] / dy) * (P[0] - E[0]), E[2] + (-E[1] / dy) * (P[2] - E[2])]; }; })();
          const q0 = Ci(cur.P);
          info = { dm, h: hmax - hmin, ptsDone: k + 1, N: flat.length, err0: mk ? Math.hypot(mk[0] - q0[0], mk[1] - q0[1]) : 0 };
        });
        v.legend([['accent', 'marks recorded so far'], ['gold', 'the thread'], ['red', 'pencil on the lute'], ['muted', 'exact projection']]);
        v.readout(() => `${info.ptsDone} of ${info.N} points marked; thread sag $${v.fix(sag.value, 2)}\\%$ shifts the worst mark by $${v.fix(info.dm, 4)}$ frame units = ${v.fix((100 * info.dm) / info.h, 2)}% of the drawing's height (a taut thread: 0)\nthe present mark differs from the central-projection formula $x'=x_E+\\tfrac{-y_E}{y-y_E}(x-x_E)$ by $${info.err0 < 1e-9 ? '<10^{-9}' : v.fix(info.err0, 5)}$`);
      },
    },
  ],
};
