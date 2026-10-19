import { pinnaclePier } from './assessment.shared.js';
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
      idea: String.raw`Below the flyer the pier is a buttress as in arch-3.9, with the extra loads at the top: the flyer delivers a horizontal force $H$ and a vertical one $V_B = H\tan\theta + 26\,\mathrm{kN/m}$ (the flyer is a strut along the thrust line) at the pier's inner face, and the pinnacle and the pier top add $P + W_{\text{top}}$ on the axis. Moments about the point where the line crosses depth $d$ below the flyer give $X(d) = \bigl(V_B x_i + (P + W_{\text{top}} + \gamma w d)\,x_c + H d\bigr)/\bigl(V_B + P + W_{\text{top}} + \gamma w d\bigr)$. Raising $P$ pulls $X$ toward the axis $x_c$ at every depth, so the smallest pinnacle load that keeps the line inside is found where the line first touches the outer face, which the plot gives for any thrust. Hooke's inversion (arch-3.1) and the safe theorem (arch-3.5) justify drawing just one line that fits.`,
      caption: String.raw`A schematic section: nave wall on the left, a flyer carrying the vault's thrust $H$ to a pier. Raise the thrust (a heavier vault or a wind load), thin the pier, and add pinnacle weight: the red line from the flyer through the pier steepens and re-enters the pier. The plot shows the minimum pinnacle weight needed for each thrust, for this pier; the disc is the current state. All dimensions and loads are illustrative, not those of a real church.`,
      deps: ['arch-3.9'],
      see: ['arch-3.5', 'arch-4.2'],
      refs: ['Heyman'],
      credit: 'Heyman, 1966–67 (structural role of flying buttresses; secondary sources)',
      scope: String.raw`Schematic plane section, unit weight 22 kN/m³, flyer idealised as a straight strut plus an illustrative 26-kN/m vertical dead load applied to the pier at the flyer level, per metre of nave length; ignores the weight of the aisle roof and wind pressure on the pier itself. Not the section of any real church.`,
      verify: true,
      tags: ['gothic', 'pinnacle', 'flying buttress'],
      viz(v) {
        const yA = 13, yB = 10.2, yTop = 14, L = 3.6, xi = L, tanT = (yA - yB) / L;
        const Hs = v.slider('vault thrust H (kN/m)', 10, 120, 60, { step: 1 }), wS = v.slider('pier width w (m)', 0.8, 3, 1.5, { step: 0.05 }), Ps = v.slider('pinnacle weight P (kN/m)', 0, 3000, 260, { step: 5 });
        const A = v.stage({ x: [-2, 9], y: [-0.8, 19.6], equal: true, axes: false, height: 420, weight: 1.15, title: 'a section: nave, flying buttress and pier' });
        const B = v.stage({ x: [0, 120], y: [0, 500], axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 250, xlabel: 'vault thrust H (kN/m)', ylabel: 'pinnacle weight needed (kN/m)', title: 'how heavy must the pinnacle be?' });
        const model = pinnaclePier;
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
          const Hg = Array.from({ length: 49 }, (_, i) => i * 2.5), cur = Hg.map((h) => [h, Math.max(0, model(h, w, 0).need)]);
          B.setView([0, 120], [0, Math.max(520, 1.1 * P, ...cur.map(p => 1.1 * p[1]))]);
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
    // ───────────────────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Pointed versus round arches',
      statement: String.raw`A pointed (two-centred) arch is built from two circular arcs whose centres lie on the springing line, each on the far side of the axis, at distance $e$ from it; the eccentricity $\xi = e/(R - e)$ measures the pointedness ($\xi = 0$ is the round arch, $\xi = 1$ the equilateral arch whose radius equals its span). For the same span a pointed arch is taller, and so its thrust lines are steeper: its horizontal thrust per unit of weight is smaller, the least thickness that can stand under its own weight falls (from $t/R = 0.1075$ for the semicircle to about $0.040$ for the equilateral arch, with radial joints), and a concentrated load at the crown, such as a heavy keystone, a lantern or a pinnacle, can be larger for the same ring. The price is paid elsewhere: more height for the same span and, in a vault, more wall.`,
      idea: String.raw`For an arch with a crown hinge and two haunch hinges, $H = M/f$: the bending moment at the crown that the weights induce, divided by the rise $f$, so more rise means less thrust (arch-3.2). A load at the crown is the interesting case: the funicular polygon of one concentrated load is two straight lines meeting at the load, a peak, and a pointed profile follows it much more closely than a semicircle does, so the thrust line stays inside a much thinner ring. The numbers on the plots are computed by the linear program of arch-3.5 for radial joints; the values for the minimum thickness agree with the tabulated ones for $\alpha = 90^\circ$ to within about 1%.`,
      caption: String.raw`Slide the pointedness $\xi$ from round (0) through equilateral (1) to lancet (3) and watch the arch, its lowest and highest thrust lines, and the crown load it can carry (gold arrow; its share of the arch's own weight is the slider). The plots show, for the current thickness, how the allowed thrust and the largest crown load change with $\xi$. Thin the ring so that the round arch falls and the pointed one stands.`,
      deps: ['arch-3.2'],
      see: ['arch-3.7', 'arch-4.2'],
      refs: ['Heyman'],
      scope: String.raw`Plane two-centred arch of half-span 1, constant thickness, radial joints, self-weight plus a point load on the crown; the result depends on the way the joints are cut (Gaspar et al. 2021 study this for pointed arches), here radial.`,
      tags: ['pointed arch', 'gothic', 'thrust'],
      viz(v) {
        const N = 40, half = N / 2;
        const xS = v.slider('pointedness ξ = e/(R − e)', 0, 3, 1, { step: 0.05 }), tS = v.slider('thickness t (half-span = 1)', 0.04, 0.3, 0.12, { step: 0.005 }), pS = v.slider('crown load, share of the arch weight', 0, 2, 0.15, { step: 0.01 });
        const PUB = [[0, 0.10748], [0.1, 0.08856], [0.2, 0.07587], [0.25, 0.0709], [0.33, 0.06399], [0.5, 0.0537], [0.6, 0.04902], [0.8, 0.0418], [1, 0.03964], [1.5, 0.03855], [2, 0.03588], [2.5, 0.03303], [3, 0.03038]];
        const A = v.stage({ x: [-1.4, 1.4], y: [-0.2, 3.1], equal: true, axes: false, height: 340, weight: 1.2, title: 'the arch' });
        const B = v.stage({ x: [0, 3], y: [0, 0.5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 220, xlabel: 'pointedness ξ', ylabel: 'H / W', title: 'allowed horizontal thrust' });
        const C = v.stage({ x: [0, 3], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 220, xlabel: 'pointedness ξ', ylabel: 'largest crown load / W', title: 'crown load the ring can carry' });
        const mk = (xi, t) => arch({ R: 1 + xi, e: xi, t, N });
        const crown = (g, P, vr) => [{ x: -1e-3, P: P / 2, k: half - 1, var: vr }, { x: 1e-3, P: P / 2, k: half, var: vr }];
        const cache = new Map();
        const curves = (t) => {
          const key = t.toFixed(4); if (cache.has(key)) return cache.get(key);
          const out = []; for (let i = 0; i <= 20; i++) { const xi = i * 0.15, g = mk(xi, t), r = thrustRange(g, []), c = r ? collapseFactor(g, crown(g, g.W, true)) : null; out.push({ xi, lo: r ? r.Hmin / g.W : NaN, hi: r ? r.Hmax / g.W : NaN, cap: c ? c.lam : NaN }); }
          if (cache.size > 10) cache.clear(); cache.set(key, out); return out;
        };
        let M = null;
        v.render(() => {
          const xi = xS.value, t = tS.value, g = mk(xi, t), rg = thrustRange(g, []), cv = curves(t);
          A.setView([-1.4, 1.4], [-0.2, g.rise + 0.55]);
          drawArch(v, A, g, { fillAlpha: 0.12 });
          const P = pS.value * g.W, cf = rg ? collapseFactor(g, crown(g, g.W, true)) : null, ok = rg && cf && P <= cf.lam * g.W + 1e-9;
          if (rg) {
            for (const [u, c] of [[rg.min, 'accent'], [rg.max, 'green']]) { const tl = thrustLine(g, [], u); for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: 'muted', width: 1.2, dash: [4, 3] }); }
            if (P > 0) { const lo = crown(g, P, false), c = centralLine(g, lo); if (c) drawThrust(v, A, thrustLine(g, lo, c.u), { color: 'red', width: 2.6 }); const yt = g.joints[half].b[1]; A.arrow(0, yt + 0.25 + 0.6 * Math.min(1, pS.value), 0, yt + 0.02, { color: 'gold', width: 3.5, head: 10 }); }
            else { const c = centralLine(g, []); if (c) drawThrust(v, A, thrustLine(g, [], c.u), { color: 'red', width: 2.6 }); }
          }
          A.corner(!rg ? 'no thrust line fits: the arch falls under its own weight' : ok ? 'stands under the crown load' : 'the crown load is too big: it collapses', 'tl', { color: ok ? 'muted' : 'red' });
          // plots
          const good = cv.filter((c) => Number.isFinite(c.lo));
          B.setView([0, 3], [0, Math.max(0.3, ...good.map((c) => c.hi)) * 1.1]);
          if (good.length) B.poly([...good.map((c) => [c.xi, c.hi]), ...good.slice().reverse().map((c) => [c.xi, c.lo])], { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.4 });
          B.vline(xi, { color: 'accent', width: 1.6, dash: [4, 3] });
          const capg = cv.filter((c) => Number.isFinite(c.cap)); C.setView([0, 3], [0, Math.max(0.5, ...capg.map((c) => c.cap)) * 1.1]);
          if (capg.length) C.path(capg.map((c) => [c.xi, c.cap]), { color: 'gold', width: 2.6 });
          C.vline(xi, { color: 'accent', width: 1.6, dash: [4, 3] }); C.hline(pS.value, { color: 'red', width: 1.2, dash: [3, 3] });
          if (rg && cf) C.dot(xi, cf.lam, { r: 5.5, color: 'gold' });
          M = { g, rg, cf, ok, P, tmin: null };
        });
        v.legend([['green', 'allowed thrust (plot)', { area: true }], ['red', 'line of thrust under the crown load'], ['muted', 'lowest and highest lines, self-weight only', { dash: true }], ['gold', 'crown load']]);
        v.readout(() => {
          if (!M) return '';
          const { g, rg, cf } = M, xi = xS.value;
          const f = bestFit((t) => mk(xi, t), () => [], {}, 1e-3, 0.6, 22), pub = PUB.find((p) => Math.abs(p[0] - xi) < 0.011);
          const tmin = f ? f.t / g.R : NaN;
          return `Rise ${f2(g.rise, 2)} for a span of 2; ${rg ? `self-weight thrust from ${f2(rg.Hmin / g.W, 3)} to ${f2(rg.Hmax / g.W, 3)} of the arch weight (${f2(rg.Hmin, 1)} to ${f2(rg.Hmax, 1)} kN/m)` : 'this ring is below the minimum thickness'}. Minimum thickness $t_{\\min}/R = ${f2(tmin, 4)}$${pub ? ` (tabulated: ${pub[1]})` : ''}; largest crown load ${cf ? f2(cf.lam, 2) + ' W = ' + f2(cf.lam * g.W, 1) + ' kN/m' : '—'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Method',
      name: 'Medieval rules of proportion for buttresses',
      statement: String.raw`Long before the line of thrust was understood, builders sized buttresses by geometric rules: the depth is a fixed fraction of the span, or follows from a construction drawn on the arch itself. In Huerta's survey the Gothic rules give a depth of nearly a quarter of the span and the Renaissance rules between a third and a half; a late-Gothic manuscript on the choir sets the wall at a tenth of the span and the buttress at three times that, three tenths. A geometrical rule of Gothic origin, recorded by Derand (1643) and later called Blondel's rule, divides the intrados of the arch into three equal parts, joins the first division point to the springing, and prolongs that line by its own length: the end point gives the depth of the buttress. All these rules are proportional, so the same ratio serves a span of 10 m or 100 m. Checking them against the thrust-line calculation of arch-3.9 shows how much margin each leaves, and how the construction adapts to a pointed or a flat arch.`,
      idea: String.raw`A rule that scales with the span is consistent with statics: arch weight, thrust $H$ and buttress weight all scale with the same power of the size, so the line of thrust enters the base at the same fraction of the span however large the building is (Galileo's square-cube argument concerns stresses, which the safe theorem does not use, arch-3.5). The Derand construction makes the depth depend on the arch's shape through the position of the first third-point of the intrados: for a semicircle it is exactly a quarter of the span, a pointed arch gives less, a flatter one more, which follows the trend of the thrust (pointed arches push less, arch-3.11). The calculation below takes the least and the greatest thrust compatible with the ring (arch-3.5) and finds the width at which the line of thrust just reaches the outer toe of a buttress of the chosen height, with the closed formula of arch-3.9.`,
      caption: String.raw`Choose an arch shape and a buttress height. The picture draws the Derand construction on the intrados (division points, the line from the springing to the first division point and its prolongation to F), the buttress with the depth the selected rule gives, and the line of thrust through arch and buttress. The plot compares the rule widths (horizontal lines) with the width needed against overturning, for the least and the greatest thrust of the arch, as the buttress gets taller. All widths are fractions of the clear span (the intrados). The rule is one reading of a verbal description (see scope); the other two are the proportions quoted in the survey.`,
      deps: ['arch-3.9'],
      see: ['arch-3.10', 'arch-3.11'],
      refs: ['Heyman'],
      credit: 'Gothic geometrical rule, set down by Derand in 1643; survey by Huerta, 2006',
      scope: String.raw`The Derand construction is read here as: the first third-point of the intrados, by length, is joined to the springing, and the buttress depth is the horizontal distance from the springing to that point (the prolonged line ends at its mirror image, so the depth is the same). This reading gives exactly span/4 for a semicircle, matching "nearly a quarter of the span" for Gothic rules; I did not see Derand's own text. The comparison uses plain rectangular buttresses of the same masonry as the arch, no surcharge, self-weight only.`,
      verify: true,
      tags: ['proportion', 'gothic', 'buttress'],
      viz(v) {
        const N = 40, S = 5, span = 10;
        const shape = v.select('arch shape', [{ value: 'round', label: 'round' }, { value: 'equi', label: 'equilateral' }, { value: 'lancet', label: 'lancet' }, { value: 'seg', label: 'segmental 120°' }], 'round');
        const rule = v.select('rule shown', [{ value: 'derand', label: 'Derand construction' }, { value: 'q', label: 'span / 4' }, { value: 'tenth', label: '3 span / 10' }], 'derand');
        const tS = v.slider('ring thickness / span', 0.04, 0.16, 0.08, { step: 0.005 }), hS = v.slider('buttress height / span', 0.2, 3, 1, { step: 0.02 }), st = v.select('thrust of the arch', [{ value: 'min', label: 'least' }, { value: 'max', label: 'greatest' }], 'max');
        const A = v.stage({ x: [-9, 9], y: [-12, 9], equal: true, axes: false, height: 340, weight: 1.5, title: 'the Derand construction and the thrust line' });
        const B = v.stage({ x: [0, 3], y: [0, 0.6], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'buttress height / span', ylabel: 'width / span', title: 'rules against the width needed' });
        const mkArch = (k, tr) => (k === 'round' ? arch({ R: S, t: tr * span, N, gamma: GAM }) : k === 'equi' ? arch({ R: 2 * S, e: S, t: tr * span, N, gamma: GAM }) : k === 'lancet' ? arch({ R: 3 * S, e: 2 * S, t: tr * span, N, gamma: GAM }) : arch({ R: S / Math.sin(Math.PI / 3), t: tr * span, N, alpha: Math.PI / 3, gamma: GAM }));
        const third = (g) => { const P = g.joints.map((J) => J.a), cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const tot = cum[cum.length - 1], at = (s) => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1]); return [P[i - 1][0] + f * (P[i][0] - P[i - 1][0]), P[i - 1][1] + f * (P[i][1] - P[i - 1][1])]; }; return { C: at(tot / 3), Bp: at((2 * tot) / 3) }; };
        let M = null;
        v.render(() => {
          const g = mkArch(shape.value, tS.value), rg = thrustRange(g, []), SP = g.span, h = hS.value * SP, D = g.joints[0].a, { C, Bp } = third(g);
          const wD = C[0] - D[0], rules = { derand: wD, q: SP / 4, tenth: (3 * SP) / 10 }, w = rules[rule.value];
          const need = (u, hh) => { const tl = thrustLine(g, [], u), x0 = tl[0].p[0], H = u[0], V0 = u[1], c = V0 * (x0 - D[0]) - H * hh; return (-V0 + Math.sqrt(V0 * V0 - 2 * GAM * hh * c)) / (GAM * hh); };
          A.setView([-S * 1.9 - 1, S * 1.9 + 1], [-h - 1.5, g.rise + 1.8]);
          drawArch(v, A, g, { fillAlpha: 0.12 });
          if (!rg) { A.corner('this ring cannot stand', 'tl', { color: 'red' }); return; }
          const u = rg[st.value], tl = thrustLine(g, [], u), x0 = tl[0].p[0], H = u[0], V0 = u[1], xo = D[0] - w, xc = D[0] - w / 2, X = (d) => (V0 * x0 + GAM * w * d * xc - H * d) / (V0 + GAM * w * d), ok = X(h) >= xo - 1e-9;
          const FS = (V0 * (x0 - xo) + (GAM * w * w * h) / 2) / (H * h);
          for (const sg of [-1, 1]) { A.rect(sg < 0 ? xo : -D[0], -h, sg < 0 ? D[0] : -xo, 0, { fill: 'muted', fillAlpha: 0.2, color: 'ink', width: 1.2 }); }
          A.line(-S * 1.9, -h, S * 1.9, -h, { color: 'faint', width: 1 });
          drawThrust(v, A, tl, { color: 'red', width: 2.2 });
          for (const sg of [-1, 1]) { const pts = [[sg * x0, 0]]; for (let k = 1; k <= 40; k++) { const d = (h * k) / 40; pts.push([sg * X(d), -d]); } A.path(pts, { color: ok ? 'red' : 'orange', width: 2.4 }); }
          // construction
          const F = [2 * D[0] - C[0], 2 * D[1] - C[1]];
          A.line(F[0], F[1], C[0], C[1], { color: 'purple', width: 1.6, dash: [5, 3] }); A.dot(C[0], C[1], { r: 4.5, color: 'purple' }); A.dot(Bp[0], Bp[1], { r: 4.5, color: 'purple' }); A.dot(F[0], F[1], { r: 4.5, color: 'purple' }); A.dot(D[0], D[1], { r: 3.5, color: 'ink' });
          A.text('C', C[0], C[1], { dx: 9, dy: -8, size: 12, color: 'purple', weight: 650 }); A.text('B', Bp[0], Bp[1], { dx: -9, dy: -8, size: 12, color: 'purple', weight: 650, align: 'right' }); A.text('F', F[0], F[1], { dx: -9, dy: 6, size: 12, color: 'purple', weight: 650, align: 'right' });
          A.line(D[0], -h - 0.9, D[0] - wD, -h - 0.9, { color: 'purple', width: 2 }); A.line(D[0], -h - 1.3, D[0] - w, -h - 1.3, { color: 'ink', width: 2 });
          A.corner(ok ? 'the line stays inside the base' : 'the line leaves the base: overturns', 'tl', { color: ok ? 'muted' : 'red' });
          // plot
          const hs = Array.from({ length: 60 }, (_, i) => 0.05 + (i / 59) * 2.95), lo = hs.map((x) => [x, need(rg.min, x * SP) / SP]), hi = hs.map((x) => [x, need(rg.max, x * SP) / SP]);
          B.setView([0, 3], [0, Math.max(0.35, ...hi.map((p) => p[1])) * 1.12]);
          B.path(lo, { color: 'green', width: 2.2 }); B.path(hi, { color: 'red', width: 2.2 });
          B.hline(wD / SP, { color: 'purple', width: 1.6 }); B.hline(0.25, { color: 'gold', width: 1.2, dash: [4, 3] }); B.hline(0.3, { color: 'orange', width: 1.2, dash: [4, 3] });
          B.dot(hS.value, w / SP, { r: 6, color: 'accent' });
          M = { g, rg, w, wD, FS, ok, h, FSmin: (() => { const uu = rg.min, tl2 = thrustLine(g, [], uu); return (uu[1] * (tl2[0].p[0] - xo) + (GAM * w * w * h) / 2) / (uu[0] * h); })(), need: [need(rg.min, h), need(rg.max, h)], SP };
        });
        v.legend([['purple', 'Derand width'], ['gold', 'span/4', { dash: true }], ['orange', '3 span/10', { dash: true }], ['green', 'needed, least thrust'], ['red', 'needed, greatest thrust'], ['accent', 'rule selected (disc)']]);
        v.readout(() => {
          if (!M || !M.rg) return '';
          return `Derand width ${f2(M.wD / M.SP, 3)} of the span of the intrados (a semicircle gives 0.250). Selected rule: ${f2(M.w / M.SP, 3)} of the span; width needed for stability at this height: ${f2(M.need[0] / M.SP, 3)} (least thrust) to ${f2(M.need[1] / M.SP, 3)} (greatest thrust). Factor against overturning with the selected width: ${f2(M.FSmin, 2)} (least thrust) and ${f2(M.FS, 2)} (the thrust shown).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'A Description of Helioscopes, and Some Other Instruments',
      paper: { authors: 'Robert Hooke', year: 1676, title: 'A Description of Helioscopes, and Some Other Instruments', venue: 'London, 1676; the arch is announced as an anagram, deciphered after his death (published 1705): “Ut pendet continuum flexile, sic stabit contiguum rigidum inversum”', url: 'https://archive.org/details/bim_early-english-books-1641-1700_a-description-of-heliosc_hooke-robert_1676' },
      introduces: ['arch-3.1'],
      statement: String.raw`In a list of inventions that he intended to publish, appended to this small book of instruments, Hooke named as the second "the true mathematical and mechanical form of all manner of arches for building, with the true butment necessary to each of them", a problem, he wrote, that no architectural writer had attempted, still less solved. He gave the answer only as an anagram, the letters of a Latin sentence set in alphabetical order. The sentence, deciphered after his death, is *ut pendet continuum flexile, sic stabit contiguum rigidum inversum*: as the flexible line hangs, so, inverted, the rigid arch will stand. In modern terms: the shape of a hanging chain turned upside down is the line of thrust of an arch carrying the same weights, so the arch, built along it, is in pure compression.`,
      idea: String.raw`Before Hooke the arch was designed by rules of proportion (arch-3.12) and by the geometry of the circle or the pointed arch; Galileo had compared the hanging chain with a parabola, and the equation of the chain (the catenary) was found only in 1691, by Leibniz, Huygens and Johann Bernoulli. Hooke's idea is not an equation but a principle: tension and compression are the same equilibrium with opposite sign (arch-1.4, arch-1.5), so any arch with any weights has a hanging chain that is its mirror image, and the mason can draw it with a string. He introduced what arch-3.1 calls Hooke's inversion; it passed to Poleni's analysis of St Peter's dome (1748, arch-4.6), to the funicular models of Gaudí, and to the safe theorem (arch-3.5). With equal links the chain is the catenary, and a ring of constant thickness laid along it carries its own weight with essentially no thickness at all (the picture computes this; the semicircle, by contrast, needs $t/R \ge 0.1075$, arch-3.7).`,
      caption: String.raw`The paper contains no figure or data for this: what is recreated is the experiment its anagram describes. Left, a chain of 24 equal links hangs from two pins; right, the same curve inverted with 24 voussoirs of constant thickness laid along it. Choose the rise and the thickness, then push part of the arch off the inverted chain with **bump**: the line of thrust can no longer follow the curve, and the thickness the ring then needs rises. Press **decipher** to turn the alphabetised letters of the solution back into Hooke's sentence.`,
      deps: ['arch-2.1'],
      refs: [],
      credit: 'R. Hooke, 1676',
      scope: String.raw`Modern reconstruction. The letters shown are the alphabetised letters of the deciphered sentence (with u for v, as in 17th-century type); the printed 1676 string is not reproduced because the scan I could read is too corrupt and transcriptions differ in a few letters. The deciphering is reported (secondary sources) as published in 1705 after Hooke's death, which I have not seen.`,
      verify: true,
      tags: ['hooke', 'history', 'catenary'],
      links: { archive: 'https://archive.org/details/bim_early-english-books-1641-1700_a-description-of-heliosc_hooke-robert_1676', wikipedia: 'https://en.wikipedia.org/wiki/Catenary' },
      viz(v) {
        const M_ = 24, phrase = 'ut pendet continuum flexile sic stabit contiguum rigidum inversum', letters = phrase.replace(/[^a-z]/g, '').replace(/v/g, 'u').split('').sort().join('');
        let shown = false;
        const hS = v.slider('rise of the chain / half-span', 0.2, 1.3, 0.7, { step: 0.01 }), tS = v.slider('thickness of the ring', 0.005, 0.12, 0.05, { step: 0.0025 });
        const bS = v.slider('bump: push the arch off the chain', -0.2, 0.2, 0, { step: 0.005 }), xS = v.slider('bump position', -0.85, 0.85, -0.4, { step: 0.01 });
        v.button('decipher the anagram', () => { shown = !shown; });
        const S = v.stage({ x: [-1.4, 1.4], y: [-1.5, 0.25], equal: true, axes: false, height: 280, title: 'a chain of equal links hangs' });
        const A = v.stage({ x: [-1.4, 1.4], y: [-0.25, 1.5], equal: true, axes: false, height: 280, title: 'turned over: the arch' });
        const catA = (h) => { let lo = 0.02, hi = 200; for (let i = 0; i < 80; i++) { const a = Math.sqrt(lo * hi); if (a * (Math.cosh(1 / a) - 1) > h) lo = a; else hi = a; } return Math.sqrt(lo * hi); };
        let Mo = null;
        v.render(() => {
          const h = hS.value, a = catA(h), Sl = a * Math.sinh(1 / a), amp = bS.value, xb = xS.value;
          const base = Array.from({ length: M_ + 1 }, (_, j) => { const s = -Sl + (2 * Sl * j) / M_, x = a * Math.asinh(s / a); return [x, a * (Math.cosh(1 / a) - Math.cosh(x / a))]; });
          const pts = base.map(([x, y]) => [x, y + amp * Math.exp(-(((x - xb) / 0.22) ** 2)) * (1 - x * x)]);
          const mk = (t) => archFromLine(pts, t, GAM), g = mk(tS.value), rg = thrustRange(g, []), c = rg ? centralLine(g, []) : null, fit = bestFit(mk, () => [], {}, 1e-4, 1, 24);
          const u = c ? c.u : fit ? fit.u : rg ? rg.min : null, tl = u ? thrustLine(g, [], u) : null;
          const curve = Array.from({ length: 81 }, (_, i) => { const x = -1 + (2 * i) / 80; return [x, a * (Math.cosh(1 / a) - Math.cosh(x / a))]; });
          S.path(curve.map(([x, y]) => [x, -y]), { color: 'red', width: 2.4 }); base.forEach(([x, y]) => S.dot(x, -y, { r: 3.2, color: 'accent' })); for (const x of [-1, 1]) S.dot(x, 0, { r: 5.5, color: 'ink' });
          S.text(`catenary: equal links, $y = a\\cosh(x/a)$ with $a = ${f2(a, 3)}$`, 0, -h - 0.25, { size: 12, color: 'muted', align: 'center' });
          drawArch(v, A, g, { fillAlpha: 0.14 });
          A.path(curve, { color: 'muted', width: 1.4, dash: [5, 4] });
          if (tl) drawThrust(v, A, tl, { color: c ? 'red' : 'orange', width: 2.6 });
          A.corner(c ? 'a line of thrust fits: the arch stands' : 'no line fits: the arch falls', 'tl', { color: c ? 'muted' : 'red' });
          for (const x of [-1, 1]) A.dot(x, 0, { r: 5.5, color: 'ink' });
          v.legend([['red', 'chain / line of thrust'], ['muted', 'inverted catenary', { dash: true }], ['accent', 'links']]);
          Mo = { a, g, rg, c, fit, h };
        });
        v.readout(() => {
          if (!Mo) return '';
          const { fit, rg, c, g } = Mo;
          const txt = shown ? `**Ut pendet continuum flexile, sic stabit contiguum rigidum inversum**: “as hangs the flexible line, so, inverted, will the rigid arch stand”.` : `Alphabetised letters of the solution (${letters.length}): ${letters}`;
          return `${txt}\nWith the ring ${tS.value.toFixed(3)} thick (half-span 1) and the bump ${bS.value.toFixed(3)}: the smallest ring that fits a thrust line is $t_{\\min} ${fit && fit.t < 5e-4 ? '< 0.0005' : '= ' + f2(fit ? fit.t : NaN, 4)}$; ${c ? `the line is ${f2(c.eps, 3)} from the nearest edge at its best.` : 'the ring is too thin: the line leaves the stone.'}${bS.value === 0 ? ' (With no bump the ring follows the chain, and any thickness will do.)' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'The Stone Skeleton',
      paper: { authors: 'Jacques Heyman', year: 1966, title: 'The stone skeleton', venue: 'International Journal of Solids and Structures 2 (2): 249–279', doi: '10.1016/0020-7683(66)90018-7' },
      introduces: ['arch-3.4', 'arch-3.5'],
      statement: String.raw`Heyman's paper argues that the safety of a masonry structure is a question of geometry and equilibrium, not of stress. If masonry has no tensile strength, has compressive strength that is never approached, and does not slide (arch-3.4), a structure of it is a rigid-plastic body to which the theorems of plastic theory apply: a thrust line inside the masonry, in equilibrium with the loads, proves the structure safe (arch-3.5), and collapse comes by the formation of hinges (arch-3.6). He works the idea out for the arch and for the Gothic cathedral, where the flying buttress and the quadripartite vault are treated in some detail, with a brief look at domes. The practical consequence is that safety is measured by proportions, not by stress: an arch and a copy of it ten times larger are equally safe in this sense, while their stresses differ tenfold.`,
      idea: String.raw`Earlier writers, from Couplet (1730), had used thrust lines and hinge mechanisms, and the same three conditions were the working hypotheses for calculating masonry arches throughout the nineteenth century; the dominant tool, however, was the search for the one true state of stress, which depends on small support movements nobody can know. Heyman explicitly credits Kooharian’s earlier limit-analysis result (1953) and develops its consequences for the Gothic structural system: one admissible state suffices for the safe theorem, so the true state, with its cracks and settlements, need not be found. The paper makes the three assumptions (arch-3.4) and the safe theorem (arch-3.5) its working basis, and applies them to arches, vaults and buttresses; later work (arch-3.7, arch-3.8) turned them into numbers such as the minimum thickness and the effect of settlement.`,
      caption: String.raw`The paper's own figures and numbers are not reproduced (I did not have the full text): what is recreated is its argument. The map on the right shows, for a semicircular arch with a point load at the chosen position, which combinations of ring thickness and load stand (green) and which do not (red); drag the disc. The arch on the left shows the thrust line that fits, or, when none does, the line at the instant of collapse with its hinges. The readout gives the two safety measures that follow: the geometric factor $t/t_{\min}$ and the load factor, and the stress, which grows with the span.`,
      deps: ['arch-3.2', 'solid-4.10'],
      refs: ['Heyman (1966), The stone skeleton, pp. 252–259 (assumptions, limit principles and arches), pp. 260–278 (buttresses and vaults); doi:10.1016/0020-7683(66)90018-7'],
      credit: 'J. Heyman, 1966',
      scope: String.raw`Reconstruction of the argument for a semicircular arch with radial joints, self-weight 22 kN/m³ and one point load; the paper's own examples (cathedral section, vault, flying buttress) and numbers are not used. The complete original-paper text was read in a third-party OCR transcription, including its material assumptions, limit-design principles and arch/vault/buttress sections. The scan’s figures and several OCR-damaged equations still need inspection before full source closure; the picture uses its own explicitly reconstructed data.`,
      verify: true,
      tags: ['heyman', 'limit analysis', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Line_of_thrust' },
      viz(v) {
        const N = 24, xS = v.slider('load position x / R', -0.92, 0.92, -0.5, { step: 0.01 }), spS = v.slider('span of the real arch (m)', 5, 150, 20, { log: true });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.25, 1.45], equal: true, axes: false, height: 340, weight: 1.35, title: 'the arch' });
        const B = v.stage({ x: [0.1, 0.4], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'ring thickness t / R', ylabel: 'point load / arch weight', title: 'map of safety: drag the disc' });
        const hnd = B.handle(0.2, 0.25, { color: 'accent', r: 8, constrain: { x: [0.1, 0.4], y: [0, 3] } });
        const bound = new Map();
        const curve = (x) => { const key = x.toFixed(3); if (bound.has(key)) return bound.get(key); const pts = []; for (let i = 0; i <= 30; i++) { const t = 0.1 + (0.3 * i) / 30, g = arch({ R: 1, t, N }), c = collapseFactor(g, [{ x, P: g.W, var: true, k: blockAt(g, x) }]); pts.push([t, c ? c.lam : 0]); } if (bound.size > 8) bound.clear(); bound.set(key, pts); return pts; };
        let M = null;
        v.render(() => {
          const x = xS.value, pts = curve(x), t = hnd.x, share = hnd.y, g = arch({ R: 1, t, N }), k = blockAt(g, x), loadsV = [{ x, P: g.W, var: true, k }], cf = collapseFactor(g, loadsV);
          const ymax = Math.min(3, Math.max(0.6, ...pts.map((p) => p[1]))) * 1.05; B.setView([0.1, 0.4], [0, ymax]); if (hnd.y > ymax) hnd.set(hnd.x, ymax);
          B.poly([...pts.map((p) => [p[0], Math.min(p[1], ymax)]), [0.4, 0], [0.1, 0]], { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.8 });
          B.poly([...pts.map((p) => [p[0], Math.min(p[1], ymax)]), [0.4, ymax], [0.1, ymax]], { fill: 'red', fillAlpha: 0.1, color: 'red', stroke: false });
          B.text('stands', 0.3, ymax * 0.12, { size: 12, color: 'green', align: 'center' }); B.text('collapses', 0.3, ymax * 0.92, { size: 12, color: 'red', align: 'center' });
          drawArch(v, A, g, { fillAlpha: 0.12 });
          const yl = extradosY(g, x), lam = cf ? cf.lam : 0, stands = cf && share <= lam + 1e-9;
          let u = null, hs = [];
          if (stands) { const lo = [{ x, P: share * g.W, k }], c = centralLine(g, lo); if (c) { u = c.u; const rg = thrustRange(g, lo); if (rg) for (const uu of [rg.min, rg.max]) { const tl = thrustLine(g, lo, uu); for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: 'muted', width: 1.1, dash: [4, 3] }); } drawThrust(v, A, thrustLine(g, lo, c.u), { color: 'green', width: 2.8 }); } }
          else if (cf) { u = cf.u; drawThrust(v, A, thrustLine(g, loadsV, cf.u), { color: 'red', width: 2.8 }); hs = hinges(g, loadsV, cf.u, {}, 1e-6); for (const h of hs) { const p = h.side === 'a' ? g.joints[h.j].a : g.joints[h.j].b; A.dot(p[0], p[1], { r: 5.5, color: 'red' }); } }
          else A.corner('this ring cannot even stand alone', 'tl', { color: 'red' });
          if (share > 0) A.arrow(x, yl + 0.15 + 0.6 * Math.min(1, share), x, yl + 0.02, { color: 'gold', width: 3.5, head: 10 });
          if (cf) A.corner(stands ? 'a thrust line fits: safe' : 'no thrust line fits: collapse (hinges shown)', 'tl', { color: stands ? 'green' : 'red' });
          const fit = share > 0 ? bestFit((tt) => arch({ R: 1, t: tt, N }), (gg) => [{ x, P: share * gg.W, k: blockAt(gg, x) }], {}, 0.05, 0.6, 22) : bestFit((tt) => arch({ R: 1, t: tt, N }), () => [], {}, 0.05, 0.6, 22);
          let F = 0; if (u) { const tl = thrustLine(g, stands ? [{ x, P: share * g.W, k }] : loadsV, u); F = Math.max(...tl.map((q) => Math.hypot(...q.F))); }
          M = { g, cf, share, stands, tmin: fit ? fit.t : NaN, F, t, lam };
        });
        v.legend([['green', 'thrust line that fits'], ['red', 'line at collapse, hinges'], ['muted', 'lowest and highest lines', { dash: true }]]);
        v.readout(() => {
          if (!M || !M.cf) return 'This ring cannot stand even under its own weight.';
          const R = spS.value / 2, stress = (M.F * R) / M.t / 1000;
          return `Ring $t/R = ${f2(M.t, 3)}$, point load ${f2(M.share, 2)} of the arch weight at $x = ${f2(xS.value, 2)}\\,R$. Collapse load ${f2(M.lam, 2)} W, so the **load factor** is ${M.share > 0 ? f2(M.lam / M.share, 2) : '∞'}; the thinnest ring that would carry this load is $t_{\\min}/R = ${f2(M.tmin, 3)}$, so the **geometric factor** is $t/t_{\\min} = ${f2(M.t / M.tmin, 2)}$ — neither depends on the size of the arch.\nFor a span of ${spS.value.toFixed(0)} m the largest force in the arch is about ${f2((M.F * R * R) / 1, 0)} kN/m, a mean stress of roughly ${f2(stress, 2)} MPa over the joint: it grows in proportion to the span while the safety measures above do not.`;
        });
      },
    },
  ],
};
