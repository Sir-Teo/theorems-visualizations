// Quantum Mechanics — Chapter 1: The quantum revolution (items 1.8–1.14)

// ---------- shared helpers (this part) ----------
/** Visible wavelength (nm) → [r, g, b]; null outside 380–750 nm. */
function wlRGB(nm) {
  if (!(nm >= 380 && nm <= 750)) return null;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (750 - nm) / 50 : 1;
  return [r, g, b].map((c) => Math.round(255 * Math.pow(c * f, 0.8)));
}
/** Deterministic uniform generator (mulberry32) from an integer seed. */
function hrand(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** de Broglie wavelength (m) of an electron accelerated through V volts (relativistic). */
function electronLambda(C, V) { const K = C.e * V, pc = Math.sqrt(K * K + 2 * K * C.me * C.c * C.c); return C.h * C.c / pc; }
const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
/** Inverse-CDF sampler on a grid: returns y(u) for a density given at grid points ys (uniform spacing). */
function sampler(ys, ps) {
  const n = ys.length, cdf = new Float64Array(n); let s = 0;
  for (let i = 1; i < n; i++) { s += 0.5 * (ps[i] + ps[i - 1]); cdf[i] = s; }
  return (u) => { const t = u * s; let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < t) lo = m; else hi = m; } const w = (t - cdf[lo]) / ((cdf[hi] - cdf[lo]) || 1); return ys[lo] + w * (ys[hi] - ys[lo]); };
}
/** Accumulated hit count at animation time t: single dots first, then faster and faster. */
const hitsAt = (t, nmax) => Math.min(nmax, Math.floor(2 * t + 0.8 * t * t * t));
/** Strongest periodicity of binned counts (centres yc, counts c) among periods in [pmin, pmax]: {period, power}. */
function periodogram(yc, c, pmin, pmax, n = 500) {
  let best = { period: NaN, power: 0 }, N = 0; for (const k of c) N += k;
  if (N < 2) return best;
  for (let i = 0; i <= n; i++) {
    const P = pmin * Math.pow(pmax / pmin, i / n), k = 2 * Math.PI / P; let re = 0, im = 0;
    for (let b = 0; b < yc.length; b++) { if (!c[b]) continue; re += c[b] * Math.cos(k * yc[b]); im += c[b] * Math.sin(k * yc[b]); }
    const pw = (re * re + im * im) / N; if (pw > best.power) best = { period: P, power: pw };
  }
  return best;
}

export default {
  collection: 'qm',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Phenomenon',
      name: 'Franck–Hertz experiment',
      credit: 'Franck & Hertz, 1914',
      statement: String.raw`Electrons accelerated through a dilute vapour of mercury by a voltage $U$ and collected behind a small retarding voltage give a current that rises with $U$ but drops sharply at regularly spaced voltages, $4.9$ V apart. Electrons collide elastically with the atoms (losing almost nothing) until their kinetic energy reaches $E_1=4.89$ eV; then they can give up exactly that amount, exciting the atom from its ground state to its first excited state, which re-emits it as ultraviolet light of wavelength $hc/E_1=253.7$ nm. Atoms therefore absorb energy from collisions only in fixed amounts: their energy levels are discrete, independently of any spectroscopy.`,
      idea: String.raw`An electron gains energy steadily in the field. As soon as it has $E_1$ it soon hits an atom and loses $E_1$, then starts gaining again; so the losses happen at the places where the potential has risen by $E_1, 2E_1, \dots$ — visible in neon as glowing layers. The current dips whenever the last excitation happens just before the grid, leaving the electron too little energy to climb the retarding voltage; adding $E_1$ to $U$ adds one more excitation, which is why the dips repeat every $E_1/e$ volts. Bohr (1.5) read this as direct proof of stationary states; the energy matches the 253.7 nm line, as the photon picture (1.3) requires.`,
      caption: String.raw`Press play to ramp the accelerating voltage (or pause and drag the gold marker on the curve). The current is a Monte Carlo of 300 electrons per voltage: free flights of random length, and an excitation costing exactly $E_1$ (with a probability that rises just above threshold) when an electron with enough energy hits an atom. The tube shows where excitations happen — one more glowing zone for every $E_1$ of voltage. The readout measures the spacing of the current maxima. Raise the vapour density to sharpen them; switch to neon (18.7 eV). **Break it:** let atoms absorb *any* amount of energy and the dips disappear.`,
      scope: String.raw`Needs a vapour dilute enough that electrons gain several eV between collisions, yet dense enough that an electron with $E\ge E_1$ soon collides. The first maximum is shifted by the contact potential between cathode and grid (≈ 2 V in real tubes, absent here); only the spacing measures $E_1$. Excitation of higher levels blurs the pattern at large voltages.`,
      deps: ['qm-1.5'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Franck%E2%80%93Hertz_experiment' },
      tags: ['energy levels', 'collisions'],
      viz(v) {
        const M = v.M, C = M.CONST, NE = 300, PEXC = 0.35, EW = 0.6, TS = 6;
        const GAS = { hg: { label: 'mercury', E1: 4.887, Vmax: 30, dV: 0.1, glow: 'purple' }, ne: { label: 'neon', E1: 18.7, Vmax: 80, dV: 0.25, glow: wlRGB(600) } };
        const gas = v.select('vapour', Object.entries(GAS).map(([value, G]) => ({ value, label: `${G.label} ($E_1 = ${G.E1 < 10 ? v.fix(G.E1, 2) : G.E1}$ eV)` })), 'hg');
        const dens = v.slider('vapour density $L/\\ell$', 20, 400, 100, { log: true, fmt: (x) => Math.round(x) + '' });
        const Vr = v.slider('retarding voltage', 0, 3, 1.5, { step: 0.05, fmt: (x) => `${x.toFixed(2)} V` });
        const cls = v.toggle('atoms absorb any amount (classical)', false);
        const tube = v.stage({ x: [-0.14, 1.36], y: [-0.55, 0.62], height: 230, axes: false, weight: 1, title: 'the tube: where atoms are excited' });
        const iv = v.stage({ x: [0, 30], y: [0, 1], height: 230, axes: 'box', xlabel: 'U (V)', weight: 1.2, title: 'collected current (arb. units) against accelerating voltage' });
        const hv = iv.handle(0, 0, { color: 'gold', r: 7, constrain: 'x' });
        hv.onDrag = (H) => { v.pause(); v.t = H.x / GAS[gas.value].Vmax * TS; };
        // one electron from cathode (x = 0) to grid (x = 1) at voltage U; returns its kinetic energy (eV) at the grid.
        // Free flights are exponential with mean ℓ = L/density; above E₁ a collision excites with probability PEXC·min(1, (E − E₁)/EW).
        const run = (U, r, G, lam, classical, exc) => {
          let K = -0.15 * Math.log(r() || 1e-12), x = 0;
          if (U < 1e-6) return K;
          for (let it = 0; it < 400; it++) {
            if (classical) {
              const xe = x - Math.log(r() || 1e-12) * lam / PEXC;
              if (xe >= 1) return K + U * (1 - x);
              K += U * (xe - x); x = xe; const loss = r() * K; K -= loss; if (exc) exc.push(x);
              continue;
            }
            const xs = x + Math.max(0, G.E1 - K) / U;
            if (xs >= 1) return K + U * (1 - x);
            K += U * (xs - x); x = xs; let hit = false;
            while (!hit) { const xe = x - Math.log(r() || 1e-12) * lam; if (xe >= 1) return K + U * (1 - x); K += U * (xe - x); x = xe; if (r() < PEXC * Math.min(1, (K - G.E1) / EW)) hit = true; }
            K -= G.E1; if (exc) exc.push(x);
          }
          return K;
        };
        let curve = null, ckey = null;
        const getCurve = () => {
          const G = GAS[gas.value], key = [gas.value, dens.value.toFixed(3), Vr.value, cls.value].join('|');
          if (key === ckey) return curve;
          const lam = 1 / dens.value, pts = [];
          for (let i = 0, U = 0; U <= G.Vmax + 1e-9; i++, U = i * G.dV) {
            const r = hrand(i * 7919 + 3); let ok = 0;
            for (let j = 0; j < NE; j++) if (run(U, r, G, lam, cls.value) > Vr.value) ok++;
            pts.push([U, ok / NE * Math.pow(U / G.Vmax, 1.5)]);
          }
          // maxima of the lightly smoothed curve
          const sm = pts.map((p, i) => { let s = 0, n = 0; for (let k = -3; k <= 3; k++) if (pts[i + k]) { s += pts[i + k][1]; n++; } return s / n; });
          const peaks = [];
          for (let i = 4; i < sm.length - 4; i++) if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] >= Math.max(...sm.slice(i - 4, i + 5))) {
            const lo = Math.min(...sm.slice(Math.min(i + 1, sm.length - 1), Math.min(sm.length, i + Math.round(0.6 * G.E1 / G.dV))));
            if (sm[i] - lo > 0.06 * sm[i] && (!peaks.length || pts[i][0] - peaks[peaks.length - 1] > 0.5 * G.E1)) peaks.push(pts[i][0]);
          }
          ckey = key; curve = { pts, peaks, ymax: Math.max(...pts.map((p) => p[1])) * 1.15 || 1 };
          return curve;
        };
        let st = null;
        v.animate((t) => {
          const G = GAS[gas.value], cv = getCurve(), U = Math.min(G.Vmax, G.Vmax * t / TS);
          if (!hv.dragging) hv.x = U;
          const Uc = hv.dragging ? hv.x : U;
          iv.setView([0, G.Vmax], [-0.05 * cv.ymax, cv.ymax]); hv.y = 0;
          iv.path(cv.pts, { color: 'faint', width: 1.2 });
          iv.path(cv.pts.filter((p) => p[0] <= Uc + 1e-9), { color: 'accent', width: 2.6 });
          if (!cls.value) cv.peaks.forEach((p, i) => { if (p <= Uc) { iv.vline(p, { color: 'green', dash: [4, 4], width: 1.1 }); iv.text(`${v.fix(p, 1)}`, p, cv.ymax * 1.0, { color: 'green', size: 11, align: 'center', dy: 4 }); } });
          // the tube: excitation density at the current voltage
          const lam = 1 / dens.value, r = hrand(12345), exc = [];
          for (let j = 0; j < 800; j++) run(Uc, r, G, lam, cls.value, exc);
          const NB = 90, hist = new Float64Array(NB); for (const x of exc) hist[Math.min(NB - 1, Math.floor(x * NB))]++;
          const hmax = Math.max(1, ...hist);
          tube.rect(0, -0.32, 1, 0.32, { fill: 'gray', fillAlpha: 0.06, color: 'faint', width: 1 });
          for (let b = 0; b < NB; b++) if (hist[b]) tube.rect(b / NB, -0.3, (b + 1) / NB, 0.3, { fill: G.glow, fillAlpha: 0.85 * Math.pow(hist[b] / hmax, 0.7), stroke: false });
          const zig = []; for (let i = 0; i <= 12; i++) zig.push([-0.02 + (i % 2 ? 0.025 : -0.025), -0.3 + 0.6 * i / 12]); tube.path(zig, { color: 'orange', width: 2 });
          tube.line(1, -0.36, 1, 0.36, { color: 'ink', width: 1.6, dash: [3, 3] });
          tube.rect(1.24, -0.36, 1.28, 0.36, { fill: 'muted', fillAlpha: 0.8, stroke: false });
          tube.text('cathode', -0.02, 0.44, { align: 'center', size: 11.5, color: 'ink' });
          tube.text('grid', 1, 0.44, { align: 'center', size: 11.5, color: 'ink' });
          tube.text('anode', 1.26, 0.44, { align: 'center', size: 11.5, color: 'ink' });
          tube.text(`U = ${v.fix(Uc, 1)} V`, 0.5, 0.44, { align: 'center', size: 12, color: 'accent', weight: 600 });
          tube.text(`− ${Vr.value.toFixed(1)} V`, 1.13, -0.44, { align: 'center', size: 11, color: 'muted' });
          if (!cls.value) for (let n = 1; n * G.E1 <= Uc; n++) { const x = n * G.E1 / Uc; tube.line(x, -0.38, x, -0.32, { color: 'ink', width: 1.4 }); tube.text(`${n}E₁`, x, -0.44, { align: 'center', size: 10.5, color: 'muted' }); }
          // electrons drifting through (animation cue)
          const dots = []; for (let i = 0; i < 16; i++) { const ph = (t * 0.45 + i / 16) % 1; dots.push([ph * 1.26, -0.24 + 0.48 * ((i * 0.618) % 1)]); }
          tube.dots(dots, { r: 2.6, color: 'accent' });
          const nexc = exc.length / 800;
          st = { G, U: Uc, peaks: cv.peaks, nexc };
        }, { still: 7.5, period: 9 });
        v.legend([['accent', 'current recorded so far'], ['faint', 'full sweep'], ['green', 'current maxima', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const pk = st.peaks, sp = pk.slice(1).map((p, i) => p - pk[i]), msp = sp.length ? M.mean(sp) : NaN;
          const head = `$U = ${v.fix(st.U, 1)}$ V: on average ${v.fix(st.nexc, 2)} excitations per electron. `;
          if (cls.value) return head + 'With atoms that can soak up any amount of energy the current rises smoothly: **no maxima**, nothing to measure.';
          return head + (sp.length ? `Maxima of the simulated current at ${pk.map((p) => v.fix(p, 1)).join(', ')} V → spacing **${v.fix(msp, 2)} V** (spread ${v.fix(sp.length > 1 ? M.stdev(sp) : 0, 2)} V) vs $E_1/e = ${st.G.E1}$ V. ` : 'Sweep further to see the maxima. ') + (st.G.E1 < 10 ? `Each excited mercury atom emits $\\lambda = hc/E_1 =$ ${M.si(C.h * C.c / (st.G.E1 * C.eV), 'm', 4)} (ultraviolet; drawn violet).` : 'Excited neon relaxes through orange-red lines (585–640 nm), so the excitation zones glow visibly.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Hypothesis',
      name: 'De Broglie matter waves',
      credit: 'de Broglie, 1924',
      statement: String.raw`**Hypothesis.** Every particle of momentum $p$ and energy $E$ is accompanied by a wave of wavelength and frequency
$$\lambda=\frac hp,\qquad f=\frac Eh,$$
the same relations as for photons (1.3). For a particle of mass $m$ at speed $v$, $p=\gamma mv$; an electron accelerated through a voltage $V$ has $\lambda=h/\sqrt{2m_eeV\,(1+eV/2m_ec^2)}\approx1.226\ \text{nm}/\sqrt{V/\text{volt}}$. In a Bohr orbit the condition $L=n\hbar$ is equivalent to fitting a whole number of wavelengths around the circumference, $2\pi r=n\lambda$. Wave effects are observable only when $\lambda$ is comparable to the structures the particle meets.`,
      idea: String.raw`De Broglie argued from relativity: if light, a wave, carries particle momentum $h/\lambda$, symmetry suggests that particles carry waves with the same relation, and the phase of such a wave is Lorentz invariant only if $f=E/h$ goes with $\lambda=h/p$. The payoff was Bohr's mysterious rule (1.5): for a circular orbit $L=pr=hr/\lambda$, so $L=n\hbar$ says $2\pi r=n\lambda$ — a standing wave closing on itself. Because $h$ is tiny, $\lambda$ is atomic-sized only for very light particles at modest speeds; for a thrown ball it is $10^{19}$ times smaller than a proton.`,
      caption: String.raw`Pick a particle and drag its speed. Top: its wavelength (gold) on a ruler of 37 powers of ten; the green band marks the spacings of atoms in crystals, which can diffract it. Bottom left: an electron wave wrapped around a Coulomb orbit — **drag the gold handle** to change the radius. Only at the Bohr radii $n^2a_0$ (dashed) does a whole number of wavelengths fit and the wave join itself smoothly; elsewhere the second lap (faint) is out of step. Bottom right: wavelength against speed for all four particles.`,
      deps: ['qm-1.3'],
      see: ['qm-1.5'],
      refs: ['Griffiths §1.6'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matter_wave' },
      tags: ['matter waves', 'wavelength'],
      viz(v) {
        const M = v.M, C = M.CONST;
        const PART = {
          e: { label: 'electron', m: C.me, v0: 4.358e6, vmin: 1e3, vmax: 2.99e8, color: 'accent' },
          n: { label: 'neutron', m: C.mn, v0: 2200, vmin: 1, vmax: 1e7, color: 'purple' },
          c60: { label: 'C₆₀ molecule', m: 720 * C.u, v0: 220, vmin: 1, vmax: 1e4, color: 'orange' },
          ball: { label: 'cricket ball', m: 0.16, v0: 40, vmin: 0.1, vmax: 60, color: 'red' },
        };
        const frac = (P, s) => Math.log(s / P.vmin) / Math.log(P.vmax / P.vmin), speed = (P, u) => P.vmin * Math.pow(P.vmax / P.vmin, u);
        let spd;
        const part = v.select('particle', Object.entries(PART).map(([value, P]) => ({ value, label: P.label })), 'e', { onChange: (k) => spd.set(frac(PART[k], PART[k].v0)) });
        spd = v.slider('speed', 0, 1, frac(PART.e, PART.e.v0), { step: 0.001, fmt: (u) => M.si(speed(PART[part.value], u), 'm/s') });
        const ru = v.stage({ x: [1e-36, 10], y: [0, 1], height: 165, axes: 'box', xlog: true, yticks: [], xlabel: 'length (m)', full: true });
        const orb = v.stage({ x: [-19, 19], y: [-19, 19], equal: true, height: 290, axes: false, weight: 1, title: 'electron wave on a Coulomb orbit' });
        const lv = v.stage({ x: [0.1, 3e8], y: [1e-37, 1e-3], height: 290, axes: 'box', xlog: true, ylog: true, xlabel: 'v (m/s)', ylabel: 'λ (m)', weight: 1.1, title: 'λ = h/(γmv)' });
        const hd = orb.handle(6.5, 0, { color: 'gold', r: 8, constrain: (x, y) => [M.clamp(Math.hypot(x, y), 0.5, 17.5), 0] });
        const lamOf = (m, s) => { const g = 1 / Math.sqrt(1 - (s / C.c) ** 2); return C.h / (g * m * s); };
        const MARKS = [[1.6e-35, 'Planck length', 'left'], [8.4e-16, 'proton'], [1e-10, 'atom'], [5.5e-7, 'visible light'], [8e-5, 'hair'], [0.072, 'cricket ball']];
        let st = null;
        v.render(() => {
          const P = PART[part.value], s = speed(P, spd.value), lam = lamOf(P.m, s), g = 1 / Math.sqrt(1 - (s / C.c) ** 2);
          // ruler
          ru.rect(1e-11, 0.36, 1e-9, 0.62, { fill: 'green', fillAlpha: 0.16, stroke: false });
          ru.text('atomic spacings', 1e-11, 0.56, { align: 'right', color: 'green', size: 10.5, dx: -4 });
          ru.line(1e-36, 0.45, 10, 0.45, { color: 'muted', width: 1.4 });
          MARKS.forEach(([L, name, al], i) => { ru.line(L, 0.4, L, 0.5, { color: 'ink', width: 1.4 }); ru.text(name, L, i % 2 ? 0.3 : 0.6, { align: al || 'center', color: 'muted', size: 11, dx: al ? -4 : 0 }); });
          ru.arrow(lam, 0.95, lam, 0.5, { color: 'gold', width: 3, head: 10 });
          ru.text(`λ = ${M.si(lam, 'm', 3)}`, lam, 0.88, { color: 'gold', size: 12.5, weight: 600, align: lam > 1e-6 ? 'right' : 'left', dx: lam > 1e-6 ? -8 : 8 });
          // orbit wave
          const r = hd.x, N = Math.sqrt(r), A = 0.9 + 0.06 * r;
          for (let n = 1; n <= 4; n++) { orb.circle(0, 0, n * n, { color: 'faint', dash: [4, 4], width: 1 }); orb.text(`n=${n}`, 0, n * n, { color: 'muted', size: 10.5, align: 'center', dy: -8 }); }
          orb.dot(0, 0, { r: 4, color: 'red' });
          orb.curve((p) => { const rr = r + A * Math.cos(N * p); return [rr * Math.cos(p), rr * Math.sin(p)]; }, 2 * Math.PI, 4 * Math.PI, { color: 'accent', width: 1.2, alpha: 0.35, n: 500 });
          orb.curve((p) => { const rr = r + A * Math.cos(N * p); return [rr * Math.cos(p), rr * Math.sin(p)]; }, 0, 2 * Math.PI, { color: 'accent', width: 2.4, n: 500 });
          const mis = Math.abs(N - Math.round(N));
          orb.corner(`2πr/λ = ${v.fix(N, 3)} wavelengths`, 'tl', { color: mis < 0.02 ? 'green' : 'red', weight: 600 });
          // lambda vs speed
          lv.rect(0.1, 1e-11, 3e8, 1e-9, { fill: 'green', fillAlpha: 0.14, stroke: false });
          for (const [k, Q] of Object.entries(PART)) {
            lv.fn((x) => (x >= Q.vmin && x <= Q.vmax ? lamOf(Q.m, x) : NaN), { color: Q.color, width: k === part.value ? 3 : 1.4, alpha: k === part.value ? 1 : 0.6 });
            const ex = k === 'e' ? Q.vmin : Q.vmax; lv.text(Q.label, ex, lamOf(Q.m, ex), { color: Q.color, size: 11, dx: 4, dy: -10 });
          }
          lv.dot(s, lam, { r: 6, color: 'gold' });
          const ve = Math.sqrt(C.e * C.e / (4 * Math.PI * C.eps0 * C.me * r * C.a0)), lame = C.h / (C.me * ve);
          st = { P, s, lam, g, K: (g - 1) * P.m * C.c * C.c, r, N, lame };
        });
        v.legend(Object.values(PART).map((P) => [P.color, P.label]).concat([['green', 'crystal-diffraction range', { area: true }]]));
        v.readout(() => st && `${st.P.label} at ${M.si(st.s, 'm/s', 3)} (kinetic energy ${M.si(st.K / C.eV, 'eV', 3)}${st.g - 1 > 1e-3 ? `, $\\gamma = ${v.fix(st.g, 3)}$` : ''}): $\\lambda = h/\\gamma mv =$ **${M.si(st.lam, 'm', 3)}** — ` + (st.lam > 3e-12 && st.lam < 3e-9 ? 'comparable to atomic spacings, so crystals diffract it (1.10).' : st.lam < 1e-20 ? `${v.sci(8.4e-16 / st.lam, 1)} times smaller than a proton: no slit could ever diffract it.` : st.lam > 3e-9 ? 'longer than atomic spacings: diffraction needs coarser gratings.' : 'shorter than atomic spacings: only nuclei would diffract it.') + ` Orbit: $r = ${v.fix(st.r, 2)}\\,a_0$, Coulomb speed gives $\\lambda =$ ${M.si(st.lame, 'm', 3)}, and $2\\pi r/\\lambda = \\sqrt{r/a_0} = ${v.fix(st.N, 3)}$ — whole numbers exactly at $r = n^2a_0$, Bohr's orbits.`);
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Davisson–Germer electron diffraction',
      credit: 'Davisson & Germer, 1927; G. P. Thomson, 1927',
      statement: String.raw`Electrons diffract from crystals exactly as X-rays of wavelength $\lambda=h/p$ would. Davisson and Germer fired 54 eV electrons perpendicularly at a nickel crystal and found a sharp peak of scattered electrons at $50^\circ$ from the beam, where the rows of surface atoms, $d=0.215$ nm apart, act as a reflection grating: $d\sin\theta=\lambda$ gives $\lambda=0.165$ nm, against $h/p=0.167$ nm. The peak moves with the accelerating voltage as $\lambda\propto V^{-1/2}$ requires, and is strongest where the layers below also reinforce it (Bragg's condition). G. P. Thomson, sending 10–60 keV electrons through thin polycrystalline foils, found concentric rings whose radii obey Bragg's law for the lattice planes, $2d_{hkl}\sin\theta=\lambda$.`,
      idea: String.raw`Each atom scatters a wavelet; in directions where the path differences between rows are whole wavelengths, the wavelets add (waves-7.10). With $\lambda=h/p$ from de Broglie (1.9) and $p=\sqrt{2meV}$, the condition $d\sin\theta=n\lambda$ fixes an angle for each voltage. A finite crystal of a few layers turns the condition into peaks of finite width, and the layer spacing modulates their height. In Thomson's foils the crystallites point every way, so each set of planes reflects into a cone: rings of radius $R\approx L\lambda/d_{hkl}$ on the screen. Particles without a wave would scatter into a smooth distribution with no preferred angles.`,
      caption: String.raw`**Davisson–Germer:** sweep the voltage and drag the detector (gold) around the arc, as they did. The polar curve is computed by adding the waves scattered from 16 rows × 5 layers of a simplified nickel lattice, plus a smooth diffuse background; the spur is the diffraction peak. Right: the positions $d\sin\theta$ of the peaks found in the computed pattern at each voltage (dots) fall on $h/p$ — and, above about 100 V, also on $2h/p$ (second order). **Thomson:** the ring pattern from a gold foil, with ring radii measured from the computed screen and compared with Bragg's law. **Break it:** treat the electrons as particles only — the spur and the rings vanish.`,
      deps: ['qm-1.9', 'waves-7.10'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Davisson%E2%80%93Germer_experiment' },
      tags: ['electron diffraction', 'matter waves'],
      viz(v) {
        const M = v.M, C = M.CONST, D = 0.215e-9, CL = 0.203e-9, NR = 16, NL = 5, AU = 0.4078e-9, LSCR = 0.3;
        const mode = v.select('experiment', [{ value: 'dg', label: 'Davisson–Germer (Ni crystal, reflection)' }, { value: 'gpt', label: 'G. P. Thomson (gold foil, transmission)' }], 'dg');
        const Vdg = v.slider('accelerating voltage', 20, 150, 54, { step: 0.5, fmt: (x) => `${x.toFixed(1)} V` });
        const Vkv = v.slider('accelerating voltage', 10, 80, 40, { step: 0.5, fmt: (x) => `${x.toFixed(1)} kV` });
        const part = v.toggle('particles only (no waves)', false);
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.25, 1.3], equal: true, height: 300, axes: false, weight: 1.1 });
        const B = v.stage({ x: [20, 150], y: [80, 290], height: 300, axes: 'box', weight: 1 });
        const det = A.handle(Math.sin(0.87), Math.cos(0.87), { color: 'gold', r: 8, constrain: (x, y) => { const a = M.clamp(Math.atan2(x, Math.max(y, -0.2)), -1.52, 1.52); return [1.12 * Math.sin(a), 1.12 * Math.cos(a)]; } });
        const coh = (lam, th) => { // normalized |lattice sum|² for scattering angle th (from the reversed beam)
          const k = 2 * Math.PI / lam, a = k * D * Math.sin(th), b = k * CL * (1 + Math.cos(th));
          const rows = Math.abs(Math.sin(NR * a / 2) / (NR * Math.sin(a / 2) || 1e-300)), r2 = Math.abs(Math.sin(a / 2)) < 1e-9 ? 1 : rows * rows;
          let re = 0, im = 0, w = 0; for (let l = 0; l < NL; l++) { const att = Math.exp(-l / 1.6); re += att * Math.cos(b * l); im += att * Math.sin(b * l); w += att; }
          return r2 * (re * re + im * im) / (w * w);
        };
        const inten = (lam, th, p) => 0.3 + 0.35 * Math.cos(th) + (p ? 0 : 0.5 * coh(lam, th) * Math.cos(th) ** 0.5);
        const peaksOf = (lam) => { const out = []; let a = coh(lam, 0.25), b = coh(lam, 0.26); for (let i = 2; i <= 600; i++) { const th = (14.3 + 70.7 * i / 600) * Math.PI / 180, c = coh(lam, th); if (b > a && b >= c && b > 0.12) out.push({ th: th - 70.7 / 600 * Math.PI / 180, c: b }); a = b; b = c; } return out; };
        const peakAngle = (lam) => { let best = 0, bt = 0; for (let i = 0; i <= 700; i++) { const th = (15 + 74 * i / 700) * Math.PI / 180, c = coh(lam, th); if (c > best) { best = c; bt = th; } } return { th: bt, c: best }; };
        const RINGS = [[1, 1, 1, 8], [2, 0, 0, 6], [2, 2, 0, 12], [3, 1, 1, 24], [2, 2, 2, 8], [4, 0, 0, 6]];
        let st = null, rcache = null;
        v.render(() => {
          const dg = mode.value === 'dg';
          Vdg.el.hidden = !dg; Vkv.el.hidden = dg; det.visible = dg;
          if (dg) {
            const V = Vdg.value, lam = electronLambda(C, V), p = part.value;
            A.setView([-1.3, 1.3], [-0.25, 1.3]); A.setTitle('scattered intensity against angle (polar plot)');
            let imax = 0; for (let i = -90; i <= 90; i++) imax = Math.max(imax, inten(lam, Math.abs(i) * Math.PI / 180, p));
            for (const a of [-60, -30, 0, 30, 60]) { const r = a * Math.PI / 180; A.line(0, 0, 1.0 * Math.sin(r), 1.0 * Math.cos(r), { color: 'grid', width: 1 }); A.text(`${Math.abs(a)}°`, 1.05 * Math.sin(r), 1.05 * Math.cos(r), { color: 'muted', size: 10, align: 'center' }); }
            A.curve((u) => [Math.sin(u), Math.cos(u)], -Math.PI / 2, Math.PI / 2, { color: 'faint', width: 1, dash: [3, 4] });
            const poly = []; for (let i = -900; i <= 900; i++) { const th = i / 10 * Math.PI / 180, r = 0.95 * inten(lam, Math.abs(th), p) / imax; poly.push([r * Math.sin(th), r * Math.cos(th)]); }
            A.poly([[0, 0], ...poly], { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
            A.rect(-1.25, -0.2, 1.25, 0, { fill: 'muted', fillAlpha: 0.35, stroke: false });
            for (let i = -12; i <= 12; i++) A.dot(i * 0.1, -0.05, { r: 2.2, color: 'muted', ring: false });
            A.text('nickel crystal', -1.2, -0.12, { color: 'ink', size: 11 });
            A.arrow(0, 1.28, 0, 0.04, { color: 'gold', width: 1.6, head: 8, dash: [5, 4] });
            A.text('electron beam', 0.03, 1.22, { color: 'muted', size: 11 });
            const thd = Math.atan2(det.x, det.y), Id = inten(lam, Math.abs(thd), p) / imax;
            A.line(0, 0, det.x, det.y, { color: 'gold', width: 1.2, dash: [2, 3] });
            // wavelength measured from the peak at each voltage
            B.o.xlabel = 'V (volts)'; B.o.ylabel = 'd sin θ (pm)'; B.setView([20, 150], [70, 300]); B.setTitle('peak positions $d\\sin\\theta$ vs $h/p$ and $2h/p$');
            B.fn((x) => electronLambda(C, x) * 1e12, { color: 'green', width: 2.2 });
            B.fn((x) => 2 * electronLambda(C, x) * 1e12, { color: 'green', width: 1.4, dash: [5, 4] });
            B.text('first order: λ', 140, electronLambda(C, 140) * 1e12, { color: 'green', size: 11, align: 'right', dy: -10 });
            B.text('second order: 2λ', 148, 2 * electronLambda(C, 148) * 1e12, { color: 'green', size: 11, align: 'right', dy: 12 });
            if (!p) for (let VV = 20; VV <= 150; VV += 2.5) for (const pk of peaksOf(electronLambda(C, VV))) B.dot(VV, D * Math.sin(pk.th) * 1e12, { r: 2 + 3 * Math.min(1, pk.c), color: 'accent', alpha: 0.35 + 0.65 * Math.min(1, pk.c) });
            B.dot(54, D * Math.sin(50 * Math.PI / 180) * 1e12, { r: 6, color: 'ink', hollow: true, label: '1927', labelPos: 'ne' });
            const pk = peakAngle(lam);
            if (!p) B.dot(V, D * Math.sin(pk.th) * 1e12, { r: 6, color: 'gold' });
            v.legend([['accent', 'computed scattering; peaks found in it'], ['green', 'de Broglie $\\lambda = h/p$ (and $2\\lambda$)'], ['gold', 'detector / this voltage', { dot: true }], ['ink', 'Davisson & Germer 1927', { dot: true }]]);
            st = { dg, V, lam, pk, thd, Id, p, ratio: pk.c };
          } else {
            const Vk = Vkv.value, lam = electronLambda(C, Vk * 1e3), p = part.value;
            A.setView([-25, 25], [-25, 25]); A.setTitle('fluorescent screen 30 cm behind the foil (mm)');
            const rings = RINGS.map(([h, k, l, m]) => { const N = h * h + k * k + l * l, d = AU / Math.sqrt(N), th = Math.asin(lam / (2 * d)); return { N, m, hkl: `${h}${k}${l}`, R: LSCR * Math.tan(2 * th) * 1e3, w: m / N }; });
            const prof = (r) => { let I = 1.6 * Math.exp(-r * r / (2 * 0.9 ** 2)) + 0.18 / (1 + (r / 6) ** 2); if (!p) for (const g of rings) I += 0.32 * g.w * Math.exp(-((r - g.R) ** 2) / (2 * 0.32 ** 2)); return I; };
            const bg = v.rgb('panel'), fg = v.rgb('green');
            A.raster((x, y) => { const I = Math.min(1, prof(Math.hypot(x, y))); return [0, 1, 2].map((i) => bg[i] + (fg[i] - bg[i]) * I); }, { key: `${Vk}|${p}|${bg}`, res: 2 });
            // measure ring radii from the computed radial profile
            const meas = []; let prev = prof(0), cur = prof(0.05);
            for (let r = 0.1; r < 24.9; r += 0.05) { const nx = prof(r); if (cur > prev && cur >= nx && r > 2.5 && cur - 0.18 / (1 + ((r - 0.05) / 6) ** 2) - 1.6 * Math.exp(-((r - 0.05) ** 2) / 1.62) > 0.05) meas.push(r - 0.05); prev = cur; cur = nx; }
            rings.forEach((g, i) => { if (g.R < 24 && !p) A.text(g.hkl, g.R * Math.cos(-0.6 - 0.25 * i), g.R * Math.sin(-0.6 - 0.25 * i), { color: 'ink', size: 10, align: 'center' }); });
            B.o.xlabel = '√(h²+k²+l²)'; B.o.ylabel = 'ring radius (mm)'; B.setView([1.4, 4.2], [0, 26]); B.setTitle('ring radii: measured vs Bragg’s law');
            B.fn((x) => LSCR * Math.tan(2 * Math.asin(lam * x / (2 * AU))) * 1e3, { color: 'green', width: 2 });
            const pairs = []; if (!p) meas.forEach((R) => { let bi = -1, bd = 1e9; rings.forEach((g, i) => { if (Math.abs(g.R - R) < bd) { bd = Math.abs(g.R - R); bi = i; } }); if (bi >= 0 && bd < 0.5) { pairs.push([Math.sqrt(rings[bi].N), R, rings[bi]]); B.dot(Math.sqrt(rings[bi].N), R, { r: 5, color: 'accent' }); } });
            const lamMeas = pairs.length ? M.mean(pairs.map(([sN, R]) => 2 * AU / sN * Math.sin(0.5 * Math.atan(R / 1e3 / LSCR)))) : NaN;
            v.legend([['green', 'screen glow / Bragg’s law with $\\lambda = h/p$'], ['accent', 'ring radii measured on the screen', { dot: true }]]);
            st = { dg, Vk, lam, lamMeas, pairs, p };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.dg) {
            const th = st.pk.th * 180 / Math.PI;
            return `$V = ${v.fix(st.V, 1)}$ V: $\\lambda = h/p =$ ${M.si(st.lam, 'm', 4)}. ` + (st.p ? 'Particles only: a smooth diffuse distribution, no peak at any voltage.' : `Peak of the computed pattern at **${v.fix(th, 1)}°** → $d\\sin\\theta =$ ${M.si(D * Math.sin(st.pk.th), 'm', 4)} (grating prediction $\\arcsin(\\lambda/d) = ${v.fix(Math.asin(Math.min(1, st.lam / D)) * 180 / Math.PI, 1)}°$); peak strength ${v.fix(100 * st.ratio, 0)} % of the ideal — largest near 54 V, where the layers also add in phase. `) + ` Detector at ${v.fix(Math.abs(st.thd) * 180 / Math.PI, 1)}°: current ${v.fix(100 * st.Id, 0)} % of maximum. Davisson & Germer (1927): 54 V, 50° → 0.165 nm.`;
          }
          return `${v.fix(st.Vk, 1)} kV electrons: $\\lambda = h/p =$ ${M.si(st.lam, 'm', 4)} (relativistic; the non-relativistic formula gives ${M.si(C.h / Math.sqrt(2 * C.me * C.e * st.Vk * 1e3), 'm', 4)}). ` + (st.p ? 'Particles only: a blurred central spot, no rings.' : `Rings found on the screen at ${st.pairs.map(([, R, g]) => `${v.fix(R, 2)} mm (${g.hkl})`).join(', ')}; Bragg's law on each gives $\\lambda =$ ${M.si(st.lamMeas, 'm', 4)}. Radii scale as $\\sqrt{h^2+k^2+l^2}$ and shrink as $V^{-1/2}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Double slit, one particle at a time',
      credit: 'Taylor, 1909; Jönsson, 1961; Merli, Missiroli & Pozzi, 1974; Tonomura et al., 1989',
      statement: String.raw`Send particles — photons, electrons, neutrons, even large molecules — through a pair of slits so slowly that only one is in the apparatus at a time. Each particle arrives at a single, unpredictable point of the screen. As the hits accumulate, their density builds the two-slit interference pattern
$$P_{12}(y)\propto\Big|\psi_1(y)+\psi_2(y)\Big|^2\propto\operatorname{sinc}^2\!\Big(\frac{\pi a y}{\lambda L}\Big)\cos^2\!\Big(\frac{\pi d y}{\lambda L}\Big),$$
with fringe spacing $\lambda L/d$ given by the de Broglie wavelength $\lambda=h/p$ (slit width $a$, separation $d$, screen distance $L$). With one slit closed the fringes disappear. In particular $P_{12}\neq P_1+P_2$: at a dark fringe, opening the second slit *lowers* the count to zero.`,
      idea: String.raw`Each particle's arrival point is random, but its probability density is the squared modulus of a wave that passes through both slits and interferes with itself, exactly like light in Young's experiment (waves-6.2) — the finite slits add the single-slit envelope (waves-7.8). Because the pattern builds up with one particle at a time, the interference cannot be between different particles. Adding probabilities, as for classical particles that go through one slit or the other, would give the smooth $P_1+P_2$; adding amplitudes gives the fringes. This is the phenomenon Feynman called "the only mystery" of quantum mechanics.`,
      caption: String.raw`Press play: electrons arrive one by one (the newest in gold), at first apparently at random, then in fringes. Each position is drawn from the computed $|\psi_1+\psi_2|^2$ (green); the histogram is the record. The readout finds the strongest periodicity in the hits and compares it with $\lambda L/d$. Change the voltage (wavelength) and slit separation. **Close a slit** and the same random numbers fall into a single smooth bump; the red dashed curve is what particles without waves would give with both open, $P_1+P_2$.`,
      deps: ['qm-1.9', 'waves-6.2', 'waves-7.8'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Double-slit_experiment' },
      tags: ['interference', 'wave-particle duality'],
      viz(v) {
        const M = v.M, C = M.CONST, A_SL = 0.25e-6, L = 1, NMAX = 12000, NB = 160;
        const slits = v.select('open', [{ value: 'both', label: 'both slits' }, { value: 'left', label: 'slit 1 only' }, { value: 'right', label: 'slit 2 only' }], 'both');
        const kv = v.slider('electron energy', 10, 100, 50, { step: 1, fmt: (x) => `${Math.round(x)} keV` });
        const ds = v.slider('slit separation $d$', 0.6, 3, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} μm` });
        const scr = v.stage({ x: [-50, 50], y: [0, 1], height: 160, axes: false, full: true, title: 'detector screen' });
        const hs = v.stage({ x: [-50, 50], y: [0, 1], height: 230, axes: 'box', xlabel: 'y (μm)', ylabel: 'hits per bin', full: true });
        const rng = v.rng(2024), U1 = Float64Array.from({ length: NMAX }, () => rng()), U2 = Float64Array.from({ length: NMAX }, () => rng());
        let cache = null, ckey = null;
        const model = () => {
          const key = [slits.value, kv.value, ds.value].join('|'); if (key === ckey) return cache;
          const lam = electronLambda(C, kv.value * 1e3), d = ds.value * 1e-6, W = 2.6 * lam * L / A_SL * 1e6, n = 2001, ys = [], P = [], P1 = [], P2 = [];
          for (let i = 0; i < n; i++) {
            const y = -W + 2 * W * i / (n - 1), q = Math.PI * y * 1e-6 / (lam * L), env = sinc(q * A_SL);
            const a1 = [env * Math.cos(-q * d), env * Math.sin(-q * d)], a2 = [env * Math.cos(q * d), env * Math.sin(q * d)]; // ψ_j ∝ sinc · e^{∓iπ d y/λL}
            const o1 = slits.value !== 'right', o2 = slits.value !== 'left';
            const re = (o1 ? a1[0] : 0) + (o2 ? a2[0] : 0), im = (o1 ? a1[1] : 0) + (o2 ? a2[1] : 0);
            ys.push(y); P.push(re * re + im * im); P1.push(env * env); P2.push(env * env);
          }
          const samp = sampler(ys, P), Y = Float64Array.from(U1, (u) => samp(u));
          let area = 0; for (let i = 1; i < n; i++) area += 0.5 * (P[i] + P[i - 1]) * (ys[i] - ys[i - 1]);
          cache = { lam, d, W, ys, P, P1, P2, area, Y, spacing: lam * L / d * 1e6, env: lam * L / A_SL * 1e6 }; ckey = key; return cache;
        };
        let st = null;
        v.animate((t) => {
          const m = model(), N = hitsAt(t, NMAX), W = m.W, dy = 2 * W / NB;
          scr.setView([-W, W], [0, 1]); hs.setView([-W, W], [0, 1]);
          const pts = []; for (let i = 0; i < N; i++) pts.push([m.Y[i], 0.06 + 0.88 * U2[i]]);
          scr.rect(-W, 0, W, 1, { fill: 'gray', fillAlpha: 0.05, stroke: false });
          scr.dots(pts, { r: N > 3000 ? 1.1 : N > 500 ? 1.5 : 2.2, color: 'ink', alpha: N > 3000 ? 0.45 : 0.7 });
          for (let i = Math.max(0, N - 3); i < N; i++) scr.dot(m.Y[i], 0.06 + 0.88 * U2[i], { r: 5, color: 'gold' });
          scr.corner(`${N} electron${N === 1 ? '' : 's'}`, 'tl', { color: 'ink', weight: 600 });
          // histogram + predictions
          const counts = new Float64Array(NB), yc = Float64Array.from({ length: NB }, (_, b) => -W + (b + 0.5) * dy);
          for (let i = 0; i < N; i++) { const b = Math.floor((m.Y[i] + W) / dy); if (b >= 0 && b < NB) counts[b]++; }
          const scale = N * dy / m.area, both = slits.value === 'both';
          let ymax = 0; for (let i = 0; i < m.P.length; i += 4) ymax = Math.max(ymax, m.P[i] * scale);
          ymax = Math.max(4, ymax * 1.25, ...counts);
          hs.setView([-W, W], [0, ymax]);
          hs.hist({ edges: Array.from({ length: NB + 1 }, (_, b) => -W + b * dy), counts }, { color: 'accent', fillAlpha: 0.3, width: 1 });
          hs.path(m.ys.map((y, i) => [y, m.P[i] * scale]), { color: 'green', width: 2 });
          if (both) hs.path(m.ys.map((y, i) => [y, (m.P1[i] + m.P2[i]) * scale]), { color: 'red', width: 1.6, dash: [6, 4] });
          const pg = periodogram(yc, counts, 0.04 * m.env, 0.6 * m.env);
          st = { N, m, pg, both };
        }, { still: 20, period: 30 });
        v.legend([['ink', 'individual hits', { dot: true }], ['accent', 'histogram of hits', { area: true }], ['green', 'predicted $N|\\psi|^2$ for the open slit(s)'], ['red', 'particles without waves: $P_1+P_2$', { dash: true }]]);
        v.readout(() => st && `${st.N} electron${st.N === 1 ? '' : 's'}, one at a time; each landed at a single random point. $\\lambda = h/p =$ ${M.si(st.m.lam, 'm', 3)}, $d =$ ${M.si(st.m.d, 'm', 3)}, $L = 1$ m. ` + (st.pg.power > 25 && st.N > 30
          ? `Strongest periodicity in the hits: **${v.fix(st.pg.period, 2)} μm**; $\\lambda L/d = ${v.fix(st.m.spacing, 2)}$ μm.`
          : st.both ? 'Too few hits yet to see a periodicity — keep going.' : `No periodicity (peak power ${v.fix(st.pg.power, 1)}, noise level ≈ 1–6): one slit gives a single smooth bump of width $\\approx 2\\lambda L/a = ${v.fix(2 * st.m.env, 0)}$ μm.`) + (st.both ? ' Note the dark fringes, where $P_1+P_2$ would still give plenty of hits.' : ''));
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'Which-path information erases fringes',
      credit: 'Einstein & Bohr, 1927; Feynman, 1965; Wootters & Zurek, 1979; Englert, 1996',
      statement: String.raw`If the passage through the slits leaves a record of the path — a marker in state $|m_1\rangle$ for slit 1 and $|m_2\rangle$ for slit 2 — the screen pattern becomes
$$P(y)=\tfrac12\big(|\psi_1|^2+|\psi_2|^2\big)+\operatorname{Re}\big(\langle m_2|m_1\rangle\,\psi_1\psi_2^{*}\big).$$
The fringe visibility equals the overlap, $\mathcal V=|\langle m_1|m_2\rangle|$, while the best possible guess of the path from the marker is right with probability $(1+\mathcal D)/2$, with distinguishability $\mathcal D=\sqrt{1-|\langle m_1|m_2\rangle|^2}$. Hence the duality relation
$$\mathcal V^2+\mathcal D^2=1\quad(\le1\ \text{for mixed markers}):$$
full path knowledge ($\mathcal D=1$) destroys the fringes completely, however gently the marker is attached. Reading the marker in a basis that reveals nothing about the path and sorting the hits by the result brings fringes back in the subsets (quantum eraser).`,
      idea: String.raw`With a marker the state is entangled, $\tfrac1{\sqrt2}(\psi_1|m_1\rangle+\psi_2|m_2\rangle)$, and the screen alone sees the sum of the probabilities over the marker's outcomes. Expanding $|\psi_1|m_1\rangle+\psi_2|m_2\rangle|^2$ leaves the cross term weighted by $\langle m_2|m_1\rangle$: orthogonal markers kill it, identical ones leave the two-slit pattern of 1.11. No disturbance of the particle's momentum needs to be invoked — the information itself is enough. Sorting by a marker measurement that does not reveal the path splits the hits into fringes and anti-fringes that add up to no fringes, since the screen's total cannot depend on what is done with the marker later.`,
      caption: String.raw`Photons pass two slits, each followed by a polarizer rotated by $\pm\alpha$ from horizontal; the polarization is the marker, with overlap $\cos2\alpha$. **Drag $\alpha$** from 0 (no information) to 45° (full information). Hits accumulate one photon at a time, coloured by a polarizing beam splitter at the screen: in *path* mode it tells slit 1 (orange) from slit 2 (purple) as well as quantum mechanics allows; in *eraser* mode it sorts horizontal (orange) from vertical (purple), which says nothing about the path. Right: visibility fitted to the hits against distinguishability calibrated with one slit blocked — the points stay on the circle $\mathcal V^2+\mathcal D^2=1$.`,
      deps: ['qm-1.11', 'waves-6.3'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave%E2%80%93particle_duality_relation' },
      tags: ['complementarity', 'interference'],
      viz(v) {
        const M = v.M, LAM = 633e-9, A_SL = 0.06e-3, D_SL = 0.3e-3, L = 1, NMAX = 12000, NB = 150, NCAL = 2000;
        const al = v.slider('polarizer angle $\\alpha$', 0, 45, 30, { step: 0.5, fmt: (x) => `${x.toFixed(1)}°` });
        const sort = v.select('sort hits by', [{ value: 'path', label: 'path detector (±45°)' }, { value: 'eraser', label: 'eraser (H / V)' }], 'path');
        const scr = v.stage({ x: [-25, 25], y: [0, 1], height: 150, axes: false, full: true, title: 'screen (each dot one photon)' });
        const hs = v.stage({ x: [-25, 25], y: [0, 1], height: 250, axes: 'box', xlabel: 'y (mm)', weight: 1.55, title: 'hits per bin: total and the two sorted subsets' });
        const dv = v.stage({ x: [0, 1.08], y: [0, 1.08], height: 250, axes: 'box', xlabel: 'D', ylabel: 'V', weight: 0.75, title: 'duality: $\\mathcal V^2+\\mathcal D^2=1$' });
        const rng = v.rng(77), U1 = Float64Array.from({ length: NMAX }, () => rng()), U2 = Float64Array.from({ length: NMAX }, () => rng()), UC = Float64Array.from({ length: NCAL }, () => rng());
        const W = 2.2 * LAM * L / A_SL * 1e3, ys = Array.from({ length: 1601 }, (_, i) => -W + 2 * W * i / 1600);
        const psi = (y) => { const q = Math.PI * y * 1e-3 / (LAM * L), env = sinc(q * A_SL); return [[env * Math.cos(-q * D_SL), env * Math.sin(-q * D_SL)], [env * Math.cos(q * D_SL), env * Math.sin(q * D_SL)]]; };
        const PS = ys.map(psi);
        let cache = null, ckey = null;
        const model = () => {
          const key = al.value + '|' + sort.value; if (key === ckey) return cache;
          const a = al.value * Math.PI / 180, m1 = [Math.cos(a), Math.sin(a)], m2 = [Math.cos(a), -Math.sin(a)], s = Math.SQRT1_2;
          const basis = sort.value === 'path' ? [[s, s], [s, -s]] : [[1, 0], [0, 1]];
          const Pe = basis.map((e) => { const c1 = (e[0] * m1[0] + e[1] * m1[1]) * s, c2 = (e[0] * m2[0] + e[1] * m2[1]) * s; return PS.map(([p1, p2]) => { const re = c1 * p1[0] + c2 * p2[0], im = c1 * p1[1] + c2 * p2[1]; return re * re + im * im; }); });
          const P = Pe[0].map((x, i) => x + Pe[1][i]), samp = sampler(ys, P);
          let area = 0; for (let i = 1; i < ys.length; i++) area += 0.5 * (P[i] + P[i - 1]) * (ys[i] - ys[i - 1]);
          const Y = Float64Array.from(U1, (u) => samp(u)), O = new Uint8Array(NMAX);
          for (let i = 0; i < NMAX; i++) { const j = Math.min(ys.length - 1, Math.max(0, Math.round((Y[i] + W) / (2 * W) * 1600))); O[i] = U2[i] * P[j] < Pe[0][j] ? 0 : 1; }
          // calibration: slit 2 blocked, how often does the path detector say "slit 1"?
          const pL = (Math.cos(a) + Math.sin(a)) ** 2 / 2; let k = 0; for (const u of UC) if (u < pL) k++;
          cache = { P, Pe, area, Y, O, Dcal: 2 * k / NCAL - 1, Dth: Math.sin(2 * a), Vth: Math.cos(2 * a) }; ckey = key; return cache;
        };
        // visibility by least squares: counts ≈ env·(A + B cos ky + S sin ky)
        const fitV = (yc, c) => {
          const kq = 2 * Math.PI * D_SL / (LAM * L) * 1e-3, G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
          yc.forEach((y, i) => { const e = sinc(Math.PI * y * 1e-3 * A_SL / (LAM * L)) ** 2, f = [e, e * Math.cos(kq * y), e * Math.sin(kq * y)]; for (let r = 0; r < 3; r++) { b[r] += f[r] * c[i]; for (let q = 0; q < 3; q++) G[r][q] += f[r] * f[q]; } });
          const x = M.solve(G, b); return x && x[0] > 0 ? Math.hypot(x[1], x[2]) / x[0] : NaN;
        };
        let st = null;
        v.animate((t) => {
          const m = model(), N = hitsAt(t, NMAX), dy = 2 * W / NB, COL = ['orange', 'purple'];
          scr.setView([-W, W], [0, 1]);
          for (const o of [0, 1]) { const pts = []; for (let i = 0; i < N; i++) if (m.O[i] === o) pts.push([m.Y[i], 0.06 + 0.88 * U2[(i * 7) % NMAX]]); scr.dots(pts, { r: N > 3000 ? 1.1 : N > 500 ? 1.5 : 2.2, color: COL[o], alpha: 0.7 }); }
          scr.corner(`${N} photons`, 'tl', { color: 'ink', weight: 600 });
          const edges = Array.from({ length: NB + 1 }, (_, b) => -W + b * dy), yc = edges.slice(0, NB).map((e) => e + dy / 2);
          const cnt = [new Float64Array(NB), new Float64Array(NB)];
          for (let i = 0; i < N; i++) { const b = Math.floor((m.Y[i] + W) / dy); if (b >= 0 && b < NB) cnt[m.O[i]][b]++; }
          const tot = cnt[0].map((x, i) => x + cnt[1][i]), scale = N * dy / m.area;
          let ymax = 4; for (let i = 0; i < ys.length; i += 4) ymax = Math.max(ymax, m.P[i] * scale * 1.2); ymax = Math.max(ymax, ...tot);
          hs.setView([-W, W], [0, ymax]);
          hs.hist({ edges, counts: tot }, { color: 'muted', fillAlpha: 0.18, width: 1 });
          hs.hist({ edges, counts: cnt[0] }, { color: 'orange', fillAlpha: 0, width: 1.4 });
          hs.hist({ edges, counts: cnt[1] }, { color: 'purple', fillAlpha: 0, width: 1.4 });
          hs.path(ys.map((y, i) => [y, m.P[i] * scale]), { color: 'green', width: 2 });
          const Vm = N > 200 ? fitV(yc, tot) : NaN;
          // duality plane
          dv.curve((u) => [Math.sin(u), Math.cos(u)], 0, Math.PI / 2, { color: 'green', width: 2 });
          dv.dot(m.Dth, m.Vth, { r: 6, color: 'muted', hollow: true });
          if (isFinite(Vm)) dv.dot(Math.max(0, m.Dcal), Vm, { r: 6, color: 'gold' });
          const V0 = [0, 1].map((o) => (N > 400 ? fitV(yc, Array.from(cnt[o])) : NaN));
          st = { N, m, Vm, V0 };
        }, { still: 20, period: 30 });
        v.legend([['orange', 'detector outcome 1 (slit 1 / H)'], ['purple', 'outcome 2 (slit 2 / V)'], ['muted', 'all hits', { area: true }], ['green', 'predicted total'], ['gold', 'measured (D, V)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, Vm, V0 } = st, path = sort.value === 'path';
          return `Marker overlap $\\cos2\\alpha = ${v.fix(m.Vth, 3)}$. Calibration with slit 2 blocked (${NCAL} photons): the path detector says “slit 1” ${v.fix(50 * (1 + m.Dcal), 1)} % of the time → $\\mathcal D = ${v.fix(m.Dcal, 3)}$ (theory $\\sin2\\alpha = ${v.fix(m.Dth, 3)}$). Visibility fitted to the ${st.N} hits: ` + (isFinite(Vm) ? `$\\mathcal V = ${v.fix(Vm, 3)}$, so $\\mathcal V^2+\\mathcal D^2 = ${v.fix(Vm * Vm + m.Dcal * m.Dcal, 3)}$. ` : 'collecting… ') + (isFinite(V0[0]) ? (path ? `Sorted by path, each subset has visibility ${v.fix(V0[0], 2)} / ${v.fix(V0[1], 2)}.` : `Sorted by H / V: visibility ${v.fix(V0[0], 2)} / ${v.fix(V0[1], 2)} — fringes and anti-fringes that cancel in the total.`) : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Phenomenon',
      name: 'Stern–Gerlach experiment',
      credit: 'Stern & Gerlach, 1922',
      statement: String.raw`A beam of neutral silver atoms passing through an inhomogeneous magnetic field is deflected by the force $F_z=\mu_z\,\partial B_z/\partial z$ on each atom's magnetic moment. If the moments were classical arrows pointing in random directions, $\mu_z$ would take every value between $-\mu$ and $\mu$ and the beam would spread into a continuous band. Instead the beam splits into **two** separate spots, symmetric about the undeflected position, corresponding to $\mu_z=\pm\mu_B$ (the Bohr magneton, $9.27\times10^{-24}$ J/T) — whichever direction the field gradient is turned to. The component of the moment along any axis is quantized and takes just two values: the silver atom has angular momentum $\hbar/2$ (spin ½, recognized in 1925–27).`,
      idea: String.raw`The gradient force on a dipole (em-7.18) pushes an atom up or down in proportion to $\mu_z$, and the deflection at the plate is $z=\mu_z\,G\,L^2/2mv^2$ for a magnet of length $L$ and gradient $G$; averaged over the thermal speeds of an oven at temperature $T$ it is $\bar z=\mu_zGL^2/4kT$. Two spots mean $\mu_z$ has two values only. Stern and Gerlach set out to test Bohr–Sommerfeld "space quantization" (1.5, 1.7) for an orbital angular momentum $\hbar$, which they believed would give two spots as well; in fact silver's ground state has zero orbital angular momentum, and the two spots come from the electron's spin, with $g\approx2$ making the moment one full magneton.`,
      caption: String.raw`Silver atoms from a 1320 K oven fly through a 3.5 cm magnet onto a plate (atoms accumulate as you watch). Left: side view of sampled trajectories, with the vertical scale stretched about 150× (atoms that hit a pole piece are lost). Middle: the plate — the gradient is strongest at the centre of the slit, so the two traces bulge into the famous "lips" of their 1922 postcard. Bottom: deflections of atoms near the slit centre, compared with $\pm\bar z$. Rotate the magnet: still two spots, along the new axis. **Break it:** switch to classical moments and the gap fills in.`,
      deps: ['em-7.18', 'qm-1.5'],
      refs: ['Sakurai ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stern%E2%80%93Gerlach_experiment' },
      tags: ['spin', 'space quantization'],
      viz(v) {
        const M = v.M, C = M.CONST, MAG = 107.8682 * C.u, TOV = 1320, LM = 0.035, WS = 0.4, SIG0 = 0.012, NMAX = 6000;
        const model = v.select('magnetic moments', [{ value: 'q', label: 'quantum (observed)' }, { value: 'c', label: 'classical arrows' }], 'q');
        const ang = v.slider('magnet orientation', 0, 180, 0, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const Gs = v.slider('field gradient $\\partial B_z/\\partial z$', 100, 1500, 1000, { step: 10, fmt: (x) => `${Math.round(x)} T/m` });
        const side = v.stage({ x: [0, 1], y: [-1, 1], height: 260, axes: false, weight: 1.25, title: 'side view (vertical scale stretched ×150)' });
        const plate = v.stage({ x: [-0.62, 0.62], y: [-0.62, 0.62], equal: true, height: 260, axes: false, weight: 0.85, title: 'the plate (mm)' });
        const hz = v.stage({ x: [-0.6, 0.6], y: [0, 1], height: 160, axes: 'box', yticks: [], full: true, title: 'deflection along the gradient (mm), atoms near the slit centre' });
        const rng = v.rng(1922), alpha = Math.sqrt(2 * C.kB * TOV / MAG);
        const atoms = Array.from({ length: NMAX }, () => { const v0 = alpha * Math.sqrt(-Math.log((rng() || 1e-12) * (rng() || 1e-12))), s = 2 * rng() - 1, z0 = SIG0 * Math.sqrt(-2 * Math.log(rng() || 1e-12)) * Math.cos(2 * Math.PI * rng()), u = rng(); return { v0, s, z0, u }; });
        let st = null;
        v.animate((t) => {
          const N = Math.min(NMAX, Math.floor(40 * t * t + 5 * t)), G = Gs.value, phi = ang.value * Math.PI / 180, q = model.value === 'q';
          const gax = [Math.sin(phi), Math.cos(phi)], sax = [Math.cos(phi), -Math.sin(phi)];
          const defl = (a) => { const mz = q ? (a.u < 0.5 ? 1 : -1) : 2 * a.u - 1; return mz * C.muB * G * (1 - a.s * a.s) * LM * LM / (2 * MAG * a.v0 * a.v0) * 1e3; }; // mm
          // ---- side view (along the gradient axis, magnified)
          const X0 = 0.08, XM0 = 0.4, XM1 = 0.88, XP = 0.9, MAGN = 2, TOP = 0.62, BOT = -0.7; // MAGN: stage units per mm of deflection
          side.rect(0.0, -0.18, 0.07, 0.18, { fill: 'orange', fillAlpha: 0.7, stroke: false }); side.text('oven', 0.035, -0.28, { align: 'center', size: 11, color: 'ink' });
          for (const x of [0.17, 0.27]) { side.line(x, 0.08, x, 0.6, { color: 'ink', width: 3 }); side.line(x, -0.08, x, -0.6, { color: 'ink', width: 3 }); }
          side.poly([[XM0, 0.98], [XM1, 0.98], [XM1, TOP], [XM0, TOP]], { fill: 'muted', fillAlpha: 0.45, stroke: false });
          side.poly([[XM0, -0.98], [XM1, -0.98], [XM1, BOT], [XM0, BOT]], { fill: 'muted', fillAlpha: 0.45, stroke: false });
          side.text('N (knife edge)', (XM0 + XM1) / 2, 0.8, { align: 'center', color: 'ink', size: 11.5, weight: 600 }); side.text('S (groove)', (XM0 + XM1) / 2, -0.84, { align: 'center', color: 'ink', size: 11.5, weight: 600 });
          side.line(XP, -0.95, XP, 0.95, { color: 'ink', width: 3 }); side.text('plate', XP, 0.98, { align: 'center', size: 11, color: 'ink', baseline: 'top' });
          for (let i = 0; i < 46; i++) {
            const a = atoms[i], zt = defl(a) * MAGN, path = [];
            for (let k = 0; k <= 50; k++) { const x = X0 + (XP - X0) * k / 50, f = M.clamp((x - XM0) / (XM1 - XM0), 0, 1), z = zt * f * f + a.z0 * MAGN; path.push([x, z]); if (z > TOP || z < BOT) break; }
            side.path(path, { color: q ? (a.u < 0.5 ? 'accent' : 'red') : 'purple', width: 1, alpha: 0.5 });
          }
          side.corner(`view along the gradient axis (turned ${Math.round(ang.value)}°)`, 'bl', { color: 'muted', size: 11 });
          // ---- plate
          plate.circle(0, 0, 0.6, { color: 'faint', width: 1 });
          plate.line(-0.6 * gax[0], -0.6 * gax[1], 0.6 * gax[0], 0.6 * gax[1], { color: 'faint', dash: [4, 4], width: 1 });
          plate.tex('+\\mu_B', 0.5 * gax[0], 0.5 * gax[1], { color: 'muted', size: 12 }); plate.tex('-\\mu_B', -0.5 * gax[0], -0.5 * gax[1], { color: 'muted', size: 12 });
          const hits = [], cen = []; let near = 0, nearC = 0;
          for (let i = 0; i < N; i++) {
            const a = atoms[i], z = defl(a) + a.z0, sx = a.s * WS; hits.push([sx * sax[0] + z * gax[0], sx * sax[1] + z * gax[1]]);
            if (Math.abs(a.s) < 0.25) { cen.push(z); if (Math.abs(z) < 0.025) near++; const zc = (2 * a.u - 1) * C.muB * G * (1 - a.s * a.s) * LM * LM / (2 * MAG * a.v0 * a.v0) * 1e3 + a.z0; if (Math.abs(zc) < 0.025) nearC++; }
          }
          plate.dots(hits, { r: N > 2500 ? 1.1 : 1.6, color: 'ink', alpha: 0.5 });
          plate.corner(`${N} atoms`, 'tl', { color: 'ink', weight: 600 });
          // ---- histogram of central deflections
          const zbar = C.muB * G * LM * LM * (1 - 0.25 * 0.25 / 3) / (4 * C.kB * TOV) * 1e3;
          hz.setView([-0.6, 0.6], [0, 1]);
          const Hd = M.histogram(cen, { bins: 80, range: [-0.6, 0.6] }), hmax = Math.max(1, ...Hd.counts);
          hz.hist({ edges: Hd.edges, counts: Hd.counts.map((c) => c / hmax * 0.9) }, { color: q ? 'accent' : 'purple', fillAlpha: 0.35 });
          for (const sgn of [-1, 1]) { hz.vline(sgn * zbar, { color: 'green', dash: [5, 4], width: 1.6 }); hz.text(sgn > 0 ? '+z̄' : '−z̄', sgn * zbar, 0.95, { color: 'green', size: 11, align: 'center' }); }
          const up = cen.filter((z) => z > 0), dn = cen.filter((z) => z < 0);
          const split = up.length > 2 && dn.length > 2 ? M.mean(up) - M.mean(dn) : NaN, se = up.length > 2 && dn.length > 2 ? Math.sqrt(M.variance(up) / up.length + M.variance(dn) / dn.length) : NaN;
          st = { N, split, se, zbar, near: cen.length ? near / cen.length : NaN, nearC: cen.length ? nearC / cen.length : NaN, q, ncen: cen.length };
        }, { still: 12, period: 16 });
        v.legend([['accent', 'atoms with $\\mu_z = +\\mu_B$'], ['red', '$\\mu_z = -\\mu_B$'], ['purple', 'classical moments'], ['green', 'predicted $\\pm\\bar z = \\pm\\mu_BGL^2/4kT$', { dash: true }]]);
        v.readout(() => st && `Near the slit centre (${st.ncen} atoms): separation of the mean deflections of the two halves **${v.fix(st.split * 1e3, 0)} ± ${v.fix(st.se * 1e3, 0)} μm** vs $2\\bar z = ${v.fix(2 * st.zbar * 1e3, 0)}$ μm` + (st.q ? ` → $|\\mu_z| = (${v.fix(st.split / (2 * st.zbar), 2)} \\pm ${v.fix(st.se / (2 * st.zbar), 2)})\\,\\mu_B$, $\\mu_B = ${v.sci(C.muB, 4)}$ J/T. ` : ' (for classical arrows this mean has no sharp meaning). ') + `Landing within ±25 μm of the centre line: **${v.fix(100 * st.near, 1)} %**` + (st.q ? ` — classical arrows would put ${v.fix(100 * st.nearC, 1)} % there.` : ' — the classical band fills the middle, where Stern and Gerlach saw a gap.'));
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Phenomenon',
      name: 'Sequential Stern–Gerlach experiments',
      credit: 'Frisch & Segrè, 1933; Feynman, 1965 (as a thought experiment)',
      statement: String.raw`Pass the atoms of one output beam of a Stern–Gerlach magnet through further magnets.
(a) Repeating the same measurement gives the same result: atoms selected as $z+$ all come out $z+$ again.
(b) An atom prepared as $+$ along $\hat m$ and analysed along $\hat n$ comes out $+$ with probability $\cos^2(\theta/2)$, where $\theta$ is the angle between $\hat m$ and $\hat n$; in particular $1/2$ for perpendicular axes.
(c) Measurement disturbs: select $z+$, then $x+$, then measure $z$ again — half the atoms are now $z-$. The intermediate $x$ measurement destroyed the earlier $z$ information; there is no hidden list of definite values of $\mu_x$ and $\mu_z$ carried by each atom that the magnets simply read.`,
      idea: String.raw`The outcomes of 1.13 are random, but their probabilities are fixed by the angle between the preparation and analysis axes. A state with only two outcomes along every axis is a two-component (spin-½) state, pictured as a point on the Bloch sphere; an analyser along $\hat n$ projects it onto $\pm\hat n$ with probability $(1\pm\hat s\cdot\hat n)/2=\cos^2(\theta/2)$ or $\sin^2(\theta/2)$, and leaves it there. Because projection onto $x$ replaces the state, a later $z$ measurement starts afresh. These are exactly the rules the postulates of quantum mechanics will formalize; the Bloch-sphere picture is the qubit of quantum information.`,
      caption: String.raw`Three magnets in a row; **click any output port** to block or open it (red bars are blocks). The middle magnet's axis is tilted by $\theta$ from $z$ in the $x$–$z$ plane. Each run follows 5000 atoms through the chain with random outcomes; beam widths and counts are the simulated ones. Left: the Bloch sphere — the state after the first magnet (blue) is replaced by the state after the second (green). Right: final counts against the predictions $\cos^2(\theta/2)$, $\sin^2(\theta/2)$ with ±1σ sampling bars. Block the $x+$ output and open $x-$; or set $\theta=0$ to see repeatability.`,
      deps: ['qm-1.13'],
      refs: ['Sakurai ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stern%E2%80%93Gerlach_experiment#Sequential_experiments' },
      tags: ['spin', 'measurement'],
      viz(v) {
        const M = v.M, NA = 5000, Q = v.quantum();
        const th = v.slider('2nd magnet axis $\\theta$ (from $z$)', 0, 180, 90, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const ax3 = v.select('3rd magnet axis', [{ value: 0, label: '$\\hat z$' }, { value: 90, label: '$\\hat x$' }], 0);
        let seed = 7;
        v.button('Run again', () => { seed++; });
        const chain = v.stage({ x: [0, 10], y: [-1.45, 1.45], height: 220, axes: false, full: true, title: 'click an output port to block or open it' });
        const s3 = v.stage3d({ height: 270, range: 1.6, weight: 1, pitch: 0.3, yaw: -0.9 });
        const bar = v.stage({ x: [0.3, 2.7], y: [0, 1], height: 270, axes: 'box', xticks: [[1, '+'], [2, '−']], ylabel: 'atoms', weight: 1, title: 'third magnet: counts vs prediction' });
        const block = { '1+': false, '1-': true, '2+': false, '2-': true };
        const BOX = [[1.2, 2.5], [4.1, 5.4], [7.0, 8.3]], PORT_X = [3.15, 6.05];
        chain.onClick((x, y) => { for (let k = 0; k < 2; k++) if (Math.abs(x - PORT_X[k]) < 0.45) { const key = `${k + 1}${y > 0 ? '+' : '-'}`; if (Math.abs(Math.abs(y) - 0.62) < 0.45) block[key] = !block[key]; } });
        const axisV = (deg) => { const a = deg * Math.PI / 180; return [Math.sin(a), 0, Math.cos(a)]; };
        const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        let st = null;
        v.render(() => {
          const axes = [axisV(0), axisV(th.value), axisV(+ax3.value)];
          // Monte Carlo: each atom a random pure state (unpolarized beam); each magnet projects onto ±n with probability (1 ± s·n)/2
          const r = hrand(seed * 1000 + 1), cnt = { '1+': 0, '1-': 0, '2+': 0, '2-': 0, '3+': 0, '3-': 0 };
          for (let i = 0; i < NA; i++) {
            const cz = 2 * r() - 1, ph = 2 * Math.PI * r(), sz = Math.sqrt(1 - cz * cz); let s = [sz * Math.cos(ph), sz * Math.sin(ph), cz], alive = true;
            for (let k = 0; k < 3 && alive; k++) { const n = axes[k], plus = r() < (1 + dot3(s, n)) / 2; s = plus ? n : n.map((c) => -c); const key = `${k + 1}${plus ? '+' : '-'}`; cnt[key]++; if (k < 2 && block[key]) alive = false; }
          }
          // exact expectation: propagate beams (weight, Bloch vector)
          let beams = [[NA, [0, 0, 0]]]; const exp = {};
          for (let k = 0; k < 3; k++) { const n = axes[k], next = []; let ep = 0, em = 0; for (const [w, s] of beams) { const pp = (1 + dot3(s, n)) / 2; ep += w * pp; em += w * (1 - pp); if (k === 2 || !block[`${k + 1}+`]) next.push([w * pp, n]); if (k === 2 || !block[`${k + 1}-`]) next.push([w * (1 - pp), n.map((c) => -c)]); } exp[`${k + 1}+`] = ep; exp[`${k + 1}-`] = em; beams = next; }
          // ---- chain drawing
          const wOf = (c) => 0.6 + 7 * Math.sqrt(c / NA);
          chain.line(0.5, 0, BOX[0][0], 0, { color: 'accent', width: wOf(NA), alpha: 0.6 });
          chain.rect(0.15, -0.3, 0.5, 0.3, { fill: 'orange', fillAlpha: 0.75, stroke: false }); chain.text('oven', 0.33, -0.48, { align: 'center', size: 11, color: 'ink' });
          const labels = ['$\\hat z$', `$\\theta = ${Math.round(th.value)}^\\circ$`, +ax3.value ? '$\\hat x$' : '$\\hat z$'];
          BOX.forEach(([x0, x1], k) => { chain.rect(x0, -0.5, x1, 0.5, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 }); chain.tex(`\\text{SG}_{${k + 1}}`, (x0 + x1) / 2, 0.15, { size: 14 }); chain.tex(labels[k].replace(/\$/g, ''), (x0 + x1) / 2, -0.2, { size: 12.5, color: 'muted' }); });
          for (let k = 0; k < 3; k++) {
            const x1 = BOX[k][1], xNext = k < 2 ? BOX[k + 1][0] : 9.6;
            for (const sg of ['+', '-']) {
              const key = `${k + 1}${sg}`, y = sg === '+' ? 0.62 : -0.62, c = cnt[key], blocked = k < 2 && block[key];
              if (c > 0) {
                chain.line(x1, sg === '+' ? 0.15 : -0.15, x1 + 0.4, y, { color: 'accent', width: wOf(c), alpha: 0.6 });
                if (k < 2) { const xe = blocked ? PORT_X[k] : xNext; chain.line(x1 + 0.4, y, blocked ? xe : xe - 0.3, y, { color: 'accent', width: wOf(c), alpha: 0.6 }); if (!blocked) chain.line(xe - 0.3, y, xe, sg === '+' ? 0.12 : -0.12, { color: 'accent', width: wOf(c), alpha: 0.6 }); }
                else chain.line(x1 + 0.4, y, 9.35, y, { color: 'accent', width: wOf(c), alpha: 0.6 });
              }
              if (k < 2) { chain.rect(PORT_X[k] - 0.07, y - 0.32, PORT_X[k] + 0.07, y + 0.32, blocked ? { fill: 'red', fillAlpha: 0.9, stroke: false } : { color: 'faint', width: 1, dash: [3, 3] }); }
              else chain.rect(9.35, y - 0.25, 9.6, y + 0.25, { fill: 'ink', fillAlpha: 0.8, stroke: false });
              chain.text(`${sg === '+' ? '+' : '−'} ${c}`, k < 2 ? PORT_X[k] + 0.17 : 9.3, y + (sg === '+' ? 0.42 : -0.42), { size: 11.5, color: blocked ? 'red' : 'ink', align: k < 2 ? 'left' : 'right', weight: 600 });
            }
          }
          // ---- Bloch sphere: preparation and analysis axes, and the states after SG1 and SG2
          const after1 = !block['1+'] && block['1-'] ? axes[0] : block['1+'] && !block['1-'] ? axes[0].map((c) => -c) : [0, 0, 0];
          const after2 = !block['2+'] && block['2-'] ? axes[1] : block['2+'] && !block['2-'] ? axes[1].map((c) => -c) : [0, 0, 0];
          const extra = [{ v: axes[1].map((c) => 1.25 * c), color: 'orange', label: '\\hat n' }];
          if (Math.hypot(...after1) > 0.5) extra.push({ v: after1, color: 'accent', label: '1' });
          Q.bloch(s3, after2, { labels: false, color: 'green', extra, project: false });
          s3.tex('+z', [0, 0, 1.38], { color: 'muted', size: 12 }); s3.tex('+x', [1.25, 0, -0.22], { color: 'muted', size: 12 }); s3.tex('-z', [0, 0, -1.38], { color: 'muted', size: 12 });
          // ---- final counts
          const n3 = cnt['3+'] + cnt['3-'], e3 = exp['3+'] + exp['3-'];
          const top = Math.max(10, 1.25 * Math.max(cnt['3+'], cnt['3-'], n3 / 2)); bar.setView([0.3, 2.7], [-0.07 * top, top]);
          bar.bars([cnt['3+'], cnt['3-']], { x0: 1, color: (c, i) => (i ? 'red' : 'accent'), fillAlpha: 0.6 });
          [['3+', 1], ['3-', 2]].forEach(([k, x]) => { const p = e3 ? exp[k] / e3 : 0, E = n3 * p, sd = Math.sqrt(Math.max(0, n3 * p * (1 - p))); bar.line(x - 0.3, E, x + 0.3, E, { color: 'green', width: 2.4 }); bar.line(x, E - sd, x, E + sd, { color: 'green', width: 1.4 }); bar.text(`${cnt[k]}`, x, Math.max(cnt[k], E + sd), { align: 'center', dy: -12, size: 12, color: 'ink', weight: 600 }); });
          st = { cnt, exp, th: th.value, n3, a3: +ax3.value };
        });
        v.legend([['accent', 'beam (width ∝ √atoms)'], ['red', 'block'], ['green', 'state after SG₂ / predicted counts'], ['orange', 'SG₂ axis $\\hat n$']]);
        v.readout(() => {
          if (!st) return '';
          const { cnt, exp, th: t } = st, c2 = Math.cos(t * Math.PI / 360) ** 2;
          const frac = (a, b) => (a + b ? v.fix(a / (a + b), 3) : '—');
          return `SG₁ ($z$): ${cnt['1+']} up, ${cnt['1-']} down of ${NA} (½ each). SG₂ at $\\theta = ${t}^\\circ$: ${cnt['2+']} + / ${cnt['2-']} − (fraction + = ${frac(cnt['2+'], cnt['2-'])}; for a $z+$ input $\\cos^2(\\theta/2) = ${v.fix(c2, 3)}$). SG₃ (${st.a3 ? 'x' : 'z'}): **${cnt['3+']} + / ${cnt['3-']} −**; for the ${st.n3} atoms that reached it the prediction is ${st.n3 ? v.fix(st.n3 * exp['3+'] / (exp['3+'] + exp['3-'] || 1), 0) : 0} / ${st.n3 ? v.fix(st.n3 * exp['3-'] / (exp['3+'] + exp['3-'] || 1), 0) : 0}.` + (!st.a3 && cnt['3-'] > 0 && cnt['1-'] > 0 && block['1-'] ? ' The $z-$ atoms that SG₁ removed are back: the middle measurement erased the $z$ information.' : !st.a3 && cnt['3-'] === 0 && cnt['3+'] > 0 ? ' Nothing comes out $z-$: with $\\theta = 0$ (or the middle magnet removed from play) a repeated $z$ measurement repeats its answer.' : '');
        });
      },
    },
  ],
};
