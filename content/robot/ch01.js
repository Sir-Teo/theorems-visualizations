// Robotics — Chapter 1: Configuration space
import {
  TAU, DEG, clamp, wrap, angDiff, piTicks, fkChain, ik2, armHitsDiscs, floodTorus, rotFromVec, rotFromQuat, quatFromVec, mulVec,
  dofAfterPins, twistExp, buildMech, gruebler, MECHS, linkOutline, linkColor,
} from './ch01.shared.js';

const rot2 = (th, p) => [Math.cos(th) * p[0] - Math.sin(th) * p[1], Math.sin(th) * p[0] + Math.cos(th) * p[1]];

export default {
  collection: 'robot',
  chapter: 1,
  title: 'Configuration space',
  summary: String.raw`A robot's configuration is the list of numbers that pins down where every part of it is, and the set of all configurations — the C-space — has a dimension and a shape. Grübler's formula counts degrees of freedom of mechanisms from their joints, the topology of C-space explains why a two-link arm lives on a torus (and why orientations live on $SO(3)$), and constraints split into those that reduce the dimension and those that only limit velocities.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Degrees of freedom of a rigid body',
      statement: String.raw`The number of degrees of freedom of a mechanical system is the least number of real coordinates needed to specify the position of every point of it. A rigid body in the plane has $3$ — for instance the position $(x,y)$ of one point and an angle $\theta$ — and a rigid body in space has $6$: three position coordinates and three for orientation. Equivalently, count: $n$ points of a body in $\R^d$ carry $nd$ coordinates, and the rigidity constraints $\|p_i-p_j\|=\text{const}$ remove all but $3$ (for $d=2$) or $6$ (for $d=3$) of them once the points are not collinear.`,
      idea: String.raw`Three non-collinear points of the plane have $6$ coordinates and three fixed mutual distances, so $6-3=3$. In space, three points have $9$ coordinates and $3$ distances: $9-3=6$, and any further point is fixed by its distances to the three. A fast way to see the same number is to pin the body: a pinned point removes its two (resp. three) translational freedoms; pinning one point leaves the rotations ($1$, resp. $3$), a second point leaves one rotation about the line through the pins (in the plane nothing), and a third non-collinear point freezes the body. The count therefore is a rank computation: the velocity of a body point $P$ under a twist is $v+\omega\times P$, and the number of freedoms is the dimension of the twists that keep every pinned point still.`,
      caption: String.raw`**Plane:** drag the body by the blue handle (position) and the orange handle $\theta$ (heading); click the body to pin it at that spot, click a pin to remove it. **Space:** choose how many vertices to pin and whether they lie on an edge. The right panel plots the degrees of freedom left against the number of pins, from the rank of the pinning equations. Pin three points on one line in space and a rotation about that line survives.`,
      deps: ['mech-6.1'],
      refs: ['Lynch–Park §2.1'],
      tags: ['degrees of freedom', 'rigid body'],
      viz(v) {
        const M = v.M;
        const mode = v.select('space', [{ value: '2', label: 'plane' }, { value: '3', label: 'space' }], '2');
        const nPins = v.slider('pinned vertices', 0, 5, 2, { int: true });
        const layout = v.select('pins', [{ value: 'gen', label: 'generic' }, { value: 'line', label: 'on one line' }], 'gen');
        const clear = v.button('Remove pins', () => { pins.length = 0; });
        const cs = [0, 1, 2, 3, 4, 5].map((k) => v.slider(`free motion ${k + 1}`, -2.4, 2.4, k === 0 ? 0.9 : 0, { step: 0.01 }));
        const L = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, axes: false, height: 340, title: 'the body in the plane' });
        const S3 = v.stage3d({ range: 2.1, height: 340, yaw: -0.7, pitch: 0.45, axes: false, title: 'the body in space' });
        const R = v.stage({ x: [-0.6, 5.6], y: [-1.1, 7], height: 340, axes: false, title: 'freedoms left vs pins' });
        const BODY = [[-1.4, -0.8], [1.4, -0.9], [1.7, 0.4], [0.3, 1.1], [-1.5, 0.7]];
        let o = [0.2, 0.1], th = 0.45; const pins = [{ b: [0.9, -0.25], W: [0.2 + Math.cos(0.45) * 0.9 + Math.sin(0.45) * 0.25, 0.1 + Math.sin(0.45) * 0.9 - Math.cos(0.45) * 0.25] }];
        const world = (b) => { const r = rot2(th, b); return [o[0] + r[0], o[1] + r[1]]; };
        const local = (w) => rot2(-th, [w[0] - o[0], w[1] - o[1]]);
        const HB = [1.0, 0.15];
        const hp = L.handle(o[0], o[1], { color: 'accent', r: 7, label: 'x, y' });
        const hr = L.handle(world(HB)[0], world(HB)[1], { color: 'orange', r: 7, label: 'θ' });
        hp.constrain = (x, y) => { if (!pins.length) o = [x, y]; return [...o]; };
        hr.constrain = (x, y) => {
          if (pins.length === 0) th = Math.atan2(y - o[1], x - o[0]) - Math.atan2(HB[1], HB[0]);
          else if (pins.length === 1) { const W = pins[0].W, b = pins[0].b; th = Math.atan2(y - W[1], x - W[0]) - Math.atan2(HB[1] - b[1], HB[0] - b[0]); const r = rot2(th, b); o = [W[0] - r[0], W[1] - r[1]]; }
          return world(HB);
        };
        L.onClick((x, y) => {
          for (let k = 0; k < pins.length; k++) if (Math.hypot(pins[k].W[0] - x, pins[k].W[1] - y) < 0.25) { pins.splice(k, 1); return; }
          const b = local([x, y]);
          if (pins.length < 4 && M.pointInPoly(b, BODY)) pins.push({ b, W: [x, y] });
        });
        // space: a box, pinned vertices in a chosen order
        const A = [1.2, 0.8, 0.55];
        const PTS = { gen: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], line: [[-1, -1, -1], [0, -1, -1], [1, -1, -1], [1, -1, 1], [-1, 1, 1]] };
        const pinned3 = () => PTS[layout.value].slice(0, nPins.value).map((p) => p.map((c, i) => c * A[i]));
        const VERT = []; for (let i = 0; i < 8; i++) VERT.push([(i & 1 ? 1 : -1) * A[0], (i & 2 ? 1 : -1) * A[1], (i & 4 ? 1 : -1) * A[2]]);
        const EDGES = []; for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) if (!(i & (1 << b))) EDGES.push([i, i | (1 << b)]);
        const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        const sw = (k) => v.fix(k, 0);
        void sw;
        let st = null;
        v.render(() => {
          const planar = mode.value === '2';
          L.el.style.display = planar ? '' : 'none'; S3.el.style.display = planar ? 'none' : '';
          nPins.el.hidden = layout.el.hidden = planar; clear.hidden = !planar;
          let seq, k, dof;
          if (planar) {
            if (pins.length >= 2) { /* configuration frozen */ }
            if (pins.length === 1) { const r = rot2(th, pins[0].b); o = [pins[0].W[0] - r[0], pins[0].W[1] - r[1]]; }
            const bp = pins.map((p) => p.b); seq = []; for (let j = 0; j <= 4; j++) seq.push(j <= bp.length ? dofAfterPins(M, bp.slice(0, j), 2) : null);
            k = bp.length; dof = seq[k];
            hp.set(o[0], o[1]); hr.set(...world(HB));
            hp.visible = pins.length === 0; hr.visible = pins.length < 2;
            cs.forEach((c) => { c.el.hidden = true; });
            L.poly(BODY.map(world), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
            L.line(...o, ...world([1.0, 0]), { color: 'orange', width: 1.5, dash: [4, 3] });
            L.line(...o, ...world([0, 0.8]), { color: 'muted', width: 1, dash: [2, 3] });
            for (const p of pins) { const w = world(p.b); L.circle(w[0], w[1], 0.14, { fill: 'red', fillAlpha: 0.9, color: 'red' }); L.line(w[0] - 0.3, w[1] - 0.3, w[0] + 0.3, w[1] + 0.3, { color: 'red', width: 1.6 }); L.line(w[0] - 0.3, w[1] + 0.3, w[0] + 0.3, w[1] - 0.3, { color: 'red', width: 1.6 }); }
            if (!pins.length) L.corner('click the body to pin a point', 'tl', { color: 'muted' });
            if (dof === 0) L.corner('frozen: 0 degrees of freedom', 'tl', { color: 'red' });
          } else {
            const P3 = pinned3(); seq = []; for (let j = 0; j <= 5; j++) seq.push(dofAfterPins(M, PTS[layout.value].slice(0, j).map((p) => p.map((c, i) => c * A[i])), 3));
            k = P3.length; dof = seq[k];
            // basis of the twists that keep every pinned point still
            const rows = []; P3.forEach((P) => rows.push(...[[0, P[2], -P[1], 1, 0, 0], [-P[2], 0, P[0], 0, 1, 0], [P[1], -P[0], 0, 0, 0, 1]]));
            const basis = rows.length ? M.nullspace(rows, 1e-9) : [0, 1, 2, 3, 4, 5].map((i) => [0, 1, 2, 3, 4, 5].map((j) => (i === j ? 1 : 0)));
            cs.forEach((c, i) => { c.el.hidden = i >= dof; });
            const xi = [0, 0, 0, 0, 0, 0]; basis.forEach((b, i) => { for (let j = 0; j < 6; j++) xi[j] += cs[i].value * b[j]; });
            const T = twistExp(M, xi);
            const mv = (p) => [0, 1, 2].map((i) => T[i][0] * p[0] + T[i][1] * p[1] + T[i][2] * p[2] + T[i][3]);
            const VT = VERT.map(mv);
            for (const e of EDGES) S3.line(VERT[e[0]], VERT[e[1]], { color: 'faint', width: 1 });
            for (const f of FACES) S3.poly(f.map((i) => VT[i]), { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 1.2 });
            for (const e of EDGES) S3.line(VT[e[0]], VT[e[1]], { color: 'accent', width: 2 });
            P3.forEach((P, i) => S3.dot(mv(P), { color: 'red', r: 5.5, label: `${i + 1}` }));
            if (P3.length >= 2 && dof === 1) { const d = M.normalize(M.vsub(P3[1], P3[0])); S3.line(M.vadd(P3[0], M.vscale(d, -2.4)), M.vadd(P3[0], M.vscale(d, 2.4)), { color: 'green', width: 2 }); }
            const drift = P3.length ? Math.max(...P3.map((P) => M.dist(mv(P), P))) : 0;
            st = { drift };
          }
          if (planar) st = { drift: 0 };
          // staircase of freedoms vs pins
          const top = planar ? 3 : 6; R.setView([-0.6, 5.6], [-1.1, planar ? 4 : 7]);
          for (let j = 0; j < seq.length; j++) {
            if (seq[j] == null) { R.rect(j - 0.3, 0, j + 0.3, top, { color: 'faint', fill: false, dash: [3, 3], alpha: 0.6 }); continue; }
            const cur = j === k;
            R.rect(j - 0.3, 0, j + 0.3, Math.max(seq[j], 0.04), { fill: cur ? 'green' : 'accent', fillAlpha: cur ? 0.7 : 0.35, color: cur ? 'green' : 'accent', width: cur ? 2.2 : 1.2 });
            R.text(String(seq[j]), j, seq[j] + 0.28, { size: 15, color: cur ? 'green' : 'ink', align: 'center' });
            R.text(String(j), j, planar ? -0.4 : -0.55, { size: 12, color: 'muted', align: 'center' });
          }
          R.text('pins', 2.5, planar ? -0.85 : -1.0, { size: 11.5, color: 'muted', align: 'center' });
          R.hline(0, { color: 'muted', width: 1 });
          st.k = k; st.dof = dof; st.planar = planar; st.seq = seq;
        });
        v.readout(() => {
          if (!st) return '';
          const d = st.planar ? 2 : 3, nn = st.planar ? 3 : 6, r = nn - st.dof;
          const pts = st.planar ? 'three non-collinear points carry $3\\cdot2=6$ coordinates and $3$ distances: $6-3=3$' : 'three non-collinear points carry $3\\cdot3=9$ coordinates and $3$ distances: $9-3=6$';
          return `**${st.k}** pin${st.k === 1 ? '' : 's'}: the pinning equations have rank **${r}**, so $${nn}-${r}=\\mathbf{${st.dof}}$ degree${st.dof === 1 ? '' : 's'} of freedom remain${st.k ? ` (sequence ${st.seq.filter((x) => x != null).join(' → ')})` : ' — a free rigid body has all ' + nn}.${st.planar ? '' : ` Pinned points move by at most $${v.sci(st.drift + 1e-17, 1)}$ under the chosen motion.`}\n${pts} (dimension $d=${d}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Grübler’s formula',
      statement: String.raw`A mechanism consists of $N$ rigid links (the ground counted as one) and $J$ joints, joint $i$ allowing $f_i$ relative freedoms. A free link has $m=3$ freedoms in the plane ($m=6$ in space), so the unconstrained links carry $m(N-1)$ coordinates, and joint $i$ removes $m-f_i$ of them. The (Chebyshev–)Grübler(–Kutzbach) formula gives the degrees of freedom
$$\text{dof}=m(N-1-J)+\sum_{i=1}^{J}f_i .$$
It counts correctly when the joint constraints are independent; for special, overconstrained geometry the true mobility can be larger.`,
      idea: String.raw`Write the configuration of the $N-1$ moving links as $n=m(N-1)$ numbers; each joint contributes $m-f_i$ equations on them. If the equations are independent the solution set is a manifold of dimension $n-\sum(m-f_i)$, which is the formula. The honest mobility is $n-\operatorname{rank}\,J_C(q)$, with $J_C$ the Jacobian of the constraint equations — the same rank computation as for pinned points in 1.1 — and this exceeds Grübler's count exactly when the equations are dependent, as in the doubled parallelogram, whose redundant middle bar is always parallel to the other two.`,
      caption: String.raw`Pick a mechanism and drag the dots; the arms really move because the joint equations are solved by Newton steps on the constraint manifold. The right panel is the ledger: $3(N-1)$ coordinates, minus $2$ per pin (and per slider), ends at Grübler's number (blue); the green line is the mobility found numerically from the rank of the constraint Jacobian. The two agree for every mechanism but the doubled parallelogram, where the formula gives $0$ and the linkage moves.`,
      deps: ['robot-1.1'],
      refs: ['Lynch–Park §2.2'],
      credit: 'Chebyshev (mid-19th century); M. Grübler, 1883; K. Kutzbach, early 20th century',
      tags: ['mobility', 'linkages'],
      viz(v) {
        const M = v.M;
        const sel = v.select('mechanism', Object.keys(MECHS).map((k) => ({ value: k, label: MECHS[k].name })), 'four');
        const L = v.stage({ x: [-1.5, 6.5], y: [-2.5, 4.5], equal: true, axes: false, height: 380, title: 'drag a dot' });
        const W = v.stage({ x: [-0.8, 10], y: [-1.7, 11], axes: false, height: 380, title: 'Grübler ledger' });
        let key = '', mech = null, q = null;
        const H = [L.handle(0, 0, { color: 'accent', r: 8 }), L.handle(0, 0, { color: 'orange', r: 8 })];
        const spec = () => MECHS[sel.value];
        H.forEach((h, i) => { h.onDrag = () => { const d = spec().drive[i]; if (d) q = mech.drag(q, d.link, d.p, [h.x, h.y], M); }; });
        const ensure = () => { if (key !== sel.value) { key = sel.value; const sp = spec(); mech = buildMech(sp); q = mech.q0.slice(); L.setView([sp.view[0], sp.view[1]], [sp.view[2], sp.view[3]]); } };
        let st = null;
        v.render(() => {
          ensure(); const sp = spec(), N = sp.links.length, Jn = sp.joints.length;
          const sumF = Jn, g = gruebler(N, Jn, sumF);
          const info = mech.mobility(q, M);
          const T = (i, p) => mech.pos(q, i, p);
          // links
          for (let i = 0; i < N; i++) {
            const pts = linkOutline(sp, i).map((p) => T(i, p)), col = i === 0 ? 'ink' : linkColor(i);
            if (i === 0) { for (const p of pts) { L.poly([[p[0], p[1]], [p[0] - 0.28, p[1] - 0.45], [p[0] + 0.28, p[1] - 0.45]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.2 }); } if (pts.length > 1) L.path(pts, { color: 'muted', width: 2, dash: [5, 4] }); continue; }
            if (pts.length === 1) { const th = mech.pose(q, i)[2]; const c = pts[0], a = rot2(th, [0.4, 0.22]), b = rot2(th, [-0.4, 0.22]); L.poly([[c[0] + a[0], c[1] + a[1]], [c[0] + b[0], c[1] + b[1]], [c[0] - a[0], c[1] - a[1]], [c[0] - b[0], c[1] - b[1]]], { fill: col, fillAlpha: 0.4, color: col, width: 2 }); }
            else if (pts.length === 2) L.path(pts, { color: col, width: 9, alpha: 0.8 });
            else L.poly(pts, { fill: col, fillAlpha: 0.3, color: col, width: 3 });
          }
          for (const j of sp.joints) { const p = T(j.b, j.p); if (j.type === 'P') { const d = rot2(mech.pose(q, j.a)[2], j.dir); L.line(p[0] - d[0] * 1.6, p[1] - d[1] * 1.6, p[0] + d[0] * 1.6, p[1] + d[1] * 1.6, { color: 'muted', width: 1.2, dash: [3, 3] }); } }
          for (const j of sp.joints) { const p = T(j.b, j.p); L.circle(p[0], p[1], 0.11, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }); }
          H.forEach((h, i) => { const d = sp.drive[i]; h.visible = !!d; if (d) { const p = T(d.link, d.p); h.set(p[0], p[1]); } });
          const gap = g !== info.dof;
          if (info.dof === 0) L.corner('locked: 0 degrees of freedom', 'tl', { color: 'red' });
          // ledger
          const n0 = 3 * (N - 1); let y = n0; W.setView([-0.8, Jn + 4.6], [-1.7, n0 + 2]);
          W.rect(-0.35, 0, 0.35, y, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.6 });
          W.text(String(n0), 0, y + 0.55, { size: 14, align: 'center' }); W.text('3(N−1)', 0, -0.95, { size: 11, color: 'muted', align: 'center' });
          sp.joints.forEach((j, i) => {
            const d = j.type === 'R' ? 2 : 2; W.rect(i + 0.65, y - d, i + 1.35, y, { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.4 });
            W.text('−2', i + 1, y + 0.55, { size: 12, color: 'red', align: 'center' }); W.text(j.type === 'P' ? 'P' : 'R', i + 1, -0.95, { size: 11, color: 'muted', align: 'center' }); y -= d;
          });
          const xe = Jn + 1.9;
          W.rect(xe - 0.35, Math.min(0, y), xe + 0.35, Math.max(0, y) + (y === 0 ? 0.06 : 0), { fill: 'accent', fillAlpha: 0.7, color: 'accent', width: 2 });
          W.text(String(g), xe, Math.max(y, 0) + 0.7, { size: 17, color: 'accent', align: 'center' }); W.text('Grübler', xe, -0.95, { size: 11, color: 'muted', align: 'center' });
          W.hline(0, { color: 'muted', width: 1 });
          W.line(-0.8, info.dof, Jn + 4.6, info.dof, { color: 'green', width: 2, dash: [6, 4] });
          W.text(`rank test: ${info.dof}`, Jn + 4.5, info.dof - 0.55, { size: 12.5, color: 'green', align: 'right' });
          if (gap) W.corner('Grübler is wrong here', 'tr', { color: 'red', weight: 600 });
          st = { sp, N, Jn, g, info, gap };
        });
        v.legend([['accent', 'Grübler count'], ['green', 'numerical mobility', { dash: true }], ['red', 'removed by joints']]);
        v.readout(() => {
          if (!st) return '';
          const { N, Jn, g, info, gap } = st;
          const base = `${st.sp.name} (${st.sp.note}): $N=${N}$ links, $J=${Jn}$ one-freedom joints, $\\text{dof}=3(N-1-J)+\\sum f_i=3(${N}-1-${Jn})+${Jn}=\\mathbf{${g}}$. Constraint Jacobian: ${info.n} unknowns, ${info.m} equations, rank ${info.rank}, so the mechanism really has $${info.n}-${info.rank}=\\mathbf{${info.dof}}$ freedom${info.dof === 1 ? '' : 's'}${gap ? ` — **the equations are dependent** (${info.m - info.rank} redundant), which Grübler's count cannot see` : ' — they agree'}.`;
          const sp = `\nSpatial checks, $6(N-1-J)+\\sum f_i$: 6R arm $6(7-1-6)+6=${gruebler(7, 6, 6, 6)}$; Stewart–Gough platform (14 links, 6 legs of universal + prismatic + spherical, 18 joints) $6(14-1-18)+36=${gruebler(14, 18, 36, 6)}$.`;
          return base + sp;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Topology of configuration space',
      statement: String.raw`The configuration space (C-space) of a system is the set of all its configurations, a space of dimension equal to the degrees of freedom. Its shape matters as much as its dimension: one revolute joint has configuration space the circle $S^1=SO(2)$, because angles differing by $2\pi$ are the same configuration; $n$ revolute joints give the torus $T^n=(S^1)^n$; a rigid body in the plane has $\R^2\times S^1$; and the orientations of a rigid body in space form $SO(3)$, which is the 3-sphere $S^3$ of unit quaternions with antipodal points $q\sim-q$ identified (the real projective space $\mathbb{RP}^3$). Unlike $\R^n$, these spaces contain loops that cannot be shrunk, and no single global coordinate chart covers them without a seam.`,
      idea: String.raw`Forward kinematics of the 2R arm only uses $\cos\theta_i,\sin\theta_i$, so $(\theta_1,\theta_2)$ and $(\theta_1+2\pi,\theta_2)$ give the same arm: the square $[-\pi,\pi]^2$ with opposite edges glued is the configuration space, and gluing a square that way yields a torus. The same logic that is invisible in $\R^2$ appears for rotations: the map $q\mapsto R(q)$ from unit quaternions is two-to-one with $R(q)=R(-q)$, so $SO(3)=S^3/\pm$; a rotation by $2\pi$ about any axis is a closed loop in $SO(3)$ that cannot be contracted (it lifts to a path from $q$ to $-q$), while a rotation by $4\pi$ can. Obstacles live in this space too: a configuration is forbidden if the arm touches an obstacle, tested pointwise on a grid, and the seam makes free space wrap around.`,
      caption: String.raw`**Arm:** drag the tip (left), or the point in the square (middle); the path of the configuration is drawn on the flat square, where it re-enters on the opposite side whenever it crosses a seam, and on the 3D torus (drag to rotate it). Scrub *replay* to play the recorded path back as arm motion. Turn on *obstacles* to colour the square by a collision test on a $96\times96$ grid and watch the connected components of free space (flood fill, with the seams) change as you grow the obstacles. **Orientation:** drag the point in the ball (rotation vector $\theta\hat n$, opposite surface points are the same rotation) and spin further about the axis; the circle shows $q$ and $-q$ giving one rotation.`,
      deps: ['robot-1.1', 'mech-6.1'],
      refs: ['Lynch–Park §2.3'],
      credit: 'configuration space for planning: T. Lozano-Pérez, 1983 (after Udupa, 1977)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Configuration_space_(physics)' },
      tags: ['configuration space', 'torus', 'SO(3)'],
      viz(v) {
        const M = v.M;
        const mode = v.select('C-space', [{ value: 'arm', label: 'two-link arm: torus' }, { value: 'rot', label: 'orientation: SO(3)' }], 'arm');
        const limits = v.toggle('joint limits ±150°', false);
        const obs = v.toggle('obstacles', false);
        const grow = v.slider('obstacle growth', 0, 0.55, 0.12, { step: 0.01 });
        const scrub = v.slider('replay', 0, 1, 1, { step: 0.002 });
        const clr = v.button('Clear path', () => { trace = [lift.slice()]; scrub.set(1); });
        const spin = v.slider('then spin further (rad)', 0, 4 * Math.PI, 4.64, { step: 0.01 });
        const l1 = 1.3, l2 = 1.0, WID = 0.05;
        const A = v.stage({ x: [-2.8, 2.8], y: [-2.6, 2.6], equal: true, axes: false, height: 360, title: 'workspace' });
        const sc = v.scene3(A, { yaw: -0.6, pitch: 0.4, axes: false, hint: false, lim: 3.3 });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [-Math.PI, Math.PI], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'θ₁', ylabel: 'θ₂', xticks: piTicks(-4, 4), yticks: piTicks(-4, 4), title: 'configuration space' });
        const C = v.stage3d({ range: 1.75, height: 360, yaw: -0.5, pitch: 0.7, axes: false, title: 'the torus, and the oriented body' });
        // --- arm state
        let th = [0.6, -0.4], lift = [0.6, -0.4], trace = [];
        for (let i = 0; i <= 140; i++) { const s = i / 140; trace.push([0.6 + 4.7 * s, -0.4 + 3.6 * s + 1.1 * Math.sin(5 * s)]); }
        lift = trace[trace.length - 1].slice(); th = [wrap(lift[0]), wrap(lift[1])];
        const discs = [{ x: 0.2, y: 1.55, r: 0.3 }, { x: -1.5, y: -0.9, r: 0.38 }];
        const dh = discs.map((d, i) => A.handle(d.x, d.y, { color: 'red', r: 7, label: i ? '' : '' }));
        const lim = 150 * DEG;
        const setTh = (a, b) => {
          const na = [limits.value ? clamp(a, -lim, lim) : wrap(a), limits.value ? clamp(b, -lim, lim) : wrap(b)];
          const d1 = angDiff(na[0], th[0]), d2 = angDiff(na[1], th[1]);
          if (limits.value) { lift = [na[0], na[1]]; } else { lift = [lift[0] + d1, lift[1] + d2]; }
          th = na;
          const last = trace[trace.length - 1];
          if (!last || Math.hypot(lift[0] - last[0], lift[1] - last[1]) > 0.025) trace.push(lift.slice());
          if (trace.length > 2500) trace.shift();
          scrub.set(1);
        };
        const tip = A.handle(0, 0, { color: 'accent', r: 8 });
        tip.constrain = (x, y) => {
          const r = Math.hypot(x, y), rr = clamp(r, Math.abs(l1 - l2) + 1e-6, l1 + l2 - 1e-6), k = r > 1e-9 ? rr / r : 1;
          const sols = ik2(l1, l2, x * k, y * k) || [];
          let best = null, bd = 1e9;
          for (const s of sols) { if (limits.value && (Math.abs(s[0]) > lim || Math.abs(s[1]) > lim)) continue; const d = Math.hypot(angDiff(s[0], th[0]), angDiff(s[1], th[1])); if (d < bd) { bd = d; best = s; } }
          if (best) setTh(best[0], best[1]);
          const f = fkChain([l1, l2], th).pts[2]; return f;
        };
        const Q = B.handle(th[0], th[1], { color: 'gold', r: 8, label: 'θ' });
        Q.constrain = (x, y) => { setTh(x, y); return [...th]; };
        // --- obstacle grid
        const NG = 96; let gkey = '', grid = null;
        const gridFor = () => {
          const key = [obs.value, grow.value, limits.value, ...discs.map((d) => d.x.toFixed(3) + d.y.toFixed(3) + d.r)].join();
          if (key === gkey) return grid; gkey = key;
          const free = new Uint8Array(NG * NG), dd = discs.map((d) => ({ ...d, r: d.r + grow.value }));
          for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
            const a = -Math.PI + ((i + 0.5) * TAU) / NG, b = -Math.PI + ((j + 0.5) * TAU) / NG;
            const out = limits.value && (Math.abs(a) > lim || Math.abs(b) > lim);
            free[i + NG * j] = out || (obs.value && armHitsDiscs(l1, l2, a, b, dd, WID)) ? 0 : 1;
          }
          const fl = floodTorus(free, NG);
          grid = { free, ...fl }; return grid;
        };
        const hitAt = (a, b) => obs.value && armHitsDiscs(l1, l2, a, b, discs.map((d) => ({ ...d, r: d.r + grow.value })), WID);
        const cellOf = (a, b) => { const i = clamp(Math.floor(((a + Math.PI) / TAU) * NG), 0, NG - 1), j = clamp(Math.floor(((b + Math.PI) / TAU) * NG), 0, NG - 1); return i + NG * j; };
        const compCols = ['green', 'accent', 'purple', 'teal', 'gold', 'pink'];
        // --- orientation state
        const rh = sc.handle([1.4, 0.8, 0.3], { color: 'accent', label: 'r', lim: 3.3, snap: (p) => { const n = Math.hypot(...p); if (n > Math.PI) { const s = -(TAU - n) / n; return [p[0] * s, p[1] * s, p[2] * s]; } return p; } });
        const torus = (u, w, off = 0) => { const r = 0.62 + off; return [(1.1 + r * Math.cos(w)) * Math.cos(u), (1.1 + r * Math.cos(w)) * Math.sin(u), r * Math.sin(w)]; };
        let st = null;
        v.render(() => {
          const arm = mode.value === 'arm';
          limits.el.hidden = obs.el.hidden = grow.el.hidden = scrub.el.hidden = clr.hidden = !arm; spin.el.hidden = arm;
          dh.forEach((h) => { h.visible = arm && obs.value; }); tip.visible = arm; Q.visible = arm; rh.visible = !arm;
          grow.el.hidden = !(arm && obs.value);
          A.setTitle(arm ? 'workspace' : 'rotation vector $\\theta\\hat n$: ball of radius $\\pi$'); B.setTitle(arm ? 'configuration space' : '$q$ and $-q$ on a great circle');
          A.setView(arm ? [-2.8, 2.8] : [-4.1, 4.1], arm ? [-2.6, 2.6] : [-3.7, 3.7]);
          if (arm) { B.setView([-Math.PI, Math.PI], [-Math.PI, Math.PI]); B.setLabels('θ₁', 'θ₂'); B.setTicks(piTicks(-4, 4), piTicks(-4, 4)); } else { B.setLabels(null, null); B.setTicks([], []); }
          if (arm) {
            if (limits.value) th = th.map((x) => clamp(x, -lim, lim));
            const idx = Math.round(scrub.value * (trace.length - 1));
            if (scrub.value < 0.999 && trace[idx]) { th = [wrap(trace[idx][0]), wrap(trace[idx][1])]; if (limits.value) th = [clamp(trace[idx][0], -lim, lim), clamp(trace[idx][1], -lim, lim)]; }
            discs.forEach((d, i) => { d.x = dh[i].x; d.y = dh[i].y; });
            const G = gridFor();
            const chain = fkChain([l1, l2], th);
            tip.set(...chain.pts[2]); Q.set(th[0], th[1]);
            const hit = hitAt(th[0], th[1]);
            // square: colour by component
            const base = (a, b) => ((Math.floor((a + Math.PI) / (Math.PI / 3)) + Math.floor((b + Math.PI) / (Math.PI / 3))) & 1) ? 0.1 : 0;
            B.raster((x, y) => {
              if (x < -Math.PI || x >= Math.PI || y < -Math.PI || y >= Math.PI) return null;
              const c = cellOf(x, y), lb = G.lab[c];
              if (!G.free[c]) { return limits.value && (Math.abs(x) > lim || Math.abs(y) > lim) ? v.ramp(0.28, 'muted') : v.ramp(0.62, 'red'); }
              if (obs.value) return v.ramp(0.42 - 0.05 * (lb % 2), compCols[lb % compCols.length]);
              return v.ramp(0.14 + base(x, y), 'accent');
            }, { key: gkey + '|' + obs.value, res: 2, id: 'cs' });
            // seams
            B.line(-Math.PI, -Math.PI, -Math.PI, Math.PI, { color: 'orange', width: 3 }); B.line(Math.PI, -Math.PI, Math.PI, Math.PI, { color: 'orange', width: 3 });
            B.line(-Math.PI, -Math.PI, Math.PI, -Math.PI, { color: 'green', width: 3 }); B.line(-Math.PI, Math.PI, Math.PI, Math.PI, { color: 'green', width: 3 });
            for (const yy of [-0.4, 0.4]) { B.arrow(-Math.PI - 0.0, yy - 0.12, -Math.PI, yy + 0.12, { color: 'orange', head: 7, width: 2 }); B.arrow(Math.PI, yy - 0.12, Math.PI, yy + 0.12, { color: 'orange', head: 7, width: 2 }); }
            for (const xx of [-0.4, 0.4]) { B.arrow(xx - 0.12, -Math.PI, xx + 0.12, -Math.PI, { color: 'green', head: 7, width: 2 }); B.arrow(xx - 0.12, Math.PI, xx + 0.12, Math.PI, { color: 'green', head: 7, width: 2 }); }
            // path on the square, drawn in every periodic copy
            const kr = limits.value ? [0] : [-2, -1, 0, 1, 2];
            B.clip(() => { for (const k1 of kr) for (const k2 of kr) B.path(trace.map((p) => [p[0] + TAU * k1, p[1] + TAU * k2]), { color: 'gold', width: 2.2, alpha: k1 === 0 && k2 === 0 ? 1 : 0.85 }); }, [-Math.PI, Math.PI], [-Math.PI, Math.PI]);
            B.dot(trace[0][0], trace[0][1], { r: 4, color: 'gold', hollow: true });
            // workspace
            if (obs.value) for (const d of discs) { A.circle(d.x, d.y, d.r + grow.value, { fill: 'red', fillAlpha: 0.1, color: 'red', width: 1.2, dash: [4, 3] }); A.circle(d.x, d.y, d.r, { fill: 'red', fillAlpha: 0.45, color: 'red', width: 2 }); }
            A.circle(0, 0, l1 + l2, { color: 'faint', width: 1, dash: [3, 4] }); A.circle(0, 0, Math.abs(l1 - l2), { color: 'faint', width: 1, dash: [3, 4] });
            const col = hit ? 'red' : 'accent';
            A.path(chain.pts, { color: col, width: 7, alpha: 0.85 });
            A.path(trace.filter((_, i) => i % 3 === 0).map((p) => fkChain([l1, l2], p).pts[2]), { color: 'gold', width: 1.6, alpha: 0.8 });
            A.dot(0, 0, { r: 5.5, color: 'ink' }); A.dot(...chain.pts[1], { r: 5, color: 'ink', hollow: true });
            if (hit) A.corner('collision', 'tl', { color: 'red', weight: 600 });
            // torus
            C.surface((u, w) => torus(u, w), [-Math.PI, Math.PI], [-Math.PI, Math.PI], {
              nu: 72, nv: 36, alpha: 1, shade: true,
              colorFn: (u, w) => { const c = cellOf(u + 0.02, w + 0.02), lb = G.lab[c]; if (!G.free[c]) return limits.value && (Math.abs(u) > lim || Math.abs(w) > lim) ? v.rgb('muted') : v.rgb('red'); if (obs.value) return v.mix(compCols[lb % compCols.length], 'panel', 0.35); return v.mix('accent', 'panel', 0.5 - 0.35 * (Math.floor((u + Math.PI) / (Math.PI / 3)) + Math.floor((w + Math.PI) / (Math.PI / 3)) & 1)); },
            });
            C.curve((t) => torus(Math.PI, t), -Math.PI, Math.PI, { color: 'orange', width: 3, n: 60 });
            C.curve((t) => torus(t, Math.PI), -Math.PI, Math.PI, { color: 'green', width: 3, n: 80 });
            let seg = []; const pieces = [];
            for (let i = 0; i < trace.length; i++) { const p = trace[i]; if (!limits.value && i > 0 && (Math.abs(wrap(p[0]) - wrap(trace[i - 1][0])) > 3 || Math.abs(wrap(p[1]) - wrap(trace[i - 1][1])) > 3)) { pieces.push(seg); seg = []; } seg.push(torus(wrap(p[0]), wrap(p[1]), 0.04)); }
            pieces.push(seg); for (const sg of pieces) if (sg.length > 1) C.path(sg, { color: 'gold', width: 3 });
            C.dot(torus(th[0], th[1], 0.07), { color: 'ink', r: 7 });
            // statistics
            let ncol = 0; for (const p of trace) if (hitAt(wrap(p[0]), wrap(p[1]))) ncol++;
            const f0 = fkChain([l1, l2], th).pts[2], f1 = fkChain([l1, l2], [th[0] + TAU, th[1]]).pts[2], f2 = fkChain([l1, l2], [th[0], th[1] - TAU]).pts[2];
            const lbl = G.lab[cellOf(th[0], th[1])], sizes = G.sizes;
            let sm = 0; for (let i = 1; i < trace.length; i++) { if (Math.floor((trace[i][0] + Math.PI) / TAU) !== Math.floor((trace[i - 1][0] + Math.PI) / TAU)) sm++; if (Math.floor((trace[i][1] + Math.PI) / TAU) !== Math.floor((trace[i - 1][1] + Math.PI) / TAU)) sm++; }
            st = { seams: sm, arm, hit, per: Math.max(Math.hypot(f0[0] - f1[0], f0[1] - f1[1]), Math.hypot(f0[0] - f2[0], f0[1] - f2[1])), ncol, comps: G.count, lbl, sizes, lift: lift.slice(), start: trace[0], tr: trace.length };
          } else {
            sc.begin();
            const p0 = rh.p, n0 = Math.hypot(...p0) || 1, ax = p0.map((c) => c / n0), Psi = n0 + spin.value;
            // ball of radius π with wireframe
            for (let i = 1; i < 4; i++) { const z = Math.PI * Math.cos((Math.PI * i) / 4), r = Math.PI * Math.sin((Math.PI * i) / 4), c = []; for (let k = 0; k <= 48; k++) c.push([r * Math.cos((TAU * k) / 48), r * Math.sin((TAU * k) / 48), z]); sc.path(c, { color: 'muted', width: 0.8, alpha: 0.4 }); }
            for (let j = 0; j < 6; j++) { const a = (Math.PI * j) / 3, c = []; for (let k = 0; k <= 48; k++) { const ph = (TAU * k) / 48; c.push([Math.PI * Math.sin(ph) * Math.cos(a), Math.PI * Math.sin(ph) * Math.sin(a), Math.PI * Math.cos(ph)]); } sc.path(c, { color: 'muted', width: 0.8, alpha: 0.35 }); }
            const ballPt = (psi) => { const m = psi % TAU; return m <= Math.PI ? ax.map((c) => c * m) : ax.map((c) => -c * (TAU - m)); };
            const pts = []; let cur = []; const NS = 160;
            for (let i = 0; i <= NS; i++) { const psi = (Psi * i) / NS, m = psi % TAU, prev = ((Psi * (i - 1)) / NS) % TAU; if (i > 0 && Math.abs(m - prev) > Math.PI) { pts.push(cur); cur = []; } cur.push(ballPt(psi)); }
            pts.push(cur); for (const c of pts) if (c.length > 1) sc.path(c, { color: 'gold', width: 3 });
            const here = ballPt(Psi); sc.dot(here, { color: 'ink', r: 6 });
            if (Math.abs(Math.hypot(...here) - Math.PI) < 0.05) sc.dot(here.map((c) => -c), { color: 'ink', r: 6, hollow: true });
            sc.line(ax.map((c) => -c * Math.PI), ax.map((c) => c * Math.PI), { color: 'orange', width: 1.2, alpha: 0.7 }, 8);
            sc.flush();
            // quaternion circle
            const half = Psi / 2, qd = [Math.cos(half), Math.sin(half)];
            B.setView([-1.45, 1.45], [-1.45, 1.45]);
            B.circle(0, 0, 1, { color: 'ink', width: 1.4 });
            B.arrow(0, 0, 1.3, 0, { color: 'faint', width: 1 }); B.arrow(0, 0, 0, 1.3, { color: 'faint', width: 1 });
            B.text('w', 1.36, -0.13, { size: 12, color: 'muted' }); B.text('n·v', 0.1, 1.36, { size: 12, color: 'muted' }); B.corner('q = (cos Ψ/2, n̂ sin Ψ/2)', 'bl', { color: 'muted' });
            const arc = []; for (let i = 0; i <= 200; i++) { const a = (half * i) / 200; arc.push([Math.cos(a), Math.sin(a)]); }
            B.path(arc, { color: 'gold', width: 3.5 });
            B.dot(qd[0], qd[1], { r: 8, color: 'accent', label: 'q', labelPos: 'ne' }); B.dot(-qd[0], -qd[1], { r: 8, color: 'purple', label: '−q', labelPos: 'sw' });
            B.line(qd[0], qd[1], -qd[0], -qd[1], { color: 'faint', width: 1, dash: [3, 4] });
            B.dot(1, 0, { r: 4, color: 'ink', hollow: true }); B.dot(-1, 0, { r: 4, color: 'ink', hollow: true });
            // oriented body
            const Rr = rotFromVec(ax.map((c) => c * Psi)), qn = quatFromVec(ax.map((c) => c * Psi));
            const Rq = rotFromQuat(qn), Rm = rotFromQuat(qn.map((c) => -c));
            const hs = [1.0, 0.62, 0.14], box = []; for (let i = 0; i < 8; i++) box.push(mulVec(Rr, [(i & 1 ? 1 : -1) * hs[0], (i & 2 ? 1 : -1) * hs[1], (i & 4 ? 1 : -1) * hs[2]]));
            const FC = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
            for (const f of FC) C.poly(f.map((i) => box[i]), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.2 });
            ['red', 'green', 'blue'].forEach((c, i) => C.arrow([0, 0, 0], mulVec(Rr, [0, 1, 2].map((j) => (j === i ? 1.5 : 0))), { color: c, width: 2.5 }));
            C.arrow([0, 0, 0], ax.map((c) => c * 1.7), { color: 'orange', width: 1.5 });
            const d = (X, Y) => Math.max(...X.flat().map((x, i) => Math.abs(x - Y.flat()[i])));
            st = { arm, Psi, ax, dQ: d(Rq, Rm), dR: d(Rq, Rr), cross: Math.floor((Psi + Math.PI) / TAU), q: qn };
          }
          if (arm) sc.begin(), sc.flush();
        });
        v.legend([['gold', 'path of the configuration'], ['orange', 'glued edges'], ['green', 'glued edges (other pair)']]);
        v.readout(() => {
          if (!st) return '';
          if (st.arm) {
            const c = st.comps;
            return `$\\theta=(${v.fix(th[0] / DEG, 0)}^\\circ,\\ ${v.fix(th[1] / DEG, 0)}^\\circ)$. Periodicity check: the tool position at $\\theta_1+2\\pi$ or $\\theta_2-2\\pi$ differs from the one at $\\theta$ by $${v.sci(st.per + 1e-17, 1)}$. Unwrapped path: $\\Delta\\theta/2\\pi=(${v.fix((st.lift[0] - st.start[0]) / TAU, 2)},\\ ${v.fix((st.lift[1] - st.start[1]) / TAU, 2)})$; seams crossed by the recorded path: ${st.seams}.${obs.value || limits.value ? `\nFree space on the $96\\times96$ grid has **${c}** connected component${c === 1 ? '' : 's'} (flood fill across the seams), sizes ${st.sizes.slice(0, 4).join(', ')}${c > 4 ? ', …' : ''} cells; the arm sits in ${st.lbl >= 0 ? 'component ' + (st.lbl + 1) : 'a forbidden cell'}. ${st.ncol} of ${st.tr} recorded path points collide.` : ''}`;
          }
          return `Total angle $\\Psi=${v.fix(st.Psi, 2)}$ about $\\hat n=(${st.ax.map((c) => v.fix(c, 2)).join(',')})$ gives $q=(${st.q.map((c) => v.fix(c, 3)).join(', ')})$. $R(q)$ from the quaternion differs from Rodrigues' $R(\\Psi\\hat n)$ by $${v.sci(st.dR + 1e-17, 1)}$ and from $R(-q)$ by $${v.sci(st.dQ + 1e-17, 1)}$: **$q$ and $-q$ are one rotation**. The path has crossed the boundary of the ball **${st.cross}** time${st.cross === 1 ? '' : 's'}: ${st.cross % 2 ? 'odd, so a loop at $\\Psi=2\\pi$ cannot be shrunk' : 'even, so the loop can be shrunk to a point'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Holonomic and nonholonomic constraints',
      statement: String.raw`A constraint on a mechanical system is **holonomic** if it can be written as an equation $h(q)=0$ between the configuration coordinates alone; it removes dimensions from the configuration space. A constraint is **nonholonomic** if it restricts only velocities, $\omega(q)\,\dot q=0$ (a Pfaffian constraint), and cannot be integrated to such an equation. A coin rolling without slipping, with configuration $q=(x,y,\varphi)$, obeys $\dot x\sin\varphi-\dot y\cos\varphi=0$: it never moves sideways at any instant, but all of the 3-dimensional space of positions and headings remains reachable.`,
      idea: String.raw`The constraint says $\dot q$ must lie in the span of $f_1=(\cos\varphi,\sin\varphi,0)$ (roll) and $f_2=(0,0,1)$ (turn). Following $f_1$, then $f_2$, then $-f_1$, then $-f_2$ does not return to the start: the net displacement is the Lie bracket $[f_1,f_2]=(\sin\varphi,-\cos\varphi,0)$, which points sideways and lies outside the span of $f_1,f_2$. By Frobenius' theorem the constraint is integrable (holonomic) exactly when the span is closed under brackets, and by the Chow–Rashevskii theorem, when brackets of the allowed fields span the whole tangent space every configuration is reachable. A skate whose blade is locked at fixed angle $\alpha$ has $f_1=(\cos\alpha,\sin\alpha,0)$ constant, bracket $0$, and the constraint integrates to the line $y\cos\alpha-x\sin\alpha=\text{const}$: holonomic.`,
      caption: String.raw`Drag the goal position and the goal heading (orange). The coin turns on the spot, rolls, and turns again until it lies on the goal; the right panel shows the same path in $(x,y,\varphi)$-space with the plane of allowed velocities (green) and the sideways bracket direction (red) sticking out of it. In *wiggle* mode the coin rolls forward, turns, rolls back and turns back, over and over, and ends up shifted sideways with its heading restored. Switch to the **locked blade** and every move is along one line: the goal is out of reach (red gap).`,
      deps: ['mech-6.3', 'robot-1.3'],
      refs: ['Lynch–Park §2.4'],
      credit: 'integrability: Frobenius (1877); reachability: Chow, 1939 and Rashevskii, 1938',
      scope: String.raw`The kinematic rolling model with free turning in place (a coin or unicycle on a flat table); no slipping, no skidding, and no limits on turning.`,
      tags: ['nonholonomic', 'Lie bracket'],
      viz(v) {
        const M = v.M;
        const kind = v.select('constraint', [{ value: 'wheel', label: 'rolling coin (heading free)' }, { value: 'blade', label: 'locked blade (heading fixed)' }], 'wheel');
        const plan = v.select('manoeuvre', [{ value: 'trt', label: 'turn · roll · turn' }, { value: 'wig', label: 'wiggle sideways' }], 'trt');
        const ang = v.slider('wiggle angle $a$', 0.15, 1.2, 0.6, { step: 0.01 });
        const len = v.slider('roll length $s$', 0.3, 1.4, 0.9, { step: 0.01 });
        const cyc = v.slider('cycles', 1, 8, 4, { int: true });
        const L = v.stage({ x: [-4.6, 4.6], y: [-3.2, 3.2], equal: true, axes: false, height: 380, title: 'the table, seen from above' });
        const S = v.stage3d({ range: 2.3, height: 380, yaw: -0.8, pitch: 0.4, axes: false, title: 'configuration space $(x,y,\\varphi)$' });
        const START = [-3.1, -1.4, 0.5];
        const G = L.handle(2.4, 1.3, { color: 'orange', r: 8 });
        const GH = L.handle(2.4 + 1.3 * Math.cos(0.4), 1.3 + 1.3 * Math.sin(0.4), { color: 'orange', r: 6 });
        G.onDrag = () => { const a = Math.atan2(GH.y - G.y, GH.x - G.x); GH.set(G.x + 1.3 * Math.cos(a), G.y + 1.3 * Math.sin(a)); };
        GH.constrain = (x, y) => { const a = Math.atan2(y - G.y, x - G.x); return [G.x + 1.3 * Math.cos(a), G.y + 1.3 * Math.sin(a)]; };
        // a manoeuvre = list of controls (type 'turn' with Δφ, type 'roll' with Δs); returns sampled poses
        const rollOnly = (kind) => kind === 'blade';
        const build = () => {
          const segs = []; const blade = rollOnly(kind.value);
          if (plan.value === 'trt') {
            if (blade) {
              const d = [Math.cos(START[2]), Math.sin(START[2])], s = (G.x - START[0]) * d[0] + (G.y - START[1]) * d[1];
              segs.push({ t: 'roll', a: s });
            } else {
              const dx = G.x - START[0], dy = G.y - START[1], psi = Math.atan2(dy, dx), gh = Math.atan2(GH.y - G.y, GH.x - G.x);
              segs.push({ t: 'turn', a: angDiff(psi, START[2]) }, { t: 'roll', a: Math.hypot(dx, dy) }, { t: 'turn', a: angDiff(gh, psi) });
            }
          } else {
            for (let i = 0; i < cyc.value; i++) { segs.push({ t: 'roll', a: len.value }); if (!blade) segs.push({ t: 'turn', a: -ang.value }); segs.push({ t: 'roll', a: -len.value }); if (!blade) segs.push({ t: 'turn', a: ang.value }); }
          }
          // integrate the kinematic model
          const pts = [START.slice()]; let q = START.slice(); const dur = []; let total = 0;
          for (const sg of segs) { const c = sg.t === 'roll' ? Math.abs(sg.a) : 0.55 * Math.abs(sg.a); dur.push(c); total += c; }
          const NSEG = 60, ts = [0]; let acc = 0, maxSlip = 0;
          segs.forEach((sg, k) => {
            for (let i = 1; i <= NSEG; i++) {
              const h = sg.a / NSEG, qp = q.slice();
              if (sg.t === 'roll') { q[0] += h * Math.cos(q[2]); q[1] += h * Math.sin(q[2]); } else q[2] += h;
              const mx = (q[0] - qp[0]), my = (q[1] - qp[1]), ph = (q[2] + qp[2]) / 2;
              maxSlip = Math.max(maxSlip, Math.abs(-mx * Math.sin(ph) + my * Math.cos(ph)));
              pts.push(q.slice()); acc += dur[k] / NSEG; ts.push(acc);
            }
          });
          return { segs, pts, ts, total: total || 1, maxSlip };
        };
        const poseAt = (P, s) => { const target = s * P.total; let lo = 0, hi = P.ts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P.ts[m] <= target) lo = m; else hi = m; } return P.pts[Math.min(hi, P.pts.length - 1)]; };
        const coin = (q, st) => {
          const c = Math.cos(q[2]), s = Math.sin(q[2]), a = 0.8, b = 0.13;
          const P = [[a, b], [a, -b], [-a, -b], [-a, b]].map(([u, w]) => [q[0] + c * u - s * w, q[1] + s * u + c * w]);
          L.poly(P, st); L.arrow(q[0], q[1], q[0] + 1.25 * c, q[1] + 1.25 * s, { color: st.color, width: 1.8, head: 7, alpha: st.alpha ?? 1 });
        };
        let st = null, P = null;
        v.animate((t) => {
          const wheel = kind.value === 'wheel', trt = plan.value === 'trt';
          ang.el.hidden = len.el.hidden = cyc.el.hidden = trt; GH.visible = G.visible = trt;
          START.splice(0, 3, ...(trt ? [-3.1, -1.4, 0.5] : [0.4, -2.1, 0.5]));
          L.setView(trt ? [-4.6, 4.6] : [-3.1, 3.1], trt ? [-3.2, 3.2] : [-3.1, 3.1]);
          P = build();
          const sNow = M.smoothstep(Math.min(1, (t % 7) / 5.5));
          const q = poseAt(P, sNow);
          const end = P.pts[P.pts.length - 1];
          // table
          if (!wheel) { const a = START[2]; L.line(START[0] - 8 * Math.cos(a), START[1] - 8 * Math.sin(a), START[0] + 8 * Math.cos(a), START[1] + 8 * Math.sin(a), { color: 'green', width: 1.5, dash: [6, 4], alpha: 0.7 }); }
          coin(START, { fill: 'muted', fillAlpha: 0.2, color: 'muted', alpha: 0.7 });
          if (trt) { const gh = Math.atan2(GH.y - G.y, GH.x - G.x); coin([G.x, G.y, gh], { fill: 'orange', fillAlpha: 0.2, color: 'orange' }); }
          L.path(P.pts.filter((_, i) => P.ts[i] <= sNow * P.total + 1e-9).map((p) => [p[0], p[1]]), { color: 'gold', width: 2.2 });
          coin(q, { fill: 'accent', fillAlpha: 0.7, color: 'accent' });
          L.dot(q[0], q[1], { r: 3, color: 'ink' });
          const miss = trt && Math.hypot(end[0] - G.x, end[1] - G.y);
          if (trt && miss > 0.02) { L.line(end[0], end[1], G.x, G.y, { color: 'red', width: 2.4 }); L.corner('goal unreachable: the blade cannot turn', 'tl', { color: 'red', weight: 600 }); }
          // 3D configuration space
          const cs = (p) => [p[0] / 2.4, p[1] / 2.4, ((p[2] + Math.PI * 4) % (TAU * 3) - Math.PI * 3) / 1.9];
          void cs;
          const k = (p) => [p[0] / 1.7, p[1] / 1.7, (p[2] - START[2]) / 1.2];
          const f1 = [Math.cos(q[2]), Math.sin(q[2]), 0], f2 = [0, 0, 1];
          const dF = (fn, i) => { const h = 1e-5, a = q.slice(), b = q.slice(); a[i] += h; b[i] -= h; return fn(a).map((x, j) => (x - fn(b)[j]) / (2 * h)); };
          const F1 = wheel ? (qq) => [Math.cos(qq[2]), Math.sin(qq[2]), 0] : () => [Math.cos(START[2]), Math.sin(START[2]), 0], F2 = () => [0, 0, 1];
          const fv = F1(q);
          const br = dF(F1, 2).map((x) => -x);          // [f1, f2] = Df2·f1 − Df1·f2 = −∂f1/∂φ
          const rk2 = M.rank([fv, f2, [0, 0, 0]].map((r) => r.slice()), 1e-9), rk3 = M.rank([fv, f2, br], 1e-9);
          void f1; void rk2;
          const o = k(q), sx = 1 / 1.7, sp = 1.2;
          const e1 = [fv[0] * sx * sp, fv[1] * sx * sp, 0], e2 = [0, 0, sp / 1.2];
          const pl = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [o[0] + a * e1[0] * 1.3 + b * e2[0] * 0.8, o[1] + a * e1[1] * 1.3 + b * e2[1] * 0.8, o[2] + a * e1[2] * 1.3 + b * e2[2] * 0.8]);
          S.poly(pl, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.4 });
          if (Math.hypot(...br) > 1e-9) S.arrow(o, [o[0] + br[0] * sx * 2.4, o[1] + br[1] * sx * 2.4, o[2]], { color: 'red', width: 3 });
          S.path(P.pts.map(k), { color: 'faint', width: 1.4 });
          S.path(P.pts.filter((_, i) => P.ts[i] <= sNow * P.total + 1e-9).map(k), { color: 'gold', width: 3 });
          S.dot(k(START), { color: 'muted', r: 5 }); S.dot(o, { color: 'accent', r: 6.5 });
          if (trt) { const gh = Math.atan2(GH.y - G.y, GH.x - G.x); S.dot(k([G.x, G.y, START[2] + angDiff(gh, START[2])]), { color: 'orange', r: 6, label: 'goal' }); }
          if (!wheel) { const a = START[2], n = [-Math.sin(a), Math.cos(a)], c0 = n[0] * START[0] + n[1] * START[1]; void c0; const d = [Math.cos(a), Math.sin(a)]; const pp = (s, z) => [(START[0] + d[0] * s) / 1.7, (START[1] + d[1] * s) / 1.7, z]; S.poly([pp(-4.5, -1.5), pp(4.5, -1.5), pp(4.5, 1.5), pp(-4.5, 1.5)], { fill: 'green', fillAlpha: 0.08, color: 'green', width: 1, alpha: 0.5 }); }
          const net = [end[0] - START[0], end[1] - START[1]];
          st = { start: START, wheel, trt, rk3, miss, maxSlip: P.maxSlip, net, end, cyc: cyc.value, a: ang.value, s: len.value, q };
        }, { period: 7, still: 6.2 });
        v.readout(() => {
          if (!st) return '';
          const rank = `Test at the current pose: the allowed velocity fields $f_1,f_2$ and their bracket $[f_1,f_2]$ span a space of dimension **${st.rk3}** of the 3 available — ${st.rk3 === 3 ? 'the bracket leaves the plane of allowed velocities, so every pose is reachable (Chow)' : 'the span is closed under brackets, so the constraint integrates to a line (Frobenius)'}.`;
          const slip = `Largest sideways displacement of the contact point over the whole path: $${v.sci(st.maxSlip + 1e-17, 1)}$ — the coin never slides.`;
          if (!st.trt) {
            const sd = (-st.net[0] * Math.sin(st.start[2]) + st.net[1] * Math.cos(st.start[2])), fw = st.net[0] * Math.cos(st.start[2]) + st.net[1] * Math.sin(st.start[2]);
            const pred = st.cyc * st.s * st.a;
            return `${st.wheel ? `After ${st.cyc} cycles the coin is displaced **${v.fix(sd, 3)}** sideways (and ${v.fix(fw, 3)} forward), heading restored. One cycle shifts it by $s\\sin a$; the Lie-bracket prediction $n\\,s\\,a=${v.fix(pred, 3)}$ is accurate for small $a$.` : 'With the blade locked the wiggle is just rolling forth and back: net displacement zero.'}\n${rank} ${slip}`;
          }
          return `${st.wheel ? `Goal reached to $${v.sci(st.miss + 1e-17, 1)}$: three moves, no sideways slide.` : `Reached the point of the line nearest the goal; the goal is $${v.fix(st.miss, 2)}$ away and never reachable.`}\n${rank} ${slip}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Task space and workspace',
      statement: String.raw`The **task space** is the space in which the robot's task is described — for positioning a tool, $\R^2$ or $\R^3$; for positioning and orienting it, the pose space $SE(2)$ (dimension $3$) or $SE(3)$ (dimension $6$) — and it generally differs from the configuration space. The **workspace** is the set of task-space points the end-effector can reach: the **reachable workspace** is the set of positions reachable in some orientation, the **dexterous workspace** the set of positions reachable in every orientation. A planar 2R arm with link lengths $l_1,l_2$ reaches the annulus $|l_1-l_2|\le r\le l_1+l_2$, and its dexterous workspace is empty (the orientation is determined by the position, up to the elbow choice); adding a third link of length $l_3$ gives a 3R arm with a non-empty dexterous workspace, provided $l_3$ is small enough.`,
      idea: String.raw`Reachability of a position $p$ by the tool of a 3R arm with orientation $\phi$ means that the wrist centre $w=p-l_3(\cos\phi,\sin\phi)$ lies in the 2R annulus. As $\phi$ goes around the circle, $w$ sweeps the circle of radius $l_3$ about $p$, which lies completely inside the annulus exactly when $|p|+l_3\le l_1+l_2$ and $\bigl||p|-l_3\bigr|\ge|l_1-l_2|$. This is the dexterous set. When the task needs a pose (3 numbers) but the arm has only 2 joints, the image of C-space is a 2-dimensional surface in the 3-dimensional pose space, so most poses are not reachable at all; the dimension of the task space and of the C-space must be compared before anything else.`,
      caption: String.raw`Drag the tool; the sweep of random joint angles (grey dots) fills the workspace. The map shades each position by the fraction of tool orientations that can be achieved there, tested by closed-form inverse kinematics for 72 orientations at every pixel: green means all of them (dexterous). Change the number of links and the link lengths; the small fan at the tool shows which orientations are possible at that spot.`,
      deps: ['robot-1.3'],
      refs: ['Lynch–Park §2.5'],
      tags: ['workspace', 'dexterity'],
      viz(v) {
        const M = v.M;
        const kind = v.select('arm', [{ value: '2', label: '2R' }, { value: '3', label: '3R' }], '3');
        const s1 = v.slider('$l_1$', 0.6, 2, 1.4, { step: 0.01 });
        const s2 = v.slider('$l_2$', 0.6, 2, 1.0, { step: 0.01 });
        const s3 = v.slider('$l_3$', 0.1, 1.6, 0.5, { step: 0.01 });
        const sp = v.slider('tool angle $\\phi$', -3.14, 3.14, 0.6, { step: 0.01 });
        const A = v.stage({ x: [-4.2, 4.2], y: [-3.7, 3.7], equal: true, axes: false, height: 400, full: true, title: 'workspace' });
        const rng = v.rng(7);
        const SAMP = Array.from({ length: 3500 }, () => [rng.uniform(-Math.PI, Math.PI), rng.uniform(-Math.PI, Math.PI), rng.uniform(-Math.PI, Math.PI)]);
        const tip = A.handle(2.0, 0.9, { color: 'accent', r: 8 });
        const NO = 72;
        const fracAt = (px, py, l, three) => {
          if (!three) return ik2(l[0], l[1], px, py) ? 0 : -1;       // 2R: orientation is determined, a set of measure zero
          let c = 0; for (let k = 0; k < NO; k++) { const a = (TAU * k) / NO; if (ik2(l[0], l[1], px - l[2] * Math.cos(a), py - l[2] * Math.sin(a))) c++; }
          return c / NO;
        };
        let st = null;
        v.render(() => {
          const three = kind.value === '3', l = [s1.value, s2.value, three ? s3.value : 0];
          s3.el.hidden = sp.el.hidden = !three;
          const Rout = l[0] + l[1] + l[2], rin = Math.max(0, 2 * Math.max(...l.slice(0, three ? 3 : 2)) - (l[0] + l[1] + l[2]));
          const key = l.join(',') + kind.value;
          A.raster((x, y) => {
            const f = fracAt(x, y, l, three);
            if (f < 0) return null;
            if (!three) return v.ramp(0.22, 'accent');
            if (f > 0.999) return v.ramp(0.5, 'green');
            return f > 0 ? v.ramp(0.12 + 0.3 * f, 'accent') : null;
          }, { key, res: 3, id: 'ws' });
          A.circle(0, 0, Rout, { color: 'accent', width: 1.6 }); if (rin > 1e-6) A.circle(0, 0, rin, { color: 'accent', width: 1.6 });
          A.dots(SAMP.slice(0, 1800).map((s) => { const c = fkChain(l.slice(0, three ? 3 : 2), s.slice(0, three ? 3 : 2)).pts; return c[c.length - 1]; }), { r: 1, color: 'muted', alpha: 0.35 });
          // arm at the tool handle
          let px = tip.x, py = tip.y; const rr = Math.hypot(px, py);
          let arms = [];
          if (three) {
            const wx = px - l[2] * Math.cos(sp.value), wy = py - l[2] * Math.sin(sp.value), sols = ik2(l[0], l[1], wx, wy);
            if (sols) arms = sols.map((q) => [q[0], q[1], wrap(sp.value - q[0] - q[1])]);
          } else { const sols = ik2(l[0], l[1], px, py); if (sols) arms = sols.map((q) => [q[0], q[1]]); }
          const links = three ? l : l.slice(0, 2);
          arms.forEach((q, i) => A.path(fkChain(links, q).pts, { color: i ? 'orange' : 'accent', width: i ? 5 : 7, alpha: i ? 0.45 : 0.9 }));
          if (!arms.length) { const k = (rr > 0 ? 1 : 0); A.corner(three ? 'this pose is out of reach' : 'out of reach', 'tl', { color: 'red', weight: 600 }); void k; }
          A.dot(0, 0, { r: 6, color: 'ink' });
          // orientation fan at the tool
          let nOk = 0;
          if (three) for (let k = 0; k < 120; k++) { const a = (TAU * k) / 120, ok = ik2(l[0], l[1], px - l[2] * Math.cos(a), py - l[2] * Math.sin(a)); if (ok) nOk++; A.line(px + 0.28 * Math.cos(a), py + 0.28 * Math.sin(a), px + 0.42 * Math.cos(a), py + 0.42 * Math.sin(a), { color: ok ? 'green' : 'red', width: 2, alpha: ok ? 0.9 : 0.5 }); }
          // areas: grid count vs radial formula
          const NA = 150, lo = -Rout, h = (2 * Rout) / NA; let reach = 0, dex = 0;
          for (let j = 0; j < NA; j++) for (let i = 0; i < NA; i++) {
            const x = lo + (i + 0.5) * h, y = lo + (j + 0.5) * h, f = fracAt(x, y, l, three);
            if (f >= 0 && (three ? f > 0 : true)) reach++; if (three && f > 0.999) dex++;
          }
          const aR = reach * h * h, aD = dex * h * h;
          const fR = Math.PI * (Rout * Rout - rin * rin);
          let fD = 0; if (three) { const NR = 4000, d = Math.abs(l[0] - l[1]); for (let k = 0; k < NR; k++) { const r = ((k + 0.5) / NR) * Rout; if (r + l[2] <= l[0] + l[1] + 1e-12 && Math.abs(r - l[2]) >= d - 1e-12) fD += TAU * r * (Rout / NR); } }
          st = { three, Rout, rin, aR, aD, fR, fD, nOk, ok: arms.length > 0 };
        });
        v.legend([['green', 'dexterous: every orientation'], ['accent', 'reachable'], ['muted', 'random joint sweep', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const dim = st.three ? 'pose space $SE(2)$ has dimension $3$ and the 3R arm has three joints: C-space and task space match' : 'pose space $SE(2)$ has dimension $3$ but the 2R arm has only two joints, so its poses form a surface in a 3-space — a pose is generically unreachable (position alone: dimension $2=2$)';
          return `Reachable workspace: annulus $${v.fix(st.rin, 2)}\\le r\\le ${v.fix(st.Rout, 2)}$, area ${v.fix(st.aR, 2)} on the grid vs $\\pi(R^2-r^2)=${v.fix(st.fR, 2)}$.${st.three ? ` Dexterous workspace area: ${v.fix(st.aD, 2)} on the grid vs ${v.fix(st.fD, 2)} from the radial condition${st.aD < 1e-6 ? ' — empty: the third link is too long' : ''}. At the tool, ${st.nOk} of 120 orientations are reachable.` : ' Dexterous workspace: empty.'}\n${dim}.`;
        });
      },
    },
  ],
};
