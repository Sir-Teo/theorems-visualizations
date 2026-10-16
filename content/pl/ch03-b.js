// Programming Languages & Types — Chapter 3: Confluence and normalization (items 3.6–3.10)
import {
  V, L, A, parse, P, DEFS, key, layoutTerm, show, drawLine, redexes, size, runStrategy, normalize, makeGraph, drawGraph, hitBox,
  field, pxStage, drawParseError, rrect, layoutG, drawTreePx, bfs, STRATS, cat, getAt,
  parseCL, layoutCL, clStr, clRedex, clRun, clNormalForm, clKey, clLeaves, bracketSteps, observe, fromLambda, CS, CK, CI, CA,
  TM_LIB, tmSim, tmTerm, fastRun, dev, drawDeriv, findRedex, contract,
} from './ch03.shared.js';

const tf = (v, label, def, onChange, width = 340) => field(v, label, def, (s) => parse(s, DEFS), { width, onChange });
const ptr = (s) => { const p = s.pointer; return p && p.inside ? { x: s.X(p.x), y: s.Y(p.y) } : null; };
const NICE = { abbr: { names: true } };
const ok = (b) => (b ? '✓' : '✗');
const hasRedex = (t) => redexes(t).length > 0;

/** Horizontal bars with a label above each: rows [{label, n, total, col, note}]. */
function drawBars(v, s, rows, o = {}) {
  const rowH = Math.min(o.rowH || 56, (s.H - 20) / Math.max(1, rows.length)), left = 14, right = s.W - 70;
  rows.forEach((q, i) => {
    const top = 8 + i * rowH, by = top + rowH * 0.44, bh = rowH * 0.4, w = Math.max(0, (right - left) * (q.n / Math.max(1, q.total)));
    s.ctx.save();
    s.ctx.fillStyle = v.color('grid', 0.5); rrect(s.ctx, left, by, right - left, bh, 5); s.ctx.fill();
    if (w > 0) { s.ctx.fillStyle = v.color(q.col, 0.4); rrect(s.ctx, left, by, Math.max(4, w), bh, 5); s.ctx.fill(); s.ctx.strokeStyle = v.color(q.col, 1); s.ctx.lineWidth = 1.5; s.ctx.stroke(); }
    s.ctx.restore();
    s.textPx(`${q.n} / ${q.total}`, right + 8, by + bh / 2, { size: 12.5, weight: 700, color: q.col, align: 'left', halo: false });
    s.textPx(q.label, left + 2, top + rowH * 0.2, { size: 12.5, weight: 600, color: 'ink', align: 'left', halo: false });
  });
}

/** Rows of combinator (or mixed) terms: the redex of each row is shaded; the row k is highlighted. */
function drawTraceCL(v, s, run, k, o = {}) {
  const rowH = o.rowH || 30, top = 12, size_ = o.size || 16, total = run.states.length;
  const rows = Math.max(1, Math.floor((s.H - top - 8) / rowH));
  const first = o.all ? Math.max(0, Math.min(k - Math.floor(rows / 2), total - rows)) : Math.max(0, k - rows + 1), last = o.all ? Math.min(total - 1, first + rows - 1) : k;
  for (let i = first; i <= last; i++) {
    const y = top + (i - first) * rowH + rowH / 2, cur = i === k, p = i < run.paths.length ? run.paths[i] : null;
    const lay = layoutCL(run.states[i], { style: (nd, path) => (cur && p !== null && (path === p || path.startsWith(p + '.')) ? 'orange' : undefined) });
    if (cur) { s.ctx.save(); s.ctx.fillStyle = v.color('gold', 0.14); rrect(s.ctx, 4, y - rowH / 2 + 2, s.W - 8, rowH - 4, 6); s.ctx.fill(); s.ctx.restore(); }
    s.textPx(String(i), 30, y, { size: 12.5, color: cur ? 'ink' : 'muted', weight: 700, align: 'right', halo: false });
    drawLine(v, s, lay, 44, y, { size: cur ? size_ : size_ - 1, maxW: s.W - 60, weight: cur ? 600 : 500, color: cur ? 'ink' : 'muted' });
  }
}

export default {
  collection: 'pl',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Theorem', name: 'Standardization: normal order finds normal forms',
      statement: String.raw`**Standardization theorem.** If $t\to_\beta^{*}u$, then there is a *standard* reduction sequence from $t$ to $u$, one that contracts redexes from left to right (no step contracts a redex lying to the left of the redex contracted at an earlier step). **Normalization corollary.** If $t$ has a $\beta$-normal form $n$, then the normal-order (leftmost-outermost) reduction sequence from $t$ is finite and ends in $n$. Strategies that contract an inner redex first, such as call by value or applicative order, need not terminate on such a term.`,
      idea: String.raw`Standardization rearranges any reduction into a left-to-right one without changing its endpoints; its proof needs a careful analysis of how redexes are copied, erased and nested (the original argument of Curry and Feys was later found to have a gap, repaired by Hindley). For the corollary: a term with a normal form reaches it by some sequence, which can be standardized; a standard sequence that ends in a normal form can only have contracted leftmost-outermost redexes, which is exactly the normal-order sequence, so that sequence is finite. By Church–Rosser (3.4) the normal form it ends in is the only one. An argument that is discarded ($(\lambda x.\,y)\,\Omega$) is never touched by normal order but is evaluated first by an eager strategy, which then loops.`,
      caption: String.raw`Left: the reduction graph of a term with three strategies traced on it (colours as in the legend); a strategy that loops goes round a cycle. Choose terms that have a normal form but also a looping path, and one that has no normal form at all (then every strategy fails). Right: the same experiment on random terms. Terms are drawn from a small pool of building blocks (including $\Omega$); for those that have a normal form (found by exhaustive search of their reduction graph) the bars count how many runs of each strategy reach it. Normal order scores every time.`,
      scope: String.raw`Holds for $\beta$-reduction of untyped $\lambda$-terms, reduction anywhere including under $\lambda$. The two weak strategies (call by name, call by value) stop at the first abstraction, so “success” in the bars means the final term has no redex left at all. The random sample is an experiment, not a proof.`,
      deps: ['pl-3.4', 'pl-2.5'], refs: ['Pierce §5.1'], tags: ['standardization', 'evaluation order'],
      credit: 'H. B. Curry & R. Feys, Combinatory Logic I, 1958 (standardization theorem); gap in the proof repaired by R. Hindley, Trans. AMS 241, 1978',
      viz(v) {
        const sG = pxStage(v, { height: 270, minWidth: 380, weight: 1.4, hover: true, title: 'Reachable terms and the strategies' });
        const sB = pxStage(v, { height: 270, minWidth: 300, title: 'Random terms that have a normal form' });
        const EX = { om: '(λx. y) Omega', ki: 'K I Omega', ar: '(λx. x x) ((λa. λb. b) Omega)', sk: 'S K K Omega' };
        const SEL = ['normal', 'applicative', 'value'], ST = SEL.map((id) => STRATS.find((q) => q.id === id));
        let G = null, runs = [], trails = [];
        const MAXK = 12;
        const build = (src) => {
          const r = parse(src, DEFS); if (!r.ast) return;
          G = makeGraph(r.ast, { cap: 26, maxSize: 60 }); G.exploreAll();
          runs = SEL.map((id) => runStrategy(r.ast, id, { max: MAXK, maxSize: 200 }));
          trails = runs.map((run) => { let a = G.add(run.states[0], 0); const ids = [a]; for (let i = 0; i < run.paths.length; i++) { const b = G.add(run.states[i + 1], a.depth + 1); G.addEdge(a, b, run.paths[i]); ids.push(b); a = b; } return ids; });
        };
        const f = tf(v, 'term', EX.om, () => { build(f.src); v.invalidate(); });
        const ex = v.select('Examples', [{ value: 'om', label: '(λx.y) Ω' }, { value: 'ki', label: 'K I Ω' }, { value: 'ar', label: 'Ω inside an argument' }, { value: 'sk', label: 'S K K Ω (no normal form)' }], 'om', { onChange: () => f.set(EX[ex.value]) });
        const kS = v.slider('step', 0, MAXK, 5, { step: 1, int: true });
        let seed = 3, tally = null;
        v.button('New random sample', () => { seed++; tally = null; });
        build(EX.om);
        v.legend(ST.map((S) => [S.color, S.name]));
        const sample = () => {
          const r = v.rng(seed * 77 + 5), atoms = [V('x'), V('y'), V('a'), DEFS.I, DEFS.I, DEFS.K, DEFS.K, DEFS.Omega];
          const rnd = (d) => { if (d === 0 || r() < 0.2) return atoms[Math.floor(r() * atoms.length)]; const u = r(); return u < 0.65 ? A(rnd(d - 1), rnd(d - 1)) : L(r() < 0.5 ? 'x' : 'y', rnd(d - 1)); };
          const stratIds = STRATS.map((q) => q.id), good = Object.fromEntries(stratIds.map((id) => [id, 0]));
          let nf = 0, tries = 0, total = 0;
          while (total < 120 && tries < 2000) {
            tries++; const t = rnd(4); if (size(t) > 30 || !hasRedex(t)) continue; total++;
            const seen = bfs(t, 10, 150, 80); let has = false; for (const e of seen.values()) if (!hasRedex(e.term)) { has = true; break; }
            if (!has) continue; nf++;
            for (const id of stratIds) { const run = runStrategy(t, id, { max: 80, maxSize: 200 }); if (run.status === 'done' && !hasRedex(run.states[run.states.length - 1])) good[id]++; }
          }
          return { nf, total, good };
        };
        v.render(() => {
          if (f.err) { drawParseError(v, sG, f.src, f.err); sB.textPx('fix the term', sB.W / 2, sB.H / 2, { size: 14, color: 'muted', align: 'center' }); return; }
          const k = kS.value, ph = ptr(sG), shown = G.nodes;
          const hn = ph ? hitBox(shown, ph.x, ph.y) : null;
          drawGraph(v, sG, G, shown, G.edges, {
            colorOf: (nd) => (nd.expanded && nd.redexes && !nd.redexes.length ? 'green' : null), faint: () => false, edgeAlpha: () => 0.5, edgeWidth: () => 1.2, edgeColor: () => 'muted',
            region: [0, 4, sG.W, sG.H - (hn ? 34 : 4)], labelOf: (nd) => show(nd.term, NICE),
          });
          const ctx = sG.ctx;
          trails.forEach((tr, i) => {
            const S = ST[i], run = runs[i], upto = Math.min(k, run.paths.length);
            for (let j = 0; j < upto; j++) {
              const a = tr[j], b = tr[j + 1]; ctx.save(); ctx.strokeStyle = v.color(S.color, 1); ctx.fillStyle = v.color(S.color, 1); ctx.lineWidth = 2.6;
              const off = (i - 1) * 4;
              if (a === b) { const cx = a.px + a.pw / 2, cy = a.py, rr2 = 26 + i * 6; ctx.beginPath(); ctx.moveTo(cx - 2, cy - 6); ctx.bezierCurveTo(cx + rr2, cy - 28 - i * 3, cx + rr2, cy + 28 + i * 3, cx - 2, cy + 6); ctx.stroke(); }
              else {
                const dx = b.px - a.px, dy = b.py - a.py, L2 = Math.hypot(dx, dy) || 1, nx = -dy / L2 * off, ny = dx / L2 * off, sgn = dy >= 0 ? 1 : -1, mv = Math.abs(dy) > 1 ? 1 : 0;
                const sx = a.px + nx, sy = a.py + sgn * a.ph / 2 * mv + ny, ex = b.px + nx, ey = b.py - sgn * b.ph / 2 * mv + ny;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
                const ang = Math.atan2(ey - sy, ex - sx); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 8 * Math.cos(ang - 0.45), ey - 8 * Math.sin(ang - 0.45)); ctx.lineTo(ex - 8 * Math.cos(ang + 0.45), ey - 8 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
              }
              ctx.restore();
            }
            const cn = tr[Math.min(k, run.paths.length)];
            ctx.save(); ctx.fillStyle = v.color(S.color, 1); ctx.strokeStyle = v.color('panel', 1); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cn.px - cn.pw / 2 + 5 + i * 10, cn.py - cn.ph / 2 - 2, 4.8, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore();
          });
          if (hn) sG.textPx(show(hn.term, NICE), sG.W / 2, sG.H - 16, { size: 13.5, weight: 600, color: 'ink', align: 'center', plate: true });
          if (!tally) tally = sample();
          const T = tally;
          drawBars(v, sB, STRATS.map((S) => ({ label: S.name, n: T.good[S.id], total: T.nf, col: S.id === 'normal' ? 'green' : S.color })), { rowH: 56 });
          sB.textPx(`${T.nf} of ${T.total} random terms have a normal form`, sB.W / 2, sB.H - 12, { size: 12, color: 'muted', weight: 600, align: 'center', halo: false });
        });
        v.readout(() => {
          if (f.err) return 'Fix the term.';
          const a = runs.map((r, i) => {
            const last = r.states[r.states.length - 1], nfT = r.status === 'done' && !hasRedex(last);
            return `**${ST[i].name}**: ${nfT ? `normal form $\\mathtt{${show(last, NICE).replace(/λ/g, '\\lambda ').replace(/ /g, '\\ ')}}$ in ${r.paths.length} step${r.paths.length === 1 ? '' : 's'}` : r.status === 'done' ? 'stops at a value, redexes remain under λ' : r.status === 'loop' ? 'loops forever' : 'unfinished'}`;
          });
          const nT = tally ? tally.good.normal : 0;
          return a.join(' · ') + (tally ? `\nRandom sample: normal order reached the normal form in ${nT} of ${tally.nf} terms ${nT === tally.nf ? '(all, as the theorem says)' : '(**not all: report!**)'}; applicative order in ${tally.good.applicative}.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Theorem', name: 'Equality and normalization of λ-terms are undecidable',
      statement: String.raw`There is no algorithm that, given a $\lambda$-term $t$, decides whether $t$ has a $\beta$-normal form; and there is none that, given two terms $t,u$, decides whether $t=_\beta u$. The normalization problem is however *semi-decidable*: running normal-order reduction (3.6) halts with a normal form exactly when one exists. Proof by reduction from the halting problem: from a Turing machine $M$ one can compute a closed term $R_M$ such that $R_M\to_\beta^{*}\mathsf{true}$ if $M$ halts on the blank tape and $R_M$ has no normal form (and so is not $\beta$-equal to $\mathsf{true}$) if $M$ never halts.`,
      idea: String.raw`Encode a machine’s configuration (state, tape to the left, scanned cell, tape to the right) as a term, write one transition as a $\lambda$-term (states are selector functions that pick a row of the transition table, symbols are booleans, tapes are lists), and let $R_M$ be the fixed point (2.9) of “if the state is the halting one return $\mathsf{true}$, otherwise recurse on the next configuration”. By the Turing completeness of the $\lambda$-calculus (2.10) this simulation is faithful: each machine step costs a bounded number of $\beta$-steps. If $M$ halts the reduction ends in $\mathsf{true}$; if it never halts the leading redex always reproduces the recursion, so there is no head normal form and hence no normal form. A decider for normal forms, or for $R_M=_\beta\mathsf{true}$ (by 3.5 equivalent to $R_M\to^{*}\mathsf{true}$), would decide halting, contradicting the undecidability of the halting problem (toc-9.7).`,
      caption: String.raw`Pick a Turing machine (five are built in, three halt, two do not). The upper stage replays the machine step by step. The chart plots the size of the compiled $\lambda$-term while it is reduced (call by value, a faster strategy that reaches the same normal form $\mathsf{true}$ when the machine halts); the shaded region lies beyond your step budget. The table shows what a semi-decider with that budget would say about each machine: it can answer “yes, a normal form” but never “no”.`,
      scope: String.raw`The compiled term and its reduction are computed live by the page’s own $\lambda$-calculus reducer, so the counts of $\beta$-steps are the real ones for this particular encoding (a different encoding would give other counts). The four machines other than the 3-state example are small standard examples; the 2-state machine is the known 2-state busy-beaver champion (four 1s in 6 steps) and the 3-state one is the machine with six 1s in 14 steps, both checked by the page’s own simulator. Halting is established for the halting machines only by running them; that the other two never halt is a short argument about their tables, not something the budget can show.`,
      deps: ['pl-2.10', 'pl-3.5', 'pl-3.6', 'toc-9.7', 'toc-10.5'], refs: ['Pierce §5.3'], tags: ['undecidability', 'computability'],
      credit: 'Alonzo Church, 1936 (Amer. J. Math. 58, 345–363); busy-beaver machines: T. Radó, 1962 (Bell System Tech. J. 41)',
      viz(v) {
        const sTape = pxStage(v, { height: 150, full: true, title: 'The machine, replayed' });
        const sPlot = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 270, minWidth: 340, weight: 1.4, xlabel: 'β-step of the λ-term', ylabel: 'term size', title: 'The compiled term, being reduced' });
        const sTab = pxStage(v, { height: 270, minWidth: 320, title: 'Answers of a semi-decider with this budget' });
        const mach = v.select('Machine', TM_LIB.map((m) => ({ value: m.id, label: m.name })), 'bb2', { onChange: () => kS.set(0) });
        const kS = v.slider('machine step', 0, 40, 6, { step: 1, int: true });
        const bud = v.slider('β-step budget', 20, 1500, 300, { step: 10, int: true });
        const cache = {};
        const runOf = (id) => {
          if (cache[id]) return cache[id];
          const m = TM_LIB.find((q) => q.id === id), { term } = tmTerm(m);
          let t = term; const sizes = [size(t)]; let status = 'cap';
          const MAXS = 1500;
          for (let i = 0; i < MAXS; i++) { const p = findRedex(t, 'value'); if (p === null) { status = 'done'; break; } t = contract(t, p); sizes.push(size(t)); if (sizes[sizes.length - 1] > 6000) break; }
          return (cache[id] = { sizes, steps: sizes.length - 1, status, final: t, sim: tmSim(m, 300), m });
        };
        const HALTS = Object.fromEntries(TM_LIB.map((m) => [m.id, m.note.startsWith('never') === false]));
        let cur = null;
        v.legend([['accent', 'term size'], ['green', 'normal form reached'], ['gold', 'budget']]);
        v.render(() => {
          const R = cur = runOf(mach.value), m = R.m, sim = R.sim;
          const k = Math.min(kS.value, sim.snaps.length - 1), sn = sim.snaps[k];
          // tape
          const cells = 15, cw = Math.min(46, (sTape.W - 40) / cells), x0 = (sTape.W - cells * cw) / 2, yC = 72;
          for (let c = 0; c < cells; c++) {
            const idx = sn.head - 7 + c, val = sn.tape.get(idx) || 0, x = x0 + c * cw, cur_ = idx === sn.head;
            sTape.ctx.save(); sTape.ctx.fillStyle = v.color(val ? 'accent' : 'panel', val ? 0.28 : 1); rrect(sTape.ctx, x + 2, yC - cw / 2 + 2, cw - 4, cw - 4, 6); sTape.ctx.fill();
            sTape.ctx.strokeStyle = v.color(cur_ ? 'gold' : 'muted', 1); sTape.ctx.lineWidth = cur_ ? 3 : 1.2; sTape.ctx.stroke(); sTape.ctx.restore();
            sTape.textPx(val ? '1' : '0', x + cw / 2, yC, { size: 16, weight: 700, align: 'center', color: val ? 'ink' : 'muted', halo: false });
          }
          const hx = x0 + 7 * cw + cw / 2;
          sTape.ctx.save(); sTape.ctx.fillStyle = v.color('gold', 1); sTape.ctx.beginPath(); sTape.ctx.moveTo(hx, yC - cw / 2 - 2); sTape.ctx.lineTo(hx - 7, yC - cw / 2 - 15); sTape.ctx.lineTo(hx + 7, yC - cw / 2 - 15); sTape.ctx.closePath(); sTape.ctx.fill(); sTape.ctx.restore();
          const stName = sn.q === m.nst ? 'halt' : 'ABCDEFG'[sn.q];
          sTape.textPx(`state ${stName} · machine step ${k} of ${sim.halted ? sim.steps : '…'}${sim.halted && k === sim.steps ? ' (halted)' : ''}`, sTape.W / 2, 128, { size: 13, weight: 700, color: sn.q === m.nst ? 'green' : 'ink', align: 'center', halo: false });
          // plot
          const xmax = R.status === 'done' ? Math.max(30, R.steps * 1.15) : Math.max(R.steps, bud.value * 1.1, 100);
          const ymax = Math.max(...R.sizes) * 1.12;
          sPlot.setView([0, xmax], [0, ymax]);
          if (bud.value < xmax) sPlot.vband(bud.value, xmax, { color: 'muted', alpha: 0.12 });
          const step = Math.max(1, Math.floor(R.sizes.length / 300)), pts = [];
          for (let i = 0; i < R.sizes.length; i += step) pts.push([i, R.sizes[i]]);
          pts.push([R.sizes.length - 1, R.sizes[R.sizes.length - 1]]);
          sPlot.path(pts, { color: 'accent', width: 2 });
          sPlot.vline(bud.value, { color: 'gold', width: 2 });
          if (R.status === 'done') sPlot.dot(R.steps, R.sizes[R.steps], { color: 'green', r: 6, label: 'true', labelPos: 'ne' });
          // table
          const rows = TM_LIB.map((q) => { const r = runOf(q.id); return { q, r, halts: HALTS[q.id], answered: r.status === 'done' && r.steps <= bud.value }; });
          sTab.textPx('machine', 14, 20, { size: 12, weight: 700, color: 'muted', align: 'left', halo: false });
          sTab.textPx('truth', sTab.W * 0.50, 20, { size: 12, weight: 700, color: 'muted', align: 'left', halo: false });
          sTab.textPx('semi-decider says', sTab.W - 12, 20, { size: 12, weight: 700, color: 'muted', align: 'right', halo: false });
          const rh = (sTab.H - 44) / rows.length;
          rows.forEach((o, i) => {
            const y = 40 + i * rh + rh / 2, sel = o.q.id === mach.value;
            if (sel) { sTab.ctx.save(); sTab.ctx.fillStyle = v.color('gold', 0.14); rrect(sTab.ctx, 4, y - rh / 2 + 3, sTab.W - 8, rh - 6, 6); sTab.ctx.fill(); sTab.ctx.restore(); }
            sTab.textPx(o.q.name, 14, y, { size: 12.5, weight: 600, color: 'ink', align: 'left', halo: false });
            sTab.textPx(o.halts ? `halts (${o.r.sim.steps} step${o.r.sim.steps === 1 ? '' : 's'})` : 'never halts', sTab.W * 0.50, y, { size: 12, weight: 600, color: o.halts ? 'green' : 'red', align: 'left', halo: false });
            sTab.textPx(o.answered ? `yes, after ${o.r.steps}` : 'no answer yet', sTab.W - 12, y, { size: 12.5, weight: 700, color: o.answered ? 'green' : 'muted', align: 'right', halo: false });
          });
        });
        v.readout(() => {
          const R = cur; if (!R) return '';
          const m = R.m, done = R.status === 'done', within = done && R.steps <= bud.value;
          const txt = within ? `**normal form reached after ${R.steps} β-steps** (it is $\\mathsf{true}$), so the machine halts: a certificate` : done ? `the normal form $\\mathsf{true}$ needs ${R.steps} β-steps, more than the budget: the semi-decider has no answer yet` : `no normal form within ${R.steps} β-steps${R.sizes[R.sizes.length - 1] > 6000 ? ' (the term outgrew the page’s size limit)' : ''}: the term keeps rebuilding the recursion, and no budget will ever turn this into a “no”`;
          return `Machine “${m.name}”: ${m.note}; compiled term of size ${R.sizes[0]} nodes. Budget ${bud.value}: ${txt}. The query “$R_M =_\\beta \\mathsf{true}$?” has the same answer as “does $M$ halt?”, and no algorithm answers either for all $M$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Model', name: 'Combinatory logic: S and K',
      statement: String.raw`**Combinatory logic** has terms built from the constants $S$ and $K$ (and, for convenience, $I$), variables and application, with no binders, and the reduction rules $K\,x\,y\to x$, $S\,x\,y\,z\to x\,z\,(y\,z)$, $I\,x\to x$. Reduction is applied anywhere in a term (“weak reduction”: there are no abstractions to reduce under). $I$ is definable: $S\,K\,K\,x\to K\,x\,(K\,x)\to x$, and so is $S\,K\,S$. Every $\lambda$-term can be translated into a combinator term with the same behaviour (3.9), so $S$ and $K$ alone have the computational power of the $\lambda$-calculus.`,
      idea: String.raw`$K$ builds constant functions and $S$ is the “distribute the argument to both” combinator, the two things a $\lambda$-term does with a variable: ignore it or pass it to every place it is used. With these two rules, application is the only syntax left, and substitution has become a fixed wiring diagram. The price is readability and extensionality: $S\,K$ and $K\,I$ both behave as $\lambda x\,y.\,y$ once given two arguments, but they are different normal forms, since weak reduction cannot compare functions that have not been applied.`,
      caption: String.raw`Type a combinator term (capital S, K, I; lower-case variables; no binders) and step it through leftmost-outermost reduction; the redex is shaded in the tree and in the trace. The panel on the right applies two candidate identities to growing argument lists and compares the normal forms: $S\,K\,K$ and $S\,K\,S$ act as the identity on every argument, and $S\,K$ and $K\,I$ agree only from two arguments on.`,
      deps: ['pl-2.4'], refs: ['Pierce §5.2'], tags: ['combinators', 'computation'],
      credit: 'M. Schönfinkel, Math. Annalen 92 (1924; the ideas date from 1920); independently rediscovered by H. B. Curry from 1927, who developed the theory (Amer. J. Math. 52, 1930)',
      viz(v) {
        const sTree = pxStage(v, { height: 230, full: true, hover: true, title: 'The term as a tree; the next redex is shaded' });
        const sTrace = pxStage(v, { height: 250, minWidth: 360, weight: 1.3, title: 'Reduction trace' });
        const sTab = pxStage(v, { height: 250, minWidth: 320, title: 'Applying both sides to a, b, c' });
        const EX = { skk: 'S K K a', b: 'S (K S) K f g x', om: 'S I I (S I I)', lazy: 'K a (S I I (S I I))', sks: 'S K S (K b)', t: 'S (K (S I)) K a f' };
        const parseF = (s) => parseCL(s);
        const f = field(v, 'term', EX.skk, parseF, { width: 320, onChange: () => { run = null; v.invalidate(); } });
        const ex = v.select('Examples', [{ value: 'skk', label: 'S K K a' }, { value: 'b', label: 'composition' }, { value: 'sks', label: 'S K S' }, { value: 'lazy', label: 'K a Ω' }, { value: 'om', label: 'S I I (S I I)' }], 'skk', { onChange: () => f.set(EX[ex.value]) });
        const kS = v.slider('step', 0, 40, 0, { step: 1, int: true });
        const PAIRS = { skk: ['S K K', 'I'], sk: ['S K', 'K I'], sks: ['S K S', 'I'] };
        const pair = v.select('Compare', [{ value: 'skk', label: 'S K K ≟ I' }, { value: 'sks', label: 'S K S ≟ I' }, { value: 'sk', label: 'S K ≟ K I' }], 'skk');
        let run = null;
        v.legend([['accent', 'application'], ['green', 'constant S, K, I'], ['purple', 'variable'], ['orange', 'next redex']]);
        const mkTree = (t, p) => (t.t === 'a' ? { label: '@', path: p, node: t, kids: [mkTree(t.f, cat(p, 'f')), mkTree(t.a, cat(p, 'a'))] } : { label: t.t === 'c' ? t.c : t.x, path: p, node: t, kids: [] });
        v.render(() => {
          if (f.err) { drawParseError(v, sTrace, f.src, f.err); sTree.textPx('fix the term', sTree.W / 2, sTree.H / 2, { size: 14, color: 'muted', align: 'center' }); sTab.textPx('', 0, 0); return; }
          if (!run) run = clRun(f.ast, 60, 400);
          const k = Math.min(kS.value, run.paths.length), t = run.states[k], p = k < run.paths.length ? run.paths[k] : null;
          const Lt = layoutG(mkTree(t, ''));
          const under = (path) => p !== null && (path === p || path.startsWith(p + '.'));
          drawTreePx(v, sTree, Lt, { labelOf: (nd) => nd.n.label, dy: 52, fill: (nd) => (under(nd.n.path) ? 'orange' : nd.n.node.t === 'a' ? 'accent' : nd.n.node.t === 'c' ? 'green' : 'purple'), size: 13 });
          drawTraceCL(v, sTrace, run, k, { all: true });
          sTrace.textPx(k === run.paths.length ? (run.status === 'done' ? 'normal form' : 'stopped (size limit)') : `step ${k} of ${run.paths.length}${run.status === 'cap' ? '+' : ''}`, sTrace.W - 10, sTrace.H - 10, { size: 11.5, color: 'muted', align: 'right', weight: 700 });
          // comparison table
          const [ls, rs] = PAIRS[pair.value], Lp = parseCL(ls).ast, Rp = parseCL(rs).ast;
          const names = ['a', 'b', 'c'];
          sTab.textPx(`${ls}   vs   ${rs}`, sTab.W / 2, 22, { size: 14, weight: 700, color: 'ink', align: 'center', halo: false });
          for (let n = 0; n <= 3; n++) {
            let tl = Lp, tr = Rp; const argTxt = names.slice(0, n).join(' ');
            for (let i = 0; i < n; i++) { tl = CA(tl, { t: 'v', x: names[i] }); tr = CA(tr, { t: 'v', x: names[i] }); }
            const a = clNormalForm(tl), b = clNormalForm(tr), eq = clKey(a.t) === clKey(b.t), y = 56 + n * 46;
            sTab.ctx.save(); sTab.ctx.fillStyle = v.color(eq ? 'green' : 'red', 0.12); rrect(sTab.ctx, 8, y - 19, sTab.W - 16, 38, 8); sTab.ctx.fill(); sTab.ctx.restore();
            sTab.textPx(`applied to ${n ? argTxt : 'nothing'}`, 16, y - 8, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false });
            sTab.textPx(clStr(a.t), 16, y + 8, { size: 13.5, weight: 600, color: 'ink', align: 'left', halo: false });
            sTab.textPx(eq ? '=' : '≠', sTab.W / 2, y + 8, { size: 16, weight: 700, color: eq ? 'green' : 'red', align: 'center', halo: false });
            sTab.textPx(clStr(b.t), sTab.W - 16, y + 8, { size: 13.5, weight: 600, color: 'ink', align: 'right', halo: false });
          }
        });
        v.readout(() => {
          if (f.err || !run) return 'Not a combinator term.';
          const last = run.states[run.states.length - 1], k = Math.min(kS.value, run.paths.length);
          return `${run.paths.length}${run.status === 'done' ? '' : '+'} step${run.paths.length === 1 ? '' : 's'} so far · current term $\\mathtt{${clStr(run.states[k]).replace(/ /g, '\\ ')}}$ (${clLeaves(run.states[k])} leaves)` + (run.status === 'done' ? ` · normal form $\\mathtt{${clStr(last).replace(/ /g, '\\ ')}}$` : ' · no normal form reached within the limit (the term grows or loops)');
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Algorithm', name: 'Bracket abstraction: from λ-terms to SKI',
      statement: String.raw`**Bracket abstraction** $[x]\,M$ removes a variable from a $\lambda$-free combinator term $M$: $[x]\,x=I$; $[x]\,M=K\,M$ if $x$ is not free in $M$; $[x]\,(M\,N)=S\,([x]\,M)\,([x]\,N)$. Translating a $\lambda$-term, innermost abstraction first, replaces $\lambda x.\,M$ by $[x]\,M$, and this yields a term $T$ with no $\lambda$ such that $T\,x_1\cdots x_n$ reduces, in combinatory logic, to the same applicative term as the original $\lambda$-term applied to the same fresh variables. The optional $\eta$-rule $[x]\,(M\,x)=M$ (when $x$ is not free in $M$) shortens the output. The translation can make terms noticeably bigger.`,
      idea: String.raw`$[x]\,M$ is a combinator term $C$ with $C\,x\to M$; the three clauses say how to build it by cases on $M$: a variable $x$ itself is the identity, something not mentioning $x$ is ignored by $K$, and an application $M\,N$ needs $x$ passed to both halves, which is exactly the rule for $S$. Doing the innermost binder first leaves a $\lambda$-free body to apply the clauses to, and each step removes one $\lambda$. Equivalence of the two sides is by induction on $M$ using the $K$ and $S$ rules, and is compared here on fresh arguments, since combinatory logic does not identify functions beyond what they do (3.8).`,
      caption: String.raw`Type a $\lambda$-term (or pick one) and drag “binders eliminated” to watch the abstractions disappear one by one, innermost first. The plot compares the size of the result with and without the $\eta$-shortcut for the family $\lambda x_1\ldots x_n.\,x_n\,x_{n-1}\cdots x_1$, measured by the page’s own translator. The bottom line applies the $\lambda$-term and its translation to the same fresh variables and compares their normal forms.`,
      scope: String.raw`This is the simplest (Curry-style) translation, with only the three clauses and the optional $\eta$-rule; better algorithms (with extra combinators B, C or the optimizations of Turner) produce smaller output and are not shown. The growth numbers in the plot are measurements of this translator, not a stated theorem.`,
      deps: ['pl-3.8'], refs: ['Pierce §5.2'], tags: ['combinators', 'compilation'],
      credit: 'Bracket abstraction comes from the early combinatory logic of Schönfinkel and Curry (who first gave the algorithm was not verified); optimized variant: D. A. Turner, J. Symbolic Logic 44 (1979)',
      verify: true,
      viz(v) {
        const sTr = pxStage(v, { height: 230, full: true, title: 'Eliminating the binders, innermost first' });
        const sPl = v.stage({ x: [1, 8], y: [0, 100], axes: 'box', gutter: true, height: 250, minWidth: 340, weight: 1.2, xlabel: 'number n of abstractions', ylabel: 'leaves in the result', title: 'Size of the translation of λx₁…xₙ. xₙ … x₂ x₁' });
        const sCk = pxStage(v, { height: 250, minWidth: 320, title: 'Do both versions agree?' });
        const EX = { i: 'λx. x', k: 'λx y. x', s: 'λx y z. x z (y z)', c2: 'λf x. f (f x)', plus: 'Plus', sw: 'λx y. y x', t: 'λf. (λx. f (x x)) (λx. f (x x))' };
        let info = null;
        const compute = () => { if (!f.ast) { info = null; return; } const r = bracketSteps(f.ast, eta.value); info = { r }; kS.set(Math.min(kS.value, r.states.length - 1)); };
        const f = tf(v, 'λ-term', EX.s, () => { compute(); v.invalidate(); }, 360);
        const ex = v.select('Examples', [{ value: 's', label: 'S' }, { value: 'k', label: 'K' }, { value: 'i', label: 'I' }, { value: 'sw', label: 'λx y. y x' }, { value: 'c2', label: 'Church 2' }, { value: 'plus', label: 'Plus' }, { value: 't', label: 'Y' }], 's', { onChange: () => f.set(EX[ex.value]) });
        const eta = v.toggle('η-shortcut  [x](M x) = M', false, { onChange: () => { compute(); } });
        const kS = v.slider('binders eliminated', 0, 12, 12, { step: 1, int: true });
        compute(); kS.set(info ? info.r.states.length - 1 : 0);
        const growth = (n, e) => { let body = V('x' + n); for (let i = n - 1; i >= 1; i--) body = A(body, V('x' + i)); let t = body; for (let i = n; i >= 1; i--) t = L('x' + i, t); const st = bracketSteps(t, e); return clLeaves(st.states[st.states.length - 1]); };
        const G0 = [], G1 = []; for (let n = 1; n <= 8; n++) { G0.push([n, growth(n, false)]); G1.push([n, growth(n, true)]); }
        v.legend([['accent', 'Curry translation'], ['green', 'with η-shortcut']]);
        let obs = null;
        v.render(() => {
          if (f.err || !info) { drawParseError(v, sTr, f.src, f.err || { error: 'not a term', pos: 0, len: 1 }); return; }
          const st = info.r.states, k = Math.min(kS.value, st.length - 1);
          drawTraceCL(v, sTr, { states: st, paths: [] }, k, { rowH: 34, size: 17, all: true });
          sTr.textPx(k === st.length - 1 ? 'no λ left: a combinator term' : `${k} of ${st.length - 1} binders eliminated`, sTr.W - 10, sTr.H - 10, { size: 11.5, color: 'muted', align: 'right', weight: 700 });
          sPl.setView([0.7, 8.3], [0, Math.max(...G0.map((q) => q[1])) * 1.1]);
          sPl.path(G0, { color: 'accent', width: 2 }); sPl.dots(G0, { color: 'accent', r: 4 });
          sPl.path(G1, { color: 'green', width: 2 }); sPl.dots(G1, { color: 'green', r: 4 });
          const fin = st[st.length - 1];
          obs = observe(f.ast, fin);
          sCk.textPx('λ-term applied to fresh variables', 14, 24, { size: 12, weight: 700, color: 'muted', align: 'left', halo: false });
          if (!obs) { sCk.textPx('(no λ-free normal form within 4 arguments)', 14, 50, { size: 13, color: 'muted', align: 'left', halo: false }); return; }
          const nm = 'abcd'.slice(0, obs.n).split('').join(' ');
          const row = (y, label, val, col) => { sCk.textPx(label, 14, y, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false }); sCk.textPx(val, 14, y + 20, { size: 15, weight: 600, color: col, align: 'left', halo: false }); };
          row(44, `λ-term ${obs.n ? nm : ''}  →*  (${obs.lamSteps} β-steps)`, obs.lam.replace(/^\((.*)\)$/, '$1'), 'ink');
          row(104, `SKI term ${obs.n ? nm : ''}  →*  (${obs.clSteps} steps)`, (obs.cl || '(no normal form)').replace(/^\((.*)\)$/, '$1'), 'ink');
          const same = obs.cl === obs.lam;
          sCk.textPx(same ? '✓ same result' : '✗ different', sCk.W / 2, 190, { size: 18, weight: 700, color: same ? 'green' : 'red', align: 'center', halo: false });
        });
        v.readout(() => {
          if (f.err || !info) return 'Not a term.';
          const st = info.r.states, fin = st[st.length - 1], lam = f.ast;
          const cnt = (t, c) => (t.t === 'a' ? cnt(t.f, c) + cnt(t.a, c) : t.t === 'c' && t.c === c ? 1 : 0);
          const lv = (t) => (t.t === 'a' ? lv(t.f) + lv(t.a) : t.t === 'l' ? lv(t.b) : 1);
          return `The λ-term has $${lv(fromLambda(lam))}$ variable occurrences; its translation has $${clLeaves(fin)}$ leaves (${cnt(fin, 'S')} S, ${cnt(fin, 'K')} K, ${cnt(fin, 'I')} I, the rest variables), ${info.r.removed.length} abstraction${info.r.removed.length === 1 ? '' : 's'} removed${eta.value ? ', with the η-shortcut' : ''}.` + (obs ? ` Applied to ${obs.n} fresh variable${obs.n === 1 ? '' : 's'}, both reach $\\mathtt{${obs.lam.replace(/ /g, '\\ ')}}$ ${obs.cl === obs.lam ? '✓' : '✗'}.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Paradox', name: 'Curry’s paradox',
      statement: String.raw`Suppose a logic with implication $\to$ (introduction by discharging an assumption, elimination by modus ponens) admits a proposition $C$ that is equal to $C\to Z$, for an arbitrary proposition $Z$. Then $Z$ is provable: assume $C$; since $C=C\to Z$ we may use $C\to Z$, and modus ponens gives $Z$; discharging the assumption proves $C\to Z$, hence $C$; modus ponens again gives $Z$. In the untyped $\lambda$-calculus, read as a calculus of propositions and proofs, such a $C$ exists for every $Z$ by a fixed point: $C=Y\,(\lambda p.\,p\to Z)$ satisfies $C=_\beta(\lambda p.\,p\to Z)\,C=C\to Z$. So an unrestricted $\lambda$-calculus (self-reference without types) cannot serve as a consistent logic.`,
      idea: String.raw`The paradox needs no negation, only implication and self-reference: the proposition “if I am true then $Z$” is true exactly when $Z$ is. As a term, the proof is $(\lambda x.\,x\,x)\,(\lambda x.\,x\,x)$, which is $\Omega$ (2.8): the proof of $Z$ is a program that never produces a value. The fixed-point combinator (2.9) is what turns a self-referential definition into a term. The cure used in typed calculi is to forbid the recursive type or proposition $C=C\to Z$ (4.13): $x\,x$ then has no type, and normalization (4.11) guarantees that proofs are real programs.`,
      caption: String.raw`Choose a proposition $Z$ and a type discipline. With “recursive types allowed” the derivation at the bottom is complete: it proves $Z$ using only the rules for $\to$ and the equation $C = C\to Z$, whichever $Z$ you choose (try “0 = 1”). Switch to “simple types” and the step that applies $x$ to itself is marked as failing: it would need $T = T\to Z$ for a finite type $T$. The slider steps the proof term through reduction: it returns to itself after every step, so it never reaches a value.`,
      scope: String.raw`This is the paradox in its propositions-as-terms (Curry–Howard-style) form for implication-only logic; the proof term is an inhabitant of an arbitrary type $Z$ in a system with the recursive type $C=C\to Z$. The derivation drawn here is the standard argument, assembled by the page; it is not a transcription of Curry’s original formulation.`,
      deps: ['pl-2.9', 'pl-2.8'], refs: ['Pierce §9.4'], tags: ['paradox', 'types as propositions'],
      credit: 'H. B. Curry, 1942 (J. Symbolic Logic 7, 115–117), developed from the Kleene–Rosser paradox of 1935 (Ann. of Math. 36)',
      viz(v) {
        const sD = pxStage(v, { height: 340, full: true, hover: true, title: 'The derivation of Z' });
        const sR = pxStage(v, { height: 150, full: true, title: 'Reducing the proof term' });
        const Z = v.select('Proposition Z', [{ value: 'P', label: 'P (any)' }, { value: '0 = 1', label: '0 = 1' }, { value: 'RH', label: 'Riemann hypothesis' }, { value: '⊥', label: '⊥' }], 'P');
        const mode = v.select('Types', [{ value: 'rec', label: 'recursive types allowed' }, { value: 'simple', label: 'simple types' }], 'rec');
        const kS = v.slider('reduction step', 0, 6, 2, { step: 1, int: true });
        const run = runStrategy(P('Omega'), 'normal', { max: 8, maxSize: 60 });
        const zName = () => (Z.value === 'RH' ? 'RH' : Z.value);
        const leaf = (c) => ({ c, kids: [] });
        const mkTree = () => {
          const z = zName(), simple = mode.value === 'simple';
          const T = simple ? 'T' : 'C';
          const xa = { c: `x : ${T} → ${z}`, rule: simple ? 'would need T = T → ' + z : 'C = C → ' + z, kids: [leaf(`[x : ${T}]¹`)], fail: simple };
          const xx = { c: `x x : ${z}`, rule: '→E', kids: [xa, leaf(`[x : ${T}]¹`)], fail: simple };
          const om = () => ({ c: `ω : ${T} → ${z}`, rule: '→I ¹', kids: [JSON.parse(JSON.stringify(xx))] });
          if (simple) return { c: `ω ω : ${z}`, open: true, rule: '', kids: [om(), { c: 'ω : T', kids: [], fail: true }] };
          return { c: `ω ω : ${z}`, rule: '→E', kids: [om(), { c: 'ω : C', rule: 'C = C → ' + z, kids: [om()] }] };
        };
        let info = null;
        v.render(() => {
          const tree = mkTree(), simple = mode.value === 'simple';
          info = drawDeriv(v, sD, tree, { size: 14, anchor: 'top', color: (n) => (n.fail ? 'red' : 'ink') });
          sD.textPx(simple ? 'x x cannot be typed: no proof of Z is obtained' : `Z = “${zName()}” is derived from nothing: ω = λx. x x`, sD.W / 2, sD.H - 14, { size: 13, weight: 700, color: simple ? 'red' : 'orange', align: 'center', halo: false });
          // reduction
          const k = Math.min(kS.value, run.states.length - 1);
          const lay = layoutTerm(run.states[k], { style: (nd, p) => (p === '' ? 'orange' : undefined) });
          drawLine(v, sR, lay, sR.W / 2, 48, { size: 22, align: 'center', maxW: sR.W - 40, weight: 600 });
          sR.textPx(`after ${k} step${k === 1 ? '' : 's'}: the same term again`, sR.W / 2, 92, { size: 13, weight: 600, color: 'muted', align: 'center', halo: false });
          sR.textPx(simple ? 'not typable, so not a proof in this system' : `a “proof” of ${zName()} that never becomes a value`, sR.W / 2, 122, { size: 13, weight: 700, color: simple ? 'red' : 'orange', align: 'center', halo: false });
        });
        v.readout(() => {
          const z = zName(), simple = mode.value === 'simple';
          return simple
            ? `With simple types the application $x\\,x$ needs a type $T$ with $T=T\\to ${z === '0 = 1' ? '(0=1)' : z === '⊥' ? '\\bot' : z === 'RH' ? '\\mathrm{RH}' : z}$, which no finite type satisfies: the derivation does not go through, and the paradox is blocked.`
            : `Every step is a legal $\\to$-introduction or $\\to$-elimination, or a use of the equation $C=C\\to ${z === '0 = 1' ? '(0=1)' : z === '⊥' ? '\\bot' : z === 'RH' ? '\\mathrm{RH}' : z}$. Nothing about ${z === 'RH' ? 'the Riemann hypothesis' : `“${z}”`} was used, so the same derivation proves **every** proposition, true or false: the logic is inconsistent. The proof term $\\omega\\,\\omega$ is $\\Omega$, whose reduction never ends.`;
        });
      },
    },
  ],
};
