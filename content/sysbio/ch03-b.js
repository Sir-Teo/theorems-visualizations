// Systems Biology — Chapter 3 (part b): I1-FFL acceleration, rare FFL types, temporal programs (SIM, multi-output FFL), dense overlapping regulons
import { FFL_TYPES, fflSim, crossAfter, edge, hillAct, hillRep, reg, logic, isCoherent, fflType } from './ch03.shared.js';

import { fflSensitivityOutput, fflSensitivity } from './sysbio-source-audit-ffl.shared.js';
import {simProgram,fflProgram,programOrder} from './sysbio-source-audit-programs.shared.js';

const sgn = (s) => (s > 0 ? '+' : '−');
function traces(S, r, o = {}) {
  const pts = (a) => r.t.map((t, i) => [t, a[i]]);
  S.path(pts(r.X), { color: 'muted', width: 2, dash: true });
  S.path(pts(r.Y), { color: 'blue', width: 3 });
  S.path(pts(r.Z), { color: 'green', width: 3.5 });
  if (o.simple) S.path(pts(o.simple), { color: 'faint', width: 2, dash: true });
}
const css = (c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

export default {
  collection: 'sysbio',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'I1-FFL generates pulses and accelerates responses',
      statement: String.raw`Let a simply regulated gene with $\dot Z=\beta_s-\alpha Z$ and an I1-FFL target (3.5) with the same removal rate $\alpha_Z=\alpha$ have the **same steady state** $Z_{\rm st}$ after $X$ is switched on. Write $\delta=Z_{\rm st}/Z_{\max}\in(0,1)$ for the factor by which the repressor lowers production, $Z_{\max}=\beta_Z/\alpha$. The simple gene needs $T_{1/2}=\ln2/\alpha$ to reach half of $Z_{\rm st}$. If the repressor $Y$ is slow enough that $Z$ reaches $Z_{\rm st}/2$ before $Y$ has repressed it, the I1-FFL needs only
$$T_{1/2}^{\rm I1}=-\frac1\alpha\ln\!\Bigl(1-\frac{\delta}{2}\Bigr)\approx\frac{\delta}{2\alpha},$$
so the response is faster by the factor $\ln2\big/\bigl[-\ln(1-\delta/2)\bigr]\approx 2\ln2/\delta$, which grows without bound as the repression gets stronger ($\delta\to0$). The same circuit shows an overshoot and a pulse of $Z$ whenever $Y$ catches up only after $Z$ has passed $Z_{\rm st}$.`,
      idea: String.raw`With matched steady states, the simple gene must produce at the low rate $\beta_s=\alpha Z_{\rm st}$ and therefore creeps up, while the I1-FFL gene starts out unrepressed at the high rate $\beta_Z=\alpha Z_{\rm st}/\delta$. Until the repressor builds up, $Z$ follows the relaxation law of 1.5 with this large $\beta_Z$, $Z(t)=Z_{\max}(1-e^{-\alpha t})$; solving $Z(T)=Z_{\rm st}/2=\delta Z_{\max}/2$ gives $T$ above. The comparison is therefore the one between $\ln 2/\alpha$ of 1.6 and the much shorter time to reach a small target at a large production rate, exactly the mechanism of negative autoregulation (2.2).`,
      caption: String.raw`Left: the I1-FFL target (green) against a simple gene tuned to the same final level (faint dashed); gold dots mark the half-rise times. Right: the speed-up factor against repression strength $Y_{\rm st}/K_{YZ}$ for your $n$ and $\alpha_Y$ (green, simulated) and the formula above (dashed). Lower the speed of $Y$ and the two coincide; make $Y$ fast (large $\alpha_Y$) and the acceleration is lost because repression arrives before $Z$ has risen.`,
      deps: ['sysbio-3.5'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'response time'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985); experiment on the gal system: S. Mangan, S. Itzkovitz, A. Zaslaver & U. Alon, 2006 (J. Mol. Biol. 356: 1073–1081)',
      scope: String.raw`Acceleration is compared at equal steady state and equal removal rate; the Hill repression is graded, so the closed form is exact only for slow repressor ($\alpha_Y\ll\alpha$) and sharp thresholds. A circuit that is not compared at equal steady state shows no such speed-up: the I1-FFL pays for it with a low output level.`,
      links: { doi: 'https://doi.org/10.1016/j.jmb.2005.12.003' },
      viz(v) {
        const F = v.slider(String.raw`repression strength $Y_{\rm st}/K_{YZ}$`, 1, 30, 4, { log: true, sig: 2 });
        const AY = v.slider(String.raw`speed of $Y$: $\alpha_Y/\alpha_Z$`, 0.1, 5, 0.3, { log: true, sig: 2 });
        const N = v.slider('cooperativity n', 1, 3, 1, { int: true });
        const S1 = v.stage({ x: [0, 4], y: [-0.03, 1.1], axes: 'box', gutter: true, height: 320, weight: 1.3, minWidth: 320, xlabel: 'time (units of 1/α)', ylabel: 'Z / Z_st' });
        const S2 = v.stage({ x: [1, 30], xlog: true, y: [1, 30], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 270, xlabel: 'repression strength Y_st / K_YZ', ylabel: 'speed-up of half-rise' });
        const mk = (f, n, ay) => ({ sxy: 1, syz: -1, sxz: 1, lg: 'AND', Kxy: 0.01, Kyz: 1 / f, Kxz: 0.01, n, by: ay, ay, bz: 1, az: 1 });
        const zstOf = (f, n) => { const x = hillAct(1, 0.01, n); return x * hillRep(x, 1 / f, n); };
        const speed = (f, n, ay) => { const r = fflSim(mk(f, n, ay), (t) => (t > 0 ? 1 : 0), 6, 0.005); return Math.LN2 / crossAfter(r.t, r.Z, zstOf(f, n) / 2); };
        const formula = (f, n) => { const d = hillRep(hillAct(1, 0.01, n), 1 / f, n); return Math.LN2 / -Math.log(1 - d / 2); };
        let m = {};
        v.render(() => {
          const f = F.value, ay = AY.value, n = N.value, zs = zstOf(f, n);
          const r = fflSim(mk(f, n, ay), (t) => (t > 0 ? 1 : 0), 4, 0.005);
          const z = r.Z.map((x) => x / zs);
          S1.setView([0, 4], [-0.03, Math.max(1.1, 1.08 * Math.max(...z))]);
          S1.path(r.t.map((t, i) => [t, 1 - Math.exp(-t)]), { color: 'accent', width: 3, dash: true });
          S1.path(r.t.map((t, i) => [t, z[i]]), { color: 'green', width: 3.5 });
          S1.hline(1, { color: 'faint', dash: true });
          S1.hline(0.5, { color: 'faint', dash: true, width: 1 });
          const T = crossAfter(r.t, z, 0.5);
          S1.dot(Math.LN2, 0.5, { r: 6, color: 'gold' }); S1.dot(T, 0.5, { r: 6, color: 'gold' });
          const fs = []; for (let k = 0; k <= 28; k++) fs.push(Math.pow(30, k / 28));
          const sim = fs.map((x) => [x, speed(x, n, ay)]);
          const mx = Math.max(...sim.map((p) => p[1]), formula(30, n));
          S2.setView([1, 30], [1, Math.max(3, mx * 1.2)]);
          S2.path(fs.map((x) => [x, formula(x, n)]), { color: 'orange', width: 2, dash: true });
          S2.path(sim, { color: 'green', width: 3 });
          S2.dot(f, speed(f, n, ay), { r: 7, color: 'gold' });
          m = { T, sp: Math.LN2 / T, form: formula(f, n), delta: hillRep(hillAct(1, 0.01, n), 1 / f, n), peak: Math.max(...z), zs };
        });
        v.legend([['accent', 'simple gene, same Z_st', { dash: true }], ['green', 'I1-FFL target'], ['orange', 'formula −ln(1−δ/2)', { dash: true }]]);
        v.readout(() => `$\\delta=Z_{\\rm st}/Z_{\\max}=${v.fix(m.delta, 3)}$. Half-rise time of the I1-FFL: $${v.fix(m.T, 3)}/\\alpha$ against $\\ln2=0.693/\\alpha$ for the simple gene: speed-up $${v.fix(m.sp, 2)}$ (formula $${v.fix(m.form, 2)}$). Peak output is ${v.fix(m.peak, 2)} times its final value.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Concept',
      name: 'Why some FFL types are rare',
      statement: String.raw`Of the eight FFL types (3.1), C1 is the most common coherent type and I1 the most common incoherent type in the historical E. coli and yeast databases examined by Mangan & Alon. Mangan and Alon asked whether the rare types are rare because they are less useful, and found that some of them have **reduced functionality**: under the paper’s functional-parameter and Boolean limits, AND-gate coherent C3/C4 respond to at most the X signal at steady state, and AND-gate incoherent I3/I4 can have constant zero output. To test this, treat the two regulatory inputs of $Z$ as two signals: $s_x$ (the activity of $X$) and $s_y$ (the activity of $Y$ relative to its expression, which itself depends on $s_x$). A type is functionally weak in this sense if $Z$ barely changes when one of the two signals is varied.`,
      idea: String.raw`For every type the steady-state output $Z(s_x,s_y)$ is computed from the Hill terms of 1.3 combined by the logic of 1.4, with $Y$ expressed as the Hill function of $s_x$ along the $X\to Y$ edge. A grid-averaged total-variation score of $Z$ in each direction measures how much each signal is heard. The step response of the selected type (bottom) shows what its dynamics add. The picture is a sensitivity screen in one model, with one threshold and one cooperativity; it cannot by itself prove why evolution favoured C1 and I1.`,
      caption: String.raw`Each tile is the steady-state output $Z$ (stronger colour is higher) over the two signals $s_x$ (horizontal) and $s_y$ (vertical), with grid sensitivity scores below it (mean one-dimensional total variation over the sampled opposite input). Switch the logic between AND, OR and SUM and note how the pattern of tiles changes, then click a tile to see its time response (below). Look for types in which one sensitivity score is much smaller than the other.`,
      deps: ['sysbio-3.1'],
      refs: ['Mangan & Alon (2003), PNAS100:11980–11985: Tables1–3 pp11981–11982, AND sensitivity Results11982–11983, qualified evolutionary discussion11984–11985'],
      tags: ['feed-forward loop', 'motifs'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985)',
      verify: false,
      scope: String.raw`The original full paper’s Tables1–3 and Results/Discussion were checked. Reduced steady-state input sensitivity is a proposed partial explanation, not proof of evolutionary selection; the authors explicitly say that this reasoning does not apply to their OR-gate case. The colored screen is the atlas’s chosen graded Hill model (n=2,K=0.5), with a separate n=4 step response, not the source’s Boolean-limit table or empirical frequency chart. AND, independent-input OR and normalized SUM are distinct chosen functions; the original paper uses a different competitive-binding OR formula. Ranks may change with thresholds, signal ranges, cooperativity, logic or the metric.`,
      viz(v) {
        const LG = v.select('logic at Z', ['AND', 'OR', 'SUM'], 'AND');
        const A = v.stage({ x: [0, 4], y: [0, 2.35], axes: false, height: 340, full: true, title: 'steady-state Z over the two signals: s_x (right) and s_y (up)' });
        const B = v.stage({ x: [0, 16], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'time (units of 1/α_Y)', ylabel: 'level (scaled)' });
        let sel = 0, txt = '';
        const NC = 11, K = 0.5, n = 2;
        const zOf=fflSensitivityOutput;
        v.render(() => {
          const lg = LG.value, info = [];
          FFL_TYPES.forEach((t, k) => {
            const ox = k % 4, oy = k < 4 ? 1.2 : 0.0;
            for (let i = 0; i < NC; i++) for (let j = 0; j < NC; j++) {
              const z = zOf(t, lg, (i + 0.5) / NC, (j + 0.5) / NC);
              A.rect(ox + 0.1 + (0.8 * i) / NC, oy + 0.4 + (0.72 * j) / NC, ox + 0.1 + (0.8 * (i + 1)) / NC, oy + 0.4 + (0.72 * (j + 1)) / NC, { fill: css(v.ramp(z, 'accent')), stroke: false, fillAlpha: 1 });
            }
            A.rect(ox + 0.1, oy + 0.4, ox + 0.9, oy + 1.12, { color: k === sel ? 'accent' : 'faint', width: k === sel ? 3 : 1, fill: false });
            const[ax,ay]=fflSensitivity(t,lg);info.push([t.id,ax,ay]);
            A.text(t.id, ox + 0.5, oy + 0.17, { size: 14, color: k === sel ? 'accent' : 'ink', align: 'center' });
            A.text(`Vx ${v.fix(ax, 2)}   Vy ${v.fix(ay, 2)}`, ox + 0.5, oy + 0.3, { size: 10.5, color: 'muted', align: 'center' });
          });
          const t = FFL_TYPES[sel];
          const p = { sxy: t.s[0], syz: t.s[1], sxz: t.s[2], lg, Kxy: 0.5, Kyz: 0.5, Kxz: 0.5, n: 4, by: 1, ay: 1, bz: 6, az: 6 };
          traces(B, fflSim(p, (tt) => (tt >= 2 && tt < 9 ? 1 : 0), 16, 0.01));
          B.text(`${t.id}: X→Y ${sgn(t.s[0])}, Y→Z ${sgn(t.s[1])}, X→Z ${sgn(t.s[2])}, ${lg}`, 15.8, 1.08, { size: 12, color: 'ink', align: 'right' });
          const lop = info.map(([id, a, b]) => [id, Math.min(a, b) / Math.max(a, b, 1e-9)]).sort((u, w) => u[1] - w[1]);
          txt = `Most lopsided under ${lg}: ${lop.slice(0, 2).map((q) => `${q[0]} (weaker/stronger score ${v.fix(q[1], 2)})`).join(', ')}; most balanced: ${lop[lop.length - 1][0]} (${v.fix(lop[lop.length - 1][1], 2)}).`;
        });
        A.onClick((x, y) => {
          const col = Math.floor(x), row = y >= 1.2 ? 0 : 1;
          if (col >= 0 && col < 4) { sel = row * 4 + col; v.invalidate(); }
        });
        v.legend([['muted', 'X', { dash: true }], ['blue', 'Y'], ['green', 'Z']]);
        v.readout(() => txt);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Concept',
      name: 'Single-input modules and last-in-first-out programs',
      statement: String.raw`A **single-input module** (SIM) has one transcriptional regulator and no additional transcriptional inputs to its targets; its regulatory edges have the same sign. For activating targets with $K_1<\dots<K_m$, a regulator that rises monotonically through every threshold activates sharp-threshold production in order $1,\dots,m$; falling through them stops production in reverse order. This is a **last-in-first-out** (LIFO) program. For the displayed graded model $\dot Z_i=H(X,K_i)-Z_i$ with identical Hill exponents and equal zero initial levels, $Z_1(t)\ge\dots\ge Z_m(t)$ at every time. Faster input compresses some lags but does not reverse this order. A short or weak pulse can leave some reporter half-levels unreached.`,
      idea: String.raw`The original SIM analysis uses Boolean production and common removal rates (Shen-Orr et al., Figure2b and Methods). Here $H(X,K)=X^4/(K^4+X^4)$. Since lower K gives a larger production input, $Z_i-Z_j=\int_0^t e^{-(t-s)}[H(X(s),K_i)-H(X(s),K_j)]\,ds\ge0$ for i<j. Thus common upward reporter crossings are ordered, and common downward crossings occur in reverse. Reporter half-levels differ from the regulator crossing $X=K_i$. The lag $\ln2$ is exact after a sustained production step from zero to one, not a universal delay added to a moving graded input.`,
      caption: String.raw`Chosen model, not measured enzyme trajectories. Top: exact regulator response to a pulse from time1 with the four thresholds. Bottom: four reporter concentrations; green dots mark upward crossings of 0.5 and red dots downward crossings after input withdrawal. Change speed, duration and threshold spacing. The readout labels incomplete crossings within the 24-unit window and any half-rise that occurs only after the input has been withdrawn.`,
      deps: ['sysbio-1.4'],
      refs: ['Shen-Orr et al. (2002), original advance-online PDF: Figure1c/definition pp1–2; Figure2b/discussion p3; Boolean kinetic model Methods p5'],
      tags: ['single-input module', 'temporal programs'],
      credit: 'S. Shen-Orr, R. Milo, S. Mangan & U. Alon, 2002, Nature Genetics31:64–68 (SIM definition and theoretical temporal program); graded numerical illustration chosen here',
      verify: false,
      scope: String.raw`The complete original five-page Shen-Orr et al. article was checked. Its LIFO temporal program is a mathematical motif analysis, not a measured universal enzyme-shutdown law. The four E1–E4 reporters here are generic; no specific amino-acid pathway or empirical just-in-time ordering is asserted. Their common kinetics, zero initial levels, chosen thresholds, Hill exponent4 and finite 24-unit observation are model assumptions. Gene-specific production/removal, extra inputs and leaks can invalidate the pointwise ordering proof.`,
      viz(v) {
        const R = v.slider('threshold spacing  K_(i+1)/K_i', 1.1, 2.6, 1.8, { step: 0.05 });
        const AX = v.slider(String.raw`speed of $X$: $\alpha_X/\alpha_Z$`, 0.1, 20, 0.4, { log: true, sig: 2 });
        const DUR = v.slider('signal duration', 3, 14, 8, { step: 0.5 });
        const T = 24, XM = 2;
        const S1 = v.stage({ x: [0, T], y: [0, 2.3], axes: 'box', gutter: true, height: 230, full: true, ylabel: 'regulator X' });
        const rowY = [3.75, 2.5, 1.25, 0];
        const S2 = v.stage({ x: [0, T], y: [-0.15, 4.95], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'time (units of 1/α_Z)', yticks: [[0.5, 'E4'], [1.75, 'E3'], [3.0, 'E2'], [4.25, 'E1']] });
        let txt = '';
        v.render(() => {
          const d=DUR.value, result=simProgram(R.value,AX.value,d), {t,X,Z,K}=result, order=programOrder(result,'E');
          S1.path(t.map((tt, i) => [tt, X[i]]), { color: 'accent', width: 3.5 });
          const cols = ['teal', 'blue', 'purple', 'pink'];
          K.forEach((k, j) => { S1.hline(k, { color: cols[j], dash: true, width: 1.5 }); });
          const on = [], off = [];
          K.forEach((k, j) => {
            const base = rowY[j];
            S2.path(t.map((tt, i) => [tt, base + 0.95 * Z[j][i]]), { color: cols[j], width: 3 });
            S2.hline(base + 0.475, { color: 'faint', dash: true, width: 0.7 });
            const a=order.on[j],b=order.off[j];
            if (a!==null) { S2.dot(a, base + 0.475, { r: 5, color: 'green' }); }
            if (b!==null) { S2.dot(b, base + 0.475, { r: 5, color: 'red' }); }
            on.push([`E${j + 1}`, a]); off.push([`E${j + 1}`, b]);
          });
          txt=`Thresholds K1–K4: ${K.map(k=>v.fix(k,3)).join(', ')}. Reporter upward half-level order: ${order.up.join(' → ')||'(none)'}. Downward half-level order after withdrawal: ${order.down.join(' → ')||'(none)'}. ${order.kind}. ${order.late?'At least one reporter reaches its upward half-level only after withdrawal.':''} Missing crossings mean not observed in this finite window, not zero expression.`;
        });
        v.legend([['accent', 'regulator X'], ['teal', 'E1 / K1 (lowest)'], ['blue', 'E2 / K2'], ['purple', 'E3 / K3'], ['pink', 'E4 / K4 (highest)'], ['green', 'reporter half-rise', { dot: true }], ['red', 'reporter half-fall', { dot: true }]]);
        v.readout(() => txt);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Multi-output FFL and first-in-first-out order',
      statement: String.raw`In a **multi-output FFL**, $X$ activates $Y$, and both regulate targets $Z_i$. In a sharp OR model, production is ON when $X>K_{x,i}$ or $Y>K_{y,i}$. Suppose X dominates all activation times and Y dominates all deactivation times, and both regulators cross every relevant threshold. Increasing $K_{x,i}$ orders activation $1,\dots,m$; decreasing $K_{y,i}$ then orders deactivation $1,\dots,m$, yielding **first-in-first-out** (FIFO). With increasing Y thresholds the resulting order is LIFO. These sufficient dominance and threshold-crossing assumptions need not hold for every finite pulse or graded model.`,
      idea: String.raw`For sharp OR production, activation is the earlier of the two activating threshold crossings and deactivation is the later of the two falling crossings. Independent threshold choices can therefore set the two orders when X controls the former and Y the latter. The real flagella circuit studied by Kalir, Mangan & Alon has additive (SUM) input from FlhDC and FliA, plus FliA autoregulation and the FlgM/basal-body checkpoint. Their measured OFF delay supports persistence in that circuit, not a measured three-target FIFO law. The displayed independent-input OR and reporter kinetics are a separate chosen example.`,
      caption: String.raw`Chosen graded illustration: X (gray) has removal rate1.5, Y (blue) removal rate1.5 times the chosen ratio; reporter removal rate is4, all per model time unit. Bottom: reporter concentrations and directed crossings of the common level0.5. Change both threshold designs, the Y rate and pulse duration. The measured order is recomputed; a design label alone does not guarantee FIFO or LIFO. Missing crossings are reported as incomplete within the displayed window.`,
      deps: ['sysbio-3.2', 'sysbio-3.8'],
      refs: ['Kalir, Mangan & Alon (2005), Molecular Systems Biology doi10.1038/msb4100010: E1–E2 SUM/OR distinction and Figure1; E3–E4 Figures2–3, controls and feedback limitations'],
      tags: ['feed-forward loop', 'temporal programs'],
      credit: 'S. Kalir, S. Mangan & U. Alon, 2005, Molecular Systems Biology1:2005.0006 (experimental SUM-FFL OFF delay); multi-output OR threshold design derived here',
      verify: false,
      scope: String.raw`The full original six-page Kalir et al. paper was read. It measured fliL reporter dynamics with and without fliA, including inducible FlhDC ON/OFF and native-promoter comparisons; it did not establish the three-target FIFO pattern shown here. Its additive SUM input differs from the chosen bounded independent OR a+b−ab. The visualization omits FliA autoregulation, FlgM and the basal-body checkpoint. Chosen thresholds and finite-Hill reporter half-levels are not fits or promoter switching times; parameter changes can give incomplete or mixed programs.`,
      viz(v) {
        const DES = v.select('Y thresholds', [{ value: 'fifo', label: 'reversed (FIFO design)' }, { value: 'lifo', label: 'same order (LIFO design)' }], 'fifo');
        const AY = v.slider(String.raw`speed of $Y$: $\alpha_Y/\alpha_X$`, 0.1, 5, 0.3, { log: true, sig: 2 });
        const DUR = v.slider('X on-time', 4, 10, 7, { step: 0.5 });
        const T = 20, AX = 1.5, AZ = 4;
        const S1 = v.stage({ x: [0, T], y: [0, 1.15], axes: 'box', gutter: true, height: 240, full: true, ylabel: 'regulators' });
        const S2 = v.stage({ x: [0, T], y: [-0.15, 3.75], axes: 'box', gutter: true, height: 320, full: true, xlabel: 'time (model units)', yticks: [[0.5, 'Z3'], [1.75, 'Z2'], [3.0, 'Z1']] });
        let txt = '';
        v.render(() => {
          const result=fflProgram(AY.value,DUR.value,DES.value),{t,X,Y,Z,Kx,Ky}=result,order=programOrder(result,'Z');
          S1.path(t.map((tt, i) => [tt, X[i]]), { color: 'muted', width: 2.5, dash: true });
          S1.path(t.map((tt, i) => [tt, Y[i]]), { color: 'blue', width: 3.5 });
          Kx.forEach((k, j) => { S1.hline(k, { color: 'green', dash: true, width: 1 }); S1.text(`Kx${j + 1}`, 0.2, k, { color: 'green', size: 10.5, dy: -7, align: 'left' }); });
          Ky.forEach((k, j) => { S1.hline(k, { color: 'blue', dash: [2, 4], width: 1.2 }); S1.text(`Ky${j + 1}`, T - 0.2, k, { color: 'blue', size: 10.5, dy: 7, align: 'right' }); });
          const base = [3.0, 1.75, 0.5].map((b) => b - 0.5), on = [], off = [];
          const cols = ['teal', 'purple', 'pink'];
          Z.forEach((zz, j) => {
            S2.path(t.map((tt, i) => [tt, base[j] + 0.95 * zz[i]]), { color: cols[j], width: 3 });
            S2.hline(base[j] + 0.475, { color: 'faint', dash: true, width: 0.7 });
            const a=order.on[j],b=order.off[j];
            if (a!==null) S2.dot(a, base[j] + 0.475, { r: 5, color: 'green' });
            if (b!==null) S2.dot(b, base[j] + 0.475, { r: 5, color: 'red' });
            on.push([`Z${j + 1}`, a]); off.push([`Z${j + 1}`, b]);
          });
          const fmt=t=>t===null?'not observed':v.fix(t,2);
          txt=`Reporter upward half-level order: ${order.up.join(' → ')||'(none)'}. Downward half-level order after withdrawal: ${order.down.join(' → ')||'(none)'}. This program is ${order.kind}. ${order.late?'A half-rise occurs only after input withdrawal.':''}\nTimes (up / down): ${order.on.map((q,j)=>`Z${j+1} ${fmt(q)} / ${fmt(order.off[j])}`).join('; ')}. Missing means not observed within 20 model time units.`;
        });
        v.legend([['muted', 'X', { dash: true }], ['blue', 'Y'], ['teal', 'Z1'], ['purple', 'Z2'], ['pink', 'Z3'], ['green', 'reporter half-rise', { dot: true }], ['red', 'reporter half-fall', { dot: true }]]);
        v.readout(() => txt);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Dense overlapping regulons',
      statement: String.raw`A **dense overlapping regulon** (DOR) is a layer of the transcription network in which a set of input transcription factors regulates a set of target operons through many overlapping connections, much denser than in randomised networks with the same degrees. Unlike a single-input module, every target is controlled by several regulators at once, so it computes a **multi-input logic function** of them: a truth table that says for which combinations of active regulators the target is expressed. Each target can therefore use its own combination of activators and repressors.`,
      idea: String.raw`If every target had its own single regulator, the layer would be a collection of SIMs (3.8) and each target would just follow one input. Wiring several regulators to each target and sharing regulators among targets lets $r$ regulators control many targets with different functions of the same $r$ signals: the number of distinct functions available to each target grows with the number of its inputs ($2^{2^k}$ Boolean functions of $k$ inputs), and the regulon of one factor overlaps the regulons of the others. The logic realised at a promoter was introduced in 1.4.`,
      caption: String.raw`**A synthetic illustration, not the *E. coli* network.** Five regulators (left) and twelve target operons (right); green arrows activate and red bars repress. Hover or click a target to see its truth table (right panel): rows list the states of its inputs, the last column the expression of the target. Switch the structure to *single-input modules* to see the same layer rewired so that every target has exactly one regulator and its table has only two rows, then press *Resample*.`,
      deps: ['sysbio-1.9', 'sysbio-1.4'],
      refs: ['Alon: Temporal Programs and the Global Structure of Transcription Networks'],
      tags: ['network motifs', 'logic'],
      credit: 'S. Shen-Orr, R. Milo, S. Mangan & U. Alon, 2002 (DOR as a motif in E. coli; Nature Genetics 31: 64–68)',
      scope: String.raw`The layer is random with a fixed seed and an arbitrary rule for the logic (activators combine by AND or OR, any active repressor switches the target off). I did not use RegulonDB or any measured DOR, so the numbers shown (regulon sizes, inputs per target) are properties of this toy network only.`,
      viz(v) {
        const MODE = v.select('structure', [{ value: 'dor', label: 'dense overlapping regulons' }, { value: 'sim', label: 'single-input modules' }], 'dor');
        const DENS = v.slider('inputs per target (mean)', 2, 3.5, 2.5, { step: 0.1 });
        let seed = 7;
        v.button('Resample', () => { seed += 1; });
        const NR = 5, NT = 12, RN = ['R1', 'R2', 'R3', 'R4', 'R5'];
        const S1 = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 400, hover: true, minWidth: 300, title: 'regulators and targets' });
        const S2 = v.stage({ x: [0, 6], y: [0, 10], axes: false, height: 400, minWidth: 260, title: 'truth table of the selected target' });
        let net = null, key = '', pinned = 0, sel = 0, txt = '';
        const build = () => {
          const r = v.rng(seed * 101 + (MODE.value === 'sim' ? 7 : 0));
          const targets = [];
          for (let i = 0; i < NT; i++) {
            let k = 1;
            if (MODE.value === 'dor') { const mean = DENS.value; k = Math.max(2, Math.min(4, Math.round(mean + (r() - 0.5) * 1.6))); }
            const regs = r.shuffle([0, 1, 2, 3, 4]).slice(0, k).sort((a, b) => a - b);
            const sgnv = regs.map(() => (r() < 0.68 ? 1 : -1));
            if (k > 1 && sgnv.every((s) => s < 0)) sgnv[0] = 1;
            targets.push({ regs, sgn: sgnv, kind: r() < 0.5 ? 'AND' : 'OR' });
          }
          return { targets };
        };
        const out = (tg, bits) => {
          const acts = [], reps = [];
          tg.regs.forEach((rg, i) => (tg.sgn[i] > 0 ? acts : reps).push(bits[i]));
          const a = acts.length ? (tg.kind === 'AND' ? acts.every(Boolean) : acts.some(Boolean)) : true;
          return a && !reps.some(Boolean) ? 1 : 0;
        };
        const ry = (i) => 9 - i * 2, ty = (j) => 9.4 - j * (8.8 / (NT - 1));
        S1.onClick((x, y) => {
          let b = -1, bd = 0.6;
          for (let j = 0; j < NT; j++) { const d = Math.hypot(x - 8.6, y - ty(j)); if (d < bd) { bd = d; b = j; } }
          if (b >= 0) { pinned = b; v.invalidate(); }
        });
        v.render(() => {
          const kk = `${seed}|${MODE.value}|${DENS.value}`;
          if (kk !== key) { net = build(); key = kk; }
          sel = pinned;
          const pt = S1.pointer;
          if (pt && pt.inside) { let bd = 0.6; for (let j = 0; j < NT; j++) { const d = Math.hypot(pt.x - 8.6, pt.y - ty(j)); if (d < bd) { bd = d; sel = j; } } }
          net.targets.forEach((tg, j) => tg.regs.forEach((rg, i) => {
            const on = j === sel;
            edge(S1, 1.5, ry(rg), 8.25, ty(j), tg.sgn[i], { width: on ? 3.5 : 1.2, color: on ? undefined : (tg.sgn[i] > 0 ? 'green' : 'red'), bar: on ? 0.22 : 0.12 });
          }));
          RN.forEach((n, i) => S1.dot(1.2, ry(i), { r: 12, color: 'accent', label: n, labelPos: 'w' }));
          net.targets.forEach((tg, j) => S1.dot(8.6, ty(j), { r: j === sel ? 9 : 6, color: j === sel ? 'orange' : 'ink', label: `g${j + 1}`, labelPos: 'e' }));
          // truth table
          const tg = net.targets[sel], k = tg.regs.length, rows = 1 << k;
          const cw = 0.85, x0 = 3.0 - ((k + 1) * cw) / 2, ch = Math.min(0.9, 8 / rows);
          tg.regs.forEach((rg, i) => S2.text(RN[rg], x0 + (i + 0.5) * cw, 9.3, { color: tg.sgn[i] > 0 ? 'green' : 'red', size: 13, align: 'center' }));
          S2.text(`g${sel + 1}`, x0 + (k + 0.5) * cw, 9.3, { color: 'orange', size: 13, align: 'center' });
          for (let m = 0; m < rows; m++) {
            const bits = tg.regs.map((_, i) => (m >> (k - 1 - i)) & 1), o = out(tg, bits), yy = 8.6 - m * ch;
            bits.forEach((b, i) => { S2.rect(x0 + i * cw + 0.04, yy - ch + 0.04, x0 + (i + 1) * cw - 0.04, yy - 0.04, { fill: b ? 'accent' : 'faint', fillAlpha: b ? 0.55 : 0.12, stroke: false }); S2.text(String(b), x0 + (i + 0.5) * cw, yy - ch / 2, { size: 12, align: 'center', baseline: 'middle', color: 'ink' }); });
            S2.rect(x0 + k * cw + 0.04, yy - ch + 0.04, x0 + (k + 1) * cw - 0.04, yy - 0.04, { fill: o ? 'green' : 'red', fillAlpha: o ? 0.55 : 0.2, stroke: false });
            S2.text(o ? 'ON' : 'off', x0 + (k + 0.5) * cw, yy - ch / 2, { size: 12, align: 'center', baseline: 'middle', color: 'ink' });
          }
          const sizes = RN.map((_, i) => net.targets.filter((t) => t.regs.includes(i)).length);
          const multi = net.targets.filter((t) => t.regs.length > 1).length;
          const logicTxt = tg.sgn.some((s) => s > 0) ? `${tg.sgn.filter((s) => s > 0).length > 1 ? 'activators combined by ' + tg.kind : 'one activator'}, any active repressor turns it off` : 'ON unless a repressor is active';
          txt = `g${sel + 1}: ${k} input${k > 1 ? 's' : ''}, ${logicTxt}.\nRegulon sizes (targets per regulator): ${RN.map((n, i) => `${n} ${sizes[i]}`).join(', ')}. Targets with two or more regulators: ${multi} of ${NT}.`;
        });
        v.legend([['green', 'activates'], ['red', 'represses'], ['orange', 'selected target', { dot: true }]]);
        v.readout(() => txt);
      },
    },
  ],
};
