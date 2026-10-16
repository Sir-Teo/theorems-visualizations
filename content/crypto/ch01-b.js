// Cryptography — Chapter 1: Classical ciphers and their cryptanalysis (items 1.7–1.11; 1.1–1.6 in ch01.js)
import {
  A, mod, clamp, norm, code, vigC, randomKey, EN_P, EN_SOURCE, SUM_P2, FRIEDMAN_EN, GETTYSBURG, H2, LOG2_FACT26,
  counts, total, icOf, icText, columnsOf, icByPeriod, pickPeriod, recoverKey, kasiski, kasiskiPeriod, bestShift, factorStr,
  makeEnigma, parsePlug, posName, ROTORS, REFLECTORS,
  equivocation, topAt, sciText, groups5, rowsOf, pix, letterRow,
} from './ch01.shared.js';

const PASSAGE = norm(GETTYSBURG);
const KEYCOL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];

export default {
  collection: 'crypto',
  chapter: 1,
  items: [
    // ================================================================== 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Vigenère cipher',
      statement: String.raw`The **Vigenère cipher** with a keyword $w = w_0w_1\cdots w_{L-1}$ of $L$ letters (a key in $\mathbb Z_{26}^L$) encrypts the $j$-th plaintext letter $x_j$ as $x_j + w_{j \bmod L} \pmod{26}$ and decrypts by subtracting. It is a family of $L$ shift ciphers used in rotation, so one plaintext letter has up to $L$ different encryptions and the letter frequencies of the ciphertext are flatter than the language’s: for long keys the histogram approaches the uniform one. The key space is $26^L$.`,
      idea: String.raw`Each ciphertext letter is a shifted copy of the plaintext distribution, with a different shift in each residue class mod $L$; averaging $L$ shifted copies of the English histogram flattens it. The *total* histogram therefore hides the language’s fingerprint, which is why the cipher resisted analysis for centuries — but inside any single residue class the cipher is still a plain shift cipher, which is the weakness the next item exploits.`,
      caption: String.raw`Type a plaintext and a keyword; the strip shows the letters of the plaintext, the repeating key and the ciphertext, colour-coded by key position, and the **tabula recta** (row = key letter, column = plaintext letter) shows how the highlighted letter is encrypted. Move the slider along the message. The right histogram flattens as the key grows; the bottom plot shows the index of coincidence against key length.`,
      deps: ['crypto-1.6'],
      tags: ['Vigenère', 'polyalphabetic'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Giovan Battista Bellaso, 1553 (later misattributed to Blaise de Vigenère)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher' },
      viz(v) {
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 136, full: true });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 372, weight: 1, minWidth: 340 });
        const sH = v.stage({ x: [0.5, 26.5], y: [0, 10], axes: 'box', gutter: true, height: 372, weight: 1.1, minWidth: 340, xlabel: 'ciphertext letter', ylabel: 'count', xticks: [...A].map((c, i) => [i + 1, c]) });
        const sI = v.stage({ x: [0, 27], y: [0.03, 0.082], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'keyword length L', ylabel: 'index of coincidence', xticks: [1, 5, 10, 15, 20, 26].map((x) => [x, String(x)]) });
        const text = GETTYSBURG.slice(0, GETTYSBURG.indexOf('We are met') + 20);
        const ptIn = v.input('Plaintext', text, { width: 340 });
        const keyIn = v.input('Key', 'LEMON', { width: 150 });
        const pos = v.slider('Letter #', 1, 28, 5, { int: true });
        let cacheP = null, cacheC = null;
        const curve = (P) => {
          if (cacheP === P) return cacheC;
          const r = v.rng(31), out = [];
          for (let L = 1; L <= 26; L++) { let s = 0; for (let t = 0; t < 14; t++) s += icText(vigC(P, randomKey(r, L))); out.push(s / 14); }
          cacheP = P; cacheC = out; return out;
        };
        const calc = () => {
          const P = norm(ptIn.value), K = norm(keyIn.value) || 'A', C = vigC(P, K);
          return { P, K, C, cp: counts(P), cc: counts(C) };
        };
        v.render(() => {
          const X = calc(), P = pix(sA), { W } = P, cols = 28, lm = 78, cw = Math.min(24, (W - lm - 10) / cols);
          const j = Math.min(pos.value - 1, Math.max(0, X.P.length - 1));
          const rows = [['plaintext', X.P, () => 'ink'], ['key', X.P.split('').map((_, i) => X.K[i % X.K.length]).join(''), (i) => KEYCOL[(i % X.K.length) % KEYCOL.length]], ['ciphertext', X.C, (i) => KEYCOL[(i % X.K.length) % KEYCOL.length]]];
          rows.forEach(([lab, str, col], r) => {
            const y = 26 + r * 38;
            P.text(lab, 8, y, { size: 11.5, color: 'muted', weight: 700, align: 'left', halo: false });
            letterRow(P, str.slice(0, cols), lm, y, cw, col, { size: 14.5 });
          });
          if (j < cols) P.rect(lm + j * cw, 8, cw, 108, { fill: 'gold', fillAlpha: 0.18, color: 'gold', width: 1.8, radius: 5 });
          P.text(X.P.length > cols ? `… ${X.P.length - cols} more letters` : '', W - 8, 128, { size: 11, color: 'muted', align: 'right', halo: false });
        });
        v.render(() => {
          const X = calc(), P = pix(sT), { W, H } = P, j = Math.min(pos.value - 1, Math.max(0, X.P.length - 1));
          const cell = Math.min((W - 30) / 27, (H - 44) / 27), x0 = (W - 27 * cell) / 2 + cell, y0 = 14 + cell, fs = cell > 12 ? 9.5 : 8.5;
          const usedRows = new Set([...X.K].map(code));
          const kj = code(X.K[j % X.K.length]), pj = X.P.length ? code(X.P[j]) : 0, cj = mod(kj + pj, 26);
          // bands
          usedRows.forEach((r) => P.rect(x0 - cell, y0 + r * cell, 27 * cell, cell, { fill: 'orange', fillAlpha: 0.1, stroke: false }));
          P.rect(x0 - cell, y0 + kj * cell, 27 * cell, cell, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 1.2 });
          P.rect(x0 + pj * cell, y0 - cell, cell, 27 * cell, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 1.2 });
          for (let r = 0; r < 26; r++) for (let c = 0; c < 26; c++) {
            const hit = r === kj && c === pj;
            P.text(A[(r + c) % 26], x0 + (c + 0.5) * cell, y0 + (r + 0.5) * cell, { size: hit ? 11.5 : fs, weight: hit ? 800 : 500, color: hit ? 'panel' : usedRows.has(r) ? 'ink' : 'faint', align: 'center', halo: false });
          }
          P.rect(x0 + pj * cell, y0 + kj * cell, cell, cell, { fill: 'gold', fillAlpha: 0.95, color: 'gold', width: 1.5, radius: 3 });
          P.text(A[cj], x0 + (pj + 0.5) * cell, y0 + (kj + 0.5) * cell, { size: 12, weight: 800, color: 'panel', align: 'center', halo: false });
          for (let i = 0; i < 26; i++) {
            P.text(A[i], x0 + (i + 0.5) * cell, y0 - cell / 2, { size: fs + 1, weight: 700, color: 'blue', align: 'center', halo: false });
            P.text(A[i], x0 - cell / 2, y0 + (i + 0.5) * cell, { size: fs + 1, weight: 700, color: usedRows.has(i) ? 'orange' : 'muted', align: 'center', halo: false });
          }
          P.text('plaintext letter →', x0 + 13 * cell, 8, { size: 10.5, color: 'blue', weight: 600, align: 'center', halo: false });
          P.text(`${A[pj]} + ${A[kj]} → ${A[cj]}`, W / 2, H - 6, { size: 13, weight: 700, color: 'ink', align: 'center', halo: false });
        });
        v.render(() => {
          const X = calc(), n = Math.max(1, X.C.length), exp = EN_P.map((p) => p * n);
          sH.setView([0.5, 26.5], [0, Math.max(...X.cc, ...exp) * 1.15 + 1]);
          sH.bars(X.cc, { x0: 1, dx: 1, color: 'orange', barWidth: 0.78 });
          sH.path(exp.map((y, i) => [i + 1, y]), { color: 'blue', width: 2 });
          sH.dots(exp.map((y, i) => [i + 1, y]), { r: 2.8, color: 'blue' });
          sH.corner(`ciphertext, L = ${X.K.length}: IC = ${icOf(X.cc).toFixed(4)}`, 'tr', { color: 'orange', weight: 700, size: 12 });
        });
        v.render(() => {
          const X = calc(), cur = curve(X.P), icP = icText(X.P);
          sI.hline(icP, { color: 'green', width: 1.6, dash: true });
          sI.hline(1 / 26, { color: 'red', width: 1.6, dash: true });
          sI.text('plaintext (English)', 26.6, icP + 0.0028, { size: 10.5, color: 'green', align: 'right', weight: 600 });
          sI.text('uniform random: 1/26', 26.6, 1 / 26 + 0.0028, { size: 10.5, color: 'red', align: 'right', weight: 600 });
          sI.path(cur.map((y, i) => [i + 1, y]), { color: 'orange', width: 2.2 });
          sI.dots(cur.map((y, i) => [i + 1, y]), { r: 3.2, color: 'orange' });
          sI.dot(X.K.length, icText(X.C), { r: 7, color: 'gold', label: 'your key', labelPos: 'ne' });
        });
        v.legend([['orange', 'mean IC of the ciphertext over 14 random keys of each length'], ['gold', 'your key', { dot: true }], ['green', 'plaintext IC', { dash: true }], ['red', '1/26', { dash: true }]]);
        v.readout(() => {
          const X = calc(); if (X.P.length < 4) return 'Type some text.';
          const t1 = vigC('attacking tonight', 'oculorhinolaryngology'), ok1 = t1 === 'OVNLQBPVT HZNZEUZ';
          const t2 = vigC('ATTACKATDAWN', 'LEMON'), ok2 = t2 === 'LXFOPVEFRNHR';
          return String.raw`Key space $26^{${X.K.length}} \approx ${sciText(Math.pow(26, X.K.length), 2)}$. Plaintext IC $${icText(X.P).toFixed(4)}$ → ciphertext IC $${icText(X.C).toFixed(4)}$ (English ≈ ${FRIEDMAN_EN} after Friedman; corpus value ${SUM_P2.toFixed(4)}; uniform $0.0385$).` + '\n' +
            `Self-test of this implementation: “attacking tonight” with key *oculorhinolaryngology* gives ${t1} ${ok1 ? '✓' : '✗'} (the Wikipedia example); ATTACKATDAWN with LEMON gives ${t2} ${ok2 ? '✓' : '✗'}.`;
        });
      },
    },

    // ================================================================== 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Index of coincidence and Kasiski examination',
      statement: String.raw`The **index of coincidence** of a text with letter counts $n_0,\dots,n_{25}$ and length $N$ is $\mathrm{IC}=\sum_i n_i(n_i-1)\big/N(N-1)$, the probability that two letters drawn without replacement agree: about $0.067$ for English and $1/26\approx 0.0385$ for uniformly random letters. For a Vigenère ciphertext with keyword length $L$, writing the text in rows of length $k$ and taking columns, the columns have $\mathrm{IC}\approx 0.067$ exactly when $L$ divides $k$, and close to $0.04$ otherwise. **Kasiski examination** finds $L$ differently: a string repeated in the plaintext at a distance divisible by $L$ is enciphered identically, so the distances between repeats in the ciphertext are mostly multiples of $L$. Once $L$ is known, each column is a shift cipher, solved by frequency analysis.`,
      idea: String.raw`Both attacks detect the *period* of the key, which is the only structure the cipher adds. A wrong period mixes several shifts into one column, flattening it towards uniform ($\mathrm{IC}\to0.04$); the right period leaves each column a shifted copy of English ($\mathrm{IC}\to0.067$), and the best of the 26 shifts of each column (maximizing its agreement with English) reveals the key letter. Kasiski needs repeats, so it works best on long texts; the IC needs only enough letters per column.`,
      caption: String.raw`Paste any Vigenère ciphertext (or pick an example). Left: the mean IC of the columns for every trial period — click a bar to try that period. Middle: for each factor $f$, how many Kasiski repeat distances it divides. Below: each column after shifting by its best key letter, against English (blue dots). The recovered key and plaintext are in the readout.`,
      deps: ['crypto-1.7'],
      tags: ['cryptanalysis', 'index of coincidence'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Friedrich Kasiski, 1863; Charles Babbage, c. 1846–54 (unpublished); William F. Friedman, 1922',
      scope: String.raw`needs a few dozen letters per column (a ciphertext many times longer than the key); Kasiski further needs repeated strings.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kasiski_examination' },
      viz(v) {
        const sA = v.stage({ x: [0, 31], y: [0, 0.085], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 330, xlabel: 'trial period k', ylabel: 'mean IC of the k columns', xticks: [1, 5, 10, 15, 20, 25, 30].map((x) => [x, String(x)]), yticks: [0, 0.02, 0.04, 0.0667, 0.08].map((y) => [y, y.toFixed(3)]) });
        const sB = v.stage({ x: [1, 31], y: [0, 10], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 330, xlabel: 'factor f', ylabel: 'repeat distances divisible by f', xticks: [2, 5, 10, 15, 20, 25, 30].map((x) => [x, String(x)]) });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, full: true });
        const L = PASSAGE;
        const examples = {
          a: { name: 'Gettysburg · LIBERTY', c: vigC(L, 'LIBERTY') },
          b: { name: '400 letters · UNION', c: vigC(L.slice(0, 400), 'UNION') },
          c: { name: '300 letters · CIPHER', c: vigC(L.slice(100, 400), 'CIPHER') },
        };
        const inp = v.input('Ciphertext', groups5(examples.a.c), { width: 380 });
        v.select('Example', Object.entries(examples).map(([value, e]) => ({ value, label: e.name })), 'a', { onChange: (k) => { inp.set(groups5(examples[k].c)); auto.set(true); } });
        const auto = v.toggle('Use the best period from the IC', true);
        const kSl = v.slider('Period $k$', 1, 30, 7, { int: true });
        sA.onClick((x) => { const k = Math.round(x); if (k >= 1 && k <= 30) { kSl.set(k); auto.set(false); } });
        let cache = null;
        const calc = () => {
          const C = norm(inp.value);
          if (cache && cache.C === C) return cache;
          const n = C.length, maxK = clamp(Math.floor(n / 6), 1, 30), ics = icByPeriod(C, maxK), kBest = pickPeriod(ics), kas = kasiski(C, 3, 30), kK = n >= 60 ? kasiskiPeriod(kas.fac) : 0;
          cache = { C, n, maxK, ics, kBest, kas, kK, icAll: icText(C) };
          return cache;
        };
        const period = (X) => (auto.value ? X.kBest : clamp(kSl.value, 1, Math.max(1, X.n)));
        v.render(() => {
          const X = calc(), k = period(X);
          sA.hline(FRIEDMAN_EN, { color: 'green', width: 1.6, dash: true });
          sA.hline(1 / 26, { color: 'red', width: 1.6, dash: true });
          sA.text('English 0.067', 30.8, FRIEDMAN_EN + 0.0045, { size: 10.5, color: 'green', align: 'right', weight: 600 });
          sA.text('random 0.0385', 30.8, 1 / 26 + 0.0045, { size: 10.5, color: 'red', align: 'right', weight: 600 });
          sA.bars(X.ics, { x0: 1, dx: 1, barWidth: 0.74, color: (y, i) => (i + 1 === k ? 'gold' : i + 1 === X.kBest ? 'green' : 'accent') });
          if (X.n >= 6) sA.text(`best: k = ${X.kBest}`, 1, 0.0795, { size: 11.5, color: 'green', align: 'left', weight: 700 });
        });
        v.render(() => {
          const X = calc(), fac = X.kas.fac.slice(2, 31), mx = Math.max(3, ...fac), k = period(X);
          sB.setView([1, 31], [0, mx * 1.18]);
          sB.bars(X.kas.fac.map((c, i) => (i < 2 ? 0 : c)).slice(1), { x0: 1, dx: 1, barWidth: 0.74, color: (y, i) => (i + 1 === k ? 'gold' : i + 1 === X.kK ? 'green' : 'accent') });
          sB.text(X.kK ? `Kasiski: f = ${X.kK}` : 'too few repeats', 30.6, mx * 1.1, { size: 11.5, color: 'green', align: 'right', weight: 700 });
        });
        v.render(() => {
          const X = calc(), P = pix(sC), { W } = P, k = period(X);
          const cols = columnsOf(X.C, k), shown = Math.min(k, 12), per = Math.min(6, shown), rows = Math.ceil(shown / per), cw = (W - 16) / per, ch = 108;
          cols.slice(0, shown).forEach((col, j) => {
            const cnt = counts(col), bs = bestShift(cnt), n = Math.max(1, col.length), x0 = 8 + (j % per) * cw, y0 = 6 + Math.floor(j / per) * (ch + 10);
            const sh = cnt.map((_, i) => cnt[(i + bs.s) % 26]);
            const mx = Math.max(...sh, ...EN_P.map((p) => p * n), 1), bw = (cw - 18) / 26;
            P.rect(x0, y0, cw - 8, ch, { fill: 'accent', fillAlpha: 0.04, color: 'faint', width: 1, radius: 6 });
            P.text(`column ${j + 1}  →  key ${A[bs.s]}`, x0 + 8, y0 + 11, { size: 11, weight: 700, color: 'green', align: 'left', halo: false });
            sh.forEach((c, i) => { const h = (c / mx) * (ch - 40); if (h > 0) P.rect(x0 + 9 + i * bw + 0.5, y0 + ch - 14 - h, bw - 1, h, { fill: 'orange', fillAlpha: 0.65, stroke: false }); P.dot(x0 + 9 + (i + 0.5) * bw, y0 + ch - 14 - (EN_P[i] * n / mx) * (ch - 40), { r: 1.8, color: 'blue' }); });
            P.line(x0 + 9, y0 + ch - 14, x0 + 9 + 26 * bw, y0 + ch - 14, { color: 'faint', width: 1 });
            P.text('A', x0 + 9 + 0.5 * bw, y0 + ch - 6, { size: 8.5, color: 'muted', align: 'center', halo: false });
            P.text('Z', x0 + 9 + 25.5 * bw, y0 + ch - 6, { size: 8.5, color: 'muted', align: 'center', halo: false });
          });
          if (k > shown) P.text(`… and ${k - shown} more columns`, W - 8, rows * (ch + 10) + 4, { size: 11, color: 'muted', align: 'right', halo: false });
        });
        v.legend([['orange', 'column letters after undoing its best shift'], ['blue', 'English letter counts (expected)', { dot: true }], ['gold', 'period in use'], ['green', 'detected']]);
        v.readout(() => {
          const X = calc(); if (X.n < 20) return 'Paste at least 20 letters of ciphertext.';
          const k = period(X), key = recoverKey(X.C, k).map((s) => A[s]).join(''), plain = vigC(X.C, key, true);
          const reps = X.kas.reps.slice(0, 4).map((r) => `${r.seq.length > 8 ? r.seq.slice(0, 8) + '…' : r.seq} (${r.dist} = ${factorStr(r.dist) || r.dist})`).join(', ');
          return String.raw`Whole-text IC $${X.icAll.toFixed(4)}$ ${X.icAll > 0.06 ? '(looks monoalphabetic)' : '(flattened: polyalphabetic)'}. Best period by IC: **${X.kBest}** (mean column IC $${X.ics[X.kBest - 1].toFixed(4)}$); Kasiski: **${X.kK || '—'}** from ${X.kas.reps.length} repeated strings.` + '\n' +
            `Key for period ${k}: **${key}** — decrypts to “${groups5(plain.slice(0, 60))} …”` + (reps ? `\nLongest repeats (distance = factors): ${reps}.` : '');
        });
      },
    },
  ],
};
