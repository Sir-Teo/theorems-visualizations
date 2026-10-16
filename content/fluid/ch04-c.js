// Fluid Dynamics — Chapter 4: Potential flow (items 4.12–4.17)
import { G0, clamp, TAU, cadd, cpolar, cmul, cdiv, cexp, cabs, carg, elemVel, elemW1, streamlines, drawLines, theodorsen } from './ch04.shared.js';

const deg = (a) => (a * Math.PI) / 180;

/** Velocity at (px, py) of point vortices L = [{x, y, k}] (counter-clockwise k), skipping `skip`. */
function vtxVel(L, px, py, skip = -1) {
  let u = 0, w = 0;
  for (let j = 0; j < L.length; j++) {
    if (j === skip) continue;
    const dx = px - L[j].x, dy = py - L[j].y, r2 = dx * dx + dy * dy + 1e-14, k = L[j].k / (TAU * r2);
    u -= k * dy; w += k * dx;
  }
  return [u, w];
}
const WCH = 2;
/** The real vortex (index 0) followed by its images, for a wall, a channel 0 < y < 2 or a right-angle corner x, y > 0. */
function imageSet(mode, x, y, G, N = 14) {
  const L = [{ x, y, k: G }];
  if (mode === 'wall') L.push({ x, y: -y, k: -G });
  else if (mode === 'corner') L.push({ x: -x, y, k: -G }, { x, y: -y, k: -G }, { x: -x, y: -y, k: G });
  else for (let n = -N; n <= N; n++) { if (n !== 0) L.push({ x, y: y + 2 * n * WCH, k: G }); L.push({ x, y: -y + 2 * n * WCH, k: -G }); }
  return L;
}

export default {
  collection: 'fluid',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Method',
      name: 'Method of images',
      statement: String.raw`To satisfy the no-penetration condition $\partial\phi/\partial n=0$ at a fixed plane wall, add to the singularities in the fluid their mirror images in the plane, a source for a source, and a **vortex of opposite sign** for a vortex. The sum is a flow in the whole space that is symmetric about the wall, so its velocity is tangent to the wall; its restriction to the fluid side has the original singularities only and satisfies the boundary condition. A vortex of circulation $\Gamma$ at distance $d$ from a wall therefore drifts parallel to the wall at speed $\Gamma/4\pi d$ (induced by its image at distance $2d$). Between two parallel walls a distance $W$ apart there is an infinite lattice of images, and the drift speed is $\dfrac{\Gamma}{4W}\cot\dfrac{\pi y}{W}$; in a right-angle corner three images are needed and the vortex moves along $x^{-2}+y^{-2}=\text{const}$.`,
      idea: String.raw`Laplace's equation is linear (4.2), so the solutions for the original singularities and the images add, and uniqueness of the Neumann problem (4.2) shows the sum, restricted to the fluid, is *the* solution. The reflection of a source in a plane is a source (the normal velocities of the pair cancel at the wall, the tangential ones add), but the reflection of a vortex must be reversed in sign, because the normal velocity induced at the wall by the vortex is odd about the vortex's own height. Walls at an angle $\pi/m$ need $2m-1$ images.`,
      credit: 'method of electrical images: William Thomson (Kelvin), 1845',
      verify: true,
      caption: String.raw`Drag the gold handle to place a point vortex near a wall, between two walls or in a corner, choose its circulation, and watch it move under the velocity induced by its images (open dots, opposite sign; a few of the infinite lattice are drawn for the channel). The streamlines are traced from the real vortex plus all images and are drawn only in the fluid; the walls are streamlines (the readout gives the largest normal velocity found along them, which is rounding error). The measured drift is compared with the closed formulas: $\Gamma/4\pi d$ at a wall, $(\Gamma/4W)\cot(\pi y/W)$ in the channel (the vortex moves one way near the lower wall, the other way near the upper), and in the corner the path conserves $x^{-2}+y^{-2}$.`,
      deps: ['fluid-4.5'],
      refs: ['Kundu §7.3'],
      tags: ['images', 'vortex', 'wall'],
      scope: String.raw`Ideal, incompressible, irrotational flow with fixed straight walls (planes or wedges of angle $\pi/m$). The image construction for a wall of any other shape requires a conformal map (4.15) or the circle theorem (4.13).`,
      viz(v) {
        const mode = v.select('boundary', [{ value: 'wall', label: 'one wall' }, { value: 'channel', label: 'two walls' }, { value: 'corner', label: 'corner' }], 'wall', { onChange: () => { place(); S.reset(); } });
        const gs = v.slider('circulation $\\Gamma$', -10, 10, 6, { step: 0.5, onChange: () => S.reset() });
        v.button('Release again', () => S.reset());
        const s = v.stage({ x: [-4.6, 4.6], y: [-1.5, 3.3], equal: true, axes: false, height: 400, weight: 1, title: 'a vortex and its images' });
        const H = s.handle(-2.5, 0.8, { color: 'gold', r: 8, label: 'start', labelPos: 'nw', constrain: (x, y) => { const m = mode ? mode.value : 'wall'; return m === 'wall' ? [x, clamp(y, 0.2, 3)] : m === 'channel' ? [x, clamp(y, 0.2, WCH - 0.2)] : [clamp(x, 0.2, 4.4), clamp(y, 0.2, 3)]; } });
        H.onDrag = () => S.reset();
        function place() { const m = mode.value; if (m === 'wall') H.set(-2.5, 0.8); else if (m === 'channel') H.set(-2.5, 0.6); else H.set(0.9, 2.2); }
        const inside = (x, y) => (mode.value === 'wall' ? y > 0 : mode.value === 'channel' ? y > 0 && y < WCH : x > 0 && y > 0);
        const speedAt = (st) => { const L = imageSet(mode.value, st.x, st.y, gs.value); return vtxVel(L, st.x, st.y, 0); };
        const S = v.sim(() => ({ x: H.x, y: H.y, t: 0, trail: [[H.x, H.y]], k: 0, c0: 1 / (H.x * H.x) + 1 / (H.y * H.y) }), (st, dt) => {
          const f = (x, y) => vtxVel(imageSet(mode.value, x, y, gs.value, 10), x, y, 0);
          if (Math.abs(st.x) > 6 || st.y > 7 || st.y < 0.03) return;
          const k1 = f(st.x, st.y), k2 = f(st.x + dt / 2 * k1[0], st.y + dt / 2 * k1[1]), k3 = f(st.x + dt / 2 * k2[0], st.y + dt / 2 * k2[1]), k4 = f(st.x + dt * k3[0], st.y + dt * k3[1]);
          st.x += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); st.y += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); st.t += dt; st.k++;
          if (st.k % 5 === 0) st.trail.push([st.x, st.y]);
        }, { dt: 0.02 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), m = mode.value, L = imageSet(m, st.x, st.y, gs.value);
          const Ls = imageSet(m, st.x, st.y, gs.value, 8);
          const lines = streamlines((x, y) => (inside(x, y) ? vtxVel(Ls, x, y) : null), [-4.6, 4.6, m === 'channel' ? 0 : 0, m === 'channel' ? WCH : 3.3], { sep: 0.2, step: 0.04, seeds: [[st.x + 0.9, st.y]] });
          // walls
          const hat = { fill: 'muted', fillAlpha: 0.3, hatch: true, color: 'ink', width: 2.4 };
          if (m === 'wall') s.rect(-4.6, -1.5, 4.6, 0, hat);
          else if (m === 'channel') { s.rect(-4.6, -1.5, 4.6, 0, hat); s.rect(-4.6, WCH, 4.6, 3.3, hat); }
          else { s.rect(-4.6, -1.5, 4.6, 0, hat); s.rect(-4.6, 0, 0, 3.3, hat); }
          drawLines(s, lines, { color: 'accent', width: 1.1, alpha: 0.7, arrows: false });
          s.path(st.trail, { color: 'gold', width: 2.2 });
          for (let j = 1; j < L.length; j++) { const e = L[j]; if (e.y > -1.5 && e.y < 3.3 && Math.abs(e.x) < 4.6) s.dot(e.x, e.y, { r: 6, hollow: true, color: e.k > 0 ? 'purple' : 'orange' }); }
          s.dot(st.x, st.y, { r: 7, color: gs.value > 0 ? 'purple' : 'orange' });
          // wall check
          let vn = 0;
          for (let i = -20; i <= 20; i++) {
            const x = (i * 0.2) + 0.013;
            if (m === 'wall' || m === 'channel') { vn = Math.max(vn, Math.abs(vtxVel(L, x, 0)[1])); if (m === 'channel') vn = Math.max(vn, Math.abs(vtxVel(imageSet(m, st.x, st.y, gs.value, 60), x, WCH)[1])); }
            else { vn = Math.max(vn, Math.abs(vtxVel(L, x > 0 ? x : -x, 0)[1])); vn = Math.max(vn, Math.abs(vtxVel(L, 0, Math.abs(x))[0])); }
          }
          const sp = speedAt(st);
          let ex = null;
          if (m === 'wall') ex = gs.value / (4 * Math.PI * st.y);
          else if (m === 'channel') ex = (gs.value / (4 * WCH)) / Math.tan((Math.PI * st.y) / WCH);
          info = { sp, vn, ex, inv: 1 / (st.x * st.x) + 1 / (st.y * st.y), c0: st.c0, x: st.x, y: st.y };
        }, { period: 12, still: 6 });
        v.readout(() => `vortex at $(${v.fix(info.x, 2)},\\,${v.fix(info.y, 2)})$, velocity from the images $(${v.fix(info.sp[0], 4)},\\,${v.fix(info.sp[1], 4)})$${info.ex !== null ? `; closed formula for the drift: $${v.fix(info.ex, 4)}$` : `; $x^{-2}+y^{-2}=${v.fix(info.inv, 4)}$ (started at $${v.fix(info.c0, 4)}$): conserved`}\nlargest normal velocity found on the walls: $${v.sci(info.vn + 1e-18, 1)}$ — the images cancel it`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Milne-Thomson circle theorem',
      statement: String.raw`Let $f(z)$ be the complex potential of a plane irrotational flow with no singularities in $|z|\le a$ (all sources, vortices and doublets lie outside the circle, and the flow may include a uniform stream at infinity). Then the potential
$$w(z)=f(z)+\overline{f\!\Big(\frac{a^2}{\bar z}\Big)}$$
is the flow that has the same singularities outside the circle and in addition has $|z|=a$ as a streamline: it describes the flow in the presence of the fixed cylinder $|z|\le a$. The second term gives the images: a source $m$ at $z_0$ has as image a source $m$ at $a^2/\bar z_0$ and a sink $-m$ at the centre, a vortex $\Gamma$ at $z_0$ has an image $-\Gamma$ at $a^2/\bar z_0$ and a vortex $+\Gamma$ at the centre, and a uniform stream $Ue^{-i\alpha}z$ has a doublet $Ua^2e^{i\alpha}/z$.`,
      idea: String.raw`On the circle $z=ae^{i\theta}$ one has $a^2/\bar z=z$, so $w=f(z)+\overline{f(z)}=2\operatorname{Re}f$, which is real: $\operatorname{Im}w=\psi$ is constant on the circle, which is therefore a streamline. The added term is analytic outside the circle because $f(a^2/\bar z)$ is analytic when $a^2/\bar z$ lies inside the circle, where $f$ has no singularities, and its conjugate is analytic in $z$ (a double reflection). It is the Schwarz reflection principle (rca-11.14) in the circle instead of in a line: with the doublet-and-image construction of 4.12 as a special case.`,
      caption: String.raw`Place sources, sinks and vortices outside the unit circle (click with the tool; they cannot go inside), set the stream, and the theorem adds the image singularities (open dots, with the extra source or vortex at the centre). With the images on, the circle is a streamline: nothing passes through it, and the right-hand plot of the normal velocity $u_r$ round the circle is flat at zero (the readout gives its largest value). Switch the images off: the streamlines run straight through the cylinder, and $u_r(\theta)$ is a wave of the order of the stream speed. Move a singularity and the images move with it ($z_0\mapsto a^2/\bar z_0$).`,
      deps: ['fluid-4.12', 'fluid-4.4', 'rca-11.14'],
      refs: ['Acheson ch. 4'],
      credit: 'L. M. Milne-Thomson, Proc. Camb. Phil. Soc. 36, 246–247, 1940',
      tags: ['circle theorem', 'images', 'Milne-Thomson'],
      scope: String.raw`Plane, ideal, irrotational flow; $f$ analytic in $|z|\le a$ except possibly at the origin if the image is wanted there. For vortices the total circulation round the cylinder is that of the vortices outside plus the central image vortices, so it can differ from the sum of the real circulations: it is zero when no vortex is outside.`,
      viz(v) {
        const tool = v.select('click to place', [{ value: 'src', label: 'source' }, { value: 'snk', label: 'sink' }, { value: 'vccw', label: 'vortex ↺' }, { value: 'vcw', label: 'vortex ↻' }, { value: 'del', label: 'remove' }], 'src');
        const str = v.slider('strength of new elements', 0.5, 4, 2, { step: 0.1 });
        const U = v.slider('stream speed $U$', 0, 1.5, 0.6, { step: 0.05 });
        const ang = v.slider('stream angle (deg)', -45, 45, 0, { step: 1 });
        const img = v.toggle('apply the circle theorem (add the images)', true);
        v.button('Clear', () => { E.length = 0; });
        const E = [{ t: 'src', x: 1.9, y: 0.9, k: 2.5 }];
        const s = v.stage({ x: [-4.8, 4.8], y: [-2.5, 2.5], equal: true, axes: false, height: 400, weight: 1.4, title: 'singularities, their images and the circle $|z|=1$' });
        const q = v.stage({ x: [0, 360], y: [-3, 3], axes: 'box', gutter: true, height: 400, weight: 0.8, xlabel: 'angle $\\theta$ (degrees)', ylabel: '$u_r$ on the circle', title: 'normal velocity on the circle', xticks: [0, 90, 180, 270, 360] });
        s.onClick((x, y) => {
          const t = tool.value;
          if (t === 'del') { let b = -1, bd = 0.5; E.forEach((e, i) => { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = i; } }); if (b >= 0) E.splice(b, 1); return; }
          if (Math.hypot(x, y) < 1.15 || E.length >= 8) return;
          E.push(t === 'src' ? { t: 'src', x, y, k: str.value } : t === 'snk' ? { t: 'src', x, y, k: -str.value } : t === 'vccw' ? { t: 'vtx', x, y, k: str.value } : { t: 'vtx', x, y, k: -str.value });
        });
        const imgs = () => {
          const out = [], a2 = deg(ang.value);
          out.push({ t: 'dbl', x: 0, y: 0, k: U.value, th: a2 });
          for (const e of E) { const d2 = e.x * e.x + e.y * e.y, zx = e.x / d2, zy = e.y / d2; out.push({ ...e, x: zx, y: zy, k: e.t === 'src' ? e.k : -e.k, img: true }); out.push({ t: e.t, x: 0, y: 0, k: e.t === 'src' ? -e.k : e.k, img: true }); }
          return out;
        };
        let info = {};
        v.render(() => {
          const real = [{ t: 'uni', k: U.value, th: deg(ang.value) }, ...E], I = imgs(), all = img.value ? [...real, ...I] : real;
          const lines = streamlines((x, y) => (img.value && x * x + y * y < 1.003 ? null : elemVel(all, x, y, 0.06)), [-4.8, 4.8, -2.5, 2.5], { sep: 0.22, step: 0.045, seeds: [[-4.7, 0.3]] });
          drawLines(s, lines, { color: 'accent', width: 1.15, alpha: 0.85 });
          s.circle(0, 0, 1, { fill: 'muted', fillAlpha: img.value ? 0.55 : 0.18, color: 'ink', width: 2.4 });
          for (const e of E) s.dot(e.x, e.y, { r: 8, color: e.t === 'src' ? (e.k > 0 ? 'green' : 'red') : e.k > 0 ? 'purple' : 'orange' });
          if (img.value) for (const e of I) { if (e.t === 'dbl') continue; s.dot(e.x, e.y, { r: e.x === 0 && e.y === 0 ? 4 : 6, hollow: true, color: e.t === 'src' ? (e.k > 0 ? 'green' : 'red') : e.k > 0 ? 'purple' : 'orange' }); }
          const pts = []; let mx = 0;
          for (let k = 0; k <= 360; k += 2) { const th = deg(k), x = Math.cos(th), y = Math.sin(th), u = elemVel(all, x, y, 0.001) || [0, 0], ur = u[0] * x + u[1] * y; pts.push([k, ur]); mx = Math.max(mx, Math.abs(ur)); }
          q.hline(0, { color: 'muted', alpha: 0.6 }); q.path(pts, { color: img.value ? 'green' : 'red', width: 2.6 });
          info = { mx };
        });
        v.readout(() => `largest normal velocity on the circle: $${img.value ? v.sci(info.mx + 1e-18, 1) : v.fix(info.mx, 3)}$${img.value ? ' — the circle is a streamline' : ' — without the images fluid streams through the cylinder'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'Flow in corners and round edges: w = zⁿ',
      statement: String.raw`The complex potential $w=Az^n$ ($A>0$ real, $n>\tfrac12$) has $\psi=Ar^n\sin n\theta$, which vanishes on the two rays $\theta=0$ and $\theta=\pi/n$. These are streamlines, so the flow is the potential flow inside a **wedge of angle $\pi/n$** whose sides are rigid walls. The speed is $|w'|=nAr^{n-1}$. For $n>1$ (wedge angle less than $\pi$: a corner, e.g. $n=2$, the right-angle corner) the speed vanishes at the apex like $r^{n-1}$: the corner is a stagnation point. For $n=1$ the flow is uniform along a flat wall. For $\tfrac12<n<1$ (wedge angle between $\pi$ and $2\pi$: flow round an edge) the speed grows without bound at the apex like $r^{-(1-n)}$; for the flat plate, $n=\tfrac12$, as $r^{-1/2}$.`,
      idea: String.raw`Every power $z^n$ is analytic in the sector away from $0$ (4.4), and $\operatorname{Im}(r^ne^{in\theta})=r^n\sin n\theta$ is zero on the two rays that bound the sector. Differentiating gives $w'=nAz^{n-1}$, hence the power law in the speed; its exponent changes sign at $n=1$. The map $z\mapsto z^n$ opens or closes angles by the factor $n$ and is conformal away from the origin (rca-14.2), which is why the wall condition is preserved. The infinite speed at a sharp convex edge is where the ideal-fluid theory stops describing real flow: the fluid separates, or the edge is rounded.`,
      caption: String.raw`Set the exponent $n$ (the wedge angle is $\pi/n$ and is drawn). Blue contours are $\psi$ (streamlines) and orange are $\phi$ (equipotentials); the fluid fills the white sector. The right panel plots the wall speed $|w'|=nr^{n-1}$ against distance $r$ from the apex on logarithmic axes: a straight line of slope $n-1$ (compare the slope measured between two points of the curve in the readout). For $n>1$ it falls to zero toward the corner; for $n<1$ it rises without bound toward the edge. Drag the gold marker along the wall.`,
      deps: ['fluid-4.4', 'rca-14.2'],
      refs: ['Kundu §7.4'],
      tags: ['corner', 'power law', 'singularity'],
      scope: String.raw`Plane, ideal, irrotational flow in a wedge with straight walls; $n$ may be non-integer when the sector is a proper subset of the plane. Near any sharp corner of a more complicated boundary the flow looks like one of these (with $n=\pi/\text{angle}$).`,
      viz(v) {
        const ns = v.slider('exponent $n$ (wedge angle $\\pi/n$)', 0.5, 3, 2, { step: 0.05 });
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 420, weight: 1.1, title: 'flow in a wedge: $w=z^n$' });
        const q = v.stage({ x: [0.03, 3], y: [0.05, 20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, weight: 0.9, xlabel: 'distance from the apex $r$', ylabel: 'wall speed $|w\'|$', title: 'speed along the wall' });
        const M = s.handle(1.4, 0, { color: 'gold', r: 8, label: 'probe', labelPos: 'n', constrain: (x) => [clamp(Math.abs(x), 0.04, 2.1), 0] });
        let info = {};
        v.render(() => {
          const n = ns.value, W = Math.PI / n, wedge = Math.min(W, TAU);
          const ang = (x, y) => ((Math.atan2(y, x) % TAU) + TAU) % TAU;
          const psi = (x, y) => { const r = Math.hypot(x, y), th = ang(x, y); return th > W - 1e-9 || th < 1e-9 ? NaN : Math.pow(r, n) * Math.sin(n * th); };
          const phi = (x, y) => { const r = Math.hypot(x, y), th = ang(x, y); return th > W - 1e-9 || th < 1e-9 ? NaN : Math.pow(r, n) * Math.cos(n * th); };
          if (W < TAU - 1e-9) { const pts = [[0, 0]]; for (let k = 0; k <= 60; k++) { const th = W + ((TAU - W) * k) / 60; pts.push([3 * Math.cos(th), 3 * Math.sin(th)]); } s.poly(pts, { fill: 'muted', fillAlpha: 0.3, stroke: false, hatch: true }); }
          const lv = []; for (let k = -10; k <= 10; k++) lv.push(0.35 * k);
          s.contour(phi, lv, { color: 'orange', width: 1, res: 170, alpha: 0.8 }); s.contour(psi, lv.filter((x) => x > 0), { color: 'accent', width: 1.4, res: 170 });
          s.line(0, 0, 2.2, 0, { color: 'ink', width: 3 }); s.line(0, 0, 2.2 * Math.cos(wedge), 2.2 * Math.sin(wedge), { color: 'ink', width: 3 });
          s.dot(0, 0, { r: 4, color: 'red' });
          s.text(`angle ${v.fix((wedge * 180) / Math.PI, 0)}°`, 0.6 * Math.cos(wedge / 2), 0.6 * Math.sin(wedge / 2), { color: 'muted', size: 12 });
          q.fn((r) => n * Math.pow(r, n - 1), { color: 'accent', width: 2.6 });
          q.hline(1, { color: 'muted', alpha: 0.5, dash: true });
          const r1 = 0.1, r2 = 1, sl = Math.log((n * Math.pow(r2, n - 1)) / (n * Math.pow(r1, n - 1))) / Math.log(r2 / r1);
          q.dot(M.x, n * Math.pow(M.x, n - 1), { r: 7, color: 'gold' });
          info = { n, sl, sp: n * Math.pow(M.x, n - 1), r: M.x, ang: (wedge * 180) / Math.PI };
        });
        v.readout(() => `wedge angle $\\pi/n=${v.fix(info.ang, 1)}^\\circ$ · wall speed at $r=${v.fix(info.r, 2)}$: $nr^{n-1}=${v.fix(info.sp, 3)}$ · slope of the log–log line measured between $r=0.1$ and $r=1$: $${v.fix(info.sl, 3)}$ $=n-1$\n${info.n > 1 ? 'convex corner of fluid: the apex is a stagnation point (speed $\\to0$)' : info.n === 1 ? 'a flat wall: uniform flow' : 'flow round an edge: the speed grows without bound at the apex'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Conformal maps carry potential flows',
      statement: String.raw`Let $z=F(\zeta)$ be a conformal map (analytic with $F'\ne0$) from a region $D'$ of the $\zeta$-plane onto the flow region $D$ of the $z$-plane. If $W(\zeta)$ is the complex potential of a flow in $D'$ then
$$w(z)=W\big(F^{-1}(z)\big)$$
is the complex potential of a flow in $D$. Streamlines and equipotentials of $W$ are carried to those of $w$ (they remain orthogonal), a streamline that is a boundary of $D'$ maps to a boundary streamline of $D$, and the velocities are related by $\dfrac{dw}{dz}=\dfrac{dW/d\zeta}{dF/d\zeta}$. Circulation and flux through corresponding curves are the same. By the Riemann mapping theorem (rca-14.8) a simply connected region has such a map onto a disk; for the exterior of a body, onto the exterior of the unit disk, so the flow past any simply connected obstacle can be obtained from the flow past a circle (4.7, 4.9).`,
      idea: String.raw`Composition of analytic functions is analytic, so $W\circ F^{-1}$ is analytic and its real and imaginary parts are conjugate harmonic functions: a legitimate flow. Because $\psi$ is simply carried along, level sets of $\psi$ map to level sets and the boundary streamline stays a streamline. The map preserves angles at every point where $F'\neq0$ (rca-14.2), so orthogonality of the two families is kept, while the speed is rescaled by $|F'|$: wherever the map stretches lengths the flow slows down and vice versa (the chain rule above).`,
      caption: String.raw`The left panel is the simplest flow of all: uniform stream (angle and circulation adjustable) past the unit circle in the $\zeta$-plane. Drag the eight gold handles on the right (each slides along its ray) to draw a star-shaped obstacle. The exterior of the obstacle is mapped onto the exterior of the unit disk numerically (Theodorsen's iteration, computed here with a discrete Fourier transform), and the streamlines of the circle flow are pushed forward through the map. They hug your shape, because the circle was a streamline. The readout gives the number of iterations and the largest mismatch between the mapped circle and your outline; very elongated shapes make the iteration fail, which is reported.`,
      deps: ['fluid-4.4', 'rca-14.2', 'rca-14.8'],
      refs: ['Kundu §7.6', 'Acheson ch. 4'],
      credit: 'numerical method: T. Theodorsen, NACA Report 411, 1931, and T. Theodorsen and I. E. Garrick, NACA Report 452, 1933',
      verify: true,
      tags: ['conformal map', 'Theodorsen', 'obstacle'],
      scope: String.raw`Plane, ideal, irrotational flow; simply connected obstacle. The numerical method here needs a star-shaped outline (a single-valued radius as a function of angle) and moderate aspect ratio.`,
      viz(v) {
        const al = v.slider('stream angle (deg)', -30, 30, 10, { step: 1 });
        const gm = v.slider('circulation $\\Gamma$ in the circle plane', -3, 3, 0, { step: 0.05 });
        const a = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1, title: 'the $\\zeta$-plane: flow past the unit circle' });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1, title: 'the $z$-plane: flow past your obstacle' });
        const R0 = [1.45, 1.0, 0.62, 0.8, 1.2, 0.8, 0.62, 1.0], TH = R0.map((_, k) => (TAU * k) / 8);
        const H = TH.map((t, k) => s.handle(R0[k] * Math.cos(t), R0[k] * Math.sin(t), { color: 'gold', r: 7, constrain: (x, y) => { const e = [Math.cos(t), Math.sin(t)], p = clamp(x * e[0] + y * e[1], 0.35, 2.2); return [p * e[0], p * e[1]]; } }));
        const rad = () => H.map((h, k) => Math.hypot(h.x, h.y));
        const trigInterp = (vals) => {
          const n = vals.length, f = vals.map(Math.log); const A = [], B = [];
          for (let k = 0; k <= n / 2; k++) { let ca = 0, cb = 0; for (let j = 0; j < n; j++) { ca += f[j] * Math.cos((TAU * k * j) / n); cb += f[j] * Math.sin((TAU * k * j) / n); } A.push(((k === 0 || k === n / 2 ? 1 : 2) * ca) / n); B.push((2 * cb) / n); }
          return (t) => { let r = A[0]; for (let k = 1; k < n / 2; k++) r += A[k] * Math.cos(k * t) + B[k] * Math.sin(k * t); r += A[n / 2] * Math.cos((n / 2) * t); return Math.exp(r); };
        };
        let key = '', mp = null, Rf = null, circLines = [], ck = '';
        let info = {};
        v.render(() => {
          const rr = rad(), k = rr.map((x) => x.toFixed(3)).join(',');
          if (k !== key) { key = k; Rf = trigInterp(rr); mp = theodorsen(Rf, 96, 40); }
          const alpha = deg(al.value), G = gm.value, c0 = Math.exp(mp.c0 ?? 0), Uz = c0;
          const dW = (zt) => { const z2 = cmul(zt, zt); const t1 = cmul([Uz, 0], cadd(cpolar(1, -alpha), cmul([-1, 0], cdiv(cpolar(1, alpha), z2)))); return cadd(t1, cdiv([0, G / TAU], zt)); };
          const k2 = al.value + '|' + gm.value;
          if (ck !== k2) { ck = k2; circLines = streamlines((x, y) => { if (x * x + y * y < 1.004) return null; const d = dW([x, y]); return [d[0], -d[1]]; }, [-3.2, 3.2, -2.4, 2.4], { sep: 0.2, step: 0.045, seeds: [[-3.1, 0.2]] }); }
          // left: circle flow
          drawLines(a, circLines, { color: 'accent', width: 1.1, alpha: 0.85 });
          a.circle(0, 0, 1, { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 2.4 });
          // right: mapped lines
          const mapped = circLines.map((L) => L.map((p) => { const z = mp.zOf(p); return z; }));
          drawLines(s, mapped, { color: 'accent', width: 1.1, alpha: 0.85 });
          const outline = []; for (let j = 0; j <= 200; j++) { const t = (TAU * j) / 200, r = Rf(t); outline.push([r * Math.cos(t), r * Math.sin(t)]); }
          s.poly(outline, { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 2.4 });
          const mb = []; for (let j = 0; j <= 120; j++) mb.push(mp.zOf(cpolar(1, (TAU * j) / 120)));
          s.path(mb, { color: 'green', width: 1.6, dash: [5, 4] });
          // maximum surface speed
          let vm = 0; for (let j = 0; j < 180; j++) { const zt = cpolar(1, (TAU * (j + 0.5)) / 180), d = cdiv(dW(zt), mp.dzOf(zt)); vm = Math.max(vm, cabs(d)); }
          info = { it: mp.it, err: mp.err, ok: mp.ok, vm, cap: c0 };
        });
        v.legend([['accent', 'streamlines (circle flow, and mapped)'], ['green', 'image of the unit circle', { dash: true }]]);
        v.readout(() => `Theodorsen iteration: ${info.it} steps · largest mismatch between the mapped circle and your outline $${v.fix(100 * info.err, 2)}\\%$ of the radius${info.ok ? '' : ' — not converged: the shape is too extreme for this method'}\nfar-field scale $|F'(\\infty)|=${v.fix(info.cap, 3)}$ (stream speed rescaled to $1$ at infinity) · largest surface speed $|w'|=${v.fix(info.vm, 3)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'Circulation as a free parameter',
      statement: String.raw`Let a body occupy a bounded region in the plane and let the fluid outside it be irrotational and incompressible with a prescribed uniform stream at infinity and no flow through the body. The potential problem ($\nabla^2\phi=0$, $\partial_n\phi=0$ on the body, $\nabla\phi\to\mathbf U$) has **infinitely many solutions**, one for each real number $\Gamma$: any two differ by a multiple of the circulation flow round the body, $\Gamma\,\nabla\theta$-like field, which is harmonic, tangent to the body and decays at infinity. The circulation $\oint_C\mathbf u\cdot d\mathbf l$ equals $-\Gamma$ (in the clockwise-positive convention) for every closed curve $C$ that winds once round the body and $0$ for every curve that does not. The potential $\phi$ is many-valued, changing by $\Gamma$ on going once round. If the body is removed (the region is simply connected), the circulation must vanish.`,
      idea: String.raw`In a simply connected region every closed loop is contractible and the circulation round it is the flux of vorticity through it, hence zero (4.1, 1.11). Round a hole the loops fall into classes labelled by their winding number, and homotopic loops give the same circulation (rca-10.40; the field is closed). The difference of two solutions is a harmonic function with zero normal derivative on the body and zero at infinity whose single-valued potential would have to vanish by the uniqueness argument of 4.2, so any difference must be many-valued, and the only many-valued possibility is a multiple of the angle round the hole. This leaves $\Gamma$ undetermined by the equations: something outside potential flow theory (the Kutta condition, chapter 5) has to choose it.`,
      caption: String.raw`The stream flows past the unit cylinder with circulation $\Gamma$ (slider). Two circular loops (blue and orange) can be moved and resized: drag each centre handle and its radius handle. Each loop's circulation is computed by integrating $\mathbf u\cdot d\mathbf l$ numerically: a loop that winds round the cylinder gives exactly $\Gamma$ whatever its shape, one that stays away from it gives $0$, and a loop that crosses the cylinder is not in the fluid (greyed). The right-hand plot shows the blue loop's circulation as a function of its radius, with its centre fixed: zero, then a gap while it crosses the body, then $\Gamma$. Switch the body off and $\Gamma$ is forced to zero: the region is no longer multiply connected.`,
      deps: ['fluid-4.2', 'fluid-4.9', 'rca-10.40', 'vcalc-5.7'],
      refs: ['Acheson ch. 4'],
      credit: 'cyclic constants of multiply connected regions: Kelvin, 1869',
      verify: true,
      tags: ['circulation', 'multiply connected', 'Kutta'],
      scope: String.raw`Plane, ideal, irrotational flow past a single body. For several bodies there is one free circulation per body.`,
      viz(v) {
        const gs = v.slider('circulation $\\Gamma$ round the cylinder', -4, 4, 2, { step: 0.1 });
        const body = v.toggle('cylinder present', true);
        const s = v.stage({ x: [-4, 4], y: [-2.5, 2.5], equal: true, axes: false, height: 400, weight: 1.4, title: 'two loops in the flow past a cylinder' });
        const q = v.stage({ x: [0, 3.5], y: [-4, 4], axes: 'box', gutter: true, height: 400, weight: 0.85, xlabel: 'radius of the blue loop', ylabel: 'circulation (clockwise)', title: 'circulation against loop radius' });
        const CA = s.handle(-0.2, 0.2, { color: 'accent', r: 7, label: 'A', labelPos: 'nw' }), RA = s.handle(1.9, 0.2, { color: 'accent', r: 6 });
        const CB = s.handle(2.8, 1.3, { color: 'orange', r: 7, label: 'B', labelPos: 'nw' }), RB = s.handle(3.45, 1.3, { color: 'orange', r: 6 });
        const field = (x, y) => {
          const G = body.value ? gs.value : 0;
          if (!body.value) return [1, 0];
          const E = [{ t: 'uni', k: 1, th: 0 }, { t: 'dbl', x: 0, y: 0, k: 1, th: 0 }, { t: 'vtx', x: 0, y: 0, k: -G }];
          return elemVel(E, x, y, 0.001);
        };
        const loop = (cx, cy, r) => {
          const n = 720; let g = 0, ok = true;
          for (let j = 0; j < n; j++) {
            const t = (TAU * (j + 0.5)) / n, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
            if (body.value && x * x + y * y < 1) { ok = false; break; }
            const u = field(x, y); g += (u[0] * -Math.sin(t) + u[1] * Math.cos(t)) * r * (TAU / n);
          }
          if (body.value) { const d = Math.hypot(cx, cy); if (Math.abs(r - 1) <= d && d <= r + 1) ok = false; }
          return ok ? -g : null;
        };
        let lines = [], key = '';
        let info = {};
        v.render(() => {
          const k = body.value + '|' + gs.value;
          if (k !== key) { key = k; lines = streamlines((x, y) => (body.value && x * x + y * y < 1.004 ? null : field(x, y)), [-4, 4, -2.5, 2.5], { sep: 0.22, step: 0.045, seeds: [[-3.9, 0.3], [-3.9, -0.3]] }); }
          drawLines(s, lines, { color: 'accent', width: 1.0, alpha: 0.55 });
          if (body.value) s.circle(0, 0, 1, { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 2.4 });
          const rA = Math.max(0.1, Math.hypot(RA.x - CA.x, RA.y - CA.y)), rB = Math.max(0.1, Math.hypot(RB.x - CB.x, RB.y - CB.y));
          const gA = loop(CA.x, CA.y, rA), gB = loop(CB.x, CB.y, rB);
          s.circle(CA.x, CA.y, rA, { color: gA === null ? 'muted' : 'accent', width: 3, fill: gA === null ? 'muted' : 'accent', fillAlpha: 0.06 });
          s.circle(CB.x, CB.y, rB, { color: gB === null ? 'muted' : 'orange', width: 3, fill: gB === null ? 'muted' : 'orange', fillAlpha: 0.06 });
          q.hline(0, { color: 'muted', alpha: 0.6 }); if (body.value) q.hline(gs.value, { color: 'green', dash: true, alpha: 0.8 });
          const pts = []; for (let r = 0.05; r <= 3.5; r += 0.05) { const g = loop(CA.x, CA.y, r); pts.push(g === null ? null : [r, g]); }
          q.path(pts, { color: 'accent', width: 2.6 });
          if (gA !== null) q.dot(rA, gA, { r: 7, color: 'accent' });
          info = { gA, gB };
        });
        v.legend([['accent', 'loop A'], ['orange', 'loop B'], ['green', '$\\Gamma$', { dash: true }]]);
        v.readout(() => `loop A: ${info.gA === null ? 'crosses the cylinder (not in the fluid)' : `$\\oint\\mathbf u\\cdot d\\mathbf l$ (clockwise) $=${v.fix(info.gA, 4)}$`} · loop B: ${info.gB === null ? 'crosses the cylinder' : `$${v.fix(info.gB, 4)}$`}\n${body.value ? `$\\Gamma=${v.fix(gs.value, 2)}$` : '$\\Gamma=0$ (no body: the region is simply connected)'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.17
    {
      num: '4.17',
      kind: 'Phenomenon',
      name: 'Added mass of an accelerating body',
      statement: String.raw`A body accelerating through an ideal fluid at rest at infinity, with acceleration $\dot U$, feels (once the steady-flow forces, which vanish by d'Alembert's paradox, are set aside) a force opposing the acceleration:
$$F=-m_a\,\dot U,\qquad m_a=C_a\,\rho_fV,$$
where $V$ is the volume of the body and $C_a$ the added-mass coefficient ($C_a=\tfrac12$ for a sphere, $C_a=1$ for a circular cylinder moving perpendicular to its axis). The fluid's kinetic energy $\tfrac12m_aU^2$ must be supplied by the body. A body of mass $m=\rho_bV$ that is driven by a force $F_0$ therefore behaves as if it had mass $m+m_a$; for a free body released at rest in fluid, buoyancy gives
$$\dot U=\frac{(\rho_f-\rho_b)\,g}{\rho_b+C_a\rho_f},$$
which for a sphere much lighter than the fluid tends to $2g$ rather than to the naive $(\rho_f/\rho_b-1)g$.`,
      idea: String.raw`A sphere of radius $a$ moving at $U$ in fluid at rest has velocity potential $\phi=-\dfrac{Ua^3\cos\theta}{2r^2}$, a doublet, which satisfies $\partial_r\phi=U\cos\theta$ on $r=a$. The kinetic energy of the fluid is $\tfrac12(\tfrac12\rho_fV)U^2$. The unsteady Bernoulli equation (4.3) gives a pressure $p=-\rho_f\,\partial\phi/\partial t=\tfrac12\rho_fa\dot U\cos\theta$ that is larger on the front; integrating $-p\,\mathbf n\,dS$ gives $F=-\tfrac12\rho_fV\dot U$. In the cylinder, $\phi=-Ua^2\cos\theta/r$ gives $F=-\rho_f\pi a^2\dot U$ per unit length. The steady (quadratic) part of the pressure cancels, as in d'Alembert's paradox (4.8), which is why only the acceleration term remains.`,
      credit: 'F. W. Bessel, 1828 (pendulum experiments); G. Green, 1833 and G. G. Stokes, 1843 (theory)',
      verify: true,
      caption: String.raw`A ball (or a circular cylinder, a cross-section of a long rod) is released from rest in water and accelerates upward. The picture follows the ball; the streamlines are the instantaneous dipole flow of the fluid pushed aside, with red arrows where the acceleration raises the pressure and blue where it lowers it, which is integrated numerically to the force $-m_a\dot U$ of the readout. The right panel shows the height gained: the dashed grey curve is the naive result that ignores the fluid's inertia, the blue curve includes the added mass. A very light sphere rises at $2g$, a very light cylinder at $g$; a neutrally buoyant ball does not move at all.`,
      deps: ['fluid-4.3', 'fluid-4.8'],
      refs: ['Kundu §7.8'],
      tags: ['added mass', 'buoyancy', 'unsteady'],
      scope: String.raw`Ideal fluid, no wake or vorticity, constant acceleration for the first instants of the motion; in real fluids drag and vortex shedding soon dominate, and the added-mass coefficient is modified by a nearby wall or by deformation (a bubble's shape).`,
      viz(v) {
        const shape = v.select('body', [{ value: 'sph', label: 'sphere' }, { value: 'cyl', label: 'circular cylinder' }], 'sph', { onChange: () => v.invalidate() });
        const sg = v.slider('density ratio $\\rho_b/\\rho_f$', 0, 1.6, 0.1, { step: 0.01 });
        const s = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, axes: false, height: 400, weight: 1.1, title: 'the fluid pushed aside by the rising body' });
        const q = v.stage({ x: [0, 1.2], y: [-1, 5], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'time $t$ (s)', ylabel: 'height gained (m)', title: 'released from rest' });
        let lines = [], key = '';
        let info = {};
        v.animate((t) => {
          const sph = shape.value === 'sph', Ca = sph ? 0.5 : 1, sig = Math.max(sg.value, 1e-6), a = ((1 - sig) * G0) / (sig + Ca), an = ((1 - sig) * G0) / sig;
          const U = a * t, a0 = 1;
          const k = shape.value;
          if (key !== k) {
            key = k;
            const f = sph ? (x, y) => { const r = Math.hypot(x, y); if (r < 1.004) return null; const c = y / r, sn = x / r, ur = c / (r ** 3), ut = sn / (2 * r ** 3); return [ur * sn + ut * c, ur * c - ut * sn]; }
              : (x, y) => { const r = Math.hypot(x, y); if (r < 1.004) return null; const c = y / r, sn = x / r, ur = c / (r * r), ut = sn / (r * r); return [ur * sn + ut * c, ur * c - ut * sn]; };
            lines = streamlines(f, [-3, 3, -2.3, 2.3], { sep: 0.22, step: 0.04, seeds: [[0.6, 1.8]] });
          }
          drawLines(s, lines, { color: 'accent', width: 1.1, alpha: 0.75 });
          s.circle(0, 0, a0, { fill: 'gold', fillAlpha: 0.35, color: 'ink', width: 2.4 });
          // pressure from the acceleration term: p ~ cos(theta) (in units of rho a Udot (1/2 or 1))
          for (let j = 0; j < 24; j++) {
            const th = (TAU * (j + 0.5)) / 24, c = Math.cos(th), sn = Math.sin(th), pp = c; // normalised
            const L = 0.4 * Math.abs(pp) + 0.03, x = sn, y = c; // theta measured from +y (direction of motion)
            if (pp > 0) s.arrow(x * (1 + L), y * (1 + L), x, y, { color: 'red', width: 1.6, head: 5 }); else s.arrow(x, y, x * (1 + L), y * (1 + L), { color: 'blue', width: 1.6, head: 5 });
          }
          s.arrow(0, 0, 0, 0.8, { color: 'green', width: 3.5 }); s.text('acceleration', 0.1, 0.55, { color: 'green', align: 'left' });
          // plot
          const hh = 0.5 * a * 1.44, lo = Math.min(0, hh), hi = Math.max(0, hh), pad = 0.12 * (hi - lo) + 0.05;
          q.setView([0, 1.2], [lo - pad, hi + pad]);
          q.hline(0, { color: 'muted', alpha: 0.6 });
          q.fn((x) => 0.5 * clamp(an, -60, 60) * x * x, { color: 'muted', width: 2, dash: true, domain: [0, 1.2] });
          q.fn((x) => 0.5 * a * x * x, { color: 'accent', width: 2.8, domain: [0, 1.2] });
          q.dot(t % 1.2, 0.5 * a * (t % 1.2) ** 2, { r: 7, color: 'gold' });
          // exact integration of the pressure force per unit rho*V
          const ratio = sph ? (() => { let F = 0; const m = 2000; for (let j = 0; j < m; j++) { const th = (Math.PI * (j + 0.5)) / m; F += -(0.5 * Math.cos(th)) * Math.cos(th) * TAU * Math.sin(th) * (Math.PI / m); } return F / ((4 * Math.PI) / 3); })() : (() => { let F = 0; const m = 2000; for (let j = 0; j < m; j++) { const th = (TAU * (j + 0.5)) / m; F += -Math.cos(th) * Math.cos(th) * (TAU / m); } return F / Math.PI; })();
          info = { a, an, Ca, ratio, sig, U };
        }, { period: 1.2, still: 0.8 });
        v.legend([['accent', 'with added mass'], ['muted', 'naive: ignores the fluid’s inertia', { dash: true }]]);
        v.readout(() => `$C_a=${info.Ca}$: pressure integrated over the surface gives $F=${v.fix(info.ratio, 4)}\\,\\rho_fV\\dot U$ (the theory: $-C_a$)\nacceleration $\\dot U=(1-\\sigma)g/(\\sigma+C_a)=${v.fix(info.a / G0, 3)}\\,g$ — the naive $(1-\\sigma)g/\\sigma$ would give $${info.sig < 0.02 ? 'a huge value' : v.fix(info.an / G0, 2) + '\\,g'}$`);
      },
    },
  ],
};
