// Political Science & Social Choice — Chapter 1: Voting methods
import {
  CC, LET, sum, range, clamp, perms, mkProfile, copyProfile, setProfile, total, rkStr, best, names,
  tops, pairwise, borda, plurality, runoff, irv, condorcet, rankFrom, spatialProfile,
  rr, txt, chip, winTag, blocEditor, drawMatrix, drawRepTriangle, counts3, drawSankey,
} from './ch01.shared.js';

// ---------- local helpers
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const pct = (a, n) => `${Math.round((100 * a) / (n || 1))}%`;
const fmtN = (x) => Math.round(x).toLocaleString('en-US');
function binomN(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); }
/** "C beats A 10–9, …" — every pairwise majority, strongest first. */
function majorityText(N, C) {
  const out = [];
  for (const x of C) for (const y of C) if (x < y) {
    const a = N[x][y], b = N[y][x];
    if (a === b) out.push({ m: 0, s: `${LET[x]} ties ${LET[y]} ${a}–${b}` });
    else { const [w, l, p, q] = a > b ? [x, y, a, b] : [y, x, b, a]; out.push({ m: p - q, s: `${LET[w]} beats ${LET[l]} ${+p.toFixed(1)}–${+q.toFixed(1)}` }); }
  }
  return out.sort((u, w) => w.m - u.m).map((o) => o.s).join(', ');
}
/** Vertical bar chart axis frame in pixels: returns {X(c), Y(val), base, top} for k columns in box. */
function colFrame(box, k, ymax) {
  const [x0, y0, x1, y1] = box, w = (x1 - x0) / k;
  return { w, X: (i) => x0 + (i + 0.5) * w, Y: (val) => y1 - (val / ymax) * (y1 - y0), base: y1, top: y0 };
}
function hlinePx(v, c, x0, x1, Y, col, dash, w = 1.3) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, Math.round(Y) + 0.5); c.lineTo(x1, Math.round(Y) + 0.5); c.stroke(); c.restore();
}

export default {
  collection: 'polsci',
  chapter: 1,
  title: 'Voting methods',
  summary: String.raw`A voting method turns a profile of individual rankings into a winner. Plurality, the two-round runoff, instant runoff, the Borda count, Condorcet methods, agendas of pairwise votes, approval, score voting and majority judgment, positional rules and Kemeny’s rule each read different information from the same ballots — first places, positions, pairwise majorities, grades — and on one electorate they can all choose different winners. The chapter builds the shared vocabulary (profiles, pairwise tallies, scoring vectors, tournaments) and one profile editor used by every picture, so the methods can be compared on exactly the same voters.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Preference profiles and social choice functions',
      statement: String.raw`Let $X$ be a finite set of $m$ candidates and $1, \dots, n$ the voters. A **preference profile** is a list $(\succ_1, \dots, \succ_n)$ of *rankings*: each $\succ_i$ is a strict linear order on $X$ — a complete, transitive, asymmetric preference (micro-4.3) with no ties. There are $m!$ possible rankings. When voters are interchangeable, a profile is determined by how many voters hold each ranking: a vector of $m!$ non-negative integers summing to $n$, and there are $\binom{n + m! - 1}{m! - 1}$ such **anonymous profiles**.

A **social choice function** (voting rule) $F$ assigns to every profile a non-empty set $F(\succ_1, \dots, \succ_n) \subseteq X$ of winners; it is *resolute* if the set is always a single candidate (ties broken by a fixed rule). A **social welfare function** returns a ranking of $X$ instead.

The **pairwise tallies** $N(x, y) = \#\{i : x \succ_i y\}$ satisfy $N(x, y) + N(y, x) = n$, and $x$ **beats** $y$ by majority when $N(x, y) > N(y, x)$.`,
      idea: String.raw`Every rule in this chapter reads the same object but a different part of it: plurality only the first places ($m$ numbers), Borda and the other positional rules the positions, Condorcet methods only the $\binom m2$ pairwise tallies, instant runoff whole ballots in a particular order. The count of anonymous profiles is stars and bars (comb-1.11): $n$ voters distributed among $m! = 6$ rankings when $m = 3$ (comb-1.5). For three candidates, Saari’s representation triangle shows a profile at a glance: candidates at the vertices, the three altitudes cut the triangle into six small triangles — one per ranking, read as “closest vertex first, then the next closest” — and each pairwise tally is the sum of the three regions on one side of an altitude. In the spatial modes each voter ranks the candidates by distance from her own position. On a line only four of the six rankings can occur — the single-peaked domain of polsci-4.1, on which majority rule with an odd number of voters is transitive — but in a plane distance-based voters can still produce a majority cycle (polsci-4.5).`,
      caption: String.raw`Drag the bars to set how many voters hold each of the six rankings, or switch to voters *on a line* or *in a plane* and drag the three candidates and the centres of the three voter groups: every voter then ranks the candidates by distance (dashed lines: where two candidates are equally far). On the right, Saari’s triangle shows the profile — each small triangle is a ranking, shaded by how many hold it — with the pairwise majorities beside the edges and every $N(x, y)$ in the matrix. The readout applies three social choice functions to the same profile; in the starting electorate they elect three different candidates, and the starting voters in the plane even produce a majority cycle.`,
      deps: ['micro-4.3', 'comb-1.5', 'comb-1.11'],
      see: ['polsci-3.13', 'polsci-4.1'],
      refs: ['T&P ch. 1', 'Saari, Chaotic Elections! ch. 1'],
      tags: ['social choice', 'profiles'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Social_choice_theory' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 360, weight: 1.15, title: 'the electorate: voters holding each of the six rankings' });
        const Sp = v.stage({ x: [-1, 1], y: [-0.66, 0.66], axes: false, equal: true, height: 360, minWidth: 360, weight: 1.15, title: 'the electorate in an issue space' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 320, title: 'the profile' });
        const R6 = perms(3);
        const P = { m: 3, blocs: R6.map((r, k) => ({ n: [3, 4, 2, 4, 0, 6][k], r: r.slice() })) };
        const ed = blocEditor(v, E, P, { max: 12, rowMax: 48, hint: 'ranking (best → worst)' });
        // spatial electorate: three voter groups around draggable centres, three candidates
        const SIZES = [18, 14, 10], rng = v.rng(11);
        const offs = SIZES.map((k) => range(k).map(() => [rng.normal() * 0.15, rng.normal() * 0.15, 0.1 + 0.3 * rng()]));
        const conf = {
          '1d': { cand: [[-0.45, 0], [0.55, 0], [0.08, 0]], grp: [[-0.55, -0.34], [0.2, -0.34], [0.62, -0.34]] },
          '2d': { cand: [[-0.42, -0.18], [0.5, 0.0], [0.02, 0.36]], grp: [[-0.5, 0.12], [0.4, 0.32], [0.25, -0.34]] },
        };
        let cur = '2d';
        const onLine = () => mode.value === '1d';
        const cH = range(3).map((k) => Sp.handle(...conf['2d'].cand[k], { color: CC[k], r: 9, label: LET[k], labelPos: 'n', constrain: (x, y) => [x, onLine() ? 0 : y] }));
        const gH = range(3).map((k) => Sp.handle(...conf['2d'].grp[k], { color: 'gray', r: 7, constrain: (x, y) => [x, onLine() ? -0.34 : y] }));
        const mode = v.select('voters', [{ value: 'rank', label: 'ranked ballots' }, { value: '1d', label: 'on a line' }, { value: '2d', label: 'in a plane' }], 'rank', { onChange: sync });
        function sync() {
          const m = mode.value;
          E.el.hidden = m !== 'rank'; Sp.el.hidden = m === 'rank';
          if (m !== 'rank' && m !== cur) {
            conf[cur] = { cand: cH.map((h) => [h.x, h.y]), grp: gH.map((h) => [h.x, h.y]) };
            cur = m; cH.forEach((h, k) => h.set(...conf[m].cand[k])); gH.forEach((h, k) => h.set(...conf[m].grp[k]));
          }
          v.invalidate();
        }
        sync();
        const voters = () => {
          const out = [];
          gH.forEach((h, g) => offs[g].forEach(([ox, oy, jy]) => out.push(onLine() ? [h.x + ox, 0.08 + jy * 0.9, g] : [h.x + ox, h.y + oy, g])));
          return out;
        };
        const candPts = () => cH.map((h) => [h.x, h.y]);
        const profile = () => (mode.value === 'rank' ? P : spatialProfile(voters().map((p) => [p[0], p[1]]), candPts(), onLine() ? 1 : 2));
        v.render(() => {
          const prof = profile(), c6 = counts3(prof), N = pairwise(prof);
          if (mode.value === 'rank') ed.draw();
          else {
            const cand = candPts(), dim = onLine() ? 1 : 2, c = Sp.ctx;
            if (onLine()) {
              Sp.line(-1, 0, 1, 0, { color: 'muted', width: 1.5 });
              const cuts = [];
              for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) { const mx = (cand[a][0] + cand[b][0]) / 2; cuts.push(mx); Sp.line(mx, -0.05, mx, 0.05, { color: 'faint', width: 1.2 }); }
              const pts = [-1, ...cuts.filter((x) => x > -1 && x < 1).sort((p, q) => p - q), 1];
              for (let k = 0; k + 1 < pts.length; k++) {
                if (pts[k + 1] - pts[k] < 0.09) continue;
                const mid = (pts[k] + pts[k + 1]) / 2;
                Sp.text(rkStr(rankFrom([mid, 0], cand, 1), ''), mid, -0.13, { size: 10.5, color: 'muted', align: 'center', weight: 600 });
              }
            } else {
              // perpendicular bisectors: the boundaries between ranking regions
              Sp.clip(() => {
                for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
                  const M = [(cand[a][0] + cand[b][0]) / 2, (cand[a][1] + cand[b][1]) / 2], d = [-(cand[b][1] - cand[a][1]), cand[b][0] - cand[a][0]], L = Math.hypot(...d) || 1;
                  Sp.line(M[0] - (3 * d[0]) / L, M[1] - (3 * d[1]) / L, M[0] + (3 * d[0]) / L, M[1] + (3 * d[1]) / L, { color: 'faint', width: 1.2, dash: [4, 4] });
                }
              });
              const acc = new Map();
              for (let i = 0; i <= 26; i++) for (let j = 0; j <= 18; j++) {
                const x = -0.97 + (1.94 * i) / 26, y = -0.62 + (1.24 * j) / 18, k = rankFrom([x, y], cand, 2).join('');
                const a = acc.get(k) || [0, 0, 0]; a[0] += x; a[1] += y; a[2]++; acc.set(k, a);
              }
              for (const [k, a] of acc) if (a[2] >= 10) Sp.text([...k].map((d) => LET[d]).join(''), a[0] / a[2], a[1] / a[2], { size: 10, color: 'muted', align: 'center', weight: 600, alpha: 0.85 });
            }
            for (const p of voters()) {
              const t = rankFrom([p[0], p[1]], cand, dim)[0];
              c.beginPath(); c.arc(Sp.X(p[0]), Sp.Y(p[1]), 3.3, 0, 2 * Math.PI); c.fillStyle = v.color(CC[t], 0.8); c.fill();
            }
            gH.forEach((h, g) => Sp.text(`${SIZES[g]} voters`, h.x, h.y, { dy: 16, size: 10.5, color: 'muted', align: 'center', weight: 600 }));
          }
          const W = T.width, H = T.height;
          drawRepTriangle(v, T, c6, [0, 6, W, H * 0.64]);
          drawMatrix(v, T, N, [W * 0.1, H * 0.64 + 2, W * 0.9, H - 4], { maxCell: 34, title: 'N(row, column): voters ranking row above column' });
        });
        v.readout(() => {
          const prof = profile(), n = total(prof), c6 = counts3(prof), N = pairwise(prof), C = condorcet(prof, N);
          const used = c6.filter((x) => x > 0).length;
          const plu = plurality(prof).win, bo = best(borda(prof), [0, 1, 2]);
          const cw = C.winner >= 0 ? `**${LET[C.winner]}**` : 'none (the majorities cycle)';
          return `**${n} voters** · profile $(n_{ABC}, n_{ACB}, n_{BAC}, n_{BCA}, n_{CAB}, n_{CBA}) = (${c6.map((x) => +x.toFixed(1)).join(', ')})$ — one of $\\binom{${n}+5}{5}$ = ${fmtN(binomN(n + 5, 5))} anonymous profiles of ${n} voters` +
            (mode.value === '1d' ? ` (on a line only ${used} of the 6 rankings occur)` : mode.value === '2d' ? ` (${used} of the 6 rankings occur)` : '') +
            `. Majorities: ${majorityText(N, [0, 1, 2])}. Three social choice functions on this profile: plurality → **${names(plu)}**, Borda → **${names(bo)}**, Condorcet winner → ${cw}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Method',
      name: 'Plurality voting',
      statement: String.raw`Under **plurality** (first past the post) each voter names one candidate — sincerely, her top choice — and the candidate named most often wins: with first-place counts $t(x) = \#\{i : x \text{ is ranked first by } i\}$, the winners are $\arg\max_x t(x)$ (ties broken by a fixed rule). Only first places are read.

A candidate with a strict majority, $t(x) > n/2$, always wins, but no majority is needed: the winner has at least $n/m$ votes (the largest of $m$ numbers summing to $n$) and may have barely more, so with many candidates a small minority can decide. With two candidates plurality is simple majority rule (polsci-3.1).`,
      idea: String.raw`Plurality discards everything below the top of each ballot. That makes it easy to vote and to count, and blind to how everyone else feels about the leader. Its only guarantee is the pigeonhole principle (comb-1.2): $\max_x t(x) \ge n/m$. Adding a candidate can change the winner without changing anyone’s opinion of the existing ones, because the newcomer takes first places from whoever voters rank it near. This vote splitting is the spoiler effect of polsci-2.3 and the mechanism behind Duverger’s law.`,
      caption: String.raw`Watch the first preferences counted one ballot at a time. Only each bloc’s gold-ringed first choice counts; the faded rest of the ballot is ignored. The slider takes candidates off the ballot, from E backwards. Nobody’s ranking changes, yet every added candidate changes the winner, and with all five running E wins with a quarter of the vote. Drag bars or click letters to change the electorate; ↺ recounts.`,
      deps: ['polsci-1.1', 'comb-1.2'],
      see: ['polsci-2.3', 'polsci-3.14'],
      refs: ['T&P ch. 1'],
      tags: ['plurality', 'voting methods'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Plurality_voting' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 380, title: 'ballots' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 340, title: 'first preferences, one square per voter' });
        const P = mkProfile(5, [[7, 'ACDEB'], [7, 'BCDEA'], [7, 'CBADE'], [3, 'DCBAE'], [5, 'EDACB'], [3, 'EDBCA']]);
        const mS = v.slider('candidates running', 2, 5, 5, { int: true });
        const alive = () => range(mS.value);
        const topOf = (b) => b.r.find((c) => c < mS.value);
        const ed = blocEditor(v, E, P, { max: 12, rank: true, alive: () => new Set(alive()), ring: (b, k, c) => (c === topOf(b) ? 'gold' : null), dim: (b, k, c) => c !== topOf(b), tag: (b) => ({ text: `→ ${LET[topOf(b)]}`, color: CC[topOf(b)] }) });
        const DUR = 2.8;
        v.animate((t) => {
          ed.draw();
          const c = T.ctx, W = T.width, H = T.height, n = total(P), m = mS.value, A = alive();
          const fin = tops(P, A), done = t >= DUR, k = done ? n : (clamp(t, 0, DUR) / DUR) * n;
          // counted so far, per candidate (ballots in bloc order)
          const cnt = Array(5).fill(0); let start = 0;
          for (const b of P.blocs) { const got = clamp(k - start, 0, b.n); cnt[topOf(b)] += got; start += b.n; }
          const ymax = Math.max(n / 2 + 2, ...fin) * 1.08;
          const F = colFrame([38, 30, W - 12, H - 34], m, ymax), cell = Math.min(F.w * 0.56, 34);
          // reference lines
          hlinePx(v, c, 38, W - 8, F.Y(n / 2), 'red', [6, 4]);
          txt(v, c, String(n / 2), 34, F.Y(n / 2), { size: 10.5, color: 'red', align: 'right', weight: 700 });
          hlinePx(v, c, 38, W - 8, F.Y(n / m), 'muted', [2, 3]);
          txt(v, c, String(+(n / m).toFixed(1)), 34, F.Y(n / m), { size: 10.5, color: 'muted', align: 'right', weight: 700 });
          hlinePx(v, c, 38, W - 8, F.base, 'muted', null, 1);
          const win = best(fin, A);
          A.forEach((cand, i) => {
            const X = F.X(i), full = Math.floor(cnt[cand] + 1e-9), part = cnt[cand] - full, uh = F.Y(0) - F.Y(1);
            for (let q = 0; q < full + (part > 0.02 ? 1 : 0); q++) {
              const frac = q < full ? 1 : part, y0 = F.Y(q), y1 = F.Y(q + frac);
              rr(c, X - cell / 2, y1 + 0.8, cell, Math.max(1, y0 - y1 - 1.6), 2.5);
              c.fillStyle = v.color(CC[cand], q < full ? 0.72 : 0.45); c.fill();
            }
            chip(v, c, X, F.base + 16, cand, { r: 10, ring: done && win.includes(cand) ? 'gold' : null });
            const shown = Math.round(cnt[cand] - 0.49);
            txt(v, c, `${Math.max(0, shown)}`, X, F.Y(cnt[cand]) - 9, { size: 12.5, weight: 700, halo: true });
            if (done && win.length === 1 && win[0] === cand) winTag(v, c, X, F.Y(cnt[cand]) - 28, `winner · ${pct(fin[cand], n)}`);
          });
          txt(v, c, done ? `all ${n} ballots counted` : `counted ${Math.floor(k)} of ${n}`, 10, 14, { size: 11, weight: 600, color: 'muted', align: 'left' });
        }, { period: DUR + 0.6, once: true, still: DUR + 0.6 });
        v.legend([['red', 'majority: more than n/2 votes', { dash: true }], ['muted', 'n/m: the least a plurality winner can have', { dash: true }]]);
        v.readout(() => {
          const n = total(P), A = alive(), fin = tops(P, A), win = best(fin, A), w = win[0];
          const seq = [2, 3, 4, 5].map((m) => { const a = range(m), ws = best(tops(P, a), a); return `${names(ws)} (m = ${m})`; }).join(' → ');
          return `Plurality winner **${names(win)}** with ${fin[w]} of ${n} first preferences (${pct(fin[w], n)}); ${n - fin[w]} voters (${pct(n - fin[w], n)}) ranked someone else first. Any winner has at least $n/m = ${+(n / A.length).toFixed(2)}$ votes. As candidates enter, the winner goes ${seq}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Method',
      name: 'Two-round runoff',
      statement: String.raw`In a **two-round (runoff) system** the first round is a plurality vote. A candidate with a majority of the votes wins outright; otherwise only the two candidates with the most first-round votes go on, and the second round is a majority vote between them. With ranked ballots and sincere voters the second round can be read off the same ballots — each voter supports whichever finalist she ranks higher (the *contingent vote*).

The winner always has a majority in the final round. But the finalists are chosen from first places alone, so a candidate who would beat every rival head to head can be eliminated in the first round.`,
      idea: String.raw`The runoff repairs plurality’s worst failure — a winner opposed by a majority — but only between the two finalists. The second round is May’s majority rule (polsci-3.1), so the winner beats the other finalist. Who reaches the final, though, is decided by first preferences: a broadly acceptable centrist whom few voters rank first (the *centre squeeze*) never gets the head-to-head contests she would win. France elects its president this way. In 2002, with 16 candidates, Jacques Chirac (19.88%) and Jean-Marie Le Pen (16.86%) edged out Lionel Jospin (16.18%), and Chirac won the second round with 82.21%.`,
      caption: String.raw`Round 1 counts first preferences. If nobody has a majority, the two leaders go through and each eliminated candidate’s ballots fly, bloc by bloc, to the finalist those voters rank higher. In the starting electorate plurality would elect B and the runoff elects A, while D — out with 2 first preferences — beats everybody head to head. *Saari’s drinks* is his milk (A), beer (B) and wine (C) example. Toggle the outright-majority rule, drag bars or click letters, and press ↺ to recount.`,
      deps: ['polsci-1.2'],
      refs: ['T&P ch. 1', 'Saari, Chaotic Elections! ch. 1'],
      tags: ['runoff', 'voting methods'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Two-round_system' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 360, title: 'ballots' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 360, title: 'round 1, then the transfers of round 2' });
        const PRE = { squeeze: mkProfile(4, [[8, 'ADBC'], [5, 'BDCA'], [4, 'BCDA'], [7, 'CDAB'], [2, 'DABC']]), drinks: mkProfile(3, [[6, 'ACB'], [5, 'BCA'], [4, 'CBA']]) };
        const P = copyProfile(PRE.squeeze);
        const pre = v.select('electorate', [{ value: 'squeeze', label: 'centre squeeze' }, { value: 'drinks', label: 'Saari’s drinks' }], 'squeeze', { onChange: () => { setProfile(P, PRE[pre.value]); v.restart(); v.play(); } });
        const maj = v.toggle('a first-round majority wins outright', true);
        const res = () => runoff(P, { majority: maj.value });
        const ed = blocEditor(v, E, P, {
          max: 12, rank: true,
          ring: (b, k, c) => { const R = res(); return k === 0 ? 'gold' : !R.majority && !R.finalists.includes(b.r[0]) && c === b.r.find((x) => R.finalists.includes(x)) ? 'green' : null; },
          tag: (b) => { const R = res(); if (R.majority || R.finalists.includes(b.r[0])) return null; const f = b.r.find((x) => R.finalists.includes(x)); return { text: `→ ${LET[f]}`, color: CC[f] }; },
        });
        const T1 = 1.5, T2 = 2.1, T3 = 4.3;
        v.animate((t) => {
          ed.draw();
          const c = T.ctx, W = T.width, H = T.height, R = res(), n = R.n, m = P.m, C = range(m);
          const p1 = ease(t / T1), fin = R.finalists;
          // transfer chunks: eliminated candidate e → finalist f
          const chunks = [];
          if (!R.majority) for (const e of C) if (!fin.includes(e)) for (const f of fin) {
            const val = sum(P.blocs.filter((b) => b.r[0] === e && b.r.find((x) => fin.includes(x)) === f).map((b) => b.n));
            if (val > 0) chunks.push({ e, f, val });
          }
          const ymax = Math.max(n / 2 + 2, ...R.r2, ...R.r1) * 1.1;
          const F = colFrame([36, 56, W - 12, H - 50], m, ymax), bw = Math.min(F.w * 0.58, 46);
          hlinePx(v, c, 36, W - 8, F.Y(n / 2), 'red', [6, 4]);
          txt(v, c, String(n / 2), 32, F.Y(n / 2), { size: 10.5, color: 'red', align: 'right', weight: 700 });
          hlinePx(v, c, 36, W - 8, F.base, 'muted', null, 1);
          const nCh = chunks.length || 1, slot = (T3 - T2) / (nCh + 1.5);
          const prog = chunks.map((ch, j) => ease((t - T2 - j * slot) / (slot * 2.5)));
          // bars: own first preferences
          C.forEach((x, i) => {
            const X = F.X(i), h1 = R.r1[x] * p1, out = !R.majority && !fin.includes(x) && t > T2;
            if (out) { rr(c, X - bw / 2, F.Y(R.r1[x]), bw, F.base - F.Y(R.r1[x]), 3); c.strokeStyle = v.color(CC[x], 0.6); c.lineWidth = 1.4; c.setLineDash([4, 3]); c.stroke(); c.setLineDash([]); }
            if (!out) { rr(c, X - bw / 2, F.Y(h1), bw, F.base - F.Y(h1), 3); c.fillStyle = v.color(CC[x], 0.7); c.fill(); }
            chip(v, c, X, F.base + 16, x, { r: 10, strike: out && t > T3, ring: t >= T3 + 0.3 && R.win.length === 1 && R.win[0] === x ? 'gold' : null });
          });
          // chunks: from the eliminated bar (stacked by target) to the top of the finalist's bar
          const srcBase = {}, dstBase = {};
          C.forEach((x) => { srcBase[x] = 0; dstBase[x] = R.r1[x]; });
          chunks.forEach((ch, j) => {
            const i0 = C.indexOf(ch.e), i1 = C.indexOf(ch.f), u = t <= T2 ? 0 : prog[j];
            const sy = srcBase[ch.e], dy = dstBase[ch.f]; srcBase[ch.e] += ch.val; dstBase[ch.f] += ch.val;
            const X = F.X(i0) + (F.X(i1) - F.X(i0)) * u, lift = Math.sin(Math.PI * u) * 34;
            const yb = sy + (dy - sy) * u, h = ch.val * (t <= T2 ? p1 : 1);
            const yb0 = t <= T2 ? sy * p1 : yb;
            rr(c, X - bw / 2, F.Y(yb0 + h) - lift, bw, F.Y(yb0) - F.Y(yb0 + h), 3);
            c.fillStyle = v.color(CC[ch.e], 0.75); c.fill(); c.strokeStyle = v.color('panel'); c.lineWidth = 1.2; c.stroke();
            if (F.Y(yb0) - F.Y(yb0 + h) > 13 && u > 0.98) txt(v, c, `+${ch.val}`, X, (F.Y(yb0 + h) + F.Y(yb0)) / 2, { size: 10.5, weight: 700, color: 'panel' });
          });
          // totals
          C.forEach((x, i) => {
            const X = F.X(i), isFin = R.majority ? x === R.win[0] : fin.includes(x);
            const shown = t < T2 ? Math.round(R.r1[x] * p1) : !isFin && !R.majority ? R.r1[x] : t >= T3 ? R.r2[x] : R.r1[x];
            const yTop = t >= T3 && isFin && !R.majority ? R.r2[x] : R.r1[x] * (t < T2 ? p1 : 1);
            txt(v, c, String(shown), X, F.Y(yTop) - 9, { size: 12.5, weight: 700, halo: true, color: !isFin && t > T2 && !R.majority ? 'muted' : 'ink' });
            if (t > T1 && !R.majority && isFin) txt(v, c, 'finalist', X, F.base + 37, { size: 9.5, weight: 700, color: 'green' });
            if (t >= T3 + 0.3 && R.win.length === 1 && R.win[0] === x) winTag(v, c, X, F.Y(yTop) - 28, R.majority ? 'majority in round 1' : `wins ${R.r2[x]}–${n - R.r2[x]}`);
          });
          const phase = t < T1 ? 'round 1: counting first preferences' : R.majority ? 'round 1: a majority — no second round' : t < T3 ? 'round 2: eliminated ballots move to the finalist ranked higher' : 'round 2: final count';
          txt(v, c, phase, 10, 14, { size: 11, weight: 600, color: 'muted', align: 'left' });
        }, { period: T3 + 0.8, once: true, still: T3 + 0.8 });
        v.legend([['red', 'majority: more than half the votes', { dash: true }], ['green', 'finalist ranked higher (where the ballot goes in round 2)', { dot: true }]]);
        v.readout(() => {
          const R = res(), n = R.n, C = range(P.m), Cd = condorcet(P), pl = plurality(P).win;
          let s = `Round 1: ${C.map((x) => `${LET[x]} ${R.r1[x]}`).join(', ')}. `;
          if (R.majority) s += `${LET[R.win[0]]} has a majority (${R.r1[R.win[0]]} > ${n / 2}) and wins outright. `;
          else s += `No majority (largest ${Math.max(...R.r1)} ≤ ${n / 2}): ${LET[R.finalists[0]]} and ${LET[R.finalists[1]]} go through. Round 2: ${LET[R.finalists[0]]} ${R.r2[R.finalists[0]]} – ${R.r2[R.finalists[1]]} ${LET[R.finalists[1]]}, so **${names(R.win)}** wins (plurality alone: ${names(pl)}). `;
          if (Cd.winner >= 0) {
            const x = Cd.winner, rest = C.filter((y) => y !== x).map((y) => `${LET[y]} ${Cd.N[x][y]}–${Cd.N[y][x]}`).join(', ');
            s += R.finalists.includes(x) || R.win.includes(x) ? `The Condorcet winner ${LET[x]} (${rest}) reached the final.` : `**${LET[x]}**, eliminated in round 1 with ${R.r1[x]} first preferences, beats every rival head to head (${rest}): the centre squeeze.`;
          } else s += 'There is no Condorcet winner (majorities cycle).';
          return s;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Method',
      name: 'Instant-runoff voting (Hare)',
      statement: String.raw`**Instant-runoff voting** (the alternative vote, the Hare system; “ranked-choice voting” in the US) uses ranked ballots. Count every ballot for its highest-ranked *continuing* candidate. If one candidate has a majority of these continuing ballots she wins; otherwise the candidate with the fewest votes is eliminated, each of her ballots is transferred to the next continuing candidate it ranks, and the count is repeated. With $m$ candidates there are at most $m - 1$ rounds. A ballot that ranks no continuing candidate is *exhausted* and leaves the count. Several trailing candidates may be eliminated together when even their combined vote is below the next candidate’s, which cannot change the outcome.`,
      idea: String.raw`IRV is a runoff with up to $m - 1$ rounds instead of one, so votes for a weak candidate are not wasted: they flow to their next choice. A candidate with a majority of first preferences always wins, and with complete ballots IRV never elects a Condorcet loser, because the last round is a head-to-head majority vote between the final two (polsci-1.3). But every elimination looks only at first preferences among the survivors, so a candidate who beats everyone head to head can be eliminated early. IRV is also not monotone (polsci-2.5). Burlington, Vermont, used IRV for mayor in 2009. Kurt Wright led round 1 with 2,951 of 8,980 ballots. Dan Smith, James Simpson and the write-ins were eliminated together, then Andy Montroll, and Bob Kiss won the final round 4,313 to 4,061. Yet Montroll was preferred to Kiss by 4,067 voters to 3,477 and to Wright by 4,597 to 3,668. The Condorcet winner had been eliminated, and the city repealed IRV by referendum in March 2010.`,
      caption: String.raw`Step through the rounds, or let them play. Each column is a round of counting. A band carries ballots from the candidate who held them to the one who holds them next: pale bands are ballots staying put, coloured fans are the transfers from the eliminated candidate (✗). Edit the electorate on the right — drag bars, click letters to move them up — and the count reruns. *Burlington 2009* draws the official round totals of that mayoral election. Smith and two minor candidates are merged into one node, since they were eliminated together.`,
      deps: ['polsci-1.3'],
      see: ['polsci-2.5', 'polsci-2.13'],
      refs: ['T&P ch. 1', 'Wikipedia: 2009 Burlington mayoral election'],
      tags: ['instant runoff', 'ranked-choice voting'],
      credit: 'Carl Andræ (1855) and Thomas Hare (1857) as the transferable vote; single-winner form W. R. Ware, 1870s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Instant-runoff_voting' },
      viz(v) {
        const Sk = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 430, weight: 1.45, title: 'rounds of counting: who holds each ballot' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 330, title: 'ballots' });
        const P = mkProfile(5, [[5, 'ABECD'], [6, 'BCEAD'], [2, 'CADEB'], [9, 'DEBAC'], [4, 'DCEAB'], [5, 'EABCD']]);
        const data = v.select('data', [{ value: 'ed', label: 'editable electorate' }, { value: 'bur', label: 'Burlington 2009 (official count)' }], 'ed', { onChange: () => { E.el.hidden = data.value === 'bur'; S.reset({ at: 'end' }); } });
        // Burlington, Vermont, mayoral election, 3 March 2009: official IRV rounds (8,980 ballots)
        const BUR = (() => {
          const K = { id: 'K', label: 'Kiss', color: 'purple' }, M = { id: 'M', label: 'Montroll', color: 'blue' }, Wr = { id: 'W', label: 'Wright', color: 'orange' };
          const O = { id: 'O', label: 'Smith +2 others', color: 'teal' }, X = { id: 'X', label: 'exhausted', color: 'gray' };
          const col = (spec) => spec.map(([nd, val, extra]) => ({ ...nd, value: val, ...extra }));
          return {
            cols: [col([[K, 2585], [M, 2063], [Wr, 2951], [O, 1381, { text: 'red', out: true }]]), col([[K, 2981], [M, 2554, { text: 'red', out: true }], [Wr, 3294], [X, 151]]), col([[K, 4313, { text: 'green', win: true }], [Wr, 4061], [X, 606]])],
            flows: [
              [['K', 'K', 2585], ['M', 'M', 2063], ['W', 'W', 2951], ['O', 'K', 396], ['O', 'M', 491], ['O', 'W', 343], ['O', 'X', 151]],
              [['K', 'K', 2981], ['W', 'W', 3294], ['M', 'K', 1332], ['M', 'W', 767], ['M', 'X', 455], ['X', 'X', 151]],
            ],
            notes: [
              'Round 1: 8,980 ballots. Wright leads with 2,951 (32.9%), short of a majority. Smith (1,306), Simpson (35) and the write-ins (40) are eliminated together: even combined (1,381) they trail Montroll’s 2,063.',
              'Round 2: their 1,381 ballots move on — 396 to Kiss, 491 to Montroll, 343 to Wright — and 151 rank none of the three (exhausted). Still no majority: Montroll, with 2,554, is eliminated.',
              'Round 3: Montroll’s 2,554 ballots split 1,332 to Kiss, 767 to Wright, 455 exhausted. Kiss wins 4,313 to 4,061, 51.5% of the 8,374 continuing ballots — but Montroll beat both finalists head to head.',
            ],
          };
        })();
        function model() {
          if (data.value === 'bur') {
            const fl = BUR.flows.map((f) => f.map(([a, b, val]) => ({ from: a, to: b, value: val, color: BUR.cols[0].concat(BUR.cols[1]).find((nd) => nd.id === a).color })));
            return { cols: BUR.cols, flows: fl, frames: BUR.notes.map((note, k) => ({ k: k + 1, note })), bur: true };
          }
          const I = irv(P), R = I.rounds;
          const cols = R.map((Rd, k) => Rd.alive.map((c) => ({ id: c, label: LET[c], color: CC[c], value: Rd.counts[c], text: Rd.out === c ? 'red' : k === R.length - 1 && I.win.includes(c) ? 'green' : 'ink', out: Rd.out === c, win: k === R.length - 1 && I.win.includes(c) })));
          const flows = R.slice(0, -1).map((Rd) => [...Rd.flows].map(([key, val]) => { const [a, b] = key.split('>'); return { from: +a, to: b === 'x' ? 'x' : +b, value: val, color: CC[+a] }; }));
          const frames = R.map((Rd, k) => {
            const lead = Rd.alive.reduce((a, b) => (Rd.counts[b] > Rd.counts[a] ? b : a));
            let note = `Round ${k + 1}: ${Rd.alive.map((c) => `${LET[c]} ${Rd.counts[c]}`).join(', ')}. `;
            if (k > 0) { const prev = R[k - 1], moved = [...prev.flows].filter(([key]) => +key.split('>')[0] === prev.out).map(([key, val]) => `${val} to ${LET[+key.split('>')[1]]}`); note = `${LET[prev.out]}’s ${prev.counts[prev.out]} ballots moved: ${moved.join(', ')}. ` + note; }
            note += Rd.out != null ? `No majority (${LET[lead]} has ${Rd.counts[lead]} ≤ ${Rd.cont / 2}); ${LET[Rd.out]} has the fewest and is eliminated.` : `**${LET[I.win[0]]}** has a majority (${Rd.counts[I.win[0]]} of ${Rd.cont}) and wins.`;
            return { k: k + 1, note };
          });
          return { cols, flows, frames };
        }
        const ed = blocEditor(v, E, P, { max: 12, rank: true, onEdit: () => S.reset({ at: 'end' }) });
        const S = v.steps({ frames: () => model().frames, autoplay: true, speed: 0.8, transition: 0.8, start: 0, still: 'end', counter: 'round' });
        v.render(() => {
          if (data.value !== 'bur') ed.draw();
          const M = model(), c = Sk.ctx, W = Sk.width, H = Sk.height, K = M.cols.length, k = S.frame.k || K;
          const left = M.bur ? 156 : 46, right = M.bur ? 112 : 62;
          const box = [left, 30, W - right, H - 12];
          const colX = (j) => box[0] + (K === 1 ? 0 : (j * (box[2] - box[0] - 14)) / (K - 1));
          for (let j = 0; j < K; j++) txt(v, c, `round ${j + 1}`, colX(j) + 7, 13, { size: 11, weight: 600, color: j < k ? 'muted' : 'faint' });
          drawSankey(v, Sk, M.cols, M.flows, box, {
            upto: k - 1 + S.tween, colX,
            labels: (nd, j) => `${M.bur && j === 0 ? nd.label + ' ' : M.bur ? nd.label + ' ' : nd.label + ' '}${M.bur ? fmtN(nd.value) : nd.value}${nd.out ? ' ✗' : ''}${nd.win ? ' wins' : ''}`,
          });
        });
        v.readout(() => {
          if (data.value === 'bur') return 'Burlington 2009, official count: Wright 2,951 → 3,294 → 4,061; Kiss 2,585 → 2,981 → **4,313**; Montroll 2,063 → 2,554 (eliminated). Head to head Montroll beats Kiss 4,067–3,477 and Wright 4,597–3,668 (Bolson’s tabulation of the ballot file; Wikipedia gives 4,064–3,476 for Montroll–Kiss), so IRV eliminated the Condorcet winner.';
          const I = irv(P), C = condorcet(P), pl = plurality(P).win, R = I.rounds;
          let s = `IRV elects **${names(I.win)}** after ${R.length} round${R.length > 1 ? 's' : ''} (elimination order ${R.filter((Rd) => Rd.out != null).map((Rd) => LET[Rd.out]).join(', ') || '—'}); plurality would elect ${names(pl)}. `;
          if (C.winner >= 0) {
            const outAt = R.findIndex((Rd) => Rd.out === C.winner);
            s += outAt >= 0 ? `The Condorcet winner **${LET[C.winner]}** was eliminated in round ${outAt + 1} with ${R[outAt].counts[C.winner]} votes, although it beats every rival head to head.` : `IRV found the Condorcet winner ${LET[C.winner]}.`;
          } else s += 'There is no Condorcet winner here.';
          return s;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'The Borda count',
      statement: String.raw`With $m$ candidates, the **Borda count** gives a candidate $m - 1$ points for each ballot that ranks her first, $m - 2$ for each second place, …, and $0$ for last; the highest total wins. Equivalently, the Borda score is the sum of the candidate’s pairwise tallies,
$$B(x) = \sum_{y \ne x} N(x, y),$$
because a ballot that ranks $x$ in position $k$ puts her above exactly $m - k$ rivals. Consequently, swapping two adjacent candidates on the ballots of $k$ voters raises the one moved up by exactly $k$ points, lowers the other by $k$, and leaves every other score unchanged. The scores always total $n\binom m2$.`,
      idea: String.raw`Counting points by position is the same as counting the pairwise contests each candidate wins on each ballot — the identity $B(x) = \sum_y N(x, y)$ double-counts (comb-1.4) the pairs (ballot, rival placed below $x$). So Borda is both a positional rule (polsci-1.10) and a pairwise one. It rewards being broadly acceptable rather than many voters’ favourite, so it can overturn a plurality winner whom many voters rank last. It never elects a Condorcet loser (polsci-2.4), but it can pass over a Condorcet winner. It is also easy to manipulate by burying a strong rival at the bottom of one’s ballot.`,
      caption: String.raw`The small numbers under each ballot are the points it gives. On the right, each candidate’s column stacks the points from every bloc (voters × points), counted bloc by bloc. Click a letter to move it up one place: the dashed ghost shows the old score, and exactly two columns move, each by the size of the bloc. The matrix beside the stacks checks that each Borda score is a row sum of the pairwise tallies.`,
      deps: ['polsci-1.1', 'comb-1.4'],
      refs: ['T&P ch. 1', 'Saari, Chaotic Elections!'],
      tags: ['Borda count', 'scoring rules'],
      credit: 'Jean-Charles de Borda, 1770 (published 1784); anticipated by Nicholas of Cusa, 1433',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Borda_count' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 360, title: 'ballots and the points they give' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 420, weight: 1.1, title: 'Borda points stacked by bloc · the pairwise matrix' });
        const P = mkProfile(4, [[9, 'ABDC'], [8, 'ACBD'], [7, 'BCDA'], [7, 'CBDA'], [5, 'DBAC']]);
        let last = borda(P), prev = null, base = null, msg = '';
        const ed = blocEditor(v, E, P, {
          max: 12, rank: true, note: (b, k) => String(P.m - 1 - k),
          onEdit: (kind, i, k) => {
            if (kind === 'rank') { prev = last.slice(); const b = P.blocs[i], up = LET[b.r[k - 1]], dn = LET[b.r[k]]; msg = `in the bloc of ${b.n}, ${up} moved above ${dn}: ${up} +${b.n}, ${dn} −${b.n}, the others unchanged`; }
            else if (kind === 'size') { if (!base) base = last.slice(); prev = base; msg = 'bloc size changed: each candidate moves by (points from that ballot) × (change in size)'; }
            else if (kind === 'size-end') base = null;
          },
        });
        const DUR = 2.6;
        v.animate((t) => {
          ed.draw();
          const c = B.ctx, W = B.width, H = B.height, m = P.m, sc = borda(P), N = pairwise(P), nb = P.blocs.length;
          const p = t >= DUR ? nb : (clamp(t, 0, DUR) / DUR) * nb;
          const split = W * 0.6, ymax = Math.max(...sc, ...(prev || [0])) * 1.14 + 1;
          const F = colFrame([34, 26, split - 6, H - 34], m, ymax), bw = Math.min(F.w * 0.6, 50);
          // axis ticks
          for (let yv = 0; yv <= ymax; yv += ymax > 90 ? 20 : 10) { hlinePx(v, c, 30, split - 6, F.Y(yv), 'grid', null, 1); txt(v, c, String(yv), 26, F.Y(yv), { size: 9.5, color: 'muted', align: 'right', weight: 500 }); }
          const win = best(sc, range(m));
          range(m).forEach((x) => {
            const X = F.X(x); let acc = 0;
            P.blocs.forEach((b, i) => {
              const u = clamp(p - i, 0, 1); if (u <= 0) return;
              const pts = (m - 1 - b.r.indexOf(x)) * b.n * u; if (pts <= 0) return;
              const y0 = F.Y(acc), y1 = F.Y(acc + pts);
              c.fillStyle = v.color(CC[x], i % 2 ? 0.45 : 0.78); c.fillRect(X - bw / 2, y1, bw, y0 - y1);
              c.strokeStyle = v.color('panel'); c.lineWidth = 1.2; c.strokeRect(X - bw / 2, y1, bw, y0 - y1);
              if (y0 - y1 > 14 && u >= 1) txt(v, c, `${b.n}×${m - 1 - b.r.indexOf(x)}`, X, (y0 + y1) / 2, { size: 9.5, weight: 700, color: 'panel' });
              acc += pts;
            });
            const done = p >= nb;
            if (done && prev && Math.abs(prev[x] - sc[x]) > 1e-9) {
              c.save(); c.setLineDash([4, 3]); c.strokeStyle = v.color('ink', 0.7); c.lineWidth = 1.3; c.strokeRect(X - bw / 2 - 3, F.Y(prev[x]), bw + 6, F.base - F.Y(prev[x])); c.restore();
              const d = sc[x] - prev[x];
              txt(v, c, `${d > 0 ? '+' : '−'}${Math.abs(d)}`, X + bw / 2 + 4, F.Y(Math.max(prev[x], sc[x])) - 2, { size: 11, weight: 700, color: d > 0 ? 'green' : 'red', align: 'left', halo: true });
            }
            txt(v, c, String(Math.round(acc)), X, F.Y(acc) - 9, { size: 12.5, weight: 700, halo: true });
            chip(v, c, X, F.base + 16, x, { r: 10, ring: done && win.length === 1 && win[0] === x ? 'gold' : null });
            if (done && win.length === 1 && win[0] === x) winTag(v, c, X, F.Y(Math.max(acc, prev ? prev[x] : 0)) - 27);
          });
          hlinePx(v, c, 30, split - 6, F.base, 'muted', null, 1);
          // pairwise matrix with row sums
          const Mx = drawMatrix(v, B, N, [split + 4, 30, W - 34, H - 40], { maxCell: 34 });
          txt(v, c, 'Σ', Mx.X0 + Mx.m * Mx.cs + 16, Mx.Y0 - 14, { size: 12, weight: 700, color: 'muted' });
          range(m).forEach((x) => txt(v, c, String(sum(N[x])), Mx.X0 + Mx.m * Mx.cs + 16, Mx.Y0 + (x + 0.5) * Mx.cs, { size: 12, weight: 700, color: CC[x] }));
          txt(v, c, 'row sums = Borda scores', (Mx.X0 + Mx.X0 + Mx.m * Mx.cs) / 2, Mx.Y0 + Mx.m * Mx.cs + 14, { size: 10, weight: 600, color: 'muted' });
          last = sc;
        }, { period: DUR + 0.5, once: true, still: DUR + 0.5 });
        v.readout(() => {
          const sc = borda(P), m = P.m, n = total(P), win = best(sc, range(m)), pl = plurality(P), N = pairwise(P);
          const ok = range(m).every((x) => Math.abs(sum(N[x]) - sc[x]) < 1e-9);
          return `Borda scores ${range(m).map((x) => `${LET[x]} ${sc[x]}`).join(', ')} (total ${sum(sc)} = $n\\binom{${m}}{2}$ = ${n}·${(m * (m - 1)) / 2}) → **${names(win)}** wins; plurality would elect ${names(pl.win)} (${Math.max(...pl.scores)} first places). Row sums of the pairwise matrix ${ok ? 'equal' : 'differ from'} the Borda scores ${ok ? '✓' : '✗'}.` + (msg ? ` Last edit: ${msg}.` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Condorcet winners and Condorcet methods',
      statement: String.raw`A **Condorcet winner** is a candidate $x$ who beats every other candidate in a head-to-head majority vote: $N(x, y) > N(y, x)$ for all $y \ne x$. There is at most one, and there may be none (polsci-2.1). A **Condorcet loser** loses to every rival. A voting rule is **Condorcet-consistent** — a *Condorcet method* — if it elects the Condorcet winner whenever one exists.

Two classical Condorcet methods also decide when there is no Condorcet winner. **Copeland**’s rule elects the candidate with the most pairwise wins (a tie counts ½). The **minimax** rule (Simpson–Kramer) elects the candidate whose largest pairwise opposition $\max_{y} N(y, x)$ is smallest.

The majority relation is drawn as a *tournament*: a directed graph with an arrow $x \to y$ whenever $x$ beats $y$. The **Smith set** (top cycle) is the smallest set of candidates who all beat everyone outside it; a Condorcet winner exists exactly when the Smith set has one member.`,
      idea: String.raw`Condorcet’s idea is to treat an election as a collection of two-candidate elections, each settled by majority rule (polsci-3.1). Plurality, the runoff, IRV and Borda are not Condorcet-consistent: each can pass over a candidate who beats every rival, as with the centre squeeze in polsci-1.3 and Burlington 2009 in polsci-1.4. When majorities cycle there is no Condorcet winner, and a method must decide how to break the cycle. Copeland counts wins, minimax looks for the mildest worst defeat, and Kemeny’s rule (polsci-1.11) reverses the fewest individual preferences. Copeland is coarse: in a four-candidate tournament with no Condorcet winner the win counts are $(2, 2, 2, 0)$ or $(2, 2, 1, 1)$, so it always ties at the top.`,
      caption: String.raw`In the tournament an arrow $x \to y$ means a majority ranks $x$ above $y$, labelled with the tally or the margin. A green ring marks the Condorcet winner. In the starting electorate it is E, whom only 3 voters rank first. Switch to *a majority cycle*: now there is none. The red arrows trace one cycle of majorities, all five candidates are in the top cycle, and Copeland (gold ring; win counts in the node notes) and minimax pick different candidates — and plurality and Borda two more. Drag bars, click letters, or drag the nodes.`,
      deps: ['polsci-1.1'],
      see: ['polsci-2.1', 'polsci-3.1'],
      refs: ['T&P ch. 1'],
      tags: ['Condorcet', 'pairwise majority', 'tournaments'],
      credit: 'Marquis de Condorcet, 1785; Copeland 1951; Simpson 1969 and Kramer 1977 (minimax)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Condorcet_winner_criterion' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 380, title: 'ballots' });
        const Gs = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 290, minWidth: 340, title: 'majority tournament: x → y when a majority prefers x to y' });
        const Ms = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 220, full: true, title: 'pairwise tallies and two Condorcet methods' });
        const PRE = {
          win: mkProfile(5, [[9, 'AEBCD'], [5, 'AECDB'], [7, 'BEDCA'], [3, 'CEBDA'], [4, 'DBCEA'], [3, 'EBCAD']]),
          cyc: mkProfile(5, [[3, 'AECBD'], [8, 'BEADC'], [6, 'BDACE'], [5, 'CDABE'], [3, 'DECAB'], [4, 'EDACB']]),
        };
        const P = copyProfile(PRE.win);
        v.select('electorate', [{ value: 'win', label: 'a Condorcet winner' }, { value: 'cyc', label: 'a majority cycle' }], 'win', { onChange: (val) => setProfile(P, PRE[val]) });
        const lab = v.select('arrow labels', [{ value: 'tally', label: 'tallies' }, { value: 'margin', label: 'margins' }], 'tally');
        const ed = blocEditor(v, E, P, { max: 12, rank: true });
        const POS = ['n', 'e', 'se', 'sw', 'w'];
        const nodes = range(5).map((c) => ({ id: c, label: LET[c], x: 0.88 * Math.sin((2 * Math.PI * c) / 5), y: 0.88 * Math.cos((2 * Math.PI * c) / 5), notePos: POS[c] }));
        const G = v.graph(Gs, { nodes, edges: [], directed: true, layout: 'none', r: 15, fontSize: 13 });
        v.render(() => {
          ed.draw();
          const N = pairwise(P), C = condorcet(P, N);
          // one majority cycle (a 3-cycle exists whenever there is no Condorcet winner), through the Copeland leader if possible
          let cyc3 = null;
          if (C.winner < 0) {
            const order = [C.copWin[0], ...range(5).filter((x) => x !== C.copWin[0])];
            outer: for (const x of order) for (const y of range(5)) for (const z of range(5)) if (x !== y && y !== z && x !== z && C.beats(x, y) && C.beats(y, z) && C.beats(z, x)) { cyc3 = [x, y, z]; break outer; }
          }
          const onCyc = (a, b) => !!cyc3 && [0, 1, 2].some((k) => cyc3[k] === a && cyc3[(k + 1) % 3] === b);
          const edges = [];
          for (let x = 0; x < 5; x++) for (let y = x + 1; y < 5; y++) {
            const a = N[x][y], b = N[y][x];
            if (a === b) { edges.push({ from: x, to: y, directed: false, dash: [4, 3], label: `${a}–${b}` }); continue; }
            const [w, l, p, q] = a > b ? [x, y, a, b] : [y, x, b, a];
            edges.push({ from: w, to: l, label: lab.value === 'tally' ? `${p}–${q}` : `+${p - q}`, inCycle: onCyc(w, l) });
          }
          G.edges = edges;
          G.draw({
            nodeFill: (id) => CC[id],
            nodeRing: (id) => (C.winner === id ? 'green' : C.winner < 0 && C.copWin.length === 1 && C.copWin[0] === id ? 'gold' : null),
            edgeColor: (e) => (e.inCycle ? 'red' : null),
            edgeWidth: (e) => (e.inCycle ? 2.2 : null),
            edgeLabel: (e) => e.label,
            nodeNote: (id) => `${C.copeland[id]} win${C.copeland[id] === 1 ? '' : 's'}`,
            noteColor: 'muted',
          });
          // matrix + method table
          const c = Ms.ctx, W = Ms.width, H = Ms.height;
          drawMatrix(v, Ms, N, [8, 6, W * 0.5, H - 6], { maxCell: 34, outline: (i, j) => (C.winner === i ? 'green' : null) });
          const x0 = W * 0.53, cw = (W - x0 - 10) / 4, rowH = Math.min(30, (H - 30) / 6.4), y0 = (H - rowH * 6.4) / 2 + rowH * 0.7;
          const heads = [['', 'candidate'], ['', 'first places'], ['Copeland', 'pairwise wins'], ['minimax', 'worst opposition']];
          heads.forEach(([h1, h2], j) => { txt(v, c, h1, x0 + (j + 0.5) * cw, y0 - 7, { size: 10.5, weight: 700, color: 'ink' }); txt(v, c, h2, x0 + (j + 0.5) * cw, y0 + 7, { size: 10, weight: 600, color: 'muted' }); });
          const tp = tops(P);
          range(5).forEach((x, i) => {
            const Y = y0 + (i + 1.4) * rowH;
            if (i % 2 === 0) { c.fillStyle = v.color('muted', 0.05); c.fillRect(x0, Y - rowH / 2, W - x0 - 10, rowH); }
            chip(v, c, x0 + 0.5 * cw, Y, x, { r: 9.5, ring: C.winner === x ? 'green' : null });
            txt(v, c, String(tp[x]), x0 + 1.5 * cw, Y, { size: 12.5, weight: 600 });
            const cw1 = C.copWin.includes(x), mm1 = C.mmWin.includes(x);
            txt(v, c, String(C.copeland[x]), x0 + 2.5 * cw, Y, { size: 12.5, weight: cw1 ? 800 : 500, color: cw1 ? 'gold' : 'ink' });
            txt(v, c, String(C.minimax[x]), x0 + 3.5 * cw, Y, { size: 12.5, weight: mm1 ? 800 : 500, color: mm1 ? 'gold' : 'ink' });
          });
        });
        v.legend([['green', 'Condorcet winner', { dot: true }], ['gold', 'Copeland / minimax choice', { dot: true }], ['red', 'a majority cycle']]);
        v.readout(() => {
          const N = pairwise(P), C = condorcet(P, N), n = total(P), pl = plurality(P).win, bo = best(borda(P), range(5));
          if (C.winner >= 0) {
            const x = C.winner, rest = range(5).filter((y) => y !== x).map((y) => `${LET[y]} ${N[x][y]}–${N[y][x]}`).join(', ');
            return `Condorcet winner **${LET[x]}**: beats ${rest} — with ${tops(P)[x]} of ${n} first places. Copeland and minimax agree (${names(C.copWin)}, ${names(C.mmWin)}), as every Condorcet method must; plurality elects ${names(pl)}, Borda ${names(bo)}.` + (C.loser >= 0 ? ` Condorcet loser: ${LET[C.loser]}.` : '');
          }
          return `No Condorcet winner: the top cycle (Smith set) is {${C.smith.map((x) => LET[x]).join(', ')}}. Copeland elects **${names(C.copWin)}** (${Math.max(...C.copeland)} wins); minimax elects **${names(C.mmWin)}** (worst opposition ${Math.min(...C.minimax)} of ${n}). Plurality: ${names(pl)}; Borda: ${names(bo)}.`;
        });
      },
    },
  ],
};
