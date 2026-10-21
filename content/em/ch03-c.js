import {slotCoefficients,slotValue,sphereCoefficients,sphereValue,sphereRms,complexField,fringeMap,fringeInverse,relaxationProblem,relaxationHistory} from './electrostatic.audit.js';
// Electromagnetism — Chapter 3, part c: items 3.14–3.19 (separation of variables, complex potentials, conformal maps, relaxation)
import { TAU, KV, EPS0, pot, fld, sgnCol, heatPot, levels, solveLin, sor, resid, samp, legendre, drawLines, circ } from './ch03.shared.js';


export default {
  collection: 'em',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Method',
      name: 'Separation of variables in Cartesian coordinates',
      statement: String.raw`To solve $\nabla^2V=0$ in a rectangle, look for product solutions $V=X(x)Y(y)$: then $X''/X=-Y''/Y=k^2$ is constant. For a semi-infinite slot $x>0$, $0<y<a$ with $V=0$ on the sides $y=0,a$, $V\to0$ as $x\to\infty$ and $V(0,y)=V_0(y)$ at the end,
$$V(x,y)=\sum_{n=1}^{\infty}b_n\,e^{-n\pi x/a}\sin\frac{n\pi y}{a},\qquad b_n=\frac2a\int_0^aV_0(y)\sin\frac{n\pi y}{a}\,dy.$$
For piecewise smooth $V_0$ the series converges for $x>0$ and approaches its boundary data in $L^2$; at interior jumps its boundary series takes the midpoint of the one-sided values.`,
      idea: String.raw`Separating variables turns Laplace's equation (em-2.8) into two ordinary differential equations (one exponential and one oscillatory equation). The conditions on the sides force $Y=\sin(n\pi y/a)$ and the decay at infinity picks $X=e^{-n\pi x/a}$. These products are a basis (Fourier sine series, pma-8.10, pma-8.14): the end condition fixes the coefficients. The sum is the unique solution (em-3.5). The exponentials damp the $n$-th term by $e^{-n\pi x/a}$, so high harmonics (and any roughness in $V_0$) die out within a distance $\sim a/n\pi$ of the end; yet at $x=0$ a jump in $V_0$ gives a Gibbs overshoot of about $9\%$ of the jump of the odd extension.`,
      caption: String.raw`A slot of width $a$ with the left end held at the profile $V_0(y)$ you select. Add terms one at a time ($N$): the heat map and contours show the partial sum. At the cut $x=x_c$ (slider, right panel) the partial sum (blue) converges almost at once for $x_c>0$; at $x_c=0$ the *square* profile has Gibbs ringing that never goes away: the first overshoot stays near $1.18\,V_0$. Bars show the coefficients $b_n$ used.`,
      scope: String.raw`Semi-infinite charge-free slot, width $a=4$ cm. Distinct electrode potentials require insulation at their junctions. Discontinuous boundary values have direction-dependent limits at corners; a piecewise-smooth sine series takes the midpoint at internal jumps and vanishes at the endpoints. All four profiles use closed-form Fourier coefficients, not quadrature across jumps. The displayed cut maximum samples 401 points and is not a certified supremum.`,
      credit: 'Separation and Fourier sine expansion; author derivation and direct boundary check',
      verify: false,
      links: { 'Author slot derivation': 'https://ocw.mit.edu/courses/res-6-002-electromagnetic-field-theory-a-problem-solving-approach-spring-2008/resources/mitres_6_002s08_chp04_text/', 'Author Dirichlet derivation': 'https://www.jirka.org/diffyqs/html/dirich_section.html' },
      deps: ['em-2.8', 'em-3.5', 'pma-8.10', 'pma-8.14', 'pde-5.6'],
      refs: ['Zahn, Electromagnetic Field Theory, §4.2.5 Eqs.26–34 and Fig.4.6 pp.267–270, semi-infinite slot and Gibbs ringing', 'Lebl, Notes on Diffy Qs, §4.9 Dirichlet problem, separation and Fourier coefficients; semi-infinite decay selected here'],
      tags: ['separation of variables', 'fourier'],
      viz(v) {
        const a = 4, NMAX = 80;
        const prof = { sq: (y) => 1, tri: (y) => 1 - Math.abs((2 * y) / a - 1), half: (y) => (y < a / 2 ? 1 : 0), two: (y) => (y < a / 3 || y > (2 * a) / 3 ? 0 : 1) };
        const B = Object.fromEntries(Object.keys(prof).map(k => [k,slotCoefficients(k,NMAX)]));
        const s = v.stage({ x: [0, 2 * a], y: [0, a], equal: true, height: 270, axes: false, weight: 1.5, title: 'partial sum $V_N(x,y)$' });
        const sC = v.stage({ x: [0, a], y: [-0.2, 1.4], height: 270, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: '$y$ (cm)', ylabel: '$V/V_0$', title: 'profile at the cut' });
        const sB = v.stage({ x: [0, NMAX + 1], y: [-1.2, 1.4], height: 200, axes: 'box', gutter: true, full: true, xlabel: 'harmonic $n$', ylabel: '$b_n/V_0$', title: 'coefficients (blue = included)' });
        const pf = v.select('end profile $V_0(y)$', [{ value: 'sq', label: 'constant' }, { value: 'half', label: 'half-and-half' }, { value: 'two', label: 'middle third' }, { value: 'tri', label: 'tent (continuous)' }], 'sq');
        const Ns = v.slider('terms $N$', 1, NMAX, 7, { int: true }), xc = v.slider('cut position $x_c$', 0, 4, 0, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        let info = {};
        v.render(() => {
          const b = B[pf.value], N = Ns.value;
          const Vn = (x, y, n) => { let t = 0; for (let k = 1; k <= n; k++) t += b[k] * Math.exp((-k * Math.PI * x) / a) * Math.sin((k * Math.PI * y) / a); return t; };
          s.heat((x, y) => Vn(x, y, N), { range: [-0.2, 1.2], cmap: 'theme', color: 'red', res: 3, key: `${pf.value}${N}`, alpha: 0.9 });
          s.contour((x, y) => Vn(x, y, N), levels(0.1, 10).filter((z) => z > 0 && z < 1.3), { color: 'ink', alpha: 0.3, width: 1, res: 140 });
          s.rect(0, 0, 2 * a, a, { color: 'ink', width: 1.5 });
          s.vline(xc.value, { color: 'gold', dash: true });
          sC.fn((y) => prof[pf.value](y), { color: 'green', dash: true, width: 1.6, domain: [0, a] }); sC.fn((y) => Vn(xc.value, y, N), { color: 'accent', width: 2.2, domain: [0, a], n: 400 }); sC.fn((y) => Vn(xc.value, y, NMAX), { color: 'ink', alpha: 0.35, width: 1.2, domain: [0, a], n: 400 });
          for (let n = 1; n <= NMAX; n++) sB.rect(n - 0.35, 0, n + 0.35, b[n], { color: n <= N ? 'accent' : 'faint', fill: n <= N ? 'accent' : 'faint', fillAlpha: 0.35 });
          let mx = -1e9; for (let k = 0; k <= 400; k++) mx = Math.max(mx, Vn(xc.value, (a * k) / 400, N));
          info = { mx, N };
        });
        v.legend([['green', 'target $V_0(y)$ (at $x=0$)'], ['accent', 'partial sum $V_N$'], ['ink', 'N = 80 terms']]);
        v.readout(() => `Largest value of $V_N$ on 401 sampled cut points: $${v.fix(info.mx, 3)}\\,V_0$ with $N=${info.N}$ terms.${pf.value === 'sq' && xc.value === 0 ? ' This is the Gibbs overshoot; it tends to $1.179\\,V_0$ and does not shrink as $N$ grows.' : ' For fixed $x_c>0$ the harmonic factors decay exponentially with degree; the boundary $x_c=0$ has no such damping.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Method',
      name: 'Separation of variables in spherical coordinates',
      statement: String.raw`For a problem with azimuthal symmetry, the general solution of $\nabla^2V=0$ is
$$V(r,\theta)=\sum_{\ell=0}^{\infty}\Bigl(A_\ell r^\ell+\frac{B_\ell}{r^{\ell+1}}\Bigr)P_\ell(\cos\theta).$$
For separately regular interior and decaying exterior solutions with prescribed potential $V_0(\theta)$ on $r=R$, write the boundary coefficients as $A_\ell$ (distinct from the radial coefficients in the general formula). The potential inside is $\sum_\ell A_\ell\,(r/R)^\ell P_\ell(\cos\theta)$ and outside $\sum_\ell A_\ell\,(R/r)^{\ell+1}P_\ell(\cos\theta)$, with
$$A_\ell=\frac{2\ell+1}{2}\int_0^\pi V_0(\theta)\,P_\ell(\cos\theta)\sin\theta\,d\theta.$$`,
      idea: String.raw`With $V=R(r)\Theta(\theta)$, the angular equation is Legendre's equation (finite at both poles only for integer $\ell$, giving $P_\ell(\cos\theta)$) and the radial one is $r^2R''+2rR'=\ell(\ell+1)R$ with solutions $r^\ell$, $r^{-\ell-1}$ (em-2.8; ode-4.5). Regularity at the origin and decay at infinity pick one of them in each region, continuity of $V$ at $r=R$ fixes the match, and the orthogonality $\int P_\ell P_{\ell'}\,d\cos\theta=\tfrac{2}{2\ell+1}\delta_{\ell\ell'}$ gives $A_\ell$. By uniqueness (em-3.5) this is the solution. The $\ell=0$ term $A_0$ is the average of $V_0$ over the sphere, and equals the potential at the centre.`,
      caption: String.raw`Choose the potential on a sphere of radius $R=2$ as a function of the polar angle and add Legendre terms one by one ($L$ is the highest $\ell$ used). The left panel is the meridian plane with the partial-sum potential inside and outside; the right panel compares the boundary values of the sum with the target, and the bars show the coefficients $A_\ell$. The smooth $P_2$ profile is exact once $L=2$ (only its degree-2 coefficient is nonzero). For the hemisphere jump the root-mean-square tail decreases as $O(L^{-1/2})$, while its mean-square error is $O(L^{-1})$. Boundary jumps retain pointwise Gibbs ringing.`,
      scope: String.raw`Two Dirichlet problems with the same prescribed spherical boundary data: the interior solution is regular at the origin and the exterior solution decays at infinity. Joining them generally requires a surface-charge density $\sigma=(\varepsilon_0/R)\sum_\ell(2\ell+1)A_\ell P_\ell$; it is false that the nonconstant sphere is charge-free. A connected perfect conductor cannot maintain a nonconstant potential. Coefficients of the displayed profiles use exact polynomial antiderivatives; RMS mismatch uses Parseval, with roundoff clamped only below zero.`,
      credit: 'Legendre separation and orthogonality; precise author treatment',
      verify: false,
      links: { 'Full author text': 'https://farside.ph.utexas.edu/teaching/jk1/Electromagnetism.pdf' },
      deps: ['em-2.8', 'em-3.5', 'ode-4.5'],
      refs: ['Fitzpatrick, Classical Electromagnetism, §§3.3–3.4 pp. 50–52, §3.8 pp. 57–58'],
      tags: ['legendre', 'separation of variables'],
      viz(v) {
        const R = 2, LM = 30;
        const pats = { hemi: (x) => (x >= 0 ? 1 : -1), cap: (x) => (x >= 0.5 ? 1 : 0), p2: (x) => (3 * x * x - 1) / 2, stripe: (x) => (Math.abs(x) < 0.3 ? 1 : 0) };
        const A = Object.fromEntries(Object.keys(pats).map(k => [k,sphereCoefficients(k,LM)]));
        const s = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 320, axes: false, weight: 1.3, title: 'meridian plane' });
        const sT = v.stage({ x: [0, 180], y: [-1.6, 1.6], height: 320, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: 'polar angle $\\theta$ (degrees)', ylabel: '$V/V_0$ on the sphere', title: 'boundary values' });
        const sB = v.stage({ x: [-0.5, LM + 0.5], y: [-1, 1], height: 200, axes: 'box', gutter: true, full: true, xlabel: 'degree $\\ell$', ylabel: '$A_\\ell/V_0$', title: 'coefficients' });
        const pf = v.select('potential on the sphere', [{ value: 'hemi', label: '± hemispheres' }, { value: 'cap', label: 'polar cap' }, { value: 'stripe', label: 'equatorial band' }, { value: 'p2', label: 'smooth ($P_2$)' }], 'hemi');
        const Ls = v.slider('highest degree $L$', 0, LM, 3, { int: true });
        let info = {};
        v.render(() => {
          const a = A[pf.value], L = Ls.value;
          const Vf = (x, y) => { const r = Math.hypot(x, y); if (r < 1e-9) return a[0]; const c = x / r, P = legendre(L, c), q = r < R ? r / R : R / r; let t = 0; for (let l = 0; l <= L; l++) t += a[l] * (r < R ? Math.pow(q, l) : Math.pow(q, l + 1)) * P[l]; return t; };
          s.heat(Vf, { range: [-1.2, 1.2], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: `${pf.value}${L}`, alpha: 0.9 });
          s.contour(Vf, levels(0.2, 6).filter((z) => z), { color: 'ink', alpha: 0.3, width: 1, res: 120 });
          s.circle(0, 0, R, { color: 'ink', width: 2.4 });
          s.text('polar axis →', 4.9, 0.25, { align: 'right', size: 11, color: 'muted' });
          const bv = (th) => { const c = Math.cos(th), P = legendre(L, c); let t = 0; for (let l = 0; l <= L; l++) t += a[l] * P[l]; return t; };
          sT.fn((th) => pats[pf.value](Math.cos((th * Math.PI) / 180)), { color: 'green', dash: true, width: 1.6, domain: [0, 180], n: 361 });
          sT.fn((th) => bv((th * Math.PI) / 180), { color: 'accent', width: 2.2, domain: [0, 180], n: 361 });
          const amax = Math.max(...a.map(Math.abs), .1)*1.15; sB.setView([-.5,LM+.5],[-amax,amax]);
          for (let l = 0; l <= LM; l++) sB.rect(l - 0.35, 0, l + 0.35, a[l], { color: l <= L ? 'accent' : 'faint', fill: l <= L ? 'accent' : 'faint', fillAlpha: 0.4 });
          const err = sphereRms(pf.value,a,L);
          info = { err, c: Vf(0, 0), avg: a[0] };
        });
        v.legend([['green', 'target $V_0(\\theta)$'], ['accent', 'partial sum']]);
        v.readout(() => `Root-mean-square mismatch on the sphere: $${v.fix(info.err, 3)}\\,V_0$. Potential at the centre $=A_0=${v.fix(info.avg, 3)}\\,V_0$, the average of $V_0$ over the sphere (mean-value property, em-2.15).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.16
    {
      num: '3.16',
      kind: 'Model',
      name: 'Conducting sphere in a uniform field',
      statement: String.raw`An uncharged conducting sphere of radius $R$ placed in an initially uniform field $\mathbf E_0=E_0\hat{\mathbf z}$ has outside potential
$$V(r,\theta)=-E_0\Bigl(r-\frac{R^3}{r^2}\Bigr)\cos\theta,$$
and induced surface charge $\sigma(\theta)=3\varepsilon_0E_0\cos\theta$. The disturbance is a dipole of moment $p=4\pi\varepsilon_0R^3E_0$ at the centre. A charge $Q$ on the sphere adds $Q/4\pi\varepsilon_0r$ and $Q/4\pi R^2$ to $V$ and $\sigma$.`,
      idea: String.raw`In spherical coordinates with the polar axis along $\mathbf E_0$ (em-3.15), only $\ell=1$ is needed: the uniform field is $-E_0r\cos\theta$ and the response has the same angular dependence, $B_1\cos\theta/r^2$. Making the sphere an equipotential (take $V=0$ on $r=R$) gives $B_1=E_0R^3$. By uniqueness (em-3.5) that is the answer. The field at the surface is radial, $E_r=3E_0\cos\theta$, so $\sigma=\varepsilon_0E_r$ (em-3.2): positive on the side the field points to, and the net induced charge is zero.`,
      caption: String.raw`The meridian plane of a conducting sphere in a uniform field pointing right. Field lines bend to meet the surface at right angles; the rim is coloured by the induced surface charge (red positive, blue negative). Add a net charge $Q$ and the symmetry breaks. Drag the probe point to read the field: on the surface its tangential part is zero. Far away the sphere looks like a point dipole of moment $p=4\pi\varepsilon_0R^3E_0$ (readout).`,
      scope: String.raw`Isolated conducting sphere in an otherwise uniform external field, vacuum. Drawn in a plane containing the axis; the picture is three-dimensional (axially symmetric), so the plotted lines are the true field lines.`,
      deps: ['em-3.15'],
      refs: ['Griffiths §3.3'],
      tags: ['sphere', 'dipole'],
      viz(v) {
        const s = v.stage({ x: [-5.5, 5.5], y: [-3.6, 3.6], equal: true, height: 360, axes: false, weight: 1.3, title: 'conducting sphere in a uniform field' });
        const sS = v.stage({ x: [0, 360], y: [-1, 1], height: 360, axes: 'box', gutter: true, weight: 0.8, minWidth: 240, xlabel: 'polar angle $\\theta$ (degrees)', ylabel: '$\\sigma$ (nC/cm²)', title: 'surface charge' });
        const Rs = v.slider('radius $R$', 0.8, 2.4, 1.5, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` }), E0s = v.slider('applied field $E_0$', 0, 3000, 1500, { step: 100, fmt: (x) => `${x} V/cm` }), Qs = v.slider('charge on sphere $Q$', -6, 6, 0, { step: 0.5, fmt: (x) => `${x} nC` });
        const h = s.handle(2.8, 1.8, { color: 'gold', r: 8, constrain: (x, y) => { const R = Rs.value, r = Math.hypot(x, y); return r < R ? [(x / r) * R, (y / r) * R] : [x, y]; } });
        let info = {};
        v.render(() => {
          const R = Rs.value, E0 = E0s.value, Q = Qs.value, Fl = (x, y) => {
            const r = Math.hypot(x, y); if (r < R) return [0, 0];
            const c = x / r, sn = y / r, Er = E0 * (1 + (2 * R ** 3) / r ** 3) * c + (KV * Q) / (r * r), Et = -E0 * (1 - R ** 3 / r ** 3) * sn;
            return [Er * c - Et * sn, Er * sn + Et * c];
          };
          const Vf = (x, y) => { const r = Math.hypot(x, y); return r < R ? (KV * Q) / R : -E0 * (r - R ** 3 / (r * r)) * (x / r) + (KV * Q) / r; };
          const sc = Math.max(E0 * 2, 300);
          heatPot(s, Vf, sc, `v${R}${E0}${Q}`, { res: 3, alpha: 0.7 });
          s.contour((x, y) => (Math.hypot(x, y) < R ? NaN : Vf(x, y) - (KV * Q) / R), levels(sc / 3, 8).filter((z) => z), { color: 'ink', alpha: 0.28, width: 1, res: 140 });
          const seeds = []; for (let k = 0; k < 17; k++) seeds.push([-5.4, -3.4 + (6.8 * k) / 16]); for (let k = 0; k < 20; k++) { const t = (TAU * (k + 0.5)) / 20; seeds.push([(R + 0.03) * Math.cos(t), (R + 0.03) * Math.sin(t)]); }
          const box = [-5.5, 5.5, -3.6, 3.6];
          drawLines(s, Fl, seeds.slice(0, 17), box, { color: 'accent', dir: 1, h: 0.07, n: 800, alpha: 0.75, stop: (x, y) => Math.hypot(x, y) < R + 0.005 });
          const into = seeds.slice(17).filter((p) => Fl(p[0], p[1])[0] * p[0] + Fl(p[0], p[1])[1] * p[1] > 0);
          drawLines(s, Fl, into, box, { color: 'accent', dir: 1, h: 0.07, n: 800, alpha: 0.75, stop: (x, y) => Math.hypot(x, y) < R + 0.005 });
          const into2 = seeds.slice(17).filter((p) => Fl(p[0], p[1])[0] * p[0] + Fl(p[0], p[1])[1] * p[1] <= 0);
          drawLines(s, Fl, into2, box, { color: 'accent', dir: -1, h: 0.07, n: 800, alpha: 0.75, stop: (x, y) => Math.hypot(x, y) < R + 0.005 });
          // surface charge ring
          const sg = (t) => EPS0 * (3 * E0 * Math.cos(t)) + Q / (4 * Math.PI * R * R), sm = Math.max(Math.abs(sg(0)), Math.abs(sg(Math.PI)), 1e-9);
          for (let k = 0; k < 120; k++) { const t0 = (TAU * k) / 120, t1 = (TAU * (k + 1)) / 120, m = sg((t0 + t1) / 2); s.path([[R * Math.cos(t0), R * Math.sin(t0)], [R * Math.cos(t1), R * Math.sin(t1)]], { color: m >= 0 ? 'red' : 'blue', width: 2 + 8 * Math.abs(m) / sm, alpha: 0.85 }); }
          s.circle(0, 0, R * 0.985, { color: 'ink', width: 1, fill: 'muted', fillAlpha: 0.25 });
          for (let k = -1; k <= 1; k++) s.arrow(-5.3, k * 0.5 + 3.3 - 0, -4.5, k * 0.5 + 3.3, { color: 'accent', width: 2, head: 7 }); s.tex('\\mathbf E_0', -4.3, 3.3, { color: 'accent', size: 13 });
          const f = Fl(h.x, h.y), m = Math.hypot(...f), r = Math.hypot(h.x, h.y), n = [h.x / r, h.y / r];
          if (m > 0) s.arrow(h.x, h.y, h.x + (f[0] / m) * 1.1, h.y + (f[1] / m) * 1.1, { color: 'green', width: 2.6, head: 9 });
          const top = Math.max(sm * 1.2, 1e-6); sS.setView([0, 360], [-top, top]);
          sS.fn((t) => sg((t * Math.PI) / 180), { color: 'red', width: 2.2, domain: [0, 360], n: 361 }); sS.hline(0, { color: 'faint' });
          const ang = Math.atan2(h.y, h.x); sS.vline((((ang * 180) / Math.PI) + 360) % 360, { color: 'gold', dash: true });
          info = { f, m, En: f[0] * n[0] + f[1] * n[1], Et: -f[0] * n[1] + f[1] * n[0], r, R, p: ((4 * Math.PI * R ** 3 * E0 * EPS0) * 1) , s0: sg(0), onSurf: r < R + 0.02 };
        });
        v.readout(() => `Field at the probe: $|\\mathbf E|=${v.fix(info.m, 0)}$ V/cm (${v.fix(info.m / (E0sv()), 2)}$E_0$), radial part $${v.fix(info.En, 0)}$, tangential part $${v.fix(info.Et, 1)}$ V/cm${info.onSurf ? ' — on the surface the field is purely normal.' : '.'}\nInduced dipole moment $p=4\\pi\\varepsilon_0R^3E_0=${v.fix(info.p, 3)}$ nC·cm; peak surface density $\\sigma=${v.fix(info.s0, 3)}$ nC/cm² (at $\\theta=0$).`);
        function E0sv() { return E0s.value || 1; }
      },
    },
    // ───────────────────────────────────────────────────────────── 3.17
    {
      num: '3.17',
      kind: 'Method',
      name: 'Complex potential in two dimensions',
      statement: String.raw`For a two-dimensional field (independent of $z$), let $w(\zeta)=u(x,y)+i\,v(x,y)$ be an analytic function of $\zeta=x+iy$. Then $u$ and $v$ are both harmonic, and the curves $u=\text{const}$ and $v=\text{const}$ cross at right angles wherever their gradients are nonzero. Taking $V=u$ as the potential, the field lines are the curves $v=\text{const}$, and
$$E_x-iE_y=-\frac{dw}{d\zeta}.$$
Every analytic function is therefore a solution of some electrostatic problem; conductors lie along equipotential curves of $u$.`,
      idea: String.raw`Analyticity means the Cauchy–Riemann equations, $u_x=v_y$ and $u_y=-v_x$ (rca-11.10). Then $\nabla u\cdot\nabla v=u_xv_x+u_yv_y=-u_xu_y+u_yu_x=0$, so the level curves of $u$ and $v$ are orthogonal, and differentiating once more gives $u_{xx}+u_{yy}=0$ (em-2.8, vcalc-7.10). $|\nabla u|=|\nabla v|=|w'|$, and $E=-\nabla u$ is read from $w'$. A nonanalytic pair need not obey these conclusions, although orthogonality or harmonicity alone does not imply analyticity: complex conjugation has both properties. The displayed counterexample has Laplacian 1; at special points its gradients may still be orthogonal.`,
      caption: String.raw`Choose a function $w(\zeta)$. Equipotentials ($u=$ const) are orange, field lines ($v=$ const) blue; the green dot is a probe you can drag, and the readout gives the angle between the two level curves there, which is $90^\circ$ at regular points of an analytic branch and undefined at a zero gradient. The last choice, a made-up non-analytic pair, breaks Cauchy–Riemann: the curves can cross at a non-right angle and the Laplacian of $u$ is not zero.`,
      scope: String.raw`Two-dimensional fields on analytic branches, away from poles, branch cuts and critical points. At $w\prime=0$ both gradients vanish and a crossing angle is undefined. The principal log/square-root cut is masked in the contour mesh instead of drawing discontinuity artifacts. The cylinder example uses $w=\zeta-1/\zeta$ and the exterior $|\zeta|\ge1$, so its real part is constant on the unit circle. Derivatives and Laplacians are analytic formulas, not finite differences across a branch cut.`,
      credit: 'Complex-potential construction after Feynman, Leighton and Sands, II §7–2',
      verify: false,
      links: { 'Full author lecture': 'https://www.feynmanlectures.caltech.edu/II_07.html#Ch7-S2' },
      deps: ['em-2.8', 'rca-11.10', 'vcalc-7.10'],
      refs: ['Feynman Lectures II §7–2, Eqs. 7.3–7.15 and Figs. 7–1 to 7–5; analytic derivative and cylinder boundary check supplied here'],
      tags: ['complex potential', 'harmonic'],
      viz(v) {
        const cx = (re, im) => [re, im], mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], inv = (a) => { const d = a[0] * a[0] + a[1] * a[1] || 1e-12; return [a[0] / d, -a[1] / d]; };
        const F = {
          z2: { w: (z) => mul(z, z), t: '$\\zeta^2$: a right-angle corner / saddle', du: 1.5, dv: 1.5 },
          z3: { w: (z) => mul(z, mul(z, z)), t: '$\\zeta^3$: a $60^\\circ$ corner', du: 4, dv: 4 },
          inv: { w: (z) => inv(z), t: '$1/\\zeta$: a line dipole', du: 0.25, dv: 0.25 },
          ln: { w: (z) => [Math.log(Math.hypot(z[0], z[1]) || 1e-9), Math.atan2(z[1], z[0])], t: '$\\ln\\zeta$: a line charge', du: 0.3, dv: Math.PI / 8, voff: Math.PI / 16 },
          jou: { w: (z) => { const i = inv(z); return [z[0] - i[0], z[1] - i[1]]; }, t: '$\\zeta-1/\\zeta$: a cylinder in a uniform field', du: 0.6, dv: 0.5 },
          sqrt: { w: (z) => { const r = Math.sqrt(Math.hypot(z[0], z[1])), t = Math.atan2(z[1], z[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; }, t: '$\\sqrt\\zeta$: the edge of a half-plane conductor', du: 0.25, dv: 0.25 },
          sin: { w: (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])], t: '$\\sin\\zeta$: periodic strips', du: 0.25, dv: 0.5 },
          bad: { w: (z) => [z[0] * z[0] - 0.5 * z[1] * z[1], 2 * z[0] * z[1]], t: 'NOT analytic: $u=x^2-y^2/2,\\ v=2xy$', du: 1.5, dv: 2 },
        };
        const names = [['z2', '$\\zeta^2$'], ['z3', '$\\zeta^3$'], ['inv', '$1/\\zeta$'], ['ln', '$\\ln\\zeta$'], ['jou', '$\\zeta-1/\\zeta$'], ['sqrt', '$\\sqrt\\zeta$'], ['sin', '$\\sin\\zeta$'], ['bad', 'not analytic']].map(([value, label]) => ({ value, label }));
        const s = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 400, axes: true, weight: 1, title: 'equipotentials and field lines' });
        const fs = v.select('$w(\\zeta)$', names, 'z2');
        const h = s.handle(1.2, 0.8, { color: 'green', r: 8 });
        let info = {};
        v.render(() => {
          const f = F[fs.value], U = (x, y) => f.w([x, y])[0], Vv = (x, y) => f.w([x, y])[1], clip = (g) => (x, y) => { const r = Math.hypot(x, y); return (['inv','ln','sqrt'].includes(fs.value) && r < .08) || (fs.value === 'jou' && r < 1) || (['ln','sqrt'].includes(fs.value) && x < 0 && Math.abs(y) < .04) ? NaN : g(x, y); };
          const uL = []; for (let k = -9; k <= 9; k++) uL.push(k * f.du); const vL = []; for (let k = -9; k <= 9; k++) vL.push(k * f.dv + (f.voff || 0));
          s.contour(clip(U), uL.filter((x) => Math.abs(x) < 80), { color: 'orange', width: 1.5, alpha: 0.85, res: 220 });
          s.contour(clip(Vv), vL.filter((x) => Math.abs(x) < 80), { color: 'accent', width: 1.5, alpha: 0.85, res: 220 });
          if (fs.value === 'jou') s.circle(0,0,1,{color:'ink',width:2.2});
          const C = complexField(fs.value,h.x,h.y);
          if (C.error) { info={...C,t:f.t}; return; }
          const {gu,gv,mu,mv} = C;
          if (mu > 1e-10) s.arrow(h.x,h.y,h.x+gu[0]/mu*.7,h.y+gu[1]/mu*.7,{color:'orange',width:2.6,head:8});
          if (mv > 1e-10) s.arrow(h.x,h.y,h.x+gv[0]/mv*.7,h.y+gv[1]/mv*.7,{color:'accent',width:2.6,head:8});
          info={...C,t:f.t};
        });
        v.legend([['orange', 'equipotentials $u=$ const'], ['accent', 'field lines $v=$ const']]);
        v.readout(() => info.error ? info.error : `${info.t}.\nAt the probe: angle between $\\nabla u$ and $\\nabla v$ is ${info.ang === null ? 'undefined (zero gradient)' : '$'+v.fix(info.ang,2)+'^\\circ$'}; Cauchy–Riemann residuals $u_x-v_y=${v.fix(info.cr1, 4)}$, $u_y+v_x=${v.fix(info.cr2, 4)}$; $\\nabla^2u=${v.fix(info.lap, 3)}$; $|\\nabla u|=${v.fix(info.mu, 3)}$, $|\\nabla v|=${v.fix(info.mv, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.18
    {
      num: '3.18',
      kind: 'Method',
      name: 'Conformal mapping of electrostatic problems',
      statement: String.raw`Let $\zeta=f(w)$ be a one-to-one analytic map between domains, with $f\prime\ne0$. If $V$ is harmonic in the $w$ domain, then $V\circ f^{-1}$ is harmonic in its image, preserving corresponding boundary values. A nonzero derivative alone gives only local invertibility, not a global inverse. For example, $\zeta=(d/\pi)(w+1+e^w)$ maps $|\operatorname{Im}w|<\pi$ to the plane slit along $y=\pm d,x\le0$. The potential $V=V_0\operatorname{Im}w/\pi$ gives the fringing field of plates held at $\pm V_0$.`,
      idea: String.raw`Because $f$ is analytic (rca-14.2), the Laplacian transforms as $\nabla_\zeta^2V=|f'|^{-2}\nabla_w^2V$ (rca-11.10 and em-3.17), so harmonic stays harmonic and boundary values carry over; uniqueness (em-3.5) says that is the solution. For the plate-edge map, the edges of the strip, $\operatorname{Im}w=\pm\pi$, give $e^w=-e^u$ and so $\operatorname{Im}\zeta=\pm d$ with $\operatorname{Re}\zeta=\frac d\pi(u+1-e^u)\le0$: the plates, traversed out and back. The field strength is $|E|=\frac{V_0}{d}\,|1+e^w|^{-1}$, equal to the uniform value $V_0/d$ deep between the plates and singular only at the plate tips $w=\pm i\pi$.`,
      caption: String.raw`Left: the strip in the $w$-plane with the potential lines (horizontal) and field lines (vertical) of a uniform field. Right: their images under $\zeta=\frac d\pi(w+1+e^w)$ with $d=\pi$: the equipotentials bunch round the plate edges and bulge outwards, the field lines fan out. Drag the point in either picture: the other follows (the right-hand point is inverted by a monotone scalar solve, with an explicit finite-window constraint), carrying its equipotential with it.`,
      scope: String.raw`Two-dimensional, zero-thickness, semi-infinite plates. The specific map and field factor were checked in Ostiguy, PAC1993, Eqs.6–9 p.2902; Maxwell Treatise article numbering and original priority are omitted. The two handles are always synchronized after a scalar monotone inverse and three analytic-Jacobian residual corrections. Requested points outside the finite source window are projected to that window and explicitly reported; a plate-boundary request is rejected. Plotted line segments are finite samples of the infinite map.`,
      credit: 'Conformal fringing-field construction; specific map after Ostiguy (PAC1993)',
      verify: false,
      links: { 'Full map source': 'https://epaper.kek.jp/p93/PDF/PAC1993_2901.PDF', 'Full author derivation': 'https://legacy-www.math.harvard.edu/archive/115_fall_06/electrostatics_application.pdf' },
      deps: ['em-3.17', 'rca-14.2'],
      refs: ['Ostiguy, Longitudinal Profile and Effective Length of a Conventional Dipole Magnet, PAC1993 pp.2901–2903, Eqs.6–9 p.2902', 'Siu, Conformal Mappings and Application to Electrostatics, Math115 (2006–2007), harmonic pullback derivation'],
      tags: ['conformal map', 'fringing field'],
      viz(v) {
        const P = Math.PI;
        const f = fringeMap;
        const sW = v.stage({ x: [-4.5, 2.6], y: [-P - 0.5, P + 0.5], equal: true, height: 360, axes: false, weight: 1, minWidth: 250, title: '$w$-plane: uniform field in a strip' });
        const sZ = v.stage({ x: [-9, 6], y: [-P - 1.6, P + 1.6], equal: true, height: 360, axes: false, weight: 1.35, title: '$\\zeta$-plane: plate edge' });
        const hw = sW.handle(-0.4, 1.1, { color: 'gold', r: 8, constrain: { x: [-4.4, 1.05], y: [-P + 0.04, P - 0.04] } });
        const hz = sZ.handle(0, 0, { color: 'gold', r: 8 });
        let busy = false;
        const sync = () => { const z = f(hw.x, hw.y); hz.set(z[0], z[1]); };
        let inverseNote = '';
        hw.onDrag = () => { if (busy) return; busy=true; inverseNote=''; sync(); busy=false; };
        hz.onDrag = () => { if (busy) return; busy=true; const requested=[hz.x,hz.y], w=fringeInverse(...requested);
          if (w.error) inverseNote=w.error;
          else { const u=Math.max(-4.4,Math.min(1.05,w.u)), vv=Math.max(-P+.04,Math.min(P-.04,w.v)); hw.set(u,vv); inverseNote=Math.abs(u-w.u)+Math.abs(vv-w.v)>1e-7?'Requested point is outside the finite source window; its preimage was constrained.':''; }
          sync(); busy=false;
        };
        let init = false, info = {};
        v.render(() => {
          if (!init) { init = true; sync(); }
          for (let k = -5; k <= 5; k++) {
            const vv = (k * P) / 6; if (Math.abs(vv) >= P - 1e-9) continue;
            sW.line(-4.5, vv, 2.6, vv, { color: 'orange', width: 1.4, alpha: 0.8 });
            sZ.curve((t) => f(t, vv), -6, 2.4, { color: 'orange', width: 1.4, alpha: 0.8, n: 300 });
          }
          for (let k = -12; k <= 5; k++) {
            const u = k * 0.5; sW.line(u, -P, u, P, { color: 'accent', width: 1.2, alpha: 0.7 });
            sZ.curve((t) => f(u, t), -P, P, { color: 'accent', width: 1.2, alpha: 0.7, n: 200 });
          }
          sW.line(-4.5, P, 2.6, P, { color: 'red', width: 3.5 }); sW.line(-4.5, -P, 2.6, -P, { color: 'blue', width: 3.5 });
          sZ.curve((t) => f(t, P), -6, 0, { color: 'red', width: 3.5, n: 200 }); sZ.curve((t) => f(t, -P), -6, 0, { color: 'blue', width: 3.5, n: 200 });
          const z = f(hw.x, hw.y);
          sW.curve((t) => [t, hw.y], -4.5, 2.6, { color: 'gold', width: 2.4 }); sZ.curve((t) => f(t, hw.y), -6, 2.4, { color: 'gold', width: 2.4, n: 300 });
          sW.line(hw.x, -P, hw.x, P, { color: 'gold', width: 2.4 }); sZ.curve((t) => f(hw.x, t), -P, P, { color: 'gold', width: 2.4, n: 200 });
          sW.text('+V₀', -4.3, P + 0.28, { size: 12, color: 'red' }); sW.text('−V₀', -4.3, -P - 0.28, { size: 12, color: 'blue' });
          info = { V: hw.y / P, E: 1 / Math.hypot(1 + Math.exp(hw.x) * Math.cos(hw.y), Math.exp(hw.x) * Math.sin(hw.y)), z };
        });
        v.readout(() => `The point $w=${v.fix(hw.x, 2)}${hw.y < 0 ? '-' : '+'}${v.fix(Math.abs(hw.y), 2)}i$ maps to $\\zeta=${v.fix(info.z[0], 2)}${info.z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(info.z[1]), 2)}i$ (cm, with $d=\\pi$). Potential $V=${v.fix(info.V, 3)}\\,V_0$ (the same in both pictures); field strength $|E|=${v.fix(info.E, 3)}\\,V_0/d$ — it tends to $1$ deep inside the gap ($\\operatorname{Re}w\\to-\\infty$) and diverges at the plate tips. ${inverseNote}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.19
    {
      num: '3.19',
      kind: 'Method',
      name: 'Relaxation method for Laplace’s equation',
      statement: String.raw`On a square Dirichlet grid with $n$ intervals per side ($n+1$ nodes, $n-1$ free nodes per direction), the five-point approximation to Laplace’s equation sets each free value to the average of its four neighbours. Jacobi uses old values; Gauss–Seidel uses the newest values. For this positive-definite discrete problem, lexicographic SOR converges for every initial guess when $0<\omega<2$. Its optimal factor is $\omega_{opt}=2/(1+\sin(\pi/n))$. At $\omega=2$ convergence is not guaranteed; for $\omega>2$ the iteration is unstable, although an exact fixed point would remain fixed.`,
      idea: String.raw`The fixed point has the discrete mean-value property. On this model square, iteration spectral radii are $\rho_J=\cos(\pi/n)$, $\rho_{GS}=\rho_J^2$, and $\rho_{SOR,opt}=\omega_{opt}-1$. These describe asymptotic error behavior; an arbitrary residual need not decrease by that factor on every sweep, especially for nonnormal SOR. For a fixed reduction as the grid is refined, Jacobi requires $O(n^2)$ sweeps and optimal SOR $O(n)$. Jacobi and Gauss–Seidel averaging preserve existing extrema, while over-relaxation can overshoot them; the discrete maximum principle applies to the final solution, not every SOR iterate.`,
      caption: String.raw`A $33\times33$ box with a different potential on each wall. The left panel is the SOR iterate after the number of sweeps you choose; the right panel is the residual (largest four-neighbour averaging defect) on a log scale for **Jacobi**, **Gauss–Seidel** and **SOR with your $\omega$**. Drag $\omega$ from 1 towards 2: the line steepens up to the optimum $\omega_{opt}$ and then gets worse; above $2$ generic errors grow. Dashed lines indicate asymptotic spectral slopes; a display floor marks roundoff-scale residuals.`,
      scope: String.raw`33 nodes and 32 intervals per side; zero initial interior, fixed boundary values. Residual means max absolute four-neighbour average minus current value, in volts. The log display has a $10^{-13}$ floor and expands upward to include unstable growth. Histories stop on the first residual above $10^{12}$, and the selected SOR sweep is constrained to the computed history. Dashed curves are slope references with a common arbitrary initial anchor, not rigorous residual bounds. Measured factors use at most 90 available samples from sweep30 with residual above $10^{-10}$.`,
      credit: 'Finite-difference relaxation; spectral formulas checked in Demmel, CS267 Lecture24 (1995)',
      verify: false,
      links: { 'Full author convergence text': 'https://www-users.cse.umn.edu/~saad/IterMethBook_2ndEd.pdf', 'Full author numerical derivation': 'https://people.eecs.berkeley.edu/~demmel/cs267-1995/lecture24/lecture24.html' },
      deps: ['em-2.15', 'em-3.5'],
      refs: ['Saad, Iterative Methods for Sparse Linear Systems (2nd ed.,2003), §4.2.4 Theorem4.10 p.122; §4.2.5 Theorem4.16 and Eq.4.47 pp.126–127', 'Demmel, CS267 Notes for Lecture24, 13April1995, Jacobi, Gauss–Seidel, SOR spectral factors (his n interior nodes corresponds to n+1 intervals)', 'Zahn, Electromagnetic Field Theory, §4.5 pp.297–301, five-point relaxation'],
      tags: ['relaxation', 'numerical'],
      viz(v) {
        const N = 33, SW = 300;
        const s = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 330, axes: false, weight: 0.9, minWidth: 250, title: 'SOR iterate' });
        const sR = v.stage({ x: [0, SW], y: [1e-13, 10], ylog: true, height: 330, axes: 'box', gutter: true, weight: 1.2, xlabel: 'sweeps', ylabel: 'residual (V)', title: 'residual by method' });
        const om = v.slider('relaxation factor $\\omega$', 0.2, 2.1, 1.8, { step: 0.01 }), nS = v.slider('sweeps shown', 0, SW, 20, { int: true });
        const problem=relaxationProblem(N), {fixed,initial:V0}=problem;
        let key='', H={}, histories={};
        const run=()=>{ histories=relaxationHistory(problem,om.value,SW); H={J:histories.J.r,G:histories.G.r,S:histories.S.r}; };
        const slope = (r) => { const ix = []; for (let k = 30; k < r.length && ix.length < 90; k++) if (r[k][1] > 1e-10) ix.push(k); if (ix.length < 12) return NaN; const a = ix[0], b = ix[ix.length - 1]; return Math.exp(Math.log(r[b][1] / r[a][1]) / (b - a)); };
        let info = {};
        v.render(() => {
          const o = om.value; if (String(o) !== key) { key = String(o); run(); }
          nS.input.max=String(H.S.length-1); if(nS.value>H.S.length-1)nS.set(H.S.length-1); const n=nS.value,V=Float64Array.from(V0);sor(V,fixed,N,N,o,n);
          s.heat((x, y) => Math.tanh(samp(V, N, N, -1, 1, -1, 1, x, y) / 5), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: `r${o}${n}`, alpha: 0.9 });
          s.contour((x, y) => samp(V, N, N, -1, 1, -1, 1, x, y), levels(1, 5).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 50 });
          const upper=Math.max(10,...Object.values(H).flat().map(p=>p[1]))*1.25; sR.setView([0,SW],[1e-13,upper]);
          const cl = (r) => r.map((p) => [p[0], Math.max(p[1], 1e-13)]);
          sR.path(cl(H.J), { color: 'muted', width: 2 }); sR.path(cl(H.G), { color: 'orange', width: 2 }); sR.path(cl(H.S), { color: 'accent', width: 2.6 });
          const rj = Math.cos(Math.PI / (N - 1)), wopt = 2 / (1 + Math.sin(Math.PI / (N - 1))), r0 = H.J[0][1];
          const th = (rho, color) => sR.fn((x) => r0 * Math.pow(rho, x), { color, dash: true, width: 1, alpha: 0.6, domain: [0, SW] });
          th(rj, 'muted'); th(rj * rj, 'orange'); th(wopt - 1, 'green');
          sR.vline(n, { color: 'gold', dash: true });
          info = { rj, wopt, mJ: slope(H.J), mG: slope(H.G), mS: slope(H.S), res: H.S[n][1], stop: histories.S.stopped, last: H.S.length-1, o };
        });
        v.legend([['muted', 'Jacobi'], ['orange', 'Gauss–Seidel'], ['accent', 'SOR with your $\\omega$'], ['green', 'dashed green: optimal SOR rate']]);
        v.readout(() => `Measured residual factors from up to 90 samples starting at sweep30, excluding values below $10^{-10}$: Jacobi $${v.fix(info.mJ, 4)}$ (theory $\\cos(\\pi/32)=${v.fix(info.rj, 4)}$), Gauss–Seidel $${v.fix(info.mG, 4)}$ (theory $${v.fix(info.rj * info.rj, 4)}$), SOR $${isNaN(info.mS) ? '—' : v.fix(info.mS, 4)}$ at $\\omega=${v.fix(info.o, 2)}$. Optimal $\\omega_{opt}=${v.fix(info.wopt, 3)}$ gives rate $${v.fix(info.wopt - 1, 3)}$.${info.o >= 2 ? ' **This factor does not guarantee convergence.**' : ''}${info.stop ? ' History stopped at sweep '+info.last+' after the residual exceeded the numerical cap.' : ''}`);
      },
    },
  ],
};
