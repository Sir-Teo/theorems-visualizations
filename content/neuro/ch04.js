// Computational Neuroscience — Chapter 4: Dendrites, axons and cable theory
// (this file: 4.1–4.4 the cable equation, λ, steady-state attenuation and the Green's function; 4.5–4.7 are in ch04-b.js, 4.8–4.10 in ch04-c.js)
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked references: W. Thomson (Lord Kelvin), "On the theory of the electric telegraph", Proc. R. Soc. Lond. 7 (1856): 382–399
//   (10.1098/rspl.1854.0093; read 1855); Hodgkin & Rushton 1946, Proc. R. Soc. B 133: 444–479 (10.1098/rspb.1946.0024); Rall 1962, Biophys. J. 2: 145–167
//   (10.1016/S0006-3495(62)86953-7); Rall 1959, Exp. Neurol. 1: 491–527 (10.1016/0014-4886(59)90046-9).
// - The cable equation, λ = √(R_m d/4R_a), the infinite-cable solution ½ e^{−|X|} and the Green's function e^{−T−X²/4T}/√(4πT) are derived
//   on the page and every number in the readouts is recomputed from the finite-difference solver (Thomas algorithm, Crank–Nicolson), which
//   is itself checked against these closed forms.
// - Parameter values R_m = 20 kΩ·cm², R_a = 100 Ω·cm, C_m = 1 µF/cm² are typical round numbers for mammalian neurites, not data from one cell.
import { thomas, cableGrid, cableSteady, cableEvolve, greenCable, greenPeakTime, lambdaUm } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** A zigzag resistor from (x0,y0) to (x1,y1) with n teeth of half-width w (data units). */
function zigzag(s, x0, y0, x1, y1, n, w, st) {
  const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const a = 0.18, b = 0.82;
  pts.push([x0 + dx * a, y0 + dy * a]);
  for (let k = 0; k < 2 * n; k++) {
    const t = a + ((k + 0.5) / (2 * n)) * (b - a), sg = k % 2 ? -1 : 1;
    pts.push([x0 + dx * t + sg * w * nx, y0 + dy * t + sg * w * ny]);
  }
  pts.push([x0 + dx * b, y0 + dy * b], [x1, y1]);
  s.path(pts, st);
}

export default {
  collection: 'neuro',
  chapter: 4,
  title: 'Dendrites, axons and cable theory',
  summary: String.raw`Neurons are extended cables, so voltage spreads and decays along dendrites and axons. The cable equation, its length constant and Green’s function describe how synaptic inputs attenuate and broaden with distance, Rall’s rule collapses branched trees into equivalent cylinders, and compartmental models handle realistic morphology. Along axons the same physics sets conduction velocity, which myelin raises dramatically; active dendrites add local spikes.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Cable equation',
      statement: String.raw`Take a long thin cylindrical neurite of diameter $d$ whose membrane is passive: a capacitance $C_m$ in parallel with a leak resistance $R_m$ (per unit area), with intracellular resistivity $R_a$, and with the voltage uniform over each cross-section and the extracellular medium at a common potential. Let $V(x,t)$ be the membrane potential measured from rest and $i_e(x,t)$ an injected current per unit length. Per unit length the cable has capacitance $c_m=\pi d\,C_m$, membrane resistance $r_m=R_m/(\pi d)$ and axial resistance $r_a=4R_a/(\pi d^2)$, and conservation of current gives
$$c_m\,\partial_t V=\frac{1}{r_a}\,\partial_x^2 V-\frac{V}{r_m}+i_e,\qquad\text{i.e.}\qquad \tau_m\,\partial_t V=\lambda^2\,\partial_x^2V-V+r_m i_e,$$
with the membrane time constant $\tau_m=r_mc_m=R_mC_m$ and the length constant $\lambda=\sqrt{r_m/r_a}=\sqrt{R_m d/(4R_a)}$ (item 4.2). It is the limit, as the segment length $h\to0$, of a chain of identical $RC$ compartments coupled by axial resistors $r_ah$.`,
      idea: String.raw`Cut the cylinder into short pieces of length $h$. By Kirchhoff's current law, the net axial current flowing into a piece, $(V_{j-1}-2V_j+V_{j+1})/(r_ah)$, charges its capacitor $c_mh$, leaks through $r_m/h$ and is supplemented by any injected current. Dividing by $h$ turns the second difference into $\partial_x^2V$. For $i_e=0$ it is a diffusion equation with a leak, so a local voltage spreads like heat and drains through the membrane. The point-neuron membrane equation (neuro-1.2) is the case without the $\partial_x^2$ term, and the heat equation (pde-1.4) is the case without the leak. Kelvin derived the same equation for the transatlantic telegraph cable; Hodgkin and Rushton used it for nerve.`,
      caption: String.raw`Top: the equivalent circuit, a chain of $N$ identical compartments (the first few are drawn; node colour shows the voltage). Bottom: a steady (or switched-on) current is injected at the left end of a cable of total length $4\lambda$ with sealed ends. Dots are the chain's node voltages, the curve is the continuum cable computed on a fine grid. Slide $N$ from 2 up to 60 and the chain converges onto the cable; choose a time to watch the profile build up from the injection site.`,
      scope: String.raw`Passive, linear, one-dimensional: valid for small voltage changes (subthreshold, with no voltage-gated conductances), for a cable whose diameter varies slowly compared with $\lambda$ and when the extracellular resistance is negligible.`,
      deps: ['neuro-1.2', 'pde-1.4'],
      see: ['neuro-4.2', 'neuro-4.6', 'mathbio-8.3'],
      refs: ['Gerstner §3.2', 'Dayan–Abbott ch. 6'],
      tags: ['cable theory', 'dendrites'],
      credit: 'Lord Kelvin (telegraph cable), 1855; applied to nerve by Hodgkin & Rushton, 1946; to dendrites by W. Rall from 1959',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cable_theory' },
      viz(v) {
        const Nsl = v.slider('compartments $N$', 2, 60, 6, { int: true });
        const when = v.select('current switched on', [{ value: '0.1', label: '$t=0.1\\tau$' }, { value: '0.5', label: '$0.5\\tau$' }, { value: '2', label: '$2\\tau$' }, { value: 'ss', label: 'steady state' }], 'ss');
        const sC = v.stage({ x: [0, 11], y: [0, 5.2], axes: false, height: 190, full: true, title: 'chain of RC compartments' });
        const sP = v.stage({ x: [0, 4], y: [0, 1.3], axes: 'box', gutter: true, xlabel: 'distance $x/\\lambda$', ylabel: 'voltage (units of $I r_a\\lambda$)', height: 300, full: true });
        const L = 4, NR = 400, gR = cableGrid(0, L, NR);
        const cache = {};
        // chain of N identical compartments (cell-centred): (2V_j − V_{j−1} − V_{j+1})/h² + V_j = source, end cells have one neighbour
        const chain = (N, mode) => {
          const key = N + '|' + mode; if (cache[key]) return cache[key];
          const h = L / N, a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
          const build = (th, dt) => { for (let j = 0; j < N; j++) { const e = (j === 0 || j === N - 1) ? 1 : 2; a[j] = -th * dt / (h * h); c[j] = -th * dt / (h * h); b[j] = 1 + th * dt * (e / (h * h) + 1); } a[0] = 0; c[N - 1] = 0; };
          let V = new Float64Array(N);
          if (mode === 'ss') { for (let j = 0; j < N; j++) { const e = (j === 0 || j === N - 1) ? 1 : 2; a[j] = -1 / (h * h); c[j] = -1 / (h * h); b[j] = e / (h * h) + 1; } a[0] = 0; c[N - 1] = 0; d.fill(0); d[0] = 1 / h; V = thomas(a, b, c, d); }
          else {
            const T = +mode, nst = Math.max(8, Math.round(T / 0.004)), dt = T / nst;
            const step = (th, dtt) => {
              build(th, dtt);
              for (let j = 0; j < N; j++) {
                const e = (j === 0 || j === N - 1) ? 1 : 2, lo = j > 0 ? V[j - 1] : 0, hi = j < N - 1 ? V[j + 1] : 0;
                d[j] = V[j] + (1 - th) * dtt * ((lo - e * V[j] + hi) / (h * h) - V[j]) + (j === 0 ? dtt / h : 0);
              }
              V = thomas(a, b, c, d);
            };
            step(1, dt / 2); step(1, dt / 2);
            for (let k = 1; k < nst; k++) step(0.5, dt);
          }
          return (cache[key] = V);
        };
        const ref = (mode) => {
          const key = 'ref|' + mode; if (cache[key]) return cache[key];
          if (mode === 'ss') return (cache[key] = Float64Array.from(gR.x, (x) => Math.cosh(L - x) / Math.sinh(L)));
          const T = +mode, nst = Math.round(T / 0.004), src = new Float64Array(NR + 1); src[0] = 2 / gR.h;
          return (cache[key] = cableEvolve(gR, new Float64Array(NR + 1), T / nst, nst, { start: true, src }));
        };
        let st = null;
        v.render(() => {
          const N = Nsl.value, mode = when.value, h = L / N;
          const Vc = chain(N, mode), Vr = ref(mode);
          // circuit
          const M = Math.min(N, 7), xs = Array.from({ length: M }, (_, j) => 1.4 + (j * 8.4) / Math.max(1, M - 1)), top = 4.1, bot = 0.9, dx = M > 1 ? xs[1] - xs[0] : 2;
          const vmax = Math.max(1e-9, ...Vc);
          sC.line(xs[0] - 0.9, top, xs[M - 1] + 0.9, top, { color: 'muted', width: 1.4 });
          sC.line(xs[0] - 0.9, bot, xs[M - 1] + 0.9, bot, { color: 'muted', width: 1.4 });
          for (let j = 0; j < M; j++) {
            const x = xs[j], vv = Vc[j];
            zigzag(sC, x - 0.3, top, x - 0.3, bot, 4, 0.16, { color: 'orange', width: 1.8 });
            sC.line(x + 0.3, top, x + 0.3, bot / 1 + (top - bot) * 0.55, { color: 'accent', width: 1.8 });
            sC.line(x + 0.3, bot, x + 0.3, bot + (top - bot) * 0.38, { color: 'accent', width: 1.8 });
            sC.line(x + 0.1, bot + (top - bot) * 0.55, x + 0.5, bot + (top - bot) * 0.55, { color: 'accent', width: 2.4 });
            sC.line(x + 0.1, bot + (top - bot) * 0.38, x + 0.5, bot + (top - bot) * 0.38, { color: 'accent', width: 2.4 });
            sC.dot(x, top, { r: 8, color: 'muted', hollow: true });
            sC.dot(x, top, { r: 6, color: v.ramp(clamp(vv / vmax, 0, 1), 'gold') });
            if (j + 1 < M) zigzag(sC, x, top, xs[j + 1], top, 3, 0.16, { color: 'purple', width: 1.8 });
            sC.tex(`V_{${j}}`, x, top + 0.55, { size: 12, color: 'muted' });
          }
          if (M < N) sC.text('···', xs[M - 1] + 1.0, top, { size: 18, color: 'muted' });
          sC.arrow(xs[0] - 0.9, top + 0.85, xs[0] - 0.15, top + 0.15, { color: 'red', width: 2 });
          sC.tex('I', xs[0] - 1.05, top + 0.85, { color: 'red', size: 14 });
          sC.tex(String.raw`r_a h`, (xs[0] + xs[Math.min(1, M - 1)]) / 2 + (M > 1 ? 0 : 1), top + 0.45, { color: 'purple', size: 13 });
          sC.tex(String.raw`r_m/h`, xs[0] - 0.3, bot - 0.45, { color: 'orange', size: 13 });
          sC.tex(String.raw`c_m h`, xs[0] + 0.45, bot - 0.45, { color: 'accent', size: 13 });
          // profile
          sP.path(Array.from(Vr, (y, i) => [gR.x[i], y]), { color: 'ink', width: 2 });
          const pc = Array.from(Vc, (y, i) => [(i + 0.5) * h, y]);
          sP.path(pc, { color: 'accent', width: 1.4 });
          sP.dots(pc, { r: N > 30 ? 3 : 5, color: 'accent' });
          let err = 0; for (let j = 0; j < N; j++) err = Math.max(err, Math.abs(Vc[j] - Vr[Math.round(((j + 0.5) * h) / gR.h)]));
          st = { N, h, err: err / Math.max(...Vr), v0: Vc[0], vL: Vc[N - 1], tau: mode };
        });
        v.legend([['ink', 'continuum cable'], ['accent', 'chain of $N$ compartments', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$N=${st.N}$ compartments of length $h=${v.fix(st.h, 3)}\,\lambda$ · largest deviation from the continuum cable: $${v.fix(100 * st.err, 2)}\%$ of the peak` + '\n' +
            String.raw`first and last compartment: $V_0=${v.fix(st.v0, 3)}$, $V_{${st.N - 1}}=${v.fix(st.vL, 3)}$` + (st.tau === 'ss' ? String.raw`; exact steady state of the continuum cable at the two ends: $\coth 4=${v.fix(1 / Math.tanh(4), 3)}$ and $1/\sinh 4=${v.fix(1 / Math.sinh(4), 3)}$` : '');
        });
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Length constant λ',
      statement: String.raw`For the passive cable of item 4.1 the **length constant** is
$$\lambda=\sqrt{\frac{r_m}{r_a}}=\sqrt{\frac{R_m\,d}{4R_a}},$$
the ratio of membrane resistance to axial resistance per unit length, under a square root. It is the distance over which a steady voltage decays by the factor $e$ along a long cable (item 4.3), and the unit in which lengths are measured when the cable equation is written without dimensions, $X=x/\lambda$. At fixed membrane and cytoplasm properties, $\lambda\propto\sqrt d$: with $R_m=20\,\mathrm{k\Omega\,cm^2}$ and $R_a=100\,\Omega\,\mathrm{cm}$ a 1 µm dendrite has $\lambda\approx0.7$ mm and a 4 µm one $1.4$ mm.`,
      idea: String.raw`Current injected into the cable has two ways to go: along the cytoplasm (resistance $r_a$ per unit length) or out through the membrane (conductance $1/r_m$ per unit length). The distance over which the axial route is used up is set by their balance, $\lambda^2=r_m/r_a$. Making the neurite thicker lowers $r_a\propto1/d^2$ faster than it lowers $r_m\propto1/d$, so $\lambda$ grows as $\sqrt d$. Leakier membranes (small $R_m$) and a more resistive cytoplasm (large $R_a$) shorten $\lambda$. This is why thin distal dendrites are electrically remote and giant axons (neuro-4.7) carry signals far.`,
      caption: String.raw`The tube is drawn to scale (thickness grows with $d$, logarithmically) and coloured by the steady voltage from a current injected at the left end; the lower panel plots $V/V_0$ against distance on the same axis. Change the diameter, the membrane resistivity or the cytoplasm resistivity and watch the point where the voltage has dropped to $1/e$ (gold marker) move; the faint grey curve keeps the reference $d=1\,\mu$m. Drag the green probe along the cable to read the voltage there.`,
      scope: String.raw`Passive cylinder. The numerical values quoted are typical round numbers; real $R_m$ and $R_a$ differ between cells, and $R_m$ is itself lowered by background synaptic activity (the high-conductance state).`,
      deps: ['neuro-4.1'],
      see: ['neuro-4.3', 'neuro-4.7'],
      refs: ['Gerstner §3.2'],
      tags: ['cable theory', 'length constant'],
      viz(v) {
        const dsl = v.slider('diameter $d$', 0.2, 20, 2, { log: true, fmt: (x) => `${v.fmt(x, 3)} µm` });
        const Rm = v.slider('$R_m$', 5000, 100000, 20000, { log: true, fmt: (x) => `${v.fmt(x / 1000, 3)} kΩ·cm²` });
        const Ra = v.slider('$R_a$', 50, 400, 100, { log: true, fmt: (x) => `${v.fmt(x, 3)} Ω·cm` });
        const XM = 3000;
        const sA = v.stage({ x: [0, XM], y: [-1, 1], axes: false, height: 150, full: true, title: 'cable drawn to scale, coloured by steady voltage' });
        const sB = v.stage({ x: [0, XM], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'distance $x$ (µm)', ylabel: '$V/V_0$', height: 270, full: true });
        const probe = sB.handle(1000, 0.37, { color: 'green', label: 'probe', constrain: 'x' });
        let st = null;
        v.render(() => {
          const lam = lambdaUm(dsl.value, Rm.value, Ra.value), lam1 = lambdaUm(1, 20000, 100), half = 0.1 + 0.6 * (Math.log(dsl.value / 0.2) / Math.log(100));
          for (let x = 0; x < XM; x += 20) {
            const f = Math.exp(-(x + 10) / lam);
            sA.rect(x, -half, x + 21, half, { fill: v.ramp(Math.pow(f, 0.7), 'orange'), stroke: false, fillAlpha: 1 });
          }
          sA.rect(0, -half, XM, half, { color: 'ink', fill: false, width: 1.2 });
          sA.arrow(-100, 0, 0, 0, { color: 'red', width: 2 });
          sA.dot(Math.min(lam, XM), 0, { r: 6, color: 'gold' });
          sA.text(`λ = ${v.fmt(lam, 3)} µm`, Math.min(lam, XM - 400) + 40, half + 0.28, { size: 12, color: 'ink', align: 'left' });
          sB.fn((x) => Math.exp(-x / lam1), { color: 'faint', width: 1.6 });
          sB.fn((x) => Math.exp(-x / lam), { color: 'accent', width: 2.4 });
          sB.hline(Math.exp(-1), { color: 'muted', dash: true });
          sB.vline(Math.min(lam, XM), { color: 'gold', dash: true });
          probe.set(probe.x, Math.exp(-probe.x / lam));
          st = { lam, ratio: lam / lam1, ra: ((4 * Ra.value) / (Math.PI * (dsl.value * 1e-4) ** 2)) * 1e-7, rm: (Rm.value / (Math.PI * dsl.value * 1e-4)) * 1e-5, px: probe.x };
        });
        v.legend([['accent', '$e^{-x/\\lambda}$'], ['faint', 'reference $d=1\\,\\mu$m'], ['gold', 'distance $\\lambda$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\lambda=\sqrt{R_m d/4R_a}=${v.fmt(st.lam, 4)}$ µm (${v.fmt(st.ratio, 3)}× the reference) · $r_m=${v.fmt(st.rm, 3)}$ MΩ·mm, $r_a=${v.fmt(st.ra, 3)}$ MΩ/mm` + '\n' +
            String.raw`probe at $x=${v.fmt(st.px, 4)}$ µm $=${v.fix(st.px / st.lam, 2)}\,\lambda$: $V/V_0=e^{-x/\lambda}=${v.fix(Math.exp(-st.px / st.lam), 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Steady-state exponential attenuation along a cable',
      statement: String.raw`Let a steady current $I_0$ be injected at $x_0$ into a passive cable (items 4.1–4.2). In steady state $\lambda^2V''=V$ away from the source, so $V=Ae^{x/\lambda}+Be^{-x/\lambda}$ on each side. For an infinite cable,
$$V(x)=\frac{I_0\,r_a\lambda}{2}\,e^{-|x-x_0|/\lambda},\qquad R_{\rm in}=\frac{V(x_0)}{I_0}=\frac{r_a\lambda}{2}=\frac{\sqrt{r_ar_m}}{2},$$
so the voltage falls by $e$ every $\lambda$ on both sides, and $\ln V$ is a straight line of slope $\mp1/\lambda$. For a semi-infinite cable injected at its sealed end the amplitude is doubled ($R_{\rm in}=r_a\lambda$). For a finite cable of length $\ell$ injected at the end $x=0$, a sealed far end gives $V(x)=V(0)\cosh\frac{\ell-x}{\lambda}/\cosh\frac{\ell}{\lambda}$ (shallower decay, input resistance $R_{\rm in}=r_a\lambda\coth(\ell/\lambda)$), and a far end clamped to rest ("killed") gives $V(0)\sinh\frac{\ell-x}{\lambda}/\sinh\frac{\ell}{\lambda}$ (steeper decay, $R_{\rm in}=r_a\lambda\tanh(\ell/\lambda)$).`,
      idea: String.raw`Away from the source the steady cable equation is a second-order linear ODE with constant coefficients and characteristic roots $\pm1/\lambda$. The solution that stays bounded at infinity must decay on each side. At the source the two decaying halves must be continuous and their slopes must differ by the injected current, $-(V'(x_0^+)-V'(x_0^-))/r_a=I_0$, which fixes the amplitude $I_0r_a\lambda/2$. At a sealed end the axial current vanishes, $V'=0$, which is a mirror condition and favours $\cosh$; at a killed end $V=0$, which favours $\sinh$.`,
      caption: String.raw`Drag the red handle to move the current source and the green probe to read the local slope of $\ln V$ (right panel, log axis). For the infinite cable the right panel shows two straight lines meeting at the source with slope $\mp1/\lambda$ (dashed green guide). Choose sealed or killed ends of a finite cable and change its length $\ell$: sealed ends flatten the profile and raise the input resistance, killed ends steepen it. Voltages are in units of $I_0r_a\lambda$.`,
      scope: String.raw`Passive, linear cable of uniform diameter under steady current; real dendrites are tapered, branched (item 4.5) and carry synaptic and voltage-gated conductances.`,
      deps: ['neuro-4.2'],
      see: ['neuro-4.4', 'neuro-4.5', 'neuro-4.9'],
      refs: ['Gerstner §3.2'],
      tags: ['cable theory', 'attenuation'],
      credit: 'Hodgkin & Rushton, 1946 (nerve); W. Rall, 1959–1962 (dendrites)',
      viz(v) {
        const ends = v.select('ends', [{ value: 'inf', label: 'infinite' }, { value: 'sealed', label: 'sealed' }, { value: 'killed', label: 'killed' }], 'inf');
        const len = v.slider('length $\\ell/\\lambda$', 0.5, 5, 2, { step: 0.1 });
        const sL = v.stage({ x: [-7, 7], y: [0, 1.05], axes: 'box', gutter: true, xlabel: '$x/\\lambda$', ylabel: '$V/(I_0r_a\\lambda)$', height: 280, weight: 1 });
        const sR = v.stage({ x: [-7, 7], y: [1e-4, 1.5], ylog: true, axes: 'box', gutter: true, xlabel: '$x/\\lambda$', ylabel: '$V$ (log scale)', height: 280, weight: 1 });
        const src = sL.handle(0, 0.5, { color: 'red', label: 'source', constrain: 'x' });
        const pr = sL.handle(1.5, 0.1, { color: 'green', label: 'probe', constrain: 'x' });
        const cache = {};
        let st = null;
        v.render(() => {
          len.el.hidden = ends.value === 'inf';
          const inf = ends.value === 'inf', ell = len.value, x0 = inf ? -7 : 0, x1 = inf ? 7 : ell;
          sL.setView([inf ? -7 : -0.3, inf ? 7 : ell + 0.3], [0, 1.05]); sR.setView([inf ? -7 : -0.3, inf ? 7 : ell + 0.3], [1e-4, 1.5]);
          const xs = Math.round(clamp(src.x, x0, x1) * 40) / 40, g = cableGrid(x0, x1, 560);
          const key = `${ends.value}|${ell}|${Math.round(xs * 40)}`;
          if (!cache[key]) cache[key] = cableSteady(g, xs, 1, inf ? 'sealed' : ends.value, inf ? 'sealed' : ends.value);
          const V = cache[key], pts = Array.from(V, (y, i) => [g.x[i], y]);
          src.set(xs, V[Math.round((xs - x0) / g.h)]);
          sL.path(pts, { color: 'accent', width: 2.4 });
          sR.path(pts, { color: 'accent', width: 2.4 });
          if (inf) { const ex = (x) => 0.5 * Math.exp(-Math.abs(x - xs)); sL.fn(ex, { color: 'green', dash: [6, 4], width: 1.4 }); sR.fn(ex, { color: 'green', dash: [6, 4], width: 1.4 }); }
          const px = clamp(pr.x, x0, x1), ip = clamp(Math.round((px - x0) / g.h), 1, 559);
          pr.set(px, V[ip]);
          const slope = (Math.log(V[ip + 1]) - Math.log(V[ip - 1])) / (2 * g.h);
          sR.dot(px, Math.max(V[ip], 1.2e-4), { r: 6, color: 'green' });
          sR.dot(xs, V[Math.round((xs - x0) / g.h)], { r: 6, color: 'red' });
          const vs = V[Math.round((xs - x0) / g.h)];
          st = { slope, Rin: vs, inf, ell, px, xs, ends: ends.value, vp: V[ip], vs };
        });
        v.legend([['accent', 'numerical steady state'], ['green', 'infinite-cable formula $\\tfrac12e^{-|x-x_0|}$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = st.inf ? String.raw`; exact infinite cable: $R_{\rm in}=\tfrac12\,r_a\lambda$ and slope $\mp1$` : st.ends === 'sealed' ? String.raw`; a sealed end raises $R_{\rm in}$ above $\tfrac12r_a\lambda$` : String.raw`; killed ends lower $R_{\rm in}$ below $\tfrac12r_a\lambda$`;
          return String.raw`input resistance at the source: $R_{\rm in}=${v.fix(st.Rin, 3)}\;r_a\lambda$` + f + '\n' +
            String.raw`probe at $x/\lambda=${v.fix(st.px, 2)}$: $V=${v.fix(st.vp, 4)}$, local slope $d\ln V/dx=${v.fix(st.slope, 3)}\,/\lambda$`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Green’s function of the passive cable',
      statement: String.raw`In dimensionless variables $X=x/\lambda$, $T=t/\tau_m$ the passive cable equation is $\partial_TV=\partial_X^2V-V+s(X,T)$. On an infinite cable, a brief current that deposits a charge $Q$ at $X=0$ at $T=0$ ($s=\kappa\,\delta(X)\delta(T)$, with $\kappa$ proportional to $Q$) produces
$$V(X,T)=\kappa\,G(X,T),\qquad G(X,T)=\frac{1}{\sqrt{4\pi T}}\exp\!\Big(-T-\frac{X^2}{4T}\Big)\quad(T>0),$$
a Gaussian of variance $2T$ that spreads and, at the same time, shrinks by the factor $e^{-T}$ (its area is $e^{-T}$). At a distance $X$ the response peaks at $T^*(X)=\tfrac14\big(\sqrt{1+4X^2}-1\big)$, which grows with $X$, and the peak is lower the farther away. For any source $s$ the solution is the superposition $V=\iint G(X-X',T-T')\,s(X',T')\,dX'dT'$.`,
      idea: String.raw`The leak is removed by the substitution $V=e^{-T}U$, which turns the equation into the heat equation $U_T=U_{XX}$ whose fundamental solution is the spreading Gaussian (mathbio-8.3). Multiplying back by $e^{-T}$ gives $G$. The peak time follows by setting $\partial_T\ln G=-1+X^2/4T^2-1/(2T)=0$, a quadratic in $T$. The leak is why a distant synapse produces a smaller, later and broader bump than a nearby one.`,
      caption: String.raw`Left: the voltage profile along the cable at time $T$ (slider) after a brief pulse at $X=0$: the numerical solution of the cable equation (dots, Crank–Nicolson) lies on the Green’s function (curve). Right: time courses at four distances; the gold markers are the predicted peaks $(T^*(X),G(X,T^*))$. Switch the leak off to see the pure diffusion Gaussian, whose area stays 1.`,
      scope: String.raw`Infinite uniform passive cable. The Gaussian form is exact only for the whole line; near ends or branch points reflections must be added (method of images, item 4.5).`,
      deps: ['neuro-4.1', 'mathbio-8.3'],
      see: ['neuro-4.9', 'pde-1.4'],
      refs: ['Gerstner §3.2'],
      tags: ['cable theory', 'green function'],
      credit: 'Rall, 1962 (dendritic cable transients); the Gaussian kernel is Fourier–Kelvin heat-conduction theory',
      viz(v) {
        const T = v.slider('time $T=t/\\tau_m$', 0.02, 3, 0.4, { step: 0.01 });
        const leak = v.toggle('membrane leak on', true);
        const sA = v.stage({ x: [-4, 4], y: [0, 1.4], axes: 'box', gutter: true, xlabel: '$X=x/\\lambda$', ylabel: '$V$ (units of $\\kappa$)', height: 290, weight: 1 });
        const sB = v.stage({ x: [0, 3], y: [0, 1.4], axes: 'box', gutter: true, xlabel: '$T=t/\\tau_m$', ylabel: '$V$ (units of $\\kappa$)', height: 290, weight: 1 });
        const g = cableGrid(-8, 8, 800), i0 = 400, dts = 0.002, cache = {};
        const run = (lk) => {
          const key = lk; if (cache[key]) return cache[key];
          let u = new Float64Array(801); u[i0] = 1 / g.h;
          const snaps = [], nst = Math.round(3 / dts); // store every 0.01
          const rec = { T: [], prof: [], tr: { 0: [], 50: [], 100: [], 150: [] } };
          u = cableEvolve(g, u, dts / 2, 1, { leak: lk, start: true }); // first half-step pair handled with backward Euler
          let cur = u, tcur = dts / 2;
          rec.T.push(tcur); rec.prof.push(cur);
          const idx = [0, 50, 100, 150];
          for (let k = 0; k < 300; k++) {
            cur = cableEvolve(g, cur, dts, 5, { leak: lk }); tcur += 5 * dts;
            rec.T.push(tcur); rec.prof.push(cur);
          }
          return (cache[key] = rec);
        };
        let st = null;
        v.render(() => {
          const lk = leak.value ? 1 : 0, rec = run(lk), Tt = T.value;
          const k = clamp(Math.round((Tt - rec.T[0]) / 0.01), 0, rec.T.length - 1), prof = rec.prof[k], Tk = rec.T[k];
          sA.fn((X) => greenCable(X, Tk, lk), { color: 'accent', width: 2.2, domain: [-4, 4], n: 400 });
          const pts = []; for (let j = 0; j <= 800; j += 10) pts.push([g.x[j], prof[j]]);
          sA.dots(pts.filter((p) => Math.abs(p[0]) <= 4), { r: 3, color: 'gold' });
          let area = 0; for (let j = 0; j < 800; j++) area += prof[j] * g.h;
          const cols = ['accent', 'green', 'orange', 'purple'], Xs = [0, 0.5, 1, 1.5];
          const pk = [];
          Xs.forEach((X, a) => {
            sB.fn((t) => greenCable(X, t, lk), { color: cols[a], width: 2, domain: [0.005, 3], n: 300 });
            const jx = i0 + Math.round(X / g.h), numPts = rec.T.map((t, q) => [t, rec.prof[q][jx]]).filter((_, q) => q % 6 === 0);
            sB.dots(numPts, { r: 2, color: cols[a], alpha: 0.8 });
            if (lk && X > 0) { const tp = greenPeakTime(X); sB.dot(tp, greenCable(X, tp, 1), { r: 5, color: 'gold' }); }
          });
          let jp = 0, bestv = -1; // numerical peak time at X=1
          rec.prof.forEach((p, q) => { const val = p[i0 + Math.round(1 / g.h)]; if (val > bestv) { bestv = val; jp = q; } });
          st = { area, Tk, lk, tpNum: rec.T[jp], tpTh: greenPeakTime(1), amp: greenCable(0, Tk, lk) };
        });
        v.legend([['accent', '$G(X,T)$ at $T$ (left); $X=0$ (right)'], ['green', '$X=0.5$'], ['orange', '$X=1$'], ['purple', '$X=1.5$'], ['gold', 'numerical cable solution; predicted peaks', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$T=${v.fix(st.Tk, 2)}$: area under the profile $=${v.fix(st.area, 3)}$ (theory ${st.lk ? String.raw`$e^{-T}=${v.fix(Math.exp(-st.Tk), 3)}$` : '1'}), peak height $G(0,T)=${v.fix(st.amp, 3)}$, variance $2T=${v.fix(2 * st.Tk, 2)}$` + '\n' +
            (st.lk ? String.raw`peak time at $X=1$: numerical $${v.fix(st.tpNum, 2)}$, formula $T^*=\tfrac14(\sqrt5-1)=${v.fix(st.tpTh, 3)}$` : String.raw`without leak the peak time at $X=1$ is $T=X^2/2$ and all of the charge stays on the cable`);
        });
      },
    },
  ],
};
