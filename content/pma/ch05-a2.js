// Rudin, Principles of Mathematical Analysis — Chapter 5: Differentiation (part 2: 5.10–5.19)

/** Roots of F in (a,b): sign changes on an n-cell grid, refined by bisection. */
function roots(F, a, b, n = 400) {
  const out = [];
  let x0 = a, f0 = F(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + (b - a) * i / n, f1 = F(x1);
    if (isFinite(f0) && isFinite(f1) && f0 * f1 < 0) {
      let lo = x0, hi = x1, flo = f0;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = F(m); if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m; }
      out.push((lo + hi) / 2);
    } else if (f1 === 0 && i < n) out.push(x1);
    x0 = x1; f0 = f1;
  }
  return out;
}

/** Robust y-range of a list of numbers (quantiles), padded. */
function yRange(vals, q = 0.02, pad = 0.12, minSpan = 0.5) {
  const s = vals.filter(isFinite).sort((p, r) => p - r);
  if (!s.length) return [-1, 1];
  let lo = s[Math.floor(q * (s.length - 1))], hi = s[Math.ceil((1 - q) * (s.length - 1))];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

/** Draw y = f(x) on [A,B] as separate pieces split at the points in `cuts`. */
function pieces(S, f, A, B, cuts, st, gap = 1e-9) {
  const pts = [A, ...cuts.filter((c) => c > A && c < B), B];
  for (let i = 0; i + 1 < pts.length; i++) S.fn(f, { ...st, domain: [pts[i] + (i ? gap : 0), pts[i + 1] - (i + 2 < pts.length ? gap : 0)] });
}

export default {
  collection: 'pma',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Theorem',
      name: 'Mean value theorem',
      statement: String.raw`If $f$ is a real continuous function on $[a,b]$ which is differentiable in $(a,b)$, then there is a point $x\in(a,b)$ at which
$$f(b)-f(a)=(b-a)\,f'(x).$$`,
      idea: String.raw`Take $g(x)=x$ in the generalized mean value theorem 5.9: then $g'\equiv1$ and its identity becomes $f(b)-f(a)=(b-a)f'(x)$. In words, the average rate of change over $[a,b]$ is attained as an instantaneous rate somewhere inside — the tangent at $x$ is parallel to the chord.`,
      caption: String.raw`Drag the endpoints $a$ and $b$. Green tangents are parallel to the dashed chord; in the lower panel they are the points where the graph of $f'$ crosses the level of the chord slope. Break a hypothesis: with the kink $|x-2|$ inside $[a,b]$, $f'$ jumps from $-0.8$ to $0.8$ straight over the chord slope; with a jump at $c=3$ inside $[a,b]$ the chord is dragged down and $f'$ never comes close to its slope.`,
      deps: ['pma-5.9'],
      see: ['pma-6.21', 'rca-7.21'],
      tags: ['mean value theorem', 'derivative'],
      viz(v) {
        const M = v.M, A0 = 0, B0 = 4;
        const FN = {
          smooth: { label: 'smooth', f: (x) => 0.3 + 0.12 * x * x + 0.45 * Math.sin(1.8 * x), bad: [], a: 0.3, b: 3.7 },
          kink: { label: 'kink $|x-2|$', f: (x) => 0.35 + 0.8 * Math.abs(x - 2), bad: [2], a: 0.6, b: 3.7 },
          jump: { label: 'jump at $c=3$', f: (x) => 0.5 + 0.38 * x - 0.045 * x * x - (x >= 3 ? 1.1 : 0), bad: [3], jump: 3, a: 0.5, b: 3.6 },
        };
        const which = v.select('', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'smooth');
        const F = () => FN[which.value];
        const top = v.stage({ x: [-0.15, 4.15], y: [-0.25, 2.8], height: 280, full: true });
        const bot = v.stage({ x: [-0.15, 4.15], y: [-1.5, 1.5], height: 190, full: true, title: "the derivative $f'$ and the chord slope $\\frac{f(b)-f(a)}{b-a}$" });
        const ha = top.handle(0.45, 0, { color: 'accent', label: 'a', constrain: (X) => [M.clamp(X, A0, hb.x - 0.2), 0] });
        const hb = top.handle(3.55, 0, { color: 'accent', label: 'b', constrain: (X) => [M.clamp(X, ha.x + 0.2, B0), 0] });
        let last = null, st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (last !== which.value) { last = which.value; ha.x = G.a; hb.x = G.b; }
          const a = ha.x, b = hb.x, fa = f(a), fb = f(b), m = (fb - fa) / (b - a);
          const d = (x) => M.deriv(f, x, 1e-6);
          const near = (x) => G.bad.some((c) => Math.abs(x - c) < 1e-3);
          // MVT points (exclude kinks/jumps); detect the "linear on [a,b]" case
          const samples = M.linspace(a, b, 200).filter((x) => !near(x));
          const flat = samples.every((x) => Math.abs(d(x) - m) < 1e-6);
          const xs = flat ? [] : roots((x) => d(x) - m, a + 1e-6, b - 1e-6, 500).filter((x) => !near(x) && Math.abs(d(x) - m) < 1e-4);
          const broken = G.bad.some((c) => c > a && c < b) || (G.jump != null && a < G.jump && b >= G.jump);
          // top
          top.vband(a, b, { color: 'accent', alpha: 0.06 });
          pieces(top, f, A0, B0, G.jump != null ? [G.jump] : [], { color: 'ink', width: 2.4 });
          if (G.jump != null) { top.dot(G.jump, f(G.jump - 1e-9), { hollow: true, color: 'ink', r: 4 }); top.dot(G.jump, f(G.jump), { color: 'ink', r: 4 }); }
          top.line(a, fa, b, fb, { color: 'accent', width: 1.8, dash: [7, 5] });
          top.line(a, 0, a, fa, { color: 'accent', width: 1, dash: [2, 3] }); top.line(b, 0, b, fb, { color: 'accent', width: 1, dash: [2, 3] });
          top.dot(a, fa, { color: 'accent', r: 4.5 }); top.dot(b, fb, { color: 'accent', r: 4.5 });
          for (const x of xs) { const y = f(x); top.line(x - 0.75, y - 0.75 * m, x + 0.75, y + 0.75 * m, { color: 'green', width: 2.2 }); top.dot(x, y, { color: 'green', r: 5 }); }
          if (xs.length) top.text('x', xs[0], f(xs[0]), { dy: -16, align: 'center', color: 'green', math: true });
          if (flat) top.corner('f is linear on [a, b]: every x works', 'tl', { color: 'green', weight: 600 });
          else if (!xs.length) top.corner(broken ? (G.jump != null ? 'f is not continuous on [a, b]: no parallel tangent' : 'f is not differentiable at 2: no parallel tangent') : 'no parallel tangent', 'tl', { color: 'red', weight: 600 });
          // bottom: f' and the level m
          const ds = M.linspace(A0, B0, 400).filter((x) => !near(x)).map(d);
          const [lo, hi] = yRange(ds.concat([m]), 0, 0.2, 0.8);
          bot.setView(null, [lo, hi]);
          bot.vband(a, b, { color: 'accent', alpha: 0.06 });
          bot.hline(m, { color: 'accent', width: 1.6, dash: [7, 5] });
          const cuts = G.bad;
          pieces(bot, d, A0, B0, cuts, { color: 'purple', width: 1.4, alpha: 0.45 }, 2e-3);
          pieces(bot, d, a, b, cuts, { color: 'purple', width: 2.6 }, 2e-3);
          for (const c of cuts) if (c > A0 && c < B0) { bot.dot(c, d(c - 2e-3), { hollow: true, color: 'purple', r: 4 }); bot.dot(c, d(c + 2e-3), { hollow: true, color: 'purple', r: 4 }); }
          for (const x of xs) bot.dot(x, m, { color: 'green', r: 5 });
          bot.text('chord slope', B0, m, { align: 'right', dy: -11, color: 'accent', size: 11.5 });
          v.legend([['ink', '$y=f(x)$'], ['accent', 'chord from $a$ to $b$', { dash: true }], ['green', "tangent parallel to the chord: $f'(x)=\\frac{f(b)-f(a)}{b-a}$"], ['purple', "$f'$"]]);
          st = { a, b, m, xs, flat, broken };
        });
        v.readout(() => {
          const s = st; if (s.a == null) return '';
          const base = `$\\dfrac{f(b)-f(a)}{b-a} = ${v.fmt(s.m, 4)}$`;
          if (s.flat) return base + ' — $f$ is linear on $[a,b]$, so every $x$ works.';
          if (s.xs.length) return base + ` $= f'(x)$ at $x = ${s.xs.map((x) => v.fix(x, 3)).join(',\\ ')}$.`;
          return base + ', but no $x\\in(a,b)$ has $f\'(x)$ equal to it: ' + (which.value === 'jump' ? 'continuity on $[a,b]$ fails.' : 'differentiability in $(a,b)$ fails.');
        });
      },
    },

    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Theorem',
      name: 'The sign of the derivative decides monotonicity',
      statement: String.raw`Let $f$ be differentiable in $(a,b)$.
(a) If $f'(x)\ge0$ for all $x\in(a,b)$, then $f$ is monotonically increasing on $(a,b)$.
(b) If $f'(x)=0$ for all $x\in(a,b)$, then $f$ is constant on $(a,b)$.
(c) If $f'(x)\le0$ for all $x\in(a,b)$, then $f$ is monotonically decreasing on $(a,b)$.`,
      idea: String.raw`For $a<x_1<x_2<b$ the mean value theorem 5.10, applied on $[x_1,x_2]$, gives $f(x_2)-f(x_1)=(x_2-x_1)\,f'(\xi)$ for some $\xi\in(x_1,x_2)$. The factor $x_2-x_1$ is positive, so the sign of the increment is the sign of $f'(\xi)$; all three statements follow.`,
      caption: String.raw`Drag the purple knots to shape $f'$ (or use the presets); the top panel shows the honest antiderivative $f(x)=\int_0^x f'$, coloured green where $f'>0$ and red where $f'<0$. Drag $x_1<x_2$ on the graph: the gold point $\xi$ is the mean value point, and the sign of $f'(\xi)$ is the sign of $f(x_2)-f(x_1)$. With $f'\equiv0$ the graph is flat.`,
      deps: ['pma-5.10'],
      tags: ['monotonicity', 'mean value theorem'],
      viz(v) {
        const M = v.M, A = 0, B = 4, K = 7, N = 800;
        const KX = M.linspace(A, B, K);
        const PRE = { mixed: [0.95, 0.45, -0.7, -0.35, 0.3, 0.85, -0.25], pos: [0.8, 0.3, 0, 0.55, 0.15, 0.9, 0.4], zero: [0, 0, 0, 0, 0, 0, 0], neg: [-0.45, -0.95, -0.2, -0.6, 0, -0.3, -0.75] };
        const top = v.stage({ x: [-0.12, 4.12], y: [-1, 1.6], height: 250, full: true, title: "$f(x)=\\int_0^x f'$ — green where $f'>0$, red where $f'<0$" });
        const bot = v.stage({ x: [-0.12, 4.12], y: [-1.4, 1.4], height: 200, full: true, title: "the derivative $f'$ (drag the knots)" });
        const knots = KX.map((x, i) => bot.handle(x, PRE.mixed[i], { color: 'purple', r: 6, constrain: (X, Y) => [x, M.clamp(Y, -1.3, 1.3)] }));
        const setPre = (k) => knots.forEach((h, i) => { h.y = PRE[k][i]; });
        v.button('mixed', () => setPre('mixed'));
        v.button("$f'\\ge 0$", () => setPre('pos'));
        v.button("$f'\\equiv 0$", () => setPre('zero'));
        v.button("$f'\\le 0$", () => setPre('neg'));
        const fp = (x) => {
          const s = M.clamp((x - A) / (B - A) * (K - 1), 0, K - 1 - 1e-12), i = Math.floor(s), u = s - i;
          return knots[i].y + (knots[i + 1].y - knots[i].y) * M.smoothstep(u);
        };
        const X = M.linspace(A, B, N + 1);
        let FV = [];
        const fAt = (x) => { const s = M.clamp((x - A) / (B - A) * N, 0, N), i = Math.min(N - 1, Math.floor(s)), u = s - i; return FV[i] + (FV[i + 1] - FV[i]) * u; };
        const h1 = top.handle(0.9, 0, { color: 'ink', label: 'x₁', constrain: (x) => { x = M.clamp(x, A + 0.02, h2.x - 0.1); return [x, fAt(x)]; } });
        const h2 = top.handle(2.7, 0, { color: 'ink', label: 'x₂', constrain: (x) => { x = M.clamp(x, h1.x + 0.1, B - 0.02); return [x, fAt(x)]; } });
        let st = {};
        v.render(() => {
          // honest antiderivative (Simpson on each cell)
          FV = [0];
          for (let i = 0; i < N; i++) { const a = X[i], b = X[i + 1]; FV.push(FV[i] + (b - a) / 6 * (fp(a) + 4 * fp((a + b) / 2) + fp(b))); }
          h1.y = fAt(h1.x); h2.y = fAt(h2.x);
          const [lo, hi] = yRange(FV, 0, 0.18, 1.2);
          top.setView(null, [lo, hi]);
          // top: coloured runs
          let run = [], cls = null;
          const col = (y) => (y > 1e-9 ? 'green' : y < -1e-9 ? 'red' : 'gray');
          const flush = () => { if (run.length > 1) top.path(run, { color: cls, width: 3 }); };
          for (let i = 0; i <= N; i++) { const c = col(fp(X[i])); if (c !== cls) { flush(); run = run.length ? [run[run.length - 1]] : []; cls = c; } run.push([X[i], FV[i]]); }
          flush();
          const x1 = h1.x, x2 = h2.x, y1 = fAt(x1), y2 = fAt(x2), m = (y2 - y1) / (x2 - x1);
          const xi = roots((x) => fp(x) - m, x1, x2, 300);
          const flat = Math.abs(m) < 1e-9 && M.linspace(x1, x2, 50).every((x) => Math.abs(fp(x)) < 1e-9);
          top.line(x1, y1, x2, y2, { color: 'gold', width: 1.8, dash: [6, 4] });
          const xs = xi.length ? xi[M.argmin(xi, (x) => Math.abs(x - (x1 + x2) / 2))] : (x1 + x2) / 2;
          if (xi.length || flat) { const y = fAt(xs); top.line(xs - 0.5, y - 0.5 * m, xs + 0.5, y + 0.5 * m, { color: 'gold', width: 2 }); top.dot(xs, y, { color: 'gold', r: 4.5, label: 'ξ', labelPos: 'n' }); }
          // bottom
          bot.vband(x1, x2, { color: 'gold', alpha: 0.08 });
          bot.fn((x) => Math.max(0, fp(x)), { domain: [A, B], fill: 'green', fillAlpha: 0.2, stroke: false });
          bot.fn((x) => Math.min(0, fp(x)), { domain: [A, B], fill: 'red', fillAlpha: 0.2, stroke: false });
          bot.path(KX.map((x, i) => [x, knots[i].y]), { color: 'purple', width: 1, dash: [2, 4], alpha: 0.5 });
          bot.fn(fp, { domain: [A, B], color: 'purple', width: 2.6 });
          bot.hline(m, { color: 'gold', width: 1.2, dash: [6, 4] });
          if (xi.length || flat) bot.dot(xs, fp(xs), { color: 'gold', r: 4.5 });
          const ks = knots.map((h) => h.y);
          const all = ks.every((y) => y === 0) ? 'zero' : ks.every((y) => y >= 0) ? 'pos' : ks.every((y) => y <= 0) ? 'neg' : null;
          const msg = { zero: ["f′ ≡ 0: f is constant", 'gray'], pos: ["f′ ≥ 0: f is increasing", 'green'], neg: ["f′ ≤ 0: f is decreasing", 'red'] }[all];
          if (msg) top.corner(msg[0], 'tl', { color: msg[1], weight: 600 });
          v.legend([['green', 'increasing piece'], ['red', 'decreasing piece'], ['purple', "$f'$"], ['gold', 'chord on $[x_1,x_2]$ and mean value point $\\xi$']]);
          const seg = M.linspace(x1, x2, 120).map(fp);
          st = { x1, x2, m, xs, ok: xi.length > 0 || flat, mn: Math.min(...seg), mx: Math.max(...seg), d: y2 - y1 };
        });
        v.readout(() => {
          const s = st; if (s.x1 == null) return '';
          const sign = s.mn >= -1e-12 ? ` Since $f'\\ge0$ on $[x_1,x_2]$, the increment is $\\ge0$.` : s.mx <= 1e-12 ? ` Since $f'\\le0$ on $[x_1,x_2]$, the increment is $\\le0$.` : ` $f'$ changes sign on $[x_1,x_2]$, so 5.11 predicts nothing.`;
          return `$f(x_2)-f(x_1) = ${v.fmt(s.d, 3)} = (x_2-x_1)\\,f'(\\xi)$ with $\\xi = ${v.fix(s.xs, 3)}$, $f'(\\xi) = ${v.fmt(s.m, 3)}$.` + sign;
        });
      },
    },

    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: "Darboux's theorem: intermediate values of derivatives",
      statement: String.raw`Let $f$ be a real differentiable function on $[a,b]$ and suppose $f'(a)<\lambda<f'(b)$. Then there is a point $x\in(a,b)$ with $f'(x)=\lambda$. (The same holds if $f'(a)>\lambda>f'(b)$.)`,
      idea: String.raw`Tilt the graph: $g(t)=f(t)-\lambda t$ has $g'(a)<0$ and $g'(b)>0$, so $g$ dips below $g(a)$ just right of $a$ and below $g(b)$ just left of $b$. Being continuous on the compact interval, $g$ attains its minimum (4.16), and by the previous remark not at an endpoint. At that interior minimum $g'(x)=0$ (5.8), i.e. $f'(x)=\lambda$. No continuity of $f'$ is needed.`,
      caption: String.raw`Drag $a$ and $b$ along the graph of $f'$ (bottom) and the level $\lambda$. The top panel shows the tilted function $g(t)=f(t)-\lambda t$: its slopes at the ends point into the interval (orange), so its minimum on $[a,b]$ (green) is interior, and there $f'(x)=\lambda$. Try $x^2\sin(1/x)$: its derivative is discontinuous at $0$ yet still hits every intermediate value.`,
      deps: ['pma-5.8', 'pma-4.16', 'pma-5.1'],
      tags: ['derivative', 'intermediate value'],
      viz(v) {
        const M = v.M;
        const FN = {
          smooth: { label: '$\\frac12\\sin 2x+0.15x^2$', f: (x) => 0.5 * Math.sin(2 * x) + 0.15 * x * x, d: (x) => Math.cos(2 * x) + 0.3 * x, D: [0, 3], a: 1.35, b: 2.8, lam: 0.35, n: 600 },
          wild: { label: '$x^2\\sin(1/x)$', f: (x) => (x ? x * x * Math.sin(1 / x) : 0), d: (x) => (x ? 2 * x * Math.sin(1 / x) - Math.cos(1 / x) : 0), D: [-0.3, 0.3], a: -0.2, b: 0.25, lam: -0.15, n: 6000 },
        };
        const which = v.select('$f(x)=$', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'smooth');
        const F = () => FN[which.value];
        const top = v.stage({ x: [-0.1, 3.1], y: [-1, 1], height: 240, full: true, title: 'the tilted function $g(t)=f(t)-\\lambda t$ on $[a,b]$' });
        const bot = v.stage({ x: [-0.1, 3.1], y: [-1.3, 2], height: 230, full: true, title: "the derivative $f'$ and the level $\\lambda$" });
        const onD = (X) => { const G = F(); X = M.clamp(X, G.D[0], G.D[1]); return [X, G.d(X)]; };
        const ha = bot.handle(1.35, 0, { color: 'accent', label: 'a', constrain: (X) => onD(Math.min(X, hb.x - 0.02)) });
        const hb = bot.handle(2.8, 0, { color: 'accent', label: 'b', constrain: (X) => onD(Math.max(X, ha.x + 0.02)) });
        const hl = bot.handle(0, 0.35, { color: 'orange', label: 'λ', constrain: 'y' });
        hl.labelPos = 'e';
        let last = null, st = {};
        v.render(() => {
          const G = F(), f = G.f, d = G.d;
          if (last !== which.value) {
            last = which.value;
            const w = G.D[1] - G.D[0];
            top.setView([G.D[0] - 0.03 * w, G.D[1] + 0.03 * w], null); bot.setView([G.D[0] - 0.03 * w, G.D[1] + 0.03 * w], null);
            ha.x = G.a; hb.x = G.b; hl.y = G.lam;
          }
          const a = ha.x, b = hb.x, lam = hl.y; ha.y = d(a); hb.y = d(b); hl.x = bot.bounds.x[0] + 0.035 * (bot.bounds.x[1] - bot.bounds.x[0]);
          const g = (t) => f(t) - lam * t;
          const da = d(a), db = d(b), between = (da < lam && lam < db) || (db < lam && lam < da);
          const wantMin = da < db;
          // extremum of g on [a,b]
          const ts = M.linspace(a, b, G.n), gs = ts.map(g);
          const k = wantMin ? M.argmin(gs) : M.argmax(gs), xstar = ts[k];
          const interior = k > 0 && k < ts.length - 1;
          // top
          const gD = M.linspace(G.D[0], G.D[1], 400).map(g);
          const [lo, hi] = yRange(gD.concat(gs), 0, 0.15, 0.1);
          top.setView(null, [lo, hi]);
          top.fn(g, { domain: G.D, color: 'ink', width: 1.2, alpha: 0.35, n: G.n });
          top.fn(g, { domain: [a, b], color: 'ink', width: 2.6, n: G.n });
          top.vline(a, { color: 'accent', width: 1, dash: [2, 4] }); top.vline(b, { color: 'accent', width: 1, dash: [2, 4] });
          const L = 0.07 * (G.D[1] - G.D[0]);
          top.arrow(a, g(a), a + L, g(a) + (da - lam) * L, { color: 'orange', width: 2.2, head: 8 });
          top.arrow(b, g(b), b - L, g(b) - (db - lam) * L, { color: 'orange', width: 2.2, head: 8 });
          top.dot(a, g(a), { color: 'accent', r: 4 }); top.dot(b, g(b), { color: 'accent', r: 4 });
          top.dot(xstar, gs[k], { color: interior ? 'green' : 'red', r: 6, label: interior ? (wantMin ? 'min of g' : 'max of g') : 'extremum at an endpoint', labelPos: 's', math: false });
          // bottom
          const dD = M.linspace(G.D[0], G.D[1], 600).map(d);
          const [blo, bhi] = yRange(dD.concat([lam]), 0, 0.12, 0.6);
          bot.setView(null, [blo, bhi]);
          bot.vband(a, b, { color: 'accent', alpha: 0.07 });
          bot.hband(Math.min(da, db), Math.max(da, db), { color: 'orange', alpha: 0.08 });
          bot.fn(d, { domain: G.D, color: 'purple', width: which.value === 'wild' ? 1.1 : 2.4, n: G.n, connect: true });
          bot.hline(lam, { color: 'orange', width: 1.6 });
          const sol = roots((t) => d(t) - lam, a, b, G.n);
          for (const s of sol) bot.dot(s, lam, { color: 'orange', r: 2.6 });
          if (interior) bot.dot(xstar, d(xstar), { color: 'green', r: 6, label: 'x', labelPos: 'n' });
          top.corner(between ? `f′(a) = ${v.fmt(da, 3)} < λ < f′(b) = ${v.fmt(db, 3)}` : 'λ is not between f′(a) and f′(b): no promise', 'tr', { color: between ? 'green' : 'red', weight: 600 });
          v.legend([['ink', '$g=f-\\lambda t$'], ['orange', "slopes $g'(a)$, $g'(b)$ and the level $\\lambda$"], ['purple', "$f'$"], ['green', "the interior extremum: $f'(x)=\\lambda$", { dot: true }]]);
          st = { a, b, lam, da, db, xstar, interior, between, n: sol.length, wantMin };
        });
        v.readout(() => {
          const s = st; if (s.a == null) return '';
          const head = `$f'(a) = ${v.fmt(s.da, 3)},\\ f'(b) = ${v.fmt(s.db, 3)},\\ \\lambda = ${v.fmt(s.lam, 3)}$. `;
          if (!s.interior) return head + `$g$ is extremal at an endpoint, so the argument gives nothing` + (s.n ? ` (here ${s.n} solution${s.n > 1 ? 's' : ''} of $f'=\\lambda$ exist anyway).` : '.');
          return head + `$g$ has its ${s.wantMin ? 'minimum' : 'maximum'} on $[a,b]$ at $x = ${v.fix(s.xstar, 4)}$, where $f'(x) = ${v.fmt(F().d(s.xstar), 3)}$` + (s.n > 1 ? ` (one of ${s.n} solutions found).` : '.');
        });
      },
    },

    // ------------------------------------------------------------------ 5.12a
    {
      num: '5.12a',
      kind: 'Corollary',
      name: 'Derivatives have no simple discontinuities',
      statement: String.raw`If $f$ is differentiable on $[a,b]$, then $f'$ has no simple discontinuities (discontinuities of the first kind) on $[a,b]$. Discontinuities of the second kind are possible.`,
      idea: String.raw`Suppose $f'(c-)=L$ and $f'(c+)=R$ exist with, say, $L<R$ but $f'$ is discontinuous at $c$. Near $c$ the values of $f'$ cluster at $L$ on the left and at $R$ on the right, so on a small interval $[c-\delta,c+\delta]$ some value strictly between the endpoint values (and different from $f'(c)$) is never attained — contradicting Darboux's theorem 5.12. The function $x^2\sin(1/x)$ shows the second kind does occur.`,
      caption: String.raw`Two candidates for a derivative near $c=0$. The **jump** skips every value in the red band on every interval about $c$, which Darboux forbids; indeed its antiderivative $F$ (top) has a corner at $c$, with one-sided slopes $0.35$ and $1.15$. The **oscillation** $f'(x)=2x\sin(1/x)-\cos(1/x)$ is a genuine derivative ($f=x^2\sin(1/x)$, $f'(0)=0$): on every $[-\delta,\delta]$ it sweeps through all of the green band. Shrink $\delta$.`,
      deps: ['pma-5.12', 'pma-4.26'],
      tags: ['derivative', 'discontinuities'],
      viz(v) {
        const M = v.M, c = 0;
        const CASES = {
          jump: { label: 'jump (not a derivative)', s: (x) => (x < c ? 0.35 : 1.15), F: (x) => (x < c ? 0.35 * (x + 1) - 0.35 : 1.15 * x), n: 800 },
          osc: { label: 'oscillation (a derivative)', s: (x) => (x ? 2 * x * Math.sin(1 / x) - Math.cos(1 / x) : 0), F: (x) => (x ? x * x * Math.sin(1 / x) : 0), n: 8000 },
        };
        const which = v.select('', Object.entries(CASES).map(([value, C]) => ({ value, label: C.label })), 'jump');
        const dl = v.slider('$\\delta$', 0.01, 0.8, 0.3, { log: true, fmt: (x) => v.fmt(x, 2) });
        const top = v.stage({ x: [-1.05, 1.05], y: [-0.6, 1.3], height: 230, full: true, title: 'the antiderivative $F(x)=\\int_{-1}^{x}(\\cdot)$ near $c=0$, with secants from $c$' });
        const bot = v.stage({ x: [-1.05, 1.05], y: [-1.6, 1.6], height: 240, full: true, title: 'the candidate derivative, and the values it takes on $[c-\\delta,\\,c+\\delta]$' });
        let st = {};
        v.render(() => {
          const C = CASES[which.value], s = C.s, Fn = C.F, d = dl.value, jump = which.value === 'jump';
          // top: F and the one-sided secants at c
          if (jump) { top.setView(null, [-0.55, 1.3]); top.fn(Fn, { domain: [-1, 1], color: 'ink', width: 2.4 }); }
          else { top.setView(null, [-0.95, 0.95]); top.fn(Fn, { domain: [-1, 1], color: 'ink', width: 2.4, n: C.n }); }
          bot.setView(null, jump ? [-0.35, 1.65] : [-2.3, 2.3]);
          top.vband(c - d, c + d, { color: 'accent', alpha: 0.07 });
          const sl = (Fn(c) - Fn(c - d)) / d, sr = (Fn(c + d) - Fn(c)) / d;
          top.line(c - d, Fn(c - d), c, Fn(c), { color: 'teal', width: 2.2 }); top.line(c, Fn(c), c + d, Fn(c + d), { color: 'purple', width: 2.2 });
          top.dot(c - d, Fn(c - d), { color: 'teal', r: 4 }); top.dot(c + d, Fn(c + d), { color: 'purple', r: 4 }); top.dot(c, Fn(c), { color: 'ink', r: 4.5 });
          top.corner(jump ? `corner at c: left slope ${v.fmt(sl, 3)}, right slope ${v.fmt(sr, 3)} — F′(c) does not exist` : `secant slopes ${v.fmt(sl, 3)}, ${v.fmt(sr, 3)} → 0 = f′(0)`, 'tl', { color: jump ? 'red' : 'green', weight: 600 });
          // bottom
          const ts = M.linspace(c - d, c + d, 4001), vals = ts.map(s);
          const lo = Math.min(...vals), hi = Math.max(...vals);
          bot.vband(c - d, c + d, { color: 'accent', alpha: 0.07, edges: true });
          if (jump) {
            bot.hband(0.35, 1.15, { color: 'red', alpha: 0.13 });
            bot.fn(s, { domain: [-1, c - 1e-9], color: 'purple', width: 2.6 }); bot.fn(s, { domain: [c, 1], color: 'purple', width: 2.6 });
            bot.dot(c, 0.35, { hollow: true, color: 'purple', r: 4.5 }); bot.dot(c, 1.15, { color: 'purple', r: 4.5 });
            bot.text('values never taken near c', -0.98, 0.75, { color: 'red', size: 12, weight: 600 });
          } else {
            bot.hband(lo, hi, { color: 'green', alpha: 0.12 });
            bot.fn(s, { domain: [-1, 1], color: 'purple', width: 1, n: C.n, connect: true });
            bot.dot(0, 0, { color: 'ink', r: 4.5 });
            bot.corner(`on [−δ, δ] every value in [${v.fix(lo, 2)}, ${v.fix(hi, 2)}] is taken; black dot: f′(0) = 0`, 'tl', { color: 'green', weight: 600 });
          }
          // value set on the right edge
          const X = bot.bounds.x[1] - 0.025 * (bot.bounds.x[1] - bot.bounds.x[0]);
          if (jump) { bot.dot(X, 0.35, { color: 'accent', r: 4 }); bot.dot(X, 1.15, { color: 'accent', r: 4 }); bot.line(X, 0.35, X, 1.15, { color: 'red', width: 2, dash: [3, 3] }); }
          else bot.line(X, lo, X, hi, { color: 'accent', width: 5, cap: 'butt' });
          v.legend([['teal', 'left secant'], ['purple', 'right secant / candidate derivative'], [jump ? 'red' : 'green', jump ? 'gap forbidden by Darboux' : 'every value attained', { area: true }], ['accent', 'interval $[c-\\delta,c+\\delta]$', { area: true }]]);
          st = { jump, sl, sr, lo, hi, d };
        });
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          if (s.jump) return `On $[-\\delta,\\delta]$ with $\\delta = ${v.fmt(s.d, 2)}$ the candidate only takes the values $0.35$ and $1.15$. A derivative would have to take every value in between (5.12), so a function with a simple discontinuity is never a derivative.`;
          return `On $[-\\delta,\\delta]$ the derivative takes every value in $[${v.fix(s.lo, 3)},\\,${v.fix(s.hi, 3)}]$, however small $\\delta$ is: $f'(0+)$ does not exist, so this discontinuity is of the second kind.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Theorem',
      name: "L'Hospital's rule",
      statement: String.raw`Let $f$ and $g$ be real and differentiable in $(a,b)$, where $-\infty\le a<b\le+\infty$, with $g'(x)\ne0$ for every $x\in(a,b)$, and suppose that
$$\frac{f'(x)}{g'(x)}\to A\qquad\text{as }x\to a$$
for some $A$ in the extended real number system. If $f(x)\to0$ and $g(x)\to0$ as $x\to a$, or if $g(x)\to+\infty$ as $x\to a$, then
$$\frac{f(x)}{g(x)}\to A\qquad\text{as }x\to a .$$
The analogous statements hold as $x\to b$, and when $g(x)\to-\infty$.`,
      idea: String.raw`Suppose $A<+\infty$, pick $q>A$ and then $r$ with $A<r<q$; close to $a$ we have $f'/g'<r$. For $a<x<y$ near $a$, Cauchy's mean value theorem 5.9 gives $\frac{f(x)-f(y)}{g(x)-g(y)}=\frac{f'(t)}{g'(t)}<r$ for some $t$ between them. In the $0/0$ case let $x\to a$: $f(y)/g(y)\le r<q$. In the $\infty/\infty$ case multiply out, divide by $g(x)$ and let $x\to a$: the fixed values $f(y)$, $g(y)$ become negligible and $f(x)/g(x)<q$ near $a$. A symmetric argument bounds the ratio from below when $A>-\infty$.`,
      caption: String.raw`The left panel draws the curve $x\mapsto(g(x),f(x))$, so the ratio $f/g$ is the slope of the blue segment from the origin and $f'/g'$ is the slope of the orange tangent. Push $x$ toward $a$ (log scale): for $0/0$ the curve runs into the origin and both slopes approach the green slope $A$; for $\infty/\infty$ it runs off to infinity in direction $A$. When neither hypothesis holds the curve stops at $(1,1)$ instead of the origin, and the two slopes part ways.`,
      deps: ['pma-5.9', 'pma-4.33'],
      tags: ['limits', 'mean value theorem'],
      viz(v) {
        const M = v.M;
        const CASES = {
          zz: { label: '$0/0$: $\\frac{e^{3x}-1}{\\sin 2x}$', f: (x) => Math.expm1(3 * x), g: (x) => Math.sin(2 * x), df: (x) => 3 * Math.exp(3 * x), dg: (x) => 2 * Math.cos(2 * x), A: 1.5, lim: [0, 0] },
          ii: { label: '$\\infty/\\infty$: $\\frac{2/x+\\log x}{1/x}$', f: (x) => 2 / x + Math.log(x), g: (x) => 1 / x, df: (x) => -2 / (x * x) + 1 / x, dg: (x) => -1 / (x * x), A: 2, lim: null },
          bad: { label: 'neither: $\\frac{1+x}{1+2x}$', f: (x) => 1 + x, g: (x) => 1 + 2 * x, df: () => 1, dg: () => 2, A: 0.5, lim: [1, 1] },
        };
        const which = v.select('', Object.entries(CASES).map(([value, C]) => ({ value, label: C.label })), 'zz');
        const XM = 0.7;
        const sx = v.slider('$x-a$', 0.001, XM, 0.2, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, title: 'the curve $x\\mapsto(g(x),\\,f(x))$', xlabel: 'g', ylabel: 'f' });
        const R = v.stage({ x: [-3.08, Math.log10(0.7) + 0.04], y: [0, 1], height: 340, axes: 'box', title: 'the two ratios against $x-a$ (log scale)', xticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [Math.log10(0.5), '0.5']] });
        let st = {};
        v.render(() => {
          const C = CASES[which.value], s = sx.value;
          const P = [C.g(s), C.f(s)], r1 = P[1] / P[0], r2 = C.df(s) / C.dg(s);
          // view: origin, the current point (and the limit point)
          const xs = [0, P[0]], ys = [0, P[1]];
          if (C.lim) { xs.push(C.lim[0]); ys.push(C.lim[1]); }
          const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-9);
          L.setView([Math.min(...xs) - 0.25 * span, Math.max(...xs) + 0.25 * span], [Math.min(...ys) - 0.25 * span, Math.max(...ys) + 0.25 * span]);
          const big = 4 * span;
          L.line(-big, -big * C.A, big, big * C.A, { color: 'green', width: 1.6, dash: [7, 5] });
          // the curve (log-spaced parameter), faint before x, solid after
          const us = M.linspace(-4, Math.log10(XM), 500).map((u) => 10 ** u);
          L.path(us.filter((u) => u <= s).map((u) => [C.g(u), C.f(u)]), { color: 'ink', width: 1.4, alpha: 0.35 });
          L.path(us.filter((u) => u >= s).map((u) => [C.g(u), C.f(u)]).concat([P]), { color: 'ink', width: 2.4 });
          if (C.lim && (C.lim[0] || C.lim[1])) L.dot(C.lim[0], C.lim[1], { hollow: true, color: 'red', r: 5, width: 2, label: 'limit of (g, f) as x → a', labelPos: 'nw', math: false });
          // slopes
          L.line(0, 0, P[0], P[1], { color: 'accent', width: 2.4 });
          const dir = M.normalize([C.dg(s), C.df(s)]);
          L.line(P[0] - dir[0] * big, P[1] - dir[1] * big, P[0] + dir[0] * big, P[1] + dir[1] * big, { color: 'orange', width: 2 });
          L.dot(0, 0, { color: 'ink', r: 3.5 });
          L.dot(P[0], P[1], { color: 'gold', r: 5.5 });
          // right panel
          const grid = M.linspace(-3, Math.log10(XM), 300), q1 = grid.map((u) => { const x = 10 ** u; return C.f(x) / C.g(x); }), q2 = grid.map((u) => { const x = 10 ** u; return C.df(x) / C.dg(x); });
          const ucut = Math.log10(s) + 0.15;
          const [lo, hi] = yRange(q1.filter((_, i) => grid[i] <= ucut).concat(q2.filter((_, i) => grid[i] <= ucut), [C.A, r1, r2]), 0, 0.12, 0.4);
          R.setView(null, [lo, hi]);
          R.hline(C.A, { color: 'green', width: 1.6, dash: [7, 5] });
          R.path(grid.map((u, i) => [u, q2[i]]), { color: 'orange', width: 2.4 });
          R.path(grid.map((u, i) => [u, q1[i]]), { color: 'accent', width: 2.4 });
          const ul = Math.log10(s);
          R.vline(ul, { color: 'gold', width: 1.2, dash: [3, 3] });
          R.dot(ul, r1, { color: 'accent', r: 4.5 }); R.dot(ul, r2, { color: 'orange', r: 4.5 });
          R.text(`A = ${v.fmt(C.A, 3)}`, R.bounds.x[1], C.A, { align: 'right', dx: -6, dy: -12, color: 'green', size: 11.5, weight: 600 });
          v.legend([['accent', "slope $f(x)/g(x)$"], ['orange', "slope $f'(x)/g'(x)$"], ['green', 'slope $A=\\lim f\'/g\'$', { dash: true }], ['gold', 'current $x$', { dot: true }]]);
          st = { s, r1, r2, A: C.A };
        });
        v.readout(() => {
          const s = st; if (s.s == null) return '';
          const tail = which.value === 'bad' ? ' — here $f$ and $g$ tend to $1$, so the rule does not apply: $f/g\\to1$ although $f\'/g\'\\to\\tfrac12$.' : which.value === 'ii' ? ' — $f/g = 2 + x\\log x$ converges, but more slowly than $f\'/g\' = 2 - x$.' : '';
          return `$x-a = ${v.fmt(s.s, 3)}$: $\\;\\dfrac{f(x)}{g(x)} = ${v.fmt(s.r1, 5)}$, $\\;\\dfrac{f'(x)}{g'(x)} = ${v.fmt(s.r2, 5)}$, $\\;A = ${v.fmt(s.A, 3)}$` + tail;
        });
      },
    },

    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Definition',
      name: 'Derivatives of higher order',
      statement: String.raw`If $f$ has a derivative $f'$ on an interval and $f'$ is itself differentiable, the derivative of $f'$ is written $f''$ and called the *second derivative* of $f$. Continuing in this way one obtains $f,\ f',\ f'',\ f^{(3)},\dots,f^{(n)}$, each the derivative of its predecessor; $f^{(n)}$ is the *$n$th derivative*, or derivative of order $n$, of $f$. For $f^{(n)}(x)$ to exist, $f^{(n-1)}(t)$ must exist for all $t$ in a neighbourhood of $x$ (a one-sided neighbourhood if $x$ is an endpoint of the interval) and be differentiable at $x$; consequently $f^{(n-2)}$ must be differentiable throughout that neighbourhood.`,
      idea: String.raw`Each derivative is obtained from the previous one by Definition 5.1, so the existence of $f^{(n)}$ at a single point already forces all lower derivatives to exist near that point. Taylor's theorem 5.15 is stated in precisely these terms.`,
      caption: String.raw`The panels show $f,\ f',\ f'',\ f'''$. Drag $x_0$ along the top-left graph: the tangent drawn in each panel has slope equal to the value marked in the next one. For $x|x|$ and $x^2|x|$ the chain of derivatives breaks at $0$ (red): a derivative that has a corner or a jump at $0$ cannot be differentiated there. $\sin x$ never breaks.`,
      deps: ['pma-5.1'],
      tags: ['derivative'],
      viz(v) {
        const M = v.M, D = [-1.2, 1.2], sg = Math.sign;
        // each family: list of [function, existsAt0] for orders 0..3
        const FAM = {
          k1: { label: '$x|x|$', d: [(x) => x * Math.abs(x), (x) => 2 * Math.abs(x), (x) => 2 * sg(x), () => 0], ok: [true, true, false, false], jump: [false, false, true, false] },
          k2: { label: '$x^2|x|$', d: [(x) => Math.abs(x) ** 3, (x) => 3 * x * Math.abs(x), (x) => 6 * Math.abs(x), (x) => 6 * sg(x)], ok: [true, true, true, false], jump: [false, false, false, true] },
          sin: { label: '$\\sin 2x$', d: [(x) => Math.sin(2 * x), (x) => 2 * Math.cos(2 * x), (x) => -4 * Math.sin(2 * x), (x) => -8 * Math.cos(2 * x)], ok: [true, true, true, true], jump: [false, false, false, false] },
        };
        const which = v.select('$f(x)=$', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'k1');
        const NAMES = ['f', "f'", "f''", "f'''"], COLS = ['ink', 'accent', 'purple', 'teal'];
        const S = NAMES.map((n, k) => v.stage({ x: [D[0] - 0.08, D[1] + 0.08], y: [-1, 1], height: 190, minWidth: 330, title: `$${n}$` }));
        const hx = S[0].handle(0.6, 0, { color: 'gold', label: 'x₀', constrain: (X) => { X = M.clamp(X, D[0], D[1]); if (Math.abs(X) < 0.06) X = 0; return [X, FAM[which.value].d[0](X)]; } });
        let st = {};
        v.render(() => {
          const F = FAM[which.value], x0 = hx.x; hx.y = F.d[0](x0);
          const vals = [];
          for (let k = 0; k < 4; k++) {
            const s = S[k], fk = F.d[k];
            const ys = M.linspace(D[0], D[1], 200).map(fk);
            const [lo, hi] = yRange(ys, 0, 0.15, 1);
            s.setView(null, [lo, hi + 0.25 * (hi - lo)]);
            s.vline(x0, { color: 'gold', width: 1, dash: [3, 4], alpha: 0.8 });
            if (F.jump[k]) { s.fn(fk, { domain: [D[0], -1e-9], color: COLS[k], width: 2.4 }); s.fn(fk, { domain: [1e-9, D[1]], color: COLS[k], width: 2.4 }); s.dot(0, fk(-1e-6), { hollow: true, color: COLS[k], r: 4 }); s.dot(0, fk(1e-6), { hollow: true, color: COLS[k], r: 4 }); }
            else s.fn(fk, { domain: D, color: COLS[k], width: 2.4, n: 400 });
            const exists = x0 !== 0 || F.ok[k];
            vals.push(exists ? fk(x0) : null);
            if (exists) {
              // tangent with slope = next derivative, coloured like the next panel
              if (k < 3 && (x0 !== 0 || F.ok[k + 1])) { const m = F.d[k + 1](x0), w = 0.35; s.line(x0 - w, fk(x0) - w * m, x0 + w, fk(x0) + w * m, { color: COLS[k + 1], width: 2.2 }); }
              s.dot(x0, fk(x0), { color: k ? COLS[k] : 'gold', r: 4.5 });
            }
            const nm = (j) => NAMES[j].replace(/'''/, '‴').replace(/''/, '″').replace(/'/, '′');
            if (!F.ok[k]) s.corner(F.ok[k - 1] ? `${nm(k)}(0) does not exist: ${nm(k - 1)} has a corner at 0` : `${nm(k)}(0) does not exist: ${nm(k - 1)}(0) already fails`, 'tl', { color: 'red', weight: 600 });
            else if (k < 3 && !F.ok[k + 1]) s.corner(`${nm(k)} exists at 0, but has a corner there`, 'tl', { color: 'orange', weight: 600 });
          }
          st = { x0, vals };
        });
        v.readout(() => {
          const s = st; if (s.x0 == null) return '';
          const parts = s.vals.map((y, k) => `$${NAMES[k]}(x_0) = ${y == null ? '\\text{—}' : v.fmt(y, 3)}$`);
          return `$x_0 = ${v.fix(s.x0, 3)}$: ` + parts.join(', ') + (s.vals.includes(null) ? '. A dash means the derivative of that order does not exist at $x_0$.' : '.');
        });
      },
    },

    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Theorem',
      name: "Taylor's theorem",
      statement: String.raw`Let $f$ be a real function on $[a,b]$ and $n$ a positive integer such that $f^{(n-1)}$ is continuous on $[a,b]$ and $f^{(n)}(t)$ exists for every $t\in(a,b)$. Let $\alpha\ne\beta$ be points of $[a,b]$ and put
$$P(t)=\sum_{k=0}^{n-1}\frac{f^{(k)}(\alpha)}{k!}\,(t-\alpha)^k .$$
Then there is a point $x$ strictly between $\alpha$ and $\beta$ with
$$f(\beta)=P(\beta)+\frac{f^{(n)}(x)}{n!}\,(\beta-\alpha)^n .$$
For $n=1$ this is the mean value theorem.`,
      idea: String.raw`Define $M$ by $f(\beta)=P(\beta)+M(\beta-\alpha)^n$ and let $g(t)=f(t)-P(t)-M(t-\alpha)^n$. Then $g(\alpha)=g'(\alpha)=\dots=g^{(n-1)}(\alpha)=0$ and also $g(\beta)=0$. The mean value theorem 5.10 gives $x_1$ between $\alpha$ and $\beta$ with $g'(x_1)=0$, then $x_2$ between $\alpha$ and $x_1$ with $g''(x_2)=0$, and so on; after $n$ steps $g^{(n)}(x_n)=f^{(n)}(x_n)-n!\,M=0$.`,
      caption: String.raw`Drag the centre $\alpha$ and the point $\beta$ and change $n$. The orange curve is the Taylor polynomial $P$ of degree $n-1$ about $\alpha$, and the red bar is the error $f(\beta)-P(\beta)$. The lower panel plots $f^{(n)}$ between $\alpha$ and $\beta$ against the level $n!\,(f(\beta)-P(\beta))/(\beta-\alpha)^n$: the theorem says they meet, and the green point is the $x$ it promises. For $\log(1+x)$ with $\beta>1$ the error grows with $n$ — the theorem still holds, it just does not promise convergence.`,
      deps: ['pma-5.14', 'pma-5.10', 'pma-5.3'],
      see: ['pma-8.4'],
      tags: ['Taylor', 'approximation'],
      viz(v) {
        const M = v.M;
        const FN = {
          sin: { label: '$\\sin x$', d: (k, x) => Math.sin(x + k * Math.PI / 2), D: [-4.2, 4.2], y: [-2.4, 2.4], al: -0.4, be: 2.6 },
          exp: { label: '$e^{x/2}$', d: (k, x) => Math.exp(x / 2) / 2 ** k, D: [-3, 3.6], y: [-0.6, 6.4], al: -1.2, be: 3 },
          log: { label: '$\\log(1+x)$', d: (k, x) => (k === 0 ? Math.log(1 + x) : ((k % 2 ? 1 : -1) * M.factorial(k - 1)) / (1 + x) ** k), D: [-0.85, 3], y: [-2.4, 2], al: 0, be: 1.5 },
        };
        const which = v.select('$f(x)=$', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'sin');
        const nS = v.slider('$n$', 1, 9, 3, { int: true });
        const F = () => FN[which.value];
        const top = v.stage({ x: [-4.3, 4.3], y: [-2.4, 2.4], height: 290, full: true });
        const bot = v.stage({ x: [-4.3, 4.3], y: [-1, 1], height: 190, full: true, title: '$f^{(n)}$ between $\\alpha$ and $\\beta$, and the level $n!\\,\\frac{f(\\beta)-P(\\beta)}{(\\beta-\\alpha)^n}$' });
        const onG = (X, other) => { const G = F(); X = M.clamp(X, G.D[0], G.D[1]); if (Math.abs(X - other.x) < 0.06) X = other.x + (X >= other.x ? 0.06 : -0.06); return [X, G.d(0, X)]; };
        const ha = top.handle(-0.4, 0, { color: 'orange', label: 'α', constrain: (X) => onG(X, hb) });
        const hb = top.handle(2.6, 0, { color: 'accent', label: 'β', constrain: (X) => onG(X, ha) });
        let last = null, st = {};
        v.render(() => {
          const G = F(), n = nS.value;
          if (last !== which.value) { last = which.value; const w = G.D[1] - G.D[0]; top.setView([G.D[0] - 0.02 * w, G.D[1] + 0.02 * w], G.y); bot.setView([G.D[0] - 0.02 * w, G.D[1] + 0.02 * w], null); ha.x = G.al; hb.x = G.be; }
          const al = ha.x, be = hb.x; ha.y = G.d(0, al); hb.y = G.d(0, be);
          const c = M.range(n).map((k) => G.d(k, al) / M.factorial(k));
          const P = (t) => { let s = 0, p = 1; for (let k = 0; k < n; k++) { s += c[k] * p; p *= t - al; } return s; };
          { const span = G.y[1] - G.y[0], pb = P(be); top.setView(null, [Math.max(G.y[0] - span, Math.min(G.y[0], pb - 0.08 * span)), Math.min(G.y[1] + span, Math.max(G.y[1], pb + 0.08 * span))]); }
          const err = G.d(0, be) - P(be), lev = M.factorial(n) * err / (be - al) ** n;
          const lo = Math.min(al, be), hi = Math.max(al, be);
          const xs = roots((t) => G.d(n, t) - lev, lo, hi, 600);
          // top
          top.vband(lo, hi, { color: 'accent', alpha: 0.05 });
          top.fn((t) => G.d(0, t), { domain: G.D, color: 'ink', width: 2.4 });
          top.fn(P, { domain: G.D, color: 'orange', width: 2.2 });
          top.line(be, P(be), be, G.d(0, be), { color: 'red', width: 4, cap: 'butt' });
          top.dot(be, P(be), { color: 'orange', r: 3.5 });
          top.text('error', be, (P(be) + G.d(0, be)) / 2, { dx: be > al ? 9 : -9, align: be > al ? 'left' : 'right', color: 'red', size: 12, weight: 600 });
          for (const x of xs) { top.vline(x, { color: 'green', width: 1.2, dash: [3, 4] }); top.dot(x, 0, { color: 'green', r: 4.5 }); }
          // bottom
          const ys = M.linspace(G.D[0], G.D[1], 300).map((t) => G.d(n, t));
          const between = M.linspace(lo, hi, 200).map((t) => G.d(n, t));
          const [blo, bhi] = yRange(between.concat([lev], ys.filter((y) => Math.abs(y) < 4 * Math.max(...between.map(Math.abs), Math.abs(lev)) + 1e-9)), 0, 0.15, 0.4);
          bot.setView(null, [blo, bhi]);
          bot.vband(lo, hi, { color: 'accent', alpha: 0.05 });
          bot.fn((t) => G.d(n, t), { domain: G.D, color: 'purple', width: 1.3, alpha: 0.4 });
          bot.fn((t) => G.d(n, t), { domain: [lo, hi], color: 'purple', width: 2.6 });
          bot.hline(lev, { color: 'green', width: 1.6, dash: [7, 5] });
          for (const x of xs) bot.dot(x, lev, { color: 'green', r: 5.5, label: 'x', labelPos: 'n' });
          v.legend([['ink', '$f$'], ['orange', `Taylor polynomial $P$ of degree $${n - 1}$ about $\\alpha$`], ['red', 'error $f(\\beta)-P(\\beta)$'], ['purple', `$f^{(${n})}$`], ['green', 'the promised $x$', { dot: true }]]);
          st = { n, al, be, err, lev, xs };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          const x = s.xs.length ? s.xs[0] : null;
          const chk = x == null ? '' : `; at $x = ${v.fix(x, 4)}$: $\\dfrac{f^{(${s.n})}(x)}{${s.n}!}(\\beta-\\alpha)^{${s.n}} = ${v.fmt(F().d(s.n, x) / M.factorial(s.n) * (s.be - s.al) ** s.n, 5)}$`;
          return `$f(\\beta)-P(\\beta) = ${v.fmt(s.err, 5)}$` + chk + (s.xs.length > 1 ? ` (${s.xs.length} such points).` : '.');
        });
      },
    },

    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16',
      kind: 'Definition',
      name: 'Derivatives of vector-valued functions',
      statement: String.raw`Definition 5.1 applies unchanged to a complex function $f=f_1+if_2$ on $[a,b]$, and $f'(x)=f_1'(x)+if_2'(x)$ exists exactly when $f_1'(x)$ and $f_2'(x)$ do. More generally, for a map $\mathbf f$ of $[a,b]$ into $\R^k$ the difference quotient $\frac{\mathbf f(t)-\mathbf f(x)}{t-x}$ is a point of $\R^k$, and $\mathbf f'(x)$ is the point of $\R^k$ (if there is one) with
$$\lim_{t\to x}\left|\frac{\mathbf f(t)-\mathbf f(x)}{t-x}-\mathbf f'(x)\right|=0 .$$
If $f_1,\dots,f_k$ are the components of $\mathbf f$, then $\mathbf f'=(f_1',\dots,f_k')$, and $\mathbf f$ is differentiable at $x$ if and only if each $f_i$ is. Theorem 5.2 and parts (a), (b) of Theorem 5.3 (with $\mathbf f\cdot\mathbf g$ in place of $fg$) remain valid.`,
      idea: String.raw`The limit is taken in the norm of $\R^k$, and a vector converges exactly when each coordinate does, so differentiation is coordinatewise. What is lost is the order of $\R$: the mean value theorem and L'Hospital's rule compare real numbers, and Rudin's Examples 5.17 ($e^{ix}$ on $[0,2\pi]$) and 5.18 show that both fail for complex-valued functions. Theorem 5.19 rescues an inequality.`,
      caption: String.raw`Drag $\mathbf f(x)$ along the curve and shrink $t-x$. The gold arrow is the difference quotient $\frac{\mathbf f(t)-\mathbf f(x)}{t-x}$, a vector in $\R^2$, drawn from $\mathbf f(x)$; the green arrow is its limit $\mathbf f'(x)$, tangent to the curve. Right: the same quotient as a point of the velocity plane — as $t\to x$ the gold point runs along the gold curve into the green point $\mathbf f'(x)$. Near the four sharp turns the speed $|\mathbf f'|$ is tiny.`,
      verify: true,
      deps: ['pma-5.1', 'pma-1.36'],
      see: ['pma-9.11'],
      tags: ['derivative', 'vector-valued'],
      viz(v) {
        const M = v.M, TAU = M.TAU;
        const f = (t) => [1.2 * Math.cos(t) + 0.35 * Math.cos(3 * t), 1.2 * Math.sin(t) - 0.35 * Math.sin(3 * t)];
        const df = (t) => [-1.2 * Math.sin(t) - 1.05 * Math.sin(3 * t), 1.2 * Math.cos(t) - 1.05 * Math.cos(3 * t)];
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 340, title: 'the curve $\\mathbf f:[0,2\\pi]\\to\\R^2$' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, title: 'velocity plane: $\\frac{\\mathbf f(t)-\\mathbf f(x)}{t-x}$ and $\\mathbf f\'(x)$' });
        const ht = v.slider('$t-x$', 0.004, 1.5, 0.7, { log: true, fmt: (x) => v.fmt(x, 2) });
        const TS = M.linspace(0, TAU, 1441);
        let tx = 0.55;
        const hx = L.handle(...f(0.55), { color: 'accent', label: 'f(x)', constrain: (X, Y) => { const k = M.argmin(TS, (t) => { const p = f(t); return (p[0] - X) ** 2 + (p[1] - Y) ** 2; }); tx = TS[k]; return f(tx); } });
        let st = {};
        v.render(() => {
          const x = tx, h = ht.value, t = x + h;
          const px = f(x), pt = f(t), d = df(x);
          const q = [(pt[0] - px[0]) / h, (pt[1] - px[1]) / h];
          const k = 0.45; // display scale of velocity arrows in the left panel
          L.curve(f, 0, TAU, { color: 'ink', width: 2.2, n: 600 });
          L.curve(f, x, t, { color: 'gold', width: 3.2, n: 200 });
          L.line(px[0], px[1], pt[0], pt[1], { color: 'gold', width: 1.2, dash: [3, 3] });
          L.arrow(px[0], px[1], px[0] + k * d[0], px[1] + k * d[1], { color: 'green', width: 2.6 });
          L.arrow(px[0], px[1], px[0] + k * q[0], px[1] + k * q[1], { color: 'gold', width: 2.2 });
          L.dot(pt[0], pt[1], { color: 'gold', r: 5, label: 'f(t)', labelPos: 'ne' });
          // velocity plane
          const us = M.linspace(0.002, 1.5, 300);
          const qs = us.map((u) => { const p = f(x + u); return [(p[0] - px[0]) / u, (p[1] - px[1]) / u]; });
          const Rm = Math.max(2.4, ...qs.map((p) => Math.hypot(...p)), Math.hypot(...d)) * 1.12;
          R.setView([-Rm, Rm], [-Rm, Rm]);
          R.path(qs, { color: 'gold', width: 1.6, alpha: 0.6 });
          R.arrow(0, 0, d[0], d[1], { color: 'green', width: 2.4 });
          R.arrow(0, 0, q[0], q[1], { color: 'gold', width: 1.8, alpha: 0.9 });
          R.dot(d[0], d[1], { color: 'green', r: 5.5, hollow: true, width: 2.4, label: "f′(x)", labelPos: 'w' });
          R.dot(q[0], q[1], { color: 'gold', r: 5 });
          R.dot(0, 0, { color: 'ink', r: 3 });
          v.legend([['ink', 'curve $\\mathbf f$'], ['gold', 'difference quotient (arrow, and its path as $t\\to x$)'], ['green', "derivative $\\mathbf f'(x)$"]]);
          st = { x, h, q, d, e: Math.hypot(q[0] - d[0], q[1] - d[1]) };
        });
        v.readout(() => {
          const s = st; if (s.x == null) return '';
          return `$x = ${v.fix(s.x, 3)},\\ t-x = ${v.fmt(s.h, 3)}$: quotient $= (${v.fmt(s.q[0], 4)},\\ ${v.fmt(s.q[1], 4)})$, $\\ \\mathbf f'(x) = (f_1'(x), f_2'(x)) = (${v.fmt(s.d[0], 4)},\\ ${v.fmt(s.d[1], 4)})$, $\\ |\\text{quotient}-\\mathbf f'(x)| = ${v.fmt(s.e, 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19',
      kind: 'Theorem',
      name: 'Mean value inequality for vector-valued functions',
      statement: String.raw`Let $\mathbf f$ be a continuous mapping of $[a,b]$ into $\R^k$ which is differentiable in $(a,b)$. Then there is a point $x\in(a,b)$ with
$$|\mathbf f(b)-\mathbf f(a)|\le(b-a)\,|\mathbf f'(x)| .$$`,
      idea: String.raw`Put $\mathbf z=\mathbf f(b)-\mathbf f(a)$ and look at the real function $\varphi(t)=\mathbf z\cdot\mathbf f(t)$. The mean value theorem 5.10 gives $x$ with $\varphi(b)-\varphi(a)=(b-a)\varphi'(x)$, that is $|\mathbf z|^2=(b-a)\,\mathbf z\cdot\mathbf f'(x)$, and the Schwarz inequality bounds the right side by $(b-a)\,|\mathbf z|\,|\mathbf f'(x)|$. The equality $\mathbf z=(b-a)\mathbf f'(x)$ is out of reach: for $e^{ix}$ on $[0,2\pi]$, $\mathbf z=0$ while $|\mathbf f'|\equiv1$ (Example 5.17).`,
      caption: String.raw`Left: a curve $\mathbf f:[a,b]\to\R^2$ and its chord $\mathbf z=\mathbf f(b)-\mathbf f(a)$. Right: the velocity curve $t\mapsto(b-a)\,\mathbf f'(t)$. The equality form of the mean value theorem would need $\mathbf z$ to lie on this curve, and it generally does not. The proof finds where the velocity curve crosses the dashed line $\{\mathbf w:\mathbf z\cdot\mathbf w=|\mathbf z|^2\}$; every such crossing lies outside the circle of radius $|\mathbf z|$, which is the inequality. Drag the end of the arc $e^{it}$, $0\le t\le T$ (try $T=2\pi$), or switch to a free curve.`,
      deps: ['pma-5.16', 'pma-5.10', 'pma-1.35', 'pma-1.37'],
      see: ['pma-9.19'],
      tags: ['mean value theorem', 'vector-valued'],
      viz(v) {
        const M = v.M, TAU = M.TAU;
        const mode = v.select('', [{ value: 'arc', label: 'arc $e^{it}$, $0\\le t\\le T$' }, { value: 'bez', label: 'free curve (drag the points)' }], 'arc');
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, title: 'the curve $\\mathbf f$ and the chord $\\mathbf z$' });
        const R = v.stage({ x: [-7, 7], y: [-7, 7], equal: true, height: 340, title: 'velocity curve $(b-a)\\,\\mathbf f\'(t)$' });
        let T = 4.4;
        const hT = L.handle(Math.cos(T), Math.sin(T), { color: 'accent', label: 'f(b)', constrain: (X, Y) => {
          let th = Math.atan2(Y, X); th = M.mod(th, TAU);
          const cands = [th, th + TAU, th - TAU].filter((c) => c >= 0.15 && c <= TAU);
          if (cands.length) T = cands[M.argmin(cands, (c) => Math.abs(c - T))];
          else T = T > Math.PI ? TAU : 0.15;
          return [Math.cos(T), Math.sin(T)];
        } });
        const B = [[-1.2, -0.7], [-0.9, 1.3], [1.4, -1.3], [1.15, 0.85]].map(([x, y], i) => L.handle(x, y, { color: i === 0 || i === 3 ? 'accent' : 'gray', r: i === 0 || i === 3 ? 7 : 6 }));
        B[0].label = 'f(a)'; B[3].label = 'f(b)'; B[0].labelPos = 'sw';
        let st = {};
        v.render(() => {
          const arc = mode.value === 'arc';
          hT.visible = arc; B.forEach((h) => { h.visible = !arc; });
          let f, df, a, b;
          if (arc) { a = 0; b = T; f = (t) => [Math.cos(t), Math.sin(t)]; df = (t) => [-Math.sin(t), Math.cos(t)]; }
          else {
            const Q = B.map((h) => [h.x, h.y]); a = 0; b = 1;
            f = (t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * Q[0][k] + 3 * u * u * t * Q[1][k] + 3 * u * t * t * Q[2][k] + t * t * t * Q[3][k]); };
            df = (t) => { const u = 1 - t; return [0, 1].map((k) => 3 * (u * u * (Q[1][k] - Q[0][k]) + 2 * u * t * (Q[2][k] - Q[1][k]) + t * t * (Q[3][k] - Q[2][k]))); };
          }
          const fa = f(a), fb = f(b), z = M.vsub(fb, fa), nz = Math.hypot(...z);
          const w = (t) => M.vscale(df(t), b - a);
          // crossings of the line z·w = |z|^2  (i.e. MVT for φ = z·f)
          const xs = nz > 1e-9 ? roots((t) => M.dot(z, w(t)) - nz * nz, a + 1e-9, b - 1e-9, 600) : [];
          // left
          if (arc) L.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          else L.path(B.map((h) => [h.x, h.y]), { color: 'faint', width: 1, dash: [3, 4] });
          L.curve(f, a, b, { color: 'ink', width: 2.6, n: 400 });
          if (nz > 1e-6) L.arrow(fa[0], fa[1], fb[0], fb[1], { color: 'accent', width: 2.2, dash: [6, 4] });
          L.dot(fa[0], fa[1], { color: 'accent', r: 4.5 });
          if (arc) L.text('f(a)', fa[0], fa[1], { dx: 8, dy: 15, color: 'accent', math: true });
          for (const x of xs) { const p = f(x), d = M.normalize(df(x)); L.arrow(p[0], p[1], p[0] + 0.5 * d[0], p[1] + 0.5 * d[1], { color: 'green', width: 2.2 }); L.dot(p[0], p[1], { color: 'green', r: 4.5 }); }
          // right
          const ts = M.linspace(a, b, 500), W = ts.map(w);
          const Rm = Math.max(...W.map((p) => Math.hypot(...p)), nz, 0.5) * 1.18;
          R.setView([-Rm, Rm], [-Rm, Rm]);
          R.circle(0, 0, nz, { color: 'accent', width: 1.2, dash: [3, 4], fill: 'accent', fillAlpha: 0.06 });
          if (nz > 1e-9) { const u = [z[0] / nz, z[1] / nz], p = [-u[1], u[0]], E = 3 * Rm; R.line(z[0] - E * p[0], z[1] - E * p[1], z[0] + E * p[0], z[1] + E * p[1], { color: 'accent', width: 1.4, dash: [7, 5] }); }
          R.path(W, { color: 'purple', width: 2.4 });
          R.arrow(0, 0, z[0], z[1], { color: 'accent', width: 2.2 });
          R.dot(z[0], z[1], { color: 'accent', r: 5, label: 'z', labelPos: 'ne' });
          for (const x of xs) { const q = w(x); R.arrow(0, 0, q[0], q[1], { color: 'green', width: 1.6, alpha: 0.8 }); R.dot(q[0], q[1], { color: 'green', r: 5 }); }
          R.dot(0, 0, { color: 'ink', r: 3 });
          const dmin = Math.min(...W.map((q) => Math.hypot(q[0] - z[0], q[1] - z[1])));
          R.corner(dmin > 1e-3 * Rm ? 'z is off the velocity curve' : 'z is on the velocity curve', 'bl', { color: dmin > 1e-3 * Rm ? 'red' : 'green', weight: 600 });
          v.legend([['ink', 'curve $\\mathbf f$'], ['accent', 'chord $\\mathbf z$, circle $|\\mathbf w|=|\\mathbf z|$, line $\\mathbf z\\cdot\\mathbf w=|\\mathbf z|^2$', { dash: true }], ['purple', "velocity curve $(b-a)\\mathbf f'(t)$"], ['green', 'the proof\'s $x$: tangent direction / $(b-a)\\mathbf f\'(x)$', { dot: true }]]);
          const x0 = xs.length ? xs[0] : (a + b) / 2;
          st = { nz, xs, x0, sp: (b - a) * Math.hypot(...df(x0)), dmin, arc, T: b };
        });
        v.readout(() => {
          const s = st; if (s.nz == null) return '';
          const head = (s.arc ? `$T = ${v.fix(s.T, 3)}$: ` : '') + `$|\\mathbf z| = ${s.nz < 1e-9 ? '0' : v.fmt(s.nz, 4)}$`;
          if (s.nz < 1e-9) return head + ` — the chord vanishes, so the inequality is trivial, while $(b-a)|\\mathbf f'(x)| = ${v.fmt(s.sp, 4)}$ for every $x$: equality is impossible (Example 5.17).`;
          return head + ` $\\le (b-a)\\,|\\mathbf f'(x)| = ${v.fmt(s.sp, 4)}$ at $x = ${v.fix(s.x0, 3)}$` + (s.xs.length > 1 ? ` (and ${s.xs.length - 1} more)` : '') + `; but $\\min_t |(b-a)\\mathbf f'(t)-\\mathbf z| = ${v.fmt(s.dmin, 3)}$, so no $x$ gives $\\mathbf f(b)-\\mathbf f(a)=(b-a)\\mathbf f'(x)$.`;
        });
      },
    },
  ],
};
