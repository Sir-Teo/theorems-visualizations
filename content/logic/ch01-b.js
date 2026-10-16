// Logic & Foundations — Chapter 1 (part b): the paradoxes of self-reference, and Cantor 1874 (items 1.6–1.11)
import { cantorList, algebraicByHeight, polyTex, sub } from './ch01.shared.js';

const pxX = (s, p) => p / Math.abs(s.X(1) - s.X(0));
const pxY = (s, p) => p / Math.abs(s.Y(0) - s.Y(1));

// ---------- Liar (1.7) ----------
const LIAR_PRESETS = {
  liar: { lab: 'liar', S: [{ refs: [[0, false]] }] },
  truth: { lab: 'truth-teller', S: [{ refs: [[0, true]] }] },
  card: { lab: 'Jourdain’s card', S: [{ refs: [[1, true]] }, { refs: [[0, false]] }] },
  nono: { lab: 'no–no', S: [{ refs: [[1, false]] }, { refs: [[0, false]] }] },
  tri: { lab: 'three liars', S: [{ refs: [[1, false]] }, { refs: [[2, false]] }, { refs: [[0, false]] }] },
  yablo: { lab: 'Yablo (4)', S: [{ refs: [[1, false], [2, false], [3, false]] }, { refs: [[2, false], [3, false]] }, { refs: [[3, false]] }, { refs: [] }] },
  cont: { lab: 'contingent liar', S: [{ refs: [[0, false], [1, true]], any: true }, { fact: true }] },
};
const sname = (j) => `S${j + 1}`;
function sentenceText(s, i) {
  if (s.fact != null) return s.fact ? 'a fact: “2 + 2 = 4”' : 'a fact: “2 + 2 = 5”';
  if (!s.refs.length) return 'every later sentence is false (there are none)';
  if (s.any) return s.refs.map(([j, p]) => `${sname(j)} is ${p ? 'true' : 'false'}`).join(' or ');
  const allSame = s.refs.every(([, p]) => p === s.refs[0][1]);
  if (allSame && s.refs.length > 1) return `${s.refs.map(([j]) => sname(j)).join(', ')} are all ${s.refs[0][1] ? 'true' : 'false'}`;
  return s.refs.map(([j, p]) => `${j === i ? 'this sentence' : sname(j)} is ${p ? 'true' : 'false'}`).join(' and ');
}
function claim(s, v) {
  if (s.fact != null) return s.fact;
  const t = s.refs.map(([j, p]) => v[j] === p);
  return s.any ? t.some(Boolean) : t.every(Boolean);
}

// ---------- Berry (1.8): numbers definable by arithmetic expressions over 1–9 + * ^ ( ) ! ----------
const BERRY_CAP = 200000, BERRY_NMAX = 12, BERRY_ALPHA = 15;
let BERRY = null;
function berryTables() {
  if (BERRY) return BERRY;
  const C = BERRY_CAP, NT = 4; // 0 atom, 1 power, 2 product, 3 sum
  const len = [], op = [], lv = [], rv = [], byLen = [];
  for (let k = 0; k < NT; k++) { len.push(new Uint8Array(C + 1)); op.push(new Uint8Array(C + 1)); lv.push(new Int32Array(C + 1)); rv.push(new Int32Array(C + 1)); byLen.push([...Array(BERRY_NMAX + 1)].map(() => [])); }
  const add = (k, v, L, o, l, r) => { if (v < 1 || v > C || len[k][v]) return; len[k][v] = L; op[k][v] = o; lv[k][v] = l; rv[k][v] = r; byLen[k][L].push(v); };
  const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
  for (let L = 1; L <= BERRY_NMAX; L++) {
    if (L === 1) for (let d = 1; d <= 9; d++) add(0, d, 1, 1, d, 0);
    if (L >= 3) for (const v of byLen[3][L - 2]) add(0, v, L, 2, v, 0);
    if (L >= 2) for (const v of byLen[0][L - 1]) if (v >= 3 && v <= 8) add(0, FACT[v], L, 3, v, 0);
    for (const v of byLen[0][L]) add(1, v, L, 7, v, 0);
    for (let l1 = 1; l1 <= L - 2; l1++) for (const a of byLen[0][l1]) for (const f of byLen[1][L - 1 - l1]) { if (a === 1) { add(1, 1, L, 4, a, f); continue; } if (f * Math.log(a) > Math.log(C) + 1e-9) continue; add(1, Math.round(a ** f), L, 4, a, f); }
    for (const v of byLen[1][L]) add(2, v, L, 7, v, 0);
    for (let l1 = 1; l1 <= L - 2; l1++) for (const a of byLen[2][l1]) for (const f of byLen[1][L - 1 - l1]) { const w = a * f; if (w <= C) add(2, w, L, 5, a, f); }
    for (const v of byLen[2][L]) add(3, v, L, 7, v, 0);
    for (let l1 = 1; l1 <= L - 2; l1++) for (const a of byLen[3][l1]) for (const f of byLen[2][L - 1 - l1]) { const w = a + f; if (w <= C) add(3, w, L, 6, a, f); }
  }
  const expr = (k, v) => {
    switch (op[k][v]) {
      case 1: return String(v);
      case 2: return `(${expr(3, lv[k][v])})`;
      case 3: return `${expr(0, lv[k][v])}!`;
      case 4: return `${expr(0, lv[k][v])}^${expr(1, rv[k][v])}`;
      case 5: return `${expr(2, lv[k][v])}*${expr(1, rv[k][v])}`;
      case 6: return `${expr(3, lv[k][v])}+${expr(2, rv[k][v])}`;
      case 7: return expr(k - 1, lv[k][v]);
      default: return '?';
    }
  };
  const E = len[3], count = [], b = [], b2 = [];
  for (let N = 0; N <= BERRY_NMAX; N++) {
    let c = 0; for (let v = 1; v <= C; v++) if (E[v] && E[v] <= N) c++;
    count.push(c);
    let x = 1; while (x <= C && E[x] && E[x] <= N) x++; b.push(x);
    let y = x + 1; while (y <= C && E[y] && E[y] <= N) y++; b2.push(y);
  }
  BERRY = { E, expr: (v) => expr(3, v).replace(/\*/g, '×'), count, b, b2 };
  return BERRY;
}

// ---------- Grelling (1.9) ----------
const NUMW = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const NUMSYL = [0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3, 1, 2, 2, 2, 2, 3, 2, 2, 2];
const numWord = (n) => (n <= 20 ? NUMW[n] : n < 30 ? `twenty-${NUMW[n - 20]}` : 'thirty');
const numSyl = (n) => (n <= 20 ? NUMSYL[n] : n < 30 ? 2 + NUMSYL[n - 20] : 2);
const letters = (w) => w.replace(/[^a-z]/gi, '').length;

// ---------- Richard (1.10): a toy language of definitions of reals ----------
const RA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '/', '√', 'π', 'e'];
function parseDef(str) {
  let i = 0;
  const peek = () => str[i];
  const P = () => {
    const c = peek();
    if (c === 'π' || c === 'e') { i++; return { t: c }; }
    let d = ''; while (i < str.length && /[1-9]/.test(str[i])) d += str[i++];
    if (!d) throw 0; return { t: 'n', n: +d };
  };
  const U = () => { if (peek() === '√') { i++; return { t: '√', a: U() }; } return P(); };
  const T = () => { let a = U(); while (peek() === '/') { i++; a = { t: '/', a, b: U() }; } return a; };
  const E = () => { let a = T(); while (peek() === '+' || peek() === '-') { const o = str[i++]; a = { t: o, a, b: T() }; } return a; };
  try { const ast = E(); return i === str.length ? ast : null; } catch { return null; }
}
function evalD(n) {
  switch (n.t) { case 'n': return n.n; case 'π': return Math.PI; case 'e': return Math.E; case '√': return Math.sqrt(evalD(n.a)); case '/': return evalD(n.a) / evalD(n.b); case '+': return evalD(n.a) + evalD(n.b); default: return evalD(n.a) - evalD(n.b); }
}
const BIGC = new Map();
function isqrt(n) { if (n < 2n) return n; let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2)); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) { while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; } x = y; } }
function bigPi(S) { const at = (k) => { let t = S / k, s = t, n = 1n, sg = -1n; const k2 = k * k; while (t) { t /= k2; n += 2n; s += sg * (t / n); sg = -sg; } return s; }; return 16n * at(5n) - 4n * at(239n); }
function bigE(S) { let t = S, s = S, k = 1n; while (t) { t /= k; s += t; k++; } return s - S + S; }
/** value × 10^P (+ guard) as a BigInt fixed-point number */
function evalBig(n, P) {
  const G = P + 12, key = G, S = 10n ** BigInt(G);
  if (!BIGC.has('π' + key)) { BIGC.set('π' + key, bigPi(S)); BIGC.set('e' + key, bigE(S)); }
  const rec = (m) => {
    switch (m.t) {
      case 'n': return BigInt(m.n) * S; case 'π': return BIGC.get('π' + key); case 'e': return BIGC.get('e' + key);
      case '√': return isqrt(rec(m.a) * S); case '/': return (rec(m.a) * S) / rec(m.b); case '+': return rec(m.a) + rec(m.b); default: return rec(m.a) - rec(m.b);
    }
  };
  return { x: rec(n), S };
}
const digitAt = (big, k) => Number(((big.x * 10n ** BigInt(k)) / big.S) % 10n);
let RICH = null;
function richardList() {
  if (RICH) return RICH;
  const out = [];
  const gen = (L, pre) => {
    if (pre.length === L) { const ast = parseDef(pre); if (ast) { const x = evalD(ast); if (x > 1e-12 && x < 1 - 1e-12) out.push({ s: pre, ast, x }); } return; }
    for (const c of RA) gen(L, pre + c);
  };
  for (let L = 1; L <= 4; L++) gen(L, '');
  RICH = out; return out;
}

// ---------- Cantor 1874 (1.11): exact rationals for the nested-interval construction ----------
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (p, q = 1n) => { if (q < 0n) { p = -p; q = -q; } const g = bgcd(p, q) || 1n; return [p / g, q / g]; };
const qlt = (a, b) => a[0] * b[1] < b[0] * a[1];
const qsub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const qinv = (a) => Q(a[1], a[0]);
const qfloor = (a) => { const [p, q] = a; return p >= 0n ? p / q : -((-p + q - 1n) / q); };
const qnum = (a) => Number(a[0]) / Number(a[1]);
const qh = (a) => (a[0] < 0n ? -a[0] : a[0]) + a[1];
/** the rational of least height |p| + q strictly inside (a, b); b may be null for +∞ */
function simplest(a, b) {
  if (b && qlt(a, [0n, 1n]) && qlt([0n, 1n], b)) return [0n, 1n];
  if (b && !qlt([0n, 1n], b)) { const r = simplest([-b[0], b[1]], [-a[0], a[1]]); return [-r[0], r[1]]; }
  const fl = qfloor(a), n = [fl + 1n, 1n];
  if (!b || qlt(n, b)) return n;
  const lo = qsub(b, [fl, 1n]), hi = qsub(a, [fl, 1n]);
  const r = simplest(qinv(lo), hi[0] === 0n ? null : qinv(hi));
  const ri = qinv(r); return Q(fl * ri[1] + ri[0], ri[1]);
}
/** decimal digits of a rational, k places */
const qdigits = (a, k) => { const [p, q] = a; const neg = p < 0n; const P2 = neg ? -p : p; const ip = P2 / q; let r = P2 % q, s = ''; for (let i = 0; i < k; i++) { r *= 10n; s += String(r / q); r %= q; } return { neg, ip, s }; };

export default {
  collection: 'logic',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Paradox',
      name: 'Russell’s paradox',
      statement: String.raw`Naive set theory assumes **unrestricted comprehension**: every property $\varphi(x)$ determines a set $\{x:\varphi(x)\}$. Take $\varphi(x)$ to be $x\notin x$ and let $R=\{x : x\notin x\}$. Then
$$R\in R \iff R\notin R,$$
a contradiction, so unrestricted comprehension is inconsistent. Zermelo's **separation** axiom allows only $\{x\in A : \varphi(x)\}$ for a set $A$ already given. The same argument then proves that $R_A=\{x\in A: x\notin x\}$ is not a member of $A$. Hence no set contains every set.`,
      idea: String.raw`This is Cantor's theorem (1.2) applied to the universe itself. In a membership table with a column for every set, $R$ is the flipped diagonal, so it disagrees with each column $y$ in row $y$, and cannot be a column. Under separation the flipped diagonal is only taken over the members of $A$. The contradiction then becomes a proof that $R_A$ lies outside $A$.`,
      caption: String.raw`Left: a small universe of “sets”; an arrow $x\to y$ means $x\in y$, a loop means $x\in x$. Click a set and then another to add or remove a membership (click a set twice to toggle its loop). Right: the membership table; the red column is $R$, the flipped gold diagonal. Tick **place R in the universe** and press **evaluate R ∈ R**: whatever loop you give $R$, its own definition demands the opposite. Under **separation inside A** (click a set to make it $A$), $R_A$ settles down, but only outside $A$, and $A=V$ fails.`,
      deps: ['logic-1.2'],
      see: ['logic-8.3', 'phil-4.7'],
      refs: ['Kunen Ch. I'],
      credit: 'Bertrand Russell, 1901 (letter to Frege, 1902); Ernst Zermelo independently, c. 1900',
      tags: ['set theory', 'paradox', 'comprehension'],
      viz(v) {
        const names = ['∅', '{∅}', '{∅,{∅}}', 'Ω', 'V', 'W'];
        const desc = ['empty', '', '', 'Ω = {Ω}', 'all sets', '{Ω, V}'];
        const pos = [[1.4, 1.4], [1.0, 4.0], [3.6, 5.6], [6.4, 5.6], [7.8, 2.6], [4.6, 0.9]];
        const n = names.length;
        let M = [...Array(n)].map(() => Array(n).fill(0));
        M[0][1] = 1; M[0][2] = 1; M[1][2] = 1; M[3][3] = 1; M[3][5] = 1; M[4][5] = 1; for (let x = 0; x < n; x++) M[x][4] = 1;
        const comp = v.select('', [{ value: 'naive', label: 'unrestricted comprehension' }, { value: 'sep', label: 'separation inside A' }], 'naive', { onChange: () => { A = 2; rIn = false; } });
        const place = v.toggle('place R in the universe', true);
        let rIn = false, evals = 0, sel = null, A = 2;
        v.button('evaluate R ∈ R', () => { rIn = !rIn; evals++; });
        const s = v.stage({ x: [-0.3, 10.3], y: [-0.4, 7], equal: true, axes: false, height: 380, weight: 1.2 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1 });
        const RP = [9.4, 6.0];
        s.onClick((x, y) => {
          let hit = null; pos.forEach((p, i) => { if (Math.hypot(x - p[0], y - p[1]) < 0.55) hit = i; });
          if (place.value && Math.hypot(x - RP[0], y - RP[1]) < 0.55) { rIn = !rIn; evals++; return; }
          if (hit == null) { sel = null; return; }
          if (comp.value === 'sep' && sel == null && hit !== A) { /* choose A by double-click logic below */ }
          if (sel == null) { sel = hit; if (comp.value === 'sep') A = hit; return; }
          M[sel][hit] ^= 1; if (hit === 4) M[sel][4] = 1; sel = null;
        });
        let st = null;
        const loop = (p, col, w, al) => { const r = 0.42; s.circle(p[0] + 0.32, p[1] + 0.5, r, { color: col, width: w, alpha: al }); s.arrow(p[0] + 0.02, p[1] + 0.58, p[0] - 0.02, p[1] + 0.46, { color: col, width: w, head: 6, alpha: al }); };
        v.render(() => {
          const sep = comp.value === 'sep';
          const inDom = (x) => (sep ? (x === n ? false : M[x][A] === 1) : true);
          const Rm = [...Array(n)].map((_, x) => inDom(x) && !M[x][x]);
          // R ∈ A? only if A "contains every set" (V)
          const RinA = sep ? A === 4 : true;
          const demanded = RinA && !rIn;
          // arrows
          for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (M[x][y]) {
            if (x === y) { loop(pos[x], 'purple', 1.8, 1); continue; }
            if (y === 4) continue;
            const [a, b] = [pos[x], pos[y]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
            s.arrow(a[0] + ux * 0.55, a[1] + uy * 0.55, b[0] - ux * 0.6, b[1] - uy * 0.6, { color: 'muted', width: 1.6, head: 8 });
          }
          // V: everything points into it — draw faint spokes
          for (let x = 0; x < n; x++) if (x !== 4) { const [a, b] = [pos[x], pos[4]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d; s.arrow(a[0] + ux * 0.55, a[1] + uy * 0.55, b[0] - ux * 0.62, b[1] - uy * 0.62, { color: 'faint', width: 1, head: 6, dash: [3, 3] }); }
          if (place.value) {
            for (let x = 0; x < n; x++) if (Rm[x]) { const [a, b] = [pos[x], RP], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d; s.arrow(a[0] + ux * 0.55, a[1] + uy * 0.55, b[0] - ux * 0.6, b[1] - uy * 0.6, { color: 'red', width: 1.8, head: 8, alpha: 0.85 }); }
            if (RinA && sep) { const [a, b] = [RP, pos[A]]; s.arrow(a[0], a[1] - 0.55, b[0] + 0.3, b[1] + 0.5, { color: 'red', width: 1.4, dash: [4, 3], head: 7 }); }
            if (rIn) loop(RP, 'red', 2.4, 1);
            { const [a, b] = [RP, pos[4]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d; s.arrow(a[0] + ux * 0.55, a[1] + uy * 0.55, b[0] - ux * 0.62, b[1] - uy * 0.62, { color: 'faint', width: 1, head: 6, dash: [3, 3] }); }
            const ok = rIn === demanded;
            s.dot(RP[0], RP[1], { r: 19, color: ok ? 'green' : 'red' });
            s.text(sep ? 'R_A' : 'R', RP[0], RP[1], { align: 'center', size: 13, weight: 700, color: 'panel', halo: false });
            s.text(rIn ? 'R ∈ R ?' : 'R ∉ R ?', RP[0] + 0.75, RP[1] - 0.95, { align: 'right', size: 11.5, weight: 700, color: ok ? 'green' : 'red' });
            s.text(ok ? 'consistent' : `definition demands ${demanded ? '∈' : '∉'}`, RP[0] + 0.75, RP[1] - 1.4, { align: 'right', size: 10.5, color: ok ? 'green' : 'red' });
          }
          pos.forEach((p, i) => {
            const isA = sep && i === A;
            if (isA) s.dot(p[0], p[1], { r: 24, hollow: true, color: 'orange', width: 2.4 });
            s.dot(p[0], p[1], { r: 19, color: Rm[i] ? 'blue' : 'purple', hollow: sel !== i, width: 2.2 });
            s.text(names[i], p[0], p[1], { align: 'center', size: names[i].length > 4 ? 9 : 12.5, weight: 700, color: sel === i ? 'panel' : 'ink', halo: false });
            if (desc[i]) s.text(desc[i], p[0], p[1] - 0.72, { align: 'center', size: 10, color: 'muted' });
            if (isA) s.text('A', p[0] - 0.75, p[1] + 0.6, { size: 13, weight: 700, color: 'orange' });
          });
          // table
          const cols = n + (place.value ? 1 : 0), cw = Math.min(0.11, 0.8 / (cols + 1)), ch = pxY(t, cw / pxX(t, 1)), x0 = 0.18, y0 = 0.86;
          t.text('x ∈ y ?', x0 - 0.02, y0 + ch * 0.5, { align: 'right', size: 10.5, color: 'muted' });
          for (let j = 0; j < cols; j++) t.text(j < n ? names[j] : sep ? 'R_A' : 'R', x0 + (j + 0.5) * cw, y0 + ch * 0.5, { align: 'center', size: j < n && names[j].length > 4 ? 7.5 : 11, weight: 700, color: j < n ? 'ink' : 'red' });
          for (let i = 0; i < n; i++) {
            t.text(names[i], x0 - 0.02, y0 - (i + 0.5) * ch, { align: 'right', size: names[i].length > 4 ? 8.5 : 11, weight: 600, color: 'ink' });
            for (let j = 0; j < cols; j++) {
              const val = j < n ? M[i][j] : Rm[i] ? 1 : 0, X0 = x0 + j * cw, Y0 = y0 - (i + 1) * ch;
              const differs = j < n && i === j && (M[j][j] ? 1 : 0) !== (Rm[j] ? 1 : 0) && inDom(j);
              t.rect(X0 + 0.004, Y0 + 0.004, X0 + cw - 0.004, Y0 + ch - 0.004, { fill: j === n ? 'red' : 'blue', fillAlpha: val ? (j === n ? 0.5 : 0.45) : 0, color: i === j ? 'gold' : 'grid', width: i === j ? 2.4 : 1, radius: 3 });
              if (val) t.text('∈', X0 + cw / 2, Y0 + ch * (differs ? 0.62 : 0.5), { align: 'center', size: 12, color: 'panel', halo: false, weight: 700 });
              if (differs) t.text('≠R', X0 + cw / 2, Y0 + 0.012, { align: 'center', size: 8.5, color: 'red', weight: 700, baseline: 'bottom' });
            }
          }
          if (place.value) {
            const i = n, Y0 = y0 - (n + 1) * ch;
            t.text(sep ? 'R_A' : 'R', x0 - 0.02, Y0 + ch / 2, { align: 'right', size: 11, weight: 700, color: 'red' });
            for (let j = 0; j < cols; j++) {
              const val = j < n ? (j === 4 || (sep && j === A && RinA) ? 1 : 0) : rIn ? 1 : 0, X0 = x0 + j * cw;
              t.rect(X0 + 0.004, Y0 + 0.004, X0 + cw - 0.004, Y0 + ch - 0.004, { fill: 'red', fillAlpha: val ? 0.45 : 0, color: j === n ? 'red' : 'grid', width: j === n ? 2.6 : 1, radius: 3 });
              if (j === n) t.text(rIn === demanded ? '' : '✗', X0 + cw / 2, Y0 + ch / 2, { align: 'center', size: 14, color: 'red', weight: 700 });
            }
            t.text('R ∈ R?', x0 + cols * cw + 0.01, Y0 + ch / 2, { size: 10, color: 'red', weight: 600 });
          }
          t.text(sep ? 'red column: members of A that are not members of themselves' : 'red column R: the gold diagonal, flipped', 0.5, 0.06, { align: 'center', size: 10.5, color: 'red' });
          st = { sep, Rm, RinA, demanded, ok: rIn === demanded };
        });
        v.legend([['purple', 'member of itself', { dot: true }], ['blue', 'not a member of itself (goes into R)', { dot: true }], ['gold', 'diagonal $x\\in x$', { dot: true }], ['red', '$R$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const memb = names.filter((_, i) => st.Rm[i]).join(', ') || 'nothing';
          if (!place.value) return `$R$ would contain: ${memb}. Each set $y$ in the universe differs from $R$ at $y$ itself ($y\\in y$ exactly when $y\\notin R$), so $R$ is none of them. Tick **place R** to try adding it.`;
          if (!st.sep) return `$R=\\{$${memb}$\\}\\cup\\{R \\text{ if } R\\notin R\\}$. You chose ${rIn ? '$R\\in R$' : '$R\\notin R$'}; the definition then demands ${st.demanded ? '$R\\in R$' : '$R\\notin R$'} ✗. Evaluations so far: ${evals}, and every one flips the answer. No choice is consistent, so no set $R$ exists.`;
          if (st.RinA) return `$A=V$ contains every set, so $R_A\\in A$ and the flip-flop returns ✗: a universal set $V$ cannot exist.`;
          return `$R_A=\\{x\\in A: x\\notin x\\}$ = {${memb}}. Since $R_A\\notin A$, it does not qualify for itself: $R_A\\notin R_A$ is ${st.ok ? 'consistent ✓' : 'forced, so choose it'}. Separation turns the paradox into a theorem: $R_A\\notin A$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Paradox',
      name: 'The liar paradox',
      statement: String.raw`Consider the sentence **“This sentence is false.”** If it is true, things are as it says, so it is false; if it is false, things are not as it says, so it is true. In modern form: no language can have all three of
(i) sentences that refer to sentences, including themselves;
(ii) a truth predicate $T$ satisfying $T(\ulcorner S\urcorner)\leftrightarrow S$ for every sentence $S$ (Tarski's T-schema);
(iii) classical two-valued logic.

Self-reference need not be direct: cycles of sentences (Jourdain's card) and even an infinite chain with no cycle (Yablo) produce the same contradiction.`,
      idea: String.raw`Treat each sentence as a condition on a truth assignment: $S$ must be true exactly when what it says holds. A system of sentences is paradoxical when no assignment meets every condition. The truth-teller has two solutions and the liar none. An odd cycle of “the next one is false” has no solution either, while an even cycle has two. Tarski drew the conclusion that a consistent language cannot contain its own truth predicate; truth must be defined in a richer metalanguage (logic-7.6).`,
      caption: String.raw`Choose a system; click a sentence to flip what it asserts (“true” ↔ “false”, or the fact in the contingent liar). The table tries **every** truth assignment; red cells are sentences whose value contradicts what they say, green rows are consistent. Bottom: naive evaluation, which starts with everything true and re-evaluates every sentence each round. It settles on a fixed point when there is one; for the liar it oscillates forever.`,
      deps: [],
      see: ['logic-7.6', 'phil-4.1'],
      refs: ['Smullyan Ch. I'],
      credit: 'Eubulides of Miletus, 4th century BC; Tarski, 1933; Yablo, 1993',
      tags: ['paradox', 'truth', 'self-reference'],
      viz(v) {
        const pre = v.select('', Object.entries(LIAR_PRESETS).map(([value, P]) => ({ value, label: P.lab })), 'card');
        let sys = null, last = null;
        const s = v.stage({ x: [0, 100], y: [0, 60], axes: false, height: 360, full: true });
        const b = v.stage({ x: [-0.5, 12.5], y: [-0.2, 4.6], axes: false, height: 150, full: true, title: 'naive evaluation: round $k+1$ re-evaluates every sentence using round $k$' });
        let boxes = [];
        s.onClick((x, y) => { boxes.forEach((bx, i) => { if (x > bx[0] && x < bx[2] && y > bx[1] && y < bx[3]) { const S = sys[i]; if (S.fact != null) S.fact = !S.fact; else S.refs = S.refs.map(([j, p]) => [j, !p]); } }); });
        let st = null;
        v.render(() => {
          if (last !== pre.value) { last = pre.value; sys = JSON.parse(JSON.stringify(LIAR_PRESETS[pre.value].S)); }
          const n = sys.length;
          // sentence cards
          boxes = [];
          const bh = Math.min(10, 50 / n), gap = 2.2;
          sys.forEach((S, i) => {
            const y1 = 56 - i * (bh + gap), y0 = y1 - bh;
            boxes.push([2, y0, 44, y1]);
            s.rect(2, y0, 44, y1, { fill: 'accent', fillAlpha: 0.06, color: 'accent', width: 1.4, radius: 6 });
            s.text(`${sname(i)}:`, 3.5, (y0 + y1) / 2, { size: 13, weight: 700, color: 'accent' });
            const txt = sentenceText(S, i);
            s.text(txt.length > 34 ? txt : `“${txt}”`, 10, (y0 + y1) / 2, { size: txt.length > 40 ? 10.5 : 12, color: 'ink' });
            // reference arcs on the right edge of the cards
            (S.refs || []).forEach(([j, p], k) => {
              const ya = (y0 + y1) / 2, yb = 56 - j * (bh + gap) - bh / 2;
              if (j === i) { s.arrow(44.5, ya + 1.5, 44.5, ya - 1.5, { color: p ? 'green' : 'red', width: 1.6, head: 6 }); s.circle(46, ya, 1.8, { color: p ? 'green' : 'red', width: 1.6 }); return; }
              const c = [46 + 3 + 2.5 * k + Math.abs(i - j) * 1.5, (ya + yb) / 2], pts = [];
              for (let u = 0; u <= 20; u++) { const w = u / 20; pts.push([(1 - w) ** 2 * 44.5 + 2 * (1 - w) * w * c[0] + w * w * 44.5, (1 - w) ** 2 * ya + 2 * (1 - w) * w * c[1] + w * w * yb]); }
              s.path(pts, { color: p ? 'green' : 'red', width: 1.6 }); s.arrow(pts[18][0], pts[18][1], 44.5, yb, { color: p ? 'green' : 'red', width: 1.6, head: 6 });
            });
          });
          // truth table of all assignments
          const rows = 1 << n, cw = 6.2, ch = Math.min(5.6, 50 / (rows + 1)), x0 = 62, y0 = 56;
          for (let i = 0; i < n; i++) s.text(sname(i), x0 + (i + 0.5) * cw, y0 + 1.6, { align: 'center', size: 11.5, weight: 700, color: 'accent' });
          s.text('consistent?', x0 + (n + 0.9) * cw, y0 + 1.6, { align: 'center', size: 11, color: 'muted' });
          const sols = [];
          for (let r = 0; r < rows; r++) {
            const val = [...Array(n)].map((_, i) => !((r >> (n - 1 - i)) & 1));
            const cl = sys.map((S) => claim(S, val));
            const ok = cl.every((c, i) => c === val[i]);
            if (ok) sols.push(val);
            const Y0 = y0 - (r + 1) * ch;
            if (ok) s.rect(x0 - 0.5, Y0 + 0.2, x0 + (n + 1.8) * cw, Y0 + ch - 0.2, { fill: 'green', fillAlpha: 0.15, stroke: false, radius: 4 });
            for (let i = 0; i < n; i++) {
              const bad = cl[i] !== val[i], X0 = x0 + i * cw;
              s.rect(X0 + 0.3, Y0 + 0.25, X0 + cw - 0.3, Y0 + ch - 0.25, { fill: val[i] ? 'green' : 'panel', fillAlpha: val[i] ? 0.3 : 1, color: bad ? 'red' : 'grid', width: bad ? 2 : 1, radius: 3 });
              s.text(val[i] ? 'T' : 'F', X0 + cw / 2, Y0 + ch / 2, { align: 'center', size: Math.min(12, ch * 2.2), weight: 600, color: bad ? 'red' : 'ink' });
            }
            s.text(ok ? '✓' : '✗', x0 + (n + 0.9) * cw, Y0 + ch / 2, { align: 'center', size: 13, weight: 700, color: ok ? 'green' : 'red' });
          }
          // naive evaluation
          let cur = Array(n).fill(true); const hist = [cur];
          for (let k = 0; k < 12; k++) { cur = sys.map((S) => claim(S, cur)); hist.push(cur); }
          const rh = 4 / Math.max(n, 1);
          hist.forEach((hv, k) => hv.forEach((val, i) => {
            const y1 = 4.3 - i * rh, y0b = y1 - rh * 0.85;
            b.rect(k - 0.42, y0b, k + 0.42, y1, { fill: val ? 'green' : 'red', fillAlpha: 0.35, color: val ? 'green' : 'red', width: 1, radius: 3 });
            b.text(val ? 'T' : 'F', k, (y0b + y1) / 2, { align: 'center', size: 10.5, weight: 600, color: 'ink' });
            if (k === 0) b.text(sname(i), -0.55, (y0b + y1) / 2, { align: 'right', size: 10.5, weight: 700, color: 'accent' });
          }));
          const same = (a, c) => a.every((x, i) => x === c[i]);
          let period = 0; for (let p = 1; p <= 6; p++) if (same(hist[12], hist[12 - p])) { period = p; break; }
          st = { n, sols, period };
        });
        v.legend([['green', 'says “… is true” / value T', { dot: true }], ['red', 'says “… is false” / contradicts itself', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { sols, period } = st;
          const solTxt = sols.length ? `${sols.length} consistent assignment${sols.length > 1 ? 's' : ''}: ${sols.map((vv) => vv.map((x) => (x ? 'T' : 'F')).join('')).join(', ')}${sols.length > 1 ? ' — the system does not determine its truth values (like the truth-teller)' : ' ✓'}` : '**no consistent assignment at all ✗** — a paradox';
          const ev = period === 1 ? 'naive evaluation reaches a fixed point' : `naive evaluation never settles (it cycles with period ${period})`;
          const yab = pre.value === 'yablo' ? ' With finitely many sentences only the last is true; with infinitely many (no last one) there is no solution, although no sentence refers to itself.' : '';
          return `${solTxt}; ${ev}.${yab}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Paradox',
      name: 'Berry’s paradox',
      statement: String.raw`Consider **“the smallest positive integer not definable in fewer than sixty letters.”** Only finitely many phrases have fewer than sixty letters, so only finitely many integers are definable that way, and a smallest undefinable one exists. But the quoted phrase defines it, in fewer than sixty letters. The way out is that “definable in this language” cannot itself be expressed in the language. Formal versions include the uncomputability of Kolmogorov complexity and Chaitin's incompleteness theorem.`,
      idea: String.raw`Counting is the honest half: a budget of $N$ symbols from an alphabet of size $k$ allows at most $k+k^2+\dots+k^N$ phrases, so some number is not definable within the budget. The paradoxical half needs a phrase for “the least number not definable within $N$ symbols” that is itself short. Like the liar (1.7), it refers to a property of the language from inside the language, and adding it changes what is definable, which changes what it denotes.`,
      caption: String.raw`The toy language: arithmetic expressions over $1,\dots,9$, $+$, $*$, $\wedge$, $!$ and parentheses (15 symbols). Each cell is a number, green if some expression of at most $N$ symbols defines it (darker = shorter); the red cell is the least undefinable number $b(N)$. Click a cell to see its shortest definition. The lower plot compares, on a log scale, the number of strings, the number of definable values, and $b(N)$. **Evaluate the Berry phrase** admits $B(N)$ = “least number not definable in $N$ symbols”: once its spelling fits in $N$ symbols, its value flips back and forth.`,
      deps: ['logic-1.7'],
      see: ['toc-11.15', 'toc-11.16'],
      refs: ['Smullyan Ch. I'],
      credit: 'G. G. Berry, published by Bertrand Russell, 1906',
      tags: ['paradox', 'definability', 'self-reference'],
      viz(v) {
        const NS = v.slider('budget $N$ (symbols)', 1, BERRY_NMAX, 9, { int: true, onChange: () => { round = 0; } });
        let round = 0, pick = 137;
        v.button('evaluate the Berry phrase', () => { round++; });
        const g = v.stage({ x: [0, 40], y: [0, 25], axes: false, height: 300, full: true });
        const p = v.stage({ x: [0.5, BERRY_NMAX + 0.5], y: [1, 1e14], ylog: true, axes: 'box', height: 200, full: true, xlabel: 'budget N', xticks: [...Array(BERRY_NMAX)].map((_, i) => i + 1) });
        let st = null, start = 1;
        g.onClick((x, y) => { const c = Math.floor(x), r = Math.floor(25 - y); if (c >= 0 && c < 40 && r >= 0 && r < 25) pick = start + r * 40 + c; });
        v.render(() => {
          const T = berryTables(), N = NS.value, b = T.b[N], b2 = T.b2[N];
          start = Math.floor((b - 1) / 1000) * 1000 + 1;
          for (let r = 0; r < 25; r++) for (let c = 0; c < 40; c++) {
            const m = start + r * 40 + c, L = T.E[m], ok = L && L <= N;
            g.rect(c + 0.05, 24.95 - r - 0.9, c + 0.95, 24.95 - r, { fill: ok ? v.ramp(1 - (L - 1) / (N + 1) * 0.8, 'green') : 'panel', fillAlpha: 1, stroke: false });
            if (m === b || m === b2 && round) g.rect(c, 24.95 - r - 0.95, c + 1, 25 - r, { color: 'red', width: 2.2 });
            if (m === pick) g.rect(c, 24.95 - r - 0.95, c + 1, 25 - r, { color: 'accent', width: 2.2 });
          }
          g.corner(`numbers ${start} – ${start + 999}`, 'tl', { size: 11, plate: true });
          const strings = (k) => { let t = 0; for (let L = 1; L <= k; L++) t += BERRY_ALPHA ** L; return t; };
          const xs = [...Array(BERRY_NMAX)].map((_, i) => i + 1);
          p.path(xs.map((k) => [k, strings(k)]), { color: 'muted', width: 2, dash: [5, 4] });
          p.path(xs.map((k) => [k, T.count[k]]), { color: 'green', width: 2.4 });
          p.path(xs.map((k) => [k, T.b[k]]), { color: 'red', width: 2.4 });
          xs.forEach((k) => { p.dot(k, T.count[k], { r: 3, color: 'green' }); p.dot(k, T.b[k], { r: 3, color: 'red' }); });
          p.dot(N, T.b[N], { r: 6, color: 'red' });
          const nExpr = T.expr(N), phrase = `B(${nExpr})`;
          st = { N, b, b2, phrase, fits: phrase.length <= N, count: T.count[N], strings: strings(N), pickE: T.E[pick] ? T.expr(pick) : null, pickL: T.E[pick] };
        });
        v.legend([['muted', 'strings of ≤ N symbols (15 + 15² + …)', { dash: true }], ['green', 'definable numbers ≤ 200 000'], ['red', 'least undefinable b(N)']]);
        v.readout(() => {
          if (!st) return '';
          const { N, b, b2, phrase, fits, count, pickE, pickL } = st;
          const pk = pickE ? `${pick} = “${pickE}” (${pickL} symbols${pickL > N ? ', over budget' : ''})` : `${pick} needs more than ${BERRY_NMAX} symbols`;
          let berry;
          if (!fits) berry = `The Berry phrase “${phrase}” has ${phrase.length} symbols, more than $N=${N}$, so it defines $b(${N})$ without contradiction.`;
          else {
            const seq = [...Array(round + 1)].map((_, k) => (k % 2 ? b2 : b));
            berry = `The Berry phrase “${phrase}” has only ${phrase.length} ≤ ${N} symbols. Admit it: it denotes $b=${b}$, which is now definable, so the least undefinable number becomes ${b2}; then ${b} is undefinable again… Rounds so far: ${seq.join(' → ')} — it never settles ✗.`;
          }
          return `With $N=${N}$: ${count.toLocaleString('en')} numbers ≤ 200 000 are definable (out of at most $${v.sci(st.strings, 2)}$ strings), and the least undefinable one is $b(${N})=${b}$. Picked: ${pk}. ${berry}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Paradox',
      name: 'Grelling–Nelson paradox (heterological words)',
      statement: String.raw`Call an adjective **autological** if it describes itself (“short” is short, “polysyllabic” is polysyllabic, “unhyphenated” is unhyphenated) and **heterological** if it does not (“long”, “monosyllabic”, “hyphenated”). Is “heterological” heterological? If it is, it describes itself, so it is autological; if it is not, it fails to describe itself, so it is heterological. Either answer contradicts itself.`,
      idea: String.raw`Put the adjectives in a table, with the row for adjective $P$ recording which words $P$ is true of. “Heterological” is then defined by flipping the diagonal, exactly as Russell's $R$ (1.6) and Cantor's $D$ (1.2) are. So it differs from every row at that row's own word, and it cannot itself be a row. The trouble lies in treating “heterological” as an ordinary predicate of words. “Autological” is the truth-teller's twin: applied to itself it can consistently be either true or false.`,
      caption: String.raw`Row = adjective used as a predicate, column = the same word as a string; the cells are computed (letters, syllables, hyphens, double letters). The gold diagonal is self-application. The **heterological** row is the flipped diagonal, and its own cell has no consistent value: press **evaluate** to watch it flip. Slide $n$ to change the adjective “$n$-lettered”. The plot on the right finds the $n$ for which it describes itself (fifteen-lettered, seventeen-lettered).`,
      deps: ['logic-1.6'],
      see: ['logic-7.5'],
      refs: ['Smullyan Ch. I'],
      credit: 'Kurt Grelling and Leonard Nelson, 1908',
      tags: ['paradox', 'self-reference', 'language'],
      viz(v) {
        const nS = v.slider('$n$ in “$n$-lettered”', 1, 30, 15, { int: true });
        const het = v.toggle('include “heterological” and “autological”', true);
        let guess = true, evals = 0;
        v.button('evaluate: is “heterological” heterological?', () => { guess = !guess; evals++; });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.6 });
        const pl = v.stage({ x: [0, 31], y: [0, 31], axes: 'box', height: 400, weight: 0.8, minWidth: 240, xlabel: 'n', ylabel: 'letters in “n-lettered”', title: 'when is “$n$-lettered” $n$-lettered?' });
        const SYL = { short: 1, long: 1, polysyllabic: 5, monosyllabic: 5, hyphenated: 4, unhyphenated: 5, palindromic: 4, 'double-lettered': 4, heterological: 6, autological: 5 };
        let st = null;
        v.render(() => {
          const n = nS.value, nl = `${numWord(n)}-lettered`;
          const syl = (w) => (w === nl ? numSyl(n) + 2 : SYL[w]);
          const PRED = [
            ['short', (w) => letters(w) < 7],
            ['long', (w) => letters(w) >= 9],
            ['polysyllabic', (w) => syl(w) >= 3],
            ['monosyllabic', (w) => syl(w) === 1],
            ['hyphenated', (w) => w.includes('-')],
            ['unhyphenated', (w) => !w.includes('-')],
            ['palindromic', (w) => { const t = w.replace(/-/g, ''); return t === [...t].reverse().join(''); }],
            ['double-lettered', (w) => /([a-z])\1/.test(w)],
            [nl, (w) => letters(w) === n],
          ];
          const words = PRED.map(([w]) => w).concat(het.value ? ['heterological', 'autological'] : []);
          const m = words.length, rowsN = PRED.length + (het.value ? 2 : 0);
          const val = (i, j) => {
            const w = words[j];
            if (i < PRED.length) return PRED[i][1](w) ? 1 : 0;
            const self = (k) => (k < PRED.length ? PRED[k][1](words[k]) : null);
            if (i === PRED.length) { // heterological
              if (j < PRED.length) return self(j) ? 0 : 1;
              return j === PRED.length ? 'X' : '?';
            }
            if (j < PRED.length) return self(j) ? 1 : 0; // autological
            return j === PRED.length ? 'X' : '?';
          };
          const lw = 0.2, cw = (0.97 - lw) / m, ch = 0.82 / (rowsN + 0.8), y0 = 0.9;
          for (let j = 0; j < m; j++) s.text(String(j + 1), lw + (j + 0.5) * cw, y0 + ch * 0.4, { align: 'center', size: 10.5, weight: 700, color: 'muted' });
          for (let i = 0; i < rowsN; i++) {
            s.text(`${i + 1}  ${words[i]}`, lw - 0.01, y0 - (i + 0.5) * ch, { align: 'right', size: words[i].length > 14 ? 9.5 : 11, weight: 600, color: i >= PRED.length ? 'red' : 'ink' });
            for (let j = 0; j < m; j++) {
              let x = val(i, j); const X0 = lw + j * cw, Y0 = y0 - (i + 1) * ch;
              if (x === 'X') x = guess ? 1 : 0;
              const special = val(i, j) === 'X' || val(i, j) === '?';
              s.rect(X0 + 0.003, Y0 + 0.004, X0 + cw - 0.003, Y0 + ch - 0.004, { fill: special ? (val(i, j) === 'X' ? 'red' : 'faint') : x ? 'green' : 'panel', fillAlpha: special ? 0.3 : x ? 0.4 : 1, color: i === j ? 'gold' : 'grid', width: i === j ? 2.4 : 0.8, radius: 2 });
              s.text(val(i, j) === '?' ? '?' : val(i, j) === 'X' ? (guess ? 'T?' : 'F?') : x ? '✓' : '·', X0 + cw / 2, Y0 + ch / 2, { align: 'center', size: 11, weight: 700, color: special ? (val(i, j) === 'X' ? 'red' : 'muted') : x ? 'green' : 'faint', halo: false });
            }
          }
          s.text('columns: the same words, numbered as the rows', 0.5, 0.025, { align: 'center', size: 10, color: 'muted' });
          // letters plot
          pl.line(0, 0, 31, 31, { color: 'faint', dash: [4, 4] });
          const pts = []; for (let k = 1; k <= 30; k++) pts.push([k, letters(`${numWord(k)}-lettered`)]);
          pl.path(pts, { color: 'muted', width: 1.4 });
          pts.forEach(([k, L]) => pl.dot(k, L, { r: k === n ? 6 : 3.4, color: L === k ? 'green' : k === n ? 'accent' : 'muted' }));
          pl.text(`“${nl}”: ${letters(nl)} letters`, 1, 29, { size: 10.5, color: letters(nl) === n ? 'green' : 'accent', weight: 600 });
          const diag = PRED.map(([w, P]) => P(w));
          st = { nl, auto: diag[PRED.length - 1], diag, words };
        });
        v.legend([['green', 'applies', { dot: true }], ['gold', 'self-application (diagonal)', { dot: true }], ['red', 'no consistent value', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const autos = st.words.slice(0, st.diag.length).filter((_, i) => st.diag[i]).join(', ');
          const h = het.value ? ` For “heterological”, assume ${guess ? 'it **is** heterological: then it applies to itself, so it is autological ✗' : 'it is **not** heterological: then it fails to apply to itself, so it is heterological ✗'} (evaluations: ${evals}). For “autological”, both answers are consistent.` : '';
          return `Autological here: ${autos}. “${st.nl}” is ${st.auto ? '**autological** ✓' : 'heterological'}.${h}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Paradox',
      name: 'Richard’s paradox',
      statement: String.raw`List every English phrase that defines a real number between $0$ and $1$, in dictionary order (shorter phrases first), giving reals $r_1, r_2, \dots$. Let $d$ be the number whose $n$-th decimal digit is $5$ unless the $n$-th digit of $r_n$ is $5$, in which case it is $4$. Then $d$ differs from every $r_n$, yet the previous sentence defines $d$ in finitely many English words, so $d$ must be some $r_m$. The resolution is that “definable by a phrase of the list” is not a definite property expressible inside the language being listed.`,
      idea: String.raw`The construction is Cantor's diagonal argument (1.2, pma-2.14) applied to a countable list of definitions. Making $d$'s digits $4$ or $5$ avoids the $0.0999\ldots=0.1000\ldots$ ambiguity. If the defining phrase of $d$ is admitted at position $m$, then computing its $m$-th digit requires knowing that same digit, and the evaluation loops. Poincaré blamed the vicious circle. Gödel later replaced “definable” by “provable”, which arithmetic *can* express, and turned the same diagonal into the incompleteness theorem (logic-7.7).`,
      caption: String.raw`The toy language: strings of up to 4 symbols over $1,\dots,9$, $+$, $-$, $/$, $\sqrt{\ }$, $\pi$, $e$, listed in dictionary order. Only those with a value strictly between $0$ and $1$ are kept. Digits are computed exactly with big-integer arithmetic. The gold diagonal gives the red $d$. Type any definition: its row $m$ in the list is found, and $d$ differs from it at digit $m$. Tick **admit the phrase δ = “the diagonal of this list”**: δ takes row 1, and evaluating its first digit loops.`,
      deps: ['logic-1.2', 'logic-1.8', 'pma-2.14'],
      see: ['logic-7.7', 'logic-7.5'],
      refs: ['Smullyan Ch. I'],
      credit: 'Jules Richard, 1905',
      tags: ['paradox', 'definability', 'diagonal argument'],
      viz(v) {
        const inp = v.input('your definition', '√2-1', { width: 120 });
        const adm = v.toggle('admit the phrase δ = “the diagonal of this list”', false, { onChange: () => { guess = 5; evals = 0; } });
        let guess = 5, evals = 0;
        const bEval = v.button('evaluate digit 1 of δ', () => { evals++; guess = guess === 5 ? 4 : 5; });
        const s = v.stage({ x: [0, 100], y: [0, 64], axes: false, height: 440, full: true });
        const rule = (x) => (x === 5 ? 4 : 5);
        let st = null;
        v.render(() => {
          const L = richardList(), K = 12, delta = adm.value;
          bEval.hidden = !delta;
          const rows = (delta ? [{ s: 'δ', delta: true }] : []).concat(L.slice(0, K - (delta ? 1 : 0)));
          const big = rows.map((r) => (r.delta ? null : evalBig(r.ast, 16)));
          const x0 = 26, dw = 5.2, rh = 3.9, yTop = 59;
          s.text('row', 2, yTop + 2.4, { size: 10.5, color: 'muted' }); s.text('definition', 8, yTop + 2.4, { size: 10.5, color: 'muted' });
          for (let k = 1; k <= K; k++) s.text(String(k), x0 + (k - 0.5) * dw, yTop + 2.4, { align: 'center', size: 10, color: 'muted' });
          const dDig = [];
          rows.forEach((r, i) => {
            const y = yTop - (i + 0.5) * rh;
            s.text(String(i + 1), 3, y, { align: 'center', size: 11, color: 'muted' });
            s.text(r.s, 8, y, { size: 12.5, weight: 600, color: r.delta ? 'red' : 'ink' });
            s.text('0.', x0 - 2.2, y, { size: 12, color: 'muted' });
            for (let k = 1; k <= K; k++) {
              let dg;
              if (r.delta) dg = k === 1 ? guess : null; else dg = digitAt(big[i], k);
              const X = x0 + (k - 0.5) * dw;
              if (k === i + 1) s.rect(X - dw / 2 + 0.3, y - rh / 2 + 0.3, X + dw / 2 - 0.3, y + rh / 2 - 0.3, { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.12, radius: 3 });
              s.text(dg == null ? '·' : String(dg), X, y, { align: 'center', size: 12.5, weight: k === i + 1 ? 700 : 500, color: r.delta ? 'red' : 'ink' });
            }
          });
          rows.forEach((r, i) => { const k = i + 1; dDig.push(r.delta ? rule(guess) : rule(digitAt(big[i], k))); });
          const yd = yTop - (rows.length + 0.9) * rh;
          s.line(x0 - 3, yd + rh / 2 + 0.2, x0 + K * dw, yd + rh / 2 + 0.2, { color: 'faint' });
          s.text('d', 8, yd, { size: 13, weight: 700, color: 'red', math: true });
          s.text('0.', x0 - 2.2, yd, { size: 12, color: 'red' });
          dDig.forEach((dg, k) => s.text(String(dg), x0 + (k + 0.5) * dw, yd, { align: 'center', size: 13, weight: 700, color: 'red' }));
          s.text('…', x0 + K * dw + 1, yd, { size: 13, color: 'red' });
          // the reader's definition
          const str = (inp.value || '').replace(/\s+/g, '').replace(/sqrt/g, '√').replace(/pi/g, 'π');
          let mine = null;
          const idx = L.findIndex((e) => e.s === str);
          if (idx >= 0) {
            const m = idx + 1 + (delta ? 1 : 0);
            const bg = evalBig(L[idx].ast, m + 8), dm = digitAt(bg, m), dd = rule(dm);
            mine = { m, dm, dd, x: L[idx].x };
            const yy = yd - 2.4 * rh;
            if (m > K) {
              s.text('⋮', 3, yy + 1.4 * rh, { align: 'center', size: 13, color: 'muted' });
              s.text(String(m), 3, yy, { align: 'center', size: 11, color: 'accent', weight: 700 });
              s.text(str, 8, yy, { size: 12.5, weight: 700, color: 'accent' });
              const ks = [...Array(9)].map((_, j) => m - 4 + j).filter((k) => k >= 1);
              ks.forEach((k, j) => { const X = x0 + (j + 0.5) * dw; s.text(String(digitAt(bg, k)), X, yy, { align: 'center', size: 12.5, weight: k === m ? 700 : 500, color: k === m ? 'gold' : 'ink' }); s.text(String(k), X, yy - 2.1, { align: 'center', size: 8.5, color: 'muted' }); if (k === m) s.rect(X - dw / 2 + 0.3, yy - rh / 2 + 0.3, X + dw / 2 - 0.3, yy + rh / 2 - 0.3, { color: 'gold', width: 2.2, radius: 3 }); });
              s.text(`digit ${m}: ${dm}  →  d has ${dd} there`, x0 + 9.5 * dw + 1, yy, { size: 11.5, color: 'red', weight: 600 });
            }
          }
          st = { mine, str, total: L.length, dDig, delta };
        });
        v.legend([['gold', 'diagonal digit of row $n$', { dot: true }], ['red', '$d$: 5, or 4 where the diagonal digit is 5', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { mine, str, total, delta } = st;
          let me;
          if (mine) me = `“${str}” $= ${v.fix(mine.x, 6)}\\ldots$ is row $${mine.m}$ of the list; its digit $${mine.m}$ is ${mine.dm}, so $d$ has ${mine.dd} there: $d\\ne$ “${str}” ✓.`;
          else me = `“${str}” is not in the list (it must be a valid string of at most 4 symbols with value strictly between 0 and 1).`;
          const dl = delta ? ` δ is row 1, so its first digit must differ from its own first digit: guess ${guess} ⇒ rule gives ${rule(guess)} ✗ (evaluations: ${evals}). δ defines nothing.` : '';
          return `The list has ${total.toLocaleString('en')} definitions of up to 4 symbols, and $d = 0.${st.dDig.join('')}\\ldots$ differs from row $n$ at digit $n$. ${me}${dl}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Paper',
      name: 'Ueber eine Eigenschaft des Inbegriffs … algebraischen Zahlen',
      paper: { authors: 'Georg Cantor', year: 1874, title: 'Ueber eine Eigenschaft des Inbegriffs aller reellen algebraischen Zahlen', venue: 'Journal für die reine und angewandte Mathematik 77: 258–262', doi: '10.1515/crll.1874.77.258' },
      introduces: ['logic-1.5', 'pma-2.43a'],
      statement: String.raw`Cantor proved two theorems. (§1) The real algebraic numbers can be put in one-to-one correspondence with the positive integers. Give the irreducible equation $a_0\omega^n+a_1\omega^{n-1}+\dots+a_n=0$ ($a_0>0$, coefficients without common factor) the **height** $N=n-1+|a_0|+|a_1|+\dots+|a_n|$. Each height has finitely many numbers, $\varphi(N)$ of them, with $\varphi(1)=1$, $\varphi(2)=2$, $\varphi(3)=4$. List them height by height, ascending within each height. (§2) Given any sequence of distinct reals $\omega_1,\omega_2,\dots$ and any interval $(\alpha,\beta)$, some number $\eta$ in the interval is not in the sequence. Together these give a new proof of Liouville's theorem that every interval contains infinitely many transcendental numbers, and they show that a continuum such as $(0,1)$ cannot be put in correspondence with the positive integers: the first proof that infinite sets come in different sizes.`,
      idea: String.raw`Before 1874 every infinite collection was simply “infinite”. Liouville (1844) had found transcendental numbers by constructing them from rational approximations. Cantor, writing to Dedekind in December 1873, found a counting argument instead. To prove §2, take the first two terms of the sequence inside $(\alpha,\beta)$ as a new interval $(\alpha',\beta')$, repeat, and use completeness (nested intervals, pma-2.38) to get a limit point that no term can equal. The bland title reportedly kept Kronecker's hostility at bay. The paper introduced countability as a property of a set, the uncountability of the reals (pma-2.43a), and the existence proof of transcendental numbers by counting (1.5). The diagonal argument followed in 1891.`,
      caption: String.raw`Top: $\varphi(N)$, the number of real algebraic numbers of height $N$, recomputed by enumerating every irreducible integer polynomial; Cantor's three published values are ringed. Below: choose $(\alpha,\beta)$ with the two handles and step through §2. Each row magnifies the previous interval and marks the first two list entries inside it (gold), which bound the next interval. **Algebraic numbers** uses Cantor's list up to the chosen height, giving a few certified digits of a transcendental $\eta$. **Rationals only** uses exact arithmetic and goes much deeper; on $(0,1)$ it converges to $\sqrt2-1$, which is irrational but still algebraic.`,
      deps: ['pma-2.38', 'pma-1.19'],
      see: ['phil-2.10'],
      refs: [],
      tags: ['countability', 'transcendental numbers', 'nested intervals'],
      viz(v) {
        const mode = v.select('list', [{ value: 'alg', label: 'algebraic numbers (Cantor’s list)' }, { value: 'rat', label: 'rationals only' }], 'alg', { onChange: () => rebuild() });
        const NS = v.slider('heights $N\\le$', 6, 11, 10, { int: true, onChange: () => rebuild() });
        const top = v.stage({ x: [0.4, 11.6], y: [0.7, 3e4], ylog: true, axes: 'box', height: 150, full: true, xlabel: 'height N', ylabel: 'φ(N)', xticks: [...Array(11)].map((_, i) => i + 1) });
        const s = v.stage({ x: [-0.08, 1.08], y: [-0.2, 7.2], axes: false, height: 400, full: true });
        const ha = s.handle(0.05, 6.6, { color: 'orange', label: 'α', constrain: (x) => [v.M.clamp(Math.round(x * 100) / 100, 0, 0.99), 6.6], onDrag: () => rebuild() });
        const hb = s.handle(0.95, 6.6, { color: 'orange', label: 'β', constrain: (x) => [v.M.clamp(Math.round(x * 100) / 100, 0.01, 1), 6.6], onDrag: () => rebuild() });
        const build = () => {
          let a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x); if (b - a < 0.01) b = a + 0.01;
          const frames = [{ a, b, pick: null, note: `Start with $(\\alpha,\\beta)=(${a.toFixed(2)}, ${b.toFixed(2)})$.` }];
          if (mode.value === 'alg') {
            const list = cantorList(NS.value); let i = 0;
            for (let step = 1; step <= 40; step++) {
              let x = null, y = null;
              for (; i < list.length; i++) { const e = list[i]; if (e.x > a && e.x < b) { if (!x) x = e; else { y = e; break; } } }
              if (!y) break; i++;
              a = Math.min(x.x, y.x); b = Math.max(x.x, y.x);
              frames.push({ a, b, pick: [x, y], note: `Step ${step}: the first two listed numbers inside are $\\omega_{${x.k}}$ (height ${x.h}) and $\\omega_{${y.k}}$ (height ${y.h}).` });
            }
          } else {
            let A = Q(BigInt(Math.round(Math.min(ha.x, hb.x) * 100)), 100n), B = Q(BigInt(Math.round(Math.max(ha.x, hb.x) * 100)), 100n);
            if (!qlt(A, B)) B = Q(A[0] * 100n + A[1], A[1] * 100n);
            frames[0].A = A; frames[0].B = B;
            for (let step = 1; step <= 26; step++) {
              const s1 = simplest(A, B), l = simplest(A, s1), r = simplest(s1, B);
              const s2 = qh(l) < qh(r) || (qh(l) === qh(r)) ? l : r;
              const lo = qlt(s1, s2) ? s1 : s2, hi = qlt(s1, s2) ? s2 : s1;
              A = lo; B = hi;
              const fq = (q) => `${q[0]}/${q[1]}`;
              frames.push({ a: qnum(A), b: qnum(B), A, B, pick: [{ x: qnum(s1), h: Number(qh(s1)), lab: fq(s1) }, { x: qnum(s2), h: Number(qh(s2)), lab: fq(s2) }], note: `Step ${step}: the two rationals of least height inside are $${s1[0]}/${s1[1]}$ (height ${qh(s1)}) and $${s2[0]}/${s2[1]}$ (height ${qh(s2)}).` });
            }
          }
          return frames;
        };
        const S = v.steps({ frames: build(), start: 'end', speed: 1.2 });
        function rebuild() { S.reset(build(), { at: 'end' }); }
        const PAPER = { 1: 1, 2: 2, 3: 4 };
        let st = null;
        v.render(() => {
          // φ(N)
          const H = algebraicByHeight(11).map((L) => L.length);
          H.forEach((c, i) => top.rect(i + 1 - 0.32, 0.7, i + 1 + 0.32, c, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1 }));
          H.forEach((c, i) => top.text(String(c), i + 1, c * 1.9, { align: 'center', size: 9.5, color: 'ink' }));
          Object.entries(PAPER).forEach(([N, c]) => top.dot(+N, c, { r: 7, hollow: true, color: 'red', width: 2.2 }));
          // nested intervals
          const fr = S.frame, k = S.i, frames = S.frames;
          ha.visible = hb.visible = true;
          s.line(0, 6.6, 1, 6.6, { color: 'ink', width: 1.6 });
          for (let t = 0; t <= 10; t++) { s.line(t / 10, 6.53, t / 10, 6.67, { color: 'muted', width: 1 }); if (t % 5 === 0) s.text(String(t / 10), t / 10, 6.35, { align: 'center', size: 9.5, color: 'muted' }); }
          const f0 = frames[0];
          s.rect(f0.a, 6.56, f0.b, 6.64, { fill: 'orange', fillAlpha: 0.35, stroke: false });
          const shown = []; for (let j = Math.max(1, k - 4); j <= k; j++) shown.push(j);
          shown.forEach((j, r) => {
            const P = frames[j - 1], C = frames[j], y = 5.3 - r * 1.25, W = P.b - P.a, Xm = (x) => (x - P.a) / W;
            s.line(0, y, 1, y, { color: 'ink', width: 1.4 });
            s.text(fmt(P.a, W), 0, y - 0.25, { size: 9.5, color: 'muted' }); s.text(fmt(P.b, W), 1, y - 0.25, { align: 'right', size: 9.5, color: 'muted' });
            if (mode.value === 'alg') { const list = cantorList(NS.value); let cnt = 0; for (const e of list) if (e.x > P.a && e.x < P.b && cnt++ < 400) s.line(Xm(e.x), y - 0.06, Xm(e.x), y + 0.06, { color: 'faint', width: 1 }); }
            s.rect(Xm(C.a), y - 0.07, Xm(C.b), y + 0.07, { fill: 'orange', fillAlpha: 0.45, stroke: false });
            C.pick.forEach((e, q) => { s.line(Xm(e.x), y - 0.15, Xm(e.x), y + 0.15, { color: 'gold', width: 2.6 }); s.text(e.lab ?? `ω${sub(e.k)}`, Xm(e.x), y + 0.3, { align: 'center', size: 10, weight: 700, color: 'gold' }); });
            const yPrev = r === 0 ? (j === 1 ? 6.6 : null) : y + 1.25;
            if (yPrev != null) {
              const PP = j === 1 ? { a: 0, b: 1 } : frames[j - 2], WW = PP.b - PP.a, Xp = (x) => (x - PP.a) / WW;
              s.line(Xp(P.a), yPrev - 0.08, 0, y + 0.08, { color: 'orange', width: 1, dash: [3, 3] }); s.line(Xp(P.b), yPrev - 0.08, 1, y + 0.08, { color: 'orange', width: 1, dash: [3, 3] });
            }
            s.text(`×${v.fmt(1 / W, 3)}`, 1.06, y, { align: 'right', size: 9, color: 'muted' });
          });
          if (k === 0) s.text('press ▶ to take the first step', 0.5, 5.3, { align: 'center', size: 12, color: 'muted' });
          // certified digits of η: common prefix of the endpoints
          let digs = '';
          if (fr.A) { const da = qdigits(fr.A, 30), db = qdigits(fr.B, 30); if (da.ip === db.ip) for (let i = 0; i < 30 && da.s[i] === db.s[i]; i++) digs += da.s[i]; }
          else { const sa = fr.a.toFixed(15).split('.')[1], sb = fr.b.toFixed(15).split('.')[1]; if (Math.floor(fr.a) === Math.floor(fr.b)) for (let i = 0; i < 14 && sa[i] === sb[i]; i++) digs += sa[i]; }
          st = { H, k, fr, digs, n: frames.length - 1 };
        });
        function fmt(x, W) { const d = Math.min(14, Math.max(2, Math.ceil(-Math.log10(W)) + 2)); return x.toFixed(d); }
        v.legend([['blue', 'φ(N), computed', { area: true }], ['red', 'Cantor’s published φ(1), φ(2), φ(3)', { dot: true }], ['gold', 'first two list entries inside', { dot: true }], ['orange', 'next interval', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { H, k, fr, digs, n } = st;
          const cmp = `Cantor: $\\varphi(1)=1,\\ \\varphi(2)=2,\\ \\varphi(3)=4$; recomputed: ${H.slice(0, 3).join(', ')} ✓, and on: ${H.slice(3, 8).join(', ')}, … (OEIS A364316).`;
          const lim = mode.value === 'rat' ? `Endpoints now ${fr.A ? `$${fr.A[0]}/${fr.A[1]}$ and $${fr.B[0]}/${fr.B[1]}$` : ''}; certified digits $\\eta=0.${digs}\\ldots$ ${digs.startsWith('41421356') ? '$=\\sqrt2-1$: a number missing from the list of rationals' : ''}.` : `After ${k} of ${n} steps (the list stops at height ${NS.value}) the interval has width $${v.sci(fr.b - fr.a, 2)}$ and $\\eta = ${digs ? '0.' + digs : '?'}\\ldots$ is pinned down to ${digs.length} digit${digs.length === 1 ? '' : 's'}. With the whole list the intervals shrink to a single transcendental number: Cantor notes that $\\alpha^\\infty=\\beta^\\infty$ always occurs for the algebraic numbers.`;
          return `${cmp} ${lim}`;
        });
      },
    },
  ],
};
