// Computational Neuroscience — Chapter 4 (part b): 4.5 Rall's 3/2 power rule, 4.6 compartmental models, 4.7 conduction velocity ∝ √diameter
//
// Source review and independent circuit/velocity checks: docs/verification/neuro-source-review.md.
import { HH, buildTree, treeSteady, treeSim, thomas, unmyelinatedSpeed, syntheticNeuron, lambdaUm, gInf } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const RM = 20000, RA = 100;

export default {
  collection: 'neuro',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Rall’s 3/2 power rule and the equivalent cylinder',
      statement: String.raw`Consider a passive dendritic tree of uniform $R_m,R_a$ whose branches are cylinders. At a branch point a parent of diameter $d_0$ divides into daughters of diameters $d_1,d_2,\dots$. If
$$d_0^{3/2}=\sum_i d_i^{3/2}$$
at every branch point, and all terminal branches end in the same way (all sealed, say) at the same electrical distance $\ell=\sum x/\lambda$ from the root, then the whole tree behaves, as seen from its root, exactly like a single cylinder of diameter $d_0$ and electrical length $\ell$ ("the equivalent cylinder"): the same input conductance and, for steady or transient current injected at the root, the same voltage at every electrical distance from the root. The reason is that the input conductance of a semi-infinite cylinder, $G_\infty=1/(r_a\lambda)=\tfrac\pi2 d^{3/2}/\sqrt{R_mR_a}$, scales as $d^{3/2}$.`,
      idea: String.raw`Seen from the end of the parent, the daughters are parallel loads. Because $G_\infty\propto d^{3/2}$ (neuro-4.3: $R_{\rm in}=r_a\lambda\propto d^{-3/2}$), daughters that satisfy the rule together present exactly the conductance $G_\infty(d_0)$ that a continuation of the parent would, and being of equal electrical length they also carry the same voltage profile in electrical units. Hence the parent can be extended by the daughters' common electrical length without changing the problem. Rall (1959) pointed out that for many motoneurons the rule holds approximately and used it to reduce trees to a single cable for analysis.`,
      caption: String.raw`A parent branch (diameter $d_0$) splits into two daughters of diameters $d_1,d_2$ (sliders), whose lengths are set so that both have the same electrical length. A steady current is injected at the base; the tree is drawn to scale and coloured by the computed voltage. Right: voltage against electrical distance from the base along daughter 1 (blue) and daughter 2 (orange), against the single cylinder of diameter $d_0$ and the same total electrical length (black, dashed). When $\Sigma d_i^{3/2}=d_0^{3/2}$ the three curves lie on top of one another; make the daughters thinner or thicker and the tree separates from the cylinder. “Rule” sets $d_2$ so that the rule holds for the current $d_1$.`,
      scope: String.raw`Passive tree, same $R_m,R_a$ throughout, daughters of equal electrical length ending alike. Real dendrites obey the rule only approximately, and only the input conductance — not the voltage at an arbitrary site — is preserved if the branches have unequal electrical lengths.`,
      deps: ['neuro-4.3'],
      see: ['neuro-4.6', 'neuro-4.9'],
      refs: ['Dayan–Abbott ch. 6'],
      tags: ['cable theory', 'dendritic trees'],
      credit: 'Wilfrid Rall, 1959 (Exp. Neurol. 1: 491–527); equivalent cylinder in Rall, 1962 and 1964',
      viz(v) {
        const d0 = v.slider('parent $d_0$', 1, 5, 3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} µm` });
        const rule = Math.pow(2, -2 / 3);
        const d1 = v.slider('daughter 1, $d_1$', 0.4, 5, 3 * rule, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} µm` });
        const d2 = v.slider('daughter 2, $d_2$', 0.4, 5, 3 * rule, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} µm` });
        const lp = v.slider('parent length $\\ell_p$', 0.1, 1, 0.3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} λ` });
        const ld = v.slider('daughters $\\ell_d$', 0.1, 1.2, 0.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} λ` });
        v.button('rule: set $d_2$', () => { const t = Math.pow(d0.value, 1.5) - Math.pow(d1.value, 1.5); if (t > 0) d2.set(clamp(Math.pow(t, 2 / 3), 0.4, 5)); });
        v.button('equal daughters', () => { const q = d0.value * rule; d1.set(q); d2.set(q); });
        const sT = v.stage({ x: [-80, 900], y: [-300, 300], equal: true, axes: false, height: 300, weight: 1.15, title: 'tree drawn to scale, coloured by steady voltage' });
        const sV = v.stage({ x: [0, 1.5], y: [0, 1], axes: 'box', gutter: true, xlabel: 'electrical distance from the base  $\\sum x/\\lambda$', ylabel: 'voltage (mV for 0.1 nA)', height: 300, weight: 1 });
        let st = null;
        const lam = (d) => lambdaUm(d, RM, RA);
        const solveTree = (dp, da, db, lP, lD) => {
          const L0 = lP * lam(dp), La = lD * lam(da), Lb = lD * lam(db);
          const dx = Math.min(lam(dp), lam(da), lam(db)) / 40;
          const tr = buildTree([{ parent: -1, len: L0, dia: dp }, { parent: 0, len: La, dia: da }, { parent: 0, len: Lb, dia: db }], { dxMax: dx, Ra: RA });
          const I = new Float64Array(tr.n); I[0] = 0.1;
          return { tr, V: treeSteady(tr, I, 1000 / RM), L0, La, Lb };
        };
        v.render(() => {
          const dp = d0.value, da = d1.value, db = d2.value, lP = lp.value, lD = ld.value;
          const T = solveTree(dp, da, db, lP, lD), tr = T.tr, V = T.V;
          // equivalent cylinder
          const Lc = (lP + lD) * lam(dp), cyl = buildTree([{ parent: -1, len: Lc, dia: dp }], { dxMax: Math.min(lam(dp), lam(da), lam(db)) / 40, Ra: RA });
          const Ic = new Float64Array(cyl.n); Ic[0] = 0.1;
          const Vc = treeSteady(cyl, Ic, 1000 / RM);
          // electrical coordinates along both paths
          const path = (k) => {
            const pts = [];
            for (let i = tr.first[0]; i <= tr.last[0]; i++) pts.push([tr.pos[i] / lam(dp), V[i]]);
            for (let i = tr.first[k]; i <= tr.last[k]; i++) pts.push([lP + tr.pos[i] / lam(k === 1 ? da : db), V[i]]);
            return pts;
          };
          const p1 = path(1), p2 = path(2), pc = Array.from(Vc, (y, i) => [(cyl.pos[i]) / lam(dp), y]);
          const vmax = Math.max(...Vc, ...V) * 1.05;
          sV.setView([0, lP + lD], [0, vmax]);
          sV.path(pc, { color: 'ink', width: 2.6, dash: [7, 5] });
          sV.path(p1, { color: 'accent', width: 2.2 });
          sV.path(p2, { color: 'orange', width: 2.2 });
          sV.vline(lP, { color: 'muted', dash: [2, 4] });
          // tree drawing
          const a1 = 0.45, a2 = -0.45, ends = [[T.L0, 0]];
          const col = (x) => v.ramp(clamp(x / (V[0] * 1.0001), 0, 1), 'red');
          const wpx = (d) => 1.2 + 2.6 * d;
          for (let i = tr.first[0]; i <= tr.last[0]; i++) { const m = tr.last[0] - tr.first[0] + 1, j = i - tr.first[0]; sT.line((j / m) * T.L0, 0, ((j + 1) / m) * T.L0, 0, { color: col(V[i]), width: wpx(dp) }); }
          const br = (k, ang, len) => {
            const m = tr.last[k] - tr.first[k] + 1;
            for (let j = 0; j < m; j++) { const i = tr.first[k] + j, f0 = j / m, f1 = (j + 1) / m; sT.line(T.L0 + f0 * len * Math.cos(ang), f0 * len * Math.sin(ang), T.L0 + f1 * len * Math.cos(ang), f1 * len * Math.sin(ang), { color: col(V[i]), width: wpx(k === 1 ? da : db) }); }
          };
          br(1, a1, T.La); br(2, a2, T.Lb);
          const xm = T.L0 + Math.max(T.La, T.Lb) * Math.cos(a1), ym = Math.max(T.La, T.Lb) * Math.sin(a1);
          sT.setView([-0.08 * xm, xm * 1.05], [-ym * 1.1, ym * 1.1]);
          sT.dot(0, 0, { r: 5, color: 'red', label: 'I', labelPos: 'nw' });
          const rho = (Math.pow(da, 1.5) + Math.pow(db, 1.5)) / Math.pow(dp, 1.5);
          let dev = 0; for (const p of [...p1, ...p2]) { let j = 0, best = 1e9; for (let q = 0; q < pc.length; q++) { const e = Math.abs(pc[q][0] - p[0]); if (e < best) { best = e; j = q; } } dev = Math.max(dev, Math.abs(p[1] - pc[j][1])); }
          // closed form for the input conductance (µS)
          const Gp = gInf(dp, RM, RA), Gd = (d) => gInf(d, RM, RA) * Math.tanh(lD), GL = Gd(da) + Gd(db), t = Math.tanh(lP);
          const Gin = Gp * (GL + Gp * t) / (Gp + GL * t), Gcyl = Gp * Math.tanh(lP + lD);
          st = { rho, Rt: V[0] / 0.1, Rc: Vc[0] / 0.1, dev: dev / Vc[0], Rth: 1 / Gin, Rcth: 1 / Gcyl };
        });
        v.legend([['accent', 'path through daughter 1'], ['orange', 'path through daughter 2'], ['ink', 'equivalent cylinder', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ok = Math.abs(st.rho - 1) < 0.02;
          return String.raw`$\sum d_i^{3/2}/d_0^{3/2}=${v.fix(st.rho, 3)}$ — ${ok ? '**rule satisfied**' : st.rho > 1 ? 'daughters too thick (tree has more conductance than the cylinder)' : 'daughters too thin (tree has less conductance)'}` + '\n' +
            String.raw`input resistance: tree $${v.fix(st.Rt, 1)}$ MΩ (closed form $${v.fix(st.Rth, 1)}$), equivalent cylinder $${v.fix(st.Rc, 1)}$ MΩ (closed form $${v.fix(st.Rcth, 1)}$) · largest voltage difference along either path: $${v.fix(100 * st.dev, 2)}\%$ of $V(0)$`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'Compartmental models',
      statement: String.raw`A compartmental model replaces a neuron of any shape by a finite number of small isopotential compartments $i=1,\dots,n$, each a membrane patch (capacitance $C_i$, leak $g_i$, possibly voltage-gated and synaptic conductances) coupled to its neighbours by axial conductances $g_{ij}=1/(R_i/2+R_j/2)$, where $R_i=4R_a\ell_i/(\pi d_i^2)$ is the axial resistance of a cylindrical piece of length $\ell_i$ and diameter $d_i$:
$$C_i\dot V_i=-g_i(V_i-E_i)-I^{\rm chan}_i(V_i,t)+\sum_{j\sim i}g_{ij}\,(V_j-V_i)+I^{\rm inj}_i(t).$$
For a tree the coupling matrix is tree-structured, so an implicit time step costs only $O(n)$ operations (Hines elimination). As the compartments shrink the solution converges to that of the cable equation on the branched structure (neuro-4.1).`,
      idea: String.raw`The cable equation is a partial differential equation on a graph; discretising space gives the circuit of neuro-4.1 on each branch, and at branch points the compartment joins its parent and its daughters. Each cylinder is an equivalent-circuit piece, so Kirchhoff's current law at every node gives the ODE above; the resulting linear system has a sparse structure that follows the tree, which is why realistic reconstructions with thousands of compartments simulate quickly. This circuit construction is the basis of modern compartmental simulators such as NEURON, GENESIS and Arbor.`,
      caption: String.raw`A synthetic branching neuron (soma plus four dendritic trees, daughter diameters obeying the 3/2 rule of neuro-4.5; it is generated by a rule, not reconstructed from a real cell). Click anywhere on a dendrite to place a 3 ms current pulse (red ring); the colours show the spreading voltage, scaled to the current maximum so that attenuated signals remain visible (or, optionally, as the square root of V/10 mV). The current is scaled so that the peak at the injection site is 10 mV. Bottom left: the voltage at the injection site (red) and the soma (blue, multiplied so that its peak also reaches 10). Bottom right: the somatic peak as the compartments are made shorter; it converges.`,
      scope: String.raw`Passive membrane ($R_m=20\,\mathrm{k\Omega\,cm^2}$, $R_a=100\,\Omega$ cm, $C_m=1\,\mu$F/cm²) on a synthetic tree; the voltage-gated channels that real compartmental models add are used in items 4.7–4.10.`,
      deps: ['neuro-4.1', 'nla-4.1', 'circ-2.8'],
      see: ['neuro-4.5', 'neuro-4.9', 'neuro-4.10'],
      refs: ['Gerstner §3.4, compartment circuit and Fig. 3.8', 'Zador–Pearlmutter, TR-OGI-CSE-93-003 §§2–3'],
      tags: ['compartmental model', 'morphology'],
      credit: 'Compartmental circuit formulation; Hines tree elimination, verified through Zador–Pearlmutter technical report TR-OGI-CSE-93-003, §§2–3',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multi-compartment_model' },
      viz(v) {
        const segs = syntheticNeuron(7, { nPrim: 4, depth: 3, d0: 3.2 });
        const dxs = v.slider('compartment length', 5, 200, 25, { log: true, fmt: (x) => `${v.fmt(x, 2)} µm` });
        const amp = v.select('colour scale', [{ value: 'norm', label: 'relative to the frame maximum' }, { value: 'sqrt', label: 'square root of V/10 mV' }], 'norm');
        const ext = segs.reduce((a, q) => [Math.min(a[0], q.x0, q.x1), Math.max(a[1], q.x0, q.x1), Math.min(a[2], q.y0, q.y1), Math.max(a[3], q.y0, q.y1)], [0, 0, 0, 0]);
        const sM = v.stage({ x: [ext[0] - 30, ext[1] + 30], y: [ext[2] - 30, ext[3] + 30], equal: true, axes: false, height: 380, full: true, title: 'click a dendrite to inject current' });
        const sV = v.stage({ x: [0, 40], y: [0, 10.5], axes: 'box', gutter: true, xlabel: 'time (ms)', ylabel: 'V (mV)', height: 200, weight: 1, minWidth: 280 });
        const sC = v.stage({ x: [1, 3000], y: [0, 1], xlog: true, axes: 'box', gutter: true, xlabel: 'number of compartments', ylabel: 'soma peak (mV)', height: 200, weight: 0.9, minWidth: 260 });
        // geometry of the compartments (positions along each segment's straight line)
        const geo = {};
        const build = (dx) => {
          const key = dx.toFixed(2); if (geo[key]) return geo[key];
          const tr = buildTree(segs.map((s) => ({ parent: s.parent, len: s.len, dia: s.dia, soma: s.soma })), { dxMax: dx, Ra: RA });
          const xy = [];
          for (let i = 0; i < tr.n; i++) {
            const s = segs[tr.seg[i]], m = tr.last[tr.seg[i]] - tr.first[tr.seg[i]] + 1, j = i - tr.first[tr.seg[i]];
            if (s.soma) xy.push({ x0: 0, y0: 0, x1: 0, y1: 0 });
            else xy.push({ x0: s.x0 + ((s.x1 - s.x0) * j) / m, y0: s.y0 + ((s.y1 - s.y0) * j) / m, x1: s.x0 + ((s.x1 - s.x0) * (j + 1)) / m, y1: s.y0 + ((s.y1 - s.y0) * (j + 1)) / m });
          }
          return (geo[key] = { tr, xy });
        };
        // initial injection: the compartment of the farthest tip
        let siteXY = null;
        {
          const { tr, xy } = build(25); let far = 0;
          for (let i = 0; i < tr.n; i++) { const r = Math.hypot(xy[i].x1, xy[i].y1); if (r > far) { far = r; siteXY = [(xy[i].x0 + xy[i].x1) / 2, (xy[i].y0 + xy[i].y1) / 2]; } }
        }
        const sims = {};
        const run = (dx, node) => {
          const key = dx.toFixed(2) + '|' + node; if (sims[key]) return sims[key];
          const { tr } = build(dx);
          const r = treeSim(tr, { dt: 0.05, tEnd: 40, cm: 1, gL: 1000 / RM, EL: -65, V0: -65, stim: (t, I) => { if (t > 1 && t <= 4) I[node] = 0.01; }, rec: [node, 0], frames: 8 });
          const pk = Math.max(...r.V[0].map((x) => x + 65)), k = 10 / pk;
          const fr = r.frames.map((f) => Float32Array.from(f, (x) => (x + 65) * k));
          return (sims[key] = { r, k, fr, ft: r.ft, tr, soma: r.V[1].map((x) => (x + 65) * k), loc: r.V[0].map((x) => (x + 65) * k), t: r.t });
        };
        const conv = {};
        const convergence = (node, xyOf) => {
          const key = String(xyOf); if (conv[key]) return conv[key];
          const out = [];
          for (const dx of [200, 100, 50, 25, 12.5, 6.25]) {
            // find the compartment of the same segment/position at this resolution (nearest to the clicked point)
            const { tr, xy } = build(dx); let b = 0, best = 1e18;
            for (let i = 0; i < tr.n; i++) { const e = (xy[i].x1 + xy[i].x0) / 2 - xyOf[0], f = (xy[i].y1 + xy[i].y0) / 2 - xyOf[1]; if (e * e + f * f < best) { best = e * e + f * f; b = i; } }
            const s = run(dx, b); out.push([tr.n, Math.max(...s.soma)]);
          }
          return (conv[key] = out);
        };
        sM.onClick((x, y) => {
          const { tr, xy } = build(dxs.value); let b = 0, best = 1e18;
          for (let i = 1; i < tr.n; i++) { const e = (xy[i].x1 + xy[i].x0) / 2 - x, f = (xy[i].y1 + xy[i].y0) / 2 - y; if (e * e + f * f < best) { best = e * e + f * f; b = i; } }
          siteXY = [(xy[b].x0 + xy[b].x1) / 2, (xy[b].y0 + xy[b].y1) / 2]; v.invalidate();
        });
        let st = null;
        v.animate((t) => {
          const dx = dxs.value, { tr, xy } = build(dx);
          // locate the injection compartment at the current resolution
          let b = 0, best = 1e18;
          for (let i = 1; i < tr.n; i++) { const e = (xy[i].x1 + xy[i].x0) / 2 - siteXY[0], f = (xy[i].y1 + xy[i].y0) / 2 - siteXY[1]; if (e * e + f * f < best) { best = e * e + f * f; b = i; } }
          const S = run(dx, b), tt = (t / 8) * 40, fi = clamp(Math.round(tt / (S.ft[1] - S.ft[0])), 0, S.fr.length - 1), F = S.fr[fi];
          let fm = 1e-9; for (let i = 0; i < tr.n; i++) fm = Math.max(fm, F[i]);
          const lev = (x) => (amp.value === 'sqrt' ? Math.sqrt(clamp(x / 10, 0, 1)) : clamp(x / fm, 0, 1));
          for (let i = 0; i < tr.n; i++) {
            if (segs[tr.seg[i]].soma) continue;
            sM.line(xy[i].x0, xy[i].y0, xy[i].x1, xy[i].y1, { color: v.ramp(lev(F[i]), 'orange'), width: 1.2 + 1.5 * tr.dia[i] });
          }
          sM.circle(0, 0, 14, { fill: v.ramp(lev(F[0]), 'orange'), fillAlpha: 1, color: 'ink' });
          sM.dot(siteXY[0], siteXY[1], { r: 6, color: 'red', hollow: true });
          sM.text('soma', 20, -22, { size: 11, color: 'muted', align: 'left' });
          sV.path(S.t.map((x, i) => [x, S.loc[i]]), { color: 'red', width: 2 });
          const ks = 10 / Math.max(1e-9, Math.max(...S.soma));
          sV.path(S.t.map((x, i) => [x, S.soma[i] * ks]), { color: 'accent', width: 2.2 });
          sV.corner(`soma trace multiplied by ${v.fmt(ks, 3)}`, 'tr', { color: 'accent' });
          sV.vline(S.ft[fi], { color: 'faint', width: 1.2 });
          const cv = convergence(b, siteXY);
          sC.path(cv, { color: 'muted', width: 1.4 }); sC.dots(cv, { r: 4, color: 'accent' });
          sC.dot(tr.n, Math.max(...S.soma), { r: 7, color: 'gold' });
          const top = Math.max(...cv.map((p) => p[1]));
          sC.setView([1, 3000], [0, Math.max(0.1, top * 1.25)]);
          st = { n: tr.n, pk: Math.max(...S.soma), cv, dist: Math.hypot(siteXY[0], siteXY[1]) };
        }, { period: 8, still: 0.9 });
        v.legend([['red', 'injection site'], ['accent', 'soma']]);
        v.readout(() => {
          if (!st) return '';
          const last = st.cv[st.cv.length - 1][1];
          return String.raw`$n=${st.n}$ compartments · injection site about $${v.fmt(st.dist, 3)}$ µm from the soma: 10 mV local peak becomes $${v.fix(st.pk, 2)}$ mV at the soma (finest grid, $n=${st.cv[st.cv.length - 1][0]}$: $${v.fix(last, 2)}$ mV)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Conduction velocity grows as √diameter in unmyelinated axons',
      statement: String.raw`In an unmyelinated axon with fixed membrane properties (the same channel densities and kinetics) and fixed cytoplasmic resistivity, the speed $\theta$ of the propagating action potential grows in proportion to the square root of the axon diameter, $\theta\propto\sqrt d$. Dimensional reasoning gives the same scale: the cable equation for the impulse, $C_m\partial_tV=\frac{d}{4R_a}\partial_x^2V-I_{\rm ion}(V,\dots)$, is unchanged under $x\to x\sqrt d$, so the waveform keeps its shape in time and stretches in space as $\sqrt d$; a wave that crosses a length $\propto\sqrt d$ in a fixed time has speed $\propto\sqrt d$. Doubling the speed in this family needs four times the diameter (and sixteen times the volume per unit length). For the squid giant axon (diameter about 0.5 mm) the model gives speeds of the order of 20 m/s at 18.5 °C.`,
      idea: String.raw`The axial current that the active region sends ahead of itself is proportional to $d/R_a$ times a voltage gradient, while the charge needed to depolarise a piece of membrane is proportional to $d\,C_m$ times the voltage: the diameter cancels in the ratio except through the second derivative, so the equation is invariant under the stretch above and $\theta\propto\sqrt{d/(R_aC_m)}\times$ (a number set by channel kinetics). This scaling illustrates the geometric cost of increasing speed by diameter alone; myelin provides another mechanism (neuro-4.8).`,
      caption: String.raw`Left: a simulated action potential travelling along a 3 cm axon (Hodgkin–Huxley channels as in ch. 2; Ra = 35.4 Ω·cm, diameter $d$ from the slider; the animation is slowed down to a fixed duration whatever the speed). Right: the speed measured between 1.0 and 2.4 cm for seven diameters, on logarithmic axes, with the best $\sqrt d$ line and a slope-1 comparison line for the ideal myelinated scaling (item 4.8). The gold dot is the current diameter. The speed is the time of the 0 mV crossing at two points, not an assumed formula.`,
      scope: String.raw`Unmyelinated axon with uniform squid-type Hodgkin–Huxley channels (Na, K, leak) at 6.3 or 18.5 °C, uniform diameter, sealed ends, a single propagating impulse. Real axons differ in channel densities and kinetics; the $\sqrt d$ law then holds only if these are the same at all diameters. Absolute speeds depend steeply on temperature (the rate constants scale by a factor 3 per 10 °C).`,
      deps: ['neuro-4.2', 'neuro-2.3', 'vcalc-2.6'],
      see: ['neuro-4.8', 'neuro-2.7'],
      refs: ['Gerstner §3.3'],
      tags: ['axon', 'conduction velocity'],
      credit: 'Hodgkin & Huxley, 1952; A. L. Hodgkin, “A note on conduction velocity”, J. Physiol. 125 (1954): 221–224',
      viz(v) {
        const dsl = v.slider('diameter $d$', 10, 1000, 476, { log: true, fmt: (x) => `${v.fmt(x, 3)} µm` });
        const Tsel = v.select('temperature', [{ value: 6.3, label: '6.3 °C' }, { value: 18.5, label: '18.5 °C' }], 18.5);
        const sA = v.stage({ x: [0, 3], y: [-85, 60], axes: 'box', gutter: true, xlabel: 'position $x$ (cm)', ylabel: '$V$ (mV)', height: 300, weight: 1.2 });
        const sB = v.stage({ x: [8, 1250], y: [0.8, 60], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'diameter $d$ (µm)', ylabel: 'speed $\\theta$ (m/s)', height: 300, weight: 1 });
        const sweep = {}, movies = {};
        const DS = [10, 20, 40, 80, 160, 320, 640];
        const getSweep = (T) => sweep[T] || (sweep[T] = DS.map((d) => [d, unmyelinatedSpeed(d, { T }).speed]));
        const getMovie = (d, T) => {
          const key = `${T}|${d.toFixed(1)}`; if (movies[key]) return movies[key];
          const r0 = unmyelinatedSpeed(d, { T }), tTot = r0.t2 != null ? (3 / 2.4) * r0.t2 + 0.3 : 20;
          const stepsPer = Math.max(1, Math.round(tTot / 0.02 / 90)), r = unmyelinatedSpeed(d, { T, frames: stepsPer, tEnd: tTot });
          return (movies[key] = { speed: r0.speed, frames: r.sim.frames, ft: r.sim.ft, dx: r.dx });
        };
        let st = null;
        v.animate((t) => {
          const T = +Tsel.value, d = dsl.value, M = getMovie(d, T), S = getSweep(T);
          const fi = clamp(Math.round((t / 6) * (M.frames.length - 1)), 0, M.frames.length - 1), F = M.frames[fi];
          sA.path(Array.from(F, (V, i) => [(i * M.dx) / 1e4, V]), { color: 'accent', width: 2.4 });
          sA.vline(1, { color: 'faint', dash: true }); sA.vline(2.4, { color: 'faint', dash: true });
          sA.text(`t = ${v.fix(M.ft[fi], 2)} ms`, 0.1, 50, { size: 12, color: 'muted', align: 'left' });
          // best sqrt law and slope-1 line anchored at the geometric mean
          const lx = S.map((p) => Math.log(p[0])), ly = S.map((p) => Math.log(p[1])), n = S.length;
          const mx = lx.reduce((a, b) => a + b, 0) / n, my = ly.reduce((a, b) => a + b, 0) / n;
          let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (lx[i] - mx) * (ly[i] - my); sxx += (lx[i] - mx) ** 2; }
          const slope = sxy / sxx, c = Math.exp(my - 0.5 * mx);
          sB.fn((x) => c * Math.sqrt(x), { color: 'green', width: 1.8, domain: [8, 1250] });
          sB.fn((x) => Math.exp(my) * (x / Math.exp(mx)), { color: 'faint', width: 1.4, dash: [5, 4], domain: [8, 1250] });
          sB.dots(S, { r: 5, color: 'accent' });
          sB.dot(d, M.speed, { r: 8, color: 'gold' });
          sB.vline(476, { color: 'muted', dash: [2, 4] });
          sB.text('squid giant axon ≈ 0.5 mm', 440, 1.1, { size: 10.5, color: 'muted', align: 'right' });
          st = { speed: M.speed, d, slope, c, pred: c * Math.sqrt(d) };
        }, { period: 6, still: 3 });
        v.legend([['accent', 'simulated speed', { dot: true }], ['green', 'best $\\theta=c\\sqrt d$ fit'], ['faint', 'slope 1 comparison', { dash: true }], ['gold', 'current $d$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$d=${v.fmt(st.d, 3)}$ µm: simulated speed $\theta=${v.fix(st.speed, 2)}$ m/s, $c\sqrt d=${v.fix(st.pred, 2)}$ m/s ($c=${v.fix(st.c, 3)}$ m/s per √µm)` + '\n' +
            String.raw`log–log slope of the seven simulated speeds against diameter: $${v.fix(st.slope, 3)}$ (prediction $0.5$) · quadrupling $d$ doubles $\theta$: $\theta(4d)/\theta(d)\approx${v.fix(Math.pow(4, st.slope), 2)}$`;
        });
      },
    },
  ],
};
