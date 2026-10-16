// Algorithms — Chapter 10: Greedy algorithms, spanning trees and matroids (items 10.1–10.8; 10.9–10.16 in ch10-b.js; 10.17–10.22 in ch10-c.js)
import { K, ids, plural, clamp, fmt, rngOf, sumOf, ivRandom, ivOk, ivGreedy, ivBrute, ivDepth, R, TX, LN, strip } from './ch10.shared.js';

const LETTER = (i) => String.fromCharCode(65 + i);
const ordinal = (k) => `${k}`;

// ---------------------------------------------------------------- interval pictures (10.1–10.5)
/** Time-line stage with one row per interval (row i from the top), labelled A, B, C…; returns the stage. */
function ivStage(v, n, T, o = {}) {
  return v.stage({ x: [0, T], y: [0, n], axes: 'box', gutter: true, height: o.height ?? Math.max(230, 30 * n + 50), xlabel: o.xlabel ?? 'time', title: o.title, weight: o.weight ?? 1.6,
    yticks: Array.from({ length: n }, (_, i) => [n - i - 0.5, LETTER(i)]), xticks: Array.from({ length: Math.floor(T / 2) + 1 }, (_, k) => 2 * k) });
}
/** Draw the intervals as bars in their rows; st(a) → {color, fill, width, dash, label}. */
function ivBars(s, iv, n, st) {
  for (const a of iv) {
    const y = n - a.id - 0.5, c = st(a) || {};
    s.rect(a.s, y - 0.3, a.f, y + 0.3, { fill: c.fill ?? c.color ?? 'muted', fillAlpha: c.alpha ?? (c.fill ? 0.55 : 0.12), color: c.color ?? 'muted', width: c.width ?? 1.4, dash: c.dash, radius: 4 });
    if (c.label) s.text(c.label, (a.s + a.f) / 2, y, { align: 'center', baseline: 'middle', size: 11.5, weight: 700, color: c.labelColor ?? 'ink' });
  }
}
/** n draggable intervals (a handle on each end, snapped to whole numbers). Returns {get(): iv, H}. */
function ivEditor(s, init, T, onChange) {
  const n = init.length, H = [];
  init.forEach((a, i) => {
    const y = n - i - 0.5;
    const hs = s.handle(a.s, y, { color: 'accent', r: 6.5, constrain: (x) => [clamp(Math.round(x), 0, T - 1), y] });
    const hf = s.handle(a.f, y, { color: 'accent', r: 6.5, constrain: (x) => [clamp(Math.round(x), 1, T), y] });
    hs.onDrag = onChange; hf.onDrag = onChange; H.push([hs, hf]);
  });
  const get = () => H.map(([hs, hf], i) => { const a = Math.round(Math.min(hs.x, hf.x)); let b = Math.round(Math.max(hs.x, hf.x)); if (b <= a) b = a + 1; return { id: i, s: a, f: Math.min(T + 1, b) }; });
  return { get, H };
}
const RULES = [{ value: 'finish', label: 'earliest finish' }, { value: 'start', label: 'earliest start' }, { value: 'short', label: 'shortest' }, { value: 'conflicts', label: 'fewest conflicts' }];
const RULE_NAME = { finish: 'earliest finish time', start: 'earliest start time', short: 'shortest interval', conflicts: 'fewest conflicts' };

// ---------------------------------------------------------------- coin change helpers (10.1)
const COIN_SYS = { us: [1, 5, 10, 25], odd: [1, 3, 4], mix: [1, 5, 10, 20, 25], pow: [1, 2, 4, 8, 16] };
function coinGreedy(coins, amt) { const out = []; let r = amt; for (const c of coins.slice().sort((a, b) => b - a)) while (r >= c) { out.push(c); r -= c; } return out; }
function coinOpt(coins, amt) {
  const best = [0], pick = [0];
  for (let a = 1; a <= amt; a++) { best[a] = Infinity; for (const c of coins) if (c <= a && best[a - c] + 1 < best[a]) { best[a] = best[a - c] + 1; pick[a] = c; } }
  const out = []; let a = amt; while (a > 0) { out.push(pick[a]); a -= pick[a]; }
  return out.sort((x, y) => y - x);
}

export default {
  collection: 'algo',
  chapter: 10,
  title: 'Greedy algorithms, spanning trees and matroids',
  summary: String.raw`A greedy algorithm commits to the locally best choice and never looks back. Proving that this is safe usually means showing that greed stays ahead of any rival, or that an optimal solution can be exchanged, step by step, into the greedy one. Scheduling, caching and Huffman coding are the classic successes. Minimum spanning trees follow from a single cut property, which yields Kruskal's, Prim's and Borůvka's algorithms, and matroids describe exactly the settings in which greed is always optimal.`,
  items: [
    // ------------------------------------------------------------------ 10.1
    {
      num: '10.1',
      kind: 'Method',
      name: 'The greedy method',
      statement: String.raw`A **greedy algorithm** builds a solution one irrevocable choice at a time. At each step it looks at the choices that keep the partial solution extendable and takes the one that looks best by a fixed local rule (largest coin, earliest finish, lightest edge), without ever reconsidering. It is fast, usually a sort followed by one scan. Whether it is also **correct** is a separate question that depends on both the problem and the rule: the same rule can be optimal for one instance family and wrong for another, and a plausible rule for a problem can fail on small instances. A greedy rule is justified only by a proof, typically that greed *stays ahead* (10.2) or that an optimal solution can be *exchanged* into the greedy one (10.3).`,
      idea: String.raw`Greedy choice only makes sense when a problem has optimal substructure (7.3): after the first choice, what is left is a smaller problem of the same kind. Dynamic programming tries every first choice and solves each remainder; greedy is the special case in which a proof shows that one particular first choice is always safe, so the other branches need never be explored. When no such proof exists, a counterexample usually does: it is enough to find one instance on which the rule loses, and small instances are where they live. Always test a proposed rule against brute force first.`,
      caption: String.raw`**Coins:** choose a coin system and drag the amount. The greedy row takes the largest coin that fits; the lower row is the dynamic-programming optimum (7.3). The bars on the right show, for every amount up to 60, how many extra coins greed uses: the US system never loses, while $\{1,3,4\}$ loses at 6 ($4+1+1$ against $3+3$). **Intervals:** the bars show, for 30 random instances, how many compatible intervals the chosen rule leaves on the table; only the earliest-finish rule is never red. Both pictures are tests, not proofs: no red bar does not prove a rule safe.`,
      deps: ['algo-7.3'],
      refs: ['CLRS 4e §15.2'],
      tags: ['greedy'],
      viz(v) {
        const mode = v.select('problem', [{ value: 'coins', label: 'making change' }, { value: 'iv', label: 'choosing intervals' }], 'coins', { onChange: () => sync() });
        const sys = v.select('coin system', [{ value: 'us', label: '1, 5, 10, 25' }, { value: 'odd', label: '1, 3, 4' }, { value: 'mix', label: '1, 5, 10, 20, 25' }, { value: 'pow', label: '1, 2, 4, 8, 16' }], 'odd');
        const amt = v.slider('amount', 1, 60, 6, { int: true });
        const rule = v.select('greedy rule', RULES, 'finish');
        const seed = v.slider('instance', 1, 30, 4, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 320, title: undefined });
        const ch = v.stage({ x: [0, 31], y: [0, 4], axes: 'box', gutter: true, height: 320, xlabel: 'amount', ylabel: 'extra coins used by greed', weight: 0.9 });
        const sync = () => { const c = mode.value === 'coins'; sys.el.hidden = !c; amt.el.hidden = !c; rule.el.hidden = c; seed.el.hidden = c; };
        sync();
        let info = null;
        const IVN = 9, IVT = 20;
        const ivOpt = (rl, sd) => { const iv = ivRandom(sd, IVN, IVT, 7), g = ivGreedy(iv, rl), b = ivBrute(iv); return { iv, g, b, gap: b.best - g.picked.length }; };
        v.render(() => {
          if (mode.value === 'coins') {
            const coins = COIN_SYS[sys.value], a = amt.value, G = coinGreedy(coins, a), O = coinOpt(coins, a);
            s.setView([0, 10], [0, 6]);
            const row = (list, y0, col, name) => {
              s.text(name, 0.1, y0 + 0.85, { size: 12.5, weight: 700, color: col });
              list.forEach((c, k) => { const x = 0.55 + (k % 16) * 0.6, y = y0 - 0.15 - Math.floor(k / 16) * 0.75; s.dot(x, y, { r: 12, color: col, fill: col }); TX(s, c, s.X(x), s.Y(y) + 0.5, { align: 'center', size: c > 9 ? 10.5 : 12, weight: 700, color: 'panel', halo: false }); });
            };
            row(G, 4.3, G.length > O.length ? 'red' : 'green', `greedy: ${G.length} coin${G.length === 1 ? '' : 's'}`);
            row(O, 1.7, 'blue', `optimal: ${O.length} coin${O.length === 1 ? '' : 's'}`);
            const gaps = []; for (let x = 1; x <= 60; x++) gaps.push(coinGreedy(coins, x).length - coinOpt(coins, x).length);
            const top = Math.max(2, ...gaps) + 0.5;
            ch.setView([0, 61], [0, top]); ch.setLabels('amount', 'extra coins used by greed');
            ch.bars(gaps, { x0: 1, color: (g, i) => (i + 1 === a ? 'gold' : g > 0 ? 'red' : 'green') });
            ch.vline(a, { color: 'gold', width: 1.6, dash: [4, 3] });
            info = { coins, a, G, O, bad: gaps.map((g, i) => (g > 0 ? i + 1 : 0)).filter(Boolean) };
          } else {
            const { iv, g, b, gap } = ivOpt(rule.value, seed.value), pick = new Set(g.picked), opt = new Set(b.sets[0]);
            s.setView([0, IVT], [0, IVN]);
            const T0 = 28, W0 = s.width - 40, X = (t) => 28 + (t / IVT) * W0, rowH = (s.height - 34) / IVN;
            TX(s, `rule: ${RULE_NAME[rule.value]}`, 28, 12, { size: 12.5, weight: 700, color: 'muted', align: 'left' });
            for (let t = 0; t <= IVT; t += 5) { LN(s, X(t), 26, X(t), s.height - 20, { color: 'grid', width: 1 }); TX(s, t, X(t), s.height - 9, { size: 10, color: 'faint', align: 'center' }); }
            void T0;
            iv.forEach((a, i) => {
              const y = 30 + i * rowH, inG = pick.has(a.id), inO = opt.has(a.id);
              R(s, X(a.s), y + 3, X(a.f), y + rowH - 4, { fill: inG ? 'green' : 'muted', fillAlpha: inG ? 0.6 : 0.13, color: inG ? 'green' : 'muted', width: 1.4, radius: 4 });
              if (inO) R(s, X(a.s) - 2, y + 1, X(a.f) + 2, y + rowH - 2, { color: 'gold', width: 2, stroke: true, radius: 5 });
              TX(s, LETTER(a.id), (X(a.s) + X(a.f)) / 2, y + rowH / 2 + 0.5, { size: 11.5, weight: 700, color: 'ink', align: 'center', halo: false });
            });
            const gaps = []; for (let sd = 1; sd <= 30; sd++) gaps.push(ivOpt(rule.value, sd).gap);
            ch.setView([0, 31], [0, Math.max(2, ...gaps) + 0.5]); ch.setLabels('random instance', 'intervals missed by greed');
            ch.bars(gaps, { x0: 1, color: (g, i) => (i + 1 === seed.value ? 'gold' : g > 0 ? 'red' : 'green') });
            ch.vline(seed.value, { color: 'gold', width: 1.6, dash: [4, 3] });
            info = { g, b, gap, bad: gaps.filter((x) => x > 0).length };
          }
        });
        v.legend([['green', 'greedy keeps / no loss'], ['red', 'greed loses'], ['gold', 'current instance (bar), optimum (outline)']]);
        v.readout(() => {
          if (!info) return '';
          if (mode.value === 'coins') {
            const { coins, a, G, O, bad } = info;
            return `amount ${a} with coins ${coins.join(', ')}: greedy takes ${G.join(' + ')} = ${G.length} coin${G.length === 1 ? '' : 's'}; the optimum is ${O.join(' + ')} = ${O.length} · ${bad.length ? `greed is **not optimal** at ${plural(bad.length, 'amount')} up to 60 (first: ${bad[0]})` : 'greed matches the optimum at every amount up to 60 ✓ (a test, not a proof)'}`;
          }
          const { g, b, gap, bad } = info;
          return `rule “${RULE_NAME[rule.value]}” keeps ${g.picked.length} intervals (green); the exhaustive optimum is ${b.best} (gold outlines show one optimal set; ${plural(b.sets.length, 'optimal set')}) · ${gap ? `**loses by ${gap}** on this instance` : 'optimal on this instance'} · over the 30 instances shown it loses on ${bad}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.2
    {
      num: '10.2',
      kind: 'Method',
      name: 'Greedy stays ahead',
      statement: String.raw`**Greedy stays ahead** is a way to prove that a greedy algorithm is optimal. Choose a measure of progress that can be compared between the greedy solution $g_1,g_2,\dots,g_k$ and any other solution $o_1,o_2,\dots,o_\ell$ after each step $i$ (for intervals, the finishing time $f(g_i)$ against $f(o_i)$). Show by induction that after every step greedy is at least as far along as the rival: $\mu(g_i)\succeq\mu(o_i)$ for all $i\le\min(k,\ell)$. Then conclude from the final comparison that greedy cannot have fewer steps, or a worse value, than the rival.`,
      idea: String.raw`The base case compares the first choices, which is exactly what the greedy rule optimises. The inductive step says: whatever the rival did at step $i+1$ was also available to greedy once greedy stood at least as far ahead after step $i$, and greedy takes the best available option, so it remains ahead. The proof has two parts that are easy to run together: a *progress invariant* (greedy is ahead after each step) and a *finishing argument* (if the rival had one more step, greedy could have taken that step too, contradiction). The rival is arbitrary, not necessarily optimal; that is what makes the argument a proof about all solutions at once.`,
      caption: String.raw`Two tracks hold the greedy solution (green, top) and a rival (orange, bottom), each in the order picked. The bars on the right compare their $i$-th finishing times. **Move the instance and rival sliders**: with the *earliest finish* rule every green bar is at most the orange one, even against optimal rivals and random ones. Switch the rule to *shortest interval* and greed falls behind (red bars), which is why that rule is not optimal.`,
      deps: ['algo-10.1'],
      refs: ['KT §4.1'],
      tags: ['greedy', 'proof technique'],
      viz(v) {
        const seed = v.slider('instance', 1, 40, 7, { int: true });
        const rk = v.select('greedy rule', [{ value: 'finish', label: 'earliest finish' }, { value: 'short', label: 'shortest' }], 'finish');
        const kind = v.select('rival', [{ value: 'opt', label: 'an optimal solution' }, { value: 'rand', label: 'a random feasible solution' }], 'rand');
        const rv = v.slider('rival #', 1, 30, 3, { int: true });
        const N = 9, T = 20;
        const s = v.stage({ x: [0, T], y: [0, 4.4], axes: 'box', gutter: true, height: 300, xlabel: 'time', yticks: [[3.2, 'greedy'], [1.0, 'rival']], xticks: Array.from({ length: 11 }, (_, k) => 2 * k) });
        const ch = v.stage({ x: [0, 8], y: [0, T], axes: 'box', gutter: true, height: 300, xlabel: 'step $i$', ylabel: 'finishing time of the $i$-th pick', weight: 0.8 });
        let info = null;
        v.render(() => {
          const iv = ivRandom(seed.value, N, T, 6), byId = (id) => iv.find((a) => a.id === id);
          const g = ivGreedy(iv, rk.value).picked.map(byId).sort((a, b) => a.f - b.f);
          let riv;
          if (kind.value === 'opt') { const b = ivBrute(iv); riv = b.sets[(rv.value - 1) % b.sets.length].map(byId); }
          else { const r = rngOf(seed.value * 97 + rv.value), ord = iv.slice().sort(() => r() - 0.5); riv = []; for (const a of ord) if (riv.every((q) => ivOk(q, a))) riv.push(a); riv.sort((a, b) => a.f - b.f); }
          const draw = (L, y, col) => L.forEach((a, k) => { s.rect(a.s, y - 0.32, a.f, y + 0.32, { fill: col, fillAlpha: 0.45, color: col, width: 1.5, radius: 4 }); s.text(String(k + 1), (a.s + a.f) / 2, y, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'ink' }); s.line(a.f, y - 0.36, a.f, y - 0.8, { color: col, width: 1, alpha: 0.7, dash: [2, 3] }); });
          draw(g, 3.2, 'green'); draw(riv, 1.0, 'orange');
          const m = Math.max(g.length, riv.length);
          ch.setView([0, m + 1], [0, T + 1]); ch.setTicks(Array.from({ length: m }, (_, i) => i + 1), null);
          let behind = 0;
          for (let i = 0; i < m; i++) {
            const gf = g[i]?.f, rf = riv[i]?.f; const bad = gf == null || (rf != null && gf > rf);
            if (bad) behind++;
            if (gf != null) ch.rect(i + 0.55, 0, i + 1, gf, { fill: bad ? 'red' : 'green', fillAlpha: 0.55, color: bad ? 'red' : 'green', width: 1.2 });
            else ch.text('none', i + 0.75, 1.5, { align: 'center', size: 10.5, color: 'red', weight: 700 });
            if (rf != null) ch.rect(i + 1, 0, i + 1.45, rf, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.2 });
          }
          info = { g, riv, behind };
        });
        v.legend([['green', 'greedy $i$-th finish'], ['orange', 'rival $i$-th finish'], ['red', 'greedy behind or out of picks']]);
        v.readout(() => {
          if (!info) return '';
          const { g, riv, behind } = info;
          return `greedy (${RULE_NAME[rk.value]}) keeps ${g.length}, the rival keeps ${riv.length} · ${behind === 0 ? `**greedy stays ahead at every step**: $f(g_i)\\le f(o_i)$ for all $i\\le${Math.min(g.length, riv.length)}$ ✓${g.length >= riv.length ? ` and it keeps ${g.length >= riv.length ? 'at least as many' : ''} intervals` : ''}` : `greedy is behind (or has stopped) at ${plural(behind, 'step')}: the invariant fails`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.3
    {
      num: '10.3',
      kind: 'Method',
      name: 'Exchange arguments',
      statement: String.raw`An **exchange argument** proves that a greedy solution $G$ is optimal by starting from an arbitrary optimal solution $O$ and transforming it into $G$ through a sequence of local swaps, each of which keeps the solution feasible and does not make its value worse. Concretely: find the first place where $O$ and $G$ disagree, replace $O$'s choice there by greedy's, show the result is still feasible and still optimal, and repeat. The number of agreements with $G$ grows with each swap, so after finitely many swaps $O$ has become $G$, and $G$ is optimal because the value never dropped.`,
      idea: String.raw`The work is in one lemma: *the swap is safe*. For interval scheduling it reads: if $O$ and $G$ agree on their first $i-1$ intervals, then replacing the $i$-th interval of $O$ by greedy's does not create a conflict, because greedy's interval ends no later (the greedy choice) and everything else in $O$ starts after the old one ended. Compared with greedy-stays-ahead (10.2), an exchange argument works from the *structure* of a solution rather than from a progress measure, which is why it applies to problems with no natural step-by-step measure, such as scheduling jobs in an order (10.6) or building a code tree (10.11).`,
      caption: String.raw`The top track is an optimal schedule $O$ found by brute force, the bottom track is the greedy schedule $G$. **Step through**: at each step the first disagreement is replaced (the removed interval is the red ghost, the greedy one green). The number of intervals never changes and nothing overlaps, until the two tracks agree. Use the sliders to pick another instance or another optimal schedule.`,
      deps: ['algo-10.1'],
      refs: ['KT §4.2'],
      tags: ['greedy', 'proof technique'],
      viz(v) {
        const seed = v.slider('instance', 1, 60, 5, { int: true, onChange: () => S.reset({ at: 'start' }) });
        const ov = v.slider('optimal schedule #', 1, 12, 1, { int: true, onChange: () => S.reset({ at: 'start' }) });
        const N = 9, T = 20;
        const s = v.stage({ x: [0, T], y: [0, 4.4], axes: 'box', gutter: true, height: 300, xlabel: 'time', yticks: [[3.2, 'O'], [1.0, 'G']], xticks: Array.from({ length: 11 }, (_, k) => 2 * k) });
        const build = () => {
          const iv = ivRandom(seed.value, N, T, 6), byId = (id) => iv.find((a) => a.id === id);
          const g = ivGreedy(iv, 'finish').picked.map(byId).sort((a, b) => a.f - b.f);
          const b = ivBrute(iv), diff = (L) => L.filter((id, i) => g[i]?.id !== id).length;
          const sets = b.sets.slice().sort((p, q) => diff(q) - diff(p));
          let cur = sets[(ov.value - 1) % sets.length].map(byId).sort((a, b2) => a.f - b2.f);
          const F = [{ cur: cur.slice(), agree: 0, line: 0, note: `An optimal schedule $O$ with ${cur.length} intervals (one of ${plural(sets.length, 'optimal schedule')}) and the greedy schedule $G$ with ${g.length}.` }];
          let guard = 0;
          while (guard++ < 30) {
            let i = 0; while (i < cur.length && i < g.length && cur[i].id === g[i].id) i++;
            if (i >= cur.length) break;
            const out = cur[i], inn = g[i], next = cur.slice(); next[i] = inn;
            const ok = next.every((p, a) => next.every((q, c) => a >= c || ivOk(p, q)));
            F.push({ cur: next, out, inn, agree: i + 1, ok, note: `The first disagreement is at position ${i + 1}: $O$ has ${LETTER(out.id)} (ends at ${out.f}), greedy has ${LETTER(inn.id)} (ends at ${inn.f} ≤ ${out.f}). Swap ${LETTER(out.id)} for ${LETTER(inn.id)}: ${ok ? `still ${next.length} pairwise compatible intervals, because everything after position ${i + 1} starts at or after ${out.f} ≥ ${inn.f}.` : 'the result has a conflict!'}` });
            cur = next;
          }
          F.push({ cur: cur.slice(), agree: cur.length, end: true, note: `$O$ has become $G$ after ${F.length - 1} swap${F.length === 2 ? '' : 's'} without ever losing an interval, so $|G| = |O|$ and greedy is optimal on this instance.` });
          return { F, g };
        };
        let bd = build();
        const S = v.steps({ frames: () => { bd = build(); return bd.F; }, speed: 0.8, start: 0, still: 1 });
        v.render(() => {
          const f = S.frame, g = bd.g, prevIds = new Set((S.prev?.cur || []).map((a) => a.id));
          void prevIds;
          g.forEach((a, k) => { s.rect(a.s, 1.0 - 0.32, a.f, 1.0 + 0.32, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.4, radius: 4 }); s.text(`${LETTER(a.id)}`, (a.s + a.f) / 2, 1.0, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'ink' }); });
          (f.cur || []).forEach((a, k) => {
            const same = g[k] && g[k].id === a.id, fresh = f.inn && f.inn.id === a.id;
            s.rect(a.s, 3.2 - 0.32, a.f, 3.2 + 0.32, { fill: fresh ? 'green' : same ? 'green' : 'blue', fillAlpha: fresh ? 0.7 : same ? 0.35 : 0.4, color: fresh || same ? 'green' : 'blue', width: fresh ? 2.6 : 1.4, radius: 4 });
            s.text(LETTER(a.id), (a.s + a.f) / 2, 3.2, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'ink' });
          });
          if (f.out) { s.rect(f.out.s, 3.2 - 0.32, f.out.f, 3.2 + 0.32, { color: 'red', width: 1.8, dash: [5, 3], radius: 4 }); s.text(`${LETTER(f.out.id)} out`, (f.out.s + f.out.f) / 2, 3.2 + 0.68, { align: 'center', size: 11, weight: 700, color: 'red' }); }
        });
        v.legend([['blue', 'still $O$\'s own interval'], ['green', 'agrees with greedy / swapped in'], ['red', 'swapped out', { dash: true }]]);
        v.readout(() => {
          const f = S.frame, ok = (f.cur || []).every((p, a) => f.cur.every((q, c) => a >= c || ivOk(p, q)));
          return `step ${S.i} of ${S.n - 1}: ${f.cur.length} intervals, ${ok ? 'all pairwise compatible ✓' : 'CONFLICT ✗'} · the first ${Math.min(f.agree, f.cur.length)} agree with greedy · greedy has ${bd.g.length}${S.atEnd ? ` · $O=G$: ${f.cur.length === bd.g.length && f.cur.every((a, k) => a.id === bd.g[k].id) ? '✓' : '✗'}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.4
    {
      num: '10.4',
      kind: 'Algorithm',
      name: 'Interval scheduling by earliest finish time',
      statement: String.raw`**Problem.** Given $n$ requests, request $i$ occupying the half-open interval $[s_i,f_i)$, choose a largest subset of pairwise disjoint requests. **Algorithm.** Sort the requests by finishing time. Scan them in that order, keeping a request exactly when its start is at least the finish of the last kept one. It runs in $O(n\log n)$ time (the sort) and returns a maximum-size compatible set. In fact, if $g_1,\dots,g_k$ are its picks and $o_1,\dots,o_\ell$ any compatible set sorted by finish, then $k\ge\ell$ and $f(g_i)\le f(o_i)$ for all $i\le\ell$.`,
      idea: String.raw`Use *greedy stays ahead* (10.2) with the finishing time as the measure of progress. Greedy's first pick finishes earliest of all intervals, so $f(g_1)\le f(o_1)$. If $f(g_{i-1})\le f(o_{i-1})$, then $o_i$ starts after $f(o_{i-1})\ge f(g_{i-1})$, so $o_i$ was available to greedy when it chose $g_i$, and greedy chose the earliest-finishing available one: $f(g_i)\le f(o_i)$. If the rival had $\ell>k$ intervals, $o_{k+1}$ would also have been available after $g_k$, so greedy would not have stopped. The sort uses the sorting results of chapter 3 (3.1).`,
      caption: String.raw`**Drag the ends of any bar** (they snap to whole numbers). The player scans the requests in order of finish: green when kept, red when rejected for overlapping the last kept one. The bars below compare the $k$-th finish of the greedy set with that of a brute-force optimum, and the readout re-checks the inequality against *every* optimal set. Try making two intervals identical, or one very long: the count never drops below the exhaustive optimum.`,
      deps: ['algo-10.2', 'algo-3.1'],
      refs: ['KT §4.1', 'CLRS 4e §15.1'],
      tags: ['greedy', 'scheduling'],
      viz(v) {
        const N = 8, T = 20;
        const s = ivStage(v, N, T, { height: 340, title: 'drag the ends of the bars', weight: 1.8 });
        const ch = v.stage({ x: [0, 6], y: [0, T], axes: 'box', gutter: true, height: 340, xlabel: 'pick number $k$', ylabel: 'finishing time', weight: 0.8 });
        const init = [[1, 6], [2, 4], [3, 9], [5, 8], [7, 12], [8, 10], [11, 15], [13, 18]].map(([a, b], id) => ({ id, s: a, f: b }));
        const E = ivEditor(s, init, T, () => S.reset({ at: 'keep' }));
        const frames = () => {
          const iv = E.get(), order = iv.slice().sort((a, b) => a.f - b.f || a.s - b.s || a.id - b.id), F = []; let last = null; const kept = [], rej = [];
          F.push({ kept: [], rej: [], cur: null, line: 1, note: `Sort the ${iv.length} requests by finishing time: ${order.map((a) => LETTER(a.id)).join(', ')}.` });
          for (const a of order) {
            const ok = !last || a.s >= last.f;
            if (ok) { kept.push(a.id); last = a; } else rej.push(a.id);
            F.push({ kept: kept.slice(), rej: rej.slice(), cur: a.id, ok, line: ok ? [3, 4] : 3, note: ok ? `${LETTER(a.id)} = [${a.s}, ${a.f}) starts at ${a.s}, not before the last kept finish${kept.length > 1 ? ` (${iv.find((q) => q.id === kept[kept.length - 2]).f})` : ''}: **keep** it.` : `${LETTER(a.id)} = [${a.s}, ${a.f}) starts before the last kept interval ends (${last.f}): **reject**.` });
          }
          return F;
        };
        const S = v.steps({ frames, code: ['sort the requests by finishing time', 'A ← ∅;  last ← −∞', 'for each request i in that order:', '  if s[i] ≥ last:  add i to A;  last ← f[i]', 'return A'], codeTitle: 'IntervalSchedule', speed: 1.4, start: 'end', still: 'end' });
        let info = null;
        v.render(() => {
          const iv = E.get(), f = S.frame, kept = new Set(f.kept), rej = new Set(f.rej);
          ivBars(s, iv, N, (a) => (a.id === f.cur ? { color: f.ok ? 'green' : 'red', fill: f.ok ? 'green' : 'red', alpha: 0.7, width: 2.4, label: LETTER(a.id), labelColor: 'panel' } : kept.has(a.id) ? { color: 'green', fill: 'green', alpha: 0.5, label: LETTER(a.id) } : rej.has(a.id) ? { color: 'red', fill: 'red', alpha: 0.15, dash: [4, 3], label: LETTER(a.id) } : { color: 'muted', label: LETTER(a.id) }));
          const g = ivGreedy(iv, 'finish').picked.map((id) => iv.find((a) => a.id === id)).sort((a, b) => a.f - b.f), B = ivBrute(iv);
          const allAhead = B.sets.every((st) => st.map((id) => iv.find((a) => a.id === id)).sort((a, b) => a.f - b.f).every((o, i) => g[i] && g[i].f <= o.f));
          const o1 = B.sets[0].map((id) => iv.find((a) => a.id === id)).sort((a, b) => a.f - b.f), m = Math.max(g.length, o1.length);
          ch.setView([0.3, m + 0.9], [0, T + 1]); ch.setTicks(Array.from({ length: m }, (_, i) => i + 1), null);
          for (let i = 0; i < m; i++) { if (g[i]) ch.rect(i + 0.6, 0, i + 1, g[i].f, { fill: 'green', fillAlpha: 0.55, color: 'green', width: 1.2 }); if (o1[i]) ch.rect(i + 1, 0, i + 1.4, o1[i].f, { fill: 'gold', fillAlpha: 0.5, color: 'gold', width: 1.2 }); }
          info = { g, B, allAhead };
        });
        v.legend([['green', 'greedy (kept)'], ['red', 'rejected', { dash: true }], ['gold', 'a brute-force optimum, $k$-th finish']]);
        v.readout(() => {
          if (!info) return '';
          const { g, B, allAhead } = info;
          return `greedy keeps ${g.length}; exhaustive search over all compatible subsets finds the maximum ${B.best} (${plural(B.sets.length, 'optimal set')}) · ${g.length === B.best ? 'sizes agree ✓' : 'sizes differ ✗'} · $f(g_k)\\le f(o_k)$ against every optimal set: ${allAhead ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.5
    {
      num: '10.5',
      kind: 'Algorithm',
      name: 'Interval partitioning meets the depth bound',
      statement: String.raw`**Problem.** Partition $n$ intervals $[s_i,f_i)$ (lectures) into the fewest classes (rooms) so that the intervals in one class are pairwise disjoint. The **depth** $d$ is the largest number of intervals that contain a common point. **Algorithm.** Sort by start time and assign each interval to any room that is free at its start, opening a new room if there is none. **Claim.** The algorithm uses exactly $d$ rooms, and no schedule can use fewer, so it is optimal. It runs in $O(n\log n)$ time with a priority queue of room finishing times.`,
      idea: String.raw`No schedule can beat $d$: the $d$ intervals through one point pairwise overlap, so they need $d$ different rooms. Conversely suppose the algorithm opens room number $d+1$ for an interval $I$ starting at time $s$. All $d$ existing rooms must hold an interval running at time $s$ (otherwise one would be free), and each of those started no later than $s$ because the intervals come in start order. So together with $I$ there are $d+1$ intervals containing the point $s$, contradicting the definition of $d$. The picture is the interplay of a **lower bound** (depth) and an **upper bound** (the algorithm), which meet, a pattern that shows up again in max-flow min-cut.`,
      caption: String.raw`**Drag the bar ends.** The player assigns intervals in start order; a room is a row, and colours name the room. The step chart underneath is the number of intervals alive at each time, its maximum is the depth, and the slider drops a sweep line (gold) that circles the intervals through that moment. The rooms used and the depth always coincide.`,
      deps: ['algo-10.4'],
      refs: ['KT §4.1'],
      tags: ['greedy', 'scheduling'],
      viz(v) {
        const N = 9, T = 20, RC = ['blue', 'orange', 'purple', 'teal', 'pink', 'green', 'red', 'gold', 'muted'];
        const s = ivStage(v, N, T, { height: 330, title: 'the intervals (drag the ends)', weight: 1.4 });
        const ch = v.stage({ x: [0, T], y: [0, 6], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: 'intervals alive', weight: 1.3 });
        const init = [[0, 5], [1, 7], [2, 4], [4, 9], [6, 11], [8, 13], [9, 12], [10, 16], [14, 19]].map(([a, b], id) => ({ id, s: a, f: b }));
        const E = ivEditor(s, init, T, () => S.reset({ at: 'keep' }));
        const sweep = v.slider('sweep line at time', 0, T - 1, 4, { int: true });
        const place = (iv) => {
          const order = iv.slice().sort((a, b) => a.s - b.s || a.f - b.f || a.id - b.id), room = {}, free = []; const F = [];
          F.push({ room: {}, nr: 0, cur: null, line: 1, note: `Sort by start time: ${order.map((a) => LETTER(a.id)).join(', ')}. No room is open yet.` });
          for (const a of order) {
            let r = free.findIndex((x) => x <= a.s), opened = false;
            if (r < 0) { r = free.length; free.push(0); opened = true; }
            free[r] = a.f; room[a.id] = r;
            F.push({ room: { ...room }, nr: free.length, cur: a.id, opened, line: opened ? [3, 4, 5] : [3, 4], note: opened ? `${LETTER(a.id)} = [${a.s}, ${a.f}): every open room is busy at ${a.s}, so open **room ${r + 1}**.` : `${LETTER(a.id)} = [${a.s}, ${a.f}): room ${r + 1} is free from time ${free[r] === a.f ? 'before' : ''} ${a.s}, so reuse it.` });
          }
          return F;
        };
        const S = v.steps({ frames: () => place(E.get()), code: ['sort the intervals by start time;  d ← 0', 'for each interval I in that order:', '  if some room is free at s(I):  put I there', '  else:  open a new room, d ← d + 1;  put I there', 'return the assignment'], codeTitle: 'IntervalPartition', speed: 1.3, start: 'end', still: 'end' });
        let info = null;
        v.render(() => {
          const iv = E.get(), f = S.frame, { depth, at } = ivDepth(iv), t = sweep.value;
          ivBars(s, iv, N, (a) => (f.room[a.id] != null ? { color: RC[f.room[a.id] % RC.length], fill: RC[f.room[a.id] % RC.length], alpha: a.id === f.cur ? 0.85 : 0.5, width: a.id === f.cur ? 2.6 : 1.4, label: `${LETTER(a.id)}·${f.room[a.id] + 1}`, labelColor: a.id === f.cur ? 'panel' : 'ink' } : { color: 'muted', label: LETTER(a.id) }));
          const alive = iv.filter((a) => a.s <= t && t < a.f);
          s.vline(t, { color: 'gold', width: 2 });
          for (const a of alive) s.rect(a.s - 0.08, n0(a) - 0.36, a.f + 0.08, n0(a) + 0.36, { color: 'gold', width: 2, radius: 5 });
          function n0(a) { return N - a.id - 0.5; }
          const prof = []; for (let x = 0; x < T; x++) prof.push(iv.filter((a) => a.s <= x && x < a.f).length);
          ch.setView([0, T], [0, Math.max(depth, f.nr, 4) + 1]); ch.setTicks(null, null);
          prof.forEach((c, x) => ch.rect(x, 0, x + 1, c, { fill: c === depth ? 'red' : 'blue', fillAlpha: c === depth ? 0.5 : 0.28, color: c === depth ? 'red' : 'blue', width: 1 }));
          ch.hline(f.nr, { color: 'green', width: 2, dash: [6, 4] }); ch.vline(t + 0.5, { color: 'gold', width: 2 });
          ch.corner(`rooms opened so far: ${f.nr}   depth: ${depth}`, 'tl', { color: 'ink', weight: 700, plate: true });
          info = { depth, at, alive, nr: f.nr, iv };
        });
        v.legend([['red', 'moments at maximum depth', { area: true }], ['green', 'rooms opened so far', { dash: true }], ['gold', 'sweep line and the intervals it crosses']]);
        v.readout(() => {
          if (!info) return '';
          const { depth, at, alive, iv } = info;
          const final = place(iv).pop().nr;
          return `depth $d=${depth}$ (first reached at time ${at}); the sweep at $t=${sweep.value}$ crosses ${alive.length} interval${alive.length === 1 ? '' : 's'} · the algorithm ends with **${final}** room${final === 1 ? '' : 's'} ${final === depth ? '$=d$ ✓' : '≠ $d$ ✗'} (lower bound: those $d$ overlapping intervals need $d$ different rooms)`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.6
    {
      num: '10.6',
      kind: 'Algorithm',
      name: 'Minimizing maximum lateness (earliest deadline first)',
      statement: String.raw`**Problem.** One machine, $n$ jobs, all available at time $0$; job $j$ needs $t_j$ units of uninterrupted time and is due at time $d_j$. In a schedule with no idle time job $j$ finishes at $C_j$ and has **lateness** $\ell_j=C_j-d_j$ (negative if early). Choose the order that minimises $L_{\max}=\max_j \ell_j$. **Theorem.** Running the jobs in nondecreasing order of deadline (*earliest deadline first*, EDF) minimises the maximum lateness. Ties between equal deadlines do not matter.`,
      idea: String.raw`Any order with no idle time and an *inversion* (job $i$ immediately before $j$ although $d_i>d_j$) can be improved by swapping that adjacent pair. After the swap the jobs outside the pair finish exactly when they did. Job $j$ now finishes earlier, so its lateness only drops, and job $i$ now finishes where $j$ used to, at $C_j$, so its new lateness is $C_j-d_i<C_j-d_j$, below $j$'s old lateness. So $L_{\max}$ does not increase. Removing inversions one adjacent swap at a time turns any schedule into the EDF one, so EDF is optimal: an exchange argument (10.3). The idea goes back to Jackson's rule for single-machine scheduling.`,
      caption: String.raw`**Drag the five points** (duration to the right, deadline up) and pick an order; the schedule below shows each job as a bar ending at its completion time, with a stalk and dot at its deadline and a red strip along the part that runs past it. **Swap an inverted pair** exchanges the first adjacent pair out of deadline order: $L_{\max}$ never rises. The readout also compares with an exhaustive search over all $5!=120$ orders.`,
      deps: ['algo-10.3'],
      refs: ['KT §4.2'],
      tags: ['greedy', 'scheduling'],
      credit: 'J. R. Jackson, 1955 (earliest-due-date rule)',
      verify: true,
      viz(v) {
        const N = 5, NAMES = 'ABCDE', COL = ['blue', 'orange', 'purple', 'teal', 'pink'];
        const ord = v.select('order', [{ value: 'edf', label: 'earliest deadline' }, { value: 'spt', label: 'shortest first' }, { value: 'lpt', label: 'longest first' }, { value: 'idx', label: 'A, B, C, D, E' }, { value: 'rev', label: 'latest deadline' }], 'rev', { onChange: () => { order = byRule(ord.value); lastSwap = null; } });
        const s = v.stage({ x: [0, 7], y: [0, 17], axes: 'box', gutter: true, height: 300, xlabel: 'duration $t_j$', ylabel: 'deadline $d_j$', title: 'the jobs', weight: 0.8, xticks: [1, 2, 3, 4, 5, 6], yticks: [[0, '0'], [4, '4'], [8, '8'], [12, '12'], [16, '16']] });
        const sc = v.stage({ x: [0, 20], y: [0, 3], axes: 'box', gutter: true, height: 300, xlabel: 'time', title: 'the schedule', weight: 1.3, yticks: [] });
        const init = [[3, 5], [2, 7], [1, 8], [4, 9], [3, 13]];
        const H = init.map(([t, d], i) => s.handle(t, d, { color: COL[i], r: 8, label: NAMES[i], labelPos: 'ne', constrain: (x, y) => [clamp(Math.round(x), 1, 6), clamp(Math.round(y), 1, 16)] }));
        const jobs = () => H.map((h, i) => ({ id: i, t: Math.round(h.x), d: Math.round(h.y) }));
        const byRule = (r) => { const J = jobs(); const cmp = { edf: (a, b) => a.d - b.d || a.id - b.id, spt: (a, b) => a.t - b.t || a.id - b.id, lpt: (a, b) => b.t - a.t || a.id - b.id, idx: (a, b) => a.id - b.id, rev: (a, b) => b.d - a.d || a.id - b.id }[r]; return J.sort(cmp).map((j) => j.id); };
        let order = byRule('rev'), lastSwap = null, info = null;
        const lmax = (ordr, J) => { let t = 0, m = -Infinity; for (const id of ordr) { t += J[id].t; m = Math.max(m, t - J[id].d); } return m; };
        v.button('swap the first inverted pair', () => { const J = jobs(); for (let k = 0; k + 1 < order.length; k++) if (J[order[k]].d > J[order[k + 1]].d) { const before = lmax(order, J); [order[k], order[k + 1]] = [order[k + 1], order[k]]; lastSwap = { k, before, after: lmax(order, J) }; return; } lastSwap = { none: true }; });
        v.button('shuffle', () => { const r = rngOf(Math.floor(Math.random() * 1e6)); order = order.slice().sort(() => r() - 0.5); lastSwap = null; });
        v.render(() => {
          const J = jobs(); let t = 0; const rows = [];
          for (const id of order) { const a = t; t += J[id].t; rows.push({ id, a, c: t, d: J[id].d, l: t - J[id].d }); }
          const horizon = Math.max(8, t, ...J.map((j) => j.d)) + 1;
          sc.setView([0, horizon + 0.5], [0, 3]); sc.setTicks(null, []);
          rows.forEach((r) => {
            const col = COL[r.id];
            sc.rect(r.a, 1.0, r.c, 2.0, { fill: col, fillAlpha: 0.5, color: col, width: 1.6, radius: 4 });
            sc.text(NAMES[r.id], (r.a + r.c) / 2, 1.5, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'ink' });
            if (r.l > 0) sc.rect(Math.max(r.d, r.a), 1.0, r.c, 1.3, { fill: 'red', fillAlpha: 0.75, color: 'red', width: 1 });
            sc.text(r.l > 0 ? `+${r.l}` : r.l === 0 ? '0' : fmt(r.l), r.c - 0.1, 0.5, { align: 'right', size: 11.5, weight: 700, color: r.l > 0 ? 'red' : 'green' });
            sc.line(r.d, 2.05, r.d, 2.45, { color: col, width: 2 }); sc.dot(r.d, 2.5, { r: 4.5, color: col, fill: col });
          });
          const edf = byRule('edf'); const perms = []; const permute = (a, k) => { if (k === a.length) { perms.push(a.slice()); return; } for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; permute(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
          permute([0, 1, 2, 3, 4], 0);
          const best = Math.min(...perms.map((p) => lmax(p, J)));
          info = { J, rows, L: Math.max(...rows.map((r) => r.l)), Ledf: lmax(edf, J), best, inv: order.reduce((c, a, k) => c + order.slice(k + 1).filter((b) => J[a].d > J[b].d).length, 0) };
        });
        v.legend([['red', 'lateness (past the deadline)', { area: true }], ['muted', 'circle on a stalk: the deadline', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { L, Ledf, best, inv } = info;
          const sw = lastSwap ? (lastSwap.none ? ' · no inverted pair left: the order is EDF' : ` · last swap: $L_{\\max}$ ${fmt(lastSwap.before)} → ${fmt(lastSwap.after)} ${lastSwap.after <= lastSwap.before ? '(not worse ✓)' : '(worse ✗)'}`) : '';
          return `order ${order.map((i) => NAMES[i]).join(' ')}: $L_{\\max}=${fmt(L)}$ with ${plural(inv, 'inversion')} · EDF gives $${fmt(Ledf)}$, the best over all 120 orders is $${fmt(best)}$ ${Ledf === best ? '(EDF is optimal ✓)' : '(✗)'}${sw}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.7
    {
      num: '10.7',
      kind: 'Algorithm',
      name: 'Fractional knapsack by value density',
      statement: String.raw`**Problem.** Items $1,\dots,n$ have weights $w_i>0$ and values $v_i>0$; a knapsack holds total weight $C$. In the **fractional** problem one may take any fraction $x_i\in[0,1]$ of item $i$; maximise $\sum x_iv_i$ subject to $\sum x_iw_i\le C$. **Algorithm.** Sort by value density $v_i/w_i$, descending; take whole items while they fit, then the fitting fraction of the next one, and stop. This is optimal in $O(n\log n)$ time. In the **0/1** problem ($x_i\in\{0,1\}$) the same rule can be far from optimal; that problem is solved by dynamic programming (7.10) and is NP-hard in general.`,
      idea: String.raw`Exchange argument (10.3): suppose an optimal solution uses some weight $\varepsilon$ of a lower-density item $j$ while a denser item $i$ is not full. Replace that weight of $j$ by the same weight of $i$; the knapsack stays within capacity and the value changes by $\varepsilon(v_i/w_i-v_j/w_j)\ge0$. So some optimal solution fills denser items first, which is the greedy solution. The argument needs weight to be infinitely divisible: for 0/1 items the swap would have to trade whole items of different sizes, and then the freed space or the overflow breaks it. The fractional optimum is also an **upper bound** for the 0/1 optimum, because the 0/1 solutions are among the fractional ones.`,
      caption: String.raw`Each bar is an item: its width is the weight, its height the density, so its **area is its value**. Items are sorted by density and **dragging the gold handle** sets the capacity; the filled area is the greedy value. The right bars compare the fractional optimum (which the greedy always reaches), the 0/1 greedy and the dynamic-programming 0/1 optimum. Switch to *0/1* and find a capacity where whole items make greed lose.`,
      deps: ['algo-10.3', 'algo-7.10'],
      refs: ['CLRS 4e §15.2'],
      tags: ['greedy'],
      viz(v) {
        const mode = v.select('items may be', [{ value: 'frac', label: 'cut (fractional)' }, { value: 'whole', label: 'whole only (0/1)' }], 'frac', { onChange: () => cap.set(mode.value === 'whole' ? Math.round(cap.x) : cap.x, cap.y) });
        const items = [{ n: 'A', w: 4, v: 20 }, { n: 'B', w: 3, v: 12 }, { n: 'C', w: 5, v: 15 }, { n: 'D', w: 2, v: 9 }, { n: 'E', w: 6, v: 14 }, { n: 'F', w: 3, v: 4 }]
          .map((it) => ({ ...it, d: it.v / it.w })).sort((a, b) => b.d - a.d);
        const TW = sumOf(items, (i) => i.w), DM = items[0].d;
        const s = v.stage({ x: [0, TW + 1], y: [0, DM + 1.2], axes: 'box', gutter: true, height: 320, xlabel: 'cumulative weight (items in density order)', ylabel: 'density $v/w$', weight: 1.5 });
        const bs = v.stage({ x: [0, 3.6], y: [0, 70], axes: 'box', gutter: true, height: 320, ylabel: 'value', weight: 0.7, xticks: [[0.6, 'fractional'], [1.6, 'greedy 0/1'], [2.6, 'optimal 0/1']] });
        const cap = s.handle(11, DM + 0.45, { color: 'gold', r: 9, label: 'capacity', labelPos: 'n', constrain: (x) => [mode.value === 'whole' ? clamp(Math.round(x), 1, TW) : clamp(x, 0.3, TW), DM + 0.45] });
        let info = null;
        v.render(() => {
          const C = mode.value === 'whole' ? Math.round(cap.x) : cap.x; let x = 0, val = 0, room = C; const take = [];
          for (const it of items) {
            let f = 0;
            if (mode.value === 'frac') f = Math.min(1, Math.max(0, room / it.w)); else f = it.w <= room ? 1 : 0;
            take.push(f); room -= f * it.w; val += f * it.v;
          }
          items.forEach((it, i) => {
            const f = take[i], X0 = x, X1 = x + it.w;
            s.rect(X0, 0, X1, it.d, { fill: 'muted', fillAlpha: 0.08, color: 'muted', width: 1.3 });
            if (f > 0) s.rect(X0, 0, X0 + f * it.w, it.d, { fill: f === 1 ? 'green' : 'orange', fillAlpha: 0.5, color: f === 1 ? 'green' : 'orange', width: 1.6 });
            s.text(`${it.n}`, (X0 + X1) / 2, it.d + 0.35, { align: 'center', size: 12.5, weight: 700, color: 'ink' });
            s.text(`${it.w}·${fmt(it.d)}`, (X0 + X1) / 2, 0.45, { align: 'center', size: 10.5, color: 'muted' });
            x = X1;
          });
          s.vline(C, { color: 'gold', width: 2.2 }); cap.set(C, DM + 0.45);
          // independent optima: LP by vertex enumeration, 0/1 by subset search
          let lp = 0, opt = 0, optSet = 0; const n = items.length;
          for (let m = 0; m < 1 << n; m++) {
            let w = 0, vv = 0; for (let i = 0; i < n; i++) if (m >> i & 1) { w += items[i].w; vv += items[i].v; }
            if (w > C + 1e-9) continue;
            if (vv > opt) { opt = vv; optSet = m; }
            lp = Math.max(lp, vv);
            for (let j = 0; j < n; j++) if (!(m >> j & 1)) lp = Math.max(lp, vv + Math.min(1, (C - w) / items[j].w) * items[j].v);
          }
          // greedy 0/1 (whole items, scan in density order, skip the ones that do not fit)
          let r2 = C, g01 = 0; for (const it of items) if (it.w <= r2) { r2 -= it.w; g01 += it.v; }
          if (mode.value === 'whole') items.forEach((it, i) => { if (optSet >> i & 1) { let x0 = 0; for (let k = 0; k < i; k++) x0 += items[k].w; s.dot(x0 + it.w / 2, it.d / 2, { r: 5, color: 'gold', fill: 'gold' }); } });
          const fracGreedy = (() => { let rm = C, t = 0; for (const it of items) { const f = Math.min(1, Math.max(0, rm / it.w)); rm -= f * it.w; t += f * it.v; } return t; })();
          const bars = [[0.6, fracGreedy, 'green'], [1.6, g01, 'orange'], [2.6, opt, 'gold']];
          bs.setView([0, 3.6], [0, 72]);
          bars.forEach(([bx, h, c]) => { bs.rect(bx - 0.35, 0, bx + 0.35, h, { fill: c, fillAlpha: 0.55, color: c, width: 1.4 }); bs.text(fmt(h), bx, h + 2.5, { align: 'center', size: 12, weight: 700, color: 'ink' }); });
          info = { C, val, lp, opt, g01, fracGreedy };
        });
        v.legend([['green', 'taken whole'], ['orange', 'a cut piece'], ['gold', 'chosen by the 0/1 optimum', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { C, val, lp, opt, g01, fracGreedy } = info;
          return mode.value === 'frac'
            ? `capacity ${fmt(C)}: greedy value $${fmt(val)}$ · exhaustive search over every whole-items-plus-one-fraction vertex gives $${fmt(lp)}$ ${Math.abs(val - lp) < 1e-9 ? '✓' : '✗'} · for comparison the best 0/1 packing is $${fmt(opt)}$ ≤ $${fmt(fracGreedy)}$`
            : `capacity ${C}: greedy 0/1 value $${fmt(g01)}$, optimal 0/1 value $${fmt(opt)}$ (subset search) · ${g01 < opt ? `greed **loses by ${fmt(opt - g01)}**` : 'greed happens to be optimal at this capacity'} · fractional bound $${fmt(lp)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.8
    {
      num: '10.8',
      kind: 'Algorithm',
      name: 'Optimal offline caching (furthest in future)',
      statement: String.raw`**Problem.** A cache holds $k$ pages. A sequence of page requests $r_1,r_2,\dots,r_n$ is known in advance. A request for a page not in the cache is a **miss**: the page is brought in and, if the cache was full, some cached page is evicted. Minimise the number of misses. **Theorem (Bélády).** Evicting, at every miss, the cached page whose next request lies furthest in the future (or that is never requested again) minimises the number of misses over all eviction policies.`,
      idea: String.raw`Exchange argument (10.3). Let $S$ be any schedule that agrees with furthest-in-future (FF) up to some miss, where FF evicts page $e$ but $S$ evicts a different page $f$ (so $e$ is requested later than $f$, or never). Let $S'$ evict $e$ there instead and then imitate $S$. The caches of $S$ and $S'$ differ in exactly one page, $f$ against $e$. Follow them until $f$ is requested (this comes before $e$ is): if $S$ evicted $e$ meanwhile, $S'$ evicts $f$ and the caches coincide again; otherwise $S'$ pays one miss at $f$ but $S$ paid one at some earlier point ($S$ must evict something, and it is one of the two). In all cases $S'$ has no more misses than $S$, so FF can be imposed one decision at a time. FF needs the future, so it is a benchmark for online policies such as LRU; as a rule it cannot be implemented without knowing the requests.`,
      caption: String.raw`Type a request sequence and set the cache size, then step through. Each column is one request: the cache contents below it, hits in green, misses in red with the page evicted. For the optimal policy the arrows show, at the current miss, each cached page's next request; the evicted page is the one with the longest arrow. The readout compares the miss counts of all three policies with an exhaustive search over every eviction choice. The default sequence is a classic: try $k=3$ against $k=4$ under FIFO.`,
      deps: ['algo-10.3'],
      refs: ['CLRS 4e §15.4', 'KT §4.3'],
      tags: ['greedy', 'caching'],
      credit: 'L. A. Bélády, 1966 (the MIN policy)',
      viz(v) {
        const inp = v.input('requests', '1 2 3 4 1 2 5 1 2 3 4 5', { width: 260, onChange: () => S.reset({ at: 'keep' }) });
        const kk = v.slider('cache size $k$', 1, 5, 3, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const pol = v.select('policy', [{ value: 'min', label: 'furthest in future' }, { value: 'lru', label: 'LRU' }, { value: 'fifo', label: 'FIFO' }], 'min', { onChange: () => S.reset({ at: 'keep' }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 290 });
        const parse = () => String(inp.value).toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim().split(/\s+/).filter(Boolean).concat(String(inp.value).match(/^[A-Za-z0-9]+$/) && !/\s/.test(String(inp.value).trim()) ? [] : []).slice(0, 24);
        const seqOf = () => { const t = String(inp.value).trim(); const parts = /[\s,;]/.test(t) ? t.split(/[\s,;]+/) : t.split(''); return parts.filter(Boolean).slice(0, 24); };
        void parse;
        const next = (seq, t, p) => { for (let j = t + 1; j < seq.length; j++) if (seq[j] === p) return j; return Infinity; };
        function run(seq, k, policy) {
          const cache = [], F = [], arr = []; let miss = 0; const use = new Map();
          for (let t = 0; t < seq.length; t++) {
            const p = seq[t]; let ev = null, hit = cache.includes(p), nxt = null;
            if (hit) use.set(p, t);
            else {
              miss++;
              if (cache.length >= k) {
                if (policy === 'min') { nxt = cache.map((q) => [q, next(seq, t, q)]); ev = nxt.reduce((b, c) => (c[1] > b[1] ? c : b))[0]; }
                else if (policy === 'lru') ev = cache.reduce((b, q) => (use.get(q) < use.get(b) ? q : b));
                else ev = cache[0];
                cache.splice(cache.indexOf(ev), 1);
              } else if (policy === 'min') nxt = cache.map((q) => [q, next(seq, t, q)]);
              cache.push(p); use.set(p, t);
            }
            F.push({ t, p, hit, ev, cache: cache.slice(), miss, nxt });
            arr.push(F[F.length - 1]);
          }
          return { F, miss };
        }
        function optimum(seq, k) {
          const memo = new Map();
          const go = (t, cache) => {
            if (t === seq.length) return 0;
            const key = t + '|' + cache.slice().sort().join(',');
            if (memo.has(key)) return memo.get(key);
            const p = seq[t]; let r;
            if (cache.includes(p)) r = go(t + 1, cache);
            else if (cache.length < k) r = 1 + go(t + 1, cache.concat(p));
            else { r = Infinity; for (const q of cache) r = Math.min(r, 1 + go(t + 1, cache.filter((x) => x !== q).concat(p))); }
            memo.set(key, r); return r;
          };
          return go(0, []);
        }
        const frames = () => {
          const seq = seqOf(), r = run(seq, kk.value, pol.value);
          return [{ t: -1, cache: [], miss: 0, note: `A cache of ${kk.value} page${kk.value === 1 ? '' : 's'}, ${seq.length} requests, policy **${{ min: 'furthest in future', lru: 'LRU (least recently used)', fifo: 'FIFO (first in, first out)' }[pol.value]}**.` }].concat(r.F.map((f) => ({ ...f,
            note: f.hit ? `Request ${f.t + 1} is **${f.p}**: already cached, a hit.` : f.ev == null ? `Request ${f.t + 1} is **${f.p}**: a miss, but there is room, so just load it.` : `Request ${f.t + 1} is **${f.p}**: a miss. ${pol.value === 'min' ? `Next requests: ${f.nxt.map(([q, j]) => `${q} ${j === Infinity ? 'never' : 'at ' + (j + 1)}`).join(', ')}. Evict **${f.ev}**, the one needed furthest ahead.` : pol.value === 'lru' ? `Evict **${f.ev}**, the least recently used.` : `Evict **${f.ev}**, which has been cached longest.`}` })));
        };
        const S = v.steps({ frames, speed: 1.4, start: 'end', still: 'end' });
        let info = null;
        v.render(() => {
          const seq = seqOf(), k = kk.value, f = S.frame, n = seq.length;
          const W = s.width, Hh = s.height, L = 56, cw = Math.min(46, (W - L - 12) / Math.max(1, n)), top = 52, rh = 34;
          TX(s, 'request', 6, top - 14, { size: 11.5, weight: 700, color: 'muted', align: 'left' });
          for (let r = 0; r < k; r++) TX(s, `slot ${r + 1}`, 6, top + 18 + r * rh + 12, { size: 11, color: 'faint', align: 'left' });
          const full = run(seq, k, pol.value).F;
          const upto = f.t;
          const slots = [];
          for (let t = 0; t < n; t++) {
            const X = L + t * cw + cw / 2, fr = full[t], shown = t <= upto;
            R(s, X - cw / 2 + 2, top - 28, X + cw / 2 - 2, top - 2, { fill: shown ? (fr.hit ? 'green' : 'red') : 'muted', fillAlpha: shown ? 0.35 : 0.08, color: shown ? (fr.hit ? 'green' : 'red') : 'muted', width: t === upto ? 2.6 : 1.2, radius: 5 });
            TX(s, seq[t], X, top - 15, { align: 'center', size: 13, weight: 700, color: 'ink', halo: false });
            if (!shown) continue;
            const prev = t > 0 ? full[t - 1].cache : [], order = [];
            // keep page positions stable: a page stays in its slot until evicted
            slots[t] = (t > 0 ? slots[t - 1] : new Array(k).fill(null)).slice();
            if (!fr.hit) { const idx = fr.ev != null ? slots[t].indexOf(fr.ev) : slots[t].indexOf(null); slots[t][idx] = fr.p; }
            void prev; void order;
            for (let r = 0; r < k; r++) { const q = slots[t][r]; if (q == null) continue; const cur = q === fr.p; R(s, X - cw / 2 + 3, top + 18 + r * rh, X + cw / 2 - 3, top + 18 + r * rh + 26, { fill: cur ? (fr.hit ? 'green' : 'red') : 'accent', fillAlpha: cur ? 0.45 : 0.14, color: cur ? (fr.hit ? 'green' : 'red') : 'accent', width: 1.2, radius: 4 }); TX(s, q, X, top + 18 + r * rh + 13.5, { align: 'center', size: 12.5, weight: 700, color: 'ink', halo: false }); }
            if (fr.ev != null) TX(s, `−${fr.ev}`, X, top + 18 + k * rh + 6, { align: 'center', size: 11, weight: 700, color: 'red' });
          }
          TX(s, 'evicted', 6, top + 18 + k * rh + 6, { size: 11, color: 'faint', align: 'left' });
          // next-request arrows at the current miss
          if (f.nxt && pol.value === 'min' && f.t >= 0) {
            const X0 = L + f.t * cw + cw / 2;
            f.nxt.forEach(([q, j], i) => {
              const evict = q === f.ev, y = top + 18 + k * rh + 28 + i * 17, X1 = j === Infinity ? L + n * cw + 4 : L + j * cw + cw / 2;
              LN(s, X0, y, Math.min(X1, W - 8), y, { color: evict ? 'red' : 'muted', width: evict ? 3 : 1.6 }); TX(s, q, X0 - 9, y, { size: 11.5, weight: 700, color: evict ? 'red' : 'muted', align: 'center' });
              TX(s, j === Infinity ? 'never' : `request ${j + 1}`, Math.min(X1, W - 8) - 4, y - 8, { size: 10, color: evict ? 'red' : 'muted', align: 'right' });
            });
          }
          void Hh;
          const m = { min: run(seq, k, 'min').miss, lru: run(seq, k, 'lru').miss, fifo: run(seq, k, 'fifo').miss };
          info = { m, opt: n <= 24 ? optimum(seq, k) : null, n, cur: f.miss };
        });
        v.legend([['green', 'hit'], ['red', 'miss'], ['accent', 'cached page']]);
        v.readout(() => {
          if (!info) return '';
          const { m, opt, n, cur } = info;
          return `so far ${cur} miss${cur === 1 ? '' : 'es'} · over all ${n} requests with $k=${kk.value}$: furthest-in-future **${m.min}**, LRU ${m.lru}, FIFO ${m.fifo} · exhaustive search over every eviction choice: ${opt} ${opt === m.min ? '(equals furthest-in-future ✓)' : '(✗)'}${m.min <= Math.min(m.lru, m.fifo) ? '' : ' ✗'}`;
        });
      },
    },
  ],
};
