// Materials Science — Chapter 4: Mechanical properties and strengthening (part a: items 4.1–4.4)
import { TENSILE_PRESETS, epsOfSigma, sigmaOfEps, considereSigma, pullBar, peakStep, barProfile, sig } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Cache of simulated bars keyed by the material and the imperfection. */
const barCache = new Map();
function getBar(m, imp, epsF) {
  const key = [m.E, m.s0, m.n, imp, epsF].join('|');
  if (!barCache.has(key)) { if (barCache.size > 24) barCache.clear(); barCache.set(key, pullBar(m, { imp, epsF })); }
  return barCache.get(key);
}

export default {
  collection: 'mat',
  chapter: 4,
  title: 'Mechanical properties and strengthening',
  summary: String.raw`The tensile test reads stiffness, yield strength, hardening, ultimate strength and ductility from one curve. Because yielding is dislocation motion, every strengthening mechanism impedes dislocations: grain boundaries (Hall–Petch), solute atoms, precipitates and other dislocations. Annealing reverses work hardening through recovery, recrystallization and grain growth.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Engineering and true stress–strain curves',
      statement: String.raw`A tensile test pulls a bar and records the force $F$ and the elongation $\Delta L$. The **engineering** quantities divide by the starting geometry, $s=F/A_0$ and $e=\Delta L/L_0$. The **true** quantities divide by the geometry at that moment: $\sigma=F/A$ and $\varepsilon=\ln(L/L_0)=\ln(1+e)$. While the deformation is uniform and the volume is conserved ($AL=A_0L_0$), the two are related by $$\sigma=s\,(1+e),\qquad \varepsilon=\ln(1+e).$$ The engineering curve rises to a maximum (the tensile strength) and then falls as the bar **necks**; the true curve keeps rising to fracture, because the metal in the neck keeps hardening while its cross-section shrinks. The conversion formulas stop being valid at the neck, where the strain is no longer uniform along the gauge length.`,
      idea: String.raw`Both curves come from one experiment; only the bookkeeping differs. The force is $F=\sigma A=\sigma A_0e^{-\varepsilon}$, so the force is the product of a rising factor, the hardening $\sigma(\varepsilon)$, and a falling one, the thinning $e^{-\varepsilon}$. The engineering curve is $F$ up to a constant and turns over when thinning wins (the Considère condition, 4.4). After that the deformation concentrates in the weakest slice. Here a bar of 41 slices with a 1 % variation in area is pulled with equal force in every slice, and the neck appears on its own at the weakest place: the engineering curve is the average over the whole gauge, while the local true stress and strain belong to the neck.`,
      caption: String.raw`Drag *pull* to stretch the bar to fracture (the colour is local true strain). Left curve: engineering stress against strain (blue), the true curve you would get by applying $\sigma=s(1+e)$ and $\varepsilon=\ln(1+e)$ blindly (orange dashed), and the true stress and strain actually measured in the neck (green). They agree up to the maximum of the engineering curve and part ways after it. Pick a material or change $n$ (hardening), $\sigma_{0.2}$ and the size of the imperfection.`,
      deps: ['mat-1.2', 'pma-8.6'],
      refs: ['Callister §6.3', 'Callister §6.7'],
      tags: ['tensile test', 'stress–strain', 'necking'],
      scope: String.raw`Valid for a ductile metal pulled slowly at constant temperature, with a round bar and a power-law (Hollomon-type) true curve, $\varepsilon=\sigma/E+0.002\,(\sigma/\sigma_{0.2})^{1/n}$. The preset parameter sets are rounded orders of magnitude, not measured data. The neck is a one-dimensional equal-force model (no triaxial stress in the neck, no void growth, fracture imposed at a chosen neck strain); after the force maximum the other slices unload elastically, and the neck is one slice (1/41 of the gauge) wide, sharper than a real neck, which is about a diameter long.`,
      viz(v) {
        let preset = TENSILE_PRESETS[0];
        const pick = v.select('material', TENSILE_PRESETS.map((p) => ({ value: p.id, label: p.label })), 'steel', {
          onChange: (id) => { const p = TENSILE_PRESETS.find((q) => q.id === id); nS.set(p.n); sS.set(p.s0); Es = p.E; },
        });
        let Es = preset.E;
        const nS = v.slider('hardening exponent $n$', 0.05, 0.6, preset.n, { step: 0.01 });
        const sS = v.slider('yield strength $\\sigma_{0.2}$ (MPa)', 50, 800, preset.s0, { step: 5 });
        const impS = v.slider('imperfection (% area)', 0.1, 5, 1, { log: true, decimals: 2 });
        const ff = v.slider('strain at fracture in the neck', 0.4, 1.6, 1.0, { step: 0.05 });
        const pull = v.slider('pull', 0, 1, 0.7, { step: 0.002, decimals: 3 });
        const A = v.stage({ x: [-0.08, 1.9], y: [-0.2, 0.2], equal: true, axes: false, height: 170, full: true, title: 'the bar (colour: local true strain)' });
        const B = v.stage({ x: [0, 0.5], y: [0, 900], axes: 'box', gutter: true, height: 340, xlabel: 'strain', ylabel: 'stress (MPa)', title: 'two ways to plot one test' });
        let cur = null;
        v.render(() => {
          const m = { E: Es, s0: sS.value, n: nS.value };
          const bar = getBar(m, impS.value / 100, ff.value);
          const kPk = peakStep(bar), K = bar.steps.length - 1;
          const k = Math.round(pull.value * K), st = bar.steps[k];
          const emax = bar.steps[K].e, smax = Math.max(...bar.steps.map((p) => p.sw));
          B.setView([0, emax * 1.04], [0, smax * 1.08]);
          // curves
          const eng = bar.steps.map((p) => [p.e, p.s]);
          const conv = bar.steps.map((p) => [p.e, p.s * (1 + p.e)]);
          const loc = bar.steps.map((p) => [Math.exp(p.ew) - 1, p.sw]);
          B.path(eng, { color: 'faint', width: 1.5 }); B.path(conv, { color: 'faint', width: 1.2, dash: true }); B.path(loc, { color: 'faint', width: 1.2 });
          B.path(eng.slice(0, k + 1), { color: 'accent', width: 2.6 });
          B.path(conv.slice(0, k + 1), { color: 'orange', width: 2, dash: true });
          B.path(loc.slice(0, k + 1), { color: 'green', width: 2.4 });
          const pk = bar.steps[kPk];
          B.dot(pk.e, pk.s, { r: 5, color: 'red', fill: 'red', label: 'tensile strength', labelPos: 'n' });
          B.dot(st.e, st.s, { r: 6, color: 'accent', fill: 'accent' });
          B.dot(Math.exp(st.ew) - 1, st.sw, { r: 6, color: 'green', fill: 'green' });
          B.dot(st.e, st.s * (1 + st.e), { r: 5, color: 'orange', fill: 'orange', hollow: true });
          // bar
          const pf = barProfile(bar, st), N = bar.N, sc = 0.045;
          let x = 0;
          const eMaxEps = Math.max(...st.eps, 0.05);
          for (let i = 0; i < N; i++) {
            const l = Math.exp(st.eps[i]) / N, w = pf.ws[i] * sc, w2 = pf.ws[Math.min(N - 1, i + 1)] * sc;
            const t = clamp(st.eps[i] / Math.max(0.35, eMaxEps), 0, 1), c = v.ramp(t, 'red', 'accent');
            A.poly([[x, -w], [x + l, -w2], [x + l, w2], [x, w]], { fill: c, fillAlpha: 0.9, color: c, width: 0.5 });
            x += l;
          }
          A.rect(-0.08, -0.12, 0, 0.12, { fill: 'muted', fillAlpha: 0.5, color: 'muted' }); A.rect(x, -0.12, x + 0.08, 0.12, { fill: 'muted', fillAlpha: 0.5, color: 'muted' });
          A.arrow(x + 0.08, 0, x + 0.3, 0, { color: 'muted', head: 8 });
          A.text('F', x + 0.34, 0, { color: 'muted', size: 12, align: 'left' });
          const neckW = Math.min(...pf.ws) / Math.max(...pf.ws);
          cur = { st, pk, bar, neckW, m, emax };
        });
        v.legend([['accent', 'engineering $s(e)$'], ['orange', 'true, from the formulas', { dash: true }], ['green', 'true, measured in the neck'], ['red', 'maximum force', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { st, pk, bar, neckW } = cur;
          const post = st.e > pk.e + 1e-4;
          return `Engineering: $s=${sig(st.s)}$ MPa at $e=${v.fix(st.e, 3)}$.  Formulas: $s(1+e)=${sig(st.s * (1 + st.e))}$ MPa, $\\ln(1+e)=${v.fix(Math.log(1 + st.e), 3)}$.  Neck: $\\sigma=${sig(st.sw)}$ MPa, $\\varepsilon=${v.fix(st.ew, 3)}$.\nTensile strength $${sig(pk.s)}$ MPa at $e_u=${v.fix(pk.e, 3)}$ (true strain $${v.fix(Math.log(1 + pk.e), 3)}$; the Considère strain of this material is $${v.fix(bar.eu, 3)}$). ${post ? `The bar has necked: the narrowest section is ${v.fix(neckW * 100, 0)} % of the widest in diameter, and the formulas understate the true stress there by ${v.fix((1 - (st.s * (1 + st.e)) / st.sw) * 100, 0)} %.` : 'The bar is still uniform: the formulas give the true stress exactly.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Law',
      name: 'Hooke’s law and Poisson’s ratio',
      statement: String.raw`For small strains an isotropic solid responds linearly: a uniaxial stress $\sigma$ produces the axial strain $\varepsilon=\sigma/E$ (Hooke's law, with Young's modulus $E$) and a lateral strain of opposite sign, $$\varepsilon_{\rm lat}=-\nu\,\varepsilon,$$ where $\nu$ is **Poisson's ratio**. Stability of an isotropic elastic solid requires $-1<\nu<\tfrac12$. Most metals have $\nu\approx0.3$, rubber is nearly incompressible ($\nu\to\tfrac12$, volume change $\Delta V/V=(1-2\nu)\varepsilon\to0$), cork is close to $0$, and **auxetic** materials with $\nu<0$ get fatter when stretched.`,
      idea: String.raw`The linear law is the generalized Hooke's law of solid mechanics (solid-2.7) specialised to one loaded direction; the sign of $\nu$ is a geometric statement about how the microstructure rearranges when the axial dimension changes. In a metal, atoms are pushed together sideways as the bonds along the load are stretched; in a re-entrant honeycomb the stretched ribs hinge outward and the cell opens in both directions. For the honeycomb below, the ribs are treated as rigid with free hinges (the bending-dominated limit), so the cell width $2l\cos\theta$ fixes the angle $\theta$ and with it the height $2(h+l\sin\theta)$: Poisson's ratio is read from the geometry and equals $\cos^2\theta/\big[(h/l+\sin\theta)\sin\theta\big]$ for small strains.`,
      caption: String.raw`Stretch the block with the strain slider: the dashed outline is the unloaded shape, and the lateral strain is $-\nu$ times the axial one (set $\nu$ by hand or pick a material). Right: a honeycomb of rigid ribs that rotate at hinges. With ribs leaning outward (positive $\theta$, a conventional hexagon) it narrows when stretched; flip $\theta$ negative (re-entrant) and it widens: its Poisson's ratio, measured from the picture, turns negative.`,
      deps: ['mat-1.2', 'solid-2.7'],
      refs: ['Roylance, Constitutive Relations, pp1–5 Eqs3–4,8–9'],
      tags: ['elasticity', 'Poisson ratio', 'auxetic'],
      credit: 'R. Hooke, 1678 (ut tensio sic vis); S. D. Poisson, 1820s (lateral contraction); R. S. Lakes, 1987 (first auxetic foam); L. J. Gibson & M. F. Ashby, 1982 (honeycomb mechanics)',
      scope: String.raw`Linear, isotropic, small strain. The menu uses illustrative isotropic parameters associated with broad material classes; the $\nu$ values are orders of magnitude (rubber $\approx0.49$ rather than exactly $0.5$). The honeycomb is the rigid-rib, free-hinge mechanism: it is exact kinematics but ignores rib bending and stretching, so it shows how the sign of $\nu$ arises rather than a real modulus.`,
      viz(v) {
        const MAT = { metal: { nu: 0.3, E: 200, lab: 'metal' }, rubber: { nu: 0.49, E: 0.01, lab: 'rubber' }, cork: { nu: 0.02, E: 0.03, lab: 'cork' }, foam: { nu: -0.7, E: 0.02, lab: 'auxetic foam' } };
        const mat = v.select('block', [{ value: 'metal', label: 'metal' }, { value: 'rubber', label: 'rubber' }, { value: 'cork', label: 'cork' }, { value: 'foam', label: 'auxetic foam' }, { value: 'free', label: 'free $\\nu$' }], 'metal', { onChange: (id) => { if (MAT[id]) nuS.set(MAT[id].nu); } });
        const nuS = v.slider('Poisson ratio $\\nu$', -0.95, 0.495, 0.3, { step: 0.005, decimals: 3 });
        const epsS = v.slider('axial strain $\\varepsilon$', -0.1, 0.25, 0.08, { step: 0.005 });
        const th = v.slider('honeycomb rib angle $\\theta_0$ (°)', -60, 60, -30, { step: 1 });
        const hl = v.slider('rib ratio $h/l$', 0.8, 2.5, 2, { step: 0.05 });
        const A = v.stage({ x: [-1.9, 2.9], y: [-1.6, 1.6], equal: true, axes: false, height: 330, weight: 1, title: 'a block, stretched' });
        const B = v.stage({ x: [-3.2, 5.4], y: [-3.6, 3.6], equal: true, axes: false, height: 330, weight: 1.1, title: 'a honeycomb of rigid ribs and hinges' });
        let info = null;
        // honeycomb of rigid ribs: inclined ribs of length 1 at angle t to the horizontal, vertical ribs of length h
        const cellXY = (t, h) => ({ X: 2 * Math.cos(t), Y: 2 * (h + Math.sin(t)) });
        function drawHoney(S, t, h, col, alpha, w) {
          const c = Math.cos(t), sn = Math.sin(t), rowH = h + sn;
          for (let j = -3; j <= 3; j++) for (let m = -3; m <= 3; m++) {
            const cx = 2 * c * m + (j & 1 ? c : 0), cy = j * rowH;
            const P = [[cx - c, cy + h / 2], [cx, cy + h / 2 + sn], [cx + c, cy + h / 2], [cx + c, cy - h / 2], [cx, cy - h / 2 - sn], [cx - c, cy - h / 2]];
            S.path(P, { close: true, color: col, alpha, width: w });
          }
        }
        v.render(() => {
          const nu = nuS.value, e = epsS.value;
          // continuum block
          const lx = 1 + e, ly = 1 - nu * e;
          const bw = 1.4, bh = 0.8;
          A.rect(-bw, -bh, bw, bh, { color: 'muted', dash: true, fill: false });
          const xs = [], ys = [];
          for (let i = -4; i <= 4; i++) A.line(i * bw / 4 * lx, -bh * ly, i * bw / 4 * lx, bh * ly, { color: 'accent', alpha: 0.5, width: 1 });
          for (let j = -3; j <= 3; j++) A.line(-bw * lx, j * bh / 3 * ly, bw * lx, j * bh / 3 * ly, { color: 'accent', alpha: 0.5, width: 1 });
          A.rect(-bw * lx, -bh * ly, bw * lx, bh * ly, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.1 });
          A.arrow(bw * lx + 0.05, 0, bw * lx + 0.55, 0, { color: 'red', head: 9, width: 2.5 }); A.arrow(-bw * lx - 0.05, 0, -bw * lx - 0.55, 0, { color: 'red', head: 9, width: 2.5 });
          A.text('$\\sigma$', bw * lx + 0.7, 0.18, { color: 'red', size: 15 });
          const dV = lx * ly * ly - 1;
          // honeycomb
          const t0 = (th.value * Math.PI) / 180, h = hl.value;
          const c0 = Math.cos(t0), eH = e;
          const arg = clamp((1 + eH) * c0, -1, 1);
          const tn = Math.sign(t0 || 1) * Math.acos(arg);
          drawHoney(B, t0, h, 'muted', 0.35, 1.2);
          drawHoney(B, tn, h, 'accent', 0.95, 2.2);
          const X0 = cellXY(t0, h), X1 = cellXY(tn, h), X2 = cellXY(Math.sign(t0 || 1) * Math.acos(clamp(1.0001 * c0, -1, 1)), h);
          const exH = X1.X / X0.X - 1, eyH = X1.Y / X0.Y - 1;
          const nuH = Math.abs(X2.X / X0.X - 1) > 1e-9 ? -(X2.Y / X0.Y - 1) / (X2.X / X0.X - 1) : NaN;
          const nuTh = Math.abs(Math.sin(t0)) < 1e-10 ? NaN : Math.cos(t0) ** 2 / ((h + Math.sin(t0)) * Math.sin(t0));
          info = { nu, e, dV, nuH, nuTh, exH, eyH, valid: Math.abs(arg) < 1 };
        });
        v.readout(() => {
          if (!info) return '';
          const { nu, e, dV, nuH, nuTh, valid } = info;
          return `Block: axial $\\varepsilon=${v.fix(e, 3)}$, lateral $\\varepsilon_{\\rm lat}=${v.fix(-nu * e, 4)}=-\\nu\\varepsilon$ with $\\nu=${v.fix(nu, 3)}$; exact volume change $${v.fix(dV * 100, 2)}\\,\\%$ (small-strain $(1-2\\nu)\\varepsilon=${v.fix((1 - 2 * nu) * e * 100, 2)}\\,\\%$). With $E=${MAT[mat.value] ? MAT[mat.value].E : 'free'}$ GPa, $\\sigma=E\\varepsilon$.\nHoneycomb: width strain $${v.fix(info.exH, 3)}$, height strain $${v.fix(info.eyH, 3)}$, measured at small strain $\\nu=${Number.isFinite(nuH) ? v.fix(nuH, 2) : '–'}$ (the shape change shown is large, so $-\\varepsilon_y/\\varepsilon_x$ here is $${v.fix(-info.eyH / (info.exH || 1e-9), 2)}$); the small-strain formula $\\cos^2\\theta/[(h/l+\\sin\\theta)\\sin\\theta]=${Number.isFinite(nuTh) ? v.fix(nuTh, 2) : '\\text{undefined at the straight configuration}'}$${valid ? '' : '. At this strain the ribs are fully straightened: the mechanism locks.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Yield strength and the 0.2 % offset',
      statement: String.raw`Plastic flow begins gradually, so "the stress at which a metal yields" needs a convention. The **offset yield strength** $\sigma_y$ (usually $0.2\,\%$, written $\sigma_{0.2}$ or $R_{p0.2}$) is the stress at which the stress–strain curve meets a straight line drawn parallel to the elastic part, starting at the strain $\varepsilon_{\rm off}=0.002$ on the axis: equivalently, the stress at which unloading elastically would leave a permanent strain of $0.2\,\%$. Some steels have a sharp **yield point** (an upper yield stress, a drop, then a plateau of Lüders-band flow); there the lower yield stress is quoted and the offset line gives a nearby value.`,
      idea: String.raw`The elastic line has slope $E$ (4.2, 1.2). Unloading from any point of the plastic curve runs parallel to it, so the line through $(\varepsilon_{\rm off},0)$ with slope $E$ marks the states that would unload to a permanent strain of exactly $\varepsilon_{\rm off}$. The convention replaces an unmeasurable "first plastic atom" by a strain that a mechanical extensometer resolves. Because the curve is steep and the offset small, $\sigma_y$ depends weakly on the offset when the metal hardens slowly and strongly when it hardens fast; the picture lets you see the difference.`,
      caption: String.raw`Slide the offset: the parallel line through $(\varepsilon_{\rm off},0)$ cuts the curve at the offset yield strength. Switch between a smooth curve and a steel with a yield point (the yield drop and plateau); raise the hardening exponent to see how much more $\sigma_y$ moves when you change the offset. The grey tick marks the proportional limit, where the curve first leaves the elastic line by $1\,\%$.`,
      deps: ['mat-4.1'],
      refs: ['Callister §6.6'],
      tags: ['yield strength', 'tensile test'],
      scope: String.raw`The smooth curve is a Ramberg–Osgood-type model $\varepsilon=\sigma/E+0.002(\sigma/\sigma_{0.2})^{1/n}$ (parameters illustrative); the yield-point steel adds an upper yield stress $15\,\%$ above $\sigma_{0.2}$, a drop to the lower yield stress and a plateau of $1.8\,\%$ strain, all schematic.`,
      viz(v) {
        const kind = v.select('curve', [{ value: 'smooth', label: 'smooth (no yield point)' }, { value: 'point', label: 'with a yield point' }], 'smooth');
        const off = v.slider('offset $\\varepsilon_{\\rm off}$ (%)', 0, 0.8, 0.2, { step: 0.01, decimals: 2 });
        const nS = v.slider('hardening exponent $n$', 0.05, 0.5, 0.15, { step: 0.01 });
        const E = 200, s0 = 300; // GPa, MPa
        const S = v.stage({ x: [0, 0.01], y: [0, 450], axes: 'box', gutter: true, height: 400, xlabel: 'strain (%)', ylabel: 'stress (MPa)', xticks: [0, 0.002, 0.004, 0.006, 0.008, 0.01].map((x) => [x, String(x * 100)]), title: 'the curve and the offset line' });
        // curves as parametric polylines (strain as function of stress is explicit, stress as function of strain is not)
        function curve(kindV, n) {
          const m = { E, s0, n };
          const pts = [];
          if (kindV === 'smooth') { for (let k = 0; k <= 400; k++) { const s = 450 * (k / 400); pts.push([epsOfSigma(m, s), s]); } return pts; }
          // yield point: elastic up to upper yield, drop, plateau, then hardening ~ same curve shifted
          const up = 1.12 * s0, lo = 0.97 * s0, epsUp = up / (E * 1000), pl = 0.018;
          for (let k = 0; k <= 60; k++) pts.push([epsUp * (k / 60), up * (k / 60)]);
          pts.push([epsUp + 0.0004, lo]);
          for (let k = 1; k <= 20; k++) pts.push([epsUp + 0.0004 + pl * (k / 20), lo + 4 * Math.sin(k * 2.1)]);
          const e0 = epsUp + 0.0004 + pl;
          for (let k = 1; k <= 80; k++) { const s = lo + (450 - lo) * (k / 80); pts.push([e0 + epsOfSigma(m, s) - epsOfSigma(m, lo), s]); }
          return pts;
        }
        // proportional limit (1 % deviation) and offset intersection from the polyline
        const crossing = (pts, eo) => {
          let best = null;
          for (let i = 1; i < pts.length; i++) {
            const f0 = pts[i - 1][1] - E * 1000 * (pts[i - 1][0] - eo), f1 = pts[i][1] - E * 1000 * (pts[i][0] - eo);
            if (f0 >= 0 && f1 < 0) { const t = f0 / (f0 - f1); best = [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])]; break; }
          }
          return best;
        };
        let info = null;
        v.render(() => {
          const pts = curve(kind.value, nS.value);
          const eo = off.value / 100;
          S.setView([0, 0.0105], [0, 450]);
          S.path(pts, { color: 'ink', width: 2.6 });
          const e100 = 450 / (E * 1000);
          S.line(0, 0, e100, 450, { color: 'faint', width: 1.2, dash: true });
          S.line(eo, 0, eo + 450 / (E * 1000), 450, { color: 'orange', width: 2, dash: true });
          const X = crossing(pts, eo);
          let pl = null;
          for (const p of pts) if (p[1] > 5 && p[0] > p[1] / (E * 1000) * 1.01) { pl = p; break; }
          if (pl) { S.dot(pl[0], pl[1], { r: 4, color: 'muted', fill: 'muted', label: 'proportional limit', labelPos: 'se' }); }
          if (X) {
            S.hline(X[1], { color: 'green', alpha: 0.5 }); S.vline(X[0], { color: 'green', alpha: 0.35, dash: true });
            S.dot(X[0], X[1], { r: 7, color: 'green', fill: 'green' });
            S.dot(eo, 0, { r: 5, color: 'orange', fill: 'orange' });
          }
          // sensitivity: yield at 0.1 % and 0.4 %
          const y1 = crossing(pts, 0.001), y4 = crossing(pts, 0.004);
          info = { X, eo, pl, y1, y4, pts };
        });
        v.legend([['ink', 'tensile curve'], ['orange', 'offset line, slope $E$', { dash: true }], ['green', 'offset yield strength'], ['faint', 'elastic line', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { X, eo, pl, y1, y4 } = info;
          return `Offset ${v.fix(eo * 100, 2)} %: $\\sigma_y=${X ? v.fix(X[1], 0) : '–'}$ MPa at total strain ${X ? v.fix(X[0] * 100, 3) : '–'} %.  For comparison the 0.1 % offset gives ${y1 ? v.fix(y1[1], 0) : '–'} MPa and the 0.4 % offset gives ${y4 ? v.fix(y4[1], 0) : '–'} MPa: a factor of 4 in offset moves $\\sigma_y$ by ${y1 && y4 ? v.fix((y4[1] / y1[1] - 1) * 100, 0) : '–'} %.\n${pl ? `The curve leaves the elastic line by 1 % at ${v.fix(pl[1], 0)} MPa (${v.fix((pl[1] / (X ? X[1] : 1)) * 100, 0)} % of $\\sigma_y$).` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Considère criterion for necking',
      statement: String.raw`Pull a ductile bar at constant volume and let $\sigma(\varepsilon)$ be its true stress–strain curve (uniform deformation). The force is $F=\sigma A_0e^{-\varepsilon}$, and it has a maximum exactly where $$\frac{d\sigma}{d\varepsilon}=\sigma.$$ A uniform bar is stable while $d\sigma/d\varepsilon>\sigma$ (hardening beats thinning): a slightly thinner section strains a little more and is then strengthened enough to catch up. Once $d\sigma/d\varepsilon<\sigma$ the thinner section is also the one that carries less force, it keeps straining and deformation localizes into a neck. For a power law $\sigma=K\varepsilon^n$ this happens at the true strain $\varepsilon_u=n$.`,
      idea: String.raw`Differentiate $F=\sigma(\varepsilon)A_0e^{-\varepsilon}$: $dF/d\varepsilon=A_0e^{-\varepsilon}\,(d\sigma/d\varepsilon-\sigma)$, so the force maximum, the end of stable uniform flow and the crossing of the curve of $d\sigma/d\varepsilon$ with $\sigma$ are one and the same. The stability argument: give two sections the same force but a 1 % difference in area; on the rising branch of $F(\varepsilon)$ they settle with a small strain difference, but beyond the maximum no equal-force state exists with both sections hardening: the weak one runs away. The right-hand picture computes that strain difference directly, using the same force balance as the tensile bar of 4.1.`,
      caption: String.raw`Drag the gold handle along the true curve (left): at each strain the slope $d\sigma/d\varepsilon$ is drawn as a segment and compared with $\sigma$. Right: the strain difference $\Delta\varepsilon$ between a slice 1 % thinner and a normal one, carrying the same force, against the strain of the normal slice: small and calm until the Considère strain, then no balanced state exists and the thin spot necks (slightly before $\varepsilon_u$, by an amount that shrinks with the flaw). Choose the hardening law: with Hollomon's $\varepsilon_u=n$, with saturating (Voce) hardening the necking strain depends on the saturation stress, and a non-hardening metal necks at once.`,
      deps: ['mat-4.1', 'opt-1.4'],
      refs: ['Callister §6.7'],
      tags: ['necking', 'plastic instability', 'tensile test'],
      credit: 'A. Considère, 1885',
      scope: String.raw`Uniform, rate-independent deformation of an incompressible bar in simple tension, with a true curve that does not depend on the strain history. Strain-rate sensitivity (which delays necking in superplastic materials), temperature rise and triaxial stress in the developed neck are not included.`,
      viz(v) {
        const law = v.select('hardening law', [{ value: 'hol', label: 'Hollomon $K\\varepsilon^n$' }, { value: 'voce', label: 'saturating (Voce)' }, { value: 'none', label: 'no hardening' }], 'hol');
        const nS = v.slider('exponent $n$', 0.05, 0.7, 0.25, { step: 0.01 });
        const flaw = v.slider('area difference of the weak slice (%)', 0.2, 5, 1, { log: true, decimals: 2 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'true strain $\\varepsilon$', ylabel: 'stress (MPa)', title: '$\\sigma$ and its slope' });
        const B = v.stage({ x: [0, 1], y: [0, 0.5], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'true strain of the normal slice', ylabel: 'strain difference $\\Delta\\varepsilon$', title: 'does a thin spot catch up?' });
        const h = A.handle(0.2, 0.5, { color: 'gold', r: 8, constrain: 'x' });
        const sigma = (e) => {
          if (law.value === 'hol') return 800 * Math.pow(Math.max(e, 1e-9), nS.value);
          if (law.value === 'voce') return 700 - (700 - 250) * Math.exp(-e / (nS.value * 0.9));
          return 250 + 1e-9 * e;
        };
        const dsig = (e) => { const d = 1e-5; return (sigma(e + d) - sigma(Math.max(e - d, 0))) / (e < d ? e + d : 2 * d); };
        let info = null;
        v.render(() => {
          const e1 = 1.0;
          const e = clamp(h.x, 0.01, 0.99);
          // find Considère strain
          let eu = null, prev = dsig(0.005) - sigma(0.005);
          for (let k = 1; k < 1000; k++) { const x = 0.005 + (e1 * k) / 1000; const g = dsig(x) - sigma(x); if (prev > 0 && g <= 0 && eu === null) eu = x - (e1 / 1000) * (1 - prev / (prev - g)); prev = g; }
          if (eu === null) { const g0 = dsig(0.005) - sigma(0.005); eu = g0 <= 0 ? 0 : null; }
          const smax = Math.max(...[...Array(100)].map((_, k) => sigma(0.01 + k * 0.0099)));
          A.setView([0, 1], [0, smax * 1.1]);
          A.fn(sigma, { domain: [0.003, 1], color: 'accent', width: 2.6 });
          A.fn(dsig, { domain: [0.003, 1], color: 'orange', width: 2.2 });
          h.set(e, sigma(e));
          const sg = sigma(e), dd = dsig(e);
          A.line(e - 0.12, sg - 0.12 * dd, e + 0.12, sg + 0.12 * dd, { color: dd > sg ? 'green' : 'red', width: 3 });
          A.dot(e, dd, { r: 5, color: 'orange', fill: 'orange' });
          if (eu !== null) { A.vline(eu, { color: 'red', dash: true, alpha: 0.8 }); A.text('Considère', eu + 0.01, smax * 1.02, { color: 'red', size: 12, align: 'left' }); }
          // strain difference of thin slice: equal force: sigma(e_w) e^{-e_w} (1-f)... weak slice carries force with area A_w = 1-f? use area ratio 1/(1+f): thin slice
          const f = flaw.value / 100, Fof = (x) => sigma(x) * Math.exp(-x);
          const pts = [];
          for (let k = 1; k <= 200; k++) {
            const es = (0.99 * k) / 200, F = Fof(es); // normal slice of area 1; thin slice of area 1-f carries the same force: F_thin(ew) (1-f) = F
            // find ew >= es on the rising... smallest root of Fof(ew)(1-f) = F with ew >= es
            const target = F / (1 - f);
            let lo = es, hi = es, ok = false;
            // scan upward until Fof exceeds target? the thin slice needs Fof(ew) = target; Fof increasing near es
            let prevv = Fof(es) - target, x = es;
            const stepx = 0.0008;
            for (let j = 0; j < 1200 && x < 1.5; j++) { x += stepx; const cur = Fof(x) - target; if (prevv < 0 && cur >= 0) { lo = x - stepx; hi = x; ok = true; break; } prevv = cur; if (Fof(x) < Fof(x - stepx) && cur < 0) break; }
            if (!ok) { pts.push(null); continue; }
            for (let it = 0; it < 40; it++) { const md = (lo + hi) / 2; if (Fof(md) - target < 0) lo = md; else hi = md; }
            pts.push([es, (lo + hi) / 2 - es]);
          }
          const dif = [];
          let seg = [];
          for (const p of pts) { if (p) seg.push(p); else { if (seg.length) dif.push(seg); seg = []; } }
          if (seg.length) dif.push(seg);
          const dmax = Math.max(0.02, ...dif.flat().map((p) => p[1]));
          B.setView([0, 1], [0, dmax * 1.25]);
          for (const sgm of dif) B.path(sgm, { color: 'green', width: 2.6 });
          const lastOk = dif.length ? dif[dif.length - 1][dif[dif.length - 1].length - 1][0] : 0;
          if (eu !== null) { B.vline(eu, { color: 'red', dash: true, alpha: 0.8 }); }
          const below = pts.filter(Boolean).length;
          if (lastOk < 0.985) { B.rect(lastOk, 0, 1, dmax * 1.25, { fill: 'red', fillAlpha: 0.1, stroke: false }); B.text('the thin spot necks', lastOk + 0.03, dmax * 0.6, { color: 'red', size: 12, align: 'left', plate: true }); }
          const ppt = dif.flat().find((p) => p[0] >= e - 0.003);
          if (ppt) B.dot(ppt[0], ppt[1], { r: 5, color: 'gold', fill: 'gold' });
          info = { e, sg, dd, eu, lastOk };
        });
        v.legend([['accent', 'true stress $\\sigma$'], ['orange', '$d\\sigma/d\\varepsilon$'], ['red', 'Considère strain', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { e, sg, dd, eu, lastOk } = info;
          return `At $\\varepsilon=${v.fix(e, 3)}$: $\\sigma=${v.fix(sg, 0)}$ MPa, $d\\sigma/d\\varepsilon=${v.fix(dd, 0)}$ MPa, so $d\\sigma/d\\varepsilon ${dd > sg ? '>' : '<'} \\sigma$: ${dd > sg ? 'stable, hardening wins' : 'unstable, thinning wins'}.\n${eu === 0 ? 'The slope is below the stress everywhere: the bar necks as soon as it yields.' : eu ? `Crossing at $\\varepsilon_u=${v.fix(eu, 3)}$${law.value === 'hol' ? ` (Hollomon: $n=${v.fix(nS.value, 2)}$)` : ''}; the thin-slice calculation stops having a solution at $\\varepsilon\\approx${v.fix(lastOk, 3)}$.` : 'No crossing in range: the metal hardens fast enough never to neck before $\\varepsilon=1$.'}${law.value === 'none' ? ' A non-hardening metal has $d\\sigma/d\\varepsilon=0<\\sigma$ from the start and necks immediately.' : ''}`;
        });
      },
    },
  ],
};
