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
The series converges for $x>0$ and reproduces $V_0$ at $x=0$ in the mean (and pointwise where $V_0$ is continuous).`,
      idea: String.raw`Separating variables turns Laplace's equation (em-2.8) into two ordinary differential equations (a harmonic-oscillator pair). The conditions on the sides force $Y=\sin(n\pi y/a)$ and the decay at infinity picks $X=e^{-n\pi x/a}$. These products are a basis (Fourier sine series, pma-8.10, pma-8.14): the end condition fixes the coefficients. The sum is the unique solution (em-3.5). The exponentials damp the $n$-th term by $e^{-n\pi x/a}$, so high harmonics (and any roughness in $V_0$) die out within a distance $\sim a/n\pi$ of the end; yet at $x=0$ a jump in $V_0$ gives a Gibbs overshoot of about $9\%$ of the jump of the odd extension.`,
      caption: String.raw`A slot of width $a$ with the left end held at the profile $V_0(y)$ you select. Add terms one at a time ($N$): the heat map and contours show the partial sum. At the cut $x=x_c$ (slider, right panel) the partial sum (blue) converges almost at once for $x_c>0$; at $x_c=0$ the *square* profile has Gibbs ringing that never goes away: the first overshoot stays near $1.18\,V_0$. Bars show the coefficients $b_n$ used.`,
      scope: String.raw`Slot of width $a=4$ cm with the end at fixed potential and the far end at infinity. With the end plate in contact with the grounded sides, the corners are at the boundary of the discontinuous data, where the potential is itself discontinuous: the series is an honest solution everywhere except at those two points.`,
      credit: 'J. Fourier, 1822 (series); Bernoulli, 1750s',
      verify: true,
      deps: ['em-2.8', 'em-3.5', 'pma-8.10', 'pma-8.14', 'pde-5.6'],
      refs: ['Griffiths §3.3'],
      tags: ['separation of variables', 'fourier'],
      viz(v) {
        const a = 4, NMAX = 80;
        const prof = { sq: (y) => 1, tri: (y) => 1 - Math.abs((2 * y) / a - 1), half: (y) => (y < a / 2 ? 1 : 0), two: (y) => (y < a / 3 || y > (2 * a) / 3 ? 0 : 1) };
        const B = {}; for (const k of Object.keys(prof)) B[k] = Array.from({ length: NMAX + 1 }, (_, n) => (n === 0 ? 0 : (2 / a) * v.M.integrate((y) => prof[k](y) * Math.sin((n * Math.PI * y) / a), 0, a, 1600)));
        const s = v.stage({ x: [0, 2 * a], y: [0, a], equal: true, height: 270, axes: false, weight: 1.5, title: 'partial sum $V_N(x,y)$' });
        const sC = v.stage({ x: [0, a], y: [-0.2, 1.4], height: 270, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: '$y$ (cm)', ylabel: '$V/V_0$', title: 'profile at the cut' });
        const sB = v.stage({ x: [0, 40], y: [-1.2, 1.4], height: 200, axes: 'box', gutter: true, full: true, xlabel: 'harmonic $n$', ylabel: '$b_n/V_0$', title: 'coefficients (blue = included)' });
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
          for (let n = 1; n <= 40; n++) sB.rect(n - 0.35, 0, n + 0.35, b[n], { color: n <= N ? 'accent' : 'faint', fill: n <= N ? 'accent' : 'faint', fillAlpha: 0.35 });
          let mx = -1e9; for (let k = 0; k <= 400; k++) mx = Math.max(mx, Vn(xc.value, (a * k) / 400, N));
          info = { mx, N };
        });
        v.legend([['green', 'target $V_0(y)$ (at $x=0$)'], ['accent', 'partial sum $V_N$'], ['ink', 'N = 80 terms']]);
        v.readout(() => `Largest value of $V_N$ on the cut: $${v.fix(info.mx, 3)}\\,V_0$ with $N=${info.N}$ terms.${pf.value === 'sq' && xc.value === 0 ? ' This is the Gibbs overshoot; it tends to $1.179\\,V_0$ and does not shrink as $N$ grows.' : ' Away from $x=0$ the series converges geometrically, like $e^{-\\pi x/a}$ per term.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Method',
      name: 'Separation of variables in spherical coordinates',
      statement: String.raw`For a problem with azimuthal symmetry, the general solution of $\nabla^2V=0$ is
$$V(r,\theta)=\sum_{\ell=0}^{\infty}\Bigl(A_\ell r^\ell+\frac{B_\ell}{r^{\ell+1}}\Bigr)P_\ell(\cos\theta).$$
If the potential on the sphere $r=R$ is $V_0(\theta)$, the field inside is $\sum_\ell A_\ell\,(r/R)^\ell P_\ell(\cos\theta)$ and outside $\sum_\ell A_\ell\,(R/r)^{\ell+1}P_\ell(\cos\theta)$, with
$$A_\ell=\frac{2\ell+1}{2}\int_0^\pi V_0(\theta)\,P_\ell(\cos\theta)\sin\theta\,d\theta.$$`,
      idea: String.raw`With $V=R(r)\Theta(\theta)$, the angular equation is Legendre's equation (finite at both poles only for integer $\ell$, giving $P_\ell(\cos\theta)$) and the radial one is $r^2R''+2rR'=\ell(\ell+1)R$ with solutions $r^\ell$, $r^{-\ell-1}$ (em-2.8; ode-4.5). Regularity at the origin and decay at infinity pick one of them in each region, continuity of $V$ at $r=R$ fixes the match, and the orthogonality $\int P_\ell P_{\ell'}\,d\cos\theta=\tfrac{2}{2\ell+1}\delta_{\ell\ell'}$ gives $A_\ell$. By uniqueness (em-3.5) this is the solution. The $\ell=0$ term $A_0$ is the average of $V_0$ over the sphere, and equals the potential at the centre.`,
      caption: String.raw`Choose the potential on a sphere of radius $R=2$ as a function of the polar angle and add Legendre terms one by one ($L$ is the highest $\ell$ used). The left panel is the meridian plane with the partial-sum potential inside and outside; the right panel compares the boundary values of the sum with the target, and the bars show the coefficients $A_\ell$. The smooth profile is exact after two terms; the jump at the equator is never captured exactly: the mismatch shrinks only like $1/\sqrt L$ in the mean square.`,
      scope: String.raw`Azimuthally symmetric data on a sphere in empty space, no charge in the shell $r=R$ (use em-3.16 for a conducting sphere in an applied field). The coefficients are computed numerically (Simpson rule, 4000 points).`,
      credit: 'Legendre, 1782 (polynomials); Laplace, 1780s',
      verify: true,
      deps: ['em-2.8', 'em-3.5', 'ode-4.5'],
      refs: ['Griffiths §3.3'],
      tags: ['legendre', 'separation of variables'],
      viz(v) {
        const R = 2, LM = 30;
        const pats = { hemi: (x) => (x >= 0 ? 1 : -1), cap: (x) => (x >= 0.5 ? 1 : 0), p2: (x) => (3 * x * x - 1) / 2, stripe: (x) => (Math.abs(x) < 0.3 ? 1 : 0) };
        const A = {}; for (const k of Object.keys(pats)) { A[k] = []; for (let l = 0; l <= LM; l++) A[k].push(((2 * l + 1) / 2) * v.M.integrate((x) => pats[k](x) * legendre(l, x)[l], -1, 1, 4000)); }
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
          for (let l = 0; l <= LM; l++) sB.rect(l - 0.35, 0, l + 0.35, a[l], { color: l <= L ? 'accent' : 'faint', fill: l <= L ? 'accent' : 'faint', fillAlpha: 0.4 });
          const err = Math.sqrt(v.M.integrate((x) => { const P = legendre(L, x); let t = 0; for (let l = 0; l <= L; l++) t += a[l] * P[l]; return (t - pats[pf.value](x)) ** 2 / 2; }, -1, 1, 1000));
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
      statement: String.raw`For a two-dimensional field (independent of $z$), let $w(\zeta)=u(x,y)+i\,v(x,y)$ be an analytic function of $\zeta=x+iy$. Then $u$ and $v$ are both harmonic, and the curves $u=\text{const}$ and $v=\text{const}$ cross at right angles. Taking $V=u$ as the potential, the field lines are the curves $v=\text{const}$, and
$$E_x-iE_y=-\frac{dw}{d\zeta}.$$
Every analytic function is therefore a solution of some electrostatic problem; conductors lie along equipotential curves of $u$.`,
      idea: String.raw`Analyticity means the Cauchy–Riemann equations, $u_x=v_y$ and $u_y=-v_x$ (rca-11.10). Then $\nabla u\cdot\nabla v=u_xv_x+u_yv_y=-u_xu_y+u_yu_x=0$, so the level curves of $u$ and $v$ are orthogonal, and differentiating once more gives $u_{xx}+u_{yy}=0$ (em-2.8, vcalc-7.10). $|\nabla u|=|\nabla v|=|w'|$, and $E=-\nabla u$ is read from $w'$. A function that is not analytic fails: its level curves are not orthogonal, and its real part is generally not harmonic.`,
      caption: String.raw`Choose a function $w(\zeta)$. Equipotentials ($u=$ const) are orange, field lines ($v=$ const) blue; the green dot is a probe you can drag, and the readout gives the angle between the two level curves there, which is $90^\circ$ at every point of an analytic function. The last choice, a made-up non-analytic pair, breaks Cauchy–Riemann: the curves cross at the wrong angle and the Laplacian of $u$ is not zero.`,
      scope: String.raw`Two-dimensional fields only, away from singularities of $w$; branch cuts (for $\sqrt\zeta$ and $\ln\zeta$) are conductors or are drawn through, and contours of the multivalued part $v$ may show a spurious line along the cut. The $v$ of $\ln\zeta$ is the angle, so its field lines are rays from a line charge.`,
      credit: 'Rankine / Maxwell, 1860s–1873',
      verify: true,
      deps: ['em-2.8', 'rca-11.10', 'vcalc-7.10'],
      refs: ['Feynman II ch. 7'],
      tags: ['complex potential', 'harmonic'],
      viz(v) {
        const cx = (re, im) => [re, im], mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], inv = (a) => { const d = a[0] * a[0] + a[1] * a[1] || 1e-12; return [a[0] / d, -a[1] / d]; };
        const F = {
          z2: { w: (z) => mul(z, z), t: '$\\zeta^2$: a right-angle corner / saddle', du: 1.5, dv: 1.5 },
          z3: { w: (z) => mul(z, mul(z, z)), t: '$\\zeta^3$: a $60^\\circ$ corner', du: 4, dv: 4 },
          inv: { w: (z) => inv(z), t: '$1/\\zeta$: a line dipole', du: 0.25, dv: 0.25 },
          ln: { w: (z) => [Math.log(Math.hypot(z[0], z[1]) || 1e-9), Math.atan2(z[1], z[0])], t: '$\\ln\\zeta$: a line charge', du: 0.3, dv: Math.PI / 8, voff: Math.PI / 16 },
          jou: { w: (z) => { const i = inv(z); return [z[0] + i[0], z[1] + i[1]]; }, t: '$\\zeta+1/\\zeta$: a cylinder in a uniform field', du: 0.6, dv: 0.5 },
          sqrt: { w: (z) => { const r = Math.sqrt(Math.hypot(z[0], z[1])), t = Math.atan2(z[1], z[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; }, t: '$\\sqrt\\zeta$: the edge of a half-plane conductor', du: 0.25, dv: 0.25 },
          sin: { w: (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])], t: '$\\sin\\zeta$: periodic strips', du: 0.25, dv: 0.5 },
          bad: { w: (z) => [z[0] * z[0] - z[1] * z[1], 3 * z[0] * z[1]], t: 'NOT analytic: $u=x^2-y^2,\\ v=3xy$', du: 2, dv: 2 },
        };
        const names = [['z2', '$\\zeta^2$'], ['z3', '$\\zeta^3$'], ['inv', '$1/\\zeta$'], ['ln', '$\\ln\\zeta$'], ['jou', '$\\zeta+1/\\zeta$'], ['sqrt', '$\\sqrt\\zeta$'], ['sin', '$\\sin\\zeta$'], ['bad', 'not analytic']].map(([value, label]) => ({ value, label }));
        const s = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 400, axes: true, weight: 1, title: 'equipotentials and field lines' });
        const fs = v.select('$w(\\zeta)$', names, 'z2');
        const h = s.handle(1.2, 0.8, { color: 'green', r: 8 });
        let info = {};
        v.render(() => {
          const f = F[fs.value], U = (x, y) => f.w([x, y])[0], Vv = (x, y) => f.w([x, y])[1], clip = (g) => (x, y) => { const r = Math.hypot(x, y); return r < 0.12 ? NaN : g(x, y); };
          const uL = []; for (let k = -9; k <= 9; k++) uL.push(k * f.du); const vL = []; for (let k = -9; k <= 9; k++) vL.push(k * f.dv + (f.voff || 0));
          s.contour(clip(U), uL.filter((x) => Math.abs(x) < 80), { color: 'orange', width: 1.5, alpha: 0.85, res: 220 });
          s.contour(clip(Vv), vL.filter((x) => Math.abs(x) < 80), { color: 'accent', width: 1.5, alpha: 0.85, res: 220 });
          const d = 1e-4, gu = [(U(h.x + d, h.y) - U(h.x - d, h.y)) / (2 * d), (U(h.x, h.y + d) - U(h.x, h.y - d)) / (2 * d)], gv = [(Vv(h.x + d, h.y) - Vv(h.x - d, h.y)) / (2 * d), (Vv(h.x, h.y + d) - Vv(h.x, h.y - d)) / (2 * d)];
          const mu = Math.hypot(...gu), mv = Math.hypot(...gv), ang = (Math.acos((gu[0] * gv[0] + gu[1] * gv[1]) / (mu * mv)) * 180) / Math.PI;
          s.arrow(h.x, h.y, h.x + (gu[0] / mu) * 0.7, h.y + (gu[1] / mu) * 0.7, { color: 'orange', width: 2.6, head: 8 }); s.arrow(h.x, h.y, h.x + (gv[0] / mv) * 0.7, h.y + (gv[1] / mv) * 0.7, { color: 'accent', width: 2.6, head: 8 });
          const lap = (U(h.x + 1e-2, h.y) + U(h.x - 1e-2, h.y) + U(h.x, h.y + 1e-2) + U(h.x, h.y - 1e-2) - 4 * U(h.x, h.y)) / 1e-4;
          info = { ang, cr1: gu[0] - gv[1], cr2: gu[1] + gv[0], lap, t: f.t, mu, mv };
        });
        v.legend([['orange', 'equipotentials $u=$ const'], ['accent', 'field lines $v=$ const']]);
        v.readout(() => `${info.t}.\nAt the probe: angle between $\\nabla u$ and $\\nabla v$ is $${v.fix(info.ang, 2)}^\\circ$; Cauchy–Riemann residuals $u_x-v_y=${v.fix(info.cr1, 4)}$, $u_y+v_x=${v.fix(info.cr2, 4)}$; $\\nabla^2u=${v.fix(info.lap, 3)}$; $|\\nabla u|=${v.fix(info.mu, 3)}$, $|\\nabla v|=${v.fix(info.mv, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.18
    {
      num: '3.18',
      kind: 'Method',
      name: 'Conformal mapping of electrostatic problems',
      statement: String.raw`If $\zeta=f(w)$ is analytic and $f'\neq0$, it maps harmonic functions to harmonic functions: a potential $V(w)$ solving Laplace's equation in the $w$-plane gives $V(f^{-1}(\zeta))$ solving it in the $\zeta$-plane, with the same boundary values on corresponding boundaries. A hard geometry is solved by mapping it to an easy one. For example
$$\zeta=\frac d\pi\bigl(w+1+e^{w}\bigr)$$
maps the strip $|\operatorname{Im}w|<\pi$, where $V=V_0\operatorname{Im}w/\pi$ is the uniform field between two plates, onto the whole plane with two semi-infinite plates $y=\pm d$, $x<0$: the potential is the fringing field at their ends.`,
      idea: String.raw`Because $f$ is analytic (rca-14.2), the Laplacian transforms as $\nabla_\zeta^2V=|f'|^{-2}\nabla_w^2V$ (rca-11.10 and em-3.17), so harmonic stays harmonic and boundary values carry over; uniqueness (em-3.5) says that is the solution. For the plate-edge map, the edges of the strip, $\operatorname{Im}w=\pm\pi$, give $e^w=-e^u$ and so $\operatorname{Im}\zeta=\pm d$ with $\operatorname{Re}\zeta=\frac d\pi(u+1-e^u)\le0$: the plates, traversed out and back. The field strength is $|E|=\frac{V_0}{d}\,|1+e^w|^{-1}$, equal to the uniform value $V_0/d$ deep between the plates and singular only at the plate tips $w=\pm i\pi$.`,
      caption: String.raw`Left: the strip in the $w$-plane with the potential lines (horizontal) and field lines (vertical) of a uniform field. Right: their images under $\zeta=\frac d\pi(w+1+e^w)$ with $d=\pi$: the equipotentials bunch round the plate edges and bulge outwards, the field lines fan out. Drag the point in either picture: the other follows (the right-hand point is inverted by Newton's method), carrying its equipotential with it.`,
      scope: String.raw`Two-dimensional, perfectly conducting plates of zero thickness at potentials $\pm V_0$, half-infinite; this is Maxwell's classical solution (*Treatise* Art. 189) for the end effect of a plate pair. The picture is the field in the exterior and in the gap.`,
      credit: 'J. C. Maxwell, 1873 (Treatise)',
      verify: true,
      deps: ['em-3.17', 'rca-14.2'],
      refs: ['Feynman II ch. 7'],
      tags: ['conformal map', 'fringing field'],
      viz(v) {
        const P = Math.PI;
        const f = (u, vv) => [u + 1 + Math.exp(u) * Math.cos(vv), vv + Math.exp(u) * Math.sin(vv)];
        const sW = v.stage({ x: [-4.5, 2.6], y: [-P - 0.5, P + 0.5], equal: true, height: 360, axes: false, weight: 1, minWidth: 250, title: '$w$-plane: uniform field in a strip' });
        const sZ = v.stage({ x: [-9, 6], y: [-P - 1.6, P + 1.6], equal: true, height: 360, axes: false, weight: 1.35, title: '$\\zeta$-plane: plate edge' });
        const hw = sW.handle(-0.4, 1.1, { color: 'gold', r: 8, constrain: { x: [-4.4, 2.4], y: [-P + 0.04, P - 0.04] } });
        const hz = sZ.handle(0, 0, { color: 'gold', r: 8 });
        let busy = false;
        const sync = () => { const z = f(hw.x, hw.y); hz.set(z[0], z[1]); };
        const inv = (zx, zy) => {
          let u = hw.x, vv = hw.y;
          for (let it = 0; it < 60; it++) {
            const z = f(u, vv), rx = z[0] - zx, ry = z[1] - zy, a = 1 + Math.exp(u) * Math.cos(vv), b = Math.exp(u) * Math.sin(vv), d = a * a + b * b;
            if (d < 1e-12) break;
            const du = (rx * a + ry * b) / d, dv = (ry * a - rx * b) / d; u -= du; vv -= dv; vv = Math.max(-P + 0.02, Math.min(P - 0.02, vv)); u = Math.max(-6, Math.min(3.2, u));
            if (Math.hypot(du, dv) < 1e-10) break;
          }
          return [u, vv];
        };
        hw.onDrag = () => { if (busy) return; busy = true; sync(); busy = false; };
        hz.onDrag = () => { if (busy) return; busy = true; const w = inv(hz.x, hz.y); hw.set(w[0], w[1]); busy = false; };
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
        v.readout(() => `The point $w=${v.fix(hw.x, 2)}${hw.y < 0 ? '-' : '+'}${v.fix(Math.abs(hw.y), 2)}i$ maps to $\\zeta=${v.fix(info.z[0], 2)}${info.z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(info.z[1]), 2)}i$ (cm, with $d=\\pi$). Potential $V=${v.fix(info.V, 3)}\\,V_0$ (the same in both pictures); field strength $|E|=${v.fix(info.E, 3)}\\,V_0/d$ — it is $1$ deep inside the gap ($\\operatorname{Re}w\\to-\\infty$) and rises to infinity at the plate tips.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.19
    {
      num: '3.19',
      kind: 'Method',
      name: 'Relaxation method for Laplace’s equation',
      statement: String.raw`On a square grid of spacing $h$, replace $\nabla^2V=0$ by the five-point rule $V_{i,j}=\tfrac14(V_{i\pm1,j}+V_{i,j\pm1})$. Starting from any guess and repeatedly replacing each free value by the average of its neighbours (**Jacobi**, or **Gauss–Seidel** using updated values at once), with boundary values held fixed, converges to the discrete solution. **Over-relaxation** (SOR) with $V\leftarrow V+\omega(\bar V-V)$ converges for $0<\omega<2$, fastest near $\omega_{opt}=2/(1+\sin\pi/n)$ on an $n\times n$ grid, and diverges for $\omega\ge2$.`,
      idea: String.raw`The fixed point of the averaging rule is the discrete mean-value property (em-2.15), the grid version of Laplace's equation. The error satisfies the same rule with zero boundary data, so it is damped by a factor equal to the spectral radius $\rho$ of the iteration: $\rho_J=\cos(\pi/n)$ for Jacobi, $\rho_J^2$ for Gauss–Seidel, and $\omega_{opt}-1$ for optimal SOR (Young, Frankel). On a fine grid $\rho_J\approx1-\pi^2/2n^2$ so plain relaxation needs $O(n^2)$ sweeps; SOR needs $O(n)$. The maximum principle (em-3.5) keeps the iterates between the boundary extremes while the residual falls.`,
      caption: String.raw`A $33\times33$ box with a different potential on each wall. The left panel is the SOR iterate after the number of sweeps you choose; the right panel is the residual (largest change a sweep would make) on a log scale for **Jacobi**, **Gauss–Seidel** and **SOR with your $\omega$**. Drag $\omega$ from 1 towards 2: the line steepens up to the optimum $\omega_{opt}$ and then gets worse; past $2$ the residual explodes. Dashed lines are the theoretical rates.`,
      scope: String.raw`Grid $n=33$ points per side (32 cells), Dirichlet data. Convergence rates quoted are the exact spectral radii for the model Poisson problem on a square, and the measured per-sweep factor in the readout is taken from the first 90 sweeps after sweep 30 in which the residual is still above $10^{-10}$ (a run that is already below that shows a dash). The residual of SOR at the optimum oscillates, so its average rate is $\omega_{opt}-1$ only roughly.`,
      credit: 'Southwell (relaxation, 1930s–40s); Young & Frankel (SOR, 1950)',
      verify: true,
      deps: ['em-2.15', 'em-3.5'],
      refs: ['Griffiths §3.1'],
      tags: ['relaxation', 'numerical'],
      viz(v) {
        const N = 33, SW = 300;
        const s = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 330, axes: false, weight: 0.9, minWidth: 250, title: 'SOR iterate' });
        const sR = v.stage({ x: [0, SW], y: [1e-13, 10], ylog: true, height: 330, axes: 'box', gutter: true, weight: 1.2, xlabel: 'sweeps', ylabel: 'residual (V)', title: 'residual by method' });
        const om = v.slider('relaxation factor $\\omega$', 0.2, 2.1, 1.8, { step: 0.01 }), nS = v.slider('sweeps shown', 0, SW, 20, { int: true });
        const fixed = new Uint8Array(N * N), V0 = new Float64Array(N * N);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i; if (j === N - 1) { fixed[k] = 1; V0[k] = 5; } else if (j === 0) { fixed[k] = 1; V0[k] = 0; } else if (i === 0) { fixed[k] = 1; V0[k] = -3; } else if (i === N - 1) { fixed[k] = 1; V0[k] = 1; } }
        const jac = (V, tmp) => { tmp.set(V); for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!fixed[k]) V[k] = 0.25 * (tmp[k - 1] + tmp[k + 1] + tmp[k - N] + tmp[k + N]); } };
        let key = '', H = {};
        const run = () => {
          const o = om.value, out = {};
          const mk = (step) => { const V = Float64Array.from(V0), tmp = new Float64Array(N * N), r = [[0, resid(V, fixed, N, N)]]; let blown = false; for (let n = 1; n <= SW; n++) { if (!blown) { step(V, tmp); const e = resid(V, fixed, N, N); if (!isFinite(e) || e > 1e8) blown = true; r.push([n, blown ? 1e8 : e]); } } return r; };
          out.J = mk((V, t) => jac(V, t)); out.G = mk((V) => sor(V, fixed, N, N, 1, 1)); out.S = mk((V) => sor(V, fixed, N, N, o, 1));
          H = out;
        };
        const slope = (r) => { const ix = []; for (let k = 30; k < r.length && ix.length < 90; k++) if (r[k][1] > 1e-10) ix.push(k); if (ix.length < 12) return NaN; const a = ix[0], b = ix[ix.length - 1]; return Math.exp(Math.log(r[b][1] / r[a][1]) / (b - a)); };
        let info = {};
        v.render(() => {
          const o = om.value; if (String(o) !== key) { key = String(o); run(); }
          const n = nS.value, V = Float64Array.from(V0); sor(V, fixed, N, N, o, n);
          s.heat((x, y) => Math.tanh(samp(V, N, N, -1, 1, -1, 1, x, y) / 5), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: `r${o}${n}`, alpha: 0.9 });
          s.contour((x, y) => samp(V, N, N, -1, 1, -1, 1, x, y), levels(1, 5).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 50 });
          const cl = (r) => r.map((p) => [p[0], Math.max(p[1], 1e-13)]);
          sR.path(cl(H.J), { color: 'muted', width: 2 }); sR.path(cl(H.G), { color: 'orange', width: 2 }); sR.path(cl(H.S), { color: 'accent', width: 2.6 });
          const rj = Math.cos(Math.PI / (N - 1)), wopt = 2 / (1 + Math.sin(Math.PI / (N - 1))), r0 = H.J[1][1];
          const th = (rho, color) => sR.fn((x) => r0 * Math.pow(rho, x), { color, dash: true, width: 1, alpha: 0.6, domain: [0, SW] });
          th(rj, 'muted'); th(rj * rj, 'orange'); th(wopt - 1, 'green');
          sR.vline(n, { color: 'gold', dash: true });
          info = { rj, wopt, mJ: slope(H.J), mG: slope(H.G), mS: slope(H.S), res: H.S[n] ? H.S[n][1] : 0, o };
        });
        v.legend([['muted', 'Jacobi'], ['orange', 'Gauss–Seidel'], ['accent', 'SOR with your $\\omega$'], ['green', 'dashed green: optimal SOR rate']]);
        v.readout(() => `Per-sweep error factors measured between sweep 30 and the time each run reaches $10^{-10}$: Jacobi $${v.fix(info.mJ, 4)}$ (theory $\\cos(\\pi/32)=${v.fix(info.rj, 4)}$), Gauss–Seidel $${v.fix(info.mG, 4)}$ (theory $${v.fix(info.rj * info.rj, 4)}$), SOR $${isNaN(info.mS) ? '—' : v.fix(info.mS, 4)}$ at $\\omega=${v.fix(info.o, 2)}$. Optimal $\\omega_{opt}=${v.fix(info.wopt, 3)}$ gives rate $${v.fix(info.wopt - 1, 3)}$.${info.o >= 2 ? ' **At $\\omega\\ge2$ the iteration no longer converges.**' : ''}`);
      },
    },
  ],
};
