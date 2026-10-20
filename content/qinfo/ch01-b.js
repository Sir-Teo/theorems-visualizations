// Quantum Information & Computation — Chapter 1, part b: items 1.5–1.7 (state discrimination, POVMs, Mach–Zehnder)
import {
  TAU, R2, cmul, cabs2, cis, cscale, mvec, blochOf, stateOf, unit3, norm3, dot3, sub3, add3, mul3, rotate3,
  texVec3, blochFrame, sphereOutline, blochStage, stateArrow, arcPts, sphereHandle, drawGroups, GATE,
} from './ch01.shared.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
function seqs(v, seed, k, n = 20000) { return Array.from({ length: k }, (_, j) => { const r = v.rng(seed + j), a = new Float64Array(n); for (let i = 0; i < n; i++) a[i] = r(); return a; }); }

export default {
  collection: 'qinfo',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Non-orthogonal states cannot be reliably distinguished',
      statement: String.raw`(a) If $|\psi_0\rangle,|\psi_1\rangle$ are orthogonal, a projective measurement in the basis $\{|\psi_0\rangle,|\psi_1\rangle\}$ identifies the state with certainty.

(b) If $|\psi_0\rangle,|\psi_1\rangle$ are not orthogonal, no measurement identifies the state with certainty. When the two are prepared with probability $\tfrac12$ each, the smallest possible probability of a wrong guess is the **Helstrom bound**
$$P_{\rm err}^{\min}=\tfrac12\Bigl(1-\sqrt{1-|\langle\psi_0|\psi_1\rangle|^2}\Bigr),$$
attained by the projective measurement along the Bloch axis $\mathbf r_0-\mathbf r_1$. It is $\tfrac12$ (a coin toss) for identical states.`,
      idea: String.raw`Any guessing strategy is a two-outcome measurement $\{E_0,E_1\}$, and it succeeds with probability $\tfrac12\operatorname{tr}(E_0\rho_0)+\tfrac12\operatorname{tr}(E_1\rho_1)=\tfrac12+\tfrac12\operatorname{tr}\bigl(E_0(\rho_0-\rho_1)\bigr)$. This is largest when $E_0$ projects onto the positive eigenspace of $\rho_0-\rho_1$ (qm-5.7 for the projective case), whose eigenvalues are $\pm\tfrac12|\mathbf r_0-\mathbf r_1|=\pm\sqrt{1-|\langle\psi_0|\psi_1\rangle|^2}$ — so the bound is half of one plus the trace distance. Non-orthogonal states are never fully separated because the overlap $|\langle\psi_0|\psi_1\rangle|$ is the cosine of half the angle between them on the Bloch sphere (qm-7.11) and a measurement axis can only split the two kets by their difference vector.

Apply the complex spectral theorem ladr-7.31 to the Hermitian difference $\Delta=\rho_0-\rho_1$. In its orthonormal eigenbasis, $\operatorname{tr}(E_0\Delta)$ is the sum of each eigenvalue times the corresponding diagonal entry of $E_0$. Since $0\le E_0\le I$, those entries lie in [0,1]; including every positive eigenspace and excluding every negative one maximizes the sum. This proves the optimal two-outcome measurement for the stated equal priors, not for arbitrary prior weights.`,
      caption: String.raw`**Drag the two states** (blue, purple) and the measurement axis $\hat m$ (green): outcome $+$ means "guess $\psi_0$". The left panel shows the error of your axis (orange) against the Helstrom bound (green) and a simulated error rate (gold); the right panel sweeps the angle between $\hat m$ and the best axis. *Optimal axis* snaps $\hat m$ to $\mathbf r_0-\mathbf r_1$; *Orthogonal* makes the states antipodal, where the error vanishes.`,
      deps: ['qm-7.11', 'qm-5.7', 'ladr-7.31'],
      refs: ['Nielsen–Chuang §2.2.4'],
      tags: ['state discrimination', 'Helstrom bound'],
      credit: String.raw`C. W. Helstrom, 1969 (J. Stat. Phys. 1, 231) and his book *Quantum Detection and Estimation Theory* (1976)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_state_discrimination' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 330, weight: 1.2, title: 'two states and a measurement axis' });
        const E = v.stage({ x: [0, 1], y: [0, 0.56], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'overlap $|\\langle\\psi_0|\\psi_1\\rangle|$', ylabel: 'error probability', title: 'error versus overlap' });
        const W = v.stage({ x: [0, Math.PI], y: [0, 0.56], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'angle to the best axis', ylabel: 'error probability', title: 'error versus axis',
          xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']] });
        const shots = v.slider('simulated trials', 10, 20000, 2000, { log: true, int: true });
        const h0 = sphereHandle(sc, [0, 0, 1], { color: 'accent', label: 'ψ₀' });
        const h1 = sphereHandle(sc, unit3([0.9, 0.2, 0.55]), { color: 'purple', label: 'ψ₁' });
        const hm = sphereHandle(sc, unit3([-0.84, -0.19, 0.49]), { color: 'green', label: 'm' });
        v.button('Optimal axis', () => { const d = sub3(h0.p, h1.p); if (norm3(d) > 1e-6) hm.set(unit3(d)); });
        v.button('Orthogonal', () => h1.set(mul3(h0.p, -1)));
        v.button('Identical', () => h1.set(h0.p));
        const [u1, u2] = seqs(v, 71, 2);
        let st = null;
        v.render(() => {
          const r0 = h0.p.slice(), r1 = h1.p.slice(), m = hm.p.slice(), D = sub3(r0, r1), dn = norm3(D);
          const c = Math.sqrt(Math.max(0, (1 + dot3(r0, r1)) / 2)), hel = 0.5 * (1 - Math.sqrt(Math.max(0, 1 - c * c)));
          const perr = 0.5 - 0.25 * dot3(m, D);
          const n = shots.value; let errs = 0;
          for (let i = 0; i < n; i++) { const s = u1[i] < 0.5 ? r0 : r1, plus = u2[i] < (1 + dot3(m, s)) / 2; if (plus !== (s === r0)) errs++; }
          const mc = errs / n, best = dn > 1e-6 ? unit3(D) : null, om = best ? Math.acos(Math.max(-1, Math.min(1, dot3(m, best)))) : 0;
          sc.begin(); sphereOutline(S); blochFrame(sc, { labels: false });
          sc.line(mul3(m, -1.3), mul3(m, 1.3), { color: 'green', width: 1.8, dash: true });
          if (best) sc.arrow([0, 0, 0], mul3(best, 1.0), { color: 'muted', width: 1.2, head: 7, alpha: 0.6 });
          stateArrow(S, sc, r0, '', 'accent'); stateArrow(S, sc, r1, '', 'purple'); sc.arrow([0, 0, 0], m, { color: 'green', width: 2.2, head: 9 });
          sc.flush();
          // error versus overlap
          E.fn((x) => 0.5 * (1 - Math.sqrt(Math.max(0, 1 - x * x))), { color: 'green', width: 2.2, domain: [0, 1] });
          E.hline(0.5, { color: 'muted', width: 1, dash: true });
          E.text('coin toss', 0.98, 0.5, { size: 11, align: 'right', baseline: 'bottom', dy: -3, color: 'muted' });
          E.dot(c, hel, { color: 'green', r: 6 }); E.dot(c, perr, { color: 'orange', r: 6 }); E.dot(c, mc, { color: 'gold', r: 4.5 });
          W.fn((o) => 0.5 - 0.25 * dn * Math.cos(o), { color: 'orange', width: 2.2, domain: [0, Math.PI] });
          W.hline(hel, { color: 'green', width: 1.4, dash: true });
          W.dot(om, perr, { color: 'orange', r: 6 });
          st = { c, hel, perr, mc, n, errs, om };
        });
        v.legend([['green', 'Helstrom bound'], ['orange', 'error of the axis $\\hat m$'], ['gold', 'simulated error rate']]);
        v.readout(() => {
          const { c, hel, perr, mc, n, errs, om } = st;
          return `overlap $|\\langle\\psi_0|\\psi_1\\rangle| = ${v.fix(c, 4)}$ $\\Rightarrow$ Helstrom bound $\\tfrac12(1-\\sqrt{1-c^2}) = ${v.fix(hel, 4)}$ ${c < 1e-3 ? '(orthogonal: perfect)' : ''}\n` +
            `your axis: $P_{\\rm err}=\\tfrac12-\\tfrac14\\hat m\\cdot(\\mathbf r_0-\\mathbf r_1)=${v.fix(perr, 4)}\\ge${v.fix(hel, 4)}$ (angle to best axis $${v.fix(om, 3)}$); ${n} trials: ${errs} wrong $=${v.fix(mc, 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Generalized measurements (POVMs)',
      statement: String.raw`A **generalized measurement** (POVM) on a system with Hilbert space $\mathcal H$ is a finite family of positive semidefinite operators $E_k\ge0$ with $\sum_kE_k=I$; outcome $k$ occurs with probability $\operatorname{tr}(E_k\rho)=\langle\psi|E_k|\psi\rangle$ for $\rho=|\psi\rangle\langle\psi|$. Projective measurements are the case $E_k^2=E_k$; but a POVM may have more outcomes than $\dim\mathcal H$, and it can be realized as a projective measurement on a larger system (Naimark dilation).

*Example (unambiguous discrimination).* For $|\psi_0\rangle,|\psi_1\rangle$ with overlap $c=|\langle\psi_0|\psi_1\rangle|<1$ take $E_0=\alpha|\psi_1^\perp\rangle\langle\psi_1^\perp|$, $E_1=\alpha|\psi_0^\perp\rangle\langle\psi_0^\perp|$, $E_?=I-E_0-E_1$. This is a POVM exactly when $\alpha\le\frac1{1+c}$; with $\alpha=\frac1{1+c}$ outcome "0" or "1" is *never wrong*, and the inconclusive outcome "?" occurs with probability $c$.`,
      idea: String.raw`A projective measurement forces exactly $\dim\mathcal H=2$ outcomes, so it must always give a verdict and, for non-orthogonal states, sometimes a wrong one (qinfo-1.5). Allowing a third outcome lets the experimenter choose operators orthogonal to one candidate: $E_0$ kills $\psi_1$ so a "0" click rules $\psi_1$ out. Positivity of $E_?$, with eigenvalues $1-\alpha\pm\alpha c$, caps $\alpha$ at $\frac1{1+c}$; the success probability is then $\alpha(1-c^2)=1-c$. This is the best any unambiguous strategy achieves for equally likely states (Ivanovic–Dieks–Peres).

The positivity characterization ladr-7.38 turns the POVM constraint into an eigenvalue test. For nonnegative alpha, the two conclusive effects are positive rank-one multiples. The remaining effect is Hermitian with the displayed eigenvalues, so both are nonnegative exactly when $\alpha\le1/(1+c)$. At that endpoint each candidate has conclusive probability $\alpha(1-c^2)=1-c$; the zero overlap case gives an ordinary projective measurement.`,
      caption: String.raw`**Drag the two states** on the sphere. The three POVM elements $E_k=\tfrac12(t_kI+\mathbf w_k\cdot\boldsymbol\sigma)$ are drawn as the vectors $\mathbf w_k$ (they sum to zero because $\sum E_k=I$). The bars give the outcome probabilities for each prepared state (pale = exact, gold = simulated): the wrong-answer bars are zero. Push the **weight** $\alpha/\alpha_{\max}$ above 1 and $E_?$ stops being positive — the operators are no longer a measurement.`,
      deps: ['qinfo-1.5', 'qm-5.7', 'ladr-7.38'],
      refs: ['Nielsen–Chuang §2.2.6'],
      tags: ['POVM', 'unambiguous discrimination'],
      credit: String.raw`POVMs: E. B. Davies & J. T. Lewis, 1970; unambiguous discrimination: I. D. Ivanovic (1987), D. Dieks (1988), A. Peres (1988)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/POVM' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 330, weight: 1.05, title: 'states and POVM vectors $\\mathbf w_k$' });
        const B = v.stage({ x: [-0.3, 7.3], y: [-0.22, 1.32], axes: false, height: 330, weight: 1.0, title: 'outcome probabilities' });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.85, xlabel: 'overlap $c$', ylabel: 'probability', title: 'versus a projective guess' });
        const f = v.slider('weight $\\alpha/\\alpha_{\\max}$', 0, 1.3, 1, { step: 0.01 });
        const shots = v.slider('trials per state', 10, 20000, 1000, { log: true, int: true });
        const h0 = sphereHandle(sc, [0, 0, 1], { color: 'accent', label: 'ψ₀' });
        const h1 = sphereHandle(sc, unit3([0.85, 0.1, 0.5]), { color: 'purple', label: 'ψ₁' });
        v.button('Orthogonal', () => h1.set(mul3(h0.p, -1)));
        v.button('Nearly equal', () => h1.set(unit3(add3(h0.p, [0.45, 0.1, 0]))));
        const [u0, u1] = seqs(v, 91, 2);
        let st = null;
        v.render(() => {
          const r0 = h0.p.slice(), r1 = h1.p.slice(), c = Math.sqrt(Math.max(0, (1 + dot3(r0, r1)) / 2));
          const amax = 1 / (1 + c), al = f.value * amax;
          const t = [al, al, 2 * (1 - al)], w = [mul3(r1, -al), mul3(r0, -al), mul3(add3(r0, r1), al)];
          const P = [r0, r1].map((r) => t.map((tk, k) => 0.5 * (tk + dot3(w[k], r))));
          const minEig = 1 - al - al * c, valid = minEig > -1e-9, n = shots.value;
          const freq = P.map((p, j) => { const u = j ? u1 : u0, q = p.map((x) => Math.max(0, x)), s = q[0] + q[1] + q[2] || 1, cnt = [0, 0, 0]; for (let i = 0; i < n; i++) { const x = u[i] * s; cnt[x < q[0] ? 0 : x < q[0] + q[1] ? 1 : 2]++; } return cnt.map((k) => k / n); });
          sc.begin(); sphereOutline(S); blochFrame(sc, { labels: false });
          stateArrow(S, sc, r0, '', 'accent', { width: 1.8, r: 3.5 }); stateArrow(S, sc, r1, '', 'purple', { width: 1.8, r: 3.5 });
          const cols = ['orange', 'green', valid ? 'muted' : 'red'];
          w.forEach((wk, k) => { if (norm3(wk) > 1e-6) { sc.arrow([0, 0, 0], wk, { color: cols[k], width: 2.6, head: 9 }); const q = sc.P(mul3(wk, 1.0 + 0.2 / Math.max(0.3, norm3(wk)))); S.tex(['E_0', 'E_1', 'E_?'][k], q[0], q[1], { color: cols[k], size: 14, align: 'center' }); } });
          sc.flush();
          const ok = ['green', 'red', 'muted'], ok2 = ['red', 'green', 'muted'], nm = ['0', '1', '?'];
          drawGroups(v, B, [
            { label: 'prepared ψ₀', probs: P[0].map((x) => Math.max(0, x)), freq: freq[0], names: nm, colors: ok },
            { label: 'prepared ψ₁', probs: P[1].map((x) => Math.max(0, x)), freq: freq[1], names: nm, colors: ok2 },
          ], { labelY: 1.1 });
          C.fn((x) => 1 - x, { color: 'green', width: 2.2, domain: [0, 1] });
          C.fn((x) => 0.5 * (1 + Math.sqrt(Math.max(0, 1 - x * x))), { color: 'blue', width: 1.8, dash: true, domain: [0, 1] });
          C.fn((x) => 0.5 * (1 - Math.sqrt(Math.max(0, 1 - x * x))), { color: 'red', width: 1.8, domain: [0, 1] });
          C.dot(c, al * (1 - c * c), { color: 'orange', r: 6 });
          st = { c, al, amax, P, minEig, valid, t, w };
        });
        v.legend([['green', 'POVM: correct $=1-c$, wrong $=0$'], ['blue', 'projective: correct'], ['red', 'projective: wrong'], ['orange', 'your $\\alpha$: correct']]);
        v.readout(() => {
          const { c, al, amax, P, minEig, valid, t } = st;
          return `$c=${v.fix(c, 4)}$, $\\alpha_{\\max}=\\tfrac1{1+c}=${v.fix(amax, 4)}$; $\\operatorname{tr}\\sum E_k=${v.fix(t[0] + t[1] + t[2], 4)}=2$; smallest eigenvalue of $E_?$: $${v.fix(minEig, 4)}$ ${valid ? '— all $E_k\\ge0$: a valid POVM' : '— **negative: not a POVM**'}\n` +
            `from $\\psi_0$: $P(0)=${v.fix(P[0][0], 3)}$, $P(1)=${v.fix(P[0][1], 3)}$, $P(?)=${v.fix(P[0][2], 3)}$ · success $=${v.fix(al * (1 - c * c), 4)}$ (maximum $1-c=${v.fix(1 - c, 4)}$) · Helstrom projective guess is right with $${v.fix(0.5 * (1 + Math.sqrt(1 - c * c)), 4)}$ but wrong $${v.fix(0.5 * (1 - Math.sqrt(1 - c * c)), 4)}$ of the time`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Mach–Zehnder interferometer as a qubit',
      statement: String.raw`Label the two arms of a Mach–Zehnder interferometer by the basis states $|0\rangle$ (upper) and $|1\rangle$ (lower) of a "path qubit". A (symmetric) beam splitter acts as a Hadamard gate $H$, a relative phase delay $\varphi$ in one arm as the phase gate $\mathrm{diag}(1,e^{i\varphi})$ (a $Z$-rotation up to a global phase), and the detectors measure in the computational basis. For a single photon entering the first port, $H\,\mathrm{diag}(1,e^{i\varphi})\,H|0\rangle=\tfrac12\bigl((1+e^{i\varphi})|0\rangle+(1-e^{i\varphi})|1\rangle\bigr)$, so $P(D_0)=\cos^2\tfrac\varphi2$ and $P(D_1)=\sin^2\tfrac\varphi2$. If one arm is blocked, the photon is absorbed with probability $\tfrac12$ and otherwise reaches each detector with probability $\tfrac14$, independent of $\varphi$: the fringes vanish.`,
      scope: String.raw`Ideal lossless single-photon interferometer with 50:50 splitters. A physical beam splitter adds a factor $i$ to the reflected amplitude, $\tfrac1{\sqrt2}\begin{pmatrix}1&i\\i&1\end{pmatrix}$, which differs from $H$ by phases that relabel the detectors and shift $\varphi$; the model uses $H$ as in the usual quantum-circuit presentation.`,
      idea: String.raw`The first splitter turns the definite path $|0\rangle$ into the superposition $|{+}\rangle$ — on the Bloch sphere (qinfo-1.3) a point on the equator. The phase delay rotates it about $z$ to longitude $\varphi$, and the second splitter, being $H$ again, rotates the equator back to the $z$-axis, so the detector probabilities are $\tfrac12(1\pm\cos\varphi)$: interference is the interplay of amplitudes, not of probabilities. Blocking an arm is a measurement in the path basis: it collapses the qubit onto a pole, where the second Hadamard produces a fair coin.`,
      caption: String.raw`**Slide the phase $\varphi$**: ray thickness shows where the photon is likely to be, the gold dot is the photon, and detector clicks are simulated. The curves show $P(D_0),P(D_1)$ against $\varphi$ (gold dots: measured frequencies). **Block an arm** and the oscillation collapses to $\tfrac14$. The sphere shows the path qubit after the phase shifter (blue) and after the second beam splitter (orange).`,
      deps: ['qinfo-1.3', 'waves-6.9'],
      refs: ['Nielsen–Chuang §7.4'],
      tags: ['interference', 'interferometer', 'single photon'],
      credit: String.raw`L. Zehnder (1891) and L. Mach (1892)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mach%E2%80%93Zehnder_interferometer' },
      viz(v) {
        const A = v.stage({ x: [0, 10.6], y: [0, 6], equal: true, axes: false, height: 330, full: true, title: 'a single photon in a Mach–Zehnder interferometer' });
        const F = v.stage({ x: [0, 4 * Math.PI], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.15, xlabel: 'phase $\\varphi$', ylabel: 'detector probability', title: 'fringes',
          xticks: [[0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π'], [3 * Math.PI, '3π'], [4 * Math.PI, '4π']] });
        const { S, sc } = blochStage(v, { height: 300, weight: 0.85, title: 'the path qubit', pitch: 0.35, yaw: -0.5 });
        const phi = v.slider('phase $\\varphi$', 0, 4 * Math.PI, 1.0, { step: 0.01 });
        const block = v.select('block', [{ value: 'none', label: 'none' }, { value: 'up', label: 'upper arm' }, { value: 'low', label: 'lower arm' }], 'none');
        const shots = v.slider('photons', 10, 20000, 500, { log: true, int: true });
        const [us] = seqs(v, 5, 1);
        const BS1 = [1.7, 3], MT = [5.3, 5.3], MB = [5.3, 0.7], BS2 = [8.9, 3], D0 = [10.0, 4.7], D1 = [10.0, 1.3], IN = [0.2, 3];
        const along = (pts, u) => { const L = []; let tot = 0; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); L.push(l); tot += l; } let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = Math.min(1, d / L[i]); return [pts[i][0] + k * (pts[i + 1][0] - pts[i][0]), pts[i][1] + k * (pts[i + 1][1] - pts[i][1])]; } d -= L[i]; } return pts[0]; };
        const model = () => {
          const Hm = GATE.H(), ph = cis(phi.value);
          let a = mvec(Hm, [[1, 0], [0, 0]]); // after BS1
          const mid = a.map((z) => z.slice());
          if (block.value === 'up') a = [[0, 0], a[1]]; else if (block.value === 'low') a = [a[0], [0, 0]];
          const lostP = 1 - cabs2(a[0]) - cabs2(a[1]);
          const shifted = [a[0], cmul(a[1], ph)];
          const out = mvec(Hm, shifted);
          return { mid, a, shifted, out, p: [cabs2(out[0]), cabs2(out[1])], lost: lostP };
        };
        let info = null;
        v.animate((t) => {
          const M = model(), [p0, p1] = M.p, pu = cabs2(M.mid[0]), pl = cabs2(M.mid[1]);
          const seg = (pts, pr, col = 'accent') => A.path(pts, { color: col, width: 1.5 + 8 * pr, alpha: 0.25 + 0.6 * pr });
          const blockedU = block.value === 'up', blockedL = block.value === 'low';
          seg([IN, BS1], 1);
          seg([BS1, MT], pu); seg([MT, BS2], blockedU ? 0 : pu); seg([BS1, MB], pl); seg([MB, BS2], blockedL ? 0 : pl);
          seg([BS2, D0], p0, 'green'); seg([BS2, D1], p1, 'green');
          // optics
          const bs = (p, lab) => { A.poly([[p[0] - 0.42, p[1] - 0.42], [p[0] + 0.42, p[1] + 0.42], [p[0] + 0.3, p[1] + 0.54], [p[0] - 0.54, p[1] - 0.3]], { fill: 'purple', fillAlpha: 0.35, color: 'purple' }); A.tex(lab, p[0], p[1] - 0.95, { size: 14, color: 'purple', align: 'center' }); };
          bs(BS1, 'H'); bs(BS2, 'H');
          for (const [m, dy] of [[MT, 0.32], [MB, -0.32]]) { A.line(m[0] - 0.5, m[1] + dy * 0.3, m[0] + 0.5, m[1] - dy * 0.3, { color: 'ink', width: 4 }); }
          const px = BS1[0] + 0.7 * (MB[0] - BS1[0]), py = BS1[1] + 0.7 * (MB[1] - BS1[1]);
          A.rect(px - 0.36, py - 0.28, px + 0.36, py + 0.28, { fill: 'gold', fillAlpha: 0.35, color: 'gold', radius: 4 });
          A.tex('\\varphi', px, py, { size: 13, color: 'ink', align: 'center', baseline: 'middle' });
          const ub = along([BS1, MT], 0.3), lb = along([BS1, MB], 0.3);
          if (blockedU) { A.line(ub[0] - 0.4, ub[1] - 0.5, ub[0] + 0.4, ub[1] + 0.5, { color: 'red', width: 5 }); A.text('blocked', ub[0] - 0.6, ub[1] + 0.3, { size: 12, color: 'red', align: 'right' }); }
          if (blockedL) { A.line(lb[0] - 0.4, lb[1] + 0.5, lb[0] + 0.4, lb[1] - 0.5, { color: 'red', width: 5 }); A.text('blocked', lb[0] - 0.6, lb[1] - 0.3, { size: 12, color: 'red', align: 'right' }); }
          A.text('upper arm  |0⟩', 3.5, 4.9, { size: 12, color: 'muted', align: 'right' }); A.text('lower arm  |1⟩', 3.5, 0.9, { size: 12, color: 'muted', align: 'right' });
          A.text('source', IN[0], IN[1] + 0.35, { size: 12, color: 'muted' });
          // detectors with simulated clicks
          const n = shots.value; let c0 = 0, c1 = 0, cl = 0; for (let i = 0; i < n; i++) { const x = us[i]; if (x < p0) c0++; else if (x < p0 + p1) c1++; else cl++; }
          for (const [D, k, col, nm, cnt, pp] of [[D0, 0, 'green', 'D₀', c0, p0], [D1, 1, 'green', 'D₁', c1, p1]]) {
            A.circle(D[0], D[1], 0.34, { fill: col, fillAlpha: 0.12 + 0.6 * pp, color: col, width: 2 });
            A.text(nm, D[0], D[1], { size: 12, align: 'center', baseline: 'middle', color: 'ink' });
            A.text(`${cnt} clicks`, D[0] - 0.1, D[1] + (k ? -0.8 : 0.8), { size: 12, align: 'right', color: 'ink' });
          }
          if (cl) A.text(`${cl} photons absorbed by the blocker`, 5.3, 3, { size: 12, align: 'center', color: 'red' });
          // photon (animated): one dot per branch, size ∝ probability
          const u = (t % 3.2) / 3.2, dot = (pts, k, pr, col = 'gold') => { if (pr < 0.02) return; const q = along(pts, k); A.dot(q[0], q[1], { color: col, r: 3 + 7 * Math.sqrt(pr) }); };
          if (u < 0.2) dot([IN, BS1], u / 0.2, 1);
          else if (u < 0.65) { const k = (u - 0.2) / 0.45; dot([BS1, MT, BS2], k, pu); dot([BS1, MB, BS2], k, pl); }
          else if (u < 0.95) { const k = (u - 0.65) / 0.3; dot([BS2, D0], k, p0); dot([BS2, D1], k, p1); }
          // fringes
          F.fn((x) => Math.cos(x / 2) ** 2, { color: 'green', width: 2, alpha: block.value === 'none' ? 1 : 0.25 });
          F.fn((x) => Math.sin(x / 2) ** 2, { color: 'orange', width: 2, alpha: block.value === 'none' ? 1 : 0.25 });
          if (block.value !== 'none') F.hline(0.25, { color: 'red', width: 2.2 });
          F.vline(phi.value, { color: 'muted', width: 1, dash: true });
          F.dot(phi.value, p0, { color: 'green', r: 6 }); F.dot(phi.value, p1, { color: 'orange', r: 6 });
          F.dot(phi.value, c0 / n, { color: 'gold', r: 4 }); F.dot(phi.value, c1 / n, { color: 'gold', r: 4 });
          // path qubit on the sphere
          const bsh = blochOf(block.value === 'none' ? M.shifted : M.a.map((z) => z.slice())), sh = block.value === 'none' ? bsh : blochOf(block.value === 'up' ? [[0, 0], [1, 0]] : [[1, 0], [0, 0]]);
          const fin = blochOf(block.value === 'none' ? M.out : mvec(GATE.H(), block.value === 'up' ? [[0, 0], [1, 0]] : [[1, 0], [0, 0]]));
          sc.begin(); sphereOutline(S); blochFrame(sc);
          sc.path(arcPts([1, 0, 0], [0, 0, 1], phi.value, 60), { color: 'gold', width: 1.8, alpha: 0.8 });
          stateArrow(S, sc, fin, '', 'orange', { width: 2.2, r: 4 }); stateArrow(S, sc, sh, '', 'accent');
          sc.flush();
          info = { M, c0, c1, cl, n, sh, fin };
        }, { still: 1.5 });
        v.legend([['accent', 'path qubit after the phase shifter'], ['orange', 'after the second splitter'], ['green', '$P(D_0)$'], ['orange', '$P(D_1)$'], ['gold', 'simulated']]);
        v.readout(() => {
          const { M, c0, c1, cl, n } = info, closed = Math.cos(phi.value / 2) ** 2;
          return block.value === 'none'
            ? `$P(D_0)=${v.fix(M.p[0], 4)}$ vs $\\cos^2\\tfrac\\varphi2=${v.fix(closed, 4)}$; $P(D_1)=${v.fix(M.p[1], 4)}$; sum $=${v.fix(M.p[0] + M.p[1], 4)}$ · ${n} photons: $D_0$ ${c0}, $D_1$ ${c1}`
            : `arm blocked: absorbed $${v.fix(M.lost, 3)}$, $P(D_0)=${v.fix(M.p[0], 3)}$, $P(D_1)=${v.fix(M.p[1], 3)}$ for every $\\varphi$ (no fringes) · ${n} photons: $D_0$ ${c0}, $D_1$ ${c1}, absorbed ${cl}`;
        });
      },
    },
  ],
};
