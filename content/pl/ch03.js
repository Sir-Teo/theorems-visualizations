// Programming Languages & Types — Chapter 3: Confluence and normalization (items 3.1–3.5; 3.6–3.10 in ch03-b.js)
import { oneStepDiamond, finiteOneStepDiamond, limitedParallel, parallelMembership } from './reduction-audit.shared.js';
import {
  V, L, A, parse, P, DEFS, key, layoutTerm, show, drawLine, redexes, contract, getAt, setAt, size, naiveSubst, runStrategy, normalize,
  field, pxStage, drawParseError, rrect, succs, joinSearch, betaDist, contractSet, dev, parAll, isParallel, arsAnalyse, drawDiamond, hitNodes, underlineSpans, cat,
  STRATS, findRedex,
} from './ch03.shared.js';

const tf = (v, label, def, onChange, width = 340) => field(v, label, def, (s) => parse(s, DEFS), { width, onChange });
const ptr = (s) => { const p = s.pointer; return p && p.inside ? { x: s.X(p.x), y: s.Y(p.y) } : null; };
const NICE = { abbr: { names: true } };
const tcode = (t) => '\\mathtt{' + show(t, NICE).replace(/λ/g, '\\lambda ').replace(/ /g, '\\ ') + '}';
const ok = (b) => (b ? '✓' : '✗');

// ---- small graph search used by 3.1 (abstract systems)
function graphBfs(succ, start) {
  const dist = new Map([[start, 0]]), par = new Map([[start, null]]); let layer = [start];
  while (layer.length) { const nx = []; for (const u of layer) for (const w of succ[u]) if (!dist.has(w)) { dist.set(w, dist.get(u) + 1); par.set(w, u); nx.push(w); } layer = nx; }
  return { dist, par };
}
function graphJoin(succ, b, c) {
  const B = graphBfs(succ, b), C = graphBfs(succ, c); let best = null;
  for (const [k, db] of B.dist) { const dc = C.dist.get(k); if (dc === undefined) continue; if (!best || db + dc < best.tot) best = { k, tot: db + dc }; }
  if (!best) return null;
  const chain = (X) => { const o = []; for (let u = best.k; u !== null; u = X.par.get(u)) o.push(u); return o.reverse(); };
  return { meet: best.k, left: chain(B), right: chain(C) };
}

export default {
  collection: 'pl',
  chapter: 3,
  title: 'Confluence and normalization',
  summary: String.raw`Reduction may proceed in any order, but it cannot reach two different answers: the Church–Rosser theorem says diverging reduction paths can always be rejoined, so normal forms are unique. Whether a normal form exists depends on strategy, and normal-order reduction finds it whenever one exists. Equality and termination of λ-terms are undecidable; combinatory logic shows that even variables are dispensable, and Curry’s paradox shows why the untyped calculus cannot serve as a logic.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Definition', name: 'Confluence and the diamond property',
      statement: String.raw`Let $\to$ be a binary relation on a set (for us: $\to_\beta$ on $\lambda$-terms up to $\equiv_\alpha$) and $\to^{*}$ its reflexive–transitive closure. $\to$ has the **diamond property** if $b\leftarrow a\to c$ implies there is $d$ with $b\to d\leftarrow c$: one step on each side closes the fork. $\to$ is **confluent** if $\to^{*}$ has the diamond property, i.e. whenever $a\to^{*}b$ and $a\to^{*}c$ there is $d$ with $b\to^{*}d$ and $c\to^{*}d$. The diamond property implies confluence (tile a grid of diamonds), but not conversely. $\to_\beta$ is confluent (3.4), yet it does not have the diamond property: contracting a redex can copy or erase another one, so the fork may need several steps to close on one side.`,
      idea: String.raw`Confluence is the statement that the choices made by a reduction strategy (2.5) never matter in the long run: whatever two partial computations have been done from the same term, both can still be completed to the same term. If the relation has the diamond property one proves confluence by induction on the lengths of the two paths, filling in a grid one diamond at a time. For $\beta$ the single diamond is false, as the duplicating redex $(\lambda x.\,x\,x)\,((\lambda y.\,y)\,z)$ shows: contracting the outer redex copies the inner one, which then needs two further steps, while the other side needs one. Closing that gap is the job of parallel reduction (3.3).

The grid argument uses mathematical induction (ALG 2.1) on two finite path lengths. First induct on the length of one path to commute a single step past it, adjoining one diamond at a time. Then induct on the number of steps in the other path, applying that strip construction to each successive step. An empty path is the base case and needs only the other path as a joining sequence. This proves confluence from the stated one-step diamond property; it does not assume that ordinary beta reduction has that stronger property or replace its parallel-reduction argument.`,
      caption: String.raw`Choose a term and, with the two sliders, two of its redexes (numbered under the term; the picture uses the first four). The tool contracts them, then searches bounded sets on both sides and draws a common reduct with the least total steps among those found. A separate exact-successor check tests one-step diamonds; the shortest displayed join may use zero or several steps. Switch to “abstract systems” to see forks that never rejoin.`,
      deps: ['pl-2.4', 'alg-2.1'], refs: ['Selinger §4.3, pp.25–27'], tags: ['confluence', 'reduction'],
      credit: 'Definitions and diamond-to-confluence proof follow Selinger, Lecture Notes on the Lambda Calculus, §4.3; confluence is the Church–Rosser theorem',
      viz(v) {
        const sT = pxStage(v, { height: 108, full: true, title: 'A fork: one term, two redexes chosen' });
        const sD = pxStage(v, { height: 370, full: true, hover: true, title: 'Closing the fork' });
        const EX = { dup: '(λx. x x) ((λy. y) z)', disj: '((λa. a) b) ((λc. c) d)', erase: '(λx. y) ((λz. z) w)', nest: '(λf. f (f a)) (λx. (λy. y) x)' };
        const SYS = {
          fork: { names: ['a', 'b', 'c'], succ: [[1, 2], [], []], note: 'b and c are normal forms' },
          square: { names: ['a', 'b', 'c', 'd'], succ: [[1, 2], [3], [3], []], note: 'a one-step diamond' },
          lop: { names: ['a', 'b', 'c', 'd', 'e'], succ: [[1, 2], [3], [4], [4], []], note: 'closes, but needs 2 steps on one side' },
        };
        const mode = v.select('Rewriting system', [{ value: 'lam', label: 'β-reduction' }, { value: 'ars', label: 'abstract systems' }], 'lam', { onChange: () => sync() });
        const f = tf(v, 'term', EX.dup, () => v.invalidate());
        const exL = v.select('Examples', [{ value: 'dup', label: 'duplicating' }, { value: 'disj', label: 'disjoint' }, { value: 'erase', label: 'erasing' }, { value: 'nest', label: 'nested' }], 'dup', { onChange: () => f.set(EX[exL.value]) });
        const exA = v.select('System', [{ value: 'fork', label: 'a fork, no join' }, { value: 'square', label: 'square' }, { value: 'lop', label: 'lopsided' }], 'fork', { onChange: () => v.invalidate() });
        const s1 = v.slider('first reduction: redex #', 1, 4, 1, { step: 1, int: true });
        const s2 = v.slider('second reduction: redex #', 1, 4, 2, { step: 1, int: true });
        const sync = () => { const lam = mode.value === 'lam'; f.ctl.el.hidden = !lam; exL.el.hidden = !lam; exA.el.hidden = lam; v.invalidate(); };
        sync();
        v.legend([['accent', 'first choice', { dot: true }], ['orange', 'second choice', { dot: true }], ['green', 'common reduct', { dot: true }]]);
        let nodes = [], res = null;
        v.render(() => {
          res = null;
          const hover = ptr(sD);
          let top, leftN = [], rightN = [], bottom, leftL = [], rightL = [];
          if (mode.value === 'lam') {
            if (f.err) { drawParseError(v, sT, f.src, f.err); sD.textPx('fix the term', sD.W / 2, sD.H / 2, { size: 14, color: 'muted', align: 'center' }); nodes = []; return; }
            const t = f.ast, rs = redexes(t), n = rs.length;
            const lay = layoutTerm(t, NICE);
            const d = drawLine(v, sT, lay, sT.W / 2, 40, { size: 21, align: 'center', maxW: sT.W - 40, weight: 600 });
            if (!n) { sT.textPx('normal form: there is no redex, so there is no fork', sT.W / 2, 82, { size: 13, color: 'green', weight: 700, align: 'center' }); sD.textPx('choose a term with at least one redex', sD.W / 2, sD.H / 2, { size: 14, color: 'muted', align: 'center' }); nodes = []; return; }
            const i = Math.min(s1.value, n) - 1, j = Math.min(s2.value, n) - 1;
            const marks = []; rs.forEach((p, k) => marks.push({ path: p, color: k === i ? 'accent' : k === j ? 'orange' : 'faint', level: k === j && i !== j && rs[i] !== undefined && (rs[i].startsWith(p) || p.startsWith(rs[i])) ? 1 : 0, width: k === i || k === j ? 3.4 : 1.5 }));
            // two coloured bars when i and j differ and nest
            underlineSpans(v, sT, d, lay, 40, marks);
            rs.forEach((p, k) => { if (lay.spans.has(p)) { const [a, b] = lay.spans.get(p); sT.textPx(String(k + 1), (d.xOf(a) + d.xOf(b)) / 2, 40 + d.size * 0.78 + 14, { size: 11.5, weight: 700, color: k === i ? 'accent' : k === j ? 'orange' : 'muted', align: 'center', halo: false }); } });
            const L1 = contract(t, rs[i]), R1 = contract(t, rs[j]);
            const jn = joinSearch(L1, R1, { depth: 7, cap: 900, maxSize: 120 });
            top = { text: show(t, NICE), color: 'accent' };
            if (jn) {
              leftN = jn.left.slice(0, -1).map((u) => ({ text: show(u, NICE) })); rightN = jn.right.slice(0, -1).map((u) => ({ text: show(u, NICE) }));
              bottom = { text: show(jn.meet, NICE), color: 'green' };
              res = { lam: true, i, j, n, a: jn.left.length - 1, b: jn.right.length - 1, same: key(L1)===key(R1), joined: true, diamond:oneStepDiamond(L1,R1).value };
            } else {
              leftN = [{ text: show(L1, NICE) }]; rightN = [{ text: show(R1, NICE) }];
              bottom = { text: 'no common reduct found', color: 'red', missing: true };
              res = { lam: true, joined: false, i, j, n };
            }
            leftL = ['#' + (i + 1), ...Array(leftN.length).fill('')]; rightL = ['#' + (j + 1), ...Array(rightN.length).fill('')];
          } else {
            const S = SYS[exA.value], nm = S.names, mx = S.succ[0].length;
            sT.textPx('rules:  ' + S.succ.flatMap((ws, u) => ws.map((w) => `${nm[u]} → ${nm[w]}`)).join(',   '), sT.W / 2, 34, { size: 19, weight: 600, align: 'center', color: 'ink', halo: false });
            sT.textPx(S.note + ' · the fork starts at a', sT.W / 2, 72, { size: 13, color: 'muted', align: 'center', weight: 600, halo: false });
            const i = Math.min(s1.value, mx) - 1, j = Math.min(s2.value, mx) - 1;
            const b = S.succ[0][i], c = S.succ[0][j];
            const jn = graphJoin(S.succ, b, c);
            top = { text: nm[0], color: 'accent' };
            if (jn) {
              leftN = jn.left.slice(0, -1).map((u) => ({ text: nm[u] })); rightN = jn.right.slice(0, -1).map((u) => ({ text: nm[u] }));
              bottom = { text: nm[jn.meet], color: 'green' };
              res = { lam: false, i, j, n: mx, a: jn.left.length - 1, b: jn.right.length - 1, same: b === c, joined: true, diamond:finiteOneStepDiamond(S.succ,b,c) };
            } else {
              leftN = [{ text: nm[b] }]; rightN = [{ text: nm[c] }];
              bottom = { text: 'no common reduct', color: 'red', missing: true };
              res = { lam: false, joined: false, i, j, n: mx };
            }
            leftL = [''].concat(Array(leftN.length).fill('')); rightL = [''].concat(Array(rightN.length).fill(''));
          }
          nodes = drawDiamond(v, sD, { top, bottom, left: leftN, right: rightN, leftLabels: leftL, rightLabels: rightL, region: [0, 0, sD.W, sD.H - 28] });
          const h = hover ? hitNodes(nodes, hover.x, hover.y) : null;
          if (h && h.full !== h.text) sD.textPx(h.full, sD.W / 2, sD.H - 14, { size: 13, weight: 600, align: 'center', plate: true });
          else sD.textPx(res && res.joined ? 'hover a node to read the whole term' : '', sD.W / 2, sD.H - 14, { size: 12, color: 'muted', align: 'center', halo: false });
        });
        v.readout(() => {
          if (!res) return mode.value === 'lam' ? 'Choose a term with at least one redex.' : '';
          if (!res.joined) return res.lam ? '**No common reduct found within the search budgets**: depth7 per side, at most900 states per side, size120 nodes. This is inconclusive; β-reduction is confluent by the theorem, so a join exists beyond the search performed here.' : '**No common reduct exists**: exhaustive reachability on this finite abstract system certifies a nonjoinable fork, hence nonconfluence.';
          const pick = res.same ? 'The chosen successors are identical, giving a zero-step join. ' : '';
          return `${pick}The displayed common reduct takes $${res.a}$ steps on the left and $${res.b}$ on the right. Exact one-step successors were checked separately: **${res.diamond===null?'unknown (size budget)':res.diamond?'one-step diamond found':'no exact one-step diamond'}**. Reflexive joining permits zero steps; our strict diamond definition requires one on each side, even when the successors coincide. This selected fork illustrates joinability; it is not a test of all forks in an infinite system.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Theorem', name: 'Newman’s lemma',
      statement: String.raw`Let $\to$ be a **terminating** relation (there is no infinite chain $a_0\to a_1\to a_2\to\cdots$). If $\to$ is **locally confluent** (whenever $b\leftarrow a\to c$ there is $d$ with $b\to^{*}d\leftarrow^{*}c$), then $\to$ is **confluent**. Consequently every element of a terminating, locally confluent system has exactly one normal form. Both hypotheses are needed: a locally confluent system with a cycle can fail to be confluent.`,
      idea: String.raw`Argue by well-founded induction on $a$ (this is where termination is used): assume every element below $a$ is confluent. Take $a\to^{*}b$ and $a\to^{*}c$; unless one path is empty, split them as $a\to b_1\to^{*}b$ and $a\to c_1\to^{*}c$. Local confluence at $a$ gives $d_1$ with $b_1\to^{*}d_1\leftarrow^{*}c_1$. Since $b_1$ is below $a$ and confluent, the fork $b\leftarrow^{*}b_1\to^{*}d_1$ closes at some $e$; then $c_1$ (below $a$, confluent) closes $c\leftarrow^{*}c_1\to^{*}d_1\to^{*}e$ at some $f$, and $b\to^{*}e\to^{*}f\leftarrow^{*}c$. Locally confluent checks involve only single steps, so they are finitely many to test, which is why the lemma is useful in practice.`,
      caption: String.raw`Click a node and then another node to toggle the arrow between them (clicking the same node twice toggles a loop); load a preset, or press Random. Red arrows mark a fork $b\leftarrow a\to c$ that cannot be rejoined (a failure of local confluence); green nodes are normal forms. “By height” lays a terminating system out by its longest path to a normal form, the order along which the proof’s induction runs. “Test 3000 random systems” counts how often each hypothesis and the conclusion hold.`,
      deps: ['pl-3.1'], refs: ['Pierce §5.3'], tags: ['confluence', 'termination'],
      credit: 'M. H. A. Newman, 1942 (Annals of Mathematics 43)',
      viz(v) {
        const s = pxStage(v, { height: 380, full: true, hover: true, title: 'A finite rewriting system' });
        const N = 7, NM = 'abcdefg';
        const adj = Array.from({ length: N }, () => Array(N).fill(0));
        const PRE = {
          sq: { n: 6, e: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [3, 5], [4, 5]], note: 'terminating and locally confluent' },
          ce: { n: 4, e: [[0, 1], [1, 0], [0, 2], [1, 3]], note: 'a ⇄ b, a → c, b → d: locally confluent but not terminating' },
          fork: { n: 3, e: [[0, 1], [0, 2]], note: 'terminating, not locally confluent' },
          line: { n: 5, e: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 2], [1, 3]], note: 'terminating, confluent' },
        };
        const nS = v.slider('nodes', 3, 7, 6, { step: 1, int: true });
        const load = (id) => { for (const r of adj) r.fill(0); for (const [a, b] of PRE[id].e) adj[a][b] = 1; nS.set(PRE[id].n); sel = null; v.invalidate(); };
        let sel = null, rseed = 1;
        const pre = v.select('Preset', [{ value: 'sq', label: 'terminating' }, { value: 'ce', label: 'a ⇄ b counterexample' }, { value: 'fork', label: 'plain fork' }, { value: 'line', label: 'ladder' }], 'sq', { onChange: () => load(pre.value) });
        const lay = v.select('Layout', [{ value: 'circle', label: 'circle' }, { value: 'height', label: 'by height' }], 'circle');
        v.button('Random system', () => { const r = v.rng(rseed++ * 977 + 5), n = nS.value; for (const row of adj) row.fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && r() < 0.17) adj[i][j] = 1; sel = null; });
        v.button('Clear arrows', () => { for (const r of adj) r.fill(0); sel = null; });
        let expText = '';
        v.button('Test 3000 random systems', () => {
          const r = v.rng(2024); let T = 0, TL = 0, TLC = 0, TC = 0, NT = 0, NTL = 0, NTLC = 0;
          for (let it = 0; it < 3000; it++) {
            const n = 5, m = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && r() < 0.17) m[i][j] = 1;
            const a = arsAnalyse(m);
            if (a.terminating) { T++; if (a.locallyConfluent) { TL++; if (a.confluent) TLC++; } if (a.confluent) TC++; } else { NT++; if (a.locallyConfluent) { NTL++; if (a.confluent) NTLC++; } }
          }
          expText = `Of 3000 random systems on 5 elements: **${T}** terminate; **${TL}** of those are locally confluent and **${TLC}** of these ${TLC === TL ? 'are confluent — no exceptions' : 'are confluent'} (Newman). Of the **${NT}** that do not terminate, **${NTL}** are locally confluent but only **${NTLC}** are confluent, so **${NTL - NTLC}** counterexamples appear without termination.`;
        });
        load('sq');
        const circ = (n, W, H) => { const R = Math.min(W, H) / 2 - 44, cx = W / 2, cy = H / 2 + 6; return Array.from({ length: n }, (_, i) => [cx + R * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n), cy + R * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n)]); };
        let P_ = [], an = null, usedHeight = false;
        s.onClick((x, y) => {
          const px = s.X(x), py = s.Y(y); let hit = -1;
          P_.forEach((p, i) => { if (Math.hypot(px - p[0], py - p[1]) < 22) hit = i; });
          if (hit < 0) { sel = null; return; }
          if (sel === null) sel = hit; else { adj[sel][hit] = adj[sel][hit] ? 0 : 1; sel = null; }
        });
        v.legend([['green', 'normal form', { dot: true }], ['red', 'fork that cannot be rejoined'], ['gold', 'selected']]);
        v.render(() => {
          const n = nS.value, sub = adj.slice(0, n).map((r) => r.slice(0, n));
          an = arsAnalyse(sub);
          let hts = null;
          if (an.terminating) { hts = Array(n).fill(-1); const h = (u) => (hts[u] >= 0 ? hts[u] : (hts[u] = an.succ[u].length ? 1 + Math.max(...an.succ[u].map(h)) : 0)); for (let u = 0; u < n; u++) h(u); }
          usedHeight = lay.value === 'height' && !!hts;
          if (usedHeight) {
            const mxH = Math.max(...hts), rows = Array.from({ length: mxH + 1 }, () => []);
            for (let u = 0; u < n; u++) rows[hts[u]].push(u);
            P_ = Array(n);
            for (let h = 0; h <= mxH; h++) rows[h].forEach((u, k) => { P_[u] = [s.W * (k + 1) / (rows[h].length + 1), 40 + (s.H - 90) * (mxH - h) / Math.max(1, mxH)]; });
            for (let h = 0; h <= mxH; h++) s.textPx('height ' + h, 10, 40 + (s.H - 90) * (mxH - h) / Math.max(1, mxH), { size: 11, color: 'muted', align: 'left', weight: 700, halo: false });
          } else P_ = circ(n, s.W, s.H);
          const ctx = s.ctx, badEdge = new Set();
          for (const [a, b, c] of an.localFail) { badEdge.add(a + '>' + b); badEdge.add(a + '>' + c); }
          const witness = an.confFail.length ? an.confFail[0] : null;
          const drawArrow = (i, j) => {
            const [x1, y1] = P_[i], [x2, y2] = P_[j], bad = badEdge.has(i + '>' + j), col = bad ? 'red' : 'muted';
            ctx.save(); ctx.strokeStyle = v.color(col, bad ? 1 : 0.85); ctx.fillStyle = v.color(col, bad ? 1 : 0.85); ctx.lineWidth = bad ? 2.6 : 1.7;
            if (i === j) {
              const up = y1 < s.H / 2 ? -1 : 1; ctx.beginPath(); ctx.moveTo(x1 - 9, y1 + up * 16); ctx.bezierCurveTo(x1 - 26, y1 + up * 52, x1 + 26, y1 + up * 52, x1 + 9, y1 + up * 16); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(x1 + 9, y1 + up * 16); ctx.lineTo(x1 + 16, y1 + up * 28); ctx.lineTo(x1 + 2, y1 + up * 27); ctx.closePath(); ctx.fill();
            } else {
              const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, curve = adj[j][i] ? 14 : 0;
              const nx = -uy * curve, ny = ux * curve, R = 18;
              const sx = x1 + ux * R + nx * 0.5, sy = y1 + uy * R + ny * 0.5, ex = x2 - ux * (R + 2) + nx * 0.5, ey = y2 - uy * (R + 2) + ny * 0.5;
              ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + ex) / 2 + nx, (sy + ey) / 2 + ny, ex, ey); ctx.stroke();
              const ang = Math.atan2(ey - ((sy + ey) / 2 + ny), ex - ((sx + ex) / 2 + nx));
              ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 9 * Math.cos(ang - 0.4), ey - 9 * Math.sin(ang - 0.4)); ctx.lineTo(ex - 9 * Math.cos(ang + 0.4), ey - 9 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
            }
            ctx.restore();
          };
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (adj[i][j]) drawArrow(i, j);
          for (let i = 0; i < n; i++) {
            const [x, y] = P_[i], nf = an.normal[i], inW = witness && (i === witness[1] || i === witness[2]);
            ctx.save();
            if (sel === i) { ctx.beginPath(); ctx.arc(x, y, 23, 0, 6.2832); ctx.strokeStyle = v.color('gold', 1); ctx.lineWidth = 3; ctx.stroke(); }
            if (inW) { ctx.beginPath(); ctx.arc(x, y, 23, 0, 6.2832); ctx.strokeStyle = v.color('red', 1); ctx.lineWidth = 2.4; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); }
            ctx.beginPath(); ctx.arc(x, y, 17, 0, 6.2832); ctx.fillStyle = v.color('panel', 1); ctx.fill(); ctx.fillStyle = v.color(nf ? 'green' : 'accent', 0.22); ctx.fill();
            ctx.strokeStyle = v.color(nf ? 'green' : 'accent', 1); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
            s.textPx(NM[i], x, y, { size: 15, weight: 700, align: 'center', color: 'ink', halo: false });
          }
          if (witness) s.textPx(`${NM[witness[1]]} and ${NM[witness[2]]} are both reachable from ${NM[witness[0]]} and have no common reduct`, s.W / 2, s.H - 14, { size: 12.5, weight: 700, color: 'red', align: 'center', halo: false });
          else if (n && !an.confluent) s.textPx('', 0, 0);
          if (lay.value === 'height' && !hts) s.textPx('the system has a cycle: it has no heights', s.W / 2, s.H - 14, { size: 12.5, weight: 700, color: 'orange', align: 'center', halo: false });
        });
        v.readout(() => {
          if (!an) return '';
          const hyp = an.terminating && an.locallyConfluent;
          const t1 = `Terminating: ${ok(an.terminating)} · locally confluent: ${ok(an.locallyConfluent)} (${an.localFail.length} bad fork${an.localFail.length === 1 ? '' : 's'}) · confluent: ${ok(an.confluent)}.`;
          const t2 = hyp ? ` Both hypotheses hold, so Newman’s lemma says the system is confluent — and it is ${ok(an.confluent)}.` : (!an.terminating && an.locallyConfluent && !an.confluent ? ' **Local confluence alone is not enough: this system loops, and loses confluence.**' : ' The hypotheses of the lemma are not both satisfied, so it says nothing here.');
          return t1 + t2 + (expText ? '\n' + expText : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Method', name: 'Parallel reduction (Tait–Martin-Löf)',
      statement: String.raw`**Parallel reduction** $t\Rightarrow t'$ is defined by: $x\Rightarrow x$; if $t\Rightarrow t'$ then $\lambda x.\,t\Rightarrow\lambda x.\,t'$; if $t\Rightarrow t'$ and $u\Rightarrow u'$ then $t\,u\Rightarrow t'\,u'$ and $(\lambda x.\,t)\,u\Rightarrow[x\mapsto u']\,t'$. It contracts any set of redexes at once, including redexes inside the body or argument of a contracted one, and $\to_\beta\;\subseteq\;\Rightarrow\;\subseteq\;\to_\beta^{*}$, so $\Rightarrow^{*}=\to_\beta^{*}$. The **complete development** $t^{*}$ contracts every redex present in $t$: $x^{*}=x$, $(\lambda x.\,t)^{*}=\lambda x.\,t^{*}$, $((\lambda x.\,t)\,u)^{*}=[x\mapsto u^{*}]\,t^{*}$, $(t\,u)^{*}=t^{*}\,u^{*}$ if $t$ is not an abstraction. **Diamond lemma:** $t\Rightarrow u$ implies $u\Rightarrow t^{*}$; hence $\Rightarrow$ has the diamond property.`,
      idea: String.raw`The ordinary one-step relation fails the diamond property because a contracted redex may duplicate another (3.1). Parallel reduction is designed to absorb that: the duplicated redex is contracted inside every copy in the same move. The lemma is proved by induction on the derivation of $t\Rightarrow u$, using one substitution fact, that $t\Rightarrow t'$ and $u\Rightarrow u'$ imply $[x\mapsto u]\,t\Rightarrow[x\mapsto u']\,t'$. Since $\Rightarrow$ is sandwiched between $\to_\beta$ and $\to_\beta^{*}$, the diamond property of $\Rightarrow$ gives confluence of $\beta$ (3.4) by tiling.`,
      caption: String.raw`Click redexes in the term to put them into a set (choose set A, blue, or set B, orange, with the selector); the redexes of A are contracted at once to give $u$, those of B to give $w$, and every redex at once gives $t^{*}$ at the bottom. The two bottom edges are single parallel steps; the readout says how many ordinary $\beta$-steps the same moves would need. “Check every parallel reduct” tests the lemma on all parallel reducts of the term. Membership enumeration is limited to size80 and eight redexes; development is limited to1,000 nodes. A cutoff is inconclusive.`,
      scope: String.raw`Capture-avoiding substitution and identification up to α-equivalence are essential. Selinger §4.4 gives the substitution lemma, maximal parallel reduct and diamond proof, explicitly attributing the parallel proof to Tait and Martin-Löf. We display the β-only specialization. Computational checks are bounded and do not prove the theorem.`,
      deps: ['pl-3.1'], refs: ['Selinger §4.4, Lemmas4.7–4.9, pp.28–31'], tags: ['parallel reduction', 'confluence'],
      credit: 'Tait–Martin-Löf parallel-reduction proof, as attributed and presented by Selinger, §4.4, Lemmas 4.7–4.9',
      viz(v) {
        const sT = pxStage(v, { height: 112, full: true, title: 'Click redexes to add them to the active set' });
        const sD = pxStage(v, { height: 340, full: true, hover: true, title: 'Parallel steps close every fork in one move' });
        const EX = { dup: '(λx. x x) ((λy. y) z)', nest: '(λf. f (f a)) (λx. (λy. y) x)', three: '(λx. (λy. y) x) ((λa. a) b) ', ska: '(λx. λy. x y) ((λa. a) b) ((λc. c) d)' };
        let SA = new Set(), SB = new Set(), info = null, bigRes = '';
        const reset = () => { SA = new Set(); SB = new Set(); if (f.ast) { const rs = redexes(f.ast); if (rs.length) SA.add(rs[0]); if (rs.length > 1) SB.add(rs[rs.length - 1]); } bigRes = ''; };
        const f = tf(v, 'term', EX.dup, () => { reset(); v.invalidate(); });
        const ex = v.select('Examples', [{ value: 'dup', label: 'duplicating' }, { value: 'nest', label: 'nested' }, { value: 'three', label: 'redex in argument' }, { value: 'ska', label: 'two arguments' }], 'dup', { onChange: () => f.set(EX[ex.value]) });
        const which = v.select('Clicks edit', [{ value: 'A', label: 'set A (blue)' }, { value: 'B', label: 'set B (orange)' }], 'A');
        v.button('A = every redex', () => { if(!f.err) SA = new Set(redexes(f.ast)); });
        v.button('B = every redex', () => { if(!f.err) SB = new Set(redexes(f.ast)); });
        v.button('Clear both', () => { SA = new Set(); SB = new Set(); });
        v.button('Check every parallel reduct', () => {
          if (f.err) return; const t = f.ast, D=limitedParallel(t,new Set(),{all:true});
          if(!D.complete||size(t)>80||redexes(t).length>8){bigRes='Enumeration unavailable: input/development exceeds the finite verification budgets.';return;}
          const pr = parAll(t, 400); let good = 0, unk = 0, bad=0;
          for (const u of pr.list) { const r = parallelMembership(u, D.term); if (r === true) good++; else if (r === null) unk++;else bad++; }
          bigRes = `Enumerated $${pr.list.length}$ parallel reducts${pr.complete?' (complete for this input)':' (capped)'}: $u\\Rightarrow t^{*}$ checked for $${good}$; failed $${bad}$; undecided $${unk}$. This finite check illustrates the lemma.`;
        });
        reset();
        sT.onClick((x) => {
          if (!info || f.err) return; const px = sT.X(x);
          const c = info.reds.filter((r) => px >= r.x0 && px <= r.x1).sort((a, b) => (a.x1 - a.x0) - (b.x1 - b.x0))[0];
          if (c) { const S = which.value === 'A' ? SA : SB; if (S.has(c.p)) S.delete(c.p); else S.add(c.p); v.invalidate(); }
        });
        v.legend([['accent', 'set A / left step'], ['orange', 'set B / right step'], ['green', 'complete development']]);
        let res = null, nodes = [];
        v.render(() => {
          res = null;
          if (f.err) { drawParseError(v, sT, f.src, f.err); sD.textPx('fix the term', sD.W / 2, sD.H / 2, { size: 14, color: 'muted', align: 'center' }); return; }
          const t = f.ast, rs = redexes(t);
          const lay = layoutTerm(t, NICE), d = drawLine(v, sT, lay, sT.W / 2, 40, { size: 21, align: 'center', maxW: sT.W - 40, weight: 600 });
          const lev = (p) => rs.filter((o) => o !== p && o.startsWith(p) && o.length > p.length && (o === p || o[p.length] === '.' || p === '')).length;
          void lev;
          const regs = rs.filter((p) => lay.spans.has(p)).map((p) => { const [a, b] = lay.spans.get(p); return { p, x0: d.xOf(a), x1: d.xOf(b) }; });
          info = { reds: regs };
          const ctx = sT.ctx;
          for (const r of regs) {
            const inA = SA.has(r.p), inB = SB.has(r.p);
            const draw = (col, dy, w) => { ctx.save(); ctx.strokeStyle = v.color(col, 1); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(r.x0, 40 + d.size * 0.78 + dy); ctx.lineTo(r.x1, 40 + d.size * 0.78 + dy); ctx.stroke(); ctx.restore(); };
            if (!inA && !inB) draw('faint', 0, 1.6);
            if (inA) draw('accent', 0, 3.4);
            if (inB) draw('orange', 6, 3.4);
          }
          sT.textPx(rs.length ? `${rs.length} redex${rs.length === 1 ? '' : 'es'} · A has ${SA.size}, B has ${SB.size}` : 'normal form: no redexes', sT.W / 2, 92, { size: 12.5, color: 'muted', weight: 600, align: 'center', halo: false });
          const U=limitedParallel(t,SA),W=limitedParallel(t,SB),D=limitedParallel(t,new Set(),{all:true});
          if(!U.complete||!W.complete||!D.complete){res={cut:true};sD.textPx('Parallel computation stopped at the 1,000-node size budget.',sD.W/2,sD.H/2,{size:14,color:'orange',align:'center'});return;}
          const u=U.term,w=W.term,ts=D.term;
          const pu = parallelMembership(u, ts), pw = parallelMembership(w, ts);
          const du = betaDist(u, ts), dw = betaDist(w, ts);
          res = { pu, pw, du, dw, na: SA.size, nb: SB.size, nr: rs.length };
          nodes = drawDiamond(v, sD, {
            top: { text: show(t, NICE), color: 'ink' }, bottom: { text: show(ts, NICE), color: 'green' },
            left: [{ text: show(u, NICE), color: 'accent' }], right: [{ text: show(w, NICE), color: 'orange' }],
            leftLabels: ['⇒ A', '⇒'], rightLabels: ['⇒ B', '⇒'], region: [0, 0, sD.W, sD.H - 28], topLabel: 't', bottomLabel: 't*',
          });
          const h = ptr(sD) ? hitNodes(nodes, ptr(sD).x, ptr(sD).y) : null;
          if (h && h.full !== h.text) sD.textPx(h.full, sD.W / 2, sD.H - 14, { size: 13, weight: 600, align: 'center', plate: true });
        });
        v.readout(() => {
          if (!res) return 'Fix the term.';
          if(res.cut)return 'The parallel computation exceeded its size budget. No negative theorem verdict follows from this cutoff.';
          const st = (b) => (b === true ? '✓' : b === false ? '✗' : '?');
          const ds = (d) => (d < 0 ? 'not found within depth8/state1200/size200 budgets' : String(d));
          return `$u\\Rightarrow t^{*}$: ${st(res.pu)} in one parallel step (as ordinary $\\beta$-steps: ${ds(res.du)}) · $w\\Rightarrow t^{*}$: ${st(res.pw)} in one parallel step (as ordinary $\\beta$-steps: ${ds(res.dw)}). So after any two parallel steps from $t$ the fork closes with one parallel step each: the diamond property of $\\Rightarrow$.` + (bigRes ? '\n' + bigRes : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'Church–Rosser theorem',
      statement: String.raw`If $t\to_\beta^{*}u_1$ and $t\to_\beta^{*}u_2$ then there is a term $w$ with $u_1\to_\beta^{*}w$ and $u_2\to_\beta^{*}w$. In other words $\to_\beta$ is confluent. Equivalent form: if $u_1=_\beta u_2$ (they are connected by a zigzag of reductions and expansions) then they have a common reduct.`,
      idea: String.raw`Parallel reduction (3.3) has the diamond property, and $\Rightarrow^{*}=\to_\beta^{*}$. A reduction sequence is a chain of parallel steps, so two sequences from $t$ are two edges of a grid: place the sequences along two sides and fill the grid cell by cell, putting at each missing corner the complete development of the corner diagonally opposite. The lemma $u\Rightarrow t^{*}$ for every parallel reduct $u$ of $t$ guarantees that every edge of every cell is a parallel step, so the grid tiles and its far corner is a common reduct. The equivalent form for $=_\beta$ follows by induction on the length of the zigzag.`,
      caption: String.raw`Two reduction sequences from the same term are run with strategies of your choice (sliders pick their lengths); the grid between them is tiled with complete developments. Blue and orange edges are the two sequences, green edges are the tiles added by the proof, each one a parallel step (checked by the tool when the terms are small). Hover a vertex to read its term. The far corner is a term reachable from both sequence ends.`,
      deps: ['pl-3.3'], refs: ['Pierce §5.3'], tags: ['confluence', 'reduction'],
      credit: 'Alonzo Church & J. Barkley Rosser, 1936 (Trans. AMS 39, 472–482); the parallel-reduction tiling is the later Tait–Martin-Löf / Takahashi argument',
      viz(v) {
        const s = pxStage(v, { height: 420, full: true, hover: true, title: 'Filling the grid between two reduction sequences' });
        const EX = { a: '(λx. x x) ((λy. y) ((λz. z) w))', b: '(λx. λy. x y) ((λa. a) b) ((λc. c) d)', c: '(λf. f (f a)) (λx. (λy. y) x)', d: 'S K K ((λa. a) b)' };
        const f = tf(v, 'term', EX.a, () => v.invalidate());
        const ex = v.select('Examples', [{ value: 'a', label: 'duplicating' }, { value: 'b', label: 'two arguments' }, { value: 'c', label: 'nested' }, { value: 'd', label: 'S K K' }], 'a', { onChange: () => f.set(EX[ex.value]) });
        const sa = v.select('Sequence 1', STRATS.map((S) => ({ value: S.id, label: S.short })), 'normal');
        const sb = v.select('Sequence 2', STRATS.map((S) => ({ value: S.id, label: S.short })), 'applicative');
        const kM = v.slider('steps of sequence 1', 1, 5, 3, { step: 1, int: true });
        const kN = v.slider('steps of sequence 2', 1, 5, 3, { step: 1, int: true });
        let grid = null, hov = null;
        v.legend([['accent', 'sequence 1'], ['orange', 'sequence 2'], ['green', 'tiles: complete developments']]);
        v.render(() => {
          grid = null;
          if (f.err) { drawParseError(v, s, f.src, f.err); return; }
          const t0 = f.ast;
          const ra = runStrategy(t0, sa.value, { max: kM.value, maxSize: 90 }), rb = runStrategy(t0, sb.value, { max: kN.value, maxSize: 90 });
          const m = ra.states.length - 1, n = rb.states.length - 1;
          const T = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
          for (let i = 0; i <= m; i++) T[i][0] = ra.states[i];
          for (let j = 0; j <= n; j++) T[0][j] = rb.states[j];
          let trunc = false;
          for (let i = 1; i <= m && !trunc; i++) for (let j = 1; j <= n; j++) { const d = dev(T[i - 1][j - 1]); if (size(d) > 160) { trunc = true; break; } T[i][j] = d; }
          // keep the largest fully computed rectangle
          let mm = m, nn = n;
          if (trunc) { outer: for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) if (!T[i][j]) { mm = i - 1; nn = n; if (mm < 1) { mm = m; nn = j - 1; } break outer; } }
          // vertex positions
          const pad = 56, ext = mm + nn, dyy = Math.min(70, (s.H - 2 * pad - 20) / Math.max(1, ext)), dxx = Math.min(110, (s.W - 2 * pad) / Math.max(1, ext));
          const cx = s.W / 2 + (nn - mm) * dxx / 2;
          const pos = (i, j) => [cx + (i - j) * dxx, pad + (i + j) * dyy];
          const ctx = s.ctx; const edges = [];
          let checked = 0, unchecked = 0, bad = 0;
          for (let i = 0; i <= mm; i++) for (let j = 0; j <= nn; j++) {
            if (i < mm && T[i][j] && T[i + 1][j]) edges.push([i, j, i + 1, j]);
            if (j < nn && T[i][j] && T[i][j + 1]) edges.push([i, j, i, j + 1]);
          }
          for (const [i, j, k, l] of edges) {
            const boundary = (j === 0 && l === 0) || (i === 0 && k === 0);
            let col = 'green', w = 1.5;
            if (j === 0 && l === 0) { col = 'accent'; w = 3; } else if (i === 0 && k === 0) { col = 'orange'; w = 3; }
            if (!boundary) { if (size(T[i][j]) <= 40 && size(T[k][l]) <= 40) { const r = isParallel(T[i][j], T[k][l]); if (r === true) checked++; else if (r === false) bad++; else unchecked++; } else unchecked++; }
            const [x1, y1] = pos(i, j), [x2, y2] = pos(k, l);
            ctx.save(); ctx.strokeStyle = v.color(col, boundary ? 1 : 0.8); ctx.fillStyle = v.color(col, boundary ? 1 : 0.8); ctx.lineWidth = w;
            const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
            ctx.beginPath(); ctx.moveTo(x1 + ux * 7, y1 + uy * 7); ctx.lineTo(x2 - ux * 8, y2 - uy * 8); ctx.stroke();
            const ex = x2 - ux * 8, ey = y2 - uy * 8; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 7 * ux + 3.5 * uy, ey - 7 * uy - 3.5 * ux); ctx.lineTo(ex - 7 * ux - 3.5 * uy, ey - 7 * uy + 3.5 * ux); ctx.closePath(); ctx.fill();
            ctx.restore();
          }
          const ptrP = ptr(s); hov = null; let hb = 18;
          for (let i = 0; i <= mm; i++) for (let j = 0; j <= nn; j++) {
            if (!T[i][j]) continue; const [x, y] = pos(i, j);
            const far = i === mm && j === nn, bd = (i === 0 || j === 0) ? (j === 0 ? 'accent' : 'orange') : 'green';
            if (ptrP) { const dd = Math.hypot(ptrP.x - x, ptrP.y - y); if (dd < hb) { hb = dd; hov = [i, j]; } }
            ctx.save(); ctx.beginPath(); ctx.arc(x, y, far ? 8 : 5.5, 0, 6.2832); ctx.fillStyle = v.color(i === 0 && j === 0 ? 'ink' : far ? 'green' : bd, 1); ctx.fill(); ctx.strokeStyle = v.color('panel', 1); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
          }
          const [tx, ty] = pos(0, 0); s.textPx('t', tx, ty - 16, { size: 14, weight: 700, align: 'center', color: 'ink', math: true });
          const [fx, fy] = pos(mm, nn); s.textPx('common reduct', fx, fy + 20, { size: 12, weight: 700, align: 'center', color: 'green', halo: false });
          if (hov) { const [i, j] = hov; const [x, y] = pos(i, j); ctx.save(); ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.strokeStyle = v.color('gold', 1); ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore(); s.textPx(show(T[i][j], NICE), s.W / 2, s.H - 14, { size: 13, weight: 600, align: 'center', plate: true }); }
          else s.textPx('hover a vertex to read its term', s.W / 2, s.H - 14, { size: 12, color: 'muted', align: 'center', halo: false });
          grid = { m: mm, n: nn, far: T[mm][nn], t0, checked, unchecked, bad, trunc, stepsA: ra.paths.length, stepsB: rb.paths.length, endA: ra.states[mm], endB: rb.states[nn] };
        });
        v.readout(() => {
          if (!grid) return 'Fix the term.';
          const g = grid;
          return `The two sequences have ${g.m} and ${g.n} steps${g.m < kM.value || g.n < kN.value ? ' (one of them reaches a normal form earlier)' : ''}. The ${g.m * g.n} cells are tiled by complete developments; of the green edges, $${g.checked}$ were checked to be parallel steps${g.bad ? ` and **${g.bad} failed**` : ''}${g.unchecked ? `, ${g.unchecked} too large to check` : ''}. Both ends reach the common reduct $${tcode(g.far)}$ (${g.trunc ? 'the grid was cut where terms grow too large' : 'the whole grid'}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Normal forms are unique',
      statement: String.raw`If $t\to_\beta^{*}n_1$ and $t\to_\beta^{*}n_2$ and both $n_1,n_2$ are normal forms, then $n_1\equiv_\alpha n_2$. A term therefore has at most one normal form up to renaming of bound variables, whatever order the redexes are contracted in; and if $t=_\beta n$ with $n$ in normal form, then $t\to_\beta^{*}n$. Caution: the term may still have infinite reduction paths, as $(\lambda x.\,y)\,\Omega$ does.`,
      idea: String.raw`Apply the Church–Rosser theorem (3.4) to the two reductions: they have a common reduct $w$. A normal form has no redex, so it reduces only to itself ($n_1\to^{*}w$ forces $w\equiv n_1$) and likewise $w\equiv n_2$. For the second claim, a zigzag from $t$ to $n$ is rejoined by Church–Rosser at some $w$, and $n\to^{*}w$ forces $w=n$. The proof uses nothing else, so the same statement holds for any confluent system; for a non-confluent one (switch to “textual substitution” below) the conclusion fails.`,
      caption: String.raw`Hundreds of runs reduce the same term, each choosing its redexes at random (or with a bias towards the innermost ones, which can lead to a loop); the bars count where the finished runs ended, and the histogram shows how many steps they took. With correct substitution every finished run ends at one term; the unfinished runs are those cut off by the step limit. Switch the substitution to textual replacement (no renaming of bound variables) on the last example: the single answer splits in two.`,
      scope: String.raw`The bars are an experiment, not a proof: the theorem is the statement for all runs. With “textual substitution” the reduction is the wrong relation (3.3’s substitution lemma fails), which is why the uniqueness fails there.`,
      deps: ['pl-3.4'], refs: ['Pierce §5.3'], tags: ['normal form', 'confluence'],
      viz(v) {
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1.3, minWidth: 340, title: 'Where did the runs end?' });
        const sH = v.stage({ x: [0, 14], y: [0, 1], axes: 'box', gutter: true, height: 250, minWidth: 260, xlabel: 'steps taken', ylabel: 'runs', title: 'How long did they take?' });
        const EX = { m: 'Times 2 2', a: '(λx. x x) ((λy. y) ((λz. z) w))', o: '(λx. y) Omega', c: '(λx. (λy. x) z) y', k: 'S K K ((λa. a) b)' };
        const f = tf(v, 'term', EX.o, () => v.invalidate());
        const ex = v.select('Examples', [{ value: 'a', label: 'duplicating' }, { value: 'm', label: '2 × 2' }, { value: 'k', label: 'S K K a' }, { value: 'o', label: '(λx.y) Ω' }, { value: 'c', label: 'capture trap' }], 'o', { onChange: () => f.set(EX[ex.value]) });
        const subst = v.select('Substitution', [{ value: 'ok', label: 'capture-avoiding' }, { value: 'naive', label: 'textual (no renaming)' }], 'ok');
        const pol = v.select('Choosing redexes', [{ value: 'rand', label: 'uniformly random' }, { value: 'inner', label: 'biased to innermost' }], 'inner');
        const cap = v.slider('step limit', 4, 40, 14, { step: 1, int: true });
        let seed = 7; v.button('Resample', () => { seed += 1; });
        let out = null;
        const contractNaive = (t, p) => { const r = getAt(t, p); return setAt(t, p, naiveSubst(r.f.b, r.f.x, r.a)); };
        const depth = (p) => (p === '' ? 0 : p.split('.').length);
        v.render(() => {
          out = null;
          if (f.err) { drawParseError(v, sB, f.src, f.err); return; }
          const t0 = f.ast, r = v.rng(seed * 131 + 17), RUNS = 400, lim = cap.value;
          const groups = new Map(); let unfinished = 0; const lens = [];
          for (let run = 0; run < RUNS; run++) {
            let t = t0, steps = 0, done = false;
            while (steps < lim) {
              const rs = redexes(t); if (!rs.length) { done = true; break; }
              let p;
              if (pol.value === 'inner' && r() < 0.8) p = rs.reduce((b, c) => (depth(c) >= depth(b) ? c : b));
              else p = rs[Math.floor(r() * rs.length)];
              t = subst.value === 'ok' ? contract(t, p) : contractNaive(t, p); steps++;
              if (size(t) > 220) break;
            }
            if (done) { const k = key(t); if (!groups.has(k)) groups.set(k, { term: t, n: 0 }); groups.get(k).n++; lens.push(steps); } else unfinished++;
          }
          const rows = [...groups.values()].sort((a, b) => b.n - a.n);
          out = { rows, unfinished, RUNS, lens };
          // bars
          const all = rows.map((q) => ({ label: show(q.term, NICE), n: q.n, col: 'green' }));
          if (unfinished) all.push({ label: 'not finished within the limit', n: unfinished, col: 'red' });
          const mx = Math.max(1, ...all.map((q) => q.n)), shown = all.slice(0, 6), rowH = Math.min(54, (sB.H - 24) / Math.max(1, shown.length));
          const left = 14, right = sB.W - 14;
          shown.forEach((q, i) => {
            const top = 10 + i * rowH, by = top + rowH * 0.44, bh = rowH * 0.42, w = (right - left) * q.n / mx * 0.62;
            sB.ctx.save(); sB.ctx.fillStyle = v.color(q.col, 0.28); rrect(sB.ctx, left, by, Math.max(3, w), bh, 5); sB.ctx.fill(); sB.ctx.strokeStyle = v.color(q.col, 1); sB.ctx.lineWidth = 1.5; sB.ctx.stroke(); sB.ctx.restore();
            sB.textPx(String(q.n), left + Math.max(3, w) + 8, by + bh / 2, { size: 13, weight: 700, color: q.col, align: 'left', halo: false });
            sB.textPx(q.label.length > 44 ? q.label.slice(0, 43) + '…' : q.label, left + 2, top + rowH * 0.22, { size: 12.5, weight: 600, color: 'ink', align: 'left', halo: false });
          });
          if (all.length > 6) sB.textPx(`+ ${all.length - 6} more outcomes`, sB.W - 12, sB.H - 10, { size: 11.5, color: 'muted', align: 'right', halo: false });
          // histogram
          const mxLen = Math.max(1, ...lens, 4), counts = Array(mxLen + 1).fill(0); lens.forEach((l) => counts[l]++);
          sH.setView([-0.5, mxLen + 0.5], [0, Math.max(5, Math.max(...counts) * 1.12)]);
          sH.bars(counts, { x0: 0, color: 'accent' });
        });
        v.readout(() => {
          if (!out) return 'Fix the term.';
          const k = out.rows.length;
          const fin = out.RUNS - out.unfinished;
          return `${out.RUNS} runs: **${fin}** finished, **${out.unfinished}** did not within the limit. The finished runs ended in **${k}** distinct normal form${k === 1 ? '' : 's'} (up to renaming)${k === 1 ? ': unique, as the theorem says' : k > 1 ? (subst.value === 'naive' ? ': uniqueness is lost because textual substitution is not β-reduction' : ': more than one — this would contradict the theorem') : ''}.`;
        });
      },
    },
  ],
};
