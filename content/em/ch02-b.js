// Electromagnetism — Chapter 2, part b: items 2.7–2.12 (Poisson, Laplace, Green's function, assembly energy, field energy, self-energy)
import { TAU, KV, EPS0, pot, fld, sgnCol, nC, drawCharge, arrowPx, heatPot, levels } from './ch02.shared.js';

/** V/cm² of ∇²V per (nC/cm³) of charge density: ∇²V = −RC ρ in the pictures' units. */
const RC = 1 / EPS0;

export default {
  collection: 'em',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Poisson’s equation',
      statement: String.raw`In a region where the charge density is $\rho$, the electrostatic potential satisfies
$$\nabla^2V=-\frac{\rho}{\varepsilon_0},\qquad\text{i.e.}\qquad \frac{\partial^2V}{\partial x^2}+\frac{\partial^2V}{\partial y^2}+\frac{\partial^2V}{\partial z^2}=-\frac{\rho}{\varepsilon_0}.$$
Together with boundary conditions (the potential on the surfaces enclosing the region, or $V\to0$ at infinity) it determines $V$ uniquely.`,
      idea: String.raw`Gauss’s law in differential form says $\nabla\cdot\mathbf E=\rho/\varepsilon_0$ (em-1.15), and $\mathbf E=-\nabla V$ (em-2.4). Substituting, $\nabla\cdot(-\nabla V)=\rho/\varepsilon_0$, which is the claim. Poisson’s equation is a *local* statement: the curvature of the potential at a point is fixed by the charge density at that very point, so $V$ is a hill (negative Laplacian) exactly where there is positive charge. It trades the integral over all charges for a differential equation plus boundary data.`,
      caption: String.raw`Three Gaussian blobs of charge (drag them; set their signs and amounts and their common width $\sigma$) form a **two-dimensional** density (infinite lines along $z$) on a periodic $64\times64$ grid with a uniform neutralizing background. The potential in the middle panel is found by one FFT, dividing each Fourier mode by $k^2$. The right panel shows the **residual** of $\nabla^2V+\rho/\varepsilon_0$ evaluated with the 5-point stencil: with the continuum symbol it is the small discretization error of the stencil, and switching to the stencil's own symbol makes it vanish to rounding error — the discrete Poisson equation is solved exactly.`,
      scope: String.raw`The picture is a periodic, two-dimensional version of the three-dimensional equation (charge uniform along $z$), with the mean charge subtracted so that a periodic solution exists. The theorem itself is three-dimensional and needs no symmetry.`,
      deps: ['em-1.15', 'em-2.4'],
      refs: ['Griffiths §2.3'],
      tags: ['poisson', 'fft'],
      viz(v) {
        const M = v.M, N = 64, Lx = 12, h = Lx / N;
        const mk = (title) => v.stage({ x: [-6, 6], y: [-6, 6], equal: true, height: 290, axes: false, weight: 1, minWidth: 230, title });
        const sR = mk('charge density $\\rho$'), sV = mk('potential $V$ from one FFT'), sE = mk('residual of $\\nabla^2V+\\rho/\\varepsilon_0$');
        const sig = v.slider('blob width $\\sigma$', 0.3, 1.6, 0.8, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const qs = [v.slider('$q_1$', -6, 6, 4, { step: 0.5, fmt: (x) => `${x} nC/cm` }), v.slider('$q_2$', -6, 6, -3, { step: 0.5, fmt: (x) => `${x} nC/cm` }), v.slider('$q_3$', -6, 6, 2, { step: 0.5, fmt: (x) => `${x} nC/cm` })];
        const sym = v.select('Fourier symbol of $\\nabla^2$', [{ value: 'k', label: 'continuum $-k^2$' }, { value: 'd', label: '5-point stencil' }], 'k');
        const hs = [[-2.6, 1.2, 'red'], [2.4, -1.4, 'blue'], [1.0, 3.0, 'red']].map(([x, y, c]) => sR.handle(x, y, { color: c, r: 8 }));
        const cx = (i) => -6 + (i + 0.5) * h;
        let rho, Vg, Rg, key = '', info = {};
        const solve = () => {
          rho = Array.from({ length: N }, () => new Float64Array(N));
          let sum = 0;
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            let r = 0;
            for (let b = 0; b < 3; b++) { const dx = cx(i) - hs[b].x, dy = cx(j) - hs[b].y; r += (qs[b].value / (TAU * sig.value ** 2)) * Math.exp(-(dx * dx + dy * dy) / (2 * sig.value ** 2)); }
            rho[j][i] = r; sum += r;
          }
          const mean = sum / (N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) rho[j][i] -= mean;
          const re = rho.map((r) => Array.from(r)), im = re.map((r) => r.map(() => 0));
          M.fft2(re, im);
          for (let m = 0; m < N; m++) for (let n = 0; n < N; n++) {
            const my = m <= N / 2 ? m : m - N, mx = n <= N / 2 ? n : n - N; let s2;
            if (sym.value === 'k') s2 = ((TAU * mx) / Lx) ** 2 + ((TAU * my) / Lx) ** 2; else s2 = (2 - 2 * Math.cos((TAU * mx) / N)) / (h * h) + (2 - 2 * Math.cos((TAU * my) / N)) / (h * h);
            const f = s2 > 1e-12 ? RC / s2 : 0; re[m][n] *= f; im[m][n] *= f;
          }
          M.ifft2(re, im); Vg = re;
          Rg = []; let mx = 0, mr = 0;
          for (let j = 0; j < N; j++) { Rg.push(new Float64Array(N)); for (let i = 0; i < N; i++) {
            const c = Vg[j][i], lap = (Vg[j][(i + 1) % N] + Vg[j][(i + N - 1) % N] + Vg[(j + 1) % N][i] + Vg[(j + N - 1) % N][i] - 4 * c) / (h * h);
            Rg[j][i] = lap + RC * rho[j][i]; mx = Math.max(mx, Math.abs(Rg[j][i])); mr = Math.max(mr, Math.abs(RC * rho[j][i]));
          } }
          info = { res: mx, rho: mr, vmax: Math.max(...Vg.map((r) => Math.max(...r))), vmin: Math.min(...Vg.map((r) => Math.min(...r))) };
        };
        const at = (G, x, y) => { const i = Math.min(N - 1, Math.max(0, Math.floor((x + 6) / h))), j = Math.min(N - 1, Math.max(0, Math.floor((y + 6) / h))); return G[j][i]; };
        v.render(() => {
          const k = hs.map((q) => q.x.toFixed(2) + q.y.toFixed(2)).join() + qs.map((q) => q.value).join() + sig.value + sym.value;
          if (k !== key) { key = k; solve(); }
          const rs = Math.max(1e-9, info.rho);
          heatPot(sR, (x, y) => at(rho, x, y) * RC, rs, 'r' + key, { res: 3, id: 'a' });
          heatPot(sV, (x, y) => at(Vg, x, y), Math.max(1e-9, Math.max(info.vmax, -info.vmin)), 'v' + key, { res: 3, id: 'b' });
          sV.contour((x, y) => at(Vg, x, y), levels(Math.max(info.vmax, -info.vmin) / 6, 6).filter((q) => q), { color: 'ink', alpha: 0.3, width: 1, res: 64 });
          heatPot(sE, (x, y) => at(Rg, x, y), 0.03 * rs, 'e' + key, { res: 3, id: 'c' });
          hs.forEach((q, b) => { q.color = sgnCol(qs[b].value); });
          sE.corner('colour range ±3 % of max $|\\rho/\\varepsilon_0|$', 'bl', { size: 11, plate: true });
        });
        v.readout(() => `Largest $|\\nabla^2V+\\rho/\\varepsilon_0|$ on the grid: $${v.sci(info.res, 2)}$ V/cm², against $\\max|\\rho/\\varepsilon_0|=${v.sci(info.rho, 2)}$ V/cm² — a relative residual of $${v.sci(info.res / (info.rho || 1), 2)}$.${sym.value === 'd' ? ' The solver used the stencil’s own symbol, so only rounding error is left.' : ' The leftover is the truncation error of the stencil.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Laplace’s equation in charge-free regions',
      statement: String.raw`In a region containing no charge, the potential satisfies **Laplace’s equation** $\nabla^2V=0$. Its solutions (harmonic functions) are smooth, have no local maxima or minima in the interior, and are determined uniquely by their values on the boundary of the region: if two charge-free solutions agree on the boundary they agree everywhere inside.`,
      idea: String.raw`Setting $\rho=0$ in Poisson’s equation (em-2.7) gives $\nabla^2V=0$. The value at a point is the average of its neighbours (made precise in em-2.15), so an interior point can never be strictly higher than all its neighbours; the largest and smallest values therefore sit on the boundary (the maximum principle, from the harmonic-function theory of rca-11.3 and vcalc-9.5). Uniqueness follows by applying this to the difference of two solutions, which vanishes on the boundary.`,
      caption: String.raw`Set the potential on each of the four edges of a square region with the sliders; the interior is found by relaxation on a $49\times49$ grid. The left map is $V$ with equally spaced contours; the right map is the discrete Laplacian, which is zero everywhere (up to the solver tolerance). The red and blue rings mark the interior maximum and minimum — they never beat the boundary values. Now switch on a **point charge** and drag it: the Laplacian lights up at the charge and $V$ acquires a true interior peak or well, exceeding the boundary data.`,
      deps: ['em-2.7', 'rca-11.3', 'vcalc-9.5'],
      refs: ['Griffiths §3.1'],
      tags: ['laplace', 'maximum principle'],
      viz(v) {
        const n = 49, a = 4, h = (2 * a) / (n - 1);
        const s = v.stage({ x: [-4.6, 4.6], y: [-4.6, 4.6], equal: true, height: 340, axes: false, weight: 1, minWidth: 260, title: 'potential $V$ (relaxation solver)' });
        const sL = v.stage({ x: [-4.6, 4.6], y: [-4.6, 4.6], equal: true, height: 340, axes: false, weight: 1, minWidth: 260, title: 'discrete Laplacian $\\nabla^2V$' });
        const bc = { T: v.slider('top edge', -100, 100, 80, { step: 5, fmt: (x) => `${x} V` }), B: v.slider('bottom edge', -100, 100, -60, { step: 5, fmt: (x) => `${x} V` }), Lf: v.slider('left edge', -100, 100, 20, { step: 5, fmt: (x) => `${x} V` }), R: v.slider('right edge', -100, 100, -40, { step: 5, fmt: (x) => `${x} V` }) };
        const withQ = v.toggle('put a point charge inside', false);
        const qv = v.slider('its charge', -4, 4, 2, { step: 0.5, fmt: (x) => `${x} nC/cm` });
        const Q = s.handle(1.2, 0.8, { color: 'purple', r: 9, label: 'charge', labelPos: 'ne' });
        let V = null, info = {}, key = '';
        const solve = () => {
          V = Array.from({ length: n }, () => new Float64Array(n));
          const top = bc.T.value, bot = bc.B.value, lef = bc.Lf.value, rig = bc.R.value;
          for (let i = 0; i < n; i++) { V[n - 1][i] = top; V[0][i] = bot; V[i][0] = lef; V[i][n - 1] = rig; }
          V[0][0] = (bot + lef) / 2; V[0][n - 1] = (bot + rig) / 2; V[n - 1][0] = (top + lef) / 2; V[n - 1][n - 1] = (top + rig) / 2;
          const src = Array.from({ length: n }, () => new Float64Array(n));
          if (withQ.value) { const i = Math.max(1, Math.min(n - 2, Math.round((Q.x + a) / h))), j = Math.max(1, Math.min(n - 2, Math.round((Q.y + a) / h))); src[j][i] = (RC * qv.value) / (h * h); }
          const w = 1.9;
          for (let it = 0; it < 4000; it++) {
            let dm = 0;
            for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
              const nv = (V[j][i + 1] + V[j][i - 1] + V[j + 1][i] + V[j - 1][i] + h * h * src[j][i]) / 4, d = w * (nv - V[j][i]); V[j][i] += d; dm = Math.max(dm, Math.abs(d));
            }
            if (dm < 1e-9) break;
          }
          let mx = -Infinity, mn = Infinity, pmx = null, pmn = null, lapMax = 0;
          for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
            const c = V[j][i]; if (c > mx) { mx = c; pmx = [-a + i * h, -a + j * h]; } if (c < mn) { mn = c; pmn = [-a + i * h, -a + j * h]; }
            if (!(withQ.value && Math.abs(src[j][i]) > 0)) lapMax = Math.max(lapMax, Math.abs((V[j][i + 1] + V[j][i - 1] + V[j + 1][i] + V[j - 1][i] - 4 * c) / (h * h)));
          }
          const edges = [bc.T.value, bc.B.value, bc.Lf.value, bc.R.value];
          info = { mx, mn, pmx, pmn, lapMax, bmax: Math.max(...edges), bmin: Math.min(...edges), src };
        };
        const at = (G, x, y) => { const fx = (x + a) / h, fy = (y + a) / h; if (fx < 0 || fy < 0 || fx > n - 1 || fy > n - 1) return NaN; const i = Math.min(n - 2, Math.floor(fx)), j = Math.min(n - 2, Math.floor(fy)), u = fx - i, t = fy - j; return (1 - t) * ((1 - u) * G[j][i] + u * G[j][i + 1]) + t * ((1 - u) * G[j + 1][i] + u * G[j + 1][i + 1]); };
        v.render(() => {
          Q.visible = withQ.value; qv.el.hidden = !withQ.value;
          const k = [bc.T.value, bc.B.value, bc.Lf.value, bc.R.value, withQ.value, qv.value, withQ.value ? Q.x.toFixed(2) + Q.y.toFixed(2) : ''].join('|');
          if (k !== key) { key = k; solve(); }
          const sc = Math.max(40, Math.abs(info.mx), Math.abs(info.mn));
          heatPot(s, (x, y) => at(V, x, y), sc, 'v' + k, { res: 3 });
          s.contour((x, y) => at(V, x, y), levels(sc / 6, 6).filter((q) => q), { color: 'ink', alpha: 0.35, width: 1, res: 90 });
          const L = (x, y) => { const i = Math.round((x + a) / h), j = Math.round((y + a) / h); if (i < 1 || j < 1 || i > n - 2 || j > n - 2) return NaN; return (V[j][i + 1] + V[j][i - 1] + V[j + 1][i] + V[j - 1][i] - 4 * V[j][i]) / (h * h); };
          heatPot(sL, L, Math.max(1, RC * Math.abs(qv.value) / (h * h) * 0.4), 'l' + k, { res: 3 });
          s.rect(-a, -a, a, a, { color: 'ink', width: 2, fill: false });
          s.text(`${bc.T.value} V`, 0, a + 0.3, { align: 'center', size: 12, color: 'ink' }); s.text(`${bc.B.value} V`, 0, -a - 0.32, { align: 'center', size: 12, color: 'ink' });
          s.text(`${bc.Lf.value} V`, -a - 0.1, 0, { align: 'right', size: 12, color: 'ink' }); s.text(`${bc.R.value} V`, a + 0.1, 0, { align: 'left', size: 12, color: 'ink' });
          s.dot(info.pmx[0], info.pmx[1], { r: 8, hollow: true, color: 'red', width: 2.5, label: 'max', labelPos: 'ne' }); s.dot(info.pmn[0], info.pmn[1], { r: 8, hollow: true, color: 'blue', width: 2.5, label: 'min', labelPos: 'sw' });
          if (withQ.value) s.dot(Q.x, Q.y, { r: 5, color: 'purple' });
        });
        v.readout(() => `Boundary values run from ${v.fix(info.bmin, 0)} to ${v.fix(info.bmax, 0)} V. Interior: largest $V=${v.fix(info.mx, 1)}$ V, smallest $V=${v.fix(info.mn, 1)}$ V — ${info.mx <= info.bmax + 1e-6 && info.mn >= info.bmin - 1e-6 ? 'both inside the boundary range, as the maximum principle demands.' : '**the maximum principle is broken: a charge sits inside the region.**'}\nMax $|\\nabla^2V|$ away from the charge: $${v.sci(info.lapMax, 2)}$ V/cm².`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Coulomb potential as the Laplacian’s Green’s function',
      statement: String.raw`The function $G(\mathbf r,\mathbf r')=\dfrac{1}{4\pi\,|\mathbf r-\mathbf r'|}$ satisfies $\nabla^2G=-\delta^3(\mathbf r-\mathbf r')$ in the sense of distributions. Hence for any (sufficiently decaying) charge density
$$V(\mathbf r)=\frac1{4\pi\varepsilon_0}\int\frac{\rho(\mathbf r')}{|\mathbf r-\mathbf r'|}\,d\tau'$$
solves Poisson’s equation $\nabla^2V=-\rho/\varepsilon_0$ and vanishes at infinity: the superposition of point-charge potentials is the solution operator of the equation.`,
      idea: String.raw`Away from the source $1/r$ is harmonic (a direct computation), and the flux of $\nabla(1/r)$ through any sphere around the origin is $-4\pi$, so the divergence of $\nabla(1/r)$ is $-4\pi\delta^3$ — this is the statement of em-1.19, applied to $\mathbf E=\hat{\mathbf r}/r^2$ — and so $\nabla^2(1/4\pi r)=-\delta^3$. Differentiating under the integral sign (justified distributionally, fa-8.1) puts the Laplacian on the kernel, where it picks out $\rho(\mathbf r)$; this is also how pde-5.2 solves the equation in free space. A different kernel — even a different constant in front of the same $1/r$ — would produce the wrong $\rho$.`,
      caption: String.raw`The density is three Gaussian blobs in space (drag their positions in the left panel, which shows the slice $z=0$; change their charges and common width). The middle panel is $V$ on that slice, obtained by **summing a kernel over all $8000$ cells of a lattice in space**; the right panel is the residual $\nabla^2V+\rho/\varepsilon_0$ with the Laplacian taken by finite differences in all three directions. With the Coulomb kernel the residual is just the stencil error; with a wrong normalisation, a screened (Yukawa) kernel or a $1/r^2$ kernel it is a large fraction of $\rho/\varepsilon_0$.`,
      scope: String.raw`Needs $\rho$ to decay fast enough for the integral to converge; the picture uses a smooth bounded density and a finite lattice, so the residual includes lattice and stencil error at the percent level.`,
      deps: ['em-2.7', 'em-1.19', 'fa-8.1', 'pde-5.2'],
      refs: ['Griffiths §2.3'],
      tags: ['green function', 'delta'],
      viz(v) {
        const NL = 20, A = 6 / NL, hs = 0.25, NS = 24;
        const mk = (title) => v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 290, axes: false, weight: 1, minWidth: 230, title });
        const sR = mk('density $\\rho$ on the slice $z=0$'), sV = mk('$V=\\sum$ kernel $\\times$ charge'), sE = mk('residual $\\nabla^2V+\\rho/\\varepsilon_0$');
        const ker = v.select('kernel', [{ value: 'c', label: '$1/4\\pi\\varepsilon_0 r$' }, { value: 'n', label: '$1.3\\times$ that' }, { value: 'y', label: 'Yukawa $e^{-r/2}/r$' }, { value: 'i', label: '$1/r^2$' }], 'c');
        const sig = v.slider('blob width $\\sigma$', 0.5, 1.1, 0.7, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const qs = [v.slider('$q_1$', -6, 6, 4, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_2$', -6, 6, -3, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_3$', -6, 6, 2, { step: 0.5, fmt: (x) => `${x} nC` })];
        const zs = [0.3, -0.3, 0.6];
        const hd = [[-1.2, 0.7, 'red'], [1.2, -0.6, 'blue'], [0.2, 1.5, 'red']].map(([x, y, c]) => sR.handle(x, y, { color: c, r: 8 }));
        const kernel = (r2) => { const r = Math.sqrt(r2); if (ker.value === 'c') return 1 / r; if (ker.value === 'n') return 1.3 / r; if (ker.value === 'y') return Math.exp(-r / 2) / r; return 1 / r2; };
        let key = '', res = null;
        const compute = () => {
          const cells = []; const s2 = sig.value * sig.value, norm = 1 / Math.pow(TAU, 1.5) / (s2 * sig.value);
          let tot = 0;
          for (let k = 0; k < NL; k++) for (let j = 0; j < NL; j++) for (let i = 0; i < NL; i++) {
            const x = -3 + (i + 0.5) * A, y = -3 + (j + 0.5) * A, z = -3 + (k + 0.5) * A; let r = 0;
            for (let b = 0; b < 3; b++) { const dx = x - hd[b].x, dy = y - hd[b].y, dz = z - zs[b]; r += qs[b].value * norm * Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * s2)); }
            if (Math.abs(r) > 1e-4) { cells.push([x, y, z, r * A * A * A]); tot += r * A * A * A; }
          }
          const rhoAt = (x, y, z) => { let r = 0; for (let b = 0; b < 3; b++) { const dx = x - hd[b].x, dy = y - hd[b].y, dz = z - zs[b]; r += qs[b].value * norm * Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * s2)); } return r; };
          const Vs = [-1, 0, 1].map((dz) => { const G = []; for (let j = 0; j < NS + 2; j++) { G.push(new Float64Array(NS + 2)); for (let i = 0; i < NS + 2; i++) {
            const x = -3 + 0.07 + (i - 1) * hs, y = -3 + 0.07 + (j - 1) * hs, z = 0.04 + dz * hs; let p = 0;
            for (const c of cells) { const dx = x - c[0], dy = y - c[1], dz2 = z - c[2]; p += c[3] * kernel(dx * dx + dy * dy + dz2 * dz2 + 0.0016); }
            G[j][i] = KV * p; } } return G; });
          const R = [], Vm = Vs[1]; let rr = 0, rp = 0, rmax = 0;
          for (let j = 1; j <= NS; j++) { R.push(new Float64Array(NS)); for (let i = 1; i <= NS; i++) {
            const lap = (Vm[j][i + 1] + Vm[j][i - 1] + Vm[j + 1][i] + Vm[j - 1][i] + Vs[0][j][i] + Vs[2][j][i] - 6 * Vm[j][i]) / (hs * hs), x = -3 + 0.07 + (i - 1) * hs, y = -3 + 0.07 + (j - 1) * hs;
            const rho = rhoAt(x, y, 0.04), e = lap + RC * rho; R[j - 1][i - 1] = e; rr += e * e; rp += (RC * rho) ** 2; rmax = Math.max(rmax, Math.abs(RC * rho));
          } }
          res = { V: Vm, R, rel: Math.sqrt(rr / (rp || 1)), rmax, tot, n: cells.length, vmax: Math.max(...Vm.slice(1, NS + 1).map((r) => Math.max(...Array.from(r).slice(1, NS + 1).map(Math.abs)))) };
        };
        const bil = (G, off, x, y) => { const fx = (x + 3 - 0.07) / hs + off, fy = (y + 3 - 0.07) / hs + off; const i = Math.max(0, Math.min(G[0].length - 2, Math.floor(fx))), j = Math.max(0, Math.min(G.length - 2, Math.floor(fy))), u = Math.max(0, Math.min(1, fx - i)), t = Math.max(0, Math.min(1, fy - j)); return (1 - t) * ((1 - u) * G[j][i] + u * G[j][i + 1]) + t * ((1 - u) * G[j + 1][i] + u * G[j + 1][i + 1]); };
        v.render(() => {
          const k = hd.map((q) => q.x.toFixed(2) + q.y.toFixed(2)).join() + qs.map((q) => q.value).join() + sig.value + ker.value;
          if (k !== key) { key = k; compute(); }
          const rho0 = (x, y) => { const s2 = sig.value ** 2; let r = 0; for (let b = 0; b < 3; b++) { const dx = x - hd[b].x, dy = y - hd[b].y, dz = 0.04 - zs[b]; r += (qs[b].value / (Math.pow(TAU, 1.5) * s2 * sig.value)) * Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * s2)); } return r; };
          heatPot(sR, (x, y) => rho0(x, y) * RC, res.rmax || 1, 'r' + k, { res: 3, id: 'a' });
          const vs = Math.max(1, res.vmax);
          heatPot(sV, (x, y) => bil(res.V, 1, x, y), vs, 'v' + k, { res: 3, id: 'b' });
          sV.contour((x, y) => bil(res.V, 1, x, y), levels(vs / 5, 5).filter((q) => q), { color: 'ink', alpha: 0.3, width: 1, res: 60 });
          heatPot(sE, (x, y) => bil(res.R, 0, x, y), 0.2 * (res.rmax || 1), 'e' + k, { res: 3, id: 'c' });
          hd.forEach((q, b) => { q.color = sgnCol(qs[b].value); });
          sE.corner('colour range ±20 % of max $|\\rho/\\varepsilon_0|$', 'bl', { size: 11, plate: true });
        });
        v.readout(() => `Kernel summed over ${res.n} lattice cells (total charge ${v.fix(res.tot, 2)} nC). Residual of Poisson’s equation on the slice: $\\|\\nabla^2V+\\rho/\\varepsilon_0\\|_2\\,/\\,\\|\\rho/\\varepsilon_0\\|_2 = ${v.fix(res.rel * 100, 1)}\\,\\%$ — ${res.rel < 0.08 ? 'the kernel solves the equation (what remains is stencil and lattice error).' : 'this kernel does **not** solve $\\nabla^2V=-\\rho/\\varepsilon_0$.'}`);
      },
    },
  ],
};
