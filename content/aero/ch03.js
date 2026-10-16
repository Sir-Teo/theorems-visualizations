// Aerospace Engineering — Chapter 3: Wings and drag
//
// Sources and what is from memory (Oct 2026). Items marked "checked" were confirmed against the cited record during writing.
//   3.1-3.3 Prandtl's lifting-line theory dates from 1918-1919 (Goettingen); Lanchester's 1907 book "Aerodynamics" already described the vortex wake behind a wing (both checked,
//       secondary sources: Wikipedia and the US Centennial of Flight essay). The formulas used are standard and were recomputed here: Gamma = 2 b V sum A_n sin(n theta), CL = pi AR A1,
//       CDi = pi AR sum n A_n^2, e = A1^2 / sum n A_n^2 (Glauert's Fourier solution, ch03.shared.js glauert()); elliptic loading gives w = Gamma0/(2b) and a rolled-up tip-vortex spacing pi b/4
//       (vortex centroid; recomputed in 3.1, and invariant in the simulation, which is the check).
//   3.3 Munk's minimum-induced-drag theorem: NACA Report 121 (1921), from his 1919 Goettingen dissertation (checked on NTRS/NASA catalogue records; the proof itself is not reproduced here:
//       the picture uses the Fourier form, which is exact for a planar wake). Independent check: a horseshoe-sheet sum (ch03.shared.js loadingAnalysis).
//   3.4 Vortex-lattice method: first paper V. M. Falkner, "The calculation of aerodynamic loading on surfaces of any shape", ARC R&M 1910, 1943 (checked, Cranfield AERADE catalogue and a
//       DTIC scan). The lattice here (4 chordwise x 20 spanwise panels by default, horseshoes with bound segment at the quarter chord and control point at the three-quarter chord, flat wake,
//       span efficiency from the Fourier series of the strip loading) was coded for this item and compared with Glauert's solution at zero sweep.
//   3.5 Section drag data: NACA 0012 at R = 1.8e6 read off the figure of Critzos, Heyson & Boswinkle (NACA TN 3361, 1955) in chapter 1 (ch01.shared.js CRITZOS_18): +-0.03 in c_l and about +-0.001 in c_d.
//   3.6 Standard parabolic-polar results (CL* = sqrt(CD0/K), (L/D)max = 1/(2 sqrt(K CD0))), re-derived and checked numerically in the readout. Density from the ISA of chapter 1.
//   3.7 Ground effect: horseshoe-sheet lifting line with opposite-signed image trailing vortices (the usual lifting-line treatment; the bound-vortex image is neglected). The comparison curve
//       sigma = (1 - 1.32 h/b)/(1.05 + 7.4 h/b), induced drag factor 1 - sigma, is a widely quoted engineering fit; it was recalled from a search summary (not opened in its source) and agrees with the
//       computed curve to a few percent over 0.1 < h/b < 0.5, which is the only support claimed (verify: true). Wieselsberger and Prandtl as originators of the image treatment: Mantle (Aeronautical Journal 2016) abstract.
//   3.8 Lissaman & Shollenberger, "Formation flight of birds", Science 168 (3934), 1003-1005 (1970): abstract checked (Caltech record): 25 birds, range increase about 70 percent. Weimerskirch et al.,
//       Nature 413, 697-698 (2001): heart-rate saving 11-14 percent in great white pelicans (value from a review quoting the paper; checked, one source). Portugal et al., Nature 505, 399-402 (2014): northern bald ibises,
//       positions match upwash predictions (checked, abstract). The model here (elliptic loading, rolled-up tip vortex pair at +-pi b/8, semi-infinite trailing filaments, no decay or wake roll-up distance) is
//       ours and is a cartoon of the original analysis, not a reproduction.

import {
  clamp, DEG, atmo, glauert, chordOf, cosEdges, sheetDownwash, weissinger, vlm, loadingAnalysis, CRITZOS_18, clTab, cdTab,
} from './ch03.shared.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const TWO_PI = 2 * Math.PI;

// ═════════════════════════════════════════════════════════════════════ helpers for 3.1 (roll-up of the trailing sheet)
const rollCache = new Map();
/** Loading Gamma/(V b) as a function of eta = 2y/b for a wing of aspect ratio AR carrying lift coefficient CL. */
function loadingFn(kind, AR, CL) {
  if (kind === 'ell') return (eta) => (2 * CL / (Math.PI * AR)) * Math.sqrt(Math.max(0, 1 - eta * eta));
  const g = glauert({ AR, lam: 1, alpha: 0.1 }), k = CL / g.CL;
  return (eta) => k * g.G(Math.acos(-clamp(eta, -1, 1)));
}
/** Advect a discretised trailing vortex sheet (60 panels, Krasny-desingularised point vortices) and a cloud of smoke tracers downstream, in units of the span. */
function rollup(kind, AR, CL) {
  const key = `${kind}|${AR}|${CL}`; let o = rollCache.get(key); if (o) return o;
  const Gf = loadingFn(kind, AR, CL), M = 120, edges = cosEdges(M), N = M + 1, Gam = [];
  for (let j = 0; j < M; j++) Gam.push(Gf(edges[j] + edges[j + 1]));
  const G = new Float64Array(N); for (let k = 0; k < N; k++) G[k] = (k > 0 ? Gam[k - 1] : 0) - (k < M ? Gam[k] : 0);
  const T = 480, P = new Float64Array(2 * (N + T));
  for (let k = 0; k < N; k++) { P[2 * k] = edges[k]; P[2 * k + 1] = 0; }
  for (let i = 0; i < T; i++) { const row = i % 4, col = (i - row) / 4; P[2 * (N + i)] = -0.5 + (col + 0.5) / (T / 4); P[2 * (N + i) + 1] = (row - 1.5) * 0.012; }
  const X = 24, steps = 240, dt = X / steps, d2 = 0.035 * 0.035, tp = 1 / TWO_PI;
  const vel = (Q, out) => {
    for (let a = 0; a < N + T; a++) {
      const y = Q[2 * a], z = Q[2 * a + 1]; let vy = 0, vz = 0;
      for (let k = 0; k < N; k++) { const dy = y - Q[2 * k], dz = z - Q[2 * k + 1], f = G[k] * tp / (dy * dy + dz * dz + d2); vy -= f * dz; vz += f * dy; }
      out[2 * a] = vy; out[2 * a + 1] = vz;
    }
  };
  const frames = [Float32Array.from(P)], k1 = new Float64Array(P.length), k2 = new Float64Array(P.length), Q = new Float64Array(P.length);
  for (let s = 0; s < steps; s++) {
    vel(P, k1); for (let i = 0; i < P.length; i++) Q[i] = P[i] + dt * k1[i];
    vel(Q, k2); for (let i = 0; i < P.length; i++) P[i] += dt * 0.5 * (k1[i] + k2[i]);
    frames.push(Float32Array.from(P));
  }
  o = { frames, N, T, G, X, steps, Gf, edges };
  rollCache.set(key, o); if (rollCache.size > 8) rollCache.delete(rollCache.keys().next().value);
  return o;
}
const profCache = new Map();
/** Downwash angle (deg) along the span at the wing, from a 160-panel horseshoe sheet (positive = down; negative = upwash). */
function downwashProfile(kind, AR, CL) {
  const key = `${kind}|${AR}|${CL}`; let o = profCache.get(key); if (o) return o;
  const Gf = loadingFn(kind, AR, CL), M = 160, edges = cosEdges(M), Gam = [];
  for (let j = 0; j < M; j++) Gam.push(Gf(edges[j] + edges[j + 1]));
  const ys = Array.from({ length: 321 }, (_, k) => -0.8 + 1.6 * k / 320);
  const w = sheetDownwash(edges, Gam, ys, { eps: 0.012 });
  o = { ys, deg: Array.from(w, (q) => q / DEG) }; profCache.set(key, o); if (profCache.size > 12) profCache.delete(profCache.keys().next().value);
  return o;
}
const interpArr = (xs, ys, x) => {
  if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
};

// ═════════════════════════════════════════════════════════════════════ helpers for 3.2
const eTabs = new Map();
/** Span efficiency of an untwisted wing from Glauert's solution, tabulated against ln AR for a planform ('ellipse' or a taper ratio) and interpolated. */
function eOfAR(lam, AR) {
  let t = eTabs.get(lam);
  if (!t) { t = []; for (let k = 0; k <= 40; k++) { const a = 2 * Math.pow(15, k / 40); t.push([Math.log(a), glauert({ AR: a, lam, alpha: 0.1, N: 16 })]); } eTabs.set(lam, t); }
  const x = Math.log(clamp(AR, 2, 30)); let i = 0; while (i < t.length - 2 && t[i + 1][0] < x) i++;
  const f = (x - t[i][0]) / (t[i + 1][0] - t[i][0]);
  return { e: t[i][1].e + (t[i + 1][1].e - t[i][1].e) * f, a: (t[i][1].CL + (t[i + 1][1].CL - t[i][1].CL) * f) / 0.1 };
}

// ═════════════════════════════════════════════════════════════════════ helpers for 3.3
const NODES = 21; // loading nodes, equally spaced in theta (eta = cos theta), index 0 = tip (fixed at zero), index 20 = centre
const nodeTheta = (i) => (i / (NODES - 1)) * Math.PI / 2;
const presetNodes = {
  ell: () => Array.from({ length: NODES }, (_, i) => Math.sin(nodeTheta(i))),
  par: () => Array.from({ length: NODES }, (_, i) => Math.sin(nodeTheta(i)) ** 2),
  tri: () => Array.from({ length: NODES }, (_, i) => 1 - Math.cos(nodeTheta(i))),
  flat: () => Array.from({ length: NODES }, (_, i) => 1 - Math.cos(nodeTheta(i)) ** 8),
  rect: () => { const g = glauert({ AR: 6, lam: 1, alpha: 0.1 }); const s = 1 / (2 * g.A[0]); return Array.from({ length: NODES }, (_, i) => (i === 0 ? 0 : g.G(nodeTheta(i)) * s)); },
};
function nodeFn(nodes, eps = 0, A1 = 0) {
  return (eta) => {
    const th = Math.acos(Math.min(1, Math.abs(eta))), t = th / (Math.PI / 2) * (NODES - 1), i = Math.min(NODES - 2, Math.floor(t)), f = t - i;
    return nodes[i] * (1 - f) + nodes[i + 1] * f + eps * A1 * Math.sin(3 * th);
  };
}

// ═════════════════════════════════════════════════════════════════════ helpers for 3.4
/** Vortex lattice; the induced drag is taken from the Fourier span efficiency of the strip circulation (interpolated linearly in y, zero at the tips),
 * which converges quickly with the spanwise mesh and cannot exceed the elliptic limit e = 1. */
function vlmX(o) {
  const a = vlm(o), ys = [-0.5, ...a.mid, 0.5], gs = [0, ...a.Gs, 0];
  const G = (eta) => interpArr(ys, gs, eta / 2);
  const e = loadingAnalysis(G, 41, 40).eFour, CDi = a.CL * a.CL / (Math.PI * o.AR * e);
  return { ...a, CDi, e };
}
const MESH = { coarse: { nx: 2, ny: 8 }, med: { nx: 4, ny: 20 }, fine: { nx: 6, ny: 40 } };

// ═════════════════════════════════════════════════════════════════════ helpers for 3.5 and 3.6
function alphaFromCl(cl) { let lo = 0, hi = 14; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (clTab(CRITZOS_18, m) < cl) lo = m; else hi = m; } return (lo + hi) / 2; }
const CL_SEC_MAX = 1.3;

// ═════════════════════════════════════════════════════════════════════ helpers for 3.7
const groundCache = new Map();
function groundCurve(AR) {
  let o = groundCache.get(AR); if (o) return o;
  const free = weissinger({ AR, alpha: 0.1, h: 0, M: 60 }), f0 = free.CDi / free.CL ** 2, pts = [];
  for (let k = 0; k <= 25; k++) { const h = 0.03 * Math.pow(1 / 0.03, k / 25), s = weissinger({ AR, alpha: 0.1, h, M: 60 }); pts.push([h, (s.CDi / s.CL ** 2) / f0, s.CL / free.CL]); }
  o = { pts, free }; groundCache.set(AR, o); if (groundCache.size > 6) groundCache.delete(groundCache.keys().next().value);
  return o;
}
const sigmaFit = (hb) => (1 - 1.32 * hb) / (1.05 + 7.4 * hb);
const fitPhi = (hb) => (hb >= 0.7575 ? 1 : 1 - sigmaFit(hb));

// ═════════════════════════════════════════════════════════════════════ helpers for 3.8
const SV = Math.PI / 8, CORE = 0.06, NQ = 28;
/** Fractional induced-drag saving of bird i (elliptic loading, equal lift) in the trailing-vortex field of all birds placed further forward (smaller x). */
function birdSaving(i, birds) {
  const b = birds[i]; let s = 0;
  for (let q = 0; q < NQ; q++) {
    const eta = -1 + (q + 0.5) * 2 / NQ, y = b.y + eta / 2, wgt = Math.sqrt(1 - eta * eta);
    let up = 0;
    for (let j = 0; j < birds.length; j++) {
      if (j === i) continue;
      const dx = b.x - birds[j].x;
      if (dx < 0) continue;
      for (const sg of [1, -1]) {
        const r = y - (birds[j].y + sg * SV), fac = 0.5 * (1 + dx / Math.sqrt(dx * dx + r * r + CORE * CORE));
        up += sg * r / (TWO_PI * (r * r + CORE * CORE)) * fac;
      }
    }
    s += wgt * up;
  }
  return s * (2 / NQ) * 0.5 / (Math.PI / 8);
}
function formation(kind, N, d, ang) {
  const dx = d / Math.tan(ang * DEG), out = [];
  for (let k = 0; k < N; k++) {
    if (kind === 'v') { const arm = k % 2 ? 1 : -1, rank = Math.ceil(k / 2); out.push({ x: rank * dx, y: k ? arm * rank * d : 0 }); }
    else if (kind === 'ech') out.push({ x: k * dx, y: k * d });
    else if (kind === 'abr') out.push({ x: 0, y: (k - (N - 1) / 2) * d });
    else out.push({ x: k * dx, y: 0 });
  }
  return out;
}
function flockSavings(kind, N, d, ang) { const B = formation(kind, N, d, ang), s = B.map((_, i) => birdSaving(i, B)); return { B, s, mean: s.reduce((a, b) => a + b, 0) / N }; }

export default {
  collection: 'aero',
  chapter: 3,
  title: 'Wings and drag',
  summary: String.raw`A finite wing leaks air around its tips, shedding a vortex wake that tilts the lift backward and creates induced drag, a cost of lift itself. Aspect ratio and span loading control it, and the combination with friction and pressure drag gives the drag polar — the single curve that governs aircraft performance. Lifting-line theory, vortex lattices, ground effect and formation flight all follow from the same vortex picture.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Phenomenon',
      name: 'Wingtip vortices and downwash',
      statement: String.raw`A wing of finite span $b$ that carries lift has a circulation $\Gamma(y)$ that varies along the span and falls to zero at the tips. Vortex lines cannot end in the fluid, so the change of $\Gamma$ must leave the trailing edge as a sheet of streamwise vorticity of strength $-\mathrm{d}\Gamma/\mathrm{d}y$ per unit span. The sheet is unstable: in the cross-flow plane it rolls up, within some span lengths downstream, into two concentric counter-rotating **tip vortices**. The trailing vorticity induces, by the Biot–Savart law, a **downwash** at the wing,
$$w(y)=\frac1{4\pi}\,\mathrm{PV}\!\!\int_{-b/2}^{b/2}\frac{\mathrm{d}\Gamma/\mathrm{d}\eta}{y-\eta}\,\mathrm{d}\eta ,$$
which tilts the local flow down by the **induced angle** $\alpha_i\approx w/V_\infty$ at each station, and an **upwash** outboard of the tips. For elliptic loading $w=\Gamma_0/2b$ is the same everywhere along the span, and the rolled-up pair is $\pi b/4$ apart.`,
      idea: String.raw`Helmholtz's vortex theorems (fluid-3.4) force the vorticity of the bound circulation to turn and trail behind the wing: wherever $\Gamma$ changes along the span a filament of strength $-\mathrm{d}\Gamma/\mathrm{d}y$ leaves the wing. Each filament induces a velocity $\Gamma/2\pi r$ around itself, and the filaments inboard of a station push the air there downwards, outboard of the tips upwards. The mutual induction of the filaments winds the sheet into a spiral, and since the sheet's vertical impulse $\rho\int\Gamma\,\mathrm{d}y$ is conserved, the vortex centroid stays put: the tip vortices of an elliptically loaded wing end up $\pi b/4$ apart, whatever the details of the roll-up. This is the physical origin of induced drag (3.2).`,
      caption: String.raw`The upper picture is the cross-flow plane, seen from behind, in a frame that travels with the air: the sheet leaves the wing (black bar) and the dots are smoke released along it; the clock is the distance downstream in spans. Press play, or drag the time of the animation, and watch the sheet curl up at the tips. Change the aspect ratio or lift coefficient to change the speed of roll-up (the sheet's induced velocities scale as $C_L/AR$), and switch to a rectangular wing to change the loading. The curve on the left is the downwash angle at the wing; drag the gold handle along it and see where the sign changes outside the tips: there the air rises.`,
      deps: ['fluid-3.4', 'fluid-5.8'],
      refs: ['Anderson ch. 5'],
      tags: ['vortices', 'downwash', 'lifting line'],
      scope: String.raw`Incompressible flow, a lightly loaded wing (the sheet leaves along the free stream), inviscid point-vortex dynamics with a small core. The roll-up here is a model of the near wake only: real tip vortices have viscous cores, decay, and eventually break down (Crow instability) far downstream; the Reynolds-number dependence of that is not represented.`,
      credit: 'Wing-vortex picture: Lanchester, 1907; lifting-line theory: Prandtl and co-workers, 1918–1919',
      viz(v) {
        const kindS = v.select('loading', [{ value: 'ell', label: 'elliptic' }, { value: 'rect', label: 'rectangular wing' }], 'ell');
        const arS = v.slider('aspect ratio AR', 4, 14, 8, { step: 0.5 });
        const clS = v.slider('lift coefficient $C_L$', 0.3, 1.3, 0.8, { step: 0.05 });
        const A = v.stage({ x: [-0.8, 0.8], y: [-0.5, 0.12], equal: true, axes: false, height: 360, minWidth: 420, title: 'trailing sheet in the cross-flow plane, seen from behind' });
        const B = v.stage({ x: [-0.8, 0.8], y: [-1, 4.5], axes: 'box', gutter: true, height: 260, minWidth: 240, xlabel: 'y/b', ylabel: '$\\alpha_i$ (°), downwash', title: 'downwash angle at the wing' });
        const C = v.stage({ x: [-0.6, 0.6], y: [0, 0.14], axes: 'box', gutter: true, height: 260, minWidth: 200, xlabel: 'y/b', ylabel: '$\\Gamma/(V_\\infty b)$', title: 'circulation along the span' });
        let prof = null;
        const probe = B.handle(0.25, 0, { color: 'gold', r: 7, constrain: (x) => { const X = clamp(x, -0.78, 0.78); return [X, prof ? interpArr(prof.ys, prof.deg, X) : 0]; } });
        let fr = 0, cur = null;
        v.animate((t) => {
          const kind = kindS.value, AR = arS.value, CL = clS.value;
          cur = rollup(kind, AR, CL); prof = downwashProfile(kind, AR, CL);
          fr = Math.round(clamp(t / 9, 0, 1) * cur.steps);
          const F = cur.frames[fr], { N, T } = cur;
          // view: follow the final descent
          const Fe = cur.frames[cur.steps]; let zmin = 0; for (let i = 0; i < N + T; i++) zmin = Math.min(zmin, Fe[2 * i + 1]);
          A.setView([-0.8, 0.8], [zmin - 0.06, 0.1 + 0.0]);
          A.line(-0.5, 0, 0.5, 0, { color: 'ink', width: 4 }); A.text('wing', 0.5, 0.05, { color: 'muted', size: 11, align: 'left' });
          const pts = []; for (let k = 0; k < N; k++) pts.push([F[2 * k], F[2 * k + 1]]);
          const tr = []; for (let i = 0; i < T; i++) tr.push([F[2 * (N + i)], F[2 * (N + i) + 1]]);
          A.dots(tr, { r: 1.4, color: 'muted' });
          A.path(pts, { color: 'accent', width: 1.6, alpha: 0.9 });
          let sy = 0, sg = 0; for (let k = 0; k < N; k++) if (F[2 * k] > 0) { sy += cur.G[k] * F[2 * k]; sg += cur.G[k]; }
          const yc = sy / sg; let sz = 0; for (let k = 0; k < N; k++) if (F[2 * k] > 0) sz += cur.G[k] * F[2 * k + 1];
          const zc = sz / sg;
          A.dot(yc, zc, { r: 5, color: 'green', hollow: true }); A.dot(-yc, zc, { r: 5, color: 'green', hollow: true });
          if (fr > 0) A.measure(-yc, zc - 0.03, yc, zc - 0.03, `${fx(2 * yc, 3)} b`);
          A.text(`x = ${fx(fr / cur.steps * cur.X, 1)} b downstream`, -0.78, -0.0 + (zmin - 0.06) * 0.0 + 0.07, { color: 'muted', size: 11, align: 'left' });
          // downwash profile
          B.hline(0, { color: 'grid' }); B.vband(-0.8, -0.5, { color: 'green', alpha: 0.06 }); B.vband(0.5, 0.8, { color: 'green', alpha: 0.06 });
          B.vline(-0.5, { color: 'faint', dash: true }); B.vline(0.5, { color: 'faint', dash: true });
          B.path(prof.ys.map((y, i) => [y, prof.deg[i]]), { color: 'accent', width: 2.4 });
          if (kind === 'ell') B.hline(CL / (Math.PI * AR) / DEG, { color: 'orange', dash: true, width: 1.4 });
          B.text('upwash', -0.65, -0.45, { color: 'green', size: 10.5, align: 'center' }); B.text('upwash', 0.65, -0.45, { color: 'green', size: 10.5, align: 'center' });
          const py = clamp(probe.x, -0.78, 0.78); probe.set(py, interpArr(prof.ys, prof.deg, py));
          C.hline(0, { color: 'grid' });
          C.fn((y) => Math.abs(y) <= 0.5 ? cur.Gf(2 * y) : NaN, { domain: [-0.5, 0.5], color: 'accent', width: 2.4, fill: true, n: 200 });
          cur.yc = yc; cur.zc = zc;
        }, { period: 12, still: 10 });
        v.legend([['accent', 'trailing sheet / vortex strength'], ['muted', 'smoke tracers'], ['green', 'centroid of each half-sheet', { dot: true }], ['orange', 'elliptic: $C_L/\\pi AR$', { dash: true }]]);
        v.readout(() => {
          const AR = arS.value, CL = clS.value, alI = CL / (Math.PI * AR) / DEG, kind = kindS.value;
          const wp = interpArr(prof.ys, prof.deg, probe.x);
          return `Distance downstream $x/b=${fx(fr / cur.steps * cur.X, 1)}$: centroids of the two half-sheets are $${fx(2 * cur.yc, 3)}\\,b$ apart${kind === 'ell' ? ` (theory for elliptic loading: $\\pi/4=${fx(Math.PI / 4, 3)}$; it must not change with $x$)` : ' (rectangular loading: sheet impulse conserved, the spacing is a little larger than $\\pi b/4$)'}; they have sunk $${fx(-cur.zc, 3)}\\,b$.\n`
            + `Downwash at the probe $y/b=${fx(probe.x, 2)}$: $\\alpha_i=${fx(wp, 2)}^\\circ$${Math.abs(probe.x) > 0.5 ? ' (negative: the air rises outside the wing)' : ''}${kind === 'ell' ? `; at the root $C_L/\\pi AR=${fx(alI, 2)}^\\circ$, the same everywhere on the span` : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Induced drag and aspect ratio',
      statement: String.raw`The **aspect ratio** of a wing of span $b$ and planform area $S$ is $AR=b^2/S$. The downwash of the trailing vortices tilts the local lift vector backwards by the induced angle $\alpha_i$, so a component $D_i=L\,\alpha_i$ of the lift lies along the flight direction: this is the **induced drag**. In coefficient form
$$C_{D,i}=\frac{C_L^2}{\pi\,e\,AR},\qquad \alpha_i=\frac{C_{D,i}}{C_L}=\frac{C_L}{\pi\,e\,AR},$$
where $e\le1$ is the **span efficiency factor** of the planform and loading ($e=1$ for elliptic loading, 3.3). At fixed lift and fixed area, induced drag therefore falls as $1/AR$: a longer, narrower wing wastes less energy in its wake. The same tilt makes the lift-curve slope of a wing smaller than the section value, $a\approx a_0/(1+a_0/\pi e AR)$.`,
      idea: String.raw`The downwash $w$ from 3.1 means the wing sees the free stream rotated by $\alpha_i=w/V_\infty$, and the force perpendicular to this local flow (Kutta–Joukowski) tilts back by the same angle. For elliptic loading $w=\Gamma_0/2b$ and $L=\rho V\Gamma_0\pi b/4$, which together give $C_{D,i}=C_L^2/\pi AR$. Other loadings have the same form with $e<1$ (3.3). The $1/AR$ law follows because, at fixed lift, a wider wing moves the same momentum downwards by accelerating a larger mass of air by a smaller amount, and the kinetic energy left behind per unit time scales as the square of that speed times the mass flow.`,
      caption: String.raw`Choose a planform and drag the gold handle along the curve (or use the slider) to change the aspect ratio at fixed area and fixed $C_L$. The curve on the right is on logarithmic axes: the dashed line is $C_L^2/\pi AR$ ($e=1$), the solid curve is the induced drag of the chosen planform from Glauert's lifting-line solution, whose gap to the dashed line is $1/e$. In the middle, the lift vector tilts back by $\alpha_i$ (drawn six times larger than it is).`,
      deps: ['aero-3.1', 'fluid-5.8'],
      refs: ['Anderson ch. 5'],
      tags: ['induced drag', 'aspect ratio'],
      scope: String.raw`Unswept wings of moderate to high aspect ratio in incompressible flow below stall, in the lifting-line approximation (section lift slope $2\pi$). The values of $e$ are the lifting-line ones; for low aspect ratios, sweep or strong twist use a lifting surface (3.4). Real aircraft $e$ (often called Oswald's factor) also absorbs drag that varies with $C_L^2$ for other reasons.`,
      credit: 'Prandtl, lifting-line theory, 1918–1919',
      viz(v) {
        const planS = v.select('planform', [{ value: 'ellipse', label: 'elliptic' }, { value: 0.4, label: 'tapered ($\\lambda=0.4$)' }, { value: 1, label: 'rectangular' }], 1);
        const arS = v.slider('aspect ratio AR (area fixed, $S=1$)', 2, 30, 8, { step: 0.1 });
        const clS = v.slider('lift coefficient $C_L$', 0.2, 1.4, 0.8, { step: 0.05 });
        const A = v.stage({ x: [-2.6, 2.6], y: [-1.0, 0.7], equal: true, axes: false, height: 190, full: true, title: 'the wing at fixed area' });
        const B = v.stage({ x: [-0.15, 1.15], y: [-0.2, 0.9], equal: true, axes: false, height: 280, minWidth: 260, title: 'lift tilted back by $\\alpha_i$' });
        const C = v.stage({ x: [2, 30], y: [2e-4, 0.5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 280, minWidth: 300, xlabel: 'aspect ratio AR', ylabel: '$C_{D,i}$', title: 'induced drag coefficient at fixed $C_L$' });
        const cdi = (AR) => { const lam = planS.value; return clS.value ** 2 / (Math.PI * eOfAR(lam, AR).e * AR); };
        const hd = C.handle(8, 0.01, { color: 'gold', r: 8, constrain: (x) => { const a = clamp(x, 2, 30); return [a, cdi(a)]; } });
        let sync = false; hd.onDrag = () => { if (sync) return; sync = true; arS.set(Math.round(hd.x * 10) / 10); sync = false; };
        let st = {};
        v.render(() => {
          const lam = planS.value, AR = arS.value, CL = clS.value, b = Math.sqrt(AR), ce = eOfAR(lam, AR), ch = chordOf(AR, lam);
          // planform, quarter-chord line at y = 0, flow downwards
          const up = [], lo = [];
          for (let k = 0; k <= 80; k++) { const eta = -1 + k / 40 * (k > 40 ? 1 : 1); const e2 = -1 + 2 * k / 80, c = b * ch(e2); up.push([e2 * b / 2, 0.25 * c]); lo.push([e2 * b / 2, -0.75 * c]); }
          for (const [a2, nm] of [[4, 'AR 4'], [16, 'AR 16']]) { const b2 = Math.sqrt(a2), c2 = chordOf(a2, lam), g = []; for (let k = 0; k <= 40; k++) { const e2 = -1 + 2 * k / 40; g.push([e2 * b2 / 2, 0.25 * b2 * c2(e2)]); } for (let k = 40; k >= 0; k--) { const e2 = -1 + 2 * k / 40; g.push([e2 * b2 / 2, -0.75 * b2 * c2(e2)]); } A.path(g, { color: 'faint', dash: true, close: true }); A.text(nm, b2 / 2 + 0.05, 0.1, { color: 'faint', size: 10.5, align: 'left' }); }
          A.poly([...up, ...lo.slice().reverse()], { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          A.measure(-b / 2, 0.55, b / 2, 0.55, `b = ${fx(b, 2)}`);
          A.text(`mean chord S/b = ${fx(1 / b, 2)}`, 0, -0.9, { color: 'muted', size: 11, align: 'center' });
          // force triangle
          const aI = CL / (Math.PI * ce.e * AR), phi = Math.min(aI * 6, 1.0), Lm = 0.62;
          B.arrow(-0.12, 0, 0.5, 0, { color: 'faint', width: 1.6, head: 7 }); B.tex(String.raw`V_\infty`, 0.55, -0.07, { color: 'muted', size: 14 });
          B.arrow(0, 0, 0.5 * Math.cos(phi), -0.5 * Math.sin(phi), { color: 'gold', width: 1.6, head: 7 });
          B.tex(String.raw`V_\infty+w`, 0.5 * Math.cos(phi) + 0.03, -0.5 * Math.sin(phi) - 0.07, { color: 'gold', size: 13 });
          B.arrow(0, 0, -Lm * Math.sin(phi), Lm * Math.cos(phi), { color: 'accent', width: 2.4, head: 8 });
          B.tex(String.raw`L'`, -Lm * Math.sin(phi) - 0.09, Lm * Math.cos(phi) * 0.92, { color: 'accent', size: 15 });
          B.arrow(0, 0, 0, Lm * Math.cos(phi), { color: 'green', width: 1.8, head: 7, dash: true });
          B.tex(String.raw`L`, 0.05, Lm * Math.cos(phi) * 0.8, { color: 'green', size: 15 });
          B.arrow(0, 0, -Lm * Math.sin(phi), 0, { color: 'red', width: 2.4, head: 8 });
          B.tex(String.raw`D_i`, -Lm * Math.sin(phi) * 0.5, -0.08, { color: 'red', size: 15 });
          B.text('lift drawn ⟂ to the local flow', 0.5, 0.82, { color: 'muted', size: 10.5, align: 'center' });
          // curves
          C.fn((a) => CL * CL / (Math.PI * a), { color: 'faint', dash: true, width: 1.6, domain: [2, 30] });
          C.fn(cdi, { color: 'accent', width: 2.6, domain: [2, 30] });
          sync = true; hd.set(AR, cdi(AR)); sync = false;
          C.dot(AR, CL * CL / (Math.PI * AR), { r: 3.5, color: 'muted' });
          st = { AR, b, e: ce.e, a: ce.a, CDi: cdi(AR), aI, CL };
        });
        v.legend([['faint', '$e=1$: $C_L^2/\\pi AR$', { dash: true }], ['accent', 'lifting-line solution of the chosen planform'], ['gold', 'local relative wind']]);
        v.readout(() => {
          const alpha = st.CL / st.a;
          return `$AR=${fx(st.AR, 1)}$, $b=${fx(st.b, 2)}\\sqrt S$: $e=${fx(st.e, 3)}$, $C_{D,i}=C_L^2/\\pi e AR=${fx(st.CDi, 4)}$, induced angle $\\alpha_i=C_{D,i}/C_L=${fx(st.aI / DEG, 2)}^\\circ$ (elliptic $C_L/\\pi AR$: $${fx(st.CL / (Math.PI * st.AR) / DEG, 2)}^\\circ$).\n`
            + `The wing needs $\\alpha=C_L/a=${fx(alpha / DEG, 2)}^\\circ$ with $a=${fx(st.a, 2)}$ per radian (section: $2\\pi$, $\\alpha=${fx(st.CL / (2 * Math.PI) / DEG, 2)}^\\circ$). Doubling the span at fixed area and lift cuts $C_{D,i}$ by 4.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Elliptic loading minimises induced drag',
      statement: String.raw`Consider a planar wing of span $b$ in incompressible flow at speed $V$, whose circulation $\Gamma(y)$ vanishes at the tips, with a straight trailing wake. Among all loadings that carry a given lift $L=\rho V\int\Gamma\,\mathrm{d}y$, the induced drag
$$D_i=\rho\int_{-b/2}^{b/2}\Gamma(y)\,w(y)\,\mathrm{d}y$$
is smallest for the **elliptic loading** $\Gamma=\Gamma_0\sqrt{1-(2y/b)^2}$, and only for it. Then $w=\Gamma_0/2b$ is constant on the span and
$$D_{i,\min}=\frac{L^2}{\tfrac12\rho V^2\,\pi b^2},\qquad C_{D,i}=\frac{C_L^2}{\pi\,AR}.$$
With the Fourier form $\Gamma=2bV\sum_n A_n\sin n\theta$ ($y=-\tfrac b2\cos\theta$) one finds $L\propto A_1$ and $C_{D,i}=\pi AR\sum nA_n^2$, so any other shape has $e=A_1^2/\sum nA_n^2<1$.`,
      idea: String.raw`Write $\Gamma$ as a sine series in $\theta$. The downwash of the term $\sin n\theta$ is $\tfrac{nV A_n\sin n\theta}{\sin\theta}$ (Glauert's integral), and the sines are orthogonal, so the drag integral splits into a sum of non-negative terms $\propto nA_n^2$ — while the lift involves $A_1$ alone (a variational problem with one constraint, which is what a Lagrange multiplier would also give, mech-5.10). Fixing the lift fixes $A_1$, and the drag $\propto A_1^2+3A_3^2+5A_5^2+\dots$ is least when all higher harmonics vanish: $\Gamma\propto\sin\theta$, an ellipse.`,
      caption: String.raw`Draw a loading with the mouse on the upper left panel (the dashed green ellipse carries exactly the same lift), or choose a preset, or add a third harmonic with the slider. The bar chart shows each harmonic's excess drag $nA_n^2/A_1^2$ (they add up to $1/e-1$) and the right-hand panel shows the downwash along the span, which is constant only for the ellipse. The readout checks the Fourier result against a direct sum over a 160-panel vortex sheet.`,
      deps: ['aero-3.2', 'mech-5.10'],
      refs: ['Anderson ch. 5'],
      tags: ['induced drag', 'optimisation', 'lifting line'],
      scope: String.raw`Planar (non-lifting-out-of-plane) wings with a flat trailing wake, incompressible flow and a given span; with winglets or non-planar systems the minimum is smaller (a non-planar theorem of Munk's) and the loading is not elliptic. The tips must carry no load ($\Gamma\to0$): a loading that stays finite at the tips has infinite induced drag in this model.`,
      credit: 'Prandtl, 1918–1919; general minimum-drag proof by Munk (NACA Report 121, 1921, from his 1919 Göttingen dissertation)',
      viz(v) {
        const preset = v.select('preset', [{ value: 'ell', label: 'ellipse' }, { value: 'par', label: 'parabola' }, { value: 'tri', label: 'triangle' }, { value: 'flat', label: 'flat top' }, { value: 'rect', label: 'rectangular wing (lifting line)' }], 'rect',
          { onChange: () => { nodes = presetNodes[preset.value](); epsS.set(0); } });
        const epsS = v.slider('add $\\varepsilon\\sin3\\theta$ (units of $A_1$)', -0.3, 0.3, 0, { step: 0.01 });
        const rnd = v.rng(7);
        v.button('random shape', () => { const raw = Array.from({ length: NODES }, (_, i) => Math.sin(nodeTheta(i)) * (0.35 + 0.9 * rnd())); raw[0] = 0; nodes = raw; epsS.set(0); });
        let nodes = presetNodes.rect();
        const A = v.stage({ x: [-1.15, 1.15], y: [0, 1.6], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: '$2y/b$', ylabel: '$\\Gamma$ (arbitrary units)', title: 'draw the spanwise loading' });
        const B = v.stage({ x: [2, 22], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 220, xlabel: 'harmonic $n$', ylabel: '$nA_n^2/A_1^2$', title: 'excess induced drag by harmonic' });
        const C = v.stage({ x: [-1, 1], y: [0, 3], axes: 'box', gutter: true, height: 300, minWidth: 220, xlabel: '$2y/b$', ylabel: '$w/w_{\\mathrm{ellipse}}$', title: 'downwash at the same lift' });
        let last = -1;
        A.onDrag((x, y, phase) => {
          if (Math.abs(x) > 1) return;
          const idx = Math.round(Math.acos(Math.min(1, Math.abs(x))) / (Math.PI / 2) * (NODES - 1)), val = clamp(y, 0, 1.6);
          if (phase === 'start') last = -1;
          if (idx > 0) {
            if (last >= 0 && last !== idx) { const lo = Math.min(last, idx), hi = Math.max(last, idx), y0 = nodes[last]; for (let k = lo; k <= hi; k++) if (k > 0) nodes[k] = y0 + (val - y0) * (k - last) / (idx - last); }
            nodes[idx] = val; last = idx; epsS.set(epsS.value);
          }
          v.invalidate();
        });
        let res = null, ell = null;
        v.render(() => {
          const raw = nodeFn(nodes), a1 = loadingAnalysis(raw, 41, 160).A1;
          const G = nodeFn(nodes, epsS.value, a1), an = loadingAnalysis(G, 41, 160);
          res = an; ell = a1;
          const GellRef = (eta) => a1 * Math.sqrt(Math.max(0, 1 - eta * eta));
          A.fn((x) => (Math.abs(x) <= 1 ? G(x) : NaN), { domain: [-1, 1], n: 240, color: 'accent', width: 2.6, fill: true });
          A.fn((x) => (Math.abs(x) <= 1 ? GellRef(x) : NaN), { domain: [-1, 1], n: 200, color: 'green', width: 2, dash: true });
          A.text('drag here to reshape', 0, 1.5, { color: 'faint', size: 11, align: 'center' });
          const ex = an.an.map((q, k) => (k === 0 ? 0 : (2 * k + 1) * q * q));
          B.bars(ex.slice(1, 11), { x0: 3, dx: 2, color: 'red' });
          B.setView([2, 22], [0, Math.max(0.05, Math.max(...ex) * 1.2)]);
          C.hline(1, { color: 'green', dash: true, width: 1.8 });
          C.fn((eta) => { if (Math.abs(eta) >= 0.999) return NaN; const th = Math.acos(-eta); let s = 0; an.an.forEach((q, k) => { s += (2 * k + 1) * q * Math.sin((2 * k + 1) * th); }); return s / Math.sin(th); }, { domain: [-0.998, 0.998], n: 300, color: 'accent', width: 2.4 });
        });
        v.legend([['accent', 'your loading'], ['green', 'elliptic loading, same lift', { dash: true }], ['red', 'excess drag by harmonic']]);
        v.readout(() => {
          const e = res.eFour, ex = res.an.reduce((a, q, k) => a + (k ? (2 * k + 1) * q * q : 0), 0);
          return `Fourier: $e=A_1^2/\\sum nA_n^2=${fx(e, 4)}$, so $C_{D,i}=${fx(1 / e, 4)}\\times C_L^2/\\pi AR$ (the ellipse gives exactly 1). Direct vortex-sheet sum $D_i=\\rho\\sum\\Gamma w\\,\\Delta y$: $e=${fx(res.eSheet, 3)}$ (agrees to the mesh error).\n`
            + `Excess over the ellipse: $\\sum_{n\\ge3}nA_n^2/A_1^2=${fx(ex, 4)}$ (equal to $1/e-1=${fx(1 / e - 1, 4)}$). With only $\\varepsilon\\sin3\\theta$ added to the ellipse the excess is exactly $3\\varepsilon^2$ ($=${fx(3 * epsS.value ** 2, 4)}$ now).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Method',
      name: 'Vortex-lattice method',
      statement: String.raw`The **vortex-lattice method** models a thin lifting surface of any planform as a lattice of $N$ panels, each carrying a **horseshoe vortex** of unknown strength $\Gamma_j$: a bound segment on the panel's quarter-chord line and two trailing legs running downstream. The velocity induced at a point by a straight vortex filament is given in closed form (Biot–Savart), so the condition that the flow be tangent to the surface at a **control point** at the three-quarter chord of each panel,
$$\sum_{j=1}^N\mathbf{v}_{ij}\!\cdot\!\mathbf n_i\,\Gamma_j=-\mathbf V_\infty\!\cdot\mathbf n_i ,\qquad i=1,\dots,N,$$
is a linear system for the strengths. Lift follows from the Kutta–Joukowski law applied to the bound segments, and induced drag from the trailing wake in the Trefftz plane. Unlike the lifting line it accounts for finite chord, sweep and taper.`,
      idea: String.raw`Each horseshoe is an exact solution of the potential-flow equations, so any superposition is too; only the boundary condition needs solving for. Putting the bound vortex at the quarter chord and the control point at the three-quarter chord reproduces the thin-airfoil result $c_l=2\pi\alpha$ for a single chordwise panel, and the lattice generalises it to a sheet. This is the Biot–Savart machinery of 3.1 summed over a lattice, with the panel technique of 2.5 turned from two dimensions into three.`,
      caption: String.raw`Edit the planform (aspect ratio, taper, leading-edge sweep, washout) and the lattice is re-solved at once; panel shading is the circulation. The middle graph is the spanwise loading against the ellipse (green) and, for the straight wing with the same taper, Prandtl's lifting-line solution (grey): sweep moves load outboard. The right graph is the local section lift coefficient relative to the wing's $C_L$, the quantity that decides where the wing stalls first. Change the mesh to see the solution converge.`,
      deps: ['aero-3.1', 'aero-2.5'],
      refs: ['Anderson ch. 5'],
      tags: ['vortex lattice', 'numerical method', 'wing'],
      scope: String.raw`Incompressible, inviscid, small angles; flat, thin wing (no thickness, camber or dihedral) with a flat wake aligned with the body axis. No stall, no leading-edge vortices (important for delta wings), no compressibility correction. The induced drag comes from the Fourier series of the computed spanwise loading (so $e\\le1$ always); the lift is converged at about 1 % at the default mesh.`,
      credit: 'Falkner, ARC R&M 1910, 1943 (first lattice of horseshoe vortices)',
      viz(v) {
        const arS = v.slider('aspect ratio AR', 3, 14, 8, { step: 0.5 });
        const lamS = v.slider('taper ratio $\\lambda$ (tip/root chord)', 0.1, 1, 0.5, { step: 0.05 });
        const swS = v.slider('leading-edge sweep $\\Lambda$ (°)', -10, 55, 25, { step: 1 });
        const twS = v.slider('washout (tip incidence relative to root, °)', -8, 0, 0, { step: 0.5 });
        const alS = v.slider('angle of attack $\\alpha$ (°)', 1, 10, 4, { step: 0.5 });
        const meshS = v.select('mesh', [{ value: 'coarse', label: '2×8' }, { value: 'med', label: '4×20' }, { value: 'fine', label: '6×40' }], 'med');
        const A = v.stage({ x: [-0.62, 0.62], y: [-0.7, 0.1], equal: true, axes: false, height: 260, full: true, title: 'the lattice: shading = panel circulation' });
        const B = v.stage({ x: [-1, 1], y: [0, 1.5], axes: 'box', gutter: true, height: 250, minWidth: 290, xlabel: '$2y/b$', ylabel: '$\\Gamma/\\Gamma_{\\mathrm{ellipse}}$', title: 'spanwise loading at equal lift' });
        const C = v.stage({ x: [-1, 1], y: [0, 2.2], axes: 'box', gutter: true, height: 250, minWidth: 290, xlabel: '$2y/b$', ylabel: '$c_l/C_L$', title: 'local lift coefficient' });
        let st = null;
        v.render(() => {
          const AR = arS.value, lam = lamS.value, sw = swS.value, al = alS.value * DEG, tw = twS.value * DEG, m = MESH[meshS.value];
          const s = vlmX({ AR, lam, sweep: sw, alpha: al, twist: tw, ...m });
          const g = glauert({ AR, lam, alpha: al, twist: tw, N: 16 });
          const Gmax = Math.max(...s.Gam);
          const ymax = Math.abs(0.5) * Math.tan(sw * DEG) + s.cr * (sw < 0 ? 0 : 1) + 0.05, ymin = Math.min(0, 0.5 * Math.tan(sw * DEG));
          A.setView([-0.62, 0.62], [-(Math.max(ymax, s.xle(0.5) + s.chord(0.5) + 0.05, s.cr + 0.05)), 0.1 - ymin]);
          s.pan.forEach((p, k) => { const q = p.corners.map((c) => [c[1], -c[0]]); A.poly(q, { fill: 'accent', fillAlpha: 0.06 + 0.72 * clamp(s.Gam[k] / Gmax, 0, 1), color: 'accent', width: 0.7 }); });
          const xs = []; for (let k = 0; k <= 60; k++) { const y = -0.5 + k / 60; xs.push([y, -s.xle(y)]); }
          A.path(xs, { color: 'ink', width: 1.8 });
          const tr = []; for (let k = 0; k <= 60; k++) { const y = -0.5 + k / 60; tr.push([y, -(s.xle(y) + s.chord(y))]); }
          A.path(tr, { color: 'ink', width: 1.8 });
          A.line(-0.5, -s.xle(-0.5), -0.5, -(s.xle(-0.5) + s.chord(-0.5)), { color: 'ink', width: 1.8 }); A.line(0.5, -s.xle(0.5), 0.5, -(s.xle(0.5) + s.chord(0.5)), { color: 'ink', width: 1.8 });
          A.arrow(-0.58, 0.07, -0.58, -0.1, { color: 'gold', width: 2, head: 7 }); A.tex(String.raw`V_\infty`, -0.52, -0.02, { color: 'gold', size: 13 });
          // loading
          const L = s.Gs.reduce((a, q, j) => a + q * s.dy[j], 0), G0 = 4 * L / Math.PI;
          B.hline(1, { color: 'faint' });
          B.fn((x) => Math.sqrt(Math.max(0, 1 - x * x)), { domain: [-1, 1], color: 'green', dash: true, width: 1.8 });
          const lg = (eta) => g.G(Math.acos(-clamp(eta, -1, 1))) / (2 * g.A[0]);
          B.fn((x) => (Math.abs(x) < 0.998 ? lg(x) : NaN), { domain: [-0.998, 0.998], color: 'muted', width: 1.8, n: 160 });
          const pts = s.mid.map((y, j) => [2 * y, s.Gs[j] / G0]);
          B.path(pts, { color: 'accent', width: 2.6 });
          const cl = s.mid.map((y, j) => [2 * y, 2 * s.Gs[j] / s.chord(y) / s.CL]);
          C.hline(1, { color: 'faint' });
          const cg = (eta) => 2 * g.G(Math.acos(-clamp(eta, -1, 1))) / (chordOf(AR, lam)(eta)) / g.CL;
          C.fn((x) => (Math.abs(x) < 0.99 ? cg(x) : NaN), { domain: [-0.99, 0.99], color: 'muted', width: 1.8, n: 160 });
          C.path(cl, { color: 'accent', width: 2.6 });
          st = { s, g, AR, lam, sw, al, tipcl: cl.filter((q) => Math.abs(q[0]) > 0.8).reduce((a, q) => Math.max(a, q[1]), 0) };
        });
        v.legend([['accent', 'vortex lattice'], ['muted', 'lifting line (same AR, taper, washout; no sweep)'], ['green', 'elliptic loading', { dash: true }]]);
        v.readout(() => {
          const { s, g, AR, al } = st, a = s.CL / al;
          return `Lattice ${s.pan.length} panels: $C_L=${fx(s.CL, 3)}$ (slope $${fx(a, 2)}$ per rad), $C_{D,i}=${fx(s.CDi, 4)}$, $e=C_L^2/\\pi AR\\,C_{D,i}=${fx(s.e, 3)}$. Lifting line, same planform without sweep: $C_L=${fx(g.CL, 3)}$, $e=${fx(g.e, 3)}$.\n`
            + `Largest local lift coefficient in the outer 20 % of the span: $${fx(st.tipcl, 2)}\\times C_L$ — ${st.tipcl > 1.25 ? 'the tips run close to stall first' : 'the loading is gentle at the tips'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Model',
      name: 'The drag polar',
      statement: String.raw`For a whole aircraft or wing below stall and at low Mach number, the drag coefficient is well described by the **parabolic drag polar**
$$C_D=C_{D,0}+K\,C_L^2,\qquad K=\frac{1}{\pi\,e\,AR},$$
where $C_{D,0}$ is the **parasite drag** (friction and pressure drag at zero lift, 2.7) and $KC_L^2$ is the **lift-dependent** (induced) drag of 3.2. The graph of $C_L$ against $C_D$ is the polar. The ratio $L/D=C_L/C_D$ is the slope of the line from the origin to the point on the polar, so it is greatest where this line is tangent to the curve; for the parabola that point is $C_L^*=\sqrt{C_{D,0}/K}$, with $(L/D)_{\max}=1/(2\sqrt{KC_{D,0}})$.`,
      idea: String.raw`Parasite drag changes little with incidence in the attached-flow range, and induced drag is $C_L^2/\pi eAR$ (3.2), so their sum is a parabola in $C_L$. Maximising $C_L/C_D$ means $\mathrm d(C_D/C_L)/\mathrm dC_L=0$, i.e. $C_D=C_L\,\mathrm dC_D/\mathrm dC_L$ — the tangent condition; for the parabola it reads $C_{D,0}+KC_L^2=2KC_L^2$, so $KC_L^2=C_{D,0}$ at the optimum (3.6).`,
      caption: String.raw`Drag the gold handle up and down the polar: the line from the origin through it has slope $L/D$ (green is the steepest tangent). The shading splits the drag into parasite (orange) and induced (purple). Change aspect ratio, efficiency and parasite drag, or switch to a polar built from measured section drag: the NACA 0012 data of chapter 2 plus induced drag. The dashed parabola is its best fit — the parabola is an excellent model but not exact.`,
      deps: ['aero-3.2', 'aero-2.7'],
      refs: ['Anderson ch. 6'],
      tags: ['drag polar', 'performance'],
      scope: String.raw`Subsonic flight below the drag-divergence Mach number, at $C_L$ below stall, for sections whose zero-lift angle is near zero. A cambered wing is better fitted by $C_D=C_{D,0}+K(C_L-C_{L,m})^2$ (see 3.6). In the section-data mode the section drag is read at $c_l=C_L$ (a simplification), the NACA 0012 values are read off a figure (about $\pm0.001$ in $c_d$), and "extra parasite drag" is a free parameter standing for fuselage, tail and interference.`,
      credit: 'NACA 0012 section data: Critzos, Heyson & Boswinkle, NACA TN 3361, 1955',
      viz(v) {
        const mode = v.select('parasite drag from', [{ value: 'par', label: 'a constant $C_{D,0}$' }, { value: 'sec', label: 'NACA 0012 section data + extra' }], 'par', { onChange: () => { cd0S.el.hidden = mode.value !== 'par'; dxS.el.hidden = mode.value !== 'sec'; } });
        const cd0S = v.slider('parasite drag $C_{D,0}$', 0.008, 0.05, 0.02, { step: 0.001 });
        const dxS = v.slider('extra parasite drag (fuselage, tail)', 0, 0.03, 0.012, { step: 0.001 });
        dxS.el.hidden = true;
        const arS = v.slider('aspect ratio AR', 4, 20, 8, { step: 0.5 });
        const eS = v.slider('span efficiency $e$', 0.6, 1, 0.85, { step: 0.01 });
        const A = v.stage({ x: [0, 0.1], y: [0, 1.5], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: '$C_D$', ylabel: '$C_L$', title: 'the polar' });
        const B = v.stage({ x: [0, 1.5], y: [0, 30], axes: 'box', gutter: true, height: 340, minWidth: 280, xlabel: '$C_L$', ylabel: '$L/D$', title: 'lift-to-drag ratio' });
        let clH = 0.5, info = {};
        const parFn = () => {
          const K = 1 / (Math.PI * eS.value * arS.value);
          if (mode.value === 'par') { const c0 = cd0S.value; return { K, par: () => c0, clMax: 1.5 }; }
          const dx = dxS.value; return { K, par: (cl) => cdTab(CRITZOS_18, alphaFromCl(Math.min(cl, CL_SEC_MAX))) + dx, clMax: CL_SEC_MAX };
        };
        const hd = A.handle(0.03, 0.5, { color: 'gold', r: 8, constrain: (x, y) => { const p = parFn(), c = clamp(y, 0.02, p.clMax); return [p.par(c) + p.K * c * c, c]; } });
        hd.onDrag = () => { clH = hd.y; };
        v.render(() => {
          const { K, par, clMax } = parFn(), cd = (c) => par(c) + K * c * c, cl = clamp(clH, 0.02, clMax);
          const grid = []; for (let k = 0; k <= 120; k++) grid.push(0.01 + (clMax - 0.01) * k / 120);
          A.poly([[0, 0.01], ...grid.map((c) => [par(c), c]), [0, clMax]], { fill: 'orange', fillAlpha: 0.2, stroke: false });
          A.poly([...grid.map((c) => [par(c), c]), ...grid.slice().reverse().map((c) => [cd(c), c])], { fill: 'purple', fillAlpha: 0.2, stroke: false });
          A.path(grid.map((c) => [cd(c), c]), { color: 'accent', width: 2.6 });
          // fit parabola in section mode
          let fit = null;
          if (mode.value === 'sec') { const xs = [], ys = []; for (let c = 0.05; c <= 1.2; c += 0.01) { xs.push(c * c); ys.push(cd(c)); } fit = v.M.linreg(xs, ys); A.path(grid.map((c) => [fit.intercept + fit.slope * c * c, c]), { color: 'muted', dash: true, width: 1.6 }); }
          let best = { r: 0, c: 0 }; for (const c of grid) { const r = c / cd(c); if (r > best.r) best = { r, c }; }
          const xb = cd(best.c); A.line(0, 0, xb * 1.55, best.c * 1.55, { color: 'green', width: 1.8 }); A.dot(xb, best.c, { r: 5, color: 'green', label: `tangent: L/D = ${fx(best.r, 1)}`, labelPos: 'se' });
          const x0 = cd(cl); A.line(0, 0, x0 * 1.3, cl * 1.3, { color: 'gold', width: 1.8, dash: true });
          hd.set(x0, cl);
          if (mode.value === 'sec') A.hline(CL_SEC_MAX, { color: 'red', dash: true, width: 1.2 });
          B.fn((c) => c / cd(c), { domain: [0.01, clMax], color: 'accent', width: 2.6 });
          B.dot(best.c, best.r, { r: 5, color: 'green' }); B.dot(cl, cl / cd(cl), { r: 5, color: 'gold' });
          B.vline(best.c, { color: 'green', dash: true, width: 1.2 });
          info = { K, cl, cd: cd(cl), par: par(cl), best, fit, clMax };
        });
        v.legend([['orange', 'parasite drag'], ['purple', 'induced drag $KC_L^2$'], ['accent', 'polar'], ['green', 'steepest tangent'], ['gold', 'line to the handle', { dash: true }]]);
        v.readout(() => {
          const { K, cl, cd, par, best, fit } = info;
          let s = `$C_L=${fx(cl, 2)}$, $C_D=${fx(cd, 4)}=${fx(par, 4)}+${fx(K * cl * cl, 4)}$ (parasite + induced), $L/D=${fx(cl / cd, 1)}$. Best: $(L/D)_{\\max}=${fx(best.r, 1)}$ at $C_L=${fx(best.c, 2)}$; the formula $1/(2\\sqrt{KC_{D,0}})$ ${mode.value === 'par' ? `gives $${fx(1 / (2 * Math.sqrt(K * cd0S.value)), 1)}$ at $C_L^*=${fx(Math.sqrt(cd0S.value / K), 2)}$` : 'does not apply: the parasite drag varies with $C_L$'}.`;
          if (fit) s += `\nBest-fit parabola $C_D=${fx(fit.intercept, 4)}+${fx(fit.slope, 4)}\\,C_L^2$ over $C_L\\le1.2$ (pure induced drag would be $K=${fx(K, 4)}$): the fitted slope is larger because section drag also rises with $C_L$; $(L/D)_{\\max}$ of the fit is $${fx(1 / (2 * Math.sqrt(fit.slope * fit.intercept)), 1)}$.`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'Maximum L/D: induced drag equals parasite drag',
      statement: String.raw`For an aircraft of weight $W$ with the parabolic polar $C_D=C_{D,0}+KC_L^2$ in steady level flight at speed $V$ and air density $\rho$, the parasite and induced drags are
$$D_p=\tfrac12\rho V^2SC_{D,0},\qquad D_i=\frac{2KW^2}{\rho V^2S},$$
the first rising as $V^2$ and the second falling as $V^{-2}$. Their sum is least, and the lift-to-drag ratio greatest, at the speed
$$V_{md}=\sqrt{\frac{2W}{\rho S}}\Big(\frac{K}{C_{D,0}}\Big)^{1/4},$$
where $D_i=D_p$ (that is, $KC_L^2=C_{D,0}$). There $D_{\min}=2W\sqrt{KC_{D,0}}$ and $(L/D)_{\max}=1/(2\sqrt{KC_{D,0}})$. The speed depends on the aircraft only through $W/S$ and $K/C_{D,0}$, and rises with altitude as $1/\sqrt\rho$.`,
      idea: String.raw`With $C_L=2W/\rho V^2S$ in level flight, $D=D_p+D_i=A V^2+B V^{-2}$ with $A=\tfrac12\rho SC_{D,0}$ and $B=2KW^2/\rho S$. Setting $\mathrm dD/\mathrm dV=2AV-2BV^{-3}=0$ gives $AV^2=BV^{-2}$, which says $D_p=D_i$; the arithmetic–geometric mean inequality $AV^2+BV^{-2}\ge2\sqrt{AB}$ confirms it is a minimum. It is the same tangent condition as in 3.5, read as a function of speed rather than of lift coefficient.`,
      caption: String.raw`Drag per unit weight, $D/W=1/(L/D)$, against speed: parasite (orange), induced (purple) and total (blue). Drag the gold handle along the total curve, or change wing loading, altitude, aspect ratio and parasite drag. The green point is the numerical minimum, and the readout compares it with the formula. Then break the hypothesis: add a camber offset $C_{L,m}$ and the induced term becomes $K(C_L-C_{L,m})^2$; the two drag curves no longer cross at the minimum. The red region is below the stall speed.`,
      deps: ['aero-3.5'],
      refs: ['Anderson ch. 6'],
      tags: ['performance', 'drag', 'endurance'],
      scope: String.raw`Steady level flight, constant weight, parabolic polar, incompressible aerodynamics and speeds above stall. Maximum range of a jet and maximum endurance of a propeller aircraft are flown at the minimum-drag speed and at the minimum-power speed, which is lower, $V_{mp}=V_{md}/3^{1/4}$ (not computed here).`,
      credit: 'Standard parabolic-polar result, textbook performance analysis',
      viz(v) {
        const wsS = v.slider('wing loading $W/S$ (N/m²)', 300, 6000, 1000, { step: 10, log: true });
        const hS = v.slider('altitude (km)', 0, 12, 0, { step: 0.5 });
        const cd0S = v.slider('parasite drag $C_{D,0}$', 0.01, 0.06, 0.025, { step: 0.001 });
        const arS = v.slider('aspect ratio AR', 4, 20, 8, { step: 0.5 });
        const eS = v.slider('span efficiency $e$', 0.6, 1, 0.8, { step: 0.01 });
        const clmS = v.slider('camber offset $C_{L,m}$ (0 = the hypothesis)', 0, 0.6, 0, { step: 0.02 });
        const clxS = v.slider('maximum lift coefficient $C_{L,\\max}$', 1, 2.4, 1.5, { step: 0.05 });
        const A = v.stage({ x: [10, 100], y: [0, 0.3], axes: 'box', gutter: true, height: 330, minWidth: 340, xlabel: 'speed $V$ (m/s)', ylabel: '$D/W$', title: 'drag in level flight' });
        const B = v.stage({ x: [10, 100], y: [0, 25], axes: 'box', gutter: true, height: 330, minWidth: 280, xlabel: 'speed $V$ (m/s)', ylabel: '$L/D$', title: 'lift-to-drag ratio' });
        let Vh = 75, info = {};
        const hd = A.handle(75, 0.06, { color: 'gold', r: 8, constrain: (x) => { const V = clamp(x, A.bounds ? A.bounds.x0 : 10, 400); return [V, info.dw ? info.dw(V) : 0.06]; } });
        hd.onDrag = () => { Vh = hd.x; };
        v.render(() => {
          const ws = wsS.value, rho = atmo(hS.value * 1000).rho, K = 1 / (Math.PI * eS.value * arS.value), c0 = cd0S.value, m = clmS.value, clx = clxS.value;
          const clOf = (V) => 2 * ws / (rho * V * V), cdi = (cl) => K * (cl - m) ** 2;
          const dw = (V) => { const cl = clOf(V); return (c0 + cdi(cl)) / cl; };
          const Vs = Math.sqrt(2 * ws / (rho * clx)), clStar = Math.sqrt(c0 / K + m * m), Vmd = Math.sqrt(2 * ws / (rho * clStar));
          const V0 = 0.6 * Math.min(Vs, Vmd), V1 = 3 * Math.max(Vs, Vmd);
          let best = { V: 0, d: 1e9 }; for (let k = 0; k <= 1500; k++) { const V = Math.max(V0, Vs) + (V1 - Math.max(V0, Vs)) * k / 1500, d = dw(V); if (d < best.d) best = { V, d }; }
          const ymax = Math.max(4 * best.d, 0.05);
          A.setView([V0, V1], [0, ymax]); B.setView([V0, V1], [0, Math.max(1.15 / best.d, 5)]);
          A.vband(V0, Vs, { color: 'red', alpha: 0.08 }); B.vband(V0, Vs, { color: 'red', alpha: 0.08 });
          A.vline(Vs, { color: 'red', dash: true, width: 1.4 }); A.text('stall', Vs - 0.01 * (V1 - V0), ymax * 0.93, { color: 'red', size: 11, align: 'right' });
          A.fn((V) => c0 / clOf(V), { color: 'orange', width: 2.2, domain: [V0, V1] });
          A.fn((V) => cdi(clOf(V)) / clOf(V), { color: 'purple', width: 2.2, domain: [V0, V1] });
          A.fn(dw, { color: 'accent', width: 2.8, domain: [V0, V1] });
          A.dot(best.V, best.d, { r: 5.5, color: 'green', label: `min D: ${fx(best.V, 1)} m/s`, labelPos: 'n' });
          A.vline(best.V, { color: 'green', dash: true, width: 1.1 });
          B.fn((V) => 1 / dw(V), { color: 'accent', width: 2.8, domain: [V0, V1] }); B.dot(best.V, 1 / best.d, { r: 5.5, color: 'green' });
          const Vc = clamp(Vh, V0, V1); hd.set(Vc, dw(Vc)); B.dot(Vc, 1 / dw(Vc), { r: 5, color: 'gold' });
          info = { dw, ws, rho, K, c0, m, Vs, clStar, Vmd, best, Vc, clc: clOf(Vc), cdic: cdi(clOf(Vc)), clx };
        });
        v.legend([['orange', 'parasite $D_p/W$'], ['purple', 'induced $D_i/W$'], ['accent', 'total'], ['green', 'minimum']]);
        v.readout(() => {
          const { K, c0, m, Vmd, best, Vs, rho, Vc, clc, cdic, clStar } = info, Dp = c0 / clc, Di = cdic / clc;
          const clMin = 2 * info.ws / (rho * best.V ** 2), ratio = (K * (clMin - m) ** 2) / c0;
          return `$\\rho=${fx(rho, 3)}$ kg/m³, $C_L^*=\\sqrt{C_{D,0}/K+C_{L,m}^2}=${fx(clStar, 3)}$, $V_{md}=${fx(Vmd, 1)}$ m/s; stall speed $${fx(Vs, 1)}$ m/s. Numerical minimum of $D/W$: $${fx(best.d, 4)}$ at $V=${fx(best.V, 1)}$ m/s ($(L/D)_{\\max}=${fx(1 / best.d, 2)}$; formula for $C_{L,m}=0$: $${fx(1 / (2 * Math.sqrt(K * c0)), 2)}$).\n`
            + `At the numerical minimum, induced/parasite drag $=${fx(ratio, 3)}$ ${Math.abs(ratio - 1) < 0.01 ? '(equal, as the proposition says)' : '(not equal: the hypothesis $C_D=C_{D,0}+KC_L^2$ no longer holds)'}${best.V <= Vs * 1.0001 ? '; the minimum sits at the stall speed' : ''}. At the handle: $V=${fx(Vc, 1)}$ m/s, $D_p/W=${fx(Dp, 4)}$, $D_i/W=${fx(Di, 4)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Ground effect',
      statement: String.raw`A wing flying within about one span of the ground has lower induced drag, and more lift at a given angle of attack, than the same wing in free air. The ground is a streamline surface, so it can be replaced by an **image wing** at the mirror position with circulation of opposite sign. The image tip vortices lie below the real ones with opposite rotation and induce an upwash at the wing, which reduces the downwash and the induced angle of attack $\alpha_i$ (3.1). At equal lift,
$$\Phi\equiv\frac{C_{D,i}(h/b)}{C_{D,i}(\infty)}=\frac{C_{D,i}\ \text{near ground}}{C_{D,i}\ \text{free air}}<1,$$
with $\Phi\to1$ for $h\gtrsim b$ and a steep fall as the height $h$ above the ground falls below about $b/4$.`,
      idea: String.raw`This is the method of images (fluid-4.12) applied to the trailing vortex system of 3.1: a vortex at height $h$ over a rigid plane behaves like the pair formed with an opposite vortex at $-h$, which keeps the vertical velocity zero on the ground. The image trailing vortices, a distance $2h$ below the real ones, induce an upward velocity at the wing that grows as $h$ decreases, so the wing sees less downwash; the lift vector tilts back less, and for the same lift the induced drag falls. In the picture the loading of a rectangular wing is recomputed with the images included.`,
      caption: String.raw`Drag the wing (gold handle) toward the ground, or use the sliders. The left picture is the front view: the real tip vortices (blue, rotating as shown) and their opposite-signed images (grey) in the mirror image of the picture; the arrows are the cross-flow they induce, which is horizontal on the ground. The middle graph is the induced-drag ratio $\Phi$ against $h/b$ from the lifting-line calculation (blue) and a fit quoted in textbooks (dashed). The right graph shows the downwash angle along the span at the same lift, with and without the ground.`,
      deps: ['aero-3.1', 'fluid-4.12'],
      refs: ['Anderson ch. 6'],
      tags: ['ground effect', 'induced drag', 'images'],
      scope: String.raw`Lifting-line model of a rectangular wing at small angles: only the images of the trailing vortices are included (the image of the bound vortex, and the effect of the ground on the wing's thickness, are neglected), and the wake is flat. The dashed comparison is a published-style engineering fit whose coefficients were recalled, not re-derived; it is meant as a plausibility check only.`,
      credit: 'Image-vortex treatment of ground effect: Prandtl and Wieselsberger, early 1920s (summary in Mantle, Aeronautical Journal, 2016)',
      verify: true,
      viz(v) {
        const hS = v.slider('height of the wing over the ground $h/b$', 0.03, 1, 0.15, { step: 0.01, log: true });
        const arS = v.slider('aspect ratio AR (rectangular wing)', 4, 14, 8, { step: 0.5 });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.1, 1.1], equal: true, axes: false, height: 330, minWidth: 330, title: 'front view: wing, vortices and images' });
        const B = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: '$h/b$', ylabel: '$\\Phi=C_{D,i}/C_{D,i}(\\infty)$', title: 'induced drag at equal lift' });
        const C = v.stage({ x: [-0.8, 0.8], y: [0, 3], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: '$y/b$', ylabel: '$\\alpha_i$ (°) at $C_L=0.8$', title: 'downwash along the span' });
        const hd = A.handle(0, 0.15, { color: 'gold', r: 8, constrain: (x, y) => [0, clamp(y, 0.03, 1)] });
        let sync = false; hd.onDrag = () => { if (sync) return; sync = true; hS.set(Math.round(hd.y * 100) / 100); sync = false; };
        const vort = (px, py, vx, vy, G) => { const dx = px - vx, dy = py - vy, r2 = dx * dx + dy * dy + 0.004; return [-G * dy / (2 * Math.PI * r2), G * dx / (2 * Math.PI * r2)]; };
        let st = {};
        v.render(() => {
          const h = hS.value, AR = arS.value, gc = groundCurve(AR), sol = weissinger({ AR, alpha: 0.1, h, M: 60 }), s0 = gc.free;
          const phi = (sol.CDi / sol.CL ** 2) / (s0.CDi / s0.CL ** 2);
          // front view
          A.rect(-1.5, -0.03, 1.5, 0.03, { fill: 'muted', fillAlpha: 0.35, hatch: true, stroke: false }); A.line(-1.5, 0, 1.5, 0, { color: 'ink', width: 2 });
          A.text('ground (mirror plane)', 1.45, 0.1, { color: 'muted', size: 11, align: 'right' });
          const sv = Math.PI / 8, G = 1, vs = [[sv, h, G], [-sv, h, -G], [sv, -h, -G], [-sv, -h, G]];
          A.field((x, y) => { if (y < 0) return [0, 0]; let u = 0, w = 0; for (const [vx, vy, g] of vs) { const q = vort(x, y, vx, vy, g * 0.2); u += q[0]; w += q[1]; } const m = Math.hypot(u, w) || 1, cap = Math.min(m, 0.9) / m; return [u * cap, w * cap]; }, { spacing: 34, color: 'faint' });
          A.line(-0.5, h, 0.5, h, { color: 'ink', width: 4 });
          A.line(-0.5, -h, 0.5, -h, { color: 'muted', width: 2.5, dash: true });
          for (const [vx, vy, g] of vs) { const real = vy > 0; A.dot(vx, vy, { r: 8, color: real ? 'accent' : 'muted', hollow: true }); A.tex(g > 0 ? String.raw`\circlearrowleft` : String.raw`\circlearrowright`, vx, vy, { color: real ? 'accent' : 'muted', size: 17, align: 'center', baseline: 'middle' }); }
          A.measure(1.0, 0, 1.0, h, `h = ${fx(h, 2)} b`);
          sync = true; hd.set(0, h); sync = false;
          A.text('image wing, opposite circulation', 0, -h - 0.08, { color: 'muted', size: 10.5, align: 'center' });
          // phi curve
          B.path(gc.pts.map((p) => [p[0], p[1]]), { color: 'accent', width: 2.6 });
          B.fn((x) => fitPhi(x), { domain: [0.03, 1], color: 'muted', dash: true, width: 1.6, n: 200 });
          B.hline(1, { color: 'faint' }); B.vline(h, { color: 'gold', dash: true, width: 1.2 }); B.dot(h, phi, { r: 6, color: 'gold' });
          // downwash at CL = 0.8
          const k = 0.8 / sol.CL, k0 = 0.8 / s0.CL;
          C.hline(0, { color: 'grid' });
          C.path(s0.mid.map((y, i) => [y, s0.w[i] * k0 / DEG]), { color: 'muted', width: 2, dash: true });
          C.path(sol.mid.map((y, i) => [y, sol.w[i] * k / DEG]), { color: 'accent', width: 2.6 });
          st = { h, phi, AR, clr: sol.CL / s0.CL, fit: fitPhi(h) };
        });
        v.legend([['accent', 'with the ground'], ['muted', 'free air', { dash: true }], ['muted', 'textbook fit, $1-\\sigma$', { dash: true }]]);
        v.readout(() => `$h/b=${fx(st.h, 2)}$: induced drag at equal lift is $${fx(st.phi, 3)}$ of the free-air value (a reduction of $${fx(100 * (1 - st.phi), 0)}$ %), as if the aspect ratio were $${fx(st.AR / st.phi, 1)}$ instead of $${fx(st.AR, 1)}$. At equal angle of attack the lift is $${fx(st.clr, 3)}\\times$ the free-air value. The quoted fit $1-\\sigma$, $\\sigma=(1-1.32h/b)/(1.05+7.4h/b)$, gives $${fx(st.fit, 3)}$.\nFor $h/b>1$ the effect is under 3 %; at $h/b=0.05$ it is about $0.4$ of the free-air value.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Formation flight: geese in a V',
      statement: String.raw`The trailing vortices of a flying bird (3.1) rotate so that the air rises outboard of the wingtips and sinks behind the body. A bird that flies in the **upwash** of a leader, with its wing tips just outside the leader's tip vortices, has its own downwash partly cancelled and needs less induced power for the same lift; a bird directly behind the leader flies in the downwash and pays for it. Lissaman and Shollenberger (1970) calculated that a V of 25 birds could have a range increase of about 70 per cent over a lone bird, with the saving distributed evenly by the V shape; measurements in pelicans (heart rate) and ibises (flap phasing) show real savings and that birds place themselves where the upwash is, but the savings are smaller than the early estimate.`,
      idea: String.raw`Each bird is a lifting line with elliptic loading, so its wake is a vortex pair $\pm\pi b/8$ from its centreline (3.1). At a follower the leader's pair induces an upwash $w_{up}(y)$ across the follower's span, and the follower's induced drag changes by $-\rho\int\Gamma_f\,w_{up}\,\mathrm{d}y$, a simple extension of 3.2 ($D_i=\rho\int\Gamma w\,\mathrm{d}y$). Everything needed is the velocity field of vortex filaments that start at the leader's wing: a vortex pair that is only just beginning, at the same station, acts with half the strength of a long one.`,
      caption: String.raw`Choose a formation and the number of birds, and set the lateral spacing $d$ between neighbours (in wingspans); each bird is coloured by the induced drag it saves (green) or loses (red). The middle graph is a single follower behind a single leader against its lateral offset: negative directly behind, best near the leader's wingtip. Use "best spacing" to jump to the optimum, then compare formations: single file never works. The right graph is the range gain against the number of birds, with the 1970 estimate marked.`,
      deps: ['aero-3.1', 'aero-3.2'],
      refs: ['Anderson ch. 5'],
      tags: ['formation flight', 'induced drag', 'biology'],
      scope: String.raw`A cartoon in the spirit of the original analysis, not a reproduction: lightly loaded elliptic wings, steady flight, all birds at one height and speed, the leader's wake taken as a rolled-up vortex pair from the wing onwards (no decay, no roll-up distance, no turbulence) with a core of $0.06\,b$ — the largest savings are sensitive to this core size, and the bound vortices are ignored, and the induced share of the total drag a free parameter. The model gives the saving in induced drag only; real birds also flap, so what an upwash is worth depends on flap phase, and measured savings are smaller than the 1970 figure.`,
      credit: 'Lissaman & Shollenberger, Science 168 (1970) 1003–1005; Weimerskirch et al., Nature 413 (2001) 697–698; Portugal et al., Nature 505 (2014) 399–402',
      viz(v) {
        const kindS = v.select('formation', [{ value: 'v', label: 'V' }, { value: 'ech', label: 'echelon' }, { value: 'abr', label: 'line abreast' }, { value: 'file', label: 'single file' }], 'v');
        const nS = v.slider('number of birds', 2, 25, 9, { step: 1, int: true });
        const dS = v.slider('lateral spacing $d$ (wingspans)', 0.5, 1.4, 0.85, { step: 0.01 });
        const angS = v.slider('V half-angle (°)', 10, 60, 20, { step: 1 });
        const qS = v.slider('induced share of the total drag', 0.3, 0.8, 0.5, { step: 0.05 });
        v.button('best spacing', () => { let b = { d: 0.85, m: -9 }; for (let d = 0.5; d <= 1.4001; d += 0.01) { const m = flockSavings(kindS.value, nS.value, d, angS.value).mean; if (m > b.m) b = { d, m }; } dS.set(Math.round(b.d * 100) / 100); });
        const A = v.stage({ x: [-3, 3], y: [-2.5, 0.6], equal: true, axes: false, height: 320, full: true, title: 'plan view: birds coloured by induced-drag saving' });
        const B = v.stage({ x: [0, 1.6], y: [-1, 1], axes: 'box', gutter: true, height: 260, minWidth: 280, xlabel: 'lateral offset of the follower (wingspans)', ylabel: 'induced-drag saving', title: 'one follower behind one leader' });
        const C = v.stage({ x: [1, 25], y: [-0.2, 1], axes: 'box', gutter: true, height: 260, minWidth: 280, xlabel: 'number of birds', ylabel: 'range gain', title: 'range gain of the flock' });
        const pairSaving = (off, gap) => birdSaving(1, [{ x: 0, y: 0 }, { x: gap, y: off }]);
        const hd = B.handle(0.85, 0, { color: 'gold', r: 7, constrain: (x) => { const d = clamp(x, 0.5, 1.4); return [d, pairSaving(d, 8)]; } });
        let sync = false; hd.onDrag = () => { if (sync) return; sync = true; dS.set(Math.round(hd.x * 100) / 100); sync = false; };
        let info = {};
        v.render(() => {
          const kind = kindS.value, N = Math.round(nS.value), d = dS.value, ang = angS.value, q = qS.value;
          const fl = flockSavings(kind, N, d, ang);
          let xmin = -1, xmax = 1, ymin = 0; fl.B.forEach((b) => { xmin = Math.min(xmin, b.y - 0.7); xmax = Math.max(xmax, b.y + 0.7); ymin = Math.max(ymin, b.x); });
          A.setView([xmin, xmax], [-ymin - 0.7, 0.7]);
          fl.B.forEach((b, i) => {
            const s = fl.s[i], col = s > 0.04 ? 'green' : s < -0.04 ? 'red' : 'ink';
            A.line(b.y - 0.5, -b.x, b.y + 0.5, -b.x, { color: col, width: 4 }); A.dot(b.y, -b.x, { r: 3.5, color: col });
            if (N <= 11) A.text(`${fx(100 * s, 0)}%`, b.y, -b.x + 0.2, { color: col, size: 10.5, align: 'center' });
            for (const sg of [1, -1]) A.line(b.y + sg * SV, -b.x, b.y + sg * SV, -b.x - 1.6, { color: 'faint', width: 1, dash: true });
          });
          A.arrow(xmin + 0.2, 0.4, xmin + 0.2, -0.3, { color: 'muted', width: 1.8, head: 7 }); A.text('flight direction', xmin + 0.3, 0.05, { color: 'muted', size: 10.5, align: 'left' });
          // pair curve
          B.hline(0, { color: 'grid' });
          B.fn((o) => pairSaving(o, 8), { domain: [0, 1.6], color: 'accent', width: 2.6, n: 160 });
          const gap = Math.abs(fl.B[Math.min(1, N - 1)].x);
          B.fn((o) => pairSaving(o, gap), { domain: [0, 1.6], color: 'orange', width: 1.8, dash: true, n: 160 });
          sync = true; hd.set(d, pairSaving(d, 8)); sync = false;
          B.dot(d, pairSaving(d, 8), { r: 5, color: 'gold' });
          // range gain vs N
          const gains = []; for (let n = 1; n <= 25; n++) { const m = n === 1 ? 0 : flockSavings(kind, n, d, ang).mean; gains.push([n, 1 / (1 - q * m) - 1]); }
          C.hline(0, { color: 'grid' });
          C.path(gains, { color: 'accent', width: 2.6 }); C.dots(gains.filter((g) => g[0] % 4 === 1 || g[0] === N), { r: 3, color: 'accent' });
          C.dot(25, 0.7, { r: 7, color: 'pink', hollow: true, label: '1970 estimate ≈ 70 %', labelPos: 'nw' });
          C.vline(N, { color: 'gold', dash: true, width: 1.2 });
          info = { fl, N, q, gain: 1 / (1 - q * fl.mean) - 1, d, kind, ang };
        });
        v.legend([['accent', 'follower far behind (model)'], ['orange', 'follower at the formation spacing', { dash: true }], ['pink', 'Lissaman & Shollenberger abstract (≈ 70 %, 25 birds)', { dot: true }]]);
        v.readout(() => {
          const { fl, N, q, gain, d, ang } = info, worst = Math.min(...fl.s), best = Math.max(...fl.s);
          return `${N} birds: mean induced-drag saving $${fx(100 * fl.mean, 0)}$ % (best bird $${fx(100 * best, 0)}$ %, worst $${fx(100 * worst, 0)}$ %); with induced drag a fraction $${fx(q, 2)}$ of the total, the drag falls by $${fx(100 * q * fl.mean, 0)}$ % and the range at equal speed rises by $${fx(100 * gain, 0)}$ %.\n`
            + `For comparison: 25 birds, about 70 % in Lissaman & Shollenberger's abstract; measured heart-rate savings of 11–14 % in followers (Weimerskirch et al. 2001, pelicans). Longitudinal spacing matters only when birds are within about a span of each other: at $d=${fx(d, 2)}$ and half-angle $${ang}^\\circ$ the rows are $${fx(d / Math.tan(ang * DEG), 1)}$ spans apart.`;
        });
      },
    },
  ],
};
