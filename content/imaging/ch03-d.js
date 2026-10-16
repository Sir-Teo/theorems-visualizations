// Medical Imaging — Chapter 3 (part 4): 3.15 Feldkamp cone-beam reconstruction, 3.16 Fourier diffraction theorem,
// 3.17 Cormack 1963 (paper), 3.18 Hounsfield 1973 (paper).
import {
  clamp, fx, mean, sd, showImage, frame, raster, ellAt, ellProj, ellFT, slEllipses, makeScan, sinoEll, fbp, fbpAt, fft2d, rmse, rms,
  ellipsoidAt, fdk, rng32, gauss, noiseField, poissonFrom, MATS, mu,
} from './ch03.shared.js';

const PI = Math.PI;
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

export default {
  collection: 'imaging',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Algorithm',
      name: 'Cone-beam reconstruction (Feldkamp)',
      statement: String.raw`In cone-beam CT a point source and a flat 2-D detector rotate on a circle around the object, so each view samples a whole cone of rays. The **Feldkamp–Davis–Kress (FDK) algorithm** treats each detector row as a fan-beam projection: (i) weight the data $P(u,v)$ by $D/\sqrt{D^2+u^2+v^2}$ ($D$ = source–axis distance, $(u,v)$ detector coordinates scaled to the axis); (ii) apply the ramp filter along $u$; (iii) back-project into the volume with the distance weight $D^2/(D-t)^2$, where $t$ is the voxel's coordinate along the central ray. In the plane of the circle ($v=0$) this is exactly fan-beam FBP and is exact; away from it the result is approximate, with errors that grow with the cone angle, because the circular orbit does not satisfy Tuy's data-sufficiency condition (every plane through the object must meet the orbit).`,
      idea: String.raw`FDK is the fan-beam formula (imaging-3.9) applied row by row with the extra obliquity weight that accounts for each ray's tilt out of the mid-plane, and with the back-projection geometry in 3-D. It reduces exactly to 3.9 on the central plane, and for objects that vary slowly in $z$ the error is second order in the cone angle. For objects with fine $z$-structure, the missing data (a circle gives for an off-plane point only planes through the source circle's tangents) produce intensity drop and distortion away from mid-plane.`,
      caption: String.raw`The phantom is a stack of thin discs (a Defrise-type test object, which has strong $z$-variation). Drag **source distance** $D$: with a large $D$ the cone is narrow and the whole stack is recovered; with a small $D$ the off-centre discs lose intensity and blur into each other. The coronal slices (truth left, FDK right), the axial slice at the chosen $z$ and the error-versus-height plot (peak at the outer discs) show where the algorithm fails; the mid-plane error stays low.`,
      deps: ['imaging-3.9'],
      tags: ['cone beam', 'FDK', 'Tuy condition'],
      refs: ['Kak–Slaney §3.6'],
      credit: 'L. A. Feldkamp, L. C. Davis & J. W. Kress, 1984',
      scope: String.raw`Circular orbit, flat detector, noise-free exact ellipsoid line integrals; 40³ voxels, 90 views, 56×56 detector elements. Larger errors in this coarse grid include discretisation of the thin discs (thickness about 3 voxels). The data-sufficiency condition is Tuy's (1983); a helical or dual-circle orbit satisfies it.`,
      viz(v) {
        const N = 40;
        const slabs = [-0.6, -0.3, 0, 0.3, 0.6].map((z) => [1, 0.62, 0.62, 0.09, 0, 0, z]);
        const Dsl = v.slider('source–axis distance $D$', 2.2, 16, 4, { log: true, sig: 2 });
        const zs = v.slider('axial slice height $z$', -0.9, 0.9, 0.3, { step: 0.05 });
        const mk = (t, w = 200) => v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 240, title: t, minWidth: w });
        const Ct = mk('Coronal slice $y=0$: truth', 170), Cr = mk('Coronal slice: FDK', 170), Ax = mk('Axial slice: FDK at $z$', 170);
        const Er = v.stage({ x: [-1, 1], y: [0, 0.4], axes: 'box', gutter: true, height: 240, xlabel: 'height $z$', ylabel: 'RMS error of the slice', title: 'Error against height', minWidth: 220 });
        const truthAt = (z) => raster((x, y) => ellipsoidAt(slabs, x, y, z), N, N, 1);
        const cor = new Float64Array(N * N);
        for (let k = 0; k < N; k++) { const z = -1 + ((k + 0.5) * 2) / N; for (let i = 0; i < N; i++) cor[(N - 1 - k) * N + i] = ellipsoidAt(slabs, -1 + ((i + 0.5) * 2) / N, 0.0001, z); }
        const cache = new Map(), truths = Array.from({ length: N }, (_, k) => truthAt(-1 + ((k + 0.5) * 2) / N));
        const get = (D) => {
          const key = D.toFixed(2); if (cache.has(key)) return cache.get(key);
          const { slices, out } = fdk(slabs, D, 90, 56, 56, 1.2, N);
          const rec = new Float64Array(N * N);
          for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) rec[(N - 1 - k) * N + i] = out[k][(N / 2 - 1) * N + i] * 0.5 + out[k][(N / 2) * N + i] * 0.5;
          const err = out.map((o, k) => rmse(o, truths[k]));
          const R = { slices, out, rec, err }; if (cache.size > 6) cache.clear(); cache.set(key, R); return R;
        };
        let st = null;
        v.render(() => {
          const D = Dsl.value, R = get(D), z = zs.value, k = clamp(Math.floor(((z + 1) / 2) * N), 0, N - 1);
          showImage(Ct, cor, N, N, { lo: -0.1, hi: 1.1, id: 'ct' }); frame(Ct, N, N);
          showImage(Cr, R.rec, N, N, { lo: -0.1, hi: 1.1, id: 'cr', extra: D.toFixed(2) }); frame(Cr, N, N);
          Cr.hline(((z + 1) / 2) * N, { color: 'gold', width: 1.5 }); Ct.hline(((z + 1) / 2) * N, { color: 'gold', width: 1.5 });
          showImage(Ax, R.out[k], N, N, { lo: -0.1, hi: 1.1, id: 'ax', extra: `${D.toFixed(2)}|${k}` }); frame(Ax, N, N);
          const zsx = R.slices; Er.path(zsx.map((q, i) => [q, R.err[i]]), { color: 'accent', width: 2.4 });
          Er.vline(z, { color: 'gold', dash: true, width: 1.4 }); Er.dot(z, R.err[k], { r: 6, color: 'gold' });
          Er.setView([-1, 1], [0, Math.max(0.2, ...R.err) * 1.1]);
          st = { D, ang: (Math.atan(0.6 / D) * 180) / PI, e0: R.err[N / 2], eo: R.err[k], z, mid: R.out[Math.floor(N / 2)][(N / 2) * N + N / 2], top: R.out[Math.floor(((0.6 + 1) / 2) * N)][(N / 2) * N + N / 2] };
        });
        v.legend([['accent', 'error per axial slice'], ['gold', 'chosen $z$']]);
        v.readout(() => st ? `$D=${fx(st.D, 1)}$: the outermost disc (at $z=0.6$) is seen at a half-cone angle of about $${fx(st.ang, 1)}^\\circ$ from the mid-plane. Value reconstructed at the centre of the mid-plane disc $${fx(st.mid, 2)}$ and of the outermost disc (z = 0.6) $${fx(st.top, 2)}$ (truth 1).\nSlice RMS error at the mid-plane $${fx(st.e0, 3)}$; at $z=${fx(st.z, 2)}$: $${fx(st.eo, 3)}$.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Theorem',
      name: 'Fourier diffraction theorem',
      statement: String.raw`Let a plane wave $e^{2\pi i\mathbf k_{\rm in}\cdot\mathbf r}$, $|\mathbf k_{\rm in}|=k_0=1/\lambda$, illuminate a weakly scattering object with contrast $o(\mathbf r)$, so that the first Born (or Rytov) approximation holds. The field scattered into direction $\mathbf k_s=k_0\hat{\mathbf s}$ on the far side is proportional to the object's Fourier transform at the **difference vector**:
$$u_s(\hat{\mathbf s})\;\propto\;F\big(\mathbf k_s-\mathbf k_{\rm in}\big),\qquad F(\mathbf K)=\int o(\mathbf r)\,e^{-2\pi i\mathbf K\cdot\mathbf r}\,d\mathbf r .$$
As $\hat{\mathbf s}$ runs over the directions in the half-plane facing forward, $\mathbf K$ runs over a **semicircle** of radius $k_0$ passing through the origin; rotating the illumination rotates the semicircle about the origin, and a full turn of illumination fills the disc of radius $\sqrt2\,k_0$. In the limit $k_0\to\infty$ the arcs flatten into straight lines through the origin: the Fourier slice theorem (imaging-3.4).`,
      idea: String.raw`In the Born approximation the scattered far field is the sum of single-scattering events: every object element radiates with the phase it received from the incident wave, $e^{2\pi i\mathbf k_{\rm in}\cdot\mathbf r}$, and reaches the detector with the phase $e^{-2\pi i\mathbf k_s\cdot\mathbf r}$ — so the sum is exactly the Fourier integral at $\mathbf K=\mathbf k_s-\mathbf k_{\rm in}$. The constraint $|\mathbf k_s|=|\mathbf k_{\rm in}|=k_0$ (elastic scattering, Ewald-sphere construction in 2-D) confines $\mathbf K$ to a circle. Unlike X-rays, which see lines, waves of finite wavelength see arcs, and the resolution is limited to about $1/(\sqrt2k_0)$, i.e. a fraction of the wavelength (imaging-1.9).`,
      caption: String.raw`Left: the object, the incident plane wave (its wavefronts are spaced by the wavelength) and the forward scattering directions; drag **incident direction** $\varphi$. Middle: Fourier space with the exact $|F|$ as background; the gold arc is the data obtained for the chosen $\varphi$, the other arcs for the other illumination angles you set; the circle is the limit $\sqrt2k_0$. Right: the object recovered by inverse FFT of the gridded arcs. Switch to **straight rays** (the $k_0\to\infty$ limit) to compare with the slice theorem; lower the **wavenumber** $k_0$ (longer wavelength) and the picture blurs.`,
      deps: ['imaging-3.4'],
      tags: ['diffraction tomography', 'Born approximation', 'Ewald circle'],
      refs: ['Kak–Slaney §6.3'],
      credit: 'E. Wolf, 1969 (inverse scattering); Mueller, Kaveh & Wade, 1979 (reconstruction)',
      verify: true,
      scope: String.raw`Weak scattering only (first Born or Rytov approximation, objects whose phase shift across their size is small); 2-D, far field, transmission mode (scattering in forward half-plane); the scattered amplitude is taken as the exact Fourier transform of the phantom at $\mathbf K$ (the theorem itself), not simulated by solving the wave equation. Reflection mode and near-field propagation corrections are not shown.`,
      viz(v) {
        const PH = slEllipses(0.9), N = 64, Wp = 80;
        const mode = v.select('data', [{ value: 'wave', label: 'waves: arcs' }, { value: 'ray', label: 'straight rays (k₀ → ∞)' }], 'wave');
        const k0 = v.slider('wavenumber $k_0=1/\\lambda$ (cycles per unit)', 3, 14, 8, { step: 0.5 });
        const na = v.slider('number of illumination angles', 4, 120, 48, { step: 1, int: true });
        const rng = v.slider('illumination range (°)', 60, 360, 360, { step: 10, int: true });
        const ph = v.slider('incident direction $\\varphi$ (°)', 0, 359, 30, { step: 1, int: true });
        const A = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 270, title: 'Object and incident wave', minWidth: 220 });
        const Fk = v.stage({ x: [-16, 16], y: [-16, 16], equal: true, axes: 'box', gutter: true, height: 270, xlabel: '$K_x$', ylabel: '$K_y$', title: 'Fourier space: where the data lie', minWidth: 230 });
        const Rc = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 270, title: 'Reconstruction from the arcs', minWidth: 220 });
        const arcPts = (phi, k, m, np = 48) => {
          const out = [];
          for (let i = 0; i < np; i++) {
            if (m === 'wave') { const psi = phi - PI / 2 + ((i + 0.5) / np) * PI; out.push([k * (Math.cos(psi) - Math.cos(phi)), k * (Math.sin(psi) - Math.sin(phi))]); }
            else { const t = (-1 + ((i + 0.5) / np) * 2) * Math.SQRT2 * k; out.push([-t * Math.sin(phi), t * Math.cos(phi)]); }
          }
          return out;
        };
        let cur = null, ck = '';
        const build = () => {
          const key = `${mode.value}|${k0.value}|${na.value}|${rng.value}`; if (key === ck) return; ck = key;
          const sum = new Float64Array(N * N * 2), cnt = new Float64Array(N * N); let used = 0;
          for (let a = 0; a < na.value; a++) {
            const phi = (((a + 0.5) * rng.value) / na.value) * PI / 180;
            for (const [kx, ky] of arcPts(phi, k0.value, mode.value, 64)) {
              const ia = Math.round(kx / 0.5) + N / 2, ib = Math.round(ky / 0.5) + N / 2; if (ia < 0 || ia >= N || ib < 0 || ib >= N) continue;
              const [fr, fi] = ellFT(PH, ia * 0.5 - N / 4, ib * 0.5 - N / 4); // value at the cell centre (data snapped to the grid)
              sum[(ib * N + ia) * 2] += fr; sum[(ib * N + ia) * 2 + 1] += fi; cnt[ib * N + ia]++; used++;
            }
          }
          const F = new Float64Array(N * N * 2), have = new Uint8Array(N * N); let cells = 0;
          for (let i = 0; i < N * N; i++) if (cnt[i] > 0) { F[2 * i] = sum[2 * i] / cnt[i]; F[2 * i + 1] = sum[2 * i + 1] / cnt[i]; have[i] = 1; cells++; }
          const rcov = Math.SQRT2 * k0.value;
          let disc = 0;
          for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) if (Math.hypot((a - N / 2) * 0.5, (b - N / 2) * 0.5) <= rcov) disc++;
          // fill small holes inside the covered region from filled neighbours (3 passes), only when illumination is a full turn
          const filled = Uint8Array.from(have), G = Float64Array.from(F);
          for (let pass = 0; pass < 3; pass++) {
            const add = [];
            for (let b = 1; b < N - 1; b++) for (let a = 1; a < N - 1; a++) {
              const i = b * N + a; if (filled[i] || Math.hypot((a - N / 2) * 0.5, (b - N / 2) * 0.5) > rcov) continue;
              let sr = 0, si = 0, c = 0;
              for (let db = -1; db <= 1; db++) for (let da = -1; da <= 1; da++) { const j = (b + db) * N + a + da; if (filled[j]) { sr += G[2 * j]; si += G[2 * j + 1]; c++; } }
              if (c >= 3) add.push([i, sr / c, si / c]);
            }
            for (const [i, r, s2] of add) { G[2 * i] = r; G[2 * i + 1] = s2; filled[i] = 1; }
          }
          const re = new Float64Array(N * N), im = new Float64Array(N * N);
          for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
            const i = b * N + a; if (!filled[i]) continue;
            const kx = (a - N / 2) * 0.5, ky = (b - N / 2) * 0.5, q = (-2 * PI + (2 * PI) / N) * (kx + ky), cr = Math.cos(q), ci = Math.sin(q);
            re[i] = G[2 * i] * cr - G[2 * i + 1] * ci; im[i] = G[2 * i] * ci + G[2 * i + 1] * cr;
          }
          fft2d(re, im, N, N, true);
          const out = new Float64Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) out[(N - 1 - j) * N + i] = ((i + j) % 2 ? -1 : 1) * re[j * N + i] * N * N * 0.25;
          // truth at the same grid for the error
          const truth = raster((x, y) => ellAt(PH, x, y), N, N, 2);
          cur = { out, have, filled, cells, disc, used, err: rmse(out, truth), key };
        };
        let st = null;
        v.render(() => {
          build();
          const phi = (ph.value * PI) / 180, k = k0.value;
          A.raster((x, y) => { const c = Math.round(255 * clamp(ellAt(PH, x, y), 0, 1)); return Math.abs(x) < 1 && Math.abs(y) < 1 ? [c, c, c] : null; }, { res: 2, id: 'o', key: 'o' });
          A.rect(-1, -1, 1, 1, { color: 'muted', width: 1 });
          const wl = 1 / k, cx = Math.cos(phi), sy = Math.sin(phi);
          for (let q = -12; q <= 12; q++) { const d = q * wl; if (Math.abs(d) > 1.25) continue; A.segment([d * cx + 1.3 * sy, d * sy - 1.3 * cx], [d * cx - 1.3 * sy, d * sy + 1.3 * cx], { color: 'orange', width: 1, alpha: 0.5 }); }
          A.arrow(-1.2 * cx, -1.2 * sy, -1.2 * cx + 0.5 * cx, -1.2 * sy + 0.5 * sy, { color: 'orange', width: 2.4 });
          A.text('$\\mathbf k_{\\rm in}$', -1.2 * cx + 0.6 * cx, -1.2 * sy + 0.6 * sy + 0.1, { color: 'orange', size: 13 });
          for (let i = 0; i <= 8; i++) { const psi = phi - PI / 2 + (i / 8) * PI; A.arrow(1.0 * cx * 0.0 + 0.0, 0, 1.25 * Math.cos(psi), 1.25 * Math.sin(psi), { color: 'green', width: 1.2, alpha: 0.55 }); }
          Fk.raster((kx, ky) => { const [re, im] = ellFT(PH, kx, ky), m = Math.log10(1 + 400 * Math.hypot(re, im) / 1.0) / 3.0; const c = Math.round(255 * clamp(m, 0, 1) * 0.55); return [c, c, c]; }, { res: 3, id: 'fbg', key: 'bg' });
          Fk.circle(0, 0, Math.SQRT2 * k, { color: 'red', width: 1.2, dash: true });
          for (let a = 0; a < na.value; a++) { const p = (((a + 0.5) * rng.value) / na.value) * PI / 180, pts = arcPts(p, k, mode.value, 40); Fk.path(pts, { color: 'accent', width: 0.8, alpha: 0.35 }); }
          Fk.path(arcPts(phi, k, mode.value, 80), { color: 'gold', width: 3 });
          showImage(Rc, cur.out, N, N, { lo: -0.05, hi: 1.05, id: 'rc', extra: cur.key, smooth: true }); frame(Rc, N, N);
          st = { cov: cur.cells / cur.disc, err: cur.err, k };
        });
        v.legend([['gold', 'data for this illumination'], ['accent', 'other illuminations'], ['red', 'radius $\\sqrt2k_0$', { dash: true }], ['orange', 'incident wave'], ['green', 'scattering directions']]);
        v.readout(() => st ? `$k_0=${fx(st.k, 1)}$ (wavelength $\\lambda=${fx(1 / st.k, 3)}$ in units where the head is 1.8 wide): the arcs reach radius $\\sqrt2k_0=${fx(Math.SQRT2 * st.k, 1)}$, giving a nominal resolution of $1/(\\sqrt2k_0)=${fx(1 / (Math.SQRT2 * st.k), 3)}$.\nCells of the Fourier grid hit by data: ${fx(100 * st.cov, 0)}% of the disc; RMS error of the reconstruction against the phantom $${fx(st.err, 3)}$. ${mode.value === 'ray' ? 'Straight rays: the lines of 3.4/3.5, which cover the plane evenly.' : 'With waves the arcs cross the origin tangentially to the lines but curve away: more illumination angles are needed to cover the same disc.'}` : '');
      },
    },

    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Paper',
      name: 'Representation of a Function by Its Line Integrals',
      paper: {
        authors: 'A. M. Cormack', year: 1963, title: 'Representation of a Function by Its Line Integrals, with Some Radiological Applications',
        venue: 'Journal of Applied Physics 34 (9): 2722–2727', doi: '10.1063/1.1729798',
      },
      introduces: ['imaging-3.1'],
      statement: String.raw`Cormack showed how the distribution of attenuation coefficient in a plane section of the body can be computed from the transmission measurements of narrow beams along many lines through it, i.e. from its line integrals, and gave explicit inversion formulae: for a circularly symmetric function an Abel-type integral equation, and for the general case expansions of the function and of its line integrals in angular Fourier series (with radial functions that are Chebyshev-like), which he argued suit noisy data. The radiological motivation was to see density differences that ordinary radiographs, which superimpose all depths, cannot resolve, and to plan radiotherapy. He and a student tested the idea with a narrow Co-60 gamma-ray beam on a phantom without circular symmetry — an aluminium ring ("skull"), Lucite ("soft tissue") and two aluminium discs ("tumours") — and recovered the attenuation coefficient along a line to good agreement (according to his 1979 Nobel lecture).`,
      idea: String.raw`Before 1963 the inversion of the Radon transform (imaging-3.2) was known to mathematicians (Radon, 1917) but not to radiologists or applied physicists, and in 1957 Cormack had worked out the circularly symmetric case for a radiotherapy problem; he went on to the non-symmetric case with Fourier expansions, solved the resulting integral equations in terms of orthogonal polynomials, and was concerned with noise from the limited counts of gamma rays. His series method is not the filtered back-projection used today (3.7), but solves the same problem and uses the same line integrals (3.1). The paper drew almost no response at the time; its relevance became clear after Hounsfield's scanner (3.18).`,
      caption: String.raw`A schematic of Cormack's test object — aluminium ring, Lucite interior, two aluminium discs — scanned with a narrow beam at many positions and angles; the Poisson noise comes from the number of **counts per ray** you set. The middle panel is the reconstruction (by filtered back-projection, not Cormack's series); the right panel plots the attenuation coefficient along the line from the centre O through a disc to the ring A: true (line) against reconstructed (dots), like his published graph. The readout compares the aluminium/Lucite ratio with the value Cormack quoted and with the modern tabulated one.`,
      deps: ['imaging-2.3'],
      tags: ['Cormack', 'line integrals', 'history'],
      refs: [],
      credit: 'A. M. Cormack, 1963 (Nobel Prize in Physiology or Medicine 1979, shared with G. N. Hounsfield)',
      links: { nobel: 'https://www.nobelprize.org/prizes/medicine/1979/cormack/lecture/' },
      verify: true,
      scope: String.raw`Schematic reconstruction of the experiment as described in Cormack's Nobel lecture: the dimensions, counts, step sizes and the exact phantom are not from the paper (they are not reproduced here); the attenuation coefficients are computed from NIST tables at the Co-60 mean energy of 1.25 MeV (Al $0.05496\ \mathrm{cm^2/g}\times2.699\ \mathrm{g/cm^3}$; PMMA $0.06143\times1.19$). Whether the experimental test appears in the 1963 paper itself or in its 1964 sequel is not confirmed here. Reconstruction by FBP; Cormack's own method was a series expansion.`,
      viz(v) {
        const MUL = 0.06143 * 1.19, ratio0 = (0.05496 * 2.699) / MUL, SCALE = 5; // cm per unit (schematic: phantom radius 5 cm)
        const nd = 100, Wp = 80;
        const rat = v.slider('μ(aluminium) / μ(Lucite)', 1.2, 3.5, ratio0, { step: 0.01 });
        const I0 = v.slider('counts per ray', 300, 1e6, 20000, { log: true, sig: 2 });
        const nAs = v.slider('number of angles (over 180°)', 6, 90, 36, { step: 1, int: true });
        const A = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 280, title: 'Phantom (schematic)', minWidth: 220 });
        const B = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 280, title: 'Reconstruction', minWidth: 220 });
        const C = v.stage({ x: [0, 1], y: [0, 0.2], axes: 'box', gutter: true, height: 280, xlabel: 'distance from O along OA (fraction of radius)', ylabel: '$\\mu$ (cm⁻¹)', title: 'Attenuation along OA', minWidth: 260 });
        const sc0 = makeScan(90, nd, 1.2), r = rng32(9), { u: U, z: Z } = noiseField(v.M, r, 90 * nd);
        const phE = (ra) => { const mA = MUL * ra; return [[mA, 0.92, 0.92, 0, 0, 0], [MUL - mA, 0.8, 0.8, 0, 0, 0], [mA - MUL, 0.15, 0.15, 0.45, 0, 0], [mA - MUL, 0.15, 0.15, -0.3, -0.35, 0]]; };
        let res = null, rk = '';
        v.render(() => {
          const k = `${rat.value}|${Math.round(I0.value)}|${nAs.value}`;
          if (k !== rk) {
            rk = k; const E = phE(rat.value), nA = nAs.value, sc = makeScan(nA, nd, 1.2);
            const sino = new Float64Array(nA * nd);
            for (let a = 0; a < nA; a++) for (let j = 0; j < nd; j++) {
              const p = SCALE * ellProj(E, sc.th[a], sc.sOf(j)), idx = Math.min(89, Math.floor((a / nA) * 90)) * nd + j;
              const N = poissonFrom(Math.round(I0.value) * Math.exp(-p), U[idx], Z[idx]); sino[a * nd + j] = -Math.log(Math.max(N, 0.5) / Math.round(I0.value));
            }
            const img = fbp(sino, sc, Wp, Wp, 'shepp').map((x) => x / SCALE), pts = lin(0, 1, 60).map((t) => [t * 0.98, 0]);
            res = { E, img, sc, sino };
          }
          const E = res.E;
          A.raster((x, y) => { const m = ellAt(E, x, y); return Math.hypot(x, y) < 0.921 ? (() => { const c = Math.round(255 * clamp(m / (MUL * rat.value), 0, 1) * 0.9 + 12); return [c, c, c]; })() : null; }, { res: 2, id: 'ph', key: k });
          A.line(0, 0, 0.98, 0, { color: 'gold', width: 2 }); A.text('O', -0.05, 0.08, { color: 'gold', size: 13 }); A.text('A', 1.0, 0.08, { color: 'gold', size: 13 });
          showImage(B, res.img, Wp, Wp, { lo: -0.02, hi: MUL * rat.value * 1.1, id: 'rc', extra: k, smooth: true }); frame(B, Wp, Wp);
          C.setView([0, 1], [-0.02, MUL * rat.value * 1.25]);
          C.fn((t) => ellAt(E, t * 0.98, 0), { color: 'ink', width: 2.2, n: 400 });
          const xs = lin(0.01, 0.97, 48);
          const val = (t) => { const px = ((t + 1) / 2) * Wp - 0.5, py = Wp / 2 - 0.5 + 0.0; const i = Math.floor(px), a = px - i; const row = Math.floor(py); const g = (ii, jj) => res.img[jj * Wp + ii]; return (1 - a) * ((g(i, row) + g(i, row + 1)) / 2) + a * ((g(i + 1, row) + g(i + 1, row + 1)) / 2); };
          C.dots(xs.map((t) => [t, val(t * 0.98)]), { r: 3, color: 'accent' });
          // statistics
          const cA = ((0.45 + 1) / 2) * Wp, cell = (xx, yy) => res.img[Math.floor(Wp - yy) * Wp + Math.floor(xx)];
          const al = mean([cell(cA, Wp / 2), cell(cA - 1, Wp / 2), cell(cA + 1, Wp / 2), cell(cA, Wp / 2 + 1), cell(cA, Wp / 2 - 1)]), lu = mean([cell(Wp / 2 + 3, Wp / 2 + 6), cell(Wp / 2 + 5, Wp / 2 + 8), cell(Wp / 2 - 4, Wp / 2 + 10), cell(Wp / 2 + 8, Wp / 2 + 12)]);
          const prof = xs.map((t) => val(t * 0.98)), tru = xs.map((t) => ellAt(E, t * 0.98, 0));
          res.stat = { al, lu, e: rmse(prof, tru) / (MUL * rat.value) };
        });
        v.legend([['ink', 'true $\\mu$ along OA'], ['accent', 'reconstructed', { dot: true }], ['gold', 'line OA']]);
        v.readout(() => res && res.stat ? `Reconstructed $\\mu$ in the disc ${fx(res.stat.al, 3)} cm$^{-1}$ and in the Lucite ${fx(res.stat.lu, 3)} cm$^{-1}$: ratio ${fx(res.stat.al / res.stat.lu, 2)} (set ${fx(rat.value, 2)}); RMS deviation along OA $${fx(100 * res.stat.e, 1)}\\%$ of the aluminium value.\nCormack's 1979 recollection: the ratio of aluminium to Lucite was “about 3”; NIST tables at 1.25 MeV give $0.1483/0.0731\\approx${fx(ratio0, 2)}$ (default setting). The phantom size and counts here are illustrative.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Paper',
      name: 'Computerized Transverse Axial Scanning (Tomography): Part 1',
      paper: {
        authors: 'G. N. Hounsfield', year: 1973, title: 'Computerized transverse axial scanning (tomography): Part 1. Description of system',
        venue: 'British Journal of Radiology 46 (552): 1016–1022', doi: '10.1259/0007-1285-46-552-1016',
      },
      introduces: ['imaging-3.13'],
      statement: String.raw`Hounsfield described a scanner in which a narrow X-ray beam and detector traverse a slice of the head, take a row of transmission readings, then rotate by a small step and repeat; a computer reconstructs the absorption in a matrix of small elements from the whole set of readings and displays it as a picture, together with numerical values relative to water. Because the readings are digitised and used quantitatively, the system distinguishes tissues whose X-ray absorption differs by only about a per cent — grey and white matter, blood clot, cerebrospinal fluid — which a radiograph, where the shadow of bone and of the depth superimpose, cannot show. (Parameters of the first scanner — about $80\times80$ picture elements and of the order of $160$ readings at each of $180$ one-degree steps — are as commonly reported and are marked unverified.)`,
      idea: String.raw`Cormack's mathematics (3.17) had remained unread by engineers; Hounsfield, at EMI, arrived at a reconstruction from projections independently, first with a gamma-ray laboratory machine (28,000 measurements, nine days per picture by his Nobel lecture's account), then with an X-ray tube (nine hours), a human brain specimen and finally the Atkinson Morley's Hospital prototype (first patient 1972). He reckoned the method would be about two orders of magnitude more sensitive than conventional radiography because all measurements contribute to every element of the slice. The picture elements are computed by an iterative algebraic reconstruction (see 3.11) in the original machine, and the numbers expressed relative to water became the scale named after him (3.13).`,
      caption: String.raw`A head slice with the soft-tissue contrasts of today's HU values (grey matter ≈ 40, white matter ≈ 25, CSF ≈ 10, a fresh clot ≈ 65) is scanned on an 80×80 grid with a pencil beam: the slider adds **views** (one-degree steps, so the picture is incomplete until the half turn) and **photons per reading** sets the noise. Narrow the **window** around brain values and the tissues separate; the third panel shows a single radiograph-style projection, whose clot signal is lost under the bone and the long path of brain.`,
      deps: ['imaging-3.11', 'imaging-3.1'],
      tags: ['EMI scanner', 'Hounsfield', 'history'],
      refs: [],
      credit: 'G. N. Hounsfield, 1973 (Nobel Prize in Physiology or Medicine 1979, shared with A. M. Cormack)',
      links: { nobel: 'https://www.nobelprize.org/prizes/medicine/1979/hounsfield/lecture/' },
      verify: true,
      scope: String.raw`A reconstruction in the spirit of the paper, not its data: the head phantom, the HU values (modern textbook numbers; the paper used its own EMI scale), the photon counts and the reconstruction method (filtered back-projection here, an iterative method in the original) are modelled. Scanner parameters (80×80 matrix, 160 readings × 180°) are reported by secondary sources; I did not verify them against the paper itself.`,
      viz(v) {
        const NP = 80, nd = 160, nA = 180;
        // painter's list [HU, a, b, cx, cy, rot°]
        const PAINT = [[40, 0.95, 0.78, 0, 0, 0], [900, 0.9, 0.73, 0, 0, 0], [10, 0.84, 0.67, 0, 0, 0], [40, 0.82, 0.65, 0, 0, 0], [26, 0.62, 0.46, 0, 0, 0],
          [10, 0.14, 0.32, -0.16, 0.08, -12], [10, 0.14, 0.32, 0.16, 0.08, 12], [65, 0.12, 0.1, 0.38, -0.2, 20], [10, 0.05, 0.05, 0, -0.22, 0]];
        const huAt = (x, y) => { let val = -1000; for (const [h, a, b, cx, cy, ro] of PAINT) { const t = (ro * PI) / 180, dx = x - cx, dy = y - cy, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t); if ((u / a) ** 2 + (w / b) ** 2 <= 1) val = h; } return val; };
        // additive ellipse list (μ/μ_water) for the exact sinogram: each layer minus what lies under its centre
        const E2 = [];
        PAINT.forEach(([h, a, b, cx, cy, ro], i) => {
          let under = 0; for (let j = 0; j < i; j++) { const [h2, a2, b2, cx2, cy2, ro2] = PAINT[j]; const t = (ro2 * PI) / 180, dx = cx - cx2, dy = cy - cy2, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t); if ((u / a2) ** 2 + (w / b2) ** 2 <= 1) under = 1 + h2 / 1000; }
          E2.push([1 + h / 1000 - under, a, b, cx, cy, ro]);
        });
        const KAP = 2.0, sc = makeScan(nA, nd, 1.0), sinoC = sinoEll(E2, sc).map((x) => x * KAP);
        const r = rng32(3), { u: U, z: Z } = noiseField(v.M, r, nA * nd);
        const truthHU = raster((x, y) => { const h = huAt(x, y); return h; }, NP, NP, 1);
        const A = v.stage({ x: [0, NP], y: [0, NP], equal: true, axes: false, height: 290, title: 'Reconstruction (80 × 80)', minWidth: 230 });
        const S = v.stage({ x: [0, 180], y: [-1, 1], axes: 'box', gutter: true, height: 290, xlabel: 'step (1° each)', ylabel: 'beam position $s$', title: 'Readings so far', minWidth: 230, xticks: [0, 60, 120, 180] });
        const R = v.stage({ x: [-1, 1], y: [0, 7], axes: 'box', gutter: true, height: 290, xlabel: 'beam position $s$', ylabel: 'log-attenuation $p$', title: 'One projection: the clot is invisible', minWidth: 230 });
        const nv = v.slider('views acquired (1° steps)', 10, 180, 180, { step: 1, int: true });
        const ph = v.slider('photons per reading', 1e3, 1e8, 1e6, { log: true, sig: 2 });
        const lev = v.slider('window level (HU)', 0, 60, 30, { step: 1, int: true }), wid = v.slider('window width (HU)', 10, 400, 80, { step: 1, int: true });
        let res = null, key = '';
        v.render(() => {
          const I0 = Math.round(ph.value), n = nv.value, k = `${I0}|${n}`;
          if (k !== key) {
            key = k; const noisy = new Float64Array(sinoC.length);
            for (let i = 0; i < sinoC.length; i++) noisy[i] = -Math.log(Math.max(poissonFrom(I0 * Math.exp(-sinoC[i]), U[i], Z[i]), 0.5) / I0);
            const nz = noisy.map((x, i) => x - sinoC[i]);
            // use only the first n views of the half turn: zero the rest
            const part = Float64Array.from(noisy, (x, i) => (Math.floor(i / nd) < n ? x : 0));
            const img = fbp(part, sc, NP, NP, 'shepp').map((x) => 1000 * (x / KAP - 1));
            res = { img, noisy, nz };
          }
          const lo = lev.value - wid.value / 2, hi = lev.value + wid.value / 2;
          showImage(A, res.img, NP, NP, { lo, hi, id: 'h', extra: `${key}|${lo}|${hi}`, smooth: true }); frame(A, NP, NP);
          S.raster((a, s) => { const kk = Math.min(nA - 1, Math.floor(a)), j = Math.floor((s + 1) / sc.tau); if (kk >= n || j < 0 || j >= nd) return null; const c = Math.round(255 * clamp(res.noisy[kk * nd + j] / 6, 0, 1)); return [c, c, c]; }, { res: 2, id: 'sg', key });
          S.vline(n, { color: 'gold', width: 1.5 });
          const th = 0;
          R.path(lin(-1, 1, 200).map((s) => [s, KAP * ellProj(E2, th, s)]), { color: 'accent', width: 2 });
          const clot = [E2[PAINT.findIndex((q) => q[0] === 65)]]; R.path(lin(-1, 1, 200).map((s) => [s, KAP * ellProj(clot, th, s)]), { color: 'red', width: 2.4 });
          R.text('clot', 0.45, 0.35, { color: 'red', size: 12 });
        });
        v.legend([['accent', 'whole head'], ['red', 'clot alone']]);
        v.readout(() => {
          if (!res) return '';
          const roi = (cx, cy, rad) => { const vals = []; for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++) { const x = -1 + ((i + 0.5) * 2) / NP, y = 1 - ((j + 0.5) * 2) / NP; if (Math.hypot(x - cx, y - cy) < rad) vals.push(res.img[j * NP + i]); } return vals; };
          const wm = roi(0, -0.3, 0.05), cl = roi(0.38, -0.2, 0.05), gm = roi(0, 0.5, 0.0);
          void gm;
          return `Noise (SD) in a uniform patch of white matter: $${fx(sd(wm), 1)}$ HU; mean white matter $${fx(mean(wm), 0)}$ HU, clot $${fx(mean(cl), 0)}$ HU.\nGrey–white contrast is only about 1% of water's attenuation (15 HU = 1.5%): to see it the noise must be well below that, which needs more photons — here ${fx(Math.round(ph.value), 0)} per reading. In the single projection the clot adds under 1% to the signal.`;
        });
      },
    },
  ],
};
