// Condensed Matter Physics — Chapter 2: Transport and semiclassical dynamics (items 2.1–2.7; 2.8–2.14 in ch02-b.js)
// Units of the lattice models: a = ħ = e = 1, hopping t = 1 (see ch02.shared.js).
import { TAU, hallTransport, bgRho, NDENS, lorenzMoments } from './ch02.shared.js';

const PI = Math.PI;

export default {
  collection: 'cm',
  chapter: 2,
  title: 'Transport and semiclassical dynamics',
  summary: String.raw`Wave packets built from one band move at the band’s group velocity while forces change their crystal momentum; band curvature becomes an effective mass, and nearly full bands behave as positive holes — which explains the anomalous Hall coefficients that defeated the free-electron model. The Wiedemann–Franz and Matthiessen rules organize transport, screening and Fermi-liquid ideas explain why independent electrons work so well, and in a magnetic field electrons orbit the Fermi surface, giving cyclotron resonance, quantum oscillations that map Fermi surfaces, and the integer quantum Hall effect.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Band velocity',
      statement: String.raw`For an electron in band $n$ with energy $E_n(\mathbf k)$, the **band (group) velocity** is
$$\mathbf v_n(\mathbf k)=\frac1\hbar\,\nabla_{\mathbf k}E_n(\mathbf k).$$
It is the velocity of a wave packet $\psi=\int d\mathbf k\,A(\mathbf k)\,e^{i\mathbf k\cdot\mathbf r-iE_n(\mathbf k)t/\hbar}u_{n\mathbf k}(\mathbf r)$ whose weight $A$ is concentrated in a narrow range around $\mathbf k_0$. It is periodic in the reciprocal lattice, vanishes at the band extrema and at the zone boundary of a symmetric 1D band, and is generally *not* $\hbar\mathbf k/m$.`,
      idea: String.raw`In a stationary Bloch state $\psi_{n\mathbf k}$ the phase advances as $e^{-iE_n t/\hbar}$, so the phase of the packet at $\mathbf r$ is $\mathbf k\cdot\mathbf r-E_n(\mathbf k)t/\hbar$. Constructive interference of the nearby $\mathbf k$ occurs where this phase is stationary in $\mathbf k$, i.e. where $\mathbf r=\nabla_{\mathbf k}E_n\,t/\hbar$ — the same stationary-phase argument as for any dispersive wave (qm-9.7 supplies the Bloch states, cm-1.2 the crystal momentum). Because $E_n$ is periodic in $\mathbf k$, the velocity is bounded by the bandwidth, and at a Bragg plane the two standing waves of cm-1.3 carry no net current, so $\mathbf v=0$.`,
      caption: String.raw`Tight-binding chain, $E(k)=-2\cos k$ (optionally with next-nearest hopping). **Drag the handle** along the band to choose the central wave vector $k_0$; the tangent line and the velocity panel show $v=dE/dk$. The packet in the bottom panel (thin line: the real part, shaded: the density) moves at that velocity: the orange marker is the group-velocity prediction, the dashed grey line moves at the phase velocity $E/k$. Drag $k_0$ to the zone boundary $\pm\pi$: the packet stays put although $k_0$ is far from $0$. Narrow the packet in $k$ and it widens in space, and spreads more slowly.`,
      scope: String.raw`Wave packets narrow enough in $\mathbf k$ to see one band only, and smooth on the scale of the lattice; dispersion makes the packet spread, and interband transitions are ignored (valid while the field is far below the gap scale).`,
      deps: ['cm-1.2'],
      refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
      tags: ['band velocity', 'wave packet', 'group velocity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Group_velocity' },
      viz(v) {
        const M = v.M, L = 512, X0 = -80, TMAX = 60;
        const bandSel = v.select('band', [{ value: 'cos', label: 'cosine' }, { value: 'nnn', label: 'with next-nearest hopping' }], 'cos');
        const sg = v.slider('packet width $\\sigma_k$', 0.06, 0.4, 0.15, { step: 0.01 });
        const E = (k) => (bandSel.value === 'cos' ? -2 * Math.cos(k) : -2 * Math.cos(k) - 0.8 * Math.cos(2 * k));
        const dE = (k) => (bandSel.value === 'cos' ? 2 * Math.sin(k) : 2 * Math.sin(k) + 1.6 * Math.sin(2 * k));
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const sB = v.stage({ x: [-PI, PI], y: [-3.2, 2.6], axes: 'box', gutter: true, height: 270, xlabel: '$k$', ylabel: '$E/t$', xticks: tk, title: 'band $E(k)$', weight: 1 });
        const sV = v.stage({ x: [-PI, PI], y: [-3.3, 3.3], axes: 'box', gutter: true, height: 270, xlabel: '$k$', ylabel: '$v=dE/dk$', xticks: tk, title: 'band velocity', weight: 1 });
        const sP = v.stage({ x: [-128, 128], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 250, xlabel: 'site $x$', ylabel: 'ψ', full: true, title: 'wave packet' });
        const h = sB.handle(0.9, E(0.9), { color: 'accent', r: 8, label: 'k₀', constrain: (x) => { const k = M.clamp(x, -PI, PI); return [k, E(k)]; } });
        const re = new Float64Array(L), im = new Float64Array(L);
        let cen = 0, tNow = 0;
        v.animate((t) => {
          const k0 = h.x; h.y = E(k0);
          sB.fn(E, { color: 'accent', width: 2.2 });
          sB.line(k0 - 0.7, E(k0) - 0.7 * dE(k0), k0 + 0.7, E(k0) + 0.7 * dE(k0), { color: 'orange', width: 2 });
          sB.dot(k0, E(k0), { r: 5, color: 'accent' });
          sV.fn(dE, { color: 'orange', width: 2.2 });
          sV.dot(k0, dE(k0), { r: 6, color: 'orange' });
          sV.hline(0, { color: 'faint', width: 1 });
          // packet at time t: ψ(x) = Σ_k A(k) e^{ik(x−X0)−iE t}
          const s = sg.value;
          for (let m = 0; m < L; m++) {
            const kk = (TAU * (m < L / 2 ? m : m - L)) / L, a = Math.exp(-((kk - k0) ** 2) / (2 * s * s)) + Math.exp(-((kk - k0 + TAU) ** 2) / (2 * s * s)) + Math.exp(-((kk - k0 - TAU) ** 2) / (2 * s * s));
            const ph = -kk * X0 - E(kk) * t;
            re[m] = a * Math.cos(ph); im[m] = a * Math.sin(ph);
          }
          M.ifft(re, im);
          let pk = 0, sw = 0, sx = 0; const pts = [], env = [];
          for (let j = 0; j < L; j++) { const x = j < L / 2 ? j : j - L; const p = re[j] * re[j] + im[j] * im[j]; pk = Math.max(pk, p); sw += p; sx += p * x; }
          cen = sx / sw;
          const sc = 1 / Math.sqrt(pk);
          for (let x = -128; x <= 128; x++) { const j = (x + L) % L; pts.push([x, re[j] * sc]); env.push([x, Math.sqrt(re[j] * re[j] + im[j] * im[j]) * sc]); }
          sP.path(env.map((p) => [p[0], p[1]]), { color: 'accent', width: 1.2, fill: 'accent', fillAlpha: 0.12 });
          sP.path(env.map((p) => [p[0], -p[1]]), { color: 'accent', width: 1.2 });
          sP.path(pts, { color: 'ink', width: 1.2, alpha: 0.8 });
          const vg = dE(k0), xg = X0 + vg * t, vph = Math.abs(k0) > 1e-3 ? E(k0) / k0 : 0;
          sP.vline(xg, { color: 'orange', width: 2 });
          sP.text('group', xg, 1.08, { color: 'orange', size: 11, align: 'center' });
          if (Math.abs(vph * t) < 150) { const xp = X0 + vph * t; sP.vline(xp, { color: 'muted', width: 1.2, dash: true }); }
          sP.vline(X0, { color: 'faint', width: 1, dash: true });
          tNow = t;
        }, { period: TMAX, still: 40 });
        v.readout(() => {
          const k0 = h.x, vg = dE(k0), t = tNow;
          const meas = t > 2 ? (cen - X0) / t : NaN;
          return `$k_0=${v.fix(k0 / PI, 2)}\\,\\pi/a$ · $v_g=\\frac1\\hbar dE/dk=${v.fix(vg, 3)}\\,ta/\\hbar$ · measured centroid velocity $\\langle x\\rangle/t=${isFinite(meas) ? v.fix(meas, 3) : '—'}$ · phase velocity $E/k=${Math.abs(k0) > 1e-3 ? v.fix(E(k0) / k0, 3) : '—'}$ · free electron of the same $k_0$ would have $\\hbar k_0/m^*$ only near the band bottom.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Law',
      name: 'Semiclassical equations of motion',
      credit: 'Bloch, 1929; Zener, 1934',
      statement: String.raw`A wave packet in band $n$ with centre $(\mathbf r,\mathbf k)$ obeys
$$\dot{\mathbf r}=\frac1\hbar\nabla_{\mathbf k}E_n(\mathbf k),\qquad \hbar\dot{\mathbf k}=-e\big(\mathbf E+\dot{\mathbf r}\times\mathbf B\big)\quad(\text{charge }-e),$$
with $\mathbf k$ defined modulo reciprocal-lattice vectors. The band index is conserved, $E_n(\mathbf k)$ already contains the periodic potential, and the external fields change the **crystal momentum** $\hbar\mathbf k$ uniformly, not the real momentum. Consequences: in a static field a filled band carries no current, and in a lattice without scattering the electron oscillates in real space (Bloch oscillations) instead of accelerating without limit.`,
      idea: String.raw`The force changes $\hbar\mathbf k$ at the same rate as it would for a free particle (the lattice force is already inside $E_n(\mathbf k)$), while the position follows the group velocity of cm-2.1. Since $E_n$ is periodic, $\mathbf k$ marching uniformly across the zone makes $\mathbf v(\mathbf k(t))$ periodic with the Bloch period $2\pi\hbar/(eEa)$, and the position is $x(t)=[E(k(t))-E(k(0))]/(eE)$: it oscillates with amplitude set by the bandwidth. Scattering resets $k$ and restores a steady drift (Drude).`,
      caption: String.raw`A force $F$ acts on an electron in the band $E=-2\cos k$ ($ta=\hbar=1$). **Left:** the crystal momentum slides uniformly around the zone; the dot is the electron. **Middle and right:** the velocity $\dot x=2\sin k$ and the position $x$ over time. Increase $F$ to shorten the Bloch period, decrease it to widen the oscillation ($\Delta x=4t/F$). Switch **scattering** on: at random times $k$ is reset to $0$ and the electron drifts, with the average velocity compared with the Drude value $F\tau/m^*$; press **Resample** for another random history.`,
      scope: String.raw`Slowly varying fields (the force changes $\mathbf k$ little over a lattice spacing and the field is far too weak to cause interband (Zener) tunnelling), a single isolated band, and no scattering during the observed times unless the scattering switch is on.`,
      deps: ['cm-2.1'],
      refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
      tags: ['semiclassical dynamics', 'bloch oscillations', 'crystal momentum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bloch_oscillations' },
      viz(v) {
        const M = v.M, TM = 60;
        const F = v.slider('force $F$', 0.05, 1.2, 0.15, { step: 0.01 });
        const sc = v.toggle('scattering', false);
        const tau = v.slider('mean time $\\tau$', 0.5, 40, 2, { step: 0.5 });
        let seed = 11; v.button('Resample', () => { seed += 17; });
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const sB = v.stage({ x: [-PI, PI], y: [-2.5, 2.5], axes: 'box', gutter: true, height: 280, xlabel: '$k$', ylabel: '$E/t$', xticks: tk, title: 'band and crystal momentum', weight: 1 });
        const sV = v.stage({ x: [0, TM], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 280, xlabel: 'time $t$', ylabel: 'velocity', title: 'velocity $\\dot x=2\\sin k$', weight: 1 });
        const sX = v.stage({ x: [0, TM], y: [-1, 1], axes: 'box', gutter: true, height: 280, xlabel: 'time $t$', ylabel: 'position $x$', title: 'position', weight: 1 });
        const h = 0.05, N = Math.round(TM / h);
        let tr = null, key = '';
        const run = () => {
          const f = F.value, k = [], x = [], vv = [], scat = []; let kk = 0, xx = 0;
          const r = v.rng(seed); let next = sc.value ? -Math.log(1 - r()) * tau.value : Infinity;
          for (let i = 0; i <= N; i++) {
            const t = i * h; k.push(kk); x.push(xx); vv.push(2 * Math.sin(kk));
            if (t >= next) { kk = 0; scat.push(t); next = t - Math.log(1 - r()) * tau.value; }
            // midpoint step
            const km = kk + 0.5 * h * f; xx += 2 * Math.sin(km) * h; kk += h * f;
          }
          return { k, x, v: vv, scat };
        };
        v.animate((t) => {
          const kt = `${F.value}|${sc.value}|${tau.value}|${seed}`;
          if (kt !== key) { tr = run(); key = kt; }
          tau.el.hidden = !sc.value;
          const i = Math.min(N, Math.floor(t / h)), wrap = (k) => ((((k + PI) % TAU) + TAU) % TAU) - PI;
          sB.fn((k) => -2 * Math.cos(k), { color: 'accent', width: 2.2 });
          // trail of the last stretch of k
          const trail = []; for (let j = Math.max(0, i - 40); j <= i; j++) trail.push(wrap(tr.k[j]));
          trail.forEach((k, j) => { if (j) sB.dot(k, -2 * Math.cos(k), { r: 2, color: 'gold', alpha: 0.3 + 0.7 * j / trail.length }); });
          const kc = wrap(tr.k[i]); sB.dot(kc, -2 * Math.cos(kc), { r: 8, color: 'orange' });
          sB.vline(PI, { color: 'faint', dash: true, width: 1 }); sB.vline(-PI, { color: 'faint', dash: true, width: 1 });
          const xs = tr.x.slice(0, N + 1), lo = Math.min(...xs), hi = Math.max(...xs), pad = 0.1 * (hi - lo) + 0.5;
          sX.setView([0, TM], [Math.min(lo, 0) - pad, hi + pad]);
          sV.path(tr.v.slice(0, i + 1).map((y, j) => [j * h, y]), { color: 'orange', width: 2 });
          sV.path(tr.v.map((y, j) => [j * h, y]), { color: 'faint', width: 1, alpha: 0.5 });
          sX.path(tr.x.map((y, j) => [j * h, y]), { color: 'faint', width: 1, alpha: 0.5 });
          sX.path(tr.x.slice(0, i + 1).map((y, j) => [j * h, y]), { color: 'accent', width: 2.2 });
          sV.dot(i * h, tr.v[i], { r: 5, color: 'orange' }); sX.dot(i * h, tr.x[i], { r: 5, color: 'accent' });
          for (const ts of tr.scat) { sV.vline(ts, { color: 'red', width: 1, alpha: 0.35 }); sX.vline(ts, { color: 'red', width: 1, alpha: 0.35 }); }
        }, { period: TM, still: 45 });
        v.readout(() => {
          if (!tr) return '';
          const f = F.value;
          if (!sc.value) {
            const lo = Math.min(...tr.x), hi = Math.max(...tr.x);
            return `Bloch period $2\\pi\\hbar/Fa=${v.fix(TAU / f, 1)}$ · observed oscillation of $x$: peak to peak $${v.fix(hi - lo, 2)}$, predicted $\\text{bandwidth}/F=4/F=${v.fix(4 / f, 2)}$ · $\\hbar\\dot k=F$ holds exactly: $k(T)=FT$ (mod $2\\pi$).`;
          }
          const vd = tr.x[N] / TM, drude = 2 * f * tau.value;
          return `average drift velocity $\\langle\\dot x\\rangle=${v.fix(vd, 3)}$ over ${tr.scat.length} collisions · Drude $F\\tau/m^*=${v.fix(drude, 3)}$ with $m^*=\\hbar^2/E''(0)=1/2$ (valid for $F\\tau\\ll1$; for $F\\tau\\gtrsim\\pi$ the velocity saturates at the band maximum $2ta/\\hbar$).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Effective-mass tensor',
      statement: String.raw`Near a point $\mathbf k_0$ of band $n$, the semiclassical acceleration is $\dot v_i=\sum_j (M^{-1})_{ij}\,F_j/$ with the **inverse effective-mass tensor**
$$\big(M^{-1}\big)_{ij}(\mathbf k)=\frac1{\hbar^2}\frac{\partial^2E_n}{\partial k_i\,\partial k_j},$$
a real symmetric matrix. Its eigenvectors are the principal axes and its eigenvalues are inverse principal masses $1/m_1^*,1/m_2^*$. At a band minimum both are positive, at a maximum both are negative (**negative mass**), at a saddle they have opposite signs. The mass equals the free mass only for a free electron; in a band it can be much smaller (semiconductors) or much larger (narrow $d$ and $f$ bands).`,
      idea: String.raw`From $\hbar\dot{\mathbf k}=\mathbf F$ and $\mathbf v=\hbar^{-1}\nabla_{\mathbf k}E$ (cm-2.2) one gets $\dot v_i=\hbar^{-1}\sum_j\partial_i\partial_jE\,\dot k_j=\hbar^{-2}\sum_j\partial_i\partial_jE\,F_j$ by the chain rule: Newton’s law with a matrix mass. Being a Hessian, $M^{-1}$ is symmetric and diagonalized by an orthogonal change of axes (the spectral theorem, ladr-7.29), and the second-order Taylor expansion $E\approx E_0+\tfrac12\hbar^2\,\delta\mathbf k^{\mathsf T}M^{-1}\delta\mathbf k$ says that the constant-energy surfaces near the extremum are ellipsoids with axes $\propto\sqrt{m_i^*}$. On a local chart where the band energy is $C^2$, compose the differentiable trajectory $t\mapsto\mathbf k(t)$ with each component of $\nabla E$. The multivariable chain rule (pma 9.15) makes its time derivative the Hessian applied to $\dot{\mathbf k}$. Substituting $\hbar\dot{\mathbf k}=\mathbf F$ gives precisely the inverse-mass acceleration law; it does not require the Hessian to be invertible.`,
      caption: String.raw`The band is $E=-2t_x\cos k_x-2t_y\cos k_y-2t'\cos(k_x+k_y)$. **Drag the point** on the colour map (energy, low to high) or use the **presets**. The ellipse (or hyperbola) is the constant-energy curve of the parabolic approximation, the arrows are the principal axes (length $\propto 1/\sqrt{|\lambda|}$), and the right panel cuts the true band along both axes against its parabola with curvature $\hbar^2/m^*$. Make $t_y\ne t_x$ to get an anisotropic mass; add $t'$ to rotate the axes. Near the top the curvatures flip sign; at the saddle the masses have opposite signs.`,
      scope: String.raw`Valid as long as the force varies little across the packet and $\mathbf k$ stays within the region where the parabolic expansion is good; the exact acceleration needs the full $E(\mathbf k)$, as the cuts on the right show.`,
      deps: ['cm-2.2', 'ladr-7.29', 'pma-9.15'],
      refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
      tags: ['effective mass', 'band curvature', 'tensor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Effective_mass_(solid-state_physics)' },
      viz(v) {
        const M = v.M;
        const ty = v.slider('hopping ratio $t_y/t_x$', 0.2, 1.5, 0.5, { step: 0.01 });
        const tp = v.slider('diagonal hopping $t^\\prime$', -0.5, 0.5, 0.15, { step: 0.01 });
        const E = (kx, ky) => -2 * Math.cos(kx) - 2 * ty.value * Math.cos(ky) - 2 * tp.value * Math.cos(kx + ky);
        const hess = (kx, ky) => { const c = Math.cos(kx + ky); return [2 * Math.cos(kx) + 2 * tp.value * c, 2 * tp.value * c, 2 * ty.value * Math.cos(ky) + 2 * tp.value * c]; };
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const sM = v.stage({ x: [-PI, PI], y: [-PI, PI], equal: true, axes: 'box', gutter: true, height: 370, xlabel: '$k_x$', ylabel: '$k_y$', xticks: tk, yticks: tk, title: 'energy over the Brillouin zone', weight: 1.1 });
        const sC = v.stage({ x: [-1.6, 1.6], y: [-0.5, 3], axes: 'box', gutter: true, height: 370, xlabel: 'displacement $s$ along an axis', ylabel: '$E-E_0$', title: 'cuts along the principal axes', weight: 1 });
        const h = sM.handle(0.2, 0.15, { color: 'gold', r: 8, label: 'k', constrain: { x: [-PI, PI], y: [-PI, PI] } });
        const pre = v.select('go to', [{ value: 'free', label: 'drag' }, { value: 'bot', label: 'band bottom Γ' }, { value: 'top', label: 'band top M' }, { value: 'sad', label: 'saddle X' }], 'free', {
          onChange: (val) => { if (val === 'bot') h.set(0, 0); if (val === 'top') h.set(PI, PI); if (val === 'sad') h.set(PI, 0); },
        });
        v.legend([['gold', 'point $\\mathbf k_0$'], ['orange', 'parabola ($E_0+\\tfrac12\\hbar^2\\delta k^T M^{-1}\\delta k$)'], ['ink', 'constant-energy lines of the true band']]);
        let info = null;
        v.render(() => {
          const key = `${ty.value}|${tp.value}`;
          sM.heat(E, { cmap: 'viridis', range: [-4.2, 4.2], res: 3, key, rect: [-PI, -PI, PI, PI] });
          const k0x = h.x, k0y = h.y, e0 = E(k0x, k0y), [a, b, c] = hess(k0x, k0y);
          const eg = M.eigSym([[a, b], [b, c]]), lam = eg.values.slice().sort((p, q) => q - p), vec = lam.map((l) => { const i = eg.values.indexOf(l); return eg.vecs[i]; });
          const quad = (x, y) => e0 + 0.5 * (a * (x - k0x) ** 2 + 2 * b * (x - k0x) * (y - k0y) + c * (y - k0y) ** 2);
          sM.contour(E, [-2.8, -2, -1, 0, 1, 2, 2.8], { color: 'ink', width: 0.8, alpha: 0.35 });
          sM.clip(() => sM.contour(quad, [e0 + 0.5, e0 - 0.5, e0 + 0.15, e0 - 0.15], { color: 'orange', width: 2 }));
          for (let i = 0; i < 2; i++) {
            const len = Math.min(1.4, 0.6 / Math.sqrt(Math.abs(lam[i]) + 0.04)), e = vec[i];
            sM.arrow(k0x, k0y, k0x + e[0] * len, k0y + e[1] * len, { color: i ? 'teal' : 'pink', width: 2.2 });
            sM.arrow(k0x, k0y, k0x - e[0] * len, k0y - e[1] * len, { color: i ? 'teal' : 'pink', width: 2.2 });
          }
          const cols = ['pink', 'teal'];
          for (let i = 0; i < 2; i++) {
            const e = vec[i];
            sC.fn((s) => E(k0x + s * e[0], k0y + s * e[1]) - e0, { color: cols[i], width: 2.4 });
            sC.fn((s) => 0.5 * lam[i] * s * s, { color: cols[i], width: 1.6, dash: [5, 4] });
          }
          { let lo = 0; for (let i = 0; i < 2; i++) for (let s = -1.6; s <= 1.6; s += 0.1) lo = Math.min(lo, E(k0x + s * vec[i][0], k0y + s * vec[i][1]) - e0, 0.5 * lam[i] * s * s); sC.setView([-1.6, 1.6], [Math.max(-4, lo) - 0.3, 3]); }
          sC.corner('solid: true band · dashed: parabola', 'tl', { color: 'muted' });
          info = { lam, vec };
        });
        v.readout(() => {
          if (!info) return '';
          const [l1, l2] = info.lam, m = (l) => (Math.abs(l) < 1e-3 ? '\\infty' : v.fix(1 / l, 2));
          const kind = l1 > 0 && l2 > 0 ? 'minimum-like: both masses positive (electron-like)' : l1 < 0 && l2 < 0 ? 'maximum-like: both masses negative' : 'saddle: masses of opposite sign';
          const ang = (Math.atan2(info.vec[0][1], info.vec[0][0]) * 180) / PI;
          return `principal inverse masses $\\hbar^2/m^*=${v.fix(l1, 2)},\\ ${v.fix(l2, 2)}$ (units $ta^2$) → $m_1^*=${m(l1)}$, $m_2^*=${m(l2)}$ $(\\hbar^2/ta^2)$ · first axis at $${v.fix(((ang % 180) + 180) % 180, 0)}^\\circ$ from $k_x$ · ${kind}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Holes',
      credit: 'Peierls, 1929; Heisenberg, 1931',
      statement: String.raw`A **hole** is an unoccupied state $\mathbf k_h$ in an otherwise filled band. As far as every measurable response goes, it behaves as a single particle with
$$\mathbf k_{\rm hole}=-\mathbf k_h,\qquad E_{\rm hole}=-E(\mathbf k_h),\qquad \mathbf v_{\rm hole}=\mathbf v(\mathbf k_h),\qquad \text{charge }+e,\qquad m_{\rm hole}=-m^*(\mathbf k_h).$$
Near a band maximum, where the electron mass is negative, the hole mass is positive and the hole accelerates along the applied electric field. The Hall coefficient of a nearly full band is therefore positive, $R_H\approx+1/(p\,e)$ with $p$ the hole density.`,
      idea: String.raw`A completely filled band carries no current, $\sum_{\mathbf k}\mathbf v(\mathbf k)=0$, because $\mathbf v$ is odd and $E$ is periodic (cm-2.1). The current of the band with one state missing is therefore $-e\sum_{\mathbf k\ne\mathbf k_h}\mathbf v=+e\,\mathbf v(\mathbf k_h)$: a positive charge moving with the velocity the missing electron would have had. Since every electron’s $\mathbf k$ advances by the same $\Delta\mathbf k$ under a field (cm-2.2), the vacancy moves with it, and with the curvature of cm-2.3 its acceleration has the opposite sign to that of an electron there. Pauli exclusion (qm-10.13) is what makes the filled-band bookkeeping exact.`,
      caption: String.raw`A ring of $N=25$ allowed states $k=2\pi m/N$ of the band $E=-2\cos k$, all filled except the hole (**click** any state to empty or fill it). **Drag the slider** "field applied": every electron’s $k$ shifts together, so the vacancy slides too. The readouts add up the occupied velocities one by one: the filled band contributes nothing and the whole current equals $+v(k_h)$. Park the hole at the band top ($k=\pi$): its mass is positive. The right panel shows the Hall coefficient (in units of $-1/ne$) for the same filling in a square-lattice band: it changes sign once the band is more than half full.`,
      scope: String.raw`A band that is full except for a few states, with the hole concentration low enough that the hole sits where $E(\mathbf k)$ is smooth and the bands above it are far away; scattering rates of holes are then those of the missing electrons.`,
      deps: ['cm-2.3', 'qm-10.13'],
      refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
      tags: ['holes', 'filled band', 'hall sign'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Electron_hole' },
      viz(v) {
        const NS = 25, ks = Array.from({ length: NS }, (_, m) => (TAU * (m - 12)) / NS);
        const occ = ks.map((_, m) => m !== 20);
        const dk = v.slider('field applied: shift $\\Delta k$ (units $\\pi/a$)', 0, 2, 0, { step: 0.02 });
        v.button('Hole at the top', () => { occ.fill(true); occ[0] = false; });
        v.button('Hole at the bottom', () => { occ.fill(true); occ[12] = false; });
        v.button('Half filled', () => { occ.forEach((_, i) => { occ[i] = i % 2 === 0; }); });
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const E = (k) => -2 * Math.cos(k), wrap = (k) => ((((k + PI) % TAU) + TAU) % TAU) - PI;
        const sB = v.stage({ x: [-PI, PI], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 320, xlabel: '$k$', ylabel: '$E/t$', xticks: tk, title: 'occupied states of the band', weight: 1.05 });
        const sH = v.stage({ x: [0, 2], y: [-10, 3], axes: 'box', gutter: true, height: 320, xlabel: 'electrons per site $n$', ylabel: '$R_H/R_H^{\\rm free}$', title: 'Hall coefficient, square-lattice band', weight: 0.95 });
        const curve = []; for (let i = 1; i < 40; i++) { const n = (i * 2) / 40; curve.push([n, -n * hallTransport(0, n, 0.1, 64).RH]); }
        sB.onClick((x) => { let best = 0, bd = 9; ks.forEach((k, i) => { const d = Math.abs(wrap(k - x)); if (d < bd) { bd = d; best = i; } }); occ[best] = !occ[best]; });
        let st = null;
        v.legend([['accent', 'electron'], ['red', 'hole (missing electron)', { dot: true }]]);
        v.render(() => {
          sB.fn(E, { color: 'faint', width: 1.4 });
          const d = dk.value * PI; let J = 0, K = 0, cnt = 0, sumFree = 0;
          ks.forEach((k, i) => {
            const kk = wrap(k + d);
            if (occ[i]) { sB.dot(kk, E(kk), { r: 5, color: 'accent' }); J += -2 * Math.sin(kk); K += k + d; cnt++; sumFree += Math.sin(kk); }
            else { sB.dot(kk, E(kk), { r: 7, color: 'red', hollow: true }); }
          });
          const holes = ks.map((k, i) => (occ[i] ? null : wrap(k + d))).filter((x) => x != null);
          if (holes.length === 1) { const kh = holes[0]; sB.tex('k_h', kh, E(kh) + (E(kh) > 0 ? -0.5 : 0.55), { color: 'red', size: 14 }); }
          const n = (2 * cnt) / NS;
          st = { J, cnt, holes, n, ratio: -n * hallTransport(0, Math.min(1.98, Math.max(0.02, n)), 0.1, 64).RH, K };
          sH.path(curve, { color: 'accent', width: 2.4 });
          sH.hline(1, { color: 'green', dash: true, width: 1.2 }); sH.hline(0, { color: 'faint', width: 1 });
          sH.dot(Math.min(1.98, Math.max(0.02, n)), Math.max(-9.6, Math.min(2.8, st.ratio)), { r: 7, color: 'gold' });
          sH.text('electron-like: $R_H=-1/ne$', 0.06, 1.7, { color: 'green', size: 11 });
          sH.text('hole-like: $R_H>0$', 0.45, -5, { color: 'red', size: 11, align: 'left' });
        });
        v.readout(() => {
          if (!st) return '';
          const h1 = st.holes.length === 1 ? st.holes[0] : null;
          const me = h1 == null ? null : 2 * Math.cos(h1);
          return `occupied states ${st.cnt} of ${NS} · total current $-e\\sum v=${v.fix(st.J, 3)}\\,(e\\,ta/\\hbar)$` + (h1 == null ? '' : ` · single hole at $k_h=${v.fix(h1 / PI, 2)}\\pi$: $+e\\,v(k_h)=${v.fix(2 * Math.sin(h1), 3)}$ ✓ · electron mass there $\\hbar^2/E''=${v.fix(1 / me, 2)}$, hole mass $${v.fix(-1 / me, 2)}$`) + ` · filling $n=${v.fix(st.n, 2)}$: $R_H/R_H^{\\rm free}=${v.fix(st.ratio, 2)}$ (${st.ratio < 0 ? 'hole-like, positive $R_H$' : 'electron-like'}).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Positive Hall coefficients: holes rescue band theory',
      credit: 'E. H. Hall, 1879 (Hall effect); band interpretation follows the cited solid-state text',
      statement: String.raw`In the Drude–Sommerfeld free-electron model the Hall coefficient of a metal with $n$ conduction electrons per volume is $R_H=-1/(nec)$ (Gaussian) or $-1/ne$ (SI), always negative and fixed by the valence. Measurements agree for the alkali metals (approximately the free-electron sign and magnitude) but not for some multivalent metals, including Be, Mg, Al and In, which show **positive** $R_H$ whose magnitude can differ from $1/ne$ by a large factor. Band theory explains this: the sign is that of the carriers on the Fermi surface, hole-like where the Fermi surface encloses empty states of a nearly full band.`,
      idea: String.raw`With a constant relaxation time, the Boltzmann equation gives $R_H$ as an average of the inverse-mass tensor (cm-2.3) over the Fermi surface, $\sigma_{yx}\propto\oint (v_y\partial_{k_x}v_x-v_x\partial_{k_y}v_x)v_y\,dk/|v|$ (see em-7.5 for the Hall geometry). On a Fermi surface curving around the zone centre the inverse mass is positive and one recovers $-1/ne$; on a surface curving the other way (hole pockets near the zone corner) the sign flips and $|R_H|\to1/(pe)$ for a nearly full band (cm-2.4).`,
      caption: String.raw`**Left:** Hall-coefficient values from Ashcroft–Mermin Table 1.4 (p. 15), shown as the ratio $R_H/R_H^{\rm free}$ where $R_H^{\rm free}=-1/(n_{\rm val}e)$ is the free-electron prediction for the valence electron density; the green line is the free-electron value, $1$. **Click** a metal to compare. **Right:** the same ratio computed from a toy square-lattice band for a chosen filling: it is $1$ at low density, passes through $0$ at half filling and becomes large and negative (positive $R_H$) near a full band. Drag **filling $n$** and **$t^\prime$**: the orange line marks the selected metal’s tabulated ratio and the dots where the toy model reaches it.`,
      scope: String.raw`The table gives approximate moderate-/high-field limits (fields of order $10^4$ G) at very low temperature in carefully prepared samples, as specified in Ashcroft–Mermin Table 1.4. The square-lattice calculation is a weak-field, constant-relaxation-time toy model, so it illustrates signs and does not fit the table’s different field regime; real Fermi surfaces are multiply connected with electron and hole parts, and $R_H$ is anisotropic, field-dependent for compensated metals (Be, Zn, Cd) and sensitive to the scattering time on each sheet, so the toy band illustrates the sign, not the numbers.`,
      deps: ['em-7.5', 'cm-2.4'],
      refs: ['Ashcroft–Mermin (1976), Table 1.4, p. 15; https://djvu.online/file/Z9JgjkEDnjXjL', 'Ashcroft–Mermin ch. 3', 'Kittel ch. 6'],
      tags: ['hall effect', 'holes', 'band theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hall_effect' },
      viz(v) {
        // −1/(R_H n e c) as tabulated by Ashcroft–Mermin (1976), Table 1.4, p. 15: moderate to high fields, very low T (checked against the original table, 2026-10-16)
        const DATA = { Li: 0.8, Na: 1.2, K: 1.1, Rb: 1.0, Cs: 0.9, Cu: 1.5, Ag: 1.3, Au: 1.5, Be: -0.2, Mg: -0.4, Al: -0.3, In: -0.3 };
        const names = Object.keys(DATA), ratio = (m) => 1 / DATA[m];
        const sel = v.select('metal', names, 'Na');
        const tp = v.slider('$t^\\prime/t$', -0.4, 0.4, 0, { step: 0.02 });
        const nS = v.slider('filling $n$ (electrons per site)', 0.05, 1.95, 0.4, { step: 0.01 });
        const sD = v.stage({ x: [0.3, names.length + 0.7], y: [-6.5, 2.6], axes: 'box', gutter: true, height: 350, xlabel: 'metal', ylabel: '$R_H/R_H^{\\rm free}$', xticks: names.map((m, i) => [i + 1, m]), title: 'Hall values: moderate to high fields', weight: 1.15 });
        const sM = v.stage({ x: [0, 2], y: [-6.5, 2.6], axes: 'box', gutter: true, height: 350, xlabel: 'electrons per site $n$', ylabel: '$R_H/R_H^{\\rm free}$', title: 'toy band: Hall coefficient vs filling', weight: 0.95 });
        sD.onClick((x) => { const i = Math.max(0, Math.min(names.length - 1, Math.round(x) - 1)); sel.set(names[i]); });
        let key = '', curve = [];
        let hit = [], rrNow = 0;
        v.render(() => {
          const kk = String(tp.value);
          if (kk !== key) { curve = []; for (let i = 1; i < 60; i++) { const n = (i * 2) / 60; curve.push([n, -n * hallTransport(tp.value, n, 0.1, 64).RH]); } key = kk; }
          names.forEach((m, i) => { const r = ratio(m); sD.bars([r], { x0: i + 1, dx: 1, color: m === sel.value ? 'gold' : r < 0 ? 'red' : 'accent' }); });
          sD.hline(1, { color: 'green', dash: true, width: 1.4 }); sD.hline(0, { color: 'ink', width: 1 });
          sD.text('free-electron value', names.length + 0.6, 1.15, { color: 'green', size: 11, align: 'right' });
          sM.path(curve, { color: 'accent', width: 2.4 });
          sM.hline(1, { color: 'green', dash: true, width: 1.2 }); sM.hline(0, { color: 'faint', width: 1 });
          const r0 = ratio(sel.value); sM.hline(Math.max(-6.4, r0), { color: 'orange', width: 1.6, dash: [5, 3] });
          hit = []; for (let i = 1; i < curve.length; i++) { const a = curve[i - 1], b = curve[i]; if ((a[1] - r0) * (b[1] - r0) <= 0 && a[1] !== b[1]) hit.push(a[0] + ((r0 - a[1]) * (b[0] - a[0])) / (b[1] - a[1])); }
          hit.forEach((n) => sM.dot(n, Math.max(-6.4, r0), { r: 6, color: 'orange' }));
          const n = nS.value, tr = hallTransport(tp.value, n, 0.1, 64), rr = -n * tr.RH;
          sM.dot(n, Math.max(-6.4, Math.min(2.5, rr)), { r: 7, color: 'gold' });
          sM.text('electron-like', 0.15, 1.5, { color: 'green', size: 11 }); sM.text('hole-like', 1.75, -5.6, { color: 'red', size: 11, align: 'center' });
          rrNow = rr;
        });
        v.readout(() => `${sel.value}: tabulated $R_H/R_H^{\\rm free}=${v.fix(ratio(sel.value), 2)}$ (${DATA[sel.value] < 0 ? 'positive $R_H$: hole-like carriers' : 'electron-like'}) · toy band at $n=${v.fix(nS.value, 2)}$: ${v.fix(rrNow, 2)} · the toy band reaches the tabulated ratio at ${hit.length ? hit.map((n) => 'n≈' + v.fix(n, 2)).join(', ') : 'no filling (the toy band cannot reproduce it)'}.`);
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Law',
      name: 'Wiedemann–Franz law',
      credit: 'Wiedemann & Franz, 1853; Lorenz, 1872; Sommerfeld, 1927',
      statement: String.raw`For a degenerate metal with elastic scattering and a transport function smooth on the scale $k_BT$ around the Fermi energy, the electronic thermal conductivity $\kappa_e$ and electrical conductivity obey the low-temperature **Wiedemann–Franz law**:
$$\frac{\kappa_e}{\sigma T}\longrightarrow L_0=\frac{\pi^2}{3}\Big(\frac{k_B}{e}\Big)^2=2.44\times10^{-8}\ \mathrm{W\,\Omega\,K^{-2}}.$$
Drude’s classical treatment gives $L=\tfrac32(k_B/e)^2=1.11\times10^{-8}$. The selected 273 K measurements span $2.12$–$2.64\times10^{-8}$. Impurity-dominated low temperatures and quasi-elastic phonon scattering at higher temperatures often approach $L_0$; inelastic scattering can suppress it substantially. The lattice contribution must be separated when comparing the electronic law with measured total heat conduction.`,
      idea: String.raw`Both conductivities are Fermi-surface integrals with the same relaxation time: $\sigma=e^2\tau\,g(E_F)v_F^2/3$ and $\kappa=\tau\,v_F^2\,c_v/3$ with $c_v=\tfrac{\pi^2}{3}k_B^2 T\,g(E_F)$ (thermo-8.10). The ratio cancels $\tau$, $v_F$ and $g$ and leaves $\pi^2k_B^2/3e^2$. Only electrons within $k_BT$ of $E_F$ carry heat (em-6.4 gives $\sigma$), and each carries $(E-\mu)\sim k_BT$ of it, hence the factor $\int x^2(-f')dx=\pi^2/3$. Drude’s agreement was a coincidence of two errors: his $c_v$ is about $T_F/T$ times too large and $v^2$ about $T_F/T$ times too small.`,
      caption: String.raw`**Left:** Lorenz numbers at 273 K from Ashcroft–Mermin Table 1.6 (p. 21) for several metals with the Drude value (orange) and the Sommerfeld value (green); **click** a metal with a density entry to select it for the free-electron readout. **Right:** why the number is universal: the weight $-\partial f/\partial E$ of the electrons that conduct charge (blue) and $x^2$ times it for heat (orange), $x=(E-\mu)/k_BT$. Their ratio of areas is exactly $\pi^2/3$; change the positive transport weight to $\Sigma(x)=1+\alpha\tanh x$, $|\alpha|<1$, and the open-circuit Lorenz ratio decreases quadratically in $\alpha$. This chosen toy weight varies across the thermal window; it is not a fitted metal. The orange second-moment curve is scaled by $3/\pi^2$; the open-circuit ratio also subtracts the squared first moment: $L/(k_B/e)^2=K_2/K_0-(K_1/K_0)^2$. The readout also compares classical and degenerate heat capacities and speeds.`,
      scope: String.raw`The universal value is a degenerate, smooth-transport limit for electronic heat conduction measured at zero electric current. Inelastic scattering, sharp energy dependence and additional heat carriers can alter the ratio. A deviation alone does not establish non-Fermi-liquid behavior. The right panel illustrates transport moments, not the temperature dependence of a particular metal.`,
      deps: ['em-6.4', 'thermo-8.10'],
      refs: ['Ashcroft–Mermin (1976), Table 1.6, p. 21; https://djvu.online/file/Z9JgjkEDnjXjL', 'Ashcroft–Mermin ch. 1', 'Ashcroft–Mermin ch. 2', 'Franz & Wiedemann (1853), pp. 497–531; https://doi.org/10.1002/andp.18531650802', 'Lorenz (1872), pp. 429–452; https://doi.org/10.1002/andp.18722231107', 'Sommerfeld (1927), Naturwissenschaften 15, 825–832; https://doi.org/10.1007/BF01505083', 'Lavasani, Bulmash & Das Sarma (2019), Secs. I–II and Appendix B; https://arxiv.org/abs/1810.05646'],
      tags: ['thermal conductivity', 'lorenz number', 'sommerfeld'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wiedemann%E2%80%93Franz_law' },
      viz(v) {
        const M = v.M, C = M.CONST;
        // L (10⁻⁸ W Ω K⁻²) at 273 K, checked against Ashcroft–Mermin Table 1.6, p. 21 (2026-10-16).
        const LZ = { Li: 2.22, Na: 2.12, K: 2.23, Cu: 2.20, Ag: 2.31, Au: 2.32, Zn: 2.28, Cd: 2.49, Al: 2.14, Pb: 2.64, Sn: 2.48 };
        const names = Object.keys(LZ);
        const sel = v.select('metal (free-electron comparison)', names.filter(m => NDENS[m]), 'Cu');
        const Tk = v.slider('temperature $T$ (K)', 50, 800, 300, { step: 10 });
        const al = v.slider('transport asymmetry $\\alpha$', -0.95, 0.95, 0, { step: 0.05 });
        const L0 = (Math.PI ** 2 / 3) * (C.kB / C.e) ** 2 * 1e8, LD = 1.5 * (C.kB / C.e) ** 2 * 1e8;
        const sD = v.stage({ x: [0.3, names.length + 0.7], y: [0, 3.4], axes: 'box', gutter: true, height: 340, xlabel: 'metal', ylabel: '$L=\\kappa/\\sigma T\\ (10^{-8}\\,\\mathrm{W\\Omega K^{-2}})$', xticks: names.map((m, i) => [i + 1, m]), title: 'Lorenz numbers at 273 K (Table 1.6)', weight: 1.1 });
        const sW = v.stage({ x: [-8, 8], y: [0, 0.5], axes: 'box', gutter: true, height: 340, xlabel: '$x=(E-\\mu)/k_BT$', ylabel: 'weight', title: 'who carries charge and heat', weight: 1 });
        sD.onClick((x) => { const m = names[Math.max(0, Math.min(names.length - 1, Math.round(x) - 1))]; if (NDENS[m]) sel.set(m); });
        v.legend([['accent', 'Table 1.6 (273 K)'], ['green', 'Sommerfeld $\\pi^2k_B^2/3e^2$', { dash: true }], ['orange', 'Drude $\\tfrac32 k_B^2/e^2$', { dash: true }]]);
        let K = null;
        v.render(() => {
          names.forEach((m, i) => sD.bars([LZ[m]], { x0: i + 1, dx: 1, color: 'accent' }));
          sD.hline(L0, { color: 'green', width: 2, dash: [6, 4] }); sD.hline(LD, { color: 'orange', width: 2, dash: [6, 4] });
          const a = al.value, mf = (x) => 1 / (4 * Math.cosh(x / 2) ** 2), sg = (x) => 1 + a * Math.tanh(x);
          K = lorenzMoments(a);
          sW.fn((x) => mf(x) * sg(x), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.15 });
          sW.fn((x) => (mf(x) * sg(x) * x * x * 3) / (Math.PI ** 2), { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.12 });
          sW.text('charge weight', 0, .42, { color: 'accent', size: 12, align: 'center' });
          sW.text('scaled second moment', 0, .37, { color: 'orange', size: 12, align: 'center' });
        });
        v.readout(() => {
          const T = Tk.value, n = NDENS[sel.value] * 1e28, kF = Math.cbrt(3 * Math.PI ** 2 * n), EF = (C.hbar * kF) ** 2 / (2 * C.me), TF = EF / C.kB;
          const cv = (Math.PI ** 2 * T) / (3 * TF), v2 = (2 * TF) / (3 * T);
          return `$\\int x^2(-f')dx\\big/\\!\\int(-f')dx=${v.fix(K.area, 4)}$ vs $\\pi^2/3=${v.fix(Math.PI ** 2 / 3, 4)}$ · with $\\Sigma=1+\\alpha\\tanh x$: $L/L_0=${v.fix(K.ratio, 4)}$ · Sommerfeld $L_0=${v.fix(L0, 3)}$, Drude $${v.fix(LD, 3)}$, tabulated mean ${v.fix(M.mean(Object.values(LZ)), 2)} ($\\times10^{-8}$) · ${sel.value} at ${T} K: $T_F=${v.fix(TF / 1e4, 2)}\\times10^4$ K; Sommerfeld/Drude heat capacity $=${v.fix(cv, 4)}$, $v_F^2/\\langle v^2\\rangle=${v.fix(v2, 1)}$, product $${v.fix(cv * v2, 3)}$ ($=2\\pi^2/9$, the factor between $L_0$ and $L_{\\rm Drude}$).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Law',
      name: 'Matthiessen’s rule',
      credit: 'Matthiessen & Vogt, 1864',
      statement: String.raw`When electrons are scattered independently by impurities and by lattice vibrations, their scattering rates add and so do the resistivities,
$$\rho(T)=\rho_{\rm imp}+\rho_{\rm ph}(T),$$
where the **residual resistivity** $\rho_{\rm imp}$ is independent of temperature and proportional to the impurity concentration, and $\rho_{\rm ph}(T)$ is a property of the pure host. Two samples of the same metal then have *parallel* $\rho(T)$ curves, with a $T$-independent difference. In the Bloch–Grüneisen form $\rho_{\rm ph}\propto T^5$ at $T\ll\Theta_D$ and $\propto T$ at $T\gtrsim\Theta_D$.`,
      idea: String.raw`In the relaxation-time approximation (em-6.4) $\rho=m/ne^2\tau$ and independent collision channels give $1/\tau=1/\tau_{\rm imp}+1/\tau_{\rm ph}(T)$. Impurity scattering is elastic and temperature-independent, phonon scattering freezes out as $T\to0$ (few phonons, and only small-angle scattering), producing $T^5$, while at high $T$ the number of phonons is $\propto T$. The rule can fail when the scattering rate is not the same for all carriers: with two groups of carriers in parallel the conductivities add and the resistivities do not.`,
      caption: String.raw`Resistivity (in units of the phonon resistivity at $T=\Theta_D$) of three samples of one metal with different impurity levels, using the Bloch–Grüneisen function for the phonons. **Drag the Debye temperature** and the two impurity levels; the right-hand plot shows the difference of the curves, which is constant. Switch to **two parallel bands** (impurities scatter mostly the second band) and the curves are no longer parallel: the difference drifts with $T$, which is the failure of the rule. The readout gives the residual resistance ratio $\rho(300\,\mathrm K)/\rho(4\,\mathrm K)$ of each sample.`,
      scope: String.raw`Independent scattering mechanisms acting on the same carriers on one isotropic Fermi surface. Deviations of a few percent are routine in real metals (anisotropic scattering, multiband conduction, Kondo and size effects), and the rule is only a first approximation at high impurity concentrations.`,
      deps: ['em-6.4'],
      refs: ['Ashcroft–Mermin ch. 16'],
      tags: ['resistivity', 'phonons', 'impurities'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matthiessen%27s_rule' },
      viz(v) {
        const Th = v.slider('Debye temperature $\\Theta_D$ (K)', 80, 400, 200, { step: 5 });
        const r1 = v.slider('impurity level, sample B', 0, 0.6, 0.12, { step: 0.01 });
        const r2 = v.slider('impurity level, sample C', 0, 1.2, 0.5, { step: 0.01 });
        const two = v.toggle('two parallel bands', false);
        const TM = 300, NP = 120;
        const sR = v.stage({ x: [0, TM], y: [0, 3.2], axes: 'box', gutter: true, height: 340, xlabel: 'temperature $T$ (K)', ylabel: '$\\rho/\\rho_{\\rm ph}(\\Theta_D)$', title: 'resistivity of three samples', weight: 1.1 });
        const sD = v.stage({ x: [0, TM], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 340, xlabel: 'temperature $T$ (K)', ylabel: '$\\rho_{\\rm C}-\\rho_{\\rm A}$', title: 'difference of two samples (Matthiessen: constant)', weight: 0.9 });
        v.legend([['accent', 'A (purest)'], ['orange', 'B'], ['red', 'C (most impure)']]);
        let info = null;
        v.render(() => {
          const th = Th.value, ts = [], ph = [];
          for (let i = 0; i <= NP; i++) { const T = (i * TM) / NP; ts.push(T); ph.push(T < 1e-6 ? 0 : bgRho(T, th)); }
          // one band: ρ = ρ0 + ρph. Two bands in parallel (conductivities add): band 1 carries the phonon resistivity with weight 1 and the impurities;
          // band 2 is a clean, lightly coupled band (phonon coefficient 0.35, impurities at 10% of the band-1 level).
          const rho = (imp, i) => (two.value ? 1 / (1 / (0.25 + imp + ph[i]) + 1 / (0.35 + 0.1 * imp + 0.35 * ph[i])) : imp + ph[i]);
          const lv = [0.02, r1.value, r2.value], cols = ['accent', 'orange', 'red'];
          const curves = lv.map((imp) => ts.map((T, i) => [T, rho(imp, i)]));
          const top = Math.max(...curves[2].map((p) => p[1])) * 1.1;
          sR.setView([0, TM], [0, Math.max(1, top)]);
          curves.forEach((c, i) => sR.path(c, { color: cols[i], width: 2.4 }));
          const dif = ts.map((T, i) => [T, curves[2][i][1] - curves[0][i][1]]);
          const dmin = Math.min(...dif.map((p) => p[1])), dmax = Math.max(...dif.map((p) => p[1]));
          sD.setView([0, TM], [Math.min(0, dmin) - 0.1, Math.max(dmax, 0.5) + 0.2]);
          sD.path(dif, { color: 'purple', width: 2.4 }); sD.hline(dif[NP][1], { color: 'faint', dash: true, width: 1 });
          info = { rrr: curves.map((c) => c[NP][1] / Math.max(c[1][1], 1e-9)), drift: dmax - dmin, d0: dif[2][1], d1: dif[NP][1] };
        });
        v.readout(() => info && `residual resistance ratios $\\rho(300)/\\rho(\\approx5\\,\\mathrm K)$: A ${v.fix(info.rrr[0], 1)}, B ${v.fix(info.rrr[1], 1)}, C ${v.fix(info.rrr[2], 1)} · difference C−A varies by $${v.fix(info.drift, 3)}$ over 0–300 K (${info.drift < 0.005 ? 'constant: Matthiessen holds' : 'not constant: Matthiessen’s rule fails'}) · low-$T$ resistivity of A rises as $T^5$ and above $\\Theta_D$ linearly.`);
      },
    },
  ],
};
