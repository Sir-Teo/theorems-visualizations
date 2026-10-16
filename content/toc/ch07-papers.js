// Theory of Computation — Chapter 7: landmark paper written early as a flagship item (7.13, Turing 1936).
//
// Verified against the paper (Proc. London Math. Soc. s2-42: 230–265; scan at cs.virginia.edu/~robins):
// §3 example I, "a machine can be constructed to compute the sequence 010101…", m-configurations 𝔟, 𝔠, 𝔢, 𝔣:
//   𝔟 None P0, R → 𝔠;  𝔠 None R → 𝔢;  𝔢 None P1, R → 𝔣;  𝔣 None R → 𝔟   (starts in 𝔟 on a blank tape)
// and the abbreviated table 𝔟: None P0 → 𝔟; 0: R, R, P1 → 𝔟; 1: R, R, P0 → 𝔟 (p. 234).
// §5 standard description: qᵢ → D A…A (i times), Sⱼ → D C…C (j times), blank = S0, 0 = S1, 1 = S2; then A→1, C→2, D→3,
// L→4, R→5, N→6, ;→7. Turing's S.D of machine I is DADDCRDAA;DAADDRDAAA;DAAADDCCRDAAAA;DAAAADDRDA; and a D.N is
// 31332531173113353111731113322531111731111335317 (p. 241); this module recomputes both. "A number which is a
// description number of a circle-free machine will be called a satisfactory number."
// §8: the naive diagonal argument (β with n-th figure 1 − φₙ(n)) and its fallacy; the machine 𝔇 that would mark an S.D
// "s" or "u"; the machine 𝔋 that computes β′ (n-th figure φₙ(n)) section by section with R(N); in section K (its own
// D.N) neither verdict is possible, so 𝔇 cannot exist; then no machine 𝔈 decides whether a machine ever prints 0.

const MC = ['\\mathfrak{b}', '\\mathfrak{c}', '\\mathfrak{e}', '\\mathfrak{f}'];
const TURING_I = [{ p: 0, next: 1 }, { p: -1, next: 2 }, { p: 1, next: 3 }, { p: -1, next: 0 }]; // p: figure printed (−1 none), then R
const SAMPLE = [ // small machines in Turing's standard form (every line scans a blank, prints or not, moves right)
  { name: 'all 0s', rows: [{ p: 0, next: 1 }, { p: -1, next: 0 }] },
  { name: 'all 1s', rows: [{ p: 1, next: 1 }, { p: -1, next: 0 }] },
  { name: '1010…', rows: [{ p: 1, next: 1 }, { p: -1, next: 2 }, { p: 0, next: 3 }, { p: -1, next: 0 }] },
  { name: '001001…', rows: [{ p: 0, next: 1 }, { p: -1, next: 2 }, { p: 0, next: 3 }, { p: -1, next: 4 }, { p: 1, next: 5 }, { p: -1, next: 0 }] },
  { name: 'one 0, then runs on', rows: [{ p: 0, next: 1 }, { p: -1, next: 1 }] },
  { name: 'never prints', rows: [{ p: -1, next: 0 }] },
  { name: '0110 0110…', rows: [{ p: 0, next: 1 }, { p: -1, next: 2 }, { p: 1, next: 3 }, { p: -1, next: 4 }, { p: 1, next: 5 }, { p: -1, next: 6 }, { p: 0, next: 7 }, { p: -1, next: 0 }] },
];
/** Standard description and description number (§5) of a machine whose lines all scan a blank and move right. */
function describe(rows) {
  const q = (i) => 'D' + 'A'.repeat(i + 1), sym = (k) => 'D' + 'C'.repeat(k);
  const sd = rows.map((r, i) => `${q(i)}${sym(0)}${sym(r.p + 1)}R${q(r.next)};`).join('');
  const dn = sd.replace(/[ACDLRN;]/g, (c) => ({ A: '1', C: '2', D: '3', L: '4', R: '5', N: '6', ';': '7' })[c]);
  return { sd, dn };
}
/** Run from m-configuration 0 on a blank tape: figures printed, and whether the machine is circle-free. */
function analyse(rows, nFig = 10) {
  const seen = new Map(), figs = []; let q = 0, t = 0;
  while (!seen.has(q)) { seen.set(q, t); if (rows[q].p >= 0) figs.push(rows[q].p); q = rows[q].next; t++; }
  const start = seen.get(q), order = [...seen.keys()], cycle = order.slice(start);
  const free = cycle.some((c) => rows[c].p >= 0);
  if (free) { let k = start; while (figs.length < nFig) { const c = order[k]; if (rows[c].p >= 0) figs.push(rows[c].p); k = k + 1 >= order.length ? start : k + 1; } }
  return { figs: figs.slice(0, nFig), free };
}
const cmpDN = (a, b) => (a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0);
const sameRows = (a, b) => a.length === b.length && a.every((r, i) => r.p === b[i].p && r.next === b[i].next);

export default {
  collection: 'toc',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Paper',
      name: 'On Computable Numbers',
      paper: { authors: 'A. M. Turing', year: 1936, title: 'On Computable Numbers, with an Application to the Entscheidungsproblem', venue: 'Proceedings of the London Mathematical Society s2-42 (1): 230–265', doi: '10.1112/plms/s2-42.1.230' },
      introduces: ['toc-7.1', 'toc-7.9', 'toc-8.13', 'toc-9.7'],
      statement: String.raw`Turing analysed what a human computer does with pencil and paper and modelled it by a machine with finitely many **m-configurations**, an unbounded tape of squares, and a table that, for each m-configuration and scanned symbol, prescribes what to print, whether to move one square left or right, and the next m-configuration. A real number is **computable** if some such machine, started on a blank tape, prints its binary digits forever ("circle-free"). He showed:

(a) every machine has a finite **standard description** and so a **description number**; the computable numbers are therefore countable, and most real numbers are not computable;

(b) there is a **universal machine** $\mathcal U$ which, given the description of any machine, computes the same sequence;

(c) no machine $\mathcal D$ can decide, for every description number, whether the machine it describes is circle-free, and no machine $\mathcal E$ can decide whether a given machine ever prints 0 (the ancestors of the undecidable halting problem);

(d) consequently Hilbert's **Entscheidungsproblem** has no solution: there is no general process for deciding whether a formula of first-order logic is provable.

The claims rest on the thesis, argued at length in §9, that his machines capture every "purely mechanical" process.`,
      idea: String.raw`Hilbert had asked for a mechanical procedure deciding provability, and Gödel (logic-7.7) had shown in 1931 that arithmetic is incomplete, but nobody had defined "mechanical procedure". Turing's machine (toc-7.1) did, from an analysis of a clerk's finitely many states of mind and symbols. Coding machines as numbers (as Gödel coded formulas) let him enumerate them, so Cantor's diagonal argument (toc-1.5) applies; the naive version seems to show that computable sequences cannot be listed, and Turing's careful version locates the catch in the impossibility of deciding which numbers describe circle-free machines. The universal machine (toc-7.9) is the stored-program computer in principle; computable reals (toc-8.13) began computable analysis; Church reached the same negative answer weeks earlier with the λ-calculus, and Turing's appendix proved the two notions equivalent.`,
      caption: String.raw`**The machine**: step Turing's first example along the tape, one move at a time, with the current line of his table lit; figures go on every other square, as he required. Click a cell of the table (an operation or a final m-configuration) to edit it into another machine; its standard description and description number update below (for Turing's own table they match those printed in §5). **The diagonal argument**: a sample of small machines listed in order of description number, each marked satisfactory or circular, then Turing's §8 argument step by step, with your edited machine in the list.`,
      deps: ['logic-7.7', 'toc-1.5'],
      refs: [],
      tags: ['computability', 'history', 'Turing'],
      credit: 'Turing, 1936',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Turing%27s_proof' },
      viz(v) {
        const part = v.select('part', [{ value: 'm', label: 'the machine' }, { value: 'd', label: 'the diagonal argument' }], 'm', { onChange: () => { abbr.el.hidden = part.value !== 'm'; resetSteps(0); } });
        const abbr = v.toggle('Turing’s abbreviated table', false, { onChange: () => resetSteps(0) });
        let rows = TURING_I.map((r) => ({ ...r }));
        v.button('Turing’s table I', () => { rows = TURING_I.map((r) => ({ ...r })); resetSteps('keep'); });
        const tape = v.stage({ x: [-0.6, 24.6], y: [-1.6, 2.2], axes: false, height: 150, full: true, title: 'the tape' });
        const tab = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 0.85, minWidth: 280, title: 'the table (click a cell to edit)' });
        const dg = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 1.15, minWidth: 330, title: 'machines in order of description number' });
        const NMOVE = 24;
        // ---- machine frames: complete configurations
        function machineFrames() {
          const F = [], sq = new Map(); let pos = 0, q = 0;
          F.push({ sq: new Map(), pos: 0, q: 0, line: null, note: 'The machine starts in m-configuration $\\mathfrak{b}$, scanning a blank square of an empty tape.' });
          for (let k = 0; k < NMOVE; k++) {
            let line, note;
            if (abbr.value) {
              const s = sq.get(pos);
              if (s == null) { sq.set(pos, 0); line = 1; note = 'Scanning a blank: print 0 (and stay).'; }
              else { pos += 2; sq.set(pos, s === 0 ? 1 : 0); line = s === 0 ? 2 : 3; note = `Scanning ${s}: move right twice and print ${s === 0 ? 1 : 0}.`; }
              F.push({ sq: new Map(sq), pos, q: 0, line, note: `Move ${k + 1}: ${note}` });
            } else {
              const r = rows[q]; if (r.p >= 0) sq.set(pos, r.p);
              line = q + 1; note = `in $${MC[q]}$ scanning a blank: ${r.p >= 0 ? `print ${r.p}, ` : ''}move right, go to $${MC[r.next]}$.`;
              pos++; q = r.next;
              F.push({ sq: new Map(sq), pos, q, line, note: `Move ${k + 1}: ${note}` });
            }
          }
          return F;
        }
        // ---- the enumeration (sample + the reader's machine), sorted by D.N
        function enumeration() {
          const list = SAMPLE.map((m) => ({ ...m, mine: sameRows(m.rows, rows) })), turing = sameRows(rows, TURING_I);
          list.push({ name: 'Turing’s I: 0101…', rows: TURING_I, mine: turing });
          if (!list.some((m) => m.mine)) list.push({ name: 'your machine', rows, mine: true });
          for (const m of list) { Object.assign(m, describe(m.rows), analyse(m.rows)); }
          list.sort((a, b) => cmpDN(a.dn, b.dn));
          let n = 0; for (const m of list) m.rank = m.free ? ++n : 0;
          return list;
        }
        function diagFrames() {
          const T = [
            { line: 1, stage: 1, note: 'Every machine has a description number (D.N), so machines can be listed in order of D.N. Here: a sample of small machines in standard form, sorted.' },
            { line: 2, stage: 2, note: 'Mark each D.N **s** (satisfactory: the machine is circle-free and prints figures forever) or **u** (circular: it prints only finitely many). Only the s rows are computable sequences.' },
            { line: 3, stage: 3, note: 'Number the satisfactory machines 1, 2, 3, …, and take the $n$-th figure of the $n$-th one: $\\varphi_n(n)$, the diagonal.' },
            { line: 4, stage: 4, note: 'Naive argument: the sequence $\\beta$ with $n$-th figure $1-\\varphi_n(n)$ differs from every row, so "computable sequences cannot be listed"? Turing: the fallacy is assuming $\\beta$ is computable.' },
            { line: 5, stage: 5, note: 'Computing the list needs a machine $\\mathcal D$ that, given any S.D, decides in finitely many steps whether it is satisfactory. Suppose $\\mathcal D$ exists.' },
            { line: 6, stage: 6, note: 'Then a machine $\\mathcal H$ computes $\\beta\'$ (the diagonal itself): in section $N$ it lets $\\mathcal D$ test $N$; if $N$ is satisfactory, $R(N)=R(N-1)+1$ and the universal machine finds figure $R(N)$ of machine $N$. Every section ends, so $\\mathcal H$ is circle-free.' },
            { line: 7, stage: 7, note: 'Let $K$ be the D.N of $\\mathcal H$. In section $K$, $\\mathcal D$ cannot answer **u** ($\\mathcal H$ is circle-free), nor **s**: $\\mathcal H$ would have to "calculate the first $R(K)$ figures computed by $\\mathcal H$ and write down the $R(K)$-th", a figure that is never found.' },
            { line: 8, stage: 8, note: 'So no machine $\\mathcal D$ exists. Turing then shows that no machine $\\mathcal E$ can decide whether a given machine ever prints 0, and in §11 that the Entscheidungsproblem is unsolvable. In modern form: the **halting problem** is undecidable.' },
          ];
          return T;
        }
        const CODE_M = () => (abbr.value
          ? ['$\\mathfrak{b}$ · scanning None: P0 → $\\mathfrak{b}$', '$\\mathfrak{b}$ · scanning 0: R, R, P1 → $\\mathfrak{b}$', '$\\mathfrak{b}$ · scanning 1: R, R, P0 → $\\mathfrak{b}$']
          : rows.map((r, i) => `$${MC[i]}$ · scanning None: ${r.p >= 0 ? `P${r.p}, R` : 'R'} → $${MC[r.next]}$`));
        const CODE_D = ['list the machines by D.N', 'mark each D.N s (circle-free) or u (circular)', 'diagonal: $\\varphi_n(n)$ for the $n$-th satisfactory machine', '$\\beta$: flip the diagonal ▷ the naive argument', 'suppose a machine $\\mathcal D$ decides s / u', '$\\mathcal H$ = $\\mathcal D$ + $\\mathcal U$ computes $\\beta\'$, section by section', 'section $K$ = D.N of $\\mathcal H$: no verdict possible', 'so no $\\mathcal D$; no $\\mathcal E$ for "ever prints 0"'];
        let S = null;
        const framesFor = () => (part.value === 'm' ? machineFrames() : diagFrames());
        function resetSteps(at) { if (!S) return; S.setCode(part.value === 'm' ? CODE_M() : CODE_D, part.value === 'm' ? (abbr.value ? 'Turing’s abbreviated table' : 'the table: m-config · symbol · operations · final') : 'Turing §8, step by step'); S.reset(framesFor(), { at: at === 'keep' ? Math.min(S.i, part.value === 'm' ? NMOVE : 7) : at }); }
        S = v.steps({ frames: framesFor(), code: part.value === 'm' ? CODE_M() : CODE_D, codeTitle: part.value === 'm' ? 'the table: m-config · symbol · operations · final' : 'Turing §8, step by step', codePos: 'below', start: 9, still: 9, speed: 2 });
        // ---- table editing (standard 4-line table only)
        const ROWY = (i) => 8.0 - i * 1.1, COLS = [0.3, 2.2, 4.2, 7.4, 9.7];
        tab.onClick((x, y) => {
          if (part.value !== 'm' || abbr.value) return;
          const i = Math.round((8.0 - y) / 1.1); if (i < 0 || i >= rows.length || Math.abs(8.0 - i * 1.1 - y) > 0.55) return;
          if (x > COLS[2] && x < COLS[3]) rows[i].p = rows[i].p === 0 ? 1 : rows[i].p === 1 ? -1 : 0;
          else if (x > COLS[3] && x < COLS[4]) rows[i].next = (rows[i].next + 1) % rows.length;
          else return;
          resetSteps('keep');
        });
        v.legend([['accent', 'scanned square / current line', { dot: true }], ['green', 'satisfactory (circle-free)'], ['red', 'circular, or the flipped diagonal'], ['gold', 'diagonal figures φₙ(n)']]);
        let st = null;
        v.render(() => {
          const f = S.frame, isM = part.value === 'm';
          // ---- tape
          const fr = isM ? f : machineFrames()[NMOVE];
          for (let i = 0; i <= 24; i++) {
            const isF = i % 2 === 0, val = fr.sq.get(i);
            tape.rect(i - 0.46, -0.46, i + 0.46, 0.46, { fill: isF ? 'grid' : 'panel', fillAlpha: 1, color: 'faint', width: 1 });
            if (val != null) tape.text(String(val), i, 0, { align: 'center', size: 17, weight: 700, color: 'ink' });
            if (i < 12) tape.text(isF ? 'F' : 'E', i, 0.75, { align: 'center', size: 9.5, color: 'faint' });
          }
          if (isM) {
            tape.rect(fr.pos - 0.5, -0.5, fr.pos + 0.5, 0.5, { color: 'accent', width: 2.6 });
            tape.arrow(fr.pos, -1.35, fr.pos, -0.62, { color: 'accent', width: 2, head: 7 });
            tape.tex(abbr.value ? MC[0] : MC[fr.q], fr.pos, -1.35, { color: 'accent', size: 17, align: 'left', dx: 8 });
          } else tape.corner('the tape of your machine after 24 moves', 'tr', { size: 11.5 });
          const figs = [...fr.sq.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]).join(' ');
          tape.text(`figures so far: ${figs || '—'}`, -0.5, 1.75, { size: 12, weight: 600, color: 'muted' });
          // ---- table
          const D = describe(rows), A = analyse(rows), isT = sameRows(rows, TURING_I);
          const hdr = ['m-config.', 'symbol', 'operations', 'final m-config.'];
          hdr.forEach((h, k) => tab.text(h, COLS[k] + 0.1, 9.2, { size: 11.5, weight: 700, color: 'muted' }));
          tab.line(0.2, 8.7, 9.8, 8.7, { color: 'faint', width: 1 });
          const trows = abbr.value && isM ? [['None', 'P0', 0], ['0', 'R, R, P1', 0], ['1', 'R, R, P0', 0]] : rows.map((r) => ['None', r.p >= 0 ? `P${r.p}, R` : 'R', r.next]);
          trows.forEach(([sym, op, nx], i) => {
            const y = ROWY(i), on = isM && f.line === i + 1;
            if (on) tab.rect(0.15, y - 0.5, 9.85, y + 0.5, { fill: 'accent', fillAlpha: 0.14, stroke: false });
            tab.tex(abbr.value && isM ? MC[0] : MC[i], COLS[0] + 0.5, y, { size: 17, align: 'left' });
            tab.text(sym, COLS[1] + 0.1, y, { size: 13 });
            tab.text(op, COLS[2] + 0.1, y, { size: 13, weight: 600, color: !isT && !(abbr.value && isM) && op !== (TURING_I[i].p >= 0 ? `P${TURING_I[i].p}, R` : 'R') ? 'orange' : 'ink' });
            tab.tex(MC[nx], COLS[3] + 0.6, y, { size: 17, align: 'left', color: !isT && !(abbr.value && isM) && nx !== TURING_I[i].next ? 'orange' : 'ink' });
          });
          // S.D and D.N
          const wrapDN = (s, n) => { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; };
          const y0 = 3.0;
          tab.text(abbr.value && isM ? 'standard description (of table I, in standard form):' : `standard description${isT ? ' (as printed in §5)' : ''}:`, 0.3, y0 + 0.9, { size: 11, weight: 700, color: 'muted' });
          wrapDN(describe(abbr.value && isM ? TURING_I : rows).sd, 36).forEach((ln, k) => tab.text(ln, 0.3, y0 + 0.25 - k * 0.55, { size: 11, color: 'ink' }));
          tab.text(`description number (${describe(abbr.value && isM ? TURING_I : rows).dn.length} digits):`, 0.3, 1.45, { size: 11, weight: 700, color: 'muted' });
          wrapDN(describe(abbr.value && isM ? TURING_I : rows).dn, 36).forEach((ln, k) => tab.text(ln, 0.3, 0.9 - k * 0.55, { size: 11, color: A.free ? 'green' : 'red', weight: 600 }));
          // ---- enumeration table
          const L = enumeration(), stg = isM ? 3 : f.stage, n = L.length;
          const top = 9.3, rh = Math.min(0.9, 7.4 / (n + 2)), cx = (j) => 4.6 + j * 0.62, NF = 8;
          dg.text('machine', 0.15, top, { size: 11, weight: 700, color: 'muted' }); dg.text('D.N', 2.4, top, { size: 11, weight: 700, color: 'muted' });
          if (stg >= 2) dg.text('s/u', 3.85, top, { size: 11, weight: 700, color: 'muted' });
          for (let j = 0; j < NF; j++) dg.text(String(j + 1), cx(j), top, { size: 11, weight: 700, color: 'muted', align: 'center' });
          const diag = [];
          L.forEach((m, k) => {
            const y = top - (k + 1) * rh, dim = stg >= 2 && !m.free;
            if (m.mine) dg.rect(0.05, y - rh / 2, 9.95, y + rh / 2, { fill: 'accent', fillAlpha: 0.1, stroke: false });
            dg.text(m.name.length > 17 ? m.name.slice(0, 16) + '…' : m.name, 0.15, y, { size: 11, color: dim ? 'faint' : 'ink', weight: m.mine ? 700 : 500 });
            dg.text(m.dn.length > 8 ? `${m.dn.slice(0, 4)}…(${m.dn.length})` : m.dn, 2.35, y, { size: 10, color: dim ? 'faint' : 'muted' });
            if (stg >= 2) dg.text(m.free ? 's' : 'u', 4.0, y, { size: 12.5, weight: 700, color: m.free ? 'green' : 'red', align: 'center' });
            for (let j = 0; j < NF; j++) {
              const val = m.figs[j];
              const isDiag = stg >= 3 && m.free && j === m.rank - 1;
              if (isDiag) { dg.rect(cx(j) - 0.27, y - rh * 0.42, cx(j) + 0.27, y + rh * 0.42, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.4 }); diag.push(val); }
              dg.text(val == null ? '·' : String(val), cx(j), y, { size: 12, align: 'center', color: dim ? 'faint' : 'ink', weight: isDiag ? 800 : 500 });
            }
          });
          let yb = top - (n + 1) * rh;
          if (stg >= 4 && stg !== 6) { dg.text(stg >= 5 ? 'β (flipped)' : 'β = 1 − φₙ(n)', 0.15, yb, { size: 11, weight: 700, color: 'red' }); diag.forEach((d, j) => dg.text(String(1 - d), cx(j), yb, { size: 12.5, align: 'center', weight: 800, color: 'red' })); yb -= rh; }
          if (stg >= 6) { dg.text('β′ = φₙ(n), by H', 0.15, yb, { size: 11, weight: 700, color: 'green' }); diag.forEach((d, j) => dg.text(String(d), cx(j), yb, { size: 12.5, align: 'center', weight: 800, color: 'green' })); yb -= rh; }
          if (stg >= 7) {
            const RK = diag.length + 1;
            dg.rect(0.05, yb - rh / 2, 9.95, yb + rh / 2, { fill: 'red', fillAlpha: 0.08, stroke: false });
            dg.text('H itself, D.N = K', 0.15, yb, { size: 11, weight: 700, color: 'red' });
            for (let j = 0; j < NF; j++) dg.text(j < RK - 1 ? String(diag[j]) : j === RK - 1 ? '?' : '', cx(j), yb, { size: j === RK - 1 ? 15 : 12, align: 'center', weight: 800, color: j === RK - 1 ? 'red' : 'muted' });
          }
          if (stg >= 5 && stg <= 7) dg.corner(stg === 5 ? 'suppose D marks every D.N s or u' : stg === 6 ? 'H = D + universal machine U' : 'R(K)-th figure of H: never found', 'br', { size: 11.5, color: stg === 7 ? 'red' : 'muted', weight: 700 });
          if (stg === 8) dg.corner('no machine D · no machine E · no decision procedure', 'br', { size: 11.5, color: 'red', weight: 700 });
          st = { D, A, isT, L };
        });
        v.readout(() => {
          if (!st) return '';
          const { D, A, isT, L } = st;
          const me = L.find((m) => m.mine), sat = L.filter((m) => m.free).length;
          const dnT = '31332531173113353111731113322531111731111335317';
          return `${isT ? '**Turing’s table I**' : '**your machine**'}: ${A.free ? 'circle-free' : 'circular'}, computes ${A.figs.slice(0, 8).join(' ')}${A.free ? ' …' : ' and then nothing more'} · its D.N has ${D.dn.length} digits${isT ? ` and equals the one printed in §5 (${D.dn === dnT ? '✓ digit for digit' : '✗'})` : ''}; it is number ${L.indexOf(me) + 1} of the ${L.length} machines listed, ${sat} of them satisfactory · Turing counted the computable sequences this way: countably many machines, so almost every real number is not computable · today: the same diagonal shows the halting problem undecidable (no program decides, for every program and input, whether it halts), and "computable" means Turing-computable (the Church–Turing thesis)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.14
    // Verified against the report (typeset text, Wiley appendix A, after Godfrey's 1992 edition): §2 the organs CA, CC, M,
    // I, O, R; §11.4 the ten operations of CA: +, −, ×, ÷, √, i, j, s, db, bd (i, j move Ica or Jca to Oca; s "forms" u or
    // v according to the sign of the number held in Oca); §12.2 a standard number is 30 binary digits + sign + 1 digit
    // marking it as a number: 32 = 2⁵ units, a "minor cycle"; §12.7 M = 262,144 = 2¹⁸ units in 256 delay lines (DLA organs,
    // "major cycles") of 1,024 units, i.e. 8,192 minor cycles, 32 per line; τ about a microsecond; §14.3–14.5 orders are
    // obeyed in their natural temporal sequence, CC must wait for a wanted minor cycle to emerge (on average 512 τ);
    // §15.1 i₀ = 0 a number, i₀ = 1 an order; §15.3–15.6 the code: A ← µρ, w → µρ, wh, C ← µρ; final remark: a transfer
    // into a minor cycle holding an order "should clear only its 13 digits representing µρ, and accept the last 13 digits".
    {
      num: '7.14',
      kind: 'Paper',
      name: 'First Draft of a Report on the EDVAC',
      paper: { authors: 'John von Neumann', year: 1945, title: 'First Draft of a Report on the EDVAC',
               venue: 'Moore School of Electrical Engineering, University of Pennsylvania (reprinted in IEEE Annals of the History of Computing 15 (4): 27–75, 1993)', doi: '10.1109/85.238389' },
      introduces: ['tech-11.15'],
      statement: String.raw`Von Neumann described the logical design of an automatic electronic digital computer with five "organs": a central arithmetic part **CA**, a central control **CC**, a **memory M**, and input **I** and output **O** organs connected to an outside recording medium. Its defining features:
(a) **one memory for orders and numbers**: M is divided into 32-digit "minor cycles", each holding either a number (first digit 0) or an order (first digit 1); orders are fetched by CC from M exactly as numbers are fetched by CA;
(b) **sequential control**: CC obeys orders in the order in which they appear in M, unless an order $C\leftarrow\mu\rho$ transfers it elsewhere;
(c) **binary, serial arithmetic** on 30-digit numbers, with ten operations $+,-,\times,\div,\sqrt{}$, two transfers $i,j$, a selection $s$ that picks one of two numbers by a sign (the basis of conditional branching), and decimal conversions;
(d) a memory of $2^{18}$ digits in 256 mercury **delay lines** of 32 minor cycles each, so that access means waiting for the wanted word to circulate past the output.
Because orders are words in M, a program can compute its own orders: a number sent to a minor cycle that holds an order replaces only its 13 address digits. This is the **stored-program architecture** (tech-11.15).`,
      idea: String.raw`ENIAC (1945) was programmed by plugging cables and setting switches, and its few registers held only numbers. Eckert and Mauchly at the Moore School had already planned a successor with a mercury delay-line memory large enough for instructions; von Neumann, a consultant from Los Alamos, wrote up the group's ideas in an abstract, neuron-like notation, in a document circulated in June 1945 under his name alone, which caused a lasting dispute over credit. Logically it is a universal Turing machine (toc-7.9) made practical: a finite control reading instructions from the same tape that holds the data, with random (if slow) access to it. The report fixed the vocabulary and organisation of nearly every computer since: an arithmetic unit, a control unit with a program counter, a single store, input and output, and instruction words with operation and address fields that programs may modify. Its principle that addresses could be computed in place later gave way to index registers, but programs-as-data remains the foundation of compilers, loaders and operating systems (tech-11.14).`,
      caption: String.raw`A toy machine in the report's spirit, small enough to watch: one delay line of 32 minor cycles (the report's major cycle) holding a program and its data, CC with its order, CA with its registers $I_{ca}$, $J_{ca}$, $O_{ca}$. The ring turns as time passes: a word can be read only when it reaches the output head (gold), so the clock counts the wait. **Step** (or play) through the fetch–execute cycle of a program that adds four numbers. It uses the report's own orders: $A\leftarrow\mu\rho$ loads, $w\to\mu\rho$ operates and stores, $wh$ holds the result, $s$ selects, $C\leftarrow\mu\rho$ jumps. The loop advances by **rewriting the address of its own first order** (cell 0) and chooses where to jump by writing into the address of order 12. Our simplification: reading an order as a number yields its address. Switch on **orders are read-only** and the program can no longer move on: it never halts.`,
      deps: ['toc-7.9', 'tech-11.14'],
      refs: [],
      tags: ['computer architecture', 'stored program', 'history'],
      credit: 'John von Neumann (with Eckert, Mauchly and the Moore School group), 1945',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/First_Draft_of_a_Report_on_the_EDVAC' },
      viz(v) {
        const ro = v.toggle('orders are read-only (no address substitution)', false, { onChange: () => S.reset() });
        const dataSel = v.select('data', [{ value: 'a', label: '5, 8, 13, 21' }, { value: 'b', label: '3, 1, 4, 1' }, { value: 'c', label: '12, −7, 30, 2' }], 'a', { onChange: () => S.reset() });
        const DATA = { a: [5, 8, 13, 21], b: [3, 1, 4, 1], c: [12, -7, 30, 2] };
        const O = (op, a) => ({ t: 'O', op, a }), Nn = (x) => ({ t: 'N', v: x });
        const PROG = [O('A←', 24), O('A←', 31), O('+→', 31), O('A←', 20), O('A←', 0), O('+→', 0), O('A←', 0), O('A←', 21), O('−h'), O('A←', 23), O('A←', 22), O('s→', 12), O('C←', 0), O('stop')];
        const CODE = ['cell 0:  A ← 24     load the next number (address changes)', 'cell 1:  A ← 31     load the running sum', 'cell 2:  + → 31     add, store the sum', 'cell 3:  A ← 20     load the constant 1', 'cell 4:  A ← 0      load the address of order 0', 'cell 5:  + → 0      address + 1 into order 0', 'cell 6:  A ← 0      load the new address', 'cell 7:  A ← 21     load the last address, 27', 'cell 8:  − h        27 − address, held in Oca', 'cell 9:  A ← 23     v = 13 (exit)', 'cell 10:  A ← 22     u = 0 (loop)', 'cell 11:  s → 12     u if Oca ≥ 0 else v, into order 12', 'cell 12:  C ← 0      jump (address set by order 11)', 'cell 13:  stop'];
        const txt = (w) => (!w ? '' : w.t === 'N' ? `${w.v}` : w.a == null ? w.op : `${w.op}${w.a}`);
        const build = () => {
          const mem = new Array(32).fill(null); PROG.forEach((w, i) => (mem[i] = { ...w }));
          mem[20] = Nn(1); mem[21] = Nn(27); mem[22] = Nn(0); mem[23] = Nn(13); DATA[dataSel.value].forEach((x, i) => (mem[24 + i] = Nn(x))); mem[31] = Nn(0);
          let T = 0, pc = 0, I = 0, J = 0, Oc = 0, wait = 0, n = 0; const frames = [];
          const snap = (extra) => frames.push({ mem: mem.map((w) => (w ? { ...w } : null)), T, pc, I, J, Oc, wait, n, ...extra });
          const reach = (rho) => { const w = (((rho - T) % 32) + 32) % 32; wait += w; T += w + 1; return w; };
          const valOf = (w) => (w.t === 'N' ? w.v : w.a ?? 0);
          const store = (a, x) => { const w = mem[a]; if (w && w.t === 'O') { if (!ro.value) { mem[a] = { ...w, a: ((x % 32) + 32) % 32 }; return 'sub'; } return 'blocked'; } mem[a] = Nn(x); return 'num'; };
          snap({ phase: 'start', head: 0, line: 1, note: 'The program sits in cells 0–13 of the delay line, the constants in 20–23, four numbers in 24–27, the sum in 31.' });
          for (let guard = 0; guard < 75; guard++) {
            const wF = reach(pc), ord = mem[pc]; n++;
            snap({ phase: 'fetch', head: pc, line: pc + 1, note: `Fetch: CC waits ${wF} minor cycle${wF === 1 ? '' : 's'} for cell ${pc} to reach the head and reads the order **${txt(ord)}**.` });
            let next = pc + 1, note = '', head = pc, changed = -1;
            if (ord.op === 'stop') { snap({ phase: 'halt', head, line: pc + 1, note: `Stop. Cell 31 holds the sum **${mem[31].v}**.`, done: true }); break; }
            if (ord.op === 'A←') { reach(ord.a); J = I; I = valOf(mem[ord.a]); head = ord.a; note = `Execute: wait for cell ${ord.a}; its ${mem[ord.a].t === 'O' ? 'order’s address' : 'number'} ${I} goes into Ica (the old Ica moves to Jca).`; }
            else if (ord.op === '+→') { Oc = I + J; reach(ord.a); const r = store(ord.a, Oc); head = ord.a; changed = ord.a; note = r === 'sub' ? `Execute: Ica + Jca = ${Oc}; cell ${ord.a} holds an order, so only its **address** is replaced: it now reads **${txt(mem[ord.a])}**.` : r === 'blocked' ? `Execute: Ica + Jca = ${Oc}, but orders are read-only: cell ${ord.a} keeps **${txt(mem[ord.a])}**.` : `Execute: Ica + Jca = ${Oc}, stored in cell ${ord.a}.`; }
            else if (ord.op === '−h') { Oc = I - J; note = `Execute: Ica − Jca = ${I} − ${J} = ${Oc}, held in Oca for the selection.`; }
            else if (ord.op === 's→') { const held = Oc, sel = Oc >= 0 ? I : J; reach(ord.a); const r = store(ord.a, sel); Oc = sel; head = ord.a; changed = ord.a; note = `Execute: Oca = ${held} ${held >= 0 ? '≥' : '<'} 0, so the selection gives ${sel} (${sel === I ? 'u: loop again' : 'v: leave the loop'}); ${r === 'sub' ? `order 12 becomes **${txt(mem[12])}**` : r === 'blocked' ? 'but order 12 cannot be changed' : ''}.`; }
            else if (ord.op === 'C←') { next = ord.a; note = `Execute: CC transfers to cell ${ord.a}.`; }
            snap({ phase: 'exec', head, line: pc + 1, note, changed });
            pc = next;
            if (guard === 74) snap({ phase: 'cap', head: pc, line: pc + 1, note: `After ${n} orders the machine is still running: with read-only orders the loop can never advance — it would run for ever.`, done: true, never: true });
          }
          return frames;
        };
        const S = v.steps({ frames: build, code: CODE, codeTitle: 'program (cells 0–13)', speed: 3, still: 60 });
        const St = v.stage({ x: [-1.75, 2.75], y: [-1.3, 1.3], equal: true, axes: false, height: 420, full: true, title: 'M: one delay line of 32 minor cycles · CC · CA' });
        v.render(() => {
          const f = S.frame; if (!f || !f.mem) return;
          const cx = -0.55, R = 1.0, ang = (rho) => (2 * Math.PI * ((((rho - f.T + 1) % 32) + 32) % 32)) / 32;
          St.circle(cx, 0, R, { color: 'faint', width: 10, alpha: 0.5 });
          for (let rho = 0; rho < 32; rho++) {
            const a = ang(rho), x = cx + R * Math.cos(a), y = R * Math.sin(a), w = f.mem[rho], hd = rho === f.head && f.phase !== 'start';
            const col = !w ? 'faint' : w.t === 'O' ? 'blue' : 'orange';
            St.rect(x - 0.105, y - 0.07, x + 0.105, y + 0.07, { fill: hd ? 'gold' : col, fillAlpha: hd ? 0.9 : w ? 0.2 : 0.06, color: rho === f.changed ? 'red' : hd ? 'gold' : col, width: rho === f.changed ? 2.4 : 1, radius: 3 });
            if (w) St.text(txt(w), x, y, { size: 9.5, weight: 700, color: 'ink', align: 'center', halo: false });
            St.text(`${rho}`, cx + (R + 0.17) * Math.cos(a), (R + 0.17) * Math.sin(a), { size: 8.5, color: 'muted', align: 'center' });
          }
          St.poly([[cx + R + 0.3, 0], [cx + R + 0.42, 0.07], [cx + R + 0.42, -0.07]], { fill: 'gold', fillAlpha: 1, color: 'gold' });
          St.text('output head', cx + R + 0.33, 0.16, { size: 10.5, color: 'gold', weight: 700, align: 'center' });
          St.text('the words circulate ↻', cx, 0, { size: 11, color: 'muted', align: 'center' });
          // CC and CA boxes
          const box = (x0, y0, x1, y1, title, col, lit) => { St.rect(x0, y0, x1, y1, { fill: col, fillAlpha: lit ? 0.22 : 0.08, color: col, width: lit ? 2.4 : 1.4, radius: 8 }); St.text(title, x0 + 0.06, y1 - 0.1, { size: 12, weight: 700, color: col, align: 'left' }); };
          const toCC = f.phase === 'fetch', toCA = f.phase === 'exec';
          box(1.0, 0.25, 2.7, 1.15, 'CC  central control', 'blue', toCC);
          St.text(`order counter: cell ${f.pc}`, 1.08, 0.75, { size: 12, align: 'left' });
          St.text(f.phase === 'start' ? '—' : `order: ${txt(f.mem[f.pc]) || '—'}`, 1.08, 0.48, { size: 13, weight: 700, align: 'left', color: 'blue' });
          box(1.0, -1.15, 2.7, 0.1, 'CA  central arithmetic', 'orange', toCA);
          [['Ica', f.I, -0.25], ['Jca', f.J, -0.55], ['Oca', f.Oc, -0.85]].forEach(([nm, val, y]) => { St.text(nm, 1.1, y, { size: 12, align: 'left', color: 'muted' }); St.rect(1.55, y - 0.11, 2.55, y + 0.11, { fill: 'panel', fillAlpha: 1, color: 'orange', width: 1, radius: 4 }); St.text(`${val}`, 2.05, y, { size: 13, weight: 700, align: 'center' }); });
          if (toCC) St.arrow(cx + R + 0.45, 0.05, 1.0, 0.55, { color: 'gold', width: 2.6 });
          if (toCA && f.head !== f.pc) St.arrow(cx + R + 0.45, -0.05, 1.0, -0.45, { color: 'gold', width: 2.6 });
          St.corner(`clock: ${f.T} minor cycles = ${f.T * 32} µs (τ = 1 µs) · ${f.wait} spent waiting`, 'bl', { size: 11.5, color: 'ink', weight: 600 });
        });
        v.legend([['blue', 'order (first digit 1)', { area: true }], ['orange', 'number (first digit 0)', { area: true }], ['gold', 'word at the output head now', { area: true }], ['red', 'cell just rewritten', { area: true }]]);
        v.readout(() => {
          const f = S.frame; if (!f || !f.mem) return '';
          const fin = S.frames[S.frames.length - 1], sum = DATA[dataSel.value].reduce((a, b) => a + b, 0);
          const end = fin.never ? `with read-only orders the machine is still looping after ${fin.n} orders and would never stop` : `the whole run: ${fin.n} orders, ${fin.T} minor cycles (${(fin.T * 32 / 1000).toFixed(2)} ms), ${Math.round((100 * fin.wait) / fin.T)}% of them spent waiting for words to come round; result ${fin.mem[31].v} (= ${sum})`;
          return `order ${f.n} · cell 0 now reads **${txt(f.mem[0])}**, cell 12 **${txt(f.mem[12])}**, the sum so far ${f.mem[31].v} · ${end} · the report's M: 256 such lines of 32 minor cycles, 8,192 words of 32 digits, an average wait of half a line (512 τ) per transfer — which is why it suggested placing operands right after the orders that use them`;
        });
      },
    },
  ],
};
