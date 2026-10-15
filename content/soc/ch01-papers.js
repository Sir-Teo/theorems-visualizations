// Social Science — Chapter 1: landmark paper written early as a flagship item (1.10, Schelling 1971).
//
// Verified against the paper (J. Math. Sociol. 1 (2): 143–186), pp. 149–157:
// Linear model — Fig. 1 is a line of 35 stars and 35 zeros (odd and even digits of a random-number column), transcribed
// below from the scan; everyone wants at least half of his neighbours (the four nearest on either side) like himself;
// "Twelve stars and 14 zeros are dissatisfied"; a discontented member moves to the nearest point (fewest neighbours
// passed) that meets his demand, discontents moving in turn from left to right and the newly discontent afterwards; the
// result (Fig. 2) has six clusters, and "440 out of 540 neighbors are of the same color, or 81.5 %". (The printed Fig. 2
// cluster sizes 8, 15, 10, 15, 16 and 6 add to 34 zeros and 36 stars, one off from Fig. 1's 35/35.)
// Checkerboard — 13 rows by 16 columns (208 squares), 138 randomly placed stars and zeros, about 30 % blank; neighbours
// are the eight surrounding squares (five on an edge, three in a corner); demand: no fewer than half of one's neighbours
// of one's own colour; the discontent move to the nearest satisfactory vacant square, "nearest" counted in squares
// traversed horizontally and vertically, working from the upper left; initially 25 stars and 18 zeros are discontent,
// zeros have 53 % and stars 46 % like neighbours; at equilibrium (Fig. 9) zeros five-sixths and stars four-fifths, and the
// share with no neighbour of opposite colour rises from 13 (about 10 %) to 54 (about 40 %).

const FIG1 = '0+000++0+00++00+++0++0++00++00++00++0+0+00+++0++00000+++000+00++0+0++0';

/** Seeded uniform [0, 1). */
function rng32(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- the checkerboard: cells 0 = blank, 1 = zero, 2 = star; bounded board, eight neighbours ----------
function makeBoard(rows, cols, vac, starShare, seed) {
  const n = rows * cols, nAg = Math.round(n * (1 - vac)), nStar = Math.round(nAg * starShare), g = new Uint8Array(n), R = rng32(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  for (let k = 0; k < nAg; k++) g[idx[k]] = k < nStar ? 2 : 1;
  return { rows, cols, g, moves: 0, done: false, cursor: 0, last: -1, from: -1, hist: [] };
}
function counts(B, cell, kind) {
  const { rows, cols, g } = B, r = Math.floor(cell / cols), c = cell % cols; let like = 0, occ = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
    const v = g[rr * cols + cc]; if (v) { occ++; if (v === kind) like++; }
  }
  return { like, occ };
}
const contentAt = (B, cell, kind, demand) => { const { like, occ } = counts(B, cell, kind); return occ === 0 || like >= demand * occ - 1e-9; };
/** One Schelling move: the next discontented counter in scan order moves to the nearest satisfactory vacant square. */
function boardStep(B, demand) {
  const { rows, cols, g } = B, n = rows * cols;
  for (let s = 0; s < n; s++) {
    const cell = (B.cursor + s) % n, kind = g[cell];
    if (!kind || contentAt(B, cell, kind, demand)) continue;
    g[cell] = 0; // look for the nearest satisfactory blank, as if he had already left
    const r0 = Math.floor(cell / cols), c0 = cell % cols; let best = -1, bd = Infinity;
    for (let k = 0; k < n; k++) {
      if (g[k] || k === cell) continue;
      const d = Math.abs(Math.floor(k / cols) - r0) + Math.abs((k % cols) - c0);
      if (d < bd && contentAt(B, k, kind, demand)) { bd = d; best = k; }
    }
    if (best < 0) { g[cell] = kind; continue; } // nowhere satisfactory: he stays
    g[best] = kind; B.moves++; B.cursor = (cell + 1) % n; B.last = best; B.from = cell;
    return true;
  }
  B.done = true; B.last = -1; B.from = -1; return false;
}
/** Schelling's measures: share of like neighbours by colour, counters with no opposite neighbour, discontented. */
function boardStats(B, demand) {
  const { g } = B, acc = { 1: [0, 0], 2: [0, 0] }; let none = 0, ag = 0, disc = [0, 0, 0];
  for (let i = 0; i < g.length; i++) {
    const kind = g[i]; if (!kind) continue; ag++;
    const { like, occ } = counts(B, i, kind); acc[kind][0] += like; acc[kind][1] += occ;
    if (occ - like === 0) none++;
    if (!(occ === 0 || like >= demand * occ - 1e-9)) disc[kind]++;
  }
  const z = acc[1][1] ? acc[1][0] / acc[1][1] : 1, s = acc[2][1] ? acc[2][0] / acc[2][1] : 1;
  return { z, s, all: (acc[1][0] + acc[2][0]) / Math.max(1, acc[1][1] + acc[2][1]), none, ag, discZ: disc[1], discS: disc[2] };
}

// ---------- the line: individuals are '0' and '+'; neighbourhood = four nearest on either side ----------
const lineNb = (L, i, R = 4) => L.slice(Math.max(0, i - R), i).concat(L.slice(i + 1, i + 1 + R));
const lineContent = (L, i) => { const nb = lineNb(L, i); let like = 0; for (const c of nb) if (c.k === L[i].k) like++; return 2 * like >= nb.length; };
function makeLine() { return { L: [...FIG1].map((k, id) => ({ k, id })), queue: null, round: 0, moves: 0, done: false, ends: [], moved: -1 }; }
/** One move of the linear model: discontents of the current round, in left-to-right order, each to the nearest satisfying gap. */
function lineStep(S) {
  if (S.done) return false;
  for (;;) {
    if (!S.queue || !S.queue.length) {
      if (S.queue) { S.ends.push(S.L.map((c) => c.k).join('')); S.round++; }
      S.queue = S.L.map((c, i) => (lineContent(S.L, i) ? -1 : c.id)).filter((id) => id >= 0);
      if (!S.queue.length) { S.done = true; S.moved = -1; return false; }
      if (S.round > 12) { S.done = true; return false; }
    }
    const id = S.queue.shift(), i = S.L.findIndex((c) => c.id === id);
    if (lineContent(S.L, i)) continue; // content when his turn comes: stays
    const me = S.L[i], rest = S.L.slice(0, i).concat(S.L.slice(i + 1)); let best = -1, bd = Infinity;
    for (let gp = 0; gp <= rest.length; gp++) { const cand = rest.slice(0, gp).concat([me], rest.slice(gp)); if (lineContent(cand, gp) && Math.abs(gp - i) < bd) { bd = Math.abs(gp - i); best = gp; } }
    if (best < 0) continue;
    S.L = rest.slice(0, best).concat([me], rest.slice(best)); S.moves++; S.moved = id; S.passed = bd;
    return true;
  }
}
function lineStats(L) {
  let like = 0, tot = 0, disc = [0, 0]; const cl = []; let run = 1;
  L.forEach((c, i) => { const nb = lineNb(L, i); tot += nb.length; for (const d of nb) if (d.k === c.k) like++; if (!lineContent(L, i)) disc[c.k === '+' ? 1 : 0]++; if (i > 0) { if (c.k === L[i - 1].k) run++; else { cl.push(run); run = 1; } } });
  cl.push(run);
  return { like, tot, cl, discZ: disc[0], discS: disc[1] };
}
const pc = (x) => `${Math.round(100 * x)}%`;

export default {
  collection: 'soc',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Paper',
      name: 'Dynamic Models of Segregation',
      paper: { authors: 'Thomas C. Schelling', year: 1971, title: 'Dynamic Models of Segregation', venue: 'Journal of Mathematical Sociology 1 (2): 143–186', doi: '10.1080/0022250X.1971.9989794' },
      introduces: ['soc-1.2', 'soc-1.3', 'soc-1.5'],
      statement: String.raw`Schelling showed, with models simple enough to run by hand with coins, that individual preferences about the composition of one's neighbourhood can produce a degree of segregation that nobody wants and that cannot be read back into individual motives.

(a) **Spatial models.** Two kinds of individuals live on a line or a checkerboard; each is content if at least a given fraction of his neighbours are of his own kind, and the discontented move, one at a time, to the nearest place that satisfies them. Starting from a random arrangement, even a demand that only half of one's neighbours be like oneself (so that a perfectly integrated alternating pattern would satisfy everyone) ends in large homogeneous clusters: on his line, 81.5% of all neighbours become like oneself, and on the checkerboard the share of people with no neighbour of the other kind rises from about 10% to about 40%. Demands of about one-third give only slight segregation, and the smaller a minority, the more segregated it ends up.

(b) **Bounded-neighbourhood tipping.** An analytic model of a single area in which each person tolerates up to some ratio of the other group: the joint dynamics of entry and departure have tipping points beyond which an area empties of one group entirely.

The models are abstract: neighbourhoods are cells of a board, everyone moves myopically, and nothing is said about prices, discrimination by institutions, or the order of moves, which changes the details though not the character of the outcome.`,
      idea: String.raw`Explanations of residential segregation in the 1960s looked for discriminatory institutions or strong individual prejudice. Schelling's point was systemic: "there is no simple correspondence of individual incentive to collective results". A move to satisfy oneself changes the neighbourhoods of others, making some of the left-behind newly discontent and attracting more of one's own kind, so mild preferences cascade into sharp sorting; regular integrated patterns exist but are unstable under these dynamics, and patterning, he notes, is characteristic of integration by choice as well as of segregation. The paper (first a RAND memorandum in 1969) introduced Schelling's segregation model (soc-1.2), the phenomenon of mild preferences producing strong segregation (soc-1.3) and the tipping model (soc-1.5). It is the standard first example of emergence (soc-1.1) and one of the founding papers of agent-based modelling; Schelling shared the 2005 Nobel memorial prize for work on conflict and cooperation.`,
      caption: String.raw`The checkerboard opens with Schelling's own parameters: 13 × 16 squares, about a third blank, equal numbers of stars (orange) and zeros (blue), and everyone demanding that at least half of their neighbours be like them. Discontented counters carry a dot, as in his figures; press ▶ and they move one at a time, from the upper left, to the nearest square that satisfies them. The right panel tracks his measures: the share of like neighbours and the share with no neighbour of the other kind. Lower the **demand** to about ⅓ and the result is only slightly segregated; change the **blank** share or the **star share**. Switch on **Schelling's line** to replay his 70-person line of Fig. 1, rule for rule.`,
      deps: ['soc-1.1'],
      refs: [],
      tags: ['segregation', 'agent-based', 'emergence'],
      credit: 'Schelling, 1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Schelling%27s_model_of_segregation' },
      viz(v) {
        const M = v.M;
        const lineOn = v.toggle('Schelling’s line (Fig. 1)', false, { onChange: () => { reset(); showCtl(); } });
        const size = v.select('board', [{ value: 's', label: '13 × 16 (Schelling)' }, { value: 'l', label: '40 × 40' }], 's', { onChange: () => reset() });
        const demS = v.slider('demand: like neighbours ≥', 0, 0.9, 0.5, { step: 0.01, fmt: pc, onChange: () => resume() });
        const vacS = v.slider('blank squares', 0.05, 0.6, 70 / 208, { step: 0.01, fmt: pc, onChange: () => reset() });
        const shS = v.slider('star share', 0.2, 0.8, 0.5, { step: 0.01, fmt: pc, onChange: () => reset() });
        const spS = v.slider('speed (moves / s)', 1, 200, 5, { log: true, sig: 2 });
        let seed = 1971;
        v.button('New board', () => { seed++; reset(); });
        const showCtl = () => { const L = lineOn.value; [size, vacS, shS, demS].forEach((c) => (c.el.hidden = L)); };
        const A = v.stage({ x: [0, 16], y: [0, 13], equal: true, axes: false, height: 360, weight: 1.15, title: 'the board' });
        const T = v.stage({ x: [0, 40], y: [0, 100], axes: 'box', height: 360, weight: 0.85, minWidth: 250, xlabel: 'moves', ylabel: '%', title: 'Schelling’s measures' });
        let B = null, LS = null, lastT = 0, hist = [];
        function reset() {
          const big = size.value === 'l';
          B = makeBoard(big ? 40 : 13, big ? 40 : 16, vacS.value, shS.value, seed);
          LS = makeLine(); hist = []; lastT = 0; v.restart();
        }
        function resume() { if (B) B.done = false; }
        reset();
        const record = () => {
          if (lineOn.value) { const s = lineStats(LS.L); hist.push([LS.moves, 100 * s.like / s.tot, null, 100 * (s.discZ + s.discS) / 70]); }
          else { const s = boardStats(B, demS.value); hist.push([B.moves, 100 * s.all, 100 * s.none / s.ag, 100 * (s.discZ + s.discS) / s.ag]); }
        };
        const star = (st, x, y, rad, col) => { const pts = []; for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? rad * 0.45 : rad; pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]); } st.poly(pts, { fill: col, fillAlpha: 1, color: col, width: 1 }); };
        v.legend([['orange', 'stars', { dot: true }], ['blue', 'zeros', { dot: true }], ['ink', 'discontented (dot)', { dot: true }], ['purple', 'like neighbours'], ['teal', 'no neighbour of the other kind'], ['red', 'discontented']]);
        let st = null;
        v.animate((t) => {
          if (t < lastT - 1e-9) { const keep = seed; reset(); seed = keep; }
          lastT = t;
          const target = Math.floor(t * spS.value), demand = demS.value;
          if (!hist.length) record();
          let guard = 0;
          if (lineOn.value) { while (LS.moves < target && !LS.done && guard++ < 400) { if (lineStep(LS)) record(); } }
          else { while (B.moves < target && !B.done && guard++ < 400) { if (boardStep(B, demand)) record(); } }
          // ---- left
          if (lineOn.value) {
            const rows = [FIG1, ...LS.ends], cur = LS.L, n = 70, rowH = 1;
            A.setView([-0.5, n - 0.5], [-1, 14]);
            const drawRow = (str, y, faded) => { for (let i = 0; i < n; i++) { const k = typeof str === 'string' ? str[i] : str[i].k; if (k === '+') star(A, i, y, 0.42, faded ? 'faint' : 'orange'); else A.circle(i, y, 0.33, { color: faded ? 'faint' : 'blue', width: 1.6 }); } };
            A.text('now', -0.4, 12.6, { size: 11.5, weight: 700, color: 'muted', dy: -12 });
            drawRow(cur, 12, false);
            cur.forEach((c, i) => { if (!lineContent(cur, i)) A.dot(i, 12.9, { r: 2.4, color: 'ink', ring: false }); if (c.id === LS.moved) A.rect(i - 0.5, 11.4, i + 0.5, 12.6, { color: 'gold', width: 2 }); });
            rows.slice(-7).forEach((str, k, arr) => { const y = 9.5 - k * 1.45 * rowH; drawRow(str, y, false); A.text(k === 0 && rows.length <= 7 ? 'Fig. 1' : `after round ${rows.length - arr.length + k}`, -0.4, y + 0.6, { size: 10.5, color: 'muted', dy: -6 }); });
          } else {
            const { rows, cols, g } = B;
            A.setView([0, cols], [0, rows]);
            const rad = 0.36;
            for (let i = 0; i < g.length; i++) {
              const r = Math.floor(i / cols), c = i % cols, x = c + 0.5, y = rows - r - 0.5;
              A.rect(c + 0.04, rows - r - 0.96, c + 0.96, rows - r - 0.04, { fill: 'grid', fillAlpha: 0.7, stroke: false });
              if (!g[i]) continue;
              if (g[i] === 2) star(A, x, y - 0.03, rad, 'orange'); else A.circle(x, y, rad * 0.8, { color: 'blue', width: cols > 20 ? 1.4 : 2.2 });
              if (!contentAt(B, i, g[i], demand)) A.dot(x, y + rad + 0.06, { r: cols > 20 ? 1.4 : 2.4, color: 'ink', ring: false });
            }
            if (B.last >= 0) { const r = Math.floor(B.last / cols), c = B.last % cols; A.rect(c, rows - r - 1, c + 1, rows - r, { color: 'gold', width: 2.2 }); const r0 = Math.floor(B.from / cols), c0 = B.from % cols; A.rect(c0 + 0.1, rows - r0 - 0.9, c0 + 0.9, rows - r0 - 0.1, { color: 'gold', width: 1.2, dash: [3, 3] }); }
          }
          // ---- right: time series
          const xm = Math.max(20, hist.length ? hist[hist.length - 1][0] * 1.1 : 20);
          T.setView([0, xm], [0, 100]);
          if (lineOn.value) { T.hline(81.5, { color: 'purple', width: 1, dash: [5, 4] }); T.text('Schelling: 440 / 540 = 81.5%', xm * 0.97, 81.5, { color: 'purple', size: 11.5, align: 'right', dy: 10 }); }
          else if (size.value === 's' && Math.abs(demand - 0.5) < 0.005) { T.hline(10, { color: 'teal', width: 1, dash: [5, 4] }); T.hline(40, { color: 'teal', width: 1, dash: [5, 4] }); T.text('Schelling: ≈ 10% → ≈ 40%', xm * 0.97, 40, { color: 'teal', size: 11.5, align: 'right', dy: -10 }); }
          T.path(hist.map((h) => [h[0], h[1]]), { color: 'purple', width: 2.4 });
          if (!lineOn.value) T.path(hist.map((h) => [h[0], h[2]]), { color: 'teal', width: 2.2 });
          T.path(hist.map((h) => [h[0], h[3]]), { color: 'red', width: 1.8 });
          st = lineOn.value ? { line: true, s: lineStats(LS.L), LS } : { line: false, s: boardStats(B, demand), s0: null, B };
        }, { still: 40 });
        v.readout(() => {
          if (!st) return '';
          if (st.line) {
            const { s, LS: L } = st;
            return `Schelling's line: ${L.moves} moves in ${L.round + (L.done ? 0 : 1)} round(s); now ${s.discS} stars and ${s.discZ} zeros discontented (Fig. 1 starts with **12 and 14**, as in the paper) · like neighbours **${s.like} of ${s.tot}** = ${pc(s.like / s.tot)}${L.done ? ' at equilibrium' : ''} (Schelling: **440 of 540 = 81.5%**) · clusters: ${s.cl.join(', ')} (his hand-worked Fig. 2: 8, 15, 10, 15, 16, 6)${L.done ? ' · everyone demanded a bare majority of five in nine, yet each now lives among about five like neighbours to one unlike' : ''}`;
          }
          const { s, B: b } = st;
          const ref = b.rows === 13 && Math.abs(demS.value - 0.5) < 0.005 ? ' · Schelling, same rules by hand: 25 stars and 18 zeros discontented at the start; like neighbours 46% (stars) and 53% (zeros) rising to about four-fifths and five-sixths; no unlike neighbour for 13 people (≈10%) rising to 54 (≈40%)' : '';
          return `${b.moves} moves${b.done ? ' — **equilibrium**' : ''} · discontented: ${s.discS} stars, ${s.discZ} zeros · like neighbours: stars ${pc(s.s)}, zeros ${pc(s.z)} · ${s.none} of ${s.ag} (${pc(s.none / s.ag)}) have no neighbour of the other kind${ref}`;
        });
      },
    },
  ],
};
