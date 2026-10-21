// Rudin, Functional Analysis — Chapter 6 (part 5): convolutions
//
// Numbering note: recalled, not checked against the book; uncertain items carry `verify: true`.

const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 4; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
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
const I0 = simpson((u) => E1 * psiD(0, u), -1, 1, 600);
/** Mollifier h (∫h = 1, support [−1, 1]) and h_j(x) = j h(jx). */
const hMol = (x) => E1 * psiD(0, x) / I0;
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
/** Merge a list of closed intervals. */
function merge(iv) {
  const s = iv.slice().sort((a, b) => a[0] - b[0]), out = [];
  for (const [a, b] of s) { const L = out[out.length - 1]; if (L && a <= L[1] + 1e-12) L[1] = Math.max(L[1], b); else out.push([a, b]); }
  return out;
}
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

export default {
  collection: 'fa',
  chapter: 6,
  items: [
    {
      num: '6.29',
      kind: 'Definition',
      name: 'Translation, reflection, and u∗φ',
      statement: String.raw`For a function $u$ on $\R^n$ and $x\in\R^n$ put $(\tau_xu)(y)=u(y-x)$ and $\check u(y)=u(-y)$, so that $(u*v)(x)=\int u(y)\,(\tau_x\check v)(y)\,dy$. Accordingly, for $u\in\mathscr D'(\R^n)$ and $\varphi\in\mathscr D(\R^n)$ one defines
$$(\tau_xu)(\varphi)=u(\tau_{-x}\varphi),\qquad\check u(\varphi)=u(\check\varphi),\qquad(u*\varphi)(x)=u(\tau_x\check\varphi)\quad(x\in\R^n).$$
Thus $u*\varphi$ is a complex function on $\R^n$: at $x$, the distribution $u$ is applied to the reflected test function $y\mapsto\varphi(x-y)$.`,
      idea: String.raw`All three definitions are forced by what happens for locally integrable $u$: a change of variables in the integral turns $\int u(y-x)\varphi(y)\,dy$ into $\int u(y)\varphi(y+x)\,dy$, and $\int u(y)\varphi(x-y)\,dy$ is the classical convolution. For $u=\delta$ one gets $\delta*\varphi=\varphi$; for $u=\delta'$, $\delta'*\varphi=\varphi'$.`,
      deps: ['fa-6.7'],
      see: ['rca-8.13'],
      tags: ['distributions', 'convolution'],
      verify: true,
    },
    {
      num: '6.30',
      kind: 'Theorem',
      name: 'u∗φ is smooth, and convolution commutes with translations and derivatives',
      statement: String.raw`If $u\in\mathscr D'(\R^n)$ and $\varphi,\psi\in\mathscr D(\R^n)$, then
(a) $\tau_x(u*\varphi)=(\tau_xu)*\varphi=u*(\tau_x\varphi)$ for all $x\in\R^n$;
(b) $u*\varphi\in C^\infty(\R^n)$ and $D^\alpha(u*\varphi)=(D^\alpha u)*\varphi=u*(D^\alpha\varphi)$ for every multi-index $\alpha$;
(c) $u*(\varphi*\psi)=(u*\varphi)*\psi$.`,
      idea: String.raw`(a) is bookkeeping with the definitions. For (b), the difference quotients of $x\mapsto\tau_x\check\varphi$ converge in $\mathscr D(\R^n)$ (all supports stay in one compact set and all derivatives converge uniformly), so continuity of $u$ lets the derivative pass inside: $D_i(u*\varphi)=u*(D_i\varphi)$; iterate. For (c), the convolution integral $\varphi*\psi=\int\varphi(\cdot-y)\psi(y)\,dy$ is a limit in $\mathscr D$ of Riemann sums, to which $u$ may be applied term by term.`,
      caption: String.raw`Top: the distribution $u$ and, in blue, the reflected and translated test function $y\mapsto\varphi(x-y)$ that $u$ reads at the point $x$ (drag $x$ in the lower panel; $\varphi$ is lopsided so the reflection shows). Bottom: the whole function $x\mapsto(u*\varphi)(x)$ — smooth even when $u$ is a jump, a dipole, a singular kernel or a comb. Its numerical derivative (orange line) runs through the independently computed values of $u*\varphi'$ (orange dots), as (b) says.`,
      deps: ['fa-6.29', 'fa-6.5', 'fa-6.12'],
      see: ['rca-8.14'],
      tags: ['distributions', 'convolution', 'smoothing'],
      verify: true,
      viz(v) {
        const M = v.M;
        const U = { H: '$H$', dp: "$\\delta'$", pv: '$\\mathrm{p.v.}\\frac1x$', sing: '$|x|^{-1/2}$', comb: '$\\sum_{|k|\\le3}\\delta_k$' };
        const which = v.select('$u=$', Object.entries(U).map(([value, label]) => ({ value, label })), 'pv');
        const r = 0.8, sk = 0.7;
        const ph = (t) => E1 * psiD(0, t / r) * (1 + sk * t / r);
        const ph1 = (t) => E1 * (psiD(1, t / r) / r * (1 + sk * t / r) + psiD(0, t / r) * sk / r);
        const top = v.stage({ x: [-4, 4], y: [-1.6, 2.2], height: 220, full: true, axes: true, title: 'variable $y$: the distribution $u$ and $y\\mapsto\\varphi(x-y)$' });
        const bot = v.stage({ x: [-4, 4], y: [-2, 2], height: 230, full: true, axes: true, title: 'variable $x$: the function $u*\\varphi$, its derivative, and $u*\\varphi\'$' });
        const hx = bot.handle(0.9, 0, { color: 'blue', label: 'x', labelPos: 's', constrain: (x) => [M.clamp(x, -3.8, 3.8), 0] });
        const conv = (key, f, x) => {
          if (key === 'H') return simpson((s) => f(s), -r, Math.min(x, r), 300);
          if (key === 'dp') return null;
          if (key === 'pv') { const R = Math.abs(x) + r; return simpson((y) => { const t = Math.max(y, 1e-6); return (f(x - t) - f(x + t)) / t; }, 0, R, 900); }
          if (key === 'sing') { const T = Math.sqrt(Math.abs(x) + r) + 1e-9; return simpson((t) => 2 * f(x - t * t) + 2 * f(x + t * t), 0, T, 600); }
          let s = 0; for (let k = -3; k <= 3; k++) s += f(x - k); return s;
        };
        const val = (key, x) => (key === 'dp' ? ph1(x) : conv(key, ph, x));
        const valD = (key, x) => (key === 'dp' ? (ph1(x + 1e-4) - ph1(x - 1e-4)) / 2e-4 : conv(key, ph1, x));
        const cache = new Map();
        const curve = (key) => { if (!cache.has(key)) { const xs = M.linspace(-4, 4, 321); cache.set(key, { xs, y: xs.map((x) => val(key, x)), d: xs.filter((_, i) => i % 8 === 4).map((x) => [x, valD(key, x)]) }); } return cache.get(key); };
        let st = {};
        v.legend([['purple', '$u$'], ['blue', '$y\\mapsto\\varphi(x-y)$'], ['green', '$u*\\varphi$'], ['orange', 'derivative of $u*\\varphi$ / values of $u*\\varphi\'$']]);
        v.render(() => {
          const key = which.value, x = hx.x;
          // the distribution, in y
          if (key === 'H') { top.line(-4, 0, 0, 0, { color: 'purple', width: 3 }); top.line(0, 1, 4, 1, { color: 'purple', width: 3 }); }
          else if (key === 'dp') dipole(top, 0, 1, 1.3, 'purple', "\\delta'");
          else if (key === 'pv') { top.fn((y) => 1 / y, { domain: [-4, -0.02], color: 'purple', width: 2 }); top.fn((y) => 1 / y, { domain: [0.02, 4], color: 'purple', width: 2 }); }
          else if (key === 'sing') top.fn((y) => Math.min(1 / Math.sqrt(Math.abs(y)), 2.4), { color: 'purple', width: 2, n: 900 });
          else for (let k = -3; k <= 3; k++) deltaArrow(top, k, 1, 1.1, 'purple');
          top.fn((y) => ph(x - y), { domain: [x - r, x + r], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12 });
          top.vline(x, { color: 'blue', width: 1, dash: [3, 3], alpha: 0.6 });
          // the convolution, in x
          const C = curve(key);
          bot.setView(null, span([...C.y, ...C.d.map((p) => p[1])], 1, 0.1));
          bot.path(C.xs.map((t, i) => [t, C.y[i]]), { color: 'green', width: 2.6 });
          const dnum = C.xs.slice(1, -1).map((t, i) => [t, (C.y[i + 2] - C.y[i]) / (C.xs[i + 2] - C.xs[i])]);
          bot.path(dnum, { color: 'orange', width: 1.4, alpha: 0.8 });
          bot.dots(C.d, { color: 'orange', r: 3.5 });
          const y0 = val(key, x);
          bot.dot(x, y0, { color: 'green', r: 5 });
          st = { key, x, y0, d: valD(key, x), dn: (val(key, x + 1e-3) - val(key, x - 1e-3)) / 2e-3 };
        });
        v.readout(() => {
          const s = st;
          return `$(u*\\varphi)(${v.fix(s.x, 2)}) = u\\big(\\varphi(${v.fix(s.x, 2)}-\\cdot)\\big) = ${v.fix(s.y0, 5)}$. Derivative there: difference quotient $${v.fix(s.dn, 5)}$, $\\;(u*\\varphi')(x) = ${v.fix(s.d, 5)}$.`;
        });
      },
    },
    {
      num: '6.31',
      kind: 'Definition',
      name: 'Approximate identities (mollifiers)',
      credit: 'Friedrichs, 1944',
      statement: String.raw`Fix $h\in\mathscr D(\R^n)$ with $h\ge0$, $\int h\,dm_n=1$ and support in the closed unit ball, and put $h_j(x)=j^nh(jx)$ for $j=1,2,3,\dots$. The sequence $\{h_j\}$ is an **approximate identity**: each $h_j$ has integral $1$ and support in the ball of radius $1/j$.`,
      idea: String.raw`Convolving with $h_j$ averages over smaller and smaller balls. Because $h_j$ is smooth, $u*h_j$ is a $C^\infty$ function for every distribution $u$ (6.30), so $\{h_j\}$ is the standard tool for smoothing distributions — see 6.32.`,
      deps: ['fa-6.29'],
      see: ['rca-9.7'],
      tags: ['distributions', 'mollifiers'],
      verify: true,
    },
    {
      num: '6.32',
      kind: 'Theorem',
      name: 'Smooth functions are dense in 𝒟′: u∗h_j → u',
      statement: String.raw`Let $\{h_j\}$ be an approximate identity. Then
(a) $\varphi*h_j\to\varphi$ in $\mathscr D(\R^n)$ for every $\varphi\in\mathscr D(\R^n)$;
(b) $u*h_j\to u$ in $\mathscr D'(\R^n)$ for every $u\in\mathscr D'(\R^n)$.
In particular $C^\infty(\R^n)$ — indeed $\mathscr D(\R^n)$ — is dense in $\mathscr D'(\R^n)$ for its weak* topology.`,
      idea: String.raw`(a) All supports lie in $\operatorname{supp}\varphi+\bar B(0,1)$, and $D^\alpha(\varphi*h_j)-D^\alpha\varphi=(D^\alpha\varphi)*h_j-D^\alpha\varphi$ is bounded by the oscillation of $D^\alpha\varphi$ over balls of radius $1/j$, which tends to $0$ by uniform continuity. (b) By 6.30, $(u*h_j)(\varphi)=u(\varphi*\check h_j)$ after a reflection, and $\varphi*\check h_j\to\varphi$ in $\mathscr D$ by (a); continuity of $u$ finishes.`,
      caption: String.raw`Left: the distribution $u$ (faint purple) and its regularisation $u*h_j$ (green), a smooth function, for the chosen $j$ — a smoothed step, a smoothed corner, or a spike of height $j\,h(0)$. Right (log–log against $j$): how fast things converge — the error $|(u*h_j)(\varphi)-u(\varphi)|$ for the test function shown (green), and, for (a), the sup norms $\|D^k(\varphi*h_j-\varphi)\|_\infty$, $k=0,1,2$ (blue, teal, purple), all decaying like $j^{-2}$ because $h$ is even.`,
      deps: ['fa-6.31', 'fa-6.30', 'fa-6.5', 'fa-6.17'],
      see: ['rca-9.10'],
      tags: ['distributions', 'mollifiers', 'density'],
      verify: true,
      viz(v) {
        const M = v.M;
        const U = { H: { label: '$H$' }, abs: { label: '$|x|$' }, delta: { label: '$\\delta$' } };
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'H');
        const jS = v.slider('$\\log_{10}j$', 0, 2.3, 0.6, { step: 0.01, fmt: (x) => `j = ${Math.round(10 ** x)}` });
        const L = v.stage({ x: [-2.5, 2.5], y: [-0.6, 2.6], height: 300, weight: 1.15, axes: true, title: '$u$ and $u*h_j$; the test function $\\varphi$ (blue)' });
        const R = v.stage({ x: [0, 2.3], y: [-8, 0.5], height: 300, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], xlabel: 'j', title: 'errors against $j$ (log–log)' });
        const hc = L.handle(0.35, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1, 1), 0] });
        const r = 1;
        // cumulative of h on [−1, 1]
        const TAB = 801, Cum = [0]; { const dx = 2 / (TAB - 1); for (let i = 1; i < TAB; i++) { const a = -1 + (i - 1) * dx, b = a + dx; Cum.push(Cum[i - 1] + (hMol(a) + 4 * hMol((a + b) / 2) + hMol(b)) * dx / 6); } }
        const cumH = (t) => { if (t <= -1) return 0; if (t >= 1) return 1; const u = (t + 1) / 2 * (TAB - 1), i = Math.floor(u), f = u - i; return Cum[i] * (1 - f) + Cum[Math.min(TAB - 1, i + 1)] * f; };
        const reg = (key, j, x) => {
          if (key === 'H') return cumH(j * x);
          if (key === 'delta') return j * hMol(j * x);
          return simpson((s) => Math.abs(x - s / j) * hMol(s), -1, 1, 200);   // |x| * h_j
        };
        const exact = (key, c) => (key === 'H' ? simpson((x) => phiD(0, x, c, r), Math.max(0, c - r), Math.max(0, c + r), 600) : key === 'delta' ? phiD(0, 0, c, r) : simpson((x) => Math.abs(x) * phiD(0, x, c, r), c - r, c + r, 600));
        const LJ = M.linspace(0, 2.3, 24);
        // (a): sup norms of D^k(φ*h_j − φ) — independent of the translation c
        const normsA = LJ.map((l) => {
          const j = Math.round(10 ** l), out = [0, 0, 0];
          for (let i = 0; i <= 160; i++) {
            const x = -r - 1 / j + (2 * r + 2 / j) * i / 160;
            for (let k = 0; k < 3; k++) { const conv = simpson((s) => phiD(k, x - s / j, 0, r) * hMol(s), -1, 1, 60); out[k] = Math.max(out[k], Math.abs(conv - phiD(k, x, 0, r))); }
          }
          return out;
        });
        const cache = new Map();
        const errs = (key, c) => { const k = key + c.toFixed(3); if (!cache.has(k)) { const ex = exact(key, c); cache.set(k, LJ.map((l) => { const j = Math.round(10 ** l); const lo = key === 'delta' ? Math.max(c - r, -1 / j) : c - r, hi = key === 'delta' ? Math.min(c + r, 1 / j) : c + r; return Math.abs(simpson((x) => reg(key, j, x) * phiD(0, x, c, r), lo, hi, key === 'abs' ? 200 : 800) - ex); })); } return cache.get(k); };
        const COLS = ['blue', 'teal', 'purple'];
        let st = {};
        v.legend([['purple', '$u$'], ['green', '$u*h_j$; error $|(u*h_j)(\\varphi)-u(\\varphi)|$'], ['blue', '$\\|D^k(\\varphi*h_j-\\varphi)\\|_\\infty$, $k=0$ (blue), $1$ (teal), $2$ (purple)']]);
        v.render(() => {
          const key = which.value, j = Math.round(10 ** jS.value), c = hc.x;
          // left
          if (key === 'H') { L.line(-2.5, 0, 0, 0, { color: 'purple', width: 3, alpha: 0.35 }); L.line(0, 1, 2.5, 1, { color: 'purple', width: 3, alpha: 0.35 }); L.setView(null, [-0.6, 2]); }
          else if (key === 'abs') { L.fn(Math.abs, { color: 'purple', width: 3, alpha: 0.35 }); L.setView(null, [-0.6, 2.6]); }
          else { deltaArrow(L, 0, 1, 2.2, 'purple'); L.setView(null, [-0.6, 2.6]); }
          L.fn((x) => Math.min(reg(key, j, x), 50), { color: 'green', width: 2.4, n: 700 });
          L.fn((x) => phiD(0, x, c, r) * 0.8, { domain: [c - r, c + r], color: 'blue', width: 1.8, alpha: 0.8 });
          if (key === 'delta' && j * hMol(0) > 2.6) L.corner(`peak j·h(0) = ${v.fmt(j * hMol(0), 3)}`, 'tr', { color: 'green', weight: 600 });
          // right
          const E = errs(key, c);
          const ly = (y) => Math.log10(Math.max(y, 1e-14));
          [0, 1, 2].forEach((k) => R.path(LJ.map((l, i) => [l, ly(normsA[i][k])]), { color: COLS[k], width: 1.8, alpha: 0.8 }));
          R.path(LJ.map((l, i) => [l, ly(E[i])]), { color: 'green', width: 2.6 });
          R.dots(LJ.map((l, i) => [l, ly(E[i])]), { color: 'green', r: 3 });
          R.line(0.3, -0.2, 2.3, -4.2, { color: 'muted', width: 1, dash: [4, 4] });
          R.text('slope −2', 1.6, -2.6, { color: 'muted', size: 11 });
          const allL = [...normsA.flat(), ...E].map(ly);
          R.setView(null, [Math.min(...allL) - 0.4, Math.max(...allL) + 0.4]);
          R.setTicks([[0, '1'], [1, '10'], [2, '100']], [[2, '100'], [0, '1'], [-2, '10⁻²'], [-4, '10⁻⁴'], [-6, '10⁻⁶'], [-8, '10⁻⁸'], [-10, '10⁻¹⁰']]);
          R.vline(Math.log10(j), { color: 'muted', width: 1, dash: [3, 3] });
          const now = Math.abs(simpson((x) => reg(key, j, x) * phiD(0, x, c, r), key === 'delta' ? Math.max(c - r, -1 / j) : c - r, key === 'delta' ? Math.min(c + r, 1 / j) : c + r, 800) - exact(key, c));
          st = { j, now, ex: exact(key, c) };
        });
        v.readout(() => {
          const s = st;
          return `$u(\\varphi) = ${v.fix(s.ex, 5)}$; with $j=${s.j}$, $\\;|(u*h_j)(\\varphi)-u(\\varphi)| = ${v.sci(s.now, 2)}$.`;
        });
      },
    },
    {
      num: '6.33',
      kind: 'Theorem',
      name: 'Translation-invariant operators are convolutions',
      statement: String.raw`(a) If $u\in\mathscr D'(\R^n)$, then $L\varphi=u*\varphi$ defines a continuous linear map $L:\mathscr D(\R^n)\to C^\infty(\R^n)$ that commutes with translations: $\tau_xL=L\tau_x$.
(b) Conversely, if $L:\mathscr D(\R^n)\to C(\R^n)$ is continuous, linear, and $\tau_xL=L\tau_x$ for every $x\in\R^n$, then there is exactly one $u\in\mathscr D'(\R^n)$ with $L\varphi=u*\varphi$.`,
      idea: String.raw`(a) is 6.30 plus the closed graph theorem (or a direct estimate) for continuity into the Fréchet space $C^\infty$. For (b), the only candidate is forced: put $u(\varphi)=(L\check\varphi)(0)$, which is continuous since evaluation at $0$ is. Then $(u*\varphi)(x)=u(\tau_x\check\varphi)=(L\tau_{-x}\varphi)(0)=(\tau_{-x}L\varphi)(0)=(L\varphi)(x)$.`,
      caption: String.raw`Pick an operator $L$ on test functions. Top: $\varphi$ and its translate $\tau_a\varphi$ (slide $a$). Middle: $L(\tau_a\varphi)$ (green) against $\tau_a(L\varphi)$ (orange, dashed) — they coincide exactly for the translation-invariant operators, and visibly differ for multiplication by $x$ or for "evaluate at $0$". Bottom: $L h_j$ for a narrow bump $h_j$, i.e. $u*h_j$ — the kernel $u$ seen through a small window: a box, a dipole-like $\delta'-\frac12\delta''$, a spike at $1$.`,
      deps: ['fa-6.30', 'fa-6.32', 'fa-2.15'],
      tags: ['distributions', 'convolution', 'translation invariance'],
      verify: true,
      viz(v) {
        const M = v.M;
        const r = 1.1, ph = (k, x) => phiD(k, x, 0, r);
        const OPS = {
          avg: { label: 'moving average', inv: true, L: (f, F) => (x) => F(x + 0.5) - F(x - 0.5), u: 'u=1_{[-1/2,1/2]}', ut: 'u = 1 on [−½, ½]' },
          der: { label: "$\\varphi'-\\tfrac12\\varphi''$", inv: true, L: (f, F, f1, f2) => (x) => f1(x) - 0.5 * f2(x), u: "u=\\delta'-\\tfrac12\\delta''", ut: 'u = δ′ − ½δ″' },
          shift: { label: 'shift by $1$', inv: true, L: (f) => (x) => f(x - 1), u: 'u=\\delta_1', ut: 'u = δ₁' },
          mult: { label: 'multiply by $x$', inv: false, L: (f) => (x) => x * f(x) },
          eval: { label: '$\\varphi(0)\\,e^{-x^2}$', inv: false, L: (f) => (x) => f(0) * Math.exp(-x * x) },
        };
        const op = v.select('$L$:', Object.entries(OPS).map(([value, o]) => ({ value, label: o.label })), 'der');
        const aS = v.slider('translation $a$', -2, 2, 1.1, { step: 0.01 });
        const jS = v.slider('window $j$ of $h_j$', 2, 20, 6, { int: true });
        const T = v.stage({ x: [-3.5, 3.5], y: [-0.3, 1.3], height: 150, full: true, axes: true, title: '$\\varphi$ and $\\tau_a\\varphi$' });
        const Mi = v.stage({ x: [-3.5, 3.5], y: [-2, 2], height: 200, full: true, axes: true, title: '$L(\\tau_a\\varphi)$ and $\\tau_a(L\\varphi)$' });
        const B = v.stage({ x: [-3.5, 3.5], y: [-2, 2], height: 170, full: true, axes: true, title: 'the kernel through a window: $Lh_j=u*h_j$' });
        // functions with their antiderivative and derivatives, for a centre shift s
        const pack = (s, scale = 1, rr = r, base = (k, x) => phiD(k, x, 0, rr)) => {
          const f = (x) => scale * base(0, x - s), f1 = (x) => scale * base(1, x - s), f2 = (x) => scale * base(2, x - s);
          const F = (x) => scale * simpson((t) => base(0, t), -rr, Math.min(Math.max(x - s, -rr), rr), 120);
          return [f, F, f1, f2];
        };
        let st = {};
        v.legend([['blue', '$\\varphi$, $\\tau_a\\varphi$'], ['green', '$L(\\tau_a\\varphi)$'], ['orange', '$\\tau_a(L\\varphi)$', { dash: true }], ['purple', '$Lh_j$']]);
        v.render(() => {
          const O = OPS[op.value], a = aS.value, j = jS.value;
          T.fn((x) => ph(0, x), { domain: [-r, r], color: 'blue', width: 1.6, alpha: 0.5 });
          T.fn((x) => ph(0, x - a), { domain: [a - r, a + r], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.1 });
          T.arrow(0, 1.12, a, 1.12, { color: 'muted', width: 1.2, head: 7 });
          const Lphi = O.L(...pack(0)), LtA = O.L(...pack(a));
          const xs = M.linspace(-3.5, 3.5, 351);
          const g1 = xs.map(LtA), g2 = xs.map((x) => Lphi(x - a));
          Mi.setView(null, span([...g1, ...g2], 1, 0.12));
          Mi.path(xs.map((x, i) => [x, g1[i]]), { color: 'green', width: 3 });
          Mi.path(xs.map((x, i) => [x, g2[i]]), { color: 'orange', width: 2, dash: [6, 4] });
          const diff = Math.max(...g1.map((y, i) => Math.abs(y - g2[i])));
          Mi.corner(O.inv ? `max |L τₐφ − τₐ Lφ| = ${v.fmt(diff, 2)}` : `not invariant: max difference ${v.fmt(diff, 3)}`, 'tl', { color: diff < 1e-6 ? 'green' : 'red', weight: 600 });
          // kernel through a window
          const hj = (k, x) => Math.pow(j, k + 1) * E1 * psiD(k, j * x) / I0;
          const Lh = O.L(...pack(0, 1, 1 / j, hj));
          const ys = xs.map(Lh);
          B.setView(null, span(ys.map((y) => M.clamp(y, -400, 400)), 1, 0.12));
          B.path(xs.map((x, i) => [x, M.clamp(ys[i], -400, 400)]), { color: 'purple', width: 2.2 });
          if (O.ut) B.corner(O.ut, 'tr', { color: 'purple', weight: 600 });
          st = { inv: O.inv, diff, u: O.u, label: O.label };
        });
        v.readout(() => {
          const s = st;
          return s.inv ? `$L$ commutes with every translation (difference $${s.diff < 1e-14 ? '0' : v.sci(s.diff, 1)}$), so $L\\varphi=u*\\varphi$ with $${s.u}$, recovered as $u(\\varphi)=(L\\check\\varphi)(0)$.` : `$L$ is linear and continuous, but $L\\tau_a\\ne\\tau_aL$ (difference $${v.fix(s.diff, 3)}$), so it is not a convolution operator.`;
        });
      },
    },
    {
      num: '6.34',
      kind: 'Theorem',
      name: 'Compactly supported u: u∗φ for φ ∈ C^∞, and supports add',
      statement: String.raw`Suppose $u\in\mathscr D'(\R^n)$ has compact support (so $u$ acts on $C^\infty(\R^n)$, 6.24), and $\varphi\in C^\infty(\R^n)$. Then $(u*\varphi)(x)=u(\tau_x\check\varphi)$ defines a function $u*\varphi\in C^\infty(\R^n)$ satisfying the rules (a), (b) of 6.30. If moreover $\varphi\in\mathscr D(\R^n)$, then $u*\varphi\in\mathscr D(\R^n)$ and
$$\operatorname{supp}(u*\varphi)\subset\operatorname{supp}u+\operatorname{supp}\varphi.$$`,
      idea: String.raw`Smoothness is proved as in 6.30, now using the continuity of $u$ on $C^\infty$. For the support: if $(u*\varphi)(x)\ne0$, then $y\mapsto\varphi(x-y)$ must meet $\operatorname{supp}u$ (6.23(a)), i.e. $x-y\in\operatorname{supp}\varphi$ for some $y\in\operatorname{supp}u$, so $x\in\operatorname{supp}u+\operatorname{supp}\varphi$.`,
      caption: String.raw`$u$ has compact support (red): either a dipole and a point mass, or a box and a point mass. With a test function $\varphi$ (drag $c$, set the width), the convolution (purple) vanishes outside the Minkowski sum $\operatorname{supp}u+\operatorname{supp}\varphi$ (green bands) — the readout compares the predicted and the observed support. Switch $\varphi$ to a smooth function without compact support: $u*\varphi$ is still defined and smooth.`,
      deps: ['fa-6.24', 'fa-6.30', 'fa-6.23'],
      tags: ['distributions', 'convolution', 'support'],
      verify: true,
      viz(v) {
        const M = v.M;
        const uS = v.select('$u=$', [{ value: 'pts', label: "$\\delta'_{-1.2}+0.8\\,\\delta_{0.6}$" }, { value: 'box', label: '$1_{[-1.5,-0.5]}+0.6\\,\\delta_1$' }], 'pts');
        const fS = v.select('$\\varphi$:', [{ value: 'bump', label: 'test function' }, { value: 'smooth', label: '$\\cos(2x)e^{-x^2/8}$' }], 'bump');
        const rS = v.slider('width of $\\varphi$', 0.2, 1.4, 0.6, { step: 0.01 });
        const top = v.stage({ x: [-4, 4], y: [-1.3, 1.6], height: 200, full: true, axes: true, title: '$u$ (purple, support red) and $\\varphi$ (blue)' });
        const bot = v.stage({ x: [-4, 4], y: [-2, 2], height: 230, full: true, axes: true, title: '$u*\\varphi$ and the predicted support $\\operatorname{supp}u+\\operatorname{supp}\\varphi$' });
        const hc = top.handle(0.4, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -2, 2), 0] });
        let st = {};
        v.legend([['purple', '$u$, $u*\\varphi$'], ['red', '$\\operatorname{supp}u$'], ['blue', '$\\varphi$'], ['green', '$\\operatorname{supp}u+\\operatorname{supp}\\varphi$', { area: true }]]);
        v.render(() => {
          const key = uS.value, smooth = fS.value === 'smooth', c = hc.x, r = rS.value;
          rS.el.hidden = smooth; hc.visible = !smooth;
          const f = smooth ? (x) => Math.cos(2 * x) * Math.exp(-x * x / 8) : (x) => phiD(0, x, c, r);
          const f1 = smooth ? (x) => (-2 * Math.sin(2 * x) - x / 4 * Math.cos(2 * x)) * Math.exp(-x * x / 8) : (x) => phiD(1, x, c, r);
          let conv, Su;
          if (key === 'pts') {
            dipole(top, -1.2, 1, 1, 'purple', "\\delta'_{-1.2}"); deltaArrow(top, 0.6, 0.8, 1.2, 'purple', '0.8\\,\\delta_{0.6}');
            top.dot(-1.2, 0, { color: 'red', r: 5 }); top.dot(0.6, 0, { color: 'red', r: 5 });
            conv = (x) => f1(x + 1.2) + 0.8 * f(x - 0.6);     // (δ'_a * φ)(x) = φ'(x − a), (δ_b * φ)(x) = φ(x − b)
            Su = [[-1.2, -1.2], [0.6, 0.6]];
          } else {
            top.rect(-1.5, 0, -0.5, 1, { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 2 }); deltaArrow(top, 1, 0.6, 1.2, 'purple', '0.6\\,\\delta_1');
            top.line(-1.5, 0, -0.5, 0, { color: 'red', width: 6, cap: 'butt' }); top.dot(1, 0, { color: 'red', r: 5 });
            conv = (x) => simpson((y) => f(x - y), -1.5, -0.5, 200) + 0.6 * f(x - 1);
            Su = [[-1.5, -0.5], [1, 1]];
          }
          top.fn(f, { color: 'blue', width: 2.2, fill: smooth ? false : 'blue', fillAlpha: 0.1, domain: smooth ? [-4, 4] : [c - r, c + r] });
          const xs = M.linspace(-4, 4, 801), ys = xs.map(conv);
          bot.setView(null, span(ys, 1, 0.12));
          let pred = null;
          if (!smooth) { pred = merge(Su.map(([a, b]) => [a + c - r, b + c + r])); for (const [a, b] of pred) bot.vband(a, b, { color: 'green', alpha: 0.15, edges: true }); }
          bot.path(xs.map((x, i) => [x, ys[i]]), { color: 'purple', width: 2.4 });
          // observed support
          const nz = xs.filter((x, i) => Math.abs(ys[i]) > 1e-9);
          st = { smooth, pred, lo: nz.length ? Math.min(...nz) : NaN, hi: nz.length ? Math.max(...nz) : NaN };
        });
        v.readout(() => {
          const s = st;
          if (s.smooth) return '$\\varphi$ has no compact support, but $u$ does, so $u*\\varphi(x)=u(\\varphi(x-\\cdot))$ is defined for every $x$ and is smooth.';
          return `Predicted: $\\operatorname{supp}(u*\\varphi)\\subset${s.pred.map(([a, b]) => `[${v.fix(a, 2)},${v.fix(b, 2)}]`).join('\\cup')}$. Observed: $u*\\varphi\\ne0$ only between $${v.fix(s.lo, 2)}$ and $${v.fix(s.hi, 2)}$.`;
        });
      },
    },
    {
      num: '6.35',
      kind: 'Definition',
      name: 'Convolution of two distributions',
      statement: String.raw`If $u,v\in\mathscr D'(\R^n)$ and at least one of them has compact support, the map $\varphi\mapsto u*(v*\varphi)$ is a continuous linear map of $\mathscr D(\R^n)$ into $C^\infty(\R^n)$ commuting with translations. By 6.33 there is a unique distribution $u*v$ with
$$(u*v)*\varphi=u*(v*\varphi)\qquad(\varphi\in\mathscr D(\R^n)).$$
This is the **convolution** of $u$ and $v$.`,
      idea: String.raw`If $v$ has compact support, $v*\varphi\in\mathscr D$ (6.34), so $u*(v*\varphi)$ makes sense; if $u$ has compact support, $v*\varphi\in C^\infty$ and $u$ acts on it. Translation invariance is inherited from 6.30(a), and 6.33 does the rest. For locally integrable functions it agrees with the classical convolution, and $\delta$ is the unit: $\delta*u=u$.`,
      deps: ['fa-6.33', 'fa-6.34'],
      tags: ['distributions', 'convolution'],
      verify: true,
    },
    {
      num: '6.36',
      kind: 'Theorem',
      name: 'Convolution of distributions: commutative, supports add',
      statement: String.raw`Let $u,v,w\in\mathscr D'(\R^n)$.
(a) If at least one of $u,v$ has compact support, then $u*v=v*u$.
(b) If $S_u$ and $S_v$ are the supports and one of them is compact, then $S_{u*v}\subset S_u+S_v$.
(c) If at least two of $u,v,w$ have compact support, then $(u*v)*w=u*(v*w)$.`,
      idea: String.raw`For (a) test both sides against $\varphi*\psi$ with $\varphi,\psi\in\mathscr D$ and use the commutativity of ordinary convolution together with 6.30(c); the functions $\varphi*\psi$ suffice by 6.32. (b) follows from 6.34 applied to $v*\varphi$ with $\varphi$ supported in a small ball, letting the ball shrink. (c) is checked on test functions in the same way.`,
      caption: String.raw`$u=1_{[a,a+1]}+0.6\,\delta_b$ (drag $a$ and $b$) and $v$ either a tent or $\delta'$. Bottom: $u*v$ — a smooth-cornered function, or for $v=\delta'$ the distribution $u'=\delta_a-\delta_{a+1}+0.6\,\delta'_b$ — inside the predicted support $S_u+S_v$ (green). The readout verifies commutativity numerically, $u*(v*\varphi)=v*(u*\varphi)$ for a test function $\varphi$, at many points.`,
      deps: ['fa-6.35', 'fa-6.34', 'fa-6.32'],
      tags: ['distributions', 'convolution', 'support'],
      verify: true,
      viz(v) {
        const M = v.M;
        const vS = v.select('$v=$', [{ value: 'tent', label: 'tent on $[-0.6,0.6]$' }, { value: 'dp', label: "$\\delta'$" }], 'tent');
        const top = v.stage({ x: [-4, 4], y: [-1.1, 1.8], height: 200, full: true, axes: true, title: '$u=1_{[a,a+1]}+0.6\\,\\delta_b$ (purple) and $v$ (orange)' });
        const bot = v.stage({ x: [-4, 4], y: [-1.6, 1.6], height: 220, full: true, axes: true, title: '$u*v$ and $S_u+S_v$' });
        const ha = top.handle(-2.2, 0, { color: 'purple', label: 'a', labelPos: 's', constrain: (x) => [M.clamp(x, -3.5, 1.5), 0] });
        const hb = top.handle(1.8, 0, { color: 'purple', label: 'b', labelPos: 's', constrain: (x) => [M.clamp(x, -3, 3.4), 0] });
        const W = 0.6, T = (x) => Math.max(0, 1 - Math.abs(x) / W);
        const Tint = (x) => { const t = M.clamp(x, -W, W); return t <= 0 ? (t + W) ** 2 / (2 * W) : W / 2 + t - t * t / (2 * W); };   // ∫_{−W}^{x} T
        let st = {};
        v.legend([['purple', '$u$'], ['orange', '$v$'], ['teal', '$u*v$'], ['green', '$S_u+S_v$', { area: true }]]);
        v.render(() => {
          const a = ha.x, b = hb.x, key = vS.value;
          top.rect(a, 0, a + 1, 1, { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 2 });
          deltaArrow(top, b, 0.6, 1.5, 'purple', '0.6\\,\\delta_b');
          if (key === 'tent') top.fn((x) => T(x), { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.12 });
          else dipole(top, 0, 1, 0.9, 'orange', "\\delta'");
          // u*v and the predicted support
          const Sv = key === 'tent' ? [-W, W] : [0, 0];
          const pred = merge([[a + Sv[0], a + 1 + Sv[1]], [b + Sv[0], b + Sv[1]]]);
          for (const [lo, hi] of pred) bot.vband(lo, hi, { color: 'green', alpha: 0.15, edges: true });
          if (key === 'tent') {
            const uv = (x) => Tint(x - a) - Tint(x - a - 1) + 0.6 * T(x - b);
            bot.fn(uv, { color: 'teal', width: 2.6, n: 900 });
          } else {
            deltaArrow(bot, a, 1, 1, 'teal', '\\delta_a'); deltaArrow(bot, a + 1, -1, 1, 'teal', '-\\delta_{a+1}');
            dipole(bot, b, 0.6, 1.4, 'teal', "0.6\\,\\delta'_b");
          }
          // commutativity check: u*(v*φ) vs v*(u*φ) on a grid
          const r = 0.5, ph = (x) => phiD(0, x, 0, r), ph1 = (x) => phiD(1, x, 0, r);
          const uOn = (g, G, x) => G(x - a) - G(x - a - 1) + 0.6 * g(x - b);   // (u*g)(x) for g with antiderivative G
          const phInt = (x) => simpson(ph, -r, M.clamp(x, -r, r), 80);
          let err = 0;
          for (let i = 0; i <= 40; i++) {
            const x = -4 + 8 * i / 40;
            let A, B;
            if (key === 'tent') {
              const vphi = (y) => simpson((s) => T(s) * ph(y - s), -W, W, 60);           // v*φ
              const vphiInt = (y) => simpson((s) => T(s) * phInt(y - s), -W, W, 60);
              A = uOn(vphi, vphiInt, x);                                                  // u*(v*φ)
              B = simpson((s) => T(s) * uOn(ph, phInt, x - s), -W, W, 60);               // v*(u*φ)
            } else {
              A = uOn(ph1, ph, x);                                                        // u*(φ')
              const h = 1e-4; B = (uOn(ph, phInt, x + h) - uOn(ph, phInt, x - h)) / (2 * h);   // (u*φ)'
            }
            err = Math.max(err, Math.abs(A - B));
          }
          st = { pred, err, key };
        });
        v.readout(() => {
          const s = st;
          return `$S_u+S_v = ${s.pred.map(([lo, hi]) => (Math.abs(hi - lo) < 1e-9 ? `\\{${v.fix(lo, 2)}\\}` : `[${v.fix(lo, 2)},${v.fix(hi, 2)}]`)).join('\\cup')}$. Commutativity: $\\max_x|u*(v*\\varphi)(x)-v*(u*\\varphi)(x)| = ${v.sci(s.err + 1e-300, 1)}$ over $41$ points.`;
        });
      },
    },
    {
      num: '6.37',
      kind: 'Theorem',
      name: 'Derivatives of a convolution fall on either factor',
      statement: String.raw`If $u,v\in\mathscr D'(\R^n)$ and one of them has compact support, then for every multi-index $\alpha$
$$D^\alpha(u*v)=(D^\alpha u)*v=u*(D^\alpha v).$$
In particular $D^\alpha u=(D^\alpha\delta)*u$: every linear differential operator with constant coefficients is convolution with a distribution supported at the origin.`,
      idea: String.raw`Test on $\varphi\in\mathscr D$: $(D^\alpha(u*v))*\varphi=(u*v)*D^\alpha\varphi=u*(v*D^\alpha\varphi)=u*((D^\alpha v)*\varphi)=(u*D^\alpha v)*\varphi$, using 6.30(b) twice and the definition 6.35; symmetry (6.36(a)) gives the other form.`,
      caption: String.raw`$u$ is the Heaviside function or $|x|$ (no compact support); $v$ is a box or a tent, shifted by $s$. Bottom: $u*v$ (teal) and three independent computations of its derivative — numerical differentiation of $u*v$ (thick grey), $(Du)*v$ with $DH=\delta$ or $D|x|=\operatorname{sgn}$ (blue dashed), and $u*(Dv)$ with $D1_{[0,1]}=\delta_0-\delta_1$ or the two-step derivative of the tent (red dotted). They coincide.`,
      deps: ['fa-6.35', 'fa-6.36', 'fa-6.30'],
      tags: ['distributions', 'convolution', 'derivatives'],
      verify: true,
      viz(v) {
        const M = v.M;
        const uS = v.select('$u=$', [{ value: 'H', label: '$H$' }, { value: 'abs', label: '$\\tfrac12|x|$' }], 'H');
        const vS = v.select('$v=$', [{ value: 'box', label: '$1_{[0,1]}$' }, { value: 'tent', label: 'tent' }], 'box');
        const top = v.stage({ x: [-3, 3], y: [-0.4, 1.6], height: 170, full: true, axes: true, title: '$u$ (purple) and $v$ (orange; drag $s$)' });
        const bot = v.stage({ x: [-3, 3], y: [-0.6, 1.6], height: 240, full: true, axes: true, title: '$u*v$ and $D(u*v)=(Du)*v=u*(Dv)$' });
        const hs = top.handle(-0.6, 0, { color: 'orange', label: 's', labelPos: 's', constrain: (x) => [M.clamp(x, -2, 1), 0] });
        const W = 0.6;
        let st = {};
        v.legend([['teal', '$u*v$'], ['muted', '$D(u*v)$ numerically'], ['blue', '$(Du)*v$', { dash: true }], ['red', '$u*(Dv)$', { dash: true }]]);
        v.render(() => {
          const s = hs.x, uk = uS.value, vk = vS.value;
          const u = uk === 'H' ? (x) => (x > 0 ? 1 : 0) : (x) => Math.abs(x) / 2;
          const Du = uk === 'H' ? null : (x) => Math.sign(x) / 2;           // DH = δ handled separately
          const box = vk === 'box';
          const vf = box ? (x) => (x >= s && x <= s + 1 ? 1 : 0) : (x) => Math.max(0, 1 - Math.abs(x - s - W) / W);
          const [v0, v1] = box ? [s, s + 1] : [s, s + 2 * W];
          // drawing u, v
          if (uk === 'H') { top.line(-3, 0, 0, 0, { color: 'purple', width: 2.6 }); top.line(0, 1, 3, 1, { color: 'purple', width: 2.6 }); }
          else top.fn(u, { color: 'purple', width: 2.6 });
          top.fn(vf, { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.15, n: 1200 });
          // u*v by quadrature
          // quadrature split at the kinks/jumps of the integrand (y = x, and the apex of the tent)
          const brk = (lo, hi, x) => [lo, ...[x, box ? NaN : s + W].filter((t) => t > lo && t < hi).sort((p, q) => p - q), hi];
          const pieces = (f, lo, hi, x) => { const b = brk(lo, hi, x); let acc = 0; for (let i = 0; i + 1 < b.length; i++) acc += simpson(f, b[i] + 1e-12, b[i + 1] - 1e-12, 200); return acc; };
          const conv = (g, x) => pieces((y) => g(x - y) * vf(y), v0, v1, x);
          const uv = (x) => conv(u, x);
          const xs = M.linspace(-3, 3, 241), Y = xs.map(uv);
          bot.path(xs.map((x, i) => [x, Y[i]]), { color: 'teal', width: 2.6 });
          const dnum = xs.slice(1, -1).map((x, i) => [x, (Y[i + 2] - Y[i]) / (xs[i + 2] - xs[i])]);
          bot.path(dnum, { color: 'muted', width: 6, alpha: 0.45 });
          const Duv = uk === 'H' ? vf : (x) => conv(Du, x);                   // (Du)*v
          const uDv = box ? (x) => u(x - s) - u(x - s - 1) : (x) => (pieces((y) => u(x - y), s, s + W, x) - pieces((y) => u(x - y), s + W, s + 2 * W, x)) / W;   // u*(Dv)
          bot.fn(Duv, { color: 'blue', width: 2, dash: [6, 4], n: 900 });
          bot.fn(uDv, { color: 'red', width: 2, dash: [2, 3], n: 900 });
          let e1 = 0, e2 = 0;
          dnum.forEach(([x, d]) => { if (box && (Math.abs(x - s) < 0.05 || Math.abs(x - s - 1) < 0.05)) return; e1 = Math.max(e1, Math.abs(d - Duv(x))); e2 = Math.max(e2, Math.abs(Duv(x) - uDv(x))); });
          st = { e1, e2 };
        });
        v.readout(() => {
          const s = st;
          const sz = (e) => (e < 1e-14 ? '0' : v.sci(e, 1));
          return `$\\max|(Du)*v-u*(Dv)| = ${sz(s.e2)}$; numerical derivative of $u*v$ vs. $(Du)*v$: $${sz(s.e1)}$ (away from the jumps of $v$).`;
        });
      },
    },
  ],
};
