// Abstract Algebra (Judson) — Chapter 4, part 2: complex numbers and polar form, De Moivre, the circle group, roots of
// unity as cyclic groups, and the method of repeated squares (4.15a–4.28). Shared helpers: ch04.shared.js.
import { elColor, gcd, mod, TAU, divisors, phi, hour, starWalk, arc, plane, arg0, deg, num, cxTex } from './ch04.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const cmul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
const cabs = ([a, b]) => Math.hypot(a, b);
const cis = (t, r = 1) => [r * Math.cos(t), r * Math.sin(t)];
const angTex = (t, unit = 'deg') => (unit === 'deg' ? `${num(deg(t), 1)}^\\circ` : `${num(t, 3)}`);
/** Root ω^k of order n as TeX label. */
const wTex = (k) => (k === 0 ? '1' : k === 1 ? '\\omega' : `\\omega^{${k}}`);

export default {
  collection: 'alg',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.15a
    {
      num: '4.15a',
      kind: 'Definition',
      name: 'Complex numbers',
      statement: String.raw`A **complex number** is $z=a+bi$ with $a,b\in\mathbb R$ and $i^2=-1$; $a=\operatorname{Re}z$ and $b=\operatorname{Im}z$ are its real and imaginary parts. With
$$(a+bi)+(c+di)=(a+c)+(b+d)i,\qquad (a+bi)(c+di)=(ac-bd)+(ad+bc)i,$$
$\mathbb C$ is a field. The **conjugate** is $\bar z=a-bi$, the **modulus** $|z|=\sqrt{a^2+b^2}=\sqrt{z\bar z}$, and for $z\ne0$, $z^{-1}=\bar z/|z|^2$. Picturing $a+bi$ as the point $(a,b)$ gives the complex plane.`,
      idea: String.raw`Addition is vector addition — the parallelogram rule. The product formula is forced by distributing and using $i^2=-1$. The inverse comes from $z\bar z=a^2+b^2=|z|^2$, a positive real number when $z\ne0$, so dividing $\bar z$ by it gives $z^{-1}$: the conjugate mirrors $z$ in the real axis and the inverse then shrinks or stretches it to length $1/|z|$. Judson’s example: $z=2+3i$, $w=1-2i$ give $z+w=3+i$, $zw=8-i$, $z^{-1}=\frac2{13}-\frac3{13}i$.`,
      caption: String.raw`Drag $z$ and $w$ (they snap to half-integers). Choose the sum (parallelogram), the product, or the inverse and conjugate of $z$; the dashed lines read off real and imaginary parts, and the readout does the arithmetic exactly.`,
      deps: [],
      see: ['pma-1.24', 'ladr-1.1'],
      refs: ['Judson §4.2'],
      tags: ['complex numbers'],
      viz(v) {
        const op = v.select('show', [{ value: 'sum', label: '$z+w$' }, { value: 'prod', label: '$zw$' }, { value: 'inv', label: '$\\bar z$ and $z^{-1}$' }], 'sum');
        const s = v.stage({ x: [-5.5, 9.5], y: [-5.2, 5.2], equal: true, axes: false, height: 380, full: true });
        const snap = (x, y) => [clamp(Math.round(x * 2) / 2, -4.5, 4.5), clamp(Math.round(y * 2) / 2, -4.5, 4.5)];
        const Z = s.handle(2, 3, { color: 'accent', label: 'z', constrain: snap }), Wh = s.handle(1, -2, { color: 'orange', label: 'w', constrain: snap });
        v.render(() => {
          const z = [Z.x, Z.y], w = [Wh.x, Wh.y], o = op.value;
          const [X0, X1] = s.xr, [Y0, Y1] = s.yr;
          for (let k = Math.ceil(X0); k <= X1; k++) s.line(k, Y0, k, Y1, { color: 'grid', width: 1 });
          for (let k = Math.ceil(Y0); k <= Y1; k++) s.line(X0, k, X1, k, { color: 'grid', width: 1 });
          plane(v, s, { unit: o === 'inv' });
          for (let k = -4; k <= 9; k += 2) if (k) s.text(String(k).replace('-', '−'), k, 0, { dy: 11, align: 'center', size: 10, color: 'muted' });
          for (let k = -4; k <= 4; k += 2) if (k) s.text(`${String(k).replace('-', '−')}i`, 0, k, { dx: -5, align: 'right', size: 10, color: 'muted' });
          s.line(z[0], z[1], z[0], 0, { color: 'accent', dash: [3, 4], width: 1.2 }); s.line(z[0], z[1], 0, z[1], { color: 'accent', dash: [3, 4], width: 1.2 });
          s.arrow(0, 0, z[0], z[1], { color: 'accent', width: 2.4 });
          s.text(`|z| = ${num(cabs(z), 3)}`, z[0] / 2, z[1] / 2, { dx: 8, dy: -8, size: 11.5, color: 'accent', weight: 700, plate: true });
          if (o !== 'inv') s.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.4 });
          if (o === 'sum') {
            const p = [z[0] + w[0], z[1] + w[1]];
            s.poly([[0, 0], z, p, w], { fill: 'gold', fillAlpha: 0.08, color: 'gold', dash: [5, 4], width: 1.4 });
            s.arrow(0, 0, p[0], p[1], { color: 'gold', width: 3 }); s.dot(p[0], p[1], { r: 5, color: 'gold', label: 'z + w', labelPos: 'ne' });
          } else if (o === 'prod') {
            const p = cmul(z, w);
            s.clip(() => { s.arrow(0, 0, p[0], p[1], { color: 'gold', width: 3 }); s.dot(p[0], p[1], { r: 5, color: 'gold', label: 'zw', labelPos: 'ne' }); });
            if (Math.abs(p[0]) > 9.3 || Math.abs(p[1]) > 5) s.corner(`zw = ${cxTex(p[0], p[1]).replace(/-/g, '−')} lies off-screen`, 'tr', { size: 12, color: 'gold', weight: 700 });
          } else {
            const c = [z[0], -z[1]], r2 = z[0] ** 2 + z[1] ** 2;
            s.line(z[0], z[1], c[0], c[1], { color: 'purple', dash: [4, 4], width: 1.4 });
            s.dot(c[0], c[1], { r: 5, color: 'purple', label: 'z̄', labelPos: 'e' });
            if (r2 > 0) { const iv = [c[0] / r2, c[1] / r2]; s.arrow(0, 0, iv[0], iv[1], { color: 'gold', width: 3 }); s.dot(iv[0], iv[1], { r: 5, color: 'gold' }); s.text('$z^{-1}$', iv[0], iv[1], { dx: 10, dy: 14, size: 13, color: 'gold', plate: true }); }
          }
        });
        v.readout(() => {
          const [a, b] = [Z.x, Z.y], [c, d] = [Wh.x, Wh.y], o = op.value;
          const Z$ = cxTex(a, b), W$ = cxTex(c, d);
          if (o === 'sum') return `$z + w = (${Z$}) + (${W$}) = ${cxTex(a + c, b + d)}$: add real parts and imaginary parts separately.`;
          const P = (x) => (x < 0 ? `(${num(x)})` : num(x));
          if (o === 'prod') return `$zw = (${Z$})(${W$}) = (${P(a * c)} - ${P(b * d)}) + (${P(a * d)} + ${P(b * c)})i = ${cxTex(a * c - b * d, a * d + b * c)}$.`;
          const r2 = a * a + b * b;
          if (!r2) return '$z = 0$ has no inverse.';
          const fr = (x) => { const g = gcd(Math.round(Math.abs(x) * 4), Math.round(r2 * 4)) || 1; const p = Math.round(x * 4) / g, q = Math.round(r2 * 4) / g; return q === 1 ? `${p}` : `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${q}}`; };
          return `$\\bar z = ${cxTex(a, -b)}$, $z\\bar z = |z|^2 = ${num(r2)}$, so $z^{-1} = \\bar z/|z|^2 = ${b === 0 ? fr(a) : `${fr(a)} ${b > 0 ? '' : '+'} ${fr(-b)}i`}$ $\\approx ${cxTex(a / r2, -b / r2, 3)}$; check $zz^{-1} = ${cxTex(...cmul([a, b], [a / r2, -b / r2]), 6)}$ ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.18a
    {
      num: '4.18a',
      kind: 'Definition',
      name: 'Polar form r cis θ',
      statement: String.raw`Every nonzero complex number can be written
$$z=a+bi=r(\cos\theta+i\sin\theta)=r\operatorname{cis}\theta,$$
where $r=|z|=\sqrt{a^2+b^2}>0$ and $\theta$ is an **argument** of $z$, the angle from the positive real axis to the ray through $z$, with $a=r\cos\theta$, $b=r\sin\theta$. The argument is determined up to multiples of $2\pi$ ($360^\circ$).`,
      idea: String.raw`Polar coordinates: the point $(a,b)$ lies at distance $r$ from the origin in direction $\theta$, and $\operatorname{cis}\theta$ is the point of the unit circle in that direction, so $z$ is $\operatorname{cis}\theta$ stretched by $r$. Going back, $r=\sqrt{a^2+b^2}$ and $\theta$ is fixed by $\cos\theta=a/r$, $\sin\theta=b/r$ (with $\tan\theta=b/a$ only up to the quadrant). Judson: $2\operatorname{cis}60^\circ=1+\sqrt3\,i$ and $3\sqrt2-3\sqrt2\,i=6\operatorname{cis}315^\circ$.`,
      caption: String.raw`Drag $z$. The ruler measures $r$, the orange protractor arc measures $\theta$, and the green point $\operatorname{cis}\theta$ on the unit circle is stretched by $r$ to reach $z$. The dashed legs are $r\cos\theta$ and $r\sin\theta$. Angles snap to multiples of $15^\circ$ when close.`,
      deps: ['alg-4.15a'],
      refs: ['Judson §4.2'],
      tags: ['complex numbers', 'polar form'],
      viz(v) {
        const U = v.select('angle in', [{ value: 'deg', label: 'degrees' }, { value: 'rad', label: 'radians' }], 'deg');
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.5, 2.5], equal: true, axes: false, height: 380, full: true });
        const snap = (x, y) => { let r = clamp(Math.round(Math.hypot(x, y) * 20) / 20, 0.3, 2.3), t = Math.atan2(y, x); const k = Math.round(t / (Math.PI / 12)); if (Math.abs(t - (k * Math.PI) / 12) < 0.045) t = (k * Math.PI) / 12; if (Math.abs(r - Math.round(r)) < 0.06) r = Math.round(r); return cis(t, r); };
        const Z = s.handle(...cis(Math.PI / 3, 2), { color: 'accent', label: 'z', constrain: snap });
        v.render(() => {
          const r = Math.hypot(Z.x, Z.y), t = arg0(Z.x, Z.y), c = cis(t);
          plane(v, s);
          for (let k = 0; k < 24; k++) { const a = (k * TAU) / 24, big = k % 6 === 0; s.line(...cis(a, 1.0), ...cis(a, big ? 0.9 : 0.95), { color: 'muted', width: 1 }); }
          s.line(Z.x, Z.y, Z.x, 0, { color: 'teal', dash: [4, 4], width: 1.6 }); s.line(0, 0, Z.x, 0, { color: 'teal', width: 3, alpha: 0.6 });
          s.text('r cos θ', Z.x / 2, 0, { dy: Z.y >= 0 ? 12 : -12, align: 'center', size: 11, color: 'teal', weight: 700 });
          s.text('r sin θ', Z.x, Z.y / 2, { dx: Z.x >= 0 ? 8 : -8, align: Z.x >= 0 ? 'left' : 'right', size: 11, color: 'teal', weight: 700 });
          arc(v, s, 0.55, 0, t, { color: 'orange', width: 2.6, head: true });
          const mid = cis(t / 2, 0.78); s.text(`θ = ${U.value === 'deg' ? `${num(deg(t), 1)}°` : num(t, 3)}`, mid[0], mid[1], { align: 'center', size: 12, weight: 700, color: 'orange', plate: true });
          s.line(0, 0, Z.x, Z.y, { color: 'accent', width: 2.6 });
          s.dot(c[0], c[1], { r: 5.5, color: 'green' }); s.text('cis θ', c[0], c[1], { dx: 9, dy: 12, size: 11.5, weight: 700, color: 'green' });
          const n = [-Math.sin(t), Math.cos(t)], off = 0.22;
          s.line(n[0] * off, n[1] * off, Z.x + n[0] * off, Z.y + n[1] * off, { color: 'accent', width: 1.2 });
          for (let k = 0; k <= Math.floor(r); k++) { const p = cis(t, k); s.line(p[0] + n[0] * (off - 0.07), p[1] + n[1] * (off - 0.07), p[0] + n[0] * (off + 0.07), p[1] + n[1] * (off + 0.07), { color: 'accent', width: 1.4 }); }
          const m = cis(t, r / 2); s.text(`r = ${num(r, 2)}`, m[0] + n[0] * 0.45, m[1] + n[1] * 0.45, { align: 'center', size: 12, weight: 700, color: 'accent', plate: true });
        });
        v.readout(() => {
          const r = Math.hypot(Z.x, Z.y), t = arg0(Z.x, Z.y), u = U.value;
          return `$z = ${cxTex(Z.x, Z.y, 3)} = ${num(r, 3)}\\operatorname{cis} ${angTex(t, u)}$: $r = \\sqrt{${num(Z.x, 3)}^2 + ${num(Z.y, 3)}^2} = ${num(r, 3)}$, and $r\\cos\\theta = ${num(r * Math.cos(t), 3)}$, $r\\sin\\theta = ${num(r * Math.sin(t), 3)}$ ✓. Other arguments: $${angTex(t + TAU, u)}, ${angTex(t - TAU, u)}, \\ldots$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.20
    {
      num: '4.20',
      kind: 'Proposition',
      name: 'Moduli multiply and arguments add',
      statement: String.raw`If $z=r\operatorname{cis}\theta$ and $w=s\operatorname{cis}\phi$ are nonzero complex numbers, then
$$zw=rs\operatorname{cis}(\theta+\phi).$$`,
      idea: String.raw`Multiply out: $(\cos\theta+i\sin\theta)(\cos\phi+i\sin\phi)=(\cos\theta\cos\phi-\sin\theta\sin\phi)+i(\sin\theta\cos\phi+\cos\theta\sin\phi)$, which the addition formulas turn into $\cos(\theta+\phi)+i\sin(\theta+\phi)$. Geometrically, multiplying by $w$ is a rotation by $\phi$ followed by a scaling by $s$, so it carries the triangle $0,1,z$ to the similar triangle $0,w,zw$.`,
      caption: String.raw`Drag $z$ and $w$. The product (gold) is computed from the rectangular formula, yet its arc is the blue angle $\theta$ followed by the orange angle $\phi$, and its length is the product of the lengths. The two shaded triangles $0,1,z$ and $0,w,zw$ are similar: multiplying by $w$ rotates and scales.`,
      deps: ['alg-4.18a'],
      refs: ['Judson §4.2'],
      tags: ['complex numbers', 'polar form'],
      viz(v) {
        const s = v.stage({ x: [-5, 5], y: [-5, 5], equal: true, axes: false, height: 400, full: true });
        const lim = (x, y) => { const r = Math.hypot(x, y), R = clamp(r, 0.4, 2.2); return [(x / r) * R || 0.4, (y / r) * R || 0]; };
        const Z = s.handle(...cis((40 * Math.PI) / 180, 1.6), { color: 'blue', label: 'z', constrain: lim }), W = s.handle(...cis((70 * Math.PI) / 180, 1.8), { color: 'orange', label: 'w', constrain: lim });
        v.render(() => {
          const z = [Z.x, Z.y], w = [W.x, W.y], p = cmul(z, w), t = arg0(...z), f = arg0(...w);
          s.setView([-5.3, 5.3], [-5.3, 5.3]);
          plane(v, s);
          s.poly([[0, 0], [1, 0], z], { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 1.2 });
          s.poly([[0, 0], w, p], { fill: 'gold', fillAlpha: 0.14, color: 'gold', width: 1.2 });
          s.dot(1, 0, { r: 4, color: 'ink', label: '1', labelPos: 's' });
          arc(v, s, 0.42, 0, t, { color: 'blue', width: 3 }); arc(v, s, 0.42, t, t + f, { color: 'orange', width: 3, head: true });
          arc(v, s, 0.62, 0, f, { color: 'orange', width: 1.6, alpha: 0.6 });
          s.arrow(0, 0, z[0], z[1], { color: 'blue', width: 2.4 }); s.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.4 });
          s.arrow(0, 0, p[0], p[1], { color: 'gold', width: 3.2 }); s.dot(p[0], p[1], { r: 5.5, color: 'gold' }); s.text('$zw$', p[0], p[1], { dx: 12, dy: -10, size: 15, color: 'gold' });
        });
        v.legend([['blue', 'z and its angle θ'], ['orange', 'w and its angle φ'], ['gold', 'zw (rectangular formula)']]);
        v.readout(() => {
          const z = [Z.x, Z.y], w = [W.x, W.y], p = cmul(z, w), t = deg(arg0(...z)), f = deg(arg0(...w)), a = deg(arg0(...p));
          const ok = Math.abs(cabs(p) - cabs(z) * cabs(w)) < 1e-9 && Math.abs(mod(t + f - a + 180, 360) - 180) < 1e-7;
          return `$z = ${num(cabs(z), 3)}\\operatorname{cis}${num(t, 1)}^\\circ$, $w = ${num(cabs(w), 3)}\\operatorname{cis}${num(f, 1)}^\\circ$, and $(ac - bd) + (ad + bc)i = ${cxTex(p[0], p[1], 3)} = ${num(cabs(p), 3)}\\operatorname{cis}${num(a, 1)}^\\circ$: $|zw| = ${num(cabs(z), 3)}\\cdot ${num(cabs(w), 3)}$ and $${num(t, 1)}^\\circ + ${num(f, 1)}^\\circ \\equiv ${num(a, 1)}^\\circ$ ${ok ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.22
    {
      num: '4.22',
      kind: 'Theorem',
      name: 'De Moivre’s theorem',
      statement: String.raw`Let $z=r\operatorname{cis}\theta$ be a nonzero complex number. Then for every positive integer $n$,
$$[r\operatorname{cis}\theta]^n=r^n\operatorname{cis}(n\theta).$$`,
      idea: String.raw`Induction on $n$ (2.1) with Proposition 4.20 as the step: $z^{n+1}=z^n\cdot z=r^n\operatorname{cis}(n\theta)\cdot r\operatorname{cis}\theta=r^{n+1}\operatorname{cis}((n+1)\theta)$. So the powers of $z$ march around the origin by the angle $\theta$ each time while their distances grow (or shrink) geometrically: they lie on a logarithmic spiral, or on the unit circle when $r=1$. Judson: $(1+i)^{10}=(\sqrt2)^{10}\operatorname{cis}\frac{10\pi}4=32i$.`,
      caption: String.raw`Drag $z$ on the left and set $n$. On the right, the powers $z, z^2,\ldots,z^n$ computed by repeated multiplication (dots on the spiral) are compared with the formula $r^n\operatorname{cis}(n\theta)$ (gold ring). Put $z$ on the dashed unit circle and the spiral collapses onto it. **(1+i)¹⁰** loads Judson’s example.`,
      deps: ['alg-4.20', 'alg-2.1'],
      refs: ['Judson §4.2'],
      tags: ['complex numbers', 'induction'],
      credit: 'de Moivre, 1707–1722',
      viz(v) {
        const N = v.slider('$n$', 1, 16, 9, { int: true });
        v.button('(1+i)¹⁰', () => { Z.set(1, 1); N.set(10); });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 330, weight: 0.8, title: 'choose z' });
        const s = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 330, weight: 1.2, title: 'powers of z' });
        const Z = L.handle(...cis(0.5, 1.12), { color: 'accent', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y), R = clamp(r, 0.55, 1.5); return [(x / r) * R, (y / r) * R]; } });
        v.render(() => {
          const z = [Z.x, Z.y], n = N.value, r = cabs(z), t = Math.atan2(z[1], z[0]);
          plane(v, L, { labels: false }); L.arrow(0, 0, z[0], z[1], { color: 'accent', width: 2.2 }); arc(v, L, 0.35, 0, t, { color: 'orange', width: 2.2 });
          L.corner(`r = ${num(r, 3)}, θ = ${num(deg(t), 1)}°`, 'bl', { size: 11.5, color: 'ink' });
          const P = [[1, 0]]; for (let k = 1; k <= n; k++) P.push(cmul(P[k - 1], z));
          const m = Math.max(1.35, ...P.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) * 1.15)); s.setView([-m, m], [-m, m]);
          plane(v, s);
          const sp = []; for (let i = 0; i <= 200; i++) { const u = (n * i) / 200; sp.push(cis(t * u, r ** u)); }
          s.path(sp, { color: 'accent', width: 1.4, alpha: 0.55 });
          P.forEach((p, k) => { if (k) s.line(0, 0, p[0], p[1], { color: 'faint', width: 1 }); s.dot(p[0], p[1], { r: k === n ? 6 : 4, color: k === n ? 'accent' : 'accent' }); if (n <= 10 || k === n || k === 1) s.text(k === 0 ? '1' : k === 1 ? 'z' : `z${String(k).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('')}`, p[0], p[1], { dx: 8, dy: -8, size: 11.5, color: 'muted' }); });
          const F = cis(n * t, r ** n); s.dot(F[0], F[1], { r: 11, hollow: true, color: 'gold' });
          arc(v, s, Math.min(0.45, m * 0.18), 0, n * t, { color: 'orange', width: 1.8, head: true });
        });
        v.readout(() => {
          const z = [Z.x, Z.y], n = N.value, r = cabs(z), t = Math.atan2(z[1], z[0]);
          let p = [1, 0]; for (let k = 0; k < n; k++) p = cmul(p, z);
          const F = cis(n * t, r ** n), err = Math.hypot(p[0] - F[0], p[1] - F[1]);
          return `By repeated multiplication $z^{${n}} = ${cxTex(p[0], p[1], 4)}$; by De Moivre $r^{${n}}\\operatorname{cis}(${n}\\theta) = ${num(r, 4)}^{${n}}\\operatorname{cis}(${num(deg(n * t), 1)}^\\circ) = ${cxTex(F[0], F[1], 4)}$. Difference ${err < 1e-9 ? '$< 10^{-9}$ ✓' : v.fmt(err, 3)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.23a
    {
      num: '4.23a',
      kind: 'Definition',
      name: 'The circle group 𝕋',
      statement: String.raw`The **circle group** is $\mathbb T=\{z\in\mathbb C: |z|=1\}$, the unit circle, under complex multiplication. Its elements are the numbers $\operatorname{cis}\theta$, and $\operatorname{cis}\theta\cdot\operatorname{cis}\phi=\operatorname{cis}(\theta+\phi)$, $(\operatorname{cis}\theta)^{-1}=\operatorname{cis}(-\theta)=\overline{\operatorname{cis}\theta}$.`,
      idea: String.raw`By Proposition 4.20 moduli multiply, so $|z|=|w|=1$ gives $|zw|=1$, and arguments add. Multiplying points of the circle is therefore adding angles, with the angle wrapping around at $360^\circ$: $\mathbb T$ behaves like addition of real numbers modulo $2\pi$. It is an infinite abelian group that contains a cyclic subgroup of every finite order, the roots of unity.`,
      caption: String.raw`Drag $z$ and $w$ around the unit circle; their product (gold) sits at the sum of the angles, and the inverse $z^{-1}$ (purple) is the mirror image of $z$. The strip below is the angle line from $0^\circ$ to $360^\circ$: adding the angles wraps around exactly as the product does.`,
      deps: ['alg-4.15a', 'alg-3.7a'],
      refs: ['Judson §4.2'],
      tags: ['circle group', 'complex numbers'],
      viz(v) {
        const s = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 330, full: true });
        const t = v.stage({ x: [-15, 375], y: [-1.1, 1.1], axes: false, height: 105, full: true });
        const on = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const Z = s.handle(...cis((110 * Math.PI) / 180), { color: 'blue', label: 'z', constrain: on }), W = s.handle(...cis((300 * Math.PI) / 180), { color: 'orange', label: 'w', constrain: on });
        v.render(() => {
          const a = arg0(Z.x, Z.y), b = arg0(W.x, W.y), p = cmul([Z.x, Z.y], [W.x, W.y]), c = arg0(...p);
          plane(v, s, { unit: false }); s.circle(0, 0, 1, { color: 'ink', width: 2, fill: false });
          arc(v, s, 0.3, 0, a, { color: 'blue', width: 3 }); arc(v, s, 0.3, a, a + b, { color: 'orange', width: 3, head: true });
          s.line(0, 0, Z.x, Z.y, { color: 'blue', width: 1.4, alpha: 0.6 }); s.line(0, 0, W.x, W.y, { color: 'orange', width: 1.4, alpha: 0.6 });
          s.line(0, 0, p[0], p[1], { color: 'gold', width: 2.4 }); s.dot(p[0], p[1], { r: 7, color: 'gold' }); s.text('$zw$', p[0] * 1.17, p[1] * 1.17, { align: 'center', size: 15, color: 'gold' });
          s.dot(Z.x, -Z.y, { r: 5.5, color: 'purple' }); s.text('$z^{-1}$', Z.x * 1.2, -Z.y * 1.2, { align: 'center', size: 14, color: 'purple' }); s.line(Z.x, Z.y, Z.x, -Z.y, { color: 'purple', dash: [3, 4], width: 1.2 });
          s.dot(1, 0, { r: 4, color: 'ink' }); s.text('1', 1.08, -0.1, { size: 12, color: 'muted' });
          // angle strip
          t.line(0, 0, 360, 0, { color: 'muted', width: 1.4 });
          for (let d = 0; d <= 360; d += 30) { t.line(d, -0.1, d, 0.1, { color: 'muted', width: 1 }); if (d % 90 === 0) t.text(`${d}°`, d, 0, { dy: 14, align: 'center', size: 10.5, color: 'muted' }); }
          const A = deg(a), B = deg(b), C = deg(c);
          t.rect(0, 0.18, A, 0.42, { fill: 'blue', fillAlpha: 0.5, stroke: false });
          if (A + B <= 360) t.rect(A, 0.18, A + B, 0.42, { fill: 'orange', fillAlpha: 0.5, stroke: false });
          else { t.rect(A, 0.18, 360, 0.42, { fill: 'orange', fillAlpha: 0.5, stroke: false }); t.rect(0, 0.5, A + B - 360, 0.74, { fill: 'orange', fillAlpha: 0.5, stroke: false }); t.text('wraps', 3, 0.62, { size: 10, color: 'orange', weight: 700, dx: 4 }); }
          t.dot(C, 0, { r: 6, color: 'gold' });
        });
        v.legend([['blue', 'z = cis θ'], ['orange', 'w = cis φ'], ['gold', 'zw = cis(θ + φ)', { dot: true }], ['purple', 'z⁻¹ = z̄', { dot: true }]]);
        v.readout(() => {
          const z = [Z.x, Z.y], w = [W.x, W.y], p = cmul(z, w), A = deg(arg0(...z)), B = deg(arg0(...w)), C = deg(arg0(...p));
          return `$\\theta = ${num(A, 1)}^\\circ$, $\\phi = ${num(B, 1)}^\\circ$: $zw = ${cxTex(p[0], p[1], 3)}$ has $|zw| = ${num(cabs(p), 6)}$ and angle $${num(C, 1)}^\\circ \\equiv ${num(A + B, 1)}^\\circ \\pmod{360^\\circ}$ ✓. $z\\cdot z^{-1} = z\\bar z = ${num(cmul(z, [z[0], -z[1]])[0], 6)}$ ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.24
    {
      num: '4.24',
      kind: 'Proposition',
      name: 'The circle group is a subgroup of ℂ*',
      statement: String.raw`The circle group $\mathbb T=\{z: |z|=1\}$ is a subgroup of the multiplicative group $\mathbb C^*$ of nonzero complex numbers.`,
      idea: String.raw`Subgroup test (3.30): $1\in\mathbb T$; if $|z|=|w|=1$ then $|zw|=|z||w|=1$ by 4.20; and $|z^{-1}|=1/|z|=1$. The same test fails for other circles: on $|z|=2$ the product of two points has modulus $4$ and $1$ is missing. Other subgroups of $\mathbb C^*$ include the positive reals, while the nonzero imaginary numbers are not closed ($i\cdot i=-1$).`,
      caption: String.raw`Pick a candidate subset $H$ of $\mathbb C^*$ and drag $z, w$ inside it. The test checks whether $1$, the product $zw$ (gold) and the inverse $z^{-1}$ (purple) stay in $H$; the faint dots are the powers $z^k$, $|k|\le6$. Only $\mathbb T$ and the positive reals pass every time.`,
      deps: ['alg-4.23a', 'alg-4.20', 'alg-3.30'],
      refs: ['Judson §4.2'],
      tags: ['circle group', 'subgroups'],
      viz(v) {
        const H = {
          T: { label: '$\\mathbb T$: $|z| = 1$', c: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; }, has: ([x, y]) => Math.abs(Math.hypot(x, y) - 1) < 1e-9, z0: cis(0.9), w0: cis(2.2), draw: (s) => s.circle(0, 0, 1, { color: 'green', width: 3, fill: false }) },
          C2: { label: '$|z| = 2$', c: (x, y) => { const r = Math.hypot(x, y) || 1; return [(2 * x) / r, (2 * y) / r]; }, has: ([x, y]) => Math.abs(Math.hypot(x, y) - 2) < 1e-9, z0: cis(0.6, 2), w0: cis(1.9, 2), draw: (s) => s.circle(0, 0, 2, { color: 'green', width: 3, fill: false }) },
          Rp: { label: 'positive reals', c: (x) => [clamp(x, 0.3, 3.8), 0], has: ([x, y]) => Math.abs(y) < 1e-9 && x > 0, z0: [1.6, 0], w0: [0.6, 0], draw: (s) => s.line(0.02, 0, 9, 0, { color: 'green', width: 4 }) },
          iR: { label: '$i\\mathbb R^*$ (imaginary)', c: (x, y) => [0, Math.abs(y) < 0.3 ? (y < 0 ? -0.3 : 0.3) : clamp(y, -3.8, 3.8)], has: ([x, y]) => Math.abs(x) < 1e-9 && Math.abs(y) > 1e-12, z0: [0, 1.5], w0: [0, -0.8], draw: (s) => { s.line(0, 0.04, 0, 9, { color: 'green', width: 4 }); s.line(0, -0.04, 0, -9, { color: 'green', width: 4 }); } },
        };
        const which = v.select('candidate $H$', Object.entries(H).map(([value, h]) => ({ value, label: h.label })), 'T', { onChange: (k) => { Z.set(...H[k].z0); W.set(...H[k].w0); } });
        const s = v.stage({ x: [-4.2, 4.2], y: [-4.2, 4.2], equal: true, axes: false, height: 400, full: true });
        const Z = s.handle(...H.T.z0, { color: 'blue', label: 'z', constrain: (x, y) => H[which.value].c(x, y) }), W = s.handle(...H.T.w0, { color: 'orange', label: 'w', constrain: (x, y) => H[which.value].c(x, y) });
        v.render(() => {
          const h = H[which.value], z = [Z.x, Z.y], w = [W.x, W.y], p = cmul(z, w), r2 = z[0] ** 2 + z[1] ** 2, iv = [z[0] / r2, -z[1] / r2];
          plane(v, s, { unit: which.value !== 'T' });
          h.draw(s);
          s.clip(() => {
            const pw = []; for (let k = -6; k <= 6; k++) { let q = [1, 0]; const b = k < 0 ? iv : z; for (let j = 0; j < Math.abs(k); j++) q = cmul(q, b); pw.push(q); }
            pw.forEach((q) => s.dot(q[0], q[1], { r: 3, color: h.has(q) ? 'green' : 'muted' }));
            const ok1 = h.has([1, 0]); s.dot(1, 0, { r: 7, hollow: true, color: ok1 ? 'green' : 'red' }); s.text('1', 1, 0, { dy: 16, align: 'center', size: 12, weight: 700, color: ok1 ? 'green' : 'red' });
            s.dot(p[0], p[1], { r: 7, color: 'gold' }); s.text(`zw ${h.has(p) ? '∈' : '∉'} H`, p[0], p[1], { dx: 10, dy: -12, size: 12.5, weight: 700, color: h.has(p) ? 'gold' : 'red', plate: true });
            s.dot(iv[0], iv[1], { r: 6, color: 'purple' }); s.text(`z⁻¹ ${h.has(iv) ? '∈' : '∉'} H`, iv[0], iv[1], { dx: 10, dy: 12, size: 12.5, weight: 700, color: h.has(iv) ? 'purple' : 'red', plate: true });
          });
        });
        v.readout(() => {
          const h = H[which.value], z = [Z.x, Z.y], w = [W.x, W.y], p = cmul(z, w), r2 = z[0] ** 2 + z[1] ** 2, iv = [z[0] / r2, -z[1] / r2];
          const a = h.has([1, 0]), b = h.has(p), c = h.has(iv);
          return `$1\\in H$ ${a ? '✓' : '✗'}, $zw = ${cxTex(p[0], p[1], 3)}$ (modulus $${num(cabs(p), 3)}$) $\\in H$ ${b ? '✓' : '✗'}, $z^{-1} = ${cxTex(iv[0], iv[1], 3)}\\in H$ ${c ? '✓' : '✗'}. ${a && b && c ? (which.value === 'T' || which.value === 'Rp' ? '**Every test passes — for all choices of $z, w$ in $H$: a subgroup of $\\mathbb C^*$.**' : 'This pair passes; move them.') : '**Not a subgroup.**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.24a
    {
      num: '4.24a',
      kind: 'Definition',
      name: 'nth roots of unity',
      statement: String.raw`A complex number $z$ with $z^n=1$, for a positive integer $n$, is an **$n$th root of unity**. Every root of unity lies in $\mathbb T$, since $|z|^n=1$ forces $|z|=1$.`,
      idea: String.raw`Writing $z=\operatorname{cis}\theta$, De Moivre (4.22) turns $z^n=1$ into $\operatorname{cis}(n\theta)=1$, i.e. $n\theta$ a multiple of $2\pi$. So the solutions are $\operatorname{cis}(2\pi k/n)$, $k=0,\ldots,n-1$ — exactly $n$ of them, as many as the degree of $z^n-1$ allows — and they are the vertices of a regular $n$-gon inscribed in the unit circle with a vertex at $1$.`,
      caption: String.raw`The background colours each point $z$ by the value of $z^n-1$ (hue = argument, bands = modulus); every hue meets at the zeros, the $n$th roots of unity, which form a regular $n$-gon. Drag the probe $z$: the readout shows $z^n$ and how far it is from $1$.`,
      deps: ['alg-4.23a', 'alg-4.22'],
      refs: ['Judson §4.2'],
      tags: ['roots of unity', 'complex numbers'],
      viz(v) {
        const N = v.slider('$n$', 1, 16, 7, { int: true });
        const s = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 400, full: true });
        const P = s.handle(...cis(0.35, 1.18), { color: 'gold', label: 'z', constrain: (x, y) => [clamp(x, -1.6, 1.6), clamp(y, -1.6, 1.6)] });
        v.render(() => {
          const n = N.value;
          s.domain((z) => { let w = new v.Cx(1, 0); for (let k = 0; k < n; k++) w = w.mul(z); return w.sub(new v.Cx(1, 0)); }, { key: `rou${n}`, fade: 0.45, res: 2 });
          plane(v, s, { unit: false }); s.circle(0, 0, 1, { color: 'ink', width: 1.4, dash: [4, 4], fill: false });
          const R = Array.from({ length: n }, (_, k) => cis((TAU * k) / n));
          if (n > 2) s.poly(R, { color: 'ink', width: 2, fill: false }); else if (n === 2) s.line(-1, 0, 1, 0, { color: 'ink', width: 2 });
          R.forEach(([x, y], k) => { s.dot(x, y, { r: 7, color: 'panel' }); s.dot(x, y, { r: 4.5, color: 'ink' }); if (n <= 12) s.text(`$${wTex(k)}$`, x * 1.16, y * 1.16, { align: 'center', size: 13, plate: true }); });
        });
        v.readout(() => {
          const n = N.value, z = [P.x, P.y]; let w = [1, 0]; for (let k = 0; k < n; k++) w = cmul(w, z);
          const maxErr = Math.max(...Array.from({ length: n }, (_, k) => { let q = [1, 0]; const r = cis((TAU * k) / n); for (let j = 0; j < n; j++) q = cmul(q, r); return Math.hypot(q[0] - 1, q[1]); }));
          return `The ${n} roots $\\operatorname{cis}(2\\pi k/${n})$ satisfy $z^{${n}} = 1$ (largest error $${v.sci(maxErr, 2)}$) ✓. Probe: $z = ${cxTex(z[0], z[1], 3)}$, $z^{${n}} = ${cxTex(w[0], w[1], 3)}$, $|z^{${n}} - 1| = ${num(Math.hypot(w[0] - 1, w[1]), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.25
    {
      num: '4.25',
      kind: 'Theorem',
      name: 'The nth roots of unity form a cyclic group of order n',
      statement: String.raw`The solutions of $z^n=1$ are $z=\operatorname{cis}\left(\frac{2k\pi}{n}\right)$, $k=0,1,\ldots,n-1$, and these $n$th roots of unity form a cyclic subgroup of $\mathbb T$ of order $n$, generated by $\omega=\operatorname{cis}(2\pi/n)$.`,
      idea: String.raw`De Moivre (4.22) gives the list and shows that $\omega^k=\operatorname{cis}(2\pi k/n)$, so the roots are exactly the powers of $\omega$, distinct for $0\le k<n$ and with $\omega^n=1$. Products and inverses of roots of unity are roots of unity ($(zw)^n=z^nw^n=1$), so they form a subgroup of $\mathbb T$, and $\omega^i\omega^j=\omega^{(i+j)\bmod n}$: multiplying roots is adding exponents mod $n$ — a copy of $\mathbb Z_n$.`,
      caption: String.raw`Click two roots ($\omega^i$ blue, then $\omega^j$ orange): the product, computed as complex numbers, lands on $\omega^{i+j}$ (gold), the angles adding. The faint arrows are the powers of $\omega$ visiting every vertex. The multiplication table on the right (entry $k$ means $\omega^k$) is the addition table of $\mathbb Z_n$.`,
      deps: ['alg-4.22', 'alg-4.24a', 'alg-4.4a'],
      see: ['algo-4.8'],
      refs: ['Judson §4.2'],
      tags: ['roots of unity', 'cyclic groups'],
      viz(v) {
        let sel = [2, 3], turn = 0;
        const N = v.slider('$n$', 2, 12, 8, { int: true, onChange: (n) => { sel = sel.map((x) => x % n); } });
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.38, 1.38], equal: true, axes: false, height: 340 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const T = v.table(t, { rows: 8, cols: 8, maxCell: 30, size: 11.5, labelSize: 11, margin: 4 });
        const at = (k, n) => cis((TAU * k) / n);
        s.onClick((x, y) => { const n = N.value; let b = -1, bd = 22; for (let k = 0; k < n; k++) { const [px, py] = at(k, n), d = Math.hypot(s.X(px) - s.X(x), s.Y(py) - s.Y(y)); if (d < bd) { bd = d; b = k; } } if (b >= 0) { sel[turn] = b; turn ^= 1; } });
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        v.render(() => {
          const n = N.value, [i, j] = sel, kk = (i + j) % n, p = cmul(at(i, n), at(j, n));
          s.circle(0, 0, 1, { color: 'faint', width: 1.4, fill: false }); s.line(-1.4, 0, 1.4, 0, { color: 'faint', width: 1 }); s.line(0, -1.35, 0, 1.35, { color: 'faint', width: 1 });
          for (let k = 0; k < n; k++) { const [x0, y0] = at(k, n), [x1, y1] = at(k + 1, n); s.arrow(x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, x1 - (x1 - x0) * 0.12, y1 - (y1 - y0) * 0.12, { color: 'faint', width: 1.4, head: 6 }); }
          const A = (TAU * i) / n, B = (TAU * j) / n;
          arc(v, s, 0.32, 0, A, { color: 'blue', width: 3 }); arc(v, s, 0.32, A, A + B, { color: 'orange', width: 3, head: true });
          for (let k = 0; k < n; k++) {
            const [x, y] = at(k, n), col = k === kk ? 'gold' : k === i ? 'blue' : k === j ? 'orange' : 'muted';
            s.dot(x, y, { r: col === 'muted' ? 5 : 7.5, color: col });
            s.text(`$${wTex(k)}$`, x * 1.19, y * 1.19, { align: 'center', size: 13.5, color: col === 'muted' ? 'ink' : col });
          }
          s.dot(p[0], p[1], { r: 12, hollow: true, color: 'gold' });
          T.draw({ rows: n, cols: n, rowLabels: (r) => `$${wTex(r)}$`, colLabels: (c) => `$${wTex(c)}$`, cornerLabel: '$\\cdot$', value: (r, c) => (r + c) % n, fill: (r, c) => [elColor(v, (r + c) % n, n), 0.26], highlight: [[i, j, 'gold']], activeRow: i, activeCol: j });
          t.corner('entry k = ωᵏ', 'tl', { size: 11.5 });
        });
        v.readout(() => {
          const n = N.value, [i, j] = sel, p = cmul(at(i, n), at(j, n)), kk = (i + j) % n, q = at(kk, n);
          let x = [1, 0]; const seen = new Set(); for (let k = 0; k < n; k++) { seen.add(Math.round(((arg0(...x) / TAU) * n)) % n); x = cmul(x, at(1, n)); }
          return `$${wTex(i)}\\cdot ${wTex(j)} = ${cxTex(p[0], p[1], 3)} = ${wTex(kk)}$ (error $${v.sci(Math.hypot(p[0] - q[0], p[1] - q[1]), 1)}$): exponents add mod ${n}, ${i} + ${j} ≡ ${kk} ✓. The powers of $\\omega$ hit all ${seen.size} of ${n} roots ${seen.size === n ? '✓' : '✗'}, so the group is cyclic of order ${n}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.25a
    {
      num: '4.25a',
      kind: 'Definition',
      name: 'Primitive nth roots of unity',
      statement: String.raw`A generator of the group of $n$th roots of unity is a **primitive $n$th root of unity**. They are the $\omega^k=\operatorname{cis}(2\pi k/n)$ with $\gcd(k,n)=1$, so there are $\varphi(n)$ of them; each other $n$th root of unity is a primitive $d$th root of unity for exactly one divisor $d$ of $n$.`,
      idea: String.raw`The group of $n$th roots of unity is cyclic of order $n$ generated by $\omega$ (4.25), so by Theorem 4.13 the order of $\omega^k$ is $n/\gcd(k,n)$ — it is a generator exactly when $\gcd(k,n)=1$ (Corollary 4.14). Sorting all $n$ roots by their order $d$ splits them into the primitive $d$th roots for $d\mid n$, which proves $\sum_{d\mid n}\varphi(d)=n$. Judson’s example: the primitive 8th roots are $\omega,\omega^3,\omega^5,\omega^7$.`,
      caption: String.raw`The $n$th roots of unity are coloured by their order $d$ (the size of the subgroup each one generates); the primitive ones (order $n$) are large and ringed. Click a root to draw the polygon of its powers. The bar below sorts all $n$ roots by order: blocks of $\varphi(d)$ for each $d\mid n$.`,
      deps: ['alg-4.25', 'alg-4.13'],
      refs: ['Judson §4.2'],
      tags: ['roots of unity', 'generators'],
      viz(v) {
        let sel = 3;
        const N = v.slider('$n$', 1, 30, 8, { int: true });
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.38, 1.38], equal: true, axes: false, height: 340, full: true });
        const t = v.stage({ x: [0, 1], y: [-0.6, 1], axes: false, height: 90, full: true });
        s.onClick((x, y) => { const n = N.value; let b = -1, bd = 22; for (let k = 0; k < n; k++) { const [px, py] = cis((TAU * k) / n), d = Math.hypot(s.X(px) - s.X(x), s.Y(py) - s.Y(y)); if (d < bd) { bd = d; b = k; } } if (b >= 0) sel = b; });
        const PAL = ['blue', 'orange', 'purple', 'teal', 'pink', 'red', 'gold'], colOf = (d, n) => (d === n ? 'green' : PAL[divisors(n).indexOf(d) % PAL.length]);
        v.render(() => {
          const n = N.value, S = sel % n, D = divisors(n), ordOf = (k) => n / gcd(k, n);
          s.circle(0, 0, 1, { color: 'faint', width: 1.4, fill: false });
          const W = starWalk(n, S).map((k) => cis((TAU * k) / n)); s.path(W, { color: colOf(ordOf(S), n), width: 2.2 });
          for (let k = 0; k < n; k++) {
            const [x, y] = cis((TAU * k) / n), d = ordOf(k), prim = d === n;
            if (prim) s.dot(x, y, { r: 12, hollow: true, color: 'gold' });
            s.dot(x, y, { r: prim ? 7.5 : 5, color: colOf(d, n) });
            if (n <= 16) s.text(`$${wTex(k)}$`, x * 1.2, y * 1.2, { align: 'center', size: 12.5 });
          }
          s.corner(`$${wTex(S)}$: order ${ordOf(S)}${ordOf(S) === n ? ' (primitive)' : ''}`, 'tl', { size: 13, weight: 700, color: 'ink' });
          let x0 = 0; const w = 1 / n;
          for (const d of D) { const c = phi(d); t.rect(x0 + 0.002, 0.15, x0 + c * w - 0.002, 0.85, { fill: colOf(d, n), fillAlpha: 0.55, color: colOf(d, n), width: 1 }); if (c * w * t.width > 34) t.text(`order ${d}: ${c}`, x0 + (c * w) / 2, 0.5, { align: 'center', size: 11, weight: 700 }); x0 += c * w; }
          t.text(`n = ${D.map((d) => `φ(${d})`).join(' + ')} = ${D.map(phi).join(' + ')} = ${n}`, 0.5, -0.3, { align: 'center', size: 11.5, color: 'muted' });
        });
        v.readout(() => {
          const n = N.value, pr = [...Array(n).keys()].filter((k) => gcd(k, n) === 1);
          return `Primitive ${n}th roots of unity: $${pr.map(wTex).join(', ')}$ — $\\varphi(${n}) = ${phi(n)}$ of them, the exponents coprime to ${n}. Sum over divisors: $${divisors(n).map((d) => phi(d)).join(' + ')} = ${divisors(n).reduce((a, d) => a + phi(d), 0)}$ ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.28
    {
      num: '4.28',
      kind: 'Algorithm',
      name: 'Method of repeated squares',
      statement: String.raw`To compute $a^e \bmod m$, write the exponent in binary, $e=2^{k_1}+2^{k_2}+\cdots+2^{k_t}$. Compute the successive squares $a^{2^0}, a^{2^1}, a^{2^2},\ldots \pmod m$, each the square of the previous one reduced mod $m$, and multiply together (mod $m$) those $a^{2^{k_j}}$ whose bit is $1$. This takes about $2\log_2 e$ multiplications instead of $e-1$, and no number ever exceeds $m^2$. Judson’s example: $271^{321}\equiv 47\pmod{481}$, with $321=2^0+2^6+2^8$.`,
      idea: String.raw`It is the laws of exponents (3.31) in the cyclic group generated by $a$ in $U(m)$ (or in the monoid $\mathbb Z_m$): $a^{2^{i+1}}=(a^{2^i})^2$ and $a^{x+y}=a^xa^y$, together with the fact that reduction mod $m$ respects products. The binary expansion comes from repeated division by $2$ (2.9). This is what makes RSA (Chapter 7) practical: exponents with hundreds of digits need only a few thousand multiplications.`,
      caption: String.raw`Step through: the table first fills the column of successive squares, then multiplies in the rows whose bit of the exponent is $1$ (gold). Change the base, exponent and modulus; the readout checks the result against an independent big-integer computation and counts multiplications against the naive $e-1$.`,
      deps: ['alg-3.31', 'alg-2.9'],
      see: ['algo-2.12', 'crypto-7.2'],
      refs: ['Judson §4.3'],
      tags: ['algorithm', 'modular arithmetic'],
      viz(v) {
        const A = v.slider('base $a$', 2, 999, 271, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const E = v.slider('exponent $e$', 1, 4095, 321, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const M = v.slider('modulus $m$', 2, 999, 481, { int: true, onChange: () => S.reset({ at: 'end' }) });
        v.button('Judson: 271³²¹ mod 481', () => { A.set(271); E.set(321); M.set(481); S.reset({ at: 'end' }); });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, full: true });
        const T = v.table(st, { rows: 9, cols: 6, square: false, cellAspect: 2.2, maxCell: 34, minCell: 14, size: 12.5, margin: 6, colWeights: [0.6, 0.9, 0.6, 1.5, 1.3, 1.6], colLabels: ['$i$', '$2^i$', 'bit', '$a^{2^i}\\bmod m$', 'running', 'product so far'] });
        const plan = () => {
          const a = A.value, e = E.value, m = M.value, L = Math.floor(Math.log2(e)) + 1, sq = [a % m];
          for (let i = 1; i < L; i++) sq.push((sq[i - 1] * sq[i - 1]) % m);
          const bits = Array.from({ length: L }, (_, i) => (e >> i) & 1), acc = []; let r = null;
          for (let i = 0; i < L; i++) { if (bits[i]) r = r == null ? sq[i] : (r * sq[i]) % m; acc.push(r); }
          return { a, e, m, L, sq, bits, acc, res: r };
        };
        const S = v.steps({
          frames: () => {
            const P = plan(), fr = [];
            for (let i = 0; i < P.L; i++) fr.push({ ph: 'sq', i, note: i === 0 ? `$a^{2^0} = ${P.a} \\equiv ${P.sq[0]} \\pmod{${P.m}}$.` : `$a^{2^{${i}}} = (a^{2^{${i - 1}}})^2 \\equiv ${P.sq[i - 1]}^2 = ${P.sq[i - 1] ** 2} \\equiv ${P.sq[i]} \\pmod{${P.m}}$.` });
            let prev = null;
            for (let i = 0; i < P.L; i++) if (P.bits[i]) { const cur = P.acc[i]; fr.push({ ph: 'mul', i, note: prev == null ? `Bit ${i} is the first 1: start with $${P.sq[i]}$.` : `Bit ${i} is 1: $${prev}\\cdot ${P.sq[i]} = ${prev * P.sq[i]} \\equiv ${cur} \\pmod{${P.m}}$.` }); prev = cur; }
            fr.push({ ph: 'done', i: P.L, note: `$${P.a}^{${P.e}} \\equiv ${P.res} \\pmod{${P.m}}$.` });
            return fr;
          },
          start: 'end', still: 'end', speed: 1.5,
        });
        v.render(() => {
          const P = plan(), f = S.frame, ph = f.ph || 'done', fi = f.i ?? P.L;
          const sqShown = ph === 'sq' ? fi : P.L - 1, mulShown = ph === 'mul' ? fi : ph === 'done' ? P.L : -1;
          T.draw({
            rows: P.L,
            value: (i, j) => {
              if (j === 0) return i; if (j === 1) return 2 ** i; if (j === 2) return P.bits[i];
              if (j === 3) return i <= sqShown ? P.sq[i] : null;
              if (j === 4) return P.bits[i] && i <= mulShown ? `× ${P.sq[i]}` : null;
              return P.bits[i] && i <= mulShown ? P.acc[i] : null;
            },
            fill: (i, j) => (ph === 'sq' && i === fi && j === 3 ? ['accent', 0.45] : ph === 'mul' && i === fi && j >= 3 ? ['gold', 0.55] : P.bits[i] && (j === 2 || (j >= 4 && i <= mulShown)) ? ['gold', 0.18] : null),
            textColor: (i, j) => (j === 2 && !P.bits[i] ? 'muted' : 'ink'),
            weight: (i, j) => (j === 2 && P.bits[i] ? 800 : 500),
          });
        });
        v.readout(() => {
          const P = plan(), ref = v.M.modpow(BigInt(P.a), BigInt(P.e), BigInt(P.m)), pop = P.bits.reduce((x, y) => x + y, 0), mults = P.L - 1 + pop - 1;
          const bin = P.bits.map((b, i) => (b ? `2^{${i}}` : null)).filter(Boolean).join(' + ');
          return `$${P.e} = ${bin}$ $= (${P.e.toString(2)})_2$. Result $${P.a}^{${P.e}} \\equiv ${P.res} \\pmod{${P.m}}$; independent check ${String(ref) === String(P.res) ? '✓' : '✗'}. Multiplications: ${P.L - 1} squarings + ${pop - 1} products $= ${mults}$, versus $${P.e - 1}$ the naive way.`;
        });
      },
    },
  ],
};
