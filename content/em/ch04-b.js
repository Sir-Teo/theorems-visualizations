// Electromagnetism — Chapter 4, part b: items 4.7–4.11 (energy in an external field, delta derivatives, linear quadrupole, water, uniqueness)
import { TAU, KV, pot, fld, sgnCol, drawCharge, heatPot, levels, moments, hess3, drawLines, nC } from './ch04.shared.js';

export default {
  collection: 'em',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Energy of a charge cluster in an external field',
      statement: String.raw`A small cluster of charges $q_i$ near the point $\mathbf R$ in an external potential $\varphi$ (produced by other, fixed charges) has interaction energy $U=\sum_iq_i\varphi(\mathbf r_i)$. Expanding $\varphi$ about $\mathbf R$ gives
$$U\simeq Q\,\varphi(\mathbf R)\;-\;\mathbf p\cdot\mathbf E(\mathbf R)\;+\;\frac16\sum_{jk}\Theta_{jk}\,\partial_j\partial_k\varphi(\mathbf R)\;+\;\cdots,$$
with $Q$, $\mathbf p$, $\Theta$ the monopole, dipole and quadrupole moments about $\mathbf R$ and $\mathbf E=-\nabla\varphi$. Each omitted term is smaller by another factor (size of cluster)/(distance to the sources of $\varphi$).`,
      idea: String.raw`Taylor-expand $\varphi(\mathbf R+\mathbf s_i)=\varphi+\mathbf s_i\!\cdot\!\nabla\varphi+\tfrac12\sum s_{ij}s_{ik}\partial_j\partial_k\varphi+\dots$ and multiply by $q_i$ and sum: the sums $\sum q_i$, $\sum q_i\mathbf s_i$ and $\sum q_is_{ij}s_{ik}$ are the moments of em-4.2 and em-4.4. Because the sources of $\varphi$ are elsewhere, $\nabla^2\varphi=0$ at the cluster (em-2.8), so the trace part of $\sum qs_js_k$ drops out and only the traceless $\Theta$, with prefactor $1/6$, survives. The dipole term is the energy $-\mathbf p\cdot\mathbf E$ whose derivative gives the torque and force of em-1.12.`,
      caption: String.raw`Three outside charges (drag them) make a potential, drawn as a map. A cluster of four charges sits at the gold handle, and the **size** slider scales it uniformly. The right plot has the error of the three approximations (order 0 green, 1 blue, 2 orange) on log–log axes against the cluster size: each extra order steepens the line by one power of the size (slopes about 1, 2, 3), so shrinking the cluster by 10 improves the dipole truncation 100-fold. Add a net charge with the toggle: the order-0 term $Q\varphi$ then carries almost all of the energy, and the dipole term is only a correction to it; for the neutral cluster order 0 is exactly zero and the dipole term leads.`,
      scope: String.raw`Sources of $\varphi$ outside the cluster and the cluster's size smaller than the distance to them; the expansion fails if the cluster is dragged next to an outside charge. The charges are in a plane, with the true three-dimensional $1/r$ law; energies in nC·V (nJ).`,
      deps: ['em-4.2', 'em-4.4', 'em-1.12'],
      refs: ['Griffiths §4.1'],
      tags: ['energy', 'dipole'],
      viz(v) {
        const s = v.stage({ x: [-6, 6], y: [-4.2, 4.2], equal: true, height: 340, axes: false, weight: 1.1, title: 'outside charges and the cluster' });
        const sp = v.stage({ x: [0.02, 1.6], y: [1e-10, 1e3], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'cluster size (cm)', ylabel: 'error of the approximation (nJ)', title: 'error against size' });
        const sz = v.slider('cluster size', 0.02, 1.6, 0.3, { log: true, fmt: (x) => `${v.fmt(x, 2)} cm` });
        const net = v.toggle('cluster carries net charge', false);
        const ext = [[-3.6, 1.8, 6], [3.8, -1.4, -5], [0.5, 3.1, 4]].map(([x, y, q]) => ({ q, h: s.handle(x, y, { color: sgnCol(q), r: 8 }) }));
        const C = s.handle(-0.4, -0.6, { color: 'gold', r: 8 });
        const off = [[-0.9, 0.4], [0.8, 0.6], [0.3, -0.9], [-0.3, -0.25]], q0 = [1.2, -1.2, 0.9, -0.9];
        let info = {};
        v.render(() => {
          const E = ext.map((e) => ({ x: e.h.x, y: e.h.y, q: e.q })), qn = net.value ? q0.map((q, i) => (i === 0 ? q + 1 : q)) : q0;
          const mk = (S) => off.map((o, i) => ({ x: C.x + o[0] * S, y: C.y + o[1] * S, q: qn[i] }));
          const calc = (S) => {
            const cl = mk(S), U = cl.reduce((t, c) => t + c.q * pot(E, c.x, c.y), 0), m = moments(cl, C.x, C.y), f = fld(E, C.x, C.y), H = hess3(E, C.x, C.y, 0), ph = pot(E, C.x, C.y);
            const U0 = m.Q * ph, U1 = U0 - (m.p[0] * f[0] + m.p[1] * f[1]);
            let U2 = U1; for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) U2 += (m.T[j][k] * H[j][k]) / 6;
            return { U, U0, U1, U2 };
          };
          heatPot(s, (x, y) => pot(E, x, y), 700, 'x' + E.map((e) => e.x.toFixed(2) + e.y.toFixed(2)).join(), { res: 3, alpha: 0.7 });
          s.contour((x, y) => pot(E, x, y), levels(350, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          E.forEach((e) => drawCharge(s, e.x, e.y, e.q, 9));
          const cl = mk(sz.value); cl.forEach((c, i) => s.dot(c.x, c.y, { r: 6 + Math.abs(c.q) * 1.5, color: sgnCol(c.q) }));
          const f = fld(E, C.x, C.y), fm = Math.hypot(...f); if (fm > 0) s.arrow(C.x, C.y, C.x + (f[0] / fm) * 1.3, C.y + (f[1] / fm) * 1.3, { color: 'green', width: 2.6, head: 9 });
          s.tex('\\mathbf E', C.x + (f[0] / fm) * 1.5, C.y + (f[1] / fm) * 1.5 + 0.25, { color: 'green', size: 13 });
          const cols = ['green', 'accent', 'orange'];
          for (let n = 0; n < 3; n++) sp.fn((S) => { const c = calc(S); return Math.max(1e-12, Math.abs(c.U - [c.U0, c.U1, c.U2][n])); }, { domain: [0.02, 1.6], n: 90, color: cols[n], width: 2.2 });
          const c = calc(sz.value); for (let n = 0; n < 3; n++) sp.dot(sz.value, Math.max(1e-12, Math.abs(c.U - [c.U0, c.U1, c.U2][n])), { r: 5, color: cols[n] });
          const dmin = Math.min(...E.map((e) => Math.hypot(e.x - C.x, e.y - C.y)));
          info = { c, dmin, size: sz.value };
        });
        v.legend([['green', 'order 0: $Q\\varphi$'], ['accent', 'order 1: $+(-\\mathbf p\\cdot\\mathbf E)$'], ['orange', 'order 2: $+\\frac16\\Theta:\\nabla\\nabla\\varphi$']]);
        v.readout(() => `Exact $U=\\sum q_i\\varphi(\\mathbf r_i)=${v.fix(info.c.U, 3)}$ nJ.  Order 0: $${v.fix(info.c.U0, 3)}$; order 1: $${v.fix(info.c.U1, 3)}$; order 2: $${v.fix(info.c.U2, 3)}$.\nErrors ${[info.c.U0, info.c.U1, info.c.U2].map((u) => `$${v.sci(Math.abs(info.c.U - u) + 1e-14, 2)}$`).join(', ')} nJ. Nearest outside charge: ${v.fix(info.dmin, 1)} cm; cluster size ${v.fix(info.size, 2)} cm.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Point multipoles are derivatives of the delta',
      statement: String.raw`In the sense of distributions, the charge density of a point dipole $\mathbf p$ at the origin is $\rho=-\mathbf p\cdot\nabla\delta^3(\mathbf r)$ and that of a point quadrupole is $\rho=\tfrac12\sum_{jk}Q_{jk}\,\partial_j\partial_k\delta^3(\mathbf r)$ (with $Q_{jk}=\sum q\,x_jx_k$), so for every smooth test function $\varphi$
$$\int\rho\,\varphi\,d\tau=\mathbf p\cdot\nabla\varphi(0),\qquad \int\rho\,\varphi\,d\tau=\tfrac12\sum_{jk}Q_{jk}\,\partial_j\partial_k\varphi(0).$$
The limit of the pair $\pm p/\varepsilon$ at $\pm\varepsilon/2$, as $\varepsilon\to0$ at fixed $p$, is the dipole; the limit of $(+1,-2,+1)\,q/\varepsilon^2$ at $-\varepsilon,0,\varepsilon$ is the quadrupole $q\,\delta''$.`,
      idea: String.raw`A point charge at $\mathbf a$ is $q\,\delta^3(\mathbf r-\mathbf a)$ (em-1.19), and acting on a test function it evaluates $q\varphi(\mathbf a)$. Taylor-expanding $\varphi(\mathbf a)$ about $0$ makes the same cluster act as $\sum_n\frac1{n!}\,M^{(n)}\cdot\partial^n\varphi(0)$, where $M^{(n)}=\sum q_i\mathbf r_i^{\otimes n}$ is the $n$-th moment tensor; this is the action of a sum of derivatives of $\delta$ with the moments as coefficients (compare the structure theorem for distributions supported at a point, fa-6.25: every such distribution is a finite combination of derivatives of $\delta$). A symmetric difference quotient converges to the derivative with an error of order $\varepsilon^2$.`,
      caption: String.raw`The curve is a smooth test function $\varphi$ (choose one); drag the gold handle along it to place the point multipole at $x_0$. Set the order to **dipole** or **quadrupole**. The orange chord joins the two (or three) sampled values at spacing $\varepsilon$ and the green line is the tangent (parabola) at $x_0$; as $\varepsilon$ shrinks the pair's action $\langle\rho_\varepsilon,\varphi\rangle$ in the right plot converges to $\varphi'(x_0)$ (or $\varphi''(x_0)$) at a rate $\varepsilon^2$. The stems on the left show the charges, whose heights grow like $1/\varepsilon$ ($1/\varepsilon^2$) as they squeeze together at fixed moment.`,
      scope: String.raw`One space dimension (the pair of charges on a line), $p=1$ nC·cm, to keep the picture honest: the sign convention is the usual one for distributions, $\langle\delta',\varphi\rangle=-\varphi'(0)$. In three dimensions the same holds for each component of $\nabla$; convergence needs the test function smooth near the point.`,
      credit: 'L. Schwartz, theory of distributions, 1945–1950',
      verify: true,
      deps: ['em-4.1', 'em-1.19', 'fa-6.25'],
      refs: ['Griffiths §3.4'],
      tags: ['delta', 'distributions'],
      viz(v) {
        const fs = {
          bump: { t: 'bump', f: (x) => 1.6 * Math.exp(-x * x / 1.6) - 0.2, f1: (x) => -2 * x / 1.6 * 1.6 * Math.exp(-x * x / 1.6), f2: (x) => 1.6 * Math.exp(-x * x / 1.6) * ((2 * x / 1.6) ** 2 - 2 / 1.6) },
          wave: { t: 'wave', f: (x) => Math.sin(1.5 * x) + 0.1 * x * x, f1: (x) => 1.5 * Math.cos(1.5 * x) + 0.2 * x, f2: (x) => -2.25 * Math.sin(1.5 * x) + 0.2 },
          cubic: { t: 'cubic', f: (x) => 0.12 * x ** 3 - 0.5 * x, f1: (x) => 0.36 * x * x - 0.5, f2: (x) => 0.72 * x },
        };
        const sL = v.stage({ x: [-3, 3], y: [-2.6, 3], height: 340, axes: true, weight: 1.1, minWidth: 270, title: 'test function $\\varphi(x)$ and the squeezed charges' });
        const sR = v.stage({ x: [0.01, 3], y: [-4, 4], xlog: true, height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'spacing $\\varepsilon$', ylabel: '$\\langle\\rho_\\varepsilon,\\varphi\\rangle$', title: 'action on $\\varphi$ against spacing' });
        const fsel = v.select('test function', [{ value: 'bump', label: 'bump' }, { value: 'wave', label: 'wave' }, { value: 'cubic', label: 'cubic' }], 'wave');
        const ord = v.select('multipole', [{ value: 1, label: 'dipole: $-p\\,\\delta\'$' }, { value: 2, label: 'quadrupole: $q\\,\\delta\'\'$' }], 1);
        const eps = v.slider('spacing $\\varepsilon$', 0.01, 3, 1.2, { log: true, fmt: (x) => v.fmt(x, 3) });
        const h = sL.handle(0.4, fs.wave.f(0.4), { color: 'gold', r: 8, label: 'x₀', labelPos: 'n', constrain: (x) => [Math.max(-2.3, Math.min(2.3, x)), fs[fsel.value].f(Math.max(-2.3, Math.min(2.3, x)))] });
        let info = {};
        v.render(() => {
          const F = fs[fsel.value], x0 = h.x, e = eps.value, o = +ord.value; h.set(x0, F.f(x0));
          const act = (E) => (o === 1 ? (F.f(x0 + E / 2) - F.f(x0 - E / 2)) / E : (F.f(x0 - E) - 2 * F.f(x0) + F.f(x0 + E)) / (E * E)), lim = o === 1 ? F.f1(x0) : F.f2(x0);
          sL.fn(F.f, { domain: [-3, 3], color: 'ink', width: 2.2, n: 240 });
          if (o === 1) {
            sL.fn((x) => F.f(x0) + F.f1(x0) * (x - x0), { domain: [x0 - 1.1, x0 + 1.1], color: 'green', width: 2 });
            sL.line(x0 - e / 2, F.f(x0 - e / 2), x0 + e / 2, F.f(x0 + e / 2), { color: 'orange', width: 3 });
            const hgt = Math.min(2, 0.25 / e + 0.15);
            sL.line(x0 - e / 2, 0, x0 - e / 2, -hgt, { color: 'blue', width: 3 }); sL.dot(x0 - e / 2, -hgt, { r: 4, color: 'blue' });
            sL.line(x0 + e / 2, 0, x0 + e / 2, hgt, { color: 'red', width: 3 }); sL.dot(x0 + e / 2, hgt, { r: 4, color: 'red' });
            sL.dot(x0 - e / 2, F.f(x0 - e / 2), { r: 4, color: 'orange' }); sL.dot(x0 + e / 2, F.f(x0 + e / 2), { r: 4, color: 'orange' });
          } else {
            sL.fn((x) => F.f(x0) + F.f1(x0) * (x - x0) + 0.5 * F.f2(x0) * (x - x0) ** 2, { domain: [x0 - 1.2, x0 + 1.2], color: 'green', width: 2 });
            const pts = [x0 - e, x0, x0 + e].map((x) => [x, F.f(x)]);
            sL.path(pts, { color: 'orange', width: 2.4 });
            const hgt = Math.min(2.2, 0.2 / (e * e) + 0.15);
            [[-e, 1, 'red'], [0, -2, 'blue'], [e, 1, 'red']].forEach(([d, w, c]) => { sL.line(x0 + d, 0, x0 + d, (w * hgt) / 2, { color: c, width: 3 }); sL.dot(x0 + d, (w * hgt) / 2, { r: 4, color: c }); });
            pts.forEach(([x, y]) => sL.dot(x, y, { r: 4, color: 'orange' }));
          }
          sL.vline(x0, { color: 'faint', dash: true });
          sR.fn(act, { domain: [0.01, 3], n: 200, color: 'accent', width: 2.4 });
          sR.hline(lim, { color: 'green', dash: true, width: 1.8 }); sR.hline(0, { color: 'faint' });
          sR.dot(e, act(e), { r: 6, color: 'orange' });
          sR.text(o === 1 ? "φ′(x₀)" : "φ″(x₀)", 0.011, lim + 0.3, { size: 12, color: 'green' });
          info = { a: act(e), lim, o, e, a2: act(e / 2) };
        });
        v.legend([['ink', '$\\varphi$'], ['orange', 'chord through the sampled values'], ['green', 'tangent / osculating parabola'], ['accent', 'action of the pair']]);
        v.readout(() => `${info.o === 1 ? '$\\langle\\rho_\\varepsilon,\\varphi\\rangle=\\bigl[\\varphi(x_0+\\varepsilon/2)-\\varphi(x_0-\\varepsilon/2)\\bigr]/\\varepsilon$' : '$\\langle\\rho_\\varepsilon,\\varphi\\rangle=\\bigl[\\varphi(x_0-\\varepsilon)-2\\varphi(x_0)+\\varphi(x_0+\\varepsilon)\\bigr]/\\varepsilon^2$'} $=${v.fix(info.a, 4)}$ at $\\varepsilon=${v.fmt(info.e, 3)}$; the derivative is $${v.fix(info.lim, 4)}$. Error $${v.sci(Math.abs(info.a - info.lim) + 1e-15, 2)}$; halving $\\varepsilon$ leaves $${v.sci(Math.abs(info.a2 - info.lim) + 1e-15, 2)}$ (about a quarter).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Linear quadrupole',
      statement: String.raw`Three charges $-q,\,+2q,\,-q$ on a line at $x=-a,0,a$ have $Q=0$, $\mathbf p=0$ and quadrupole tensor $\Theta=\operatorname{diag}(-4qa^2,\,2qa^2,\,2qa^2)$ along the axis. Their potential at distance $r\gg a$ and angle $\theta$ from the axis is
$$V\simeq-\frac{1}{4\pi\varepsilon_0}\,\frac{2qa^2}{r^3}\,P_2(\cos\theta),\qquad P_2(\cos\theta)=\tfrac12(3\cos^2\theta-1),$$
and the field falls off as $r^{-4}$. The potential vanishes on the cones $\cos^2\theta=1/3$ ($\theta\approx54.7^\circ$ and $125.3^\circ$).`,
      idea: String.raw`The monopole moment is $-q+2q-q=0$; the dipole moment is $-q(-a)+2q\cdot0-q(a)=0$ by symmetry, so the leading surviving term of em-4.1 is $\ell=2$. Each end charge contributes $-q\,a^2P_2(\cos\theta)/r^3$ (since $P_2$ is even, $\theta\to\pi-\theta$ gives the same value) and the centre charge contributes nothing at second order, giving $-2qa^2P_2/r^3$. The structure is one dipole followed by an opposite dipole: two dipoles of opposite sign a distance $a$ apart.`,
      caption: String.raw`Left: the field lines (they start on the central $+2q$ and end on the two $-q$) and the potential of the exact three-charge system in a plane through the axis. Right: $V\,r^3/(kqa^2)$ against the angle $\theta$ from the axis for three distances (blue, teal, purple) approaching the quadrupole prediction $-2P_2(\cos\theta)$ (green dashed); at $r=10a$ the curves are indistinguishable. The monopole and dipole readouts are exactly zero for every spacing and every $q$.`,
      scope: String.raw`Axially symmetric about the line of charges; the plane drawn contains the axis, so the field lines are the true three-dimensional ones. The far-field formula needs $r\gg a$; the exact potential has corrections of relative order $(a/r)^2$.`,
      deps: ['em-4.4'],
      refs: ['Griffiths §3.4'],
      tags: ['quadrupole', 'model'],
      viz(v) {
        const s = v.stage({ x: [-5, 5], y: [-3.4, 3.4], equal: true, height: 340, axes: false, weight: 1.15, title: 'field lines and potential' });
        const sp = v.stage({ x: [0, 180], y: [-2.6, 2.6], height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'angle $\\theta$ from the axis (degrees)', ylabel: '$V r^3/(kqa^2)$', xticks: [0, 45, 90, 135, 180], title: 'angular pattern' });
        const aS = v.slider('spacing $a$', 0.3, 1.8, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` }), qS = v.slider('$q$', 0.5, 4, 2, { step: 0.1, fmt: (x) => nC(x) });
        const rS = v.slider('largest distance $r/a$', 3, 15, 6, { step: 0.5 });
        let info = {};
        v.render(() => {
          const a = aS.value, q = qS.value, src = [{ x: -a, y: 0, q: -q }, { x: 0, y: 0, q: 2 * q }, { x: a, y: 0, q: -q }], F = (x, y) => fld(src, x, y), box = [-5, 5, -3.4, 3.4];
          const sc = (KV * q) / (a * a);
          heatPot(s, (x, y) => pot(src, x, y), sc * 0.12, `q${a}${q}`, { res: 3, alpha: 0.75 });
          s.contour((x, y) => pot(src, x, y), levels(sc * 0.03, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 120 });
          const seeds = []; for (let k = 0; k < 28; k++) { const t = (TAU * (k + 0.5)) / 28; seeds.push([0.1 * Math.cos(t) * 1, 0.1 * Math.sin(t)]); }
          drawLines(s, F, seeds, box, { color: 'accent', h: 0.05, n: 2200, alpha: 0.8, stop: (x, y) => src.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < 0.09) });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 9));
          const rs = [3, (3 + rS.value) / 2, rS.value].map((r) => r * a), cs = ['accent', 'teal', 'purple'];
          rs.forEach((r, i) => sp.fn((t) => { const th = (t * Math.PI) / 180; return (pot(src, r * Math.cos(th), r * Math.sin(th)) * r ** 3) / (KV * q * a * a); }, { domain: [0, 180], n: 181, color: cs[i], width: 2 }));
          sp.fn((t) => -2 * (0.5 * (3 * Math.cos((t * Math.PI) / 180) ** 2 - 1)), { domain: [0, 180], n: 181, color: 'green', dash: true, width: 2.4 });
          sp.hline(0, { color: 'faint' });
          const m = moments(src), r = rs[2], th = Math.PI / 4;
          info = { Q: m.Q, p: Math.hypot(...m.p), T: m.T[0][0], T2: m.T[1][1], rel: Math.abs((pot(src, r * Math.cos(th), r * Math.sin(th)) * r ** 3) / (KV * q * a * a) + 2 * 0.25) / 0.5, r: rs, a, q };
        });
        v.legend([['accent', 'exact, $r=3a$'], ['teal', 'exact, mid'], ['purple', 'exact, largest'], ['green', '$-2P_2(\\cos\\theta)$', { dash: true }]]);
        v.readout(() => `$Q=${v.fix(info.Q, 3)}$, $|\\mathbf p|=${v.fix(info.p, 3)}$ (both zero). $\\Theta_{xx}=${v.fix(info.T, 2)}=-4qa^2$, $\\Theta_{yy}=\\Theta_{zz}=${v.fix(info.T2, 2)}=2qa^2$ nC·cm². At $r=${v.fix(info.r[2] / info.a, 1)}\\,a$ and $\\theta=45^\\circ$ the exact potential differs from the quadrupole formula by ${v.fix(100 * info.rel, 2)}%.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Polar molecules: the water dipole',
      statement: String.raw`A molecule whose positive and negative charge are not centred at the same point has a permanent dipole moment $\mathbf p=\sum q_i\mathbf r_i$ (it is origin-independent because the molecule is neutral). Water, bent with an H–O–H angle of about $104.5^\circ$, has a gas-phase dipole moment of $1.855\ \mathrm D\ (\approx6.18\times10^{-30}\ \mathrm{C\,m})$ pointing along the bisector from the oxygen toward the hydrogens. Carbon dioxide has polar C=O bonds but is linear, so the bond dipoles cancel and $\mathbf p=0$.`,
      idea: String.raw`Model each O–H bond as a dipole of strength $\delta\,e\,L$ pointing from the oxygen to the hydrogen (partial charge $+\delta e$ on each H, $-2\delta e$ on the O). The two bond dipoles are added as vectors (em-4.2): their components perpendicular to the bisector cancel and the components along it add, giving $p=2\delta eL\cos(\theta/2)$, which depends only on the bend angle. At $180^\circ$ the cosine is zero, which is why a linear symmetric molecule such as CO$_2$ is non-polar. The dipole is what makes water a good solvent and a strong absorber of microwaves (em-4.7 is the energy $-\mathbf p\cdot\mathbf E$ of such a molecule in a field).`,
      caption: String.raw`A three-point-charge model of the molecule (oxygen blue-ish, hydrogens red-ish; lengths in ångström). Slide the **bend angle**: the green dipole arrow shrinks as the angle opens toward $180^\circ$ and vanishes there. Switch the molecule to CO$_2$, which starts straight (no dipole) and becomes polar as you bend it. **Fit $\delta$** sets the partial charge of the model so that the water-model dipole at $104.5^\circ$ equals the measured $1.8546$ D. The right plot is $|\mathbf p|$ against the angle, and the map is the electrostatic potential of the model charges.`,
      scope: String.raw`This is a point-charge model with the charges on the nuclei: the partial charge $\delta$ is a fitted parameter, not a quantum-mechanical atomic charge, and the real dipole also comes from the electron density of the lone pairs. The CO$_2$ charges ($-\delta$ on each O and $+2\delta$ on C, same $\delta$ slider) are purely illustrative. Gas-phase values; liquid water has a higher effective dipole.`,
      credit: 'Debye, 1912 (molecular dipole moments)',
      verify: true,
      deps: ['em-4.2'],
      refs: ['Purcell ch. 10'],
      tags: ['dipole', 'molecules'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Properties_of_water' },
      viz(v) {
        const KE = 14.3996, D = 0.208194; // V·Å/e; 1 debye in e·Å
        const sL = v.stage({ x: [-3.2, 3.2], y: [-2.1, 2.6], equal: true, height: 340, axes: false, weight: 1.1, minWidth: 270, title: 'molecule, dipole and potential' });
        const sP = v.stage({ x: [60, 180], y: [0, 3.5], height: 340, axes: 'box', gutter: true, weight: 0.9, minWidth: 250, xlabel: 'bend angle (degrees)', ylabel: '$|\\mathbf p|$ (debye)', xticks: [60, 90, 104.5, 120, 150, 180], title: 'dipole moment against bend angle' });
        const mol = v.select('molecule', [{ value: 'w', label: 'H₂O' }, { value: 'c', label: 'CO₂' }], 'w', { onChange: () => ang.set(mol.value === 'w' ? 104.5 : 180) });
        const ang = v.slider('bend angle', 60, 180, 104.5, { step: 0.5, fmt: (x) => `${x}°` });
        const del = v.slider('partial charge $\\delta$', 0, 0.8, 0.33, { step: 0.01, fmt: (x) => `${x.toFixed(2)} e` });
        v.button('fit δ to 1.8546 D (water)', () => del.set(Math.round((1.8546 * D) / (2 * 0.958 * Math.cos((104.5 * Math.PI) / 360)) * 1000) / 1000));
        let info = {};
        v.render(() => {
          const w = mol.value === 'w', L = w ? 0.958 : 1.16, th = (ang.value * Math.PI) / 360, d = del.value;
          const at = [{ x: 0, y: 0, q: w ? -2 * d : 2 * d, n: w ? 'O' : 'C', r: w ? 15 : 12 }, { x: -L * Math.sin(th), y: L * Math.cos(th), q: w ? d : -d, n: w ? 'H' : 'O', r: w ? 9 : 15 }, { x: L * Math.sin(th), y: L * Math.cos(th), q: w ? d : -d, n: w ? 'H' : 'O', r: w ? 9 : 15 }];
          const V = (x, y) => { let t = 0; for (const a of at) t += a.q / Math.hypot(x - a.x, y - a.y); return KE * t; };
          const p = [0, 0]; for (const a of at) { p[0] += a.q * a.x; p[1] += a.q * a.y; }
          const pm = Math.hypot(...p) / D, key = 'm' + mol.value + ang.value + d;
          heatPot(sL, (x, y) => V(x, y), 12, key, { res: 3, alpha: 0.75 });
          sL.contour(V, levels(6, 6).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          sL.line(at[0].x, at[0].y, at[1].x, at[1].y, { color: 'ink', width: 4 }); sL.line(at[0].x, at[0].y, at[2].x, at[2].y, { color: 'ink', width: 4 });
          for (const a of at) { sL.dot(a.x, a.y, { r: a.r, color: sgnCol(a.q) }); sL.text(a.n, a.x, a.y, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false }); }
          if (pm > 0.03) { const len = Math.min(2, 0.6 * pm), ux = p[0] / (pm * D), uy = p[1] / (pm * D); sL.arrow(0, 0 - 0.0, ux * len, uy * len, { color: 'green', width: 3.6, head: 12 }); sL.tex('\\mathbf p', ux * len + 0.3, uy * len + 0.1, { color: 'green', size: 15 }); }
          sL.text(`${ang.value}°`, 0, -0.5, { align: 'center', size: 11, color: 'muted' });
          sP.fn((a) => (2 * d * L * Math.cos((a * Math.PI) / 360)) / D, { domain: [60, 180], n: 120, color: 'accent', width: 2.4 });
          sP.hline(1.8546, { color: 'orange', dash: true, width: 1.6 }); sP.vline(104.5, { color: 'orange', dash: true, alpha: 0.6 });
          sP.text('measured H₂O: 1.8546 D at 104.5°', 112, 2.1, { size: 11, color: 'orange' });
          sP.dot(ang.value, pm, { r: 6, color: 'green' });
          info = { pm, w, p, ang: ang.value, L };
        });
        v.readout(() => `${info.w ? 'H₂O' : 'CO₂'} model: $|\\mathbf p|=2\\delta eL\\cos(\\theta/2)=${v.fix(info.pm, 3)}$ D${info.pm < 0.005 ? ' — the bond dipoles cancel exactly: a non-polar molecule' : ''}. (Bond length ${v.fix(info.L, 3)} Å; 1 D $=0.2082\\,e$Å $=3.336\\times10^{-30}$ C·m.)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Exterior fields do not determine the inside',
      statement: String.raw`Two charge distributions confined to the ball $r\le a$ produce the same potential (and hence the same field) at every point $r>a$ if and only if all their multipole moments $q_{\ell m}$ agree. So the field outside a region says nothing about how charge is arranged within it beyond these moments: for example a point charge $Q$, a uniform ball of charge $Q$ and any family of concentric uniformly charged shells with total $Q$ look identical from outside (Newton's shell theorem). Conversely, distributions whose moments agree only up to order $L$ have exterior potentials that differ by terms of order $r^{-(L+2)}$.`,
      idea: String.raw`By the spherical-harmonic expansion (em-4.6) the exterior potential is completely given by the $q_{\ell m}$; equal moments therefore give equal potentials, and since the expansion's terms for different $(\ell,m)$ are independent functions of angle, unequal moments give different potentials. A spherically symmetric distribution has $q_{\ell m}=0$ for $\ell\ge1$ (its angular average of $Y_{\ell m}$ vanishes) and $q_{00}$ is the total charge, so only $Q$ survives. This is a statement of non-uniqueness for the *inverse* problem: Gauss's law (em-1.17 for the field inside a shell) fixes the field from the charge, not the charge from the outside field.`,
      caption: String.raw`Choose **shells** or **dipole pairs**. In *shells*, a uniform ball of charge $Q=4$ nC (A) is compared with four thin concentric shells (B) whose charges you set with the sliders (their sum is rescaled to $Q$). The map shows $\log_{10}|V_A-V_B|$ relative to $kQ/a$: it is exactly zero (dark) everywhere outside the circle and bright inside. In *dipole pairs*, A and B are two $\pm$ pairs with the same $qd$ but different spacings, so the two potentials differ only at the next (octupole) order: the difference fades like $r^{-4}$ instead of $r^{-2}$. Drag the gold probe; the right plot gives both potentials and their difference along its ray.`,
      scope: String.raw`Shells mode: spherical symmetry, so the plane drawn is a slice and exterior equality is exact (to floating-point rounding, below $10^{-12}$ relative). Pairs mode: only the leading dipole moments are matched, so the exterior equality is approximate, with relative difference of order $(d/r)^2$. Uniqueness of the *interior* fails but uniqueness of the potential given the charge (em-3.5, Poisson's equation) still holds.`,
      deps: ['em-4.6', 'em-1.17'],
      refs: ['Griffiths §3.4'],
      tags: ['uniqueness', 'inverse problem'],
      viz(v) {
        const R = 1.5, Q = 4;
        const s = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 340, axes: false, weight: 1.1, title: '$\\log_{10}|V_A-V_B|$ relative to $kQ/a$' });
        const sp = v.stage({ x: [0.1, 20], y: [1e-9, 1e5], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'distance $r$ along the probe’s ray (cm)', ylabel: '$|V|$ (volts)', title: 'potentials along the ray' });
        const mode = v.select('compare', [{ value: 's', label: 'ball vs shells' }, { value: 'd', label: 'two dipole pairs' }], 's');
        const w = [v.slider('shell 1 (0.25 R)', 0, 1, 0.4, { step: 0.05 }), v.slider('shell 2 (0.5 R)', 0, 1, 0, { step: 0.05 }), v.slider('shell 3 (0.75 R)', 0, 1, 0.2, { step: 0.05 }), v.slider('shell 4 (R)', 0, 1, 0.4, { step: 0.05 })];
        const dA = v.slider('spacing of pair A', 0.2, 2.4, 1.6, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` }), dB = v.slider('spacing of pair B', 0.1, 2.4, 0.5, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const pr = s.handle(2.6, 1.3, { color: 'gold', r: 8, label: 'probe', labelPos: 'n', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.15 ? [0.15, 0] : [x, y]; } });
        let info = {};
        v.render(() => {
          const sh = mode.value === 's';
          w.forEach((c) => { c.el.hidden = !sh; }); dA.el.hidden = sh; dB.el.hidden = sh;
          let VA, VB, a;
          if (sh) {
            const ws = w.map((c) => c.value), tot = ws.reduce((t, x) => t + x, 0) || 1, qk = ws.map((x) => (Q * x) / tot), rk = [0.25, 0.5, 0.75, 1].map((f) => f * R);
            VA = (x, y) => { const r = Math.hypot(x, y); return r >= R ? (KV * Q) / r : (KV * Q * (3 * R * R - r * r)) / (2 * R ** 3); };
            VB = (x, y) => { const r = Math.hypot(x, y); let t = 0; for (let k = 0; k < 4; k++) t += qk[k] / Math.max(r, rk[k]); return KV * t; };
            a = R;
            // bar-like display of the shells
            rk.forEach((r, k) => s.circle(0, 0, r, { color: 'orange', width: 1 + (qk[k] / Q) * 6, alpha: 0.9, stroke: true }));
          } else {
            const p = 3, A = dA.value, B = dB.value, qa = p / A, qb = p / B;
            const prs = (d, q) => [{ x: -d / 2, y: 0, q: -q }, { x: d / 2, y: 0, q }];
            const CA = prs(A, qa), CB = prs(B, qb);
            VA = (x, y) => pot(CA, x, y); VB = (x, y) => pot(CB, x, y); a = Math.max(A, B) / 2;
            const dr = (cl) => cl.forEach((c) => s.dot(c.x, c.y, { r: 4 + Math.abs(c.q) * 0.8, color: sgnCol(c.q), hollow: false }));
            dr(CA); dr(CB);
          }
          const scale = sh ? (KV * Q) / R : (KV * 3) / 2;
          s.heat((x, y) => Math.max(-6, Math.min(0, Math.log10(Math.abs(VA(x, y) - VB(x, y)) / scale + 1e-12))), { range: [-6, 0], cmap: 'magma', res: 3, key: 'd' + (sh ? w.map((c) => c.value).join() : dA.value + ',' + dB.value) + mode.value, alpha: 0.95 });
          s.colorbar([-6, 0], 'magma', { pos: 'bottom', label: 'log₁₀ diff.', ticks: [-6, -4, -2, 0] });
          s.circle(0, 0, a, { color: 'orange', width: 2, dash: true });
          const ang = Math.atan2(pr.y, pr.x), cs = Math.cos(ang), sn = Math.sin(ang);
          s.line(0, 0, 4.2 * cs, 4.2 * sn, { color: 'gold', dash: true, alpha: 0.5 });
          const fa = (r) => Math.max(1e-10, Math.abs(VA(r * cs, r * sn))), fb = (r) => Math.max(1e-10, Math.abs(VB(r * cs, r * sn))), fd = (r) => Math.max(1e-10, Math.abs(VA(r * cs, r * sn) - VB(r * cs, r * sn)));
          sp.fn(fa, { domain: [0.1, 20], n: 200, color: 'accent', width: 2.6 }); sp.fn(fb, { domain: [0.1, 20], n: 200, color: 'orange', width: 2, dash: true }); sp.fn(fd, { domain: [0.1, 20], n: 200, color: 'green', width: 2.2 });
          sp.vline(a, { color: 'orange', alpha: 0.5, dash: true });
          const r = Math.hypot(pr.x, pr.y); sp.dot(r, fd(r), { r: 5, color: 'gold' });
          info = { sh, r, a, VA: VA(pr.x, pr.y), VB: VB(pr.x, pr.y), rel: Math.abs(VA(pr.x, pr.y) - VB(pr.x, pr.y)) / Math.abs(VA(pr.x, pr.y)) };
        });
        v.legend([['accent', '$|V_A|$'], ['orange', '$|V_B|$', { dash: true }], ['green', '$|V_A-V_B|$ (below the frame: zero)']]);
        v.readout(() => `Probe at $r=${v.fix(info.r, 2)}$ cm (${info.r > info.a ? 'outside' : 'inside'} the radius $${v.fix(info.a, 2)}$ cm): $V_A=${v.fix(info.VA, 2)}$ V, $V_B=${v.fix(info.VB, 2)}$ V, relative difference ${v.sci(info.rel + 1e-16, 2).replace(/^/, '$')}$.` + (info.sh ? (info.r > info.a ? ' Outside the ball the two are the same to rounding error — the shells hide their arrangement.' : ' Inside, the potentials do differ: the interior is not determined by the exterior.') : ' Same dipole moment, different pairs: they agree to leading order and differ only at the octupole level.'));
      },
    },
  ],
};
