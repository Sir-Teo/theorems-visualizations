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
          heatPot(sR, (x, y) => at(rho, x, y) * RC, 0.5 * rs, 'r' + key, { res: 3, id: 'a' });
          heatPot(sV, (x, y) => at(Vg, x, y), 0.5 * Math.max(1e-9, Math.max(info.vmax, -info.vmin)), 'v' + key, { res: 3, id: 'b' });
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
          s.dot(info.pmx[0], info.pmx[1], { r: 8, hollow: true, color: 'red' }); s.dot(info.pmn[0], info.pmn[1], { r: 8, hollow: true, color: 'blue' });
          sL.corner(withQ.value ? 'the charge is the only place where $\\nabla^2V\\neq0$' : '$\\nabla^2V=0$ at every grid point', 'tl', { size: 12, plate: true });
          if (withQ.value) s.dot(Q.x, Q.y, { r: 5, color: 'purple' });
        });
        v.legend([['red', 'interior maximum', { dot: true }], ['blue', 'interior minimum', { dot: true }]]);
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
          heatPot(sR, (x, y) => rho0(x, y) * RC, 0.5 * (res.rmax || 1), 'r' + k, { res: 3, id: 'a' });
          const vs = Math.max(1, res.vmax);
          heatPot(sV, (x, y) => bil(res.V, 1, x, y), 0.5 * vs, 'v' + k, { res: 3, id: 'b' });
          sV.contour((x, y) => bil(res.V, 1, x, y), levels(vs / 5, 5).filter((q) => q), { color: 'ink', alpha: 0.3, width: 1, res: 60 });
          heatPot(sE, (x, y) => bil(res.R, 0, x, y), 0.2 * (res.rmax || 1), 'e' + k, { res: 3, id: 'c' });
          hd.forEach((q, b) => { q.color = sgnCol(qs[b].value); });
          sE.corner('colour range ±20 % of max $|\\rho/\\varepsilon_0|$', 'bl', { size: 11, plate: true });
        });
        v.readout(() => `Kernel summed over ${res.n} lattice cells (total charge ${v.fix(res.tot, 2)} nC). Residual of Poisson’s equation on the slice: $\\|\\nabla^2V+\\rho/\\varepsilon_0\\|_2\\,/\\,\\|\\rho/\\varepsilon_0\\|_2 = ${v.fix(res.rel * 100, 1)}\\,\\%$ — ${res.rel < 0.08 ? 'the kernel solves the equation (what remains is stencil and lattice error).' : 'this kernel does **not** solve $\\nabla^2V=-\\rho/\\varepsilon_0$.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Work to assemble a charge configuration',
      statement: String.raw`The work needed to bring point charges $q_1,\dots,q_n$ from far away (at rest at the start and at the end) to fixed positions $\mathbf r_1,\dots,\mathbf r_n$ is
$$W=\frac1{4\pi\varepsilon_0}\sum_{i<j}\frac{q_iq_j}{|\mathbf r_i-\mathbf r_j|}=\frac12\sum_{i}q_iV_i ,$$
where $V_i$ is the potential at $\mathbf r_i$ due to all the *other* charges. It does not depend on the order or the routes by which the charges are brought in.`,
      idea: String.raw`Bringing in the $k$-th charge costs $q_k$ times the potential of the $k-1$ charges already in place (em-2.3), whatever the route (em-2.2). Summing over $k$ counts every pair $(i,j)$ exactly once, with the term $q_iq_j/4\pi\varepsilon_0r_{ij}$ — and this pair sum is manifestly independent of the order. Writing each pair term half to each member gives $\frac12\sum q_iV_i$. Negative terms (attractive pairs) mean the field does work for us.`,
      caption: String.raw`Four charges (drag their final positions; set their charges) are brought in from far away one at a time, in the order shown. Slide **progress** to move the arriving charge; the middle panel stacks up the cost of each step ($q_k$ times the potential of those already placed) as a waterfall. Press **next order** or **random order**: the steps change, but the final total, and the pair sum in the readout, do not. The right panel shows the total for all 24 orders on the same height, beside the cost of the last charge alone, which does depend on the order.`,
      credit: 'Green, 1828 (potential energy of electric systems)',
      deps: ['em-2.3'],
      refs: ['Griffiths §2.4', 'Feynman II ch. 8'],
      tags: ['energy', 'assembly'],
      viz(v) {
        const s = v.stage({ x: [-7, 7], y: [-4.5, 4.5], equal: true, height: 340, axes: false, weight: 1.25, title: 'bringing the charges in one by one' });
        const sb = v.stage({ x: [0.4, 4.6], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'step $k$ (the $k$-th charge to arrive)', xticks: [1, 2, 3, 4], ylabel: 'work we have done (nJ)', title: 'cost of each step' });
        const sc = v.stage({ x: [0, 25], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'which of the 24 orders', ylabel: 'nJ', title: 'total (green) and last step alone (grey)' });
        const prog = v.slider('progress', 0, 4, 2.4, { step: 0.01, fmt: (x) => `${x.toFixed(2)} of 4` });
        const qs = [v.slider('$q_1$', -5, 5, 3, { step: 0.5, fmt: nC }), v.slider('$q_2$', -5, 5, -2, { step: 0.5, fmt: nC }), v.slider('$q_3$', -5, 5, 2, { step: 0.5, fmt: nC }), v.slider('$q_4$', -5, 5, -3, { step: 0.5, fmt: nC })];
        const perms = []; const gen = (a, r) => { if (!a.length) perms.push(r); else a.forEach((x, i) => gen([...a.slice(0, i), ...a.slice(i + 1)], [...r, x])); }; gen([0, 1, 2, 3], []);
        let oi = 17, seed = 5;
        v.button('next order', () => { oi = (oi + 1) % 24; });
        v.button('random order', () => { oi = v.rng(seed++).int(0, 23); });
        const hs = [[-3.6, 1.8], [3.2, 2.2], [3.6, -2.0], [-2.4, -2.6]].map(([x, y], i) => s.handle(x, y, { color: i % 2 ? 'blue' : 'red', r: 10, label: `${i + 1}`, labelPos: 'ne' }));
        const order = (o) => perms[o];
        const costs = (o, pos, q) => {
          const ord = order(o), c = []; const placed = [];
          for (const k of ord) { let V = 0; for (const j of placed) V += q[j] / Math.hypot(pos[k][0] - pos[j][0], pos[k][1] - pos[j][1]); c.push(KV * q[k] * V); placed.push(k); }
          return c;
        };
        let info = {};
        v.render(() => {
          const pos = hs.map((h) => [h.x, h.y]), q = qs.map((x) => x.value);
          hs.forEach((h, i) => { h.color = sgnCol(q[i]); });
          const ord = order(oi), K = Math.min(3, Math.floor(prog.value)), u = prog.value >= 4 ? 1 : prog.value - K;
          const cs = costs(oi, pos, q);
          // geometry: arriving charge k travels from 11 cm away along the direction away from the centroid
          const cen = [0, 1].map((c) => pos.reduce((a, p) => a + p[c], 0) / 4);
          const placedNow = ord.slice(0, K), mover = ord[K];
          const dirs = pos.map((p) => { const dx = p[0] - cen[0], dy = p[1] - cen[1], m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; });
          // faint final positions
          pos.forEach((p, i) => { s.circle(p[0], p[1], 0.3, { color: 'faint', width: 1, dash: [3, 3] }); s.text(`${i + 1}`, p[0] + 0.45, p[1] - 0.45, { size: 11, color: 'muted' }); });
          for (const k of placedNow) drawCharge(s, pos[k][0], pos[k][1], q[k], 10);
          const dist = 11 * (1 - u) * (1 - u) * (prog.value >= 4 ? 0 : 1) + (prog.value >= 4 ? 0 : 0);
          let partial = 0;
          if (prog.value < 4) {
            const mx = pos[mover][0] + dirs[mover][0] * dist, my = pos[mover][1] + dirs[mover][1] * dist;
            s.line(pos[mover][0], pos[mover][1], pos[mover][0] + dirs[mover][0] * 11, pos[mover][1] + dirs[mover][1] * 11, { color: 'orange', width: 1.4, dash: [5, 4], alpha: 0.7 });
            drawCharge(s, mx, my, q[mover], 10); s.text(`arriving: ${mover + 1}`, mx - 0.5, my + 0.8, { size: 11.5, color: 'orange', align: 'right' });
            let V = 0; for (const j of placedNow) V += q[j] / Math.hypot(mx - pos[j][0], my - pos[j][1]);
            partial = KV * q[mover] * V;
          }
          // waterfall
          let cum = 0; const bars = [];
          for (let k = 0; k < 4; k++) {
            const done = k < K || prog.value >= 4, cur = k === K && prog.value < 4;
            if (done) { bars.push([k + 1, cum, cum + cs[k], 1]); cum += cs[k]; } else if (cur) { bars.push([k + 1, cum, cum + partial, 0.55]); }
          }
          const total = cs.reduce((a, b) => a + b, 0), cumNow = cum + (prog.value < 4 ? partial : 0);
          const all = [0, total, cumNow, ...bars.flatMap((b) => [b[1], b[2]])]; let lo = Math.min(...all), hi = Math.max(...all); const pad = 0.15 * (hi - lo || 1); sb.setView([0.4, 4.6], [lo - pad, hi + pad]);
          sb.hline(0, { color: 'faint', width: 1 });
          sb.hline(total, { color: 'green', width: 1.6, dash: [6, 4] });
          for (const [x, a, b, al] of bars) { sb.rect(x - 0.32, Math.min(a, b), x + 0.32, Math.max(a, b), { fill: b >= a ? 'orange' : 'teal', fillAlpha: 0.65 * al + 0.1, color: b >= a ? 'orange' : 'teal', width: 1.5 }); sb.text(`${v.fix(b - a, 1)}`, x, Math.max(a, b) + 0.05 * (hi - lo || 1), { align: 'center', size: 11, color: 'ink' }); }
          for (let k = 0; k < 4; k++) sb.text(`#${ord[k] + 1}`, k + 1, lo - pad * 0.55, { align: 'center', size: 11, color: 'muted' });
          // all orders
          const lasts = perms.map((_, o) => costs(o, pos, q)[3]), tots = perms.map((_, o) => costs(o, pos, q).reduce((a, b) => a + b, 0));
          const lo2 = Math.min(0, ...lasts, ...tots), hi2 = Math.max(0, ...lasts, ...tots), p2 = 0.15 * (hi2 - lo2 || 1); sc.setView([0, 25], [lo2 - p2, hi2 + p2]);
          sc.hline(0, { color: 'faint', width: 1 }); sc.vline(oi + 1, { color: 'orange', width: 1.4, dash: [4, 3] });
          tots.forEach((t, o) => { sc.dot(o + 1, lasts[o], { r: 3.5, color: 'muted' }); sc.dot(o + 1, t, { r: 4.5, color: 'green' }); });
          let pair = 0; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pair += (KV * q[i] * q[j]) / Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
          let half = 0; for (let i = 0; i < 4; i++) { let V = 0; for (let j = 0; j < 4; j++) if (j !== i) V += q[j] / Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]); half += 0.5 * q[i] * KV * V; }
          info = { total, pair, half, spread: Math.max(...tots) - Math.min(...tots), ord, cumNow };
        });
        v.legend([['orange', 'cost > 0 (against repulsion)'], ['teal', 'cost < 0 (the field helps)'], ['green', 'total, every order']]);
        v.readout(() => `Order ${info.ord.map((k) => k + 1).join(' → ')}: total so far $${v.fix(info.cumNow, 2)}$ nJ; final total $${v.fix(info.total, 3)}$ nJ.\nPair sum $\\sum_{i<j}q_iq_j/4\\pi\\varepsilon_0r_{ij}=${v.fix(info.pair, 3)}$ nJ · $\\tfrac12\\sum q_iV_i=${v.fix(info.half, 3)}$ nJ · spread of the total over all 24 orders: $${v.sci(info.spread, 1)}$ nJ.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Energy stored in the electric field',
      statement: String.raw`The work needed to assemble any charge distribution can be written as an integral over the field,
$$W=\frac{\varepsilon_0}{2}\int_{\text{all space}}|\mathbf E|^2\,d\tau ,$$
so the field carries energy with density $u=\tfrac12\varepsilon_0E^2$. For two uniformly charged shells (radii $a_1,a_2$, charges $q_1,q_2$, not overlapping, centres $d$ apart) the integral splits into the two self-energies $q_i^2/8\pi\varepsilon_0a_i$ and the interaction energy $q_1q_2/4\pi\varepsilon_0d$ obtained by em-2.10.`,
      idea: String.raw`Write $W=\frac12\int\rho V\,d\tau$, replace $\rho$ by $\varepsilon_0\nabla\cdot\mathbf E$ (em-1.15), integrate by parts with the divergence theorem (pma-10.51) and use $\mathbf E=-\nabla V$; the surface term vanishes at infinity and what remains is $\frac{\varepsilon_0}2\int E^2$. Because $E^2=E_1^2+E_2^2+2\mathbf E_1\!\cdot\!\mathbf E_2$ for two sources, the energy is the sum of each source’s own field energy and a cross term, which is the interaction energy. The self-energy of a shell grows without bound as it shrinks.`,
      caption: String.raw`The map shows the energy density $u$ (log scale, darker = more) of two uniformly charged shells on their axis (a cut through the plane of the axis). The right plot integrates $u$ numerically over a growing ball centred midway between them (slider $R$, drawn on the map): the blue curve is the total energy inside, the orange curve is just the cross term $\varepsilon_0\!\int\mathbf E_1\!\cdot\!\mathbf E_2$, which tends to the interaction energy $q_1q_2/4\pi\varepsilon_0d$ of em-2.10 (dashed orange). Both curves approach their limits like $1/R$, because the field of a net charge has energy outside any large ball (dotted: the monopole estimate $-Q^2/8\pi\varepsilon_0R$ for the total). **Shrink the shells** with the radius slider and the self-energies grow like $1/a$ while the interaction stays put.`,
      scope: String.raw`Two insulating shells with frozen uniform surface charge (no induced charge), not overlapping. The numerical integral uses a $(z,\varrho)$ grid with partial-cell smoothing at the shell surfaces, good to about a percent.`,
      deps: ['em-2.10', 'pma-10.51'],
      refs: ['Griffiths §2.4', 'Feynman II ch. 8'],
      tags: ['field energy', 'energy density'],
      viz(v) {
        const RM = 8;
        const s = v.stage({ x: [-RM, RM], y: [-5.6, 5.6], equal: true, height: 340, axes: false, weight: 1.2, title: 'energy density $\\tfrac12\\varepsilon_0E^2$ (log scale)' });
        const sp = v.stage({ x: [0, RM], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'radius $R$ of the integration ball (cm)', ylabel: 'energy inside (nJ)', title: '$\\int_{|\\mathbf r|<R}\\tfrac12\\varepsilon_0E^2\\,d\\tau$' });
        const q1 = v.slider('$q_1$', -6, 6, 4, { step: 0.5, fmt: nC }), q2 = v.slider('$q_2$', -6, 6, -3, { step: 0.5, fmt: nC });
        const aS = v.slider('shell radius $a$', 0.15, 1.5, 0.6, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const dS = v.slider('separation $d$', 1.6, 6, 3.4, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const Rs = v.slider('integration radius $R$', 0.5, RM, 4, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        let key = '', res = null;
        const compute = () => {
          const a = aS.value, d = dS.value, A = q1.value, B = q2.value, c1 = -d / 2, c2 = d / 2, D = Math.min(0.05, Math.max(0.022, a / 5)), nz = Math.ceil((2 * RM) / D), nr = Math.ceil(RM / D), dR = 0.04, nb = Math.ceil(RM / dR);
          const U = new Float64Array(nb + 1), X = new Float64Array(nb + 1);
          for (let j = 0; j < nr; j++) {
            const r = (j + 0.5) * D;
            for (let i = 0; i < nz; i++) {
              const z = -RM + (i + 0.5) * D, d1 = Math.hypot(z - c1, r), d2 = Math.hypot(z - c2, r);
              const f1 = Math.max(0, Math.min(1, (d1 - a) / D + 0.5)), f2 = Math.max(0, Math.min(1, (d2 - a) / D + 0.5));
              const k1 = (KV * A * f1) / (d1 * d1 * d1), k2 = (KV * B * f2) / (d2 * d2 * d2);
              const e1z = k1 * (z - c1), e1r = k1 * r, e2z = k2 * (z - c2), e2r = k2 * r;
              const vol = TAU * r * D * D, b = Math.min(nb, Math.floor(Math.hypot(z, r) / dR));
              U[b] += 0.5 * EPS0 * ((e1z + e2z) ** 2 + (e1r + e2r) ** 2) * vol; X[b] += EPS0 * (e1z * e2z + e1r * e2r) * vol;
            }
          }
          for (let b = 1; b <= nb; b++) { U[b] += U[b - 1]; X[b] += X[b - 1]; }
          const self1 = (KV * A * A) / (2 * a), self2 = (KV * B * B) / (2 * a), inter = (KV * A * B) / d;
          res = { U, X, nb, dR, self1, self2, inter, tot: self1 + self2 + inter, a, d, A, B, Q: A + B };
        };
        const uAt = (x, y) => {
          const { a, d, A, B } = res, d1 = Math.hypot(x + d / 2, y), d2 = Math.hypot(x - d / 2, y); let ez = 0, er = 0;
          if (d1 > a) { const k = (KV * A) / (d1 ** 3); ez += k * (x + d / 2); er += k * y; } if (d2 > a) { const k = (KV * B) / (d2 ** 3); ez += k * (x - d / 2); er += k * y; }
          return 0.5 * EPS0 * (ez * ez + er * er);
        };
        let info = {};
        v.render(() => {
          const k = [q1.value, q2.value, aS.value, dS.value].join('|'); if (k !== key) { key = k; compute(); }
          const { a, d, A, B } = res, uref = 0.5 * EPS0 * ((KV * Math.max(Math.abs(A), Math.abs(B))) / (a * a)) ** 2;
          s.heat((x, y) => { const u = uAt(x, y); return u > 0 ? Math.log10(u) : -99; }, { range: [Math.log10(uref) - 7, Math.log10(uref)], cmap: 'theme', color: 'orange', res: 3, key });
          s.circle(0, 0, Rs.value, { color: 'ink', width: 2, dash: [6, 4] });
          for (const [c, q] of [[-d / 2, A], [d / 2, B]]) { s.circle(c, 0, a, { color: sgnCol(q), width: 2.5, fill: sgnCol(q), fillAlpha: 0.12 }); s.text(q > 0 ? '+' : '−', c, 0, { align: 'center', size: 14, weight: 700, color: sgnCol(q) }); }
          s.text('R', 0, Rs.value + 0.35, { align: 'center', size: 12, color: 'ink' });
          // cumulative curves
          const pts = [], cr = []; for (let b = 1; b <= res.nb; b += 1) { pts.push([b * res.dR, res.U[b]]); cr.push([b * res.dR, res.X[b]]); }
          const lo = Math.min(0, res.inter, ...cr.map((p) => p[1]), ...pts.map((p) => p[1])), hi = Math.max(res.tot, res.inter, 0, ...pts.map((p) => p[1])); const pad = 0.1 * (hi - lo || 1);
          sp.setView([0, RM], [lo - pad, hi + pad]);
          sp.hline(0, { color: 'faint', width: 1 });
          sp.hline(res.tot, { color: 'green', width: 1.8, dash: [7, 4] }); sp.hline(res.inter, { color: 'orange', width: 1.4, dash: [4, 4] });
          sp.fn((R) => res.tot - (KV * res.Q * res.Q) / (2 * R), { domain: [Math.max(res.d / 2 + a + 0.3, 1.5), RM], color: 'ink', width: 1.4, dash: [2, 3], n: 80 });
          sp.fn((R) => res.inter - (KV * res.A * res.B) / R, { domain: [Math.max(res.d / 2 + a + 0.3, 1.5), RM], color: 'orange', width: 1.2, dash: [2, 3], n: 80 }); sp.path(cr, { color: 'orange', width: 2.4 }); sp.path(pts, { color: 'accent', width: 2.8 });
          sp.vline(Rs.value, { color: 'ink', width: 1.2, dash: [4, 3] });
          const bi = Math.min(res.nb, Math.round(Rs.value / res.dR));
          sp.dot(Rs.value, res.U[bi], { r: 5, color: 'accent' }); sp.dot(Rs.value, res.X[bi], { r: 5, color: 'orange' });
          info = { Ur: res.U[bi], Xr: res.X[bi], Uend: res.U[res.nb] };
        });
        v.legend([['accent', 'energy inside radius $R$'], ['orange', 'cross term $\\varepsilon_0\\!\\int\\mathbf E_1\\!\\cdot\\mathbf E_2$'], ['green', 'exact total', { dash: true }], ['orange', '$q_1q_2/4\\pi\\varepsilon_0d$', { dash: true }], ['ink', 'total $-\\,Q^2/8\\pi\\varepsilon_0R$', { dash: true }]]);
        v.readout(() => `Exact: self-energies $${v.fix(res.self1, 2)}$ + $${v.fix(res.self2, 2)}$ nJ, interaction $${v.fix(res.inter, 2)}$ nJ — total $${v.fix(res.tot, 2)}$ nJ (grows like $1/a$ as the shells shrink).\nInside $R=${v.fix(Rs.value, 1)}$ cm: $${v.fix(info.Ur, 2)}$ nJ (total), cross term $${v.fix(info.Xr, 2)}$ nJ; at $R=8$ cm the integral has reached ${v.fix((100 * info.Uend) / res.tot, 1)} % of the exact total.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Paradox',
      name: 'Infinite self-energy of a point charge',
      statement: String.raw`The field energy $\frac{\varepsilon_0}{2}\int E^2d\tau$ of a charge $q$ spread over a sphere of radius $R$ is $\dfrac{q^2}{8\pi\varepsilon_0R}$ for a thin shell and $\dfrac{3}{5}\dfrac{q^2}{4\pi\varepsilon_0R}$ for a uniform ball. It diverges as $R\to0$, so a true point charge would hold infinite field energy — yet the formula $W=\frac12\sum_{i<j}$ of em-2.10 never counted it. Setting the energy of a shell equal to the electron’s rest energy $m_ec^2$ gives the **classical electron radius** $r_e=e^2/4\pi\varepsilon_0m_ec^2\approx2.82$ fm; experiments show the electron is smaller than $10^{-22}$ m, where the classical energy would be $10^{7}$ times its rest energy.`,
      idea: String.raw`A point charge’s field $q/4\pi\varepsilon_0r^2$ squared and integrated over $4\pi r^2dr$ gives $\int dr/r^2$, which diverges at $r\to0$ (em-2.11): the energy per decade of radius is concentrated in the decade nearest the charge, by a factor ten per decade. The two-charge energy of em-2.10 silently drops each charge’s self-energy as a constant. Classically the paradox is unresolved (Lorentz and Abraham tried to make all the electron’s mass electromagnetic and met the $4/3$ problem); in quantum field theory the self-energy is absorbed into the measured mass by renormalization, and its leftover dependence on scale is observable.`,
      caption: String.raw`Slide the radius $R$ of the charged sphere over 14 decades and watch its field energy (line) climb like $1/R$ on log–log axes. Gold marks where it equals the electron’s rest energy: $r_e$ for a shell is $1.41$ fm — half the classical radius of 2.82 fm, hence the small differences between the two models. Vertical marks give the proton radius, the Bohr radius and the experimental upper bound on the size of the electron. Right: wherever you put $R$, 90 % of the field energy lies within the first factor of 10 outside the surface, and 99 % within a factor 100.`,
      scope: String.raw`Classical electrostatics only; below about the Compton wavelength ($386$ fm) quantum effects change the picture, so $r_e$ is a scale, not the radius of an electron.`,
      deps: ['em-2.11'],
      refs: ['Feynman II ch. 28', 'Griffiths §2.4'],
      tags: ['self-energy', 'electron'],
      viz(v) {
        const C = v.M.CONST, ke = 1.439964547; // MeV·fm per e²
        const s = v.stage({ x: [1e-8, 1e6], y: [1e-6, 1e10], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, weight: 1.35, xlabel: 'radius $R$ of the charged sphere (fm)', ylabel: 'field energy (MeV)', title: 'field energy of a charged sphere against its radius' });
        const sb = v.stage({ x: [0.4, 6.6], y: [0, 100], height: 360, axes: 'box', gutter: true, weight: 0.9, xlabel: 'shell of radii $[10^{k}R,\\,10^{k+1}R)$', ylabel: 'share of the field energy (%)', xticks: [[1, 'inside'], [2, '0'], [3, '1'], [4, '2'], [5, '3'], [6, '4']], title: 'where the energy is: per decade of radius' });
        const model = v.select('charge sits on', [{ value: 0.5, label: 'a thin shell ($\\tfrac12$)' }, { value: 0.6, label: 'a uniform ball ($\\tfrac35$)' }], 0.5);
        const R = v.slider('radius $R$', 1e-8, 1e6, 100, { log: true, fmt: (x) => (x >= 1e-2 && x < 1e5 ? `${+x.toPrecision(3)} fm` : `${x.toExponential(1)} fm`) });
        const E = (r) => (model.value * ke) / r;
        const marks = [[0.84, 'proton', 'purple', 3e8, 'right'], [2.818, '$r_e$', 'gold', 1.2e9, 'left'], [52918, 'Bohr', 'teal', 3e8, 'right'], [1e-7, 'electron bound', 'red', 3e8, 'left']];
        let inner = 0;
        v.render(() => {
          const k = model.value;
          s.fn((r) => (k * ke) / r, { color: 'accent', width: 3, n: 200 });
          s.hline(0.51099895, { color: 'gold', width: 1.8, dash: [6, 4] }); s.text('$m_ec^2=0.511$ MeV', 3e-8, 2.2, { size: 12, color: 'gold', align: 'left' });
          for (const [x, label, col, yy, al] of marks) { s.vline(x, { color: col, width: 1.3, dash: [3, 4], alpha: 0.8 }); s.text(label, al === 'left' ? x * 1.6 : x / 1.6, yy, { size: 11.5, color: col, align: al }); }
          const Re = (k * ke) / 0.51099895; s.dot(Re, 0.51099895, { r: 7, color: 'gold' });
          s.dot(R.value, E(R.value), { r: 8, color: 'accent' });
          // decade shares
          inner = k === 0.5 ? 0 : 1 / 6;
          const bars = [inner * 100]; for (let j = 0; j < 5; j++) bars.push((1 - inner) * 100 * 0.9 * Math.pow(0.1, j));
          sb.bars(bars.slice(inner ? 0 : 1).map((x, i) => x), { x0: inner ? 1 : 2, dx: 1, color: 'accent' });
          bars.forEach((b, i) => { if (i === 0 && !inner) return; sb.text(`${b >= 1 ? v.fix(b, 0) : v.fix(b, 1)} %`, i + 1, b + 4, { align: 'center', size: 11.5, color: 'ink' }); });
          
        });
        v.readout(() => `$R=${v.sci(R.value, 3)}$ fm: field energy $U=${v.sci(E(R.value), 3)}$ MeV $= ${v.sci(E(R.value) / 0.51099895, 3)}\\,m_ec^2$.\nU equals the electron’s rest energy at $R=${v.fix((model.value * ke) / 0.51099895, 3)}$ fm (${model.value === 0.5 ? 'half' : '0.6 times'} of $e^2/4\\pi\\varepsilon_0 m_ec^2=${v.fix(ke / 0.51099895, 3)}$ fm); at the experimental bound, $10^{-7}$ fm, it would be $${v.sci((model.value * ke) / 1e-7 / 0.51099895, 2)}$ rest energies.`);
      },
    },
  ],
};
