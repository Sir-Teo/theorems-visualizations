// Programming Languages & Types — Chapter 1: Syntax, induction and operational semantics (items 1.7–1.11; 1.1–1.6 in ch01.js)
import {
  mk, kids, size, isVal, eqT, parseNB, segs, str, BASE_RULES, RULE_COLOR, stepsOf, runSmall, step1, termsOfSize, countTerms,
  layoutG, drawTreePx, nbTree, drawSegs, segWidth, drawDeriv, hitDeriv, drawParseError, wrapText, field, pxStage, bigDeriv, bigEval,
  annotate, checkAnnotation, randomTerm, parseImp, parseImpExpr, evalE, eStr, varsOf, cstep, runImp, IMP_RULES, drawProgram, cmdLines,
  denote, fmtN, storeStr,
} from './ch01.shared.js';

const PAL = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue', 'gold'];
const BROKEN_RULES = BASE_RULES.filter((r) => r !== 'E-IszeroZero').concat('E-Loop');

// ---------- 1.7: exhaustive check of the size measure ----------
const sizeCache = new Map();
function sizeCheck(broken, maxSize) {
  const key = `${broken}${maxSize}`; if (sizeCache.has(key)) return sizeCache.get(key);
  let total = 0, bad = 0, cut = 0, longest = 0, slack = Infinity;
  for (let n = 1; n <= maxSize; n++) for (const t of termsOfSize(n)) {
    total++;
    let cur = t, k = 0, mono = true;
    if (!broken) {
      for (let s = step1(cur); s; s = step1(cur)) { if (size(s) >= size(cur)) mono = false; cur = s; k++; }
    } else {
      const run = runSmall(t, BROKEN_RULES, 30);
      k = run.steps.length; if (run.status === 'cut') cut++;
      for (let i = 1; i < run.terms.length; i++) if (size(run.terms[i]) >= size(run.terms[i - 1])) mono = false;
    }
    if (!mono) bad++;
    if (!broken) { longest = Math.max(longest, k); slack = Math.min(slack, size(t) - 1 - k); }
  }
  const r = { total, bad, cut, longest, slack }; sizeCache.set(key, r); return r;
}

// ---------- 1.8/1.9 helpers ----------
const markFail = (d) => { d.fail = !d.ok; d.kids.forEach(markFail); return d; };
function traceLine(t, max = 60) { const s_ = str(t); return s_.length > max ? s_.slice(0, max - 1) + '…' : s_; }
const agreeCache = new Map();
/** Compare big-step and small-step on every term of each size up to N. `broken` removes E-PredZero from the small-step rules. */
function agreement(N, broken) {
  const key = `${N}${broken}`; if (agreeCache.has(key)) return agreeCache.get(key);
  const R = BASE_RULES.filter((r) => !broken || r !== 'E-PredZero');
  const rows = []; let first = null;
  for (let n = 1; n <= N; n++) {
    const r = { n, total: 0, big: 0, small: 0, agree: 0 };
    for (const t of termsOfSize(n)) {
      r.total++;
      const bv = bigEval(t);
      let cur = t;
      if (!broken) for (let s = step1(cur); s; s = step1(cur)) cur = s;
      else for (let ss = stepsOf(cur, R); ss.length; ss = stepsOf(cur, R)) cur = ss[0].to;
      const sv = isVal(cur) ? cur : null;
      if (bv) r.big++;
      if (sv) r.small++;
      if ((!bv && !sv) || (bv && sv && eqT(bv, sv))) r.agree++; else if (!first) first = { t, bv, nf: cur };
    }
    rows.push(r);
  }
  const res = { rows, first }; agreeCache.set(key, res); return res;
}

// ---------- 1.10/1.11: programs ----------
const IMP_PROGS = {
  sum: { label: 'sum 1…n', src: 'x := n; s := 0; while x > 0 do s := s + x; x := x - 1 end', out: 's', pre: 'n >= 0', post: '2 * s == n * (n + 1)', inv: '2 * s == (n - x) * (n + x + 1)' },
  down: { label: 'count down', src: 'x := n; while x != 0 do x := x - 1 end', out: 'x', pre: 'n >= 0', post: 'x == 0', inv: 'x >= 0 && x <= n' },
  bug: { label: 'off by one', src: 'x := n; s := 0; while x > 1 do s := s + x; x := x - 1 end', out: 's', pre: 'n >= 0', post: '2 * s == n * (n + 1)', inv: '2 * s == (n - x) * (n + x + 1)' },
};
const VAR_COLORS = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue'];
/** Draw the store as labelled memory cells in a column. Returns nothing. */
function drawStore(v, s, vars, st, prev, region) {
  const [x0, y0, x1, y1] = region, n = Math.max(1, vars.length), h = Math.min(46, (y1 - y0) / n - 8), ctx = s.ctx;
  vars.forEach((x, i) => {
    const y = y0 + i * (h + 8), ch = prev && (prev[x] ?? 0) !== (st[x] ?? 0);
    const col = ch ? 'gold' : 'muted';
    ctx.save(); ctx.fillStyle = v.color('panel', 1); ctx.fillRect(x0, y, 54, h); ctx.fillStyle = v.color(VAR_COLORS[i % 6], 0.2); ctx.fillRect(x0, y, 54, h);
    ctx.strokeStyle = v.color(VAR_COLORS[i % 6], 1); ctx.lineWidth = 1.6; ctx.strokeRect(x0, y, 54, h); ctx.restore();
    s.textPx(x, x0 + 27, y + h / 2, { size: 15, weight: 700, align: 'center', color: 'ink', halo: false });
    ctx.save(); ctx.fillStyle = v.color(ch ? 'gold' : 'panel', ch ? 0.3 : 1); ctx.fillRect(x0 + 54, y, Math.min(120, x1 - x0 - 54), h); ctx.strokeStyle = v.color(col, 1); ctx.lineWidth = ch ? 2.4 : 1.4; ctx.strokeRect(x0 + 54, y, Math.min(120, x1 - x0 - 54), h); ctx.restore();
    s.textPx(fmtN(st[x] ?? 0), x0 + 54 + 60, y + h / 2, { size: 17, weight: 700, align: 'center', color: 'ink', halo: false });
    if (ch) s.textPx(`was ${fmtN(prev[x] ?? 0)}`, x0 + 54 + 128, y + h / 2, { size: 12, weight: 600, color: 'muted', halo: false });
  });
}

export default {
  collection: 'pl',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Theorem', name: 'Termination of evaluation',
      statement: String.raw`For every term $t$ of $\mathrm{NB}$ there is a normal form $t'$ such that $t\to^* t'$, and in fact every evaluation sequence from $t$ has fewer than $\mathrm{size}(t)$ steps. In particular there is no infinite sequence $t_0\to t_1\to t_2\to\cdots$.`,
      idea: String.raw`Each rule strictly decreases the size of the term: the computation rules replace a term by one of its proper subterms (or by a constant), and a congruence rule shrinks the whole term because its premise shrinks a part (induction on the derivation of the step). A strictly decreasing sequence of positive integers is finite, and starting from $\mathrm{size}(t)$ it cannot have more than $\mathrm{size}(t)-1$ steps. This is the first appearance of a **termination measure**; the argument collapses as soon as a rule can enlarge a term.`,
      caption: String.raw`Twelve random terms are evaluated; each curve is the size of the current term after $k$ steps, each dashed line the bound $\mathrm{size}(t)-k$. Every curve is strictly decreasing and ends at a value (green) or a stuck term (red). Flip **Break it** to replace E-IszeroZero by our extra rule E-Loop ($\mathtt{iszero}\ 0\to\mathtt{if\ true\ then\ iszero\ 0\ else\ 0}$): sizes now go up and down, runs that meet $\mathtt{iszero}\ 0$ never finish (orange, cut at 30 steps), and the proof's measure is gone.`,
      deps: ['pl-1.6'], refs: ['Pierce §3.5'], tags: ['termination', 'measure'],
      viz(v) {
        let ro = ''; v.readout(() => ro);
        const s = v.stage({ x: [0, 14], y: [0, 24], axes: 'box', gutter: true, height: 370, full: true, xlabel: 'evaluation step k', ylabel: 'size of the current term', xticks: null });
        const N = v.slider('typical term size', 6, 30, 16, { step: 1, int: true });
        let seed = 3; v.button('Resample', () => { seed++; });
        const brk = v.toggle('Break it: swap E-IszeroZero for E-Loop', false);
        v.render(() => {
          const R = brk.value ? BROKEN_RULES : BASE_RULES, cap = brk.value ? 30 : 60;
          const r = v.rng(seed * 101 + N.value);
          const runs = [];
          for (let i = 0; i < 12; i++) {
            const t = randomTerm(r, N.value + Math.floor(r() * 7) - 3, 'any', 0.96);
            const run = runSmall(t, R, cap); runs.push({ t, run, sizes: run.terms.map(size) });
          }
          const maxK = Math.max(...runs.map((q) => q.sizes.length - 1)), maxS = Math.max(...runs.map((q) => Math.max(...q.sizes)));
          s.setView([-0.3, Math.max(8, maxK + 1)], [0, maxS + 2]);
          let nonMono = 0, halted = 0;
          runs.forEach((q, i) => {
            const col = PAL[i % PAL.length], s0 = q.sizes[0];
            s.line(0, s0, s0, 0, { color: col, alpha: 0.28, width: 1, dash: true });
            s.path(q.sizes.map((z, k) => [k, z]), { color: col, width: 1.8 });
            s.dots(q.sizes.map((z, k) => [k, z]), { r: 2.6, color: col });
            const e = q.sizes.length - 1, st = q.run.status;
            if (st === 'value') s.dot(e, q.sizes[e], { r: 5.5, color: 'green' });
            else if (st === 'stuck') s.dot(e, q.sizes[e], { r: 5.5, color: 'red', hollow: true, width: 2.4 });
            else s.text('∞', e + 0.25, q.sizes[e], { size: 14, color: 'orange', weight: 800 });
            if (st !== 'cut') halted++;
            for (let k = 1; k < q.sizes.length; k++) if (q.sizes[k] >= q.sizes[k - 1]) { nonMono++; break; }
          });
          const worst = Math.max(...runs.map((q) => q.run.steps.length)), chk = sizeCheck(brk.value, brk.value ? 5 : 7);
          ro = brk.value
            ? `**${halted}** of 12 runs reach a normal form; **${12 - halted}** are cut off after ${cap} steps. In **${nonMono}** runs the size is not strictly decreasing. Exhaustively, among all ${chk.total.toLocaleString('en-US')} terms of size ≤ 5, **${chk.cut}** never finish within 30 steps — the rule E-Loop destroys the termination proof.`
            : `All **${halted}** of 12 runs halt; the longest takes **${worst}** steps, always below the bound size − 1. The size strictly decreases at every step in **${12 - nonMono}** of 12 runs. Exhaustively, over all **${chk.total.toLocaleString('en-US')}** terms of size ≤ 7: the size drops at every step in all but **${chk.bad}** (the longest evaluation takes ${chk.longest} steps, and no run exceeds size − 1).`;
        });
        v.legend([['green', 'ends in a value', { dot: true }], ['red', 'ends stuck', { dot: true }], ['orange', 'cut off (never finishes)', { dot: true }], ['muted', 'dashed: bound size − k', { dash: true }]]);
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Big-step (natural) semantics',
      statement: String.raw`A **big-step semantics** relates a term directly to its final value: $t\Downarrow v$ is defined by the rules B-Value ($v\Downarrow v$), B-IfTrue, B-IfFalse, B-Succ, B-PredZero, B-PredSucc, B-IszeroZero, B-IszeroSucc, which evaluate the immediate subterms and combine their results. A term has a value exactly when $t\Downarrow v$ has a derivation; there is one rule per way of forming a term, and no rule for stuck terms.`,
      idea: String.raw`Where small-step semantics exposes each intermediate state, a big-step derivation is *one* nested proof: the shape of the derivation tree mirrors the shape of the evaluation (the condition of an if is derived first, then only the chosen branch). It is shorter to write and closer to a recursive interpreter, but it only talks about terminating runs: a stuck term (here) or a diverging one (in richer languages) has no derivation, and the semantics cannot tell the two apart. Introduced as *natural semantics* by Kahn, in analogy with natural deduction.`,
      caption: String.raw`Type a term. The left panel is its big-step derivation (rule names at the bars, values green); the right panel lists the small-step run for comparison. Try a stuck term such as $\mathtt{succ\ (iszero\ 0)}$: the derivation breaks off at the red node — no rule can conclude it — while the small-step run stops at a stuck normal form.`,
      deps: ['pl-1.3'], refs: ['Pierce §3.5'], tags: ['big-step', 'natural semantics'],
      credit: 'Kahn, 1987 (natural semantics)',
      viz(v) {
        let ro = ''; v.readout(() => ro);
        const sD = pxStage(v, { height: 380, weight: 2, minWidth: 360, title: 'Big-step derivation  t ⇓ v' });
        const sS = pxStage(v, { height: 380, weight: 1, minWidth: 260, title: 'Small-step run  t → t₁ → …' });
        const EX = { a: 'if iszero (pred 1) then succ succ 0 else pred 3', b: 'pred (succ (pred (succ 0)))', c: 'succ (iszero 0)', d: 'if (if true then false else true) then 0 else succ 0' };
        const f = field(v, 'term', EX.a, parseNB, { width: 420 });
        const pre = v.select('Try', [{ value: 'a', label: 'arithmetic' }, { value: 'b', label: 'nested pred/succ' }, { value: 'c', label: 'stuck' }, { value: 'd', label: 'nested if' }], 'a', { onChange: () => f.set(EX[pre.value]) });
        v.render(() => {
          if (f.err) { drawParseError(v, sD, f.src, f.err); return; }
          const t = f.ast, d = markFail(bigDeriv(t)), run = runSmall(t, BASE_RULES, 60);
          let bad = null; const find = (x) => { if (x.fail && !x.kids.some((k) => k.fail)) bad = x; x.kids.forEach(find); }; find(d);
          drawDeriv(v, sD, d, { size: 13.5, region: [0, 6, sD.W, sD.H - 8], color: (n) => (n.fail ? 'red' : n.rule === 'B-Value' ? 'green' : 'ink'), ring: (n) => (n === d && d.ok ? 'green' : n === bad ? 'red' : null) });
          // small-step column
          const lh = Math.min(30, (sS.H - 20) / (run.terms.length * 1.6));
          let y = 18;
          run.terms.forEach((q, i) => {
            const last = i === run.terms.length - 1, col = last ? (run.status === 'value' ? 'green' : run.status === 'stuck' ? 'red' : 'orange') : 'ink';
            sS.textPx(traceLine(q, Math.floor((sS.W - 50) / 7.4)), 14, y, { size: 13, weight: last ? 700 : 500, color: col, halo: false });
            y += lh * 0.95;
            if (!last) { sS.textPx(`↓ ${run.steps[i].axiom}${run.steps[i].rule !== run.steps[i].axiom ? ' (in context)' : ''}`, 26, y, { size: 10.5, weight: 600, color: RULE_COLOR[run.steps[i].axiom], halo: false }); y += lh * 0.65; }
          });
          const count = (x) => 1 + x.kids.reduce((a, k) => a + count(k), 0), height = (x) => 1 + Math.max(0, ...x.kids.map(height));
          if (d.ok) ro = `Derivation: **${count(d)}** rule applications, height **${height(d)}**, conclusion $t\\Downarrow$ **${str(d.val)}**. Small-step took **${run.steps.length}** steps to reach ${run.status === 'value' ? `**${str(run.terms[run.terms.length - 1])}**` : 'a stuck term'} — ${run.status === 'value' && eqT(run.terms[run.terms.length - 1], d.val) ? 'the same value ✓' : 'a different result ✗'}.`;
          else ro = `**No derivation exists**: ${bad ? `at the red node, ${bad.why}` : 'a subterm has no value'}. Small-step likewise ends after **${run.steps.length}** step${run.steps.length === 1 ? '' : 's'} in a stuck term (**${str(run.terms[run.terms.length - 1])}**).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Theorem', name: 'Small-step and big-step semantics agree',
      statement: String.raw`For every term $t$ and value $v$: $t\Downarrow v$ if and only if $t\to^* v$. Hence a term has a big-step derivation exactly when its small-step evaluation ends in a value, and the two semantics assign the same value; stuck terms have neither.`,
      idea: String.raw`($\Rightarrow$) By induction on the big-step derivation. The key lemma is that steps can be done inside a context: $t\to^* t'$ implies $\mathtt{succ}\,t\to^*\mathtt{succ}\,t'$ (and likewise under $\mathtt{pred}$, $\mathtt{iszero}$ and the condition of $\mathtt{if}$), so the small-step run of a term *contains* the runs of its sub-derivations, in order, separated by one computation step of its own. ($\Leftarrow$) By induction on the length of the run, using that $t\to t'$ and $t'\Downarrow v$ give $t\Downarrow v$. Termination and determinacy then make the value unique.`,
      caption: String.raw`Click a node of the derivation (left): the small-step run (middle) lights up the exact segment of steps that sub-derivation accounts for, with each child derivation in its own colour and the node's own last step in grey; the tool re-checks that the run really passes through the context-wrapped term at the start and at the end of the segment. The table runs **both** semantics on *every* term up to the chosen size. **Break it** deletes E-PredZero from the small-step rules: $\mathtt{pred}\ 0$ becomes stuck while big-step still evaluates it, and the first disagreement appears.`,
      deps: ['pl-1.8', 'pl-1.7'], refs: ['Pierce §3.5'], tags: ['big-step', 'small-step', 'equivalence'],
      viz(v) {
        let ro = ''; v.readout(() => ro);
        const sD = pxStage(v, { height: 340, weight: 2, minWidth: 340, title: 'Big-step derivation (click a node)' });
        const sT = pxStage(v, { height: 340, weight: 1, minWidth: 300, title: 'Small-step run' });
        const sA = pxStage(v, { height: 260, full: true, title: 'Every term up to the size bound' });
        const f = field(v, 'term', 'if iszero (pred 1) then succ pred 2 else 0', parseNB, { width: 380, onChange: () => { sel = null; } });
        const N = v.slider('size bound', 1, 7, 6, { step: 1, int: true });
        const brk = v.toggle('Break it: delete E-PredZero from small-step', false);
        const T = v.table(sA, { rows: 6, cols: 5, square: false, cellAspect: 3.2, maxCell: 70, size: 13, colLabels: ['terms', 't ⇓ v defined', 't →* value', 'stuck (neither)', 'agree'], labelSize: 11.5 });
        let sel = null, info = null;
        sD.onClick((x, y) => { if (!info) return; const n = hitDeriv(info, sD.X(x), sD.Y(y)); if (n && n.ok) sel = n; });
        v.render(() => {
          const A = agreement(N.value, brk.value);
          T.draw({ rows: A.rows.length, cols: 5, rowLabels: A.rows.map((r) => `size ${r.n}`), value: (i, j) => { const r = A.rows[i]; return [r.total, r.big, r.small, r.total - r.big, r.agree][j]; },
            format: (x) => Number(x).toLocaleString('en-US'), fill: (i, j) => { const r = A.rows[i]; return j === 4 ? [r.agree === r.total ? 'green' : 'red', 0.35] : null; } });
          if (f.err) { drawParseError(v, sD, f.src, f.err); return; }
          const t = f.ast, d = markFail(bigDeriv(t)), run = runSmall(t, BASE_RULES, 60);
          if (!d.ok) {
            drawDeriv(v, sD, d, { size: 13.5, region: [0, 6, sD.W, sD.H - 8], color: (n) => (n.fail ? 'red' : 'ink') });
            info = null;
            run.terms.forEach((q, i) => sT.textPx(`${i}  ${traceLine(q, 40)}`, 12, 22 + i * 22, { size: 13, color: i === run.terms.length - 1 ? 'red' : 'ink', halo: false }));
            ro = `**${str(t)}** is stuck: no big-step derivation and the small-step run ends in a stuck term. The semantics agree (neither gives a value).\nExhaustive check up to size ${N.value}: **${A.rows.reduce((a, r) => a + r.agree, 0).toLocaleString('en-US')}** of **${A.rows.reduce((a, r) => a + r.total, 0).toLocaleString('en-US')}** terms agree${A.first ? ` — first disagreement: **${str(A.first.t)}** (big-step: ${A.first.bv ? str(A.first.bv) : 'none'}, small-step normal form: ${str(A.first.nf)})` : ' — no disagreement'}.`;
            return;
          }
          const total = annotate(d, 0, (x) => x);
          const chk = checkAnnotation(d, run.terms);
          if (!sel || !(function has(x) { return x === sel || x.kids.some(has); })(d)) sel = d;
          const cols = sel.kids.map((k, i) => PAL[i % PAL.length]);
          info = drawDeriv(v, sD, d, { size: 13.5, region: [0, 6, sD.W, sD.H - 8], color: (n) => (n.rule === 'B-Value' ? 'green' : 'ink'),
            ring: (n) => (n === sel ? 'gold' : sel.kids.includes(n) ? cols[sel.kids.indexOf(n)] : null) });
          // trace with the selected segment coloured
          const rows = run.terms.length, lh = Math.min(26, (sT.H - 16) / rows);
          run.terms.forEach((q, i) => {
            const y = 16 + i * lh + lh / 2, inSel = i >= sel.start && i < sel.end;
            let col = null;
            if (inSel) { const k = sel.kids.findIndex((c) => i >= c.start && i < c.end); col = k >= 0 ? cols[k] : 'muted'; }
            if (col) { const ctx = sT.ctx; ctx.save(); ctx.fillStyle = v.color(col, 0.22); ctx.fillRect(4, y - lh / 2 + 1, 6, lh - 2); ctx.restore(); }
            sT.textPx(`${i}`, 16, y, { size: 11, color: 'muted', halo: false });
            const parts = segs(q, i === sel.start ? sel.t : null).map((p) => ({ ...p }));
            const w = segWidth(sT, parts, 13), mw = sT.W - 56, sz = w > mw ? 13 * mw / w : 13;
            drawSegs(v, sT, parts, 36, y, { size: Math.max(9, sz), hiColor: 'gold', color: i >= sel.start && i <= sel.end ? 'ink' : 'muted' });
            if (i === sel.end && sel.end !== sel.start) sT.textPx('◂ end', sT.W - 8, y, { size: 10.5, color: 'muted', align: 'right', halo: false });
          });
          const nodeSteps = sel.end - sel.start;
          ro = `Selected: **${sel.c}** — accounts for **${nodeSteps}** step${nodeSteps === 1 ? '' : 's'} (steps ${sel.start + 1}–${sel.end}) of the **${total}**-step small-step run${sel.kids.length ? `: ${sel.kids.map((k, i) => `child ${i + 1} → ${k.end - k.start}`).join(', ')}, plus ${nodeSteps - sel.kids.reduce((a, k) => a + (k.end - k.start), 0)} own` : ''}. Segment check: **${chk.ok}** of ${chk.ok + chk.bad} sub-derivations start and end at the context-wrapped terms of the actual run ${chk.bad ? '✗' : '✓'}.\nExhaustive check up to size ${N.value}: **${A.rows.reduce((a, r) => a + r.agree, 0).toLocaleString('en-US')}** of **${A.rows.reduce((a, r) => a + r.total, 0).toLocaleString('en-US')}** terms agree${A.first ? ` — first disagreement: **${str(A.first.t)}** (big-step: ${A.first.bv ? str(A.first.bv) : 'none'}, small-step normal form: ${str(A.first.nf)})` : ' — no disagreement'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Concept', name: 'Operational, denotational and axiomatic semantics',
      statement: String.raw`There are three classical ways to say what a program means. **Operational** semantics describes how it runs: a sequence of configurations produced by rules. **Denotational** semantics assigns it a mathematical object — for an imperative command, a partial function from initial stores to final stores, built by recursion on the syntax, with loops given by limits of approximations. **Axiomatic** semantics states what is true of it: a Hoare triple $\{P\}\,c\,\{Q\}$ says that if $P$ holds before $c$ and $c$ terminates, then $Q$ holds afterwards. The three are different questions about one program, and for the languages studied here they agree: the final state of a run is the denotation, and it satisfies every triple that is provable.`,
      idea: String.raw`Operational semantics is the specification an implementer follows; denotational semantics compares programs and gives compositional reasoning (the meaning of $c_1;c_2$ is the composite of the meanings); axiomatic semantics is tuned for proofs, replacing the infinite set of stores by assertions and a loop by an invariant. The links between them — the denotation of a loop is the least fixed point of its unrolling, a triple is valid if it holds on every run — are the subjects of chapter 10. Strachey and Scott's mathematical semantics, Floyd's and Hoare's program logics and Plotkin's rules all date from the 1960s–80s.`,
      caption: String.raw`One program, three meanings. **Left:** the operational run, step by step, with the store. **Middle:** the denotation $[\![c]\!]$ drawn as a function of the input $n$ — filled points are where the loop exits within the chosen budget $k$ of unfoldings (the approximants), hollow red points are $\bot$ (undefined); the marker follows the input slider. **Right:** the triple, tested on every input in $-3\dots10$ (green: precondition and postcondition hold, red: the postcondition fails, orange: the program diverges, grey: precondition false) and the loop invariant checked at every iteration of the current run. Edit the assertions, or pick the off-by-one program: the invariant still holds at every iteration, yet the triple fails.`,
      deps: ['pl-1.4'], refs: ['Pierce §3.4'], tags: ['semantics', 'hoare logic', 'denotational'],
      viz(v) {
        let ro = ''; v.readout(() => ro);
        const sO = pxStage(v, { height: 360, minWidth: 300, title: 'Operational: run and store' });
        const sDn = v.stage({ x: [-4, 11], y: [-1, 12], axes: 'box', gutter: true, height: 360, minWidth: 300, title: 'Denotational: ⟦c⟧ as a function of n', xlabel: 'input n', ylabel: 'result', xticks: [-3, 0, 3, 6, 9] });
        const sAx = pxStage(v, { height: 300, minWidth: 300, title: 'Axiomatic: {P} c {Q} and the invariant' });
        const prog = v.select('Program', Object.entries(IMP_PROGS).map(([value, p]) => ({ value, label: p.label })), 'sum', { onChange: () => load() });
        const nSl = v.slider('input n', -2, 9, 4, { step: 1, int: true, onChange: () => S.reset({ at: 'start' }) });
        const kSl = v.slider('loop budget k (approximant)', 0, 12, 12, { step: 1, int: true });
        const mkE = (lab, def) => field(v, lab, def, parseImpExpr, { width: 230, onChange: () => v.invalidate() });
        const preF = mkE('P', IMP_PROGS.sum.pre), postF = mkE('Q', IMP_PROGS.sum.post), invF = mkE('inv', IMP_PROGS.sum.inv);
        const cur = () => IMP_PROGS[prog.value];
        const parsed = () => parseImp(cur().src).ast;
        function load() { preF.set(cur().pre); postF.set(cur().post); invF.set(cur().inv); S.reset({ at: 'start' }); }
        const frames = () => runImp(parsed(), { n: nSl.value }, 200).frames.map((fr, i) => ({ ...fr, i, line: 0, note: fr.rule ? `**${fr.rule}** — ${fr.note}` : 'Start: the store holds only the input n.' }));
        const S = v.steps({ frames, note: true, start: 9, still: 9, speed: 1.3 });
        v.render(() => {
          const p = cur(), c = parsed(), vars = ['n', ...varsOf(c).filter((x) => x !== 'n')], fr = S.frame, prev = S.i > 0 ? S.frames[S.i - 1].st : null;
          // operational panel
          drawProgram(v, sO, fr.c, fr.redex, [0, 8, sO.W * 0.58, sO.H - 8], { lh: 22 });
          drawStore(v, sO, vars, fr.st, prev, [sO.W * 0.58 + 6, 14, sO.W - 8, sO.H - 40]);
          sO.textPx(`step ${S.i} of ${S.n - 1}`, sO.W - 10, sO.H - 16, { align: 'right', size: 12, color: 'muted', halo: false });
          // denotational panel
          const den = denote(c, kSl.value), pts = [], bots = [];
          for (let n = -3; n <= 10; n++) { const o = den({ n }); if (o) pts.push([n, o[p.out] ?? 0]); else bots.push(n); }
          const ymax = Math.max(4, ...pts.map((q) => q[1])) * 1.1, ymin = Math.min(0, ...pts.map((q) => q[1]));
          sDn.setView([-4, 11], [ymin - ymax * 0.1, ymax]);
          sDn.path(pts.filter((q) => q[0] >= -3), { color: 'accent', alpha: 0.35, width: 1.2 });
          sDn.dots(pts, { r: 4.5, color: 'accent' });
          bots.forEach((n) => { sDn.dot(n, ymin - ymax * 0.05, { r: 5, color: 'red', hollow: true, width: 2 }); });
          const here = denote(c, 400)({ n: nSl.value });
          if (here) sDn.dot(nSl.value, here[p.out] ?? 0, { r: 9, color: 'gold', hollow: true, width: 2.6 });
          sDn.text(`⟦c⟧(n).${p.out}`, 10.8, ymax * 0.95, { align: 'right', size: 12.5, color: 'accent', weight: 700 });
          if (bots.length) sDn.text('⊥ = undefined within k unfoldings', 10.8, ymin - ymax * 0.05 + ymax * 0.12, { align: 'right', size: 11, color: 'red' });
          // axiomatic panel
          const P = preF.ast, Q = postF.ast, I = invF.ast;
          const holds = (e, st) => !!evalE(e, st);
          const cells = []; let viol = 0, diverge = 0, ok = 0;
          for (let n = -3; n <= 10; n++) {
            const st0 = { n }, pre = holds(P, st0);
            if (!pre) { cells.push({ n, k: 'na' }); continue; }
            const o = denote(c, 400)(st0);
            if (!o) { cells.push({ n, k: 'div' }); diverge++; continue; }
            if (holds(Q, o)) { cells.push({ n, k: 'ok' }); ok++; } else { cells.push({ n, k: 'bad' }); viol++; }
          }
          const cw = Math.min(36, (sAx.W - 24) / cells.length), ctx = sAx.ctx, X0 = 12, Y0 = 44;
          sAx.textPx(`{ ${eStr(P)} }   c   { ${eStr(Q)} }`, 12, 22, { size: 13, weight: 700, halo: false, color: 'ink' });
          cells.forEach((q, i) => {
            const col = { ok: 'green', bad: 'red', div: 'orange', na: 'faint' }[q.k];
            ctx.save(); ctx.fillStyle = v.color(col, q.k === 'na' ? 0.35 : 0.6); ctx.fillRect(X0 + i * cw + 1, Y0, cw - 2, 30); ctx.restore();
            sAx.textPx(String(q.n).replace('-', '−'), X0 + i * cw + cw / 2, Y0 + 15, { size: 11, weight: 700, align: 'center', halo: false, color: 'ink' });
            if (q.n === nSl.value) { ctx.save(); ctx.strokeStyle = v.color('gold', 1); ctx.lineWidth = 2.6; ctx.strokeRect(X0 + i * cw, Y0 - 2, cw, 34); ctx.restore(); }
          });
          sAx.textPx('initial n:', 12, Y0 + 46, { size: 11, color: 'muted', halo: false });
          sAx.textPx(viol ? `triple FAILS for ${viol} input${viol > 1 ? 's' : ''}` : diverge ? `holds where the program halts (${diverge} diverge: partial correctness)` : 'triple holds on every tested input', 12 + 62, Y0 + 46, { size: 12, weight: 700, color: viol ? 'red' : 'green', halo: false });
          // invariant at each loop test of the current run
          sAx.textPx(`invariant  ${eStr(I)}  at each loop test:`, 12, Y0 + 82, { size: 12.5, weight: 700, halo: false });
          const tests = S.frames.filter((q) => q.rule === 'S-While');
          const shownIter = S.frames.slice(0, S.i + 1).filter((q) => q.rule === 'S-While').length;
          const lines = tests.slice(0, 11);
          let invOk = true;
          lines.forEach((q, i) => {
            const good = holds(I, q.st); if (!good) invOk = false;
            const reached = i < shownIter;
            sAx.textPx(`iteration ${i}:  ${good ? '✓' : '✗'}   ${storeStr(q.st, vars.filter((x) => x !== 'n'))}`, 18, Y0 + 106 + i * 17, { size: 12, weight: reached ? 700 : 500, color: good ? (reached ? 'green' : 'muted') : 'red', halo: false });
          });
          if (tests.length > 11) sAx.textPx(`… ${tests.length - 11} more`, 18, Y0 + 106 + 11 * 17, { size: 11, color: 'muted', halo: false });
          const last = S.frames[S.frames.length - 1], halted = last.c.c === 'skip';
          ro = `Operational: **${S.n - 1}** steps for $n=${nSl.value}$${halted ? `, final store ${storeStr(last.st, vars)}` : ', still running (diverges)'}. Denotational: $[\\![c]\\!](n)$ ${here ? `$= ${fmtN(here[p.out] ?? 0)}$ for ${p.out}` : 'is $\\bot$'} — ${halted && here && last.st[p.out] === here[p.out] ? 'the same as the run ✓' : halted ? 'differs from the run ✗' : 'undefined, matching the divergent run ✓'}. Axiomatic: ${viol ? '**the triple is false**' : '**the triple holds**'} on ${ok} inputs; the invariant ${invOk ? 'holds at every loop test of this run' : '**fails** at some iteration'}.`;
        });
        v.legend([['accent', 'defined: ⟦c⟧(n)', { dot: true }], ['red', '⊥ undefined', { dot: true }], ['gold', 'current input n', { dot: true }]]);
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Model', name: 'A small imperative language',
      statement: String.raw`The language IMP has integer expressions (numerals, variables, $+,-,*$, comparisons and boolean connectives, where $0$ is false) and commands $c ::= \mathtt{skip}\mid x:=e\mid c;c\mid \mathtt{if}\ e\ \mathtt{then}\ c\ \mathtt{else}\ c\ \mathtt{end}\mid \mathtt{while}\ e\ \mathtt{do}\ c\ \mathtt{end}$. A **configuration** is a pair $\langle c,\sigma\rangle$ of a command and a **store** $\sigma$ (a map from variables to integers; unassigned variables read as $0$). The small-step relation $\langle c,\sigma\rangle\to\langle c',\sigma'\rangle$ is given by S-Assign ($\sigma'=\sigma[x\mapsto[\![e]\!]\sigma]$), S-SeqSkip, S-Seq (a step in the first command), S-IfTrue, S-IfFalse and S-While (unfold the loop into an $\mathtt{if}$). A command either reaches $\langle\mathtt{skip},\sigma'\rangle$ or runs forever.`,
      idea: String.raw`Unlike the pure term language of 1.4, evaluation now changes a *state*: the configuration carries the store, and the only rule that writes it is assignment. Sequencing is again a congruence rule, so the redex is always the leftmost unfinished command. Loops need no new machinery — S-While rewrites the loop into a conditional containing a fresh copy of itself, so the program text grows and shrinks as it runs; this is also why a loop can run forever, which was impossible for $\mathrm{NB}$ (termination, 1.7). Every non-$\mathtt{skip}$ configuration can step, so a well-formed command never gets stuck — it halts or diverges.`,
      caption: String.raw`Edit the program (commands separated by ;) or pick one, then step through it: the redex is highlighted in the program text, the memory cells flash the variable that just changed, and the table keeps the recent configurations with the rule that produced each. The last example never halts; the player stops at its step limit.`,
      deps: ['pl-1.4'], refs: ['Pierce §3.4'], tags: ['imperative', 'store', 'configuration'],
      viz(v) {
        let ro = ''; v.readout(() => ro);
        const sP = pxStage(v, { height: 330, minWidth: 300, title: 'Program (next redex highlighted)' });
        const sM = pxStage(v, { height: 330, minWidth: 300, title: 'Store' });
        const sT = pxStage(v, { height: 300, full: true, title: 'Recent configurations' });
        const EX = {
          sum: 'x := 5; s := 0; while x > 0 do s := s + x; x := x - 1 end',
          fact: 'n := 5; f := 1; while n > 1 do f := f * n; n := n - 1 end',
          gcd: 'a := 12; b := 18; while a != b do if a > b then a := a - b else b := b - a end end',
          loop: 'x := 1; while x > 0 do x := x + 1 end',
        };
        const f = field(v, 'program', EX.sum, parseImp, { width: 640, onChange: () => S.reset({ at: 'start' }) });
        const pre = v.select('Try', [{ value: 'sum', label: 'sum' }, { value: 'fact', label: 'factorial' }, { value: 'gcd', label: 'gcd by subtraction' }, { value: 'loop', label: 'never halts' }], 'sum', { onChange: () => f.set(EX[pre.value]) });
        const frames = () => runImp(f.ast, {}, 300).frames.map((fr, i) => ({ ...fr, i, note: fr.rule ? `**${fr.via ? fr.via + ' ∘ ' : ''}${fr.rule}** — ${fr.note}` : 'Start: every variable is 0.' }));
        const S = v.steps({ frames, start: 14, still: 14, speed: 2.5 });
        const T = v.table(sT, { rows: 6, cols: 4, square: false, cellAspect: 3, maxCell: 90, size: 13, labelSize: 11.5 });
        v.render(() => {
          if (f.err) { drawParseError(v, sP, f.src, f.err); return; }
          const fr = S.frame, vars = varsOf(f.ast), prev = S.i > 0 ? S.frames[S.i - 1].st : null;
          drawProgram(v, sP, fr.c, fr.redex, [0, 8, sP.W, sP.H - 8], { lh: 26 });
          if (fr.rule) sP.textPx(IMP_RULES[fr.via || fr.rule] ? '' : '', 10, sP.H - 10, { size: 11, color: 'muted', halo: false });
          drawStore(v, sM, vars, fr.st, prev, [14, 14, sM.W - 10, sM.H - 70]);
          if (fr.rule) {
            wrapText(sM, IMP_RULES[fr.rule], sM.W - 24, 12).forEach((ln, i) => sM.textPx(ln, 14, sM.H - 52 + i * 16, { size: 12, color: 'accent', weight: 600, halo: false }));
          } else sM.textPx('no rule has fired yet', 14, sM.H - 44, { size: 12, color: 'muted', halo: false });
          const from = Math.max(0, S.i - 7), shown = S.frames.slice(from, S.i + 1);
          T.draw({ rows: shown.length, cols: vars.length + 2, colWeights: [0.55, ...vars.map(() => 0.8), 2.2], colLabels: ['step', ...vars, 'rule'],
            rowLabels: null, value: (i, j) => (j === 0 ? from + i : j <= vars.length ? shown[i].st[vars[j - 1]] ?? 0 : shown[i].rule ? `${shown[i].rule}${shown[i].via ? ' (in seq)' : ''}` : '—'),
            fill: (i, j) => { const q = shown[i], pv = i > 0 ? shown[i - 1] : from > 0 ? S.frames[from - 1] : null; if (i === shown.length - 1 && j === 0) return ['gold', 0.4]; return pv && j > 0 && j <= vars.length && (pv.st[vars[j - 1]] ?? 0) !== (q.st[vars[j - 1]] ?? 0) ? ['gold', 0.35] : null; },
            highlight: [[shown.length - 1, 0, 'accent']] });
          const last = S.frames[S.frames.length - 1], halted = last.c.c === 'skip';
          ro = `Step ${S.i} of ${S.n - 1}${halted ? '' : '+'}. Current command: **${fr.c.c === 'skip' ? 'skip (finished)' : cmdLines(fr.c)[0].parts[0].s.replace(/;$/, '')}**. ${S.atEnd ? (halted ? `Halted with ${storeStr(fr.st, vars)}.` : 'Step limit reached: the program has not halted — a loop that never exits.') : ''}`;
        });
      },
    },
  ],
};
