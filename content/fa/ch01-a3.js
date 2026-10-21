// Rudin, Functional Analysis — Chapter 1, part 3: local compactness, Heine–Borel, metrization,
// Cauchy sequences (1.22–1.28).

const TAU = 2 * Math.PI;
const phi = (x) => x / (1 + Math.abs(x));
/** Greedy ½-net: centres such that every point is within `rad` of one; returns indices of centres. */
function greedyNet(pts, dist, rad) {
  const C = [];
  for (let i = 0; i < pts.length; i++) if (C.every((j) => dist(pts[i], pts[j]) >= rad)) C.push(i);
  return C;
}
/**
 * Rudin's metrization function f(x) = inf{ r dyadic : x ∈ A(r) }, A(r) = Σ c_n(r) V_n, for V_n = s_n·B with
 * B a disc (kind 'disc') or a cross of two w-thin rectangles (kind 'cross'). Depth-first search over the
 * binary digits in increasing order of r returns the least admissible r of depth ≤ s.length (or 1).
 */
function rudinF(x1, x2, s, kind, w) {
  const K = s.length, R = new Array(K + 1).fill(0);
  for (let n = K - 1; n >= 0; n--) R[n] = R[n + 1] + s[n];
  let best = 1;
  const ax = Math.abs(x1), ay = Math.abs(x2);
  if (kind === 'disc') {
    const rho = Math.hypot(x1, x2);
    const dfs = (n, rem, r) => {
      if (rem <= 1e-12) { best = r; return true; }
      if (n >= K || rem > R[n] + 1e-12) return false;
      if (dfs(n + 1, rem, r)) return true;
      return dfs(n + 1, rem - s[n], r + Math.pow(2, -(n + 1)));
    };
    dfs(0, rho, 0); return best;
  }
  const dfs = (n, rx, ry, r) => {
    if (rx <= 1e-12 && ry <= 1e-12) { best = r; return true; }
    if (n >= K) return false;
    const Rn = R[n];
    if (rx > Rn + 1e-12 || ry > Rn + 1e-12 || rx + ry > (1 + w) * Rn + 1e-12) return false;
    if (dfs(n + 1, rx, ry, r)) return true;
    const sn = s[n], val = r + Math.pow(2, -(n + 1));
    if (dfs(n + 1, Math.max(0, rx - sn), Math.max(0, ry - w * sn), val)) return true;
    return dfs(n + 1, Math.max(0, rx - w * sn), Math.max(0, ry - sn), val);
  };
  dfs(0, ax, ay, 0); return best;
}

export default {
  collection: 'fa',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.22
    {
      num: '1.22',
      kind: 'Theorem',
      name: 'Locally compact spaces are finite-dimensional',
      statement: String.raw`Every locally compact topological vector space $X$ has finite dimension.`,
      idea: String.raw`Let $V$ be a neighbourhood of $0$ with compact closure. Then $V$ is bounded (1.15(b)), so the sets $2^{-n}V$ form a local base (1.15(c)). Cover $\overline V$ by finitely many translates $x_i+\tfrac12V$ and let $Y$ be the span of the $x_i$; it is finite-dimensional, hence closed (1.21). From $V\subset Y+\tfrac12V$ one gets $V\subset Y+2^{-n}V$ for all $n$, so $V\subset\bigcap_n(Y+2^{-n}V)=\overline Y=Y$ by 1.13(a). Then $kV\subset Y$ for every $k$, and $X=\bigcup kV=Y$ by 1.15(a).`,
      caption: String.raw`The proof needs finitely many balls of radius $\tfrac12$ to cover the closed unit ball. Left: $N$ points on the unit sphere of $\R^3$, with a greedy $\tfrac12$-net (green): its size levels off. Bottom: in $\ell^2$ the orthonormal vectors $e_1,\dots,e_N$ all lie in the closed unit ball, yet $\norm{e_m-e_n}=\sqrt2$ for $m\ne n$, so each needs its own ball. Right: the number of balls needed, against $N$ — bounded in $\R^3$, unbounded in $\ell^2$, so the unit ball of $\ell^2$ is not compact.`,
      deps: ['fa-1.21', 'fa-1.15', 'fa-1.13', 'fa-1.8'],
      see: ['pma-2.41'],
      tags: ['local compactness', 'finite dimension'],
      viz(v) {
        const nS = v.slider('$N$', 1, 220, 120, { int: true });
        const S3 = v.stage3d({ range: 1.35, height: 330, yaw: -0.7, pitch: 0.35, axes: false, title: '$\\R^3$: points on the unit sphere and a $\\tfrac12$-net' });
        const C = v.stage({ x: [0, 222], y: [0, 135], height: 330, axes: 'box', title: 'balls of radius $\\tfrac12$ needed to cover $x_1,\\dots,x_N$' });
        const B = v.stage({ x: [0, 41], y: [-0.1, 1.25], height: 150, full: true, axes: 'box', title: '$\\ell^2$: the vector $e_N$ (bars) and $e_{N-1}$ (outline) — distance $\\sqrt2$' });
        const r = v.rng(4);
        const P = []; while (P.length < 220) { const a = [r.normal(), r.normal(), r.normal()]; const n = Math.hypot(...a); P.push(a.map((t) => t / n)); }
        const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        const curve = []; { const C0 = []; for (let N = 1; N <= 220; N++) { const p = P[N - 1]; if (C0.every((j) => d3(p, P[j]) >= 0.5)) C0.push(N - 1); curve.push([N, C0.length]); } }
        let st = {};
        v.render(() => {
          const N = nS.value;
          for (let k = -2; k <= 2; k++) { const z = k * 0.4, rr = Math.sqrt(1 - z * z); S3.curve((t) => [rr * Math.cos(t), rr * Math.sin(t), z], 0, TAU, { color: 'grid', width: 1, n: 64 }); }
          for (let k = 0; k < 6; k++) { const a = k * Math.PI / 6; S3.curve((t) => [Math.cos(a) * Math.sin(t), Math.sin(a) * Math.sin(t), Math.cos(t)], 0, TAU, { color: 'grid', width: 1, n: 64 }); }
          const pts = P.slice(0, N), net = greedyNet(pts, d3, 0.5), isC = new Set(net);
          pts.forEach((p, i) => S3.dot(p, { color: isC.has(i) ? 'green' : 'gold', r: isC.has(i) ? 4.2 : 2.6 }));
          // chart
          C.path(curve.filter(([n]) => n <= 220), { color: 'green', width: 1.2, alpha: 0.35 });
          C.path(curve.filter(([n]) => n <= N), { color: 'green', width: 2.6 });
          C.line(0, 0, 220, 220, { color: 'red', width: 2.6 });
          C.dot(N, net.length, { color: 'green', r: 4.5 });
          C.dot(N, Math.min(N, 133), { color: 'red', r: 4.5 });
          C.text('ℓ²: N balls (one per eₙ)', 100, 104, { color: 'red', size: 12, align: 'right' });
          C.text('ℝ³: levels off', 210, curve[219][1] + 6, { color: 'green', size: 12, align: 'right', baseline: 'bottom' });
          // l2 bars
          const lo = Math.max(0, N - 40);
          B.setView([lo, lo + 41], null);
          B.rect(N - 0.35, 0, N + 0.35, 1, { fill: 'accent', fillAlpha: 0.8, stroke: false });
          if (N > 1) B.rect(N - 1 - 0.35, 0, N - 1 + 0.35, 1, { color: 'purple', width: 1.6, dash: [4, 3] });
          B.text(`coordinate ${N}`, N, 1.12, { size: 11.5, color: 'accent', align: 'right', dx: 8 });
          st = { N, net: net.length };
        });
        v.legend([['gold', 'points $x_k\\in S^2$', { dot: true }], ['green', 'net centres / $\\R^3$ count'], ['red', '$\\ell^2$ count $=N$']]);
        v.readout(() => `$N=${st.N}$: $\\R^3$ needs ${st.net} balls of radius $\\tfrac12$; the vectors $e_1,\\dots,e_{${st.N}}$ of $\\ell^2$ need ${st.N}, since $\\|e_m-e_n\\|_2=\\sqrt2>2\\cdot\\tfrac12$. No finite cover exists, so the closed unit ball of $\\ell^2$ is not compact.`);
      },
    },
    // ------------------------------------------------------------------ 1.23
    {
      num: '1.23',
      kind: 'Theorem',
      name: 'Locally bounded + Heine–Borel ⇒ finite-dimensional',
      statement: String.raw`If a topological vector space $X$ is locally bounded and has the Heine–Borel property, then $X$ has finite dimension.`,
      idea: String.raw`Let $V$ be a bounded neighbourhood of $0$. Its closure is bounded (1.13(f)) and closed, hence compact by the Heine–Borel property. So $X$ is locally compact, and 1.22 applies.`,
      caption: String.raw`Both hypotheses are needed. In $\ell^2$ (locally bounded) the closed unit ball is closed and bounded, but the sequence $e_n$ has no convergent subsequence: no Heine–Borel property. In $H(D)$, the holomorphic functions on the unit disc (Heine–Borel by Montel's theorem), the basic neighbourhood $V=\{f:\sup_{\abs z\le 1/2}\abs f<1\}$ contains $f_n(z)=0.9(2z)^n$, whose values on $\abs z=3/4$ blow up: $V$ is not bounded. In $\R^2$ both hold and the space is finite-dimensional.`,
      deps: ['fa-1.22', 'fa-1.13', 'fa-1.8'],
      verify: true,
      tags: ['Heine–Borel', 'local boundedness', 'finite dimension'],
      viz(v) {
        const sp = v.select('space', [{ value: 'H', label: '$H(D)$: HB, not loc. bounded' }, { value: 'l2', label: '$\\ell^2$: loc. bounded, not HB' }, { value: 'R2', label: '$\\R^2$: both' }], 'H');
        const nS = v.slider('$n$', 1, 30, 10, { int: true });
        const S = v.stage({ x: [0, 1], y: [0, 4], height: 350, axes: 'box' });
        let last = null, st = {};
        const r = v.rng(9);
        const seq = Array.from({ length: 30 }, (_, k) => { const t = r.uniform(0, TAU), rr = Math.sqrt(r()); return [rr * Math.cos(t), rr * Math.sin(t)]; });
        v.render(() => {
          const m = sp.value, n = nS.value;
          if (m !== last) {
            last = m;
            if (m === 'H') { S.setView([0, 1], [0, 4]); S.setTitle('$|f_k(r)|$ along a radius, $f_k(z)=0.9(2z)^k$, $k\\le n$'); }
            else if (m === 'l2') { S.setView([0, 31], [-0.15, 1.3]); S.setTitle('$\\ell^2$: the closed unit ball contains $e_1,e_2,\\dots,e_n$'); }
            else { S.setView([-1.6, 1.6], [-1.15, 1.15]); S.setTitle('$\\R^2$: a sequence in the closed unit disc and a convergent subsequence'); }
          }
          if (m === 'H') {
            S.vband(0, 0.5, { color: 'green', alpha: 0.12 });
            S.hline(1, { color: 'green', dash: [5, 4], width: 1.2 });
            S.vline(0.75, { color: 'red', dash: [5, 4], width: 1.2 });
            for (let k = 1; k <= n; k++) S.fn((x) => 0.9 * Math.pow(2 * x, k), { domain: [0, 0.999], color: k === n ? 'accent' : 'faint', width: k === n ? 2.6 : 1.1 });
            const top = 0.9 * Math.pow(1.5, n);
            S.dot(0.75, Math.min(top, 3.85), { color: 'red', r: 5 });
            if (top > 3.85) S.arrow(0.75, 3.3, 0.75, 3.95, { color: 'red', width: 2 });
            S.text(`|fₙ| = ${v.fmt(top, 3)} on |z| = 3/4`, 0.76, 3.6, { color: 'red', size: 12, align: 'left', dx: 6 });
            S.text('V = { |f| < 1 on |z| ≤ 1/2 }', 0.25, 2.2, { color: 'green', size: 12.5, align: 'center' });
            st = { m, n, top };
          } else if (m === 'l2') {
            for (let k = 1; k <= n; k++) { const a = k === n ? 1 : 0.25 + 0.5 * k / n; S.rect(k - 0.35, 0, k + 0.35, 1, { fill: k === n ? 'accent' : 'purple', fillAlpha: k === n ? 0.8 : 0.15 * a, color: k === n ? 'accent' : 'purple', width: 1, alpha: a }); }
            S.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
            S.text('each eₖ has norm 1 and ‖eₖ − eₘ‖ = √2', 30.5, 1.2, { size: 12, color: 'red', align: 'right' });
            st = { m, n };
          } else {
            S.circle(0, 0, 1, { color: 'accent', width: 1.8, fill: 'accent', fillAlpha: 0.06 });
            const pts = seq.slice(0, Math.max(2, n));
            S.dots(pts, { color: 'gold', r: 3.4 });
            // Bolzano–Weierstrass by bisection: keep the half with infinitely many (here: most) points
            let box = [-1, 1, -1, 1], idx = pts.map((_, i) => i), sub = [];
            for (let it = 0; it < 6 && idx.length > 1; it++) {
              const cx = (box[0] + box[1]) / 2, cy = (box[2] + box[3]) / 2;
              const qs = [[box[0], cx, box[2], cy], [cx, box[1], box[2], cy], [box[0], cx, cy, box[3]], [cx, box[1], cy, box[3]]];
              const cnt = qs.map((q) => idx.filter((i) => pts[i][0] >= q[0] && pts[i][0] < q[1] && pts[i][1] >= q[2] && pts[i][1] < q[3]));
              const bestQ = cnt.reduce((a, b, i) => (b.length > cnt[a].length ? i : a), 0);
              if (cnt[bestQ].length < 1) break;
              box = qs[bestQ]; idx = cnt[bestQ]; sub.push(idx[0]);
              S.rect(box[0], box[2], box[1], box[3], { color: 'green', width: 1.2, alpha: 0.4 + 0.1 * it });
            }
            const subPts = [...new Set(sub)].sort((a, b) => a - b).map((i) => pts[i]);
            S.path(subPts, { color: 'green', width: 1.6 });
            S.dots(subPts, { color: 'green', r: 4.2 });
            st = { m, n };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          if (s.m === 'H') return `$f_n\\in V$ for every $n$, but $\\sup_{|z|\\le3/4}|f_n| = 0.9\\cdot1.5^{${s.n}} = ${v.fmt(s.top, 4)}$: $V$ is not bounded. $H(D)$ has the Heine–Borel property, so by 1.23 it cannot be locally bounded.`;
          if (s.m === 'l2') return 'The closed unit ball of $\\ell^2$ is closed and bounded, but $(e_n)$ has no Cauchy subsequence: it is not compact, and $\\ell^2$ lacks the Heine–Borel property.';
          return 'In $\\R^2$ every bounded sequence has a convergent subsequence (nested boxes, green): locally bounded plus Heine–Borel, and indeed finite-dimensional.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.24
    {
      num: '1.24',
      kind: 'Theorem',
      name: 'Metrization: a countable local base gives an invariant metric',
      credit: 'Birkhoff & Kakutani, 1936',
      statement: String.raw`If $X$ is a topological vector space with a countable local base, then there is a metric $d$ on $X$ such that
(a) $d$ is compatible with the topology of $X$,
(b) the open balls centred at $0$ are balanced, and
(c) $d$ is invariant: $d(x+z,y+z)=d(x,y)$ for all $x,y,z\in X$.
If in addition $X$ is locally convex, $d$ can be chosen to satisfy (a), (b), (c) and also
(d) all open balls are convex.`,
      idea: String.raw`Choose a balanced local base $V_1\supset V_2\supset\cdots$ with $V_{n+1}+V_{n+1}\subset V_n$ (convex as well when $X$ is locally convex). For dyadic $r=\sum c_n2^{-n}$ put $A(r)=c_1V_1+c_2V_2+\cdots$ and $A(r)=X$ for $r\ge1$. The key inclusion $A(r)+A(s)\subset A(r+s)$ shows that $f(x)=\inf\{r:x\in A(r)\}$ satisfies $f(x+y)\le f(x)+f(y)$; then $d(x,y)=f(x-y)$ is an invariant metric whose balls $\{f<\delta\}$ are unions of the balanced sets $A(r)$, nested between members of the local base.`,
      caption: String.raw`$X=\R^2$ with the local base $V_n=s_nB$. The colour bands are the metric balls $\{d(\cdot,y)<k/8\}$ computed exactly from Rudin's sets $A(r)$ (digits up to $2^{-7}$). With $B$ a disc ($s_{n+1}=s_n/2$) the balls are discs and $d=\min(1,\abs{x-y}/2s_1)$: convex, case (d). With $B$ a thin cross ($s_{n+1}=0.18\,s_n$, so that $V_{n+1}+V_{n+1}\subset V_n$) the balls are balanced but not convex. Drag $y$: the pattern translates rigidly — invariance (c).`,
      deps: ['fa-1.14a', 'fa-1.8', 'fa-1.6'],
      tags: ['metrization', 'invariant metric'],
      viz(v) {
        const kind = v.select('$B$', [{ value: 'cross', label: 'thin cross' }, { value: 'disc', label: 'disc (convex)' }], 'cross');
        const rS = v.slider('ball radius $\\rho$', 0.05, 0.95, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.75, 1.75], equal: true, height: 380, ticks: false });
        const hy = S.handle(-0.3, 0.1, { color: 'ink', label: 'y' });
        const hx = S.handle(0.55, 0.15, { color: 'gold', label: 'x' });
        const W = 0.2, K = 7;
        const scales = (k) => k === 'disc' ? Array.from({ length: K }, (_, n) => 0.75 * Math.pow(0.5, n)) : Array.from({ length: K }, (_, n) => 1.25 * Math.pow(0.18, n));
        let st = {}, grid = null, gridKey = '';
        const RES = 2;
        v.render(() => {
          const k = kind.value, s = scales(k), rho = rS.value, yx = hy.x, yy = hy.y;
          const f = (x1, x2) => rudinF(x1, x2, s, k, W);
          const bg = v.rgb('panel'), gr = v.rgb('green'), ac = v.rgb('accent');
          const gw = Math.ceil(S.width / RES), gh = Math.ceil(S.height / RES), gk = `${k}|${yx}|${yy}|${gw}|${gh}|${S.bounds.x}|${S.bounds.y}`;
          if (gk !== gridKey) {
            gridKey = gk; grid = new Float32Array(gw * gh);
            for (let j = 0; j < gh; j++) { const y = S.invY((j + 0.5) * RES); for (let i = 0; i < gw; i++) grid[j * gw + i] = f(S.invX((i + 0.5) * RES) - yx, y - yy); }
          }
          S.raster((x, y) => {
            const i = Math.min(gw - 1, Math.max(0, Math.floor(S.X(x) / RES))), j = Math.min(gh - 1, Math.max(0, Math.floor(S.Y(y) / RES)));
            const val = grid[j * gw + i];
            if (val >= 1) return null;
            const band = Math.floor(val * 8) / 8;
            const c = val < rho ? gr : ac;
            const a = val < rho ? 0.25 + 0.4 * (1 - band) : 0.08 + 0.3 * (1 - band);
            return [c[0] * a + bg[0] * (1 - a), c[1] * a + bg[1] * (1 - a), c[2] * a + bg[2] * (1 - a), 255];
          }, { res: RES, key: `${gk}|${rho}|${bg}|${gr}` });
          // the generating set V_1 (outline) at y
          if (k === 'disc') S.circle(yx, yy, s[0], { color: 'orange', width: 1.4, dash: [4, 3] });
          else { const a = s[0], b = W * s[0]; S.poly([[a, b], [b, b], [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b], [-b, -a], [b, -a], [b, -b], [a, -b]].map(([p, q]) => [yx + p, yy + q]), { color: 'orange', width: 1.4, dash: [4, 3] }); }
          const dxy = f(hx.x - yx, hx.y - yy), dyx = f(yx - hx.x, yy - hx.y);
          S.line(yx, yy, hx.x, hx.y, { color: 'gold', width: 1.2, dash: [3, 3] });
          S.tex('V_1', yx + s[0], yy, { color: 'orange', align: 'left', dx: 5, size: 13 });
          st = { dxy, dyx, rho, k };
        });
        v.legend([['green', 'the ball $\\{d(\\cdot,y)<\\rho\\}$', { area: true }], ['accent', 'bands $\\{k/8\\le d(\\cdot,y)<(k+1)/8\\}$, darker = closer', { area: true }], ['orange', '$y+V_1$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.dxy == null) return '';
          return `$d(x,y)=f(x-y) = ${v.fix(s.dxy, 3)}$, $\\;d(y,x) = ${v.fix(s.dyx, 3)}$ (balanced balls make $d$ symmetric). Green region: the ball $\\{d(\\cdot,y)<${v.fix(s.rho, 2)}\\}$ — ` + (s.k === 'disc' ? 'convex.' : 'balanced, star-shaped, but not convex.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.25
    {
      num: '1.25',
      kind: 'Definition',
      name: 'Cauchy sequences',
      statement: String.raw`(a) If $d$ is a metric on a set $X$, a sequence $(x_n)$ is **$d$-Cauchy** if for every $\eps>0$ there is $N$ such that $d(x_m,x_n)<\eps$ whenever $m,n>N$.
(b) If $X$ is a topological vector space, $(x_n)$ is a **Cauchy sequence** if for every neighbourhood $V$ of $0$ there is $N$ such that $x_m-x_n\in V$ whenever $m,n>N$.
If $d$ is an invariant metric compatible with the topology, its balls about $0$ form a local base, so (a) and (b) coincide. For a non-invariant compatible metric they may differ.`,
      idea: String.raw`Definition (b) uses only the vector-space structure and the topology, so it makes sense in every TVS — even non-metrizable ones — and is the notion behind completeness of F-spaces. The example $d(x,y)=\abs{\varphi(x)-\varphi(y)}$ on $\R$, with $\varphi(x)=x/(1+\abs x)$, is compatible with the usual topology, yet $x_n=n$ is $d$-Cauchy without being Cauchy in the sense of (b).`,
      caption: String.raw`Definition (b) in pictures: the gold dots are the differences $x_m-x_n$ for $m,n>N$. A sequence is Cauchy when, for every neighbourhood $V$ of $0$ (orange; change its size), this cloud eventually fits inside $V$. Raise $N$: for the converging spiral the cloud collapses to $0$; for the bounded sequence $(\cos n,\sin n)$ it never fits in a small $V$.`,
      deps: ['fa-1.6', 'fa-1.24'],
      see: ['pma-3.8'],
      tags: ['Cauchy sequences', 'completeness'],
      viz(v) {
        const seqSel = v.select('$(x_n)$', [{ value: 'spiral', label: 'spiral $\\to$ limit' }, { value: 'circle', label: '$(\\cos n,\\sin n)$' }], 'spiral');
        const NS = v.slider('$N$', 1, 160, 70, { int: true });
        const rV = v.slider('size of $V$', 0.05, 1, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.3, 1.3], equal: true, height: 320, ticks: false, title: 'the sequence $x_1,x_2,\\dots$ (tail $n>N$ in gold)' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-1.8, 1.8], equal: true, height: 320, ticks: false, title: 'differences $x_m-x_n$, $m,n>N$, and $V$' });
        const xs = (k) => (n) => k === 'spiral' ? [0.3 + 1.1 * Math.cos(0.7 * n) / Math.sqrt(n), 0.1 + 1.1 * Math.sin(0.7 * n) / Math.sqrt(n)] : [Math.cos(n), Math.sin(n)];
        const Vshape = (r) => Array.from({ length: 80 }, (_, i) => { const t = TAU * i / 80; return [r * 1.1 * Math.cos(t), r * 0.9 * Math.sin(t)]; });
        let st = {};
        v.render(() => {
          const X = xs(seqSel.value), N = NS.value, r = rV.value, M = 240;
          const pts = Array.from({ length: M }, (_, i) => X(i + 1));
          L.path(pts, { color: 'faint', width: 0.8 });
          L.dots(pts.slice(0, N), { color: 'muted', r: 2.2 });
          L.dots(pts.slice(N), { color: 'gold', r: 2.6 });
          if (seqSel.value === 'spiral') L.dot(0.3, 0.1, { hollow: true, color: 'green', r: 5, label: 'limit', labelPos: 'e', math: false, labelSize: 12 });
          const V = Vshape(r);
          R.poly(V, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.8 });
          const diffs = []; let worst = 0;
          for (let m = N; m < M; m += 2) for (let n = N; n < M; n += 3) {
            const d = [pts[m][0] - pts[n][0], pts[m][1] - pts[n][1]]; diffs.push(d);
            worst = Math.max(worst, Math.hypot(d[0] / (1.1 * r), d[1] / (0.9 * r)));
          }
          R.dots(diffs, { color: 'gold', r: 1.6, alpha: 0.6 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          R.tex('V', r * 1.1, 0, { color: 'orange', align: 'left', dx: 6 });
          const inside = worst < 1;
          R.corner(inside ? 'all differences in V' : 'some differences outside V', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          st = { inside, N };
        });
        v.legend([['gold', 'tail and its differences', { dot: true }], ['orange', 'neighbourhood $V$ of $0$', { area: true }]]);
        v.readout(() => st.inside ? `For $m,n>${st.N}$ every $x_m-x_n$ lies in $V$ (sampled up to $n=240$). Shrink $V$ and raise $N$ again: for a Cauchy sequence this always works.` : `With $N=${st.N}$ some $x_m-x_n$ leave $V$. For $(\\cos n,\\sin n)$ the differences fill out a disc of radius $2$ for every $N$ — not Cauchy.`);
      },
    },
    // ------------------------------------------------------------------ 1.26
    {
      num: '1.26',
      kind: 'Theorem',
      name: 'Invariant metrics with the same topology share Cauchy sequences',
      statement: String.raw`Let $d_1$ and $d_2$ be invariant metrics on a vector space $X$ that induce the same topology. Then
(a) $d_1$ and $d_2$ have the same Cauchy sequences, and
(b) $d_1$ is complete if and only if $d_2$ is complete.`,
      idea: String.raw`For an invariant compatible metric, being $d$-Cauchy is the same as being Cauchy in the topological sense of 1.25(b), which refers only to the topology; so (a) holds. For (b), a $d_1$-Cauchy sequence is $d_2$-Cauchy, converges in $d_2$ if $d_2$ is complete, and convergence is a topological notion.`,
      caption: String.raw`Three metrics on $\R$ with the usual topology: $d_1=\abs{x-y}$ and $d_2=\frac{\abs{x-y}}{1+\abs{x-y}}$ are invariant; $d_3=\abs{\varphi(x)-\varphi(y)}$ with $\varphi(x)=\frac{x}{1+\abs x}$ is not. The chart plots the tail diameter $\sup_{m,n\ge N}d(x_m,x_n)$. For every sequence the two invariant metrics agree on whether it tends to $0$; $d_3$ calls the divergent $x_n=n$ and $x_n=\log n$ Cauchy, and it is not complete.`,
      deps: ['fa-1.25'],
      verify: true,
      tags: ['Cauchy sequences', 'invariant metric', 'completeness'],
      viz(v) {
        const SEQ = {
          alt: { label: '$\\sum_{k\\le n}(-1)^k/k$', arr: (M) => { const a = [0]; let s = 0; for (let k = 1; k <= M; k++) { s += (k % 2 ? -1 : 1) / k; a.push(s); } return a; } },
          lin: { label: '$n$', arr: (M) => Array.from({ length: M + 1 }, (_, n) => n) },
          log: { label: '$\\log n$', arr: (M) => Array.from({ length: M + 1 }, (_, n) => (n ? Math.log(n) : 0)) },
          osc: { label: '$\\sin n$', arr: (M) => Array.from({ length: M + 1 }, (_, n) => Math.sin(n)) },
        };
        const which = v.select('$x_n$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const S = v.stage({ x: [0, 4], y: [0, 1.15], height: 330, axes: 'box', xlabel: 'N', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']], title: 'tail diameter $\\sup_{m,n\\ge N} d(x_m,x_n)$ (sampled to $n=10^5$)' });
        let st = {}; const cache = {};
        v.render(() => {
          const key = which.value, M = 100000;
          if (!cache[key]) {
            const xs = SEQ[key].arr(M);
            const mx = new Float64Array(M + 2).fill(-Infinity), mn = new Float64Array(M + 2).fill(Infinity);
            for (let n = M; n >= 1; n--) { mx[n] = Math.max(mx[n + 1], xs[n]); mn[n] = Math.min(mn[n + 1], xs[n]); }
            const D1 = [], D2 = [], D3 = [];
            for (let i = 0; i <= 400; i++) {
              const L = 4 * i / 400, N = Math.round(Math.pow(10, L)), w = mx[N] - mn[N];
              D1.push([L, Math.min(1.1, w)]); D2.push([L, w / (1 + w)]); D3.push([L, phi(mx[N]) - phi(mn[N])]);
            }
            cache[key] = { D1, D2, D3 };
          }
          const { D1, D2, D3 } = cache[key];
          S.hline(1, { color: 'faint', dash: [3, 3], width: 1 });
          S.path(D1, { color: 'blue', width: 2.4 });
          S.path(D2, { color: 'green', width: 2.4, dash: [7, 5] });
          S.path(D3, { color: 'red', width: 2.4 });
          if (D1[400][1] > 1.05) S.text('d₁ is off the chart (clipped)', 3.95, 1.1, { color: 'blue', size: 12, align: 'right', baseline: 'top', dy: 4 });
          st = { a: D1[400][1], b: D2[400][1], c: D3[400][1] };
        });
        v.legend([['blue', '$d_1=|x-y|$ (invariant)'], ['green', '$d_2=\\frac{|x-y|}{1+|x-y|}$ (invariant)', { dash: true }], ['red', '$d_3=|\\varphi(x)-\\varphi(y)|$ (not invariant)']]);
        v.readout(() => {
          const s = st; if (s.a == null) return '';
          const conv = s.b < 0.02;
          return `At $N=10^4$: $d_1$-diameter $${s.a > 1.05 ? '>1' : v.fix(s.a, 4)}$, $d_2$-diameter $${v.fix(s.b, 4)}$, $d_3$-diameter $${v.fix(s.c, 4)}$. ` + (conv ? 'Cauchy for all three metrics.' : (s.c < 0.05 ? 'Not Cauchy for $d_1,d_2$ — but $d_3$ is fooled: it is not invariant.' : 'Not Cauchy for any of them.'));
        });
      },
    },
    // ------------------------------------------------------------------ 1.27
    {
      num: '1.27',
      kind: 'Theorem',
      name: 'A subspace that is an F-space is closed',
      statement: String.raw`Let $Y$ be a subspace of a topological vector space $X$. If $Y$ is an F-space in the topology inherited from $X$, then $Y$ is a closed subspace of $X$.`,
      idea: String.raw`Let $d$ be a complete invariant metric on $Y$ and $x\in\overline Y$. Choose neighbourhoods $V_n$ of $0$ in $X$ such that $Y\cap(V_n-V_n)$ lies in the $d$-ball of radius $1/n$. The sets $E_n=Y\cap(x+V_n)$ are nonempty, decreasing, and have $d$-diameter $<1/n$, so by completeness their $d$-closures meet in one point $y_0$. Testing against arbitrary neighbourhoods $W$ shows $y_0\in x+\overline W$ for all $W$, hence $y_0=x$ (1.13(a)), and $x\in Y$.`,
      caption: String.raw`The contrapositive in $X=C[0,1]$ (sup norm): $Y=$ all polynomials is not closed (its closure is all of $C[0,1]$), so it cannot be complete. Pick $f$ and raise $n$: the Taylor polynomials $p_n$ (blue) form a Cauchy sequence in $Y$ — the right panel shows $\sup_{m>n}\norm{p_m-p_n}_\infty$ on a log scale — but they converge to $f\notin Y$ (dashed). The Cauchy sequence has no limit inside $Y$.`,
      deps: ['fa-1.8', 'fa-1.25', 'fa-1.13'],
      see: ['pma-3.10'],
      tags: ['F-spaces', 'completeness', 'closed subspaces'],
      viz(v) {
        const FN = {
          exp: { label: '$e^{t}$', f: (t) => Math.exp(t), c: (k) => 1 / v.M.factorial(k) },
          sin: { label: '$\\sin 4t$', f: (t) => Math.sin(4 * t), c: (k) => (k % 2 ? Math.pow(4, k) * ((k - 1) / 2 % 2 ? -1 : 1) / v.M.factorial(k) : 0) },
          geo: { label: '$\\frac{1}{1.25-t}$', f: (t) => 1 / (1.25 - t), c: (k) => Math.pow(1 / 1.25, k + 1) },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const nS = v.slider('$n$', 0, 30, 5, { int: true });
        const L = v.stage({ x: [0, 1], y: [-1.5, 3], height: 320, axes: 'box', title: 'Taylor polynomials $p_n\\in Y$ and the limit $f$' });
        const R = v.stage({ x: [0, 30], y: [-12, 1.5], height: 320, axes: 'box', title: '$\\log_{10}\\sup_{m>n}\\|p_m-p_n\\|_\\infty$' });
        let last = null, st = {}; const cache = {};
        v.render(() => {
          const F = FN[which.value], n = nS.value;
          if (last !== which.value) { last = which.value; const lo = Math.min(0, ...Array.from({ length: 41 }, (_, i) => F.f(i / 40))), hi = Math.max(...Array.from({ length: 41 }, (_, i) => F.f(i / 40))); L.setView([0, 1], [lo - 0.25 * (hi - lo) - 0.2, hi + 0.25 * (hi - lo) + 0.2]); }
          const P = (m) => (t) => { let s = 0, tk = 1; for (let k = 0; k <= m; k++) { s += F.c(k) * tk; tk *= t; } return s; };
          const sup = (g) => { let m = 0; for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(g(i / 200))); return m; };
          if (!cache[which.value]) {
            const T = []; const cur = new Float64Array(201);
            for (let j = 0; j <= 45; j++) { for (let i = 0; i <= 200; i++) cur[i] += F.c(j) * Math.pow(i / 200, j); T.push(Float64Array.from(cur)); }
            const tl = [];
            for (let k2 = 0; k2 <= 30; k2++) { let m = 0; for (let j = k2 + 1; j <= 45; j++) for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(T[j][i] - T[k2][i])); tl.push([k2, Math.log10(Math.max(1e-13, m))]); }
            cache[which.value] = tl;
          }
          for (let m = 0; m < n; m++) L.fn(P(m), { color: 'faint', width: 1 });
          L.fn(F.f, { color: 'red', width: 2, dash: [6, 4] });
          L.fn(P(n), { color: 'blue', width: 2.6 });
          L.tex('p_{' + n + '}', 0.12, P(n)(0.12), { color: 'blue', align: 'right', dx: -6, dy: -12 });
          // Cauchy tails
          const tail = cache[which.value];
          R.setView(null, [Math.max(-13, Math.min(...tail.map((q) => q[1]))) - 0.5, Math.max(...tail.map((q) => q[1])) + 0.8]);
          R.path(tail, { color: 'blue', width: 2.2 });
          R.dot(n, tail[n][1], { color: 'blue', r: 5 });
          const err = sup((t) => P(n)(t) - F.f(t));
          st = { n, tail: Math.pow(10, tail[n][1]), err };
        });
        v.legend([['blue', '$p_n$ (polynomial)'], ['red', '$f\\notin Y$', { dash: true }]]);
        v.readout(() => `$\\sup_{m>${st.n}}\\|p_m-p_{${st.n}}\\|_\\infty \\approx ${v.fmt(st.tail, 3)}$ and $\\|p_{${st.n}}-f\\|_\\infty = ${v.fmt(st.err, 3)}$: a Cauchy sequence in $Y$ converging in $X$ to a point outside $Y$. So $Y$ is not complete — as 1.27 requires of a non-closed subspace.`);
      },
    },
    // ------------------------------------------------------------------ 1.28
    {
      num: '1.28',
      kind: 'Theorem',
      name: 'Null sequences can be blown up and still converge',
      statement: String.raw`(a) If $d$ is a translation-invariant metric on a vector space $X$, then $d(nx,0)\le n\,d(x,0)$ for every $x\in X$ and $n=1,2,3,\dots$
(b) If $(x_n)$ is a sequence in a metrizable topological vector space with $x_n\to0$, then there are positive scalars $\gamma_n\to\infty$ such that $\gamma_nx_n\to 0$.`,
      idea: String.raw`(a) By invariance, $d(kx,(k-1)x)=d(x,0)$, and the triangle inequality adds up $n$ such steps. (b) Use an invariant metric (1.24). Since $d(x_n,0)\to0$ there are $n_1<n_2<\cdots$ with $d(x_n,0)<k^{-2}$ for $n\ge n_k$. Put $\gamma_n=k$ for $n_k\le n<n_{k+1}$; then by (a), $d(\gamma_nx_n,0)\le k\,d(x_n,0)<1/k$.`,
      caption: String.raw`Right, (b): a null sequence $x_n$ in $\R$ with the invariant metric $d(x,y)=\frac{\abs{x-y}}{1+\abs{x-y}}$, on log–log axes. The orange staircase is Rudin's $\gamma_n=k$ on $[n_k,n_{k+1})$; the green curve $d(\gamma_nx_n,0)$ stays below the dashed bound $1/k$ and still tends to $0$, even for the very slow $1/\log n$. Left, (a): $d(kx,0)$ against the line $k\,d(x,0)$; drag $x$.`,
      deps: ['fa-1.24'],
      tags: ['metrization', 'sequences'],
      viz(v) {
        const SEQ = { sqrt: { label: '$n^{-1/2}$', f: (n) => 1 / Math.sqrt(n) }, quart: { label: '$n^{-1/4}$', f: (n) => Math.pow(n, -0.25) }, log: { label: '$1/\\log(n+1)$', f: (n) => 1 / Math.log(n + 1) } };
        const which = v.select('$x_n$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const A = v.stage({ x: [0, 8.5], y: [0, 2.2], height: 320, axes: 'box', weight: 0.75, minWidth: 220, xlabel: 'k', title: '(a) $d(kx,0)\\le k\\,d(x,0)$' });
        const B = v.stage({ x: [0, 5], y: [-3.2, 1.3], height: 320, axes: 'box', weight: 1.4, xlabel: 'log₁₀ n', xticks: [0, 1, 2, 3, 4, 5], yticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1'], [1, '10']], title: '(b) $d(x_n,0)$, $\\gamma_n$ and $d(\\gamma_nx_n,0)$' });
        const xS = v.slider('$x$ (part a)', 0.05, 2, 0.35, { step: 0.01 });
        const d0 = (x) => Math.abs(x) / (1 + Math.abs(x));
        let st = {};
        v.render(() => {
          const x = xS.value;
          const pts = [], line = [];
          for (let k = 0; k <= 8; k++) { pts.push([k, d0(k * x)]); line.push([k, k * d0(x)]); }
          A.path(line, { color: 'muted', width: 1.6, dash: [5, 4] });
          A.path(pts, { color: 'blue', width: 2.4 });
          A.dots(pts, { color: 'blue', r: 3 });
          A.hline(1, { color: 'faint', dash: [3, 3], width: 1 });
          A.text('k·d(x,0)', 8.3, Math.min(2.1, 8 * d0(x)), { color: 'muted', size: 11.5, align: 'right', baseline: 'bottom', dy: -4 });
          A.text('d(kx,0) < 1', 8.3, 0.97, { color: 'blue', size: 11.5, align: 'right', baseline: 'top' });
          A.setTitle(`(a) $x=${v.fix(x, 2)}$: $d(kx,0)\\le k\\,d(x,0)$`);
          // (b)
          const F = SEQ[which.value].f, Nmax = 1e5;
          const nk = []; for (let k = 1; k <= 60; k++) { let lo = 1, hi = Nmax * 10; if (d0(F(hi)) >= 1 / (k * k)) break; while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (d0(F(m)) < 1 / (k * k)) hi = m; else lo = m + 1; } nk.push(lo); }
          const gamma = (n) => { let k = 0; while (k < nk.length && nk[k] <= n) k++; return Math.max(1, k); };
          const D = [], G = [], DG = [], Bd = [];
          for (let i = 0; i <= 500; i++) { const L = 5 * i / 500, n = Math.round(Math.pow(10, L)); const g = gamma(n); D.push([L, Math.log10(d0(F(n)))]); G.push([L, Math.log10(g)]); DG.push([L, Math.log10(d0(g * F(n)))]); Bd.push([L, Math.log10(1 / g)]); }
          B.path(Bd, { color: 'green', width: 1.2, dash: [4, 3] });
          B.path(D, { color: 'blue', width: 2.2 });
          B.path(G, { color: 'orange', width: 2.4 });
          B.path(DG, { color: 'green', width: 2.4 });
          for (const n of nk) { const L = Math.log10(n); if (L <= 5) B.vline(L, { color: 'orange', width: 0.8, alpha: 0.35 }); }
          const gEnd = gamma(1e5);
          st = { gEnd, dEnd: d0(gEnd * F(1e5)), nk: nk.filter((n) => n <= 1e5).length };
        });
        v.legend([['blue', '$d(x_n,0)$'], ['orange', '$\\gamma_n$'], ['green', '$d(\\gamma_nx_n,0)$'], ['green', 'bound $1/\\gamma_n$', { dash: true }]]);
        v.readout(() => `At $n=10^5$: $\\gamma_n = ${st.gEnd}$ and $d(\\gamma_nx_n,0) = ${v.fmt(st.dEnd, 3)} < 1/${st.gEnd}$. The staircase climbs without bound while the product still tends to $0$.`);
      },
    },
  ],
};
