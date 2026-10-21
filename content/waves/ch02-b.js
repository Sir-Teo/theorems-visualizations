// Waves & Optics — Chapter 2 (part b): drums, mode counting, Fourier transforms, resonance
import { TAU, BZ, besselJ, cmul, cdiv, csin, ccos, csqrt, diverging } from './ch02.shared.js';

export default {
  collection: 'waves',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Model',
      name: 'Modes of a circular drum',
      statement: String.raw`A circular membrane of radius $R$ fixed along its rim has modes, in polar coordinates $(r,\phi)$,
$$u_{mn}=J_m\!\Big(\alpha_{mn}\frac rR\Big)\cos\big(m(\phi-\psi)\big)\cos\omega_{mn}t,\qquad \omega_{mn}=\alpha_{mn}\frac cR,$$
where $J_m$ is the Bessel function of order $m=0,1,2,\dots$ and $\alpha_{mn}$ is its $n$-th positive zero. Mode $(m,n)$ has $m$ nodal diameters and $n-1$ nodal circles inside the rim (plus the rim itself). Modes with $m\ge1$ are doubly degenerate (the orientation $\psi$ is free). The frequencies are **not** integer multiples of the lowest one: $\omega_{01}:\omega_{11}:\omega_{21}:\omega_{02}:\dots\approx1:1.59:2.14:2.30:\dots$ This is why a drum has no definite pitch, unlike a string.`,
      idea: String.raw`Separating variables in polar coordinates (pde-5.6, as for the rectangle in 2.6) gives an angular equation with solutions $\cos m\phi$ ($m$ an integer, so that the shape is single-valued) and a radial equation that is Bessel's equation (ode-4.4) of order $m$. Only the solution regular at the centre, $J_m$, is allowed, and the clamped rim demands $J_m(\alpha R/R)=0$, which picks the zeros. Zeros of Bessel functions are roughly evenly spaced (about $\pi$ apart for large argument), but they start irregularly and depend on $m$, so the spectrum has no harmonic structure. The rectangle's frequencies were square roots of a sum of squares of integers; here the arithmetic is replaced by transcendental numbers.`,
      caption: String.raw`Choose $m$ (nodal diameters) and $n$ (radial variations), or **click** a dot in the spectrum. Red and blue are opposite displacements; the black circles and diameters are nodal lines. For $m\ge1$ the **orientation** slider turns the pattern, as the mode is degenerate. The spectrum (right) puts each mode at its frequency divided by the lowest, with the integer multiples a string would have shown as faint vertical lines: the drum's dots fall between them. The speaker buttons play the first modes as sound partials, once with the drum's frequencies and once with harmonic ones.`,
      deps: ['waves-2.6', 'ode-4.4'],
      see: ['music-3.7', 'pde-7.1', 'ode-4.4'],
      refs: ['Crawford ch. 7'],
      tags: ['drum', 'bessel functions', 'normal modes'],
      scope: String.raw`Ideal membrane, small displacements, uniform tension, rim clamped. Real drums are tuned by air loading and by the head's stiffness, which moves the modes toward harmonic ratios in timpani.`,
      credit: 'Circular drum in Bessel functions: Leonhard Euler, 1764; the functions are named for Friedrich Bessel, 1824 (planetary perturbations)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vibration_of_a_circular_membrane' },
      viz(v) {
        const M = v.M, MMAX = 6, NMAX = 5;
        const mS = v.slider('nodal diameters $m$', 0, MMAX, 2, { int: true });
        const nS = v.slider('radial index $n$', 1, 4, 1, { int: true });
        const psiS = v.slider('orientation $\\psi$ (°)', 0, 180, 0, { step: 1 });
        const s = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, axes: false, height: 340, title: 'displacement and nodal lines', weight: 1.2, minWidth: 320 });
        const sp = v.stage({ x: [0.5, 7.3], y: [-0.6, MMAX + 0.6], axes: 'box', gutter: true, xlabel: 'ω / ω₀₁', ylabel: 'm', yticks: [0, 1, 2, 3, 4, 5, 6], height: 340, title: 'the spectrum: click a mode', minWidth: 320 });
        const w01 = BZ(0, 1);
        const ratio = (m, n) => BZ(m, n) / w01;
        // choose by clicking near a dot
        sp.onClick((x, y) => {
          let best = null, bd = 1e9;
          for (let m = 0; m <= MMAX; m++) for (let n = 1; n <= NMAX; n++) { const r = ratio(m, n); if (r > 7.3) continue; const d = ((x - r) / 6.8) ** 2 + ((y - m) / 7) ** 2; if (d < bd) { bd = d; best = [m, n]; } }
          if (best && best[1] <= 4) { mS.set(best[0]); nS.set(best[1]); }
        });
        const snd = [v.soundButton('Listen: drum partials', (sn) => { sn.tone(partials(false), { duration: 2.2, gain: 0.28 }); }), v.soundButton('Listen: harmonic partials', (sn) => { sn.tone(partials(true), { duration: 2.2, gain: 0.28 }); })];
        function partials(harm) {
          const list = []; for (let m = 0; m <= 4; m++) for (let n = 1; n <= 3; n++) list.push(ratio(m, n));
          list.sort((a, b) => a - b); const f0 = 196;
          return list.slice(0, 8).map((r, i) => [f0 * (harm ? i + 1 : r), 1 / (1 + 0.5 * i)]);
        }
        let prof = null, pk = '', cur = null;
        const profile = (m, n) => {
          const k = m + ',' + n; if (k === pk) return prof; pk = k;
          const al = BZ(m, n), NP = 400, arr = new Float64Array(NP + 1); let mx = 0;
          for (let i = 0; i <= NP; i++) { arr[i] = besselJ(m, (al * i) / NP); mx = Math.max(mx, Math.abs(arr[i])); }
          for (let i = 0; i <= NP; i++) arr[i] /= mx;
          prof = { arr, NP }; return prof;
        };
        v.animate((t) => {
          const m = mS.value, n = nS.value, psi = (psiS.value * Math.PI) / 180, al = BZ(m, n);
          psiS.el.hidden = m === 0;
          const { arr, NP } = profile(m, n);
          const ph = Math.cos(TAU * 0.2 * ratio(m, n) * 0.5 * t);
          const dv = diverging(v);
          s.raster((x, y) => {
            const r = Math.hypot(x, y); if (r > 1) return null;
            const u = r * NP, i = Math.min(NP - 1, Math.floor(u)), f = u - i, R = arr[i] * (1 - f) + arr[i + 1] * f;
            return dv(R * Math.cos(m * (Math.atan2(y, x) - psi)) * ph);
          }, { res: 3, key: `${m}|${n}|${psiS.value}|${Math.round(ph * 200)}|${v.color('panel')}`, rect: [-1.05, -1.05, 1.05, 1.05] });
          for (let k = 1; k < n; k++) s.circle(0, 0, BZ(m, k) / al, { color: 'ink', width: 2.2, fill: false });
          for (let j = 0; m > 0 && j < m; j++) { const a = psi + ((2 * j + 1) * Math.PI) / (2 * m); s.line(-Math.cos(a), -Math.sin(a), Math.cos(a), Math.sin(a), { color: 'ink', width: 2.2 }); }
          s.circle(0, 0, 1, { color: 'ink', width: 3.2, fill: false });
          // spectrum
          for (let k = 1; k <= 7; k++) sp.vline(k, { color: 'faint', width: 1.2, dash: [3, 4] });
          sp.text('integer multiples (a string)', 7.25, MMAX + 0.45, { color: 'muted', size: 11, align: 'right' });
          for (let mm = 0; mm <= MMAX; mm++) for (let nn = 1; nn <= NMAX; nn++) {
            const r = ratio(mm, nn); if (r > 7.2) continue; const sel = mm === m && nn === n;
            sp.dot(r, mm, { r: sel ? 8 : 4.5, color: sel ? 'gold' : mm === 0 ? 'accent' : 'orange' });
          }
          sp.text(`${v.fix(ratio(m, n), 3)}`, ratio(m, n), m, { size: 11.5, color: 'ink', dy: -14, align: 'center' });
          cur = { m, n, al, resid: besselJ(m, al) };
        }, { still: 0.6 });
        v.legend([['accent', 'axisymmetric modes ($m=0$)'], ['orange', 'modes with nodal diameters'], ['gold', 'chosen mode']]);
        v.readout(() => {
          if (!cur) return '';
          const { m, n, al, resid } = cur, r = al / w01, near = Math.round(r);
          return `mode $(m,n)=(${m},${n})$: $\\alpha_{${m}${n}}=${v.fix(al, 4)}$ (check: $J_${m}(\\alpha)=${v.sci(Math.abs(resid) < 1e-12 ? 0 : resid, 2)}$, so the rim is a node) · frequency $${v.fix(r, 3)}\\,\\omega_{01}$, ${Math.abs(r - near) < 0.02 ? 'almost' : 'not'} an integer multiple (nearest: ${near}, off by $${v.fix(Math.abs(r - near), 2)}$) · ${m} nodal diameter${m === 1 ? '' : 's'}, ${n - 1} nodal circle${n === 2 ? '' : 's'} inside the rim${m > 0 ? ' · degenerate: the orientation $\\psi$ is free' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Counting modes in a box (Weyl’s law)',
      statement: String.raw`For waves in a box of volume $V$ in $d$ dimensions with fixed (Dirichlet) walls, the allowed wavevectors form the lattice $\mathbf k=\pi(n_1/L_1,\dots,n_d/L_d)$, $n_i=1,2,\dots$, and the number of modes with wavenumber below $k$ is, for large $k$,
$$N(k)\simeq\frac{\omega_d\,V}{(2\pi)^d}\,k^{d}\qquad(\omega_d=\text{volume of the unit ball: }2,\ \pi,\ \tfrac{4\pi}{3}),$$
in particular $N=\dfrac{Lk}{\pi},\ \dfrac{Ak^2}{4\pi},\ \dfrac{Vk^3}{6\pi^2}$ in one, two and three dimensions. With $\omega=ck$ the **density of states** is
$$g(\omega)=\frac{dN}{d\omega}=\frac{V\,\omega^2}{2\pi^2c^3}\quad(d=3),$$
growing as $\omega^2$. The leading error is a boundary correction of relative order $1/(kL)$, $-\dfrac{Pk}{4\pi}$ in 2D ($P$ the perimeter) and $-\dfrac{Sk^2}{16\pi}$ in 3D ($S$ the surface area). The count does not depend on the shape of the box, only on its volume (this is **Weyl's law**, valid for any region).`,
      idea: String.raw`The modes of a rectangular box are products of string modes (2.6), so each mode corresponds to one point $(n_1,\dots,n_d)$ of the positive-integer lattice and the number of modes below $k$ is the number of lattice points inside an octant of the ball of radius $k$ in scaled coordinates. For large $k$ that count equals the octant's volume up to a surface correction, since the lattice has unit cells of volume $\pi^d/V$ and the cells are small compared with the ball. The three-dimensional density $\omega^2$ is what Rayleigh and Jeans multiplied by two polarisations and an energy per mode to count the radiation modes of a cavity (and, with the wave speed of sound, what Debye did for solids).`,
      caption: String.raw`Left: the allowed $\mathbf k$-points (for $d=3$ the layer $n_3=1$ only) with a draggable gold point that sets the radius $k$; points inside the quarter circle count as modes. Middle: the exact count $N(k)$ as a staircase, the leading term (dashed) and the leading term plus the boundary correction (green). Right: the number of modes per unit $k$ in bins, against the density of states $g(k)$. Change the box sides: the staircase hugs the same smooth curve. Make the sides equal (a cube or a square) and the modes bunch into degenerate clumps, yet the average follows the same law.`,
      deps: ['waves-2.6', 'pde-7.10'],
      see: ['thermo-9.2'],
      refs: ['Crawford ch. 7'],
      tags: ['density of states', 'weyl law', 'counting'],
      scope: String.raw`Dirichlet waves in a box with $c$ independent of frequency; for electromagnetic waves multiply by 2 for the two polarisations. The law holds for any region of volume $V$, not only for boxes (Weyl, 1911).`,
      credit: 'Hermann Weyl, 1911; the cavity mode count: Lord Rayleigh, 1900, and James Jeans, 1905',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weyl_law' },
      viz(v) {
        const M = v.M, KV = 24, KM = 34;
        const dS = v.select('dimension', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const xS = v.slider('side $L_x$', 0.6, 2, 1, { step: 0.05 });
        const yS = v.slider('side $L_y$', 0.6, 2, 1.3, { step: 0.05 });
        const zS = v.slider('side $L_z$', 0.6, 2, 1.7, { step: 0.05 });
        const lat = v.stage({ x: [0, KV], y: [0, KV], equal: true, axes: 'box', gutter: true, xlabel: 'kₓ', ylabel: 'k_y', height: 300, title: 'allowed wavevectors', minWidth: 280 });
        const cs = v.stage({ x: [0, KM], y: [0, 100], axes: 'box', gutter: true, xlabel: 'k = ω/c', ylabel: 'N(k)', height: 300, title: 'number of modes below k', minWidth: 280 });
        const ds = v.stage({ x: [0, KM], y: [0, 100], axes: 'box', gutter: true, xlabel: 'k = ω/c', ylabel: 'modes per unit k', height: 300, title: 'density of states', minWidth: 280 });
        const h = lat.handle(14, 9, { color: 'gold', r: 8, label: 'k', constrain: (x, y) => [M.clamp(x, 0.2, KV), dS.value === 1 ? 0 : M.clamp(y, 0.2, KV)] });
        let eigK = '', eig = null;
        const eigenvalues = () => {
          const d = dS.value, L = [xS.value, yS.value, zS.value], key = d + ',' + L.slice(0, d).join(',');
          if (key === eigK) return eig; eigK = key;
          const out = [];
          const a1 = Math.PI / L[0], a2 = Math.PI / L[1], a3 = Math.PI / L[2];
          for (let i = 1; i * a1 < KM; i++) {
            if (d === 1) { out.push(i * a1); continue; }
            for (let j = 1; (i * a1) ** 2 + (j * a2) ** 2 < KM * KM; j++) {
              if (d === 2) { out.push(Math.hypot(i * a1, j * a2)); continue; }
              for (let k = 1; (i * a1) ** 2 + (j * a2) ** 2 + (k * a3) ** 2 < KM * KM; k++) out.push(Math.sqrt((i * a1) ** 2 + (j * a2) ** 2 + (k * a3) ** 2));
            }
          }
          eig = Float64Array.from(out).sort(); return eig;
        };
        const dims = () => { const d = dS.value, L = [xS.value, yS.value, zS.value].slice(0, d); const V = L.reduce((p, q) => p * q, 1); const S = d === 1 ? 2 : d === 2 ? 2 * (L[0] + L[1]) : 2 * (L[0] * L[1] + L[1] * L[2] + L[0] * L[2]); return { d, V, S }; };
        const lead = (k, D) => (D.d === 1 ? (D.V * k) / Math.PI : D.d === 2 ? (D.V * k * k) / (4 * Math.PI) : (D.V * k ** 3) / (6 * Math.PI ** 2));
        const corr = (k, D) => lead(k, D) - (D.d === 1 ? 0.5 : D.d === 2 ? (D.S * k) / (4 * Math.PI) : (D.S * k * k) / (16 * Math.PI));
        const dens = (k, D) => (D.d === 1 ? D.V / Math.PI : D.d === 2 ? (D.V * k) / (2 * Math.PI) : (D.V * k * k) / (2 * Math.PI ** 2));
        const countBelow = (E, k) => { let lo = 0, hi = E.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (E[mid] < k) lo = mid + 1; else hi = mid; } return lo; };
        let info = null;
        v.render(() => {
          const D = dims(), d = D.d, E = eigenvalues();
          yS.el.hidden = d < 2; zS.el.hidden = d < 3;
          if (d === 1 && h.y !== 0) h.set(h.x, 0);
          const kz = Math.PI / zS.value, kr = Math.hypot(h.x, h.y) + (d === 1 ? 0 : 0);
          const kk = d === 1 ? h.x : kr;
          // lattice picture
          lat.setView([0, KV], d === 1 ? [-KV / 2.4, KV / 2.4] : [0, KV]);
          lat.setLabels('kₓ', d === 1 ? null : 'k_y');
          const ax = Math.PI / xS.value, ay = Math.PI / yS.value;
          const kEff = d === 3 ? Math.sqrt(Math.max(0, kk * kk - kz * kz)) : kk;
          if (d === 1) { lat.hline(0, { color: 'faint' }); lat.line(0, 0, kk, 0, { color: 'gold', width: 5, cap: 'butt' }); }
          else {
            const arc = Array.from({ length: 61 }, (_, i) => [kEff * Math.cos((i / 60) * Math.PI / 2), kEff * Math.sin((i / 60) * Math.PI / 2)]);
            lat.poly([[0, 0], ...arc], { fill: 'gold', fillAlpha: 0.1, stroke: false });
            lat.path(arc, { color: 'gold', width: 2 });
          }
          for (let i = 1; i * ax < KV; i++) {
            if (d === 1) { lat.dot(i * ax, 0, { r: 4.5, color: i * ax < kk ? 'gold' : 'muted', hollow: i * ax >= kk }); continue; }
            for (let j = 1; j * ay < KV; j++) {
              const kx = i * ax, ky = j * ay, inside = kx * kx + ky * ky + (d === 3 ? kz * kz : 0) < kk * kk;
              lat.dot(kx, ky, { r: 3.8, color: inside ? 'gold' : 'muted', hollow: !inside });
            }
          }
          if (d === 3) lat.corner('slice n₃ = 1', 'tr', { color: 'muted' });
          // staircase
          const Nmax = Math.max(8, 1.15 * lead(KM, D));
          cs.setView([0, KM], [0, Nmax]);
          const pts = []; for (let i = 0; i < E.length; i++) { pts.push([E[i], i], [E[i], i + 1]); }
          pts.push([KM, E.length]);
          cs.path(pts, { color: 'accent', width: 1.8 });
          cs.fn((k) => lead(k, D), { color: 'muted', width: 2, dash: [6, 4] });
          cs.fn((k) => Math.max(0, corr(k, D)), { color: 'green', width: 2 });
          const Nc = countBelow(E, kk);
          cs.vline(kk, { color: 'gold', width: 1.4 }); cs.dot(kk, Nc, { r: 5.5, color: 'gold' });
          // density
          const bw = d === 3 ? 1.5 : d === 2 ? 2 : 4, nb = Math.floor(KM / bw), edges = Array.from({ length: nb + 1 }, (_, i) => i * bw), counts = new Array(nb).fill(0);
          for (let i = 0; i < E.length; i++) { const b = Math.floor(E[i] / bw); if (b < nb) counts[b] += 1 / bw; }
          const gmax = Math.max(dens(KM, D) * 1.25, 0.5);
          ds.setView([0, KM], [0, gmax]);
          ds.hist({ edges, counts }, { color: 'accent', fillAlpha: 0.25 });
          ds.fn((k) => dens(k, D), { color: 'green', width: 2.4 });
          ds.vline(kk, { color: 'gold', width: 1.4 });
          info = { D, kk, Nc, L: lead(kk, D), C: corr(kk, D), g: dens(kk, D), bw };
        });
        v.legend([['accent', 'exact count / modes per bin'], ['muted', 'leading term', { dash: true }], ['green', 'with boundary correction / $g(k)$'], ['gold', 'chosen $k$']]);
        v.readout(() => {
          if (!info) return '';
          const { D, kk, Nc, L, C, g, bw } = info, nm = D.d === 1 ? 'L k/\\pi' : D.d === 2 ? 'A k^2/4\\pi' : 'V k^3/6\\pi^2';
          return `$k=${v.fix(kk, 2)}$ (so $\\omega=ck$): exact number of modes $N=${Nc}$ · leading term $${nm}=${v.fix(L, 1)}$ (error $${v.fix((100 * (L - Nc)) / Math.max(Nc, 1), 1)}\\,\\%$) · with the boundary term $${v.fix(C, 1)}$ (error $${v.fix((100 * (C - Nc)) / Math.max(Nc, 1), 1)}\\,\\%$) · density of states $g=${v.fix(g, 2)}$ per unit $k$ ${D.d === 3 ? '($\\propto k^2$: doubling $k$ quadruples it)' : D.d === 2 ? '($\\propto k$)' : '(constant)'}; bins are ${bw} wide`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Fourier transform of a pulse',
      statement: String.raw`The **Fourier transform** of a pulse $x(t)$ (integrable, so that it dies away) is
$$\hat x(f)=\int_{-\infty}^{\infty}x(t)\,e^{-2\pi i f t}\,dt,\qquad x(t)=\int_{-\infty}^{\infty}\hat x(f)\,e^{2\pi i f t}\,df,$$
the amplitude $|\hat x(f)|$ and phase $\arg\hat x(f)$ of the harmonic wave of frequency $f$ needed to build the pulse. It is the limit of the Fourier series of a periodic train of copies of the pulse with period $P$, whose coefficients are $c_n=\hat x(n/P)/P$ at the frequencies $f_n=n/P$: as $P\to\infty$ the lines, a spacing $1/P$ apart, merge into the continuous spectrum $\hat x$. Shifting the pulse in time by $t_0$ multiplies $\hat x(f)$ by $e^{-2\pi ift_0}$ and leaves $|\hat x|$ unchanged.`,
      idea: String.raw`A periodic function has a Fourier series (2.3, in complex form) with coefficients $c_n=\frac1P\int_{-P/2}^{P/2}x\,e^{-2\pi int/P}dt$. If one period contains the whole pulse, that integral is the transform integral evaluated at the sample points $f=n/P$. Multiplying by $P$ gives samples of $\hat x$ at spacing $1/P$, which become dense as $P$ grows: a Riemann sum for the inverse-transform integral. Smooth pulses have spectra that decay fast; sharp edges (the box) give slowly decaying sinc tails; a one-sided pulse has a complex spectrum because it is not symmetric about $t=0$.`,
      caption: String.raw`Top: a periodic train of pulses (shape, width and delay are yours to set) in a fixed window. Below left: the amplitude of each Fourier component of the train, drawn as a vertical line at $f=n/P$ with height $P|c_n|$, on top of the gold curve $|\hat x(f)|$. Below right: the phases. **Slide the period $P$ up**: the lines crowd together onto the curve and only one pulse remains in the window. Move the pulse in time with the delay slider: the amplitudes do not change but the phases tilt like a straight line of slope $-2\pi t_0$.`,
      deps: ['waves-2.3', 'rca-9.1', 'rca-9.11'],
      see: ['sig-5.1', 'rca-9.2'],
      refs: ['Hecht ch. 7'],
      tags: ['fourier transform', 'spectrum', 'pulse'],
      credit: 'Joseph Fourier, 1822',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_transform' },
      viz(v) {
        const M = v.M, NS = 4096, FMAX = 3.5, TWIN = 8;
        const shape = v.select('pulse', [{ value: 'box', label: 'box' }, { value: 'tri', label: 'triangle' }, { value: 'gauss', label: 'Gaussian' }, { value: 'exp', label: 'one-sided exponential' }], 'box');
        const pS = v.slider('period $P$', 2, 40, 6, { log: true, sig: 2 });
        const t0S = v.slider('delay $t_0$', -1, 1, 0.3, { step: 0.05 });
        const SG = 0.3, TAUE = 0.4;
        const sinc = (f) => (Math.abs(f) < 1e-12 ? 1 : Math.sin(Math.PI * f) / (Math.PI * f));
        const SH = {
          box: { x: (t) => (Math.abs(t) < 0.5 ? 1 : 0), F: (f) => [sinc(f), 0], e2: 1 },
          tri: { x: (t) => Math.max(0, 1 - Math.abs(t)), F: (f) => [sinc(f) ** 2, 0], e2: 2 / 3 },
          gauss: { x: (t) => Math.exp(-(t * t) / (2 * SG * SG)), F: (f) => [SG * Math.sqrt(TAU) * Math.exp(-2 * Math.PI ** 2 * SG * SG * f * f), 0], e2: SG * Math.sqrt(Math.PI) },
          exp: { x: (t) => (t >= 0 ? Math.exp(-t / TAUE) : 0), F: (f) => cdiv([TAUE, 0], [1, TAU * TAUE * f]), e2: TAUE / 2 },
        };
        const full = (f) => { const [a, b] = SH[shape.value].F(f), ph = -TAU * f * t0S.value; return cmul([a, b], [Math.cos(ph), Math.sin(ph)]); };
        const tr = v.stage({ x: [-TWIN, TWIN], y: [-0.25, 1.35], axes: 'box', gutter: true, xlabel: 't', yticks: [0, 1], height: 190, full: true, title: 'periodic train of pulses' });
        const am = v.stage({ x: [-FMAX, FMAX], y: [0, 1.2], axes: 'box', gutter: true, xlabel: 'frequency f', ylabel: 'P·|cₙ|', height: 230, title: 'amplitude of each component', minWidth: 300 });
        const phs = v.stage({ x: [-FMAX, FMAX], y: [-Math.PI * 1.1, Math.PI * 1.1], axes: 'box', gutter: true, xlabel: 'frequency f', ylabel: 'phase', height: 230, title: 'phase of each component', minWidth: 300, yticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']] });
        let info = null, cache = '', lines = [];
        v.render(() => {
          const P = pS.value, t0 = t0S.value, sh = SH[shape.value];
          const xp = (t) => { let s = 0; for (let j = -4; j <= 4; j++) s += sh.x(t - t0 - j * P); return s; };
          // Fourier series of one period by FFT
          const xs = new Float64Array(NS); for (let n = 0; n < NS; n++) xs[n] = xp(-P / 2 + (n * P) / NS);
          const X = M.fftReal(xs), K = Math.min(NS / 2 - 1, Math.floor(FMAX * P));
          lines = [];
          let dev = 0, par = 0;
          for (let k = -K; k <= K; k++) {
            const idx = (k + NS) % NS, sgn = Math.abs(k) % 2 ? -1 : 1;
            const re = (sgn * X.re[idx]) / NS * P, im = (sgn * X.im[idx]) / NS * P, f = k / P, F = full(f);
            lines.push({ f, a: Math.hypot(re, im), ph: Math.atan2(im, re) });
            dev = Math.max(dev, Math.hypot(re - F[0], im - F[1]));
          }
          for (let k = 0; k < NS; k++) par += (Math.hypot(X.re[k], X.im[k]) / NS) ** 2;
          // time domain
          tr.hline(0, { color: 'faint', width: 1 });
          tr.fn(xp, { color: 'accent', width: 2.6, n: 1500 });
          if (t0 + P < TWIN - 0.5) tr.measure(t0, 1.2, t0 + P, 1.2, 'P', { color: 'orange' });
          // amplitude
          const F0 = Math.max(Math.hypot(...sh.F(0)), 1e-9);
          am.setView([-FMAX, FMAX], [0, 1.2 * F0]);
          const thick = P > 25 ? 1.2 : P > 10 ? 1.8 : 2.6;
          for (const L of lines) am.line(L.f, 0, L.f, L.a, { color: 'accent', width: thick, alpha: 0.85 });
          if (P < 14) for (const L of lines) am.dot(L.f, L.a, { r: 3.2, color: 'accent' });
          am.fn((f) => Math.hypot(...sh.F(f)), { color: 'gold', width: 2.4, n: 700 });
          am.corner(`line spacing 1/P = ${v.fix(1 / P, 3)}`, 'tr', { color: 'ink', weight: 600 });
          // phase
          for (const L of lines) if (L.a > 0.03 * F0) phs.dot(L.f, L.ph, { r: P > 20 ? 2 : 3.5, color: 'accent' });
          let prev = null; const curve = [];
          for (let i = 0; i <= 700; i++) { const f = -FMAX + (2 * FMAX * i) / 700, F = full(f); if (Math.hypot(F[0], F[1]) < 0.03 * F0) { curve.push(null); prev = null; continue; } const a = Math.atan2(F[1], F[0]); if (prev !== null && Math.abs(a - prev) > Math.PI) curve.push(null); curve.push([f, a]); prev = a; }
          phs.path(curve, { color: 'gold', width: 1.4, alpha: 0.8 });
          phs.hline(0, { color: 'faint' });
          info = { P, dev, par, e2: sh.e2, nl: lines.length, F0 };
        });
        v.legend([['accent', 'Fourier-series line of the periodic train'], ['gold', 'transform $\\hat x(f)$ of one pulse']]);
        v.readout(() => {
          if (!info) return '';
          return `period $P=${v.fix(info.P, 1)}$ → ${info.nl} lines in the window, spaced $1/P=${v.fix(1 / info.P, 3)}$ · largest difference between the numerically computed series coefficients $P\\,c_n$ and the transform $\\hat x(n/P)$ (real and imaginary part): $${v.sci(info.dev, 2)}$ (so $c_n=\\hat x(n/P)/P$) · Parseval: $\\sum|c_n|^2=${v.fix(info.par, 5)}$ and $\\frac1P\\int|x|^2=${v.fix(info.e2 / info.P, 5)}$ · the delay changes only the phases`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Bandwidth theorem for wave pulses',
      statement: String.raw`Let a pulse $x(t)$ have finite energy, with $|x(t)|^2$ and $|\hat x(\omega)|^2$ taken as distributions of time and of angular frequency, and let $\Delta t$ and $\Delta\omega$ be their standard deviations (rms durations and bandwidths about their means). Then
$$\Delta t\;\Delta\omega\;\ge\;\tfrac12 ,$$
with equality only for a Gaussian envelope with no chirp, $x(t)\propto e^{-t^2/4\Delta t^2}e^{i\omega_0t}$. A chirped Gaussian $e^{-(1-ib)t^2/4\Delta t^2}$ gives $\Delta t\,\Delta\omega=\tfrac12\sqrt{1+b^2}$. The bandwidth is independent of the carrier frequency $\omega_0$: it depends on how the carrier is switched on and off. A pulse with a few cycles has a wide spectrum; a nearly pure tone needs a long train.`,
      idea: String.raw`Centre the pulse so that both means vanish. The Plancherel identity (sig-5.15) turns $\int\omega^2|\hat x|^2d\omega$ into $2\pi\int|x'|^2dt$, so the claim is a statement about $\int t^2|x|^2$ and $\int|x'|^2$. By the Cauchy–Schwarz inequality, $\big|\int t\,x\,\bar x'\,dt\big|^2\le\int t^2|x|^2\int|x'|^2$, and integration by parts shows that the real part of the left integral is $-\tfrac12\int|x|^2$. Hence $\Delta t^2\Delta\omega^2\ge\tfrac14$, with equality when $x'$ is proportional to $t\,x$, the differential equation of a Gaussian. Physically, resolving a short pulse in time requires many frequencies to interfere constructively only briefly; a narrow spectrum cannot produce a sharp event. The same statement, with $p=\hbar k$, is the position–momentum uncertainty relation of quantum mechanics.`,
      caption: String.raw`A wave pulse of carrier frequency $\nu_0$ (in PHz, visible light is about 0.4–0.75) and duration $\tau$ (in fs). Top: the field and its envelope. Middle: the spectrum $|\hat x|^2$ with the rms band shaded, computed by an FFT of the signal itself. Right: $\Delta\omega$ against $\Delta t$ on log axes. The shaded region below the hyperbola $\Delta t\,\Delta\omega=\tfrac12$ is forbidden: slide $\tau$ and your point slides along a parallel line, never entering it. The coloured dots are the other envelope shapes at the same $\tau$, and the bars give each shape's product $\Delta t\,\Delta\omega$: only the Gaussian reaches the red line $\tfrac12$, and only with chirp $b=0$.`,
      deps: ['waves-2.9', 'sig-5.15'],
      see: ['music-4.6', 'sig-5.15', 'qm-2.11', 'rca-9.13'],
      refs: ['Hecht ch. 7', 'Crawford ch. 6'],
      tags: ['bandwidth', 'uncertainty', 'pulses'],
      credit: 'Time–frequency form: Dennis Gabor, 1946; the same inequality for position and momentum: Werner Heisenberg, 1927',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gabor_limit' },
      viz(v) {
        const M = v.M, NS = 16384, TW = 1024, DT = TW / NS;
        const shape = v.select('envelope', [{ value: 'gauss', label: 'Gaussian' }, { value: 'sech', label: 'sech' }, { value: 'tri', label: 'triangle' }, { value: 'exp', label: 'two-sided exponential' }], 'gauss');
        const tauS = v.slider('duration scale $\\tau$ (fs)', 1.5, 16, 5, { log: true, sig: 2 });
        const bS = v.slider('chirp $b$', -3, 3, 0, { step: 0.05 });
        const nuS = v.slider('carrier $\\nu_0$ (PHz)', 0.2, 1, 0.5, { step: 0.01 });
        const names = { gauss: 'Gaussian', sech: 'sech', tri: 'triangle', exp: 'exponential' };
        const cols = { gauss: 'accent', sech: 'orange', tri: 'purple', exp: 'teal' };
        const env = (name, t, tau) => name === 'gauss' ? Math.exp(-(t * t) / (2 * tau * tau)) : name === 'sech' ? 1 / Math.cosh(t / tau) : name === 'tri' ? Math.max(0, 1 - Math.abs(t) / (2 * tau)) : Math.exp(-Math.abs(t) / tau);
        const sig = (name, t, tau, b, nu) => { const g = env(name, t, tau), ph = TAU * nu * t + (b * t * t) / (2 * tau * tau); return [g * Math.cos(ph), g * Math.sin(ph)]; };
        const cache = new Map();
        const stats = (name, tau, b, nu) => {
          const key = [name, tau, b, nu].join('|'); if (cache.has(key)) return cache.get(key);
          const re = new Float64Array(NS), im = new Float64Array(NS);
          let m0 = 0, m1 = 0, m2 = 0;
          for (let n = 0; n < NS; n++) { const t = (n - NS / 2) * DT, [a, c] = sig(name, t, tau, b, nu); re[n] = a; im[n] = c; const I = a * a + c * c; m0 += I; m1 += I * t; m2 += I * t * t; }
          const tm = m1 / m0, Dt = Math.sqrt(m2 / m0 - tm * tm);
          M.fft(re, im);
          const spec = new Float64Array(NS); let s0 = 0, s1 = 0, s2 = 0;
          for (let k = 0; k < NS; k++) { const nuk = (k < NS / 2 ? k : k - NS) / TW, P = re[k] * re[k] + im[k] * im[k]; spec[k] = P; s0 += P; s1 += P * nuk; s2 += P * nuk * nuk; }
          const nm = s1 / s0, Dnu = Math.sqrt(Math.max(0, s2 / s0 - nm * nm)), smax = Math.max(...spec);
          const out = { Dt, Dw: TAU * Dnu, nm, Dnu, spec, smax };
          if (cache.size > 40) cache.clear();
          cache.set(key, out); return out;
        };
        const sg = v.stage({ x: [-14, 14], y: [-1.3, 1.3], axes: 'box', gutter: true, xlabel: 't (fs)', yticks: [], height: 190, full: true, title: 'the wave pulse' });
        const sp = v.stage({ x: [0, 1], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'frequency ν (PHz)', yticks: [], height: 240, title: 'its spectrum |x̂(ν)|²', minWidth: 300 });
        const bt = v.stage({ x: [0.4, 30], y: [0.03, 4], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'Δt (fs)', ylabel: 'Δω (rad/fs)', height: 240, title: 'Δω against Δt', minWidth: 300 });
        const bp = v.stage({ x: [0.4, 4.6], y: [0, 1.25], axes: 'box', gutter: true, ylabel: 'Δt·Δω', height: 240, title: 'product by envelope shape', minWidth: 240, xticks: [[1, 'Gauss'], [2, 'sech'], [3, 'triang.'], [4, 'exp']] });
        let cur = null;
        v.render(() => {
          const name = shape.value, tau = tauS.value, b = bS.value, nu = nuS.value;
          const S = stats(name, tau, b, nu);
          // pulse
          const w = Math.max(8, 5 * S.Dt);
          sg.setView([-w, w], [-1.3, 1.3]);
          sg.hline(0, { color: 'faint' });
          sg.fn((t) => env(name, t, tau), { color: 'muted', width: 1.2, dash: [4, 4], n: 800 });
          sg.fn((t) => -env(name, t, tau), { color: 'muted', width: 1.2, dash: [4, 4], n: 800 });
          sg.fn((t) => sig(name, t, tau, b, nu)[0], { color: 'accent', width: 2, n: Math.min(6000, Math.ceil(w * 2 * nu * 40 + 800)) });
          sg.vband(-S.Dt, S.Dt, { color: 'gold', alpha: 0.12 });
          sg.text('±Δt', S.Dt, 1.18, { color: 'gold', size: 12, align: 'left', dx: 4 });
          // spectrum
          const half = Math.max(0.12, 4.5 * S.Dnu);
          const lo = Math.max(0, S.nm - half), hi = S.nm + half;
          sp.setView([lo, hi], [0, 1.15]);
          const specAt = (x) => { const k = Math.round(x * TW), kk = ((k % NS) + NS) % NS; return S.spec[kk] / S.smax; };
          sp.vband(S.nm - S.Dnu, S.nm + S.Dnu, { color: 'gold', alpha: 0.14 });
          sp.fn(specAt, { color: 'accent', width: 2.4, n: 900, fill: 'accent', fillAlpha: 0.12 });
          sp.vline(S.nm, { color: 'gold', width: 1.4, dash: [4, 3] });
          sp.text('±Δν', S.nm + S.Dnu, 1.07, { color: 'gold', size: 12, align: 'left', dx: 4 });
          // log-log
          bt.between((x) => 0.5 / x, () => 0.03, 0.4, 30, { fill: 'red', fillAlpha: 0.12 });
          bt.fn((x) => 0.5 / x, { color: 'red', width: 2 });
          bt.text('Δt·Δω = ½', 0.5, 0.5 / 0.5 * 0.82, { color: 'red', size: 12, align: 'left', dx: 6, baseline: 'bottom' });
          bt.text('forbidden', 14, 0.05, { color: 'red', size: 12, align: 'center' });
          const prod = S.Dt * S.Dw;
          bt.fn((x) => prod / x, { color: 'gold', width: 1.6, dash: [5, 4] });
          const others = {};
          for (const nm of Object.keys(names)) { const o = stats(nm, tau, b, nu); others[nm] = o; if (nm !== name) bt.dot(o.Dt, o.Dw, { r: 5, color: cols[nm] }); }
          bt.dot(S.Dt, S.Dw, { r: 8, color: 'gold' });
          const order = ['gauss', 'sech', 'tri', 'exp'];
          bp.bars(order.map((nm) => others[nm].Dt * others[nm].Dw), { x0: 1, dx: 1, color: (val, i) => cols[order[i]] });
          bp.hline(0.5, { color: 'red', width: 2 });
          bp.text('½', 0.45, 0.5, { color: 'red', size: 12, align: 'right', baseline: 'middle' });
          order.forEach((nm, i) => bp.text(v.fix(others[nm].Dt * others[nm].Dw, 3), i + 1, others[nm].Dt * others[nm].Dw, { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }));
          cur = { prod, S, others, name, b };
        });
        v.legend([['gold', 'chosen envelope and its rms widths'], ['red', 'bound $\\Delta t\\,\\Delta\\omega=\\tfrac12$']]);
        v.readout(() => {
          if (!cur) return '';
          const { prod, S, others, name, b } = cur, G = others.gauss.Dt * others.gauss.Dw;
          return `$\\Delta t=${v.fix(S.Dt, 2)}$ fs · $\\Delta\\omega=${v.fix(S.Dw, 3)}$ rad/fs (that is $\\Delta\\nu=${v.fix(S.Dnu * 1000, 1)}$ THz around ${v.fix(S.nm, 3)} PHz) · product $\\Delta t\\,\\Delta\\omega=${v.fix(prod, 4)}$ ${prod >= 0.4999 ? '$\\ge\\tfrac12$' : '(below ½: numerical error)'} · Gaussian at the same $\\tau$ and chirp: $${v.fix(G, 4)}$ (theory $\\tfrac12\\sqrt{1+b^2}=${v.fix(0.5 * Math.sqrt(1 + b * b), 4)}$) · ${name === 'gauss' && Math.abs(b) < 1e-9 ? 'this is the minimum-uncertainty pulse' : 'above the minimum'} · cycles in the pulse: about $${v.fix(2 * S.Dt * nuS.value, 1)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Resonance of a driven string',
      statement: String.raw`Drive one end of a string (the other end fixed, length $L$, wave speed $c$) sinusoidally with displacement amplitude $A$ and frequency $\omega$, and let the string lose energy slowly. After transients die away every point moves at the drive frequency, and the amplitude varies sharply with $\omega$: whenever $\omega$ comes within about the damping rate of a **natural frequency** $\omega_n=n\pi c/L$ the response is much larger than the drive, with the standing-wave pattern of mode $n$ and the driver near a node. For weak damping (energy loss rate per unit length $\propto b$) the peaks are Lorentzian lines of full width at half maximum about $b$, so their quality factor is $Q\approx\omega_n/b$; the amplitude at resonance is $\sim 2Q/(n\pi)$ times the drive amplitude. Between resonances the amplitude is about the same as the drive.`,
      idea: String.raw`In the steady state the string obeys the damped wave equation $u_{tt}=c^2u_{xx}-bu_t$ with $u(0,t)=A\cos\omega t$ and $u(L,t)=0$. With $u=\mathrm{Re}\,[U(x)e^{i\omega t}]$ the solution is $U(x)=A\sin\kappa(L-x)/\sin\kappa L$ with a complex wavenumber $\kappa^2=(\omega^2-i\omega b)/c^2$. The denominator $\sin\kappa L$ nearly vanishes when $\kappa L\approx n\pi$, i.e. when a free standing wave (2.1) fits; only the damping, through the small imaginary part of $\kappa$, keeps the amplitude finite. In the language of modes (2.2, 2.3), the drive pumps each mode in proportion to how close $\omega$ is to its frequency, like a driven oscillator (mech-4.10) for each mode separately, and the energy fed in equals the energy dissipated.`,
      caption: String.raw`Drag the gold point along the response curve (or jump to a resonance) to shake the left end of the string at frequency $\omega$: the top panel shows the steady motion with its envelope, with the red dot the driver. The curve gives the largest amplitude on the string relative to the drive, on a log scale; the second curve is the mean power the driver delivers. Peaks sit at $\omega_n=n\pi c/L$ (dotted lines). Reduce the damping and they grow taller and narrower; raise it and neighbouring peaks merge. The readout compares the measured width of the nearest peak with the damping.`,
      deps: ['waves-2.2', 'mech-4.10'],
      see: ['mech-4.10', 'mech-4.11', 'music-2.4'],
      refs: ['Crawford ch. 3'],
      tags: ['resonance', 'driven string', 'quality factor'],
      scope: String.raw`Linear, weakly damped string with viscous drag proportional to the velocity and a driver of prescribed displacement. Other forms of damping (internal friction, radiation) change the peak shapes but not the positions.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Resonance' },
      viz(v) {
        const M = v.M, WMAX = 4.4 * Math.PI, NW = 1400;
        const bS = v.slider('damping $b$ (units of $c/L$)', 0.02, 1.5, 0.12, { log: true, sig: 2 });
        const jump = v.select('jump to resonance', [{ value: 0, label: '—' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }], 0, {
          onChange: (n) => { if (+n > 0) { h.set(+n * Math.PI, 1); } },
        });
        const kap = (w, b) => csqrt([w * w, -w * b]);
        const U = (x, w, b) => { const k = kap(w, b); return cdiv(csin([k[0] * (1 - x), k[1] * (1 - x)]), csin(k)); };
        const Pin = (w, b) => { const k = kap(w, b), cot = cdiv(ccos(k), csin(k)), z = cmul(k, cot); return 0.5 * w * z[1]; };
        const gain = (w, b) => { let m = 0; for (let i = 0; i <= 100; i++) { const u = U(i / 100, w, b); m = Math.max(m, Math.hypot(u[0], u[1])); } return m; };
        let ck = '', garr = null, parr = null;
        const arrays = (b) => { const k = String(b); if (k === ck) return; ck = k; garr = new Float64Array(NW + 1); parr = new Float64Array(NW + 1); for (let i = 0; i <= NW; i++) { const w = 0.15 + ((WMAX - 0.15) * i) / NW; garr[i] = gain(w, b); parr[i] = Math.max(1e-9, Pin(w, b)); } };
        const st = v.stage({ x: [0, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 220, full: true, title: 'steady motion at the drive frequency (time slowed)' });
        const rs = v.stage({ x: [0, WMAX], y: [0.3, 400], ylog: true, axes: 'box', gutter: true, xlabel: 'drive frequency ω (units of c/L)', ylabel: 'peak amplitude / drive', height: 250, title: 'response', minWidth: 320, xticks: [0, 2, 4, 6, 8, 10, 12] });
        const ps = v.stage({ x: [0, WMAX], y: [1e-3, 1000], ylog: true, axes: 'box', gutter: true, xlabel: 'drive frequency ω', ylabel: 'mean power delivered', height: 250, title: 'power absorbed', minWidth: 320, xticks: [0, 2, 4, 6, 8, 10, 12] });
        const h = rs.handle(Math.PI, 1, { color: 'gold', r: 8, label: 'ω', constrain: (x) => { const w = M.clamp(x, 0.3, WMAX - 0.05); return [w, gain(w, bS.value)]; } });
        h.onDrag = () => { jump.value = 0; };
        let info = null;
        v.animate((t) => {
          const b = bS.value; arrays(b);
          const w = M.clamp(h.x, 0.3, WMAX - 0.05), G = gain(w, b); h.set(w, G);
          const ph = TAU * 0.5 * t, cp = Math.cos(ph), sp = Math.sin(ph);
          const uf = (x) => { const u = U(x, w, b); return u[0] * cp - u[1] * sp; };
          const top = Math.max(1.4, 1.2 * G);
          st.setView([0, 1], [-top, top]);
          st.hline(0, { color: 'faint', width: 1 });
          st.fn((x) => Math.hypot(...U(x, w, b)), { color: 'muted', width: 1.2, dash: [4, 4], n: 300 });
          st.fn((x) => -Math.hypot(...U(x, w, b)), { color: 'muted', width: 1.2, dash: [4, 4], n: 300 });
          st.fn(uf, { color: 'accent', width: 3.2, n: 500 });
          st.dot(0, uf(0), { r: 7, color: 'red', label: 'driver', labelPos: 'ne' });
          st.rect(1, -0.6 * top, 1.012, 0.6 * top, { fill: 'muted', fillAlpha: 0.2, stroke: false });
          st.corner(`ω = ${v.fix(w / Math.PI, 2)} πc/L`, 'tr', { color: 'ink', weight: 600 });
          // response curves
          for (let n = 1; n <= 4; n++) { rs.vline(n * Math.PI, { color: 'faint', width: 1.3, dash: [2, 4] }); ps.vline(n * Math.PI, { color: 'faint', width: 1.3, dash: [2, 4] }); rs.text(`n=${n}`, n * Math.PI, 300, { size: 11, color: 'muted', align: 'center' }); }
          const wg = (i) => 0.15 + ((WMAX - 0.15) * i) / NW;
          rs.path(Array.from(garr, (g, i) => [wg(i), g]), { color: 'accent', width: 2.2 });
          ps.path(Array.from(parr, (p, i) => [wg(i), p]), { color: 'green', width: 2.2 });
          const Pw = Pin(w, b); ps.vline(w, { color: 'gold', width: 1.3 }); ps.dot(w, Math.max(1e-3, Pw), { r: 6, color: 'gold' });
          // peak statistics near the closest mode
          const n = M.clamp(Math.round(w / Math.PI), 1, 4), c0 = n * Math.PI;
          let pk = 0, wp = c0; const grid = [];
          for (let i = 0; i <= 600; i++) { const ww = c0 - 1.4 + (2.8 * i) / 600, p = Pin(ww, b); grid.push([ww, p]); if (p > pk) { pk = p; wp = ww; } }
          let l = null, r = null;
          for (let i = 1; i < grid.length; i++) { if (grid[i - 1][1] < pk / 2 && grid[i][1] >= pk / 2 && grid[i][0] <= wp) l = grid[i - 1][0] + ((pk / 2 - grid[i - 1][1]) / (grid[i][1] - grid[i - 1][1])) * (grid[i][0] - grid[i - 1][0]); if (grid[i - 1][1] >= pk / 2 && grid[i][1] < pk / 2 && grid[i][0] > wp) r = grid[i - 1][0] + ((grid[i - 1][1] - pk / 2) / (grid[i - 1][1] - grid[i][1])) * (grid[i][0] - grid[i - 1][0]); }
          // energy balance: power in = power dissipated, 0.5 b w^2 ∫|U|² dx
          const diss = 0.5 * b * w * w * M.integrate((x) => { const u = U(x, w, b); return u[0] * u[0] + u[1] * u[1]; }, 0, 1, 400);
          info = { w, G, n, wp, width: l !== null && r !== null ? r - l : NaN, Pw, diss, b, gpk: gain(wp, b) };
        }, { still: 0.5 });
        v.legend([['accent', 'largest amplitude on the string / drive amplitude'], ['green', 'mean power delivered by the driver'], ['gold', 'chosen ω']]);
        v.readout(() => {
          if (!info) return '';
          const q = (info.n * Math.PI) / info.b;
          return `$\\omega=${v.fix(info.w / Math.PI, 3)}\\,\\pi c/L$: the string swings up to ${v.fix(info.G, 2)}× the drive amplitude · power in $=${v.fix(info.Pw, 4)}$, power dissipated by the damping $=${v.fix(info.diss, 4)}$ (equal: energy balance) · nearest resonance $n=${info.n}$: peak at $\\omega=${v.fix(info.wp / Math.PI, 3)}\\,\\pi c/L$, height ${v.fix(info.gpk, 1)}×, measured half-power width ${Number.isNaN(info.width) ? 'not isolated (peaks overlap)' : '$' + v.fix(info.width, 3) + '$ against $b=' + v.fix(info.b, 3) + '$'} · $Q\\approx\\omega_n/b=${v.fix(q, 1)}$`;
        });
      },
    },
  ],
};
