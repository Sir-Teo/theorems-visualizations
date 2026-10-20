// Philosophy & Reasoning — Chapter 4 (part b): items 4.6–4.10

import { surprisePrior, removeLatestExam } from './source-audit-surprise.js';
import { barberDiagonal, matchBarberOffDiagonal, outsideBarberWitness } from './source-audit-barber.js';

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
      statement: String.raw`Let $V$ be a nonempty domain of villagers and let $A(i,j)$ mean that $i$ shaves $j$. An internal barber would be a $b\in V$ satisfying $A(b,x)\iff\neg A(x,x)$ for every $x\in V$. Substituting $x=b$ gives $A(b,b)\iff\neg A(b,b)$, impossible for a classical two-valued relation. Thus no such villager exists. Russell's set argument adds an existence assumption: unrestricted comprehension would supply a set $R$ such that $x\in R\iff x\notin x$ for every set $x$. Taking $x=R$ yields $R\in R\iff R\notin R$, so that comprehension principle is inconsistent (logic 1.6).`,
      idea: String.raw`In a square binary table, the required row is the complement of the diagonal: $t_j=1-A(j,j)$. Every actual row $b$ differs from it at column $b$, regardless of all other entries. Repairing the off-diagonal cells leaves exactly this unavoidable disagreement. An outside barber changes a hypothesis: add a person $o\notin V$ and define $A(o,x)=t_x$ for villagers $x\in V$ only. This is consistent because the rule does not constrain $A(o,o)$. If its quantified domain is enlarged to include $o$, the same contradiction returns. The finite construction is an analogy for a restricted domain, not a set satisfying unrestricted comprehension.`,
      caption: String.raw`Click a square to change who shaves whom. Gold outlines mark self-shaving cells; orange identifies the chosen row. **Match off-diagonal cells** repairs every entry of that row except its diagonal. **Flip chosen diagonal** changes that cell, but also changes the required entry below it, so they still disagree. Switch to an outside barber to display a constructed row that matches the flipped diagonal over villagers only. The barber selector follows the current number of villagers.`,
      deps: ['logic-1.6'],
      refs: ['Russell, The Principles of Mathematics (1903), §§100–106; Klement corrected transcription v0.21', 'Russell, The Philosophy of Logical Atomism, lecture 7 (1918; published 1919), class contradiction and barber illustration'],
      credit: 'Russell, 1903; barber illustration discussed in his 1918 lecture 7 (published 1919)',
      scope: String.raw`This is a finite authored binary relation, with classical truth values 0/1 and the barber included in the quantified domain only in the internal case. It does not model set membership, class axioms, or the full universe of sets. The outside row is recomputed from the villagers' diagonal and is not editable; clicks edit the square village relation. Source texts are Klement's corrected transcription of the 1903 printing, rather than a facsimile, and the Russell Society's online lecture transcription.`,
      tags: ['paradox', 'sets', 'diagonal'],
      links: { source: 'https://people.umass.edu/klement/pom/pom.txt', lecture: 'https://users.drew.edu/~jlenz/br-logical-atomism7.html' },
      verify: false,
      viz(v) {
        let barber;
        const nS = v.slider('villagers n', 3, 7, 5, { int: true, onChange: n => {
          barber.input.max = String(n); if (barber.value > n) barber.set(n);
        } });
        barber = v.slider('chosen villager b', 1, 7, 3, { int: true });
        const outside = v.toggle('barber outside the villagers', false);
        let seed = 3, matrix;
        const randomize = () => { const random = v.rng(seed); matrix = Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => random() < .4 ? 1 : 0)); };
        randomize();
        v.button('Randomize village relation', () => { seed += 7; randomize(); });
        const repair = v.button('Match off-diagonal cells', () => { matrix = matchBarberOffDiagonal(matrix, nS.value, barber.value - 1); });
        const flip = v.button('Flip chosen diagonal', () => { const b = barber.value - 1; matrix[b][b] = 1 - matrix[b][b]; });
        const s = v.stage({ x: [.25, 8.95], y: [-3.3, 9.5], equal: true, axes: false, height: 460, full: true, title: 'Village relation: row shaves column' });
        s.onClick((x, y) => {
          const n = nS.value, j = Math.floor(x - 1.2), i = Math.floor(n + 1.2 - y);
          if (i >= 0 && i < n && j >= 0 && j < n) matrix[i][j] = 1 - matrix[i][j];
        });
        let st;
        v.render(() => {
          const n = nS.value;
          // Also synchronize restored states; the displayed/actual value and native End agree.
          barber.input.max = String(n); if (barber.value > n) barber.value = n;
          const b = barber.value - 1, out = outside.value, analysis = barberDiagonal(matrix, n, b), witness = outsideBarberWitness(matrix, n);
          barber.el.hidden = out; repair.disabled = out; flip.disabled = out;
          s.setView([.25, n + 1.95], [-3.3, n + 2.5]);
          const mid = 1.2 + n / 2;
          s.text('recipient (column)', mid, n + 2.0, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          s.text('i', .85, n + 1.5, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          for (let j = 0; j < n; j++) s.text(String(j + 1), 1.7 + j, n + 1.5, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          for (let i = 0; i < n; i++) {
            const top = n + 1.2 - i, chosen = !out && i === b;
            s.text(String(i + 1), .85, top - .5, { align: 'center', baseline: 'middle', size: 12, weight: chosen ? 700 : 400, color: chosen ? 'orange' : 'muted' });
            if (chosen) s.rect(1.12, top - 1, n + 1.28, top, { fill: 'orange', fillAlpha: .08, color: 'orange', width: 1.5 });
            for (let j = 0; j < n; j++) {
              const value = matrix[i][j], diag = i === j;
              s.rect(1.25 + j, top - .95, 2.15 + j, top - .05, { fill: value ? 'accent' : 'faint', fillAlpha: value ? .55 : .08, color: diag ? 'gold' : 'faint', width: diag ? 2.2 : .6 });
              s.text(String(value), 1.7 + j, top - .5, { align: 'center', baseline: 'middle', size: 12.5, weight: 600, color: value ? 'ink' : 'muted', halo: false });
            }
          }
          s.text('flipped diagonal (required)', mid, .7, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          for (let j = 0; j < n; j++) {
            const clash = !out && analysis.mismatches.includes(j), value = analysis.target[j];
            s.rect(1.25 + j, -.75, 2.15 + j, .15, { fill: 'muted', fillAlpha: value ? .4 : .06, color: clash ? 'red' : 'muted', width: clash ? 2.2 : .6 });
            s.text(String(value), 1.7 + j, -.3, { align: 'center', baseline: 'middle', size: 12.5, color: clash ? 'red' : 'muted', weight: 600, halo: false });
          }
          if (out) {
            s.text('outside witness (villagers only)', mid, -1.3, { align: 'center', baseline: 'middle', size: 12, color: 'orange' });
            for (let j = 0; j < n; j++) {
              const value = witness[n][j];
              s.rect(1.25 + j, -2.75, 2.15 + j, -1.85, { fill: 'orange', fillAlpha: value ? .45 : .08, color: 'orange', width: 1 });
              s.text(String(value), 1.7 + j, -2.3, { align: 'center', baseline: 'middle', size: 12.5, color: 'ink', weight: 600, halo: false });
            }
          }
          st = { n, b, outside: out, matrix: matrix.map(row => [...row]), analysis, witness };
        });
        v.legend([['gold', 'self-shaving diagonal'], ['orange', 'chosen internal row / outside witness'], ['red', 'required entry disagrees with chosen row']]);
        v.readout(() => {
          if (st.outside) return `Outside witness: all **${st.n}** required entries match over villagers. The rule omits the outside barber himself. Here his own self-entry is 0; extending the rule to him would demand 1, so it would fail. This constructs a relation on ${st.n + 1} people with a rule restricted to ${st.n} villagers, not a set satisfying unrestricted comprehension.`;
          return `Chosen villager **${st.b + 1} of ${st.n}**: mismatch columns **${st.analysis.mismatches.map(j => j + 1).join(', ')}**. At the unavoidable diagonal cell (${st.b + 1},${st.b + 1}), actual **${st.analysis.self}**, required **${st.analysis.requiredSelf}**. Off-diagonal repair leaves exactly this one mismatch. Flipping the diagonal reverses both values and never makes them equal.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Paradox',
      name: 'The surprise examination',
      statement: String.raw`A teacher announces one examination during a five-day week and claims that, on the morning before it is given, the students will not know it is due that day. The familiar argument first excludes the last day, then tries to exclude each preceding day; yet an earlier exam seems capable of surprising the class. The inference depends on what counts as knowing, which assumptions remain available, and what the announcement itself asserts. Chow distinguishes several logical and epistemic formulations rather than one unqualified argument. The illustration below fixes a narrower probability model: a public prior over exam days $1,\ldots,5$ and an optional no-exam outcome $\varnothing$. On morning $d$, before that day's exam could occur, the only new observation is no earlier exam, $E_d=\{d,\ldots,5,\varnothing\}$. For $P(E_d)>0$, the probability of an exam today is $h_d=p_d/P(E_d)$.`,
      idea: String.raw`In this finite model, “certain today” means every positive-weight outcome compatible with $E_d$ is an exam on day $d$. If an exam is guaranteed ($p_\varnothing=0$), the latest supported day $L$ has $h_L=1$. Thus no nonempty finite prior both guarantees an exam and makes it uncertain on every day when it can occur, under this specified information rule. Positive no-exam weight permits $h_d<1$ on every supported exam day, by relaxing the guarantee of an exam. Removing the latest day then renormalizing changes the public prior; it is not a deduction that the same unchanged announcement excludes every day. This calculation does not resolve the self-referential knowledge or provability versions.`,
      caption: String.raw`Set six nonnegative relative weights and step through the mornings, conditioning on no earlier exam. Blue bars show the public prior; the second panel shows the posterior, with today's bar outlined in orange and no-exam mass in purple. Zero-weight outcomes are excluded from the model's possibilities. **Remove latest exam day** edits the prior before the week; compare an exam-guaranteed prior with one that allows no exam. An all-zero setting is an undefined distribution, and a zero-probability morning history has no posterior.`,
      deps: ['phil-1.1', 'prob-4.1.1a'],
      see: ['phil-4.1'],
      refs: ['Chow, The Surprise Examination or Unexpected Hanging Paradox, American Mathematical Monthly 105 (1998), 41–51; author preprint arXiv:math/9903160v2 (2000), §§1–4'],
      credit: 'Formalization discussion: Timothy Y. Chow, 1998 (author preprint v2, 2000)',
      scope: String.raw`Authored finite probability model, with at most one exam and a fixed public prior. The learner knows that prior, remembers the absence of earlier exams, and receives no other information before the selected morning. “Certain” uses positive support, not a rounded probability or a psychological-surprise score; it is not a general theory equating belief and knowledge. The prior is supplied independently: the model does not condition on the truth of a self-referential promise of surprise. With no-exam weight zero, it represents the exam-occurs premise and tests the additional uncertainty condition. With positive no-exam weight, that premise has explicitly changed. The weight and day controls explore hypothetical settings, not historical student beliefs.`,
      tags: ['paradox', 'knowledge', 'backward induction'],
      links: { source: 'https://arxiv.org/abs/math/9903160v2', paper: 'https://courses.csail.mit.edu/6.042/spring15/surprise-paradox.pdf' },
      verify: false,
      viz(v) {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'none'];
        const weights = labels.map((name, i) => v.slider(`${name} relative weight`, 0, 20, i === 5 ? 0 : 1, { int: true }));
        const morning = v.slider('morning d', 1, 5, 1, { int: true });
        const previous = v.button('Previous morning', () => morning.set(Math.max(1, morning.value - 1)));
        const next = v.button('Next morning', () => morning.set(Math.min(5, morning.value + 1)));
        v.button('Remove latest exam day', () => removeLatestExam(weights.map(w => w.value)).forEach((w, i) => weights[i].set(w)));
        const preset = values => () => { weights.forEach((w, i) => w.set(values[i])); morning.set(1); };
        v.button('Uniform exams, guaranteed', preset([1, 1, 1, 1, 1, 0]));
        v.button('Include no-exam possibility', preset([1, 1, 1, 1, 1, 1]));
        v.button('All weights zero', preset([0, 0, 0, 0, 0, 0]));
        const options = { x: [.35, 6.65], y: [-.07, 1.23], axes: 'box', gutter: true, height: 320, ylabel: 'probability', xticks: labels.map((name, i) => [i + 1, name]), yticks: [0, .5, 1] };
        const prior = v.stage({ ...options, title: 'Public prior before the week' });
        const posterior = v.stage({ ...options, title: 'After observing no earlier exam' });
        let st;
        v.render(() => {
          const values = weights.map(w => w.value), d = morning.value, model = surprisePrior(values, d);
          previous.disabled = d === 1; next.disabled = d === 5;
          const draw = (stage, probabilities, conditional) => {
            if (!probabilities) {
              stage.text(conditional && model.prior ? 'history has zero probability' : 'all weights are zero', 3.5, .68, { align: 'center', size: 12, color: 'muted' });
              stage.text(conditional ? 'posterior undefined' : 'prior undefined', 3.5, .48, { align: 'center', size: 12, color: 'muted' });
              return;
            }
            probabilities.forEach((p, i) => {
              const color = i === 5 ? 'purple' : conditional && i < d - 1 ? 'muted' : 'accent';
              stage.rect(i + .66, 0, i + 1.34, p, { fill: color, fillAlpha: .4, color: conditional && i === d - 1 ? 'orange' : color, width: conditional && i === d - 1 ? 2 : 1.2 });
              stage.text(v.fix(p, 3), i + 1, p + .045, { align: 'center', baseline: 'bottom', size: 11, color: 'ink' });
            });
          };
          draw(prior, model.prior, false); draw(posterior, model.posterior, true);
          st = { weights: values, morning: d, model };
        });
        v.legend([['accent', 'exam-day probability', { area: true }], ['purple', 'no exam this week', { area: true }], ['orange', 'selected morning’s outcome']]);
        v.readout(() => {
          const q = st.model, name = labels[st.morning - 1];
          if (!q.prior) return 'All weights are zero: **no probability distribution is defined**. This is an invalid model setting, not a conclusion that the original announcement is contradictory.';
          const premise = q.guaranteesExam ? 'Exam guaranteed in this prior.' : `No exam has probability **${v.fix(q.prior[5], 4)}**; the exam-occurs premise is relaxed.`;
          const tail = `Before-week probability that an exam occurs on a day when it is already certain that morning: **${v.fix(q.certaintyMass, 4)}**. Removing a day edits this prior; it does not reveal information about the old plan.`;
          if (!q.posterior) return `${premise}\n${name} morning, no earlier exam: this history has probability **0**. The posterior and today's conditional probability are **undefined**, rather than zero.\n${tail}`;
          return `${premise}\n${name} morning, no earlier exam: history probability **${v.fix(q.historyMass, 4)}**; $h_d$ = **${v.fix(q.today, 4)}**. Certain today in this model? **${q.certainToday ? 'yes' : 'no'}**.\n${tail}`;
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
