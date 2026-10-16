// Numerical Analysis — Chapter 1: Floating point and the anatomy of error (items 1.1–1.6; 1.7–1.12 in ch01-b.js)
import {
  FORMATS, clamp, logspace, sci, tsci, rnd, mkOps, encode, decode, fieldsOf, nextUp, nextDown, ulpOf, floorLog2,
  decomp, ratioNum, exactSum, errVs, ratOfDouble, ratOfLiteral, ratSub, ratAdd, ratNum, cmpRat, exactDecimal, clip,
  naiveSum, kahanSum, pairwiseSum, twoSum, twoProd, px, exNum, isqrt,
} from './ch01.shared.js';

/** Word-wrap a string to lines of at most n characters. */
function wrap(str, n) { const out = []; let cur = ''; for (const w of str.split(' ')) { if ((cur + ' ' + w).length > n && cur) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; }

export default {
  collection: 'num',
  chapter: 1,
  title: 'Floating point and the anatomy of error',
  summary: String.raw`Every numerical computation mixes two kinds of error: truncation error from replacing an infinite process by a finite one, and rounding error from storing real numbers in floating point. Most numerical disasters come from a handful of traps — subtracting nearly equal numbers, summing long lists naively, running a recurrence in its unstable direction, overflowing an exponential. Each has a standard cure, and the balance between truncation and rounding decides the best step size of a finite difference.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Invention',
      name: 'The IEEE 754 floating-point standard',
      statement: String.raw`IEEE 754 fixes how real numbers are stored and combined in binary floating point. A number is a **sign** bit $s$, a biased **exponent** field $E$ and a **fraction** field $F$ of $f$ bits; for the common formats ($f=10,23,52$ with $5,8,11$ exponent bits and bias $2^{k-1}-1$) a normal number is
$$x=(-1)^s\Big(1+\frac{F}{2^{f}}\Big)2^{E-\text{bias}},\qquad 0<E<2^{k}-1,$$
with subnormals ($E=0$, no hidden bit), $\pm0$, $\pm\infty$ and NaN filling the remaining patterns. Every basic operation $+,-,\times,\div,\sqrt{\ }$ returns the **correctly rounded** exact result (default: to nearest, ties to even), so for normal results $\mathrm{fl}(a\ \mathrm{op}\ b)=(a\ \mathrm{op}\ b)(1+\delta)$ with $|\delta|\le u=2^{-p}$, where $p=f+1$ is the precision. The gap between neighbouring floats doubles with each power of two.`,
      idea: String.raw`Normalising the significand to $1.f$ makes the leading bit implicit, and storing the exponent separately gives a number line whose spacing is *relative*: constant inside a binade $[2^e,2^{e+1})$ and doubling at its end, so the relative spacing stays between $2^{-p}$ and $2^{1-p}$. Correct rounding, one exactly-specified answer per operation, is what makes arithmetic portable and error analysis possible: each operation commits one relative error of at most $u$, and everything else in this chapter is the study of how those errors accumulate.`,
      caption: String.raw`Type a number (a decimal like 0.1, or a formula like 1/3 or pi) and pick a format. **Click any bit** to flip it and watch the value change. The ruler below shows the two floats around your number and where each rounding mode sends it; the readout gives the exact stored value, the error, and the machine epsilon measured by halving until $1+\varepsilon$ rounds to $1$.`,
      deps: ['nla-3.6'],
      refs: ['Süli–Mayers ch. 2'],
      credit: 'IEEE 754-1985 (first edition); W. Kahan was a principal architect of the standard and of the Intel 8087 that preceded it. Revised 2008, 2019.',
      scope: String.raw`Binary formats only here; IEEE 754-2008 also defines decimal formats. Results are correctly rounded for $+,-,\times,\div,\sqrt{\ }$ and fused multiply-add, but not necessarily for $\sin,\exp,\dots$`,
      tags: ['floating point', 'IEEE 754'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/IEEE_754' },
      viz(v) {
        let fmtSel = 'double', T = null, bits = null, edited = false;
        const eps = {};
        for (const F of Object.values(FORMATS)) { let e = 1; while (rnd(1 + e / 2, F) > 1) e /= 2; eps[F.key] = Math.log2(e); }
        const fmt = v.select('format', [{ value: 'half', label: 'binary16' }, { value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double', { onChange: (k) => { fmtSel = k; recompute(); } });
        const inp = v.input('x =', '0.1', { vars: [], width: 150, placeholder: 'e.g. 0.1, 1/3, 2^53+1', onChange: () => recompute() });
        const presets = [['0.1', '0.1'], ['1/3', '1/3'], ['π', 'pi'], ['2⁵³+1', '9007199254740993'], ['1e23', '1e23'], ['70000', '70000'], ['1e-8', '1e-8']];
        for (const [lab, src] of presets) v.button(lab, () => { inp.set(src); recompute(); });
        function recompute() {
          const F = FORMATS[fmtSel], src = inp.value; edited = false;
          let R = ratOfLiteral(src), td = R ? Number(src) : (inp.fn ? inp.fn() : NaN);
          if (!R && Number.isFinite(td)) R = ratOfDouble(td);
          T = R ? { R, td } : null; bits = T ? encode(T.td, F) : encode(NaN, F);
        }
        recompute();
        const sA = v.stage({ axes: false, height: 205, full: true, minWidth: 300 });
        const sB = v.stage({ axes: false, height: 215, full: true, minWidth: 300 });
        let cells = [];
        sA.onClick((x, y) => {
          const F = FORMATS[fmtSel];
          for (const c of cells) if (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1) { bits[c.i] ^= 1; edited = true; return; }
        });
        v.render(() => {
          const F = FORMATS[fmtSel], { w, h, Y } = px(sA), n = 1 + F.eb + F.fb;
          cells = [];
          const rows = F.fb > 32 ? 2 : 1, per = Math.ceil(F.fb / rows), maxPer = Math.max(1 + F.eb, per);
          const c = Math.min(30, (w - 28) / maxPer), gap = 3;
          const cell = (i, x0, py) => {
            const col = i === 0 ? 'red' : i <= F.eb ? 'orange' : 'accent', b = bits[i];
            sA.rect(x0, Y(py + c), x0 + c - 1.5, Y(py), { fill: col, fillAlpha: b ? 0.6 : 0.07, color: col, width: 1.2, radius: 3 });
            sA.text(String(b), x0 + (c - 1.5) / 2, Y(py + c / 2), { align: 'center', baseline: 'middle', size: c > 17 ? 13 : 10, weight: 700, color: b ? 'ink' : 'muted', halo: false });
            cells.push({ i, x0, x1: x0 + c - 1.5, y0: Y(py + c), y1: Y(py) });
          };
          const topW = (1 + F.eb) * c + gap, x0 = (w - Math.max(topW, per * c)) / 2;
          const py0 = 30;
          cell(0, x0, py0); for (let i = 1; i <= F.eb; i++) cell(i, x0 + i * c + gap, py0);
          sA.text('sign', x0 + c / 2, Y(14), { align: 'center', size: 11, color: 'red', weight: 700 });
          sA.text(`exponent (${F.eb} bits)`, x0 + gap + c + F.eb * c / 2, Y(14), { align: 'center', size: 11, color: 'orange', weight: 700 });
          const fy = py0 + c + 30;
          sA.text(`fraction (${F.fb} bits)`, x0 + per * c / 2, Y(fy - 14), { align: 'center', size: 11, color: 'accent', weight: 700 });
          for (let r = 0; r < rows; r++) for (let k = 0; k < per; k++) { const i = 1 + F.eb + r * per + k; if (i < n) cell(i, x0 + k * c, fy + r * (c + 3)); }
          const { s, E, F: Fr } = fieldsOf(bits, F), top = (1 << F.eb) - 1;
          const info = E === top ? (Fr === 0n ? '∞' : 'NaN') : E === 0 ? `subnormal / zero: e = ${1 - F.bias}` : `E = ${E}  →  e = E − ${F.bias} = ${E - F.bias}`;
          sA.text(info, w / 2, Y(h - 12), { align: 'center', size: 12, color: 'muted' });
          sA.corner(edited ? 'bits edited by hand' : 'click a bit to flip it', 'tr', { color: edited ? 'gold' : 'faint' });
        });
        v.render(() => {
          const F = FORMATS[fmtSel], { w, h, Y } = px(sB);
          if (!T) { sB.text('enter a number', w / 2, Y(h / 2), { align: 'center', color: 'muted' }); return; }
          const Rt = T.R;
          let c = rnd(T.td, F), lo, hi;
          if (!Number.isFinite(c)) { sB.text(`${T.td > 0 ? '+' : '−'}∞ after rounding: |x| is beyond the largest ${F.name} number ${sci(F.max, 6)}`, w / 2, Y(h / 2), { align: 'center', color: 'red', size: 13 }); return; }
          const sg = cmpRat(c, Rt);
          if (sg === 0) { lo = hi = c; } else if (sg < 0) { lo = c; hi = nextUp(c, F); } else { hi = c; lo = nextDown(c, F); }
          const xl = w * 0.28, xr = w * 0.72, X = (p) => xl + p * (xr - xl), ay = 62;
          sB.line(w * 0.06, Y(ay), w * 0.94, Y(ay), { color: 'faint', width: 1.5 });
          const tick = (p, label, col) => {
            sB.line(X(p), Y(ay - 9), X(p), Y(ay + 9), { color: col, width: 2.5 });
            sB.text(label, X(p), Y(ay - 20), { align: 'center', size: 10.5, color: col, halo: false });
          };
          const fmtv = (x) => (Math.abs(x) < 1e-4 || Math.abs(x) >= 1e16 ? x.toExponential(F.key === 'half' ? 6 : F.key === 'single' ? 10 : 16) : x.toPrecision(F.key === 'half' ? 7 : F.key === 'single' ? 10 : 17));
          const modes = [['nearest-even', 'near'], ['toward 0', 'zero'], ['toward +∞', 'up'], ['toward −∞', 'down']];
          if (lo === hi) {
            tick(0.5, fmtv(lo), 'green');
            sB.text('x is exactly representable: every rounding mode returns it', w / 2, Y(ay + 40), { align: 'center', size: 13, color: 'green', weight: 600 });
            sB.text(`neighbours: ${fmtv(nextDown(lo, F))}   and   ${fmtv(nextUp(lo, F))}`, w / 2, Y(ay + 64), { align: 'center', size: 11, color: 'muted' });
            sB.text(`spacing here: ${tsci(nextUp(lo, F) - lo, 3).replace(/\\times10\^\{(-?\d+)\}/, '×10^$1')}`, w / 2, Y(ay + 84), { align: 'center', size: 11, color: 'muted' });
            return;
          }
          const gapv = hi - lo, p = ratNum(ratSub(Rt, ratOfDouble(lo))) / gapv;
          tick(0, fmtv(lo), 'accent'); tick(1, fmtv(hi), 'accent');
          sB.line(X(0.5), Y(ay - 4), X(0.5), Y(ay + 4), { color: 'muted', width: 1, dash: true });
          sB.text('midpoint', X(0.5), Y(ay + 18), { align: 'center', size: 10, color: 'muted' });
          sB.line(X(p), Y(ay + 46 + modes.length * 24), X(p), Y(ay), { color: 'gold', width: 1.3, dash: [3, 3] });
          sB.dot(X(p), Y(ay), { r: 6, color: 'gold' });
          sB.text('x', X(p), Y(ay - 20 + 0), { align: 'center', size: 12, color: 'gold', weight: 800, dy: -12 });
          modes.forEach(([nm, md], k) => {
            const yy = ay + 52 + k * 24, pos = Rt.N > 0n, chosen = md === 'zero' ? (pos ? 0 : 1) : md === 'up' ? 1 : md === 'down' ? 0 : p < 0.5 ? 0 : p > 0.5 ? 1 : (encode(lo, F)[bits.length - 1] === 0 ? 0 : 1), col = nm === 'nearest-even' ? 'green' : 'purple';
            sB.text(nm, 12, Y(yy), { size: 11.5, color: 'ink', baseline: 'middle' });
            sB.arrow(X(p), Y(yy), X(chosen), Y(yy), { color: col, width: 2.2, head: 7 });
            sB.dot(X(chosen), Y(yy), { r: 4, color: col });
          });
          sB.text(`gap = ${sci(gapv, 3)}`, w - 12, Y(ay - 20), { align: 'right', size: 10.5, color: 'muted' });
        });
        v.readout(() => {
          const F = FORMATS[fmtSel], { s, E, F: Fr } = fieldsOf(bits, F), val = decode(bits, F);
          const lines = [];
          const top = (1 << F.eb) - 1;
          if (E === top) lines.push(Fr === 0n ? `The pattern is **${s ? '−' : '+'}∞** (all exponent bits 1, fraction 0).` : 'The pattern is **NaN** (all exponent bits 1, fraction nonzero).');
          else if (E === 0) lines.push(`Exponent field $E=0$: **subnormal** (no hidden bit): $x=(-1)^{${s}}\\cdot\\dfrac{${Fr}}{2^{${F.fb}}}\\cdot 2^{${1 - F.bias}}$.`);
          else lines.push(`$x=(-1)^{${s}}\\big(1+\\tfrac{F}{2^{${F.fb}}}\\big)2^{E-${F.bias}}$ with $E=${E}$, $F=${Fr}$, so $x=(-1)^{${s}}\\times 1.${Fr.toString(2).padStart(F.fb, '0').slice(0, 14)}\\ldots_{(2)}\\times 2^{${E - F.bias}}$.`);
          if (Number.isFinite(val)) {
            lines.push(`Stored value, exactly: **${clip(exactDecimal(val), 44)}**`);
            if (T && Number.isFinite(T.td)) {
              const err = ratNum(ratSub(ratOfDouble(val), T.R)), rel = T.R.N === 0n ? 0 : err / ratNum(T.R);
              lines.push(`Typed value ${edited ? '(bits were edited)' : ''}: error $\\mathrm{fl}(x)-x=${tsci(err, 3)}$, relative $${tsci(Math.abs(rel), 3)}$ ${Math.abs(rel) <= F.u * 1.0000001 ? `$\\le u=2^{-${F.p}}=${tsci(F.u, 3)}$` : `$> u=${tsci(F.u, 3)}$ (${edited ? 'you flipped bits' : 'subnormal or overflow range'})`}. Spacing of floats here: $2^{${Math.max(floorLog2(Math.abs(val) || F.tiny), F.emin) - F.fb}}$.`);
            }
          }
          lines.push(`Machine epsilon, measured by halving $\\varepsilon$ until $\\mathrm{fl}(1+\\varepsilon/2)=1$: binary16 $2^{${eps.half}}$, binary32 $2^{${eps.single}}$, binary64 $2^{${eps.double}}$ (the gap between $1$ and the next float; $u=\\varepsilon/2$).`);
          return lines.join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Absolute and relative error',
      statement: String.raw`If $\hat x$ approximates $x\neq0$, the **absolute error** is $|\hat x-x|$ and the **relative error** is $|\hat x-x|/|x|$. Absolute error has the units of $x$ and says how far off we are; relative error is dimensionless and says how many leading digits are right: relative error $\approx10^{-d}$ means about $d$ correct significant digits. Floating-point arithmetic is designed around the second notion: the rounding error of each operation is bounded *relatively* by $u$, never absolutely.`,
      idea: String.raw`The same absolute error $\varepsilon$ is catastrophic for a quantity of size $\varepsilon$ and invisible for one of size $10^{20}\varepsilon$, so the useful measure of accuracy scales with the quantity. Taking logarithms, $-\log_{10}(\text{relative error})$ counts correct digits, which is why log–log plots (slope $-1$ for fixed absolute error) are the natural picture. Near zero relative error is not meaningful (use a mixed absolute/relative tolerance).`,
      caption: String.raw`Eight quantities from $10^{-10}$ m to $10^{21}$ m. In **same absolute error** mode every object is off by the same number of metres: drag the slider and see the atom become meaningless while the galaxy keeps all its digits. **Same relative error** flips this. The **binary32** and **binary64** modes show the actual rounding error of storing each size: always below $u$, whatever the scale.`,
      deps: ['nla-3.7'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['error', 'floating point'],
      viz(v) {
        const THINGS = [
          ['hydrogen atom', '1.06e-10'], ['DNA helix width', '2e-9'], ['red blood cell', '7e-6'], ['a person', '1.7'],
          ['Mount Everest', '8848.86'], ['Earth radius', '6.371e6'], ['Earth–Sun', '1.496e11'], ['Milky Way', '9.5e20'],
        ].map(([n, s]) => ({ n, s: Number(s), R: ratOfLiteral(s) }));
        const mode = v.select('same', [{ value: 'abs', label: 'absolute error' }, { value: 'rel', label: 'relative error' }, { value: 'single', label: 'binary32 rounding' }, { value: 'double', label: 'binary64 rounding' }], 'abs', { onChange: syncUi });
        const sa = v.slider('absolute error $\\varepsilon$ (m)', 1e-9, 1e9, 1, { log: true });
        const sr = v.slider('relative error', 1e-12, 1, 1e-3, { log: true });
        function syncUi() { sa.el.hidden = mode.value !== 'abs'; sr.el.hidden = mode.value !== 'rel'; }
        syncUi();
        const errs = () => THINGS.map((t) => {
          let a;
          if (mode.value === 'abs') a = sa.value; else if (mode.value === 'rel') a = sr.value * t.s;
          else { const c = rnd(t.s, FORMATS[mode.value]); a = Math.abs(ratNum(ratSub(ratOfDouble(c), t.R))); }
          return { ...t, abs: a, rel: Math.max(a / t.s, 1e-40) };
        });
        const s1 = v.stage({ x: [1e-11, 1e22], y: [1e-30, 1e20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'true size (m)', ylabel: 'relative error', title: 'relative error of each approximation' });
        const s2 = v.stage({ axes: false, height: 330, title: 'correct significant digits ≈ −log₁₀(relative error)' });
        v.render(() => {
          const E = errs();
          s1.hband(1, 1e30, { color: 'red', alpha: 0.07 });
          s1.hline(1, { color: 'red', dash: true });
          s1.text('error ≥ 100 %: no correct digit', 5e21, 1e17, { size: 11, color: 'red', align: 'right' });
          s1.hline(FORMATS.double.u, { color: 'green', dash: true, alpha: 0.7 });
          s1.text('u = 2⁻⁵³', 2e-11, FORMATS.double.u * 4, { size: 11, color: 'green', align: 'left' });
          if (mode.value === 'abs') s1.fn((x) => sa.value / x, { color: 'muted', width: 1.2, dash: true });
          if (mode.value === 'rel') s1.hline(sr.value, { color: 'muted', width: 1.2, dash: true });
          E.forEach((e, k) => {
            const col = e.rel >= 1 ? 'red' : e.rel > 1e-3 ? 'gold' : 'green';
            s1.dot(e.s, e.rel, { r: 6, color: col });
            s1.text(e.n, e.s, e.rel, { size: 10.5, align: 'center', dy: k % 2 ? 15 : -13, color: 'ink' });
          });
          const { w, h, Y } = px(s2), left = 112, top = 34, rh = (h - top - 26) / E.length, bw = w - left - 62;
          for (let d = 0; d <= 20; d += 5) {
            const x = left + (d / 20) * bw;
            s2.line(x, Y(top - 6), x, Y(h - 24), { color: 'grid', width: 1 });
            s2.text(String(d), x, Y(h - 10), { align: 'center', size: 10.5, color: 'muted' });
          }
          E.forEach((e, k) => {
            const d = clamp(-Math.log10(e.rel), 0, 20), y = top + k * rh;
            s2.text(e.n, left - 8, Y(y + rh / 2), { align: 'right', baseline: 'middle', size: 11.5, color: 'ink' });
            if (d > 0.02) s2.rect(left, Y(y + rh - 5), left + (d / 20) * bw, Y(y + 5), { fill: d < 1 ? 'red' : d < 3 ? 'gold' : 'green', fillAlpha: 0.55, color: d < 1 ? 'red' : d < 3 ? 'gold' : 'green', radius: 3 });
            s2.text(d < 0.05 ? '0 digits' : `${d.toFixed(1)}`, left + (d / 20) * bw + 6, Y(y + rh / 2), { baseline: 'middle', size: 11, color: 'muted' });
          });
        });
        v.legend([['red', 'no digit correct'], ['gold', 'a few digits'], ['green', 'many digits'], ['muted', 'the error level', { dash: true }]]);
        v.readout(() => {
          const E = errs(), mx = E.reduce((a, b) => (b.rel > a.rel ? b : a)), mn = E.reduce((a, b) => (b.rel < a.rel ? b : a)), pos = E.filter((e) => e.abs > 0), mxa = Math.max(...E.map((e) => e.abs));
          if (mode.value === 'abs') return `Every object is off by $\\varepsilon=${tsci(sa.value, 3)}$ m. Relative error: **${sci(mx.rel, 2)}** for the ${mx.n} (hopeless) down to **${sci(mn.rel, 2)}** for the ${mn.n} (about ${Math.floor(-Math.log10(mn.rel))} digits).`;
          if (mode.value === 'rel') return `Every object is off by ${sci(sr.value, 2)} of its size, i.e. about ${Math.max(0, Math.floor(-Math.log10(sr.value)))} correct digits each; absolute errors range from ${sci(E[0].abs, 2)} m (atom) to ${sci(E[7].abs, 2)} m (galaxy).`;
          const F = FORMATS[mode.value];
          return `Storing each size in ${F.name}: the relative error is at most **${sci(mx.rel, 2)}** (the largest, for the ${mx.n}), never above $u=${tsci(F.u, 3)}$, while the absolute errors range from ${sci(Math.min(...pos.map((e) => e.abs)), 2)} m up to ${sci(mxa, 2)} m. Floating point controls relative error${E.some((e) => e.abs === 0) ? ' (a size that happens to be a dyadic rational, like the Milky Way figure here, is stored exactly)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Phenomenon',
      name: 'Floating-point arithmetic is not associative',
      statement: String.raw`In floating point, addition is commutative but **not associative**: $(a+b)+c$ and $a+(b+c)$ can differ, so the computed sum of a list depends on the order of the additions. The classic instance is $0.1+0.2\neq0.3$ in binary64, because $0.1$, $0.2$, $0.3$ are not representable and the exact sum of the stored values lies exactly halfway between two floats and rounds to the one above $\mathrm{fl}(0.3)$. The spread over orderings is bounded by about $(n-1)\,u\sum|x_i|$ in the worst case and is catastrophic when huge terms cancel.`,
      idea: String.raw`Each addition rounds its exact result to the grid at the current magnitude (1.1), and which low-order bits are discarded depends on the size of the running total at that moment. Adding small numbers to a big total loses them; adding them to each other first keeps them. The error of one ordering is a sum of the rounding errors of its partial sums, so it changes with the order, and the standard bound is $|\hat s-s|\le(n-1)u\sum|x_i|+O(u^2)$.`,
      caption: String.raw`**Left:** the floats around the exact sum $a+b$ (edit $a,b,c$): the gold dot is the exact sum of the stored values, red is your decimal $c$, and the computed $\mathrm{fl}(a+b)$ rounds to a neighbour. **Right:** the same list summed in 2000 random orders; the histogram shows each order's error in units of $u\sum|x_i|$, with the standard orders marked. Try *big + small + (−big)*.`,
      deps: ['nla-3.7'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['floating point', 'summation'],
      viz(v) {
        const ia = v.input('a', '0.1', { vars: [], width: 90, onChange: () => 0 });
        const ib = v.input('b', '0.2', { vars: [], width: 90, onChange: () => 0 });
        const ic = v.input('c', '0.3', { vars: [], width: 90, onChange: () => 0 });
        const data = v.select('list', [{ value: 'tenths', label: '±0.1·k' }, { value: 'wide', label: 'spread magnitudes' }, { value: 'bigsmall', label: '10¹⁶, 1, …, 1, −10¹⁶' }], 'tenths', { onChange: () => { cache = null; } });
        const nn = v.slider('length $n$', 10, 200, 40, { int: true, onChange: () => { cache = null; } });
        let seed = 1, cache = null;
        v.button('New random orders', () => { seed++; cache = null; });
        const lit = (inp) => { const R = ratOfLiteral(inp.value); return { R, d: R ? Number(inp.value) : (inp.fn ? inp.fn() : NaN) }; };
        const sL = v.stage({ x: [-4, 4], y: [0, 1], axes: false, height: 250, minWidth: 300, title: 'the floats around a + b' });
        const sR = v.stage({ x: [-1, 1], y: [0, 1], axes: 'box', gutter: true, height: 250, minWidth: 300, xlabel: 'error / (u Σ|xᵢ|)', ylabel: 'orders', title: 'the same list in 2000 orders' });
        const make = () => {
          const r = v.rng(11 + seed), n = nn.value; let xs;
          if (data.value === 'tenths') xs = Array.from({ length: n }, (_, i) => (i % 2 ? -1 : 1) * (1 + i) * 0.1);
          else if (data.value === 'wide') xs = Array.from({ length: n }, () => (r() < 0.5 ? -1 : 1) * 10 ** (r() * 12 - 6));
          else xs = [1e16, ...Array(n - 2).fill(1), -1e16];
          const ex = exactSum(xs), scale = FORMATS.double.u * xs.reduce((a, b) => a + Math.abs(b), 0);
          const shuf = () => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
          const errs = []; for (let k = 0; k < 2000; k++) errs.push(errVs(naiveSum(shuf()), ex) / scale);
          const asc = xs.slice().sort((a, b) => a - b), desc = asc.slice().reverse();
          const ascA = xs.slice().sort((a, b) => Math.abs(a) - Math.abs(b)), descA = ascA.slice().reverse();
          const named = [['given order', 'accent', xs], ['ascending', 'green', asc], ['descending', 'orange', desc], ['smallest |x| first', 'teal', ascA], ['largest |x| first', 'purple', descA]]
            .map(([nm, col, a]) => { const sm = naiveSum(a); return { nm, col, sm, e: errVs(sm, ex) / scale }; });
          return { errs, named, ex, scale };
        };
        v.render(() => {
          // left: the ruler
          const a = lit(ia), b = lit(ib), c = lit(ic);
          if (Number.isFinite(a.d + b.d)) {
            const fl = a.d + b.d, g = ulpOf(fl, FORMATS.double), exact = ratAdd(ratOfDouble(a.d), ratOfDouble(b.d));
            const pos = (R) => ratNum(ratSub(R, ratOfDouble(fl))) / g;
            let fs = [[fl, 0]], u = fl, d = fl;
            for (let k = 1; k <= 3; k++) { u = nextUp(u, FORMATS.double); d = nextDown(d, FORMATS.double); fs.push([u, (u - fl) / g], [d, (d - fl) / g]); }
            sL.line(-3.8, 0.5, 3.8, 0.5, { color: 'faint', width: 1.5 });
            const cR = c.R || (Number.isFinite(c.d) ? ratOfDouble(c.d) : null), cf = Number.isFinite(c.d) ? rnd(c.d, FORMATS.double) : NaN;
            for (const [f, p] of fs) { sL.line(p, 0.45, p, 0.55, { color: f === cf ? 'red' : f === fl ? 'accent' : 'muted', width: f === fl || f === cf ? 3 : 1.5 }); }
            const same = Number.isFinite(c.d) && rnd(c.d, FORMATS.double) === fl;
            sL.text(same ? 'fl(a+b) = fl(c)' : 'fl(a+b)', 0, 0.36, { align: same ? 'center' : 'left', dx: same ? 0 : 4, size: 11, color: 'accent', weight: 700 });
            sL.text(fl.toPrecision(17), 0, 0.27, { align: same ? 'center' : 'left', dx: same ? 0 : 4, size: 10.5, color: 'accent', halo: false });
            const pe = pos(exact);
            sL.dot(clamp(pe, -3.8, 3.8), 0.5, { r: 6, color: 'gold' });
            sL.text('exact a+b', clamp(pe, -3, 3), 0.62, { align: 'center', size: 11, color: 'gold', weight: 700 });
            if (cR) {
              const pc = pos(cR);
              if (Math.abs(pc) < 3.8) { sL.dot(pc, 0.5, { r: 5, color: 'red', hollow: true }); sL.text('decimal c', clamp(pc, -3, 3), 0.72, { align: 'center', size: 11, color: 'red', weight: 700 }); }
              if (Number.isFinite(cf) && Math.abs(cf - fl) / g < 3.5 && cf !== fl) {
                const pf = (cf - fl) / g; sL.text('fl(c)', pf, 0.36, { align: pf < 0 ? 'right' : 'left', dx: pf < 0 ? -4 : 4, size: 11, color: 'red', weight: 700 }); sL.text(cf.toPrecision(17), pf, 0.27, { align: pf < 0 ? 'right' : 'left', dx: pf < 0 ? -4 : 4, size: 10.5, color: 'red', halo: false });
              }
            }
            sL.text('spacing of the grid = 1 ulp', 0, 0.1, { align: 'center', size: 11, color: 'muted' });
            sL.measure(0, 0.18, 1, 0.18, '');
          }
          // right: the histogram
          if (!cache) cache = make();
          const { errs, named } = cache, R = Math.max(1, ...errs.map(Math.abs), ...named.map((q) => Math.abs(q.e))) * 1.05;
                    const cnt = new Array(41).fill(0); for (const e of errs) cnt[Math.min(40, Math.floor((e + R) / (2 * R) * 41))]++;
          const top = Math.max(...cnt) * 1.12; sR.setView([-R, R], [0, top]);
          sR.hist({ edges: Array.from({ length: 42 }, (_, i) => -R + 2 * R * i / 41), counts: cnt }, { color: 'muted', fillAlpha: 0.4 });
          named.forEach((q, i) => { sR.vline(q.e, { color: q.col, width: 2.4, dash: i === 0 ? false : [5, 3] }); });
        });
        v.legend([['accent', 'given order'], ['green', 'ascending'], ['orange', 'descending'], ['teal', 'smallest |x| first'], ['purple', 'largest |x| first'], ['muted', 'random orders', { area: true }]]);
        v.readout(() => {
          const a = lit(ia), b = lit(ib), c = lit(ic), L = [];
          if ([a.d, b.d, c.d].every(Number.isFinite)) {
            const s1 = a.d + b.d, l1 = s1 + c.d, r1 = a.d + (b.d + c.d);
            L.push(`$a+b=$ **${s1.toPrecision(17)}** ${s1 === c.d ? '$=c$' : '$\\ne c$'} (c stored as ${c.d.toPrecision(17)}).   $(a+b)+c=$ ${l1.toPrecision(17)}, $a+(b+c)=$ ${r1.toPrecision(17)} ${l1 === r1 ? '(equal)' : '— **different**'}.`);
          }
          if (!cache) cache = make();
          const exv = exNum(cache.ex), lo = Math.min(...cache.errs), hi = Math.max(...cache.errs);
          L.push(`Exact sum of the list $=${exv.toPrecision(17)}$. Sums: ` + cache.named.map((q) => `${q.nm} ${q.sm.toPrecision(17)}`).join('; ') + `. Over 2000 random orders the error ranges over $[${lo.toFixed(2)},\\ ${hi.toFixed(2)}]\\cdot u\\sum|x_i|$.`);
          return L.join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'Catastrophic cancellation',
      statement: String.raw`Subtracting two nearly equal floating-point numbers is *exact* (Sterbenz: if $y/2\le x\le2y$ then $x-y$ is representable), but it exposes the rounding errors already present in $x$ and $y$: if $\hat x=x(1+\delta_1)$ and $\hat y=y(1+\delta_2)$, then
$$\frac{(\hat x-\hat y)-(x-y)}{x-y}\ \text{can be as large as}\ \frac{|x|+|y|}{|x-y|}\,u .$$
Leading digits cancel and the result keeps only the noisy trailing digits. For $f(x)=(1-\cos x)/x^2\to\tfrac12$ the computed value is wrong in all digits once $x\lesssim10^{-8}$; rewriting $1-\cos x=2\sin^2(x/2)$ removes the subtraction and the error stays near $u$.`,
      idea: String.raw`Each input carries a relative error up to $u$, i.e. an absolute error up to $u|x|$. When $|x-y|\ll|x|$ this absolute error is large *compared with the difference*, so the relative error of the difference is about $u|x|/|x-y|$: the condition number of subtraction (1.11). The cure is algebraic: avoid forming the difference, using an identity, a series, or a dedicated function such as expm1 or log1p.`,
      caption: String.raw`Choose a function and drag $x$. **Left:** the computed values; the textbook form (red) collapses and wanders while the rewritten form (green) stays at the limit. **Right:** relative error against a high-accuracy series on log–log axes: the naive error rises like $u/x^2$. **Bottom:** the bits. The two operands agree in their first $k$ bits, those cancel, and only $p-k$ bits of the result carry information.`,
      deps: ['num-1.2'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['cancellation', 'floating point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Catastrophic_cancellation' },
      viz(v) {
        const SER = {
          cos: (x) => { let t = 0.5, s = 0.5, x2 = x * x; for (let k = 0; k < 25; k++) { t = -t * x2 / ((2 * k + 3) * (2 * k + 4)); s += t; } return s; },
          exp: (x) => { let t = 1, s = 1; for (let k = 0; k < 40; k++) { t = t * x / (k + 2); s += t; } return s; },
          log: (x) => { let t = 1, s = 1; for (let k = 0; k < 90; k++) { t = -t * x * (k + 1) / (k + 2); s += t; } return s; },
        };
        const FUN = {
          cos: { lab: '(1−cos x)/x²', tex: '\\dfrac{1-\\cos x}{x^2}', stab: '\\dfrac{2\\sin^2(x/2)}{x^2}', lim: 0.5,
            naive: (x, o) => o.div(o.sub(1, o.r(Math.cos(x))), o.mul(x, x)), stable: (x, o) => { const s = o.r(Math.sin(o.r(x / 2))); return o.div(o.mul(2, o.mul(s, s)), o.mul(x, x)); } },
          exp: { lab: '(eˣ−1)/x', tex: '\\dfrac{e^x-1}{x}', stab: '\\dfrac{\\mathrm{expm1}(x)}{x}', lim: 1,
            naive: (x, o) => o.div(o.sub(o.r(Math.exp(x)), 1), x), stable: (x, o) => o.div(o.r(Math.expm1(x)), x) },
          log: { lab: 'ln(1+x)/x', tex: '\\dfrac{\\ln(1+x)}{x}', stab: '\\dfrac{\\mathrm{log1p}(x)}{x}', lim: 1,
            naive: (x, o) => o.div(o.r(Math.log(o.add(1, x))), x), stable: (x, o) => o.div(o.r(Math.log1p(x)), x) },
        };
        const fn = v.select('function', Object.entries(FUN).map(([k, f]) => ({ value: k, label: f.lab })), 'cos');
        const prec = v.select('precision', [{ value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double');
        const lx = v.slider('$x$', 1e-10, 0.5, 1e-5, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const sV = v.stage({ x: [1e-10, 0.5], y: [-0.1, 2.3], xlog: true, axes: 'box', gutter: true, height: 290, minWidth: 300, xlabel: 'x', ylabel: 'computed value', title: 'what the computer returns' });
        const sE = v.stage({ x: [1e-10, 0.5], y: [1e-18, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 290, minWidth: 300, xlabel: 'x', ylabel: 'relative error', title: 'relative error against a series' });
        const sB = v.stage({ axes: false, height: 180, full: true, title: 'the bits being subtracted' });
        const cache = new Map();
        const curves = () => {
          const key = fn.value + prec.value; if (cache.has(key)) return cache.get(key);
          const F = FORMATS[prec.value], o = mkOps(F), f = FUN[fn.value], xs = logspace(1e-10, 0.5, 260), A = [];
          for (const x0 of xs) { const x = rnd(x0, F), ref = SER[fn.value](x); const nv = f.naive(x, o), sv = f.stable(x, o); A.push({ x: x0, nv, sv, en: Math.max(Math.abs(nv - ref) / ref, 1e-18), es: Math.max(Math.abs(sv - ref) / ref, 1e-18) }); }
          cache.set(key, A); return A;
        };
        const here = () => {
          const F = FORMATS[prec.value], o = mkOps(F), f = FUN[fn.value], x = rnd(lx.value, F), ref = SER[fn.value](x);
          return { F, x, ref, nv: f.naive(x, o), sv: f.stable(x, o) };
        };
        v.render(() => {
          const A = curves(), f = FUN[fn.value], H = here();
          sV.hline(f.lim, { color: 'muted', dash: true });
          sV.clip(() => { sV.path(A.map((a) => [a.x, a.nv]), { color: 'red', width: 2 }); sV.path(A.map((a) => [a.x, a.sv]), { color: 'green', width: 2 }); });
          sV.vline(lx.value, { color: 'gold', width: 1.5 });
          sV.dot(lx.value, clamp(H.nv, -0.1, 2.3), { r: 5, color: 'red' }); sV.dot(lx.value, H.sv, { r: 5, color: 'green' });
          sV.text(`limit ${f.lim}`, 2e-10, f.lim + 0.12, { size: 11, color: 'muted' });
          sE.path(A.map((a) => [a.x, a.en]), { color: 'red', width: 2 }); sE.path(A.map((a) => [a.x, a.es]), { color: 'green', width: 2 });
          sE.hline(H.F.u, { color: 'muted', dash: true }); sE.text('u', 2.5e-10, H.F.u * 2.5, { size: 11, color: 'muted' });
          sE.vline(lx.value, { color: 'gold', width: 1.5 });
          // bits picture
          const { w, h, Y } = px(sB), F = H.F, P = F.p, x = H.x, left = 108, cw = Math.min(18, (w - left - 12) / (P + 1));
          const row = (label, bitsFn, py, col, lead) => {
            sB.text(label, left - 8, Y(py + 10), { align: 'right', baseline: 'middle', size: 11.5, color: col === 'faint' ? 'muted' : 'ink' });
            for (let j = 0; j <= P; j++) {
              const b = bitsFn(j), x0 = left + j * cw, cc = lead != null && j < lead ? 'faint' : col;
              sB.rect(x0, Y(py + 19), x0 + cw - 1.2, Y(py), { fill: cc, fillAlpha: b ? (cc === 'faint' ? 0.5 : 0.65) : 0.05, color: cc, width: 0.8, radius: 2 });
            }
          };
          const bit = (val) => (j) => (Math.floor(val * 2 ** j) % 2 === 1 ? 1 : 0);
          for (let j = 0; j <= P; j += 8) sB.text(j === 0 ? '2⁰' : `2⁻${j}`, left + j * cw + cw / 2, Y(14), { align: 'center', size: 9.5, color: 'muted' });
          if (fn.value === 'log') {
            const s = rnd(1 + x, F);
            row('1', bit(1), 24, 'blue'); row('x', bit(x), 48, 'orange');
            row('fl(1+x)', bit(s), 82, 'green');
            const kept = Math.max(0, P - Math.max(0, Math.floor(-Math.log2(x))));
            wrap(`x = ${sci(x, 3)} starts at bit 2^-${Math.floor(-Math.log2(x)) + 1}: only about ${Math.max(0, Math.min(P, kept))} of its ${P} significant bits fit into the sum; the rest are rounded off before the logarithm sees them.`, Math.floor(w / 6.6)).forEach((ln, i) => sB.text(ln, w / 2, Y(128 + i * 17), { align: 'center', size: 11.5, color: 'muted' }));
          } else {
            const b = fn.value === 'cos' ? rnd(Math.cos(x), F) : rnd(Math.exp(x), F), d = Math.abs(1 - b);
            const jl = d === 0 ? P + 1 : Math.floor(-Math.log2(d)) + 1 - (fn.value === 'cos' ? 0 : 0);
            row('1', bit(1), 24, 'blue'); row(fn.value === 'cos' ? 'cos x' : 'eˣ', bit(b), 48, 'orange', Math.min(jl, P + 1));
            row('difference', bit(d), 82, 'green', Math.min(jl, P + 1));
            const m = Math.max(0, P + 1 - jl);
            const msg = d === 0 ? `${fn.value === 'cos' ? 'cos x' : 'eˣ'} rounds to exactly 1: the subtraction returns 0 and every bit is lost.`
              : `The first ${Math.min(jl, P + 1)} bits agree and cancel (grey). The difference keeps about ${m} significant bits of ${P}, and they are the ones the rounding error of ${fn.value === 'cos' ? 'cos x' : 'eˣ'} has already damaged: relative error ≈ 2^-${Math.max(m, 0)}.`;
            wrap(msg, Math.floor(w / 6.6)).forEach((ln, i) => sB.text(ln, w / 2, Y(128 + i * 17), { align: 'center', size: 11.5, color: 'muted' }));
          }
          sB.text(`${F.name}, p = ${P} bits`, w - 8, Y(h - 10), { align: 'right', size: 10.5, color: 'faint' });
        });
        v.legend([['red', 'textbook form'], ['green', 'rewritten form'], ['gold', 'chosen x']]);
        v.readout(() => {
          const H = here(), f = FUN[fn.value], en = Math.abs(H.nv - H.ref) / H.ref, es = Math.abs(H.sv - H.ref) / H.ref;
          return `$f(x)=${f.tex}$ at $x=${tsci(H.x, 3)}$: textbook form **${H.nv.toPrecision(H.F.key === 'single' ? 8 : 16)}**, rewritten $${f.stab}$ **${H.sv.toPrecision(H.F.key === 'single' ? 8 : 16)}**, reference series ${H.ref.toPrecision(H.F.key === 'single' ? 8 : 16)}.\nRelative errors: textbook $${tsci(en, 2)}$ (≈ ${Math.max(0, Math.floor(-Math.log10(Math.max(en, 1e-17))))} good digits), rewritten $${tsci(es, 2)}$. Predicted size of the textbook error ≈ $u\\,\\tfrac{|x_1|+|x_2|}{|x_1-x_2|}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Stable quadratic formula',
      statement: String.raw`For $x^2+bx+c=0$ with real roots, the textbook formula $x_{1,2}=\tfrac12\big(-b\pm\sqrt{b^2-4c}\big)$ suffers cancellation for the root of smaller modulus when $b^2\gg|c|$: $-b$ and $\pm\sqrt{b^2-4c}$ are nearly equal and opposite. The **stable** method computes the larger-modulus root without cancellation,
$$q=-\tfrac12\big(b+\operatorname{sgn}(b)\sqrt{b^2-4c}\big),\qquad x_1=q,\qquad x_2=\frac{c}{q},$$
using Vieta's relation $x_1x_2=c$. Both roots then have relative error $O(u)$ (the discriminant itself must not suffer cancellation, i.e. $b^2\not\approx4c$).`,
      idea: String.raw`Cancellation (1.4) hits only the sum of two numbers of opposite sign. Choose the sign so that the two terms of $q$ have the same sign, so there is no subtraction, then recover the other root from the product $x_1x_2=c$, which is a single division. The algorithm is accurate not because every intermediate is exact but because no step amplifies earlier rounding errors.`,
      caption: String.raw`Drag $b$ (log scale) with $a=1$. **Top:** relative error of the small root against $b$ on log–log axes: textbook (red) climbs, then collapses to $100\%$, while the stable formula (green) stays at $u$. **Bottom:** both roots digit by digit against the exact roots (computed with 200-bit integers): matching digits are green, wrong ones red. Switch to binary32 to move the cliff to $b\approx10^4$.`,
      deps: ['num-1.4'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['cancellation', 'algorithms'],
      viz(v) {
        const prec = v.select('precision', [{ value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double');
        const sb = v.slider('$b$', 1, 1e12, 1e8, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const sc = v.slider('$c$', 1e-3, 1e3, 1, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const S = 200n, two = 2n ** S;
        const fixed = (x) => BigInt(x * 2 ** 200);
        function exactRoots(b, c) {
          const B = fixed(b), C = fixed(c), D = ((B * B) >> S) - 4n * C;
          if (D < 0n) return null;
          const sq = isqrt(D << S);
          return { small: (sq - B) / 2n, large: (-B - sq) / 2n };
        }
        function bigSci(N, nd) {
          if (N === 0n) return { digits: '0'.repeat(nd), exp: 0, neg: false };
          const neg = N < 0n, a = neg ? -N : N;
          let e10 = Math.floor(Math.log10(Math.abs(ratioNum(a, two))));
          for (let tries = 0; tries < 3; tries++) {
            const k = nd - 1 - e10, num = a * 10n ** BigInt(Math.max(k, 0)), den = two * 10n ** BigInt(Math.max(-k, 0));
            const q = (2n * num + den) / (2n * den), s = q.toString();
            if (s.length > nd) { e10++; continue; } if (s.length < nd) { e10--; continue; }
            return { digits: s, exp: e10, neg };
          }
          return { digits: '?'.repeat(nd), exp: e10, neg };
        }
        const dig = (x, nd) => { if (x === 0) return { digits: '0'.repeat(nd), exp: 0, neg: false }; const [m, e] = Math.abs(x).toExponential(nd - 1).split('e'); return { digits: m.replace('.', ''), exp: +e, neg: x < 0 }; };
        function solve(b, c, F) {
          const o = mkOps(F), bq = o.r(b), cq = o.r(c), D = o.sub(o.mul(bq, bq), o.mul(4, cq)), sq = o.sqrt(D);
          const naiveS = o.div(o.add(-bq, sq), 2), naiveL = o.div(o.sub(-bq, sq), 2);
          const q = o.div(o.mul(-1, o.add(bq, sq)), 2), stabL = q, stabS = o.div(cq, q);
          return { naiveS, naiveL, stabS, stabL, bq, cq };
        }
        const sE = v.stage({ x: [1, 1e12], y: [1e-18, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 270, full: true, xlabel: 'b', ylabel: 'relative error of the small root', title: 'x² + bx + c = 0, small root' });
        const sD = v.stage({ axes: false, height: 215, full: true });
        const cache = new Map();
        const curve = () => {
          const key = `${prec.value}|${sc.value}`; if (cache.has(key)) return cache.get(key);
          const F = FORMATS[prec.value], A = [];
          for (const b of logspace(1, 1e12, 150)) {
            const ex = exactRoots(rnd(b, F), rnd(sc.value, F)); if (!ex) continue;
            const r = solve(b, sc.value, F), tr = ratioNum(ex.small, two);
            A.push({ b, en: Math.max(Math.abs(r.naiveS - tr) / Math.abs(tr), 1e-18), es: Math.max(Math.abs(r.stabS - tr) / Math.abs(tr), 1e-18) });
          }
          cache.set(key, A); return A;
        };
        v.render(() => {
          const A = curve(), F = FORMATS[prec.value];
          sE.path(A.map((a) => [a.b, a.en]), { color: 'red', width: 2 }); sE.path(A.map((a) => [a.b, a.es]), { color: 'green', width: 2 });
          sE.hline(F.u, { color: 'muted', dash: true }); sE.hline(1, { color: 'red', dash: true, alpha: 0.5 });
          sE.vline(sb.value, { color: 'gold', width: 1.5 });
          const { w, h, Y } = px(sD), nd = F.key === 'single' ? 8 : 16, ex = exactRoots(rnd(sb.value, F), rnd(sc.value, F));
          if (!ex) { sD.text('no real roots', w / 2, Y(h / 2), { align: 'center', color: 'red' }); return; }
          const r = solve(sb.value, sc.value, F), left = 118, cw = Math.min(21, (w - left - 90) / nd), ch = 20;
          const group = (title, y0, exact, a, bb) => {
            sD.text(title, 10, Y(y0 + 2), { size: 12, weight: 700, color: 'ink' });
            const E = bigSci(exact, nd);
            [['exact', E], ['textbook', dig(a, nd)], ['stable', dig(bb, nd)]].forEach(([lab, D], k) => {
              const yy = y0 + 14 + k * (ch + 5);
              sD.text(lab, left - 10, Y(yy + ch / 2), { align: 'right', baseline: 'middle', size: 11.5, color: lab === 'textbook' ? 'red' : lab === 'stable' ? 'green' : 'ink' });
              let ok = lab === 'exact' || D.exp === E.exp;
              for (let i = 0; i < nd; i++) {
                if (lab !== 'exact' && ok && D.digits[i] !== E.digits[i]) ok = false;
                const col = lab === 'exact' ? 'accent' : ok ? 'green' : 'red', x0 = left + i * cw;
                sD.rect(x0, Y(yy + ch), x0 + cw - 1.5, Y(yy), { fill: col, fillAlpha: 0.25, color: col, width: 1, radius: 3 });
                sD.text(D.digits[i], x0 + (cw - 1.5) / 2, Y(yy + ch / 2), { align: 'center', baseline: 'middle', size: cw > 14 ? 12 : 10, weight: 600, color: 'ink', halo: false });
              }
              sD.text(`${D.neg ? '−' : '+'}  ×10${String(D.exp).replace('-', '⁻').split('').map((c2) => (/\d/.test(c2) ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c2] : c2)).join('')}`, left + nd * cw + 8, Y(yy + ch / 2), { baseline: 'middle', size: 11, color: 'muted' });
            });
          };
          group('small root', 6, ex.small, r.naiveS, r.stabS);
          group('large root', 112, ex.large, r.naiveL, r.stabL);
        });
        v.legend([['red', 'textbook'], ['green', 'stable'], ['gold', 'chosen b']]);
        v.readout(() => {
          const F = FORMATS[prec.value], ex = exactRoots(rnd(sb.value, F), rnd(sc.value, F)); if (!ex) return 'The discriminant is negative.';
          const r = solve(sb.value, sc.value, F), ts = ratioNum(ex.small, two), tl = ratioNum(ex.large, two);
          const re = (a, t) => Math.abs(a - t) / Math.abs(t);
          return `$b=${tsci(sb.value, 2)}$, $c=${tsci(sc.value, 2)}$. Small root $=${tsci(ts, 6)}$: textbook relative error **${sci(re(r.naiveS, ts), 2)}**, stable **${sci(re(r.stabS, ts), 2)}**. Large root $=${tsci(tl, 6)}$: textbook ${sci(re(r.naiveL, tl), 2)}, stable ${sci(re(r.stabL, tl), 2)} (no cancellation there).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Algorithm',
      name: 'Compensated (Kahan) summation',
      statement: String.raw`Kahan's compensated summation carries a correction $c$ holding the low-order part lost in the previous addition:

$s\leftarrow0,\ c\leftarrow0$; for each $x_i$: $y\leftarrow x_i-c$; $t\leftarrow s+y$; $c\leftarrow(t-s)-y$; $s\leftarrow t$.

For $n$ terms its error satisfies $|\hat s-s|\le\big(2u+O(nu^2)\big)\sum|x_i|$, **independent of $n$** to first order. Naive summation has worst-case bound $(n-1)u\sum|x_i|$ (typically growing like $\sqrt n\,u$ for random errors, but linearly when errors share a sign), and pairwise (divide-and-conquer) summation $O(u\log n)\sum|x_i|$.`,
      idea: String.raw`In $t=s+y$ the low bits of $y$ fall off the end; $(t-s)$ recovers the part of $y$ that was actually added (exact, by the cancellation theorem of 1.4), and subtracting $y$ leaves exactly minus the lost part. Feeding it back into the next term turns a systematic drift into a one-term lag. Pairwise summation instead limits how many roundings any single term suffers to $\log_2 n$.`,
      caption: String.raw`**Left:** error (in units of $u$) of three algorithms as terms accumulate, for $10^6$ terms. Naive grows linearly for repeated $0.1$ (its roundings all push the same way); pairwise and Kahan stay within a few $u$ (pairwise's worst case grows only like $\log n$; on random terms it is visibly above Kahan). **Right:** the individual rounding errors of the last 64 additions, in ulps of the running sum: naive's are biased, Kahan's cancel in effect. Drag the length $N$; switch to random terms to see the $\sqrt n$ behaviour.`,
      deps: ['num-1.3'],
      refs: ['Süli–Mayers ch. 2'],
      credit: 'W. Kahan, "Further remarks on reducing truncation errors", Communications of the ACM 8 (1965), p. 40.',
      tags: ['summation', 'floating point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kahan_summation_algorithm' },
      viz(v) {
        const N = 1e6, U = FORMATS.double.u;
        const kind = v.select('terms', [{ value: 'tenth', label: '0.1, 0.1, 0.1, …' }, { value: 'rand', label: 'uniform random in (0, 1)' }], 'tenth', { onChange: () => { data = null; } });
        const sn = v.slider('number of terms $N$', 10, N, 1e6, { log: true, int: true, sig: 2, fmt: (x) => Math.round(x).toLocaleString('en-US') });
        let data = null;
        const build = () => {
          const xs = new Float64Array(N); let m = 0n;
          if (kind.value === 'tenth') { xs.fill(0.1); m = decomp(0.1).m; } else { const r = v.rng(5); for (let i = 0; i < N; i++) xs[i] = (Math.floor(r() * 2 ** 26) * 2 ** 27 + Math.floor(r() * 2 ** 27)) / 2 ** 53; }
          const pref = kind.value === 'rand' ? (() => { const hi = new Float64Array(N + 1), lo = new Float64Array(N + 1); let H = 0, L = 0; for (let i = 0; i < N; i++) { const k = xs[i] * 2 ** 53, kh = Math.floor(k / 2 ** 26); H += kh; L += k - kh * 2 ** 26; hi[i + 1] = H; lo[i + 1] = L; } return { hi, lo }; })() : null;
          const exactAt = (n) => (kind.value === 'tenth' ? { n: BigInt(n) * m, e: -56 } : { n: (BigInt(pref.hi[n]) << 26n) + BigInt(pref.lo[n]), e: -53 });
          // sampled curves
          const samples = Array.from(new Set(logspace(10, N, 260).map(Math.round))), out = { ns: samples, naive: [], pair: [], kahan: [] };
          let s = 0, ks = 0, kc = 0, si = 0; const stack = [];
          for (let i = 1; i <= N; i++) {
            const x = xs[i - 1]; s += x;
            const y = x - kc, t = ks + y; kc = (t - ks) - y; ks = t;
            let cur = { v: x, l: 0 }; while (stack.length && stack[stack.length - 1].l === cur.l) { const a = stack.pop(); cur = { v: a.v + cur.v, l: cur.l + 1 }; } stack.push(cur);
            if (i === samples[si]) {
              si++; let pw = 0; for (let j = stack.length - 1; j >= 0; j--) pw += stack[j].v;
              const ex = exactAt(i), exv = exNum(ex);
              out.naive.push(Math.max(Math.abs(errVs(s, ex) / exv) / U, 0.04)); out.pair.push(Math.max(Math.abs(errVs(pw, ex) / exv) / U, 0.04)); out.kahan.push(Math.max(Math.abs(errVs(ks, ex) / exv) / U, 0.04));
            }
          }
          return { xs, exactAt, out };
        };
        const at = (n) => {
          const xs = data.xs; let s = 0, ks = 0, kc = 0; const stack = [], en = [], ek = [];
          for (let i = 1; i <= n; i++) {
            const x = xs[i - 1], [t0, e0] = twoSum(s, x); s = t0;
            const y = x - kc, t = ks + y, [, e1] = twoSum(ks, y); kc = (t - ks) - y; ks = t;
            if (i > n - 64) { en.push(e0 / ulpOf(s, FORMATS.double)); ek.push(e1 / ulpOf(ks, FORMATS.double)); }
            let cur = { v: x, l: 0 }; while (stack.length && stack[stack.length - 1].l === cur.l) { const a = stack.pop(); cur = { v: a.v + cur.v, l: cur.l + 1 }; } stack.push(cur);
          }
          let pw = 0; for (let j = stack.length - 1; j >= 0; j--) pw += stack[j].v;
          const ex = data.exactAt(n), exv = exNum(ex);
          return { s, ks, pw, exv, ex, en, ek, errN: errVs(s, ex), errP: errVs(pw, ex), errK: errVs(ks, ex) };
        };
        const sE = v.stage({ x: [10, N], y: [0.04, 3e7], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'number of terms n', ylabel: 'relative error / u', title: 'error as terms accumulate' });
        const sR = v.stage({ x: [-0.5, 64.5], y: [-0.7, 0.7], axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'the last 64 additions before N', ylabel: 'rounding error / ulp', title: 'rounding errors committed per addition' });
        let cur = null;
        v.render(() => {
          if (!data) data = build();
          const { out } = data, n = sn.value; cur = at(n);
          sE.path(out.ns.map((x, i) => [x, out.naive[i]]), { color: 'red', width: 2 });
          sE.path(out.ns.map((x, i) => [x, out.pair[i]]), { color: 'orange', width: 4.5, alpha: 0.8 });
          sE.path(out.ns.map((x, i) => [x, out.kahan[i]]), { color: 'green', width: 2 });
          sE.hline(1, { color: 'muted', dash: true }); sE.vline(n, { color: 'gold', width: 1.5 });
          sR.hline(0, { color: 'muted' });
          const m = cur.en.length;
          cur.en.forEach((e, i) => { sR.rect(i + 64 - m - 0.45, 0, i + 64 - m, e, { fill: 'red', fillAlpha: 0.6, color: 'red', width: 0.5 }); });
          cur.ek.forEach((e, i) => { sR.rect(i + 64 - m, 0, i + 64 - m + 0.45, e, { fill: 'green', fillAlpha: 0.6, color: 'green', width: 0.5 }); });
          const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
          sR.hline(mean(cur.en), { color: 'red', dash: true });
        });
        v.legend([['red', 'naive'], ['orange', 'pairwise'], ['green', 'Kahan'], ['gold', 'chosen N']]);
        v.readout(() => {
          if (!cur) return '';
          const n = sn.value, ev = (e) => Math.abs(e / cur.exv) / U, mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
          return `**N = ${n.toLocaleString('en-US')}.** Exact sum ${cur.exv.toPrecision(17)}. Naive **${cur.s.toPrecision(17)}** (error ${ev(cur.errN).toFixed(1)} u), pairwise **${cur.pw.toPrecision(17)}** (${ev(cur.errP).toFixed(1)} u), Kahan **${cur.ks.toPrecision(17)}** (${ev(cur.errK).toFixed(2)} u).\nMean rounding error per naive addition over the last 64: ${mean(cur.en).toFixed(3)} ulp (${Math.abs(mean(cur.en)) > 0.05 ? 'biased, so errors add up linearly' : 'unbiased'}).`;
        });
      },
    },
  ],
};
