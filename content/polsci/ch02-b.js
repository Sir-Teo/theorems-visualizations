// Political Science & Social Choice — Chapter 2: Voting paradoxes and fairness criteria (part b: agendas, the chair, Saari, compound majorities, judgments, real elections)
import {
  CC, LET, sum, range, clamp, perms, mkProfile, copyProfile, setProfile, total, rkStr, best, names,
  tops, pairwise, positional, borda, irv, condorcet, rr, txt, chip, winTag, blocEditor, drawRepTriangle, counts3,
} from './ch01.shared.js';
import { pairwiseT, cwOf, irvW, irvRun, cloneP, raise, shift, addGroup, tidy, arrowPx, drawTourney, pill, fmtK, drawIRV } from './ch02.shared.js';

// ---------- local helpers
function linePx(v, c, x0, y0, x1, y1, col, w = 1.5, dash = null, alpha = 1) {
  c.save(); c.strokeStyle = v.color(col, alpha); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
function hlinePx(v, c, x0, x1, Y, col, dash, w = 1.3) { linePx(v, c, x0, Math.round(Y) + 0.5, x1, Math.round(Y) + 0.5, col, w, dash); }
const ring = (m, cx, cy, R, rot = 0) => range(m).map((k) => [cx + R * Math.sin((2 * Math.PI * k) / m + rot), cy - R * Math.cos((2 * Math.PI * k) / m + rot)]);
const ord = (k) => ['first', 'second', 'third', 'fourth', 'fifth'][k];
const pct = (a, n, d = 0) => `${((100 * a) / (n || 1)).toFixed(d)}%`;
/** Majority winner of a vs b (ties keep a). */
const maj = (N, a, b) => (N[b][a] > N[a][b] ? b : a);

export default {
  collection: 'polsci',
  chapter: 2,
  items: [

    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Paradox',
      name: 'Agenda manipulation under a cycle',
      statement: String.raw`Under sequential pairwise voting (polsci-1.7) with three candidates, an agenda says which two meet first; the survivor then meets the third. If the majorities form a cycle $A \to B \to C \to A$, the chair who sets the agenda decides the outcome:

(a) with **sincere** voting the candidate that enters last wins — it faces the survivor of the first vote, which is always the one it beats;

(b) with **sophisticated** voting (voters look ahead and vote, at the first stage, for the outcome they prefer among the two that the final vote would produce) the winner is again determined by the agenda: for $(x, y \text{ first, then } z)$ the outcome is the majority winner between “$x$ vs $z$” and “$y$ vs $z$”.

Either way each of the three candidates wins under one of the three agendas. If there is a Condorcet winner, every agenda elects it and the chair has no power.`,
      idea: String.raw`(a) In a cycle the last entrant $z$ beats one of the other two and loses to the other. The first vote is between those two, and the cycle says that $z$’s victim beats $z$’s conqueror — so $z$ always meets, and beats, its victim. (b) Backward induction (game-4.2) replaces each first-stage alternative by the outcome it leads to: voting for $x$ really means “$x$ vs $z$”, voting for $y$ means “$y$ vs $z$”. In a cycle these two final outcomes differ, and the majority picks between them. The sophisticated winner differs from the sincere one under every agenda, but the chair can still pick any of the three — only who must be placed where changes. McKelvey’s chaos theorem (polsci-4.6) extends this to continuous policy spaces: whoever controls the agenda can reach almost any outcome.`,
      caption: String.raw`Left: the majorities between the three candidates (the starting electorate cycles). Right: the three possible agendas, voted on one step at a time; press ▶ or step through. Choose the chair’s favourite: the agenda that delivers it is highlighted. Switch to *sophisticated* voting: the first vote is now read as a choice between the two finals it would lead to (shown above it), and the winners rotate. Drag the bars below to give one candidate a majority over both rivals: all three agendas then agree, and the chair is powerless.`,
      deps: ['polsci-1.7', 'polsci-2.1', 'game-4.2'],
      see: ['polsci-4.6', 'polsci-2.9'],
      refs: ['Shepsle: agenda power', 'T&P ch. 1', 'Farquharson, Theory of Voting (1969)'],
      tags: ['agenda', 'sophisticated voting', 'majority cycles'],
      credit: 'Black (1958) and Farquharson (1969); sophisticated agendas: McKelvey & Niemi 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Agenda_(meeting)#Agenda_manipulation' },
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, minWidth: 270, title: 'the majorities' });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, minWidth: 470, weight: 1.7, title: 'three agendas: the candidate on the right enters the final vote' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 180, full: true, title: 'ballots' });
        const R6 = perms(3), P = { m: 3, blocs: R6.map((r, k) => ({ n: [4, 0, 0, 3, 2, 0][k], r: r.slice() })) };
        const AG = [[0, 1, 2], [0, 2, 1], [1, 2, 0]];
        const mode = v.select('voting', [{ value: 'sin', label: 'sincere' }, { value: 'soph', label: 'sophisticated' }], 'sin', { onChange: () => S.reset({ at: 'end' }) });
        const fav = v.select('chair’s favourite', [0, 1, 2].map((c) => ({ value: c, label: LET[c] })), 0);
        const run = (N, [x, y, z], md = mode.value) => {
          if (md === 'sin') { const w1 = maj(N, x, y); return { w1, fin: maj(N, w1, z), ox: null, oy: null }; }
          const ox = maj(N, x, z), oy = maj(N, y, z), fin = ox === oy ? ox : maj(N, ox, oy);
          return { w1: fin === ox ? x : y, fin, ox, oy };
        };
        const frames = () => {
          const N = pairwise(P), R = AG.map((ag) => run(N, ag)), L = (c) => LET[c];
          const f1 = AG.map((ag, i) => `${L(ag[0])} vs ${L(ag[1])} → ${L(R[i].w1)}`).join('; ');
          const f2 = AG.map((ag, i) => `${L(R[i].w1)} vs ${L(ag[2])} → ${L(R[i].fin)}`).join('; ');
          return [
            { k: 0, note: 'Three agendas: in each, the two candidates on the left meet first and the survivor meets the candidate on the right.' },
            { k: 1, note: mode.value === 'sin' ? `First votes (sincere): ${f1}.` : `First votes (sophisticated): a vote for x really means “x vs the last entrant”. ${AG.map((ag, i) => `${L(ag[0])} ⇒ ${L(R[i].ox)}, ${L(ag[1])} ⇒ ${L(R[i].oy)}, so ${L(R[i].w1)} survives`).join('; ')}.` },
            { k: 2, note: `Final votes: ${f2}.` },
            { k: 3, note: `Winners: ${AG.map((ag, i) => `agenda ${i + 1} → **${L(R[i].fin)}**`).join(', ')}. ${new Set(R.map((r) => r.fin)).size === 3 ? 'Each candidate wins under some agenda: the chair decides.' : new Set(R.map((r) => r.fin)).size === 1 ? 'Every agenda gives the same winner: the chair has no power.' : 'The agenda still matters.'}` },
          ];
        };
        const S = v.steps({ frames, transition: 0.4, start: 'end', still: 'end', speed: 0.9 });
        const ed = blocEditor(v, E, P, { max: 10, rowMax: 26, onEdit: () => S.reset({ at: 'end' }) });
        v.render(() => {
          ed.draw();
          const N = pairwise(P), C = condorcet(P, N), k = S.frame.k ?? 3, tw = S.tween;
          // ---- tournament
          const tc = T.ctx, TW = T.width, TH = T.height, pos = ring(3, TW / 2, TH / 2 + 10, Math.min(TW * 0.32, TH * 0.32));
          const cyc = C.winner < 0;
          drawTourney(v, tc, N, [0, 1, 2], pos, { r: 19, color: () => (cyc ? 'red' : null), ring: (x) => (x === C.winner ? 'green' : null), bend: cyc ? -16 : 0 });
          txt(v, tc, cyc ? 'a majority cycle' : C.winner >= 0 ? `${LET[C.winner]}: Condorcet winner` : 'a pairwise tie', TW / 2, TH / 2 + 14, { size: 11.5, weight: 700, color: cyc ? 'red' : 'green' });
          // ---- agendas
          const c = A.ctx, W = A.width, H = A.height, cw = W / 3, yb = H - 34, y1 = H * 0.56, y2 = H * 0.24;
          AG.forEach((ag, i) => {
            const R = run(N, ag), ox = i * cw, good = R.fin === +fav.value && k >= 3;
            rr(c, ox + 5, 5, cw - 10, H - 10, 10); c.fillStyle = v.color(good ? 'gold' : 'muted', good ? 0.13 : 0.04); c.fill();
            if (good) { c.strokeStyle = v.color('gold'); c.lineWidth = 2; c.stroke(); }
            txt(v, c, `agenda ${i + 1}`, ox + 16, 22, { size: 11.5, weight: 700, align: 'left' });
            if (good) txt(v, c, 'chair’s pick', ox + cw - 14, 22, { size: 10.5, weight: 700, color: 'gold', align: 'right' });
            const xs = [ox + cw * 0.2, ox + cw * 0.45, ox + cw * 0.8], n1 = (xs[0] + xs[1]) / 2, n2 = (n1 + xs[2]) / 2;
            const a1 = k >= 1 ? (k === 1 ? tw : 1) : 0, a2 = k >= 2 ? (k === 2 ? tw : 1) : 0;
            const col1 = k >= 1 ? 'ink' : 'faint', col2 = k >= 2 ? 'ink' : 'faint';
            linePx(v, c, xs[0], yb - 14, xs[0], y1, col1, 1.6); linePx(v, c, xs[1], yb - 14, xs[1], y1, col1, 1.6); linePx(v, c, xs[0], y1, xs[1], y1, col1, 1.6);
            linePx(v, c, n1, y1, n1, y2, col2, 1.6); linePx(v, c, xs[2], yb - 14, xs[2], y2, col2, 1.6); linePx(v, c, n1, y2, xs[2], y2, col2, 1.6);
            ag.forEach((cand, j) => chip(v, c, xs[j], yb, cand, { r: 13, alpha: (k >= 1 && j < 2 && cand !== R.w1) || (k >= 2 && cand !== R.fin) ? 0.35 : 1 }));
            if (a1 > 0) {
              chip(v, c, n1, y1, R.w1, { r: 12, alpha: a1 });
              const p = N[R.w1][ag[0] === R.w1 ? ag[1] : ag[0]], q = N[ag[0] === R.w1 ? ag[1] : ag[0]][R.w1];
              txt(v, c, mode.value === 'sin' ? `${p}–${q}` : `${LET[ag[0]]}⇒${LET[R.ox]}  ${LET[ag[1]]}⇒${LET[R.oy]}`, n1, y1 + 24, { size: 10.5, weight: 700, color: mode.value === 'sin' ? 'muted' : 'purple', alpha: a1, halo: true });
            } else { c.beginPath(); c.arc(n1, y1, 4, 0, 7); c.fillStyle = v.color('faint'); c.fill(); }
            if (a2 > 0) {
              chip(v, c, n2, y2, R.fin, { r: 14, alpha: a2, ring: k >= 3 ? 'gold' : null });
              const o = R.fin === R.w1 ? ag[2] : R.w1;
              txt(v, c, `${N[R.fin][o]}–${N[o][R.fin]}`, n2 + 22, y2 - 6, { size: 10.5, weight: 700, color: 'muted', align: 'left', alpha: a2 });
            } else { c.beginPath(); c.arc(n2, y2, 4, 0, 7); c.fillStyle = v.color('faint'); c.fill(); }
            if (k >= 3) txt(v, c, `${LET[R.fin]} wins`, n2, y2 - 28, { size: 12, weight: 800, color: 'gold' });
          });
        });
        v.legend([['red', 'majority cycle'], ['gold', 'agenda that elects the chair’s favourite', { area: true }], ['purple', 'sophisticated: what a first-round vote leads to', { dot: true }]]);
        v.readout(() => {
          const N = pairwise(P), R = AG.map((ag) => run(N, ag)), L = (c) => LET[c], f = +fav.value;
          const ok = AG.filter((ag, i) => R[i].fin === f).map((ag) => `${L(ag[0])} vs ${L(ag[1])}, then ${L(ag[2])}`);
          const other = mode.value === 'sin' ? 'sophisticated' : 'sincere';
          const R2 = AG.map((ag) => run(N, ag, mode.value === 'sin' ? 'soph' : 'sin'));
          return `${mode.value === 'sin' ? 'Sincere' : 'Sophisticated'} voting: the three agendas elect ${R.map((r) => `**${L(r.fin)}**`).join(', ')}; under ${other} voting they would elect ${R2.map((r) => L(r.fin)).join(', ')}. ` +
            (ok.length ? `To get ${L(f)}, the chair schedules ${ok.join(' or ')}.` : `No agenda elects ${L(f)}: it is beaten by the Condorcet winner, whom every agenda elects.`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Paradox',
      name: 'The chair’s paradox',
      statement: String.raw`Three voters choose one of $A, B, C$ by plurality; if all three vote differently, the chair’s vote decides. Their preferences form a cycle: the chair ranks $A \succ B \succ C$, voter 2 $B \succ C \succ A$, voter 3 $C \succ A \succ B$. The chair seems to hold the most power — with sincere votes her favourite $A$ wins. But if all three vote strategically, eliminating weakly dominated strategies round by round, the only surviving outcome is $C$: the chair’s **last** choice. Having the tie-breaking vote hurts her.`,
      idea: String.raw`Treat the vote as a game (game-1.7). For the chair, voting $A$ weakly dominates everything else, since her vote wins every three-way split. Voters 2 and 3 never gain by voting for their last choices ($A$ for voter 2, $B$ for voter 3). Once the chair is known to vote $A$, voter 2 compares her remaining options: voting $B$ produces a three-way split that the chair wins with $A$, while voting $C$ can produce $C$. So $C$ weakly dominates $B$ for voter 2. Voter 3 sees it too and votes $C$, and $C$ wins two votes to one. The chair’s strength is common knowledge, so the other two coordinate against her on the candidate she likes least — the one each of them ranks above $A$ or prefers outright.`,
      caption: String.raw`Each table is one choice of the chair; rows are voter 2’s vote, columns voter 3’s, and each cell shows who wins. Step through the rounds of elimination: dominated votes are struck out and their rows, columns or tables fade. In the last step one cell survives, ringed gold. Click a voter’s card to change their ranking and the elimination is recomputed; with a Condorcet winner the paradox disappears.`,
      deps: ['polsci-1.2', 'game-1.7'],
      see: ['polsci-2.8'],
      refs: ['T&P ch. 3', 'Brams, Paradoxes in Politics (1976)'],
      tags: ['strategic voting', 'dominated strategies', 'power'],
      credit: 'Farquharson (1969); named by Brams (1976)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chair%27s_paradox' },
      viz(v) {
        const Vs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, minWidth: 250, title: 'the voters · click to change a ranking' });
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, minWidth: 520, weight: 2, title: 'who wins · rows: voter 2’s vote, columns: voter 3’s vote' });
        const R6 = perms(3), pref = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
        const outcome = (s) => { for (let x = 0; x < 3; x++) if (s.filter((y) => y === x).length >= 2) return x; return s[0]; };
        const u = (i, x) => 2 - pref[i].indexOf(x);
        /** Rounds of simultaneous elimination of weakly dominated votes. */
        function rounds() {
          let S = [[0, 1, 2], [0, 1, 2], [0, 1, 2]]; const out = [{ S: S.map((a) => a.slice()), gone: [[], [], []] }];
          for (let it = 0; it < 6; it++) {
            const gone = [[], [], []];
            for (let i = 0; i < 3; i++) {
              const others = [];
              for (const a of S[(i + 1) % 3]) for (const b of S[(i + 2) % 3]) others.push([a, b]);
              const prof = (x, [a, b]) => { const s = [0, 0, 0]; s[i] = x; s[(i + 1) % 3] = a; s[(i + 2) % 3] = b; return s; };
              for (const x of S[i]) for (const y of S[i]) {
                if (x === y || gone[i].includes(x)) continue;
                let ge = true, gt = false;
                for (const o of others) { const ux = u(i, outcome(prof(x, o))), uy = u(i, outcome(prof(y, o))); if (uy < ux) ge = false; if (uy > ux) gt = true; }
                if (ge && gt) { gone[i].push(x); break; }
              }
            }
            if (!gone.some((g) => g.length)) break;
            S = S.map((a, i) => a.filter((x) => !gone[i].includes(x)));
            out.push({ S: S.map((a) => a.slice()), gone });
          }
          return out;
        }
        const L = (x) => LET[x];
        const frames = () => rounds().map((R, k, all) => {
          let note;
          if (k === 0) note = 'Every voter may vote for any of the three candidates: 27 combinations.';
          else note = `Round ${k}: ` + R.gone.map((g, i) => (g.length ? `${i === 0 ? 'the chair' : `voter ${i + 1}`} drops ${g.map(L).join(', ')}` : null)).filter(Boolean).join('; ') + ' (weakly dominated).';
          if (k === all.length - 1) { const res = [...new Set(survivors(R.S).map(outcome))]; note += ` ${res.length === 1 ? `Only **${L(res[0])}** survives — the chair’s ${ord(pref[0].indexOf(res[0]))} choice.` : `Outcomes left: ${res.map(L).join(', ')}.`}`; }
          return { k, S: R.S, note };
        });
        const survivors = (S) => { const out = []; for (const a of S[0]) for (const b of S[1]) for (const c2 of S[2]) out.push([a, b, c2]); return out; };
        const S = v.steps({ frames, start: 'end', still: 'end', speed: 0.7, transition: 0.35, counter: 'round' });
        let cards = [];
        Vs.onClick((x, y) => { const X = Vs.X(x), Y = Vs.Y(y), i = cards.findIndex((cd) => Y >= cd[0] && Y <= cd[1]); if (i < 0) return; const k = R6.findIndex((r) => r.every((c, j) => c === pref[i][j])); pref[i] = R6[(k + 1) % 6].slice(); S.reset({ at: 'end' }); });
        const tabs = [0, 1, 2].map((t) => v.table(Ts, { rows: 3, cols: 3, region: [t / 3 + 0.012, 0.02, (t + 1) / 3 - 0.012, 0.86], maxCell: 64, size: 12,
          rowLabels: (i) => `${L(i)}`, colLabels: (j) => `${L(j)}` }));
        v.render(() => {
          const F = S.frame, Sv = F.S || [[0, 1, 2], [0, 1, 2], [0, 1, 2]], final = S.atEnd;
          // ---- voter cards
          const c = Vs.ctx, W = Vs.width, H = Vs.height, ch = (H - 16) / 3; cards = [];
          [0, 1, 2].forEach((i) => {
            const y0 = 8 + i * ch; cards.push([y0, y0 + ch - 6]);
            rr(c, 8, y0, W - 16, ch - 8, 10); c.fillStyle = v.color(i === 0 ? 'gold' : 'muted', i === 0 ? 0.12 : 0.05); c.fill(); c.strokeStyle = v.color(i === 0 ? 'gold' : 'faint'); c.lineWidth = 1.2; c.stroke();
            txt(v, c, i === 0 ? 'voter 1 — the chair (breaks ties)' : `voter ${i + 1}`, 20, y0 + 16, { size: 11.5, weight: 700, align: 'left', color: i === 0 ? 'gold' : 'ink' });
            pref[i].forEach((cand, j) => { chip(v, c, 30 + j * 30, y0 + 42, cand, { r: 11 }); if (j < 2) txt(v, c, '›', 45 + j * 30, y0 + 42, { size: 13, color: 'faint' }); });
            txt(v, c, 'votes', 132, y0 + 42, { size: 10.5, weight: 600, color: 'muted', align: 'left' });
            [0, 1, 2].forEach((x, j) => chip(v, c, 175 + j * 26, y0 + 42, x, { r: 9.5, alpha: Sv[i].includes(x) ? 1 : 0.22, strike: !Sv[i].includes(x) }));
          });
          // ---- tables
          const tc = Ts.ctx;
          tabs.forEach((T, t) => {
            const alive = Sv[0].includes(t);
            T.draw({
              value: () => '',
              fill: (i, j) => (alive && Sv[1].includes(i) && Sv[2].includes(j) ? ['green', 0.12] : ['muted', 0.07]),
              rowLabelColor: (i) => (Sv[1].includes(i) ? CC[i] : 'faint'), colLabelColor: (j) => (Sv[2].includes(j) ? CC[j] : 'faint'),
            });
            const g = T.geo;
            txt(v, tc, `chair votes ${L(t)}`, g.X0 + (g.cw * 3) / 2, g.Y0 - g.lh - 12, { size: 12, weight: 700, color: alive ? CC[t] : 'faint' });
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
              const [x, y] = T.cellCenter(i, j), on = alive && Sv[1].includes(i) && Sv[2].includes(j), w = outcome([t, i, j]);
              chip(v, tc, Ts.X(x), Ts.Y(y), w, { r: Math.min(12, g.cw * 0.28), alpha: on ? 1 : 0.2, ring: final && on ? 'gold' : null });
            }
          });
        });
        v.legend([['green', 'votes still in play', { area: true }], ['gold', 'surviving outcome', { dot: true }]]);
        v.readout(() => {
          const sincere = outcome(pref.map((p) => p[0])), R = rounds(), last = R[R.length - 1], res = [...new Set(survivors(last.S).map(outcome))];
          return `Sincere voting (everyone votes for their favourite): **${L(sincere)}** wins, the chair’s ${ord(pref[0].indexOf(sincere))} choice. Sophisticated voting (${R.length - 1} round${R.length === 2 ? '' : 's'} of eliminating weakly dominated votes): ${res.length === 1 ? `**${L(res[0])}** — the chair’s ${ord(pref[0].indexOf(res[0]))} choice` : `outcomes ${res.map(L).join(', ')} remain`}.` + (res.length === 1 && pref[0].indexOf(res[0]) === 2 ? ' The tie-breaking vote leaves the chair with her worst outcome.' : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Saari: Borda is the only consistent positional rule',
      statement: String.raw`For three candidates write every positional rule as $w_s = (1, s, 0)$, $0 \le s \le 1$ (polsci-1.10). Dropping a candidate leaves a two-candidate election, where every positional rule is majority rule. Call a profile a **total reversal** for $w_s$ if $w_s$ ranks $A \succ B \succ C$ while each pairwise majority says the opposite: $C$ beats $B$, $C$ beats $A$ and $B$ beats $A$.

**Theorem (Saari).** For every $s \ne \tfrac12$ total reversals exist. For the Borda count ($s = \tfrac12$) they do not: Borda never ranks the Condorcet winner last nor the Condorcet loser first, and whenever the pairwise majorities form a transitive order, Borda’s top and bottom agree with it. More generally (Saari 1989) Borda is the only positional rule whose rankings of the full set and of its subsets are tied together; for every other rule, any combination of rankings of the subsets can occur.`,
      idea: String.raw`Saari decomposes profiles into components. A *reversal pair* — two voters with opposite rankings such as $A \succ C \succ B$ and $B \succ C \succ A$ — ties every pairwise vote and gives the middle candidate $2s$ points against $1$ for each of the others. Borda ($2s = 1$) ignores it completely, but any other rule is pushed in one direction: for $s < \tfrac12$ reversal pairs hurt the candidate they put in the middle, for $s > \tfrac12$ they help it. Start from one voter $C \succ B \succ A$, who fixes the pairwise majorities, and add enough reversal pairs to drag the positional ranking to $A \succ B \succ C$: about $1/|1 - 2s|$ of them are needed, so the size of the smallest reversing electorate blows up at $s = \tfrac12$ and Borda is never reversed. That Borda cannot be reversed is the identity $B(x) = \sum_y N(x, y)$ (polsci-2.4): if $C$ beats both rivals, $B(C) > n > B(A)$.`,
      caption: String.raw`Slide $s$ or click the chart. The chart shows, for each $s$, the fewest voters in a total reversal, found by brute force over all profiles of up to 21 voters (solid steps), and the size of Saari’s construction (dashed), which grows without bound near $s = ½$. Below, the profile realising the reversal at the current $s$. Left: in the representation triangle the pairwise tallies beside the edges say C ≻ B ≻ A. Right: on the procedure line of the outcome triangle the gold dot at $s$ sits in the region A ≻ B ≻ C, while the Borda point B lies in C ≻ B ≻ A.`,
      deps: ['polsci-1.10', 'polsci-2.4'],
      see: ['polsci-3.3'],
      refs: ['Saari, Chaotic Elections!', 'Saari (1989), A dictionary for voting paradoxes', 'Saari, Basic Geometry of Voting (1995)'],
      tags: ['Borda count', 'scoring rules', 'Saari'],
      credit: 'Donald G. Saari, 1989–2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Positional_voting' },
      viz(v) {
        const Lc = v.stage({ x: [0, 1], y: [0, 46], axes: 'box', gutter: true, height: 250, full: true, xlabel: 'weight s of a second place', ylabel: 'voters needed', xticks: [[0, '0 plurality'], [0.25, '¼'], [0.5, '½ Borda'], [0.75, '¾'], [1, '1 veto']], title: 'smallest electorate in which the rule $w_s$ reverses every pairwise majority' });
        const Rp = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 320, title: 'the profile in Saari’s representation triangle' });
        const Ot = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 320, title: 'outcomes: the procedure line from plurality to anti-plurality' });
        const sS = v.slider('$s$', 0, 1, 0.2, { step: 0.0025 });
        const src = v.select('profile', [{ value: 'min', label: 'smallest found' }, { value: 'con', label: 'Saari’s construction' }], 'min');
        Lc.onClick((x) => sS.set(clamp(Math.round(x * 400) / 400, 0, 1)));
        const R6 = perms(3), G = 401, NMAX = 21;
        // ---- brute force: every anonymous profile of ≤ 21 voters with pairwise C ≻ B ≻ A; the s-interval where w_s gives A ≻ B ≻ C
        const nmin = new Array(G).fill(Infinity), ex = new Array(G).fill(null), cnt = [0, 0, 0, 0, 0, 0];
        const test = (n) => {
          const N = (x, y) => { let t = 0; for (let i = 0; i < 6; i++) if (R6[i].indexOf(x) < R6[i].indexOf(y)) t += cnt[i]; return t; };
          if (!(N(2, 1) > N(1, 2) && N(2, 0) > N(0, 2) && N(1, 0) > N(0, 1))) return;
          const f = [0, 0, 0], g = [0, 0, 0]; for (let i = 0; i < 6; i++) { f[R6[i][0]] += cnt[i]; g[R6[i][1]] += cnt[i]; }
          let lo = 0, hi = 1;
          for (const [a, b] of [[0, 1], [1, 2]]) { const p = f[a] - f[b], q = g[a] - g[b]; if (q === 0) { if (p <= 0) return; } else if (q > 0) lo = Math.max(lo, -p / q + 1e-12); else hi = Math.min(hi, -p / q - 1e-12); }
          if (lo > hi) return;
          for (let k = Math.ceil(lo * (G - 1)); k <= Math.floor(hi * (G - 1)); k++) if (n < nmin[k]) { nmin[k] = n; ex[k] = cnt.slice(); }
        };
        const rec = (k, left, n) => { if (k === 5) { cnt[5] = left; test(n); return; } for (let x = 0; x <= left; x++) { cnt[k] = x; rec(k + 1, left - x, n); } };
        for (let n = 1; n <= NMAX; n++) rec(0, n, n);
        /** Saari’s construction: one voter C ≻ B ≻ A plus reversal pairs (counts in perms(3) order ABC, ACB, BAC, BCA, CAB, CBA). */
        function cons(s) {
          if (Math.abs(s - 0.5) < 1e-9) return null;
          if (s < 0.5) { const y = Math.floor(s / (1 - 2 * s)) + 1, x = y + Math.floor((1 - s) / (1 - 2 * s)) + 1; return [y, x, 0, x, 0, 1 + y]; }
          const y = Math.floor((1 - s) / (2 * s - 1)) + 1, z = y + Math.floor(s / (2 * s - 1)) + 1; return [y, 0, z, 0, z, 1 + y];
        }
        const profile = () => { const s = sS.value, k = Math.round(s * (G - 1)); if (src.value === 'min' && ex[k]) return { c: ex[k], how: 'min' }; const c = cons(s); return c ? { c, how: 'con' } : null; };
        const scores = (c, s) => { const t = [0, 0, 0]; R6.forEach((r, i) => { t[r[0]] += c[i]; t[r[1]] += s * c[i]; }); return t; };
        const rankS = (t) => { const o = [0, 1, 2].sort((a, b) => t[b] - t[a] || a - b); let str = LET[o[0]]; for (let k = 1; k < 3; k++) str += (Math.abs(t[o[k]] - t[o[k - 1]]) < 1e-9 ? ' = ' : ' ≻ ') + LET[o[k]]; return str; };
        v.render(() => {
          const s = sS.value, YM = 46;
          // ---- chart
          Lc.vband(0.4975, 0.5025, { color: 'green', alpha: 0.25 });
          for (let k = 0; k < G; k++) {
            if (!isFinite(nmin[k])) continue;
            const x0 = (k - 0.5) / (G - 1), x1 = (k + 0.5) / (G - 1);
            Lc.line(Math.max(0, x0), nmin[k], Math.min(1, x1), nmin[k], { color: 'accent', width: 3 });
          }
          const pts = []; for (let k = 0; k < G; k++) { const ss = k / (G - 1), c = cons(ss); pts.push(c ? [ss, Math.min(sum(c), YM + 5)] : null); }
          Lc.clip(() => Lc.path(pts, { color: 'purple', width: 1.8, dash: [5, 4] }));
          Lc.text('Borda: never reversed', 0.5, YM * 0.9, { size: 11, weight: 700, color: 'green', align: 'center', dy: 0, plate: true });
          Lc.text(`brute force reaches only ${NMAX} voters`, 0.5, NMAX, { size: 10, weight: 600, color: 'muted', align: 'center', dy: -10 });
          Lc.line(0.36, NMAX, 0.64, NMAX, { color: 'faint', dash: [2, 3] });
          Lc.vline(s, { color: 'gold', width: 2 });
          const P = profile();
          if (P) Lc.dot(s, sum(P.c), { r: 5, color: 'gold' });
          // ---- representation triangle
          if (!P) { txt(v, Rp.ctx, 'At s = ½ (Borda) no profile reverses all three pairwise votes', Rp.width / 2, Rp.height / 2, { size: 12, weight: 600, color: 'green' }); txt(v, Ot.ctx, 'Borda: B(x) = Σ N(x, y) ties it to the majorities', Ot.width / 2, Ot.height / 2, { size: 12, weight: 600, color: 'green' }); return; }
          drawRepTriangle(v, Rp, P.c, [0, 4, Rp.width, Rp.height - 6]);
          // ---- outcome triangle, zoomed about its centre
          const c = Ot.ctx, W = Ot.width, H = Ot.height, D = Math.min(W, H - 24);
          const V0 = [[0, -0.577], [-0.5, 0.289], [0.5, 0.289]];
          const at0 = (q) => [q[0] * V0[0][0] + q[1] * V0[1][0] + q[2] * V0[2][0], q[0] * V0[0][1] + q[1] * V0[1][1] + q[2] * V0[2][1]];
          const q = (ss) => { const t = scores(P.c, ss), T = sum(t) || 1; return t.map((x) => x / T); };
          const dmax = Math.max(...[0, 0.5, 1, s].map((ss) => Math.hypot(...at0(q(ss)))), 0.01);
          const z = Math.max(1, Math.min(40, 0.3 / dmax)), sc0 = 0.86 * D, cx = W / 2, cy = 14 + (H - 28) / 2;
          const Z = (p) => [cx + p[0] * sc0 * z, cy + p[1] * sc0 * z];
          const mid0 = (a, b) => [(V0[a][0] + V0[b][0]) / 2, (V0[a][1] + V0[b][1]) / 2];
          const cur = rankS(scores(P.c, s)).replace(/ /g, '');
          c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
          R6.forEach((r) => {
            const p3 = [V0[r[0]], mid0(r[0], r[1]), [0, 0]].map(Z);
            c.beginPath(); c.moveTo(...p3[0]); c.lineTo(...p3[1]); c.lineTo(...p3[2]); c.closePath();
            const here = cur === rkStr(r, '≻'), rev = rkStr(r, '') === 'CBA';
            c.fillStyle = v.color(here ? 'gold' : rev ? 'green' : CC[r[0]], here ? 0.25 : rev ? 0.14 : 0.05); c.fill();
            const cen = [(V0[r[0]][0] + mid0(r[0], r[1])[0]) / 2, (V0[r[0]][1] + mid0(r[0], r[1])[1]) / 2], L0 = Math.hypot(...cen), R0 = 0.4 * D;
            const lp = [cx + (cen[0] / L0) * Math.min(R0, L0 * sc0 * z * 0.75), cy + (cen[1] / L0) * Math.min(R0, L0 * sc0 * z * 0.75)];
            txt(v, c, rkStr(r, '≻'), lp[0], lp[1], { size: 11, weight: 700, color: here ? 'ink' : 'muted', halo: true });
          });
          c.setLineDash([4, 4]); c.strokeStyle = v.color('faint'); c.lineWidth = 1.2;
          for (let k = 0; k < 3; k++) { const A = Z(V0[k]), M = Z(mid0((k + 1) % 3, (k + 2) % 3)); c.beginPath(); c.moveTo(...A); c.lineTo(...M); c.stroke(); }
          c.setLineDash([]);
          const a = Z(at0(q(0))), b = Z(at0(q(1)));
          linePx(v, c, a[0], a[1], b[0], b[1], 'ink', 3);
          [[0, 'P'], [0.5, 'B'], [1, 'AP']].forEach(([ss, lab]) => {
            const p2 = Z(at0(q(ss))); c.beginPath(); c.arc(p2[0], p2[1], 4.5, 0, 7); c.fillStyle = v.color(ss === 0.5 ? 'green' : 'panel'); c.fill(); c.strokeStyle = v.color('ink'); c.lineWidth = 1.5; c.stroke();
            txt(v, c, lab, p2[0] + 8, p2[1] - 10, { size: 11, weight: 800, align: 'left', halo: true, color: ss === 0.5 ? 'green' : 'ink' });
          });
          const pc = Z(at0(q(s))); c.beginPath(); c.arc(pc[0], pc[1], 6.5, 0, 7); c.fillStyle = v.color('gold'); c.fill(); c.strokeStyle = v.color('panel'); c.lineWidth = 2; c.stroke();
          c.restore();
          V0.forEach((p0, k) => { let p2 = Z(p0); if (!(p2[0] > 14 && p2[0] < W - 14 && p2[1] > 14 && p2[1] < H - 30)) { const d = Math.hypot(...p0); p2 = [cx + (p0[0] / d) * 0.45 * D, cy + (p0[1] / d) * 0.45 * D]; } chip(v, c, p2[0], p2[1], k, { r: 10 }); });
          txt(v, c, `zoom ×${z.toFixed(0)} about the centre`, W - 8, H - 10, { size: 10, weight: 600, color: 'muted', align: 'right', halo: true });
        });
        v.legend([['accent', 'smallest reversal (brute force, ≤ 21 voters)'], ['purple', 'Saari’s construction', { dash: true }], ['gold', 'current s and its ranking region', { dot: true }], ['green', 'Borda point and the pairwise order C ≻ B ≻ A', { area: true }]]);
        v.readout(() => {
          const s = sS.value, P = profile();
          if (!P) return `At $s = ½$ (Borda) a total reversal is impossible: if $C$ beats both rivals, $B(C) = N(C,A) + N(C,B) > n > B(A)$. Every other $s$ admits one.`;
          const t = scores(P.c, s), n = sum(P.c), bo = scores(P.c, 0.5);
          const parts = R6.map((r, i) => (P.c[i] ? `${P.c[i]} ${rkStr(r, '')}` : null)).filter(Boolean).join(', ');
          return `At $s = ${s.toFixed(3)}$: ${n} voters (${parts}) — ${P.how === 'min' ? 'the smallest such electorate found' : 'one voter CBA plus reversal pairs'}. The rule $w_s$ scores ${[0, 1, 2].map((x) => `${LET[x]} ${+t[x].toFixed(3)}`).join(', ')}: **${rankS(t)}**. Pairwise: C beats B, C beats A, B beats A — **every pair reversed**. Borda on the same ballots: ${rankS(bo)}, in line with the majorities.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Paradox',
      name: 'The Ostrogorski and Anscombe paradoxes',
      statement: String.raw`Suppose each voter takes a position on several issues and the outcome is decided either by issues or by parties.

**Ostrogorski’s paradox.** If every voter votes for the party that agrees with her on a majority of the issues, a party can win the election although a majority of voters oppose its position on *every* issue. With five voters and three issues: voters 1, 2, 3 agree with party $X$ on two issues each (a different pair each), and voters 4, 5 agree with $Y$ on all three. $X$ wins $3$–$2$, yet each issue goes to $Y$ by $3$–$2$.

**Anscombe’s paradox.** If each issue is decided by its own majority, a majority of voters can be on the losing side of a majority of the issues. In the same table the issue-by-issue outcome is $Y, Y, Y$, and voters 1, 2, 3 — three of five — each lose two of the three issues.`,
      idea: String.raw`Both paradoxes come from aggregating in two directions — across voters and across issues — in a different order. Majority-of-majorities is not the majority of the whole table: three voters can each give $X$ a narrow 2–1 lead on their own ballots while each issue’s $X$ supporters are a different minority. The cells of the table are what count, and a $5 \times 3$ table with $7$ $X$-cells out of $15$ can still elect $X$. Ostrogorski (1902) used it against party government: a party platform can win without any of its planks having majority support. Anscombe (1976) saw that the same table indicts issue-by-issue majority voting from the other side. Both are relatives of Condorcet’s paradox (polsci-2.1): pairwise sound majorities need not add up.`,
      caption: String.raw`Click any cell of the table to flip a voter’s position on an issue. The last column is the party each voter supports (the one she agrees with on most issues) and the bottom row each issue’s majority. Right: the votes in each contest, one icon per voter. In *Ostrogorski* mode the party vote is compared with the issue votes; in *Anscombe* mode the column on the right counts the issues each voter loses. Change the numbers of voters and issues, draw a random table, or let the page search for a paradox; the readout gives how often random tables of this size show it.`,
      deps: ['polsci-2.1'],
      see: ['polsci-2.12'],
      refs: ['T&P ch. 7', 'Ostrogorski, Democracy and the Organization of Political Parties (1902)', 'Anscombe (1976), On frustration of the majority by fulfilment of the majority’s will'],
      tags: ['compound majorities', 'Ostrogorski paradox', 'Anscombe paradox'],
      credit: 'Moisei Ostrogorski, 1902 (formalised by Rae & Daudt, 1976); G. E. M. Anscombe, 1976',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ostrogorski_paradox' },
      viz(v) {
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 340, title: 'voters × issues · click a cell to flip it' });
        const Sb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 380, weight: 1.15, title: 'the votes, one icon per voter' });
        const mode = v.select('paradox', [{ value: 'ost', label: 'Ostrogorski' }, { value: 'ans', label: 'Anscombe' }], 'ost');
        const nS = v.slider('voters', 3, 11, 5, { step: 2, int: true, onChange: () => resize() });
        const kS = v.select('issues', [{ value: 3, label: '3' }, { value: 5, label: '5' }], 3, { onChange: () => resize() });
        const CLASSIC = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 1], [1, 1, 1]];
        let X = CLASSIC.map((r) => r.slice()), seed = 5, msg = '';
        const T = v.table(Tb, { rows: 6, cols: 5, maxCell: 50, size: 14, square: false, cellAspect: 1.1 });
        function resize() { const n = nS.value, k = +kS.value, r = v.rng(seed++); X = range(n).map((i) => range(k).map((j) => (X[i] && X[i][j] != null ? X[i][j] : r() < 0.5 ? 1 : 0))); msg = ''; }
        const ana = (Xt) => {
          const n = Xt.length, k = Xt[0].length, party = Xt.map((row) => (sum(row) > k / 2 ? 1 : 0)), issue = range(k).map((j) => (sum(Xt.map((row) => row[j])) > n / 2 ? 1 : 0));
          const pw = sum(party) > n / 2 ? 1 : 0, iw = sum(issue) > k / 2 ? 1 : 0, lost = Xt.map((row) => sum(row.map((x, j) => (x !== issue[j] ? 1 : 0))));
          const losers = lost.filter((l) => l > k / 2).length;
          return { n, k, party, issue, pw, iw, lost, losers, ost: pw !== iw, strong: issue.every((x) => x !== pw), ans: losers > n / 2 };
        };
        const isPara = (A) => (mode.value === 'ost' ? A.ost : A.ans);
        const randomTable = (r, n, k) => range(n).map(() => range(k).map(() => (r() < 0.5 ? 1 : 0)));
        v.button('Random table', () => { const r = v.rng(seed++); X = randomTable(r, nS.value, +kS.value); msg = ''; });
        v.button('Find a paradox', () => { for (let t = 1; t < 20000; t++) { const r = v.rng(seed++), Y = randomTable(r, nS.value, +kS.value); if (isPara(ana(Y))) { X = Y; msg = `found after ${t} random tables`; return; } } msg = 'none found'; });
        v.button('Classic 5 × 3', () => { nS.set(5); kS.set(3); X = CLASSIC.map((r) => r.slice()); msg = ''; });
        const freq = new Map();
        const freqOf = (n, k, md) => { const key = `${n}|${k}|${md}`; if (!freq.has(key)) { const r = v.rng(99); let h = 0; const N = 4000; for (let t = 0; t < N; t++) { const A = ana(randomTable(r, n, k)); if (md === 'ost' ? A.ost : A.ans) h++; } freq.set(key, h / N); } return freq.get(key); };
        Tb.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.j >= 0 && h.i < X.length && h.j < X[0].length) { X[h.i][h.j] = 1 - X[h.i][h.j]; msg = ''; } });
        const icons = range(6).map(() => v.icons(Sb, { order: 'group', maxCell: 34, tween: 400 }));
        const yes = () => mode.value === 'ans';
        const lab = (x) => (yes() ? (x ? 'yes' : 'no') : x ? 'Y' : 'X');
        const col = (x) => (x ? 'orange' : 'blue');
        v.render(() => {
          const A = ana(X), n = A.n, k = A.k, ost = mode.value === 'ost';
          T.set({ rows: n + 1, cols: k + 1 });
          T.draw({
            value: (i, j) => (i < n ? (j < k ? lab(X[i][j]) : ost ? lab(A.party[i]) : `${A.lost[i]} lost`) : j < k ? lab(A.issue[j]) : ost ? `${lab(A.pw)} wins` : `${A.losers} of ${n}`),
            textColor: (i, j) => (i < n && j === k && !ost ? (A.lost[i] > k / 2 ? 'red' : 'muted') : (i < n ? (j < k ? X[i][j] : A.party[i]) : j < k ? A.issue[j] : A.pw) ? 'orange' : 'blue'),
            weight: (i, j) => (i === n || j === k ? 800 : 600),
            fill: (i, j) => {
              if (i < n && j < k) return [col(X[i][j]), 0.16];
              if (i === n && j < k) return ost && A.issue[j] !== A.pw ? ['red', 0.14] : [col(A.issue[j]), 0.3];
              if (i < n && j === k) return ost ? [col(A.party[i]), 0.3] : A.lost[i] > k / 2 ? ['red', 0.14] : null;
              return [isPara(A) ? 'red' : 'green', 0.18];
            },
            rowLabels: (i) => (i < n ? `voter ${i + 1}` : 'majority'),
            colLabels: (j) => (j < k ? `issue ${j + 1}` : ost ? 'party' : 'issues lost'),
            highlight: isPara(A) ? [[n, k, 'red']] : [],
          });
          // ---- icon scoreboards: the party vote (or the losers) and each issue
          const contests = [{ title: ost ? 'party vote' : 'voters losing most issues', a: ost ? n - sum(A.party) : n - A.losers, b: ost ? sum(A.party) : A.losers, la: ost ? 'X' : 'win most', lb: ost ? 'Y' : 'lose most', cb: ost ? 'orange' : 'red', ca: ost ? 'blue' : 'green' }]
            .concat(range(k).map((j) => { const y = sum(X.map((row) => row[j])); return { title: `issue ${j + 1}`, a: n - y, b: y, la: lab(0), lb: lab(1), ca: 'blue', cb: 'orange' }; }));
          const W = Sb.width, H = Sb.height, cols = contests.length <= 4 ? 2 : 3, rowsN = Math.ceil(contests.length / cols), cw = 1 / cols, rh = 1 / rowsN, c = Sb.ctx;
          icons.forEach((I, q) => {
            const C = contests[q];
            if (!C) { I.set({ n: 0, groups: [] }); return; }
            const cx = (q % cols) * cw, cy = 1 - Math.floor(q / cols) * rh;
            I.set({ n: C.a + C.b, groups: [{ n: C.a, color: C.ca, label: C.la }, { n: C.b, color: C.cb, label: C.lb }], region: [cx + 0.02, cy - rh + 0.04, cx + cw - 0.02, cy - 0.16 * rh] });
            I.draw();
            const X0 = Sb.X(cx + cw / 2), Y0 = Sb.Y(cy) + 13;
            txt(v, c, C.title, X0, Y0, { size: 11, weight: 700, color: q === 0 ? 'ink' : 'muted' });
            const w = C.b > C.a;
            txt(v, c, `${C.la} ${C.a} – ${C.b} ${C.lb}`, X0, Y0 + 15, { size: 11, weight: 800, color: w ? C.cb : C.ca });
          });
        });
        v.legend([['blue', 'party X / no', { area: true }], ['orange', 'party Y / yes', { area: true }], ['red', 'the paradox', { area: true }]]);
        v.readout(() => {
          const A = ana(X), n = A.n, k = A.k, f = freqOf(n, k, mode.value);
          let s;
          if (mode.value === 'ost') {
            s = `Party vote: ${n - sum(A.party)} for X, ${sum(A.party)} for Y → **${A.pw ? 'Y' : 'X'}** wins. Issue majorities: ${A.issue.map((x) => (x ? 'Y' : 'X')).join(', ')} → ${A.iw ? 'Y' : 'X'} wins most issues. `;
            s += A.strong ? `**Ostrogorski’s paradox (strong form):** the winning party loses every single issue.` : A.ost ? '**Ostrogorski’s paradox:** the winning party loses most issues.' : 'No paradox here.';
          } else {
            s = `Issue-by-issue majority: ${A.issue.map((x) => (x ? 'yes' : 'no')).join(', ')}. Issues lost per voter: ${A.lost.join(', ')}. `;
            s += A.ans ? `**Anscombe’s paradox:** ${A.losers} of ${n} voters — a majority — are on the losing side of most issues.` : `${A.losers} of ${n} voters lose most issues: no paradox.`;
          }
          return s + ` Among random ${n} × ${k} tables (each cell X or Y with probability ½), ${(100 * f).toFixed(1)}% show this paradox.` + (msg ? ` (${msg}.)` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Paradox',
      name: 'The doctrinal paradox (discursive dilemma)',
      statement: String.raw`A court of three judges must decide whether a defendant is liable for breach of contract. By doctrine, liability ($C$) holds exactly when there was a valid contract ($P$) **and** it was breached ($Q$): $C \leftrightarrow P \wedge Q$. Judge 1 accepts $P$ and $Q$, judge 2 accepts $P$ but not $Q$, judge 3 accepts $Q$ but not $P$; each applies the doctrine consistently, so only judge 1 finds liability.

- **Premise-based** procedure: majorities accept $P$ (2–1) and $Q$ (2–1), so the court finds the defendant **liable**.
- **Conclusion-based** procedure: a majority (2–1) rejects $C$, so the court finds the defendant **not liable**.

Proposition-wise majority voting on $\{P, Q, C\}$ accepts $P$ and $Q$ but rejects $C$ — a collectively *inconsistent* set of judgments, although every judge is consistent. The same happens with a disjunctive doctrine $C \leftrightarrow P \vee Q$ and with any number of judges.`,
      idea: String.raw`Majorities on different propositions are formed by different coalitions: $\{1, 2\}$ carry $P$, $\{1, 3\}$ carry $Q$, but the only judge who accepts both is judge 1. It is Condorcet’s paradox (polsci-2.1) for logically connected propositions instead of rankings: each majority is fine, their combination is not. Kornhauser and Sager posed it for courts; Pettit generalised it to the *discursive dilemma* for any group that must give reasons, and List and Pettit proved that no aggregation rule can be universal, anonymous, systematic and always produce consistent judgments (polsci-3.12, the judgment-aggregation analogue of Arrow). With independent judges who accept each premise with probability $q$, the two procedures disagree with a probability that can be computed exactly, and the chart shows it.`,
      caption: String.raw`Click a judge’s $P$ or $Q$ cell to change their view. Each judge’s conclusion follows from the doctrine, and the bottom rows give the two procedures’ verdicts: red when they disagree. Switch between the conjunctive and disjunctive doctrine, or add judges. The chart gives the exact probability that the procedures disagree when every judge accepts each premise independently with probability $q$, for several court sizes; the current court is highlighted and the dot is at the chosen $q$.`,
      deps: ['polsci-2.1'],
      see: ['polsci-2.11', 'polsci-3.12'],
      refs: ['T&P ch. 7', 'Kornhauser & Sager (1986), Unpacking the court', 'List & Pettit (2002), Aggregating sets of judgments'],
      tags: ['judgment aggregation', 'doctrinal paradox', 'discursive dilemma'],
      credit: 'Kornhauser & Sager, 1986 and 1993; Pettit, 2001; List & Pettit, 2002',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Discursive_dilemma' },
      viz(v) {
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 340, title: 'judges × propositions · click a premise to flip it' });
        const Ch = v.stage({ x: [0, 1], y: [0, 0.5], axes: 'box', gutter: true, height: 330, minWidth: 340, xlabel: 'q = chance a judge accepts each premise', ylabel: 'P(procedures disagree)', title: 'how often the two procedures disagree (exact)' });
        const rule = v.select('doctrine', [{ value: 'and', label: 'C = P and Q' }, { value: 'or', label: 'C = P or Q' }], 'and');
        const nS = v.slider('judges', 3, 15, 3, { step: 2, int: true, onChange: () => resize() });
        const qS = v.slider('q', 0, 1, 0.6, { step: 0.01 });
        let J = [[1, 1], [1, 0], [0, 1]], seed = 4;
        function resize() { const r = v.rng(seed++), n = nS.value; J = range(n).map((i) => J[i] ? J[i] : [r() < 0.6 ? 1 : 0, r() < 0.6 ? 1 : 0]); }
        v.button('Random court', () => { const r = v.rng(seed++), q = qS.value; J = range(nS.value).map(() => [r() < q ? 1 : 0, r() < q ? 1 : 0]); });
        const concl = (p, q) => (rule.value === 'and' ? p && q : p || q) ? 1 : 0;
        const ana = () => {
          const n = J.length, mP = sum(J.map((j) => j[0])) > n / 2 ? 1 : 0, mQ = sum(J.map((j) => j[1])) > n / 2 ? 1 : 0, cs = J.map((j) => concl(j[0], j[1]));
          const mC = sum(cs) > n / 2 ? 1 : 0, prem = concl(mP, mQ);
          return { n, mP, mQ, cs, mC, prem, clash: mC !== prem, nP: sum(J.map((j) => j[0])), nQ: sum(J.map((j) => j[1])), nC: sum(cs) };
        };
        const T = v.table(Tb, { rows: 5, cols: 3, maxCell: 54, size: 14, square: false, cellAspect: 1.5 });
        Tb.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.i < J.length && h.j >= 0 && h.j < 2) J[h.i][h.j] = 1 - J[h.i][h.j]; });
        // ---- exact disagreement probability: judges are of four types (P,Q) ∈ {11, 10, 01, 00}
        const lf = range(40).map((k) => v.M.lgamma(k + 1));
        function pDis(n, q, md) {
          const p = [q * q, q * (1 - q), (1 - q) * q, (1 - q) * (1 - q)];
          let tot = 0;
          for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) for (let c = 0; a + b + c <= n; c++) {
            const d = n - a - b - c, P = a + b > n / 2, Q = a + c > n / 2;
            const prem = md === 'and' ? P && Q : P || Q, con = md === 'and' ? a > n / 2 : n - d > n / 2;
            if (prem === con) continue;
            const lw = lf[n] - lf[a] - lf[b] - lf[c] - lf[d], pr = (k, x) => (k ? k * Math.log(x) : 0);
            if (p.some((x, i) => x === 0 && [a, b, c, d][i] > 0)) continue;
            tot += Math.exp(lw + pr(a, p[0]) + pr(b, p[1]) + pr(c, p[2]) + pr(d, p[3]));
          }
          return tot;
        }
        const NS = [3, 5, 9, 15], cache = new Map();
        const curve = (n, md) => { const k = `${n}|${md}`; if (!cache.has(k)) cache.set(k, range(101).map((i) => [i / 100, pDis(n, i / 100, md)])); return cache.get(k); };
        v.render(() => {
          const A = ana(), n = A.n, yn = (x) => (x ? 'yes' : 'no'), ycol = (x) => (x ? 'green' : 'red');
          T.set({ rows: n + 2, cols: 3 });
          T.draw({
            value: (i, j) => {
              if (i < n) return yn(j === 0 ? J[i][0] : j === 1 ? J[i][1] : A.cs[i]);
              if (i === n) return `${yn([A.mP, A.mQ, A.mC][j])} ${[A.nP, A.nQ, A.nC][j]}–${n - [A.nP, A.nQ, A.nC][j]}`;
              return j < 2 ? yn([A.mP, A.mQ][j]) : `${yn(A.prem)}`;
            },
            textColor: (i, j) => ycol(i < n ? (j === 0 ? J[i][0] : j === 1 ? J[i][1] : A.cs[i]) : i === n ? [A.mP, A.mQ, A.mC][j] : j < 2 ? [A.mP, A.mQ][j] : A.prem),
            fill: (i, j) => (i < n ? (j === 2 ? ['muted', 0.1] : null) : j === 2 ? [A.clash ? 'red' : 'green', 0.2] : ['accent', 0.08]),
            weight: (i, j) => (i >= n ? 800 : 600),
            rowLabels: (i) => (i < n ? `judge ${i + 1}` : i === n ? 'majority' : 'premise-based'),
            colLabels: ['P contract', 'Q breach', rule.value === 'and' ? 'C = P∧Q' : 'C = P∨Q'],
            highlight: A.clash ? [[n, 2, 'red'], [n + 1, 2, 'red']] : [],
          });
          // ---- chart
          const ymx = Math.max(...NS.concat([n]).map((m) => Math.max(...curve(m, rule.value).map((p) => p[1])))) * 1.15;
          Ch.setView([0, 1], [0, Math.max(0.2, ymx)]);
          NS.forEach((m) => { const cur = m === n; Ch.path(curve(m, rule.value), { color: cur ? 'accent' : 'muted', width: cur ? 3 : 1.4, alpha: cur ? 1 : 0.7 }); });
          if (!NS.includes(n)) Ch.path(curve(n, rule.value), { color: 'accent', width: 3 });
          NS.forEach((m) => { const cv = curve(m, rule.value), top = cv.reduce((a, b) => (b[1] > a[1] ? b : a)); Ch.text(`${m} judges`, top[0], top[1], { dy: -10, size: 10, weight: 700, align: 'center', color: m === n ? 'accent' : 'muted' }); });
          const pc = pDis(n, qS.value, rule.value);
          Ch.vline(qS.value, { color: 'gold', width: 1.5, dash: [4, 3] });
          Ch.dot(qS.value, pc, { r: 6, color: 'gold' });
        });
        v.legend([['accent', 'this court’s size'], ['muted', '3, 5, 9 and 15 judges'], ['gold', 'chosen q', { dot: true }]]);
        v.readout(() => {
          const A = ana(), n = A.n, yn = (x) => (x ? 'liable' : 'not liable'), pc = pDis(n, qS.value, rule.value);
          let s = `Premise-based: P ${A.nP}–${n - A.nP}, Q ${A.nQ}–${n - A.nQ} → **${yn(A.prem)}**. Conclusion-based: C ${A.nC}–${n - A.nC} → **${yn(A.mC)}**. `;
          s += A.clash ? `**The procedures disagree**: majorities accept ${A.mP ? 'P' : '¬P'}, ${A.mQ ? 'Q' : '¬Q'} and ${A.mC ? 'C' : '¬C'}, an inconsistent set under the doctrine, though every judge is consistent. ` : 'They agree here. ';
          return s + `With ${n} independent judges accepting each premise with probability ${qS.value.toFixed(2)}, they disagree with probability ${(100 * pc).toFixed(1)}%.`;
        });
      },
    },
  ],
};
