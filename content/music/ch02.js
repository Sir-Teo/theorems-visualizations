// Music Theory & Acoustics — Chapter 2: Vibrating strings and the harmonic series
import { TAU, SR, noteOf, playhead, finish, synth, decayOf, polyCoeffs, triCoeffs, lerpGrid, oddExt, modal, bridgeParts, presetShape, shapePainter, posts, keyboard } from './ch02.shared.js';

/** The reference string of the chapter: a 65 cm string tuned to G3. */
const F1 = 196, LEN = 0.65, CW = 2 * LEN * F1;

export default {
  collection: 'music',
  chapter: 2,
  title: 'Vibrating strings and the harmonic series',
  summary: String.raw`The ideal string is the simplest instrument and the gateway to the rest. Its motion obeys the wave equation: any shape splits into two halves that run apart at $c=\sqrt{T/\mu}$ and flip over at the fixed ends, and with both ends held it can only vibrate in modes whose frequencies are whole multiples of the lowest. From this come Mersenne's laws, the harmonic series and the effect of where a string is plucked, touched, bowed or struck. Real strings are slightly stiff, which pushes their upper partials sharp and forces pianos into stretched octaves. The chapter closes with Mersenne's own experiments of 1636, which put a first number on the frequency of a musical note.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'The ideal string',
      statement: String.raw`The **ideal string** is a perfectly flexible thread with uniform mass per unit length $\mu$, stretched to tension $T$ between two fixed points a distance $L$ apart, moving only slightly and only sideways. Its displacement $y(x,t)$ obeys the **wave equation**
$$\mu\,\frac{\partial^2 y}{\partial t^2}=T\,\frac{\partial^2 y}{\partial x^2},\qquad y(0,t)=y(L,t)=0,$$
so disturbances travel along it at speed $c=\sqrt{T/\mu}$.

It is the limit of a **beaded string**: $N$ beads of mass $m$, a distance $a=L/(N+1)$ apart, on a massless thread under tension $T$. Bead $j$ obeys
$$m\,\ddot y_j=\frac{T}{a}\,\big(y_{j+1}-2y_j+y_{j-1}\big),\qquad y_0=y_{N+1}=0 .$$
The chain has exactly $N$ normal modes, $y_j\propto\sin\frac{jk\pi}{N+1}$, with frequencies $f_k=\frac{c}{\pi a}\sin\frac{k\pi}{2(N+1)}$ ($c^2=Ta/m$). As $N\to\infty$ with $m/a=\mu$ fixed, each $f_k$ tends to $k\,c/2L$: the chain becomes the string.`,
      idea: String.raw`A bead feels the tension along the two threads beside it. For small slopes their vertical components are $T(y_{j+1}-y_j)/a$ and $T(y_{j-1}-y_j)/a$, so the net force is $T/a$ times the second difference, which by Taylor's theorem is $Ta\,\partial^2y/\partial x^2+O(a^3)$. Dividing by $m=\mu a$ gives the wave equation, and $T/\mu$ has the units of a speed squared. Each bead is a little oscillator (1.2) coupled to its neighbours. The modes of the chain are sampled sines, and $\sin\frac{k\pi}{2(N+1)}\approx\frac{k\pi}{2(N+1)}$ for the low modes once $N$ is large, so their frequencies become whole multiples of the lowest one: the harmonic sound of a string (2.4).`,
      caption: String.raw`Drag the gold handle to pluck the chain; it starts again from rest. The dashed curve is an ideal string released from the same shape. With few beads the chain hops along and falls out of step; raise $N$ and it turns into the string. Gold arrows show the net force on each bead: it is proportional to how sharply the chain bends there. Below, left: the chain's mode frequencies against the ideal $f_k=kf_1$. Below, right: the spectrum of the force on the bridge, which is what a soundboard would radiate. *Listen* plays the chain and the ideal string.`,
      deps: ['music-1.2'],
      see: ['waves-1.2', 'waves-1.1', 'mech-11.8', 'pde-1.3'],
      refs: ['Benson ch. 3', 'Loy I ch. 8'],
      tags: ['string', 'model'],
      credit: 'Taylor, 1713; d’Alembert, 1747; Lagrange (beaded string), 1759',
      scope: String.raw`Holds for small slopes, so that the tension stays $T$ and the motion is purely transverse, for a perfectly flexible string (no bending stiffness; see 2.11) on rigid supports, and without damping. Large amplitudes raise the tension (the pitch glides down as the note dies away), stiffness pushes the upper modes sharp, and real bridges move.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/String_vibration' },
      viz(v) {
        const M = v.M, KM = 12;
        const nS = v.slider('beads $N$', 1, 48, 5, { int: true, onChange: () => { v.t = 0; } });
        const frc = v.toggle('forces on the beads', true);
        const gh = v.toggle('ideal string for comparison', true);
        const s = v.stage({ x: [-0.04, 1.04], y: [-1.12, 1.12], height: 250, axes: false, full: true });
        const dp = v.stage({ x: [0, KM + 0.7], y: [0, KM + 1], height: 235, axes: 'box', xlabel: 'mode number k', ylabel: 'frequency / f₁', xticks: [1, 2, 4, 6, 8, 10, 12], yticks: [2, 4, 6, 8, 10, 12], title: 'mode frequencies: chain against ideal string' });
        const sp = v.stage({ x: [0, KM + 0.7], y: [0, 1.16], height: 235, axes: 'box', yticks: [], xticks: [1, 2, 4, 6, 8, 10, 12], xlabel: 'frequency / f₁', title: 'force on the bridge: spectrum' });
        const h = s.handle(0.3, 0.8, { color: 'gold', constrain: (x, y) => [M.clamp(x, 0.06, 0.94), Math.abs(y) < 0.2 ? (y < 0 ? -0.2 : 0.2) : M.clamp(y, -1, 1)], onDrag: () => { v.t = 0; } });
        const tri = (x) => (x < h.x ? (h.y * x) / h.x : (h.y * (1 - x)) / (1 - h.x));
        let key = '', C = null;
        const chain = () => {
          const N = nS.value, k = [N, h.x, h.y].join(); if (k === key) return C; key = k;
          const P = N + 1, ys = M.range(N).map((j) => tri((j + 1) / P)), A = [], W = [], S = [];
          for (let q = 1; q <= N; q++) {
            const row = M.range(N).map((j) => Math.sin(((j + 1) * q * Math.PI) / P));
            S.push(row);
            A.push((2 / P) * row.reduce((a, sj, j) => a + sj * ys[j], 0));
            W.push(((2 * P) / Math.PI) * Math.sin((q * Math.PI) / (2 * P)));
          }
          const b = triCoeffs(h.x, h.y, 60);
          const cParts = A.map((a, q) => ({ f: F1 * W[q], a: a * S[q][N - 1] * P, d: decayOf(F1 * W[q]) }));
          const iParts = bridgeParts(b, F1);
          let amax0 = 1e-9; for (let j = 0; j < N; j++) amax0 = Math.max(amax0, Math.abs((j + 1 < N ? ys[j + 1] : 0) - 2 * ys[j] + (j > 0 ? ys[j - 1] : 0)));
          C = { N, P, ys, A, W, S, b, cParts, iParts, amax0 };
          return C;
        };
        const Y = oddExt(tri);
        const play = (snd, which) => {
          const c = chain(), bufs = which.map((w) => finish(synth(w === 'chain' ? c.cParts : c.iParts, 1.6), 0.8));
          const gap = Math.round(0.25 * SR), out = new Float32Array(bufs.reduce((a, b) => a + b.length, 0) + gap * (bufs.length - 1));
          let o = 0; bufs.forEach((b) => { out.set(b, o); o += b.length + gap; });
          snd.samples(out, SR, { gain: 0.55 });
        };
        v.soundButton('Listen: chain', (snd) => play(snd, ['chain']));
        v.soundButton('ideal string', (snd) => play(snd, ['ideal']));
        v.soundButton('chain, then string', (snd) => play(snd, ['chain', 'ideal']));
        let tau = 0;
        v.animate((t) => {
          const c = chain(), { N, P, A, W, S } = c;
          tau = 0.32 * t;
          const yb = M.range(N).map((j) => A.reduce((a, Aq, q) => a + Aq * S[q][j] * Math.cos(W[q] * Math.PI * tau), 0));
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          if (gh.value) s.fn((x) => 0.5 * (Y(x - tau) + Y(x + tau)), { domain: [0, 1], n: 400, color: 'muted', width: 1.6, dash: [7, 5] });
          s.path([[0, 0], ...yb.map((y, j) => [(j + 1) / P, y]), [1, 0]], { color: 'ink', width: 1.6 });
          if (frc.value) {
            const sc = 0.32 / c.amax0;
            yb.forEach((y, j) => {
              const acc = (j + 1 < N ? yb[j + 1] : 0) - 2 * y + (j > 0 ? yb[j - 1] : 0);
              if (Math.abs(acc * sc) > 0.012) s.arrow((j + 1) / P, y, (j + 1) / P, y + acc * sc, { color: 'gold', width: 2, head: 7 });
            });
          }
          s.dots(yb.map((y, j) => [(j + 1) / P, y]), { r: N > 30 ? 3 : N > 12 ? 4 : 6, color: 'accent' });
          posts(s, 1, 0, 0.16);
          s.corner(`slow motion: ${v.fix(tau / 2, 2)} periods of the ideal string`, 'tl', { color: 'muted' });
          s.corner(`${N} bead${N > 1 ? 's' : ''}, ${N} mode${N > 1 ? 's' : ''}`, 'tr', { color: 'accent', weight: 600 });
          // ---- dispersion
          dp.line(0, 0, KM + 0.7, KM + 0.7, { color: 'muted', width: 1.5, dash: [6, 4] });
          dp.text('ideal string: f_k = k f₁', 8.6, 7.6, { color: 'muted', size: 11.5, align: 'left' });
          dp.curve((u) => [u, ((2 * P) / Math.PI) * Math.sin((u * Math.PI) / (2 * P))], 0, Math.min(N, KM + 0.7), { color: 'accent', width: 1.4, alpha: 0.6, n: 200 });
          W.slice(0, KM).forEach((w, q) => dp.dot(q + 1, w, { r: 4.5, color: 'accent' }));
          if (N < KM) dp.text(`no modes beyond k = ${N}`, KM + 0.5, 0.9, { color: 'red', size: 11.5, align: 'right' });
          // ---- spectrum of the bridge force
          const nm = (ps) => Math.max(1e-12, ...ps.map((p) => Math.abs(p.a)));
          const mi = nm(c.iParts), mc = nm(c.cParts);
          c.iParts.forEach((p, i) => { const x = i + 1, a = Math.abs(p.a) / mi; if (x <= KM + 0.5 && a > 1e-3) { sp.line(x, 0, x, a, { color: 'muted', width: 5, alpha: 0.35 }); } });
          c.cParts.forEach((p) => { const x = p.f / F1, a = Math.abs(p.a) / mc; if (x <= KM + 0.5 && a > 1e-3) { sp.line(x, 0, x, a, { color: 'accent', width: 2 }); sp.dot(x, a, { r: 3.5, color: 'accent' }); } });
        }, { still: 0.9 });
        v.legend([['accent', 'beaded chain'], ['muted', 'ideal string', { dash: true }], ['gold', 'net force on a bead']]);
        v.readout(() => {
          const c = chain(), { N, W } = c, cents = (r) => 1200 * Math.log2(r);
          const head = `$N$ = ${N}: the chain has ${N} mode${N > 1 ? 's' : ''}; its lowest is ${v.fix(W[0], 4)} $f_1$, ${v.fix(-cents(W[0]), 1)} ¢ flat of the ideal string`;
          if (N === 1) return `${head} · one bead is a single oscillator (1.2): a pure tone with no overtones at all`;
          const k = Math.min(N, 6), rs = W.slice(0, k).map((w) => v.fix(w / W[0], 3)).join(' : ');
          const worst = Math.max(...W.slice(1, k).map((w, i) => Math.abs(cents(w / ((i + 2) * W[0])))));
          return `${head} · ratios $f_k/f_1$ = ${rs} instead of ${M.range(k, 1).join(' : ')} (worst ${v.fix(worst, 1)} ¢) · the octave $f_2/f_1$ is ${v.fix(-cents(W[1] / (2 * W[0])), 1)} ¢ narrow · for fixed $k$, the error shrinks like $1/N^2$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'D’Alembert’s solution of the wave equation',
      statement: String.raw`Every solution of the wave equation $y_{tt}=c^2y_{xx}$ on the line has the form
$$y(x,t)=F(x-ct)+G(x+ct),$$
a shape $F$ moving right at speed $c$ plus a shape $G$ moving left. If the string starts from rest with displacement $y_0$, then $F=G=\tfrac12 y_0$:
$$y(x,t)=\tfrac12\big[y_0(x-ct)+y_0(x+ct)\big].$$
On a string of length $L$ with fixed ends the same formula holds once $y_0$ is extended to the whole line as an **odd** function about both ends ($y_0(-x)=-y_0(x)$, $y_0(2L-x)=-y_0(x)$), hence $2L$-periodic. So each half-height copy runs to an end, comes back **upside down**, and the whole motion repeats with period $2L/c$; halfway through, at $t=L/c$, the string shows $-y_0(L-x)$.`,
      idea: String.raw`In the characteristic variables $\xi=x-ct$, $\eta=x+ct$ the chain rule turns the equation into $\partial^2y/\partial\xi\,\partial\eta=0$, whose solutions are exactly $F(\xi)+G(\eta)$. Zero initial velocity forces $-cF'+cG'=0$, so $F=G$ up to a constant, and $y(x,0)=y_0$ fixes $F=G=y_0/2$. A fixed end is a mirror: if the extension is odd about $x=0$, the two halves cancel there at every instant, so $y(0,t)=0$ automatically; the same about $x=L$ makes the extension $2L$-periodic. This is what a pulse "flipping over" at the end means: it is met by its own inverted mirror image.`,
      caption: String.raw`Press play: the initial shape (faint dashes) splits into an orange copy running right and a purple copy running left, each half as tall; their sum is the string (blue). Switch on the **mirror images** to see where the reflected copies come from: the odd extension beyond the ends. Choose a shape, or **draw** your own by dragging across the top panel. Below: the space–time diagram $y(x,t)$ over one period, with the paths of the tallest point bouncing between the ends. *Listen* plays the sound of exactly this pluck.`,
      deps: ['music-2.1'],
      see: ['pde-2.1', 'pde-2.2', 'waves-1.3', 'pde-2.7', 'pde-2.11'],
      refs: ['Benson ch. 3'],
      tags: ['wave equation', 'travelling waves'],
      credit: 'Jean le Rond d’Alembert, 1747',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/D%27Alembert%27s_formula' },
      viz(v) {
        const M = v.M, K = 240, NC = 200;
        let ys = presetShape('pluck', K), ver = 0;
        const sel = v.select('initial shape', [{ value: 'pluck', label: 'pluck' }, { value: 'bump', label: 'bump' }, { value: 'two', label: 'two bumps' }, { value: 'draw', label: 'drawn' }], 'pluck', { onChange: (x) => { if (x !== 'draw') { ys = presetShape(x, K); ver++; v.t = 0; } } });
        const mir = v.toggle('mirror images beyond the ends', false);
        const s = v.stage({ x: [-0.04, 1.04], y: [-1.12, 1.12], height: 260, axes: false, full: true });
        const st = v.stage({ x: [0, 1], y: [0, 2], height: 215, axes: 'box', xlabel: 'x / L', ylabel: 'ct / L', yticks: [0, 0.5, 1, 1.5, 2], full: true, title: 'space–time diagram: red up, blue down' });
        shapePainter(s, () => ys, (phase) => { if (sel.value !== 'draw') sel.set('draw'); ver++; v.t = 0; if (phase === 'start') v.pause(); if (phase === 'end') v.play(); });
        let cKey = -1, b = null, amp = 1, x0 = 0.3;
        const coeffs = () => {
          if (cKey === ver) return b; cKey = ver;
          b = polyCoeffs(M.range(K + 1).map((i) => i / K), ys, NC);
          amp = Math.max(0.05, ...Array.from(ys, Math.abs)); x0 = ys.indexOf(ys.reduce((a, y) => (Math.abs(y) > Math.abs(a) ? y : a), 0)) / K;
          return b;
        };
        const f = (x) => lerpGrid(ys, x), Y = oddExt(f), dal = (x, tau) => 0.5 * (Y(x - tau) + Y(x + tau));
        v.soundButton('Listen', (snd) => snd.samples(finish(synth(bridgeParts(coeffs(), F1, 60), 1.8), 0.8), SR, { gain: 0.55 }));
        const refl = (u) => { const w = M.mod(u, 2); return w <= 1 ? w : 2 - w; };
        let tau = 0;
        v.animate((t) => {
          coeffs();
          tau = M.mod(0.3 * t, 2);
          const wide = mir.value, dom = wide ? [-1.02, 2.02] : [-0.04, 1.04];
          s.setView(dom, [-1.12, 1.12]);
          if (wide) {
            for (const [a, c] of [[-1.02, 0], [1, 2.02]]) s.rect(a, -1.12, c, 1.12, { fill: 'muted', fillAlpha: 0.08, stroke: false });
            s.text('mirror image: −y₀(−x)', -0.5, 1.0, { align: 'center', color: 'muted', size: 11.5 });
            s.text('mirror image: −y₀(2L − x)', 1.5, 1.0, { align: 'center', color: 'muted', size: 11.5 });
            s.fn(Y, { domain: dom, n: 700, color: 'muted', width: 1, dash: [3, 4] });
          } else s.fn(f, { domain: [0, 1], n: 500, color: 'muted', width: 1, dash: [3, 4] });
          s.hline(0, { color: 'faint', width: 1 });
          const vis = wide ? dom : [0, 1];
          s.fn((x) => 0.5 * Y(x - tau), { domain: vis, n: 700, color: 'orange', width: 2 });
          s.fn((x) => 0.5 * Y(x + tau), { domain: vis, n: 700, color: 'purple', width: 2 });
          s.fn((x) => dal(x, tau), { domain: [0, 1], n: 500, color: 'accent', width: 3.4 });
          posts(s, 1, 0, 0.15);
          s.corner(`ct/L = ${v.fix(tau, 2)}`, 'tl', { color: 'ink', weight: 600 });
          s.corner(sel.value === 'draw' ? 'your shape' : 'drag across the panel to draw a shape', 'tr', { color: 'muted' });
          // ---- space–time
          st.heat((x, y) => dal(x, y), { range: [-amp, amp], cmap: 'diverging', key: ver, res: 2 });
          st.path(M.range(201).map((i) => [refl(x0 + i / 100), i / 100]), { color: 'orange', width: 1.6, dash: [5, 4] });
          st.path(M.range(201).map((i) => [refl(x0 - i / 100), i / 100]), { color: 'purple', width: 1.6, dash: [5, 4] });
          st.hline(tau, { color: 'gold', width: 2.2 });
          st.hline(1, { color: 'ink', width: 1, dash: [2, 4], alpha: 0.5 });
        }, { still: 0.62 / 0.3 });
        v.legend([['orange', 'right-moving half $\\tfrac12y_0(x-ct)$'], ['purple', 'left-moving half $\\tfrac12y_0(x+ct)$'], ['accent', 'the string: their sum'], ['muted', 'initial shape and its odd extension', { dash: true }]]);
        v.readout(() => {
          const bb = coeffs(); let err = 0;
          for (let i = 0; i <= 100; i++) { const x = i / 100; err = Math.max(err, Math.abs(dal(x, tau) - modal(bb, NC, x, tau))); }
          const tms = (tau * LEN) / CW * 1e3;
          return `$ct/L$ = ${v.fix(tau, 3)}, i.e. $t$ = ${v.fix(tms, 2)} ms on a 65 cm string with $c$ = ${v.fix(CW, 0)} m/s (period $2L/c$ = ${v.fix((2 * LEN / CW) * 1e3, 2)} ms) · each half has moved ${v.fix(tau, 2)} L · d'Alembert's sum against the ${NC}-mode Fourier series of 2.7: largest difference ${v.fix(err, 4)} for a shape ${v.fix(amp, 2)} high · at $ct/L=1$ the string shows $-y_0(L-x)$, at $ct/L=2$ it is back where it started`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Standing waves and normal modes',
      statement: String.raw`Two sinusoidal waves of equal amplitude, wavelength and frequency travelling in opposite directions add up to a **standing wave**:
$$\tfrac12\sin(kx-\omega t)+\tfrac12\sin(kx+\omega t)=\sin kx\,\cos\omega t .$$
Its shape $\sin kx$ never moves; it only swells and shrinks. The points where $\sin kx=0$ (**nodes**, half a wavelength apart) never move, and the points halfway between (**antinodes**) swing the most. On a string fixed at $x=0$ and $x=L$ the ends must be nodes, so $kL=n\pi$: the string fits a whole number $n$ of half-wavelengths, $\lambda_n=2L/n$. These standing waves, $y_n=\sin\frac{n\pi x}{L}\cos\omega_nt$, are the string's **normal modes**: motions in which every point oscillates at one frequency, in phase or in antiphase.

If the two waves differ in frequency, the pattern is not standing: the nodes drift and the ends can no longer stay at rest.`,
      idea: String.raw`The identity $\sin A+\sin B=2\sin\frac{A+B}2\cos\frac{A-B}2$ separates space from time. On the finite string, d'Alembert's picture (2.2) explains why only standing waves survive: whatever runs to an end comes back reflected and inverted, so a steady pattern must consist of a wave and its reflection, with equal frequencies, superposed (1.11). If the counter-running waves had frequencies $f$ and $f'$, their sum would be $2\sin\frac{(k+k')x+(\omega'-\omega)t}{2}\cos\frac{(k-k')x-(\omega+\omega')t}{2}$, whose nodes drift at speed $c\,\frac{f'-f}{f+f'}$; no node could then stay pinned at a fixed end.`,
      caption: String.raw`Orange runs right, purple runs left, blue is their sum; green dots mark the nodes. Choose the mode number $n$ and listen to it alone. Then **detune** the left-running wave: the nodes start to drift (follow them in the space–time diagram below, where the nodes are the thin dashed lines), the red markers show the ends being dragged off zero, and *Listen* now beats at the difference frequency. Only $\delta=0$ fits a string with fixed ends.`,
      deps: ['music-2.2', 'music-1.11'],
      see: ['waves-2.1', 'waves-2.2', 'mech-11.9'],
      refs: ['Benson ch. 1', 'Loy I ch. 8'],
      tags: ['standing waves', 'modes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Standing_wave' },
      viz(v) {
        const M = v.M;
        const nS = v.slider('mode number $n$', 1, 8, 3, { int: true });
        const dS = v.slider('detune the left wave $\\delta$', -6, 6, 0, { step: 0.1, fmt: (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + v.fix(Math.abs(x), 1) + ' %' });
        const trav = v.toggle('show the travelling waves', true);
        const s = v.stage({ x: [-0.06, 1.06], y: [-1.3, 1.3], height: 245, axes: false, full: true });
        const st = v.stage({ x: [0, 1], y: [0, 4], height: 200, axes: 'box', xlabel: 'x / L', ylabel: 'periods of mode n', yticks: [0, 1, 2, 3, 4], full: true, title: 'space–time diagram of the sum' });
        const ph = playhead(v);
        v.soundButton('Listen', (snd) => {
          const n = nS.value, d = dS.value / 100, f = n * F1;
          if (d) snd.tone([[f, 1], [f * (1 + d), 1]], { duration: 3, gain: 0.25, release: 0.2 }); else snd.tone(f, { duration: 1.6, gain: 0.25 });
          ph.start(d ? 3 : 1.6);
        });
        v.soundButton('modes 1 → 8', (snd) => { M.range(8, 1).forEach((n, i) => snd.tone(n * F1, { duration: 0.45, gain: 0.22, delay: 0.5 * i, release: 0.1 })); ph.start(4); });
        // y(x, τ) with τ in periods of mode n: right wave ½ sin(kx − ωτ), left wave ½ sin(k'x + ω'τ)
        const wav = (n, d) => { const k = n * Math.PI, w = TAU, k2 = k * (1 + d), w2 = w * (1 + d); return { k, w, k2, w2, R: (x, t) => 0.5 * Math.sin(k * x - w * t), L: (x, t) => 0.5 * Math.sin(k2 * x + w2 * t) }; };
        let st0 = null;
        v.animate((t) => {
          const n = nS.value, d = dS.value / 100, W = wav(n, d), tau = 0.45 * t;
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          if (!d) s.between((x) => Math.sin(n * Math.PI * x), (x) => -Math.sin(n * Math.PI * x), 0, 1, { fill: 'accent', fillAlpha: 0.07, n: 300 });
          if (trav.value) {
            s.fn((x) => W.R(x, tau), { domain: [0, 1], n: 400, color: 'orange', width: 1.8 });
            s.fn((x) => W.L(x, tau), { domain: [0, 1], n: 400, color: 'purple', width: 1.8 });
          }
          s.fn((x) => W.R(x, tau) + W.L(x, tau), { domain: [0, 1], n: 400, color: 'accent', width: 3.2 });
          // nodes: zeros of sin(((k + k')x + (ω' − ω)τ)/2)
          const nodes = [];
          for (let j = -2; j <= 2 * n + 4; j++) { const x = (TAU * j - (W.w2 - W.w) * tau) / (W.k + W.k2); if (x >= -1e-9 && x <= 1 + 1e-9) nodes.push(x); }
          nodes.forEach((x) => s.dot(x, 0, { r: 5, color: 'green' }));
          posts(s, 1, -0.02, 0.16);
          const e0 = W.R(0, tau) + W.L(0, tau), e1 = W.R(1, tau) + W.L(1, tau);
          if (d) { s.dot(0, e0, { r: 6, color: 'red' }); s.dot(1, e1, { r: 6, color: 'red' }); }
          st0 = { n, d, nodes };
          s.corner(d ? 'not a standing wave: the nodes drift and the ends move' : `mode ${n}: ${n} half-wavelength${n > 1 ? 's' : ''} between the ends`, 'tl', { color: d ? 'red' : 'green', weight: 600 });
          if (ph.t != null) s.corner('♪ playing', 'tr', { color: 'gold', weight: 600 });
          // ---- space–time
          st.heat((x, y) => W.R(x, y) + W.L(x, y), { range: [-1.05, 1.05], cmap: 'diverging', key: `${n}|${d}`, res: 2 });
          for (let j = -2 * n - 10; j <= 2 * n + 10; j++) {
            const xa = (TAU * j) / (W.k + W.k2), xb = (TAU * j - (W.w2 - W.w) * 4) / (W.k + W.k2);
            st.line(xa, 0, xb, 4, { color: 'ink', width: 1, alpha: 0.55, dash: [3, 3] });
          }
          st.hline(M.mod(tau, 4), { color: 'gold', width: 2.2 });
        }, { still: 1.1 });
        v.legend([['orange', 'wave running right'], ['purple', 'wave running left'], ['accent', 'their sum'], ['green', 'nodes', { dot: true }]]);
        v.readout(() => {
          if (!st0) return '';
          const { n, d } = st0, f = n * F1, lam = (2 * LEN) / n;
          const head = `mode $n$ = ${n}: $\\lambda_n=2L/n$ = ${v.fix(lam * 100, 1)} cm, $f_n=n f_1$ = ${v.fix(f, 1)} Hz (${noteOf(v.M, f)}) on the 65 cm G string, nodes at $x$ = ${M.range(n + 1).map((j) => (j === 0 ? '0' : j === n ? 'L' : `${j}L/${n}`)).join(', ')}`;
          if (!d) return `${head} · the two waves have equal frequencies, so the nodes never move and the ends stay at rest`;
          const vn = (CW * d) / (2 + d);
          return `${head} · left wave detuned to ${v.fix(f * (1 + d), 1)} Hz: nodes drift at $c\\,\\frac{f'-f}{f+f'}$ = ${v.fix(Math.abs(vn), 1)} m/s (${d > 0 ? 'leftward' : 'rightward'}), a fixed point hears beats at $|f'-f|$ = ${v.fix(Math.abs(f * d), 1)} Hz, and the ends are dragged up and down, waxing and waning at the beat rate up to the full wave height: impossible for a fixed string`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Mode frequencies of a fixed string',
      statement: String.raw`An ideal string of length $L$, tension $T$ and mass per length $\mu$, fixed at both ends, has normal modes
$$y_n(x,t)=\sin\frac{n\pi x}{L}\,\cos(2\pi f_nt+\varphi_n),\qquad f_n=\frac{n}{2L}\sqrt{\frac T\mu}=n\,f_1,\qquad n=1,2,3,\dots$$
and no others. The mode frequencies are exact whole multiples of the **fundamental** $f_1=c/2L$, whatever $L$, $T$ and $\mu$ are: changing them slides the whole ladder up or down together but never changes the ratios $1:2:3:\cdots$. With one end free to slide (a ring on a frictionless rod), the modes are $\sin\frac{(2n-1)\pi x}{2L}$ with $f=(2n-1)\,c/4L$: only the odd multiples of a fundamental an octave lower.`,
      idea: String.raw`Look for solutions $y=X(x)\cos\omega t$ (separation of variables). The wave equation gives $X''=-(\omega/c)^2X$, so $X=\sin(\omega x/c)$ once $X(0)=0$ is imposed, and $X(L)=0$ then forces $\omega L/c=n\pi$: the standing-wave condition of 2.3. The boundary conditions, not the material, pick out the allowed wavelengths $2L/n$; the material only sets the speed $c=\sqrt{T/\mu}$ that converts wavelengths into frequencies. At a free end the slope must vanish instead ($X'(L)=0$), which allows a quarter wavelength more or less and gives the odd series.`,
      caption: String.raw`The first eight modes, each oscillating at its own rate (in slow motion), with its frequency on the right. Drag $L$, $T$ and $\mu$: every rung changes frequency together, and the ruler on the right stays evenly spaced. Click a rung to hear that mode, or play the whole ladder. Switch to **one end free** to break the fixed-end condition: the ladder becomes odd multiples only.`,
      deps: ['music-2.3'],
      see: ['pde-4.1', 'pde-4.2', 'waves-2.2'],
      refs: ['Benson ch. 3', 'Loy II ch. 7'],
      tags: ['modes', 'string'],
      credit: 'Daniel Bernoulli, 1753; Euler, 1748',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Normal_mode' },
      viz(v) {
        const M = v.M, NR = 8;
        const Ls = v.slider('length $L$', 0.3, 1.3, LEN, { step: 0.005, fmt: (x) => v.fix(x * 100, 1) + ' cm' });
        const Ts = v.slider('tension $T$', 10, 1500, 77.9, { log: true, fmt: (x) => v.fmt(x, 3) + ' N' });
        const us = v.slider('mass per length $\\mu$', 0.2, 20, 1.2, { log: true, fmt: (x) => v.fmt(x, 3) + ' g/m' });
        const bc = v.select('ends', [{ value: 'ff', label: 'both fixed' }, { value: 'fr', label: 'one end free' }], 'ff');
        const lad = v.stage({ x: [-0.17, 1.62], y: [0.35, NR + 0.72], height: 430, axes: false, weight: 1.75 });
        const rul = v.stage({ x: [0, 1], y: [0, 1], height: 430, axes: 'box', xticks: [], ylabel: 'frequency (Hz)', weight: 0.55, minWidth: 170, title: 'the ladder on a ruler' });
        const ph = playhead(v);
        let active = null, seq = null;
        const c = () => Math.sqrt(Ts.value / (us.value * 1e-3));
        const fr = (n) => (bc.value === 'ff' ? (n * c()) / (2 * Ls.value) : ((2 * n - 1) * c()) / (4 * Ls.value));
        const ord = (n) => (bc.value === 'ff' ? n : 2 * n - 1);
        const voice = { duration: 0.9, gain: 0.24, release: 0.15 };
        lad.onClick((x, y) => {
          const n = M.clamp(Math.round(NR + 1 - y), 1, NR), snd = v.sound(); snd.stop();
          snd.tone(fr(n), { ...voice, duration: 1.3 }); active = n; seq = null; ph.start(1.3);
        });
        v.soundButton('Play the ladder', (snd) => { M.range(NR, 1).forEach((n, i) => snd.tone(fr(n), { ...voice, duration: 0.42, delay: 0.5 * i })); seq = 0.5; active = null; ph.start(NR * 0.5); });
        v.soundButton('all together', (snd) => { snd.tone(M.range(NR, 1).map((n) => [fr(n), 1 / ord(n)]), { duration: 2, gain: 0.3 }); seq = null; active = 'all'; ph.start(2); });
        v.animate((t) => {
          const t0 = ph.t, cur = t0 == null ? null : seq ? Math.floor(t0 / seq) + 1 : active;
          for (let n = 1; n <= NR; n++) {
            const y0 = NR + 1 - n, on = cur === n || cur === 'all', q = ord(n);
            const k = bc.value === 'ff' ? q * Math.PI : (q * Math.PI) / 2, A = 0.34;
            lad.line(0, y0, 1, y0, { color: 'faint', width: 1 });
            lad.between((x) => y0 + A * Math.sin(k * x), (x) => y0 - A * Math.sin(k * x), 0, 1, { fill: on ? 'gold' : 'accent', fillAlpha: on ? 0.2 : 0.07, n: 160 });
            lad.fn((x) => y0 + A * Math.sin(k * x) * Math.cos(TAU * 0.35 * q * t), { domain: [0, 1], n: 200, color: on ? 'gold' : 'accent', width: on ? 3 : 2.2 });
            lad.line(0, y0 - 0.22, 0, y0 + 0.22, { color: 'muted', width: 3 });
            if (bc.value === 'ff') lad.line(1, y0 - 0.22, 1, y0 + 0.22, { color: 'muted', width: 3 });
            else lad.line(1, y0 - 0.4, 1, y0 + 0.4, { color: 'faint', width: 2, dash: [3, 3] });
            lad.text(`n = ${n}`, -0.05, y0, { align: 'right', color: 'muted', size: 12 });
            const f = fr(n);
            lad.text(`${bc.value === 'ff' ? n : q}·f₁ = ${f < 1000 ? v.fix(f, 1) : v.fix(f, 0)} Hz`, 1.07, y0 + 0.11, { align: 'left', color: on ? 'gold' : 'ink', size: 12.5, weight: on ? 700 : 500 });
            lad.text(noteOf(M, f), 1.07, y0 - 0.2, { align: 'left', color: 'muted', size: 11 });
          }
          // ---- ruler
          const fmax = fr(NR) * 1.08;
          rul.setView([0, 1], [0, fmax]);
          rul.setTicks([], null);
          for (let n = 1; n <= NR; n++) {
            const on = cur === n || cur === 'all', f = fr(n);
            rul.line(0.12, f, 0.88, f, { color: on ? 'gold' : 'accent', width: on ? 3.5 : 2.2 });
            rul.text(`${ord(n)}`, 0.94, f, { align: 'left', color: 'muted', size: 11 });
          }
        }, { still: 1.3 });
        v.readout(() => {
          const cc = c(), f1 = fr(1), ff = bc.value === 'ff';
          const list = M.range(NR, 1).map((n) => v.fix(fr(n) / f1, 3)).join(' : ');
          return `$c=\\sqrt{T/\\mu}$ = ${v.fix(cc, 1)} m/s · ${ff ? `$f_1=c/2L$` : `$f_1=c/4L$`} = ${v.fix(f1, 2)} Hz (${noteOf(M, f1)}) · computed ratios $f_n/f_1$ = ${list}${ff ? ': whole numbers, whatever $L$, $T$ and $\\mu$' : ': odd numbers only, and the fundamental is an octave below the fixed–fixed string'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Law',
      name: 'Mersenne’s laws',
      statement: String.raw`The fundamental frequency of a stretched string is
$$f_1=\frac1{2L}\sqrt{\frac T\mu},$$
so, with the other two quantities held fixed,
(i) $f_1$ is inversely proportional to the vibrating **length** $L$ (halve the string: up an octave);
(ii) $f_1$ is proportional to the **square root of the tension** $T$ (quadruple the weight: up an octave);
(iii) $f_1$ is inversely proportional to the **square root of the mass per length** $\mu$; for strings of one material $\mu\propto d^2$, so $f_1\propto1/d$ (a string twice as thick sounds an octave lower).

On logarithmic axes the three laws are straight lines of slope $-1$, $+\tfrac12$ and $-\tfrac12$.`,
      idea: String.raw`This is 2.4 for $n=1$, read three ways. The length law is the oldest (Pythagoras' monochord, as ratios of lengths); the square roots come from the wave speed $c=\sqrt{T/\mu}$, which is fixed by Newton's second law applied to a piece of string (2.1): a heavier string responds more slowly to the same restoring force, a tighter one more quickly. Dimensional analysis already forces the form: the only frequency that can be built from $L$, $T$ and $\mu$ is a multiple of $\sqrt{T/\mu}/L$.`,
      caption: String.raw`A monochord: drag the gold bridge (or the length slider), change the hanging weight and pick a string. *Hold the note* keeps a tone sounding that follows every change; *Pluck* plays a plucked string. Choose what to **plot against**, then press *Measure* at several settings: each measurement times the period of a simulated string (2.2), and points taken with the other two quantities unchanged land on a line whose fitted slope appears in the readout.`,
      deps: ['music-2.4'],
      see: ['music-2.14'],
      refs: ['Benson ch. 3', 'Loy I ch. 8'],
      tags: ['string', 'pitch'],
      credit: 'Marin Mersenne, 1636 (length: Pythagorean tradition; tension: Vincenzo Galilei, 1589)',
      scope: String.raw`Holds for a flexible, uniform string vibrating with small amplitude between rigid supports. Very thick or short strings are stiff and sound sharp (2.11); large amplitudes raise the tension; a string wound with a heavy wrap obeys law (iii) in $\mu$, not in its outer diameter.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mersenne%27s_laws' },
      viz(v) {
        const M = v.M;
        const STR = {
          s25: { label: 'steel 0.25 mm', rho: 7850, d: 0.254 }, s43: { label: 'steel 0.43 mm', rho: 7850, d: 0.432 },
          s66: { label: 'steel 0.66 mm', rho: 7850, d: 0.66 }, ny: { label: 'nylon 0.71 mm', rho: 1140, d: 0.71 }, gut: { label: 'gut 1.0 mm', rho: 1300, d: 1.0 },
        };
        const muOf = (k) => (STR[k].rho * Math.PI * (STR[k].d * 1e-3) ** 2) / 4;
        const T0 = muOf('s25') * (2 * 0.648 * 329.63) ** 2;
        const Ls = v.slider('length $L$', 0.15, 1.3, 0.648, { log: true, fmt: (x) => v.fix(x * 100, 1) + ' cm', onChange: () => sync() });
        const Ts = v.slider('tension $T$', 10, 400, T0, { log: true, fmt: (x) => v.fmt(x, 3) + ' N', onChange: () => sync() });
        const sS = v.select('string', Object.entries(STR).map(([value, o]) => ({ value, label: o.label })), 's25', { onChange: () => sync() });
        const xv = v.select('plot against', [{ value: 'L', label: 'length' }, { value: 'T', label: 'tension' }, { value: 'mu', label: 'mass per length' }], 'L');
        const hold = v.toggle('hold the note', false, { onChange: (on) => { if (on) { voice = v.sound().tone(f1(), { sustain: true, harmonics: 10, rolloff: 1.15, gain: 0.16, attack: 0.03 }); } else if (voice) { voice.stop(); voice = null; } } });
        let voice = null;
        const f1 = () => Math.sqrt(Ts.value / muOf(sS.value)) / (2 * Ls.value);
        function sync() { if (voice && voice.playing) voice.setFreq(f1()); }
        v.button('Pluck', () => v.sound().samples(finish(synth(bridgeParts(triCoeffs(0.18, 1, 30), f1()), 1.5), 0.8), SR, { gain: 0.5 }));
        // a measurement times the period of a simulated string (leapfrog at Courant number 1, 60 cells)
        const measure = (L, T, mu) => {
          const N = 60, c = Math.sqrt(T / mu), dx = L / N, dt = dx / c, steps = 8 * 2 * N, probe = 13;
          let y0 = new Float64Array(N + 1), y1 = new Float64Array(N + 1);
          for (let i = 0; i <= N; i++) { const x = i / N; y0[i] = x < 0.18 ? x / 0.18 : (1 - x) / 0.82; }
          for (let i = 1; i < N; i++) y1[i] = 0.5 * (y0[i - 1] + y0[i + 1]);
          const sig = [y0[probe], y1[probe]];
          for (let k = 2; k <= steps; k++) { const y2 = new Float64Array(N + 1); for (let i = 1; i < N; i++) y2[i] = y1[i - 1] + y1[i + 1] - y0[i]; y0 = y1; y1 = y2; sig.push(y1[probe]); }
          // period = lag of the highest autocorrelation peak between 1.5N and 2.5N steps (parabolic refinement)
          const ac = (lag) => { let s = 0; for (let i = 0; i + lag < sig.length; i++) s += sig[i] * sig[i + lag]; return s / (sig.length - lag); };
          let best = N, bv = -Infinity; for (let lag = Math.floor(1.5 * N); lag <= Math.ceil(2.5 * N); lag++) { const a = ac(lag); if (a > bv) { bv = a; best = lag; } }
          const a0 = ac(best - 1), a1 = ac(best), a2 = ac(best + 1), off = (a0 - a2) / (2 * (a0 - 2 * a1 + a2) || 1);
          return 1 / ((best + off) * dt);
        };
        const pts = [];
        v.button('Measure', () => { const L = Ls.value, T = Ts.value, mu = muOf(sS.value); pts.push({ L, T, mu, f: measure(L, T, mu) }); });
        v.button('Clear', () => { pts.length = 0; });
        const mono = v.stage({ x: [-0.1, 1.62], y: [-0.62, 0.45], height: 300, axes: false, weight: 1.3 });
        const lg = v.stage({ x: [0.1, 2], y: [20, 5000], xlog: true, ylog: true, height: 300, axes: 'box', grid: true, xlabel: 'L (m)', ylabel: 'f₁ (Hz)', weight: 1 });
        const br = mono.handle(0.648, 0, { color: 'gold', r: 8, constrain: (x) => [M.clamp(x, 0.15, 1.3), 0], onDrag: (hd) => { Ls.set(hd.x); sync(); } });
        const same = (p, k) => (k === 'L' || Math.abs(p.L / Ls.value - 1) < 1e-3) && (k === 'T' || Math.abs(p.T / Ts.value - 1) < 1e-3) && (k === 'mu' || Math.abs(p.mu / muOf(sS.value) - 1) < 1e-3);
        const AX = {
          L: { x: [0.1, 2], lab: 'L (m)', val: (p) => p.L, law: -1, f: (x) => Math.sqrt(Ts.value / muOf(sS.value)) / (2 * x) },
          T: { x: [5, 1000], lab: 'T (N)', val: (p) => p.T, law: 0.5, f: (x) => Math.sqrt(x / muOf(sS.value)) / (2 * Ls.value) },
          mu: { x: [0.1, 10], lab: 'μ (g/m)', val: (p) => p.mu * 1e3, law: -0.5, f: (x) => Math.sqrt(Ts.value / (x * 1e-3)) / (2 * Ls.value) },
        };
        let fit = null;
        v.animate((t) => {
          if (!br.dragging) br.x = Ls.value;
          sync();
          const L = Ls.value, T = Ts.value, mu = muOf(sS.value), f = f1(), dpx = Math.max(1.2, STR[sS.value].d * 3.2);
          // ---- monochord
          mono.rect(-0.04, -0.17, 1.4, -0.03, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1.2, radius: 3 });
          mono.circle(0.7, -0.1, 0.035, { color: 'orange', width: 1, alpha: 0.6 });
          mono.poly([[0, 0], [-0.025, -0.03], [0.025, -0.03]], { fill: 'muted', fillAlpha: 1, stroke: false });
          mono.poly([[L, 0], [L - 0.03, -0.03], [L + 0.03, -0.03]], { fill: 'gold', fillAlpha: 0.9, stroke: false });
          const A = 0.05 * Math.min(1, 0.4 + L), ph = Math.cos(TAU * 1.6 * t);
          mono.between((x) => A * Math.sin((Math.PI * x) / L), (x) => -A * Math.sin((Math.PI * x) / L), 0, L, { fill: 'accent', fillAlpha: 0.12, n: 120 });
          mono.fn((x) => A * Math.sin((Math.PI * x) / L) * ph, { domain: [0, L], n: 120, color: 'accent', width: dpx });
          mono.line(L, 0, 1.49, 0, { color: 'ink', width: dpx });
          mono.circle(1.49, -0.035, 0.035, { color: 'muted', width: 2, fill: 'panel', fillAlpha: 1 });
          const kg = T / 9.81, side = 0.06 + 0.05 * Math.cbrt(kg / 10), yTop = -0.36;
          mono.line(1.525, -0.035, 1.525, yTop, { color: 'ink', width: dpx });
          mono.rect(1.525 - side / 2, yTop - side * 1.25, 1.525 + side / 2, yTop, { fill: 'muted', fillAlpha: 0.75, color: 'ink', width: 1.2 });
          mono.text(`T = ${v.fmt(T, 3)} N`, 1.44, yTop - side * 0.3, { align: 'right', color: 'ink', size: 12, weight: 600 });
          mono.text(`(${v.fmt(kg, 3)} kg)`, 1.44, yTop - side * 0.3 - 0.075, { align: 'right', color: 'muted', size: 11 });
          mono.measure(0, 0.22, L, 0.22, `L = ${v.fix(L * 100, 1)} cm`, { color: 'ink', math: false, size: 12, offset: -11 });
          mono.text(`${STR[sS.value].label}: μ = ${v.fmt(mu * 1e3, 3)} g/m`, 0.02, -0.27, { align: 'left', color: 'muted', size: 11.5 });
          mono.text(`f₁ = ${v.fix(f, 1)} Hz  ${noteOf(M, f)}`, 0.02, -0.4, { align: 'left', color: 'accent', size: 15, weight: 700 });
          if (voice && voice.playing) mono.text('♪ sounding', 0.02, -0.52, { align: 'left', color: 'gold', size: 12, weight: 600 });
          // ---- log–log plot against the chosen quantity
          const ax = AX[xv.value];
          lg.setScale({ xlog: true, ylog: true, x: ax.x, y: [20, 5000] });
          lg.setLabels(ax.lab, 'f₁ (Hz)');
          lg.fn(ax.f, { domain: ax.x, color: 'muted', width: 1.6, dash: [6, 4] });
          const mine = pts.filter((p) => same(p, xv.value));
          pts.filter((p) => !mine.includes(p)).forEach((p) => lg.dot(ax.val(p), p.f, { r: 3.5, color: 'faint' }));
          mine.forEach((p) => lg.dot(ax.val(p), p.f, { r: 5, color: 'accent' }));
          const xc = ax.val({ L, T, mu });
          lg.dot(xc, f, { r: 6.5, color: 'gold', hollow: true, width: 2.4 });
          lg.corner(`law: slope ${ax.law > 0 ? '+' : '−'}${Math.abs(ax.law) === 1 ? '1' : '½'}`, 'tr', { color: 'muted', weight: 600 });
          fit = mine.length >= 2 && new Set(mine.map((p) => ax.val(p).toFixed(6))).size >= 2 ? M.linreg(mine.map((p) => Math.log10(ax.val(p))), mine.map((p) => Math.log10(p.f))) : null;
          if (fit) lg.corner(`fit to ${mine.length} points: slope ${v.fix(fit.slope, 3)}`, 'bl', { color: 'accent', weight: 600 });
          else lg.corner(mine.length ? 'measure at another setting' : 'press Measure', 'bl', { color: 'muted' });
        }, { still: 0.2 });
        v.legend([['muted', 'Mersenne’s law through the current setting', { dash: true }], ['accent', 'measurements, others held fixed', { dot: true }], ['faint', 'measurements taken at other settings', { dot: true }]]);
        v.readout(() => {
          const L = Ls.value, T = Ts.value, mu = muOf(sS.value), f = f1(), ax = AX[xv.value];
          const name = { L: 'length', T: 'tension', mu: 'mass per length' }[xv.value];
          return `$f_1=\\frac1{2L}\\sqrt{T/\\mu}$ = ${v.fix(f, 2)} Hz (${noteOf(M, f)}) with $L$ = ${v.fix(L * 100, 1)} cm, $T$ = ${v.fmt(T, 3)} N, $\\mu$ = ${v.fmt(mu * 1e3, 3)} g/m · an octave up needs $L/2$ (${v.fix(L * 50, 1)} cm), $4T$ (${v.fmt(4 * T, 3)} N) or $\\mu/4$ · against ${name}: ${fit ? `measured slope ${v.fix(fit.slope, 4)}, law ${ax.law > 0 ? '+' : '−'}${Math.abs(ax.law) === 1 ? '1' : '1/2'}` : 'take two or more measurements, changing only this quantity'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'The harmonic series',
      statement: String.raw`The **harmonic series** on a fundamental $f_1$ is the sequence of frequencies $f_1,2f_1,3f_1,4f_1,\dots$, the mode frequencies of an ideal string (2.4) and the partials of every periodic sound. Harmonic $n$ lies $1200\log_2 n$ cents above the fundamental: the series climbs by an octave (2), a fifth (3:2), a fourth (4:3), a major third (5:4), a minor third (6:5), …, and successive harmonics crowd together, the step from $n$ to $n+1$ being $1200\log_2\frac{n+1}n$ cents. Harmonics $1,2,4,8,16$ are octaves of the fundamental; $3$, $5$, $9$, $15$ lie within a few cents of equal-tempered notes, but $7$ is about 31 ¢ flat of the nearest key, $11$ about 49 ¢ (halfway between two keys) and $13$ about 41 ¢ sharp of its nearest key: no keyboard has these pitches.`,
      idea: String.raw`Equal steps in frequency are shrinking steps in pitch, because pitch is logarithmic (1.5): the gap $f_1$ between neighbours is a ratio $\frac{n+1}n$ that tends to 1. In cents (1.6) harmonic $n$ sits at $1200\log_2n$, and since $\log_2n$ is irrational unless $n$ is a power of 2, no harmonic except the octaves lands exactly on a key of the twelve-tone equal-tempered keyboard, which has keys every 100 ¢. Primes matter most: harmonic $mn$ is harmonic $m$ shifted by $1200\log_2n$, so every harmonic's deviation is the sum of the deviations of its prime factors (for example $9=3\cdot3$: $2\times(-2)=-4$ ¢).`,
      caption: String.raw`Top: harmonics 1–16 of the chosen fundamental on a logarithmic axis above a piano keyboard; they crowd together as they rise, and the gold keys are the nearest piano keys. Bottom: the same harmonics on a staff, with their deviation from the written note in cents (red when the gap is large). Click a harmonic (in either panel) to hear it. *Harmonics 1 → 16* plays the series; *4 : 5 : 6 : 7* plays four harmonics as a chord, and switching on **nearest piano keys** replaces every pitch with its equal-tempered neighbour, so you can compare the two.`,
      deps: ['music-2.4', 'music-1.6'],
      see: ['music-6.1'],
      refs: ['Benson ch. 4', 'Loy I ch. 3'],
      tags: ['harmonics', 'overtones'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Harmonic_series_(music)' },
      viz(v) {
        const M = v.M, NH = 16;
        // spelled intervals of the odd harmonics: [diatonic steps, semitones] within one octave
        const IV = { 1: [0, 0], 3: [4, 7], 5: [2, 4], 7: [6, 10], 9: [1, 2], 11: [3, 6], 13: [5, 8], 15: [6, 11] };
        const FUND = { C2: { d: 14, m: 36 }, D2: { d: 15, m: 38 }, E2: { d: 16, m: 40 } };
        const NAT = [0, 2, 4, 5, 7, 9, 11], LET = 'CDEFGAB';
        const fS = v.select('fundamental', Object.keys(FUND), 'C2');
        const et = v.toggle('nearest piano keys', false);
        const spell = (n) => {
          let o = n, k = 0; while (o % 2 === 0) { o /= 2; k++; }
          const j = Math.floor(Math.log2(o)), F = FUND[fS.value], [ds, ss] = IV[o];
          const d = F.d + 7 * (k + j) + ds, m = F.m + 12 * (k + j) + ss, oct = Math.floor(d / 7), L = d - 7 * oct;
          const acc = m - (12 * (oct + 1) + NAT[L]);
          const cents = 1200 * Math.log2(n) - 100 * (m - F.m);
          return { n, d, m, acc, cents, name: LET[L] + (acc > 0 ? '♯' : acc < 0 ? '♭' : '') + oct };
        };
        const f1 = () => M.midiToFreq(FUND[fS.value].m);
        const fq = (n) => (et.value ? M.midiToFreq(spell(n).m) : n * f1());
        const col = (c) => (Math.abs(c) < 8 ? 'accent' : Math.abs(c) < 25 ? 'orange' : 'red');
        let sel = 7, playing = null;
        const ph = playhead(v);
        const hit = (n) => { const snd = v.sound(); snd.stop(); sel = n; playing = n; snd.tone(fq(n), { duration: 1.3, gain: 0.26 }); ph.start(1.3); };
        v.soundButton('Harmonics 1 → 16', (snd) => { playing = 'seq'; M.range(NH, 1).forEach((n, i) => snd.tone(fq(n), { duration: 0.3, gain: 0.24, delay: 0.33 * i, release: 0.08 })); ph.start(NH * 0.33); });
        v.soundButton('4 : 5 : 6 : 7 together', (snd) => { playing = 'chord'; snd.chord(...[4, 5, 6, 7].map((n) => fq(n)), { duration: 2.6, gain: 0.32, harmonics: 3, rolloff: 1.6 }); ph.start(2.6); });
        const top = v.stage({ x: [55, 1500], y: [-0.44, 1.32], xlog: true, height: 215, axes: false, full: true });
        const sf = v.stage({ x: [-1.6, NH + 0.7], y: [10.6, 46.4], height: 265, axes: false, full: true });
        top.onClick((x) => { const n = Math.round(x / f1()); if (n >= 1 && n <= NH && Math.abs(Math.log2(x / (n * f1()))) < 0.09) hit(n); });
        sf.onClick((x) => { const n = Math.round(x); if (n >= 1 && n <= NH) hit(n); });
        v.render(() => {
          const F = f1(), lo = F * 0.84, hi = F * 18.5, t = ph.t;
          const cur = t == null ? null : playing === 'seq' ? Math.floor(t / 0.33) + 1 : playing;
          const isOn = (n) => cur === n || (cur === 'chord' && n >= 4 && n <= 7);
          top.setView([lo, hi], [-0.44, 1.32]);
          const marks = new Map(); for (let n = 1; n <= NH; n++) marks.set(spell(n).m, isOn(n) ? 'gold' : n === sel ? 'gold' : 'green');
          keyboard(top, M, lo, hi, -0.42, -0.03, new Map([...marks].map(([m, c]) => [m, c === 'green' ? 'teal' : c])));
          for (let n = 1; n <= NH; n++) {
            const S = spell(n), x = n * F, hgt = 0.28 + 0.62 / Math.sqrt(n), on = isOn(n) || n === sel;
            top.line(x, 0.02, x, hgt, { color: on ? 'gold' : col(S.cents), width: on ? 4 : 2.6 });
            top.text(String(n), x, hgt + 0.1, { align: 'center', color: on ? 'gold' : 'ink', size: 12, weight: on ? 700 : 500 });
            if (n < NH) { const g = 1200 * Math.log2((n + 1) / n); if (top.X((n + 1) * F) - top.X(x) > 34) top.text(`${Math.round(g)}¢`, Math.sqrt(n * (n + 1)) * F, 0.1, { align: 'center', color: 'muted', size: 10 }); }
          }
          top.corner('equal steps of f₁ crowd together on the keyboard; gaps in cents', 'tl', { color: 'muted' });
          // ---- staff
          const staffL = -1.4, staffR = NH + 0.6, line = (d) => sf.line(staffL, d, staffR, d, { color: 'muted', width: 1.1 });
          [30, 32, 34, 36, 38, 18, 20, 22, 24, 26].forEach(line);
          sf.line(staffL, 18, staffL, 38, { color: 'muted', width: 1.5 });
          sf.text('G', -0.85, 32, { align: 'center', color: 'muted', size: 30, math: true });
          sf.text('F', -0.85, 24, { align: 'center', color: 'muted', size: 30, math: true });
          sf.text('G4', -0.35, 32.9, { align: 'left', color: 'faint', size: 9.5 });
          sf.text('F3', -0.35, 24.9, { align: 'left', color: 'faint', size: 9.5 });
          const ctx = sf.ctx, rx = Math.abs(sf.X(0.3) - sf.X(0)), ry = Math.abs(sf.Y(0) - sf.Y(0.86));
          for (let n = 1; n <= NH; n++) {
            const S = spell(n), on = isOn(n) || n === sel, c = on ? 'gold' : Math.abs(S.cents) < 8 ? 'ink' : col(S.cents);
            const ledg = [];
            if (S.d >= 40) for (let d = 40; d <= S.d; d += 2) ledg.push(d);
            if (S.d <= 16) for (let d = 16; d >= S.d; d -= 2) ledg.push(d);
            if (S.d === 28) ledg.push(28);
            ledg.forEach((d) => sf.line(n - 0.5, d, n + 0.5, d, { color: 'muted', width: 1.1 }));
            ctx.save(); ctx.beginPath(); ctx.ellipse(sf.X(n), sf.Y(S.d), rx, ry, -0.35, 0, TAU); ctx.fillStyle = v.color(c); ctx.fill(); ctx.restore();
            if (S.acc) sf.text(S.acc > 0 ? '♯' : '♭', n - 0.55, S.d + 0.3, { align: 'center', color: c, size: 16 });
            sf.text(String(n), n, 45.4, { align: 'center', color: on ? 'gold' : 'muted', size: 11, weight: on ? 700 : 500 });
            const cs = Math.round(S.cents);
            sf.text(cs === 0 ? '0' : (cs > 0 ? '+' : '−') + Math.abs(cs), n, 11.8, { align: 'center', color: Math.abs(cs) < 8 ? 'muted' : col(cs), size: 11, weight: Math.abs(cs) >= 25 ? 700 : 500 });
          }
          sf.text('n', staffL, 45.4, { align: 'left', color: 'muted', size: 11, math: true });
          sf.text('¢', staffL, 11.8, { align: 'left', color: 'muted', size: 11 });
        });
        v.legend([['accent', 'within 8 ¢ of a piano key'], ['orange', '8–25 ¢ off'], ['red', 'more than 25 ¢ off'], ['gold', 'selected / sounding']]);
        v.readout(() => {
          const S = spell(sel), F = f1(), f = sel * F, oct = Math.floor(Math.log2(sel)), red = 1200 * Math.log2(sel / 2 ** oct);
          const gap = sel < NH ? `; the step up to harmonic ${sel + 1} is ${v.fix(1200 * Math.log2((sel + 1) / sel), 1)} ¢` : '';
          const playNote = et.value ? ` · playing the piano key ${S.name} at ${v.fix(M.midiToFreq(S.m), 2)} Hz instead` : '';
          return `harmonic ${sel} of ${fS.value} (${v.fix(F, 2)} Hz): ${v.fix(f, 2)} Hz, ratio ${sel} : 1 = ${oct} octave${oct === 1 ? '' : 's'} + ${v.fix(red, 1)} ¢ · written ${S.name}, ${Math.abs(S.cents) < 0.5 ? 'exactly' : `${v.fix(Math.abs(S.cents), 1)} ¢ ${S.cents > 0 ? 'sharp' : 'flat'} of`} the equal-tempered note${gap}${playNote}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Any pluck is a sum of modes',
      statement: String.raw`Let a string of length $L$ (take $L=1$) be released from rest with a continuous, piecewise smooth displacement $y_0$, $y_0(0)=y_0(1)=0$. Then
$$y(x,t)=\sum_{n=1}^{\infty}b_n\sin(n\pi x)\cos(2\pi nf_1t),\qquad b_n=2\int_0^1y_0(x)\sin(n\pi x)\,dx,$$
and the series converges uniformly. Every mode oscillates independently at its own frequency $nf_1$, with the amplitude set once and for all by the initial shape. The energy splits mode by mode, $E=\sum_n E_n$ with $E_n\propto n^2b_n^2$, and keeping only the first $N$ modes leaves a mean-square shape error $\tfrac12\sum_{n>N}b_n^2$ (Parseval). For a pluck (a corner) $b_n=O(1/n^2)$, for a smooth shape the $b_n$ fall off much faster.`,
      idea: String.raw`Each term solves the wave equation and the boundary conditions, so any convergent sum does too (superposition). The coefficients come from the orthogonality $\int_0^1\sin(m\pi x)\sin(n\pi x)\,dx=\tfrac12\delta_{mn}$: they are the Fourier coefficients of the odd $2$-periodic extension of $y_0$ (the same extension d'Alembert needed in 2.2), whose series converges uniformly because that extension is continuous and piecewise smooth (Dirichlet's theorem, pma-8.14; Fejér/Weierstrass approximation, pma-8.10). Integrating by parts twice turns $b_n$ into a sum over the corners of the shape divided by $n^2$, which is why a sharp pluck is rich in high harmonics.`,
      caption: String.raw`Pick a shape or **draw** one across the top panel. The bars are its sine coefficients $b_n$; the gold dots ride on them, showing each mode's amplitude $b_n\cos(2\pi nf_1t)$ oscillating independently. Truncate the sum to $N$ modes: the blue string is the $N$-mode sum, the dashed curve the exact motion (d'Alembert). The stack on the right shows the first six modes separately. *Listen* plays the $N$-mode string and *Build up* plays $N$ = 1, 2, 4, 8, 16, 40 in turn: what is lost is the brightness.`,
      deps: ['music-2.3', 'pma-8.10', 'pma-8.14'],
      see: ['waves-2.3', 'pde-4.4', 'sig-4.1', 'pde-4.7'],
      refs: ['Benson ch. 3'],
      tags: ['fourier', 'string'],
      credit: 'Daniel Bernoulli, 1753; Fourier, 1807; Dirichlet, 1829',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series' },
      viz(v) {
        const M = v.M, K = 240, NB = 40, NC = 400;
        let ys = presetShape('pluck', K), ver = 0;
        const sel = v.select('shape', [{ value: 'pluck', label: 'pluck' }, { value: 'bump', label: 'smooth bump' }, { value: 'flat', label: 'flat top' }, { value: 'draw', label: 'drawn' }], 'pluck', { onChange: (x) => { if (x !== 'draw') { ys = presetShape(x, K); ver++; v.t = 0; } } });
        const nS = v.slider('modes kept $N$', 1, NB, 6, { int: true });
        const s = v.stage({ x: [-0.04, 1.04], y: [-1.12, 1.12], height: 250, axes: false, full: true });
        const bs = v.stage({ x: [0.2, NB + 0.8], y: [-0.62, 0.72], height: 225, axes: 'box', xlabel: 'n', xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], weight: 1.25, title: 'sine coefficients $b_n$ and live amplitudes' });
        const ms = v.stage({ x: [-0.18, 1.02], y: [0.4, 6.6], height: 225, axes: false, weight: 0.9, minWidth: 220, title: 'the first six modes' });
        shapePainter(s, () => ys, (phase) => { if (sel.value !== 'draw') sel.set('draw'); ver++; v.t = 0; if (phase === 'start') v.pause(); if (phase === 'end') v.play(); });
        let cKey = -1, b = null, norm2 = 1, eTot = 1;
        const coeffs = () => {
          if (cKey === ver) return b; cKey = ver;
          b = polyCoeffs(M.range(K + 1).map((i) => i / K), ys, NC);
          norm2 = 0; for (let i = 0; i < K; i++) norm2 += (ys[i] * ys[i] + ys[i] * ys[i + 1] + ys[i + 1] * ys[i + 1]) / (3 * K);
          eTot = b.reduce((a, bn, i) => a + (i + 1) ** 2 * bn * bn, 0) || 1;
          return b;
        };
        const f = (x) => lerpGrid(ys, x), Y = oddExt(f);
        const tone = (N) => finish(synth(bridgeParts(coeffs(), F1, N), 1.3), 0.8);
        v.soundButton('Listen', (snd) => snd.samples(tone(nS.value), SR, { gain: 0.55 }));
        v.soundButton('Build up', (snd) => {
          const parts = [1, 2, 4, 8, 16, 40].map((N) => tone(N).subarray(0, Math.round(0.85 * SR)));
          parts.forEach((p) => finish(p, 0.8, SR, 0.002, 0.06));
          const gap = Math.round(0.12 * SR), out = new Float32Array(parts.length * (parts[0].length + gap));
          parts.forEach((p, i) => out.set(p, i * (p.length + gap)));
          snd.samples(out, SR, { gain: 0.55 });
        });
        let tau = 0;
        v.animate((t) => {
          const bb = coeffs(), N = nS.value;
          tau = M.mod(0.25 * t, 2);
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          s.fn((x) => 0.5 * (Y(x - tau) + Y(x + tau)), { domain: [0, 1], n: 500, color: 'muted', width: 1.6, dash: [7, 5] });
          s.fn((x) => modal(bb, N, x, tau), { domain: [0, 1], n: 400, color: 'accent', width: 3 });
          posts(s, 1, 0, 0.15);
          s.corner(`sum of ${N} mode${N > 1 ? 's' : ''}`, 'tl', { color: 'accent', weight: 600 });
          s.corner(sel.value === 'draw' ? 'your shape' : 'drag across the panel to draw a shape', 'tr', { color: 'muted' });
          // ---- coefficients
          const bm = Math.max(1e-9, ...Array.from(bb.subarray(0, NB), Math.abs)), sc = 0.6 / bm;
          bs.setTicks(undefined, [[-0.6, v.fix(-bm, 2)], [0, '0'], [0.6, v.fix(bm, 2)]]);
          bs.hline(0, { color: 'muted', width: 1 });
          for (let n = 1; n <= NB; n++) {
            const val = bb[n - 1] * sc, kept = n <= N;
            bs.rect(n - 0.32, 0, n + 0.32, val, { fill: kept ? 'accent' : 'muted', fillAlpha: kept ? 0.6 : 0.18, stroke: false });
            if (kept && Math.abs(val) > 0.004) bs.dot(n, val * Math.cos(n * Math.PI * tau), { r: 3.2, color: 'gold' });
          }
          bs.vline(N + 0.5, { color: 'accent', width: 1.4, dash: [4, 3] });
          // ---- mode stack
          for (let n = 1; n <= 6; n++) {
            const y0 = 7 - n, a = (bb[n - 1] / bm) * 0.42, on = n <= N;
            ms.line(0, y0, 1, y0, { color: 'faint', width: 1 });
            ms.fn((x) => y0 + a * Math.sin(n * Math.PI * x) * Math.cos(n * Math.PI * tau), { domain: [0, 1], n: 120, color: on ? 'accent' : 'muted', width: on ? 2.2 : 1.2, alpha: on ? 1 : 0.6 });
            ms.text(`${n}`, -0.07, y0, { align: 'right', color: on ? 'ink' : 'faint', size: 12 });
          }
        }, { still: 0.5 / 0.25 });
        v.legend([['accent', 'sum of the first $N$ modes'], ['muted', 'exact motion (d’Alembert)', { dash: true }], ['gold', 'live amplitude $b_n\\cos(2\\pi n f_1 t)$', { dot: true }]]);
        v.readout(() => {
          const bb = coeffs(), N = nS.value;
          let kept2 = 0, eN = 0; for (let n = 1; n <= N; n++) { kept2 += bb[n - 1] ** 2; eN += n * n * bb[n - 1] ** 2; }
          const rel = Math.sqrt(Math.max(0, 1 - kept2 / (2 * norm2)));
          let err = 0; for (let i = 0; i <= 200; i++) { const x = i / 200; err = Math.max(err, Math.abs(modal(bb, N, x, tau) - 0.5 * (Y(x - tau) + Y(x + tau)))); }
          const b1 = bb[0], tail = Math.abs(bb[NB - 1] / (b1 || 1));
          return `$N$ = ${N}: shape error (rms, by Parseval) ${v.fix(100 * rel, 2)}% of $\\lVert y_0\\rVert$, largest gap right now ${v.fix(err, 3)} · the first $N$ modes carry ${v.fix(100 * eN / eTot, 2)}% of the energy ($E_n\\propto n^2b_n^2$) · $b_1$ = ${v.fix(b1, 4)}, $|b_{40}/b_1| = ${v.sci(tail, 2)}$`;
        });
      },
    },
  ],
};
