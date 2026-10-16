// Quantum Mechanics — Chapter 7: Angular momentum and spin (items 7.1–7.6; 7.7–7.12 in ch07-b.js, 7.13–7.17 in ch07-c.js)
// ħ = 1 throughout.
import {
  TAU, phaseLUT, fz, spinOps, ylm, realY, ySum, legendreP, paintSphere, worldToView, sphereIP, rotate3, propagator, spinAlong, mvec, comm, mscale, msub, fnorm,
} from './ch07.shared.js';

const rotX = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const rotY = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const mm3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const mv3 = (A, x) => A.map((r) => r[0] * x[0] + r[1] * x[1] + r[2] * x[2]);
const tr3 = (A) => A[0][0] + A[1][1] + A[2][2];
const sphereStage = (v, title, h = 300) => v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: h, title });

export default {
  collection: 'qm',
  chapter: 7,
  title: 'Angular momentum and spin',
  summary: String.raw`The commutation relations of angular momentum alone fix its spectrum: $j$ can be integer or half-integer and $m$ runs from $-j$ to $j$. Orbital angular momentum takes integer values with spherical harmonics as eigenfunctions, while spin $\tfrac12$ — described by Pauli matrices and pictured on the Bloch sphere — changes sign under a full turn. Spins precess in magnetic fields with $g\approx2$, and angular momenta add by Clebsch–Gordan rules into singlets, triplets and beyond, with the Wigner–Eckart theorem organizing matrix elements.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'Orbital angular momentum operators',
      statement: String.raw`For a particle in three dimensions the **orbital angular momentum** is the vector operator
$$\mathbf L=\mathbf r\times\mathbf p,\qquad L_x=yp_z-zp_y,\quad L_y=zp_x-xp_z,\quad L_z=xp_y-yp_x,$$
with $\mathbf p=-i\hbar\nabla$; the products are unambiguous because the factors in each term commute. In spherical coordinates $L_z=-i\hbar\,\partial/\partial\phi$ acts on the azimuth only, so $e^{im\phi}$ is an eigenfunction with eigenvalue $m\hbar$. The three components are Hermitian, and so is $L^2=L_x^2+L_y^2+L_z^2$.`,
      idea: String.raw`Classically $\mathbf L=\mathbf r\times\mathbf p$ (mech-2.8); quantum mechanically one replaces $\mathbf r,\mathbf p$ by the operators of qm-5.9. The chain rule turns $x\partial_y-y\partial_x$ into $\partial_\phi$, which is why a function of the azimuth alone is diagonalized by the Fourier modes $e^{im\phi}$. A superposition of two modes is not an eigenfunction: it has an expectation value (the weighted mean of the two $m$) and a spread.`,
      caption: String.raw`**Choose two integers $m_1,m_2$ and the weight $w$ of the second.** The state is $\psi=(1-w)^{1/2}e^{im_1\phi}+w^{1/2}e^{im_2\phi}$ on the unit circle. The program applies $L_z=x p_y-y p_x$ in *Cartesian* form by finite differences, not by the formula $-i\partial_\phi$: when $w=0$ the green curve $\operatorname{Re}L_z\psi$ lies on the dotted curve $m_1\operatorname{Re}\psi$ (eigenfunction), and for $w>0$ it no longer does — the residual and the spread $\Delta L_z$ appear in the readout.`,
      deps: ['qm-5.9', 'mech-2.8'],
      refs: ['Griffiths §4.3'],
      tags: ['angular momentum', 'operators'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Angular_momentum_operator' },
      viz(v) {
        const A = v.stage({ x: [0, TAU], y: [-3.4, 3.4], axes: 'box', gutter: true, xlabel: '$\\phi$', ylabel: '', height: 270, xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], title: '$\\psi(\\phi)$ and $L_z\\psi$ on the unit circle' });
        const B = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 270, title: 'the state on the ring (colour = phase)' });
        const m1 = v.slider('$m_1$', -3, 3, 2, { int: true }), m2 = v.slider('$m_2$', -3, 3, -1, { int: true }), w = v.slider('weight $w$ of $m_2$', 0, 1, 0, { step: 0.01 });
        const col = phaseLUT(v);
        let st = null;
        v.render(() => {
          const a = Math.sqrt(1 - w.value), b = Math.sqrt(w.value), M1 = m1.value, M2 = m2.value;
          const psi = (x, y) => { const f = Math.atan2(y, x); return [a * Math.cos(M1 * f) + b * Math.cos(M2 * f), a * Math.sin(M1 * f) + b * Math.sin(M2 * f)]; };
          const Lz = (x, y) => { const h = 1e-5, dx = (p, q) => [(p[0] - q[0]) / (2 * h), (p[1] - q[1]) / (2 * h)]; const px = dx(psi(x + h, y), psi(x - h, y)), py = dx(psi(x, y + h), psi(x, y - h)); const g = [x * py[0] - y * px[0], x * py[1] - y * px[1]]; return [g[1], -g[0]]; }; // −i(x∂y − y∂x)
          const n = 240, f = [], re = [], im = [], lr = [], li = [], ex = [];
          let num = 0, den = 0, res = 0, num2 = 0;
          for (let k = 0; k <= n; k++) {
            const ph = (TAU * k) / n, x = Math.cos(ph), y = Math.sin(ph), p = psi(x, y), l = Lz(x, y);
            f.push(ph); re.push([ph, p[0]]); im.push([ph, p[1]]); lr.push([ph, l[0]]); ex.push([ph, M1 * p[0]]);
            if (k < n) { num += p[0] * l[0] + p[1] * l[1]; num2 += l[0] * l[0] + l[1] * l[1]; den += p[0] * p[0] + p[1] * p[1]; res += (l[0] - M1 * p[0]) ** 2 + (l[1] - M1 * p[1]) ** 2; }
          }
          A.path(ex, { color: 'muted', width: 1.4, dash: [2, 4] });
          A.path(re, { color: 'accent', width: 2 }); A.path(im, { color: 'orange', width: 1.4, alpha: 0.8 }); A.path(lr, { color: 'green', width: 2.2, dash: [7, 4] });
          // ring: phase colour, radial thickness ∝ nothing (|ψ| varies)
          B.circle(0, 0, 1, { color: 'faint', width: 1 });
          const K = 160;
          for (let k = 0; k < K; k++) {
            const f0 = (TAU * k) / K, f1 = (TAU * (k + 1.2)) / K, p = psi(Math.cos(f0), Math.sin(f0)), r = Math.hypot(p[0], p[1]);
            const c = col(Math.atan2(p[1], p[0])), ro = 1 + 0.32 * r;
            B.poly([[Math.cos(f0), Math.sin(f0)], [ro * Math.cos(f0), ro * Math.sin(f0)], [ro * Math.cos(f1), ro * Math.sin(f1)], [Math.cos(f1), Math.sin(f1)]], { fill: c, fillAlpha: 0.9, stroke: false });
          }
          B.text('thickness ∝ |ψ|', 0, 0, { align: 'center', baseline: 'middle', color: 'muted', size: 12 });
          const mean = num / den, var_ = num2 / den - mean * mean;
          st = { mean, sd: Math.sqrt(Math.max(0, var_)), res: Math.sqrt(res / den) };
        });
        v.legend([['accent', '$\\operatorname{Re}\\psi$'], ['orange', '$\\operatorname{Im}\\psi$'], ['green', '$\\operatorname{Re}(L_z\\psi)$ from $-i(x\\partial_y-y\\partial_x)$', { dash: true }], ['muted', '$m_1\\operatorname{Re}\\psi$', { dash: true }]]);
        v.readout(() => `$\\langle L_z\\rangle/\\hbar = ${fz(v, st.mean, 4)}$ (expected $(1-w)m_1+w\\,m_2 = ${fz(v, (1 - w.value) * m1.value + w.value * m2.value, 4)}$), $\\;\\Delta L_z/\\hbar = ${fz(v, st.sd, 4)}$\n` +
          `$\\|L_z\\psi-m_1\\psi\\|/\\|\\psi\\| = ${fz(v, st.res, 5)}$ ${w.value === 0 ? '— an eigenfunction, residual zero up to finite-difference error.' : '— not an eigenfunction once $w>0$.'}`);
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Theorem',
      name: 'Angular momentum commutation relations',
      statement: String.raw`The components of $\mathbf L=\mathbf r\times\mathbf p$ satisfy
$$[L_x,L_y]=i\hbar L_z,\quad [L_y,L_z]=i\hbar L_x,\quad [L_z,L_x]=i\hbar L_y,$$
that is $[L_i,L_j]=i\hbar\,\varepsilon_{ijk}L_k$. Consequently no two components can be sharply defined simultaneously (unless both vanish), but $L^2=L_x^2+L_y^2+L_z^2$ commutes with every component: $[L^2,L_i]=0$. The same relations are taken as the definition of *any* angular momentum $\mathbf J$ (including spin), whether or not it is of the form $\mathbf r\times\mathbf p$.`,
      idea: String.raw`Expanding $[L_x,L_y]=[yp_z-zp_y,\;zp_x-xp_z]$ with the canonical relation $[x_i,p_j]=i\hbar\delta_{ij}$ (qm-5.9), only the two cross terms where a position meets its own momentum survive, and they combine to $i\hbar(xp_y-yp_x)$. Geometrically the same identity says rotations about different axes do not commute: the group commutator of two small rotations is a rotation about the third axis by the product of the angles, and $L_i/\hbar$ is the generator of rotations about axis $i$.`,
      caption: String.raw`**Set two small angles $a$ (about $x$) and $b$ (about $y$).** The frame $(\mathbf e_1,\mathbf e_2,\mathbf e_3)$ is rotated *x-then-y* (orange) and *y-then-x* (blue) from the faint original. The two end frames differ by a rotation about $z$: its angle, extracted from the actual matrices, approaches the product $ab$ as the angles shrink — the geometric image of $[L_x,L_y]=i\hbar L_z$. Drag the picture to rotate the view. The readout also checks the operator identity for the $3\times3$ matrices of $l=1$.`,
      deps: ['qm-7.1'],
      refs: ['Griffiths §4.3', 'Sakurai ch. 3'],
      credit: 'Born, Heisenberg & Jordan, 1926',
      verify: true,
      tags: ['angular momentum', 'commutator', 'rotations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Angular_momentum_operator#Commutation_relations' },
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 340, full: true });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.4, axis: 1.5, lim: 1.6 });
        const a = v.slider('rotation $a$ about $x$ (rad)', 0.05, 1.6, 0.8, { step: 0.01 }), b = v.slider('rotation $b$ about $y$ (rad)', 0.05, 1.6, 0.8, { step: 0.01 });
        const L1 = spinOps(1);
        let st = null;
        v.render(() => {
          const Ra = rotX(a.value), Rb = rotY(b.value), RA = mm3(Rb, Ra), RB = mm3(Ra, Rb); // x first then y; y first then x
          const Rc = mm3(RA, [[0, 1, 2].map((j) => RB[j][0]), [0, 1, 2].map((j) => RB[j][1]), [0, 1, 2].map((j) => RB[j][2])]); // R_A R_B^T = R_A R_B^{-1}
          const ang = Math.acos(Math.max(-1, Math.min(1, (tr3(Rc) - 1) / 2))), ax = [Rc[2][1] - Rc[1][2], Rc[0][2] - Rc[2][0], Rc[1][0] - Rc[0][1]], an = Math.hypot(...ax) || 1;
          sc.begin();
          for (const [e, c] of [[[1, 0, 0], 'faint'], [[0, 1, 0], 'faint'], [[0, 0, 1], 'faint']]) sc.arrow([0, 0, 0], e, { color: c, width: 1.6 });
          const cols = ['red', 'green', 'accent'];
          [[RA, 'orange'], [RB, 'accent']].forEach(([R, c], k) => {
            for (let i = 0; i < 3; i++) { const t = mv3(R, [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]); sc.arrow([0, 0, 0], t, { color: c, width: i === 2 ? 3 : 1.6, alpha: i === 2 ? 1 : 0.75 }); if (i === 2) sc.dot(t, { color: c, r: 4 }); }
          });
          const tA = mv3(RA, [0, 0, 1]), tB = mv3(RB, [0, 0, 1]);
          sc.line(tA, tB, { color: 'red', width: 2 });
          sc.flush();
          const mid = sc.P(tA.map((x, i) => (x + tB[i]) / 2)); S.text('gap', mid[0] + 0.08, mid[1] + 0.12, { color: 'red', size: 12 });
          const C = comm(L1.Sx, L1.Sy), D = mscale(L1.Sz, [0, 1]);
          st = { ang, axis: ax.map((x) => x / an), err: fnorm(msub(C, D)), a: a.value, b: b.value };
        });
        v.legend([['orange', 'rotate about $x$ by $a$, then about $y$ by $b$'], ['accent', 'about $y$ first, then $x$'], ['red', 'difference of the two $\\mathbf e_3$']]);
        v.readout(() => `net rotation $R_AR_B^{-1}$: angle $${fz(v, st.ang, 4)}$ about the axis $(${st.axis.map((x) => fz(v, x, 3)).join(',')})$, versus the product $ab = ${fz(v, st.a * st.b, 4)}$ (ratio $${fz(v, st.ang / (st.a * st.b), 3)}$, $\\to1$ as $a,b\\to0$).\n` +
          `$l=1$ matrices: $\\|[L_x,L_y]-iL_z\\|_F = ${v.sci(st.err, 2)}$ (zero up to rounding).`);
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Theorem',
      name: 'Angular momentum spectrum from ladder operators',
      statement: String.raw`Let $J_x,J_y,J_z$ be Hermitian operators with $[J_i,J_j]=i\hbar\varepsilon_{ijk}J_k$, acting on an irreducible space. Then the eigenvalues of $J^2$ are $\hbar^2 j(j+1)$ with $j\in\{0,\tfrac12,1,\tfrac32,\dots\}$, and for each $j$ the eigenvalues of $J_z$ are $m\hbar$ with $m=-j,-j+1,\dots,j$ — exactly $2j+1$ values, each occurring once. With $J_\pm=J_x\pm iJ_y$,
$$J_\pm|j,m\rangle=\hbar\sqrt{j(j+1)-m(m\pm1)}\;|j,m\pm1\rangle .$$`,
      idea: String.raw`$J_\pm$ raise and lower $m$ by one because $[J_z,J_\pm]=\pm\hbar J_\pm$ (qm-7.2). Positivity of $\|J_-|j,m\rangle\|^2=\hbar^2\big(j(j+1)-m(m-1)\big)$ forbids walking down forever: the ladder must end at an $m_{\min}$ where this norm vanishes, which forces $m_{\min}=-j$; the same argument going up gives $m_{\max}=+j$. The two ends are joined by integer steps, so $2j$ is a non-negative integer.`,
      caption: String.raw`**Slide $j$ (steps of $\tfrac14$).** Starting at the top rung $m=j$, the program applies $J_-$ and reports the squared length $j(j+1)-m(m-1)$ of each step. For $2j\in\mathbb N$ the ladder reaches $m=-j$ where the norm hits exactly $0$ and stops after $2j+1$ rungs. For any other $j$ the sequence skips over zero and the next squared norm is *negative* — impossible for a length — so no such representation exists. The right panel shows the allowed $(\sqrt{j(j+1)}$, $m)$ vectors on the sphere of radius $\sqrt{j(j+1)}$.`,
      deps: ['qm-7.2'],
      refs: ['Griffiths §4.3'],
      tags: ['angular momentum', 'ladder operators', 'spectrum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ladder_operator#Angular_momentum' },
      viz(v) {
        const A = v.stage({ x: [0, 4], y: [-3.6, 3.6], axes: false, height: 330, title: 'the $J_-$ ladder from $m=j$' });
        const B = v.stage({ x: [-3.9, 3.9], y: [-3.6, 3.6], equal: true, axes: false, height: 330, title: 'the vectors $(\\sqrt{j(j+1)-m^2},\\,m)$' });
        const j = v.slider('$j$', 0, 3, 1.5, { step: 0.25 });
        let st = null;
        v.render(() => {
          const J = j.value, R = Math.sqrt(J * (J + 1));
          const rungs = []; let m = J, bad = false;
          for (let k = 0; k < 12; k++) {
            const nrm = J * (J + 1) - m * (m - 1); // ‖J₋|j,m⟩‖²
            rungs.push({ m, nrm });
            if (Math.abs(nrm) < 1e-9) break;
            if (nrm < 0) { bad = true; break; }
            m -= 1;
          }
          const ok = !bad;
          rungs.forEach((r, k) => {
            const y = r.m, good = ok || r.nrm >= 0;
            A.line(1.2, y, 2.2, y, { color: good ? 'accent' : 'red', width: 3 });
            A.text(`m = ${fz(v, r.m, 2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}`, 1.1, y, { align: 'right', baseline: 'middle', size: 12, color: good ? 'ink' : 'red' });
            A.text(`|J₋|²=${fz(v, r.nrm, 2)}`, 2.35, y, { align: 'left', baseline: 'middle', size: 12, color: Math.abs(r.nrm) < 1e-9 ? 'green' : r.nrm < 0 ? 'red' : 'muted' });
            if (k > 0) A.arrow(1.7, rungs[k - 1].m - 0.06, 1.7, y + 0.06, { color: 'orange', width: 1.6, head: 7 });
          });
          // vectors
          B.circle(0, 0, R, { color: 'faint', width: 1.2 });
          B.line(0, -R * 1.05, 0, R * 1.05, { color: 'faint', width: 1 });
          if (ok) for (let mm = -J; mm <= J + 1e-9; mm += 1) {
            const r = Math.sqrt(Math.max(0, R * R - mm * mm));
            B.line(-r, mm, r, mm, { color: 'faint', width: 0.8, alpha: 0.8 });
            B.arrow(0, 0, r, mm, { color: 'accent', width: 2, head: 8 });
            B.dot(0, mm, { r: 3.5, color: 'gold' });
          }
          B.text(`radius √(j(j+1)) = ${fz(v, R, 3)}`, 0, -R - 0.25, { align: 'center', size: 12, color: 'muted' });
          st = { ok, n: ok ? Math.round(2 * J + 1) : null, last: rungs[rungs.length - 1], J, bad };
        });
        v.readout(() => st.ok ? `$j=${v.fix(st.J, 2)}$: the ladder ends exactly at $m=-j$ ($\\|J_-\\|^2=0$) after ${st.n} rungs $=2j+1$. Allowed.` :
          `$j=${v.fix(st.J, 2)}$: below $m=${v.fix(st.last.m - 0 , 2)}$ the next step would need $\\|J_-|j,m\\rangle\\|^2=${v.fix(st.last.nrm, 3)}<0$ — **impossible**, so $2j$ must be an integer.`);
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Theorem',
      name: 'Orbital angular momentum is integer',
      statement: String.raw`For orbital angular momentum $\mathbf L=\mathbf r\times\mathbf p$ acting on single-valued wave functions $\psi(\mathbf r)$, the quantum numbers $l$ and $m$ are integers: the eigenvalues of $L_z$ are $m\hbar$ with $m\in\mathbb Z$ and those of $L^2$ are $\hbar^2l(l+1)$ with $l\in\{0,1,2,\dots\}$. Half-integer values allowed by the algebra of qm-7.3 do not occur for orbital motion; they require a space of states that is not a space of functions on $\mathbb R^3$ (spin, qm-7.7).`,
      idea: String.raw`An eigenfunction of $L_z=-i\hbar\partial_\phi$ is $f(r,\theta)e^{im\phi}$. The point at azimuth $\phi$ and the point at $\phi+2\pi$ are the same point of space, and $\psi$ has one value there, so $e^{2\pi im}=1$: $m$ is an integer. Since $m$ ranges over $-l,\dots,l$ in steps of one and includes $0$ or reaches both signs, $l$ is an integer as well (qm-7.3).`,
      caption: String.raw`**Slide $m$ continuously.** Left: $\operatorname{Re}$ and $\operatorname{Im}$ of $e^{im\phi}$ on one turn, with the seam at $\phi=2\pi$. Right: the same function as a path in the complex plane, starting at $1$ (green dot) and ending at $e^{2\pi im}$ (red dot). For integer $m$ the end meets the start and the function is single-valued on the ring; for $m=\tfrac12,\tfrac32,\dots$ it returns with a minus sign (or a stray phase) and is not a function on the circle. The readout shows the jump $|\psi(2\pi)-\psi(0)|$.`,
      deps: ['qm-7.3'],
      refs: ['Griffiths §4.3'],
      tags: ['angular momentum', 'single-valuedness'],
      viz(v) {
        const A = v.stage({ x: [0, TAU], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: '$\\phi$', height: 290, xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], title: '$e^{im\\phi}$ over one turn' });
        const B = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: true, height: 290, title: 'the path in $\\mathbb C$' });
        const m = v.slider('$m$', 0, 4, 1.5, { step: 0.05 });
        let jumpV = 0;
        v.render(() => {
          const M = m.value, re = [], im = [], pts = [];
          for (let k = 0; k <= 400; k++) { const f = (TAU * k) / 400; re.push([f, Math.cos(M * f)]); im.push([f, Math.sin(M * f)]); pts.push([Math.cos(M * f), Math.sin(M * f)]); }
          const jump = Math.hypot(Math.cos(M * TAU) - 1, Math.sin(M * TAU)), ok = jump < 1e-6;
          A.path(re, { color: 'accent', width: 2.2 }); A.path(im, { color: 'orange', width: 2 });
          A.vline(TAU, { color: ok ? 'green' : 'red', width: 2, alpha: 0.7 });
          A.dot(0, 1, { color: 'green', r: 5 }); A.dot(TAU, Math.cos(M * TAU), { color: ok ? 'green' : 'red', r: 5 });
          B.circle(0, 0, 1, { color: 'faint', width: 1 });
          B.path(pts, { color: 'accent', width: 2 });
          B.dot(1, 0, { color: 'green', r: 6 }); B.dot(Math.cos(M * TAU), Math.sin(M * TAU), { color: ok ? 'green' : 'red', r: 5, hollow: true });
          B.text(ok ? 'joins up' : 'seam: ψ(2π) ≠ ψ(0)', 0, -1.3, { align: 'center', color: ok ? 'green' : 'red', size: 13 });
          jumpV = jump;
        });
        v.legend([['accent', '$\\operatorname{Re}e^{im\\phi}$'], ['orange', '$\\operatorname{Im}e^{im\\phi}$']]);
        v.readout(() => `$|\\psi(2\\pi)-\\psi(0)| = |e^{2\\pi im}-1| = ${v.fix(jumpV, 4)}$ ${jumpV < 1e-6 ? '— single-valued: $m$ is an integer.' : '— **not single-valued**; this $m$ is excluded for orbital motion.'}`);
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Definition',
      name: 'Spherical harmonics',
      statement: String.raw`The **spherical harmonics** are the joint eigenfunctions of $L^2$ and $L_z$ on the sphere,
$$L^2Y_l^m=\hbar^2l(l+1)Y_l^m,\qquad L_zY_l^m=m\hbar\,Y_l^m,$$
given for $l=0,1,2,\dots$ and $m=-l,\dots,l$ by $Y_l^m(\theta,\phi)=\sqrt{\tfrac{2l+1}{4\pi}\tfrac{(l-m)!}{(l+m)!}}\,P_l^m(\cos\theta)\,e^{im\phi}$ with the Condon–Shortley phase convention. They are orthonormal, $\int Y_{l'}^{m'*}Y_l^m\,d\Omega=\delta_{ll'}\delta_{mm'}$, and complete on $L^2(S^2)$. The function $P_l^m(\cos\theta)$ has $l-|m|$ zeros in $0<\theta<\pi$.`,
      idea: String.raw`Because $L_z=-i\partial_\phi$, the $\phi$-dependence is $e^{im\phi}$ (qm-7.4); the $\theta$-dependence solves the associated Legendre equation, which is the angular part of Laplace's equation (em-4.6, pde-7.2) and has regular solutions on $[0,\pi]$ only for integer $l\ge|m|$. Eigenfunctions of the Hermitian operator $L^2$ with different $l$, or of $L_z$ with different $m$, are orthogonal automatically. Real combinations $\sqrt2\operatorname{Re}Y_l^m$, $\sqrt2\operatorname{Im}Y_l^m$ are the familiar $p_x,d_{xy},\dots$ shapes.`,
      caption: String.raw`**Pick $(l,m)$ and a display mode.** *Complex*: colour is the phase $m\phi$ (so it winds $m$ times around the $z$-axis), brightness is $|Y|$; *real*: the $\cos m\phi$ or $\sin m\phi$ combination, red positive, blue negative, with $l-|m|$ nodal latitudes and $|m|$ nodal meridians. The middle panel is the polar plot of $|Y_l^m|$ in the $xz$-plane. The bar chart on the right is the overlap $|\langle Y_{l'}^{m'}|Y_l^m\rangle|$ with every $(l',m')$ up to $l'=3$, computed by quadrature on the sphere: a single bar of height $1$ at your choice.`,
      deps: ['qm-7.4', 'em-4.6', 'pde-7.2'],
      refs: ['Griffiths §4.3', 'Griffiths §4.1'],
      credit: 'Laplace, 1780s; Legendre',
      verify: true,
      tags: ['spherical harmonics', 'orthonormality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spherical_harmonics' },
      viz(v) {
        const SP = sphereStage(v, 'the function on the sphere');
        const PL = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: true, height: 300, title: '$|Y|$ in the $xz$-plane' });
        const GR = v.stage({ x: [-0.6, 16.6], y: [0, 1.25], axes: 'box', gutter: true, height: 300, xlabel: "index of $(l',m')$", weight: 1.3, title: "overlaps $|\\langle Y_{l'}^{m'}|Y_l^m\\rangle|$" });
        const l = v.slider('$l$', 0, 4, 3, { int: true }), m = v.slider('$m$', -4, 4, 1, { int: true });
        const mode = v.select('display', [{ value: 'c', label: 'complex' }, { value: 'r', label: 'real combination' }], 'c');
        const yaw = 0.6, tilt = 0.35;
        const idxList = []; for (let L = 0; L <= 3; L++) for (let M = -L; M <= L; M++) idxList.push([L, M]);
        let st = null;
        v.render(() => {
          const L = l.value, M = Math.max(-L, Math.min(L, m.value)); m.set(M);
          const real = mode.value === 'r';
          let mx = 0; for (let t = 0; t <= 60; t++) for (let p = 0; p < 40; p++) mx = Math.max(mx, real ? Math.abs(realY(L, M, (t * Math.PI) / 60, (p * TAU) / 40)) : Math.hypot(...ylm(L, M, (t * Math.PI) / 60, (p * TAU) / 40)));
          paintSphere(v, SP, real ? (th, ph) => realY(L, M, th, ph) : (th, ph) => ylm(L, M, th, ph), { yaw, tilt, real, max: mx, key: `${L}|${M}|${real}|${v.rgb('panel')}|${v.rgb('accent')}` });
          // polar plot of |Y| in the xz-plane (φ = 0 and π)
          const pts = [], pts2 = [];
          for (let k = 0; k <= 200; k++) { const th = (TAU * k) / 200 - Math.PI; const ph = th < 0 ? Math.PI : 0, t = Math.abs(th); const val = real ? Math.abs(realY(L, M, t, ph === 0 ? 0 : Math.PI)) : Math.hypot(...ylm(L, M, t, ph)); const r = val / (mx || 1) * 1.15; pts.push([r * Math.sin(th), r * Math.cos(th)]); }
          PL.circle(0, 0, 1.15, { color: 'faint', width: 1, dash: [3, 4] });
          PL.path(pts, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.12, close: true });
          // overlaps
          const f = real ? null : (t, p) => ylm(L, M, t, p);
          const bars = idxList.map(([L2, M2]) => { const g = (t, p) => ylm(L2, M2, t, p), z = sphereIP(real ? (t, p) => [realY(L, M, t, p), 0] : f, g, 40, 72); return Math.hypot(z[0], z[1]); });
          GR.bars(bars, { x0: 0, dx: 1, color: (val, i) => (idxList[i][0] === L && idxList[i][1] === M && !real ? 'green' : 'accent') });
          idxList.forEach(([L2, M2], i) => { if (M2 === 0) GR.text(`l′=${L2}`, i - 0.4, 1.17, { size: 11, align: 'left', color: 'muted' }); });
          // nodal latitudes: sign changes of P_l^|m| on (−1, 1)
          let nodes = 0, prev = legendreP(L, Math.abs(M), -0.99999);
          for (let k = 1; k <= 2000; k++) { const x = -1 + (2 * k) / 2000, q = legendreP(L, Math.abs(M), Math.min(0.99999, x)); if (q * prev < 0) nodes++; if (q !== 0) prev = q; }
          const self = sphereIP((t, p) => ylm(L, M, t, p), (t, p) => ylm(L, M, t, p), 64, 96);
          st = { L, M, nodes, norm: self[0], sumOther: bars.reduce((s, b, i) => s + (idxList[i][0] === L && idxList[i][1] === M ? 0 : b), 0) };
        });
        v.readout(() => `$Y_{${st.L}}^{${st.M}}$: $\\int|Y|^2d\\Omega = ${v.fix(st.norm, 5)}$; sum of overlaps with all *other* $Y_{l'}^{m'}$ ($l'\\le3$) $=${v.sci(st.sumOther, 1)}$; nodal latitudes $=${st.nodes}$ $(=l-|m|)$, nodal meridians $=${Math.abs(st.M)}$ (real mode).`);
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Theorem',
      name: 'Angular momentum generates rotations',
      statement: String.raw`Let $R_{\mathbf n}(\theta)$ be the rotation of space by the angle $\theta$ about the unit vector $\mathbf n$, and let it act on wave functions by $(\mathcal R\psi)(\mathbf r)=\psi(R^{-1}\mathbf r)$ (rotate the function, not the coordinates). Then
$$\mathcal R_{\mathbf n}(\theta)=\exp\!\Big(-\frac{i\theta}{\hbar}\,\mathbf n\cdot\mathbf L\Big).$$
More generally, $\mathbf J/\hbar$ is by definition the generator of rotations on any quantum system: a rotation acts on states as $e^{-i\theta\,\mathbf n\cdot\mathbf J/\hbar}$, and the commutation relations of qm-7.2 are the Lie algebra of the rotation group.`,
      idea: String.raw`For a small angle $\epsilon$ about $z$, $\psi(R^{-1}\mathbf r)=\psi(\phi-\epsilon)=\psi-\epsilon\,\partial_\phi\psi=(1-\tfrac{i\epsilon}{\hbar}L_z)\psi$; a finite rotation is $N$ steps of $\theta/N$, whence the exponential (compare mech-12.12, where a conserved quantity generates its symmetry, and Euler's theorem mech-10.1: every rotation is one about an axis). The same exponential acts on a multiplet of $Y_l^m$ by a $(2l+1)\times(2l+1)$ matrix built from $L_{x,y,z}$.`,
      caption: String.raw`**Choose the multiplet $l$, the rotation axis (polar angle and azimuth sliders) and the angle $\theta$.** The left sphere shows a real function $f=\sum_mc_mY_l^m$ (random but fixed). The right sphere shows $e^{-i\theta\,\mathbf n\cdot\mathbf L}f$, computed *only* by the matrix exponential of the $(2l+1)\times(2l+1)$ angular-momentum matrices acting on the coefficients. The readout compares it, at 300 random points, with the directly rotated function $f(R^{-1}\mathbf r)$: the maximal difference stays at rounding level for every axis and angle.`,
      deps: ['qm-7.2', 'mech-12.12', 'mech-10.1'],
      refs: ['Griffiths §6.5', 'Sakurai ch. 3'],
      tags: ['rotations', 'generators'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rotation_operator_(quantum_mechanics)' },
      viz(v) {
        const SL = sphereStage(v, '$f(\\mathbf r)$'), SR = sphereStage(v, '$e^{-i\\theta\\,\\mathbf n\\cdot\\mathbf L}f$ (matrix exponential)');
        const l = v.select('multiplet $l$', [{ value: 1, label: '$l=1$' }, { value: 2, label: '$l=2$' }, { value: 3, label: '$l=3$' }], 2);
        const pol = v.slider('axis polar angle', 0, Math.PI, 1.0, { step: 0.01 }), azi = v.slider('axis azimuth', -Math.PI, Math.PI, 0.6, { step: 0.01 }), th = v.slider('rotation angle $\\theta$', 0, TAU, 1.2, { step: 0.01 });
        const yaw = 0.5, tilt = 0.45;
        const coefCache = {};
        const coeffs = (L) => coefCache[L] || (coefCache[L] = (() => {
          const r = v.rng(11 + L);
          const out = Array.from({ length: 2 * L + 1 }, () => [0, 0]);
          for (let m = 0; m <= L; m++) { const a = m === 0 ? [r.normal(), 0] : [r.normal(), r.normal()]; out[L - m] = a; if (m > 0) { const s = m % 2 ? -1 : 1; out[L + m] = [s * a[0], -s * a[1]]; } }
          const nn = Math.sqrt(out.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0)); return out.map((z) => [z[0] / nn, z[1] / nn]);
        })());
        let st = null;
        v.render(() => {
          const L = +l.value, c = coeffs(L), S = spinOps(L);
          const n = [Math.sin(pol.value) * Math.cos(azi.value), Math.sin(pol.value) * Math.sin(azi.value), Math.cos(pol.value)];
          const c2 = mvec(propagator(spinAlong(S, n), th.value), c);
          const f0 = (t, p) => ySum(L, c, t, p)[0], f1 = (t, p) => ySum(L, c2, t, p)[0];
          let mx = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j < 40; j++) mx = Math.max(mx, Math.abs(f0((i * Math.PI) / 40, (j * TAU) / 40)));
          const key = `${L}|${v.rgb('panel')}|${v.rgb('accent')}`;
          paintSphere(v, SL, f0, { yaw, tilt, real: true, max: mx, key: `a${key}` });
          paintSphere(v, SR, f1, { yaw, tilt, real: true, max: mx, key: `b${key}|${n}|${th.value}` });
          for (const [S_, tt] of [[SL, 'n'], [SR, 'n']]) { const a = worldToView(n.map((x) => x * 1.25), yaw, tilt), b = worldToView(n.map((x) => -x * 1.25), yaw, tilt); S_.line(b[0], b[1], a[0], a[1], { color: 'gold', width: 2, dash: [5, 4] }); S_.text('n', a[0], a[1], { color: 'gold', math: true, size: 14, dx: 8, dy: -6 }); }
          const r = v.rng(5); let err = 0;
          for (let k = 0; k < 300; k++) {
            const t = Math.acos(2 * r() - 1), p = TAU * r(), pt = [Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)];
            const q = rotate3(pt, n, -th.value), t0 = Math.acos(Math.max(-1, Math.min(1, q[2]))), p0 = Math.atan2(q[1], q[0]);
            err = Math.max(err, Math.abs(f0(t0, p0) - f1(t, p)));
          }
          st = { err, norm: Math.sqrt(c2.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0)), im: Math.max(...Array.from({ length: 40 }, (_, k) => Math.abs(ySum(L, c2, 0.3 + k * 0.07, k * 0.4)[1]))) };
        });
        v.readout(() => `$\\max_{\\mathbf r}\\,|(e^{-i\\theta\\mathbf n\\cdot\\mathbf L}f)(\\mathbf r)-f(R^{-1}\\mathbf r)| = ${v.sci(Math.max(st.err, 1e-17), 2)}$ over 300 random points; $\\|c'\\|=${v.fix(st.norm, 6)}$ (unitary); the rotated function stays real (max $|\\operatorname{Im}| = ${v.sci(Math.max(st.im, 1e-17), 1)}$).`);
      },
    },
  ],
};
