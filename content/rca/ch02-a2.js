// Rudin, Real and Complex Analysis — Chapter 2, part 2: semicontinuity, C_c(X), Urysohn's lemma,
// partitions of unity (2.8–2.13).

function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** TeX number with ×10^k for tiny values */
function tnum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const k = Math.floor(Math.log10(a)), m = x / Math.pow(10, k);
  return `${Number(m.toPrecision(d))}\\times 10^{${k}}`;
}
/**
 * Piecewise-constant function on R given by breakpoints and values:
 * pieces = [[b_0, val at b_0], (val on (b_0,b_1)), [b_1, val], ...]; returns {f, bps, vals, at}.
 */
function pwc(bps, open, at) { // open[i] = value on (bps[i-1], bps[i]) (open[0] on (-inf,b0)), at[i] = f(bps[i])
  const f = (x) => { for (let i = 0; i < bps.length; i++) { if (x < bps[i]) return open[i]; if (x === bps[i]) return at[i]; } return open[bps.length]; };
  return { f, bps, open, at };
}
/** the set {x : pred(f(x))} for a piecewise-constant f, as intervals [a, b, inclA, inclB] (±Infinity allowed) */
function levelSet(P, pred) {
  const pts = [-Infinity, ...P.bps, Infinity];
  const out = [];
  let cur = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const inA = i > 0 ? pred(P.at[i - 1]) : false, inOpen = pred(P.open[i]);
    // point a
    if (i > 0) {
      if (inA) { if (!cur) cur = [a, null, true, false]; }
      else if (cur) { cur[1] = a; cur[3] = false; out.push(cur); cur = null; }
    }
    if (inOpen) { if (!cur) cur = [a, null, false, false]; }
    else if (cur) { cur[1] = a; cur[3] = i > 0 ? inA : false; out.push(cur); cur = null; }
    void b;
  }
  if (cur) { cur[1] = Infinity; out.push(cur); }
  return out;
}

export default {
  collection: 'rca',
  chapter: 2,
  items: [
    // ------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Lower and upper semicontinuous functions',
      statement: String.raw`Let $X$ be a topological space and $f:X\to[-\infty,\infty]$. Then $f$ is *lower semicontinuous* if $\{x: f(x)>\alpha\}$ is open for every real $\alpha$, and *upper semicontinuous* if $\{x:f(x)<\alpha\}$ is open for every real $\alpha$. A real function is continuous exactly when it is both. Two facts follow at once:
(a) the characteristic function of an open set is lower semicontinuous, and that of a closed set is upper semicontinuous;
(b) the supremum of any family of lower semicontinuous functions is lower semicontinuous, and the infimum of any family of upper semicontinuous functions is upper semicontinuous.`,
      idea: String.raw`For (a), $\{\chi_V>\alpha\}$ is $\emptyset$, $V$ or $X$. For (b), $\{\sup_i f_i>\alpha\}=\bigcup_i\{f_i>\alpha\}$ is a union of open sets. Lower semicontinuity means $f$ can only *jump up* away from a point: at a jump, $f$ takes the lower value.`,
      caption: String.raw`Drag the level $\alpha$ (gold handle) and pick the test. The set $\{f>\alpha\}$ or $\{f<\alpha\}$ is drawn on the axis: green where it is open, with a red dot at every endpoint it contains. For $\chi_U$ the faint tents are continuous functions increasing to $\chi_U$, which illustrates (b).`,
      deps: ['rca-1.2'],
      see: ['rca-2.25'],
      tags: ['semicontinuity', 'topology'],
      viz(v) {
        const FN = {
          open: { label: String.raw`$\chi_U$, $U$ open`, P: pwc([0.2, 0.42, 0.58, 0.82], [0, 1, 0, 1, 0], [0, 0, 0, 0]), name: String.raw`\chi_U` },
          closed: { label: String.raw`$\chi_F$, $F$ closed`, P: pwc([0.2, 0.42, 0.58, 0.82], [0, 1, 0, 1, 0], [1, 1, 1, 1]), name: String.raw`\chi_F` },
          ceil: { label: String.raw`$\lceil 4x\rceil/4$`, P: pwc([0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1, 1], [0, 0.25, 0.5, 0.75, 1]), name: String.raw`\lceil 4x\rceil/4` },
          mixed: { label: String.raw`$\chi_{[0.3,0.7)}$`, P: pwc([0.3, 0.7], [0, 1, 0], [1, 0]), name: String.raw`\chi_{[0.3,\,0.7)}` },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'open');
        const test = v.select('test', [{ value: 'gt', label: String.raw`$\{f>\alpha\}$ open? (lsc)` }, { value: 'lt', label: String.raw`$\{f<\alpha\}$ open? (usc)` }], 'gt');
        const S = v.stage({ x: [-0.08, 1.12], y: [-0.42, 1.28], height: 360, xlabel: 'x', full: true, yticks: [0, 0.5, 1] });
        const al = S.handle(1.07, 0.5, { color: 'gold', label: 'α', constrain: (x, y) => [1.07, Math.max(-0.1, Math.min(1.2, y))] });
        let st = {};
        v.render(() => {
          const F = FN[which.value], P = F.P, a = al.y;
          const pred = test.value === 'gt' ? (y) => y > a : (y) => y < a;
          // tents increasing to χ_U
          if (which.value === 'open') for (const n of [6, 12, 25, 60]) S.fn((x) => { const d = Math.min(Math.max(0, Math.min(x - 0.2, 0.42 - x)), 1) + Math.min(Math.max(0, Math.min(x - 0.58, 0.82 - x)), 1); return Math.min(1, n * d); }, { domain: [0.15, 0.87], color: 'teal', width: 1, alpha: 0.45 });
          // graph: open pieces then endpoint dots
          const pts = [-0.08, ...P.bps, 1.12];
          for (let i = 0; i < pts.length - 1; i++) S.line(pts[i], P.open[i], pts[i + 1], P.open[i], { color: 'ink', width: 2.6 });
          P.bps.forEach((b, i) => {
            const vals = new Set([P.open[i], P.open[i + 1]]);
            for (const y of vals) if (y !== P.at[i]) S.dot(b, y, { color: 'ink', r: 4, hollow: true });
            S.dot(b, P.at[i], { color: 'ink', r: 4.2 });
          });
          // level line
          S.hline(a, { color: 'gold', width: 1.4, dash: [5, 4] });
          // the level set on the axis
          const L = levelSet(P, pred);
          const yA = -0.22;
          S.line(-0.08, yA, 1.12, yA, { color: 'faint', width: 1 });
          let open = true;
          for (const [s, e, ia, ib] of L) {
            const x0 = Math.max(s, -0.08), x1 = Math.min(e, 1.12);
            S.line(x0, yA, x1, yA, { color: 'green', width: 7, alpha: 0.8, cap: 'butt' });
            if (isFinite(s)) { S.dot(s, yA, ia ? { color: 'red', r: 5.5 } : { color: 'green', r: 5, hollow: true, width: 2 }); if (ia) open = false; }
            if (isFinite(e)) { S.dot(e, yA, ib ? { color: 'red', r: 5.5 } : { color: 'green', r: 5, hollow: true, width: 2 }); if (ib) open = false; }
          }
          S.tex(test.value === 'gt' ? String.raw`\{f>\alpha\}` : String.raw`\{f<\alpha\}`, -0.075, yA, { align: 'left', dy: -14, color: 'green', size: 13 });
          S.tex(F.name, 0.03, 1.17, { align: 'left', color: 'ink', size: 15 });
          S.corner(open ? 'this level set is open' : 'not open: it contains an endpoint', 'tr', { color: open ? 'green' : 'red', weight: 600 });
          // verdict over all α
          const valsAll = [...new Set([...P.open, ...P.at])].sort((x, y) => x - y);
          let lsc = true, usc = true;
          const probes = [];
          for (let i = 0; i < valsAll.length; i++) { probes.push(valsAll[i] - 1e-3, valsAll[i] + 1e-3); }
          for (const q of probes) {
            for (const [s, e, ia, ib] of levelSet(P, (y) => y > q)) if ((isFinite(s) && ia) || (isFinite(e) && ib)) lsc = false;
            for (const [s, e, ia, ib] of levelSet(P, (y) => y < q)) if ((isFinite(s) && ia) || (isFinite(e) && ib)) usc = false;
          }
          st = { open, lsc, usc, a };
        });
        v.legend([['ink', '$f$ (filled dot = value at a jump)'], ['green', 'the level set'], ['red', 'endpoint inside the set', { dot: true }], ['teal', 'continuous tents $\\uparrow\\chi_U$']]);
        v.readout(() => `$\\alpha=${v.fix(st.a, 2)}$. Over all $\\alpha$: ${FN[which.value].label} is ${st.lsc ? '' : 'not '}lower semicontinuous and ${st.usc ? '' : 'not '}upper semicontinuous.`);
      },
    },
    // ------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Support of a function; the space C_c(X)',
      statement: String.raw`The *support* of a complex function $f$ on a topological space $X$ is the closure of $\{x:f(x)\ne0\}$. The collection of all continuous complex functions on $X$ whose support is compact is denoted $C_c(X)$. It is a vector space: $\supp(f+g)\subset\supp f\cup\supp g$, a finite union of compact sets is compact, and $\supp(\alpha f)\subset\supp f$.`,
      idea: String.raw`The support is the smallest closed set outside which $f$ vanishes. Zeros of $f$ inside the region where it lives do not shrink the support, because the closure fills them back in. On $\R$, a continuous $f$ lies in $C_c(\R)$ exactly when it vanishes outside some bounded interval.`,
      caption: String.raw`The orange set is $\{f\ne0\}$ (open, with hollow ends and holes at the zeros of $f$). The green bracket is its closure, $\supp f$. Increase $k$ to add zeros: they punch holes in $\{f\ne0\}$ but not in the support. The Gaussian is never $0$, so its support is all of $\R$ and it is not in $C_c(\R)$.`,
      deps: ['rca-2.3'],
      tags: ['support', 'continuous functions'],
      viz(v) {
        const M = v.M;
        const which = v.select('$f$', [{ value: 'bump', label: String.raw`$\phi(x)\cos(kx)$, $\phi$ a bump` }, { value: 'tent', label: 'two tents' }, { value: 'gauss', label: String.raw`$e^{-x^2}$` }], 'bump');
        const k = v.slider('$k$ (oscillation)', 0, 14, 6, { step: 0.1 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.62, 1.2], height: 350, xlabel: 'x', full: true, yticks: [-1, -0.5, 0.5, 1] });
        let st = {};
        // each function: f, and the intervals where its non-oscillating envelope is nonzero
        const F = {
          bump: { f: (x) => (Math.abs(x) < 1.6 ? Math.exp(1 - 1 / (1 - (x / 1.6) ** 2)) : 0) * Math.cos(k.value * x), env: [[-1.6, 1.6]] },
          tent: { f: (x) => Math.max(0, 0.9 - 1.8 * Math.abs(x + 1.1)) + Math.max(0, 0.7 - 1.4 * Math.abs(x - 0.9)) * Math.cos(k.value * (x - 0.9)), env: [[-1.6, -0.6], [0.4, 1.4]] },
          gauss: { f: (x) => Math.exp(-x * x), env: [[-Infinity, Infinity]] },
        };
        v.render(() => {
          const { f, env } = F[which.value];
          // {f != 0}: the envelope intervals, cut at the sign changes of f (zeros found by bisection)
          const runs = [];
          for (const [ea, eb] of env) {
            const a = Math.max(ea, -2.6), b = Math.min(eb, 2.6);
            const xs = M.linspace(a, b, 2001).slice(1, -1);
            let s = ea < -2.6 ? -2.6 : a;
            for (let i = 1; i < xs.length; i++) {
              const y0 = f(xs[i - 1]), y1 = f(xs[i]);
              if (y0 === 0 || y0 * y1 < 0) { const z = y0 === 0 ? xs[i - 1] : M.bisect((x) => f(x) * Math.sign(y0), xs[i - 1], xs[i]); runs.push([s, z]); s = z; }
            }
            runs.push([s, eb > 2.6 ? 2.6 : b]);
          }
          S.fn(f, { color: 'accent', width: 2.6, n: 1200 });
          const yN = -1.2, yS = -1.45;
          for (const [a, b] of runs) {
            S.line(a, yN, b, yN, { color: 'orange', width: 6, alpha: 0.75, cap: 'butt' });
            if (a > -2.59) S.dot(a, yN, { color: 'orange', r: 3.6, hollow: true });
            if (b < 2.59) S.dot(b, yN, { color: 'orange', r: 3.6, hollow: true });
          }
          const lo = runs[0][0], hi = runs[runs.length - 1][1];
          const unbounded = lo <= -2.59 || hi >= 2.59;
          if (runs.length) {
            S.line(lo, yS, hi, yS, { color: unbounded ? 'red' : 'green', width: 3 });
            if (!unbounded) for (const x of [lo, hi]) S.line(x, yS - 0.07, x, yS + 0.07, { color: 'green', width: 3 });
            else { S.arrow(hi - 0.3, yS, 2.6, yS, { color: 'red', head: 9 }); S.arrow(lo + 0.3, yS, -2.6, yS, { color: 'red', head: 9 }); }
            if (!unbounded) S.vband(lo, hi, { color: 'green', alpha: 0.06 });
          }
          S.tex(String.raw`\{f\neq 0\}`, -2.55, yN, { align: 'left', color: 'orange', size: 13, dy: -13 });
          S.tex(String.raw`\operatorname{supp} f`, -2.55, yS, { align: 'left', color: unbounded ? 'red' : 'green', size: 13, dy: 13 });
          // how many holes inside the support (zeros strictly inside)
          st = { holes: runs.length - env.length, lo, hi, unbounded, pieces: env.length };
          S.texPx(unbounded ? String.raw`\operatorname{supp} f=\R\ \text{not compact:}\ f\notin C_c(\R)` : String.raw`\operatorname{supp} f\ \text{compact:}\ f\in C_c(\R)`, S.width - 12, 18, { align: 'right', color: unbounded ? 'red' : 'green', size: 14 });
        });
        v.legend([['accent', '$f$'], ['orange', '$\\{x: f(x)\\ne 0\\}$ (open)'], ['green', '$\\operatorname{supp} f$ = its closure']]);
        v.readout(() => st.unbounded ? `$f$ never vanishes identically on a tail, so $\\{f\\ne0\\}$ is unbounded and $\\operatorname{supp} f=\\R$. Such $f$ may vanish at infinity, but it is not in $C_c(\\R)$.`
          : `$\\{f\\ne0\\}$ has ${st.holes} hole${st.holes === 1 ? '' : 's'} at zeros of $f$, yet $\\operatorname{supp} f$ is ${st.pieces === 1 ? `$[${v.fix(st.lo, 2)},${v.fix(st.hi, 2)}]$` : 'the union of the two closed intervals'}: the closure fills in isolated zeros.`);
      },
    },
    // ------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Continuous images of compact sets are compact',
      statement: String.raw`Let $X$ and $Y$ be topological spaces and $f:X\to Y$ continuous. If $K\subset X$ is compact, then $f(K)$ is compact.`,
      idea: String.raw`Pull an open cover $\{V_\alpha\}$ of $f(K)$ back to $X$. The sets $f^{-1}(V_\alpha)$ are open by continuity and cover $K$, so finitely many do. Their images cover $f(K)$.`,
      caption: String.raw`Right: the image of $K$ under a continuous $f$, covered by open discs of radius $\rho$. Left: each disc pulls back to an open subset of the domain (one row per disc). Finitely many rows cover the domain, so finitely many discs cover the image. In the second mode the domain is $(0,1]$ and the image spirals into a point it never reaches. Every row then stops short of $0$, and no finite subfamily covers.`,
      deps: ['rca-2.3', 'rca-1.2'],
      see: ['pma-4.14'],
      tags: ['compactness', 'continuity'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'cpt', label: '$K=[0,1]$' }, { value: 'bad', label: '$K=(0,1]$, spiral' }], 'cpt');
        const rho = v.slider('disc radius $\\rho$', 0.25, 0.7, 0.42, { step: 0.01 });
        const L = v.stage({ x: [-0.06, 1.06], y: [-1, 16.5], height: 380, axes: false, title: 'domain: the pulled-back open sets $f^{-1}(V_i)$', minWidth: 300 });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 380, axes: false, title: 'image $f(K)$ and the discs $V_i$', minWidth: 300 });
        const fc = (t) => [1.15 * Math.sin(2 * Math.PI * t * 1.5 + 0.3) * (0.75 + 0.25 * Math.cos(2 * Math.PI * t)), 1.05 * Math.sin(2 * Math.PI * t * 2 + 1.1)];
        const fs = (t) => { const r = 1.5 * t, th = 2.6 * Math.log(t); return [r * Math.cos(th), r * Math.sin(th)]; };
        const COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        let st = {};
        v.render(() => {
          const bad = mode.value === 'bad';
          const f = bad ? fs : fc;
          const r = rho.value, N = 1500;
          const ts = M.linspace(bad ? 1e-4 : 0, 1, N + 1);
          const P = ts.map(f);
          // greedy cover along the parameter: centre at f(t_i), next t where |f(t)-f(t_i)| >= 0.9 r
          const centres = [];
          if (!bad) {
            let i = 0;
            while (i <= N) { const c = P[i]; centres.push({ c, rr: r }); let j = i; while (j <= N && Math.hypot(P[j][0] - c[0], P[j][1] - c[1]) < 0.9 * r) j++; if (j > N) break; i = j; }
          } else {
            // admissible discs avoid the limit point 0: radius min(rho, |f(t)|/2)
            let i = N;
            while (i >= 0 && centres.length < 16) { const c = P[i], rr = Math.min(r, Math.hypot(...c) / 2); centres.push({ c, rr }); let j = i; while (j >= 0 && Math.hypot(P[j][0] - c[0], P[j][1] - c[1]) < 0.9 * rr) j--; i = j; }
          }
          // right panel
          R.path(P, { color: 'ink', width: 2.2 });
          if (bad) R.dot(0, 0, { color: 'red', r: 5, hollow: true, width: 2 });
          centres.forEach(({ c, rr }, k) => { R.circle(c[0], c[1], rr, { fill: COLS[k % COLS.length], fillAlpha: 0.07, color: COLS[k % COLS.length], width: 1.1, alpha: 0.75 }); R.dot(c[0], c[1], { color: COLS[k % COLS.length], r: 2.4 }); });
          // left panel: preimages, one row per disc
          const rows = centres.length;
          L.setView(null, [-2.0, rows + 1.1]);
          const rowW = Math.max(2, Math.min(6, 0.55 * L.height / (rows + 1.4)));
          const covered = new Uint8Array(N + 1);
          for (let k = 0; k < rows; k++) {
            const { c, rr } = centres[k], y = rows - k - 0.5, col = COLS[k % COLS.length];
            let s = null;
            for (let i = 0; i <= N; i++) {
              const inside = Math.hypot(P[i][0] - c[0], P[i][1] - c[1]) < rr;
              if (inside) covered[i] = 1;
              if (inside && s == null) s = ts[i];
              if ((!inside || i === N) && s != null) { const e = inside ? ts[i] : ts[i - 1]; L.line(s, y, e, y, { color: col, width: rowW, alpha: 0.85, cap: 'butt' }); s = null; }
            }
          }
          L.line(0, -0.7, 1, -0.7, { color: 'ink', width: 2 });
          L.dot(0, -0.7, bad ? { color: 'red', r: 4, hollow: true } : { color: 'ink', r: 3.5 });
          L.dot(1, -0.7, { color: 'ink', r: 3.5 });
          L.text('0', 0, -0.7, { color: 'muted', size: 11, dy: 13, align: 'center' }); L.text('1', 1, -0.7, { color: 'muted', size: 11, dy: 13, align: 'center' });
          let gap = 0; for (let i = 0; i <= N; i++) if (!covered[i]) gap = Math.max(gap, ts[i]);
          st = { n: centres.length, bad, all: !covered.includes(0), tmin: centres.length ? Math.min(...centres.map(() => 1)) : 0, gap };
          if (bad) L.corner(`${centres.length} rows: (0, ${v.fmt(firstCovered(covered, ts), 2)}) still uncovered`, 'tr', { color: 'red', weight: 600 });
          else L.corner(`${centres.length} rows cover [0, 1]`, 'tr', { color: 'green', weight: 600 });
        });
        function firstCovered(cov, ts) { for (let i = 0; i < cov.length; i++) if (cov[i]) return ts[i]; return 1; }
        v.readout(() => st.bad ? `Each admissible disc must stay away from the missing limit point $0$, so its preimage stops short of $t=0$. However many are taken, an interval $(0,\\delta)$ of the domain stays uncovered: $f\\big((0,1]\\big)$ is not compact.`
          : `${st.n} discs cover $f([0,1])$, because their preimages — open by continuity — cover the compact interval $[0,1]$. Shrink $\\rho$: more discs are needed, but always finitely many.`);
      },
    },
    // ------------------------------------------------------------ 2.10a
    {
      num: '2.10a',
      kind: 'Corollary',
      name: 'The range of a function in C_c(X) is compact',
      statement: String.raw`For every $f\in C_c(X)$, the range $f(X)$ is a compact subset of $\C$.`,
      idea: String.raw`If $K=\supp f$, then $f(X)\subset f(K)\cup\{0\}$. Theorem 2.10 makes $f(K)$ compact, and adding the single point $0$ keeps it compact. (If $X\ne K$, then $0$ is attained anyway.)`,
      caption: String.raw`Drag $x$ along the line. Its value $f(x)$ moves in the complex plane, and the whole range is traced in ink. For $f\in C_c(\R)$ the range is a closed curve through $0$, the image of the compact support. For $e^{ix}/(1+|x|)$, which tends to $0$ but never has compact support, the range spirals into $0$ without reaching it: it is not closed, so not compact.`,
      deps: ['rca-2.10', 'rca-2.9'],
      see: ['pma-4.15'],
      tags: ['compactness', 'support'],
      viz(v) {
        const M = v.M, Cx = v.Cx;
        const which = v.select('$f$', [{ value: 'cc', label: String.raw`$\phi(x)\,e^{ikx}$ (in $C_c$)` }, { value: 'c0', label: String.raw`$e^{ix}/(1+|x|)$ (not in $C_c$)` }], 'cc');
        const k = v.slider('$k$', 1, 8, 3.2, { step: 0.1 });
        const L = v.stage({ x: [-6.3, 6.3], y: [-0.25, 1.15], height: 340, title: 'modulus $|f(x)|$ on the real line', xlabel: 'x', minWidth: 300 });
        const R = v.stage({ x: [-1.25, 1.25], y: [-1.15, 1.15], equal: true, height: 340, axes: false, title: 'range $f(\\R)\\subset\\C$', minWidth: 300 });
        const x0 = L.handle(1.0, 0, { color: 'gold', label: 'x', constrain: (x) => [x, 0] });
        const F = {
          cc: (x) => { const b = Math.abs(x) < 3 ? Math.exp(1 - 1 / (1 - (x / 3) ** 2)) : 0; return Cx.polar(b * (0.8 + 0.2 * Math.cos(2.3 * x)), k.value * x); },
          c0: (x) => Cx.polar(1 / (1 + Math.abs(x)), k.value * x * 0.6),
        };
        let st = {};
        v.render(() => {
          const f = F[which.value], cc = which.value === 'cc';
          if (cc) L.vband(-3, 3, { color: 'green', alpha: 0.08, edges: true });
          L.fn((x) => f(x).abs(), { color: 'accent', width: 2.4 });
          const fx = f(x0.x);
          L.line(x0.x, 0, x0.x, fx.abs(), { color: 'gold', width: 1.4, dash: [3, 3] });
          L.dot(x0.x, fx.abs(), { color: 'gold', r: 4.5 });
          if (cc) L.tex(String.raw`\operatorname{supp} f=[-3,3]`, 0, 1.08, { color: 'green', size: 13 });
          // range
          R.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          R.line(-1.25, 0, 1.25, 0, { color: 'faint', width: 1 }); R.line(0, -1.15, 0, 1.15, { color: 'faint', width: 1 });
          const a = cc ? -3 : -60, b = cc ? 3 : 60;
          R.curve((x) => { const z = f(x); return [z.re, z.im]; }, a, b, { n: cc ? 1500 : 6000, color: 'ink', width: 1.6 });
          R.dot(0, 0, cc ? { color: 'green', r: 5.5 } : { color: 'red', r: 5.5, hollow: true, width: 2 });
          R.tex(cc ? '0\\in f(\\R)' : '0\\notin f(\\R)', 0, 0, { color: cc ? 'green' : 'red', dx: -8, dy: 16, align: 'right', size: 13 });
          R.dot(fx.re, fx.im, { color: 'gold', r: 5.5 });
          R.tex('f(x)', fx.re, fx.im, { color: 'gold', dx: 8, dy: -10, align: 'left', size: 13 });
          R.corner(cc ? 'compact: image of supp f' : 'not closed ⇒ not compact', 'tl', { color: cc ? 'green' : 'red', weight: 600 });
          st = { cc, fx };
        });
        v.legend([['accent', '$|f(x)|$'], ['ink', 'the range $f(\\R)$'], ['gold', 'the moving point', { dot: true }]]);
        v.readout(() => st.cc ? `$f(x)=${st.fx.toString(3).replace('i', '\\,i')}$. Outside $[-3,3]$ the value is $0$, so the range is $f([-3,3])$ — the continuous image of a compact interval.`
          : `$f(x)=${st.fx.toString(3).replace('i', '\\,i')}$. $|f(x)|=1/(1+|x|)\\to0$ but never equals $0$: the range accumulates at $0$ without containing it.`);
      },
    },
    // ------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'The notation K ≺ f and f ≺ V',
      statement: String.raw`Let $X$ be a topological space. The notation $K\prec f$ means that $K$ is compact, $f\in C_c(X)$, $0\le f\le 1$ on $X$, and $f=1$ on $K$. The notation $f\prec V$ means that $V$ is open, $f\in C_c(X)$, $0\le f\le1$, and $\supp f\subset V$. Finally $K\prec f\prec V$ means that both hold.`,
      idea: String.raw`These are the "Urysohn functions" that the Riesz representation theorem uses to probe a functional: $K\prec f$ makes $f$ an upper test for $\chi_K$, and $f\prec V$ makes it a lower test for $\chi_V$. Note the strength of $f\prec V$: the whole support, not just $\{f\ne0\}$, lies in $V$.`,
      deps: ['rca-2.9'],
      tags: ['Urysohn', 'notation'],
    },
    // ------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: "Urysohn's lemma",
      statement: String.raw`Let $X$ be a locally compact Hausdorff space, $V\subset X$ open and $K\subset V$ compact. Then there is an $f\in C_c(X)$ with
$$K\prec f\prec V.$$`,
      idea: String.raw`Using 2.7 repeatedly, build open sets $V_r$ with compact closures, one for each rational $r$ in $[0,1]$, decreasing in $r$: $K\subset V_1$, $\overline{V_0}\subset V$, and $\overline{V_s}\subset V_r$ whenever $r<s$. Put $f(x)=\sup\{r: x\in V_r\}$. Upper and lower semicontinuity of $f$ both come from the nesting, so $f$ is continuous. It equals $1$ on $K$ and has support in $\overline{V_0}$.`,
      caption: String.raw`In the plane take $V_r=\{x: d(x,K)<(1-r)\delta\}$ (dashed level curves). At dyadic depth $n$ the staircase $\max\{r\,\chi_{V_r}\}$ approximates the Urysohn function $f=\sup_r r\chi_{V_r}$, a tent equal to $1$ on $K$ and sloping to $0$ before reaching $\partial V$. The right panel is the slice along the gold line. Drag $K$, the slice, and $\delta$. If $\delta$ is too large, the support leaks out of $V$ (red).`,
      deps: ['rca-2.7', 'rca-2.11', 'rca-2.8'],
      see: ['rca-2.13', 'rca-2.14'],
      tags: ['Urysohn', 'continuous functions'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.5, 2.5], y: [-1.75, 1.75], equal: true, height: 360, axes: false, title: 'level sets $V_r$ and the staircase $\\max_r r\\chi_{V_r}$', minWidth: 330, weight: 1.25 });
        const R = v.stage({ x: [-2.5, 2.5], y: [-0.12, 1.2], height: 360, title: 'slice along the gold line', xlabel: 'x', minWidth: 260, axes: 'box', yticks: [0, 0.5, 1] });
        const n = v.slider('dyadic depth $n$', 1, 6, 2, { int: true });
        const del = v.slider('$\\delta$', 0.1, 1.2, 0.4, { step: 0.01 });
        const V = M.blob(0.05, -0.05, 1.55, 17, 0.26, 160);
        const k1 = L.handle(-0.55, 0.2, { color: 'accent', label: 'K' });
        const discs = () => [[k1.x, k1.y, 0.42], [k1.x + 0.75, k1.y - 0.45, 0.28]];
        const slice = L.handle(2.25, -0.05, { color: 'gold', constrain: (x, y) => [2.25, Math.max(-1.6, Math.min(1.6, y))] });
        const dK = (x, y) => { let d = Infinity; for (const [cx, cy, r] of discs()) d = Math.min(d, Math.hypot(x - cx, y - cy) - r); return Math.max(0, d); };
        let st = {};
        v.render(() => {
          const N = 1 << n.value, d = del.value;
          const stair = (x, y) => { const q = dK(x, y); if (q >= d) return 0; const fval = 1 - q / d; return Math.floor(fval * N + 1e-12) / N; };
          // dist(K, V^c)
          let dKV = Infinity; for (const p of V) dKV = Math.min(dKV, dK(p[0], p[1]));
          const KinV = discs().every(([cx, cy, r]) => M.range(36).every((i) => inPoly([cx + r * Math.cos(i / 36 * 2 * Math.PI), cy + r * Math.sin(i / 36 * 2 * Math.PI)], V)));
          const acc = v.rgb('accent'), red = v.rgb('red');
          L.raster((x, y) => {
            const s = stair(x, y); if (s <= 0) return null;
            const inV = inPoly([x, y], V);
            const c = inV ? acc : red; return [c[0], c[1], c[2], Math.round(40 + 175 * s)];
          }, { res: 2, key: `${k1.x.toFixed(3)},${k1.y.toFixed(3)},${n.value},${d}` });
          for (let j = 0; j < N; j++) { const r = j / N; const rad = (1 - r) * d; for (const [cx, cy, rr] of discs()) L.circle(cx, cy, rr + rad, { color: 'ink', width: 0.8, alpha: 0.35, dash: [3, 3] }); }
          L.poly(V, { color: 'orange', width: 2, dash: [7, 5] });
          for (const [cx, cy, r] of discs()) L.circle(cx, cy, r, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.0 });
          L.tex('V', 1.25, 1.2, { color: 'orange', size: 18 });
          L.line(-2.5, slice.y, 2.25, slice.y, { color: 'gold', width: 1.3, dash: [6, 4] });
          // right: slice
          const y0 = slice.y;
          let vin = []; let s0 = null;
          for (const x of M.linspace(-2.5, 2.5, 801)) { const inside = inPoly([x, y0], V); if (inside && s0 == null) s0 = x; if (!inside && s0 != null) { vin.push([s0, x]); s0 = null; } }
          if (s0 != null) vin.push([s0, 2.5]);
          for (const [a, b] of vin) { R.vband(a, b, { color: 'orange', alpha: 0.08 }); R.line(a, 1.12, b, 1.12, { color: 'orange', width: 4, cap: 'butt' }); }
          let kin = []; s0 = null;
          for (const x of M.linspace(-2.5, 2.5, 1601)) { const inside = dK(x, y0) === 0; if (inside && s0 == null) s0 = x; if (!inside && s0 != null) { kin.push([s0, x]); s0 = null; } }
          for (const [a, b] of kin) R.line(a, 1, b, 1, { color: 'accent', width: 6, alpha: 0.35, cap: 'butt' });
          R.fn((x) => stair(x, y0), { color: 'gold', width: 2, n: 1600 });
          R.fn((x) => { const q = dK(x, y0); return q >= d ? 0 : 1 - q / d; }, { color: 'green', width: 2.2 });
          if (vin.length) R.tex('V', vin[vin.length - 1][1], 1.12, { color: 'orange', dy: 12, dx: -10, size: 14 });
          st = { dKV, KinV, err: 1 / N, d };
          L.corner(!KinV ? 'K ⊄ V' : d < dKV ? 'supp f ⊂ V ✓' : 'δ ≥ dist(K, Vᶜ): support leaks out of V', 'bl', { color: KinV && d < dKV ? 'green' : 'red', weight: 600 });
        });
        v.legend([['accent', '$K$'], ['orange', '$V$', { dash: true }], ['green', 'Urysohn function $f$'], ['gold', 'staircase at depth $n$']]);
        v.readout(() => !st.KinV ? 'Move $K$ back inside $V$: Urysohn needs $K\\subset V$.' : `$\\operatorname{dist}(K,V^c)=${v.fix(st.dKV, 3)}$, $\\delta=${v.fix(st.d, 2)}$ — ${st.d < st.dKV ? 'so $K\\prec f\\prec V$' : 'too large: $\\operatorname{supp} f\\not\\subset V$'}. The staircase differs from $f$ by less than $2^{-n}=${tnum(st.err)}$.`);
      },
    },
    // ------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Partition of unity',
      statement: String.raw`Let $V_1,\dots,V_n$ be open subsets of a locally compact Hausdorff space $X$, and let $K$ be compact with $K\subset V_1\cup\dots\cup V_n$. Then there are functions $h_i\prec V_i$ ($i=1,\dots,n$) such that
$$h_1(x)+\dots+h_n(x)=1\qquad(x\in K).$$
Such $\{h_1,\dots,h_n\}$ is called a partition of unity on $K$ subordinate to the cover $\{V_i\}$.`,
      idea: String.raw`Shrink the cover: each $x\in K$ has a neighbourhood with compact closure inside some $V_i$ (2.7), and finitely many of these give compact $H_i\subset V_i$ with $K\subset\bigcup H_i$. Urysohn (2.12) gives $H_i\prec g_i\prec V_i$. Then set $h_1=g_1$, $h_2=(1-g_1)g_2$, …, $h_n=(1-g_1)\cdots(1-g_{n-1})g_n$. These telescope: $\sum h_i=1-\prod_i(1-g_i)$, and the product vanishes on $K$ because some $g_i=1$ at each point of $K$.`,
      caption: String.raw`Drag the endpoints of the open intervals $V_1,\dots,V_4$ and of $K$ (green, bottom row). The stacked colours are $h_1,\dots,h_4$, built by the telescoping recipe from Urysohn tents $g_i$, and each is supported inside its own $V_i$; the thin dark core of each bar is the compact set $H_i$ on which $g_i=1$. On $K$ the stack reaches exactly height $1$. Open a gap in the cover and the sum drops below $1$ there (red).`,
      deps: ['rca-2.12', 'rca-2.7', 'rca-2.11'],
      see: ['pma-10.8', 'fa-6.20'],
      tags: ['partition of unity', 'Urysohn'],
      viz(v) {
        const M = v.M;
        const COLS = ['accent', 'orange', 'purple', 'teal'];
        const S = v.stage({ x: [-0.04, 1.04], y: [-1.42, 1.22], height: 420, axes: false, full: true });
        const showG = v.toggle('show the Urysohn functions $g_i$', false);
        const rowY = (i) => -0.3 - 0.22 * i;
        const init = [[0.02, 0.36], [0.27, 0.62], [0.55, 0.86], [0.78, 1.0]];
        const H = [];
        init.forEach(([a, b], i) => { const y = rowY(i); H.push([S.handle(a, y, { color: COLS[i], r: 6, constrain: (x) => [x, y] }), S.handle(b, y, { color: COLS[i], r: 6, constrain: (x) => [x, y] })]); });
        const yK = rowY(4) - 0.05;
        const kA = S.handle(0.1, yK, { color: 'green', r: 6, constrain: (x) => [x, yK] });
        const kB = S.handle(0.93, yK, { color: 'green', r: 6, constrain: (x) => [x, yK] });
        let st = {};
        v.render(() => {
          const Vs = H.map(([a, b]) => [Math.min(a.x, b.x), Math.max(a.x, b.x)]);
          const K = [Math.min(kA.x, kB.x), Math.max(kA.x, kB.x)];
          // Lebesgue-number-style shrink: eta = half the min over K of the max depth inside some V_i
          const depth = (x) => Math.max(0, ...Vs.map(([a, b]) => Math.min(x - a, b - x)));
          let eta = Infinity; for (const x of M.linspace(K[0], K[1], 400)) eta = Math.min(eta, depth(x));
          const covered = eta > 1e-4; const e = covered ? eta / 2 : 0.02;
          // H_i = K ∩ [a+e, b-e]; g_i = 1 on H_i, linear to 0 within e/1.6 (support inside V_i)
          const Hs = Vs.map(([a, b]) => [Math.max(K[0], a + e), Math.min(K[1], b - e)]);
          // Urysohn tent H_i ≺ g_i ≺ V_i: 1 on H_i, linear down to 0 just inside the ends of V_i
          const g = Hs.map(([p, q], i) => { const [a, b] = Vs[i], s0 = a + 0.12 * (p - a), s1 = b - 0.12 * (b - q); return (x) => { if (q < p || x <= s0 || x >= s1) return 0; if (x < p) return (x - s0) / (p - s0); if (x > q) return (s1 - x) / (s1 - q); return 1; }; });
          const h = (x) => { const out = []; let prod = 1; for (let i = 0; i < g.length; i++) { const gi = g[i](x); out.push(prod * gi); prod *= 1 - gi; } return out; };
          // stacked plot
          const xs = M.linspace(-0.04, 1.04, 700);
          const hs = xs.map(h);
          S.vband(K[0], K[1], { color: 'green', alpha: 0.06 });
          S.hline(0, { color: 'faint', width: 1 });
          S.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          S.text('1', -0.03, 1, { color: 'muted', size: 11, align: 'center' });
          let base = xs.map(() => 0);
          for (let i = 0; i < 4; i++) {
            const top = base.map((b, j) => b + hs[j][i]);
            const poly = xs.map((x, j) => [x, top[j]]).concat(xs.map((x, j) => [x, base[j]]).reverse());
            S.poly(poly, { fill: COLS[i], fillAlpha: 0.45, stroke: false });
            base = top;
          }
          S.path(xs.map((x, j) => [x, base[j]]), { color: 'ink', width: 2 });
          if (showG.value) g.forEach((gi, i) => S.fn(gi, { color: COLS[i], width: 1.4, dash: [5, 4], n: 700 }));
          // deficit on K
          let maxDef = 0;
          xs.forEach((x, j) => { if (x >= K[0] && x <= K[1]) { const def = 1 - base[j]; maxDef = Math.max(maxDef, def); } });
          if (maxDef > 1e-9) S.between((x) => 1, (x) => { const s = h(x).reduce((a, b) => a + b, 0); return x >= K[0] && x <= K[1] ? Math.min(1, s) : 1; }, K[0], K[1], { fill: 'red', fillAlpha: 0.35, n: 500 });
          // rows: V_i intervals and K
          Vs.forEach(([a, b], i) => {
            const y = rowY(i);
            S.line(a, y, b, y, { color: COLS[i], width: 5, alpha: 0.6, cap: 'butt' });
            const [p, q] = Hs[i]; if (q > p) S.line(p, y, q, y, { color: COLS[i], width: 2, alpha: 1 });
            S.tex(`V_${i + 1}`, a, y, { color: COLS[i], align: 'right', dx: -12, size: 13 });
          });
          S.line(K[0], yK, K[1], yK, { color: 'green', width: 5, alpha: 0.7, cap: 'butt' });
          S.tex('K', K[0], yK, { color: 'green', align: 'right', dx: -12, size: 13 });
          st = { maxDef, covered, supp: true };
        });
        v.legend([...COLS.map((c, i) => [c, `$h_${i + 1}$`, { area: true }]), ['ink', '$\\sum h_i$'], ['red', 'deficit $1-\\sum h_i$ on $K$', { area: true }]]);
        v.readout(() => st.covered ? `$\\max_{x\\in K}\\,\\bigl|1-\\sum_i h_i(x)\\bigr| = ${tnum(st.maxDef)}$; each $h_i$ vanishes outside a compact subset of $V_i$, so $h_i\\prec V_i$.`
          : `The intervals no longer cover $K$: at uncovered points every $g_i=0$, so $\\sum h_i=1-\\prod(1-g_i)=0$ there — the hypothesis $K\\subset\\bigcup V_i$ is essential.`);
      },
    },
  ],
};
