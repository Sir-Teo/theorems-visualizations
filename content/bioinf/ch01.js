// Bioinformatics Algorithms — Chapter 1: Sequences, k-mers and motifs (items 1.1–1.8; 1.9–1.14 in ch01-b.js)
//
// House style for this collection: every picture is computed from REAL sequence where a real sequence exists (accessions
// are in ch01.shared.js and in each caption), with the algorithm run live in the browser; synthetic inputs (planted motifs,
// random text) come from a seeded generator and are labelled as such.
import {
  BASES, BCOL, clamp, commas, mnus, plural, comp, revcomp, cleanDNA, hamming, binom, fixed, log2, hashSeed, rng, randomDNA,
  encode, decode, neighbors, counter, maxWordCount, occurrences, overlaps, meanWait, survival, simulateWaits,
  countMatrix, profileOf, consensusOf, scoreMotifs, medianDistance, columnInfo, bgFromGC, plantedData, lexaData,
  pxer, drawTiles, heatCol, drawLogo, decodeGenome, truthScore, LEXA, CTCF_PFM,
  SEQ_LAC, SEQ_LAMBDA_OR, SEQ_MITO, VC_STRIP, SEQ_LAMBDA_OPS, LAMBDA_OPS_FROM, GENOMES, LAMBDA_SITES,
} from './ch01.shared.js';

export default {
  collection: 'bioinf',
  chapter: 1,
  title: 'Sequences, k-mers and motifs',
  summary: String.raw`Genomes are strings, and simple counting already finds biology: frequent k-mers and GC skew locate where replication begins. Statistical surprise must be judged carefully, because overlapping words behave counter-intuitively. Regulatory motifs are captured by profiles whose information content is drawn as a sequence logo. Finding motifs is hard, so greedy, randomized, Gibbs-sampling and EM searches trade exactness for speed. Two founding papers frame the chapter: the double helix, whose pairing rule makes a sequence and its reverse complement the same information, and the Meselson–Stahl experiment that showed how that information is copied.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'DNA strings, reverse complements and k-mers',
      statement: String.raw`A DNA molecule is read as a string over $\{A,C,G,T\}$. Its two strands are antiparallel and pair by $A\!-\!T$, $C\!-\!G$, so the information in one strand $x=x_1\cdots x_n$ (read $5'\to3'$) is exactly the information in the other, which read $5'\to3'$ is the **reverse complement** $\overline{x}=\bar x_n\cdots\bar x_1$, where $\bar A=T,\ \bar C=G,\ \bar G=C,\ \bar T=A$. Reverse complementing twice returns $x$, and $\overline{xy}=\overline{y}\,\overline{x}$.

A **$k$-mer** is a string of length $k$. A string of length $n$ contains $n-k+1$ windows (counted with multiplicity) drawn from the $4^k$ possible $k$-mers. A $k$-mer that equals its own reverse complement (a *palindrome* in the biological sense) exists only for even $k$, and there are exactly $4^{k/2}$ of them.`,
      idea: String.raw`Because a protein can bind either strand, a word and its reverse complement are the same biological object, which is why the counting in the next items merges them. The window count $n-k+1$ comes from sliding a frame one letter at a time; the palindrome count comes from choosing the first half freely and letting the second half be forced.`,
      caption: String.raw`**Pick a real sequence** (E. coli *lac* control region, phage λ, the start of human mtDNA, the *V. cholerae* origin) or type your own. The window of width $k$ slides with the slider or a click on the strand; the complementary strand sits underneath (antiparallel, so it runs $3'\to5'$ left to right), and the readout gives the window's reverse complement. The bars count every $k$-mer in the whole sequence; switch on *merge reverse complements* and each word is counted together with its partner.`,
      deps: [],
      refs: ['Compeau–Pevzner ch. 1'],
      tags: ['dna', 'k-mers', 'strings'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Complementarity_(molecular_biology)' },
      viz(v) {
        let renderState = null;
        const PRE = {
          lac: { label: 'lac control region', seq: SEQ_LAC, src: 'E. coli lac operon, ENA J01636.1:1131–1330' },
          lambda: { label: 'phage λ OR', seq: SEQ_LAMBDA_OR, src: 'phage λ, NC_001416.1:37931–38130' },
          mito: { label: 'human mtDNA', seq: SEQ_MITO, src: 'human mitochondrion, NC_012920.1:1–200' },
          vc: { label: 'V. cholerae ori', seq: VC_STRIP.slice(5000, 5200), src: 'V. cholerae chromosome I, NC_002505.1:1–200' },
        };
        let loading = false;
        const preset = v.select('sequence', [...Object.entries(PRE).map(([value, p]) => ({ value, label: p.label })), { value: 'own', label: 'typed' }], 'lac', {
          onChange: (val) => { if (val !== 'own') { loading = true; inp.set(PRE[val].seq); loading = false; pos.set(Math.min(pos.value, Math.max(0, PRE[val].seq.length - kS.value))); } },
        });
        const inp = v.input('DNA', PRE.lac.seq, { width: 300, onChange: () => { if (!loading) preset.set('own'); } });
        const kS = v.slider('$k$', 1, 8, 4, { int: true });
        const pos = v.slider('window position', 0, 199, 12, { int: true });
        const merge = v.toggle('merge reverse complements', false);
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 214, full: true });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: 'the ten most frequent $k$-mers in the whole sequence' });
        const seqNow = () => cleanDNA(inp.value, 2000) || 'A';
        let cw = 18, off = 0, cols = 30;
        sA.onClick((x, y) => { const n = seqNow(), j = Math.floor((sA.X(x) - 44) / cw) + off - Math.floor(kS.value / 2); if (sA.X(x) > 44) pos.set(clamp(j, 0, Math.max(0, n.length - kS.value))); });
        v.render(() => {
          const x = seqNow(), n = x.length, k = Math.min(kS.value, n), W = sA.width;
          pos.input.max = String(Math.max(0, n - k)); const p = clamp(pos.value, 0, Math.max(0, n - k));
          // ---- strands
          const P = pxer(v, sA);
          cw = clamp(Math.floor((W - 70) / Math.min(n, 44)), 11, 22); cols = Math.floor((W - 70) / cw);
          off = clamp(p - Math.floor((cols - k) / 2), 0, Math.max(0, n - cols));
          const ch = Math.min(30, cw + 8), y1 = 40, y2 = y1 + ch + 22, vis = x.slice(off, off + cols), x0 = 44;
          P.text("5′", 14, y1 + ch / 2, { size: 13, weight: 700, color: 'muted', align: 'center' }); P.text("3′", W - 14, y1 + ch / 2, { size: 13, weight: 700, color: 'muted', align: 'center' });
          P.text("3′", 14, y2 + ch / 2, { size: 13, weight: 700, color: 'muted', align: 'center' }); P.text("5′", W - 14, y2 + ch / 2, { size: 13, weight: 700, color: 'muted', align: 'center' });
          const inWin = (i) => off + i >= p && off + i < p + k;
          drawTiles(P, vis, x0, y1, cw, ch, { dim: (i) => !inWin(i) });
          drawTiles(P, comp(vis), x0, y2, cw, ch, { dim: (i) => !inWin(i) });
          for (let i = 0; i < vis.length; i++) P.line(x0 + i * cw + cw / 2, y1 + ch + 2, x0 + i * cw + cw / 2, y2 - 2, inWin(i) ? 'ink' : 'faint', inWin(i) ? 1.6 : 1);
          P.text('top strand (as sequenced)', x0, 14, { size: 12, color: 'muted' }); P.text(`positions ${off + 1}–${off + vis.length} of ${n}`, W - 10, 14, { size: 12, color: 'muted', align: 'right' });
          const wx = x0 + (p - off) * cw;
          P.rect(wx - 1, y1 - 6, k * cw + 2, y2 + ch - y1 + 12, null, 1, 5, 'gold', 2.6);
          const w = x.slice(p, p + k), rcw = revcomp(w);
          P.text(`window ${p + 1}…${p + k}:  5′-${w}-3′`, x0, y2 + ch + 26, { size: 14, weight: 700, color: 'ink' });
          P.text(`reverse complement (other strand, read 5′→3′):  5′-${rcw}-3′${w === rcw ? '   — its own reverse complement' : ''}`, x0, y2 + ch + 48, { size: 14, weight: 700, color: 'orange' });
          // ---- counts
          const cnt = new Map(); let pal = 0, palDistinct = new Set();
          for (let i = 0; i + k <= n; i++) {
            const a = x.slice(i, i + k), b = revcomp(a), key = merge.value && b < a ? b : a;
            cnt.set(key, (cnt.get(key) || 0) + 1); if (a === b) { pal++; palDistinct.add(a); }
          }
          const top = [...cnt.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 10);
          const Q = pxer(v, sB), H = sB.height, WB = sB.width, mx = Math.max(1, top[0] ? top[0][1] : 1), lab = 150, barX = lab + 14;
          const here = merge.value && revcomp(w) < w ? revcomp(w) : w, rh = Math.min(20, (H - 26) / 10);
          top.forEach(([word, c], i) => {
            const y = 12 + i * rh, isHere = word === here, other = revcomp(word);
            Q.text(merge.value && other !== word ? `${word} / ${other}` : word, lab, y + rh / 2, { size: 12.5, weight: isHere ? 800 : 600, align: 'right', color: isHere ? 'gold' : 'ink' });
            Q.rect(barX, y + 2, Math.max(2, (WB - barX - 56) * c / mx), rh - 4, isHere ? 'gold' : 'accent', isHere ? 0.85 : 0.55, 3);
            Q.text(c, barX + Math.max(2, (WB - barX - 56) * c / mx) + 6, y + rh / 2, { size: 12, weight: 700, color: 'muted' });
          });
          if (!top.length) Q.text('sequence shorter than k', WB / 2, H / 2, { color: 'muted', align: 'center' });
          cnt._pal = pal; cnt._palDistinct = palDistinct.size; renderState = { cnt, k, n, p, w };
        });
        v.readout(() => {
          const { cnt, k, n, w } = renderState; if (!cnt) return '';
          const windows = Math.max(0, n - k + 1), distinct = cnt.size, pal = k % 2 ? 'none (odd $k$)' : `${commas(4 ** (k / 2))} of ${commas(4 ** k)}`;
          return `$n=${n}$, $k=${k}$: **${commas(windows)}** windows (= $n-k+1$), **${commas(distinct)}** distinct${merge.value ? ' (merged with reverse complements)' : ''} of $4^{${k}}=${commas(4 ** k)}$ possible words · self-complementary words: ${pal}; ${cnt._pal} window${cnt._pal === 1 ? '' : 's'} here · $\\overline{\\texttt{${w}}}=\\texttt{${revcomp(w)}}$, and $\\overline{\\overline{\\texttt{${w}}}}=\\texttt{${revcomp(revcomp(w))}}$ ✓\n*Sequence: ${PRE[preset.value] ? PRE[preset.value].src : 'typed by you'}.*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Algorithm',
      name: 'Frequent k-mers by hash counting',
      statement: String.raw`**Problem (frequent words with mismatches).** Given a text, a length $k$ and a tolerance $d$, find the $k$-mers $w$ maximizing $\mathrm{Count}_d(w)=\#\{i:\ \mathrm{Hamming}(w,\mathrm{Text}_{i..i+k-1})\le d\}$, optionally also counting occurrences on the reverse-complement strand.

**Algorithm.** Keep a hash table (dictionary) from $k$-mers to counts. For each of the $n-k+1$ windows of the text, add $1$ to the entry of every word in the window's $d$-neighbourhood (and in its reverse complement's neighbourhood). One pass over the text, expected time $O\!\big(n\,|N_d|\big)$ with $|N_d|=\sum_{i\le d}\binom ki 3^i$, instead of comparing all $4^k$ words with all windows.`,
      idea: String.raw`Counting replaces searching: instead of asking, for each of the $4^k$ candidate words, how many windows are close to it (cost $4^k\,n\,k$), every window announces to all the words it is close to, and a hash table (here an array indexed by the base-4 number of the word) accumulates the votes. A word that gets many votes is far more frequent than chance: in a window of $n$ random letters a given word has expected count $(n-k+1)|N_d|/4^k$, tiny for $k=9$, so a handful of coincident occurrences is a signal — the DnaA boxes where the replication initiator binds.`,
      caption: String.raw`**Step through the insertions** (▶, or drag the scrubber): a gold cell is the current window, the bars on the right are the hash table's top entries, and the green/orange marks show where the leading word occurs on the forward and reverse strand. The window sits on the first 500 bp of *V. cholerae* chromosome I (NC_002505.1, the origin region): with $k=9$, $d=0$ and reverse complements the DnaA box TGTGGATAA/TTATCCACA comes out on top. The curve below slides the same window along the 10 kb around the origin and plots the top count in each: the origin is the one place it reaches 3. Raise $d$ and low-complexity AT repeats overtake the box — counting finds frequent words, not necessarily meaningful ones.`,
      deps: ['bioinf-1.1', 'algo-5.11'],
      refs: ['Compeau–Pevzner ch. 1'],
      credit: 'Sequence: V. cholerae N16961, Heidelberg et al., 2000 (NC_002505.1)',
      tags: ['k-mers', 'hashing', 'replication origin'],
      viz(v) {
        const kS = v.slider('$k$', 3, 10, 9, { int: true, onChange: () => reset() });
        const dS = v.slider('mismatches $d$', 0, 2, 0, { int: true, onChange: () => reset() });
        const rcT = v.toggle('count reverse complements', true, { onChange: () => reset() });
        const stS = v.slider('window start (bp along the 10 kb strip)', 0, 9500, 5000, { int: true, step: 50, onChange: () => reset() });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 184, full: true, title: 'the 500-bp window, one coloured cell per base (rows of 100)' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, weight: 1, minWidth: 300, title: 'hash table: the most frequent words so far' });
        const sC = v.stage({ x: [-5000, 5000], y: [0, 6], axes: 'box', gutter: true, height: 240, weight: 1.15, minWidth: 320, xlabel: 'window start relative to the start of NC_002505.1 (bp)', ylabel: 'top count', title: 'the same count, window slid along the strip' });
        const win = () => VC_STRIP.slice(stS.value, stS.value + 500);
        let ct = null, ctKey = '', track = null, trackKey = '';
        const ensure = (i) => {
          const key = `${win()}|${kS.value}|${dS.value}|${rcT.value}`;
          if (!ct || ctKey !== key) { ct = counter(win(), kS.value, dS.value, rcT.value); ctKey = key; }
          if (ct.inserted > i + 1 || i < 0) ct.reset();
          while (ct.inserted < i + 1) ct.add(ct.inserted);
        };
        const S = v.steps({
          frames: () => [{ i: -1, line: 1, note: 'The hash table is empty. Every window of the text will vote for the words it is close to.' }, ...Array.from({ length: Math.max(0, win().length - kS.value + 1) }, (_, i) => ({ i, line: [2, 3] }))],
          code: ['table ← empty hash table of counts', 'for each window of Text   (i = 0 … |Text| − k)', '    for each word in the d-neighbourhood of the window', '        (and of its reverse complement):  table[word] += 1', 'report the words with the largest count'],
          codeTitle: 'FrequentWords(Text, k, d)', codePos: 'below', speed: 30, start: 0, still: 'end',
        });
        const reset = () => { S.reset(undefined, { at: 'end' }); };
        const fl = (c) => Math.floor(c);
        v.render(() => {
          const f = S.frame, k = kS.value, d = dS.value, w = win(), i = f.i < 0 ? -1 : f.i;
          ensure(i);
          const top = ct.top(8), lead = i >= 0 && top.length ? top[0] : null;
          // ---- ribbon
          const P = pxer(v, sA), W = P.W, cwd = (W - 24) / 100, ch = Math.min(24, (P.H - 26) / 5 - 3);
          for (let j = 0; j < w.length; j++) {
            const r = fl(j / 100), c = j % 100, x = 12 + c * cwd, y = 8 + r * (ch + 4);
            const inWin = i >= 0 && j >= i && j < i + k, done = j < i;
            P.rect(x + 0.4, y, cwd - 0.8, ch, inWin ? 'gold' : BCOL[w[j]], inWin ? 0.95 : done ? 0.55 : 0.2, 1.5);
          }
          if (lead) {
            for (const o of occurrences(w.slice(0, i + k), lead.word, d, rcT.value)) {
              for (let j = o.i; j < o.i + k; j++) { const r = fl(j / 100), c = j % 100, x = 12 + c * cwd, y = 8 + r * (ch + 4); P.rect(x + 0.4, y + ch - 3.5, cwd - 0.8, 3.5, o.strand === '+' ? 'ink' : 'purple', 1); }
            }
          }
          // ---- bars
          const Q = pxer(v, sB), WB = Q.W, HB = Q.H, lab = 96, rh = Math.min(24, (HB - 46) / 8), mx = Math.max(1, top.length ? top[0].count : 1);
          Q.text(i < 0 ? 'nothing inserted yet' : `after ${i + 1} windows: ${commas(ct.touched.length)} distinct entries`, 12, 12, { size: 12, color: 'muted' });
          top.forEach((o, r) => {
            if (!o.count) return;
            const y = 28 + r * rh, bw = Math.max(3, (WB - lab - 70) * o.count / mx), hot = r === 0 || o.count === top[0].count;
            Q.text(o.word, lab - 6, y + rh / 2, { size: 12.5, weight: hot ? 800 : 600, align: 'right', color: hot ? 'ink' : 'muted' });
            Q.rect(lab, y + 2, bw, rh - 4, hot ? 'orange' : 'accent', hot ? 0.8 : 0.45, 3);
            Q.text(o.count, lab + bw + 6, y + rh / 2, { size: 12, weight: 700, color: 'ink' });
          });
          // ---- track
          const key = `${kS.value}|${dS.value}|${rcT.value}`;
          if (trackKey !== key) { track = []; for (let a = 0; a + 500 <= VC_STRIP.length; a += 100) track.push([a - 5000, maxWordCount(VC_STRIP.slice(a, a + 500), kS.value, dS.value, rcT.value)]); trackKey = key; }
          const ymax = Math.max(4, ...track.map((t) => t[1])) + 1;
          sC.setView([-5000, 5000], [0, ymax]);
          sC.path(track.map(([a, c]) => [a, c]), { color: 'accent', width: 2 });
          sC.dots(track.map(([a, c]) => [a, c]), { r: 2.4, color: 'accent' });
          sC.vline(0, { color: 'green', dash: true, width: 1.4 }); sC.text('start of chromosome I', 120, ymax - 0.45, { size: 11.5, color: 'green', align: 'left' });
          sC.vband(stS.value - 5000, stS.value - 5000 + 500, { color: 'gold', alpha: 0.28 });
          sC.setTicks([[-5000, '−5 kb'], [-2500, '−2.5 kb'], [0, '0'], [2500, '2.5 kb'], [5000, '5 kb']], null);
        });
        v.legend([['gold', 'current window', { area: true }], ['ink', 'occurrence of the leading word (forward)', { area: true }], ['purple', 'its reverse-complement occurrence', { area: true }]]);
        v.readout(() => {
          const k = kS.value, d = dS.value, n = win().length - k + 1, nb = Array.from({ length: d + 1 }, (_, i) => binom(k, i) * 3 ** i).reduce((a, b) => a + b, 0);
          const lam = n * nb * (rcT.value ? 2 : 1) / 4 ** k, top = ct && ct.inserted ? ct.top(1)[0] : null; if (!top) return `Chance expectation for one given word: $\\lambda=(n-k+1)\\,|N_d|\\,(\\times2)/4^k=${lam.toExponential(2)}$ occurrences per ${n}-window.`;
          let pois = 1, term = Math.exp(-lam); for (let j = 0; j < top.count; j++) { pois -= term; term *= lam / (j + 1); } pois = Math.max(pois, 0);
          let nWords = 0; for (const c of ct.touched) if (ct.cnt[c] >= top.count) nWords++;
          return `Top so far: **${top.word}** ×${top.count} (${nWords} word${nWords === 1 ? '' : 's'} at this count). A word reaches ≥${top.count} by chance with probability $\\approx${pois.toExponential(1)}$ ($\\lambda=${lam.toExponential(1)}$), so among all $4^{${k}}$ words about **${(pois * 4 ** k).toExponential(1)}** are expected at that height — observed ${nWords}. Neighbourhood size $|N_{${d}}|=${nb}$.\n*Sequence: V. cholerae N16961 chromosome I, NC_002505.1 (last 5 kb + first 5 kb; the origin is at 0).*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Phenomenon',
      name: 'GC skew and the replication origin',
      statement: String.raw`In most bacterial genomes the two **replichores** (the halves between the replication origin $\mathrm{ori}$ and the terminus $\mathrm{ter}$) are asymmetric: on the strand that is copied continuously (the leading strand) guanine outnumbers cytosine, and on the lagging strand the reverse. Hence on one fixed strand the **GC skew** $(G-C)/(G+C)$, computed in a window, has one sign on one replichore and the opposite sign on the other, and the **cumulative skew** $\mathrm{Skew}_i=\#G_{1..i}-\#C_{1..i}$ **falls** along the first replichore and **rises** along the second: its **minimum lies at the origin** and its **maximum at the terminus**. The location of the minimum therefore predicts $\mathrm{ori}$.`,
      idea: String.raw`Replication and transcription leave strand-specific mutation signatures: on the lagging strand, which stays single-stranded longer, cytosine deaminates to uracil (read as T) faster, so C is depleted there and G is relatively enriched on the *complementary* leading strand. Walking along one strand across the origin, you pass from a lagging-strand half (C-rich, so $G-C$ falls) to a leading-strand half ($G-C$ rises), so the running difference turns from decreasing to increasing exactly at ori. The effect per base is tiny (a few percent), but a cumulative sum over a million bases makes it unmistakable. It is a heuristic: some genomes (and regions with strong gene-orientation bias, horizontal transfer or multiple origins) blur it.`,
      caption: String.raw`**Choose a genome** and read the three views of the same counts (G and C counted exactly in 500-bp bins from the NCBI sequence). Left: the circular chromosome, coloured by the sign of the local skew in the window you set (orange: G-rich; blue: C-rich), with the skew minimum (green) and maximum (red). Middle: the cumulative skew; **drag the gold point** along the genome. Bottom: the windowed skew changes sign at the origin and the terminus. For *E. coli* and *V. cholerae* the known origin is marked: the minimum falls within a bin or two of it.`,
      deps: ['bioinf-1.1'],
      refs: ['Compeau–Pevzner ch. 1'],
      credit: 'Lobry, 1996; Grigoriev, 1998',
      scope: String.raw`Holds for most bacteria with a single origin and a strong leading-strand gene bias; weak or absent in some genomes, and archaea with several origins show several turning points.`,
      tags: ['gc skew', 'replication origin', 'genomes'],
      viz(v) {
        const G0 = {};
        const INFO = {
          ec: { label: 'E. coli K-12', name: 'Escherichia coli K-12 MG1655', acc: 'NC_000913.3', known: [3925800, 3925990], knownLabel: 'oriC (DnaA-box cluster)' },
          vc: { label: 'V. cholerae chr I', name: 'Vibrio cholerae N16961 chromosome I', acc: 'NC_002505.1', known: [1, 400], knownLabel: 'oriC (start of the record)' },
          mg: { label: 'M. genitalium', name: 'Mycoplasma genitalium G37', acc: 'NC_000908.2', known: null },
        };
        const gs = v.select('genome', Object.entries(INFO).map(([value, o]) => ({ value, label: o.label })), 'ec');
        const wS = v.slider('window (kb)', 10, 400, 100, { int: true, step: 10 });
        const get = (key) => {
          if (G0[key]) return G0[key];
          const g = decodeGenome(GENOMES[key]), n = g.n, S = new Float64Array(n + 1), N = g.len;
          for (let i = 0; i < n; i++) S[i + 1] = S[i] + g.G[i] - g.C[i];
          let mn = 0, mx = 0; for (let i = 0; i <= n; i++) { if (S[i] < S[mn]) mn = i; if (S[i] > S[mx]) mx = i; }
          const cg = new Float64Array(n + 1), cc = new Float64Array(n + 1); for (let i = 0; i < n; i++) { cg[i + 1] = cg[i] + g.G[i]; cc[i + 1] = cc[i] + g.C[i]; }
          return (G0[key] = { ...g, S, mn, mx, N, cg, cc });
        };
        const sR = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 320, weight: 0.8, minWidth: 260, title: 'the circular chromosome' });
        const sC = v.stage({ x: [0, 5], y: [-1, 1], axes: 'box', gutter: true, height: 320, weight: 1.35, minWidth: 320, xlabel: 'position (Mb)', ylabel: 'cumulative skew  #G − #C  (thousands)', title: 'cumulative skew' });
        const sL = v.stage({ x: [0, 5], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 170, full: true, xlabel: 'position (Mb)', ylabel: '(G−C)/(G+C)', title: 'windowed skew on the given strand' });
        let cur = 'ec', hx = 0; const hdl = sC.handle(0, 0, { color: 'gold', r: 8, label: '', constrain: (x) => { const g = get(gs.value), xx = clamp(x, 0, g.len / 1e6); return [xx, g.S[Math.round(xx * 1e6 / g.bin)] / 1000]; } });
        hdl.onDrag = () => { hx = hdl.x; };
        const local = (g, i, w) => { const a = clamp(i - w, 0, g.n), b = clamp(i + w, 0, g.n), G = g.cg[b] - g.cg[a], C = g.cc[b] - g.cc[a]; return G + C ? (G - C) / (G + C) : 0; };
        v.render(() => {
          const key = gs.value, info = INFO[key], g = get(key), Mb = g.len / 1e6, w = Math.round(wS.value * 1000 / g.bin / 2);
          if (cur !== key) { cur = key; hx = Mb * 0.25; hdl.set(hx, g.S[Math.round(hx * 1e6 / g.bin)] / 1000); }
          const smin = Math.min(...g.S) / 1000, smax = Math.max(...g.S) / 1000, pad = (smax - smin) * 0.12;
          sC.setView([0, Mb], [smin - pad, smax + pad]);
          const pts = []; const stride = Math.max(1, Math.floor(g.n / 900)); for (let i = 0; i <= g.n; i += stride) pts.push([i * g.bin / 1e6, g.S[i] / 1000]);
          const ori = g.mn * g.bin, ter = g.mx * g.bin;
          sC.path(pts, { color: 'accent', width: 2.2 });
          sC.vline(ori / 1e6, { color: 'green', width: 1.6, dash: true }); sC.vline(ter / 1e6, { color: 'red', width: 1.6, dash: true });
          sC.dot(ori / 1e6, g.S[g.mn] / 1000, { r: 6, color: 'green', label: 'min', labelPos: ori / g.len > 0.5 ? 'nw' : 'ne' }); sC.dot(ter / 1e6, g.S[g.mx] / 1000, { r: 6, color: 'red', label: 'max', labelPos: 'ne' });
          if (info.known) sC.vband(info.known[0] / 1e6 - 0.012 * Mb, info.known[1] / 1e6 + 0.012 * Mb, { color: 'gold', alpha: 0.45 });
          hx = clamp(hdl.x, 0, Mb);
          const hi = Math.round(hx * 1e6 / g.bin);
          // ---- windowed skew
          sL.setView([0, Mb], [-0.1, 0.1]);
          const L = (x) => local(g, Math.round(x * 1e6 / g.bin), w); let lm = 0.02; for (let i = 0; i < g.n; i += 4) lm = Math.max(lm, Math.abs(local(g, i, w)));
          lm = Math.ceil(lm * 40) / 40 + 0.005; sL.setView([0, Mb], [-lm, lm]);
          sL.fn((x) => Math.max(0, L(x)), { fill: true, base: 0, color: 'orange', n: 500, width: 1.4, fillAlpha: 0.32 });
          sL.fn((x) => Math.min(0, L(x)), { fill: true, base: 0, color: 'accent', n: 500, width: 1.4, fillAlpha: 0.32 });
          sL.hline(0, { color: 'muted', width: 1 });
          sL.vline(ori / 1e6, { color: 'green', width: 1.4, dash: true }); sL.vline(ter / 1e6, { color: 'red', width: 1.4, dash: true });
          sL.vline(hx, { color: 'gold', width: 2 });
          // ---- ring
          const P = pxer(v, sR), cx = P.W / 2, cy = P.H / 2 + 6, R = Math.min(P.W, P.H) / 2 - 38, th = 15, nseg = 144, c = sR.ctx;
          const ang = (pos) => -Math.PI / 2 + 2 * Math.PI * pos / g.len;
          for (let sIdx = 0; sIdx < nseg; sIdx++) {
            const a0 = ang(sIdx * g.len / nseg), a1 = ang((sIdx + 1) * g.len / nseg) + 0.004, mid = Math.round((sIdx + 0.5) * g.n / nseg), sk = local(g, mid, w);
            c.save(); c.beginPath(); c.arc(cx, cy, R, a0, a1); c.strokeStyle = v.color(sk >= 0 ? 'orange' : 'accent', clamp(0.3 + Math.abs(sk) * 14, 0.3, 0.95)); c.lineWidth = th; c.stroke(); c.restore();
          }
          const mark = (pos, col, txt, r2 = R + th / 2 + 3, big = 5.5) => { const a = ang(pos), x = cx + Math.cos(a) * r2, y = cy + Math.sin(a) * r2; P.dot(x, y, big, col, 1, 'panel', 1.4); if (txt) { const tx = cx + Math.cos(a) * (R + 28), ty = cy + Math.sin(a) * (R + 28); P.text(txt, tx, ty, { size: 11.5, weight: 700, color: col, align: Math.cos(a) > 0.3 ? 'left' : Math.cos(a) < -0.3 ? 'right' : 'center' }); } };
          // replication arrows ori -> ter on both sides
          for (const dir of [1, -1]) {
            const aS = ang(ori), len = dir > 0 ? ((ter - ori + g.len) % g.len) : ((ori - ter + g.len) % g.len), steps = 40, rr = R - th - 7, pp = [];
            for (let q = 0; q <= steps; q++) { const a = aS + dir * 2 * Math.PI * (len * q / steps) / g.len; pp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
            P.path(pp.slice(0, -1), 'green', 1.8, 0.7);
            const p1 = pp[steps - 1], p2 = pp[steps], dx = p2[0] - p1[0], dy = p2[1] - p1[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
            P.path([[p2[0] - 9 * ux - 4.5 * uy, p2[1] - 9 * uy + 4.5 * ux], [p2[0], p2[1]], [p2[0] - 9 * ux + 4.5 * uy, p2[1] - 9 * uy - 4.5 * ux]], 'green', 1.8, 0.85);
          }
          if (info.known) mark((info.known[0] + info.known[1]) / 2, 'gold', '', R + th / 2 + 3, 4);
          mark(ori, 'green', 'ori?'); mark(ter, 'red', 'ter?'); mark(hx * 1e6, 'gold', '', R - th / 2 - 1, 6);
          P.text(INFO[key].label, cx, cy - 8, { size: 14, weight: 800, align: 'center' }); P.text(`${commas(g.len)} bp`, cx, cy + 12, { size: 12, color: 'muted', align: 'center' });
          P.text('position 1 at the top, clockwise', 10, P.H - 10, { size: 10.5, color: 'muted' });
        });
        v.legend([['orange', 'G-rich (skew > 0)', { area: true }], ['accent', 'C-rich (skew < 0)', { area: true }], ['green', 'cumulative minimum = predicted ori'], ['red', 'maximum = predicted ter'], ['gold', 'known oriC / your marker']]);
        v.readout(() => {
          const key = gs.value, info = INFO[key], g = get(key), ori = g.mn * g.bin, ter = g.mx * g.bin, hi = Math.round(clamp(hx, 0, g.len / 1e6) * 1e6 / g.bin);
          const gc = (g.cg[g.n] + g.cc[g.n]) / g.len;
          const dk = info.known ? (ori >= info.known[0] && ori <= info.known[1] ? 0 : Math.min(Math.abs(ori - info.known[0]), Math.abs(ori - info.known[1]))) : 0;
          const known = info.known ? ` · known ${info.knownLabel}: ${commas(info.known[0])}–${commas(info.known[1])} → distance from the minimum **${commas(dk)} bp** (bins are 500 bp)` : '';
          const w = Math.round(wS.value * 1000 / g.bin / 2);
          return `**${info.name}** (${info.acc}), ${commas(g.len)} bp, GC ${(100 * gc).toFixed(1)}% · skew minimum at **${commas(ori)}**${known} · maximum at **${commas(ter)}**, ${fixed(Math.min(((ter - ori + g.len) % g.len), g.len - ((ter - ori + g.len) % g.len)) / g.len * 100, 0)}% of the genome away · at the gold point (${commas(hi * g.bin)}): cumulative ${mnus(commas(g.S[hi]))}, windowed skew ${fixed(local(g, hi, w), 3)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Hamming distance and k-mer neighbourhoods',
      statement: String.raw`The **Hamming distance** $d_H(p,q)$ between two strings of equal length is the number of positions where they differ. It is a metric on $\{A,C,G,T\}^k$. The **$d$-neighbourhood** of a $k$-mer $p$ is $N_d(p)=\{q:\ d_H(p,q)\le d\}$. Exactly $\binom ki3^i$ strings lie at distance $i$ from $p$ (choose which $i$ positions change, then one of the $3$ other letters at each), so
$$|N_d(p)|=\sum_{i=0}^{d}\binom ki\,3^i,\qquad |N_k(p)|=4^k.$$`,
      idea: String.raw`A string at distance exactly $i$ is specified by the set $S$ of $i$ positions that differ and the replacement letter (3 choices) at each, and different $(S,\text{letters})$ give different strings, so the count is $\binom ki3^i$. The neighbourhood grows polynomially in $k$ for fixed $d$ (about $\binom kd3^d$), which is why approximate counting is feasible for $d=1,2$ and hopeless for large $d$: counting with mismatches (item 1.2) only works because $|N_d|\ll4^k$.`,
      caption: String.raw`All $4^k$ words are laid out on a grid by recursive quadrants (each letter picks a quadrant: A top-left, C top-right, G bottom-left, T bottom-right), so neighbours that differ only in a late letter sit together. Cells are coloured by their Hamming distance from your pattern; the ball of radius $d$ is drawn solid. Click any cell to compare it with the pattern. The bars check the enumeration (counted by brute force over all $4^k$ words) against $\binom ki3^i$.`,
      deps: ['bioinf-1.1'],
      refs: ['Compeau–Pevzner ch. 1'],
      credit: 'R. W. Hamming, 1950',
      tags: ['hamming distance', 'neighbourhood', 'combinatorics'],
      viz(v) {
        let renderState = null;
        const pat = v.input('pattern', 'ACGGT', { width: 110, onChange: () => { } });
        const dS = v.slider('radius $d$', 0, 6, 2, { int: true });
        const oth = v.input('compare with', 'ACTGA', { width: 110 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.1, minWidth: 300, title: 'all $4^k$ words, coloured by distance from the pattern' });
        const sB = v.stage({ x: [-0.6, 6.6], y: [0, 10], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 280, xlabel: 'distance $i$ from the pattern', ylabel: 'number of words', title: 'words at distance exactly $i$' });
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 104, full: true });
        const DC = ['gold', 'green', 'accent', 'purple', 'pink', 'orange', 'red'];
        const P0 = () => cleanDNA(pat.value, 6) || 'A';
        let geo = null;
        sM.onClick((x, y) => {
          if (!geo) return; const px = sM.X(x), py = sM.Y(y), k = P0().length, n = 2 ** k, gx = Math.floor((px - geo.x0) / geo.cs), gy = Math.floor((py - geo.y0) / geo.cs);
          if (gx < 0 || gy < 0 || gx >= n || gy >= n) return;
          let code = 0; for (let i = k - 1; i >= 0; i--) code = code * 4 + (((gx >> i) & 1) * 2 + ((gy >> i) & 1));
          oth.set(decode(code, k));
        });
        v.render(() => {
          const p = P0(), k = p.length, d = Math.min(dS.value, k), n = 2 ** k, P = pxer(v, sM), c = sM.ctx;
          dS.input.max = String(k);
          const cs = Math.floor(Math.min(P.W - 16, P.H - 16) / n * 10) / 10, x0 = (P.W - cs * n) / 2, y0 = (P.H - cs * n) / 2 + 2; geo = { x0, y0, cs };
          const cnt = new Array(k + 1).fill(0), o = cleanDNA(oth.value, 6).padEnd(k, 'A').slice(0, k);
          let sel = null;
          for (let code = 0; code < 4 ** k; code++) {
            const w = decode(code, k), dist = hamming(w, p); cnt[dist]++;
            let gx = 0, gy = 0; for (let i = 0; i < k; i++) { const dg = (code >> (2 * (k - 1 - i))) & 3; gx = gx * 2 + (dg >> 1); gy = gy * 2 + (dg & 1); }
            const inside = dist <= d;
            c.fillStyle = v.color(DC[dist], inside ? 0.9 : 0.16); c.fillRect(x0 + gx * cs + (cs > 4 ? 0.5 : 0), y0 + gy * cs + (cs > 4 ? 0.5 : 0), cs - (cs > 4 ? 1 : 0), cs - (cs > 4 ? 1 : 0));
            if (w === o) sel = [gx, gy];
          }
          if (sel) P.rect(x0 + sel[0] * cs - 1, y0 + sel[1] * cs - 1, cs + 2, cs + 2, null, 1, 0, 'ink', 2.2);
          // quadrant letters for the first letter
          P.text('A', x0 + 8, y0 + 12, { size: 13, weight: 800, color: 'ink' }); P.text('C', x0 + cs * n - 8, y0 + 12, { size: 13, weight: 800, align: 'right' });
          P.text('G', x0 + 8, y0 + cs * n - 12, { size: 13, weight: 800 }); P.text('T', x0 + cs * n - 8, y0 + cs * n - 12, { size: 13, weight: 800, align: 'right' });
          // ---- bars
          const tot = Array.from({ length: k + 1 }, (_, i) => binom(k, i) * 3 ** i), mx = Math.max(...tot) * 1.12;
          sB.setView([-0.6, k + 0.6], [0, mx]); sB.setTicks(Array.from({ length: k + 1 }, (_, i) => i), null);
          sB.bars(cnt, { x0: 0, dx: 1, color: (val, i) => (i <= d ? DC[i] : 'faint') });
          sB.dots(tot.map((t, i) => [i, t]), { r: 5, hollow: true, color: 'ink' });
          cnt.forEach((c2, i) => sB.text(commas(c2), i, c2 + mx * 0.04, { size: 11.5, align: 'center', weight: 700 }));
          // ---- pair
          const Q = pxer(v, sP), cw2 = Math.min(34, (Q.W - 190) / Math.max(k, 1)), xx = 120, hd = hamming(p, o);
          Q.text('pattern', xx - 12, 26, { size: 12, color: 'muted', align: 'right' }); Q.text('compare', xx - 12, 66, { size: 12, color: 'muted', align: 'right' });
          for (let i = 0; i < k; i++) {
            const bad = p[i] !== o[i];
            Q.rect(xx + i * cw2 + 1, 10, cw2 - 2, 32, BCOL[p[i]], 0.3, 4); Q.rect(xx + i * cw2 + 1, 50, cw2 - 2, 32, bad ? 'red' : BCOL[o[i]], bad ? 0.5 : 0.3, 4, bad ? 'red' : null, 1.6);
            Q.text(p[i], xx + i * cw2 + cw2 / 2, 26, { size: 15, weight: 750, align: 'center' }); Q.text(o[i], xx + i * cw2 + cw2 / 2, 66, { size: 15, weight: 750, align: 'center' });
            if (bad) Q.text('≠', xx + i * cw2 + cw2 / 2, 46, { size: 13, weight: 800, color: 'red', align: 'center' });
          }
          Q.text(`$d_H=${hd}$`.replace(/\$/g, ''), xx + k * cw2 + 18, 46, { size: 18, weight: 800, color: hd <= d ? 'green' : 'red' });
          Q.text(hd <= d ? `inside the ${d}-neighbourhood` : `outside the ${d}-neighbourhood`, xx + k * cw2 + 18, 70, { size: 12, color: hd <= d ? 'green' : 'red' });
          renderState = { cnt, tot, k, d, p, o, hd };
        });
        v.legend([['gold', 'distance 0', { area: true }], ['green', '1', { area: true }], ['accent', '2', { area: true }], ['purple', '3', { area: true }], ['ink', 'formula $\\binom ki3^i$', { dot: true }]]);
        v.readout(() => {
          if (!renderState) return ''; const { cnt, tot, k, d, hd } = renderState, inside = cnt.slice(0, d + 1).reduce((a, b) => a + b, 0), form = tot.slice(0, d + 1).reduce((a, b) => a + b, 0);
          const ok = cnt.every((c, i) => c === tot[i]);
          return `$k=${k}$, $d=${d}$: $|N_d|=\\sum_{i\\le d}\\binom ki3^i=${tot.slice(0, d + 1).map((t) => commas(t)).join(' + ')} = ${commas(form)}$; brute force over all $4^{${k}}=${commas(4 ** k)}$ words finds **${commas(inside)}** (${(100 * inside / 4 ** k).toFixed(inside / 4 ** k < 0.1 ? 2 : 1)}%) ${ok && inside === form ? '✓' : '✗'} · $d_H(\\text{pattern},\\text{compare})=${hd}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Paradox',
      name: 'Overlapping-words paradox',
      statement: String.raw`In a long random string of independent uniform letters over $\{A,C,G,T\}$, every word of length $m$ has the same expected number of occurrences, $(n-m+1)/4^m$. Yet the **expected waiting time** until a word $w$ first appears differs between words: with the *autocorrelation* $\mathcal O(w)=\{j\in\{1,\dots,m\}:\ w_{1..j}=w_{m-j+1..m}\}$ (lengths for which a prefix equals a suffix, always including $j=m$),
$$\mathbb E\,T_w=\sum_{j\in\mathcal O(w)}4^{\,j}.$$
So $\mathbb E\,T_{ATG}=4^3=64$ but $\mathbb E\,T_{ATA}=4^1+4^3=68$: the self-overlapping word takes longer to show up for the first time.`,
      idea: String.raw`Equal expected counts do not imply equal waiting times, because occurrences of a self-overlapping word come in clumps. Right after an ATA, the chance of another ATA within two letters is $1/16$ (the next two letters ‘TA’ complete an overlapping copy), whereas ATG cannot overlap itself. The same total count is therefore concentrated in fewer, bigger clusters, leaving longer empty stretches, so the first occurrence is later on average. The formula is the martingale argument of Conway (a gambler betting on each prefix) or the generating-function identity of Guibas–Odlyzko.`,
      caption: String.raw`Two words race in the same kind of random text. Each curve is the fraction of simulated strings in which the word has **not** appeared by length $t$ (log scale); thick lines are the exact survival function from the word's overlap automaton. The right panel shows one seeded random string with both words marked, and bars compare how often each occurs (equal) with how long you wait (not equal). **Type any two words** (try AAA vs AAC, or ATAT vs ATGA) and press *new sample* for fresh strings.`,
      deps: ['bioinf-1.2', 'stoch-12.6'],
      refs: ['Compeau–Pevzner ch. 1', 'Guibas–Odlyzko 1981'],
      credit: 'Conway; Guibas & Odlyzko, 1981',
      scope: String.raw`Independent uniform letters. Real genomes are not random text, but the clumping of self-overlapping words (repeats, tandem motifs) is exactly why naive ‘expected count’ arguments mislead.`,
      tags: ['paradox', 'waiting time', 'words'],
      viz(v) {
        let renderState = null;
        const wa = v.input('word A', 'ATA', { width: 80 }), wb = v.input('word B', 'ATG', { width: 80 });
        const nS = v.slider('simulated strings', 200, 20000, 6000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('new sample', () => { seed++; });
        const sS = v.stage({ x: [0, 360], y: [0.001, 1], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 320, xlabel: 'string length $t$', ylabel: 'P(word not yet seen)', title: 'waiting time until the first occurrence' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1, minWidth: 300, title: 'one random string, and the bottom line' });
        const W = (ctl) => cleanDNA(ctl.value, 5) || 'A';
        const cache = {};
        const waits = (w, n) => { const key = `${w}|${n}|${seed}`; return cache[key] || (cache[key] = simulateWaits(rng(hashSeed(key)), w, n, 4000)); };
        let strKey = '', str = '', rcount = null;
        const variance = (T) => { let m = 0; for (const t of T) m += t; m /= T.length; let s = 0; for (const t of T) s += (t - m) ** 2; return s / (T.length - 1); };
        v.render(() => {
          const a = W(wa), b = W(wb), n = Math.round(nS.value), tmax = 360;
          const WA = waits(a, n), WB = waits(b, n);
          const ex = [survival(a, tmax), survival(b, tmax)], col = ['accent', 'orange'];
          [[a, WA, ex[0]], [b, WB, ex[1]]].forEach(([w, T, E], i) => {
            const cnt = new Float64Array(tmax + 2); for (const t of T) if (t <= tmax) cnt[t]++;
            let surv = n; const pts = []; for (let t = 0; t <= tmax; t++) { surv -= cnt[t]; pts.push([t, Math.max(surv / n, 1e-4)]); }
            sS.path(pts.map(([t, y]) => [t, y]), { color: col[i], width: 1.4, alpha: 0.9 });
            sS.path(E.map((y, t) => [t, Math.max(y, 1e-4)]), { color: col[i], width: 3.2, alpha: 0.4 });
            const m = meanWait(w); sS.vline(m, { color: col[i], dash: true, width: 1.4 }); sS.text(`${w}: ${m}`, m + 4, i ? 0.0022 : 0.0042, { size: 12, weight: 800, color: col[i] });
          });
          // ---- right: one string + bars
          const key = `${a}|${b}|${seed}`; if (strKey !== key) { strKey = key; str = randomDNA(rng(hashSeed('s' + key)), 240); const big = randomDNA(rng(hashSeed('big' + key)), 400000); const cc = (w) => { let c = 0, i = -1; while ((i = big.indexOf(w, i + 1)) >= 0) c++; return c; }; rcount = [cc(a), cc(b)]; }
          const P = pxer(v, sR), Wd = P.W, cols = 60, cw = (Wd - 24) / cols, ch = 15, occ = (w) => { const s = new Set(); let i = -1; while ((i = str.indexOf(w, i + 1)) >= 0) for (let j = 0; j < w.length; j++) s.add(i + j); return s; };
          const oa = occ(a), ob = occ(b);
          for (let r = 0; r < 4; r++) for (let j = 0; j < cols; j++) {
            const idx = r * cols + j, ca = oa.has(idx), cb = ob.has(idx), x = 12 + j * cw, y = 10 + r * (ch + 3);
            P.rect(x + 0.3, y, cw - 0.6, ch, ca && cb ? 'purple' : ca ? col[0] : cb ? col[1] : 'faint', ca || cb ? 0.85 : 0.2, 2);
            if (cw >= 8) P.text(str[idx], x + cw / 2, y + ch / 2 + 0.5, { size: Math.min(11, cw), weight: 650, align: 'center', color: ca || cb ? 'panel' : 'muted' });
          }
          const count = (w) => { let c = 0, i = -1; while ((i = str.indexOf(w, i + 1)) >= 0) c++; return c; };
          P.text(`in these 240 letters: ${a} ×${count(a)}, ${b} ×${count(b)}`, 12, 10 + 4 * (ch + 3) + 8, { size: 12, color: 'muted' });
          const bar = (title, vals, y0, scale, fmtv, ref) => {
            P.text(title, 12, y0, { size: 12.5, weight: 700 });
            vals.forEach((val, i) => { const y = y0 + 12 + i * 22, bw = Math.max(2, (Wd - 150) * val / scale); P.rect(100, y, bw, 16, col[i], 0.75, 3); P.text(i ? b : a, 92, y + 8, { size: 12, weight: 800, align: 'right', color: col[i] }); P.text(fmtv(val), 100 + bw + 6, y + 8, { size: 12, weight: 700 }); });
          };
          const cb0 = 140, mn = [WA.reduce((s, t) => s + t, 0) / n, WB.reduce((s, t) => s + t, 0) / n];
          bar('occurrences per 400,000 random letters', rcount, cb0, Math.max(...rcount, 1) * 1.25, (x) => commas(x));
          bar('mean waiting time (simulated)', mn, cb0 + 90, Math.max(...mn, 1) * 1.25, (x) => x.toFixed(1));
          renderState = { a, b, n, mn, rcount, se: [Math.sqrt(variance(WA) / n), Math.sqrt(variance(WB) / n)] };
        });
        v.legend([['accent', 'word A (thin: simulation, thick: exact)'], ['orange', 'word B']]);
        v.readout(() => {
          if (!renderState) return ''; const { a, b, mn, se, rcount, n } = renderState;
          const f = (w) => { const o = overlaps(w); return `$\\mathbb E T_{\\texttt{${w}}}=${o.map((j) => `4^{${j}}`).join('+')}=${meanWait(w)}$`; };
          const diff = mn[0] - mn[1], sd = Math.hypot(se[0], se[1]);
          return `${f(a)} · ${f(b)} · simulated means ${mn[0].toFixed(1)} ± ${se[0].toFixed(1)} and ${mn[1].toFixed(1)} ± ${se[1].toFixed(1)} (${n} strings each) · difference ${diff.toFixed(1)} vs exact ${meanWait(a) - meanWait(b)} (${(Math.abs(diff - (meanWait(a) - meanWait(b))) / sd).toFixed(1)} s.e.) · counts per 400 000 letters: ${commas(rcount[0])} vs ${commas(rcount[1])} (both ≈ ${commas(400000 / 4 ** a.length)} resp. ${commas(400000 / 4 ** b.length)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Motifs, profiles and position weight matrices',
      statement: String.raw`A **motif** is a family of short strings (binding sites of one regulator, say) of common length $L$ that are similar but not identical. Align $m$ instances; the **count matrix** $c_a(j)$ is the number of instances with letter $a$ in column $j$, and the **profile** (position frequency matrix) is $p_a(j)=\dfrac{c_a(j)+\beta}{m+4\beta}$, with a pseudocount $\beta\ge0$ (Laplace: $\beta=1$). Against a background distribution $q$ the **position weight matrix** is $w_a(j)=\log_2\dfrac{p_a(j)}{q_a}$, and a window $x_1\cdots x_L$ gets the **score**
$$S(x)=\sum_{j=1}^{L}w_{x_j}(j)=\log_2\frac{\Pr(x\mid\text{motif})}{\Pr(x\mid\text{background})},$$
the log-likelihood ratio of "binding site" to "random". Windows (on either strand) scoring above a threshold are candidate sites.`,
      idea: String.raw`Under the model that the columns are independent, the probability that the motif generates $x$ is the product of column probabilities, and the same for the background; dividing and taking logs turns the product into a sum, which can be added up in one pass along a genome. The pseudocount keeps one unseen letter from vetoing a window with a score of $-\infty$.`,
      caption: String.raw`The six cI-repressor operators of phage λ, found in the genome NC_001416.1 (three at OR, three at OL), are aligned in the top panel; switch the matrix between counts, profile and log-odds bits. The middle panel scores **every 17-bp window of the 2.8 kb λ region on both strands**: the six true operators are the peaks. By default each operator is scored with a profile built from the *other five* (leave-one-out), so the peaks are honest predictions, not memorization. Click or drag on the score track to inspect a window below; move the threshold to trade missed sites against false positives, and set the pseudocount to 0 to see zeros veto windows.`,
      deps: ['bioinf-1.1'],
      refs: ['Compeau–Pevzner ch. 2', 'Durbin ch. 1'],
      credit: 'Stormo et al., 1982; Staden, 1984',
      tags: ['motif', 'profile', 'pwm'],
      viz(v) {
        let renderState = null;
        const SITES = LAMBDA_SITES, L = 17, m = SITES.length, SEG = SEQ_LAMBDA_OPS, FROM = LAMBDA_OPS_FROM, seqs = SITES.map((s) => s.seq);
        const showS = v.select('matrix', [{ value: 'count', label: 'counts' }, { value: 'prof', label: 'profile' }, { value: 'lod', label: 'log-odds (bits)' }], 'prof');
        const pcS = v.slider('pseudocount $\\beta$', 0, 2, 0.5, { step: 0.1 });
        const loo = v.toggle('leave the scored site out', true);
        const thS = v.slider('threshold (bits)', 0, 24, 12, { step: 0.5 });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, full: true, title: 'six operators aligned: counts, profile, log-odds' });
        const sB = v.stage({ x: [FROM, FROM + SEG.length], y: [-10, 25], axes: 'box', gutter: true, height: 240, full: true, xlabel: 'phage λ coordinate (NC_001416.1)', ylabel: 'best score (bits)', title: 'score of every 17-bp window, both strands' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 168, full: true });
        let sel = 37974 - FROM, memoKey = '', scan = null;
        const prof = (list, beta) => profileOf(list, L, beta);
        const lod = (P, w) => { let s = 0; for (let j = 0; j < L; j++) { const p = P[BASES.indexOf(w[j])][j]; s += log2(Math.max(p, 1e-4) / 0.25); } return s; };
        const doScan = () => {
          const key = `${pcS.value}|${loo.value}`; if (key === memoKey) return scan; memoKey = key;
          const full = prof(seqs, pcS.value), looP = SITES.map((_, i) => prof(seqs.filter((__, k) => k !== i), pcS.value));
          const out = [];
          for (let i = 0; i + L <= SEG.length; i++) {
            const w = SEG.slice(i, i + L), si = SITES.findIndex((s) => s.start === FROM + i);
            if (si >= 0 && loo.value) { const al = SITES[si].strand === '+' ? w : revcomp(w); out.push({ s: lod(looP[si], al), strand: SITES[si].strand, site: si }); continue; }
            const f = lod(full, w), r = lod(full, revcomp(w));
            out.push(f >= r ? { s: f, strand: '+', site: si } : { s: r, strand: '-', site: si });
          }
          return (scan = { out, full, looP });
        };
        sB.onClick((x) => { sel = clamp(Math.round(x) - FROM - 8, 0, SEG.length - L); });
        sB.onDrag((x) => { sel = clamp(Math.round(x) - FROM - 8, 0, SEG.length - L); });
        v.render(() => {
          const { out, full } = doScan(), th = thS.value, beta = pcS.value;
          // ---- A: alignment + matrix
          const P = pxer(v, sA), W = P.W, lw = 86, cw = Math.min(46, (W - lw - 14) / L), x0 = lw, rh = Math.min(24, (P.H - 70) / 12), cons = consensusOf(seqs, L), C = countMatrix(seqs, L);
          for (let j = 0; j < L; j++) P.text(j + 1, x0 + j * cw + cw / 2, 10, { size: 10.5, color: 'muted', align: 'center' });
          SITES.forEach((s, i) => {
            const y = 20 + i * rh; P.text(s.name, lw - 8, y + rh / 2, { size: 11.5, weight: 650, color: 'muted', align: 'right' });
            drawTiles(P, s.seq, x0, y + 1, cw, rh - 2, { fs: Math.min(14, cw * 0.7), color: (j, b) => (b === cons[j] ? BCOL[b] : 'faint'), alpha: 0.3 });
          });
          let y = 20 + m * rh + 4; P.text('consensus', lw - 8, y + rh / 2, { size: 11.5, weight: 800, align: 'right' });
          drawTiles(P, cons, x0, y, cw, rh, { fs: Math.min(14, cw * 0.7), bold: true, alpha: 0.55 });
          y += rh + 8;
          const mode = showS.value;
          BASES.split('').forEach((b, a) => {
            const yy = y + a * rh; P.text(b, lw - 8, yy + rh / 2, { size: 13, weight: 800, color: BCOL[b], align: 'right' });
            for (let j = 0; j < L; j++) {
              const pj = full[a][j], bits = log2(Math.max(pj, 1e-4) / 0.25), cx = x0 + j * cw;
              const fillc = mode === 'lod' ? (bits >= 0 ? heatCol(v, bits / 2, 'green') : heatCol(v, Math.min(1, -bits / 6), 'red')) : heatCol(v, mode === 'count' ? C[a][j] / m : pj, 'accent');
              P.rect(cx + 0.5, yy + 0.5, cw - 1, rh - 1, fillc, 1, 2);
              const txt = mode === 'count' ? String(C[a][j]) : mode === 'prof' ? pj.toFixed(2).replace(/^0/, '') : (pj === 0 && beta === 0 ? '−∞' : mnus(bits.toFixed(1)));
              if (cw >= 17) P.text(txt, cx + cw / 2, yy + rh / 2 + 0.5, { size: Math.min(11.5, cw * 0.4), weight: 650, align: 'center', color: mode === 'lod' ? 'ink' : (pj > 0.55 || (mode === 'count' && C[a][j] / m > 0.55)) ? 'panel' : 'ink' });
            }
          });
          P.text('A C G T rows; darker = more often seen', x0, y + 4 * rh + 12, { size: 11, color: 'muted' });
          // ---- B: track
          const ymax = Math.max(24, ...out.map((o) => o.s)) + 1, ymin = Math.min(-6, Math.max(-12, Math.min(...out.map((o) => o.s)) - 1));
          sB.setView([FROM, FROM + SEG.length], [ymin, ymax]);
          sB.hline(th, { color: 'orange', width: 1.6, dash: true });
          const pts = out.map((o, i) => [FROM + i + 8, o.s]); sB.path(pts, { color: 'muted', width: 1 });
          let tp = 0, fp = 0, bestFP = -99;
          out.forEach((o, i) => {
            const isSite = o.site >= 0; if (isSite) { sB.dot(FROM + i + 8, ymin + 0.2, { r: 5, color: 'green' }); }
            if (o.s >= th) { if (isSite) tp++; else { /* neighbours of a site count as the same hit */ const near = SITES.some((s) => Math.abs(s.start - (FROM + i)) < 9); if (!near) fp++; } sB.dot(FROM + i + 8, o.s, { r: isSite ? 4.5 : 3, color: isSite ? 'green' : 'red' }); }
            if (!isSite && !SITES.some((s) => Math.abs(s.start - (FROM + i)) < 9)) bestFP = Math.max(bestFP, o.s);
          });
          sB.vband(FROM + sel, FROM + sel + L, { color: 'gold', alpha: 0.35 });
          const labelled = [['OL', 35591], ['OR', 37951]]; labelled.forEach(([t, p]) => sB.text(t === 'OL' ? 'OL operators' : 'OR operators', p + 20, ymin + 2.5, { size: 11.5, color: 'green', weight: 700, align: 'left' }));
          // ---- C: inspector
          const Q = pxer(v, sC), o = out[sel], w = SEG.slice(sel, sel + L), al = o.strand === '+' ? w : revcomp(w), Wc = Q.W, cw2 = Math.min(40, (Wc - 110) / L), xx = 100, base = 76;
          Q.text(`window ${commas(FROM + sel)}–${commas(FROM + sel + L - 1)}, ${o.strand === '+' ? 'forward' : 'reverse'} strand (${o.site >= 0 ? SITES[o.site].name + ', a known operator' : 'not a known operator'}): score ${fixed(o.s, 1)} bits`, 10, 10, { size: 12.5, weight: 700, color: o.s >= th ? 'green' : 'ink' });
          const scoreP = (o.site >= 0 && loo.value) ? doScan().looP[o.site] : full;
          for (let j = 0; j < L; j++) {
            const b = al[j], a = BASES.indexOf(b), bits = log2(Math.max(scoreP[a][j], 1e-4) / 0.25), hgt = clamp(bits, -4, 2) * 14;
            Q.rect(xx + j * cw2 + 3, hgt >= 0 ? base - hgt : base, cw2 - 6, Math.abs(hgt), bits >= 0 ? 'green' : 'red', 0.75, 2);
            Q.text(mnus(bits.toFixed(1)), xx + j * cw2 + cw2 / 2, hgt >= 0 ? base - hgt - 8 : base + Math.abs(hgt) + 8, { size: 10, color: 'muted', align: 'center' });
            Q.rect(xx + j * cw2 + 1, 130, cw2 - 2, 26, BCOL[b], b === cons[j] ? 0.5 : 0.18, 3, b === cons[j] ? null : 'red', 1.4); Q.text(b, xx + j * cw2 + cw2 / 2, 143.5, { size: 13, weight: 750, align: 'center' });
          }
          Q.line(xx, base, xx + L * cw2, base, 'muted', 1);
          Q.text('log-odds of the letter', xx - 8, base - 20, { size: 10.5, color: 'muted', align: 'right' }); Q.text('window', xx - 8, 143.5, { size: 11, color: 'muted', align: 'right' });
          renderState = { tp, fp, bestFP, th, thr: out.filter((q) => q.s >= th).length, minTrue: Math.min(...out.filter((q) => q.site >= 0).map((q) => q.s)) };
        });
        v.legend([['green', 'true operator window', { dot: true }], ['red', 'false positive', { dot: true }], ['orange', 'threshold'], ['gold', 'inspected window', { area: true }]]);
        v.readout(() => {
          if (!renderState) return ''; const { tp, fp, bestFP, th, minTrue } = renderState;
          return `Threshold ${fixed(th, 1)} bits ($=$ odds $2^{${fixed(th, 1)}}\\approx${commas(2 ** th)}:1$ for site vs background): **${tp} of 6** operators found, **${fp}** false positive${fp === 1 ? '' : 's'} among the other 2 779 windows · weakest operator ${fixed(minTrue, 1)} bits, best non-operator window ${fixed(bestFP, 1)} bits ${minTrue > bestFP ? '— a threshold between them separates the two perfectly' : '— the classes overlap'}\n*Sites: phage λ NC_001416.1, OR1–OR3 at 37 998 / 37 974 / 37 951 and three OL sites at 35 591, 35 615, 35 635, located by exact string match; orientation chosen to maximize the profile's information.*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Information content and sequence logos',
      statement: String.raw`For an alignment column with letter frequencies $p_a$ and background frequencies $q_a$, the **information content** is the relative entropy
$$R=\sum_{a}p_a\log_2\frac{p_a}{q_a}\ \ \text{bits},\qquad R=2-H\ \text{ for a uniform background},\ H=-\sum p_a\log_2p_a .$$
It is $0$ for a column that looks like the background and $2$ bits for a fully conserved column. A **sequence logo** draws column $j$ as a stack of total height $R_j$ whose letters have height $p_a R_j$, tallest on top. The total $\sum_jR_j$ is the number of bits by which the motif narrows down a random sequence. From $m$ sites the observed frequencies overestimate information by about $e_m=\dfrac{3}{2\ln2\;m}$ bits per column (small-sample bias), which logos usually subtract.`,
      idea: String.raw`The score of a site under the profile, averaged over the sites, is exactly $\sum_jR_j$ (log-likelihood ratio, item 1.6), and Shannon's relative entropy (info-2.1) is the average log-odds of the profile against the background, so the stack height measures how many bits per column the motif contributes to finding itself. Sampling noise makes even a column of random letters look slightly informative when $m$ is small, because $\hat p_a$ fluctuates by about $1/\sqrt m$; the expansion of the entropy gives the bias $3/(2\ln2\,m)$.`,
      caption: String.raw`Choose real motifs: the six λ operators, 16 *E. coli* LexA boxes, or the human CTCF site (JASPAR MA0139.1, counts from 913 ChIP-seq peaks). Tall stacks are conserved columns. **Add noise** (each letter replaced by a random one with the given probability) and the logo melts; **cut the number of sites** and watch uncorrected information stay high from sampling noise alone until you switch on the small-sample correction. The background-GC slider shows that a G/C-rich background makes G/C less surprising, so those letters shrink and A/T grow.`,
      deps: ['bioinf-1.6', 'info-2.1'],
      refs: ['Compeau–Pevzner ch. 2', 'Durbin ch. 1'],
      credit: 'T. D. Schneider and R. M. Stephens, 1990',
      tags: ['information', 'logo', 'entropy'],
      viz(v) {
        let renderState = null;
        const SETS = {
          lambda: { label: 'λ operators', sites: LAMBDA_SITES.map((s) => s.seq), src: 'phage λ cI operators, NC_001416.1' },
          lexa: { label: 'LexA boxes', sites: LEXA.map((g) => g.site), src: 'E. coli LexA-regulated promoters (NC_000913.3, best 20-mer match to the consensus)' },
          ctcf: { label: 'human CTCF', counts: CTCF_PFM, n: 913, src: 'JASPAR MA0139.1 (Kim et al. 2007, PMID 17512414)' },
        };
        const ds = v.select('motif', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'lambda', { onChange: (val) => { const mx = SETS[val].sites ? SETS[val].sites.length : SETS[val].n; nS.input.max = String(mx); nS.set(mx); } });
        const nS = v.slider('sites used $m$', 2, 16, 6, { int: true });
        const noise = v.slider('noise (letters replaced)', 0, 1, 0, { step: 0.05 });
        const gcS = v.slider('background GC', 0.2, 0.8, 0.5, { step: 0.05 });
        const corr = v.toggle('small-sample correction', true);
        let seed = 1; v.button('resample', () => { seed++; });
        const sL = v.stage({ x: [0.5, 17.5], y: [0, 2.2], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'position in the motif', ylabel: 'bits', title: 'sequence logo' });
        const sI = v.stage({ x: [0.5, 17.5], y: [0, 2.2], axes: 'box', gutter: true, height: 170, full: true, xlabel: 'position', ylabel: 'bits per column', title: 'information per column: observed (light) and after correction (solid)' });
        const build = () => {
          const S = SETS[ds.value], m = nS.value, r = rng(hashSeed(`${ds.value}|${m}|${noise.value}|${seed}`)), nz = noise.value;
          let list;
          if (S.sites) list = S.sites.slice(0, m).map((w) => w.split('').map((c) => (r() < nz ? BASES[r.int(4)] : c)).join(''));
          else {
            const L = S.counts[0].length, tot = S.n; list = [];
            if (m >= tot && nz === 0) { const C = S.counts.map((row) => row.slice()); return { C, n: tot, L, S }; }
            for (let i = 0; i < m; i++) { let w = ''; for (let j = 0; j < L; j++) { let u = r() * tot, a = 0; for (; a < 3; a++) { u -= S.counts[a][j]; if (u <= 0) break; } w += r() < nz ? BASES[r.int(4)] : BASES[a]; } list.push(w); }
          }
          return { C: countMatrix(list, list[0].length), n: list.length, L: list[0].length, S, list };
        };
        v.render(() => {
          const { C, n, L, S } = build(), q = bgFromGC(gcS.value), P4 = C.map((row) => row.map((c) => c / n));
          const raw = columnInfo(P4, q, n, false), cor = columnInfo(P4, q, n, true), info = corr.value ? cor : raw;
          const ymax = Math.max(2, ...raw) * 1.06;
          sL.setView([0.5, L + 0.5], [0, ymax]); sL.setTicks(Array.from({ length: L }, (_, i) => i + 1).filter((i) => L <= 20 || i % 2 === 1), null);
          drawLogo(sL, v, P4, info);
          sI.setView([0.5, L + 0.5], [0, ymax]); sI.setTicks(Array.from({ length: L }, (_, i) => i + 1).filter((i) => L <= 20 || i % 2 === 1), null);
          sI.bars(raw, { x0: 1, dx: 1, color: 'accent' }); sI.bars(cor, { x0: 1, dx: 1, color: 'green' });
          sI.hline(3 / (2 * Math.LN2 * n), { color: 'orange', dash: true, width: 1.5 });
          renderState = { n, L, R: raw.reduce((a, b) => a + b, 0), Rc: cor.reduce((a, b) => a + b, 0), en: 3 / (2 * Math.LN2 * n), S };
        });
        v.legend([['accent', 'observed $R_j$', { area: true }], ['green', 'corrected $R_j-e_m$', { area: true }], ['orange', 'bias $e_m$ for pure noise']]);
        v.readout(() => {
          if (!renderState) return ''; const { n, L, R, Rc, en, S } = renderState;
          return `$m=${commas(n)}$ sites, $L=${L}$ columns · total information **${fixed(R, 1)} bits** observed, **${fixed(Rc, 1)} bits** after subtracting $e_m=${fixed(en, 2)}$ bits per column (maximum $2L=${2 * L}$) · a random window matches such a motif with probability about $2^{-${fixed(Rc, 0)}}$\n*Data: ${S.src}.*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Algorithm',
      name: 'Median string and its equivalence to motif finding',
      statement: String.raw`Given $t$ sequences $\mathrm{Dna}$ and a length $k$, the **motif finding problem** asks for one $k$-mer start in each sequence (a *motif matrix* $\mathrm{Motifs}$) minimizing $\mathrm{Score}(\mathrm{Motifs})=\sum_{j=1}^{k}\big(t-\max_a c_a(j)\big)$, the number of letters that disagree with their column's majority. The **median string problem** asks for the $k$-mer $\mathrm{Pattern}$ minimizing $d(\mathrm{Pattern},\mathrm{Dna})=\sum_{i=1}^t\min_{\text{windows }w\text{ of }\mathrm{Dna}_i}d_H(\mathrm{Pattern},w)$. The two have the same optimum:
$$\min_{\mathrm{Motifs}}\mathrm{Score}(\mathrm{Motifs})\;=\;\min_{\mathrm{Pattern}}d(\mathrm{Pattern},\mathrm{Dna}).$$
Median string is solved by trying all $4^k$ patterns: $O(4^k\,k\,t\,n)$ time — feasible for $k\approx10$, not for $k=20$.`,
      idea: String.raw`($\le$) Given Motifs, take Pattern = the consensus string; every chosen window disagrees with it in at most its column's minority letters, so $d(\mathrm{Pattern},\mathrm{Dna})\le\mathrm{Score}$. ($\ge$) Given Pattern, take in each sequence a window closest to it; $\mathrm{Score}(\mathrm{Motifs})\le\sum_i d_H(\mathrm{Pattern},\text{window}_i)=d(\mathrm{Pattern},\mathrm{Dna})$ because the consensus is the best possible reference for the column. So an optimum of either problem yields one of the other with no worse value. The price: enumerating motifs costs $(n-k+1)^t$ while enumerating patterns costs $4^k$.`,
      caption: String.raw`A small seeded data set: $t$ random sequences, each hiding one copy of a planted $k$-mer with $m$ substitutions (green ticks mark the truth). **Left:** all $4^k$ patterns on a quadrant grid, coloured by $d(\mathrm{Pattern},\mathrm{Dna})$; the bright cell is the median string. **Click any cell** to see, in every sequence, the closest window to that pattern, and the Score of the resulting motif matrix. The readout compares the median-string minimum with the minimum of Score over *all* $(n-k+1)^t$ motif matrices found by brute force: they agree. Make $t$ or $n$ bigger and the brute force for motif matrices becomes infeasible while $4^k$ stays the same.`,
      deps: ['bioinf-1.6', 'bioinf-1.4'],
      refs: ['Compeau–Pevzner ch. 2'],
      tags: ['median string', 'motif finding', 'brute force'],
      viz(v) {
        let renderState = null;
        const kS = v.slider('motif length $k$', 4, 7, 6, { int: true });
        const tS = v.slider('sequences $t$', 3, 5, 4, { int: true });
        const nS = v.slider('length $n$', 12, 22, 16, { int: true });
        const mS = v.slider('planted substitutions', 0, 3, 1, { int: true });
        let seed = 3; v.button('new data', () => { seed++; });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1, minWidth: 300, title: 'd(Pattern, Dna) for every 6-mer' });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.15, minWidth: 320, title: 'closest window to the chosen pattern in each sequence' });
        let sel = null, geo = null, key = '', D = null, dist = null, best = null, brute = null;
        const compute = () => {
          const k = kS.value, t = tS.value, n = nS.value, mm = mS.value, kk = `${k}|${t}|${n}|${mm}|${seed}`;
          if (kk === key) return; key = kk;
          D = plantedData(hashSeed(kk), { t, L: n, k, m: mm });
          const N = 4 ** k; dist = new Int16Array(N); let dmin = 1e9, dmax = 0;
          for (let c = 0; c < N; c++) { const d = medianDistance(decode(c, k), D.seqs); dist[c] = d; if (d < dmin) dmin = d; if (d > dmax) dmax = d; }
          const mins = []; for (let c = 0; c < N; c++) if (dist[c] === dmin) mins.push(c);
          best = { dmin, dmax, mins }; sel = mins[0];
          // brute force over all motif matrices
          const W = n - k + 1, combos = W ** t;
          if (combos > 600000) brute = { combos, skipped: true };
          else {
            const x = D.seqs.map((s) => s.split('').map((c) => BASES.indexOf(c))), Cn = Array.from({ length: 4 }, () => new Int16Array(k)); let bs = 1e9, cnt = 0;
            const rec = (i) => {
              if (i === t) { cnt++; let sc = 0; for (let j = 0; j < k; j++) sc += t - Math.max(Cn[0][j], Cn[1][j], Cn[2][j], Cn[3][j]); if (sc < bs) bs = sc; return; }
              for (let p = 0; p < W; p++) { for (let j = 0; j < k; j++) Cn[x[i][p + j]][j]++; rec(i + 1); for (let j = 0; j < k; j++) Cn[x[i][p + j]][j]--; }
            };
            rec(0); brute = { combos, score: bs, cnt };
          }
        };
        sM.onClick((x, y) => {
          if (!geo) return; const k = kS.value, n = 2 ** k, gx = Math.floor((sM.X(x) - geo.x0) / geo.cs), gy = Math.floor((sM.Y(y) - geo.y0) / geo.cs);
          if (gx < 0 || gy < 0 || gx >= n || gy >= n) return; let code = 0; for (let i = k - 1; i >= 0; i--) code = code * 4 + (((gx >> i) & 1) * 2 + ((gy >> i) & 1)); sel = code;
        });
        v.render(() => {
          compute(); const k = kS.value, t = tS.value, n = nS.value, N = 4 ** k, side = 2 ** k;
          sM.setTitle(`$d(\\mathrm{Pattern},\\mathrm{Dna})$ for every ${k}-mer (bright = small)`);
          const P = pxer(v, sM), cs = Math.floor(Math.min(P.W - 16, P.H - 16) / side * 10) / 10, x0 = (P.W - cs * side) / 2, y0 = (P.H - cs * side) / 2 + 2; geo = { x0, y0, cs };
          const span = Math.max(1, best.dmax - best.dmin), isMin = new Set(best.mins);
          for (let c = 0; c < N; c++) {
            let gx = 0, gy = 0; for (let i = 0; i < k; i++) { const dg = (c >> (2 * (k - 1 - i))) & 3; gx = gx * 2 + (dg >> 1); gy = gy * 2 + (dg & 1); }
            const tt = Math.pow((best.dmax - dist[c]) / span, 2.2); P.c.fillStyle = heatCol(v, tt, 'green'); P.c.fillRect(x0 + gx * cs + (cs > 4 ? 0.5 : 0), y0 + gy * cs + (cs > 4 ? 0.5 : 0), cs - (cs > 4 ? 1 : 0), cs - (cs > 4 ? 1 : 0));
            if (isMin.has(c)) P.rect(x0 + gx * cs - 1, y0 + gy * cs - 1, cs + 2, cs + 2, null, 1, 0, 'gold', 2);
            if (c === sel) P.rect(x0 + gx * cs - 2, y0 + gy * cs - 2, cs + 4, cs + 4, null, 1, 0, 'ink', 2.4);
          }
          P.text('A', x0 + 8, y0 + 12, { size: 13, weight: 800 }); P.text('C', x0 + cs * side - 8, y0 + 12, { size: 13, weight: 800, align: 'right' }); P.text('G', x0 + 8, y0 + cs * side - 12, { size: 13, weight: 800 }); P.text('T', x0 + cs * side - 8, y0 + cs * side - 12, { size: 13, weight: 800, align: 'right' });
          // ---- right: alignments
          const Q = pxer(v, sA), W = Q.W, pat = decode(sel, k), cw = Math.min(26, (W - 120) / n), xs = 54, rh = Math.min(48, (Q.H - 110) / t);
          const wins = [];
          D.seqs.forEach((s, i) => {
            let b = k + 1, bi = 0; for (let p = 0; p + k <= s.length; p++) { const d = hamming(s.slice(p, p + k), pat); if (d < b) { b = d; bi = p; } }
            wins.push({ p: bi, d: b }); const y = 14 + i * rh;
            Q.text(`#${i + 1}`, 10, y + 15, { size: 12, weight: 700, color: 'muted' });
            drawTiles(Q, s, xs, y, cw, 26, { fs: Math.min(13, cw * 0.72), dim: (j) => j < bi || j >= bi + k });
            Q.rect(xs + bi * cw - 1, y - 2, k * cw + 2, 30, null, 1, 4, 'gold', 2.2);
            for (let j = 0; j < k; j++) if (s[bi + j] !== pat[j]) Q.rect(xs + (bi + j) * cw + 1, y + 24, cw - 2, 3, 'red', 1);
            Q.tri(xs + (D.pos[i] + k / 2) * cw, y + 36, 4.5, 'green');
            Q.text(`d=${b}`, xs + n * cw + 8, y + 15, { size: 12, weight: 800, color: b === 0 ? 'green' : 'ink' });
          });
          const motifs = wins.map((w, i) => D.seqs[i].slice(w.p, w.p + k)), sc = scoreMotifs(motifs, k), dd = wins.reduce((a, w) => a + w.d, 0), y = 14 + t * rh + 6;
          Q.text('pattern', 10, y + 14, { size: 12, color: 'muted' }); drawTiles(Q, pat, xs + 22, y, cw, 26, { bold: true, alpha: 0.5, fs: Math.min(14, cw * 0.75) });
          Q.text('consensus of the windows', 10, y + 56, { size: 12, color: 'muted' }); drawTiles(Q, consensusOf(motifs, k), xs + 22 + 80, y + 42, cw, 26, { alpha: 0.4, fs: Math.min(13, cw * 0.7) });
          Q.text(`▲ planted copy (truth)`, W - 10, Q.H - 12, { size: 11, color: 'green', align: 'right' });
          renderState = { pat, dd, sc, k, t, n };
        });
        v.legend([['gold', 'closest window / minimum cell', { area: true }], ['green', 'planted truth', { dot: true }], ['red', 'mismatch with the pattern', { area: true }]]);
        v.readout(() => {
          compute(); if (!renderState) return ''; const { pat, dd, sc, k, t, n } = renderState, W = n - k + 1;
          const bf = brute.skipped ? `motif matrices: $(${W})^{${t}}=${commas(brute.combos)}$ — too many to enumerate here` : `all $${W}^{${t}}=${commas(brute.combos)}$ motif matrices enumerated: $\\min\\mathrm{Score}=${brute.score}$ ${brute.score === best.dmin ? '✓ equal' : '✗'}`;
          return `Median string: **${decode(best.mins[0], k)}**${best.mins.length > 1 ? ` (+${best.mins.length - 1} tied)` : ''} with $d=${best.dmin}$ among $4^{${k}}=${commas(4 ** k)}$ patterns · ${bf} · selected pattern ${pat}: $d=${dd}$, Score of its closest-window matrix $=${sc}\\le d$ ✓ · true planted score ${truthScore(D)}\n*Synthetic data: seeded random sequences with a planted ${k}-mer (${mS.value} substitution${mS.value === 1 ? '' : 's'} per copy).*`;
        });
      },
    },
  ],
};
