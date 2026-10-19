// Abstract Algebra (Judson) — Chapter 6: Cosets and Lagrange’s Theorem
// Part 1 (this file): cosets, when two are equal, the partition into cosets, the index, left = right in number,
// equal size and Lagrange’s theorem (6.1a–6.10).
// Part 2 (ch06-b.js): consequences of Lagrange, A₄ has no subgroup of order 6, conjugate cycles, the Euler φ-function,
// Euler’s theorem and Fermat’s little theorem (6.11–6.19).
import { useLab, cgStage, drawCG, hitNode, cosetOf, cosetClasses, sameSet, isSub, cosetColor, cosetTex, setTex, subTex, badSubset, divisors, curvedArrow, subgroupTest, getGroup } from './ch06.shared.js';

const plainSet = (A, S) => `{${[...S].map((i) => A.plain[i]).join(', ')}}`;

export default {
  collection: 'alg',
  chapter: 6,
  title: 'Cosets and Lagrange’s Theorem',
  summary: String.raw`Translating a subgroup $H$ by the elements of the group produces its cosets, which tile $G$ into pieces that all have the size of $H$. Counting the pieces gives Lagrange’s theorem — the order of a subgroup divides the order of the group — with immediate consequences for the orders of elements and for groups of prime order, and a counterexample ($A_4$ has no subgroup of order $6$) showing that the converse fails. Applied to the group of units mod $n$, the same count yields Euler’s theorem and Fermat’s little theorem.`,
  items: [
    // ------------------------------------------------------------------ 6.1a
    {
      num: '6.1a',
      kind: 'Definition',
      name: 'Left and right cosets',
      statement: String.raw`Let $H$ be a subgroup of a group $G$ and $g\in G$. The **left coset** of $H$ with representative $g$ is the set $gH=\{gh : h\in H\}$, and the **right coset** is $Hg=\{hg : h\in H\}$. In an additive group such as $\mathbb Z_n$ both are written $g+H$. A coset is a *subset* of $G$ (usually not a subgroup); $eH=H=He$ is the coset of the identity. For a non-abelian group $gH$ and $Hg$ may differ.`,
      idea: String.raw`A left coset is $H$ pushed around the group by left multiplication by $g$: every element $h$ of $H$ is sent to $gh$. The cosets of the form $gH$ are what an equivalence relation on $G$ will later cut the group into (6.4); only when $H$ is normal (Chapter 10) do the left and right pieces agree for every $g$. The definition needs just the subgroup axioms of 3.23a: closure and inverses inside $H$ are what make the pieces behave.`,
      caption: String.raw`Click a node to choose $g$ and step through the subgroups with the buttons. The gold ring marks $g$; the orange nodes are $gH$ (blue rings: $H$ itself). Switch to right cosets: for $S_3$ with $H=\langle(1\,2)\rangle$ the two pictures differ. *All cosets* colours the whole Cayley graph — the pieces never overlap.`,
      deps: ['alg-3.23a'],
      refs: ['Judson §6.1'],
      tags: ['cosets', 'subgroups'],
      viz(v) {
        const side = v.select('Cosets', [{ value: 'L', label: 'left $gH$' }, { value: 'R', label: 'right $Hg$' }], 'L');
        const mode = v.select('Paint', [{ value: 'one', label: 'one coset' }, { value: 'all', label: 'all cosets' }], 'one');
        const L = useLab(v, ['S3', 'Z12', 'D4', 'A4'], { group: 'S3', g: 3 });
        v.button('Next coset', () => { const cl = cosetClasses(L.G, L.H(), side.value), k = (cl.of[L.g] + 1) % cl.length; L.g = cl[k][0]; });
        const s = cgStage(v, { height: 380 });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0) L.g = i; });
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(), cl = cosetClasses(G, H, side.value), m = cl.length, cur = cl.of[L.g] ?? 0;
          if (L.g >= G.n) L.g = 0;
          const inH = new Set(H), all = mode.value === 'all';
          drawCG(v, s, A, {
            fill: (i) => (all ? cosetColor(v, cl.of[i], m) : cl.of[i] === cur ? 'orange' : null),
            ring: (i) => (i === L.g ? 'gold' : !all && inH.has(i) ? 'accent' : null),
          });
          s.setTitle(`${side.value === 'L' ? 'left' : 'right'} cosets of $H$ in $${A.tex}$`);
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(), g = L.g, C = cosetOf(G, H, g, side.value), Lc = cosetOf(G, H, g, 'L'), Rc = cosetOf(G, H, g, 'R'), m = cosetClasses(G, H, side.value).length;
          return String.raw`$H=${subTex(G, H)}$ has ${H.length} elements, so $G$ has $${m}$ ${side.value === 'L' ? 'left' : 'right'} cosets. With $g=${G.L[g]}$: $${cosetTex(A, g, side.value)}=${setTex(G, C)}$ (${C.length} elements). ${sameSet(Lc, Rc) ? `For this $g$ the left and right cosets are the same set.` : `For this $g$ the left coset $${setTex(G, Lc)}$ and the right coset $${setTex(G, Rc)}$ are **different** sets.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Lemma',
      name: 'When two cosets are equal',
      statement: String.raw`Let $H$ be a subgroup of $G$ and $g_1,g_2\in G$. The following conditions are equivalent:
(a) $g_1H=g_2H$;
(b) $Hg_1^{-1}=Hg_2^{-1}$;
(c) $g_1H\subseteq g_2H$;
(d) $g_2\in g_1H$;
(e) $g_1^{-1}g_2\in H$.`,
      idea: String.raw`Everything reduces to (e). If $g_1^{-1}g_2=h\in H$ then $g_2=g_1h\in g_1H$ (d), and then $g_2H=g_1hH=g_1H$ because $hH=H$ (a subgroup is closed under multiplication and inverses). Conversely (c) puts $g_1=g_2h$ and (d) puts $g_2=g_1h$ for some $h$, so $g_1^{-1}g_2=h\in H$. Condition (b) is (a) with inverses applied: $(g_1H)^{-1}=Hg_1^{-1}$.`,
      caption: String.raw`Choose which of $g_1$ (blue) and $g_2$ (orange) a click moves, then click nodes — or step the subgroup. Green nodes lie in both cosets. The five lamps are computed separately from the definitions: they always light together or go dark together. The readout re-checks all $|G|^2$ pairs for the current $H$.`,
      deps: ['alg-6.1a'],
      refs: ['Judson §6.1'],
      tags: ['cosets', 'equivalence'],
      viz(v) {
        const mov = v.select('A click moves', [{ value: '1', label: '$g_1$' }, { value: '2', label: '$g_2$' }], '2');
        const L = useLab(v, ['S3', 'D4', 'A4', 'D6'], { group: 'S3', g: 3, g2: 5 });
        const s = cgStage(v, { weight: 1.3, height: 340 });
        const w = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, minWidth: 250 });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0) { if (mov.value === '1') L.g = i; else L.g2 = i; } });
        const ROWS = ['$g_1H=g_2H$', '$Hg_1^{-1}=Hg_2^{-1}$', '$g_1H\\subseteq g_2H$', '$g_2\\in g_1H$', '$g_1^{-1}g_2\\in H$'];
        const test = (G, H, a, b) => {
          const A1 = cosetOf(G, H, a), A2 = cosetOf(G, H, b), B1 = cosetOf(G, H, G.inv[a], 'R'), B2 = cosetOf(G, H, G.inv[b], 'R');
          return [sameSet(A1, A2), sameSet(B1, B2), isSub(A1, A2), A1.includes(b), H.includes(G.T[G.inv[a]][b])];
        };
        let truth = [];
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(); if (L.g >= G.n) L.g = 0; if (L.g2 >= G.n) L.g2 = 1;
          const C1 = cosetOf(G, H, L.g), C2 = cosetOf(G, H, L.g2);
          drawCG(v, s, A, { fill: (i) => (C1.includes(i) && C2.includes(i) ? 'green' : C1.includes(i) ? 'blue' : C2.includes(i) ? 'orange' : null), ring: (i) => (i === L.g ? 'blue' : i === L.g2 ? 'orange' : null) });
          for (const [g, name, col] of [[L.g, 'g₁', 'blue'], [L.g2, 'g₂', 'orange']]) { const [x, y] = A.pos[g]; s.text(name, x, y, { dy: g === L.g && L.g === L.g2 ? 30 : -27, align: 'center', size: 13, weight: 700, color: col }); }
          s.setTitle('cosets $g_1H$ (blue) and $g_2H$ (orange)');
          truth = test(G, H, L.g, L.g2);
          const all = truth.every(Boolean) || truth.every((x) => !x);
          ROWS.forEach((r, i) => {
            const y = 0.86 - i * 0.165;
            w.dot(0.09, y, { r: 11, color: truth[i] ? 'green' : 'muted', hollow: !truth[i], width: 2 });
            w.text(truth[i] ? '✓' : '', 0.09, y, { align: 'center', size: 13, weight: 700, color: 'panel', halo: false });
            w.text(r, 0.2, y, { align: 'left', size: 16, color: truth[i] ? 'ink' : 'muted' });
          });
          w.text(all ? 'all five agree' : 'DISAGREE', 0.5, 0.03, { align: 'center', size: 13, weight: 700, color: all ? 'green' : 'red' });
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(); let bad = 0;
          for (let a = 0; a < G.n; a++) for (let b = 0; b < G.n; b++) { const t = test(G, H, a, b); if (!(t.every(Boolean) || t.every((x) => !x))) bad++; }
          const t = truth.every(Boolean);
          return String.raw`$g_1=${G.L[L.g]}$, $g_2=${G.L[L.g2]}$, $g_1^{-1}g_2=${G.L[G.T[G.inv[L.g]][L.g2]]}$ is ${t ? '' : '**not** '}in $H=${subTex(G, H)}$, so the cosets are ${t ? '**equal**' : '**disjoint** (not equal)'}. Checked all ${G.n * G.n} pairs $(g_1,g_2)$ for this $H$: the five conditions disagree on ${bad} of them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Theorem',
      name: 'The left cosets of H partition G',
      statement: String.raw`Let $H$ be a subgroup of a group $G$. The left cosets of $H$ are pairwise disjoint or equal, and their union is $G$: they form a partition of $G$. The same holds for right cosets. Equivalently, $g_1\sim g_2 \iff g_1^{-1}g_2\in H$ is an equivalence relation on $G$ whose classes are the left cosets.`,
      idea: String.raw`By Lemma 6.3, $g_1H=g_2H$ exactly when $g_1^{-1}g_2\in H$. That relation is reflexive ($e\in H$), symmetric (inverses) and transitive (closure) — and these are the subgroup axioms again. An equivalence relation cuts its set into classes (1.25), and the class of $g$ is $gH$. So every element lies in exactly one coset, its own.`,
      caption: String.raw`Press *Paint next coset*: the lowest unpainted element $g$ is picked (gold ring) and the whole set $gH$ is painted in a new colour. No node is ever painted twice and none is left blank at the end. Now switch on *H is not a subgroup*: the set $S=\{e,a,b\}$ is not closed, and its translates $gS$ overlap (red rings) — the subgroup axioms are exactly what the partition needs.`,
      deps: ['alg-6.3', 'alg-1.25'],
      refs: ['Judson §6.1'],
      tags: ['cosets', 'partition'],
      viz(v) {
        let k = 2;
        const bad = v.toggle('H is not a subgroup', false, { onChange: () => { k = 2; } });
        const L = useLab(v, ['D4', 'S3', 'Z12', 'A4', 'D6'], { group: 'D4', g: 0, onChange: () => { k = 2; } });
        v.button('Paint next coset', () => { k += 1; });
        v.button('Reset', () => { k = 0; });
        const s = cgStage(v, { height: 380 });
        const planOf = () => {
          const G = L.G, S = bad.value ? badSubset(G) : L.H(), seen = new Array(G.n).fill(0), steps = [];
          for (let g = 0; g < G.n; g++) { if (seen[g]) continue; const set = [...new Set(S.map((h) => G.T[g][h]))].sort((a, b) => a - b); const over = set.filter((x) => seen[x]); set.forEach((x) => { seen[x]++; }); steps.push({ g, set, over }); }
          return { S, steps };
        };
        let info = null;
        v.render(() => {
          const A = L.A, G = A.G, P = planOf(), m = P.steps.length; k = Math.max(0, Math.min(k, m));
          const owner = new Array(G.n).fill(-1), dbl = new Set();
          P.steps.slice(0, k).forEach((st, j) => st.set.forEach((x) => { if (owner[x] >= 0) dbl.add(x); else owner[x] = j; }));
          const cur = k > 0 ? P.steps[k - 1] : null;
          drawCG(v, s, A, { fill: (i) => (owner[i] >= 0 ? cosetColor(v, owner[i], m) : null), ring: (i) => (dbl.has(i) ? 'red' : cur && i === cur.g ? 'gold' : k === 0 && P.S.includes(i) ? 'accent' : null) });
          s.setTitle(bad.value ? 'translates $gS$ of a set $S$ that is not a subgroup' : 'left cosets $gH$ painted one at a time');
          info = { P, k, m, dbl: dbl.size, painted: owner.filter((x) => x >= 0).length };
        });
        v.readout(() => {
          const { P, k, m, dbl, painted } = info, A = L.A, G = A.G;
          if (bad.value) {
            const fail = subgroupTest(G, P.S);
            return String.raw`$S=${setTex(G, P.S)}$ is not a subgroup: ${fail.close ? `$${G.L[fail.close[0]]}\\cdot ${G.L[fail.close[1]]}=${G.L[G.T[fail.close[0]][fail.close[1]]]}\\notin S$` : 'it fails a subgroup axiom'}. After ${k} of ${m} translates, ${painted} of ${G.n} elements are painted and **${dbl}** of them have been painted twice (red rings) — the translates are neither disjoint nor equal.`;
          }
          return String.raw`$H=${subTex(G, P.S)}$: after ${k} of ${m} cosets, ${painted} of ${G.n} elements are painted, ${dbl} twice. ${k === m ? `All ${G.n} elements are painted **exactly once**: the ${m} cosets partition $G$.` : `Painting continues until the ${m} cosets of size ${P.S.length} cover $G$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5a
    {
      num: '6.5a',
      kind: 'Definition',
      name: 'Index [G : H]',
      statement: String.raw`If $H$ is a subgroup of $G$, the **index** of $H$ in $G$, written $[G:H]$, is the number of distinct left cosets of $H$ in $G$. For a finite group (and any $H$) it is a positive integer; for infinite groups it may be infinite (e.g. $[\mathbb Z:n\mathbb Z]=n$ but $[\mathbb Z:\{0\}]=\infty$).`,
      idea: String.raw`The index measures how much room $H$ leaves in $G$: $H=G$ has index $1$, and the trivial subgroup has index $|G|$. By 6.4 the left cosets partition $G$, so the index is well defined; Theorem 6.8 shows that counting right cosets gives the same number, and Lagrange’s theorem (6.10) will turn it into $|G|/|H|$.`,
      caption: String.raw`The left graph colours the cosets of the chosen subgroup, one colour per coset; the bar chart shows $[G:H]$ for every subgroup of $G$ (click a bar to select it, or use the buttons). Switch to right cosets: the number of colours does not change, even when the colouring does.`,
      deps: ['alg-6.1a'],
      refs: ['Judson §6.1'],
      tags: ['index', 'cosets'],
      viz(v) {
        const side = v.select('Cosets', [{ value: 'L', label: 'left' }, { value: 'R', label: 'right' }], 'L');
        const L = useLab(v, ['S3', 'Z12', 'D6', 'A4'], { group: 'S3' });
        const s = cgStage(v, { weight: 1.3, height: 360 });
        const b = v.stage({ x: [0.3, 17.7], y: [0, 13.2], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 250, xlabel: 'subgroup order |H|', ylabel: 'index [G : H]' });
        b.onClick((x) => { const i = Math.round(x) - 1; if (i >= 0 && i < L.A.subs.length) L.si = i; });
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(), cl = cosetClasses(G, H, side.value), m = cl.length;
          drawCG(v, s, A, { fill: (i) => cosetColor(v, cl.of[i], m) });
          s.setTitle(`${side.value === 'L' ? 'left' : 'right'} cosets: ${m} colours`);
          const K = A.subs.length;
          b.setView([0.3, K + 0.7], [0, G.n * 1.15]);
          b.setTicks(A.subs.map((S, i) => [i + 1, String(S.length)]), null);
          A.subs.forEach((S, i) => { const idx = G.n / S.length; b.rect(i + 0.6, 0, i + 1.4, idx, { fill: i === L.si ? 'accent' : 'faint', fillAlpha: i === L.si ? 0.55 : 0.3, color: i === L.si ? 'accent' : 'muted', width: i === L.si ? 2 : 1 }); b.text(String(idx), i + 1, idx, { dy: -9, align: 'center', size: 11, weight: i === L.si ? 700 : 500, color: i === L.si ? 'ink' : 'muted' }); });
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(), l = cosetClasses(G, H, 'L').length, r = cosetClasses(G, H, 'R').length;
          return String.raw`$|G|=${G.n}$, $|H|=${H.length}$, and $[G:H]=${l}$ left cosets (${r} right cosets). Here $|G|/|H|=${G.n / H.length}$ — the count of pieces times their size recovers the order of the group.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8',
      kind: 'Theorem',
      name: 'Left and right cosets are equally many',
      statement: String.raw`Let $H$ be a subgroup of $G$. The rule $gH\mapsto Hg^{-1}$ is a well-defined one-to-one correspondence between the set of left cosets of $H$ and the set of right cosets. Hence the number of left cosets equals the number of right cosets (which is why $[G:H]$ may be defined with either).`,
      idea: String.raw`Lemma 6.3 says $g_1H=g_2H \iff Hg_1^{-1}=Hg_2^{-1}$. Read left to right, the rule gives the same output for two names of one left coset (well defined); read right to left, different left cosets go to different right cosets (one-to-one). Every right coset $Hx$ is the image of $x^{-1}H$, so the map is onto. Equivalently it has the inverse $Hx\mapsto x^{-1}H$, so by 1.20 it is a bijection and the two sets have the same size.`,
      caption: String.raw`Left: the left cosets of $H$ in colours. Right: the right cosets, each painted with the colour of the left coset it is paired with by $gH\mapsto Hg^{-1}$. The two partitions differ for a non-normal $H$ (try $S_3$ with $H=\langle(1\,2)\rangle$), yet the colours match one to one. Click a node: the ring marks $g$ on the left and its partner $g^{-1}$ on the right.`,
      deps: ['alg-6.5a', 'alg-1.20'],
      refs: ['Judson §6.1'],
      tags: ['cosets', 'bijection'],
      viz(v) {
        const L = useLab(v, ['S3', 'D4', 'A4', 'D6'], { group: 'S3', g: 3 });
        const a = cgStage(v, { weight: 1, minWidth: 260, height: 330 }), b = cgStage(v, { weight: 1, minWidth: 260, height: 330 });
        a.onClick((x, y) => { const i = hitNode(a, L.A, x, y); if (i >= 0) L.g = i; });
        b.onClick((x, y) => { const i = hitNode(b, L.A, x, y); if (i >= 0) L.g = L.G.inv[i]; });
        let info = null;
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(); if (L.g >= G.n) L.g = 0;
          const lc = cosetClasses(G, H, 'L'), rc = cosetClasses(G, H, 'R'), m = lc.length;
          // partner of left coset k: the right coset containing g^{-1} for every g in it
          const partner = lc.map((C) => new Set(C.map((g) => rc.of[G.inv[g]])));
          const wd = partner.every((P) => P.size === 1), img = partner.map((P) => [...P][0]);
          const inj = new Set(img).size === m, onto = rc.length === m && img.every((x) => x >= 0);
          const colorOfRight = new Array(rc.length).fill(-1); img.forEach((r, k) => { colorOfRight[r] = k; });
          drawCG(v, a, A, { fill: (i) => cosetColor(v, lc.of[i], m), ring: (i) => (i === L.g ? 'ink' : null) });
          drawCG(v, b, A, { fill: (i) => cosetColor(v, colorOfRight[rc.of[i]], m), ring: (i) => (i === G.inv[L.g] ? 'ink' : null) });
          a.setTitle('left cosets $gH$'); b.setTitle('right cosets $Hg^{-1}$ coloured by partner');
          info = { m, mr: rc.length, wd, inj, onto, same: lc.every((C) => rc.some((R) => sameSet(C, R))), g: L.g };
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(), { m, mr, wd, inj, onto, same } = info;
          return String.raw`$H=${subTex(G, H)}$: **${m}** left cosets, **${mr}** right cosets. The rule $gH\mapsto Hg^{-1}$ is well defined ${wd ? '✓' : '✗'}, one-to-one ${inj ? '✓' : '✗'} and onto ${onto ? '✓' : '✗'}. The two partitions of $G$ are ${same ? '**identical** (here $gH=Hg$ for every $g$)' : '**different** partitions — equal in number, not in shape'}. With $g=${G.L[info.g]}$ the left coset is ${plainSet(A, cosetOf(G, H, info.g))} and the right coset $Hg^{-1}$ is ${plainSet(A, cosetOf(G, H, G.inv[info.g], 'R'))}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Proposition',
      name: 'Every coset has |H| elements',
      statement: String.raw`Let $H$ be a finite subgroup of $G$ and $g\in G$. Then the left coset $gH$ has exactly $|H|$ elements; the same is true of every right coset $Hg$. (For infinite $H$ the map below is still a one-to-one correspondence $H\to gH$.)`,
      idea: String.raw`The map $\lambda_g\colon H\to gH$, $h\mapsto gh$, is onto by the definition of $gH$. It is one-to-one by the cancellation laws (3.22): $gh_1=gh_2$ gives $h_1=h_2$ after multiplying by $g^{-1}$ on the left. A bijection between finite sets preserves the number of elements (1.20), so $|gH|=|H|$.`,
      caption: String.raw`The blue rings are $H$; every arrow is $h\mapsto gh$, landing on the orange nodes $gH$. Click a node to change $g$ and step through the subgroups: no two arrows ever land on the same node, and every orange node is hit. For $g\in H$ the arrows just shuffle $H$ among itself.`,
      deps: ['alg-6.1a', 'alg-1.20', 'alg-3.22'],
      refs: ['Judson §6.2'],
      tags: ['cosets', 'counting'],
      viz(v) {
        const L = useLab(v, ['S3', 'D4', 'Z12', 'A4'], { group: 'D4', g: 1 });
        const s = cgStage(v, { height: 380 });
        s.onClick((x, y) => { const i = hitNode(s, L.A, x, y); if (i >= 0) L.g = i; });
        let info = null;
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(); if (L.g >= G.n) L.g = 0;
          const C = cosetOf(G, H, L.g), inH = new Set(H);
          drawCG(v, s, A, { fill: (i) => (C.includes(i) ? 'orange' : null), ring: (i) => (inH.has(i) ? 'accent' : null) });
          const seen = new Map();
          H.forEach((h) => {
            const t = G.T[L.g][h]; seen.set(t, (seen.get(t) || 0) + 1);
            if (t !== h) curvedArrow(s, A.pos[h], A.pos[t], { color: 'ink', width: 1.8, bend: 0.14, trim: 16, alpha: 0.75 });
          });
          s.setTitle('$h\\mapsto gh$ carries $H$ (blue rings) onto $gH$ (orange)');
          info = { C, inj: seen.size === H.length && [...seen.values()].every((x) => x === 1) };
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(), { C, inj } = info;
          return String.raw`$g=${G.L[L.g]}$, $|H|=${H.length}$, $|gH|=${C.length}$. The ${H.length} products $gh$ are all different (cancellation) ${inj ? '✓' : '✗'} and fill $gH$ completely; the inverse map $x\mapsto g^{-1}x$ takes $gH$ back to $H$. Checked for every $g\in G$: $|gH|=|H|$ ${G.T.every((_, g) => cosetOf(G, H, g).length === H.length) ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Theorem',
      name: 'Lagrange’s theorem',
      statement: String.raw`Let $G$ be a finite group and $H$ a subgroup of $G$. Then $|G|/|H|=[G:H]$; in particular the order of $H$ divides the order of $G$.`,
      idea: String.raw`The left cosets of $H$ partition $G$ (6.4), so $|G|$ is the sum of the sizes of the pieces. Every piece has exactly $|H|$ elements (6.9), and by definition there are $[G:H]$ pieces (6.5a). Hence $|G|=[G:H]\cdot|H|$. The converse is false (6.15): a divisor of $|G|$ need not be the order of any subgroup.`,
      caption: String.raw`Left: the cosets of the chosen subgroup colour the group. Right: the same elements re-stacked — one row per coset, one column per element of $H$ — a rectangle of $[G:H]$ rows and $|H|$ columns, so $|G|=[G:H]\,|H|$. Step through all subgroups of $\mathbb Z_{12}$, $D_6$, $A_4$ and $U(15)$: the rectangle is always full. The readout lists the divisors of $|G|$ that are *not* the order of any subgroup — look at $A_4$.`,
      deps: ['alg-6.4', 'alg-6.9', 'alg-6.5a'],
      refs: ['Judson §6.2'],
      tags: ['lagrange', 'cosets', 'counting'],
      links: { source: 'https://twjudson.github.io/aata-files/aata-20230811.pdf#page=88' },
      viz(v) {
        const L = useLab(v, ['Z12', 'D6', 'A4', 'U15'], { group: 'Z12' });
        const s = cgStage(v, { weight: 1.2, height: 380 });
        const b = v.stage({ x: [0, 4], y: [0, 4], equal: true, axes: false, height: 380, weight: 1, minWidth: 250 });
        v.render(() => {
          const A = L.A, G = A.G, H = L.H(), cl = cosetClasses(G, H, 'L'), m = cl.length, h = H.length;
          drawCG(v, s, A, { fill: (i) => cosetColor(v, cl.of[i], m) });
          s.setTitle('cosets of $H$ colour $G$');
          b.setView([-0.9, h + 0.5], [-1.1, m + 0.6]);
          cl.forEach((C, r) => C.forEach((x, c) => {
            b.rect(c + 0.04, m - r - 1 + 0.04, c + 0.96, m - r - 0.04, { fill: cosetColor(v, r, m), fillAlpha: 0.85, stroke: false, radius: 4 });
            b.text(A.plain[x], c + 0.5, m - r - 0.5, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false });
          }));
          b.text(`|H| = ${h} columns`, h / 2, -0.55, { align: 'center', size: 13, weight: 700, color: 'ink' });
          b.text(`[G:H] = ${m} rows`, -0.12, m / 2, { align: 'right', size: 13, weight: 700, color: 'ink' });
          b.setTitle(`$|G| = [G:H]\\cdot|H| = ${m}\\cdot ${h} = ${G.n}$`);
        });
        v.readout(() => {
          const A = L.A, G = A.G, H = L.H(), orders = new Set(A.subs.map((S) => S.length)), miss = divisors(G.n).filter((d) => !orders.has(d));
          return String.raw`$|G|=${G.n}$, $|H|=${H.length}$ divides it and the quotient $${G.n / H.length}=[G:H]$ counts the cosets. All ${A.subs.length} subgroups of $${A.tex}$ have orders ${[...orders].sort((a, b) => a - b).join(', ')}, every one a divisor of ${G.n}. ${miss.length ? `Divisors of ${G.n} that are the order of **no** subgroup: ${miss.join(', ')}.` : `Here every divisor of ${G.n} is the order of some subgroup.`}`;
        });
      },
    },
  ],
};
