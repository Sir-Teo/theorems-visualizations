// Quantum Mechanics — Chapter 7, part b: items 7.7–7.12 (spin ½, Pauli matrices, 2π sign change, neutron interferometry, Bloch sphere, tilted measurement, precession)
// ħ = 1 unless an item says otherwise.
import {
  TAU, fz, SX, SY, SZ, eye, spinOps, spinAlong, propagator, mvec, mmul, madd, msub, mscale, fnorm, expect, ip, blochOf, stateOf, cabs2, cmul, cis, cscale, cconj,
  texC, texMat, blochFrame, sphereOutline, rotate3, dial, sampleIdx, cplx, adj, comm, heig,
} from './ch07.shared.js';

const S12 = spinOps(0.5);
const PAULI = { x: SX, y: SY, z: SZ };
const bloch3 = (v, S, h = 300, yaw = -0.55, pitch = 0.3, title) => { const st = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: h, title }); return { st, sc: v.scene3(st, { axes: false, yaw, pitch }) }; };
const snapSphere = (p) => { const r = Math.hypot(...p) || 1; return p.map((c) => c / r); };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export default {
  collection: 'qm',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Definition',
      name: 'Spin ½ and the Pauli matrices',
      statement: String.raw`A **spin-½** system has a two-dimensional state space $\mathbb C^2$ (spinors $\chi=(\alpha,\beta)^{\mathsf T}$) and spin operators $\mathbf S=\tfrac\hbar2\boldsymbol\sigma$ built from the **Pauli matrices**
$$\sigma_x=\begin{pmatrix}0&1\\1&0\end{pmatrix},\quad \sigma_y=\begin{pmatrix}0&-i\\i&0\end{pmatrix},\quad \sigma_z=\begin{pmatrix}1&0\\0&-1\end{pmatrix}.$$
They are Hermitian, $\sigma_i^2=I$, $\sigma_i\sigma_j=\delta_{ij}I+i\varepsilon_{ijk}\sigma_k$, so $[S_i,S_j]=i\hbar\varepsilon_{ijk}S_k$ (the $j=\tfrac12$ case of qm-7.3). A measurement of $S_x$, $S_y$ or $S_z$ — or of $\mathbf S\cdot\mathbf n$ along any unit vector — gives only $\pm\hbar/2$, and the probability of $+\hbar/2$ along $\mathbf n$ is $\langle\chi|\tfrac12(I+\boldsymbol\sigma\cdot\mathbf n)|\chi\rangle$.`,
      idea: String.raw`The ladder construction of qm-7.3 with $j=\tfrac12$ leaves exactly two states $m=\pm\tfrac12$; writing $S_\pm$ in that basis gives the Pauli matrices up to the choice of phases. Since $(\boldsymbol\sigma\cdot\mathbf n)^2=I$, its eigenvalues are $\pm1$ for every direction $\mathbf n$: that is the experimental fact of two spots in a Stern–Gerlach apparatus (qm-1.14) whatever the orientation of the magnet. The projectors $\tfrac12(I\pm\boldsymbol\sigma\cdot\mathbf n)$ give the Born probabilities.`,
      caption: String.raw`**Choose the spinor with the two angles** ($\chi=\cos\frac\theta2|{\uparrow}\rangle+e^{i\phi}\sin\frac\theta2|{\downarrow}\rangle$) **and the axis** along which $S$ is measured. The bars compare the exact probabilities $\langle\chi|\Pi_\pm|\chi\rangle$ (outlined) with the frequencies of 600 simulated measurements (filled); the outcome is always $\pm\hbar/2$, never anything in between. **Resample** draws a new batch. The matrices shown are the ones actually used.`,
      deps: ['qm-7.3', 'qm-1.14'],
      refs: ['Griffiths §4.4'],
      credit: 'Pauli, 1927',
      verify: true,
      tags: ['spin', 'Pauli matrices'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pauli_matrices' },
      viz(v) {
        const { st: SB, sc } = bloch3(v, null, 310, -0.55, 0.3, 'the spinor on the Bloch sphere');
        const SP = v.stage({ x: [-0.8, 1.8], y: [0, 1.15], axes: 'box', gutter: true, height: 310, ylabel: 'probability', xticks: [[0, '−ħ/2'], [1, '+ħ/2']], title: 'outcomes of $\\mathbf S\\cdot\\mathbf n$' });
        const th = v.slider('$\\theta$', 0, Math.PI, 1.1, { step: 0.01 }), ph = v.slider('$\\phi$', 0, TAU, 0.9, { step: 0.01 });
        const ax = v.select('measure along', [{ value: 'x', label: '$S_x$' }, { value: 'y', label: '$S_y$' }, { value: 'z', label: '$S_z$' }], 'x');
        let seed = 1; v.button('Resample', () => { seed++; });
        let st = null;
        v.render(() => {
          const n = [0, 0, 0]; n['xyz'.indexOf(ax.value)] = 1;
          const chi = [[Math.cos(th.value / 2), 0], cscale(cis(ph.value), Math.sin(th.value / 2))], sig = PAULI[ax.value];
          const Pp = expect(mscale(madd(eye(2), sig), 0.5), chi)[0], Pm = 1 - Pp;
          const r = v.rng(seed * 7919 + 3), N = 600; let up = 0; for (let k = 0; k < N; k++) if (r() < Pp) up++;
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          sc.line(n.map((x) => -1.2 * x), n.map((x) => 1.2 * x), { color: 'orange', width: 1.6 });
          const b = blochOf(chi); sc.arrow([0, 0, 0], b, { color: 'accent', width: 3 }); sc.dot(b, { color: 'accent', r: 5 });
          sc.flush();
          for (const [x, p, f, c] of [[0, Pm, (N - up) / N, 'orange'], [1, Pp, up / N, 'accent']]) {
            SP.rect(x - 0.3, 0, x + 0.3, f, { fill: c, fillAlpha: 0.55, stroke: false });
            SP.rect(x - 0.3, 0, x + 0.3, p, { fill: false, color: 'ink', width: 1.6 });
            SP.text(`${v.fix(f, 3)}`, x, Math.max(f, p) + 0.07, { align: 'center', size: 12 });
          }
          const sq = mmul(sig, sig), e = [0, 1, 2].map((i) => [0, 1, 2].map((j) => 0));
          st = { Pp, up: up / N, comm: fnorm(msub(mmul(PAULI.x, PAULI.y), mscale(PAULI.z, [0, 1]))), sq: fnorm(msub(sq, eye(2))), sig };
        });
        v.legend([['accent', 'simulated $+\\hbar/2$'], ['orange', 'simulated $-\\hbar/2$'], ['ink', 'exact probability', { dash: false }]]);
        v.readout(() => `$\\sigma_${ax.value}=${texMat(v, st.sig, 0)}$, $\\;\\sigma_${ax.value}^2=I$ (error $${v.sci(Math.max(st.sq, 1e-17), 1)}$), $\\;\\|\\sigma_x\\sigma_y-i\\sigma_z\\|=${v.sci(Math.max(st.comm, 1e-17), 1)}$\n$P(+\\hbar/2)=${v.fix(st.Pp, 4)}$ exact; $${v.fix(st.up, 3)}$ simulated ($N=600$); $\\langle S_${ax.value}\\rangle=${v.fix((st.Pp - (1 - st.Pp)) / 2, 4)}\\,\\hbar$.`);
      },
    },
    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8',
      kind: 'Theorem',
      name: 'Spinors change sign under a 2π rotation',
      statement: String.raw`A rotation of a spin-½ system by the angle $\alpha$ about the unit vector $\mathbf n$ acts on spinors by
$$U_{\mathbf n}(\alpha)=e^{-i\alpha\,\boldsymbol\sigma\cdot\mathbf n/2}=\cos\tfrac\alpha2\,I-i\sin\tfrac\alpha2\;\boldsymbol\sigma\cdot\mathbf n .$$
Hence $U_{\mathbf n}(2\pi)=-I$: after a full turn the spinor returns multiplied by $-1$, and only $U_{\mathbf n}(4\pi)=+I$ restores it. All expectation values $\langle\boldsymbol\sigma\rangle$ (the Bloch vector) return after $2\pi$, so the sign is invisible in any single state; it shows up only in interference between a rotated and an unrotated part of the system (qm-7.9). The rotation group $SO(3)$ is thus represented on spin ½ only up to sign, by its double cover $SU(2)$.`,
      idea: String.raw`The generator of rotations is $\mathbf S/\hbar=\boldsymbol\sigma/2$ (qm-7.6), whose eigenvalues are $\pm\tfrac12$; the exponential therefore contains $e^{\mp i\alpha/2}$, with period $4\pi$ rather than $2\pi$. Since $(\boldsymbol\sigma\cdot\mathbf n)^2=I$ the exponential series sums to the cosine and sine above. A global sign cannot affect any probability, which is why nothing forbids spinors from being "half-valued"; the topological fact behind it is that a loop of rotations by $2\pi$ cannot be shrunk to a point in $SO(3)$ but a loop of $4\pi$ can (Dirac's belt trick).`,
      caption: String.raw`**Drag the rotation angle $\alpha$ from $0$ to $4\pi$** (it starts at $2\pi$) and pick the axis. Left: the Bloch vector $\langle\boldsymbol\sigma\rangle$ goes round once per $2\pi$. Middle: the overlap $\langle\chi_0|\chi(\alpha)\rangle$ of the rotated spinor with the starting one; its real part is $\cos(\alpha/2)$, reaching $-1$ at $2\pi$ and $+1$ at $4\pi$. Right: a ribbon with one end turned by $\alpha$ (a *depiction*, not a simulation): one full twist at $2\pi$ cannot be undone by moving the ribbon, two twists at $4\pi$ can — the belt trick.`,
      deps: ['qm-7.7', 'qm-7.6'],
      refs: ['Sakurai ch. 3'],
      tags: ['spin', 'rotations', 'SU(2)'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spinor#Overview_and_motivation' },
      viz(v) {
        const { st: SB, sc } = bloch3(v, null, 300, -0.55, 0.3, 'Bloch vector $\\langle\\boldsymbol\\sigma\\rangle$');
        const SO = v.stage({ x: [0, 4 * Math.PI], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 300, xlabel: 'rotation angle $\\alpha$', xticks: [[0, '0'], [2 * Math.PI, '2π'], [4 * Math.PI, '4π']], title: 'overlap $\\langle\\chi_0|\\chi(\\alpha)\\rangle$' });
        const SR = v.stage({ x: [0, 8], y: [-1.5, 1.5], axes: false, height: 300, title: 'ribbon with end turned by $\\alpha$ (depiction)' });
        const al = v.slider('rotation angle $\\alpha$', 0, 4 * Math.PI, 2 * Math.PI, { step: 0.01 });
        const axis = v.select('axis', [{ value: 'z', label: '$z$' }, { value: 'x', label: '$x$' }, { value: 't', label: 'tilted' }], 'z');
        const AX = { z: [0, 0, 1], x: [1, 0, 0], t: snapSphere([0.5, 0.3, 0.8]) };
        const chi0 = [[Math.cos(0.55), 0], cscale(cis(0.4), Math.sin(0.55))];
        let st = null;
        v.render(() => {
          const n = AX[axis.value], H = spinAlong(S12, n).map((r) => r.map((z) => [2 * z[0], 2 * z[1]])); // σ·n
          const U = (a) => propagator(mscale(H, 0.5), a);
          const chi = mvec(U(al.value), chi0), ov = ip(chi0, chi), b = blochOf(chi);
          const re = [], im = [], tr = [];
          for (let k = 0; k <= 80; k++) { const a = (4 * Math.PI * k) / 80, o = ip(chi0, mvec(U(a), chi0)); re.push([a, o[0]]); im.push([a, o[1]]); if (a <= al.value + 1e-9) tr.push(blochOf(mvec(U(a), chi0))); }
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          sc.line(n.map((x) => -1.25 * x), n.map((x) => 1.25 * x), { color: 'orange', width: 1.4, alpha: 0.8 });
          sc.path(tr, { color: 'gold', width: 2 });
          sc.arrow([0, 0, 0], b, { color: 'accent', width: 3 }); sc.dot(b, { color: 'accent', r: 5 });
          sc.flush();
          SO.hline(0, { color: 'faint', width: 1 }); SO.hline(1, { color: 'faint', dash: [3, 4] }); SO.hline(-1, { color: 'faint', dash: [3, 4] });
          SO.vline(2 * Math.PI, { color: 'faint', dash: [3, 4] });
          SO.path(re, { color: 'accent', width: 2.2 }); SO.path(im, { color: 'orange', width: 1.4, alpha: 0.8 });
          SO.dot(al.value, ov[0], { color: 'accent', r: 6 });
          SO.dot(2 * Math.PI, -1, { color: 'red', r: 4, hollow: true }); SO.dot(4 * Math.PI, 1, { color: 'green', r: 4, hollow: true });
          // ribbon: twist angle grows linearly from 0 (left end fixed) to α (right end)
          const K = 90, xs = (k) => 0.4 + (7.2 * k) / K, tw = (k) => (al.value * k) / K;
          for (let k = 0; k < K; k++) {
            const c0 = Math.cos(tw(k)), c1 = Math.cos(tw(k + 1)), s0 = Math.sin(tw(k)), s1 = Math.sin(tw(k + 1)), w = 0.9;
            const front = (c0 + c1) / 2 >= 0 ? 'accent' : 'orange';
            SR.poly([[xs(k), -w * c0], [xs(k), w * c0], [xs(k + 1), w * c1], [xs(k + 1), -w * c1]], { fill: front, fillAlpha: 0.55, stroke: false });
          }
          SR.line(0.4, 0, 7.6, 0, { color: 'ink', width: 1, alpha: 0.4 });
          SR.text(`${v.fix(al.value / TAU, 2)} full twists`, 4, 1.35, { align: 'center', size: 13 });
          st = { ov, b, twists: al.value / TAU };
        });
        v.legend([['accent', '$\\operatorname{Re}\\langle\\chi_0|\\chi(\\alpha)\\rangle$'], ['orange', '$\\operatorname{Im}$'], ['gold', 'path of $\\langle\\boldsymbol\\sigma\\rangle$']]);
        v.readout(() => `$\\alpha=${v.fix(al.value, 3)}=${v.fix(al.value / Math.PI, 3)}\\pi$: $\\langle\\chi_0|\\chi(\\alpha)\\rangle=${texC(v, st.ov, 4)}$; $\\operatorname{Re}=${v.fix(st.ov[0], 4)}$ equals $\\cos(\\alpha/2)=${v.fix(Math.cos(al.value / 2), 4)}$ for every axis and every $\\chi_0$\n` +
          `Bloch vector $(${st.b.map((x) => v.fix(x, 3)).join(',')})$ — ${Math.abs(al.value - TAU) < 0.02 || Math.abs(al.value - 2 * TAU) < 0.02 ? 'back where it started, but the spinor carries a **minus** sign at $2\\pi$ and returns to $+$ only at $4\\pi$.' : 'the sign is invisible in the Bloch vector.'}`);
      },
    },
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Phenomenon',
      name: 'Neutron interferometry and 4π symmetry',
      statement: String.raw`Split a beam of spin-½ particles into two coherent paths, rotate the spin of one path by the angle $\alpha$ about a fixed axis (by letting it precess in a magnetic field) and recombine. The intensity in an output beam is
$$I(\alpha)=\tfrac12\big(1+\operatorname{Re}\langle\chi|U(\alpha)|\chi\rangle\big)=\tfrac12\big(1+\cos\tfrac\alpha2\big),$$
independent of the incident spin state $\chi$. It repeats with period $4\pi$ in the precession angle, not $2\pi$: at $\alpha=2\pi$ the rotated beam interferes with the opposite sign and the intensity is minimal. Experiments with neutrons in single-crystal interferometers have observed this sign change (Rauch et al. and Werner et al., 1975).`,
      idea: String.raw`In the field region the spinor evolves by $U(\alpha)=e^{-i\alpha\boldsymbol\sigma\cdot\mathbf n/2}$ (qm-7.8); the other arm leaves it unchanged. The two amplitudes add to $\tfrac12(1+U)\chi$ and the intensity is its squared norm. Since $U=\cos\frac\alpha2-i\sin\frac\alpha2\,\boldsymbol\sigma\cdot\mathbf n$ and $\langle\boldsymbol\sigma\cdot\mathbf n\rangle$ is real, the imaginary part drops out of $\operatorname{Re}\langle U\rangle$, leaving $\cos(\alpha/2)$. A vector precessing classically would give period $2\pi$; the experiment distinguishes the two.`,
      caption: String.raw`**Turn the magnetic field in one arm** (the precession angle $\alpha=\gamma BL/v$, here for a path of $2$ cm and neutrons of $2000$ m/s — illustrative numbers) and **choose the incident spin direction**. The curve is the quantum prediction $\tfrac12(1+\cos\frac\alpha2)$ computed from the spinor and the matrix $U$; the dashed curve is what a $2\pi$-periodic classical vector would give. Dots are simulated counts ($4000$ neutrons per point), generated by the quantum rule, *not* data from the experiment. Whatever the spin direction, the curve is the same.`,
      deps: ['qm-7.8'],
      refs: ['Sakurai ch. 3'],
      credit: 'Rauch et al.; Werner, Colella, Overhauser & Eagen, 1975',
      verify: true,
      tags: ['spin', 'interferometry', 'neutrons'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neutron_interferometer' },
      viz(v) {
        const SC = v.stage({ x: [0, 10], y: [-2, 2], axes: false, height: 230, title: 'the interferometer (schematic)', weight: 1.1 });
        const SI = v.stage({ x: [0, 8 * Math.PI], y: [-0.1, 1.15], axes: 'box', gutter: true, height: 230, xlabel: 'precession angle $\\alpha$', xticks: [[0, '0'], [2 * Math.PI, '2π'], [4 * Math.PI, '4π'], [6 * Math.PI, '6π'], [8 * Math.PI, '8π']], ylabel: '$I/I_0$', title: 'output intensity', weight: 1.4 });
        const gam = 1.832471e8, L = 0.02, vel = 2000, K = gam * L / vel; // rad per tesla
        const B = v.slider('field $B$ in arm II (mT)', 0, (8 * Math.PI) / K * 1e3, (3 * Math.PI) / K * 1e3, { step: 0.01 });
        const dir = v.select('incident spin', [{ value: 'par', label: 'along $\\mathbf B$' }, { value: 'perp', label: '$\\perp\\mathbf B$' }, { value: 'tilt', label: 'tilted' }], 'perp');
        const chis = { par: [[1, 0], [0, 0]], perp: [[Math.SQRT1_2, 0], [Math.SQRT1_2, 0]], tilt: [[Math.cos(0.45), 0], cscale(cis(1.2), Math.sin(0.45))] };
        const Hz = SZ;
        let st = null;
        v.render(() => {
          const alpha = (B.value * 1e-3) * K, chi = chis[dir.value];
          const U = (a) => propagator(mscale(Hz, 0.5), a);
          const I = (a) => { const c = mvec(U(a), chi), s = [[(chi[0][0] + c[0][0]) / 2, (chi[0][1] + c[0][1]) / 2], [(chi[1][0] + c[1][0]) / 2, (chi[1][1] + c[1][1]) / 2]]; return cabs2(s[0]) + cabs2(s[1]); };
          SI.fn((a) => 0.5 * (1 + Math.cos(a)), { color: 'muted', width: 1.4, dash: [5, 4], n: 300 });
          SI.fn((a) => I(a), { color: 'accent', width: 2.6, n: 300 });
          const r = v.rng(21 + dir.value.length);
          for (let k = 0; k <= 32; k++) { const a = (8 * Math.PI * k) / 32, p = I(a); let c = 0; const N = 4000; for (let i = 0; i < N; i++) if (r() < p) c++; SI.dot(a, c / N, { color: 'ink', r: 2.6 }); }
          SI.vline(alpha, { color: 'gold', width: 1.6 }); SI.dot(alpha, I(alpha), { color: 'gold', r: 6 });
          // schematic
          const P = (x, y) => [x, y];
          SC.path([[0.5, 0], [2, 0], [4, 1.2], [6, 1.2], [8, 0], [9.5, 0]], { color: 'muted', width: 1.4 });
          SC.path([[2, 0], [4, -1.2], [6, -1.2], [8, 0]], { color: 'muted', width: 1.4 });
          SC.rect(4.4, -1.65, 5.6, -0.75, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.4 });
          SC.text('B', 5, -1.2, { align: 'center', baseline: 'middle', color: 'orange', math: true, size: 15 });
          SC.arrow(0.2, 0, 1.6, 0, { color: 'accent', width: 2.4 }); SC.text('χ', 0.9, 0.35, { color: 'accent', math: true, align: 'center', size: 14 });
          SC.text('I', 9.4, 0.4, { color: 'gold', math: true, align: 'center', size: 15 });
          SC.dot(9.4, 0, { r: 5, color: 'gold' });
          SC.text('arm I: unchanged', 5, 1.65, { align: 'center', size: 12, color: 'muted' });
          st = { alpha, I: I(alpha) };
        });
        v.legend([['accent', 'quantum: $\\tfrac12(1+\\cos\\frac\\alpha2)$'], ['muted', 'vector of period $2\\pi$: $\\tfrac12(1+\\cos\\alpha)$', { dash: true }], ['ink', 'simulated counts', { dot: true }]]);
        v.readout(() => `$\\alpha=${v.fix(st.alpha / Math.PI, 3)}\\pi$ ($=\\gamma BL/v$ with $\\gamma_n=1.832\\times10^{8}\\,\\mathrm{s^{-1}T^{-1}}$): $I/I_0=${v.fix(st.I, 4)}$; one period of the curve is $4\\pi$, i.e. $B=${v.fix((4 * Math.PI) / K * 1e3, 2)}$ mT here (an $\\alpha=2\\pi$ field, $${v.fix((2 * Math.PI) / K * 1e3, 2)}$ mT, gives the *minimum*).`);
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Definition',
      name: 'The Bloch sphere',
      statement: String.raw`Every state of a spin ½ (or any two-level system), up to a global phase, is $|\mathbf n\rangle=\cos\tfrac\theta2|{\uparrow}\rangle+e^{i\phi}\sin\tfrac\theta2|{\downarrow}\rangle$, the eigenstate of $\boldsymbol\sigma\cdot\mathbf n$ with eigenvalue $+1$ for the unit vector $\mathbf n=(\sin\theta\cos\phi,\sin\theta\sin\phi,\cos\theta)$. The map state $\mapsto\mathbf n=\langle\boldsymbol\sigma\rangle$ identifies the projective space of $\mathbb C^2$ with the unit sphere (the **Bloch sphere**). Orthogonal states are antipodal points, and
$$|\langle\mathbf m|\mathbf n\rangle|^2=\tfrac12(1+\mathbf m\cdot\mathbf n)=\cos^2\tfrac\gamma2,$$
where $\gamma$ is the angle between $\mathbf m$ and $\mathbf n$. (For a mixed state the vector lies inside the ball.)`,
      idea: String.raw`Two complex amplitudes minus normalization and global phase leave two real angles. Expanding $|\mathbf n\rangle\langle\mathbf n|=\tfrac12(I+\boldsymbol\sigma\cdot\mathbf n)$ and using $\operatorname{tr}(\sigma_i\sigma_j)=2\delta_{ij}$ gives $|\langle\mathbf m|\mathbf n\rangle|^2=\operatorname{tr}(\rho_m\rho_n)=\tfrac12(1+\mathbf m\cdot\mathbf n)$. Changing the *relative phase* of the two components moves the point along a parallel of latitude, which is why the sphere is a faithful picture of the global-phase-free state. The sphere is also the Poincaré sphere of polarization optics and the picture introduced by Bloch for magnetic resonance.`,
      caption: String.raw`**Drag the gold point** (the state $|\mathbf n\rangle$) and **the purple point** (a measurement axis $\mathbf m$) over the sphere. The panel on the right is the curve $\cos^2(\gamma/2)$ against the angle $\gamma$ between them, with your configuration marked. Read off the spinor of each point, and check that the spinor of the antipode $-\mathbf n$ has zero overlap with $|\mathbf n\rangle$.`,
      deps: ['qm-7.7'],
      refs: ['Griffiths §4.4'],
      credit: 'Bloch, 1946 (sphere picture)',
      verify: true,
      tags: ['spin', 'Bloch sphere', 'qubit'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bloch_sphere' },
      viz(v) {
        const { st: SB, sc } = bloch3(v, null, 330, -0.5, 0.3, 'drag the points');
        const SG = v.stage({ x: [0, Math.PI], y: [0, 1.1], axes: 'box', gutter: true, height: 330, xlabel: 'angle $\\gamma$ between $\\mathbf n$ and $\\mathbf m$', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], ylabel: 'probability', title: '$P=\\cos^2(\\gamma/2)$' });
        const hn = sc.handle(snapSphere([0.55, 0.45, 0.7]), { color: 'gold', snap: snapSphere, label: 'n' });
        const hm = sc.handle(snapSphere([-0.2, 0.8, 0.4]), { color: 'purple', snap: snapSphere, label: 'm' });
        let st = null;
        v.render(() => {
          const n = hn.p, m = hm.p, chiN = stateOf(n), chiM = stateOf(m), anti = stateOf(n.map((x) => -x));
          const ovl = cabs2(ip(chiM, chiN)), g = Math.acos(Math.max(-1, Math.min(1, dot3(n, m))));
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          sc.arrow([0, 0, 0], n, { color: 'gold', width: 3 }); sc.arrow([0, 0, 0], m, { color: 'purple', width: 2.4 });
          sc.dot(n.map((x) => -x), { color: 'gold', r: 3.5 });
          sc.flush();
          SG.fn((x) => Math.cos(x / 2) ** 2, { color: 'accent', width: 2.2 });
          SG.dot(g, ovl, { color: 'purple', r: 6 }); SG.vline(g, { color: 'faint', dash: [3, 4] });
          st = { n, m, chiN, chiM, ovl, g, anti: cabs2(ip(anti, chiN)) };
        });
        v.readout(() => `$|\\mathbf n\\rangle=(${texC(v, st.chiN[0], 3)})|{\\uparrow}\\rangle+(${texC(v, st.chiN[1], 3)})|{\\downarrow}\\rangle$, $\\;|\\mathbf m\\rangle=(${texC(v, st.chiM[0], 3)})|{\\uparrow}\\rangle+(${texC(v, st.chiM[1], 3)})|{\\downarrow}\\rangle$\n` +
          `$|\\langle\\mathbf m|\\mathbf n\\rangle|^2=${v.fix(st.ovl, 4)}$, $\\;\\cos^2(\\gamma/2)=${v.fix(Math.cos(st.g / 2) ** 2, 4)}$ ($\\gamma=${v.fix(st.g, 3)}$); overlap with the antipode $-\\mathbf n$: $${v.fix(st.anti, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Spin measured along a tilted axis',
      statement: String.raw`If a spin ½ is prepared in the state $|{+}\mathbf n\rangle$ (spin up along $\mathbf n$) and $\mathbf S\cdot\mathbf m$ is measured, the outcome is $+\hbar/2$ with probability $\cos^2(\theta/2)$ and $-\hbar/2$ with probability $\sin^2(\theta/2)$, where $\theta$ is the angle between $\mathbf n$ and $\mathbf m$. After the measurement the state is $|{\pm}\mathbf m\rangle$. A sequence of measurements along axes $\mathbf m_1,\mathbf m_2,\dots$ therefore gives outcomes whose probabilities depend only on the angles between consecutive axes.`,
      idea: String.raw`This is the generalized Born rule (qm-5.6) applied to the projector $\tfrac12(I+\boldsymbol\sigma\cdot\mathbf m)$ with the Bloch-sphere overlap of qm-7.10: $\langle{+}\mathbf n|\tfrac12(I+\boldsymbol\sigma\cdot\mathbf m)|{+}\mathbf n\rangle=\tfrac12(1+\mathbf n\cdot\mathbf m)=\cos^2\tfrac\theta2$. Projective collapse resets the state to the measured eigenvector, so the next probability depends only on the *new* pair of axes — the spin has no memory of earlier history. Small $\theta$ makes survival likely at each step, which is the idea behind the quantum Zeno effect.`,
      caption: String.raw`**Set the tilt $\theta$ between successive axes.** A single spin is prepared along $z$ and measured along axes $\mathbf m_k$ tilted by $k\theta$ from $z$ (in the $xz$-plane): the sphere shows one walker (gold dots) hopping between $\pm\mathbf m_k$; **New walker** draws another. The right panel counts how many of 800 walkers have answered “$+$” at *every* step up to $k$ (dots) against $\cos^{2k}(\theta/2)$ (curve).`,
      deps: ['qm-7.7', 'qm-5.6'],
      refs: ['Griffiths §4.4'],
      tags: ['spin', 'measurement', 'Born rule'],
      viz(v) {
        const { st: SB, sc } = bloch3(v, null, 330, -0.6, 0.3, 'one walker on the Bloch sphere');
        const SS = v.stage({ x: [-0.3, 8.3], y: [0, 1.08], axes: 'box', gutter: true, height: 330, xlabel: 'step $k$', ylabel: 'fraction with all “+”', title: 'survival of “+” along the tilted axes' });
        const th = v.slider('tilt $\\theta$ between successive axes', 0.05, 1.6, 0.6, { step: 0.01 });
        let seed = 5; v.button('New walker', () => { seed += 1; });
        let st = null;
        v.render(() => {
          const T = th.value, ax = (k) => [Math.sin(k * T), 0, Math.cos(k * T)], K = 8, W = 800;
          // one walker for the picture
          const r1 = v.rng(seed * 101), path = [[0, 0, 1]]; let cur = [0, 0, 1], plusRun = 0; const outs = [];
          for (let k = 1; k <= K; k++) { const a = ax(k), p = (1 + dot3(cur, a)) / 2, s = r1() < p ? 1 : -1; outs.push(s); cur = a.map((x) => s * x); path.push(cur); }
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          for (let k = 1; k <= K; k++) sc.line(ax(k).map((x) => -1.12 * x), ax(k).map((x) => 1.12 * x), { color: 'faint', width: 1 });
          sc.path(path, { color: 'gold', width: 1.6, alpha: 0.8 });
          path.forEach((p, k) => sc.dot(p, { color: k === 0 ? 'green' : outs[k - 1] > 0 ? 'gold' : 'red', r: k === 0 ? 6 : 4 }));
          sc.flush();
          // statistics
          const r2 = v.rng(99), alive = new Array(K + 1).fill(0);
          for (let w = 0; w < W; w++) { let c = [0, 0, 1]; alive[0]++; for (let k = 1; k <= K; k++) { const a = ax(k), p = (1 + dot3(c, a)) / 2; if (r2() < p) { c = a; alive[k]++; } else break; } }
          SS.fn((k) => Math.cos(T / 2) ** (2 * k), { color: 'accent', width: 2.2, domain: [0, K], n: 80 });
          for (let k = 0; k <= K; k++) SS.dot(k, alive[k] / W, { color: 'ink', r: 4 });
          st = { alive, W, p1: Math.cos(T / 2) ** 2, outs, T };
        });
        v.legend([['accent', '$\\cos^{2k}(\\theta/2)$'], ['ink', 'simulated', { dot: true }], ['gold', '“+” outcome', { dot: true }], ['red', '“−” outcome', { dot: true }]]);
        v.readout(() => `$\\cos^2(\\theta/2)=${v.fix(st.p1, 4)}$ per step; first step: ${v.fix(st.alive[1] / st.alive[0], 3)} of ${st.W} walkers answered “+”; after $k=4$: ${v.fix(st.alive[4] / st.W, 3)}$ vs $\\cos^{8}(\\theta/2)=${v.fix(st.p1 ** 4, 3)}$. Walker shown: ${st.outs.map((s) => (s > 0 ? '+' : '−')).join('')}`);
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Model',
      name: 'Spin precession in a magnetic field',
      statement: String.raw`A spin ½ with magnetic moment $\boldsymbol\mu=\gamma\mathbf S$ in a uniform field $\mathbf B$ has Hamiltonian $H=-\gamma\,\mathbf S\cdot\mathbf B=\omega_L\,\hat{\mathbf b}\cdot\mathbf S$ with $\omega_L=-\gamma B$ and $\hat{\mathbf b}=\mathbf B/B$. The expectation vector $\langle\mathbf S\rangle$ obeys exactly the classical torque equation
$$\frac{d\langle\mathbf S\rangle}{dt}=\boldsymbol\omega_L\times\langle\mathbf S\rangle,\qquad\boldsymbol\omega_L=-\gamma\mathbf B,$$
so it precesses about $\mathbf B$ at the **Larmor frequency** $\omega_L=|\gamma|B$ with fixed length and fixed angle to the field. The state itself returns up to a phase after $2\pi/\omega_L$.`,
      idea: String.raw`The Heisenberg equation (qm-5.17) $\dot{\mathbf S}=\tfrac i\hbar[H,\mathbf S]$ with $[S_i,S_j]=i\hbar\varepsilon_{ijk}S_k$ gives the torque equation; linear in $\mathbf S$, so it holds for the expectation value with no approximation, whatever the state (Ehrenfest-like exactness). It is the quantum counterpart of a magnetic moment on an angular momentum, whose precession is classical Larmor precession (em-7.20). On the Bloch sphere (qm-7.10) the evolution $e^{-iHt}$ is a rigid rotation about $\hat{\mathbf b}$.`,
      caption: String.raw`**Set the field direction, the precession rate $\omega$ and the starting direction of the spin.** The left sphere follows $\langle\boldsymbol\sigma\rangle$ computed from the spinor evolved by the $2\times2$ matrix exponential $e^{-iHt}$; the dashed circle is the classical prediction, the rotation of the initial vector about $\mathbf B$. The right panel shows the three components against time. Their difference is shown in the readout: zero up to rounding, for every state.`,
      deps: ['qm-7.10', 'em-7.20', 'qm-5.17'],
      refs: ['Griffiths §4.4'],
      credit: 'Larmor, 1897 (classical precession)',
      verify: true,
      scope: String.raw`A free spin in a *uniform, static* field; no relaxation and no other degrees of freedom.`,
      tags: ['spin', 'precession', 'Larmor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Larmor_precession' },
      viz(v) {
        const { st: SB, sc } = bloch3(v, null, 320, -0.5, 0.3, '$\\langle\\boldsymbol\\sigma\\rangle$ in the field');
        const ST = v.stage({ x: [0, 10], y: [-1.15, 1.15], axes: 'box', gutter: true, height: 320, xlabel: 't', title: 'components of $\\langle\\boldsymbol\\sigma\\rangle$' });
        const bp = v.slider('field polar angle', 0, Math.PI, 0.5, { step: 0.01 }), ba = v.slider('field azimuth', -Math.PI, Math.PI, 0.2, { step: 0.01 }), om = v.slider('$\\omega_L$', 0.2, 2.5, 1, { step: 0.01 });
        const sp = v.slider('initial spin polar angle', 0, Math.PI, 1.9, { step: 0.01 });
        let st = null;
        v.animate((t) => {
          const b = [Math.sin(bp.value) * Math.cos(ba.value), Math.sin(bp.value) * Math.sin(ba.value), Math.cos(bp.value)];
          const H = mscale(spinAlong(S12, b), om.value), chi0 = stateOf([Math.sin(sp.value), 0, Math.cos(sp.value)]);
          const at = (tt) => blochOf(mvec(propagator(H, tt), chi0)), r0 = blochOf(chi0);
          const r = at(t), rc = rotate3(r0, b, om.value * t);
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          sc.line(b.map((x) => -1.3 * x), b.map((x) => 1.3 * x), { color: 'orange', width: 2 });
          sc.path(Array.from({ length: 73 }, (_, k) => rotate3(r0, b, (TAU * k) / 72)), { color: 'muted', width: 1.2, alpha: 0.8 });
          const trail = []; for (let k = 0; k <= 40; k++) trail.push(at(Math.max(0, t - 1.2) + (Math.min(t, 1.2) * k) / 40)); sc.path(trail, { color: 'gold', width: 2.4 });
          sc.arrow([0, 0, 0], r, { color: 'accent', width: 3 }); sc.dot(r, { color: 'accent', r: 5 });
          sc.flush();
          const cols = ['red', 'green', 'accent'];
          for (let c = 0; c < 3; c++) ST.fn((x) => at(x)[c], { color: cols[c], width: 1.8, domain: [0, 10], n: 160 });
          ST.vline(t, { color: 'faint', width: 1.2 });
          for (let c = 0; c < 3; c++) ST.dot(t, r[c], { color: cols[c], r: 4.5 });
          st = { d: Math.hypot(r[0] - rc[0], r[1] - rc[1], r[2] - rc[2]), len: Math.hypot(...r), ang: Math.acos(dot3(r, b) / Math.hypot(...r)), ang0: Math.acos(dot3(r0, b) / Math.hypot(...r0)), t };
        }, { period: 10, still: 3.2 });
        v.legend([['red', '$\\langle\\sigma_x\\rangle$'], ['green', '$\\langle\\sigma_y\\rangle$'], ['accent', '$\\langle\\sigma_z\\rangle$'], ['muted', 'classical cone', { dash: true }], ['orange', '$\\mathbf B$']]);
        v.readout(() => `$t=${v.fix(st.t, 2)}$, $\\omega_Lt/2\\pi=${v.fix((om.value * st.t) / TAU, 3)}$: quantum $\\langle\\boldsymbol\\sigma\\rangle$ vs classical rotation about $\\mathbf B$: difference $${v.sci(Math.max(st.d, 1e-17), 1)}$; $|\\langle\\boldsymbol\\sigma\\rangle|=${v.fix(st.len, 6)}$; angle to $\\mathbf B$ $=${v.fix(st.ang, 4)}$ (initial $${v.fix(st.ang0, 4)}$).`);
      },
    },
  ],
};
