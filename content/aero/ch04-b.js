// Aerospace Engineering — Chapter 4 (part b): items 4.5-4.8. Sources and caveats: see the header of ch04.js and ch04.shared.js.
// Reviewed 2026-10-18: full NASA/NACA sources and numerical checks are recorded in docs/verification/aero-ch04.md.
//   4.5 NASA Glenn's complete oblique-shock and Prandtl-Meyer technical descriptions; history narrowed to Ackeret TM317 p2's primary citation of Meyer1908.
//   4.6 Ackeret's full NACA TM317 translation pp1–8, original venue/date footnote p1, linear pressure/lift/drag pp5–7; Chapman NACA TR1063 p6.
//   4.7 Sutton–Graves TRR376 pp1–2,12–17; NASA TFAWS2012 Lecture1 pp15–18,28–29 provides SI coefficient, catalytic assumption and wall-temperature balance.
//   4.8 Whitcomb's full RML52H08 pp1–12, including limitations and indentation experiments, replaces the secondary summary. Numerical curves are not the paper's data.

import {
  clamp, DEG, atmo, G, GM1, cpCrit, thetaOf, thetaMax, shockAngles, obliqueJump, nuPM, NU_MAX, machFromNu, isenP,
  shockExpansionDiamond, ackeretDiamond, LBODY, fusIdeal, wingHump, areaCoeffs, dragOfK, sears,
} from './ch04.shared.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '\u2212');
const SIGMA_SB = 5.670374e-8;

export default {
  collection: 'aero',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Oblique shocks and Prandtl–Meyer expansion',
      statement: String.raw`A supersonic stream (Mach number $M_1>1$) turned by a solid boundary adjusts through waves that are slanted to the flow.

(a) **Compression corner** (turn $\theta$ into the flow): an attached **oblique shock** at angle $\beta$ to the upstream flow, related to the turn by
$$\tan\theta=\frac{2\cot\beta\,(M_1^2\sin^2\beta-1)}{M_1^2(\gamma+\cos2\beta)+2}.$$
For $\theta$ below a maximum $\theta_{\max}(M_1)$ there are two solutions, **weak** (usually selected in unconfined wedge flow; it can also become subsonic near the attachment limit) and **strong**; above $\theta_{\max}$ the shock detaches. Across it the normal Mach number $M_{n1}=M_1\sin\beta$ obeys the normal-shock relations, e.g. $p_2/p_1=1+\tfrac{2\gamma}{\gamma+1}(M_{n1}^2-1)$, and the stagnation pressure drops.

(b) **Expansion corner** (turn $|\theta|$ away from the flow): a centred fan of Mach waves, through which the flow is isentropic and $\nu(M_2)=\nu(M_1)+|\theta|$ with the Prandtl–Meyer function
$$\nu(M)=\sqrt{\tfrac{\gamma+1}{\gamma-1}}\arctan\sqrt{\tfrac{\gamma-1}{\gamma+1}(M^2-1)}-\arctan\sqrt{M^2-1},$$
whose maximum is $\approx130.5^\circ$ for $\gamma=1.4$ (beyond it the flow would turn into vacuum).`,
      idea: String.raw`A disturbance in supersonic flow cannot travel upstream, so it is confined to Mach waves of angle $\mu=\arcsin(1/M)$ (9.13); a finite turn is the sum of many small ones. Compressive small turns steepen into a shock (9.14): across a shock only the component normal to it is decelerated, and the tangential component is unchanged, which with the Rankine–Hugoniot conditions gives the $\theta$–$\beta$–$M$ relation. For an expansion each infinitesimal turn $\mathrm d\theta$ is a Mach wave across which $\mathrm d\theta=\sqrt{M^2-1}\,\mathrm dV/V$; integrating gives $\nu(M)$. Expansion is reversible; compression of the same size loses stagnation pressure, by an amount that grows as $\theta^3$.`,
      caption: String.raw`Drag the Mach number and the corner angle (positive = compression, negative = expansion). Left: the flow over the corner, with streamlines bending through the shock (red) or fan (blue). Right: for a compression, the $\theta$–$\beta$ curve of this Mach number (with faint curves for other Mach numbers): the horizontal line at your turn crosses it at the weak and strong shock angles; slide past the top of the curve and the shock detaches. For an expansion, the Prandtl–Meyer function with $M_1$ and $M_2$ marked.`,
      deps: ['fluid-9.14', 'fluid-9.13', 'aero-1.6'],
      refs: ['NASA Glenn, Oblique Shock Waves and Prandtl–Meyer Angle, complete governing relations', 'Ackeret, NACA TM317, p. 2, Prandtl/Meyer source citation'],
      tags: ['shock waves', 'supersonic', 'gas dynamics'],
      scope: String.raw`Steady, two-dimensional, inviscid supersonic flow of a calorically perfect gas ($\gamma=1.4$) past a sharp corner or wedge, with the shock attached. Real flows add boundary layers and shock–boundary-layer interaction; at hypersonic speed the perfect-gas relations become inaccurate (4.7).`,
      credit: 'Prandtl and Meyer; Meyer’s 1908 report No. 62 is cited by Ackeret (NACA TM317, p. 2)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prandtl%E2%80%93Meyer_expansion_fan', wikipedia2: 'https://en.wikipedia.org/wiki/Oblique_shock' },
      viz(v) {
        const Ms = v.slider('Mach number $M_1$', 1.1, 6, 2.5, { step: 0.05 });
        const th = v.slider('corner angle $\\theta$ (°; negative = expansion)', -35, 40, 12, { step: 0.5 });
        const br = v.select('compression branch', [{ value: 'weak', label: 'weak' }, { value: 'strong', label: 'strong' }], 'weak');
        const A = v.stage({ x: [-1, 2], y: [-0.7, 1.85], equal: true, axes: false, height: 340, minWidth: 340, title: 'flow over the corner' });
        const B = v.stage({ x: [0, 90], y: [0, 50], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'shock angle $\\beta$ (°)', ylabel: 'turn $\\theta$ (°)', title: '$\\theta$–$\\beta$–$M$' });
        const C = v.stage({ x: [1, 6], y: [0, 100], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'Mach number $M$', ylabel: '$\\nu$ (°)', title: 'Prandtl–Meyer function' });
        let info = {};
        v.render(() => {
          const M1 = Ms.value, t = th.value * DEG, mu1 = Math.asin(1 / M1);
          const comp = t > 0, tm = thetaMax(M1);
          B.el.style.display = comp ? '' : 'none'; C.el.style.display = comp ? 'none' : '';
          let dirf = () => 0, res = {};
          // wall and corner
          const Lw = 2.2, wallEnd = [Lw * Math.cos(t), Lw * Math.sin(t)];
          if (comp) {
            const sa = shockAngles(t, M1);
            if (sa) {
              const beta = br.value === 'weak' ? sa.weak : sa.strong, j = obliqueJump(M1, beta);
              res = { kind: 'shock', beta, sa, j, tm };
              dirf = (x, y) => (Math.atan2(y, x) < beta ? t : 0);
              const ex = 2.0;
              const yTop = 1.55, xs = Math.min(ex, yTop / Math.tan(beta)), ys = xs * Math.tan(beta);
              A.poly([[0, 0], [xs, ys], [xs + 0.0, ys], [wallEnd[0], wallEnd[1]]], { fill: 'orange', fillAlpha: 0.12, stroke: false });
              A.line(0, 0, xs, ys, { color: 'red', width: 3 });
              A.text(`$\\beta=${fx(beta / DEG, 1)}^\\circ$`, xs * 0.6 + 0.05, ys * 0.6 + 0.12, { color: 'red', size: 12, align: 'left' });
            } else res = { kind: 'detached', tm };
          } else if (t < 0) {
            const tt = -t, nu1 = nuPM(M1), nu2 = nu1 + tt, vac = nu2 >= NU_MAX, M2 = vac ? Infinity : machFromNu(nu2), mu2 = vac ? 0 : Math.asin(1 / M2);
            res = { kind: 'fan', M2, nu1, nu2, vac };
            const tail = vac ? 0 : mu2 - tt;
            const phiOf = (M) => Math.asin(1 / M) - (nuPM(M) - nu1);
            dirf = (x, y) => {
              const phi = Math.atan2(y, x);
              if (phi >= mu1) return 0; if (!vac && phi <= tail) return -tt;
              let lo = M1, hi = vac ? 60 : M2; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (phiOf(m) > phi) lo = m; else hi = m; }
              return -(nuPM((lo + hi) / 2) - nu1);
            };
            for (let k = 0; k <= 6; k++) { const ph = mu1 + (tail - mu1) * k / 6; A.line(0, 0, 1.9 * Math.cos(ph), 1.9 * Math.sin(ph), { color: 'blue', width: k === 0 || k === 6 ? 2.4 : 1.2, alpha: k === 0 || k === 6 ? 1 : 0.7 }); }
          } else res = { kind: 'none' };
          // wall
          A.path([[-1, 0], [0, 0], wallEnd], { color: 'ink', width: 3.2 });
          A.poly([[-1, 0], [0, 0], wallEnd, [wallEnd[0], -0.7], [-1, -0.7]], { fill: 'ink', fillAlpha: 0.12, stroke: false });
          // streamlines
          if (res.kind !== 'detached') {
            for (let k = 0; k < 9; k++) {
              let x = -1, y = 0.09 + 0.17 * k; const pts = [[x, y]];
              for (let n = 0; n < 700 && x < 1.95 && y < 1.6; n++) { const d = dirf(x, y); x += 0.006 * Math.cos(d); y += 0.006 * Math.sin(d); if (y < 0 && x >= 0) { const wy = Math.tan(t) * x; if (y < wy) break; } pts.push([x, y]); }
              A.path(pts, { color: 'accent', width: 1.6 });
            }
          } else {
            const bow = []; for (let i = -10; i <= 10; i++) { const yy = 0.7 * i / 10; bow.push([-0.5 + 0.9 * yy * yy, yy + 0.4]); }
            A.path(bow, { color: 'red', width: 3, dash: true });
            A.text('detached bow shock: no attached solution', -0.9, 1.7, { color: 'red', size: 12, align: 'left' });
          }
          A.arrow(-0.98, 1.62, -0.5, 1.62, { color: 'accent', width: 2 }); A.text(`$M_1=${fx(M1, 2)}$`, -0.45, 1.62, { color: 'accent', size: 12, align: 'left' });
          // right graphs
          if (comp) {
            B.setView([0, 90], [0, Math.max(30, tm.theta / DEG * 1.15 + 3)]);
            for (const mm of [1.5, 2, 3, 5]) { if (Math.abs(mm - M1) > 0.2) B.fn((b) => thetaOf(b * DEG, mm) / DEG, { color: 'faint', width: 1.2, domain: [Math.asin(1 / mm) / DEG, 90] }); }
            B.fn((b) => thetaOf(b * DEG, M1) / DEG, { color: 'accent', width: 2.8, domain: [mu1 / DEG, 90] });
            B.hline(th.value, { color: 'gold', dash: true, width: 1.4 });
            B.dot(tm.beta / DEG, tm.theta / DEG, { r: 5, color: 'orange', label: `$\\theta_{\\max}=${fx(tm.theta / DEG, 1)}^\\circ$`, labelPos: 'n' });
            if (res.sa) { B.dot(res.sa.weak / DEG, th.value, { r: 6, color: 'green', label: 'weak', labelPos: 'nw' }); B.dot(res.sa.strong / DEG, th.value, { r: 6, color: 'red', label: 'strong', labelPos: 'nw' }); }
          } else {
            C.fn((m) => nuPM(m) / DEG, { color: 'accent', width: 2.8, domain: [1, 6] });
            C.hline(NU_MAX / DEG, { color: 'faint', dash: true });
            C.dot(M1, nuPM(M1) / DEG, { r: 5.5, color: 'gold', label: '$M_1$', labelPos: 'nw' });
            if (res.kind === 'fan' && !res.vac && res.M2 < 6) C.dot(res.M2, nuPM(res.M2) / DEG, { r: 5.5, color: 'green', label: '$M_2$', labelPos: 'nw' });
          }
          info = { M1, t, res };
        });
        v.legend([['accent', 'streamlines'], ['red', 'oblique shock'], ['blue', 'expansion fan (Mach waves)'], ['gold', 'your setting']]);
        v.readout(() => {
          const { M1, t, res } = info;
          if (res.kind === 'detached') return `Turn $${fx(t / DEG, 1)}^\\circ$ exceeds the maximum $\\theta_{\\max}=${fx(res.tm.theta / DEG, 2)}^\\circ$ for $M_1=${fx(M1, 2)}$ (reached at $\\beta=${fx(res.tm.beta / DEG, 1)}^\\circ$): there is no attached oblique shock; a curved bow shock stands ahead of the corner.`;
          if (res.kind === 'shock') {
            const { beta, j, sa } = res, mn = M1 * Math.sin(beta);
            const remainingNu = nuPM(M1) - t, nuM = remainingNu >= 0 ? machFromNu(remainingNu) : null;
            return `$\\beta=${fx(beta / DEG, 2)}^\\circ$ (weak ${fx(sa.weak / DEG, 2)}°, strong ${fx(sa.strong / DEG, 2)}°); $M_{n1}=M_1\\sin\\beta=${fx(mn, 3)}$; downstream $M_2=${fx(j.M2, 3)}$; $p_2/p_1=${fx(j.p, 3)}$ (normal-shock formula on $M_{n1}$: $${fx(1 + 2 * G / (G + 1) * (mn * mn - 1), 3)}$), $\\rho_2/\\rho_1=${fx(j.rho, 3)}$, $T_2/T_1=${fx(j.T, 3)}$, $p_{02}/p_{01}=${fx(j.p0, 4)}$.\n`
              + `Check: the turn recomputed from $\\beta$ is $${fx(thetaOf(beta, M1) / DEG, 3)}^\\circ$. ${nuM === null ? 'That turn exceeds the available Prandtl–Meyer angle for a continuously supersonic isentropic compression.' : 'An isentropic compression through the same turn would give $p_2/p_1=' + fx(isenP(M1, nuM), 3) + '$; the pressure difference reflects the shock entropy production.'}`;
          }
          if (res.kind === 'fan') return res.vac ? `The turn would need $\\nu=${fx(res.nu2 / DEG, 1)}^\\circ$, more than the maximum $\\nu_{\\max}=${fx(NU_MAX / DEG, 1)}^\\circ$: the flow separates from the wall and a vacuum forms.`
            : `$\\nu(M_1)=${fx(res.nu1 / DEG, 2)}^\\circ$, turn $${fx(-t / DEG, 1)}^\\circ$ → $\\nu(M_2)=${fx(res.nu2 / DEG, 2)}^\\circ$, $M_2=${fx(res.M2, 3)}$. The fan opens from the Mach angle $\\mu_1=${fx(Math.asin(1 / M1) / DEG, 1)}^\\circ$ to $\\mu_2-|\\theta|=${fx((Math.asin(1 / res.M2) + t) / DEG, 1)}^\\circ$; isentropic: $p_2/p_1=${fx(isenP(M1, res.M2), 4)}$, $T_2/T_1=${fx((1 + 0.2 * M1 * M1) / (1 + 0.2 * res.M2 * res.M2), 4)}$.`;
          return 'A straight wall: no turn, no waves (only Mach waves of angle $\\mu=\\arcsin(1/M_1)$).';
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Supersonic thin-airfoil theory (Ackeret)',
      statement: String.raw`For a thin airfoil at a small angle of attack in a uniform supersonic stream of Mach number $M_\infty>1$ (and not close to $1$ or to hypersonic speeds), linearised theory gives the pressure coefficient on each surface point of local slope $\theta$ (turned into the stream positive):
$$C_p=\frac{2\theta}{\sqrt{M_\infty^2-1}}.$$
The pressure on each face therefore depends only on that face's own slope, not on the rest of the airfoil. Integrating over a flat plate or a symmetric diamond of half-angle $\varepsilon$ gives
$$c_l=\frac{4\alpha}{\sqrt{M_\infty^2-1}},\qquad c_d=\frac{4(\alpha^2+\varepsilon^2)}{\sqrt{M_\infty^2-1}}.$$
The centre of pressure of the flat plate is at mid-chord.
Lift and wave drag are non-zero even in inviscid flow, and thickness adds wave drag $4\varepsilon^2/\beta$ but no lift.`,
      idea: String.raw`The linearised potential equation $(M_\infty^2-1)\phi_{xx}-\phi_{yy}=0$ is the wave equation: disturbances travel unchanged along the Mach lines $x\mp\beta y=\text{const}$, $\beta=\sqrt{M_\infty^2-1}$. Above the airfoil only the downstream-running family exists, so $\phi=f(x-\beta y)$, and the flow-tangency condition $\phi_y=V_\infty\theta$ gives $u'/V_\infty=-\theta/\beta$ and hence $C_p=-2u'/V_\infty=2\theta/\beta$. The same expression is the first term in the oblique-shock relation (4.5) and in the Prandtl–Meyer expansion for small $\theta$, so the exact shock–expansion method reduces to Ackeret's result at small angles.`,
      caption: String.raw`Left: the airfoil at incidence with the waves it sends out (red compression, blue expansion). Top right: the pressure coefficient on its four faces from Ackeret's formula (hollow) and from shock–expansion theory (solid). Bottom: lift and drag against angle of attack, linear theory (dashed) and exact (solid). Raise the angle of attack or lower the Mach number and Ackeret's curves drift away from the exact ones; at large $\alpha$ the shock detaches, and as $M_\infty\to1$ linear theory breaks down.`,
      deps: ['aero-4.5', 'pde-2.1'],
      refs: ['Ackeret, NACA TM317 (1925), printed pp. 1–8; linearization and force integrals pp. 5–7', 'Chapman, NACA TR1063 (1952), p. 6, pressure relation preceding Eq. (17)'],
      tags: ['supersonic', 'wave drag', 'linear theory'],
      scope: String.raw`Small angles and thin sections, $M_\infty$ well above 1 (roughly $1.2\lesssim M_\infty\lesssim4$); inviscid flow over a flat plate or double-wedge section. The comparison is the shock–expansion method: each face is treated as an independent corner, so wave reflections off the opposite shocks are neglected.`,
      credit: 'J. Ackeret, 1925; original Zeitschrift für Flugtechnik und Motorluftschiffahrt, February 14, pp. 72–74, as credited in NACA TM317',
      links: { source: 'https://ntrs.nasa.gov/citations/19930087085', wikipedia: 'https://en.wikipedia.org/wiki/Jakob_Ackeret' },
      viz(v) {
        const Ms = v.slider('Mach number $M_\\infty$', 1.15, 5, 2, { step: 0.05 });
        const al = v.slider('angle of attack $\\alpha$ (°)', -10, 10, 3, { step: 0.1 });
        const ep = v.slider('thickness half-angle $\\varepsilon$ (°, 0 = flat plate)', 0, 10, 3, { step: 0.1 });
        const A = v.stage({ x: [-0.6, 2.2], y: [-1.3, 1.3], equal: true, axes: false, height: 330, minWidth: 320, title: 'waves round the section' });
        const B = v.stage({ x: [0.5, 4.5], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'face', ylabel: '$C_p$', title: 'pressure on each face', xticks: [[1, 'upper front'], [2, 'upper rear'], [3, 'lower front'], [4, 'lower rear']] });
        const C = v.stage({ x: [-10, 10], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'angle of attack $\\alpha$ (°)', ylabel: '$c_l$', title: 'lift' });
        const D = v.stage({ x: [-10, 10], y: [0, 0.12], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'angle of attack $\\alpha$ (°)', ylabel: '$c_d$', title: 'wave drag' });
        let info = {};
        v.render(() => {
          const M = Ms.value, a = al.value * DEG, e = ep.value * DEG, b = Math.sqrt(M * M - 1), mu = Math.asin(1 / M);
          const ack = ackeretDiamond(M, a, e), ex = shockExpansionDiamond(M, a, e);
          // airfoil at incidence (flow along +x)
          const ca = Math.cos(-a), sa = Math.sin(-a), rot = ([x, y]) => [(x - 0.5) * ca - y * sa + 0.5, (x - 0.5) * sa + y * ca], te = Math.tan(e) * 0.5;
          const P = [[0, 0], [0.5, te], [1, 0], [0.5, -te]].map(rot);
          A.poly(P, { fill: 'ink', fillAlpha: 0.2, color: 'ink', width: 2 });
          const wave = (p, sgn, col, len = 1.0) => A.line(p[0], p[1], p[0] + len * Math.cos(sgn * mu), p[1] + len * Math.sin(sgn * mu), { color: col, width: 2.2 });
          const upL = ack.up1 > 0 ? 'red' : 'blue', loL = ack.lo1 > 0 ? 'red' : 'blue';
          wave(P[0], 1, upL, 1.4); wave(P[0], -1, loL, 1.4); wave(P[1], 1, 'blue', 1.2); wave(P[3], -1, 'blue', 1.2);
          wave(P[2], 1, ack.up2 < 0 ? 'red' : 'blue', 1.0); wave(P[2], -1, 'red', 1.0);
          A.arrow(-0.55, 0.0, -0.1, 0.0, { color: 'accent', width: 2 }); A.text(`$M_\\infty=${fx(M, 2)}$`, -0.55, 0.14, { color: 'accent', size: 12, align: 'left' });
          A.text(`Mach angle $\\mu=${fx(mu / DEG, 1)}^\\circ$`, 1.1, -1.2, { color: 'muted', size: 11, align: 'left' });
          // bars
          const names = ['up1', 'up2', 'lo1', 'lo2'], ymax = Math.max(0.1, ...names.map((n) => Math.abs(ack[n])), ...(ex ? names.map((n) => Math.abs(ex[n])) : [0])) * 1.2;
          B.setView([0.5, 4.5], [-ymax, ymax]); B.hline(0, { color: 'faint' });
          names.forEach((n, i) => { B.rect(i + 0.6, 0, i + 1.0, ack[n], { color: 'orange', fill: 'orange', fillAlpha: 0.0, width: 2 }); if (ex) B.rect(i + 1.0, 0, i + 1.4, ex[n], { color: 'accent', fill: 'accent', fillAlpha: 0.45, width: 1.4 }); });
          // lift & drag curves
          const as = []; for (let i = 0; i <= 80; i++) as.push(-10 + 20 * i / 80);
          const ys = as.map((x) => shockExpansionDiamond(M, x * DEG, e));
          C.setView([-10, 10], [-Math.max(0.3, 4 * 10 * DEG / b * 1.1), Math.max(0.3, 4 * 10 * DEG / b * 1.1)]);
          D.setView([-10, 10], [0, Math.max(0.05, 4 * (100 * DEG * DEG + e * e) / b * 1.1)]);
          C.path(as.map((x) => [x, 4 * x * DEG / b]), { color: 'orange', width: 2.2, dash: true });
          C.path(as.map((x, i) => (ys[i] ? [x, ys[i].cl] : null)), { color: 'accent', width: 2.8 });
          D.path(as.map((x) => [x, 4 * ((x * DEG) ** 2 + e * e) / b]), { color: 'orange', width: 2.2, dash: true });
          D.path(as.map((x, i) => (ys[i] ? [x, ys[i].cd] : null)), { color: 'accent', width: 2.8 });
          C.dot(al.value, ack.cl, { r: 5, color: 'orange' }); D.dot(al.value, ack.cd, { r: 5, color: 'orange' });
          if (ex) { C.dot(al.value, ex.cl, { r: 6, color: 'gold' }); D.dot(al.value, ex.cd, { r: 6, color: 'gold' }); }
          info = { M, a, e, b, ack, ex };
        });
        v.legend([['orange', 'Ackeret (linear)', { dash: true }], ['accent', 'shock–expansion (inviscid)']]);
        v.readout(() => {
          const { M, b, ack, ex } = info;
          let s = `$\\beta=\\sqrt{M_\\infty^2-1}=${fx(b, 3)}$. Ackeret: $c_l=${fx(ack.cl, 4)}$, $c_d=${fx(ack.cd, 4)}$, $C_p$ on the faces $${fx(ack.up1, 3)},\\ ${fx(ack.up2, 3)},\\ ${fx(ack.lo1, 3)},\\ ${fx(ack.lo2, 3)}$.\n`;
          s += ex ? `Shock–expansion: $c_l=${fx(ex.cl, 4)}$ (Ackeret differs by $${fx(100 * (ack.cl - ex.cl) / (Math.abs(ex.cl) || 1), 1)}\\%$), $c_d=${fx(ex.cd, 4)}$ (${ex.cd === 0 ? 'zero drag in both models' : '$' + fx(100 * (ack.cd - ex.cd) / Math.abs(ex.cd), 1) + '\\%$'}); faces $${fx(ex.up1, 3)},\\ ${fx(ex.up2, 3)},\\ ${fx(ex.lo1, 3)},\\ ${fx(ex.lo2, 3)}$.` : 'An attached, fully supersonic sequence of corner waves is unavailable at this setting (a leading shock detaches or its downstream flow is subsonic before the rear expansion). This comparison cannot validate the linear result here.';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Hypersonic aerodynamic heating',
      statement: String.raw`A body moving at hypersonic speed converts the flow's kinetic energy into heat in the boundary layer and at the stagnation point. For a perfect gas the stagnation temperature is
$$T_0=T_\infty\Big(1+\tfrac{\gamma-1}{2}M_\infty^2\Big),$$
which reaches thousands of kelvin well below orbital speed, far above ambient temperature. The convective heat flux at the stagnation point of a blunt nose of radius $R_n$ scales as
$$\dot q_s=k\sqrt{\rho_\infty/R_n}\;V_\infty^3 ,$$
(the Sutton–Graves form, with $k\approx1.7\times10^{-4}$ in SI units for Earth air), so it grows as the cube of speed, falls with nose radius, and is why re-entry vehicles are blunt. Using this cold-wall flux without a hot-wall correction gives the radiative balance estimate $T_w=(\dot q_s/\varepsilon\sigma)^{1/4}$. At these speeds the gas dissociates and ionises, so the perfect-gas $T_0$ is an overestimate.`,
      idea: String.raw`A decelerated fluid element has to put its kinetic energy $V^2/2$ somewhere; adiabatically the enthalpy rises by that amount, $c_pT_0=c_pT+V^2/2$, which gives the formula for $T_0$ (and the $M^2$ growth). Close to the wall the gas cannot be brought to rest without conducting heat into the surface, with a flux set by the thermal gradient across the boundary layer; the boundary-layer theory of the stagnation point (Fay–Riddell, 1958) yields a flux proportional to $\sqrt{\rho_e\mu_e\,\mathrm du_e/\mathrm dx}\,(h_0-h_w)$ and, for a sphere, to $\sqrt{\rho/R_n}\,V^3$. Above about Mach 5 the energy goes partly into dissociating $\mathrm O_2$ and $\mathrm N_2$ rather than into temperature, which is why the real temperature behind a strong shock is far lower than $T_0$ of the perfect gas.`,
      caption: String.raw`Left: perfect-gas stagnation temperature against Mach number at the chosen altitude (the temperature there comes from the standard atmosphere of chapter 1), with three historical Shuttle temperature references as horizontal lines; the grey region marks speeds where the perfect-gas model is unreliable. Right: cold-wall-flux estimate of radiative-equilibrium wall temperature at the stagnation point of a nose of the chosen radius, from the Sutton–Graves heat flux (dashed where it is used below the speeds it was fitted to). Increase the nose radius and watch the wall temperature fall; fly higher and it falls again as the air thins.`,
      deps: ['aero-4.5', 'aero-1.6', 'thermo-9.6', 'thermo-1.14'],
      refs: ['Sutton and Graves, NASA TR R-376 (1971), pp. 1–2 and 12–17', 'NASA TFAWS 2012, Aerothermodynamics Course, Lecture 1, pp. 15–18 and 28–29', 'NASA Kennedy, Orbiter Thermal Protection System, p. 1; Rummler, Recent Advances in Carbon-Carbon Materials Systems, p. 295'],
      tags: ['hypersonic', 'heating', 're-entry'],
      scope: String.raw`Perfect-gas stagnation temperature is a low-temperature comparison; dissociation and ionization invalidate constant specific heats. The simplified Sutton–Graves estimate is for laminar stagnation-point convection at a blunt effective radius, a fully catalytic wall, Earth air, and a cold-wall enthalpy approximation. The original report studied equilibrium gases at 2.3–116.2 MJ/kg and wall temperatures 300 and 1111 K; these bounds do not certify this simplified constant-k model. Radiative balance omits hot-wall correction, conduction, ablation and incident shock-layer radiation. The three Shuttle reference temperatures describe different structural/insulation roles, not a material-selection rule or design allowables.`,
      credit: 'K. Sutton and R. A. Graves Jr., NASA TR R-376, 1971; simplified SI form: NASA TFAWS 2012 Lecture 1, p. 17',
      links: { source: 'https://ntrs.nasa.gov/citations/19720003329', course: 'https://tfaws.nasa.gov/TFAWS12/Proceedings/Aerothermodynamics%20Course.pdf' },
      viz(v) {
        const hS = v.slider('altitude (km)', 20, 90, 50, { step: 1 });
        const rS = v.slider('nose radius $R_n$ (m)', 0.01, 3, 0.3, { step: 0.01, log: true });
        const eS = v.slider('surface emissivity $\\varepsilon$', 0.4, 0.95, 0.85, { step: 0.01 });
        const kS = v.slider('constant $k$ (×10⁻⁴, SI)', 1.5, 2.0, 1.74, { step: 0.01 });
        const A = v.stage({ x: [1, 12], y: [0, 6000], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: 'Mach number $M_\\infty$', ylabel: '$T_0$ (K)', title: 'perfect-gas stagnation temperature' });
        const B = v.stage({ x: [1, 25], y: [0, 3500], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: 'Mach number $M_\\infty$', ylabel: '$T_w$ (K)', title: 'radiative-equilibrium wall temperature' });
        const LIM = [['Shuttle aluminium skin reference', 450, 'blue'], ['Shuttle HRSI surface reference', 1530, 'orange'], ['Shuttle RCC surface reference', 1920, 'red']];
        let info = {}; const Mh = { M: 6 };
        const hd = A.handle(6, 1000, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 1, 12), 0] }); hd.onDrag = () => { Mh.M = hd.x; };
        v.render(() => {
          const at = atmo(hS.value * 1000), T = at.T, a = at.a, rho = at.rho, Rn = rS.value, eps = eS.value, k = kS.value * 1e-4;
          A.setView([1, 12], [0, 6000]);
          A.rect(5, 0, 12, 6000, { fill: 'muted', fillAlpha: 0.08, stroke: false });
          A.text('dissociation: perfect gas unreliable', 11.8, 5600, { color: 'muted', size: 11, align: 'right' });
          for (const [nm, T0, c] of LIM) { A.hline(T0, { color: c, dash: true, width: 1.4 }); A.text(nm, 1.1, T0 + 80, { color: c, size: 10.5, align: 'left' }); }
          A.fn((M) => T * (1 + 0.2 * M * M), { color: 'accent', width: 2.8, domain: [1, 12] });
          const M0 = clamp(Mh.M, 1, 12); hd.set(M0, T * (1 + 0.2 * M0 * M0)); hd.y = T * (1 + 0.2 * M0 * M0);
          const q = (M) => k * Math.sqrt(rho / Rn) * (M * a) ** 3, Tw = (M) => Math.pow(q(M) / (eps * SIGMA_SB), 0.25);
          const Vfit = Math.sqrt(2 * 2.3e6) / a;
          B.setView([1, 25], [0, Math.max(3500, 1.12 * Tw(M0))]);
          for (const [nm, T0, c] of LIM) B.hline(T0, { color: c, dash: true, width: 1.4 });
          B.fn(Tw, { color: 'accent', width: 2.8, domain: [Math.max(1, Vfit), 25] });
          if (Vfit > 1) B.fn(Tw, { color: 'accent', width: 1.6, dash: true, domain: [1, Vfit] });
          B.dot(clamp(M0 * 1, 1, 25), Tw(M0), { r: 6, color: 'gold' }); B.vline(M0, { color: 'gold', dash: true, width: 1 });
          info = { T, a, rho, Rn, M0, T0: T * (1 + 0.2 * M0 * M0), q: q(M0), Tw: Tw(M0), V: M0 * a, h0: (M0 * a) ** 2 / 2, Vfit };
        });
        v.legend([['accent', 'model'], ['blue', 'aluminium'], ['orange', 'tile'], ['red', 'RCC']]);
        v.readout(() => {
          const { T, a, rho, M0, T0, q, Tw, V, h0, Vfit } = info;
          const ok = LIM.filter(([, lim]) => Tw <= lim).map(([n]) => n);
          return `At ${hS.value} km: $T_\\infty=${fx(T, 1)}$ K, $a=${fx(a, 0)}$ m/s, $\\rho=${fx(rho * 1e3, 3)}\\times10^{-3}$ kg/m³. At $M_\\infty=${fx(M0, 2)}$ ($V=${fx(V / 1000, 2)}$ km/s, $h_0=V^2/2=${fx(h0 / 1e6, 2)}$ MJ/kg): perfect-gas $T_0=${fx(T0, 0)}$ K; stagnation-point flux $\\dot q_s=${fx(q / 1e6, 3)}$ MW/m² (Sutton–Graves, $k=${fx(kS.value, 2)}\\times10^{-4}$); radiative-equilibrium wall temperature $T_w=${fx(Tw, 0)}$ K.\n`
            + `Historical reference temperatures above this estimate: ${ok.length ? ok.join(', ') : 'none'}. The original equilibrium-gas study began at $h_0\\ge2.3$ MJ/kg ($M_\\infty\\ge${fx(Vfit, 1)}$ here); below that the dashed part is an extrapolation. These reference lines do not determine material suitability; the cold-wall flux omits the reduction of convection at a hot wall.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Paper',
      name: 'Drag-Rise Characteristics of Wing-Body Combinations',
      paper: {
        authors: 'Richard T. Whitcomb', year: 1952, title: 'A Study of the Zero-Lift Drag-Rise Characteristics of Wing-Body Combinations Near the Speed of Sound',
        venue: 'NACA Research Memorandum RM L52H08 (September 3, 1952)', url: 'https://ntrs.nasa.gov/citations/19930087283',
      },
      introduces: ['aero-4.4'],
      statement: String.raw`Whitcomb compared four thin, low-aspect-ratio wing–body configurations with bodies of revolution having the same axial area distribution, in the Langley 8-foot transonic tunnel at Mach0.85–1.10. Near Mach1, their zero-lift drag-rise increments and extensive shock patterns were approximately alike. Indenting the fuselage to compensate for the wing's cross-sectional area greatly reduced, or nearly eliminated, the wing's additional drag rise. This experimental **area rule** is approximate: agreement worsens as wing thickness, aspect ratio, taper or supersonic Mach number increase.`,
      idea: String.raw`A wing and fuselage interact through their pressure field, so their combined drag rise need not be the sum of isolated-component values. Whitcomb's equal-area comparisons supplied an empirical way to account for that interference. The report's swept-wing example had a drag rise near0.012 on a curved body against0.004 on a cylindrical body (p.9); the report also explains the finite measurement accuracy and less exact agreement for this thicker swept wing. The numerical illustration below uses slender-body theory to demonstrate smoothing; it does not recreate the tunnel measurements.`,
      caption: String.raw`A **reconstruction in a model**, not Whitcomb's data. Left: the area distribution of a wing–body combination for the straight fuselage ($k=0$), for your indentation $k$, and for the equivalent body of revolution (dotted: it has the same $S(x)$ as your setting by definition). Right: a model drag-rise curve $\Delta C_D(M)$ whose height at $M=1$ comes from the slender-body wave drag of each area distribution and whose onset Mach number follows Korn's relation for the chosen wing thickness; the shape of the rise below $M=1$ is a smooth fit, not data. Slide $k$ to indent the fuselage and the drag peak falls toward that of the smooth Sears–Haack body.`,
      deps: ['aero-4.2'],
      refs: ['Whitcomb, NACA RM L52H08 (1952), full experiment/discussion pp. 1–12', 'Sheppard, ARC R&M3077 (1957), §2.3.1, p. 5'],
      tags: ['area rule', 'transonic', 'history'],
      scope: String.raw`Slender wing–body combinations at zero lift near $M=1$. The wave-drag magnitudes come from the slender-body formula applied to an idealised area distribution (a Sears-Haack-like fuselage plus a $\sin^2$ wing hump, reference area $0.12\,l^2$); the curve between $M\approx0.85$ and $1$ is an interpolation, and no value in this picture is from the paper.`,
      credit: 'R. T. Whitcomb, NACA Langley, September 3, 1952 (NACA RM L52H08)',
      links: { ntrs: 'https://ntrs.nasa.gov/citations/19930087283', wikipedia: 'https://en.wikipedia.org/wiki/Richard_T._Whitcomb' },
      viz(v) {
        const kS = v.slider('indentation $k$', 0, 1, 0.6, { step: 0.01 });
        const awS = v.slider('wing area hump $A_w/A_f$', 0.1, 0.6, 0.35, { step: 0.01 });
        const tcS = v.slider('wing thickness $t/c$', 0.04, 0.12, 0.06, { step: 0.005 });
        const Af = 0.006, ww = 0.4, xw = 0.35, SREF = 0.12;
        const A = v.stage({ x: [0, 1], y: [0, Af * 1.5], axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'station $x/l$', ylabel: 'area $S(x)$', title: 'area distribution' });
        const B = v.stage({ x: [0.7, 1.3], y: [0, 0.06], axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'Mach number', ylabel: '$\\Delta C_D$ (model)', title: 'transonic drag rise (model)' });
        let info = {};
        v.render(() => {
          const k = kS.value, Aw = awS.value * Af, co = areaCoeffs(Af, Aw, xw, ww), tc = tcS.value;
          const wing = (x) => wingHump(x, Aw, xw, ww), tot = (kk) => (x) => fusIdeal(x, Af) + (1 - kk) * wing(x);
          A.fn(tot(0), { color: 'red', width: 2.4, domain: [0, 1] });
          A.fn(tot(k), { color: 'accent', width: 2.8, domain: [0, 1] });
          A.fn(tot(k), { color: 'green', width: 1.6, dash: [2, 5], domain: [0, 1] });
          A.fn((x) => fusIdeal(x, Af), { color: 'muted', width: 1.4, domain: [0, 1] });
          const mdd = 0.87 - tc, M0 = Math.max(0.6, mdd - 0.04);
          const cw = (kk) => dragOfK(co, kk) / SREF, g = (M) => { const u = clamp((M - M0) / (1 - M0), 0, 1); return u * u * (3 - 2 * u); };
          const dc = (kk) => (M) => cw(kk) * g(M) * (M > 1.1 ? Math.max(0.55, 1 - 1.5 * (M - 1.1)) : 1);
          B.setView([0.7, 1.3], [0, Math.max(0.01, cw(0) * 1.15)]);
          B.fn(dc(0), { color: 'red', width: 2.6, domain: [0.7, 1.3] });
          B.fn(dc(1), { color: 'muted', width: 1.8, domain: [0.7, 1.3] });
          B.fn(dc(k), { color: 'accent', width: 2.8, domain: [0.7, 1.3] });
          B.dot(1, cw(k), { r: 6, color: 'green' }); B.vline(1, { color: 'faint', dash: true });
          info = { cw0: cw(0), cwk: cw(k), cw1: cw(1), M0, mdd };
        });
        v.legend([['red', 'wing + straight fuselage'], ['accent', 'your indentation'], ['green', 'equivalent body of revolution (same $S(x)$)'], ['muted', 'body alone / fully ruled']]);
        v.readout(() => {
          const { cw0, cwk, cw1, M0, mdd } = info;
          return `Model drag rise at $M=1$ (slender-body wave drag over $S_{ref}=0.12\\,l^2$): straight fuselage $${fx(cw0, 4)}$, your setting $${fx(cwk, 4)}$ (equivalent body of revolution: the same, by the equivalence the paper asserts), fully area-ruled $${fx(cw1, 4)}$ — the Sears–Haack body at the smaller, fully-indented volume. Indentation removes volume in this illustration.\nThe indentation removes $${fx(100 * (1 - cwk / cw0), 1)}\\%$ of the model's drag rise. Onset of the rise (Korn, $\\kappa=0.87$, $C_L=0$): $M_{dd}=${fx(mdd, 3)}$, curve starts at $${fx(M0, 3)}$. The paper's own figures are not reproduced here.`;
        });
      },
    },
  ],
};
