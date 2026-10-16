// Systems Biology — Chapter 3 (part b): I1-FFL acceleration, rare FFL types, temporal programs (SIM, multi-output FFL), dense overlapping regulons
import { FFL_TYPES, fflSim, crossAfter, edge, hillAct, hillRep, reg, logic, isCoherent, fflType } from './ch03.shared.js';

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
      statement: String.raw`Of the eight FFL types (3.1), two, the coherent C1 and the incoherent I1, are the commonest in the *E. coli* and yeast transcription networks, and the other six are much rarer. Mangan and Alon asked whether the rare types are rare because they are less useful, and found that some of them have **reduced functionality**: they respond to only one of their two inputs. To test this, treat the two regulatory inputs of $Z$ as two signals: $s_x$ (the activity of $X$) and $s_y$ (the activity of $Y$ relative to its expression, which itself depends on $s_x$). A type is functionally weak in this sense if $Z$ barely changes when one of the two signals is varied.`,
      idea: String.raw`For every type the steady-state output $Z(s_x,s_y)$ is computed from the Hill terms of 1.3 combined by the logic of 1.4, with $Y$ expressed as the Hill function of $s_x$ along the $X\to Y$ edge. The mean absolute slope of $Z$ in each direction measures how much each signal is heard. The step response of the selected type (bottom) shows what its dynamics add. The picture is a sensitivity screen in one model, with one threshold and one cooperativity; it cannot by itself prove why evolution favoured C1 and I1.`,
      caption: String.raw`Each tile is the steady-state output $Z$ (stronger colour is higher) over the two signals $s_x$ (horizontal) and $s_y$ (vertical), with the mean slopes $\langle|\partial Z/\partial s_x|\rangle$ and $\langle|\partial Z/\partial s_y|\rangle$ below it. Switch the logic between AND, OR and SUM and note how the pattern of tiles changes, then click a tile to see its time response (below). Look for types in which one slope is much smaller than the other.`,
      deps: ['sysbio-3.1'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'motifs'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985)',
      verify: true,
      scope: String.raw`This is my own sensitivity computation (Hill $n=2$, all thresholds $0.5$, $Y$ maximal expression 1), not a reproduction of the paper's analysis. From the paper I rely only on its abstract: some FFL types are much more frequent than others and the rare ones can have reduced functionality. Whether the weak inputs I find in the tiles correspond to the paper's explanation should be checked against the paper itself.`,
      viz(v) {
        const LG = v.select('logic at Z', ['AND', 'OR', 'SUM'], 'AND');
        const A = v.stage({ x: [0, 4], y: [0, 2.35], axes: false, height: 340, full: true, title: 'steady-state Z over the two signals: s_x (right) and s_y (up)' });
        const B = v.stage({ x: [0, 16], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'time (units of 1/α_Y)', ylabel: 'level (scaled)' });
        let sel = 0, txt = '';
        const NC = 11, K = 0.5, n = 2;
        const zOf = (t, lg, sx, sy) => { const ye = reg(t.s[0], sx, K, n); return logic(lg, reg(t.s[2], sx, K, n), reg(t.s[1], sy * ye, K, n)); };
        v.render(() => {
          const lg = LG.value, info = [];
          FFL_TYPES.forEach((t, k) => {
            const ox = k % 4, oy = k < 4 ? 1.2 : 0.0;
            for (let i = 0; i < NC; i++) for (let j = 0; j < NC; j++) {
              const z = zOf(t, lg, (i + 0.5) / NC, (j + 0.5) / NC);
              A.rect(ox + 0.1 + (0.8 * i) / NC, oy + 0.4 + (0.72 * j) / NC, ox + 0.1 + (0.8 * (i + 1)) / NC, oy + 0.4 + (0.72 * (j + 1)) / NC, { fill: css(v.ramp(z, 'accent')), stroke: false, fillAlpha: 1 });
            }
            A.rect(ox + 0.1, oy + 0.4, ox + 0.9, oy + 1.12, { color: k === sel ? 'accent' : 'faint', width: k === sel ? 3 : 1, fill: false });
            let ax = 0, ay = 0; const N = 24;
            for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
              const x = i / N, y = j / N;
              if (i < N) ax += Math.abs(zOf(t, lg, x + 1 / N, y) - zOf(t, lg, x, y));
              if (j < N) ay += Math.abs(zOf(t, lg, x, y + 1 / N) - zOf(t, lg, x, y));
            }
            ax /= N + 1; ay /= N + 1; info.push([t.id, ax, ay]);
            A.text(t.id, ox + 0.5, oy + 0.17, { size: 14, color: k === sel ? 'accent' : 'ink', align: 'center' });
            A.text(`∂x ${v.fix(ax, 2)}   ∂y ${v.fix(ay, 2)}`, ox + 0.5, oy + 0.3, { size: 10.5, color: 'muted', align: 'center' });
          });
          const t = FFL_TYPES[sel];
          const p = { sxy: t.s[0], syz: t.s[1], sxz: t.s[2], lg, Kxy: 0.5, Kyz: 0.5, Kxz: 0.5, n: 4, by: 1, ay: 1, bz: 6, az: 6 };
          traces(B, fflSim(p, (tt) => (tt >= 2 && tt < 9 ? 1 : 0), 16, 0.01));
          B.text(`${t.id}: X→Y ${sgn(t.s[0])}, Y→Z ${sgn(t.s[1])}, X→Z ${sgn(t.s[2])}, ${lg}`, 15.8, 1.08, { size: 12, color: 'ink', align: 'right' });
          const lop = info.map(([id, a, b]) => [id, Math.min(a, b) / Math.max(a, b, 1e-9)]).sort((u, w) => u[1] - w[1]);
          txt = `Most lopsided under ${lg}: ${lop.slice(0, 2).map((q) => `${q[0]} (weaker/stronger slope ${v.fix(q[1], 2)})`).join(', ')}; most balanced: ${lop[lop.length - 1][0]} (${v.fix(lop[lop.length - 1][1], 2)}).`;
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
      statement: String.raw`A **single-input module** (SIM) is a set of genes controlled by one transcription factor $X$ and by nothing else in the module. If gene $i$ has an activation threshold $K_i$ for $X$ and $K_1<K_2<\dots<K_m$, then when the level of $X$ rises slowly the genes switch on in the order $1,2,\dots,m$, and when it falls slowly they switch off in the reverse order $m,\dots,1$: a **last-in-first-out** (LIFO) program. If $X$ changes fast compared with the lifetime of the gene products, the thresholds no longer order the genes and they follow $X$ together.`,
      idea: String.raw`Each gene responds to $X$ through its own Hill input function (1.3), whose half-point is $K_i$. As $X(t)$ climbs, it crosses the thresholds one after another, lowest first; as it falls it crosses them again in the reverse sequence, so ordering in time is nothing but ordering by threshold. Placing the first enzyme of a pathway at the lowest threshold makes the pathway's enzymes appear in the order of the reaction chain, just in time; the order of shutdown, last-in-first-out, comes from the same monotone input signal. The product dynamics of 1.5 add a lag $\ln 2/\alpha_Z$ after each crossing, which blurs the order if $X$ moves too quickly.`,
      caption: String.raw`Top: the regulator $X(t)$, switched on at $t=1$ and off after the chosen duration, with the thresholds $K_1\dots K_4$ of the four genes. Bottom: the gene products (green), each with a dot where it crosses 0.5 on the way up and a red dot on the way down; the readout lists the order of switching on and off. Increase the speed $\alpha_X$ of the regulator until the order is lost, or reduce the spacing between thresholds.`,
      deps: ['sysbio-1.4'],
      refs: ['Alon: Temporal Programs and the Global Structure of Transcription Networks'],
      tags: ['single-input module', 'temporal programs'],
      credit: 'S. Shen-Orr, R. Milo, S. Mangan & U. Alon, 2002 (SIM motif; Nature Genetics 31: 64–68); A. Zaslaver et al., 2004 (activation order along amino-acid pathways; Nature Genetics 36: 486–491)',
      verify: true,
      scope: String.raw`The activation order along the pathway, with genes nearer the start of a pathway activated first, was measured in *E. coli* amino-acid biosynthesis (Zaslaver et al.); the reversed shut-down order is the model's prediction for an ideal SIM driven by a monotone signal, which I have not checked against data. Arginine genes are not named here; the four genes E1–E4 are a generic pathway. Real SIMs have gene-specific rates and leaks.`,
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
          const r = R.value, ax = AX.value, d = DUR.value, K = [0.12, 0, 0, 0].map((_, i) => 0.12 * Math.pow(r, i));
          const dt = 0.01, N = Math.round(T / dt);
          const t = [], X = [], Z = K.map(() => []);
          let x = 0; const z = K.map(() => 0);
          for (let i = 0; i <= N; i++) {
            const tt = i * dt; t.push(tt); X.push(x); K.forEach((k, j) => Z[j].push(z[j]));
            const inp = tt >= 1 && tt < 1 + d ? XM : 0;
            x += dt * ax * (inp - x);
            K.forEach((k, j) => { z[j] += dt * (hillAct(x, k, 4) - z[j]); });
          }
          S1.path(t.map((tt, i) => [tt, X[i]]), { color: 'accent', width: 3.5 });
          const cols = ['teal', 'blue', 'purple', 'pink'];
          K.forEach((k, j) => { S1.hline(k, { color: cols[j], dash: true, width: 1.5 }); S1.text(`K${j + 1}`, T - 0.2 - (j % 2) * 1.6, k, { color: cols[j], align: 'right', dy: -8, size: 11 }); });
          const on = [], off = [];
          K.forEach((k, j) => {
            const base = rowY[j];
            S2.path(t.map((tt, i) => [tt, base + 0.95 * Z[j][i]]), { color: cols[j], width: 3 });
            S2.hline(base + 0.475, { color: 'faint', dash: true, width: 0.7 });
            const a = crossAfter(t, Z[j], 0.5, 0), b = crossAfter(t, Z[j], 0.5, 1 + d);
            if (Number.isFinite(a)) { S2.dot(a, base + 0.475, { r: 5, color: 'green' }); }
            if (Number.isFinite(b)) { S2.dot(b, base + 0.475, { r: 5, color: 'red' }); }
            on.push([`E${j + 1}`, a]); off.push([`E${j + 1}`, b]);
          });
          const ord = (arr) => arr.filter((q) => Number.isFinite(q[1])).sort((u, w) => u[1] - w[1]).map((q) => q[0]).join(' → ') || '(none)';
          const o1 = ord(on), o2 = ord(off);
          const lifo = on.every((q) => Number.isFinite(q[1])) && off.every((q) => Number.isFinite(q[1])) && o2 === o1.split(' → ').reverse().join(' → ');
          txt = `Switch-on order: ${o1}. Switch-off order: ${o2}. ${lifo ? '**Last in, first out.**' : 'Not a strict LIFO order here (' + (on.some((q) => !Number.isFinite(q[1])) ? 'a gene never turns on' : 'the thresholds are crossed too fast for the products') + ').'}`;
        });
        v.legend([['accent', 'regulator X'], ['teal', 'E1 (first enzyme, lowest K)'], ['pink', 'E4 (last enzyme, highest K)'], ['green', 'switch on', { dot: true }], ['red', 'switch off', { dot: true }]]);
        v.readout(() => txt);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Multi-output FFL and first-in-first-out order',
      statement: String.raw`In a **multi-output FFL** the regulators $X$ and $Y$ ($X\to Y$) both regulate a set of target genes $Z_1,\dots,Z_m$. With OR-type input functions, $Z_i$ is on when $X>K_{x,i}$ or $Y>K_{y,i}$. Choose $K_{x,1}<\dots<K_{x,m}$, so that a rising $X$ switches the genes on in the order $1,\dots,m$, and $K_{y,1}>\dots>K_{y,m}$. When $X$ is withdrawn the slowly decaying $Y$ falls through its thresholds from the highest to the lowest, which switches the genes **off** in the order $1,\dots,m$ as well: a **first-in-first-out** (FIFO) program. With the opposite arrangement of the $Y$ thresholds the same loop gives LIFO.`,
      idea: String.raw`Switching on is controlled by the faster regulator $X$ and switching off by the slower regulator $Y$, whose decay is the production–degradation relaxation of 1.5. A gene stays on as long as at least one of its keys is on, so the shut-down time is set by the longest-lasting key, here $Y$ falling below $K_{y,i}$. Giving each gene its own threshold for each key lets the designer choose the on-order and the off-order independently, as the single-input module of 3.8 cannot. The coherent FFL with OR-like logic of 3.3 is the one-output ancestor of this scheme.`,
      caption: String.raw`Top: $X$ (grey), $Y$ (blue) with the thresholds $K_{x,i}$ (green, dashed) and $K_{y,i}$ (blue, dashed). Bottom: the three gene products with dots at their half-maximal ON (green) and OFF (red) times; the readout lists the orders. Choose the threshold design, then slow $Y$ down or speed it up: when $Y$ is faster than $X$ the on-order wins in both directions and the program turns LIFO.`,
      deps: ['sysbio-3.2', 'sysbio-3.8'],
      refs: ['Alon: Temporal Programs and the Global Structure of Transcription Networks'],
      tags: ['feed-forward loop', 'temporal programs'],
      credit: 'S. Kalir et al., 2001 (ordering of flagella genes by expression kinetics; Science 292: 2080–2083); S. Kalir, S. Mangan & U. Alon, 2005 (FFL with SUM input function prolongs flagella expression; Mol. Syst. Biol. 1: 2005.0006)',
      verify: true,
      scope: String.raw`An idealised model with OR logic, three target genes and made-up thresholds: it demonstrates how a multi-output FFL can produce a FIFO program, not the measured flagella circuit. In the real flagella system the master regulator is FlhDC and the sigma factor FliA is the intermediate, but the actual input functions are described in the papers as additive (SUM) rather than OR and I have not reproduced their numbers.`,
      viz(v) {
        const DES = v.select('Y thresholds', [{ value: 'fifo', label: 'reversed (FIFO design)' }, { value: 'lifo', label: 'same order (LIFO design)' }], 'fifo');
        const AY = v.slider(String.raw`speed of $Y$: $\alpha_Y/\alpha_X$`, 0.1, 5, 0.3, { log: true, sig: 2 });
        const DUR = v.slider('X on-time', 4, 10, 7, { step: 0.5 });
        const T = 20, AX = 1.5, AZ = 4;
        const S1 = v.stage({ x: [0, T], y: [0, 1.15], axes: 'box', gutter: true, height: 240, full: true, ylabel: 'regulators' });
        const S2 = v.stage({ x: [0, T], y: [-0.15, 3.75], axes: 'box', gutter: true, height: 320, full: true, xlabel: 'time (units of 1/α_X)', yticks: [[0.5, 'Z3'], [1.75, 'Z2'], [3.0, 'Z1']] });
        let txt = '';
        v.render(() => {
          const ay = AY.value, d = DUR.value;
          const Kx = [0.15, 0.4, 0.7], Ky = DES.value === 'fifo' ? [0.7, 0.4, 0.15] : [0.15, 0.4, 0.7];
          const dt = 0.01, N = Math.round(T / dt), t = [], X = [], Y = [], Z = [[], [], []];
          let x = 0, y = 0; const z = [0, 0, 0];
          for (let i = 0; i <= N; i++) {
            const tt = i * dt; t.push(tt); X.push(x); Y.push(y); z.forEach((q, j) => Z[j].push(q));
            const inp = tt >= 1 && tt < 1 + d ? 1 : 0;
            const nx = x + dt * AX * (inp - x), ny = y + dt * ay * AX * (hillAct(x, 0.6, 4) - y);
            z.forEach((q, j) => { const fx = hillAct(x, Kx[j], 6), fy = hillAct(y, Ky[j], 6); z[j] += dt * AZ * (fx + fy - fx * fy - q); });
            x = nx; y = ny;
          }
          S1.path(t.map((tt, i) => [tt, X[i]]), { color: 'muted', width: 2.5, dash: true });
          S1.path(t.map((tt, i) => [tt, Y[i]]), { color: 'blue', width: 3.5 });
          Kx.forEach((k, j) => { S1.hline(k, { color: 'green', dash: true, width: 1 }); S1.text(`Kx${j + 1}`, 0.2, k, { color: 'green', size: 10.5, dy: -7, align: 'left' }); });
          Ky.forEach((k, j) => { S1.hline(k, { color: 'blue', dash: [2, 4], width: 1.2 }); S1.text(`Ky${j + 1}`, T - 0.2, k, { color: 'blue', size: 10.5, dy: 7, align: 'right' }); });
          const base = [3.0, 1.75, 0.5].map((b) => b - 0.5), on = [], off = [];
          const cols = ['teal', 'purple', 'pink'];
          Z.forEach((zz, j) => {
            S2.path(t.map((tt, i) => [tt, base[j] + 0.95 * zz[i]]), { color: cols[j], width: 3 });
            S2.hline(base[j] + 0.475, { color: 'faint', dash: true, width: 0.7 });
            const a = crossAfter(t, zz, 0.5, 0), b = crossAfter(t, zz, 0.5, 1 + d);
            if (Number.isFinite(a)) S2.dot(a, base[j] + 0.475, { r: 5, color: 'green' });
            if (Number.isFinite(b)) S2.dot(b, base[j] + 0.475, { r: 5, color: 'red' });
            on.push([`Z${j + 1}`, a]); off.push([`Z${j + 1}`, b]);
          });
          const ord = (arr) => arr.filter((q) => Number.isFinite(q[1])).sort((u, w) => u[1] - w[1]).map((q) => q[0]).join(' → ') || '(none)';
          const o1 = ord(on), o2 = ord(off), full = on.concat(off).every((q) => Number.isFinite(q[1]));
          const kind = !full ? 'incomplete' : o1 === o2 ? '**first in, first out**' : o2 === o1.split(' → ').reverse().join(' → ') ? '**last in, first out**' : 'mixed';
          txt = `Switch-on order: ${o1}. Switch-off order: ${o2}. This program is ${kind}.\nTimes (ON / OFF): ${on.map((q, j) => `${q[0]} ${v.fix(q[1], 1)} / ${v.fix(off[j][1], 1)}`).join('; ')}.`;
        });
        v.legend([['muted', 'X', { dash: true }], ['blue', 'Y'], ['teal', 'Z1'], ['purple', 'Z2'], ['pink', 'Z3'], ['green', 'switch on', { dot: true }], ['red', 'switch off', { dot: true }]]);
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
