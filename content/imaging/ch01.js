// Medical Imaging — Chapter 1: Imaging systems and image quality
// Part 1 (this file): 1.1–1.5 — linear shift-invariant systems, PSF and convolution, the 2-D Fourier transform,
// the modulation transfer function, 2-D sampling and aliasing. Part 2 (ch01-b.js): 1.6–1.10 — noise, detectability, resolution, ROC.
import {
  bindM, clamp, fx, pt, pct, mean, showImage, frame, psfC, convFFT, convCheck, mtfX, dft2, sheppLogan, render, starAt, barTarget, TAU, FWHM_K,
} from './ch01.shared.js';

export default {
  collection: 'imaging',
  chapter: 1,
  title: 'Imaging systems and image quality',
  summary: String.raw`Every medical image is the output of a physical system acting on the body, and most such systems are approximately linear and shift-invariant: the image is the object convolved with a point spread function. Fourier analysis turns blur into a modulation transfer function and sampling into aliasing. Counting statistics set the noise, which with contrast determines what can be detected — the reason dose and image quality trade off.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Linear shift-invariant imaging systems',
      statement: String.raw`An imaging system maps an object $f(x,y)$ (the distribution of some tissue property) to an image $g=\mathcal S[f]$. It is **linear** if $\mathcal S[af_1+bf_2]=a\,\mathcal S[f_1]+b\,\mathcal S[f_2]$ for all objects and constants, and **shift-invariant** if translating the object translates the image by the same amount, $\mathcal S[f(\cdot-x_0,\cdot-y_0)]=g(\cdot-x_0,\cdot-y_0)$. Because every object is a superposition of point sources, a linear shift-invariant (LSI) system is completely described by the one image it forms of a single point, and that image is the same for every position of the point.`,
      idea: String.raw`Write the object as a weighted sum of point sources (the sifting property of the delta function). Linearity lets the system act on each point separately and add the results; shift-invariance says each point's image is the same blur $h$ moved to where the point is. Real systems satisfy both only approximately: lenses and collimators blur more toward the edge of the field, and detectors saturate. The two properties are exactly what make the Fourier analysis of the rest of the chapter possible.`,
      caption: String.raw`Drag the sources $A$ and $B$ (they snap to pixels) and choose the PSF. The right panels show the image of both sources together and the difference between "image of $A$ alone + image of $B$ alone" and that image. For the LSI system the difference is zero to rounding error and a displaced source gives the same blur, merely moved. Switch to "blur grows to the right" (not shift-invariant) or "saturating" (not linear) and watch the residual appear.`,
      deps: ['sig-3.2'],
      tags: ['linear systems', 'point source'],
      refs: ['Prince–Links ch. 2'],
      viz(v) {
        bindM(v.M);
        const N = 64, st = { x: [0, N], y: [0, N], equal: true, axes: false, height: 230, minWidth: 190 };
        const O = v.stage({ ...st, title: 'object: two point sources' });
        const J = v.stage({ ...st, title: 'image of A alone + image of B alone' });
        const I = v.stage({ ...st, title: 'image of both together' });
        const R = v.stage({ ...st, title: 'difference (sum − together)' });
        const sys = v.select('system', [{ value: 'lsi', label: 'linear, shift-invariant' }, { value: 'var', label: 'blur grows to the right' }, { value: 'sat', label: 'saturating (nonlinear)' }], 'lsi');
        const typ = v.select('PSF', [{ value: 'gauss', label: 'Gaussian' }, { value: 'disc', label: 'disc' }, { value: 'motion', label: 'motion blur' }], 'gauss');
        const wid = v.slider('width (px)', 1.5, 12, 6, { step: 0.1 });
        const ampB = v.slider('amplitude of B', 0.2, 1.5, 1, { step: 0.05 });
        const snap = (x, y) => [clamp(Math.floor(x), 4, N - 5) + 0.5, clamp(Math.floor(y), 4, N - 5) + 0.5];
        const hA = O.handle(20.5, 40.5, { color: 'orange', label: 'A', constrain: snap }), hB = O.handle(41.5, 24.5, { color: 'teal', label: 'B', constrain: snap });
        const cell = (h) => [Math.floor(h.x), N - 1 - Math.floor(h.y)];
        const single = (c, a) => { const o = new Float64Array(N * N); o[c[1] * N + c[0]] = a; return o; };
        const ang = 25;
        function apply(obj, kind, ker, m) {
          if (kind === 'var') {
            const out = new Float64Array(N * N);
            for (let q = 0; q < obj.length; q++) if (obj[q]) {
              const i = q % N, j = (q - i) / N, k = psfC(typ.value, wid.value * (0.3 + 1.7 * ((i + 0.5) / N)), ang);
              for (let b = 0; b < k.K; b++) for (let a = 0; a < k.K; a++) {
                const x = i + a - k.c, y = j + b - k.c;
                if (x >= 0 && x < N && y >= 0 && y < N) out[y * N + x] += obj[q] * k.a[b * k.K + a];
              }
            }
            return out;
          }
          const out = convFFT(obj, N, N, ker);
          if (kind === 'sat') for (let q = 0; q < out.length; q++) out[q] = m * Math.tanh(out[q] / m);
          return out;
        }
        let ver = 0, S = null;
        v.render(() => {
          const kind = sys.value, ker = psfC(typ.value, wid.value, ang), kmax = ker.a[ker.c * ker.K + ker.c], m = 0.8 * kmax;
          const cA = cell(hA), cB = cell(hB), aB = ampB.value;
          const oA = single(cA, 1), oB = single(cB, aB), oAB = oA.map((x, q) => x + oB[q]);
          const gA = apply(oA, kind, ker, m), gB = apply(oB, kind, ker, m), gAB = apply(oAB, kind, ker, m);
          let sup = 0; const res = new Float64Array(N * N);
          for (let q = 0; q < res.length; q++) { res[q] = gA[q] + gB[q] - gAB[q]; sup = Math.max(sup, Math.abs(res[q])); }
          // shift test: image of A moved by (dx, dy), compared with the image of A moved by the same amount afterwards
          const dx = cA[0] < N / 2 ? 9 : -9, dy = cA[1] < N / 2 ? 6 : -6;
          const gA2 = apply(single([cA[0] + dx, cA[1] + dy], 1), kind, ker, m);
          let shiftErr = 0;
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const i2 = i + dx, j2 = j + dy;
            if (i2 >= 0 && i2 < N && j2 >= 0 && j2 < N) shiftErr = Math.max(shiftErr, Math.abs(gA2[j2 * N + i2] - gA[j * N + i]));
          }
          const hi = kmax * 1.6, ref = kmax;
          showImage(O, oAB, N, N, { lo: 0, hi: 1 }); frame(O, N, N);
          const gS = gA.map((x, q) => x + gB[q]);
          showImage(J, gS, N, N, { lo: 0, hi, id: 'j' }); frame(J, N, N);
          showImage(I, gAB, N, N, { lo: 0, hi }); frame(I, N, N);
          R.heat((x, y) => res[(N - 1 - Math.floor(y)) * N + Math.floor(x)], { range: [-0.5 * ref, 0.5 * ref], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 1, key: `r${++ver}` }); frame(R, N, N);
          if (sup < 1e-9 * ref) R.text('no difference', N / 2, N / 2, { align: 'center', size: 15, color: 'muted' });
          R.corner(sup < 1e-9 * ref ? 'max 0' : `peak residual ${pt(sup / ref, 1)} of one PSF peak`, 'tl', { color: sup < 1e-9 * ref ? 'green' : 'red', weight: 700, plate: true });
          I.dot(cA[0] + 0.5, N - cA[1] - 0.5, { r: 3, color: 'orange' }); I.dot(cB[0] + 0.5, N - cB[1] - 0.5, { r: 3, color: 'teal' });
          S = { sup: sup / ref, shiftErr: shiftErr / ref, dx, dy, kind };
        });
        v.readout(() => {
          if (!S) return '';
          const lin = S.sup < 1e-9, shi = S.shiftErr < 1e-9;
          return `**Superposition:** $\\max|\\mathcal S[A]+\\mathcal S[B]-\\mathcal S[A+B]|$ is ${lin ? '0 (rounding error only)' : pt(S.sup, 1) + ' of one PSF peak'}, so the system is ${lin ? '**linear**' : '**not linear**'}.\n**Shift test:** move $A$ by $(${S.dx},${-S.dy})$ pixels and compare with the old image moved by the same vector: the largest difference is ${shi ? '0 (rounding error only)' : pt(S.shiftErr, 1) + ' of one PSF peak'}, so the system is ${shi ? '**shift-invariant**' : '**not shift-invariant**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Point spread function and convolution',
      statement: String.raw`If an imaging system is linear and shift-invariant, its image of a point source $\delta(x,y)$ is the **point spread function** $h(x,y)$, and the image of any object $f$ is the convolution
$$g(x,y)=(f*h)(x,y)=\iint f(x',y')\,h(x-x',y-y')\,dx'\,dy' .$$
In a digital image, $g[m,n]=\sum_{j,k}f[j,k]\,h[m-j,n-k]$. The PSF is normally non-negative and normalised to unit area (blurring conserves the total signal); a wider PSF averages over a larger neighbourhood and so removes fine detail first.`,
      idea: String.raw`This is the superposition argument of 1.1 written as an integral: each object point $f(x',y')$ contributes a copy of $h$ centred at $(x',y')$ and scaled by $f(x',y')$. Evaluating the sum directly costs one pass over the kernel for every pixel; the convolution theorem from Fourier analysis turns it into a pointwise product of transforms, computed with the FFT — the two routes give the same image. Detail whose size is smaller than the PSF is averaged away; detail much larger survives untouched.`,
      caption: String.raw`Choose an object (or paint your own with the mouse) and a PSF; widen it and the finest bars vanish first. The middle panel shows the kernel itself. The profile along the dashed line (drag its handle) compares object and image. The readout checks the FFT-computed image against the definition, evaluated directly at 500 random pixels and the four corners.`,
      deps: ['imaging-1.1', 'rca-8.14'],
      tags: ['convolution', 'PSF'],
      refs: ['Prince–Links ch. 2'],
      viz(v) {
        bindM(v.M);
        const N = 128, st = { x: [0, N], y: [0, N], equal: true, axes: false, height: 290, minWidth: 230 };
        const O = v.stage({ ...st, title: 'object' });
        const K = v.stage({ x: [0, 45], y: [0, 45], equal: true, axes: false, height: 290, minWidth: 230, title: 'point spread function (zoomed)' });
        const I = v.stage({ ...st, title: 'image = object ∗ PSF' });
        const P = v.stage({ x: [0, N], y: [0, 1.15], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'pixel along the dashed line', ylabel: 'intensity' });
        const obj = v.select('object', [{ value: 'sl', label: 'Shepp–Logan phantom' }, { value: 'bars', label: 'bar target' }, { value: 'star', label: 'Siemens star' }, { value: 'paint', label: 'paint it yourself' }], 'bars');
        const typ = v.select('PSF', [{ value: 'gauss', label: 'Gaussian (FWHM)' }, { value: 'disc', label: 'disc (diameter)' }, { value: 'motion', label: 'motion blur (length)' }], 'gauss');
        const wid = v.slider('width (px)', 0.5, 20, 5, { step: 0.1 });
        const ang = v.slider('motion angle (°)', 0, 180, 0, { step: 1 });
        const brush = v.slider('brush radius (px)', 1, 8, 3, { step: 0.5 });
        const clear = v.button('clear painting', () => { painted.fill(0); stamp(64, 64, 2); pver++; });
        const cache = {}, painted = new Float64Array(N * N); let pver = 0;
        const stamp = (cx, cy, r) => { for (let j = Math.max(0, Math.floor(cy - r)); j <= Math.min(N - 1, Math.ceil(cy + r)); j++) for (let i = Math.max(0, Math.floor(cx - r)); i <= Math.min(N - 1, Math.ceil(cx + r)); i++) if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) painted[j * N + i] = 1; };
        for (const [x, y] of [[44, 44], [56, 44], [68, 44], [80, 44], [48, 84], [80, 84]]) stamp(x, y, 1.2);
        const objectData = (k) => {
          if (k === 'paint') return painted;
          if (!cache[k]) cache[k] = k === 'sl' ? sheppLogan(N, N, 0.86) : k === 'bars' ? barTarget(N, N) : render((x, y) => (Math.hypot(x, y) < 0.9 ? starAt(x, y, 36, 0.9) : 0), N, N, 1, 2);
          return cache[k];
        };
        O.onDrag((x, y, ph) => { if (obj.value !== 'paint') { obj.set('paint'); } stamp(x, N - y, brush.value); pver++; v.invalidate(); });
        const hRow = O.handle(N - 5, 0.72 * N, { color: 'gold', constrain: 'y', label: '' });
        let ver = 0, S = null;
        v.render(() => {
          typ.value === 'motion' ? (ang.el.hidden = false) : (ang.el.hidden = true);
          brush.el.hidden = clear.hidden = obj.value !== 'paint';
          const f = objectData(obj.value), ker = psfC(typ.value, wid.value, ang.value);
          const key = `${obj.value}|${typ.value}|${wid.value}|${ang.value}|${obj.value === 'paint' ? pver : 0}`;
          if (cache.key !== key) { cache.key = key; cache.g = convFFT(f, N, N, ker); cache.err = convCheck(f, N, N, ker, cache.g); }
          const g = cache.g;
          // work with a fresh array identity when the data changed (raster cache keyed on identity)
          if (cache.shown !== key) { cache.shown = key; cache.f2 = Float64Array.from(f); }
          showImage(O, cache.f2, N, N, { lo: 0, hi: 1 }); frame(O, N, N);
          showImage(I, g, N, N, { lo: 0, hi: 1 }); frame(I, N, N);
          const kk = ker.a, kmax = Math.max(...kk);
          const KW = ker.K + 4; K.setView([0, KW], [-1.2, KW]);
          showImage(K, kk, ker.K, ker.K, { lo: 0, hi: kmax, id: 'k', win: [2, 2 + ker.K, 2, 2 + ker.K] });
          K.rect(2, 2, 2 + ker.K, 2 + ker.K, { color: 'muted', width: 1 });
          K.text(`${ker.K} × ${ker.K} samples, peak ${fx(kmax, 3)}`, KW / 2, -0.6, { align: 'center', color: 'muted', size: 12 });
          const row = clamp(N - 1 - Math.floor(hRow.y), 0, N - 1);
          hRow.x = N - 5;
          const line = []; const lineG = [];
          for (let i = 0; i < N; i++) { line.push([i + 0.5, f[row * N + i]]); lineG.push([i + 0.5, g[row * N + i]]); }
          O.line(0, N - row - 0.5, N, N - row - 0.5, { color: 'gold', dash: true, width: 1.4 });
          I.line(0, N - row - 0.5, N, N - row - 0.5, { color: 'gold', dash: true, width: 1.4 });
          P.path(line, { color: 'muted', width: 1.4, alpha: 0.9 }); P.path(lineG, { color: 'accent', width: 2.2 });
          let sf = 0, sg = 0; for (let q = 0; q < f.length; q++) { sf += f[q]; sg += g[q]; }
          S = { err: cache.err, sf, sg, K: ker.K, ver: ++ver };
        });
        v.legend([['muted', 'object'], ['accent', 'image']]);
        v.readout(() => S ? `FFT convolution vs the defining sum, at 504 pixels: $\\max$ difference $${S.err < 1e-12 ? '<10^{-12}' : v.sci(S.err, 1)}$. Total signal: object $${fx(S.sf, 1)}$, image $${fx(S.sg, 1)}$ (the PSF sums to 1, so blur conserves it).` : '');
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Two-dimensional Fourier transform and spatial frequency',
      statement: String.raw`The two-dimensional Fourier transform $F(u,v)=\iint f(x,y)\,e^{-2\pi i(ux+vy)}dx\,dy$ writes an image as a superposition of plane waves $e^{2\pi i(ux+vy)}$. The pair $(u,v)$ is a **spatial frequency**: the wave varies with $\sqrt{u^2+v^2}$ cycles per unit length (period $1/\sqrt{u^2+v^2}$) along the direction $(u,v)$, and is constant across it. Low frequencies carry the smooth overall structure, high frequencies the edges and fine detail; $\iint|f|^2=\iint|F|^2$ (Parseval). For a digital $M\times N$ image the DFT is computed by the FFT, with frequencies in multiples of $1/M$, $1/N$ cycles per pixel up to $\pm\tfrac12$.`,
      idea: String.raw`Complex exponentials are the eigenfunctions of every convolution, which is why the transform is the right coordinate system for LSI systems (1.1, 1.2). A sharp edge is not smooth, so it needs many high frequencies with slowly decaying amplitude; a smooth blob needs few. The magnitude $|F|$ is symmetric for real images ($F(-u,-v)=\overline{F(u,v)}$); the phase, not shown, decides where things are. Masking regions of the $(u,v)$ plane and inverting therefore filters the image.`,
      caption: String.raw`Left: an image; middle: $\log$-magnitude of its 2-D Fourier transform, zero frequency at the centre; right: the inverse transform of the masked spectrum. Choose a mask and drag the radius. Low-pass keeps the smooth anatomy and loses edges, high-pass keeps only edges. In "single plane wave" mode, drag the point in the spectrum: the pattern on the right (computed by the inverse FFT of just two spikes) has the period and direction read out, and agrees with the cosine formula.`,
      deps: ['rca-9.1', 'sig-5.6'],
      tags: ['Fourier transform', 'spatial frequency'],
      refs: ['Prince–Links ch. 2'],
      viz(v) {
        bindM(v.M);
        const N = 128, M = v.M;
        const A = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 290, minWidth: 220, title: 'image' });
        const B = v.stage({ x: [-0.5, 0.5], y: [-0.5, 0.5], equal: true, axes: 'box', gutter: true, height: 290, minWidth: 250, xlabel: 'u (cycles/pixel)', ylabel: 'v', title: 'log |Fourier transform|' });
        const C = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 290, minWidth: 220, title: 'inverse transform of the masked spectrum' });
        const obj = v.select('image', [{ value: 'sl', label: 'Shepp–Logan' }, { value: 'star', label: 'Siemens star' }, { value: 'bars', label: 'bar target' }], 'sl');
        const mask = v.select('mask', [{ value: 'all', label: 'keep all' }, { value: 'lp', label: 'low-pass' }, { value: 'hp', label: 'high-pass' }, { value: 'bp', label: 'ring' }, { value: 'wedge', label: 'orientation wedge' }, { value: 'wave', label: 'single plane wave' }], 'lp');
        const rad = v.slider('radius (cycles/pixel)', 0.01, 0.5, 0.08, { step: 0.005 });
        const wid = v.slider('ring width / wedge angle (°)', 0.02, 0.2, 0.05, { step: 0.005 });
        const angS = v.slider('wedge direction (°)', 0, 179, 0, { step: 1 });
        const hW = B.handle(0.125, 0.0625, { color: 'gold', r: 8, constrain: (x, y) => [clamp(Math.round(x * N) / N, -0.5, 0.5), clamp(Math.round(y * N) / N, -0.5, 0.5)] });
        const cache = {};
        function load(k) {
          if (cache[k]) return cache[k];
          const f = k === 'sl' ? sheppLogan(N, N, 0.86) : k === 'star' ? render((x, y) => (Math.hypot(x, y) < 0.9 ? starAt(x, y, 36, 0.9) : 0), N, N, 1, 2) : barTarget(N, N);
          const { re, im } = dft2(f, N, N);
          const mag = new Float64Array(N * N); let mx = 0, tot = 0;
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = Math.hypot(re[j][i], im[j][i]); tot += a * a; if (!(i === 0 && j === 0)) mx = Math.max(mx, a); }
          const shown = new Float64Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = Math.hypot(re[j][i], im[j][i]), ii = (i + N / 2) % N, jj = (j + N / 2) % N; shown[jj * N + ii] = Math.log10(1 + (1000 * a) / mx) / 3; }
          return (cache[k] = { f, re, im, tot, shown, spectrum: Float64Array.from(shown) });
        }
        // frequency (cycles/pixel) of DFT index i
        const fq = (i) => (i <= N / 2 ? i : i - N) / N;
        let S = null;
        v.render(() => {
          const mk = mask.value, D = load(obj.value);
          rad.el.hidden = mk === 'all' || mk === 'wave'; wid.el.hidden = !(mk === 'bp' || mk === 'wedge'); angS.el.hidden = mk !== 'wedge'; hW.visible = mk === 'wave';
          obj.el.hidden = mk === 'wave';
          let out, fkept = 0, perr = 0, extra = '';
          if (mk === 'wave') {
            const k = Math.round(hW.x * N), l = Math.round(-hW.y * N); // l counts rows downward
            const re = Array.from({ length: N }, () => new Float64Array(N)), im = Array.from({ length: N }, () => new Float64Array(N));
            re[((l % N) + N) % N][((k % N) + N) % N] += (N * N) / 2; re[((-l % N) + N) % N][((-k % N) + N) % N] += (N * N) / 2;
            M.ifft2(re, im);
            out = new Float64Array(N * N); const ana = new Float64Array(N * N);
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { out[j * N + i] = re[j][i]; ana[j * N + i] = Math.cos(TAU * (k * i + l * j) / N); perr = Math.max(perr, Math.abs(out[j * N + i] - ana[j * N + i])); }
            showImage(A, ana, N, N, { lo: -1, hi: 1, id: 'a', extra: `w${k},${l}` });
            const fr = Math.hypot(k, l) / N;
            extra = fr > 0 ? `Plane wave $(u,v)=(${fx(k / N, 3)},${fx(-l / N, 3)})$ cycles/pixel: period $${fx(1 / fr, 1)}$ pixels, direction ${fx((Math.atan2(-l, k) * 180) / Math.PI, 0)}°. Inverse FFT of two spikes vs $\\cos 2\\pi(ux+vy)$: max difference $${perr < 1e-12 ? '<10^{-12}' : v.sci(perr, 1)}$.` : 'Zero frequency: a constant image.';
            A.setTitle('cos 2π(ux+vy), from the formula');
            showImage(B, new Float64Array(N * N).fill(0), N, N, { lo: 0, hi: 1, win: [-0.5 - 0.5 / N, 0.5 - 0.5 / N, -0.5 + 0.5 / N, 0.5 + 0.5 / N], id: 'sp' });
            B.dot(hW.x, hW.y, { r: 4, color: 'gold' }); B.dot(-hW.x, -hW.y, { r: 4, color: 'gold' });
            S = { wave: true, extra };
          } else {
            A.setTitle('image'); showImage(A, D.f, N, N, { lo: 0, hi: 1, id: 'a' });
            showImage(B, D.spectrum, N, N, { lo: 0, hi: 1, win: [-0.5 - 0.5 / N, 0.5 - 0.5 / N, -0.5 + 0.5 / N, 0.5 + 0.5 / N], id: 'sp' });
            const re = [], im = [];
            let kept = 0; const mm = new Float64Array(N * N), r0 = rad.value, w0 = wid.value, th = (angS.value * Math.PI) / 180;
            for (let j = 0; j < N; j++) { const rr = new Float64Array(N), ii2 = new Float64Array(N); for (let i = 0; i < N; i++) {
              const u = fq(i), vv = fq(j), r = Math.hypot(u, vv);
              let w = 1;
              if (mk === 'lp') w = r <= r0 ? 1 : 0; else if (mk === 'hp') w = r >= r0 ? 1 : 0;
              else if (mk === 'bp') w = Math.abs(r - r0) <= w0 / 2 ? 1 : 0;
              else if (mk === 'wedge') { const a = Math.atan2(-vv, u); let d = Math.abs(((a - th + Math.PI * 1.5) % Math.PI) - Math.PI / 2); w = r > 0.004 && d <= (w0 / 0.2) * 0.5 ? 1 : 0; if (r <= 0.004) w = 1; }
              rr[i] = D.re[j][i] * w; ii2[i] = D.im[j][i] * w; if (w) kept += D.re[j][i] ** 2 + D.im[j][i] ** 2; mm[j * N + i] = w;
            } re.push(rr); im.push(ii2); }
            M.ifft2(re, im);
            out = new Float64Array(N * N); let e = 0;
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { out[j * N + i] = re[j][i]; e += re[j][i] ** 2; }
            fkept = kept / D.tot;
            S = { wave: false, kept: fkept, parseval: Math.abs(e / (kept / (N * N)) - 1) };
            // mask overlay: ring/wedge outlines
            if (mk === 'lp') B.circle(0, 0, r0, { color: 'orange', width: 2 });
            if (mk === 'hp') B.circle(0, 0, r0, { color: 'orange', width: 2, dash: true });
            if (mk === 'bp') { B.circle(0, 0, r0 - w0 / 2, { color: 'orange', width: 1.6 }); B.circle(0, 0, r0 + w0 / 2, { color: 'orange', width: 1.6 }); }
            if (mk === 'wedge') { const hw = (w0 / 0.2) * 0.5; for (const s of [th + hw, th - hw, th + Math.PI + hw, th + Math.PI - hw]) B.line(0, 0, 0.7 * Math.cos(s), 0.7 * Math.sin(s), { color: 'orange', width: 1.6 }); }
          }
          const hp = mk === 'hp' || mk === 'bp' || mk === 'wedge' || mk === 'wave';
          showImage(C, out, N, N, mk === 'wave' ? { lo: -1, hi: 1, id: 'c' } : hp ? { lo: -0.4, hi: 0.4, id: 'c' } : { lo: -0.05, hi: 1.05, id: 'c' });
          frame(A, N, N); frame(C, N, N);
          S.hp = hp;
        });
        v.readout(() => {
          if (!S) return '';
          if (S.wave) return S.extra;
          return `The mask keeps ${pt(S.kept, 2)} of the spectral energy $\\sum|F|^2$; by Parseval the output image holds that same fraction of $\\sum|f|^2$ (checked: relative mismatch $${S.parseval < 1e-12 ? '<10^{-12}' : v.sci(S.parseval, 1)}$). ${S.hp ? 'With the zero-frequency term removed the output has mean $0$, so grey means zero.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Modulation transfer function',
      statement: String.raw`For an LSI system with point spread function $h$ (normalised to $\iint h=1$), the **optical transfer function** is $H(u,v)=\iint h(x,y)\,e^{-2\pi i(ux+vy)}dx\,dy$ and the **modulation transfer function** is $\mathrm{MTF}(u,v)=|H(u,v)|$, with $\mathrm{MTF}(0,0)=1$. A sinusoidal object of spatial frequency $(u,v)$ and modulation (contrast) $m_{\rm in}=\dfrac{f_{\max}-f_{\min}}{f_{\max}+f_{\min}}$ is imaged as a sinusoid of the same frequency with modulation $m_{\rm out}=\mathrm{MTF}(u,v)\,m_{\rm in}$. The MTF therefore says what fraction of contrast survives at each spatial frequency; the **resolution limit** is conventionally the frequency at which it drops to a stated small value (such as 10%).`,
      idea: String.raw`A sinusoid $\cos 2\pi(ux+vy)$ is an eigenfunction of convolution: $h*\cos=\mathrm{MTF}\cdot\cos(\cdot+\varphi)$ with the phase shift $\varphi=\arg H$ — the convolution theorem of 1.2–1.3 applied to one frequency. So measuring the contrast of imaged gratings of increasing frequency traces $|H|$, and no new physics is needed to predict the result from the PSF. A wider PSF has a narrower MTF (the uncertainty relation between a function and its transform); for a Gaussian PSF of standard deviation $\sigma$, $\mathrm{MTF}=e^{-2\pi^2\sigma^2u^2}$. Bar (square-wave) patterns measure the *contrast transfer function*, which differs from the MTF because a square wave contains odd harmonics.`,
      caption: String.raw`Twelve gratings of increasing frequency (sine or bars) are blurred by the PSF you choose (computed by FFT; pixel pitch 0.5 mm is an illustrative choice, so Nyquist is 1 cycle/mm). The gold dots are the contrast measured in each blurred grating; the curve is the Fourier transform of the PSF along $u$. Drag the threshold: the frequency where the curve crosses it is the resolution limit, and it matches the band where the blurred stripes fade. Switch to bars to see the contrast transfer function overshoot the MTF, and make the motion blur vertical to see the MTF along $u$ stay at 1.`,
      deps: ['imaging-1.2', 'imaging-1.3'],
      tags: ['MTF', 'resolution'],
      refs: ['Prince–Links ch. 3'],
      viz(v) {
        bindM(v.M);
        const W = 128, HH = 16, BANDS = [3, 6, 10, 14, 19, 25, 32, 40, 48, 54, 58, 61], BH = 9, PIX = 0.5;
        const st = { x: [0, W], y: [0, BANDS.length * BH], equal: false, axes: false, height: 290, minWidth: 250 };
        const O = v.stage({ ...st, title: 'test object: gratings of increasing frequency' });
        const G = v.stage({ ...st, title: 'image after the system' });
        const P = v.stage({ x: [0, 1 / PIX / 2 * 1.02], y: [0, 1.12], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'spatial frequency (cycles/mm; pixel = 0.5 mm, Nyquist = 1)', ylabel: 'contrast transfer' });
        const typ = v.select('PSF', [{ value: 'gauss', label: 'Gaussian' }, { value: 'disc', label: 'disc' }, { value: 'motion', label: 'motion blur' }], 'gauss');
        const pat = v.select('pattern', [{ value: 'sine', label: 'sinusoidal' }, { value: 'bars', label: 'bars (square wave)' }], 'sine');
        const wid = v.slider('PSF width (px)', 0.5, 12, 3, { step: 0.1 });
        const ang = v.slider('motion angle (°)', 0, 90, 0, { step: 1 });
        const thr = v.slider('threshold', 0.02, 0.5, 0.1, { step: 0.01 });
        const row = (k, bars) => { const r = new Float64Array(W); for (let i = 0; i < W; i++) { const c = Math.cos((TAU * k * (i + 0.5)) / W); r[i] = bars ? (c >= 0 ? 1 : 0) : 0.5 + 0.5 * c; } return r; };
        const cache = {};
        let S = null, ver = 0;
        v.render(() => {
          ang.el.hidden = typ.value !== 'motion';
          const bars = pat.value === 'bars', ker = psfC(typ.value, wid.value, ang.value);
          const key = `${typ.value}|${wid.value}|${ang.value}|${pat.value}`;
          if (cache.key !== key) {
            cache.key = key;
            const obj = new Float64Array(W * BANDS.length * BH), img = new Float64Array(W * BANDS.length * BH), meas = [];
            BANDS.forEach((k, b) => {
              const r = row(k, bars), tile = new Float64Array(W * HH);
              for (let j = 0; j < HH; j++) tile.set(r, j * W);
              const g = convFFT(tile, W, HH, ker, true), gr = g.subarray((HH / 2) * W, (HH / 2 + 1) * W);
              for (let j = 0; j < BH; j++) { obj.set(r, (b * BH + j) * W); img.set(gr, (b * BH + j) * W); }
              if (bars) { let mx = -1e9, mn = 1e9; for (const x of gr) { mx = Math.max(mx, x); mn = Math.min(mn, x); } meas.push((mx - mn) / (mx + mn)); }
              else { const F = v.M.fftReal(Array.from(gr)); meas.push((2 * Math.hypot(F.re[k], F.im[k])) / W / (F.re[0] / W)); } // Fourier amplitude over mean = modulation
            });
            cache.obj = obj; cache.img = img; cache.meas = meas;
            cache.curve = Array.from({ length: 201 }, (_, i) => { const f = (0.5 * i) / 200; return [f / PIX, mtfX(ker, f)]; });
          }
          const H = BANDS.length * BH;
          showImage(O, cache.obj, W, H, { lo: 0, hi: 1, id: 'o' }); showImage(G, cache.img, W, H, { lo: 0, hi: 1, id: 'g' });
          BANDS.forEach((k, b) => {
            const y = H - b * BH - BH / 2;
            O.text(fx(k / W / PIX, 2), 3, y, { align: 'left', size: 11, color: 'ink', plate: true });
          });
          P.path(cache.curve, { color: 'accent', width: 2.4 });
          P.hline(thr.value, { color: 'orange', dash: true, width: 1.4 });
          let flim = null; for (const [f, m] of cache.curve) if (m <= thr.value) { flim = f; break; }
          if (flim != null) { P.vline(flim, { color: 'orange', width: 1.4 }); P.tex(`f_{\\rm lim}=${fx(flim, 2)}`, flim, thr.value, { color: 'orange', size: 13, dx: 8, dy: -16, align: 'left' }); }
          BANDS.forEach((k, b) => { const f = k / W / PIX; P.dot(f, cache.meas[b], { r: 5, color: 'gold' }); });
          const gl = typ.value === 'gauss';
          let dev = 0; BANDS.forEach((k, b) => { dev = Math.max(dev, Math.abs(cache.meas[b] - mtfX(ker, k / W))); });
          S = { flim, gl, sig: wid.value / FWHM_K, dev, ver: ++ver };
        });
        v.legend([['accent', 'MTF = |FT of PSF|'], ['gold', 'contrast measured in the image', { dot: true }], ['orange', 'threshold / resolution limit', { dash: true }]]);
        v.readout(() => {
          if (!S) return '';
          const bars = pat.value === 'bars';
          const th = thr.value;
          const closed = S.gl ? ` For a Gaussian the formula $e^{-2\\pi^2\\sigma^2u^2}=${fx(th, 2)}$ gives $u=${fx(Math.sqrt(-Math.log(th) / (2 * Math.PI ** 2)) / S.sig / PIX, 3)}$ cycles/mm.` : '';
          return `Resolution limit at ${pt(th, 0)} contrast: ${S.flim == null ? 'not reached below Nyquist' : `$${fx(S.flim, 2)}$ cycles/mm, i.e. line pairs ${fx(1 / S.flim, 2)} mm apart`}.${closed}\n${bars ? 'Bars: the measured points are the contrast transfer function of a square wave, not the MTF, so they need not lie on the curve. Their difference from it: up to $' + fx(S.dev, 2) + '$.' : `Sine gratings: largest distance between the measured contrast and $|H|$ is $${S.dev < 1e-9 ? '<10^{-9}' : v.sci(S.dev, 1)}$ (rounding error).`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Two-dimensional sampling and aliasing',
      statement: String.raw`Sample an image $f(x,y)$ on a square grid of spacing $\Delta$. The spectrum of the samples is the spectrum $F(u,v)$ of $f$ repeated at every shift $(m/\Delta,\,n/\Delta)$, $m,n\in\mathbb Z$. If $F(u,v)=0$ outside the square $|u|,|v|<\tfrac1{2\Delta}$ (the **Nyquist frequency** $\tfrac1{2\Delta}$), the copies do not overlap and $f$ is recovered exactly as $f(x,y)=\sum_{m,n}f(m\Delta,n\Delta)\,\operatorname{sinc}\!\big(\tfrac{x}{\Delta}-m\big)\operatorname{sinc}\!\big(\tfrac{y}{\Delta}-n\big)$. If $F$ extends beyond the Nyquist square the copies overlap (**aliasing**): a plane wave of frequency $(u,v)$ gives exactly the same samples as one of frequency $(u-m/\Delta,\,v-n/\Delta)$, so it reappears at a false frequency and orientation.`,
      idea: String.raw`Multiplying by a comb of delta functions in space is convolving with a comb in frequency (1.3 and the 1-D sampling theorem, sig-7.3), which makes the shifted copies. Overlapping copies cannot be separated again, because the samples of $e^{2\pi i(ux+vy)}$ at $x=j\Delta$, $y=k\Delta$ equal those of $e^{2\pi i((u-m/\Delta)x+(v-n/\Delta)y)}$ for integers $m,n$. In an image the effect is moiré: stripes finer than two pixels per period turn into coarser stripes in another direction. Averaging over the detector element before sampling attenuates (but does not remove) high frequencies; true removal needs a low-pass filter before sampling.`,
      caption: String.raw`Left: the scene on a very fine grid (the "continuous" object); middle: its samples on an $M\times M$ grid; right: the magnitude of the DFT of the samples. In *Siemens star* mode, move $M$: inside the dashed circle, where the local frequency $n/(2\pi r)$ exceeds the Nyquist limit, false concentric patterns appear. In *single stripe pattern* mode drag the gold point in the frequency plane beyond the Nyquist square; the red point is the alias predicted by folding, and it is where the sampled image's spectrum has its peak. Switch to pixel averaging to see the high frequencies attenuated (and zero at one cycle per pixel).`,
      deps: ['imaging-1.3', 'sig-7.3'],
      tags: ['sampling', 'aliasing', 'Nyquist'],
      refs: ['Prince–Links ch. 2'],
      viz(v) {
        bindM(v.M);
        const ST = { x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 290, minWidth: 220 };
        const A = v.stage({ ...ST, title: 'scene on a very fine grid' });
        const Bs = v.stage({ ...ST, title: 'samples' });
        const C = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: 'box', gutter: true, height: 290, minWidth: 250, xlabel: 'u (cycles/sample)', ylabel: 'v', title: 'spectrum of the samples' });
        const mode = v.select('scene', [{ value: 'star', label: 'Siemens star' }, { value: 'wave', label: 'single stripe pattern' }], 'star');
        const Ms = v.slider('samples across, M', 16, 96, 64, { step: 2, int: true });
        const nsp = v.slider('spokes n', 8, 72, 36, { step: 2, int: true });
        const smp = v.select('sampling', [{ value: 'point', label: 'point samples' }, { value: 'area', label: 'pixel average' }], 'point');
        const R = 192;
        const snap = (x, y) => { const M = Ms.value; return [clamp(Math.round(x * M) / M, -1, 1), clamp(Math.round(y * M) / M, -1, 1)]; };
        const hW = C.handle(0.6875, 0.28125, { color: 'gold', r: 8, constrain: snap });
        const cache = {};
        let S = null;
        v.render(() => {
          const M = Ms.value - (Ms.value % 2), n = nsp.value, star = mode.value === 'star', area = smp.value === 'area';
          nsp.el.hidden = !star; hW.visible = !star; C.setView(star ? [-0.56, 0.56] : [-1.06, 1.06], star ? [-0.56, 0.56] : [-1.06, 1.06]);
          let u = hW.x, vv = hW.y; if (!star) { u = Math.round(u * M) / M; vv = Math.round(vv * M) / M; }
          // scene and samples
          let fine, sampled;
          if (star) {
            const k = `star${n}`;
            if (cache.fk !== k) { cache.fk = k; cache.fine = render((x, y) => starAt(x, y, n), R, R, 1, 2); }
            fine = cache.fine;
            const k2 = `s${n}|${M}|${area}`;
            if (cache.sk !== k2) { cache.sk = k2; cache.samp = render((x, y) => starAt(x, y, n), M, M, 1, area ? 4 : 1); if (!area) { /* point samples at pixel centres */ cache.samp = Float64Array.from({ length: M * M }, (_, q) => { const i = q % M, j = (q - i) / M; return starAt(-1 + ((i + 0.5) * 2) / M, 1 - ((j + 0.5) * 2) / M, n); }); } }
            sampled = cache.samp;
          } else {
            const k = `wave${u}|${vv}|${M}`;
            // wave in units of cycles per sample: cos(2π(u i + v j))
            if (cache.fk !== k) { cache.fk = k; cache.fine = Float64Array.from({ length: R * R }, (_, q) => { const i = q % R, j = (q - i) / R, xs = ((i + 0.5) / R) * M, ys = ((j + 0.5) / R) * M; return 0.5 + 0.5 * Math.cos(TAU * (u * xs + (-vv) * ys)); }); }
            fine = cache.fine;
            const sinc = (t) => (Math.abs(t) < 1e-12 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t));
            const att = area ? sinc(u) * sinc(vv) : 1;
            sampled = Float64Array.from({ length: M * M }, (_, q) => { const i = q % M, j = (q - i) / M; return 0.5 + 0.5 * att * Math.cos(TAU * (u * (i + 0.5) + (-vv) * (j + 0.5))); });
            cache.att = att;
          }
          showImage(A, fine, R, R, { lo: 0, hi: 1, win: [-1, 1, -1, 1], id: 'a' }); frame2(A);
          showImage(Bs, sampled, M, M, { lo: 0, hi: 1, win: [-1, 1, -1, 1], id: 'b' }); frame2(Bs);
          // spectrum of the samples
          const { re, im } = dft2(sampled, M, M);
          const spec = new Float64Array(M * M); let mx = 0, pk = [0, 0], pv = 0;
          for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) { const a = Math.hypot(re[j][i], im[j][i]); if (i || j) { mx = Math.max(mx, a); if (a > pv) { pv = a; pk = [i, j]; } } }
          for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) spec[((j + M / 2) % M) * M + ((i + M / 2) % M)] = Math.log10(1 + (1000 * Math.hypot(re[j][i], im[j][i])) / (mx || 1)) / 3;
          showImage(C, spec, M, M, { lo: 0, hi: 1, win: [-0.5 - 0.5 / M, 0.5 - 0.5 / M, -0.5 + 0.5 / M, 0.5 + 0.5 / M], id: 'c' });
          C.rect(-0.5, -0.5, 0.5, 0.5, { color: 'green', width: 2 });
          C.tex('\\text{Nyquist square}', 0.5, -0.5, { color: 'green', size: 12, dx: -4, dy: 12, align: 'right' });
          if (star) {
            const rN = (2 * n) / (Math.PI * M);
            for (const s of [A, Bs]) s.circle(0, 0, rN, { color: 'red', dash: true, width: 2 });
            S = { star: true, rN, M, n };
          } else {
            const fold = (t) => t - Math.round(t);
            const ua = fold(u), va = fold(vv);
            C.dot(u, vv, { r: 7, color: 'gold' }); C.dot(-u, -vv, { r: 4, color: 'gold', hollow: true }); C.dot(-ua, -va, { r: 4, color: 'red', hollow: true });
            if (Math.abs(u) > 0.5 || Math.abs(vv) > 0.5 || Math.abs(Math.abs(u) - 0.5) < 1e-9 || Math.abs(Math.abs(vv) - 0.5) < 1e-9 || true) { C.dot(ua, va, { r: 6, color: 'red', hollow: true, label: 'alias', labelPos: 'ne' }); }
            const i = pk[0], j = pk[1], mu = (i <= M / 2 ? i : i - M) / M, mvd = -((j <= M / 2 ? j : j - M) / M);
            const hit = (Math.abs(mu - ua) < 1e-9 && Math.abs(mvd - va) < 1e-9) || (Math.abs(mu + ua) < 1e-9 && Math.abs(mvd + va) < 1e-9);
            S = { star: false, u, v: vv, ua, va, mu, mvd, hit, att: cache.att, M, area };
          }
        });
        function frame2(s) { s.rect(-1, -1, 1, 1, { color: 'muted', width: 1, alpha: 0.7 }); }
        v.readout(() => {
          if (!S) return '';
          if (S.star) return `$${S.n}$ spokes, $${S.M}\\times${S.M}$ samples: the local frequency $n/(2\\pi r)$ equals the Nyquist limit $M/4$ (in units of the field half-width) at $r=2n/(\\pi M)=${fx(S.rN, 3)}$ — the dashed circle. Inside it the sampled star is aliased (false rings and fans, moiré); outside, the spokes are faithful.`;
          const fr = Math.hypot(S.u, S.v), fa = Math.hypot(S.ua, S.va);
          return `True stripes: $(u,v)=(${fx(S.u, 3)},${fx(S.v, 3)})$ cycles/sample (${fx(fr, 3)}; ${fr > 0.5 ? '**above**' : 'below'} the Nyquist value 0.5 along ${Math.abs(S.u) > 0.5 && Math.abs(S.v) > 0.5 ? 'both axes' : 'an axis'}). Folded into the Nyquist square: $(${fx(S.ua, 3)},${fx(S.va, 3)})$, apparent period ${fa > 1e-9 ? fx(1 / fa, 2) + ' samples' : '∞ (constant)'}. Strongest nonzero DFT peak of the samples: $(${fx(S.mu, 3)},${fx(S.mvd, 3)})$ — ${S.hit ? '**matches the prediction**' : S.att < 1e-9 ? 'nothing left: pixel averaging has annihilated this frequency' : 'differs (ties between a pair of peaks or a vanishing amplitude)'}${S.area ? `. Pixel averaging scales the amplitude by $\\operatorname{sinc}(u)\\operatorname{sinc}(v)=${fx(S.att, 3)}$` : ''}.`;
        });
      },
    },
  ],
};
