// Political Science & Social Choice — Chapter 2: Voting paradoxes and fairness criteria
import {
  CC, LET, sum, range, clamp, perms, mkProfile, copyProfile, setProfile, total, rkStr, best, names,
  tops, pairwise, borda, irv, condorcet, spatialProfile, rr, txt, chip, winTag, blocEditor,
} from './ch01.shared.js';
import {
  pairwiseT, cwOf, irvW, irvRun, RULES, cloneP, raise, shift, addGroup, randomProfile, tidy,
  monoFail, noShowFail, arrowPx, drawTourney, pill, fmtK, drawIRV,
} from './ch02.shared.js';

// ---------- local helpers
function hlinePx(v, c, x0, x1, Y, col, dash, w = 1.3) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, Math.round(Y) + 0.5); c.lineTo(x1, Math.round(Y) + 0.5); c.stroke(); c.restore();
}
function vlinePx(v, c, X, y0, y1, col, dash, w = 1.3) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(Math.round(X) + 0.5, y0); c.lineTo(Math.round(X) + 0.5, y1); c.stroke(); c.restore();
}
const pct = (a, n, d = 0) => `${((100 * a) / (n || 1)).toFixed(d)}%`;
const ord = (k) => ['first', 'second', 'third', 'fourth', 'fifth'][k];
/** Pixel positions of m candidates on a circle (first at the top, clockwise). */
const ring = (m, cx, cy, R, rot = 0) => range(m).map((k) => [cx + R * Math.sin((2 * Math.PI * k) / m + rot), cy - R * Math.cos((2 * Math.PI * k) / m + rot)]);
/** Candidate y that beats x by the largest margin (−1 if none). */
function beaterOf(N, x) { let b = -1; for (let y = 0; y < N.length; y++) if (y !== x && N[y][x] > N[x][y] && (b < 0 || N[y][x] - N[x][y] > N[b][x] - N[x][b])) b = y; return b; }
/** Majority order around a 3-cycle, starting from A: [0, beaten by 0, …]. */
function cycle3(N) { const a = 0, b = N[0][1] > N[1][0] ? 1 : 2, c = 3 - b; return N[b][c] > N[c][b] && N[c][a] > N[a][c] ? [a, b, c] : null; }
/** Small horizontal bar rows of one IRV count (pixels); returns the height used. */
function irvRows(v, c, P, x0, y0, w, rowH, o = {}) {
  const I = irv(P), mx = Math.max(...I.rounds.map((R) => Math.max(...R.counts))), lab = 44;
  I.rounds.forEach((Rd, k) => {
    const Y = y0 + k * rowH;
    txt(v, c, `round ${k + 1}`, x0, Y + rowH / 2 - 2, { size: 10.5, weight: 600, color: 'muted', align: 'left' });
    let X = x0 + lab;
    const bw = (w - lab - 6) / P.m;
    range(P.m).forEach((cand) => {
      const alive = Rd.alive.includes(cand), val = Rd.counts[cand], h = rowH - 10, L = alive ? (val / mx) * (bw - 26) : 0;
      chip(v, c, X + 9, Y + rowH / 2 - 2, cand, { r: 8, alpha: alive ? 1 : 0.25, strike: !alive, ring: k === I.rounds.length - 1 && I.win.includes(cand) ? 'gold' : null });
      if (alive) {
        rr(c, X + 20, Y + 4, Math.max(2, L), h - 4, 3); c.fillStyle = v.color(CC[cand], Rd.out === cand ? 0.25 : 0.6); c.fill();
        if (Rd.out === cand) { c.strokeStyle = v.color('red'); c.lineWidth = 1.4; c.setLineDash([3, 2]); c.stroke(); c.setLineDash([]); }
        txt(v, c, String(val) + (Rd.out === cand ? ' ✗' : ''), X + 24 + Math.max(2, L), Y + rowH / 2 - 2, { size: 10.5, weight: 700, align: 'left', color: Rd.out === cand ? 'red' : 'ink', halo: true });
      }
      X += bw;
    });
  });
  return { I, h: I.rounds.length * rowH };
}

export default {
  collection: 'polsci',
  chapter: 2,
  title: 'Voting paradoxes and fairness criteria',
  summary: String.raw`Majority rule over three or more options can cycle, so there may be no candidate that a majority prefers to every other — and under random preferences this happens often. Every voting method then fails some reasonable criterion: plurality can elect a candidate everyone else beats, the Borda count can pass over a Condorcet winner, instant runoff can punish a candidate for gaining support or a group of voters for turning out, and Moulin’s theorem shows that every Condorcet method has a no-show paradox too. Agendas give the chair power over a cycle, sophisticated voting can turn the chair’s tie-breaking vote against her, Saari’s geometry singles out Borda among positional rules, and compound issues and aggregated judgments produce majorities that contradict themselves. Real elections — Florida 2000, Burlington 2009, Alaska 2022 — show the paradoxes on official ballots.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Paradox',
      name: 'Condorcet’s paradox (cyclic majorities)',
      statement: String.raw`Individual rankings are transitive, but the majority relation built from them need not be. With three voters ranking
$$A \succ_1 B \succ_1 C, \qquad B \succ_2 C \succ_2 A, \qquad C \succ_3 A \succ_3 B,$$
two of the three voters prefer $A$ to $B$, two prefer $B$ to $C$, and two prefer $C$ to $A$: the majorities form a cycle $A \to B \to C \to A$, and there is no Condorcet winner. Whatever is chosen, a majority prefers something else. The same happens in any electorate in which the three cyclic rankings carry enough weight; with three candidates and an odd number of voters, “no Condorcet winner” and “a majority cycle” are the same thing.`,
      idea: String.raw`Each pairwise majority is decided by a different coalition: $\{1, 3\}$ for $A$ over $B$, $\{1, 2\}$ for $B$ over $C$, $\{2, 3\}$ for $C$ over $A$. Every voter is in two of the three coalitions, so each voter agrees with two of the majorities and is outvoted on the third — and the third is exactly the one that closes the cycle. The three ballots form a *Latin square*: each candidate is first, second and third once, so every positional rule ties them too. A cycle is fragile in one sense — reversing its weakest majority, with margin $d$, needs only $\lfloor d/2 \rfloor + 1$ voters to change their minds — and robust in another: it survives in large electorates whenever the cyclic part of the profile outweighs the rest (polsci-2.2). It is the root of agenda power (polsci-2.8) and of Arrow’s theorem (polsci-3.3).`,
      caption: String.raw`The tournament is rock–paper–scissors: each candidate beats one rival and loses to the other. Click a candidate to propose it as the winner. The icon array below lights up the voters who prefer another candidate, and they are always a majority. Drag the bars to change how many voters hold each of the six rankings. The readout says how many voters would have to change their minds to break the cycle. Start from *three voters* or from a *60-voter* electorate.`,
      deps: ['polsci-1.6'],
      see: ['polsci-2.2', 'polsci-2.8', 'polsci-3.3'],
      refs: ['T&P ch. 1', 'Shepsle: group decisions'],
      tags: ['Condorcet paradox', 'majority cycles'],
      credit: 'Marquis de Condorcet, Essai sur l’application de l’analyse, 1785',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Condorcet_paradox' },
      viz(v) {
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 340, title: 'ballots: voters holding each ranking' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 320, title: 'majority tournament · click a candidate to propose it' });
        const Ic = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 160, full: true, title: 'the voters' });
        const R6 = perms(3);
        const PRE = { three: { c: [1, 0, 0, 1, 1, 0], max: 6 }, sixty: { c: [23, 0, 2, 17, 10, 8], max: 30 } };
        let pre = 'three', sel = 0, pos = null;
        const P = { m: 3, blocs: R6.map((r, k) => ({ n: PRE.three.c[k], r: r.slice() })) };
        v.select('electorate', [{ value: 'three', label: 'three voters' }, { value: 'sixty', label: '60 voters' }], 'three', { onChange: (val) => { pre = val; PRE[val].c.forEach((n, k) => { P.blocs[k].n = n; }); } });
        const ed = blocEditor(v, E, P, { max: () => PRE[pre].max, rowMax: 40, hint: 'ranking (best → worst) · drag a bar' });
        const I = v.icons(Ic, { order: 'index', tween: 500, maxCell: 56 });
        G.onClick((x, y) => {
          if (!pos) return; const X = G.X(x), Y = G.Y(y);
          const k = pos.findIndex((p) => Math.hypot(p[0] - X, p[1] - Y) < 32); if (k >= 0) sel = k;
        });
        v.render(() => {
          ed.draw();
          const N = pairwise(P), C = condorcet(P, N), n = total(P), cyc = cycle3(N) || (() => { const t = [0, 2, 1]; return N[0][2] > N[2][0] && N[2][1] > N[1][2] && N[1][0] > N[0][1] ? t : null; })();
          const c = G.ctx, W = G.width, H = G.height, R = Math.min(W * 0.3, H * 0.33), cx = W / 2, cy = H / 2 + 14;
          pos = ring(3, cx, cy, R);
          const by = beaterOf(N, sel);
          drawTourney(v, c, N, [0, 1, 2], pos, {
            r: 21, bend: cyc ? -R * 0.18 : 0,
            color: (w, l) => (cyc ? 'red' : C.winner === w ? 'green' : null), width: (w, l) => (w === by && l === sel ? 4 : cyc ? 2.6 : 2),
            ring: (x) => (x === sel ? 'gold' : C.winner === x ? 'green' : null),
          });
          if (cyc) {
            const role = {}; role[cyc[0]] = 'rock'; role[cyc[1]] = 'scissors'; role[cyc[2]] = 'paper';
            pos.forEach((p, k) => txt(v, c, role[k], p[0], p[1] + (k === 0 ? -34 : 35), { size: 11, weight: 600, color: 'muted' }));
            txt(v, c, `${LET[cyc[0]]} → ${LET[cyc[1]]} → ${LET[cyc[2]]} → ${LET[cyc[0]]}`, cx, cy + 4, { size: 13, weight: 700, color: 'red' });
            txt(v, c, 'a majority cycle', cx, cy + 22, { size: 10.5, weight: 600, color: 'muted' });
          } else txt(v, c, C.winner >= 0 ? `${LET[C.winner]} beats both rivals` : 'a pairwise tie', cx, cy + 6, { size: 12.5, weight: 700, color: C.winner >= 0 ? 'green' : 'muted' });
          txt(v, c, `${n} voter${n === 1 ? '' : 's'}`, 12, 14, { size: 11, weight: 600, color: 'muted', align: 'left' });
          // icon array: one icon per voter, grouped by ballot; the voters who would overturn the proposal are lit
          const bloc = (i) => { let acc = 0; for (const b of P.blocs) { acc += b.n; if (i < acc) return b; } return P.blocs[5]; };
          const rival = by >= 0 ? by : [0, 1, 2].filter((y) => y !== sel).sort((a, b) => (N[sel][a] - N[a][sel]) - (N[sel][b] - N[b][sel]))[0]; // otherwise the closest rival
          const lit = (i) => { const b = bloc(i); return b.r.indexOf(rival) < b.r.indexOf(sel); };
          const groups = P.blocs.map((b) => ({ n: b.n, color: CC[b.r[0]], label: rkStr(b.r) }));
          I.set({ n, groups, block: rival >= 0 ? (i) => (lit(i) ? 0 : 1) : null,
            blockLabels: (k, cnt) => (k === 0 ? `prefer ${LET[rival]} to ${LET[sel]} (${cnt})` : `prefer ${LET[sel]} to ${LET[rival]} (${cnt})`) });
          I.draw({ dim: by >= 0 ? (i) => !lit(i) : null });
          if (by >= 0) Ic.setTitle(`propose ${LET[sel]}: the ${N[by][sel]} highlighted voters (of ${n}) prefer ${LET[by]} — a majority overturns ${LET[sel]}`);
          else Ic.setTitle(`propose ${LET[sel]}: no majority prefers any rival — ${LET[sel]} is the Condorcet winner`);
        });
        v.legend([['red', 'majority cycle'], ['gold', 'proposed candidate', { dot: true }], ['green', 'Condorcet winner', { dot: true }]]);
        v.readout(() => {
          const N = pairwise(P), n = total(P), C = condorcet(P, N);
          const pairs = [[0, 1], [1, 2], [0, 2]].map(([x, y]) => (N[x][y] >= N[y][x] ? [x, y] : [y, x]));
          const txtP = pairs.map(([w, l]) => `${LET[w]} over ${LET[l]} ${N[w][l]}–${N[l][w]}`).join(', ');
          if (C.winner >= 0) return `Majorities: ${txtP}. **${LET[C.winner]}** is the Condorcet winner — no cycle. A cycle needs the three cyclic ballots ${'(ABC, BCA, CAB or ACB, CBA, BAC)'} to outweigh the rest.`;
          if (pairs.some(([w, l]) => N[w][l] === N[l][w])) return `Majorities: ${txtP}. A pairwise tie: no strict cycle and no Condorcet winner.`;
          const weak = pairs.map(([w, l]) => ({ w, l, d: N[w][l] - N[l][w] })).sort((a, b) => a.d - b.d)[0];
          const k = Math.floor(weak.d / 2) + 1;
          return `Majorities: ${txtP} — **a cycle**: whichever candidate is chosen, a majority prefers another. Weakest link: ${LET[weak.w]} over ${LET[weak.l]} by ${weak.d}; if ${k} voter${k > 1 ? 's' : ''} ranking ${LET[weak.w]} above ${LET[weak.l]} swapped the two (each swap moves the margin by 2), that majority would reverse and the cycle would become a transitive order.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'How likely is a Condorcet cycle?',
      statement: String.raw`Under the **impartial culture** each of $n$ voters independently draws one of the $m!$ rankings of $m$ candidates, all equally likely. Let $p(n, m)$ be the probability that there is no Condorcet winner ($n$ odd, so there are no pairwise ties). For three candidates $p(3, 3) = 1/18 \approx 0.056$, $p(n, 3)$ increases with $n$, and
$$\lim_{n\to\infty} p(n, 3) = \frac14 - \frac{3}{2\pi}\arcsin\frac13 \approx 0.0877 \quad\text{(Guilbaud).}$$
For $m$ candidates the limit is
$$p(\infty, m) = 1 - m\int_{-\infty}^{\infty} \varphi(z)\, \Phi\!\left(z/\sqrt2\right)^{m-1} dz,$$
about $0.175$ for $m = 4$, $0.251$ for $m = 5$, $0.369$ for $m = 7$ and $0.489$ for $m = 10$, and it tends to $1$ as $m \to \infty$. If instead every voter’s ranking is single-peaked along a common left–right axis and $n$ is odd, there is always a Condorcet winner, so $p = 0$.`,
      idea: String.raw`Candidate $A$ is the Condorcet winner exactly when its $m - 1$ pairwise margins against the others are all positive, and these events are disjoint for different candidates, so $1 - p = m \cdot P(A \text{ wins all its contests})$. One voter adds $\pm1$ to each of $A$’s margins; two margins agree in sign for $4$ of the $6$ rankings, so they have correlation $\tfrac13$. By the multivariate central limit theorem (prob-3.4.1) the margins divided by $\sqrt n$ become jointly normal with these correlations. Equicorrelated normals can be written $Z_j = \sqrt{\rho}\,Z_0 + \sqrt{1-\rho}\,W_j$ with independent $W_j$; conditioning on $Z_0$ gives the integral, and for $m = 3$ the bivariate orthant formula $\tfrac14 + \arcsin(\rho)/2\pi$ gives Guilbaud’s number. For finite $n$ and $m = 3$ the same reduction is an exact sum over two binomial counts. Impartial culture is a worst case — real electorates are far from uniform — and with single-peaked preferences the median voter’s favourite beats everyone (Black, polsci-4.1).`,
      caption: String.raw`Random electorates are being drawn live. Each gold dot is the share without a Condorcet winner among the samples for that number of voters, with a 95% interval. Left: the dark curve is the exact value for three candidates and the dashed line the $n \to \infty$ limit, which the dots climb towards. Right: the limit for 3 to 10 candidates, with the live estimate at the chosen $n$. Switch the number of candidates on the left, or switch to *single-peaked* voters, who rank candidates by distance from a random point on a line: the dots drop to zero and stay there.`,
      deps: ['polsci-2.1', 'prob-3.4.1'],
      see: ['polsci-4.1'],
      refs: ['T&P ch. 7', 'Gehrlein, Condorcet’s Paradox (2006)'],
      tags: ['Condorcet paradox', 'impartial culture', 'Monte Carlo'],
      credit: 'G.-Th. Guilbaud, 1952; Garman & Kamien and Niemi & Weisberg, 1968',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Condorcet_paradox#Likelihood_of_the_paradox' },
      viz(v) {
        const M = v.M, NS = [3, 5, 7, 9, 15, 25, 51, 101, 201, 501, 1001], MS = [3, 4, 5, 6, 7, 8, 9, 10];
        const L = v.stage({ x: [2.6, 1400], y: [0, 0.13], xlog: true, axes: 'box', gutter: true, height: 320, minWidth: 380, weight: 1.25, xlabel: 'number of voters n (log scale)', ylabel: 'P(no Condorcet winner)', title: 'no Condorcet winner, by electorate size' });
        const Rs = v.stage({ x: [2.4, 10.6], y: [0, 0.62], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'number of candidates m', ylabel: 'P(no Condorcet winner)', xticks: MS, title: 'and by number of candidates' });
        const mSel = v.select('candidates (left)', [3, 4, 5, 7].map((m) => ({ value: m, label: String(m) })), 3, { onChange: () => work(160) });
        const cult = v.select('voters', [{ value: 'ic', label: 'impartial culture' }, { value: 'sp', label: 'single-peaked' }], 'ic', { onChange: () => work(200) });
        const nR = v.select('n (right)', [{ value: 25, label: '25' }, { value: 201, label: '201' }], 201, { onChange: () => work(160) });
        // ---- exact values
        const Phi = (z) => 0.5 * (1 + M.erf(z / Math.SQRT2)), phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
        const LIM = {}; MS.forEach((m) => { let s = 0; const h = 0.01; for (let z = -8; z <= 8; z += h) s += phi(z) * Math.pow(Phi(z / Math.SQRT2), m - 1) * h; LIM[m] = 1 - m * s; });
        const lB = (n, k) => M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1);
        /** Exact p(n, 3): u voters move both of A’s margins together (prob 2/3), the rest move them apart. */
        function exact3(n) {
          let tot = 0;
          for (let u = 0; u <= n; u++) {
            const pu = Math.exp(lB(n, u) + u * Math.log(2 / 3) + (n - u) * Math.log(1 / 3)), w = n - u;
            if (pu < 1e-16) continue;
            const F = new Float64Array(w + 2); let acc = 0; for (let j = 0; j <= w; j++) { acc += Math.exp(lB(w, j) - w * Math.LN2); F[j + 1] = acc; }
            for (let i = 0; i <= u; i++) {
              const X = 2 * i - u; if (X <= 0) continue;
              const jlo = Math.max(0, Math.floor((w - X) / 2) + 1), jhi = Math.min(w, Math.ceil((w + X) / 2) - 1);
              if (jhi < jlo) continue;
              tot += pu * Math.exp(lB(u, i) - u * Math.LN2) * (F[jhi + 1] - F[jlo]);
            }
          }
          return 1 - 3 * tot;
        }
        const EXN = [3, 5, 7, 9, 11, 13, 15, 19, 25, 31, 41, 51, 71, 101, 151, 201, 301, 501, 1001], EX = EXN.map((n) => [n, exact3(n)]), EX3 = new Map(EX);
        // ---- Monte Carlo
        const buckets = new Map(), rng = v.rng(2025), pos = new Int32Array(12), perm = new Int32Array(12), Mx = new Int32Array(144);
        const B = (c, m, n) => { const k = `${c}|${m}|${n}`; let b = buckets.get(k); if (!b) { b = { t: 0, h: 0 }; buckets.set(k, b); } return b; };
        function trial(m, n, c) {
          Mx.fill(0, 0, m * m);
          for (let q = 0; q < n; q++) {
            if (c === 'ic') {
              for (let k = 0; k < m; k++) perm[k] = k;
              for (let k = m - 1; k > 0; k--) { const j = (rng() * (k + 1)) | 0, t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
              for (let k = 0; k < m; k++) pos[perm[k]] = k;
              for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) if (pos[i] < pos[j]) Mx[i * m + j]++;
            } else {
              const u = rng() * m - 0.5; // single-peaked: candidate k sits at k on the axis, the voter at u
              for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) if (u < (i + j) / 2) Mx[i * m + j]++;
            }
          }
          for (let x = 0; x < m; x++) {
            let ok = true;
            for (let y = 0; y < m && ok; y++) if (y !== x) { const a = x < y ? Mx[x * m + y] : n - Mx[y * m + x]; if (2 * a <= n) ok = false; }
            if (ok) return 0;
          }
          return 1;
        }
        const CAP = 40000;
        function work(ms) {
          const c = cult.value, list = NS.map((n) => [mSel.value, n]).concat(MS.map((m) => [m, nR.value]));
          const t0 = Date.now();
          while (Date.now() - t0 < ms) {
            let bm = null, bt = Infinity;
            for (const [m, n] of list) { const b = B(c, m, n); const w = b.t * Math.sqrt(n * m); if (b.t < CAP && w < bt) { bt = w; bm = [m, n, b]; } }
            if (!bm) return;
            const [m, n, b] = bm, k = Math.max(1, Math.floor(30000 / (n * m * m)));
            for (let q = 0; q < k; q++) { b.h += trial(m, n, c); b.t++; }
          }
        }
        work(450);
        const est = (c, m, n) => { const b = B(c, m, n); if (!b.t) return null; const p = b.h / b.t; return { p, e: 1.96 * Math.sqrt(Math.max(p * (1 - p), 0.25 / b.t) / b.t), t: b.t, h: b.h }; };
        v.animate(() => {
          work(9);
          const m = mSel.value, c = cult.value, ymax = Math.max(0.12, LIM[m] * 1.42);
          L.setView([2.6, 1400], [0, ymax]);
          const lim = LIM[m];
          L.hline(lim, { color: 'ink', dash: [6, 4], width: 1.4 });
          L.text(m === 3 ? `n → ∞: ${(100 * lim).toFixed(2)}% (Guilbaud)` : `n → ∞: ${(100 * lim).toFixed(1)}%`, 2.9, lim, { dy: -11, size: 11, weight: 700, align: 'left', color: 'ink' });
          if (m === 3) {
            L.path(EX.map(([n, p]) => [n, p]), { color: 'ink', width: 2, alpha: 0.75 });
            L.text('exact, m = 3', 9, EX3.get(9), { dx: 6, dy: 14, size: 10.5, weight: 600, color: 'muted' });
          }
          for (const n of NS) {
            const e = est(c, m, n); if (!e) continue;
            L.line(n, Math.max(0, e.p - e.e), n, e.p + e.e, { color: 'gold', width: 2 });
            L.dot(n, e.p, { r: 4.5, color: 'gold' });
          }
          if (c === 'sp') { const tt = sum(NS.map((n) => B(c, m, n).t)), hh = sum(NS.map((n) => B(c, m, n).h)); L.corner(`single-peaked: ${hh} electorates without a Condorcet winner out of ${fmtK(tt)}`, 'tl', { color: 'green', weight: 700, plate: true }); }
          else { const e3 = est(c, m, 3); if (e3) L.corner(`n = 3: ${(100 * e3.p).toFixed(1)}% sampled${m === 3 ? ', exact 1/18 = 5.6%' : ''}`, 'tl', { color: 'muted', weight: 600, plate: true }); }
          // ---- right panel
          Rs.setView([2.4, 10.6], [0, 0.62]);
          MS.forEach((mm) => {
            Rs.rect(mm - 0.32, 0, mm + 0.32, LIM[mm], { fill: 'accent', fillAlpha: mm === m ? 0.42 : 0.2, color: 'accent', width: mm === m ? 2 : 1 });
            Rs.text(`${Math.round(100 * LIM[mm])}%`, mm, LIM[mm], { dy: -10, size: 10, weight: 700, align: 'center', color: 'accent' });
            const e = est(c, mm, nR.value); if (!e) return;
            Rs.line(mm, Math.max(0, e.p - e.e), mm, e.p + e.e, { color: 'gold', width: 2 });
            Rs.dot(mm, e.p, { r: 4.5, color: 'gold' });
          });
          Rs.corner(`n = ${nR.value}`, 'tl', { color: 'muted', weight: 600 });
        }, { period: 1e6, still: 1 });
        v.legend([['gold', 'sampled share, 95% interval', { dot: true }], ['ink', 'exact (m = 3) and the n → ∞ limit'], ['accent', 'limit for m candidates', { area: true }]]);
        v.readout(() => {
          const m = mSel.value, c = cult.value, e = est(c, m, 1001), e3 = est(c, m, 3), tot = sum([...buckets.values()].map((b) => b.t));
          if (c === 'sp') return `Single-peaked voters (odd n): ${sum(NS.map((n) => B(c, m, n).h))} electorates without a Condorcet winner among ${fmtK(sum(NS.map((n) => B(c, m, n).t)))} sampled with m = ${m} — the median voter’s favourite always wins every pairwise vote.`;
          return `m = ${m}: with 3 voters ${e3 ? `${(100 * e3.p).toFixed(2)}% ± ${(100 * e3.e).toFixed(2)}%` : '—'} of electorates have no Condorcet winner${m === 3 ? ' (exact 1/18 = 5.56%)' : ''}; with 1001 voters ${e ? `${(100 * e.p).toFixed(2)}% ± ${(100 * e.e).toFixed(2)}%` : '—'}${m === 3 ? ` (exact ${(100 * EX3.get(1001)).toFixed(2)}%)` : ''}, against the limit **${(100 * LIM[m]).toFixed(2)}%**. With 10 candidates the limit is ${(100 * LIM[10]).toFixed(1)}%. ${fmtK(tot)} random electorates drawn so far.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Paradox',
      name: 'Plurality can elect a Condorcet loser (the spoiler effect)',
      statement: String.raw`Plurality can elect a **Condorcet loser**, a candidate whom a majority ranks below each rival. Example: 40% of the voters rank $A \succ B \succ C$, 35% rank $B \succ C \succ A$ and 25% rank $C \succ B \succ A$. Plurality elects $A$ with 40%, yet $60\%$ prefer $B$ to $A$ and $60\%$ prefer $C$ to $A$.

Plurality also violates **independence of irrelevant alternatives**: if $C$, who cannot win, withdraws, nobody changes their opinion of $A$ and $B$, yet the winner changes from $A$ to $B$. A losing candidate whose presence changes the winner is a **spoiler**.`,
      idea: String.raw`Plurality reads only first places (polsci-1.2). Two similar candidates divide the first preferences of one majority, while a united minority keeps its votes together. Every voter in the divided majority prefers either of the two similar candidates to the minority’s candidate, so the plurality winner loses both head-to-head votes (polsci-1.6). On a left–right line this is automatic: if $B$ and $C$ stand close together on the right, they split the right-hand voters at their midpoint, while $A$ alone collects everyone to the left of the $A$–$B$ midpoint. The runoff and instant runoff repair this particular failure — they never elect a Condorcet loser — but they can still be spoiled in other ways (polsci-2.5).`,
      caption: String.raw`Voters are spread along a left–right axis (shaded density); each votes for the nearest candidate, and the shading shows who gets whom. Drag the three candidates along the axis, or change the share of voters on the left. In the starting position B and C split the right, A wins with about 40%, and the tournament shows A losing both head-to-head votes. Withdraw C and B wins. The bar groups on the right show the plurality count with each candidate withdrawn.`,
      deps: ['polsci-1.2', 'polsci-1.6'],
      see: ['polsci-2.13', 'polsci-4.1'],
      refs: ['T&P ch. 1'],
      tags: ['plurality', 'spoiler effect', 'Condorcet loser'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spoiler_effect' },
      viz(v) {
        const S = v.stage({ x: [0, 100], y: [0, 1], axes: false, height: 230, full: true, title: 'voters on a left–right axis: each votes for the nearest running candidate' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, minWidth: 300, title: 'head to head (all voters)' });
        const Bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, minWidth: 400, weight: 1.35, title: 'plurality count, and with each candidate withdrawn' });
        const wS = v.slider('voters on the left', 0.25, 0.6, 0.41, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const ball = v.select('on the ballot', [{ value: -1, label: 'all three' }, { value: 2, label: 'C withdraws' }, { value: 1, label: 'B withdraws' }, { value: 0, label: 'A withdraws' }], -1);
        const YA = 0.17, H = [[30, 'A'], [61, 'B'], [71, 'C']].map(([x, l], k) => S.handle(x, YA, { color: CC[k], r: 9, label: l, labelPos: 's', constrain: (x2) => [clamp(x2, 2, 98), YA] }));
        const NV = 200, gauss = (x, mu, sd) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / sd;
        const dens = (x) => wS.value * gauss(x, 30, 11) + (1 - wS.value) * gauss(x, 68, 10);
        const voters = () => {
          const xs = [], cdf = [0]; const h = 0.1; for (let x = 0; x < 100; x += h) cdf.push(cdf[cdf.length - 1] + dens(x + h / 2) * h);
          const tot = cdf[cdf.length - 1]; let j = 0;
          for (let i = 0; i < NV; i++) { const q = ((i + 0.5) / NV) * tot; while (cdf[j + 1] < q) j++; xs.push((j + (q - cdf[j]) / (cdf[j + 1] - cdf[j])) * h); }
          return xs;
        };
        const cands = () => H.map((h) => [h.x, 0]);
        const model = () => {
          const xs = voters(), P = spatialProfile(xs.map((x) => [x, 0]), cands(), 1), N = pairwise(P), C = condorcet(P, N);
          const scen = [-1, 0, 1, 2].map((out) => { const al = range(3).filter((c) => c !== out), t = tops(P, al); return { out, al, t, win: best(t, al) }; });
          return { xs, P, N, C, scen, cur: scen.find((s) => s.out === +ball.value) };
        };
        v.render(() => {
          const Mo = model(), out = +ball.value, al = range(3).filter((c) => c !== out), c = S.ctx;
          let fmax = 0; for (let x = 0; x <= 100; x += 0.5) fmax = Math.max(fmax, dens(x));
          const fy = (x) => 0.3 + (0.55 * dens(x)) / fmax;
          const xs = al.map((k) => H[k].x), srt = al.slice().sort((a, b) => H[a].x - H[b].x);
          const cuts = []; for (let k = 0; k + 1 < srt.length; k++) cuts.push((H[srt[k]].x + H[srt[k + 1]].x) / 2);
          const edges = [0, ...cuts, 100];
          srt.forEach((k, i) => {
            S.fn(fy, { domain: [edges[i], edges[i + 1]], color: CC[k], width: 2, fill: CC[k], fillAlpha: 0.3, base: 0.3 });
            const share = Mo.cur.t[k], mid = (edges[i] + edges[i + 1]) / 2;
            S.text(`${LET[k]} ${pct(share, NV)}`, mid, 0.93, { size: 13, weight: 800, color: CC[k], align: 'center' });
          });
          cuts.forEach((x) => S.line(x, 0.26, x, 0.88, { color: 'muted', dash: [4, 4], width: 1.2 }));
          S.line(0, YA, 100, YA, { color: 'muted', width: 1.5 });
          S.text('← left', 1, 0.25, { size: 10.5, color: 'muted', weight: 600 });
          S.text('right →', 99, 0.25, { size: 10.5, color: 'muted', weight: 600, align: 'right' });
          if (out >= 0) S.text('withdrawn', H[out].x, YA, { dy: -16, size: 10.5, weight: 700, color: 'red', align: 'center' });
          const w = Mo.cur.win;
          if (w.length === 1) S.text('plurality winner', H[w[0]].x, YA, { dy: -16, size: 10.5, weight: 700, color: 'gold', align: 'center' });
          // ---- tournament
          const tc = T.ctx, TW = T.width, TH = T.height, pos = ring(3, TW / 2, TH / 2 + 8, Math.min(TW * 0.3, TH * 0.32));
          drawTourney(v, tc, Mo.N, [0, 1, 2], pos, {
            r: 19, ring: (x) => (w.length === 1 && w[0] === x ? 'gold' : Mo.C.loser === x ? 'red' : Mo.C.winner === x ? 'green' : null),
            color: (wn, l) => (l === Mo.C.loser ? 'red' : null),
          });
          if (Mo.C.loser >= 0) txt(v, tc, 'Condorcet loser', pos[Mo.C.loser][0], pos[Mo.C.loser][1] + (Mo.C.loser === 0 ? -32 : 33), { size: 10.5, weight: 700, color: 'red', halo: true });
          if (Mo.C.winner >= 0) txt(v, tc, 'Condorcet winner', pos[Mo.C.winner][0], pos[Mo.C.winner][1] + (Mo.C.winner === 0 ? -32 : 33), { size: 10.5, weight: 700, color: 'green', halo: true });
          // ---- scenario bars
          const bc = Bs.ctx, BW = Bs.width, BH = Bs.height, gw = BW / 4, YM = Math.max(0.55, ...Mo.scen.flatMap((sc) => sc.al.map((k) => sc.t[k] / NV))) * 1.12;
          Mo.scen.forEach((sc, g) => {
            const x0 = g * gw + 10, x1 = (g + 1) * gw - 10, top = 52, base = BH - 36, cur = sc.out === out;
            rr(bc, g * gw + 4, 6, gw - 8, BH - 12, 8); bc.fillStyle = v.color(cur ? 'accent' : 'muted', cur ? 0.1 : 0.04); bc.fill();
            if (cur) { bc.strokeStyle = v.color('accent'); bc.lineWidth = 1.5; bc.stroke(); }
            txt(v, bc, sc.out < 0 ? 'all three run' : `${LET[sc.out]} withdraws`, (x0 + x1) / 2, 22, { size: 11.5, weight: 700, color: cur ? 'accent' : 'ink' });
            const bw = (x1 - x0) / 3;
            range(3).forEach((k) => {
              const X = x0 + (k + 0.5) * bw, run = sc.al.includes(k), hgt = run ? (sc.t[k] / NV) * (base - top) / YM : 0;
              if (run) { rr(bc, X - bw * 0.32, base - hgt, bw * 0.64, Math.max(hgt, 1), 3); bc.fillStyle = v.color(CC[k], 0.72); bc.fill(); txt(v, bc, pct(sc.t[k], NV), X, base - hgt - 9, { size: 10, weight: 700, halo: true }); }
              chip(v, bc, X, base + 15, k, { r: 9, alpha: run ? 1 : 0.25, strike: !run, ring: sc.win.length === 1 && sc.win[0] === k ? 'gold' : null });
            });
            hlinePx(v, bc, x0, x1, base - (0.5 / YM) * (base - top), 'red', [4, 3], 1);
          });
          txt(v, bc, 'half', 16, BH - 36 - (0.5 / YM) * (BH - 36 - 52) - 8, { size: 9.5, weight: 700, color: 'red', align: 'left', halo: true });
        });
        v.legend([['gold', 'plurality winner', { dot: true }], ['red', 'Condorcet loser / majority line', { dot: true }], ['green', 'Condorcet winner', { dot: true }]]);
        v.readout(() => {
          const Mo = model(), w = Mo.cur.win, L = (k) => LET[k];
          if (w.length !== 1) return `Plurality ties: ${names(w)}.`;
          const x = w[0], rec = range(3).filter((y) => y !== x).map((y) => `${Mo.N[x][y] > Mo.N[y][x] ? 'beats' : 'loses to'} ${L(y)} ${Mo.N[x][y]}–${Mo.N[y][x]}`).join(', ');
          let s = `Plurality elects **${L(x)}** with ${pct(Mo.cur.t[x], NV)} of first preferences; head to head ${L(x)} ${rec}.`;
          if (Mo.C.loser === x) s += ` **${L(x)} is the Condorcet loser** — a majority prefers each rival.`;
          const sp = Mo.scen.filter((sc) => sc.out >= 0 && sc.out !== x && sc.win.length === 1 && sc.win[0] !== x).map((sc) => `${L(sc.out)} (without it ${L(sc.win[0])} wins)`);
          if (+ball.value < 0 && sp.length) s += ` Spoiler${sp.length > 1 ? 's' : ''}: ${sp.join(', ')}.`;
          return s;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Borda: no Condorcet losers, but Condorcet winners can lose',
      statement: String.raw`For any number $m \ge 2$ of candidates and any profile of $n$ complete rankings:

(a) the Borda count never elects a Condorcet loser — the Condorcet loser’s Borda score is below the average $n(m-1)/2$, so it is not even tied for first;

(b) the Condorcet winner’s Borda score is above the average, so it is never ranked last by Borda;

(c) but the Condorcet winner need not win: with 3 voters ranking $A \succ B \succ C$ and 2 ranking $B \succ C \succ A$, $A$ beats both rivals $3$–$2$, yet Borda gives $B$ $7$ points against $A$’s $6$. So the Borda count is not a Condorcet method.`,
      idea: String.raw`Everything follows from $B(x) = \sum_{y \ne x} N(x, y)$ (polsci-1.5). The $m(m-1)/2$ pairs share $n$ voters each, so the scores average $n(m-1)/2$. A Condorcet loser has $N(x, y) < n/2$ for each of its $m - 1$ rivals, so $B(x) < (m-1)n/2$: below average, hence below the maximum. A Condorcet winner has every $N(x, y) > n/2$, hence $B(x) >$ average. But “above average” is all one gets: a rival who wins its own contests narrowly but is ranked second by everyone can pile up more points, as $B$ does in (c), where the $A$-voters rank $B$ second and $B$’s voters bury $A$ last. Condorcet and Borda argued about exactly this in the 1780s.`,
      caption: String.raw`Random electorates stream in from the right. For each one the dots are the candidates’ Borda scores divided by $n(m-1)$, so the average is exactly ½. Green is the Condorcet winner, always above the line; red is the Condorcet loser, always below it and never on top. A red stem marks an electorate where the Condorcet winner (ringed) loses to a higher Borda score (gold). The counters keep score. Click any column to load that electorate into the panels below and edit its ballots, or press *Next case* to jump to the next Condorcet winner who loses.`,
      deps: ['polsci-1.5', 'polsci-1.6'],
      see: ['polsci-2.10'],
      refs: ['Saari, Chaotic Elections!', 'T&P ch. 1'],
      tags: ['Borda count', 'Condorcet winner', 'Condorcet loser'],
      credit: 'Borda (1784) and Condorcet (1785); the Condorcet-loser property is classical',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Borda_count#Criteria' },
      viz(v) {
        const St = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, full: true, title: 'random electorates: each column is one, each dot a candidate’s normalised Borda score' });
        const D = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, minWidth: 320, title: 'the selected electorate: Borda scores' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, minWidth: 380, weight: 1.2, title: 'its ballots (click letters to move them up)' });
        const CAP = 110;
        const P = mkProfile(3, [[3, 'ABC'], [2, 'BCA']]);
        let samples = [], stats, rng, selI = -1, geo = null, made = 0;
        const mSel = v.select('candidates', [{ value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' }], 4, { onChange: () => { reset(); v.restart(); } });
        function gen() {
          const m = mSel.value, Q = tidy(randomProfile(rng, m, 3 + Math.floor(rng() * 4), 1, 9)), n = total(Q), N = pairwise(Q), B = borda(Q);
          const b = B.map((x) => x / (n * (m - 1))), cw = cwOf(N), C = condorcet(Q, N), mx = Math.max(...B), bw = best(B, range(m));
          const s = { Q, b, cw, cl: C.loser, bw, cwLoses: cw >= 0 && B[cw] < mx - 1e-9, clWins: C.loser >= 0 && B[C.loser] >= mx - 1e-9 };
          stats.n++; if (cw >= 0) stats.cw++; if (s.cwLoses) stats.lose++; if (C.loser >= 0) stats.cl++; if (s.clWins) stats.clw++;
          samples.push(s); if (samples.length > CAP) { samples.shift(); if (selI >= 0) selI--; }
          return s;
        }
        function reset() { rng = v.rng(17 + mSel.value); samples = []; selI = -1; stats = { n: 0, cw: 0, lose: 0, cl: 0, clw: 0 }; for (let k = 0; k < CAP; k++) gen(); made = CAP; }
        reset();
        const load = (i) => { selI = i; setProfile(P, samples[i].Q); };
        v.button('Next case: Condorcet winner loses', () => { for (let k = 0; k < 20000; k++) { const s = gen(); if (s.cwLoses) { load(samples.length - 1); return; } } });
        const ed = blocEditor(v, E, P, { max: 12, rank: true, rowMax: 40, onEdit: () => { selI = -1; } });
        St.onClick((x) => { if (!geo) return; const i = Math.round((St.X(x) - geo.x0) / geo.dx); if (i >= 0 && i < samples.length) load(i); });
        v.animate((t) => {
          const target = CAP + Math.floor(t * 10);
          while (made < target) { gen(); made++; }
          // ---- strip
          const c = St.ctx, W = St.width, H = St.height, x0 = 40, x1 = W - 14, y0 = 34, y1 = H - 14, dx = (x1 - x0) / (CAP - 1);
          geo = { x0, dx };
          const Y = (b) => y1 - b * (y1 - y0);
          [0, 0.25, 0.5, 0.75, 1].forEach((b) => { hlinePx(v, c, x0 - 4, x1, Y(b), b === 0.5 ? 'ink' : 'grid', b === 0.5 ? [6, 4] : null, b === 0.5 ? 1.4 : 1); txt(v, c, b === 0.5 ? '½' : String(b), x0 - 9, Y(b), { size: 10, weight: 600, color: 'muted', align: 'right' }); });
          txt(v, c, 'average', x0 + 2, Y(0.5) - 9, { size: 10, weight: 700, color: 'ink', align: 'left', halo: true });
          samples.forEach((s, i) => {
            const X = x0 + i * dx;
            if (i === selI) { c.fillStyle = v.color('accent', 0.14); c.fillRect(X - dx / 2, y0 - 4, dx, y1 - y0 + 8); }
            s.b.forEach((b, k) => { if (k !== s.cw && k !== s.cl) { c.beginPath(); c.arc(X, Y(b), 1.8, 0, 7); c.fillStyle = v.color('muted', 0.55); c.fill(); } });
            if (s.cwLoses) {
              const yb = Y(s.b[s.bw[0]]);
              vlinePx(v, c, X, yb, Y(s.b[s.cw]), 'red', null, 2);
              c.beginPath(); c.arc(X, yb, 3.4, 0, 7); c.fillStyle = v.color('gold'); c.fill();
            }
            if (s.cl >= 0) { c.beginPath(); c.arc(X, Y(s.b[s.cl]), 3.4, 0, 7); c.fillStyle = v.color('red'); c.fill(); }
            if (s.cw >= 0) {
              c.beginPath(); c.arc(X, Y(s.b[s.cw]), 3.4, 0, 7); c.fillStyle = v.color('green'); c.fill();
              if (s.cwLoses) { c.beginPath(); c.arc(X, Y(s.b[s.cw]), 6, 0, 7); c.strokeStyle = v.color('red'); c.lineWidth = 1.6; c.stroke(); }
            }
          });
          txt(v, c, `${fmtK(stats.n)} electorates · Condorcet winner in ${fmtK(stats.cw)}, of whom ${fmtK(stats.lose)} (${pct(stats.lose, stats.cw, 1)}) lose under Borda · Condorcet loser in ${fmtK(stats.cl)}, of whom ${stats.clw} win`, 12, 14, { size: 11, weight: 600, color: 'ink', align: 'left' });
          // ---- detail
          ed.draw();
          const dc = D.ctx, DW = D.width, DH = D.height, m = P.m, n = total(P), N = pairwise(P), B = borda(P), C = condorcet(P, N);
          const avg = (n * (m - 1)) / 2, ymax = Math.max(...B, avg) * 1.22 + 1, top = 34, base = DH - 34, bw = (DW - 56) / m;
          const Yd = (val) => base - (val / ymax) * (base - top);
          hlinePx(v, dc, 30, DW - 10, base, 'muted', null, 1);
          hlinePx(v, dc, 30, DW - 10, Yd(avg), 'ink', [6, 4], 1.4);
          txt(v, dc, `average n(m−1)/2 = ${+avg.toFixed(1)}`, DW - 10, Yd(avg) - 9, { size: 10.5, weight: 700, align: 'right', halo: true });
          const win = best(B, range(m));
          range(m).forEach((x) => {
            const X = 40 + (x + 0.5) * bw, col = x === C.winner ? 'green' : x === C.loser ? 'red' : CC[x];
            rr(dc, X - bw * 0.3, Yd(B[x]), bw * 0.6, base - Yd(B[x]), 3); dc.fillStyle = v.color(CC[x], 0.7); dc.fill();
            if (x === C.winner || x === C.loser) { dc.strokeStyle = v.color(col); dc.lineWidth = 2.5; dc.stroke(); }
            txt(v, dc, String(B[x]), X, Yd(B[x]) - 9, { size: 12, weight: 700, halo: true });
            chip(v, dc, X, base + 16, x, { r: 10, ring: win.length === 1 && win[0] === x ? 'gold' : null });
            if (x === C.winner) txt(v, dc, 'Condorcet winner', X, Yd(B[x]) - 24, { size: 9.5, weight: 700, color: 'green', halo: true });
            if (x === C.loser) txt(v, dc, 'Condorcet loser', X, Yd(B[x]) - 24, { size: 9.5, weight: 700, color: 'red', halo: true });
          });
          txt(v, dc, `${n} voters, Borda winner ${names(win)}`, 10, 14, { size: 11, weight: 600, color: 'muted', align: 'left' });
        }, { period: 1e6, still: 0.5 });
        v.legend([['green', 'Condorcet winner', { dot: true }], ['red', 'Condorcet loser', { dot: true }], ['gold', 'Borda winner when it is not the Condorcet winner', { dot: true }], ['ink', 'average score', { dash: true }]]);
        v.readout(() => {
          const m = P.m, n = total(P), N = pairwise(P), B = borda(P), C = condorcet(P, N), avg = (n * (m - 1)) / 2, win = best(B, range(m));
          let s = `Selected electorate: Borda ${range(m).map((x) => `${LET[x]} ${B[x]}`).join(', ')} (average ${+avg.toFixed(1)}) → **${names(win)}**. `;
          if (C.winner >= 0) s += `Condorcet winner ${LET[C.winner]}: ${B[C.winner]} = Σ of its tallies ${range(m).filter((y) => y !== C.winner).map((y) => N[C.winner][y]).join(' + ')}, each > n/2 = ${n / 2}, so above average${win.includes(C.winner) ? ' — and it wins.' : ` — **yet it loses to ${names(win)}**.`} `;
          else s += 'No Condorcet winner. ';
          if (C.loser >= 0) s += `Condorcet loser ${LET[C.loser]}: ${B[C.loser]}, below average, as it must be.`;
          return s + ` Overall: the Condorcet winner lost in ${pct(stats.lose, stats.cw, 1)} of electorates that had one; the Condorcet loser won in ${stats.clw} of ${fmtK(stats.cl)}.`;
        });
      },
    },
  ],
};
