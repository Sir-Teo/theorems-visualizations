// Electromagnetism — Chapter 3, part d: items 3.20–3.22 (reciprocity, Green's function, Thomson's theorem)
import { TAU, KV, EPS0, pot, fld, sgnCol, heatPot, levels, solveLin, drawLines, circ } from './ch03.shared.js';

export default {
  collection: 'em',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Green’s reciprocity theorem',
      statement: String.raw`Let $\rho_1$ produce the potential $V_1$ and $\rho_2$ the potential $V_2$, in the presence of the same fixed conductors (each either grounded or carrying the same fixed charge in both states, and including the charge induced on them). Then
$$\int\rho_1V_2\,d\tau=\int\rho_2V_1\,d\tau.$$
In words: the work done by distribution 1 in the potential of distribution 2 equals the work done by 2 in the potential of 1.`,
      idea: String.raw`Green's second identity (pma-10.51 on the divergence theorem) for the pair $V_1,V_2$ gives $\int(V_1\nabla^2V_2-V_2\nabla^2V_1)d\tau=\oint(V_1\nabla V_2-V_2\nabla V_1)\cdot d\mathbf a$. Using Poisson's equation (em-2.9) the left side is $\frac1{\varepsilon_0}\int(V_2\rho_1-V_1\rho_2)d\tau$ and on the conductors (equipotentials with equal data in both problems) the surface integral vanishes. Equivalent statement: the Green function of a fixed set of conductors is symmetric, $G(\mathbf r,\mathbf r')=G(\mathbf r',\mathbf r)$.`,
      caption: String.raw`A grounded conducting sphere sits in the plane (potential zero on it). Two distributions of point charges (handles 1a, 1b and 2a, 2b; positive red, negative blue) are dragged around; the left panel shows the potential of distribution 1 alone *with the sphere’s induced charge included* (via images), the right panel that of 2. The readout adds up $\sum q_iV_2(\mathbf r_i)$ and $\sum q_kV_1(\mathbf r_k)$ separately: they agree for every placement. Switch to **induced charge by reciprocity** to see the trick: the charge induced on the sphere by $q$ is found from the potential of the *raised* sphere at $q$'s position.`,
      scope: String.raw`Point charges in three dimensions in the presence of one grounded conducting sphere (exact solutions by images, em-3.12); the plane drawn is the plane through the centre and the charges (all in one plane). With an isolated or charged sphere the theorem still holds if the *total* charge on it is the same in both states.`,
      credit: 'G. Green, 1828',
      deps: ['em-2.9', 'pma-10.51'],
      refs: ['Griffiths §3.2'],
      tags: ['reciprocity', 'green'],
      viz(v) {
        const R = 1.2, BOX = [-5, 5, -3.6, 3.6];
        const sL = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1, minWidth: 250, title: 'distribution 1' });
        const sR = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1, minWidth: 250, title: 'distribution 2' });
        const mode = v.select('compare', [{ value: 'two', label: 'two distributions' }, { value: 'ind', label: 'induced charge by reciprocity' }], 'two');
        const con = (x, y) => { const r = Math.hypot(x, y), m = R + 0.25; return r < m ? [(x / r) * m, (y / r) * m] : [x, y]; };
        const hs = [[-3, 1.8], [-2, -1.6], [3.1, 1.4], [2.2, -1.9]].map((p, k) => (k < 2 ? sL : sL).handle(p[0], p[1], { color: k < 2 ? 'red' : 'blue', r: 8, constrain: con, label: k < 2 ? `1${'ab'[k]}` : `2${'ab'[k - 2]}`, labelPos: 'n' }));
        const qs = [v.slider('$q_{1a}$', -5, 5, 3, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{1b}$', -5, 5, -2, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{2a}$', -5, 5, 2, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{2b}$', -5, 5, 4, { step: 0.5, fmt: (x) => `${x} nC` })];
        const withIm = (S) => { const out = S.map((c) => ({ ...c })); for (const c of S) { const a = Math.hypot(c.x, c.y), f = (R * R) / (a * a); out.push({ x: c.x * f, y: c.y * f, q: (-c.q * R) / a }); } return out; };
        let info = {};
        v.render(() => {
          const ind = mode.value === 'ind';
          hs.forEach((h, k) => { h.visible = !(ind && k > 0); if (k < 2) h.color = sgnCol(qs[k].value); else h.color = sgnCol(qs[k].value); });
          const S1 = [0, 1].filter((k) => !(ind && k === 1)).map((k) => ({ x: hs[k].x, y: hs[k].y, q: qs[k].value })), S2 = ind ? [] : [2, 3].map((k) => ({ x: hs[k].x, y: hs[k].y, q: qs[k].value }));
          const I1 = withIm(S1), I2 = withIm(S2), V0 = 1000;
          const V1 = (x, y) => (Math.hypot(x, y) < R ? 0 : pot(I1, x, y)), V2 = ind ? (x, y) => { const r = Math.hypot(x, y); return r < R ? V0 : (V0 * R) / r; } : (x, y) => (Math.hypot(x, y) < R ? 0 : pot(I2, x, y));
          const key = hs.map((h) => h.x.toFixed(2) + h.y.toFixed(2)).join() + qs.map((q) => q.value).join() + ind;
          heatPot(sL, V1, 400, 'l' + key, { res: 3 }); heatPot(sR, V2, ind ? 600 : 400, 'r' + key, { res: 3 });
          sL.contour((x, y) => (Math.hypot(x, y) < R ? NaN : V1(x, y)), levels(200, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          sR.contour((x, y) => (Math.hypot(x, y) < R ? NaN : V2(x, y)), levels(ind ? 300 : 200, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          for (const s of [sL, sR]) s.circle(0, 0, R, { color: 'ink', width: 2.4, fill: 'muted', fillAlpha: 0.3 });
          sL.text('0 V', 0, 0, { align: 'center', size: 12, color: 'muted' }); sR.text(ind ? `${V0} V` : '0 V', 0, 0, { align: 'center', size: 12, color: 'muted' });
          for (const c of S1) { sL.dot(c.x, c.y, { r: 9, color: sgnCol(c.q) }); sR.dot(c.x, c.y, { r: 9, hollow: true, color: 'red' }); }
          for (const c of S2) { sR.dot(c.x, c.y, { r: 9, color: sgnCol(c.q) }); sL.dot(c.x, c.y, { r: 9, hollow: true, color: 'blue' }); }
          if (!ind) {
            const a = S1.map((c) => [c.q, V2(c.x, c.y)]), b = S2.map((c) => [c.q, V1(c.x, c.y)]);
            info = { ind, a, b, A: a.reduce((t, p) => t + p[0] * p[1], 0), B: b.reduce((t, p) => t + p[0] * p[1], 0) };
          } else {
            const c = S1[0], a = Math.hypot(c.x, c.y);
            info = { ind, qi: (-c.q * R) / a, rec: (-c.q * V2(c.x, c.y)) / V0, V2: V2(c.x, c.y), q: c.q, a };
          }
        });
        v.readout(() => info.ind ? `Charge $q=${v.fix(info.q, 2)}$ nC at distance $a=${v.fix(info.a, 2)}$ cm. The raised sphere ($V_0=1000$ V, no charge anywhere else) has potential $V_2(q)=${v.fix(info.V2, 2)}$ V at $q$.\nReciprocity: $Q_{ind}=-q\\,V_2(q)/V_0=${v.fix(info.rec, 4)}$ nC. Image method: $-qR/a=${v.fix(info.qi, 4)}$ nC. Same number — with no need to know how the induced charge is distributed.` : `$\\sum q_{1}V_2=${v.fix(info.A, 3)}$ nC·V (distribution 1 in the potential of 2)\n$\\sum q_{2}V_1=${v.fix(info.B, 3)}$ nC·V (distribution 2 in the potential of 1). Difference: $${v.sci(Math.abs(info.A - info.B) + 1e-14, 1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.21
    {
      num: '3.21',
      kind: 'Method',
      name: 'Green’s function for the Dirichlet problem',
      statement: String.raw`In a region $\Omega$, the **Dirichlet Green function** $G(\mathbf r,\mathbf r')$ solves $\nabla^2G=-\delta(\mathbf r-\mathbf r')$ with $G=0$ on $\partial\Omega$. The solution of Laplace's equation with boundary values $f$ is
$$V(\mathbf r')=-\oint_{\partial\Omega}f(\mathbf r)\,\frac{\partial G}{\partial n}(\mathbf r,\mathbf r')\,da.$$
For the disc of radius $R$ in the plane, $G=\frac1{2\pi}\Bigl[\ln\frac{R\,|\mathbf r-\mathbf r'^*|}{|\mathbf r'|\,|\mathbf r-\mathbf r'|}\Bigr]$ with $\mathbf r'^*=R^2\mathbf r'/|\mathbf r'|^2$, and $-\partial_nG$ is the **Poisson kernel** $\dfrac{R^2-r'^2}{2\pi R\,|\mathbf r-\mathbf r'|^2}$.`,
      idea: String.raw`Green's second identity (em-2.9) with $V$ and $G$ in the region: the volume terms collapse to $V(\mathbf r')$ by the delta function, and the boundary terms are $\oint(G\,\partial_nV-V\,\partial_nG)$; the $G\,\partial_nV$ term vanishes because $G=0$ on the boundary, leaving the stated formula. For the disc, the image charge at the inverse point (em-3.12 in 2D) makes $G=0$ on the rim (the same Apollonius property); differentiating gives the Poisson kernel (rca-11.8), a positive weight that integrates to $1$ over the rim.`,
      caption: String.raw`Paint the boundary: drag the 12 handles on the rim in or out (outwards = positive, inwards = negative) to set the boundary potential $f(\varphi)$. The interior potential is assembled from Poisson-kernel weights and shown as a heat map, with equipotentials. The gold dot is a point $\mathbf r'$ inside: switch to **Green function** to see $G(\cdot,\mathbf r')$ vanish on the rim, and read $V(\mathbf r')$ two ways, as the Poisson integral and as $-\oint f\,\partial_nG$ computed from the actual normal derivative of $G$.`,
      scope: String.raw`Two-dimensional disc (log potential), 180-point trapezoid quadrature around the rim (spectrally accurate for smooth $f$); the interior point may not approach the rim too closely or the kernel becomes sharply peaked. The three-dimensional ball has the analogous formula with $|\mathbf r-\mathbf r'|^{-3}$.`,
      deps: ['em-2.9', 'em-3.5', 'rca-11.8', 'pde-5.13'],
      refs: ['Griffiths §3.2'],
      tags: ['green function', 'poisson kernel'],
      viz(v) {
        const R = 2.4, K = 12, Q = 180, W = 0.6, B = [-3.4, 3.4];
        const s = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, height: 360, axes: false, weight: 1.1, title: 'disc' });
        const sF = v.stage({ x: [0, 360], y: [-1.4, 1.4], height: 360, axes: 'box', gutter: true, weight: 1, minWidth: 250, xlabel: 'boundary angle $\\varphi$ (degrees)', ylabel: '$f$ and kernel', title: 'boundary data and Poisson kernel' });
        const mode = v.select('show', [{ value: 'u', label: 'solution $u$' }, { value: 'G', label: 'Green function $G(\\cdot,\\mathbf r\')$' }], 'u');
        const init = (k) => Math.sin((TAU * k) / K) + 0.5 * Math.cos((3 * TAU * k) / K);
        const hs = Array.from({ length: K }, (_, k) => { const th = (TAU * k) / K, r0 = R + W * 0.9 * init(k) * 0.7; return s.handle(r0 * Math.cos(th), r0 * Math.sin(th), { color: 'accent', r: 7, constrain: (x, y) => { const th2 = th, r = x * Math.cos(th2) + y * Math.sin(th2), c = Math.max(R - W, Math.min(R + W, r)); return [c * Math.cos(th2), c * Math.sin(th2)]; } }); });
        const src = s.handle(0.9, 0.6, { color: 'gold', r: 8, constrain: (x, y) => { const r = Math.hypot(x, y), m = R * 0.82; return r > m ? [(x / r) * m, (y / r) * m] : [x, y]; } });
        const hann = (t) => (Math.abs(t) < 1 ? 0.5 * (1 + Math.cos(Math.PI * t)) : 0);
        let info = {};
        v.render(() => {
          const vals = hs.map((h, k) => { const th = (TAU * k) / K; return (h.x * Math.cos(th) + h.y * Math.sin(th) - R) / W; });
          const f = (phi) => { let t = 0; for (let k = 0; k < K; k++) { let d = ((phi - (TAU * k) / K) % TAU + TAU) % TAU; if (d > Math.PI) d -= TAU; t += vals[k] * hann(d / (TAU / K)); } return t; };
          const fq = Array.from({ length: Q }, (_, j) => f((TAU * j) / Q));
          const u = (x, y) => { const r2 = x * x + y * y; if (r2 >= R * R) return NaN; let t = 0; const th = Math.atan2(y, x), r = Math.sqrt(r2); for (let j = 0; j < Q; j++) t += fq[j] * (R * R - r2) / (R * R - 2 * R * r * Math.cos(th - (TAU * j) / Q) + r2); return t / Q; };
          const sx = src.x, sy = src.y, sr = Math.hypot(sx, sy), sst = [(R * R * sx) / (sr * sr + 1e-12), (R * R * sy) / (sr * sr + 1e-12)];
          // G·2π = ln( R |x − s*| / (|s| |x − s|) )
          const G2 = (x, y) => { if (Math.hypot(x, y) >= R) return NaN; const d1 = Math.hypot(x - sx, y - sy) + 1e-9; return sr < 1e-6 ? Math.log(R / (Math.hypot(x, y) + 1e-9)) : Math.log((R * Math.hypot(x - sst[0], y - sst[1])) / (sr * d1)); };
          const key = vals.map((x) => x.toFixed(2)).join();
          if (mode.value === 'u') {
            s.heat((x, y) => (Math.hypot(x, y) < R ? Math.tanh(u(x, y) / 1.2) : NaN), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: 'u' + key, alpha: 0.9 });
            s.contour(u, levels(0.2, 6).filter((z) => z), { color: 'ink', alpha: 0.3, width: 1, res: 90 });
          } else {
            s.heat((x, y) => (Math.hypot(x, y) < R ? Math.tanh(G2(x, y) / 2) : NaN), { range: [0, 1], cmap: 'theme', color: 'green', res: 3, key: `G${sx.toFixed(2)}${sy.toFixed(2)}`, alpha: 0.9 });
            s.contour(G2, [0.1, 0.25, 0.5, 0.8, 1.2, 1.8, 2.6, 3.6], { color: 'ink', alpha: 0.35, width: 1, res: 110 });
          }
          s.path(circ(0, 0, R, 160), { color: 'faint', width: 1, dash: true });
          for (let j = 0; j < Q; j++) { const t0 = (TAU * j) / Q, t1 = (TAU * (j + 1)) / Q, val = fq[j]; s.path([[R * Math.cos(t0), R * Math.sin(t0)], [R * Math.cos(t1), R * Math.sin(t1)]], { color: val >= 0 ? 'red' : 'blue', width: 3 + 5 * Math.min(1, Math.abs(val)), alpha: 0.85 }); }
          hs.forEach((h, k) => { h.color = vals[k] >= 0 ? 'red' : 'blue'; });
          // kernel and checks
          const ker = (j) => (R * R - sr * sr) / (R * R - 2 * R * sr * Math.cos(Math.atan2(sy, sx) - (TAU * j) / Q) + sr * sr);
          let us = 0, ug = 0; const eps = 1e-3;
          for (let j = 0; j < Q; j++) {
            us += (fq[j] * ker(j)) / Q;
            const xr = (R - eps) * Math.cos((TAU * j) / Q), yr = (R - eps) * Math.sin((TAU * j) / Q);
            ug += (fq[j] * G2(xr, yr) * R) / (eps * Q); // −∂nG·R dφ with G = G2/2π and dφ = 2π/Q
          }
          const ker2 = Array.from({ length: Q }, (_, j) => ker(j));
          sF.path(fq.map((y, j) => [(360 * j) / Q, y]).concat([[360, fq[0]]]), { color: 'accent', width: 2.4 });
          sF.path(ker2.map((y, j) => [(360 * j) / Q, y / 4]).concat([[360, ker2[0] / 4]]), { color: 'green', width: 1.8 });
          sF.hline(0, { color: 'faint' });
          let avg = fq.reduce((a, b) => a + b, 0) / Q;
          info = { us, ug, uc: u(0, 0), avg, sr, ks: ker2.reduce((a, b) => a + b, 0) / Q };
          src.visible = true;
        });
        v.legend([['accent', 'boundary potential $f(\\varphi)$'], ['green', 'Poisson kernel (÷4) for $\\mathbf r\'$']]);
        v.readout(() => `At the gold point (at distance $${v.fix(info.sr, 2)}$ cm from the centre, $R=2.4$ cm): Poisson integral $V(\\mathbf r')=${v.fix(info.us, 4)}$; from $-\\oint f\\,\\partial_nG$ with $\\partial_nG$ taken numerically: $${v.fix(info.ug, 4)}$. The kernel integrates to $${v.fix(info.ks, 4)}$ (=1).\nAt the centre $V(0)=${v.fix(info.uc, 4)}$ equals the average of $f$, $${v.fix(info.avg, 4)}$ (mean-value property).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.22
    {
      num: '3.22',
      kind: 'Theorem',
      name: 'Thomson’s theorem',
      statement: String.raw`Among all ways of distributing a given total charge $Q$ over the surface of an isolated conductor (or a given charge on each of several conductors), the electrostatic field energy $W=\tfrac{\varepsilon_0}{2}\int E^2\,d\tau$ is smallest for the equilibrium distribution, the one for which the conductor is an equipotential.`,
      idea: String.raw`Write any trial distribution as the equilibrium one plus a change $\delta\sigma$ with zero total charge. The energy is a quadratic form in the charges, $W=\tfrac12\int\sigma V\,da$, so $W_{trial}=W_{eq}+\int\delta\sigma\,V_{eq}\,da+W[\delta\sigma]$. Because $V_{eq}$ is constant on the conductor and $\int\delta\sigma=0$, the linear term vanishes, and $W[\delta\sigma]=\tfrac{\varepsilon_0}{2}\int|\mathbf E_{\delta}|^2d\tau>0$ (the field energy of a nonzero charge distribution, em-2.11). So $W_{trial}>W_{eq}$ unless $\delta\sigma=0$, which is also the second uniqueness theorem (em-3.6). Equivalently, charges on a conductor slide until they can lower the energy no more.`,
      caption: String.raw`An infinitely long conducting cylinder of elliptical cross-section holds charge $\lambda$ per unit length, which is modelled by 48 charged strips round the rim (bars outside the rim: the green ghost is the equilibrium density, red the trial one). The four sliders smear the charge in the shapes $\cos(k\cdot\text{angle round the rim})$; the excess energy readout is nonnegative, and so is the spread of the potential over the surface. Press **slide the charge** to let it flow downhill: it relaxes into the equilibrium, crowding at the ends of the ellipse, and the energy drops to its minimum.`,
      scope: String.raw`Two-dimensional (log potential), a strip charge model: the energy is $\tfrac12\sum\lambda_i\lambda_jA_{ij}$ with $A_{ij}=-\ln d_{ij}$ and the midpoint potential self-term of a uniform straight strip, $-\ln(\ell/2)+1$. This symmetric midpoint model approximates the continuous boundary integral; its diagonal is not the double-averaged strip energy. Its quadratic form is positive on the zero-total subspace for the displayed aspect-ratio range (independently checked). A net line charge has divergent absolute field energy at infinity, so only finite energy differences are compared, in kernel units $\lambda^2/(2\pi\varepsilon_0)$; no absolute 2D energy minimum is asserted.`,
      credit: 'Thomson’s minimum-energy theorem; quadratic proof from Feynman II, §8–5',
      deps: ['em-3.6', 'em-2.11'],
      refs: ['Feynman Lectures II, complete §8–5, Eqs.(8.27)–(8.35); fixed-charge quadratic expansion given here'],
      tags: ['energy', 'variational'],
      viz(v) {
        const Mn = 48, a = 3;
        const s = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 340, axes: false, weight: 1.2, title: 'charge on the rim of a conducting ellipse' });
        const sL = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', gutter: true, weight: 0.85, minWidth: 240, xlabel: 'position round the rim (fraction of perimeter)', ylabel: 'density $\\lambda$ (× average)', title: 'charge density' });
        const bs = v.slider('ellipse $b/a$', 0.2, 1, 0.45, { step: 0.01, onChange: () => { setup(); reset(); } });
        const cs = [1, 2, 3, 4].map((k) => v.slider(`smear $\\cos${k}\\theta$`, -1, 1, k === 1 ? 0.7 : k === 2 ? -0.5 : 0, { step: 0.05, onChange: () => reset() }));
        let nodes = [], A, lamEq = [], lam = [], Weq = 0, raf = 0, running = false, steps = 0;
        const setup = () => {
          const b = a * bs.value, T = 4000, P = [[a, 0]]; let L = [0];
          for (let i = 1; i <= T; i++) { const t = (TAU * i) / T, p = [a * Math.cos(t), b * Math.sin(t)]; L.push(L[i - 1] + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1])); P.push(p); }
          const per = L[T]; nodes = []; let j = 0;
          for (let i = 0; i < Mn; i++) { const target = ((i + 0.5) / Mn) * per; while (L[j + 1] < target) j++; const f = (target - L[j]) / (L[j + 1] - L[j]); nodes.push([P[j][0] + f * (P[j + 1][0] - P[j][0]), P[j][1] + f * (P[j + 1][1] - P[j][1])]); }
          const l = per / Mn; A = Array.from({ length: Mn }, (_, i) => Array.from({ length: Mn }, (_, k) => (i === k ? -Math.log(l / 2) + 1 : -Math.log(Math.hypot(nodes[i][0] - nodes[k][0], nodes[i][1] - nodes[k][1]))))); // 
          const Bm = Array.from({ length: Mn + 1 }, (_, i) => Array.from({ length: Mn + 1 }, (_, k) => (i < Mn && k < Mn ? A[i][k] : i === Mn && k === Mn ? 0 : 1)));
          const rhs = new Array(Mn + 1).fill(0); rhs[Mn] = 1; lamEq = solveLin(Bm, rhs).slice(0, Mn);
          Weq = energy(lamEq);
        };
        const Av = (x) => A.map((row) => row.reduce((t, a2, k) => t + a2 * x[k], 0));
        const energy = (x) => 0.5 * x.reduce((t, xi, i) => t + xi * Av(x)[i], 0);
        const energyFast = (x) => { const g = Av(x); return 0.5 * x.reduce((t, xi, i) => t + xi * g[i], 0); };
        const trial = () => lamEq.map((l0, i) => l0 + cs.reduce((t, c, k) => t + (0.8 / Mn) * c.value * Math.cos(((k + 1) * TAU * (i + 0.5)) / Mn), 0));
        const reset = () => { lam = trial(); steps = 0; };
        const eta = () => 0.9 / Math.max(...A.map((r) => r.reduce((t, x) => t + Math.abs(x), 0)));
        const relax = (n) => { const e = eta(); for (let it = 0; it < n; it++) { const g = Av(lam), m = g.reduce((t, x) => t + x, 0) / Mn; for (let i = 0; i < Mn; i++) lam[i] -= e * (g[i] - m); steps++; } };
        setup(); reset();
        if (typeof window !== 'undefined' && window.__vizStill) relax(150);
        const tick = () => { if (!running) return; relax(40); v.invalidate(); raf = requestAnimationFrame(tick); };
        v.button('slide the charge', () => { running = !running; if (running) raf = requestAnimationFrame(tick); });
        v.button('reset', () => { running = false; reset(); });
        v.onCleanup(() => { running = false; cancelAnimationFrame(raf); });
        let info = {};
        v.render(() => {
          const b = a * bs.value;
          s.path(Array.from({ length: 121 }, (_, k) => [a * Math.cos((TAU * k) / 120), b * Math.sin((TAU * k) / 120)]), { color: 'ink', width: 2.2, close: true, fill: 'muted', fillAlpha: 0.2 });
          const mean = 1 / Mn, mx = Math.max(...lam, ...lamEq);
          nodes.forEach((p, i) => {
            const n = [p[0] / (a * a), p[1] / (b * b)], m = Math.hypot(n[0], n[1]), u = [n[0] / m, n[1] / m], L1 = (1.5 * lamEq[i]) / mx, L2 = (1.5 * lam[i]) / mx;
            s.segment([p[0], p[1]], [p[0] + u[0] * L1, p[1] + u[1] * L1], { color: 'green', width: 5, alpha: 0.28 });
            s.segment([p[0] + u[0] * 0.02, p[1] + u[1] * 0.02], [p[0] + u[0] * L2, p[1] + u[1] * L2], { color: 'red', width: 2.2, alpha: 0.9 });
          });
          const Vi = Av(lam), Vm = Vi.reduce((t, x) => t + x, 0) / Mn, sd = Math.sqrt(Vi.reduce((t, x) => t + (x - Vm) ** 2, 0) / Mn), W = energyFast(lam);
          sL.setView([0, 1], [Math.min(0, ...lam, ...lamEq) / mean * 1.1, Math.max(mx / mean, 2) * 1.1]);
          sL.path(lamEq.map((l, i) => [(i + 0.5) / Mn, l / mean]), { color: 'green', width: 2.2, dash: true }); sL.path(lam.map((l, i) => [(i + 0.5) / Mn, l / mean]), { color: 'red', width: 2.2 }); sL.hline(1, { color: 'faint' });
          info = { dW: W - Weq, sd, steps, W, Weq, neg: Math.min(...lam) < 0 };
        });
        v.legend([['green', 'equilibrium density'], ['red', 'trial density']]);
        v.readout(() => `Excess energy $W-W_{eq}=${v.sci(info.dW, 3)}$ in kernel units $\\lambda^2/(2\\pi\\varepsilon_0)$. Surface-potential RMS spread $${v.sci(info.sd, 3)}$ in units $\\lambda/(2\\pi\\varepsilon_0)$. Both vanish at equilibrium up to numerical roundoff.${info.steps ? ` After ${info.steps} sliding steps.` : ''}${info.neg ? ' (The trial density is negative somewhere: allowed when only total charge is fixed.)' : ''}`);
      },
    },
  ],
};
