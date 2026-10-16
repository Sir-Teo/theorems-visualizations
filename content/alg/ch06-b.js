// Abstract Algebra (Judson) — Chapter 6, part 2: consequences of Lagrange’s theorem, A₄ has no subgroup of order 6,
// conjugate cycles, the Euler φ-function, U(n), Euler’s theorem and Fermat’s little theorem (6.11–6.19).
import { useLab, cgStage, drawCG, hitNode, cosetClasses, cosetColor, getGroup, orderCounts, divisors, generated, subgroupTest, orderOf, curvedArrow, allPerms, compose, inverse, fromCycles, cycles, cycTex, idp, permCircle, EC, gcd } from './ch06.shared.js';

const modpow = (b, e, m) => { let r = 1 % m, x = b % m; while (e > 0) { if (e & 1) r = (r * x) % m; x = (x * x) % m; e = Math.floor(e / 2); } return r; };
const isPrime = (n) => { if (n < 2) return false; for (let p = 2; p * p <= n; p++) if (n % p === 0) return false; return true; };
const phi = (n) => { let c = n === 1 ? 1 : 0; for (let k = 1; k < n; k++) if (gcd(k, n) === 1) c++; return c; };
const at = (k, m, R, c = [0, 0]) => [c[0] + R * Math.cos(Math.PI / 2 - (2 * Math.PI * k) / m), c[1] + R * Math.sin(Math.PI / 2 - (2 * Math.PI * k) / m)];
/** Powers a, a², …, aᵏ = e of an element (as indices), and the order k. */
function powersOf(G, a) { const out = []; let x = G.e; do { x = G.T[x][a]; out.push(x); } while (x !== G.e); return out; }

export default {
  collection: 'alg',
  chapter: 6,
  title: 'Cosets and Lagrange’s Theorem',
  items: [
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Corollary',
      name: 'The order of an element divides |G|',
      statement: String.raw`Let $G$ be a finite group and $g\in G$. Then the order of $g$ divides $|G|$, and $g^{|G|}=e$.`,
      idea: String.raw`The cyclic subgroup $\langle g\rangle=\{e,g,g^2,\dots\}$ (4.3) has exactly as many elements as the order of $g$ (4.4a). Lagrange’s theorem (6.10) says the order of any subgroup divides $|G|$, so $|G|=k\cdot[G:\langle g\rangle]$ with $k=|g|$, and hence $g^{|G|}=(g^k)^{[G:\langle g\rangle]}=e$.`,
      caption: String.raw`Click any element: its powers $a,a^2,a^3,\dots$ are traced as a gold loop that closes up after $|a|$ steps. The bar chart counts the elements of $G$ of each order $1,\dots,12$: orders that do not divide $12$ (red ×) never occur — in any of the four groups of order $12$.`,
      deps: ['alg-6.10', 'alg-4.3'],
      refs: ['Judson §6.2'],
      tags: ['lagrange', 'order of an element'],
      viz(v) {
        const L = useLab(v, ['Z12', 'D6', 'A4', 'U21'], { group: 'D6', g: 1, noSub: true });
        const s = cgStage(v, { weight: 1.2, height: 380 });
        const b = v.stage({ x: [0.3, 12.7], y: [0, 8], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xlabel: 'order of the element', ylabel: 'number of elements' });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0) L.g = i; });
        v.render(() => {
          const A = L.A, G = A.G; if (L.g >= G.n) L.g = 1;
          const P = powersOf(G, L.g), inP = new Set(P);
          drawCG(v, s, A, { fill: (i) => (inP.has(i) ? 'gold' : null), ring: (i) => (i === L.g ? 'ink' : null), edges: true });
          let prev = G.e;
          P.forEach((x) => { if (x !== prev) curvedArrow(s, A.pos[prev], A.pos[x], { color: 'red', width: 2.2, bend: 0.2, trim: A.r + 2 }); prev = x; });
          s.setTitle(`powers of $${G.L[L.g]}$ in $${A.tex}$`);
          const C = orderCounts(G), mx = Math.max(...Object.values(C)), ord = orderOf(G, L.g);
          b.setView([0.3, 12.7], [0, mx * 1.25 + 0.5]);
          for (let k = 1; k <= 12; k++) {
            if (C[k]) { b.rect(k - 0.38, 0, k + 0.38, C[k], { fill: k === ord ? 'gold' : 'accent', fillAlpha: k === ord ? 0.75 : 0.4, color: k === ord ? 'gold' : 'accent', width: 1.5 }); b.text(String(C[k]), k, C[k], { dy: -9, align: 'center', size: 11, color: 'ink' }); }
            else if (G.n % k !== 0) b.text('×', k, mx * 0.06 + 0.15, { align: 'center', size: 16, weight: 700, color: 'red' });
          }
          b.setTicks([...Array(12)].map((_, i) => [i + 1, String(i + 1)]), null);
        });
        v.readout(() => {
          const A = L.A, G = A.G, k = orderOf(G, L.g), C = orderCounts(G), never = [...Array(12)].map((_, i) => i + 1).filter((o) => !C[o] && G.n % o !== 0);
          return String.raw`$|${G.L[L.g]}|=${k}$: the loop closes after ${k} steps, so $\langle ${G.L[L.g]}\rangle$ has ${k} elements and $${G.n}=${k}\cdot ${G.n / k}$ (the subgroup has index ${G.n / k}). Orders that occur in $${A.tex}$: ${Object.keys(C).join(', ')}. Orders ${never.join(', ')} do not divide ${G.n} and never occur.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Corollary',
      name: 'Groups of prime order are cyclic',
      statement: String.raw`If $|G|=p$ is a prime number, then $G$ is cyclic, and every element of $G$ other than the identity is a generator. Consequently the only subgroups of $G$ are $\{e\}$ and $G$.`,
      idea: String.raw`Take $g\neq e$. By 6.11 the order of $g$ divides $p$, so it is $1$ or $p$; it is not $1$ because $g\ne e$. Hence $\langle g\rangle$ has $p$ elements and is all of $G$. The argument breaks when $|G|$ is composite: orders of elements may be proper divisors of $|G|$, as in $\mathbb Z_6$, or no element may reach $|G|$ at all, as in $V_4$ and $S_3$.`,
      caption: String.raw`Pick a group and click an element: the red loop is its list of powers. In $\mathbb Z_5,\mathbb Z_7,\mathbb Z_{11},\mathbb Z_{13}$ every non-identity element sweeps through the whole group (bar reaches $|G|$). Now choose $\mathbb Z_6$, $\mathbb Z_9$, $V_4$ or $S_3$: some or all loops close too early.`,
      deps: ['alg-6.11', 'alg-4.4a'],
      refs: ['Judson §6.2'],
      tags: ['lagrange', 'cyclic groups'],
      viz(v) {
        const L = useLab(v, ['Z5', 'Z7', 'Z11', 'Z13', 'Z6', 'Z9', 'V', 'S3'], { group: 'Z7', g: 2, noSub: true });
        const s = cgStage(v, { weight: 1.2, height: 360 });
        const b = v.stage({ x: [0, 14], y: [0, 14], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 250, xlabel: 'element', ylabel: 'order of the element' });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0 && i !== L.G.e) L.g = i; });
        b.onClick((x) => { const i = Math.round(x) - 1; if (i >= 0 && i < L.G.n && i !== L.G.e) L.g = i; });
        v.render(() => {
          const A = L.A, G = A.G; if (L.g >= G.n || L.g === G.e) L.g = G.e === 0 ? 1 : 0;
          const P = powersOf(G, L.g), inP = new Set(P);
          drawCG(v, s, A, { fill: (i) => (inP.has(i) ? 'gold' : null), ring: (i) => (i === L.g ? 'ink' : null) });
          let prev = G.e;
          P.forEach((x) => { if (x !== prev) curvedArrow(s, A.pos[prev], A.pos[x], { color: 'red', width: 2.2, bend: 0.22, trim: A.r + 2 }); prev = x; });
          s.setTitle(`powers of $${G.L[L.g]}$: ${P.length} of ${G.n} elements`);
          b.setView([0.3, G.n + 0.7], [0, G.n * 1.15]);
          b.setTicks(G.L.map((_, i) => [i + 1, A.plain[i]]), null);
          for (let i = 0; i < G.n; i++) { const o = orderOf(G, i), gen = o === G.n; b.rect(i + 0.62, 0, i + 1.38, o, { fill: gen ? 'green' : 'orange', fillAlpha: i === L.g ? 0.8 : 0.4, color: i === L.g ? 'ink' : gen ? 'green' : 'orange', width: i === L.g ? 2 : 1 }); b.text(String(o), i + 1, o, { dy: -9, align: 'center', size: 11, color: 'ink' }); }
          b.hline(G.n, { color: 'green', dash: true, alpha: 0.7 });
        });
        v.readout(() => {
          const A = L.A, G = A.G, n = G.n, gens = [...Array(n).keys()].filter((i) => orderOf(G, i) === n), prime = isPrime(n);
          return String.raw`$|G|=${n}$ is ${prime ? 'prime' : 'composite'}. $|${G.L[L.g]}|=${orderOf(G, L.g)}$. Generators (order ${n}): **${gens.length}** of the ${n - 1} non-identity elements. ${prime ? `Every non-identity element generates $G$, so $G$ is cyclic ✓ (a divisor of ${n} is $1$ or ${n}).` : gens.length ? `$G$ is cyclic, but only the elements coprime to ${n} generate it — the shorter loops are the subgroups of 6.11.` : `No element has order ${n}, so $${A.tex}$ is **not** cyclic: the hypothesis “prime order” cannot be dropped.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13',
      kind: 'Corollary',
      name: 'Index is multiplicative: [G : K] = [G : H][H : K]',
      statement: String.raw`Let $G$ be a finite group and $K\le H\le G$ subgroups. Then $[G:K]=[G:H]\,[H:K]$.`,
      idea: String.raw`By Lagrange (6.10) applied three times, $[G:K]=|G|/|K|$, $[G:H]=|G|/|H|$ and $[H:K]=|H|/|K|$, and $\frac{|G|}{|H|}\cdot\frac{|H|}{|K|}=\frac{|G|}{|K|}$. Picture: each coset $gH$ is a union of exactly $[H:K]$ cosets of $K$, because $K\le H$ lets the cosets of $K$ inside $H$ be translated by $g$.`,
      caption: String.raw`The group is $\mathbb Z_{24}$, whose subgroup of each order $d\mid 24$ is unique. Choose $|H|$ and $|K|$. Right: the bricks are the cosets of $K$ (one colour each), stacked into one row per coset of $H$; the left clock joins each $H$-coset by a polygon. If $K\not\le H$ (e.g. $|K|=8,|H|=12$) the nesting — and the formula — are lost.`,
      deps: ['alg-6.10'],
      refs: ['Judson §6.2'],
      tags: ['index', 'lagrange'],
      viz(v) {
        const D = [1, 2, 3, 4, 6, 8, 12, 24], opts = D.map((d) => ({ value: String(d), label: String(d) }));
        const hs = v.select('$|H|$', opts, '12'), ks = v.select('$|K|$', opts, '4');
        const A = getGroup('Z24'), G = A.G;
        const sub = (d) => generated(G, [(24 / d) % 24]);
        const s = cgStage(v, { weight: 1.1, height: 380 });
        const b = v.stage({ x: [0, 6], y: [0, 6], equal: true, axes: false, height: 380, weight: 1, minWidth: 250 });
        let info = null;
        v.render(() => {
          const H = sub(+hs.value), K = sub(+ks.value), nested = K.every((x) => H.includes(x));
          const kc = cosetClasses(G, K), hc = cosetClasses(G, H), mK = kc.length, mH = hc.length;
          // H-coset polygons
          hc.forEach((C) => { if (C.length > 1) { const pts = C.map((x) => A.pos[x]); s.path(C.length === 2 ? pts : [...pts, pts[0]], { color: nested ? 'ink' : 'muted', width: 1.8, alpha: 0.75 }); } });
          drawCG(v, s, A, { edges: false, fill: (i) => cosetColor(v, kc.of[i], mK), label: () => null, r: 11 });
          s.setTitle(`$K$-cosets coloured; $H$-cosets joined by polygons`);
          if (nested) {
            const cols = H.length, rows = mH;
            b.setView([-0.6, cols + 0.3], [-1.0, rows + 0.4]);
            hc.forEach((C, r) => {
              const order = [...new Set(C.map((x) => kc.of[x]))].flatMap((id) => C.filter((x) => kc.of[x] === id));
              order.forEach((x, c) => {
                const same = c > 0 && kc.of[order[c - 1]] === kc.of[x];
                b.rect(c + 0.03, rows - r - 1 + 0.06, c + 0.97, rows - r - 0.06, { fill: cosetColor(v, kc.of[x], mK), fillAlpha: 0.88, stroke: false, radius: same ? 1 : 4 });
                if (cols <= 12) b.text(String(x), c + 0.5, rows - r - 0.5, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
              });
            });
            b.text(`${cols} = |H| per row`, cols / 2, -0.5, { align: 'center', size: 13, weight: 700, color: 'ink' });
            b.setTitle(`rows: ${rows} cosets of $H$ — each made of ${H.length / K.length} cosets of $K$`);
          } else {
            b.setView([0, 6], [0, 6]);
            b.text('K is not inside H', 3, 3.3, { align: 'center', size: 17, weight: 700, color: 'red' });
            b.text(`${K.length} does not divide ${H.length}`, 3, 2.6, { align: 'center', size: 13, color: 'muted' });
            b.setTitle('the nesting $K\\le H$ fails');
          }
          info = { H, K, nested, mK, mH };
        });
        v.readout(() => {
          const { H, K, nested, mK, mH } = info;
          if (!nested) return String.raw`$K$ (order ${K.length}) is not a subgroup of $H$ (order ${H.length}): ${K.length} does not divide ${H.length}, so there is no $[H:K]$ and the product formula has no meaning. For the chain $K\le H\le G$ choose $|K|$ dividing $|H|$.`;
          const inside = new Set(cosetClasses(G, K).of.filter((_, x) => H.includes(x))).size;
          return String.raw`$[G:H]=${mH}$, $[H:K]=${inside}$ (the $K$-cosets inside $H$), and $[G:K]=${mK}$. Check: $${mH}\cdot ${inside}=${mH * inside}=${mK}$ ${mH * inside === mK ? '✓' : '✗'}, and also $\frac{24}{${H.length}}\cdot\frac{${H.length}}{${K.length}}=\frac{24}{${K.length}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.15
    {
      num: '6.15',
      kind: 'Proposition',
      name: 'A₄ has no subgroup of order 6',
      statement: String.raw`The alternating group $A_4$ has order $12$ but no subgroup of order $6$. So the converse of Lagrange’s theorem is false: a divisor of $|G|$ need not be the order of a subgroup.`,
      idea: String.raw`Suppose $H\le A_4$ had order $6$. Then $[A_4:H]=2$ (6.10), so there are only two left cosets, $H$ and one other coset $C$ (6.4). If $g\notin H$ and also $g^2\notin H$, then $g$ and $g^2$ both lie in $C$, so $g^{-1}g^2=g\in H$ by 6.3 — a contradiction; hence $g^2\in H$ for every $g\in A_4$. For a $3$-cycle $g$ we have $g^3=e$, so $g=g^4=(g^2)^2\in H$. Thus $H$ contains all eight $3$-cycles of $A_4$ (5.17 gives $|A_4|=12$), more than $6$ elements: impossible.`,
      caption: String.raw`Click elements of $A_4$ to add them as generators (gold rings); the orange nodes are the subgroup they generate. Whatever you pick, the size is always $1,2,3,4$ or $12$ — never $6$. The bars count the subgroups of each order for the chosen group; switch to $D_6$ or $\mathbb Z_{12}$ to see a subgroup of order $6$ appear. The readout also tests every $6$-element subset containing $e$ one by one.`,
      deps: ['alg-6.10', 'alg-5.17'],
      refs: ['Judson §6.2'],
      tags: ['lagrange', 'alternating group'],
      viz(v) {
        const L = useLab(v, ['A4', 'D6', 'Z12'], { group: 'A4', noSub: true, onChange: () => { sel = new Set(); } });
        let sel = new Set(getGroup('A4').gens);
        v.button('Clear', () => { sel = new Set(); });
        v.button('A 3-cycle + a double transposition', () => { if (L.A.key !== 'A4') return; sel = new Set(getGroup('A4').gens); });
        const s = cgStage(v, { weight: 1.3, height: 380 });
        const b = v.stage({ x: [0, 7], y: [0, 5], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xlabel: 'order d of a subgroup (d divides 12)', ylabel: 'number of subgroups of order d' });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0 && i !== L.G.e) { if (sel.has(i)) sel.delete(i); else sel.add(i); } });
        const brute = new Map();
        const bruteCount = (A) => {
          if (brute.has(A.key)) return brute.get(A.key);
          const G = A.G, n = G.n, want = n / 2, others = [...Array(n).keys()].filter((i) => i !== G.e); let found = 0, total = 0;
          const rec = (start, pick) => { if (pick.length === want - 1) { total++; if (subgroupTest(G, [G.e, ...pick]).ok) found++; return; } for (let i = start; i < others.length; i++) { pick.push(others[i]); rec(i + 1, pick); pick.pop(); } };
          rec(0, []); const r = { found, total }; brute.set(A.key, r); return r;
        };
        v.render(() => {
          const A = L.A, G = A.G, S = [...sel].filter((i) => i < G.n), H = generated(G, S), inH = new Set(H);
          drawCG(v, s, A, { fill: (i) => (inH.has(i) ? 'orange' : null), ring: (i) => (sel.has(i) ? 'gold' : null) });
          s.setTitle(`${S.length ? `⟨${S.map((i) => A.plain[i]).join(', ')}⟩` : '⟨ ⟩'} has ${H.length} element${H.length === 1 ? '' : 's'}`);
          const D = divisors(G.n), cnt = D.map((d) => A.subs.filter((X) => X.length === d).length);
          b.setView([0.4, D.length + 0.6], [0, Math.max(...cnt) * 1.3 + 0.5]);
          b.setTicks(D.map((d, i) => [i + 1, String(d)]), null);
          D.forEach((d, i) => {
            if (cnt[i]) { b.rect(i + 0.65, 0, i + 1.35, cnt[i], { fill: d === H.length ? 'gold' : 'accent', fillAlpha: 0.5, color: d === H.length ? 'gold' : 'accent', width: 1.5 }); b.text(String(cnt[i]), i + 1, cnt[i], { dy: -9, align: 'center', size: 12, weight: 700, color: 'ink' }); }
            else { b.text('none', i + 1, 0.35, { align: 'center', size: 13, weight: 700, color: 'red' }); b.dot(i + 1, 0.0, { r: 4, color: 'red' }); }
          });
        });
        v.readout(() => {
          const A = L.A, G = A.G, S = [...sel].filter((i) => i < G.n), H = generated(G, S), br = bruteCount(A), half = G.n / 2;
          return String.raw`${S.length ? `The subgroup generated by your ${S.length} element${S.length > 1 ? 's' : ''} has **${H.length}** elements${H.length === half ? ' — a subgroup of order ' + half + ' ✓' : ''}.` : 'Click elements to generate subgroups.'} Brute force over all ${br.total} subsets of ${half} elements containing $e$: **${br.found}** of them are closed under the product and inverses, i.e. subgroups of order ${half}. ${br.found ? '' : `So no subgroup of $${A.tex}$ has order ${half}, although ${half} divides ${G.n}: the converse of Lagrange fails.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.16
    {
      num: '6.16',
      kind: 'Theorem',
      name: 'Cycles of the same length are conjugate',
      statement: String.raw`Two cycles $\tau$ and $\mu$ in $S_n$ have the same length if and only if there is a permutation $\sigma\in S_n$ with $\mu=\sigma\tau\sigma^{-1}$. In fact if $\tau=(a_1\,a_2\,\dots\,a_k)$ then $\sigma\tau\sigma^{-1}=(\sigma(a_1)\,\sigma(a_2)\,\dots\,\sigma(a_k))$.`,
      idea: String.raw`Compute $\sigma\tau\sigma^{-1}$ on a point $\sigma(a_i)$: first $\sigma^{-1}$ returns to $a_i$, then $\tau$ moves to $a_{i+1}$, then $\sigma$ sends it to $\sigma(a_{i+1})$; points outside $\sigma(\{a_i\})$ are fixed. So conjugation is *relabelling* — it renames the points but keeps the cycle shape (5.4a). Given two cycles of the same length, choose any $\sigma$ with $\sigma(a_i)=b_i$ to relabel one onto the other. Cycles of different lengths cannot be matched, since relabelling never changes the length.`,
      caption: String.raw`Left: the cycle $\tau$; right: $\sigma\tau\sigma^{-1}$, drawn with the points relabelled by $\sigma$ (colours follow the points, grey lines show $i\mapsto\sigma(i)$). Choose the lengths of $\tau$ and of the target $\mu$ in $S_6$ and press *Solve for σ*: for equal lengths a $\sigma$ is found and the picture matches $\mu$; for different lengths none exists — the readout counts all $720$ permutations $\sigma$ to prove it.`,
      deps: ['alg-5.4a'],
      refs: ['Judson §6.2'],
      tags: ['conjugation', 'permutations'],
      viz(v) {
        const n = 6, PERMS = allPerms(n);
        const kk = v.select('length of $\\tau$', [2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: String(k) })), '4', { onChange: () => { tau = randCycle(+kk.value, ++seed); solve(); } });
        const mm = v.select('length of $\\mu$', [2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: String(k) })), '4', { onChange: () => { mu = randCycle(+mm.value, ++seed); solve(); } });
        let seed = 5;
        const randCycle = (k, sd) => { const r = v.rng(sd), pts = idp(n); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; } return fromCycles(n, [pts.slice(0, k).map((x) => x + 1)]); };
        let tau = fromCycles(n, [[1, 2, 3, 4]]), mu = fromCycles(n, [[5, 2, 6, 1]]), sigma = idp(n);
        const cyc = (p) => cycles(p)[0] || [];
        const solve = () => {
          const A = cyc(tau), B = cyc(mu), r = v.rng(++seed);
          // σ(a_i) = b_{i+t} for a random shift t when lengths agree; otherwise a random σ
          const s2 = new Array(n).fill(-1), used = new Set();
          if (A.length === B.length) { const t = Math.floor(r() * B.length); A.forEach((a, i) => { s2[a] = B[(i + t) % B.length]; used.add(s2[a]); }); }
          const rest = idp(n).filter((x) => !used.has(x)); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
          for (let i = 0; i < n; i++) if (s2[i] < 0) s2[i] = rest.pop();
          sigma = s2;
        };
        solve();
        v.button('Solve for σ', () => solve());
        v.button('New τ', () => { tau = randCycle(+kk.value, ++seed); solve(); });
        v.button('New μ', () => { mu = randCycle(+mm.value, ++seed); solve(); });
        const s = v.stage({ x: [-1.7, 6.2], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1.6, minWidth: 330 });
        let info = null;
        v.render(() => {
          const conj = compose(sigma, compose(tau, inverse(sigma))), inv = inverse(sigma), c2 = [4.5, 0];
          // wires i -> σ(i)
          const L1 = (i) => at(i, n, 1), R1 = (i) => at(i, n, 1, c2);
          for (let i = 0; i < n; i++) { const [x0, y0] = L1(i), [x1, y1] = R1(sigma[i]); s.line(x0 + 0.1, y0, x1 - 0.1, y1, { color: EC[i % 8], width: 1.3, alpha: 0.4 }); }
          permCircle(v, s, tau, { c: [0, 0], R: 1, nodeColor: (i) => EC[i % 8], arrowColor: () => 'accent', r: 13 });
          permCircle(v, s, conj, { c: c2, R: 1, nodeColor: (j) => EC[inv[j] % 8], arrowColor: () => (conj.every((x, i) => x === mu[i]) ? 'green' : 'orange'), r: 13 });
          s.text('τ', 0, 1.4, { align: 'center', size: 15, weight: 700, color: 'accent' });
          s.text('στσ⁻¹', c2[0], 1.4, { align: 'center', size: 15, weight: 700, color: 'orange' });
          const match = conj.every((x, i) => x === mu[i]);
          let count = 0; for (const p of PERMS) { if (compose(p, compose(tau, inverse(p))).every((x, i) => x === mu[i])) count++; }
          info = { conj, match, count };
        });
        v.readout(() => {
          const { conj, match, count } = info, k = cyc(tau).length, m = cyc(mu).length;
          return String.raw`$\tau=${cycTex(tau)}$ (length ${k}), $\mu=${cycTex(mu)}$ (length ${m}), $\sigma=${sigma.map((x) => x + 1).join('')}$ (one-line notation). Then $\sigma\tau\sigma^{-1}=${cycTex(conj)}$ ${match ? '$=\\mu$ ✓' : '$\\neq\\mu$'}. Among all $720$ permutations $\sigma\in S_6$, exactly **${count}** satisfy $\sigma\tau\sigma^{-1}=\mu$${k === m ? ` (= $${k}\\cdot ${6 - k}!$: the $${k}$ rotations of the cycle times the $${6 - k}!$ rearrangements of the fixed points)` : ': the lengths differ, so none can'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.16a
    {
      num: '6.16a',
      kind: 'Definition',
      name: 'Euler φ-function',
      statement: String.raw`For a positive integer $n$ the **Euler $\varphi$-function** $\varphi(n)$ counts the integers $m$ with $1\le m<n$ that are relatively prime to $n$ (and $\varphi(1)=1$). If $p$ is prime, $\varphi(p)=p-1$; more generally $\varphi(n)=n\prod_{p\mid n}(1-\tfrac1p)$.`,
      idea: String.raw`Relatively prime means $\gcd(m,n)=1$ (2.9a). For a prime power $p^e$ the integers not coprime to it are the multiples of $p$, which are a fraction $1/p$ of all, and the Chinese remainder theorem (Chapter 16) combines different primes multiplicatively. The count appears in Chapter 6 because it is the order of the group of units $U(n)$ (6.17).`,
      caption: String.raw`Drag $n$: on the clock the residues $1,\dots,n-1$ coprime to $n$ light up in gold ($n$ itself sits at the top, at the same place as $0$). The bar chart shows $\varphi(n)$ for $2\le n\le 100$; primes (green) reach the diagonal $n-1$. Click a bar to jump to that $n$.`,
      credit: 'introduced by L. Euler (1763); the symbol φ is from C. F. Gauss’s Disquisitiones Arithmeticae (1801)',
      deps: ['alg-2.9a'],
      see: ['nt-2.7'],
      refs: ['Judson §6.3'],
      tags: ['euler phi', 'coprime'],
      viz(v) {
        const N = v.slider('$n$', 2, 100, 36, { int: true });
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 360, weight: 1.1, minWidth: 280 });
        const b = v.stage({ x: [0, 101], y: [0, 100], axes: 'box', gutter: true, height: 360, weight: 1.3, minWidth: 280, xlabel: 'n', ylabel: 'φ(n)' });
        b.onClick((x) => { N.set(Math.max(2, Math.min(100, Math.round(x)))); });
        v.render(() => {
          const n = N.value, r = n <= 30 ? 14 : n <= 60 ? 9 : 5.5;
          s.circle(0, 0, 1, { color: 'faint', width: 1, fill: false });
          for (let k = 0; k < n; k++) {
            const [x, y] = at(k, n, 1), lit = k > 0 && gcd(k, n) === 1;
            if (lit) s.dot(x, y, { r, color: 'gold' }); else s.dot(x, y, { r, color: k === 0 ? 'red' : 'muted', hollow: true, width: 1.4, alpha: k === 0 ? 1 : 0.7 });
            if (n <= 40) s.text(k === 0 ? String(n) : String(k), x, y, { align: 'center', size: n <= 24 ? 12 : 9.5, weight: 700, color: lit ? 'panel' : 'ink', halo: false });
          }
          s.text(`φ(${n}) = ${phi(n)}`, 0, 0, { align: 'center', size: 22, weight: 700, color: 'ink' });
          s.setTitle('residues coprime to $n$');
          b.setTicks([0, 20, 40, 60, 80, 100].map((x) => [x, String(x)]), null);
          for (let m = 2; m <= 100; m++) { const f = phi(m); b.rect(m - 0.42, 0, m + 0.42, f, { fill: m === n ? 'gold' : isPrime(m) ? 'green' : 'accent', fillAlpha: m === n ? 0.95 : 0.45, stroke: false }); }
          b.line(2, 1, 100, 99, { color: 'muted', dash: [4, 4], alpha: 0.6 });
        });
        v.readout(() => {
          const n = N.value, f = phi(n), fac = v.M.factor(n), formula = fac.reduce((acc, [p]) => (acc / p) * (p - 1), n);
          return String.raw`$n=${n}=${fac.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join('\\cdot ')}$. Counted directly: $\varphi(${n})=\mathbf{${f}}$. Product formula: $${n}\prod(1-1/p)=${n}${fac.map(([p]) => `\\cdot\\tfrac{${p - 1}}{${p}}`).join('')}=${formula}$ ${formula === f ? '✓' : '✗'}${isPrime(n) ? `. $n$ is prime, so $\\varphi(n)=n-1$: every nonzero residue is coprime.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.17
    {
      num: '6.17',
      kind: 'Theorem',
      name: '|U(n)| = φ(n)',
      statement: String.raw`For every integer $n>1$ the group of units $U(n)$ of $\mathbb Z_n$ has exactly $\varphi(n)$ elements: $U(n)=\{a\in\mathbb Z_n : \gcd(a,n)=1\}$.`,
      idea: String.raw`$U(n)$ consists of the residues $a$ that have a multiplicative inverse mod $n$ (3.11a). If $\gcd(a,n)=1$ then $ax+ny=1$ for some integers (2.11), so $ax\equiv1\pmod n$ and $a$ is a unit; conversely $ax\equiv1$ gives $ax-1=ny$, which forces $\gcd(a,n)=1$. So the units are exactly the residues counted by $\varphi(n)$.`,
      caption: String.raw`Drag $n$. Left: the clock with the residues coprime to $n$ lit. Right: the multiplication table of $\mathbb Z_n$: a row is shaded green exactly when it contains a $1$ (that $1$ is the product $a\cdot a^{-1}$, and its column is the inverse). The shaded rows are precisely the lit residues, and their number is $\varphi(n)$.`,
      deps: ['alg-6.16a', 'alg-3.11a', 'alg-2.11'],
      refs: ['Judson §6.3'],
      tags: ['units', 'euler phi'],
      viz(v) {
        const N = v.slider('$n$', 2, 16, 12, { int: true });
        const s = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, axes: false, height: 360, weight: 0.9, minWidth: 250 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.3, minWidth: 280 });
        const T = v.table(t, { rows: 16, cols: 16, maxCell: 30, size: 11, margin: 6 });
        v.render(() => {
          const n = N.value;
          for (let k = 0; k < n; k++) { const [x, y] = at(k, n, 1), lit = k > 0 && gcd(k, n) === 1 || n === 1; s.dot(x, y, { r: 14, color: lit ? 'gold' : 'muted', hollow: !lit, width: 1.4, alpha: lit ? 1 : 0.7 }); s.text(String(k), x, y, { align: 'center', size: 12, weight: 700, color: lit ? 'panel' : 'ink', halo: false }); }
          s.text(`φ(${n}) = ${phi(n)}`, 0, 0, { align: 'center', size: 21, weight: 700, color: 'ink' });
          s.setTitle('residues coprime to $n$');
          const has1 = (a) => { for (let b = 0; b < n; b++) if ((a * b) % n === 1) return true; return false; };
          T.draw({
            rows: n, cols: n, rowLabels: (i) => String(i), colLabels: (j) => String(j), cornerLabel: '$\\cdot$',
            value: (i, j) => String((i * j) % n),
            fill: (i, j) => ((i * j) % n === 1 % n && n > 1 ? ['green', 0.65] : has1(i) ? ['green', 0.18] : null),
          });
        });
        v.readout(() => {
          const n = N.value, units = []; for (let a = 0; a < n; a++) { for (let b = 0; b < n; b++) if ((a * b) % n === 1) { units.push(a); break; } }
          const lit = [...Array(n).keys()].filter((k) => k > 0 && gcd(k, n) === 1), closed = units.every((a) => units.every((b) => units.includes((a * b) % n)));
          return String.raw`Rows containing a $1$ (the units): $\{${units.join(',\\,')}\}$ — **${units.length}** of them. Residues coprime to $${n}$: **${lit.length}** $=\varphi(${n})$ ${units.length === lit.length && units.every((u, i) => u === lit[i]) ? '✓ the same set' : '✗'}. The units are closed under multiplication ${closed ? '✓' : '✗'}, so $|U(${n})|=\varphi(${n})=${phi(n)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.18
    {
      num: '6.18',
      kind: 'Theorem',
      name: 'Euler’s theorem',
      statement: String.raw`Let $a$ and $n$ be integers with $n>0$ and $\gcd(a,n)=1$. Then $a^{\varphi(n)}\equiv1\pmod n$.`,
      idea: String.raw`The class of $a$ is an element of the group $U(n)$, which has order $\varphi(n)$ (6.17). By 6.11 the order $d$ of $a$ in this group divides $\varphi(n)$, so $a^{\varphi(n)}=(a^{d})^{\varphi(n)/d}=1$ in $U(n)$. If $\gcd(a,n)>1$ the class of $a$ is not in the group and the conclusion can fail.`,
      credit: 'L. Euler, 1763 (composite moduli; Fermat’s case of a prime modulus was proved by Euler in 1736)',
      scope: String.raw`Requires $\gcd(a,n)=1$.`,
      caption: String.raw`Choose $n$ and click a residue $a$ on the clock (or a bar). The gold path follows $a,a^2,a^3,\dots \pmod n$. For $a$ coprime to $n$ it returns to $1$ after $d$ steps and $d$ divides $\varphi(n)$ (bars: the order of every unit, dashed line: $\varphi(n)$). Pick a non-unit — the path never reaches $1$.`,
      deps: ['alg-6.17', 'alg-6.11'],
      see: ['nt-2.8'],
      refs: ['Judson §6.3'],
      tags: ['euler theorem', 'units'],
      viz(v) {
        const N = v.slider('$n$', 2, 40, 15, { int: true });
        const A = v.slider('$a$', 1, 40, 2, { int: true });
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 380, weight: 1.2, minWidth: 280 });
        const b = v.stage({ x: [0, 41], y: [0, 40], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xlabel: 'unit u mod n', ylabel: 'order of u' });
        s.onClick((x, y) => { const n = N.value; let best = -1, bd = 1e9; for (let k = 0; k < n; k++) { const [px, py] = at(k, n, 1), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = k; } } if (best > 0) A.set(best); });
        b.onClick((x) => { const k = Math.round(x); if (k >= 1 && k < N.value && gcd(k, N.value) === 1) A.set(k); });
        const ordU = (u, n) => { let x = u % n, k = 1; while (x !== 1 % n && k <= n) { x = (x * u) % n; k++; } return x === 1 % n ? k : 0; };
        v.render(() => {
          const n = N.value, aa = Math.min(A.value, n - 1), r = n <= 20 ? 14 : 9, ph = phi(n);
          const path = [1 % n]; let x = 1 % n; const seen = new Set([x]);
          for (let k = 0; k < 2 * n; k++) { x = (x * aa) % n; path.push(x); if (seen.has(x) && x === 1 % n) break; if (seen.has(x)) break; seen.add(x); }
          for (let k = 0; k < n; k++) { const [px, py] = at(k, n, 1), unit = k > 0 && gcd(k, n) === 1; s.dot(px, py, { r, color: path.includes(k) ? 'gold' : unit ? 'accent' : 'muted', hollow: !unit && !path.includes(k), width: 1.4, alpha: unit || path.includes(k) ? 1 : 0.6 }); s.text(String(k), px, py, { align: 'center', size: n <= 20 ? 12 : 9, weight: 700, color: unit || path.includes(k) ? 'panel' : 'ink', halo: false }); }
          for (let k = 0; k + 1 < path.length; k++) if (path[k] !== path[k + 1]) curvedArrow(s, at(path[k], n, 1), at(path[k + 1], n, 1), { color: 'red', width: 2, bend: 0.18, trim: r + 2, alpha: 0.9 });
          s.text(`φ(${n}) = ${ph}`, 0, 0.12, { align: 'center', size: 20, weight: 700, color: 'ink' });
          s.text(`a = ${aa}`, 0, -0.18, { align: 'center', size: 15, color: 'muted' });
          s.setTitle(`powers of $a=${aa}$ modulo $${n}$`);
          const us = [...Array(n).keys()].filter((k) => k > 0 && gcd(k, n) === 1), mx = Math.max(ph, 2);
          b.setView([0, n + 1], [0, mx * 1.2 + 1]);
          b.setTicks([...Array(Math.min(n, 12)).keys()].map((i) => { const k = Math.ceil(((i + 1) * n) / Math.min(n, 12)); return [k, String(k)]; }), null);
          us.forEach((u) => { const o = ordU(u, n); b.rect(u - 0.38, 0, u + 0.38, o, { fill: u === aa ? 'gold' : 'accent', fillAlpha: u === aa ? 0.85 : 0.4, stroke: false }); });
          b.hline(ph, { color: 'green', dash: true, width: 1.8 });
          b.text(`φ(n) = ${ph}`, n + 0.6, ph, { dy: -9, align: 'right', size: 12, weight: 700, color: 'green' });
        });
        v.readout(() => {
          const n = N.value, aa = Math.min(A.value, n - 1), ph = phi(n), g = gcd(aa, n), val = modpow(aa, ph, n);
          if (g === 1) { let d = 1, x = aa % n; while (x !== 1 % n) { x = (x * aa) % n; d++; } return String.raw`$\gcd(${aa},${n})=1$. The powers of $${aa}$ return to $1$ after $d=${d}$ steps, and $${d}$ divides $\varphi(${n})=${ph}$ ($${ph}=${d}\cdot ${ph / d}$). Hence $${aa}^{${ph}}\equiv ${val}\pmod{${n}}$ ✓.`; }
          return String.raw`$\gcd(${aa},${n})=${g}>1$: $${aa}$ is not a unit, the powers never come back to $1$, and $${aa}^{\varphi(${n})}=${aa}^{${ph}}\equiv ${val}\not\equiv1\pmod{${n}}$ — the hypothesis $\gcd(a,n)=1$ is needed.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.19
    {
      num: '6.19',
      kind: 'Theorem',
      name: 'Fermat’s little theorem',
      statement: String.raw`Let $p$ be a prime number. For every integer $a$ we have $a^p\equiv a\pmod p$; and if $p\nmid a$ then $a^{p-1}\equiv1\pmod p$.`,
      idea: String.raw`If $p\nmid a$, then $\gcd(a,p)=1$ and $\varphi(p)=p-1$, so Euler’s theorem (6.18) gives $a^{p-1}\equiv1$; multiplying by $a$ gives $a^p\equiv a$. If $p\mid a$ both sides are $0$ mod $p$. Judson obtains the statement as the prime case of Euler’s theorem.`,
      credit: 'P. de Fermat, stated in a letter of 18 October 1640 without proof; first published proof by L. Euler, 1736 (printed 1741)',
      scope: String.raw`$p$ must be prime: for composite $n$ the congruence $a^{n-1}\equiv 1$ usually fails (rare composites, the Carmichael numbers such as $561$, satisfy $a^n\equiv a$ for all $a$ anyway).`,
      caption: String.raw`Left: for each $n$ (vertical) and residue $a$ (horizontal) the cell shows $a^{n-1}\bmod n$: green if it equals $1$, red otherwise, grey for $a=0$. Prime rows are solid green. Right: the points $(b,\,b^n\bmod n)$ lie on the diagonal for every prime $n$ — the map $b\mapsto b^p$ fixes every residue, including $0$. Drag $n$ (try $561$).`,
      deps: ['alg-6.18'],
      see: ['nt-2.5'],
      refs: ['Judson §6.3'],
      tags: ['fermat', 'primes'],
      viz(v) {
        const NMAX = 120;
        const N = v.slider('$n$', 2, 600, 13, { int: true });
        v.button('n = 561', () => N.set(561));
        v.button('n = 341', () => N.set(341));
        const grid = []; for (let n = 2; n <= NMAX; n++) { const row = []; for (let a = 0; a < n; a++) row.push(a === 0 ? 0 : modpow(a, n - 1, n)); grid[n] = row; }
        const s = v.stage({ x: [-1, NMAX], y: [1, NMAX + 1], axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 270, xlabel: 'residue a', ylabel: 'modulus n' });
        const t = v.stage({ x: [-1, 8], y: [-1, 8], axes: 'box', gutter: true, equal: false, height: 380, weight: 1, minWidth: 250, xlabel: 'b', ylabel: 'b^n mod n' });
        s.onClick((x, y) => { const n = Math.floor(y); if (n >= 2 && n <= NMAX) N.set(n); });
        v.render(() => {
          const n = N.value;
          s.raster((x, y) => { const m = Math.floor(y), a = Math.floor(x); if (m < 2 || m > NMAX || a < 0 || a >= m) return null; const val = grid[m][a]; return val === 1 ? v.rgb('green') : val === 0 ? v.rgb('muted') : v.rgb('red'); }, { res: 2, key: 'fermat' });
          s.axes();
          if (n <= NMAX) s.rect(0, n, n, n + 1, { fill: false, color: 'ink', width: 2 });
          s.setTitle('$a^{n-1}\\bmod n$: green = 1, red ≠ 1, grey = 0');
          t.setView([-n * 0.04, n * 1.04], [-n * 0.04, n * 1.04]);
          t.line(0, 0, n, n, { color: 'muted', dash: [4, 4], alpha: 0.7 });
          const pts = [], bad = [];
          for (let b = 0; b < n; b++) { const y = modpow(b, n, n); (y === b % n ? pts : bad).push([b, y]); }
          const r = n > 200 ? 1.8 : n > 60 ? 2.5 : 4;
          t.dots(pts, { r, color: 'green' }); t.dots(bad, { r, color: 'red' });
          t.setTitle(`$b\\mapsto b^{${n}}\\bmod ${n}$ for $b=0,\\dots,${n - 1}$`);
        });
        v.readout(() => {
          const n = N.value; let fixed = 0, ones = 0, units = 0;
          for (let b = 0; b < n; b++) { if (modpow(b, n, n) === b % n) fixed++; if (gcd(b, n) === 1 && b > 0) { units++; if (modpow(b, n - 1, n) === 1) ones++; } }
          const prime = isPrime(n);
          return String.raw`$n=${n}$ is ${prime ? '**prime**' : 'composite'}. $b^{n}\equiv b$ for **${fixed}** of the ${n} residues; $b^{n-1}\equiv1$ for ${ones} of the ${units} units $b$. ${prime ? 'All of them, as Fermat’s little theorem predicts ✓ (and $b=0$ is fixed too).' : fixed === n ? `This composite $n$ passes every test $b^n\\equiv b$ — it is a Carmichael number (561 is the smallest).` : 'Composite: the theorem’s conclusion fails for some residues.'}`;
        });
      },
    },
  ],
};
