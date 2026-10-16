// Political Science & Social Choice — Chapter 3: Axiomatic social choice
import { CC, LET, sum, range, clamp, perms, rkStr, txt, chip, rr, FONT, blocEditor, mkProfile, copyProfile, setProfile, total, drawRepTriangle, pairwise } from './ch01.shared.js';
import { arrowPx, pill, cloneP, shift, tidy, fmtK } from './ch02.shared.js';
import {
  R3, PAIRS3, pairName, coalName, popc, profilesOf, above, patternOf, relFromScores, relOfRanking, isWeakOrder, groupsOf, relStr,
  enumIIA, iiaRel, classifyIIA, decisiveIIA, checkArrow, SCF, drawBallot, drawRel, relText, tag, drawLattice,
} from './ch03.shared.js';

// ---------- local helpers
const pct = (a, d = 0) => `${(100 * a).toFixed(d)}%`;
function hl(v, c, x0, x1, Y, col, dash, w = 1.2) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, Math.round(Y) + 0.5); c.lineTo(x1, Math.round(Y) + 0.5); c.stroke(); c.restore();
}
/** Voter columns: header, chips (best on top). o = { r, gap, colW, head(i) → text, headColor(i), ring(i, cand), alpha(i, cand) }. Returns the right edge. */
function drawProfile(v, c, X0, Y0, prof, o = {}) {
  const r = o.r ?? 10, colW = o.colW ?? 34, gap = o.gap ?? 2 * r + 6;
  prof.forEach((rk, i) => {
    const X = X0 + i * colW + colW / 2;
    txt(v, c, o.head ? o.head(i) : `${i + 1}`, X, Y0, { size: 10.5, weight: 700, color: o.headColor?.(i) || 'muted' });
    drawBallot(v, c, X, Y0 + 12 + r, rk, { r, gap, ring: (cand) => o.ring?.(i, cand), alpha: (cand) => o.alpha?.(i, cand) ?? 1 });
  });
  return X0 + prof.length * colW;
}
/** Horizontal log-scale count bars in a pixel box; rows = [{ label, n, color, note }]. */
function countBars(v, c, box, rows, o = {}) {
  const [x0, y0, x1, y1] = box, h = Math.min(o.rowH ?? 40, (y1 - y0) / rows.length), lw = o.labelW ?? 150;
  const mx = Math.max(...rows.map((r) => Math.log10(r.n + 1)), 1);
  rows.forEach((r, k) => {
    const Y = y0 + k * h + h / 2, w = ((x1 - x0 - lw - 70) * Math.log10(r.n + 1)) / mx;
    txt(v, c, r.label, x0 + lw - 8, Y - (r.note ? 6 : 0), { size: 11, weight: 650, align: 'right' });
    if (r.note) txt(v, c, r.note, x0 + lw - 8, Y + 8, { size: 9.5, weight: 500, color: 'muted', align: 'right' });
    rr(c, x0 + lw, Y - 9, Math.max(3, w), 18, 4); c.fillStyle = v.color(r.color || 'accent', r.n ? 0.45 : 0.15); c.fill();
    txt(v, c, fmtK(r.n), x0 + lw + Math.max(3, w) + 7, Y + 0.5, { size: 12, weight: 800, align: 'left', color: r.n ? 'ink' : 'red', halo: true });
  });
}

export default {
  collection: 'polsci',
  chapter: 3,
  title: 'Axiomatic social choice',
  summary: String.raw`Instead of judging voting methods one at a time, social choice theory asks which combinations of properties can hold at all, and answers by proof — here, wherever the cases are finite, by exhaustive search as well. With two alternatives, May’s theorem singles out simple majority rule by four mild conditions. With three or more, Arrow’s theorem shows that unrestricted domain, Pareto efficiency, independence of irrelevant alternatives and a transitive social ranking leave only dictatorships; the decisive-coalition argument shows how the dictator is squeezed out. Sen finds the same tension between Pareto and individual rights, Gibbard and Satterthwaite show that every non-dictatorial rule with three or more possible outcomes rewards some voter for lying, and Muller and Satterthwaite reduce that to monotonicity. Positive results survive by weakening a condition: approval voting is strategy-proof when preferences are dichotomous, Young characterizes the Borda count by consistency and cancellation, and Kemeny’s rule is the maximum-likelihood estimate of a true ranking. List and Pettit carry the impossibility over to the aggregation of logically connected judgments.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'May’s theorem',
      statement: String.raw`A group of $n$ voters decides between two alternatives $x$ and $y$. Each voter $i$ reports $D_i \in \{1, 0, -1\}$ (prefers $x$, indifferent, prefers $y$), and a **group decision function** assigns an outcome $D = f(D_1, \dots, D_n) \in \{1, 0, -1\}$ (a tie is $0$). Then $f$ is **simple majority rule**,
$$f(D) = \operatorname{sgn}\big(N(1) - N(-1)\big), \qquad N(k) = \#\{i : D_i = k\},$$
if and only if it is
(a) **decisive**: defined and single-valued for every one of the $3^n$ vote patterns;
(b) **anonymous** (May: *egalitarian*): permuting the voters does not change $f$;
(c) **neutral**: $f(-D_1, \dots, -D_n) = -f(D_1, \dots, D_n)$, so relabelling the alternatives relabels the outcome;
(d) **positively responsive**: if $f(D) \in \{0, 1\}$ and $D'$ differs from $D$ only in that one voter moves toward $x$, then $f(D') = 1$.

The four conditions are independent: for each one there is a rule satisfying the other three (polsci-3.14).`,
      idea: String.raw`Anonymity means $f$ depends only on the counts $a = N(1)$ and $b = N(-1)$, so a rule is a colouring of the triangle $a + b \le n$. Neutrality maps the cell $(a, b)$ to $(b, a)$ with the opposite colour, so every diagonal cell $a = b$ must be a tie. Positive responsiveness then pushes $x$ into every cell just above the diagonal — one more vote for $x$, or one fewer for $y$, turns a tie into a win — and by induction on $a - b$ into every cell with $a > b$; neutrality gives $y$ below. The colouring is forced: it is the majority rule. Majority voting in a two-candidate election (polsci-1.2) is therefore not one choice among many but the only rule that treats voters and alternatives alike and responds to every vote.`,
      caption: String.raw`Each cell is one count of votes: $a$ voters for $x$ (to the right), $b$ for $y$ (up), the rest indifferent (the small “ind.” number). The colour is the rule’s verdict; **click a cell** to cycle it through $x$, tie, $y$, or pick a rule. Red arrows mark failures of positive responsiveness (a vote toward $x$ that does not produce $x$), red dashed links failures of neutrality (mirror cells whose verdicts are not mirror images). The right panel checks May’s conditions and runs an exhaustive search: of all anonymous rules for $n$ voters (or all neutral ones for $n \ge 4$), how many satisfy the conditions — always exactly one, majority rule.`,
      deps: ['polsci-1.2', 'polsci-1.1'],
      see: ['polsci-3.14', 'polsci-3.3'],
      refs: ['T&P ch. 1', 'May (1952), Econometrica 20: 680–684'],
      tags: ['May', 'majority rule', 'axioms'],
      credit: 'Kenneth O. May, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/May%27s_theorem' },
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 410, minWidth: 330, title: 'verdict for every count of votes · click a cell' });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 410, minWidth: 330, title: 'May’s conditions · exhaustive search' });
        const RULES = {
          majority: { label: 'majority', f: (a, b) => Math.sign(a - b) },
          twothirds: { label: 'two-thirds for x', f: (a, b) => (a > 2 * b ? 1 : a === 2 * b ? 0 : -1) },
          statusquo: { label: 'x wins ties', f: (a, b) => (a >= b ? 1 : -1) },
          unanimity: { label: 'unanimity', f: (a, b, n) => (a === n ? 1 : b === n ? -1 : 0) },
          tie: { label: 'always a tie', f: () => 0 },
        };
        const nS = v.slider('voters $n$', 1, 8, 5, { int: true, onChange: () => load() });
        const rS = v.select('rule', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'majority', { onChange: () => load() });
        let F = new Map(), custom = false, geo = null;
        const key = (a, b) => a * 100 + b;
        function load() { const n = nS.value, f = RULES[rS.value].f; F = new Map(); for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) F.set(key(a, b), f(a, b, n)); custom = false; }
        load();
        T.onClick((x, y) => {
          if (!geo) return; const px = T.X(x), py = T.Y(y), a = Math.floor((px - geo.X0) / geo.s), b = Math.floor((geo.Y0 - py) / geo.s), n = nS.value;
          if (a < 0 || b < 0 || a + b > n) return;
          const cur = F.get(key(a, b)); F.set(key(a, b), cur === 1 ? 0 : cur === 0 ? -1 : 1); custom = true;
        });
        // violations of neutrality and positive responsiveness for a rule given as a Map
        function analyse(n, G = F) {
          const neu = [], pr = [];
          for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) {
            const f = G.get(key(a, b));
            if (a <= b && G.get(key(b, a)) !== -f) neu.push([a, b]);
            if (f >= 0) for (const [da, db] of [[1, 0], [0, -1], [1, -1]]) { const a2 = a + da, b2 = b + db; if (b2 >= 0 && a2 + b2 <= n && G.get(key(a2, b2)) !== 1) pr.push([a, b, a2, b2]); }
          }
          const maj = [...G.entries()].every(([k, f]) => f === Math.sign(Math.floor(k / 100) - (k % 100)));
          return { neu, pr, maj };
        }
        // exhaustive search over anonymous rules (n ≤ 3) or neutral anonymous rules (n ≤ 6)
        const cache = new Map();
        function search(n) {
          if (cache.has(n)) return cache.get(n);
          const t0 = Date.now(), cells = []; for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) cells.push([a, b]);
          const idx = new Map(cells.map(([a, b], i) => [key(a, b), i]));
          const up = cells.map(([a, b]) => [[1, 0], [0, -1], [1, -1]].map(([da, db]) => idx.get(key(a + da, b + db))).filter((j) => j !== undefined));
          const mirror = cells.map(([a, b]) => idx.get(key(b, a)));
          const isPR = (f) => { for (let i = 0; i < cells.length; i++) if (f[i] >= 0) for (const j of up[i]) if (f[j] !== 1) return false; return true; };
          const isNeu = (f) => { for (let i = 0; i < cells.length; i++) if (f[mirror[i]] !== -f[i]) return false; return true; };
          let res;
          if (n <= 3) {
            const K = cells.length, f = Array(K).fill(-1), tot = Math.pow(3, K); let neu = 0, pr = 0, both = 0, majOnly = true;
            for (let code = 0; code < tot; code++) {
              let t = code; for (let i = 0; i < K; i++) { f[i] = (t % 3) - 1; t = (t / 3) | 0; }
              const N = isNeu(f), P = isPR(f); if (N) neu++; if (P) pr++;
              if (N && P) { both++; if (!cells.every(([a, b], i) => f[i] === Math.sign(a - b))) majOnly = false; }
            }
            res = { full: true, K, tot, neu, pr, both, majOnly };
          } else {
            const free = cells.map(([a, b], i) => (a > b ? i : -1)).filter((i) => i >= 0), K = free.length, tot = Math.pow(3, K), f = Array(cells.length).fill(0);
            let both = 0, majOnly = true;
            for (let code = 0; code < tot; code++) {
              let t = code; for (const i of free) { f[i] = (t % 3) - 1; f[mirror[i]] = -f[i]; t = (t / 3) | 0; }
              if (isPR(f)) { both++; if (!cells.every(([a, b], i) => f[i] === Math.sign(a - b))) majOnly = false; }
            }
            res = { full: false, K, tot, both, majOnly, cells: cells.length };
          }
          res.ms = Date.now() - t0; cache.set(n, res); return res;
        }
        v.render(() => {
          const n = nS.value, c = T.ctx, W = T.width, H = T.height, A = analyse(n);
          const s = Math.min(56, (W - 90) / (n + 1), (H - 80) / (n + 1)), X0 = 62, Y0 = H - 46;
          geo = { X0, Y0, s };
          // cells
          for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) {
            const f = F.get(key(a, b)), X = X0 + a * s, Y = Y0 - (b + 1) * s, col = f > 0 ? 'blue' : f < 0 ? 'orange' : 'gray';
            rr(c, X + 2, Y + 2, s - 4, s - 4, 6); c.fillStyle = v.color(col, f === 0 ? 0.16 : 0.42); c.fill(); c.strokeStyle = v.color(col, 0.75); c.lineWidth = 1.2; c.stroke();
            txt(v, c, f > 0 ? 'x' : f < 0 ? 'y' : 'tie', X + s / 2, Y + s / 2, { size: Math.min(15, s * 0.36), weight: 750, color: f === 0 ? 'muted' : 'ink' });
            if (s > 34 && n - a - b > 0) txt(v, c, `${n - a - b} ind.`, X + s - 5, Y + s - 9, { size: 8.5, weight: 600, color: 'muted', align: 'right' });
          }
          // diagonal
          c.save(); c.strokeStyle = v.color('ink', 0.5); c.setLineDash([4, 4]); c.lineWidth = 1.2; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + (n / 2 + 1) * s, Y0 - (n / 2 + 1) * s); c.stroke(); c.restore();
          txt(v, c, 'a = b', X0 + (n / 2 + 1) * s + 4, Y0 - (n / 2 + 1) * s - 4, { size: 10, weight: 600, color: 'muted', align: 'left' });
          // axes labels
          for (let a = 0; a <= n; a++) txt(v, c, String(a), X0 + (a + 0.5) * s, Y0 + 12, { size: 10.5, weight: 600, color: 'muted' });
          for (let b = 0; b <= n; b++) txt(v, c, String(b), X0 - 10, Y0 - (b + 0.5) * s, { size: 10.5, weight: 600, color: 'muted', align: 'right' });
          txt(v, c, 'a = voters for x →', X0 + ((n + 1) * s) / 2, Y0 + 30, { size: 11, weight: 650, color: 'blue' });
          c.save(); c.translate(18, Y0 - ((n + 1) * s) / 2); c.rotate(-Math.PI / 2); txt(v, c, 'b = voters for y →', 0, 0, { size: 11, weight: 650, color: 'orange' }); c.restore();
          // violations
          const ctr = (a, b) => [X0 + (a + 0.5) * s, Y0 - (b + 0.5) * s];
          for (const [a, b] of A.neu) {
            const [p, q] = [ctr(a, b), ctr(b, a)];
            if (a === b) { c.strokeStyle = v.color('red'); c.lineWidth = 2.2; c.setLineDash([4, 3]); c.strokeRect(p[0] - s / 2 + 3, p[1] - s / 2 + 3, s - 6, s - 6); c.setLineDash([]); }
            else { c.save(); c.strokeStyle = v.color('red', 0.8); c.lineWidth = 1.8; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(...p); c.quadraticCurveTo((p[0] + q[0]) / 2 + s * 0.3, (p[1] + q[1]) / 2 + s * 0.3, ...q); c.stroke(); c.restore(); }
          }
          for (const [a, b, a2, b2] of A.pr.slice(0, 30)) { const p = ctr(a, b), q = ctr(a2, b2); arrowPx(v, c, p[0], p[1], q[0], q[1], { color: 'red', width: 1.8, t0: s * 0.22, t1: s * 0.22, head: 7 }); }
          txt(v, c, custom ? 'your rule' : RULES[rS.value].label, W - 12, 16, { size: 12, weight: 700, color: A.maj ? 'green' : 'ink', align: 'right' });
          if (A.maj && (custom || rS.value !== 'majority')) txt(v, c, '= simple majority', W - 12, 32, { size: 11, weight: 650, color: 'green', align: 'right' });
          // ---- right panel
          const d = C.ctx, CW = C.width;
          let Y = 20;
          tag(v, d, true, 'decisive: one verdict per cell', 14, Y); Y += 27;
          tag(v, d, true, 'anonymous: depends on counts only', 14, Y); Y += 27;
          tag(v, d, A.neu.length === 0, A.neu.length ? `neutral: ${A.neu.length} mirror pair${A.neu.length > 1 ? 's' : ''} wrong` : 'neutral', 14, Y); Y += 27;
          tag(v, d, A.pr.length === 0, A.pr.length ? `positively responsive: ${A.pr.length} failure${A.pr.length > 1 ? 's' : ''}` : 'positively responsive', 14, Y); Y += 26;
          hl(v, d, 12, CW - 12, Y - 6, 'grid');
          // the proof, checked on the current rule
          const cellsAll = [...F.entries()].map(([k, f]) => [Math.floor(k / 100), k % 100, f]);
          const diag = cellsAll.filter(([a, b]) => a === b).every(([, , f]) => f === 0);
          const near = cellsAll.filter(([a, b]) => a - b === 1).every(([, , f]) => f === 1);
          const allx = cellsAll.filter(([a, b]) => a > b).every(([, , f]) => f === 1);
          txt(v, d, 'the proof, on this rule:', 14, Y + 8, { size: 11, weight: 650, color: 'muted', align: 'left' });
          [[diag, 'neutral ⇒ every cell with a = b is a tie'], [near, 'responsive ⇒ cells with a = b + 1 give x'], [allx, 'induction on a − b ⇒ x wherever a > b']].forEach(([ok, s2], k) => {
            txt(v, d, ok ? '✓' : '✗', 22, Y + 28 + k * 20, { size: 12, weight: 800, color: ok ? 'green' : 'red' });
            txt(v, d, s2, 36, Y + 28 + k * 20, { size: 11, weight: 600, align: 'left', color: ok ? 'ink' : 'muted' });
          });
          Y += 94;
          hl(v, d, 12, CW - 12, Y - 6, 'grid');
          const S = n <= 6 ? search(n) : null;
          if (S) {
            txt(v, d, S.full ? `exhaustive: all 3^${S.K} anonymous rules, n = ${n}` : `exhaustive: all 3^${S.K} neutral anonymous rules, n = ${n}`, 14, Y + 6, { size: 11.5, weight: 650, align: 'left' });
            const rows = S.full
              ? [{ label: 'anonymous rules', n: S.tot, color: 'gray' }, { label: 'neutral', n: S.neu, color: 'accent' }, { label: 'pos. responsive', n: S.pr, color: 'purple' }, { label: 'both', n: S.both, color: 'green' }]
              : [{ label: 'neutral rules', n: S.tot, color: 'accent' }, { label: '+ pos. responsive', n: S.both, color: 'green' }];
            countBars(v, d, [8, Y + 16, CW - 8, Math.min(C.height - 28, Y + 16 + rows.length * 30)], rows, { rowH: 30, labelW: 118 });
            txt(v, d, S.both === 1 && S.majOnly ? 'the one survivor is simple majority' : '', 14, C.height - 16, { size: 11.5, weight: 700, color: 'green', align: 'left' });
          } else txt(v, d, 'exhaustive search runs for n ≤ 6', 14, Y + 8, { size: 11, color: 'muted', align: 'left' });
        });
        v.legend([['blue', 'x wins', { dot: true }], ['orange', 'y wins', { dot: true }], ['gray', 'tie', { dot: true }], ['red', 'violation']]);
        v.readout(() => {
          const n = nS.value, A = analyse(n), S = n <= 6 ? search(n) : null;
          const fail = [];
          if (A.neu.length) { const [a, b] = A.neu[0]; fail.push(a === b ? `neutrality fails: at ${a}–${b} the two sides are symmetric but the verdict is not a tie` : `neutrality fails: ${a}–${b} and ${b}–${a} are mirror images but their verdicts are not`); }
          if (A.pr.length) { const [a, b, a2, b2] = A.pr[0]; fail.push(`positive responsiveness fails: moving one voter toward x turns ${a}–${b} (${F.get(key(a, b)) > 0 ? 'x' : 'tie'}) into ${a2}–${b2}, which is not x`); }
          const head = A.maj ? `This is **simple majority**, and it satisfies all four conditions.` : fail.length ? `Not majority rule — ${fail.join('; ')}.` : `Not majority rule, yet no failure flagged — impossible by May’s theorem.`;
          const ex = S ? ` Exhaustive search: of ${fmtK(S.tot)} ${S.full ? 'anonymous' : 'neutral anonymous'} rules for ${n} voters, **${S.both}** ${S.both === 1 ? 'is' : 'are'} neutral and positively responsive${S.majOnly ? ' — simple majority' : ''} (${S.ms} ms).` : '';
          return head + ex;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Arrow’s conditions',
      statement: String.raw`A **social welfare function** $F$ assigns to every profile $(\succsim_1, \dots, \succsim_n)$ of individual rankings of a set $X$ of alternatives a social relation $\succsim \,= F(\succsim_1, \dots, \succsim_n)$ on $X$. Arrow asks that
(U) **unrestricted domain and rationality**: $F$ is defined for every profile of (strict or weak) orderings, and its value is always an ordering — complete and transitive;
(P) **weak Pareto**: if every voter strictly prefers $x$ to $y$, then society strictly prefers $x$ to $y$;
(I) **independence of irrelevant alternatives**: if two profiles rank $x$ against $y$ the same way for every voter, the social relation ranks $x$ against $y$ the same way in both;
(D) **non-dictatorship**: there is no voter $i$ such that, for all profiles and all $x, y$, $x \succ_i y$ implies $x \succ y$.

(Arrow’s 1950 formulation used *positive association* and *non-imposition* instead of Pareto; together they imply it — polsci-3.13.)`,
      idea: String.raw`Each condition is a mild demand on its own and is met by some familiar rule. The Borda count gives a transitive ranking, respects unanimity and has no dictator, but violates IIA: moving a third candidate between two others changes their point gap. Pairwise majority satisfies Pareto, IIA and non-dictatorship, but the profile of Condorcet’s paradox (polsci-2.1) makes it cyclic, so it fails (U). Plurality ranking breaks even Pareto when nobody ranks $x$ or $y$ first, and a dictatorship satisfies everything except (D). Arrow’s theorem (polsci-3.3) says no rule escapes all four.`,
      caption: String.raw`Pick a rule; the checklist tests its social ranking of three candidates on **every one of the 216 profiles** of three voters. Click a failed condition to see the counterexample found by the search: for IIA, two profiles in which every voter ranks the highlighted pair the same way but society does not. *Arrow’s example* reproduces the paper’s own counterexample to IIA for the rank-order (Borda) method with weights 4, 3, 2, 1.`,
      deps: ['polsci-1.1', 'micro-4.3'],
      see: ['polsci-3.3', 'polsci-3.13'],
      refs: ['T&P ch. 1', 'Arrow (1950), J. Political Economy 58: 328–346'],
      tags: ['Arrow', 'IIA', 'Pareto'],
      credit: 'Kenneth J. Arrow, 1950–51',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrow%27s_impossibility_theorem' },
      viz(v) {
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 280, title: 'checked on every profile · click a row' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 420, weight: 1.4, title: 'counterexample' });
        const scoresRel = (prof, w) => { const s = Array(prof[0].length).fill(0); for (const r of prof) r.forEach((c, k) => { s[c] += w[k]; }); return relFromScores(s); };
        const majRel = (prof) => { const m = prof[0].length, N = range(m).map(() => Array(m).fill(0)); for (const r of prof) for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) N[r[i]][r[j]]++; return range(m).map((x) => range(m).map((y) => Math.sign(N[x][y] - N[y][x]))); };
        const RULES = {
          borda: { label: 'Borda', F: (p) => scoresRel(p, range(p[0].length).map((k) => p[0].length - 1 - k)) },
          plurality: { label: 'plurality', F: (p) => scoresRel(p, [1, 0, 0, 0].slice(0, p[0].length)) },
          copeland: { label: 'Copeland', F: (p) => { const M = majRel(p); return relFromScores(M.map((row) => sum(row.map((x) => (x > 0 ? 1 : x === 0 ? 0.5 : 0))))); } },
          majority: { label: 'pairwise majority', F: majRel },
          pareto: { label: 'unanimity only', F: (p) => { const m = p[0].length; return range(m).map((x) => range(m).map((y) => (x === y ? 0 : p.every((r) => above(r, x, y)) ? 1 : p.every((r) => above(r, y, x)) ? -1 : 0))); } },
          dictator: { label: 'dictator (voter 1)', F: (p) => relOfRanking(p[0]) },
          arrow: { label: 'Arrow’s example', F: (p) => scoresRel(p, [4, 3, 2, 1]), m: 4 },
        };
        const rS = v.select('rule', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'borda', { onChange: () => { sel = null; } });
        let sel = null, rowsGeo = [];
        const cache = new Map();
        const check = () => { const k = rS.value; if (!cache.has(k)) { const r = RULES[k]; cache.set(k, checkArrow(r.F, 3, r.m || 3)); } return cache.get(k); };
        const CONDS = [['order', 'U: always a transitive ranking'], ['pareto', 'P: weak Pareto'], ['iia', 'I: independence (IIA)'], ['nd', 'D: no dictator']];
        L.onClick((x, y) => { const py = L.Y(y); const k = rowsGeo.findIndex((Y) => Math.abs(py - Y) < 15); if (k >= 0) sel = CONDS[k][0]; });
        v.render(() => {
          const K = check(), c = L.ctx, rule = RULES[rS.value], m = rule.m || 3;
          txt(v, c, `${rule.label} · ${m} candidates · 3 voters`, 14, 18, { size: 11.5, weight: 650, color: 'muted', align: 'left' });
          txt(v, c, `${fmtK(K.nProf)} profiles checked`, 14, 36, { size: 11, weight: 500, color: 'muted', align: 'left' });
          const failing = CONDS.filter(([k]) => !K[k].ok).map(([k]) => k);
          const cur = sel && !K[sel].ok ? sel : failing[0] || null;
          rowsGeo = [];
          CONDS.forEach(([k, lab], i) => { const Y = 72 + i * 44; rowsGeo.push(Y); tag(v, c, K[k].ok, lab, 14, Y, { sel: k === cur, size: 12 }); });
          const nOk = CONDS.filter(([k]) => K[k].ok).length;
          txt(v, c, nOk === 4 ? 'all four hold — impossible' : `${nOk} of 4 hold`, 14, 72 + 4 * 44 + 4, { size: 12.5, weight: 750, color: nOk === 3 ? 'ink' : 'muted', align: 'left' });
          txt(v, c, 'Arrow: no rule passes all four', 14, L.height - 18, { size: 11, weight: 600, color: 'muted', align: 'left' });
          // ---- counterexample
          const d = R.ctx, RW = R.width, RH = R.height;
          if (!cur) { txt(v, d, 'every condition holds on all profiles', RW / 2, RH / 2, { size: 13, color: 'green' }); return; }
          const ex = K[cur].ex;
          const social = (S, X, Y, ringF) => { txt(v, d, 'society', X, Y, { size: 10.5, weight: 700, color: 'muted' }); drawRel(v, d, X, Y + 22, S, { r: 10, ring: ringF }); };
          if (rS.value === 'arrow' && cur === 'iia') {
            // Arrow (1950, p. 337): voters 1, 2 rank x y z w; voter 3 ranks z w x y; weights 4, 3, 2, 1. Deleting y gives a tie.
            const P4 = [[0, 1, 2, 3], [0, 1, 2, 3], [2, 3, 0, 1]], P3 = P4.map((r) => r.filter((c2) => c2 !== 1));
            const sc = (P, w) => { const s = [0, 0, 0, 0]; for (const r of P) r.forEach((cc, k) => { s[cc] += w[k]; }); return s; };
            const s4 = sc(P4, [4, 3, 2, 1]), s3 = sc(P3, [3, 2, 1]);
            const half = RW / 2;
            [[P4, s4, 'all four candidates (weights 4, 3, 2, 1)'], [P3, s3, 'B (= y) deleted (weights 3, 2, 1)']].forEach(([P, s, ttl], k) => {
              const X0 = k * half + 16;
              txt(v, d, ttl, X0 + half / 2 - 16, 16, { size: 10.5, weight: 650, color: 'muted' });
              drawProfile(v, d, X0, 38, P, { r: 9.5, colW: 32, ring: (i, cc) => (cc === 0 || cc === 2 ? 'gold' : null) });
              const pts = [0, 1, 2, 3].filter((cc) => k === 0 || cc !== 1);
              pts.forEach((cc, j) => { const X = X0 + 112, Y = 52 + j * 26; chip(v, d, X, Y, cc, { r: 9 }); txt(v, d, `${s[cc]} pts`, X + 16, Y, { size: 11.5, weight: 700, align: 'left', color: cc === 0 || cc === 2 ? 'ink' : 'muted' }); });
              const top = Math.max(...pts.map((cc) => s[cc])), w = pts.filter((cc) => s[cc] === top);
              txt(v, d, w.length > 1 ? `tie ${w.map((cc) => LET[cc]).join(' ~ ')}` : `${LET[w[0]]} elected`, X0 + half / 2 - 16, 170, { size: 13, weight: 800, color: w.length > 1 ? 'red' : 'green' });
            });
            txt(v, d, 'A = x, B = y, C = z, D = w: nobody changed their view of x vs z,', RW / 2, 214, { size: 11, weight: 600, color: 'muted' });
            txt(v, d, 'and y is below x for every voter — yet removing y turns “x elected” into a tie.', RW / 2, 232, { size: 11, weight: 600, color: 'muted' });
            return;
          }
          if (cur === 'iia') {
            const { p1, p2, S1, S2, x, y } = ex, half = RW / 2;
            [[p1, S1], [p2, S2]].forEach(([p, S], k) => {
              const X0 = k * half + 18;
              txt(v, d, k ? 'profile 2' : 'profile 1', X0 + 50, 16, { size: 11, weight: 700, color: 'muted' });
              drawProfile(v, d, X0, 38, p, { r: 10, colW: 34, ring: (i, cc) => (cc === x || cc === y ? 'gold' : null), alpha: (i, cc) => (cc === x || cc === y ? 1 : 0.45) });
              social(S, X0 + 150, 38, (cc) => (cc === x || cc === y ? 'gold' : null));
              const r = S[x][y];
              txt(v, d, `${LET[x]} ${r > 0 ? '≻' : r < 0 ? '≺' : '~'} ${LET[y]}`, X0 + 150, 160, { size: 14, weight: 800, color: k ? 'red' : 'ink' });
            });
            txt(v, d, `every voter ranks ${LET[x]} vs ${LET[y]} the same way in both profiles`, RW / 2, 196, { size: 11.5, weight: 650 });
            txt(v, d, `(only ${LET[3 - x - y]} moved), but society’s verdict on ${LET[x]} vs ${LET[y]} changed`, RW / 2, 214, { size: 11.5, weight: 650, color: 'red' });
          } else if (cur === 'pareto') {
            const { prof, S, x, y } = ex;
            drawProfile(v, d, 40, 38, prof, { r: 11, colW: 40, ring: (i, cc) => (cc === x || cc === y ? 'gold' : null) });
            social(S, 250, 38, (cc) => (cc === x || cc === y ? 'gold' : null));
            txt(v, d, `every voter prefers ${LET[x]} to ${LET[y]}, but society does not rank ${LET[x]} strictly above ${LET[y]}`, RW / 2, 200, { size: 11.5, weight: 650, color: 'red' });
          } else if (cur === 'order') {
            const { prof, S } = ex;
            drawProfile(v, d, 40, 38, prof, { r: 11, colW: 40 });
            social(S, 260, 38);
            txt(v, d, `social relation: ${PAIRS3.map(([a, b]) => `${LET[S[a][b] >= 0 ? a : b]}${S[a][b] === 0 ? '~' : '≻'}${LET[S[a][b] >= 0 ? b : a]}`).join(', ')} — not an ordering`, RW / 2, 200, { size: 11.5, weight: 650, color: 'red' });
          } else if (cur === 'nd') {
            const i = K.nd.dict[0], prof = [[0, 1, 2], [2, 1, 0], [1, 2, 0]].map((r, k) => (k === i ? [1, 0, 2] : r));
            drawProfile(v, d, 40, 38, prof, { r: 11, colW: 40, headColor: (k) => (k === i ? 'gold' : 'muted') });
            social(RULES[rS.value].F(prof), 260, 38);
            txt(v, d, `voter ${i + 1}’s strict preferences prevail in all ${fmtK(K.nProf)} profiles: a dictator`, RW / 2, 200, { size: 11.5, weight: 650, color: 'red' });
          }
        });
        v.legend([['gold', 'the pair in question', { dot: true }], ['green', 'condition holds', { dot: true }], ['red', 'condition fails', { dot: true }]]);
        v.readout(() => {
          const K = check(), r = RULES[rS.value];
          const st = CONDS.map(([k, lab]) => `${lab.split(':')[0]} ${K[k].ok ? '✓' : '✗'}`).join(' · ');
          return `**${r.label}** on ${fmtK(K.nProf)} profiles: ${st}. ${CONDS.every(([k]) => K[k].ok) ? 'All hold?!' : 'At least one condition fails — as Arrow’s theorem says it must for every rule.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Arrow’s impossibility theorem',
      statement: String.raw`Let there be at least three alternatives and finitely many voters. Every social welfare function that satisfies unrestricted domain with transitive social rankings (U), weak Pareto (P) and independence of irrelevant alternatives (I) is a **dictatorship**: there is a voter $i$ such that $x \succ_i y$ implies $x \succ y$ for all profiles and all alternatives $x, y$. Equivalently, (U), (P), (I) and non-dictatorship (D) cannot hold together. Each condition is needed: dropping any one of them leaves non-dictatorial rules (Borda without I, pairwise majority without transitivity, a constant ranking without P, majority on a single-peaked domain without U).`,
      idea: String.raw`Call a coalition $G$ *decisive* if society follows $G$ whenever all its members agree on a pair. By Pareto the whole electorate is decisive. Two lemmas drive the proof (polsci-3.4): IIA and transitivity spread decisiveness over one pair to every pair (*field expansion*), and splitting a decisive coalition in two leaves one half decisive (*contraction*), because a single profile in which the halves disagree must, by transitivity, side with one of them. Halving repeatedly ends at a decisive coalition of one voter — the dictator. In the finite case the theorem can also be checked by brute force: by IIA a rule is a table of pairwise verdicts for each pair and each pattern of opinions, and searching all such tables finds only the dictatorships.`,
      caption: String.raw`An exhaustive search over **every** social welfare function satisfying IIA — by IIA, three tables that give society’s verdict on $AB$, $BC$ and $AC$ for each set of voters preferring the first alternative — for 2 or 3 voters. The bars count the rules surviving each condition you switch on. With transitivity and Pareto only the dictatorships remain; switch on non-dictatorship and the count drops to 0. Switch a condition off to see what it was excluding (inverse dictators, constant rankings, cycles), or restrict the domain to single-peaked preferences and watch majority rule appear. Right: the surviving rules as tables (click one); below: its decisive coalitions, which for a dictator are exactly the coalitions containing the dictator.`,
      deps: ['polsci-3.2', 'polsci-2.1', 'polsci-3.4'],
      see: ['polsci-3.13', 'polsci-3.6', 'polsci-3.12'],
      refs: ['T&P ch. 7', 'Shepsle: group decisions', 'Arrow, Social Choice and Individual Values (1951)', 'Geanakoplos (2005), Three brief proofs of Arrow’s impossibility theorem'],
      tags: ['Arrow', 'impossibility', 'dictatorship'],
      credit: 'Kenneth J. Arrow, 1950–51',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrow%27s_impossibility_theorem' },
      viz(v) {
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 340, title: 'exhaustive search over IIA rules' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 360, title: 'surviving rules · click one' });
        const Lt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210, full: true, title: 'decisive coalitions of the selected rule' });
        const nS = v.select('voters', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3, { onChange: () => { selR = 0; } });
        const dom = v.select('domain', [{ value: 'all', label: 'all rankings' }, { value: 'sp', label: 'single-peaked' }], 'all', { onChange: () => { selR = 0; } });
        const tT = v.toggle('transitive', true, { onChange: () => { selR = 0; } });
        const pT = v.toggle('Pareto', true, { onChange: () => { selR = 0; } });
        const dT = v.toggle('no dictator', false, { onChange: () => { selR = 0; } });
        const iT = v.toggle('IIA', true, { onChange: () => { selR = 0; } });
        let selR = 0, cards = [];
        const SP = R3.filter((r) => r[2] !== 1); // B never ranked last: single-peaked on the axis A – B – C
        const cache = new Map();
        const run = (n, trans, pareto, domain) => {
          const k = `${n}|${trans}|${pareto}|${domain}`;
          if (!cache.has(k)) cache.set(k, enumIIA(n, { strict: n === 3, trans, pareto, domain: domain === 'sp' ? SP : R3, keep: 400 }));
          return cache.get(k);
        };
        // named rules as pair tables, to show alongside the sampled ones
        const named = (n) => {
          const NP = 1 << n, mk = (fn) => ({ f: [0, 1, 2].map(() => range(NP).map(fn)) });
          const out = range(n).map((i) => mk((p) => ((p >> i) & 1 ? 1 : -1)));
          if (n % 2) out.push(mk((p) => (popc(p) * 2 > n ? 1 : -1)));
          out.push(...range(n).map((i) => mk((p) => ((p >> i) & 1 ? -1 : 1))));
          out.push({ f: [range(NP).map(() => 1), range(NP).map(() => 1), range(NP).map(() => 1)] });
          return out;
        };
        const profsOf = (n, domain) => profilesOf(n, domain === 'sp' ? SP : R3);
        const satisfies = (rule, n, o) => {
          const profs = profsOf(n, o.domain), NP = 1 << n;
          if (o.pareto && [0, 1, 2].some((k) => rule.f[k][NP - 1] !== 1 || rule.f[k][0] !== -1)) return false;
          if (n === 3 && rule.f.some((f) => f.some((x) => x === 0))) return false;
          if (o.trans && !profs.every((p) => isWeakOrder(iiaRel(rule, p)))) return false;
          if (o.nd && classifyIIA(rule, n).kind === 'dictator') return false;
          return true;
        };
        const model = () => {
          const n = nS.value, o = { trans: tT.value, pareto: pT.value, nd: dT.value, domain: dom.value };
          const fam = run(n, false, false, o.domain);
          const steps = [{ label: 'all IIA rules', note: n === 3 ? 'social ties excluded' : 'ties allowed', n: fam.total, color: 'gray' }];
          if (o.trans) steps.push({ label: '+ transitive', n: run(n, true, false, o.domain).count, color: 'accent' });
          const main = run(n, o.trans, o.pareto, o.domain);
          if (o.pareto) steps.push({ label: '+ Pareto', n: main.count, color: 'purple' });
          if (o.nd) steps.push({ label: '+ no dictator', n: main.count - main.dictators, color: 'green' });
          const final = steps[steps.length - 1].n;
          // gallery: named rules that pass, then distinct sampled ones
          const seenKey = new Set(), list = [];
          const push = (r) => { const key = JSON.stringify(r.f); if (seenKey.has(key) || list.length >= 6) return; if (!satisfies(r, n, o)) return; seenKey.add(key); list.push(r); };
          named(n).forEach(push);
          const byKind = new Map(); for (const r of main.rules) { const kd = classifyIIA(r, n, main.seen).kind; if (!byKind.has(kd)) byKind.set(kd, r); }
          [...byKind.values()].forEach(push); main.rules.forEach(push);
          return { n, o, steps, final, main, list };
        };
        G.onClick((x, y) => { const px = G.X(x), py = G.Y(y); const k = cards.findIndex((b) => px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3]); if (k >= 0) selR = k; });
        const bordaRel = (p) => { const s = [0, 0, 0]; for (const r of p) r.forEach((c2, k) => { s[c2] += 2 - k; }); return relFromScores(s); };
        let bordaK = null;
        v.render(() => {
          const c = L.ctx, W = L.width, H = L.height, d = G.ctx, GW = G.width, GH = G.height, e = Lt.ctx;
          if (!iT.value) {
            const n = nS.value, profs = Math.pow(6, n);
            txt(v, c, 'IIA dropped: the family is every function', 14, 22, { size: 12, weight: 700, align: 'left' });
            txt(v, c, `from the ${profs} profiles to the 13 weak orders —`, 14, 42, { size: 12, weight: 600, align: 'left' });
            txt(v, c, `13^${profs} ≈ 10^${Math.floor(profs * Math.log10(13))} rules, far too many to search.`, 14, 62, { size: 12, weight: 600, align: 'left' });
            txt(v, c, 'One witness is enough: the Borda ranking.', 14, 96, { size: 12, weight: 700, color: 'green', align: 'left' });
            bordaK = bordaK || checkArrow(bordaRel, 3);
            [['order', 'transitive'], ['pareto', 'Pareto'], ['nd', 'no dictator'], ['iia', 'IIA']].forEach(([k, lab], i) => tag(v, c, bordaK[k].ok, lab, 14, 130 + i * 32));
            txt(v, c, '(checked on all 216 profiles of 3 voters)', 14, 130 + 4 * 32, { size: 10.5, color: 'muted', align: 'left' });
            const ex = bordaK.iia.ex;
            txt(v, d, 'Borda violates IIA: same A-vs-B opinions,', GW / 2, 18, { size: 11.5, weight: 650 });
            txt(v, d, 'different social verdict on A vs B', GW / 2, 34, { size: 11.5, weight: 650, color: 'red' });
            [[ex.p1, ex.S1], [ex.p2, ex.S2]].forEach(([p, S], k) => { const X0 = 14 + k * (GW / 2); drawProfile(v, d, X0, 60, p, { r: 9, colW: 28, ring: (i, cc) => (cc < 2 ? 'gold' : null) }); drawRel(v, d, X0 + 112, 80, S, { r: 9 }); });
            txt(v, e, 'no rule selected: IIA is off', Lt.width / 2, Lt.height / 2, { size: 12, color: 'muted' });
            cards = [];
            return;
          }
          const M = model(), n = M.n;
          txt(v, c, `${n} voters · 3 alternatives · ${dom.value === 'sp' ? 'single-peaked rankings only' : 'every strict ranking allowed'}`, 14, 18, { size: 11, weight: 600, color: 'muted', align: 'left' });
          countBars(v, c, [6, 36, W - 6, 36 + M.steps.length * 50], M.steps, { rowH: 50, labelW: 112 });
          const msg = M.final === 0 ? 'no rule survives' : M.o.nd ? `${fmtK(M.final)} non-dictatorial rules survive` : M.main.count === M.main.dictators && M.o.pareto && M.o.trans ? `only the ${M.main.dictators} dictatorships survive` : `${fmtK(M.final)} rules survive`;
          txt(v, c, msg, 14, H - 40, { size: 13, weight: 800, color: M.final === 0 ? 'red' : M.o.nd && M.final ? 'green' : 'ink', align: 'left' });
          txt(v, c, `searched in ${M.main.ms + (cache.size ? 0 : 0)} ms`, 14, H - 18, { size: 10.5, color: 'muted', align: 'left' });
          // ---- gallery of rules as pairwise tables
          cards = [];
          const list = M.list, NP = 1 << n;
          if (!list.length) { txt(v, d, 'no rule satisfies all the conditions switched on', GW / 2, GH / 2 - 8, { size: 12.5, weight: 700, color: 'red' }); txt(v, d, '(Arrow’s theorem)', GW / 2, GH / 2 + 12, { size: 11.5, color: 'muted' }); }
          const cols = GW > 520 ? 3 : 2, cw = (GW - 16) / cols, ch = Math.min(98, (GH - 12) / Math.ceil(Math.max(list.length, 1) / cols));
          if (selR >= list.length) selR = 0;
          list.forEach((r, k) => {
            const X0 = 8 + (k % cols) * cw, Y0 = 6 + Math.floor(k / cols) * ch, sel = k === selR;
            cards.push([X0, Y0, X0 + cw - 6, Y0 + ch - 6]);
            rr(d, X0, Y0, cw - 6, ch - 6, 8); d.fillStyle = v.color(sel ? 'gold' : 'muted', sel ? 0.12 : 0.04); d.fill(); d.strokeStyle = v.color(sel ? 'gold' : 'faint'); d.lineWidth = sel ? 2 : 1; d.stroke();
            const cl = classifyIIA(r, n, M.main.seen);
            txt(v, d, cl.label, X0 + (cw - 6) / 2, Y0 + 12, { size: 10.5, weight: 700, color: cl.kind === 'dictator' ? 'red' : cl.kind === 'majority' ? 'green' : 'ink' });
            const cs = Math.min(15, (cw - 46) / NP), rh = Math.min(17, (ch - 34) / 3);
            [0, 1, 2].forEach((pk) => {
              const [x, y] = PAIRS3[pk], Y = Y0 + 24 + pk * rh;
              txt(v, d, pairName(x, y), X0 + 18, Y + rh / 2, { size: 9.5, weight: 700, color: 'muted' });
              for (let p = 0; p < NP; p++) {
                const val = r.f[pk][p], X = X0 + 32 + p * cs, col = val > 0 ? CC[x] : val < 0 ? CC[y] : 'gray';
                d.fillStyle = v.color(col, val === null ? 0.05 : val === 0 ? 0.2 : 0.7); d.fillRect(X, Y + 1, cs - 1.5, rh - 2.5);
              }
            });
          });
          if (list.length) txt(v, d, `columns: which voters prefer the first letter (${range(NP).map((p) => coalName(p, n)).join(' ')})`, GW / 2, GH - 8, { size: 9, weight: 500, color: 'muted' });
          // ---- lattice of the selected rule
          const r = list[selR];
          if (!r) { txt(v, e, 'no rule to show', Lt.width / 2, Lt.height / 2, { size: 12, color: 'muted' }); return; }
          const dec = range(1 << n).map((Gm) => { let k = 0; [0, 1, 2].forEach((pk) => { if (decisiveIIA(r, n, Gm, pk, 1, M.main.seen)) k++; if (decisiveIIA(r, n, Gm, pk, -1, M.main.seen)) k++; }); return k; });
          const LW = Lt.width;
          drawLattice(v, e, [LW * 0.02, 26, LW * 0.5, Lt.height - 26], n, {
            fill: (Gm) => (dec[Gm] === 6 ? ['green', 0.32] : dec[Gm] > 0 ? ['gold', 0.22] : ['muted', 0.04]),
            stroke: (Gm) => (dec[Gm] === 6 ? 'green' : null),
          });
          const cl = classifyIIA(r, n, M.main.seen);
          txt(v, e, cl.label, LW * 0.53, 40, { size: 12.5, weight: 750, align: 'left', color: cl.kind === 'dictator' ? 'red' : 'ink' });
          const full = range(1 << n).filter((Gm) => dec[Gm] === 6);
          txt(v, e, `decisive over all six ordered pairs: ${full.length ? full.map((Gm) => coalName(Gm, n)).join(' ') : 'none'}`, LW * 0.53, 64, { size: 11, weight: 600, align: 'left' });
          txt(v, e, `decisive over some pairs only: ${range(1 << n).filter((Gm) => dec[Gm] > 0 && dec[Gm] < 6).map((Gm) => coalName(Gm, n)).join(' ') || 'none'}`, LW * 0.53, 84, { size: 11, weight: 600, align: 'left', color: 'muted' });
          if (cl.kind === 'dictator') txt(v, e, `exactly the coalitions containing voter ${cl.i + 1}`, LW * 0.53, 110, { size: 11, weight: 650, align: 'left', color: 'red' });
        });
        v.legend([['green', 'decisive on every pair', { dot: true }], ['gold', 'decisive on some pairs', { dot: true }], ['red', 'dictator', { dot: true }]]);
        v.readout(() => {
          if (!iT.value) return 'Without IIA the Borda ranking satisfies (U), (P) and (D) on all 216 profiles of three voters — IIA is what Arrow’s theorem needs to forbid it.';
          const M = model(), last = M.steps[M.steps.length - 1];
          const cl = [M.o.trans && 'transitive', M.o.pareto && 'Pareto-efficient', M.o.nd && 'non-dictatorial'].filter(Boolean), conds = cl.length ? cl.slice(0, -1).join(', ') + (cl.length > 1 ? ' and ' : '') + cl[cl.length - 1] : 'unconstrained';
          let tail = '';
          if (M.o.trans && M.o.pareto && !M.o.nd && dom.value === 'all') tail = ` Every one of them is a dictatorship (${M.main.dictators} dictators) — **Arrow’s theorem, verified by exhaustion.**`;
          else if (M.o.trans && M.o.pareto && M.o.nd && dom.value === 'all') tail = ' Adding non-dictatorship leaves **none**.';
          else if (dom.value === 'sp' && M.o.trans && M.o.pareto) tail = ` On the single-peaked domain the theorem fails: ${nS.value % 2 ? 'pairwise majority is among them' : 'non-dictatorial rules exist'}.`;
          else if (!M.o.pareto) tail = ' Without Pareto, constant and inverse-dictator rules appear.';
          else if (!M.o.trans) tail = ' Without transitivity, cyclic rules such as pairwise majority are allowed.';
          return `Of ${fmtK(M.steps[0].n)} IIA rules for ${M.n} voters, **${fmtK(last.n)}** are ${conds}.${tail}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Lemma',
      name: 'Field expansion and contraction of decisive coalitions',
      statement: String.raw`Let $F$ satisfy unrestricted domain (with transitive social rankings), weak Pareto and IIA, with at least three alternatives. A coalition $G$ is **decisive** over $(x, y)$ if $x \succ_i y$ for all $i \in G$ implies $x \succ y$, and **almost decisive** over $(x, y)$ if this holds whenever, in addition, everyone outside $G$ prefers $y$ to $x$.
(a) **Field expansion.** If $G$ is almost decisive over one ordered pair, it is decisive over every ordered pair.
(b) **Contraction.** If $G$ is decisive and $|G| \ge 2$, then for every split $G = G_1 \cup G_2$ into non-empty disjoint parts, $G_1$ or $G_2$ is decisive.
Since the whole electorate is decisive by Pareto, repeated contraction ends with a decisive single voter: a dictator.`,
      idea: String.raw`(a) Suppose $G$ is almost decisive over $(x, y)$; let $z$ be a third alternative. Take a profile in which $G$ ranks $x \succ y \succ z$ and everyone else ranks $y$ above both $x$ and $z$ (and $z \succ x$). Then $x \succ y$ by almost-decisiveness, $y \succ z$ by Pareto, so $x \succ z$ by transitivity; by IIA society’s $x$-vs-$z$ verdict depends only on the $x$-vs-$z$ opinions, where only $G$ prefers $x$ — so $G$ is decisive over $(x, z)$. A symmetric profile gives $(z, y)$, and chaining such steps reaches all six ordered pairs. (b) Let $G_1$ rank $x \succ y \succ z$, $G_2$ rank $z \succ x \succ y$, the rest $y \succ z \succ x$. Society has $x \succ y$ ($G$ decisive). If $z \succ y$, then $G_2$ is almost decisive over $(z, y)$; otherwise $y \succsim z$, so $x \succ z$ and $G_1$ is almost decisive over $(x, z)$. Either way (a) finishes the job.`,
      caption: String.raw`Step through the proof for three voters, applied to the rule you choose. Left: the coalitions — whole electorate $G$, its halves, the coalition $H$ being expanded — and the six ordered pairs, which light up as $H$ is shown decisive over them. Right: the profile the step uses, the rule’s **actual** social ranking on it, and the deductions with ✓ or ✗. Each “by IIA” conclusion is then checked over all 216 profiles. For a dictatorship every step goes through and the dictator is found; for majority rule, Borda or unanimity the proof breaks at the step where the rule violates transitivity, IIA or Pareto, and the failure is shown.`,
      deps: ['polsci-3.2'],
      see: ['polsci-3.3', 'polsci-3.13'],
      refs: ['T&P ch. 7', 'Sen, Collective Choice and Social Welfare (1970)', 'Geanakoplos (2005), Three brief proofs of Arrow’s impossibility theorem'],
      tags: ['Arrow', 'decisive coalitions', 'proof'],
      credit: 'Arrow, 1951; decisive-set formulation as in Sen, 1970',
      viz(v) {
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 300, title: 'coalitions and the pairs H is decisive over' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 420, weight: 1.35, title: 'the profile this step uses, and the rule’s verdict' });
        const n = 3, PROFS = profilesOf(3);
        const majRel = (p) => { const N = pairwise({ m: 3, blocs: p.map((r) => ({ n: 1, r })) }); return range(3).map((x) => range(3).map((y) => Math.sign(N[x][y] - N[y][x]))); };
        const RULES = {
          d1: { label: 'dictator: voter 1', F: (p) => relOfRanking(p[0]) },
          d3: { label: 'dictator: voter 3', F: (p) => relOfRanking(p[2]) },
          maj: { label: 'pairwise majority', F: majRel },
          borda: { label: 'Borda', F: (p) => { const s = [0, 0, 0]; for (const r of p) r.forEach((c, k) => { s[c] += 2 - k; }); return relFromScores(s); } },
          unan: { label: 'unanimity only', F: (p) => range(3).map((x) => range(3).map((y) => (x === y ? 0 : p.every((r) => above(r, x, y)) ? 1 : p.every((r) => above(r, y, x)) ? -1 : 0))) },
          inv: { label: 'reverse of voter 2', F: (p) => relOfRanking(p[1].slice().reverse()) },
        };
        const rS = v.select('rule', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'd3', { onChange: () => S.reset() });
        const mask = (arr) => arr.reduce((m, i) => m | (1 << i), 0), members = (m) => range(n).filter((i) => m & (1 << i));
        const pairTxt = (a, b) => `${LET[a]} over ${LET[b]}`;
        /** Is H decisive over (a, b) under F? Returns a counterexample profile or null. */
        const decisiveCx = (F, H, a, b) => PROFS.find((p) => members(H).every((i) => above(p[i], a, b)) && F(p)[a][b] !== 1) || null;
        function frames() {
          const F = RULES[rS.value].F, out = [];
          const base = { G: 7, H: 0, G1: 0, G2: 0, dec: [], prof: null, S: null, lines: [], roles: {} };
          const push = (f) => out.push({ ...base, ...f });
          // step 0: Pareto
          const pcx = PROFS.find((p) => { const S = F(p); for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (x !== y && p.every((r) => above(r, x, y)) && S[x][y] !== 1) return true; return false; });
          if (pcx) {
            const S = F(pcx); let bad = null; for (let x = 0; x < 3 && !bad; x++) for (let y = 0; y < 3 && !bad; y++) if (x !== y && pcx.every((r) => above(r, x, y)) && S[x][y] !== 1) bad = [x, y];
            push({ prof: pcx, S, lines: [[false, `all voters prefer ${pairTxt(...bad)}, society does not`]], broken: 'Pareto', note: String.raw`The proof starts from Pareto — the whole electorate is decisive — but this rule **violates Pareto**, so the argument cannot begin.` });
            return out;
          }
          let G = 7;
          { const prof = [[0, 1, 2], [2, 0, 1], [0, 2, 1]], S0 = F(prof); push({ G, prof, S: S0, focus: [0, 1], lines: [[S0[0][1] === 1, 'all three prefer A to B; society ranks A ≻ B'], [true, 'Pareto holds on all 216 profiles']], note: String.raw`By **Pareto**, the whole electorate $\{1,2,3\}$ is decisive over every pair (checked on all 216 profiles).` }); }
          let dec = [];
          while (popc(G) > 1) {
            const mem = members(G), G1 = mask([mem[0]]), G2 = G & ~G1, O = 7 & ~G;
            const role = (i) => (G1 & (1 << i) ? 'G1' : G2 & (1 << i) ? 'G2' : 'O');
            const prof = range(n).map((i) => (role(i) === 'G1' ? [0, 1, 2] : role(i) === 'G2' ? [2, 0, 1] : [1, 2, 0]));
            const S = F(prof), lines = [];
            lines.push([S[0][1] === 1, `A ≻ B: G = ${coalName(G, n)} is decisive and all of it prefers A to B`]);
            if (!isWeakOrder(S)) { lines.push([false, 'the social relation is not transitive']); push({ G, G1, G2, prof, S, lines, broken: 'transitivity', note: String.raw`**Contraction** splits $G$ into $G_1$ and $G_2$. On this profile the rule’s social relation is **not transitive**, so the proof breaks: the rule violates (U).` }); return out; }
            let H, a, b;
            if (S[2][1] === 1) { H = G2; a = 2; b = 1; lines.push([true, `C ≻ B, and only G₂ = ${coalName(G2, n)} prefers C to B`]); lines.push([true, `so G₂ is almost decisive over C over B`]); }
            else { H = G1; a = 0; b = 2; lines.push([S[1][2] >= 0, 'B ≿ C (society does not put C above B)']); lines.push([S[0][2] === 1, `so A ≻ C by transitivity; only G₁ = ${coalName(G1, n)} prefers A to C`]); lines.push([true, 'so G₁ is almost decisive over A over C']); }
            push({ G, G1, G2, H, prof, S, lines, dec: [], note: String.raw`**Contraction.** $G_1$ ranks $A\succ B\succ C$, $G_2$ ranks $C\succ A\succ B$, everyone else $B\succ C\succ A$. Whichever way society ranks $B$ against $C$, one half of $G$ becomes almost decisive over a pair.` });
            // field expansion for H from (a, b)
            dec = [[a, b]];
            const c3 = 3 - a - b;
            const doStep = (kind, x, y, z) => {
              // kind 'ac': from D(x,y) derive D(x,z): H x>y>z, others y>z>x. kind 'cb': from D(x,y) derive D(z,y): H z>x>y, others y>z>x.
              const hR = kind === 'ac' ? [x, y, z] : [z, x, y], oR = [y, z, x];
              const prof = range(n).map((i) => (H & (1 << i) ? hR : oR));
              const S = F(prof), [p, q] = kind === 'ac' ? [x, z] : [z, y];
              const ls = [];
              const prem1 = kind === 'ac' ? [x, y, 'H decisive'] : [z, x, 'Pareto: everyone'];
              const prem2 = kind === 'ac' ? [y, z, 'Pareto: everyone'] : [x, y, 'H decisive'];
              const ok1 = S[prem1[0]][prem1[1]] === 1, ok2 = S[prem2[0]][prem2[1]] === 1, ok3 = S[p][q] === 1;
              ls.push([ok1, `${LET[prem1[0]]} ≻ ${LET[prem1[1]]} (${prem1[2]})`]);
              ls.push([ok2, `${LET[prem2[0]]} ≻ ${LET[prem2[1]]} (${prem2[2]})`]);
              ls.push([ok3, `${LET[p]} ≻ ${LET[q]} (transitivity)`]);
              let broken = null, cx = null, note;
              if (!ok1 || !ok2) {
                const isPar = (!ok1 && kind === 'cb') || (!ok2 && kind === 'ac');
                broken = isPar ? 'Pareto' : 'IIA';
                note = isPar ? String.raw`The Pareto premise fails on this profile — the rule violates Pareto.` : String.raw`$H$ was shown (almost) decisive on this pair at an earlier profile with the **same** opinions on it, yet here the rule rules differently: it **violates IIA**, so the proof breaks.`;
              } else if (!ok3) { broken = 'transitivity'; note = String.raw`Both premises hold but the conclusion does not: the social relation is **not transitive**.`; }
              else {
                cx = decisiveCx(F, H, p, q);
                if (cx) { broken = 'IIA'; ls.push([false, `by IIA, H decisive over ${pairTxt(p, q)}: refuted by another profile`]); note = String.raw`On this profile only $H$ prefers ${LET[p]} to ${LET[q]} and society agrees; **IIA** would make that hold whenever $H$ prefers ${LET[p]} to ${LET[q]}. The search finds a profile where it does not: the rule violates IIA.`; }
                else { ls.push([true, `by IIA: H decisive over ${pairTxt(p, q)} (all 216 profiles ✓)`]); dec = dec.concat([[p, q]]); note = String.raw`**Field expansion.** Only $H$ prefers ${LET[p]} to ${LET[q]} here, the others the reverse; society still puts ${LET[p]} first, and by IIA only these opinions matter — so $H$ is decisive over ${LET[p]} over ${LET[q]}.`; }
              }
              push({ G, G1, G2, H, prof, S, lines: ls, dec: dec.slice(), cx, broken, note, focus: [p, q] });
              return !broken;
            };
            // six pairs: (x,y) → (x,z), (z,y); (x,z) → (y,z); (z,y) → (z,x); (y,z) → (y,x)
            const [x, y, z] = [a, b, c3];
            const chain = [['ac', x, y, z], ['cb', x, y, z], ['cb', x, z, y], ['ac', z, y, x], ['ac', y, z, x]];
            for (const st of chain) if (!doStep(...st)) return out;
            G = H;
            push({ G, dec: dec.slice(), H, lines: [[true, `H = ${coalName(H, n)} is decisive over all 6 ordered pairs`], [true, `H becomes the new G, ${popc(H) > 1 ? 'to be split again' : 'a single voter'}`]], note: String.raw`$H = ${coalName(H, n)}$ is decisive over all six ordered pairs; it becomes the new $G$.` });
          }
          const i = members(G)[0], dprof = range(n).map((j) => (j === i ? [0, 1, 2] : [2, 1, 0])), Sd = F(dprof);
          const allOk = [[0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]].every(([a2, b2]) => !decisiveCx(F, G, a2, b2));
          push({ G, dec: dec.slice(), H: G, final: true, prof: dprof, S: Sd, focus: null, lines: [[Sd[0][1] === 1 && Sd[1][2] === 1, `voter ${i + 1} alone ranks A > B > C, and society follows`], [allOk, `voter ${i + 1}’s strict preferences prevail in all 216 profiles`]], note: String.raw`A single decisive voter: **voter ${i + 1} is a dictator** — exactly what Arrow’s theorem predicts for a rule satisfying (U), (P) and (I).` });
          return out;
        }
        const S = v.steps({ frames, speed: 0.8, still: 'end' });
        const ring6 = (cx, cy, Rr) => {
          const P = [[0, 1], [0, 2], [1, 2], [1, 0], [2, 0], [2, 1]];
          return P.map((pq, k) => ({ pq, X: cx + Rr * Math.cos((k / 6) * 2 * Math.PI - Math.PI / 2), Y: cy + Rr * Math.sin((k / 6) * 2 * Math.PI - Math.PI / 2) }));
        };
        v.render(() => {
          const f = S.frame, c = L.ctx, W = L.width, H = L.height;
          // voters row with coalition roles
          const vx = (i) => W / 2 + (i - 1) * 74;
          range(n).forEach((i) => {
            const inG = f.G & (1 << i), inH = f.H & (1 << i), g1 = f.G1 & (1 << i), g2 = f.G2 & (1 << i);
            const col = inH && !f.final ? 'gold' : f.final && inG ? 'red' : g1 ? 'teal' : g2 ? 'purple' : inG ? 'accent' : 'muted';
            c.beginPath(); c.arc(vx(i), 46, 20, 0, 2 * Math.PI); c.fillStyle = v.color(col, inG || inH ? 0.3 : 0.08); c.fill(); c.strokeStyle = v.color(col); c.lineWidth = inH ? 3 : 1.5; c.stroke();
            txt(v, c, String(i + 1), vx(i), 47, { size: 15, weight: 800, color: col === 'muted' ? 'muted' : 'ink' });
            const lab = [inG && 'G', g1 && 'G₁', g2 && 'G₂', inH && !f.final && 'H'].filter(Boolean).join(' ');
            txt(v, c, lab, vx(i), 80, { size: 10.5, weight: 700, color: col });
          });
          // six ordered pairs on a ring
          const nodes = ring6(W / 2, 200, Math.min(86, H * 0.28)), isDec = (pq) => f.dec.some(([a, b]) => a === pq[0] && b === pq[1]);
          const isFocus = (pq) => f.focus && f.focus[0] === pq[0] && f.focus[1] === pq[1];
          nodes.forEach(({ pq, X, Y }) => {
            const dd = isDec(pq) || f.final || (f.G === 7 && !f.H && !f.broken), col = f.broken && isFocus(pq) ? 'red' : dd ? 'green' : 'faint';
            rr(c, X - 26, Y - 13, 52, 26, 13); c.fillStyle = v.color(col, dd || isFocus(pq) ? 0.22 : 0.05); c.fill(); c.strokeStyle = v.color(col); c.lineWidth = isFocus(pq) ? 2.6 : 1.3; c.stroke();
            chip(v, c, X - 12, Y, pq[0], { r: 8 }); txt(v, c, '›', X, Y, { size: 12, weight: 700, color: 'muted' }); chip(v, c, X + 12, Y, pq[1], { r: 8 });
          });
          const dcount = f.final ? 6 : f.G === 7 && !f.H ? 6 : f.dec.length;
          txt(v, c, f.H && !f.final ? `H = ${coalName(f.H, n)}: decisive over ${dcount} of 6` : f.final ? 'the dictator is decisive over all 6' : `G = ${coalName(f.G, n)}: decisive over all 6`, W / 2, 200, { size: 11, weight: 700, color: f.broken ? 'red' : 'ink' });
          // ---- right: profile + verdict + deductions
          const d = R.ctx, RW = R.width;
          if (f.prof) {
            const roleCol = (i) => (f.H & (1 << i) && !f.final ? 'gold' : f.final && f.G & (1 << i) ? 'red' : f.G1 & (1 << i) ? 'teal' : f.G2 & (1 << i) ? 'purple' : 'muted');
            const roleLab = (i) => (f.final ? (f.G & (1 << i) ? '★' : '') : f.H & (1 << i) ? 'H' : f.G1 & (1 << i) ? 'G₁' : f.G2 & (1 << i) ? 'G₂' : f.G === 7 && !f.H ? 'G' : 'other');
            txt(v, d, 'voters', 71, 14, { size: 10.5, weight: 600, color: 'muted' });
            drawProfile(v, d, 14, 30, f.prof, { r: 11, colW: 38, head: (i) => `${i + 1} ${roleLab(i)}`, headColor: roleCol, ring: (i, cc) => (f.focus && f.focus.includes(cc) ? 'gold' : null) });
            txt(v, d, 'society', 172, 14, { size: 10.5, weight: 600, color: 'muted' });
            drawRel(v, d, 172, 53, f.S, { r: 11, ring: (cc) => (f.focus && f.focus.includes(cc) ? 'gold' : null) });
          }
          if (f.cx) {
            const Scx = RULES[rS.value].F(f.cx), X0 = Math.max(236, RW - 200);
            txt(v, d, 'counterexample', X0 + 80, 14, { size: 10.5, weight: 700, color: 'red' });
            drawProfile(v, d, X0, 30, f.cx, { r: 10, colW: 34, head: (i) => `${i + 1}`, headColor: (i) => (f.H & (1 << i) ? 'gold' : 'muted'), ring: (i, cc) => (f.focus.includes(cc) ? 'red' : null) });
            drawRel(v, d, X0 + 140, 53, Scx, { r: 10 });
          }
          (f.lines || []).forEach(([ok, s2], k) => tag(v, d, ok, s2, 14, 150 + k * 27, { size: 11 }));
          if (!f.prof && !(f.lines || []).length) txt(v, d, 'no profile needed for this step', RW / 2, 80, { size: 12, color: 'muted' });
          if (f.broken) txt(v, d, `the proof breaks: the rule violates ${f.broken}`, RW / 2, R.height - 16, { size: 12.5, weight: 800, color: 'red' });
          else if (f.final) txt(v, d, `dictator found: voter ${members(f.G)[0] + 1}`, RW / 2, R.height - 16, { size: 12.5, weight: 800, color: 'green' });
        });
        v.legend([['gold', 'H, the coalition being expanded', { dot: true }], ['teal', 'G₁', { dot: true }], ['purple', 'G₂', { dot: true }], ['green', 'pair H is decisive over', { dot: true }], ['red', 'where the proof breaks', { dot: true }]]);
        v.readout(() => {
          const fr = S.frames, last = fr[fr.length - 1];
          return last.broken ? `For **${RULES[rS.value].label}** the argument stops at step ${fr.length} of ${fr.length}: the rule violates **${last.broken}**, the hypothesis that step needs.` : `For **${RULES[rS.value].label}** all ${fr.length} steps go through: Pareto, then contraction and field expansion, end at the dictator **voter ${members(last.G)[0] + 1}**.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Sen’s liberal paradox',
      statement: String.raw`Call a social decision rule **minimally liberal** if at least two individuals each have a *right*: a pair of alternatives over which that individual is decisive in both directions (if she prefers $x$ to $y$, society does, and vice versa). Sen’s theorem: no rule with unrestricted domain satisfies weak Pareto and minimal liberalism while always leaving a best alternative (a social relation without cycles). Sen’s example: a copy of *Lady Chatterley’s Lover* can be read by the Prude ($a$), by the Lewd ($b$), or by no one ($c$). The Prude ranks $c \succ a \succ b$; the Lewd ranks $a \succ b \succ c$. The Prude’s right over $\{a, c\}$ gives $c \succ a$; the Lewd’s right over $\{b, c\}$ gives $b \succ c$; both prefer $a$ to $b$, so Pareto gives $a \succ b$ — a cycle $a \succ b \succ c \succ a$ with no best outcome.`,
      idea: String.raw`Rights are a weak form of decisiveness for individuals, and Pareto is decisiveness for everyone; Arrow’s contraction argument (polsci-3.4) already showed that decisive coalitions cannot coexist freely. Sen’s proof needs only one profile: if the two rights concern pairs $\{x, y\}$ and $\{z, w\}$ with a common alternative, say $x = w$, let person 1 rank $x \succ y \succ z$ and person 2 rank $y \succ z \succ x$; then the rights give $x \succ y$ and $z \succ x$, Pareto gives $y \succ z$, and the three preferences form a cycle. With four distinct alternatives the same idea uses a chain of two Pareto comparisons. Neither IIA nor transitivity of social preference is needed — only that some outcome is unbeaten — which is why the result is about the clash between Pareto and liberalism itself.`,
      caption: String.raw`The triangle shows the strict social preferences forced by each principle — the Prude’s right, the Lewd’s right, Pareto — as arrows from the preferred to the less preferred outcome. A gold ring marks an unbeaten outcome; when every outcome is beaten the arrows form a cycle and there is nothing to choose. **Click an outcome** in a person’s ranking to move it up, reassign the rights, or switch Pareto off. The grid runs all 36 pairs of rankings: red cells leave no best outcome. With Pareto and two rights there is always at least one red cell (Sen’s theorem); without Pareto there is none.`,
      deps: ['polsci-3.2'],
      see: ['polsci-3.4', 'polsci-3.3'],
      refs: ['T&P ch. 7', 'Sen (1970), The impossibility of a Paretian liberal, J. Political Economy 78: 152–157'],
      tags: ['Sen', 'liberalism', 'Pareto'],
      credit: 'Amartya Sen, 1970',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Liberal_paradox' },
      viz(v) {
        const Gs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 330, title: 'social preferences forced by rights and Pareto' });
        const Es = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 300, title: 'the two rankings · click an outcome to move it up' });
        const Ms = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true, title: 'all 36 pairs of rankings · red: no best outcome · click a cell' });
        const NAME = ['Prude reads', 'Lewd reads', 'no one reads'], SH = ['a', 'b', 'c'];
        const PNAME = ['Prude', 'Lewd'], PCOL = ['teal', 'pink'];
        const PAIRS = [[0, 1], [1, 2], [0, 2]], pairLab = (k) => `{${SH[PAIRS[k][0]]}, ${SH[PAIRS[k][1]]}}`;
        let rk = [[2, 0, 1], [0, 1, 2]];
        const r1 = v.select('Prude’s right', PAIRS.map((_, k) => ({ value: k, label: pairLab(k) })), 2);
        const r2 = v.select('Lewd’s right', PAIRS.map((_, k) => ({ value: k, label: pairLab(k) })), 1);
        const par = v.toggle('Pareto', true);
        v.button('Sen’s example', () => { rk = [[2, 0, 1], [0, 1, 2]]; r1.set(2); r2.set(1); par.value = true; });
        /** Strict social preferences: [{ x, y, src: [...] }] with x ≻ y. */
        function arrows(R) {
          const m = new Map(), add = (x, y, s) => { const k = x * 3 + y; if (!m.has(k)) m.set(k, { x, y, src: [] }); m.get(k).src.push(s); };
          [r1.value, r2.value].forEach((pk, i) => { const [x, y] = PAIRS[pk]; if (above(R[i], x, y)) add(x, y, i); else add(y, x, i); });
          if (par.value) for (const [x, y] of PAIRS) { if (R.every((r) => above(r, x, y))) add(x, y, 'P'); else if (R.every((r) => above(r, y, x))) add(y, x, 'P'); }
          return [...m.values()];
        }
        const bestOf = (A) => [0, 1, 2].filter((z) => !A.some((a) => a.y === z));
        const srcName = (s) => (s === 'P' ? 'Pareto' : `${PNAME[s]}’s right`), srcCol = (s) => (s === 'P' ? 'green' : PCOL[s]);
        let edGeo = null, gridGeo = null;
        Es.onClick((x, y) => {
          if (!edGeo) return; const px = Es.X(x), py = Es.Y(y);
          for (let i = 0; i < 2; i++) for (let k = 1; k < 3; k++) { const [X, Y] = edGeo(i, k); if (Math.hypot(px - X, py - Y) < 18) { const r = rk[i].slice(); [r[k - 1], r[k]] = [r[k], r[k - 1]]; rk = rk.map((q, j) => (j === i ? r : q)); return; } }
        });
        Ms.onClick((x, y) => { if (!gridGeo) return; const px = Ms.X(x), py = Ms.Y(y), j = Math.floor((px - gridGeo.X0) / gridGeo.cw), i = Math.floor((py - gridGeo.Y0) / gridGeo.ch); if (i >= 0 && i < 6 && j >= 0 && j < 6) rk = [R3[i].slice(), R3[j].slice()]; });
        v.render(() => {
          const A = arrows(rk), B = bestOf(A), c = Gs.ctx, W = Gs.width, H = Gs.height;
          const Rr = Math.min(W * 0.3, H * 0.33), cx = W / 2, cy = H / 2 + 12;
          const pos = [0, 1, 2].map((k) => [cx + Rr * Math.sin((2 * Math.PI * k) / 3), cy - Rr * Math.cos((2 * Math.PI * k) / 3)]);
          const cyc = B.length === 0;
          for (const a of A) {
            const opp = A.some((b) => b.x === a.y && b.y === a.x);
            const M = arrowPx(v, c, pos[a.x][0], pos[a.x][1], pos[a.y][0], pos[a.y][1], { color: cyc || opp ? 'red' : srcCol(a.src[0]), width: 2.6, t0: 26, t1: 28, head: 11, bend: opp ? 16 : -Rr * 0.12 });
            pill(v, c, a.src.map(srcName).join(' + '), M.mx, M.my, { color: srcCol(a.src[0]), size: 10.5 });
          }
          [0, 1, 2].forEach((k) => {
            chip(v, c, pos[k][0], pos[k][1], k, { r: 22, label: SH[k], ring: B.includes(k) ? 'gold' : null });
            txt(v, c, NAME[k], pos[k][0], pos[k][1] + (k === 0 ? -36 : 37), { size: 11, weight: 650, color: 'muted' });
          });
          txt(v, c, cyc ? 'every outcome is beaten: no best choice' : `best: ${B.map((k) => NAME[k]).join(' / ')}`, W / 2, H - 12, { size: 12, weight: 750, color: cyc ? 'red' : 'green' });
          // ---- editor
          const d = Es.ctx, EW = Es.width, colX = (i) => EW * (i ? 0.7 : 0.3);
          edGeo = (i, k) => [colX(i), 70 + k * 56];
          [0, 1].forEach((i) => {
            txt(v, d, PNAME[i], colX(i), 22, { size: 13, weight: 750, color: PCOL[i] });
            const pk = [r1.value, r2.value][i];
            txt(v, d, `right over ${pairLab(pk)}`, colX(i), 40, { size: 10.5, weight: 600, color: 'muted' });
            rk[i].forEach((o, k) => {
              const [X, Y] = edGeo(i, k), inRight = PAIRS[pk].includes(o);
              chip(v, d, X, Y, o, { r: 17, label: SH[o], ring: inRight ? PCOL[i] : null });
              txt(v, d, NAME[o], X, Y + 26, { size: 10, weight: 600, color: 'muted' });
              if (k < 2) txt(v, d, '▾', X, Y + 40, { size: 10, color: 'faint' });
            });
          });
          // ---- grid of all 36 profiles
          const e = Ms.ctx, MW = Ms.width, MH = Ms.height;
          const cw = Math.min(56, (MW - 260) / 6), ch = Math.min(28, (MH - 46) / 6), X0 = 110, Y0 = 34;
          gridGeo = { X0, Y0, cw, ch };
          let red = 0;
          for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
            const R = [R3[i], R3[j]], Bq = bestOf(arrows(R)), bad = Bq.length === 0; if (bad) red++;
            const X = X0 + j * cw, Y = Y0 + i * ch, cur = R3[i].every((q, k) => q === rk[0][k]) && R3[j].every((q, k) => q === rk[1][k]);
            e.fillStyle = v.color(bad ? 'red' : 'green', bad ? 0.55 : 0.12); e.fillRect(X + 1, Y + 1, cw - 2, ch - 2);
            if (cur) { e.strokeStyle = v.color('gold'); e.lineWidth = 3; e.strokeRect(X + 1.5, Y + 1.5, cw - 3, ch - 3); }
          }
          for (let k = 0; k < 6; k++) {
            txt(v, e, R3[k].map((q) => SH[q]).join('>'), X0 - 8, Y0 + (k + 0.5) * ch, { size: 10, weight: 600, color: 'teal', align: 'right' });
            txt(v, e, R3[k].map((q) => SH[q]).join('>'), X0 + (k + 0.5) * cw, Y0 - 9, { size: 9.5, weight: 600, color: 'pink' });
          }
          txt(v, e, 'Prude ↓', 30, Y0 + 3 * ch, { size: 11, weight: 700, color: 'teal' });
          txt(v, e, 'Lewd →', X0 + 6 * cw + 30, Y0 - 9, { size: 11, weight: 700, color: 'pink' });
          const tx = X0 + 6 * cw + 34;
          txt(v, e, `${red} of 36`, tx, Y0 + 2 * ch, { size: 22, weight: 800, color: red ? 'red' : 'green', align: 'left' });
          txt(v, e, red ? 'pairs of rankings leave' : 'pairs of rankings leave', tx, Y0 + 2 * ch + 24, { size: 11, weight: 600, color: 'muted', align: 'left' });
          txt(v, e, 'no best outcome', tx, Y0 + 2 * ch + 40, { size: 11, weight: 600, color: 'muted', align: 'left' });
        });
        v.legend([['teal', 'Prude’s right'], ['pink', 'Lewd’s right'], ['green', 'Pareto'], ['red', 'cycle / conflict'], ['gold', 'unbeaten outcome', { dot: true }]]);
        v.readout(() => {
          const A = arrows(rk), B = bestOf(A);
          let red = 0; for (const a of R3) for (const b of R3) if (!bestOf(arrows([a, b])).length) red++;
          const s = A.map((a) => `${SH[a.x]} ≻ ${SH[a.y]} (${a.src.map(srcName).join(', ')})`).join('; ');
          const same = r1.value === r2.value;
          return `Forced: ${s}. ${B.length ? `Choosable: ${B.map((k) => NAME[k]).join(', ')}.` : '**No outcome is unbeaten.**'} Over all 36 profiles, ${red} leave no best outcome${par.value && !same ? ' — at least one always does, whatever pairs the rights cover: Sen’s theorem.' : !par.value && !same ? ': without Pareto, two rights alone can never cycle.' : ': both rights cover the same pair, so they can contradict each other directly.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Gibbard–Satterthwaite theorem',
      statement: String.raw`Let a **voting rule** choose a single winner from every profile of strict rankings of the alternatives. If the rule can produce at least three different winners (its range has $\ge 3$ elements) and it is **strategy-proof** — no voter, at any profile, can obtain a winner she prefers by reporting a ranking other than her true one — then it is a **dictatorship**: one fixed voter’s top choice always wins. Equivalently, every non-dictatorial rule with three or more possible outcomes is **manipulable** at some profile. With only two possible outcomes, majority rule is strategy-proof and non-dictatorial.`,
      idea: String.raw`Strategy-proofness forces *strong monotonicity*: if $x$ wins and some voters move $x$ up relative to the others, $x$ must still win, for otherwise a voter could switch between the two profiles and gain. With a range of at least three outcomes, monotonicity also gives unanimity, and the Muller–Satterthwaite theorem (polsci-3.8) turns a strongly monotone, unanimous rule into a dictatorship by the same decisive-set reasoning as Arrow’s theorem (polsci-3.3). So the only way to remove every incentive to lie is to let one voter decide or to restrict the outcomes to two. The theorem says manipulation is *possible*, not that it is easy or frequent — how often it pays depends on the rule (polsci-3.7).`,
      caption: String.raw`Edit the ballots (drag a bar to change a bloc’s size, click a letter to move it up) and pick a rule. The search tries every voter and every possible false ranking and shows the most profitable lie: the voter’s true ballot, the ballot she reports, and the winner before and after. *Find a profitable lie* searches random electorates when the current one has none. Below, an exhaustive count over **all** electorates of 2 to 7 voters with three candidates (weighted as in the impartial culture): every rule with three possible winners is manipulable somewhere — except the dictatorship, and the two-outcome “A vs B” rule, which break the hypotheses.`,
      deps: ['polsci-3.3', 'polsci-1.2', 'polsci-1.5', 'polsci-1.4'],
      see: ['polsci-3.7', 'polsci-3.8', 'polsci-3.9'],
      refs: ['T&P ch. 7', 'Gibbard (1973), Econometrica 41: 587–601', 'Satterthwaite (1975), J. Economic Theory 10: 187–217'],
      tags: ['strategy-proofness', 'manipulation', 'Gibbard–Satterthwaite'],
      credit: 'Allan Gibbard, 1973; Mark Satterthwaite, 1975',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbard%E2%80%93Satterthwaite_theorem' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, minWidth: 360, title: 'ballots' });
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, minWidth: 330, title: 'the most profitable lie' });
        const X = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 180, full: true, title: 'share of all electorates (3 candidates) where some voter can gain by lying — exhaustive' });
        const PRE = { 3: mkProfile(3, [[2, 'ACB'], [2, 'CAB'], [1, 'BAC'], [2, 'BCA']]), 4: mkProfile(4, [[1, 'CADB'], [2, 'ACBD'], [2, 'CDBA'], [3, 'BACD']]) };
        const P = copyProfile(PRE[3]);
        const ruleS = v.select('rule', SCF.map((r) => ({ value: r.id, label: r.label })), 'borda');
        v.select('candidates', [{ value: 3, label: '3' }, { value: 4, label: '4' }], 3, { onChange: (m) => setProfile(P, PRE[m]) });
        let seed = 11, msg = '';
        const rule = () => SCF.find((r) => r.id === ruleS.value);
        const voters = (Q) => { const out = []; Q.blocs.forEach((b) => { for (let k = 0; k < b.n; k++) out.push(b.r); }); return out; };
        const win = (Q) => (total(Q) ? rule().w(voters(Q)) : 0);
        /** Best single-voter lie at bloc level: { i, lie, before, after, gain } or null. */
        function bestLie(Q) {
          const w0 = win(Q), R = perms(Q.m); let best = null;
          Q.blocs.forEach((b, i) => {
            if (!b.n) return;
            for (const lie of R) {
              if (lie.every((c, k) => c === b.r[k])) continue;
              const w1 = win(shift(Q, i, 1, lie));
              if (w1 !== w0 && above(b.r, w1, w0)) { const gain = b.r.indexOf(w0) - b.r.indexOf(w1); if (!best || gain > best.gain) best = { i, lie, before: w0, after: w1, gain }; }
            }
          });
          return best;
        }
        v.button('Find a profitable lie', () => {
          const r = v.rng(seed++), R = perms(P.m);
          for (let t = 0; t < 400; t++) {
            const nb = 3 + Math.floor(r() * 2);
            const Q = { m: P.m, blocs: range(nb).map(() => ({ n: 1 + Math.floor(r() * 3), r: R[Math.floor(r() * R.length)].slice() })) };
            if (bestLie(Q)) { setProfile(P, tidy(Q)); msg = `found after ${t + 1} random electorates`; return; }
          }
          msg = 'no profitable lie in 400 random electorates';
        });
        const ed = blocEditor(v, E, P, { max: 6, rank: true, rowMax: 40, onEdit: () => { msg = ''; } });
        // exhaustive manipulability share over all anonymous profiles of n voters, 3 candidates, IC weights
        const cache = new Map();
        const lf = range(10).map((k) => (k ? Math.log(k) : 0)).map((_, k, a) => a.slice(0, k + 1).reduce((s, x) => s + x, 0));
        function share(id, n) {
          const key = id + n; if (cache.has(key)) return cache.get(key);
          const w = SCF.find((r) => r.id === id).w, cnt = Array(6).fill(0); let tot = 0, man = 0, nprof = 0, nman = 0;
          const rec = (k, left) => {
            if (k === 5) {
              cnt[5] = left; const prof = []; cnt.forEach((c, t) => { for (let j = 0; j < c; j++) prof.push(R3[t]); });
              const wt = Math.exp(lf[n] - sum(cnt.map((c) => lf[c])) - n * Math.log(6)); tot += wt; nprof++;
              const w0 = w(prof); let bad = false;
              for (let t = 0; t < 6 && !bad; t++) {
                if (!cnt[t]) continue; const i = prof.findIndex((r) => r === R3[t]);
                for (const lie of R3) { if (lie === R3[t]) continue; const q = prof.slice(); q[i] = lie; const w1 = w(q); if (w1 !== w0 && above(R3[t], w1, w0)) { bad = true; break; } }
              }
              if (bad) { man += wt; nman++; }
              return;
            }
            for (let c = 0; c <= left; c++) { cnt[k] = c; rec(k + 1, left - c); }
          };
          rec(0, n);
          const out = { p: man / tot, nprof, nman }; cache.set(key, out); return out;
        }
        v.render(() => {
          ed.draw();
          const c = M.ctx, W = M.width, H = M.height, best = total(P) ? bestLie(P) : null, w0 = win(P);
          txt(v, c, `${rule().label} elects`, W / 2 - 14, 20, { size: 12, weight: 650, color: 'muted', align: 'right' });
          chip(v, c, W / 2 + 4, 20, w0, { r: 11 });
          txt(v, c, 'sincerely', W / 2 + 20, 20, { size: 12, weight: 650, color: 'muted', align: 'left' });
          if (!best) {
            txt(v, c, 'no voter can gain by lying here', W / 2, H / 2 - 10, { size: 13, weight: 750, color: 'green' });
            txt(v, c, rule().dictator ? 'a dictatorship is strategy-proof' : rule().two ? 'only two possible winners: strategy-proof' : 'try another profile, or search', W / 2, H / 2 + 12, { size: 11.5, color: 'muted' });
            if (msg) txt(v, c, msg, W / 2, H - 14, { size: 10.5, color: 'muted' });
          } else {
          const b = P.blocs[best.i], x1 = W * 0.2, x2 = W * 0.45;
          txt(v, c, 'true ranking', x1, 50, { size: 11, weight: 650, color: 'muted' });
          txt(v, c, 'reported', x2, 50, { size: 11, weight: 650, color: 'gold' });
          drawBallot(v, c, x1, 74, b.r, { r: 12, gap: 30, ring: (cc) => (cc === best.after ? 'green' : cc === best.before ? 'red' : null) });
          drawBallot(v, c, x2, 74, best.lie, { r: 12, gap: 30, ring: (cc) => (cc === best.after ? 'green' : cc === best.before ? 'red' : null) });
          b.r.forEach((cc, k) => { const k2 = best.lie.indexOf(cc); if (k2 !== k) arrowPx(v, c, x1 + 16, 74 + k * 30, x2 - 16, 74 + k2 * 30, { color: 'gold', width: 1.4, head: 6, alpha: 0.8 }); });
          const xr = W * 0.76;
          txt(v, c, 'winner', xr, 50, { size: 11, weight: 650, color: 'muted' });
          txt(v, c, 'honest', xr - 30, 74, { size: 10.5, weight: 600, color: 'muted' }); chip(v, c, xr + 18, 74, best.before, { r: 12, ring: 'red' });
          arrowPx(v, c, xr + 18, 90, xr + 18, 118, { color: 'gold', width: 2, head: 8 });
          txt(v, c, 'lying', xr - 30, 134, { size: 10.5, weight: 600, color: 'gold' }); chip(v, c, xr + 18, 134, best.after, { r: 12, ring: 'green' });
          const ord = ['first', 'second', 'third', 'fourth'];
          txt(v, c, `one voter of the ${rkStr(b.r, '')} bloc: ${ord[b.r.indexOf(best.before)]} choice → ${ord[b.r.indexOf(best.after)]} choice`, W / 2, H - 34, { size: 11.5, weight: 700, color: 'green' });
          if (msg) txt(v, c, msg, W / 2, H - 14, { size: 10.5, color: 'muted' });
          }
          // ---- exhaustive bars
          const e = X.ctx, XW = X.width, XH = X.height, ns = [2, 3, 4, 5, 6, 7], bw = (XW - 120) / ns.length;
          const y0 = 18, y1 = XH - 30, Yv = (p) => y1 - p * (y1 - y0);
          [0, 0.25, 0.5, 0.75, 1].forEach((p) => { hl(v, e, 60, XW - 20, Yv(p), 'grid'); txt(v, e, pct(p), 52, Yv(p), { size: 9.5, color: 'muted', align: 'right', weight: 500 }); });
          ns.forEach((n, k) => {
            const S = share(ruleS.value, n), Xc = 70 + (k + 0.5) * bw;
            rr(e, Xc - bw * 0.3, Yv(S.p), bw * 0.6, Math.max(1.5, y1 - Yv(S.p)), 3); e.fillStyle = v.color(S.nman ? 'red' : 'green', 0.5); e.fill();
            txt(v, e, S.nman ? pct(S.p, 1) : '0 — strategy-proof', Xc, Math.min(Yv(S.p) - 9, y1 - 9), { size: 10.5, weight: 700, color: S.nman ? 'ink' : 'green', halo: true });
            txt(v, e, `n = ${n}`, Xc, y1 + 12, { size: 10.5, weight: 600, color: 'muted' });
          });
        });
        v.legend([['red', 'honest winner', { dot: true }], ['green', 'winner after the lie', { dot: true }], ['gold', 'the reported ballot']]);
        v.readout(() => {
          const best = total(P) ? bestLie(P) : null, r = rule(), S7 = share(ruleS.value, 7), S5 = share(ruleS.value, 5);
          const head = best ? `**${r.label}** is manipulable here: one ${rkStr(P.blocs[best.i].r)} voter reports ${rkStr(best.lie)} and turns ${LET[best.before]} into ${LET[best.after]}, whom she prefers.` : `At this electorate no single voter can gain under **${r.label}**.`;
          return `${head} Exhaustively, with 3 candidates: ${S5.nman} of ${S5.nprof} electorates of 5 voters and ${S7.nman} of ${S7.nprof} of 7 voters are manipulable (${pct(S7.p, 1)} of impartial-culture probability). ${r.dictator || r.two ? 'Zero, as the theorem allows: this rule is a dictatorship or has only two possible winners.' : 'Never zero: the rule has three possible winners and no dictator.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Strategic voting under plurality, Borda and IRV',
      statement: String.raw`Rules differ greatly in how often strategic voting pays. Call an electorate **coalitionally manipulable** under a rule if some candidate $y$ and the group of voters who all prefer $y$ to the sincere winner could make $y$ win by changing their ballots. The characteristic strategies are **compromising** under plurality (abandoning a hopeless favourite for a viable second choice), **burying** under the Borda count (ranking the main rival last) and **push-over** under instant runoff (ranking a weak candidate first to change who is eliminated). In simulations with three candidates, instant runoff is manipulable far less often than plurality, and the Borda count most often; under the impartial culture the shares for plurality and Borda approach 1 as the electorate grows, while that of IRV stays low.`,
      idea: String.raw`Gibbard–Satterthwaite (polsci-3.6) guarantees manipulable profiles but says nothing about their frequency. Borda rewards a coalition for every place it moves a rival down, so a group preferring $y$ to the winner $w$ can nearly always close the gap by burying $w$. Plurality ignores all but first places, so the coalition simply concentrates its first places on $y$, which works whenever $y$ is the strongest candidate among those voters. IRV is harder to steer: the coalition can only change who is eliminated first, and that helps only when $y$ beats the remaining finalist head to head — which is why IRV and Condorcet–IRV hybrids came out as the most manipulation-resistant common rules in large simulation studies.`,
      caption: String.raw`The chart estimates, for each electorate size, the share of random electorates (three candidates) that a coalition can manipulate, computed **exactly** for each sampled electorate by trying every useful coalition strategy. Switch between the impartial culture (every ranking equally likely) and a one-dimensional spatial electorate (voters and candidates on a left–right line, so preferences are single-peaked); bars are ±2 standard errors. Pick an electorate size with the slider: the triangle shows one sampled electorate (how many voters hold each ranking) and the strategy that works under each rule, if any. *New sample* draws another electorate of that size.`,
      deps: ['polsci-3.6', 'polsci-1.2', 'polsci-1.5', 'polsci-1.4'],
      see: ['polsci-2.5', 'polsci-6.4'],
      refs: ['T&P ch. 7', 'Green-Armytage, Tideman & Cosman (2016), Statistical evaluation of voting rules, Social Choice and Welfare 46: 183–212'],
      tags: ['strategic voting', 'manipulation', 'simulation'],
      scope: String.raw`Holds for the models simulated here: three candidates, voters with complete strict rankings, sincere voting by everyone outside the coalition, and full information about the ballots. Real electorates also differ in information and coordination, which make manipulation harder than these shares suggest.`,
      viz(v) {
        const L = v.stage({ x: [2.6, 125], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 370, minWidth: 360, xlabel: 'voters n', ylabel: 'share manipulable', title: 'coalitional manipulability, 3 candidates' });
        const Rt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, minWidth: 340, title: 'one sampled electorate' });
        const cult = v.select('electorate', [{ value: 'ic', label: 'impartial culture' }, { value: 'sp', label: '1-D spatial' }], 'ic');
        const NS = [3, 5, 7, 11, 15, 21, 31, 51, 75, 101];
        const nS = v.slider('voters $n$ (sample)', 0, NS.length - 1, 4, { int: true, fmt: (k) => String(NS[k]) });
        let sampleSeed = 1;
        v.button('New sample', () => { sampleSeed++; });
        const RK = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        const idx = (a, b) => RK.findIndex((q) => q[0] === a && q[1] === b);
        const first = (s) => { let w = 0; for (let c = 1; c < 3; c++) if (s[c] > s[w]) w = c; return w; };
        const plur = (cnt) => { const s = [0, 0, 0]; RK.forEach((r, k) => { s[r[0]] += cnt[k]; }); return first(s); };
        const borda = (cnt) => { const s = [0, 0, 0]; RK.forEach((r, k) => { s[r[0]] += 2 * cnt[k]; s[r[1]] += cnt[k]; }); return first(s); };
        const irv3 = (cnt) => {
          const s = [0, 0, 0]; RK.forEach((r, k) => { s[r[0]] += cnt[k]; });
          const n = s[0] + s[1] + s[2], lead = first(s); if (s[lead] > n / 2) return lead;
          let lo = 0; for (let c = 1; c < 3; c++) if (s[c] <= s[lo]) lo = c;
          const [a, b] = [0, 1, 2].filter((c) => c !== lo); let va = 0, vb = 0;
          RK.forEach((r, k) => { const t = r.find((c) => c !== lo); if (t === a) va += cnt[k]; else vb += cnt[k]; });
          return vb > va ? b : a;
        };
        const METH = [{ id: 'plur', label: 'plurality', f: plur, col: 'blue' }, { id: 'borda', label: 'Borda', f: borda, col: 'orange' }, { id: 'irv', label: 'IRV', f: irv3, col: 'purple' }];
        /** Exact coalitional manipulation for three candidates; returns { y, k, how, kind } or null. */
        function manip(id, cnt) {
          const f = METH.find((m) => m.id === id).f, w = f(cnt);
          for (const y of [0, 1, 2]) {
            if (y === w) continue;
            const z = 3 - w - y, Mn = RK.map((r, k) => (r.indexOf(y) < r.indexOf(w) ? cnt[k] : 0)), k = sum(Mn);
            if (!k) continue;
            const base = cnt.map((c, i) => c - Mn[i]);
            if (id === 'plur') { const c2 = base.slice(); c2[idx(y, z)] += k; if (plur(c2) === y) return { y, w, k, kind: 'compromise', how: `all ${k} voters who prefer ${LET[y]} to ${LET[w]} vote ${LET[y]} first` }; }
            else if (id === 'borda') { for (let j = 0; j <= k; j++) { const c2 = base.slice(); c2[idx(y, w)] += j; c2[idx(y, z)] += k - j; if (borda(c2) === y) return { y, w, k, kind: 'burying', how: `the ${k} voters preferring ${LET[y]} to ${LET[w]} rank ${LET[y]} first and ${k - j} of them bury ${LET[w]} last` }; } }
            else for (let b = 0; b <= k; b++) for (let c = 0; b + c <= k; c++) {
              const c2 = base.slice(); c2[idx(y, z)] += k - b - c; c2[idx(z, y)] += b; c2[idx(w, y)] += c;
              if (irv3(c2) === y) return { y, w, k, kind: b || c ? 'push-over' : 'compromise', how: b || c ? `${b ? `${b} rank ${LET[z]}` : `${c} rank ${LET[w]}`} first (then ${LET[y]}) to change who is eliminated` : `the ${k} voters preferring ${LET[y]} to ${LET[w]} rank ${LET[y]} first` };
            }
          }
          return null;
        }
        /** Random electorate of n voters as counts over the six rankings. */
        function sample(r, n, culture) {
          const cnt = [0, 0, 0, 0, 0, 0];
          if (culture === 'ic') { for (let i = 0; i < n; i++) cnt[Math.floor(r() * 6)]++; return cnt; }
          const cand = [0, 1, 2].map(() => (r() * 2 - 1) * 1.4);
          for (let i = 0; i < n; i++) {
            const u = Math.max(1e-12, r()), x = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
            const ord = [0, 1, 2].sort((a, b) => Math.abs(x - cand[a]) - Math.abs(x - cand[b]));
            cnt[idx(ord[0], ord[1])]++;
          }
          return cnt;
        }
        const cache = new Map();
        function rates(culture) {
          if (cache.has(culture)) return cache.get(culture);
          const r = v.rng(culture === 'ic' ? 2024 : 77), T = 260;
          const out = NS.map((n) => { const hits = [0, 0, 0]; for (let t = 0; t < T; t++) { const cnt = sample(r, n, culture); METH.forEach((m, i) => { if (manip(m.id, cnt)) hits[i]++; }); } return hits.map((h) => h / T); });
          const res = { out, T }; cache.set(culture, res); return res;
        }
        v.render(() => {
          const Rs = rates(cult.value), k0 = nS.value;
          L.vband(NS[k0] / 1.12, NS[k0] * 1.12, { color: 'gold', alpha: 0.12 });
          METH.forEach((m, i) => {
            const pts = NS.map((n, k) => [n, Rs.out[k][i]]);
            L.path(pts, { color: m.col, width: 2.4 });
            pts.forEach(([n, p]) => { const se = 2 * Math.sqrt((p * (1 - p)) / Rs.T); L.line(n, Math.max(0, p - se), n, Math.min(1, p + se), { color: m.col, width: 1.3, alpha: 0.6 }); L.dot(n, p, { r: 3.5, color: m.col }); });
          });
          // sampled electorate
          const r = v.rng(1000 * sampleSeed + k0 * 7 + (cult.value === 'ic' ? 0 : 500)), n = NS[k0], cnt = sample(r, n, cult.value);
          const c = Rt.ctx, W = Rt.width, H = Rt.height;
          drawRepTriangle(v, Rt, cnt, [8, 0, W - 8, H - 132], { pairs: false });
          let Y = H - 118;
          METH.forEach((m) => {
            const w = m.f(cnt), res = manip(m.id, cnt);
            txt(v, c, m.label, 12, Y, { size: 11.5, weight: 750, color: m.col, align: 'left' });
            txt(v, c, `elects ${LET[w]}`, 84, Y, { size: 11.5, weight: 650, align: 'left' });
            txt(v, c, res ? `${res.kind} → ${LET[res.y]}` : 'not manipulable', 158, Y, { size: 11.5, weight: 750, color: res ? 'red' : 'green', align: 'left' });
            if (res) txt(v, c, res.how, 12, Y + 15, { size: 9.5, weight: 500, color: 'muted', align: 'left' });
            Y += res ? 36 : 24;
          });
        });
        v.legend(METH.map((m) => [m.col, m.label]));
        v.readout(() => {
          const Rs = rates(cult.value), k0 = nS.value, n = NS[k0], rr2 = Rs.out[k0];
          return `With ${n} voters (${cult.value === 'ic' ? 'impartial culture' : '1-D spatial'}, ${Rs.T} electorates per point): plurality **${pct(rr2[0])}**, Borda **${pct(rr2[1])}**, IRV **${pct(rr2[2])}** of electorates can be manipulated by a coalition. ${rr2[2] < rr2[0] && rr2[2] < rr2[1] ? 'IRV resists best' : 'IRV does not resist best here'}; ${rr2[1] >= rr2[0] ? 'Borda is the easiest to steer, by burying the winner.' : 'here plurality is the easiest to steer.'}`;
        });
      },
    },
  ],
};
