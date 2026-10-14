// Rudin, Functional Analysis — Chapter 6 (part 4): compact and point supports; distributions as derivatives
//
// Numbering note: recalled, not checked against the book; uncertain items carry `verify: true`.

// ---------------------------------------------------------------- smooth building blocks
const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 8; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
  return P;
})();
function psiD(k, x) {
  const s = 1 - x * x; if (!(s > 0)) return 0;
  const c = PSI_P[k]; let p = 0; for (let i = c.length - 1; i >= 0; i--) p = p * x + c[i];
  return p * Math.exp(-1 / s - 2 * k * Math.log(s));
}
const E1 = Math.E;
const phiD = (k, x, c, r, A = 1) => A * E1 * psiD(k, (x - c) / r) / Math.pow(r, k);
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
const BIN = [[1]];
for (let n = 1; n <= 10; n++) { const r = [1]; for (let k = 1; k < n; k++) r.push(BIN[n - 1][k - 1] + BIN[n - 1][k]); r.push(1); BIN.push(r); }
const hExp = (t) => (t > 0 ? Math.exp(-1 / t) : 0);
const step = (t) => { const a = hExp(t), b = hExp(1 - t); return a / (a + b); };
/** Plateau: 1 on [a, b], 0 outside (a − d, b + d). */
const plateau = (x, a, b, d) => step((x - a + d) / d) * step((b + d - x) / d);
/** j-th derivative (j ≤ 4) of a smooth function by central differences with step h. */
function fd(f, j, x, h) {
  if (j === 0) return f(x);
  if (j === 1) return (f(x + h) - f(x - h)) / (2 * h);
  if (j === 2) return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  if (j === 3) return (f(x + 2 * h) - 2 * f(x + h) + 2 * f(x - h) - f(x - 2 * h)) / (2 * h * h * h);
  return (f(x + 2 * h) - 4 * f(x + h) + 6 * f(x) - 4 * f(x - h) + f(x - 2 * h)) / (h * h * h * h);
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
function deltaArrow(S, x, w, unit, color, label) {
  if (Math.abs(w) < 1e-9) return;
  S.arrow(x, 0, x, w * unit, { color, width: 2.6, head: 9 });
  if (label) S.tex(label, x, w * unit, { color, dy: w > 0 ? -12 : 12, size: 14 });
}
function dipole(S, x, w, unit, color, label) {
  const h = 0.08, L = w * unit;
  S.arrow(x - h, 0, x - h, L, { color, width: 2.2, head: 8 });
  S.arrow(x + h, 0, x + h, -L, { color, width: 2.2, head: 8 });
  if (label) S.tex(label, x - h, L, { color, align: 'right', dx: -6, dy: L > 0 ? 4 : -4, size: 14 });
}

export default {
  book: 'fa',
  chapter: 6,
  items: [
    {
      num: '6.24',
      kind: 'Theorem',
      name: 'Compactly supported distributions act on all of C^∞',
      statement: String.raw`If $\Lambda\in\mathscr D'(\Omega)$ and its support $S_\Lambda$ is compact, then $\Lambda$ has finite order, and $\Lambda$ extends uniquely to a continuous linear functional on $C^\infty(\Omega)$: choose $\psi\in\mathscr D(\Omega)$ with $\psi=1$ on an open set containing $S_\Lambda$ and put
$$\Lambda f=\Lambda(\psi f)\qquad(f\in C^\infty(\Omega)).$$
The value does not depend on the choice of $\psi$. Conversely, every continuous linear functional on $C^\infty(\Omega)$ restricts to a distribution with compact support.`,
      idea: String.raw`If $\psi,\psi'$ are two admissible cutoffs, $(\psi-\psi')f$ vanishes near $S_\Lambda$, so $\Lambda((\psi-\psi')f)=0$ by 6.23. With $K=\operatorname{supp}\psi$, the estimate of 6.8 on $\mathscr D_K$ gives $|\Lambda(\psi f)|\le C\|\psi f\|_N\le C'\max_{x\in K,\,|\alpha|\le N}|D^\alpha f(x)|$ for every $f$ — finite order, and continuity for the Fréchet topology of $C^\infty(\Omega)$. Uniqueness holds because $\mathscr D(\Omega)$ is dense in $C^\infty(\Omega)$.`,
      caption: String.raw`$\Lambda=0.7\,\delta'_{-1}+g\cdot1_{[0.4,1.4]}$ has compact support (red). The smooth $f$ (blue) has no compact support at all, yet $\Lambda f$ makes sense: multiply by a cutoff $\psi$ (orange) that is $1$ on the support enlarged by a margin, with a transition of adjustable width, and evaluate $\Lambda(\psi f)$. Bottom: $\Lambda(\psi f)$ against the margin for three transition widths — one flat line for every positive margin, so the extension is well defined; negative margins cut into the support and break it.`,
      deps: ['fa-6.23', 'fa-6.8', 'fa-1.46'],
      tags: ['distributions', 'compact support'],
      verify: true,
      viz(v) {
        const M = v.M;
        const fS = v.select('$f=$', [{ value: 'e', label: '$e^{x}\\cos 2x$' }, { value: 'p', label: '$x^3-2x$' }, { value: 'g', label: '$e^{x^2/2}$' }], 'e');
        const mS = v.slider('margin', -0.3, 0.8, 0.3, { step: 0.01 });
        const wS = v.slider('transition width', 0.15, 1.2, 0.5, { step: 0.01 });
        const top = v.stage({ x: [-3, 3], y: [-3, 4], height: 280, full: true, axes: true, title: '$\\Lambda$ (purple) with support $S_\\Lambda$ (red), the cutoff $\\psi$, $f$ and $\\psi f$' });
        const bot = v.stage({ x: [-0.3, 0.8], y: [-1, 1], height: 190, full: true, axes: 'box', xlabel: 'margin', title: '$\\Lambda(\\psi f)$ against the margin, for transition widths $0.2$, $0.5$, $1.0$' });
        const F = {
          e: [(x) => Math.exp(x) * Math.cos(2 * x), (x) => Math.exp(x) * (Math.cos(2 * x) - 2 * Math.sin(2 * x))],
          p: [(x) => x * x * x - 2 * x, (x) => 3 * x * x - 2],
          g: [(x) => Math.exp(x * x / 2), (x) => x * Math.exp(x * x / 2)],
        };
        const g = (x) => 1 + 0.4 * Math.cos(6 * x);
        const psiOf = (m, w) => (x) => 1 - (1 - plateau(x, -1 - m, -1 + m, w)) * (1 - plateau(x, 0.4 - m, 1.4 + m, w));
        const ext = (key, m, w) => {
          const [f, fp] = F[key], psi = psiOf(m, w);
          const h = 1e-5, psip = (psi(-1 + h) - psi(-1 - h)) / (2 * h);
          return -0.7 * (psip * f(-1) + psi(-1) * fp(-1)) + simpson((x) => g(x) * psi(x) * f(x), 0.4, 1.4, 400);
        };
        const cache = new Map();
        let st = {};
        v.legend([['purple', '$\\Lambda$'], ['orange', 'cutoff $\\psi$', { dash: true }], ['blue', '$f\\in C^\\infty$'], ['teal', '$\\psi f\\in\\mathscr D$', { area: true }]]);
        v.render(() => {
          const key = fS.value, m = mS.value, w = wS.value, [f] = F[key], psi = psiOf(m, w);
          top.fn((x) => g(x), { domain: [0.4, 1.4], color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.15 });
          dipole(top, -1, 0.7, 1.6, 'purple', "0.7\\,\\delta'_{-1}");
          top.line(0.4, 0, 1.4, 0, { color: 'red', width: 6, alpha: 0.85, cap: 'butt' });
          top.dot(-1, 0, { color: 'red', r: 5 });
          top.fn((x) => M.clamp(f(x), -3.5, 4.5), { color: 'blue', width: 2.2 });
          top.fn((x) => psi(x) * f(x), { color: 'teal', width: 1.4, fill: 'teal', fillAlpha: 0.18, n: 900 });
          top.fn((x) => 2 * psi(x), { color: 'orange', width: 1.6, dash: [6, 4], n: 900 });
          top.tex('2\\psi', 2.75, 2, { color: 'orange', dy: -10, size: 13 });
          // bottom
          const k = key;
          if (!cache.has(k)) cache.set(k, [0.2, 0.5, 1.0].map((ww) => M.linspace(-0.3, 0.8, 111).map((mm) => [mm, ext(key, mm, ww)])));
          const curves = cache.get(k), all = curves.flat().map((p) => p[1]);
          const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(0.1, (hi - lo) * 0.15);
          bot.setView(null, [lo - pad, hi + pad]);
          bot.vband(-0.3, 0, { color: 'red', alpha: 0.07 });
          bot.vline(0, { color: 'red', width: 1, dash: [4, 4] });
          curves.forEach((cv, i) => bot.path(cv, { color: ['green', 'teal', 'purple'][i], width: 2, alpha: 0.85, dash: i === 1 ? [6, 4] : i === 2 ? [2, 3] : false }));
          const val = ext(key, m, w);
          bot.dot(m, val, { color: m > 0 ? 'green' : 'red', r: 5.5 });
          const ref = ext(key, 0.4, 0.5);
          st = { val, ref, m, sup: Math.max(...M.linspace(-2.5, 2.5, 200).map((x) => Math.abs(f(x)))) };
        });
        v.readout(() => {
          const s = st;
          return `$\\Lambda(\\psi f) = ${v.fix(s.val, 5)}$` + (s.m > 0 ? ` — the same as for any other admissible cutoff ($${v.fix(s.ref, 5)}$): this is $\\Lambda f$.` : ` — differs from $\\Lambda f = ${v.fix(s.ref, 5)}$: with a negative margin $\\psi\\ne1$ near $S_\\Lambda$.`);
        });
      },
    },
    {
      num: '6.25',
      kind: 'Theorem',
      name: 'Distributions supported at a point',
      statement: String.raw`Suppose $\Lambda\in\mathscr D'(\Omega)$, $p\in\Omega$, $\{p\}$ is the support of $\Lambda$, and $\Lambda$ has order $N$. Then
$$\Lambda=\sum_{|\alpha|\le N}c_\alpha D^\alpha\delta_p$$
for some constants $c_\alpha$: $\Lambda$ is a finite combination of derivatives of the Dirac measure at $p$.`,
      idea: String.raw`It suffices to show $\Lambda\varphi=0$ whenever $D^\alpha\varphi(p)=0$ for all $|\alpha|\le N$, because then $\Lambda$ factors through the finitely many functionals $\varphi\mapsto D^\alpha\varphi(p)$ (3.9). For such $\varphi$, multiply by a cutoff $\psi_\varepsilon(x)=\psi((x-p)/\varepsilon)$ equal to $1$ near $p$: $\Lambda\varphi=\Lambda(\psi_\varepsilon\varphi)$, and Taylor's formula gives $\|\psi_\varepsilon\varphi\|_N=O(\varepsilon)$, since every derivative of order $j\le N$ of $\varphi$ is $O(\varepsilon^{N+1-j})$ on the support while $D^\beta\psi_\varepsilon=O(\varepsilon^{-|\beta|})$. The order-$N$ estimate of 6.8 then forces $\Lambda\varphi=0$.`,
      caption: String.raw`$\Lambda=\delta-0.8\,\delta'+0.5\,\delta''-0.3\,\delta'''$ truncated to order $N$; the test function $\varphi=x^m b(x)$ vanishes to order $m$ at $p=0$. Top: $\varphi$, the cutoff $\psi_\varepsilon$ and $\psi_\varepsilon\varphi$, zoomed to $[-2.5\varepsilon,2.5\varepsilon]$. Bottom: $\|\psi_\varepsilon\varphi\|_j$ against $\varepsilon$ (log–log) for $j=0,\dots,4$; the line $j=N$ is thick. It has slope $m-N$, so it tends to $0$ exactly when $m>N$ — and that is exactly when $\Lambda\varphi=0$.`,
      deps: ['fa-6.23', 'fa-6.24', 'fa-6.8', 'fa-3.9'],
      tags: ['distributions', 'support', 'Dirac measure'],
      verify: true,
      viz(v) {
        const M = v.M;
        const XT = [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']];
        const NS = v.slider('order $N$ of $\\Lambda$', 0, 3, 1, { int: true });
        const mS = v.slider('$\\varphi$ vanishes to order $m$', 0, 4, 2, { int: true });
        const eS = v.slider('$\\varepsilon$', -3, 0, -1, { step: 0.01, fmt: (x) => `ε = ${v.fmt(10 ** x, 3)}` });
        const top = v.stage({ x: [-1, 1], y: [-1, 1], height: 210, full: true, axes: true });
        const bot = v.stage({ x: [-3, 0], y: [-8, 8], height: 270, full: true, axes: 'box', xlabel: 'ε', xticks: XT, title: '$\\|\\psi_\\varepsilon\\varphi\\|_j=\\max_{i\\le j}\\sup|(\\psi_\\varepsilon\\varphi)^{(i)}|$ against $\\varepsilon$ (log–log)' });
        const C = [1, -0.8, 0.5, -0.3];
        // cutoff χ = 1 on [−1, 1], 0 outside [−2, 2]; its derivatives tabulated once
        const chi = (u) => plateau(u, -1, 1, 1);
        const U = M.linspace(-2.2, 2.2, 881), CH = [0, 1, 2, 3, 4].map((j) => U.map((u) => fd(chi, j, u, 2e-3)));
        const chiJ = (j, u) => { if (u <= -2 || u >= 2) return 0; const t = (u + 2.2) / 4.4 * 880, i = Math.floor(t), f = t - i; return CH[j][i] * (1 - f) + CH[j][Math.min(880, i + 1)] * f; };
        // φ = x^m b(x), b(x) = (1 + 0.5x)·e·ψ(x/1.5): jets by Leibniz
        const bJ = (k, x) => (1 + 0.5 * x) * E1 * psiD(k, x / 1.5) / Math.pow(1.5, k) + (k >= 1 ? 0.5 * k * E1 * psiD(k - 1, x / 1.5) / Math.pow(1.5, k - 1) : 0);
        const monoJ = (m, k, x) => (k > m ? 0 : (M.factorial(m) / M.factorial(m - k)) * Math.pow(x, m - k));
        const phJ = (m, k, x) => { let s = 0; for (let i = 0; i <= k; i++) s += BIN[k][i] * monoJ(m, i, x) * bJ(k - i, x); return s; };
        const prodJ = (m, eps, j, x) => { let s = 0; for (let i = 0; i <= j; i++) s += BIN[j][i] * phJ(m, j - i, x) * chiJ(i, x / eps) / Math.pow(eps, i); return s; };
        const norms = (m, eps) => { const out = []; let run = 0; for (let j = 0; j <= 4; j++) { let mx = 0; for (let i = 0; i <= 300; i++) { const x = -2 * eps + 4 * eps * i / 300; mx = Math.max(mx, Math.abs(prodJ(m, eps, j, x))); } run = Math.max(run, mx); out.push(run); } return out; };
        const cache = new Map();
        const curves = (m) => { if (!cache.has(m)) { const ls = M.linspace(-3, 0, 61); const rows = ls.map((l) => norms(m, 10 ** l)); cache.set(m, [0, 1, 2, 3, 4].map((j) => ls.map((l, i) => [l, Math.log10(Math.max(rows[i][j], 1e-30))]))); } return cache.get(m); };
        const COL = ['blue', 'teal', 'green', 'orange', 'red'];
        let st = {};
        v.legend([['blue', '$\\varphi$'], ['orange', '$\\psi_\\varepsilon$ (scaled)'], ['teal', '$\\psi_\\varepsilon\\varphi$', { area: true }], ['ink', 'thick: $j=N$']]);
        v.render(() => {
          const N = NS.value, m = mS.value, eps = 10 ** eS.value;
          // top, zoomed
          const X = 2.5 * eps, ys = M.linspace(-X, X, 300).map((x) => phJ(m, 0, x));
          const A = Math.max(1e-300, ...ys.map(Math.abs));
          top.setView([-X, X], [-1.25 * A, 1.25 * A]);
          top.setTitle(`zoom to $[-2.5\\varepsilon,\\,2.5\\varepsilon]$; vertical scale $${v.sci(A, 2)}$`);
          top.setTicks([[-2 * eps, '−2ε'], [-eps, '−ε'], [0, '0'], [eps, 'ε'], [2 * eps, '2ε']], []);
          top.fn((x) => phJ(m, 0, x) * chiJ(0, x / eps), { color: 'teal', width: 1.2, fill: 'teal', fillAlpha: 0.25 });
          top.fn((x) => phJ(m, 0, x), { color: 'blue', width: 2.2 });
          top.fn((x) => A * chiJ(0, x / eps), { color: 'orange', width: 1.6, dash: [6, 4] });
          // bottom
          const cv = curves(m);
          const allY = cv.flat().map((p) => p[1]).filter(isFinite);
          bot.setView(null, [Math.max(-14, Math.min(...allY) - 0.5), Math.min(14, Math.max(...allY) + 0.5)]);
          const lo = Math.ceil(Math.max(-14, Math.min(...allY) - 0.5)), hi = Math.floor(Math.min(14, Math.max(...allY) + 0.5));
          const tk = []; for (let k = lo; k <= hi; k++) if (k % 2 === 0) tk.push([k, p10(k)]);
          bot.setTicks(XT, tk);
          cv.forEach((pts, j) => bot.path(pts, { color: COL[j], width: j === N ? 3.6 : 1.4, alpha: j === N ? 1 : 0.65 }));
          cv.forEach((pts, j) => { const p = pts[pts.length - 1]; bot.text(`j=${j}`, p[0], p[1], { color: COL[j], size: 11, dx: -30, dy: -8 }); });
          bot.vline(Math.log10(eps), { color: 'muted', width: 1, dash: [3, 3] });
          const cur = norms(m, eps);
          bot.dot(Math.log10(eps), Math.log10(Math.max(cur[N], 1e-30)), { color: COL[N], r: 5.5 });
          // Λφ
          let L = 0; for (let j = 0; j <= N; j++) L += C[j] * (j % 2 ? -1 : 1) * phJ(m, j, 0);
          st = { N, m, L, nN: cur[N], slope: m - N };
        });
        v.readout(() => {
          const s = st;
          const terms = C.slice(0, s.N + 1).map((c, j) => `${j ? (c < 0 ? '-' : '+') : c < 0 ? '-' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}\\delta${j ? `^{(${j})}` : ''}`).join('');
          return `$\\Lambda=${terms}$, $\\;\\Lambda\\varphi = ${v.fix(s.L, 5)}$. At this $\\varepsilon$: $\\|\\psi_\\varepsilon\\varphi\\|_{${s.N}} = ${v.sci(s.nN, 2)}$, slope $m-N=${s.slope}$` + (s.slope > 0 ? ' — it tends to $0$, forcing $\\Lambda\\varphi=0$.' : ' — it does not tend to $0$, and indeed $\\Lambda\\varphi$ need not vanish.');
        });
      },
    },
    // ------------------------------------------------------------------ distributions as derivatives
    {
      num: '6.26',
      kind: 'Theorem',
      name: 'On a compact set, a distribution is a derivative of a continuous function',
      statement: String.raw`Suppose $\Lambda\in\mathscr D'(\Omega)$ and $K\subset\Omega$ is compact. Then there is a continuous function $f$ in $\Omega$ and a multi-index $\alpha$ such that
$$\Lambda\varphi=(-1)^{|\alpha|}\int_\Omega f\,D^\alpha\varphi\,dx\qquad(\varphi\in\mathscr D_K).$$`,
      idea: String.raw`On $\mathscr D_K$, $\Lambda$ has some finite order $N$ (6.8). Since $\varphi$ vanishes outside a box $Q\supset K$, each $D^\beta\varphi$ with $|\beta|\le N$ is an iterated integral of $D^{(N+1,\dots,N+1)}\varphi$, so $|\Lambda\varphi|\le C\|D^{\gamma}\varphi\|_{L^1}$ with $\gamma=(N+1,\dots,N+1)$. Hahn–Banach and the duality $(L^1)^*=L^\infty$ give $g\in L^\infty(Q)$ with $\Lambda\varphi=\int g\,D^\gamma\varphi$; one more integration in each variable turns $g$ into a continuous $f$, at the cost of raising $\gamma$ to $\alpha=\gamma+(1,\dots,1)$.`,
      caption: String.raw`Integrate a distribution repeatedly: $F_1,F_2,F_3$ with $DF_{k}=F_{k-1}$, $F_0=\Lambda$. Red panels are not continuous functions (a point mass, a jump, an unbounded logarithm); the first green one is the continuous $f$ of the theorem, and $\Lambda=D^kf$. Drag $\varphi$: the readout checks $\Lambda\varphi=(-1)^k\int F_k\,\varphi^{(k)}$ by quadrature.`,
      deps: ['fa-6.8', 'fa-3.6', 'rca-6.16'],
      tags: ['distributions', 'structure theorem'],
      verify: true,
      viz(v) {
        const M = v.M;
        const LAM = {
          d: { label: '$\\delta$', F: [(x) => (x > 0 ? 1 : 0), (x) => Math.max(x, 0), (x) => Math.max(x, 0) ** 2 / 2], cont: [false, true, true], nm: ['H', 'x_+', 'x_+^2/2'] },
          dp: { label: "$\\delta'$", F: [null, (x) => (x > 0 ? 1 : 0), (x) => Math.max(x, 0)], cont: [false, false, true], nm: ['\\delta', 'H', 'x_+'] },
          pv: { label: '$\\mathrm{p.v.}\\frac1x$', F: [(x) => Math.log(Math.abs(x)), (x) => (x === 0 ? 0 : x * Math.log(Math.abs(x)) - x), (x) => (x === 0 ? 0 : x * x / 2 * Math.log(Math.abs(x)) - 3 * x * x / 4)], cont: [false, true, true], nm: ['\\log|x|', 'x\\log|x|-x', '\\tfrac{x^2}{2}\\log|x|-\\tfrac34x^2'] },
          comb: { label: 'comb', F: null, cont: [false, true, true], nm: ['\\sum w_jH(x-x_j)', '\\sum w_j(x-x_j)_+', '\\sum w_j\\tfrac{(x-x_j)_+^2}{2}'] },
        };
        const XJ = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2], WJ = XJ.map((x, j) => (j % 2 ? -0.4 : 0.6));
        LAM.comb.F = [(x) => XJ.reduce((s, xj, j) => s + (x > xj ? WJ[j] : 0), 0), (x) => XJ.reduce((s, xj, j) => s + WJ[j] * Math.max(x - xj, 0), 0), (x) => XJ.reduce((s, xj, j) => s + WJ[j] * Math.max(x - xj, 0) ** 2 / 2, 0)];
        const which = v.select('$\\Lambda=$', Object.entries(LAM).map(([value, o]) => ({ value, label: o.label })), 'pv');
        const rS = v.slider('width of $\\varphi$', 0.4, 1.6, 0.9, { step: 0.01 });
        const top = v.stage({ x: [-2.6, 2.6], y: [-2, 2], height: 200, full: true, axes: true, title: '$F_0=\\Lambda$ and the test function $\\varphi$' });
        const P = [1, 2, 3].map((k) => v.stage({ x: [-2.6, 2.6], y: [-2, 2], height: 190, minWidth: 220, axes: true, ticks: false }));
        const hc = top.handle(0.3, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1.5, 1.5), 0] });
        const pairs = (key, k, c, r) => {
          const F = LAM[key].F[k - 1]; if (!F) return NaN;
          const sgn = k % 2 ? -1 : 1, n = 2000, lo = c - r, hi = c + r; let s = 0;
          for (let i = 0; i < n; i++) { const x = lo + (hi - lo) * (i + 0.5) / n; s += F(x) * phiD(k, x, c, r); }   // midpoint: never samples x = 0 exactly
          return sgn * s * (hi - lo) / n;
        };
        let st = {};
        v.render(() => {
          const key = which.value, L = LAM[key], c = hc.x, r = rS.value;
          // Λ itself
          let lam;
          if (key === 'd') { deltaArrow(top, 0, 1, 1.3, 'purple', '\\delta'); lam = phiD(0, 0, c, r); }
          else if (key === 'dp') { dipole(top, 0, 1, 1.2, 'purple', "\\delta'"); lam = -phiD(1, 0, c, r); }
          else if (key === 'pv') {
            top.fn((x) => 1 / x, { domain: [-2.6, -0.02], color: 'purple', width: 2 }); top.fn((x) => 1 / x, { domain: [0.02, 2.6], color: 'purple', width: 2 });
            lam = simpson((x) => (x < 1e-9 ? 2 * phiD(1, 0, c, r) : (phiD(0, x, c, r) - phiD(0, -x, c, r)) / x), 0, Math.abs(c) + r, 800);
          } else { XJ.forEach((xj, j) => deltaArrow(top, xj, WJ[j], 1.6, 'purple')); lam = XJ.reduce((s, xj, j) => s + WJ[j] * phiD(0, xj, c, r), 0); }
          top.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.1 });
          const kc = L.cont.indexOf(true) + 1;
          P.forEach((S, i) => {
            const k = i + 1, F = L.F[i], ok = L.cont[i];
            S.setTitle(`$F_${k}=${L.nm[i]}$`);
            if (F) {
              const ys = M.linspace(-2.6, 2.6, 300).map(F).filter(isFinite), lo = Math.max(-6, Math.min(...ys)), hi = Math.min(6, Math.max(...ys)), pad = 0.15 * (hi - lo) + 0.2;
              S.setView(null, [Math.min(lo - pad, -0.3), hi + pad]);
              S.fn(F, { color: ok ? (k === kc ? 'green' : 'teal') : 'red', width: k === kc ? 3 : 2, n: 900 });
            } else { S.setView(null, [-0.4, 1.6]); deltaArrow(S, 0, 1, 1.1, 'red', '\\delta'); }
            S.corner(ok ? (k === kc ? `continuous: Λ = D${'¹²³'[k - 1]}F${k}` : 'continuous') : 'not a continuous function', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          });
          st = { key, lam, kc, chk: pairs(key, kc, c, r), chk3: kc < 3 ? pairs(key, 3, c, r) : NaN };
        });
        v.legend([['purple', '$\\Lambda$'], ['blue', '$\\varphi$'], ['green', 'first continuous antiderivative $f$'], ['red', 'not continuous']]);
        v.readout(() => {
          const s = st, sg = s.kc % 2 ? '-' : '';
          return `$\\Lambda\\varphi = ${v.fix(s.lam, 5)}$; $\\;${sg}\\int F_{${s.kc}}\\,\\varphi^{(${s.kc})} = ${v.fix(s.chk, 5)}$` + (isFinite(s.chk3) ? `; $\\;-\\int F_3\\,\\varphi'''= ${v.fix(s.chk3, 5)}$ (any later one works too)` : '') + '.';
        });
      },
    },
    {
      num: '6.27',
      kind: 'Theorem',
      name: 'Every distribution is a locally finite sum of derivatives of continuous functions',
      statement: String.raw`If $\Lambda\in\mathscr D'(\Omega)$, there are continuous functions $g_\alpha$ in $\Omega$, one for each multi-index $\alpha$, such that
(a) each compact $K\subset\Omega$ meets the supports of only finitely many $g_\alpha$, and
(b) $\Lambda=\sum_\alpha D^\alpha g_\alpha$.
If $\Lambda$ has finite order, the $g_\alpha$ can be chosen so that only finitely many of them are $\ne0$.`,
      idea: String.raw`Cover $\Omega$ by a locally finite family of relatively compact open sets and take a partition of unity $\{\psi_i\}$ subordinate to it (6.20). Each $\psi_i\Lambda$ has compact support, so 6.26 (in the sharper form 6.28, with supports kept inside a slightly larger set) writes it as a finite sum $\sum_\alpha D^\alpha g_{i,\alpha}$ with $g_{i,\alpha}$ supported near $\operatorname{supp}\psi_i$. Summing over $i$ and collecting terms by $\alpha$ gives $g_\alpha=\sum_ig_{i,\alpha}$, a locally finite sum of continuous functions.`,
      caption: String.raw`$\Lambda=\sum_{k\ge0}c_k\,\delta^{(k)}_{p_k}$ with $p_k=k+\tfrac12$ has **infinite** order: near $p_k$ it needs $k$ derivatives. Yet $\Lambda=\sum_kD^{k+2}g_k$ with the continuous ramps $g_k=c_k(x-p_k)_+$ (bottom). Drag the compact set $K$: only the ramps whose supports $[p_k,\infty)$ start before $\max K$ meet it — finitely many. Drag $\varphi$: the readout compares $\Lambda\varphi=\sum_kc_k(-1)^k\varphi^{(k)}(p_k)$ with $\sum_k(-1)^k\int g_k\varphi^{(k+2)}$.`,
      deps: ['fa-6.26', 'fa-6.20', 'fa-6.24'],
      tags: ['distributions', 'structure theorem'],
      verify: true,
      viz(v) {
        const M = v.M;
        const KMAX = 5, CK = [1, -0.8, 0.6, -0.45, 0.3, -0.2], PK = M.range(KMAX + 1).map((k) => k + 0.5);
        const rS = v.slider('width of $\\varphi$', 0.3, 1.2, 0.7, { step: 0.01 });
        const top = v.stage({ x: [-0.6, 6.4], y: [-1.3, 1.6], height: 200, full: true, axes: true, title: '$\\Lambda=\\sum_kc_k\\,\\delta^{(k)}_{p_k}$ and the test function $\\varphi$' });
        const bot = v.stage({ x: [-0.6, 6.4], y: [-2.2, 2.6], height: 250, full: true, axes: true, title: 'the continuous $g_k=c_k(x-p_k)_+$, with $\\Lambda=\\sum_kD^{k+2}g_k$; the bar is the compact set $K$' });
        const hc = top.handle(1.9, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, 0, 5.6), 0] });
        const hA = bot.handle(0.3, -1.9, { color: 'ink', r: 6, label: 'K', labelPos: 'w', constrain: (x) => [M.clamp(x, -0.4, 6.2), -1.9] });
        const hB = bot.handle(2.2, -1.9, { color: 'ink', r: 6, constrain: (x) => [M.clamp(x, -0.4, 6.2), -1.9] });
        const COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink'];
        let st = {};
        v.render(() => {
          const c = hc.x, r = rS.value, a = Math.min(hA.x, hB.x), b = Math.max(hA.x, hB.x);
          PK.forEach((p, k) => {
            const col = COL[k];
            if (k === 0) deltaArrow(top, p, CK[k], 1.1, col);
            else { top.line(p, -0.06, p, 0.06, { color: col, width: 3 }); }
            top.tex(`${v.fmt(CK[k], 2)}\\,\\delta^{(${k})}`, p, k % 2 ? -0.95 : 1.25, { color: col, size: 13 });
          });
          top.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.1 });
          top.text('…', 6.2, 0.3, { color: 'muted', size: 16 });
          // ramps
          const meets = [];
          PK.forEach((p, k) => {
            const on = p < b;
            if (on) meets.push(k);
            bot.fn((x) => CK[k] * Math.max(x - p, 0), { color: COL[k], width: on ? 2.6 : 1.4, alpha: on ? 1 : 0.35, domain: [p - 0.5, 6.4] });
            bot.dot(p, 0, { color: COL[k], r: 3.5 });
          });
          bot.line(a, -1.9, b, -1.9, { color: 'ink', width: 4 });
          bot.vband(a, b, { color: 'ink', alpha: 0.05 });
          // the pairing two ways
          let L = 0, R = 0;
          PK.forEach((p, k) => {
            L += CK[k] * (k % 2 ? -1 : 1) * phiD(k, p, c, r);
            const lo = Math.max(p, c - r), hi = c + r;
            R += (k % 2 ? -1 : 1) * simpson((x) => CK[k] * (x - p) * phiD(k + 2, x, c, r), lo, hi, 1200);
          });
          st = { meets, L, R, a, b };
        });
        v.legend([['ink', 'compact $K$'], ['blue', '$g_0$, $\\varphi$'], ['orange', '$g_1$'], ['green', '$g_2$'], ['purple', '$g_3$']]);
        v.readout(() => {
          const s = st;
          return `$K=[${v.fix(s.a, 2)},${v.fix(s.b, 2)}]$ meets the supports of $g_k$ for $k\\in\\{${s.meets.join(',')}\\}$ only. $\\Lambda\\varphi = ${v.fix(s.L, 5)}$, $\\;\\sum_k(-1)^{k}\\int g_k\\varphi^{(k+2)} = ${v.fix(s.R, 5)}$.`;
        });
      },
    },
    {
      num: '6.28',
      kind: 'Theorem',
      name: 'Compact support: finitely many derivatives, supports in any neighbourhood',
      statement: String.raw`Suppose $K$ is compact, $V$ is open, $K\subset V\subset\Omega$, and $\Lambda\in\mathscr D'(\Omega)$ has support $K$ and order $N$. Then there are finitely many continuous functions $f_\beta$ in $\Omega$, with supports in $V$, such that
$$\Lambda=\sum_\beta D^\beta f_\beta,$$
the sum running over multi-indices $\beta$ with $\beta_i\le N+2$ for each $i$.`,
      idea: String.raw`Choose $\psi\in\mathscr D(V)$ with $\psi=1$ near $K$, so $\Lambda=\psi\Lambda$. By 6.26 applied on a compact neighbourhood, $\Lambda=D^\alpha f$ there with $f$ continuous and $\alpha_i\le N+2$. Then $\Lambda=\psi D^\alpha f$, and Leibniz' formula moves the derivatives off: $\psi D^\alpha f=\sum_{\beta\le\alpha}c_{\alpha\beta}D^\beta\big((D^{\alpha-\beta}\psi)f\big)$ up to sign, and every function $(D^{\alpha-\beta}\psi)f$ is continuous with support in $\operatorname{supp}\psi\subset V$.`,
      caption: String.raw`$\Lambda=\delta^{(m)}$ ($m=0$ or $1$), $V=(-w,w)$. With a cutoff $\chi$ that is $1$ near $0$ and supported in $V$, one gets exactly $\delta^{(m)}=D^{m+2}f_{m+2}-f_0$ with the continuous $f_{m+2}=x_+\chi$ (purple) and $f_0=(m+2)H\chi^{(m+1)}+x_+\chi^{(m+2)}$ (orange), both supported in $V$. Shrink $V$: the representation persists, but $f_0$ grows like $w^{-m-1}$ — localising costs size. The readout checks the identity against $\varphi$.`,
      deps: ['fa-6.26', 'fa-6.23', 'fa-6.15'],
      tags: ['distributions', 'compact support', 'structure theorem'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mS = v.select('$\\Lambda=$', [{ value: 0, label: '$\\delta$' }, { value: 1, label: "$\\delta'$" }], 0);
        const wS = v.slider('$V=(-w,w)$, $w=$', 0.3, 2, 1.2, { step: 0.01 });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2, 2], height: 320, full: true, axes: true });
        const hc = S.handle(0.25, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1, 1), 0] });
        const r = 0.9;
        let st = {};
        v.legend([['purple', '$f_{m+2}=x_+\\chi$'], ['orange', '$f_0=(m+2)H\\chi^{(m+1)}+x_+\\chi^{(m+2)}$'], ['blue', '$\\varphi$'], ['muted', '$V$', { area: true }]]);
        v.render(() => {
          const m = +mS.value, w = wS.value, c = hc.x;
          const chi = (x) => plateau(x, -w / 3, w / 3, w / 2), h = w * 1e-3;
          const f2 = (x) => Math.max(x, 0) * chi(x);
          const f0 = (x) => (x > 0 ? (m + 2) * fd(chi, m + 1, x, h) + x * fd(chi, m + 2, x, h) : 0);
          S.setTitle(`$\\delta${m ? "'" : ''} = D^{${m + 2}}f_{${m + 2}} - f_0$ with supports in $V=(-${v.fix(w, 2)},${v.fix(w, 2)})$`);
          S.vband(-w, w, { color: 'muted', alpha: 0.1, edges: true });
          const sup0 = Math.max(...M.linspace(0, w, 400).map((x) => Math.abs(f0(x))));
          const sc = sup0 > 1.8 ? 1.8 / sup0 : 1;
          S.fn(f2, { color: 'purple', width: 2.6, n: 900 });
          S.fn((x) => sc * f0(x), { color: 'orange', width: 2.2, n: 900 });
          if (sc < 1) S.corner(`f₀ drawn ×${v.fmt(sc, 2)}`, 'tr', { color: 'orange', weight: 600 });
          S.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2, alpha: 0.8 });
          if (m === 0) deltaArrow(S, 0, 1, 1.4, 'ink', '\\delta'); else dipole(S, 0, 1, 1.2, 'ink', "\\delta'");
          // check
          const lam = m === 0 ? phiD(0, 0, c, r) : -phiD(1, 0, c, r);
          const t1 = (m % 2 ? -1 : 1) * simpson((x) => f2(x) * phiD(m + 2, x, c, r), 0, Math.min(w, c + r), 1200);
          const t0 = simpson((x) => f0(x) * phiD(0, x, c, r), 0, Math.min(w, c + r), 1200);
          st = { m, lam, t1, t0, sup0, w };
        });
        v.readout(() => {
          const s = st;
          return `$\\Lambda\\varphi = ${v.fix(s.lam, 5)}$; $\\;(-1)^{${s.m}}\\int f_{${s.m + 2}}\\varphi^{(${s.m + 2})} - \\int f_0\\varphi = ${v.fix(s.t1, 5)} - (${v.fix(s.t0, 5)}) = ${v.fix(s.t1 - s.t0, 5)}$. Size of the correction: $\\sup|f_0| = ${v.fix(s.sup0, 3)}$, roughly $\\propto w^{-${s.m + 1}}$.`;
        });
      },
    },
  ],
};
