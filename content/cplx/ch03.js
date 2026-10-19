// Computational Complexity — Chapter 3: coNP and the polynomial hierarchy
// Part 1 (this file, with the chapter title and summary): 3.1–3.6 — TAUTOLOGY, Pratt certificates, factoring in NP ∩ coNP,
// Σ₂/Π₂ with formula minimization, the hierarchy and its collapse. Part 2 is ch03-b.js (3.7–3.12).
//
// Honesty notes. Truth tables, Pratt certificates, exact minimal formula sizes (a Bellman–Ford search over all 256 Boolean
// functions of three variables) and QBF game values are computed on screen, not drawn. The towers of classes are diagrams of
// proved inclusions; the collapse picture (3.6) is schematic because the hypothesis Σ_k = Π_k is believed false.
import {
  clamp, big, sup, parseBool, evalAst, leafCount, astText, astTex, truthTable, minFormulas3, mask3,
  powmod, factorInt, isPrimeInt, carmichaelLambda, prattTree, prattCheck, prattStats,
} from './ch03.shared.js';

// ---------------------------------------------------------------------------------------------------------------
// The tower of classes P ⊆ Σk, Πk ⊆ Σ(k+1), Π(k+1) ... ⊆ PH ⊆ PSPACE, drawn on a stage with x in [-4, 4].
const LVY = 1.35;
const tex = (k, sig) => (k === 0 ? '\\mathrm P' : `${sig ? '\\Sigma' : '\\Pi'}_${k}^{\\mathsf p}`);
function nodePos(sig, k) { return k === 0 ? [0, 0] : [sig ? -1.75 : 1.75, k * LVY]; }
/** o: {top, merge: {k, t} | null, mark: Map('S2' -> colour), alpha: {key: a}} */
function drawTower(s, o) {
  const top = o.top, m = o.merge, t = m ? m.t : 0;
  const pos = (sig, k) => {
    let [x, y] = nodePos(sig, k);
    if (m && k >= m.k) { x *= 1 - t; y = (m.k + (k - m.k) * (1 - t)) * LVY; if (k === 0) { x = 0; } }
    return [x, y];
  };
  const edge = (a, b, c = 'muted', al = 0.7) => { const [x1, y1] = a, [x2, y2] = b; s.arrow(x1, y1 + 0.3, x2, y2 - 0.3, { color: c, width: 1.4, alpha: al, head: 7 }); };
  const keys = [];
  for (let k = 1; k <= top; k++) { keys.push(['S', k], ['P', k]); }
  // inclusion arrows (drawn first)
  const col = (key) => (o.mark && o.mark.get(key)) || null;
  for (let k = 0; k < top; k++) {
    const fromS = k === 0 ? [pos(true, 0)] : [pos(true, k)], fromP = k === 0 ? [pos(true, 0)] : [pos(false, k)];
    const both = k === 0 ? [[pos(true, 0), pos(true, 1)], [pos(true, 0), pos(false, 1)]] : [[fromS[0], pos(true, k + 1)], [fromS[0], pos(false, k + 1)], [fromP[0], pos(true, k + 1)], [fromP[0], pos(false, k + 1)]];
    const faded = m && k >= m.k && t > 0.5;
    both.forEach(([a, b]) => { if (!(faded)) edge(a, b, 'muted', 0.55); });
  }
  const [px, py] = [0, (top + 1) * LVY - (m ? t * (top + 1 - m.k) * LVY : 0)];
  const hiTop = pos(true, top);
  if (!m || t < 0.5) { s.arrow(-1.75, top * LVY + 0.3, -0.5, py - 0.28, { color: 'muted', width: 1.4, alpha: 0.55, head: 7 }); s.arrow(1.75, top * LVY + 0.3, 0.5, py - 0.28, { color: 'muted', width: 1.4, alpha: 0.55, head: 7 }); }
  // nodes
  const plate = (x, y, label, c, w = 0.62, filled = false) => {
    s.rect(x - w, y - 0.3, x + w, y + 0.3, { fill: c || 'panel', fillAlpha: c ? 0.22 : 1, color: c || 'muted', width: c ? 2.2 : 1.2, radius: 7 });
    s.tex(label, x, y, { align: 'center', baseline: 'middle', size: 15, color: c ? 'ink' : 'ink' });
  };
  const drawn = new Set();
  const place = (sig, k) => {
    const [x, y] = pos(sig, k), id = `${Math.round(x * 100)}:${Math.round(y * 100)}:${sig}`;
    const key = k === 0 ? 'P' : (sig ? 'S' : 'P') + k;
    if (m && t > 0.97 && k >= m.k && !(k === m.k && sig)) return; // merged away; the survivor is drawn below
    plate(x, y, tex(k, sig), col(key), 0.62);
    drawn.add(id);
  };
  place(true, 0);
  for (let k = 1; k <= top; k++) { place(true, k); place(false, k); }
  if (m && t > 0.97) {
    const [, y] = pos(true, m.k);
    plate(0, y, `\\Sigma_${m.k}^{\\mathsf p}=\\Pi_${m.k}^{\\mathsf p}=\\mathrm{PH}`, 'green', 1.9);
  } else if (!(m && t > 0.5)) {
    plate(px, py, '\\mathrm{PH}', col('PH'), 0.62);
  } else plate(px, py, '\\mathrm{PH}', col('PH'), 0.62);
  if (!m || t < 0.5) s.tex('\\cdots', 0, top * LVY + 0.5, { align: 'center', baseline: 'middle', size: 18, color: 'muted' });
  const yq = (!m || t < 0.5) ? (top + 2) * LVY : (top + 2) * LVY;
  if (!m) s.arrow(0, py + 0.3, 0, yq - 0.3, { color: 'muted', width: 1.4, alpha: 0.55, head: 7 });
  if (!m) plate(0, yq, '\\mathrm{PSPACE}', col('PSPACE'), 0.9);
  return { hiTop };
}

// ---------------------------------------------------------------------------------------------------------------
const TAUT_PRE = [
  ['(p → q) ∧ (q → r) → (p → r)', 'syllogism'],
  ['p ∨ ¬p', 'excluded middle'],
  ['¬(p ∧ q) ↔ (¬p ∨ ¬q)', 'De Morgan'],
  ['((p → q) → p) → p', 'Peirce’s law'],
  ['(p → q) → (q → p)', 'converse (false)'],
  ['p ∨ q ∨ r ∨ s ∨ t', 'a needle: one falsifier'],
];
const MINF_PRE = [
  ['(x ∧ y) ∨ (x ∧ ¬y) ∨ (¬x ∧ y)', 'redundant'],
  ['(x ∨ y) ∧ (x ∨ ¬y) ∧ (¬x ∨ y) ∧ (¬x ∨ ¬y)', 'contradiction'],
  ['(x ∧ y) ∨ (¬x ∧ z) ∨ (y ∧ z)', 'consensus'],
  ['x ∨ y', 'already minimal'],
  ['(x ∧ ¬y) ∨ (¬x ∧ y)', 'XOR'],
  ['(x ^ y) ^ z', '3-parity'],
];

export default {
  collection: 'cplx',
  chapter: 3,
  title: 'coNP and the polynomial hierarchy',
  summary: String.raw`Certificates of “no” define coNP, and quantifier alternation stacks NP and coNP into the polynomial hierarchy: “is there an $x$ such that for all $y$ …” and so on. If any two levels coincide the whole hierarchy collapses there, which makes collapse a useful yardstick of implausibility. Alternating machines give a machine model for the hierarchy and, run for polynomial time or logarithmic space, capture PSPACE and P exactly. Alternation also yields the only known time–space lower bounds for SAT.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'TAUTOLOGY is coNP-complete',
      statement: String.raw`**TAUTOLOGY** is the set of Boolean formulas $\varphi$ that are true under *every* assignment. It lies in $\mathrm{coNP}$ (a falsifying assignment, checked in linear time, is a short certificate that $\varphi$ is *not* a tautology) and is $\mathrm{coNP}$-complete under polynomial-time many-one reductions: $\varphi\in\mathrm{SAT}\iff\lnot\varphi\notin\mathrm{TAUT}$, so every $\mathrm{coNP}$ language reduces to it. Hence $\mathrm{TAUT}\in\mathrm P$ would give $\mathrm P=\mathrm{NP}$, and $\mathrm{TAUT}\in\mathrm{NP}$ would give $\mathrm{NP}=\mathrm{coNP}$.`,
      idea: String.raw`Let $L\in\mathrm{coNP}$, so $\overline L\in\mathrm{NP}$. By the Cook–Levin theorem (toc-13.4) there is a polynomial-time map $x\mapsto\psi_x$ with $x\in\overline L\iff\psi_x\in\mathrm{SAT}$. Then $x\in L\iff\psi_x\notin\mathrm{SAT}\iff\lnot\psi_x\in\mathrm{TAUT}$, which is a many-one reduction. Membership in $\mathrm{coNP}$ is the definition (toc-12.13): the complement of TAUT is SAT, whose yes-instances have the satisfying assignment as certificate. The asymmetry is the whole point: one row of the truth table certifies "no", but nobody knows a certificate of polynomial size for "yes" — a proof that *all* $2^n$ rows are true.`,
      caption: String.raw`Type any formula in the letters $p,q,r,s,t$ (operators ¬ ∧ ∨ ⊕ → ↔; the ASCII forms ~ & | ^ -> <-> also work) or pick a preset. The table lists all $2^n$ rows; rows where $\varphi$ is false are red. **Click a row** to offer it as a certificate for “$\varphi$ is not a tautology”: a falsifying row is accepted at once, a satisfying row proves nothing. For a tautology no row is accepted, and the only way to confirm it is to look at every row, which the right-hand plot shows growing as $2^n$ while a falsifier costs just $n$ bits.`,
      deps: ["toc-12.13","toc-13.4","logic-2.4"],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Cook, 1971 (the set of tautologies is as hard as any NP set under polynomial-time reductions)',
      links: { doi: 'https://doi.org/10.1145/800157.805047' },
      tags: ['coNP', 'tautology', 'certificates'],
      viz(v) {
        let sel = -1;
        const f = v.input('$\\varphi$ =', TAUT_PRE[0][0], { width: 330, placeholder: 'e.g. (p -> q) | p' });
        v.select('preset', TAUT_PRE.map(([t, n], i) => ({ value: i, label: n })), 0, { onChange: (i) => { f.set(TAUT_PRE[i][0]); sel = -1; } });
        const s = v.stage({ x: [0, 10], y: [0, 36], axes: false, height: 440, weight: 1.35, minWidth: 340, title: 'truth table of φ (click a row)' });
        const s2 = v.stage({ x: [0, 20], y: [0.8, 3e6], ylog: true, axes: 'box', gutter: true, height: 440, weight: 1, minWidth: 260, xlabel: 'number of variables n', ylabel: 'things to inspect', title: 'yes-proof vs no-proof' });
        let info = { ok: false };
        const parse = () => {
          const P = parseBool(f.value);
          if (!P.ok) return { ok: false, error: P.error };
          if (P.vars.length > 5) return { ok: false, error: 'at most 5 variables (p q r s t)' };
          if (P.vars.some((c) => !'pqrst'.includes(c))) return { ok: false, error: 'use the letters p q r s t' };
          if (!P.vars.length) P.vars.push('p');
          const tt = truthTable(P.ast, P.vars);
          return { ok: true, P, vars: P.vars, n: P.vars.length, tt, fals: tt.map((x, r) => (x ? -1 : r)).filter((r) => r >= 0) };
        };
        s.onClick((x, y) => {
          if (!info.ok) return;
          const R = 1 << info.n, rowH = 36 / (R + 2), r = Math.floor((35 - y) / rowH);
          if (r >= 0 && r < R) sel = r;
        });
        v.render(() => {
          info = parse();
          if (!info.ok) {
            s.setView([0, 10], [0, 36]);
            s.text(`cannot read the formula: ${info.error}`, 5, 18, { align: 'center', color: 'red', size: 15 });
            return;
          }
          const { vars, n, tt, P } = info, R = 1 << n, rowH = 36 / (R + 2), cw = 10 / (n + 3), px = s.height / (R + 2) * 0.72;
          if (sel >= R) sel = -1;
          const size = clamp(px, 8, 15);
          vars.forEach((c, j) => s.text(c, (j + 0.5) * cw, 36 - rowH * 0.5, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: 'accent' }));
          s.text('φ', (n + 0.5) * cw + cw * 0.3, 36 - rowH * 0.5, { align: 'center', baseline: 'middle', size: 15, weight: 700 });
          s.text('¬φ', (n + 1.8) * cw + cw * 0.3, 36 - rowH * 0.5, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: 'muted' });
          s.line(0, 36 - rowH, 10, 36 - rowH, { color: 'muted', width: 1 });
          for (let r = 0; r < R; r++) {
            const yc = 36 - rowH * (r + 1.5);
            if (!tt[r]) s.rect(0, yc - rowH / 2, 10, yc + rowH / 2, { fill: 'red', fillAlpha: 0.14, stroke: false });
            if (r === sel) s.rect(0.03, yc - rowH / 2 + 0.03, 9.97, yc + rowH / 2 - 0.03, { fill: false, color: tt[r] ? 'orange' : 'red', width: 2.5 });
            vars.forEach((c, j) => s.text(String((r >> (n - 1 - j)) & 1), (j + 0.5) * cw, yc, { align: 'center', baseline: 'middle', size, color: 'muted' }));
            s.text(String(tt[r]), (n + 0.5) * cw + cw * 0.3, yc, { align: 'center', baseline: 'middle', size, weight: 700, color: tt[r] ? 'green' : 'red' });
            s.text(String(1 - tt[r]), (n + 1.8) * cw + cw * 0.3, yc, { align: 'center', baseline: 'middle', size, color: 'muted' });
          }
          // plot of the two proof sizes
          const ns = Array.from({ length: 21 }, (_, i) => i);
          s2.path(ns.map((k) => [k, 2 ** k]), { color: 'red', width: 2.2 });
          s2.path(ns.filter((k) => k >= 1).map((k) => [k, k]), { color: 'green', width: 2.2 });
          s2.dot(n, 2 ** n, { r: 6, color: 'red' }); s2.dot(n, n, { r: 6, color: 'green' });
          s2.text('all 2ⁿ rows (certify “yes”)', 0.6, 2 ** 13, { align: 'left', color: 'red', size: 12 });
          s2.text('one falsifier: n bits', 20, 28, { align: 'right', color: 'green', size: 12, baseline: 'bottom' });
        });
        v.readout(() => {
          if (!info.ok) return `**cannot read the formula** — ${info.error}`;
          const { vars, n, tt, fals, P } = info, R = 1 << n, taut = fals.length === 0;
          const rowTxt = (r) => vars.map((c, j) => `${c}=${(r >> (n - 1 - j)) & 1}`).join(', ');
          let l1 = `$${astTex(P.ast)}$ · $n=${n}$ variables, $2^n=${R}$ rows · false in **${fals.length}** of them · $\\varphi\\in\\mathrm{TAUT}$: **${taut ? 'yes' : 'no'}** · $\\lnot\\varphi\\in\\mathrm{SAT}$: **${taut ? 'no' : 'yes'}** (always the opposite)`;
          let l2;
          if (sel >= 0) l2 = tt[sel] ? `Your row (${rowTxt(sel)}) makes $\\varphi$ true: it certifies **nothing** — the verifier rejects it.` : `Your row (${rowTxt(sel)}) makes $\\varphi$ false: the verifier **accepts** — a $${n}$-bit certificate that $\\varphi\\notin\\mathrm{TAUT}$.`;
          else l2 = taut ? `No falsifying row exists; confirming this means inspecting all ${R} rows (no short certificate is known).` : `First falsifier in table order: row ${fals[0]} (${rowTxt(fals[0])}) — scanning found it after ${fals[0] + 1} of ${R} rows.`;
          return `${l1}\n${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Pratt certificates: PRIMES is in NP ∩ coNP',
      statement: String.raw`Let $\mathrm{PRIMES}=\{p : p \text{ is prime}\}$. Then $\mathrm{PRIMES}\in\mathrm{NP}\cap\mathrm{coNP}$. A prime $p$ has a *succinct certificate*: a number $g$ together with the prime factorization $p-1=\prod q_i^{e_i}$, such that $g^{\,p-1}\equiv1$ and $g^{(p-1)/q_i}\not\equiv1\pmod p$ for every $i$, and, recursively, a certificate for each prime $q_i$. The whole tree has $O(\log^2 p)$ bits. A composite $n$ has the factor $d$ as an even shorter certificate, so $\mathrm{PRIMES}\in\mathrm{coNP}$ trivially. (Today we also know $\mathrm{PRIMES}\in\mathrm P$, but Pratt's certificates predate that by almost thirty years.)`,
      idea: String.raw`If $g$ passes the tests, then $g$ has order exactly $p-1$ modulo $p$: its order divides $p-1$ by the first test, and cannot be a proper divisor $m$ of $p-1$ because then $m$ would divide $(p-1)/q$ for some prime factor $q$ and the second test would fail. An element of order $p-1$ forces the unit group mod $p$ to have at least $p-1$ elements, so every number $1,\dots,p-1$ is coprime to $p$: $p$ is prime. The tests are checked by repeated squaring, so verification is polynomial (this is the NP definition of toc-12.11: a polynomial-size certificate with a polynomial-time check). The tree stays small because the numbers shrink: the prime factors $q_i$ of $p-1$ satisfy $\prod q_i\le p-1$, and an induction on $p$ bounds the number of nodes by $O(\log p)$, each of $O(\log p)$ bits. The converse direction is the same object seen from the other side: for *composite* $n$ no element of order $n-1$ exists, since the unit group has fewer than $n-1$ elements and $\lambda(n)<n-1$, so no certificate can ever be forged.`,
      caption: String.raw`Type an integer (up to $10^{13}$) or pick a prime. For a **prime** the certificate tree is built and verified node by node: each box shows $p$ and its generator $g$, turns green when $g^{p-1}\equiv1$ and every $g^{(p-1)/q}\not\equiv1$ hold, and children are the primes $q$ dividing $p-1$ (dashed: a prime already certified elsewhere, reused). **Switch off “certified generator”** and drag $g$ at the root to see the checks fail for a wrong $g$. For a **composite** the picture shows the coNP certificate (a factor), the maximum order of any element — which is less than $n-1$, so *no* generator exists — and, if $n$ is a Carmichael number, a Fermat witness that passes $g^{n-1}\equiv1$ but not the full test.`,
      deps: ["toc-12.11","toc-12.13","nt-3.1","alg-4.28","nt-1.6"],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Pratt, 1975 (SIAM J. Comput. 4(3):214–220); PRIMES ∈ P: Agrawal–Kayal–Saxena, 2004',
      links: { doi: 'https://doi.org/10.1137/0204018' },
      tags: ['primality', 'certificates', 'NP ∩ coNP'],
      viz(v) {
        const PRE = [['2027', '2027'], ['65537', '65537'], ['1000003', '10⁶+3'], ['999999000001', 'a 12-digit prime'], ['561', '561 (Carmichael)'], ['1000001', 'composite 101·9901']];
        const inp = v.input('$n$ =', PRE[1][0], { width: 150, placeholder: 'an integer ≥ 2' });
        v.select('example', PRE.map(([t, l], i) => ({ value: i, label: l })), 1, { onChange: (i) => inp.set(PRE[i][0]) });
        const useCert = v.toggle('certified generator at the root', true);
        const gSl = v.slider('root generator $g$', 2, 60, 2, { int: true });
        const s = v.stage({ x: [0, 10], y: [-0.7, 4.6], axes: false, height: 340, full: true });
        let cache = { n: -1 };
        const build = () => {
          const t = inp.value.trim();
          const n = /^\d{1,13}$/.test(t) ? +t : NaN;
          if (cache.n === n) return cache;
          if (!(n >= 2)) return (cache = { n, bad: true });
          const prime = isPrimeInt(n);
          cache = { n, prime };
          if (prime) { const seen = new Set(); cache.tree = prattTree(n, seen); cache.stats = prattStats(cache.tree); }
          else { const f = factorInt(n); cache.fac = f; cache.d = f[0][0]; cache.lam = carmichaelLambda(n); cache.carm = f.length >= 3 && f.every(([, e]) => e === 1) && f.every(([p]) => (n - 1) % (p - 1) === 0); }
          return cache;
        };
        const layout = (node, depth, st) => {
          node.depth = depth;
          if (!node.kids.length) { node.x = st.leaf++; } else { node.kids.forEach((k) => layout(k, depth + 1, st)); node.x = (node.kids[0].x + node.kids[node.kids.length - 1].x) / 2; }
          st.maxD = Math.max(st.maxD, depth);
        };
        let rootInfo = null;
        v.render(() => {
          const C = build(); gSl.el.hidden = useCert.value || !C.prime;
          if (C.bad) { s.text('enter an integer between 2 and 10¹³', 5, 2, { align: 'center', color: 'red', size: 15 }); rootInfo = null; return; }
          if (!C.prime) {
            rootInfo = null;
            s.text(`${C.n.toLocaleString('en-US')} is composite`, 5, 3.9, { align: 'center', size: 18, weight: 700, color: 'red' });
            s.text(`factor certificate (coNP): ${C.d} × ${(C.n / C.d).toLocaleString('en-US')} = ${C.n.toLocaleString('en-US')}`, 5, 3.0, { align: 'center', size: 14, color: 'green' });
            const w = 7, x0 = 1.5, frac = Math.min(1, C.lam / (C.n - 1));
            s.text('largest possible order of any residue mod n (Carmichael’s λ) versus the n−1 a Pratt certificate would need', 5, 2.1, { align: 'center', size: 12, color: 'muted' });
            s.rect(x0, 1.1, x0 + w, 1.7, { fill: 'faint', fillAlpha: 0.2, color: 'muted', width: 1 });
            s.rect(x0, 1.1, x0 + w * frac, 1.7, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 });
            s.text(`λ(n) = ${C.lam.toLocaleString('en-US')}`, x0 + Math.max(0.1, w * frac) + 0.1, 1.4, { size: 12, baseline: 'middle', color: 'accent', align: frac > 0.8 ? 'right' : 'left' });
            s.text(`n−1 = ${(C.n - 1).toLocaleString('en-US')}`, x0 + w, 0.7, { align: 'right', size: 12, color: 'muted' });
            s.text(C.lam < C.n - 1 ? 'no residue has order n−1 ⇒ every “certificate” fails' : '', 5, 0.1, { align: 'center', size: 13, color: 'red' });
            return;
          }
          const T = C.tree, st = { leaf: 0, maxD: 0 }; layout(T, 0, st);
          const L = Math.max(st.leaf, 1), D = st.maxD;
          const DD = Math.max(D, 2);
          s.setView([-0.2, Math.max(L, 5) + 0.2], [-0.7, DD + 0.8]);
          const X = (n) => n.x + (Math.max(L, 5) - L) / 2, Y = (n) => DD - n.depth;
          rootInfo = { root: T, ok: true };
          const drawNode = (nd, parent) => {
            const x = X(nd), y = Y(nd) + 0.0;
            if (parent) s.line(X(parent), Y(parent) - 0.22, x, y + 0.22, { color: 'muted', width: 1.4, alpha: 0.7 });
            let node = nd;
            if (nd === T && !useCert.value && !nd.base) node = { ...nd, g: Math.min(gSl.value, nd.p - 1) };
            const chk = node.base ? { ok: true } : prattCheck(node);
            const kidsOk = nd.dup || nd.kids.every((k) => k.okTree);
            nd.okTree = chk.ok && (nd.dup || nd.kids.every((k) => k.okTree));
            const c = nd.dup ? 'muted' : (nd.okTree ? 'green' : 'red');
            const label = node.base ? '2 ✓' : `${node.p.toLocaleString('en-US')}${node.dup ? ' (reused)' : `  g=${node.g} ${nd.okTree ? '✓' : '✗'}`}`;
            s.text(label, x, y, { align: 'center', baseline: 'middle', size: clamp(15 - L * 0.35, 10, 14), weight: 700, color: c, plate: true, halo: false });
            if (nd === T) rootInfo.chk = chk;
          };
          const walk = (nd, parent) => { nd.kids.forEach((k) => walk(k, nd)); drawNode(nd, parent); };
          // children first so okTree is known; draw parents on top
          walk(T, null);
          s.text('each node: prime p, generator g; children: the prime factors of p − 1', 0.1, -0.5, { size: 11, color: 'muted' });
        });
        v.readout(() => {
          const C = cache;
          if (C.bad) return 'Enter an integer ≥ 2.';
          if (!C.prime) return `$${C.n}$ is **composite**: $${C.fac.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : p)).join('\\cdot ')}$ — certificate of "no": the factor $${C.d}$, checked by one division. Largest element order $\\lambda(n)=${C.lam}$ against $n-1=${C.n - 1}$: ${C.lam < C.n - 1 ? '**no** residue can pass the Pratt test' : ''}${C.carm ? ` · $n$ is a **Carmichael number**: every base $g$ coprime to $n$ has $g^{n-1}\\equiv1$, so a bare Fermat test is fooled, but the Pratt condition $g^{(n-1)/q}\\not\\equiv1$ cannot hold for all $q$` : ''}.`;
          const S = C.stats, T = C.tree, chk = rootInfo && rootInfo.chk;
          let l2 = '';
          if (chk && !T.base) {
            const g = useCert.value ? T.g : Math.min(gSl.value, T.p - 1);
            const parts = chk.checks[2].map(([q, r]) => `$${g}^{(p-1)/${q}}\\equiv${r}$ ${r === 1 ? '(**fails**)' : '✓'}`).join(' · ');
            l2 = `\nRoot: $p-1=${T.fac.map(([q, e]) => (e > 1 ? `${q}^{${e}}` : q)).join('\\cdot ')}$ · $${g}^{p-1}\\equiv${powmod(g, T.p - 1, T.p)}$ ${chk.checks[1] ? '✓' : '(**fails**)'} · ${parts}`;
          }
          const ok = T.okTree !== false;
          return `$p=${C.n.toLocaleString('en-US')}$ is prime · certificate: **${S.lines}** distinct primes, depth ${S.depth}, about **${S.bits}** bits written (the bound is $O(\\log^2 p)$: $\\log_2^2 p\\approx${Math.round(Math.log2(C.n) ** 2)}$) · tree verifies: **${ok ? 'yes' : 'no'}**${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Factoring lies in NP ∩ coNP',
      statement: String.raw`The decision form of integer factoring is $\mathrm{FACT}=\{(N,k): N$ has a divisor $d$ with $1<d\le k\}$. It lies in $\mathrm{NP}\cap\mathrm{coNP}$. A yes-certificate is the divisor $d$ itself. A no-certificate is the complete prime factorization $N=\prod p_i^{e_i}$ together with a Pratt certificate (3.2) for each $p_i$ and the observation that every $p_i>k$: then every divisor $d>1$ is at least the least prime factor $>k$. Consequently, if $\mathrm{FACT}$ were $\mathrm{NP}$-complete (or even NP-hard under many-one reductions) then $\mathrm{NP}=\mathrm{coNP}$, which is believed false. The same holds for the search problem "find the factors", since the decision version reduces to it and conversely by binary search on $k$.`,
      idea: String.raw`Unique factorization does all the work. For a yes-instance one factor is enough. For a no-instance the factorization certifies that every prime factor exceeds $k$, and the Pratt certificates (3.2) prove that the listed numbers really are prime, so the list cannot be refined; all of it has $O(\log^2 N)$ bits and is verified with multiplications and modular exponentiations only. A language in $\mathrm{NP}\cap\mathrm{coNP}$ cannot be NP-complete unless $\mathrm{NP}=\mathrm{coNP}$ (a reduction from SAT would turn the no-certificates of the language into no-certificates for SAT). This is why factoring is thought to be of intermediate difficulty, and why a public-key system built on it is not "as safe as NP-hardness" — but no polynomial algorithm for ordinary computers is known.`,
      caption: String.raw`Type $N$ (up to $10^{13}$) and drag the threshold $k$ along the log-scale number line (or use the slider). Gold dots are the prime factors of $N$ (with multiplicity), the grey ticks are all of its divisors. If some divisor lies in $(1,k]$ the green **yes-certificate** is the least prime factor; otherwise the **no-certificate** is the factorization with the Pratt certificates sized in the bar chart. Both are verified live, and a brute-force trial division gives the answer to compare.`,
      deps: ['cplx-3.2'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Pratt, 1975 (primality certificates) combined with unique factorization',
      tags: ['factoring', 'NP ∩ coNP', 'certificates'],
      viz(v) {
        const PRE = [['600851475143', '600851475143'], ['999999000001', '10¹²−10⁶+1'], ['1000036000099', 'a semiprime'], ['720720', '720720 (many divisors)'], ['1000000007', 'a prime']];
        const inp = v.input('$N$ =', PRE[0][0], { width: 150 });
        v.select('example', PRE.map(([t, l], i) => ({ value: i, label: l })), 0, { onChange: (i) => { inp.set(PRE[i][0]); } });
        const kS = v.slider('threshold $k$', 2, 1e7, 1000, { log: true, sig: 3 });
        const s = v.stage({ x: [0, 13], y: [-1.0, 2.9], axes: false, height: 230, full: true, title: 'divisors of N on a log scale' });
        const s2 = v.stage({ x: [0, 6], y: [0, 40], axes: 'box', gutter: true, height: 230, weight: 1, minWidth: 280, xlabel: 'prime factor of N', ylabel: 'lines in its Pratt certificate', title: 'cost of the no-certificate' });
        let cache = { N: -1 };
        const build = () => {
          const t = inp.value.trim(); const N = /^\d{1,13}$/.test(t) ? +t : NaN;
          if (cache.N === N) return cache;
          if (!(N >= 2)) return (cache = { N, bad: true });
          const fac = factorInt(N), ps = fac.map(([p]) => p);
          const divs = [1]; fac.forEach(([p, e]) => { const cur = divs.slice(); let pp = 1; for (let i = 1; i <= e; i++) { pp *= p; cur.forEach((d) => divs.push(d * pp)); } });
          divs.sort((a, b) => a - b);
          const cert = fac.map(([p]) => { const t = prattTree(p); return { p, st: prattStats(t) }; });
          return (cache = { N, fac, ps, divs, cert, pmin: ps[0], prime: fac.length === 1 && fac[0][1] === 1 });
        };
        const hk = s.handle(3, 0, { color: 'gold', label: 'k', constrain: 'x', r: 8 });
        let lock = false;
        hk.onDrag = () => { if (cache.bad) return; const L = Math.log10(cache.N); kS.set(clamp(Math.round(10 ** (clamp((hk.x - 0.3) / 12.4, 0, 1) * L)), 2, 1e7)); };
        v.render(() => {
          const C = build();
          if (C.bad) { s.text('enter an integer between 2 and 10¹³', 6.5, 1, { align: 'center', color: 'red', size: 15 }); hk.visible = false; return; }
          const L = Math.log10(C.N), W = 12.4, X0 = 0.3, X = (d) => X0 + (Math.log10(d) / L) * W, k = kS.value;
          hk.visible = true; const kx = X0 + clamp(Math.log10(k) / L, 0, 1) * W; hk.set(kx, 0);
          s.line(X0, 0, X0 + W, 0, { color: 'muted', width: 2 });
          const yes = C.pmin <= k;
          s.rect(X0, -0.12, Math.min(X0 + W, kx), 0.12, { fill: yes ? 'green' : 'red', fillAlpha: 0.35, stroke: false });
          [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12].filter((t) => t <= C.N).forEach((t) => { s.line(X(t), -0.1, X(t), 0.1, { color: 'muted', width: 1 }); s.text(t >= 1e3 ? `10${sup(Math.round(Math.log10(t)))}` : String(t), X(t), -0.5, { align: 'center', size: 10.5, color: 'muted' }); });
          C.divs.forEach((d) => s.line(X(d), -0.2, X(d), 0.2, { color: 'faint', width: 1.2, alpha: 0.9 }));
          const seen = {}; C.fac.forEach(([p, e]) => { s.dot(X(p), 0.0, { r: 6, color: 'gold' }); s.text(e > 1 ? `${p.toLocaleString('en-US')}^${e}` : p.toLocaleString('en-US'), X(p), 0.8 + (Math.round(X(p) * 3) % 2) * 0.55, { align: 'center', size: 12, weight: 700, color: 'ink' }); });
          s.dot(X(C.N), 0, { r: 5, color: 'accent', hollow: true }); s.text(`N = ${C.N.toLocaleString('en-US')}`, X(C.N), 0.55, { align: 'right', size: 12, color: 'accent', weight: 700 });
          s.text(yes ? `yes: ${C.pmin.toLocaleString('en-US')} ≤ k` : 'no: every prime factor exceeds k', X0 + 0.1, 2.5, { size: 15, weight: 700, color: yes ? 'green' : 'red' });
          // bars
          s2.setView([0, Math.max(6, C.fac.length + 1)], [0, Math.max(8, ...C.cert.map((c) => c.st.lines)) * 1.2]);
          s2.setTicks(C.cert.map((c, i) => [i + 0.5, c.p.toLocaleString('en-US')]), null);
          C.cert.forEach((c, i) => { s2.rect(i + 0.2, 0, i + 0.8, c.st.lines, { fill: c.p > k ? 'green' : 'faint', fillAlpha: 0.5, color: c.p > k ? 'green' : 'muted', width: 1.2 }); s2.text(c.p.toLocaleString('en-US'), i + 0.5, c.st.lines, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted', dy: -2 }); });
        });
        v.readout(() => {
          const C = cache; if (C.bad) return 'Enter an integer ≥ 2.';
          const k = kS.value, yes = C.pmin <= k, brute = (() => { for (let d = 2; d <= Math.min(k, Math.floor(Math.sqrt(C.N))); d++) if (C.N % d === 0) return true; return C.N <= k ? C.N > 1 && !false : (C.pmin <= k); })();
          const bits = Math.ceil(Math.log2(C.N + 1)), noBits = C.cert.reduce((a, c) => a + c.st.bits, 0), lines = C.cert.reduce((a, c) => a + c.st.lines, 0);
          const f = C.fac.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : p)).join('\\cdot ');
          return `$N=${f}$ · $k=${big(k)}$ · $(N,k)\\in\\mathrm{FACT}$: **${yes ? 'yes' : 'no'}**${C.prime ? ' ($N$ is prime, so the only divisor above 1 is $N$ itself)' : ''}\n`
            + (yes ? `Yes-certificate: the divisor **${C.pmin.toLocaleString('en-US')}** (${Math.ceil(Math.log2(C.pmin + 1))} bits), verified by one division: $N/${C.pmin}=${(C.N / C.pmin).toLocaleString('en-US')}$.`
              : `No-certificate: the factorization above ($N$ has ${bits} bits) plus ${lines} Pratt lines ≈ **${noBits} bits**; all primes exceed $k$, so no divisor in $(1,k]$ exists.`)
            + ` Trial-division check agrees: **${yes === brute ? 'yes' : 'NO'}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Σ₂ and Π₂: two quantifiers',
      statement: String.raw`A language $L$ is in $\Sigma_2^{\mathsf p}$ if there is a polynomial-time predicate $V$ and a polynomial $q$ with $x\in L\iff\exists u\in\{0,1\}^{q(|x|)}\ \forall w\in\{0,1\}^{q(|x|)}\ V(x,u,w)=1$; it is in $\Pi_2^{\mathsf p}$ if the quantifiers are $\forall u\,\exists w$. So $\Pi_2=\mathrm{co}\Sigma_2$, $\mathrm{NP}\cup\mathrm{coNP}\subseteq\Sigma_2\cap\Pi_2$ (add a dummy quantifier), and $\Sigma_2=\mathrm{NP}^{\mathrm{SAT}}$ (1.10). Example: **formula minimization** — given a formula $\varphi$ and a size bound $m$, is there a formula $\psi$ of size $\le m$ equivalent to $\varphi$? Guess $\psi$ ($\exists$), then check $\psi(a)=\varphi(a)$ for all assignments $a$ ($\forall$): the problem is in $\Sigma_2$.`,
      idea: String.raw`The $\exists$ player supplies a polynomial-size witness; instead of verifying it directly we hand the $\forall$ player a polynomial-size challenge and verify the pair $(u,w)$ in polynomial time. NP is the case with no $\forall$, coNP the case with no $\exists$. Formula minimization shows why one quantifier is not enough: equivalence of $\psi$ and $\varphi$ is a coNP-type statement ("for all assignments the two agree"), so a guessed $\psi$ is not known to be checkable in polynomial time; the second quantifier is what pays for that check. Membership in $\Sigma_2$ is immediate; completeness is known for the DNF version (Umans, 2001) and I make no claim for general formulas here.`,
      caption: String.raw`Variables are $x,y,z$ (so a formula is one of 256 Boolean functions). The big grid shows **every** function, coloured by the exact size of its smallest ($\land,\lor,\lnot$) formula, computed by a search over all 256 — the $\exists$ layer's search space. Type $\varphi$ (or pick a preset); its function is ringed gold. **Click a cell** to choose a candidate $\psi$ ($\exists$); the table then runs the $\forall$ layer, comparing $\psi$ with $\varphi$ on all 8 assignments and flagging disagreements red. “Find shorter” jumps to a smaller equivalent formula, if one exists. Size = number of variable occurrences. Hatched cells are not shorter than $\varphi$, so they cannot witness “a smaller formula exists”.`,
      deps: ["toc-12.13","logic-3.4","logic-2.4"],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Meyer & Stockmeyer, 1972; Stockmeyer, 1976; DNF minimization Σ₂-complete: Umans, 2001',
      links: { doi: 'https://doi.org/10.1016/0304-3975(76)90061-x' },
      tags: ['Σ₂', 'quantifiers', 'minimization'],
      viz(v) {
        const MF = minFormulas3();
        const f = v.input('$\\varphi$ =', MINF_PRE[0][0], { width: 330, placeholder: 'letters x y z' });
        v.select('preset', MINF_PRE.map(([t, n], i) => ({ value: i, label: n })), 0, { onChange: (i) => { f.set(MINF_PRE[i][0]); psi = -1; } });
        let psi = -1, info = { ok: false };
        const s1 = v.stage({ x: [0, 16], y: [-0.2, 16.2], axes: false, equal: true, height: 420, weight: 1.15, minWidth: 330, title: '∃ layer: all 256 functions, by smallest formula size' });
        const s2 = v.stage({ x: [0, 8], y: [0, 11], axes: false, height: 400, weight: 1, minWidth: 300, title: '∀ layer: agreement on all 8 assignments' });
        const parse = () => {
          const P = parseBool(f.value);
          if (!P.ok) return { ok: false, error: P.error };
          if (P.vars.some((c) => !'xyz'.includes(c))) return { ok: false, error: 'use the letters x y z' };
          const m = mask3(P.ast), size = leafCount(P.ast);
          return { ok: true, P, m, size, min: MF.cost[m], expr: MF.expr[m] };
        };
        const maxC = Math.max(...MF.cost);
        s1.onClick((x, y) => { const c = Math.floor(x), r = 15 - Math.floor(y); if (c >= 0 && c < 16 && r >= 0 && r < 16) psi = r * 16 + c; });
        v.button('Find shorter', () => { if (info.ok) psi = info.min < info.size ? info.m : -1; });
        v.render(() => {
          info = parse();
          for (let fn = 0; fn < 256; fn++) {
            const r = fn >> 4, c = fn & 15, y0 = 15 - r;
            const t = (MF.cost[fn] - 1) / (maxC - 1);
            const cand = info.ok && MF.cost[fn] < info.size;
            s1.rect(c + 0.05, y0 + 0.05, c + 0.95, y0 + 0.95, { fill: v.color('accent', 0.12 + 0.6 * t), stroke: false });
            if (info.ok && !cand) s1.rect(c + 0.05, y0 + 0.05, c + 0.95, y0 + 0.95, { fill: false, stroke: false, hatch: 'muted', hatchAlpha: 0.35 });
            s1.text(String(MF.cost[fn]), c + 0.5, y0 + 0.5, { align: 'center', baseline: 'middle', size: 9.5, color: t > 0.6 ? 'panel' : 'ink', halo: false });
          }
          if (!info.ok) { s2.text(`cannot read: ${info.error}`, 4, 5.5, { align: 'center', color: 'red', size: 14 }); return; }
          const phi = info.m, pm = psi >= 0 ? psi : null;
          const cell = (fn, col, w) => { const r = fn >> 4, c = fn & 15; s1.rect(c + 0.02, 15 - r + 0.02, c + 0.98, 15 - r + 0.98, { fill: false, color: col, width: w }); };
          cell(phi, 'gold', 3.2); if (pm !== null) cell(pm, 'orange', 3.2);
          // table
          const hdr = 10.2, rh = 1.05, name = ['x', 'y', 'z', 'φ', 'ψ', ''];
          ['x', 'y', 'z'].forEach((c, j) => s2.text(c, 0.5 + j * 0.9, hdr, { align: 'center', size: 14, weight: 700, color: 'accent' }));
          s2.text('φ', 3.6, hdr, { align: 'center', size: 15, weight: 700, color: 'gold' }); s2.text('ψ', 4.8, hdr, { align: 'center', size: 15, weight: 700, color: 'orange' }); s2.text('agree?', 6.4, hdr, { align: 'center', size: 12, color: 'muted' });
          let dis = 0;
          for (let r = 0; r < 8; r++) {
            const y = hdr - 0.95 - r * rh, a = (phi >> r) & 1, b = pm === null ? null : (pm >> r) & 1, bad = b !== null && a !== b;
            if (bad) { dis++; s2.rect(0, y - 0.45, 7.6, y + 0.45, { fill: 'red', fillAlpha: 0.18, stroke: false }); }
            [(r >> 2) & 1, (r >> 1) & 1, r & 1].forEach((bit, j) => s2.text(String(bit), 0.5 + j * 0.9, y, { align: 'center', baseline: 'middle', size: 14, color: 'muted' }));
            s2.text(String(a), 3.6, y, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: a ? 'green' : 'ink' });
            s2.text(b === null ? '–' : String(b), 4.8, y, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: b === null ? 'muted' : b ? 'green' : 'ink' });
            s2.text(b === null ? '' : bad ? '✗' : '✓', 6.4, y, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: bad ? 'red' : 'green' });
          }
          info.dis = dis; info.pm = pm;
        });
        v.readout(() => {
          if (!info.ok) return `**cannot read the formula** — ${info.error}`;
          const { size, min, expr, pm } = info, nb = MF.cost.filter((c) => c < size).length;
          const l1 = `$|\\varphi|=${size}$ leaves · smallest equivalent formula (exact): **${min}** leaves${min < size ? `, e.g. $${expr.replace(/∧/g, '\\land ').replace(/∨/g, '\\lor ').replace(/¬/g, '\\lnot ')}$` : ' — $\\varphi$ is already minimal'} · $\\exists$-layer candidates of size $<${size}$: **${nb}** of 256`;
          const l2 = pm === null ? 'Click a cell to guess $\\psi$.' : `$\\psi$ has size ${MF.cost[pm]} ($${MF.expr[pm].replace(/∧/g, '\\land ').replace(/∨/g, '\\lor ').replace(/¬/g, '\\lnot ')}$) · $\\forall$ layer: **${8 - info.dis}/8** assignments agree → ${info.dis === 0 ? (MF.cost[pm] < size ? '**a witness: a shorter equivalent formula exists**' : 'equivalent, but not shorter') : '**refuted** — the $\\forall$ player found an assignment where they differ'}`;
          return `${l1}\n${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'The polynomial hierarchy',
      statement: String.raw`Set $\Sigma_0^{\mathsf p}=\Pi_0^{\mathsf p}=\mathrm P$ and, for $k\ge1$, let $L\in\Sigma_k^{\mathsf p}$ iff $x\in L\iff\exists u_1\forall u_2\exists u_3\cdots Q_ku_k\ V(x,u_1,\dots,u_k)$ with polynomially bounded $u_i$ and polynomial-time $V$; $\Pi_k^{\mathsf p}$ starts with $\forall$ instead. Equivalently $\Sigma_{k+1}=\mathrm{NP}^{\Sigma_k}$ (oracle machines, 1.10). The **polynomial hierarchy** is $\mathrm{PH}=\bigcup_k\Sigma_k^{\mathsf p}$. Then $\Sigma_1=\mathrm{NP}$, $\Pi_1=\mathrm{coNP}$, and $\Sigma_k\cup\Pi_k\subseteq\Sigma_{k+1}\cap\Pi_{k+1}$ for all $k$, so $\mathrm P\subseteq\mathrm{NP}\cap\mathrm{coNP}\subseteq\cdots\subseteq\mathrm{PH}\subseteq\mathrm{PSPACE}$.`,
      idea: String.raw`A level is a game of $k$ alternating moves of polynomial length followed by a polynomial-time referee. The inclusion $\Sigma_k\subseteq\Sigma_{k+1}$ is the trick of a dummy quantifier: append a variable that $V$ ignores, and likewise put a dummy quantifier in front to move $\Sigma_k$ into $\Pi_{k+1}$. Whether the inclusions are strict is open (even $\mathrm P\ne\mathrm{NP}$ is); the oracle form $\Sigma_k=\mathrm{NP}^{\Sigma_{k-1}}$ is proved by letting the oracle answer one quantifier block at a time. Upper bound: all of PH fits into PSPACE (3.11).`,
      caption: String.raw`The diagram shows the proved inclusions (arrows). **Choose a quantifier prefix** — the first quantifier and the number of alternating blocks $k$ — or click a class; the prefix is placed at its level. “Add dummy quantifier” puts one more block in front: the same language now also sits one level up on the other side, which is exactly why $\Sigma_k\cup\Pi_k\subseteq\Sigma_{k+1}\cap\Pi_{k+1}$. The readout evaluates a small random QBF with your prefix by brute force and names a typical complete problem for the class.`,
      deps: ['cplx-3.4', 'cplx-1.10'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Meyer & Stockmeyer, 1972; Stockmeyer, 1976',
      links: { doi: 'https://doi.org/10.1016/0304-3975(76)90061-x' },
      tags: ['polynomial hierarchy', 'quantifiers'],
      viz(v) {
        const first = v.select('first quantifier', [{ value: 'E', label: '∃' }, { value: 'A', label: '∀' }], 'E');
        const kS = v.slider('blocks $k$', 0, 5, 2, { int: true });
        const dummy = v.toggle('add dummy quantifier in front', false);
        const s = v.stage({ x: [-4.2, 4.2], y: [-0.7, 10.4], axes: false, height: 520, full: true, minWidth: 300 });
        s.onClick((x, y) => {
          let best = null, bd = 1.1;
          for (let k = 0; k <= 5; k++) for (const sig of (k === 0 ? [true] : [true, false])) { const [px, py] = nodePos(sig, k); const d = Math.hypot((x - px) * 0.6, (y - py) * 0.9); if (d < bd) { bd = d; best = [sig, k]; } }
          if (best) { first.set(best[0] ? 'E' : 'A'); kS.set(best[1]); dummy.value = false; }
        });
        const COMPLETE = ['P: solved by a polynomial-time algorithm', 'SAT', 'TAUTOLOGY', '$\\Sigma_2$-SAT: $\\exists u\\,\\forall w\\,\\varphi(u,w)$', '$\\Pi_2$-SAT: $\\forall u\\,\\exists w\\,\\varphi$', 'QBF with three blocks, $\\Sigma_3$/$\\Pi_3$'];
        let cls = null;
        v.render(() => {
          const k0 = kS.value, ex = first.value === 'E';
          let k = k0, sig = ex;
          if (dummy.value && k0 < 5) { k = k0 + 1; sig = !ex; }
          if (k0 === 0) { k = dummy.value ? 1 : 0; sig = true; }
          cls = { k, sig, k0, ex };
          const mark = new Map();
          if (k === 0) mark.set('P', 'gold'); else mark.set((sig ? 'S' : 'P') + k, 'gold');
          if (k0 > 0) mark.set((ex ? 'S' : 'P') + k0, 'accent'); else mark.set('P', 'gold');
          drawTower(s, { top: 5, merge: null, mark });
        });
        v.readout(() => {
          const { k, sig, k0, ex } = cls;
          const name = (kk, ss) => (kk === 0 ? '\\mathrm P' : `${ss ? '\\Sigma' : '\\Pi'}_${kk}^{\\mathsf p}`);
          const pref = Array.from({ length: k0 }, (_, i) => ((i % 2 === 0) === ex ? '\\exists ' : '\\forall ') + `u_${i + 1}`).join('\\,');
          const base = k0 === 0 ? 'a polynomial-time predicate $V(x)$ with no quantifiers' : `$${pref}\\ V(x,u_1,\\dots,u_{${k0}})$`;
          const dm = dummy.value && k0 < 5 ? `, with a dummy ${!ex ? '∃' : '∀'} in front: the same language is also in $${name(k0 + 1, !ex)}$` : '';
          // brute-force a random QBF with that prefix (2 variables per block when small)
          const nv = Math.min(k0 * 1, 5), r = v.rng(7 + k0 * 3 + (ex ? 1 : 0));
          let ev = '';
          if (k0 > 0) {
            const quant = [null], cl = [];
            for (let i = 1; i <= nv; i++) quant.push(((i - 1) % 2 === 0) === ex ? 'E' : 'A');
            for (let j = 0; j < 4 + k0; j++) { const vs = []; while (vs.length < Math.min(3, nv)) { const x = 1 + Math.floor(r() * nv); if (!vs.includes(x)) vs.push(x); } cl.push(vs.map((x) => (r() < 0.5 ? x : -x))); }
            let val = 0;
            const rec = (d, a) => { if (d > nv) return cl.every((c) => c.some((l) => (l > 0 ? a[l] : !a[-l]))); const r0 = [0, 1].map((b) => { a[d] = b; return rec(d + 1, a); }); return quant[d] === 'E' ? r0[0] || r0[1] : r0[0] && r0[1]; };
            val = rec(1, []);
            ev = ` · a random 3-CNF $\\varphi$ on $u_1,\\dots,u_{${nv}}$ (one bit per block), evaluated by brute force: **${val ? 'true' : 'false'}**`;
          }
          return `Prefix: ${base}${dm} → class **$${name(k, sig)}$**; typical complete problem: ${COMPLETE[Math.min(k, 5)] || 'QBF with $k$ blocks'}${k0 === 0 ? '' : ev}.\nInclusions drawn: $\\Sigma_k,\\Pi_k\\subseteq\\Sigma_{k+1}\\cap\\Pi_{k+1}$ (dummy quantifier). Strictness of any of them is open; $\\Sigma_k=\\Pi_k$ for some $k$ would collapse the tower (3.6).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'If Σₖ = Πₖ the hierarchy collapses to level k',
      statement: String.raw`If $\Sigma_k^{\mathsf p}=\Pi_k^{\mathsf p}$ for some $k\ge1$, then $\mathrm{PH}=\Sigma_k^{\mathsf p}$ (and $=\Pi_k^{\mathsf p}$). Consequently the polynomial hierarchy has only finitely many distinct levels as soon as two adjacent complementary classes coincide, and in particular $\mathrm{NP}=\mathrm{coNP}$ implies $\mathrm{PH}=\mathrm{NP}$, while $\mathrm P=\mathrm{NP}$ implies $\mathrm{PH}=\mathrm P$.`,
      idea: String.raw`Show $\Sigma_{k+1}\subseteq\Sigma_k$; the rest follows by induction on the levels. A $\Sigma_{k+1}$ sentence has the form $\exists u_1\,[\forall u_2\exists u_3\cdots V]$, and the bracket is a $\Pi_k$ condition on $(x,u_1)$. By hypothesis $\Pi_k=\Sigma_k$, so the bracket can be replaced by an equivalent $\Sigma_k$ sentence $\exists v_1\forall v_2\cdots V'$ (the translation is polynomial and applies to every fixed $(x,u_1)$ because it is a fixed algorithm). The sentence becomes $\exists u_1\exists v_1\forall v_2\cdots V'$, and two adjacent $\exists$ merge into one block of twice the length: a $\Sigma_k$ sentence. Applying this repeatedly folds level $k+2$ into $k+1$ into $k$, and so on; $\Pi$ levels collapse by taking complements. For $k=1$ the statement says that NP $=$ coNP is enough to bring down the entire tower (in oracle language: $\mathrm{NP}^{\mathrm{NP}}$ would equal NP).`,
      caption: String.raw`Switch on the **hypothesis** $\Sigma_k=\Pi_k$ and choose $k$: the levels above $k$ glide down and merge into one box, $\Sigma_k=\Pi_k=\mathrm{PH}$. (The hypothesis is believed false, so the picture is schematic: nothing here computes a collapse.) Use “start at level $j$” to see the chain of one-block merges that brings a level-$j$ sentence down to level $k$: each step replaces a $\Pi_k$ tail by a $\Sigma_k$ tail and merges two adjacent $\exists$ blocks.`,
      deps: ['cplx-3.5'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Stockmeyer, 1976; Wrathall, 1976',
      tags: ['collapse', 'polynomial hierarchy'],
      viz(v) {
        const hyp = v.toggle('hypothesis $\\Sigma_k=\\Pi_k$', false);
        const kS = v.slider('$k$', 1, 4, 2, { int: true });
        const jS = v.slider('start at level $j$', 2, 6, 5, { int: true });
        const s = v.stage({ x: [-4.2, 4.2], y: [-0.7, 10.4], axes: false, height: 500, full: true, minWidth: 300 });
        let T = 0, target = 0, raf = 0, last = 0;
        const tick = (now) => {
          raf = 0; const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
          const d = target - T;
          if (Math.abs(d) < 0.004) T = target; else { T += Math.sign(d) * Math.min(Math.abs(d), dt * 0.9); raf = requestAnimationFrame(tick); }
          v.invalidate();
        };
        const go = () => {
          target = hyp.value ? 1 : 0;
          if (window.__vizStill) { T = target; v.invalidate(); return; }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        };
        hyp.el.addEventListener?.('change', go); hyp.el.addEventListener?.('click', () => setTimeout(go, 0));
        v.onCleanup(() => { if (raf) cancelAnimationFrame(raf); });
        let wasHyp = false, wasK = 1;
        v.render(() => {
          if (hyp.value !== wasHyp) { wasHyp = hyp.value; go(); }
          jS.el.hidden = !hyp.value;
          const k = kS.value;
          const mark = new Map(); if (T < 0.5) { mark.set(`S${k}`, 'orange'); mark.set(`P${k}`, 'orange'); }
          drawTower(s, { top: 5, merge: T > 0 ? { k, t: T } : null, mark });
          if (T === 0 && hyp.value === false) s.text('switch on the hypothesis to see the collapse', -4.1, 10.0, { align: 'left', size: 12, color: 'muted' });
          if (T > 0 && T < 1) s.text('merging…', -4.1, 10.0, { align: 'left', size: 12, color: 'muted' });
        });
        v.readout(() => {
          const k = kS.value, j = Math.max(jS.value, k + 1);
          if (!hyp.value) return `Hypothesis off: $\\mathrm P\\subseteq\\mathrm{NP}\\cap\\mathrm{coNP}\\subseteq\\Sigma_2\\cap\\Pi_2\\subseteq\\cdots$ — as far as anyone knows, all levels are distinct. Switch it on to assume $\\Sigma_${k}=\\Pi_${k}$.`;
          const steps = []; for (let i = j; i > k; i--) steps.push(`$\\Sigma_{${i}}\\to\\Sigma_{${i - 1}}$`);
          const pre = Array.from({ length: j }, (_, i) => (i % 2 === 0 ? '\\exists ' : '\\forall ') + `u_${i + 1}`).join('\\,');
          return `Under $\\Sigma_${k}=\\Pi_${k}$: $\\mathrm{PH}=\\Sigma_${k}=\\Pi_${k}$ — **${k}** level${k > 1 ? 's' : ''} instead of infinitely many.\nA level-$${j}$ sentence $${pre}\\,V$ folds down in **${j - k}** merge${j - k > 1 ? 's' : ''}: ${steps.join(' , ')}. Each step: rewrite the $\\Pi_${k}$ tail $\\forall u_2\\cdots$ as a $\\Sigma_${k}$ tail $\\exists v_1\\cdots$, then merge $\\exists u_1\\exists v_1$.`;
        });
      },
    },
  ],
};
