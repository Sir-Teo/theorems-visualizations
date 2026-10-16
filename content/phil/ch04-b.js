// Philosophy & Reasoning — Chapter 4 (part b): items 4.6–4.10

export default {
  collection: 'phil',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Paradox',
      name: 'Yablo’s paradox',
      statement: String.raw`Consider an infinite list of sentences $S_1,S_2,S_3,\dots$ where $S_n$ says: “every $S_m$ with $m>n$ is false.” Suppose $S_k$ is true. Then every later sentence is false. But $S_{k+1}$ says that all sentences after it are false, and they are (they are later than $S_k$), so $S_{k+1}$ is true: contradiction. So no $S_k$ is true. But then all of them are false, and in particular all sentences after $S_1$ are false, which is what $S_1$ says, so $S_1$ is true: contradiction again. No assignment of truth values is consistent, and no sentence mentions itself. If the list stops at a last sentence $S_N$, whose claim about the later ones is vacuously true, there is a unique consistent assignment: only $S_N$ true.`,
      idea: String.raw`The argument needs the T-schema for each sentence and an infinite descending *tail*: each sentence points only forward, never at itself, but no sentence is last, so the chain of “refer to later ones” never grounds out. Yablo took this to show that self-reference is not needed for paradox. The claim is disputed: Graham Priest has argued that the paradox hides a circularity, because the predicate “is false” that each $S_n$ applies to the later sentences must be defined by a fixed point that mentions the whole list, and other authors have reconstructed it to avoid any circular reference.`,
      caption: String.raw`Choose a hypothesis (either that one sentence $S_k$ is true, or that none is) and step through the consequences. The circles show the sentences, green for true and red for false, with “?” for undetermined. At the last step the checker looks at each sentence and compares its status with the status of what it claims; a clash is marked in orange. With the list **infinite**, every hypothesis ends in a clash. With the list **ending at $S_{12}$** the hypothesis “only $S_{12}$ true” is consistent: the last sentence says nothing about anything, and that breaks the chain.`,
      deps: ['phil-4.1'],
      refs: ['SEP “Liar Paradox”'],
      credit: 'Stephen Yablo, “Paradox without self-reference”, Analysis 53 (1993) 251–252 (an earlier form in J. Philosophical Logic 14, 1985)',
      scope: String.raw`Requires an infinite list (an $\omega$-sequence) of sentences and the T-schema. Whether the paradox is free of circularity is contested (Priest 1997, Analysis 57); this picture only checks consistency of truth-value assignments.`,
      tags: ['paradox', 'truth', 'infinity'],
      links: { sep: 'https://plato.stanford.edu/entries/liar-paradox/', paper: 'https://doi.org/10.1093/analys/53.4.251' },
      viz(v) {
        const mode = v.select('the list', [{ value: 'inf', label: 'infinite' }, { value: 'fin', label: 'ends at $S_{12}$' }], 'inf');
        const hyp = v.select('hypothesis', [{ value: 'k', label: '$S_k$ is true' }, { value: 'none', label: 'none is true' }], 'k');
        const kS = v.slider('$k$', 1, 12, 3, { int: true });
        const frames = [
          { k: 0, note: () => 'State the hypothesis.' },
          { k: 1, note: () => hyp.value === 'k' ? 'Since $S_k$ is true, everything after it is false.' : 'Take every sentence false.' },
          { k: 2, note: () => 'Check each sentence: is its status the status of what it claims?' },
        ];
        const S = v.steps({ frames, speed: 0.9, start: 0, still: 2 });
        const s = v.stage({ x: [0, 14.5], y: [0, 7], axes: false, height: 330, full: true });
        let info = {};
        function analyse() {
          const fin = mode.value === 'fin', M = fin ? 12 : 13, k = kS.value;
          const A = Array.from({ length: M + 1 }, (_, j) => (hyp.value === 'k' ? j === k : false));
          const claim = (i) => { for (let j = i + 1; j <= M; j++) if (A[j]) return false; return true; };
          let clash = null;
          for (let i = 1; i <= M; i++) if (claim(i) !== A[i]) { clash = i; break; }
          return { fin, M, k, A, claim, clash };
        }
        v.render(() => {
          const { fin, M, k, A, claim, clash } = analyse(), st = S.frame.k;
          const hk = hyp.value === 'k';
          kS.el.hidden = !hk;
          for (let i = 1; i <= M; i++) {
            const x = i * 1.05, y = 4;
            let val = null;
            if (st === 0) val = hk && i === k ? 'T' : null;
            else if (st === 1) val = hk ? (i === k ? 'T' : i > k ? 'F' : null) : 'F';
            else val = A[i] ? 'T' : 'F';
            const col = val === 'T' ? 'green' : val === 'F' ? 'red' : 'muted';
            const isClash = st === 2 && clash === i;
            s.dot(x, y, { r: 17, color: isClash ? 'orange' : col, fill: val ? col : 'muted', hollow: !val });
            s.text(val === 'T' ? 'T' : val === 'F' ? 'F' : '?', x, y, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: val ? 'panel' : 'muted', halo: false });
            s.tex(`S_{${i}}`, x, y - 0.8, { size: 13, color: 'ink' });
            if (st === 2) {
              s.text(claim(i) ? 'says: T' : 'says: F', x, y + 0.95, { align: 'center', size: 10.5, color: isClash ? 'orange' : 'muted', weight: isClash ? 700 : 400 });
              if (isClash) s.text('✗', x, y + 1.6, { align: 'center', size: 16, color: 'orange', weight: 700 });
            }
          }
          if (!fin) s.text('…  and so on forever', (M + 1.2) * 1.05, 4, { size: 14, color: 'muted' });
          else s.text('end', 12 * 1.05 + 0.95, 4, { size: 12, color: 'muted' });
          s.text(hk ? `Hypothesis: ${'$S_{' + k + '}$'} is true.` : 'Hypothesis: every sentence is false.', 0.4, 6.4, { size: 14, color: 'ink', weight: 600 });
          s.arrow(1.05, 2.2, M * 1.05, 2.2, { color: 'muted', width: 1.5 });
          s.text('each sentence speaks about all later ones', 7, 2.55, { align: 'center', size: 12, color: 'muted' });
          s.text('Each $S_n$ claims: “every later $S_m$ is false.”', 0.4, 0.8, { size: 13, color: 'muted' });
          info = { fin, clash, st, hk, k };
        });
        v.legend([['green', 'true', { dot: true }], ['red', 'false', { dot: true }], ['orange', 'clash', { dot: true }]]);
        v.readout(() => {
          const { fin, clash, st, hk, k } = info;
          if (st < 2) return 'Step to the end to run the check.';
          if (clash != null) return `**Clash at $S_{${clash}}$**: ${hk ? (clash === k + 1 ? `$S_{${k}}$ forces all later sentences false, so $S_{${clash}}$’s claim is correct and it should be true, but it was forced false.` : '') : '$S_1$’s claim (“all later are false”) is correct, so it should be true.'} ${fin ? '' : 'In the infinite list every hypothesis fails.'}`;
          return `**Consistent.** Only the last sentence is true: it claims nothing about later sentences, so the chain ends. Switch to the infinite list.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Paradox',
      name: 'The barber and Russell’s paradox',
      statement: String.raw`In a village, a barber shaves **exactly those villagers who do not shave themselves**. Does the barber shave himself? If he does, he is shaved by someone who shaves only non-self-shavers, so he does not. If he does not, then he is a non-self-shaver and is shaved by the barber, himself. So there is no such barber *in the village*: the description is contradictory, not paradoxical in the strict sense. The set-theoretic version is the real paradox: $R=\{x : x\notin x\}$ satisfies $R\in R \iff R\notin R$ (logic 1.6), and naive comprehension says $R$ exists. The barber argument is a diagonal argument on the relation “shaves”, and Russell’s paradox on the relation “$\in$”.`,
      idea: String.raw`Write the shaving relation as a square table of 0s and 1s, row $i$ recording whom villager $i$ shaves. The condition on the barber $b$ says that row $b$ is the table’s diagonal with every entry flipped. That cannot hold at the diagonal entry $(b,b)$, where the row and its flipped diagonal must disagree. So no row of *any* such table can equal the flipped diagonal, whatever the table is. For the barber the way out is easy: he does not exist, or lives outside the village. For sets, the corresponding escape means that $R$ is not a set, and naive comprehension must be restricted (Zermelo–Fraenkel, type theory).`,
      caption: String.raw`Row $i$ shows whom villager $i$ shaves (click cells to flip them). The grey row under the table is the flipped diagonal, the pattern the barber's row would need. Choose the barber $b$ and press **Make row $b$ obey the rule**: every entry is set to match except the cell on the diagonal, which cannot match whatever you put in it. Switch **barber lives outside the village** and the difficulty disappears: the barber has his own row below the table, and it matches the flipped diagonal everywhere.`,
      deps: ['logic-1.6'],
      refs: ['Sainsbury', 'SEP “Russell’s Paradox”'],
      credit: 'Russell found his paradox in 1901 and wrote to Frege in June 1902; the barber story is popularly attributed to Russell (who used it as an illustration in 1918) but its origin is uncertain',
      scope: String.raw`The table is finite; Russell’s paradox applies to sets with unrestricted comprehension, and the argument is the same for any binary relation $R$ with the rule “$b$ is related to exactly those $x$ not related to themselves”.`,
      tags: ['paradox', 'sets', 'diagonal'],
      links: { sep: 'https://plato.stanford.edu/entries/russell-paradox/' },
      verify: true,
      viz(v) {
        const nS = v.slider('villagers', 3, 7, 5, { int: true });
        const bS = v.slider('barber $b$', 1, 7, 3, { int: true });
        const out = v.toggle('barber lives outside the village', false);
        let seed = 3, M = [];
        const fill = () => { const r = v.rng(seed); M = Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => (r() < 0.4 ? 1 : 0))); };
        fill();
        v.button('Randomize', () => { seed += 7; fill(); });
        v.button('Make row $b$ obey the rule', () => { const n = nS.value, b = Math.min(bS.value, n) - 1; for (let j = 0; j < n; j++) if (j !== b) M[b][j] = 1 - M[j][j]; });
        const s = v.stage({ x: [0, 12], y: [0, 10.6], equal: true, axes: false, height: 400, full: true });
        let hits = [];
        s.onClick((x, y) => {
          const n = nS.value;
          const j = Math.floor(x - 3), i = Math.floor(9.4 - y);
          if (i >= 0 && i < n && j >= 0 && j < n) M[i][j] = 1 - M[i][j];
        });
        let info = {};
        v.render(() => {
          const n = nS.value, b = Math.min(bS.value, n) - 1, o = out.value;
          bS.el.hidden = o;
          s.text('whom villager shaves →', 3, 10.1, { size: 12, color: 'muted' });
          for (let j = 0; j < n; j++) s.text(`${j + 1}`, 3.5 + j, 9.75, { align: 'center', size: 12, weight: 600, color: 'muted' });
          const target = Array.from({ length: n }, (_, j) => 1 - M[j][j]);
          for (let i = 0; i < n; i++) {
            const y = 9.4 - i, isB = !o && i === b;
            s.text(`${i + 1}`, 2.65, y - 0.5, { align: 'center', baseline: 'middle', size: 12, weight: 600, color: isB ? 'orange' : 'muted' });
            if (isB) s.rect(2.9, y - 1, 3 + n + 0.1, y, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.5, radius: 3 });
            for (let j = 0; j < n; j++) {
              const diag = i === j;
              s.rect(3 + j + 0.05, y - 0.95, 3 + j + 0.95, y - 0.05, { fill: M[i][j] ? 'accent' : 'faint', fillAlpha: M[i][j] ? 0.55 : 0.08, color: diag ? 'gold' : 'faint', width: diag ? 2.2 : 0.6, radius: 3 });
              s.text(M[i][j] ? '1' : '0', 3.5 + j, y - 0.5, { align: 'center', baseline: 'middle', size: 12.5, color: M[i][j] ? 'ink' : 'muted', weight: 600 });
            }
          }
          const yT = 9.4 - n - 0.45;
          s.text('flipped diagonal', 2.8, yT - 0.5, { align: 'right', baseline: 'middle', size: 11, color: 'muted' });
          for (let j = 0; j < n; j++) {
            s.rect(3 + j + 0.05, yT - 0.95, 3 + j + 0.95, yT - 0.05, { fill: 'muted', fillAlpha: target[j] ? 0.4 : 0.06, color: 'muted', width: 0.6, radius: 3 });
            s.text(target[j] ? '1' : '0', 3.5 + j, yT - 0.5, { align: 'center', baseline: 'middle', size: 12.5, color: 'muted', weight: 600 });
          }
          hits = [];
          if (o) {
            const yB = yT - 1.2;
            s.text('barber (outside)', 2.8, yB - 0.5, { align: 'right', baseline: 'middle', size: 11, color: 'orange' });
            for (let j = 0; j < n; j++) {
              s.rect(3 + j + 0.05, yB - 0.95, 3 + j + 0.95, yB - 0.05, { fill: 'orange', fillAlpha: target[j] ? 0.45 : 0.08, color: 'orange', width: 1, radius: 3 });
              s.text(target[j] ? '1' : '0', 3.5 + j, yB - 0.5, { align: 'center', baseline: 'middle', size: 12.5, color: 'ink', weight: 600 });
            }
            s.text('matches everywhere ✓', 3 + n + 0.4, yB - 0.5, { baseline: 'middle', size: 12.5, color: 'green', weight: 700 });
          } else {
            for (let j = 0; j < n; j++) if (M[b][j] !== target[j]) hits.push(j);
            for (const j of hits) {
              s.text('✗', 3.5 + j, yT - 1.45, { align: 'center', size: 15, weight: 700, color: 'red' });
              s.rect(3 + j + 0.05, 9.4 - b - 0.95, 3 + j + 0.95, 9.4 - b - 0.05, { color: 'red', width: 2.2, fill: false, radius: 3 });
            }
          }
          info = { n, b, o, hits };
        });
        v.legend([['gold', 'diagonal: does $i$ shave $i$?', {}], ['orange', 'the barber’s row', {}]]);
        v.readout(() => {
          const { n, b, o, hits } = info;
          if (o) return 'The barber is not one of the villagers, so no diagonal entry is involved: he can shave exactly the villagers who do not shave themselves. Such a barber is consistent; the set-theoretic analogue would be a **class** that is not a member of the universe it ranges over.';
          return hits.length === 0 ? 'Row $b$ equals the flipped diagonal.' : `Row ${b + 1} differs from the flipped diagonal in column${hits.length > 1 ? 's' : ''} ${hits.map((j) => j + 1).join(', ')}${hits.includes(b) ? `, **including the diagonal cell (${b + 1}, ${b + 1})**: if he shaves himself he shouldn’t, and if he doesn’t he should` : ''}. Try as you may, the cell $(b,b)$ always disagrees.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Paradox',
      name: 'The surprise examination',
      statement: String.raw`A teacher announces on Friday that there will be an exam next week, on one of the school days, and that it will be a surprise: on the morning of the exam day the students will not know that the exam is that day. The students reason backwards. It cannot be on the last day, since if it had not happened by then they would know on that morning it must be today. With the last day excluded, the same argument rules out the day before it, and so on back to the first day: no exam is possible. Yet the exam is given on, say, Wednesday, and the students are surprised.`,
      idea: String.raw`The students’ argument assumes that they know the announcement is true *and* can use it, including its surprise clause, as a premise when reasoning about what they would know on later mornings; the last step of the elimination only works if they know on Thursday evening that the announcement still holds, which is exactly what the argument is trying to show it can’t. A precise model separates the two readings. If the teacher picks the exam day at random, the students’ credence on each morning that the exam is today (given none yet) is the *hazard rate* $h_d=p_d/\sum_{j\ge d}p_j$. The last day with $p_d>0$ always has $h=1$: a strictly positive probability of an exam on the last possible day makes that exam a non-surprise. So no distribution can guarantee surprise whatever happens, but the students’ elimination of earlier days does not follow from this. A connection to Gödel’s second incompleteness theorem was made by Kritchman and Raz (2010).`,
      caption: String.raw`Drag the five bars to choose the teacher’s plan (relative weights of the exam day). The second panel shows, for each day, the students’ credence $h_d$ on that morning that the exam is today given that it hasn't happened yet; a bar is red when it reaches $1$ (no surprise: the exam can't be a surprise on that day). Press **Teacher repairs** to zero the last day that is a non-surprise; repeat and watch the whole plan collapse, the students’ backward induction as a game. The readout gives the chance that the exam is a complete non-surprise.`,
      deps: ['phil-4.1'],
      refs: ['Sainsbury ch. 5', 'SEP “Epistemic Paradoxes”'],
      credit: 'Discussed in the philosophical literature from the 1940s; link to Gödel’s second theorem: S. Kritchman & R. Raz, Notices AMS 57 (2010)',
      scope: String.raw`The hazard-rate picture is one reconstruction (a probabilistic reading of "surprise" as credence below 1), not the only analysis; the epistemic and game-theoretic treatments disagree about what the students may assume. The five-day week is a modelling choice.`,
      tags: ['paradox', 'knowledge', 'backward induction'],
      links: { sep: 'https://plato.stanford.edu/entries/epistemic-paradoxes/' },
      verify: true,
      viz(v) {
        const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], N = 5;
        const P = v.stage({ x: [0.3, 5.7], y: [0, 1.08], axes: 'box', gutter: true, height: 300, title: 'the teacher’s plan: weight of each exam day', xticks: DAYS.map((d, i) => [i + 1, d]), yticks: [0, 0.5, 1], weight: 1 });
        const H = v.stage({ x: [0.3, 5.7], y: [0, 1.08], axes: 'box', gutter: true, height: 300, title: 'the students’ credence $h_d$ that it is today', xticks: DAYS.map((d, i) => [i + 1, d]), yticks: [0, 0.5, 1], weight: 1 });
        const hs = DAYS.map((_, i) => P.handle(i + 1, 0.8, { color: 'blue', r: 8, constrain: { x: [i + 1, i + 1], y: [0, 1] } }));
        const snap = (h) => { if (h.y < 0.04) h.set(h.x, 0); };
        hs.forEach((h) => { h.onDrag = () => snap(h); });
        v.button('Teacher repairs', () => {
          for (let i = N - 1; i >= 0; i--) if (hs[i].y > 0.001) { hs[i].set(hs[i].x, 0); break; }
        });
        v.button('Uniform', () => hs.forEach((h) => h.set(h.x, 0.8)));
        let info = {};
        v.render(() => {
          const w = hs.map((h) => Math.max(0, h.y)), tot = w.reduce((a, b) => a + b, 0);
          const p = w.map((x) => (tot > 0 ? x / tot : 0));
          const tail = [];
          for (let d = N - 1, acc = 0; d >= 0; d--) { acc += p[d]; tail[d] = acc; }
          const h = p.map((x, d) => (tail[d] > 1e-9 ? x / tail[d] : 0));
          let last = -1; for (let d = 0; d < N; d++) if (p[d] > 1e-9) last = d;
          for (let d = 0; d < N; d++) {
            P.rect(d + 0.65, 0, d + 1.35, w[d], { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 1 });
            P.text(tot > 0 ? `${Math.round(100 * p[d])}%` : '', d + 1, w[d] + 0.06, { align: 'center', size: 11.5, color: 'muted' });
            const bad = d === last;
            if (p[d] > 1e-9 || d > last) H.rect(d + 0.65, 0, d + 1.35, p[d] > 1e-9 ? h[d] : 0, { fill: bad ? 'red' : 'green', fillAlpha: 0.4, color: bad ? 'red' : 'green', width: 1.2 });
            if (p[d] > 1e-9) H.text(h[d] >= 0.9995 ? '1: no surprise' : v.fix(h[d], 2), d + 1, h[d] + 0.05, { align: 'center', size: 11, color: bad ? 'red' : 'muted', weight: bad ? 700 : 400 });
          }
          const sur = p.reduce((a, x, d) => a + x * (1 - h[d]), 0);
          info = { tot, last, plast: last >= 0 ? p[last] : 0, sur };
        });
        v.readout(() => {
          const { tot, last, plast, sur } = info;
          if (tot <= 0 || last < 0) return 'The plan is empty: **no day is possible**, which is where the students’ argument says the teacher ends up. Raise a bar to give the teacher a plan again.';
          return `The last possible day is **${DAYS[last]}**, where the students’ credence reaches 1: with probability **${Math.round(100 * plast)}%** the exam is a complete non-surprise. Expected surprise (1 − credence on the morning): ${v.fix(sur, 2)}. To rule out non-surprises the teacher has to remove ${DAYS[last]}, and then the new last day has the same problem.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Diagonalisation: one pattern behind four theorems',
      statement: String.raw`**Diagonal argument.** Let a table have rows indexed by objects $x\in X$ and columns indexed by the same objects, with entry $T(x,y)\in\{0,1\}$, so that each row is a 0–1 *property* of the objects. Form the anti-diagonal property $D(y)=1-T(y,y)$. Then $D$ differs from the row of every object $x$ at the place $y=x$, so $D$ is not a row of the table: *no table lists all properties of its own objects.* Four classical theorems are this argument with different tables:
(a) **Cantor** (pma 2.14, logic 1.2): rows are infinite binary sequences, columns their digits, and the diagonal gives a sequence on no list, so the sequences are uncountable.
(b) **Russell**: rows are sets, entry $T(x,y)$ is “$y\in x$”, and $D$ is $\{y : y\notin y\}$, which cannot be any set.
(c) **Turing**: rows are programs, columns inputs, $T(x,y)$ is “$x$ halts on input $y$”, and the program that does the opposite of $x$ on $x$ is on no list, so no program decides halting.
(d) **Tarski and Gödel**: rows are formulas $\varphi_x(v)$, $T(x,y)$ is “$\varphi_x(y)$ is true” (Tarski) or “provable” (Gödel), and the diagonal formula $\neg\mathrm{True}(\varphi_v(v))$ cannot be among the listed formulas, so truth is not definable; for provability the same construction yields a true but unprovable sentence.`,
      idea: String.raw`The proof is a single flip. If every property of objects had a name, the anti-diagonal property would have a name $z$, and asking whether $D$ holds of $z$ gives $D(z)=1-T(z,z)=1-D(z)$, a contradiction. The four theorems differ only in what the table means and what “named” means: a position in a list, a set, a program, a formula. Lawvere (1969) stated the common structure in category theory for cartesian closed categories, and Yanofsky (2003) restated it for sets and functions. The same pattern is what the liar (4.1) and the Yablo-style paradoxes (4.6) look like when all structure is stripped away.`,
      caption: String.raw`An $8\times8$ table of 0s and 1s (click a cell to flip it). The bottom row is the anti-diagonal, each entry being the flip of the diagonal entry above it (outlined in gold). Pick the interpretation to rename the rows, columns and the bottom row. Slide the “compare with row” control: whichever row you choose, the bottom row disagrees with it at least at the diagonal place. Press Randomize for new tables; no table ever lists its own anti-diagonal.`,
      deps: ['pma-2.14', 'toc-9.7', 'logic-7.7'],
      refs: ['SEP “Liar Paradox”'],
      credit: 'Cantor 1891 · Russell 1901–02 · Tarski 1933 · Gödel 1931 · Turing 1936; common scheme: F. W. Lawvere, 1969',
      scope: String.raw`The table here is finite; the theorems concern infinite tables (or all programs, all formulas). The finite table is a picture of the flip only. Gödel's theorem needs more than the pure diagonal scheme: a fixed-point (diagonal) lemma for provability inside the theory.`,
      tags: ['diagonalisation', 'self-reference', 'unification'],
      links: { arxiv: 'https://arxiv.org/abs/math/0305282' },
      viz(v) {
        const N = 8;
        const kind = v.select('table of', [{ value: 'cantor', label: 'Cantor' }, { value: 'russell', label: 'Russell' }, { value: 'turing', label: 'Turing' }, { value: 'tarski', label: 'Tarski' }], 'cantor');
        const rowS = v.slider('compare with row', 1, N, 3, { int: true });
        let seed = 21, T = [];
        const fill = () => { const r = v.rng(seed); T = Array.from({ length: N }, () => Array.from({ length: N }, () => (r() < 0.5 ? 1 : 0))); };
        fill();
        v.button('Randomize', () => { seed += 11; fill(); });
        const L = {
          cantor: { r: 'sequence', rows: (i) => `s${i}`, cols: 'digit position', cell: 'digit', bottom: 'new sequence d', claim: 'd differs from the n-th sequence at digit n, so d is on no list' },
          russell: { r: 'set', rows: (i) => `A${i}`, cols: 'element', cell: 'is element y in set A?', bottom: 'R = {y : y ∉ y}', claim: 'R differs from each set at y = that set, so R is no set in the list' },
          turing: { r: 'program', rows: (i) => `P${i}`, cols: 'input', cell: 'does program halt on input?', bottom: 'D: loop iff P halts on own code', claim: 'D differs from every program on its own code, so D is no program on the list' },
          tarski: { r: 'formula', rows: (i) => `φ${i}`, cols: 'argument', cell: 'is φ(y) true?', bottom: '¬True(φ(φ))', claim: 'the diagonal formula differs from each φ at its own code, so truth is not definable' },
        };
        const s = v.stage({ x: [0, 14], y: [-0.8, 11.6], equal: true, axes: false, height: 460, full: true });
        s.onClick((x, y) => { const j = Math.floor(x - 3), i = Math.floor(10.2 - y); if (i >= 0 && i < N && j >= 0 && j < N) T[i][j] = 1 - T[i][j]; });
        let info = {};
        v.render(() => {
          const lab = L[kind.value], r = rowS.value - 1;
          s.text(`columns: ${lab.cols} y →`, 3, 11.2, { size: 12, color: 'muted' });
          s.text(`rows: ${lab.r} x`, 0.2, 10.75, { size: 12, color: 'muted' });
          for (let j = 0; j < N; j++) s.text(`${j + 1}`, 3.5 + j, 10.75, { align: 'center', size: 12, weight: 600, color: 'muted' });
          for (let i = 0; i < N; i++) {
            const y = 10.2 - i;
            s.text(lab.rows(i + 1), 2.7, y - 0.5, { align: 'right', baseline: 'middle', size: 12.5, weight: 600, color: i === r ? 'orange' : 'muted' });
            if (i === r) s.rect(2.95, y - 1, 3 + N + 0.05, y, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.5, radius: 3 });
            for (let j = 0; j < N; j++) {
              const d = i === j;
              s.rect(3 + j + 0.05, y - 0.95, 3 + j + 0.95, y - 0.05, { fill: T[i][j] ? 'accent' : 'faint', fillAlpha: T[i][j] ? 0.55 : 0.08, color: d ? 'gold' : 'faint', width: d ? 2.4 : 0.6, radius: 3 });
              s.text(String(T[i][j]), 3.5 + j, y - 0.5, { align: 'center', baseline: 'middle', size: 13, weight: 600, color: T[i][j] ? 'ink' : 'muted' });
            }
          }
          const yb = 10.2 - N - 0.7;
          s.text(lab.bottom, 2.7, yb - 0.5, { align: 'right', baseline: 'middle', size: 11, color: 'green', weight: 600 });
          let diff = 0;
          for (let j = 0; j < N; j++) {
            const flip = 1 - T[j][j];
            s.rect(3 + j + 0.05, yb - 0.95, 3 + j + 0.95, yb - 0.05, { fill: 'green', fillAlpha: flip ? 0.5 : 0.08, color: 'green', width: 1.2, radius: 3 });
            s.text(String(flip), 3.5 + j, yb - 0.5, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'ink' });
            if (T[r][j] !== flip) diff++;
          }
          s.text(`✗ differs from ${lab.rows(r + 1)} at ${r + 1}`, 3.5 + r, yb - 1.45, { align: 'center', size: 12, color: 'orange', weight: 700 });
          s.arrow(3.5 + r, yb - 1.15, 3.5 + r, yb - 0.97, { color: 'orange', width: 1.5 });
          info = { diff, r, claim: lab.claim };
        });
        v.legend([['gold', 'diagonal', {}], ['green', 'anti-diagonal (flipped)', {}], ['orange', 'row compared', {}]]);
        v.readout(() => `Row ${info.r + 1} agrees with the bottom row in ${N - info.diff} of ${N} places and disagrees in ${info.diff} (always including place ${info.r + 1}). ${info.claim}.`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Paradox',
      name: 'Fitch’s paradox of knowability',
      statement: String.raw`The **knowability principle** says that every truth could be known: for every proposition $p$, if $p$ then it is possible that someone knows $p$ ($p\to\Diamond Kp$). Suppose there is a truth nobody ever knows. Then $q=p\wedge\neg Kp$ is true. If knowability applies to $q$, then $\Diamond K(p\wedge\neg Kp)$. But knowledge distributes over conjunction and is factive (only truths are known), so $K(p\wedge\neg Kp)$ implies $Kp\wedge K\neg Kp$, which implies $Kp\wedge\neg Kp$. So $K(p\wedge\neg Kp)$ is impossible in every case, and the principle fails for $q$. Hence the principle, together with the assumption that some truth is unknown, is inconsistent: **if all truths are knowable, all truths are known** (the contrapositive of the result, in the form $p\to Kp$).`,
      idea: String.raw`The result uses only weak assumptions about knowledge: that $K$ distributes over conjunction, that it is factive, and that the possibility operator is the minimal one for which the impossible is not possible. It puts pressure on anti-realist and verificationist views, which identify truth with what could be verified. Responses restrict knowability to some propositions (those that do not say anything about what is actually unknown), weaken the logic (intuitionistically it yields only $\neg\neg(p\to Kp)$), or reread $\Diamond K$ as knowledge from a different standpoint. The proof traces back to a referee report of Alonzo Church (1945) on a manuscript of Frederic Fitch; the result appeared in Fitch’s 1963 paper.`,
      caption: String.raw`Six truths are listed. Click a truth to toggle whether anyone actually knows it. For each *unknown* truth $u$ the panel forms the Fitch conjunction “$u$ and nobody knows $u$”: it is true, and the derivation on the right shows it cannot be known. With the **knowability principle** switched on, this is a contradiction for every unknown truth, so the principle forces the whole list to be known; make everyone learn everything and the conflict goes away. Step through the derivation with the slider.`,
      deps: ['phil-4.8'],
      refs: ['SEP “Fitch’s Paradox of Knowability”'],
      credit: 'Frederic B. Fitch, 1963, “A logical analysis of some value concepts” (Theorem 5; proof from a 1945 referee report by Alonzo Church, identified in 2005)',
      scope: String.raw`Assumes a normal modal logic with $K$ factive and distributing over conjunction, and a possibility operator under which the impossible is never possible. Knowability principles restricted to Cartesian or basic propositions escape the result.`,
      tags: ['knowledge', 'modal logic', 'anti-realism'],
      links: { sep: 'https://plato.stanford.edu/entries/fitch-paradox/' },
      viz(v) {
        const TR = [
          'The Earth orbits the Sun.',
          'Water is H₂O.',
          'A certain bird perched on a branch at noon on 1 May 1500 in a forest.',
          'The number of grains of sand on Earth is even.',
          'Some star will explode that no one ever observes.',
          'Light travels at 299 792 458 m/s in a vacuum.',
        ];
        const known = [true, true, false, false, false, true];
        const tog = v.toggle('knowability principle: every truth is knowable', true);
        const step = v.slider('derivation step', 0, 6, 6, { int: true });
        v.button('Everyone learns everything', () => known.fill(true));
        v.button('Reset', () => { [true, true, false, false, false, true].forEach((b, i) => { known[i] = b; }); });
        const A = v.stage({ x: [0, 12], y: [0, 9.2], axes: false, height: 400, weight: 1.1, minWidth: 300, title: 'truths: click to toggle “someone knows it”' });
        const B = v.stage({ x: [0, 12], y: [0, 9.2], axes: false, height: 400, weight: 1, minWidth: 300, title: 'why “$p$ and nobody knows $p$” is unknowable' });
        A.onClick((x, y) => { const i = Math.floor((8.6 - y) / 1.35); if (i >= 0 && i < TR.length && y < 8.7) known[i] = !known[i]; });
        let info = {};
        const wrap = (t, n) => { const w = t.split(' '), out = []; let cur = ''; w.forEach((x) => { if ((cur + ' ' + x).trim().length > n) { out.push(cur.trim()); cur = x; } else cur += ' ' + x; }); out.push(cur.trim()); return out; };
        v.render(() => {
          let unk = 0;
          TR.forEach((t, i) => {
            const y = 8.6 - i * 1.35, k = known[i];
            if (!k) unk++;
            A.rect(0.2, y - 1.2, 11.8, y, { fill: k ? 'green' : 'orange', fillAlpha: 0.1, color: k ? 'green' : 'orange', width: 1.5, radius: 6 });
            const ls = wrap(t, 38);
            ls.slice(0, 2).forEach((l, j) => A.text(l, 0.5, y - 0.4 - j * 0.45 + (ls.length === 1 ? -0.1 : 0.12), { size: 11.5, color: 'ink', baseline: 'middle' }));
            A.text(k ? 'known' : 'unknown', 11.6, y - 0.45, { align: 'right', baseline: 'middle', size: 12, weight: 700, color: k ? 'green' : 'orange' });
          });
          const c = tog.value, st = step.value;
          const L = [
            ['1', 'p  ∧  ¬Kp', 'true: some truth p is unknown'],
            ['2', 'p ∧ ¬Kp → ◇K(p ∧ ¬Kp)', 'knowability, applied to line 1'],
            ['3', 'K(p ∧ ¬Kp) → Kp ∧ K¬Kp', 'K distributes over ∧'],
            ['4', 'K¬Kp → ¬Kp', 'K is factive'],
            ['5', '¬◇K(p ∧ ¬Kp)', 'from 3, 4: it yields Kp ∧ ¬Kp'],
            ['6', 'contradiction: 2 and 5', 'so p ∧ ¬Kp is false'],
          ];
          L.forEach(([n, f, why], i) => {
            const y = 8.2 - i * 1.3, vis = i < st, off = i === 1 && !c;
            B.text(n + '.', 0.3, y, { size: 12, color: vis ? 'muted' : 'faint', baseline: 'middle' });
            B.text(f, 1.1, y + 0.18, { size: 13.5, color: off ? 'faint' : i === 5 ? (c && unk ? 'red' : 'ink') : vis ? 'ink' : 'faint', baseline: 'middle', weight: i === 5 ? 700 : 400 });
            B.text(vis ? (off ? 'principle switched off' : why) : '', 1.1, y - 0.42, { size: 11, color: off ? 'orange' : 'muted', baseline: 'middle' });
          });
          if (st >= 6) {
            const msg = !unk ? 'every truth is known: line 1 never applies' : c ? `${unk} unknown truth${unk > 1 ? 's' : ''} → each has a Fitch conjunction → contradiction` : 'without knowability there is no contradiction';
            B.text(msg, 6, 0.55, { align: 'center', size: 12.5, weight: 700, color: !unk ? 'green' : c ? 'red' : 'orange' });
          }
          info = { unk, c };
        });
        v.legend([['green', 'known', { area: true }], ['orange', 'unknown truth', { area: true }]]);
        v.readout(() => {
          const { unk, c } = info;
          if (!unk) return 'Everything on the list is known, so the knowability principle is satisfied (and not threatened).';
          return c ? `**Inconsistent:** ${unk} truth${unk > 1 ? 's are' : ' is'} unknown, yet the principle says each is knowable. The conjunction “$u$ and nobody knows $u$” is a true, unknowable proposition for each of them. Either the principle goes, or all ${6} truths must be known.` : `${unk} unknown truth${unk > 1 ? 's' : ''}: with the principle switched off the Fitch conjunctions are true and unknowable, but nothing contradicts anything.`;
        });
      },
    },
  ],
};
