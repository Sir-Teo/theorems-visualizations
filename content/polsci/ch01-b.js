// Political Science & Social Choice — Chapter 1: Voting methods (part b: agendas, approval, grades, scoring rules, Kemeny, the finale)
import {
  CC, LET, sum, range, clamp, perms, mkProfile, copyProfile, setProfile, total, rkStr, best, worst, names,
  tops, pairwise, positional, borda, runoff, condorcet, agendaRun, kendall, kemenyScore, approvalTops, rankFrom,
  rr, txt, chip, winTag, blocEditor, drawMatrix, counts3,
} from './ch01.shared.js';

// ---------- local helpers
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
function hlinePx(v, c, x0, x1, Y, col, dash, w = 1.3) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, Math.round(Y) + 0.5); c.lineTo(x1, Math.round(Y) + 0.5); c.stroke(); c.restore();
}
function linePx(v, c, x0, y0, x1, y1, col, w = 1.5, dash = null, alpha = 1) {
  c.save(); c.strokeStyle = v.color(col, alpha); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
/** Winner of IRV only (no bookkeeping) — fast enough to run per pixel. */
function irvWin(P) {
  let alive = range(P.m);
  for (;;) {
    const cnt = tops(P, alive), cont = sum(alive.map((c) => cnt[c]));
    let lead = alive[0]; for (const c of alive) if (cnt[c] > cnt[lead]) lead = c;
    if (alive.length === 1 || cnt[lead] > cont / 2) return [lead];
    const lo = worst(cnt, alive); alive = alive.filter((c) => c !== lo[lo.length - 1]);
  }
}
/** Ranking of the candidates by score, ties shown with '='. */
function rankingStr(sc, C) {
  const ord = C.slice().sort((a, b) => sc[b] - sc[a] || a - b);
  let s = LET[ord[0]];
  for (let k = 1; k < ord.length; k++) s += (Math.abs(sc[ord[k]] - sc[ord[k - 1]]) < 1e-9 ? '=' : '>') + LET[ord[k]];
  return s;
}

// majority judgment: grades 0..5
const GRADES = ['Reject', 'Poor', 'Acceptable', 'Good', 'Very good', 'Excellent'];
const GSHORT = ['Rej', 'Poor', 'Acc', 'Good', 'VG', 'Exc'];
const gradeRGB = (v, g) => v.diverge([-0.95, -0.72, -0.5, 0.5, 0.72, 0.95][g], 'red', 'green');
/** Majority value: the sequence of majority grades (lower median) obtained by removing them one at a time. */
function mjValue(list) {
  const L = list.slice().sort((a, b) => b - a), seq = [];
  while (L.length) { const k = Math.floor(L.length / 2); seq.push(L[k]); L.splice(k, 1); }
  return seq;
}
const lexCmp = (a, b) => { for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] !== b[k]) return a[k] - b[k]; return 0; };

export default {
  collection: 'polsci',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Sequential pairwise voting with an agenda',
      statement: String.raw`An **agenda** is an ordering $(a_1, a_2, \dots, a_m)$ of the candidates. Under **sequential pairwise voting** (amendment procedure) $a_1$ and $a_2$ meet in a majority vote, the winner meets $a_3$, and so on; the survivor of the last vote wins. Assume voters vote sincerely and no two candidates tie head to head. Then:

(a) a Condorcet winner, if there is one, wins under every agenda;

(b) a candidate wins under some agenda if and only if it belongs to the top cycle (Smith set), so with a majority cycle the agenda decides the outcome;

(c) the procedure can elect a candidate whom every voter ranks below some other candidate — it violates the Pareto condition.`,
      idea: String.raw`(a) The Condorcet winner beats whoever holds the floor when it enters and every later challenger. (b) Once a member of the top cycle is voted on, the survivor stays in the top cycle, since its members beat everyone outside; conversely a top-cycle member $x$ beats at least one candidate who can win an agenda of the others (otherwise those candidates would form a smaller dominant set), so put $x$ last. Entering late is an advantage: the last candidate needs to beat only one survivor. Whoever sets the agenda can therefore choose among the top cycle (polsci-2.8, and McKelvey’s chaos theorem polsci-4.6). (c) In Taylor’s example the agenda A, B, C, D eliminates B, whom everyone prefers to D, in the first vote and ends with D. Voters who look ahead and vote strategically, by backward induction over the voting tree, change the outcomes. That is a game (game-1.7).`,
      caption: String.raw`Click any of the 24 agendas in the grid, or step through the votes of the chosen one: the bracket shows each head-to-head vote and its tally. With Taylor’s three blocs every candidate wins under some agenda (the grid is coloured by winner), and the agenda A, B, C, D elects D although every voter ranks B above D. With *a Condorcet winner* the whole grid turns one colour. Drag bars or click letters to edit the electorate.`,
      deps: ['polsci-1.6'],
      see: ['polsci-2.8', 'game-1.7'],
      refs: ['T&P ch. 1', 'Shepsle: agenda power'],
      tags: ['agenda', 'pairwise majority'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Amendment_procedure' },
      viz(v) {
        const Br = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, minWidth: 360, title: 'the chosen agenda, one vote at a time' });
        const Ag = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, minWidth: 380, title: 'all 24 agendas, coloured by the winner — click one' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 180, full: true, title: 'ballots' });
        const PRE = {
          taylor: mkProfile(4, [[7, 'ABDC'], [6, 'CABD'], [5, 'BDCA']]),
          cyc: mkProfile(4, [[5, 'ABCD'], [4, 'BCAD'], [3, 'CABD']]),
          cw: mkProfile(4, [[9, 'ABDC'], [8, 'ACBD'], [7, 'BCDA'], [7, 'CBDA'], [5, 'DBAC']]),
        };
        const P = copyProfile(PRE.taylor), AG = perms(4);
        let agenda = [0, 1, 2, 3], grid = null;
        v.select('electorate', [{ value: 'taylor', label: 'everyone can win (Taylor)' }, { value: 'cyc', label: 'a three-way cycle' }, { value: 'cw', label: 'a Condorcet winner' }], 'taylor', { onChange: (val) => { setProfile(P, PRE[val]); S.reset({ at: 'end' }); } });
        const ed = blocEditor(v, E, P, { max: 12, rank: true, rowMax: 36, onEdit: () => S.reset({ at: 'end' }) });
        const frames = () => {
          const N = pairwise(P), run = agendaRun(N, agenda), L = (c) => LET[c];
          return range(agenda.length).map((k) => {
            if (k === 0) return { k, note: `Agenda ${agenda.map(L).join(', ')}: ${L(agenda[0])} meets ${L(agenda[1])} first, and the survivor meets each later candidate in turn.` };
            const mt = run.matches[k - 1], los = mt.w === mt.inc ? mt.ch : mt.inc;
            return { k, note: `Vote ${k}: ${L(mt.inc)} against ${L(mt.ch)} — ${L(mt.w)} wins ${Math.max(mt.a, mt.b)}–${Math.min(mt.a, mt.b)} and ${L(los)} is out.` + (k === agenda.length - 1 ? ` **${L(run.win)}** wins this agenda.` : '') };
          });
        };
        const S = v.steps({ frames, transition: 0.45, start: 'end', still: 'end', counter: 'vote' });
        Ag.onClick((x, y) => { if (!grid) return; const k = grid.hit(Ag.X(x), Ag.Y(y)); if (k >= 0) { agenda = AG[k].slice(); S.reset({ at: 0 }); S.play(); } });
        const pareto = (w) => range(P.m).filter((y) => y !== w && P.blocs.every((b) => !b.n || b.r.indexOf(y) < b.r.indexOf(w)));
        v.render(() => {
          ed.draw();
          const N = pairwise(P), run = agendaRun(N, agenda), k = S.frame.k ?? agenda.length - 1, tw = S.tween;
          // ---- bracket
          const c = Br.ctx, W = Br.width, H = Br.height, m = agenda.length;
          const yb = H - 34, ytop = 52, xs = range(m).map((i) => 46 + (i * (W - 110)) / (m - 1));
          const lev = (l) => yb - (l * (yb - ytop)) / (m - 1);
          let px = xs[0], py = yb;
          const nodes = [];
          for (let l = 1; l < m; l++) { const nx = (px + xs[l]) / 2 + 14, ny = lev(l); nodes.push({ x: nx, y: ny, fromX: px, fromY: py, inX: xs[l] }); px = nx; py = ny; }
          nodes.forEach((nd, l) => {
            const done = l < k, now = l === k - 1, a = done ? (now ? tw : 1) : 0.25;
            const col = done ? 'ink' : 'faint';
            linePx(v, c, nd.fromX, nd.fromY - 12, nd.fromX, nd.y, col, 1.6, done ? null : [3, 3], done ? 0.55 + 0.45 * a : 1);
            linePx(v, c, nd.fromX, nd.y, nd.x, nd.y, col, 1.6, done ? null : [3, 3], done ? 0.55 + 0.45 * a : 1);
            linePx(v, c, nd.inX, yb - 12, nd.inX, nd.y, col, 1.6, done ? null : [3, 3], done ? 0.55 + 0.45 * a : 1);
            linePx(v, c, nd.inX, nd.y, nd.x, nd.y, col, 1.6, done ? null : [3, 3], done ? 0.55 + 0.45 * a : 1);
            if (done) {
              const mt = run.matches[l];
              chip(v, c, nd.x, nd.y, mt.w, { r: 11 + (now ? 2 * (1 - tw) : 0), alpha: a, ring: l === m - 2 && a > 0.99 ? 'gold' : null });
              txt(v, c, `${Math.max(mt.a, mt.b)}–${Math.min(mt.a, mt.b)}`, nd.x + 16, nd.y - 15, { size: 11, weight: 700, color: 'muted', alpha: a, halo: true, align: 'left' });
            } else { c.beginPath(); c.arc(nd.x, nd.y, 5, 0, 2 * Math.PI); c.fillStyle = v.color('faint'); c.fill(); }
          });
          agenda.forEach((cand, i) => {
            const elim = run.matches.some((mt, l) => l < k && (mt.w === mt.inc ? mt.ch : mt.inc) === cand);
            chip(v, c, xs[i], yb, cand, { r: 12, alpha: elim ? 0.35 : 1 });
            txt(v, c, i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`, xs[i], yb + 21, { size: 10, weight: 600, color: 'muted' });
          });
          if (k === m - 1) winTag(v, c, nodes[m - 2].x, nodes[m - 2].y - 40, `${LET[run.win]} wins`);
          // ---- grid of all agendas
          const g = Ag.ctx, GW = Ag.width, GH = Ag.height, cols = 3, rows = 8, top = 34;
          const tw2 = (GW - 12) / cols, th = (GH - top - 6) / rows;
          const wins = AG.map((ag) => agendaRun(N, ag).win), cnt = range(4).map((x) => wins.filter((w) => w === x).length);
          range(4).forEach((x, i) => {
            const X = 16 + i * ((GW - 20) / 4);
            chip(v, g, X + 8, 16, x, { r: 8 });
            txt(v, g, `wins ${cnt[x]}`, X + 21, 16, { size: 11, weight: 700, color: cnt[x] ? 'ink' : 'faint', align: 'left' });
          });
          AG.forEach((ag, idx) => {
            const ci = Math.floor(idx / rows), ri = idx % rows, X = 6 + ci * tw2, Y = top + ri * th, w = wins[idx];
            rr(g, X + 2, Y + 2, tw2 - 4, th - 4, 6); g.fillStyle = v.color(CC[w], 0.13); g.fill();
            const sel = ag.every((a, j) => a === agenda[j]);
            if (sel) { g.strokeStyle = v.color('accent'); g.lineWidth = 2.4; g.stroke(); }
            const r = Math.min(7.5, th * 0.27), step = r * 2 + 3;
            ag.forEach((cand, j) => chip(v, g, X + 10 + r + j * step, Y + th / 2, cand, { r }));
            txt(v, g, '→', X + 10 + 4 * step + 6, Y + th / 2, { size: 12, color: 'muted' });
            chip(v, g, X + 10 + 4 * step + 20 + r, Y + th / 2, w, { r: r + 1.5, ring: sel ? 'gold' : null });
          });
          grid = { hit: (hx, hy) => { const ci = Math.floor((hx - 6) / tw2), ri = Math.floor((hy - top) / th); return ci >= 0 && ci < cols && ri >= 0 && ri < rows ? ci * rows + ri : -1; } };
        });
        v.readout(() => {
          const N = pairwise(P), C = condorcet(P, N), run = agendaRun(N, agenda), dom = pareto(run.win);
          const winners = [...new Set(AG.map((ag) => agendaRun(N, ag).win))].sort();
          let s = `Agenda ${agenda.map((c) => LET[c]).join(', ')} elects **${LET[run.win]}**. Over all 24 agendas the possible winners are {${winners.map((x) => LET[x]).join(', ')}}`;
          s += C.winner >= 0 ? ` — only the Condorcet winner ${LET[C.winner]}.` : ` = the top cycle {${C.smith.map((x) => LET[x]).join(', ')}}.`;
          if (dom.length) s += ` **Pareto violation:** every voter ranks ${dom.map((x) => LET[x]).join(' and ')} above ${LET[run.win]}.`;
          return s;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Approval voting',
      statement: String.raw`Under **approval voting** each voter marks any set of candidates she approves of, and the candidate approved by the most voters wins. A *sincere* approval ballot approves every candidate the voter likes better than every candidate she leaves out, so with rankings it approves a top segment: the voter’s top $k$ for some $k$ of her choosing. Plurality is the special case in which everyone approves exactly one candidate, and anti-plurality (veto) the case in which everyone approves all but one.

The outcome therefore depends not only on the voters’ rankings but on where each voter draws the line, and different sincere thresholds on the same rankings can elect different candidates.`,
      idea: String.raw`Approval reads more than plurality — a whole approved set — but less than a ranking: inside the approved set, and outside it, the voter’s preferences are invisible. Voters who split candidates into exactly two indifference classes have a single sincere ballot, and for them approval is strategy-proof (polsci-3.9). Everyone else must choose a threshold, which makes approval a game against the other voters’ thresholds. Approving your second choice can cost your favourite the election, and polls guide where the line is drawn. The method was named by Robert J. Weber in 1971 and analysed by Brams and Fishburn (1978). The Mathematical Association of America and the American Statistical Association adopted it in the 1980s, and Fargo, North Dakota (2018) and St. Louis (2020) adopted it for city elections.`,
      caption: String.raw`Each row is a group of voters: the candidates sit at the group’s utility for them (0–10), and the group approves everyone right of its threshold line (filled letters). Drag the four thresholds. The totals on the right are counted group by group. The coloured strip under each row shows who would win if that group’s line moved there, with the other lines fixed — so you can see how much each group can swing.`,
      deps: ['polsci-1.1'],
      see: ['polsci-3.9'],
      refs: ['T&P ch. 1', 'Brams & Fishburn, Approval Voting (1983)'],
      tags: ['approval voting', 'voting methods'],
      credit: 'Robert J. Weber (name, 1971); Steven Brams & Peter Fishburn, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Approval_voting' },
      viz(v) {
        const U = v.stage({ x: [-3.7, 10.9], y: [-0.12, 4.6], axes: false, height: 310, minWidth: 420, weight: 1.35, title: 'each group approves the candidates right of its line' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, minWidth: 300, title: 'approval totals' });
        const GR = [{ n: 9, u: [10, 7, 2.6, 0.4] }, { n: 7, u: [4.2, 10, 8, 1] }, { n: 6, u: [0.4, 8.4, 10, 5.4] }, { n: 4, u: [1, 3, 6.3, 10] }];
        const ys = [3.95, 2.85, 1.75, 0.65];
        const th = GR.map((g, i) => U.handle([6, 7, 7, 5][i], ys[i], { color: 'accent', r: 7.5, constrain: (x) => [clamp(x, -0.3, 10.3), ys[i]] }));
        const approves = (i, t = th[i].x) => range(4).filter((c) => GR[i].u[c] >= t);
        const tally = (ts) => { const s = Array(4).fill(0); GR.forEach((g, i) => approves(i, ts[i]).forEach((c) => { s[c] += g.n; })); return s; };
        const winOf = (ts) => best(tally(ts), range(4));
        const DUR = 1.8;
        v.animate((t) => {
          const c = U.ctx, ts = th.map((h) => h.x);
          GR.forEach((g, i) => {
            const y = ys[i], Yp = U.Y(y);
            U.rect(Math.max(0, ts[i]), y - 0.3, 10, y + 0.3, { fill: 'green', fillAlpha: 0.09, stroke: false });
            U.line(0, y, 10, y, { color: 'muted', width: 1.2 });
            // winner strip as this group's threshold varies
            const bps = [-0.3, ...g.u.slice().sort((a, b) => a - b), 10.3];
            for (let k = 0; k + 1 < bps.length; k++) {
              const a = Math.max(0, bps[k]), b = Math.min(10, bps[k + 1]); if (b <= a) continue;
              const tt = ts.slice(); tt[i] = (bps[k] + bps[k + 1]) / 2;
              const w = winOf(tt);
              U.rect(a, y - 0.47, b, y - 0.39, { fill: w.length === 1 ? CC[w[0]] : 'faint', fillAlpha: 0.75, stroke: false });
            }
            U.line(ts[i], y - 0.36, ts[i], y + 0.36, { color: 'accent', width: 1.6, dash: [4, 3] });
            const ap = new Set(approves(i));
            g.u.forEach((uu, cand) => chip(v, c, U.X(uu), Yp, cand, { r: 9.5, hollow: !ap.has(cand) }));
            U.text(`group ${i + 1}`, -3.5, y + 0.14, { size: 11.5, weight: 700, color: 'ink' });
            U.text(`${g.n} voters`, -3.5, y - 0.16, { size: 10.5, weight: 600, color: 'muted' });
          });
          [0, 5, 10].forEach((x) => U.text(String(x), x, 0.02, { size: 10, color: 'muted', align: 'center' }));
          U.text('utility', -0.6, 0.02, { size: 10, color: 'muted', align: 'right' });
          // ---- tallies, counted group by group
          const g2 = T.ctx, W = T.width, H = T.height, sc = tally(ts), win = best(sc, range(4)), n = sum(GR.map((g) => g.n));
          const p = t >= DUR ? GR.length : (t / DUR) * GR.length;
          const ymax = Math.max(n * 0.6, ...sc) * 1.12, x0 = 34, x1 = W - 10, y0 = 40, y1 = H - 36, cw = (x1 - x0) / 4, bw = Math.min(cw * 0.58, 46);
          const Y = (val) => y1 - (val / ymax) * (y1 - y0);
          for (let yv = 0; yv <= ymax; yv += 5) { hlinePx(v, g2, x0 - 4, x1, Y(yv), 'grid', null, 1); txt(v, g2, String(yv), x0 - 8, Y(yv), { size: 9.5, color: 'muted', align: 'right', weight: 500 }); }
          range(4).forEach((cand) => {
            const X = x0 + (cand + 0.5) * cw; let acc = 0;
            GR.forEach((g, i) => {
              const u = clamp(p - i, 0, 1); if (u <= 0 || !approves(i).includes(cand)) return;
              const h = g.n * u; g2.fillStyle = v.color(CC[cand], i % 2 ? 0.45 : 0.78); g2.fillRect(X - bw / 2, Y(acc + h), bw, Y(acc) - Y(acc + h));
              g2.strokeStyle = v.color('panel'); g2.lineWidth = 1.2; g2.strokeRect(X - bw / 2, Y(acc + h), bw, Y(acc) - Y(acc + h));
              if (Y(acc) - Y(acc + h) > 13 && u >= 1) txt(v, g2, `g${i + 1}`, X, (Y(acc) + Y(acc + h)) / 2, { size: 9.5, weight: 700, color: 'panel' });
              acc += h;
            });
            const done = p >= GR.length;
            txt(v, g2, String(Math.round(acc)), X, Y(acc) - 9, { size: 12.5, weight: 700, halo: true });
            chip(v, g2, X, y1 + 16, cand, { r: 10, ring: done && win.length === 1 && win[0] === cand ? 'gold' : null });
            if (done && win.length === 1 && win[0] === cand) winTag(v, g2, X, Y(acc) - 27);
          });
          hlinePx(v, g2, x0 - 4, x1, y1, 'muted', null, 1);
        }, { period: DUR + 0.4, once: true, still: DUR + 0.4 });
        v.readout(() => {
          const ts = th.map((h) => h.x), sc = tally(ts), win = best(sc, range(4));
          const plu = winOf(GR.map((g) => Math.max(...g.u))), anti = winOf(GR.map((g) => g.u.slice().sort((a, b) => a - b)[1]));
          return `Approval totals ${range(4).map((c) => `${LET[c]} ${sc[c]}`).join(', ')} → **${names(win)}**. Ballots: ${GR.map((g, i) => `{${approves(i).map((c) => LET[c]).join(', ') || '∅'}}`).join(', ')}. With the same rankings, approving only favourites (plurality) elects ${names(plu)}; approving all but the last choice (anti-plurality) elects ${names(anti)}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Method',
      name: 'Score voting and majority judgment',
      statement: String.raw`In grading methods each voter assigns every candidate a grade from a common ordered scale — here the six grades Reject < Poor < Acceptable < Good < Very good < Excellent, coded $0, \dots, 5$.

(a) **Score (range) voting** elects the candidate with the highest mean grade.

(b) **Majority judgment** (Balinski–Laraki) elects the candidate with the highest *majority grade*: the median grade, taking the lower middle grade when the number of voters is even, so that a majority awards at least that grade. Ties are broken by the *majority value*, the sequence of majority grades obtained by removing one majority grade at a time, compared lexicographically.

On the same ballots the two can elect different candidates: a mean rewards intensity — a few Excellents offset many Poors — while a median cannot be moved by voters on one side exaggerating.`,
      idea: String.raw`Grades carry more than rankings: they say how good each candidate is, not just in which order, and candidates are judged separately, so adding or removing a candidate cannot change another’s grade (no spoilers). The mean and the median aggregate those grades differently. A mean can be pulled by extreme grades, so a polarizing candidate with many top grades and many low ones can beat a candidate everyone finds Good, and a strategic voter gains by exaggerating to the ends of the scale. The median is the grade a majority stands behind. A voter above it can only push it up by moving below it, and the reverse, so majority judgment resists that exaggeration — Balinski and Laraki call it “strategy-proof in grading”. The scale must mean the same to every voter, the usual objection to both methods.`,
      caption: String.raw`The table on the left holds each group’s grades: click a cell to raise a grade (shift-click lowers it); click a voter count to add a voter (shift-click removes one). On the right each candidate’s *merit profile* lays out all the grades from best to worst. The grade under the dashed 50% line is the majority grade, and the mean is printed beside it. In the starting electorate A has the highest mean, from nine Excellents, but its majority grade is only Poor, so score voting and majority judgment disagree.`,
      deps: ['polsci-1.8'],
      refs: ['T&P ch. 7', 'Balinski & Laraki, Majority Judgment (2011)'],
      tags: ['majority judgment', 'score voting', 'grading'],
      credit: 'Majority judgment: Michel Balinski & Rida Laraki, 2007',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Majority_judgment' },
      viz(v) {
        const Gt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 330, title: 'grades given by each group (click to change)' });
        const Mp = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 420, weight: 1.3, title: 'merit profiles: every grade, best to worst' });
        const GR = [{ n: 5, g: [5, 3, 2] }, { n: 4, g: [5, 2, 4] }, { n: 6, g: [1, 3, 0] }, { n: 5, g: [1, 2, 3] }];
        const m = 3;
        let geo = null;
        Gt.onClick((x, y, mod) => {
          if (!geo) return; const px = Gt.X(x), py = Gt.Y(y), i = Math.floor((py - geo.y0) / geo.rh), j = Math.floor((px - geo.x0) / geo.cw) - 1;
          if (i < 0 || i >= GR.length || j < -1 || j >= m) return;
          const d = mod.shift ? -1 : 1;
          if (j === -1) GR[i].n = clamp(GR[i].n + d, 0, 12);
          else GR[i].g[j] = (GR[i].g[j] + d + 6) % 6;
        });
        const lists = () => range(m).map((c) => GR.flatMap((g) => Array(g.n).fill(g.g[c])));
        const stats = () => {
          const L = lists(), n = sum(GR.map((g) => g.n));
          const mean = L.map((l) => (l.length ? sum(l) / l.length : 0)), mv = L.map(mjValue);
          const meanWin = best(mean, range(m));
          let mj = [0]; for (let c = 1; c < m; c++) { const k = lexCmp(mv[c], mv[mj[0]]); if (k > 0) mj = [c]; else if (k === 0) mj.push(c); }
          return { L, n, mean, mv, meanWin, mj };
        };
        v.render(() => {
          // ---- grade table
          const c = Gt.ctx, W = Gt.width, H = Gt.height, rows = GR.length;
          const x0 = 14 + 62, cw = Math.min(62, (W - x0 - 10) / (m + 1)), rh = Math.min(48, (H - 70) / rows), y0 = 44;
          geo = { x0, cw, rh, y0 };
          txt(v, c, 'voters', x0 + cw / 2, y0 - 14, { size: 10.5, weight: 700, color: 'muted' });
          range(m).forEach((j) => chip(v, c, x0 + (j + 1.5) * cw, y0 - 14, j, { r: 10 }));
          GR.forEach((g, i) => {
            const Y = y0 + i * rh;
            txt(v, c, `group ${i + 1}`, 14, Y + rh / 2, { size: 11, weight: 600, color: 'muted', align: 'left' });
            rr(c, x0 + 3, Y + 3, cw - 6, rh - 6, 6); c.fillStyle = v.color('muted', 0.08); c.fill();
            txt(v, c, String(g.n), x0 + cw / 2, Y + rh / 2, { size: 14, weight: 700 });
            g.g.forEach((gr, j) => {
              const X = x0 + (j + 1) * cw; rr(c, X + 3, Y + 3, cw - 6, rh - 6, 6); c.fillStyle = `rgb(${gradeRGB(v, gr).join(',')})`; c.fill();
              txt(v, c, String(gr), X + cw / 2, Y + rh / 2 - 6, { size: 14, weight: 700 });
              txt(v, c, GSHORT[gr], X + cw / 2, Y + rh / 2 + 10, { size: 9.5, weight: 600, color: 'ink', alpha: 0.75 });
            });
          });
          txt(v, c, 'click: +1 · shift-click: −1', 14, H - 14, { size: 10.5, weight: 500, color: 'muted', align: 'left' });
          // ---- merit profiles
          const st = stats(), g2 = Mp.ctx, MW = Mp.width, MH = Mp.height;
          const bx0 = 40, bx1 = MW - 128, bh = Math.min(34, (MH - 84) / m - 18), gap = (MH - 74 - m * bh) / m;
          range(m).forEach((cand) => {
            const Y = 30 + cand * (bh + gap) + gap / 2, L = st.L[cand].slice().sort((a, b) => b - a), n = L.length || 1;
            chip(v, g2, 20, Y + bh / 2, cand, { r: 11 });
            let x = bx0;
            for (let gr = 5; gr >= 0; gr--) {
              const k = L.filter((q) => q === gr).length; if (!k) continue;
              const w = (k / n) * (bx1 - bx0);
              g2.fillStyle = `rgb(${gradeRGB(v, gr).join(',')})`; g2.fillRect(x, Y, w, bh);
              g2.strokeStyle = v.color('panel'); g2.lineWidth = 1.5; g2.strokeRect(x, Y, w, bh);
              if (w > 22) txt(v, g2, String(k), x + w / 2, Y + bh / 2, { size: 10.5, weight: 700, color: 'ink', alpha: 0.85 });
              x += w;
            }
            const med = st.mv[cand][0], mjW = st.mj.length === 1 && st.mj[0] === cand, mnW = st.meanWin.length === 1 && st.meanWin[0] === cand;
            txt(v, g2, 'majority grade', bx1 + 10, Y + bh / 2 - 15, { size: 9.5, weight: 600, align: 'left', color: 'muted' });
            txt(v, g2, (GRADES[med] ?? '—') + (mjW ? '  ★ MJ' : ''), bx1 + 10, Y + bh / 2, { size: 12, weight: 800, align: 'left', color: mjW ? 'gold' : 'ink' });
            txt(v, g2, `mean ${st.mean[cand].toFixed(2)}` + (mnW ? '  ★ score' : ''), bx1 + 10, Y + bh / 2 + 15, { size: 10.5, weight: mnW ? 800 : 600, align: 'left', color: mnW ? 'blue' : 'muted' });
          });
          const xm = (bx0 + bx1) / 2;
          linePx(v, g2, xm, 20, xm, MH - 46, 'ink', 1.6, [5, 4]);
          txt(v, g2, '50%', xm, 11, { size: 10.5, weight: 700, color: 'muted' });
          // grade key
          const kw = Math.min(64, (MW - 20) / 6), kx0 = (MW - 6 * kw) / 2;
          range(6).forEach((q) => {
            const gr = 5 - q, X = kx0 + q * kw;
            g2.fillStyle = `rgb(${gradeRGB(v, gr).join(',')})`; g2.fillRect(X + 2, MH - 32, kw - 4, 10);
            txt(v, g2, GRADES[gr], X + kw / 2, MH - 12, { size: 9.5, weight: 600, color: 'muted' });
          });
        });
        v.readout(() => {
          const st = stats();
          const mvs = (c) => st.mv[c].slice(0, 4).map((g) => GSHORT[g]).join(', ');
          return `Score voting (highest mean): **${names(st.meanWin)}** (${range(m).map((c) => `${LET[c]} ${st.mean[c].toFixed(2)}`).join(', ')}). Majority judgment (highest majority grade): **${names(st.mj)}** (${range(m).map((c) => `${LET[c]} ${GRADES[st.mv[c][0]] ?? '—'}`).join(', ')}).` +
            (st.meanWin.join() === st.mj.join() ? ' Here they agree.' : ' **They disagree.**') + ` Majority values (first four terms): ${range(m).map((c) => `${LET[c]}: ${mvs(c)}`).join('; ')}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'Positional scoring rules',
      statement: String.raw`A **positional scoring rule** for $m$ candidates is given by a scoring vector $w = (w_1, w_2, \dots, w_m)$ with $w_1 \ge w_2 \ge \dots \ge w_m$ and $w_1 > w_m$: a candidate in position $k$ on a ballot receives $w_k$ points, and the highest total wins. Plurality is $(1, 0, \dots, 0)$, the Borda count $(m-1, m-2, \dots, 0)$, anti-plurality (veto) $(1, \dots, 1, 0)$, and “vote for $k$” gives a point to each of the top $k$. Replacing $w$ by $a w + b$ ($a > 0$) gives the same rule, so for three candidates every positional rule is
$$w_s = (1, s, 0), \qquad 0 \le s \le 1,$$
with $s = 0$ plurality, $s = \tfrac12$ Borda and $s = 1$ anti-plurality. A candidate’s score $t_1(x) + s\,t_2(x)$ ($t_k$ = number of $k$-th places) is linear in $s$, and the normalized tallies move along a straight segment, the *procedure line*, in the triangle of outcomes.`,
      idea: String.raw`Because each score is a straight line in $s$, the ranking can change only where two lines cross, and each pair crosses at most once. So as $s$ runs from 0 to 1 a three-candidate profile passes through at most four strict rankings and three tied ones — seven outcomes in all. Saari showed that all seven can occur for a single profile. In the triangle of outcomes the three tie lines $x = y$ cut the triangle into the six ranking regions, and the procedure line, from the plurality point through Borda (two thirds of the way along) to the anti-plurality point, can cross all three. The choice of weights, not the voters, then decides the winner. Saari’s further theorem (polsci-2.10) singles out Borda as the only positional rule whose rankings stay consistent when candidates are dropped.`,
      caption: String.raw`Slide $s$, the weight of a second place. Left: each candidate’s score $t_1 + s\,t_2$ is a straight line; the thick upper envelope is the winner, and the strip along the top shows who wins for every $s$. Right: Saari’s triangle of outcomes, magnified about its centre. The dashed tie lines split it into six ranking regions, and the segment from the plurality point P through Borda B to anti-plurality AP is the procedure line, with the gold dot at the current $s$. The starting profile crosses all three tie lines: plurality, Borda and anti-plurality elect three different candidates. Edit the profile below.`,
      deps: ['polsci-1.5', 'polsci-1.2'],
      see: ['polsci-2.10'],
      refs: ['Saari, Chaotic Elections!', 'Saari, Basic Geometry of Voting (1995)'],
      tags: ['scoring rules', 'Borda count', 'plurality'],
      credit: 'Donald G. Saari, 1980s–1990s (geometry of positional rules)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Positional_voting' },
      viz(v) {
        const L = v.stage({ x: [-0.13, 1.13], y: [0, 22], axes: 'box', height: 300, minWidth: 380, weight: 1.1, title: 'scores $t_1 + s\\,t_2$ as the weight $s$ of a second place moves', xticks: [[0, 's = 0 plurality'], [0.5, '½ Borda'], [1, '1 anti-plurality']] });
        const Tr = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 330, title: 'Saari’s triangle of outcomes and the procedure line' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true, title: 'the profile' });
        const R6 = perms(3);
        const P = { m: 3, blocs: R6.map((r, k) => ({ n: [4, 5, 1, 6, 1, 3][k], r: r.slice() })) };
        const ed = blocEditor(v, E, P, { max: 12, rowMax: 28 });
        const sS = v.slider('$s$', 0, 1, 0.25, { step: 0.01 });
        const ft = () => { const f = Array(3).fill(0), g = Array(3).fill(0); P.blocs.forEach((b) => { f[b.r[0]] += b.n; g[b.r[1]] += b.n; }); return { f, g }; };
        const crossings = () => {
          const { f, g } = ft(), out = [];
          for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) if (g[a] !== g[b]) { const s = (f[b] - f[a]) / (g[a] - g[b]); if (s > 1e-9 && s < 1 - 1e-9) out.push({ s, a, b }); }
          return out.sort((p, q) => p.s - q.s);
        };
        const scoreAt = (s) => { const { f, g } = ft(); return range(3).map((x) => f[x] + s * g[x]); };
        const outcomes = () => {
          const cs = crossings().map((x) => x.s), pts = [0, ...cs, 1], seq = [];
          const push = (s) => { const r = rankingStr(scoreAt(s), [0, 1, 2]); if (!seq.length || seq[seq.length - 1].r !== r) seq.push({ s, r }); };
          for (let k = 0; k + 1 < pts.length; k++) { push(pts[k]); push((pts[k] + pts[k + 1]) / 2); }
          push(1); return seq;
        };
        v.render(() => {
          ed.draw();
          const { f, g } = ft(), n = total(P), s = sS.value, cs = crossings();
          const ymax = Math.max(...range(3).map((x) => Math.max(f[x], f[x] + g[x]))) * 1.28 + 1;
          L.setView([-0.13, 1.13], [0, ymax]);
          // winner strip (top) and envelope
          const pts = [0, ...cs.map((x) => x.s), 1];
          for (let k = 0; k + 1 < pts.length; k++) {
            const mid = (pts[k] + pts[k + 1]) / 2, w = best(scoreAt(mid), [0, 1, 2]);
            L.rect(pts[k], ymax * 0.925, pts[k + 1], ymax * 0.975, { fill: CC[w[0]], fillAlpha: 0.8, stroke: false });
          }
          L.text('winner', -0.12, ymax * 0.95, { size: 10, weight: 600, color: 'muted' });
          range(3).forEach((x) => L.line(0, f[x], 1, f[x] + g[x], { color: CC[x], width: 1.4, alpha: 0.55 }));
          for (let k = 0; k + 1 < pts.length; k++) {
            const mid = (pts[k] + pts[k + 1]) / 2, w = best(scoreAt(mid), [0, 1, 2])[0];
            L.line(pts[k], f[w] + pts[k] * g[w], pts[k + 1], f[w] + pts[k + 1] * g[w], { color: CC[w], width: 4 });
          }
          for (const x of cs) { const y = f[x.a] + x.s * g[x.a]; L.dot(x.s, y, { r: 3.5, color: 'ink' }); L.text(`s = ${x.s.toFixed(2)}`, x.s, y, { dy: -12, size: 10, align: 'center', color: 'muted', weight: 600 }); }
          L.vline(s, { color: 'gold', width: 2 });
          const ends = range(3).map((x) => ({ x, Y: L.Y(f[x] + g[x]), Y0: L.Y(f[x]) })).sort((p, q) => p.Y - q.Y);
          for (let k = 1; k < 3; k++) if (ends[k].Y - ends[k - 1].Y < 19) ends[k].Y = ends[k - 1].Y + 19;
          const st = range(3).map((x) => ({ x, Y: L.Y(f[x]) })).sort((p, q) => p.Y - q.Y);
          for (let k = 1; k < 3; k++) if (st[k].Y - st[k - 1].Y < 19) st[k].Y = st[k - 1].Y + 19;
          ends.forEach((e) => chip(v, L.ctx, L.X(1) + 14, e.Y, e.x, { r: 8 }));
          st.forEach((e) => chip(v, L.ctx, L.X(0) - 14, e.Y, e.x, { r: 8 }));
          range(3).forEach((x) => L.dot(s, f[x] + s * g[x], { r: 5, color: CC[x] }));
          // ---- triangle of outcomes, zoomed about its centre (all tallies equal)
          const c = Tr.ctx, W = Tr.width, H = Tr.height, D = Math.min(W, H - 24);
          const side0 = 1, V0 = [[0, -0.577], [-0.5, 0.289], [0.5, 0.289]];
          const at0 = (q) => [q[0] * V0[0][0] + q[1] * V0[1][0] + q[2] * V0[2][0], q[0] * V0[0][1] + q[1] * V0[1][1] + q[2] * V0[2][1]];
          const q = (ss) => { const sc = scoreAt(ss), T = sum(sc) || 1; return sc.map((x) => x / T); };
          const pa = at0(q(0)), pb = at0(q(1)), dmax = Math.max(Math.hypot(...pa), Math.hypot(...pb), 0.02);
          const ZS = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16], zRaw = 0.36 / (0.86 * dmax * side0);
          const z = ZS.filter((zz) => zz <= Math.max(1, Math.min(zRaw, 16))).pop() || 1;
          const sc0 = 0.86 * D, cx = W / 2, cy = 12 + (H - 24) / 2;
          const Z = (p) => [cx + p[0] * sc0 * z, cy + p[1] * sc0 * z];
          const mid0 = (a, b) => [(V0[a][0] + V0[b][0]) / 2, (V0[a][1] + V0[b][1]) / 2];
          const curR = rankingStr(scoreAt(s), [0, 1, 2]), R0 = 0.42 * D;
          c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
          R6.forEach((r) => {
            const pts3 = [V0[r[0]], mid0(r[0], r[1]), [0, 0]].map(Z);
            c.beginPath(); c.moveTo(...pts3[0]); c.lineTo(...pts3[1]); c.lineTo(...pts3[2]); c.closePath();
            const here = curR === rkStr(r);
            c.fillStyle = v.color(CC[r[0]], here ? 0.26 : 0.07); c.fill();
            const cen = [(V0[r[0]][0] + mid0(r[0], r[1])[0]) / 2, (V0[r[0]][1] + mid0(r[0], r[1])[1]) / 2], L0 = Math.hypot(...cen);
            const lp = [cx + (cen[0] / L0) * Math.min(R0, L0 * sc0 * z * 0.75), cy + (cen[1] / L0) * Math.min(R0, L0 * sc0 * z * 0.75)];
            txt(v, c, rkStr(r), lp[0], lp[1], { size: 10.5, weight: 700, color: here ? 'ink' : 'muted', halo: true });
          });
          c.setLineDash([4, 4]); c.strokeStyle = v.color('faint'); c.lineWidth = 1.2;
          for (let k = 0; k < 3; k++) { const A = Z(V0[k]), M = Z(mid0((k + 1) % 3, (k + 2) % 3)); c.beginPath(); c.moveTo(...A); c.lineTo(...M); c.stroke(); }
          c.setLineDash([]); c.strokeStyle = v.color('muted'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(...Z(V0[0])); c.lineTo(...Z(V0[1])); c.lineTo(...Z(V0[2])); c.closePath(); c.stroke();
          for (let k = 0; k + 1 < pts.length; k++) {
            const a2 = Z(at0(q(pts[k]))), b2 = Z(at0(q(pts[k + 1]))), w = best(scoreAt((pts[k] + pts[k + 1]) / 2), [0, 1, 2])[0];
            linePx(v, c, a2[0], a2[1], b2[0], b2[1], CC[w], 4);
          }
          for (const x of cs) { const p2 = Z(at0(q(x.s))); c.beginPath(); c.arc(p2[0], p2[1], 3.5, 0, 2 * Math.PI); c.fillStyle = v.color('ink'); c.fill(); }
          [[0, 'P'], [0.5, 'B'], [1, 'AP']].forEach(([ss, lab]) => {
            const p2 = Z(at0(q(ss))); c.beginPath(); c.arc(p2[0], p2[1], 4.5, 0, 2 * Math.PI); c.fillStyle = v.color('panel'); c.fill(); c.strokeStyle = v.color('ink'); c.lineWidth = 1.6; c.stroke();
            txt(v, c, lab, p2[0] + 9, p2[1] - 9, { size: 11, weight: 800, align: 'left', halo: true });
          });
          const pc = Z(at0(q(s))); c.beginPath(); c.arc(pc[0], pc[1], 6.5, 0, 2 * Math.PI); c.fillStyle = v.color('gold'); c.fill(); c.strokeStyle = v.color('panel'); c.lineWidth = 2; c.stroke();
          c.restore();
          // candidate directions: chips at the vertices, or at the edge of the view towards them
          V0.forEach((p0, k) => {
            let p2 = Z(p0); const inside = p2[0] > 14 && p2[0] < W - 14 && p2[1] > 14 && p2[1] < H - 30;
            if (!inside) { const d = Math.hypot(...p0); p2 = [cx + (p0[0] / d) * 0.46 * D, cy + (p0[1] / d) * 0.46 * D]; }
            chip(v, c, p2[0], p2[1], k, { r: 10 });
          });
          txt(v, c, z > 1 ? `zoom ×${z} about the centre, where all tallies are equal` : 'the whole triangle', W - 8, H - 12, { size: 10, weight: 600, color: 'muted', align: 'right', halo: true });
        });
        v.readout(() => {
          const s = sS.value, sc = scoreAt(s), w = best(sc, [0, 1, 2]), seq = outcomes();
          const strict = seq.filter((o) => !o.r.includes('=')).length, tied = seq.length - strict;
          const wAt = (ss) => names(best(scoreAt(ss), [0, 1, 2]));
          return `At $s = ${s.toFixed(2)}$: ${range(3).map((x) => `${LET[x]} ${+sc[x].toFixed(2)}`).join(', ')} → **${names(w)}**. Plurality elects ${wAt(0)}, Borda ${wAt(0.5)}, anti-plurality ${wAt(1)}. Along the procedure line: ${seq.map((o) => o.r).join(' → ')} — ${seq.length} outcome${seq.length > 1 ? 's' : ''} (${strict} strict, ${tied} tied; at most 7 are possible).`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Method',
      name: 'Kemeny’s rule',
      statement: String.raw`The **Kendall tau distance** $d(R, R')$ between two rankings is the number of pairs of candidates they order differently (the number of adjacent swaps needed to turn one into the other). The **Kemeny score** of a candidate social ranking $R$ is its total distance to the ballots,
$$K(R) = \sum_{i=1}^n d(R, \succ_i) = \sum_{x \text{ above } y \text{ in } R} N(y, x),$$
and **Kemeny’s rule** selects the ranking(s) with the smallest score — a median of the ballots — and elects its top candidate. Since each pair costs at least $\min(N(x,y), N(y,x))$, $K(R) \ge \sum_{\{x,y\}} \min(N(x,y), N(y,x))$, with equality exactly when $R$ agrees with every pairwise majority; so when the majority relation is transitive it *is* the Kemeny ranking, and Kemeny’s rule is a Condorcet method.`,
      idea: String.raw`Write each voter’s disagreement with $R$ pair by pair: a pair $\{x, y\}$ placed $x$ above $y$ costs the $N(y, x)$ voters who think otherwise. Summing over pairs gives the formula, so the Kemeny score depends only on the pairwise matrix. When the majorities form a cycle, every ranking must overrule some majority, and Kemeny’s rule overrules the cheapest set of them. There are $m!$ rankings to check (comb-1.5), and finding the Kemeny ranking is NP-hard in general (Bartholdi, Tovey and Trick, 1989), so brute force works only for a handful of candidates. Young showed that Kemeny’s rule is the maximum-likelihood estimate of a “true” ranking that voters perceive with independent errors (polsci-3.11), which is what Condorcet was groping for.`,
      caption: String.raw`The bar chart scores every possible social ranking, found by brute force: the bars appear one at a time as the permutations are checked. The green bar is the Kemeny ranking and the dashed line the lower bound $\sum \min$. Click any bar: in the matrix the orange cells are the voters that ranking overrules, and they add up to its bar. With a majority cycle the bound cannot be met, and the Kemeny ranking pays the smallest excess. Switch between 3 and 4 candidates, or edit the ballots.`,
      deps: ['polsci-1.6', 'comb-1.5'],
      see: ['polsci-3.11', 'comb-2.5', 'ml-17.2b'],
      refs: ['T&P ch. 7', 'Kemeny, Mathematics without numbers (1959)'],
      tags: ['Kemeny', 'Kendall tau', 'median ranking'],
      credit: 'John G. Kemeny, 1959; characterised by Young & Levenglick, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kemeny%E2%80%93Young_method' },
      viz(v) {
        const Bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true, title: 'Kemeny score of every possible social ranking (brute force over all permutations)' });
        const Ms = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, minWidth: 300, title: 'pairwise tallies · orange: overruled' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, minWidth: 420, weight: 1.3, title: 'ballots' });
        const PRE = { 3: mkProfile(3, [[5, 'ABC'], [4, 'BCA'], [3, 'CAB'], [1, 'ACB']]), 4: mkProfile(4, [[9, 'ACDB'], [4, 'BDAC'], [3, 'BCDA'], [7, 'CBAD'], [2, 'DBAC']]) };
        const P = copyProfile(PRE[4]);
        let sel = null, geo = null;
        const mS = v.select('candidates', [{ value: 3, label: '3 (6 rankings)' }, { value: 4, label: '4 (24 rankings)' }], 4, { onChange: (val) => { setProfile(P, PRE[val]); sel = null; v.restart(); v.play(); } });
        const ed = blocEditor(v, E, P, { max: 12, rank: true, rowMax: 34, onEdit: () => { sel = null; } });
        Bs.onClick((x) => { if (!geo) return; const k = Math.floor((Bs.X(x) - geo.x0) / geo.bw); if (k >= 0 && k < geo.n) sel = k; });
        const model = () => {
          const N = pairwise(P), R = perms(P.m), K = R.map((r) => kemenyScore(N, r)), mn = Math.min(...K);
          let lb = 0; for (let i = 0; i < P.m; i++) for (let j = i + 1; j < P.m; j++) lb += Math.min(N[i][j], N[j][i]);
          return { N, R, K, mn, lb, opt: K.map((k, i) => (k === mn ? i : -1)).filter((i) => i >= 0) };
        };
        const DUR = () => (P.m === 3 ? 2.2 : 4.4);
        v.animate((t) => {
          ed.draw();
          const M = model(), c = Bs.ctx, W = Bs.width, H = Bs.height, n = M.R.length;
          const shown = t >= DUR() ? n : Math.floor((t / DUR()) * n) + 1, done = shown >= n;
          const x0 = 44, x1 = W - 10, y0 = 18, y1 = H - 40, bw = (x1 - x0) / n, ymax = Math.max(...M.K) * 1.1;
          geo = { x0, bw, n };
          const Y = (val) => y1 - (val / ymax) * (y1 - y0);
          const step = ymax > 120 ? 40 : ymax > 50 ? 20 : 5;
          for (let yv = 0; yv <= ymax; yv += step) { hlinePx(v, c, x0 - 4, x1, Y(yv), 'grid', null, 1); txt(v, c, String(yv), x0 - 8, Y(yv), { size: 9.5, color: 'muted', align: 'right', weight: 500 }); }
          let runMin = Infinity, runArg = -1;
          for (let i = 0; i < shown; i++) if (M.K[i] < runMin) { runMin = M.K[i]; runArg = i; }
          const selI = sel ?? (done ? M.opt[0] : runArg);
          M.R.forEach((r, i) => {
            const X = x0 + i * bw;
            if (i < shown) {
              const isOpt = done ? M.opt.includes(i) : i === runArg, isSel = i === selI;
              rr(c, X + bw * 0.14, Y(M.K[i]), bw * 0.72, y1 - Y(M.K[i]), 2.5);
              c.fillStyle = v.color(isOpt ? 'green' : CC[r[0]], isOpt ? 0.85 : 0.38); c.fill();
              if (isSel) { c.strokeStyle = v.color('orange'); c.lineWidth = 2.4; c.stroke(); }
              if (bw > 22 || isOpt || isSel) txt(v, c, String(M.K[i]), X + bw / 2, Y(M.K[i]) - 8, { size: bw > 26 ? 10.5 : 9, weight: isOpt ? 800 : 600, color: isOpt ? 'green' : 'muted', halo: true });
              if (i === shown - 1 && !done) { c.strokeStyle = v.color('gold'); c.lineWidth = 2; c.strokeRect(X + 1, y0, bw - 2, y1 - y0); }
            }
            txt(v, c, rkStr(r, ''), X + bw / 2, y1 + 11, { size: P.m === 3 ? 11 : 9.5, weight: i === selI ? 800 : 600, color: i === selI ? 'orange' : i < shown ? 'ink' : 'faint' });
          });
          hlinePx(v, c, x0 - 4, x1, Y(M.lb), 'ink', [5, 4], 1.4);
          txt(v, c, `lower bound Σ min = ${M.lb}`, x1, Y(M.lb) - 8, { size: 10.5, weight: 700, align: 'right', halo: true });
          hlinePx(v, c, x0 - 4, x1, y1, 'muted', null, 1);
          txt(v, c, done ? `checked all ${n} rankings` : `checking ranking ${shown} of ${n}: ${rkStr(M.R[shown - 1], '')} → ${M.K[shown - 1]} · best so far ${rkStr(M.R[runArg], '')} (${runMin})`, x0, y1 + 28, { size: 10.5, weight: 600, color: done ? 'green' : 'muted', align: 'left' });
          // ---- matrix: orange cells = the voters the selected ranking overrules
          const R = M.R[selI], pos = []; R.forEach((x, k) => { pos[x] = k; });
          const paid = (i, j) => pos[j] < pos[i]; // row i, column j: N(i, j) is paid when j is ranked above i
          drawMatrix(v, Ms, M.N, [8, 26, Ms.width - 8, Ms.height - 30], {
            maxCell: 44,
            fill: (i, j) => (paid(i, j) ? ['orange', 0.32] : M.N[i][j] > M.N[j][i] ? ['green', 0.12] : null),
            outline: (i, j) => (paid(i, j) ? 'orange' : null),
          });
          const terms = []; for (let i = 0; i < P.m; i++) for (let j = 0; j < P.m; j++) if (i !== j && paid(i, j)) terms.push(M.N[i][j]);
          txt(v, Ms.ctx, `${rkStr(R)}:  ${terms.join(' + ')} = ${sum(terms)}`, Ms.width / 2, 13, { size: 11.5, weight: 700, color: 'orange' });
        }, { period: 6, once: true, still: 6 });
        v.readout(() => {
          const M = model(), opt = M.opt.map((i) => rkStr(M.R[i])), C = condorcet(P, M.N);
          const selI = sel ?? M.opt[0], d = (i) => sum(P.blocs.map((b) => b.n * kendall(M.R[i], b.r)));
          return `Kemeny ranking${opt.length > 1 ? 's' : ''} **${opt.join(', ')}** with total Kendall distance ${M.mn} to the ${total(P)} ballots (lower bound ${M.lb}, excess ${M.mn - M.lb}${M.mn === M.lb ? ': the majorities are transitive' : ': the cost of breaking the cycle'}). Selected ${rkStr(M.R[selI])}: ${M.K[selI]}, recomputed voter by voter as $\\sum_i d(R, \\succ_i) = ${d(selI)}$. ` +
            (C.winner >= 0 ? `Condorcet winner ${LET[C.winner]} heads the Kemeny ranking, as it must.` : `No Condorcet winner (top cycle {${C.smith.map((x) => LET[x]).join(', ')}}).`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'One electorate, many winners',
      statement: String.raw`The same profile can produce different winners under different reasonable voting rules. In the classic 55-voter electorate below, with five candidates, plurality elects A, the two-round runoff B, instant runoff C, the Borda count D, and E is the Condorcet winner. Five rules give five different winners, so every candidate wins under some rule. Approval voting can agree with any of several of them depending on where voters draw the line: approving the top two elects D, the top three E. In a spatial electorate the same happens systematically. Colour each point of the issue space by the winner when a centrally symmetric cloud of voters is centred there, and every rule draws a different map. The Condorcet map is exactly the nearest-candidate (Voronoi) map, while plurality, the runoff and IRV squeeze a central candidate out.`,
      idea: String.raw`The rules read different parts of the profile. Plurality sees only first places (A has 18), the runoff only first places and one head-to-head vote (B beats A 37–18), IRV first places after each elimination (C collects D’s and then B’s ballots), Borda positions (D is high on most ballots), and Condorcet methods only the pairwise matrix (E beats everyone, narrowly D 28–27). There is no neutral way to aggregate, and Arrow’s theorem (polsci-3.3) shows that no rule can satisfy a few natural conditions at once. Saari called the resulting dependence of the outcome on the procedure a “mess of an election”. In the spatial picture, a voter cloud centred at a point is symmetric, so for each pair of candidates the majority sides with the one closer to the centre: the Condorcet winner is the nearest candidate, and its map is the Voronoi diagram. Plurality and IRV punish a candidate surrounded by others, since its first preferences are split off on every side.`,
      caption: String.raw`*55-voter electorate*: the six panels count the same ballots by six rules, with the winner in the corner of each. Edit the ballots (drag bars, click letters), slide the approval threshold, or press *Find a mess* to search random electorates for one where five rules elect five different candidates. *Spatial maps*: drag the five candidates. Each point of the plane is coloured by the winner when the voters are a round cloud (spread σ) centred there. The big map shows the rule you pick, the small maps all six — compare plurality’s pinched centre with the Voronoi cells of the Condorcet map.`,
      deps: ['polsci-1.2', 'polsci-1.3', 'polsci-1.4', 'polsci-1.5', 'polsci-1.6', 'polsci-1.8'],
      see: ['polsci-3.3', 'polsci-2.13'],
      refs: ['Saari, Chaotic Elections! ch. 1'],
      tags: ['voting paradoxes', 'spatial voting'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Comparison_of_electoral_systems' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 360, title: 'the ballots (55 voters)' });
        const Rs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 420, weight: 1.25, title: 'six rules count the same ballots' });
        const Bg = v.stage({ x: [-1, 1], y: [-1, 1], axes: false, equal: true, height: 340, minWidth: 320, title: 'issue space: winner when the voters centre here' });
        const Sm = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 420, weight: 1.3, title: 'all six rules' });
        const BASE = mkProfile(5, [[18, 'ADECB'], [12, 'BEDCA'], [10, 'CBEDA'], [9, 'DCEBA'], [4, 'EBDCA'], [2, 'ECDBA']]);
        const P = copyProfile(BASE);
        const RULES = ['Plurality', 'Runoff', 'Instant runoff', 'Borda', 'Condorcet', 'Approval'];
        const mode = v.select('view', [{ value: 'tab', label: '55-voter electorate' }, { value: 'map', label: 'spatial maps' }], 'tab', { onChange: sync });
        const kS = v.slider('approval: approve the top', 1, 4, 2, { int: true, fmt: (x) => `${x} candidate${x > 1 ? 's' : ''}` });
        const bigR = v.select('big map', RULES.map((r, i) => ({ value: i, label: r === 'Instant runoff' ? 'IRV' : r })), 0);
        const sig = v.slider('voter spread σ', 0.15, 0.7, 0.4, { step: 0.01 });
        let seed = 1, searchMsg = '';
        const findBtn = v.button('Find a mess', () => {
          const r = v.rng(seed++);
          for (let tries = 1; tries <= 8000; tries++) {
            // six blocs whose first choices cover all five candidates, sizes 2–17
            const f = r.shuffle(range(5)).concat(r.shuffle(range(5)));
            const Q = { m: 5, blocs: range(6).map((k) => ({ n: 2 + Math.floor(r() * 16), r: [f[k], ...r.shuffle(range(5).filter((c) => c !== f[k]))] })) };
            const ws = results(Q).map((x) => x.win); if (ws.some((w) => w.length !== 1)) continue;
            if (new Set(ws.map((w) => w[0])).size >= 5) { setProfile(P, Q); searchMsg = `found after ${tries} random electorates`; v.restart(); v.play(); return; }
          }
          searchMsg = 'no five-winner electorate in 8,000 tries — press again';
        });
        const resetBtn = v.button('Back to the 55 voters', () => { setProfile(P, BASE); searchMsg = ''; v.restart(); v.play(); });
        const ed = blocEditor(v, E, P, { max: 20, rank: true, rowMax: 44, onEdit: () => { searchMsg = ''; } });
        function results(Q) {
          const C = range(Q.m), pl = tops(Q, C), ro = runoff(Q), bo = borda(Q), cd = condorcet(Q), ap = approvalTops(Q, kS.value);
          const ir = (() => { let alive = C.slice(); const order = []; let cnt; for (;;) { cnt = tops(Q, alive); const cont = sum(alive.map((c) => cnt[c])); const lead = alive.reduce((a, b) => (cnt[b] > cnt[a] ? b : a)); if (alive.length === 1 || cnt[lead] > cont / 2) return { cnt, win: [lead], order, alive }; const lo = worst(cnt, alive); const out = lo[lo.length - 1]; order.push(out); alive = alive.filter((c) => c !== out); } })();
          return [
            { val: pl, win: best(pl, C), note: 'first places' },
            { val: ro.r2, win: ro.win, note: ro.majority ? 'majority in round 1' : `final: ${LET[ro.finalists[0]]} vs ${LET[ro.finalists[1]]}`, faint: C.filter((c) => !ro.finalists.includes(c)) },
            { val: ir.cnt, win: ir.win, note: `out in order: ${ir.order.map((c) => LET[c]).join(', ')}`, faint: ir.order },
            { val: bo, win: best(bo, C), note: 'Borda points' },
            { val: cd.copeland, win: cd.winner >= 0 ? [cd.winner] : cd.copWin, note: cd.winner >= 0 ? 'pairwise wins (of 4)' : 'no Condorcet winner — Copeland', none: cd.winner < 0 },
            { val: ap, win: best(ap, C), note: `approvals, top ${kS.value}` },
          ];
        }
        // ---------- spatial maps
        const cand = [[0.02, 0.04], [-0.56, 0.42], [0.56, 0.4], [-0.42, -0.5], [0.5, -0.48]].map((p, k) => Bg.handle(p[0], p[1], { color: CC[k], r: 8 }));
        const RK = perms(5), CODE = new Int16Array(3125).fill(-1);
        RK.forEach((r, i) => { CODE[r[0] * 625 + r[1] * 125 + r[2] * 25 + r[3] * 5 + r[4]] = i; });
        const GN = 150, GL = 2.4;
        let gridKey = '', rkGrid = null, apGrid = null;
        function buildGrid(cs) {
          const key = cs.map((p) => p.map((x) => x.toFixed(3)).join(',')).join(';');
          if (key === gridKey) return; gridKey = key;
          rkGrid = new Int16Array(GN * GN); apGrid = new Uint8Array(GN * GN);
          for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
            const x = -GL + ((i + 0.5) * 2 * GL) / GN, y = -GL + ((j + 0.5) * 2 * GL) / GN;
            const d = cs.map((p) => Math.hypot(x - p[0], y - p[1])), r = range(5).sort((a, b) => d[a] - d[b] || a - b);
            rkGrid[j * GN + i] = CODE[r[0] * 625 + r[1] * 125 + r[2] * 25 + r[3] * 5 + r[4]];
            const mean = sum(d) / 5; let mask = 0; for (let k = 0; k < 5; k++) if (d[k] < mean) mask |= 1 << k; apGrid[j * GN + i] = mask;
          }
        }
        // a symmetric sample of 112 voters from a round normal cloud: 7 equal-mass rings × 16 directions
        const offsets = (s) => { const out = []; for (let j = 0; j < 7; j++) { const r = s * Math.sqrt(-2 * Math.log(1 - (j + 0.5) / 7)); for (let k = 0; k < 16; k++) { const a = (2 * Math.PI * k) / 16 + (j % 2 ? Math.PI / 16 : 0); out.push([r * Math.cos(a), r * Math.sin(a)]); } } return out; };
        const cell = (x, y) => { const i = Math.floor(((x + GL) / (2 * GL)) * GN), j = Math.floor(((y + GL) / (2 * GL)) * GN); return i < 0 || j < 0 || i >= GN || j >= GN ? -1 : j * GN + i; };
        const cntBuf = new Float64Array(120);
        function winnerAt(x, y, rule, offs) {
          if (rule === 5) {
            const ap = [0, 0, 0, 0, 0];
            for (const [ox, oy] of offs) { const k = cell(x + ox, y + oy); if (k < 0) continue; const mask = apGrid[k]; for (let c = 0; c < 5; c++) if (mask & (1 << c)) ap[c]++; }
            const w = best(ap, range(5)); return w.length === 1 ? w[0] : -1;
          }
          const touched = [];
          for (const [ox, oy] of offs) { const k = cell(x + ox, y + oy); if (k < 0) continue; const id = rkGrid[k]; if (!cntBuf[id]) touched.push(id); cntBuf[id]++; }
          const Q = { m: 5, blocs: touched.map((id) => ({ n: cntBuf[id], r: RK[id] })) };
          for (const id of touched) cntBuf[id] = 0;
          let w;
          if (rule === 0) w = best(tops(Q), range(5));
          else if (rule === 1) w = runoff(Q).win;
          else if (rule === 2) w = irvWin(Q);
          else if (rule === 3) w = best(borda(Q), range(5));
          else { const C = condorcet(Q); w = C.winner >= 0 ? [C.winner] : []; }
          return w.length === 1 ? w[0] : -1;
        }
        const colorOf = (w) => (w < 0 ? v.ramp(0.25, 'muted') : v.ramp(0.55, CC[w]));
        let lastKey = { big: '', small: '' };
        function sync() {
          const map = mode.value === 'map';
          E.el.hidden = Rs.el.hidden = map; Bg.el.hidden = Sm.el.hidden = !map;
          kS.el.hidden = findBtn.hidden = resetBtn.hidden = map; bigR.el.hidden = sig.el.hidden = !map;
          v.invalidate();
        }
        sync();
        const DUR = 2.2;
        v.animate((t) => {
          if (mode.value === 'tab') {
            ed.draw();
            const res = results(P), c = Rs.ctx, W = Rs.width, H = Rs.height, p = clamp(t / DUR, 0, 1), pe = ease(p);
            const cw = W / 3, chh = H / 2;
            res.forEach((R, idx) => {
              const ox = (idx % 3) * cw, oy = Math.floor(idx / 3) * chh, x0 = ox + 10, x1 = ox + cw - 8, y0 = oy + 60, y1 = oy + chh - 30;
              rr(c, ox + 3, oy + 3, cw - 6, chh - 6, 8); c.fillStyle = v.color('muted', 0.05); c.fill();
              txt(v, c, RULES[idx], ox + 12, oy + 16, { size: 12, weight: 700, align: 'left' });
              txt(v, c, R.note, ox + 12, oy + 31, { size: 9.5, weight: 600, color: 'muted', align: 'left' });
              const mx = Math.max(...R.val, 1), bw = (x1 - x0) / 5;
              range(5).forEach((cand) => {
                const X = x0 + (cand + 0.5) * bw, h = ((R.val[cand] / mx) * (y1 - y0)) * pe, faint = R.faint && R.faint.includes(cand);
                rr(c, X - bw * 0.33, y1 - h, bw * 0.66, Math.max(h, 1), 2.5); c.fillStyle = v.color(CC[cand], faint ? 0.18 : 0.72); c.fill();
                if (p >= 1) txt(v, c, String(+R.val[cand].toFixed(1)), X, y1 - h - 7, { size: 9.5, weight: 700, color: faint ? 'faint' : 'ink', halo: true });
                chip(v, c, X, y1 + 11, cand, { r: 7, alpha: faint ? 0.4 : 1 });
              });
              if (p >= 1) {
                if (R.win.length === 1) { chip(v, c, ox + cw - 24, oy + 22, R.win[0], { r: 12, ring: R.none ? null : 'gold' }); }
                else txt(v, c, 'tie', ox + cw - 24, oy + 22, { size: 11, weight: 700, color: 'muted' });
              }
            });
            Sm.corner('spatial maps', 'tl'); // (hidden in this view)
          } else {
            const cs = cand.map((h) => [h.x, h.y]); buildGrid(cs);
            const dragging = cand.some((h) => h.dragging), offs = offsets(sig.value), rule = +bigR.value;
            const keyB = `${gridKey}|${sig.value}|${rule}`;
            Bg.raster((x, y) => colorOf(winnerAt(x, y, rule, offs)), { res: dragging ? 7 : 3, key: dragging ? `${keyB}|d` : keyB, id: 'big' });
            cand.forEach((h, k) => { Bg.text(LET[k], h.x, h.y, { dx: 12, dy: -12, size: 13, weight: 800, color: CC[k] }); });
            Bg.corner(RULES[rule], 'tl', { color: 'ink', weight: 700, plate: true });
            // small multiples
            const c = Sm.ctx, W = Sm.width, H = Sm.height, cw = W / 3, ch = H / 2, sq = Math.min(cw - 14, ch - 26);
            const boxes = range(6).map((i) => { const ox = (i % 3) * cw + (cw - sq) / 2, oy = Math.floor(i / 3) * ch + 20 + (ch - 20 - sq) / 2; return [ox, oy, ox + sq, oy + sq]; });
            if (!dragging) lastKey.small = `${gridKey}|${sig.value}`;
            Sm.raster((x, y) => {
              const X = Sm.X(x), Y = Sm.Y(y);
              for (let i = 0; i < 6; i++) { const b = boxes[i]; if (X >= b[0] && X <= b[2] && Y >= b[1] && Y <= b[3]) { const ix = -1 + (2 * (X - b[0])) / sq, iy = 1 - (2 * (Y - b[1])) / sq; return colorOf(winnerAt(ix, iy, i, offs)); } }
              return null;
            }, { res: 4, key: lastKey.small, id: 'small' });
            boxes.forEach((b, i) => {
              txt(v, c, RULES[i], (b[0] + b[2]) / 2, b[1] - 9, { size: 11, weight: 700, color: i === rule ? 'accent' : 'ink' });
              c.strokeStyle = v.color(i === rule ? 'accent' : 'faint'); c.lineWidth = i === rule ? 2 : 1; c.strokeRect(b[0] + 0.5, b[1] + 0.5, sq - 1, sq - 1);
              cs.forEach((p, k) => { const X = b[0] + ((p[0] + 1) / 2) * sq, Y = b[1] + ((1 - p[1]) / 2) * sq; if (X < b[0] || X > b[2] || Y < b[1] || Y > b[3]) return; c.beginPath(); c.arc(X, Y, 3.6, 0, 2 * Math.PI); c.fillStyle = v.color(CC[k]); c.fill(); c.strokeStyle = v.color('panel'); c.lineWidth = 1.2; c.stroke(); });
            });
          }
        }, { period: DUR + 0.4, once: true, still: DUR + 0.4 });
        Sm.onClick((x, y) => { const X = Sm.X(x), Y = Sm.Y(y), i = Math.floor(X / (Sm.width / 3)) + 3 * Math.floor(Y / (Sm.height / 2)); if (i >= 0 && i < 6) bigR.set(i); });
        v.readout(() => {
          if (mode.value === 'map') {
            const cs = cand.map((h) => [h.x, h.y]); buildGrid(cs);
            const offs = offsets(sig.value), share = Array(6).fill(0);
            let tot = 0;
            for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) { const x = -1 + (2 * (i + 0.5)) / 24, y = -1 + (2 * (j + 0.5)) / 24; tot++; for (let r = 0; r < 6; r++) if (winnerAt(x, y, r, offs) === 0) share[r]++; }
            return `Share of the square won by the central candidate **A**: ${RULES.map((r, i) => `${r} ${Math.round((100 * share[i]) / tot)}%`).join(', ')}. The Condorcet map is the nearest-candidate (Voronoi) map: with a symmetric cloud of voters, the majority in each head-to-head vote sides with the candidate closer to its centre. Approval here: each voter approves the candidates closer than her average distance.`;
          }
          const res = results(P), ws = res.map((R) => R.win), uniq = new Set(ws.filter((w) => w.length === 1).map((w) => w[0]));
          return `Winners: ${RULES.map((r, i) => `${r} **${names(ws[i])}**`).join(', ')} — **${uniq.size} different winner${uniq.size > 1 ? 's' : ''}** from six rules on the same ${total(P)} ballots${uniq.size === 5 ? ': every candidate wins under some rule' : ''}.` + (searchMsg ? ` (${searchMsg}.)` : '');
        });
      },
    },
  ],
};
