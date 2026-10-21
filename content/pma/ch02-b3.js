// Rudin, Principles of Mathematical Analysis — Chapter 2: Basic Topology (part b3: perfect sets, the Cantor set, connected sets, 2.43–2.47)

// ---------------------------------------------------------------- shared helpers
/** Rationals in [0,1] in Farey order: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, … (lowest terms, by denominator). */
function fareyList(n) {
  const out = [[0, 1], [1, 1]];
  const g = (a, b) => (b ? g(b, a % b) : a);
  for (let q = 2; out.length < n; q++) for (let p = 1; p < q && out.length < n; p++) if (g(p, q) === 1) out.push([p, q]);
  return out;
}

/** Endpoints of the level-k middle-thirds intervals (all of them lie in the Cantor set). */
function cantorEnds(k, iv) { return iv(k).flatMap(([a, b]) => [a, b]); }

/** A number as TeX: plain decimals when moderate, a×10^k otherwise. */
function sci(x, d = 3) {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a)), m = x / 10 ** e;
  return `${Number(m.toPrecision(d))}\\times10^{${e}}`;
}
/** Unicode subscript digits, for canvas labels. */
const sub = (n) => String(n).replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[c]);

/** Ternary digits of x ∈ [0,1] (first n), choosing the expansion without a trailing run of 2s when x is an endpoint. */
function ternary(x, n) { const d = []; let y = x; for (let i = 0; i < n; i++) { y *= 3; let t = Math.floor(y + 1e-12); if (t > 2) t = 2; d.push(t); y -= t; } return d; }

export default {
  collection: 'pma',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.43
    {
      num: '2.43',
      kind: 'Theorem',
      name: 'Nonempty perfect sets in ℝᵏ are uncountable',
      credit: 'Cantor, 1884',
      statement: String.raw`Let $P$ be a nonempty perfect set in $\R^k$. Then $P$ is uncountable.`,
      idea: String.raw`$P$ has limit points, so it is infinite. Suppose $P=\{x_1,x_2,\dots\}$. Start with a neighbourhood $V_1$ of $x_1$. Given $V_n$ meeting $P$, every point of $P$ is a limit point, so there is a neighbourhood $V_{n+1}$ with $\overline{V}_{n+1}\subset V_n$, $x_n\notin\overline{V}_{n+1}$ and $V_{n+1}\cap P\ne\emptyset$. The sets $K_n=\overline{V}_n\cap P$ are compact (2.41, 2.35a), nonempty and nested, so they have a common point (2.36a) — yet no $x_n$ lies in all of them. Contradiction.`,
      caption: String.raw`Choose $P$ and slide the step $n$. Red: a list $x_1,x_2,\dots$ of points of $P$ — either fixed in advance, or chosen by an adversary who always lists the centre of the current disc. Each disc $V_{n+1}$ is centred at a point of $P$ inside $V_n$, its closure stays inside $V_n$ and avoids $x_n$ (right: step $n$ magnified). The discs shrink to a point of $P$ that is on nobody's list. For a set with isolated points the construction gets stuck.`,
      deps: ['pma-2.18', 'pma-2.41', 'pma-2.35a', 'pma-2.36a'],
      see: ['rca-5.6', 'fa-2.2'],
      tags: ['perfect sets', 'countability'],
      viz(v) {
        const M = v.M, R0 = 1.1;
        const iv = (k) => M.cantorIntervals(k);
        const toD = (u) => -R0 + 2 * R0 * u; // [0,1] → [−R0, R0]
        // ---- the three sets: candidate points of P inside a ball, an enumeration, and drawing
        const farey = fareyList(400);
        const SETS = {
          circle: {
            label: 'unit circle',
            list: farey.map(([p, q]) => [R0 * Math.cos(2 * Math.PI * p / q), R0 * Math.sin(2 * Math.PI * p / q)]).slice(1),
            cands([cx, cy], r) { const phi = Math.atan2(cy, cx), D = 2 * Math.asin(Math.min(1, r / (2 * R0))); return M.linspace(-0.97, 0.97, 61).map((t) => [R0 * Math.cos(phi + t * D), R0 * Math.sin(phi + t * D)]); },
            draw(S) { S.circle(0, 0, R0, { color: 'accent', width: 2.2 }); },
          },
          dust: {
            label: 'Cantor dust $C\\times C$',
            list: (() => { const out = []; for (let k = 0; k < 3; k++) { const E = cantorEnds(k, iv); for (const a of E) for (const b of E) { const p = [toD(a), toD(b)]; if (!out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-9)) out.push(p); } } return out; })(),
            cands([cx, cy], r) {
              const out = []; const side = 2 * R0;
              (function rec(x0, y0, s, depth) {
                if (out.length > 600) return;
                const nx = Math.max(x0, Math.min(cx, x0 + s)), ny = Math.max(y0, Math.min(cy, y0 + s));
                if (Math.hypot(nx - cx, ny - cy) > r) return;
                if (s < r / 6 || depth > 22) { for (const p of [[x0, y0], [x0 + s, y0], [x0, y0 + s], [x0 + s, y0 + s]]) if (Math.hypot(p[0] - cx, p[1] - cy) < r) out.push(p); return; }
                const t = s / 3; for (const dx of [0, 2 * t]) for (const dy of [0, 2 * t]) rec(x0 + dx, y0 + dy, t, depth + 1);
              })(-R0, -R0, side, 0);
              return out;
            },
            draw(S, lvl = 4) { const I = iv(lvl); for (const [a, b] of I) for (const [c, d] of I) S.rect(toD(a), toD(c), toD(b), toD(d), { fill: 'accent', fillAlpha: 0.75, stroke: false }); },
          },
          iso: {
            label: '$\\{p\\}\\cup\\{p_m\\}$ (not perfect)',
            list: [[-R0, 0]].concat(M.range(400, 1).map((m) => [-R0 + 2 * R0 / m, 0])),
            cands([cx, cy], r) { const out = []; if (Math.hypot(-R0 - cx, cy) < r) out.push([-R0, 0]); for (let m = 1; m < 20000; m++) { const x = -R0 + 2 * R0 / m; if (Math.hypot(x - cx, cy) < r) out.push([x, 0]); if (x - cx < -r) break; } return out; },
            draw(S) { const pts = [[-R0, 0]].concat(M.range(300, 1).map((m) => [-R0 + 2 * R0 / m, 0])); S.dots(pts, { color: 'accent', r: 2.6 }); },
          },
        };
        const which = v.select('$P$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'circle');
        const mode = v.select('list', [{ value: 'adv', label: 'adversary: $x_n$ = centre of $V_n$' }, { value: 'fixed', label: 'fixed enumeration' }], 'adv');
        const stepS = v.slider('step $n$', 1, 14, 5, { int: true });
        const L = v.stage({ x: [-1.45, 1.75], y: [-1.3, 1.3], equal: true, height: 380, axes: false, weight: 1.15, title: '$P$, the list $x_1,x_2,\\dots$ and the discs $V_1\\supset V_2\\supset\\cdots$' });
        const Z = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 380, axes: false, minWidth: 240, title: 'step $n$: from $V_n$ to $V_{n+1}$' });
        function build(key, N, adv) {
          const P = SETS[key], X = adv ? [P.list[0]] : P.list;
          const V = [{ c: X[0], r: 0.55 }]; let stuck = null;
          for (let n = 1; n < N + 1; n++) {
            const { c, r } = V[n - 1];
            if (adv && n > 1) X.push(c); // the adversary lists the centre of the current disc
            const xn = X[n - 1];
            let best = null, bs = 0;
            for (const y of P.cands(c, r)) {
              const dx = Math.hypot(y[0] - xn[0], y[1] - xn[1]); if (dx < 1e-12) continue;
              const sc = Math.min(dx, r - Math.hypot(y[0] - c[0], y[1] - c[1]));
              if (sc > bs) { bs = sc; best = y; }
            }
            if (!best) { stuck = n; break; }
            V.push({ c: best, r: Math.min(0.5 * bs, 0.6 * r) });
          }
          return { V, X, stuck };
        }
        let st = null;
        v.render(() => {
          const key = which.value, P = SETS[key], n = stepS.value, adv = mode.value === 'adv';
          const { V, X, stuck } = build(key, n, adv);
          // ---- overview
          P.draw(L);
          L.dots(X.slice(0, 60), { color: 'red', r: 2.2 });
          X.slice(0, adv ? 1 : 3).forEach((p, i) => L.tex(`x_{${i + 1}}`, p[0], p[1], { color: 'red', size: 12, dx: 8, dy: 9, align: 'left', baseline: 'top' }));
          V.forEach(({ c, r }, i) => L.circle(c[0], c[1], r, { color: i === V.length - 1 ? 'green' : 'orange', width: i === V.length - 1 ? 2.2 : 1.3 }));
          const last = V[V.length - 1];
          L.dot(last.c[0], last.c[1], { color: 'green', r: 3.5 });
          // ---- zoom on step n (V_n → V_{n+1})
          const k = Math.min(n, V.length) - 1, Vn = V[k], Vn1 = V[k + 1];
          const hw = Vn.r * 1.25;
          Z.setView([Vn.c[0] - hw, Vn.c[0] + hw], [Vn.c[1] - hw, Vn.c[1] + hw]);
          if (key === 'dust') P.draw(Z, Math.min(18, Math.max(4, Math.ceil(Math.log(1 / Vn.r) / Math.log(3)) + 4)));
          else P.draw(Z);
          Z.circle(Vn.c[0], Vn.c[1], Vn.r, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.06 });
          Z.tex(`V_{${k + 1}}`, Vn.c[0] + Vn.r * 0.72, Vn.c[1] + Vn.r * 0.72, { color: 'orange', size: 14, align: 'left', baseline: 'bottom' });
          const xn = X[k];
          Z.dots(X.slice(k + 1, 400).filter((p) => Math.hypot(p[0] - Vn.c[0], p[1] - Vn.c[1]) < hw * 1.5), { color: 'red', r: 2.2, alpha: 0.5 });
          Z.dot(xn[0], xn[1], { color: 'red', r: 5, label: `x_{${k + 1}}`, labelPos: 'ne', tex: true });
          if (Vn1) {
            Z.circle(Vn1.c[0], Vn1.c[1], Vn1.r, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.15 });
            Z.dot(Vn1.c[0], Vn1.c[1], { color: 'green', r: 3.5 });
            Z.tex(`V_{${k + 2}}`, Vn1.c[0] + Vn1.r * 1.05, Vn1.c[1] - Vn1.r * 0.7, { color: 'green', size: 14, align: 'left', baseline: 'top' });
          } else Z.corner('stuck: Vₙ ∩ P = {xₙ}', 'tl', { color: 'red', weight: 600 });
          Z.corner(`radius of the orange disc: ${v.fmt(Vn.r, 3)}`, 'br');
          if (stuck) L.corner(`stuck at step ${stuck}: x${sub(stuck)} is isolated in P`, 'tl', { color: 'red', weight: 600 });
          st = { key, n, V, X, stuck, k, adv };
        });
        v.legend([['accent', '$P$'], ['red', 'listed points $x_1,x_2,\\dots$', { dot: true }], ['orange', 'discs $V_1,\\dots,V_n$'], ['green', 'newest disc $V_{n+1}$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.stuck) return `At step ${s.stuck}, $V_{${s.stuck}}\\cap P$ consists of $x_{${s.stuck}}$ alone: it is an isolated point, so no smaller disc can avoid it and still meet $P$. This $P$ is countable — and not perfect.`;
          const N = s.V.length, c = s.V[N - 1].c, r = s.V[N - 1].r;
          const dmin = Math.min(...s.X.slice(0, N - 1).map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
          return `After ${N - 1} steps $V_{${N}}$ has radius $${sci(r)}$ and is centred at a point of $P$; its closure misses $x_1,\\dots,x_{${N - 1}}$ (nearest one at distance $${sci(dmin)}$). Continuing for ever, the compact sets $\\overline{V}_n\\cap P$ shrink to a point of $P$ that is not on the list.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.43a
    {
      num: '2.43a',
      kind: 'Corollary',
      name: 'Every interval [a,b] is uncountable; so is ℝ',
      statement: String.raw`Every interval $[a,b]$ with $a<b$ is uncountable. In particular, the set $\R$ of all real numbers is uncountable.`,
      idea: String.raw`$[a,b]$ is nonempty and perfect: it is closed, and every point of it is a limit of other points of it. Apply 2.43. Since $[a,b]\subset\R$, $\R$ is uncountable too. In one dimension the neighbourhoods of 2.43 can be taken to be closed thirds: of the two outer thirds of an interval, at least one misses any given point.`,
      caption: String.raw`Drag the first five entries $x_1,\dots,x_5$ of a would-be list of $[0,1]$ (later entries run through the rationals). Row $n$ shows $J_{n-1}$ magnified to full width: of its two outer closed thirds, the green one misses $x_n$ and becomes $J_n$. The nested intervals pin down a point $y$ that differs from every $x_n$ — the list was not complete.`,
      deps: ['pma-2.43'],
      see: ['pma-2.14'],
      tags: ['perfect sets', 'countability'],
      viz(v) {
        const M = v.M;
        const nN = v.slider('rows $N$', 1, 9, 7, { int: true });
        const X0 = [0.2, 0.75, 0.95, 0.92, 0.89];
        const rows = 9;
        const S = v.stage({ x: [-0.13, 1.52], y: [-(rows + 0.6), 1.25], height: 420, axes: false, full: true });
        const H = X0.map((x, i) => S.handle(x, 0.55, { color: 'red', r: 6, label: `x${sub(i + 1)}`, constrain: (x) => [M.clamp(x, 0, 1), 0.55] }));
        const rat = fareyList(60).map(([p, q]) => p / q);
        let st = null;
        v.render(() => {
          const N = nN.value;
          S.setView(null, [-(N + 0.7), 1.25]);
          const list = H.map((h) => h.x).concat(rat);
          // the construction
          let a = 0, b = 1; const steps = [];
          for (let n = 1; n <= N; n++) {
            const L = b - a, x = list[n - 1];
            // the two outer closed thirds are disjoint, so at least one misses x
            const pickLeft = !(x >= a && x <= a + L / 3);
            const [na, nb] = pickLeft ? [a, a + L / 3] : [b - L / 3, b];
            steps.push({ a, b, x, pickLeft, na, nb }); a = na; b = nb;
          }
          const y = (a + b) / 2;
          // overview row: [0,1] with the list
          S.line(0, 0.55, 1, 0.55, { color: 'accent', width: 5, cap: 'butt' });
          S.dot(0, 0.55, { color: 'accent', r: 4 }); S.dot(1, 0.55, { color: 'accent', r: 4 });
          rat.slice(2).forEach((r) => S.line(r, 0.43, r, 0.67, { color: 'red', width: 1, alpha: 0.45 }));
          S.text('0', 0, 0.95, { color: 'muted', align: 'center', size: 11 }); S.text('1', 1, 0.95, { color: 'muted', align: 'center', size: 11 });
          S.dot(y, 0.55, { color: 'green', r: 5 });
          S.tex('y', y, 0.25, { color: 'green', size: 14 });
          S.text('[0, 1] and the list', 1.06, 0.55, { color: 'muted', size: 12 });
          // rows: J_{n−1} magnified
          steps.forEach(({ a, b, x, pickLeft }, i) => {
            const n = i + 1, yy = -n, L = b - a, u = (x - a) / L;
            S.line(0, yy, 1, yy, { color: 'faint', width: 1 });
            S.line(0, yy, 1 / 3, yy, { color: 'accent', width: 5, cap: 'butt', alpha: 0.35 });
            S.line(2 / 3, yy, 1, yy, { color: 'accent', width: 5, cap: 'butt', alpha: 0.35 });
            const [p, q] = pickLeft ? [0, 1 / 3] : [2 / 3, 1];
            S.line(p, yy, q, yy, { color: 'green', width: 7, cap: 'butt' });
            S.dot(p, yy, { color: 'green', r: 3.6 }); S.dot(q, yy, { color: 'green', r: 3.6 });
            if (u >= 0 && u <= 1) { S.line(u, yy - 0.28, u, yy + 0.28, { color: 'red', width: 2.4 }); S.tex(`x_{${n}}`, u, yy + 0.3, { color: 'red', size: 12, baseline: 'bottom' }); }
            else S.text(`x${sub(n)} is outside J${sub(n - 1)}`, u < 0 ? 0.02 : 0.98, yy + 0.32, { color: 'red', size: 11, align: u < 0 ? 'left' : 'right', alpha: 0.8 });
            S.tex(`J_{${n - 1}}`, -0.02, yy, { color: 'muted', align: 'right', size: 13 });
            S.tex(n === 1 ? '\\text{length }1' : `\\text{length }3^{-${n - 1}}`, 1.06, yy, { color: 'muted', size: 12, align: 'left' });
          });
          st = { N, y, a, b, list };
        });
        v.legend([['accent', 'outer closed thirds of $J_{n-1}$'], ['green', '$J_n$: the third that misses $x_n$'], ['red', 'list entries $x_n$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const dmin = Math.min(...s.list.slice(0, s.N).map((x) => Math.abs(x - s.y)));
          return `$J_{${s.N}} = [${v.fix(s.a, 6)},\\,${v.fix(s.b, 6)}]$ contains none of $x_1,\\dots,x_{${s.N}}$; its points, such as $y=${v.fix(s.y, 6)}$, are at distance $\\ge ${v.fmt(dmin, 3)}$ from all of them. Going on for ever, $\\bigcap_n J_n$ is a point missing from the entire list.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.44
    {
      num: '2.44',
      kind: 'Theorem',
      name: 'The Cantor set',
      credit: 'Cantor, 1883',
      statement: String.raw`Let $E_0=[0,1]$ and let $E_{n}$ be obtained from $E_{n-1}$ by removing the open middle third of each of its $2^{n-1}$ intervals, so that $E_n$ is a union of $2^n$ closed intervals of length $3^{-n}$. The **Cantor set** $P=\bigcap_{n\ge1}E_n$ is a nonempty compact perfect subset of $\R$ that contains no segment; in particular it is uncountable (2.43).`,
      idea: String.raw`$P$ is an intersection of closed sets inside $[0,1]$, so it is compact, and it contains $0$. A segment $(\alpha,\beta)$ cannot lie in $P$: once $3^{-m}<(\beta-\alpha)/6$ it contains an interval $\bigl(\tfrac{3k+1}{3^m},\tfrac{3k+2}{3^m}\bigr)$, and no point of such an interval survives (its $m$-th ternary digit is $1$). Every $x\in P$ lies in an interval of $E_m$ of length $3^{-m}$ whose endpoints (other than $x$) are in $P$, so $x$ is a limit point of $P$: $P$ is perfect. Equivalently, $P$ consists of the numbers with a ternary expansion using only the digits $0$ and $2$.`,
      caption: String.raw`Rows $E_0,\dots,E_n$ of the construction. Drag $x$: its ternary digits choose left ($0$) or right ($2$) at each stage, and the path turns red at the first stage that deletes $x$ (digit $1$). The lower panel magnifies the stage-2 interval containing $x$ nine times — the same picture again (and $x=\tfrac14=(0.0202\ldots)_3$ even sits at the same relative position). Switch the probe to a segment and watch it get cut.`,
      deps: ['pma-2.24', 'pma-2.35', 'pma-2.40', 'pma-2.43'],
      tags: ['Cantor set', 'perfect sets'],
      verify: true,
      viz(v) {
        const M = v.M;
        const probe = v.select('probe', [{ value: 'pt', label: 'a point $x$' }, { value: 'seg', label: 'a segment $(\\alpha,\\beta)$' }], 'pt');
        const nN = v.slider('stages $n$', 1, 7, 5, { int: true });
        const top = v.stage({ x: [-0.06, 1.2], y: [-7.6, 1.2], height: 330, axes: false, full: true, title: 'the stages $E_0\\supset E_1\\supset\\dots\\supset E_n$' });
        const bot = v.stage({ x: [-0.06, 1.2], y: [-4.6, 1.0], height: 170, axes: false, full: true, title: 'magnified $\\times 9$: the part of $P$ in the stage-2 interval around $x$' });
        const hx = top.handle(0.25, 0.55, { color: 'accent', label: 'x', constrain: (x) => [M.clamp(x, 0, 1), 0.55] });
        const ha = top.handle(0.7, 0.55, { color: 'orange', label: 'α', constrain: (x) => [M.clamp(x, 0, 1), 0.55] });
        const hb = top.handle(0.765, 0.55, { color: 'orange', label: 'β', constrain: (x) => [M.clamp(x, 0, 1), 0.55] });
        const IV = M.range(9).map((k) => M.cantorIntervals(k));
        let st = null;
        v.render(() => {
          const n = nN.value, pt = probe.value === 'pt';
          hx.visible = pt; ha.visible = hb.visible = !pt;
          bot.setTitle(pt ? 'magnified $\\times 9$: the part of $P$ in the stage-2 interval around $x$' : 'magnified: the stages near the segment');
          top.setView(null, [-(n + 0.6), 1.2]);
          for (let k = 0; k <= n; k++) {
            for (const [a, b] of IV[k]) top.line(a, -k, b, -k, { color: 'accent', width: 7, cap: 'butt' });
            top.tex(`E_{${k}}`, 1.04, -k, { color: 'muted', size: 13, align: 'left' });
          }
          top.line(0, 0.55, 1, 0.55, { color: 'faint', width: 1 });
          for (const [t, s] of [[0, '0'], [1 / 3, '1/3'], [2 / 3, '2/3'], [1, '1']]) top.text(s, t, 0.95, { color: 'muted', align: 'center', size: 11 });
          if (pt) {
            const d = ternary(hx.x, 12);
            let dead = null;
            for (let k = 1; k <= n; k++) if (!IV[k].some(([a, b]) => hx.x >= a - 1e-12 && hx.x <= b + 1e-12)) { dead = k; break; }
            top.line(hx.x, 0.55, hx.x, -(dead ? dead : n), { color: dead ? 'red' : 'green', width: 1.8, dash: [4, 3] });
            for (let k = 1; k <= Math.min(n, dead ? dead - 1 : n); k++) top.text(String(d[k - 1]), hx.x, -k + 0.42, { color: 'green', size: 11, align: 'center', weight: 600 });
            if (dead) { top.dot(hx.x, -dead, { color: 'red', r: 5, hollow: true, width: 2.2 }); top.text(`digit ${dead} is 1: removed at stage ${dead}`, Math.min(hx.x + 0.02, 0.7), -dead + 0.42, { color: 'red', size: 11, weight: 600 }); }
            // magnified copy: the stage-2 interval containing x (if x survives stage 2)
            const J = IV[2].find(([a, b]) => hx.x >= a - 1e-12 && hx.x <= b + 1e-12);
            if (J) {
              const [a, b] = J, map = (t) => (t - a) / (b - a);
              for (let k = 0; k <= Math.min(4, n); k++) for (const [p, q] of IV[k + 2].filter(([p, q]) => p >= a - 1e-12 && q <= b + 1e-12)) bot.line(map(p), -k, map(q), -k, { color: 'accent', width: 7, cap: 'butt' });
              bot.line(map(hx.x), 0.5, map(hx.x), -Math.min(4, n), { color: 'green', width: 1.5, dash: [4, 3] });
              bot.dot(map(hx.x), 0.5, { color: 'accent', r: 4 });
              bot.text(`[${v.fix(a, 4)}, ${v.fix(b, 4)}]`, 1.04, 0, { color: 'muted', size: 11 });
            } else bot.text('x was removed at stage 1 or 2 — drag x into the Cantor set', 0.5, -2, { color: 'red', align: 'center', size: 13 });
            st = { pt, d, dead, n, x: hx.x };
          } else {
            const al = Math.min(ha.x, hb.x), be = Math.max(ha.x, hb.x);
            top.line(al, 0.55, be, 0.55, { color: 'orange', width: 5, cap: 'butt' });
            // first stage k at which a removed (open) middle third meets (α, β)
            let cut = null;
            for (let k = 1; k <= 8 && !cut; k++) for (const [a, b] of IV[k - 1]) { const g0 = a + (b - a) / 3, g1 = b - (b - a) / 3, lo = Math.max(al, g0), hi = Math.min(be, g1); if (lo < hi) { cut = { k, g0, g1, lo, hi }; break; } }
            for (let k = 0; k <= n; k++) top.line(al, -k, be, -k, { color: 'orange', width: 2, alpha: 0.6 });
            if (cut && cut.k <= n) top.rect(cut.lo, -cut.k - 0.3, cut.hi, -cut.k + 0.3, { color: 'red', width: 2, fill: 'red', fillAlpha: 0.25 });
            // magnifier on the segment
            const pad = (be - al) * 0.6, m0 = al - pad, m1 = be + pad, map = (t) => (t - m0) / (m1 - m0);
            const K = Math.min(8, (cut ? cut.k : 6) + 1);
            for (let k = 0; k <= Math.min(4, K); k++) {
              const kk = Math.max(0, K - 4) + k;
              for (const [p, q] of IV[kk]) if (q > m0 && p < m1) bot.line(map(Math.max(p, m0)), -k, map(Math.min(q, m1)), -k, { color: 'accent', width: 7, cap: 'butt' });
              bot.line(map(al), -k, map(be), -k, { color: 'orange', width: 2, alpha: 0.7 });
              bot.tex(`E_{${kk}}`, 1.04, -k, { color: 'muted', size: 12, align: 'left' });
              if (cut && kk === cut.k) bot.rect(map(cut.lo), -k - 0.3, map(cut.hi), -k + 0.3, { color: 'red', width: 2, fill: 'red', fillAlpha: 0.25 });
            }
            bot.line(map(al), 0.5, map(be), 0.5, { color: 'orange', width: 5, cap: 'butt' });
            st = { pt, al, be, cut, n };
          }
        });
        v.legend([['accent', 'intervals of $E_k$'], ['green', 'ternary path of $x$ (digits $0$ / $2$)'], ['red', 'removed middle third'], ['orange', 'segment probe']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.pt) {
            const digits = s.d.slice(0, 10).join('');
            const len = (2 / 3) ** s.n;
            return `$x = ${v.fix(s.x, 5)} = (0.${digits}\\ldots)_3$. ` + (s.dead ? `Its digit $d_{${s.dead}}=1$, so $x\\notin E_{${s.dead}}$ and $x\\notin P$.` : `No digit $1$ among the first ${s.n}: $x\\in E_{${s.n}}$.`) + ` $E_{${s.n}}$ has $2^{${s.n}} = ${2 ** s.n}$ intervals of total length $(2/3)^{${s.n}} = ${v.fix(len, 4)}\\to 0$.`;
          }
          if (!s.cut) return 'Make the segment a little longer.';
          return `The segment $(${v.fix(s.al, 4)},\\,${v.fix(s.be, 4)})$ meets the open middle third $(${v.fix(s.cut.g0, 4)},\\,${v.fix(s.cut.g1, 4)})$ removed at stage ${s.cut.k}${s.cut.k > s.n ? ' (raise $n$ to see it)' : ''}, so it is not contained in $P$. Shrinking it only postpones the cut: $P$ contains no segment.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.45
    {
      num: '2.45',
      kind: 'Definition',
      name: 'Separated sets; connected sets',
      statement: String.raw`Two subsets $A$ and $B$ of a metric space $X$ are **separated** if $A\cap\overline{B}$ and $\overline{A}\cap B$ are both empty — no point of either set lies in the closure of the other. A set $E\subset X$ is **connected** if it is not the union of two nonempty separated sets.`,
      idea: String.raw`Separated sets are disjoint, but disjoint sets need not be separated: $[0,1]$ and $(1,2)$ are disjoint, yet $1$ lies in the first set and in the closure of the second. Being separated is a condition on how the sets approach each other, not merely on whether they overlap.`,
      caption: String.raw`Drag the discs $A$ and $B$; they snap to tangency when close. Toggle whether each disc includes its boundary circle. Two tangent open discs are separated (the touching point belongs to neither); make one of them closed and the touching point lies in one set and the closure of the other — disjoint but not separated, and $A\cup B$ is connected.`,
      deps: ['pma-2.26'],
      see: ['pma-4.22'],
      tags: ['connectedness'],
      viz(v) {
        const M = v.M, RA = 0.9, RB = 0.7;
        const aC = v.toggle('$A$ closed', false), bC = v.toggle('$B$ closed', true);
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.3, 1.3], equal: true, height: 340, axes: false });
        const a = S.handle(-0.8, 0, { color: 'accent', label: 'A' });
        const b = S.handle(-0.8 + RA + RB, 0, { color: 'red', label: 'B', constrain: (x, y) => { const d = Math.hypot(x - a.x, y - a.y), T = RA + RB; if (Math.abs(d - T) < 0.09 && d > 0) return [a.x + (x - a.x) * T / d, a.y + (y - a.y) * T / d]; return [x, y]; } });
        let st = null;
        v.render(() => {
          const d = Math.hypot(b.x - a.x, b.y - a.y), T = RA + RB;
          const tangent = Math.abs(d - T) < 1e-9, apart = d > T + 1e-9;
          const t = [a.x + (b.x - a.x) * RA / d, a.y + (b.y - a.y) * RA / d];
          const AcapBbar = !apart && (!tangent || aC.value), AbarCapB = !apart && (!tangent || bC.value);
          S.circle(a.x, a.y, RA, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.4, dash: aC.value ? null : [7, 5] });
          S.circle(b.x, b.y, RB, { fill: 'red', fillAlpha: 0.16, color: 'red', width: 2.4, dash: bC.value ? null : [7, 5] });
          if (tangent) {
            const owner = aC.value && bC.value ? 'both' : aC.value ? 'A' : bC.value ? 'B' : null;
            const lab = owner === 'both' ? 't\\in A\\cap B' : owner === 'A' ? 't\\in A\\cap\\overline{B}' : owner === 'B' ? 't\\in\\overline{A}\\cap B' : 't\\notin A\\cup B';
            const nrm = [-(b.y - a.y) / d, (b.x - a.x) / d], up = nrm[1] < 0 ? -1 : 1, lp = [t[0] + nrm[0] * up * 1.05, t[1] + nrm[1] * up * 1.05];
            S.line(t[0], t[1], lp[0] - nrm[0] * up * 0.12, lp[1] - nrm[1] * up * 0.12, { color: owner ? 'orange' : 'green', width: 1.2 });
            S.tex(lab, lp[0], lp[1], { color: owner ? 'orange' : 'green', size: 16 });
            if (owner) S.dot(t[0], t[1], { color: 'orange', r: 6 });
            else S.dot(t[0], t[1], { color: 'green', r: 6, hollow: true, width: 2.2 });
          }
          const sep = !AcapBbar && !AbarCapB;
          S.corner(sep ? 'A and B are separated' : (apart ? '' : !tangent ? 'A and B overlap' : 'disjoint, but not separated'), 'tl', { color: sep ? 'green' : 'red', weight: 600 });
          st = { tangent, apart, AcapBbar, AbarCapB, sep, overlap: !apart && !tangent, both: aC.value && bC.value };
        });
        v.legend([['accent', '$A$ (dashed edge: boundary not included)', { area: true }], ['red', '$B$', { area: true }], ['orange', 'touching point $t$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const f = (e) => (e ? '\\neq\\emptyset' : '=\\emptyset');
          let tail;
          if (s.apart) tail = 'The closures are disjoint: separated, and $A\\cup B$ is disconnected.';
          else if (s.overlap) tail = 'The sets overlap, so they are not even disjoint.';
          else if (s.sep) tail = 'Tangent open discs: the touching point lies in neither set, so they are separated and $A\\cup B$ is **not** connected.';
          else if (s.both) tail = 'Both closed: they share the point $t$, so they are not even disjoint.';
          else tail = '$A\\cap B=\\emptyset$, yet $t$ lies in one set and the closure of the other: **not** separated, and $A\\cup B$ is connected.';
          return `$A\\cap\\overline{B}${f(s.AcapBbar)}$, $\\;\\overline{A}\\cap B${f(s.AbarCapB)}$. ${tail}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.47
    {
      num: '2.47',
      kind: 'Theorem',
      name: 'Connected subsets of ℝ are the intervals',
      statement: String.raw`A subset $E$ of $\R^1$ is connected if and only if it has the following property: whenever $x\in E$, $y\in E$ and $x<z<y$, then $z\in E$.`,
      idea: String.raw`If $x<z<y$ with $x,y\in E$ but $z\notin E$, then $A_z=E\cap(-\infty,z)$ and $B_z=E\cap(z,\infty)$ are nonempty, separated, and their union is $E$. Conversely, if $E=A\cup B$ with $A,B$ nonempty and separated, pick $x\in A$, $y\in B$ with $x<y$ and let $z=\sup(A\cap[x,y])$. Then $z\in\overline{A}$ (2.28), so $z\notin B$; if $z\notin A$, then $z\notin E$ lies between $x$ and $y$; if $z\in A$, then $z\notin\overline{B}$, so a slightly larger $z_1<y$ is in neither set. Either way the interval property fails.`,
      caption: String.raw`Pick $E$ and drag the cut point $z$. If $z$ is a gap of $E$ with points on both sides, the two halves $A_z$ (blue) and $B_z$ (red) are separated and $E$ is disconnected. If $z\in E$, the halves $E\cap(-\infty,z)$ and $E\cap[z,\infty)$ share the point $z$ through a closure — the cut fails. For an interval every cut fails.`,
      deps: ['pma-2.45', 'pma-2.28', 'pma-1.19'],
      see: ['pma-4.22', 'pma-4.23'],
      tags: ['connectedness', 'intervals'],
      viz(v) {
        const M = v.M;
        // E as a list of pieces [a, b, leftClosed, rightClosed]; 'Q' is special
        const SETS = {
          int: { label: '$[0,4]$', pieces: [[0, 4, true, true]] },
          punct: { label: '$[0,4]\\setminus\\{1.5\\}$', pieces: [[0, 1.5, true, false], [1.5, 4, false, true]] },
          glued: { label: '$[0,1.5)\\cup[1.5,4]$', pieces: [[0, 1.5, true, false], [1.5, 4, true, true]] },
          two: { label: '$[0,1]\\cup[2,4]$', pieces: [[0, 1, true, true], [2, 4, true, true]] },
          rat: { label: '$\\mathbb{Q}\\cap[0,4]$', pieces: null },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'punct');
        const S = v.stage({ x: [-0.35, 4.35], y: [-1.0, 1.15], height: 230, axes: false, full: true });
        const z = S.handle(1.5, 0.5, { color: 'purple', label: 'z', constrain: (x) => { let xx = M.clamp(x, 0.05, 3.95); for (const s of [1, 1.5, 2]) if (Math.abs(xx - s) < 0.05) xx = s; return [xx, 0.5]; } });
        const inE = (key, x) => { const P = SETS[key].pieces; if (!P) return false; return P.some(([a, b, lc, rc]) => (x > a && x < b) || (x === a && lc) || (x === b && rc)); };
        const ratPts = (() => { const out = []; for (let q = 1; q <= 30; q++) for (let p = 0; p <= 4 * q; p++) out.push(p / q); return [...new Set(out.map((x) => +x.toFixed(9)))]; })();
        let st = null;
        v.render(() => {
          const key = which.value, E = SETS[key], zz = z.x;
          S.line(-0.35, 0, 4.35, 0, { color: 'faint', width: 1 });
          for (let t = 0; t <= 4; t++) S.text(String(t), t, -0.32, { color: 'muted', align: 'center', size: 11 });
          const zIn = inE(key, zz);
          const hasLeft = E.pieces ? E.pieces.some(([a]) => a < zz) : true, hasRight = E.pieces ? E.pieces.some(([, b]) => b > zz) : true;
          const gap = !zIn && hasLeft && hasRight;
          const draw = (a, b, lc, rc, col, y = 0) => {
            S.line(a, y, b, y, { color: col, width: 7, cap: 'butt' });
            S.dot(a, y, { color: col, r: 4.5, hollow: !lc }); S.dot(b, y, { color: col, r: 4.5, hollow: !rc });
          };
          if (E.pieces) {
            for (const [a, b, lc, rc] of E.pieces) {
              // split each piece at z into the left half (blue) and right half (red)
              if (b <= zz) draw(a, b, lc, rc, 'accent');
              else if (a >= zz) draw(a, b, lc, rc, 'red');
              else { draw(a, zz, lc, false, 'accent'); draw(zz, b, true, rc, 'red'); }
            }
          } else {
            S.dots(ratPts.filter((x) => x < zz).map((x) => [x, 0]), { color: 'accent', r: 1.6 });
            S.dots(ratPts.filter((x) => x > zz).map((x) => [x, 0]), { color: 'red', r: 1.6 });
          }
          S.vline(zz, { color: 'purple', width: 1, dash: [4, 4] });
          if (gap) {
            S.tex('A_z = E\\cap(-\\infty,z)', Math.max(0.6, zz / 2), 0.62, { color: 'accent', size: 14 });
            S.tex('B_z = E\\cap(z,\\infty)', Math.min(3.4, (zz + 4) / 2), 0.62, { color: 'red', size: 14 });
            S.corner('z ∉ E: the two halves are separated — E is not connected', 'bl', { color: 'red', weight: 600 });
          } else if (zIn) {
            S.dot(zz, 0, { color: 'orange', r: 6.5, hollow: true, width: 2.5 });
            S.corner('z ∈ E: z lies in E ∩ [z,∞) and in the closure of E ∩ (−∞,z) — the cut fails', 'bl', { color: 'green', weight: 600 });
          } else S.corner('z is not between two points of E', 'bl', { color: 'muted' });
          st = { key, zz, zIn, gap };
        });
        v.legend([['accent', '$E\\cap(-\\infty,z)$'], ['red', '$E\\cap(z,\\infty)$ or $E\\cap[z,\\infty)$'], ['purple', 'cut point $z$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const verdict = { int: 'connected', punct: 'not connected', glued: 'connected (it is $[0,4]$)', two: 'not connected', rat: 'not connected' }[s.key];
          const zs = `z=${v.fix(s.zz, 3)}`;
          if (s.key === 'rat') return `With $${zs}$ treated as irrational, $\\mathbb{Q}\\cap(-\\infty,z)$ and $\\mathbb{Q}\\cap(z,\\infty)$ are separated: every irrational cut disconnects $\\mathbb{Q}\\cap[0,4]$. Verdict: ${verdict}.`;
          if (s.gap) return `$${zs}\\notin E$ but $E$ has points on both sides: $E=A_z\\cup B_z$ with $\\overline{A_z}\\subset(-\\infty,z]$ and $\\overline{B_z}\\subset[z,\\infty)$, so the halves are separated. Verdict: ${verdict}.`;
          return `$${zs}\\in E$: the two halves meet at $z$ through a closure, so this cut does not separate $E$. Verdict for this $E$: ${verdict}${s.key === 'punct' || s.key === 'two' ? ' — try another $z$' : ''}.`;
        });
      },
    },
  ],
};
