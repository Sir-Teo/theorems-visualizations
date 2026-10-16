// Numerical Linear Algebra — Chapter 1: Matrices, norms and the SVD
// Part 2 (this file): 1.7–1.11 — what the SVD reveals, Eckart–Young, compression, PCA, operation counts.
// 1.6 (the SVD itself) is cross-listed from ladr-7.70 and 1.12 (Strassen) from algo-4.2.
import {
  nm, nmc, matT, dot, add, sub, scl, len, unit, mv, mm, tp, fro, msub, madd, mscl, maxAbs, rot, truncate, randOrth, randFrame, grey, pixelAt, makeImage, IMG_N, TAU, sciT,
} from './ch01.shared.js';

const circ = (a, b, n = 72) => Array.from({ length: n + 1 }, (_, k) => { const t = (TAU * k) / n; return add(scl(a, Math.cos(t)), scl(b, Math.sin(t))); });

export default {
  collection: 'nla',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Norms, rank and subspaces from the SVD',
      statement: String.raw`Let $A\in\mathbb R^{m\times n}$ have the SVD $A=U\Sigma V^{\top}$ with singular values $\sigma_1\ge\dots\ge\sigma_p\ge0$, $p=\min(m,n)$, and let $r$ be the number of nonzero ones. Then
(a) $\operatorname{rank}A=r$;
(b) $\operatorname{range}A=\operatorname{span}(u_1,\dots,u_r)$ and $\operatorname{null}A=\operatorname{span}(v_{r+1},\dots,v_n)$;
(c) $\|A\|_2=\sigma_1$ and $\|A\|_F=\sqrt{\sigma_1^2+\cdots+\sigma_r^2}$;
(d) the nonzero singular values are the square roots of the nonzero eigenvalues of $A^{\top}A$ (and of $AA^{\top}$).`,
      idea: String.raw`Because $A v_i=\sigma_iu_i$ and the $u_i$, $v_i$ are orthonormal, $Ax=\sum_i\sigma_i(v_i^{\top}x)\,u_i$: only directions with $\sigma_i>0$ contribute, so the range is spanned by those $u_i$ and exactly the $v_i$ with $\sigma_i=0$ are killed. Unitary invariance (1.5) gives $\|A\|_2=\|\Sigma\|_2=\sigma_1$ and $\|A\|_F=\|\Sigma\|_F$. Finally $A^{\top}A=V\Sigma^{\top}\Sigma V^{\top}$ is an eigendecomposition with eigenvalues $\sigma_i^2$.`,
      caption: String.raw`Left: the unit sphere with the right singular vectors $v_1,v_2,v_3$; right: its image, an ellipsoid with semi-axes $\sigma_iu_i$ (same scale; the two views rotate together when you drag either). Slide $\sigma_3$ to $0$: the ellipsoid becomes a flat ellipse, the rank drops to $2$, the range is the plane of $u_1,u_2$ (green) and the null space is the line of $v_3$ (red), which $A$ crushes to $0$. Slide $\sigma_2$ to $0$ as well for rank $1$. The readout rebuilds $A$ and re-derives everything numerically.`,
      deps: ['nla-1.6'],
      tags: ['svd', 'rank', 'subspaces'],
      refs: ['Trefethen–Bau Lec. 5'],
      viz(v) {
        const M = v.M;
        const Ds = v.stage({ x: [-2.5, 2.5], y: [-2.05, 2.05], equal: true, axes: false, height: 400, minWidth: 300, title: 'domain: unit sphere, right singular vectors $v_i$' });
        const Rs = v.stage({ x: [-2.5, 2.5], y: [-2.05, 2.05], equal: true, axes: false, height: 400, minWidth: 300, title: 'range: ellipsoid with semi-axes $\\sigma_iu_i$' });
        const sd = v.scene3(Ds, { axes: false, yaw: -0.7, pitch: 0.35, hint: false }), sr = v.scene3(Rs, { axes: false, yaw: -0.7, pitch: 0.35 });
        let seed = 3, U, V;
        const regen = () => { const r = v.rng(seed); U = randOrth(M, r, 3); V = randOrth(M, r, 3); };
        regen();
        const CC = ['blue', 'purple', 'teal'];
        let busy = false;
        const sig = [2.2, 1.2, 0.55].map((x, i) => v.slider(`$\\sigma_${i + 1}$`, 0, 2.4, x, {
          step: 0.01,
          onChange: () => {
            if (busy) return; busy = true;
            for (let k = 1; k < 3; k++) if (sig[k].value > sig[k - 1].value) sig[k].set(sig[k - 1].value);
            for (let k = 1; k < 3; k++) if (sig[k].value > sig[k - 1].value) sig[k].set(sig[k - 1].value);
            busy = false;
          },
        }));
        v.button('New $U,V$', () => { seed++; regen(); });
        v.button('Rank 2', () => sig[2].set(0));
        let lastY = sd.yaw, lastP = sd.pitch, st = null;
        v.render(() => {
          // rotate the two views together
          if (sd.yaw !== lastY || sd.pitch !== lastP) { sr.yaw = sd.yaw; sr.pitch = sd.pitch; } else if (sr.yaw !== lastY || sr.pitch !== lastP) { sd.yaw = sr.yaw; sd.pitch = sr.pitch; }
          lastY = sd.yaw; lastP = sd.pitch;
          const sg = sig.map((s) => s.value), Uc = [0, 1, 2].map((j) => U.map((r) => r[j])), Vc = [0, 1, 2].map((j) => V.map((r) => r[j]));
          const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => sg.reduce((s, x, k) => s + x * Uc[k][i] * Vc[k][j], 0)));
          const r = sg.filter((s) => s > 1e-9).length;
          const rings = [circ(Vc[0], Vc[1]), circ(Vc[0], Vc[2]), circ(Vc[1], Vc[2])];
          const lat = [-0.6, -0.3, 0.3, 0.6].map((h) => circ(scl(Vc[1], Math.sqrt(1 - h * h)), scl(Vc[2], Math.sqrt(1 - h * h))).map((p) => add(p, scl(Vc[0], h))));
          // domain
          sd.begin();
          lat.forEach((c) => sd.path(c, { color: 'faint', width: 1, alpha: 0.7 }));
          rings.forEach((c, i) => { sd.poly(c, { fill: 'accent', fillAlpha: 0.03, edge: false }); sd.path(c, { color: 'muted', width: 1.3, alpha: 0.9 }); });
          Vc.forEach((c, k) => {
            if (sg[k] < 1e-9) { sd.line(scl(c, -1.5), scl(c, 1.5), { color: 'red', width: 4.5 }); sd.tex('\\operatorname{null}A', scl(c, 1.62), { color: 'red', size: 14 }); }
            sd.arrow([0, 0, 0], c, { color: CC[k], width: 3 }); sd.tex(`v_${k + 1}`, scl(c, 1.15), { color: CC[k], size: 15 });
          });
          sd.flush();
          // range
          sr.begin();
          if (r === 2) sr.disc(Uc[0], Uc[1], sg[0] * 1.25, { fill: 'green', color: 'green', fillAlpha: 0.1 });
          if (r === 1) sr.line(scl(Uc[0], -sg[0] * 1.25), scl(Uc[0], sg[0] * 1.25), { color: 'green', width: 6, alpha: 0.35 });
          lat.forEach((c) => sr.path(c.map((p) => mv(A, p)), { color: 'faint', width: 1, alpha: 0.7 }));
          rings.forEach((c) => { const im = c.map((p) => mv(A, p)); sr.poly(im, { fill: 'accent', fillAlpha: 0.03, edge: false }); sr.path(im, { color: 'muted', width: 1.3, alpha: 0.9 }); });
          Uc.forEach((c, k) => {
            if (sg[k] < 1e-9) return;
            sr.arrow([0, 0, 0], scl(c, sg[k]), { color: CC[k], width: 3 }); sr.tex(`\\sigma_${k + 1}u_${k + 1}`, scl(c, sg[k] * 1.12 + 0.1), { color: CC[k], size: 14 });
          });
          sr.flush();
          Rs.corner(r === 3 ? 'rank 3: an ellipsoid' : r === 2 ? 'rank 2: a flat ellipse' : r === 1 ? 'rank 1: a segment' : 'rank 0: a point', 'tl', { color: r === 3 ? 'muted' : 'green', weight: 700 });
          const rec = M.svd(A);
          let err = 0; for (let k = 0; k < 3; k++) err = Math.max(err, len(sub(mv(A, Vc[k]), scl(Uc[k], sg[k]))));
          st = { A, sg, r, rec: rec.S, rk: M.rank(A, 1e-7), nul: M.nullspace(A, 1e-7).length, err, n2: Math.sqrt(dot(mv(A, unit([1, 0.5, 0.3])), mv(A, unit([1, 0.5, 0.3])))) };
        });
        v.legend([['blue', '$v_1\\to\\sigma_1u_1$'], ['purple', '$v_2\\to\\sigma_2u_2$'], ['teal', '$v_3\\to\\sigma_3u_3$'], ['green', 'range', { area: true }], ['red', 'null space']]);
        v.readout(() => {
          if (!st) return '';
          const { A, sg, r, rec, rk, nul, err } = st;
          return `Rebuilt $A=U\\Sigma V^{\\top}$; its computed singular values: $${rec.map((s) => nm(s, 3)).join(',\\ ')}$ — the ones you set. $\\operatorname{rank}A = ${rk}$ (the number of nonzero $\\sigma_i$: ${r}), $\\dim\\operatorname{null}A = ${nul} = 3 - r$.\n$\\|A\\|_2 = \\sigma_1 = ${nm(sg[0], 3)}$, $\\|A\\|_F = \\sqrt{\\sum\\sigma_i^2} = ${nm(Math.hypot(...sg), 3)}$ (directly from the entries: $${nm(fro(A), 3)}$); $\\max_i\\|Av_i-\\sigma_iu_i\\| = ${sciT(err)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Eckart–Young: best low-rank approximation',
      statement: String.raw`Let $A\in\mathbb R^{m\times n}$ have the SVD $A=\sum_i\sigma_iu_iv_i^{\top}$ and for $0\le k<\min(m,n)$ let $A_k=\sum_{i\le k}\sigma_iu_iv_i^{\top}$. Then $\operatorname{rank}A_k=k$ and, over all matrices $B$ of rank at most $k$,
$$\min_{\operatorname{rank}B\le k}\|A-B\|_2=\|A-A_k\|_2=\sigma_{k+1},\qquad \min_{\operatorname{rank}B\le k}\|A-B\|_F=\|A-A_k\|_F=\Big(\sum_{i>k}\sigma_i^2\Big)^{1/2}.$$
The same $A_k$ is optimal for every unitarily invariant norm (Mirsky).`,
      idea: String.raw`The error $A-A_k=\sum_{i>k}\sigma_iu_iv_i^{\top}$ has singular values $\sigma_{k+1},\sigma_{k+2},\dots$, so its norms are as claimed (1.7). For the lower bound in the 2-norm, a rank-$\le k$ matrix $B$ has a null space of dimension $\ge n-k$, which must meet the $(k+1)$-dimensional space $\operatorname{span}(v_1,\dots,v_{k+1})$ in a unit vector $w$; then $\|A-B\|_2\ge\|(A-B)w\|=\|Aw\|\ge\sigma_{k+1}$ since $A$ stretches that span by at least $\sigma_{k+1}$. The Frobenius case follows from Weyl's inequalities for singular values, $\sigma_{k+i}(A)\le\sigma_i(A-B)$ when $\operatorname{rank}B\le k$.`,
      caption: String.raw`A random $6\times6$ matrix with the singular values in the left panel (log scale; the first $k$ are kept, blue). Move $k$ and pick the norm. Each count in the right panel is one of $400$ random rank-$k$ competitors $B$, made by perturbing the optimal factors by an amount $\varepsilon$ (or by projecting $A$ onto a perturbed $k$-frame); the green line is the Eckart–Young value. No competitor ever lands left of it, and at $\varepsilon=0$ the competitor is $A_k$ and sits exactly on it.`,
      deps: ['nla-1.7', 'ladr-7.92'],
      tags: ['svd', 'low rank', 'approximation'],
      credit: 'Schmidt, 1907; Eckart & Young, 1936; Mirsky, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Low-rank_approximation' },
      refs: ['Trefethen–Bau Lec. 5'],
      viz(v) {
        const M = v.M, n = 6, SIG = [3, 1.6, 0.9, 0.45, 0.2, 0.08], NC = 400;
        const Sg = v.stage({ x: [0.4, 6.6], y: [0.04, 6], ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 280, xlabel: 'i', ylabel: 'σᵢ', title: 'singular values of $A$' });
        const Hs = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: 'error of the competitor', ylabel: 'number of competitors', title: 'errors of 400 rank-$k$ competitors' });
        const K = v.slider('$k$', 1, 5, 2, { int: true });
        const nrm = v.select('norm', [{ value: '2', label: '$\\|\\cdot\\|_2$' }, { value: 'F', label: '$\\|\\cdot\\|_F$' }], '2');
        const fam = v.select('competitors', [{ value: 'fac', label: 'perturbed factors' }, { value: 'proj', label: 'projections $QQ^{\\top}A$' }], 'fac');
        const EP = v.slider('$\\varepsilon$', 0, 1, 0.25, { step: 0.01 });
        let seed = 1, U, V, A, G1, G2;
        const build = () => {
          const r = v.rng(seed * 17 + 3);
          U = randOrth(M, r, n); V = randOrth(M, r, n);
          A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => SIG.reduce((s, x, k) => s + x * U[i][k] * V[j][k], 0)));
          G1 = Array.from({ length: NC }, () => Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal())));
          G2 = Array.from({ length: NC }, () => Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal())));
        };
        build();
        v.button('New matrix', () => { seed++; build(); memo = null; });
        const normOf = (E) => (nrm.value === '2' ? M.svd(E).S[0] : fro(E));
        let memo = null;
        const compute = (k, eps, f, nt) => {
          const key = `${seed}|${k}|${eps}|${f}|${nt}`;
          if (memo && memo.key === key) return memo.errs;
          const errs = [];
          for (let c = 0; c < NC; c++) {
            const X = U.map((row, i) => row.slice(0, k).map((x, j) => x + eps * G1[c][i][j]));
            let B;
            if (f === 'fac') {
              const Y = V.map((row, i) => row.slice(0, k).map((x, j) => x + eps * G2[c][i][j]));
              B = X.map((row) => Y.map((yr) => row.reduce((s, x, j) => s + x * SIG[j] * yr[j], 0)));
            } else {
              const { Q } = M.qr(X, { thin: true });
              B = mm(Q, mm(tp(Q), A));
            }
            errs.push(normOf(msub(A, B)));
          }
          memo = { key, errs };
          return errs;
        };
        let st = null;
        v.render(() => {
          const k = K.value, eps = EP.value, bound = nrm.value === '2' ? SIG[k] : Math.sqrt(SIG.slice(k).reduce((s, x) => s + x * x, 0));
          // singular values
          SIG.forEach((s, i) => { Sg.rect(i + 1 - 0.32, 0.04, i + 1 + 0.32, s, { fill: i < k ? 'blue' : 'orange', fillAlpha: 0.6, stroke: false }); Sg.text(nmc(s, 2), i + 1, s * 1.18, { size: 11.5, align: 'center', color: i < k ? 'blue' : 'orange' }); });
          Sg.vline(k + 0.5, { color: 'ink', dash: [4, 3], width: 1.2 });
          Sg.tex(nrm.value === '2' ? `\\sigma_{${k + 1}}` : `\\big(\\textstyle\\sum_{i>${k}}\\sigma_i^2\\big)^{1/2}`, 6.4, nrm.value === '2' ? SIG[k] : bound, { color: 'green', size: 13, align: 'right', dy: -14 });
          Sg.line(0.4, bound, 6.6, bound, { color: 'green', width: 1.6, dash: [5, 4] });
          // histogram
          const errs = compute(k, eps, fam.value, nrm.value);
          const hi = Math.max(Math.max(...errs) * 1.04, bound * 1.06), lo = Math.max(0, bound - 0.3 * (hi - bound));
          const h = M.histogram(errs, { bins: 28, range: [lo, hi] });
          Hs.setView([lo, hi], [0, Math.max(...h.counts) * 1.2 + 1]);
          Hs.hist({ edges: h.edges, counts: h.counts }, { color: 'accent', fillAlpha: 0.5 });
          Hs.vline(bound, { color: 'green', width: 2.4 });
          Hs.text('Eckart–Young', bound, Math.max(...h.counts) * 1.12 + 0.5, { align: 'left', dx: 6, size: 12, color: 'green' });
          const Ak = truncate({ U, S: SIG, V }, k), eAk = normOf(msub(A, Ak));
          Hs.dot(bound, 0, { color: 'green', r: 5 });
          const below = errs.filter((e) => e < bound - 1e-12).length;
          st = { k, bound, eAk, mn: Math.min(...errs), below, med: M.median(errs), eps };
        });
        v.legend([['blue', 'kept $\\sigma_i$'], ['orange', 'discarded'], ['green', 'optimal error'], ['accent', 'competitors', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, bound, eAk, mn, below, med } = st;
          const nm2 = nrm.value === '2';
          return `${nm2 ? `$\\sigma_{${k + 1}}$` : `$\\big(\\sum_{i>${k}}\\sigma_i^2\\big)^{1/2}$`} $= ${nm(bound, 5)}$ and the computed $\\|A-A_${k}\\| = ${nm(eAk, 5)}$.\nOf $${NC}$ rank-$${k}$ competitors: smallest error $${nm(mn, 5)}$, median $${nm(med, 3)}$, number beating $A_${k}$: **${below}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Method',
      name: 'Image compression by truncated SVD',
      statement: String.raw`A greyscale image is an $m\times n$ matrix $A$ of pixel values. Keep the first $k$ singular triplets, $A_k=\sum_{i\le k}\sigma_iu_iv_i^{\top}$, and store only the $k(m+n+1)$ numbers $\sigma_i$, $u_i$, $v_i$ instead of $mn$. By Eckart–Young (1.8) this is the best rank-$k$ image in the 2- and Frobenius norms: the error is $\|A-A_k\|_2/\|A\|_2=\sigma_{k+1}/\sigma_1$ and $\|A-A_k\|_F/\|A\|_F=\big(\sum_{i>k}\sigma_i^2\big/\sum_i\sigma_i^2\big)^{1/2}$. Compression pays only while $k<mn/(m+n+1)$, and it works well exactly when the singular values decay quickly.`,
      idea: String.raw`Each term $\sigma_iu_iv_i^{\top}$ is a rank-one "layer": an outer product of a column profile and a row profile. Images with large smooth or repeated structure (sky, walls, edges aligned with the axes) are dominated by a few layers, so the $\sigma_i$ fall off fast; diagonal edges, fine texture and noise spread their energy over many layers. Eckart–Young says the greedy choice — the top $k$ layers — is optimal, and the singular values give the error before reconstructing anything.`,
      caption: String.raw`Pick one of three $64\times64$ greyscale images, all generated in code (a scene with sun, hills, house and tree; diagonal stripes with a ring; pure noise), and slide $k$. Left to right: the original, the rank-$k$ image, and the error (amplified $\times4$). The lower plots show the singular value decay and the relative errors against $k$ on a log axis, and the storage cost against $k$ — the scene is recognizable at a few layers, the stripes need more, and noise does not compress at all.`,
      deps: ['nla-1.8'],
      tags: ['svd', 'compression', 'images'],
      credit: 'Andrews & Patterson, 1976 (digital image processing by SVD)',
      refs: ['Trefethen–Bau Lec. 5'],
      viz(v) {
        const M = v.M, N = IMG_N;
        const mk = (title) => v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 250, minWidth: 190, title });
        const O = mk('original'), R = mk('rank-$k$ image'), E = mk('error $\\times4$');
        const Pl = v.stage({ x: [0, N], y: [1e-5, 2], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'rank k', ylabel: 'relative error', title: 'error against rank' });
        const St = v.stage({ x: [0, N], y: [0, 1.8], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'rank k', ylabel: 'storage / (m·n)', title: 'storage against rank' });
        const which = v.select('image', [{ value: 'scene', label: 'scene' }, { value: 'stripes', label: 'diagonal stripes' }, { value: 'noise', label: 'noise' }], 'scene');
        const K = v.slider('$k$', 0, N, 8, { int: true });
        const cache = {};
        const data = (kind) => {
          if (cache[kind]) return cache[kind];
          const I = makeImage(M, kind), svd = M.svd(I), S = svd.S, tot = Math.sqrt(S.reduce((s, x) => s + x * x, 0));
          const tail = new Array(N + 1).fill(0); for (let k = N - 1; k >= 0; k--) tail[k] = tail[k + 1] + S[k] * S[k];
          return (cache[kind] = { I, svd, S, tot, relF: tail.map((t) => Math.sqrt(t) / tot), rel2: Array.from({ length: N + 1 }, (_, k) => (k < N ? S[k] / S[0] : 0)) });
        };
        let st = null;
        v.render(() => {
          const kind = which.value, d = data(kind), k = K.value, Ak = truncate(d.svd, k);
          const key = `${kind}|${k}`;
          const inside = (x, y) => x >= 0 && x <= 1 && y >= 0 && y <= 1;
          O.raster((x, y) => (inside(x, y) ? grey(pixelAt(d.I, x, 1 - y)) : null), { res: 2, key: `o|${kind}`, id: 'o' });
          R.raster((x, y) => (inside(x, y) ? grey(pixelAt(Ak, x, 1 - y)) : null), { res: 2, key: `r|${key}`, id: 'r' });
          E.raster((x, y) => { if (!inside(x, y)) return null; const e = Math.abs(pixelAt(d.I, x, 1 - y) - pixelAt(Ak, x, 1 - y)); return grey(1 - Math.min(1, 4 * e)); }, { res: 2, key: `e|${key}`, id: 'e' });
          for (const S of [O, R, E]) S.rect(0, 0, 1, 1, { color: 'muted', width: 1, stroke: true, fill: false });
          // errors against rank
          const pts = (arr) => arr.map((y, k) => (y > 1e-12 ? [k, y] : null));
          Pl.path(pts(d.rel2), { color: 'purple', width: 2 });
          Pl.path(pts(d.relF), { color: 'orange', width: 2 });
          Pl.vline(k, { color: 'gold', dash: [4, 3], width: 1.4 });
          if (d.rel2[k] > 1e-12) Pl.dot(k, d.rel2[k], { color: 'purple', r: 5 });
          if (d.relF[k] > 1e-12) Pl.dot(k, d.relF[k], { color: 'orange', r: 5 });
          // storage
          const kStar = (N * N) / (2 * N + 1), sto = (kk) => (kk * (2 * N + 1)) / (N * N);
          St.path([[0, 0], [N, sto(N)]], { color: 'blue', width: 2 });
          St.hline(1, { color: 'green', dash: [5, 4], width: 1.4 });
          St.text('raw image: $mn$ numbers', 1, 1.08, { size: 12, color: 'green', align: 'left' });
          St.dot(kStar, 1, { color: 'green', r: 5 });
          St.text(`break-even k = ${nm(kStar, 1)}`, kStar, 1, { size: 12, color: 'green', align: 'right', dx: -10, dy: 14 });
          St.dot(k, sto(k), { color: 'gold', r: 6 });
          St.vline(k, { color: 'gold', dash: [4, 3], width: 1 });
          const errF = fro(msub(d.I, Ak)) / fro(d.I);
          st = { k, d, errF, sto: sto(k), kStar };
        });
        v.legend([['purple', '$\\|A-A_k\\|_2/\\|A\\|_2=\\sigma_{k+1}/\\sigma_1$'], ['orange', '$\\|A-A_k\\|_F/\\|A\\|_F$'], ['blue', 'storage $k(m+n+1)$']]);
        v.readout(() => {
          if (!st) return '';
          const { k, d, errF, sto, kStar } = st;
          const cap = d.relF[k];
          return `$k=${k}$: stores $${k * (2 * N + 1)}$ numbers instead of $${N * N}$ ($${nm(100 * sto, 0)}\\%$, ${sto > 1 ? '**more** than the raw image' : `${nm(1 / Math.max(sto, 1e-9), 1)}$\\times$ compression`}). Relative Frobenius error: measured $${nm(errF, 5)}$, from the singular values $${nm(cap, 5)}$; energy kept $${nm(100 * (1 - errF * errF), 2)}\\%$.\n$\\sigma_{k+1}/\\sigma_1 = ${k < N ? nm(d.S[k] / d.S[0], 5) : '0'}$ is the relative 2-norm error. Compression beats the raw image for $k<${nm(kStar, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Method',
      name: 'Principal component analysis via the SVD',
      statement: String.raw`Let $X\in\mathbb R^{N\times d}$ hold $N$ data points as rows and let $X_c$ be $X$ with the column means subtracted. If $X_c=U\Sigma V^{\top}$ is an SVD, then the columns $v_i$ of $V$ are the **principal axes** (the eigenvectors of the sample covariance $\tfrac1{N-1}X_c^{\top}X_c$), the variance along $v_i$ is $\sigma_i^2/(N-1)$, and the scores $X_cv_i=\sigma_iu_i$ are uncorrelated. Projecting onto the first $k$ axes gives the rank-$k$ approximation $X_c\approx\sum_{i\le k}\sigma_iu_iv_i^{\top}$, which by Eckart–Young minimizes the sum of squared distances to a $k$-dimensional subspace through the mean; the fraction of variance retained is $\sum_{i\le k}\sigma_i^2/\sum_i\sigma_i^2$. Without centring, the SVD finds the best subspace through the *origin* instead.`,
      idea: String.raw`Total squared distance from the points to a subspace spanned by orthonormal $Q$ is $\|X_c-X_cQQ^{\top}\|_F^2$, so the best subspace gives the best rank-$k$ approximation of $X_c$ in the Frobenius norm — which is the truncated SVD (1.8). Since $X_c^{\top}X_c=V\Sigma^2V^{\top}$, the $v_i$ diagonalize the covariance and $\sigma_i^2/(N-1)$ are its eigenvalues. The numerical advice follows from conditioning: computing the SVD of $X_c$ directly avoids forming $X_c^{\top}X_c$, which squares the condition number.`,
      caption: String.raw`Choose a cloud, click the left panel to add points (shift-click removes the nearest), or resample. Arrows are the principal axes, drawn from the mean with length $2\sigma_i/\sqrt{N-1}$ (two standard deviations). Thin lines project every point onto the first axis; their total squared length equals $\sigma_2^2$. The right panel shows the scores $X_cV$: the same cloud turned into the principal frame, uncorrelated and axis aligned. Switch centring off and watch $v_1$ get dragged toward the mean.`,
      deps: ['nla-1.8'],
      tags: ['svd', 'pca', 'statistics'],
      credit: 'Pearson, 1901; Hotelling, 1933',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Principal_component_analysis' },
      refs: ['Trefethen–Bau Lec. 5'],
      viz(v) {
        const M = v.M;
        const B = v.stage({ x: [-4.5, 4.5], y: [-3.4, 3.4], equal: true, height: 380, minWidth: 320, title: 'data, principal axes and projection onto $v_1$' });
        const T = v.stage({ x: [-5, 5], y: [-3.4, 3.4], equal: true, height: 380, minWidth: 300, title: 'scores: the cloud in the principal frame' });
        const kinds = [{ value: 'ellipse', label: 'tilted ellipse' }, { value: 'blobs', label: 'two blobs' }, { value: 'round', label: 'round' }];
        let seed = 1, pts = [];
        const gen = () => {
          const r = v.rng(seed * 13 + 5); pts = [];
          for (let i = 0; i < 70; i++) {
            if (kind.value === 'ellipse') { const z = [r.normal() * 1.9, r.normal() * 0.55]; pts.push(add(mv(rot(0.5), z), [0.8, 0.5])); }
            else if (kind.value === 'blobs') { const c = r() < 0.5 ? [-1.9, -1.1] : [2.0, 1.4]; pts.push([c[0] + r.normal() * 0.6, c[1] + r.normal() * 0.6]); }
            else pts.push([r.normal() * 1.1 + 0.8, r.normal() * 1.1 + 0.5]);
          }
        };
        const kind = v.select('cloud', kinds, 'ellipse', { onChange: () => gen() });
        const cen = v.toggle('centre the data', true);
        v.button('Resample', () => { seed++; gen(); });
        v.button('Clear', () => { pts = []; });
        gen();
        B.onClick((x, y, mod) => {
          if (mod && mod.shift) { let bi = -1, bd = 0.5; pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) pts.splice(bi, 1); }
          else pts.push([x, y]);
          v.invalidate();
        });
        let st = null;
        v.render(() => {
          const N = pts.length;
          if (N < 3) { B.corner('click to add points (at least 3)', 'tl', { color: 'muted', weight: 600 }); st = null; return; }
          const mu = cen.value ? [0, 1].map((j) => pts.reduce((s, p) => s + p[j], 0) / N) : [0, 0];
          const Xc = pts.map((p) => sub(p, mu)), { S, V } = M.svd(Xc);
          const v1 = [V[0][0], V[1][0]], v2 = [V[0][1], V[1][1]], sc = (i) => (2 * S[i]) / Math.sqrt(N - 1);
          const centre = cen.value ? mu : [0, 0];
          // 1-sigma-ish ellipse
          B.path(Array.from({ length: 73 }, (_, k) => { const t = (TAU * k) / 72; return add(centre, add(scl(v1, (sc(0) / 2) * Math.cos(t)), scl(v2, (sc(1) / 2) * Math.sin(t)))); }), { color: 'muted', width: 1.2, alpha: 0.9, dash: [4, 3] });
          let sumd = 0;
          for (const p of Xc) { const t = dot(p, v1), pr = add(mu, scl(v1, t)), q = add(mu, p); sumd += dot(p, v2) ** 2; B.line(q[0], q[1], pr[0], pr[1], { color: 'orange', width: 1, alpha: 0.6 }); }
          B.dots(Xc.map((p) => add(mu, p)), { r: 3.6, color: 'accent' });
          B.dots(Xc.map((p) => add(mu, scl(v1, dot(p, v1)))), { r: 2.8, color: 'gold' });
          B.line(centre[0] - 4 * v1[0], centre[1] - 4 * v1[1], centre[0] + 4 * v1[0], centre[1] + 4 * v1[1], { color: 'gold', width: 1, alpha: 0.4 });
          B.arrow(centre[0], centre[1], centre[0] + sc(0) * v1[0], centre[1] + sc(0) * v1[1], { color: 'red', width: 3 });
          B.arrow(centre[0], centre[1], centre[0] + sc(1) * v2[0], centre[1] + sc(1) * v2[1], { color: 'green', width: 3 });
          B.tex('v_1', centre[0] + (sc(0) + 0.25) * v1[0], centre[1] + (sc(0) + 0.25) * v1[1], { color: 'red', size: 15 });
          B.tex('v_2', centre[0] + (sc(1) + 0.25) * v2[0], centre[1] + (sc(1) + 0.25) * v2[1], { color: 'green', size: 15 });
          B.dot(centre[0], centre[1], { color: 'ink', r: 4, hollow: true });
          B.dot(0, 0, { color: 'muted', r: 2.5 });
          if (!cen.value) B.corner('not centred: the axes are drawn from the origin, so $v_1$ is pulled toward the mean', 'tl', { color: 'red', weight: 600, plate: true });
          // scores
          const sco = Xc.map((p) => [dot(p, v1), dot(p, v2)]);
          T.dots(sco, { r: 3.6, color: 'accent' });
          T.arrow(0, 0, sc(0), 0, { color: 'red', width: 3 }); T.arrow(0, 0, 0, sc(1), { color: 'green', width: 3 });
          T.tex('\\sigma_1u_1', 3.1, -0.5, { color: 'red', size: 13 }); T.tex('\\sigma_2u_2', 0.2, -1.4, { color: 'green', size: 13 });
          // covariance check
          const C = [0, 1].map((a) => [0, 1].map((b) => Xc.reduce((s, p) => s + p[a] * p[b], 0) / (N - 1)));
          const ev = M.eigSym(C).values;
          const off = Math.abs(sco.reduce((s, p) => s + p[0] * p[1], 0) / (N - 1));
          st = { N, S, sumd, ev, off };
        });
        v.legend([['accent', 'data', { dot: true }], ['gold', 'projection on $v_1$', { dot: true }], ['red', '$v_1$'], ['green', '$v_2$']]);
        v.readout(() => {
          if (!st) return 'Add points by clicking the left panel.';
          const { N, S, sumd, ev, off } = st;
          const tot = S[0] ** 2 + S[1] ** 2;
          return `$N=${N}$, $\\sigma_1=${nm(S[0], 3)}$, $\\sigma_2=${nm(S[1], 3)}$: the first axis keeps **${nm((100 * S[0] ** 2) / tot, 1)}\\%** of the variance. Total squared distance to the $v_1$ line: $${nm(sumd, 4)} = \\sigma_2^2 = ${nm(S[1] ** 2, 4)}$.\nCovariance eigenvalues $${nm(ev[0], 4)},\\ ${nm(ev[1], 4)}$ vs $\\sigma_i^2/(N-1) = ${nm(S[0] ** 2 / (N - 1), 4)},\\ ${nm(S[1] ** 2 / (N - 1), 4)}$; covariance of the scores (off-diagonal): $${sciT(off)}$${cen.value ? '' : ' — but these are about the origin, not the mean'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Concept',
      name: 'Operation counts (flops) and cost of algorithms',
      statement: String.raw`Algorithms of numerical linear algebra are compared by their **flop counts**: the number of floating-point additions, subtractions, multiplications and divisions as a function of the dimension. For $n\times n$ matrices and $n$-vectors: an inner product costs $2n-1\sim2n$ flops, a matrix–vector product $2n^2-n\sim2n^2$, and a matrix–matrix product $2n^3-n^2\sim2n^3$ (computed by the definition). Doubling $n$ multiplies a cost $\sim cn^{\alpha}$ by $2^{\alpha}$. Order of evaluation matters: for $A,B\in\mathbb R^{n\times n}$ and $x\in\mathbb R^n$, $(AB)x$ costs $\sim2n^3$ but $A(Bx)$ only $\sim4n^2$.`,
      idea: String.raw`Count the entries of the result and the work per entry: a matrix–vector product has $n$ outputs, each an inner product of length $n$ ($n$ multiplications, $n-1$ additions); a matrix–matrix product has $n^2$ outputs of the same kind. Only the leading power matters for large $n$ — hence the "$\sim$" and the straight lines of slope $2$ and $3$ on log–log axes. Flop counts are a model: real running times also depend on memory traffic, caching and vectorization, so measured exponents are only approximately $2$ and $3$.`,
      caption: String.raw`Left: exact flop counts of the basic operations on log–log axes; every power law is a straight line whose slope is its exponent. Move $n$ to read the counts and the cost of the two orders $(AB)x$ and $A(Bx)$. Right: *measured* wall-clock times of a plain JavaScript implementation, timed live in your browser (press the button to repeat), with the $n^2$ and $n^3$ reference lines through the $n=32$ points. Timings are illustrative: they depend on your machine, and caching bends the lines at large $n$.`,
      deps: ['nla-1.1'],
      tags: ['complexity', 'flops'],
      refs: ['Golub–Van Loan ch. 1'],
      viz(v) {
        const FL = {
          dot: (n) => 2 * n - 1, mv: (n) => 2 * n * n - n, mm: (n) => 2 * n ** 3 - n * n,
          abx: (n) => 2 * n ** 3 - n * n + 2 * n * n - n, a_bx: (n) => 2 * (2 * n * n - n),
        };
        const F = v.stage({ x: [2, 4096], y: [1, 2e11], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, minWidth: 320, xlabel: 'n', ylabel: 'flops', title: 'exact flop counts' });
        const Tm = v.stage({ x: [6, 400], y: [1e-8, 5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, minWidth: 320, xlabel: 'n', ylabel: 'seconds', title: 'measured time (JavaScript, this browser)' });
        const NS = v.slider('$n$', 2, 4096, 100, { log: true, int: true });
        const sizes = [8, 16, 32, 64, 128, 256];
        let meas = [];
        const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const timeOne = (n) => {
          const A = new Float64Array(n * n), Bm = new Float64Array(n * n), C = new Float64Array(n * n), x = new Float64Array(n), y = new Float64Array(n);
          for (let i = 0; i < n * n; i++) { A[i] = ((i * 7) % 13) / 13 - 0.5; Bm[i] = ((i * 5) % 11) / 11 - 0.5; }
          for (let i = 0; i < n; i++) x[i] = 1 / (i + 1);
          const mvOnce = () => { for (let i = 0; i < n; i++) { let s = 0; const o = i * n; for (let j = 0; j < n; j++) s += A[o + j] * x[j]; y[i] = s; } };
          const mmOnce = () => { C.fill(0); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; for (let j = 0; j < n; j++) C[i * n + j] += a * Bm[k * n + j]; } };
          const bench = (f, target) => {
            f(); let reps = 1, t = 0;
            for (;;) { const t0 = now(); for (let r = 0; r < reps; r++) f(); t = now() - t0; if (t > target || reps > 1e6) break; reps *= 4; }
            return t / reps / 1000;
          };
          return { n, mv: bench(mvOnce, 3), mm: bench(mmOnce, 5), sink: y[0] + C[0] };
        };
        const measure = () => { meas = sizes.map(timeOne); };
        measure();
        v.button('Measure again', () => measure());
        const slope = (key) => { const P = meas.filter((m) => m.n >= 32 && m[key] > 0).map((m) => [Math.log(m.n), Math.log(m[key])]); if (P.length < 2) return NaN; const mx = P.reduce((s, p) => s + p[0], 0) / P.length, my = P.reduce((s, p) => s + p[1], 0) / P.length; return P.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / P.reduce((s, p) => s + (p[0] - mx) ** 2, 0); };
        v.render(() => {
          const n = NS.value;
          F.fn((x) => FL.mm(x), { color: 'orange', width: 2.4, n: 160 });
          F.fn((x) => FL.abx(x), { color: 'green', width: 1.8, dash: [6, 4], n: 160 });
          F.fn((x) => FL.mv(x), { color: 'blue', width: 2.4, n: 160 });
          F.fn((x) => FL.a_bx(x), { color: 'purple', width: 1.8, dash: [6, 4], n: 160 });
          F.fn((x) => FL.dot(x), { color: 'muted', width: 2, n: 160 });
          F.tex('(AB)x', 3000, FL.abx(3000), { color: 'green', size: 13, dy: -14, align: 'right' }); F.tex('AB', 3000, FL.mm(3000) / 3, { color: 'orange', size: 13, dy: 14, align: 'right' });
          F.tex('A(Bx)', 3000, FL.a_bx(3000), { color: 'purple', size: 13, dy: 14, align: 'right' }); F.tex('Ax', 3000, FL.mv(3000) / 4, { color: 'blue', size: 13, dy: 14, align: 'right' }); F.tex('x^{\\top}y', 3000, FL.dot(3000), { color: 'muted', size: 13, dy: 14, align: 'right' });
          F.vline(n, { color: 'gold', dash: [4, 3], width: 1.2 });
          for (const [f, c] of [[FL.mm, 'orange'], [FL.mv, 'blue'], [FL.dot, 'muted']]) F.dot(n, f(n), { color: c, r: 4.5 });
          // measured
          const ref = meas.find((m) => m.n === 32) || meas[2];
          if (ref) {
            Tm.fn((x) => ref.mv * (x / ref.n) ** 2, { color: 'blue', dash: [5, 4], width: 1.2, alpha: 0.7, n: 120 });
            Tm.fn((x) => ref.mm * (x / ref.n) ** 3, { color: 'orange', dash: [5, 4], width: 1.2, alpha: 0.7, n: 120 });
          }
          Tm.path(meas.map((m) => [m.n, m.mv]), { color: 'blue', width: 2 }); Tm.path(meas.map((m) => [m.n, m.mm]), { color: 'orange', width: 2 });
          Tm.dots(meas.map((m) => [m.n, m.mv]), { r: 4, color: 'blue' }); Tm.dots(meas.map((m) => [m.n, m.mm]), { r: 4, color: 'orange' });
          Tm.tex('n^2', 300, ref ? ref.mv * (300 / ref.n) ** 2 : 1, { color: 'blue', size: 13, dy: -12 }); Tm.tex('n^3', 90, ref ? ref.mm * (90 / ref.n) ** 3 : 1, { color: 'orange', size: 13, dy: -14, dx: -14 });
        });
        v.legend([['muted', 'inner product $\\sim2n$'], ['blue', '$Ax\\sim2n^2$'], ['orange', '$AB\\sim2n^3$'], ['green', '$(AB)x$', { dash: true }], ['purple', '$A(Bx)\\sim4n^2$', { dash: true }]]);
        v.readout(() => {
          const n = NS.value, last = meas[meas.length - 1];
          const rate = last ? (2 * last.n ** 3) / last.mm / 1e9 : NaN;
          const fmt = (x) => (x >= 1e6 ? v.sci(x, 2) : String(Math.round(x)));
          const inner = `$n=${n}$: $x^{\\top}y$ $${fmt(FL.dot(n))}$ flops, $Ax$ $${fmt(FL.mv(n))}$, $AB$ $${fmt(FL.mm(n))}$; $(AB)x$ costs $${nm(FL.abx(n) / FL.a_bx(n), 1)}\\times$ as much as $A(Bx)$.`;
          return `${inner}\nMeasured slopes (fit for $n\\ge32$): $Ax$ ≈ $${nm(slope('mv'), 2)}$, $AB$ ≈ $${nm(slope('mm'), 2)}$ — close to the flop-count exponents $2$ and $3$. At the measured $AB$ rate of about $${nm(rate, 2)}$ Gflop/s, one second of work would buy a product $Ax$ with $n\\approx${nm(Math.sqrt((rate * 1e9) / 2), 0)}$ but a product $AB$ with only $n\\approx${nm(Math.cbrt((rate * 1e9) / 2), 0)}$.`;
        });
      },
    },
  ],
};
