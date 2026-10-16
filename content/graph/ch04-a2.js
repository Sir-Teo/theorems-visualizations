// Graph Theory (Diestel) — Chapter 4, part A2 (§4.2, second half: forests, face boundaries, triangulations, Euler's formula)
import {
  K, gstage, FILLS, crossPairs, faceStruct, innerPoint, paintFaces, markCross, planeOf, planeState, planeGuard, loadG, planeSpec, pgSpec,
  PGS, pgCopy, pgFlatten, pgFaces, pgAddable, pgAddOne, pgRoute, pgDraw, pgPick, segInter, freeEdge, isBridge, twoConnected, ix, amask,
  allCycles, nonSepInduced, winding,
} from './ch04-a.shared.js';

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const key = (e) => K(e.from) + '-' + K(e.to);
const L = (i) => 'abcdefghijklmnopqrstuvwxyz'[i];

/** Mulberry-style seeded generator. */
const mkRng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
/** Draw face lengths and tint faces of a PG (triangles green, other faces orange). */
function pgPaint(s, F, o = {}) {
  paintFaces(s, F, { colorOf: (i) => (o.colorOf ? o.colorOf(i) : F.faces[i].rlen === 3 ? 'green' : 'orange'), alpha: 0.24, outerAlpha: 0.12 });
}
function pgLabels(s, F) {
  F.faces.forEach((f, i) => { const p = innerPoint(F, i); s.text(String(f.rlen), p[0], p[1], { size: 15, weight: 700, color: f.rlen === 3 ? 'green' : 'red', align: 'center', baseline: 'middle' }); });
}
/** Saturate a PG with admissible edges; returns the number added. */
function saturate(pg, limit = 60) { let c = 0; while (c < limit && pgAddOne(pg)) c++; return c; }

export default {
  collection: 'graph',
  chapter: 4,
  items: [
    {
      num: '4.2.4', kind: 'Proposition', name: 'A plane forest has exactly one face',
      statement: String.raw`A plane forest, that is, a plane graph without cycles, has exactly one face.`,
      idea: String.raw`Induct on the number of edges. A forest with an edge has a leaf; removing it leaves a forest with one face by induction. The deleted edge is an arc joining two disjoint sets (the leaf and the rest), so by Lemma 4.1.3 putting it back does not split the single face. Adding an edge that closes a cycle is exactly what the induction cannot do: the cycle is a polygon, and the Jordan curve theorem gives it an inside and an outside.`,
      caption: String.raw`Edit the drawing (click empty space for a vertex, click two vertices for an edge, Alt-click deletes; crossing edges are refused). The face counter stays at 1 for a forest. The buttons add a crossing-free edge between two trees (the face count stays) or one that closes a cycle (it rises by one). Edges on a cycle are orange, bridges black.`,
      deps: ['graph-4.1.3', 'graph-1.5.1a'], refs: ['Diestel §4.2'], tags: ['forests', 'faces'],
      viz(v) {
        const start = () => planeSpec({ a: [1, 1.2], b: [2.4, 3.2], c: [1, 5], d: [3.8, 5.2], e: [4.0, 1.4], f: [6.2, 4.4], g: [7.8, 2.2], h: [8.8, 5.0], i: [6.2, 1.2] }, 'ab bc bd be fg fh gi');
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { ...start(), r: 10, editable: true });
        const st = { msg: '' }; const guard = planeGuard(G, st);
        const addBetween = (sameComp) => {
          const ps = planeOf(G), F = faceStruct(ps.P, ps.E), n = ps.P.length;
          const uf = Array.from({ length: n }, (_, i) => i), find = (x) => { while (uf[x] !== x) x = uf[x] = uf[uf[x]]; return x; };
          ps.E.forEach(([a, b]) => { uf[find(a)] = find(b); });
          const cand = [];
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
            if (ps.E.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
            if ((find(a) === find(b)) !== sameComp) continue;
            if (freeEdge(ps, a, b)) cand.push([a, b, Math.hypot(ps.P[a][0] - ps.P[b][0], ps.P[a][1] - ps.P[b][1])]);
          }
          if (!cand.length) { st.msg = sameComp ? 'No crossing-free edge closes a cycle here.' : 'No crossing-free edge joins two trees here.'; return; }
          cand.sort((x, y) => x[2] - y[2]); const [a, b] = cand[0];
          G.addEdge(ps.ids[a], ps.ids[b]); st.msg = ''; guard.reset();
        };
        v.button('join two trees', () => addBetween(false));
        v.button('close a cycle', () => addBetween(true));
        v.button('reset', () => { loadG(G, start()); guard.reset(); });
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const F = ps.F;
          paintFaces(s, F, { colorOf: (i) => (i ? FILLS[(i - 1) % 8] : null), alpha: 0.22, outerAlpha: 0.08 });
          const br = (e) => { const k = ps.eo.indexOf(e); return k >= 0 && isBridge(F, k); };
          G.draw({ edgeColor: (e) => (br(e) ? null : 'orange'), edgeWidth: (e) => (br(e) ? 2.4 : 4) });
          if (st.msg) s.corner(st.msg, 'bl', { color: 'red', weight: 600, size: 12.5 });
          const n = ps.P.length, m = ps.E.length, c = F.comps;
          info = { n, m, c, l: F.faces.length, forest: m === n - c };
        });
        v.legend([['orange', 'edge on a cycle'], ['ink', 'bridge']]);
        v.readout(() => (info ? `$n=${info.n}$, $m=${info.m}$, $c=${info.c}$ · ${info.forest ? `a **forest** ($m=n-c$): **${info.l} face**${info.l === 1 ? ' ✓' : ' ✗'}` : `**not a forest**: $m-n+c=${info.m - info.n + info.c}$ independent cycle${info.m - info.n + info.c === 1 ? '' : 's'}, **${info.l} faces** $=1+${info.m - info.n + info.c}$`}` : ''));
      },
    },
    {
      num: '4.2.5', kind: 'Lemma', name: 'Different faces with the same boundary force a cycle',
      statement: String.raw`If a plane graph has two different faces with the same boundary, then the graph is a cycle.`,
      idea: String.raw`Let $f_1\ne f_2$ have the same boundary $H$. Both are also faces of $H$ itself, so $H$ is not a forest (Proposition 4.2.4) and contains a cycle $C$. An edge of $C$ lies on exactly two faces of $G$ lying in different faces of $C$, so $f_1,f_2$ are these two. Any further vertex or edge of $H$ would be inside one face of $C$ and so could not touch the boundary of the other; hence $H=C$. Then $f_1\cup C\cup f_2=\R^2$, and so $G=C$.`,
      caption: String.raw`Choose a graph or edit it. Every pair of faces is compared by its boundary edges; a pair with identical boundaries is tinted blue and orange and the boundary is drawn thick. Only a plain cycle ever produces such a pair: add a chord or a pendant edge and the coincidence disappears.`,
      deps: ['graph-4.2.4', 'graph-4.2.2', 'graph-4.1.1'], refs: ['Diestel §4.2'], tags: ['faces', 'boundary'],
      viz(v) {
        const PRE = {
          cyc: () => pgSpec(PGS.ring6()),
          chord: () => planeSpec({ a: [5, 5.6], b: [7.1, 4.4], c: [7.1, 2.0], d: [5, 0.8], e: [2.9, 2.0], f: [2.9, 4.4] }, 'ab bc cd de ef fa ad'),
          pend: () => planeSpec({ a: [5, 5.6], b: [7.1, 4.4], c: [7.1, 2.0], d: [5, 0.8], e: [2.9, 2.0], f: [2.9, 4.4], g: [9.0, 3.2] }, 'ab bc cd de ef fa cg'),
          two: () => planeSpec({ a: [1.5, 1.2], b: [4.0, 1.2], c: [2.7, 4.2], d: [6.0, 1.2], e: [8.5, 1.2], f: [7.2, 4.2] }, 'ab bc ca de ef fd'),
        };
        const sel = v.select('', [{ value: 'cyc', label: 'a cycle' }, { value: 'chord', label: 'cycle + chord' }, { value: 'pend', label: 'cycle + pendant edge' }, { value: 'two', label: 'two triangles' }], 'cyc', { onChange: () => { loadG(G, PRE[sel.value]()); guard.reset(); } });
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...PRE.cyc(), r: 10, editable: true });
        const st = { msg: '' }; const guard = planeGuard(G, st);
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const F = ps.F, fs = F.faces, pairs = [];
          for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
            if (fs[i].edges.size && fs[i].edges.size === fs[j].edges.size && [...fs[i].edges].every((k) => fs[j].edges.has(k))) pairs.push([i, j]);
          }
          const hot = pairs[0];
          paintFaces(s, F, { colorOf: (i) => (hot ? (i === hot[0] ? 'blue' : i === hot[1] ? 'orange' : null) : i ? FILLS[(i - 1) % 8] : null), alpha: 0.28, outerAlpha: 0.18 });
          const bd = hot ? fs[hot[0]].edges : new Set();
          G.draw({ edgeColor: (e) => (bd.has(ps.eo.indexOf(e)) ? 'accent' : null), edgeWidth: (e) => (bd.has(ps.eo.indexOf(e)) ? 5 : 2) });
          const deg = new Array(ps.P.length).fill(0); ps.E.forEach(([a, b]) => { deg[a]++; deg[b]++; });
          const isCycle = ps.E.length >= 3 && F.comps === 1 && deg.every((d) => d === 2);
          if (st.msg) s.corner(st.msg, 'bl', { color: 'red', weight: 600 });
          info = { pairs, isCycle, l: fs.length };
        });
        v.readout(() => (info ? `${info.l} faces · ${info.pairs.length ? `faces ${info.pairs.map(([i, j]) => `${i ? i : 'outer'} and ${j}`).join('; ')} have **the same boundary**` : 'no two faces share a boundary'} · the graph ${info.isCycle ? 'is a cycle' : 'is not a cycle'} ${info.pairs.length ? (info.isCycle ? '✓' : '✗') : ''}` : ''));
      },
    },
    {
      num: '4.2.6', kind: 'Proposition', name: 'Faces of 2-connected plane graphs are bounded by cycles',
      statement: String.raw`In a 2-connected plane graph, every face is bounded by a cycle.`,
      idea: String.raw`By the ear decomposition (Proposition 3.1.1), a 2-connected plane graph $G$ arises from a smaller 2-connected plane graph $H$ by adding an $H$-path $P$ inside a face $f'$ of $H$. By induction $f'$ is bounded by a cycle $C$. Faces of $G$ not touching $P$ are faces of $H$ with the same cycle boundary. Any face touching $P$ lies in $f'$ and is bounded by a cycle inside $C\cup P$, which is a theta graph: by Lemma 4.1.2 (i) each of its regions is bounded by a cycle.`,
      caption: String.raw`Start from a hexagon and press **add an ear**: a path (a chord, or a path through one new vertex) is routed through a face between two of its boundary vertices, splitting that face in two. Click inside a face to see its boundary; it is always a cycle. **Add a pendant edge** to leave the 2-connected world: the boundary of the face around it is no longer a cycle (red).`,
      deps: ['graph-3.1.1', 'graph-4.1.1', 'graph-4.2.1', 'graph-4.1.2'], refs: ['Diestel §4.2'], tags: ['2-connected', 'ears', 'faces'],
      viz(v) {
        const s = gstage(v, { height: 360 });
        let pg = PGS.ring6(), ears = 0, sel = 1, pend = 0, msg = '';
        const rng = mkRng(11);
        const earAdd = () => {
          if (pg.P.length >= 13) { msg = 'Enough vertices: reset to start again.'; return; }
          const F = pgFaces(pg);
          for (let t = 0; t < 40; t++) {
            const fi = Math.floor(rng() * F.faces.length), f = F.faces[fi], vs = [...f.rv];
            if (vs.length < 2 || f.walks.length !== 1) continue;
            const u = vs[Math.floor(rng() * vs.length)], w = vs[Math.floor(rng() * vs.length)];
            if (u === w) continue;
            if (!F.adj(u, w) && rng() < 0.5) { const via = pgRoute(pg, F, u, w); if (via) { pg.E.push([u, w, via]); ears++; msg = ''; return; } }
            const pu = pg.P[u], pw = pg.P[w], mx = (pu[0] + pw[0]) / 2, my = (pu[1] + pw[1]) / 2, cands = [];
            for (let a = 0; a <= 30; a++) for (let b = 0; b <= 20; b++) {
              const x = 0.4 + (9.2 * a) / 30, y = 0.4 + (5.6 * b) / 20;
              if (F.locate(x, y) === fi) cands.push([x, y]);
            }
            cands.sort((p, q) => Math.hypot(p[0] - mx, p[1] - my) - Math.hypot(q[0] - mx, q[1] - my));
            for (const c of cands.slice(0, 80)) {
              const g = pgCopy(pg); g.P.push(c); const x = g.P.length - 1; g.E.push([u, x, []], [x, w, []]);
              const fl = pgFlatten(g);
              if (crossPairs(fl.P, fl.E, 0.12).length === 0) { pg = g; ears++; msg = ''; return; }
            }
          }
          msg = 'No ear found this time; try again.';
        };
        const pendant = () => {
          const F = pgFaces(pg); let best = null;
          for (let t = 0; t < 30 && !best; t++) {
            const fi = Math.floor(rng() * F.faces.length), f = F.faces[fi], vs = [...f.rv]; if (!vs.length) continue;
            const u = vs[Math.floor(rng() * vs.length)], pu = pg.P[u];
            for (let a = 0; a < 40 && !best; a++) {
              const ang = rng() * 6.283, r = 0.8 + rng() * 0.9, c = [pu[0] + r * Math.cos(ang), pu[1] + r * Math.sin(ang)];
              if (c[0] < 0.4 || c[0] > 9.6 || c[1] < 0.4 || c[1] > 6.0 || F.locate(c[0], c[1]) !== fi) continue;
              const g = pgCopy(pg); g.P.push(c); g.E.push([u, g.P.length - 1, []]); const fl = pgFlatten(g);
              if (crossPairs(fl.P, fl.E, 0.12).length === 0) best = g;
            }
          }
          if (best) { pg = best; pend++; msg = ''; } else msg = 'No room for a pendant edge here.';
        };
        v.button('add an ear', earAdd); v.button('add a pendant edge', pendant);
        v.button('reset', () => { pg = PGS.ring6(); ears = 0; pend = 0; sel = 1; msg = ''; });
        s.onClick((x, y) => { const F = pgFaces(pg); sel = F.locate(x, y); });
        let info = null;
        v.render(() => {
          const F = pgFaces(pg);
          if (sel >= F.faces.length) sel = 0;
          const isCyc = (f) => f.walks.length === 1 && f.rv.size === f.rlen && f.rlen >= 3;
          paintFaces(s, F, { colorOf: (i) => (i === sel ? (isCyc(F.faces[i]) ? 'accent' : 'red') : null), alpha: 0.3, outerAlpha: 0.18 });
          const bd = F.faces[sel].re;
          pgDraw(s, pg, { edgeColor: (k) => (bd.has(k) ? (isCyc(F.faces[sel]) ? 'accent' : 'red') : null) });
          if (msg) s.corner(msg, 'bl', { color: 'red', weight: 600, size: 12.5 });
          const good = F.faces.filter(isCyc).length, n = pg.P.length;
          info = { n, m: pg.E.length, l: F.faces.length, good, two: twoConnected(n, pg.E.map(([a, b]) => [a, b])), sel, cyc: isCyc(F.faces[sel]) };
        });
        v.readout(() => (info ? `$n=${info.n}$, $m=${info.m}$, ${info.l} faces · ${ears} ear${ears === 1 ? '' : 's'}, ${pend} pendant · graph is **${info.two ? '2-connected' : 'not 2-connected'}** · faces bounded by a cycle: **${info.good} of ${info.l}** ${info.two ? (info.good === info.l ? '✓' : '✗') : ''} · selected face (${info.sel || 'outer'}): ${info.cyc ? 'boundary is a cycle' : 'boundary is **not** a cycle'}` : ''));
      },
    },
    {
      num: '4.2.7', kind: 'Proposition', name: '3-connected plane graphs: faces = non-separating cycles',
      statement: String.raw`In a 3-connected plane graph, the face boundaries are precisely the non-separating induced cycles.`,
      idea: String.raw`A non-separating induced cycle $C$ has all of $G-C$ on one side (Jordan), so the other side is a face. Conversely a face boundary is a cycle by Proposition 4.2.6. It has no chord: a chord and a path between the two components of $C$ minus the chord's ends (which exists by 3-connectedness) would both run through the other face of $C$ without meeting, contradicting Lemma 4.1.2 (ii). It does not separate: two vertices outside are joined by three independent paths (Menger), and by Lemma 4.1.2 (i) only two of them can touch the face, so the third avoids $C$.`,
      caption: String.raw`Pick a graph and step through all its induced cycles with the slider. Each is classified as separating or not and checked against the face boundaries computed from the drawing. For the 3-connected graphs the two families coincide; for the last example (2-connected only) the outer boundary is a cycle with a chord, and the match fails.`,
      deps: ['graph-4.2.6', 'graph-3.3.6', 'graph-4.1.2'], refs: ['Diestel §4.2'], tags: ['3-connected', 'induced cycles', 'faces'],
      viz(v) {
        const wheel = () => { const P = { h: [5, 3.2] }, E = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 2 - (Math.PI * i) / 3; P['pqrstu'[i]] = [5 + 2.7 * Math.cos(a), 3.2 + 2.7 * Math.sin(a)]; E.push('h' + 'pqrstu'[i], 'pqrstu'[i] + 'pqrstu'[(i + 1) % 6]); } return planeSpec(P, E.join(' ')); };
        const PRE = {
          cube: () => pgSpec(PGS.cube()), octa: () => pgSpec(PGS.octa()), wheel,
          prism: () => planeSpec({ a: [5, 5.7], b: [1.4, 0.8], c: [8.6, 0.8], d: [5, 3.6], e: [3.3, 1.8], f: [6.7, 1.8] }, 'ab bc ca de ef fd ad be cf'),
          two: () => planeSpec({ a: [5, 5.6], b: [7.1, 4.4], c: [7.1, 2.0], d: [5, 0.8], e: [2.9, 2.0], f: [2.9, 4.4] }, 'ab bc cd de ef fa ad'),
        };
        const sel = v.select('', [{ value: 'cube', label: 'cube' }, { value: 'octa', label: 'octahedron' }, { value: 'wheel', label: 'wheel $W^6$' }, { value: 'prism', label: 'prism' }, { value: 'two', label: '2-connected only' }], 'cube', { onChange: () => { loadG(G, PRE[sel.value]()); idx.set(1); } });
        const idx = v.slider('induced cycle', 1, 40, 1, { int: true });
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...PRE.cube(), r: 10, editable: {} });
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const H = ix(G), A = amask(H), F = ps.F, n = H.n;
          const vkey = (vs) => [...vs].sort((a, b) => a - b).join(',');
          const cycles = allCycles(H).filter((c) => { let vm = 0; for (const x of c.vs) vm |= 1 << x; let inside = 0; for (const [a, b] of H.E) if ((vm >> a) & 1 && (vm >> b) & 1) inside++; return inside === c.vs.length; });
          const faceKeys = new Map(); F.faces.forEach((f, i) => { if (i && f.walks.length === 1 && f.verts.size === f.len) faceKeys.set(vkey(f.verts), i); });
          const outerKey = F.faces[0].walks.length === 1 && F.faces[0].verts.size === F.faces[0].len ? vkey(F.faces[0].verts) : null;
          if (outerKey) faceKeys.set(outerKey, 0);
          const rows = cycles.map((c) => ({ c, nonsep: nonSepInduced(H, A, c), face: faceKeys.has(vkey(c.vs)) ? faceKeys.get(vkey(c.vs)) : -1 }));
          const nsep = rows.filter((r) => r.nonsep), fb = [...faceKeys.keys()];
          const equal = nsep.length === faceKeys.size && nsep.every((r) => r.face >= 0);
          const i = Math.min(rows.length, Math.max(1, Math.round(idx.value))) - 1, cur = rows[i];
          if (cur) {
            if (cur.face > 0) paintFaces(s, F, { colorOf: (j) => (j === cur.face ? 'green' : null), alpha: 0.3 });
            const cv = cur.c.vs;
            G.draw({ nodeFill: (id) => (cv.includes(H.at(id)) ? (cur.nonsep ? 'green' : 'red') : null), edgeColor: (e) => { const k = H.eix.get(e); return k != null && cur.c.E[k] ? (cur.nonsep ? 'green' : 'red') : null; }, edgeWidth: (e) => { const k = H.eix.get(e); return k != null && cur.c.E[k] ? 5 : 1.8; } });
          } else G.draw({});
          info = { n, cnt: rows.length, ns: nsep.length, fcount: F.faces.length, equal, cur, i, iso: faceKeys.size };
        });
        v.legend([['green', 'non-separating induced cycle'], ['red', 'separating induced cycle']]);
        v.readout(() => (info ? `${info.cnt} induced cycles, **${info.ns}** non-separating · the drawing has **${info.fcount}** faces, **${info.iso}** with a cycle boundary · ${info.equal ? 'non-separating induced cycles = face boundaries ✓' : '**the two families differ** (not 3-connected)'}${info.cur ? ` · cycle ${info.i + 1}: ${info.cur.nonsep ? 'non-separating' : 'separating'}, ${info.cur.face >= 0 ? 'a face boundary' : 'not a face boundary'}` : ''}` : ''));
      },
    },
    {
      num: '4.2.7a', kind: 'Definition', name: 'Maximally plane graphs and plane triangulations', verify: true,
      statement: String.raw`A plane graph $G$ is **maximally plane** (or maximal) if no new edge can be added to it, on the same vertex set, so that the result is still a plane graph. A plane graph is a **plane triangulation** if every face, the outer face included, is bounded by a triangle.`,
      idea: String.raw`"Maximal" is about the drawing: edges may be drawn as arbitrary polygonal arcs, so an edge can be added whenever two non-adjacent vertices lie on a common face, even if the straight segment between them would leave the face. A triangulation has nothing to add, since any two vertices on a common face are already adjacent. Proposition 4.2.8 shows the converse.`,
      caption: String.raw`Choose a plane graph and press **add an edge**: the app finds two non-adjacent vertices on a common face and draws a new arc through that face (bending if the straight segment is blocked). Face lengths are printed inside the faces: triangles are green, longer faces orange. Keep adding until every face is a triangle, and no more edge fits.`,
      deps: ['graph-4.2.1a'], refs: ['Diestel §4.2'], tags: ['maximal plane graph', 'triangulation'],
      viz(v) {
        let name = 'ring6', pg = PGS.ring6(), last = -1;
        const sel = v.select('', [{ value: 'ring6', label: 'hexagon' }, { value: 'cube', label: 'cube' }, { value: 'fan', label: 'pentagon' }, { value: 'path7', label: 'path' }, { value: 'nested', label: 'triangle around square' }], 'ring6', { onChange: () => { name = sel.value; pg = PGS[name](); last = -1; } });
        const s = gstage(v, { height: 360 });
        v.button('add an edge', () => { const r = pgAddOne(pg, (c) => c.slice(0, 3)); last = r ? r.k : last; });
        v.button('saturate', () => { saturate(pg); last = -1; });
        v.button('reset', () => { pg = PGS[name](); last = -1; });
        let info = null;
        v.render(() => {
          const F = pgFaces(pg), add = pgAddable(pg, F);
          pgPaint(s, F); pgLabels(s, F);
          pgDraw(s, pg, { edgeColor: (k) => (k === last ? 'gold' : null) });
          const lens = F.faces.map((f) => f.rlen), tri = lens.every((x) => x === 3);
          info = { n: pg.P.length, m: pg.E.length, l: lens.length, nontri: lens.filter((x) => x !== 3).length, add: add.length, tri };
        });
        v.legend([['green', 'triangular face', { area: true }], ['orange', 'longer face', { area: true }], ['gold', 'edge just added']]);
        v.readout(() => (info ? `$n=${info.n}$, $m=${info.m}$, ${info.l} faces, **${info.nontri}** not triangles · pairs that can still be joined: **${info.add}** · ${info.add === 0 ? 'maximally plane' : 'not maximal'}, ${info.tri ? 'a triangulation' : 'not a triangulation'}${(info.add === 0) === info.tri ? ' ✓' : ''}` : ''));
      },
    },
    {
      num: '4.2.8', kind: 'Proposition', name: 'Maximally plane graphs are the plane triangulations',
      statement: String.raw`A plane graph with at least three vertices is maximally plane if and only if it is a plane triangulation.`,
      idea: String.raw`If all faces are triangles, a new edge would run through a face and join two vertices of its boundary; these are already adjacent, so nothing can be added. Conversely, let $G$ be maximal and $f$ a face with boundary $H$. Any two vertices of $H$ could be joined through $f$, so they are adjacent in $G$ and $G[H]$ is complete, $K^n$. $H$ contains a cycle (else $f$ would be the whole plane by Proposition 4.2.4). If $n\ge4$, take a 4-cycle $v_1v_2v_3v_4$ in it: through $f$ the vertices $v_1,v_3$ and $v_2,v_4$ are linkable, which Lemma 4.1.2 (ii) forbids for the two disjoint diagonals. So $n\le3$ and $H=K^3$.`,
      caption: String.raw`Click two vertices. If they lie on a common face and are not adjacent, a new edge is drawn through that face. If not, the straight attempt is shown dashed and red with the edges it is forced to cross. **find a chord** points at a face of length $\ge4$ and the pair that can be joined there. A triangulation (try the octahedron) accepts no edge at all.`,
      deps: ['graph-4.2.7a', 'graph-4.1.2', 'graph-4.2.4'], refs: ['Diestel §4.2'], tags: ['maximal plane graph', 'triangulation'],
      viz(v) {
        let name = 'octa', pg = PGS.octa(), tip = null, flash = null, msg = '';
        const sel = v.select('', [{ value: 'octa', label: 'octahedron' }, { value: 'cube', label: 'cube' }, { value: 'ring6', label: 'hexagon' }, { value: 'fan', label: 'pentagon' }], 'octa', { onChange: () => { name = sel.value; pg = PGS[name](); tip = flash = null; msg = ''; } });
        const s = gstage(v, { height: 360 });
        const attempt = (u, w) => {
          const F = pgFaces(pg); tip = null; flash = null;
          if (F.adj(u, w)) { msg = `${L(u)} and ${L(w)} are already adjacent.`; return; }
          const via = pgRoute(pg, F, u, w);
          if (via) { pg.E.push([u, w, via]); msg = `Added ${L(u)}${L(w)} through a common face.`; flash = { k: pg.E.length - 1 }; return; }
          const fl = pgFlatten(pg), P = fl.P, cr = [];
          fl.E.forEach(([a, b], k) => { if (a === u || b === u || a === w || b === w) return; const h = segInter(pg.P[u], pg.P[w], P[a], P[b]); if (h) cr.push({ x: h.x, y: h.y, k: fl.orig[k] }); });
          msg = `${L(u)} and ${L(w)} lie on no common face: every arc between them must cross an edge.`; flash = { bad: [u, w], cr };
        };
        const pick = pgPick(s, () => pg, attempt);
        v.button('find a chord', () => { const F = pgFaces(pg), a = pgAddable(pg, F); if (!a.length) { tip = null; msg = 'Every face is a triangle: nothing to find.'; return; } tip = a[0]; msg = `Face ${a[0][2] || 'outer'} has length ${F.faces[a[0][2]].rlen}: ${L(a[0][0])} and ${L(a[0][1])} can be joined inside it.`; });
        v.button('reset', () => { pg = PGS[name](); tip = flash = null; msg = ''; });
        let info = null;
        v.render(() => {
          const F = pgFaces(pg); pgPaint(s, F); pgLabels(s, F);
          pgDraw(s, pg, { edgeColor: (k) => (flash && flash.k === k ? 'gold' : null), vertColor: (i) => (pick.sel === i ? 'gold' : null), label: (i) => L(i) });
          if (flash && flash.bad) { const [u, w] = flash.bad; s.line(pg.P[u][0], pg.P[u][1], pg.P[w][0], pg.P[w][1], { color: 'red', width: 2.6, dash: [7, 5] }); flash.cr.forEach((c) => s.dot(c.x, c.y, { r: 7, hollow: true, color: 'red' })); }
          if (tip) s.line(pg.P[tip[0]][0], pg.P[tip[0]][1], pg.P[tip[1]][0], pg.P[tip[1]][1], { color: 'green', width: 2.6, dash: [7, 5] });
          const add = pgAddable(pg, F), tri = F.faces.every((f) => f.rlen === 3);
          if (pick.sel >= 0) s.corner(`${L(pick.sel)} selected: click a second vertex`, 'tl', { color: 'gold', weight: 700, size: 12.5 });
          info = { long: F.faces.filter((f) => f.rlen > 3).length, add: add.length, tri };
        });
        v.legend([['green', 'a chord that fits', { dash: true }], ['red', 'forced crossing', { dash: true }]]);
        v.readout(() => (info ? `${msg ? msg + ' · ' : ''}faces of length $\\ge4$: **${info.long}** · addable pairs: **${info.add}** · maximal ⇔ triangulation: ${(info.add === 0) === info.tri ? '✓' : '✗'} (${info.add === 0 ? 'maximal' : 'not maximal'}, ${info.tri ? 'triangulation' : 'not a triangulation'})` : ''));
      },
    },
    {
      num: '4.2.9', kind: 'Theorem', name: 'Euler’s formula n − m + ℓ = 2',
      statement: String.raw`Let $G$ be a connected plane graph with $n$ vertices, $m$ edges and $\ell$ faces. Then $$n-m+\ell=2.$$`,
      idea: String.raw`Induct on $m$. For $m=n-1$ the graph is a tree, which has $\ell=1$ face (Proposition 4.2.4), and $n-(n-1)+1=2$. Otherwise some edge $e$ lies on a cycle; by Lemma 4.2.2 it borders exactly two faces $f_1,f_2$. In $G-e$ these two merge into one face and all other faces stay faces, so $G-e$ has one edge and one face fewer, and $n-m+\ell$ does not change.`,
      caption: String.raw`Edit a connected plane graph or pick one. The counters $n,m,\ell$ always give $2$. The gold edge, with its two faces tinted blue and orange, is the next one the proof deletes; **delete it** and watch $m$ and $\ell$ fall together until a tree is left. Disconnect the graph and the sum becomes $1+c$.`,
      deps: ['graph-1.5.1', 'graph-1.5.2', 'graph-4.2.4', 'graph-4.2.2'], refs: ['Diestel §4.2'], see: ['top-10.9', 'top-11.17'], tags: ['Euler formula', 'faces'],
      credit: 'Euler, 1750 (letter to Goldbach; papers 1752–53, printed 1758), for polyhedra', verify: true, links: { wikipedia: 'https://en.wikipedia.org/wiki/Planar_graph' },
      viz(v) {
        const PRE = { cube: () => pgSpec(PGS.cube()), octa: () => pgSpec(PGS.octa()), house: () => planeSpec({ a: [2, 1], b: [7, 1], c: [7, 4], d: [4.5, 5.4], e: [2, 4], f: [4.5, 3.0] }, 'ab bc cd de ea af bf cf df') };
        const sel = v.select('', [{ value: 'house', label: 'house' }, { value: 'cube', label: 'cube' }, { value: 'octa', label: 'octahedron' }], 'house', { onChange: () => { loadG(G, PRE[sel.value]()); guard.reset(); log.length = 0; } });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { ...PRE.house(), r: 10, editable: true });
        const st = { msg: '' }; const guard = planeGuard(G, st, () => { log.length = 0; });
        const log = [];
        const nextEdge = (ps) => { for (let k = 0; k < ps.E.length; k++) if (!isBridge(ps.F, k)) return k; return -1; };
        v.button('delete the gold edge', () => { const ps = planeState(G); if (ps.bad.length || !ps.F) return; const k = nextEdge(ps); if (k >= 0) { G.removeEdge(ps.eo[k]); log.push(1); } });
        v.button('reset', () => { loadG(G, PRE[sel.value]()); guard.reset(); log.length = 0; });
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const F = ps.F, k = nextEdge(ps);
          paintFaces(s, F, { colorOf: (i) => (k >= 0 ? (i === F.faceOfHe[2 * k] ? 'blue' : i === F.faceOfHe[2 * k + 1] ? 'orange' : null) : i ? FILLS[(i - 1) % 8] : null), alpha: 0.3, outerAlpha: 0.18 });
          G.draw({ edgeColor: (e) => (k >= 0 && ps.eo[k] === e ? 'gold' : null), edgeWidth: (e) => (k >= 0 && ps.eo[k] === e ? 5 : 2.2) });
          if (st.msg) s.corner(st.msg, 'bl', { color: 'red', weight: 600 });
          info = { n: ps.P.length, m: ps.E.length, l: F.faces.length, c: F.comps, steps: log.length, tree: k < 0 };
        });
        v.legend([['blue', 'face left of the gold edge', { area: true }], ['orange', 'face right of it', { area: true }], ['gold', 'next edge to delete']]);
        v.readout(() => (info ? `$n=${info.n}$, $m=${info.m}$, $\\ell=${info.l}$ → $n-m+\\ell=\\mathbf{${info.n - info.m + info.l}}$ ${info.c === 1 ? (info.n - info.m + info.l === 2 ? '✓' : '✗') : `(the graph has ${info.c} components: $=1+c=${1 + info.c}$)`}${info.tree ? ' · no edge on a cycle is left: a tree/forest, $\\ell=1$' : ''} · edges deleted: ${info.steps}` : ''));
      },
    },
    {
      num: '4.2.10', kind: 'Corollary', name: 'A plane graph has at most 3n − 6 edges',
      statement: String.raw`A plane graph with $n\ge3$ vertices has at most $3n-6$ edges. Every plane triangulation with $n$ vertices has exactly $3n-6$ edges.`,
      idea: String.raw`By Proposition 4.2.8 it is enough to count the triangulations, since every plane graph extends to a maximal one. In a triangulation each face has three edges and each edge lies on exactly two faces (Lemma 4.2.2), so $2m=3\ell$. Replace $\ell$ by $2m/3$ in Euler's formula: $n-m+2m/3=2$, which gives $m=3n-6$.`,
      caption: String.raw`Choose $n$ and press **new points**. The graph starts as a plane path through $n$ points; **add an edge** or **saturate** inserts edges through faces (arcs may bend). The right panel plots $m$ against $n$: the green line is $3n-6$, and no plane graph reaches the red region. Saturation always stops exactly on the line. The red dot is $K^5$ ($n=5$, $m=10$).`,
      deps: ['graph-4.2.9', 'graph-4.2.8', 'graph-4.2.2'], refs: ['Diestel §4.2'], tags: ['edge bound', 'triangulation'],
      viz(v) {
        const nS = v.slider('$n$', 4, 11, 7, { int: true, onChange: () => gen() });
        const s = gstage(v, { height: 340, title: 'a plane graph on $n$ points' });
        const sP = v.stage({ x: [2, 12], y: [0, 30], height: 340, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$m$', title: 'edges against vertices' });
        let pg = null, seed = 3;
        const gen = () => {
          const n = Math.round(nS.value);
          for (let t = 0; t < 12; t++) {
            const r = mkRng(seed * 7919 + t * 104729 + n);
            const P = Array.from({ length: n }, () => [0.9 + r() * 8.2, 0.9 + r() * 4.6]).sort((a, b) => a[0] - b[0]);
            const cand = { P, E: P.slice(1).map((_, i) => [i, i + 1, []]) };
            const test = pgCopy(cand); saturate(test, 40);
            if (test.E.length === 3 * n - 6) { pg = cand; return; }
          }
          pg = { P: Array.from({ length: n }, (_, i) => [1 + (8 * i) / (n - 1), 1.2 + 3.6 * ((i * 5) % 7) / 6]), E: [] }; pg.E = pg.P.slice(1).map((_, i) => [i, i + 1, []]);
        };
        gen();
        v.button('new points', () => { seed++; gen(); });
        v.button('add an edge', () => { pgAddOne(pg, (c) => c.slice(0, 4)); });
        v.button('saturate', () => { saturate(pg); });
        const pick = pgPick(s, () => pg, (u, w) => { const F = pgFaces(pg); if (F.adj(u, w)) return; const via = pgRoute(pg, F, u, w); if (via) pg.E.push([u, w, via]); });
        let info = null;
        v.render(() => {
          const F = pgFaces(pg); pgPaint(s, F);
          pgDraw(s, pg, { vertColor: (i) => (pick.sel === i ? 'gold' : null) });
          const n = pg.P.length, m = pg.E.length, bound = 3 * n - 6;
          sP.between((x) => 3 * x - 6, () => 40, 3, 12, { fill: 'red', fillAlpha: 0.1 });
          sP.fn((x) => 3 * x - 6, { domain: [3, 12], color: 'green', width: 2.6 });
          sP.dot(5, 10, { r: 7, color: 'red', label: 'K⁵', labelPos: 'nw' });
          sP.dot(n, m, { r: 8, color: 'gold', label: `m = ${m}`, labelPos: 'se' });
          sP.vline(n, { color: 'faint', dash: true });
          info = { n, m, bound, tri: F.faces.every((f) => f.rlen === 3), l: F.faces.length };
        });
        v.readout(() => (info ? `$n=${info.n}$, $m=${info.m}\\le 3n-6=${info.bound}$ ${info.m <= info.bound ? '✓' : '✗'} · ${info.tri ? `a triangulation: $\\ell=${info.l}$, $2m=3\\ell$ ($${2 * info.m}=${3 * info.l}$), $m=3n-6$ ✓` : `${info.bound - info.m} edge${info.bound - info.m === 1 ? '' : 's'} short of a triangulation`}` : ''));
      },
    },
    {
      num: '4.2.11', kind: 'Corollary', name: 'Plane graphs contain neither a topological K⁵ nor K₃,₃',
      statement: String.raw`A plane graph contains neither $K^5$ nor $K_{3,3}$ as a topological minor. In particular $K^5$ and $K_{3,3}$ themselves cannot be drawn as plane graphs.`,
      idea: String.raw`$K^5$ has $10>3\cdot5-6=9$ edges, more than Corollary 4.2.10 allows. $K_{3,3}$ is 2-connected and triangle-free, so by Proposition 4.2.6 every face of a plane copy would be bounded by a cycle of length at least $4$; then $2m\ge4\ell$ and with Euler's formula $m\le2n-4=8<9$. A subdivision of either graph cannot be a subgraph of a plane graph, because replacing the subdivided paths by edges keeps it plane.`,
      caption: String.raw`Drag the vertices of $K^5$, $K_{3,3}$ or a planar relative and try to remove all crossings (red rings). **search** tries thousands of straight-line drawings (hill-climbing from random starts) and keeps the one with fewest crossings: $0$ for the planar graphs, never below $1$ for $K^5$ and $K_{3,3}$. The slider subdivides every edge; the edge bound is then checked after suppressing the subdivision vertices.`,
      deps: ['graph-4.2.10', 'graph-1.7.1b'], refs: ['Diestel §4.2'], see: ['top-10.8'], tags: ['non-planar', 'K5', 'K33'],
      viz(v) {
        const ring = (n, cx, cy, r, a0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 - (2 * Math.PI * i) / n), cy + r * Math.sin(a0 - (2 * Math.PI * i) / n)]);
        const BASE = {
          k4: { n: 4, pos: ring(4, 5, 3.2, 2.4, Math.PI / 4), E: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]], bound: 'tri' },
          k5e: { n: 5, pos: ring(5, 5, 3.2, 2.5, Math.PI / 2), E: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]], bound: 'tri' },
          k5: { n: 5, pos: ring(5, 5, 3.2, 2.5, Math.PI / 2), E: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]], bound: 'tri' },
          k33e: { n: 6, pos: [[2.2, 5], [5, 5], [7.8, 5], [2.2, 1.4], [5, 1.4], [7.8, 1.4]], E: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4]], bound: 'bip' },
          k33: { n: 6, pos: [[2.2, 5], [5, 5], [7.8, 5], [2.2, 1.4], [5, 1.4], [7.8, 1.4]], E: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]], bound: 'bip' },
        };
        const sel = v.select('', [{ value: 'k4', label: '$K^4$' }, { value: 'k5e', label: '$K^5-e$' }, { value: 'k5', label: '$K^5$' }, { value: 'k33e', label: '$K_{3,3}-e$' }, { value: 'k33', label: '$K_{3,3}$' }], 'k5', { onChange: () => load() });
        const sub = v.slider('subdivide each edge', 0, 2, 0, { int: true, onChange: () => load() });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 9, editable: {} });
        function load() {
          const B = BASE[sel.value], k = Math.round(sub.value), nodes = B.pos.map(([x, y], i) => ({ id: L(i), x, y })), edges = [];
          let c = B.n;
          for (const [a, b] of B.E) {
            let prev = L(a);
            for (let j = 1; j <= k; j++) { const t = j / (k + 1), id = L(c++); nodes.push({ id, x: B.pos[a][0] * (1 - t) + B.pos[b][0] * t, y: B.pos[a][1] * (1 - t) + B.pos[b][1] * t, r: 6 }); edges.push([prev, id]); prev = id; }
            edges.push([prev, L(b)]);
          }
          G.set({ nodes, edges }); G.layout('none'); best = null;
        }
        let best = null;
        const crossCount = (P, E) => crossPairs(P, E, 0).filter((c) => c.type === 'cross').length;
        v.button('search for a crossing-free drawing', () => {
          const ps = planeOf(G), r = v.rng(5), n = ps.P.length; let bestP = null, bc = Infinity;
          for (let rs = 0; rs < 40 && bc > 0; rs++) {
            let P = ps.P.map(() => [0.6 + r() * 8.8, 0.6 + r() * 5.2]), c = crossCount(P, ps.E);
            for (let it = 0; it < 500 && c > 0; it++) {
              const i = Math.floor(r() * n), old = P[i], q = [Math.max(0.4, Math.min(9.6, old[0] + (r() - 0.5) * 3)), Math.max(0.4, Math.min(6, old[1] + (r() - 0.5) * 3))];
              P[i] = q; const c2 = crossCount(P, ps.E); if (c2 <= c) c = c2; else P[i] = old;
            }
            if (c < bc) { bc = c; bestP = P.map((p) => p.slice()); }
          }
          ps.ids.forEach((id, i) => { const nd = G.node(id); nd.x = bestP[i][0]; nd.y = bestP[i][1]; });
          best = bc;
        });
        load();
        let info = null;
        v.render(() => {
          const ps = planeOf(G), X = crossPairs(ps.P, ps.E, 0.0).filter((c) => c.type === 'cross');
          markCross(s, X); G.draw({});
          const B = BASE[sel.value], n0 = B.n, m0 = B.E.length;
          const lim = B.bound === 'tri' ? 3 * n0 - 6 : 2 * n0 - 4;
          info = { x: X.length, n: ps.P.length, m: ps.E.length, n0, m0, lim, kind: B.bound, over: m0 > lim };
        });
        v.readout(() => (info ? `crossings now: **${info.x}**${best != null ? ` · best found by the search: **${best}**` : ''} · after suppressing subdivision vertices: $n=${info.n0}$, $m=${info.m0}$ vs ${info.kind === 'tri' ? `$3n-6=${info.lim}$` : `$2n-4=${info.lim}$ (triangle-free, 2-connected)`} → ${info.over ? '**too many edges for a plane graph**' : 'no contradiction'}` : ''));
      },
    },
  ],
};
