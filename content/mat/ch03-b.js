// Materials Science — Chapter 3, part b: items 3.7–3.10 (Frank–Read source, Taylor hardening, von Mises criterion, low-angle boundaries)
import { slipSystems, dir3, edgeU } from './ch03.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ── line-tension simulation of a pinned dislocation (3.7) ─────────────────────────────────────────────────────────────
// Units: line tension T = 1, mobility 1, pin spacing L = 1. A segment of radius R feels the stress force τ̃ against T/R, so the critical
// (semicircular) state is τ̃_c = 2.  Nodes carry the line; the line is cut and reconnected when two arms cross.
const DS = 0.04;
function resample(P, closed, ds = DS) {
  const pts = closed ? [...P, P[0]] : P, cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1], n = Math.max(closed ? 8 : 6, Math.round(len / ds)), out = [];
  let j = 0;
  for (let k = 0; k < (closed ? n : n + 1); k++) {
    const s = (k * len) / n; while (j < pts.length - 2 && cum[j + 1] < s) j++;
    const t = (s - cum[j]) / Math.max(1e-12, cum[j + 1] - cum[j]);
    out.push([pts[j][0] + t * (pts[j + 1][0] - pts[j][0]), pts[j][1] + t * (pts[j + 1][1] - pts[j][1])]);
  }
  if (!closed) { out[0] = [...P[0]]; out[n] = [...P[P.length - 1]]; }
  return out;
}
function relaxStep(P, closed, tau, dt) {
  const n = P.length, F = new Array(n);
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { F[i] = null; continue; }
    const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) + 1e-12, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) + 1e-12;
    const t1 = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1], t2 = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
    const m = 0.5 * (l1 + l2), tx = c[0] - a[0], ty = c[1] - a[1], tl = Math.hypot(tx, ty) + 1e-12;
    F[i] = [(t2[0] - t1[0]) / m + (tau * -ty) / tl, (t2[1] - t1[1]) / m + (tau * tx) / tl];
  }
  for (let i = 0; i < n; i++) if (F[i]) { P[i][0] += dt * F[i][0]; P[i][1] += dt * F[i][1]; }
}
function segHit(p, q, r, s) {
  const d1 = [q[0] - p[0], q[1] - p[1]], d2 = [s[0] - r[0], s[1] - r[1]], den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-14) return null;
  const t = ((r[0] - p[0]) * d2[1] - (r[1] - p[1]) * d2[0]) / den, u = ((r[0] - p[0]) * d1[1] - (r[1] - p[1]) * d1[0]) / den;
  return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + t * d1[0], p[1] + t * d1[1]] : null;
}
/** If two arms of the open line cross, cut off a closed loop and reconnect the rest. Returns true if something happened. */
function pinch(st) {
  const P = st.line, n = P.length;
  for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n - 1; j++) {
    const X = segHit(P[i], P[i + 1], P[j], P[j + 1]);
    if (X) {
      const loop = [X, ...P.slice(i + 1, j + 1).map((p) => [...p])];
      let ar = 0; for (let k = 0; k < loop.length; k++) { const p = loop[k], q = loop[(k + 1) % loop.length]; ar += p[0] * q[1] - q[0] * p[1]; }
      if (ar > 0) loop.reverse(); // the emitted loop has the Burgers vector of the source, so it expands under the same stress (outward normal on the left)
      st.loops.push(resample(loop, true));
      st.line = resample([...P.slice(0, i + 1).map((p) => [...p]), X, ...P.slice(j + 1).map((p) => [...p])], false);
      st.emitted++;
      return true;
    }
  }
  return false;
}

// ── 2D discrete edge-dislocation ensemble (3.8) ───────────────────────────────────────────────────────────────────────
// N edge dislocations (signs ±1) on glide planes y = k·H of a periodic unit box, interaction force per length
// F_x = s_i s_j x (x² − y²)/(x² + y²)² (units G b²/(2π(1−ν)) per length), nearest image; applied force s_i τ̃; overdamped glide.
const H = 0.01, RC = 0.015, NU8 = 0.3;
function dddTest(N, seed, rng) {
  const r = v8rng(seed);
  let x = [], y = [], s = [], id = [];
  for (let i = 0; i < N; i++) { x.push(r()); y.push(Math.floor(r() * 100) * H); s.push(i % 2 ? 1 : -1); id.push(i); }
  const disp = new Float64Array(N);
  const wrap = (d) => d - Math.round(d);
  const forces = (tau) => {
    const n = x.length, F = new Float64Array(n);
    for (let i = 0; i < n; i++) F[i] = s[i] * tau;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = wrap(x[i] - x[j]), dy = wrap(y[i] - y[j]), r2 = dx * dx + dy * dy + 1e-12, f = (s[i] * s[j] * dx * (dx * dx - dy * dy)) / (r2 * r2);
      F[i] += f; F[j] -= f;
    }
    return F;
  };
  const annihilate = () => {
    for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) {
      if (s[i] !== s[j] && Math.abs(y[i] - y[j]) < 1e-9 && Math.abs(wrap(x[i] - x[j])) < RC) { for (const k of [j, i]) { x.splice(k, 1); y.splice(k, 1); s.splice(k, 1); id.splice(k, 1); } return true; }
    }
    return false;
  };
  const step = (tau, dt, dmax, track) => { const F = forces(tau); for (let i = 0; i < x.length; i++) { const d = clamp(F[i] * dt, -dmax, dmax); if (track) disp[id[i]] += d; x[i] = (x[i] + d + 1) % 1; } while (annihilate()); };
  const init = { x: [...x], y: [...y], s: [...s] };
  for (let k = 0; k < 1200; k++) step(0, 4e-5, 0.003);
  const n0 = x.length, ell = 1 / Math.sqrt(Math.max(1, n0)), relaxed = { x: [...x], y: [...y], s: [...s] };
  const tmax = 2.2 * Math.sqrt(n0) + 1, nst = 1600, curve = []; let flow = null;
  for (let k = 1; k <= nst; k++) {
    const tau = (tmax * k) / nst;
    step(tau, 4e-5, 0.003, true);
    let P = 0; for (let i = 0; i < x.length; i++) P += s[i] * disp[id[i]];
    P /= Math.max(1, x.length) * ell; // mean displacement in units of the spacing
    if (k % 8 === 0) curve.push([tau, P]);
    if (flow === null && P >= 0.25) flow = tau;
  }
  return { n0, flow, curve, init, relaxed, final: { x: [...x], y: [...y], s: [...s] }, ell, tmax };
}
function v8rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const alphaOf = (flow, n0) => flow / (2 * Math.PI * (1 - NU8) * Math.sqrt(n0)); // τ_a / (G b √ρ) for unit box: ρ = n0

export default {
  collection: 'mat',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Frank–Read source',
      statement: String.raw`A dislocation segment of length $L$ pinned at both ends (by forest dislocations, precipitates, or where it leaves the slip plane) bows out under a resolved shear stress $\tau$ like a string with line tension $T\approx\tfrac12Gb^2$: the force per unit length $\tau b$ is balanced by $T/R$, so the arc has radius $R=\dfrac{Gb}{2\tau}$. The bow grows until it is a semicircle ($R=L/2$) at $\tau_c\approx\dfrac{Gb}{L}$; beyond that no equilibrium exists. The arms then sweep round the pins, meet behind them, annihilate where they touch, and release a closed **dislocation loop** while the original segment is restored, ready to repeat. One source therefore multiplies dislocations indefinitely at a stress $\tau_c\propto 1/L$.`,
      idea: String.raw`For $\tau<\tau_c$ the shape is the circular arc of radius $T/(\tau b)$ through the two pins, whose height grows with $\tau$ and is largest ($L/2$) for the semicircle; past that, a larger arc through the pins has a larger radius of curvature and so a weaker restoring tension, so the bow runs away (an instability of the same kind as Euler buckling). The two arms that wrap around the pins have opposite line directions where they meet, so their Burgers vectors cancel and they reconnect (3.6 gives the line tension; 3.3 why opposite arms cancel). The simulation below discretises the line, advances each node by the net force $T\kappa+\tau b$ (overdamped), and cuts and rejoins the line wherever two arms cross.`,
      caption: String.raw`The animation starts from the straight segment and applies the stress; drag the stress slider to set $\tau/\tau_c$ (the run restarts). Below $\tau_c$ the segment settles on the dashed analytic arc; above it the arms wrap around the pins and release loop after loop. The right panel compares the simulated steady bow height with the analytic $h(\tau)$ and shows that no steady state exists beyond $\tau_c$. The pin spacing $L$ sets the absolute stress $\tau_c=Gb/L$ (copper-like $G$, $b$).`,
      deps: ['mat-3.6'],
      refs: ['Callister §7.3'],
      tags: ['dislocation multiplication', 'line tension', 'plasticity'],
      credit: 'F. C. Frank and W. T. Read, 1950 (building on Orowan\'s earlier bow-out argument)',
      scope: String.raw`Planar (single glide plane) line-tension model with a constant line tension and a linear drag; the arcs are circular only in equilibrium. Forces from other dislocations and the dependence of tension on line character are ignored, which is why real sources open at several times $Gb/L$ for short segments.`,
      viz(v) {
        let S;
        const reset = () => S.reset();
        const tauS = v.slider('applied stress $\\tau/\\tau_c$', 0.2, 2.2, 1.25, { step: 0.01, onChange: reset });
        const Ls = v.slider('pin spacing $L$ (µm)', 0.1, 3, 1, { step: 0.05 });
        const TS = 0.12; // simulated time per second of animation clock
        S = v.sim(() => ({ line: resample([[-0.5, 0], [0.5, 0]], false), loops: [], emitted: 0, n: 0, maxY: 0 }), (st, dt) => {
          const tau = 2 * tauS.value;
          relaxStep(st.line, false, tau, dt);
          for (const lp of st.loops) relaxStep(lp, true, tau, dt);
          st.n++;
          if (st.n % 25 === 0) {
            let guard = 0; while (pinch(st) && guard++ < 3);
            st.maxY = Math.max(...st.line.map((p) => p[1]));
          }
          if (st.n % 150 === 0) { st.line = resample(st.line, false); st.loops = st.loops.map((lp) => resample(lp, true)).filter((lp) => { let mx = 0; for (const p of lp) mx = Math.max(mx, Math.hypot(p[0], p[1] - 0.3)); return mx < 6; }); }
        }, { dt: 1e-4, maxSteps: 40000 });
        const A = v.stage({ x: [-2.8, 2.8], y: [-2.2, 3.2], equal: true, axes: false, height: 400, weight: 1.5, title: 'pinned dislocation segment on its glide plane' });
        const B = v.stage({ x: [0, 2.2], y: [0, 0.62], axes: 'box', gutter: true, height: 400, weight: 0.85, minWidth: 260, xlabel: 'applied stress  $\\tau/\\tau_c$', ylabel: 'bow height  $h/L$', title: 'steady bow height' });
        const hAn = (r) => { if (r > 1) return NaN; const R = 0.5 / r; return R - Math.sqrt(R * R - 0.25); };
        let info = null;
        v.animate((t) => {
          S.advance(TS * t);
          const st = S.state, r = tauS.value;
          // faint analytic arc
          if (r <= 1) { const R = 0.5 / r, h = hAn(r), cy = h - R; A.curve((q) => [R * Math.sin(q), cy + R * Math.cos(q)], -Math.asin(0.5 / R), Math.asin(0.5 / R), { n: 60, color: 'green', width: 2, dash: [6, 5], alpha: 0.9 }); }
          A.line(-0.5, 0, 0.5, 0, { color: 'faint', dash: [3, 4] });
          st.loops.forEach((lp, k) => A.path([...lp, lp[0]], { color: 'orange', width: 2, alpha: 0.35 + 0.6 * (k + 1) / st.loops.length }));
          A.path(st.line, { color: 'accent', width: 3.5 });
          A.dot(-0.5, 0, { r: 7, color: 'ink', fill: 'ink' }); A.dot(0.5, 0, { r: 7, color: 'ink', fill: 'ink' });
          A.arrow(0, -0.35, 0, -0.08, { color: 'red', width: 2.5, head: 9 }); A.text('force $\\tau b$ per length', 0.15, -0.45, { color: 'red', size: 11, align: 'left' });
          A.text(`$L$`, 0, -0.75, { color: 'muted', size: 12 });
          // right panel
          B.fn((x) => hAn(x), { domain: [0.02, 1], color: 'green', width: 2.5 });
          B.vline(1, { color: 'red', dash: [5, 4], width: 1.4 }); B.text('$\\tau_c$: semicircle', 1.03, 0.03, { color: 'red', size: 11, align: 'left' });
          B.text('no steady state:', 1.06, 0.4, { color: 'muted', size: 11, align: 'left' }); B.text('loops are emitted', 1.06, 0.36, { color: 'muted', size: 11, align: 'left' });
          if (r <= 1) B.dot(r, hAn(r), { r: 6, color: 'green', fill: 'green' });
          if (r <= 1) B.dot(r, st.maxY, { r: 6, color: 'accent', hollow: true, width: 2 });
          info = { r, h: hAn(r), sim: st.maxY, emitted: st.emitted, loops: st.loops.length };
        }, { period: 16, still: 11 });
        v.legend([['accent', 'dislocation line (simulated)'], ['green', 'analytic arc $R=Gb/2\\tau$', { dash: true }], ['orange', 'emitted loops']]);
        v.readout(() => {
          if (!info) return '';
          const L = Ls.value, tc = (45e9 * 0.2556e-9) / (L * 1e-6) / 1e6;
          return `$\\tau_c=Gb/L=${v.fix(tc, 1)}$ MPa for $L=${v.fix(L, 2)}$ µm ($G=45$ GPa, $b=0.256$ nm); applied $\\tau=${v.fix(info.r * tc, 1)}$ MPa.\n` + (info.r <= 1 ? `Analytic bow $h/L=${v.fix(info.h, 3)}$, simulated so far $${v.fix(info.sim, 3)}$ (settling). ` : `Above $\\tau_c$: ${info.emitted} loop${info.emitted === 1 ? '' : 's'} released so far. `) + `Halving $L$ doubles $\\tau_c$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Law',
      name: 'Taylor hardening: σ ∝ √ρ',
      statement: String.raw`The flow stress of a crystal that has been plastically deformed rises with the density $\rho$ (line length per volume) of dislocations it contains: $$\tau=\tau_0+\alpha\,G\,b\sqrt{\rho},$$ where $\tau_0$ is the lattice friction stress and $\alpha$ is a dimensionless constant of order $0.1$ to $0.5$ that depends on how the dislocations are arranged. Equivalently, the stress needed to push a dislocation past its neighbours is $\sim Gb/\ell$ with $\ell=1/\sqrt\rho$ their mean spacing, and a tensile flow stress follows by multiplying by a Taylor factor $M\approx3$ for polycrystals.`,
      idea: String.raw`Dislocations feel the long-range elastic stress of every other one: at distance $r$ a neighbour exerts a stress of order $Gb/(2\pi(1-\nu)\,r)$ (3.6), so a dislocation must be pushed with $\tau\sim Gb/\ell$ to pass its neighbours (to bow between them as in 3.7, or to unlock from dipoles). The only length available in a population of density $\rho$ is $\ell=\rho^{-1/2}$, so by dimensional analysis the stress is a multiple of $Gb\sqrt\rho$; the constant $\alpha$ hides the geometry of the arrangement. The numerical experiment here is a two-dimensional ensemble of edge dislocations of both signs gliding on random planes: its yield stress is measured, not assumed.`,
      caption: String.raw`Choose the number $N$ of dislocations in the unit box (their density is $\rho=N$ in box units), press *Run stress test*: the ensemble relaxes (opposite signs annihilate), then the applied stress is ramped up while the mean glide displacement is recorded; "flow" is defined as the stress at which dislocations have moved on average a quarter of their spacing. *Density sweep* repeats this for several $N$ and seeds and plots flow stress against $\sqrt\rho$: a straight line through the origin has slope $\alpha$.`,
      deps: ['mat-3.7'],
      refs: ['Callister §7.10'],
      tags: ['work hardening', 'dislocation density', 'Taylor'],
      credit: 'G. I. Taylor, 1934',
      scope: String.raw`This is a 2D model: straight edge dislocations of $\pm b$ on parallel glide planes spaced $0.01$ apart (the unit box), periodic with nearest-image forces, overdamped, without sources, obstacles or climb; $\nu=0.3$. The flow criterion (mean displacement of a quarter spacing) is my own definition, so the fitted $\alpha$ is a property of this model, not a prediction for a real metal; real values scatter between about $0.1$ and $0.5$ depending on the dislocation structure.`,
      verify: true,
      viz(v) {
        const Ns = v.slider('number of dislocations $N$', 10, 100, 50, { int: true });
        let seed = 7, res = null; const sweep = [];
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 400, weight: 1.1, title: 'dislocations on their glide planes (unit box)' });
        const B = v.stage({ x: [0, 14], y: [0, 4], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 270, xlabel: '$\\sqrt\\rho$  (box units)', ylabel: '$\\tau/(Gb)$ × box length', title: 'flow stress against √density' });
        let timer = null; v.onCleanup(() => clearTimeout(timer));
        const run = () => { res = dddTest(Ns.value, seed, null); if (res.flow != null) { const k = sweep.findIndex((q) => q.n === res.n0 && q.seed === seed); const row = { n: res.n0, y: res.flow / (2 * Math.PI * (1 - NU8)), seed }; if (k < 0) sweep.push(row); } };
        v.button('Run stress test', () => { run(); });
        v.button('New random ensemble', () => { seed++; run(); });
        const sweepRun = (ns, nseed) => {
          const todo = []; for (const n of ns) for (let k = 0; k < nseed; k++) todo.push([n, 100 + k + n]);
          const loop = () => { const q = todo.shift(); if (!q) return; const r = dddTest(q[0], q[1], null); if (r.flow != null) sweep.push({ n: r.n0, y: r.flow / (2 * Math.PI * (1 - NU8)), seed: q[1] }); v.invalidate(); timer = setTimeout(loop, 5); };
          loop();
        };
        v.button('Density sweep (N = 12…100)', () => sweepRun([12, 20, 30, 45, 65, 100], 3));
        timer = setTimeout(() => { run(); v.invalidate(); timer = setTimeout(() => sweepRun([12, 20, 30, 45, 65, 90], 2), 20); }, 10);
        const fit = () => { if (sweep.length < 2) return null; const xs = sweep.map((p) => Math.sqrt(p.n)), ys = sweep.map((p) => p.y); const al = xs.reduce((a, x, i) => a + x * ys[i], 0) / xs.reduce((a, x) => a + x * x, 0); const lr = v.M.linreg(xs.map(Math.log), ys.map(Math.log)); return { al, exp: lr.slope, r2: lr.r2 }; };
        v.render(() => {
          for (let k = 0; k <= 100; k += 10) A.hline(k * H, { color: 'grid', alpha: 0.35 });
          const cfg = res ? res.final : null;
          if (cfg) for (let i = 0; i < cfg.x.length; i++) {
            const c = cfg.s[i] > 0 ? 'red' : 'blue', u = cfg.s[i] > 0 ? 1 : -1, px = cfg.x[i], py = cfg.y[i], w = 0.014;
            A.line(px - w, py, px + w, py, { color: c, width: 2 }); A.line(px, py, px, py + u * 0.025, { color: c, width: 2 });
          }
          if (res && res.relaxed) for (let i = 0; i < res.relaxed.x.length; i++) A.dot(res.relaxed.x[i], res.relaxed.y[i], { r: 2.5, color: 'muted', fill: 'muted', alpha: 0.5 });
          A.corner('coloured ⊥ = after the test, grey dots = relaxed start; red +b, blue −b', 'bl', { color: 'muted', size: 10.5 });
          const f = fit();
          B.setView([0, 11], [0, 4]);
          if (f) B.fn((x) => f.al * x, { color: 'green', width: 2, domain: [0, 11] });
          for (const p of sweep) B.dot(Math.sqrt(p.n), p.y, { r: 4, color: p.you ? 'gold' : 'accent', fill: p.you ? 'gold' : 'accent', alpha: 0.9 });
          if (res && res.flow != null) B.dot(Math.sqrt(res.n0), res.flow / (2 * Math.PI * (1 - NU8)), { r: 8, color: 'orange', hollow: true, width: 2 });
        });
        v.legend([['orange', 'this ensemble'], ['accent', 'runs (sweep and tests)'], ['green', 'fit through the origin: slope $\\alpha$']]);
        v.readout(() => {
          const f = fit();
          let s = res ? (res.flow != null ? `This ensemble: ${res.n0} dislocations survive relaxation; flow at $\\tilde\\tau=${v.fix(res.flow, 2)}$, i.e. $\\alpha=\\tau/(Gb\\sqrt\\rho)=${v.fix(alphaOf(res.flow, res.n0), 3)}$.` : `This ensemble did not reach the flow criterion before the end of the ramp.`) : 'Computing…';
          if (f) s += `\nSweep (${sweep.length} runs): fit through the origin $\\alpha=${v.fix(f.al, 3)}$; log–log slope of $\\tau$ against $\\rho$ (should be $\\tfrac12$ for Taylor's law): $${v.fix(f.exp / 2, 2)}$ (read as exponent of $\\rho$).`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Principle',
      name: 'Von Mises criterion: five independent slip systems',
      statement: String.raw`Plastic flow conserves volume, so the shape change of a grain is a symmetric traceless strain tensor, which has **five** independent components. Slip on a system with unit plane normal $\hat n$ and direction $\hat b$ produces the strain $\boldsymbol\varepsilon^{(\alpha)}=\tfrac12(\hat b\otimes\hat n+\hat n\otimes\hat b)\,\gamma_\alpha$. A grain can therefore accept an arbitrary shape change by slip alone only if its active slip systems contain **five linearly independent** strains; otherwise some shape changes cannot be accommodated, and neighbouring grains in a polycrystal cannot stay in contact without cracking or without a further mechanism (twinning, other slip systems, grain-boundary sliding).`,
      idea: String.raw`Count the dimension of the span of the tensors $\boldsymbol\varepsilon^{(\alpha)}$ in the 5-dimensional space of deviatoric strains. For fcc $\{111\}\langle110\rangle$ the 12 systems span all five dimensions, as do the 12 bcc $\{110\}\langle111\rangle$ systems, so these metals are ductile as polycrystals. Basal slip in hcp has only two independent systems, prismatic slip adds two more but all $\langle a\rangle$ slip has no component of strain along the $c$ axis, so four in all; only $\langle c+a\rangle$ slip (or twinning) supplies the fifth, and its large critical stress is why Mg and Zn are brittle at low temperature. The rank here is computed from the actual crystal geometry.`,
      caption: String.raw`Choose a crystal and the slip families it can use, then a required shape change (a seeded random one, or a stretch along the $c$ axis). Dashed red is the cube of the grain after the requested strain; solid green is the closest shape the active systems can make (least-squares combination of their strains). When the rank is below 5 the shapes differ for most requested changes, and the readout gives the unaccommodated part: that mismatch is what opens at grain boundaries. The bars are the minimum-norm shear amounts $\gamma_\alpha$.`,
      deps: ['mat-3.4'],
      refs: ['Callister §7.6'],
      tags: ['von Mises', 'ductility', 'polycrystal'],
      credit: 'R. von Mises, 1928 (Z. angew. Math. Mech. 8, 161; independent systems), applied to polycrystals by G. I. Taylor',
      scope: String.raw`Slip is assumed allowed in both senses on each system (true for fcc and hcp at the stresses considered, and for twin-free bcc $\{110\}\langle111\rangle$ only to first order); the least-squares combination ignores the critical stresses of the systems, the minimum-work (Taylor) choice of shears and any rotation. The hcp systems are generated from their geometry with the ideal axial ratio you set below.`,
      viz(v) {
        const M = v.M, S3 = Math.sqrt(3);
        const crys = v.select('crystal', [
          { value: 'fcc', label: 'fcc {111}⟨110⟩' }, { value: 'bcc', label: 'bcc {110}⟨111⟩' }, { value: 'bcc3', label: 'bcc + {112}, {123}' },
          { value: 'hbas', label: 'hcp basal' }, { value: 'hpr', label: 'hcp basal + prismatic' }, { value: 'hpa', label: '+ pyramidal ⟨a⟩' }, { value: 'hca', label: '+ ⟨c+a⟩' },
        ], 'fcc');
        const cs = v.slider('hcp  $c/a$', 1.4, 1.95, 1.633, { step: 0.001 });
        const amp = v.slider('strain amplitude $e$', 0.05, 0.5, 0.25, { step: 0.01 });
        let seed = 3, target = null;
        const preset = v.select('required shape change', [{ value: 'rand', label: 'random' }, { value: 'c', label: 'stretch along [001] (c axis)' }, { value: 'sh', label: 'shear in the basal plane' }], 'rand');
        v.button('new random change', () => { seed++; preset.value = 'rand'; });
        const dev = (e) => [(e[0][0] - e[1][1]) / Math.SQRT2, (2 * e[2][2] - e[0][0] - e[1][1]) / Math.sqrt(6), Math.SQRT2 * e[0][1], Math.SQRT2 * e[0][2], Math.SQRT2 * e[1][2]];
        const tensorOf = (n, b) => { const nn = M.normalize(n), bb = M.normalize(b); return [0, 1, 2].map((i) => [0, 1, 2].map((j) => 0.5 * (bb[i] * nn[j] + nn[i] * bb[j]))); };
        const sysList = () => {
          const k = crys.value, c = cs.value, out = [];
          const add = (n, b, tag) => out.push({ n, b, tag });
          const fam = (p, d, tag) => { for (const q of slipSystems(p, d)) add(q.n, q.d, tag); };
          if (k === 'fcc') fam([1, 1, 1], [1, 1, 0], '{111}');
          else if (k.startsWith('bcc')) { fam([1, 1, 0], [1, 1, 1], '{110}'); if (k === 'bcc3') { fam([1, 1, 2], [1, 1, 1], '{112}'); fam([1, 2, 3], [1, 1, 1], '{123}'); } }
          else {
            const a = (j) => [Math.cos((Math.PI * j) / 3), Math.sin((Math.PI * j) / 3), 0];
            for (let j = 0; j < 3; j++) add([0, 0, 1], a(j), 'basal');
            if (k !== 'hbas') for (let j = 0; j < 3; j++) add(M.cross3([0, 0, 1], a(j)), a(j), 'prism');
            if (k === 'hpa' || k === 'hca') for (let j = 0; j < 3; j++) for (const sg of [1, -1]) { const w = [...a(j + 1)]; w[2] = sg * c; add(M.cross3(a(j), w), a(j), 'pyr⟨a⟩'); }
            if (k === 'hca') {
              for (let j = 0; j < 6; j++) for (const sg of [1, -1]) { const w = [...a(j + 1)]; w[2] = sg * c; add(M.cross3(a(j), w), w, 'pyr I ⟨c+a⟩'); }
              for (let j = 0; j < 3; j++) for (const sg of [1, -1]) { const b = [...a(j)]; b[2] = sg * c; const t = [-a(j)[1], a(j)[0], 0]; add(M.cross3(t, b), b, 'pyr II ⟨c+a⟩'); }
            }
          }
          return out;
        };
        const E = v.stage({ x: [-2.3, 2.3], y: [-1.7, 2.0], equal: true, axes: false, height: 400, weight: 1.15, title: 'grain shape: requested (red) and achievable (green)' });
        const sc = v.scene3(E, { yaw: -0.6, pitch: 0.4, axes: false, hint: true });
        const Bs = v.stage({ x: [0.5, 12.5], y: [-1, 1], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 260, xlabel: 'slip system (first 12 shown)', ylabel: 'shear $\\gamma_\\alpha$ (min. norm)', title: 'amounts of slip' });
        let info = null;
        const cube = []; for (let i = 0; i < 8; i++) cube.push([(i & 1) - 0.5, ((i >> 1) & 1) - 0.5, ((i >> 2) & 1) - 0.5]);
        const edges = []; for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) if (!((i >> b) & 1)) edges.push([i, i | (1 << b)]);
        v.render(() => {
          const list = sysList(), eps = list.map((q) => tensorOf(q.n, q.b)), cols = eps.map(dev); // each a 5-vector
          const A = M.transpose(cols); // 5 x m
          const rank = M.rank(A, 1e-8);
          // target
          const rr = v.rng(seed);
          let d;
          if (preset.value === 'rand') { d = [0, 1, 2, 3, 4].map(() => rr.normal()); } else if (preset.value === 'c') d = dev([[-0.5, 0, 0], [0, -0.5, 0], [0, 0, 1]]); else d = dev([[0, 0, 0.5], [0, 0, 0], [0.5, 0, 0]]);
          const nd = Math.hypot(...d); d = d.map((x) => x / nd);
          const P = M.pinv(A), gam = M.matVec(P, d), ach = M.matVec(A, gam), res = Math.hypot(...M.vsub(d, ach));
          // cubes
          const F = (dd, s) => { const e = fromEps(dd); return (p) => [p[0] + s * (e[0][0] * p[0] + e[0][1] * p[1] + e[0][2] * p[2]), p[1] + s * (e[1][0] * p[0] + e[1][1] * p[1] + e[1][2] * p[2]), p[2] + s * (e[2][0] * p[0] + e[2][1] * p[1] + e[2][2] * p[2])]; };
          const fromEps = (dd) => { const a = dd[0], b = dd[1], c12 = dd[2] / Math.SQRT2, c13 = dd[3] / Math.SQRT2, c23 = dd[4] / Math.SQRT2; const e11 = a / Math.SQRT2 - b / Math.sqrt(6), e22 = -a / Math.SQRT2 - b / Math.sqrt(6), e33 = (2 * b) / Math.sqrt(6); return [[e11, c12, c13], [c12, e22, c23], [c13, c23, e33]]; };
          const s = amp.value * 1.2, fT = F(d, s), fA = F(ach, s);
          sc.begin();
          for (const [a, b] of edges) sc.line(cube[a], cube[b], { color: 'muted', alpha: 0.35, width: 1 });
          for (const [a, b] of edges) sc.line(fT(cube[a]), fT(cube[b]), { color: 'red', width: 2, dash: [5, 4] });
          for (const [a, b] of edges) sc.line(fA(cube[a]), fA(cube[b]), { color: 'green', width: 2.5 });
          sc.flush();
          E.corner(`rank ${rank} of 5  ·  residual ${v.fix(res, 3)}`, 'bl', { color: rank >= 5 ? 'green' : 'red', size: 13, weight: 700 });
          const m = Math.min(12, list.length);
          const mx = Math.max(0.2, ...gam.slice(0, m).map(Math.abs));
          Bs.setView([0.5, 12.5], [-1.2 * mx, 1.2 * mx]);
          Bs.bars(gam.slice(0, m), { x0: 1, dx: 1, color: (val) => (val >= 0 ? 'accent' : 'orange') });
          Bs.hline(0, { color: 'ink', alpha: 0.5 });
          info = { rank, n: list.length, res, tags: [...new Set(list.map((q) => q.tag))] };
        });
        v.readout(() => info ? `${info.n} slip systems (${info.tags.join(', ')}) span a space of dimension $${info.rank}$ out of 5. ${info.rank >= 5 ? 'Every shape change can be made by slip: the grain follows its neighbours.' : `Only a $${info.rank}$-dimensional family of shape changes is possible; the requested one has a mismatch of ${v.fix(info.res * 100, 0)} % of its size, which would open a gap or crack at the grain boundary.`}` : '');
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Model',
      name: 'Low-angle grain boundaries as dislocation arrays',
      statement: String.raw`A symmetric **low-angle tilt boundary**, two crystals misoriented by a small angle $\theta$ about an axis in the boundary plane, is equivalent to a wall of parallel edge dislocations of Burgers vector $b$ spaced $$D=\frac{b}{2\sin(\theta/2)}\approx\frac{b}{\theta}.$$ Its energy per unit area, in the Read–Shockley model, is $$\gamma(\theta)=\gamma_m\,\frac{\theta}{\theta_m}\Big(1-\ln\frac{\theta}{\theta_m}\Big),$$ rising roughly linearly at small angle, with a logarithmic reduction as the elastic fields of neighbouring dislocations cancel, and levelling at $\gamma_m$ when the cores overlap ($\theta_m\sim10^\circ$ to $15^\circ$). Beyond that the dislocation description fails and the boundary is a high-angle boundary.`,
      idea: String.raw`Each dislocation of the wall has its long-range field screened by the others at distances beyond $D$, so its energy (3.6) is cut off at $R\sim D$ instead of the crystal size: per unit boundary area $\gamma\approx\dfrac{Gb}{4\pi(1-\nu)}\,\theta\,\big[A-\ln\theta\big]$, the core energy entering through $A=1+\ln\theta_m$ in terms of the peak angle. Minimising nothing but summing the elastic energy of a row of dislocations (3.6) gives the shape; the peak at $\theta_m$ is where the spacing $D$ is only a few $b$. The picture is a real lattice calculation: the displacement fields of the wall's dislocations are summed (isotropic elasticity, 3.2) on a square net, and the misorientation between the two sides is measured from the displaced atoms and compared with $b/D$.`,
      caption: String.raw`Slide the misorientation $\theta$ (or drag the point on the energy curve): a vertical wall of edge dislocations (orange $\perp$, spacing $D=b/(2\sin(\theta/2))$) separates two lattices that are rotated relative to each other; the readout compares the rotation measured from the displaced atoms with $\theta$. The right panel is the Read–Shockley curve $\gamma/\gamma_m$ with the current angle marked; move the peak angle $\theta_m$ to see how a wider core region shifts the maximum.`,
      deps: ['mat-3.3'],
      refs: ['Callister §4.6'],
      tags: ['grain boundary', 'dislocation array', 'Read–Shockley'],
      credit: 'W. T. Read and W. Shockley, 1950',
      scope: String.raw`Low-angle symmetric tilt boundaries in a simple-cubic-like 2D lattice (the lattice drawn is a square net with $b=a$). The Read–Shockley expression is accurate at small angles and approximate up to $\theta_m$; the absolute $\gamma_m=Gb\theta_m/(4\pi(1-\nu))$ below is an order-of-magnitude estimate with the chosen $G$, $b$, $\nu$.`,
      viz(v) {
        const th = v.slider('misorientation $\\theta$ (°)', 1.5, 30, 8, { step: 0.1 });
        const thm = v.slider('peak angle $\\theta_m$ (°)', 8, 30, 15, { step: 0.5 });
        const bondsT = v.toggle('draw bonds', true);
        const A = v.stage({ x: [-13, 13], y: [-11.5, 11.5], equal: true, axes: false, height: 440, weight: 1.35, title: 'a wall of edge dislocations (extra half-planes end on the dashed line)' });
        const B = v.stage({ x: [0, 32], y: [0, 1.15], axes: 'box', gutter: true, height: 440, weight: 0.85, minWidth: 270, xlabel: 'misorientation  $\\theta$ (°)', ylabel: 'boundary energy  $\\gamma/\\gamma_m$', title: 'Read–Shockley energy' });
        const gam = (x) => (x <= 0 ? 0 : x * (1 - Math.log(x)));
        const hB = B.handle(8, 0.5, { color: 'accent', r: 8, constrain: (x) => { const t = clamp(x, 1.5, 30); return [t, gam(t / thm.value)]; } });
        hB.onDrag = () => th.set(clamp(hB.x, 1.5, 30));
        let info = null;
        v.render(() => {
          const t = (th.value * Math.PI) / 180, D = 1 / (2 * Math.sin(t / 2)), W = 12, Hh = 11, ys = [];
          for (let k = -Math.ceil(70 / D); k <= Math.ceil(70 / D); k++) ys.push(Math.round(k * D - 0.5) + 0.5);
          const atoms = [];
          for (let j = -Hh; j <= Hh; j++) for (let i = -W; i <= W; i++) {
            let ux = 0, uy = 0;
            for (const y0 of ys) { const u = edgeU(i - 0.5, j - y0, 1, 0.3); ux += u[0]; uy += u[1]; }
            atoms.push({ i, j, x: i + ux, y: j + uy, side: i < 0 ? 0 : 1 });
          }
          // neighbours by distance (positions, not indices: the branch cuts shift atoms by whole lattice vectors)
          const cell = new Map(), key = (x, y) => `${Math.floor(x / 1.4)},${Math.floor(y / 1.4)}`;
          atoms.forEach((a, k) => { const kk = key(a.x, a.y); (cell.get(kk) || cell.set(kk, []).get(kk)).push(k); });
          const nearby = (a, f) => { const cx = Math.floor(a.x / 1.4), cy = Math.floor(a.y / 1.4); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const q of cell.get(`${cx + dx},${cy + dy}`) || []) f(q); };
          const bonds = [];
          atoms.forEach((a, k) => nearby(a, (q) => { if (q > k && Math.hypot(atoms[q].x - a.x, atoms[q].y - a.y) < 1.3) bonds.push([k, q]); }));
          // misorientation: direction of the 'upward' lattice vector on each side, far from the wall
          const ang = (side) => { let sa = 0, n = 0; atoms.forEach((a) => { if (a.side !== side || Math.abs(a.i + 0.5) < 5 || Math.abs(a.j) > Hh - 2) return; let best = null, bd = 0.45; nearby({ x: a.x, y: a.y + 1 }, (q) => { const d = Math.hypot(atoms[q].x - a.x, atoms[q].y - a.y - 1); if (d < bd) { bd = d; best = atoms[q]; } }); if (best) { sa += Math.atan2(best.x - a.x, best.y - a.y); n++; } }); return sa / Math.max(1, n); };
          const aL = ang(0), aR = ang(1), rot = -(aL + aR) / 2, cr = Math.cos(rot), sr = Math.sin(rot);
          for (const a of atoms) { const x = a.x, y = a.y; a.x = cr * x - sr * y; a.y = sr * x + cr * y; }
          if (bondsT.value) for (const [k, q] of bonds) A.line(atoms[k].x, atoms[k].y, atoms[q].x, atoms[q].y, { color: 'muted', alpha: 0.55, width: 1.3 });
          for (const a of atoms) A.dot(a.x, a.y, { r: 3.6, color: a.side ? 'teal' : 'accent', fill: a.side ? 'teal' : 'accent' });
          const inView = ys.filter((y) => Math.abs(y) < Hh - 0.5);
          for (const y of inView) { const px = -sr * y, py = cr * y; A.dot(px, py, { r: 9, color: 'orange', hollow: true, width: 2.5 }); A.tex('\\perp', px, py + 0.05, { color: 'orange', size: 15 }); }
          A.line(-sr * -Hh, cr * -Hh, -sr * Hh, cr * Hh, { color: 'red', dash: [4, 5], alpha: 0.6 });
          info = { n: inView.length, meas: (Math.abs(aL - aR) * 180) / Math.PI, Dth: D, th: th.value, sp: inView.length > 1 ? (inView[inView.length - 1] - inView[0]) / (inView.length - 1) : null };
          // energy panel
          hB.set(th.value, gam(th.value / thm.value));
          B.fn((x) => gam(x / thm.value), { color: 'ink', width: 2.5, domain: [0.05, 32] });
          B.vline(thm.value, { color: 'muted', dash: [4, 4] }); B.text('$\\theta_m$', thm.value + 0.4, 0.06, { color: 'muted', size: 12, align: 'left' });
          B.fn((x) => (x / thm.value) * (1 - Math.log(1 / 1)) * 1, { color: 'faint', width: 1, dash: [3, 4], domain: [0, thm.value] });
          B.text('linear in $\\theta$ (no screening)', 9, 0.18, { color: 'faint', size: 10.5, align: 'left' });
          B.rect(Math.min(30, thm.value), 0, 32, 1.15, { fill: 'red', fillAlpha: 0.08, stroke: false });
          B.text('core overlap:', 31.5, 0.12, { color: 'red', size: 10.5, align: 'right' }); B.text('model fails', 31.5, 0.05, { color: 'red', size: 10.5, align: 'right' });
        });
        v.readout(() => {
          if (!info) return '';
          const G = 45e9, b = 0.2556e-9, nu = 0.34, gm = (G * b * ((thm.value * Math.PI) / 180)) / (4 * Math.PI * (1 - nu));
          const x = th.value / thm.value;
          return `Wall of ${info.n} edge dislocations with spacing $D=b/(2\\sin(\\theta/2))=${v.fix(info.Dth, 2)}\\,b$ (rounded to lattice rows: $${info.sp ? v.fix(info.sp, 2) : '-'}\\,b$ in the picture). The lattice rotation measured on the two sides is $${v.fix(info.meas, 2)}^\\circ$ against $\\theta=${v.fix(info.th, 1)}^\\circ$.\n$\\gamma/\\gamma_m=${v.fix(x * (1 - Math.log(x)), 3)}$ (for $G=45$ GPa, $b=0.256$ nm, $\\nu=0.34$, $\\theta_m=${v.fix(thm.value, 1)}^\\circ$: $\\gamma_m\\approx${v.fix(gm, 2)}$ J/m²${x > 1 ? '; beyond the peak the dislocation picture no longer applies' : ''}).`;
        });
      },
    },
  ],
};
