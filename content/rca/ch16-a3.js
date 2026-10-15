// Rudin, Real and Complex Analysis — Chapter 16 (part 3): the modular group, the modular function λ, Picard's theorem

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const mixRGB = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
// Möbius map of a 2×2 integer matrix [a,b,c,d] applied to z = [x,y]
const mob = (m, z) => cdiv([m[0] * z[0] + m[1], m[0] * z[1]], [m[2] * z[0] + m[3], m[2] * z[1]]);
const mmul = (p, q) => [p[0] * q[0] + p[1] * q[2], p[0] * q[1] + p[1] * q[3], p[2] * q[0] + p[3] * q[2], p[2] * q[1] + p[3] * q[3]];
const minv = (m) => [m[3], -m[1], -m[2], m[0]];
const SIG = [1, 0, 2, 1], SIGI = [1, 0, -2, 1], TAU2 = [1, 2, 0, 1], TAU2I = [1, -2, 0, 1];
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), d)}\\,i`;
const matTeX = (m) => `\\begin{pmatrix}${m[0]}&${m[1]}\\\\${m[2]}&${m[3]}\\end{pmatrix}`;

// Reduce z ∈ Π⁺ into Rudin's region Q = {−1 ≤ Re z < 1, |2z+1| ≥ 1, |2z−1| > 1} by τ^{±1}: z ↦ z ± 2 and
// σ^{±1}: z ↦ z/(±2z+1); every σ-step strictly increases Im z. Returns ψ = [a,b,c,d] ∈ Γ with ψ(z) ∈ Q.
function reduceQ(x, y, maxIt = 400, path = null) {
  let a = 1, b = 0, c = 0, d = 1, sig = 0;
  for (let it = 0; it < maxIt; it++) {
    const k = Math.floor((x + 1) / 2);
    if (k !== 0) { x -= 2 * k; a -= 2 * k * c; b -= 2 * k * d; if (path) path.push([x, y, k === 1 ? 'τ⁻¹' : k === -1 ? 'τ' : `τ^${-k}`]); }
    const p = (2 * x + 1) ** 2 + 4 * y * y, m = (2 * x - 1) ** 2 + 4 * y * y;
    if (p < 1) { const dr = 2 * x + 1, di = 2 * y, D = dr * dr + di * di; const nx = (x * dr + y * di) / D; y = (y * dr - x * di) / D; x = nx; c += 2 * a; d += 2 * b; sig++; if (path) path.push([x, y, 'σ']); }
    else if (m <= 1) { const dr = 1 - 2 * x, di = -2 * y, D = dr * dr + di * di; const nx = (x * dr + y * di) / D; y = (y * dr - x * di) / D; x = nx; c -= 2 * a; d -= 2 * b; sig++; if (path) path.push([x, y, 'σ⁻¹']); }
    else return { x, y, m: [a, b, c, d], sig, ok: true };
  }
  return { x, y, m: [a, b, c, d], sig, ok: false };
}
// Euclidean distance from a point of Q to ∂Q (used to draw tile edges at constant pixel width)
const distQ = (x, y) => Math.min(x + 1, 1 - x, Math.abs(Math.hypot(x + 0.5, y) - 0.5), Math.abs(Math.hypot(x - 0.5, y) - 0.5));
// Reduce into the standard fundamental domain F = {|Re z| ≤ 1/2, |z| ≥ 1} of the full modular group (T: z+1, S: −1/z)
function reduceF(x, y, maxIt = 400) {
  let a = 1, b = 0, c = 0, d = 1;
  for (let it = 0; it < maxIt; it++) {
    const n = Math.round(x);
    if (n !== 0) { x -= n; a -= n * c; b -= n * d; }
    const r2 = x * x + y * y;
    if (r2 < 1 - 1e-12) { x = -x / r2; y = y / r2; [a, b, c, d] = [-c, -d, a, b]; } else return { x, y, m: [a, b, c, d], ok: true };
  }
  return { x, y, m: [a, b, c, d], ok: false };
}

// Classical λ(τ) = 16q∏… = (θ₂/θ₃)⁴ with q = e^{iπτ}: reduce τ by T and S into the SL₂(Z) domain while recording
// λ(τ+1) = λ/(λ−1) and λ(−1/τ) = 1−λ, evaluate the fast-converging theta series there, then undo the steps.
function lamClassical(x, y) {
  const ops = [];
  for (let it = 0; it < 400; it++) {
    const n = Math.round(x);
    if (n !== 0) { x -= n; if (n & 1) ops.push(1); }
    const r2 = x * x + y * y;
    if (r2 < 1 - 1e-13) { x = -x / r2; y = y / r2; ops.push(2); } else break;
    if (it === 399) return [NaN, NaN];
  }
  const m = Math.exp(-Math.PI * y), qr = m * Math.cos(Math.PI * x), qi = m * Math.sin(Math.PI * x);
  let Ar = 0, Ai = 0, Br = 1, Bi = 0;
  for (let n = 0; n < 6; n++) {
    const e1 = n * (n + 1), a1 = Math.pow(m, e1), t1 = Math.PI * x * e1; Ar += a1 * Math.cos(t1); Ai += a1 * Math.sin(t1);
    if (n > 0) { const e2 = n * n, a2 = Math.pow(m, e2), t2 = Math.PI * x * e2; Br += 2 * a2 * Math.cos(t2); Bi += 2 * a2 * Math.sin(t2); }
  }
  const D = Br * Br + Bi * Bi, dr = (Ar * Br + Ai * Bi) / D, di = (Ai * Br - Ar * Bi) / D;
  const sr = dr * dr - di * di, si = 2 * dr * di, fr = sr * sr - si * si, fi = 2 * sr * si;
  let wr = 16 * (fr * qr - fi * qi), wi = 16 * (fr * qi + fi * qr);
  for (let k = ops.length - 1; k >= 0; k--) {
    if (ops[k] === 1) { const ar = wr - 1, D2 = ar * ar + wi * wi; const nr = (wr * ar + wi * wi) / D2, ni = (wi * ar - wr * wi) / D2; wr = nr; wi = ni; }
    else { wr = 1 - wr; wi = -wi; }
  }
  return [wr, wi];
}
// Rudin's normalisation: λ(0)=0, λ(1)=1, λ(∞)=∞ at the cusps of Q, i.e. λ = 1 − 1/λ_classical.
function lamR(x, y) {
  const [a, b] = lamClassical(x, y); const d = a * a + b * b;
  if (!isFinite(d)) return [NaN, NaN];
  if (d === 0) return [Infinity, Infinity];
  return [1 - a / d, b / d];
}
// Solve λ(τ) = w by Newton's method from τ (complex derivative by central differences).
function lamNewton(t, w, it = 14) {
  let [x, y] = t;
  for (let k = 0; k < it; k++) {
    const vv = lamR(x, y), h = 1e-6 * y;
    const vp = lamR(x + h, y), vm = lamR(x - h, y);
    const step = cdiv([vv[0] - w[0], vv[1] - w[1]], [(vp[0] - vm[0]) / (2 * h), (vp[1] - vm[1]) / (2 * h)]);
    if (!isFinite(step[0]) || !isFinite(step[1])) break;
    x -= step[0]; const ny = y - step[1]; y = ny > 0 ? ny : y * 0.3;
    if (Math.hypot(step[0], step[1]) < 1e-13 * (1 + Math.hypot(x, y))) break;
  }
  const vv = lamR(x, y);
  return { t: [x, y], err: Math.hypot(vv[0] - w[0], vv[1] - w[1]) / (1 + Math.hypot(w[0], w[1])) };
}
// the point of Q with λ = w (λ is one-to-one on Q)
function lamInverseQ(w) {
  let best = null, be = Infinity;
  for (let i = 0; i <= 40; i++) for (let j = 1; j <= 48; j++) {
    const x = -1 + 2 * i / 40, y = 0.015 + 2.6 * (j / 48) ** 1.6;
    if ((2 * x + 1) ** 2 + 4 * y * y < 1 || (2 * x - 1) ** 2 + 4 * y * y < 1) continue;
    const vv = lamR(x, y); const e = Math.hypot(vv[0] - w[0], vv[1] - w[1]) / (1 + Math.hypot(w[0], w[1]));
    if (e < be) { be = e; best = [x, y]; }
  }
  return lamNewton(best, w, 30);
}
// tile colours for the Γ-tessellation (halves of each tile alternate; Q itself stronger; edges darker)
function gammaTiles(v, S, opts = {}) {
  const BG = v.rgb('panel'), A = v.rgb('accent'), Tl = v.rgb('teal'), INK = v.rgb('ink'), G = v.rgb('gold');
  const cA = mixRGB(BG, A, 0.16), cB = mixRGB(BG, Tl, 0.16), qA = mixRGB(BG, A, 0.42), qB = mixRGB(BG, Tl, 0.42), edge = mixRGB(BG, INK, 0.55);
  const px = (S.bounds.x[1] - S.bounds.x[0]) / S.width;
  S.raster((x, y) => {
    if (y <= 0) return null;
    const r = reduceQ(x, y); if (!r.ok) return mixRGB(BG, INK, 0.25);
    const m = r.m, cz2 = (m[2] * x + m[3]) ** 2 + (m[2] * y) ** 2;
    if (distQ(r.x, r.y) * cz2 < px * 1.1) return edge;
    const isQ = m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1;
    if (opts.highlight && opts.highlight(m)) return mixRGB(BG, G, r.x < 0 ? 0.42 : 0.55);
    return isQ ? (r.x < 0 ? qA : qB) : (r.x < 0 ? cA : cB);
  }, { key: `tiles|${opts.key || ''}`, id: opts.id || 'tiles', res: opts.res || 1 });
}
// boundary of Q as polylines (for outlines)
function qBoundary(top = 3) {
  const L = [], R = [], C1 = [], C2 = [];
  for (let k = 0; k <= 60; k++) { const yy = top * k / 60; L.push([-1, yy]); R.push([1, yy]); }
  for (let k = 0; k <= 90; k++) { const t = Math.PI * k / 90; C1.push([-0.5 + 0.5 * Math.cos(t), 0.5 * Math.sin(t)]); C2.push([0.5 + 0.5 * Math.cos(t), 0.5 * Math.sin(t)]); }
  return { L, R, C1, C2 };
}

export default {
  collection: 'rca',
  chapter: 16,
  items: [
    // ------------------------------------------------------------------ 16.16
    {
      num: '16.16',
      kind: 'Definition',
      name: 'The modular group; modular functions',
      verify: true,
      statement: String.raw`The **modular group** $G$ is the set of all linear fractional transformations
$$\varphi(z)=\frac{az+b}{cz+d}\qquad(a,b,c,d\in\Z,\ ad-bc=1).$$
Since $\Im\varphi(z)=\Im z/|cz+d|^2$, each $\varphi\in G$ maps the upper half-plane $\Pi^+$ onto itself, and $G$ is a group under composition. A **modular function** is a function holomorphic (or meromorphic) in $\Pi^+$ that is invariant under $G$, or at least under a nontrivial subgroup $\Gamma$ of $G$: $f\circ\varphi=f$ for every $\varphi\in\Gamma$.`,
      idea: String.raw`With integer entries and determinant $1$, the inverse $(dz-b)/(-cz+a)$ and every composition again have the same form, so $G$ is a group. The formula $\Im\varphi(z)=\Im z/|cz+d|^2$ follows from $\varphi(z)-\overline{\varphi(z)}=(z-\bar z)/|cz+d|^2$. The group is generated by $T(z)=z+1$ and $S(z)=-1/z$, and the translates of $F=\{|\Re z|\le\tfrac12,\ |z|\ge1\}$ tile $\Pi^+$. Rudin works with a subgroup $\Gamma$ of $G$ and a larger region $Q$ (16.18).`,
      caption: String.raw`The upper half-plane tiled by the images $\varphi(F)$, $\varphi\in G$, of the shaded region $F$. Each tile is split into two halves of different colours, and the tiles crowd toward every rational point of the real axis. Build $\varphi$ from the generators with the buttons; $\varphi(F)$ is drawn in gold. Drag $z$: the readout checks $ad-bc=1$ and $\Im\varphi(z)=\Im z/|cz+d|^2$.`,
      deps: [],
      tags: ['modular group', 'Möbius transformations'],
      viz(v) {
        const M = v.M;
        let mat = [1, 0, 1, 1], word = ['T', 'S', 'T'];
        const Tm = [1, 1, 0, 1], Ti = [1, -1, 0, 1], Sm = [0, -1, 1, 0];
        const apply = (g, name) => { mat = mmul(g, mat); word.unshift(name); if (word.length > 14) word = word.slice(0, 14); };
        v.button('apply $T: z\\mapsto z+1$', () => apply(Tm, 'T'));
        v.button('apply $T^{-1}$', () => apply(Ti, 'T⁻¹'));
        v.button('apply $S: z\\mapsto -1/z$', () => apply(Sm, 'S'));
        v.button('reset $\\varphi=\\mathrm{id}$', () => { mat = [1, 0, 0, 1]; word = []; });
        const S = v.stage({ x: [-2.3, 2.3], y: [-0.14, 2.0], equal: true, height: 380, ticks: true, title: 'the tessellation of $\\Pi^+$ by $\\{\\varphi(F):\\varphi\\in G\\}$' });
        const z = S.handle(0.22, 1.35, { color: 'accent', label: 'z', constrain: (x, y) => [x, Math.max(0.03, y)] });
        let st = null;
        v.legend([['accent', 'the region $F$', { area: true }], ['gold', '$\\varphi(F)$', { area: true }], ['ink', 'tile edges']]);
        v.render(() => {
          const BG = v.rgb('panel'), A = v.rgb('accent'), Tl = v.rgb('teal'), INK = v.rgb('ink'), Gd = v.rgb('gold');
          const px = (S.bounds.x[1] - S.bounds.x[0]) / S.width;
          const key = mat.join(',');
          S.raster((x, y) => {
            if (y <= 0) return null;
            const r = reduceF(x, y); if (!r.ok) return mixRGB(BG, INK, 0.25);
            const m = r.m, cz2 = (m[2] * x + m[3]) ** 2 + (m[2] * y) ** 2;
            const dist = Math.min(0.5 - Math.abs(r.x), Math.hypot(r.x, r.y) - 1);
            if (dist * cz2 < px * 1.1) return mixRGB(BG, INK, 0.5);
            const inv = minv(m); // the tile of this pixel is inv(F)
            const isF = m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1;
            const isPhi = (inv[0] === mat[0] && inv[1] === mat[1] && inv[2] === mat[2] && inv[3] === mat[3]) || (inv[0] === -mat[0] && inv[1] === -mat[1] && inv[2] === -mat[2] && inv[3] === -mat[3]);
            if (isPhi) return mixRGB(BG, Gd, r.x < 0 ? 0.5 : 0.65);
            if (isF) return mixRGB(BG, A, r.x < 0 ? 0.32 : 0.45);
            return mixRGB(BG, r.x < 0 ? A : Tl, 0.13);
          }, { key, res: 1 });
          S.hline(0, { color: 'ink', width: 1.2 });
          const zz = [z.x, z.y], w = mob(mat, zz);
          if (Math.abs(w[0]) < 3 && w[1] < 2.3) { S.line(zz[0], zz[1], w[0], w[1], { color: 'gold', width: 1.2, dash: [4, 4] }); S.dot(w[0], w[1], { color: 'gold', r: 5.5, label: 'φ(z)', labelPos: 'ne' }); }
          S.tex('F', 0.33, 1.75, { color: 'accent', size: 18 });
          S.corner(`φ = ${word.length ? word.join(' ∘ ') : 'id'}`, 'tl', { weight: 600 });
          st = { m: mat.slice(), zz, w };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const [a, b, c, d] = s.m; const den = (c * s.zz[0] + d) ** 2 + (c * s.zz[1]) ** 2;
          const lin = (p, q) => { const zp = p === 0 ? '' : p === 1 ? 'z' : p === -1 ? '-z' : `${p}z`; if (!zp) return `${q}`; return q === 0 ? zp : `${zp} ${q < 0 ? '-' : '+'} ${Math.abs(q)}`; };
          return `$\\varphi(z) = \\dfrac{${lin(a, b)}}{${lin(c, d)}}$ $\\big(a,b,c,d = ${a},${b},${c},${d}\\big)$, $\\;ad-bc = ${a * d - b * c}$. At $z = ${fmtC(v, s.zz, 2)}$: $\\Im\\varphi(z) = ${v.fix(s.w[1], 4)}$ and $\\Im z/|cz+d|^2 = ${v.fix(s.zz[1] / den, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 16.18
    {
      num: '16.18',
      kind: 'Theorem',
      name: 'The group Γ and its fundamental region Q',
      verify: true,
      statement: String.raw`Let $\Gamma$ be the subgroup of $G$ generated by $\sigma(z)=\dfrac{z}{2z+1}$ and $\tau(z)=z+2$, and let $Q$ be the set of $z\in\Pi^+$ with
$$-1\le\Re z<1,\qquad |2z+1|\ge1,\qquad |2z-1|>1 .$$
Then:
(a) if $\varphi_1,\varphi_2\in\Gamma$ and $\varphi_1\ne\varphi_2$, then $\varphi_1(Q)\cap\varphi_2(Q)=\emptyset$;
(b) $\bigcup_{\varphi\in\Gamma}\varphi(Q)=\Pi^+$;
(c) $\Gamma$ contains every $\varphi\in G$ for which $a$ and $d$ are odd and $b$ and $c$ are even.`,
      idea: String.raw`For (b), the matrices with $a,d$ odd and $b,c$ even form a group $\Gamma_1\supset\Gamma$. Given $w\in\Pi^+$, the quantity $\Im\varphi(w)=\Im w/|cw+d|^2$ attains a maximum over $\varphi\in\Gamma$, because only finitely many pairs $(c,d)$ make $|cw+d|\le1$. At a maximiser, applying $\tau^{\pm1}$ and $\sigma^{\pm1}$ cannot raise $\Im$ any further, and that forces $\varphi(w)\in Q$. For (a), one shows that $\varphi(Q)\cap Q\ne\emptyset$ with $\varphi\in\Gamma_1$ forces $\varphi=\mathrm{id}$, by comparing $|cz+d|$ for $z\in Q$. Then (c) follows: for $\varphi\in\Gamma_1$ choose $\psi\in\Gamma$ with $\psi(\varphi(z_0))\in Q$ for some $z_0\in Q$; (a), applied in $\Gamma_1$, gives $\psi\circ\varphi=\mathrm{id}$.`,
      caption: String.raw`The tiles are the images $\varphi(Q)$, $\varphi\in\Gamma$; $Q$ itself is shaded more strongly, and every tile consists of two halves. Drag $z$: the gold path is the reduction algorithm from the proof of (b). It translates by $\tau^{\pm1}$ into $-1\le\Re z<1$, and applies $\sigma^{\pm1}$ whenever the point lies under one of the two semicircles. Each $\sigma$-step raises $\Im z$, until the point lands in $Q$. The readout gives the $\varphi\in\Gamma$ with $z\in\varphi(Q)$ and checks the parities in (c). The toggle shows the orbit $\{\varphi(z_Q)\}$ of the reduced point: exactly one point per tile, as (a) and (b) say.`,
      deps: ['rca-16.16'],
      tags: ['modular group', 'fundamental domain'],
      viz(v) {
        const M = v.M;
        const orbitT = v.toggle('show the $\\Gamma$-orbit of the reduced point', true);
        const S = v.stage({ x: [-2.4, 2.4], y: [-0.04, 1.75], equal: true, height: 340, title: 'the tiles $\\varphi(Q)$, $\\varphi\\in\\Gamma$' });
        const z = S.handle(0.37, 0.06, { color: 'accent', label: 'z', labelPos: 'ne', constrain: (x, y) => [x, Math.max(0.004, y)] });
        // words in σ^{±1}, τ^{±1} up to length 7 (as matrices, deduplicated up to sign)
        const words = (() => {
          const seen = new Map(); let front = [[1, 0, 0, 1]]; seen.set('1,0,0,1', [1, 0, 0, 1]);
          for (let L = 0; L < 7; L++) {
            const nxt = [];
            for (const m of front) for (const g of [SIG, SIGI, TAU2, TAU2I]) {
              const p = mmul(g, m); const s = p[0] < 0 || (p[0] === 0 && p[2] < 0) ? p.map((u) => -u) : p; const k = s.join(',');
              if (!seen.has(k)) { seen.set(k, s); nxt.push(s); }
            }
            front = nxt;
          }
          return [...seen.values()];
        })();
        let st = null;
        v.legend([['accent', '$Q$ (two halves)', { area: true }], ['gold', 'reduction path $z\\to Q$'], ['green', 'orbit of the reduced point', { dot: true }]]);
        v.render(() => {
          gammaTiles(v, S, { key: 'Q' });
          S.hline(0, { color: 'ink', width: 1.2 });
          const B = qBoundary(3);
          for (const P of [B.L, B.R, B.C1, B.C2]) S.path(P, { color: 'accent', width: 2.2 });
          const path = [[z.x, z.y]]; const r = reduceQ(z.x, z.y, 400, path);
          if (orbitT.value && r.ok) {
            const pts = [];
            for (const m of words) { const q = mob(m, [r.x, r.y]); if (q[1] > 0.004 && Math.abs(q[0]) < 2.4 && q[1] < 1.9) pts.push(q); }
            S.dots(pts, { color: 'green', r: 2.6 });
          }
          S.path(path, { color: 'panel', width: 5 });
          S.path(path, { color: 'gold', width: 2.2 });
          path.forEach((q, k) => { if (k > 0) { S.dot(q[0], q[1], { color: 'gold', r: 3.5 }); const p0 = path[k - 1]; S.arrow(p0[0], p0[1], p0[0] + (q[0] - p0[0]) * 0.55, p0[1] + (q[1] - p0[1]) * 0.55, { color: 'gold', width: 2.2, head: 9 }); S.text(q[2], (p0[0] + q[0]) / 2, (p0[1] + q[1]) / 2, { color: 'ink', size: 14, dx: 8, dy: -10, math: true }); } });
          if (r.ok) S.dot(r.x, r.y, { color: 'gold', r: 6, label: 'ψ(z) ∈ Q', labelPos: 'ne' });
          S.tex('Q', 0.0, 1.5, { color: 'accent', size: 18 });
          st = { r, path, z: [z.x, z.y] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.r.ok) return 'The point is too close to the real axis for the reduction to finish.';
          const phi = minv(s.r.m).map((u) => u);
          const ims = s.path.filter((q, k) => k === 0 || q[1] !== s.path[k - 1][1]).map((q) => v.fix(q[1], 3));
          return `$z\\in\\varphi(Q)$ with $\\varphi = ${matTeX(phi)}$: $a,d$ odd and $b,c$ even, $ad-bc=${phi[0] * phi[3] - phi[1] * phi[2]}$. Along the reduction, $\\Im$ grows: ${ims.slice(0, 9).map((u) => `$${u}$`).join(' → ')}${ims.length > 9 ? ' → …' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 16.19
    {
      num: '16.19',
      kind: 'Theorem',
      name: 'The modular function λ',
      verify: true,
      statement: String.raw`With $\Gamma$ and $Q$ as in 16.18, there is a function $\lambda\in H(\Pi^+)$ such that
(a) $\lambda\circ\varphi=\lambda$ for every $\varphi\in\Gamma$;
(b) $\lambda$ is one-to-one on $Q$;
(c) the range of $\lambda$ is $\Omega=\C\setminus\{0,1\}$;
(d) $\lambda$ has the real axis as its natural boundary: it has no holomorphic extension to any region properly containing $\Pi^+$.`,
      idea: String.raw`Let $Q_0$ be the right half of $Q$, a curvilinear triangle with vertices $0,1,\infty$ (all angles zero). The Riemann mapping theorem (14.8) gives a conformal map $h$ of $Q_0$ onto $\Pi^+$. It extends to the boundary (14.19) with $h(0)=0$, $h(1)=1$, $h(\infty)=\infty$, so it is real on $\partial Q_0$. The reflection principle (11.14) across the imaginary axis gives $\lambda(-\bar z)=\overline{\lambda(z)}$, which extends $h$ to $Q$. Further reflections across the semicircles and the lines $\Re z=\pm1$ continue it to all of $\Pi^+$, and the result satisfies $\lambda\circ\sigma=\lambda$ and $\lambda\circ\tau=\lambda$. The left half of $Q$ goes to the lower half-plane and the boundary arcs to the three real intervals, which gives (b) and (c). For (d), $\lambda$ takes each of its values near every real point, because the tiles crowd there.`,
      caption: String.raw`Left: a phase portrait of $\lambda$ (computed from theta functions, normalised so that $\lambda\to0,1,\infty$ at the cusps $0,1,\infty$ of $Q_0$), with the $\Gamma$-tiles faintly outlined. The same picture repeats in every tile, and it crowds toward the real axis, the natural boundary. The boundary arcs of $Q$ are coloured by where $\lambda$ sends them: the imaginary axis to $(-\infty,0)$, the semicircles to $(0,1)$, the lines $\Re z=\pm1$ to $(1,\infty)$. Drag $z$ and switch on its orbit. Right: the value $w=\lambda(z)$ in $\Omega=\C\setminus\{0,1\}$. Every orbit point has the same value, and $0$ and $1$ are never hit.`,
      deps: ['rca-16.18', 'rca-14.8', 'rca-14.19', 'rca-11.14'],
      tags: ['modular function', 'reflection principle', 'natural boundary'],
      viz(v) {
        const M = v.M;
        const orbitT = v.toggle('show the orbit $\\varphi(z)$, $\\varphi\\in\\Gamma$', true);
        const S = v.stage({ x: [-1.25, 1.25], y: [-0.02, 1.8], equal: true, height: 330, ticks: true, weight: 1.15, title: 'phase portrait of $\\lambda$ on $\\Pi^+$' });
        const W = v.stage({ x: [-2.2, 3.2], y: [-2.1, 2.1], equal: true, height: 330, ticks: true, weight: 1, title: '$w=\\lambda(z)$ in $\\Omega=\\C\\setminus\\{0,1\\}$' });
        const z = S.handle(0.62, 0.78, { color: 'gold', label: 'z', labelPos: 'ne', constrain: (x, y) => [x, Math.max(0.01, y)] });
        const orbitM = (() => { const out = []; const seen = new Set(['1,0,0,1']); let front = [[1, 0, 0, 1]]; for (let L = 0; L < 5; L++) { const nx = []; for (const m of front) for (const g of [SIG, SIGI, TAU2, TAU2I]) { const p = mmul(g, m); const s = p[0] < 0 ? p.map((u) => -u) : p; const k = s.join(','); if (!seen.has(k)) { seen.add(k); nx.push(s); out.push(s); } } front = nx; } return out; })();
        let st = null;
        v.legend([['orange', 'imaginary axis $\\leftrightarrow(-\\infty,0)$'], ['purple', 'semicircles $\\leftrightarrow(0,1)$'], ['teal', '$\\Re z=\\pm1\\leftrightarrow(1,\\infty)$'], ['red', 'omitted values $0,1$'], ['gold', '$z$, its orbit, and $\\lambda(z)$', { dot: true }]]);
        v.render(() => {
          const BG = v.rgb('panel'), INK = v.rgb('ink');
          const px = (S.bounds.x[1] - S.bounds.x[0]) / S.width;
          S.raster((x, y) => {
            if (y <= 0) return null;
            const w = lamR(x, y); let c = phaseRGB(M, w[0], w[1], 0, BG);
            const r = reduceQ(x, y); if (r.ok) { const m = r.m, cz2 = (m[2] * x + m[3]) ** 2 + (m[2] * y) ** 2; if (distQ(r.x, r.y) * cz2 < px * 0.7) c = mixRGB(c, INK, 0.35); }
            return c;
          }, { key: 'lam', res: 2 });
          S.hline(0, { color: 'ink', width: 1.4 });
          const B = qBoundary(2);
          S.path([[0, 0], [0, 2]], { color: 'orange', width: 3 });
          S.path(B.C1, { color: 'purple', width: 3 }); S.path(B.C2, { color: 'purple', width: 3 });
          S.path(B.L, { color: 'teal', width: 3 }); S.path(B.R, { color: 'teal', width: 3 });
          S.tex('Q_0', 0.5, 1.5, { color: 'ink', size: 16 }); S.tex('Q\\setminus Q_0', -0.5, 1.5, { color: 'ink', size: 14 });
          const zz = [z.x, z.y], w = lamR(zz[0], zz[1]);
          if (orbitT.value) { const pts = []; for (const m of orbitM) { const q = mob(m, zz); if (q[1] > 0.005 && Math.abs(q[0]) < 1.7 && q[1] < 1.8) pts.push(q); } S.dots(pts, { color: 'panel', r: 4.2 }); S.dots(pts, { color: 'gold', r: 2.8 }); }
          // right: Ω with the three real intervals
          W.raster((x, y) => phaseRGB(M, x, y, 0.62, BG), { key: 'w', res: 3 });
          W.line(-9, 0, 0, 0, { color: 'orange', width: 3.2 }); W.line(0, 0, 1, 0, { color: 'purple', width: 3.2 }); W.line(1, 0, 9, 0, { color: 'teal', width: 3.2 });
          W.dot(0, 0, { color: 'red', r: 6, hollow: true, width: 2.4, label: '0', labelPos: 's' }); W.dot(1, 0, { color: 'red', r: 6, hollow: true, width: 2.4, label: '1', labelPos: 's' });
          W.tex('\\lambda(Q_0)=\\Pi^+', 1.9, 1.75, { color: 'ink', size: 14 }); W.tex('\\lambda(Q\\setminus Q_0)', 1.9, -1.75, { color: 'ink', size: 14 });
          const inView = Math.abs(w[0]) < 9 && Math.abs(w[1]) < 9;
          if (isFinite(w[0]) && inView) W.dot(Math.max(-2.5, Math.min(3.5, w[0])), Math.max(-2.3, Math.min(2.3, w[1])), { color: 'gold', r: 7, label: 'λ(z)', labelPos: 'ne' });
          // checks for the readout
          const w2 = lamR(zz[0] + 2, zz[1]); const sz = mob(SIG, zz); const w3 = lamR(sz[0], sz[1]); const wr = lamR(-zz[0], zz[1]);
          st = { zz, w, w2, w3, wr };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\lambda(z) = ${fmtC(v, s.w, 4)}$, $\\;\\lambda(z+2) = ${fmtC(v, s.w2, 4)}$, $\\;\\lambda\\big(\\tfrac{z}{2z+1}\\big) = ${fmtC(v, s.w3, 4)}$ (invariance (a)); reflection: $\\lambda(-\\bar z) = ${fmtC(v, s.wr, 4)} = \\overline{\\lambda(z)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 16.22
    {
      num: '16.22',
      kind: 'Theorem',
      name: "Picard's theorem",
      credit: 'Picard, 1879',
      verify: true,
      statement: String.raw`If $f$ is an entire function and there are two distinct complex numbers $\alpha$ and $\beta$ that are not in the range of $f$, then $f$ is constant.`,
      idea: String.raw`Compose with an affine map so that $\alpha=0$ and $\beta=1$; then $f$ maps $\C$ into $\Omega=\C\setminus\{0,1\}$. Every point of $\Omega$ has a neighbourhood on which $\lambda$ (16.19) has holomorphic local inverses, and these local inverses can be continued along every curve in $\Omega$. So the element $\lambda^{-1}\circ f$ at $0$ can be continued along every curve in the plane. The plane is simply connected, so the monodromy theorem (16.15) gives an entire $g$ with $\lambda\circ g=f$ and $g(\C)\subset\Pi^+$. Then $(g-i)/(g+i)$ is a bounded entire function, constant by Liouville's theorem (10.23). Hence $g$, and so $f$, is constant.`,
      caption: String.raw`**Coverage**: pick an entire $f$ and a radius $R$. Each target $w$ is coloured by the number of solutions of $f(z)=w$ in $|z|<R$, computed by the argument principle as the winding number of $f(\partial D_R)$ around $w$: red means not yet hit. As $R$ grows, the red set shrinks to at most one point: $0$ for $e^z$, nothing for $\cos z$ or $z^3-z$. Drag the two targets $\alpha,\beta$. **Lifting through $\lambda$**: for $f=e^z$, the element $\lambda^{-1}\circ f$ is continued along the gold loop by Newton's method. Its lift is drawn among the $\Gamma$-tiles of 16.18. A loop around a point where $e^z=1$ (red crosses) lifts to a path that ends in a different tile. That is exactly what would be impossible if $f$ omitted both $0$ and $1$.`,
      deps: ['rca-16.19', 'rca-16.15', 'rca-10.23'],
      tags: ['Picard', 'entire functions', 'modular function'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const FN = {
          exp: { label: '$e^z$', f: (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; } },
          cos: { label: '$\\cos z$', f: (x, y) => [Math.cos(x) * Math.cosh(y), -Math.sin(x) * Math.sinh(y)] },
          cub: { label: '$z^3-z$', f: (x, y) => [x * x * x - 3 * x * y * y - x, 3 * x * x * y - y * y * y - y] },
        };
        const mode = v.select('', [{ value: 'cov', label: 'coverage of $f(D_R)$' }, { value: 'lift', label: 'lifting $e^z$ through $\\lambda$' }], 'cov');
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const Rs = v.slider('$R$', 0.5, 8, 2.4, { log: true, decimals: 2 });
        const L = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, height: 380, ticks: false, title: '$z$-plane: phase portrait of $f$' });
        const Rt = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380, ticks: true, title: '' });
        const al = Rt.handle(0, 0, { color: 'red', label: 'α', labelPos: 'nw' });
        const be = Rt.handle(1, 0, { color: 'blue', label: 'β', labelPos: 'ne' });
        const LP = [[-0.7, 4.6], [1.2, 5.0], [0.9, 7.6], [-1.1, 7.2]];
        const LH = LP.map((p, k) => L.handle(p[0], p[1], { color: k ? 'gold' : 'accent', r: k ? 6 : 7, label: k ? undefined : 'z₀', labelPos: 'w' }));
        let st = null, liftCache = { key: '', data: null };
        const loopPts = () => { const C = LH.map((h) => [h.x, h.y]); C.push(C[0]); const out = []; for (let k = 0; k < C.length - 1; k++) for (let j = 0; j < 80; j++) { const t = j / 80; out.push([C[k][0] + (C[k + 1][0] - C[k][0]) * t, C[k][1] + (C[k + 1][1] - C[k][1]) * t]); } out.push(C[0]); return out; };
        function computeLift(pts) {
          const f = FN.exp.f;
          const start = lamInverseQ(f(pts[0][0], pts[0][1]));
          const out = [start.t]; let t = start.t;
          for (let k = 1; k < pts.length; k++) {
            let ok = false;
            for (let sub = 1; sub <= 64 && !ok; sub *= 4) {
              let tt = t, good = true;
              for (let j = 1; j <= sub; j++) {
                const s = j / sub, x = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * s, y = pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * s;
                const r = lamNewton(tt, f(x, y), 12); if (r.err > 1e-8 || !isFinite(r.t[0])) { good = false; break; } tt = r.t;
              }
              if (good) { ok = true; t = tt; }
            }
            if (!ok) return { pts: out, ok: false };
            out.push(t);
          }
          return { pts: out, ok: true };
        }
        v.render(() => {
          const md = mode.value, BG = v.rgb('panel');
          which.el.hidden = md !== 'cov'; Rs.el.hidden = md !== 'cov';
          al.visible = be.visible = md === 'cov'; LH.forEach((h) => { h.visible = md !== 'cov'; });
          if (md === 'cov') {
            const F = FN[which.value], R = Rs.value;
            const span = Math.max(1.6, R * 1.12);
            L.setView([-span, span], [-span, span]); L.setTitle('$z$-plane: phase portrait of $f$ and the disc $D_R$');
            Rt.setView([-3, 3], [-2.4, 2.4]); Rt.setTitle('$w$-plane: number of solutions of $f(z)=w$ in $D_R$');
            L.raster((x, y) => { const w = F.f(x, y); const inD = x * x + y * y < R * R; return phaseRGB(M, w[0], w[1], inD ? 0 : 0.7, BG); }, { key: `${which.value}|${R}`, id: 'L', res: 2 });
            L.circle(0, 0, R, { color: 'ink', width: 2.2 });
            // f(∂D_R) and the winding number about every target, row by row (argument principle)
            const N = 6000, bd = [];
            for (let k = 0; k <= N; k++) { const t = 2 * PI * k / N; bd.push(F.f(R * Math.cos(t), R * Math.sin(t))); }
            const rowCache = new Map();
            const wind = (x, y) => {
              let row = rowCache.get(y);
              if (!row) { row = []; for (let k = 0; k < N; k++) { const a = bd[k], c = bd[k + 1]; if ((a[1] > y) !== (c[1] > y)) row.push([a[0] + (y - a[1]) * (c[0] - a[0]) / (c[1] - a[1]), c[1] > a[1] ? 1 : -1]); } rowCache.set(y, row); }
              let n = 0; for (const [xc, sg] of row) if (xc > x) n += sg; return n;
            };
            const Gc = v.rgb('green'), Rc = v.rgb('red');
            Rt.raster((x, y) => { const n = wind(x, y); return n <= 0 ? mixRGB(BG, Rc, 0.45) : mixRGB(BG, Gc, Math.min(0.75, 0.16 + 0.07 * n)); }, { key: `${which.value}|${R}`, id: 'W', res: 2 });
            Rt.axes();
            const nA = wind(al.x, al.y), nB = wind(be.x, be.y);
            let red = 0, tot = 0; for (let i = 0; i < 60; i++) for (let j = 0; j < 48; j++) { tot++; if (wind(-3 + 6 * (i + 0.5) / 60, -2.4 + 4.8 * (j + 0.5) / 48) <= 0) red++; }
            Rt.corner(`${v.fix(100 * red / tot, 1)}% of this window not yet hit`, 'tl', { color: red ? 'red' : 'green', weight: 600 });
            v.legend([['red', 'not hit by $f$ on $D_R$', { area: true }], ['green', 'hit (darker = more preimages)', { area: true }], ['ink', 'the disc $D_R$ on the left']]);
            st = { md, F, R, nA, nB, red: red / tot };
          } else {
            L.setView([-3.6, 3.6], [-1.2, 9.2]); L.setTitle('$z$-plane: $f=e^z$; red crosses: $e^z=1$');
            Rt.setTitle('the lift $\\lambda^{-1}\\circ f$ among the $\\Gamma$-tiles in $\\Pi^+$');
            L.raster((x, y) => { const w = FN.exp.f(x, y); return phaseRGB(M, w[0], w[1], 0.2, BG); }, { key: 'expL', id: 'L', res: 2 });
            for (let k = -1; k <= 2; k++) xMark(L, 0, 2 * PI * k, 'red', 7);
            const pts = loopPts();
            const key = LH.map((h) => h.x.toFixed(4) + ',' + h.y.toFixed(4)).join(';');
            if (liftCache.key !== key) liftCache = { key, data: computeLift(pts) };
            const lift = liftCache.data;
            { const xs = lift.pts.map((q) => q[0]), ys = lift.pts.map((q) => q[1]);
              const q = (u) => Math.round(u * 2) / 2;
              const x0 = q(Math.min(-1.15, ...xs) - 0.5), x1 = q(Math.max(1.15, ...xs) + 0.5), y1 = q(Math.max(1.4, ...ys) + 0.45);
              const asp = Rt.width / Rt.height; let yspan = y1 + 0.03; if ((x1 - x0) / asp > yspan) yspan = (x1 - x0) / asp;
              const xc = (x0 + x1) / 2, xs2 = yspan * asp / 2;
              Rt.setView([xc - xs2, xc + xs2], [-0.03, yspan - 0.03]); }
            gammaTiles(v, Rt, { key: 'lift', id: 'W' });
            Rt.hline(0, { color: 'ink', width: 1.2 });
            L.path(pts, { color: 'panel', width: 6 }); L.path(pts, { color: 'gold', width: 3 });
            for (let k = 0; k < 4; k++) { const a = pts[k * 80 + 40], b = pts[k * 80 + 43]; L.arrow(a[0], a[1], b[0], b[1], { color: 'ink', head: 9 }); }
            // winding of the loop around the points where e^z = 1
            const windAround = (c) => { let tot = 0; for (let k = 0; k + 1 < pts.length; k++) { let d = Math.atan2(pts[k + 1][1] - c[1], pts[k + 1][0] - c[0]) - Math.atan2(pts[k][1] - c[1], pts[k][0] - c[0]); d -= 2 * PI * Math.round(d / (2 * PI)); tot += d; } return Math.round(tot / (2 * PI)); };
            const ws = [-1, 0, 1, 2].map((k) => [k, windAround([0, 2 * PI * k])]).filter(([, n]) => n);
            Rt.path(lift.pts, { color: 'panel', width: 6 }); Rt.path(lift.pts, { color: 'gold', width: 3 });
            const s0 = lift.pts[0], s1 = lift.pts[lift.pts.length - 1];
            const closes = lift.ok && Math.hypot(s1[0] - s0[0], s1[1] - s0[1]) < 1e-6;
            Rt.dot(s0[0], s0[1], { color: 'accent', r: 6, label: 'start', labelPos: 'nw' });
            Rt.dot(s1[0], s1[1], { color: closes ? 'green' : 'red', r: 6, label: closes ? '' : 'end', labelPos: 'ne' });
            Rt.corner(!lift.ok ? 'lift lost (loop too close to a cusp)' : closes ? 'the lift closes up' : 'the lift ends in another tile', 'tl', { color: lift.ok && closes ? 'green' : 'red', weight: 600 });
            const rr = reduceQ(s1[0], s1[1]);
            v.legend([['gold', 'loop in $\\C$ and its lift in $\\Pi^+$'], ['red', '$e^z=1$ (where $\\lambda^{-1}\\circ f$ branches)'], ['accent', '$Q$ and the $\\Gamma$-tiles', { area: true }]]);
            st = { md, closes, ok: lift.ok, ws, phi: minv(rr.m), s0, s1 };
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.md === 'cov') return `$R = ${v.fix(s.R, 2)}$: $\\alpha$ is hit $${s.nA}$ times and $\\beta$ is hit $${s.nB}$ times in $|z|<R$. ` + (which.value === 'exp' ? 'For $e^z$ only the single value $0$ stays omitted, however large $R$ is.' : 'This $f$ omits nothing: every target is eventually hit.') + ' Two omitted values would force $f$ to be constant.';
          if (!s.ok) return 'Move the loop away from the points where $e^z=1$.';
          const wtxt = s.ws.length ? s.ws.map(([k, n]) => `$${n}\\times$ around $${k === 0 ? '0' : `${k === 1 ? '' : k}2\\pi i`}$`).join(', ') : 'around no point where $e^z=1$';
          return `The loop winds ${wtxt}. ` + (s.closes ? 'Its lift returns to the start: no monodromy.' : `The lift ends at $\\varphi(\\text{start})$ with $\\varphi = ${matTeX(s.phi)}\\in\\Gamma$, a different branch of $\\lambda^{-1}\\circ e^z$. If $f$ omitted both $0$ and $1$ this could never happen, and the branches would glue to an entire $g$ with values in $\\Pi^+$.`);
        });
      },
    },
  ],
};
