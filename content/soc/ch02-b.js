// Networks & Collective Behavior — Chapter 2, part b: homophily, influence, assortativity, balance, Dunbar, foci, the 1973 paper (2.9–2.16).
//
// Dunbar items: the 1992 regression log10 N = 0.093 + 3.389 log10 CR and the human neocortex ratio 4.1 are quoted from memory
// (they reproduce the commonly quoted prediction of about 148). The interval figures (1992: 100–230; 2021 reanalysis: 4–520
// Bayesian, 2–336 generalised least squares) were checked against the Wikipedia summary of Lindenfors, Wartel & Lind (2021).
// The primate scatter drawn on 2.13 is SIMULATED around that line; it is not Dunbar's data table.
// Granovetter (1973) percentages are as given in the chapter syllabus (16.7 / 55.6 / 27.8 %); the counts 9, 30, 15 of 54 are
// inferred from them (they reproduce all three percentages), not read from the paper.
import {
  getNet, KARATE, SOUTHERN, mkGraph, rng32, shuffle, deg, assortativity, barabasi, relax, circlePos, normLayout, layoutOf, CYC,
} from './ch02.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pc = (x, d = 0) => `${(100 * x).toFixed(d)}%`;

// signed complete graphs: sign[i][j] = +1 friends, −1 enemies
const pairsOf = (n) => { const o = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) o.push([i, j]); return o; };
const triplesOf = (n) => { const o = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) o.push([i, j, k]); return o; };
const idxOf = (n) => { const m = {}; let c = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) m[i * n + j] = c++; return (i, j) => m[Math.min(i, j) * n + Math.max(i, j)]; };
/** Number of enemies in triangle t under sign vector sg (index by pair order). */
const enemies = (sg, ix, [i, j, k]) => (sg[ix(i, j)] < 0) + (sg[ix(i, k)] < 0) + (sg[ix(j, k)] < 0);
/** Positive-connected components of a signed complete graph. */
function posComps(sg, ix, n) {
  const c = new Array(n).fill(-1); let k = 0;
  for (let s = 0; s < n; s++) { if (c[s] >= 0) continue; const q = [s]; c[s] = k; for (let h = 0; h < q.length; h++) for (let w = 0; w < n; w++) if (c[w] < 0 && w !== q[h] && sg[ix(q[h], w)] > 0) { c[w] = k; q.push(w); } k++; }
  return { c, k };
}
const bruteCache = {};
/** Over all sign patterns of K_n: [patterns, balanced, weakly balanced]. */
function bruteBalance(n) {
  if (bruteCache[n]) return bruteCache[n];
  const P = pairsOf(n), T = triplesOf(n), ix = idxOf(n); let bal = 0, weak = 0;
  for (let mask = 0; mask < 1 << P.length; mask++) {
    const sg = P.map((_, k) => ((mask >> k) & 1 ? -1 : 1)); let b = true, w = true;
    for (const t of T) { const e = enemies(sg, ix, t); if (e === 1 || e === 3) b = false; if (e === 1) w = false; if (!b && !w) break; }
    bal += b; weak += w;
  }
  return (bruteCache[n] = [1 << P.length, bal, weak]);
}

export default {
  collection: 'soc',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Homophily',
      statement: String.raw`**Homophily** is the tendency of people to be tied to others who are like themselves (in age, race, occupation, belief, ...). Given a split of the population into two types with shares $p$ and $1-p$, if ties ignored type then the expected share of **cross-type** edges would be $2p(1-p)$. A network shows homophily by this baseline test when its observed cross-type share is significantly lower.`,
      scope: String.raw`The baseline treats ties as independent of type, which is a statistical null, not a model of how people meet. It reveals the pattern but not its cause (see selection and influence, 2.10), and a low cross-type share can also result from segregation of opportunity (people simply do not meet).`,
      idea: String.raw`If each edge's two ends were drawn independently from the population, the chance that they differ is $2p(1-p)$. Shuffling the type labels over the same graph keeps its structure and breaks only the link between structure and type, so the shuffled cross-type shares show what chance looks like. A real value far below that cloud is evidence of homophily.`,
      caption: String.raw`Pick the karate club (types: the two factions it later split into) or a modelled school where you set the group share and the strength of homophily. The histogram is the cross-type share after 1000 random relabellings of the same graph; the observed value is the vertical line.`,
      deps: ['soc-2.1'],
      refs: ['E&K §4.1'],
      tags: ['homophily', 'mixing'],
      credit: 'Lazarsfeld & Merton, 1954',
      viz(v) {
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.1, 1.1], axes: false, equal: true, height: 380, weight: 1 });
        const p = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'share of cross-type ties', ylabel: 'relabellings', height: 380, weight: 1 });
        const src = v.select('Network', [{ value: 'karate', label: 'Karate club' }, { value: 'school', label: 'Modelled school' }], 'karate');
        const share = v.slider('Share in group A', 0.1, 0.9, 0.6, { step: 0.05 });
        const hom = v.slider('Homophily $h$', 0, 0.95, 0.7, { step: 0.05 });
        let cache = {}, pos = null, key = '';
        function make() {
          if (src.value === 'karate') return { g: mkGraph(34, KARATE.edges), type: KARATE.club.slice(), pos: normLayout(getNet('karate').pos), title: 'Zachary\'s karate club, types = the two factions after the split' };
          const n = 60, R = rng32(23), type = Array.from({ length: n }, (_, i) => (i < Math.round(share.value * n) ? 0 : 1)), E = [];
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const q = type[i] === type[j] ? 0.12 : 0.12 * (1 - hom.value); if (R() < q) E.push([i, j]); }
          const g = mkGraph(n, E), P = layoutOf(g, 220, 4);
          return { g, type, pos: normLayout(P), title: `Modelled school of ${n} (${Math.round(share.value * n)} in A), same-type tie probability 0.12, cross-type 0.12(1 − h)` };
        }
        let st = {};
        v.render(() => {
          hom.el.hidden = share.el.hidden = src.value === 'karate';
          const k = src.value === 'karate' ? 'k' : `${share.value}|${hom.value}`;
          if (k !== key) { key = k; cache = make(); const { g, type } = cache; const R = rng32(5); const t = type.slice(), nul = []; for (let r = 0; r < 1000; r++) { shuffle(t, R); let c = 0; for (const [a, b] of g.edges) if (t[a] !== t[b]) c++; nul.push(c / g.edges.length); } cache.nul = nul; }
          const { g, type, pos, nul } = cache, m = g.edges.length;
          let cross = 0; for (const [a, b] of g.edges) if (type[a] !== type[b]) cross++;
          const frac = cross / m, pA = type.filter((t) => t === 0).length / g.n, expect = 2 * pA * (1 - pA);
          for (const [a, b] of g.edges) s.line(pos[a][0], pos[a][1], pos[b][0], pos[b][1], { color: type[a] !== type[b] ? 'red' : 'muted', width: type[a] !== type[b] ? 1.6 : 0.9, alpha: type[a] !== type[b] ? 0.9 : 0.5 });
          g.adj.forEach((_, i) => s.dot(pos[i][0], pos[i][1], { color: type[i] ? 'orange' : 'accent', r: 6 }));
          const h = v.M.histogram(nul, { bins: 24, range: [0, 1] });
          p.setView([0, 1], [0, Math.max(...h.counts) * 1.15]);
          p.hist({ edges: h.edges, counts: h.counts }, { color: 'muted' });
          p.vline(frac, { color: 'red', width: 3 }); p.vline(expect, { color: 'green', dash: [5, 4] });
          const lower = nul.filter((x) => x <= frac).length / nul.length;
          st = { frac, expect, cross, m, lower, title: cache.title, pA, mean: v.M.mean(nul) };
        });
        v.legend([['accent', 'type A', { dot: true }], ['orange', 'type B', { dot: true }], ['red', 'cross-type tie'], ['green', 'expected $2p(1-p)$', { dash: true }]]);
        v.readout(() => `${st.title}\nObserved: **${st.cross}** of ${st.m} ties cross types = **${pc(st.frac, 1)}** · expected if types were ignored $2p(1-p) = ${pc(st.expect, 1)}$ ($p = ${v.fix(st.pA, 2)}$) · relabelling mean ${pc(st.mean, 1)}\nA shuffled copy is as segregated as this one in **${Math.round(st.lower * 1000)}** of 1000 shuffles`);
      },
    },

    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Concept',
      name: 'Selection versus social influence',
      statement: String.raw`Friends tend to resemble one another, and two mechanisms can produce that. **Selection**: people choose, or keep, friends who are already like them, so ties rearrange around fixed traits. **Social influence** (or contagion): people become more like the friends they have, so traits change on a fixed network. A third possibility is a hidden common cause.

A single snapshot of a network, with its traits, cannot distinguish them: both give homophily. Separating them takes data over time on both ties and traits (who befriended whom before or after becoming alike), or an experiment.`,
      scope: String.raw`The pictured worlds are deliberately simple (binary trait, random initial ties, one event type per step). Real data add shared environments, and even longitudinal models rest on assumptions, which is why observational claims that behaviours "spread through networks" remain contested.`,
      idea: String.raw`Both processes act on the same quantity, the share of ties joining like people, and both push it up toward 1, since every event reduces the number of unlike ties. Selection does it by changing who is tied to whom; influence by changing who is like whom. Only the record of which of the two things changed over time separates them.`,
      caption: String.raw`Choose the mechanism and drag the time slider. The ties are random at the start; the right panel shows the homophily curve, which is nearly the same in both worlds, together with the share of ties that were replaced and the share of people who changed trait, which is where the worlds differ.`,
      deps: ['soc-2.9'],
      refs: ['E&K §4.2'],
      tags: ['homophily', 'causality'],
      credit: 'Christakis & Fowler, 2007 (contested by Shalizi & Thomas, 2011)',
      viz(v) {
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.1, 1.1], axes: false, equal: true, height: 380, weight: 1 });
        const p = v.stage({ x: [0, 600], y: [0, 1], axes: 'box', gutter: true, xlabel: 'events', ylabel: 'share', height: 380, weight: 1 });
        const world = v.select('Mechanism', [{ value: 'sel', label: 'Selection' }, { value: 'inf', label: 'Influence' }, { value: 'both', label: 'Both' }], 'sel');
        const T = v.slider('Events', 0, 600, 300, { int: true });
        const N = 40, STEP = 10;
        const cacheW = {};
        function simulate(kind) {
          if (cacheW[kind]) return cacheW[kind];
          const R = rng32(31), trait = Array.from({ length: N }, () => (R() < 0.5 ? 0 : 1));
          const E = new Set(); const key = (a, b) => (a < b ? a * N + b : b * N + a);
          while (E.size < 80) { const a = Math.floor(R() * N), b = Math.floor(R() * N); if (a !== b) E.add(key(a, b)); }
          const snaps = [], pos = Array.from({ length: N }, () => [(R() - 0.5) * 1.6, (R() - 0.5) * 1.6]);
          let tieChanges = 0, traitChanges = 0;
          const edges = () => [...E].map((k) => [Math.floor(k / N), k % N]);
          const hom = () => { const e = edges(); return e.filter(([a, b]) => trait[a] === trait[b]).length / e.length; };
          const snap = (t) => { const e = edges(); relax({ n: N, edges: e }, pos, 30); snaps.push({ t, trait: trait.slice(), edges: e, pos: pos.map((q) => q.slice()), hom: hom(), tie: tieChanges / 80, tr: traitChanges / N }); };
          snap(0);
          for (let t = 1; t <= 600; t++) {
            const all = edges(), [a0, b0] = all[Math.floor(R() * all.length)];
            if (trait[a0] !== trait[b0] && R() < 0.12) {
              const [a, b] = R() < 0.5 ? [a0, b0] : [b0, a0];
              const mech = kind === 'both' ? (R() < 0.5 ? 'sel' : 'inf') : kind;
              if (mech === 'sel') {
                const c = []; for (let k = 0; k < N; k++) if (k !== a && trait[k] === trait[a] && !E.has(key(a, k))) c.push(k);
                if (c.length) { E.delete(key(a, b)); E.add(key(a, c[Math.floor(R() * c.length)])); tieChanges++; }
              } else { trait[a] = trait[b]; traitChanges++; }
            }
            if (t % STEP === 0) snap(t);
          }
          return (cacheW[kind] = snaps);
        }
        let st = {};
        v.render(() => {
          const sn = simulate(world.value), k = Math.round(T.value / STEP), c = sn[k];
          const P = normLayout(c.pos);
          for (const [a, b] of c.edges) s.line(P[a][0], P[a][1], P[b][0], P[b][1], { color: c.trait[a] !== c.trait[b] ? 'red' : 'muted', width: c.trait[a] !== c.trait[b] ? 1.4 : 1, alpha: 0.7 });
          P.forEach((q, i) => s.dot(q[0], q[1], { color: c.trait[i] ? 'orange' : 'accent', r: 6 }));
          p.path(sn.map((x) => [x.t, x.hom]), { color: 'accent', width: 3 });
          p.path(sn.map((x) => [x.t, x.tie]), { color: 'orange', width: 2, dash: true });
          p.path(sn.map((x) => [x.t, x.tr]), { color: 'purple', width: 2, dash: true });
          p.vline(c.t, { color: 'gold', dash: [4, 3] });
          st = { c, ends: ['sel', 'inf', 'both'].map((w) => simulate(w)[60]) };
        });
        v.legend([['accent', 'share of ties joining like people'], ['orange', 'share of ties replaced', { dash: true }], ['purple', 'share of people who changed trait', { dash: true }]]);
        v.readout(() => `After ${st.c.t} events: like-with-like ties **${pc(st.c.hom)}** · ties replaced ${pc(st.c.tie)} · people who changed trait ${pc(st.c.tr)}\nEnd-point snapshots (600 events) look alike: selection ${pc(st.ends[0].hom)}, influence ${pc(st.ends[1].hom)}, both ${pc(st.ends[2].hom)} like-with-like ties. Only the history of ties and traits tells them apart.`);
      },
    },

    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'Assortative mixing by degree',
      statement: String.raw`A network is **assortative by degree** when high-degree nodes tend to be tied to high-degree nodes, and **disassortative** when hubs tend to be tied to low-degree nodes. The **assortativity coefficient** $r$ is the Pearson correlation of the degrees at the two ends of an edge, taken over all edges and both orientations:
$$r = \frac{\langle k k'\rangle_E - \langle k\rangle_E^2}{\langle k^2\rangle_E - \langle k\rangle_E^2}, \qquad -1 \le r \le 1,$$
where $\langle\cdot\rangle_E$ averages over edge ends. It is undefined if all degrees are equal.`,
      idea: String.raw`Averaging over edge ends rather than over nodes weights each node by its degree (the weighting behind the friendship paradox), and $r$ is just the correlation coefficient of the pairs $(k, k')$ on the two ends of each edge. A degree-preserving rewiring keeps every degree and so the denominator fixed, and changes only how the degrees are paired in the numerator: the coefficient can be tuned freely without changing the degree distribution.`,
      caption: String.raw`Each dot is an edge, plotted twice (once per orientation) as the degrees at its two ends, with a little jitter. Choose the karate club or the Les Misérables network, or the model network, which lets you swap edges (keeping every degree fixed) until the correlation reaches your target.`,
      deps: ['soc-2.3'],
      refs: ['Newman ch. 7'],
      tags: ['assortativity', 'degree'],
      credit: 'Newman, 2002',
      viz(v) {
        const s = v.stage({ x: [0, 40], y: [0, 40], axes: 'box', gutter: true, xlabel: 'degree at one end $k$', ylabel: "degree at the other end $k'$", height: 400, weight: 1.2 });
        const d = v.stage({ x: [0, 40], y: [0, 0.5], axes: 'box', gutter: true, xlabel: 'degree $k$', ylabel: '$p_k$', height: 400, weight: 0.8 });
        const sel = v.select('Network', [{ value: 'model', label: 'Rewirable model' }, { value: 'karate', label: 'Karate club' }, { value: 'lesmis', label: 'Les Misérables' }], 'model');
        const target = v.slider('Target $r$', -0.6, 0.8, 0, { step: 0.05 });
        const base = barabasi(200, 2, rng32(4)), bdeg = deg(base);
        const rewire = (tgt) => {
          const R = rng32(8), E = base.edges.map((e) => e.slice()), m = E.length, key = new Set(E.map(([a, b]) => (a < b ? a * 1000 + b : b * 1000 + a)));
          const sums = () => { let s1 = 0, s2 = 0, s3 = 0; for (const [a, b] of E) { s1 += bdeg[a] * bdeg[b]; s2 += bdeg[a] + bdeg[b]; s3 += bdeg[a] ** 2 + bdeg[b] ** 2; } return [s1, s2, s3]; };
          let [s1, s2, s3] = sums(); const mean = s2 / (2 * m), vr = s3 / (2 * m) - mean * mean;
          const rOf = (x) => (x / m - mean * mean) / vr; let r = rOf(s1);
          for (let it = 0; it < 40000 && Math.abs(r - tgt) > 0.005; it++) {
            const i = Math.floor(R() * m), j = Math.floor(R() * m); if (i === j) continue;
            let [a, b] = E[i], [c, dd] = E[j]; if (R() < 0.5) [c, dd] = [dd, c];
            if (a === dd || c === b || a === c || b === dd) continue;
            const k1 = a < dd ? a * 1000 + dd : dd * 1000 + a, k2 = c < b ? c * 1000 + b : b * 1000 + c; if (key.has(k1) || key.has(k2)) continue;
            const ns = s1 - bdeg[a] * bdeg[b] - bdeg[c] * bdeg[dd] + bdeg[a] * bdeg[dd] + bdeg[c] * bdeg[b], nr = rOf(ns);
            if (Math.abs(nr - tgt) < Math.abs(r - tgt)) { key.delete(a < b ? a * 1000 + b : b * 1000 + a); key.delete(c < dd ? c * 1000 + dd : dd * 1000 + c); key.add(k1); key.add(k2); E[i] = [a, dd]; E[j] = [c, b]; s1 = ns; r = nr; }
          }
          return mkGraph(base.n, E);
        };
        let st = {}, lastT = null, gm = null;
        v.render(() => {
          let g, title;
          if (sel.value === 'model') { if (lastT !== target.value) { lastT = target.value; gm = rewire(target.value); } g = gm; title = 'Preferential-attachment network, 200 nodes, degrees fixed while edges are swapped'; }
          else { g = getNet(sel.value).g; title = getNet(sel.value).title; }
          target.el.hidden = sel.value !== 'model';
          const dg = deg(g), kmax = Math.max(...dg);
          s.setView([0, kmax + 1], [0, kmax + 1]); s.line(0, 0, kmax + 1, kmax + 1, { color: 'muted', dash: true });
          const R = rng32(2), pts = []; for (const [a, b] of g.edges) { pts.push([dg[a] + (R() - 0.5) * 0.6, dg[b] + (R() - 0.5) * 0.6], [dg[b] + (R() - 0.5) * 0.6, dg[a] + (R() - 0.5) * 0.6]); }
          s.dots(pts, { color: 'accent', r: 2.6, alpha: 0.55 });
          const cnt = new Array(kmax + 1).fill(0); dg.forEach((k) => cnt[k]++);
          d.setView([0, kmax + 1], [0, Math.max(...cnt) / g.n * 1.15]); d.bars(cnt.map((c) => c / g.n), { x0: 0, dx: 1, color: 'accent' });
          st = { r: assortativity(g), title, n: g.n, m: g.edges.length, kmax };
        });
        v.readout(() => `${st.title}\n$n = ${st.n}$, $|E| = ${st.m}$, maximum degree ${st.kmax}: assortativity $r = ${v.fix(st.r, 3)}$ ${st.r > 0.05 ? '(assortative: hubs link to hubs)' : st.r < -0.05 ? '(disassortative: hubs link to low-degree nodes)' : '(close to neutral)'}\nThe small histogram is the degree distribution: it does not change as $r$ is tuned.`);
      },
    },

    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Structural balance theorem (Cartwright–Harary)',
      statement: String.raw`Take a complete graph on $n$ people in which every pair is marked $+$ (friends) or $-$ (enemies). A triangle is **balanced** if it has an even number of $-$ edges (0 or 2: "all three are friends", or "two friends with a common enemy"; the rules "a friend of my friend is my friend" and "an enemy of my enemy is my friend" are exactly these) and unbalanced if it has 1 or 3. The labelled graph is **balanced** if every triangle is balanced.

**Theorem (Cartwright and Harary, 1956).** A signed complete graph is balanced if and only if either everyone is friends with everyone, or the people can be split into two camps, with all pairs within a camp friends and all pairs across enemies.`,
      idea: String.raw`If the split exists, any triangle has either 0 or 2 enemy edges (two people in one camp and one in the other have exactly two cross edges), so it is balanced. Conversely, fix a person $A$ and let $X$ be $A$ together with $A$'s friends and $Y$ the enemies of $A$. Balance of triangles through $A$ forces any two members of $X$ to be friends (otherwise $A, x, x'$ has exactly one enemy edge), any two in $Y$ to be friends (an enemy of an enemy), and each member of $X$ to be an enemy of each member of $Y$.`,
      caption: String.raw`Click any edge to flip friend (green) or enemy (red). The bars count triangles by the number of enemy edges: 0 and 2 are balanced, 1 and 3 are not; unbalanced triangles are shaded. When no unbalanced triangle remains, the two camps appear as colours.`,
      deps: ['soc-2.1'],
      refs: ['E&K §5.1', 'E&K §5.2'],
      tags: ['balance', 'signed networks'],
      credit: 'Heider, 1946; Cartwright & Harary, 1956',
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 400, weight: 1.1 });
        const p = v.stage({ x: [-0.5, 3.5], y: [0, 10], axes: 'box', gutter: true, xlabel: 'enemies in the triangle', ylabel: 'triangles', height: 400, weight: 0.8, xticks: [0, 1, 2, 3] });
        const nS = v.slider('People $n$', 3, 6, 5, { int: true });
        let n = 5, sg = null, ix = idxOf(5);
        const init = () => { n = nS.value; ix = idxOf(n); const camp0 = [0, 0, 0, 1, 1, 1]; sg = pairsOf(n).map(([i, j]) => (camp0[i] === camp0[j] ? 1 : -1)); };
        init();
        let lastN = 5;
        const R = rng32(17);
        v.button('Random signs', () => { sg = pairsOf(n).map(() => (R() < 0.5 ? 1 : -1)); });
        v.button('Random balanced world', () => { const camp = Array.from({ length: n }, () => (R() < 0.5 ? 0 : 1)); sg = pairsOf(n).map(([i, j]) => (camp[i] === camp[j] ? 1 : -1)); });
        v.button('Flip a random tie', () => { const k = Math.floor(R() * sg.length); sg[k] = -sg[k]; });
        let pts = circlePos(n, 0.95);
        s.onClick((x, y) => {
          let best = -1, bd = 0.07; pairsOf(n).forEach(([i, j], k) => { const [a, b] = [pts[i], pts[j]]; const dx = b[0] - a[0], dy = b[1] - a[1]; const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0.12, 0.88); const dd = Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y); if (dd < bd) { bd = dd; best = k; } });
          if (best >= 0) sg[best] = -sg[best];
        });
        let st = {};
        v.render(() => {
          if (nS.value !== lastN) { lastN = nS.value; init(); }
          pts = circlePos(n, 0.95);
          const P = pairsOf(n), T = triplesOf(n), counts = [0, 0, 0, 0];
          const bad = [];
          T.forEach((t) => { const e = enemies(sg, ix, t); counts[e]++; if (e === 1 || e === 3) bad.push(t); });
          for (const t of bad) s.poly(t.map((i) => pts[i]), { fill: 'red', fillAlpha: 0.07, stroke: false });
          P.forEach(([i, j], k) => s.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: sg[k] > 0 ? 'green' : 'red', width: sg[k] > 0 ? 2.6 : 1.8, dash: sg[k] > 0 ? undefined : [5, 4] }));
          const balanced = bad.length === 0;
          let camp = new Array(n).fill(0);
          if (balanced) { for (let i = 0; i < n; i++) camp[i] = i === 0 || sg[ix(0, i)] > 0 ? 0 : 1; }
          pts.forEach(([x, y], i) => s.dot(x, y, { color: balanced ? (camp[i] ? 'orange' : 'accent') : 'ink', r: 9, label: String.fromCharCode(65 + i), labelPos: x >= 0 ? 'e' : 'w' }));
          p.setView([-0.5, 3.5], [0, Math.max(5, ...counts) * 1.15]);
          p.bars(counts, { x0: 0, dx: 1, color: (val, i) => (i === 0 || i === 2 ? 'green' : 'red') });
          st = { balanced, bad: bad.length, total: T.length, camp, nCamp: new Set(camp).size, counts, bf: bruteBalance(n) };
        });
        v.legend([['green', 'friends'], ['red', 'enemies', { dash: true }], ['accent', 'camp 1', { dot: true }], ['orange', 'camp 2', { dot: true }]]);
        v.readout(() => `${st.total} triangles: **${st.bad}** unbalanced (1 or 3 enemy edges) → ${st.balanced ? `**balanced**: ${st.nCamp === 1 ? 'everyone is friends' : 'two camps of ' + st.camp.filter((c) => !c).length + ' and ' + st.camp.filter((c) => c).length + ', friends inside, enemies across'}` : 'not balanced, so no split into two hostile camps exists'}\nAll $2^{${n * (n - 1) / 2}} = ${st.bf[0]}$ sign patterns on $n = ${n}$ people checked: **${st.bf[1]}** are balanced $= 2^{n-1}$ (one for each way of choosing camps, counting "everyone friends" once)`);
      },
    },

    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Hypothesis',
      name: 'Dunbar’s number (contested)',
      statement: String.raw`**Hypothesis.** Among primates the typical size $N$ of a social group rises with the relative size of the neocortex (neocortex volume divided by the volume of the rest of the brain, the neocortex ratio $CR$), because tracking relationships takes brain. Dunbar's regression of $\log_{10} N$ on $\log_{10} CR$, extrapolated to the human ratio $CR\approx 4.1$, predicts a group of about **150** people (the "number" is $\approx 148$ with a 95% confidence interval of about 100 to 230).

A 2021 reanalysis with modern phylogenetic methods found that the same data give 95% confidence intervals of about 4 to 520 (Bayesian) and 2 to 336 (generalised least squares) for humans, so that naming a single number has little support.`,
      scope: String.raw`An extrapolation: the human neocortex ratio lies beyond the range of the non-human primates the line was fitted to, and group size is defined differently across species. As a statement about humans, the number is a hypothesis, not a measured constant.`,
      idea: String.raw`Ordinary least squares gives a prediction interval whose width grows as one moves away from the middle of the data: for a new point at $x_0$ it is $\hat y \pm t\,\hat\sigma\sqrt{1 + 1/n + (x_0-\bar x)^2/S_{xx}}$. Extrapolating beyond every observation, with scatter around the line, with few species and with relatedness between species ignored, the interval balloons. The prediction at $CR = 4.1$ comes from the line; whether it is informative depends on this interval.`,
      caption: String.raw`Dots are SIMULATED primate genera scattered around the 1992 line (not the original data). Drag the slider for the scatter $\sigma$ (in $\log_{10}$ units) and the number of genera, and see the prediction interval at the human ratio (the purple bar) against the published intervals.`,
      deps: ['soc-2.3'],
      refs: [],
      tags: ['dunbar', 'regression'],
      credit: 'Dunbar, 1992; Lindenfors, Wartel & Lind, 2021',
      verify: true,
      viz(v) {
        const s = v.stage({ x: [1, 5], y: [1, 1000], ylog: true, axes: 'box', gutter: true, xlabel: 'neocortex ratio $CR$', ylabel: 'group size $N$', height: 420, weight: 1.4 });
        const sig = v.slider('Scatter $\\sigma$ (in $\\log_{10}$ units)', 0.05, 0.6, 0.2, { step: 0.01 });
        const nn = v.slider('Genera $n$', 8, 60, 38, { int: true });
        const cr = v.slider('Predict at ratio $CR$', 1, 5, 4.1, { step: 0.05 });
        const A = 0.093, B = 3.389;
        let st = {};
        v.render(() => {
          const R = rng32(12), n = nn.value, X = [], Y = [];
          for (let i = 0; i < n; i++) { const c = 1.2 + 2.1 * R(); const g1 = Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R()); X.push(Math.log10(c)); Y.push(A + B * X[i] + sig.value * g1); }
          const fit = v.M.linreg(X, Y), xm = v.M.mean(X), Sxx = X.reduce((a, x) => a + (x - xm) ** 2, 0);
          const sh = Math.sqrt(Y.reduce((a, y, i) => a + (y - fit.predict(X[i])) ** 2, 0) / (n - 2));
          const t = v.M.dist.studentT(n - 2).quantile(0.975);
          const pi = (c) => { const x0 = Math.log10(c), y0 = fit.predict(x0), w = t * sh * Math.sqrt(1 + 1 / n + (x0 - xm) ** 2 / Sxx); return [10 ** (y0 - w), 10 ** y0, 10 ** (y0 + w)]; };
          const band = (a) => { const L = [], U = []; for (let c = 1.1; c <= 5; c += 0.05) { const q = pi(c); L.push([c, q[0]]); U.push([c, q[2]]); } return a ? L : U; };
          s.path(band(true), { color: 'purple', width: 1.4, dash: true }); s.path(band(false), { color: 'purple', width: 1.4, dash: true });
          const line = []; for (let c = 1.1; c <= 5; c += 0.05) line.push([c, 10 ** fit.predict(Math.log10(c))]); s.path(line, { color: 'purple', width: 2.4 });
          s.dots(X.map((x, i) => [10 ** x, 10 ** Y[i]]), { color: 'accent', r: 4 });
          s.vband(1.2, 3.3, { color: 'faint', alpha: 0.06 });
          const q = pi(cr.value);
          s.vline(cr.value, { color: 'muted', dash: [4, 3] });
          s.segment([4.28, 100], [4.28, 230], { color: 'accent', width: 6 }); s.text('1992', 4.28, 84, { size: 11, color: 'accent', align: 'center', baseline: 'top' });
          s.segment([4.5, 4], [4.5, 520], { color: 'orange', width: 6 }); s.text('2021 Bayes', 4.5, 3.2, { size: 11, color: 'orange', align: 'center', baseline: 'top' });
          s.segment([4.72, 2], [4.72, 336], { color: 'red', width: 6 }); s.text('2021 GLS', 4.72, 1.6, { size: 11, color: 'red', align: 'center', baseline: 'top' });
          s.segment([cr.value, q[0]], [cr.value, q[2]], { color: 'purple', width: 6 }); s.dot(cr.value, q[1], { color: 'gold', r: 6 });
          st = { q, fit, cr: cr.value, ratio: q[2] / q[0] };
        });
        v.legend([['accent', 'simulated genera', { dot: true }], ['purple', 'fit and 95% prediction band'], ['accent', '1992: 100–230'], ['orange', '2021 Bayesian: 4–520'], ['red', '2021 GLS: 2–336']]);
        v.readout(() => `Fit to the simulated sample: $\\log_{10}N = ${v.fix(st.fit.intercept, 2)} + ${v.fix(st.fit.slope, 2)}\\log_{10}CR$ · at $CR = ${v.fix(st.cr, 2)}$ the prediction is **${v.fix(st.q[1], 0)}** with a 95% prediction interval **${v.fix(st.q[0], 0)} to ${v.fix(st.q[2], 0)}** (a factor ${v.fix(st.ratio, 1)} from end to end)\nThe 1992 line gives $10^{0.093 + 3.389\\log_{10}4.1} \\approx ${v.fix(10 ** (0.093 + 3.389 * Math.log10(4.1)), 0)}$ at $CR = 4.1$. Coloured bars at the right are the published intervals; the primate points above are simulated, not Dunbar's table.`);
      },
    },

    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Concept',
      name: 'Affiliation networks and focal closure',
      statement: String.raw`An **affiliation network** (a two-mode or bipartite network) joins people to the **foci** they take part in (clubs, workplaces, classes, events); there are no direct person-person edges, only person-focus ones. Two people sharing a focus are likely to meet and, over time, become friends: **focal closure** is the formation of a tie between two people who share one or more foci. The more foci two people share, the more likely they are tied.

A model: each shared focus independently gives a chance $q$ of a tie, so that two people with $k$ shared foci are tied with probability $1 - (1-b)(1-q)^k$ (where $b$ is a base rate unrelated to foci), which rises steadily with $k$.`,
      scope: String.raw`The independent-chances formula is a model, not a law; in empirical studies of evolving networks the chance of becoming friends does rise with the number of shared foci, but the shape varies and shared foci also reflect homophily and choice of focus.`,
      idea: String.raw`Projecting a bipartite network onto its people gives a graph in which every focus becomes a clique, so affiliation produces many triangles on its own: this is the "closure by foci" next to the "closure by common friends" of 2.5. Each additional shared focus is another independent occasion to become friends, so the failure probabilities multiply.`,
      caption: String.raw`The 18 women and 14 events of the Davis–Gardner–Gardner study of southern women (a standard dataset). Click a woman to highlight her events and everyone she shared one with. Switch to the projected network, where the width of a line is the number of shared events, then set $q$ and the base rate $b$: bars show how often simulated pairs with $k$ shared events became friends.`,
      deps: ['soc-2.5', 'soc-2.9'],
      refs: ['E&K §4.3', 'E&K §4.4'],
      tags: ['affiliation', 'bipartite'],
      credit: 'Breiger, 1974; Feld, 1981; Kossinets & Watts, 2006',
      verify: true,
      viz(v) {
        const s = v.stage({ x: [-2.05, 1.45], y: [-1.15, 1.2], axes: false, equal: true, height: 460, weight: 1.15 });
        const p = v.stage({ x: [-0.5, 8.5], y: [0, 1], axes: 'box', gutter: true, xlabel: 'shared events $k$', ylabel: 'P(friends)', height: 460, weight: 0.9 });
        const view = v.select('View', [{ value: 'two', label: 'Women and events' }, { value: 'proj', label: 'Women only' }], 'two');
        const q = v.slider('Chance per shared event $q$', 0, 0.5, 0.2, { step: 0.01 });
        const b = v.slider('Base rate $b$', 0, 0.2, 0.02, { step: 0.005 });
        const nw = SOUTHERN.women.length, ne = SOUTHERN.events.length, att = SOUTHERN.attend;
        const shared = Array.from({ length: nw }, (_, i) => Array.from({ length: nw }, (_, j) => att[i].filter((e) => att[j].includes(e)).length));
        const pairs = []; for (let i = 0; i < nw; i++) for (let j = i + 1; j < nw; j++) pairs.push([i, j, shared[i][j]]);
        const kmax = Math.max(...pairs.map((x) => x[2]));
        const first = (nm) => nm.split(' ')[0];
        const wy = (i) => 1.0 - 2.1 * i / (nw - 1), ey = (e) => 0.9 - 1.8 * e / (ne - 1);
        const cp = circlePos(nw, 0.9, Math.PI / 2);
        let sel = 0;
        s.onClick((x, y) => {
          if (view.value === 'two') { let bi = -1, bd = 0.1; for (let i = 0; i < nw; i++) { const d = Math.hypot(x + 0.9, y - wy(i)); if (d < bd) { bd = d; bi = i; } } if (bi >= 0) sel = bi; }
          else { let bi = -1, bd = 0.12; for (let i = 0; i < nw; i++) { const d = Math.hypot(x - cp[i][0], y - cp[i][1]); if (d < bd) { bd = d; bi = i; } } if (bi >= 0) sel = bi; }
        });
        let st = {}, simKey = '', sim = null;
        v.render(() => {
          const two = view.value === 'two';
          if (two) {
            for (let i = 0; i < nw; i++) for (const e of att[i]) s.line(-0.9, wy(i), 0.9, ey(e), { color: i === sel ? 'gold' : att[sel].includes(e) ? 'accent' : 'faint', width: i === sel ? 2.6 : 1, alpha: i === sel ? 1 : att[sel].includes(e) ? 0.6 : 0.4 });
            for (let i = 0; i < nw; i++) { const co = i !== sel && shared[sel][i] > 0; s.dot(-0.9, wy(i), { color: i === sel ? 'gold' : co ? 'accent' : 'muted', r: i === sel ? 7 : 5, label: first(SOUTHERN.women[i]) + (co ? ` (${shared[sel][i]})` : ''), labelPos: 'w' }); }
            for (let e = 0; e < ne; e++) s.dot(0.9, ey(e), { color: att[sel].includes(e) ? 'gold' : 'orange', r: 6, hollow: !att[sel].includes(e), label: `E${e + 1}`, labelPos: 'e' });
          } else {
            for (const [i, j, k] of pairs) if (k > 0) s.line(cp[i][0], cp[i][1], cp[j][0], cp[j][1], { color: i === sel || j === sel ? 'gold' : 'accent', width: 0.6 + 1.0 * k, alpha: i === sel || j === sel ? 0.9 : 0.28 });
            for (let i = 0; i < nw; i++) s.dot(cp[i][0], cp[i][1], { color: i === sel ? 'gold' : 'ink', r: i === sel ? 7 : 5, label: first(SOUTHERN.women[i]), labelPos: cp[i][0] >= 0 ? 'e' : 'w' });
          }
          const key = `${q.value}|${b.value}`;
          if (key !== simKey) {
            simKey = key; const R = rng32(99), tries = new Array(kmax + 1).fill(0), hit = new Array(kmax + 1).fill(0);
            for (let r = 0; r < 400; r++) for (const [, , k] of pairs) { tries[k]++; if (R() < 1 - (1 - b.value) * (1 - q.value) ** k) hit[k]++; }
            sim = { tries, hit };
          }
          const cnt = new Array(kmax + 1).fill(0); pairs.forEach((x) => cnt[x[2]]++);
          p.bars(sim.hit.map((h, k) => (sim.tries[k] ? h / sim.tries[k] : 0)), { x0: 0, dx: 1, color: 'accent' });
          const th = []; for (let k = 0; k <= kmax; k += 0.1) th.push([k, 1 - (1 - b.value) * (1 - q.value) ** k]);
          p.path(th, { color: 'orange', width: 2.4 });
          st = { cnt, sim };
        });
        v.legend([['accent', 'simulated frequency'], ['orange', '$1-(1-b)(1-q)^k$']]);
        v.readout(() => `${SOUTHERN.women[sel]} attended ${att[sel].length} events and shared one with ${shared[sel].filter((x, i) => i !== sel && x > 0).length} of the other 17 women\nNumber of pairs by shared events $k = 0,1,\\dots,${kmax}$: ${st.cnt.join(', ')} (of 153 pairs)\nWith $q = ${q.value.toFixed(2)}$, $b = ${b.value.toFixed(3)}$, a pair with $k = ${kmax}$ shared events is a friend with probability **${v.fix(1 - (1 - b.value) * (1 - q.value) ** kmax, 2)}**, one with $k = 0$ with probability **${v.fix(b.value, 3)}**`);
      },
    },

    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Weak structural balance: many hostile camps',
      statement: String.raw`Keep the setting of 2.12 (a complete graph of friends and enemies) but forbid only one kind of triangle: those with **exactly one enemy edge** (two people who are friends with a third but not with each other). Triangles with three enemies are now allowed ("an enemy of my enemy need not be my friend"). Call the graph **weakly balanced** if no triangle has exactly one $-$ edge.

**Theorem (Davis, 1967).** A signed complete graph is weakly balanced if and only if its vertices can be partitioned into any number of groups (one or more) such that every pair inside a group is a pair of friends and every pair in different groups are enemies.`,
      idea: String.raw`If such groups exist, a triangle inside one group has no enemy edge, one with two people in a group and one outside has two, and one spread over three groups has three, so none has exactly one. Conversely, "being friends" is then transitive: if $A$–$B$ and $B$–$C$ are friends, the triangle $ABC$ cannot have exactly one enemy edge, so $A$–$C$ are friends. A transitive friendship relation (reflexive, symmetric) is an equivalence relation, and its classes are the groups; everyone across classes is an enemy.`,
      caption: String.raw`Click edges to flip friend and enemy. When no triangle has exactly one enemy edge, the right panel gathers the people into their friendship groups; otherwise the offending triangle (two friendships, one hostility) is drawn in red.`,
      deps: ['soc-2.12'],
      refs: ['E&K §5.4'],
      tags: ['balance', 'signed networks'],
      credit: 'Davis, 1967',
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 400, weight: 1 });
        const g2 = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 400, weight: 1 });
        const nS = v.slider('People $n$', 3, 6, 6, { int: true });
        let n = 6, ix = idxOf(6), sg = null; const R = rng32(3);
        const reset = () => { n = nS.value; ix = idxOf(n); const grp = Array.from({ length: n }, (_, i) => (i < 2 ? 0 : i < 4 ? 1 : 2 + (i > 4 ? 1 : 0))); sg = pairsOf(n).map(([i, j]) => (grp[i] === grp[j] ? 1 : -1)); };
        reset(); let lastN = 6;
        v.button('Random signs', () => { sg = pairsOf(n).map(() => (R() < 0.5 ? 1 : -1)); });
        v.button('Random camps', () => { const k = 2 + Math.floor(R() * 3), grp = Array.from({ length: n }, () => Math.floor(R() * k)); sg = pairsOf(n).map(([i, j]) => (grp[i] === grp[j] ? 1 : -1)); });
        v.button('Flip a random tie', () => { const k = Math.floor(R() * sg.length); sg[k] = -sg[k]; });
        let pts = circlePos(n, 0.95);
        s.onClick((x, y) => {
          let best = -1, bd = 0.07; pairsOf(n).forEach(([i, j], k) => { const [a, b] = [pts[i], pts[j]]; const dx = b[0] - a[0], dy = b[1] - a[1]; const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0.12, 0.88); const dd = Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y); if (dd < bd) { bd = dd; best = k; } });
          if (best >= 0) sg[best] = -sg[best];
        });
        let st = {};
        v.render(() => {
          if (nS.value !== lastN) { lastN = nS.value; reset(); }
          pts = circlePos(n, 0.95);
          const P = pairsOf(n), T = triplesOf(n), bad = T.filter((t) => enemies(sg, ix, t) === 1);
          const { c, k } = posComps(sg, ix, n);
          P.forEach(([i, j], q) => s.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: sg[q] > 0 ? 'green' : 'red', width: sg[q] > 0 ? 2.6 : 1.6, dash: sg[q] > 0 ? undefined : [5, 4], alpha: bad.length && !bad[0].includes(i) && !bad[0].includes(j) ? 0.5 : 1 }));
          if (bad.length) { s.poly(bad[0].map((i) => pts[i]), { fill: 'red', fillAlpha: 0.14, color: 'red', width: 3 }); }
          pts.forEach(([x, y], i) => s.dot(x, y, { color: bad.length ? 'ink' : CYC[c[i] % CYC.length], r: 9, label: String.fromCharCode(65 + i), labelPos: x >= 0 ? 'e' : 'w' }));
          const weak = bad.length === 0, groups = Array.from({ length: k }, (_, q) => c.map((x, i) => (x === q ? i : -1)).filter((i) => i >= 0));
          g2.text(weak ? `${k} friendship group${k === 1 ? '' : 's'}` : 'no consistent grouping', 0, 1.1, { size: 14, color: weak ? 'green' : 'red', align: 'center' });
          if (weak) {
            const m = groups.length, cen = groups.map((_, q) => (m === 1 ? [0, 0] : [0.62 * Math.cos(Math.PI / 2 - 2 * Math.PI * q / m), 0.55 * Math.sin(Math.PI / 2 - 2 * Math.PI * q / m)]));
            groups.forEach((gr, q) => { const rr = 0.2 + 0.07 * gr.length; g2.circle(cen[q][0], cen[q][1], rr, { fill: CYC[q % CYC.length], fillAlpha: 0.13, color: CYC[q % CYC.length], width: 2 }); gr.forEach((i, t) => { const a = 2 * Math.PI * t / gr.length; const x = cen[q][0] + (gr.length === 1 ? 0 : 0.6 * rr * Math.cos(a)), y = cen[q][1] + (gr.length === 1 ? 0 : 0.6 * rr * Math.sin(a)); g2.dot(x, y, { color: CYC[q % CYC.length], r: 8, label: String.fromCharCode(65 + i), labelPos: 'n' }); }); });
          } else { g2.text(`triangle ${bad[0].map((i) => String.fromCharCode(65 + i)).join('')} has two friendships and one hostility`, 0, 0, { size: 13, color: 'ink', align: 'center' }); }
          st = { weak, bad: bad.length, k, sizes: groups.map((x) => x.length), bf: bruteBalance(n) };
        });
        v.legend([['green', 'friends'], ['red', 'enemies', { dash: true }]]);
        v.readout(() => `${st.weak ? `**Weakly balanced**: ${st.k} group${st.k === 1 ? '' : 's'} of sizes ${st.sizes.join(', ')}; friends inside, enemies across` : `**${st.bad}** triangle${st.bad === 1 ? '' : 's'} with exactly one enemy edge (the first is shaded): not weakly balanced`}\nAmong all $2^{${n * (n - 1) / 2}} = ${st.bf[0]}$ sign patterns on $n = ${n}$ people, **${st.bf[2]}** are weakly balanced (the number of ways to partition $n$ people into groups: 1, 2, 5, 15, 52, 203 for $n = 1..6$) and ${st.bf[1]} are balanced in the strict sense of 2.12`);
      },
    },

    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Paper',
      name: 'The Strength of Weak Ties',
      paper: { authors: 'Mark S. Granovetter', year: 1973, title: 'The Strength of Weak Ties', venue: 'American Journal of Sociology 78 (6): 1360–1380', doi: '10.1086/225469' },
      introduces: ['soc-2.6', 'soc-2.7'],
      statement: String.raw`Granovetter argued that the strength of a tie (a mix of time, emotional intensity, intimacy and reciprocal services) can be treated as a variable, and that if a person $A$ has strong ties to $B$ and $C$, then there is a high chance of at least a weak tie between $B$ and $C$: the "forbidden triad" of two strong ties without a third tie is rare. A consequence is that a tie that is the only bridge between two clusters cannot be strong. The paper then argues that weak ties are therefore the channels through which information and influence reach a group from beyond it, and offers as evidence a study of how professional, technical and managerial workers in a Boston suburb found their jobs: most who used a personal contact saw that contact only occasionally or rarely.`,
      idea: String.raw`Before the paper, network studies concentrated on the cohesion of strong-tie groups, and weak ties were treated as marginal. Granovetter turned this around: a strong-tie cluster is redundant internally (everyone knows what everyone knows), so what spreads between clusters travels on bridges, and bridges are (by the forbidden-triad argument, 2.6) weak ties. The paper introduced the forbidden triad and the bridge argument, the idea that weak ties are the connectors, and the job-search evidence. Its central argument is verbal; later work (the strong triadic closure theorem, large phone-call networks, and a 2022 field experiment on a professional networking site) made it precise and tested it.`,
      caption: String.raw`Left: the forbidden triad. $A$ is strongly tied to $B$ and $C$; choose the tie between $B$ and $C$ to see when the triad is forbidden and when a bridge could be strong. Right: the job-contact data of the paper, as the syllabus quotes it; choose where "strong" begins and see how much of the new information arrives over weak ties.`,
      deps: ['soc-2.5'],
      refs: [],
      credit: 'Mark Granovetter, 1973',
      links: { doi: 'https://doi.org/10.1086/225469' },
      verify: true,
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.0, 1.05], axes: false, equal: true, height: 360, weight: 1 });
        const p = v.stage({ x: [-0.5, 3], y: [0, 70], axes: 'box', gutter: true, xlabel: 'how often the contact was seen', ylabel: '% of job finders using a contact', height: 360, weight: 1.1, xticks: [[0, 'often'], [1, 'occasionally'], [2, 'rarely']] });
        const bc = v.select('Tie $B$–$C$', [{ value: 'none', label: 'absent' }, { value: 'weak', label: 'weak' }, { value: 'strong', label: 'strong' }], 'none');
        const cut = v.select('Strong means', [{ value: 1, label: 'seen often' }, { value: 2, label: 'often or occasionally' }], 1);
        const data = [{ k: 'often', pct: 16.7, n: 9 }, { k: 'occasionally', pct: 55.6, n: 30 }, { k: 'rarely', pct: 27.8, n: 15 }];
        const A = [0, 0.8], B = [-0.95, -0.55], C = [0.95, -0.55];
        let st = {};
        v.render(() => {
          s.line(A[0], A[1], B[0], B[1], { color: 'accent', width: 6 }); s.line(A[0], A[1], C[0], C[1], { color: 'accent', width: 6 });
          if (bc.value !== 'none') s.line(B[0], B[1], C[0], C[1], { color: bc.value === 'strong' ? 'accent' : 'orange', width: bc.value === 'strong' ? 6 : 2.2, dash: bc.value === 'strong' ? undefined : [6, 4] });
          else s.line(B[0], B[1], C[0], C[1], { color: 'red', width: 2, dash: [3, 6], alpha: 0.7 });
          [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([q, t]) => s.dot(q[0], q[1], { color: 'ink', r: 13, label: t, labelPos: t === 'A' ? 'n' : 's' }));
          s.text(bc.value === 'none' ? 'FORBIDDEN TRIAD' : bc.value === 'weak' ? 'allowed (weak closing tie)' : 'allowed (closed triangle)', 0, -0.9, { size: 14, color: bc.value === 'none' ? 'red' : 'green', align: 'center' });
          p.bars(data.map((d) => d.pct), { x0: 0, dx: 1, color: (val, i) => (i < cut.value ? 'accent' : 'orange') });
          data.forEach((d, i) => p.text(`${d.pct}%`, i, d.pct + 2, { size: 13, color: 'ink', align: 'center', baseline: 'bottom' }));
          const weak = data.slice(cut.value).reduce((a, d) => a + d.pct, 0), n = data.slice(cut.value).reduce((a, d) => a + d.n, 0);
          st = { weak, n };
        });
        v.legend([['accent', 'strong (as chosen)', { area: true }], ['orange', 'weak', { area: true }]]);
        v.readout(() => `Triad: $A$ strong to $B$ and $C$; $B$–$C$ **${bc.value === 'none' ? 'absent: the forbidden triad. If $AB$ were then a bridge it would be a strong bridge' : bc.value === 'weak' ? 'weak: allowed, and the triangle $ABC$ is closed' : 'strong: allowed'}**\nJob data (percent as in the syllabus; of 54 finders, inferred counts 9, 30, 15): with "strong" = ${cut.value === 1 ? 'seen often' : 'often or occasionally'}, **${v.fix(st.weak, 1)}%** (about ${st.n} of 54) found the job over a weak tie. Granovetter's reading: new information arrives mostly over weak ties.\nToday: phone-call networks show the same structure (weak ties hold the network together), and a large field experiment on a professional network found the most job transmissions over moderately weak ties, not the weakest.`);
      },
    },
  ],
};
