// Visual Art & Color — Chapter 1: Linear perspective (items 1.1–1.8; 1.9–1.16 are in ch01-b.js)
import { camera, seg3, boxMesh, houseMesh, drawSolids, meet, lineDist, gridLines, drawFigure, clipSeg2, prismMesh, pyramidMesh } from './ch01.shared.js';

const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

export default {
  collection: 'art',
  chapter: 1,
  title: 'Linear perspective',
  summary: String.raw`A picture in perspective is the trace left on a window by the rays that run from each object to one eye. From that single construction follow the vanishing points, the horizon at eye level, the one-, two- and three-point recipes taught in studios, Alberti’s tiled floor, and the distortions that appear when a picture is seen from the wrong place or spans too wide an angle. Perspective is also the birthplace of projective geometry: the cross-ratio and Desargues’ theorem are exactly what survives the projection.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'The picture plane and the visual pyramid',
      credit: 'Leon Battista Alberti, De pictura, 1435',
      statement: String.raw`A picture in linear perspective is fixed by an eye point $E$ and a plane $\Pi$, the **picture plane** (Alberti’s “open window”), placed between the eye and the scene. Each visible point $P$ of the scene is drawn at the point $P'$ where the straight segment from $P$ to $E$ crosses $\Pi$.

The rays from $E$ to all the points of an object form a cone with its apex at the eye and the object as its base, the **visual pyramid**; the picture of the object is the cross-section of that pyramid by $\Pi$. The picture belongs to one eye at one place: moving $E$ or $\Pi$ changes it.`,
      idea: String.raw`Light travels in straight lines, so an eye fixed at $E$ receives light from $P$ only along the line $PE$. A mark placed anywhere on that line, in particular where it crosses a pane of glass, reaches the eye from the same direction. A pane on which every crossing point is painted in the colour of its $P$ therefore sends that single eye the same pattern of directions as the scene itself. Alberti made this the definition of a painting: an intersection of the visual pyramid. Vanishing points, the horizon and the distortions of wide angles all follow from this one construction, central projection.`,
      caption: String.raw`Drag the eye (blue) and the pane (orange), and drag the background to turn the scene. Gold rays run from every corner of the house and the cube to the eye; where they pierce the pane they trace the picture, which is shown flat on the right. Switch the visual pyramid on to see the cones of rays whose cross-sections make the picture.`,
      deps: [],
      see: ['cg-8.3'],
      refs: ['Kemp ch. 1', 'Kemp App. I'],
      tags: ['perspective', 'central projection'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.45, 0.95], equal: true, axes: false, height: 390, weight: 1.25, title: 'eye, pane and objects' });
        const P = v.stage({ x: [-0.82, 0.82], y: [-0.06, 1.3], equal: true, axes: false, height: 390, weight: 0.75, title: 'what is traced on the pane' });
        const sc = v.scene3(S, { yaw: -0.85, pitch: 0.4, axes: false, lim: 2.2 });
        const G = -0.75, PW = 0.75, PH = 1.25; // ground height, pane half-width and height (scene units)
        const house = houseMesh([0.35, 1.05, G], [0.55, 0.78, 0.4], 0.26, 1.15);
        const cube = boxMesh([-0.5, 0.65, G], [0.34, 0.34, 0.34], -0.3);
        const solids = [{ mesh: house, color: 'accent' }, { mesh: cube, color: 'purple' }];
        let eye = null;
        const pane = sc.handle([PW, -0.45, G + PH], { color: 'orange', label: 'pane', snap: (p) => [PW, M.clamp(p[1], (eye ? eye.p[1] : -1.4) + 0.25, 0.1), G + PH] });
        eye = sc.handle([-0.2, -1.35, G + 0.92], { color: 'accent', label: 'eye', snap: (p) => [M.clamp(p[0], -1.1, 1.1), M.clamp(p[1], -1.9, pane.p[1] - 0.25), M.clamp(p[2], G + 0.08, G + 1.45)] });
        const pyr = v.toggle('visual pyramid', true);
        const floor = gridLines(-1.2, 1.2, 0.0, 1.8, 0.2, G);
        const pierce = (Q) => {
          const E = eye.p, yp = pane.p[1];
          if (Q[1] <= E[1] + 1e-6) return null;
          const t = (yp - E[1]) / (Q[1] - E[1]);
          return [E[0] + t * (Q[0] - E[0]), yp, E[2] + t * (Q[2] - E[2])];
        };
        const flat = (Q) => { const R = pierce(Q); return R ? [R[0], R[2] - G] : null; }; // pane coordinates (across, height above ground)
        const box = [[-PW, PW], [0, PH]];
        v.render(() => {
          const E = eye.p, yp = pane.p[1];
          sc.begin();
          sc.poly([[-1.5, -2.0, G], [1.5, -2.0, G], [1.5, 1.9, G], [-1.5, 1.9, G]], { fill: 'faint', fillAlpha: 0.07, edge: false, bias: 6 });
          for (const [a, b] of floor) sc.line(a, b, { color: 'faint', width: 0.8, alpha: 0.7, bias: 3 }, 6);
          for (const s of solids) for (const f of s.mesh.F) { // solid-looking objects: cull faces turned away from the viewer
            const q = f.map((i) => sc.P(s.mesh.V[i])); let ar = 0;
            for (let i = 0; i < q.length; i++) { const j = (i + 1) % q.length; ar += q[i][0] * q[j][1] - q[j][0] * q[i][1]; }
            if (ar <= 0) continue;
            const A = s.mesh.V[f[0]], B = s.mesh.V[f[1]], Cc = s.mesh.V[f[2]], u = M.vsub(B, A), w = M.vsub(Cc, A), n = M.normalize(M.cross3(u, w));
            sc.poly(f.map((i) => s.mesh.V[i]), { fill: s.color, fillAlpha: 0.12 + 0.3 * (1 - Math.max(0, M.dot(n, [0.3, -0.45, 0.84]))), color: s.color, width: 1.4 });
          }
          sc.poly([[-PW, yp, G], [PW, yp, G], [PW, yp, G + PH], [-PW, yp, G + PH]], { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.8 });
          // the rays and their pierce points
          for (const s of solids) {
            const pts = s.mesh.V.map((V) => ({ V, Q: pierce(V) }));
            for (const { V, Q } of pts) {
              if (!Q) continue;
              sc.line(E, Q, { color: 'gold', width: 1.1, alpha: 0.75 }, 6);
              sc.line(Q, V, { color: 'gold', width: 0.9, alpha: 0.35 }, 6);
              sc.dot(Q, { r: 2.6, color: 'gold' });
            }
            // the traced picture on the pane
            for (const [a, b] of s.mesh.E) {
              const A = flat(s.mesh.V[a]), B = flat(s.mesh.V[b]); if (!A || !B) continue;
              const c = clipSeg2(A, B, box[0], box[1]); if (!c) continue;
              sc.line([c[0][0], yp, c[0][1] + G], [c[1][0], yp, c[1][1] + G], { color: s.color, width: 2.4, bias: -0.05 }, 2);
            }
            if (pyr.value) { // the visual pyramid over the outline of the object
              const H = M.hull(s.mesh.V.map((V, i) => { const f = flat(V) || [0, 0]; return [f[0], f[1], i]; }));
              for (let i = 0; i < H.length; i++) {
                const a = s.mesh.V[H[i][2]], b = s.mesh.V[H[(i + 1) % H.length][2]];
                sc.poly([E, a, b], { fill: 'gold', fillAlpha: 0.07, edge: false });
              }
            }
          }
          sc.tex('E', [E[0], E[1], E[2] - 0.13], { color: 'accent', size: 15 });
          sc.flush();
          // the flat picture
          P.rect(-PW, 0, PW, PH, { fill: 'orange', fillAlpha: 0.05, color: 'orange', width: 1.6 });
          const hz = E[2] - G;
          P.clip(() => {
            for (const [a, b] of floor) { const A = flat(a), B = flat(b); if (A && B) P.line(A[0], A[1], B[0], B[1], { color: 'faint', width: 0.9 }); }
            drawSolids(P, flat, E, solids, { light: [-0.4, -0.7, 0.6] });
          }, box[0], box[1]);
          if (hz > 0 && hz < PH) {
            P.line(-PW, hz, PW, hz, { color: 'muted', width: 1, dash: [5, 4] });
            P.text('horizon (eye level)', PW - 0.02, hz + 0.035, { align: 'right', baseline: 'bottom', size: 11, color: 'muted' });
          }
          P.text('ground line', -PW + 0.02, 0.035, { align: 'left', baseline: 'bottom', size: 11, color: 'muted' });
        });
        v.legend([['gold', 'rays from the objects to the eye'], ['orange', 'pane (picture plane)', { area: true }], ['accent', 'house and its picture'], ['purple', 'cube and its picture']]);
        v.readout(() => {
          const E = eye.p, d = pane.p[1] - E[1];
          const ridge = house.V[8], R = flat(ridge), depth = ridge[1] - E[1];
          return `eye height $${v.fix(E[2] - G, 2)}$, eye-to-pane distance $d = ${v.fix(d, 2)}$ · the ray from the ridge pierces the pane at height $${v.fix(R[1], 3)}$ · objects at depth $D$ are traced at scale $d/D$: $${v.fix(d / depth, 3)}$ for the ridge · ${solids.reduce((s, x) => s + x.mesh.V.length, 0)} rays, ${solids.reduce((s, x) => s + x.mesh.V.length, 0)} pierce points`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Method',
      name: 'Central projection by similar triangles',
      statement: String.raw`Put the eye at the origin looking along the $y$-axis, with the picture plane at distance $d$ (the plane $y=d$). A point $P=(x,y,z)$ in front of the eye ($y>0$, with $z$ measured from eye level) is drawn at
$$x'=\frac{d\,x}{y},\qquad z'=\frac{d\,z}{y}.$$
So an object’s image shrinks in proportion to $1/y$: twice as far away, half as large. Changing $d$ only rescales the whole picture. Points beside or behind the eye ($y\le 0$) have no image.`,
      idea: String.raw`In the side view, the eye, the foot of the perpendicular on the picture plane and the pierce point $P'$ form a right triangle similar to the one formed by the eye, the point straight ahead at depth $y$ and $P$ itself: the two triangles share the angle at the eye. Corresponding sides are proportional, $z'/d=z/y$, and the top view gives $x'/d=x/y$ in the same way (art-1.1). This division by depth is the whole of perspective.`,
      caption: String.raw`Drag the top of the pole in the side view (its height and depth) or in the top view (its sideways position and depth), and move the picture plane with $d$. The shaded triangles stay similar. The readout computes $x'$ and $z'$ both from the formula and from where the ray actually crosses the plane.`,
      deps: ['art-1.1'],
      refs: ['Kemp App. I'],
      tags: ['perspective', 'similar triangles'],
      viz(v) {
        const M = v.M, H0 = 1.0; // eye height above the ground
        const side = v.stage({ x: [-0.3, 6.3], y: [-1.25, 2.05], equal: true, axes: false, height: 270, weight: 1.35, title: 'side view' });
        const pic = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.05], equal: true, axes: false, height: 270, weight: 0.72, minWidth: 220, title: 'the picture plane, face on' });
        const top = v.stage({ x: [-0.3, 6.3], y: [-1.45, 1.45], equal: true, axes: false, height: 180, full: true, title: 'top view (seen from above)' });
        const dS = v.slider('picture distance $d$', 0.5, 2.6, 1.5, { step: 0.01 });
        const Ps = side.handle(4, 1.2, { color: 'accent', label: 'P', constrain: (x, y) => [M.clamp(x, 0.6, 6.1), M.clamp(y, -H0 + 0.15, 1.95)] });
        const Pt = top.handle(4, 0.7, { color: 'accent', label: 'P', constrain: (x, y) => [M.clamp(x, 0.6, 6.1), M.clamp(y, -1.35, 1.35)] });
        Ps.onDrag = () => { Pt.x = Ps.x; };
        Pt.onDrag = () => { Ps.x = Pt.x; };
        const view = (S, X, Y, d, lab, low, eyePos) => {
          const Yp = (d * Y) / X;
          S.poly([[0, 0], [X, 0], [X, Y]], { fill: 'gold', fillAlpha: 0.13, stroke: false });
          S.poly([[0, 0], [d, 0], [d, Yp]], { fill: 'accent', fillAlpha: 0.28, stroke: false });
          S.line(0, 0, 6.3, 0, { color: 'muted', width: 1, dash: [5, 4] });
          S.line(0, 0, X, Y, { color: 'gold', width: 2 });
          S.line(X, 0, X, Y, { color: 'gold', width: 1.2, dash: [3, 3] });
          S.line(d, 0, d, Yp, { color: 'accent', width: 1.2, dash: [3, 3] });
          S.dot(d, Yp, { r: 5, color: 'accent', label: lab + "'", labelPos: Yp >= 0 ? 'nw' : 'sw' });
          S.tex('d', d / 2, 0, { baseline: low ? 'top' : 'bottom', dy: low ? 4 : -4, color: 'accent', size: 14 });
          S.tex('y', X / 2 + d / 2, 0, { baseline: Y >= 0 ? 'top' : 'bottom', dy: Y >= 0 ? 4 : -4, color: 'muted', size: 14 });
          S.tex(lab, X, Y / 2, { align: 'left', dx: 7, color: 'gold', size: 14 });
          S.dot(0, 0, { r: 5, color: 'ink', label: 'eye', labelPos: eyePos });
          return Yp;
        };
        v.render(() => {
          const d = dS.value, Y = Ps.x, Z = Ps.y, X = Pt.y;
          // side view: ground, picture plane, pole and its image
          side.line(-0.3, -H0, 6.3, -H0, { color: 'faint', width: 1.4 });
          side.line(d, -H0, d, 2.05, { color: 'orange', width: 2.4 });
          side.text('picture plane', d + 0.06, 1.95, { align: 'left', baseline: 'top', size: 11, color: 'orange' });
          side.line(Y, -H0, Y, Z, { color: 'ink', width: 3 });
          side.line(0, 0, Y, -H0, { color: 'gold', width: 1, alpha: 0.6 });
          side.line(d, (-d * H0) / Y, d, (d * Z) / Y, { color: 'accent', width: 4 });
          const Zp = view(side, Y, Z, d, 'z', Z > 0.25, 's');
          // top view
          top.line(d, -1.45, d, 1.45, { color: 'orange', width: 2.4 });
          const Xp = view(top, Y, X, d, 'x', X > 0.25, 'w');
          // the picture
          pic.rect(-1, -1, 1, 1, { fill: 'orange', fillAlpha: 0.05, color: 'orange', width: 1.4 });
          pic.line(-1, 0, 1, 0, { color: 'muted', width: 1, dash: [5, 4] });
          pic.text('horizon', 0.97, 0.03, { align: 'right', baseline: 'bottom', size: 11, color: 'muted' });
          pic.clip(() => {
            pic.line(Xp, (-d * H0) / Y, Xp, Zp, { color: 'accent', width: 4 });
            pic.dot(Xp, Zp, { r: 5, color: 'accent', label: "P'", labelPos: 'ne' });
          }, [-1, 1], [-1, 1]);
          pic.dot(0, 0, { r: 3, color: 'muted' });
        });
        v.legend([['gold', 'ray from $P$ to the eye'], ['accent', 'its image on the picture plane'], ['orange', 'picture plane']]);
        v.readout(() => {
          const d = dS.value, Y = Ps.x, Z = Ps.y, X = Pt.y;
          const hit = meet([0, 0], [Y, Z], [d, -5], [d, 5]), hitT = meet([0, 0], [Y, X], [d, -5], [d, 5]);
          return `$x' = d\\,x/y = ${v.fix(d, 2)}\\cdot${v.fix(X, 2)}/${v.fix(Y, 2)} = ${v.fix((d * X) / Y, 4)}$ (ray meets the plane at $${v.fix(hitT[1], 4)}$) · $z' = d\\,z/y = ${v.fix((d * Z) / Y, 4)}$ (ray: $${v.fix(hit[1], 4)}$) · the pole’s image is $d/y = ${v.fix(d / Y, 3)}$ of its height`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Event',
      name: 'Brunelleschi’s Baptistery experiment',
      credit: 'Filippo Brunelleschi, c. 1413–1425 (told by Antonio Manetti, 1480s)',
      statement: String.raw`Some time between about 1413 and 1425 (historians disagree on the date) the Florentine architect Filippo Brunelleschi painted a panel about half a braccio square showing the Baptistery of San Giovanni as seen from about three braccia inside the central door of the cathedral opposite. The only detailed account, in Antonio Manetti’s *Life of Brunelleschi* (1480s), says the panel had a hole, as small as a lentil on the painted side, at the point of the picture directly opposite the eye. The viewer looked through it from the back while holding a flat mirror in front of the painted side, and saw the painting reflected; the sky was burnished silver, so real clouds drifted across it. Manetti, who held the panel himself, says it looked like the real thing. It is usually taken as the first demonstration that a perspective picture matches the world when, and only when, it is seen from the point it was constructed for.`,
      idea: String.raw`The peephole puts the eye at the centre of projection, exactly where a perspective picture needs it (art-1.2). The mirror folds the line of sight back onto the panel, so the painting acts as a picture plane at twice the eye–mirror distance. Manetti notes that the mirror distance in “small braccia” stood for the real distance in braccia: the scale must be right as well as the position.

Brunelleschi’s second panel, of the Piazza della Signoria, had no hole: a picture that large could not be held up with a mirror at arm’s length. It was cut along the roofline to be seen against the real sky, and the viewer had to find the point unaided. A mirror reverses left and right, and Manetti does not say how Brunelleschi allowed for this. Both panels are lost, so every reconstruction, including this one, is schematic.`,
      caption: String.raw`Drag your eye in the plan and set the mirror distance $m$. Below the orange mirror edge you see the panel reflected in the mirror (blue); above it you see the real piazza (grey). From the station point (green), with $m$ at half the panel’s construction distance, the painted lines continue the real ones across the edge; anywhere else they break. Lower the mirror to compare more of the view.`,
      deps: ['art-1.2'],
      refs: ['Kemp ch. 1', 'Kemp App. II'],
      tags: ['Brunelleschi', 'perspective', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Filippo_Brunelleschi' },
      viz(v) {
        const M = v.M, EH = 1.6, ST = [0, -1.75]; // eye height; station point three braccia (≈1.75 m) inside the door
        const plan = v.stage({ x: [-30, 30], y: [-9, 57], equal: true, axes: false, height: 350, weight: 0.78, title: 'plan (schematic)' });
        const view = v.stage({ x: [-0.8, 0.8], y: [-0.2, 0.82], equal: true, axes: false, height: 350, weight: 1.22, title: 'what the eye sees through the hole' });
        const mS = v.slider('mirror distance $m$ (× panel distance $D$)', 0.3, 0.8, 0.5, { step: 0.005 });
        const lowS = v.slider('lower the mirror', 0, 1, 0.5, { step: 0.01 });
        const eye = plan.handle(ST[0], ST[1], { color: 'accent', label: 'eye', labelPos: 'e', constrain: (x, y) => [M.clamp(x, -9, 9), M.clamp(y, -7, 14)] });
        v.button('Go to the station point', () => eye.set(ST[0], ST[1]));
        // schematic geometry (metres): octagonal Baptistery, flat face toward the cathedral
        const BC = [0, 40], AP = 12.8, RV = AP / Math.cos(Math.PI / 8);
        const ring = (r, c = BC) => Array.from({ length: 8 }, (_, k) => { const a = -Math.PI / 2 + Math.PI / 8 + (k * Math.PI) / 4; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
        const oct = ring(RV), lan = ring(2.3);
        const solids = [
          { mesh: prismMesh(oct, 0, 19.5), color: 'C', storeys: [8.2, 15.6] },
          { mesh: pyramidMesh(oct, 19.5, [BC[0], BC[1], 25.5]), color: 'C' },
          { mesh: prismMesh(lan, 24.6, 28.6), color: 'C' },
          { mesh: pyramidMesh(lan, 28.6, [BC[0], BC[1], 30.8]), color: 'C' },
        ];
        const houses = [];
        for (const [x0, x1, sgn] of [[-38, -18, -1], [18, 38, 1]]) {
          const segs = sgn < 0 ? [[4, 20, 14], [20, 37, 17], [37, 64, 15]] : [[4, 22, 16], [22, 40, 13], [40, 64, 18]];
          for (const [y0, y1, h] of segs) houses.push({ mesh: boxMesh([(x0 + x1) / 2, (y0 + y1) / 2, 0], [x1 - x0, y1 - y0, h]), color: 'C', rect: [x0, y0, x1, y1] });
        }
        const all = [...houses, ...solids];
        const tanMap = (E) => (P) => { const dy = P[1] - E[1]; return dy > 0.3 ? [(P[0] - E[0]) / dy, (P[2] - EH) / dy] : null; };
        const PANEL = [[-0.62, 0.62], [-0.19, 0.78]]; // the panel, in units of its construction distance D, hole at the origin
        const draw = (S, map, eye3, col) => {
          drawSolids(S, map, eye3, all.map((s) => ({ mesh: s.mesh, color: col, alpha: 0.05, width: 1.3 })), { light: [-0.3, -0.8, 0.5] });
          const W = solids[0].mesh.V, n = 8; // storey lines on the visible wall faces
          for (let i = 0; i < n; i++) {
            const a = W[i], b = W[(i + 1) % n];
            const out = [-(b[1] - a[1]), b[0] - a[0]]; // outward normal of the face (counter-clockwise ring)
            if (((a[0] + b[0]) / 2 - eye3[0]) * out[0] + ((a[1] + b[1]) / 2 - eye3[1]) * out[1] >= 0) continue;
            for (const z of solids[0].storeys) { const A = map([a[0], a[1], z]), B = map([b[0], b[1], z]); if (A && B) S.line(A[0], A[1], B[0], B[1], { color: col, width: 1.1 }); }
            const m1 = map([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]), m2 = map([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 6]); // door / pilaster mark
            if (m1 && m2) S.line(m1[0], m1[1], m2[0], m2[1], { color: col, width: 1, alpha: 0.6 });
          }
        };
        const misfit = () => {
          const E3 = [eye.x, eye.y, EH], k = 1 / (2 * mS.value);
          const real = tanMap(E3), painted = tanMap([ST[0], ST[1], EH]);
          let s = 0, n = 0;
          for (const sol of solids) for (const P of sol.mesh.V) {
            const a = real(P), b = painted(P); if (!a || !b) continue;
            const ua = M.normalize([a[0], 1, a[1]]), ub = M.normalize([b[0] * k, 1, b[1] * k]);
            s += Math.acos(M.clamp(M.dot(ua, ub), -1, 1)); n++;
          }
          return deg(s / n);
        };
        v.render(() => {
          const E3 = [eye.x, eye.y, EH];
          // ---- plan
          plan.rect(-30, -9, 30, 0, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          plan.line(-30, 0, -1.6, 0, { color: 'ink', width: 4 }); plan.line(1.6, 0, 30, 0, { color: 'ink', width: 4 });
          plan.text('Santa Maria del Fiore (inside)', 28.5, -6.8, { align: 'right', size: 11, color: 'muted' });
          for (const h of houses) plan.rect(h.rect[0], h.rect[1], h.rect[2], h.rect[3], { fill: 'gray', fillAlpha: 0.12, color: 'gray', width: 1 });
          plan.poly(oct, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.6 });
          plan.poly(lan, { color: 'accent', width: 1 });
          plan.text('San Giovanni', 0, BC[1] + 1.5, { align: 'center', size: 11, color: 'accent' });
          const fov = view.bounds.x[1];
          for (const s of [-1, 1]) plan.line(E3[0], E3[1], E3[0] + s * fov * 60, E3[1] + 60, { color: 'gold', width: 1, alpha: 0.6, dash: [4, 4] });
          plan.dot(ST[0], ST[1], { r: 4.5, color: 'green' });
          plan.text('station point', ST[0] - 2.4, ST[1] - 0.6, { align: 'right', size: 11, color: 'green' });
          plan.line(19, 53, 29, 53, { color: 'muted', width: 2 }); plan.text('10 m', 24, 54.4, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted' });
          // ---- view: the real piazza
          const bx = view.bounds.x, by = view.bounds.y;
          view.rect(bx[0], 0, bx[1], by[1], { fill: 'blue', fillAlpha: 0.04, stroke: false });
          view.rect(bx[0], by[0], bx[1], 0, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          draw(view, tanMap(E3), E3, 'gray');
          // ---- the mirror (lower part of the view) with the reflected panel
          const edge = M.lerp(by[1], by[0], lowS.value), k = 1 / (2 * mS.value);
          if (edge > by[0]) {
            view.rect(bx[0], by[0], bx[1], edge, { fill: 'panel', fillAlpha: 1, stroke: false });
            view.rect(bx[0], by[0], bx[1], edge, { fill: 'faint', fillAlpha: 0.22, stroke: false });
            const px = [PANEL[0][0] * k, PANEL[0][1] * k], py = [PANEL[1][0] * k, Math.min(PANEL[1][1] * k, edge)];
            if (py[1] > py[0]) view.clip(() => {
              view.rect(px[0], py[0], px[1], py[1], { fill: 'panel', fillAlpha: 1, stroke: false });
              view.rect(px[0], 0, px[1], py[1], { fill: 'gray', fillAlpha: 0.1, stroke: false }); // burnished silver: reflects the real sky
              view.rect(px[0], py[0], px[1], 0, { fill: 'gold', fillAlpha: 0.08, stroke: false });
              const pm = tanMap([ST[0], ST[1], EH]);
              draw(view, (P) => { const q = pm(P); return q ? [q[0] * k, q[1] * k] : null; }, [ST[0], ST[1], EH], 'accent');
            }, px, py);
            view.rect(PANEL[0][0] * k, PANEL[1][0] * k, PANEL[0][1] * k, Math.min(PANEL[1][1] * k, edge), { color: 'accent', width: 1, alpha: 0.6 });
            view.line(bx[0], edge, bx[1], edge, { color: 'orange', width: 2.4 });
            view.text('mirror edge', bx[0] + 0.03, edge + 0.025, { align: 'left', baseline: 'bottom', size: 11, color: 'orange' });
          }
          view.dot(0, 0, { r: 3.2, color: 'ink' });
          view.text('hole', 0.025, -0.02, { align: 'left', baseline: 'top', size: 10.5, color: 'muted' });
        });
        v.legend([['gray', 'real Baptistery and houses'], ['accent', 'the painted panel, seen in the mirror'], ['orange', 'top edge of the mirror']]);
        v.readout(() => {
          const off = Math.hypot(eye.x - ST[0], eye.y - ST[1]), mis = misfit();
          const ok = mis < 0.05;
          return `eye ${v.fix(off, 2)} m from the station point · reflected panel at $2m = ${v.fix(2 * mS.value, 3)}\\,D$ · mean misfit between painted and real outlines **${v.fix(mis, 2)}°**` + (ok ? ' — painting and world coincide' : off < 0.05 ? ' — right place, wrong mirror distance' : ' — wrong viewpoint: the panel no longer fits');
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Parallel lines meet at a vanishing point',
      credit: 'Guidobaldo del Monte, Perspectivae libri sex, 1600',
      statement: String.raw`In a perspective picture with eye $E$ and picture plane $\Pi$, the images of all lines parallel to a direction $\mathbf u$ that is not parallel to $\Pi$ pass through one point $V_{\mathbf u}$, the **vanishing point** of $\mathbf u$: the point where the line through the eye in direction $\mathbf u$ meets $\Pi$. With the eye at the origin and $\Pi=\{y=d\}$,
$$V_{\mathbf u}=\Bigl(\frac{d\,u_x}{u_y},\ \frac{d\,u_z}{u_y}\Bigr),$$
which depends on the direction alone, not on where the lines are. If $\mathbf u$ is parallel to $\Pi$ ($u_y=0$), the images are parallel and there is no vanishing point.`,
      idea: String.raw`A point running along the line $A+t\mathbf u$ is drawn at $d\,(A_x+tu_x)/(A_y+tu_y)$ (art-1.2), which tends to $d\,u_x/u_y$ as $t\to\infty$, whatever $A$ is. Geometrically, the image of a line is the trace on $\Pi$ of the plane through $E$ and the line; all the planes through $E$ containing lines parallel to $\mathbf u$ share the ray from $E$ in direction $\mathbf u$, so their traces all pass through its pierce point. Earlier painters used the convergence of orthogonals; Guidobaldo del Monte stated and proved it for every family of parallels.`,
      caption: String.raw`In the plan, turn the rails with the gold handle and slide them with the blue one. In the picture their images (extended dashed) meet at one point on the horizon, exactly where the eye’s own sight line parallel to the rails crosses the picture plane (green in the plan); the second pair of rails, elsewhere on the ground, vanishes at the same point. Turn the rails until they run across the view: the vanishing point runs off to infinity and the images become parallel.`,
      deps: ['art-1.2'],
      see: ['cg-8.3'],
      refs: ['Kemp App. I'],
      tags: ['perspective', 'vanishing point'],
      viz(v) {
        const M = v.M, h = 1.5, d = 1.4, R = 2.2, G2 = 0.36; // eye height, picture distance, handle radius, half-gauge
        const plan = v.stage({ x: [-4.2, 4.2], y: [-0.8, 9.2], equal: true, axes: false, height: 360, weight: 0.85, title: 'plan, seen from above' });
        const pic = v.stage({ x: [-3.0, 3.0], y: [-1.9, 1.3], equal: true, axes: false, height: 360, weight: 1.15, title: 'the picture' });
        const C = camera([0, 0, h], { d });
        let th = rad(32);
        const A = plan.handle(0.7, 3.4, { color: 'accent', constrain: (x, y) => [M.clamp(x, -3.4, 3.4), M.clamp(y, 2.2, 6.5)] });
        const B = plan.handle(0, 0, { color: 'gold', label: 'turn', labelPos: 'e', constrain: (x, y) => {
          let a = Math.atan2(x - A.x, y - A.y); a = M.clamp(a, -rad(90), rad(90)); if (Math.abs(Math.abs(a) - rad(90)) < rad(1.2)) a = Math.sign(a) * rad(90);
          th = a; return [A.x + R * Math.sin(a), A.y + R * Math.cos(a)];
        } });
        const two = v.toggle('second pair of rails', true);
        const pairs = () => {
          const u = [Math.sin(th), Math.cos(th), 0], n = [Math.cos(th), -Math.sin(th), 0];
          const mk = (o) => [-1, 1].map((s) => [A.x + (o + s * G2) * n[0], A.y + (o + s * G2) * n[1], 0]);
          return { u, n, P: [mk(0), two.value ? mk(-2.3) : null].filter(Boolean) };
        };
        v.render(() => {
          if (!B.dragging) { B.x = A.x + R * Math.sin(th); B.y = A.y + R * Math.cos(th); }
          const { u, n, P } = pairs(), par = Math.abs(u[1]) < 1e-6;
          const bx = pic.bounds.x, by = pic.bounds.y;
          // ---- plan
          plan.line(bx[0], d, bx[1], d, { color: 'orange', width: 3 });
          plan.text('picture plane', bx[0] + 0.1, d - 0.2, { align: 'left', baseline: 'top', size: 11, color: 'orange' });
          plan.clip(() => {
            P.forEach((pr, j) => {
              const col = j ? 'purple' : 'accent';
              for (let t = -12; t < 14; t += 0.7) { const c = [A.x + t * u[0] + (j ? -2.3 : 0) * n[0], A.y + t * u[1] + (j ? -2.3 : 0) * n[1]]; plan.line(c[0] - 0.55 * n[0], c[1] - 0.55 * n[1], c[0] + 0.55 * n[0], c[1] + 0.55 * n[1], { color: 'faint', width: 2 }); }
              for (const a of pr) plan.line(a[0] - 14 * u[0], a[1] - 14 * u[1], a[0] + 14 * u[0], a[1] + 14 * u[1], { color: col, width: 2.2 });
            });
            plan.line(0, 0, 14 * u[0], 14 * u[1], { color: 'green', width: 1.6, dash: [6, 4] });
          });
          plan.dot(0, 0, { r: 5, color: 'ink', label: 'eye', labelPos: 's' });
          if (!par && Math.abs((d * u[0]) / u[1]) < 4.2) plan.dot((d * u[0]) / u[1], d, { r: 5, color: 'green', label: 'V', labelPos: 'nw' });
          // ---- picture
          pic.line(bx[0], 0, bx[1], 0, { color: 'muted', width: 1, dash: [5, 4] });
          pic.text('horizon', bx[0] + 0.05, 0.05, { align: 'left', baseline: 'bottom', size: 11, color: 'muted' });
          for (const [a, b] of gridLines(-12, 12, 2, 30, 2)) seg3(pic, C, a, b, { color: 'faint', width: 0.8, alpha: 0.7 });
          const V = par ? null : C.vp(u);
          P.forEach((pr, j) => {
            const col = j ? 'purple' : 'accent', off = j ? -2.3 : 0;
            for (let t = -12; t < 60; t += 0.7) { const c = [A.x + t * u[0] + off * n[0], A.y + t * u[1] + off * n[1], 0]; if (c[1] < d * 1.15) continue; seg3(pic, C, [c[0] - 0.55 * n[0], c[1] - 0.55 * n[1], 0], [c[0] + 0.55 * n[0], c[1] + 0.55 * n[1], 0], { color: 'gray', width: 1.4, alpha: 0.7 }); }
            for (const a of pr) {
              const s = seg3(pic, C, [a[0] - 12 * u[0], a[1] - 12 * u[1], 0], [a[0] + 60 * u[0], a[1] + 60 * u[1], 0], { color: col, width: 2.4 });
              if (s && V) pic.line(s[1][0], s[1][1], V[0], V[1], { color: col, width: 1.2, dash: [4, 4], alpha: 0.8 });
            }
          });
          if (V) {
            if (V[0] > bx[0] && V[0] < bx[1]) pic.dot(V[0], V[1], { r: 5.5, color: 'green', label: 'V', labelPos: 'n' });
            else pic.corner(`vanishing point off the picture, at u = ${v.fix(V[0], 2)}`, V[0] > 0 ? 'tr' : 'tl', { color: 'green', size: 11.5 });
          } else pic.corner('rails parallel to the picture plane: no vanishing point', 'tr', { color: 'red', weight: 600, size: 11.5 });
        });
        v.legend([['accent', 'rails'], ['purple', 'second pair, same direction'], ['green', 'sight line from the eye parallel to the rails', { dash: true }]]);
        v.readout(() => {
          const { u, P } = pairs();
          if (Math.abs(u[1]) < 1e-6) return `rails turned $${v.fix(deg(th), 1)}°$: parallel to the picture plane, so their images stay parallel (they meet only “at infinity”)`;
          const img = (a) => [C.proj([a[0] + 3 * u[0], a[1] + 3 * u[1], 0]), C.proj([a[0] + 30 * u[0], a[1] + 30 * u[1], 0])];
          const L = P.map((pr) => pr.map(img)), X = meet(L[0][0][0], L[0][0][1], L[0][1][0], L[0][1][1]), F = C.vp(u);
          let gap = 0; if (L[1] && X) { const Y = meet(L[1][0][0], L[1][0][1], L[1][1][0], L[1][1][1]); if (Y) gap = Math.hypot(X[0] - Y[0], X[1] - Y[1]); }
          const z = (x) => (Math.abs(x) < 5e-5 ? 0 : x);
          return `rails turned $\\theta = ${v.fix(deg(th), 1)}°$ · their images meet at $(${v.fix(z(X[0]), 4)},\\ ${v.fix(z(X[1]), 4)})$ · predicted $d\\tan\\theta = ${v.fix(F[0], 4)}$ on the horizon` + (L[1] ? ` · second pair misses that point by $${v.fix(gap, 5)}$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Horizon line at eye level',
      statement: String.raw`The **horizon** of a perspective picture is the line in which the horizontal plane through the eye cuts the picture plane, so it always lies at eye level. Every horizontal direction vanishes on it, and every point of the ground (or of any horizontal plane below the eye) is drawn below it. Lines that rise or fall, such as the slopes of a roof or a ramp, vanish above or below it. Raising or lowering the eye moves the horizon with it, and the horizon cuts every standing figure of a given height at the same fraction of that height, however near or far the figure stands.`,
      idea: String.raw`A horizontal direction $\mathbf u=(u_x,u_y,0)$ has vanishing point $(d\,u_x/u_y,\,0)$ (art-1.4): zero height above the eye. The vanishing points of all directions in one horizontal plane therefore fill the eye-level line. A figure of height $H$ standing at depth $y$, seen from an eye at height $h$, has its feet drawn $d\,h/y$ below the horizon and its head $d\,(H-h)/y$ above it, so the horizon divides it in the ratio $h:(H-h)$ at every distance. A rising direction ($u_z>0$) vanishes at height $d\,u_z/u_y>0$, above the horizon.`,
      caption: String.raw`Drag the eye up and down in the side view and change the roof’s pitch. The horizon follows the eye. The vanishing points of the horizontal edges (green) stay on it, while the two slopes of the gable vanish above and below it (orange), on the vertical through the vanishing point of the gable wall. The readout checks that the horizon crosses every 1.7 m figure at the same fraction of its height.`,
      deps: ['art-1.4'],
      refs: ['Kemp ch. 1'],
      tags: ['perspective', 'horizon'],
      viz(v) {
        const M = v.M, d = 1.2, FIG = 1.7, GY = rad(45), BY = -0.3;
        const pic = v.stage({ x: [-1.6, 1.6], y: [-0.05, 3.02], equal: true, axes: false, height: 360, weight: 1.35, title: 'the picture: a pane 3 m tall standing on the ground' });
        const side = v.stage({ x: [-0.5, 14.5], y: [-0.2, 3.7], axes: false, height: 360, weight: 0.65, minWidth: 230, title: 'side view (vertical scale enlarged)' });
        const pitch = v.slider('roof pitch', 0, 60, 35, { step: 1, fmt: (x) => `${x}°` });
        const eh = side.handle(0, 1.6, { color: 'accent', label: 'eye', labelPos: 'ne', constrain: (x, y) => [0, M.clamp(y, 0.25, 3.0)] });
        const figs = [[-0.6, 2.8], [0.65, 4.2], [-3.2, 6.5], [-2.4, 13]];
        const box = boxMesh([-2.6, 3.6, 0], [1.1, 1.1, 1.1], BY);
        const cs = Math.cos(GY), sn = Math.sin(GY);
        const hz = [[cs, -sn, 0], [sn, cs, 0], [Math.cos(BY), -Math.sin(BY), 0], [Math.sin(BY), Math.cos(BY), 0]]; // horizontal edge directions
        v.render(() => {
          const h = eh.y, C = camera([0, 0, h], { d });
          const pane = (P) => { const q = C.proj(P); return q ? [q[0], q[1] + h] : null; };
          const rh = 1.5 * Math.tan(rad(pitch.value));
          const house = houseMesh([1.6, 7.0, 0], [3, 4, 2.4], rh, GY);
          const bx = pic.bounds.x, by = pic.bounds.y;
          // ---- picture: ground, horizon, objects (far to near)
          pic.rect(bx[0], 0, bx[1], Math.min(h, by[1]), { fill: 'faint', fillAlpha: 0.1, stroke: false });
          for (const [a, b] of gridLines(-10, 10, 2, 26, 1)) { const s2 = C.seg(a, b); if (s2) pic.line(s2[0][0], s2[0][1] + h, s2[1][0], s2[1][1] + h, { color: 'faint', width: 0.8 }); }
          const objs = figs.map(([x, y]) => ({ y, f: () => drawFigure(pic, pane, [x, y, 0], FIG, { color: 'ink', alpha: 0.6 }) }));
          objs.push({ y: 7.0, f: () => drawSolids(pic, pane, [0, 0, h], [{ mesh: house, color: 'teal' }]) }, { y: 3.6, f: () => drawSolids(pic, pane, [0, 0, h], [{ mesh: box, color: 'purple' }]) });
          objs.sort((p, q) => q.y - p.y).forEach((o) => o.f());
          pic.line(bx[0], h, bx[1], h, { color: 'accent', width: 1.8 });
          pic.text('horizon = eye level', bx[0] + 0.05, h + 0.04, { align: 'left', baseline: 'bottom', size: 11.5, color: 'accent', weight: 600 });
          // vanishing points of the horizontal edges, and of the two roof slopes (above and below, on one vertical)
          for (const D of hz) { const V = C.vp(D); if (V && V[0] > bx[0] && V[0] < bx[1]) pic.dot(V[0], V[1] + h, { r: 4.5, color: 'green' }); }
          if (rh > 0.01) {
            const V0 = C.vp(hz[0]);
            pic.line(V0[0], by[0], V0[0], by[1], { color: 'orange', width: 1, alpha: 0.45, dash: [3, 4] });
            for (const [D, ends] of [[[cs * 1.5, -sn * 1.5, rh], [4, 7]], [[-cs * 1.5, sn * 1.5, rh], [5, 6]]]) {
              const V = C.vp(D); if (!V) continue;
              for (const i of ends) { const q = pane(house.V[i]); if (q) pic.line(q[0], q[1], V[0], V[1] + h, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.8 }); }
              if (V[1] + h > by[0] && V[1] + h < by[1]) pic.dot(V[0], V[1] + h, { r: 4.5, color: 'orange' });
            }
          }
          // ---- side view (depth across, heights enlarged)
          side.line(-0.5, 0, 14.5, 0, { color: 'faint', width: 1.4 });
          side.line(d, 0, d, 3, { color: 'orange', width: 2.4 });
          side.text('pane', d + 0.2, 3.0, { align: 'left', baseline: 'top', size: 10.5, color: 'orange' });
          const ys = house.V.map((P) => P[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
          side.poly([[y0, 0], [y1, 0], [y1, 2.4], [(y0 + y1) / 2, 2.4 + rh], [y0, 2.4]], { fill: 'teal', fillAlpha: 0.15, color: 'teal', width: 1.2 });
          side.poly([[3.05, 0], [4.15, 0], [4.15, 1.1], [3.05, 1.1]], { fill: 'purple', fillAlpha: 0.15, color: 'purple', width: 1.2 });
          for (const [, y] of figs) { side.line(y, 0, y, FIG - 0.17, { color: 'ink', width: 3, alpha: 0.6 }); side.dot(y, FIG - 0.08, { r: 3.5, color: 'ink', alpha: 0.6 }); }
          side.line(0, h, 14.5, h, { color: 'accent', width: 1.4, dash: [6, 4] });
        });
        v.legend([['green', 'vanishing points of horizontal edges', { dot: true }], ['orange', 'vanishing points of the roof slopes', { dot: true }], ['accent', 'horizon']]);
        v.readout(() => {
          const h = eh.y, C = camera([0, 0, h], { d });
          const fr = figs.map(([x, y]) => { const f = C.proj([x, y, 0]), t = C.proj([x, y, FIG]); return (0 - f[1]) / (t[1] - f[1]); });
          const rh = 1.5 * Math.tan(rad(pitch.value)), Vs = C.vp([cs * 1.5, -sn * 1.5, rh]);
          const off = Math.max(...hz.map((D) => Math.abs(C.vp(D)[1])));
          return `eye at $${v.fix(h, 2)}$ m, horizon drawn at $${v.fix(h, 2)}$ m on the pane · horizontal vanishing points off the horizon by $${v.fix(off, 4)}$ · roof slopes vanish $${v.fix(Math.abs(Vs[1]), 2)}$ above and below it · the horizon crosses the four figures at $${fr.map((x) => v.fix(100 * x, 1)).join('\\%,\\ ')}\\%$ of their height` + (h > FIG ? ' (the eye is above their heads)' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Method',
      name: 'One-point perspective',
      statement: String.raw`**One-point perspective** is the special case in which the objects face the picture plane, with their faces parallel or perpendicular to it. Then:

(a) faces parallel to the picture plane are drawn in their true shape, only scaled by $d/y$;

(b) edges perpendicular to the picture plane (the *orthogonals*) all run to one vanishing point, the *centric point* $C$ straight ahead of the eye on the horizon;

(c) edges parallel to the picture plane stay horizontal or vertical.

An object turned away from this position breaks (a) and (b).`,
      idea: String.raw`A plane parallel to the picture plane at depth $y$ is carried onto the picture by the similarity $(x,z)\mapsto (d/y)(x,z)$ (art-1.2), which keeps shapes and angles. All the orthogonals have the direction $(0,1,0)$, whose vanishing point is the foot of the perpendicular from the eye (art-1.4), and it lies on the horizon (art-1.5). Masaccio’s *Trinity* (c. 1427) and the painted interiors of the Quattrocento are built this way.`,
      caption: String.raw`Drag the boxes over the floor by the handles at their front edges. Their front faces keep their true proportions, only smaller, and every edge running back meets the centric point $C$. Turn the blue box with the slider: its edges leave $C$ and its front face stops being a true rectangle.`,
      deps: ['art-1.4', 'art-1.5'],
      refs: ['Kemp ch. 1'],
      tags: ['perspective', 'one-point'],
      viz(v) {
        const M = v.M, h = 1.5, d = 1.7, WALL = 3, HI = 3.2, BACK = 11;
        const pic = v.stage({ x: [-2.4, 2.4], y: [-1.55, 1.4], equal: true, axes: false, height: 380, title: 'a room in one-point perspective' });
        const turn = v.slider('turn the blue box', -40, 40, 0, { step: 1, fmt: (x) => `${x}°` });
        const C = camera([0, 0, h], { d });
        const boxes = [
          { x: -1.25, y: 4.1, s: [1.5, 1.0, 1.0], color: 'accent' },
          { x: 1.55, y: 5.6, s: [0.8, 1.6, 1.0], color: 'orange' },
          { x: -0.1, y: 8.2, s: [1.2, 1.2, 1.2], color: 'purple' },
        ];
        const front = (b) => [b.x, b.y - b.s[1] / 2, 0];
        for (const b of boxes) {
          const f0 = C.proj(front(b));
          b.H = pic.handle(f0[0], f0[1], { color: b.color, constrain: (x, y) => {
            const g = C.ground(x, Math.min(y, -0.08));
            if (g) { b.x = M.clamp(g[0], -WALL + b.s[0] / 2, WALL - b.s[0] / 2); b.y = M.clamp(g[1] + b.s[1] / 2, 3.2, BACK - 1); }
            const q = C.proj(front(b)); return [q[0], q[1]];
          } });
        }
        const mesh = (b, i) => boxMesh([b.x, b.y, 0], b.s, i === 0 ? rad(turn.value) : 0);
        v.render(() => {
          // room: floor tiles, side walls, back wall
          for (const [a, b] of gridLines(-WALL, WALL, 1, BACK, 1)) seg3(pic, C, a, b, { color: 'faint', width: 0.8 });
          for (const s of [-1, 1]) {
            seg3(pic, C, [s * WALL, 1, 0], [s * WALL, BACK, 0], { color: 'muted', width: 1.2 });
            seg3(pic, C, [s * WALL, 1, HI], [s * WALL, BACK, HI], { color: 'muted', width: 1.2 });
            for (let y = 2; y <= BACK; y += 1.5) seg3(pic, C, [s * WALL, y, 0], [s * WALL, y, HI], { color: 'faint', width: 0.8 });
          }
          const bw = [[-WALL, BACK, 0], [WALL, BACK, 0], [WALL, BACK, HI], [-WALL, BACK, HI]].map((P) => C.proj(P));
          pic.poly(bw, { fill: 'faint', fillAlpha: 0.12, color: 'muted', width: 1.2 });
          // orthogonals to C
          boxes.forEach((b, i) => {
            const m = mesh(b, i);
            for (const [p, q] of [[0, 3], [1, 2], [4, 7], [5, 6]]) {
              const a = C.proj(m.V[p]), c = C.proj(m.V[q]);
              const ok = i !== 0 || turn.value === 0;
              const far = ok ? [0, 0] : [c[0] + (c[0] - a[0]) * 8, c[1] + (c[1] - a[1]) * 8];
              pic.line(c[0], c[1], far[0], far[1], { color: ok ? b.color : 'red', width: 1, dash: [4, 4], alpha: 0.75 });
            }
          });
          drawSolids(pic, (P) => C.proj(P), [0, 0, h], boxes.map((b, i) => ({ mesh: mesh(b, i), color: b.color })));
          for (const b of boxes) if (!b.H.dragging) { const q = C.proj(front(b)); b.H.x = q[0]; b.H.y = q[1]; }
          pic.line(-5, 0, 5, 0, { color: 'muted', width: 1, dash: [5, 4] });
          pic.dot(0, 0, { r: 5, color: 'green', label: 'C', labelPos: 'n' });
          pic.text('horizon', pic.bounds.x[0] + 0.06, 0.05, { align: 'left', baseline: 'bottom', size: 11, color: 'muted' });
        });
        v.legend([['accent', 'blue box'], ['orange', 'orange box'], ['purple', 'purple box'], ['green', 'centric point $C$', { dot: true }]]);
        v.readout(() => {
          const out = boxes.map((b, i) => {
            const m = mesh(b, i), p = [0, 1, 5, 4].map((k) => C.proj(m.V[k]));
            const w = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), hh = Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1]);
            const miss = Math.max(...[[0, 3], [1, 2], [4, 7], [5, 6]].map(([a, c]) => lineDist([0, 0], C.proj(m.V[a]), C.proj(m.V[c]))));
            return { r: w / hh, t: b.s[0] / b.s[2], miss };
          });
          const ok = turn.value === 0;
          return `front faces in the picture: width/height $= ${out.map((o) => v.fix(o.r, 3)).join(',\\ ')}$ (true: $${out.map((o) => v.fix(o.t, 3)).join(',\\ ')}$) · receding edges pass within $${v.fix(Math.max(...out.slice(ok ? 0 : 1).map((o) => o.miss)), 4)}$ of $C$` + (ok ? '' : ` · turned box: its edges miss $C$ by up to $${v.fix(out[0].miss, 3)}$`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Alberti’s construction of the tiled floor',
      credit: 'Leon Battista Alberti, De pictura, 1435',
      statement: String.raw`Alberti’s *costruzione legittima* draws a floor of square tiles one braccio across, in a rectangle (the window) whose base is the front edge of the floor:

(1) take the braccio as one third of the height of a man standing on the base line, and divide the base into braccia;

(2) place the centric point $C$ no higher above the base than the man;

(3) join $C$ to every division of the base: these are the images of the tile edges that run straight back;

(4) in a separate small drawing, put a point at the height $h$ of $C$ above the start of a line divided into braccia, draw lines from it to the divisions, and cut them with a perpendicular at the chosen eye distance $d$; the cuts lie at the heights $h\,k/(d+k)$, $k=1,2,\dots$;

(5) draw the transverse edges across the window at those heights;

(6) check that one straight line passes through the opposite corners of a whole diagonal row of tiles. Extended, it meets the line through $C$ at distance $d$ from $C$.`,
      idea: String.raw`Step (4) is a side view of the eye and the picture plane (art-1.2): the transverse edge $k$ braccia behind the plane is drawn where the ray from the eye to it crosses the plane, at height $h\,k/(d+k)$. The tile diagonals are parallel lines at $45^\circ$ to the picture, so their images are straight and meet at their vanishing point on the horizon, at distance $d$ from $C$ (art-1.4, art-1.6); later painters used this *distance point* as a shortcut. Alberti rejected the workshop habit of making each band a fixed fraction of the one before: the bands then shrink geometrically instead of as $h\,k/(d+k)$, and the diagonal test exposes it.`,
      caption: String.raw`Step through the construction with the player, drag the centric point $C$, and change the eye distance $d$. The lower panel is Alberti’s small side drawing. At the end the green diagonal passes through every tile corner it should and lands on the distance point. Switch on the fixed-ratio rule (each band two thirds of the last) to see the test fail.`,
      deps: ['art-1.6'],
      refs: ['Kemp ch. 1', 'Kemp App. I'],
      tags: ['perspective', 'Alberti', 'construction'],
      viz(v) {
        const M = v.M, W = 8, WH = 6, N = 10; // window 8 × 6 braccia, 10 rows of tiles
        const win = v.stage({ x: [-0.3, 8.3], y: [-0.35, 6.3], equal: true, axes: false, height: 300, weight: 1.2, title: 'the window (in braccia)' });
        const plan = v.stage({ x: [-1, 9], y: [-12.6, 10.6], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 220, title: 'the floor seen from above' });
        const small = v.stage({ x: [-0.6, 22.6], y: [-1.0, 4.4], equal: true, axes: false, height: 150, full: true, title: 'Alberti’s “small space”: the eye, the picture and the floor seen from the side' });
        const dS = v.slider('eye distance $d$ (braccia)', 2, 12, 6, { int: true });
        const bot = v.toggle('fixed-ratio rule (each band ⅔ of the last)', false);
        const C0 = win.handle(4, 3, { color: 'accent', label: 'C', labelPos: 'ne', constrain: (x, y) => [M.clamp(x, 1, 7), M.clamp(y, 0.8, 5.5)] });
        const notes = [
          '**1.** The window is a rectangle standing on the front edge of the floor. The man on the base line is 3 braccia tall, so a braccio is a third of his height.',
          '**2.** Divide the base line into braccia: 8 equal parts.',
          '**3.** Put the centric point $C$ where the eye’s central ray meets the window, no higher than the man. The line through it is the centric line, the horizon.',
          '**4.** Join $C$ to every division of the base: the images of the tile edges that run straight back.',
          '**5.** In a small space, divide a line into braccia and put the eye above its start, at the height of $C$; draw rays to the divisions.',
          '**6.** A perpendicular at the eye distance $d$ is the picture plane seen edge-on: the rays cut it at the heights $h\\,k/(d+k)$.',
          '**7.** Carry those heights into the window: they are the transverse edges of the tiles.',
          '**8.** Test: a straight line through opposite corners of the tiles must pass through all of them. Extended, it meets the centric line at the distance point, $d$ from $C$ — in the plan, the eye’s own $45°$ sight line.',
        ];
        const S = v.steps({ frames: notes.map((note, k) => ({ k, note })), start: 'end', still: 7, speed: 0.6 });
        const heights = (h, d) => {
          const al = Array.from({ length: N + 1 }, (_, k) => (h * k) / (d + k));
          if (!bot.value) return al;
          const r = 2 / 3, b1 = al[1]; return Array.from({ length: N + 1 }, (_, k) => (b1 * (1 - r ** k)) / (1 - r));
        };
        const corner = (cx, h, X, v0) => [X + ((cx - X) * v0) / h, v0]; // point of the orthogonal from base point X at height v0
        v.render(() => {
          const k = S.frame.k ?? 7, cx = C0.x, h = C0.y, d = dS.value, ys = heights(h, d);
          // ---- window
          win.rect(0, 0, W, WH, { fill: 'orange', fillAlpha: 0.04, color: 'orange', width: 1.8 });
          drawFigure(win, (P) => [P[0], P[2]], [0.75, 0, 0], 3, { color: 'ink', alpha: 0.45 });
          if (k === 0) win.measure(1.45, 0, 1.45, 3, '3 braccia', { color: 'muted' });
          if (k >= 1) for (let i = 0; i <= W; i++) win.line(i, -0.14, i, 0.14, { color: 'ink', width: 1.6 });
          if (k >= 2) { win.line(0, h, W, h, { color: 'muted', width: 1, dash: [5, 4] }); win.dot(cx, h, { r: 4, color: 'accent' }); }
          win.clip(() => {
            if (k >= 3) for (let i = 0; i <= W; i++) win.line(i, 0, cx, h, { color: 'accent', width: 1.2, alpha: 0.85 });
            if (k >= 6) for (let j = 1; j <= N; j++) if (ys[j] < h) { const p = corner(cx, h, 0, ys[j]), q = corner(cx, h, W, ys[j]); win.line(p[0], ys[j], q[0], ys[j], { color: bot.value ? 'red' : 'orange', width: 1.4 }); }
          }, [0, W], [0, WH]);
          if (k >= 7) {
            const P = Array.from({ length: Math.min(N, W) + 1 }, (_, j) => corner(cx, h, j, ys[j])).filter((p) => p[1] < h);
            const col = bot.value ? 'red' : 'green';
            if (!bot.value) win.line(P[0][0], P[0][1], cx + d, h, { color: 'green', width: 1.2, dash: [5, 4] });
            else { const q = P[P.length - 1]; win.line(P[0][0], P[0][1], q[0], q[1], { color: 'muted', width: 1, dash: [3, 3] }); }
            win.path(P, { color: col, width: 2.6 });
            P.forEach((p) => win.dot(p[0], p[1], { r: 3, color: col }));
            if (!bot.value) {
              if (cx + d <= win.bounds.x[1]) win.dot(cx + d, h, { r: 5, color: 'green', label: 'distance point', labelPos: 'n' });
              else win.corner(`distance point off to the right, ${d} braccia from C`, 'tr', { color: 'green', size: 11.5 });
            }
          }
          // ---- plan: eye in front of the window, the tiled floor behind it
          for (let i = 0; i <= W; i++) plan.line(i, 0, i, N, { color: k >= 3 ? 'accent' : 'faint', width: 0.9, alpha: 0.7 });
          for (let j = 0; j <= N; j++) plan.line(0, j, W, j, { color: k >= 6 ? 'orange' : 'faint', width: 0.9, alpha: 0.7 });
          plan.line(-1, 0, 9, 0, { color: 'orange', width: 2.4 });
          plan.text('window', 8.9, 0.35, { align: 'right', baseline: 'bottom', size: 10.5, color: 'orange' });
          plan.dot(cx, -d, { r: 4.5, color: 'accent', label: 'eye', labelPos: 'w' });
          plan.line(cx, -d, cx, 0, { color: 'muted', width: 1, dash: [3, 3] });
          plan.text(`d = ${d}`, cx + 0.2, -d / 2, { align: 'left', size: 10.5, color: 'muted' });
          if (k >= 7) {
            plan.line(0, 0, Math.min(W, N), Math.min(W, N), { color: 'green', width: 2.4 });
            plan.line(cx, -d, cx + d + 2, 2, { color: 'green', width: 1.2, dash: [5, 4] });
            plan.dot(cx + d, 0, { r: 4, color: 'green' });
          }
          // ---- small space
          if (k >= 4) {
            small.line(0, 0, d + N, 0, { color: 'ink', width: 1.4 });
            for (let i = 0; i <= d + N; i++) small.line(i, -0.12, i, 0.12, { color: 'ink', width: 1.2 });
            small.dot(0, h, { r: 4.5, color: 'accent', label: 'eye', labelPos: 'n' });
            small.line(0, 0, 0, h, { color: 'muted', width: 1, dash: [3, 3] });
            for (let i = 1; i <= d + N; i++) small.line(0, h, i, 0, { color: i >= d ? 'gold' : 'faint', width: i >= d ? 1.3 : 0.8 });
          } else small.corner('(used from step 5)', 'tl', { color: 'faint' });
          if (k >= 5) {
            small.line(d, 0, d, h + 0.4, { color: 'orange', width: 2.4 });
            small.measure(0, -0.55, d, -0.55, `d = ${d}`, { color: 'orange' });
            for (let j = 1; j <= N; j++) small.dot(d, (h * j) / (d + j), { r: 2.6, color: 'orange' });
            small.text('picture plane', d + 0.15, h + 0.35, { align: 'left', baseline: 'top', size: 10.5, color: 'orange' });
          }
        });
        v.legend([['accent', 'orthogonals to $C$'], ['orange', 'transversals'], ['green', 'diagonal check']]);
        v.readout(() => {
          const cx = C0.x, h = C0.y, d = dS.value, ys = heights(h, d);
          const P = Array.from({ length: Math.min(N, W) + 1 }, (_, j) => corner(cx, h, j, ys[j])).filter((p) => p[1] < h);
          const dev = Math.max(...P.map((p) => lineDist(p, P[0], P[P.length - 1])));
          const X = meet(P[0], P[1], [0, h], [1, h]);
          const warn = h > 3 + 1e-9 ? ' · $C$ is above the man: Alberti puts it no higher than 3 braccia' : '';
          return `largest distance of a tile corner from the straight diagonal: **${v.fix(dev, 4)}** braccia` + (bot.value ? ' — the fixed-ratio rule fails the test' : ` · the diagonal meets the centric line $${v.fix(X[0] - cx, 3)}$ braccia from $C$ (eye distance $d = ${d}$)`) + warn;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Two-point perspective',
      statement: String.raw`When a box-shaped object is turned about a vertical axis so that none of its faces is parallel to the picture plane, its vertical edges stay vertical, but its two families of horizontal edges vanish at two points $V_L$, $V_R$ on the horizon: **two-point perspective**. With the eye at distance $d$ from the picture plane and the object turned by $\varphi$ ($0<\varphi<90^\circ$), $V_R$ lies $d\tan\varphi$ to the right of the principal point $P$ and $V_L$ lies $d\cot\varphi$ to its left. Hence
$$\overline{PV_L}\cdot\overline{PV_R}=d^2,$$
and the eye sees the two vanishing points at a right angle. As $\varphi\to 0$ one vanishing point recedes to infinity and the picture becomes one-point (art-1.6).`,
      idea: String.raw`The two edge directions $(\sin\varphi,\cos\varphi,0)$ and $(\cos\varphi,-\sin\varphi,0)$ are horizontal and perpendicular, so their vanishing points lie on the horizon (art-1.5), at $d\tan\varphi$ and $-d\cot\varphi$ (art-1.4). The sight lines from the eye to $V_L$ and $V_R$ are parallel to the two edges, hence perpendicular, so the eye lies on the circle with diameter $V_LV_R$ (Thales). Folding the eye down into the picture plane gives the *station point* that draughtsmen use to measure such drawings.`,
      caption: String.raw`Drag either vanishing point along the horizon and the building turns. With “keep the eye distance fixed” the other point moves so that $\overline{PV_L}\cdot\overline{PV_R}$ stays $d^2$; switch it off to move them independently, and the eye distance follows. The station point, folded down below the horizon, always sees $V_L$ and $V_R$ at a right angle.`,
      deps: ['art-1.6'],
      refs: ['Kemp ch. 2'],
      tags: ['perspective', 'two-point'],
      viz(v) {
        const M = v.M, h = 1.6;
        const pic = v.stage({ x: [-9, 9], y: [-5.4, 3.4], equal: true, axes: false, height: 380, title: 'two-point perspective' });
        const lock = v.toggle('keep the eye distance fixed', true);
        let phi = rad(30), dd = 4;
        const VL = pic.handle(-dd / Math.tan(phi), 0, { color: 'orange', label: '$V_L$', labelPos: 'n', constrain: (x) => {
          const xl = Math.min(x, -0.3);
          if (lock.value) phi = Math.atan(-dd / xl); else { const xr = dd * Math.tan(phi); dd = M.clamp(Math.sqrt(-xl * xr), 0.8, 9); phi = Math.atan(xr / dd); }
          return [xl, 0];
        } });
        const VR = pic.handle(dd * Math.tan(phi), 0, { color: 'accent', label: '$V_R$', labelPos: 'n', constrain: (x) => {
          const xr = Math.max(x, 0.3);
          if (lock.value) phi = Math.atan(xr / dd); else { const xl = -dd / Math.tan(phi); dd = M.clamp(Math.sqrt(-xl * xr), 0.8, 9); phi = Math.atan(xr / dd); }
          return [xr, 0];
        } });
        v.render(() => {
          const C = camera([0, 0, h], { d: dd }), pj = (P) => C.proj(P);
          const xl = -dd / Math.tan(phi), xr = dd * Math.tan(phi), bx = pic.bounds.x, by = pic.bounds.y;
          if (!VL.dragging) VL.x = xl; if (!VR.dragging) VR.x = xr;
          VL.visible = xl > bx[0]; VR.visible = xr < bx[1];
          const bc = [0, 7, 0], bm = boxMesh(bc, [3, 3, 5], phi);
          // ground grid aligned with the building
          const cs = Math.cos(phi), sn = Math.sin(phi), loc = (a, b) => [bc[0] + a * cs + b * sn, bc[1] - a * sn + b * cs, 0];
          for (let a = -3.5; a <= 3.5; a += 1) { seg3(pic, C, loc(a, -3.5), loc(a, 3.5), { color: 'faint', width: 0.8 }); seg3(pic, C, loc(-3.5, a), loc(3.5, a), { color: 'faint', width: 0.8 }); }
          // storey lines extended to the vanishing points
          const V = bm.V;
          for (const z of [0, 1.25, 2.5, 3.75, 5]) for (const [p, q, tgt] of [[0, 1, [xl, 0]], [1, 2, [xr, 0]], [3, 0, [xr, 0]], [2, 3, [xl, 0]]]) {
            const a = pj([V[p][0], V[p][1], z]), b = pj([V[q][0], V[q][1], z]); if (!a || !b) continue;
            const end = Math.hypot(a[0] - tgt[0], a[1] - tgt[1]) < Math.hypot(b[0] - tgt[0], b[1] - tgt[1]) ? a : b;
            pic.line(end[0], end[1], tgt[0], tgt[1], { color: tgt[0] < 0 ? 'orange' : 'accent', width: 0.9, dash: [4, 4], alpha: 0.65 });
          }
          drawSolids(pic, pj, [0, 0, h], [{ mesh: bm, color: 'teal' }]);
          for (const z of [1.25, 2.5, 3.75]) for (const [p, q] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
            const mid = [(V[p][0] + V[q][0]) / 2, (V[p][1] + V[q][1]) / 2], out = [mid[0] - bc[0], mid[1] - bc[1]];
            if ((mid[0] - 0) * out[0] + (mid[1] - 0) * out[1] >= 0) continue; // back face
            seg3(pic, C, [V[p][0], V[p][1], z], [V[q][0], V[q][1], z], { color: 'teal', width: 1.2 });
          }
          pic.line(bx[0], 0, bx[1], 0, { color: 'muted', width: 1.2 });
          pic.text('horizon', bx[0] + 0.15, 0.12, { align: 'left', baseline: 'bottom', size: 11, color: 'muted' });
          pic.dot(0, 0, { r: 3.5, color: 'ink' }); pic.text('P', 0.12, -0.12, { align: 'left', baseline: 'top', math: true, size: 15 });
          // station point folded down: Thales circle on V_L V_R
          const cxm = (xl + xr) / 2, r = (xr - xl) / 2, Sy = -dd;
          pic.clip(() => {
            pic.curve((t) => [cxm + r * Math.cos(t), r * Math.sin(t)], Math.PI, 2 * Math.PI, { color: 'gold', width: 1.2, dash: [5, 4] });
            pic.line(xl, 0, 0, Sy, { color: 'orange', width: 1.4 }); pic.line(xr, 0, 0, Sy, { color: 'accent', width: 1.4 });
            pic.line(0, 0, 0, Sy, { color: 'muted', width: 1, dash: [3, 3] });
            const u1 = M.normalize([xl, -Sy]), u2 = M.normalize([xr, -Sy]), s = 0.45;
            pic.path([[u1[0] * s, Sy + u1[1] * s], [(u1[0] + u2[0]) * s, Sy + (u1[1] + u2[1]) * s], [u2[0] * s, Sy + u2[1] * s]], { color: 'ink', width: 1.2 });
          });
          if (Sy > by[0]) pic.dot(0, Sy, { r: 4.5, color: 'gold', label: 'station point', labelPos: 'e' });
          else pic.corner('station point below the frame', 'bl', { color: 'gold', size: 11.5 });
          if (!VL.visible) pic.corner(`← V_L off the picture (${v.fix(xl, 1)})`, 'tl', { color: 'orange', size: 11.5 });
          if (!VR.visible) pic.corner(`V_R off the picture (${v.fix(xr, 1)}) →`, 'tr', { color: 'accent', size: 11.5 });
        });
        v.legend([['orange', 'edges toward $V_L$'], ['accent', 'edges toward $V_R$'], ['gold', 'Thales circle on $V_LV_R$', { dash: true }]]);
        v.readout(() => {
          const xl = -dd / Math.tan(phi), xr = dd * Math.tan(phi), Sy = -dd;
          const ang = deg(Math.acos(M.clamp(M.dot(M.normalize([xl, -Sy]), M.normalize([xr, -Sy])), -1, 1)));
          return `building turned $\\varphi = ${v.fix(deg(phi), 1)}°$ · $\\overline{PV_L} = ${v.fix(-xl, 3)}$, $\\overline{PV_R} = ${v.fix(xr, 3)}$, product $${v.fix(-xl * xr, 3)} = d^2$ with $d = ${v.fix(dd, 3)}$ · angle $V_L\\,S\\,V_R = ${v.fix(ang, 2)}°$`;
        });
      },
    },
  ],
};
