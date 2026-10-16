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
            if (good) txt(v, c, 'the chair picks this', ox + cw - 14, 22, { size: 10.5, weight: 700, color: 'gold', align: 'right' });
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
  ],
};
