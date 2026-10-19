// Energy Systems — Chapter 4: Solar energy, items 4.9–4.11 (shading and bypass diodes, the étendue limit, the 1954 silicon cell paper)
// Reviewed 2026-10-18: source passages, corrections, test commands and remaining
// tandem-literature blocker are recorded in docs/verification/energy-ch04.md.
// All cell, atmospheric-notch, cloud and reverse-bias parameters are illustrative.

import { clamp, S0, SIGMA, R_SUN, AU, cell, ivCurve } from './ch04.shared.js';

// ───────────────────────────────────────────── 4.9: module model
const IPH1 = 9.7, I0C = 2.4e-10, AV = 0.02569, RREV = 1.5, VD = 0.6, ROWS = 10, COLS = 6;
const cellV = (I, g) => { const ip = IPH1 * g; return I < ip ? AV * Math.log((ip - I) / I0C + 1) : -RREV * (I - ip); };
/** Module I–V as a list of {I, V}; shade = array of ROWS*COLS irradiance factors; cell index = row*COLS + col; substring s = columns 2s, 2s+1. */
function moduleIV(shade, bypass) {
  const out = [];
  const Is = []; for (let i = 0; i <= 500; i++) Is.push(IPH1 * (1 - (1 - i / 500) ** 4)); for (let I = IPH1 + 0.04; I <= 11; I += 0.04) Is.push(I);
  for (const I of Is) {
    let V = 0; const subs = [];
    for (let s = 0; s < 3; s++) {
      let vs = 0;
      for (let r = 0; r < ROWS; r++) for (let c = 2 * s; c < 2 * s + 2; c++) vs += cellV(I, shade[r * COLS + c]);
      const byp = bypass && vs < -VD; if (byp) vs = -VD; subs.push(byp); V += vs;
    }
    out.push({ I, V, P: I * V, subs });
  }
  return out;
}
const peaks = (pts) => {
  const res = []; for (let i = 1; i < pts.length - 1; i++) if (pts[i].P > 0.5 && pts[i].P >= pts[i - 1].P && pts[i].P > pts[i + 1].P) res.push(pts[i]);
  return res;
};

export default {
  collection: 'energy',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Partial shading and bypass diodes',
      statement: String.raw`In a series string of cells the same current flows through every cell. If one cell is shaded its photocurrent $I_{ph}$ drops, and the string can carry more than that current only by driving the shaded cell into **reverse bias**, where it dissipates power instead of producing it. The optimal current depends on the whole string and its reverse-bias losses: the output of a series string is not the sum of what each cell could make alone. A **bypass diode** across a substring conducts when the substring's voltage would go negative, so the current skips the shaded section at the cost of that section's voltage. With bypass diodes the module's power–voltage curve can acquire several local maxima associated with different bypass states; not every state creates a distinct maximum.

Scope: series-connected cells with uniform temperature; the maximum power point tracker must find the best of several local maxima (energy-4.7 may settle on a lesser one).`,
      idea: String.raw`Series connection forces equal currents, which is Kirchhoff's current law, while voltages add (circ-3.1). A cell's I–V curve (energy-4.3) runs from its own short-circuit current, so at a current above a shaded cell's $I_{ph}$ the cell sits at a negative voltage, subtracting from the string's voltage and turning its share of the string current into heat — which is the origin of hot spots. In this example the bypass diode caps the whole substring voltage near $-0.6$ V (not the reverse voltage of each individual cell), so the substring is replaced by almost a wire. The module can then either run at the high current of the sunny substrings with the shaded one skipped, or at the low current of the shaded cell with everything contributing; these are the two peaks of the power curve (energy-4.4).`,
      caption: String.raw`An illustrative 60-cell module in three substrings of 20 cells (columns in pairs). **Click cells** to shade or unshade them, or use the presets. The right panel is the module's power against voltage: the green curve has bypass diodes, the red dashed one does not. The gold dot marks the highest sampled power; small dots mark other local maxima. Shade a whole **row** and every substring loses a cell, so bypass diodes cannot help; shade part of one substring (the column-pair preset) and the diode saves most of the power, whereas a single mildly shaded cell is simply carried along in reverse bias. A substring skipped by its diode is outlined in red.`,
      deps: ['energy-4.4'],
      refs: ['PVEducation, Bypass Diodes, reverse-bias operation; 60-cell layout and reverse resistance are illustrative'],
      tags: ['photovoltaics', 'shading', 'series circuits'],
      scope: String.raw`Illustrative single-diode cells (9.7 A, 0.63 V) with an ohmic reverse characteristic; temperature effects of hot spots are not modelled.`,
      viz(v) {
        const level = v.slider('light on a shaded cell (fraction of full)', 0.02, 0.8, 0.15, { step: 0.01 });
        const byp = v.toggle('bypass diodes shown as the main curve', true);
        const shaded = new Array(ROWS * COLS).fill(false);
        const set = (fn) => { for (let i = 0; i < shaded.length; i++) shaded[i] = fn(Math.floor(i / COLS), i % COLS); };
        set((r, c) => c < 2 && r > 2);
        v.button('one cell', () => set((r, c) => r === 4 && c === 1));
        v.button('bottom row', () => set((r) => r === ROWS - 1));
        v.button('a column pair', () => set((r, c) => c < 2 && r > 2));
        v.button('clear', () => set(() => false));
        const M = v.stage({ x: [0, COLS + 0.6], y: [-0.9, ROWS + 0.2], equal: true, axes: false, height: 400, weight: 0.8, minWidth: 250, title: 'module (click a cell to shade it)' });
        const P = v.stage({ x: [0, 40], y: [0, 300], axes: 'box', gutter: true, height: 400, weight: 1.25, minWidth: 290, xlabel: 'module voltage (V)', ylabel: 'module power (W)', title: 'power against voltage' });
        M.onClick((x, y) => { const c = Math.floor(x - 0.3), r = ROWS - 1 - Math.floor(y); if (c >= 0 && c < COLS && r >= 0 && r < ROWS) shaded[r * COLS + c] = !shaded[r * COLS + c]; v.invalidate(); });
        let st = null;
        const unshaded = (() => { const a = moduleIV(new Array(ROWS * COLS).fill(1), true); return a.reduce((m, p) => (p.P > m.P ? p : m)); })();
        v.render(() => {
          const g = shaded.map((s) => (s ? level.value : 1));
          const withB = moduleIV(g, true), noB = moduleIV(g, false);
          const best = (arr) => arr.reduce((m, p) => (p.P > m.P ? p : m));
          const bB = best(withB), bN = best(noB);
          const main = byp.value ? bB : bN;
          // module drawing
          for (let s = 0; s < 3; s++) {
            const sk = main.subs[s];
            M.rect(0.3 + 2 * s + 0.03, 0.03, 0.3 + 2 * s + 1.97, ROWS - 0.03, { fill: false, color: sk ? 'red' : 'green', width: 2.2, dash: sk ? [5, 4] : false, radius: 6 });
            M.text(sk ? 'bypassed' : 'in circuit', 0.3 + 2 * s + 1, -0.45, { size: 11.5, align: 'center', color: sk ? 'red' : 'green', weight: 600 });
          }
          for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
            const sh = shaded[r * COLS + c], x0 = 0.3 + c + 0.07, y0 = ROWS - 1 - r + 0.07;
            M.rect(x0, y0, x0 + 0.86, y0 + 0.86, { fill: sh ? 'muted' : 'accent', fillAlpha: sh ? 0.75 : 0.3, color: sh ? 'ink' : 'accent', width: 1, radius: 2 });
          }
          // power curves
          const toPts = (arr) => arr.map((p) => (p.V >= 0 ? [p.V, p.P] : null));
          P.setView([0, 40], [0, Math.ceil((unshaded.P * 1.1) / 50) * 50]);
          P.path(toPts(byp.value ? noB : withB), { color: byp.value ? 'red' : 'green', width: 1.8, dash: [5, 4], alpha: 0.7 });
          P.path(toPts(byp.value ? withB : noB), { color: byp.value ? 'green' : 'red', width: 3.2, dash: byp.value ? false : [6, 4] });
          const mainArr = byp.value ? withB : noB;
          for (const pk of peaks(mainArr)) if (pk !== main && pk.V > 0) P.dot(pk.V, pk.P, { r: 5, color: byp.value ? 'green' : 'red' });
          P.dot(main.V, main.P, { r: 8, color: 'gold' });
          P.hline(unshaded.P, { color: 'faint', width: 1, dash: [4, 4] });
          P.text('unshaded module', 0.5, unshaded.P, { dy: -9, align: 'left', size: 11, color: 'muted' });
          st = { bB, bN, nsh: shaded.filter(Boolean).length, nloc: peaks(mainArr).length };
        });
        v.legend([['green', 'with bypass diodes'], ['red', 'without bypass diodes', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { bB, bN, nsh, nloc } = st;
          return `${nsh} of 60 cells shaded: best sampled power with bypass diodes **${v.fix(bB.P, 0)} W** (${v.fix((100 * bB.P) / unshaded.P, 0)}% of the unshaded ${v.fix(unshaded.P, 0)} W) at ${v.fix(bB.I, 1)} A; without them ${v.fix(bN.P, 0)} W (${v.fix((100 * bN.P) / unshaded.P, 0)}%) at ${v.fix(bN.I, 1)} A · local maxima on the displayed curve: ${nloc}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Concentrating sunlight: the étendue limit',
      statement: String.raw`Lossless passive geometrical optics (mirrors and lenses, no change of frequency) conserves **étendue**, $G=n^2\int\cos\theta\,dA\,d\Omega$, approximately $n^2A\Omega$ for a narrow cone near normal incidence. Sunlight arrives within the Sun's angular radius $\theta_s$, with $\sin\theta_s=R_\odot/d\approx4.65\times10^{-3}$, and cannot be squeezed into a smaller angular spread than it came with unless the area grows. A receiver that accepts light from the full hemisphere can therefore be at most
$$C_{\max}=\frac{1}{\sin^2\theta_s}\approx4.6\times10^{4}\ \ (\text{three dimensions}),\qquad C_{\max}=\frac1{\sin\theta_s}\approx 215\ \ (\text{a trough, in two dimensions}).$$
A blackbody receiver radiating from one face of its concentrated area, with no ambient back-radiation or other heat losses, reaches the stagnation temperature $T=(CS/\sigma)^{1/4}$ with $S=1361$ W/m², which at the three-dimensional $C_{\max}$ equals the blackbody Sun's temperature. The two-dimensional limit gives only about 1500 K under these same thermal assumptions.

Scope: ideal non-imaging optics, an isotropic radiator in a medium of refractive index 1; with a refractive medium of index $n$ the limits are multiplied by $n^2$ (or $n$ in 2D).`,
      idea: String.raw`Radiance (power per area per solid angle) cannot be increased by passive optics; this is the optical form of the second law, since if it could, a concentrator would heat a receiver above the Sun's temperature and let heat flow from cold to hot (thermo-2.1, energy-2.2). Étendue bookkeeping makes it quantitative: the sunlight entering an aperture of area $A$ carries étendue $A\pi\sin^2\theta_s$, and the receiver of area $a$ can accept at most $a\pi$ (a full hemisphere), so $A/a\le 1/\sin^2\theta_s$. An aplanatic concentrator, one that obeys the sine condition, achieves it: rays that leave the optics at angle $\theta$ to the axis come from an aperture of radius $f\sin\theta$ and image the Sun to radius $f\sin\theta_s$, so $C=(\sin\theta/\sin\theta_s)^2$ is largest for $\theta=90^\circ$. Since the stagnation temperature scales as $C^{1/4}$ (energy-4.1), it saturates exactly at $T_\odot$ — the number $1/\sin^2\theta_s=(d/R_\odot)^2$ is the same dilution factor that made the solar constant.`,
      caption: String.raw`**Left**: a schematic of sine-condition concentration in a plane, not a ray-traced mirror design. Sunlight from two edges of the solar disc (orange and blue, drawn with the angle exaggerated so you can see it) is bent from a circular arc of rim angle $\theta$ onto the small receiver (red). Widen the **rim angle**: the aperture grows relative to the receiver and the concentration $C=(\sin\theta/\sin\theta_s)^2$ rises, saturating at $90^\circ$. **Right**: the stagnation temperature against concentration; the dashed red part lies beyond the chosen geometry's concentration limit. Switch to a **trough** (2D) and the limit drops to 215.`,
      deps: ['energy-4.1', 'energy-2.2', 'thermo-9.6'],
      refs: ['Gang Chen, MIT 2.997 (2009), Lecture 9, maximum solar concentration and thermal balance', 'IAU 2015 Resolution B3, nominal radius and temperature'],
      tags: ['concentration', 'optics', 'second law'],
      scope: String.raw`Ideal passive optics and a blackbody absorber with no conduction or convection losses; real concentrators reach only a fraction of the limit.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Etendue' },
      viz(v) {
        const M = v.M;
        const sinS = R_SUN / AU, thS = Math.asin(sinS);
        const rim = v.slider('rim angle $\\theta$ (°)', 3, 90, 50, { step: 0.5 });
        const dim = v.select('geometry', [{ value: '3', label: 'dish (3D)' }, { value: '2', label: 'trough (2D)' }], '3');
        const ex = v.toggle('exaggerate the Sun’s size (drawn 20×)', true);
        const A = v.stage({ x: [-1.7, 0.35], y: [-1.15, 1.15], equal: true, axes: false, height: 340, weight: 1, minWidth: 280, title: 'ideal concentrator (cross-section)' });
        const T = v.stage({ x: [1, 1e5], xlog: true, y: [0, 7000], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'concentration C', ylabel: 'stagnation temperature (K)', title: 'how hot can the receiver get?' });
        let st = null;
        v.render(() => {
          const k = dim.value === '3' ? 2 : 1, th = rim.value * (Math.PI / 180);
          const phi = ex.value ? 20 * thS : thS;
          // arc, axis, receiver
          const arc = []; for (let a = -th; a <= th + 1e-9; a += th / 40) arc.push([-Math.cos(a), Math.sin(a)]);
          A.hline(0, { color: 'grid', width: 1 });
          const nr = 9;
          for (const sgn of [1, -1]) for (let i = 0; i < nr; i++) {
            const a = th * (-1 + (2 * i) / (nr - 1)), px = -Math.cos(a), py = Math.sin(a);
            const sy = py + (1.65 + px) * Math.tan(phi) * sgn;
            A.segment([-1.65, sy], [px, py], { color: sgn > 0 ? 'orange' : 'accent', width: 1, alpha: 0.7 });
            A.segment([px, py], [0, -sgn * Math.sin(phi)], { color: sgn > 0 ? 'orange' : 'accent', width: 1, alpha: 0.7 });
          }
          A.path(arc, { color: 'ink', width: 3 });
          const ra = Math.sin(phi);
          A.segment([0, -ra], [0, ra], { color: 'red', width: 5 });
          A.text('receiver', 0.03, 0.25, { dx: 4, align: 'left', size: 12, color: 'red', weight: 600 });
          A.text('sunlight →', -1.6, 1.05, { align: 'left', size: 12, color: 'muted' });
          A.text(`rim angle ${v.fix(rim.value, 0)}°`, -0.55, -Math.sin(th) - 0.1, { size: 11.5, color: 'muted', align: 'center' });
          // concentration and temperature
          const s = Math.sin(th) / sinS, C = s ** k, Cmax = (1 / sinS) ** k;
          const Tst = (c) => ((c * S0) / SIGMA) ** 0.25;
          const cmaxView = Math.max(1e5, Cmax * 2);
          T.setView([1, 1e5], [0, 7000]);
          const lim = 5772;
          T.fn((c) => Math.min(7000, Tst(c)), { domain: [1, Math.min(1e5, Cmax)], color: 'red', width: 3, n: 80 });
          if (Cmax < 1e5) T.fn((c) => Math.min(7000, Tst(c)), { domain: [Cmax, 1e5], color: 'red', width: 2, dash: [5, 5], alpha: 0.6, n: 60 });
          T.hline(lim, { color: 'orange', width: 1.5, dash: [6, 4] });
          T.text('Sun’s surface 5772 K', 1.4, lim, { dy: -10, align: 'left', size: 11.5, color: 'orange', weight: 600 });
          T.vline(Cmax, { color: 'green', width: 1.5, dash: [4, 4] });
          T.text(`C_max ≈ ${Math.round(Cmax).toLocaleString('en-US')}`, Cmax, 300, { dx: -6, align: 'right', size: 11.5, color: 'green', weight: 600 });
          T.dot(Math.min(C, 1e5), Math.min(7000, Tst(C)), { r: 8, color: 'gold' });
          st = { C, Cmax, Tst: Tst(C), k, th: rim.value };
        });
        v.legend([['red', 'stagnation temperature'], ['orange', 'Sun’s surface', { dash: true }], ['green', 'étendue limit', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { C, Cmax, Tst, k } = st;
          return `Rim angle ${v.fix(st.th, 0)}°: $C=(\\sin\\theta/\\sin\\theta_s)^{${k}}=$ **${Math.round(C).toLocaleString('en-US')}** of at most $1/\\sin^{${k}}\\theta_s=${Math.round(Cmax).toLocaleString('en-US')}$ (Sun's angular radius $\\theta_s=${v.fix(thS * 180 / Math.PI, 4)}^\\circ$) → ideal receiver at ${v.fix(Tst, 0)} K = ${v.fix((100 * Tst) / 5772, 0)}% of the Sun's 5772 K` + (k === 2 ? ' (one-dimensional concentration reaches only about 1500 K; a dish does the rest)' : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Paper',
      name: 'A New Silicon p-n Junction Photocell',
      paper: { authors: 'D. M. Chapin, C. S. Fuller and G. L. Pearson', year: 1954, title: 'A New Silicon p-n Junction Photocell for Converting Solar Radiation into Electrical Power', venue: 'Journal of Applied Physics 25 (5): 676–677', doi: '10.1063/1.1721711' },
      introduces: ['tech-12.10'],
      statement: String.raw`A two-page letter from Bell Telephone Laboratories reported a photocell made from a **silicon p–n junction**, with a thin p-type surface layer over an n-type silicon base, that turns sunlight into electrical power far more efficiently than the selenium and other photocells then available. In direct sunlight the cell converted about **6 %** of the incident power, corresponding to a reported 60 W/m² of photocell surface, compared with 0.5% for a commercially available photocell in their comparison. The junction field separates the electron–hole pairs that light creates, so the cell behaves as the illuminated diode of energy-4.3: a current proportional to the light, with an open-circuit voltage of a few tenths of a volt.

Scope: a small laboratory cell, measured in sunlight; an engineering milestone, not a theoretical limit.`,
      idea: String.raw`The paper identifies three practical obstacles to extracting power: reflection at the silicon surface, recombination before photocarriers reach the junction, and resistance in the surface layer and contacts. It describes a p-type surface layer less than 0.0001 inch thick over an n-type base and plots the cell's normalized spectral response. The thin layer helps carriers reach the junction, while contact geometry trades resistance against the illuminated area. Its measured sunlight output and its spectral-loss discussion motivate the diode and efficiency models of energy-4.3 and energy-4.5.`,
      caption: String.raw`A **reconstruction**, not the paper's data: a silicon cell in the single-diode model of 4.3, with parameters chosen to reproduce a cell near 6 % (high series resistance and a leaky junction), against the same cell with modern parameters. Slide the **sunlight** and drag the **load** along the curve to find the maximum power point; the right panel plots efficiency against light intensity for both. The comparison parameters are illustrative, not a measured modern device.`,
      deps: ['energy-4.3', 'mat-9.8', 'energy-4.1'],
      refs: ['Chapin, Fuller & Pearson (1954), pp. 676–677, spectral response Fig. 1 and final output paragraph, DOI 10.1063/1.1721711'],
      tags: ['photovoltaics', 'silicon', 'history'],
      credit: 'Chapin, Fuller & Pearson, Bell Telephone Laboratories, 1954',
      links: { doi: 'https://doi.org/10.1063/1.1721711', wikipedia: 'https://en.wikipedia.org/wiki/Solar_cell' },
      viz(v) {
        const suns = v.slider('sunlight (suns)', 0.05, 2, 1, { log: true, sig: 2 });
        const kind = v.select('cell', [{ value: '1954', label: '1954-like (illustrative)' }, { value: 'now', label: 'modern silicon (illustrative)' }], '1954');
        const P = { '1954': { jsc1: 19, j0ref: 1e-9, n: 1, rs: 2, rsh: 1500, col: 'accent' }, now: { jsc1: 41, j0ref: 1e-12, n: 1, rs: 0.5, rsh: 5000, col: 'green' } };
        const mk = (k, s) => cell({ suns: s, T: 298.15, ...P[k] });
        const S = v.stage({ x: [0, 0.8], y: [0, 50], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 290, xlabel: 'voltage V (V)', ylabel: 'current density (mA/cm²)', title: 'current–voltage curve' });
        const E = v.stage({ x: [0.05, 2], xlog: true, y: [0, 0.3], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'sunlight (suns)', ylabel: 'efficiency', title: 'efficiency against light', yticks: [[0, '0'], [0.05, '5%'], [0.1, '10%'], [0.15, '15%'], [0.2, '20%'], [0.25, '25%'], [0.3, '30%']] });
        let c = mk('1954', 1);
        const h = S.handle(0.3, 10, { color: 'gold', r: 8, constrain: (x) => { const V = clamp(x, 0.005, c.voc() - 0.003); return [V, c.J(V)]; } });
        let st = null;
        v.render(() => {
          const k = kind.value, s = suns.value; c = mk(k, s);
          const voc = c.voc(), jsc = c.jsc(), mp = c.pmax();
          S.setView([0, 0.8], [0, Math.max(10, Math.ceil((mk('now', s).jsc() * 1.1) / 5) * 5)]);
          const other = mk(k === 'now' ? '1954' : 'now', s);
          S.path(ivCurve(other, 0, other.voc(), 120), { color: 'muted', width: 1.6, dash: [5, 4] });
          const V = clamp(h.x, 0.005, voc - 0.003), J = c.J(V); h.set(V, J);
          S.rect(0, 0, V, J, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.5 });
          S.path(ivCurve(c, 0, voc, 140), { color: P[k].col, width: 3 });
          S.dot(mp.V, mp.J, { r: 6, color: 'green', hollow: true });
          for (const kk of ['1954', 'now']) E.fn((x) => (mk(kk, x).pmax().P) / (100 * x), { domain: [0.05, 2], color: P[kk].col, width: kk === k ? 3 : 1.6, n: 30, dash: kk === k ? false : [5, 4] });
          E.dot(s, mp.P / (100 * s), { r: 8, color: 'gold' });
          st = { V, J, voc, jsc, mp, eta: mp.P / (100 * s), FF: mp.P / (voc * jsc), s };
        });
        v.legend([['accent', '1954-like cell'], ['green', 'modern silicon cell']]);
        v.readout(() => {
          if (!st) return '';
          const { V, J, voc, jsc, mp, eta, FF, s } = st;
          return `${v.fix(100 * s, 0)} mW/cm² of sunlight: $J_{sc}=${v.fix(jsc, 1)}$ mA/cm², $V_{oc}=${v.fix(voc, 2)}$ V, FF ${v.fix(FF, 2)} → maximum power ${v.fix(mp.P, 1)} mW/cm², efficiency **${v.fix(100 * eta, 1)}%** · your load: ${v.fix(V * J, 1)} mW/cm² · Chapin et al., p. 677, reported 60 W/m² of photocell surface, about 6% efficiency. Both plotted cells are illustrative reconstructions.`;
        });
      },
    },
  ],
};
