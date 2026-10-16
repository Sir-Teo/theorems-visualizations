// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part a: 4.1–4.5)
import { clamp, PA_PER_MMHG, RHO_BLOOD, MU_BLOOD } from './ch04.shared.js';

const SEG = [
  { n: 'arteries', c: 'accent' }, { n: 'arterioles', c: 'orange' }, { n: 'capillaries', c: 'green' }, { n: 'veins', c: 'purple' },
];

export default {
  collection: 'physio',
  chapter: 4,
  title: 'Circulation: pressure, flow and resistance',
  summary: String.raw`Blood flow obeys the same laws as current in a circuit: pressure drives flow through resistance, and resistance depends on the fourth power of vessel radius. Compliant arteries store each stroke and release it during diastole, the Windkessel effect, while pressure waves travel and reflect. Starling forces govern fluid exchange at the capillaries, and Guyton’s venous-return analysis shows how heart and vessels jointly set cardiac output.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Law',
      name: 'Ohm’s law of the circulation: ΔP = QR',
      statement: String.raw`For steady flow through a vascular bed, the mean flow $Q$ is proportional to the pressure difference $\Delta P$ between its inlet and outlet, and the constant of proportionality is the reciprocal of the **resistance** $R$:
$$\Delta P = Q\,R ,\qquad R=\frac{\Delta P}{Q}.$$
For the whole systemic circulation $\Delta P\approx \text{MAP}-\text{RAP}$ and $Q$ is the cardiac output, so $\text{MAP}\approx \text{CO}\times \text{SVR}+\text{RAP}$. Resistance is a property of the vessels (their geometry) and the blood (its viscosity), not of the flow, but it is defined here as the ratio, whatever the vessels do.`,
      idea: String.raw`It is the circuit law with pressure in the role of voltage and volume flow in the role of current: the pressure drops along a chain of vessels add up to the total drop, and the same flow passes through each member of a chain (conservation of volume for incompressible blood). The empirical content is that, for a given bed, $\Delta P/Q$ is roughly constant over the working range; where it is not (collapsing veins, vessel distension, non-Newtonian blood) the "resistance" is just a name for the ratio at that operating point. Poiseuille's law (physio-4.2) says what the resistance of a single tube is made of.`,
      caption: String.raw`A chain of four resistances stands for the systemic circulation (large arteries, arterioles, capillaries, veins; the split is a textbook-style illustration). The pressure profile is drawn node by node, each step of height $Q R_i$. Drag the **arteriolar resistance** up: with the heart as a **pressure source** the flow falls and nearly all the drop moves into the arterioles; switch the source to a **flow source** (a pump that delivers a fixed output) and the same change instead raises the arterial pressure, which is how hypertension looks in the model. The readout checks that the four drops add to the total.`,
      scope: String.raw`Mean (time-averaged) pressures and flows only; pulsatility and wave effects are left to the Windkessel and wave items below. The regional split of resistance is illustrative (arterioles carry the largest share in standard textbooks), not a measured dataset.`,
      deps: [],
      see: ['circ-2.3', 'circ-2.4', 'physio-4.2'],
      refs: ['Guyton–Hall', 'Keener–Sneyd ch. 11'],
      tags: ['resistance', 'haemodynamics'],
      viz(v) {
        const R0 = [1.5, 11, 3.5, 1.5];
        const src = v.select('heart acts as', [{ value: 'P', label: 'pressure source' }, { value: 'Q', label: 'flow source' }], 'P');
        const sl = SEG.map((sg, i) => v.slider(`$R$ ${sg.n}`, 0.2, i === 1 ? 30 : 12, R0[i], { step: 0.1, fmt: (x) => `${v.fix(x, 1)}` }));
        const sPin = v.slider('inlet pressure (aorta)', 40, 160, 93, { step: 1, fmt: (x) => `${x} mmHg` });
        const sQ = v.slider('cardiac output', 1, 12, 5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} L/min` });
        const s = v.stage({ x: [0, 4], y: [0, 175], height: 300, axes: 'box', gutter: true, ylabel: 'mean pressure (mmHg)', xticks: SEG.map((g, i) => [i + 0.5, g.n]), weight: 1.3 });
        const c = v.stage({ x: [0, 10], y: [0, 3], height: 190, axes: false, weight: 1 });
        const POUT = 5;
        let st = null;
        v.render(() => {
          const R = sl.map((q) => q.value), Rt = R.reduce((a, b) => a + b, 0);
          sQ.el.hidden = src.value !== 'Q'; sPin.el.hidden = src.value !== 'P';
          const Q = src.value === 'P' ? (sPin.value - POUT) / Rt : sQ.value;
          const P = [POUT + Q * Rt]; for (let i = 0; i < 4; i++) P.push(P[i] - Q * R[i]);
          st = { Q, Rt, P, R };
          for (let i = 0; i < 4; i++) {
            s.poly([[i, 0], [i, P[i]], [i + 1, P[i + 1]], [i + 1, 0]], { fill: SEG[i].c, fillAlpha: 0.2, stroke: false });
            s.line(i, P[i], i + 1, P[i + 1], { color: SEG[i].c, width: 3 });
            s.text(`ΔP = ${v.fix(Q * R[i], 0)}`, i + 0.5, (P[i] + P[i + 1]) / 2 + 8, { size: 12, color: SEG[i].c, align: 'center', weight: 700 });
          }
          for (let i = 0; i <= 4; i++) s.dot(i, P[i], { r: 4, color: 'ink' });
          s.hline(POUT, { color: 'faint', dash: [4, 4] });
          // circuit schematic: resistor boxes, thickness of the pipe = flow
          const w = 2.1;
          c.line(0.2, 1.5, 9.8, 1.5, { color: 'faint', width: 2 });
          for (let i = 0; i < 4; i++) {
            const x0 = 0.4 + i * 2.4;
            c.rect(x0, 1.1, x0 + w, 1.9, { fill: SEG[i].c, fillAlpha: 0.25, color: SEG[i].c, width: 2, radius: 4 });
            c.text(`R = ${v.fix(R[i], 1)}`, x0 + w / 2, 1.5, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
            c.text(`${v.fix(P[i], 0)}`, x0 - 0.15, 2.2, { size: 11, color: 'muted', align: 'center' });
          }
          c.text(`${v.fix(P[4], 0)}`, 9.85, 2.2, { size: 11, color: 'muted', align: 'center' });
          c.arrow(0.5, 0.5, 0.5 + 1.2 + 0.5 * Q, 0.5, { color: 'gold', width: 1 + Q * 0.8 });
          c.text(`Q = ${v.fix(Q, 1)} L/min`, 3.2 + 0.5 * Q, 0.5, { size: 13, color: 'gold', align: 'left', baseline: 'middle', weight: 700 });
        });
        v.readout(() => `$R_\\text{tot}=\\sum R_i=${v.fix(st.Rt, 1)}$ mmHg·min/L,  $Q=\\Delta P/R_\\text{tot}=${v.fix(st.Q, 2)}$ L/min,  $\\sum \\Delta P_i = ${v.fix(st.Q * st.Rt, 1)}$ mmHg $=P_\\text{in}-P_\\text{out}$ = ${v.fix(st.P[0] - st.P[4], 1)} mmHg\narterioles take ${v.fix((100 * st.R[1]) / st.Rt, 0)}% of the total resistance;  inlet pressure ${v.fix(st.P[0], 0)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Law',
      name: 'Poiseuille’s law in blood vessels',
      statement: String.raw`For steady, laminar flow of a Newtonian fluid of viscosity $\mu$ through a rigid straight tube of radius $r$ and length $L$ under a pressure difference $\Delta P$, the velocity profile is a paraboloid, $u(\rho)=\dfrac{\Delta P}{4\mu L}(r^2-\rho^2)$, the volume flow is
$$Q=\frac{\pi r^4\,\Delta P}{8\mu L},$$
and the resistance is $R=\Delta P/Q = 8\mu L/(\pi r^4)$. The mean velocity is half the centre-line velocity, and the shear stress at the wall is $\tau_w=\Delta P\,r/(2L)=4\mu Q/(\pi r^3)$.`,
      idea: String.raw`Balance forces on a cylinder of fluid of radius $\rho$: the pressure force $\pi\rho^2\Delta P$ is carried by viscous shear on its surface, $-\mu u'(\rho)\,2\pi\rho L$. That gives $u'=-\Delta P\rho/(2\mu L)$, and the no-slip condition $u(r)=0$ fixes the parabola. Integrating $u$ over the cross-section, $\int_0^r u\,2\pi\rho\,d\rho$, gives the fourth power: one factor $r^2$ is the area and the other is the square of the distance over which the profile stretches. This is the Hagen–Poiseuille law of the fluid-dynamics collection (fluid-6.8), used here with blood parameters.`,
      caption: String.raw`Drag the sliders for radius, length, viscosity and driving pressure. The **left** panel shows the tube with the parabolic profile at three stations; the **right** panel plots $u(\rho)$ and marks the mean velocity (always half the peak). The readout computes the flow twice, from the closed formula and by numerically integrating the profile over the cross-section, and they agree. Whole-blood viscosity is about 3.5 mPa·s (plasma alone is about 1.2).`,
      scope: String.raw`Holds for steady, fully developed laminar flow in a long rigid straight tube of constant circular cross-section with a Newtonian fluid and no slip. Real arteries are elastic and pulsatile (physio-4.15), and blood is non-Newtonian in small vessels (physio-4.11).`,
      deps: ['physio-4.1', 'fluid-6.8'],
      see: ['physio-4.3'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['Poiseuille', 'viscosity'],
      credit: 'J. L. M. Poiseuille (1838–1846) and G. Hagen (1839)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hagen%E2%80%93Poiseuille_equation' },
      verify: true,
      viz(v) {
        const sr = v.slider('radius $r$', 0.2, 3, 1.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mm` });
        const sL = v.slider('length $L$', 1, 20, 5, { step: 0.5, fmt: (x) => `${x} cm` });
        const sm = v.slider('viscosity $\\mu$', 1, 8, 3.5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mPa·s` });
        const sP = v.slider('pressure drop $\\Delta P$', 1, 50, 10, { step: 1, fmt: (x) => `${x} mmHg` });
        const s = v.stage({ x: [0, 10], y: [-3.4, 3.4], height: 280, axes: false, weight: 1.3 });
        const p = v.stage({ x: [-3.2, 3.2], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'distance from axis ρ (mm)', ylabel: 'velocity u (cm/s)', weight: 1 });
        let o = null;
        v.render(() => {
          const r = sr.value * 1e-3, L = sL.value * 1e-2, mu = sm.value * 1e-3, dP = sP.value * PA_PER_MMHG;
          const u = (rho) => (dP / (4 * mu * L)) * (r * r - rho * rho);
          const Qf = (Math.PI * r ** 4 * dP) / (8 * mu * L);
          const Qn = v.M.integrate((rho) => u(rho) * 2 * Math.PI * rho, 0, r, 200);
          o = { Qf, Qn, umax: u(0), tau: (dP * r) / (2 * L), Rr: dP / Qf };
          const ru = sr.value;
          s.rect(0, -ru - 0.12, 10, ru + 0.12, { fill: 'red', fillAlpha: 0.08, color: 'red', width: 3, radius: 0 });
          s.rect(0, -ru, 10, ru, { fill: 'panel', fillAlpha: 1, stroke: false });
          s.line(0, 0, 10, 0, { color: 'faint', dash: [5, 5] });
          for (const x0 of [2, 5, 8]) {
            const pts = []; for (let k = -40; k <= 40; k++) { const y = (k / 40) * ru; pts.push([x0 + 1.7 * (1 - (y / ru) ** 2), y]); }
            s.poly([[x0, -ru], ...pts, [x0, ru]], { fill: 'accent', fillAlpha: 0.2, stroke: false });
            s.path(pts, { color: 'accent', width: 2.4 });
            for (const k of [-0.75, -0.4, 0, 0.4, 0.75]) s.arrow(x0, k * ru, x0 + 1.7 * (1 - k * k), k * ru, { color: 'accent', width: 1.2, head: 6 });
            s.line(x0, -ru, x0, ru, { color: 'muted', width: 1 });
          }
          s.measure(9.6, -ru, 9.6, ru, `2r = ${v.fix(2 * ru, 2)} mm`);
          s.text('P in', 0.1, -ru - 0.3, { size: 11, color: 'muted', align: 'left' });
          p.setView([-3.2, 3.2], [0, Math.max(o.umax * 100 * 1.15, 1)]);
          p.fn((x) => (Math.abs(x) <= ru ? u(x * 1e-3) * 100 : NaN), { color: 'accent', width: 2.6, fill: true, fillAlpha: 0.15 });
          p.hline(o.umax * 50, { color: 'orange', dash: [6, 4] });
          p.text('mean = ½ peak', -3.0, o.umax * 50, { size: 11, color: 'orange', align: 'left', baseline: 'bottom', dy: -3 });
          p.dot(0, o.umax * 100, { r: 5, color: 'accent' });
        });
        v.readout(() => `$Q=\\pi r^4\\Delta P/(8\\mu L)=${v.fix(o.Qf * 1e6, 3)}$ mL/s;  numerical $\\int u\\,dA=${v.fix(o.Qn * 1e6, 3)}$ mL/s\n$u_\\max=${v.fix(o.umax * 100, 1)}$ cm/s,  $\\bar u=${v.fix(o.umax * 50, 1)}$ cm/s,  wall shear $\\tau_w=${v.fix(o.tau, 2)}$ Pa,  $R=${v.fix(sP.value / (o.Qf * 6e4), 2)}$ mmHg·min/L`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Phenomenon',
      name: 'Fourth-power sensitivity of flow to vessel radius',
      statement: String.raw`At a fixed driving pressure, the flow through a vessel scales as the fourth power of its radius, $Q\propto r^4$, so a small change in radius makes a large change in flow: $Q/Q_0=(r/r_0)^4$. Narrowing a vessel by 16% (to $0.84\,r_0$) halves the flow, and halving the radius cuts the flow to a sixteenth. Equivalently the resistance goes as $r^{-4}$; because the arterioles are narrow and muscular, small changes in their radius, rather than in the large arteries, are the main means by which the body redistributes blood.`,
      idea: String.raw`It is Poiseuille's law (physio-4.2) read as a sensitivity: $d\ln Q/d\ln r = 4$ when pressure, length and viscosity stay fixed. On log–log axes the relation is a straight line of slope 4, which is the easiest way to read an exponent off data. The consequence for control is that a few per cent of smooth-muscle shortening in an arteriole is a 10–20% change of its flow, and the same few per cent in the aorta is negligible against the resistance of the whole bed.`,
      caption: String.raw`Drag the handle on the **left** (linear axes) to constrict or dilate the vessel; the same point rides on the **log–log** plot on the right, next to the lines of slope 1, 2 (the area) and 4. The readout fits the slope of the computed curve and lists the constriction that halves flow. Try a 10% constriction, then a 50% one, and compare how much flow you lose.`,
      scope: String.raw`At fixed $\Delta P$ in a rigid, long, laminar-flow tube. In the body the pressure upstream of an arteriole is not held fixed when its flow changes, and passive vessels also distend with pressure, so the measured exponent is a little smaller; the fourth-power law is the starting point, not the full story.`,
      deps: ['physio-4.2'],
      see: ['physio-4.5', 'physio-4.16'],
      refs: ['Guyton–Hall'],
      tags: ['radius', 'arterioles'],
      viz(v) {
        const a = v.stage({ x: [0, 1.3], y: [0, 2.3], height: 320, axes: 'box', gutter: true, xlabel: 'radius r / r₀', ylabel: 'flow Q / Q₀', weight: 1 });
        const b = v.stage({ x: [0.1, 2], y: [0.0001, 20], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'radius r / r₀', ylabel: 'flow Q / Q₀', weight: 1 });
        const h = a.handle(0.84, Math.pow(0.84, 4), { color: 'gold', label: 'r', constrain: (x) => { const xx = clamp(x, 0.1, 1.3); return [xx, xx ** 4]; } });
        let fit = 4;
        v.render(() => {
          const r = h.x, q = r ** 4;
          a.fn((x) => x ** 4, { color: 'accent', width: 2.6, domain: [0, 1.3] });
          a.fn((x) => x ** 2, { color: 'muted', width: 1.2, dash: true, domain: [0, 1.3] });
          a.vline(1, { color: 'faint', dash: [4, 4] }); a.hline(1, { color: 'faint', dash: [4, 4] });
          a.line(r, 0, r, q, { color: 'orange', dash: true }); a.line(0, q, r, q, { color: 'orange', dash: true });
          const pts = [], xs = [], ys = []; for (let k = 0; k <= 60; k++) { const x = Math.exp(Math.log(0.1) + (k / 60) * Math.log(20)); pts.push([x, x ** 4]); if (x < 1.6) { xs.push(Math.log(x)); ys.push(Math.log(x ** 4)); } }
          fit = v.M.linreg(xs, ys).slope;
          b.path(pts, { color: 'accent', width: 2.6 });
          b.path(pts.map(([x]) => [x, x ** 2]), { color: 'muted', width: 1.2, dash: [5, 4] });
          b.path(pts.map(([x]) => [x, x]), { color: 'faint', width: 1.2, dash: [5, 4] });
          b.text('slope 4', 0.35, 0.35 ** 4 * 2.2, { size: 12, color: 'accent', weight: 700 });
          b.text('slope 2 (area)', 0.2, 0.2 ** 2 * 3.2, { size: 11, color: 'muted' });
          b.text('slope 1', 0.12, 0.12 * 3, { size: 11, color: 'muted' });
          b.dot(r, q, { r: 8, color: 'gold' });
        });
        v.readout(() => `$r/r_0=${v.fix(h.x, 3)}$ (constriction ${v.fix((1 - h.x) * 100, 0)}%) → $Q/Q_0=r^4=${v.fix(h.x ** 4, 3)}$ (flow ${h.x < 1 ? 'lost' : 'gained'}: ${v.fix(Math.abs(1 - h.x ** 4) * 100, 0)}%)\nlog–log slope fitted to the curve: ${v.fix(fit, 2)};  a constriction of ${v.fix((1 - Math.pow(0.5, 0.25)) * 100, 1)}% halves the flow, one of 50% leaves ${v.fix(100 / 16, 1)}%`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Vascular resistances in series and parallel',
      statement: String.raw`For vessels in **series** the same flow passes through each, so the resistances add: $R=R_1+R_2+\dots+R_n$. For vessels in **parallel** the pressure drop is common and the flows add, so the conductances ($1/R$) add: $1/R=1/R_1+\dots+1/R_n$; for $N$ identical branches $R=R_1/N$. Hence the total resistance of a branching tree is found by combining these two rules, and a bed of many parallel capillaries has a total resistance far lower than any single capillary, and lower than the arterioles feeding it.`,
      idea: String.raw`Series: continuity gives equal flow $Q$ in every element and the pressure drops $QR_i$ simply sum to $Q\sum R_i$. Parallel: each branch sees the same $\Delta P$, carries $\Delta P/R_i$, and the total is $\Delta P\sum 1/R_i$. They are exactly the series and parallel laws for electrical resistors (circ-2.3, circ-2.4) once Ohm's law for the circulation (physio-4.1) is granted. The checking tool here is Kirchhoff's node equations, solved as a linear system, which does not know the formula.`,
      caption: String.raw`A chain feeds $N$ parallel two-vessel branches that drain into a vein. Raise $N$ (the number of open branches) and watch the total resistance fall like $1/N$ for the parallel stage; click **occlude one branch** to block a branch and see the flow redistribute. The readout compares the series/parallel formula with the node pressures found by solving the linear system for every junction.`,
      scope: String.raw`Linear (Ohmic) resistances at steady flow. Real bifurcations also have junction losses and the resistance of vessels is pressure-dependent, so the formula is a first model of a vascular tree.`,
      deps: ['physio-4.1', 'circ-2.3', 'circ-2.4'],
      see: ['physio-4.10'],
      refs: ['Guyton–Hall'],
      tags: ['resistance', 'networks'],
      viz(v) {
        const sN = v.slider('number of parallel branches $N$', 1, 12, 6, { int: true });
        const sRb = v.slider('branch resistance ($R_b+R_c$ each)', 2, 40, 20, { step: 1 });
        const kill = v.toggle('occlude one branch', false);
        const s = v.stage({ x: [0, 10], y: [0, 6.2], height: 320, axes: false, weight: 1.35 });
        const g = v.stage({ x: [0, 12], y: [0, 40], height: 320, axes: 'box', gutter: true, xlabel: 'open parallel branches N', ylabel: 'total resistance', weight: 0.9, minWidth: 240 });
        const RA = 2, RV = 2;
        let o = null;
        function solve(N, Rb, open) {
          // unknowns: P1 (after RA), P2 (before RV), and mid-node of each branch; source 100, sink 0
          const n = 2 + N, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
          const stamp = (i, j, Rr, Pi = null, Pj = null) => {
            const gC = 1 / Rr;
            if (i >= 0) { A[i][i] += gC; if (j >= 0) A[i][j] -= gC; else b[i] += gC * Pj; }
            if (j >= 0) { A[j][j] += gC; if (i >= 0) A[j][i] -= gC; else b[j] += gC * Pi; }
          };
          stamp(-1, 0, RA, 100, null); stamp(1, -1, RV, null, 0);
          for (let k = 0; k < N; k++) { const Rr = open[k] ? Rb / 2 : 1e7; stamp(0, 2 + k, Rr); stamp(2 + k, 1, Rr); }
          const P = v.M.solve(A, b); return P;
        }
        v.render(() => {
          const N = sN.value, Rb = sRb.value, open = Array.from({ length: N }, (_, k) => !(kill.value && k === 0 && N > 1));
          const nOpen = open.filter(Boolean).length, Rpar = Rb / nOpen, Rtot = RA + Rpar + RV;
          const P = solve(N, Rb, open), Qn = (100 - P[0]) / RA;
          o = { N, nOpen, Rpar, Rtot, Qf: 100 / Rtot, Qn, P1: P[0], P2: P[1], dRes: Math.abs(Qn - 100 / Rtot) };
          // diagram
          const yTop = 5.4, yBot = 0.8, dy = N > 1 ? (yTop - yBot) / (N - 1) : 0, yMid = 3.1;
          s.line(0.3, yMid, 1.2, yMid, { color: 'accent', width: 3 }); s.rect(1.2, yMid - 0.25, 2.4, yMid + 0.25, { fill: 'accent', fillAlpha: 0.25, color: 'accent', radius: 3 });
          s.text(`R=${RA}`, 1.8, yMid + 0.55, { size: 11, color: 'accent', align: 'center' });
          s.line(2.4, yMid, 3.2, yMid, { color: 'accent', width: 3 });
          s.line(7.2, yMid, 8.0, yMid, { color: 'purple', width: 3 }); s.rect(8.0, yMid - 0.25, 9.2, yMid + 0.25, { fill: 'purple', fillAlpha: 0.25, color: 'purple', radius: 3 });
          s.text(`R=${RV}`, 8.6, yMid + 0.55, { size: 11, color: 'purple', align: 'center' });
          s.line(3.2, yTop, 3.2, yBot, { color: 'ink', width: 2 }); s.line(7.2, yTop, 7.2, yBot, { color: 'ink', width: 2 });
          for (let k = 0; k < N; k++) {
            const y = N > 1 ? yTop - k * dy : yMid, on = open[k], col = on ? 'green' : 'red';
            s.line(3.2, y, 4.2, y, { color: col, width: 2 }); s.line(6.2, y, 7.2, y, { color: col, width: 2 });
            s.rect(4.2, y - 0.13, 5.1, y + 0.13, { fill: col, fillAlpha: 0.3, color: col, radius: 2 }); s.rect(5.3, y - 0.13, 6.2, y + 0.13, { fill: col, fillAlpha: 0.3, color: col, radius: 2 });
            if (on) { const q = (P[0] - P[1]) / Rb; s.arrow(3.4, y + 0.28, 3.4 + 0.5 + Math.min(q * 1.8, 0.7), y + 0.28, { color: 'gold', width: 1.6, head: 5 }); }
            else s.text('✕', 5.2, y, { size: 12, color: 'red', align: 'center', baseline: 'middle' });
          }
          s.text(`${v.fix(100, 0)}`, 0.3, yMid + 0.5, { size: 11, color: 'muted', align: 'left' });
          s.text(`${v.fix(P[0], 1)}`, 3.2, 5.95, { size: 11, color: 'muted', align: 'center' });
          s.text(`${v.fix(P[1], 1)}`, 7.2, 5.95, { size: 11, color: 'muted', align: 'center' });
          s.text('0', 9.7, yMid + 0.5, { size: 11, color: 'muted', align: 'right' });
          // curve
          g.fn((x) => RA + Rb / x + RV, { color: 'accent', width: 2.4, domain: [1, 12] });
          g.fn((x) => Rb / x, { color: 'green', width: 2, dash: true, domain: [1, 12] });
          g.hline(Rb, { color: 'faint', dash: [4, 4] }); g.text('one branch', 11.8, Rb + 1.5, { size: 11, color: 'muted', align: 'right' });
          g.dot(nOpen, Rtot, { r: 7, color: 'gold' });
          g.text('parallel stage alone', 11.8, Rb / 12 + 2, { size: 11, color: 'green', align: 'right' });
        });
        v.readout(() => `series + parallel: $R=R_a+\\dfrac{R_b}{N_\\text{open}}+R_v=${v.fix(o.Rtot, 2)}$ → $Q=${v.fix(o.Qf, 3)}$;   node equations: $Q=${v.fix(o.Qn, 3)}$ (difference ${v.sci(o.dRes + 1e-16, 2)})\njunction pressures ${v.fix(o.P1, 1)} → ${v.fix(o.P2, 1)} (source 100, sink 0);  the parallel stage's resistance is ${v.fix(o.Rpar, 2)}, ${v.fix(100 * o.Rpar / o.Rtot, 0)}% of the total`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Murray’s law of optimal branching',
      statement: String.raw`Suppose a vessel of radius $r$ carrying flow $Q$ costs power both to drive the blood through it, $8\mu Q^2/(\pi r^4)$ per unit length (Poiseuille), and to keep the blood in it, $m\,\pi r^2$ per unit length, with $m$ a metabolic cost per unit volume of blood. The radius that minimises the total is the one with $Q\propto r^3$:
$$ Q=\frac{\pi}{4}\sqrt{\frac{m}{\mu}}\;r^3 .$$
At a bifurcation, conservation of flow then gives **Murray's law** $r_0^3=r_1^3+r_2^3$, and the wall shear stress $4\mu Q/(\pi r^3)$ is the same in every vessel of the optimal tree.`,
      idea: String.raw`The pumping term falls with radius ($r^{-4}$) and the blood-volume term rises ($r^2$), so the sum has an interior minimum; setting the derivative to zero (pma-5.8: an interior extremum has zero derivative) gives $r^6\propto Q^2$. Taking the cube root of that condition on each branch and using $Q_0=Q_1+Q_2$ yields the cubic branching rule. Real trees only approximate it: measured exponents are often found nearer 2–3 in large arteries, which is part of why this is called a principle of minimum work, not an identity.`,
      caption: String.raw`**Left:** the pumping cost (blue), the blood-volume cost (red) and their sum for a vessel carrying the chosen flow; the minimum is marked and you can drag the radius away from it. **Right:** a parent vessel splits into two daughters sharing flow in the ratio you choose. Their radii follow Murray's cube law; the line widths are drawn to scale. Watch the cubes add to the parent's, the wall shear stress stay equal in all three, and the total cross-sectional area grow.`,
      scope: String.raw`A model: laminar Poiseuille flow, a metabolic cost proportional to blood volume, a fixed flow in each vessel. Values of $m$ and $Q$ here are illustrative; the law gives ratios of radii, not absolute sizes. Measured branching exponents in real arterial trees differ somewhat from 3 (not checked here), and the exponent in turbulent flow would be 7/3.`,
      deps: ['physio-4.2', 'pma-5.8'],
      see: ['physio-4.10'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['optimality', 'branching'],
      credit: 'C. D. Murray, 1926',
      links: { doi: 'https://doi.org/10.1073/pnas.12.3.207' },
      viz(v) {
        const sQ = v.slider('flow $Q$', 0.5, 20, 5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mL/s` });
        const sM = v.slider('metabolic cost $m$', 2e4, 8e5, 1.4e5, { log: true, sig: 2, fmt: (x) => `${v.fix(x / 1e5, 2)}×10⁵ W/m³` });
        const sF = v.slider('flow share of daughter 1', 0.1, 0.5, 0.5, { step: 0.01 });
        const a = v.stage({ x: [0.2, 3], y: [0, 1500], height: 320, axes: 'box', gutter: true, xlabel: 'radius r (mm)', ylabel: 'power per length (mW/m)', weight: 1 });
        const b = v.stage({ x: [0, 10], y: [-4, 4], height: 320, axes: false, weight: 1 });
        const hr = a.handle(1, 0, { color: 'gold', label: 'r', constrain: 'x' });
        const MU = MU_BLOOD;
        const pump = (r, Q) => (8 * MU * (Q * 1e-6) ** 2) / (Math.PI * (r * 1e-3) ** 4) * 1e3;
        const vol = (r, m) => m * Math.PI * (r * 1e-3) ** 2 * 1e3;
        const ropt = (Q, m) => Math.cbrt((4 * Q * 1e-6 * Math.sqrt(MU)) / (Math.PI * Math.sqrt(m))) * 1e3;
        let o = null, init = false;
        v.render(() => {
          const Q = sQ.value, m = sM.value, ro = ropt(Q, m);
          if (!init) { hr.set(ro * 1.5, 0); init = true; }
          const rr = clamp(hr.x, 0.25, 3); hr.set(rr, 0);
          a.fn((r) => pump(r, Q), { color: 'accent', width: 2.2, domain: [0.2, 3] });
          a.fn((r) => vol(r, m), { color: 'red', width: 2.2, domain: [0.2, 3] });
          a.fn((r) => pump(r, Q) + vol(r, m), { color: 'ink', width: 2.8, domain: [0.2, 3] });
          const tot = pump(ro, Q) + vol(ro, m);
          a.vline(ro, { color: 'green', dash: [5, 4] }); a.dot(ro, tot, { r: 7, color: 'green', label: 'optimum', labelPos: 'ne' });
          a.dot(rr, pump(rr, Q) + vol(rr, m), { r: 6, color: 'gold' });
          a.text('pumping', 2.9, 70, { size: 11, color: 'accent', align: 'right' }); a.text('blood volume', 2.9, vol(2.9, m) - 90, { size: 11, color: 'red', align: 'right' });
          // bifurcation
          const f = sF.value, r0 = ro, r1 = r0 * Math.cbrt(f), r2 = r0 * Math.cbrt(1 - f), W = 9 / ro;
          const lw = (r) => Math.max(2, 18 * r / ro);
          b.line(0.5, 0, 3.5, 0, { color: 'accent', width: lw(r0) });
          b.line(3.5, 0, 8.5, 2.1, { color: 'green', width: lw(r1) }); b.line(3.5, 0, 8.5, -2.1, { color: 'orange', width: lw(r2) });
          b.text(`r₀ = ${v.fix(r0, 2)}`, 2, 0.9, { size: 12, color: 'accent', align: 'center', weight: 700 });
          b.text(`r₁ = ${v.fix(r1, 2)}`, 7.4, 2.9, { size: 12, color: 'green', align: 'center', weight: 700 });
          b.text(`r₂ = ${v.fix(r2, 2)}`, 7.4, -2.9, { size: 12, color: 'orange', align: 'center', weight: 700 });
          const tau = (q, r) => (4 * MU * q * 1e-6) / (Math.PI * (r * 1e-3) ** 3);
          o = { ro, r0, r1, r2, f, Q, t0: tau(Q, r0), t1: tau(f * Q, r1), t2: tau((1 - f) * Q, r2), cur: pump(rr, Q) + vol(rr, m), tot };
        });
        v.readout(() => `optimal radius $r^*=${v.fix(o.ro, 3)}$ mm;  your radius costs ${v.fix(100 * (o.cur / o.tot - 1), 1)}% more than the minimum\n$r_1^3+r_2^3=${v.fix(o.r1 ** 3 + o.r2 ** 3, 4)}$ vs $r_0^3=${v.fix(o.r0 ** 3, 4)}$;  wall shear ${v.fix(o.t0, 2)} / ${v.fix(o.t1, 2)} / ${v.fix(o.t2, 2)} Pa;  area ratio $(r_1^2+r_2^2)/r_0^2=${v.fix((o.r1 ** 2 + o.r2 ** 2) / o.r0 ** 2, 3)}$`);
      },
    },
  ],
};
