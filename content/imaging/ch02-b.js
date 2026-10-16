// Medical Imaging — Chapter 2 (part 2): 2.6 projection geometry, 2.7 scatter and grids, 2.8 contrast agents and the K-edge, 2.9 dual-energy imaging.
import {
  clamp, fx, pct, mean, sd, MATS, mu, massAtt, kEdge, tubeSpectrum, transmit, meanEnergy, energyFluence, E_GRID, showImage, frame, poisson,
} from './ch02.shared.js';

// ---------------------------------------------------------------- Monte Carlo of scatter in a slab (for 2.7)
const KN_A = 510.999;
function kahn(E, r) { // Kahn's rejection sampling of the Klein–Nishina law: returns eps = E/E'
  const a = E / KN_A;
  for (;;) {
    const r1 = r(), r2 = r(), r3 = r();
    if (r1 <= (1 + 2 * a) / (9 + 2 * a)) { const e = 1 + 2 * a * r2; if (r3 <= 4 * (1 / e - 1 / (e * e))) return e; } else {
      const e = (1 + 2 * a) / (1 + 2 * a * r2), c = 1 - (e - 1) / a; if (r3 <= 0.5 * (c * c + 1 / e)) return e;
    }
  }
}
const TAB_N = 281; // energies 10..150 keV in 0.5 keV steps
const tabs = (() => {
  const t = { wpe: new Float64Array(TAB_N), wtot: new Float64Array(TAB_N), bpe: new Float64Array(TAB_N), btot: new Float64Array(TAB_N) };
  for (let i = 0; i < TAB_N; i++) {
    const E = 10 + 0.5 * i, a = massAtt(MATS.tissue, E), b = massAtt(MATS.bone, E);
    t.wpe[i] = a.pe * MATS.tissue.rho; t.wtot[i] = a.tot * MATS.tissue.rho; t.bpe[i] = b.pe * MATS.bone.rho; t.btot[i] = b.tot * MATS.bone.rho;
  }
  return t;
})();
/** Photons from a square field W×W on the top of a tissue slab (thickness T) holding a bone rod (radius R, axis along y); detected on a plane `gap` below. */
function runScatter(E0, T, W, R, gap, N, rng) {
  const a0 = E0 / KN_A, emin = Math.max(10, E0 / (1 + 2 * a0));
  let mm = 0; for (let i = Math.floor((emin - 10) * 2); i <= Math.ceil((E0 - 10) * 2); i++) mm = Math.max(mm, tabs.wtot[i], tabs.btot[i]);
  const xs = new Float32Array(N), ts = new Float32Array(N), pr = new Uint8Array(N); let nd = 0, nabs = 0, nback = 0;
  const tracks = [];
  for (let n = 0; n < N; n++) {
    let x = (rng() - 0.5) * W, y = (rng() - 0.5) * W, z = 0, ux = 0, uy = 0, uz = 1, E = E0, scat = false;
    const tr = n < 700 ? [[x, 0]] : null;
    for (;;) {
      const s = -Math.log(rng()) / mm; x += ux * s; y += uy * s; z += uz * s;
      if (z < 0) { nback++; if (tr) { tr.push([x - ux * s * 0, z]); } break; }
      if (z >= T) {
        const back = (z - T) / uz; x -= ux * back; y -= uy * back;
        const xd = x + (ux / uz) * gap, yd = y + (uy / uz) * gap;
        if (tr) tr.push([xd, T + gap]);
        if (Math.abs(yd) < W / 2) { xs[nd] = xd; ts[nd] = ux / uz; pr[nd] = scat ? 0 : 1; nd++; }
        break;
      }
      if (Math.abs(x) > 80 || Math.abs(y) > 80) break;
      const dz = z - T / 2, rod = x * x + dz * dz < R * R, i = Math.max(0, Math.min(TAB_N - 1, Math.round((E - 10) * 2)));
      const tot = rod ? tabs.btot[i] : tabs.wtot[i];
      if (rng() * mm > tot) continue;
      if (tr) tr.push([x, z]);
      if (rng() < (rod ? tabs.bpe[i] : tabs.wpe[i]) / tot) { nabs++; break; }
      const eps = kahn(E, rng), cosT = 1 - (eps - 1) / (E / KN_A), sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT)), phi = 6.283185307 * rng();
      E /= eps; scat = true; if (E < 10) break;
      const cp = Math.cos(phi), sp = Math.sin(phi);
      let nx, ny, nz;
      if (Math.abs(uz) > 0.99999) { nx = sinT * cp; ny = sinT * sp; nz = Math.sign(uz) * cosT; } else {
        const d = Math.sqrt(1 - uz * uz);
        nx = (sinT * (ux * uz * cp - uy * sp)) / d + ux * cosT; ny = (sinT * (uy * uz * cp + ux * sp)) / d + uy * cosT; nz = -sinT * cp * d + uz * cosT;
      }
      ux = nx; uy = ny; uz = nz;
    }
    if (tr) tracks.push({ p: tr, scat });
  }
  return { xs: xs.subarray(0, nd), ts: ts.subarray(0, nd), pr: pr.subarray(0, nd), N, nd, nabs, nback, tracks };
}

export default {
  collection: 'imaging',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Projection geometry: magnification and penumbra',
      statement: String.raw`In projection radiography the X-rays diverge from a small **focal spot** of width $f$ and a detector at source–image distance $\mathrm{SID}$ records the shadow of an object placed at distance $\mathrm{SOD}$ from the source. By similar triangles the shadow is **magnified** by
$$M=\frac{\mathrm{SID}}{\mathrm{SOD}}\ \ge 1,$$
equal to 1 only when the object touches the detector. Because the focal spot is not a point, every edge of the object is imaged as a ramp, the **penumbra** (geometric unsharpness), of width
$$P=f\,\frac{\mathrm{OID}}{\mathrm{SOD}}=f\,(M-1),\qquad \mathrm{OID}=\mathrm{SID}-\mathrm{SOD},$$
the distance between the object and the detector. Magnification enlarges the image but also its blur: to keep $P$ small one wants a small focal spot and the object close to the detector (large source distance).`,
      idea: String.raw`Rays are straight lines from each point of the focal spot through each point of the object. Two rays from the two ends of the spot grazing the same edge of the object cross it at the same point but diverge afterwards, reaching the detector a distance $f\,\mathrm{OID}/\mathrm{SOD}$ apart (similar triangles); the detector sees full intensity outside this ramp, none inside the umbra, and a fraction of the spot's area, hence a linear ramp, in between. Beyond the object plane magnification and penumbra grow together because both are the same geometric divergence.`,
      caption: String.raw`Drag the object up and down between the source and the detector (the vertical axis is compressed; the focal spot is shown much larger than life). Right: the intensity profile across the left edge of the shadow on the detector (zoomed in, in mm), computed by sampling 61 points across the focal spot and counting which rays clear the object. Note how the shadow widens (magnification) and the edges soften (penumbra) together as the object approaches the source; shrink the focal spot and the ramp collapses to the sharp ideal edge (dashed).`,
      deps: ['imaging-2.2'],
      tags: ['magnification', 'penumbra', 'focal spot'],
      refs: ['Prince–Links ch. 5'],
      scope: String.raw`Point-by-point ray model with an opaque object, a uniformly emitting rectangular focal spot of width $f$ and an ideal detector; the inverse-square variation across the image and detector blur are left out.`,
      viz(v) {
        const G = v.stage({ x: [-14, 14], y: [-8, 108], equal: false, axes: false, height: 400, minWidth: 280, title: 'Geometry (side view, vertical axis compressed)' });
        const P = v.stage({ x: [-40, 40], y: [0, 1.12], axes: 'box', gutter: true, height: 400, minWidth: 300, xlabel: 'position on the detector (mm; zoomed on the edge)', ylabel: 'relative intensity', title: 'Left edge of the shadow, magnified' });
        const sid = v.slider('source–image distance (cm)', 60, 180, 100, { step: 1, int: true });
        const fs = v.slider('focal spot $f$ (mm)', 0.1, 3, 1.2, { step: 0.1 });
        const wd = v.slider('object width $w$ (mm)', 8, 60, 24, { step: 1, int: true });
        const hz = G.handle(0, 40, { color: 'gold', r: 8, constrain: { x: [0, 0], y: [5, 95] }, label: 'object' });
        let st = null;
        v.render(() => {
          const SID = sid.value, f = fs.value, w = wd.value; // mm for f, w
          hz.set(0, clamp(hz.y, SID * 0.3 > 5 ? 5 : 5, SID * 0.9));
          const yo = clamp(hz.y, 5, SID * 0.92), z0 = SID - yo, Mg = SID / z0;
          G.setView([-14, 14], [-6, SID + 8]);
          // detector, object, source
          G.rect(-14, -3, 14, 0, { fill: 'muted', fillAlpha: 0.5, color: 'muted' });
          G.text('detector', -13.5, -1.5, { size: 11, baseline: 'middle' });
          const hw = w / 20, hf = f / 20;
          G.rect(-hw, yo - 1.2, hw, yo + 1.2, { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 1.5 });
          G.dot(0, SID, { color: 'red', r: 5, label: 'focal spot', labelPos: 'e' });
          const xd = (sa, e) => sa + (e - sa) * Mg; // detector position (cm) of the ray from source point sa through object edge e
          const edges = [-hw, hw], sps = [-hf, hf];
          for (const e of edges) for (const sa of sps) {
            const X = xd(sa, e); G.line(sa, SID, X, 0, { color: sa < 0 ? 'accent' : 'teal', width: 1.2, alpha: 0.8 });
          }
          // umbra and penumbra on the detector (cm)
          const uL = xd(-hf, -hw), uR = xd(hf, hw), pL = xd(hf, -hw), pR = xd(-hf, hw);
          G.rect(Math.min(uL, uR), -3, Math.max(uL, uR), 0, { fill: 'ink', fillAlpha: 0.7, stroke: false });
          G.rect(pL, -3, uL, 0, { fill: 'orange', fillAlpha: 0.7, stroke: false });
          G.rect(uR, -3, pR, 0, { fill: 'orange', fillAlpha: 0.7, stroke: false });
          G.text(`SID = ${SID} cm`, 13.5, SID * 0.8, { align: 'right', size: 12, color: 'muted' });
          G.text(`SOD = ${fx(z0, 0)} cm`, 13.5, SID * 0.8, { align: 'right', size: 12, color: 'muted', dy: 16 });
          // profile in mm, zoomed on the left edge of the shadow
          const NS = 61, sp = [], wmm = w, ratio = z0 / SID, Pth = f * (Mg - 1), xe = -Mg * wmm / 2, hwin = Math.max(1.2, 1.6 * Pth);
          for (let k = 0; k < NS; k++) sp.push(-f / 2 + (f * k) / (NS - 1));
          const I = (X) => { let c = 0; for (const s of sp) { const xo = s + (X - s) * ratio; if (Math.abs(xo) >= wmm / 2) c++; } return c / NS; };
          P.setView([xe - hwin, xe + hwin], [0, 1.12]);
          const xsP = [], ys = [];
          for (let k = 0; k <= 600; k++) { const X = xe - hwin + (2 * hwin * k) / 600; xsP.push(X); ys.push(I(X)); }
          P.path(xsP.map((X, k) => [X, ys[k]]), { color: 'accent', width: 2.4 });
          P.path([[xe - hwin, 1], [xe, 1], [xe, 0], [xe + hwin, 0]], { color: 'muted', dash: true, width: 1.3 });
          let lo = null, hi = null; for (let k = 0; k <= 600; k++) { if (lo === null && ys[k] < 0.999) lo = xsP[k]; if (ys[k] <= 0.001) { hi = xsP[k]; break; } }
          const pm = lo !== null && hi !== null ? hi - lo : 0;
          if (pm > 0) { P.measure(lo, 0.5, hi, 0.5, `penumbra ${fx(pm, 2)} mm`); }
          st = { Mg, z0, SID, Pth, Pmeas: pm, iw: Mg * w };
        });
        v.legend([['red', 'focal spot'], ['orange', 'object / penumbra'], ['ink', 'umbra'], ['muted', 'point-source shadow', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$\\mathrm{SOD}=${fx(st.z0, 1)}$ cm, $\\mathrm{OID}=${fx(st.SID - st.z0, 1)}$ cm: magnification $M=\\mathrm{SID}/\\mathrm{SOD}=${fx(st.Mg, 2)}$, image width $Mw=${fx(st.iw, 1)}$ mm.\nPenumbra $P=f(M-1)=${fx(st.Pth, 2)}$ mm; measured on the profile (sampled focal spot) $${fx(st.Pmeas, 2)}$ mm.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Concept',
      name: 'Scatter and anti-scatter grids',
      statement: String.raw`A fraction of the photons that leave the patient have been Compton scattered. They arrive at the detector from the wrong direction, add a smooth fog that carries no information about the line they appear to belong to, and lower the contrast of every detail: if the primary (unscattered) signal in the background is $P$ and the scatter is $S$, with scatter-to-primary ratio $\mathrm{SPR}=S/P$, a primary contrast $C_p$ is reduced to roughly
$$C\approx\frac{C_p}{1+\mathrm{SPR}},$$
and SPR grows with patient thickness and field size (in a thick abdomen it can exceed 2). An **anti-scatter grid** is a row of thin lead strips, tall compared with the gaps, aligned with the beam: photons travelling along the beam pass between the strips, obliquely scattered photons hit them. A grid of ratio $r=h/d$ (strip height over gap) accepts rays within about $\arctan(1/r)$ of the grid axis. It raises contrast, but absorbs some primary photons as well, so the exposure must be raised by the **Bucky factor**.`,
      idea: String.raw`Scattered photons are the Compton events of imaging-2.4, whose angular distribution is the Klein–Nishina law (broad, with a large forward part), so many leave the patient at small angles and cannot be rejected by geometry, but large-angle ones can. A grid is a geometric angular filter: photon direction tan θ times the strip height is its lateral drift inside a gap of width $d$, so the transmission is $\max(0,d-h\tan\theta)/(d+t)$ for strips of thickness $t$: perpendicular rays lose only the strip fraction $t/(d+t)$, oblique ones are blocked. The price is that part of the primary is intercepted and the dose must rise to restore the signal.`,
      caption: String.raw`A Monte Carlo of 160 000 photons through a tissue slab holding a bone rod (left: some photon tracks, green primary, red scattered). Right: the counts on the detector across the slab, compared at primary only (dashed blue), everything (red) and everything after the grid (green). Increase **thickness** or **field size** and the red fog rises, washing out the dip of the rod; choose a grid and the fog drops, the rod's dip deepens, and the readout shows the price (Bucky factor). The **air gap** is the grid-free alternative: scatter diverges and misses the detector.`,
      deps: ['imaging-2.4'],
      tags: ['scatter', 'grid', 'contrast'],
      refs: ['Prince–Links ch. 5'],
      scope: String.raw`Monte Carlo of photoelectric absorption and Klein–Nishina scattering at one initial energy (coherent scatter and secondary electrons omitted); parallel beam and a parallel (non-focused) ideal grid with 0.05 mm lead strips, 2 mm high; no absorption in the interspace material, so real grids transmit less primary. Counts are of photons, not of energy absorbed in the detector.`,
      viz(v) {
        const D = v.stage({ x: [-20, 20], y: [-45, 5], equal: true, axes: false, height: 400, minWidth: 280, title: 'Side view (green: primary, red: scattered)' });
        const Pf = v.stage({ x: [-16, 16], y: [0, 2], axes: 'box', gutter: true, height: 400, minWidth: 320, xlabel: 'position on the detector (cm)', ylabel: 'photons per bin, relative to primary background', title: 'What the detector counts' });
        const th = v.slider('patient thickness (cm)', 5, 35, 20, { step: 1, int: true });
        const fld = v.slider('field size (cm)', 10, 35, 20, { step: 1, int: true });
        const en = v.slider('photon energy (keV)', 40, 110, 60, { step: 1, int: true });
        const gap = v.slider('air gap (cm)', 0, 30, 0, { step: 1, int: true });
        const grid = v.select('grid ratio', [{ value: 0, label: 'none' }, { value: 5, label: '5:1' }, { value: 8, label: '8:1' }, { value: 12, label: '12:1' }, { value: 16, label: '16:1' }], 8);
        const R = 1.5, NB_W = 1, NPH = 160000, H_GRID = 0.2, T_STRIP = 0.005;
        let cache = { key: '' }, st = null;
        v.render(() => {
          const T = th.value, W = fld.value, E = en.value, g = gap.value, key = `${T}|${W}|${E}|${g}`;
          if (cache.key !== key) cache = { key, sim: runScatter(E, T, W, R, g, NPH, v.rng(5 + T)) };
          const sim = cache.sim, r = grid.value;
          const half = W / 2 + 6, nb = Math.ceil((2 * half) / NB_W), edges0 = -half;
          const prim = new Float64Array(nb), scat = new Float64Array(nb), primG = new Float64Array(nb), scatG = new Float64Array(nb);
          const d = r > 0 ? H_GRID / r : 1, pitch = d + T_STRIP;
          for (let k = 0; k < sim.nd; k++) {
            const b = Math.floor((sim.xs[k] - edges0) / NB_W); if (b < 0 || b >= nb) continue;
            const wgt = r > 0 ? Math.max(0, d - H_GRID * Math.abs(sim.ts[k])) / pitch : 1;
            if (sim.pr[k]) { prim[b]++; primG[b] += wgt; } else { scat[b]++; scatG[b] += wgt; }
          }
          // regions: background |x| in (R+1.5, 0.32 W), rod |x| < R/2
          const bgBins = [], rodBins = [];
          for (let b = 0; b < nb; b++) { const x = edges0 + (b + 0.5) * NB_W, ax = Math.abs(x); if (ax > R + 1.5 && ax < 0.32 * W) bgBins.push(b); else if (ax < R / 2) rodBins.push(b); }
          const avg = (A, bins) => (bins.length ? bins.reduce((s, b) => s + A[b], 0) / bins.length : 0);
          const pb = avg(prim, bgBins), sb = avg(scat, bgBins), pr = avg(prim, rodBins), sr = avg(scat, rodBins);
          const pbG = avg(primG, bgBins), sbG = avg(scatG, bgBins), prG = avg(primG, rodBins), srG = avg(scatG, rodBins);
          const spr = sb / pb, sprG = sbG / pbG, Cp = 1 - pr / pb, C0 = 1 - (pr + sr) / (pb + sb), C1 = 1 - (prG + srG) / (pbG + sbG);
          const norm = 1 / pb;
          const ymax = Math.max(1.25, ...Array.from(prim, (p, b) => (p + scat[b]) * norm)) * 1.08;
          Pf.setView([-half, half], [0, ymax]);
          const xsB = (b) => edges0 + (b + 0.5) * NB_W;
          Pf.path(Array.from(prim, (p, b) => [xsB(b), p * norm]), { color: 'accent', dash: true, width: 1.8 });
          Pf.path(Array.from(prim, (p, b) => [xsB(b), (p + scat[b]) * norm]), { color: 'red', width: 2.2 });
          if (r > 0) Pf.path(Array.from(prim, (p, b) => [xsB(b), (primG[b] + scatG[b]) * norm]), { color: 'green', width: 2.2 });
          Pf.vline(-W / 2, { color: 'faint', dash: true, width: 1 }); Pf.vline(W / 2, { color: 'faint', dash: true, width: 1 });
          // side view
          const Y = (z) => -z;
          D.setView([-Math.max(W / 2 + 8, 14), Math.max(W / 2 + 8, 14)], [-(T + g) - 4, 5]);
          D.rect(-W / 2 - 3, Y(T), W / 2 + 3, Y(0), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1 });
          D.circle(0, Y(T / 2), R, { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 1.3 });
          D.rect(-half, Y(T + g) - 1.4, half, Y(T + g), { fill: 'muted', fillAlpha: 0.35, color: 'muted' });
          if (r > 0) for (let k = -10; k <= 10; k++) { const x = k * (half / 10.5); D.rect(x - 0.12, Y(T + g) - 0.1, x + 0.12, Y(T + g) + 1.0, { fill: 'ink', fillAlpha: 0.9, stroke: false }); }
          const trs = sim.tracks, pri = trs.filter((t) => !t.scat), sca = trs.filter((t) => t.scat);
          for (let k = 0; k < 14; k++) { const t = pri[Math.floor((k * pri.length) / 14)]; if (t) D.path(t.p.map(([x, z]) => [x, Y(z)]), { color: 'green', width: 1, alpha: 0.7 }); }
          for (let k = 0; k < 36; k++) { const t = sca[Math.floor((k * sca.length) / 36)]; if (t) D.path(t.p.map(([x, z]) => [x, Y(z)]), { color: 'red', width: 1, alpha: 0.7 }); }
          D.text('rod (bone)', R + 0.4, Y(T / 2), { size: 11, baseline: 'middle' });
          st = { spr, sprG, Cp, C0, C1, bucky: (pb + sb) / (pbG + sbG), r, pred: Cp / (1 + spr), tp: pbG / pb };
        });
        v.legend([['accent', 'primary only', { dash: true }], ['red', 'primary + scatter'], ['green', 'after the grid']]);
        v.readout(() => {
          if (!st) return '';
          return `Scatter-to-primary ratio in the background: $\\mathrm{SPR}=${fx(st.spr, 2)}$. Rod contrast: primary alone $C_p=${fx(st.Cp, 3)}$, with scatter $C=${fx(st.C0, 3)}$ (the rule of thumb $C_p/(1+\\mathrm{SPR})=${fx(st.pred, 3)}$ assumes equal scatter under the rod and in the background).\n${st.r ? `With the ${st.r}:1 grid: $\\mathrm{SPR}=${fx(st.sprG, 2)}$, contrast $${fx(st.C1, 3)}$ (improvement $\\times${fx(st.C1 / st.C0, 2)}$), primary transmission $${fx(st.tp, 2)}$, Bucky factor (exposure increase) $${fx(st.bucky, 2)}$.` : 'No grid: all scattered photons that reach the detector contribute fog.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Concept',
      name: 'Contrast agents and the K-edge',
      statement: String.raw`Blood and soft tissue differ little in attenuation, so vessels, the gut or the urinary tract are made visible by filling them with a **contrast agent** containing an element of high atomic number: iodine ($Z=53$), barium ($56$) or, for MRI and some CT, gadolinium ($64$). At photon energies just above the element's **K-edge** — the binding energy of its K-shell electron, $E_K=33.2$ keV for iodine, $37.4$ keV for barium, $50.2$ keV for gadolinium — photoelectric absorption by the K shell becomes possible and the mass attenuation coefficient jumps by a factor of about 5–6, then falls again roughly as $E^{-3}$. The log-attenuation difference between a vessel of thickness $d$ holding agent at mass concentration $c$ and the surrounding tissue is
$$\Delta A(E)\approx\Big(\frac{\mu}{\rho}\Big)_{\rm agent}(E)\;c\,d,$$
so contrast is largest in the window just above $E_K$, and the beam spectrum should have most of its photons there.`,
      idea: String.raw`Photoelectric absorption (imaging-2.4) needs the photon to have at least the binding energy of the electron it removes; below $E_K$ the K-shell electrons are unavailable and only the outer shells absorb, above it a whole new, tightly bound shell joins in and the cross-section jumps. Since the agent's coefficient is huge compared with that of tissue, the contrast simply follows the agent's absorption curve, with the same $E^{-3}$ decline above the edge and a cliff at the edge. Choosing a kVp whose beam straddles $E_K$ (or filtering it so) concentrates photons where the contrast is highest, at the price of higher patient attenuation at low energy.`,
      caption: String.raw`Left: attenuation of the agent (colour) against soft tissue (black) with the jump at the K-edge. Right: the log-attenuation contrast of a 5 mm vessel through a patient as a function of photon energy (curve), and the contrast actually obtained with the polychromatic tube beam you choose (dashed line; the grey shape is the beam reaching the detector). Choose the agent, concentration and kVp: contrast is highest when the beam is rich just above the edge; a 120 kVp beam wastes most of its photons where iodine hardly shows, and a copper filter hardens it further.`,
      deps: ['imaging-2.4'],
      tags: ['K-edge', 'contrast agent', 'iodine'],
      refs: ['Prince–Links ch. 5'],
      scope: String.raw`Vessel modelled as a pure layer of agent at concentration $c$ (g/cm$^3$) in water-like tissue, with the tissue thickness unchanged; L edges ignored; the jump ratio is a model value (5.5), the K-edge energies are the tabulated ones.`,
      viz(v) {
        const L = v.stage({ x: [10, 150], y: [0.05, 300], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'photon energy (keV)', ylabel: 'mass attenuation $\\mu/\\rho$ (cm²/g)', title: 'Agent against soft tissue' });
        const R = v.stage({ x: [20, 150], y: [0, 0.3], axes: 'box', gutter: true, height: 340, xlabel: 'photon energy (keV)', ylabel: 'log-attenuation contrast $\\Delta A$', title: 'Vessel contrast and the beam', minWidth: 320 });
        const ag = v.select('agent', [{ value: 'iodine', label: 'iodine' }, { value: 'barium', label: 'barium' }, { value: 'gadolinium', label: 'gadolinium' }], 'iodine');
        const conc = v.slider('concentration (mg/mL)', 1, 50, 15, { log: true, sig: 2 });
        const kv = v.slider('tube voltage (kVp)', 40, 140, 70, { step: 1, int: true });
        const pt = v.slider('patient thickness (cm)', 5, 30, 15, { step: 1, int: true });
        const cuF = v.toggle('0.3 mm Cu filter', false);
        const sym = { iodine: 'I', barium: 'Ba', gadolinium: 'Gd' };
        let st = null;
        const eMono = R.handle(34, 0.1, { color: 'gold', r: 7, constrain: 'x', label: 'E' });
        v.render(() => {
          const m = MATS[ag.value], c = conc.value * 1e-3, d = 0.5, Ek = kEdge(sym[ag.value]);
          L.fn((x) => massAtt(m, x).tot, { color: 'red', width: 2.4, n: 800 });
          L.fn((x) => massAtt(MATS.tissue, x).tot, { color: 'ink', width: 2.2, n: 500 });
          L.vline(Ek, { color: 'green', dash: true, width: 1.2 });
          L.text(`K-edge ${fx(Ek, 1)} keV`, Ek, 0.08, { align: 'left', dx: 5, size: 12, color: 'green' });
          const dA = (E) => massAtt(m, E).tot * c * d;
          // beam
          const sp = tubeSpectrum(kv.value, 'W', 2.5, { cuMm: cuF.value ? 0.3 : 0 }), T = transmit(sp.N, sp.E, [[MATS.tissue, pt.value]]);
          const S = Float64Array.from(T, (n, i) => n * sp.E[i]), s0 = S.reduce((a, b) => a + b, 0);
          let sv = 0; for (let i = 0; i < S.length; i++) sv += S[i] * Math.exp(-dA(sp.E[i]));
          const poly = Math.log(s0 / sv);
          const maxC = Math.max(...Array.from({ length: 200 }, (_, k) => dA(Math.max(20, Ek + 0.01) + (k * 100) / 199)));
          R.setView([20, 150], [0, Math.max(0.05, maxC * 1.15)]);
          const pk = Math.max(...S), top = Math.max(0.05, maxC * 1.15);
          R.fn((x) => { const t = (x - sp.E[0]) / 0.25, i = Math.floor(t); return i < 0 || i >= S.length - 1 ? 0 : ((S[i] + (S[i + 1] - S[i]) * (t - i)) / pk) * top * 0.85; }, { fill: 'muted', fillAlpha: 0.22, color: 'muted', width: 1, n: 600, domain: [sp.E[0], Math.min(kv.value, 150)] });
          R.fn(dA, { color: 'red', width: 2.4, n: 800 });
          R.hline(poly, { color: 'accent', dash: true, width: 2 });
          L.vline(eMono.x, { color: 'gold', width: 1.5 }); R.vline(eMono.x, { color: 'gold', width: 1.5 });
          eMono.set(eMono.x, dA(eMono.x));
          const E = eMono.x;
          st = { Ek, poly, mono: dA(E), E, below: dA(Ek - 0.01), above: dA(Ek + 0.01), best: maxC, mE: meanEnergy(T, sp.E), tcon: massAtt(m, E).tot / massAtt(MATS.tissue, E).tot };
        });
        v.legend([['red', 'agent: $\\mu/\\rho$ and contrast'], ['ink', 'soft tissue'], ['muted', 'beam at the detector', { area: true }], ['accent', 'contrast with this beam', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `K-edge $${fx(st.Ek, 1)}$ keV: contrast jumps from $${fx(st.below, 3)}$ to $${fx(st.above, 3)}$ across it (ratio $${fx(st.above / st.below, 1)}$, model value 5.5).\nMonochromatic at $E=${fx(st.E, 1)}$ keV: $\\Delta A=${fx(st.mono, 3)}$ (agent attenuates $${fx(st.tcon, 0)}\\times$ more per gram than tissue). Tube beam: $\\Delta A=${fx(st.poly, 3)}$, which is $${fx(100 * st.poly / st.above, 0)}\\%$ of the monochromatic contrast just above the edge ($${fx(st.above, 3)}$); mean energy $${fx(st.mE, 1)}$ keV.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Method',
      name: 'Dual-energy imaging',
      statement: String.raw`Over the diagnostic range the attenuation of any body material is, to good accuracy, a linear combination of two basis functions of energy (the photoelectric and the Compton behaviour), so two measurements at different energies determine two unknowns. With a soft-tissue (index $s$) and bone (index $b$) basis, the log-attenuations measured at energies $E_1$ and $E_2$ are
$$\begin{pmatrix}A_1\\A_2\end{pmatrix}=\begin{pmatrix}\mu_b(E_1)&\mu_s(E_1)\\ \mu_b(E_2)&\mu_s(E_2)\end{pmatrix}\begin{pmatrix}t_b\\t_s\end{pmatrix},$$
and solving the $2\times2$ system at each pixel gives the equivalent bone thickness $t_b$ and soft-tissue thickness $t_s$. Displaying them separately yields a bone-only and a bone-subtracted soft-tissue image: a nodule hidden behind a rib shows up in the soft-tissue image, and a calcified one stays in the bone image. The determinant of the matrix measures how different the two energies are; when $E_1\approx E_2$ it vanishes and the noise in $t_b,t_s$ is amplified without limit, which is why the energies are chosen far apart.`,
      idea: String.raw`Each pixel's Beer–Lambert exponent (imaging-2.3) is a sum over the materials crossed; at two energies the bone/tissue ratio differs because bone's photoelectric absorption falls faster with energy than tissue's (imaging-2.4), so the two equations are independent and the $2\times2$ system is invertible. Noise from counting statistics (Poisson, imaging-1.7) in $A_1$ and $A_2$ is propagated through the matrix inverse, and a nearly singular matrix magnifies it, producing a noisier subtraction than either original image.`,
      caption: String.raw`A simulated chest: soft tissue, lungs, ribs, spine and a 2 cm nodule placed behind a rib (choose a soft-tissue or calcified nodule). Top row: the two measured images at the energies you set. Bottom row: the solved bone and soft-tissue thickness maps. Bring $E_1$ and $E_2$ close together or lower the photon count and the decomposition turns to noise; spread them apart and the ribs vanish from the soft-tissue image, uncovering the nodule.`,
      deps: ['imaging-2.4'],
      tags: ['dual energy', 'material decomposition', 'subtraction'],
      refs: ['Prince–Links ch. 5'],
      scope: String.raw`Monoenergetic beams at $E_1,E_2$ (real systems use two kVp spectra with a copper filter, which brings beam hardening back and needs calibration); no scatter; materials restricted to bone and soft tissue, so a contrast agent or metal breaks the two-material assumption.`,
      viz(v) {
        const N = 80;
        const mk = (title) => v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 250, minWidth: 190, title });
        const sA = mk('image at $E_1$'), sB = mk('image at $E_2$'), sBone = mk('bone thickness $t_b$'), sSoft = mk('soft-tissue thickness $t_s$');
        const e1 = v.slider('low energy $E_1$ (keV)', 30, 80, 45, { step: 1, int: true });
        const e2 = v.slider('high energy $E_2$ (keV)', 40, 140, 80, { step: 1, int: true });
        const dose = v.slider('incident photons per pixel', 1e4, 1e8, 3e6, { log: true, sig: 2, fmt: (x) => x.toExponential(1).replace('e+', '×10^') });
        const nod = v.select('nodule', [{ value: 'soft', label: 'soft tissue' }, { value: 'calc', label: 'calcified' }], 'soft');
        // phantom (thickness maps, cm)
        const rib = (k, x) => 0.28 + 0.095 * k + 0.32 * (x - 0.5) ** 2;
        const nx = 0.3, ny = rib(2, nx), nr = 0.05;
        const maps = (type) => {
          const ts = new Float64Array(N * N), tb = new Float64Array(N * N), nodMask = new Float64Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const x = (i + 0.5) / N, y = 1 - (j + 0.5) / N, yy = 1 - y; // yy: downward
            const r2 = ((x - 0.5) / 0.46) ** 2 + ((yy - 0.5) / 0.44) ** 2;
            let s = r2 < 1 ? 22 * Math.pow(1 - r2, 0.3) : 0, b = 0;
            if (r2 < 1) {
              for (const cx of [0.3, 0.7]) { const q = ((x - cx) / 0.12) ** 2 + ((yy - 0.47) / 0.27) ** 2; if (q < 1) s *= 1 - 0.7 * Math.pow(1 - q, 0.4); }
              for (let k = 0; k < 5; k++) if (Math.abs(yy - rib(k, x)) < 0.017 && Math.abs(x - 0.5) > 0.03) b += 1.0 * Math.sqrt(1 - ((yy - rib(k, x)) / 0.017) ** 2);
              if (Math.abs(x - 0.5) < 0.022) b += 2.2;
              const dn = Math.hypot(x - nx, yy - ny);
              if (dn < nr) { const h = Math.sqrt(1 - (dn / nr) ** 2); nodMask[j * N + i] = 1; if (type === 'soft') s += 3.0 * h; else b += 1.2 * h; }
            }
            ts[j * N + i] = s; tb[j * N + i] = b;
          }
          return { ts, tb, nodMask };
        };
        const MAPS = { soft: maps('soft'), calc: maps('calc') };
        const mus = (E) => mu(MATS.tissue, E), mub = (E) => mu(MATS.bone, E);
        let st = null, cache = { key: '' };
        const compute = () => {
          const key = `${e1.value}|${e2.value}|${dose.value}|${nod.value}`;
          if (cache.key === key) return cache;
          const { ts, tb, nodMask } = MAPS[nod.value], r = v.rng(21), n = N * N;
          const a11 = mub(e1.value), a12 = mus(e1.value), a21 = mub(e2.value), a22 = mus(e2.value), det = a11 * a22 - a12 * a21;
          const A1 = new Float64Array(n), A2 = new Float64Array(n), Tb = new Float64Array(n), Ts = new Float64Array(n);
          for (let q = 0; q < n; q++) {
            const x1 = a11 * tb[q] + a12 * ts[q], x2 = a21 * tb[q] + a22 * ts[q], N0 = dose.value;
            const c1 = poisson(N0 * Math.exp(-x1), r), c2 = poisson(N0 * Math.exp(-x2), r);
            A1[q] = -Math.log(Math.max(c1, 0.5) / N0); A2[q] = -Math.log(Math.max(c2, 0.5) / N0);
            Tb[q] = (a22 * A1[q] - a12 * A2[q]) / det; Ts[q] = (-a21 * A1[q] + a11 * A2[q]) / det;
          }
          // visibility of the nodule: contrast between nodule core and a surrounding ring, in units of the ring's spread
          const core = [], side = [], p1 = [], p2 = [];
          for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
            const x = (i + 0.5) / N, yy = (j + 0.5) / N, d = Math.hypot(x - nx, yy - ny);
            if (d < nr * 0.6) core.push(j * N + i);
            else if (Math.abs(yy - ny) < 0.02 && Math.abs(x - nx) > nr * 1.4 && Math.abs(x - nx) < nr * 2.6) side.push(j * N + i);
            if (x > 0.6 && x < 0.7) { const r2 = rib(2, x), r3 = rib(3, x); if (Math.abs(yy - r2) < 0.009) p1.push(j * N + i); else if (Math.abs(yy - (r2 + r3) / 2) < 0.009) p2.push(j * N + i); }
          }
          // noise: spread of the residual from a 3x3 mean (structure is smooth, noise is not)
          const resid = (I, q) => { const i = q % N, j = (q - i) / N; let m = 0, c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { m += I[(j + dj) * N + i + di]; c++; } return I[q] - m / c; };
          const cnr = (I, a, b) => (Math.abs(mean(a.map((q) => I[q])) - mean(b.map((q) => I[q]))) * 0.943) / sd(p2.map((q) => resid(I, q)));
          const vis = (I) => cnr(I, core, side), rib1 = (I) => cnr(I, p1, p2);
          const bgq = []; for (let j = 36; j < 44; j++) for (let i = 52; i < 60; i++) bgq.push(j * N + i);
          cache = { key, A1, A2, Tb, Ts, det, cond: Math.abs(a11 * a22) + Math.abs(a12 * a21) > 0 ? (Math.hypot(a11, a12) * Math.hypot(a21, a22)) / Math.abs(det) : Infinity, vA: vis(A1), vB: vis(A2), vT: vis(Ts), vBn: vis(Tb), rA: rib1(A1), rB: rib1(A2), rT: rib1(Ts), rBn: rib1(Tb), sb: sd(bgq.map((q) => Tb[q])), ss: sd(bgq.map((q) => Ts[q])) };
          return cache;
        };
        v.render(() => {
          const c = compute(), q = (A, p) => { const s = Array.from(A).sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };
          const win = (A) => [q(A, 0.25), q(A, 0.995)];
          const [l1, h1] = win(c.A1), [l2, h2] = win(c.A2);
          showImage(sA, c.A1, N, N, { lo: l1 - 0.2, hi: h1, id: 'a' }); frame(sA, N, N);
          showImage(sB, c.A2, N, N, { lo: l2 - 0.2, hi: h2, id: 'b' }); frame(sB, N, N);
          showImage(sBone, c.Tb, N, N, { lo: -0.4, hi: 3.6, id: 'c' }); frame(sBone, N, N);
          showImage(sSoft, c.Ts, N, N, { lo: 4, hi: 30, id: 'd' }); frame(sSoft, N, N);
          for (const s of [sA, sB, sBone, sSoft]) s.circle(nx * N, N - ny * N, nr * N * 1.5, { color: 'gold', width: 1.5, stroke: true, fill: false });
          st = c;
        });
        v.legend([['gold', 'where the nodule is (behind the 3rd rib)']]);
        v.readout(() => {
          if (!st) return '';
          return `Matrix determinant $${fx(st.det, 3)}$ (condition number $${fx(st.cond, 1)}$): the further apart $E_1,E_2$, the better conditioned the inversion. Noise in a uniform region: $\\sigma(t_b)=${fx(st.sb, 2)}$ cm, $\\sigma(t_s)=${fx(st.ss, 1)}$ cm.\nContrast-to-noise ratio of the nodule against its neighbours along the rib: low-energy image $${fx(st.vA, 1)}$, high-energy image $${fx(st.vB, 1)}$, soft-tissue image $${fx(st.vT, 1)}$, bone image $${fx(st.vBn, 1)}$.\nOf a rib (against the gap between ribs): $${fx(st.rA, 1)}$, $${fx(st.rB, 1)}$, $${fx(st.rT, 1)}$ in the soft-tissue image (the ribs are subtracted away) and $${fx(st.rBn, 1)}$ in the bone image.`;
        });
      },
    },
  ],
};
