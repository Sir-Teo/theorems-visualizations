// Logic & Foundations — Chapter 1: Infinity and the paradoxes (items 1.1–1.5; 1.6–1.11 in ch01-b.js)
import { cantorList, algebraicByHeight, polyTex, sub } from './ch01.shared.js';

// ---------- Hilbert's hotel (1.1) ----------
const PRIMES = (() => { const out = [], is = new Uint8Array(2000).fill(1); for (let p = 2; p < 2000; p++) if (is[p]) { out.push(p); for (let q = p * p; q < 2000; q += p) is[q] = 0; } return out; })();
/** r = p^s with p prime, s ≥ 1 → [p, s]; otherwise null. */
function primePower(r) {
  if (r < 2 || !Number.isFinite(r)) return null;
  let p = 2; while (p * p <= r && r % p) p++;
  if (r % p) return [r, 1];
  let s = 0, m = r; while (m % p === 0) { m /= p; s++; }
  return m === 1 ? [p, s] : null;
}
const tri = (d) => (d * (d + 1)) / 2;
/** Cantor's pairing π(a, s) = (a+s−1)(a+s−2)/2 + s on ℕ×ℕ (a, s ≥ 1), and its inverse. */
const pair = (a, s) => tri(a + s - 2) + s;
function unpair(r) { const d = Math.ceil((Math.sqrt(8 * r + 1) - 1) / 2 - 1e-9); const s = r - tri(d - 1); return [d + 1 - s, s]; }
const HUGE = 1e15;
const cap = (x) => (x > HUGE ? Infinity : x);
const HOTEL_MOVES = {
  s1: { btn: 'n ↦ n + 1', tex: 'n\\mapsto n+1', f: (n) => n + 1, pre: (r) => (r > 1 ? [r - 1] : []), newc: (r) => (r === 1 ? { i: 1 } : null), place: (o) => o.i, aff: [1, 1], adds: 'one newcomer' },
  s3: { btn: 'n ↦ n + 3', tex: 'n\\mapsto n+3', f: (n) => n + 3, pre: (r) => (r > 3 ? [r - 3] : []), newc: (r) => (r <= 3 ? { i: r } : null), place: (o) => o.i, aff: [1, 3], adds: 'three newcomers' },
  d2: { btn: 'n ↦ 2n (a coach)', tex: 'n\\mapsto 2n', f: (n) => 2 * n, pre: (r) => (r % 2 ? [] : [r / 2]), newc: (r) => (r % 2 ? { i: (r + 1) / 2 } : null), place: (o) => 2 * o.i - 1, aff: [2, 0], adds: 'a coach (passenger $i$ to room $2i-1$)' },
  pp: { btn: '∞ coaches: prime powers', tex: 'n\\mapsto 2^n', f: (n) => cap(n > 60 ? Infinity : 2 ** n), pre: (r) => { const q = primePower(r); return q && q[0] === 2 ? [q[1]] : []; }, newc: (r) => { const q = primePower(r); return q && q[0] !== 2 ? { c: PRIMES.indexOf(q[0]), s: q[1] } : null; }, place: (o) => cap(PRIMES[o.c] ** o.s), adds: 'infinitely many coaches (coach $c$, seat $s$ to room $p_{c+1}^{\\,s}$)' },
  cp: { btn: '∞ coaches: pairing', tex: 'n\\mapsto\\binom{n+1}{2}', f: (n) => cap(tri(n)), pre: (r) => { const [a, s] = unpair(r); return a === 1 ? [s] : []; }, newc: (r) => { const [a, s] = unpair(r); return a > 1 ? { c: a - 1, s } : null; }, place: (o) => cap(pair(o.c + 1, o.s)), adds: 'infinitely many coaches (coach $c$, seat $s$ to room $\\pi(c+1,s)$)' },
  half: { btn: 'n ↦ ⌈n/2⌉ (broken)', tex: 'n\\mapsto\\lceil n/2\\rceil', f: (n) => Math.ceil(n / 2), pre: (r) => [2 * r - 1, 2 * r], newc: () => null, place: () => Infinity, adds: 'nobody — it squeezes the guests together' },
};
const WAVE_COL = ['blue', 'gold', 'orange', 'pink', 'purple', 'teal'];
const WAVE_LET = ['g', 'a', 'b', 'c', 'd', 'e'];
const guestCode = (o) => WAVE_LET[o.w] + (o.c != null ? `${o.c}·${o.s}` : o.i);
const sameGuest = (a, b) => a && b && a.w === b.w && a.i === b.i && a.c === b.c && a.s === b.s;

// ---------- small drawing helpers ----------
/** px → data-unit conversions for a stage (fixed per layout). */
const pxX = (s, p) => p / Math.abs(s.X(1) - s.X(0));
const pxY = (s, p) => p / Math.abs(s.Y(0) - s.Y(1));
function bezier(a, c, b, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }

// ---------- digits (1.4) ----------
const digitsOf = (x, k) => { let m = Math.floor(x * 10 ** k + 1e-7); m = Math.min(m, 10 ** k - 1); return String(m).padStart(k, '0').split('').map(Number); };
const fromDigits = (d) => d.reduce((s, v, j) => s + v * 10 ** -(j + 1), 0);

export default {
  collection: 'logic',
  chapter: 1,
  title: 'Infinity and the paradoxes',
  summary: String.raw`Cantor showed that infinite sets come in different sizes, and that comparing them needs nothing more than bijections and injections. The diagonal trick that separates the countable from the uncountable also produces the paradoxes: Russell’s set, the liar, and the definitions of Berry and Richard. These forced mathematics to say precisely what a set, a sentence and a definition are, and the rest of the course is the answer.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Paradox',
      name: 'Hilbert’s hotel',
      statement: String.raw`A hotel has rooms numbered $1, 2, 3, \dots$, and every room is taken. A finite hotel in this state would have to turn newcomers away, but this one need not:
- **one** newcomer: move the guest in room $n$ to room $n+1$; room $1$ is free;
- **$k$** newcomers: $n\mapsto n+k$ frees rooms $1,\dots,k$;
- a **coach** of infinitely many: $n\mapsto 2n$ frees all the odd rooms, and passenger $i$ takes room $2i-1$;
- **infinitely many coaches**: send guest $n$ to room $2^n$ and seat $s$ of coach $c$ to $p_{c+1}^{\,s}$ ($p_k$ the $k$-th prime), or use Cantor's pairing $\pi:\N\times\N\to\N$ to fill every room.

In set-theoretic terms, each move is an injection $f:\N\to\N$; the newcomers go into $\N\setminus f(\N)$. A composite of injections is an injection, so moves can be repeated forever. The “paradox” is the clash with finite intuition: $\N$ is in bijection with proper subsets of itself, which is exactly Dedekind's definition of an infinite set.`,
      idea: String.raw`Size is measured by one-to-one correspondence (pma-2.3). For a finite set every injection into itself is onto (pigeonhole), so a full finite hotel is stuck. For $\N$ the shift $n\mapsto n+1$ is an injection whose image misses one point, and $n\mapsto 2n$ misses infinitely many. Infinitely many coaches need $\N\times\N$ to be countable (pma-2.12). The prime-power trick is injective but leaves rooms such as $6$ and $10$ empty; Cantor's pairing is a bijection and fills every room.`,
      caption: String.raw`Each column is the hotel after one more move. Press the move buttons to compose up to five moves. Arrows carry every guest to the new room, and newcomers (a new colour per arrival) fill the rooms the move leaves free. Click any room to follow its occupant through all the moves. **∞ coaches: prime powers** leaves rooms empty, and **⌈n/2⌉** puts two guests in one room (red): it is not injective.`,
      deps: ['pma-2.3', 'pma-2.4', 'pma-2.12'],
      see: ['phil-2.8'],
      refs: ['Enderton Ch. 0'],
      credit: 'David Hilbert, 1924 lecture; popularised by George Gamow, 1947',
      tags: ['infinity', 'bijection', 'countability'],
      viz(v) {
        let moves = ['s1', 'd2', 'cp'];
        let traced = { w: 0, i: 1 };
        const MAXM = 5, R = 16;
        for (const [k, M] of Object.entries(HOTEL_MOVES)) v.button(M.btn, () => { if (moves.length < MAXM) moves = [...moves, k]; });
        v.button('undo', () => { moves = moves.slice(0, -1); });
        v.button('reset', () => { moves = []; traced = { w: 0, i: 1 }; });
        const s = v.stage({ x: [0, 100], y: [-18.4, 1.7], axes: false, height: 480, full: true });
        const cx = (t) => 9 + t * 17.6, HW = 3.7;
        let memo = new Map();
        const occ = (t, r) => {
          if (t === 0) return [{ w: 0, i: r }];
          const key = t * 1e7 + r; if (memo.has(key)) return memo.get(key);
          const M = HOTEL_MOVES[moves[t - 1]], out = [];
          for (const n of M.pre(r)) out.push(...occ(t - 1, n));
          const c = M.newc(r); if (c) out.push({ w: t, ...c });
          memo.set(key, out); return out;
        };
        /** room of guest o after move t (Infinity if it left the window of numbers we track) */
        const roomAt = (o, t) => {
          if (t < o.w) return null;
          let r = o.w === 0 ? o.i : HOTEL_MOVES[moves[o.w - 1]].place(o);
          for (let u = o.w + 1; u <= t; u++) r = Number.isFinite(r) ? HOTEL_MOVES[moves[u - 1]].f(r) : Infinity;
          return r;
        };
        s.onClick((x, y) => {
          const t = Math.round((x - 9) / 17.6), r = Math.round(-y);
          if (t < 0 || t > moves.length || r < 1 || r > R || Math.abs(x - cx(t)) > HW + 0.5) return;
          memo = new Map(); const o = occ(t, r); if (o.length) traced = o[0];
        });
        let st = null;
        v.render(() => {
          memo = new Map();
          const m = moves.length;
          if (traced.w > m) traced = { w: 0, i: 1 };
          const bh = 0.39;
          // room numbers
          for (let r = 1; r <= R; r++) s.text(String(r), 3.4, -r, { align: 'right', size: 10.5, color: 'muted' });
          s.text('room', 0.4, 0.85, { align: 'left', size: 10, color: 'muted' });
          // arrows of each move
          for (let t = 1; t <= m; t++) {
            const M = HOTEL_MOVES[moves[t - 1]], x0 = cx(t - 1) + HW, x1 = cx(t) - HW;
            s.tex(M.tex, (x0 + x1) / 2, 0.85, { size: 13, color: 'ink' });
            let gone = 0;
            for (let r = 1; r <= R; r++) {
              if (!occ(t - 1, r).length) continue;
              const fr = M.f(r);
              if (fr <= R) s.arrow(x0 + 0.2, -r, x1 - 0.2, -fr, { color: M === HOTEL_MOVES.half ? 'red' : 'muted', width: 1.1, head: 6, alpha: 0.75 });
              else { gone++; s.line(x0 + 0.2, -r, x0 + 0.2 + (x1 - x0) * 0.55, -r - (R + 0.6 - r) * 0.55, { color: 'faint', width: 1, alpha: 0.8 }); }
            }
            if (gone) s.text(`${gone} → rooms > ${R}`, (x0 + x1) / 2, -R - 0.95, { align: 'center', size: 9.5, color: 'muted' });
          }
          // rooms
          let empty = 0, dbl = 0;
          for (let t = 0; t <= m; t++) {
            if (t === 0) s.text('start', cx(0), 0.85, { align: 'center', size: 11.5, weight: 600, color: 'ink' });
            for (let r = 1; r <= R; r++) {
              const o = occ(t, r), x = cx(t);
              if (!o.length) {
                s.rect(x - HW, -r - bh, x + HW, -r + bh, { color: 'faint', width: 1, dash: [3, 3], radius: 4 });
                s.text('empty', x, -r, { align: 'center', size: 9.5, color: 'faint' });
                if (t === m) empty++;
              } else if (o.length > 1) {
                s.rect(x - HW, -r - bh, x + HW, -r + bh, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.6, radius: 4 });
                s.text(o.slice(0, 2).map(guestCode).join(' + '), x, -r, { align: 'center', size: 9.5, weight: 600, color: 'red' });
                if (t === m) dbl++;
              } else {
                const col = WAVE_COL[o[0].w];
                s.rect(x - HW, -r - bh, x + HW, -r + bh, { fill: col, fillAlpha: o[0].w === t && t > 0 ? 0.4 : 0.16, color: col, width: 1.1, radius: 4 });
                s.text(guestCode(o[0]), x, -r, { align: 'center', size: 10, weight: 600, color: 'ink' });
              }
            }
          }
          // trace one guest through the moves
          let prev = null;
          for (let t = traced.w; t <= m; t++) {
            const r = roomAt(traced, t), x = cx(t);
            if (r != null && r <= R) {
              s.rect(x - HW - 0.35, -r - bh - 0.12, x + HW + 0.35, -r + bh + 0.12, { color: 'gold', width: 2.6, radius: 5 });
              if (prev) s.line(prev[0], prev[1], x - HW - 0.35, -r, { color: 'gold', width: 2.4 });
              prev = [x + HW + 0.35, -r];
            } else {
              const lab = Number.isFinite(r) ? `↓ room ${r}` : '↓ room > 10¹⁵';
              s.text(lab, x, -R - 0.95, { align: 'center', size: 10, weight: 700, color: 'gold' });
              if (prev) s.line(prev[0], prev[1], x - HW, -R - 0.6, { color: 'gold', width: 2.4, dash: [4, 3] });
              prev = null;
            }
          }
          // checks on rooms 1..300 after the last move
          const N = 300, emp = [], dub = [];
          for (let r = 1; r <= N; r++) { const k = occ(m, r).length; if (k === 0) emp.push(r); else if (k > 1) dub.push(r); }
          st = { m, emp, dub, empty, dbl };
        });
        v.readout(() => {
          if (!st) return '';
          v.legend([['blue', 'original guests g1, g2, …', { dot: true }], ...moves.map((k, t) => [WAVE_COL[t + 1], `move ${t + 1}: ${WAVE_LET[t + 1]}…`, { dot: true }]), ['red', 'doubly booked', { dot: true }], ['gold', 'traced guest', { area: true }]]);
          const { m, emp, dub } = st;
          // composite on the original guests
          let comp;
          const affine = moves.every((k) => HOTEL_MOVES[k].aff);
          if (m === 0) comp = 'No moves yet: guest $n$ is in room $n$.';
          else if (affine) {
            let a = 1, b = 0; for (const k of moves) { const [p, q] = HOTEL_MOVES[k].aff; a = p * a; b = p * b + q; }
            comp = `Composite of the ${m} move${m > 1 ? 's' : ''}: original guest $n$ is now in room $${a === 1 ? '' : a}n${b ? ' + ' + b : ''}$.`;
          } else {
            const vals = [1, 2, 3, 4].map((n) => { const r = roomAt({ w: 0, i: n }, m); return Number.isFinite(r) ? r : '\\infty'; });
            comp = `Original guests $1,2,3,4$ are now in rooms $${vals.join(', ')}$.`;
          }
          const arr = moves.map((k, t) => `move ${t + 1} brought ${HOTEL_MOVES[k].adds}`).join('; ');
          let check;
          if (dub.length) check = `**Not injective ✗**: rooms $${dub.slice(0, 5).join(', ')}${dub.length > 5 ? ', \\dots' : ''}$ hold two guests each.`;
          else if (emp.length) check = `Every guest has a room of their own ✓, but ${emp.length} of rooms 1–300 are empty ($${emp.slice(0, 6).join(', ')}, \\dots$): the composite is injective, not onto.`;
          else check = 'Rooms 1–300: every room holds **exactly one** guest ✓ — the composite is a bijection.';
          const tr = `Traced: **${guestCode(traced)}**.`;
          return `${comp} ${check} ${tr}${arr ? ' (' + arr + '.)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Cantor’s theorem: no set maps onto its power set',
      statement: String.raw`For every set $X$ and every function $f: X\to\mathcal P(X)$, the **diagonal set**
$$D=\{x\in X : x\notin f(x)\}$$
is not a value of $f$, so $f$ is not onto. Since $x\mapsto\{x\}$ is one-to-one, $|X|<|\mathcal P(X)|$. Hence $|\N|<|\mathcal P(\N)|<|\mathcal P(\mathcal P(\N))|<\cdots$, and there is no largest cardinality.`,
      idea: String.raw`Suppose $D=f(d)$. Then $d\in D \iff d\notin f(d) \iff d\notin D$, a contradiction. In a table whose row $x$ lists the members of $f(x)$, the set $D$ is the diagonal with every entry flipped, so it disagrees with row $x$ in column $x$. This is pma-2.14 with no reference to digits or sequences. For a finite $X$ with $n$ elements it says $n<2^n$; for $X=\N$ it gives an uncountable set without ever mentioning the reals.`,
      caption: String.raw`Finite $X$: click cells to define $f$; row $x$ is $f(x)$. The gold diagonal, flipped, gives the red row $D$. On the right, $\mathcal P(X)$ is drawn as a lattice; the subsets hit by $f$ are filled and $D$ is ringed in red, never filled. Click a subset in the lattice to make it $f$ of the selected row, or press **aim at D** to set $f(\text{row}) := D$. Then $D$ moves away. Switch to $X=\N$ for maps such as “binary digits”, which hits every finite set and still misses $D=\N$.`,
      deps: ['pma-2.3', 'pma-2.14'],
      see: ['toc-1.5', 'phil-2.10', 'logic-10.4'],
      refs: ['Kunen Ch. I', 'Enderton Ch. 0'],
      credit: 'Georg Cantor, 1891',
      tags: ['cardinality', 'diagonal argument', 'power set'],
      viz(v) {
        const mode = v.select('X =', [{ value: 'fin', label: 'a finite set (click)' }, { value: 'nat', label: '$\\mathbb N$' }], 'fin');
        const ex = v.select('f(n) =', [{ value: 'bin', label: 'binary digits of n − 1' }, { value: 'div', label: 'divisors of n' }, { value: 'low', label: '{m : m < n}' }, { value: 'cop', label: 'coprime to n' }], 'bin');
        const nS = v.slider('$|X|$', 2, 5, 4, { int: true });
        const L = 'abcde';
        let F = [[1, 1, 0, 0, 0], [0, 0, 0, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 0], [1, 0, 0, 1, 1]];
        let sel = 0;
        const rngC = v.rng(7);
        const bAim = v.button('aim f(selected row) at D', () => { const n = nS.value; const D = [...Array(n)].map((_, j) => (F[j][j] ? 0 : 1)); for (let j = 0; j < n; j++) F[sel][j] = D[j]; });
        const bRand = v.button('random f', () => { F = F.map((row) => row.map(() => (rngC() < 0.45 ? 1 : 0))); });
        const bSing = v.button('f(x) = {x}', () => { F = F.map((row, i) => row.map((_, j) => (i === j ? 1 : 0))); });
        const s = v.stage({ x: [0, 100], y: [0, 60], axes: false, height: 400, full: true });
        let G = null; // geometry of the grid for clicks
        const NATF = {
          bin: { tex: 'f(n)=\\{k\\ge1 : \\text{bit } k-1 \\text{ of } n-1 \\text{ is } 1\\}', has: (n, k) => (((n - 1) >> (k - 1)) & 1) === 1, D: 'D = \\mathbb N', why: String.raw`$n-1<2^{\,n-1}$, so bit $n-1$ of $n-1$ is $0$: $n\notin f(n)$ for every $n$, hence $D=\N$. This $f$ hits **every finite subset** of $\N$ exactly once, yet misses $\N$ itself.` },
          div: { tex: 'f(n)=\\{d : d \\mid n\\}', has: (n, k) => n % k === 0, D: 'D = \\varnothing', why: String.raw`$n\mid n$, so $n\in f(n)$ for every $n$ and $D=\varnothing$. Every $f(n)$ contains $1$, so $\varnothing$ is missed.` },
          low: { tex: 'f(n)=\\{m : m<n\\}', has: (n, k) => k < n, D: 'D = \\mathbb N', why: String.raw`$n\notin\{m:m<n\}$, so $D=\N$, which is infinite while each $f(n)$ is finite.` },
          cop: { tex: 'f(n)=\\{m : \\gcd(m,n)=1\\}', has: (n, k) => { let a = n, b = k; while (b) [a, b] = [b, a % b]; return a === 1; }, D: 'D = \\{2,3,4,\\dots\\}', why: String.raw`$\gcd(n,n)=n$, so $n\in f(n)$ only for $n=1$, and $D=\{2,3,4,\dots\}$. $D\ne f(1)=\N$ at $1$, and $D\ne f(n)$ for $n\ge2$ at $n$ itself.` },
        };
        s.onClick((x, y) => {
          if (mode.value !== 'fin' || !G) return;
          const { x0, y0, cw, ch, n } = G;
          const j = Math.floor((x - x0) / cw), i = Math.floor((y0 - y) / ch);
          if (i >= 0 && i < n && j >= 0 && j < n) { F[i][j] ^= 1; sel = i; return; }
          if (i >= 0 && i < n && x < x0 && x > x0 - 9) { sel = i; return; }
          // lattice node?
          for (const nd of G.nodes) if (Math.hypot((x - nd.x) / pxX(s, 1), (y - nd.y) / pxY(s, 1)) < nd.rpx + 3) { for (let j2 = 0; j2 < n; j2++) F[sel][j2] = (nd.mask >> j2) & 1; return; }
        });
        let st = null;
        v.render(() => {
          const fin = mode.value === 'fin';
          ex.el.hidden = fin; nS.el.hidden = !fin; bAim.hidden = !fin; bRand.hidden = !fin; bSing.hidden = !fin;
          if (fin) {
            const n = nS.value; if (sel >= n) sel = 0;
            const D = [...Array(n)].map((_, j) => (F[j][j] ? 0 : 1));
            const cpx = Math.min(46, 300 / (n + 1.6)), cw = pxX(s, cpx), ch = pxY(s, cpx);
            const x0 = 13, y0 = 51;
            G = { x0, y0, cw, ch, n, nodes: [] };
            s.text('contains', x0 - 1.2, y0 + ch * 0.45, { align: 'right', size: 10.5, color: 'muted' });
            for (let j = 0; j < n; j++) s.text(L[j], x0 + (j + 0.5) * cw, y0 + ch * 0.45, { align: 'center', size: 12.5, weight: 600, color: 'muted', math: true });
            for (let i = 0; i < n; i++) {
              s.text(`f(${L[i]})`, x0 - 1.2, y0 - (i + 0.5) * ch, { align: 'right', size: 13, color: i === sel ? 'accent' : 'ink', weight: i === sel ? 700 : 500, math: true });
              if (i === sel) s.rect(x0 - 8.6, y0 - (i + 1) * ch + 0.4, x0 + n * cw + 0.3, y0 - i * ch - 0.4, { color: 'accent', width: 1.4, radius: 5, dash: [4, 3] });
              for (let j = 0; j < n; j++) {
                const on = F[i][j], X0 = x0 + j * cw, Y0 = y0 - (i + 1) * ch;
                s.rect(X0 + 0.25, Y0 + 0.3, X0 + cw - 0.25, Y0 + ch - 0.3, { fill: on ? 'blue' : 'panel', fillAlpha: on ? 0.55 : 1, color: i === j ? 'gold' : 'grid', width: i === j ? 2.6 : 1, radius: 4 });
                s.text(on ? '∈' : '∉', X0 + cw / 2, Y0 + ch / 2, { align: 'center', size: 15, color: on ? 'panel' : 'faint', weight: 600, halo: false });
              }
            }
            // D row
            const yD = y0 - (n + 0.35) * ch;
            s.text('D =', x0 - 1.2, yD - ch / 2, { align: 'right', size: 13, color: 'red', weight: 700, math: true });
            for (let j = 0; j < n; j++) {
              const X0 = x0 + j * cw;
              s.rect(X0 + 0.25, yD - ch + 0.3, X0 + cw - 0.25, yD - 0.3, { fill: D[j] ? 'red' : 'panel', fillAlpha: D[j] ? 0.5 : 1, color: 'red', width: 1.6, radius: 4 });
              s.text(D[j] ? '∈' : '∉', X0 + cw / 2, yD - ch / 2, { align: 'center', size: 15, color: D[j] ? 'panel' : 'red', weight: 600, halo: false });
              s.arrow(X0 + cw / 2, y0 - (j + 1) * ch + 0.5, X0 + cw / 2, yD - 0.1, { color: 'gold', width: 1, dash: [2, 3], head: 5, alpha: 0.7 });
            }
            s.text('flip the diagonal', x0 + n * cw + 1, yD - ch / 2, { size: 10.5, color: 'gold' });
            // lattice P(X)
            const lx0 = 54, lx1 = 98, ly0 = 5, ly1 = 54, N2 = 1 << n;
            const byRank = [...Array(n + 1)].map(() => []);
            for (let m = 0; m < N2; m++) { let c = 0; for (let b = m; b; b >>= 1) c += b & 1; byRank[c].push(m); }
            const pos = new Array(N2), rpx = n >= 5 ? 10.5 : 13;
            byRank.forEach((row, rk) => row.forEach((m, k) => { pos[m] = [lx0 + ((k + 0.5) / row.length) * (lx1 - lx0), ly0 + (rk / n) * (ly1 - ly0)]; }));
            for (let m = 0; m < N2; m++) for (let b = 0; b < n; b++) if (!((m >> b) & 1)) { const q = m | (1 << b); s.line(pos[m][0], pos[m][1], pos[q][0], pos[q][1], { color: 'grid', width: 1 }); }
            const fmask = F.slice(0, n).map((row) => row.slice(0, n).reduce((a, bit, j) => a | (bit << j), 0));
            const Dmask = D.reduce((a, bit, j) => a | (bit << j), 0);
            const hit = new Map(); fmask.forEach((m, i) => hit.set(m, [...(hit.get(m) || []), L[i]]));
            for (let m = 0; m < N2; m++) {
              const [x, y] = pos[m], lab = m ? [...Array(n)].map((_, j) => ((m >> j) & 1 ? L[j] : '')).join('') : '∅';
              const h = hit.get(m);
              if (m === Dmask) s.dot(x, y, { r: rpx + 4.5, hollow: true, width: 2.8, color: 'red' });
              s.dot(x, y, { r: rpx, color: h ? 'blue' : 'faint', hollow: !h, width: 1.2 });
              s.text(lab, x, y, { align: 'center', size: lab.length > 3 ? 8.5 : 10, weight: 600, color: h ? 'panel' : 'muted', halo: false });
              if (h) s.text(h.map((c) => `f(${c})`).join(','), x, y + pxY(s, rpx + 8), { align: 'center', size: 9.5, color: 'blue', weight: 600 });
              if (m === Dmask) s.text('D', x + pxX(s, rpx + 7), y - pxY(s, rpx + 3), { size: 12.5, weight: 700, color: 'red' });
              G.nodes.push({ x, y, mask: m, rpx });
            }
            s.text(`𝒫(X): ${N2} subsets`, (lx0 + lx1) / 2, 58.2, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            st = { fin, n, D, F: F.slice(0, n).map((r) => r.slice(0, n)), hits: hit.size, N2 };
          } else {
            const K = 14, f = NATF[ex.value];
            const cpx = 21, cw = pxX(s, cpx), ch = pxY(s, cpx), x0 = 9, y0 = 55;
            for (let k = 1; k <= K; k++) s.text(String(k), x0 + (k - 0.5) * cw, y0 + ch * 0.45, { align: 'center', size: 9.5, color: 'muted' });
            const D = [];
            for (let n = 1; n <= K; n++) {
              s.text(`f(${n})`, x0 - 0.8, y0 - (n - 0.5) * ch, { align: 'right', size: 10.5, color: 'ink', math: true });
              for (let k = 1; k <= K; k++) {
                const on = f.has(n, k), X0 = x0 + (k - 1) * cw, Y0 = y0 - n * ch;
                s.rect(X0 + 0.12, Y0 + 0.15, X0 + cw - 0.12, Y0 + ch - 0.15, { fill: on ? 'blue' : 'panel', fillAlpha: on ? 0.5 : 1, color: n === k ? 'gold' : 'grid', width: n === k ? 2.2 : 0.8, radius: 2 });
              }
              D.push(!f.has(n, n));
            }
            const yD = y0 - (K + 0.4) * ch;
            s.text('D', x0 - 0.8, yD - ch / 2, { align: 'right', size: 12, color: 'red', weight: 700, math: true });
            for (let k = 1; k <= K; k++) { const X0 = x0 + (k - 1) * cw; s.rect(X0 + 0.12, yD - ch + 0.15, X0 + cw - 0.12, yD - 0.15, { fill: D[k - 1] ? 'red' : 'panel', fillAlpha: D[k - 1] ? 0.5 : 1, color: 'red', width: 1.2, radius: 2 }); }
            s.text('…', x0 + K * cw + 0.8, y0 - K * ch / 2, { size: 14, color: 'muted' });
            // first place where D and f(n) disagree (always at some k ≤ n): marked in each row, checked for n ≤ 2000
            const Dm = (k) => !f.has(k, k);
            const first = (n) => { for (let k = 1; k <= n; k++) if (f.has(n, k) !== Dm(k)) return k; return null; };
            for (let n = 1; n <= K; n++) { const k = first(n), X0 = x0 + (k - 1) * cw, Y0 = y0 - n * ch; s.rect(X0 + 0.12, Y0 + 0.15, X0 + cw - 0.12, Y0 + ch - 0.15, { color: 'red', width: 2.2, radius: 2 }); }
            let maxK = 0, okAll = true; for (let n = 1; n <= 2000; n++) { const k = first(n); if (k == null) okAll = false; else maxK = Math.max(maxK, k); }
            s.tex(f.tex, 72, 50, { size: 15 });
            s.tex(f.D, 72, 41, { size: 18, color: 'red' });
            s.text('red outline: the first element on which', 72, 30, { align: 'center', size: 12, color: 'red' });
            s.text('f(n) and D disagree — never later than n', 72, 26.6, { align: 'center', size: 12, color: 'red' });
            s.text(okAll ? 'checked for every n ≤ 2000 ✓' : 'a row agrees with D ✗', 72, 20, { align: 'center', size: 12, color: okAll ? 'green' : 'red', weight: 600 });
            st = { fin, D, K, f };
          }
        });
        v.legend([['blue', 'member of $f(x)$', { dot: true }], ['gold', 'diagonal: is $x\\in f(x)$?', { dot: true }], ['red', '$D=\\{x : x\\notin f(x)\\}$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.fin) return `${st.f.why} In every case $D$ and $f(n)$ disagree about $n$ itself (if not earlier), so $D$ is not in the list $f(1), f(2), \\dots$ ✓: no map $\\mathbb N\\to\\mathcal P(\\mathbb N)$ is onto.`;
          const { n, D, F, hits, N2 } = st;
          const set = (bits) => (bits.some(Boolean) ? `\\{${bits.map((b, j) => (b ? L[j] : null)).filter(Boolean).join(',')}\\}` : '\\varnothing');
          const w = F.map((row, i) => `$D\\ne f(${L[i]})$ at $${L[i]}$`).join(', ');
          return `$f$ hits ${hits} of the $2^{${n}} = ${N2}$ subsets. $D = ${set(D)}$: ${w} ✓. At least $2^n-n = ${N2 - n}$ subsets are always missed, and $D$ is always one of them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Schröder–Bernstein theorem',
      statement: String.raw`If there are one-to-one maps $f:A\to B$ and $g:B\to A$, then there is a bijection $h:A\to B$. So $|A|\le|B|$ and $|B|\le|A|$ together give $|A|=|B|$. No choice principle is needed.`,
      idea: String.raw`Treat $A$ and $B$ as disjoint and follow each point backwards: $a$ came from $g^{-1}(a)\in B$ if it exists, which came from $f^{-1}$ of that, and so on. Every point lies on exactly one **chain**, of one of four kinds: a finite cycle, a chain infinite in both directions, a chain that starts at a point of $A$ outside $g(B)$, or one that starts at a point of $B$ outside $f(A)$. Put $h=f$ on the first three kinds and $h=g^{-1}$ on the last. On every chain this pairs the $A$-points with the $B$-points one to one, so $h$ is a bijection.`,
      caption: String.raw`Top: $f$ (solid arrows down) and $g$ (dashed arrows up) between two copies of $\N$ or $\Z$. Every point is coloured by the kind of its chain; click a point to highlight its chain. Bottom: the bijection $h$ assembled from it, with the check that every point of $B$ is hit exactly once. In the **[0,1] vs [0,1)** example, drag the point $x$: only the powers $1, \tfrac12, \tfrac14, \dots$ move, and $h$ is the identity everywhere else.`,
      deps: ['pma-2.3'],
      see: ['logic-10.1'],
      refs: ['Kunen Ch. I'],
      credit: 'Dedekind 1887 (unpublished); Schröder 1896; Bernstein 1897',
      tags: ['cardinality', 'bijection', 'injection'],
      viz(v) {
        const PRE = {
          shift: { lab: 'ℕ: f = g = n + 1', lo: 0, hi: 15, f: (n) => n + 1, g: (n) => n + 1, finv: (m) => (m >= 1 ? m - 1 : null), ginv: (m) => (m >= 1 ? m - 1 : null), ftex: 'f(n)=n+1', gtex: 'g(n)=n+1', dom: (n) => n >= 0 },
          dbl: { lab: 'ℕ: f = g = 2n', lo: 0, hi: 15, f: (n) => 2 * n, g: (n) => 2 * n, finv: (m) => (m % 2 === 0 ? m / 2 : null), ginv: (m) => (m % 2 === 0 ? m / 2 : null), ftex: 'f(n)=2n', gtex: 'g(n)=2n', dom: (n) => n >= 0 },
          mix: {
            lab: 'ℤ: all four kinds', lo: -9, hi: 9,
            f: (n) => (n >= 0 ? n + 1 : n === -1 ? -2 : n === -2 ? -1 : n),
            g: (n) => (n >= 0 ? n + 1 : n === -1 || n === -2 ? n : n === -4 ? -3 : n % 2 !== 0 ? n - 2 : n + 2),
            finv: (m) => (m >= 1 ? m - 1 : m === 0 ? null : m === -1 ? -2 : m === -2 ? -1 : m),
            ginv: (m) => (m >= 1 ? m - 1 : m === 0 ? null : m === -1 || m === -2 ? m : m === -3 ? -4 : m % 2 !== 0 ? m + 2 : m - 2),
            ftex: 'f(n)=n+1\\ (n\\ge0),\\quad f(-1)=-2,\\ f(-2)=-1,\\quad f(n)=n\\ (n\\le-3)', gtex: 'g(n)=n+1\\ (n\\ge0),\\ \\ g(n)=n\\ (n=-1,-2),\\ \\ g(-4)=-3,\\ \\ g(n)=n\\mp2\\ (n\\le-3 \\text{ odd}\\,/\\,n\\le-6\\text{ even})', dom: () => true,
          },
          unit: { lab: '[0,1] vs [0,1)' },
        };
        const pre = v.select('', Object.entries(PRE).map(([value, P]) => ({ value, label: P.lab })), 'mix');
        const top = v.stage({ x: [-10, 10], y: [-0.75, 1.95], axes: false, height: 300, full: true });
        const bot = v.stage({ x: [-10, 10], y: [-0.6, 1.6], axes: false, height: 200, full: true });
        const hx = top.handle(0.37, 1.2, { color: 'accent', label: 'x', constrain: (x) => { let xx = v.M.clamp(x, 0, 1); for (let k = 0; k <= 7; k++) if (Math.abs(xx - 2 ** -k) < 0.012) xx = 2 ** -k; if (xx < 0.008) xx = 0; return [xx, 1.2]; } });
        const TYPE = { A: ['blue', 'starts in A'], B: ['orange', 'starts in B'], Z: ['purple', 'two-sided (ℤ-chain)'], C: ['green', 'cycle'] };
        /** chain type and canonical id of the point (side, n) */
        const chainOf = (P, side, n) => {
          let sd = side, m = n;
          for (let k = 0; k < 400; k++) {
            const p = sd === 'A' ? P.ginv(m) : P.finv(m);
            if (p === null) return { type: sd, id: sd + m };
            sd = sd === 'A' ? 'B' : 'A'; m = p;
            if (sd === side && m === n) return { type: 'C', id: 'C' + n };
          }
          return { type: 'Z', id: 'Z' };
        };
        let selId = 'B0';
        let last = null;
        top.onClick((x, y) => {
          const P = PRE[pre.value]; if (!P.f) return;
          const n = Math.round(x); if (n < P.lo || n > P.hi) return;
          const side = y > 0.6 ? 'A' : 'B';
          selId = chainOf(P, side, n).id;
        });
        let st = null;
        v.render(() => {
          const key = pre.value, P = PRE[key];
          if (last !== key) {
            last = key;
            if (P.f) { top.setView([P.lo - 0.8, P.hi + 0.8], [-0.75, 1.95]); bot.setView([P.lo - 0.8, P.hi + 0.8], [-0.6, 1.6]); selId = key === 'dbl' ? 'B1' : 'B0'; }
            else { top.setView([-0.1, 1.1], [-0.75, 1.95]); bot.setView([-0.12, 1.12], [-0.14, 1.12]); }
          }
          hx.visible = !P.f;
          if (P.f) {
            const yA = 1.2, yB = 0, d = 0.13;
            top.text('A', P.lo - 0.55, yA, { size: 15, weight: 700, color: 'ink', math: true });
            top.text('B', P.lo - 0.55, yB, { size: 15, weight: 700, color: 'ink', math: true });
            const ch = {};
            for (let n = P.lo; n <= P.hi; n++) { ch['A' + n] = chainOf(P, 'A', n); ch['B' + n] = chainOf(P, 'B', n); }
            const dimmed = (c) => selId && c.id !== selId;
            top.clip(() => {
              for (let n = P.lo; n <= P.hi; n++) {
                const ca = ch['A' + n], cb = ch['B' + n];
                const fa = P.f(n), gb = P.g(n);
                top.arrow(n, yA - d, fa, yB + d, { color: TYPE[ca.type][0], width: dimmed(ca) ? 1.1 : 2.4, alpha: dimmed(ca) ? 0.45 : 0.95, head: 7 });
                const mid = [(n + gb) / 2 + 0.28, (yA + yB) / 2];
                const pts = []; for (let k = 0; k <= 20; k++) pts.push(bezier([n, yB + d], mid, [gb, yA - d], k / 20));
                top.path(pts, { color: TYPE[cb.type][0], width: dimmed(cb) ? 1.1 : 2.2, alpha: dimmed(cb) ? 0.45 : 0.9, dash: [5, 4] });
                const e = pts[20], e2 = pts[18]; top.arrow(e2[0], e2[1], e[0], e[1], { color: TYPE[cb.type][0], width: dimmed(cb) ? 1.1 : 2.2, alpha: dimmed(cb) ? 0.45 : 0.9, head: 7 });
              }
            });
            for (let n = P.lo; n <= P.hi; n++) for (const [side, y] of [['A', yA], ['B', yB]]) {
              const c = ch[side + n], col = TYPE[c.type][0], stop = c.id === side + n && (c.type === 'A' || c.type === 'B');
              if (stop) top.dot(n, y, { r: 11.5, hollow: true, width: 1.8, color: col, alpha: dimmed(c) ? 0.45 : 1 });
              top.dot(n, y, { r: stop ? 7.5 : 6.5, color: col, alpha: dimmed(c) ? 0.45 : 1 });
              top.text(`${side === 'A' ? 'a' : 'b'}${sub(Math.abs(n))}`.replace(/^([ab])/, n < 0 ? '$1₋' : '$1'), n, y + (side === 'A' ? 0.3 : -0.3), { align: 'center', size: 10, color: dimmed(c) ? 'faint' : 'ink' });
            }
            top.text('…', P.hi + 0.6, 0.6, { align: 'center', size: 15, color: 'muted' });
            if (P.lo < 0) top.text('…', P.lo - 0.1, 0.6, { align: 'center', size: 15, color: 'muted' });
            top.tex(P.ftex, (P.lo + P.hi) / 2, 1.78, { size: 12.5, color: 'muted' });
            top.tex(P.gtex, (P.lo + P.hi) / 2, -0.6, { size: 12.5, color: 'muted' });
            // bottom: h
            const h = (n) => (ch['A' + n] ? ch['A' + n] : chainOf(P, 'A', n)).type === 'B' ? P.ginv(n) : P.f(n);
            bot.text('A', P.lo - 0.55, 1, { size: 15, weight: 700, color: 'ink', math: true });
            bot.text('B', P.lo - 0.55, 0, { size: 15, weight: 700, color: 'ink', math: true });
            bot.clip(() => {
              for (let n = P.lo; n <= P.hi; n++) {
                const c = ch['A' + n], m = h(n);
                bot.arrow(n, 1 - 0.12, m, 0.12, { color: TYPE[c.type][0], width: dimmed(c) ? 1.4 : 2.8, alpha: dimmed(c) ? 0.5 : 1, head: 8, dash: c.type === 'B' ? [6, 3] : null });
              }
            });
            for (let n = P.lo; n <= P.hi; n++) { bot.dot(n, 1, { r: 5, color: TYPE[ch['A' + n].type][0] }); bot.dot(n, 0, { r: 5, color: TYPE[ch['B' + n].type][0] }); }
            bot.text('h = f   (solid)        h = g⁻¹   (dashed, chains that start in B)', (P.lo + P.hi) / 2, 1.42, { align: 'center', size: 11, color: 'muted' });
            // honest check: preimage counts over a wide range
            const cnt = new Map(), W = 600, lo = P.dom(-1) ? -W : 0;
            for (let n = lo; n <= W; n++) { const m = (chainOf(P, 'A', n).type === 'B' ? P.ginv(n) : P.f(n)); cnt.set(m, (cnt.get(m) || 0) + 1); }
            let bad = 0; for (let m = P.lo; m <= P.hi; m++) if (cnt.get(m) !== 1) bad++;
            const kinds = new Set(Object.values(ch).map((c) => c.type));
            const selC = Object.values(ch).find((c) => c.id === selId);
            st = { unit: false, bad, kinds, selC, P };
          } else {
            // [0,1] → [0,1): f(x) = x/2, g = inclusion
            const yA = 1.2, yB = 0, x = hx.x;
            top.line(0, yA, 1, yA, { color: 'ink', width: 2 }); top.line(0, yB, 1, yB, { color: 'ink', width: 2 });
            top.dot(0, yA, { r: 4, color: 'ink' }); top.dot(1, yA, { r: 4, color: 'ink' }); top.dot(0, yB, { r: 4, color: 'ink' }); top.dot(1, yB, { r: 4, hollow: true, color: 'ink' });
            top.text('A = [0, 1]', -0.08, yA + 0.32, { size: 12, weight: 600, color: 'ink' });
            top.text('B = [0, 1)', -0.08, yB - 0.34, { size: 12, weight: 600, color: 'ink' });
            for (const t of [0, 0.25, 0.5, 0.75, 1]) { top.text(String(t), t, yA + 0.17, { align: 'center', size: 9.5, color: 'muted' }); top.text(String(t), t, yB - 0.17, { align: 'center', size: 9.5, color: 'muted' }); }
            top.tex('f(x)=x/2', 0.88, 0.75, { size: 13, color: 'muted' }); top.tex('g(y)=y', 0.88, 0.45, { size: 13, color: 'muted' });
            // classify x
            const dy = x > 0 && Number.isInteger(Math.log2(1 / x)) ? Math.log2(1 / x) : null;
            const type = x === 0 ? 'C' : dy !== null ? 'A' : 'B';
            const col = TYPE[type][0];
            // the chain: back to its start, forward 7 steps
            const back = []; let side = 'A', val = x;
            for (let k = 0; k < 60; k++) {
              if (side === 'A') { if (val >= 1) break; back.unshift(['B', val]); side = 'B'; }
              else { if (2 * val > 1) break; back.unshift(['A', 2 * val]); side = 'A'; val = 2 * val; }
              if (val === 0) break;
            }
            const chain = [...back, ['A', x]]; side = 'A'; val = x;
            for (let k = 0; k < 8; k++) { if (side === 'A') { val /= 2; side = 'B'; } else side = 'A'; chain.push([side, val]); }
            const Y = (sd) => (sd === 'A' ? yA : yB);
            if (type !== 'A') for (let k = 0; k < 7; k++) { const p = 2 ** -k; top.arrow(p, yA - 0.08, p / 2, yB + 0.08, { color: 'blue', width: 1, alpha: 0.3, head: 5 }); top.dot(p, yA, { r: 3, color: 'blue', alpha: 0.5 }); }
            for (let k = 0; k + 1 < chain.length; k++) {
              const [s1, v1] = chain[k], [s2, v2] = chain[k + 1];
              top.arrow(v1, Y(s1) + (s1 === 'A' ? -0.08 : 0.08), v2, Y(s2) + (s2 === 'A' ? -0.08 : 0.08), { color: col, width: 1.8, head: 6, dash: s1 === 'B' ? [5, 4] : null, alpha: k < back.length + 3 ? 1 : 0.5 });
            }
            for (const [sd, vv] of chain) top.dot(vv, Y(sd), { r: 4.5, color: col });
            const [s0, v0] = chain[0];
            if (type !== 'C') { top.dot(v0, Y(s0), { r: 9, hollow: true, width: 2, color: col }); top.dot(v0, Y(s0), { r: 4.5, color: col }); top.text(`chain starts here (${s0 === 'A' ? 'in A, not in g(B)' : 'in B, not in f(A)'})`, Math.min(v0, 0.72), Y(s0) + (s0 === 'A' ? 0.5 : -0.52), { size: 10.5, color: col, weight: 600, align: 'left' }); }
            // bottom: the graph of h
            bot.line(0, 0, 1, 0, { color: 'faint' }); bot.line(0, 0, 0, 1, { color: 'faint' });
            for (const t of [0, 0.5, 1]) { bot.text(String(t), t, -0.07, { align: 'center', size: 10, color: 'muted' }); bot.text(String(t), -0.035, t, { align: 'right', size: 10, color: 'muted' }); }
            bot.line(0, 0, 1, 1, { color: 'orange', width: 2.2 });
            for (let k = 0; k <= 7; k++) { const p = 2 ** -k; bot.dot(p, p, { r: 3.4, hollow: true, color: 'orange' }); bot.dot(p, p / 2, { r: 4, color: 'blue' }); }
            bot.dot(0, 0, { r: 4.5, color: 'green' });
            const hxv = type === 'A' ? x / 2 : x;
            bot.line(x, 0, x, hxv, { color: 'accent', dash: [3, 3] }); bot.dot(x, hxv, { r: 6, color: 'accent', label: 'h(x)', labelPos: 'se' });
            bot.text('graph of h: [0,1] → [0,1):  h(2⁻ᵏ) = 2⁻ᵏ⁻¹ (blue), h(x) = x otherwise (orange)', 0.5, 1.07, { align: 'center', size: 11, color: 'muted' });
            st = { unit: true, x, type, hxv, dy };
          }
        });
        v.legend(Object.values(TYPE).map(([c, l]) => [c, l, { dot: true }]));
        v.readout(() => {
          if (!st) return '';
          if (st.unit) {
            const { x, type, hxv, dy } = st;
            if (type === 'C') return '$x=0$: $f(0)=0=g(0)$, a cycle of length 2, so $h(0)=f(0)=0$.';
            if (type === 'A') return `$x=2^{-${dy}}$ lies on the chain $1\\to\\tfrac12\\to\\tfrac14\\to\\cdots$, which starts at $1\\in A\\setminus g(B)$; so $h(x)=f(x)=${v.fmt(hxv, 6)}$. These points shift down one place, making room for $1$.`;
            let b = x; while (2 * b <= 1) b *= 2;
            return `$x=${v.fix(x, 4)}$ lies on a chain that starts at $${v.fix(b, 4)}\\in B\\setminus f(A)=(\\tfrac12,1)$, so $h(x)=g^{-1}(x)=x$. Only the powers of $\\tfrac12$ move, and $h$ is a bijection $[0,1]\\to[0,1)$ ✓.`;
          }
          const { bad, kinds, selC, P } = st;
          const ks = [...kinds].map((k) => TYPE[k][1]).join(', ');
          const sel = selC ? ` Highlighted: a chain that ${TYPE[selC.type][1].replace('starts', 'starts')}.` : '';
          return `${bad === 0 ? 'Every point of' : `${bad} points of`} $B$ in view ${bad === 0 ? 'has **exactly one** preimage under $h$ ✓' : 'are not hit exactly once ✗'} (checked over ${P.dom(-1) ? '$|n|\\le 600$' : '$0\\le n\\le600$'}). Chain kinds present: ${ks}.${sel}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'The continuum: |ℝ| = |P(ℕ)| = |ℝ²|',
      statement: String.raw`There are bijections between $\R$, the power set $\mathcal P(\N)$, and the plane $\R^2$; all three have the cardinality $\mathfrak c=2^{\aleph_0}$ of the continuum. More generally $|\R^k|=|\R|$ for every $k\ge1$. A line, a square and a cube have the same number of points.`,
      idea: String.raw`By Schröder–Bernstein (1.3) it suffices to inject each set into the other, and $\R$ may be replaced by $[0,1)$. For $[0,1)^2\to[0,1)$, **interleave the decimal digits**: $(0.x_1x_2\ldots,\ 0.y_1y_2\ldots)\mapsto 0.x_1y_1x_2y_2\ldots$, always using the expansion that does not end in $9$s. This map is one-to-one but not onto, since $0.0909\ldots=\tfrac1{11}$ would need $y=0.999\ldots$. That is why Schröder–Bernstein, with $z\mapsto(z,0)$ going back, is needed. For $\mathcal P(\N)$, send $S$ to $\sum_{n\in S}2\cdot3^{-n-1}$, a point of the Cantor set; ternary digits $0,2$ are unique, so this is one-to-one. Going back, binary digits send $[0,1)$ into $\mathcal P(\N)$ one-to-one (pma-2.14).`,
      caption: String.raw`**Interleave**: drag $P$ in the square or $z$ on the line; each moves the other. A $0.1$-cell of the square (orange) corresponds to an interval of length $0.01$, and a $0.01$-cell (red) to one of length $10^{-4}$; the lower rows magnify each in turn. **0.0999… = 0.1000…**: $x$ snaps to tenths, whose two expansions would give two different $z$; the 9s version and $\tfrac1{11}$ are never hit. **𝒫(ℕ) ⇄ [0,1]**: click the numbers to build $S$ and drag $x$.`,
      deps: ['logic-1.3', 'pma-2.14'],
      see: ['logic-10.5', 'pma-2.44'],
      refs: ['Kunen Ch. I'],
      credit: 'Georg Cantor, 1877–1878',
      tags: ['cardinality', 'continuum', 'decimal expansions'],
      viz(v) {
        const mode = v.select('', [{ value: 'int', label: 'interleave ℝ² → ℝ' }, { value: 'nine', label: '0.0999… = 0.1000…' }, { value: 'pn', label: '𝒫(ℕ) ⇄ [0,1]' }], 'int');
        const sq = v.stage({ x: [-0.06, 1.04], y: [-0.08, 1.04], equal: true, axes: false, height: 360, weight: 0.8, minWidth: 250 });
        const ln = v.stage({ x: [-0.06, 1.06], y: [0.35, 6.45], axes: false, height: 360, weight: 1.35 });
        const K = 6;
        const P = sq.handle(0.314159, 0.271828, { color: 'accent', label: 'P', r: 5, constrain: (x, y) => [v.M.clamp(x, 0, 0.999999), v.M.clamp(y, 0, 0.999999)] });
        const Zh = ln.handle(0.3, 4.02, { color: 'accent', label: 'z', r: 6, constrain: (x) => [v.M.clamp(x, 0, 0.999999999), 4.02] });
        const Bx = ln.handle(0.65, 1.15, { color: 'teal', label: 'x', constrain: (x) => [v.M.clamp(x, 0, 0.9999), 1.15] });
        let S = new Set([0, 2, 3, 7]);
        let src = 'P';
        P.onDrag = () => { src = 'P'; }; Zh.onDrag = () => { src = 'Z'; };
        const chip = (n) => [0.12 + (n % 4) * 0.25, 0.83 - Math.floor(n / 4) * 0.16];
        sq.onClick((x, y) => { if (mode.value !== 'pn') return; for (let n = 0; n < 12; n++) { const [cx, cy] = chip(n); if (Math.hypot(x - cx, y - cy) < 0.07) { if (S.has(n)) S.delete(n); else S.add(n); } } });
        let st = null;
        /** digits at columns pos(j) of a fixed grid (so x-digits sit over the even places of z, y-digits over the odd ones) */
        const digitRow = (label, ds, y, cols, pos = (j) => j) => {
          ln.text(label, 0.0, y, { size: 13, color: 'ink', weight: 600 });
          ds.forEach((d, j) => ln.text(String(d), 0.16 + pos(j) * 0.052, y, { align: 'center', size: 13.5, weight: 600, color: cols[j] || 'ink' }));
        };
        /** a ruler row: the interval [lo, lo + w] drawn over [0, 1] at height y */
        const ruler = (lo, w, y, dec) => {
          ln.line(0, y, 1, y, { color: 'ink', width: 1.6 });
          for (let k = 0; k <= 10; k++) {
            ln.line(k / 10, y - 0.07, k / 10, y + 0.07, { color: 'muted', width: 1 });
            if (k % 5 === 0) ln.text((lo + (w * k) / 10).toFixed(dec), k / 10, y - 0.23, { align: 'center', size: 9.5, color: 'muted' });
          }
        };
        v.render(() => {
          const md = mode.value;
          Zh.visible = md !== 'pn'; Bx.visible = md === 'pn'; P.visible = md !== 'pn';
          if (md === 'pn') {
            // chips for S, and for b(x)
            sq.text('S ⊆ ℕ  (click):', 0, 0.98, { size: 12, weight: 600, color: 'ink' });
            for (let n = 0; n < 12; n++) { const [cx, cy] = chip(n), on = S.has(n); sq.dot(cx, cy, { r: 14, color: 'blue', hollow: !on }); sq.text(String(n), cx, cy, { align: 'center', size: 11.5, weight: 600, color: on ? 'panel' : 'blue', halo: false }); }
            const xb = Bx.x, bits = []; let t = xb; for (let k = 0; k < 12; k++) { t *= 2; const b = Math.floor(t + 1e-12); bits.push(b); t -= b; }
            sq.text('b(x) = {n : binary digit n+1 of x is 1}:', 0, 0.38, { size: 11, weight: 600, color: 'teal' });
            for (let n = 0; n < 12; n++) { const [cx] = chip(n), cy = 0.25 - Math.floor(n / 4) * 0.105; sq.dot(cx, cy, { r: 9.5, color: 'teal', hollow: !bits[n] }); sq.text(String(n), cx, cy, { align: 'center', size: 9.5, weight: 600, color: bits[n] ? 'panel' : 'teal', halo: false }); }
            // Cantor set + c(S)
            const yC = 4.5;
            ln.text('c(S) = Σₙ∈S 2·3⁻ⁿ⁻¹ lands in the Cantor set', 0, 6.0, { size: 12, weight: 600, color: 'blue' });
            v.M.cantorIntervals(6).forEach(([a, b]) => ln.rect(a, yC - 0.08, b, yC + 0.08, { fill: 'blue', fillAlpha: 0.35, stroke: false }));
            for (let lev = 1; lev <= 4; lev++) v.M.cantorIntervals(lev).forEach(([a, b]) => ln.rect(a, yC + 0.15 + lev * 0.13, b, yC + 0.2 + lev * 0.13, { fill: 'faint', fillAlpha: 0.6, stroke: false }));
            let c = 0; for (const n of S) c += 2 * 3 ** -(n + 1);
            ln.line(c, yC - 0.3, c, yC + 0.8, { color: 'blue', width: 2 }); ln.dot(c, yC, { r: 6, color: 'blue' });
            ln.text(`c(S) = 0.${[...Array(10)].map((_, n) => (S.has(n) ? 2 : 0)).join('')}…₃ = ${c.toFixed(6)}`, Math.min(c + 0.02, 0.62), yC - 0.42, { size: 11.5, color: 'blue', weight: 600 });
            ruler(0, 1, 2.8, 1);
            ln.text('b: [0,1) → 𝒫(ℕ) by binary digits', 0, 2.25, { size: 12, weight: 600, color: 'teal' });
            ln.line(0, 1.15, 1, 1.15, { color: 'ink', width: 1.6 });
            for (let k = 0; k <= 8; k++) ln.line(k / 8, 1.08, k / 8, 1.22, { color: 'muted', width: 1 });
            ln.text(`x = 0.${bits.join('')}…₂`, 0, 0.62, { size: 12, color: 'teal', weight: 600 });
            st = { md, S: [...S].sort((a, b) => a - b), c, bits };
            return;
          }
          // ---- interleaving
          let xd, yd;
          if (src === 'Z') {
            const zd = digitsOf(Zh.x, 2 * K); xd = zd.filter((_, j) => j % 2 === 0); yd = zd.filter((_, j) => j % 2 === 1);
            P.x = fromDigits(xd); P.y = fromDigits(yd);
          }
          if (md === 'nine') { P.x = v.M.clamp(Math.round(P.x * 10) / 10, 0.1, 0.9); }
          xd = digitsOf(P.x, K); yd = digitsOf(P.y, K);
          if (md === 'nine') xd = digitsOf(Math.round(P.x * 10) / 10, K);
          const zd = []; for (let j = 0; j < K; j++) zd.push(xd[j], yd[j]);
          const z = fromDigits(zd);
          if (src === 'P' || md === 'nine') Zh.x = z;
          // square: grid, z-order path, cells
          sq.rect(0, 0, 1, 1, { color: 'ink', width: 1.4 });
          for (let k = 1; k < 10; k++) { sq.line(k / 10, 0, k / 10, 1, { color: 'grid', width: 1 }); sq.line(0, k / 10, 1, k / 10, { color: 'grid', width: 1 }); }
          const path = []; for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) path.push([(a + 0.5) / 10, (b + 0.5) / 10]);
          sq.path(path, { color: 'teal', width: 1, alpha: 0.22 });
          const c1 = [xd[0] / 10, yd[0] / 10], c2 = [c1[0] + xd[1] / 100, c1[1] + yd[1] / 100];
          sq.rect(c1[0], c1[1], c1[0] + 0.1, c1[1] + 0.1, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2 });
          const p2 = []; for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) p2.push([c1[0] + (a + 0.5) / 100, c1[1] + (b + 0.5) / 100]);
          sq.path(p2, { color: 'teal', width: 0.8, alpha: 0.6 });
          const e2 = pxX(sq, 2);
          sq.rect(c2[0] - e2, c2[1] - e2, c2[0] + 0.01 + e2, c2[1] + 0.01 + e2, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 2 });
          // inset: the orange 0.1-cell magnified ×10, in the corner away from P
          const ix0 = P.x < 0.5 ? 0.57 : 0.03, iy0 = P.y < 0.5 ? 0.57 : 0.03, isz = 0.4, I = (u, w) => [ix0 + (u - c1[0]) * 10 * isz, iy0 + (w - c1[1]) * 10 * isz];
          for (const [cx0, cy0] of [[0, 0], [0.1, 0], [0, 0.1], [0.1, 0.1]]) { const a = [c1[0] + cx0, c1[1] + cy0], b = I(a[0], a[1]); sq.line(a[0], a[1], b[0], b[1], { color: 'orange', width: 1, dash: [3, 3], alpha: 0.7 }); }
          sq.rect(ix0, iy0, ix0 + isz, iy0 + isz, { fill: 'panel', fillAlpha: 1, color: 'orange', width: 2 });
          for (let k = 1; k < 10; k++) { sq.line(ix0 + (k * isz) / 10, iy0, ix0 + (k * isz) / 10, iy0 + isz, { color: 'grid', width: 1 }); sq.line(ix0, iy0 + (k * isz) / 10, ix0 + isz, iy0 + (k * isz) / 10, { color: 'grid', width: 1 }); }
          sq.path(p2.map(([u, w]) => I(u, w)), { color: 'teal', width: 1, alpha: 0.5 });
          const r0 = I(c2[0], c2[1]); sq.rect(r0[0], r0[1], r0[0] + isz / 10, r0[1] + isz / 10, { fill: 'red', fillAlpha: 0.45, color: 'red', width: 2 });
          const pI = I(P.x, P.y); sq.dot(pI[0], pI[1], { r: 3.5, color: 'accent' });
          sq.text('×10', ix0 + isz, iy0 > 0.5 ? iy0 - 0.03 : iy0 + isz + 0.03, { align: 'right', size: 10.5, color: 'orange', weight: 600 });
          for (const t of [0, 0.5, 1]) { sq.text(String(t), t, -0.04, { align: 'center', size: 9.5, color: 'muted' }); sq.text(String(t), -0.015, t, { align: 'right', size: 9.5, color: 'muted' }); }
          sq.text('x', 0.75, -0.04, { align: 'center', size: 12, color: 'blue', math: true });
          sq.text('y', -0.03, 0.75, { align: 'right', size: 12, color: 'orange', math: true });
          if (md === 'nine') sq.line(P.x, 0, P.x, 1, { color: 'red', width: 1.2, dash: [4, 4] });
          // digits
          const XC = Array(K).fill('blue'), YC = Array(K).fill('orange'), ZC = zd.map((_, j) => (j % 2 ? 'orange' : 'blue'));
          const ev = (j) => 2 * j, od = (j) => 2 * j + 1;
          if (md === 'int') {
            digitRow('x = 0.', xd, 6.1, XC, ev); digitRow('y = 0.', yd, 5.6, YC, od);
            for (let k = 0; k < 2 * K; k++) ln.line(0.16 + k * 0.052, k % 2 ? 5.4 : 5.9, 0.16 + k * 0.052, 5.25, { color: k % 2 ? 'orange' : 'blue', width: 1, alpha: 0.45 });
            digitRow('z = 0.', zd, 5.0, ZC);
            ln.text('…', 0.16 + 2 * K * 0.052, 5.0, { size: 13, color: 'muted' });
          } else {
            const x9 = [xd[0] - 1, ...Array(K - 1).fill(9)];
            const z9 = []; for (let j = 0; j < K; j++) z9.push(x9[j], yd[j]);
            digitRow('x = 0.', xd, 6.15, XC, ev); ln.text('…', 0.16 + 2 * K * 0.052, 6.15, { size: 13, color: 'muted' });
            digitRow('   = 0.', x9, 5.78, Array(K).fill('red'), ev); ln.text('(same number)', 1.05, 5.78, { align: 'right', size: 11, color: 'red' });
            digitRow('y = 0.', yd, 5.41, YC, od);
            digitRow('z₁= 0.', zd, 5.0, ZC); digitRow('z₂= 0.', z9, 4.6, z9.map((_, j) => (j % 2 ? 'orange' : 'red')));
            st = { z9: fromDigits(z9) };
          }
          // ruler rows (zoom cascade)
          const z12 = Math.floor(z * 100 + 1e-9) / 100, z1234 = Math.floor(z * 1e4 + 1e-9) / 1e4;
          ruler(0, 1, 3.65, 1);
          ln.line(Zh.x, 3.7, Zh.x, 3.95, { color: 'accent', width: 1.4 });
          ln.rect(z12, 3.56, z12 + 0.01, 3.74, { fill: 'orange', fillAlpha: 0.8, color: 'orange', width: 1.5 });
          ruler(z12, 0.01, 2.4, 3);
          const u2 = (z - z12) * 100, s2 = (z1234 - z12) * 100;
          ln.rect(s2, 2.31, s2 + 0.01, 2.49, { fill: 'red', fillAlpha: 0.8, color: 'red', width: 1.5 });
          const mark = (u, y) => { ln.line(u, y + 0.1, u, y + 0.32, { color: 'accent', width: 1.6 }); ln.dot(u, y + 0.36, { r: 4, color: 'accent' }); };
          mark(u2, 2.4);
          ruler(z1234, 1e-4, 1.15, 5);
          mark((z - z1234) * 1e4, 1.15);
          // zoom funnels
          ln.path([[z12, 3.58], [0, 2.47]], { color: 'orange', width: 1, dash: [3, 3] }); ln.path([[z12 + 0.01, 3.58], [1, 2.47]], { color: 'orange', width: 1, dash: [3, 3] });
          ln.path([[s2, 2.33], [0, 1.22]], { color: 'red', width: 1, dash: [3, 3] }); ln.path([[s2 + 0.01, 2.33], [1, 1.22]], { color: 'red', width: 1, dash: [3, 3] });
          ln.text('×100', 1.03, 3.0, { size: 10, color: 'muted', align: 'center' }); ln.text('×100', 1.03, 1.75, { size: 10, color: 'muted', align: 'center' });
          if (md === 'nine') {
            const z9 = st.z9;
            ln.dot(z9, 3.65, { r: 5, color: 'red' }); ln.text('z₂', z9, 3.4, { align: 'center', size: 11, color: 'red', weight: 700 });
            ln.dot(1 / 11, 3.65, { r: 5.5, hollow: true, color: 'red' }); ln.text('1/11', 1 / 11, 3.4, { align: 'center', size: 10.5, color: 'red' });
          }
          st = { ...st, md, xd, yd, zd, z };
        });
        v.legend([['blue', 'digits of $x$', { dot: true }], ['orange', 'digits of $y$; a $0.1$-cell ↔ an interval of length $0.01$', { dot: true }], ['red', 'a $0.01$-cell ↔ length $10^{-4}$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.md === 'pn') return `$S=\\{${st.S.join(',')}\\}$ ↦ $c(S)=${st.c.toFixed(6)}$. Different sets give different ternary digit strings of $0$s and $2$s, hence different points, so $c:\\mathcal P(\\mathbb N)\\to[0,1]$ is one-to-one. Binary digits give a one-to-one $b:[0,1)\\to\\mathcal P(\\mathbb N)$ (never use the expansion ending in $1$s). Schröder–Bernstein: $|\\mathcal P(\\mathbb N)|=|[0,1)|=|\\mathbb R|$.`;
          if (st.md === 'nine') return `$x=${st.xd[0] / 10}$ has two expansions, so “interleave the digits” would give two values $z_1=${v.fix(st.z, 6)}$ and $z_2=${v.fix(st.z9, 6)}$. The rule **never end in 9s** keeps $z_1$ only; then $z_2$ and $\\tfrac1{11}=0.0909\\ldots$ (which would need $y=0.999\\ldots=1$) are never hit. Interleaving is one-to-one but **not onto**; with $z\\mapsto(z,0)$ going back, Schröder–Bernstein (1.3) supplies the bijection.`;
          return `$P=(0.${st.xd.join('')}\\ldots,\\ 0.${st.yd.join('')}\\ldots)\\mapsto z=0.${st.zd.join('')}\\ldots$, and deinterleaving recovers $P$, so the map is one-to-one ✓. Nearby points of the square can land far apart on the line: the map is not continuous, and no continuous bijection $[0,1]^2\\to[0,1]$ exists.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Transcendental numbers exist (Cantor)',
      statement: String.raw`A real number is **algebraic** if it is a root of a nonzero polynomial with integer coefficients, and **transcendental** otherwise. The real algebraic numbers form a countable set. Since every interval is uncountable, every interval contains transcendental numbers, in fact uncountably many. In terms of length, the algebraic numbers can be covered by intervals of total length less than any $\varepsilon>0$, so almost every real number is transcendental.`,
      idea: String.raw`Give the polynomial $a_0x^n+\dots+a_n$ the height $N=n-1+|a_0|+\dots+|a_n|$ (Cantor's choice). Only finitely many polynomials have a given height, and each has at most $n$ roots. So listing the roots height by height enumerates all algebraic numbers, which are countable (pma-2.13). An interval is uncountable (pma-2.43a), so it cannot consist of algebraic numbers alone. Covering the $k$-th listed number by an interval of length $\varepsilon/2^k$ uses total length at most $\varepsilon$, which shows directly that most of $[0,1]$ is missed.`,
      caption: String.raw`Top: every real algebraic number in $[0,1]$ of height at most $N$, one row per height and coloured by degree. Each listed number, the $k$-th in Cantor's order, carries an interval of length $\ell_k$ ($\varepsilon/2^k$ or $6\varepsilon/\pi^2k^2$, both summing to at most $\varepsilon$). Bottom: their union on $[0,1]$ and a $\times 40$ magnifier around the point $x$; drag $x$, which snaps onto listed numbers. Raise $N$: the dots crowd in, densely, yet the covered length stays below $\varepsilon$.`,
      deps: ['pma-2.12', 'pma-2.13', 'pma-2.14', 'pma-2.43a'],
      see: ['phil-2.10', 'logic-1.11'],
      refs: ['Enderton Ch. 0'],
      credit: 'Georg Cantor, 1874 (Liouville gave the first explicit examples, 1844)',
      tags: ['countability', 'transcendental numbers', 'measure zero'],
      viz(v) {
        const NS = v.slider('list heights $N\\le$', 3, 11, 9, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.001, 0.5, 0.1, { log: true });
        const sch = v.select('$\\ell_k =$', [{ value: 'geo', label: '$\\varepsilon/2^k$' }, { value: 'sq', label: '$6\\varepsilon/(\\pi^2k^2)$' }], 'sq');
        const top = v.stage({ x: [-0.02, 1.02], y: [0.3, 9.7], axes: false, height: 320, full: true, title: 'real algebraic numbers in $[0,1]$ by Cantor height $N$, each with its covering interval' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.12, 1.15], axes: false, height: 190, full: true });
        let listCache = null, listN = 0;
        const getList = (N) => { if (listN !== N) { listCache = cantorList(N).filter((e) => e.x >= 0 && e.x <= 1); listN = N; } return listCache; };
        const hx = bot.handle(0.43, 0.78, { color: 'accent', label: 'x', constrain: (x) => {
          let xx = v.M.clamp(x, 0, 1); const L = getList(NS.value), tol = pxX(bot, 4);
          for (const e of L) if (Math.abs(e.x - xx) < tol) { xx = e.x; break; }
          return [xx, 0.78];
        } });
        const DEG = ['blue', 'orange', 'green', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple'];
        let st = null;
        v.render(() => {
          const N = NS.value, eps = eS.value, L = getList(N);
          top.setView(null, [0.3, N + 0.7]);
          const len = (k) => (sch.value === 'geo' ? eps * 2 ** -k : (6 * eps) / (Math.PI ** 2 * k * k));
          // axis of heights
          for (let h = 1; h <= N; h++) { top.line(0, h, 1, h, { color: 'grid', width: 1 }); top.text(String(h), -0.012, h, { align: 'right', size: 10, color: 'muted' }); }
          top.text('height N', 0.0, N + 0.48, { align: 'left', size: 10.5, color: 'muted' });
          const ivs = [];
          L.forEach((e, idx) => {
            const k = idx + 1, l = len(k);
            ivs.push([e.x - l / 2, e.x + l / 2]);
            if (pxX(top, 1) < l) top.rect(e.x - l / 2, e.h - 0.2, e.x + l / 2, e.h + 0.2, { fill: 'red', fillAlpha: 0.28, stroke: false });
            top.dot(e.x, e.h, { r: N > 9 ? 1.7 : 2.4, color: DEG[e.poly.length - 2] });
          });
          // union
          ivs.sort((a, b) => a[0] - b[0]);
          const U = []; for (const [a, b] of ivs) { if (U.length && a <= U[U.length - 1][1]) U[U.length - 1][1] = Math.max(U[U.length - 1][1], b); else U.push([a, b]); }
          let cov = 0; for (const [a, b] of U) cov += Math.max(0, Math.min(b, 1) - Math.max(a, 0));
          const total = L.reduce((s0, _, i) => s0 + len(i + 1), 0);
          const yU = 0.78;
          bot.rect(0, yU - 0.05, 1, yU + 0.05, { fill: 'green', fillAlpha: 0.25, stroke: false });
          for (const [a, b] of U) bot.rect(Math.max(a, 0), yU - 0.07, Math.min(b, 1), yU + 0.07, { fill: 'red', fillAlpha: 0.75, stroke: false });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) bot.text(String(t), t, yU - 0.16, { align: 'center', size: 9.5, color: 'muted' });
          bot.text(`union of the first ${L.length} intervals (red) — the rest of [0, 1] (green) is uncovered so far`, 0, 1.06, { size: 11, color: 'muted' });
          // magnifier around x
          const x = hx.x, W = 1 / 40, a0 = x - W / 2, M = (t) => (t - a0) / W;
          const yM = 0.22;
          bot.path([[x - W / 2, yU - 0.08], [0, yM + 0.09]], { color: 'muted', dash: [3, 3], width: 1 }); bot.path([[x + W / 2, yU - 0.08], [1, yM + 0.09]], { color: 'muted', dash: [3, 3], width: 1 });
          bot.rect(x - W / 2, yU - 0.09, x + W / 2, yU + 0.09, { color: 'accent', width: 1.4 });
          bot.rect(0, yM - 0.05, 1, yM + 0.05, { fill: 'green', fillAlpha: 0.25, stroke: false });
          bot.clip(() => { for (const [a, b] of U) if (b > a0 && a < a0 + W) bot.rect(Math.max(0, M(a)), yM - 0.07, Math.min(1, M(b)), yM + 0.07, { fill: 'red', fillAlpha: 0.75, stroke: false }); }, [0, 1], [-0.2, 1.2]);
          for (const e of L) if (e.x > a0 && e.x < a0 + W) bot.line(M(e.x), yM - 0.1, M(e.x), yM + 0.1, { color: DEG[e.poly.length - 2], width: 1.4 });
          bot.line(0.5, yM - 0.15, 0.5, yM + 0.15, { color: 'accent', width: 2 });
          bot.text(v.fix(a0, 4), 0, yM - 0.17, { size: 9.5, color: 'muted' }); bot.text(v.fix(a0 + W, 4), 1, yM - 0.17, { align: 'right', size: 9.5, color: 'muted' });
          bot.text('×40', 1.0, yM + 0.15, { align: 'right', size: 10, color: 'muted' });
          let inside = false; for (const [a, b] of U) if (x >= a && x <= b) inside = true;
          const hitE = L.find((e) => e.x === x);
          st = { N, eps, L, cov, total, x, inside, hitE, k: hitE ? L.indexOf(hitE) + 1 : 0, len };
        });
        v.legend([['blue', 'degree 1 (rationals)', { dot: true }], ['orange', 'degree 2', { dot: true }], ['green', 'degree 3', { dot: true }], ['purple', 'degree ≥ 4', { dot: true }], ['red', 'covering intervals', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { N, eps, L, cov, total, x, inside, hitE, k, len } = st;
          let px;
          if (hitE) px = `$x=${v.fix(x, 5)}$ is algebraic: a root of $${polyTex(hitE.poly)}$ (height ${hitE.h}), number $k=${k}$ in the list, covered by an interval of length $${v.sci(len(k), 2)}$.`;
          else px = `$x=${v.fix(x, 4)}$ is ${inside ? 'inside the cover so far' : '**not covered** by any of these intervals'}.`;
          return `${L.length} algebraic numbers in $[0,1]$ have height $\\le ${N}$ (finitely many for each $N$). Their intervals have total length $${v.fix(total, 4)}<\\varepsilon=${v.fmt(eps, 3)}$, and the union measures $${v.fix(cov, 4)}$, so at least $${v.fix(100 * (1 - cov), 1)}\\%$ of $[0,1]$ is uncovered. The same bound holds for the whole infinite list, and every point outside the full cover is transcendental. ${px}`;
        });
      },
    },
  ],
};
