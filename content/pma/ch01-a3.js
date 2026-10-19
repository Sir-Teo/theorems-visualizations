// Rudin, Principles of Mathematical Analysis — Chapter 1 (part 3): the complex field

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
/** "(a, b)" in TeX for a complex number given as {re, im}. */
const pair = (z, d = 2) => `(${fx(z.re, d)},\\,${fx(z.im, d)})`;
/** Keep a handle inside the annulus rmin ≤ |p| ≤ rmax. */
const annulus = (rmin, rmax) => (x, y) => { const r = Math.hypot(x, y) || 1e-9; const t = Math.min(rmax, Math.max(rmin, r)) / r; return [x * t, y * t]; };
const residual = (e) => (e < 1e-300 ? '0' : e.toExponential(1).replace('-', '−').replace('e', '\\times10^{') + '}');

export default {
  collection: 'pma',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.24
    {
      num: '1.24',
      kind: 'Definition',
      name: 'Complex numbers as ordered pairs',
      credit: 'Hamilton, 1833',
      statement: String.raw`A **complex number** is an ordered pair $(a,b)$ of real numbers, two pairs being equal only when both coordinates agree. For $x=(a,b)$ and $y=(c,d)$ put
$$x+y=(a+c,\ b+d),\qquad xy=(ac-bd,\ ad+bc).$$`,
      idea: String.raw`Nothing mysterious is assumed: complex numbers are points of the plane, added like vectors and multiplied by an explicit rule. The product rule is chosen so that $(0,1)^2=(-1,0)$ (1.28) while every field axiom survives (1.25). Geometrically, multiplication by $x$ carries the triangle with vertices $0,1,y$ onto a similar triangle with vertices $0,x,xy$.`,
      caption: String.raw`Drag $z=(a,b)$ and $w=(c,d)$. *Sum*: the parallelogram rule. *Product*: the formula $(ac-bd,\ ad+bc)$ — the triangle $0,1,w$ (orange) and the triangle $0,z,zw$ (green) are always similar.`,
      deps: ['pma-1.19'],
      tags: ['complex numbers'],
      viz(v) {
        const mode = v.select('', [{ value: 'sum', label: 'sum $z+w$' }, { value: 'prod', label: 'product $zw$' }], 'prod');
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, height: 380, grid: true });
        const Z = s.handle(1.35, 0.55, { color: 'accent', label: 'z', constrain: annulus(0, 1.55) });
        const W = s.handle(0.85, 0.95, { color: 'orange', label: 'w', constrain: annulus(0, 1.55) });
        let st = {};
        v.render(() => {
          const z = new v.Cx(Z.x, Z.y), w = new v.Cx(W.x, W.y);
          if (mode.value === 'sum') {
            const S = z.add(w);
            s.poly([[0, 0], [z.re, z.im], [S.re, S.im], [w.re, w.im]], { fill: 'green', fillAlpha: 0.08, color: 'green', width: 1.2, dash: [5, 4] });
            s.arrow(0, 0, z.re, z.im, { color: 'accent', width: 2.2 }); s.arrow(0, 0, w.re, w.im, { color: 'orange', width: 2.2 });
            s.arrow(0, 0, S.re, S.im, { color: 'green', width: 2.6 });
            s.dot(S.re, S.im, { color: 'green', r: 5.5, label: 'z+w', labelPos: 'ne' });
            st = { S };
          } else {
            const P = z.mul(w);
            s.poly([[0, 0], [1, 0], [w.re, w.im]], { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 1.4 });
            s.poly([[0, 0], [z.re, z.im], [P.re, P.im]], { fill: 'green', fillAlpha: 0.16, color: 'green', width: 1.4 });
            s.arrow(0, 0, P.re, P.im, { color: 'green', width: 2.6 });
            s.dot(1, 0, { color: 'ink', r: 4.5, label: '1', labelPos: 's' });
            s.dot(P.re, P.im, { color: 'green', r: 5.5, label: 'zw', labelPos: 'ne' });
            st = { P };
          }
          s.dot(0, 0, { color: 'ink', r: 3 });
          v.legend(mode.value === 'sum' ? [['accent', '$z$'], ['orange', '$w$'], ['green', '$z+w$']] : [['orange', 'triangle $0,1,w$', { area: true }], ['green', 'triangle $0,z,zw$', { area: true }]]);
        });
        v.readout(() => {
          const z = { re: Z.x, im: Z.y }, w = { re: W.x, im: W.y };
          if (mode.value === 'sum') return `$z = ${pair(z)}$, $w = ${pair(w)}$: $\\;z+w = (a+c,\\,b+d) = ${pair(st.S)}$.`;
          return `$z = ${pair(z)}$, $w = ${pair(w)}$: $\\;zw = (ac-bd,\\;ad+bc) = (${fx(z.re)}\\cdot${fx(w.re)} - ${fx(z.im)}\\cdot${fx(w.im)},\\; ${fx(z.re)}\\cdot${fx(w.im)} + ${fx(z.im)}\\cdot${fx(w.re)}) = ${pair(st.P)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.25
    {
      num: '1.25',
      kind: 'Theorem',
      name: 'The complex numbers form a field',
      statement: String.raw`With the addition and multiplication of 1.24, the set $\C$ of all complex numbers is a field, in which $(0,0)$ plays the role of $0$ and $(1,0)$ the role of $1$.`,
      idea: String.raw`Every axiom is checked by direct computation in the real field. Most are immediate: $-(a,b)=(-a,-b)$, commutativity is visible in the formulas, and associativity and the distributive law reduce to identities between real polynomials. Only (M5) needs a thought: if $(a,b)\neq(0,0)$ then $a^2+b^2>0$ by 1.18(d), and $\big(\frac{a}{a^2+b^2},\frac{-b}{a^2+b^2}\big)$ is a reciprocal of $(a,b)$.`,
      caption: String.raw`*(M5)*: drag $z=(a,b)\neq0$. Its reciprocal $\big(\frac{a}{a^2+b^2},\frac{-b}{a^2+b^2}\big)$ lies on the ray through $(a,-b)$, inside the unit circle when $z$ is outside it and vice versa, and the product formula returns exactly $(1,0)$. *(D)*: multiplication by $z$ carries the parallelogram $0,w,w+u,u$ onto the parallelogram $0,zw,zw+zu,zu$, so $z(w+u)=zw+zu$. The readout checks several axioms numerically.`,
      deps: ['pma-1.24', 'pma-1.12', 'pma-1.18'],
      tags: ['complex numbers', 'field'],
      viz(v) {
        const mode = v.select('axiom', [{ value: 'inv', label: '(M5) reciprocal' }, { value: 'dist', label: '(D) distributive law' }], 'inv');
        const s = v.stage({ x: [-3, 3], y: [-2.25, 2.25], equal: true, height: 380, grid: true });
        const Z = s.handle(1.45, 0.75, { color: 'accent', label: 'z', constrain: annulus(0.4, 2.3) });
        const W = s.handle(-0.35, 1.05, { color: 'orange', label: 'w', constrain: annulus(0, 1.1) });
        const U = s.handle(0.95, -0.35, { color: 'purple', label: 'u', constrain: annulus(0, 1.1) });
        let st = {};
        v.render(() => {
          const inv = mode.value === 'inv';
          W.visible = U.visible = !inv;
          if (inv && Math.hypot(Z.x, Z.y) < 0.4) { const p = annulus(0.4, 2.3)(Z.x, Z.y); Z.x = p[0]; Z.y = p[1]; }
          if (!inv && Math.hypot(Z.x, Z.y) > 1.45) { const p = annulus(0, 1.45)(Z.x, Z.y); Z.x = p[0]; Z.y = p[1]; }
          const z = new v.Cx(Z.x, Z.y), w = new v.Cx(W.x, W.y), u = new v.Cx(U.x, U.y);
          const one = new v.Cx(1, 0);
          if (inv) {
            const a = z.re, b = z.im, q = a * a + b * b, r = new v.Cx(a / q, -b / q);
            s.circle(0, 0, 1, { color: 'faint', width: 1.5, dash: [5, 4] });
            const far = 3.6 / Math.sqrt(q);
            s.line(0, 0, a * far, -b * far, { color: 'faint', width: 1.2 });
            s.dot(a, -b, { hollow: true, color: 'muted', r: 4.5, label: '(a,−b)', labelPos: 'se' });
            s.line(0, 0, a, b, { color: 'accent', width: 2 });
            s.arrow(0, 0, r.re, r.im, { color: 'green', width: 2.6 });
            s.dot(r.re, r.im, { color: 'green', r: 5.5, label: '1/z', labelPos: 'sw' });
            const prod = z.mul(r);
            s.dot(1, 0, { color: 'gold', r: 9, hollow: true, width: 2.4 });
            s.dot(prod.re, prod.im, { color: 'gold', r: 4.5, label: 'z·(1/z)', labelPos: 'ne' });
            st = { r, prod, q };
          } else {
            const S = w.add(u), zw = z.mul(w), zu = z.mul(u), zS = z.mul(S), sum = zw.add(zu);
            s.poly([[0, 0], [w.re, w.im], [S.re, S.im], [u.re, u.im]], { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.2, dash: [5, 4] });
            s.poly([[0, 0], [zw.re, zw.im], [zS.re, zS.im], [zu.re, zu.im]], { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.6 });
            s.dot(S.re, S.im, { color: 'accent', r: 4.5, label: 'w+u', labelPos: 'ne' });
            s.dot(zw.re, zw.im, { color: 'orange', r: 5, label: 'zw', labelPos: 'n' });
            s.dot(zu.re, zu.im, { color: 'purple', r: 5, label: 'zu', labelPos: 's' });
            s.dot(zS.re, zS.im, { color: 'green', r: 9, hollow: true, width: 2.2 });
            s.dot(sum.re, sum.im, { color: 'gold', r: 4.5, label: 'z(w+u) = zw+zu', labelPos: 'e' });
            st = { zS, sum };
          }
          s.dot(0, 0, { color: 'ink', r: 3 });
          // numerical audit of a few axioms with random-ish fixed partners
          const p = new v.Cx(-0.7, 0.4), q2 = new v.Cx(0.3, -1.1);
          const e = (A, B) => A.sub(B).abs();
          st.audit = {
            M2: e(z.mul(p), p.mul(z)),
            M3: e(z.mul(p).mul(q2), z.mul(p.mul(q2))),
            D: e(z.mul(p.add(q2)), z.mul(p).add(z.mul(q2))),
            M5: e(z.mul(new v.Cx(z.re / z.abs2(), -z.im / z.abs2())), one),
          };
          v.legend(inv ? [['accent', '$z$'], ['muted', '$(a,-b)$', { dot: true }], ['green', '$1/z$'], ['gold', 'the product $z\\cdot(1/z)$', { dot: true }]]
            : [['accent', 'parallelogram $0,w,w+u,u$', { area: true }], ['green', 'its image under $t\\mapsto zt$', { area: true }]]);
        });
        v.readout(() => {
          const A = st.audit; if (!A) return '';
          const audit = ` Rounding-level residuals: (M2) $${residual(A.M2)}$, (M3) $${residual(A.M3)}$, (D) $${residual(A.D)}$, (M5) $${residual(A.M5)}$.`;
          if (mode.value === 'inv') return `$a^2+b^2 = ${fx(st.q, 3)} > 0$, $\\;1/z = ${pair(st.r, 3)}$, $\\;z\\cdot\\tfrac1z = ${pair(st.prod, 3)}$.` + audit;
          return `$z(w+u) = ${pair(st.zS, 3)}$ and $zw+zu = ${pair(st.sum, 3)}$.` + audit;
        });
      },
    },

    // ------------------------------------------------------------------ 1.26
    {
      num: '1.26',
      kind: 'Theorem',
      name: 'The reals sit inside ℂ as the pairs (a, 0)',
      statement: String.raw`Pairs whose second coordinate is $0$ add and multiply exactly as their first coordinates do: for all real $a$ and $b$,
$$(a,0)+(b,0)=(a+b,\,0),\qquad (a,0)\,(b,0)=(ab,\,0).$$
Consequently $a\mapsto(a,0)$ identifies $\R$ with a subfield of $\C$, and one writes $a$ for $(a,0)$.`,
      idea: String.raw`Substitute $b=d=0$ in the definitions of 1.24: the cross terms $0\cdot0$, $a\cdot0$ and $0\cdot b$ vanish. The map $a\mapsto(a,0)$ is one-to-one and turns sums into sums and products into products, so the real field reappears, unchanged, as the horizontal axis of $\C$.`,
      caption: String.raw`Drag $a$ and $b$ on the real line (top). Their copies $(a,0)$ and $(b,0)$ in the plane (bottom), added and multiplied with the complex rules, land directly below $a+b$ and $ab$: the horizontal axis is a faithful copy of $\R$. The dashed verticals carry each value from one picture to the other.`,
      deps: ['pma-1.24', 'pma-1.25'],
      tags: ['complex numbers', 'real numbers'],
      refs: ['Rudin, Principles of Mathematical Analysis, 3rd ed., Theorem 1.26, p. 13'],
      viz(v) {
        const T = v.stage({ x: [-3, 3], y: [-0.55, 0.62], height: 100, axes: false, full: true, title: 'the real field $\\R$' });
        const P = v.stage({ x: [-3, 3], y: [-1.05, 1.05], equal: true, height: 230, grid: true, full: true, title: 'the complex plane: pairs $(a,0)$ on the horizontal axis' });
        const A = T.handle(-1.2, 0, { color: 'accent', label: 'a', constrain: (x) => [x, 0] });
        const B = T.handle(1.6, 0, { color: 'orange', label: 'b', constrain: (x) => [x, 0] });
        let st = {};
        v.render(() => {
          T.setView([...P.bounds.x], null);
          const [x0, x1] = T.bounds.x;
          A.x = v.M.clamp(A.x, x0 + 0.2, x1 - 0.2); B.x = v.M.clamp(B.x, x0 + 0.2, x1 - 0.2);
          const a = A.x, b = B.x, sum = a + b, prod = a * b;
          // top: R
          T.line(x0, 0, x1, 0, { color: 'faint', width: 1.3 });
          for (let t = Math.ceil(x0); t <= x1; t++) { T.line(t, -0.06, t, 0.06, { color: 'faint' }); T.text(String(t).replace('-', '−'), t, 0, { dy: 13, align: 'center', size: 10.5, color: 'muted' }); }
          for (const [val, col, lab] of [[sum, 'green', 'a+b'], [prod, 'purple', 'ab']]) {
            if (val > x0 && val < x1) { T.dot(val, 0, { color: col, r: 5.5 }); T.tex(lab, val, 0, { dy: -17, color: col, size: 14 }); }
          }
          // bottom: C
          const za = new v.Cx(a, 0), zb = new v.Cx(b, 0), S = za.add(zb), Pr = za.mul(zb);
          P.line(x0, 0, x1, 0, { color: 'accent', width: 4, alpha: 0.25 });
          for (const [z, col, lab] of [[za, 'accent', '(a,0)'], [zb, 'orange', '(b,0)'], [S, 'green', '(a,0)+(b,0)'], [Pr, 'purple', '(a,0)(b,0)']]) {
            if (z.re > x0 && z.re < x1) {
              P.vline(z.re, { color: col, width: 1, dash: [3, 4], alpha: 0.6 });
              P.dot(z.re, z.im, { color: col, r: 5.5 });
            }
          }
          const lab = (z, t, col, up) => { if (z.re > x0 && z.re < x1) P.tex(t, z.re, 0, { dy: up ? -16 : 17, color: col, size: 13 }); };
          lab(za, '(a,0)', 'accent', true); lab(zb, '(b,0)', 'orange', true); lab(S, '(a{+}b,0)', 'green', false); lab(Pr, '(ab,0)', 'purple', false);
          st = { a, b, sum, prod, S, Pr };
          v.legend([['accent', '$a$ and $(a,0)$'], ['orange', '$b$ and $(b,0)$'], ['green', 'sum'], ['purple', 'product']]);
        });
        v.readout(() => {
          const { a, b, sum, prod, S, Pr } = st;
          return `$(${fx(a)},0) + (${fx(b)},0) = ${pair(S)}$ and $a+b = ${fx(sum)}$; $\\;(${fx(a)},0)(${fx(b)},0) = (ab - 0\\cdot0,\\; a\\cdot0 + 0\\cdot b) = ${pair(Pr)}$ and $ab = ${fx(prod)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.28
    {
      num: '1.28',
      kind: 'Theorem',
      name: 'i² = −1',
      statement: String.raw`The complex number $i=(0,1)$ (Definition 1.27) satisfies $i^2=-1$.`,
      idea: String.raw`By the product rule, $(0,1)(0,1)=(0\cdot0-1\cdot1,\ 0\cdot1+1\cdot0)=(-1,0)$, which is the real number $-1$ under the identification of 1.26. More generally $i\,(x,y)=(-y,x)$: multiplying by $i$ is a quarter-turn about the origin, and two quarter-turns are the half-turn $z\mapsto-z$.`,
      caption: String.raw`Drag $z$ and choose the power $k$. Multiplying by $i=(0,1)$ sends $(x,y)$ to $(-y,x)$, a quarter-turn — follow the flag. Two quarter-turns give $i^2z=-z$, which is the statement $i^2=-1$; on the unit circle the same steps take $1$ to $i$ to $-1$. Four turns bring everything back.`,
      deps: ['pma-1.24', 'pma-1.26'],
      tags: ['complex numbers'],
      viz(v) {
        const kS = v.slider('power $k$ in $i^k z$', 0, 4, 2, { int: true });
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.25, 2.25], equal: true, height: 400, grid: true });
        const Z = s.handle(1.55, 0.55, { color: 'accent', label: 'z', constrain: annulus(0.5, 1.75) });
        const flag = (z) => { const r = z.abs(), u = z.scale(1 / r), n = u.mul(new v.Cx(0, 1)); const at = (a, b) => z.add(u.scale(a)).add(n.scale(b)); return [at(0, 0), at(0, 0.62), at(0.38, 0.5), at(0, 0.38)]; };
        let st = {};
        v.render(() => {
          const k = kS.value, z = new v.Cx(Z.x, Z.y), I = new v.Cx(0, 1);
          let ik = new v.Cx(1, 0); for (let j = 0; j < k; j++) ik = ik.mul(I);
          s.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          s.circle(0, 0, z.abs(), { color: 'faint', width: 1 });
          // the four images of the flag
          let p = new v.Cx(1, 0);
          for (let j = 0; j < 4; j++) {
            const cur = j === k % 4;
            const pts = flag(z).map((q) => p.mul(q)).map((q) => [q.re, q.im]);
            s.line(0, 0, pts[0][0], pts[0][1], { color: cur ? 'green' : 'faint', width: cur ? 1.6 : 1, dash: cur ? null : [3, 3] });
            s.poly(pts, { fill: j === 0 ? 'accent' : cur ? 'green' : 'faint', fillAlpha: j === 0 || cur ? 0.45 : 0.18, color: j === 0 ? 'accent' : cur ? 'green' : 'faint', width: 1.4 });
            p = p.mul(I);
          }
          // quarter-turn arcs travelled so far
          const th = z.arg(), R = z.abs();
          for (let j = 0; j < k; j++) {
            const a0 = th + j * Math.PI / 2 + 0.12, a1 = th + (j + 1) * Math.PI / 2 - 0.12;
            s.curve((t) => [R * 1.12 * Math.cos(a0 + (a1 - a0) * t), R * 1.12 * Math.sin(a0 + (a1 - a0) * t)], 0, 1, { color: 'gold', width: 2 });
            const e1 = [R * 1.12 * Math.cos(a1 - 0.04), R * 1.12 * Math.sin(a1 - 0.04)], e2 = [R * 1.12 * Math.cos(a1), R * 1.12 * Math.sin(a1)];
            s.arrow(e1[0], e1[1], e2[0], e2[1], { color: 'gold', width: 2, head: 9 });
          }
          // unit circle: 1 -> i -> -1
          const unit = [[1, 0, '1'], [0, 1, 'i'], [-1, 0, '-1'], [0, -1, '-i']];
          unit.forEach(([x, y, l], j) => { s.dot(x, y, { color: j <= k && j <= 2 ? 'red' : 'muted', r: 4 }); s.tex(l, x, y, { dx: x > 0 ? 9 : x < 0 ? -9 : 9, dy: y > 0 ? -10 : y < 0 ? 10 : -10, align: x < 0 ? 'right' : 'left', size: 13, color: j <= k && j <= 2 ? 'red' : 'muted' }); });
          if (k >= 1) s.curve((t) => [Math.cos(t), Math.sin(t)], 0.1, Math.min(k, 2) * Math.PI / 2 - 0.1, { color: 'red', width: 2 });
          const cur = ik.mul(z);
          s.dot(cur.re, cur.im, { color: 'green', r: 6, label: k === 0 ? '' : `i${'⁰¹²³⁴'[k]}z`, labelPos: 'sw' });
          st = { k, z, cur };
          v.legend([['accent', 'the flag at $z$', { area: true }], ['green', 'its image $i^k z$', { area: true }], ['gold', 'quarter-turns (multiplication by $i$)'], ['red', '$1\\to i\\to i^2=-1$']]);
        });
        v.readout(() => {
          const { k, z, cur } = st;
          return `$i\\cdot i = (0,1)(0,1) = (0\\cdot0 - 1\\cdot1,\\; 0\\cdot1 + 1\\cdot0) = (-1,0) = -1$. In general $i\\,(x,y) = (-y,x)$; here $z = ${pair(z)}$ and $i^{${k}}z = ${pair(cur)}$` + (k === 2 ? ' $= -z$.' : k === 4 ? ' $= z$.' : '.');
        });
      },
    },

    // ------------------------------------------------------------------ 1.29
    {
      num: '1.29',
      kind: 'Theorem',
      name: 'Every complex number is a + bi',
      statement: String.raw`Every complex number is a real number plus a real multiple of $i$: for real $a$ and $b$, $(a,b)=a+bi$, where $a$ and $b$ stand for $(a,0)$ and $(b,0)$ as in 1.26.`,
      idea: String.raw`Compute with the definitions: $a+bi=(a,0)+(b,0)(0,1)=(a,0)+(b\cdot0-0\cdot1,\ b\cdot1+0\cdot0)=(a,0)+(0,b)=(a,b)$. This justifies the familiar notation and lets one calculate with complex numbers as formal expressions in $i$, using $i^2=-1$.`,
      caption: String.raw`Drag $z=(a,b)$. The real number $b=(b,0)$, multiplied by $i$, turns a quarter-turn to $(0,b)$ (orange arc); adding the real number $a=(a,0)$ (blue) then lands exactly on $z$. The faint lattice shows the points $m+ni$ with integer $m,n$.`,
      deps: ['pma-1.24', 'pma-1.26'],
      tags: ['complex numbers'],
      refs: ['Rudin, Principles of Mathematical Analysis, 3rd ed., Theorem 1.29, p. 14'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 380 });
        const Z = s.handle(1.7, 1.25, { color: 'green', constrain: annulus(0.3, 2.1) });
        let st = {};
        v.render(() => {
          const a = Z.x, b = Z.y, [x0, x1] = s.bounds.x;
          for (let m = Math.ceil(x0); m <= x1; m++) for (let n = -2; n <= 2; n++) s.dot(m, n, { r: 1.8, color: 'faint', ring: false });
          s.line(0, b, a, b, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6 });
          // b on the real axis, turned by i to (0, b)
          s.dot(b, 0, { color: 'orange', r: 4, hollow: true });
          s.tex('b', b, 0, { dx: 5, dy: 14, align: 'left', color: 'orange', size: 13 });
          const sg = b >= 0 ? 1 : -1, R = Math.abs(b);
          if (R > 0.15) {
            s.curve((t) => [R * Math.cos(t * sg), R * Math.sin(t * sg)], 0.06, Math.PI / 2 - 0.08, { color: 'orange', width: 1.6, dash: [5, 4] });
            const e = [R * Math.cos((Math.PI / 2 - 0.02) * sg), R * Math.sin((Math.PI / 2 - 0.02) * sg)];
            s.arrow(R * Math.cos((Math.PI / 2 - 0.2) * sg), R * Math.sin((Math.PI / 2 - 0.2) * sg), e[0], e[1], { color: 'orange', width: 1.6, head: 8 });
          }
          s.dot(0, b, { color: 'orange', r: 5 });
          s.tex('bi=(0,b)', 0, b, { dx: -9, align: 'right', color: 'orange', size: 13 });
          s.arrow(0, 0, a, 0, { color: 'accent', width: 2.6 });
          s.tex('a=(a,0)', a / 2, 0, { dy: b >= 0 ? 16 : -16, color: 'accent', size: 13 });
          s.arrow(a, 0, a, b, { color: 'orange', width: 2.6 });
          s.dot(0, 1, { color: 'red', r: 4 }); s.tex('i', 0, 1, { dx: 8, dy: -8, align: 'left', color: 'red', size: 13 });
          s.tex('z=a+bi', a, b, { dx: 12, dy: -14, align: 'left', color: 'green', size: 15 });
          st = { a, b };
          v.legend([['accent', 'the real number $a$'], ['orange', '$b$ turned by $i$ into $bi$'], ['green', '$z=(a,b)$', { dot: true }]]);
        });
        v.readout(() => {
          const { a, b } = st;
          return `$a+bi = (${fx(a)},0) + (${fx(b)},0)(0,1) = (${fx(a)},0) + (0,\\,${fx(b)}) = (${fx(a)},\\,${fx(b)}) = z$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.30
    {
      num: '1.30',
      kind: 'Definition',
      name: 'Real part, imaginary part, conjugate',
      statement: String.raw`For real $a,b$ and $z=a+bi$, the complex number $\bar z=a-bi$ is the **conjugate** of $z$, and the real numbers $a=\Re(z)$ and $b=\Im(z)$ are the **real part** and **imaginary part** of $z$.`,
      idea: String.raw`In the plane, $\Re$ and $\Im$ are the two coordinates and conjugation is reflection in the real axis. Its algebraic properties are collected in 1.31; with it, the absolute value is defined in 1.32.`,
      deps: ['pma-1.29'],
      tags: ['complex numbers'],
    },

    // ------------------------------------------------------------------ 1.31
    {
      num: '1.31',
      kind: 'Theorem',
      name: 'Properties of complex conjugation',
      statement: String.raw`For complex numbers $z$ and $w$:
(a) conjugation respects sums: $\overline{z+w}=\bar z+\bar w$;
(b) conjugation respects products: $\overline{zw}=\bar z\,\bar w$;
(c) $z+\bar z=2\Re(z)$ and $z-\bar z=2i\Im(z)$;
(d) $z\bar z$ is a real number, and it is positive unless $z=0$.`,
      idea: String.raw`Write $z=a+bi$, $w=c+di$ and calculate. For (b), both sides equal $(ac-bd)-(ad+bc)i$. For (d), $z\bar z=(a+bi)(a-bi)=a^2+b^2$, which is real and, by 1.18(d), positive unless $a=b=0$. Together, (a) and (b) say that conjugation is a field automorphism of $\C$ that leaves every real number fixed.`,
      caption: String.raw`The real axis is a mirror; conjugates are drawn hollow. Drag $z$ and $w$ and choose an identity: reflecting the parallelogram of $z,w$ gives the parallelogram of the reflections (a); the reflection of $zw$ is the product of the reflections (b); $z$ and $\bar z$ add up onto the real axis and differ along the imaginary axis (c); $z\bar z$ always lands on the positive real axis, at the square of the distance from $0$ to $z$ (d).`,
      deps: ['pma-1.30', 'pma-1.25', 'pma-1.18'],
      tags: ['complex numbers', 'conjugation'],
      viz(v) {
        const part = v.select('', [{ value: 'a', label: 'sums (a)' }, { value: 'b', label: 'products (b)' }, { value: 'c', label: '$\\Re$ and $\\Im$ (c)' }, { value: 'd', label: '$z\\bar z$ (d)' }], 'b');
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, height: 400, grid: true });
        const Z = s.handle(1.1, 0.95, { color: 'accent', label: 'z', constrain: annulus(0.15, 1.5) });
        const W = s.handle(-0.6, 1.05, { color: 'orange', label: 'w', constrain: annulus(0.15, 1.5) });
        let st = {};
        const ghost = (p, col, label, pos) => s.dot(p.re, p.im, { color: col, r: 5.5, hollow: true, width: 2, label, labelPos: pos || 'se', tex: true });
        v.render(() => {
          const P = part.value; W.visible = P === 'a' || P === 'b';
          const z = new v.Cx(Z.x, Z.y), w = new v.Cx(W.x, W.y), zb = z.conj(), wb = w.conj();
          const [x0, x1] = s.bounds.x;
          s.line(x0, 0, x1, 0, { color: 'teal', width: 3, alpha: 0.35 });
          s.text('mirror', x1 - 0.1, 0, { dy: -10, align: 'right', size: 11, color: 'teal' });
          s.line(z.re, z.im, zb.re, zb.im, { color: 'accent', width: 1, dash: [2, 3], alpha: 0.7 });
          ghost(zb, 'accent', '\\bar z', 'se');
          if (P === 'a') {
            const S = z.add(w), Sb = S.conj();
            s.poly([[0, 0], [z.re, z.im], [S.re, S.im], [w.re, w.im]], { fill: 'green', fillAlpha: 0.1, color: 'green', width: 1.2 });
            s.poly([[0, 0], [zb.re, zb.im], [Sb.re, Sb.im], [wb.re, wb.im]], { fill: 'green', fillAlpha: 0.05, color: 'green', width: 1.2, dash: [5, 4] });
            s.line(w.re, w.im, wb.re, wb.im, { color: 'orange', width: 1, dash: [2, 3], alpha: 0.7 });
            s.line(S.re, S.im, Sb.re, Sb.im, { color: 'green', width: 1, dash: [2, 3], alpha: 0.7 });
            ghost(wb, 'orange', '\\bar w', 'sw');
            s.dot(S.re, S.im, { color: 'green', r: 5, label: 'z+w', labelPos: 'ne' });
            ghost(Sb, 'green', '\\overline{z+w}=\\bar z+\\bar w', 'se');
            st = { L: S.conj(), R: zb.add(wb), name: '\\overline{z+w}', rname: '\\bar z+\\bar w' };
          } else if (P === 'b') {
            const M = z.mul(w), Mb = M.conj(), MM = zb.mul(wb);
            s.line(w.re, w.im, wb.re, wb.im, { color: 'orange', width: 1, dash: [2, 3], alpha: 0.7 });
            ghost(wb, 'orange', '\\bar w', 'sw');
            s.arrow(0, 0, M.re, M.im, { color: 'green', width: 2.2 });
            s.line(M.re, M.im, Mb.re, Mb.im, { color: 'green', width: 1, dash: [2, 3], alpha: 0.7 });
            s.dot(M.re, M.im, { color: 'green', r: 5, label: 'zw', labelPos: 'ne' });
            s.arrow(0, 0, MM.re, MM.im, { color: 'green', width: 1.6, dash: [5, 4] });
            ghost(Mb, 'green', '\\overline{zw}=\\bar z\\,\\bar w', 'se');
            st = { L: Mb, R: MM, name: '\\overline{zw}', rname: '\\bar z\\,\\bar w' };
          } else if (P === 'c') {
            const S = z.add(zb), D = z.sub(zb);
            s.poly([[0, 0], [z.re, z.im], [S.re, S.im], [zb.re, zb.im]], { fill: 'green', fillAlpha: 0.08, color: 'green', width: 1.2, dash: [5, 4] });
            s.arrow(0, 0, S.re, 0, { color: 'green', width: 2.6 });
            s.dot(S.re, 0, { color: 'green', r: 5.5, label: 'z+\\bar z=2\\Re z', labelPos: S.re >= 0 ? 'se' : 'sw', tex: true });
            s.arrow(0, 0, 0, D.im, { color: 'purple', width: 2.6 });
            s.dot(0, D.im, { color: 'purple', r: 5.5, label: 'z-\\bar z=2i\\Im z', labelPos: 'e', tex: true });
            s.line(zb.re, zb.im, z.re, z.im, { color: 'purple', width: 1.2, dash: [4, 3] });
            st = { S, D, z };
          } else {
            const r = z.abs(), q = z.mul(zb);
            s.circle(0, 0, r, { color: 'accent', width: 1.2, dash: [5, 4] });
            s.line(0, 0, z.re, z.im, { color: 'accent', width: 1.8 });
            s.measure(0, -0.22, r, -0.22, null, { color: 'muted' });
            s.tex('|z|', r / 2, -0.22, { dy: 13, color: 'muted', size: 13 });
            s.arrow(0, 0, q.re, q.im, { color: 'green', width: 2.6 });
            s.dot(q.re, q.im, { color: 'green', r: 6, label: 'z\\bar z = a^2+b^2', labelPos: 'ne', tex: true });
            s.line(0, 0, x1, 0, { color: 'green', width: 5, alpha: 0.18, cap: 'butt' });
            st = { q, z };
          }
          s.dot(0, 0, { color: 'ink', r: 3 });
          v.legend([['teal', 'mirror: the real axis'], ['accent', '$z$ and $\\bar z$ (hollow)', { dot: true }], ['green', 'the identity being tested']]);
        });
        v.readout(() => {
          const P = part.value;
          if (P === 'a' || P === 'b') return `$${st.name} = ${pair(st.L, 3)}$ and $${st.rname} = ${pair(st.R, 3)}$ — equal, as claimed in (${P}).`;
          if (P === 'c') return `$z+\\bar z = ${pair(st.S, 3)} = 2\\Re z$ with $\\Re z = ${fx(st.z.re, 3)}$; $\\;z-\\bar z = ${pair(st.D, 3)} = 2i\\Im z$ with $\\Im z = ${fx(st.z.im, 3)}$.`;
          return `$z\\bar z = (a+bi)(a-bi) = a^2+b^2 = ${fx(st.q.re, 4)}$ (imaginary part $${fx(st.q.im, 4)}$) $> 0$ since $z\\neq0$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.32
    {
      num: '1.32',
      kind: 'Definition',
      name: 'Absolute value of a complex number',
      statement: String.raw`The **absolute value** of a complex number $z$ is the nonnegative square root of $z\bar z$: $\;|z|=(z\bar z)^{1/2}$. It exists and is unique by Theorem 1.21 together with 1.31(d). For real $x$ this gives $|x|=(x^2)^{1/2}$, i.e. $|x|=x$ when $x\ge0$ and $|x|=-x$ when $x<0$.`,
      idea: String.raw`If $z=a+bi$ then $|z|=(a^2+b^2)^{1/2}$, the Euclidean distance from $0$ to the point $(a,b)$ — Pythagoras built into the definition. Its algebraic and metric properties are Theorem 1.33.`,
      deps: ['pma-1.31', 'pma-1.21'],
      tags: ['complex numbers', 'absolute value'],
    },
  ],
};
