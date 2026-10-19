// Robotics — Chapter 3 (part b: 3.5, 3.6): closed chains
import {
  TAU, DEG, clamp, vadd, vsub, vsc, norm3, I3, mm, mt, mv, mcol, rotFromVec, logRot, rotAngle, fx,
} from './ch03.shared.js';

const cn = (x, d = 2) => fx(x, d).replace('-', '−');
const JC = ['accent', 'orange', 'purple', 'teal', 'pink', 'gold'];

// ── Stewart–Gough platform geometry (a slightly irregular hexagon pair, so that it is not a special case) ──
const BA = [15, 105, 135, 225, 255, 345], PA = [50, 70, 170, 190, 290, 310];
const BR = [1.0, 1.05, 0.97, 1.03, 0.98, 1.02], PR = [1.0, 0.96, 1.04, 0.98, 1.03, 0.99];
const BASE = BA.map((a, i) => [1.6 * BR[i] * Math.cos(a * DEG), 1.6 * BR[i] * Math.sin(a * DEG), 0]);
const PLAT = PA.map((a, i) => [0.9 * PR[i] * Math.cos(a * DEG), 0.9 * PR[i] * Math.sin(a * DEG), 0]);
const legVec = (R, t, i) => vsub(vadd(mv(R, PLAT[i]), t), BASE[i]);
const legLens = (R, t) => PLAT.map((_, i) => norm3(legVec(R, t, i)));
const Rzyx = (r, p, y) => { const c = Math.cos, s = Math.sin; const Rz = [[c(y), -s(y), 0], [s(y), c(y), 0], [0, 0, 1]], Ry = [[c(p), 0, s(p)], [0, 1, 0], [-s(p), 0, c(p)]], Rx = [[1, 0, 0], [0, c(r), -s(r)], [0, s(r), c(r)]]; return mm(Rz, mm(Ry, Rx)); };

/** Damped Newton on the six quadratic equations |t + R p_i − b_i|² = ℓ_i² in the pose x = (t, rotation vector). */
function newtonPose(M, lens, x0) {
  let x = x0.slice();
  const res = (x) => { const R = rotFromVec(x.slice(3)), t = x.slice(0, 3); return PLAT.map((_, i) => { const d = legVec(R, t, i); return d[0] * d[0] + d[1] * d[1] + d[2] * d[2] - lens[i] * lens[i]; }); };
  for (let it = 0; it < 60; it++) {
    const f = res(x), e = Math.max(...f.map(Math.abs));
    if (e < 1e-11) return x;
    if (!(e < 1e6)) return null;
    const J = f.map(() => new Array(6).fill(0));
    for (let k = 0; k < 6; k++) { const xh = x.slice(); xh[k] += 1e-6; const fh = res(xh); for (let i = 0; i < 6; i++) J[i][k] = (fh[i] - f[i]) / 1e-6; }
    let dx; try { dx = M.solve(J, f.map((y) => -y)); } catch (err) { return null; }
    if (!dx || dx.some((z) => !Number.isFinite(z))) return null;
    const nd = Math.hypot(...dx), sc = nd > 0.5 ? 0.5 / nd : 1;
    x = x.map((z, k) => z + sc * dx[k]);
    const r = x.slice(3), th = norm3(r);
    if (th > Math.PI) { const k2 = 1 - TAU / th; x[3] *= k2; x[4] *= k2; x[5] *= k2; }
  }
  return null;
}
/** All distinct real poses found by Newton's method from many seeded random starts (plus the supplied warm starts). */
function allPoses(M, rng, lens, warm) {
  const out = [];
  const add = (x) => {
    if (!x) return;
    const t = x.slice(0, 3);
    if (Math.abs(t[0]) > 4 || Math.abs(t[1]) > 4 || t[2] < -4 || t[2] > 5) return;
    const R = rotFromVec(x.slice(3));
    for (const o of out) if (norm3(vsub(o.t, t)) < 1e-5 && rotAngle(mm(mt(o.R), R)) < 1e-5) return;
    out.push({ t, R, x });
  };
  for (const w of warm) add(newtonPose(M, lens, w));
  for (let s = 0; s < 220; s++) {
    const ax = [rng.normal(), rng.normal(), rng.normal()], na = norm3(ax) || 1, ang = Math.PI * Math.sqrt(rng());
    add(newtonPose(M, lens, [rng.uniform(-1.6, 1.6), rng.uniform(-1.6, 1.6), rng.uniform(-2.5, 3.5), ...ax.map((c) => (c / na) * ang)]));
  }
  return out;
}

export default {
  collection: 'robot',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Model',
      name: 'Closed chains and the Stewart–Gough platform',
      statement: String.raw`A **closed chain** is a mechanism whose links form at least one loop. The **Stewart–Gough platform** joins a rigid platform to a fixed base by six extensible legs, each with a spherical or universal joint at both ends. Let $b_i$ be the leg anchors on the base, $p_i$ the anchors on the platform in the platform frame, and let the platform have pose $(R,t)\in SE(3)$. Then:

(a) **Mobility.** Grübler's formula (1.2) with $N=14$ links (base, platform and $12$ half-legs) and $J=18$ joints ($6$ prismatic, $6$ universal with $2$ freedoms, $6$ spherical with $3$) gives $6(14-1-18)+(6+12+18)=6$ degrees of freedom.

(b) **Inverse kinematics is explicit:** for a given pose the leg lengths are $\ell_i=\lVert t+Rp_i-b_i\rVert$, $i=1,\dots,6$, one square root each.

(c) **Forward kinematics is hard:** given the six lengths, finding $(R,t)$ means solving the six quadratic equations $\lVert t+Rp_i-b_i\rVert^2=\ell_i^2$. In general there is more than one solution; for a platform of general geometry there are at most $40$ solutions counted over the complex numbers, and a geometry with $40$ real ones is known.`,
      idea: String.raw`The legs constrain the platform only through their lengths, and each length is the distance between two points that are given by the pose, so (b) is a distance formula. Reading the same formula backwards turns each leg into a sphere about its base anchor on which the platform anchor $Rp_i+t$ must lie; six anchors on six spheres, with the rigidity of the platform tying them together, is a polynomial system of degree $2$ in $6$ unknowns, which in general has several solutions rather than one, since the platform can sit in several ways on the same six legs (for instance mirrored through the base plane). Raghavan (1993) showed that the number of complex solutions of the generic system is $40$ and Dietmaier (1998) built an example with $40$ real ones. The number of solutions is why industrial controllers use the easy direction and track the pose incrementally with Newton's method.`,
      caption: String.raw`**Pose → lengths:** drag the gold handle to move the platform and set roll, pitch and yaw; the six leg lengths follow at once from the distance formula. **Lengths → pose:** the six legs get their own sliders (starting from the current pose), and a Newton solver started from 220 random guesses looks for all real platforms with those lengths. The solid platform is one solution; **next solution** cycles through them (the first is the one nearest the pose you started from); the other real solutions are drawn as orange ghosts. Change one length and watch solutions appear, disappear or swap.`,
      deps: ['robot-1.2', 'robot-2.6', 'num-2.13'],
      refs: ['Lynch–Park ch. 7'],
      credit: 'D. Stewart, 1965 (flight-simulator proposal); V. E. Gough (tyre-testing machine, 1950s; sources differ on the year)',
      scope: String.raw`Ideal rigid links, frictionless spherical or universal joints at the anchors, and no limits on leg stroke or joint angle. Solution counts are those of this particular (slightly irregular) hexagon geometry, found numerically as a lower bound; the bound $40$ is for general geometry over $\mathbb C$.`,
      tags: ['parallel robot', 'forward kinematics', 'Stewart–Gough'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stewart_platform' },
      viz(v) {
        const M = v.M;
        const mode = v.select('direction', [{ value: 'inv', label: 'pose → lengths' }, { value: 'fwd', label: 'lengths → pose' }], 'inv');
        const roll = v.slider('roll (°)', -25, 25, 8, { step: 1 }), pitch = v.slider('pitch (°)', -25, 25, -10, { step: 1 }), yaw = v.slider('yaw (°)', -30, 30, 12, { step: 1 });
        const ls = [0, 1, 2, 3, 4, 5].map((i) => v.slider(`leg ${i + 1} length`, 1.2, 3.4, 2, { step: 0.01 }));
        let solIdx = 0;
        const sol = v.button('next solution', () => { solIdx += 1; });
        const SC = v.stage({ x: [-3.2, 3.2], y: [-3.4, 3.4], equal: true, axes: false, height: 480, title: 'a Stewart–Gough platform' });
        const sc = v.scene3(SC, { yaw: -0.75, pitch: 0.38, axes: false, lim: 1.6, axis: 1.2, hint: false });
        const T = sc.handle([0.15, -0.1, 1.9], { color: 'gold', label: 't', lim: 1.6, snap: (p) => [clamp(p[0], -0.9, 0.9), clamp(p[1], -0.9, 0.9), clamp(p[2], 1.0, 2.8)] });
        const rng = v.rng(7);
        const poseNow = () => ({ R: Rzyx(roll.value * DEG, pitch.value * DEG, yaw.value * DEG), t: T.p });
        const setLensFromPose = () => { const { R, t } = poseNow(), L = legLens(R, t); ls.forEach((s, i) => s.set(L[i])); };
        setLensFromPose();
        let cache = { key: '', poses: [] }, prevMode = 'inv', st = null;
        v.render(() => {
          const fwd = mode.value === 'fwd';
          if (fwd && prevMode === 'inv') setLensFromPose();
          prevMode = mode.value;
          roll.el.hidden = pitch.el.hidden = yaw.el.hidden = fwd; ls.forEach((s) => { s.el.hidden = !fwd; }); sol.hidden = !fwd; T.visible = !fwd;
          SC.setView([-3.2, 3.2], fwd ? [-3.4, 3.4] : [-1.4, 2.6]);
          const ref = poseNow(), lensRef = legLens(ref.R, ref.t);
          let show = ref, ghosts = [], lens = lensRef, count = 0, resid = 0, shown = 1;
          if (fwd) {
            lens = ls.map((s) => s.value);
            const key = lens.map((x) => x.toFixed(4)).join(',');
            if (cache.key !== key) { cache = { key, poses: allPoses(M, rng, lens, [[...ref.t, ...logRot(ref.R)], ...(cache.poses.length ? cache.poses.map((p) => p.x) : [])]) }; }
            const P = cache.poses.slice().sort((a, b) => (norm3(vsub(a.t, ref.t)) + rotAngle(mm(mt(a.R), ref.R))) - (norm3(vsub(b.t, ref.t)) + rotAngle(mm(mt(b.R), ref.R))));
            count = P.length;
            const k = count ? ((solIdx % count) + count) % count : 0; shown = k + 1;
            if (count) { show = P[k]; ghosts = P.filter((_, j) => j !== k); } else show = null;
            if (show) resid = Math.max(...legLens(show.R, show.t).map((l, i) => Math.abs(l - lens[i])));
          }
          sc.begin();
          // base and platform
          sc.poly(BASE, { fill: 'muted', fillAlpha: 0.14, color: 'muted', width: 1.6 });
          BASE.forEach((b) => sc.dot(b, { color: 'muted', r: 4 }));
          const drawPlat = (pose, ghost) => {
            const W = PLAT.map((p) => vadd(mv(pose.R, p), pose.t));
            sc.poly(W, ghost ? { fill: 'orange', fillAlpha: 0.05, color: 'orange', width: 1.6, alpha: 0.7 } : { fill: 'accent', fillAlpha: 0.24, color: 'accent', width: 2.4 });
            W.forEach((w, i) => {
              if (ghost) return;
              const mid = vadd(BASE[i], vsc(vsub(w, BASE[i]), 0.5));
              sc.line(BASE[i], mid, { color: 'muted', width: 6 }); sc.line(mid, w, { color: JC[i], width: 3.4 });
              sc.dot(w, { color: JC[i], r: 4.5 });
            });
          };
          ghosts.forEach((g) => drawPlat(g, true));
          if (show) drawPlat(show, false);
          sc.flush();
          st = { fwd, lens, count, resid, show, lensRef, shown };
        });
        v.readout(() => {
          if (!st) return '';
          const Ls = st.lens.map((x) => fx(x, 3)).join(', ');
          const grub = '$6(14-1-18)+(6+12+18)=6$';
          if (!st.fwd) return `Leg lengths $\\ell=(${Ls})$ come directly from $\\ell_i=\\|t+Rp_i-b_i\\|$ — six square roots, no iteration. Grübler count ${grub}: six freedoms, six actuators.\nSwitch to **lengths → pose** to run the problem backwards.`;
          return st.count
            ? `Lengths $\\ell=(${Ls})$. Newton's method from 220 seeded starts found **${st.count}** distinct real platform pose${st.count === 1 ? '' : 's'}${st.count > 1 ? ' (the same six legs fit the platform in several ways)' : ''}; the one shown (#${st.shown}) reproduces the lengths to $${v.sci(st.resid + 1e-17, 1)}$. This is a lower bound for the real count; the general complex count is at most $40$.`
            : `Lengths $\\ell=(${Ls})$: no real platform pose found. The legs cannot be assembled (a leg is too short or too long for the others).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Singularities of closed chains',
      statement: String.raw`Let a closed-chain mechanism have actuated joint variables $q$ and an output (platform or end-effector) position $x$, tied by loop-closure equations $f(q,x)=0$. Differentiating gives $A\,\dot x+B\,\dot q=0$ with $A=\partial f/\partial x$ and $B=\partial f/\partial q$. There are two basic kinds of singularity:

(1) **$B$ is rank-deficient** (an *actuator* or *inverse-kinematic* singularity). Some actuator velocity $\dot q\ne0$ gives $\dot x=0$, and the set of achievable output velocities $\dot x=-A^{-1}B\dot q$ loses a dimension: the output cannot be driven in some direction.

(2) **$A$ is rank-deficient** (a *platform* or *direct-kinematic* singularity). Some $\dot x\ne0$ satisfies $A\dot x=0$: with all actuators locked ($\dot q=0$) the output can still move to first order, so the mechanism gains an uncontrolled freedom, and the velocity ratios $\dot x/\dot q$ become unbounded.

For the planar five-bar mechanism drawn here (two actuated base joints, four moving links, output at the common distal joint $P$), kind (1) occurs when a proximal link lies along its own distal link (a leg fully stretched or folded), and kind (2) when the two distal links lie on one line.`,
      idea: String.raw`Here $f=(\|P-E_1\|^2-\ell_2^2,\ \|P-E_2\|^2-\ell_2^2)$ with $E_i$ the elbows. Then $A$ has rows $2(P-E_i)^{\mathsf T}$, which are parallel exactly when the distal links are collinear, and $B=\mathrm{diag}(b_1,b_2)$ with $b_i=-2(P-E_i)\cdot \dot E_i/\dot\theta_i$, which vanishes exactly when the distal link is perpendicular to the elbow's velocity, i.e. along the proximal link. Near kind (1) the tool-velocity ellipse $\{-A^{-1}B\dot q:\|\dot q\|=1\}$ flattens to a segment; near kind (2) it blows up, because $A^{-1}$ does. At kind (2) the implicit function theorem no longer guarantees smooth local determination of $x$ from $q$; at kind (1) it no longer guarantees smooth local determination of $q$ from $x$. A singular Jacobian alone does not rule out a unique nonlinear solution.`,
      caption: String.raw`Drag the gold output point $P$ of the five-bar (the two **flip** switches move an elbow to its other branch). The map behind the mechanism shades in red how close $P$ is to the chosen singularity (kind 1: a leg stretched or folded; kind 2: distal links collinear). The right panel shows the ellipse of output velocities for unit-speed actuators: it flattens near kind 1 and runs off the panel near kind 2. When the output approaches kind 2, the red arrow at $P$ marks the direction in which $P$ could creep with the actuators locked; near kind 1 the purple arrow marks the direction the actuators cannot push. Try $P$ at $(0,0.76)$.`,
      deps: ['robot-3.5', 'robot-1.2', 'pma-9.28'],
      refs: ['Lynch–Park ch. 7'],
      credit: 'C. Gosselin & J. Angeles, 1990 (singularity analysis of closed-loop chains)',
      scope: String.raw`First-order (velocity) analysis of this planar five-bar with link lengths $\ell_1=1$, $\ell_2=1.25$ and bases $1.2$ apart; other mechanisms have the same two Jacobians but different geometric conditions.`,
      tags: ['singularity', 'five-bar', 'parallel robot'],
      viz(v) {
        const M = v.M;
        const A0 = [-0.6, 0], B0 = [0.6, 0], l1 = 1.0, l2 = 1.25;
        const show = v.select('shade', [{ value: '1', label: 'kind 1: leg stretched or folded' }, { value: '2', label: 'kind 2: distal links collinear' }], '2');
        const fa = v.toggle('flip elbow A', false), fb = v.toggle('flip elbow B', false);
        const S = v.stage({ x: [-2.7, 2.7], y: [-2.5, 2.6], equal: true, axes: false, height: 450, title: 'a planar five-bar mechanism' });
        const E = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 450, title: 'output velocity for unit actuator speed', xlabel: 'ẋ', ylabel: 'ẏ', minWidth: 280 });
        const leg = (Ab, P, s) => {
          const dx = P[0] - Ab[0], dy = P[1] - Ab[1], r = Math.hypot(dx, dy);
          if (r > l1 + l2 - 1e-9 || r < Math.abs(l1 - l2) + 1e-9) return null;
          const th = Math.atan2(dy, dx) + s * Math.acos(clamp((l1 * l1 + r * r - l2 * l2) / (2 * l1 * r), -1, 1));
          return { th, E: [Ab[0] + l1 * Math.cos(th), Ab[1] + l1 * Math.sin(th)] };
        };
        const sg = () => [fa.value ? -1 : 1, fb.value ? 1 : -1];
        const idx = (P, s) => {
          const a = leg(A0, P, s[0]), b = leg(B0, P, s[1]);
          if (!a || !b) return null;
          const da = vsub(P, a.E), db = vsub(P, b.E), pa = vsub(a.E, A0), pb = vsub(b.E, B0);
          const i1 = Math.min(Math.abs(da[0] * pa[1] - da[1] * pa[0]), Math.abs(db[0] * pb[1] - db[1] * pb[0])) / (l1 * l2);
          const i2 = Math.abs(da[0] * db[1] - da[1] * db[0]) / (l2 * l2);
          return { a, b, da, db, i1, i2 };
        };
        let Pc = [0.15, 1.5];
        const hP = S.handle(Pc[0], Pc[1], { color: 'gold', r: 8, label: 'P' });
        hP.constrain = (x, y) => { if (idx([x, y], sg())) Pc = [x, y]; return Pc; };
        const RED = v.rgb('red'), ACC = v.rgb('green');
        let st = null;
        v.render(() => {
          const s = sg(), kind = show.value;
          hP.set(Pc[0], Pc[1]);
          let r = idx(Pc, s);
          if (!r) { Pc = [0.15, 1.5]; hP.set(...Pc); r = idx(Pc, s) || idx([0.15, 1.5], [1, -1]); }
          S.raster((x, y) => { const q = idx([x, y], s); if (!q) return null; const t = Math.pow(clamp(1 - (kind === '1' ? q.i1 : q.i2) / 0.55, 0, 1), 1.6); return [ACC[0] + (RED[0] - ACC[0]) * t, ACC[1] + (RED[1] - ACC[1]) * t, ACC[2] + (RED[2] - ACC[2]) * t, 30 + 205 * t]; }, { res: 4, key: `${kind}${s.join()}${RED.join()}${ACC.join()}`, id: 'sing' });
          // links
          S.segment(A0, r.a.E, { color: 'accent', width: 7, alpha: 0.9 }); S.segment(r.a.E, Pc, { color: 'accent', width: 4, alpha: 0.6 });
          S.segment(B0, r.b.E, { color: 'orange', width: 7, alpha: 0.9 }); S.segment(r.b.E, Pc, { color: 'orange', width: 4, alpha: 0.6 });
          [A0, B0].forEach((p, i) => { S.circle(p[0], p[1], 0.09, { fill: 'ink', fillAlpha: 1, color: 'ink' }); S.tex(i ? 'B' : 'A', p[0], p[1] - 0.28, { color: 'muted', size: 13 }); });
          [r.a.E, r.b.E].forEach((p) => S.circle(p[0], p[1], 0.065, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          // Jacobians
          const Am = [[2 * r.da[0], 2 * r.da[1]], [2 * r.db[0], 2 * r.db[1]]];
          const tA = [-l1 * Math.sin(r.a.th), l1 * Math.cos(r.a.th)], tB = [-l1 * Math.sin(r.b.th), l1 * Math.cos(r.b.th)];
          const Bm = [[-2 * (r.da[0] * tA[0] + r.da[1] * tA[1]), 0], [0, -2 * (r.db[0] * tB[0] + r.db[1] * tB[1])]];
          const det = Am[0][0] * Am[1][1] - Am[0][1] * Am[1][0];
          let J = null, sv = null, bigJ = true;
          if (Math.abs(det) > 1e-9) {
            const inv = [[Am[1][1] / det, -Am[0][1] / det], [-Am[1][0] / det, Am[0][0] / det]];
            J = [[-(inv[0][0] * Bm[0][0]), -(inv[0][1] * Bm[1][1])], [-(inv[1][0] * Bm[0][0]), -(inv[1][1] * Bm[1][1])]];
            sv = M.svd(J); bigJ = sv.S[0] > 60;
          }
          // free direction with locked actuators (smallest singular vector of A) and blocked direction
          const sA = M.svd(Am), vfree = [sA.V[0][1], sA.V[1][1]];
          if (r.i2 < 0.4) { const L = 0.55 * (1 - r.i2 / 0.4) + 0.12; S.arrow(Pc[0] - vfree[0] * L, Pc[1] - vfree[1] * L, Pc[0] + vfree[0] * L, Pc[1] + vfree[1] * L, { color: 'red', width: 3.2, head: 9, both: true }); }
          let ratio = null;
          if (J && sv) { ratio = sv.S[1] / sv.S[0]; if (ratio < 0.4 && !bigJ) { const u = [sv.U[0][1], sv.U[1][1]], L = 0.55 * (1 - ratio / 0.4) + 0.12; S.arrow(Pc[0] - u[0] * L, Pc[1] - u[1] * L, Pc[0] + u[0] * L, Pc[1] + u[1] * L, { color: 'purple', width: 3.2, head: 9, both: true }); } }
          S.corner(kind === '1' ? 'red: a leg nearly stretched or folded' : 'red: distal links nearly collinear', 'tl', { color: 'red', plate: true });
          // velocity ellipse panel
          E.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4], fill: false });
          if (J && !bigJ) {
            E.clip(() => {
              const pts = []; for (let k = 0; k <= 120; k++) { const t = (TAU * k) / 120; pts.push([J[0][0] * Math.cos(t) + J[0][1] * Math.sin(t), J[1][0] * Math.cos(t) + J[1][1] * Math.sin(t)]); }
              E.poly(pts, { fill: 'green', fillAlpha: 0.16, color: 'green', width: 2.4 });
              E.arrow(0, 0, J[0][0], J[1][0], { color: 'accent', width: 2.2, head: 8 }); E.arrow(0, 0, J[0][1], J[1][1], { color: 'orange', width: 2.2, head: 8 });
            });
            E.tex('\\dot\\theta_A=1', J[0][0], J[1][0], { color: 'accent', size: 11, dy: -9 }); E.tex('\\dot\\theta_B=1', J[0][1], J[1][1], { color: 'orange', size: 11, dy: -9 });
          } else E.corner('unbounded: the output is not controlled', 'tl', { color: 'red', plate: true });
          st = { r, sv: sv && !bigJ ? sv.S : null, det, bigJ, i1: r.i1, i2: r.i2 };
        });
        v.readout(() => {
          if (!st) return '';
          const fmtSV = st.sv ? `singular values of $-A^{-1}B$: $\\sigma_{\\max}=${fx(st.sv[0], 2)}$, $\\sigma_{\\min}=${fx(st.sv[1], 2)}$` : `$\\det A=${fx(st.det, 3)}$: the velocity map $-A^{-1}B$ is unbounded`;
          return `Kind 1 index $\\min_i|\\sin\\angle(\\text{proximal}_i,\\text{distal}_i)|=${fx(st.i1, 3)}$; kind 2 index $|\\sin\\angle(\\text{distal}_A,\\text{distal}_B)|=${fx(st.i2, 3)}$.\n${fmtSV}. ${st.i2 < 0.05 ? '**Kind 2:** $A$ is nearly singular — with the actuators locked $P$ can move almost freely along the red arrow.' : ''}${st.i1 < 0.05 ? ' **Kind 1:** $B$ is nearly singular — the actuators can no longer push $P$ along the purple direction.' : ''}`;
        });
      },
    },
  ],
};
