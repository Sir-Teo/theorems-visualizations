// Condensed Matter Physics — Chapter 2: Transport and semiclassical dynamics (items 2.8–2.14; 2.1–2.7 in ch02.js)
import { TAU, thomas, fermi, NDENS, qheAt, QHE_D } from './ch02.shared.js';

const PI = Math.PI;

// ------------------------------------------------------------------ 2.8 helper: nonlinear Thomas–Fermi around a point charge
// Units: lengths in 1/k_TF, energies in E_F. w(x) = eφ/E_F obeys (x w)'' = x·(2/3)[(1+w)^{3/2} − 1], x w → q at x → 0 and 0 at ∞.
// Linearised: w = q e^{−x}/x. Returns the grid x, the potential w and the cumulative screening charge Q(x)/q.
function tfSolve(q, h = 0.02, N = 480) {
  const x = new Float64Array(N + 1), u = new Float64Array(N + 1); for (let i = 0; i <= N; i++) { x[i] = i * h; u[i] = 0; }
  const phi = (w) => (2 / 3) * (Math.pow(Math.max(1 + w, 0), 1.5) - 1), dphi = (w) => (w > -1 ? Math.sqrt(1 + w) : 0);
  const a = new Float64Array(N - 1), b = new Float64Array(N - 1), c = new Float64Array(N - 1), d = new Float64Array(N - 1);
  const resid = () => { let m = 0; for (let i = 1; i < N; i++) m = Math.max(m, Math.abs(u[i - 1] - 2 * u[i] + u[i + 1] - h * h * x[i] * phi(u[i] / x[i]))); return m; };
  const steps = Math.max(1, Math.ceil(Math.abs(q) / 0.4));
  for (let st = 1; st <= steps; st++) { // continuation in the strength of the charge: each solution starts the next
    const qq = (q * st) / steps; u[0] = qq; if (st === 1) for (let i = 1; i <= N; i++) u[i] = qq * Math.exp(-x[i]);
    for (let it = 0; it < 60; it++) {
      for (let i = 1; i < N; i++) {
        const w = u[i] / x[i], r = u[i - 1] - 2 * u[i] + u[i + 1] - h * h * x[i] * phi(w);
        a[i - 1] = 1; c[i - 1] = 1; b[i - 1] = -2 - h * h * dphi(w); d[i - 1] = -r;
      }
      const du = thomas(a, b, c, d), old = Float64Array.from(u), r0 = resid(); let lam = 1;
      for (let k = 0; k < 12; k++) { for (let i = 1; i < N; i++) u[i] = old[i] + lam * du[i - 1]; if (resid() < r0 || r0 < 1e-12) break; lam /= 2; }
      if (resid() < 1e-11) break;
    }
  }
  const w = new Float64Array(N + 1), Q = new Float64Array(N + 1);
  w[0] = Infinity; let acc = 0;
  for (let i = 1; i <= N; i++) { w[i] = u[i] / x[i]; acc += h * x[i] * x[i] * phi(w[i]); Q[i] = acc / q; }
  return { x, w, Q, h, N };
}

// ------------------------------------------------------------------ 2.11 helper: semiclassical orbits on a square-lattice band
// E = −2cos kx − 2 ty cos ky − 4 tp cos kx cos ky. ṙ = ∇E, k̇ = B ẑ×∇E (ħ = e = 1, so the orbit period is 2π m_c/B).
const bandE = (kx, ky, ty, tp) => -2 * Math.cos(kx) - 2 * ty * Math.cos(ky) - 4 * tp * Math.cos(kx) * Math.cos(ky);
const bandG = (kx, ky, ty, tp) => [2 * Math.sin(kx) + 4 * tp * Math.sin(kx) * Math.cos(ky), 2 * ty * Math.sin(ky) + 4 * tp * Math.cos(kx) * Math.sin(ky)];
function startOnContour(E0, ty, tp) {
  const f = (kx, ky) => bandE(kx, ky, ty, tp) - E0;
  const lineN = [(s) => [s, 0], (s) => [0, s], (s) => [s, s], (s) => [PI, s], (s) => [s, PI]];
  for (const L of lineN) {
    let prev = f(...L(0));
    for (let i = 1; i <= 400; i++) {
      const s = (PI * i) / 400, cur = f(...L(s));
      if (prev * cur <= 0) { let lo = (PI * (i - 1)) / 400, hi = s; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (f(...L(lo)) * f(...L(m)) <= 0) hi = m; else lo = m; } return L((lo + hi) / 2); }
      prev = cur;
    }
  }
  return null;
}
function traceOrbit(E0, ty, tp, B = 1, maxSteps = 6000) {
  const k0 = startOnContour(E0, ty, tp); if (!k0) return null;
  const vel = (k) => { const g = bandG(k[0], k[1], ty, tp); return [-B * g[1], B * g[0]]; };
  // step with a fixed arclength in k so that slow regions near saddles are traversed in a bounded number of steps
  if (Math.hypot(...bandG(k0[0], k0[1], ty, tp)) < 0.03) return { sep: true, k0, pts: [[k0[0], k0[1], 0]], pr: [[0, 0]], closed: false, open: false, t: 0, area: 0 };
  const v00 = vel(k0), n00 = Math.hypot(v00[0], v00[1]) || 1, u0 = [v00[0] / n00, v00[1] / n00]; let sPrev = 0;
  const ds = 0.02; let k = k0.slice(), t = 0; const pts = [[k[0], k[1], 0]], pr = [[0, 0]]; let r = [0, 0], closed = false, open = false;
  const corr = (p) => { // project back onto the contour E = E0 (Newton on the gradient direction)
    for (let i = 0; i < 2; i++) { const e = bandE(p[0], p[1], ty, tp) - E0, g = bandG(p[0], p[1], ty, tp), n2 = g[0] * g[0] + g[1] * g[1] || 1; p = [p[0] - (e * g[0]) / n2, p[1] - (e * g[1]) / n2]; }
    return p;
  };
  for (let i = 0; i < maxSteps; i++) {
    const v1 = vel(k), sp = Math.hypot(v1[0], v1[1]) || 1e-9, dt = ds / sp;
    const k2 = [k[0] + 0.5 * dt * v1[0], k[1] + 0.5 * dt * v1[1]], v2 = vel(k2), k3 = [k[0] + 0.5 * dt * v2[0], k[1] + 0.5 * dt * v2[1]], v3 = vel(k3), k4 = [k[0] + dt * v3[0], k[1] + dt * v3[1]], v4 = vel(k4);
    const kn = corr([k[0] + (dt / 6) * (v1[0] + 2 * v2[0] + 2 * v3[0] + v4[0]), k[1] + (dt / 6) * (v1[1] + 2 * v2[1] + 2 * v3[1] + v4[1])]);
    const g = bandG(k[0], k[1], ty, tp); r = [r[0] + g[0] * dt, r[1] + g[1] * dt]; t += dt; k = kn;
    const sNow = (k[0] - k0[0]) * u0[0] + (k[1] - k0[1]) * u0[1];
    if (i > 20 && sPrev < 0 && sNow >= 0 && Math.hypot(k[0] - k0[0], k[1] - k0[1]) < 0.4) { // crossed the starting section again: interpolate the closing point
      const f = -sPrev / (sNow - sPrev), L = pts[pts.length - 1], Rr = pr[pr.length - 1];
      pts.push([L[0] + f * (k[0] - L[0]), L[1] + f * (k[1] - L[1]), L[2] + f * (t - L[2])]); pr.push([Rr[0] + f * (r[0] - Rr[0]), Rr[1] + f * (r[1] - Rr[1])]); t = pts[pts.length - 1][2]; closed = true; break;
    }
    sPrev = sNow; pts.push([k[0], k[1], t]); pr.push(r.slice());
    if (Math.hypot(k[0] - k0[0], k[1] - k0[1]) > 2 * PI + 0.5) { open = true; break; }
  }
  let area = 0; if (closed) for (let i = 0; i < pts.length - 1; i++) area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  area /= 2;
  return { pts, pr, t, closed, open, area, k0 };
}

export default {
  collection: 'cm',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Model',
      name: 'Thomas–Fermi screening',
      credit: 'Thomas, 1927; Fermi, 1927',
      statement: String.raw`In a degenerate electron gas of density of states $g(E_F)$ (per volume, both spins), a weak external charge density $\rho_{\rm ext}$ induces a screening cloud so that the total potential obeys $\nabla^2\phi=k_{TF}^2\phi$ away from the source, with
$$k_{TF}^2=\frac{e^2}{\varepsilon_0}\,g(E_F)=\frac{e^2}{\varepsilon_0}\frac{3n}{2E_F}.$$
For a point charge $Q$ the potential is the **screened Coulomb (Yukawa)** potential $\phi(r)=\dfrac{Q}{4\pi\varepsilon_0 r}e^{-k_{TF}r}$, with the induced charge exactly cancelling $Q$. In metals $\lambda_{TF}=1/k_{TF}\approx0.5\ \text{Å}$, comparable to the interatomic spacing, so long-range Coulomb forces between electrons are cut off.`,
      idea: String.raw`If the potential $\phi(\mathbf r)$ varies slowly on the scale of the Fermi wavelength, the electrons are locally a free gas in equilibrium at the global chemical potential $\mu$, so the local kinetic energy available is $\mu+e\phi(\mathbf r)$ and the local density is $n(\mu+e\phi)$ (cm-1.1 gives $n(E_F)$ and $g(E_F)$). To first order the induced density is $\delta n\approx g(E_F)\,e\phi$ (thermo-8.4 for the filling, cm-1.1 for $g(E_F)$). Substituting in Poisson’s equation gives the Helmholtz-type equation $\nabla^2\phi=k_{TF}^2\phi$, whose spherically symmetric solution decaying at infinity is the Yukawa form (vcalc-9.4 supplies the divergence theorem that fixes the prefactor).`,
      caption: String.raw`A point test charge in a metal. **Left:** the potential energy $e\phi/E_F$ against distance in units of $1/k_{TF}$ on log axes: bare Coulomb ($\propto1/r$, grey), linearised Thomas–Fermi $e^{-r}/r$ (green) and the full nonlinear Thomas–Fermi solution (blue), computed numerically. **Right:** the induced electron density in a plane through the charge (red: extra electrons, blue: depleted, compressed colour scale). Increase the **charge strength** $q$ ($\propto Q$) until the linear theory fails; make it **negative** and large to carve an electron-free hole. Pick a **metal** to read $\lambda_{TF}$ in ångström.`,
      scope: String.raw`$q\ll1$ (potential energy $\ll E_F$) for the linear formula; slowly varying potentials on the scale of $1/k_F$ — the cloud is fuzzy at short range and shows Friedel oscillations at $2k_F$, which Thomas–Fermi ignores; zero temperature; static charges only.`,
      deps: ['cm-1.1', 'vcalc-9.4'],
      refs: ['Ashcroft–Mermin ch. 17'],
      tags: ['screening', 'thomas-fermi', 'coulomb'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thomas%E2%80%93Fermi_model' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const q = v.slider('charge strength $q$', 0.05, 12, 2, { log: true, sig: 2 });
        const sgn = v.select('test charge', [{ value: '+', label: 'positive (attracts electrons)' }, { value: '-', label: 'negative (repels)' }], '+');
        const metal = v.select('metal', ['Na', 'Cu', 'Al'], 'Cu');
        const sP = v.stage({ x: [0.03, 5], y: [3e-3, 3e2], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'distance $k_{TF}r$', ylabel: '$|e\\phi|/E_F$', title: 'screened potential', weight: 1.1 });
        const sM = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 340, title: 'induced electron density (plane through the charge)', weight: 0.9 });
        v.legend([['muted', 'bare Coulomb $q/x$', { dash: true }], ['green', 'linear Thomas–Fermi $qe^{-x}/x$'], ['accent', 'nonlinear Thomas–Fermi']]);
        let S = null, key = '';
        const wAt = (x) => { const i = x / S.h, j = Math.min(S.N - 1, Math.max(1, Math.floor(i))), f = i - j; return S.w[j] * (1 - f) + S.w[j + 1] * f; };
        v.render(() => {
          const qq = q.value * (sgn.value === '+' ? 1 : -1), k = `${qq}`;
          if (k !== key) { S = tfSolve(qq); key = k; }
          const xs = []; for (let i = 1; i <= S.N; i++) xs.push(S.x[i]);
          const aq = Math.abs(qq);
          sP.fn((x) => aq / x, { color: 'muted', width: 1.6, dash: [5, 4] });
          sP.fn((x) => (aq * Math.exp(-x)) / x, { color: 'green', width: 2 });
          sP.path(xs.map((x, i) => [x, Math.abs(S.w[i + 1])]), { color: 'accent', width: 2.6 });
          sP.vline(1, { color: 'faint', width: 1, dash: true }); sP.text('$1/k_{TF}$', 1.05, 1.5e2, { size: 11, color: 'muted' });
          sM.heat((x, y) => { const r = Math.hypot(x, y); if (r < 0.04) return 0; const w = wAt(Math.min(r, 4.9)), dn = Math.pow(Math.max(1 + w, 0), 1.5) - 1; return Math.sign(dn) * Math.log10(1 + 20 * Math.abs(dn)); }, { cmap: 'theme-diverging', neg: 'blue', pos: 'red', range: [-2, 2], res: 3, key: k });
          sM.dot(0, 0, { r: 6, color: sgn.value === '+' ? 'red' : 'blue' }); sM.circle(0, 0, 1, { color: 'ink', width: 1.2, dash: [4, 4], fill: false });
          sM.text('$r=1/k_{TF}$', 0.75, 1.15, { size: 11, color: 'ink' });
        });
        v.readout(() => {
          if (!S) return '';
          const n = NDENS[metal.value] * 1e28, kF = Math.cbrt(3 * PI ** 2 * n), kTF = Math.sqrt((4 * kF) / (PI * C.a0)), idx = (x) => Math.round(x / S.h);
          const aq = Math.abs(q.value);
          return `${metal.value}: $k_F=${v.fix(kF / 1e10, 2)}\\ \\text{Å}^{-1}$, $\\lambda_{TF}=1/k_{TF}=${v.fix(1e10 / kTF, 2)}\\ \\text{Å}$ · screening charge inside $r=1/k_{TF}$: ${v.fix(S.Q[idx(1)] * 100, 0)}% of $q$, inside $3/k_{TF}$: ${v.fix(S.Q[idx(3)] * 100, 1)}%, total ${v.fix(S.Q[S.N] * 100, 1)}% (sum rule: 100%) · at $x=1$: nonlinear $|w|=${v.fix(Math.abs(S.w[idx(1)]), 3)}$ vs linear $${v.fix(aq * Math.exp(-1), 3)}$ ${aq < 0.3 ? '(agree)' : '(linear theory has broken down)'}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Fermi-liquid quasiparticles',
      credit: 'Landau, 1956–1958',
      statement: String.raw`In a Fermi liquid the low-energy excitations of the interacting electron system are in one-to-one correspondence with those of the free Fermi gas: **quasiparticles** with the same quantum numbers $(\mathbf k,\sigma)$, charge and spin, but renormalized mass $m^*$ and interactions among them. A quasiparticle at energy $\varepsilon$ above the Fermi surface decays by scattering a sea electron into an excited pair with a rate
$$\frac1\tau(\varepsilon,T)\propto\frac{\varepsilon^2+(\pi k_BT)^2}{1+e^{-\varepsilon/k_BT}},$$
which vanishes faster than $\varepsilon$ itself as $\varepsilon\to0$ and $T\to0$, so quasiparticles become sharp exactly where they matter. The resistivity from electron–electron scattering therefore grows as $T^2$.`,
      idea: String.raw`Each scattering takes the incoming electron (energy $\varepsilon>0$) and a sea electron (energy $e_1<0$) into two empty states $e_2,e_3>0$ with $e_1+\varepsilon=e_2+e_3$ (energy conservation) and momentum conservation, which in a Fermi gas is an extra constraint that the angular integral turns into a constant. By Pauli exclusion (thermo-8.4; cm-1.1 for the Fermi sea) the available $e_1$ lie in $(-\varepsilon,0)$ and, for each, $e_2\in(0,\varepsilon+e_1)$: a triangle of area $\varepsilon^2/2$. At finite $T$ the Fermi factors $f(e_1)[1-f(e_2)][1-f(e_3)]$ smear the triangle and give $[\varepsilon^2+(\pi k_BT)^2]/2$ up to the factor $1/(1+e^{-\varepsilon/k_BT})$.`,
      caption: String.raw`**Left:** the phase space of the decay of an added electron at energy $\varepsilon$: horizontal axis the energy $e_1$ of the sea electron it kicks out, vertical axis the energy $e_2$ of one of the final electrons (the third is fixed by energy conservation). At $T=0$ only the triangle $e_1\in(-\varepsilon,0)$, $0<e_2<\varepsilon+e_1$ is allowed, with area $\varepsilon^2/2$; temperature smears its edges. **Right:** the decay rate (the integral of the left picture, computed numerically) against $\varepsilon$ at $T=0$ (dashed) and at the chosen temperature, with the ratio rate$/\varepsilon$ (green), which tends to zero linearly: the width of the excitation becomes negligible compared with its energy, so quasiparticles are sharp near $E_F$. Drag **$\varepsilon$** towards zero and watch the triangle (and the rate) vanish.`,
      scope: String.raw`Weakly to moderately interacting three-dimensional electrons at low energy, $\varepsilon,k_BT\ll E_F$. In one dimension (Luttinger liquids), near quantum critical points and in strange metals the quasiparticle picture fails; in two dimensions the rate gets a logarithmic correction. Energies here are in arbitrary units, rate in units of its prefactor.`,
      deps: ['cm-1.1', 'thermo-8.4'],
      refs: ['Ashcroft–Mermin ch. 17'],
      tags: ['fermi liquid', 'quasiparticles', 'phase space'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermi_liquid_theory' },
      viz(v) {
        const eS = v.slider('quasiparticle energy $\\varepsilon$', 0.02, 1, 0.6, { step: 0.01 });
        const tS = v.slider('temperature $k_BT$', 0, 0.15, 0, { step: 0.005 });
        const sA = v.stage({ x: [-1.1, 0.35], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 340, xlabel: 'energy $e_1$ of the sea electron', ylabel: 'final energy $e_2$', title: 'allowed final states', weight: 1 });
        const sB = v.stage({ x: [0, 1], y: [0, 0.55], axes: 'box', gutter: true, height: 340, xlabel: 'energy $\\varepsilon$ above $E_F$', ylabel: 'decay rate (arb.)', title: 'quasiparticle decay rate', weight: 1 });
        const rate = (eps, T, n = 150) => {
          if (T < 1e-6) return (eps * eps) / 2;
          const L = eps + 14 * T + 0.05, h = (2 * L) / n; let s = 0;
          for (let i = 0; i < n; i++) { const e1 = -L + (i + 0.5) * h, f1 = fermi(e1, 0, T); if (f1 < 1e-9) continue; for (let j = 0; j < n; j++) { const e2 = -L + (j + 0.5) * h; s += f1 * (1 - fermi(e2, 0, T)) * (1 - fermi(e1 + eps - e2, 0, T)); } }
          return s * h * h;
        };
        v.legend([['accent', 'rate at this $T$'], ['muted', '$T=0$: $\\varepsilon^2/2$', { dash: true }], ['green', '$\\mathrm{rate}/\\varepsilon$ (quasiparticle sharpness)']]);
        let cur = 0, ck = '', curve = [];
        v.render(() => {
          const eps = eS.value, T = tS.value;
          sA.heat((e1, e2) => { const e3 = e1 + eps - e2; return T < 1e-6 ? (e1 < 0 && e2 > 0 && e3 > 0 ? 1 : 0) : fermi(e1, 0, T) * (1 - fermi(e2, 0, T)) * (1 - fermi(e3, 0, T)); }, { cmap: 'theme', color: 'accent', range: [0, 1], res: 3, key: `${eps}|${T}` });
          sA.axes();
          sA.poly([[-eps, 0], [0, 0], [0, eps]], { color: 'orange', fill: false, width: 1.6, dash: [5, 3] });
          sA.hline(0, { color: 'ink', width: 0.8, alpha: 0.5 }); sA.vline(0, { color: 'ink', width: 0.8, alpha: 0.5 });
          sA.text('Fermi sea', -0.95, -0.12, { size: 11, color: 'muted' }); sA.text('$e_1<0$ occupied', -0.95, 1.1, { size: 11, color: 'muted' });
          sA.text('$e_2,e_3>0$ empty', 0.33, 0.95, { size: 11, color: 'muted', align: 'right' });
          cur = rate(eps, T);
          const kk = `${T}`; if (kk !== ck) { curve = []; for (let i = 0; i <= 40; i++) { const e = (i / 40) * 1; curve.push([e, rate(Math.max(e, 1e-4), T, 100)]); } ck = kk; }
          sB.fn((e) => e * e / 2, { color: 'muted', width: 1.6, dash: [5, 4] });
          sB.path(curve, { color: 'accent', width: 2.4 });
          sB.path(curve.filter((p) => p[0] > 0.02).map((p) => [p[0], p[1] / p[0]]), { color: 'green', width: 2 });
          sB.dot(eps, cur, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const eps = eS.value, T = tS.value, th = T < 1e-6 ? (eps * eps) / 2 : (eps * eps + PI * PI * T * T) / (2 * (1 + Math.exp(-eps / T)));
          return `rate (integral of the left panel) $=${v.fix(cur, 5)}$ · closed form $(\\varepsilon^2+\\pi^2T^2)/[2(1+e^{-\\varepsilon/T})]=${v.fix(th, 5)}$ · rate$/\\varepsilon=${v.fix(cur / eps, 3)}$ (in units of the interaction prefactor, the decay width is a fraction rate$/\\varepsilon$ of the excitation energy, shrinking as $\\varepsilon$ for $T=0$) · at $T=0$ the rate is $\\varepsilon^2/2=${v.fix(eps * eps / 2, 5)}$: it vanishes faster than the energy itself.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Cyclotron resonance',
      credit: 'Dresselhaus, Kip & Kittel, 1953–1955',
      statement: String.raw`A free carrier of effective mass $m^*$ in a magnetic field $B$ circles at the cyclotron frequency $\omega_c=eB/m^*$. A microwave field of frequency $\omega$ with a component perpendicular to $B$ is absorbed resonantly when $\omega=\omega_c$, provided $\omega_c\tau>1$ (the carrier completes an orbit between collisions). In a band with an anisotropic mass tensor the relevant **cyclotron mass** depends on the angle $\theta$ between $\mathbf B$ and the crystal axes: for an ellipsoidal valley with longitudinal and transverse masses $m_l,m_t$,
$$m_c(\theta)=\sqrt{\frac{m_t^2m_l}{m_t\sin^2\theta+m_l\cos^2\theta}},$$
$\theta$ being the angle between $\mathbf B$ and the valley axis. Each inequivalent valley gives its own resonance, and the peak positions as $\mathbf B$ rotates map out $m_l$ and $m_t$.`,
      idea: String.raw`Under $\hbar\dot{\mathbf k}=-e\dot{\mathbf r}\times\mathbf B$ (cm-2.2), with a quadratic band $E=\tfrac12\hbar^2\mathbf k^{\mathsf T}M^{-1}\mathbf k$ (cm-2.3), the motion perpendicular to $\mathbf B$ is circular in the sense of the mass tensor, with angular frequency $\omega_c=eB/m_c$ and $m_c=\sqrt{\det M/(\hat{\mathbf b}\cdot M\hat{\mathbf b})}$. The microwave electric field drives the circulating carrier, giving a Lorentzian absorption $\propto1/[1+(\omega-\omega_c)^2\tau^2]$ (Maxwell’s equations, em-7.1, for the driving). Valleys oriented differently relative to $\mathbf B$ have different $m_c$, so one sees several lines, which merge when $\mathbf B$ lies on a symmetry axis.`,
      caption: String.raw`Absorption of a microwave field (frequency set by the slider) against the magnetic field. Choose **silicon or germanium electrons** (anisotropic valleys) or the **holes** of silicon (two bands, treated as spherical) and rotate the field with **angle $\theta$** in the chosen plane. Each valley contributes a peak at $B=\omega m_c(\theta)/e$; coloured tick marks show the individual valleys. **Right:** the cyclotron masses against the angle: the rotation sweeps along the curves, and the current angle is the vertical line. Raise $\omega\tau$ to sharpen the lines, lower it below $1$ and the resonance disappears.`,
      scope: String.raw`Low temperature and clean samples with $\omega_c\tau\gg1$ and carriers whose bands are parabolic near the extrema. The masses used here (Si: $m_l=0.98$, $m_t=0.19$; Ge: $m_l=1.64$, $m_t=0.082$; Si holes $0.16$ and $0.49$ in units of the free-electron mass) are the commonly quoted textbook values, recalled rather than looked up; real hole bands are warped.`,
      deps: ['cm-2.3', 'em-7.1'],
      refs: ['Kittel ch. 8'],
      tags: ['cyclotron resonance', 'effective mass', 'semiconductors'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cyclotron_resonance' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const MAT = {
          si: { name: 'Si electrons', ml: 0.98, mt: 0.19, axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
          ge: { name: 'Ge electrons', ml: 1.64, mt: 0.082, axes: [[1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1]].map((a) => a.map((x) => x / Math.sqrt(3))) },
          sih: { name: 'Si holes (spherical)', iso: [0.16, 0.49] },
        };
        const mat = v.select('carriers', [{ value: 'si', label: 'Si electrons' }, { value: 'ge', label: 'Ge electrons' }, { value: 'sih', label: 'Si holes' }], 'si');
        const plane = v.select('rotate B in the', [{ value: '110', label: '(110) plane' }, { value: '100', label: '(100) plane' }], '110');
        const th = v.slider('angle $\\theta$ from [001] (°)', 0, 90, 30, { step: 1 });
        const fq = v.slider('microwave frequency (GHz)', 10, 60, 24, { step: 1 });
        const wt = v.slider('$\\omega\\tau$', 0.4, 80, 25, { log: true, sig: 2 });
        const Bdir = (deg, pl) => { const t = (deg * PI) / 180, s = Math.sin(t), c = Math.cos(t); return pl === '110' ? [s / Math.SQRT2, s / Math.SQRT2, c] : [s, 0, c]; };
        const masses = (m, deg, pl) => {
          if (m.iso) return m.iso.map((x) => ({ m: x, id: 0 }));
          const b = Bdir(deg, pl); return m.axes.map((a, i) => { const ca = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]), c2 = Math.min(1, ca * ca); return { m: Math.sqrt((m.mt * m.mt * m.ml) / (m.mt * (1 - c2) + m.ml * c2)), id: i }; });
        };
        const sA = v.stage({ x: [0, 1.7], y: [0, 1.15], axes: 'box', gutter: true, height: 320, xlabel: 'magnetic field $B$ (T)', ylabel: 'absorption', title: 'microwave absorption', weight: 1.15 });
        const sM = v.stage({ x: [0, 90], y: [0, 1.7], axes: 'box', gutter: true, height: 320, xlabel: 'angle $\\theta$ (°)', ylabel: '$m_c/m_e$', title: 'cyclotron masses of the valleys', weight: 0.85 });
        const cols = ['accent', 'orange', 'green', 'purple'];
        let ls = [];
        const group = (ms) => { const g = []; ms.forEach((q) => { const f = g.find((e) => Math.abs(e.m - q.m) < 1e-6); if (f) f.n++; else g.push({ m: q.m, id: q.id, n: 1 }); }); return g.sort((p, r) => p.m - r.m); };
        v.render(() => {
          const m = MAT[mat.value], f = fq.value * 1e9, w = TAU * f, B0 = (w * C.me) / C.e;
          plane.el.hidden = !!m.iso; th.el.hidden = !!m.iso;
          const ms = masses(m, th.value, plane.value), Bmax = 1.7 * (fq.value / 24);
          sA.setView([0, Bmax], [0, 1.15]);
          const g = (B) => { let s = 0; ms.forEach((q) => { const wc = (C.e * B) / (q.m * C.me), x = (w - wc) * (wt.value / w); s += 1 / (1 + x * x); }); return s; };
          const gm = Math.max(...ms.map((q) => g(B0 * q.m))); const sc = gm > 0 ? 1 / Math.max(gm, 1.0) : 1;
          ms.forEach((q) => sA.fn((B) => { const wc = (C.e * B) / (q.m * C.me), x = (w - wc) * (wt.value / w); return sc / (1 + x * x); }, { color: cols[q.id % 4], width: 1.2, alpha: 0.55 }));
          sA.fn((B) => g(B) * sc, { color: 'ink', width: 2.4 });
          group(ms).forEach((q, gi) => { const Br = B0 * q.m; if (Br < Bmax) { sA.vline(Br, { color: cols[q.id % 4], width: 1.4, dash: [4, 4] }); sA.text(`${v.fix(q.m, 3)}${q.n > 1 ? ' ×' + q.n : ''}`, Br + 0.02 * Bmax, 1.08 - 0.08 * (gi % 3), { size: 11, color: cols[q.id % 4], align: 'left' }); } });
          // masses against the angle
          sM.setView([0, 90], [0, 1.15 * (m.iso ? m.iso[1] : Math.sqrt(m.mt * m.ml) * 1.02)]);
          if (m.iso) m.iso.forEach((x, i) => sM.hline(x, { color: cols[i], width: 2 }));
          else m.axes.forEach((a, i) => sM.fn((d) => masses({ ...m, axes: [a] }, d, plane.value)[0].m, { color: cols[i % 4], width: 2.2, alpha: 0.9 }));
          sM.vline(th.value, { color: 'gold', width: 2 });
          ls = ms;
        });
        v.readout(() => {
          const m = MAT[mat.value], f = fq.value * 1e9, B0 = (TAU * f * C.me) / C.e, uniq = [...new Set(ls.map((q) => v.fix(q.m, 3)))];
          let s = `${m.name} at ${fq.value} GHz: peaks at $B=\\omega m_c/e$ for $m_c/m_e=${uniq.join(',\\ ')}$, i.e. $B=${uniq.map((u) => v.fix(B0 * +u, 3)).join(',\\ ')}$ T · ${uniq.length} distinct line${uniq.length > 1 ? 's' : ''}`;
          if (mat.value === 'si' && Math.abs(th.value) < 0.5) s += ` · for $\\mathbf B\\parallel[001]$ the lines give $m_t=${v.fix(Math.min(...ls.map((q) => q.m)), 2)}$ and $\\sqrt{m_tm_l}=${v.fix(Math.max(...ls.map((q) => q.m)), 2)}$ → $m_l=${v.fix(Math.max(...ls.map((q) => q.m)) ** 2 / Math.min(...ls.map((q) => q.m)), 2)}$`;
          if (wt.value < 1) s += ' · $\\omega\\tau<1$: the electrons scatter before completing an orbit and the resonance is washed out';
          return s + '.';
        });
      },
    },

    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Cyclotron orbits on the Fermi surface',
      statement: String.raw`In a magnetic field $\mathbf B$ a band electron obeys $\hbar\dot{\mathbf k}=-e\,\mathbf v\times\mathbf B$ and $\mathbf v=\hbar^{-1}\nabla_{\mathbf k}E$. The energy is conserved, so $\mathbf k$ moves along the intersection of the constant-energy surface $E(\mathbf k)=E_F$ with the plane perpendicular to $\mathbf B$; the real-space orbit has the same shape rotated by $90^\circ$ about $\mathbf B$ and scaled by $\hbar/eB$. Orbits are **electron-like** around a band minimum, **hole-like** around a maximum (opposite sense), or **open** when the contour runs through the repeated zones. For a closed regular contour, the positive period is $T_c=2\pi m_c/eB$ with the positive cyclotron mass
$$m_c=\frac{\hbar^2}{2\pi}\left|\frac{\partial A(E)}{\partial E}\right|,$$
where $A(E)$ is the positive $\mathbf k$-space area enclosed by the chosen contour at fixed momentum along the field. The absolute value includes hole-like contours, whose enclosed area decreases with energy. Open contours have no period of this form.`,
      idea: String.raw`Because $\dot{\mathbf k}\perp\nabla_{\mathbf k}E$, the orbit lies on a level curve of $E$ (cm-2.2). Integrating, $\mathbf r_\perp(t)-\mathbf r_\perp(0)=-(\hbar/eB)\,\hat{\mathbf b}\times[\mathbf k(t)-\mathbf k(0)]$, so the real-space orbit is the $\mathbf k$-space orbit turned by $90^\circ$. In the orbit plane write $\nabla_\perp E$ for the projected energy gradient. On a closed regular contour the time to traverse a short arc $d\ell$ is $\hbar^2d\ell/(eB\,|\nabla_\perp E|)$. The positive integral $\oint d\ell/|\nabla_\perp E|=|dA/dE|$ gives the positive period and mass for electron-like or hole-like pockets. Whether the contour closes depends on the Fermi surface found in cm-1.7: contours around $\Gamma$ or $M$ close, those that pass through the saddle region open up. Along a differentiable trajectory in a smooth band, the chain rule (pma 9.15) gives $dE/dt=\nabla E\cdot\dot{\mathbf k}$. The magnetic equation makes $\dot{\mathbf k}$ perpendicular to $\nabla E$, so this derivative vanishes. Its component along a fixed magnetic field also vanishes, fixing the plane of the orbit. These are local conservation statements; they do not imply that every resulting contour is closed.`,
      caption: String.raw`**Left:** the band $E=-2\cos k_x-2t_y\cos k_y-4t'\cos k_x\cos k_y$ in repeated zones with the constant-energy contour (orange) at the chosen **energy**. **Right:** the real-space orbit, computed by integrating $\dot{\mathbf r}=\mathbf v$ together with the k-motion (the gold dot moves in both panels). Change the energy: low energies give closed electron orbits around $\Gamma$, high ones hole orbits around the corner $M$ turning the other way; between them, for $t_y<1$, orbits run off to the neighbouring zones (**open**). **Field $B$** only rescales the real-space orbit and the period. The readout compares the integrated period with $2\pi m_c/B$ computed from the areas of neighbouring contours.`,
      scope: String.raw`A single band, no scattering over one period ($\omega_c\tau\gg1$) and a field weak enough that magnetic breakdown between orbits is negligible; orbits in the plane perpendicular to $\mathbf B$ only (two-dimensional model).`,
      deps: ['cm-2.2', 'cm-1.7', 'pma-9.15'],
      refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 9'],
      tags: ['cyclotron orbit', 'fermi surface', 'open orbits'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cyclotron_resonance' },
      viz(v) {
        const eS = v.slider('energy $E$ (units of $t$)', -3.9, 3.9, -1.5, { step: 0.02 });
        const tyS = v.slider('hopping ratio $t_y/t_x$', 0.2, 1, 1, { step: 0.02 });
        const tpS = v.slider('$t^\\prime/t$', 0, 0.3, 0, { step: 0.01 });
        const Bs = v.slider('field $B$', 0.2, 3, 1, { step: 0.05 });
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const sK = v.stage({ x: [-1.7 * PI, 1.7 * PI], y: [-1.7 * PI, 1.7 * PI], equal: true, axes: 'box', gutter: true, height: 360, xlabel: '$k_x$', ylabel: '$k_y$', xticks: tk, yticks: tk, title: 'k-space (repeated zones)', weight: 1 });
        const sR = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 360, xlabel: '$x$', ylabel: '$y$', title: 'real-space orbit (rotated by 90°)', weight: 1 });
        let O = null, ok = '', mc = NaN, rcheck = 0;
        v.animate((t) => {
          const key = `${eS.value}|${tyS.value}|${tpS.value}`;
          if (key !== ok) {
            O = traceOrbit(eS.value, tyS.value, tpS.value, 1); ok = key; mc = NaN;
            if (O && O.closed) { const O2 = traceOrbit(eS.value + 0.03, tyS.value, tpS.value, 1); const O1 = traceOrbit(eS.value - 0.03, tyS.value, tpS.value, 1); if (O1 && O1.closed && O2 && O2.closed) mc = (Math.abs(O2.area) - Math.abs(O1.area)) / 0.06 / TAU; }
          }
          const ty = tyS.value, tp = tpS.value;
          sK.heat((x, y) => bandE(x, y, ty, tp), { cmap: 'theme', color: 'accent', range: [-4.5, 4.5], res: 4, key: `h${ty}|${tp}` });
          sK.axes();
          for (const gx of [-PI, PI]) { sK.vline(gx, { color: 'ink', width: 1, dash: [4, 4], alpha: 0.5 }); sK.hline(gx, { color: 'ink', width: 1, dash: [4, 4], alpha: 0.5 }); }
          sK.contour((x, y) => bandE(x, y, ty, tp), [eS.value], { color: 'orange', width: 2.2, res: 200 });
          if (!O) { sK.corner('no state at this energy', 'tl', { color: 'red' }); return; }
          if (O.sep) { sK.dot(O.k0[0], O.k0[1], { r: 7, color: 'red' }); sK.corner('saddle-point energy: separatrix', 'tl', { color: 'red' }); return; }
          const B = Bs.value, P = O.pts, Tper = O.t / B, ph = Tper > 0 ? (t % 8) / 8 : 0;
          const idx = Math.min(P.length - 1, Math.floor(ph * (P.length - 1)));
          sK.path(P.map((p) => [p[0], p[1]]), { color: 'accent', width: 2.6 });
          sK.dot(P[idx][0], P[idx][1], { r: 7, color: 'gold' });
          // r − r0 = (1/B)(δk_y, −δk_x): the k-orbit turned by −90° (ħ = e = 1); O.pr is the honest integral of ṙ = v dt (computed for B = 1)
          const Rk = P.map((p) => [(p[1] - P[0][1]) / B, -(p[0] - P[0][0]) / B]);
          let e2 = 0; for (let i = 0; i < Rk.length; i++) e2 = Math.max(e2, Math.hypot(Rk[i][0] * B - O.pr[i][0], Rk[i][1] * B - O.pr[i][1]));
          rcheck = e2;
                    { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; Rk.forEach((p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hh = Math.max(0.6, 0.6 * Math.max(x1 - x0, y1 - y0)); sR.setView([cx - hh, cx + hh], [cy - hh, cy + hh]); }
          sR.path(Rk, { color: 'accent', width: 2.6 });
          sR.dot(Rk[idx][0], Rk[idx][1], { r: 7, color: 'gold' });
          sR.arrow(Rk[Math.max(0, idx - 3)][0], Rk[Math.max(0, idx - 3)][1], Rk[idx][0], Rk[idx][1], { color: 'gold', width: 2 });
          sR.dot(0, 0, { r: 3, color: 'muted' });
        }, { period: 8, still: 3 });
        v.readout(() => {
          if (!O) return 'No electron state at this energy: it lies outside the band.';
          const B = Bs.value, Eg = (x, y) => bandE(x, y, tyS.value, tpS.value);
          if (O.sep) return 'This energy is exactly that of a saddle point ($\\mathbf v=0$ there): the orbit is a **separatrix**, its period diverges logarithmically, and closed electron-like orbits turn into hole-like or open ones as the energy crosses it.';
          if (O.open) return `**open orbit**: the contour runs through the zone boundary into the neighbouring zones, so $\\mathbf k$ keeps moving along $k_${Math.abs(O.pts[O.pts.length - 1][1] - O.k0[1]) > Math.abs(O.pts[O.pts.length - 1][0] - O.k0[0]) ? 'y' : 'x'}$ and the real-space motion is confined to a line (no cyclotron resonance, no quantum oscillation from this sheet).`;
          let cx = 0, cy = 0; O.pts.forEach((p) => { cx += p[0]; cy += p[1]; }); cx /= O.pts.length; cy /= O.pts.length;
          const kind = Eg(cx, cy) < eS.value ? 'electron-like (encloses lower energies)' : 'hole-like (encloses higher energies)', ccw = O.area > 0;
          return `closed ${kind} orbit, k-space area $A=${v.fix(Math.abs(O.area), 3)}$ · period $T_c=${v.fix(O.t / B, 2)}$ at $B=${v.fix(B, 2)}$, $\\omega_c=${v.fix((TAU * B) / O.t, 3)}$ · $m_c=\\frac1{2\\pi}dA/dE=${isFinite(mc) ? v.fix(mc, 3) : '—'}$ gives $\\omega_c=B/m_c=${isFinite(mc) ? v.fix(B / Math.abs(mc), 3) : '—'}$ (${isFinite(mc) ? v.fix(100 * Math.abs((TAU * B) / O.t / (B / Math.abs(mc)) - 1), 1) + '% apart' : ''}) · sense in $\\mathbf k$-space: ${ccw ? 'counter-clockwise' : 'clockwise'} · real-space orbit by direct integration of $\\dot{\\mathbf r}=\\mathbf v$ equals the rotated k-orbit to $${v.sci(rcheck, 2)}$ (integration error).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Phenomenon',
      name: 'de Haas–van Alphen oscillations',
      credit: 'de Haas & van Alphen, 1930; Onsager, 1952; Lifshitz & Kosevich, 1955',
      statement: String.raw`The magnetization of a metal at low temperature oscillates as a function of the applied field, and the oscillations are **periodic in $1/B$**:
$$\Delta\!\Big(\frac1B\Big)=\frac{2\pi e}{\hbar\,A_{\rm ext}},$$
where $A_{\rm ext}$ is an extremal cross-sectional area of the Fermi surface in the plane perpendicular to $\mathbf B$ (Onsager). Each extremal orbit contributes a frequency $F=\hbar A_{\rm ext}/2\pi e$; the amplitude decreases with temperature (through the cyclotron mass) and with disorder (Dingle). Measuring $F$ for many field directions reconstructs the Fermi surface.`,
      idea: String.raw`Quantizing the semiclassical orbits (qm-6.8 for the Landau levels of free electrons, Bohr–Sommerfeld for general bands) places the orbit areas at $A_n=(n+\tfrac12)\,2\pi eB/\hbar$, so a level sweeps through the Fermi energy each time $A_{\rm ext}/(2\pi eB/\hbar)=n+\tfrac12$ — equally spaced in $1/B$ (this is where the shape of the Fermi surface of cm-1.7 enters). The grand potential $\Omega=-k_BT\,g\,\frac{eB}{h}\sum_n\ln(1+e^{(\mu-E_n)/k_BT})$ has a kink each time $E_n=\mu$, and $M=-\partial\Omega/\partial B$ is a sawtooth; temperature rounds the teeth.`,
      caption: String.raw`A two-dimensional square-lattice band $E=-2\cos k_x-2\cos k_y-4t'\cos k_x\cos k_y$ with the Fermi level $\mu$ you choose. **Left:** the Fermi surface (orange), whose area $A$ is shaded. **Right:** the magnetization $M=-\partial\Omega/\partial B$ computed from the Landau levels of this band, quantized by the Onsager rule $A(E_n)=(n+\tfrac12)\,2\pi B$ ($\hbar=e=1$, spin degeneracy 2), plotted against $1/B$. The gold ticks mark the predicted $1/B_n=2\pi(n+\tfrac12)/A$ where a level crosses $\mu$: the sawtooth jumps there. Move $\mu$ or $t'$ and the period follows the area; raise $k_BT$ and the teeth smooth out and shrink.`,
      scope: String.raw`Free (non-interacting) electrons in a fixed chemical potential (the standard grand-canonical treatment), clean sample, $\omega_c\tau\gg1$, field low enough that levels with index $\sim10$ or more are involved. In two dimensions at fixed electron number the sawtooth looks different; in three dimensions only extremal orbits contribute and the signal is much smaller.`,
      deps: ['qm-6.8', 'cm-1.7'],
      refs: ['Ashcroft–Mermin ch. 14', 'Kittel ch. 9'],
      tags: ['quantum oscillations', 'landau levels', 'fermi surface'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/De_Haas%E2%80%93Van_Alphen_effect' },
      viz(v) {
        const M = v.M;
        const mu = v.slider('Fermi level $\\mu$ (units of $t$)', -3.4, -0.8, -1.4, { step: 0.02 });
        const tpS = v.slider('$t^\\prime/t$', 0, 0.25, 0, { step: 0.01 });
        const kT = v.slider('temperature $k_BT$', 0.01, 0.1, 0.025, { step: 0.005 });
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']];
        const sF = v.stage({ x: [-PI, PI], y: [-PI, PI], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$k_x$', ylabel: '$k_y$', xticks: tk, yticks: tk, title: 'Fermi surface', weight: 0.8 });
        const sM = v.stage({ x: [1.5, 5], y: [-1, 1], axes: 'box', gutter: true, height: 340, xlabel: 'inverse field $1/B$', ylabel: 'magnetization $M$', title: 'de Haas–van Alphen oscillations', weight: 1.2 });
        // smooth tables of the enclosed area A(E) of {E(k) < E} and of dA/dE (polar integration around Γ; valid below the saddle), cached per t′
        const tabs = {};
        const areaTable = (tp) => {
          const kk = tp.toFixed(3); if (tabs[kk]) return tabs[kk];
          const Eb = -4 - 4 * tp, Es = 4 * tp - 0.4, NE = 160, NT = 180, es = [], A = [], dA = [];
          for (let i = 0; i <= NE; i++) {
            const E = Eb + 1e-6 + ((Es - Eb) * i) / NE; let a = 0, da = 0; es.push(E);
            for (let t = 0; t < NT; t++) {
              const th = (TAU * (t + 0.5)) / NT, c = Math.cos(th), s2 = Math.sin(th), edge = PI / Math.max(Math.abs(c), Math.abs(s2));
              let lo = 0, hi = edge; for (let b = 0; b < 40; b++) { const m = (lo + hi) / 2; if (bandE(m * c, m * s2, 1, tp) < E) lo = m; else hi = m; }
              const r = (lo + hi) / 2, g = bandG(r * c, r * s2, 1, tp), dr = g[0] * c + g[1] * s2;
              a += 0.5 * r * r * (TAU / NT); da += (r / Math.max(dr, 1e-9)) * (TAU / NT);
            }
            A.push(a); dA.push(da);
          }
          return (tabs[kk] = { es, A, dA, Eb, Es, NE });
        };
        const herm = (T, E) => { const h = (T.Es - T.Eb) / T.NE, x = (E - T.Eb) / h, i = Math.max(0, Math.min(T.NE - 1, Math.floor(x))), u = x - i, u2 = u * u, u3 = u2 * u; const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2; return [h00 * T.A[i] + h10 * h * T.dA[i] + h01 * T.A[i + 1] + h11 * h * T.dA[i + 1], T.dA[i] * (1 - u) + T.dA[i + 1] * u]; };
        const Aof = (T, E) => (E <= T.Eb ? 0 : herm(T, Math.min(E, T.Es))[0]);
        const Einv = (T, A) => { let lo = T.Eb, hi = T.Es; for (let k = 0; k < 44; k++) { const m = (lo + hi) / 2; if (herm(T, m)[0] < A) lo = m; else hi = m; } return (lo + hi) / 2; };
        // M = −∂Ω/∂B at fixed μ with Ω = −2k_BT (B/2π) Σ ln(1 + e^{(μ−E_n)/k_BT}), E_n from A(E_n) = 2πB(n+½) and ∂E_n/∂B = 2π(n+½)/A′(E_n)
        const Mag = (T, B, m, kt) => {
          const Amax = herm(T, T.Es)[0]; let sL = 0, sF = 0;
          for (let n = 0; n < 400; n++) { const An = TAU * B * (n + 0.5); if (An > Amax) break; const En = Einv(T, An), x = (m - En) / kt; if (x < -40) break; const L = x > 40 ? x : Math.log(1 + Math.exp(x)), f = 1 / (1 + Math.exp(-x)), Ap = herm(T, En)[1]; sL += L; sF += (f * TAU * (n + 0.5)) / Ap; }
          const dOm = -(kt / PI) * sL + (B / PI) * sF; return -dOm;
        };
        let res = null, rk = '';
        v.render(() => {
          const T = areaTable(tpS.value), m = mu.value, kt = kT.value, key = `${tpS.value}|${m}|${kt}`;
          const A = Aof(T, m);
          sF.heat((x, y) => (bandE(x, y, 1, tpS.value) < m ? 1 : 0), { cmap: 'theme', color: 'accent', range: [0, 1.6], res: 3, key: `F${key}` });
          sF.axes(); sF.contour((x, y) => bandE(x, y, 1, tpS.value), [m], { color: 'orange', width: 2.4, res: 200 });
          sF.text(`A=${v.fix(A, 2)}`, 0, 0, { size: 14, color: 'ink', align: 'center', baseline: 'middle' });
          if (key !== rk) {
            const n = 400, pts = [], x0 = 1.5, x1 = 5; let amp = 0;
            for (let i = 0; i <= n; i++) { const xb = x0 + ((x1 - x0) * i) / n, B = 1 / xb, dB = B * 1e-3; pts.push([xb, Mag(T, B, m, kt)]); }
            // detrend lightly: subtract a running mean over one period so the oscillation is centred
            const per = TAU / A, w = Math.max(3, Math.round((per / (x1 - x0)) * n)), sm = pts.map((p, i) => { let s = 0, c = 0; for (let j = Math.max(0, i - w); j <= Math.min(n, i + w); j++) { s += pts[j][1]; c++; } return [p[0], p[1] - s / c]; });
            amp = Math.max(...sm.map((p) => Math.abs(p[1])));
            // measured frequency from the Hann-windowed FFT of the detrended signal
            const NF = 4096, re = new Float64Array(NF), im = new Float64Array(NF);
            sm.forEach((p, i) => { re[i] = p[1] * (0.5 - 0.5 * Math.cos((TAU * i) / n)); }); M.fft(re, im);
            const dx = (x1 - x0) / n; let kb = 0, pb = 0; for (let i = 3; i < NF / 2; i++) { const p = re[i] * re[i] + im[i] * im[i]; if (p > pb) { pb = p; kb = i; } }
            const pm = (j) => Math.hypot(re[j], im[j]), den = pm(kb - 1) - 2 * pm(kb) + pm(kb + 1), off = den !== 0 ? (0.5 * (pm(kb - 1) - pm(kb + 1))) / den : 0;
            res = { pts: sm, amp, F: (kb + off) / (NF * dx) }; rk = key;
          }
          sM.setView([1.5, 5], [-1.25 * res.amp, 1.25 * res.amp]);
          for (let n = 0; n < 60; n++) { const xb = (TAU * (n + 0.5)) / A; if (xb >= 1.5 && xb <= 5) sM.vline(xb, { color: 'gold', width: 1.2, dash: [3, 4] }); }
          sM.hline(0, { color: 'faint', width: 1 });
          sM.path(res.pts, { color: 'accent', width: 2.2 });
          res.A = A;
        });
        v.readout(() => res && `Fermi-surface area $A=${v.fix(res.A, 3)}$ (units $a^{-2}$; the full zone is $4\\pi^2=39.5$) · Onsager period $\\Delta(1/B)=2\\pi/A=${v.fix(TAU / res.A, 3)}$ (frequency $F=A/2\\pi=${v.fix(res.A / TAU, 3)}$) · measured from the curve (Fourier peak): $F=${v.fix(res.F, 3)}$ → $A=${v.fix(res.F * TAU, 2)}$ · teeth are rounded by $k_BT=${v.fix(kT.value, 3)}$ compared with the level spacing $\\hbar\\omega_c$.`);
      },
    },

    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Phenomenon',
      name: 'Integer quantum Hall effect',
      credit: 'von Klitzing, 1980; Laughlin, 1981; Halperin, 1982',
      statement: String.raw`In a two-dimensional electron gas at low temperature and high field, the Hall resistance does not rise linearly with $B$ but sits on **plateaus**
$$\rho_{xy}=\frac{h}{\nu e^2},\qquad \nu=1,2,3,\dots$$
(in units with spin and valley degeneracy included) over finite intervals of $B$ (or of the electron density), while the longitudinal resistivity $\rho_{xx}$ vanishes. The plateau values are universal: independent of the sample, its disorder, its geometry and the material, to better than one part in $10^{9}$ in the best modern measurements. Transitions between plateaus occur where the Fermi energy crosses the narrow band of extended states at the centre of a Landau level, accompanied by peaks of $\rho_{xx}$.`,
      idea: String.raw`A field splits the band into Landau levels of degeneracy $eB/h$ per area (qm-6.8). Disorder broadens each level into a band of mostly *localized* states with a narrow window of extended states at the centre. When the Fermi energy sits in a mobility gap (localized states), no bulk current flows, $\sigma_{xx}=0$ and the Hall conductivity stays pinned at an integer multiple of $e^2/h$; changing $B$ or the density only moves $\mu$ through localized states, so nothing changes — that is the plateau. Edge channels along the boundary carry the Hall current. The Hall geometry of em-7.5 gives $\rho_{xy}=\sigma_{xy}/(\sigma_{xx}^2+\sigma_{xy}^2)\to1/\sigma_{xy}$ when $\sigma_{xx}\to0$.`,
      caption: String.raw`A model 2D gas of fixed electron density with disorder-broadened Landau levels (illustrative parameters, spin-degenerate by default). **Left:** $\rho_{xy}$ (blue, in units of $h/e^2$, dotted lines at $1/\nu$) and $\rho_{xx}$ (orange) as $B$ is swept; the field marker follows the **field** slider. **Right:** a Hall bar for the chosen field: the number of chiral edge channels (arrows) equals the number of filled Landau levels, and the bulk is insulating. Raise the **temperature** to widen the extended-state window and watch the plateaus shrink and $\rho_{xx}$ lift off zero; increase the **disorder** to stretch the plateaus; set the degeneracy to 1 to resolve every level.`,
      scope: String.raw`Clean 2D gases (GaAs heterostructures, Si MOSFETs, graphene) at low temperature, where electrons are non-interacting enough for single-particle localization to apply; the fractional states, spin-splitting detail and the exact universal critical behavior at the transitions are not modelled. Parameters here are chosen for the picture, not fitted to a sample.`,
      deps: ['qm-6.8', 'em-7.5'],
      refs: ['Kittel ch. 17'],
      tags: ['quantum hall', 'landau levels', 'edge states'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_Hall_effect' },
      viz(v) {
        const N0 = 3.0;
        const gS = v.select('level degeneracy', [{ value: '1', label: '1' }, { value: '2', label: '2 (spin)' }], '2');
        const G0 = v.slider('disorder $\\Gamma_0$ (meV)', 0.1, 1.0, 0.35, { step: 0.01 });
        const Tk = v.slider('temperature $T$ (K)', 0.05, 6, 0.6, { log: true, sig: 2 });
        const Bs = v.slider('field $B$ (T)', 1, 14, 4.6, { step: 0.05 });
        const sC = v.stage({ x: [1, 14], y: [-0.03, 1.25], axes: 'box', gutter: true, height: 340, xlabel: 'magnetic field $B$ (T)', ylabel: '$\\rho$ (units of $h/e^2$)', title: 'Hall and longitudinal resistivity', weight: 1.2 });
        const sH = v.stage({ x: [0, 10], y: [0, 4.6], axes: false, height: 340, title: 'Hall bar: edge channels', weight: 0.8 });
        v.legend([['accent', '$\\rho_{xy}$'], ['orange', '$\\rho_{xx}$'], ['muted', '$1/\\nu$', { dash: true }]]);
        const P = () => ({ g: +gS.value, hw: 1.728, G0: G0.value, T: Tk.value, sp: 0.4 });
        let cur = null;
        v.render(() => {
          const p = P(); sC.setView([1, 14], [-0.03, p.g === 1 ? 1.1 : 0.6]);
          for (let j = 1; j <= (p.g === 1 ? 6 : 4); j++) { const y = 1 / (p.g * j); if (y < (p.g === 1 ? 1.1 : 0.6)) { sC.hline(y, { color: 'muted', width: 1, dash: [3, 4] }); sC.text(`${p.g * j}`, 13.7, y, { size: 11, color: 'muted', align: 'right', dy: -8 }); } }
          const a = [], b = []; for (let i = 0; i <= 260; i++) { const B = 1 + (13 * i) / 260, r = qheAt(N0, B, p); a.push([B, r.rxy]); b.push([B, r.rxx]); }
          sC.path(a, { color: 'accent', width: 2.4 }); sC.path(b, { color: 'orange', width: 2.2 });
          cur = qheAt(N0, Bs.value, p); sC.vline(Bs.value, { color: 'gold', width: 1.6 }); sC.dot(Bs.value, cur.rxy, { r: 6, color: 'accent' });
          // Hall bar
          sH.rect(1, 1, 9, 3.6, { fill: 'muted', fillAlpha: 0.08, color: 'ink', width: 1.6, radius: 6 });
          const nu = Math.round(cur.sxy), loc = cur.sxx < 0.05;
          const nu_show = Math.max(0, Math.min(6, nu));
          for (let i = 0; i < nu_show; i++) { const dy = 0.17 + 0.2 * i; sH.arrow(2.3, 3.6 - dy, 7.7, 3.6 - dy, { color: loc ? 'green' : 'orange', width: 2, head: 9 }); sH.arrow(7.7, 1 + dy, 2.3, 1 + dy, { color: loc ? 'green' : 'orange', width: 2, head: 9 }); }
          const r = v.rng(5); for (let i = 0; i < 22; i++) { const x = 1.8 + 6.4 * r(), y = 2.35 + 0.8 * r(); sH.dot(x, y, { r: 4, color: loc ? 'faint' : 'orange', hollow: false }); }
          sH.text(loc ? 'bulk: localized states, no current' : 'bulk: extended states conduct (transition)', 5, 1.6, { size: 11, color: 'muted', align: 'center' });
          sH.text(`${nu_show} edge channel${nu_show === 1 ? '' : 's'}`, 5, 4.1, { size: 12, color: 'ink', align: 'center' });
          sH.text('I', 0.35, 2.3, { size: 14, color: 'ink', align: 'center' }); sH.arrow(0.1, 2.1, 0.9, 2.1, { color: 'ink', width: 2 });
        });
        v.readout(() => cur && `$B=${v.fix(Bs.value, 2)}$ T: filling $\\nu_{\\rm filled}=n h/eB=${v.fix(cur.nu, 2)}$ · $\\sigma_{xy}=${v.fix(cur.sxy, 3)}\\,e^2/h$, $\\rho_{xy}=${v.fix(cur.rxy, 4)}\\,h/e^2$ ${Math.abs(cur.sxy - Math.round(cur.sxy)) < 0.005 && Math.round(cur.sxy) > 0 ? `(plateau $h/${Math.round(cur.sxy)}e^2$)` : '(between plateaus)'} · $\\rho_{xx}=${v.sci(Math.max(cur.rxx, 1e-12), 2)}\\,h/e^2$ · Fermi level $\\mu=${v.fix(cur.mu, 1)}$ meV, mobility window $\\pm${v.fix(cur.w, 2)}$ meV of a level centre.`);
      },
    },

    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Fine-structure constant from quantized Hall resistance',
      paper: { authors: 'K. v. Klitzing, G. Dorda and M. Pepper', year: 1980, title: 'New Method for High-Accuracy Determination of the Fine-Structure Constant Based on Quantized Hall Resistance', venue: 'Physical Review Letters 45 (6): 494–497', doi: '10.1103/PhysRevLett.45.494' },
      introduces: ['cm-2.13'],
      verify: true,
      statement: String.raw`Measuring the Hall voltage of a silicon MOSFET at about $1.5$ K in a field of about $18$ T while sweeping the gate voltage, the authors found that the Hall resistance stays on flat plateaus exactly at $h/ie^2$ (with $i=4$ the best-resolved), while the longitudinal voltage drop vanishes there. Since the plateau value depends only on $h/e^2$, the fine-structure constant $\alpha=\mu_0ce^2/2h$ follows from a resistance measurement. The resistance is determined to roughly ten parts per million, a new route to $\alpha$ that did not depend on QED calculations or on the details of the sample.`,
      idea: String.raw`Before 1980, $h/e^2$ and $\alpha$ were obtained from quantum electrodynamics (the electron’s $g$-factor, the Josephson effect with the SI ampere) or from spectroscopy with errors of $10^{-7}$ to $10^{-6}$. Klitzing noticed, while studying the high-field behavior of 2D electrons in an inversion layer (the MOSFET of cm-4.10), that the Hall resistance shows plateaus independent of sample details and proposed that the plateau value is exactly $h/ie^2$ (cm-2.13). The paper introduced the integer quantum Hall effect, which later became the realization of the resistance standard (the von Klitzing constant $R_K=h/e^2$) and, after 2019, an exact quantity.`,
      caption: String.raw`The paper’s central figure, recreated from a model (the paper’s raw data are not reproduced): the Hall voltage $U_H$ (blue) and the voltage drop $U_{pp}$ between potential probes (orange) of a silicon MOSFET at $B=18$ T and fixed current, as the **gate voltage** is swept; the electron density follows the gate. The Hall voltage is flat at $I\,h/4e^2$ over a range of gate voltage while $U_{pp}$ drops to nothing. Raise the **temperature** or the **disorder** to degrade the plateau. The readout turns the plateau value into $\alpha^{-1}$ and compares it to the accepted value.`,
      scope: String.raw`Illustrative model of an inversion layer: four-fold degenerate Landau levels (spin and two valleys), $m^*=0.19\,m_e$, Gaussian disorder and a field-independent oxide capacitance of $\sim2\times10^{11}\,\mathrm{cm^{-2}V^{-1}}$ — the numbers are chosen to reproduce the look of the experiment, not to match it. The accepted values on the right use the exact 2019 SI definitions of $h$ and $e$.`,
      deps: ['qm-6.8', 'em-7.5', 'cm-4.10'],
      refs: [],
      tags: ['quantum hall', 'resistance standard', 'fine-structure constant'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_Hall_effect' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const Tk = v.slider('temperature $T$ (K)', 0.3, 12, 1.5, { log: true, sig: 2 });
        const G0 = v.slider('disorder $\\Gamma_0$ (meV)', 0.1, 1.2, 0.4, { step: 0.01 });
        const Bsl = v.slider('field $B$ (T)', 6, 20, 18, { step: 0.5 });
        const Ix = v.slider('current $I$ (µA)', 0.1, 10, 1, { log: true, sig: 2 });
        const RK = C.h / (C.e * C.e), VT = 1.0, COX = 2.15; // threshold voltage (V), 10¹¹ cm⁻² per volt (≈ 100 nm oxide)
        const sU = v.stage({ x: [VT, 26], y: [0, 14], axes: 'box', gutter: true, height: 340, xlabel: 'gate voltage $V_g$ (V)', ylabel: 'voltage (mV)', title: 'Hall voltage and longitudinal voltage vs gate voltage', weight: 1.3 });
        const sR = v.stage({ x: [0, 14], y: [-0.5, 8], axes: 'box', gutter: true, height: 340, xlabel: '$\\rho_{xy}$ (kΩ)', ylabel: '$\\rho_{xx}$ (kΩ)', title: 'the sweep in the $(\\rho_{xy},\\rho_{xx})$ plane', weight: 0.7 });
        v.legend([['accent', '$U_H$ (Hall)'], ['orange', '$U_{pp}$ (longitudinal)'], ['muted', '$I\\,h/ie^2$', { dash: true }]]);
        const P = () => ({ g: 4, hw: 0.609, G0: G0.value, T: Tk.value, sp: 0.4 });
        let st = null;
        v.render(() => {
          const p = P(), B = Bsl.value, I = Ix.value * 1e-6, rgt = 2.15; // L/W of the potential probes
          sU.setView([VT, 26], [0, Math.max(14, 1.15 * I * RK / 4 * 1e3)]);
          for (const i of [4, 8, 12]) { const y = (I * RK * 1e3) / i; sU.hline(y, { color: 'muted', width: 1, dash: [3, 4] }); sU.text(`$h/${i}e^2$`, 25.8, y, { size: 11, color: 'muted', align: 'right', dy: -8 }); }
          const a = [], b = []; let plat = null, best = 1e9;
          for (let i = 0; i <= 320; i++) {
            const Vg = VT + ((26 - VT) * i) / 320, n = COX * (Vg - VT), r = qheAt(n, B, p);
            a.push([Vg, r.rxy * RK * I * 1e3]); b.push([Vg, r.rxx * rgt * RK * I * 1e3]);
            if (Math.abs(r.sxy - 4) < 0.5) { const dev = Math.abs(r.rxy * 4 - 1) + r.rxx; if (dev < best) { best = dev; plat = { Vg, rxy: r.rxy, rxx: r.rxx }; } }
          }
          sU.path(a, { color: 'accent', width: 2.4 }); sU.path(b, { color: 'orange', width: 2.2 });
          st = plat;
          if (plat) sU.dot(plat.Vg, plat.rxy * RK * I * 1e3, { r: 6, color: 'gold' });
          // right panel: the (ρxy, ρxx) plane, traced by the gate sweep; every plateau is a point (h/ie², 0)
          const curve = []; for (let i = 0; i <= 320; i++) { const Vg = VT + ((26 - VT) * i) / 320, r = qheAt(COX * (Vg - VT), B, p); if (r.rxy * RK < 14000) curve.push([(r.rxy * RK) / 1000, (r.rxx * RK) / 1000]); }
          sR.path(curve, { color: 'accent', width: 2.4 });
          for (const i of [4, 8, 12]) { sR.dot(RK / i / 1000, 0, { r: 5, color: 'green' }); sR.text(`$h/${i}e^2$`, RK / i / 1000, i === 8 ? 1.9 : 0.8, { size: 11, color: 'green', align: 'center' }); }
          if (plat) {
            const Rk = 4 * plat.rxy * RK; plat.ainv = (2 * Rk) / (C.mu0 * C.c); plat.ppm = (Rk / RK - 1) * 1e6;
            sR.dot(plat.rxy * RK / 1000, plat.rxx * RK / 1000, { r: 7, color: 'gold' });
          }
        });
        v.readout(() => `$R_K=h/e^2=${v.fix(RK, 5)}\\ \\Omega$ (exact in the 2019 SI), so the $i=4$ plateau should be $R_K/4=${v.fix(RK / 4, 4)}\\ \\Omega$ · ${st ? `model plateau: ${v.fix(st.rxy * RK, 3)} Ω, deviation ${v.fix(st.ppm, 2)} ppm (set by $\\rho_{xx}=${v.sci(Math.max(st.rxx, 1e-14), 2)}\\,h/e^2$ there) → $\\alpha^{-1}=${v.fix(st.ainv, 5)}$ vs accepted $${v.fix(1 / C.alpha, 6)}$` : 'no plateau found'} · Klitzing’s 1980 result was a few ppm, limited by the resistance standards of the day.`);
      },
    },
  ],
};
