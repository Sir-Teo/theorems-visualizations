import stealingItem from './stealing-item.js';
import hypercubeItem from './hypercube-item.js';
// Game Theory & Social Choice — Chapter 4 (part c): strategy stealing, Nim and Sprague–Grundy, hypercube tic-tac-toe
import { idx, nmz } from './ch04.shared.js';
import { GAMES, grundyTable, sumSolver, nimSum, nimReply, validNimState } from './nim-audit.js';

// ---------------------------------------------------------------- Nim / Grundy

export default {
  collection: 'game',
  chapter: 4,
  items: [
    stealingItem,
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Nim and the Sprague–Grundy theorem',
      statement: String.raw`**Nim (Bouton).** In a game of Nim with heaps $a_1,\dots,a_k$, players alternately remove any positive number of tokens from one heap, and whoever takes the last token wins. The position is a loss for the player to move exactly when the **nim-sum** $a_1\oplus\cdots\oplus a_k$ (bitwise XOR) is $0$; otherwise there is a move to a position of nim-sum $0$. **Sprague–Grundy.** In any finite terminating impartial game (both players have the same moves at each position, no chance moves, and normal play: a player with no legal move loses) define the Grundy value $g(P)=\operatorname{mex}\{g(Q): Q \text{ a move from } P\}$. A sum of such games, in which a move is made in one component, behaves exactly like Nim with heaps of sizes $g(P_i)$: it is a loss for the player to move iff $g(P_1)\oplus\cdots\oplus g(P_k)=0$.`,
      idea: String.raw`From a position of nim-sum $0$, every move changes exactly one heap and so changes the XOR, giving a nonzero position; from a nonzero nim-sum $s$ there is a heap $a$ whose leading bit of $s$ is set, and reducing it to $a\oplus s<a$ makes the XOR zero. Since the end position has nim-sum $0$, backward induction (game-4.2) tags exactly the XOR-zero positions as losses for the mover. For the sum theorem, write $S=\bigoplus_i g(P_i)$. No move keeps $S$ unchanged, since mex forbids a child with its parent's Grundy value. For any nonnegative integer $T<S$, choose a component with a set bit at the highest differing bit of $S$ and $T$. Its required new value $g(P_i)\oplus S\oplus T$ is smaller than $g(P_i)$, so mex guarantees an actual option with that value. Induction on remaining play therefore gives every option sum its stated XOR, excludes $S$ and supplies every $T<S$; the sum's mex is exactly $S$. The finite decreasing game tree is essential: this is not a rule for games with indefinite cycles or misère last-move rules.`,
      caption: String.raw`**Nim**: click a token to take it and every token above it from that heap; the computer answers by making the XOR of the binary heap sizes zero whenever it can (the right panel shows the binary digits and their XOR). **Sum of games**: choose a game (a Nim heap, two subtraction games, Kayles rows); the bars are its Grundy values $g(n)$. The grid marks, for sums of two heaps $(a,b)$, those positions that the exhaustive search shows to be lost for the mover; they coincide with $g(a)=g(b)$, i.e. $g(a)\oplus g(b)=0$.`,
      credit: 'Bouton, 1901–1902 (cited by Sprague); Sprague, 1935, Theorems I–III',
      deps: ['game-4.2'],
      refs: ['Sprague (1935), Über mathematische Kampfspiele, §§1–9, Theorems I–III, pp.438–442'],
      tags: ['Nim', 'impartial games', 'combinatorial game'],
      links: { source: 'https://www.jstage.jst.go.jp/article/tmj1911/41/0/41_0_438/_pdf', wikipedia: 'https://en.wikipedia.org/wiki/Sprague%E2%80%93Grundy_theorem' },
      scope: 'Normal play on finite terminating game trees. The finite widget uses2–4Nim heaps, each0–7tokens; zero heaps are allowed and all-zero is terminal. Kayles removes one pin or two adjacent pins, splitting a row into independent remaining rows. The grid covers row sizes0–12. These are exact finite integer calculations, without a claim about misère sums, games with cycles or historical priority. Saved state includes heaps, last-token result and random seed.',
      verify: false,
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 340, weight: 1.1, title: 'Nim' });
        const Bb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.9, title: 'binary digits and the nim-sum' });
        let mode = 'nim', heaps = [3, 4, 5], outcome = null, seed = 1, key = 'kayles';
        const NMAX = 12;
        const sel = v.select('view', [{ value: 'nim', label: 'play Nim' }, { value: 'sum', label: 'Grundy values and sums' }], 'nim', { onChange: (m) => { mode = m; vis(); } });
        const gsel = v.select('game', Object.keys(GAMES).map((k) => ({ value: k, label: GAMES[k].label })), key, { onChange: (k) => { key = k; } });
        const sa = v.slider('heap $a$', 0, NMAX, 7, { int: true });
        const sb = v.slider('heap $b$', 0, NMAX, 5, { int: true });
        const comp = v.toggle('computer replies', true);
        const bNew = v.button('random position', () => { seed=seed%4294967295+1; const r = v.rng(seed); heaps = idx(r.int(2, 4)).map(() => r.int(1, 7)); outcome = null; });
        const bRst = v.button('reset', () => { heaps = [3, 4, 5]; outcome = null; });
        const vis = () => { [gsel, sa, sb].forEach((c) => { c.el.hidden = mode !== 'sum'; }); comp.el.hidden = mode !== 'nim'; bNew.hidden = bRst.hidden = mode !== 'nim'; };
        vis();
        const xor = nimSum;
        v.shareState('Nim heaps and random seed', {
          get: () => ({ heaps: heaps.slice(), seed, outcome }),
          validate: validNimState,
          set: d => { heaps=d.heaps.slice(); seed=d.seed; outcome=d.outcome; },
        });
        A.onClick((x, y) => {
          if (mode !== 'nim' || outcome) return;
          const w = 0.88 / Math.max(heaps.length, 3), x0 = 0.06;
          const k = Math.floor((x - x0) / w), j = Math.floor((y - 0.1) / 0.085);
          if (k < 0 || k >= heaps.length || j < 0 || j >= heaps[k] || Math.hypot(x-(x0+w*(k+.5)),y-(.1+.085*(j+.5)))>.034) return;
          heaps[k] = j;
          if (xor(heaps) === 0 && heaps.every((a) => a === 0)) { outcome = 'human'; return; }
          if (comp.value) { heaps=nimReply(heaps); if (heaps.every((a) => a === 0)) outcome = 'computer'; }
        });
        const solverCache = {}, sol = (k) => (solverCache[k] = solverCache[k] || sumSolver(k));
        let info;
        v.render(() => {
          if (mode === 'nim') {
            A.setView([0, 1], [0, 1]); A.setTitle('Nim: click a token');
            const w = 0.88 / Math.max(heaps.length, 3), x0 = 0.06;
            heaps.forEach((a, k) => {
              for (let j = 0; j < a; j++) A.circle(x0 + w * (k + 0.5), 0.1 + 0.085 * (j + 0.5), 0.034, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1.5 });
              A.text(String(a), x0 + w * (k + 0.5), 0.05, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: 'ink' });
            });
            Bb.setView([0, 1], [0, 1]); Bb.setTitle('binary digits and the nim-sum');
            const bits = 3, s = xor(heaps), cw = 0.14, bx = 0.48;
            heaps.forEach((a, k) => {
              const y = 0.85 - 0.11 * k;
              Bb.text(`${a}`, bx - 0.05, y, { align: 'right', baseline: 'middle', size: 13, color: 'blue', weight: 700 });
              for (let b = 0; b < bits; b++) Bb.text(String((a >> (bits - 1 - b)) & 1), bx + cw * (b + 0.5), y, { align: 'center', baseline: 'middle', size: 18, weight: 600, color: 'ink' });
            });
            const yl = 0.85 - 0.11 * heaps.length - 0.02;
            Bb.line(bx, yl + 0.045, bx + cw * bits, yl + 0.045, { color: 'ink', width: 2 });
            for (let b = 0; b < bits; b++) { const bit = (s >> (bits - 1 - b)) & 1; Bb.text(String(bit), bx + cw * (b + 0.5), yl - 0.04, { align: 'center', baseline: 'middle', size: 20, weight: 800, color: bit ? 'red' : 'green' }); }
            Bb.text(`nim-sum ${s}`, bx - 0.05, yl - 0.04, { align: 'right', baseline: 'middle', size: 13, color: s ? 'red' : 'green', weight: 700 });
            info = { s, heaps: heaps.slice() };
          } else {
            const N = NMAX, g = grundyTable(key, N), a = sa.value, b = sb.value, S = sol(key);
            A.setView([-0.8, N + 0.8], [-0.9, Math.max(...g) + 1.8]); A.setTitle(`Grundy values of “${GAMES[key].label}”`);
            g.forEach((gv, n) => { A.rect(n - 0.36, 0, n + 0.36, gv, { fill: n === a || n === b ? 'gold' : 'blue', fillAlpha: n === a || n === b ? 0.55 : 0.28, color: n === a || n === b ? 'gold' : 'blue', width: 1.5 }); A.text(String(gv), n, gv + 0.08, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: 'ink' }); A.text(String(n), n, -0.15, { align: 'center', baseline: 'top', size: 11, color: 'muted' }); });
            Bb.setView([-2, N + 1.6], [-1.5, N + 2]); Bb.setTitle('sums of two heaps: lost for the mover (brute force)');
            let bad = 0;
            for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
              const lost = S.lost([i, j].filter((x) => x > 0).sort((x, y) => x - y)), pred = (g[i] ^ g[j]) === 0;
              if (lost !== pred) bad++;
              const sel2 = i === a && j === b;
              Bb.rect(j - 0.5, N - i - 0.5, j + 0.5, N - i + 0.5, { fill: lost ? 'green' : 'panel', fillAlpha: lost ? 0.45 : 0, color: sel2 ? 'gold' : 'faint', width: sel2 ? 3 : 0.5 });
            }
            Bb.text('b →', N / 2, N + 1.1, { align: 'center', size: 11.5, color: 'muted' }); Bb.text('a ↓', -0.9, N / 2, { align: 'center', size: 11.5, color: 'muted' });
            const lost = S.lost([a, b].filter((x) => x > 0).sort((x, y) => x - y));
            const moves = GAMES[key].moves(a).map((m) => m.reduce((x, k) => x ^ g[k], 0));
            info = { g, a, b, lost, bad, states: S.memo.size, moves };
          }
        });
        v.readout(() => {
          if (mode === 'nim') {
            const { s, heaps: hh } = info;
            return `${outcome ? `**${outcome==='human'?'you took the last token: you win':'the computer took the last token: you lose'}**\n` : ''}heaps ${hh.join(', ')}: nim-sum ${s} — ${hh.every((x) => x === 0) ? 'game over' : s === 0 ? 'a loss for the player to move (every move creates a nonzero XOR)' : `a win for the player to move: reduce a heap $h$ to $h\\oplus${s}$`}`;
          }
          const { g, a, b, lost, bad, states, moves } = info;
          return `$g(${a})=\\operatorname{mex}\\{${[...new Set(moves)].sort((x, y) => x - y).join(',')}\\}=${g[a]}$, $g(${b})=${g[b]}$, $g(a)\\oplus g(b)=${g[a] ^ g[b]}$ — exhaustive search says the sum $(${a},${b})$ is ${lost ? 'lost' : 'won'} for the mover\nmismatches between the search (${states} positions evaluated) and the XOR rule over the whole grid: ${bad}`;
        });
      },
    },
    hypercubeItem,
  ],
};
