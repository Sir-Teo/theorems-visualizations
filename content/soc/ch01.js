// Networks & Collective Behavior — Chapter 1: Micromotives and macrobehavior (items 1.1–1.5; 1.6–1.11 in ch01-b.js,
// 1.10 in ch01-papers.js).
//
// Sources checked for this part:
// - Schelling, Micromotives and Macrobehavior (1978), ch. 1: the opening example of a lecture audience that left the front
//   rows of the hall empty, and the list of motives that could produce it (summaries of the chapter; text not re-quoted).
// - Bounded-neighbourhood model: Schelling (1971), J. Math. Sociol. 1: 143–186, as restated with notation by Dokumacı &
//   Sandholm, "Schelling Redux" (2007): first example (pp. 168–171 of Schelling, his Fig. 18 = Fig. 9 of the book):
//   100 W and 50 B, tolerances uniform on [0, 2], T_W(w) = 2w − w²/50, T_B(b) = 2b − b²/25, segregated equilibria (100, 0) and
//   (0, 50), unstable integrated equilibrium ≈ (21.7401, 34.0276); second example: 100 and 100, tolerances uniform on [0, 5],
//   stable integrated equilibrium (80, 80), unstable ones ≈ (25.36, 94.64) and (94.64, 25.36). Dynamics: Schelling's verbal
//   rule (p. 170) — the content stay and outsiders who would be content enter; the discontent leave in order of discontent.
// - Dissimilarity and exposure indices: standard definitions (Duncan & Duncan 1955; Lieberson's P* indices; Massey &
//   Denton 1988).

import { rng32, makeCity, cityStep, cityStats, nbCounts } from './ch01.shared.js';

const pc = (x) => `${Math.round(100 * x)}%`;
const pc1 = (x) => `${(100 * x).toFixed(1)}%`;

// ---------- 1.1: an auditorium filled seat by seat (logit choice among empty seats) ----------
const ROWS = 14, SEATS = 22, CAP = ROWS * SEATS;
/** Arrival order of every seat for motives b (back rows), c (someone seated in the two rows just ahead), a (elbow neighbour). */
function fillHall(b, c, a, seed) {
  const R = rng32(seed), occ = new Int32Array(CAP).fill(-1), seq = new Int32Array(CAP), w = new Float64Array(CAP), TAU = 0.25;
  for (let n = 0; n < CAP; n++) {
    let tot = 0;
    for (let r = 0; r < ROWS; r++) for (let s = 0; s < SEATS; s++) {
      const k = r * SEATS + s; w[k] = 0; if (occ[k] >= 0) continue;
      let u = (b * r) / (ROWS - 1);
      if (c) {
        let cov = 0;
        for (let dr = 1; dr <= 2 && !cov; dr++) { const rr = r - dr; if (rr < 0) break; for (let ds = -2; ds <= 2; ds++) { const ss = s + ds; if (ss >= 0 && ss < SEATS && occ[rr * SEATS + ss] >= 0) { cov = 1; break; } } }
        u += c * cov;
      }
      if (a) { let nb = 0; if (s > 0 && occ[k - 1] >= 0) nb++; if (s < SEATS - 1 && occ[k + 1] >= 0) nb++; u -= a * nb; }
      w[k] = Math.exp(u / TAU); tot += w[k];
    }
    let x = R() * tot, pick = -1;
    for (let k = 0; k < CAP; k++) { if (!w[k]) continue; pick = k; x -= w[k]; if (x <= 0) break; }
    occ[pick] = n; seq[n] = pick;
  }
  return { occ, seq };
}

// ---------- 1.4: a 24 × 24 city of households, aggregated into k × k tracts ----------
const CW = 24;
function cityPreset(name, seed) {
  const R = rng32(seed), g = new Uint8Array(CW * CW);
  const put = (f) => { for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) g[j * CW + i] = f(i, j); };
  if (name === 'random') put(() => (R() < 0.5 ? 1 : 2));
  else if (name === 'halves') put((i) => ((i < 12) !== (R() < 0.05) ? 1 : 2));
  else if (name === 'enclave') put((i, j) => ((Math.hypot(i + 0.5 - 16.5, j + 0.5 - 7.5) < 6.6) !== (R() < 0.05) ? 2 : 1));
  else if (name === 'stripes') put((i) => (Math.floor(i / 3) % 2 ? 2 : 1));
  else if (name === 'checker') put((i, j) => ((i + j) % 2 ? 2 : 1));
  else { // a Schelling outcome: 10% vacancies, T = 0.5, run to rest; vacancies then take their neighbours' majority
    const C = makeCity(CW, CW, 0.1, 0.5, seed);
    for (let t = 0; t < 200; t++) { const r = cityStep(C, 0.5, 'random'); if (!r.unhappy) break; }
    const cnt = new Int32Array(3);
    for (let k = 0; k < g.length; k++) { if (C.g[k]) { g[k] = C.g[k]; continue; } nbCounts(C, k, cnt); g[k] = cnt[1] > cnt[2] ? 1 : cnt[2] > cnt[1] ? 2 : R() < 0.5 ? 1 : 2; }
  }
  return g;
}
/** Tract counts and the dissimilarity / exposure indices for k × k tracts (a = blue, b = orange). */
function tractIndices(g, k) {
  const n = CW / k, a = new Float64Array(n * n), b = new Float64Array(n * n);
  for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) { const t = Math.floor(j / k) * n + Math.floor(i / k); if (g[j * CW + i] === 1) a[t]++; else b[t]++; }
  let A = 0, B = 0; for (let t = 0; t < n * n; t++) { A += a[t]; B += b[t]; }
  let D = 0, PAB = 0, PBA = 0;
  for (let t = 0; t < n * n; t++) { const tt = a[t] + b[t]; D += Math.abs(a[t] / A - b[t] / B) / 2; if (tt) { PAB += (a[t] / A) * (b[t] / tt); PBA += (b[t] / B) * (a[t] / tt); } }
  return { n, a, b, A, B, D: A && B ? D : 0, PAB, PBA };
}

// ---------- 1.5: Schelling's bounded neighbourhood (aggregate dynamics of Dokumacı & Sandholm, small committed masses) ----------
function tipModel(mW, mB, RW, RB) {
  const eps = 0.01;
  const f = (x, y) => {
    const rW = y / (x + eps), rB = x / (y + eps);
    return [mW * Math.max(0, Math.min(1, 1 - rW / RW)) - x, mB * Math.max(0, Math.min(1, 1 - rB / RB)) - y];
  };
  const step = (x, y, dt) => {
    const k1 = f(x, y), k2 = f(x + (dt / 2) * k1[0], y + (dt / 2) * k1[1]), k3 = f(x + (dt / 2) * k2[0], y + (dt / 2) * k2[1]), k4 = f(x + dt * k3[0], y + dt * k3[1]);
    return [Math.max(0, x + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])), Math.max(0, y + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]))];
  };
  const run = (x, y, T = 40, dt = 0.04, path = null) => {
    for (let t = 0; t < T; t += dt) { [x, y] = step(x, y, dt); if (path) path.push([x, y]); const [u, w] = f(x, y); if (Math.abs(u) + Math.abs(w) < 1e-4) break; }
    return [x, y];
  };
  const TW = (x) => RW * x * (1 - x / mW), TB = (y) => RB * y * (1 - y / mB);
  // equilibria: the two corners, plus crossings of b = T_W(w) and w = T_B(b) inside the box
  const eq = [[mW, 0], [0, mB]];
  const nS = 4000; let prev = null;
  for (let i = 1; i < nS; i++) {
    const x = (mW * i) / nS, y = TW(x);
    if (!(y > 0 && y < mB)) { prev = null; continue; }
    const g = TB(y) - x;
    if (prev && Math.sign(g) !== Math.sign(prev[1])) {
      let lo = prev[0], hi = x, glo = prev[1];
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, gm = TB(TW(m)) - m; if (Math.sign(gm) === Math.sign(glo)) { lo = m; glo = gm; } else hi = m; }
      const xm = (lo + hi) / 2; if (!eq.some(([a, b]) => Math.hypot(a - xm, b - TW(xm)) < 0.5)) eq.push([xm, TW(xm)]);
    }
    prev = [x, g];
  }
  const tol = Math.max(mW, mB) * 0.02;
  const kind = eq.map(([x, y]) => {
    const d = Math.max(mW, mB) * 0.02; let back = 0;
    for (const [dx, dy] of [[d, d], [-d, d], [d, -d], [-d, -d]]) { const [u, w] = run(Math.max(0, x + dx), Math.max(0, y + dy), 60, 0.05); if (Math.hypot(u - x, w - y) < tol) back++; }
    return back === 4 ? 'stable' : 'unstable';
  });
  return { f, run, TW, TB, eq, kind };
}

export default {
  collection: 'soc',
  chapter: 1,
  title: 'Micromotives and macrobehavior',
  summary: String.raw`Collective outcomes often bear little resemblance to what any individual wants. Schelling’s segregation model is the classic demonstration: mild preferences about one’s neighbours, acted on one move at a time, produce stark segregation that nobody asked for, and indices of dissimilarity and exposure turn the result into numbers. Tipping points and critical mass appear whenever people’s choices depend on how many others are already making the same choice — in neighbourhoods, in conventions, in Schelling’s binary-choice diagrams — and Granovetter’s threshold model shows how fragile the resulting cascades can be: change one person and a riot becomes a lone troublemaker.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Emergence: aggregate patterns from individual rules',
      statement: String.raw`An aggregate pattern is **emergent** when it arises from the interaction of many individuals, each following a rule of their own, without being intended by anyone or written into any of the rules. The typical setting is *contingent behaviour*: what each person does depends on what others have already done — where they sat, who lives next door, how many have joined — so every choice changes the situation in which the next choice is made.

Two consequences recur throughout this collection.

(a) The aggregate can differ sharply from what anyone wanted, and can look as if it had been designed.

(b) Quite different individual motives can produce the same aggregate, so the motives cannot be read off the pattern; and a small change in the rules can change the pattern completely.`,
      idea: String.raw`Schelling opened *Micromotives and Macrobehavior* with a lecture audience that seated itself leaving the front rows of the hall empty. Nobody need have wanted the front empty. If each newcomer merely prefers someone seated in the rows just ahead, the first few arrivals scatter at random, each later arrival settles just behind somebody, clusters grow backwards, and the front stays empty until the back is full — when the latecomers must take the seats nobody chose. A mild taste for the back produces a similar picture for a different reason, and a dislike of sitting at a stranger's elbow produces a different one (alternate seats) that the late arrivals then destroy. The pattern lives in the interaction, which is why the following items simulate it: segregation from neighbourhood preferences (soc-1.2), tipping (soc-1.6), cascades of joiners (soc-1.8).`,
      caption: String.raw`People enter one at a time and each picks among the empty seats, favouring seats that suit the chosen motive (with some idiosyncratic randomness). Colour shows arrival order, from the first (purple) to the last (yellow); the latest arrival has a red ring. Drag **people arrived** to replay the filling, pick a motive above or mix them with the sliders, and compare the row profile on the right with the dashed level of a randomly seated audience. With *someone just ahead* (a newcomer prefers a seat with somebody in the two rows in front, within two seats to either side) no rule mentions rows, yet the front empties.`,
      deps: [],
      see: ['soc-1.10', 'soc-9.1', 'soc-9.4'],
      refs: ['Schelling ch. 1'],
      tags: ['emergence', 'agent-based'],
      credit: 'Schelling, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Emergence' },
      viz(v) {
        const PRE = { cover: [0, 1.5, 0], back: [0.6, 0, 0], gap: [0, 0, 1.5], none: [0, 0, 0] };
        const pre = v.select('everyone wants', [{ value: 'cover', label: 'someone just ahead' }, { value: 'back', label: 'to sit a bit back' }, { value: 'gap', label: 'a free seat beside' }, { value: 'none', label: 'nothing in particular' }], 'cover',
          { onChange: (k) => { const [b, c, a] = PRE[k]; bS.set(b); cS.set(c); aS.set(a); } });
        const nS = v.slider('people arrived', 0, CAP, 185, { int: true, step: 1 });
        const bS = v.slider('taste for the back', 0, 2, 0, { step: 0.05 });
        const cS = v.slider('wants someone just ahead', 0, 3, 1.5, { step: 0.05 });
        const aS = v.slider('dislikes an elbow neighbour', 0, 3, 0, { step: 0.05 });
        let seed = 1988;
        v.button('New audience', () => { seed += 1; });
        const Hs = v.stage({ x: [-0.4, SEATS + 0.4], y: [-2.2, ROWS + 0.3], height: 370, weight: 1.5, axes: false, title: 'the hall, seen from above' });
        const Bs = v.stage({ x: [-0.02, 1.08], y: [-2.2, ROWS + 0.3], height: 370, weight: 0.6, minWidth: 190, axes: false, title: 'share of each row taken' });
        const ord = (u) => v.M.cmap(0.12 + 0.8 * u, 'viridis');
        v.legend([[ord(0), 'first to arrive', { dot: true }], [ord(0.5), 'midway', { dot: true }], [ord(1), 'last to arrive', { dot: true }], ['red', 'latest arrival (ring)', { dot: true }], ['muted', 'random seating', { dash: true }]]);
        let key = '', sim = null, st = null;
        v.render(() => {
          const k = [bS.value, cS.value, aS.value, seed].join('|');
          if (k !== key) { key = k; sim = fillHall(bS.value, cS.value, aS.value, seed); }
          const n = nS.value, { occ, seq } = sim;
          // stage / lectern
          Hs.rect(SEATS / 2 - 5, -1.9, SEATS / 2 + 5, -0.85, { fill: 'faint', fillAlpha: 0.35, stroke: false, radius: 6 });
          Hs.text('stage', SEATS / 2, -1.37, { color: 'muted', size: 12, align: 'center' });
          const rowCount = new Array(ROWS).fill(0); let elbow = 0;
          for (let r = 0; r < ROWS; r++) for (let s = 0; s < SEATS; s++) {
            const q = r * SEATS + s, i = occ[q], here = i >= 0 && i < n;
            const x0 = s + 0.1, y0 = r + 0.14, x1 = s + 0.9, y1 = r + 0.86;
            if (!here) { Hs.rect(x0, y0, x1, y1, { fill: 'grid', fillAlpha: 1, stroke: false, radius: 3 }); continue; }
            rowCount[r]++;
            const left = s > 0 && occ[q - 1] >= 0 && occ[q - 1] < n, right = s < SEATS - 1 && occ[q + 1] >= 0 && occ[q + 1] < n; if (left || right) elbow++;
            Hs.rect(x0, y0, x1, y1, { fill: ord(n > 1 ? i / (n - 1) : 0), fillAlpha: 1, stroke: false, radius: 3 });
          }
          if (n > 0) { const q = seq[n - 1], r = Math.floor(q / SEATS), s = q % SEATS; Hs.rect(s + 0.02, r + 0.06, s + 0.98, r + 0.94, { color: 'red', width: 2.4, radius: 4 }); }
          // row profile
          const lvl = n / CAP, KB = 0.84;
          for (let r = 0; r < ROWS; r++) Bs.rect(0, r + 0.18, (KB * rowCount[r]) / SEATS, r + 0.82, { fill: rowCount[r] ? 'purple' : 'grid', fillAlpha: rowCount[r] ? 0.75 : 1, stroke: false, radius: 2 });
          Bs.line(KB * lvl, -0.1, KB * lvl, ROWS + 0.1, { color: 'muted', dash: [5, 4], width: 1.4 });
          Bs.line(KB, -0.1, KB, ROWS + 0.1, { color: 'faint', width: 1, dash: [2, 3] });
          Bs.line(0, -0.1, 0, ROWS + 0.1, { color: 'faint', width: 1 });
          Bs.text('back', 1.06, ROWS - 0.5, { color: 'muted', size: 11, align: 'right' });
          Bs.text('front', 1.06, 0.5, { color: 'muted', size: 11, align: 'right' });
          Bs.text(`random: ${pc(lvl)}`, Math.min(Math.max(KB * lvl, 0.3), 0.7), -0.7, { color: 'muted', size: 11, align: 'center' });
          Bs.text('full', KB, -0.7, { color: 'faint', size: 10.5, align: 'left', dx: 4 });
          let empty = 0; while (empty < ROWS && rowCount[empty] === 0) empty++;
          const front4 = rowCount.slice(0, 4).reduce((x, y) => x + y, 0), back4 = rowCount.slice(ROWS - 4).reduce((x, y) => x + y, 0);
          st = { n, empty, front: n ? front4 / n : 0, back: n ? back4 / n : 0, elbow: n ? elbow / n : 0, meanRow: n ? rowCount.reduce((x, y, r) => x + y * (r + 1), 0) / n : 0 };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, empty, front, back, elbow, meanRow } = st;
          if (!n) return 'The hall is empty: drag **people arrived**.';
          const why = bS.value === 0 && cS.value > 0 ? ' — although nobody here has any preference among rows: the front empties only because each newcomer wants somebody just ahead' : bS.value > 0 && cS.value === 0 && aS.value === 0 ? ' — a mild individual preference, sharpened into a hard edge by the order of arrival' : aS.value > 0 && bS.value === 0 && cS.value === 0 ? ' — everyone wanted a free seat beside them, but once the alternate seats are gone the latecomers must sit at someone’s elbow' : '';
          const rnd = Math.min(1, 4 / ROWS);
          return `${n} of ${CAP} seats taken · the front 4 rows hold **${pc(front)}** of the audience and the back 4 rows **${pc(back)}** (random seating: ${pc(rnd)} each)${empty ? (empty === 1 ? ' · the front row is completely empty' : ` · the first ${empty} rows are completely empty`) : ''} · mean row ${v.fix(meanRow, 1)} of ${ROWS} · ${pc(elbow)} have someone at their elbow${why}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'Schelling’s segregation model',
      statement: String.raw`Two kinds of agents, blue and orange, occupy the cells of a grid in which some cells are vacant. Each agent looks at its eight surrounding cells and is **content** if at least a fraction $T$ of its occupied neighbours are of its own kind (an agent with no neighbours is content); otherwise it is **discontented**. In each round the discontented move, one at a time in random order, to vacant cells — in the simplest version to any vacancy, in versions closer to Schelling's to a vacancy where they would be content. Rounds repeat until nobody is discontented (or until nobody can move).

The model's output is a spatial pattern and its degree of segregation, measured for instance by the average share of like neighbours, to be compared with the value under random mixing ($s^2 + (1-s)^2$ when a share $s$ of agents is blue).`,
      scope: String.raw`A deliberately stylised model: a regular grid, two groups, the same tolerance for everyone, costless moves, and preferences only about neighbours' type. It shows that mild preferences are *sufficient* for strong segregation, not that they are its actual cause in any city, where prices, institutions and discrimination also act.`,
      idea: String.raw`A discontented agent's move does more than raise its own like share: it changes two neighbourhoods. Where it leaves, its kind becomes rarer, which can push the remaining neighbours of its kind below $T$; where it arrives, it thickens a cluster of its own kind and pushes members of the other kind there toward discontent. Moves beget moves, and the cascade stops only when clusters are large enough that their boundaries are short compared with their areas. The histogram of like shares shows the result: a distribution that starts centred on the random-mixing value ends piled up near 1, far above the line $T$ that anyone asked for (soc-1.3 maps this across all $T$; soc-1.10 is Schelling's own version, worked by hand).`,
      caption: String.raw`Press ▶ (or **Step**) and watch discontented agents relocate. The right panel sorts residents by their share of like neighbours: red residents are below the tolerance line $T$ and will move, purple ones are content; the dashed outline is the starting distribution. The strip below tracks the average like share against the random-mixing level. Click any cell to inspect its neighbourhood. Change $T$ (the run resumes), the vacancies or the blue share (new board), or let movers pick only *a vacancy that suits them*.`,
      deps: ['soc-1.1'],
      see: ['soc-1.10'],
      refs: ['Schelling ch. 4', 'E&K §4.5'],
      tags: ['segregation', 'agent-based'],
      credit: 'Schelling, 1969–1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Schelling%27s_model_of_segregation' },
      viz(v) {
        const N = 50;
        let A = null;
        const T = v.slider('tolerance $T$ (content if like share ≥ T)', 0, 0.9, 0.3, { step: 0.01, fmt: pc, onChange: () => A.resume() });
        const vac = v.slider('vacant cells', 0.02, 0.4, 0.1, { step: 0.01, fmt: pc, onChange: () => { A.reset(); v.restart(); } });
        const shA = v.slider('blue share', 0.2, 0.8, 0.5, { step: 0.01, fmt: pc, onChange: () => { A.reset(); v.restart(); } });
        const rule = v.select('the discontented move to', [{ value: 'random', label: 'any vacancy' }, { value: 'content', label: 'a vacancy that suits them' }], 'random', { onChange: () => { A.reset(); v.restart(); } });
        const s = v.stage({ height: 340, weight: 1.1, title: 'the city (torus)' });
        const hs = v.stage({ x: [-0.03, 1.03], y: [0, 0.5], height: 340, axes: 'box', title: 'residents by share of like neighbours' });
        const ts = v.stage({ height: 150, axes: 'box', full: true, xlabel: 'round', title: '' });
        const city = (M) => ({ w: M.w, h: M.h, g: M.grid, R: M.rng });
        const BINS = 10;
        const histOf = (M) => {
          const st = cityStats(city(M), T.value, true), ok = new Array(BINS).fill(0), bad = new Array(BINS).fill(0), n = st.vals.length || 1;
          st.vals.forEach((f, i) => { const b = Math.min(BINS - 1, Math.floor(f * BINS + 1e-9)); (st.bad[i] ? bad : ok)[b] += 1 / n; });
          return { ok, bad };
        };
        A = v.agents(s, {
          size: N, seed: 12, speed: 3, still: 9,
          states: [{ name: 'vacant', color: null }, { name: 'blue', color: 'blue' }, { name: 'orange', color: 'orange' }],
          init: (r) => (r() < 1 - vac.value ? (r() < shA.value ? 1 : 2) : 0),
          setup: (M) => { M.data.h0 = histOf(M); },
          step: (M) => { const r = cityStep(city(M), T.value, rule.value); M.data.moved = r.moved; },
          stats: (M) => { const st = cityStats(city(M), T.value); return { segregation: st.like, unhappy: st.unhappy }; },
          stopWhen: (M) => M.stats.unhappy === 0 || M.data.moved === 0,
        });
        let sel = -1;
        s.onClick((x, y) => { const i = Math.floor(x), j = N - 1 - Math.floor(y); sel = i >= 0 && j >= 0 && i < N && j < N ? j * N + i : -1; });
        v.legend([['blue', 'blue agents', { dot: true }], ['orange', 'orange agents', { dot: true }], ['purple', 'content', { area: true }], ['red', 'discontented (moves)', { area: true }], ['muted', 'at the start', { dash: true }]]);
        let info = null;
        v.render(() => {
          const M = A.model;
          A.draw();
          // inspected neighbourhood
          if (sel >= 0 && M.grid[sel]) {
            const i0 = sel % N, j0 = (sel / N) | 0;
            for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const i = (i0 + di + N) % N, j = (j0 + dj + N) % N; s.rect(i, N - j - 1, i + 1, N - j, { color: di || dj ? 'ink' : 'gold', width: di || dj ? 1.2 : 2.4 }); }
            const c = nbCounts(city(M), sel, new Int32Array(3)), me = M.grid[sel], occ = c[1] + c[2];
            info = { me, like: c[me], occ, ok: !occ || c[me] >= T.value * occ - 1e-9 };
          } else info = null;
          // histogram
          const H = histOf(M), H0 = M.data.h0;
          const ymax = Math.max(0.3, ...H.ok.map((o, b) => o + H.bad[b]), ...H0.ok.map((o, b) => o + H0.bad[b])) * 1.12;
          hs.setView([-0.03, 1.03], [-ymax * 0.075, ymax * 1.1]);
          for (let b = 0; b < BINS; b++) {
            const x0 = b / BINS + 0.006, x1 = (b + 1) / BINS - 0.006;
            if (H.ok[b]) hs.rect(x0, 0, x1, H.ok[b], { fill: 'purple', fillAlpha: 0.6, stroke: false });
            if (H.bad[b]) hs.rect(x0, H.ok[b], x1, H.ok[b] + H.bad[b], { fill: 'red', fillAlpha: 0.7, stroke: false });
          }
          const outline = []; for (let b = 0; b < BINS; b++) { const y = H0.ok[b] + H0.bad[b]; outline.push([b / BINS, y], [(b + 1) / BINS, y]); }
          hs.path([[0, 0], ...outline, [1, 0]], { color: 'muted', width: 1.6, dash: [5, 4] });
          hs.vline(T.value, { color: 'ink', width: 1.6 });
          hs.text(`T = ${pc(T.value)}: move ← | → stay`, T.value, ymax * 1.03, { color: 'ink', size: 12, align: T.value > 0.6 ? 'right' : 'left', dx: T.value > 0.6 ? -6 : 6, weight: 600 });
          // time series
          A.plot(ts, { series: ['segregation', 'unhappy'], colors: { segregation: 'purple', unhappy: 'red' }, names: { segregation: 'like-neighbour share', unhappy: 'discontented' }, minWindow: 30, y: [-0.16, 1.06] });
          const base = shA.value ** 2 + (1 - shA.value) ** 2;
          ts.hline(base, { color: 'muted', dash: [5, 4], width: 1.2 });
          ts.text('random mixing', ts.bounds.x[1], base, { color: 'muted', size: 11, dx: -8, dy: 9, align: 'right' });
        });
        v.readout(() => {
          const M = A.model, base = shA.value ** 2 + (1 - shA.value) ** 2;
          const sel_ = info ? ` · inspected ${info.me === 1 ? 'blue' : 'orange'} agent: ${info.like} of ${info.occ} neighbours alike (${info.occ ? pc(info.like / info.occ) : '—'}) → ${info.ok ? 'content' : '**moves**'}` : '';
          return `round ${M.t}${M.done ? (M.stats.unhappy ? ' — **stuck**: the discontented find no vacancy that suits them' : ' — **settled**') : ''} · average like-neighbour share **${pc(M.stats.segregation)}** (random mixing ${pc(base)}) · discontented ${pc1(M.stats.unhappy)} · yet each agent asks only for ${pc(T.value)}${sel_}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Phenomenon',
      name: 'Mild preferences, strong segregation',
      statement: String.raw`In Schelling's model (soc-1.2) the segregation that results is far greater than the segregation anyone demands. On a board with equal groups and about 10% vacancies, agents who ask only that a third of their neighbours be like them settle where about three-quarters are; at $T = 1/2$ the like share is well above 80%. The relation between the demand $T$ and the outcome is strongly non-linear:
- below $T \approx 1/4$ random arrangements already satisfy nearly everyone and little changes;
- between $1/4$ and $1/2$ the outcome climbs steeply, far above the line "outcome = demand";
- above that segregation is nearly total;
- and when $T$ is so demanding that few arrangements can satisfy it, there is no equilibrium at all: agents keep moving and the board stays mixed (or, if they move only to suitable places, freezes).

A smaller group ends up more isolated relative to random mixing than the majority.`,
      scope: String.raw`The thresholds quoted are for this board ($30 \times 30$ torus, eight neighbours, the chosen vacancy rate and move rule, each value the average of two runs); they shift with the neighbourhood size, the vacancy rate and the move rule, but the shape — little effect, then a steep climb, then collapse — is robust.`,
      idea: String.raw`Each agent's requirement is a floor, not a target, but the dynamics overshoot it. A move that satisfies one agent can unsettle others (soc-1.2), so the process only stops in configurations where almost everyone is comfortably above the floor, and those require large homogeneous clusters with short boundaries. With eight neighbours, the first demands that random mixing fails to meet are around $2/8$–$3/8$, which is where the climb begins. At very high $T$ an agent can be satisfied only deep inside a cluster, where vacancies are rare, so moving never ends. The micro-level demand is a poor predictor of the macro-level outcome — Schelling's central point (soc-1.10).`,
      caption: String.raw`Each point is a full simulation run to rest at that tolerance (two seeds per $T$). Purple: the settled average share of like neighbours; red: the share still discontented at the end; the dashed diagonal is "outcome = demand" and the dashed level is random mixing; the purple shading is segregation nobody asked for. Drag the handle along the curve to see that run's final board. Switch the move rule, the vacancies, or make blue a 25% minority (curves split by group).`,
      deps: ['soc-1.2'],
      refs: ['Schelling ch. 4'],
      tags: ['segregation', 'emergence'],
      credit: 'Schelling, 1971',
      viz(v) {
        const W = 30, NT = 19, DT = 0.05;
        const rule = v.select('move to', [{ value: 'random', label: 'any vacancy' }, { value: 'content', label: 'a suitable vacancy' }], 'random', { onChange: () => snap() });
        const vacS = v.select('vacancies', [{ value: '10', label: '10%' }, { value: '25', label: '25%' }], '10', { onChange: () => snap() });
        const shS = v.select('blue share', [{ value: '50', label: '50%' }, { value: '25', label: '25% (minority)' }], '50', { onChange: () => snap() });
        const P = v.stage({ x: [-0.03, 0.93], y: [-0.24, 1.05], yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], height: 350, weight: 1.35, axes: 'box', xlabel: 'tolerance $T$ (share of like neighbours each agent asks for)', title: 'like-neighbour share at rest, against the demand $T$' });
        const Bd = v.stage({ x: [0, W], y: [0, W], height: 350, weight: 0.75, minWidth: 220, axes: false, equal: true, title: 'final board' });
        const cache = new Map();
        const data = () => {
          const key = `${rule.value}|${vacS.value}|${shS.value}`;
          if (!cache.has(key)) {
            const vac = +vacS.value / 100, sh = +shS.value / 100, out = { like: [], likeA: [], likeB: [], un: [], steps: [], boards: [], stuck: [] };
            for (let i = 0; i < NT; i++) {
              const T = i * DT, L = [];
              let LA = 0, LB = 0, U = 0, S = 0, board = null, stuck = false;
              for (let sd = 0; sd < 2; sd++) {
                const C = makeCity(W, W, vac, sh, 7919 * sd + 31 * i + 5); let k = 0, r = null;
                for (; k < 100; k++) { r = cityStep(C, T, rule.value); if (!r.unhappy || !r.moved) break; }
                const st = cityStats(C, T); L.push(st.like); LA += st.likeA / 2; LB += st.likeB / 2; U += st.unhappy / 2; S += k / 2;
                if (sd === 0) { board = C.g.slice(); stuck = st.unhappy > 0; }
              }
              out.like.push(L); out.likeA.push(LA); out.likeB.push(LB); out.un.push(U); out.steps.push(S); out.boards.push(board); out.stuck.push(stuck);
            }
            cache.set(key, out);
          }
          return cache.get(key);
        };
        const mean = (a) => (a[0] + a[1]) / 2;
        const idx = (x) => Math.max(0, Math.min(NT - 1, Math.round(x / DT)));
        const h = P.handle(0.3, 0.7, { color: 'purple', constrain: (x) => { const i = idx(x); return [i * DT, mean(data().like[i])]; } });
        function snap() { const i = idx(h.x); h.set(i * DT, mean(data().like[i])); }
        snap();
        v.render(() => {
          const d = data(), sh = +shS.value / 100, minority = sh < 0.5, i0 = idx(h.x), Ts = d.like.map((_, i) => i * DT);
          const base = sh * sh + (1 - sh) * (1 - sh);
          const curve = d.like.map((L, i) => [Ts[i], mean(L)]);
          // excess segregation: between the outcome curve and max(diagonal, random mixing)
          const floor = (T) => Math.max(T, base);
          const poly = []; curve.forEach(([T, y]) => poly.push([T, Math.max(y, floor(T))])); for (let i = curve.length - 1; i >= 0; i--) poly.push([curve[i][0], floor(curve[i][0])]);
          P.poly(poly, { fill: 'purple', fillAlpha: 0.1, stroke: false });
          P.line(0, 0, 0.92, 0.92, { color: 'muted', dash: [5, 4], width: 1.3 });
          P.text('outcome = demand', 0.3, 0.3, { color: 'muted', size: 11, align: 'left', dx: 10, dy: 8 });
          P.hline(base, { color: 'muted', dash: [2, 4], width: 1.3 });
          P.text('random mixing', 0.0, base, { color: 'muted', size: 11, align: 'left', dy: 10 });
          if (minority) {
            P.path(d.likeA.map((y, i) => [Ts[i], y]), { color: 'blue', width: 2 }); P.path(d.likeB.map((y, i) => [Ts[i], y]), { color: 'orange', width: 2 });
            P.hline(sh, { color: 'blue', dash: [2, 4], width: 1 }); P.text('blue: random mixing', 0.5, sh, { color: 'blue', size: 10.5, align: 'center', dy: 10 });
          }
          P.path(d.un.map((y, i) => [Ts[i], y]), { color: 'red', width: 1.8 });
          P.path(curve, { color: 'purple', width: 2.6 });
          d.like.forEach((L, i) => L.forEach((y) => P.dot(Ts[i], y, { r: 2.6, color: 'purple', alpha: 0.6 })));
          P.vline(h.x, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.6 });
          // board
          const g = d.boards[i0];
          Bd.rect(0, 0, W, W, { fill: 'panel', fillAlpha: 1, color: 'faint', width: 1 });
          for (let k = 0; k < g.length; k++) { if (!g[k]) continue; const x = k % W, y = W - 1 - ((k / W) | 0); Bd.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { fill: g[k] === 1 ? 'blue' : 'orange', fillAlpha: 0.9, stroke: false }); }
          Bd.setTitle(`final board at T = ${pc(i0 * DT)}${d.stuck[i0] ? (rule.value === 'random' ? ' — never settles' : ' — frozen') : ''}`);
          v.legend([['purple', 'like-neighbour share at rest'], ...(minority ? [['blue', 'blue (minority)'], ['orange', 'orange (majority)']] : []), ['red', 'still discontented at the end'], ['purple', 'segregation nobody asked for', { area: true }]]);
        });
        v.readout(() => {
          const d = data(), i = idx(h.x), T = i * DT, y = mean(d.like[i]), sh = +shS.value / 100, base = sh * sh + (1 - sh) * (1 - sh);
          const t30 = mean(d.like[6]), t35 = mean(d.like[7]), half = mean(d.like[10]);
          const grp = sh < 0.5 ? ` · blues (25%) end with ${pc(d.likeA[i])} like neighbours against a random ${pc(sh)} (×${v.fix(d.likeA[i] / sh, 1)}); oranges ${pc(d.likeB[i])} against ${pc(1 - sh)} (×${v.fix(d.likeB[i] / (1 - sh), 1)})` : '';
          const tail = d.un[i] > 0.05 ? ` — **no equilibrium**: ${pc(d.un[i])} are still discontented after 100 rounds` : ` after ${v.fix(d.steps[i], 0)} rounds`;
          return `$T = ${v.fix(T, 2)}$: settled like-neighbour share **${pc(y)}** (random mixing ${pc(base)}, demand ${pc(T)})${tail}${grp} · on this board: ${pc(t30)} at $T = 0.30$ and ${pc(t35)} at $T = 0.35$ (a third lies between), ${pc(half)} at $T = 0.50$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Measuring segregation: dissimilarity and exposure',
      statement: String.raw`Divide a city into tracts $i = 1, \dots, n$ containing $a_i$ members of group A and $b_i$ of group B, with $t_i = a_i + b_i$ and city totals $A = \sum a_i$, $B = \sum b_i$.

(a) The **dissimilarity index** is $$D = \frac12 \sum_{i=1}^n \left| \frac{a_i}{A} - \frac{b_i}{B} \right| \in [0, 1].$$ It is 0 when every tract has the city's mix and 1 when no tract contains both groups. It equals the smallest fraction of A (equivalently, of B) who would have to change tracts for every tract to match the city's mix, and it is the largest vertical gap between the diagonal and the *segregation curve* — the cumulative share of B plotted against the cumulative share of A, tracts taken in decreasing order of their A share.

(b) The **exposure index** of A to B, $P^*_{AB} = \sum_i \frac{a_i}{A}\,\frac{b_i}{t_i}$, is the share of B in the tract of the average member of A; the **isolation index** is $P^*_{AA} = \sum_i \frac{a_i}{A}\,\frac{a_i}{t_i} = 1 - P^*_{AB}$. Exposure depends on group sizes — $A\,P^*_{AB} = B\,P^*_{BA}$ — so it is asymmetric when one group is a minority, while $D$ is symmetric.

Both indices see only tract counts, so their values depend on how the tracts are drawn.`,
      idea: String.raw`$D$ is half the $\ell^1$ distance between two distributions over tracts — where the A's live and where the B's live. Moving one A member from a tract with more than its share of A into one with less lowers $D$ by exactly $1/A$, which gives the "share who would have to move" reading, and sorting tracts by composition turns $D$ into the maximum gap of a Lorenz-type curve. Exposure instead measures the surroundings of the average person, which is what Schelling's like-neighbour share (soc-1.2) measures at the scale of eight neighbours. Because both indices are blind to arrangement *within* tracts, a fine checkerboard of households scores as perfectly integrated, and narrow stripes score as perfectly segregated or perfectly integrated depending on the tract size: the modifiable areal unit problem, a cousin of Simpson's paradox (causal-4.4).`,
      caption: String.raw`A city of $24 \times 24$ households (blue = A, orange = B) divided into tracts. Choose a city, then drag on the map to repaint households with the **brush** colour. The right panel is the segregation curve, with $D$ marked as its largest gap from the diagonal. Change the **tract size** — the households stay put, only the boundaries move — and switch on **census view** to see the city as the indices see it, each tract shaded by its mix (white = the city's mix) and labelled with its blue share.`,
      deps: ['soc-1.2'],
      see: ['causal-4.4'],
      refs: ['Schelling ch. 4'],
      tags: ['segregation', 'measurement'],
      credit: 'Duncan & Duncan, 1955; Lieberson, 1981',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Index_of_dissimilarity' },
      viz(v) {
        let g = cityPreset('schelling', 11);
        const preset = v.select('city', [{ value: 'schelling', label: 'Schelling run' }, { value: 'random', label: 'random' }, { value: 'halves', label: 'two halves' }, { value: 'enclave', label: 'enclave' }, { value: 'stripes', label: 'stripes' }, { value: 'checker', label: 'checkerboard' }], 'schelling', { onChange: (k) => { g = cityPreset(k, 11); } });
        const ksel = v.select('tract size', [2, 3, 4, 6, 8, 12].map((k) => ({ value: String(k), label: `${k}×${k}` })), '4');
        const brush = v.select('brush', [{ value: '1', label: 'blue' }, { value: '2', label: 'orange' }], '2');
        const census = v.toggle('census view', false);
        const M = v.stage({ x: [0, CW], y: [0, CW], height: 360, weight: 1.05, axes: false, equal: true, title: 'the city and its tracts' });
        const S = v.stage({ x: [-0.08, 1.04], y: [-0.08, 1.04], height: 360, weight: 0.95, axes: 'box', ylabel: 'cumulative share of oranges', title: 'segregation curve: oranges (up) against blues (across)' });
        M.onDrag((x, y) => { const b = +brush.value; for (let j = Math.floor(y - 1.3); j <= y + 1.3; j++) for (let i = Math.floor(x - 1.3); i <= x + 1.3; i++) if (i >= 0 && j >= 0 && i < CW && j < CW && Math.hypot(i + 0.5 - x, j + 0.5 - y) < 1.4) g[j * CW + i] = b; });
        v.legend([['blue', 'A: blue households', { dot: true }], ['orange', 'B: orange households', { dot: true }], ['purple', 'segregation curve'], ['red', '$D$ = largest gap']]);
        let res = null;
        v.render(() => {
          const k = +ksel.value, R = tractIndices(g, k), n = R.n;
          if (census.value) {
            const cB = R.B / (R.A + R.B);
            for (let tj = 0; tj < n; tj++) for (let ti = 0; ti < n; ti++) { const t = tj * n + ti, sB = R.b[t] / (R.a[t] + R.b[t]); M.rect(ti * k, tj * k, (ti + 1) * k, (tj + 1) * k, { fill: v.diverge(sB > cB ? (sB - cB) / (1 - cB) : (sB - cB) / cB, 'blue', 'orange'), fillAlpha: 1, stroke: false }); }
          } else {
            for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) M.rect(i + 0.07, j + 0.07, i + 0.93, j + 0.93, { fill: g[j * CW + i] === 1 ? 'blue' : 'orange', fillAlpha: 0.85, stroke: false });
          }
          const lines = []; for (let q = 0; q <= n; q++) lines.push([q * k, 0], [q * k, CW], null, [0, q * k], [CW, q * k], null);
          M.path(lines, { color: 'ink', width: 1.4, alpha: 0.75 });
          if (census.value && n <= 6) for (let tj = 0; tj < n; tj++) for (let ti = 0; ti < n; ti++) { const t = tj * n + ti; M.text(pc(R.a[t] / (R.a[t] + R.b[t])), (ti + 0.5) * k, (tj + 0.5) * k, { size: 11, align: 'center', color: 'ink' }); }
          // segregation curve
          const ord = Array.from({ length: n * n }, (_, t) => t).sort((p, q) => R.a[q] / (R.a[q] + R.b[q]) - R.a[p] / (R.a[p] + R.b[p]));
          const pts = [[0, 0]]; let X = 0, Y = 0, best = 0, at = [0, 0];
          for (const t of ord) { X += R.a[t] / R.A; Y += R.b[t] / R.B; pts.push([X, Y]); if (X - Y > best) { best = X - Y; at = [X, Y]; } }
          S.line(0, 0, 1, 1, { color: 'muted', dash: [5, 4], width: 1.3 });
          S.path([...pts, [1, 0]], { fill: 'purple', fillAlpha: 0.1, stroke: false, close: true });
          S.path(pts, { color: 'purple', width: 2.4 });
          pts.forEach((p) => S.dot(p[0], p[1], { r: 2, color: 'purple' }));
          if (best > 0.005) { const lft = at[0] > 0.55; S.arrow(at[0], at[1], at[0], at[0], { color: 'red', width: 2, both: true, head: 7 }); S.tex(`D = ${v.fix(best, 2)}`, at[0], (at[0] + at[1]) / 2, { color: 'red', align: lft ? 'right' : 'left', dx: lft ? -8 : 8, size: 15 }); }
          S.text('evenness', 0.6, 0.6, { color: 'muted', size: 11, dx: -8, dy: -10, align: 'right' });
          const all = [2, 3, 4, 6, 8, 12].map((kk) => [kk, tractIndices(g, kk).D]);
          res = { k, R, all };
        });
        v.readout(() => {
          if (!res) return '';
          const { k, R, all } = res, share = R.B / (R.A + R.B);
          return `$D = ${v.fix(R.D, 3)}$ with ${R.n * R.n} tracts of ${k}×${k}: ${pc(R.D)} of the blues (or of the oranges) would have to change tracts for every tract to be ${pc(1 - share)} blue like the city · exposure: the average blue lives in a tract that is **${pc(R.PAB)}** orange (isolation ${pc(1 - R.PAB)}), the average orange in one that is **${pc(R.PBA)}** blue · check: $A\\,P^*_{AB} = ${v.fix(R.A * R.PAB, 1)} = B\\,P^*_{BA}$ · $D$ by tract size: ${all.map(([kk, d]) => `${kk}×${kk} ${v.fix(d, 2)}`).join(' · ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Bounded-neighbourhood tipping',
      statement: String.raw`Schelling's bounded-neighbourhood model concerns one area that anyone may enter or leave, and two groups (his were whites and blacks; here blues $W$ and oranges $B$). Each blue has a **tolerance**: the largest ratio of oranges to blues at which he is willing to live in the area; each orange likewise tolerates up to some ratio of blues to oranges. List each group from most to least tolerant. If the $w$ most tolerant blues are present, all of them are content with $b$ oranges as long as $b \le T_W(w) := w\,t_W(w)$, where $t_W(w)$ is the $w$-th highest blue tolerance; likewise oranges with $T_B(b) = b\,t_B(b)$.

Discontented residents leave, least tolerant first, and outsiders who would be content enter, most tolerant first. So the state $(w, b)$ moves right (blues enter) below the curve $b = T_W(w)$ and left above it, up (oranges enter) to the left of the curve $w = T_B(b)$ and down to its right. Equilibria are the crossings of the two curves and the all-blue and all-orange corners.

For straight-line tolerance schedules (tolerances spread uniformly from 0 to $R$) the curves are parabolas, $T_W(w) = R_W\,w\,(1 - w/m_W)$. In Schelling's first example, 100 blues and 50 oranges with $R_W = R_B = 2$, the only stable outcomes are all-blue and all-orange: the mixed equilibrium near $(21.7, 34.0)$ is a saddle, a **tipping point**. With 100 of each and $R = 5$ a stable mixture appears at $(80, 80)$, but it is flanked by two saddles, so a large enough shock still tips the area.`,
      scope: String.raw`One bounded area with free entry and exit; residents care only about the ratio of the two groups present; the residents present are always the most tolerant ones (Schelling's simplifying assumption, which Dokumacı and Sandholm, 2007, replace by an explicit best-response dynamic with the same equilibria — the dynamic drawn here).`,
      idea: String.raw`With few blues present only the most tolerant are there, and they accept a high ratio but number few; with many, the area includes the intolerant, who accept few oranges. The number of oranges a blue population will put up with therefore peaks in the middle, which is why $T_W$ is hump-shaped. Linearising at a crossing, the mixed equilibrium is stable only when both groups are on the falling side of their humps — each extra member is less tolerant than those already present, which is self-correcting — and the curves cut steeply enough (the product of their slopes exceeds 1). In the first example the blues at the crossing are on the rising side: an extra blue makes room for more blues, one fewer drives out more, and the area tips (soc-1.6 isolates this geometry). The separatrices through the saddles are the "tipping" boundaries.`,
      caption: String.raw`Left: the state of the area, blues present across and oranges present up. The blue curve is $b = T_W(w)$ (blues enter below it), the orange curve $w = T_B(b)$ (oranges enter to its left); arrows show the flow and faint shading the basin of each outcome. Drag the starting mix and follow the trajectory. Right: the two tolerance schedules, with the current ratio — the residents above it are content. Load Schelling's examples or change the number of oranges (there are always 100 blues) and the top tolerances $R_W$ (oranges per blue that the most tolerant blue accepts) and $R_B$.`,
      deps: ['soc-1.2', 'ode-6.1'],
      see: ['ode-6.9', 'soc-1.10'],
      refs: ['Schelling ch. 4'],
      tags: ['segregation', 'tipping', 'dynamics'],
      credit: 'Schelling, 1971',
      viz(v) {
        const EX = { one: [50, 2, 2], two: [100, 5, 5], three: [70, 3, 6] };
        const ex = v.select('example', [{ value: 'one', label: 'Schelling 1: 100 vs 50, up to 2 : 1' }, { value: 'two', label: 'Schelling 2: 100 vs 100, up to 5 : 1' }, { value: 'three', label: 'tolerant oranges: 100 vs 70' }], 'one',
          { onChange: (k) => { const [m, a, b] = EX[k]; mB.set(m); RW.set(a); RB.set(b); place(); } });
        const mB = v.slider('oranges in the city $m_B$', 10, 150, 50, { int: true, step: 1, onChange: () => place() });
        const RW = v.slider('top blue tolerance $R_W$', 0.2, 6, 2, { step: 0.05 });
        const RB = v.slider('top orange tolerance $R_B$', 0.2, 6, 2, { step: 0.05 });
        const mW = 100;
        const P = v.stage({ x: [0, 100], y: [0, 50], height: 370, weight: 1.3, axes: 'box', title: 'blues present $w$ (across), oranges present $b$ (up)' });
        const Q = v.stage({ x: [0, 100], y: [0, 2.2], height: 370, weight: 0.8, minWidth: 230, axes: 'box', ylabel: 'tolerated ratio', title: 'tolerance schedules (most tolerant first)' });
        const start = P.handle(30, 22, { color: 'ink', label: 'start', labelPos: 'ne' });
        function place() { start.set(Math.min(start.x, mW), Math.min(start.y, mB.value)); }
        v.legend([['blue', 'blues content: $b \\le T_W(w)$'], ['orange', 'oranges content: $w \\le T_B(b)$'], ['ink', 'trajectory'], ['green', 'stable', { dot: true }], ['red', 'tipping point', { dot: true }]]);
        let bkey = '', basin = null, out = null;
        v.render(() => {
          const m = mB.value, Rw = RW.value, Rb = RB.value, T = tipModel(mW, m, Rw, Rb);
          P.setView([-0.07 * mW, 1.04 * mW], [-0.08 * m, 1.1 * m]);
          P.rect(0, 0, mW, m, { color: 'faint', width: 1, dash: [3, 3] });
          // basins (cached): which outcome each starting mix ends in
          const key = [m, Rw, Rb].join('|');
          if (key !== bkey) {
            bkey = key; basin = []; const nx = 34, ny = 26;
            for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x0 = ((i + 0.5) / nx) * mW, y0 = ((j + 0.5) / ny) * m, [x, y] = T.run(x0, y0, 40, 0.08); basin.push([i, j, x, y]); }
            basin.nx = nx; basin.ny = ny;
          }
          for (const [i, j, x, y] of basin) {
            const col = y < 0.05 * m && x > 0.5 * mW ? 'blue' : x < 0.05 * mW && y > 0.5 * m ? 'orange' : 'green';
            P.rect((i / basin.nx) * mW, (j / basin.ny) * m, ((i + 1) / basin.nx) * mW, ((j + 1) / basin.ny) * m, { fill: col, fillAlpha: 0.09, stroke: false });
          }
          const kx = P.X(1) - P.X(0), ky = P.Y(0) - P.Y(1);
          P.clip(() => P.field((x, y) => { const [u, w] = T.f(x, y); const L = Math.hypot(u * kx, w * ky); return L > 1e-9 ? [u / L, w / L] : [0, 0]; }, { spacing: 38, color: 'muted', alpha: 0.5 }), [0, mW], [0, m]);
          P.fn((x) => T.TW(x), { domain: [0, mW], color: 'blue', width: 2.6 });
          P.curve((t) => [T.TB(t * m), t * m], 0, 1, { color: 'orange', width: 2.6 });
          // trajectory
          const path = [[start.x, start.y]]; const end = T.run(start.x, start.y, 60, 0.03, path);
          P.path(path, { color: 'ink', width: 2.2 });
          for (const f of [0.08, 0.25, 0.5]) { const q = Math.floor(f * (path.length - 2)); if (q > 0 && q + 1 < path.length) P.arrow(path[q][0], path[q][1], path[q + 1][0], path[q + 1][1], { color: 'ink', head: 10, width: 0.01 }); }
          T.eq.forEach(([x, y], q) => P.dot(x, y, { r: 6, color: T.kind[q] === 'stable' ? 'green' : 'red', hollow: T.kind[q] !== 'stable' }));
          P.dot(end[0], end[1], { r: 3.5, color: 'ink' });
          P.text('all blue', mW, 0, { color: 'blue', size: 11.5, align: 'right', dx: -12, dy: -14, weight: 600, plate: true });
          P.text('all orange', 0, m, { color: 'orange', size: 11.5, align: 'left', dx: 12, dy: -12, weight: 600, plate: true });
          // schedules and who is content at the starting mix
          const top = Math.max(Rw, Rb) * 1.12, xm = Math.max(mW, m);
          Q.setView([-0.04 * xm, xm * 1.03], [-0.07 * top, top]);
          Q.line(0, Rw, mW, 0, { color: 'blue', width: 4.2, alpha: 0.85 }); Q.line(0, Rb, m, 0, { color: 'orange', width: 2 });
          const w0 = start.x, b0 = start.y, rW = w0 > 0.01 ? b0 / w0 : Infinity, rB = b0 > 0.01 ? w0 / b0 : Infinity;
          const okW = isFinite(rW) ? Math.max(0, Math.min(mW, mW * (1 - rW / Rw))) : 0, okB = isFinite(rB) ? Math.max(0, Math.min(m, m * (1 - rB / Rb))) : 0;
          if (isFinite(rW) && rW < top) { Q.line(0, rW, okW, rW, { color: 'blue', width: 4, alpha: 0.3 }); Q.dot(okW, rW, { r: 4.5, color: 'blue' }); const rt = okW > 0.55 * xm; Q.text(`${v.fix(okW, 0)} blues content`, okW, rW, { color: 'blue', size: 11, dx: rt ? -8 : 8, dy: -12, align: rt ? 'right' : 'left', weight: 600, plate: true }); }
          if (isFinite(rB) && rB < top) { Q.line(0, rB, okB, rB, { color: 'orange', width: 4, alpha: 0.3 }); Q.dot(okB, rB, { r: 4.5, color: 'orange' }); const rt = okB > 0.55 * xm; Q.text(`${v.fix(okB, 0)} oranges content`, okB, rB, { color: 'orange', size: 11, dx: rt ? -8 : 8, dy: -12, align: rt ? 'right' : 'left', weight: 600, plate: true }); }
          out = { T, end, okW, okB, w0, b0, rW, rB };
        });
        v.readout(() => {
          if (!out) return '';
          const { T, end, okW, okB, w0, b0 } = out;
          const mix = T.eq.map(([x, y], q) => (x > 0.5 && y > 0.5 ? `(${v.fix(x, 1)}, ${v.fix(y, 1)}) ${T.kind[q] === 'stable' ? '**stable**' : 'tipping point'}` : null)).filter(Boolean);
          const fate = end[1] < 0.5 && end[0] > 1 ? 'all blue' : end[0] < 0.5 && end[1] > 1 ? 'all orange' : `a stable mixture (${v.fix(end[0], 1)} blues, ${v.fix(end[1], 1)} oranges)`;
          const ref = ex.value === 'one' && mB.value === 50 && RW.value === 2 && RB.value === 2 ? ' — Schelling’s first example; Dokumacı & Sandholm compute the saddle at (21.74, 34.03)' : ex.value === 'two' && mB.value === 100 && RW.value === 5 && RB.value === 5 ? ' — Schelling’s second example: stable mix at (80, 80), saddles at (25.36, 94.64) and (94.64, 25.36)' : '';
          return `start (${v.fix(w0, 0)} blues, ${v.fix(b0, 0)} oranges): ${v.fix(okW, 0)} blues would be content (${okW >= w0 ? 'more enter' : 'some leave'}), ${v.fix(okB, 0)} oranges would be content (${okB >= b0 ? 'more enter' : 'some leave'}) → ends **${fate}** · mixed equilibria: ${mix.length ? mix.join(', ') : 'none'}${ref}`;
        });
      },
    },
  ],
};
