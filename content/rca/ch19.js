// Rudin, Real and Complex Analysis — Chapter 19: Holomorphic Fourier Transforms
//
// Numbering: 19.2 (half-plane), 19.3 (exponential type) and 19.11 (Denjoy–Carleman) are Rudin's.
// The introductory 19.1 is presented here as a Definition (it is an unnumbered-style introduction
// in the book), so it carries `verify: true`. The quasi-analytic material is in ch19-a2.js.

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;

/** A small "×" marking a singular point, with a halo so it reads on top of a phase portrait. */
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}

/**
 * Fourier density of samples f(x_k) = re[k] + i im[k] on an equispaced grid xs ⊂ [-L, L]:
 *   F(t) ≈ (1/2π) ∫ f(x) e^{-itx} (1 - |x|/L) dx   (Fejér-tapered truncation of the inversion integral),
 * so that f(x) = ∫ F(t) e^{itx} dt. Returns [Re F(t_j)], [Im F(t_j)].
 */
function densityFromSamples(xs, re, im, ts, L) {
  const n = xs.length, dx = xs[1] - xs[0];
  const wr = new Float64Array(n), wi = new Float64Array(n);
  for (let k = 0; k < n; k++) { const w = Math.max(0, 1 - Math.abs(xs[k]) / L); wr[k] = re[k] * w; wi[k] = im[k] * w; }
  const outRe = new Float64Array(ts.length), outIm = new Float64Array(ts.length);
  for (let j = 0; j < ts.length; j++) {
    const t = ts[j];
    let cr = Math.cos(t * xs[0]), ci = -Math.sin(t * xs[0]);
    const sr = Math.cos(t * dx), si = -Math.sin(t * dx);
    let ar = 0, ai = 0;
    for (let k = 0; k < n; k++) {
      ar += wr[k] * cr - wi[k] * ci; ai += wr[k] * ci + wi[k] * cr;
      const nr = cr * sr - ci * si; ci = cr * si + ci * sr; cr = nr;
    }
    outRe[j] = ar * dx / TAU; outIm[j] = ai * dx / TAU;
  }
  return [outRe, outIm];
}

/** ∫_R |g(x)|² dx for g(x) = f(x, y) via x = tan θ (no truncation for 1/x-decaying slices); midpoint rule. */
function sliceNorm2(f, y, n = 8000) {
  let s = 0; const h = Math.PI / n;
  for (let k = 0; k < n; k++) {
    const th = -Math.PI / 2 + (k + 0.5) * h, c = Math.cos(th);
    const [re, im] = f(Math.tan(th), y);
    s += (re * re + im * im) / (c * c);
  }
  return s * h;
}

export default {
  collection: 'rca',
  chapter: 19,
  title: 'Holomorphic Fourier Transforms',
  summary: String.raw`When a function $F$ on the line vanishes outside an interval or a half-line, its Fourier integral $\int F(t)e^{itz}\,dt$ makes sense for complex $z$ and is holomorphic. Two theorems of Paley and Wiener reverse this: square-integrable functions on a half-line correspond exactly to holomorphic functions in a half-plane with bounded $L^2$ norms on horizontal lines, and square-integrable functions on $[-A,A]$ to entire functions of exponential type $A$ that are square-integrable on $\R$. The chapter then asks when a $C^\infty$ function is determined by its derivatives at a single point, and answers with the Denjoy–Carleman theorem: under log-convexity, the class $C\{M_n\}$ is quasi-analytic exactly when $\sum M_n^{-1/n}$ diverges — a real-variable statement proved with these holomorphic Fourier transforms.`,
  items: [
    // ------------------------------------------------------------------ introduction
    {
      num: '19.1',
      kind: 'Definition',
      name: 'Holomorphic Fourier transforms; exponential type',
      verify: true,
      statement: String.raw`For a function $F$ on $\R$ put
$$f(z)=\int_{-\infty}^{\infty}F(t)\,e^{itz}\,dt\qquad(z=x+iy)$$
at every $z$ where the integral converges absolutely. On the real axis this is the Fourier transform of Chapter 9 in disguise, $f(x)=\sqrt{2\pi}\,\hat F(-x)$. Because $|e^{itz}|=e^{-ty}$, the support of $F$ decides where $f$ is defined:
(a) if $F\in L^1$ vanishes outside $[-A,A]$, then $f$ is entire and $|f(z)|\le\|F\|_1\,e^{A|y|}$ for all $z$;
(b) if $F\in L^2(0,\infty)$, i.e. $F=0$ on $(-\infty,0)$, then $f$ is holomorphic in the upper half-plane $\Pi^+=\{z:\Im z>0\}$.

An entire function $f$ is of **exponential type** if there are constants $A,C$ with $|f(z)|\le C\,e^{A|z|}$ for all $z\in\C$; it is of exponential type *at most* $A$ if this holds with that $A$. By (a), the transform of a function supported in $[-A,A]$ is of exponential type at most $A$.`,
      idea: String.raw`The kernel has modulus $|e^{itz}|=e^{-ty}$, so the integral converges absolutely exactly where $|F(t)|e^{-ty}$ is integrable, and there $f$ is holomorphic (differentiate under the integral sign, or combine Fubini with Morera's theorem). A compactly supported $F$ never meets weights larger than $e^{A|y|}$, which is the growth bound in (a); on a half-line $(0,\infty)$ the weight $e^{-ty}$ is a help only when $y>0$, and Cauchy–Schwarz handles $F\in L^2$. Theorems 19.2 and 19.3 are the converses: they recover $F$, and its support, from the growth of $f$.`,
      caption: String.raw`Pick $F$ and drag $z$ over the phase portrait of $f$ (hue = $\arg f$). The right panel shows $|F(t)|$ and the size of the integrand $|F(t)e^{itz}|=|F(t)|e^{-ty}$ at the current height $y=\Im z$; its area bounds $|f(z)|$. For compactly supported $F$ that area never exceeds $\|F\|_1e^{A|y|}$. For $F$ on a half-line it is finite only above a horizontal line, even though $f$ itself continues further. The Gaussian gives an entire $f$ that grows like $e^{y^2/2}$ — faster than any exponential type allows.`,
      deps: ['rca-9.1', 'rca-10.2'],
      see: ['fa-7.22'],
      tags: ['Fourier transform', 'entire functions'],
      viz(v) {
        const { Cx } = v.M;
        const SQ = Math.sqrt(TAU);
        const EX = {
          box: {
            label: String.raw`$F=\chi_{[-1,1]}$`, A: 1, L1: 2, kind: 'compact', tex: String.raw`f(z)=\frac{2\sin z}{z}`,
            F: (t) => (Math.abs(t) <= 1 ? 1 : 0),
            f: (z) => (z.abs() < 1e-7 ? new Cx(2, 0) : z.sin().scale(2).div(z)),
            W: (y) => v.M.integrate((t) => Math.exp(-t * y), -1, 1, 400),
          },
          tent: {
            label: String.raw`$F=(1-|t|)^+$`, A: 1, L1: 1, kind: 'compact', tex: String.raw`f(z)=\Big(\frac{\sin (z/2)}{z/2}\Big)^{2}`,
            F: (t) => Math.max(0, 1 - Math.abs(t)),
            f: (z) => { if (z.abs() < 1e-5) return new Cx(1, 0); const s = z.scale(0.5).sin().div(z.scale(0.5)); return s.mul(s); },
            W: (y) => v.M.integrate((t) => (1 + t) * Math.exp(-t * y), -1, 0, 300) + v.M.integrate((t) => (1 - t) * Math.exp(-t * y), 0, 1, 300),
          },
          half: {
            label: String.raw`$F=e^{-t}$ on $(0,\infty)$`, kind: 'half', tex: String.raw`f(z)=\frac{1}{1-iz}`,
            F: (t) => (t >= 0 ? Math.exp(-t) : 0),
            f: (z) => new Cx(1, 0).div(new Cx(1 + z.im, -z.re)),
            W: (y) => (y <= -1 ? Infinity : v.M.integrate((t) => Math.exp(-t * (1 + y)), 0, 60 / (1 + y), 3000)),
          },
          gauss: {
            label: String.raw`$F=e^{-t^2/2}$`, kind: 'gauss', tex: String.raw`f(z)=\sqrt{2\pi}\,e^{-z^2/2}`,
            F: (t) => Math.exp(-t * t / 2),
            f: (z) => z.mul(z).scale(-0.5).exp().scale(SQ),
            W: (y) => v.M.integrate((t) => Math.exp(-t * t / 2 - t * y), -y - 12, -y + 12, 800),
          },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'box');
        const L = v.stage({ x: [-6, 6], y: [-3.2, 3.2], equal: true, height: 330, title: 'phase portrait of $f$' });
        const R = v.stage({ x: [-4, 5], y: [-0.1, 2], height: 330, axes: 'box', xlabel: 't', title: String.raw`size of the integrand: $|F(t)|\,e^{-ty}$, $\;y=\Im z$` });
        const z = L.handle(1.6, 1.1, { color: 'ink', label: 'z' });
        let st = null;
        v.render(() => {
          const E = EX[which.value];
          L.setTitle(`phase portrait of $${E.tex}$`);
          L.domain(E.f, { key: which.value, res: 2 });
          const [x0, x1] = L.bounds.x, [y0, y1] = L.bounds.y;
          if (E.kind === 'half') {
            L.rect(x0, y0, x1, -1, { fill: 'panel', fillAlpha: 0.62, stroke: false });
            L.hline(-1, { color: 'red', width: 1.8, dash: [6, 4] });
            L.text('∫ diverges for Im z ≤ −1', x0, -1, { dx: 8, dy: 14, color: 'red', size: 12, weight: 600 });
            xMark(L, 0, -1, 'ink');
            L.text('pole −i', 0, -1, { dx: 9, dy: 13, size: 11.5, color: 'ink' });
          }
          L.axes();
          L.line(x0, z.y, x1, z.y, { color: 'panel', width: 3.4, alpha: 0.75 });
          L.line(x0, z.y, x1, z.y, { color: 'gold', width: 1.6, dash: [5, 4] });
          // right panel: |F| and the weighted integrand
          const y = z.y, W = E.W(y);
          const div = !isFinite(W);
          const ts = v.M.linspace(-4, 5, 600);
          const g = (t) => Math.abs(E.F(t)) * Math.exp(-t * y);
          let m = 1.05;
          for (const t of ts) { const val = g(t); if (isFinite(val)) m = Math.max(m, val); }
          if (div) m = Math.max(m, 4);
          R.setView(null, [-0.06 * m, 1.15 * m]);
          if (E.kind === 'compact') {
            R.vband(-E.A, E.A, { color: 'orange', alpha: 0.08, edges: true });
            R.fn((t) => Math.abs(E.F(t)) * Math.exp(E.A * Math.abs(y)), { color: 'orange', width: 1.6, dash: [2, 3], n: 900 });
          }
          R.fn(g, { color: div ? 'red' : 'gold', width: 2.4, fill: div ? 'red' : 'gold', fillAlpha: div ? 0.2 : 0.3, n: 900 });
          R.fn((t) => Math.abs(E.F(t)), { color: 'muted', width: 1.6, dash: [5, 4], n: 900 });
          if (E.kind === 'compact') { R.tex('-A', -E.A, 0, { color: 'orange', baseline: 'bottom', align: 'right', dx: -5, dy: -3 }); R.tex('A', E.A, 0, { color: 'orange', baseline: 'bottom', align: 'left', dx: 5, dy: -3 }); }
          const fz = E.f(new Cx(z.x, z.y)).abs();
          R.tex(div ? String.raw`\int|F(t)|e^{-ty}\,dt=\infty` : String.raw`\int|F(t)|e^{-ty}\,dt=${v.fix(W, 3)}`, R.bounds.x[1], R.bounds.y[1], { align: 'right', baseline: 'top', dx: -10, dy: 8, color: div ? 'red' : 'gold', size: 14 });
          const lg = [['muted', '$|F(t)|$', { dash: true }], [div ? 'red' : 'gold', div ? 'integrand not integrable' : String.raw`$|F(t)|e^{-ty}$ (area $\ge|f(z)|$)`, { area: true }]];
          if (E.kind === 'compact') lg.push(['orange', String.raw`$|F(t)|e^{A|y|}$ (area $=\|F\|_1e^{A|y|}$)`, { dash: [2, 3] }]);
          v.legend(lg);
          st = { E, y, W, fz, div };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const { E, y, W, fz } = s;
          if (E.kind === 'compact') {
            const bound = E.L1 * Math.exp(E.A * Math.abs(y));
            return String.raw`$|f(z)|=${v.fix(fz, 3)}\;\le\;\int|F(t)|e^{-ty}\,dt=${v.fix(W, 3)}\;\le\;\|F\|_1e^{A|y|}=${v.fix(bound, 3)}$ — $F$ is supported in $[-1,1]$, so $f$ is entire of exponential type $1$.`;
          }
          if (E.kind === 'half') {
            if (s.div) return String.raw`$y=${v.fix(y, 2)}\le-1$: $\int_0^\infty e^{-t(1+y)}\,dt=\infty$, the integral diverges here — yet $\frac{1}{1-iz}$ continues holomorphically to all of $\C$ except the pole $-i$.`;
            return String.raw`$|f(z)|=${v.fix(fz, 3)}\;\le\;\int_0^\infty e^{-t}e^{-ty}\,dt=\frac{1}{1+y}=${v.fix(W, 3)}$ — finite because $y>-1$; in particular $f\in H(\Pi^+)$.`;
          }
          return String.raw`$|f(z)|=${v.fix(fz, 3)}\;\le\;\int e^{-t^2/2-ty}\,dt=\sqrt{2\pi}\,e^{y^2/2}=${v.fix(W, 3)}$ — entire, but $|f(iy)|=\sqrt{2\pi}e^{y^2/2}$ beats every $Ce^{A|y|}$: not of exponential type.`;
        });
      },
    },
    // ------------------------------------------------------------------ two theorems of Paley and Wiener
    {
      num: '19.2',
      kind: 'Theorem',
      name: 'Paley–Wiener theorem for the upper half-plane',
      statement: String.raw`Let $\Pi^+=\{x+iy:y>0\}$ and let $f\in H(\Pi^+)$ have uniformly bounded $L^2$ norms on horizontal lines:
$$\sup_{0<y<\infty}\int_{-\infty}^{\infty}|f(x+iy)|^2\,dx=C<\infty .$$
Then there is an $F\in L^2(0,\infty)$ such that
$$f(z)=\int_0^\infty F(t)\,e^{itz}\,dt\qquad(z\in\Pi^+),$$
and $2\pi\int_0^\infty|F(t)|^2\,dt=C$.

Conversely, every $F\in L^2(0,\infty)$ defines in this way a function $f\in H(\Pi^+)$, and $\int|f(x+iy)|^2dx=2\pi\int_0^\infty|F(t)|^2e^{-2ty}\,dt$, a decreasing function of $y$ bounded by $2\pi\|F\|_2^2$.`,
      idea: String.raw`Fix $y>0$ and let $F_y$ be the Plancherel transform (9.13) of the slice $f_y(x)=f(x+iy)$, normalised so that $f_y(x)=\int F_y(t)e^{itx}\,dt$. Integrating $f(z)e^{-itz}$ around long rectangles between two horizontal lines — Cauchy's theorem, with the vertical sides negligible on average thanks to the $L^2$ bound — shows that $e^{ty}F_y(t)=F(t)$ is independent of $y$. Plancherel then gives $2\pi\int|F(t)|^2e^{-2ty}\,dt=\|f_y\|_2^2\le C$ for every $y>0$. Letting $y\to\infty$ forces $F=0$ a.e. on $(-\infty,0)$, where $e^{-2ty}$ explodes; letting $y\to0$ gives the norm identity. The converse is Plancherel plus 19.1(b).`,
      caption: String.raw`Choose $f$ and drag the gold dot along the bottom curve, which plots $\|f_y\|_2^2=\int|f(x+iy)|^2dx$ against $y$ (dots: direct quadrature in $x$; line: $2\pi\int|F|^2e^{-2ty}dt$). Top left: the slice $|f(x+iy)|^2$ at that height (faint: other heights). Top right: the spectrum of the slice, computed numerically from $f$ on the line, matches $e^{-ty}F(t)$ for one fixed $F$, which vanishes for $t<0$. The last example is holomorphic in $\Pi^+$ but its slices blow up: its $F$ lives on $(-1,\infty)$, and $e^{-ty}$ inflates the part on $t<0$.`,
      deps: ['rca-19.1', 'rca-9.13', 'rca-10.14'],
      tags: ['Paley–Wiener', 'Hardy spaces', 'Fourier transform'],
      viz(v) {
        // slices f(x+iy) as [re, im]; F on (0,∞) (or (-1,∞) for the counterexample)
        const EX = {
          exp: {
            label: String.raw`$F=e^{-t}$`, ftex: String.raw`f(z)=\frac{1}{1-iz}`, supp: [0, 40],
            F: (t) => (t >= 0 ? Math.exp(-t) : 0),
            f: (x, y) => { const a = 1 + y, q = a * a + x * x; return [a / q, x / q]; },
          },
          gap: {
            label: String.raw`$F=\chi_{[1,3]}$`, ftex: String.raw`f(z)=\frac{e^{3iz}-e^{iz}}{iz}`, supp: [1, 3],
            F: (t) => (t >= 1 && t <= 3 ? 1 : 0),
            f: (x, y) => {
              if (x * x + y * y < 1e-14) return [2, 0];
              const e3 = Math.exp(-3 * y), e1 = Math.exp(-y);
              const nr = e3 * Math.cos(3 * x) - e1 * Math.cos(x), ni = e3 * Math.sin(3 * x) - e1 * Math.sin(x);
              const cr = -y, ci = x, q = cr * cr + ci * ci; // divide by iz = -y + ix
              return [(nr * cr + ni * ci) / q, (ni * cr - nr * ci) / q];
            },
          },
          gam: {
            label: String.raw`$F=te^{-t}$`, ftex: String.raw`f(z)=\frac{1}{(1-iz)^2}`, supp: [0, 50],
            F: (t) => (t >= 0 ? t * Math.exp(-t) : 0),
            f: (x, y) => { const a = 1 + y, q = a * a + x * x, r = a / q, i = x / q; return [r * r - i * i, 2 * r * i]; },
          },
          shift: {
            label: String.raw`$\frac{e^{-iz}}{1-iz}$ (unbounded slices)`, ftex: String.raw`f(z)=\frac{e^{-iz}}{1-iz}`, supp: [-1, 40], bad: true,
            F: (t) => (t >= -1 ? Math.exp(-(t + 1)) : 0),
            f: (x, y) => { const a = 1 + y, q = a * a + x * x, r = a / q, i = x / q, e = Math.exp(y), c = e * Math.cos(x), s = -e * Math.sin(x); return [r * c - i * s, r * s + i * c]; },
          },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const SL = v.stage({ x: [-8, 8], y: [-0.05, 1.2], height: 260, axes: 'box', xlabel: 'x', title: String.raw`slice $x\mapsto|f(x+iy)|^2$` });
        const SP = v.stage({ x: [-2.2, 4.2], y: [-0.1, 1.2], height: 260, axes: 'box', xlabel: 't', title: String.raw`spectrum of the slice: $f(x+iy)=\int F_y(t)\,e^{itx}\,dt$` });
        const NB = v.stage({ x: [0, 3.05], y: [0, 3.6], height: 190, full: true, axes: 'box', xlabel: 'y', title: String.raw`$\|f_y\|_2^2=\int|f(x+iy)|^2\,dx$ as a function of the height $y$ — drag the dot` });
        const normF = (E, y) => TAU * v.M.integrate((t) => E.F(t) ** 2 * Math.exp(-2 * t * y), E.supp[0], E.supp[1], 2000);
        const P = NB.handle(0.35, 1, { color: 'gold', constrain: (x) => { const yy = v.M.clamp(x, 0.03, 3); return [yy, normF(EX[which.value], yy)]; } });
        const L = 150, DX = 0.06;
        const xs = v.M.linspace(-L, L, Math.round(2 * L / DX) + 1);
        const ts = v.M.linspace(-2.2, 4.2, 257);
        let cacheKey = null, curve = null, dots = null, spec = null, specKey = null, st = null;
        v.legend([['gold', 'numerical, from the slice', { area: true }], ['blue', '$e^{-ty}F(t)$', { dash: true }], ['muted', '$F(t)$', { dash: [2, 3] }]]);
        v.render(() => {
          const E = EX[which.value];
          if (cacheKey !== which.value) {
            cacheKey = which.value;
            curve = v.M.linspace(0.005, 3.05, 160).map((y) => [y, normF(E, y)]);
            dots = v.M.linspace(0.05, 3, 24).map((y) => [y, sliceNorm2(E.f, y)]);
            const top = Math.max(...curve.map((p) => p[1]));
            NB.setView(null, [-0.13 * top, top * 1.12]);
            NB.setTicks(null, null);
          }
          const y = v.M.clamp(P.x, 0.03, 3); P.y = normF(E, y);
          // ---- bottom: norm curve
          const C = normF(E, 0);
          if (!E.bad) { NB.hline(C, { color: 'green', width: 1.6, dash: [6, 4] }); NB.text(`sup = 2π‖F‖² = ${v.fmt(C, 4)}`, 3, C, { align: 'right', dy: -10, color: 'green', size: 12, weight: 600 }); }
          NB.path(curve, { color: E.bad ? 'red' : 'blue', width: 2.2 });
          NB.dots(dots, { r: 3.2, color: 'ink' });
          NB.vline(y, { color: 'gold', width: 1.2, dash: [3, 4] });
          if (E.bad) NB.corner('sup over y = ∞ — hypothesis fails', 'tl', { color: 'red', weight: 600 });
          // ---- top left: slices
          const prof = (yy) => (x) => { const [a, b] = E.f(x, yy); return a * a + b * b; };
          let m = 0; for (let x = -8; x <= 8; x += 0.02) m = Math.max(m, prof(y)(x), prof(0.05)(x));
          SL.setView(null, [-0.04 * m, 1.14 * m]);
          for (const yy of [0.05, 0.3, 0.8, 1.6, 2.8]) SL.fn(prof(yy), { color: 'muted', width: 1, alpha: 0.55, n: 700 });
          SL.fn(prof(y), { color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.28, n: 900 });
          SL.corner(`y = ${v.fix(y, 2)}`, 'tr', { color: 'gold', weight: 600 });
          SL.setTitle(String.raw`slice $x\mapsto|f(x+iy)|^2$ for $${E.ftex}$`);
          // ---- top right: spectrum of the slice
          const sk = `${which.value}|${y.toFixed(4)}`;
          if (specKey !== sk) {
            specKey = sk;
            const re = new Float64Array(xs.length), im = new Float64Array(xs.length);
            for (let k = 0; k < xs.length; k++) { const [a, b] = E.f(xs[k], y); re[k] = a; im[k] = b; }
            spec = densityFromSamples(xs, re, im, ts, L)[0];
          }
          const pred = (t) => E.F(t) * Math.exp(-t * y);
          let ms = 0.2; for (let j = 0; j < ts.length; j++) ms = Math.max(ms, spec[j], pred(ts[j]), E.F(ts[j]));
          SP.setView(null, [-0.08 * ms, 1.14 * ms]);
          SP.vband(-2.2, 0, { color: 'red', alpha: 0.07 });
          SP.text('t < 0', -1.1, SP.bounds.y[1], { dy: 12, align: 'center', color: 'red', size: 12, weight: 600 });
          SP.path(Array.from(ts, (t, j) => [t, spec[j]]), { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.22 });
          SP.fn(pred, { color: 'blue', width: 2, dash: [6, 4], n: 1200 });
          SP.fn(E.F, { color: 'muted', width: 1.4, dash: [2, 3], n: 1200 });
          const nq = sliceNorm2(E.f, y, 20000);
          let neg = 0; for (let j = 0; j < ts.length; j++) if (ts[j] <= -0.2) neg = Math.max(neg, Math.abs(spec[j]));
          st = { E, y, nq, nf: P.y, C, neg };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = String.raw`$y=${v.fix(s.y, 2)}$: $\int|f(x+iy)|^2dx=${v.fix(s.nq, 4)}$ (quadrature) $=2\pi\int|F(t)|^2e^{-2ty}dt=${v.fix(s.nf, 4)}$. `;
          if (s.E.bad) return head + String.raw`The norms grow like $\pi e^{2y}/(1+y)$, so the supremum is infinite; correspondingly $F=e^{-(t+1)}$ is **not** $0$ on $(-1,0)$ (numerically $\max_{t\le-0.2}|F_y(t)|=${v.fix(s.neg, 3)}$).`;
          return head + String.raw`$\sup_{y>0}=2\pi\|F\|_2^2=${v.fix(s.C, 4)}$, attained as $y\to0$; and $F=0$ on $(-\infty,0)$ (numerically $\max_{t\le-0.2}|F_y(t)|=${v.sci(s.neg, 2)}$, the slice spectrum is $0$ there).`;
        });
      },
    },
    {
      num: '19.3',
      kind: 'Theorem',
      name: 'Paley–Wiener theorem for entire functions of exponential type',
      statement: String.raw`Let $A$ and $C$ be positive constants and let $f$ be an entire function such that
$$|f(z)|\le C\,e^{A|z|}\quad(z\in\C)\qquad\text{and}\qquad\int_{-\infty}^{\infty}|f(x)|^2\,dx<\infty .$$
Then there exists $F\in L^2(-A,A)$ with
$$f(z)=\int_{-A}^{A}F(t)\,e^{itz}\,dt\qquad\text{for every }z\in\C .$$
The converse is the easy half: by 19.1(a) and Plancherel, every such integral is an entire function of exponential type at most $A$ that is square-integrable on $\R$.`,
      idea: String.raw`First improve the growth bound from $e^{A|z|}$ to $e^{A|\Im z|}$. Averaging $f$ over short real intervals produces entire functions of the same type that are bounded on $\R$ (Cauchy–Schwarz), and the Phragmén–Lindelöf method applied in each quadrant shows $|f(x+iy)|\le\|f\|_\infty e^{A|y|}$. Then $e^{iAz}f(z)$ is bounded in the upper half-plane; after a mild damping factor its horizontal slices have bounded $L^2$ norms, so 19.2 writes it as $\int_0^\infty G(s)e^{isz}\,ds$, and undoing the shift $s=t+A$ shows that the density of $f$ vanishes on $(-\infty,-A)$. The same argument in the lower half-plane, with $e^{-iAz}f(z)$, kills it on $(A,\infty)$.`,
      caption: String.raw`Choose $f$, its true type $a$ (the density of $f$ lives on $[-a,a]$), and the exponent $A$ you are testing. Left: contour bands of $\log|f(z)|-A|\Im z|-\log\|f\|_{L^\infty(\R)}$ — blue where $|f(x+iy)|\le\|f\|_\infty e^{A|y|}$, red where that bound fails (drag $z$ to probe). Right: the density recovered numerically from the values of $f$ on the real axis (gold; exact density dashed) against the window $[-A,A]$. Bottom: $\log\max_x|f(x+iy)|$ against the line $\log\|f\|_\infty+A|y|$. With $A\ge a$ everything stays inside; push $A$ below $a$ and both the growth bound and the support fail together. The Gaussian is entire and square-integrable on $\R$ but of order 2: it fails for every $A$.`,
      deps: ['rca-19.2', 'rca-19.1', 'rca-12.9', 'rca-9.13'],
      see: ['fa-7.22', 'fa-7.23'],
      tags: ['Paley–Wiener', 'entire functions', 'Fourier transform'],
      viz(v) {
        const { Cx } = v.M;
        const EX = {
          box: {
            label: String.raw`$\frac{\sin az}{z}$`, tex: String.raw`\tfrac{\sin az}{z}`,
            f: (z, a) => (z.abs() < 1e-7 ? new Cx(a, 0) : z.scale(a).sin().div(z)),
            F: (t, a) => (Math.abs(t) <= a ? 0.5 : 0), sup: (a) => a,
          },
          tent: {
            label: String.raw`$\frac{\sin^2(az/2)}{z^2}$`, tex: String.raw`\tfrac{\sin^2(az/2)}{z^2}`,
            f: (z, a) => { if (z.abs() < 1e-5) return new Cx(a * a / 4, 0); const s = z.scale(a / 2).sin().div(z); return s.mul(s); },
            F: (t, a) => Math.max(0, a - Math.abs(t)) / 4, sup: (a) => a * a / 4,
          },
          cos: {
            label: String.raw`$\frac{\cos az}{b^2-z^2}$`, tex: String.raw`\tfrac{2b\cos az}{b^2-z^2},\ b=\tfrac{\pi}{2a}`,
            f: (z, a) => {
              const b = Math.PI / (2 * a);
              if (Math.hypot(z.re - b, z.im) < 1e-6 || Math.hypot(z.re + b, z.im) < 1e-6) return new Cx(a, 0);
              return z.scale(a).cos().scale(2 * b).div(new Cx(b * b, 0).sub(z.mul(z)));
            },
            F: (t, a) => (Math.abs(t) <= a ? Math.cos(Math.PI * t / (2 * a)) : 0), sup: (a) => 4 * a / Math.PI,
          },
          gauss: {
            label: String.raw`$e^{-z^2/2}$ (order 2)`, tex: String.raw`e^{-z^2/2}`, bad: true,
            f: (z) => z.mul(z).scale(-0.5).exp(),
            F: (t) => Math.exp(-t * t / 2) / Math.sqrt(TAU), sup: () => 1,
          },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'box');
        const aSl = v.slider('true type $a$ of $f$', 0.5, 2.5, 1.2, { step: 0.05 });
        const ASl = v.slider('tested exponent $A$', 0.3, 2.5, 1.2, { step: 0.05 });
        const H = v.stage({ x: [-6, 6], y: [-4, 4], equal: true, height: 320, title: String.raw`$\log|f(z)|-A|\Im z|-\log\|f\|_{\infty}$` });
        const R = v.stage({ x: [-3.6, 3.6], y: [-0.1, 0.7], height: 320, axes: 'box', xlabel: 't', title: String.raw`density $F$ recovered from $f|_{\R}$` });
        const B = v.stage({ x: [-4, 4], y: [-3, 6], height: 170, full: true, axes: 'box', xlabel: 'y', title: String.raw`growth on horizontal lines: $\log\max_x|f(x+iy)|$ against $\log\|f\|_\infty+A|y|$` });
        const z = H.handle(1.4, 1.6, { color: 'ink', label: 'z' });
        const L = 600, DX = 0.05;
        const xs = v.M.linspace(-L, L, Math.round(2 * L / DX) + 1);
        const ts = v.M.linspace(-3.6, 3.6, 289);
        const YS = v.M.linspace(-4, 4, 81);
        let key = null, dens = null, grow = null, st = null;
        v.legend([['gold', 'numerical density', { area: true }], ['blue', 'exact density', { dash: true }], ['green', 'window $[-A,A]$', { area: true }], ['red', 'outside the window / above the bound', { area: true }]]);
        v.render(() => {
          const E = EX[which.value], a = aSl.value, A = ASl.value;
          aSl.el.hidden = !!E.bad;
          const lsup = Math.log(E.sup(a));
          const k = `${which.value}|${a}`;
          if (k !== key) {
            key = k;
            const re = new Float64Array(xs.length), im = new Float64Array(xs.length);
            for (let j = 0; j < xs.length; j++) { const w = E.f(new Cx(xs[j], 0), a); re[j] = w.re; im[j] = w.im; }
            dens = densityFromSamples(xs, re, im, ts, L)[0];
            grow = YS.map((y) => { let m = -Infinity; for (let x = -24; x <= 24; x += 0.06) m = Math.max(m, Math.log(E.f(new Cx(x, y), a).abs())); return m; });
          }
          // banded heat map (bands of width 1/2 act as contour lines)
          H.heat((x, y) => {
            const h = Math.log(E.f(new Cx(x, y), a).abs()) - A * Math.abs(y) - lsup;
            if (!isFinite(h)) return -3.75;
            return Math.max(-3.75, Math.min(3.75, (Math.floor(h * 2) + 0.5) / 2));
          }, { range: [-4, 4], cmap: 'diverging', key: `${k}|${A}`, res: 2 });
          H.axes();
          H.setTitle(String.raw`$\log|f(z)|-A|\Im z|-\log\|f\|_{\infty}$ for $f(z)=${E.tex}$`);
          // density panel
          let top = 0.3; for (let j = 0; j < ts.length; j++) top = Math.max(top, dens[j], E.F(ts[j], a));
          R.setView(null, [-0.1 * top, 1.18 * top]);
          R.vband(-A, A, { color: 'green', alpha: 0.1, edges: true });
          const pts = Array.from(ts, (t, j) => [t, dens[j]]);
          R.path(pts, { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.22 });
          let out = 0, tot = 0;
          for (let j = 1; j < ts.length; j++) { const w = (ts[j] - ts[j - 1]) * dens[j] ** 2; tot += w; if (Math.abs(ts[j]) > A) out += w; }
          for (const side of [-1, 1]) {
            const seg = pts.filter(([t]) => side * t >= A);
            if (seg.length > 1) R.path(seg.concat([[seg[seg.length - 1][0], 0], [seg[0][0], 0]]), { fill: 'red', fillAlpha: 0.35, stroke: false, close: true });
          }
          R.fn((t) => E.F(t, a), { color: 'blue', width: 1.8, dash: [6, 4], n: 1400 });
          if (A < 3.5) {
            R.tex('-A', -A, R.bounds.y[1], { color: 'green', baseline: 'top', dy: 4, align: 'right', dx: -4 });
            R.tex('A', A, R.bounds.y[1], { color: 'green', baseline: 'top', dy: 4, align: 'left', dx: 4 });
          }
          // growth panel
          const line = (y) => lsup + A * Math.abs(y);
          const g = (y) => grow[v.M.clamp(Math.round((y + 4) * 10), 0, 80)];
          const gmin = Math.min(...grow), gmax = Math.max(Math.min(Math.max(...grow), 14), line(4));
          B.setView(null, [Math.max(gmin, -6) - 0.6, gmax + 0.8]);
          B.between((y) => Math.max(g(y), line(y)), line, -4, 4, { fill: 'red', fillAlpha: 0.28, n: 160 });
          B.fn(line, { color: 'green', width: 2, dash: [6, 4] });
          B.path(YS.map((y, i) => [y, grow[i]]), { color: 'accent', width: 2.4 });
          const fails = YS.some((y, i) => grow[i] > line(y) + 1e-6);
          B.tex(fails ? String.raw`\max_x|f(x+iy)|>\|f\|_\infty e^{A|y|}\ \text{somewhere: the bound fails for }A=${v.fix(A, 2)}` : String.raw`\max_x|f(x+iy)|\le\|f\|_\infty e^{A|y|}\ \text{on every line}`, B.bounds.x[0], B.bounds.y[1], { align: 'left', baseline: 'top', dx: 30, dy: 6, color: fails ? 'red' : 'green', size: 14 });
          B.vline(z.y, { color: 'ink', width: 1, dash: [3, 4] });
          const hz = Math.log(E.f(new Cx(z.x, z.y), a).abs()) - A * Math.abs(z.y) - lsup;
          st = { E, a, A, hz, frac: tot > 0 ? out / tot : 0, fails };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const hz = isFinite(s.hz) ? v.fix(s.hz, 3) : String.raw`-\infty`;
          const pct = v.fix(100 * s.frac, 2);
          const head = String.raw`At $z$: $\log|f(z)|-A|y|-\log\|f\|_\infty=${hz}$. `;
          if (s.E.bad) return head + String.raw`The Gaussian is in $L^2(\R)$ but $\max_x|f(x+iy)|=e^{y^2/2}$, so no bound $Ce^{A|z|}$ holds; its density $e^{-t^2/2}/\sqrt{2\pi}$ has ${pct} percent of its $L^2$ mass outside $[-A,A]$.`;
          if (s.A + 1e-9 < s.a) return head + String.raw`Here $A<a$: $f$ has exponential type $a$, not $A$, so the bound fails at large $|y|$ and ${pct} percent of $\int|F|^2$ lies outside $[-A,A]$.`;
          return head + String.raw`With $A\ge a$ the bound $|f(x+iy)|\le\|f\|_\infty e^{A|y|}$ holds and the density lives in $[-a,a]\subset[-A,A]$ (numerically ${pct} percent of $\int|F|^2$ falls outside, from truncating the inversion integral).`;
        });
      },
    },
  ],
};
