// Rudin, Principles of Mathematical Analysis — Chapter 2 (part): open/closed sets, closures, relative openness, 2.23–2.30

const yes = (b) => (b ? '✓' : '✗');
// Draw a closed curve sampled at parameter values, split into runs by a boolean predicate.
function runs(S, pts, flags, onStyle, offStyle) {
  let run = [pts[0]], cur = flags[0];
  for (let i = 1; i < pts.length; i++) {
    if (flags[i] !== cur) { run.push(pts[i]); S.path(run, cur ? onStyle : offStyle); run = [pts[i]]; cur = flags[i]; } else run.push(pts[i]);
  }
  S.path(run, cur ? onStyle : offStyle);
}
// Polygon approximating a circle (for filled unions drawn in one path).
const ring = (cx, cy, r, n = 48) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);

export default {
  book: 'pma',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.23
    {
      num: '2.23',
      kind: 'Theorem',
      name: 'A set is open iff its complement is closed',
      statement: String.raw`A set $E$ in a metric space is open if and only if its complement $E^c$ is closed.`,
      idea: String.raw`For a point $x\in E$, "$x$ is interior to $E$" and "$x$ is not a limit point of $E^c$" say the same thing: some neighbourhood of $x$ misses $E^c$. If $E^c$ is closed, no point of $E$ is a limit point of $E^c$, so every point of $E$ is interior. If $E$ is open, a limit point of $E^c$ cannot be interior to $E$, so it cannot lie in $E$ — it lies in $E^c$.`,
      caption: String.raw`$E$ is the open disc together with some of its rim: solid blue arcs belong to $E$, dashed red arcs to $E^c$. Drag $x$ (it snaps to the rim) and change $r$. At a point of $E$ on the rim (gold) both properties fail at once: $x$ is not interior to $E$, and $x$ is a limit point of $E^c$ that $E^c$ does not contain.`,
      deps: ['pma-2.18'],
      see: ['pma-4.8'],
      tags: ['open sets', 'closed sets'],
      viz(v) {
        const EX = {
          open: { label: 'open disc', arc: () => false, has: false },
          closed: { label: 'closed disc', arc: () => true, has: true },
          half: { label: 'open disc + upper rim', arc: (t) => Math.sin(t) > 1e-9, has: true },
        };
        const which = v.select('$E$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'half');
        const rad = v.slider('radius $r$', 0.04, 0.9, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.45, 1.45], equal: true, height: 340, axes: false });
        const X = S.handle(Math.cos(1.1), Math.sin(1.1), {
          color: 'ink', label: 'x',
          constrain: (x, y) => { const n = Math.hypot(x, y); return Math.abs(n - 1) < 11 / S.scale && n > 0 ? [x / n, y / n] : [x, y]; },
        });
        const B = v.rgb('blue'), R = v.rgb('red');
        let st = {};
        v.render(() => {
          const E = EX[which.value], r = rad.value;
          const inE = (x, y) => { const n = Math.hypot(x, y); if (n < 1 - 1e-9) return true; if (n > 1 + 1e-9) return false; return E.arc(Math.atan2(y, x)); };
          const px = X.x, py = X.y;
          S.raster((x, y) => {
            const inN = (x - px) ** 2 + (y - py) ** 2 < r * r, e = Math.hypot(x, y) < 1;
            if (inN) return e ? [B[0], B[1], B[2], 110] : [R[0], R[1], R[2], 95];
            return e ? [B[0], B[1], B[2], 40] : [R[0], R[1], R[2], 20];
          }, { res: 2, key: `${px},${py},${r}` });
          // the rim, coloured by membership
          const ts = Array.from({ length: 721 }, (_, i) => (2 * Math.PI * i) / 720 - Math.PI);
          const pts = ts.map((t) => [Math.cos(t), Math.sin(t)]), fl = ts.map((t) => E.arc(t));
          if (E.has) runs(S, pts, fl, { color: 'gold', width: 9, alpha: 0.45 }, { stroke: false });
          runs(S, pts, fl, { color: 'blue', width: 3 }, { color: 'red', width: 2, dash: [6, 5] });
          S.circle(px, py, r, { color: 'orange', width: 1.8, dash: [5, 4] });
          S.tex('E', -0.35, -0.3, { color: 'blue', size: 20 });
          S.tex('E^c', 1.75, -1.0, { color: 'red', size: 20 });
          const n = Math.hypot(px, py), xin = inE(px, py), interior = n < 1 - 1e-9, limEc = n >= 1 - 1e-9;
          S.corner(`E open ${yes(!E.has)}    Eᶜ closed ${yes(!E.has)}`, 'tl', { color: E.has ? 'red' : 'green', weight: 700, size: 13 });
          st = { xin, interior, limEc, has: E.has };
        });
        v.legend([['blue', '$E$', { area: true }], ['red', '$E^c$', { area: true }], ['gold', 'points of $E$ that are limit points of $E^c$'], ['orange', '$N_r(x)$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.xin == null) return '';
          if (!s.xin) return `$x\\in E^c$${s.limEc ? ', and $x$ is a limit point of $E^c$ lying in $E^c$ — harmless for closedness.' : '.'} Move $x$ into $E$ or onto a solid arc.`;
          return `$x\\in E$: interior point of $E$ ${yes(s.interior)} $\\iff$ not a limit point of $E^c$ ${yes(!s.limEc)}.` + (s.interior ? ' A small enough $N_r(x)$ misses $E^c$.' : ' Every $N_r(x)$ meets $E^c$: this one point makes $E$ not open and $E^c$ not closed.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.23a
    {
      num: '2.23a',
      kind: 'Corollary',
      name: 'A set is closed iff its complement is open',
      statement: String.raw`A set $F$ in a metric space is closed if and only if its complement $F^c$ is open.`,
      idea: String.raw`Apply 2.23 to $E=F^c$, whose complement is $F$. Concretely: if $F$ is closed and $x\notin F$, then $x$ is not a limit point of $F$, so some neighbourhood of $x$ misses $F$ entirely — $x$ is an interior point of $F^c$.`,
      caption: String.raw`$F$ is a closed disc together with a sequence and its limit $L$. The contour lines show the distance to $F$. Drag $x$ around $F^c$: the green disc of radius $\dist(x,F)>0$ always fits inside $F^c$. Now remove $L$ from $F$: $F$ is no longer closed, and at $x=L$ (it snaps there) no neighbourhood of $x$ lies in $F^c$.`,
      deps: ['pma-2.23'],
      tags: ['open sets', 'closed sets'],
      viz(v) {
        const D = { c: [-1.3, 0.2], R: 0.8 };
        const L = [0.55, -0.3];
        const seq = Array.from({ length: 300 }, (_, i) => { const n = i + 1; return [L[0] + 2.0 / n, L[1] + (0.45 * Math.sin(1.3 * n)) / n]; });
        const withL = v.toggle('$L\\in F$', true);
        const S = v.stage({ x: [-2.3, 2.9], y: [-1.35, 1.35], equal: true, height: 350, axes: false });
        const X = S.handle(1.05, 0.25, { color: 'green', label: 'x', constrain: (x, y) => (Math.hypot(x - L[0], y - L[1]) < 11 / S.scale ? L.slice() : [x, y]) });
        // dist(x, F) = dist(x, closure of F): the infinitely many terms near L make |x - L| an infimum
        // whether or not L itself belongs to F (only 300 terms are stored, so L is added explicitly).
        const distF = (x, y) => {
          let d = Math.max(0, Math.hypot(x - D.c[0], y - D.c[1]) - D.R);
          for (const q of seq) { const e = Math.hypot(x - q[0], y - q[1]); if (e < d) d = e; }
          return Math.min(d, Math.hypot(x - L[0], y - L[1]));
        };
        const Rd = v.rgb('red'), Mu = v.rgb('red');
        let st = {};
        v.render(() => {
          const incl = withL.value;
          S.raster((x, y) => {
            const d = distF(x, y);
            if (d <= 0) return null;
            const band = (d / 0.18) % 1;
            return band < 0.08 ? [Mu[0], Mu[1], Mu[2], 85] : [Rd[0], Rd[1], Rd[2], 22];
          }, { res: 2, key: 'F' });
          S.circle(D.c[0], D.c[1], D.R, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 2.2 });
          S.dots(seq.slice(30), { r: 2, color: 'blue' });
          seq.slice(0, 30).forEach((q) => S.dot(q[0], q[1], { r: 3.4, color: 'blue' }));
          if (incl) S.dot(L[0], L[1], { r: 4.5, color: 'blue', label: 'L', labelPos: 'sw' });
          else S.dot(L[0], L[1], { r: 5, color: 'red', hollow: true, width: 2.2, label: 'L', labelPos: 'sw' });
          S.tex('F', D.c[0], D.c[1], { color: 'blue', size: 20 });
          S.tex('F^c', 2.3, 0.95, { color: 'red', size: 20 });
          const inDisc = Math.hypot(X.x - D.c[0], X.y - D.c[1]) <= D.R;
          const d = inDisc ? 0 : distF(X.x, X.y);
          const atL = Math.hypot(X.x - L[0], X.y - L[1]) < 1e-9;
          const xInF = inDisc || (atL && incl) || seq.some((q) => Math.hypot(X.x - q[0], X.y - q[1]) < 1e-9);
          if (!xInF && d > 1e-9) { S.circle(X.x, X.y, d, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2 }); }
          if (!xInF && d <= 1e-9) for (const rr of [0.06, 0.13, 0.22]) S.circle(X.x, X.y, rr, { color: 'red', width: 1.5, dash: [3, 3] });
          S.corner(incl ? 'F closed ✓    Fᶜ open ✓' : 'F not closed (L missing)    Fᶜ not open', 'tl', { color: incl ? 'green' : 'red', weight: 700, size: 13 });
          st = { d, xInF, incl, atL };
        });
        v.legend([['blue', '$F$', { area: true }], ['red', '$F^c$ with level lines of $\\dist(\\cdot,F)$', { area: true }], ['green', 'a neighbourhood of $x$ inside $F^c$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          if (s.xInF) return '$x\\in F$; move it into $F^c$.';
          if (s.d > 1e-9) return `$\\dist(x,F) = ${v.fix(s.d, 3)} > 0$, so $N_{${v.fix(s.d, 3)}}(x)\\subset F^c$: $x$ is an interior point of $F^c$.`;
          return '$x = L\\notin F$, yet every neighbourhood of $x$ meets $F$ (the sequence approaches $L$): $x$ is not interior to $F^c$, so $F^c$ is not open — matching the fact that $F$ is not closed.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.24
    {
      num: '2.24',
      kind: 'Theorem',
      name: 'Unions and intersections of open and closed sets',
      statement: String.raw`In a metric space:
(a) the union of any collection $\{G_\alpha\}$ of open sets is open;
(b) the intersection of any collection $\{F_\alpha\}$ of closed sets is closed;
(c) the intersection of finitely many open sets $G_1,\dots,G_n$ is open;
(d) the union of finitely many closed sets $F_1,\dots,F_n$ is closed.`,
      idea: String.raw`(a) A point of $\bigcup G_\alpha$ lies in one $G_\alpha$, and a neighbourhood inside that $G_\alpha$ is inside the union. (c) A point $x$ of $\bigcap_{i\le n}G_i$ has neighbourhoods $N_{r_i}(x)\subset G_i$; the radius $r=\min(r_1,\dots,r_n)$ is positive because there are only finitely many. (b) and (d) follow from (a) and (c) by taking complements (2.22, 2.23). Finiteness matters (2.25): $\bigcap_n(-\tfrac1n,\tfrac1n)=\{0\}$ is not open, and $\bigcup_n[\tfrac1{n+1},1]=(0,1]$ is not closed.`,
      caption: String.raw`Pick a statement, the number $n$ of sets (the last stop is $\infty$) and drag $x$ along the bottom row, which shows the resulting set. Orange marks the room $r_k$ that set $k$ leaves around $x$ — inside $G_k$ for open sets, outside $F_k$ for closed ones. In (a) and (b) one set suffices, so $r=\max r_k$; in (c) and (d) all sets must agree, so $r=\min r_k$, which collapses to $0$ when $n=\infty$ and $x=0$ (Rudin's examples 2.25).`,
      deps: ['pma-2.22', 'pma-2.23', 'pma-2.18'],
      see: ['rca-1.2'],
      tags: ['open sets', 'closed sets'],
      viz(v) {
        const dk = (k) => 0.2 / (k + 1) ** 2;
        const MODES = {
          a: { label: '(a) any $\\bigcup G_k$', open: true, union: true, set: (k) => [1 / (k + 1) - dk(k), 1 / k + dk(k)], view: [-0.12, 1.2], x0: 0.42 },
          b: { label: '(b) any $\\bigcap F_k$', open: false, union: false, set: (k) => [-0.5 / k, 0.8 + 0.4 / k], view: [-0.65, 1.35], x0: 1.05 },
          c: { label: '(c) $G_1\\cap\\cdots\\cap G_n$', open: true, union: false, set: (k) => [-1 / k, 1 / k], view: [-1.15, 1.15], x0: 0.06 },
          d: { label: '(d) $F_1\\cup\\cdots\\cup F_n$', open: false, union: true, set: (k) => [1 / (k + 1), 1], view: [-0.35, 1.15], x0: -0.08 },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'c');
        const nS = v.slider('number of sets $n$', 1, 13, 4, { int: true, fmt: (x) => (x >= 13 ? '∞' : String(x)) });
        const S = v.stage({ x: [-1.15, 1.15], y: [-7, -0.3], height: 360, axes: false });
        let yRes = -6;
        const X = S.handle(0.06, yRes, { color: 'ink', label: 'x', constrain: (x) => [Math.abs(x) < 9 / S.scale ? 0 : x, yRes] });
        let last = null, st = {};
        // room that the k-th set leaves around x: inside it (open) or outside it (closed); 0 if x is on the wrong side
        const room = (M, k, x) => { const [a, b] = M.set(k); return M.open ? Math.max(0, Math.min(x - a, b - x)) : x < a ? a - x : x > b ? x - b : 0; };
        v.render(() => {
          const w = which.value, M = MODES[w], n = nS.value, inf = n >= 13, m = Math.min(inf ? 8 : n, 8);
          if (last !== w) { last = w; S.setView(M.view, null); X.x = M.x0; }
          yRes = -(m + 1.7); X.y = yRes;
          S.setView(null, [yRes - 0.75, -0.3]);
          const x = X.x;
          // rows
          const rk = [];
          const K = inf ? 4000 : n;
          for (let k = 1; k <= K; k++) rk.push(room(M, k, x));
          for (let k = 1; k <= m; k++) {
            const [a, b] = M.set(k), y = -k;
            S.interval(a, b, y, { open: [M.open, M.open], color: M.open ? 'blue' : 'purple', width: 4, r: 4 });
            S.tex(M.open ? `G_{${k}}` : `F_{${k}}`, S.bounds.x[0], y, { align: 'left', dx: 8, color: M.open ? 'blue' : 'purple', size: 14 });
            if (rk[k - 1] > 0) S.line(x - rk[k - 1], y - 0.28, x + rk[k - 1], y - 0.28, { color: 'orange', width: 3 });
          }
          if (inf || n > 8) S.text(inf ? '⋮  (infinitely many)' : `⋮  (${n - 8} more)`, (M.view[0] + M.view[1]) / 2, -(m + 0.75), { align: 'center', color: 'muted', size: 12 });
          S.vline(x, { color: 'faint', width: 1, dash: [3, 3] });
          // the resulting set
          let lo, hi, loOpen, hiOpen, good;
          if (w === 'a') { lo = inf ? 0 : 1 / (n + 1) - dk(n); hi = 1 + dk(1); loOpen = hiOpen = true; good = true; }
          if (w === 'b') { lo = inf ? 0 : -0.5 / n; hi = inf ? 0.8 : 0.8 + 0.4 / n; loOpen = hiOpen = false; good = true; }
          if (w === 'c') { lo = inf ? 0 : -1 / n; hi = inf ? 0 : 1 / n; loOpen = hiOpen = !inf; good = !inf; }
          if (w === 'd') { lo = inf ? 0 : 1 / (n + 1); hi = 1; loOpen = inf; hiOpen = false; good = !inf; }
          S.line(M.view[0], yRes + 0.62, M.view[1], yRes + 0.62, { color: 'grid', width: 1 });
          S.interval(lo, hi, yRes, { open: [loOpen, hiOpen], color: good ? 'green' : 'red', width: 6, r: 5 });
          S.tex(M.union ? (M.open ? '\\bigcup G_k' : '\\bigcup F_k') : M.open ? '\\bigcap G_k' : '\\bigcap F_k', S.bounds.x[0], yRes, { align: 'left', dx: 6, color: good ? 'green' : 'red', size: 15 });
          // combined room: one set suffices (max) or all must agree (min)
          const inResult = x > lo - 1e-12 && x < hi + 1e-12 && !(loOpen && Math.abs(x - lo) < 1e-12) && !(hiOpen && Math.abs(x - hi) < 1e-12);
          const relevant = M.open ? inResult : !inResult;
          let r;
          if (M.union === M.open) r = Math.max(...rk); // (a) union of open, (b) intersection of closed
          else if (inf) r = w === 'c' ? 0 : x <= 0 ? -x : Math.max(0, x - 1); // infimum over all k
          else r = Math.min(...rk);
          if (relevant && r > 1e-12) S.line(x - r, yRes - 0.36, x + r, yRes - 0.36, { color: 'green', width: 4 });
          if (relevant && r <= 1e-12) S.corner(M.open ? 'r = inf r_k = 0: no neighbourhood of x fits — not open' : 'r = inf r_k = 0: x is a limit point outside the set — not closed', 'tr', { color: 'red', weight: 600 });
          st = { w, M, n, inf, x, r, relevant, good, inResult };
        });
        v.legend([['blue', 'open sets $G_k$'], ['purple', 'closed sets $F_k$'], ['orange', 'room $r_k$ around $x$'], ['green', 'resulting neighbourhood']]);
        v.readout(() => {
          const s = st; if (!s.M) return '';
          const kind = s.M.open ? 'open' : 'closed';
          const rule = s.M.union === s.M.open ? '$r=\\max_k r_k$ (one set is enough)' : s.inf ? '$r=\\inf_k r_k$ over infinitely many sets' : '$r=\\min_k r_k$ over finitely many sets';
          if (!s.relevant) return s.M.open ? 'Put $x$ inside the resulting set to test openness.' : 'Put $x$ outside the resulting set to test closedness (its complement must be open).';
          if (s.r <= 1e-12) return `${rule} $= 0$ — no neighbourhood of $x$ lies ${s.M.open ? 'inside' : 'outside'} the set, so the result is not ${kind}.`;
          return `${rule} $= ${v.fix(s.r, 4)}$ — a neighbourhood of $x$ ${s.M.open ? 'inside' : 'outside'} the set. ` + (s.good ? `This works at every such $x$, so the result is ${kind}.` : 'Fine at this $x$, but drag $x$ to $0$: there the infimum is $0$.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.26
    {
      num: '2.26',
      kind: 'Definition',
      name: 'Closure of a set',
      statement: String.raw`Let $X$ be a metric space, $E\subset X$, and let $E'$ be the set of all limit points of $E$ in $X$. The **closure** of $E$ is $\bar E=E\cup E'$.`,
      idea: String.raw`Closing a set adds exactly the points that $E$ approaches but may miss: endpoints of intervals, limits of sequences, everything in between when $E$ is dense. Theorem 2.27 shows that $\bar E$ is closed and is the smallest closed set containing $E$; $E$ is dense in $X$ precisely when $\bar E=X$.`,
      caption: String.raw`Three rows on the real line: $E$, its limit points $E'$, and $\bar E=E\cup E'$, with the points added by the closure ringed in green. Drag $p$ (it snaps to notable points) and shrink the window $(p-r,p+r)$: $p\in E'$ when every such window contains points of $E$ other than $p$.`,
      deps: ['pma-2.18'],
      tags: ['closure'],
      viz(v) {
        const eq = (a, b) => Math.abs(a - b) < 1e-9;
        const isRecip = (x) => x > 0 && eq(1 / x, Math.round(1 / x));
        const sumRecip = (x) => { for (let m = 1; m <= 400; m++) { const rem = x - 1 / m; if (rem > 1e-12 && Math.abs(1 / rem - Math.round(1 / rem)) < 1e-6 * (1 / rem)) return true; } return false; };
        const fracs = []; for (let q = 1; q <= 24; q++) for (let p = 1; p < q; p++) if (((a, b) => { while (b) [a, b] = [b, a % b]; return a; })(p, q) === 1) fracs.push(p / q);
        const EX = {
          int: { label: '$(0,1)\\cup\\{\\frac32\\}$', inE: (x) => (x > 1e-12 && x < 1 - 1e-12) || eq(x, 1.5), lim: (x) => x >= -1e-12 && x <= 1 + 1e-12, segs: [[0, 1, true, true]], pts: [1.5], limSegs: [[0, 1]], limPts: [], snaps: [0, 1, 1.5] },
          rec: { label: '$\\{1/n\\}$', inE: isRecip, lim: (x) => eq(x, 0), pts: Array.from({ length: 300 }, (_, i) => 1 / (i + 1)), limPts: [0], snaps: [0, ...Array.from({ length: 30 }, (_, i) => 1 / (i + 1))] },
          dbl: { label: '$\\{\\frac1m+\\frac1n\\}$', inE: sumRecip, lim: (x) => eq(x, 0) || isRecip(x), pts: (() => { const s = new Set(); for (let m = 1; m <= 120; m++) for (let n = m; n <= 120; n++) s.add(1 / m + 1 / n); return [...s]; })(), limPts: [0, ...Array.from({ length: 200 }, (_, i) => 1 / (i + 1))], snaps: [0, ...Array.from({ length: 12 }, (_, i) => 1 / (i + 1)), ...[[2, 3], [2, 4], [3, 4], [3, 5], [4, 5], [3, 6]].map(([m, n]) => 1 / m + 1 / n)] },
          q: { label: '$\\Q\\cap(0,1)$', inE: (x) => x > 1e-12 && x < 1 - 1e-12 && fracs.some((f) => eq(f, x)), lim: (x) => x >= -1e-12 && x <= 1 + 1e-12, pts: fracs, limSegs: [[0, 1]], limPts: [], snaps: [0, 1, ...fracs.filter((f) => [2, 3, 4, 5, 6, 8].some((q) => eq(f * q, Math.round(f * q))))] },
        };
        const which = v.select('$E$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'dbl');
        const rad = v.slider('window $r$', 0.004, 0.4, 0.06, { log: true, decimals: 3 });
        const S = v.stage({ x: [-0.22, 2.08], y: [-0.7, 2.75], height: 300, axes: false });
        const P = S.handle(0.5, -0.45, {
          color: 'ink', label: 'p',
          constrain: (x) => { const tol = 9 / S.scale; for (const c of EX[which.value].snaps) if (Math.abs(c - x) < tol) return [c, -0.45]; return [x, -0.45]; },
        });
        P.labelPos = 'e';
        const ROW = { E: 2.2, D: 1.2, C: 0.2 };
        let st = {}, last = 'dbl';
        v.render(() => {
          const w = which.value, E = EX[w], r = rad.value;
          if (last !== w) { last = w; P.x = { int: 1, rec: 0, dbl: 0.5, q: 0.5 }[w]; }
          const p = P.x;
          S.vband(p - r, p + r, { color: 'orange', alpha: 0.12, edges: true });
          for (const [key, y, lab, col] of [['E', ROW.E, 'E', 'blue'], ['D', ROW.D, "E'", 'purple'], ['C', ROW.C, '\\bar E', 'green']]) {
            S.line(-0.1, y, 2.02, y, { color: 'grid', width: 1 });
            S.tex(lab, -0.16, y, { color: col, size: 16 });
          }
          for (const t of [0, 0.5, 1, 1.5, 2]) S.text(String(t), t, ROW.C - 0.32, { align: 'center', size: 10.5, color: 'muted' });
          const drawSet = (y, segs, pts, col, ptR) => {
            for (const [a, b, lo, ro] of segs || []) S.interval(a, b, y, { open: [!!lo, !!ro], color: col, width: 5, r: 4.5 });
            const big = (pts || []).filter((x) => x > 0.06), small = (pts || []).filter((x) => x <= 0.06);
            S.dots(small.map((x) => [x, y]), { r: ptR * 0.7, color: col });
            for (const x of big) S.dot(x, y, { r: ptR, color: col, ring: false });
          };
          // E
          drawSet(ROW.E, E.segs, E.pts, 'blue', 3.2);
          // E' (limit points)
          drawSet(ROW.D, (E.limSegs || []).map(([a, b]) => [a, b, false, false]), E.limPts, 'purple', 3.2);
          // closure = E ∪ E'
          drawSet(ROW.C, (E.limSegs || []).map(([a, b]) => [a, b, false, false]), [...(E.pts || []), ...E.limPts], 'green', 3.2);
          const added = [...E.limPts.filter((x) => !E.inE(x)), ...(w === 'int' || w === 'q' ? [0, 1] : [])];
          for (const x of added) if (x > 0.035 || x === 0) S.dot(x, ROW.C, { r: 7, hollow: true, color: 'green', width: 2 });
          // points of E in the window, other than p
          const inWin = (E.pts || []).filter((x) => Math.abs(x - p) < r && !eq(x, p));
          S.dots(inWin.map((x) => [x, ROW.E]), { r: 3.4, color: 'gold' });
          S.line(p, ROW.E + 0.45, p, -0.45, { color: 'ink', width: 1, dash: [2, 3], alpha: 0.6 });
          const segHit = (E.segs || []).some(([a, b]) => p + r > a && p - r < b);
          st = { inE: E.inE(p), lim: E.lim(p), w, hits: inWin.length + (segHit ? Infinity : 0) };
        });
        v.legend([['blue', '$E$', { dot: true }], ['purple', "$E'$", { dot: true }], ['green', '$\\bar E=E\\cup E\'$ (rings: added points)', { dot: true }], ['orange', 'window $(p-r,p+r)$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const pre = `$p\\in E$ ${yes(s.inE)}$\\quad p\\in E'$ ${yes(s.lim)}$\\quad p\\in\\bar E$ ${yes(s.inE || s.lim)}`;
          const win = s.hits === Infinity ? 'the window meets $E$ in infinitely many points' : s.hits ? `the window holds ${s.hits} point${s.hits === 1 ? '' : 's'} of $E$ other than $p$` : 'the window holds no point of $E$ other than $p$';
          return `${pre} — ${win}.` + (s.w === 'q' ? ' (Points not snapped to a fraction stand for irrationals.)' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.27
    {
      num: '2.27',
      kind: 'Theorem',
      name: 'The closure is the smallest closed superset',
      statement: String.raw`Let $X$ be a metric space and $E\subset X$. Then
(a) $\bar E$ is closed;
(b) $E=\bar E$ if and only if $E$ is closed;
(c) $\bar E\subset F$ for every closed set $F\subset X$ with $E\subset F$.
By (a) and (c), $\bar E$ is the smallest closed subset of $X$ containing $E$.`,
      idea: String.raw`(a) If $p\notin\bar E$, then $p$ is neither in $E$ nor a limit point of $E$, so some neighbourhood $N$ of $p$ misses $E$; since $N$ is open (2.19), no point of $N$ is a limit point of $E$ either, so $N$ misses $\bar E$ and $(\bar E)^c$ is open. (b) If $E$ is closed then $E'\subset E$, so $\bar E=E$; the converse is (a). (c) If $F\supset E$ is closed, then $F\supset F'\supset E'$, hence $F\supset\bar E$.`,
      caption: String.raw`$E$ is an open disc plus a sequence converging to $L$; $\bar E$ adds the rim and $L$ (green). Left: drag $p$ off $\bar E$ — the orange disc of radius $\dist(p,\bar E)$ misses $\bar E$, so $(\bar E)^c$ is open. Right: drag the corners of the closed rectangle $F$; whenever it contains $E$ it contains $\bar E$. Make $F$ open and you can squeeze $L$ onto its edge (corners snap there).`,
      deps: ['pma-2.26', 'pma-2.19', 'pma-2.23'],
      tags: ['closure', 'closed sets'],
      viz(v) {
        const D = { c: [-0.95, 0.05], R: 0.62 };
        const L = [1.3, 0.1];
        const seq = Array.from({ length: 400 }, (_, i) => { const n = i + 1; return [L[0] - 1.05 / n, L[1] + (0.55 * Math.cos(2.1 * n)) / n]; });
        const openF = v.toggle('make $F$ open (edges excluded)', false);
        const A = v.stage({ x: [-1.75, 1.85], y: [-1.15, 1.15], equal: true, height: 290, axes: false, title: '(a) $(\\bar E)^c$ is open' });
        const B = v.stage({ x: [-1.75, 1.85], y: [-1.15, 1.15], equal: true, height: 290, axes: false, title: '(c) a closed $F\\supset E$ contains $\\bar E$' });
        const P = A.handle(0.05, 0.62, { color: 'orange', label: 'p' });
        const keyX = [D.c[0] - D.R, D.c[0] + D.R, L[0]], keyY = [D.c[1] - D.R, D.c[1] + D.R, L[1]];
        const snap = (x, y) => { const t = 9 / B.scale; for (const k of keyX) if (Math.abs(x - k) < t) x = k; for (const k of keyY) if (Math.abs(y - k) < t) y = k; return [x, y]; };
        const C0 = B.handle(-1.65, -0.8, { color: 'purple', constrain: snap });
        const C1 = B.handle(1.75, 0.85, { color: 'purple', constrain: snap });
        const dist = (x, y) => { let d = Math.max(0, Math.hypot(x - D.c[0], y - D.c[1]) - D.R); for (const q of seq) d = Math.min(d, Math.hypot(x - q[0], y - q[1])); return Math.min(d, Math.hypot(x - L[0], y - L[1])); };
        const drawE = (S) => {
          S.circle(D.c[0], D.c[1], D.R, { fill: 'blue', fillAlpha: 0.25, stroke: false });
          S.circle(D.c[0], D.c[1], D.R, { color: 'green', width: 2.6 });
          S.dots(seq.slice(25), { r: 1.8, color: 'blue' });
          seq.slice(0, 25).forEach((q) => S.dot(q[0], q[1], { r: 3.2, color: 'blue' }));
          S.dot(L[0], L[1], { r: 4.6, color: 'green', label: 'L', labelPos: 'n' });
          S.tex('E', D.c[0], D.c[1], { color: 'blue', size: 18 });
        };
        let st = {};
        v.render(() => {
          // (a)
          drawE(A);
          const d = dist(P.x, P.y);
          if (d > 1e-9) A.circle(P.x, P.y, d, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1.8 });
          A.corner(d > 1e-9 ? `dist(p, Ē) = ${v.fmt(d, 3)} > 0` : 'p ∈ Ē', 'bl', { color: d > 1e-9 ? 'orange' : 'green', weight: 600 });
          // (c)
          const x0 = Math.min(C0.x, C1.x), x1 = Math.max(C0.x, C1.x), y0 = Math.min(C0.y, C1.y), y1 = Math.max(C0.y, C1.y);
          const op = openF.value;
          const inF = (x, y) => (op ? x > x0 && x < x1 && y > y0 && y < y1 : x >= x0 && x <= x1 && y >= y0 && y <= y1);
          const discIn = D.c[0] - D.R >= x0 && D.c[0] + D.R <= x1 && D.c[1] - D.R >= y0 && D.c[1] + D.R <= y1;
          const rimIn = op ? D.c[0] - D.R > x0 && D.c[0] + D.R < x1 && D.c[1] - D.R > y0 && D.c[1] + D.R < y1 : discIn;
          const seqIn = seq.every((q) => inF(q[0], q[1]));
          const EinF = discIn && seqIn, LinF = inF(L[0], L[1]), barIn = EinF && rimIn && LinF;
          B.rect(x0, y0, x1, y1, { fill: 'purple', fillAlpha: 0.08, color: 'purple', width: 2, dash: op ? [6, 5] : null });
          drawE(B);
          B.corner(`E ⊂ F ${yes(EinF)}    Ē ⊂ F ${yes(barIn)}`, 'bl', { color: EinF && !barIn ? 'red' : EinF ? 'green' : 'muted', weight: 700 });
          st = { d, EinF, barIn, op, LinF, rimIn };
        });
        v.legend([['blue', '$E$', { area: true }], ['green', "points of $E'$ added by the closure (rim, $L$)"], ['orange', 'neighbourhood missing $\\bar E$', { area: true }], ['purple', 'the set $F$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          let c;
          if (!s.EinF) c = 'Right: $F$ does not contain $E$ yet — enlarge it.';
          else if (s.barIn) c = `Right: $E\\subset F$ and $\\bar E\\subset F$${s.op ? ' (this open $F$ happens to work)' : ', as (c) promises for closed $F$'}.`;
          else c = `Right: $E\\subset F$ but $\\bar E\\not\\subset F$ — ${!s.LinF ? '$L$' : 'the rim'} lies on the excluded edge. Only possible because this $F$ is not closed.`;
          return (s.d > 1e-9 ? `Left: $N_{${v.fix(s.d, 3)}}(p)$ misses $\\bar E$. ` : 'Left: $p\\in\\bar E$; drag it away. ') + c;
        });
      },
    },
    // ------------------------------------------------------------------ 2.28
    {
      num: '2.28',
      kind: 'Theorem',
      name: 'The supremum lies in the closure',
      statement: String.raw`Let $E\subset\R$ be nonempty and bounded above, and let $y=\sup E$. Then $y\in\bar E$. In particular $y\in E$ if $E$ is closed.`,
      idea: String.raw`If $y\in E$ there is nothing to show. Otherwise, for each $h>0$ the number $y-h$ is not an upper bound (it is smaller than the least one), so some $x\in E$ satisfies $y-h<x<y$. Thus every neighbourhood of $y$ meets $E$ in a point other than $y$: $y$ is a limit point of $E$, and $y\in\bar E$. If $E$ is closed, $\bar E=E$ (2.27).`,
      caption: String.raw`Choose $E$ and shrink $h$. The lower panel magnifies the window $(y-h,\,y]$ around $y=\sup E$; a point $x\in E$ inside it (gold) shows that $y-h$ is not an upper bound. For $\{1-\frac1n\}$ and $\{q\in\Q: q^2<2\}$ the supremum is approached but not attained — it lies in $\bar E\setminus E$; for the closed set it is attained.`,
      deps: ['pma-1.8', 'pma-2.26', 'pma-2.27'],
      see: ['pma-4.16'],
      tags: ['supremum', 'closure'],
      viz(v) {
        const qs = []; for (let q = 1; q <= 60; q++) for (let p = 1; p <= 2 * q; p++) if (p * p < 2 * q * q) qs.push(p / q);
        for (const [p, q] of [[239, 169], [1393, 985], [8119, 5741]]) qs.push(p / q); // convergents of √2 from below
        const EX = {
          seq: { label: '$\\{1-\\frac1n\\}$', y: 1, attained: false, pts: Array.from({ length: 5000 }, (_, i) => 1 - 1 / (i + 1)), view: [-0.15, 1.55] },
          rt2: { label: '$\\{q\\in\\Q:0<q,\\;q^2<2\\}$', y: Math.SQRT2, attained: false, pts: qs, view: [-0.1, 1.9] },
          cl: { label: '$[0,\\tfrac12]\\cup[\\tfrac34,\\tfrac98]$ (closed)', y: 1.125, attained: true, segs: [[0, 0.5], [0.75, 1.125]], view: [-0.15, 1.55] },
          fin: { label: 'finite set', y: 1.3, attained: true, pts: [0.1, 0.45, 0.6, 1.05, 1.3], view: [-0.15, 1.55] },
        };
        const which = v.select('$E$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'seq');
        const hS = v.slider('$h$', 0.0005, 0.6, 0.08, { log: true, decimals: 4 });
        const T = v.stage({ x: [-0.15, 1.55], y: [-0.5, 0.6], height: 150, axes: false, full: true, title: 'the set $E$ and its supremum' });
        const Z = v.stage({ x: [-1, 1], y: [-0.5, 0.6], height: 150, axes: false, full: true, title: 'magnified window around $y=\\sup E$' });
        // a point of E in (y-h, y]: the smallest one (attained sups use y itself), or null
        const witness = (E, h) => {
          let best = null;
          if (E.attained) return E.y;
          for (const x of E.pts || []) if (x > E.y - h && x <= E.y + 1e-12 && (best === null || x < best)) best = x;
          for (const [a, b] of E.segs || []) if (b > E.y - h) best = Math.max(best ?? -Infinity, Math.min(b, E.y));
          return best;
        };
        let st = {};
        v.render(() => {
          const E = EX[which.value], h = hS.value, y = E.y;
          T.setView(E.view, null);
          const drawE = (S, map, rad) => {
            for (const [a, b] of E.segs || []) S.interval(map(a), map(b), 0, { color: 'blue', width: 5, r: 4 });
            const pts = (E.pts || []).map((x) => [map(x), 0]).filter((p) => p[0] > S.bounds.x[0] - 1 && p[0] < S.bounds.x[1] + 1);
            S.dots(pts, { r: rad, color: 'blue' });
          };
          // overview
          T.line(E.view[0], 0, E.view[1], 0, { color: 'faint', width: 1 });
          for (let t = 0; t <= E.view[1]; t += 0.5) T.text(v.fmt(t, 2), t, -0.28, { align: 'center', size: 10.5, color: 'muted' });
          T.vband(y - h, y, { color: 'orange', alpha: 0.18 });
          drawE(T, (x) => x, 2.4);
          T.line(y, -0.2, y, 0.32, { color: 'green', width: 2.2 });
          T.tex('y=\\sup E', y, 0.42, { color: 'green', size: 14 });
          // zoom: window [y - 1.6h, y + 0.6h] mapped to [-1, 1]
          const z0 = y - 1.6 * h, z1 = y + 0.6 * h, map = (x) => -1 + (2 * (x - z0)) / (z1 - z0);
          Z.line(-1, 0, 1, 0, { color: 'faint', width: 1 });
          Z.vband(map(y - h), map(y), { color: 'orange', alpha: 0.18, edges: true });
          drawE(Z, map, 3.4);
          Z.line(map(y), -0.2, map(y), 0.32, { color: 'green', width: 2.2 });
          Z.tex('y', map(y), 0.42, { color: 'green', size: 15 });
          Z.tex('y-h', map(y - h), 0.42, { color: 'orange', size: 15 });
          const x = witness(E, h);
          if (x !== null) { Z.dot(map(x), 0, { r: 6.5, color: 'gold' }); Z.text(`x = ${v.fmt(x, 6)}`, map(x), -0.25, { align: 'center', size: 12, color: 'gold', weight: 600 }); T.dot(x, 0, { r: 5, color: 'gold' }); }
          Z.dot(map(y), 0, E.attained ? { r: 5.5, color: 'green' } : { r: 6, hollow: true, color: 'green', width: 2.2 });
          Z.corner(E.attained ? 'y ∈ E' : 'y ∉ E, but y ∈ Ē', 'tr', { color: 'green', weight: 600 });
          st = { E, h, x, y };
        });
        v.legend([['blue', '$E$', { dot: true }], ['green', '$y=\\sup E$'], ['orange', 'window $(y-h,\\,y]$', { area: true }], ['gold', 'a point of $E$ in the window', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s.E) return '';
          const ex = s.x === null ? '' : s.x === s.y ? `$x = y = ${v.fix(s.y, 4)}$ itself lies in $E$` : `$x = ${v.fix(s.x, 6)}\\in E$ with $y-h = ${v.fix(s.y - s.h, 6)} < x < y$`;
          return `$y=\\sup E = ${v.fix(s.y, 6)}$, $h=${v.fix(s.h, 4)}$: ${ex}. ` + (s.E.attained ? 'Here $E$ is closed (or finite), so $y\\in E$.' : 'Such $x$ exists for every $h>0$, so $y$ is a limit point of $E$ and $y\\in\\bar E$.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.29
    {
      num: '2.29',
      kind: 'Definition',
      name: 'Sets open relative to a subspace',
      statement: String.raw`Let $E\subset Y\subset X$, where $X$ is a metric space. $E$ is **open relative to $Y$** if to every $p\in E$ there is an $r>0$ such that every $q\in Y$ with $d(p,q)<r$ lies in $E$. (Being open in $X$ asks the same for all $q\in X$.) Thus a set can be open relative to $Y$ without being an open subset of $X$: the segment $(a,b)$ is open relative to $\R$ but not as a subset of $\R^2$.`,
      idea: String.raw`Relative openness only tests the points of $Y$ near $p$. Since $Y$ is itself a metric space (with the restricted distance), "open relative to $Y$" is just "open in the metric space $Y$"; the neighbourhoods of $Y$ are the sets $N_r(p)\cap Y$. Theorem 2.30 identifies these sets as the traces $Y\cap G$ of open sets $G\subset X$.`,
      caption: String.raw`$X=\R^2$; the ambient subspace $Y$ is drawn as a thick grey curve and $E\subset Y$ in blue. Drag $p$ along $E$. The disc is the largest $N_r(p)$ whose trace on $Y$ stays in $E$ (green): $E$ is open relative to $Y$. But the disc itself leaves $E$ (red shading), so $E$ is not open in $X$.`,
      deps: ['pma-2.18'],
      tags: ['relative topology', 'open sets'],
      verify: true,
      viz(v) {
        const T0 = -0.7, T1 = 2.2; // arc parameters
        const YS = {
          line: { label: '$Y=\\R$, $E=(-1,\\frac32)$', proj: (x, y) => [v.M.clamp(x, -0.999, 1.499), 0], E: (x) => x > -1 && x < 1.5, rP: (x) => Math.min(x + 1, 1.5 - x) },
          half: { label: '$Y=[0,2]$, $E=[0,1)$', proj: (x, y) => [v.M.clamp(x, 0, 0.999), 0], E: (x) => x >= 0 && x < 1, rP: (x) => 1 - x },
          circ: { label: '$Y$ = circle, $E$ = open arc', proj: (x, y) => { let t = Math.atan2(y, x); t = v.M.clamp(t, T0 + 0.001, T1 - 0.001); return [Math.cos(t), Math.sin(t)]; }, rP: (x, y) => Math.min(Math.hypot(x - Math.cos(T0), y - Math.sin(T0)), Math.hypot(x - Math.cos(T1), y - Math.sin(T1))) },
        };
        const which = v.select('', Object.entries(YS).map(([value, o]) => ({ value, label: o.label })), 'line');
        const S = v.stage({ x: [-2.3, 2.6], y: [-1.35, 1.35], equal: true, height: 340, axes: false });
        const P = S.handle(0.2, 0, { color: 'ink', label: 'p', constrain: (x, y) => YS[which.value].proj(x, y) });
        let last = 'line', st = {};
        const Rd = v.rgb('red');
        v.render(() => {
          const w = which.value, Y = YS[w];
          if (last !== w) { last = w; const q = Y.proj(w === 'circ' ? 0.98 : 0.4, w === 'circ' ? -0.2 : 0); P.x = q[0]; P.y = q[1]; }
          const r = Y.rP(P.x, P.y);
          // the disc, with its part outside E shaded red (all of it except the trace on Y)
          S.circle(P.x, P.y, r, { fill: 'red', fillAlpha: 0.12, color: 'orange', width: 2, dash: [5, 4] });
          // Y and E
          if (w === 'circ') {
            S.curve((t) => [Math.cos(t), Math.sin(t)], 0, 2 * Math.PI, { color: 'faint', width: 7 });
            S.curve((t) => [Math.cos(t), Math.sin(t)], T0, T1, { color: 'blue', width: 4 });
            S.dot(Math.cos(T0), Math.sin(T0), { hollow: true, color: 'blue', r: 5 }); S.dot(Math.cos(T1), Math.sin(T1), { hollow: true, color: 'blue', r: 5 });
            // trace of the disc on Y
            const dt = 2 * Math.asin(Math.min(1, r / 2)), t = Math.atan2(P.y, P.x);
            S.curve((u) => [Math.cos(u), Math.sin(u)], t - dt, t + dt, { color: 'green', width: 5 });
            S.tex('Y', -0.85, -0.75, { color: 'muted', size: 18 });
          } else {
            const [a, b] = w === 'line' ? [-2.3, 2.6] : [0, 2];
            S.line(a, 0, b, 0, { color: 'faint', width: 7 });
            if (w === 'half') { S.dot(0, 0, { color: 'faint', r: 5 }); S.dot(2, 0, { color: 'faint', r: 5 }); }
            const [ea, eb] = w === 'line' ? [-1, 1.5] : [0, 1];
            S.line(ea, 0, eb, 0, { color: 'blue', width: 4 });
            if (w === 'line') S.dot(ea, 0, { hollow: true, color: 'blue', r: 5 }); else S.dot(ea, 0, { color: 'blue', r: 5 });
            S.dot(eb, 0, { hollow: true, color: 'blue', r: 5 });
            S.line(Math.max(a, P.x - r), 0, Math.min(b, P.x + r), 0, { color: 'green', width: 5 });
            S.tex('Y', b - 0.12, -0.25, { color: 'muted', size: 18 });
          }
          S.tex('X=\\R^2', 2.15, 1.1, { color: 'muted', size: 15 });
          S.measure(P.x, P.y, P.x + r * 0.7071, P.y + r * 0.7071, 'r', { color: 'orange', offset: 10 });
          S.corner('open relative to Y ✓    open in X ✗', 'bl', { color: 'ink', weight: 700 });
          st = { r, w };
        });
        v.legend([['faint', 'the subspace $Y$'], ['blue', '$E\\subset Y$'], ['green', '$N_r(p)\\cap Y\\subset E$'], ['red', '$N_r(p)\\setminus E$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.r == null) return '';
          return `$r = ${v.fix(s.r, 3)}$: every $q\\in Y$ with $d(p,q)<r$ lies in $E$, so $p$ is interior to $E$ relative to $Y$. No $r>0$ works in $X$: $N_r(p)$ always contains points off $Y$, which are not in $E$.` + (s.w === 'half' ? ' At $p=0$ the left half of the disc misses $Y$ altogether, so $[0,1)$ is open in $Y=[0,2]$ although it is not open in $\\R$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.30
    {
      num: '2.30',
      kind: 'Theorem',
      name: 'Relatively open sets are traces of open sets',
      statement: String.raw`Suppose $Y\subset X$. A subset $E$ of $Y$ is open relative to $Y$ if and only if $E=Y\cap G$ for some open subset $G$ of $X$.`,
      idea: String.raw`If $E$ is open relative to $Y$, each $p\in E$ has a radius $r_p$ with $N_{r_p}(p)\cap Y\subset E$. Let $G$ be the union of the balls $V_p=N_{r_p}(p)$: it is open in $X$ (2.19, 2.24), it contains $E$, and $G\cap Y\subset E$ by the choice of $r_p$; so $E=G\cap Y$. Conversely, if $G$ is open in $X$ and $p\in E=G\cap Y$, some $V_p=N_r(p)\subset G$, and then $V_p\cap Y\subset E$.`,
      caption: String.raw`$\Rightarrow$: the animation adds the balls $V_p=N_{r_p}(p)$ for more and more $p\in E$ — their union is the open set $G$ (shaded) and $Y\cap G$ is exactly $E$. $\Leftarrow$: drag the open disc $G$ and its radius; its trace on $Y$ is $E$ (blue), and for each $p\in E$ (drag it) the ball $V_p\subset G$ from 2.19 has $V_p\cap Y\subset E$.`,
      deps: ['pma-2.29', 'pma-2.19', 'pma-2.24'],
      see: ['pma-2.33'],
      tags: ['relative topology', 'open sets'],
      viz(v) {
        const mode = v.select('', [{ value: 'fw', label: '$\\Rightarrow$ build $G$ from $E$' }, { value: 'bw', label: '$\\Leftarrow$ cut $Y$ by an open $G$' }], 'fw', { onChange: () => v.restart() });
        const ys = v.select('$Y$', [{ value: 'circ', label: 'circle' }, { value: 'line', label: 'line' }], 'circ', { onChange: () => v.restart() });
        const gR = v.slider('radius of $G$', 0.2, 1.4, 0.75, { step: 0.01 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.4, 1.4], equal: true, height: 360, axes: false });
        const ARC = [[-0.5, 1.9]], SEGS = [[-1.9, -0.6], [0.2, 1.6]];
        const Gc = S.handle(0.9, 0.55, { color: 'purple', label: 'G' });
        const P = S.handle(0.7, 0.71, {
          color: 'ink', label: 'p',
          constrain: (x, y) => { if (ys.value === 'circ') { const t = Math.atan2(y, x); return [Math.cos(t), Math.sin(t)]; } return [x, 0]; },
        });
        // parametrisation of Y and of the excluded part
        const yPt = (t) => (ys.value === 'circ' ? [Math.cos(t), Math.sin(t)] : [t, 0]);
        const tRange = () => (ys.value === 'circ' ? [-Math.PI, Math.PI] : [-2.4, 2.4]);
        const inEfw = (t) => (ys.value === 'circ' ? ARC : SEGS).some(([a, b]) => t > a && t < b);
        const Ys = () => { const [a, b] = tRange(); return Array.from({ length: 801 }, (_, i) => a + ((b - a) * i) / 800); };
        // r_p = distance from p to the part of Y outside E (forward mode)
        const rP = (t) => {
          const p = yPt(t); let best = Infinity;
          for (const [a, b] of ys.value === 'circ' ? ARC : SEGS) if (t > a && t < b) for (const e of [a, b]) { const q = yPt(e); best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1])); }
          return best;
        };
        // centres of the balls V_p, denser near the ends of each piece of E
        const centres = () => { const out = []; for (const [a, b] of ys.value === 'circ' ? ARC : SEGS) for (let i = 1; i < 120; i++) { const s = (1 - Math.cos((Math.PI * i) / 120)) / 2; out.push(a + (b - a) * s); } return out; };
        let st = {};
        v.animate((time) => {
          const fw = mode.value === 'fw', circ = ys.value === 'circ';
          Gc.visible = !fw; P.visible = !fw;
          const ts = Ys(), pts = ts.map(yPt);
          if (fw) {
            const cs = centres();
            const order = cs.map((t, i) => [t, i]).sort((u, w) => ((u[1] * 37) % cs.length) - ((w[1] * 37) % cs.length));
            const k = Math.min(cs.length, Math.floor(Math.pow(Math.min(1, time / 7), 1.6) * cs.length) + 1);
            const balls = order.slice(0, k).map(([t]) => { const p = yPt(t); return [p[0], p[1], rP(t)]; });
            S.rings(balls.map(([x, y, r]) => ring(x, y, r)), { fill: 'purple', fillAlpha: 0.16, stroke: false });
            const lastB = balls[balls.length - 1];
            S.circle(lastB[0], lastB[1], lastB[2], { color: 'purple', width: 1.6 });
            S.dot(lastB[0], lastB[1], { r: 3.5, color: 'purple' });
            S.path(pts, { color: 'faint', width: 7 });
            const inG = pts.map(([x, y]) => balls.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 < br * br));
            runs(S, pts, ts.map(inEfw), { color: 'blue', width: 3.4 }, { stroke: false });
            runs(S, pts.map(([x, y]) => (circ ? [x * 1.075, y * 1.075] : [x, y - 0.12])), inG, { color: 'green', width: 3 }, { stroke: false });
            for (const [a, b] of circ ? ARC : SEGS) for (const e of [a, b]) { const q = yPt(e); S.dot(q[0], q[1], { hollow: true, color: 'blue', r: 4.5 }); }
            const mism = ts.filter((t, i) => inG[i] !== inEfw(t)).length;
            S.corner(`${k} of the balls V_p drawn`, 'tl', { color: 'purple', weight: 600 });
            st = { fw, k, n: cs.length, mism };
          } else {
            const R = gR.value, cx = Gc.x, cy = Gc.y;
            S.circle(cx, cy, R, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 1.8, dash: [6, 4] });
            S.path(pts, { color: 'faint', width: 7 });
            const inE = pts.map(([x, y]) => Math.hypot(x - cx, y - cy) < R);
            runs(S, pts, inE, { color: 'blue', width: 3.6 }, { stroke: false });
            const pIn = Math.hypot(P.x - cx, P.y - cy) < R;
            if (pIn) {
              const rho = R - Math.hypot(P.x - cx, P.y - cy);
              S.circle(P.x, P.y, rho, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.8 });
              const tr = pts.map(([x, y]) => Math.hypot(x - P.x, y - P.y) < rho);
              runs(S, pts, tr, { color: 'green', width: 5 }, { stroke: false });
            }
            S.corner(pIn ? 'V_p ⊂ G, so V_p ∩ Y ⊂ G ∩ Y = E' : 'drag p onto E = Y ∩ G', 'tl', { color: pIn ? 'green' : 'muted', weight: 600 });
            st = { fw, pIn };
          }
          S.tex('Y', circ ? -0.92 : 2.2, circ ? -0.62 : -0.25, { color: 'muted', size: 18 });
        }, { period: 9 });
        v.legend([['faint', 'the subspace $Y$'], ['blue', '$E$'], ['purple', 'open $G\\subset X$', { area: true }], ['green', 'trace on $Y$'], ['orange', '$V_p$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.fw == null) return '';
          if (s.fw) return `$G$ = union of ${s.k} balls $V_p$ (of the ${s.n} sampled). The green trace $Y\\cap G$ ${s.mism === 0 ? 'coincides with $E$ at all 801 sample points of $Y$' : `differs from $E$ at ${s.mism} of 801 sample points so far`}; each $V_p$ meets $Y$ only inside $E$, so the trace can never exceed $E$.`;
          return s.pIn ? 'The radius $R-|p-c|$ of 2.19 gives $V_p\\subset G$; its trace on $Y$ (green) lies in $E$, so $E=Y\\cap G$ is open relative to $Y$.' : 'Move $p$ into the blue arc $E=Y\\cap G$.';
        });
      },
    },
  ],
};
