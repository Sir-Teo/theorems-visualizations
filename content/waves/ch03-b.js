// Waves & Optics — Chapter 3, part b: wakes, superluminal pulses, band gaps, cutoff, Klein–Gordon, solitons, Kramers–Kronig
import { TAU, csqrt, cmul, cdiv } from './ch03.shared.js';

/** Fourier convention ∫h(t)exp(+iωt)dt: h(t+τ) has multiplier exp(−iωτ). */
export function advanceResponse(re, im, omega, tau) {
  const c = Math.cos(omega * tau), s = Math.sin(omega * tau);
  return [re * c + im * s, im * c - re * s];
}

const G = 9.81;

/** Wavenumber k of the steady wave at propagation angle th in the frame of a source moving at speed U over water of depth h (h = Infinity: deep). */
function wakeK(th, U, h) {
  const c2 = Math.cos(th) ** 2;
  if (!isFinite(h)) return G / (U * U * c2);
  const r = (U * U * c2) / (G * h);
  if (r >= 1) return null;
  let lo = 1e-7, hi = Math.max(12, 3 / r);
  for (let i = 0; i < 70; i++) { const z = 0.5 * (lo + hi); if (Math.tanh(z) / z > r) lo = z; else hi = z; }
  return (0.5 * (lo + hi)) / h;
}
/** Crest number n of the wake by stationary phase: points (x, y) in the frame of the boat (boat at the origin moving to +x). */
function wakeCrest(n, U, h, count = 500) {
  const pts = [], eps = 1e-4;
  const th0 = isFinite(h) && U * U / (G * h) > 1 ? Math.acos(Math.sqrt((G * h) / (U * U))) : 0;
  for (let i = 0; i <= count; i++) {
    const th = -Math.PI / 2 + 0.004 + (Math.PI - 0.008) * (i / count);
    if (th0 > 0 && Math.abs(th) < th0 + 0.002) { pts.push(null); continue; }
    const k = wakeK(th, U, h), kp = wakeK(th + eps, U, h), km = wakeK(th - eps, U, h);
    if (!k || !kp || !km) { pts.push(null); continue; }
    const a = (Math.log(kp) - Math.log(km)) / (2 * eps), s = Math.sin(th), c = Math.cos(th);
    pts.push([-(TAU * n * (a * s + c)) / k, (TAU * n * (a * c - s)) / k]);
  }
  return pts;
}

export default {
  collection: 'waves',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Ship wakes and the Kelvin angle',
      statement: String.raw`A boat moving at constant speed $U$ over deep water leaves a steady wake: in the boat's frame the pattern stands still. A wave of wavenumber $k$ travelling at angle $\theta$ to the boat's course is stationary there only if its phase speed matches the component of the boat's speed along $\theta$, $\sqrt{g/k}=U\cos\theta$. The crests of the whole wake are obtained by superposing these waves and keeping, by stationary phase, only those that add up in the direction of their group velocity. The result is a V-shaped pattern, containing **transverse** crests behind the boat and **divergent** crests along its arms, bounded by two lines of half-angle
$$\theta_K=\arcsin\tfrac13\approx19.47^\circ,$$
**independent of the boat's speed** (the speed only sets the scale, $\lambda_0=2\pi U^2/g$ for the transverse waves). In water of finite depth $h$ the pattern depends on the depth Froude number $F=U/\sqrt{gh}$: the angle grows toward $90^\circ$ as $F\to1^-$ (the wave pattern collapses into one wide crest), and for $F>1$ it narrows again to the Mach-type angle $\arcsin(1/F)$.`,
      idea: String.raw`The deep-water dispersion relation $\omega=\sqrt{gk}$ (3.7) says the group speed is half the phase speed (3.4), so energy lags behind the crests. For waves stationary in the boat frame, the stationary-phase condition (3.5) selects, for every direction $\theta$, a point on a ray from the boat where the waves of that direction pile up; the curve of those points, with the phase fixed at $2\pi n$, is the $n$-th crest. The slope $|y/x|=\sin\theta\cos\theta/(1+\sin^2\theta)$ along the crests has its maximum at $\sin^2\theta=1/3$, which is $\tan\theta_K=1/(2\sqrt2)$. Because $\tan\theta_K$ does not contain $U$, the angle cannot depend on speed.`,
      caption: String.raw`The boat (gold) moves to the right. Each blue curve is a crest, computed from the stationary-phase construction (not drawn by hand); the dashed lines mark $\pm\arcsin(1/3)$. Slide the speed: the crests spread out but the V does not change in deep water. Switch to a depth of 1 m and raise the speed past $\sqrt{gh}\approx3.1$ m/s: the pattern first opens toward $90^\circ$ as the boat approaches $F=1$, then narrows into a shock cone for $F>1$ (cf. 1.15). The readout measures the angle from the crest curves themselves.`,
      deps: ['waves-3.7', 'waves-3.5'],
      refs: ['Crawford ch. 7'],
      tags: ['wakes', 'stationary phase'],
      credit: 'Lord Kelvin, 1887 (deep-water wake angle)',
      scope: String.raw`Linear gravity waves from a point disturbance on water of uniform depth, neglecting surface tension. Measurements of real ship wakes often show a narrower V at high speed than $19.47^\circ$ (finite hull size and other effects); the figure is the exact result for the idealised point source.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kelvin_wake_pattern' },
      viz(v) {
        const dsel = v.select('water', [{ value: 'deep', label: 'deep' }, { value: 'h1', label: 'depth $h=1$ m' }], 'deep');
        const uS = v.slider('boat speed $U$ (m/s)', 1.5, 6, 3, { step: 0.05 });
        const s = v.stage({ x: [-36, 4], y: [-12, 12], equal: true, axes: false, height: 420, full: true, title: 'wake crests in the frame of the boat' });
        let ang = 0, F = 0, h = Infinity, lam0 = 0;
        v.render(() => {
          const U = uS.value; h = dsel.value === 'deep' ? Infinity : 1;
          F = isFinite(h) ? U / Math.sqrt(G * h) : NaN; lam0 = (TAU * U * U) / G;
          const nmax = Math.min(45, Math.ceil(40 / Math.max(lam0, 0.3)) + 8);
          // measured wake angle from the n = 1 crest
          const c1 = wakeCrest(1, U, h, 2400); ang = 0;
          for (const p of c1) if (p && p[0] < 0) ang = Math.max(ang, Math.atan(Math.abs(p[1] / p[0])));
          const tk = Math.tan(Math.asin(1 / 3));
          s.line(0, 0, -36, 36 * tk, { color: 'green', width: 1.6, dash: [6, 4] });
          s.line(0, 0, -36, -36 * tk, { color: 'green', width: 1.6, dash: [6, 4] });
          s.clip(() => {
            for (let n = 1; n <= nmax; n++) s.path(wakeCrest(n, U, h, 420), { color: 'accent', width: 1.3, alpha: n > 40 ? 0.55 : 0.9 });
          });
          s.rect(-1.2, -0.35, 0.1, 0.35, { fill: 'gold', fillAlpha: 0.9, color: 'gold', radius: 4 });
          s.dot(0.1, 0, { r: 4, color: 'gold' });
          s.text(`$\\arcsin(1/3)=19.47^\\circ$`, -2.5, 3.2, { color: 'green', size: 13, align: 'right' });
        });
        v.legend([['accent', 'crests of the steady wave pattern'], ['green', 'Kelvin lines ±19.47°', { dash: true }]]);
        v.readout(() => {
          const deg = (ang * 180) / Math.PI;
          const extra = isFinite(h) ? `$F=U/\\sqrt{gh}=${v.fix(F, 2)}$ (${F < 1 ? 'subcritical' : 'supercritical'})${F > 1 ? `, Mach-type angle $\\arcsin(1/F)=${v.fix((Math.asin(1 / F) * 180) / Math.PI, 1)}^\\circ$` : ''}` : `transverse wavelength $2\\pi U^2/g=${v.fix(lam0, 1)}$ m`;
          return `$U=${v.fix(uS.value, 2)}$ m/s · ${extra} · half-angle measured from the crest curves $=${v.fix(deg, 2)}^\\circ$ (deep-water Kelvin value $\\arcsin\\frac13=19.47^\\circ$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Paradox',
      name: 'Group velocity faster than light',
      statement: String.raw`In a medium with **anomalous dispersion** (the refractive index falls with frequency, typically inside an absorption line or in a gain-assisted medium) the group velocity $v_g=c/n_g$ with $n_g=n+\omega\,dn/d\omega$ can exceed $c$ or even become negative: the peak of a smooth pulse then leaves the medium *earlier* than the peak of the same pulse travelling the same distance in vacuum. Yet this does not allow signalling faster than light. A pulse that is smooth (analytic) has already "announced" its peak in its leading edge, and the medium reshapes that edge; the **front** of a signal switched on abruptly moves at exactly $c$ (Sommerfeld, Brillouin): nothing at all arrives before time $L/c$. The group velocity stops being the speed of anything when the pulse is distorted or strongly absorbed.`,
      idea: String.raw`The group delay of a narrow-band pulse is $d\phi/d\omega$ of the medium's transfer function (3.4, 3.5); across an absorption line the refractive index has a steep negative slope (3.14: absorption and dispersion are Hilbert-transform partners), so $n_g<1$ and can be negative. The pulse is re-weighted by the transmission $e^{-\alpha(\omega)L/2}$, which is larger on the leading side of the peak than on the trailing side, shifting the *peak* forward without moving any actual energy faster. The medium is causal, so its response is analytic in the upper half plane and, at high frequency, $n\to1$: an abrupt turn-on contains arbitrarily high frequencies that travel at $c$, so the first non-zero signal arrives at $L/c$ whatever the group velocity says.`,
      caption: String.raw`Orange dashed: the input pulse delayed by the vacuum travel time $L/c$. Blue: the numerically propagated output through a medium with one Lorentz absorption line of strength $\omega_p^2$ and width $\gamma=0.1$ (computed by Fourier transform: every frequency gets the medium's complex phase and gain $e^{i\omega n(\omega)L/c}$), rescaled to the input height because most of the energy is absorbed. With the carrier on the line centre and a smooth pulse, the peak arrives *before* its vacuum counterpart (the green dot against the dashed line). Detune the carrier to the normal-dispersion side and the pulse is delayed instead. Switch to the sharply switched-on wave train: whatever the settings, the output is zero before $t=t_0+L/c$ (red line), apart from numerical noise, and a precursor starts there. The group-delay prediction $(1-n_g)L/c$ is a first-order result: with strong absorption the envelope is also reshaped, so the measured and predicted numbers agree only roughly (better for weaker lines and narrower pulses). Units: $c=1$, resonance $\omega_r=1$.`,
      deps: ['waves-3.4', 'em-11.13'],
      refs: ['Hecht ch. 7'],
      tags: ['group velocity', 'causality', 'anomalous dispersion'],
      credit: 'Sommerfeld & Brillouin, 1914 (front velocity); Garrett & McCumber, 1970 (superluminal group velocity of smooth pulses); gain-assisted experiment: Wang, Kuzmich & Dogariu, Nature 406, 2000',
      scope: String.raw`Linear single-line Lorentz medium, evaluated numerically with a periodic time grid; absorption reduces the transmitted pulse to a small fraction of its energy (the picture is rescaled). Real experiments differ in detail (gain doublets, atomic vapours); this is a model of the effect, not a reproduction of any particular experiment.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Superluminal_communication' },
      viz(v) {
        const M = v.M, N = 4096, dt = 0.25, T0G = 250, T0B = 150, SG = 60, GAM = 0.1;
        const mode = v.select('input', [{ value: 'smooth', label: 'smooth Gaussian pulse' }, { value: 'box', label: 'abruptly switched on' }], 'smooth');
        const wS = v.slider('line strength $\\omega_p^2$', 0, 0.04, 0.02, { step: 0.002 });
        const lS = v.slider('path length $L/c$', 0, 40, 10, { step: 0.25 });
        const dS = v.slider('carrier detuning from the line', -0.3, 0.3, 0, { step: 0.01 });
        const A = v.stage({ x: [0, 700], y: [-1.65, 1.65], axes: 'box', gutter: true, xlabel: 'time', yticks: [], height: 300, full: true, title: 'input and output at the end of the medium' });
        const nOf = (w, wp2) => {
          const d0 = 1 - w * w, d1 = -GAM * w, den = d0 * d0 + d1 * d1;
          return csqrt([1 + (wp2 * d0) / den, (wp2 * GAM * w) / den]);
        };
        let info = { tpk: 0, tvac: 0, ng: 0, ngPred: 0, pre: 0, gain: 1 };
        v.render(() => {
          const smooth = mode.value === 'smooth', wp2 = wS.value, L = Math.round(lS.value / dt) * dt, wc = 1 + dS.value, t0 = smooth ? T0G : T0B;
          const xin = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            const t = i * dt;
            xin[i] = smooth ? Math.exp(-((t - t0) ** 2) / (2 * SG * SG)) * Math.cos(wc * (t - t0)) : (t >= t0 && t < t0 + 150 ? Math.cos(wc * (t - t0)) : 0);
          }
          const re = Array.from(xin), im = new Array(N).fill(0);
          M.fft(re, im);
          for (let k = 0; k < N; k++) {
            const kk = k < N / 2 ? k : k - N, w = (TAU * Math.abs(kk)) / (N * dt);
            if (w === 0) continue;
            const n = nOf(w, wp2), ph = w * n[0] * L, amp = Math.exp(-w * n[1] * L);
            const c = Math.cos(ph) * amp, s = Math.sin(ph) * amp, sg = kk > 0 ? -1 : 1;   // bins k>0 get conj(H), k<0 get H(|w|)
            const a = re[k], b = im[k]; re[k] = a * c - b * sg * s; im[k] = a * sg * s + b * c;
          }
          const yr = re.slice(), yi = im.slice();
          M.ifft(yr, yi);
          // analytic signal of the output for the envelope
          const zr = re.slice(), zi = im.slice();
          for (let k = 0; k < N; k++) { const f = k === 0 || k === N / 2 ? 1 : k < N / 2 ? 2 : 0; zr[k] *= f; zi[k] *= f; }
          M.ifft(zr, zi);
          const env = Array.from(zr, (a, i) => Math.hypot(a, zi[i]));
          let pk = 0, ip = 0; for (let i = 0; i < N; i++) if (env[i] > pk) { pk = env[i]; ip = i; }
          let tpk = ip * dt;
          if (ip > 0 && ip < N - 1) { const a = env[ip - 1], b = env[ip], c = env[ip + 1], den = a - 2 * b + c; if (den !== 0) tpk += (0.5 * (a - c)) / den * dt; }
          const ymax = Math.max(1e-12, ...Array.from(yr, Math.abs)), gain = 1 / ymax;
          let pre = 0; const tfront = t0 + L;
          for (let i = 0; i < N; i++) if (i * dt < tfront - 2 * dt) pre = Math.max(pre, Math.abs(yr[i]));
          // predicted group index from the numerical derivative of w*n(w) at the carrier
          const h = 1e-4, np = nOf(wc + h, wp2), nm = nOf(wc - h, wp2), ngPred = ((wc + h) * np[0] - (wc - h) * nm[0]) / (2 * h);
          info = { tpk, tvac: t0 + L, ng: smooth && L > 0 ? (tpk - t0) / L : NaN, ngPred, pre: pre * gain, gain, absorb: ymax };
          const shown = (x) => x;
          A.path(Array.from(xin, (x, i) => [i * dt + L, x]).filter((_, i) => i % 1 === 0), { color: 'orange', width: 1.3, dash: [4, 3] });
          A.path(Array.from(yr, (y, i) => [i * dt, y * gain]), { color: 'accent', width: 1.8 });
          if (smooth) {
            A.path(Array.from(env, (e, i) => [i * dt, e * gain * (ymax > 0 ? 1 : 1)]), { color: 'green', width: 1.2, alpha: 0.7 });
            A.dot(info.tvac, 1 * 0 + (smooth ? 1.3 : 0), { r: 5, color: 'orange', hollow: true });
            A.dot(tpk, 1.3, { r: 6, color: 'green' });
            A.vline(info.tvac, { color: 'orange', width: 1, alpha: 0.6, dash: true });
          } else {
            A.vline(tfront, { color: 'red', width: 1.8 });
            A.text('front time $t_0+L/c$', tfront + 6, 1.4, { color: 'red', size: 12, align: 'left' });
          }
          A.text(smooth ? 'peak of the vacuum copy' : '', info.tvac, 1.55, { color: 'orange', size: 11, align: 'center' });
        });
        v.legend([['orange', 'input delayed by vacuum time $L/c$', { dash: true }], ['accent', 'output (rescaled)'], ['green', 'output envelope; its peak']]);
        v.readout(() => {
          const smooth = mode.value === 'smooth', i = info;
          if (smooth) return `output peak at $t=${v.fix(i.tpk, 1)}$, vacuum peak at $t=${v.fix(i.tvac, 1)}$: ${i.tpk < i.tvac - 0.5 ? '**ahead of light** by' : i.tpk > i.tvac + 0.5 ? 'behind light by' : 'on time, difference'} $${v.fix(Math.abs(i.tvac - i.tpk), 1)}$ · measured group index $(t_{pk}-t_0)/L=${isNaN(i.ng) ? '—' : v.fix(i.ng, 2)}$, from $d(\\omega n)/d\\omega$ at the carrier $=${v.fix(i.ngPred, 2)}$ · amplitude transmission $${v.fix(i.absorb, 3)}$`;
          return `front time $t_0+L/c=${v.fix(i.tvac, 1)}$ · largest output before it, relative to the output peak: $${v.sci(i.pre, 2)}$ (numerical noise only: **nothing arrives before the front**) · amplitude scale of the output: $${v.fix(i.absorb, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Model',
      name: 'Waves in a periodic chain: band gaps',
      statement: String.raw`A chain of masses $m$ and $M>m$ alternating along a line and joined by identical springs $K$ (period $a$) has two branches of normal modes,
$$\omega^2=K\Big(\frac1m+\frac1M\Big)\pm K\sqrt{\Big(\frac1m+\frac1M\Big)^{2}-\frac{4\sin^2(ka/2)}{mM}},$$
the **acoustic** branch (neighbouring masses move together, $\omega\to0$ as $k\to0$) and the **optical** branch (neighbours move oppositely). Between the top of the acoustic branch, $\sqrt{2K/M}$, and the bottom of the optical branch, $\sqrt{2K/m}$, there is a **band gap**: no travelling wave exists. A driver in the gap makes the chain respond with a disturbance that decays exponentially with distance, $\sim e^{-\kappa x}$, with $\kappa$ from $\cosh^2(\kappa a/2)=\big(2K(m+M)\omega^2-mM\omega^4\big)/4K^2$. If $M=m$ the gap closes.`,
      idea: String.raw`The equations of motion of the two kinds of mass couple through the same $k$, so for each $k$ one gets a $2\times2$ eigenproblem (continuing the single-mass chain of mech-11.8), hence two frequencies. At the zone edge $k=\pi/a$ the two branches are split by the mass difference: the light and heavy masses can no longer be traded. For a frequency in the gap, the dispersion relation still has solutions, but with complex $k=\pi/a+i\kappa$, i.e. spatially decaying waves; they carry no energy away from the driver (the same mathematics as 3.11).`,
      caption: String.raw`Left: the two branches of $\omega(k)$ for the mass ratio you set; the allowed bands are shaded green, the gap red. Drag the gold line to set the driving frequency. Right: the response of a chain of 80 masses driven at its left end (right end fixed, a little damping), solved exactly: in a band the wave reaches the far end and reflects, in the gap the amplitude collapses within a few masses. Bottom right: the amplitude on a log scale against the number of cells, with the predicted decay $e^{-\kappa a n}$ (dashed) and the measured one. Set $M/m=1$ and the gap disappears.`,
      deps: ['waves-3.3', 'mech-11.8', 'ladr-9.51'],
      refs: ['Crawford ch. 2'],
      tags: ['band gap', 'periodic structure', 'lattice'],
      scope: String.raw`Linear diatomic chain with nearest-neighbour springs and a small uniform damping (used only to absorb reflections); the 80-mass finite chain shows resonances at the standing-wave frequencies inside the bands.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phonon#Lattice_dynamics' },
      viz(v) {
        const NS = 80, NC = 40;
        const rS = v.slider('mass ratio $M/m$', 1, 4, 2.5, { step: 0.05 });
        const A = v.stage({ x: [0, Math.PI], y: [0, 2], axes: 'box', gutter: true, xlabel: 'k a', ylabel: 'ω / √(K/m)', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], height: 280, weight: 1, minWidth: 280, title: 'two branches and a gap' });
        const B = v.stage({ x: [0, NS], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 'mass number j', yticks: [], height: 280, weight: 1.6, minWidth: 340, title: 'the driven chain' });
        const C = v.stage({ x: [0, NC], y: [1e-8, 10], axes: 'box', gutter: true, ylog: true, xlabel: 'cell n', ylabel: 'amplitude', height: 200, full: true, title: 'amplitude of the heavy-mass displacements' });
        const hd = A.handle(0.3, 1.15, { color: 'gold', r: 8, label: 'drive', constrain: 'y' });
        const branches = (r) => {
          const s = 1 + 1 / r, f = (kk, sg) => Math.sqrt(Math.max(0, s + sg * Math.sqrt(Math.max(0, s * s - (4 * Math.sin(kk / 2) ** 2) / r))));
          return { lo: (k) => f(k, -1), hi: (k) => f(k, 1), top: Math.sqrt(2 / r), bot: Math.sqrt(2), cap: Math.sqrt(2 * s) };
        };
        const solve = (r, w) => {
          // masses: even j light (1), odd j heavy (r); K = 1; left end free and driven by unit force, right end fixed; damping via w^2 -> w^2 + i*eta*w
          const eta = 0.02, w2 = [w * w, eta * w], a = [], b = [], d = [];
          for (let j = 0; j < NS; j++) {
            const m = j % 2 ? r : 1, diag = (j === 0 ? 1 : 2) - m * w2[0];
            b.push([diag, -m * w2[1]]); d.push([j === 0 ? 1 : 0, 0]); a.push([-1, 0]);
          }
          // Thomas algorithm: sub-diagonal a[j] = -1, super-diagonal -1
          const cp = [], dp = [];
          cp[0] = cdiv([-1, 0], b[0]); dp[0] = cdiv(d[0], b[0]);
          for (let j = 1; j < NS; j++) {
            const den = [b[j][0] - a[j][0] * cp[j - 1][0], b[j][1] - a[j][0] * cp[j - 1][1]];
            cp[j] = cdiv([-1, 0], den);
            const num = [d[j][0] - a[j][0] * dp[j - 1][0], d[j][1] - a[j][0] * dp[j - 1][1]];
            dp[j] = cdiv(num, den);
          }
          const u = new Array(NS); u[NS - 1] = dp[NS - 1];
          for (let j = NS - 2; j >= 0; j--) { const t = cmul(cp[j], u[j + 1]); u[j] = [dp[j][0] - t[0], dp[j][1] - t[1]]; }
          return u;
        };
        let info = { kap: 0, kmeas: 0, state: '' };
        v.animate((t) => {
          const r = rS.value, br = branches(r), w = Math.min(br.cap + 0.15, Math.max(0.05, hd.y));
          hd.set(0.3, w);
          if (r > 1.0001) { A.rect(0, br.top, Math.PI, br.bot, { fill: 'red', fillAlpha: 0.12, stroke: false }); A.hband(0, br.top, { color: 'green', alpha: 0.12 }); A.hband(br.bot, br.cap, { color: 'green', alpha: 0.12 }); }
          A.fn(br.lo, { color: 'accent', width: 2.8, domain: [0, Math.PI] });
          A.fn(br.hi, { color: 'purple', width: 2.8, domain: [0, Math.PI] });
          A.hline(w, { color: 'gold', width: 2 });
          const inGap = r > 1.0001 && w > br.top && w < br.bot, above = w > br.cap;
          const g = (2 * (1 + r) * w * w - r * w ** 4) / 4;
          let kap = 0;
          if (g > 1) kap = 2 * Math.acosh(Math.sqrt(g)); else if (g < 0) kap = 2 * Math.asinh(Math.sqrt(-g));
          const u = solve(r, w);
          const amp = u.map((z) => Math.hypot(z[0], z[1])), mx = Math.max(...amp);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(amp.map((a2, j) => [j, a2 / mx]), { color: 'green', width: 1.2, alpha: 0.6, dash: [4, 3] });
          B.path(amp.map((a2, j) => [j, -a2 / mx]), { color: 'green', width: 1.2, alpha: 0.6, dash: [4, 3] });
          const ph = [Math.cos(w * t), Math.sin(w * t)];
          const xs = u.map((z, j) => (z[0] * ph[0] + z[1] * ph[1]) / mx);   // Re[u e^{-i w t}]
          B.path(xs.map((q, j) => [j, q]), { color: 'faint', width: 1 });
          for (let j = 0; j < NS; j++) B.dot(j, xs[j], { r: j % 2 ? 3.6 : 2.4, color: j % 2 ? 'purple' : 'accent' });
          // amplitude of the heavy masses per cell
          const cellAmp = []; for (let n = 0; n < NC; n++) cellAmp.push([n, Math.max(1e-9, amp[2 * n + 1] / amp[0])]);
          C.path(cellAmp, { color: 'purple', width: 2.4 });
          C.dots(cellAmp, { r: 2.5, color: 'purple' });
          if (kap > 0) C.fn((x) => cellAmp[0][1] * Math.exp(-kap * x), { color: 'red', width: 1.6, dash: [5, 4], domain: [0, NC] });
          const a0 = amp[3], a1 = amp[11];
          info = { kap, kmeas: a0 > 0 && a1 > 0 ? -Math.log(a1 / a0) / 4 : 0, state: inGap ? 'in the gap' : above ? 'above the top of the optical branch (also no propagation)' : 'inside an allowed band' };
        }, { still: 1.3 });
        v.legend([['accent', 'acoustic branch / light masses'], ['purple', 'optical branch / heavy masses'], ['red', 'gap; predicted decay', { dash: true }]]);
        v.readout(() => {
          const r = rS.value, br = branches(r);
          return `$M/m=${v.fix(r, 2)}$: acoustic top $\\omega=${v.fix(br.top, 3)}$, optical bottom $\\omega=${v.fix(br.bot, 3)}$ (gap $${v.fix(br.bot - br.top, 3)}$) · drive $\\omega=${v.fix(hd.y, 3)}$, ${info.state} · predicted decay per cell $\\kappa a=${v.fix(info.kap, 3)}$ ($e^{-\\kappa a}=${v.fix(Math.exp(-info.kap), 3)}$), measured over cells 1–5: $\\kappa a=${v.fix(info.kmeas, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Phenomenon',
      name: 'Evanescent waves below cutoff',
      statement: String.raw`In a system with a **cutoff frequency** $\omega_c$, such as a waveguide mode or a chain of pendulums, waves obey $\omega^2=\omega_c^2+c^2k^2$. For $\omega>\omega_c$ the wavenumber $k=\sqrt{\omega^2-\omega_c^2}/c$ is real and the wave propagates. For $\omega<\omega_c$ it is imaginary, $k=i\kappa$ with
$$\kappa=\frac{\sqrt{\omega_c^2-\omega^2}}{c},$$
and a source at $z=0$ produces a disturbance $\propto e^{-\kappa z}$ that oscillates in time everywhere in step (no phase propagation) and **carries no net power**: the energy flux, the time average of force times velocity, is zero. The decay length $1/\kappa$ is shortest far below cutoff ($\to c/\omega_c$ as $\omega\to0$) and diverges as $\omega\to\omega_c^-$.`,
      idea: String.raw`It is the dispersion relation (3.3) read with a complex wavenumber: the wave equation with a restoring term, $u''+\frac{\omega^2-\omega_c^2}{c^2}u=0$, has oscillating solutions when the bracket is positive and exponentials when it is negative. A decaying exponential has $u$ and $u'$ in quadrature with the real field, so the average flux $\mathrm{Im}(u^*u')$ vanishes: the driver does reactive, not real, work. In a lossless medium the energy stored in the evanescent field returns to the source each cycle. The same mathematics describes tunnelling (a barrier is a region below cutoff) and the gap response of 3.10.`,
      caption: String.raw`Left: the dispersion relation $\omega^2=\omega_c^2+k^2$ with real $k$ on the right and the decay constant $\kappa$ (the imaginary part of $k$) on the left, a quarter-circle. Drag the gold line through the cutoff. Right: the steady response of a long line driven at $z=0$, found by solving the discretised equation (with an outgoing boundary on the right): above cutoff a travelling wave of constant amplitude, below cutoff a standing exponential decay whose fitted rate matches $\kappa$ and whose power flux (readout) is zero.`,
      deps: ['waves-3.3', 'em-11.15', 'ode-3.13'],
      refs: ['Crawford ch. 4'],
      tags: ['cutoff', 'evanescent wave'],
      scope: String.raw`Lossless one-dimensional medium obeying $u_{tt}=c^2u_{zz}-\omega_c^2u$ (the Klein–Gordon form, 3.12); for a rectangular waveguide $\omega_c=c\pi/a$ for the lowest mode of width $a$ (em-11.15).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Evanescent_field' },
      viz(v) {
        const NZ = 400, Z = 20, dz = Z / NZ, tt = 1.0;
        const sA = v.stage({ x: [-1.2, 3], y: [0, 2], axes: 'box', gutter: true, xlabel: '← κ (imaginary k)      real k →', ylabel: 'ω / ω_c', height: 300, weight: 1, minWidth: 280, title: 'dispersion with complex k' });
        const sB = v.stage({ x: [0, Z], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'distance z from the driver (units $c/\\omega_c$)', yticks: [], height: 300, weight: 1.6, minWidth: 340, title: 'steady response' });
        const xOf = (w) => (w >= 1 ? Math.sqrt(w * w - 1) : -Math.sqrt(1 - w * w));
        const hd = sA.handle(-0.6, 0.8, { color: 'gold', r: 8, label: 'ω', constrain: (x, y) => { const w = v.M.clamp(y, 0.05, 1.95); return [xOf(w), w]; } });
        let info = { kapFit: 0, kap: 0, flux: 0, w: 0 };
        v.animate((t) => {
          const w = v.M.clamp(hd.y, 0.05, 1.95); hd.set(xOf(w), w);
          sA.fn((k) => Math.sqrt(1 + k * k), { color: 'accent', width: 2.8, domain: [0, 3] });
          sA.curve((th) => [-Math.sin(th), Math.cos(th)], 0, Math.PI / 2, { color: 'red', width: 2.8 });
          sA.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          sA.hline(w, { color: 'gold', width: 1.4, alpha: 0.6 });
          // solve u'' + (w^2-1) u = 0, u(0)=1, outgoing BC at z = Z
          const q = csqrt([w * w - 1, 0]), p2 = w * w - 1;
          const lo = 1 / (dz * dz), hi = 1 / (dz * dz);
          const cp = [], dp = [], b = [], d = [], a = [], c = [];
          for (let j = 0; j < NZ; j++) {
            a.push([lo, 0]); c.push([hi, 0]);
            b.push([-2 / (dz * dz) + p2, 0]);
            d.push([j === 0 ? -lo : 0, 0]);
          }
          // last row: (2 u_{N-1} + 2 dz i q u_N - 2 u_N)/dz^2 + p2 u_N = 0  => lower = 2/dz^2, diag = -2/dz^2 + p2 + 2 i q / dz
          a[NZ - 1] = [2 * lo, 0];
          b[NZ - 1] = [-2 / (dz * dz) + p2 - (2 * q[1]) / dz, (2 * q[0]) / dz];
          cp[0] = cdiv(c[0], b[0]); dp[0] = cdiv(d[0], b[0]);
          for (let j = 1; j < NZ; j++) {
            const den = [b[j][0] - a[j][0] * cp[j - 1][0], b[j][1] - a[j][0] * cp[j - 1][1]];
            cp[j] = cdiv(c[j], den);
            dp[j] = cdiv([d[j][0] - a[j][0] * dp[j - 1][0], d[j][1] - a[j][0] * dp[j - 1][1]], den);
          }
          const u = new Array(NZ + 1); u[0] = [1, 0]; u[NZ] = dp[NZ - 1];
          for (let j = NZ - 2; j >= 0; j--) { const tm = cmul(cp[j], u[j + 2]); u[j + 1] = [dp[j][0] - tm[0], dp[j][1] - tm[1]]; }
          const amp = u.map((z) => Math.hypot(z[0], z[1]));
          const ph = [Math.cos(w * t * 2), Math.sin(w * t * 2)];
          const real = u.map((z) => z[0] * ph[0] + z[1] * ph[1]);
          sB.path(amp.map((a2, j) => [j * dz, a2]), { color: 'green', width: 1.5, dash: [5, 4] });
          sB.path(amp.map((a2, j) => [j * dz, -a2]), { color: 'green', width: 1.5, dash: [5, 4] });
          sB.path(real.map((r, j) => [j * dz, r]), { color: 'accent', width: 2.8 });
          if (w < 1) { const kap = Math.sqrt(1 - w * w); sB.fn((z) => Math.exp(-kap * z), { color: 'red', width: 1.6, dash: [2, 4], domain: [0, Z] }); sB.vline(1 / kap, { color: 'red', width: 1, alpha: 0.5, dash: true }); }
          // diagnostics
          const j1 = Math.round(2 / dz), j2 = Math.round(8 / dz);
          const kapFit = amp[j1] > 1e-12 && amp[j2] > 1e-12 ? -Math.log(amp[j2] / amp[j1]) / ((j2 - j1) * dz) : 0;
          const jm = Math.round(10 / dz), dr = (u[jm + 1][0] - u[jm - 1][0]) / (2 * dz), di = (u[jm + 1][1] - u[jm - 1][1]) / (2 * dz);
          const flux = u[jm][0] * di - u[jm][1] * dr;
          info = { kapFit, kap: w < 1 ? Math.sqrt(1 - w * w) : 0, flux, w, a10: amp[jm], kreal: w > 1 ? Math.sqrt(w * w - 1) : 0 };
        }, { still: 0.9 });
        v.legend([['accent', 'field at this instant'], ['green', 'amplitude', { dash: true }], ['red', '$e^{-\\kappa z}$', { dash: true }]]);
        v.readout(() => {
          const i = info;
          return i.w < 1
            ? `$\\omega/\\omega_c=${v.fix(i.w, 2)}$ **below cutoff**: $\\kappa=\\sqrt{1-\\omega^2}=${v.fix(i.kap, 3)}$, decay length $1/\\kappa=${v.fix(1 / i.kap, 2)}$; fitted from the computed field (z from 2 to 8): $\\kappa=${v.fix(i.kapFit, 3)}$ · time-averaged flux $\\mathrm{Im}(u^*u')=${v.sci(Math.abs(i.flux), 1)}$ (zero up to numerical error)`
            : `$\\omega/\\omega_c=${v.fix(i.w, 2)}$ **above cutoff**: $k=\\sqrt{\\omega^2-1}=${v.fix(i.kreal, 3)}$, amplitude constant (fitted decay rate $${v.fix(Math.abs(i.kapFit), 4)}$) · flux $\\mathrm{Im}(u^*u')=${v.fix(i.flux, 3)}$, equal to $k|u|^2=${v.fix(i.kreal * i.a10 * i.a10, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Model',
      name: 'Klein–Gordon dispersion',
      statement: String.raw`A row of pendulums, each of natural frequency $\omega_0$, coupled to its neighbours by weak springs obeys, in the continuum limit, the **Klein–Gordon equation** $u_{tt}=c^2u_{xx}-\omega_0^2u$. Plane waves $e^{i(kx-\omega t)}$ require
$$\omega^2=\omega_0^2+c^2k^2 .$$
Every wave oscillates at least at $\omega_0$ (the cutoff of 3.11). The phase velocity $v_p=\omega/k=c\sqrt{1+\omega_0^2/c^2k^2}$ is always **above** $c$, the group velocity $v_g=d\omega/dk=c^2k/\omega$ always **below** $c$, and
$$v_p\,v_g=c^2\qquad\text{for every }k .$$
Nothing carrying energy or information travels faster than $c$: the superluminal phase velocity is only the speed of a pattern. The same relation, with $\hbar\omega_0=mc^2$, is the energy–momentum relation of a relativistic particle of mass $m$.`,
      idea: String.raw`Differentiating $\omega^2=\omega_0^2+c^2k^2$ gives $2\omega\,d\omega=2c^2k\,dk$, so $v_g=c^2k/\omega=c^2/v_p$. A packet (3.5) of such waves moves at $v_g<c$, slower the nearer its wavenumber is to zero, where it stops. The coupled pendulums are a mechanical model of the equation: in the long-wave limit the springs give the $c^2u_{xx}$ term and gravity the $-\omega_0^2u$ term (this is the same relation as the cutoff dispersion of 3.11 and a particular case of the chain of 3.3).`,
      caption: String.raw`Top left: the hyperbola $\omega(k)$ and the light line $\omega=ck$; drag the gold point to choose the carrier wavenumber $k_0$. Top right: $v_p$ (red) is above $c$, $v_g$ (green) is below $c$, and their product is exactly $c^2$ (horizontal dashed line). Bottom: a long chain of 1200 coupled pendulums integrated numerically from a packet with carrier $k_0$ (blue) and its envelope (green): the numerically located envelope peak moves at $v_g$, not at $v_p$. Raise $\omega_0$ and the packets slow down; at $\omega_0=0$ the chain is non-dispersive and everything moves at $c$.`,
      deps: ['waves-3.3'],
      refs: ['Crawford ch. 4'],
      tags: ['Klein–Gordon', 'dispersion', 'group velocity'],
      credit: 'Oskar Klein, Vladimir Fock, Walter Gordon, 1926 (the relativistic wave equation, found independently by several authors)',
      scope: String.raw`Linear chain with spacing $a\ll1/k$ so the continuum equation holds; the simulation uses $a=0.25$ with $c=1$, where the lattice correction at $k\le1.3$ is below $10^{-3}$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Klein%E2%80%93Gordon_equation' },
      viz(v) {
        const NS = 1200, a = 0.25, X0 = 60, SIGX = 12, TM = 120, TMAX = 100;
        const w0S = v.slider('cutoff $\\omega_0$', 0, 1.2, 0.6, { step: 0.05, onChange: () => S && S.reset() });
        let S;
        const A = v.stage({ x: [0, 2], y: [0, 2.4], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'ω', height: 250, weight: 1, minWidth: 260, title: 'ω(k) and the light line' });
        const C = v.stage({ x: [0.05, 2], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'speed (c = 1)', height: 250, weight: 1, minWidth: 260, title: 'phase and group speed' });
        const B = v.stage({ x: [0, 300], y: [-1.3, 1.3], axes: 'box', gutter: true, xlabel: 'position x', yticks: [], height: 200, full: true, title: 'a row of 1200 coupled pendulums' });
        const wOf = (k) => Math.sqrt(w0S.value ** 2 + k * k);
        const hd = A.handle(0.8, wOf(0.8), { color: 'gold', r: 8, label: 'k₀', constrain: (x) => { const kk = v.M.clamp(x, 0.2, 1.3); return [kk, wOf(kk)]; } });
        hd.onDrag = () => S && S.reset();
        S = v.sim(() => {
          const k0 = hd.x, w = wOf(k0), u = new Float64Array(NS), ud = new Float64Array(NS);
          for (let j = 0; j < NS; j++) { const x = j * a - X0, e = Math.exp(-(x * x) / (4 * SIGX * SIGX)); u[j] = e * Math.cos(k0 * x); ud[j] = w * e * Math.sin(k0 * x); }
          return { u, ud, t: 0, acc: new Float64Array(NS) };
        }, (st, dt) => {
          const w02 = w0S.value ** 2, C2 = 1 / (a * a), { u, ud, acc } = st;
          const f = () => { for (let j = 0; j < NS; j++) { const l = j > 0 ? u[j - 1] : 0, r = j < NS - 1 ? u[j + 1] : 0; acc[j] = C2 * (l - 2 * u[j] + r) - w02 * u[j]; } };
          f(); for (let j = 0; j < NS; j++) ud[j] += 0.5 * dt * acc[j];
          for (let j = 0; j < NS; j++) u[j] += dt * ud[j];
          f(); for (let j = 0; j < NS; j++) ud[j] += 0.5 * dt * acc[j];
          st.t += dt;
        }, { dt: 0.02, maxSteps: 12000 });
        let info = { vg: 0, vp: 0, xpk: 0, t: 0 };
        v.animate((t) => {
          const k0 = hd.x, w = wOf(k0); hd.set(k0, w);
          const tt = (t * 20) % TM; S.advance(Math.min(tt, TMAX));
          const st = S.state, tn = st.t, vg = k0 / w, vp = w / k0;
          A.fn((k) => k, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, 2] });
          A.fn(wOf, { color: 'accent', width: 3, domain: [0, 2] });
          A.hline(w0S.value, { color: 'faint', width: 1, dash: true });
          A.line(0, 0, k0, w, { color: 'red', width: 1.2, dash: [3, 3] });
          C.hline(1, { color: 'muted', width: 1.4, dash: [5, 4] });
          C.fn((k) => wOf(k) / k, { color: 'red', width: 2.6, domain: [0.05, 2] });
          C.fn((k) => k / wOf(k), { color: 'green', width: 2.6, domain: [0.05, 2] });
          C.fn((k) => 1, { color: 'ink', width: 1, alpha: 0.0001, domain: [0.05, 2] });
          C.dot(k0, vp, { r: 5, color: 'red' }); C.dot(k0, vg, { r: 5, color: 'green' });
          C.text('$v_pv_g=c^2$ for every $k$', 1.95, 2.6, { color: 'ink', size: 12, align: 'right' });
          // chain
          const xs = (j) => j * a;
          B.path(Array.from(st.u, (q, j) => [xs(j), q]).filter((_, j) => j % 2 === 0), { color: 'accent', width: 1.5 });
          const env = Array.from(st.u, (q, j) => Math.hypot(q, st.ud[j] / w));
          B.path(env.map((e, j) => [xs(j), e]).filter((_, j) => j % 2 === 0), { color: 'green', width: 1.4, dash: [4, 3] });
          let pk = 0, ip = 0; for (let j = 0; j < NS; j++) if (env[j] > pk) { pk = env[j]; ip = j; }
          const xpk = xs(ip) - X0;
          B.dot(xs(ip), pk, { r: 6, color: 'green' });
          B.vline(X0 + vg * tn, { color: 'green', width: 1, alpha: 0.5, dash: true });
          B.vline(X0 + vp * tn, { color: 'red', width: 1, alpha: 0.4, dash: true });
          info = { vg, vp, xpk, t: tn, k0, w };
        }, { period: TM / 20, still: 4 });
        v.legend([['accent', 'pendulum displacement'], ['green', 'envelope; $x_0+v_gt$'], ['red', '$v_p$ (crest speed)', { dash: true }]]);
        v.readout(() => `$k_0=${v.fix(info.k0, 2)}$, $\\omega=${v.fix(info.w, 3)}$: $v_p=${v.fix(info.vp, 3)}\\,c$, $v_g=${v.fix(info.vg, 3)}\\,c$, $v_pv_g=${v.fix(info.vp * info.vg, 4)}\\,c^2$ · at $t=${v.fix(info.t, 1)}$ the simulated envelope peak has moved $${v.fix(info.xpk, 1)}$, predicted $v_gt=${v.fix(info.vg * info.t, 1)}$ (a crest would have advanced $v_pt=${v.fix(info.vp * info.t, 1)}$)`);
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'Solitons',
      statement: String.raw`The **Korteweg–de Vries (KdV) equation** $u_t+6uu_x+u_{xxx}=0$ describes long, weakly nonlinear waves of moderate height in shallow water. Nonlinearity steepens a hump, dispersion (the $u_{xxx}$ term) spreads it; for a special shape the two balance exactly and the hump travels unchanged: the **soliton**
$$u(x,t)=2\kappa^2\,\mathrm{sech}^2\!\big(\kappa(x-4\kappa^2t-x_0)\big),$$
whose speed $4\kappa^2$ is twice its height $2\kappa^2$, so taller solitons are narrower and faster. Solitons survive collisions: two of them pass through one another and re-emerge with their original shapes and speeds, the only trace of the encounter being a shift of position (the taller one jumps ahead, the shorter one is set back; for $\kappa_1>\kappa_2$ the shifts are $+\kappa_1^{-1}\ln\frac{\kappa_1+\kappa_2}{\kappa_1-\kappa_2}$ and $-\kappa_2^{-1}\ln\frac{\kappa_1+\kappa_2}{\kappa_1-\kappa_2}$, which the simulation below reproduces for $\kappa_1=1$, $\kappa_2=0.6$: $+1.39$ and $-2.31$). An initial hump of general shape breaks up into a train of solitons plus a spreading dispersive tail, and the integrals $\int u\,dx$ and $\int u^2dx$ stay constant.`,
      idea: String.raw`Each term alone does damage: without the nonlinear term the equation is linear, dispersive (3.3, 3.6) and every hump spreads; without dispersion the nonlinear term makes a profile steepen and break. A sech$^2$ profile is the one for which the two effects cancel exactly. That solitons collide elastically is a remarkable property of KdV (it has infinitely many conserved quantities and can be solved by the inverse scattering transform; see pde-9.9); here it is demonstrated by direct numerical integration (a Fourier method with an exponential integrating factor, fourth-order Runge–Kutta).`,
      caption: String.raw`Choose an initial state and press play. Top: the numerically evolving wave $u(x,t)$ (dashed: initial profile). Bottom: the space–time map, where each soliton is a straight bright track; in the collision the tracks jump at the crossing but keep their slopes. The slider turns the nonlinear term down to zero (then everything just disperses). The readout tracks the two conserved integrals and, after a collision, the position shifts compared with undisturbed straight-line motion. Units: the equation $u_t+6uu_x+u_{xxx}=0$ in non-dimensional form.`,
      deps: ['waves-3.7', 'waves-3.6', 'pde-9.9'],
      refs: ['Crawford ch. 6'],
      tags: ['soliton', 'KdV', 'nonlinear waves'],
      credit: 'J. Scott Russell observed the solitary wave in 1834; Korteweg & de Vries, 1895 (the equation); Zabusky & Kruskal, 1965 (collisions, the name "soliton")',
      scope: String.raw`KdV is the leading-order model of shallow-water waves of small amplitude and long wavelength, travelling in one direction; real water waves lose energy to friction and radiate. The numerical solution is periodic on a box of length 80, so keep the run within the displayed time.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Korteweg%E2%80%93De_Vries_equation' },
      viz(v) {
        const M = v.M, N = 512, L = 80, X0 = -20, dx = L / N, DT = 0.004, TT = 14, ROW = 0.1;
        const kk = new Float64Array(N); for (let i = 0; i < N; i++) kk[i] = (TAU / L) * (i < N / 2 ? i : i - N);
        const mask = new Float64Array(N); for (let i = 0; i < N; i++) mask[i] = Math.abs(kk[i]) < (2 / 3) * (Math.PI / dx) ? 1 : 0;
        const E = new Float64Array(N * 2), E2 = new Float64Array(N * 2);   // exp(i k^3 dt/2), exp(i k^3 dt)
        for (let i = 0; i < N; i++) { const th = kk[i] ** 3 * DT; E[2 * i] = Math.cos(th / 2); E[2 * i + 1] = Math.sin(th / 2); E2[2 * i] = Math.cos(th); E2[2 * i + 1] = Math.sin(th); }
        const sel = v.select('initial state', [{ value: 'one', label: 'one soliton' }, { value: 'two', label: 'two solitons collide' }, { value: 'hump', label: 'a smooth hump' }], 'two', { onChange: () => S && S.reset() });
        const eS = v.slider('nonlinearity', 0, 1, 1, { step: 0.05, onChange: () => S && S.reset() });
        let S;
        const sech2 = (x) => { const c = Math.cosh(x); return 1 / (c * c); };
        const initU = (x) => {
          const m = sel.value;
          if (m === 'one') return 2 * sech2(x + 12);
          if (m === 'two') return 2 * sech2(x + 12) + 0.72 * sech2(0.6 * (x + 2)) * 1;
          return 1.6 * Math.exp(-((x + 5) ** 2) / 8);
        };
        const nl = (re, im, eps, outR, outI) => {
          const r = re.slice(), i = im.slice(); M.ifft(r, i);
          for (let j = 0; j < N; j++) { r[j] = r[j] * r[j]; i[j] = 0; }
          M.fft(r, i);
          for (let j = 0; j < N; j++) { const f = mask[j] * eps * 3; outR[j] = f * kk[j] * i[j]; outI[j] = -f * kk[j] * r[j]; }   // -3 i k * fft(u^2)
        };
        S = v.sim(() => {
          const re = new Array(N), im = new Array(N).fill(0);
          for (let j = 0; j < N; j++) re[j] = initU(X0 + j * dx);
          M.fft(re, im);
          const u0 = re.slice(), u0i = im.slice(); M.ifft(u0, u0i);
          return { re, im, t: 0, rows: [Float32Array.from(u0.filter((_, j) => j % 2 === 0))], u0: Float64Array.from(u0), I1: [], I2: [], tr: [] };
        }, (st, dt) => {
          const eps = eS.value, { re, im } = st;
          const mk = () => ({ r: new Array(N), i: new Array(N) });
          const a = mk(), b = mk(), c = mk(), d = mk(), t1 = mk();
          const mulE = (xr, xi, j, F) => [xr * F[2 * j] - xi * F[2 * j + 1], xr * F[2 * j + 1] + xi * F[2 * j]];
          nl(re, im, eps, a.r, a.i);
          for (let j = 0; j < N; j++) { a.r[j] *= DT; a.i[j] *= DT; const q = mulE(re[j] + a.r[j] / 2, im[j] + a.i[j] / 2, j, E); t1.r[j] = q[0]; t1.i[j] = q[1]; }
          nl(t1.r, t1.i, eps, b.r, b.i);
          for (let j = 0; j < N; j++) { b.r[j] *= DT; b.i[j] *= DT; const q = mulE(re[j], im[j], j, E); t1.r[j] = q[0] + b.r[j] / 2; t1.i[j] = q[1] + b.i[j] / 2; }
          nl(t1.r, t1.i, eps, c.r, c.i);
          for (let j = 0; j < N; j++) { c.r[j] *= DT; c.i[j] *= DT; const q = mulE(re[j], im[j], j, E2), q2 = mulE(c.r[j], c.i[j], j, E); t1.r[j] = q[0] + q2[0]; t1.i[j] = q[1] + q2[1]; }
          nl(t1.r, t1.i, eps, d.r, d.i);
          for (let j = 0; j < N; j++) {
            d.r[j] *= DT; d.i[j] *= DT;
            const q = mulE(re[j], im[j], j, E2), qa = mulE(a.r[j], a.i[j], j, E2), qb = mulE(b.r[j] + c.r[j], b.i[j] + c.i[j], j, E);
            re[j] = q[0] + (qa[0] + 2 * qb[0] + d.r[j]) / 6; im[j] = q[1] + (qa[1] + 2 * qb[1] + d.i[j]) / 6;
          }
          st.t += DT;
          if (st.rows.length * ROW <= st.t + 1e-9) {
            const r = re.slice(), i = im.slice(); M.ifft(r, i);
            st.rows.push(Float32Array.from(r.filter((_, j) => j % 2 === 0)));
            let s1 = 0, s2 = 0; for (let j = 0; j < N; j++) { s1 += r[j]; s2 += r[j] * r[j]; }
            st.I1.push([st.t, s1 * dx]); st.I2.push([st.t, s2 * dx]);
            // tracks: local maxima above 0.25
            const pk = []; for (let j = 1; j < N - 1; j++) if (r[j] > 0.25 && r[j] > r[j - 1] && r[j] >= r[j + 1]) { const den = r[j - 1] - 2 * r[j] + r[j + 1]; const sh = den !== 0 ? 0.5 * (r[j - 1] - r[j + 1]) / den : 0; pk.push([X0 + (j + sh) * dx, r[j] - 0.25 * (r[j - 1] - r[j + 1]) * sh]); }
            st.tr.push([st.t, pk]);
          }
        }, { dt: DT, maxSteps: 4000 });
        const A = v.stage({ x: [X0, X0 + L], y: [-0.6, 2.4], axes: 'box', gutter: true, xlabel: 'x', ylabel: 'u', height: 220, full: true, title: 'the wave' });
        const B = v.stage({ x: [X0, X0 + L], y: [0, TT], axes: 'box', gutter: true, xlabel: 'x', ylabel: 'time', height: 260, weight: 1.6, minWidth: 340, title: 'space–time map of u' });
        let info = {};
        v.animate((t) => {
          const tn = Math.min(TT, 2 * t); S.advance(tn);
          const st = S.state;
          const r = st.re.slice(), im = st.im.slice(); M.ifft(r, im);
          const px = (j) => X0 + j * dx;
          A.path(Array.from(st.u0, (q, j) => [px(j), q]).filter((_, j) => j % 2 === 0), { color: 'muted', width: 1.2, dash: [5, 4] });
          A.path(Array.from(r, (q, j) => [px(j), q]).filter((_, j) => j % 2 === 0), { color: 'accent', width: 2.8 });
          B.raster((x, tm) => { const ri = Math.floor(tm / ROW + 1e-9); if (ri < 0 || ri >= st.rows.length) return null; const row = st.rows[ri], j = Math.min(row.length - 1, Math.max(0, Math.round((x - X0) / (2 * dx)))); return v.ramp(Math.max(0, Math.min(1, row[j] / 2.2)), 'accent', 'panel'); }, { res: 3, key: `${st.rows.length}|${sel.value}|${eS.value}|${v.color('panel')}` });
          B.hline(st.t, { color: 'gold', width: 1.2 });
          let s1 = 0, s2 = 0; for (let j = 0; j < N; j++) { s1 += r[j]; s2 += r[j] * r[j]; }
          const pk = []; for (let j = 1; j < N - 1; j++) if (r[j] > 0.25 && r[j] > r[j - 1] && r[j] >= r[j + 1]) pk.push([px(j), r[j]]);
          info = { t: st.t, s1: s1 * dx, s2: s2 * dx, pk, I10: st.I1.length ? st.I1[0][1] : s1 * dx };
          let u0s1 = 0, u0s2 = 0; for (let j = 0; j < N; j++) { u0s1 += st.u0[j]; u0s2 += st.u0[j] ** 2; } info.s10 = u0s1 * dx; info.s20 = u0s2 * dx;
          // shifts (two-soliton case), compared with undisturbed motion x0 + 4 kappa^2 t
          if (sel.value === 'two' && eS.value === 1 && pk.length >= 2) {
            const big = pk.reduce((m, p) => (p[1] > m[1] ? p : m)), small = pk.filter((p) => p !== big).reduce((m, p) => (p[1] > m[1] ? p : m), [0, -1]);
            info.sh = [big[0] - (-12 + 4 * st.t), small[0] - (-2 + 4 * 0.36 * st.t)];
          } else info.sh = null;
        }, { period: TT / 2 + 1, still: 6.5 });
        v.legend([['accent', 'u(x, t)'], ['muted', 'initial profile', { dash: true }]]);
        v.readout(() => {
          const i = info, tops = (i.pk || []).slice().sort((a, b) => b[1] - a[1]).slice(0, 3).map((p) => `${v.fix(p[1], 2)}`).join(', ');
          return `$t=${v.fix(i.t, 2)}$ · $\\int u\\,dx=${v.fix(i.s1, 4)}$ (initially $${v.fix(i.s10, 4)}$), $\\int u^2dx=${v.fix(i.s2, 4)}$ (initially $${v.fix(i.s20, 4)}$) · peak heights: ${tops || '—'}${i.sh ? ` · position shift of the tall soliton from straight-line motion $${v.fix(i.sh[0], 2)}$, of the short one $${v.fix(i.sh[1], 2)}$ (before the collision both are $\\approx0$; the exact two-soliton shifts for $\\kappa=1,\\,0.6$ are $+1.39$ and $-2.31$)` : ''}${sel.value === 'one' && i.pk && i.pk.length ? ` · height $2\\kappa^2=2$, speed $4\\kappa^2=4=2\\times$ height` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Kramers–Kronig relations',
      statement: String.raw`Let the real impulse response $h(t)$ of a linear, time-invariant medium be causal ($h(t)=0$ for $t<0$), with $h\in L^1(\mathbb R)\cap L^2(\mathbb R)$. Define $\chi(\omega)=\int_0^\infty h(t)e^{i\omega t}\,dt$ (for example a susceptibility, with $n^2=1+\chi$). Then $\chi$ is analytic in the open upper half-plane and tends to zero along the real axis at high frequency. Its boundary values satisfy the following Hilbert-transform relations in $L^2$ and almost everywhere as principal values; with sufficient smoothness and decay they hold pointwise:
$$\mathrm{Re}\,\chi(\omega)=\frac1\pi\,\mathrm P\!\!\int_{-\infty}^{\infty}\frac{\mathrm{Im}\,\chi(\omega')}{\omega'-\omega}\,d\omega'=\frac2\pi\,\mathrm P\!\!\int_0^\infty\frac{\omega'\,\mathrm{Im}\,\chi(\omega')}{\omega'^2-\omega^2}\,d\omega',$$
and the matching formula expresses $\mathrm{Im}\,\chi$ through $\mathrm{Re}\,\chi$ (P is the Cauchy principal value; the second form uses $\mathrm{Re}\,\chi$ even and $\mathrm{Im}\,\chi$ odd in $\omega$, which holds because $\chi(t)$ is real). So the **dispersion** of a medium (how $n$ varies with frequency) is determined by its **absorption** at all frequencies, and vice versa.`,
      idea: String.raw`Causality and integrability mean the Fourier integral $\chi(\omega)=\int_0^\infty\chi(t)e^{i\omega t}dt$ converges and stays bounded for $\mathrm{Im}\,\omega\ge0$, so $\chi$ is analytic in the open upper half-plane (rca-19.2 and sig-6.4 describe the Paley–Wiener condition behind this). Cauchy's integral formula on a large half-circle closed in the upper half-plane, with the pole on the real axis indented, gives $\chi(\omega)=\frac{1}{i\pi}\mathrm P\!\int\frac{\chi(\omega')}{\omega'-\omega}d\omega'$; taking real and imaginary parts gives the relations. The Lorentz oscillator (em-11.12) is a causal model, so its real and imaginary parts are such a pair, and the relations tell us that any line of absorption must come with a characteristic wiggle of $n$ around it (anomalous dispersion, 3.9).`,
      caption: String.raw`Set the Lorentz line (position $\omega_0$, width $\gamma$, strength) and optionally a second line. Top left: $\mathrm{Im}\,\chi$ (absorption, red), $\mathrm{Re}\,\chi$ from the closed formula (blue), and $\mathrm{Re}\,\chi$ recomputed from the red curve alone by the principal-value integral (orange dashed): they coincide. Top right: the time response $\chi(t)$ by an inverse FFT: the exact causal model is zero for $t<0$, while the finite frequency grid leaves small numerical leakage. The slider *acausal advance* $\tau$ shifts the response earlier in time, $h_\tau(t)=h(t+\tau)$ and $\chi(\omega)\to\chi(\omega)e^{-i\omega\tau}$: the response now starts before $t=0$ (shaded), and the Kramers–Kronig integral of the new absorption no longer reproduces the new $\mathrm{Re}\,\chi$ (the error is the readout). The principal value is evaluated on a half-step shifted grid; the tail beyond $|\omega|=60$ is dropped.`,
      deps: ['em-11.12', 'rca-19.2', 'sig-6.4', 'rca-10.15'],
      refs: ['Hecht ch. 3'],
      tags: ['causality', 'dispersion', 'Hilbert transform'],
      credit: 'R. de L. Kronig, 1926; H. A. Kramers, 1927 (independently)',
      scope: String.raw`Causal real L¹ ∩ L² impulse response and linear time invariance give the stated boundary-value relation. A nonvanishing instantaneous/high-frequency term requires a subtracted formulation and is outside these hypotheses. The picture uses Lorentz lines and a pure time advance as an acausal counter-example; FFT bandwidth, periodic sampling and quadrature introduce numerical errors.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kramers%E2%80%93Kronig_relations' },
      viz(v) {
        const M = v.M, W = 60, H = 0.02, NF = 1024, DW = 0.03;
        const w0S = v.slider('line position $\\omega_0$', 0.8, 3, 1.5, { step: 0.05 });
        const gS = v.slider('width $\\gamma$', 0.1, 1, 0.3, { step: 0.02 });
        const sS = v.slider('strength $\\omega_p^2$', 0.1, 2, 0.8, { step: 0.05 });
        const l2 = v.toggle('add a second line at $\\omega_0+1.2$', false);
        const tS = v.slider('acausal advance $\\tau$', 0, 3, 0, { step: 0.1 });
        const A = v.stage({ x: [0, 4.5], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'frequency ω', height: 300, weight: 1.3, minWidth: 320, title: 'real part, imaginary part and the Kramers–Kronig integral' });
        const B = v.stage({ x: [-10, 30], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'time t', height: 300, weight: 1, minWidth: 300, title: 'time response χ(t)' });
        const lines = () => { const a = [[w0S.value, gS.value, sS.value]]; if (l2.value) a.push([w0S.value + 1.2, gS.value, sS.value * 0.6]); return a; };
        const chi = (w) => {
          let re = 0, im = 0;
          for (const [w0, g, wp] of lines()) { const d0 = w0 * w0 - w * w, d1 = -g * w, den = d0 * d0 + d1 * d1; re += (wp * d0) / den; im += (wp * g * w) / den; }
          return advanceResponse(re, im, w, tS.value);
        };
        let info = { err: 0, neg: 0, scale: 1 };
        v.render(() => {
          const ymax = (() => { let m = 0; for (let i = 0; i <= 80; i++) { const z = chi(0.05 + (i * 4.4) / 80); m = Math.max(m, Math.abs(z[0]), Math.abs(z[1])); } return m; })();
          A.setView([0, 4.5], [-1.15 * ymax, 1.15 * ymax]);
          const NG = Math.round((2 * W) / H), imG = new Float64Array(NG), wG = new Float64Array(NG);
          for (let m = 0; m < NG; m++) { wG[m] = -W + (m + 0.5) * H; imG[m] = chi(wG[m])[1]; }
          const kk = (w) => { let s = 0; for (let m = 0; m < NG; m++) s += imG[m] / (wG[m] - w); return (s * H) / Math.PI; };
          const grid = []; for (let i = 1; i <= 112; i++) grid.push(i * 2 * H);
          const kkv = grid.map(kk), exact = grid.map((w) => chi(w)[0]);
          A.hline(0, { color: 'faint', width: 1 });
          A.path(grid.map((w, i) => [w, exact[i]]), { color: 'accent', width: 2.6 });
          A.path(grid.map((w, i) => [w, chi(w)[1]]), { color: 'red', width: 2.4 });
          A.path(grid.map((w, i) => [w, kkv[i]]), { color: 'orange', width: 2.2, dash: [6, 4] });
          let err = 0; for (let i = 0; i < grid.length; i++) err = Math.max(err, Math.abs(kkv[i] - exact[i]));
          // time response
          const re = new Float64Array(NF), im = new Float64Array(NF);
          for (let j = 0; j < NF; j++) { const w = DW * (j < NF / 2 ? j : j - NF), z = chi(Math.abs(w)); re[j] = z[0]; im[j] = w >= 0 ? z[1] : -z[1]; }
          const rr = Array.from(re), ii = Array.from(im); M.fft(rr, ii);
          const dtt = TAU / (NF * DW), ct = rr.map((x) => (x * DW) / TAU);
          const pts = []; let tot = 0, neg = 0, mx = 1e-9;
          for (let n = 0; n < NF; n++) { const t = (n < NF / 2 ? n : n - NF) * dtt; tot += ct[n] ** 2; if (t < -1e-9) neg += ct[n] ** 2; if (t > -10 && t < 30) { pts.push([t, ct[n]]); mx = Math.max(mx, Math.abs(ct[n])); } }
          pts.sort((a, b) => a[0] - b[0]);
          B.setView([-10, 30], [-1.2 * mx, 1.2 * mx]);
          B.rect(-10, -1.2 * mx, 0, 1.2 * mx, { fill: 'red', fillAlpha: 0.1, stroke: false });
          B.vline(0, { color: 'muted', width: 1 });
          B.path(pts, { color: 'green', width: 2.2 });
          B.text('t < 0: no response if causal', -9.5, 1.05 * mx, { color: 'red', size: 12, align: 'left' });
          info = { err, neg: neg / tot, ymax };
        });
        v.legend([['accent', '$\\mathrm{Re}\\,\\chi$ (closed form)'], ['red', '$\\mathrm{Im}\\,\\chi$ (absorption)'], ['orange', '$\\mathrm{Re}\\,\\chi$ from the KK integral of the red curve', { dash: true }], ['green', '$\\chi(t)$']]);
        v.readout(() => `largest difference between the Kramers–Kronig reconstruction and $\\mathrm{Re}\\,\\chi$: $${v.sci(info.err, 2)}$ (relative to the peak value $${v.fix(info.ymax, 2)}$: ${v.fix((100 * info.err) / info.ymax, 2)}%) · fraction of the response energy at $t<0$: $${v.sci(info.neg, 2)}$ · ${tS.value > 0 ? '**acausal** response: the relation fails' : 'causal response: the relation holds'}`);
      },
    },
  ],
};
