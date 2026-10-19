// Quantum Mechanics — Chapter 7, part c: items 7.13–7.17 (g ≈ 2, addition of angular momenta, Clebsch–Gordan, singlet/triplet, Wigner–Eckart)
// ħ = 1 unless an item says otherwise.
import {
  TAU, fz, spinOps, spinAlong, propagator, mvec, mmul, madd, mscale, msub, fnorm, heig, cplx, cells, cabs, cabs2, cmul, cis, cscale, ip, sub,
  cg, cgByLowering, productBasis, ylm, sphereIP, SX, SY, SZ, eye, texC, phaseRGB, rotate3, blochOf, stateOf,
} from './ch07.shared.js';

/** Signed square-root fraction text for x with x² rational (e.g. −√(1/2)). */
function sqFrac(x) {
  if (Math.abs(x) < 1e-9) return '0';
  const x2 = x * x, s = x < 0 ? '−' : '';
  for (let q = 1; q <= 600; q++) { const p = x2 * q; if (Math.abs(p - Math.round(p)) < 1e-7) { const P = Math.round(p); return q === 1 ? `${s}${Math.sqrt(P) % 1 === 0 ? Math.sqrt(P) : '√' + P}` : `${s}√(${P}/${q})`; } }
  return `${s}${Math.abs(x).toFixed(3)}`;
}
const half = (x) => (Number.isInteger(x) ? String(x) : `${2 * x}/2`);
const kron = (A, B) => { const n = A.length, m = B.length; const R = Array.from({ length: n * m }, () => Array.from({ length: n * m }, () => [0, 0])); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) R[i * m + a][k * m + b] = cmul(A[i][k], B[a][b]); return R; };
const kvec = (a, b) => a.flatMap((x) => b.map((y) => cmul(x, y)));

export default {
  collection: 'qm',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Phenomenon',
      name: 'Spin magnetic moment and g ≈ 2',
      statement: String.raw`A charge $-e$ moving in an orbit has a magnetic moment proportional to its orbital angular momentum, $\boldsymbol\mu_L=-\tfrac{e}{2m_e}\mathbf L=-g_L\mu_B\mathbf L/\hbar$ with $g_L=1$ ($\mu_B=e\hbar/2m_e$ is the Bohr magneton). The electron's *spin* has a moment $\boldsymbol\mu_S=-g_s\mu_B\mathbf S/\hbar$ with $g_s\approx2$, **twice** what the classical orbital relation would give; the free-electron Dirac equation gives $2$ before radiative corrections, and radiative corrections raise it to $g_s=2.0023193\ldots$ (CODATA2022 magnitude: $2.002\,319\,304\,360\,92(36)$). In a field $\mathbf B$ the moments precess at the angular frequencies $g\,\mu_BB/\hbar$: the spin turns about twice as fast as an orbit.`,
      idea: String.raw`In a uniform field $H=-\boldsymbol\mu\cdot\mathbf B$, so $H=g\omega_L\,\hat{\mathbf b}\cdot\mathbf J$ with $\omega_L=\mu_BB/\hbar$, and by qm-7.12 the expectation of the angular momentum precesses at $g\omega_L$. The classical relation $\mu=\frac q{2m}L$ holds for orbital motion, but for spin there is no classical orbit to compare with: the ratio $g_s\simeq2$ follows from the relativistic Dirac equation; the small excess comes from the electron's coupling to the quantum electromagnetic field (the leading anomalous moment is $a_e=(g_s-2)/2=\alpha/(2\pi)+\cdots$).`,
      caption: String.raw`**Choose the field $B$** (log scale, in tesla) and watch an orbital angular momentum ($l=1$, left, blue) and a spin angular momentum ($s=\tfrac12$, right, orange) start along $x$ and precess about $B$. Both are computed by evolving the real state vectors with the matrices of qm-7.12; the right panel plots the unwrapped precession angle of each. The slope ratio is the readout’s $g$. **Toggle** the QED correction to switch between the Dirac value $2$ and the measured $2.0023$. The frequencies are real numbers for this field: about $14.0$ GHz per tesla for the orbit, $28.0$ GHz per tesla for the spin.`,
      deps: ['qm-7.7', 'em-7.17'],
      refs: ['Fitzpatrick §10.6 Eqs10.57–10.77; NIST CODATA2022 full constants table'],
      credit: 'Dirac magnetic moment and radiative anomaly',
      tags: ['spin', 'magnetic moment', 'g-factor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gyromagnetic_ratio#Electron_g-factor' },
      viz(v) {
        const A = v.stage({ x: [-3.1, 3.1], y: [-1.7, 1.7], equal: true, axes: false, height: 290, title: 'view from above: $\\langle\\mathbf L\\rangle_\\perp$ and $\\langle\\mathbf S\\rangle_\\perp$', weight: 1.2 });
        const P = v.stage({ x: [0, 1.5], y: [-0.3, 6.4 * Math.PI], axes: 'box', gutter: true, height: 290, xlabel: '$t/T_L$', ylabel: 'angle (rad)', title: 'precession angle against time', weight: 1.2 });
        const B = v.slider('field $B$ (tesla)', 0.01, 10, 1, { log: true, sig: 2 });
        const qed = v.toggle('include the QED correction ($g_s=2.0023$)', true);
        const M = v.M, S1 = spinOps(1), S2 = spinOps(0.5);
        const GE = 2.00231930436092;
        const x1 = [[1, 0], [0, 0], [0, 0]], psiL = (() => { const E = heig(S1.Sx); return E.vectors[E.values.indexOf(Math.max(...E.values))]; })();
        const x2 = (() => { const E = heig(S2.Sx); return E.vectors[E.values.indexOf(Math.max(...E.values))]; })();
        const ang = (S, psi, H, t) => { const u = mvec(propagator(H, t), psi); const ex = (O) => ip(u, mvec(O, u))[0]; return [ex(S.Sx), ex(S.Sy)]; };
        let st = null;
        v.animate((tt) => {
          const g = qed.value ? GE : 2, f = tt / 12, tT = f * 1.5; // time in orbital Larmor periods
          const w = TAU, HL = mscale(S1.Sz, w), HS = mscale(S2.Sz, g * w);
          const Lv = ang(S1, psiL, HL, tT), Sv = ang(S2, x2, HS, tT);
          const track = (S, psi, H, k) => { const out = []; let prev = 0, acc = 0; for (let i = 0; i <= 120; i++) { const t = (1.5 * i) / 120, [a, b] = ang(S, psi, H, t), th = Math.atan2(b, a); if (i) { let d = th - prev; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; acc += d; } prev = th; out.push([t, acc + (i ? 0 : th)]); } return out; };
          const aL = track(S1, psiL, HL), aS = track(S2, x2, HS);
          const R = 1.3;
          for (const [cx, v2, mag, col, lab] of [[-1.7, Lv, 1, 'accent', 'orbit $l=1$, $g_L=1$'], [1.7, Sv, 0.5, 'orange', 'spin $\\tfrac12$, $g_s$']]) {
            A.circle(cx, 0, R, { color: 'faint', width: 1 }); A.line(cx - R, 0, cx + R, 0, { color: 'faint', width: 0.8 }); A.line(cx, -R, cx, R, { color: 'faint', width: 0.8 });
            A.arrow(cx, 0, cx + (R * v2[0]) / mag, (R * v2[1]) / mag, { color: col, width: 3, head: 10 });
            A.text(lab, cx, -1.5, { color: col, size: 13, align: 'center' });
          }
          P.path(aL, { color: 'accent', width: 2.4 }); P.path(aS, { color: 'orange', width: 2.4 });
          P.dot(tT, aL.reduce((r, p) => (Math.abs(p[0] - tT) < Math.abs(r[0] - tT) ? p : r))[1], { color: 'accent', r: 5 });
          P.dot(tT, aS.reduce((r, p) => (Math.abs(p[0] - tT) < Math.abs(r[0] - tT) ? p : r))[1], { color: 'orange', r: 5 });
          const slope = (a) => (a[a.length - 1][1] - a[0][1]) / (a[a.length - 1][0] - a[0][0]);
          st = { g, ratio: slope(aS) / slope(aL), fL: (M.CONST.muB * B.value) / M.CONST.h, tT };
        }, { period: 12, still: 12 * 0.6 });
        v.legend([['accent', 'orbital moment ($g_L=1$)'], ['orange', 'spin moment ($g_s$)']]);
        v.readout(() => `$B=${v.fmt(B.value, 3)}$ T: orbit precesses at $\\mu_BB/h=${v.fix(st.fL / 1e9, 3)}$ GHz, spin at $g_s\\,\\mu_BB/h=${v.fix((st.g * st.fL) / 1e9, 3)}$ GHz (fit of the two slopes: $g_s/g_L=${v.fix(st.ratio, 5)}$; input $g_s=${v.fix(st.g, 5)}$).`);
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Method',
      name: 'Addition of angular momenta',
      statement: String.raw`For two angular momenta $\mathbf J_1,\mathbf J_2$ of different systems, the total $\mathbf J=\mathbf J_1+\mathbf J_2$ satisfies the angular momentum algebra, and the $(2j_1+1)(2j_2+1)$-dimensional product space $V_{j_1}\otimes V_{j_2}$ splits into irreducible pieces
$$V_{j_1}\otimes V_{j_2}=\bigoplus_{J=|j_1-j_2|}^{j_1+j_2}V_J ,$$
each $J$ appearing exactly once, in steps of $1$. The quantum number $M$ of $J_z$ is additive, $M=m_1+m_2$, and $J^2$ has eigenvalues $\hbar^2J(J+1)$ on the pieces. Counting dimensions, $\sum_{J}(2J+1)=(2j_1+1)(2j_2+1)$.`,
      idea: String.raw`The product states $|m_1,m_2\rangle$ are eigenstates of $J_z$ with $M=m_1+m_2$; the highest $M=j_1+j_2$ occurs once, so it starts a multiplet with $J=j_1+j_2$. Applying $J_-$ builds that multiplet (qm-7.3); the next lower $M$ occurs twice, one combination already used, so a new multiplet with $J=j_1+j_2-1$ starts, and so on until the counting runs out at $|j_1-j_2|$. Classically the same statement is the vector sum of two vectors with lengths $j_1,j_2$, whose total length ranges over $|j_1-j_2|\le J\le j_1+j_2$.`,
      caption: String.raw`**Choose $j_1$ and $j_2$.** Left: the product basis $|m_1,m_2\rangle$ as a grid of dots; the gold ones lie on the diagonal $m_1+m_2=M$ of your chosen $M$. Right: the total-$J$ multiplets as columns of rungs. Pick an $M$ with the slider: the number of grid dots on the diagonal equals the number of multiplets containing that rung. The readout also diagonalizes $J^2=J_1^2+J_2^2+2\mathbf J_1\cdot\mathbf J_2$ on the whole product space numerically and lists the multiplicities it finds.`,
      deps: ['qm-7.3'],
      refs: ['Griffiths §4.4', 'Sakurai ch. 3'],
      tags: ['angular momentum', 'coupling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Angular_momentum_coupling' },
      viz(v) {
        const SP = v.stage({ x: [-3.7, 3.7], y: [-3.7, 3.7], equal: true, axes: false, height: 340, title: 'product states $|m_1,m_2\\rangle$' });
        const SJ = v.stage({ x: [-0.5, 7.5], y: [-6.7, 6.7], axes: false, height: 340, title: 'coupled multiplets $|J,M\\rangle$' });
        const j1 = v.slider('$j_1$', 0, 3, 1, { step: 0.5 }), j2 = v.slider('$j_2$', 0, 3, 1.5, { step: 0.5 }), Ms = v.slider('highlight $M$', -6, 6, 0.5, { step: 0.5 });
        let cache = { key: '', mult: null };
        const multiplicities = (a, b) => {
          const A = spinOps(a), Bq = spinOps(b), da = A.dim, db = Bq.dim, Ia = eye(da), Ib = eye(db);
          const sq = (S) => madd(madd(mmul(S.Sx, S.Sx), mmul(S.Sy, S.Sy)), mmul(S.Sz, S.Sz));
          const J1 = madd(kron(sq(A), Ib), kron(Ia, sq(Bq)));
          const JJ = madd(madd(kron(A.Sx, Bq.Sx), kron(A.Sy, Bq.Sy)), kron(A.Sz, Bq.Sz));
          const J2 = madd(J1, mscale(JJ, 2)), ev = heig(J2).values, out = new Map();
          for (const e of ev) { const J = Math.round((-1 + Math.sqrt(1 + 4 * e)) ); out.set(J / 2, (out.get(J / 2) || 0) + 1); }
          return out;
        };
        let st = null;
        v.render(() => {
          const a = j1.value, b = j2.value, M = Ms.value, Jmax = a + b, Jmin = Math.abs(a - b);
          const key = `${a}|${b}`; if (cache.key !== key) cache = { key, mult: multiplicities(a, b) };
          const pb = productBasis(a, b), sc = Math.min(1, 3.3 / Math.max(a, b, 0.5)) * 1;
          const mx = Math.max(a, b);
          for (const { m1, m2 } of pb) {
            const Mm = m1 + m2, on = Math.abs(Mm - M) < 1e-9, t = (Mm + Jmax) / (2 * Jmax || 1);
            SP.dot(m1 * (3.3 / (mx || 1)), m2 * (3.3 / (mx || 1)), { r: on ? 8 : 5.5, color: on ? 'gold' : 'accent', alpha: on ? 1 : 0.55 });
          }
          SP.text('$m_1$', 3.5, -0.3, { color: 'muted', size: 13, align: 'center' }); SP.text('$m_2$', 0.3, 3.5, { color: 'muted', size: 13 });
          SP.line(-3.5, 0, 3.5, 0, { color: 'faint', width: 0.8 }); SP.line(0, -3.5, 0, 3.5, { color: 'faint', width: 0.8 });
          if (Math.abs(M) <= Jmax + 1e-9) { const k = 3.3 / (mx || 1); SP.line((M - 3.5 / k * 0 - b) * k, b * k, (a) * k, (M - a) * k, { color: 'gold', width: 1.4, dash: [4, 4] }); }
          let col = 0, count = 0, cnt = 0;
          for (let J = Jmin; J <= Jmax + 1e-9; J += 1) {
            const x = col++;
            SJ.text(`J=${half(J)}`, x, -6.3, { size: 12, align: 'center', color: 'muted' });
            for (let m = -J; m <= J + 1e-9; m += 1) { const on = Math.abs(m - M) < 1e-9; SJ.line(x - 0.35, m, x + 0.35, m, { color: on ? 'gold' : 'orange', width: on ? 4 : 2.2 }); if (on) cnt++; }
          }
          let dimTot = 0; cache.mult.forEach((n, J) => { dimTot += n * (2 * J + 1); });
          const onM = pb.filter(({ m1, m2 }) => Math.abs(m1 + m2 - M) < 1e-9).length;
          st = { dim: pb.length, onM, cnt, mult: [...cache.mult.entries()].sort((x, y) => x[0] - y[0]), sum: (() => { let s = 0; for (let J = Jmin; J <= Jmax + 1e-9; J++) s += 2 * J + 1; return s; })() };
        });
        v.readout(() => `$(2j_1+1)(2j_2+1)=${st.dim}$ and $\\sum_J(2J+1)=${st.sum}$. At $M=${v.fix(Ms.value, 1)}$: ${st.onM} product states $\\leftrightarrow$ ${st.cnt} multiplets. Numerical diagonalization of $J^2$: ${st.mult.map(([J, n]) => `$J=${half(J)}$ ×${n}`).join(', ')}.`);
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15',
      kind: 'Theorem',
      name: 'Clebsch–Gordan coefficients and the triangle rule',
      statement: String.raw`The coupled states are expanded in the product basis,
$$|J,M\rangle=\sum_{m_1+m_2=M}\langle j_1m_1;j_2m_2|J\,M\rangle\;|j_1,m_1\rangle|j_2,m_2\rangle ,$$
with real **Clebsch–Gordan coefficients** (in the Condon–Shortley convention: $\langle j_1j_1;j_2\,J{-}j_1|J\,J\rangle>0$). They vanish unless $m_1+m_2=M$ and unless $J$ satisfies the **triangle rule** $|j_1-j_2|\le J\le j_1+j_2$ with $J-j_1-j_2\in\mathbb Z$. For fixed $M$ they form an orthogonal matrix: $\sum_{m_1m_2}\langle j_1m_1;j_2m_2|JM\rangle\langle j_1m_1;j_2m_2|J'M\rangle=\delta_{JJ'}$ and the transposed relation.`,
      idea: String.raw`The top state $|j_1+j_2,\,j_1+j_2\rangle$ is a single product state; lowering with $J_-=J_{1-}+J_{2-}$ (qm-7.3) produces the rest of that multiplet. Each new highest state $|J,J\rangle$ is the vector in the $M=J$ subspace orthogonal to the higher multiplets already built, fixed in sign by the convention; lowering again fills in the multiplet. Both sets $\{|J,M\rangle\}$ and $\{|m_1,m_2\rangle\}$ are orthonormal bases of the same space, so the transformation is orthogonal; $J_z=J_{1z}+J_{2z}$ is diagonal in both, which is the selection $m_1+m_2=M$.`,
      caption: String.raw`**Choose the pair $(j_1,j_2)$.** The grid is the table of coefficients: rows are product states $|m_1,m_2\rangle$ (sorted by $m_1+m_2$), columns are coupled states $|J,M\rangle$; each non-zero entry is a disc of area $\propto$ modulus (colour: sign, blue positive, orange negative) labelled with its exact value. The entries are produced by *lowering from the top state with the matrices of $J_-$*; the readout compares them with Racah's closed formula and checks orthogonality. The **trial $J$** slider tests the triangle rule: outside the allowed range every coefficient is zero.`,
      deps: ['qm-7.14'],
      refs: ['NIST DLMF34.1.1,34.2.1–5,34.3.16–17; Fitzpatrick §11.3'],
      credit: 'Clebsch–Gordan angular-momentum coupling',
      tags: ['angular momentum', 'Clebsch–Gordan'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clebsch%E2%80%93Gordan_coefficients' },
      viz(v) {
        const pairs = { '1/2,1/2': [0.5, 0.5], '1,1/2': [1, 0.5], '1,1': [1, 1], '3/2,1/2': [1.5, 0.5], '3/2,1': [1.5, 1] };
        const pick = v.select('$(j_1,j_2)$', Object.keys(pairs).map((k) => ({ value: k, label: `$(${k.replace(',', ',\\,')})$` })), '1,1/2');
        const Jt = v.slider('trial $J$ (triangle rule)', 0, 4, 1, { step: 0.5 });
        const T = v.stage({ x: [-2.4, 12], y: [-3.4, 12], equal: true, axes: false, height: 420, title: 'Clebsch–Gordan table (rows $|m_1,m_2\\rangle$, columns $|J,M\\rangle$)', weight: 1.7 });
        const NL = v.stage({ x: [-0.3, 5.3], y: [-1, 1], axes: false, height: 120, title: 'triangle rule for $J$', weight: 1 });
        const wheel = phaseRGB(v);
        let st = null;
        v.render(() => {
          const [a, b] = pairs[pick.value], L = cgByLowering(a, b), n = L.basis.length;
          // order rows by M descending then m1 descending; columns by J descending then M descending
          const rows = L.basis.map((s, i) => ({ ...s, i })).sort((p, q) => (q.m1 + q.m2) - (p.m1 + p.m2) || q.m1 - p.m1);
          const cols = []; for (const J of L.Js) for (let M = J; M >= -J - 1e-9; M -= 1) cols.push({ J, M });
          const A = rows.map((r) => cols.map((c) => [L.vec(c.J, c.M)[r.i], 0]));
          const W = 10;
          const rect = [0, 0, W, W];
          cells(v, T, A, rect, {
            max: 1, tile: 'grid', minR: 0.5,
            text: (z, i, j) => (Math.abs(A[i][j][0]) > 1e-9 ? sqFrac(A[i][j][0]) : null),
            rowLabels: rows.map((r) => `${half(r.m1)},${half(r.m2)}`), colLabels: cols.map((c) => `${half(c.J)},${half(c.M)}`),
          });
          // verification
          let maxd = 0, nonzero = 0, offblock = 0; const C = rows.map((r, ri) => cols.map((c, ci) => { const w = cg(a, r.m1, b, r.m2, c.J, c.M); maxd = Math.max(maxd, Math.abs(w - A[ri][ci][0])); if (Math.abs(A[ri][ci][0]) > 1e-9) nonzero++; if (Math.abs(r.m1 + r.m2 - c.M) > 1e-9 && Math.abs(A[ri][ci][0]) > 1e-9) offblock++; return w; }));
          let orth = 0; for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0; for (let k = 0; k < n; k++) s += A[k][p][0] * A[k][q][0]; orth = Math.max(orth, Math.abs(s - (p === q ? 1 : 0))); }
          // triangle line
          const Jmin = Math.abs(a - b), Jmax = a + b;
          NL.hband(-0.1, 0.1, { color: 'faint', alpha: 0.3 });
          NL.hline(0, { color: 'faint', width: 1 });
          for (let J = 0; J <= 5; J += 0.5) { const ok = J >= Jmin - 1e-9 && J <= Jmax + 1e-9 && Math.abs(J - Jmax - Math.round(J - Jmax)) < 1e-9; NL.dot(J, 0, { r: ok ? 5 : 3, color: ok ? 'green' : 'muted', hollow: !ok }); if (J % 1 === 0) NL.text(String(J), J, -0.5, { align: 'center', size: 11, color: 'muted' }); }
          const Jtr = Jt.value, okT = Jtr >= Jmin - 1e-9 && Jtr <= Jmax + 1e-9 && Math.abs(Jtr - Jmax - Math.round(Jtr - Jmax)) < 1e-9;
          NL.dot(Jtr, 0.55, { r: 7, color: okT ? 'green' : 'red' }); NL.text('trial $J$', Jtr, 0.85, { align: 'center', size: 11, color: okT ? 'green' : 'red' });
          let tw = 0; if (okT) for (let M = -Jtr; M <= Jtr + 1e-9; M++) for (let m1 = -a; m1 <= a + 1e-9; m1++) tw += cg(a, m1, b, M - m1, Jtr, M) ** 2;
          st = { maxd, orth, nonzero, n, offblock, okT, Jtr, tw, Jmin, Jmax, a, b };
        });
        v.readout(() => `lowering vs Racah's formula: max difference $${v.sci(st.maxd, 1)}$; orthogonality $\\|C^{\\mathsf T}C-I\\|_{\\max}=${v.sci(st.orth, 1)}$; ${st.nonzero} non-zero entries of ${st.n * st.n}, of which ${st.offblock} violate $m_1+m_2=M$.\n` +
          `Allowed $J$: $${half(st.Jmin)},\\dots,${half(st.Jmax)}$. Trial $J=${v.fix(st.Jtr, 1)}$: ${st.okT ? `allowed; $\\sum_{M,m_1}|\\langle\\cdot|J M\\rangle|^2=${v.fix(st.tw, 3)}=2J+1$.` : '**forbidden by the triangle rule** — all coefficients vanish.'}`);
      },
    },
    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Theorem',
      name: 'Singlet and triplet states',
      statement: String.raw`Two spins $\tfrac12$ couple to total spin $S=1$ (the **triplet**, three states) and $S=0$ (the **singlet**, one state):
$$|1,1\rangle=|{\uparrow\uparrow}\rangle,\quad|1,0\rangle=\tfrac1{\sqrt2}(|{\uparrow\downarrow}\rangle+|{\downarrow\uparrow}\rangle),\quad|1,-1\rangle=|{\downarrow\downarrow}\rangle,\qquad|0,0\rangle=\tfrac1{\sqrt2}(|{\uparrow\downarrow}\rangle-|{\downarrow\uparrow}\rangle).$$
The triplet states are symmetric and the singlet antisymmetric under exchange of the two spins. The singlet is invariant under any joint rotation $U\otimes U$ (it has total spin zero), and measuring both spins along the *same* axis always gives opposite results, whatever the axis. The triplet states transform among themselves.`,
      idea: String.raw`This is qm-7.14 with $j_1=j_2=\tfrac12$ and the Clebsch–Gordan coefficients of qm-7.15 (all of modulus $1$ or $1/\sqrt2$). The singlet is the only vector orthogonal to the triplet; since $S=0$, $\mathbf S|0,0\rangle=0$ and the rotation operator $e^{-i\theta\mathbf n\cdot\mathbf S}$ acts on it as the identity (qm-7.6). Its perfect anticorrelation along every axis, $\langle\boldsymbol\sigma_1\cdot\mathbf a\;\boldsymbol\sigma_2\cdot\mathbf a\rangle=-1$, follows from the same rotational invariance and is the correlation used in Bell tests (qm-14).`,
      caption: String.raw`**Pick one of the four states**, a rotation axis and angle. Top: the four amplitudes in the basis $\uparrow\uparrow,\uparrow\downarrow,\downarrow\uparrow,\downarrow\downarrow$ before (outline) and after (filled) the *same* rotation $U\otimes U$ of both spins. For the singlet nothing moves; for a triplet state weight moves among the three triplet entries but never to the singlet — the readout tracks the weight in each subspace. Bottom: the correlation $E(\mathbf a,\mathbf a)=\langle\sigma_a\otimes\sigma_a\rangle$ for a measurement axis $\mathbf a$ in the $xz$-plane at angle $\beta$: the singlet is at $-1$ for every $\beta$.`,
      deps: ['qm-7.14', 'qm-7.7'],
      refs: ['Griffiths §4.4'],
      tags: ['spin', 'singlet', 'triplet'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Singlet_state' },
      viz(v) {
        const SA = v.stage({ x: [-0.6, 3.6], y: [0, 1.15], axes: 'box', gutter: true, height: 290, ylabel: 'probability', xticks: [[0, '↑↑'], [1, '↑↓'], [2, '↓↑'], [3, '↓↓']], title: 'amplitudes squared before (outline) and after the joint rotation', weight: 1.3 });
        const SC = v.stage({ x: [0, TAU], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 290, xlabel: 'axis angle $\\beta$', xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], ylabel: '$E(\\mathbf a,\\mathbf a)$', title: 'correlation along the same axis', weight: 1 });
        const sel = v.select('state', [{ value: 's', label: 'singlet $|0,0\\rangle$' }, { value: 'tp', label: '$|1,1\\rangle$' }, { value: 't0', label: '$|1,0\\rangle$' }, { value: 'tm', label: '$|1,-1\\rangle$' }], 't0');
        const pol = v.slider('rotation axis: polar', 0, Math.PI, 1.0, { step: 0.01 }), azi = v.slider('azimuth', -Math.PI, Math.PI, 0.5, { step: 0.01 }), ang = v.slider('rotation angle', 0, TAU, 1.3, { step: 0.01 });
        const beta = v.slider('measurement axis $\\beta$', 0, TAU, 0.8, { step: 0.01 });
        const up = [[1, 0], [0, 0]], dn = [[0, 0], [1, 0]], r2 = Math.SQRT1_2;
        const add = (a, b, k) => a.map((z, i) => [z[0] + k * b[i][0], z[1] + k * b[i][1]]);
        const ket = { tp: kvec(up, up), tm: kvec(dn, dn), t0: add(kvec(up, dn).map((z) => cscale(z, r2)), kvec(dn, up), r2), s: add(kvec(up, dn).map((z) => cscale(z, r2)), kvec(dn, up), -r2) };
        const sigma = (n) => spinAlong({ Sx: SX, Sy: SY, Sz: SZ }, n);
        let st = null;
        v.render(() => {
          const n = [Math.sin(pol.value) * Math.cos(azi.value), Math.sin(pol.value) * Math.sin(azi.value), Math.cos(pol.value)];
          const U1 = propagator(mscale(sigma(n), 0.5), ang.value), UU = kron(U1, U1), psi = ket[sel.value], out = mvec(UU, psi);
          const w = (k) => cabs2(psi[k]), w2 = (k) => cabs2(out[k]);
          for (let k = 0; k < 4; k++) { SA.rect(k - 0.28, 0, k + 0.28, w2(k), { fill: 'accent', fillAlpha: 0.5, stroke: false }); SA.rect(k - 0.28, 0, k + 0.28, w(k), { fill: false, color: 'ink', width: 1.6 }); }
          const sing = ket.s, ovS = cabs2(ip(sing, out)), ovT = 1 - ovS;
          const E = (s, bt) => { const a = [Math.sin(bt), 0, Math.cos(bt)], S = sigma(a), O = kron(S, S); return ip(s, mvec(O, s))[0]; };
          for (const [key, col, al] of [['s', 'green', 1], ['t0', 'muted', 0.6], ['tp', 'muted', 0.6], ['tm', 'muted', 0.6]]) SC.fn((b) => E(ket[key], b), { color: key === sel.value ? 'accent' : col, width: key === sel.value ? 2.6 : 1.4, alpha: key === sel.value ? 1 : al, n: 120 });
          SC.vline(beta.value, { color: 'gold', width: 1.4 }); SC.dot(beta.value, E(psi, beta.value), { color: 'accent', r: 6 });
          st = { ovS, ovT, same: Math.abs(ip(psi, out)[0]), E: E(psi, beta.value), singE: E(ket.s, beta.value), phase: ip(psi, out) };
        });
        v.legend([['accent', 'chosen state'], ['green', 'singlet', { dash: false }], ['muted', 'other triplet states']]);
        v.readout(() => `after $U\\otimes U$: weight in the singlet $=${v.fix(st.ovS, 6)}$, in the triplet $=${v.fix(st.ovT, 6)}$; overlap with the original state $\\langle\\psi|U\\otimes U|\\psi\\rangle=${texC(v, st.phase, 4)}$.\n$E(\\mathbf a,\\mathbf a)$ for the chosen state $=${v.fix(st.E, 4)}$; for the singlet $${v.fix(st.singE, 4)}$ at every $\\beta$.`);
      },
    },
    // ------------------------------------------------------------------ 7.17
    {
      num: '7.17',
      kind: 'Theorem',
      name: 'Wigner–Eckart theorem',
      statement: String.raw`Let $T^{(k)}_q$ ($q=-k,\dots,k$) be the components of a **spherical tensor operator** of rank $k$, i.e. transforming under rotations like $Y_k^q$ (a scalar for $k=0$, a vector for $k=1$). Then the matrix elements between angular-momentum eigenstates factor as
$$\langle\alpha',j',m'|T^{(k)}_q|\alpha,j,m\rangle=\langle j\,m;k\,q|j'\,m'\rangle\;\frac{\langle\alpha'j'\|T^{(k)}\|\alpha j\rangle}{\sqrt{2j'+1}} :$$
the dependence on the magnetic quantum numbers $m,q,m'$ is entirely in the Clebsch–Gordan coefficient (geometry), while the **reduced matrix element** $\langle\alpha'j'\|T\|\alpha j\rangle$ carries the dynamics and is independent of $m,q,m'$. In particular the matrix element vanishes unless $m'=m+q$ and $|j-k|\le j'\le j+k$.`,
      idea: String.raw`Because $T_q^{(k)}|j,m\rangle$ transforms under rotations exactly like the product $|k,q\rangle|j,m\rangle$ (qm-7.6), it lies in the space $V_k\otimes V_j$ of qm-7.14, and projecting it on $V_{j'}$ gives a multiple of the Clebsch–Gordan state $|j',m'\rangle$ of qm-7.15: the same multiple for every $m,q$, since any rotation moves all of them together. The multiple is the reduced element divided by $\sqrt{2j\prime+1}$ in the convention displayed above. All the $m$-dependence of every dipole transition rate is thus computable once and for all.`,
      caption: String.raw`**Choose the pair of multiplets $(l\to l')$ and the operator** — the components of the unit vector $\hat{\mathbf r}$ (rank 1), of $\sqrt{4\pi/5}Y_2^q$ (rank 2), or a *mixture* of rank 1 and rank 3 ($\hat r_q+0.9\,T^{(3)}_q$), which is not a single tensor. Ranks 1 and 3 have the same parity, so for $1\to2$ both contribute; the rank-2 operator connects only multiplets with $l+l'$ even. The top bars are the angular matrix elements $\langle Y_{l'}^{m'}|T_q|Y_l^m\rangle$ computed by quadrature on the sphere; the middle bars are the Clebsch–Gordan coefficients of rank 1 (or 2 for the second operator); the bottom dots are their ratio. For a true tensor operator the dots lie on one horizontal line (the reduced element divided by $\sqrt{2l'+1}$); the mixture breaks it (the ratio is taken against the rank-1 coefficients), and parity-forbidden pairs give zero.`,
      deps: ['qm-7.15'],
      refs: ['MIT5.73 Lecture27,complete spherical-tensor formulation and applications'],
      credit: 'Wigner–Eckart factorization',
      tags: ['angular momentum', 'selection rules', 'tensor operators'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wigner%E2%80%93Eckart_theorem' },
      viz(v) {
        const pairSel = v.select('$(l\\to l\')$', [{ value: '1,2', label: '$1\\to2$' }, { value: '1,0', label: '$1\\to0$' }, { value: '2,3', label: '$2\\to3$' }, { value: '1,1', label: '$1\\to1$' }, { value: '2,2', label: '$2\\to2$' }], '1,2');
        const op = v.select('operator', [{ value: '1', label: 'rank 1: $\\hat{\\mathbf r}$' }, { value: '2', label: 'rank 2: $\\sqrt{4\\pi/5}Y_2^q$' }, { value: 'mix', label: 'mixture of ranks 1 and 3' }], '1');
        const SA = v.stage({ x: [-0.7, 16.7], y: [-1, 1], axes: 'box', gutter: true, height: 190, ylabel: '$\\langle Y_{l\'}^{m\'}|T_q|Y_l^m\\rangle$', title: 'matrix elements (by quadrature)', full: true });
        const SB = v.stage({ x: [-0.7, 16.7], y: [-1, 1], axes: 'box', gutter: true, height: 190, ylabel: '$\\langle lm;kq|l\'m\'\\rangle$', title: 'Clebsch–Gordan coefficients of rank $k$ ($k=1$ for the mixture)', full: true });
        const SC = v.stage({ x: [-0.7, 16.7], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 190, ylabel: 'ratio', xlabel: 'index of $(m,q)$', title: 'ratio matrix element / CG', full: true });
        const cache = new Map();
        let st = null;
        v.render(() => {
          const [l, lp] = pairSel.value.split(',').map(Number), o = op.value, k = o === '2' ? 2 : 1;
          const key = `${l}|${lp}|${o}`;
          if (!cache.has(key)) {
            const T = (q) => (th, ph) => {
              const t1 = ylm(1, q, th, ph).map((z) => z * Math.sqrt((4 * Math.PI) / 3)), t2 = o === '2' ? (Math.abs(q) <= 2 ? ylm(2, q, th, ph).map((z) => z * Math.sqrt((4 * Math.PI) / 5)) : [0, 0]) : (Math.abs(q) <= 3 ? ylm(3, q, th, ph).map((z) => z * Math.sqrt((4 * Math.PI) / 7)) : [0, 0]);
              if (o === '1') return t1; if (o === '2') return t2; return [t1[0] + 0.9 * t2[0], t1[1] + 0.9 * t2[1]];
            };
            const rows = [];
            for (let q = -3; q <= 3; q++) { if ((o === '1' && Math.abs(q) > 1) || (o === '2' && Math.abs(q) > 2)) continue; for (let m = -l; m <= l; m++) { const mp = m + q; if (Math.abs(mp) > lp) continue;
              const f = (th, ph) => { const y = ylm(l, m, th, ph), t = T(q)(th, ph); return [t[0] * y[0] - t[1] * y[1], t[0] * y[1] + t[1] * y[0]]; };
              const me = sphereIP(f, (th, ph) => ylm(lp, mp, th, ph), 36, 72), c = cg(l, m, k, q, lp, mp);
              rows.push({ m, q, mp, me: me[0], im: me[1], c }); } }
            cache.set(key, rows);
          }
          const rows = cache.get(key), mx = Math.max(0.3, ...rows.map((r) => Math.abs(r.me)));
          const mc = Math.max(0.3, ...rows.map((r) => Math.abs(r.c)));
          const xr = [-0.7, Math.max(rows.length, 3) - 0.3]; SA.setView(xr, [-1.05, 1.05]); SB.setView(xr, [-1.05, 1.05]);
          { const mm = rows.filter((r) => Math.abs(r.c) > 1e-9).map((r) => r.me / r.c), mu = mm.length ? mm.reduce((a, b) => a + b, 0) / mm.length : 0; SC.setView(xr, [Math.min(-1.5, mu - 1.2), Math.max(1.5, mu + 1.2)]); SC.hline(mu, { color: 'green', width: 1, dash: [4, 4] }); }
          rows.forEach((r, i) => {
            SA.rect(i - 0.35, 0, i + 0.35, r.me, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 });
            SB.rect(i - 0.35, 0, i + 0.35, r.c, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
            if (Math.abs(r.c) > 1e-9) SC.dot(i, r.me / r.c, { color: 'green', r: 5 });
            SA.text(`${r.m},${r.q}`, i, -0.92, { size: 9.5, align: 'center', color: 'muted' });
          });
          
          const rat = rows.filter((r) => Math.abs(r.c) > 1e-9).map((r) => r.me / r.c);
          const mean = rat.length ? rat.reduce((a, b) => a + b, 0) / rat.length : 0, spread = rat.length ? Math.max(...rat.map((x) => Math.abs(x - mean))) : 0;
          const maxMe = Math.max(0, ...rows.map((r) => Math.abs(r.me)));
          
          st = { n: rows.length, mean, spread, maxMe, l, lp, k, o, imMax: Math.max(0, ...rows.map((r) => Math.abs(r.im))) };
        });
        v.readout(() => st.maxMe < 1e-6 ? `$l=${st.l}\\to l'=${st.lp}$: every matrix element vanishes (parity / triangle selection rule: $|l-k|\\le l'\\le l+k$ fails, or $l+k+l'$ is odd) — no reduced element to compare.` :
          `${st.n} matrix elements; ratio (matrix element)/(CG) has mean $${v.fix(st.mean, 4)}$ (reduced element divided by $\\sqrt{2l'+1}$) and maximal deviation $${v.sci(st.spread, 1)}$ ${st.o === 'mix' ? '— **not constant**: the operator is not a spherical tensor of a single rank.' : '— constant up to quadrature error.'}`);
      },
    },
  ],
};
