// Medical Imaging — Chapter 3: Computed tomography
// Part 1 (this file): 3.1 line integrals, 3.2 Radon transform, 3.3 sinogram, 3.4 Fourier slice theorem, 3.5 uniqueness of Radon inversion.
// Part 2 (ch03-b.js): 3.6 simple back-projection, 3.7 filtered back-projection, 3.8 filter windows and noise, 3.9 fan beam, 3.10 angular sampling.
// Part 3 (ch03-c.js): 3.11 ART, 3.12 SIRT and SART, 3.13 Hounsfield units, 3.14 CT artifacts.
// Part 4 (ch03-d.js): 3.15 Feldkamp cone beam, 3.16 Fourier diffraction theorem, 3.17 Cormack 1963, 3.18 Hounsfield 1973.
import {
  clamp, fx, mean, sd, showImage, frame, raster, ellAt, ellProj, ellFT, slEllipses, makeScan, sinoEll, fbp, fourierSpokes, fourierRecon, rmse, rms,
} from './ch03.shared.js';

const PI = Math.PI;
const grey = (t) => { const c = Math.round(255 * clamp(t, 0, 1)); return [c, c, c]; };

export default {
  collection: 'imaging',
  chapter: 3,
  title: 'Computed tomography',
  summary: String.raw`CT measures line integrals of attenuation from many angles — the Radon transform — and reconstructs the cross-section. The Fourier slice theorem shows that each projection gives one line of the object’s 2-D Fourier transform, so the inverse exists and filtered back-projection computes it efficiently with a ramp filter. Fan and cone beams, angular sampling, noise, iterative algebraic methods and characteristic artifacts complete the practical picture; diffraction tomography extends the idea to waves.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'Line integrals and projections',
      statement: String.raw`A thin X-ray beam crossing a slice along a line $L$ is attenuated by every piece of tissue on its path. With a spatially varying attenuation coefficient $\mu(x,y)$ the Beer–Lambert law, applied slice by slice along the ray, gives the transmitted intensity $I=I_0\exp\!\big(-\int_L\mu\,d\ell\big)$. The **line integral** $p=\int_L\mu\,d\ell=-\ln(I/I_0)$ is therefore a quantity the detector measures directly, one number per ray. A **projection** is the set of these numbers for a family of parallel rays at one angle $\theta$, plotted against the detector coordinate $s$: $p_\theta(s)=\int\mu\,d\ell$ along $x\cos\theta+y\sin\theta=s$. Computed tomography collects projections for many angles and asks for $\mu$ from them.`,
      idea: String.raw`Beer–Lambert (imaging-2.2) says each thin layer removes a fixed fraction of the photons, so the fractions multiply and the exponents add: the log of the transmission is the sum, in the limit the integral, of $\mu$ along the ray. Taking the logarithm turns a multiplicative, non-linear detector signal into a quantity that is linear in the unknown $\mu$ — that linearity is what makes reconstruction a linear inverse problem. A single projection cannot say where along each ray the attenuation sits; only combining directions can.`,
      caption: String.raw`Drag the **angle** slider to rotate the family of parallel rays about a body-like phantom (soft tissue, a bone, an air pocket, a small lesion). **Drag the gold handle** along the projection to choose a ray: the right panel shows $\mu$ along that ray and its area, which is the plotted value. The readout checks the area (numerical integration) against the exact value and converts it to the detector's intensity. The air pocket makes a dip, the bone a bump.`,
      deps: ['imaging-2.3'],
      tags: ['projection', 'line integral', 'attenuation'],
      refs: ['Kak–Slaney §3.1'],
      scope: String.raw`Narrow monoenergetic beam, no scatter, parallel geometry. With a polychromatic beam $-\ln(I/I_0)$ is no longer exactly a line integral of one coefficient (beam hardening, imaging-2.5; see 3.14). Phantom coefficients are illustrative round numbers (water $\approx0.19\ \mathrm{cm^{-1}}$ near 70 keV).`,
      viz(v) {
        const M = v.M;
        // units: the box [-1,1]^2 is 20 cm wide; ellipse = [Δμ (1/cm), a, b, x0, y0, φ]
        const BODY = [[0.19, 0.85, 0.65, 0, 0, 0], [0.3, 0.17, 0.17, -0.33, 0.12, 0], [-0.19, 0.22, 0.2, 0.36, -0.05, 0], [0.03, 0.07, 0.07, 0.08, 0.3, 0]];
        const Wp = 110, img = raster((x, y) => ellAt(BODY, x, y), Wp, Wp, 2);
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 330, title: 'Slice and parallel rays', minWidth: 260 });
        const B = v.stage({ x: [-12, 12], y: [0, 5.2], axes: 'box', gutter: true, height: 330, xlabel: 'detector position $s$ (cm)', ylabel: 'projection $p_\\theta(s)$', title: 'Projection', minWidth: 260 });
        const C = v.stage({ x: [-14.5, 14.5], y: [0, 0.62], axes: 'box', gutter: true, height: 330, xlabel: 'distance along the ray $\\ell$ (cm)', ylabel: '$\\mu$ (cm⁻¹)', title: 'Attenuation along the chosen ray', minWidth: 260 });
        const ang = v.slider('angle $\\theta$ (°)', 0, 180, 30, { step: 1, int: true });
        let sSel = 2.0;
        const h = B.handle(sSel, 1, { color: 'gold', r: 8, constrain: 'x' });
        h.onDrag = () => { sSel = clamp(h.x, -12, 12); v.invalidate(); };
        const P = (x) => ((x + 1) * Wp) / 2;
        let st = null;
        v.render(() => {
          const th = (ang.value * PI) / 180, c = Math.cos(th), sn = Math.sin(th);
          showImage(A, img, Wp, Wp, { lo: 0, hi: 0.58, id: 'body' }); frame(A, Wp, Wp);
          for (let q = -11; q <= 11; q++) {
            const s = q * 0.09, on = false;
            A.segment([P(s * c + 1.5 * sn), P(s * sn - 1.5 * c)], [P(s * c - 1.5 * sn), P(s * sn + 1.5 * c)], { color: 'accent', width: 1, alpha: 0.35 });
          }
          const s = sSel / 10;
          A.segment([P(s * c + 1.5 * sn), P(s * sn - 1.5 * c)], [P(s * c - 1.5 * sn), P(s * sn + 1.5 * c)], { color: 'gold', width: 2.6 });
          A.dot(P(s * c - 1.5 * sn), P(s * sn + 1.5 * c), { r: 5, color: 'orange', label: 'source', labelPos: 'ne' });
          A.dot(P(s * c + 1.5 * sn), P(s * sn - 1.5 * c), { r: 5, color: 'green', label: 'detector', labelPos: 'se' });
          const prof = (x) => 10 * ellProj(BODY, th, x / 10);
          B.fn(prof, { color: 'accent', width: 2.2, n: 400, domain: [-12, 12], fill: 'accent', fillAlpha: 0.1 });
          const pe = prof(sSel);
          h.set(sSel, pe);
          B.segment([sSel, 0], [sSel, pe], { color: 'gold', dash: true, width: 1.2 });
          const mu = (l) => ellAt(BODY, s * c - (l / 10) * sn, s * sn + (l / 10) * c);
          C.fn(mu, { color: 'accent', width: 2, n: 700, domain: [-14.5, 14.5], fill: 'accent', fillAlpha: 0.22 });
          const num = M.integrate(mu, -14.5, 14.5, 4000);
          st = { th, s: sSel, pe, num };
        });
        v.legend([['accent', 'attenuation $\\mu$ / projection'], ['gold', 'chosen ray']]);
        v.readout(() => {
          if (!st) return '';
          const I = Math.exp(-st.pe);
          return `$\\theta=${ang.value}^\\circ$, $s=${fx(st.s, 1)}$ cm: exact $p=\\int\\mu\\,d\\ell=${fx(st.pe, 3)}$, numerical area under the right curve $${fx(st.num, 3)}$ (difference $${fx(Math.abs(st.num - st.pe), 4)}$ from the sampled edges).\nThe detector sees $I/I_0=e^{-p}=${fx(I, 4)}$ — i.e. $${fx(100 * I, 2)}\\%$ of the photons; the scanner stores $-\\ln(I/I_0)=${fx(-Math.log(I), 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Radon transform',
      statement: String.raw`The **Radon transform** of a function $f$ on the plane (integrable, with bounded support, such as an attenuation map) is the function on the space of lines
$$ (\mathcal Rf)(\theta,s)\;=\;\int_{\R^2} f(x,y)\,\delta(x\cos\theta+y\sin\theta-s)\,dx\,dy\;=\;\int_{-\infty}^{\infty} f(s\cos\theta-t\sin\theta,\;s\sin\theta+t\cos\theta)\,dt,$$
the integral of $f$ over the line at angle $\theta$ (normal direction $(\cos\theta,\sin\theta)$) and signed distance $s$ from the origin. It satisfies $\mathcal Rf(\theta+\pi,-s)=\mathcal Rf(\theta,s)$, so $\theta\in[0,\pi)$ suffices. A point mass at $(x_0,y_0)$ has Radon transform supported on the curve $s=x_0\cos\theta+y_0\sin\theta=r_0\cos(\theta-\varphi_0)$, a sinusoid of amplitude $r_0=|(x_0,y_0)|$.`,
      idea: String.raw`A line is fixed by two numbers $(\theta,s)$, so the family of all line integrals is again a function of two variables: the projection data of 3.1 for every angle at once. For a point source, the lines that pass through it are exactly those with $s=x_0\cos\theta+y_0\sin\theta$ — one offset for each angle, tracing a sinusoid. Linearity does the rest: the transform of a sum of objects is the sum of their sinusoidal traces, and the symmetry $(\theta+\pi,-s)\sim(\theta,s)$ reflects that the same line is described by opposite normals.`,
      caption: String.raw`In **points** mode, drag the three coloured points: each leaves a sinusoid in the $(\theta,s)$ plane whose amplitude is the point's distance from the origin and whose phase is its direction. Drag the **angle** slider: the line in the left panel hits a point exactly when the cursor crosses its curve. In **phantom** or **disc** mode the whole transform is drawn (exactly, from the chord lengths); tick **to 2π** to see the redundant second half, a mirror image.`,
      deps: ['imaging-3.1'],
      tags: ['Radon transform', 'sinusoid'],
      refs: ['Kak–Slaney §3.1', 'Prince–Links ch. 6'],
      credit: 'J. Radon, 1917',
      scope: String.raw`Definition for integrable functions of compact support in the plane (also for distributions such as point masses). Radon's own 1917 paper treats the inversion; the transform is the continuous idealisation of an infinite number of ideal parallel rays.`,
      viz(v) {
        const PH = slEllipses(0.9);
        const Wp = 100;
        const imgPh = raster((x, y) => ellAt(PH, x, y), Wp, Wp, 2);
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: true, height: 320, title: 'Object and one line', minWidth: 250 });
        const R = v.stage({ x: [0, 180], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 320, xlabel: 'angle $\\theta$ (°)', ylabel: 'offset $s$', title: 'Radon transform $(\\theta,s)$', minWidth: 300, xticks: [0, 45, 90, 135, 180] });
        const mode = v.select('object', [{ value: 'pts', label: 'three points' }, { value: 'disc', label: 'off-centre disc' }, { value: 'ph', label: 'phantom' }], 'pts');
        const ang = v.slider('line angle $\\theta$ (°)', 0, 180, 40, { step: 1, int: true });
        const ext = v.toggle('extend to 2π', false);
        const cols = ['accent', 'orange', 'green'];
        const hp = [[0.55, 0.25], [-0.4, 0.5], [-0.2, -0.65]].map(([x, y], i) => L.handle(x, y, { color: cols[i], r: 8 }));
        const hd = L.handle(0.35, -0.3, { color: 'accent', r: 8, label: 'centre' });
        const rad = 0.3, mu0 = 1;
        let st = null;
        v.render(() => {
          const th = (ang.value * PI) / 180, M = mode.value;
          const top = ext.value ? 360 : 180;
          R.setView([0, top], [-1.3, 1.3]);
          R.setTicks(top === 360 ? [0, 90, 180, 270, 360] : [0, 45, 90, 135, 180], null);
          hp.forEach((h) => { h.visible = M === 'pts'; }); hd.visible = M === 'disc';
          if (M === 'ph') {
            L.raster((x, y) => { const val = ellAt(PH, x / 1, y / 1); const t = clamp(val / 1, 0, 1); const cc = Math.round(255 * t); return Math.abs(x) < 1 && Math.abs(y) < 1 ? [cc, cc, cc] : null; }, { res: 2, id: 'ph', key: 'ph' });
            R.raster((a, s) => { const t = ellProj(PH, (a * PI) / 180, s) / 1.6; const cc = Math.round(255 * clamp(t, 0, 1)); return [cc, cc, cc]; }, { res: 2, id: 'sg', key: `ph${top}` });
          } else if (M === 'disc') {
            L.circle(hd.x, hd.y, rad, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 2 });
            const r0 = Math.hypot(hd.x, hd.y), f0 = Math.atan2(hd.y, hd.x);
            R.fn((a) => { const t = (a * PI) / 180; return r0 * Math.cos(t - f0); }, { domain: [0, top], color: 'accent', width: 1.5, dash: true });
            R.raster((a, s) => { const t = (a * PI) / 180, d = s - r0 * Math.cos(t - f0); const val = Math.abs(d) < rad ? 2 * mu0 * Math.sqrt(rad * rad - d * d) / (2 * rad) : 0; const cc = Math.round(255 * val); return [cc, cc, cc]; }, { res: 2, id: 'sg', key: `d${hd.x.toFixed(3)}${hd.y.toFixed(3)}${top}` });
          } else {
            hp.forEach((h, i) => {
              const r0 = Math.hypot(h.x, h.y), f0 = Math.atan2(h.y, h.x);
              L.dot(h.x, h.y, { r: 0.1, color: cols[i] });
              R.fn((a) => r0 * Math.cos((a * PI) / 180 - f0), { domain: [0, top], color: cols[i], width: 2.6 });
            });
          }
          // the line
          const c = Math.cos(th), sn = Math.sin(th);
          const sc = M === 'pts' ? hp.map((h) => h.x * c + h.y * sn) : null;
          const sline = M === 'pts' ? sc[0] : M === 'disc' ? hd.x * c + hd.y * sn : 0;
          L.segment([sline * c + 1.9 * sn, sline * sn - 1.9 * c], [sline * c - 1.9 * sn, sline * sn + 1.9 * c], { color: 'gold', width: 2 });
          L.arrow(0, 0, c * 0.5, sn * 0.5, { color: 'red', width: 2 });
          L.text('$\\hat n$', c * 0.58, sn * 0.58, { color: 'red', size: 13 });
          R.vline(ang.value, { color: 'gold', dash: true, width: 1.2 });
          R.dot(ang.value, sline, { color: 'gold', r: 5 });
          st = { th, sline, sc, M };
        });
        v.legend([['gold', 'line $(\\theta,s)$'], ['red', 'normal $\\hat n$']]);
        v.readout(() => {
          if (!st) return '';
          if (st.M === 'pts') {
            return hp.map((h, i) => `point ${i + 1}: $r_0=${fx(Math.hypot(h.x, h.y), 2)}$, $\\varphi_0=${fx((Math.atan2(h.y, h.x) * 180) / PI, 0)}^\\circ$, trace $s=r_0\\cos(\\theta-\\varphi_0)=${fx(st.sc[i], 2)}$`).join('\n') + `\nThe line passes through point $i$ exactly when its offset equals $x_i\\cos\\theta+y_i\\sin\\theta$ (the line is drawn through point 1).`;
          }
          if (st.M === 'disc') return `Disc of radius ${fx(rad, 2)} centred at distance $r_0=${fx(Math.hypot(hd.x, hd.y), 2)}$: its band follows the sinusoid $s=r_0\\cos(\\theta-\\varphi_0)$ (dashed) and has half-width $${fx(rad, 2)}$; the chord length through its centre is $2\\cdot${fx(rad, 2)}$.\nSymmetry: $\\mathcal Rf(\\theta+\\pi,-s)=\\mathcal Rf(\\theta,s)$ — the second half (2π) is the first half flipped in $s$.`;
          return `Shepp–Logan head phantom (exact elliptical chord lengths). Every point of the object leaves a sinusoid; the sum is the stack of projections of 3.1. Dark horizontal-ish bands are the dark ventricles, the bright outer band the skull.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Sinogram',
      statement: String.raw`The **sinogram** is the Radon transform displayed as an image: one row per view angle $\theta$ (or one column), one pixel per detector element $s$, with grey level equal to the measured line integral. Every object point traces a sinusoidal band of its own, with amplitude equal to its distance from the rotation centre, so the sinogram of a small, off-centre object is a sine wave, one at the centre is a vertical line, and an extended object is the superposition (sum) of such bands. A sinogram that is **not** a sum of sinusoids has been corrupted: if the object moves during the scan the traces break or jump.`,
      idea: String.raw`The sinogram is the raw data of every CT scanner, and it is the Radon transform (imaging-3.2) sampled on a grid. Because the transform is linear, the sinogram of the whole is the sum of the sinograms of the parts, and the sinogram of one small disc is just its centre's sinusoid with a width equal to its chord length. Reconstruction assumes one rigid object for all views; a movement of $\delta$ between two views moves the trace at that moment by $\delta$ times the cosine of the angle, which the reconstruction cannot explain, and it paints that inconsistency back as streaks and doubled edges.`,
      caption: String.raw`**Click the left panel** to drop a disc (radius and attenuation from the sliders); the **sinogram** shows its sinusoid and the **reconstruction** (filtered back-projection of the sinogram, 3.7) shows it again. **Clear** starts over. Switch on **patient motion**: after the chosen angle the whole object is shifted, the sinusoids jump, and the reconstruction fills with double edges and streaks.`,
      deps: ['imaging-3.2'],
      tags: ['sinogram', 'motion artifact'],
      refs: ['Kak–Slaney §3.1'],
      scope: String.raw`Parallel-beam sinogram of a few uniform discs, computed exactly from chord lengths on a 96-detector, 72-view grid; the reconstruction is a 64×64 filtered back-projection of that sinogram. The motion model is one rigid shift between two views.`,
      viz(v) {
        const Wp = 64, nA = 72, nd = 96;
        const sc = makeScan(nA, nd, 1.42);
        const discs = [{ x: 0.45, y: 0.2, r: 0.2, a: 1 }, { x: -0.3, y: 0.35, r: 0.14, a: 1.4 }, { x: -0.15, y: -0.45, r: 0.25, a: 0.8 }];
        const A = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 290, title: 'Object (click to add a disc)', minWidth: 230 });
        const S = v.stage({ x: [0, 180], y: [-1.42, 1.42], axes: 'box', gutter: true, height: 290, xlabel: 'view angle $\\theta$ (°)', ylabel: 'detector $s$', title: 'Sinogram', minWidth: 230, xticks: [0, 90, 180] });
        const Rc = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Reconstruction (FBP)', minWidth: 230 });
        const rr = v.slider('new disc radius', 0.06, 0.4, 0.15, { step: 0.01 });
        const aa = v.slider('new disc attenuation', 0.3, 2, 1, { step: 0.05 });
        const mot = v.toggle('patient motion', false);
        const thM = v.slider('motion at angle (°)', 10, 170, 90, { step: 1, int: true });
        const sh = v.slider('shift (fraction of FOV)', 0.02, 0.2, 0.08, { step: 0.01 });
        v.button('Clear', () => { discs.length = 0; ver++; });
        v.button('Undo', () => { discs.pop(); ver++; });
        let ver = 0, data = null, rec = null, key = '';
        A.onClick((x, y) => { if (Math.abs(x) < 0.95 && Math.abs(y) < 0.95) { discs.push({ x, y, r: rr.value, a: aa.value }); ver++; v.invalidate(); } });
        const sino = () => {
          const out = new Float64Array(nA * nd);
          for (let k = 0; k < nA; k++) {
            const th = sc.th[k], moved = mot.value && (th * 180) / PI >= thM.value, dx = moved ? sh.value : 0;
            for (let j = 0; j < nd; j++) {
              const s = sc.sOf(j); let p = 0;
              for (const d of discs) {
                const t = s - ((d.x + dx) * sc.cs[k] + d.y * sc.sn[k]);
                if (Math.abs(t) < d.r) p += 2 * d.a * Math.sqrt(d.r * d.r - t * t);
              }
              out[k * nd + j] = p;
            }
          }
          return out;
        };
        let jump = 0;
        v.render(() => {
          const k2 = `${ver}|${mot.value}|${thM.value}|${sh.value}`;
          if (k2 !== key) { key = k2; data = sino(); rec = fbp(data, sc, Wp, Wp, 'shepp'); }
          for (const d of discs) A.circle(d.x, d.y, d.r, { fill: 'accent', fillAlpha: clamp(0.15 + 0.3 * d.a, 0, 0.8), color: 'accent', width: 1.5 });
          A.rect(-1, -1, 1, 1, { color: 'muted', width: 1 });
          if (mot.value) A.text('moves after ' + thM.value + '°', 0, -0.92, { size: 12, color: 'red', align: 'center' });
          let mx = 1e-9; for (const d of data) if (d > mx) mx = d;
          S.raster((a, s) => {
            const k = Math.min(nA - 1, Math.floor((a / 180) * nA)), j = Math.floor((s + sc.half) / sc.tau);
            if (j < 0 || j >= nd) return null;
            return grey(data[k * nd + j] / mx);
          }, { res: 2, id: 'sg', key: k2 });
          const rmax = Math.max(0.5, ...discs.map((d) => Math.hypot(d.x, d.y) + d.r));
          let hi = 0.6; for (const d of discs) hi = Math.max(hi, d.a);
          showImage(Rc, rec, Wp, Wp, { lo: 0, hi: hi * 1.15, id: 'rec', smooth: true, extra: k2 }); frame(Rc, Wp, Wp);
          jump = mot.value && discs.length ? discs[0].r * 0 + sh.value * Math.cos((thM.value * PI) / 180) : 0;
        });
        v.legend([['accent', 'discs']]);
        v.readout(() => {
          const n = discs.length;
          return `${n} disc${n === 1 ? '' : 's'}: the sinogram is the sum of ${n} sinusoidal band${n === 1 ? '' : 's'}; the band of a disc at distance $r_0$ has centre line $s=r_0\\cos(\\theta-\\varphi_0)$ and thickness equal to its chord length.\n${mot.value ? `Motion: a shift of $${fx(sh.value, 2)}$ in $x$ after $${thM.value}^\\circ$ moves each trace by $\\delta\\cos\\theta$, e.g. $${fx(sh.value * Math.cos((thM.value * PI) / 180), 3)}$ at the break: the traces jump, no single object explains all views, and the reconstruction shows the damage.` : 'No motion: all views are consistent with one rigid object, and the reconstruction is faithful.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Fourier slice theorem',
      statement: String.raw`Let $f$ be an integrable function on the plane with 2-D Fourier transform $F(k_x,k_y)=\iint f\,e^{-2\pi i(k_xx+k_yy)}\,dx\,dy$, and let $P_\theta(\omega)=\int p_\theta(s)\,e^{-2\pi i\omega s}\,ds$ be the 1-D Fourier transform of its projection at angle $\theta$. Then
$$P_\theta(\omega)\;=\;F(\omega\cos\theta,\;\omega\sin\theta)\qquad(\omega\in\R).$$
The transform of a projection is the **slice** of the 2-D transform along the line through the origin at the same angle $\theta$.`,
      idea: String.raw`Rotate coordinates so the projection direction is the new $y$-axis, with $s$ along the new $x$: the projection integrates out $t$, $p_\theta(s)=\int f\,dt$. Its 1-D transform is $\int\!\int f\,e^{-2\pi i\omega s}\,dt\,ds$. But $e^{-2\pi i\omega s}$ is the 2-D Fourier kernel $e^{-2\pi i\mathbf k\cdot\mathbf r}$ evaluated at $\mathbf k=\omega(\cos\theta,\sin\theta)$, because $s=\mathbf r\cdot\hat n$ and it does not depend on $t$. The two integrals are the same integral (Fubini, rca-9.1); rotation of the plane rotates $F$ the same way.`,
      caption: String.raw`The left panel shows the object and the family of rays at angle $\theta$ (drag the **angle**). The middle panel is the magnitude of the exact 2-D Fourier transform; the gold line is the slice at the same angle. The right panel compares, as a function of $\omega$, the 1-D Fourier transform of the *measured, sampled* projection (computed by a discrete sum, solid) with the 2-D transform read off along the slice (dots). Reduce the number of **detector samples** or enlarge the object to see where the sampled projection stops agreeing.`,
      deps: ['imaging-3.2', 'rca-9.1'],
      tags: ['Fourier slice', 'projection'],
      refs: ['Kak–Slaney §3.2'],
      credit: 'R. N. Bracewell, 1956 (radio astronomy); in tomography Bracewell & Riddle 1967, and Kak & Slaney’s text',
      verify: true,
      scope: String.raw`Exact for integrable functions with compact support and continuous (not sampled) projections. The sampled projection agrees with the slice up to the Nyquist frequency of the detector, $1/(2\tau)$, and aliasing sets in beyond it. The 2-D transform here is the closed form for ellipses (Bessel $J_1$).`,
      viz(v) {
        const PH = slEllipses(0.9), OD = [[1, 0.35, 0.22, 0.25, -0.2, 30]];
        const obj = v.select('object', [{ value: 'ph', label: 'head phantom' }, { value: 'od', label: 'one off-centre ellipse' }], 'ph');
        const ang = v.slider('angle $\\theta$ (°)', 0, 180, 35, { step: 1, int: true });
        const nds = v.slider('detector samples', 12, 160, 120, { step: 1, int: true });
        const Wp = 90;
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Object and rays', minWidth: 230 });
        const F = v.stage({ x: [-14, 14], y: [-14, 14], equal: true, axes: 'box', gutter: true, height: 290, xlabel: '$k_x$ (cycles per unit)', ylabel: '$k_y$', title: '$|F(k_x,k_y)|$ (log) and the slice', minWidth: 250 });
        const G = v.stage({ x: [0, 14], y: [-0.5, 1], axes: 'box', gutter: true, height: 290, xlabel: '$\\omega$ (cycles per unit)', ylabel: 'transform (normalised)', title: 'Slice versus projection transform', minWidth: 250 });
        const cache = {};
        const getObj = () => {
          const k = obj.value;
          if (!cache[k]) {
            const E = k === 'ph' ? PH : OD;
            cache[k] = { E, img: raster((x, y) => ellAt(E, x, y), Wp, Wp, 2), f0: ellFT(E, 0, 0)[0] || 1 };
          }
          return cache[k];
        };
        let st = null;
        const P = (x) => ((x + 1) * Wp) / 2;
        v.render(() => {
          const O = getObj(), th = (ang.value * PI) / 180, c = Math.cos(th), sn = Math.sin(th), E = O.E;
          showImage(A, O.img, Wp, Wp, { lo: 0, hi: obj.value === 'ph' ? 1 : 1.2, id: 'o', extra: obj.value }); frame(A, Wp, Wp);
          for (let q = -9; q <= 9; q++) { const s = q * 0.1; A.segment([P(s * c + 1.2 * sn), P(s * sn - 1.2 * c)], [P(s * c - 1.2 * sn), P(s * sn + 1.2 * c)], { color: 'accent', width: 1, alpha: 0.4 }); }
          F.raster((kx, ky) => {
            const [re, im] = ellFT(E, kx, ky), m = Math.log10(1 + 400 * Math.hypot(re, im) / Math.abs(O.f0)) / 2.6;
            const cc = Math.round(255 * clamp(m, 0, 1)); return [cc, cc, cc];
          }, { res: 3, id: 'ft', key: obj.value });
          F.segment([-14 * c, -14 * sn], [14 * c, 14 * sn], { color: 'gold', width: 2.4 });
          // sampled projection
          const nd = nds.value, half = 1.5, tau = (2 * half) / nd;
          const s = Array.from({ length: nd }, (_, j) => -half + (j + 0.5) * tau), p = s.map((x) => ellProj(E, th, x));
          const om = Array.from({ length: 141 }, (_, i) => i * 0.1), re1 = [], im1 = [], re2 = [], im2 = [];
          let maxd = 0, nrm = Math.abs(O.f0);
          for (const w of om) {
            let a = 0, b = 0;
            for (let j = 0; j < nd; j++) { const ph = -2 * PI * w * s[j]; a += p[j] * Math.cos(ph) * tau; b += p[j] * Math.sin(ph) * tau; }
            const [fr, fi] = ellFT(E, w * c, w * sn);
            re1.push(a / nrm); im1.push(b / nrm); re2.push(fr / nrm); im2.push(fi / nrm);
            if (w < 1 / (2 * tau)) maxd = Math.max(maxd, Math.hypot(a - fr, b - fi) / nrm);
          }
          G.path(om.map((w, i) => [w, re1[i]]), { color: 'accent', width: 2.4 });
          G.path(om.map((w, i) => [w, im1[i]]), { color: 'orange', width: 2.4 });
          G.dots(om.filter((_, i) => i % 3 === 0).map((w, i) => [w, re2[i * 3]]), { r: 3, color: 'ink' });
          G.dots(om.filter((_, i) => i % 3 === 0).map((w, i) => [w, im2[i * 3]]), { r: 3, color: 'ink' });
          G.vline(1 / (2 * tau), { color: 'red', dash: true, width: 1.2 });
          G.text('Nyquist $1/2\\tau$', Math.min(13.8, 1 / (2 * tau)), 0.92, { size: 12, color: 'red', align: 'right', dx: -4 });
          st = { maxd, nyq: 1 / (2 * tau), nd };
        });
        v.legend([['accent', 'Re $P_\\theta(\\omega)$ (sampled projection)'], ['orange', 'Im $P_\\theta(\\omega)$'], ['ink', '$F$ on the slice (dots)', { dot: true }], ['gold', 'slice']]);
        v.readout(() => st ? `$P_\\theta(\\omega)$ is a discrete sum over ${st.nd} detector samples; $F(\\omega\\cos\\theta,\\omega\\sin\\theta)$ is the exact closed form. Largest difference below the Nyquist frequency ${fx(st.nyq, 1)}: $${fx(100 * st.maxd, 2)}\\%$ of $F(0)$.\nAt $\\omega=0$ both equal the total mass $\\iint f$ — the same for every angle.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Uniqueness of Radon inversion',
      statement: String.raw`If $f$ is an integrable function of compact support on the plane, then $f$ is determined (almost everywhere) by its Radon transform $\mathcal Rf(\theta,s)$ for $\theta\in[0,\pi)$: if $\mathcal Rf=\mathcal Rg$ then $f=g$ a.e. Explicitly, the Fourier slice theorem (3.4) gives $F$ on every line through the origin, i.e. everywhere, and the inverse Fourier transform recovers $f$:
$$f(x,y)=\int_0^{\pi}\!\!\int_{-\infty}^{\infty}P_\theta(\omega)\,e^{2\pi i\omega(x\cos\theta+y\sin\theta)}\,|\omega|\,d\omega\,d\theta .$$
The Jacobian $|\omega|$ is that of polar coordinates in the $(k_x,k_y)$ plane. If only a range of angles is known, $F$ is unknown in the missing wedge and the object is not determined.`,
      idea: String.raw`By 3.4 the data are the values of $F$ on all lines through the origin, which together cover the whole plane, so $F$ is known everywhere; by the uniqueness theorem for the Fourier transform (rca-9.12) two integrable functions with equal transforms agree a.e. The explicit formula is the 2-D inversion formula written in polar coordinates $\mathbf k=\omega(\cos\theta,\sin\theta)$ with $d k_xdk_y=|\omega|\,d\omega\,d\theta$ (change of variables, pma-10.9) — the factor $|\omega|$ is what the ramp filter implements in 3.7.`,
      caption: String.raw`The **left** panel is Fourier space: every projection fills one line (spoke) through the origin; the **right** reconstruction is the inverse FFT of the gridded spokes. Add **views** and the gaps close and the image sharpens towards the phantom; restrict the **angular range** to see what a missing wedge of data does — streaks and lost edges in exactly the directions that were not measured. The readout gives the error against the true phantom.`,
      deps: ['imaging-3.4', 'rca-9.12', 'pma-10.9'],
      tags: ['uniqueness', 'inversion', 'Fourier space'],
      refs: ['Kak–Slaney §3.2'],
      credit: 'J. Radon, 1917 (inversion); the Fourier route is Bracewell’s',
      verify: true,
      scope: String.raw`Complete angular data and ideal (noise-free, infinitely fine) sampling give exact recovery. Here 64 detector samples per view and a 64×64 grid are used, with polar-to-Cartesian interpolation (linear in radius and angle); the finite error that remains is interpolation and sampling, not a failure of uniqueness.`,
      viz(v) {
        const PH = slEllipses(0.88), N = 64, nd = 64, half = 1;
        const truth = raster((x, y) => ellAt(PH, x, y), N, N, 3);
        const Ks = v.stage({ x: [-16, 16], y: [-16, 16], equal: true, axes: 'box', gutter: true, height: 300, xlabel: '$k_x$', ylabel: '$k_y$', title: 'Fourier space filled by projections', minWidth: 240 });
        const Rc = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 300, title: 'Reconstruction (inverse FFT)', minWidth: 240 });
        const Tr = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 300, title: 'True phantom', minWidth: 240 });
        const nv = v.slider('number of views', 1, 120, 12, { step: 1, int: true });
        const rg = v.slider('angular range (°)', 20, 180, 180, { step: 1, int: true });
        const nR = 64, dw = 0.25; // radial samples of each spoke: omega = m*dw (Nyquist 16)
        let dkey = '';
        const sc = makeScan(1, nd, half);
        const recon = (n, range) => {
          const sino = new Float64Array(n * nd);
          for (let k = 0; k < n; k++) for (let j = 0; j < nd; j++) sino[k * nd + j] = ellProj(PH, (k * range * PI) / (n * 180), sc.sOf(j));
          return fourierRecon(fourierSpokes(sino, sc, n, nR, dw), range, N, nR, dw);
        };
        let cur = null;
        v.render(() => {
          const key = `${nv.value}|${rg.value}`;
          if (key !== dkey) { dkey = key; cur = recon(nv.value, rg.value); }
          const { out, mag } = cur;
          Ks.raster((kx, ky) => {
            const a = Math.round(kx / 0.5 + N / 2), b = Math.round(ky / 0.5 + N / 2);
            if (a < 0 || a >= N || b < 0 || b >= N) return null;
            const m = mag[b * N + a]; if (m < 0) return null;
            return grey(Math.log10(1 + 300 * m / 3) / 2.4);
          }, { res: 3, id: 'k', key });
          for (let k = 0; k < nv.value; k++) { const th = ((k * rg.value) / nv.value) * PI / 180; Ks.segment([-16 * Math.cos(th), -16 * Math.sin(th)], [16 * Math.cos(th), 16 * Math.sin(th)], { color: 'orange', width: 0.8, alpha: 0.25 }); }
          showImage(Rc, out, N, N, { lo: -0.05, hi: 1.05, id: 'r', smooth: true, extra: key }); frame(Rc, N, N);
          showImage(Tr, truth, N, N, { lo: -0.05, hi: 1.05, id: 't', smooth: true }); frame(Tr, N, N);
        });
        v.legend([['orange', 'projection directions']]);
        v.readout(() => cur ? `${nv.value} views over ${rg.value}°: RMS error against the phantom $${fx(rmse(cur.out, truth), 4)}$ (phantom RMS $${fx(rms(truth), 3)}$), i.e. $${fx(100 * rmse(cur.out, truth) / rms(truth), 1)}\\%$.\n${rg.value >= 179.5 ? 'All directions are measured: the Fourier plane is covered by spokes (left), $F$ is known up to the gaps between them, and the object follows. More views close the gaps.' : `Only ${rg.value}° of the 180° of directions are measured: the empty wedge of Fourier space (and nothing fills it, apart from the mirror wedge given by $F(-k)=\\overline{F(k)}$) removes the detail whose edges lie across that wedge.`}` : '');
      },
    },
  ],
};
