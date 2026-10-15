// Theory of Computation — Chapter 1: Strings, languages and counting

// ---------------------------------------------------------------- shared helpers
const EPS = 'ε';
const sh = (w) => (w === '' ? EPS : w); // display a string, ε for the empty one
const rev = (w) => [...w].reverse().join('');
const cnt = (w, c) => [...w].filter((x) => x === c).length;
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const subN = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
/** All strings of length exactly n over alpha, in lexicographic order. */
function layer(alpha, n) { let L = ['']; for (let i = 0; i < n; i++) { const nx = []; for (const u of L) for (const c of alpha) nx.push(u + c); L = nx; } return L; }
/** All strings of length ≤ n, in shortlex order. */
function upTo(alpha, n) { const out = []; for (let k = 0; k <= n; k++) out.push(...layer(alpha, k)); return out; }
const MONO = (size, weight = 500) => `${weight} ${size}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;
const SANS = (size, weight = 500) => `${weight} ${size}px Inter, system-ui, sans-serif`;

/**
 * Pixel pen: sets the stage view to its pixel box, then draws with coordinates in CSS pixels measured
 * from the top-left corner (y downwards). Strings are drawn in a monospace font so that tapes line up.
 */
function pen(s, v) {
  s.setView([0, s.width], [0, s.height]);
  const c = s.ctx, H = s.height, U = (y) => H - y;
  const P = {
    W: s.width, H, c,
    tw(str, size = 13, weight = 500, font = MONO) { c.save(); c.font = font(size, weight); const w = c.measureText(String(str)).width; c.restore(); return w; },
    box(x, y, w, h, o = {}) {
      c.save(); c.beginPath();
      const r = Math.max(0, Math.min(o.r ?? 5, w / 2, h / 2));
      if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
      if (o.fill) { c.fillStyle = v.color(o.fill, o.alpha ?? 0.22); c.fill(); }
      if (o.stroke !== false) { c.lineWidth = o.width ?? 1.2; c.strokeStyle = v.color(o.stroke || o.fill || 'muted', o.strokeAlpha); if (o.dash) c.setLineDash(o.dash === true ? [4, 3] : o.dash); c.stroke(); }
      c.restore();
    },
    text(str, x, y, o = {}) {
      c.save(); c.font = (o.font || MONO)(o.size ?? 13, o.weight ?? 500); c.textAlign = o.align || 'center'; c.textBaseline = o.baseline || 'middle';
      if (o.halo) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = v.color('panel', 0.92); c.strokeText(String(str), x, y); }
      c.fillStyle = v.color(o.color || 'ink', o.alpha); c.fillText(String(str), x, y); c.restore();
    },
    sans(str, x, y, o = {}) { P.text(str, x, y, { font: SANS, ...o }); },
    line(x1, y1, x2, y2, st = {}) { s.line(x1, U(y1), x2, U(y2), st); },
    arrow(x1, y1, x2, y2, st = {}) { s.arrow(x1, U(y1), x2, U(y2), st); },
    path(pts, st = {}) { s.path(pts.map((q) => q && [q[0], U(q[1])]), st); },
    dot(x, y, st = {}) { s.dot(x, U(y), st); },
    circle(x, y, r, st = {}) { s.circle(x, U(y), r, st); },
    tex(str, x, y, st = {}) { s.texPx(str, x, y, st); },
  };
  return P;
}
/** Click handler in the pen's pixel coordinates (y downwards). */
const clickPx = (s, fn) => s.onClick((x, y) => fn(x, s.height - y));
/** On-screen keyboard: one button per letter, plus backspace and clear. */
function keypad(v, letters, get, set, o = {}) {
  const max = o.max ?? 10, keys = {};
  for (const c of letters) keys[c] = v.button(o.label ? o.label(c) : c, () => { if (get().length < max) set(get() + c); });
  keys.back = v.button('⌫', () => set(get().slice(0, -1)));
  if (o.clear !== false) keys.clear = v.button('clear', () => set(''));
  return keys;
}
/** A row of tape cells holding the string w, top-left at (x, y). style(i) → {fill, alpha, stroke, color, width}. */
function tape(P, w, x, y, cell, style = () => ({}), size) {
  for (let i = 0; i < w.length; i++) {
    const st = style(i) || {};
    P.box(x + i * cell, y, cell - 2, cell - 2, { r: 4, fill: st.fill, alpha: st.alpha ?? 0.18, stroke: st.stroke ?? 'muted', width: st.width ?? 1.2 });
    P.text(w[i], x + i * cell + (cell - 2) / 2, y + (cell - 2) / 2 + 1, { size: size ?? Math.round(cell * 0.48), weight: 600, color: st.color || 'ink' });
  }
}
const LETTER = { a: 'blue', b: 'orange', c: 'purple' };
/** 'ink' or 'panel', whichever contrasts more with the palette colour `name` (text on solid fills, in both themes). */
function onColor(v, name) {
  const L = (c) => { const [r, g, b] = v.rgb(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }, f = L(name);
  return Math.abs(L('ink') - f) > Math.abs(L('panel') - f) ? 'ink' : 'panel';
}

// ---- 1.4: strings over the infinite alphabet ℕ = {1, 2, 3, …} (arrays of positive integers)
// Row n lists ℕⁿ by increasing letter sum, then lexicographically.
function compositions(sum, parts) { // all ways to write sum as an ordered sum of `parts` positive integers, in lex order
  if (parts === 0) return sum === 0 ? [[]] : [];
  const out = [];
  for (let c = 1; c <= sum - parts + 1; c++) for (const rest of compositions(sum - c, parts - 1)) out.push([c, ...rest]);
  return out;
}
function rowN(n, count) { // first `count` strings of length n over ℕ
  if (n === 0) return [[]];
  const out = []; for (let s = n; out.length < count; s++) for (const t of compositions(s, n)) { out.push(t); if (out.length >= count) break; }
  return out;
}
function rankN(t, binom) { // 0-based position of t inside its row
  const n = t.length; if (!n) return 0;
  const S = t.reduce((a, b) => a + b, 0); let r = 0;
  for (let s = n; s < S; s++) r += binom(s - 1, n - 1);
  let rem = S;
  for (let i = 0; i < n; i++) {
    const L = n - i - 1;
    for (let c = 1; c < t[i]; c++) { const left = rem - c; r += L === 0 ? (left === 0 ? 1 : 0) : left >= L ? binom(left - 1, L - 1) : 0; }
    rem -= t[i];
  }
  return r;
}
const showN = (t) => (t.length ? t.join('·') : EPS);

// ---- 1.9: propositional formulas as trees
const BIN = ['and', 'or', 'imp', 'iff', 'xor'];
const OPSYM = { and: '∧', or: '∨', imp: '→', iff: '↔', xor: '⊕', not: '¬' };
const OPTEX = { and: '\\land', or: '\\lor', imp: '\\to', iff: '\\leftrightarrow', xor: '\\oplus' };
function mkF(a) { // nested arrays → tree with ids
  let k = 0;
  const go = (x) => (typeof x === 'string' ? { id: 'f' + k++, op: 'var', v: x } : x[0] === 'not' ? { id: 'f' + k++, op: 'not', a: go(x[1]) } : { id: 'f' + k++, op: x[0], a: go(x[1]), b: go(x[2]) });
  return go(a);
}
function evalF(t, env) {
  switch (t.op) {
    case 'var': return env[t.v];
    case 'not': return !evalF(t.a, env);
    case 'and': return evalF(t.a, env) && evalF(t.b, env);
    case 'or': return evalF(t.a, env) || evalF(t.b, env);
    case 'imp': return !evalF(t.a, env) || evalF(t.b, env);
    case 'iff': return evalF(t.a, env) === evalF(t.b, env);
    default: return evalF(t.a, env) !== evalF(t.b, env);
  }
}
function texF(t, top = true) {
  if (t.op === 'var') return t.v;
  if (t.op === 'not') return `\\neg ${texF(t.a, false)}`;
  const s = `${texF(t.a, false)} ${OPTEX[t.op]} ${texF(t.b, false)}`;
  return top ? s : `(${s})`;
}

export default {
  collection: 'toc',
  chapter: 1,
  title: 'Strings, languages and counting',
  summary: String.raw`The theory studies computation through languages: sets of finite strings over a finite alphabet, with every decision problem encoded as one. A single counting argument already sets the scene: there are only countably many strings, hence countably many programs, but uncountably many languages, so most problems cannot be solved by any machine at all. The chapter also fixes the working tools used everywhere later: shortlex enumeration, induction on strings, Boolean formulas, and the translation between deciding and searching.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Alphabets, strings and languages',
      statement: String.raw`An **alphabet** is a finite nonempty set $\Sigma$ of symbols. A **string** (word) over $\Sigma$ is a finite sequence $w=w_1w_2\cdots w_n$ of symbols $w_i\in\Sigma$; its **length** is $|w|=n$, and the **empty string** $\varepsilon$ is the one of length $0$. $\Sigma^n$ is the set of strings of length $n$ (so $|\Sigma^n|=|\Sigma|^n$), and $\Sigma^*=\bigcup_{n\ge0}\Sigma^n$ the set of all strings.

The **concatenation** $xy$ writes $y$ after $x$; it is associative with identity $\varepsilon$, and $|xy|=|x|+|y|$. The **reversal** of $w$ is $w^R=w_n\cdots w_1$. $x$ is a **prefix** of $w$ if $w=xz$ for some $z$, a **suffix** if $w=zx$, a **substring** if $w=uxz$; a string of length $n$ has exactly $n+1$ prefixes and $n+1$ suffixes, $\varepsilon$ and $w$ included.

A **language** over $\Sigma$ is any set $L\subseteq\Sigma^*$, finite or infinite. The empty language $\varnothing$ and the language $\{\varepsilon\}$ are different: the second contains one string.`,
      idea: String.raw`Everything a computer reads or writes is a finite string over a finite alphabet, so strings are the universal data type of the theory, and a yes/no question about inputs is the same thing as the set of inputs whose answer is yes. Counting is immediate: each of the $n$ positions of a string in $\Sigma^n$ is chosen independently from $|\Sigma|$ symbols, giving $|\Sigma|^n$ strings, and a prefix is fixed by where it stops, which can be any of the $n+1$ boundaries.`,
      caption: String.raw`Type a string with the letter buttons and switch the top panel between its **prefixes** (bars from the left end), **suffixes** and its **reversal**. The bottom panel lists every string of length at most 4 (3 for three letters), one row $\Sigma^n$ per length; a language $L$ is a choice of strings, shown in green, counted against $|\Sigma|^n$ at the right. Note that $\varnothing$ and $\{\varepsilon\}$ differ in row $\Sigma^0$.`,
      deps: [],
      refs: ['Sipser §0.2'],
      tags: ['strings', 'languages'],
      viz(v) {
        let w = 'abba';
        const keys = {};
        v.select('$\\Sigma$', [{ value: 'ab', label: '$\\{a,b\\}$' }, { value: 'abc', label: '$\\{a,b,c\\}$' }], 'ab', {
          onChange: (a) => { alpha = a; if (a === 'ab') w = w.replace(/c/g, ''); keys.c.hidden = a === 'ab'; },
        });
        let alpha = 'ab';
        const view = v.select('', [{ value: 'pre', label: 'prefixes' }, { value: 'suf', label: 'suffixes' }, { value: 'rev', label: 'reversal' }], 'pre');
        const lang = v.select('$L$', [{ value: 'pal', label: 'palindromes' }, { value: 'sub', label: 'contains $w$' }, { value: 'eq', label: '$\\#_a = \\#_b$' }, { value: 'eps', label: '$\\{\\varepsilon\\}$' }, { value: 'emp', label: '$\\varnothing$' }], 'pal');
        Object.assign(keys, keypad(v, ['a', 'b', 'c'], () => w, (x) => { w = x; }, { max: 8 }));
        keys.c.hidden = true;
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 214, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 206, full: true });
        const inL = (u) => {
          switch (lang.value) {
            case 'sub': return u.includes(w);
            case 'pal': return u === rev(u);
            case 'eq': return cnt(u, 'a') === cnt(u, 'b');
            case 'eps': return u === '';
            default: return false;
          }
        };
        const R = () => (alpha === 'ab' ? 4 : 3);
        v.render(() => {
          // ---- top: the string, its prefixes / suffixes / reversal
          const P = pen(A, v), n = w.length, cell = 40, x0 = Math.round((P.W - Math.max(n, 1) * cell) / 2), y0 = 12;
          P.tex('w', x0 - 22, y0 + cell / 2, { size: 18, color: 'muted' });
          if (!n) { P.box(x0, y0, cell - 2, cell - 2, { r: 4, stroke: 'faint', dash: true }); P.text(EPS, x0 + cell / 2 - 1, y0 + cell / 2, { size: 16, color: 'muted' }); }
          tape(P, w, x0, y0, cell, (i) => ({ color: LETTER[w[i]], stroke: LETTER[w[i]], fill: LETTER[w[i]], alpha: 0.1 }));
          for (let i = 0; i < n; i++) P.text(String(i + 1), x0 + i * cell + cell / 2 - 1, y0 + cell + 7, { size: 10, color: 'muted', font: SANS });
          const top = y0 + cell + 24;
          if (view.value === 'rev') {
            const y1 = top + 74;
            P.tex('w^R', x0 - 24, y1 + cell / 2, { size: 18, color: 'muted' });
            for (let i = 0; i < n; i++) {
              const xa = x0 + i * cell + cell / 2 - 1, xb = x0 + (n - 1 - i) * cell + cell / 2 - 1;
              P.path([[xa, y0 + cell + 13], [xa, y0 + cell + 24], [xb, y1 - 18], [xb, y1 - 2]], { color: LETTER[w[i]], width: 1.8, alpha: 0.75 });
            }
            const wr = rev(w);
            if (!n) { P.box(x0, y1, cell - 2, cell - 2, { r: 4, stroke: 'faint', dash: true }); P.text(EPS, x0 + cell / 2 - 1, y1 + cell / 2, { size: 16, color: 'muted' }); }
            tape(P, wr, x0, y1, cell, (i) => ({ color: LETTER[wr[i]], stroke: LETTER[wr[i]], fill: LETTER[wr[i]], alpha: 0.1 }));
            P.sans(wr === w ? 'wᴿ = w: a palindrome' : 'wᴿ ≠ w', x0 + Math.max(n, 1) * cell + 14, y1 + cell / 2, { align: 'left', size: 13, weight: 600, color: wr === w ? 'green' : 'muted' });
          } else {
            const pre = view.value === 'pre', col = pre ? 'blue' : 'orange', dy = Math.min(22, (P.H - top - 8) / (n + 1));
            for (let i = 0; i <= n; i++) P.line(x0 + i * cell - 1, y0 + cell + 16, x0 + i * cell - 1, top + n * dy + 4, { color: 'grid', width: 1 });
            for (let k = 0; k <= n; k++) {
              const y = top + k * dy, a = pre ? 0 : k, b = pre ? k : n, xa = x0 + a * cell - 1, xb = x0 + b * cell - 1, str = w.slice(a, b);
              if (a === b) P.dot(xa, y, { r: 3.5, color: col });
              else { P.line(xa, y, xb, y, { color: col, width: 3.5 }); P.line(xa, y - 4, xa, y + 4, { color: col, width: 1.5 }); P.line(xb, y - 4, xb, y + 4, { color: col, width: 1.5 }); }
              P.text(sh(str), pre ? xb + 8 : xa - 8, y, { align: pre ? 'left' : 'right', size: 12, color: col, weight: 600 });
            }
            const lab = `${n + 1} ${pre ? 'prefixes' : 'suffixes'}`, lx = pre ? x0 - 30 : x0 + Math.max(n, 1) * cell + 26;
            P.sans(lab, lx, top + (n * dy) / 2, { align: pre ? 'right' : 'left', size: 13, weight: 600, color: col });
          }
          // ---- bottom: Σ^{≤R} with the language highlighted
          const Q = pen(B, v), al = alpha.split(''), rows = R() + 1, rh = (Q.H - 10) / rows;
          for (let k = 0; k < rows; k++) {
            const strs = layer(al, k), m = strs.length, L0 = 48, L1 = Q.W - 76, cw = Math.min(62, (L1 - L0) / m), xs = (L0 + L1) / 2 - (cw * m) / 2, y = 5 + k * rh;
            Q.tex(`\\Sigma^{${k}}`, 22, y + rh / 2, { size: 15, color: 'muted' });
            let hits = 0;
            strs.forEach((u, j) => {
              const isIn = inL(u); if (isIn) hits++;
              Q.box(xs + j * cw + 1, y + 3, cw - 3, rh - 7, { r: 3, fill: isIn ? 'green' : null, alpha: 0.3, stroke: u === w ? 'gold' : isIn ? 'green' : 'faint', width: u === w ? 2.6 : 1 });
              const size = Math.min(12.5, ((cw - 5) / Math.max(1, u.length)) * 1.55);
              if (size >= 6.5) Q.text(sh(u), xs + j * cw + cw / 2 - 0.5, y + rh / 2 + 0.5, { size, color: isIn ? 'ink' : 'muted' });
            });
            Q.text(`${hits} / ${m}`, Q.W - 10, y + rh / 2, { align: 'right', size: 12.5, weight: 600, color: hits ? 'green' : 'muted' });
          }
        });
        v.legend([['green', 'string in $L$', { dot: true }], ['gold', 'the typed string $w$', { dot: true }]]);
        v.readout(() => {
          const counts = [], pows = [], al = alpha.split('');
          for (let k = 0; k <= R(); k++) { const st = layer(al, k); counts.push(st.filter(inL).length); pows.push(st.length); }
          return String.raw`$|w| = ${w.length}$ · $w^R =$ **${sh(rev(w))}** · ${w.length + 1} prefixes and ${w.length + 1} suffixes · $|L\cap\Sigma^n|$ for $n = 0,\dots,${R()}$: ${counts.join(', ')} out of $|\Sigma|^n =$ ${pows.join(', ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Regular operations on languages',
      statement: String.raw`For languages $A,B\subseteq\Sigma^*$ the three **regular operations** are
(a) **union** $A\cup B=\{w : w\in A\text{ or }w\in B\}$;
(b) **concatenation** $AB=\{xy : x\in A,\ y\in B\}$;
(c) **star** $A^*=\{x_1x_2\cdots x_k : k\ge 0,\ x_i\in A\}=\bigcup_{k\ge0}A^k$, where $A^0=\{\varepsilon\}$ and $A^{k+1}=A^kA$.

So $\varepsilon\in A^*$ for every $A$, $\varnothing^*=\{\varepsilon\}^*=\{\varepsilon\}$, and $A^*$ is infinite as soon as $A$ contains a nonempty string. Concatenation is associative with identity $\{\varepsilon\}$ and absorbing element $\varnothing$, but not commutative, and $|AB|\le|A|\,|B|$ with strict inequality when two pairs glue to the same string.`,
      idea: String.raw`These are the operations a pattern needs: alternatives (union), sequencing (concatenation) and repetition (star). Concatenation multiplies choices, but the count $|A|\,|B|$ is only an upper bound, because a string such as $abb$ may split as $a\cdot bb$ and as $ab\cdot b$; the same ambiguity makes the strings of $A^*$ factor in several ways. Kleene's theorem (Chapter 3) shows that these three operations, starting from single letters, describe exactly the languages finite automata recognise.`,
      caption: String.raw`Click the chips in rows $A$ and $B$ to put short strings in or out of each language, then choose the operation. Every result string is drawn with the pieces it was glued from coloured ($A$ blue, $B$ orange; alternating shades for the factors of a star); a red badge counts strings that arise from several factorizations, which is why $|AB|$ can fall short of $|A|\cdot|B|$.`,
      deps: ['toc-1.1'],
      refs: ['Sipser §1.1'],
      credit: 'Kleene, 1956 (star)',
      tags: ['languages', 'regular operations'],
      viz(v) {
        const CH = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb'];
        const A = new Set(['', 'a', 'ab']), B = new Set(['b', 'ba', 'bb']);
        const op = v.select('', [{ value: 'union', label: '$A\\cup B$' }, { value: 'cat', label: '$AB$' }, { value: 'catr', label: '$BA$' }, { value: 'star', label: '$A^*$' }], 'cat');
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, full: true });
        let hit = [];
        clickPx(s, (x, y) => { const h = hit.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (h) { const S = h.set === 'A' ? A : B; if (S.has(h.str)) S.delete(h.str); else S.add(h.str); } });
        const MAXL = 4;
        const sortSL = (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
        const pair = () => (op.value === 'cat' ? [A, B, 'A', 'B'] : [B, A, 'B', 'A']);
        function result() {
          const R = new Map(), add = (w, f) => { if (!R.has(w)) R.set(w, []); R.get(w).push(f); };
          if (op.value === 'union') { for (const x of A) add(x, [[x, 'A']]); for (const y of B) add(y, [[y, 'B']]); }
          else if (op.value === 'star') {
            add('', []);
            const parts = [...A].filter((x) => x !== '');
            (function go(w, f) { for (const x of parts) if (w.length + x.length <= MAXL) { const g = [...f, [x, 'A' + (f.length % 2)]]; add(w + x, g); go(w + x, g); } })('', []);
          } else {
            const [X, Y, nx, ny] = pair();
            for (const x of [...X].sort(sortSL)) for (const y of [...Y].sort(sortSL)) add(x + y, [[x, nx], [y, ny]]);
          }
          return R;
        }
        const COL = { A: 'blue', B: 'orange', A0: 'blue', A1: 'teal' };
        v.render(() => {
          const P = pen(s, v); hit = [];
          // input rows
          const chipW = 44, gx = 8, x0 = 54;
          [['A', A, 'blue', 10], ['B', B, 'orange', 46]].forEach(([nm, S, col, y]) => {
            P.tex(nm, 26, y + 13, { size: 19, color: col });
            CH.forEach((u, j) => {
              const x = x0 + j * (chipW + gx), on = S.has(u);
              P.box(x, y, chipW, 26, { r: 6, fill: on ? col : null, alpha: 0.3, stroke: on ? col : 'faint', width: on ? 1.8 : 1 });
              P.text(sh(u), x + chipW / 2, y + 13.5, { size: 13, color: on ? 'ink' : 'muted', weight: on ? 600 : 500 });
              hit.push({ x, y, w: chipW, h: 26, set: nm, str: u });
            });
            P.sans(`|${nm}| = ${S.size}`, x0 + CH.length * (chipW + gx) + 6, y + 13, { align: 'left', size: 13, weight: 600, color: col });
          });
          P.line(14, 86, P.W - 14, 86, { color: 'grid', width: 1 });
          const R = result(), strs = [...R.keys()].sort(sortSL), isCat = op.value === 'cat' || op.value === 'catr';
          const name = { union: 'A ∪ B', cat: 'AB, by length', catr: 'BA, by length', star: 'A*, strings of length ≤ 4' }[op.value];
          P.sans(name, 14, 102, { align: 'left', size: 13, weight: 600, color: 'muted' });
          // pair table for concatenation, on the right
          let right = P.W - 10;
          if (isCat) {
            const [X, Y, nx, ny] = pair(), xs = [...X].sort(sortSL), ys = [...Y].sort(sortSL), c = 40, rh = 26;
            const tw = (ys.length + 1) * c, tx = P.W - 14 - tw, ty = 110;
            right = tx - 24;
            P.sans(`all |${nx}|·|${ny}| = ${xs.length * ys.length} pairs`, tx + tw / 2, 100, { size: 12, color: 'muted', weight: 600 });
            ys.forEach((y, j) => P.text(sh(y), tx + (j + 1.5) * c, ty + rh / 2, { size: 12.5, weight: 600, color: COL[ny] }));
            xs.forEach((x, i) => {
              P.text(sh(x), tx + c / 2, ty + (i + 1.5) * rh, { size: 12.5, weight: 600, color: COL[nx] });
              ys.forEach((y, j) => {
                const u = x + y, many = R.get(u).length > 1;
                P.box(tx + (j + 1) * c + 1, ty + (i + 1) * rh + 1, c - 2, rh - 2, { r: 3, fill: many ? 'red' : 'accent', alpha: many ? 0.22 : 0.07, stroke: many ? 'red' : 'faint' });
                P.text(sh(u), tx + (j + 1.5) * c, ty + (i + 1.5) * rh + 0.5, { size: Math.min(12.5, (c - 4) / Math.max(1, u.length) * 1.6), color: many ? 'red' : 'ink' });
              });
            });
          }
          if (op.value === 'union') { // Venn diagram on the right
            const R0 = 74, cy = 214, cxA = P.W - 250, cxB = cxA + 92;
            P.circle(cxA, cy, R0, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.6 });
            P.circle(cxB, cy, R0, { fill: 'orange', fillAlpha: 0.08, color: 'orange', width: 1.6 });
            const onlyA = [...A].filter((x) => !B.has(x)).sort(sortSL), both = [...A].filter((x) => B.has(x)).sort(sortSL), onlyB = [...B].filter((x) => !A.has(x)).sort(sortSL);
            [[onlyA, cxA - 34, 'blue'], [both, (cxA + cxB) / 2, 'purple'], [onlyB, cxB + 34, 'orange']].forEach(([L, x, col]) => L.forEach((u, i) => P.text(sh(u), x, cy + (i - (L.length - 1) / 2) * 19, { size: 13, weight: 600, color: col })));
            P.tex('A', cxA - R0 + 6, cy - R0 + 4, { size: 16, color: 'blue' }); P.tex('B', cxB + R0 - 6, cy - R0 + 4, { size: 16, color: 'orange' });
            right = cxA - R0 - 20;
          }
          // result rows by length; letter width adapts to the widest row
          const rows = []; for (let L = 0; L <= MAXL; L++) rows.push(strs.filter((u) => u.length === L));
          const need = Math.max(...rows.map((r) => r.reduce((a, u) => a + Math.max(1, u.length) + 1.6, 0)));
          const lw = Math.min(15, (right - 64) / Math.max(need, 1)), rh = 44;
          rows.forEach((row, L) => {
            const y = 114 + L * rh; let x = 58;
            P.text(`|w|=${L}`, 12, y + 15, { align: 'left', size: 10.5, color: 'muted', font: SANS });
            if (!row.length) { P.text('—', x + 6, y + 15, { size: 12, color: 'faint' }); return; }
            for (const u of row) {
              const fs = R.get(u), f = fs[0], wpx = Math.max(1, u.length) * lw + 10;
              P.box(x, y, wpx, 30, { r: 5, stroke: fs.length > 1 && op.value !== 'union' ? 'red' : 'faint' });
              let cx = x + 5;
              if (!u.length) P.text(EPS, x + wpx / 2, y + 15.5, { size: 13, color: 'muted' });
              for (const [piece, org] of f) {
                if (!piece.length) { P.line(cx, y + 5, cx, y + 25, { color: COL[org], width: 2.4 }); continue; } // an ε factor
                P.box(cx, y + 5, piece.length * lw, 20, { r: 3, fill: COL[org], alpha: 0.26, stroke: false });
                P.text(piece, cx + (piece.length * lw) / 2, y + 15.5, { size: Math.min(14, lw * 1.2), weight: 600, color: COL[org] });
                cx += piece.length * lw;
              }
              if (op.value === 'union' && fs.length > 1) P.box(x + 3, y + 27, wpx - 6, 2.5, { r: 1, fill: 'orange', alpha: 1, stroke: false });
              if (op.value !== 'union' && fs.length > 1) {
                P.box(x + wpx - 10, y - 7, 20, 14, { r: 7, fill: 'red', alpha: 0.9, stroke: false });
                P.text(`×${fs.length}`, x + wpx, y, { size: 9.5, weight: 700, color: 'panel', font: SANS });
              }
              x += wpx + lw * 1.4;
            }
          });
        });
        v.legend([['blue', '$A$ factor', { dot: true }], ['teal', 'next $A$ factor (star)', { dot: true }], ['orange', '$B$ factor', { dot: true }], ['red', 'several factorizations', { dot: true }]]);
        v.readout(() => {
          const R = result(), n = R.size;
          if (op.value === 'union') {
            const both = [...A].filter((x) => B.has(x)).length;
            return String.raw`$|A\cup B| = |A| + |B| - |A\cap B| = ${A.size} + ${B.size} - ${both} = ${n}$` + (both ? ` (orange underline: in both)` : '');
          }
          if (op.value === 'star') {
            const by = [0, 1, 2, 3, 4].map((L) => [...R.keys()].filter((u) => u.length === L).length);
            const triv = [...A].every((x) => x === '');
            return triv ? String.raw`$A\subseteq\{\varepsilon\}$, so $A^* = \{\varepsilon\}$: the star of $\varnothing$ or $\{\varepsilon\}$ is not empty but has just one string.`
              : String.raw`$A^*$ is infinite; its strings of length $0,1,2,3,4$ number ${by.join(', ')}. $\varepsilon\in A^*$ always ($k = 0$ factors).`;
          }
          const multi = [...R.entries()].filter(([, f]) => f.length > 1);
          const XY = op.value === 'cat' ? 'AB' : 'BA', other = op.value === 'cat' ? 'BA' : 'AB';
          const swapped = new Set(); const [Y, X] = pair(); for (const x of X) for (const y of Y) swapped.add(x + y);
          const comm = n === swapped.size && [...R.keys()].every((u) => swapped.has(u));
          let s = String.raw`$|A|\cdot|B| = ${A.size * B.size}$ pairs give $|${XY}| = ${n}$ strings`;
          if (multi.length) { const [u, fs] = multi[0]; s += ` — e.g. **${sh(u)}** = ${fs.map((f) => f.map(([p]) => sh(p)).join('·')).join(' = ')}`; }
          else if (A.size && B.size) s += ' (no collisions)';
          return s + ` · $${XY} ${comm ? '=' : '\\neq'} ${other}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Shortlex order on Σ*',
      statement: String.raw`Fix a linear order $a_0<a_1<\dots<a_{k-1}$ on a finite alphabet $\Sigma$. The **shortlex** (length-lexicographic, canonical) order on $\Sigma^*$ puts $x$ before $y$ if $|x|<|y|$, or if $|x|=|y|$ and $x$ comes first in dictionary order. It lists $\Sigma^*$ as a sequence $s_0=\varepsilon,s_1,s_2,\dots$ in which every string occurs exactly once, at the finite position
$$\operatorname{pos}(w)=\frac{k^{n}-1}{k-1}+\sum_{i=1}^{n}d_i\,k^{\,n-i}\qquad(k\ge2,\ n=|w|,\ w_i=a_{d_i}),$$
and $\operatorname{pos}(a_0^{\,n})=n$ when $k=1$. Plain dictionary order is *not* such a listing when $k\ge2$: $a_0,a_0a_0,a_0a_0a_0,\dots$ all precede $a_1$, so $a_1$ has no finite position.`,
      idea: String.raw`Shortlex visits the strings length by length, and each length class $\Sigma^n$ is finite ($k^n$ strings), so any string is reached after the $1+k+\dots+k^{n-1}=(k^n-1)/(k-1)$ shorter strings plus the strings of its own length that precede it; reading $w$ as the base-$k$ numeral $d_1d_2\dots d_n$ counts the latter. On the tree of all strings this is breadth-first search, while dictionary order is depth-first search, which never returns from the infinite leftmost branch.`,
      caption: String.raw`Step (or play) through the order: the gold node is the current string, its number is its position. Type a string to see its position computed by the formula and checked by counting; the path to it is highlighted. Switch to **dictionary** order: the walk dives down the $a$-branch forever, and every string containing another letter is marked $\infty$.`,
      deps: ['toc-1.1'],
      refs: ['Sipser §0.2'],
      tags: ['enumeration', 'strings'],
      viz(v) {
        const ALPH = ['a', 'b', 'c'];
        let w = 'ba';
        const kS = v.slider('$k = |\\Sigma|$', 1, 3, 2, { int: true, onChange: () => { w = [...w].filter((c) => ALPH.indexOf(c) < kS.value).join(''); keys.b.hidden = kS.value < 2; keys.c.hidden = kS.value < 3; S.reset(); } });
        const ord = v.select('order', [{ value: 'sl', label: 'shortlex' }, { value: 'dict', label: 'dictionary' }], 'sl', { onChange: () => S.reset() });
        const keys = keypad(v, ALPH, () => w, (x) => { w = x; }, { max: 7 });
        keys.c.hidden = true;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, full: true });
        const depth = () => (kS.value === 1 ? 6 : 3);
        const frames = () => {
          const al = ALPH.slice(0, kS.value), dict = ord.value === 'dict' && kS.value > 1;
          const list = dict ? Array.from({ length: 12 }, (_, i) => 'a'.repeat(i)) : upTo(al, depth());
          return list.map((u, i) => ({ u, i, note: dict ? (i < 4 ? `Position ${i}: **${sh(u)}**.` : `Position ${i}: **${u}** — still inside the $a$-branch; **b** is never reached.`) : `Position ${i}: **${sh(u)}**${i === 0 ? ' (the empty string comes first).' : '.'}` }));
        };
        const S = v.steps({ frames, speed: 2.5, still: 9 });
        const pos = (u, k) => { const n = u.length; if (k === 1) return n; let p = (k ** n - 1) / (k - 1), val = 0; for (const c of u) val = val * k + ALPH.indexOf(c); return p + val; };
        v.render(() => {
          const P = pen(s, v), k = kS.value, D = depth(), al = ALPH.slice(0, k), dict = ord.value === 'dict' && k > 1;
          const levels = dict ? D + 2.7 : D + 1.5, dy = (P.H - 40) / levels, top = 22, f = S.frame, cur = f.u, seen = new Set(S.frames.slice(0, S.i + 1).map((g) => g.u));
          const xy = (u) => { const L = u.length; let j = 0; for (const c of u) j = j * k + ALPH.indexOf(c); const m = 30, span = (P.W - 2 * m) / k ** L; return [m + (j + 0.5) * span, top + L * dy]; };
          const r = k === 3 ? 11 : k === 2 ? 14 : 13;
          const onPath = (u) => w.startsWith(u) && u.length <= w.length;
          const nodes = upTo(al, D);
          // edges with letter labels
          for (const u of nodes) if (u.length) {
            const [x1, y1] = xy(u.slice(0, -1)), [x2, y2] = xy(u), hot = onPath(u);
            P.line(x1, y1 + r, x2, y2 - r, { color: hot ? 'gold' : 'faint', width: hot ? 3 : 1.2 });
            if (k < 3 || u.length < 3) P.text(u.slice(-1), (x1 + x2) / 2 + (x2 < x1 ? -7 : x2 > x1 ? 7 : 8), (y1 + y2) / 2, { size: 11, color: hot ? 'gold' : 'muted', weight: 600, halo: true });
          }
          // continuation below the drawn depth
          if (dict) {
            let [x, y] = xy('a'.repeat(D));
            for (let L = D + 1; L <= D + 2; L++) {
              const y2 = top + L * dy; P.line(x, y + r + (L === D + 1 ? 16 : 0), x, y2 - r, { color: 'red', width: 1.6, dash: [5, 4] });
              const u = 'a'.repeat(L), on = seen.has(u);
              P.circle(x, y2, r, { fill: u === cur ? 'gold' : on ? 'red' : 'panel', fillAlpha: u === cur ? 1 : on ? 0.25 : 1, color: 'red', width: 1.6 });
              P.text(String(L), x, y2 + 0.5, { size: 11, weight: 700, color: u === cur ? onColor(v, 'gold') : 'red', font: SANS });
              P.text(u, x + r + 6, y2, { align: 'left', size: 11, color: 'red' });
              y = y2;
            }
            P.sans('⋮  forever', x + r + 6, y + 22, { align: 'left', size: 12, color: 'red', weight: 600 });
          } else {
            const cntNext = k ** (D + 1), first = (k ** (D + 1) - 1) / Math.max(1, k - 1);
            for (const u of layer(al, D)) { const [x, y] = xy(u); for (let t = 0; t < k; t++) P.line(x, y + r + 17, x + (t - (k - 1) / 2) * 7, y + r + 27, { color: 'faint', width: 1, dash: [2, 2] }); }
            P.sans(k === 1 ? `next: ${'a'.repeat(D + 1)} at position ${D + 1}, and so on` : `next: the ${cntNext} strings of length ${D + 1}, at positions ${first}–${first + cntNext - 1}, and so on`, P.W / 2, top + D * dy + r + 42, { size: 12.5, color: 'muted' });
          }
          for (const u of nodes) {
            const [x, y] = xy(u), isCur = u === cur, done = seen.has(u), num = dict ? (/^a*$/.test(u) ? u.length : '∞') : pos(u, k);
            const col = dict && num === '∞' ? 'red' : 'accent';
            P.circle(x, y, r, { fill: isCur ? 'gold' : done ? col : 'panel', fillAlpha: isCur ? 1 : done ? 0.85 : 1, color: isCur ? 'gold' : onPath(u) ? 'gold' : col, width: onPath(u) ? 2.6 : 1.4 });
            P.text(String(num), x, y + 0.5, { size: r < 12 ? 9.5 : 11, weight: 700, color: isCur ? onColor(v, 'gold') : done ? onColor(v, col) : col, font: SANS });
            if (u.length === D) P.text(sh(u), x, y + r + 9, { size: k === 3 ? 9 : 11, color: onPath(u) ? 'gold' : 'muted' });
          }
          P.text(EPS, xy('')[0] + r + 8, top, { align: 'left', size: 12, color: 'muted' });
        });
        v.legend([['gold', 'current string / path to $w$', { dot: true }], ['accent', 'already listed', { dot: true }], ['red', 'no finite position', { dot: true }]]);
        v.readout(() => {
          const k = kS.value, n = w.length, al = ALPH.slice(0, k);
          if (ord.value === 'dict' && k > 1) {
            return /^a*$/.test(w) ? `In dictionary order **${sh(w)}** has position ${n} — only the strings $a^m$ get a finite position.`
              : `In dictionary order **${w}** is preceded by **aa**, **aaa**, **aaaa**, … — infinitely many strings, so it never gets a position.`;
          }
          const p = pos(w, k), counted = n <= 7 ? upTo(al, n).indexOf(w) : null;
          if (k === 1) return `Unary alphabet: **${sh(w)}** has position ${p} = its length${counted != null ? ` ✓ (counted: ${counted})` : ''}.`;
          let val = 0; for (const c of w) val = val * k + ALPH.indexOf(c);
          return String.raw`Position of **${sh(w)}** $= \frac{${k}^{${n}}-1}{${k}-1} + (${w.split('').map((c) => ALPH.indexOf(c)).join('') || '0'})_{${k}} = ${(k ** n - 1) / (k - 1)} + ${val} = ${p}$` + (counted != null ? ` ✓ (counted in the list: ${counted})` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Σ* is countable',
      statement: String.raw`For every finite alphabet $\Sigma$ the set $\Sigma^*$ of all strings is countably infinite. The same holds for a countably infinite alphabet such as $\Sigma=\N$. Consequently any set of objects that can be written down as strings — numbers, graphs, formulas, programs, Turing machines — is countable.`,
      idea: String.raw`$\Sigma^*=\bigcup_n\Sigma^n$ is a countable union of sets that are finite for a finite alphabet, so listing them length by length (shortlex, 1.3) reaches every string; this is the countable-union theorem pma-2.12 in its easiest case. For $\Sigma=\N$ each $\Sigma^n$ is itself countable (tuples of a countable set, pma-2.13) but infinite, so the length-by-length walk would never leave $\Sigma^1$; instead one dovetails along the diagonals of the table (length, position in row), exactly as in the proof of pma-2.12.`,
      caption: String.raw`Rows hold the strings of each length, and the path is the enumeration, numbering every cell it passes. Type a string to see the step at which it is reached. Over $\{a,b\}$ the rows are finite and the triangle is swept row by row. Switch to the infinite alphabet $\N$: row by row, the walk is trapped in row 1 forever; walking along diagonals reaches every cell after finitely many steps.`,
      deps: ['toc-1.3', 'pma-2.13', 'pma-2.12'],
      refs: ['Sipser §4.2'],
      credit: 'Cantor, 1874–1878',
      tags: ['countability', 'enumeration'],
      viz(v) {
        let w = 'aba', t = [2, 1];
        const mode = v.select('', [{ value: 'fin', label: '$\\Sigma=\\{a,b\\}$, row by row' }, { value: 'rows', label: '$\\Sigma=\\N$, row by row' }, { value: 'diag', label: '$\\Sigma=\\N$, by diagonals' }], 'fin', { onChange: () => sync() });
        const ka = v.button('a', () => { if (w.length < 4) w += 'a'; }), kb = v.button('b', () => { if (w.length < 4) w += 'b'; });
        const kn = [1, 2, 3].map((d) => v.button(String(d), () => { if (t.length < 5) t.push(d); }));
        v.button('⌫', () => { if (mode.value === 'fin') w = w.slice(0, -1); else t.pop(); });
        const sync = () => { const f = mode.value === 'fin'; ka.hidden = kb.hidden = !f; kn.forEach((b) => (b.hidden = f)); };
        sync();
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 322, full: true });
        const binom = v.M.binom;
        const stepFin = (u) => (2 ** u.length - 1) + [...u].reduce((a, c) => 2 * a + (c === 'b' ? 1 : 0), 0);
        const stepDiag = (tt) => { if (!tt.length) return 0; const n = tt.length, d = n + rankN(tt, binom); return 1 + (d * (d - 1)) / 2 + (n - 1); };
        v.render(() => {
          const P = pen(s, v), md = mode.value, left = 46, rowH = 48, top = 14;
          for (let n = 0; n <= 5; n++) P.tex(`\\Sigma^{${n}}`, 22, top + n * rowH + 16, { size: 15, color: 'muted' });
          if (md === 'fin') {
            const cells = []; // [string, left x, top y, slot width]
            for (let n = 0; n <= 4; n++) {
              const L = layer(['a', 'b'], n), cw = Math.min(70, (P.W - left - 20) / 16), xs = left + (P.W - left - 20) / 2 - (cw * L.length) / 2;
              L.forEach((u, j) => cells.push([u, xs + j * cw, top + n * rowH, cw]));
            }
            const target = stepFin(w), gap = 10;
            // route: between neighbours in a row, and a carriage return under the row to the next one
            const segs = [];
            for (let i = 0; i + 1 < cells.length; i++) {
              const [, x, y, cw] = cells[i], [, x2, y2] = cells[i + 1], ym = y + 16, ym2 = y2 + 16;
              if (y === y2) segs.push([[x + cw - gap, ym], [x2 + 1, ym2]]);
              else { const yr = y + 35, xa = x + cw - gap / 2 + 4, xb = x2 - 6; segs.push([[x + cw - gap, ym], [xa, ym], [xa, yr], [xb, yr], [xb, ym2], [x2 + 1, ym2]]); }
            }
            segs.forEach((sg, i) => P.path(sg, { color: i < target ? 'accent' : 'faint', width: i < target ? 2.4 : 1.3 }));
            cells.forEach(([u, x, y, cw], i) => {
              const tgt = u === w;
              P.box(x + 1, y + 2, cw - gap - 1, 28, { r: 4, fill: i <= target ? 'accent' : null, alpha: 0.13, stroke: tgt ? 'gold' : i <= target ? 'accent' : 'faint', width: tgt ? 2.8 : 1 });
              P.text(sh(u), x + (cw - gap) / 2 + 0.5, y + 16.5, { size: 12, color: i <= target ? 'ink' : 'muted' });
              P.text(String(i), x + 2, y - 4, { align: 'left', size: 9, color: tgt ? 'gold' : 'muted', font: SANS, weight: 600 });
            });
            // row 5 as a band of 32 dots
            const y5 = top + 5 * rowH + 16, cw5 = Math.min(22, (P.W - left - 20) / 32), xs5 = left + (P.W - left - 20) / 2 - (cw5 * 32) / 2;
            const [, xl, yl, cwl] = cells[cells.length - 1];
            P.path([[xl + cwl - gap, yl + 16], [xl + cwl - gap / 2 + 4, yl + 16], [xl + cwl - gap / 2 + 4, yl + 35], [xs5 - 6, yl + 35], [xs5 - 6, y5], [xs5 + 2, y5]], { color: 'faint', width: 1.2, dash: [3, 3] });
            for (let j = 0; j < 32; j++) P.dot(xs5 + (j + 0.5) * cw5, y5, { r: 3, color: 'faint' });
            P.sans('32 strings of length 5 (steps 31–62), then 64 of length 6, …', P.W / 2, y5 + 17, { size: 11.5, color: 'muted' });
          } else {
            const room = P.W - left - 30 - (md === 'rows' ? 80 : 0), C = Math.max(5, Math.floor(room / 58)), cw = room / C;
            const cellXY = (n, j) => [left + j * cw + cw / 2, top + n * rowH + 16];
            const tgtN = t.length, tgtJ = rankN(t, binom), visible = (n, j) => n <= 5 && j < C && (n > 0 || j === 0);
            const stepOf = (n, j) => (n === 0 ? 0 : md === 'rows' ? (n === 1 ? j + 1 : Infinity) : 1 + ((n + j) * (n + j - 1)) / 2 + (n - 1));
            const tgtStep = md === 'rows' ? (tgtN <= 1 ? (tgtN ? t[0] : 0) : Infinity) : stepDiag(t);
            // the path
            const order = [[0, 0]];
            if (md === 'rows') for (let j = 0; j < C; j++) order.push([1, j]);
            else for (let d = 1; d <= C; d++) for (let n = 1; n <= d; n++) order.push([n, d - n]);
            const seq = []; let prevVis = true;
            for (const [n, j] of order) { if (visible(n, j)) { if (!prevVis) seq.push(null); seq.push(cellXY(n, j)); prevVis = true; } else prevVis = false; }
            const upto = []; for (const [n, j] of order) { if (stepOf(n, j) > tgtStep) break; upto.push(visible(n, j) ? cellXY(n, j) : null); }
            P.path(seq, { color: 'faint', width: 1.3 });
            P.path(upto, { color: 'accent', width: 2.6 });
            if (md === 'rows') { const [xe, ye] = cellXY(1, C - 1); P.arrow(xe + cw / 2 + 2, ye, P.W - 8, ye, { color: 'red', width: 2.4 }); P.sans(`on to ${C + 1}, ${C + 2}, …`, P.W - 10, ye - 14, { align: 'right', size: 11, color: 'red', weight: 600 }); P.sans('never returns', P.W - 10, ye + 15, { align: 'right', size: 11, color: 'red', weight: 600 }); }
            for (let n = 0; n <= 5; n++) {
              const R = rowN(n, n === 0 ? 1 : C);
              R.forEach((tt, j) => {
                const [x, y] = cellXY(n, j), st = stepOf(n, j), isT = n === tgtN && j === tgtJ, reached = st <= tgtStep;
                P.box(x - cw / 2 + 2, y - 14, cw - 4, 28, { r: 4, fill: 'panel', alpha: 1, stroke: false });
                P.box(x - cw / 2 + 2, y - 14, cw - 4, 28, { r: 4, fill: st === Infinity ? 'red' : reached ? 'accent' : null, alpha: st === Infinity ? 0.06 : 0.13, stroke: isT ? 'gold' : st === Infinity ? 'red' : reached ? 'accent' : 'faint', strokeAlpha: st === Infinity && !isT ? 0.45 : 1, width: isT ? 2.8 : 1 });
                const lab = showN(tt), fs = Math.min(12, ((cw - 8) / lab.length) * 1.7);
                P.text(lab, x, y + 0.5, { size: fs, color: st === Infinity ? 'red' : 'ink', alpha: st === Infinity ? 0.6 : 1, halo: true });
                P.text(st === Infinity ? '∞' : String(st), x - cw / 2 + 5, y - 19, { align: 'left', size: 9, color: isT ? 'gold' : st === Infinity ? 'red' : 'muted', font: SANS, weight: 600 });
              });
              if (n > (md === 'rows' ? 1 : 0)) P.text('…', left + C * cw + 12, top + n * rowH + 16, { size: 14, color: 'muted' });
            }
            P.sans('⋮', left + 20, top + 6 * rowH - 6, { size: 14, color: 'muted' });
          }
        });
        v.legend([['accent', 'path up to the chosen string'], ['gold', 'chosen string', { dot: true }], ['red', 'never reached', { dot: true }]]);
        v.readout(() => {
          const md = mode.value;
          if (md === 'fin') { const n = w.length; return String.raw`**${sh(w)}** is reached at step $${2 ** n - 1} + ${stepFin(w) - (2 ** n - 1)} = ${stepFin(w)}$: the $2^0+\dots+2^{${n - 1}} = ${2 ** n - 1}$ shorter strings first, then its rank in row ${n}.`; }
          const n = t.length;
          if (md === 'rows') return n <= 1 ? `**${showN(t)}** is reached at step ${n ? t[0] : 0}.` : `**${showN(t)}** is **never** reached: row 1 = 1, 2, 3, … is infinite, and walking it takes forever.`;
          const j = rankN(t, binom), d = n + j;
          return n ? String.raw`**${showN(t)}** sits in row ${n} at position ${j}, on diagonal $d = ${d}$, and is reached at step $1 + \binom{${d}}{2} + ${n - 1} = ${stepDiag(t)}$.` : `ε is step 0.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'There are uncountably many languages',
      statement: String.raw`For every alphabet $\Sigma$ the set $\mathcal P(\Sigma^*)$ of all languages over $\Sigma$ is uncountable. Since the set of all programs (or Turing machines, or finite descriptions of any kind) is countable, all but countably many languages are recognised by no machine whatsoever.`,
      idea: String.raw`List $\Sigma^*$ as $s_1,s_2,\dots$ (1.4) and identify a language $L$ with its characteristic 0/1 sequence $(\,[s_j\in L]\,)_j$. Given any list $L_1,L_2,\dots$ of languages, the flipped diagonal $D=\{s_i : s_i\notin L_i\}$ differs from $L_i$ at the string $s_i$, so $D$ is missing from the list — Cantor's diagonal argument (pma-2.14), or Cantor's theorem $|X|<|\mathcal P(X)|$ (logic-1.2) for $X=\Sigma^*$. Machines are described by strings, hence countable, so some (indeed most) languages have no machine.`,
      caption: String.raw`Each row is a language, written as its membership bits on the first eight strings in shortlex order. Click a cell to change a bit, click a row name to swap in another language. The bottom row $D$ flips the gold diagonal and therefore disagrees with every row (≠ marks). Try to beat it with **Put D into the list**: the diagonal changes and the new $D$ escapes again. Click a cell of $D$ to see where it differs from that row.`,
      deps: ['toc-1.4', 'pma-2.14', 'logic-1.2'],
      refs: ['Sipser §4.2'],
      credit: 'Cantor, 1891 (diagonal argument)',
      tags: ['countability', 'diagonalization'],
      viz(v) {
        const STR = upTo(['a', 'b'], 3).slice(0, 8);
        const LIB = [
          ['even length', (u) => u.length % 2 === 0], ['starts with a', (u) => u[0] === 'a'], ['palindromes', (u) => u === rev(u)], ['∅', () => false],
          ['contains bb', (u) => u.includes('bb')], ['Σ*', () => true], ['#a = #b', (u) => cnt(u, 'a') === cnt(u, 'b')], ['ends in a', (u) => u.endsWith('a')],
          ['a*', (u) => /^a*$/.test(u)], ['{ε}', (u) => u === ''], ['odd # of b', (u) => cnt(u, 'b') % 2 === 1], ['|w| ≤ 1', (u) => u.length <= 1],
        ];
        let rows = LIB.slice(0, 8).map(([name, f], k) => ({ name, lib: k, bits: STR.map(f) }));
        let ins = 0, lastIns = -1, selCol = 2;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, full: true });
        const T = v.table(s, { rows: 9, cols: 8, maxCell: 40, size: 14, labelSize: 12.5 });
        const D = () => rows.map((r, i) => !r.bits[i]);
        s.onClick((x, y) => {
          const c = T.hit(x, y); if (!c) return;
          if (c.header === 'row' && c.i < 8) { const r = rows[c.i], k = ((r.lib < 0 ? -1 : r.lib) + 1) % LIB.length; rows[c.i] = { name: LIB[k][0], lib: k, bits: STR.map(LIB[k][1]) }; }
          else if (c.i >= 0 && c.i < 8 && c.j >= 0) { const r = rows[c.i]; r.bits = r.bits.slice(); r.bits[c.j] = !r.bits[c.j]; if (!r.name.endsWith('(edited)')) r.name = r.name.replace(/ \(edited\)$/, '') + ' (edited)'; r.lib = r.lib < 0 ? -1 : r.lib; selCol = c.j; }
          else if (c.i === 8 && c.j >= 0) selCol = c.j;
        });
        v.button('Put D into the list', () => { rows[ins] = { name: 'old D', lib: -1, bits: D() }; lastIns = ins; selCol = ins; ins = (ins + 1) % 8; });
        v.button('Shuffle rows', () => { const r = v.rng(Math.floor(Math.random() * 1e9)); rows = r.shuffle(rows.slice()); lastIns = -1; });
        v.render(() => {
          const d = D();
          T.draw({
            rowLabels: [...rows.map((r, i) => `L${subN(i + 1)}  ${r.name}`), 'D  (flipped diagonal)'],
            colLabels: STR.map(sh),
            value: (i, j) => (i < 8 ? (rows[i].bits[j] ? '1' : '0') : d[j] ? '1' : '0'),
            fill: (i, j) => (i === 8 ? ['green', d[j] ? 0.42 : 0.12] : i === j ? ['gold', 0.42] : rows[i].bits[j] ? ['accent', 0.14] : null),
            textColor: (i, j) => (i === 8 ? 'ink' : i === j ? 'ink' : rows[i].bits[j] ? 'ink' : 'muted'),
            weight: (i, j) => (i === j || i === 8 ? 700 : 500),
            highlight: [[8, selCol, 'red'], [selCol, selCol, 'red']],
            sub: (i, j) => (i === 8 ? '≠' : null), subColor: 'red', subSize: 11,
            rowLabelColor: (i) => (i === 8 ? 'green' : i === lastIns ? 'red' : null),
            activeCol: selCol, activeColor: 'red',
          });
          // an arrow up the right edge of the column, from D's cell to the diagonal cell it flips
          const rD = T.cellRect(8, selCol), rG = T.cellRect(selCol, selCol), xa = rD[0] + (rD[2] - rD[0]) * 0.86;
          s.arrow(xa, Math.max(rD[1], rD[3]) - (Math.abs(rD[3] - rD[1])) * 0.12, xa, Math.min(rG[1], rG[3]) + (Math.abs(rG[3] - rG[1])) * 0.1, { color: 'red', width: 1.8, dash: [4, 3], head: 7 });
        });
        v.legend([['gold', 'diagonal: is $s_i\\in L_i$?', { dot: true }], ['green', '$D=\\{s_i : s_i\\notin L_i\\}$', { dot: true }], ['red', 'where $D$ and $L_i$ differ']]);
        v.readout(() => {
          const d = D(), i = selCol, mem = d.map((b, k) => (b ? (STR[k] ? `\\mathtt{${STR[k]}}` : '\\varepsilon') : null)).filter((x) => x != null);
          const clash = rows.findIndex((r) => r.bits.every((b, k) => b === d[k]));
          return String.raw`$D\cap\{s_1,\dots,s_8\} = \{${mem.join(', ') || '\\;'}\}$ · at $s_{${i + 1}} = $ **${sh(STR[i])}**: $L_{${i + 1}}$ says ${rows[i].bits[i] ? 1 : 0}, $D$ says ${d[i] ? 1 : 0} — so $D\neq L_{${i + 1}}$, and likewise for every row (${clash < 0 ? 'no row equals $D$ ✓' : 'impossible'}). Eight rows against $2^8 = 256$ bit patterns; no list can hold them all, while $\Sigma^*$ and the set of programs are countable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Encodings: problems as languages',
      statement: String.raw`To feed an object $O$ (a number, a graph, a formula, a machine) to an algorithm we fix an **encoding** $\langle O\rangle$: an injective map from objects to strings over a finite alphabet, computable and decodable by algorithms. A decision problem then *is* a language, e.g.
$$\mathrm{CONNECTED}=\{\langle G\rangle : G\text{ is a connected undirected graph}\},$$
and solving the problem means deciding membership in that language (strings that encode nothing are rejected). Reasonable encodings are interconvertible in polynomial time and have polynomially related lengths, so whether a problem is decidable, or decidable in polynomial time, does not depend on which one is chosen. Writing numbers in unary instead of binary is the classic unreasonable encoding: it is exponentially longer.`,
      idea: String.raw`An adjacency list for a graph with $n$ vertices and $m$ edges has length about $(n+m)\log n$, an adjacency matrix exactly $n^2$ bits plus separators; since $m\le n^2$ and $n$ is at most the length of either string, each length is bounded by a polynomial in the other, and converting between them takes polynomial time. So the encoding is a detail that can be fixed once and forgotten — as long as it is not padded exponentially.`,
      caption: String.raw`Edit the graph: click empty space to add a vertex, click two vertices in turn to add or remove the edge between them, drag to move, Alt-click to delete. The right panel shows $\langle G\rangle$ in two encodings, and the problem selector asks whether the string lies in the chosen language. Below, lengths are plotted on log–log axes against the number of vertices: the reader's graph (dots) lies between sparse and complete graphs, and all curves are polynomials.`,
      deps: ['toc-1.1'],
      refs: ['Sipser §3.3'],
      tags: ['encodings', 'decision problems'],
      viz(v) {
        const prob = v.select('language', [{ value: 'conn', label: 'CONNECTED' }, { value: 'tri', label: 'TRIANGLE' }, { value: 'bip', label: 'BIPARTITE' }], 'conn');
        const gs = v.stage({ x: [0, 10], y: [0, 7.4], axes: false, equal: true, height: 270, weight: 1 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, weight: 1.15 });
        const ps = v.stage({ x: [1, 300], y: [1, 4e5], xlog: true, ylog: true, axes: 'box', height: 200, full: true, xlabel: 'number of vertices n', ylabel: 'symbols in ⟨G⟩' });
        const pos = [[2, 5.6], [5, 6.4], [8, 5.4], [3.2, 2.6], [6.6, 2.4], [8.8, 1.2]];
        const G = v.graph(gs, {
          nodes: pos.map(([x, y], i) => ({ id: i + 1, x, y })), edges: [[1, 2], [2, 3], [1, 4], [2, 4], [4, 5], [3, 5]],
          editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true }, layout: 'none', r: 13,
        });
        const enc = () => {
          const N = G.nodes, idx = new Map(N.map((n, i) => [String(n.id), i + 1])), n = N.length;
          const E = G.edges.map((e) => [idx.get(String(e.from)), idx.get(String(e.to))]).filter(([a, b]) => a && b).map(([a, b]) => (a < b ? [a, b] : [b, a])).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
          const list = `(${N.map((_, i) => i + 1).join(',')})(${E.map(([a, b]) => `(${a},${b})`).join(',')})`;
          const A = Array.from({ length: n }, () => Array(n).fill('0')); for (const [a, b] of E) { A[a - 1][b - 1] = '1'; A[b - 1][a - 1] = '1'; }
          return { n, m: E.length, E, A, list, mat: A.map((r) => r.join('')).join('#') };
        };
        const answer = (e) => { // → [yes, why, colour of vertex i (1-based)]
          const { n, E } = e, adj = Array.from({ length: n + 1 }, () => []); for (const [a, b] of E) { adj[a].push(b); adj[b].push(a); }
          if (prob.value === 'conn') {
            if (!n) return [true, 'the empty graph', () => null];
            const seen = new Set([1]), q = [1]; while (q.length) for (const y of adj[q.shift()]) if (!seen.has(y)) { seen.add(y); q.push(y); }
            return [seen.size === n, `BFS from vertex 1 reaches ${seen.size} of ${n}`, (i) => (seen.has(i) ? 'green' : 'red')];
          }
          if (prob.value === 'tri') {
            for (const [a, b] of E) for (const c of adj[a]) if (c !== b && adj[b].includes(c)) { const T = [a, b, c].sort((x, y) => x - y); return [true, `triangle ${T.join('–')}`, (i) => (T.includes(i) ? 'green' : null)]; }
            return [false, 'no three mutually adjacent vertices', () => null];
          }
          const col = Array(n + 1).fill(-1);
          for (let s0 = 1; s0 <= n; s0++) {
            if (col[s0] >= 0) continue; col[s0] = 0; const q = [s0];
            while (q.length) { const x = q.shift(); for (const y of adj[x]) { if (col[y] < 0) { col[y] = 1 - col[x]; q.push(y); } else if (col[y] === col[x]) return [false, `edge ${Math.min(x, y)}–${Math.max(x, y)} closes an odd cycle`, (i) => (i === x || i === y ? 'red' : null)]; } }
          }
          return [true, '2-colouring found by BFS', (i) => (col[i] ? 'orange' : 'blue')];
        };
        // exact lengths of the two encodings for cycles and complete graphs
        const dig = (k) => String(k).length, sumDig = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += dig(i); return s; };
        const vpart = (n) => 2 + sumDig(n) + Math.max(0, n - 1);
        const lenList = (n, m, pairDigits) => vpart(n) + 2 + Math.max(0, m - 1) + 3 * m + pairDigits;
        const cycleLen = (n) => (n < 3 ? lenList(n, n - 1, n === 2 ? 2 : 0) : lenList(n, n, 2 * sumDig(n)));
        const completeLen = (n) => lenList(n, (n * (n - 1)) / 2, (n - 1) * sumDig(n));
        const matLen = (n) => n * n + n - 1;
        v.render(() => {
          const e = enc(), [yes, , colOf] = answer(e), ix = (id) => G.nodes.findIndex((n) => n.id === id) + 1;
          G.draw({ nodeLabel: (id) => String(ix(id)), nodeColor: (id) => colOf(ix(id)) });
          gs.corner(yes ? 'answer: yes' : 'answer: no', 'tl', { color: yes ? 'green' : 'red', weight: 700, size: 13 });
          // encodings panel
          const P = pen(ts, v), cwid = P.tw('0', 12.5), per = Math.max(10, Math.floor((P.W - 24) / cwid));
          const block = (title, str, y0, colOf) => {
            P.sans(title, 12, y0, { align: 'left', size: 12.5, weight: 600, color: 'muted' });
            const lines = []; for (let i = 0; i < str.length; i += per) lines.push(str.slice(i, i + per));
            const shown = lines.slice(0, 5);
            shown.forEach((ln, k) => [...ln].forEach((ch, q) => P.text(ch, 12 + q * cwid + cwid / 2, y0 + 20 + k * 17, { size: 12.5, color: colOf(ch), weight: 500 })));
            if (lines.length > 5) P.sans(`… ${str.length - 5 * per} more symbols`, 12, y0 + 20 + 5 * 17, { align: 'left', size: 11, color: 'muted' });
            return y0 + 20 + Math.min(lines.length, 5) * 17 + (lines.length > 5 ? 17 : 0);
          };
          let y = block(`adjacency list  (${e.list.length} symbols)`, e.list, 14, (ch) => (/[0-9]/.test(ch) ? 'accent' : 'muted'));
          y = block(`adjacency matrix, rows joined by #  (${e.mat.length} symbols)`, e.mat || 'ε', y + 14, (ch) => (ch === '1' ? 'accent' : ch === '#' ? 'orange' : 'muted'));
          // the same matrix as a picture: row i of the string is row i of the grid
          const room = P.H - y - 12, c = Math.max(5, Math.min(16, room / Math.max(1, e.n)));
          if (e.n && c * e.n <= room + 1) {
            const gx = 30, gy = y + 8;
            for (let i = 0; i < e.n; i++) {
              if (c >= 10) { P.text(String(i + 1), gx - 8, gy + (i + 0.5) * c, { size: 9.5, color: 'muted', font: SANS }); P.text(String(i + 1), gx + (i + 0.5) * c, gy - 6, { size: 9.5, color: 'muted', font: SANS }); }
              for (let j = 0; j < e.n; j++) P.box(gx + j * c + 0.5, gy + i * c + 0.5, c - 1, c - 1, { r: 1.5, fill: e.A[i][j] === '1' ? 'accent' : null, alpha: 0.75, stroke: 'faint', width: 0.8 });
            }
            P.sans('row i = the i-th block of the string', gx + e.n * c + 12, gy + (e.n * c) / 2, { align: 'left', size: 11.5, color: 'muted' });
          }
          // length plot
          ps.fn(matLen, { color: 'orange', width: 2 });
          ps.fn(completeLen, { color: 'accent', width: 2 });
          ps.fn(cycleLen, { color: 'accent', width: 2, dash: [6, 4] });
          if (e.n >= 1) {
            ps.dot(e.n, Math.max(1, e.mat.length), { r: 7, color: 'orange', hollow: true, width: 2.4, label: 'matrix', labelPos: 'se' });
            ps.dot(e.n, e.list.length, { r: 4.5, color: 'accent', label: 'list', labelPos: 'nw' });
          }
        });
        v.legend([['orange', 'matrix encoding ($n^2+n-1$)'], ['accent', 'list encoding, complete graphs'], ['accent', 'list encoding, cycles', { dash: true }]]);
        v.readout(() => {
          const e = enc(), [yes, why] = answer(e), name = { conn: 'CONNECTED', tri: 'TRIANGLE', bip: 'BIPARTITE' }[prob.value];
          return `$n = ${e.n}$, $m = ${e.m}$ · ⟨G⟩ ${yes ? '∈' : '∉'} ${name} (${why}) — the same answer for both strings · lengths ${e.list.length} (list) and ${e.mat.length} (matrix): each is at most a polynomial in the other, and converting takes $O(n^2)$ steps.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Induction on strings',
      statement: String.raw`To prove a property $P(w)$ for every $w\in\Sigma^*$ it suffices to prove
(a) **base case:** $P(\varepsilon)$;
(b) **inductive step:** for every string $u$ and symbol $\sigma\in\Sigma$, $P(u)$ implies $P(u\sigma)$.

This is ordinary induction on the length $|w|$, organised along the way strings are built (every nonempty string is uniquely $u\sigma$). It is the standard tool for facts defined by recursion on strings — reversal ($\varepsilon^R=\varepsilon$, $(u\sigma)^R=\sigma u^R$), the extended transition function of an automaton (2.2), derivations of grammars — and the inductive step must work for *every* $u$ and $\sigma$, not just for the first few.`,
      idea: String.raw`Every string is reached from $\varepsilon$ by appending one symbol at a time, so the strings form a tree rooted at $\varepsilon$ in which each node has its parent as the shorter case; the base case settles the root and the inductive step pushes truth from each node to its children. For $(xy)^R=y^Rx^R$ one inducts on $y$: $(xu\sigma)^R=\sigma(xu)^R=\sigma u^Rx^R=(u\sigma)^Rx^R$, using the recursive definition twice and the hypothesis once. A false claim such as $w^R=w$ passes the base case and the one-letter strings, but its inductive step needs $\sigma u=u\sigma$, which fails at $u=a$, $\sigma=b$.`,
      caption: String.raw`Step through the strings in shortlex order. Each step verifies the claim at the gold node by the inductive template on the right, which uses only the parent's case (the highlighted edge) — the concrete strings are filled in and evaluated. Choose the false claim $w^R=w$ and watch the step break at **ab**: everything below it is left unproved.`,
      deps: ['toc-1.1'],
      refs: ['Sipser §0.4'],
      tags: ['induction', 'proof method'],
      viz(v) {
        const X = 'ab';
        const claim = v.select('claim', [{ value: 'revcat', label: '$(xy)^R = y^Rx^R$ with $x = \\mathtt{ab}$' }, { value: 'len', label: '$|w^R| = |w|$' }, { value: 'pal', label: '$w^R = w$ (false)' }], 'revcat', { onChange: (c) => S.reset({ at: c === 'pal' ? 4 : 'end' }) });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.1 });
        const ds = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const NODES = upTo(['a', 'b'], 3);
        const tt = (s) => (s ? String.raw`\mathtt{${s}}` : String.raw`\varepsilon`);
        function check(w) { // {ok, lines: [[symbolic, concrete]]} for the inductive step at w (or the base case)
          const c = claim.value;
          if (w === '') {
            if (c === 'revcat') return { ok: true, lines: [[String.raw`(x\,\varepsilon)^R = x^R = \varepsilon\, x^R`, String.raw`(${tt(X)})^R = ${tt(rev(X))} = ${tt('')}\cdot${tt(rev(X))}`]] };
            if (c === 'len') return { ok: true, lines: [[String.raw`|\varepsilon^R| = |\varepsilon| = 0`, String.raw`0 = 0`]] };
            return { ok: true, lines: [[String.raw`\varepsilon^R = \varepsilon`, String.raw`${tt('')} = ${tt('')}`]] };
          }
          const u = w.slice(0, -1), sg = w.slice(-1);
          if (c === 'revcat') {
            const l1 = sg + rev(X + u), l2 = sg + rev(u) + rev(X), l3 = rev(w) + rev(X), ok = rev(X + w) === l3;
            return { ok, lines: [
              [String.raw`(x\,u\sigma)^R = \sigma\,(x u)^R`, String.raw`(${tt(X)}\cdot${tt(w)})^R = ${tt(sg)}\cdot(${tt(X + u)})^R = ${tt(l1)}`],
              [String.raw`= \sigma\, u^R x^R \quad\text{by } P(u)`, String.raw`= ${tt(sg)}\cdot${tt(rev(u))}\cdot${tt(rev(X))} = ${tt(l2)}`],
              [String.raw`= (u\sigma)^R x^R`, String.raw`= ${tt(rev(w))}\cdot${tt(rev(X))} = ${tt(l3)}\ ${ok ? '\\checkmark' : '\\times'}`]] };
          }
          if (c === 'len') {
            const n = u.length;
            return { ok: true, lines: [
              [String.raw`|(u\sigma)^R| = |\sigma\, u^R| = 1 + |u^R|`, String.raw`|${tt(rev(w))}| = 1 + |${tt(rev(u))}|`],
              [String.raw`= 1 + |u| \quad\text{by } P(u)`, String.raw`= 1 + ${n}`],
              [String.raw`= |u\sigma|`, String.raw`= ${n + 1} = |${tt(w)}|\ \checkmark`]] };
          }
          const ok = sg + u === u + sg;
          return { ok, lines: [
            [String.raw`(u\sigma)^R = \sigma\, u^R`, String.raw`(${tt(w)})^R = ${tt(sg)}\cdot(${tt(u)})^R`],
            [String.raw`= \sigma\, u \quad\text{by } P(u)`, String.raw`= ${tt(sg)}\cdot${tt(u)} = ${tt(sg + u)}`],
            [String.raw`\overset{?}{=} u\sigma`, String.raw`${tt(sg + u)} ${ok ? '=' : '\\neq'} ${tt(w)}\ ${ok ? '\\checkmark' : '\\times\\ \\text{step fails}'}`]] };
        }
        const frames = () => {
          const status = {}; const out = [];
          NODES.forEach((w, i) => {
            const par = w.slice(0, -1), r = check(w);
            status[w] = w === '' ? (r.ok ? 'ok' : 'bad') : status[par] !== 'ok' ? 'open' : r.ok ? 'ok' : 'bad';
            out.push({ w, i, status: { ...status }, note: w === '' ? 'Base case: the claim holds for the empty string.' : status[w] === 'ok' ? `Step at **${w}** = **${sh(par)}**·**${w.slice(-1)}**: the claim for **${sh(par)}** gives the claim for **${w}**.` : status[w] === 'bad' ? `The inductive step fails at **${w}**: it would need $\\sigma u = u\\sigma$ with $u = $ **${par}**, $\\sigma = $ **${w.slice(-1)}**.` : `**${w}** is not proved: its parent **${sh(par)}** was never established.` });
          });
          return out;
        };
        const S = v.steps({ frames, speed: 1.6, still: 6 });
        v.render(() => {
          const P = pen(ts, v), f = S.frame, st = f.status || {}, top = 26, dy = (P.H - 52) / 3, r = 17;
          const xy = (u) => { let j = 0; for (const c of u) j = 2 * j + (c === 'b' ? 1 : 0); const span = (P.W - 24) / 2 ** u.length; return [12 + (j + 0.5) * span, top + u.length * dy]; };
          for (const u of NODES) if (u) {
            const [x1, y1] = xy(u.slice(0, -1)), [x2, y2] = xy(u), hot = u === f.w;
            P.line(x1, y1 + r, x2, y2 - r, { color: hot ? 'gold' : 'faint', width: hot ? 3.5 : 1.3 });
            P.text(u.slice(-1), (x1 + x2) / 2 + (x2 < x1 ? -8 : 8), (y1 + y2) / 2, { size: 11, color: 'muted', halo: true, weight: 600 });
          }
          for (const u of NODES) {
            const [x, y] = xy(u), s0 = st[u], isCur = u === f.w;
            const col = s0 === 'ok' ? 'green' : s0 === 'bad' ? 'red' : s0 === 'open' ? 'muted' : 'faint';
            P.circle(x, y, r, { fill: isCur ? 'gold' : s0 ? col : 'panel', fillAlpha: isCur ? 0.9 : s0 === 'open' ? 0.12 : s0 ? 0.28 : 1, color: isCur ? 'gold' : col, width: isCur ? 2.6 : 1.5, dash: s0 === 'open' ? [3, 3] : undefined });
            P.text(sh(u), x, y + 0.5, { size: u.length > 2 ? 11 : 12.5, weight: 600, color: isCur ? onColor(v, 'gold') : 'ink' });
          }
          // the inductive template, filled in
          const Q = pen(ds, v), r0 = check(f.w || '');
          Q.sans(f.w ? `inductive step at w = ${f.w}:  u = ${sh(f.w.slice(0, -1))},  σ = ${f.w.slice(-1)}` : 'base case  w = ε', 14, 20, { align: 'left', size: 13, weight: 600, color: 'muted' });
          r0.lines.forEach(([sym, con], k) => {
            Q.tex(sym, k ? 96 : 16, 56 + k * 74, { size: 15, align: 'left' });
            Q.tex(con, k ? 110 : 30, 56 + k * 74 + 28, { size: 14, align: 'left', color: r0.ok || k < r0.lines.length - 1 ? 'muted' : 'red' });
          });
          if (f.w) Q.sans(r0.ok ? 'uses only the claim for u — the parent node' : 'this step is invalid, so the claim is not proved for w', 14, Q.H - 14, { align: 'left', size: 12, color: r0.ok ? 'green' : 'red', weight: 600 });
        });
        v.legend([['green', 'proved', { dot: true }], ['gold', 'current step', { dot: true }], ['red', 'step fails', { dot: true }], ['muted', 'not proved', { dot: true }]]);
        v.readout(() => {
          const st = S.frame.status || {}, ok = Object.values(st).filter((x) => x === 'ok').length, bad = Object.keys(st).find((k) => st[k] === 'bad');
          const truth = NODES.filter((w) => (claim.value === 'pal' ? rev(w) === w : true)).length;
          return `Proved so far: ${ok} of ${NODES.length} strings of length ≤ 3` + (bad != null ? ` · the step fails at **${bad}**, and indeed the claim is false for ${NODES.length - truth} of these strings.` : S.atEnd ? ` · every step used only the shorter string's case, and the same template works for every $u$ and $\\sigma$, so the claim holds for all of $\\Sigma^*$.` : ` · each step so far used only its parent's case.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Boolean formulas and satisfiability',
      statement: String.raw`A **Boolean formula** is built from variables $x_1,\dots,x_n$ with the connectives $\neg,\land,\lor$ (and abbreviations such as $\to,\leftrightarrow,\oplus$). A truth assignment gives each variable a value in $\{0,1\}$ and thereby the formula a value, computed bottom-up along its parse tree. A formula is **satisfiable** if some assignment makes it true; the language $\mathrm{SAT}=\{\langle\varphi\rangle : \varphi\text{ is satisfiable}\}$ is the central problem of Chapter 7 (Cook–Levin).

A **literal** is a variable or its negation, a **clause** is an $\lor$ of literals, and a formula is in **conjunctive normal form** (CNF) if it is an $\land$ of clauses. Every formula is equivalent to a CNF formula: take one clause per falsifying assignment, the clause that is false exactly there.`,
      idea: String.raw`The value of a formula under an assignment is a bottom-up evaluation of its parse tree, so a truth table with $2^n$ rows lists the formula's whole meaning, and satisfiability asks whether that column contains a 1. The clause $(\ell_1\lor\dots\lor\ell_n)$ with $\ell_i=\neg x_i$ when $x_i=1$ and $\ell_i=x_i$ when $x_i=0$ is false on exactly one row, so the $\land$ of these clauses over the falsifying rows is false exactly where $\varphi$ is: an equivalent CNF, at worst exponentially long — which is why later chapters convert to CNF more cleverly (Tseitin) when size matters.`,
      caption: String.raw`Click an operator in the parse tree to cycle it (∧ ∨ → ↔ ⊕) and a leaf to change its variable; pick a row of the truth table to evaluate the tree under that assignment (green = true, red = false). Step through the CNF conversion: each step adds the clause killing one falsifying row, and the last column, the CNF built so far, converges to $\varphi$.`,
      deps: ['logic-2.3'],
      refs: ['Sipser §0.2', 'Sipser §7.4'],
      tags: ['logic', 'satisfiability'],
      viz(v) {
        const PRESETS = {
          p1: ['and', ['or', 'x', 'y'], ['not', 'z']],
          maj: ['or', ['or', ['and', 'x', 'y'], ['and', 'y', 'z']], ['and', 'x', 'z']],
          par: ['xor', ['xor', 'x', 'y'], 'z'],
          uns: ['and', ['and', ['imp', 'x', 'y'], ['imp', 'y', 'z']], ['not', ['imp', 'x', 'z']]],
        };
        let F = mkF(PRESETS.p1), selRow = 6;
        v.select('φ', [{ value: 'p1', label: '$(x\\lor y)\\land\\neg z$' }, { value: 'maj', label: 'majority' }, { value: 'par', label: 'parity' }, { value: 'uns', label: 'transitivity fails' }], 'p1', { onChange: (k) => { F = mkF(PRESETS[k]); rebuild(); S.reset(); } });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1.15 });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1 });
        const G = v.graph(ts, { nodes: [], edges: [], layout: 'none', shape: 'box', draggable: false, fontSize: 15, r: 14, notePos: 'e' });
        const T = v.table(tb, { rows: 8, cols: 5, maxCell: 32, size: 14, labelSize: 12, square: false, cellAspect: 1.35, colLabels: ['x', 'y', 'z', 'φ', 'CNF'] });
        const VARS = ['x', 'y', 'z'];
        const env = (i) => ({ x: !!(i & 4), y: !!(i & 2), z: !!(i & 1) });
        function rebuild() {
          const nodes = [], edges = [];
          (function walk(t) { nodes.push({ id: t.id, ref: t, label: t.op === 'var' ? t.v : OPSYM[t.op] }); for (const c of [t.a, t.b]) if (c) { edges.push([t.id, c.id]); walk(c); } })(F);
          G.set({ nodes, edges }).layout('tree', { root: F.id });
        }
        rebuild();
        G.onClick = ({ node }) => {
          if (!node) return true; const t = node.ref;
          if (BIN.includes(t.op)) t.op = BIN[(BIN.indexOf(t.op) + 1) % BIN.length];
          else if (t.op === 'var') t.v = VARS[(VARS.indexOf(t.v) + 1) % 3];
          rebuild(); S.reset(); return true;
        };
        tb.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) selRow = c.i; });
        const lit = (i) => { const e = env(i); return VARS.map((q) => (e[q] ? `\\neg ${q}` : q)); };
        const frames = () => {
          const bad = []; for (let i = 0; i < 8; i++) if (!evalF(F, env(i))) bad.push(i);
          const out = [{ k: 0, bad, note: bad.length ? `φ is false on ${bad.length} of 8 rows. Start with the empty CNF (true everywhere).` : 'φ is true on every row (a tautology): the empty CNF already equals φ.' }];
          bad.forEach((r, k) => out.push({ k: k + 1, bad, row: r, note: String.raw`Add the clause $(${lit(r).join(' \\lor ')})$: it is false only on row ${r + 1}, where φ is false.` }));
          return out;
        };
        const S = v.steps({ frames, speed: 1.2, still: 2 });
        const cnfVal = (i, f) => f.bad.slice(0, f.k).every((r) => r !== i);
        v.render(() => {
          const e = env(selRow), f = S.frame, val = {};
          (function ev(t) { if (t.a) ev(t.a); if (t.b) ev(t.b); val[t.id] = evalF(t, e); })(F);
          G.draw({ nodeFill: (id) => (val[id] ? 'green' : 'red'), nodeNote: (id) => (val[id] ? '1' : '0'), noteColor: (id) => (val[id] ? 'green' : 'red'), notePos: 'e' });
          T.draw({
            value: (i, j) => { const en = env(i); return j < 3 ? (en[VARS[j]] ? 1 : 0) : j === 3 ? (evalF(F, en) ? 1 : 0) : cnfVal(i, f) ? 1 : 0; },
            fill: (i, j) => (j === 3 ? (evalF(F, env(i)) ? ['green', 0.35] : null) : j === 4 ? (cnfVal(i, f) ? ['teal', 0.3] : f.row === i ? ['red', 0.3] : null) : null),
            activeRow: selRow, highlight: f.row != null ? [[f.row, 4, 'red']] : [],
            textColor: (i, j) => (j >= 3 ? 'ink' : 'muted'), weight: (i, j) => (j >= 3 ? 700 : 500),
          });
          T.box(selRow, 0, selRow, 4, { color: 'accent', width: 2.2 });
        });
        v.legend([['green', 'true (φ satisfied)', { dot: true }], ['red', 'false', { dot: true }], ['teal', 'CNF built so far is true', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, sat = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => evalF(F, env(i))), cl = f.bad.slice(0, f.k).map((r) => `(${lit(r).join(' \\lor ')})`);
          const agree = [0, 1, 2, 3, 4, 5, 6, 7].every((i) => cnfVal(i, f) === evalF(F, env(i)));
          return String.raw`$\varphi = ${texF(F)}$ is ${sat.length ? `**satisfiable** (${sat.length} of 8 rows)` : '**unsatisfiable**'} · CNF so far: $${cl.join(' \\land ') || '\\top'}$ — ${agree ? 'equal to φ on all 8 rows ✓' : `${[0, 1, 2, 3, 4, 5, 6, 7].filter((i) => cnfVal(i, f) !== evalF(F, env(i))).length} rows still differ`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Decision problems versus search problems',
      statement: String.raw`A **decision problem** asks a yes/no question about its input and is a language; a **search problem** asks for a witness, such as a factor of $N$ or a satisfying assignment of $\varphi$. Many search problems are **self-reducible**: an algorithm for the decision version can be called as a subroutine to find a witness with polynomially many calls. For factoring, the decision problem
$$\mathrm{FACTOR}=\{\langle N,k\rangle : N\text{ has a divisor }d\text{ with }1<d\le k\}$$
yields the smallest prime factor of $N$ by binary search on $k$ in about $\tfrac12\log_2 N$ calls, and the whole factorization in $O((\log N)^2)$ calls. So restricting the theory to decision problems loses nothing up to polynomial factors.`,
      idea: String.raw`The answers to "a factor $\le k$?" switch from no to yes exactly at $k=p$, the smallest prime factor, so the switching point can be located by halving the interval $[2,\lfloor\sqrt N\rfloor]$, one oracle call per halving; then divide by $p$ and repeat. There are at most $\log_2 N$ prime factors, and each costs at most $\lceil\log_2\sqrt N\rceil+1$ calls — polynomial in the bit length of $N$ (encodings, 1.6), even though $\sqrt N$ itself is exponential in it.`,
      caption: String.raw`Drag the gold marker to a value $k$ and press **Ask** — the oracle answers whether $N$ has a factor at most $k$ (green yes, red no) and the shaded interval of candidates for the smallest factor shrinks. **Ask at midpoint** plays binary search. Each factor found is split off in the bar below (widths proportional to $\log p$). Try the prime 1 000 003: the very first question already answers "no factor".`,
      deps: ['toc-1.6'],
      refs: ['Sipser §7.4'],
      tags: ['decision problems', 'self-reducibility'],
      viz(v) {
        const NS = { a: 391, b: 9991, c: 1000003, d: 600851475143 };
        let N0 = NS.d, N, lo, hi, log, found, calls, done;
        const spf = (n) => { if (n % 2 === 0) return 2; for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d; return n; };
        // the smallest factor p of N lies in [lo, hi]; hi = ⌊√N⌋ + 1 is a sentinel meaning "N may be prime"
        const restart = (from) => { lo = from; hi = Math.floor(Math.sqrt(N)) + 1; log = []; settle(); };
        function settle() {
          while (!done && lo >= hi) {
            if (lo <= rootN()) { const p = lo; found.push(p); N /= p; if (N === 1) done = true; else { lo = p; hi = rootN() + 1; log = []; } }
            else { found.push(N); N = 1; done = true; log = []; }
          }
        }
        const reset = () => { N = N0; found = []; calls = 0; done = N === 1; restart(2); };
        v.select('$N$', [{ value: 'a', label: '391' }, { value: 'b', label: '9,991' }, { value: 'c', label: '1,000,003' }, { value: 'd', label: '600,851,475,143' }], 'd', { onChange: (k) => { N0 = NS[k]; reset(); kh.set(mid(), 0); } });
        const s = v.stage({ x: [1, 10], y: [-1.15, 1.1], axes: false, height: 170, full: true, xlog: true });
        const bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 118, full: true });
        const fmtI = (x) => Math.round(x).toLocaleString('en-US');
        const rootN = () => Math.floor(Math.sqrt(N));
        const mid = () => Math.max(2, Math.min(rootN(), Math.floor((lo + hi) / 2)));
        const kh = s.handle(2, 0, { color: 'gold', constrain: (x) => [Math.round(v.M.clamp(x, 2, Math.max(2, rootN()))), 0] });
        function ask(k) {
          if (done) return; k = Math.round(k); calls++;
          const p = spf(N), yes = p <= k && p < N; // the oracle: is there a divisor d of N with 1 < d ≤ k?
          log.push({ k, yes });
          if (yes) hi = Math.min(hi, k); else lo = Math.max(lo, k + 1);
          settle();
          kh.set(mid(), 0);
        }
        v.button('Ask: factor ≤ k?', () => ask(kh.x));
        v.button('Ask at midpoint', () => ask(mid()));
        v.button('Restart', () => { reset(); kh.set(mid(), 0); });
        reset(); while (!found.length) ask(mid()); for (let i = 0; i < 4; i++) ask(mid()); // start part-way through
        v.render(() => {
          const R = Math.max(3, rootN());
          s.setView([1.6, R * 1.25], [-1.15, 1.1]);
          if (done) { s.text('fully factored', Math.sqrt(1.6 * R * 1.25), 0, { align: 'center', size: 15, color: 'green', weight: 600 }); }
          else {
            s.line(2, 0, R, 0, { color: 'muted', width: 2 });
            s.rect(lo, -0.22, Math.min(hi, R) + 0.999, 0.22, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.2 });
            log.forEach((q, i) => {
              const recent = i >= log.length - 2;
              s.line(q.k, -0.36, q.k, 0.36, { color: q.yes ? 'green' : 'red', width: recent ? 2.4 : 1.4, alpha: recent ? 1 : 0.6 });
              if (recent) s.text(`${fmtI(q.k)} ${q.yes ? 'yes' : 'no'}`, q.k, i === log.length - 1 ? 0.58 : 0.86, { align: 'center', size: 11, color: q.yes ? 'green' : 'red', weight: 600 });
            });
            s.text('2', 2, -0.6, { align: 'center', size: 11, color: 'muted' });
            s.text(`⌊√N⌋ = ${fmtI(rootN())}`, R, -0.6, { align: 'right', size: 11, color: 'muted', dx: 4 });
            s.text(`smallest factor of ${fmtI(N)} lies in [${fmtI(lo)}, ${fmtI(Math.min(hi, R))}]${hi > R ? ' — or it is prime' : ''}`, Math.sqrt(2 * R), -0.95, { align: 'center', size: 11.5, color: 'accent', weight: 600 });
            s.text(`k = ${fmtI(kh.x)}`, kh.x, -0.36, { align: 'center', size: 11, color: 'gold', weight: 700, dy: 0 });
          }
          // factor bar: widths ∝ log p
          const P = pen(bs, v), L = Math.log(N0), x0 = 14, W = P.W - 28;
          let x = x0;
          P.sans(`N = ${fmtI(N0)}`, x0, 14, { align: 'left', size: 13, weight: 600, color: 'muted' });
          P.sans('each part is as wide as log p, so the widths add up to log N', P.W - 14, 14, { align: 'right', size: 11.5, color: 'muted' });
          found.forEach((p, i) => {
            const w = (W * Math.log(p)) / L;
            P.box(x, 28, w - 3, 36, { r: 5, fill: ['blue', 'teal', 'purple', 'orange', 'pink'][i % 5], alpha: 0.3 });
            P.text(fmtI(p), x + w / 2, 46.5, { size: Math.min(13, w / 5), weight: 600 });
            x += w;
          });
          if (N > 1) { const w = (W * Math.log(N)) / L; P.box(x, 28, w - 3, 36, { r: 5, stroke: 'faint', dash: true }); P.text(`${fmtI(N)} — not yet factored`, x + w / 2, 46.5, { size: Math.min(12.5, w / 14), color: 'muted' }); }
          // the questions asked about the current cofactor
          let cx = x0;
          P.sans(log.length ? `questions about ${fmtI(N)}:` : done ? 'done' : '', x0, 86, { align: 'left', size: 11.5, color: 'muted', weight: 600 });
          cx = x0 + P.tw(`questions about ${fmtI(N)}:`, 11.5, 600, SANS) + 10;
          let row = 0;
          for (const q of log) {
            const t = `≤ ${fmtI(q.k)}? ${q.yes ? 'yes' : 'no'}`, tw = P.tw(t, 11, 500) + 12;
            if (cx + tw > P.W - 10) { row++; cx = x0; if (row > 1) break; }
            P.box(cx, 77 + row * 24, tw, 19, { r: 9, fill: q.yes ? 'green' : 'red', alpha: 0.14, stroke: q.yes ? 'green' : 'red' });
            P.text(t, cx + tw / 2, 87 + row * 24, { size: 11, color: q.yes ? 'green' : 'red' });
            cx += tw + 6;
          }
        });
        v.legend([['green', 'oracle says yes', { dot: true }], ['red', 'oracle says no', { dot: true }], ['accent', 'interval still containing the smallest factor', { area: true }]]);
        v.readout(() => {
          const bits = Math.ceil(Math.log2(N0 + 1)), per = Math.ceil(Math.log2(Math.sqrt(N0))) + 1;
          return String.raw`$N$ has ${bits} bits · oracle calls so far: **${calls}** · factors found: ${found.length ? found.map(fmtI).join(' × ') : '—'}${done ? ' ✓ (product = N)' : ''} · binary search needs at most $\lceil\log_2\sqrt N\rceil + 1 = ${per}$ calls per factor, while trial division would test up to $\sqrt N\approx ${v.sci(Math.sqrt(N0), 3)}$ divisors.`;
        });
      },
    },
  ],
};
