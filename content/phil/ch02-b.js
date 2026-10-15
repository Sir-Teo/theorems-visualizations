// Philosophy & Reasoning — Chapter 2: Paradoxes of the infinite (items 2.6–2.10; 2.1–2.5 in ch02.js)

// ---------- shared helpers ----------
const SUBD = '₀₁₂₃₄₅₆₇₈₉';
const subNum = (n) => String(n).split('').map((d) => SUBD[+d]).join('');
const gcdInt = (a, b) => (b ? gcdInt(b, a % b) : a);
/** The rationals in [0, 1] listed by denominator: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, … (first K). */
function rationals01(K) {
  const out = [[0, 1], [1, 1]];
  for (let q = 2; out.length < K; q++) for (let p = 1; p < q && out.length < K; p++) if (gcdInt(p, q) === 1) out.push([p, q]);
  return out.slice(0, K);
}
/** Total length of a union of intervals [a, b]. */
function unionLength(iv) {
  const s = iv.map(([a, b]) => [Math.max(0, a), Math.min(1, b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let tot = 0, cur = null;
  for (const [a, b] of s) { if (!cur || a > cur[1]) { if (cur) tot += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); }
  if (cur) tot += cur[1] - cur[0];
  return tot;
}
/** Cantor's pairing ℕ×ℕ → ℕ (1-based): (c, s) ↦ (c+s−1)(c+s−2)/2 + s. */
const pairNum = (c, s) => ((c + s - 1) * (c + s - 2)) / 2 + s;
/** 12000 → "1.2·10⁴" for labels. */
const bigNum = (x) => { if (x < 1e4) return String(Math.round(x)); const e = Math.floor(Math.log10(x)); return `${(x / 10 ** e).toFixed(1)}·10${String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('')}`; };
/** Quadratic Bézier point. */
const bez = (p0, p1, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];

export default {
  collection: 'phil',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Paradox',
      name: 'Ross–Littlewood balls and urn',
      statement: String.raw`Balls numbered $1, 2, 3, \dots$ are put into an urn in stages that converge to noon. At stage $n$ (at $2^{-n}$ minutes before noon) balls $10n-9, \dots, 10n$ go in and one ball is taken out. After stage $n$ the urn holds $9n$ balls, a number that grows without bound. **How many balls are in the urn at noon?** The answer depends on *which* ball is removed:
- remove ball $n$ at stage $n$: every ball is eventually removed, and the urn is **empty** at noon;
- remove ball $10n$ at stage $n$: the balls not divisible by 10 are never removed, and the urn holds **infinitely many**;
- remove a ball chosen uniformly at random: with probability 1 every ball is eventually removed, and the urn is **empty** (Ross 1976).

So the count at noon is not the limit of the counts. Whether the set-theoretic answer correctly describes the urn at noon is itself disputed: some hold that the story does not determine the state at noon at all, as with Thomson’s lamp.`,
      idea: String.raw`Ask, for each ball, *when* it leaves. If ball $b$ is removed at a finite stage, it is absent from the urn at noon. If it is never removed, it is present. With the first rule ball $b$ leaves at stage $b$, so the set of balls left at noon is the limit of the sets of balls in the urn, which is empty, even though the sizes of those sets tend to infinity. Cardinality is not continuous under such limits, and countable sets (pma 2.4) can be emptied one element at a time. In the random version ball $b$ survives stage $j$ with probability $1-\tfrac{1}{9j+1}$, and the product of these factors tends to $0$, because $\sum \tfrac1{9j+1}$ diverges. It does so very slowly, like $n^{-1/9}$, so most early balls are still present after millions of stages. Countable additivity then makes “every ball eventually removed” an event of probability 1. Critics (e.g. van Bendegem; Allis and Koetsier defend the set-theoretic answer) dispute whether the limit of the sets is the state of the urn at noon, or whether a supertask fixes any noon state at all (2.5).`,
      caption: String.raw`Choose a removal rule and step through the stages. In the grid each row is one stage’s ten balls: blue balls are in the urn, crossed-out balls have been removed, and the gold ring marks the ball taken out at the current stage. Under every rule the urn holds $9m$ balls after stage $m$. The right panel answers the real question: when does each ball leave? Under the first rule every ball has a finite removal stage, under the second most balls never leave, and in the random version the survival probability of every ball decays to 0, slowly.`,
      deps: ['phil-2.5', 'pma-2.4'],
      refs: ['SEP “Supertasks”', 'Littlewood 1953', 'Ross 1976'],
      credit: 'J. E. Littlewood, 1953; Sheldon Ross, 1976',
      tags: ['supertasks', 'infinity', 'limits'],
      viz(v) {
        const strat = v.select('removal rule', [{ value: 'low', label: 'remove ball $n$ at stage $n$' }, { value: 'ten', label: 'remove ball $10n$' }, { value: 'rnd', label: 'remove a random ball' }], 'low');
        const mS = v.slider('stage $m$', 0, 10, 6, { int: true });
        const G = v.stage({ x: [-1.9, 10.4], y: [0.3, 11.3], axes: false, height: 370, weight: 1.05 });
        const R = v.stage({ x: [-8, 104], y: [-9, 112], axes: 'box', height: 370, weight: 1 });
        // one seeded random run: removal stage of every ball that ever enters (up to 400 stages)
        const SIM = 400, remRnd = new Map(), alive = [];
        { const r = v.rng(7); const urn = []; for (let s = 1; s <= SIM; s++) { for (let b = 10 * s - 9; b <= 10 * s; b++) urn.push(b); const i = r.int(0, urn.length - 1); remRnd.set(urn[i], s); urn.splice(i, 1); alive.push(urn.filter((b) => b <= 100).length); } }
        const remStage = (b, k) => (k === 'low' ? b : k === 'ten' ? (b % 10 === 0 ? b / 10 : Infinity) : remRnd.get(b) ?? Infinity);
        // survival probability of ball b through stage n: prod_{j=ceil(b/10)}^{n} (1 - 1/(9j+1)); exact logs to 2e5, then the integral tail
        const NEX = 200000, cum = new Float64Array(NEX + 1);
        for (let j = 1; j <= NEX; j++) cum[j] = cum[j - 1] + Math.log(1 - 1 / (9 * j + 1));
        const surv = (b, n) => { const j0 = Math.ceil(b / 10); if (n < j0) return 1; const m = Math.min(n, NEX); let l = cum[Math.floor(m)] - cum[j0 - 1]; if (n > NEX) l -= Math.log((9 * n + 5.5) / (9 * NEX + 5.5)) / 9; return Math.exp(l); };
        let st = null;
        v.render(() => {
          const k = strat.value, m = mS.value;
          // ---- the grid of balls, one row per stage
          for (let n = 1; n <= 10; n++) {
            const y = 10.25 - n;
            G.text(`stage ${n}`, -0.25, y, { align: 'right', size: 11, weight: n === m ? 700 : 500, color: n === m ? 'ink' : 'muted' });
            for (let j = 1; j <= 10; j++) {
              const b = 10 * (n - 1) + j, x = j - 0.5, rs = remStage(b, k);
              if (n > m) { G.circle(x, y, 0.36, { color: 'faint', width: 1 }); continue; }
              const gone = rs <= m;
              G.circle(x, y, 0.38, { fill: gone ? 'muted' : 'blue', fillAlpha: gone ? 0.1 : 0.75, color: gone ? 'faint' : 'blue', width: 1.2 });
              G.text(String(b), x, y, { align: 'center', size: b >= 100 ? 8.5 : 9.5, weight: 600, color: gone ? 'muted' : 'panel', halo: false });
              if (gone) G.line(x - 0.3, y - 0.3, x + 0.3, y + 0.3, { color: 'red', width: 1.6 });
              if (rs === m) G.circle(x, y, 0.47, { color: 'gold', width: 2.6 });
            }
          }
          const inUrn = (() => { let c = 0; for (let b = 1; b <= 10 * m; b++) if (remStage(b, k) > m) c++; return c; })();
          G.text(`after stage ${m}: ${10 * m} in, ${m} out, ${inUrn} in the urn`, 4.95, 10.9, { align: 'center', size: 12.5, weight: 700, color: 'ink' });
          // ---- right panel
          if (k !== 'rnd') {
            R.setView([-8, 104], [-9, 112]); R.setTicks([0, 20, 40, 60, 80, 100], [0, 20, 40, 60, 80, 100]);
            R.setTitle('stage at which ball $b$ is removed');
            R.hband(0, m, { color: 'red', alpha: 0.07 });
            for (let b = 1; b <= 100; b++) {
              const rs = remStage(b, k);
              if (isFinite(rs)) R.dot(b, rs, { r: 3, color: rs <= m ? 'red' : 'blue' });
              else R.line(b, 101, b, 108, { color: 'blue', width: 1.6, alpha: 0.8 });
            }
            R.text(k === 'low' ? 'ball b leaves at stage b: every removal stage is finite' : 'never removed (∞): every ball not divisible by 10', k === 'low' ? 2 : 50, k === 'low' ? 95 : 104.5, { align: k === 'low' ? 'left' : 'center', size: 11, weight: 600, color: k === 'low' ? 'red' : 'blue' });
            R.text(`removed by stage ${m}`, 60, m + 4, { size: 10.5, color: 'red' });
          } else {
            R.setView([-0.7, 12.4], [-0.09, 1.12]); R.setTicks([[0, '1'], [2, '100'], [4, '10⁴'], [6, '10⁶'], [8, '10⁸'], [10, '10¹⁰'], [12, '10¹²']], [0, 0.25, 0.5, 0.75, 1]);
            R.setTitle('chance a ball is still in the urn after stage $n$');
            for (const [b, col] of [[1, 'blue'], [100, 'teal']]) {
              const pts = []; for (let i = 0; i <= 240; i++) { const e = (12 * i) / 240; pts.push([e, surv(b, 10 ** e)]); }
              R.path(pts, { color: col, width: 2.4 });
              const ex = b === 1 ? 5 : 8.5; R.text(`ball ${b}`, ex, surv(b, 10 ** ex), b === 1 ? { dx: -6, dy: 10, align: 'right', size: 11, weight: 600, color: col } : { dx: 6, dy: -10, size: 11, weight: 600, color: col });
            }
            for (let n = 1; n <= SIM; n = Math.ceil(n * 1.25)) R.dot(Math.log10(n), alive[n - 1] / Math.min(100, 10 * n), { r: 2.8, color: 'gold' });
            R.text('→ 0 like n^(−1/9)', 12.2, 0.2, { align: 'right', size: 11, color: 'muted' });
            R.text('simulated run: share of balls 1–100 still inside', 0.1, 1.06, { size: 10.5, color: 'gold' });
          }
          st = { k, m, inUrn };
        });
        v.legend([['blue', 'in the urn', { dot: true }], ['red', 'removed', { dot: true }], ['gold', 'removed at the current stage', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, m } = st;
          const head = `After stage ${m}: $10\\cdot${m}$ balls in, ${m} out, **${9 * m}** in the urn (the same under every rule, and unbounded as the stages run to noon)`;
          if (k === 'low') return head + ' · ball $b$ leaves at stage $b$, so every ball is gone by noon: the urn is **empty**, although the counts tend to $\\infty$. The limit of the counts is not the count of the limit.';
          if (k === 'ten') return head + ' · only multiples of 10 ever leave, so at noon the urn holds **infinitely many** balls: all those not divisible by 10.';
          return head + ` · ball 1 is still inside after $10^6$ stages with probability ${v.fix(surv(1, 1e6), 3)}, after $10^{12}$ with ${v.fix(surv(1, 1e12), 3)}; the product $\\prod(1-\\tfrac1{9j+1})$ tends to 0, so with probability 1 every ball leaves, and the urn is **empty at noon** almost surely.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Paradox',
      name: 'Benardete’s Grim Reapers',
      statement: String.raw`A man is alive at midnight. There are infinitely many Grim Reapers, numbered $1, 2, 3, \dots$; reaper $n$ will strike at $2^{-n}$ hours past midnight (so reaper 1 at 12:30, reaper 2 at 12:15, …) **if and only if the man is still alive then**, killing him instantly. Reaper 1 guarantees that he is dead by 12:30. But no reaper can strike: reaper $n$ strikes only if the man is alive at its time, which requires every earlier reaper $n+1, n+2, \dots$ to have held back. Reaper $n+1$ would then have found him alive and struck, so reaper $n$ does not strike, and this holds for every $n$. **He is dead, but no reaper killed him.**

With finitely many reapers there is no puzzle: the earliest one strikes. With infinitely many, the reapers’ conditional instructions cannot all be carried out together.`,
      idea: String.raw`Write $s_n$ for “reaper $n$ strikes”. The instructions say $s_n \iff \neg(s_{n+1}\vee s_{n+2}\vee\cdots)$. Suppose some reaper strikes, and let $n$ be the earliest striker (the one with the largest index; if there is no largest, the striker with any index $n$ was preceded by another, violating its own instruction). Then no reaper after $n$ strikes, so reaper $n+1$ found the man alive and should have struck, a contradiction. If nobody strikes, reaper 1 found him alive and should have struck. So no assignment satisfies every instruction, much as no assignment of truth values satisfies Yablo’s infinite list of sentences (4.6). What follows is contested. Most conclude only that such an ensemble of reapers is logically impossible (the “unsatisfiable pact” reading of Hawthorne and Shackel). Pruss and Koons argue that it supports causal finitism, the view that nothing can have infinitely many causal antecedents. Critics of causal finitism reject that step.`,
      caption: String.raw`Click reapers to decide which of them strike, and choose what the infinitely many reapers beyond #10 (closer and closer to midnight) do. The checker marks every reaper whose instruction (“strike iff the man is still alive”) your assignment breaks, and below, an exhaustive search over all assignments reports how many satisfy every instruction. With infinitely many reapers the answer is always none. Tick the finite version and exactly one assignment works: the earliest reaper strikes.`,
      deps: ['phil-2.5'],
      refs: ['SEP “Supertasks”', 'Benardete 1964', 'Hawthorne 2000'],
      credit: 'José Benardete, 1964',
      tags: ['supertasks', 'infinity', 'consistency'],
      viz(v) {
        const N = 10;
        const fin = v.toggle('finite version: only these 10 reapers', false);
        const tail = v.select('reapers beyond #10', [{ value: 'none', label: 'none strike' }, { value: 'all', label: 'all strike' }], 'none');
        const S = v.stage({ x: [-12.4, 1.1], y: [-1.5, 2.45], axes: false, height: 300, full: true });
        let strike = new Set([1]);
        v.button('nobody strikes', () => { strike = new Set(); });
        v.button('only #10 strikes', () => { strike = new Set([N]); });
        S.onClick((x, y) => { const n = Math.round(-x); if (n >= 1 && n <= N && Math.abs(x + n) < 0.45 && y > 0.45 && y < 2.2) { if (strike.has(n)) strike.delete(n); else strike.add(n); } });
        const TIME = (n) => { const sec = 3600 / 2 ** n; return sec >= 60 ? `${v.fix(sec / 60, sec >= 600 ? 0 : sec % 60 ? 2 : 0)} min` : `${v.fix(sec, sec >= 10 ? 1 : 2)} s`; };
        // does the assignment (set of strikers among 1..N, tail behaviour) satisfy every instruction?
        const check = (set, tailAll, finite) => {
          const strikes = (n) => (n <= N ? set.has(n) : !finite && tailAll);
          const alive = (n) => { if (!finite && tailAll) return false; for (let m = n + 1; m <= N; m++) if (strikes(m)) return false; return true; };
          const bad = []; for (let n = 1; n <= N; n++) if (strikes(n) !== alive(n)) bad.push(n);
          return { bad, tailBad: !finite, alive, strikes };
        };
        let st = null;
        v.render(() => {
          const finite = fin.value, tailAll = tail.value === 'all';
          tail.el.hidden = finite;
          const c = check(strike, tailAll, finite);
          // exhaustive search
          let good = 0, goodSet = null;
          for (let mask = 0; mask < 1 << N; mask++) {
            const set = new Set(); for (let n = 1; n <= N; n++) if ((mask >> (n - 1)) & 1) set.add(n);
            for (const ta of finite ? [false] : [false, true]) { const r = check(set, ta, finite); if (!r.bad.length && !r.tailBad) { good++; goodSet = set; } }
          }
          // ---- timeline: midnight far left (off to −∞), 1:00 at x = 0
          S.line(-11.2, 0.25, 0.6, 0.25, { color: 'faint', width: 1 });
          const strikers = [...strike].filter((n) => n <= N);
          const death = !finite && tailAll ? -11.6 : strikers.length ? -Math.max(...strikers) : null;
          if (death == null) S.line(-11.2, 0.25, 0.6, 0.25, { color: 'green', width: 4 });
          else { S.line(-11.2, 0.25, death, 0.25, { color: 'green', width: 4 }); S.line(death, 0.25, 0.6, 0.25, { color: 'red', width: 4, alpha: 0.7 }); }
          S.text(death == null ? 'the man survives every reaper' : death < -10.8 ? 'dead before every shown reaper' : 'alive  →  dead', death == null ? -5 : Math.max(death, -10.8) + 0.1, -0.08, { size: 11, weight: 600, color: death == null ? 'green' : 'red', align: death == null ? 'center' : 'left' });
          S.text('1:00', 0.45, 0.48, { align: 'center', size: 10.5, weight: 600, color: 'muted' });
          for (let n = 1; n <= N; n++) {
            const x = -n, on = c.strikes(n), ok = !c.bad.includes(n), col = on ? 'red' : 'muted';
            S.line(x, 0.62, x, 1.6, { color: col, width: on ? 2.6 : 1.4 });
            S.curve((t) => bez([x + 0.02, 1.62], [x - 0.22, 1.82], [x - 0.5, 1.47], t), 0, 1, { color: col, width: on ? 3.4 : 2, n: 24 });
            S.text(`#${n}`, x, 1.98, { align: 'center', size: 12, weight: 700, color: on ? 'red' : 'ink' });
            S.text(TIME(n), x, 0.48, { align: 'center', size: 9.5, color: 'muted' });
            S.text(ok ? '✓' : '✗', x, -0.62, { align: 'center', size: 15, weight: 700, color: ok ? 'green' : 'red' });
            if (!ok) S.text(c.alive(n) ? 'should strike' : 'should hold back', x, -1.0, { align: 'center', size: 8.5, color: 'red' });
          }
          if (!finite) {
            S.text('…', -11.25, 1.1, { align: 'center', size: 22, weight: 700, color: tailAll ? 'red' : 'muted' });
            S.text('∞ more', -11.25, 1.98, { align: 'center', size: 11, weight: 700, color: 'ink' });
            S.text('✗', -11.25, -0.62, { align: 'center', size: 15, weight: 700, color: 'red' });
            S.text(tailAll ? 'all should hold back' : 'all should strike', -11.25, -1.0, { align: 'center', size: 8.5, color: 'red' });
          } else S.text('midnight side: no more reapers', -11.0, 1.1, { align: 'center', size: 10.5, color: 'muted' });
          S.text('← toward midnight          (minutes and seconds after midnight)          strike times →', -5.5, 2.35, { align: 'center', size: 10.5, color: 'muted' });
          st = { c, good, goodSet, finite, strikers, tailAll };
        });
        v.legend([['red', 'strikes (click a reaper)'], ['green', 'instruction kept ✓'], ['red', 'instruction broken ✗', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, good, goodSet, finite, strikers, tailAll } = st;
          const who = strikers.length ? strikers.sort((a, b) => a - b).map((n) => '#' + n).join(', ') : 'none of #1–#10';
          const broken = c.bad.length ? `reaper${c.bad.length > 1 ? 's' : ''} ${c.bad.map((n) => '#' + n).join(', ')}` : 'no shown reaper';
          const space = finite ? `$2^{${N}} = ${2 ** N}$` : `$2^{${N}}\\times2 = ${2 ** (N + 1)}$`;
          return `Strikers: ${who}${finite ? '' : `; beyond #10: ${tailAll ? 'all' : 'none'}`} · instructions broken: ${broken}${finite ? '' : ', and every reaper beyond #10'} · exhaustive search over all ${space} assignments: ` +
            (good ? `**exactly ${good}** keeps every instruction: ${[...goodSet].map((n) => '#' + n).join(', ')} strikes and the rest hold back.` : '**none** keeps every instruction. The infinitely many reapers’ instructions are jointly unsatisfiable, whatever the man’s fate.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Paradox',
      name: 'Galileo’s paradox',
      statement: String.raw`Some natural numbers are squares and most are not, so it seems there are fewer squares than numbers. Yet every number $n$ can be paired with its square $n^2$, and every square with its root:
$$1\leftrightarrow1,\quad 2\leftrightarrow4,\quad 3\leftrightarrow9,\quad\dots$$
so there are exactly as many squares as numbers. Galileo (1638) concluded that “equal”, “greater” and “less” do not apply to infinite quantities. Cantor took the opposite course. He defined two sets to have the **same size** when there is a one-to-one correspondence between them, and accepted that an infinite set has the same size as some of its proper parts. Dedekind made this the *definition* of an infinite set. Hilbert’s hotel dramatises the same fact: a full hotel with rooms $1, 2, 3, \dots$ can take a new guest ($n\mapsto n+1$), infinitely many new guests ($n \mapsto 2n$), or even infinitely many coachloads of them.`,
      idea: String.raw`Two intuitive principles conflict for infinite collections: “if the members of two collections can be paired off one to one, the collections are equally large” (Hume’s principle) and “the whole is larger than any proper part” (Euclid’s fifth common notion). For finite sets both hold, and a map like $n\mapsto n+1$ always leaves someone out (the pigeonhole principle). For $\N$ the maps $n\mapsto n^2$, $n\mapsto n+1$ and $n\mapsto 2n$ are bijections onto proper subsets (pma 2.4), and Cantor’s pairing function even fits countably many countable sets into one (pma 2.12). Density, the proportion $\lfloor\sqrt R\rfloor/R$ of squares below $R$, is a different measure of size, and by it the squares are negligible. Cantor’s choice of bijection as the measure of size is now standard. Benci and Di Nasso’s *numerosities* show that one can instead keep the part–whole principle, at the cost of other properties, so which notion deserves the word “size” is partly a choice.`,
      caption: String.raw`Pick a pairing and drag **move the guests** to carry each number (guest) to its partner (room). In Galileo’s pairing the lines fan out because the squares thin out, yet every number gets exactly one square. In the hotel modes, check that after the move every room holds exactly one guest and nobody is turned away. Tick **finite version** to see the same moves fail. The lower panel plots, against $R$, what share of the numbers $1, \dots, R$ the original guests end up occupying: it tends to 0, 1 or ½, even though in each case they are exactly as many as all the numbers.`,
      deps: ['pma-2.4', 'pma-2.12'],
      see: ['logic-1.1'],
      refs: ['SEP “Infinity”', 'Galileo, Two New Sciences (1638)'],
      credit: 'Galileo Galilei, 1638; the hotel: David Hilbert, 1924',
      tags: ['infinity', 'cardinality', 'bijection'],
      viz(v) {
        const mode = v.select('', [{ value: 'sq', label: 'Galileo: $n\\mapsto n^2$' }, { value: 'n1', label: 'hotel: one new guest' }, { value: '2n', label: 'hotel: a coach' }, { value: 'inf', label: 'hotel: infinitely many coaches' }], 'sq');
        const fin = v.toggle('finite version (rooms 1–20, numbers 1–100)', false);
        const pS = v.slider('move the guests', 0, 1, 1, { step: 0.01 });
        const H = v.stage({ x: [-1.3, 21.3], y: [-2.75, 3.05], axes: false, height: 310, full: true });
        const D = v.stage({ x: [1, 1e6], y: [-0.1, 1.12], xlog: true, axes: 'box', height: 170, full: true, title: 'share of $1, \\dots, R$ taken by the original guests (images)', yticks: [0, 0.5, 1] });
        const CCOL = ['gold', 'orange', 'pink', 'purple'];
        let st = null;
        v.render(() => {
          const k = mode.value, p = pS.value, finite = fin.value;
          const path = (a, b, bulge, col, lab, out = false) => H.clip(() => {
            const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bulge];
            H.curve((t) => bez(a, c, b, t), 0, 1, { color: out ? 'red' : col, width: 1.1, alpha: 0.45, n: 40 });
            const q = bez(a, c, b, p);
            H.dot(q[0], q[1], { r: 8.5, color: out && p > 0.98 ? 'red' : col });
            H.text(lab, q[0], q[1], { align: 'center', size: lab.length > 2 ? 7 : 8.5, weight: 700, color: 'panel', halo: false });
          });
          if (k === 'sq') {
            // top: numbers 1..10; bottom: the number line 1..100 with the squares marked
            const X = (n) => 0.5 + (20 * (n - 1)) / 99;
            H.text('every number n', -1.2, 2.55, { size: 11.5, weight: 600, color: 'blue' });
            H.text('its square n² on the line 1 … 100', -1.2, -0.75, { size: 11.5, weight: 600, color: 'gold' });
            // the same pairing for n = 1..100, squares on the line 1..10 000
            const top = finite ? 100 : 10000, XT = (n) => 0.5 + (20 * (n - 1)) / 99, XB = (m) => 0.5 + (20 * (m - 1)) / (top - 1);
            H.text('n = 1 … 100', -1.2, -1.12, { size: 11, weight: 600, color: 'blue' });
            H.text(finite ? 'n² must stay in the finite range 1 … 100' : 'n² on the line 1 … 10 000', -1.2, -2.62, { size: 11, weight: 600, color: finite ? 'red' : 'gold' });
            H.line(XB(1), -2.33, XB(top), -2.33, { color: 'faint', width: 1.2 });
            for (let n = 1; n <= 100; n++) {
              if (n * n <= top) { H.line(XT(n), -1.36, XB(n * n), -2.3, { color: 'blue', width: 0.8, alpha: 0.3 }); H.line(XB(n * n), -2.33, XB(n * n), -2.18, { color: 'gold', width: 1.2 }); }
              H.dot(XT(n), -1.36, { r: 1.8, color: n * n > top ? 'red' : 'blue', ring: false });
            }
            if (finite) H.text('red: 90 numbers with no square left in range ✗', 20.5, -1.12, { align: 'right', size: 11, weight: 600, color: 'red' });
            H.line(X(1), -0.15, X(100), -0.15, { color: 'faint', width: 1.4 });
            for (let m = 1; m <= 100; m++) { const sq = Number.isInteger(Math.sqrt(m)); H.line(X(m), -0.15, X(m), sq ? 0.15 : -0.02, { color: sq ? 'gold' : 'faint', width: sq ? 2 : 1 }); if (sq) H.text(String(m), X(m), -0.45, { align: 'center', size: 10, weight: 600, color: 'gold' }); }
            for (let n = 1; n <= 10; n++) {
              const x = 2 * n - 0.5;
              H.rect(x - 0.42, 1.75, x + 0.42, 2.25, { color: 'blue', width: 1.2, fill: 'blue', fillAlpha: 0.08 });
              H.text(String(n), x, 2.0, { align: 'center', size: 11, weight: 600, color: 'blue' });
              path([x, 2.0], [X(n * n), 0.15], 0.3, 'blue', String(n));
            }
          } else {
            H.text('before', -1.25, 2.0, { size: 11, weight: 600, color: 'muted' });
            H.text('after', -1.25, 0.0, { size: 11, weight: 600, color: 'muted' });
            for (let r = 1; r <= 20; r++) for (const y of [2.0, 0.0]) { H.rect(r - 0.42, y - 0.32, r + 0.42, y + 0.32, { color: 'faint', width: 1 }); H.text(String(r), r, y + 0.47, { align: 'center', size: 9, color: 'muted' }); }
            if (!finite) H.text('→ ∞', 20.85, 1.0, { align: 'center', size: 13, weight: 700, color: 'muted' });
            else { H.line(20.55, -0.5, 20.55, 2.5, { color: 'red', width: 2 }); H.text('last room', 20.75, 2.75, { align: 'center', size: 10, weight: 600, color: 'red' }); }
            const target = (n) => (k === 'n1' ? n + 1 : 2 * n);
            let ev = 0;
            for (let n = 1; n <= 20; n++) {
              const t = target(n), out = t > 20;
              if (!out) path([n, 2.0], [t, 0.0], -0.25, 'blue', String(n));
              else if (finite) path([n, 2.0], [20.95, 2.55 - 0.3 * ev++], 0, 'blue', String(n), true);
              else path([n, 2.0], [21.7 + (t - 21) * 0.5, 0.0], -0.1, 'blue', String(n));
            }
            if (finite && p > 0.98) H.text('no room!', 20.95, -0.62, { align: 'center', size: 11, weight: 700, color: 'red' });
            if (k === 'n1') {
              H.text('lobby', -0.3, -1.25, { align: 'center', size: 11, color: 'gold', weight: 600 }); path([-0.3, -0.9], [1, 0], 0.2, 'gold', 'new');
              H.text(finite ? 'the hotel ends at room 20: guest 20 has nowhere to go' : 'the rooms go on forever: guest 20 moves to room 21, guest 21 to room 22, … nobody is left out', 10.5, -1.9, { align: 'center', size: 12, weight: 600, color: finite ? 'red' : 'muted' });
            }
            if (k === '2n') {
              H.rect(0.45, -2.05, 10.55, -1.15, { color: 'gold', width: 1.4, fill: 'gold', fillAlpha: 0.07 }); H.text('coach: passengers 1, 2, 3, … → rooms 1, 3, 5, …', 11, -1.6, { size: 11, color: 'gold', weight: 600 });
              for (let s = 1; s <= 10; s++) path([s, -1.6], [2 * s - 1, 0], 0.2, 'gold', `p${s}`);
            }
            if (k === 'inf') {
              for (let c = 1; c <= 4; c++) {
                const x0 = 5 * (c - 1) + 0.55;
                H.rect(x0, -2.35, x0 + 4.4, -1.35, { color: CCOL[c - 1], width: 1.3, fill: CCOL[c - 1], fillAlpha: 0.07 });
                H.text(`coach ${c}`, x0 + 2.2, -2.58, { align: 'center', size: 10, weight: 600, color: CCOL[c - 1] });
                for (let s = 1; s <= 4; s++) {
                  const room = 2 * pairNum(c, s) - 1, src = [x0 + s - 0.3, -1.85];
                  if (room <= 20) path(src, [room, 0], 0.15, CCOL[c - 1], `${c},${s}`);
                  else { H.dot(src[0], src[1], { r: 8.5, color: CCOL[c - 1], alpha: 0.35 }); H.text(`→${room}`, src[0], src[1], { align: 'center', size: 7, weight: 700, color: 'ink' }); }
                }
              }
            }
          }
          // ---- density of the image among 1..R
          const dens = (R) => (k === 'sq' ? Math.floor(Math.sqrt(R)) / R : k === 'n1' ? (R - 1) / R : Math.floor(R / 2) / R);
          if (k !== 'sq') D.hline(1, { color: 'green', dash: [6, 4], width: 1.6 });
          D.fn((R) => dens(Math.floor(R)), { color: 'blue', width: 2.4, n: 600 });
          const R0 = k === 'sq' ? 100 : 20;
          D.dot(R0, dens(R0), { r: 5, color: 'gold', label: `R = ${R0}`, labelPos: 'ne' });
          D.text(k === 'sq' ? 'squares among 1…R: ⌊√R⌋/R → 0' : k === 'n1' ? 'old guests: (R−1)/R → 1' : 'old guests: even rooms, → ½', 9e5, k === 'sq' ? 0.32 : 0.78, { align: 'right', size: 11.5, weight: 600, color: 'blue' });
          if (k !== 'sq') D.text('all guests after the move: every room', 9e5, 1.06, { align: 'right', size: 11, color: 'green' });
          st = { k, p, finite };
        });
        v.legend([['blue', 'original numbers / guests', { dot: true }], ['gold', 'newcomers', { dot: true }], ['red', 'no room left', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, p, finite } = st, done = p > 0.98;
          if (k === 'sq' && finite) return `Finite version: within $1, \\dots, 100$ only the numbers 1–10 have their squares in range, so the 100 numbers cannot be matched one to one with the 10 squares ✗. For finite collections the part really is smaller than the whole.`;
          if (k === 'sq') return `$n\\mapsto n^2$ is one-to-one, and every square is hit, so the squares are **exactly as many** as the natural numbers. Yet only 10 of the first 100 numbers are squares, and the share $\\lfloor\\sqrt R\\rfloor/R$ tends to 0. One-to-one correspondence and proportion are different measures of size.`;
          const pre = done ? 'After the move' : `Move ${Math.round(p * 100)}% done (drag to the end to check)`;
          if (finite) return `${pre}: in a finite hotel guest${k === 'n1' ? ' 20 has' : 's 11–20 have'} **no room** ✗. A finite set is never in one-to-one correspondence with a proper part of itself (the pigeonhole principle); for Dedekind that is what *finite* means.`;
          if (k === 'n1') return `${pre}: room 1 holds the newcomer and room $n+1$ holds guest $n$, so every room has exactly one guest ✓ and nobody is turned away ✓. $n\\mapsto n+1$ is a bijection from $\\mathbb N$ onto $\\mathbb N\\setminus\\{1\\}$.`;
          if (k === '2n') return `${pre}: old guest $n$ is in room $2n$ (the even rooms) and passenger $k$ in room $2k-1$ (the odd rooms): every room is used exactly once ✓. Infinitely many newcomers fit into a full hotel.`;
          return `${pre}: old guests take the even rooms, and passenger $s$ of coach $c$ takes room $2\\pi(c,s)-1$, where $\\pi(c,s) = \\tfrac{(c+s-1)(c+s-2)}{2}+s$ is Cantor’s pairing of $\\mathbb N\\times\\mathbb N$ with $\\mathbb N$. Every room is used exactly once ✓: a countable union of countable sets is countable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Paradox',
      name: 'Gabriel’s horn: finite volume, infinite area',
      statement: String.raw`Rotate the curve $y = 1/x$, $x\ge1$, about the $x$-axis. The resulting horn has **finite volume** and **infinite surface area**:
$$V=\pi\int_1^\infty \frac{dx}{x^2}=\pi,\qquad A=2\pi\int_1^\infty \frac1x\sqrt{1+\frac1{x^4}}\,dx \;\ge\; 2\pi\int_1^\infty\frac{dx}{x}=\infty.$$
The **painter’s paradox**: the horn can be filled with $\pi$ units of paint, yet its inside surface could never be painted. More generally, for $y = x^{-p}$ the volume is finite exactly when $p>\tfrac12$ and the area exactly when $p>1$.`,
      idea: String.raw`The volume integrand is $\pi r^2 = \pi x^{-2p}$ and the area integrand is roughly $2\pi r = 2\pi x^{-p}$. These are power functions, so the same test that decides the $p$-series (pma 3.28) decides the integrals: $\int_1^\infty x^{-q}dx$ converges iff $q>1$. When $\tfrac12<p\le1$, the squared radius decays fast enough but the radius itself does not. The painter’s paradox dissolves once one sees that “painting” means a coat of fixed thickness $\varepsilon$, which needs volume about $\varepsilon\cdot A=\infty$, while “filling” lets the paint get thinner than any $\varepsilon$ deep in the horn, where the radius is smaller than $\varepsilon$. A mathematical surface can be covered by a layer of zero thickness, real paint cannot. Torricelli’s 1643 result shocked his contemporaries (Hobbes among them), because an infinitely long solid with finite size seemed to break the rule that the infinite cannot be measured.`,
      caption: String.raw`Set the length $L$ (log scale) and the exponent $p$. The 3D horn shows the first stretch of the solid (drag to rotate). On the right, the running volume (blue) levels off at its limit while the running area (orange) keeps climbing like $2\pi\ln L$. Lower $p$ below 1 and the area still diverges; raise $p$ above 1 and both converge; lower $p$ to $\tfrac12$ or below and the volume diverges too.`,
      deps: ['pma-3.28'],
      refs: ['SEP “Infinity”'],
      credit: 'Evangelista Torricelli, 1643',
      tags: ['infinity', 'integrals', 'convergence'],
      viz(v) {
        const LS = v.slider('length $L$', 1.05, 1e6, 1000, { log: true });
        const pS = v.slider('exponent $p$ in $y = x^{-p}$', 0.4, 1.6, 1, { step: 0.01 });
        const S3 = v.stage3d({ range: 5.3, height: 330, yaw: -0.22, pitch: 0.3, axes: false, weight: 0.95, persp: 0 });
        const G = v.stage({ x: [1, 1e6], y: [0.03, 1e5], xlog: true, ylog: true, axes: 'box', height: 330, weight: 1.15, title: 'running totals up to $x = L$ (log–log)', xlabel: 'L' });
        const LN = Math.log(1e6), DU = 0.005, NU = Math.ceil(LN / DU);
        let cache = { p: null, A: null };
        const areaTable = (p) => {
          if (cache.p === p) return cache.A;
          const A = new Float64Array(NU + 1), g = (u) => Math.exp(u * (1 - p)) * Math.sqrt(1 + p * p * Math.exp(-2 * u * (p + 1)));
          for (let i = 1; i <= NU; i++) A[i] = A[i - 1] + (2 * Math.PI * DU * (g((i - 1) * DU) + g(i * DU))) / 2;
          cache = { p, A }; return A;
        };
        const vol = (p, L) => (Math.abs(2 * p - 1) < 1e-9 ? Math.PI * Math.log(L) : (Math.PI * (L ** (1 - 2 * p) - 1)) / (1 - 2 * p));
        let st = null;
        v.render(() => {
          const L = LS.value, p = pS.value, A = areaTable(p);
          const areaAt = (x) => { const u = Math.log(x) / DU, i = Math.min(NU - 1, Math.floor(u)); return A[i] + (A[i + 1] - A[i]) * (u - i); };
          // ---- the horn (first stretch, x ≤ 12)
          const Xs = Math.min(L, 12), r = (x) => x ** -p;
          S3.surface((x, th) => [x - 6.5, r(x) * Math.cos(th), r(x) * Math.sin(th)], [1, Xs], [0, 2 * Math.PI], { nu: 44, nv: 26, color: 'accent', alpha: 0.9, colorFn: (x) => (x < 2 ? 'blue' : 'accent') });
          S3.curve((th) => [1 - 6.5, Math.cos(th), Math.sin(th)], 0, 2 * Math.PI, { color: 'ink', width: 1.6 });
          S3.line([-6.2, 0, 0], [6.2, 0, 0], { color: 'faint', width: 1, dash: [4, 4] });
          if (L > 12) S3.text(`… continues to x = ${bigNum(L)}`, [3.6, 0, -1.25], { size: 11.5, color: 'muted' });
          S3.text('y = 1/x' + (Math.abs(p - 1) < 0.005 ? '' : `^${v.fix(p, 2)}`) + ' rotated', [-4.2, 0, 1.6], { size: 11.5, color: 'muted' });
          // ---- running volume and area
          const Vinf = p > 0.5 ? Math.PI / (2 * p - 1) : Infinity;
          if (isFinite(Vinf) && Vinf < 1e5) { G.hline(Vinf, { color: 'blue', dash: [6, 4], width: 1.3 }); G.text(`volume limit π/(2p−1) = ${v.fix(Vinf, 3)}`, 40, Vinf, { dy: -9, size: 11, weight: 600, color: 'blue' }); }
          G.fn((x) => vol(p, x), { color: 'blue', width: 2.6 });
          G.fn((x) => areaAt(x), { color: 'orange', width: 2.6 });
          if (Math.abs(p - 1) < 0.005) G.fn((x) => 2 * Math.PI * Math.log(x), { color: 'orange', width: 1.2, dash: [3, 4], alpha: 0.7 });
          G.vline(L, { color: 'gold', width: 1.8 });
          G.dot(L, vol(p, L), { r: 5, color: 'blue' }); G.dot(L, areaAt(L), { r: 5, color: 'orange' });
          st = { L, p, V: vol(p, L), A: areaAt(L), Vinf, Ainf: p > 1 ? areaAt(1e6) + (2 * Math.PI * 1e6 ** (1 - p)) / (p - 1) : Infinity };
        });
        v.legend([['blue', 'volume $\\pi\\int_1^L x^{-2p}dx$'], ['orange', 'area $2\\pi\\int_1^L x^{-p}\\sqrt{1+p^2x^{-2p-2}}\\,dx$'], ['orange', '$2\\pi\\ln L$ (at $p = 1$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { L, p, V, A, Vinf, Ainf } = st, f = (x) => v.fix(x, 3);
          const cls = p > 1 ? 'both converge (p > 1)' : p > 0.5 ? '**finite volume, infinite area** (½ < p ≤ 1): Gabriel’s horn' : 'both diverge (p ≤ ½)';
          return `Up to $L = ${L >= 1e4 ? v.sci(L, 2) : v.fix(L, 1)}$: volume $${f(V)}$${isFinite(Vinf) ? ` (limit $${f(Vinf)}$)` : ' (→ ∞)'}, area $${f(A)}$${p > 1 ? ` (limit ≈ $${f(Ainf)}$)` : ' (→ ∞)'} · ${cls}` +
            (p > 0.5 && p <= 1 ? ` · painting this much surface with a coat 0.01 thick takes about $${f(0.01 * A)}$ units of paint, which grows without bound as $L\\to\\infty$, while filling the whole infinite horn takes only $${f(Vinf)}$` : '') + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Paradox',
      name: 'Zeno’s paradox of measure',
      statement: String.raw`**Zeno:** a line segment can be divided into infinitely many parts. If the ultimate parts have no size, the segment, being the sum of them, has no size either; if they all have some positive size, the segment is infinitely large. Either way the segment’s length is absurd.

**The modern answer** has three ingredients. (a) Length (Lebesgue measure) is **countably** additive: the length of a countable union of disjoint sets is the sum of their lengths. (b) A point has length $0$, so every **countable** set has length $0$. Indeed, it can be covered by intervals of lengths $\varepsilon/2, \varepsilon/4, \dots$, total at most $\varepsilon$. (c) The segment $[0,1]$ is **uncountable** (Cantor), so it is not a countable union of points, and additivity says nothing about an uncountable “sum” of zeros. Its length is $1$. The second horn also fails: a sum of uncountably many positive sizes is indeed infinite, but the points do not have positive size.`,
      idea: String.raw`The covering argument shows directly that any listed set $q_1, q_2, \dots$ has outer measure at most $\sum_k \varepsilon 2^{-k} = \varepsilon$ for every $\varepsilon>0$, which is why the rationals, dense as they are, have length 0 (rca 2.20). If $[0,1]$ could be listed the same way, its length would be 0 instead of 1, so it cannot be listed. Cantor’s diagonal argument (pma 2.14, pma 2.43a) shows this constructively: from any list of decimals it builds a number whose $k$-th digit differs from the $k$-th digit of the $k$-th entry, so the number differs from every entry. Zeno’s argument fails because it assumes that additivity extends to arbitrary collections of parts. It holds for countable collections only. Some philosophers (Grünbaum; more recently Skyrms, and Pruss on non-measurable sets) have asked whether this is a solution or just a careful restriction that leaves the intuition unexplained.`,
      caption: String.raw`Left: the first $K$ points of a list each get an interval of length $\varepsilon/2^k$ (row $k$; the bottom line shows their union). However dense the points, the total stays below $\varepsilon$, far short of the segment’s length 1. Right: write any list of decimals by clicking digits (each click adds 1). The gold diagonal digits are changed (to 5, or to 4 if the digit is 5) to build a number $d$ that differs from row $k$ in its $k$-th digit, so it is missing from your list. Switch the left panel to **your list** to cover your numbers and see $d$ on the segment.`,
      deps: ['rca-2.20', 'pma-2.43a', 'pma-2.14'],
      refs: ['SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC; Cantor, 1891; Lebesgue, 1902',
      tags: ['measure', 'countability', 'diagonal argument'],
      viz(v) {
        const src = v.select('list on the left', [{ value: 'rat', label: 'the rationals in [0, 1]' }, { value: 'mine', label: 'your list (right)' }], 'rat');
        const eS = v.slider('$\\varepsilon$', 0.002, 1, 0.3, { log: true });
        const KS = v.slider('points listed $K$', 1, 60, 24, { int: true });
        const Lst = v.stage({ x: [-0.05, 1.05], y: [-0.43, 1.06], axes: false, height: 340, weight: 1.15 });
        const Rst = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1 });
        const NR = 8;
        let digits = [[3, 1, 4, 1, 5, 9, 2, 6], [5, 0, 0, 0, 0, 0, 0, 0], [1, 4, 1, 4, 2, 1, 3, 5], [7, 1, 8, 2, 8, 1, 8, 2], [3, 3, 3, 3, 5, 3, 3, 3], [0, 5, 7, 7, 2, 1, 5, 6], [6, 1, 8, 0, 3, 3, 9, 8], [9, 9, 9, 0, 1, 2, 3, 4]];
        const T = v.table(Rst, { rows: NR, cols: NR, size: 15, maxCell: 30, region: [0, 0.28, 1, 1], rowLabels: (i) => `x${subNum(i + 1)} = 0.`, colLabels: (j) => String(j + 1) });
        Rst.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) digits[c.i][c.j] = (digits[c.i][c.j] + 1) % 10; });
        const rngB = v.rng(2024);
        v.button('new random list', () => { digits = digits.map((row) => row.map(() => rngB.int(0, 9))); });
        let st = null;
        v.render(() => {
          const eps = eS.value, mine = src.value === 'mine';
          KS.el.hidden = mine;
          const dDig = digits.map((row, k) => (row[k] === 5 ? 4 : 5));
          const val = (row) => row.reduce((s, dg, j) => s + dg * 10 ** -(j + 1), 0);
          const dVal = val(dDig);
          const pts = mine ? digits.map(val) : rationals01(KS.value).map(([a, b]) => a / b);
          const K = pts.length, rows = Math.min(K, 30), rowH = 0.92 / (rows + 1);
          // ---- covering intervals, one row per listed point
          Lst.line(0, -0.15, 1, -0.15, { color: 'ink', width: 1.4 });
          Lst.text('0', 0, -0.25, { align: 'center', size: 11, color: 'muted' }); Lst.text('1', 1, -0.25, { align: 'center', size: 11, color: 'muted' });
          const iv = pts.map((q, k) => { const len = eps * 2 ** -(k + 1); return [q - len / 2, q + len / 2]; });
          const pxPer = Lst.width / 1.1;
          iv.forEach(([a, b], k) => {
            const y = 1.0 - (k + 1) * rowH, q = pts[k];
            if (k < rows) {
              Lst.line(0, y, 1, y, { color: 'faint', width: 0.6, alpha: 0.5 });
              if ((b - a) * pxPer >= 1.5) Lst.line(Math.max(-0.04, a), y, Math.min(1.04, b), y, { color: k % 2 ? 'teal' : 'blue', width: Math.max(3, Math.min(8, rowH * 300)), cap: 'butt' });
              Lst.dot(q, y, { r: 2.2, color: 'ink' });
              if (k < 3) Lst.tex(`\\varepsilon/${2 ** (k + 1)}`, Math.min(1.04, b) + 0.012, y, { align: 'left', size: 12, color: k % 2 ? 'teal' : 'blue' });
            }
            Lst.line(Math.max(0, a), -0.15, Math.min(1, b), -0.15, { color: 'blue', width: 8, cap: 'butt', alpha: 0.85 });
          });
          if (K > rows) Lst.text(`rows ${rows + 1}–${K} too thin to draw; their intervals are in the union below`, 0.5, 1.0 - (rows + 0.6) * rowH, { align: 'center', size: 10, color: 'muted' });
          if (mine) { Lst.line(dVal, -0.22, dVal, 1.0, { color: 'green', width: 1.6, dash: [4, 4] }); Lst.dot(dVal, -0.15, { r: 6, color: 'green', label: 'd', labelPos: 'se' }); }
          Lst.text('their union on [0, 1] (true widths)', 0.5, -0.07, { align: 'center', size: 10.5, color: 'blue' });
          const U = unionLength(iv), Ssum = eps * (1 - 2 ** -K);
          Lst.text(`total length ≤ ${v.fix(Ssum, 4)} (union ${v.fix(U, 4)})  vs  length of [0, 1] = 1`, 0.5, -0.36, { align: 'center', size: 12, weight: 700, color: 'ink' });
          // ---- Cantor's diagonal
          T.draw({
            value: (i, j) => digits[i][j],
            fill: (i, j) => (i === j ? ['gold', 0.35] : null),
            textColor: (i, j) => (i === j ? 'ink' : 'muted'),
            weight: (i, j) => (i === j ? 700 : 500),
          });
          const g = T.geo, yD = 0.16;
          Rst.text('d = 0.', Rst.invX(g.X0) - 0.012, yD, { align: 'right', size: 15, weight: 700, color: 'green' });
          dDig.forEach((dg, j) => {
            const [cx] = T.cellCenter(0, j);
            Rst.rect(cx - g.w * 0.45, yD - 0.045, cx + g.w * 0.45, yD + 0.045, { fill: 'green', fillAlpha: 0.15, color: 'green', width: 1.2 });
            Rst.text(String(dg), cx, yD, { align: 'center', size: 15, weight: 700, color: 'green' });
            Rst.text(`≠ ${digits[j][j]}`, cx, yD - 0.085, { align: 'center', size: 10.5, color: 'muted' });
          });
          Rst.text('digit k of d differs from digit k of row k', 0.5, 0.265, { align: 'center', size: 11, color: 'muted' });
          const onList = digits.some((row) => row.every((dg, j) => dg === dDig[j]));
          st = { eps, K, U, Ssum, dDig, dVal, onList, mine };
        });
        v.legend([['blue', 'covering intervals, lengths $\\varepsilon/2^k$'], ['gold', 'diagonal digits', { area: true }], ['green', 'the diagonal number $d$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { eps, K, U, Ssum, dDig, onList, mine } = st;
          return `${K} listed ${mine ? 'numbers' : 'rationals'} covered by intervals of total length $\\varepsilon(1-2^{-${K}}) = ${v.fix(Ssum, 4)} \\le \\varepsilon = ${v.fix(eps, 3)}$ (their union: ${v.fix(U, 4)}) — as $\\varepsilon \\to 0$ a countable set has length 0, so no list can exhaust $[0,1]$, whose length is 1 · diagonal number $d = 0.${dDig.join('')}\\ldots$ differs from every row ${onList ? '✗' : '✓'} — it is not on the list, whatever list you write.`;
        });
      },
    },
  ],
};
