// Architecture & Structural Form — Chapter 3: Arches and the line of thrust (items 3.8–3.14; 3.1–3.7 are in ch03.js)
//
// Sources checked (Oct 2026): see the header of ch03.js for Heyman (1966, 1969), the minimum-thickness literature, Hooke's anagram
// and Gaudí's hanging models. Additional sources used here:
//   Gothic buttress rules: S. Huerta, "Galileo was Wrong: The Geometrical Design of Masonry Arches", Nexus Network Journal 8 (2):
//     25–52 (2006), doi:10.1007/s00004-006-0016-8: Gothic rules give a buttress depth of nearly 1/4 of the span, Renaissance rules
//     between 1/3 and 1/2; the late-Gothic manuscript "Vom des Chores Mass" (Coenen 1990) gives wall = s/10 and buttress = 3s/10;
//     the geometrical rule (fig. 3 of the paper, after Derand 1643): divide the intrados of the transverse arch in three parts, join one
//     of the points with the springing, prolong the line by its own length, and the end point gives the buttress depth. Huerta
//     (ICE paper, 2010) notes that the rule is Gothic in origin, appears in the lost 1546 treatise of Baccojani and was later called
//     Blondel's rule (secondary summaries; the book pages were not seen). The reading used here (first third-point of the intrados,
//     measured along its length) gives exactly span/4 for a semicircle, consistent with "nearly 1/4 of the span".
//   Pointed arches: Nikolić, Savremena dostignuća u građevinarstvu, Subotica 2016, paper 019, Table 2 (minimum thickness t/R of
//     pointed arches by eccentricity ξ = e/(R−e) and embrace angle), used as a check of the engine for α = 90°.
//   Flying buttresses and pinnacles: Heyman's 1966–67 studies are cited in secondary sources as the fullest account of the structural
//     role of flying buttresses; the explanation that a pinnacle's weight steepens the thrust line is given in standard accounts
//     (e.g. the Open University film "The Arch Never Sleeps" with Heyman); the numbers used here are illustrative, not a real church.

import { arch, archFromLine, thrustRows, thrustLP, thrustRange, thrustLine, hinges, collapseFactor, centralLine, bestFit, drawArch, drawThrust, momentCoef, rot, clamp, f2, blockAt, extradosY, drawSupport } from './ch03.shared.js';

const deg = (r) => (r * 180) / Math.PI;
const GAM = 22; // kN/m³, illustrative unit weight of masonry
function solve3(A, b) {
  const M = A.map((r, i) => [...r, b[i]]); const n = 3;
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; } }
  const x = [0, 0, 0]; for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; } return x;
}
export default {
  collection: 'arch',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Spreading supports and cracking are not failure',
      statement: String.raw`An abutment never stays exactly where the mason put it: the ground settles, the thrust itself pushes the support outward. A masonry arch follows a small outward movement of its supports by opening three hinges, a crack on the intrados at the crown and a crack on the extrados at each haunch, and becomes a statically determinate three-hinge arch whose line of thrust is fixed by the three hinge points. The horizontal thrust falls to the minimum that fits the geometry (arch-3.5), the arch stays in equilibrium, and the cracks are not failure. Only when the movement is gross, so that the changing geometry carries the line of thrust out of the masonry, does the arch collapse; before that, the cracks are evidence of past movement rather than of present danger.`,
      idea: String.raw`A masonry arch has three redundant reactions, so a movement of its supports is a way of choosing among the admissible thrust lines of arch-3.5. Spreading lowers $H$ until the line touches the stone at the crown (extrados) and at the two haunches (intrados), the least thrust that fits; those three contacts are hinges, and a three-hinge arch is statically determinate (three moment equations fix the three reactions). As the spread grows the upper pieces rotate rigidly about the haunch hinges, the crown drops, the geometry changes and so does the thrust line; the thrust, which first fell to the minimum, now rises again as the arch flattens (for a three-hinge arch $H$ is the moment of the loads divided by the rise), and the arch is safe as long as the line of the three-hinge arch stays inside the stone (arch-3.5): the right-hand plot follows both.`,
      caption: String.raw`Slide the spread of the abutments (as a share of the span). The lower courses move out with the abutments, the upper pieces tilt about the haunch hinges (red discs) and the crown drops; the cracks are drawn to scale. The red line is the thrust line of the three-hinge arch. The plot follows the thrust of the three-hinge arch (it starts inside the dashed band of thrusts the intact arch allowed, then rises as the crown drops); the red zone is where its line of thrust has left the stone. Thin the ring to see it fail sooner.`,
      deps: ['arch-3.6'],
      see: ['arch-3.5', 'arch-3.14'],
      refs: ['Heyman'],
      scope: String.raw`Rigid voussoirs, small rotations treated exactly (rigid-body geometry), symmetric spreading of both abutments, no sliding, no crushing; hinge positions taken from the minimum-thrust line of the intact arch.`,
      tags: ['hinges', 'support movement', 'cracking'],
      viz(v) {
        const N = 24, tS = v.slider('thickness t / R', 0.12, 0.4, 0.2, { step: 0.005 }), sS = v.slider('spread of the abutments, share of the span (%)', 0, 40, 6, { step: 0.1 });
        const A = v.stage({ x: [-1.45, 1.45], y: [-0.35, 1.35], equal: true, axes: false, height: 330, weight: 1.5, title: 'the arch after the supports move apart' });
        const B = v.stage({ x: [0, 40], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'spread (% of span)', ylabel: 'thrust H / W of the three-hinge arch', title: 'how far can it spread?' });
        const ZERO = [0, 0];
        function pickHinges(g, rg) {
          const hs = hinges(g, [], rg.min, {}, 1e-6).filter((h) => h.side === 'a' || h.side === 'b'), half = g.half;
          const crown = hs.find((h) => h.j === half && h.side === 'b') || { j: half, side: 'b' };
          const L = hs.filter((h) => h.side === 'a' && h.j < half).sort((a, b) => b.j - a.j)[0] || { j: 1, side: 'a' };
          return { jL: L.j, half };
        }
        function spread(g, hz, s) {
          const half = hz.half, jL = hz.jL, jR = g.N - jL, d = (s / 100) * g.span / 2, PL = g.joints[jL].a, C = g.joints[half].b;
          let lo = -0.9, hi = 0, ok = true; const f = (al) => rot(C, PL, al)[0] - d;
          if (f(lo) < 0) ok = false; for (let i = 0; i < 60 && ok; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
          const al = (lo + hi) / 2, PR = [-PL[0], PL[1]];
          const trL = (p) => { const q = rot(p, PL, al); return [q[0] - d, q[1]]; }, trR = (p) => { const q = rot(p, PR, -al); return [q[0] + d, q[1]]; };
          const mvL = (p) => [p[0] - d, p[1]], mvR = (p) => [p[0] + d, p[1]];
          const bodyOf = (k) => (k < jL ? 'LL' : k < half ? 'LU' : k < jR ? 'RU' : 'RL'), tfK = (k, p) => ({ LL: mvL, LU: trL, RU: trR, RL: mvR })[bodyOf(k)](p);
          const jf = (j) => (j < jL ? mvL : j <= half ? trL : j <= jR ? trR : mvR), rt = (j) => (j < jL ? 0 : j <= half ? al : j <= jR ? -al : 0);
          const joints = g.joints.map((J, j) => { const f1 = jf(j), a = rt(j), c = Math.cos(a), sn = Math.sin(a); return { a: f1(J.a), b: f1(J.b), tau: [c * J.tau[0] - sn * J.tau[1], sn * J.tau[0] + c * J.tau[1]] }; });
          const blocks = g.blocks.map((b, k) => { const q = tfK(k, [b.cx, b.cy]); return { ...b, cx: q[0], cy: q[1] }; });
          const gT = { ...g, joints, blocks, c0: mvL(g.c0) };
          // three-hinge reaction: M = 0 at the haunch hinge (joint jL, intrados), the crown hinge (extrados) and the right haunch hinge
          const pts = [[jL, joints[jL].a], [half, joints[half].b], [jR, joints[jR].a]], co = pts.map(([j, p]) => momentCoef(gT, [], j, p));
          const u = solve3(co.map((c) => [c.cH, c.cV, 1]), co.map((c) => -c.cst));
          const tl = thrustLine(gT, [], u), exceed = Math.max(0, ...tl.map((q) => Math.max(-q.t, q.t - 1)));
          return { ok, al, gT, tf: tfK, tl, u, exceed, margin: -exceed, hz: pts.map((p) => p[1]) };
        }
        let M = null;
        const curveCache = new Map();
        v.render(() => {
          const g = arch({ R: 1, t: tS.value, N }), rg = thrustRange(g, []);
          if (!rg) { drawArch(v, A, g); A.corner('this ring cannot stand even before the supports move', 'tl', { color: 'red' }); M = null; return; }
          const hz = pickHinges(g, rg), key = tS.value.toFixed(4);
          if (!curveCache.has(key)) { const pts = []; for (let s = 0; s <= 40.001; s += 0.8) { const r = spread(g, hz, s); pts.push([s, r.ok ? 100 * r.exceed : 100, r.ok ? r.u[0] / g.W : NaN]); } curveCache.clear(); curveCache.set(key, pts); }
          const pts = curveCache.get(key), r = spread(g, hz, sS.value);
          drawArch(v, A, g, { fillAlpha: 0.04, joints: false, ink: 'faint' });
          drawArch(v, A, g, { tfBlock: (k, p) => r.tf(k, p), fillAlpha: 0.15 });
          const good = r.ok && r.exceed < 1e-6;
          drawThrust(v, A, r.tl, { color: good ? 'red' : 'orange', width: 2.4, bad: 'orange' });
          if (sS.value > 0) for (const p of r.hz) A.dot(p[0], p[1], { r: 5.5, color: 'red' });
          A.corner(sS.value === 0 ? 'intact arch (any admissible thrust)' : good ? 'three cracks, the arch stands' : 'the line has left the stone: collapse', 'tl', { color: good ? 'muted' : 'red' });
          const lim = pts.find((p, i) => i > 0 && p[1] > 1e-6), smax = lim ? pts[pts.indexOf(lim) - 1][0] + 0.4 : null;
          const ymax = Math.min(1.2, Math.max(0.3, ...pts.filter((p) => Number.isFinite(p[2])).map((p) => p[2]))) * 1.08;
          B.setView([0, 40], [0, ymax]);
          if (smax !== null) B.vband(smax, 40, { color: 'red', alpha: 0.1 });
          B.path(pts.filter((p) => Number.isFinite(p[2])).map((p) => [p[0], Math.min(p[2], ymax)]), { color: 'accent', width: 2.4 });
          B.hline(rg.Hmin / g.W, { color: 'green', width: 1.2, dash: [4, 3] }); B.hline(rg.Hmax / g.W, { color: 'green', width: 1.2, dash: [4, 3] });
          B.dot(sS.value, Math.min(r.u[0] / g.W, ymax), { r: 5.5, color: good ? 'green' : 'red' });
          M = { g, rg, r, pts, smax, good, hz };
        });
        v.legend([['red', 'thrust line of the three-hinge arch'], ['accent', 'its thrust'], ['green', 'thrusts allowed before cracking', { dash: true }], ['red', 'spread beyond which the line leaves the stone', { area: true }]]);
        v.readout(() => {
          if (!M) return 'The ring is below the minimum thickness: no thrust line fits (arch-3.7).';
          const { g, rg, r, smax } = M;
          return `Intact arch: any thrust from ${f2(rg.Hmin / g.W, 3)} to ${f2(rg.Hmax / g.W, 3)} of its weight. After a spread of ${f2(sS.value, 2)}% the three hinges fix $H = ${f2(r.u[0] / g.W, 3)}$ W (crown drop ${f2(g.joints[g.half].b[1] - r.gT.joints[g.half].b[1], 3)} R), and the line ${M.good ? 'stays inside the stone: **safe**' : `leaves the stone by ${f2(100 * r.exceed, 1)}% of the thickness: **not safe**`}. ${smax ? `For this ring the line leaves the stone at a spread of about ${f2(smax, 1)}% of the span.` : 'For this ring the line stays inside up to 40% of the span.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Concept',
      name: 'Buttresses: bringing the thrust to the ground',
      statement: String.raw`An arch pushes its supports outward with the horizontal thrust $H$ as well as down with its weight. A **buttress** (or a thick pier) must bring this inclined force to the ground: the line of thrust continues down through it, leaning outward at the top and bending back toward the vertical as the weight of each course is added, and it must meet the foundation inside the base. Seen from the outside, the buttress is safe against overturning when the line reaches the base inside the outer toe (safe theorem, arch-3.5); the whole base stays in compression when it lies in the middle third. If the arch's own thrust may be anywhere between its least and greatest values, the buttress is certainly safe if it is safe for the greatest, and safe in principle if it is safe for the least. A wider buttress, a taller one, or one with extra load on top all bring the line in; but a tall buttress cannot be made safe by height alone: its line approaches a limit at a distance $H/\gamma w$ from the axis, so it needs $w \ge \sqrt{2H/\gamma}$ however tall it is.`,
      idea: String.raw`Treat the buttress as a stack of slices, each of weight $\gamma w\,\mathrm{d}d$. Moments about the point where the line crosses depth $d$ give $X(d) = \bigl(V_0 x_0 + \gamma w d\, x_c - H d\bigr)/\bigl(V_0 + \gamma w d\bigr)$: the line is a hyperbola in depth, drifting outward through the term $-Hd$ while the weight in the denominator grows. As $d \to \infty$ it tends to $x_c - H/\gamma w$, which is inside the base of width $w$ exactly when $w^2 \ge 2H/\gamma$ (the proportional design, independent of scale). For a buttress of given height the factor against overturning about the outer toe is the restoring moment over the overturning moment, $\bigl[V_0(x_0 - x_o) + \gamma w^2 h/2\bigr]/Hh$. The thrust itself is the arch's $(H, V_0)$ from arch-3.5, with the freedom to take any value in $[H_{\min}, H_{\max}]$.`,
      caption: String.raw`A semicircular arch of 6 m span (ring 0.5 m thick) stands on two buttresses. Change their width and height and choose which thrust of the arch acts (the least, the greatest, or the middle of the allowed range). The red line is the line of thrust continuing from the arch through the buttress; it turns orange if it leaves the base. The plot shows the width needed for stability against the height, for the least and the greatest thrust, with the limit $\sqrt{2H/\gamma}$ for a very tall buttress as dashed lines; the disc is your buttress.`,
      deps: ['arch-3.2'],
      see: ['arch-3.10', 'arch-3.12'],
      refs: ['Heyman'],
      scope: String.raw`Plane arch of 6 m span and 0.5 m ring on rectangular buttresses; unit weight 22 kN/m³ (illustrative) for both, per metre of depth; no wind, no sliding, no crushing. Stability judged by the line of thrust, not by stress.`,
      tags: ['buttress', 'overturning'],
      viz(v) {
        const R = 3, t = 0.5, N = 24, g = arch({ R, t, N, gamma: GAM });
        const wS = v.slider('buttress width w (m)', 0.6, 4, 1.2, { step: 0.05 }), hS = v.slider('buttress height h (m)', 1, 12, 4, { step: 0.1 });
        const st = v.select('thrust of the arch', [{ value: 'min', label: 'least thrust' }, { value: 'mid', label: 'middle' }, { value: 'max', label: 'greatest thrust' }], 'max');
        const A = v.stage({ x: [-9, 9], y: [-8, 4.5], equal: true, axes: false, height: 340, weight: 1.5, title: 'the arch on its buttresses' });
        const B = v.stage({ x: [0, 12], y: [0, 5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'buttress height h (m)', ylabel: 'width w needed (m)', title: 'width needed against height' });
        const rg = thrustRange(g, []), tl0 = rg ? thrustLine(g, [], rg.min) : null;
        const xi = g.joints[0].a[0];
        const stateU = (k) => (k === 'min' ? rg.min : k === 'max' ? rg.max : rg.min.map((a, i) => (a + rg.max[i]) / 2));
        const info = (u, w, h) => { const tl = thrustLine(g, [], u), x0 = tl[0].p[0], H = u[0], V0 = u[1], xo = xi - w, xc = xi - w / 2, X = (d) => (V0 * x0 + GAM * w * d * xc - H * d) / (V0 + GAM * w * d); const FS = (V0 * (x0 - xo) + (GAM * w * w * h) / 2) / (H * h); return { tl, x0, H, V0, X, xo, xc, FS, asym: xc - H / (GAM * w), wInf: Math.sqrt((2 * H) / GAM) }; };
        const wReq = (u, h) => { const tl = thrustLine(g, [], u), x0 = tl[0].p[0], H = u[0], V0 = u[1], c = V0 * (x0 - xi) - H * h; return (-V0 + Math.sqrt(V0 * V0 - 2 * GAM * h * c)) / (GAM * h); };
        let M = null;
        v.render(() => {
          const w = wS.value, h = hS.value;
          A.setView([-(R + w + 1.5 + 0.0 * h), R + w + 1.5], [-h - 0.8, R + t + 0.8]);
          drawArch(v, A, g, { fillAlpha: 0.14 });
          if (!rg) { A.corner('the ring cannot stand', 'tl', { color: 'red' }); return; }
          const u = stateU(st.value), I = info(u, w, h), tl = I.tl;
          for (const sg of [-1, 1]) {
            A.rect(sg < 0 ? xi - w : -xi, -h, sg < 0 ? xi : -xi + w, 0, { fill: 'muted', fillAlpha: 0.2, color: 'ink', width: 1.2 });
            A.line(-9, -h, 9, -h, { color: 'faint', width: 1 });
          }
          drawThrust(v, A, tl, { color: 'red', width: 2.4 });
          const ok = I.X(h) >= I.xo - 1e-9, third = I.X(h) >= I.xo + w / 3 - 1e-9;
          for (const sg of [-1, 1]) {
            const pts = [[sg * I.x0, 0]]; for (let k = 1; k <= 40; k++) { const d = (h * k) / 40; pts.push([sg * I.X(d), -d]); }
            A.path(pts, { color: ok ? 'red' : 'orange', width: 2.6 });
            A.dot(sg * I.X(h), -h, { r: 5, color: ok ? 'green' : 'red' });
          }
          A.line(I.xo + w / 3, -h, I.xo + w / 3, -h - 0.25, { color: 'muted', width: 2 }); A.line(I.xo + (2 * w) / 3, -h, I.xo + (2 * w) / 3, -h - 0.25, { color: 'muted', width: 2 });
          A.line(I.asym, 0, I.asym, -h, { color: 'muted', width: 1, dash: [3, 4] });
          A.corner(ok ? (third ? 'the line reaches the base inside the middle third' : 'inside the base but outside the middle third: the joint cracks') : 'the line leaves the base: the buttress overturns', 'tl', { color: ok ? 'muted' : 'red' });
          // plot
          const hs = Array.from({ length: 61 }, (_, i) => 0.4 + (i / 60) * 11.6), us = [rg.min, rg.max];
          B.setView([0, 12], [0, Math.max(4, ...hs.map((x) => wReq(rg.max, x))) * 1.1]);
          B.path(hs.map((x) => [x, wReq(rg.min, x)]), { color: 'green', width: 2.2 }); B.path(hs.map((x) => [x, wReq(rg.max, x)]), { color: 'red', width: 2.2 });
          B.hline(info(rg.min, w, h).wInf, { color: 'green', dash: [4, 3], width: 1 }); B.hline(info(rg.max, w, h).wInf, { color: 'red', dash: [4, 3], width: 1 });
          B.dot(h, w, { r: 6, color: 'accent' }); B.text('greatest thrust', 11.8, wReq(rg.max, 11.8), { dy: -12, align: 'right', size: 11.5, color: 'red' }); B.text('least thrust', 11.8, wReq(rg.min, 11.8), { dy: 14, align: 'right', size: 11.5, color: 'green' });
          M = { I, rg, ok, third, w, h, Imin: info(rg.min, w, h), Imax: info(rg.max, w, h), W: g.W };
        });
        v.legend([['red', 'line of thrust'], ['muted', 'limit of the line for a very tall buttress', { dash: true }], ['accent', 'your buttress (plot)']]);
        v.readout(() => {
          if (!M) return '';
          const { I, Imin, Imax } = M;
          return `Arch weight ${f2(M.W, 0)} kN/m; its thrust may be $H$ = ${f2(rg.Hmin, 1)} to ${f2(rg.Hmax, 1)} kN/m with $V_0 = ${f2(I.V0, 1)}$ kN/m at each springing. For the chosen thrust the line meets the base ${f2(Math.abs(I.X(M.h) - I.xo) , 2)} m ${I.X(M.h) >= I.xo ? 'inside' : 'outside'} the outer toe; factor against overturning **${f2(I.FS, 2)}** (least thrust ${f2(Imin.FS, 2)}, greatest ${f2(Imax.FS, 2)}). A very tall buttress needs $w \\ge \\sqrt{2H/\\gamma}$ = ${f2(Imin.wInf, 2)} m (least thrust) to ${f2(Imax.wInf, 2)} m (greatest).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Flying buttresses and pinnacles',
      statement: String.raw`In a Gothic church the thrust of the nave vault is carried over the aisle roof by a **flying buttress** to a slender outer pier. The thrust arrives near the top of the pier; its line, leaving the flyer at the flyer's slope, drifts outward as it descends and, if the pier is slender, leaves the masonry before it reaches the ground. A **pinnacle**, a heavy stone spire on the pier top, adds vertical load on the axis of the pier: the line of thrust steepens toward the vertical and comes back inside. A pinnacle is therefore a stabilising load as well as an ornament, and there is a minimum weight below which the pier is unsafe; adding more than the minimum helps only until the line is well inside.`,
      idea: String.raw`Below the flyer the pier is a buttress as in arch-3.9, with the extra loads at the top: the flyer delivers a horizontal force $H$ and a vertical one $V_B = H\tan\theta$ (the flyer is a strut along the thrust line) at the pier's inner face, and the pinnacle and the pier top add $P + W_{\text{top}}$ on the axis. Moments about the point where the line crosses depth $d$ below the flyer give $X(d) = \bigl(V_B x_i + (P + W_{\text{top}} + \gamma w d)\,x_c + H d\bigr)/\bigl(V_B + P + W_{\text{top}} + \gamma w d\bigr)$. Raising $P$ pulls $X$ toward the axis $x_c$ at every depth, so the smallest pinnacle load that keeps the line inside is found where the line first touches the outer face, which the plot gives for any thrust. Hooke's inversion (arch-3.1) and the safe theorem (arch-3.5) justify drawing just one line that fits.`,
      caption: String.raw`A schematic section: nave wall on the left, a flyer carrying the vault's thrust $H$ to a pier. Raise the thrust (a heavier vault or a wind load), thin the pier, and add pinnacle weight: the red line from the flyer through the pier steepens and re-enters the pier. The plot shows the minimum pinnacle weight needed for each thrust, for this pier; the disc is the current state. All dimensions and loads are illustrative, not those of a real church.`,
      deps: ['arch-3.9'],
      see: ['arch-3.5', 'arch-4.2'],
      refs: ['Heyman'],
      credit: 'Heyman, 1966–67 (structural role of flying buttresses; secondary sources)',
      scope: String.raw`Schematic plane section, unit weight 22 kN/m³, flyer idealised as a straight strut along the line of thrust, per metre of nave length; ignores the weight of the aisle roof and wind pressure on the pier itself. Not the section of any real church.`,
      verify: true,
      tags: ['gothic', 'pinnacle', 'flying buttress'],
      viz(v) {
        const yA = 13, yB = 10.2, yTop = 14, L = 3.6, xi = L, tanT = (yA - yB) / L;
        const Hs = v.slider('vault thrust H (kN/m)', 10, 120, 60, { step: 1 }), wS = v.slider('pier width w (m)', 0.8, 3, 1.5, { step: 0.05 }), Ps = v.slider('pinnacle weight P (kN/m)', 0, 500, 260, { step: 5 });
        const A = v.stage({ x: [-2, 9], y: [-0.8, 19.6], equal: true, axes: false, height: 420, weight: 1.15, title: 'a section: nave, flying buttress and pier' });
        const B = v.stage({ x: [0, 120], y: [0, 500], axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 250, xlabel: 'vault thrust H (kN/m)', ylabel: 'pinnacle weight needed (kN/m)', title: 'how heavy must the pinnacle be?' });
        const model = (H, w, P) => {
          const xc = xi + w / 2, xo = xi + w, Wtop = GAM * w * (yTop - yB), VB = H * tanT + 26;
          const X = (d) => (VB * xi + (P + Wtop + GAM * w * d) * xc + H * d) / (VB + P + Wtop + GAM * w * d);
          let need = 0; for (let k = 0; k <= 60; k++) { const d = (yB * k) / 60, c = (VB * xi + (Wtop + GAM * w * d) * xc + H * d - xo * (VB + Wtop + GAM * w * d)) / (w / 2); need = Math.max(need, c); }
          let worst = Infinity; for (let k = 0; k <= 60; k++) worst = Math.min(worst, xo - X((yB * k) / 60));
          return { xc, xo, Wtop, VB, X, need, worst };
        };
        let M = null;
        v.render(() => {
          const H = Hs.value, w = wS.value, P = Ps.value, m = model(H, w, P), ok = m.worst >= -1e-9;
          A.line(-2, 0, 9, 0, { color: 'faint', width: 1.2 });
          A.rect(-1, 0, 0, yA + 2.2, { fill: 'muted', fillAlpha: 0.14, color: 'ink', width: 1.2 }); A.text('nave wall', -0.5, 1.5, { size: 11, color: 'muted', align: 'center' });
          A.arrow(-1.6, yA, -0.05, yA, { color: 'gold', width: 3, head: 9 }); A.text('vault thrust H', -1.9, yA, { dy: -14, size: 11.5, color: 'gold', align: 'left' });
          // flyer (a strut along the thrust line)
          const nx = tanT / Math.hypot(1, tanT) * 0.3, ny = 1 / Math.hypot(1, tanT) * 0.3;
          A.poly([[0, yA + 0.3], [xi, yB + 0.3], [xi, yB - 0.3], [0, yA - 0.3]], { fill: 'muted', fillAlpha: 0.22, color: 'ink', width: 1.2 });
          A.rect(xi, 0, xi + w, yTop, { fill: 'muted', fillAlpha: 0.22, color: 'ink', width: 1.2 });
          const px = xi + w / 2; A.poly([[xi + 0.12 * w, yTop], [xi + 0.88 * w, yTop], [px, yTop + 3.4]], { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.4 });
          if (P > 0) A.arrow(px, yTop + 3.6 + 0.4 + Math.min(1.3, P / 300), px, yTop + 3.5, { color: 'gold', width: 3, head: 9 });
          // line: A → B, then down the pier
          const pts = [[0, yA], [xi, yB]]; for (let k = 1; k <= 50; k++) { const d = (yB * k) / 50; pts.push([m.X(d), yB - d]); }
          A.path(pts, { color: ok ? 'red' : 'orange', width: 2.8 });
          A.dot(m.X(yB), 0, { r: 5.5, color: ok ? 'green' : 'red' });
          A.corner(ok ? 'the line stays inside the pier' : 'the line leaves the pier: it overturns outward', 'tl', { color: ok ? 'muted' : 'red' });
          // plot
          const Hg = Array.from({ length: 49 }, (_, i) => 5 + i * 2.5), cur = Hg.map((h) => [h, Math.max(0, model(h, w, 0).need)]);
          B.setView([0, 120], [0, 520]);
          B.path(cur, { color: 'accent', width: 2.4 }); B.dot(H, P, { r: 6, color: ok ? 'green' : 'red' });
          B.text('safe: line inside the pier', 6, 480, { size: 12, color: 'green', align: 'left' }); B.text('overturns', 70, 20, { size: 12, color: 'red', align: 'left' });
          M = { m, ok, H, w, P };
        });
        v.legend([['red', 'line of thrust'], ['accent', 'minimum pinnacle weight for this pier'], ['gold', 'thrust and pinnacle weight']]);
        v.readout(() => {
          if (!M) return '';
          const { m, ok, P } = M;
          return `At the foot the line meets the ground ${f2(Math.abs(m.worst), 2)} m ${ok ? 'inside' : 'outside'} the outer face (pier ${f2(M.w, 2)} m wide, flyer at ${f2(deg(Math.atan(tanT)), 0)}° carrying $H = ${M.H}$ kN/m with $V_B = ${f2(m.VB, 0)}$ kN/m). The smallest pinnacle that keeps the line inside this pier is ${f2(m.need > 0 ? m.need : 0, 0)} kN/m; yours is ${P} kN/m, ${P >= m.need ? 'enough' : 'too little'}.`;
        });
      },
    },
  ],
};
