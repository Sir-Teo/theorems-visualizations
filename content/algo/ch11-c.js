// Algorithms — Chapter 11: Network flow, matching and linear programming (items 11.14–11.19; 11.17, 11.18 are cross-listings; see ch11.js, ch11-b.js, ch11-d.js)
import { K, ids, plural, clamp, rngOf, sumOf, num, galeShapley, GS_CODE, blockingPairs, stableBrute, allPerms, LET, clipHalf, lpPolygon, simplex, vertices, R, TX } from './ch11.shared.js';

const SEG = (a, b) => `${a}\\to ${b}`;
const WIN8 = [[0, 0], [8, 0], [8, 8], [0, 8]];
const clipWin = (P, w = WIN8) => { let Q = P; for (const [a, b] of [[[1, 0], w[1][0]], [[0, 1], w[2][1]], [[-1, 0], 0], [[0, -1], 0]]) Q = Q.length ? clipHalf(Q, a, b) : Q; return Q; };

export default {
  collection: 'algo',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.14
    {
      num: '11.14',
      kind: 'Algorithm',
      name: 'Stable matching (Gale–Shapley)',
      statement: String.raw`Two groups of $n$ members each rank all members of the other group. A perfect matching is **stable** if there is no **blocking pair** $(p,r)$, two members who are not matched to each other but each prefer the other to their current partner. The **Gale–Shapley algorithm** lets one group (the proposers) propose in order of preference; a receiver always keeps the best proposal she has seen so far and rejects the rest, until nobody is free. It stops after at most $n^2$ proposals with a stable matching, which is the **best stable partner for every proposer** and simultaneously the worst stable partner for every receiver. Stable matchings need not be unique, and switching the proposing group can change the outcome.`,
      idea: String.raw`Every receiver's partner only improves over time and every proposer moves down his list, so each proposal pair is tried at most once: at most $n^2$ proposals. Once everybody has a partner, a blocking pair $(p,r)$ is impossible: $p$ proposed to $r$ before his final partner, so $r$ rejected him or dropped him in favour of someone she prefers, and she only improves from there. If proposer $p$ were rejected by a receiver $r$ who is his best stable partner, the first such rejection would put $r$ with someone she prefers, and this proposer–receiver pair could be combined with a stable matching in which $p$ has $r$ to form a blocking pair, a contradiction.`,
      caption: String.raw`Click a table entry to swap it with its neighbour (in the direction chosen) and so edit the preference lists, pick which side proposes, and step through. Orange marks the current proposal, green the held engagements, dashed grey the rejected proposals. **Swap two partners** replaces the final matching by one with two partners exchanged: if it is unstable, the blocking pair shows up in red. The readout counts all stable matchings by exhaustive search over all $n!$ matchings.`,
      deps: [],
      refs: ['KT §1.1', 'CLRS 4e §25.2'],
      tags: ['matching'],
      credit: 'D. Gale & L. S. Shapley, 1962',
      links: { doi: 'https://doi.org/10.1080/00029890.1962.11989827' },
      viz(v) {
        const win = { x: [0, 1], y: [0, 1], axes: false, height: 235, weight: 0.85 };
        const sL = v.stage({ ...win, title: 'Left lists' }), sR = v.stage({ ...win, title: 'Right lists' });
        const sG = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 300, full: true });
        let LP = [[0, 3, 2, 1], [3, 1, 2, 0], [1, 3, 2, 0], [0, 3, 2, 1]], RP = [[1, 2, 0, 3], [3, 0, 1, 2], [2, 0, 1, 3], [2, 0, 3, 1]];
        const n = 4, TL = v.table(sL, { rows: n, cols: n, size: 15, maxCell: 44, rowLabels: (i) => String(i + 1), colLabels: ['1st', '2nd', '3rd', '4th'] });
        const TR = v.table(sR, { rows: n, cols: n, size: 15, maxCell: 44, rowLabels: (i) => LET(i), colLabels: ['1st', '2nd', '3rd', '4th'] });
        const side = v.select('proposing group', [{ value: 'left', label: 'left (1–4)' }, { value: 'right', label: 'right (A–D)' }], 'left', { onChange: () => { override = null; S.reset({ at: 'start' }); } });
        const dir = v.select('click swaps with', [{ value: 'next', label: 'next entry' }, { value: 'prev', label: 'previous entry' }], 'next');
        let override = null, pairIdx = 0;
        const swapIn = (arr, i, j) => { const a = arr[i], k = dir.value === 'next' ? j + 1 : j - 1; if (k >= 0 && k < n) { [a[j], a[k]] = [a[k], a[j]]; override = null; S.reset({ at: 'end' }); } };
        sL.onClick((x, y) => { const c = TL.hit(x, y); if (c && c.i >= 0 && c.j >= 0) swapIn(LP, c.i, c.j); });
        sR.onClick((x, y) => { const c = TR.hit(x, y); if (c && c.i >= 0 && c.j >= 0) swapIn(RP, c.i, c.j); });
        v.button('Swap two partners', () => { const m = lrOf(S.frames[S.frames.length - 1]).slice(), pairs = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b]); const [a, b] = pairs[pairIdx++ % pairs.length]; [m[a], m[b]] = [m[b], m[a]]; override = m; S.last(); });
        v.button('Back to Gale–Shapley', () => { override = null; });
        const G = v.graph(sG, { layout: 'none', weights: false, directed: false, nodes: [0, 1, 2, 3].flatMap((i) => [{ id: `l${i}`, label: String(i + 1), x: 2.6, y: 5.2 - i * 1.45 }, { id: `r${i}`, label: LET(i), x: 7.4, y: 5.2 - i * 1.45 }]), edges: [], draggable: false });
        const swap = () => side.value === 'right';
        const lrOf = (fr) => { const m = Array(n).fill(null); fr.partner.forEach((r, p) => { if (r != null) { if (swap()) m[r] = p; else m[p] = r; } }); return m; };
        const S = v.steps({ frames: () => (swap() ? galeShapley(RP, LP) : galeShapley(LP, RP)).frames, code: GS_CODE, codeTitle: 'Gale–Shapley', speed: 1, still: 6 });
        const lrFull = () => lrOf(S.frames[S.frames.length - 1]);
        v.render(() => {
          const fr = S.frame, props = [], sw = swap();
          for (const q of S.frames.slice(0, S.i + 1)) if (q.kind === 'propose') props.push([q.p, q.r]);
          const toLR = (p, r) => (sw ? [r, p] : [p, r]), lr = override || lrOf(fr), final = fr.kind === 'done' || !!override;
          const pairs = new Map(); props.forEach(([p, r]) => { const [l, rr] = toLR(p, r); pairs.set(`${l}-${rr}`, 'rej'); });
          lr.forEach((r, l) => { if (r != null) pairs.set(`${l}-${r}`, 'held'); });
          if (!override && (fr.kind === 'propose' || fr.kind === 'reject')) { const [l, r] = toLR(fr.p, fr.r); pairs.set(`${l}-${r}`, fr.kind === 'reject' ? 'no' : 'cur'); }
          const blk = final && lr.every((x) => x != null) ? blockingPairs(LP, RP, lr) : [];
          blk.forEach(([l, r]) => pairs.set(`${l}-${r}`, 'block'));
          G.edges = [...pairs.entries()].map(([k, kind]) => { const [l, r] = k.split('-').map(Number); return { from: `l${l}`, to: `r${r}`, kind }; });
          const C = { held: 'green', cur: 'orange', rej: 'faint', no: 'red', block: 'red' };
          G.draw({ edgeColor: (e) => C[e.kind], edgeWidth: (e) => (e.kind === 'held' ? 4.6 : e.kind === 'cur' ? 3.6 : e.kind === 'block' ? 3 : 1.4), edgeDash: (e) => e.kind === 'rej' || e.kind === 'block', nodeFill: (id) => { const k = String(id), i = +k.slice(1); return (k[0] === 'l' ? lr[i] != null : lr.includes(i)) ? 'green' : null; }, nodeColor: (id) => { const k = String(id), i = +k.slice(1), pr = sw ? k[0] === 'r' : k[0] === 'l'; return pr && fr.p === i ? 'orange' : null; }, edgeLabel: () => null });
          const cur = fr.p != null ? fr.p : -1, nxt = fr.next || [0, 0, 0, 0];
          const tabs = [[TL, LP, !sw], [TR, RP, sw]];
          tabs.forEach(([T, P, isProp]) => T.draw({
            value: (i, j) => (T === TL ? LET(P[i][j]) : String(P[i][j] + 1)),
            fill: (i, j) => { if (!isProp) { const held = fr.engaged && fr.engaged[i] === P[i][j] && !override; return held ? ['green', 0.35] : null; } const k = (fr.next || [0, 0, 0, 0])[i]; if (j < k && !(fr.partner && fr.partner[i] === P[i][j])) return ['orange', 0.18]; return fr.partner && fr.partner[i] === P[i][j] && !override ? ['green', 0.35] : null; },
            highlight: isProp && cur >= 0 && fr.r != null ? [[cur, nxt[cur] - 1 >= 0 ? nxt[cur] - 1 : 0, 'gold']] : [],
            textColor: () => null,
          }));
          sL.setTitle(sw ? 'Left lists (of the right)' : 'Left lists, proposing'); sR.setTitle(sw ? 'Right lists, proposing' : 'Right lists (of the left)');
        });
        v.legend([['green', 'held engagement'], ['orange', 'current proposal'], ['faint', 'earlier proposal, rejected', { dash: true }], ['red', 'blocking pair', { dash: true }]]);
        v.readout(() => {
          const stable = stableBrute(LP, RP), full = lrFull(), fr = S.frame, lr = override || lrOf(fr), done = fr.kind === 'done' || override;
          const key = (m) => m.join(','), isStable = stable.some((m) => key(m) === key(full));
          const rk = (P, a, b) => P[a].indexOf(b), sw = swap();
          const opt = stable.every((m) => full.every((r, l) => (sw ? RP[r].indexOf(l) <= RP[m[l]].indexOf(l) : rk(LP, l, r) <= rk(LP, l, m[l]))));
          const blk = done && lr.every((x) => x != null) ? blockingPairs(LP, RP, lr) : [];
          return `${override ? `Modified matching: ${blk.length ? `**unstable**, blocking pair${blk.length > 1 ? 's' : ''} ${blk.map(([l, r]) => `(${l + 1},${LET(r)})`).join(' ')}` : '**stable** (another stable matching)'}` : `Proposals so far: **${S.frames.slice(0, S.i + 1).filter((q) => q.kind === 'propose').length}** (limit $n^2=16$)${fr.kind === 'done' ? ` · blocking pairs: **${blk.length}**` : ''}`}\nStable matchings by exhaustive search: **${stable.length}** of ${allPerms(n).length} perfect matchings · Gale–Shapley output stable: **${isStable ? 'yes' : 'NO'}** · best stable partner for every proposer: **${opt ? 'yes' : 'NO'}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.15
    {
      num: '11.15',
      kind: 'Definition',
      name: 'Linear programs and feasible regions',
      statement: String.raw`A **linear program** (LP) asks to maximize a linear objective $c^{\top}x$ over $x\in\R^n$ subject to finitely many linear inequalities $a_i^{\top}x\le b_i$. The set of $x$ satisfying all constraints is the **feasible region**, a convex polyhedron (the intersection of half-spaces); points of it are **feasible**. An LP is **infeasible** if the region is empty, **unbounded** if the objective can be made arbitrarily large on it, and otherwise has an **optimal value** attained at an **optimal solution**. In standard form the variables are also required to be nonnegative, $x\ge 0$.`,
      idea: String.raw`Each constraint cuts space by a hyperplane and keeps one side; the feasible region is the intersection, which is convex because each half-space is. The objective's level sets $c^{\top}x=t$ are parallel hyperplanes, so solving the LP means pushing such a hyperplane as far as possible in direction $c$ while still touching the region. The question of where this last contact happens is answered in 11.16.`,
      caption: String.raw`Two variables, $x,y\ge0$ plus three constraints. Drag each constraint's boundary point (orange) and the tip of its arrow (red), which points to the **forbidden** side; the feasible polygon (blue) follows. Drag the objective handle $c$ (purple), and slide the level $t$: the gold line $c^\top x=t$ meets the region while $t$ is below the optimum and leaves it past it. The green ring marks the optimum. Make the region empty, or point a constraint the wrong way, to see **infeasible** and **unbounded**.`,
      deps: [],
      refs: ['CLRS 4e §29.1'],
      tags: ['linear programming'],
      viz(v) {
        const s = v.stage({ x: [0, 8], y: [0, 8], equal: true, axes: 'box', gutter: true, height: 400, xlabel: '$x$', ylabel: '$y$' });
        const init = [[[0, 4], [0.45, 0.9]], [[4, 0], [0.9, 0.45]], [[3.5, 2], [0.8, 0]]];
        const P = init.map(([p]) => s.handle(p[0], p[1], { color: 'orange', r: 7 })), Q = init.map(([p, d]) => s.handle(p[0] + d[0], p[1] + d[1], { color: 'red', r: 5 }));
        const C = s.handle(2.4, 1.6, { color: 'purple', r: 7, label: 'c', labelPos: 'ne' });
        const t = v.slider('level $t$', 0, 16, 5, { step: 0.1 });
        let info = {};
        const cons = () => P.map((p, i) => { const nx = Q[i].x - p.x, ny = Q[i].y - p.y, L = Math.hypot(nx, ny); return L < 0.12 ? null : { a: [nx / L, ny / L], b: (nx * p.x + ny * p.y) / L, i }; }).filter(Boolean);
        v.render(() => {
          const cs = cons(), poly = lpPolygon(cs, 1000), c = [C.x, C.y];
          let status = 'optimal', best = null, opt = null;
          if (poly.length < 3) status = 'infeasible';
          else {
            const val = poly.map((p) => c[0] * p[0] + c[1] * p[1]); let mi = 0; val.forEach((x, i) => { if (x > val[mi] + 1e-9) mi = i; });
            best = val[mi]; opt = poly[mi]; if (poly.some((p, i) => val[i] > best - 1e-9 && (p[0] > 990 || p[1] > 990))) status = 'unbounded';
          }
          cs.forEach((q) => { const p = P[q.i], tx = -q.a[1], ty = q.a[0]; s.clip(() => { s.line(p.x - 30 * tx, p.y - 30 * ty, p.x + 30 * tx, p.y + 30 * ty, { color: 'orange', width: 2 }); s.arrow(p.x, p.y, p.x + q.a[0] * 0.9, p.y + q.a[1] * 0.9, { color: 'red', width: 2 }); }); });
          if (poly.length >= 3) { const dp = clipWin(poly); if (dp.length) s.poly(dp, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 }); }
          const cn = Math.hypot(c[0], c[1]) || 1, cx = (c[0] * t.value) / (cn * cn), cy = (c[1] * t.value) / (cn * cn);
          s.clip(() => { s.line(cx + 40 * (-c[1] / cn), cy + 40 * (c[0] / cn), cx - 40 * (-c[1] / cn), cy - 40 * (c[0] / cn), { color: 'gold', width: 2.6 }); });
          s.arrow(0, 0, C.x, C.y, { color: 'purple', width: 2 });
          if (status === 'optimal') { s.dot(opt[0], opt[1], { r: 9, hollow: true, color: 'green' }); s.dot(opt[0], opt[1], { r: 3, color: 'green' }); }
          if (poly.length >= 3) clipWin(poly).forEach((p) => s.dot(p[0], p[1], { r: 3, color: 'accent' }));
          info = { cs, status, best, opt, c, tHit: poly.length >= 3 && (() => { const vv = poly.map((p) => c[0] * p[0] + c[1] * p[1]); return t.value >= Math.min(...vv) - 1e-9 && t.value <= Math.max(...vv) + 1e-9; })() };
        });
        v.legend([['accent', 'feasible region', { area: true }], ['orange', 'constraint boundary'], ['red', 'forbidden side (normal)'], ['gold', 'level line $c^\\top x=t$'], ['green', 'optimum', { dot: true }]]);
        v.readout(() => {
          const f = (q) => `${num(q.a[0], 2)}x${q.a[1] < 0 ? '-' : '+'}${num(Math.abs(q.a[1]), 2)}y\\le ${num(q.b, 2)}`;
          const head = `$${info.cs.map(f).join(',\\ ')},\\ x,y\\ge 0$`;
          const res = info.status === 'infeasible' ? '**infeasible**: the region is empty' : info.status === 'unbounded' ? '**unbounded**: the objective grows without limit' : `maximize $${num(info.c[0], 2)}x+${num(info.c[1], 2)}y$: optimum **${num(info.best, 3)}** at $(${num(info.opt[0], 2)},${num(info.opt[1], 2)})$`;
          return `${head}\n${res}${info.status === 'optimal' ? ` · level line $t=${num(t.value, 1)}$ ${info.tHit ? 'meets' : 'misses'} the region` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.16
    {
      num: '11.16',
      kind: 'Theorem',
      name: 'An LP optimum is attained at a vertex',
      statement: String.raw`Let $P=\{x: Ax\le b\}$ be a nonempty polyhedron that has at least one vertex (for instance, $P\subseteq\{x\ge0\}$). If the linear program $\max\{c^{\top}x:x\in P\}$ has a finite optimal value, then some vertex of $P$ is an optimal solution. The set of optimal solutions is a face of $P$; it is a single vertex for all $c$ except those on finitely many directions (where two vertices tie and a whole edge is optimal). When $P$ is bounded, the optimum is always finite.`,
      idea: String.raw`The optimal face is the part of $P$ touched by the last level hyperplane; it is itself a polyhedron without a line, so it has a vertex, and a vertex of a face is a vertex of $P$. (Equivalently, every point of a bounded $P$ is a convex combination of vertices, and a linear function on a convex combination is at most its largest value at a vertex; this is the extreme-point statement fa-3.24, there proved for compact convex sets.) This is what justifies searching only vertices, as the simplex method does.`,
      caption: String.raw`Turn the objective dial: the gold supporting line sweeps around the polygon and the optimum (green) hops from vertex to vertex; on the wheel, each vertex owns the arc of directions $\theta$ for which it wins (its **normal cone**). Only at the black ticks, where $c$ is perpendicular to an edge, do two vertices tie. The grey dots are random feasible points: none ever beats the best vertex. Choose the **unbounded wedge** to see directions with no optimum at all.`,
      deps: ['algo-11.15', 'fa-3.24'],
      refs: ['CLRS 4e §29.1'],
      tags: ['linear programming'],
      viz(v) {
        const POLY = { pent: [[0.9, 0.7], [5.3, 1.0], [6.7, 3.4], [4.5, 5.3], [1.3, 4.4]], wedge: [[1.2, 1.4], [3.6, 0.7], [40, 0.7], [40, 40], [0.9, 40], [0.5, 3.2]] };
        const poly = v.select('region', [{ value: 'pent', label: 'pentagon' }, { value: 'wedge', label: 'unbounded wedge' }], 'pent', { onChange: () => { samples = null; } });
        const th = v.slider('direction $\\theta$ (degrees)', 0, 360, 35, { step: 1 });
        v.button('Snap to a tie', () => { const V = POLY[poly.value], n = V.length, k = (tieK++) % n, a = V[k], b = V[(k + 1) % n]; let ang = (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI; ang = (ang + 360) % 360; th.set(Math.round(ang * 10) / 10); });
        let tieK = 0, samples = null;
        const s = v.stage({ x: [0, 8], y: [0, 6.4], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$x$', ylabel: '$y$', weight: 1.4 });
        const w = v.stage({ x: [-1.8, 1.8], y: [-1.6, 1.6], equal: true, axes: false, height: 340, weight: 0.9, title: 'Which vertex wins in direction $\\theta$' });
        const COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink'];
        const far = (p) => p[0] > 39 || p[1] > 39;
        const isUnb = (a) => poly.value === 'wedge' && (Math.cos(a) > 1e-9 || Math.sin(a) > 1e-9);
        const best = (V, ang) => { const c = [Math.cos(ang), Math.sin(ang)], vals = V.map((p) => c[0] * p[0] + c[1] * p[1]), m = Math.max(...vals); return { m, idx: vals.map((x, i) => (x > m - 1e-9 * Math.max(1, Math.abs(m)) ? i : -1)).filter((i) => i >= 0) }; };
        let info = {};
        v.render(() => {
          const V = POLY[poly.value], ang = (th.value * Math.PI) / 180, c = [Math.cos(ang), Math.sin(ang)], B = best(V, ang);
          if (!samples) { const r = rngOf(7); samples = []; let g = 0; while (samples.length < 220 && g++ < 6000) { const p = [r() * 8, r() * 6.4]; if ((() => { let ok = true; for (let i = 0; i < V.length; i++) { const a = V[i], b = V[(i + 1) % V.length]; if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < 0) ok = false; } return ok; })()) samples.push(p); } }
          s.poly(V.filter(() => true), { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          samples.forEach((p) => s.dot(p[0], p[1], { r: 2, color: 'muted' }));
          const unb = isUnb(ang), top = V[B.idx[0]];
          s.clip(() => { s.line(top[0] - 40 * -c[1], top[1] - 40 * c[0], top[0] + 40 * -c[1], top[1] + 40 * c[0], { color: 'gold', width: 2.6, alpha: unb ? 0.25 : 1 }); });
          if (!unb) {
            if (B.idx.length > 1) s.segment(V[B.idx[0]], V[B.idx[1]], { color: 'green', width: 6 });
            B.idx.forEach((i) => { if (!far(V[i])) s.dot(V[i][0], V[i][1], { r: 9, hollow: true, color: 'green' }); });
            s.arrow(top[0], top[1], top[0] + c[0] * 1.2, top[1] + c[1] * 1.2, { color: 'purple', width: 2.4 });
          } else s.corner('unbounded in this direction: no optimum', 'tr', { color: 'red', plate: true });
          V.forEach((p, i) => { if (!far(p)) s.dot(p[0], p[1], { r: 4, color: COL[i % 6], label: String.fromCharCode(65 + i), labelPos: 'ne' }); });
          // wheel
          const wins = []; for (let d = 0; d < 360; d++) { const a = (d * Math.PI) / 180, b = best(V, a); wins.push(isUnb(a) ? -2 : b.idx.length === 1 ? b.idx[0] : -1); }
          let st0 = 0; for (let d = 0; d < 360; d++) if (wins[d] !== wins[(d + 359) % 360]) { st0 = d; break; }
          let k0 = 0; while (k0 < 360) { let k1 = k0; const W = (k) => wins[(st0 + k) % 360]; while (k1 + 1 < 360 && W(k1 + 1) === W(k0)) k1++; const i = W(k0), d0 = st0 + k0, d1 = st0 + k1;
            if (i >= 0) w.curve((q) => [Math.cos(q), Math.sin(q)], (d0 * Math.PI) / 180, ((d1 + 1) * Math.PI) / 180, { color: COL[i % 6], width: 7 }); else if (i === -2) w.curve((q) => [Math.cos(q), Math.sin(q)], (d0 * Math.PI) / 180, ((d1 + 1) * Math.PI) / 180, { color: 'red', width: 3, alpha: 0.6 });
            if (i >= 0) { const mid = (((d0 + d1 + 1) / 2) * Math.PI) / 180; w.text(String.fromCharCode(65 + i), 1.28 * Math.cos(mid), 1.28 * Math.sin(mid), { size: 15, weight: 700, color: COL[i % 6], align: 'center', baseline: 'middle' }); } k0 = k1 + 1; }
          V.forEach((p, i) => { const q = V[(i + 1) % V.length]; if (far(p) && far(q)) return; const ta = Math.atan2(-(q[0] - p[0]), q[1] - p[1]); w.line(0.9 * Math.cos(ta), 0.9 * Math.sin(ta), 1.1 * Math.cos(ta), 1.1 * Math.sin(ta), { color: 'ink', width: 2 }); });
          w.arrow(0, 0, 0.82 * Math.cos(ang), 0.82 * Math.sin(ang), { color: 'purple', width: 2.4 }); w.dot(Math.cos(ang), Math.sin(ang), { r: 6, color: 'gold' });
          const vals = samples.map((p) => c[0] * p[0] + c[1] * p[1]);
          info = { B, unb, maxS: Math.max(...vals), V };
        });
        v.legend([['gold', 'supporting line'], ['green', 'optimal vertex / optimal edge'], ['muted', 'random feasible points', { dot: true }]]);
        v.readout(() => {
          const { B, unb, maxS, V } = info;
          if (unb) return `$\\theta=${th.value}^\\circ$: the objective is unbounded above on this region (the red arcs of the wheel).`;
          return `$\\theta=${th.value}^\\circ$: ${B.idx.length > 1 ? `**tie** between vertices ${B.idx.map((i) => String.fromCharCode(65 + i)).join(' and ')}: the whole edge is optimal` : `optimal vertex **${String.fromCharCode(65 + B.idx[0])}**`} with value $${num(B.m, 3)}$ · best of ${samples.length} random feasible points: $${num(maxS, 3)}\\le${num(B.m, 3)}$ ${maxS <= B.m + 1e-9 ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.19
    {
      num: '11.19',
      kind: 'Theorem',
      name: 'LP duality: weak and strong',
      statement: String.raw`To the **primal** program $\max\{c^{\top}x: Ax\le b,\ x\ge0\}$ belongs the **dual** program $\min\{b^{\top}y: A^{\top}y\ge c,\ y\ge0\}$.
(a) **Weak duality:** if $x$ is primal feasible and $y$ dual feasible, then $c^{\top}x\le b^{\top}y$.
(b) **Strong duality:** if either program has a finite optimal value, so does the other, and the two optimal values are equal.
(c) If the primal is unbounded the dual is infeasible, and if the dual is unbounded the primal is infeasible (both can be infeasible).`,
      idea: String.raw`(a) $c^{\top}x\le (A^{\top}y)^{\top}x=y^{\top}(Ax)\le y^{\top}b$, using $x\ge0$ in the first step and $y\ge0$ in the second. (b) Let the feasible primal have finite optimum $p^*$. The inequality $c^\top x\le p^*$ is a consequence of its feasible constraints $Ax\le b$ and $-x\le0$. The **inhomogeneous Farkas lemma** therefore gives $y,z\ge0$ with $A^\top y-z=c$ and $b^\top y\le p^*$. Thus $y$ is dual feasible; weak duality forces $b^\top y=p^*$. Swapping primal and dual proves the symmetric case. This uses the consequence form of Farkas on a nonempty feasible system; impossibility of a positive-gap pair alone would not establish an equal-value pair.`,
      caption: String.raw`Left: the primal region; right: a number line of objective values. Blue dots are values $c^\top x$ of random primal feasible points (big dots: vertices), red dots are values $b^\top y$ of dual feasible points. Every red dot lies to the right of every blue one (weak duality); the best vertex values meet at the computed common optimum in the bounded case. The number line fits all sampled values. The left window clips the unbounded region; it does not determine solver status. Edit $c$ or the first right-hand side $b_1$, and switch the case to make the primal unbounded (the dual then has no points) or infeasible.`,
      deps: ['opt-5.14', 'algo-11.15'],
      refs: ['Nemirovski, Optimization I (2024), slides 3.38–3.40, PDF pp.240–242', 'Erickson H.5 and H.7'],
      tags: ['linear programming', 'duality'],
      scope: String.raw`Finite-dimensional LPs with real data. The finite numerical illustration has positive $c_1,c_2$; its three cases do not enumerate every possible primal/dual status pair. Solver limits are reported separately, never as an unboundedness proof.`,
      viz(v) {
        const s = v.stage({ x: [0, 8], y: [0, 8], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$x_1$', ylabel: '$x_2$', title: 'Primal feasible region', weight: 1 });
        const nl = v.stage({ x: [0, 20], y: [0, 3], axes: 'box', gutter: true, height: 340, xlabel: 'objective value', weight: 1.2, title: 'Primal values (blue) and dual values (red)', yticks: [[1, 'primal'], [2, 'dual']] });
        const cs = v.select('case', [{ value: 'ok', label: 'bounded' }, { value: 'unb', label: 'primal unbounded' }, { value: 'inf', label: 'primal infeasible' }], 'ok', { onChange: () => { resample(); } });
        const c1 = v.slider('$c_1$', 0.2, 4, 3, { step: 0.1, onChange: () => resample() }), c2 = v.slider('$c_2$', 0.2, 4, 2, { step: 0.1, onChange: () => resample() }), b1 = v.slider('$b_1$', 3, 10, 8, { step: 0.5, onChange: () => resample() });
        let seed = 1, D = null;
        v.button('Resample points', () => { seed++; resample(); });
        const LP = () => { const k = cs.value; return k === 'ok' ? { A: [[1, 2], [3, 1], [0, 1]], b: [b1.value, 9, 3] } : k === 'unb' ? { A: [[1, -1]], b: [2] } : { A: [[1, 1], [-1, -1]], b: [2, -5] }; };
        function resample() {
          const { A, b } = LP(), c = [c1.value, c2.value], m = A.length, r = rngOf(seed * 31 + 3);
          const prim = simplex(c, A.map((a, i) => ({ a, op: '<=', b: b[i] }))), dual = simplex(b.map((x) => -x), [0, 1].map((j) => ({ a: A.map((row) => row[j]), op: '>=', b: c[j] })));
          const pF = (x) => A.every((a, i) => a[0] * x[0] + a[1] * x[1] <= b[i] + 1e-9) && x[0] >= 0 && x[1] >= 0, dF = (y) => [0, 1].every((j) => A.reduce((t, row, i) => t + row[j] * y[i], 0) >= c[j] - 1e-9);
          const ps = [], ds = []; let g = 0; while (ps.length < 120 && g++ < 5000) { const x = [r() * 8, r() * 8]; if (pF(x)) ps.push(x); }
          g = 0; while (ds.length < 120 && g++ < 8000) { const y = Array.from({ length: m }, () => r() * 8); if (dF(y)) ds.push(y); }
          const pv = lpPolygon(A.map((a, i) => ({ a, b: b[i] })), 1000).filter((p) => p[0] < 999 && p[1] < 999), polyFull = lpPolygon(A.map((a, i) => ({ a, b: b[i] })), 1000);
          const dG = [...[0, 1].map((j) => A.map((row) => -row[j])), ...Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, k) => (k === i ? -1 : 0)))], dh = [-c[0], -c[1], ...Array(m).fill(0)];
          const dv = vertices(dG, dh, m).map((q) => q.x);
          D = { A, b, c, prim, dual, ps, ds, pv, polyFull, dv, vp: ps.map((x) => c[0] * x[0] + c[1] * x[1]), vd: ds.map((y) => b.reduce((t, bb, i) => t + bb * y[i], 0)), pvv: pv.map((x) => c[0] * x[0] + c[1] * x[1]), dvv: dv.map((y) => b.reduce((t, bb, i) => t + bb * y[i], 0)) };
        }
        resample();
        v.render(() => {
          const { A, b, c, prim, polyFull } = D;
          A.forEach((a, i) => { const tx = -a[1], ty = a[0], L = Math.hypot(a[0], a[1]), px = (a[0] * b[i]) / (L * L), py = (a[1] * b[i]) / (L * L); s.clip(() => s.line(px - 40 * tx, py - 40 * ty, px + 40 * tx, py + 40 * ty, { color: 'orange', width: 2 })); });
          if (polyFull.length >= 3) { const dp = clipWin(polyFull); if (dp.length) s.poly(dp, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2 }); }
          s.clip(() => { D.ps.forEach((x) => s.dot(x[0], x[1], { r: 2, color: 'blue' })); D.pv.forEach((x) => s.dot(x[0], x[1], { r: 4.5, color: 'blue' })); });
          if (prim.status === 'optimal') { s.dot(prim.x[0], prim.x[1], { r: 9, hollow: true, color: 'green' }); const cn = Math.hypot(c[0], c[1]); s.clip(() => s.line(prim.x[0] + 40 * (-c[1] / cn), prim.x[1] + 40 * (c[0] / cn), prim.x[0] - 40 * (-c[1] / cn), prim.x[1] - 40 * (c[0] / cn), { color: 'gold', width: 2.2 })); }
          const all = [...D.vp, ...D.vd, ...D.pvv, ...D.dvv], ref = prim.status === 'optimal' ? prim.value : Math.max(10, ...all.map(Math.abs)) / 2, hi = Math.max(8, ...all, ref) * 1.08, lo = Math.min(0, ...all) - Math.max(1, hi * 0.03);
          nl.setView([lo, hi], [0, 3]);
          const mp = D.vp.concat(D.pvv).length ? Math.max(...D.vp, ...D.pvv) : null, md = D.vd.concat(D.dvv).length ? Math.min(...D.vd, ...D.dvv) : null;
          if (mp != null && md != null) nl.rect(mp, 1.25, Math.max(md, mp), 1.75, { fill: 'gold', fillAlpha: md >= mp - 1e-9 ? 0.35 : 0.1, color: 'gold', width: 1 });
          D.vp.forEach((x) => nl.dot(x, 1, { r: 2.5, color: 'blue' })); D.pvv.forEach((x) => nl.dot(x, 1, { r: 5, color: 'blue' }));
          D.vd.forEach((x) => nl.dot(x, 2, { r: 2.5, color: 'red' })); D.dvv.forEach((x) => nl.dot(x, 2, { r: 5, color: 'red' }));
          if (prim.status === 'optimal') nl.vline(prim.value, { color: 'green', width: 2, dash: true });
        });
        v.legend([['blue', 'primal feasible values $c^\\top x$', { dot: true }], ['red', 'dual feasible values $b^\\top y$', { dot: true }], ['green', 'common optimum', { dash: true }], ['gold', 'gap between best primal and best dual', { area: true }]]);
        v.readout(() => {
          const { prim, dual } = D, dv = -dual.value;
          const st = (r) => (r.status === 'optimal' ? 'optimal' : r.status);
          const mp = Math.max(...D.vp, ...D.pvv, -Infinity), md = Math.min(...D.vd, ...D.dvv, Infinity);
          const weak = D.vp.every((p) => D.vd.every((q) => p <= q + 1e-9));
          return `primal: **${st(prim)}**${prim.status === 'optimal' ? ` ${num(prim.value, 3)}` : ''} · dual: **${st(dual)}**${dual.status === 'optimal' ? ` ${num(dv, 3)}` : ''}${prim.status === 'optimal' && dual.status === 'optimal' ? ` · computed gap $${num(Math.abs(prim.value - dv), 6)}$ (numerical illustration)` : ''}\n${D.vp.length * D.vd.length ? `weak inequality on ${D.vp.length * D.vd.length} sampled pairs: ${weak ? 'holds' : 'fails'}` : 'No sampled primal/dual pair; no sampled comparison'}${isFinite(mp) && isFinite(md) ? ` · best primal point ${num(mp, 3)} ≤ best dual point ${num(md, 3)}` : ''}${prim.status === 'optimal' && dual.status === 'optimal' ? ` · optimal dual $y^*=(${dual.x.map((q) => num(q, 2)).join(', ')})$` : ''}`;
        });
      },
    },
  ],
};
