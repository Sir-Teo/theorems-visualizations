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

    // ================================================================== 1.9
    {
      num: '1.9',
      kind: 'Invention',
      name: 'The Enigma machine and its cryptanalysis',
      statement: String.raw`The **Enigma** (Arthur Scherbius, patent 1918) is an electromechanical cipher machine. Each key press sends current through a plugboard that swaps pairs of letters (ten pairs in standard German practice), then through three wired rotors (chosen from five, each with a ring setting and a start position), into a **reflector** that sends it back through the rotors and the plugboard to a lamp. Before every letter the right rotor advances one step; it carries the middle rotor along when it passes its notch, and the middle rotor, at its own notch, advances itself *and* the left rotor (the “double step”). The result is a different substitution for every letter. Because the reflector is an involution without fixed points, Enigma is **reciprocal** (typing the ciphertext with the same settings decrypts it) and **no letter is ever enciphered as itself**. The latter, with guessed plaintext (a *crib*), was one of the weaknesses that Rejewski’s permutation methods (1932) and later Bletchley Park exploited.`,
      idea: String.raw`Each rotor is a fixed permutation of 26 contacts, rotated by its position; the machine applies $\mathrm{plug}\circ R_1^{-1}R_2^{-1}R_3^{-1}\,U\,R_3R_2R_1\circ\mathrm{plug}$ with rotors moved before each letter, so it is a polyalphabetic cipher with period $26\cdot25\cdot26=16\,900$ for single-notch rotors. The key space is huge (about $1.6\times10^{20}$ settings with five rotors), yet the machine is insecure because of structure: the reflector forbids self-encipherment, so every crib position with a letter matching the ciphertext at the same place is *impossible*; stereotyped messages supplied the cribs, and daily-key procedures leaked more. The lesson is Kerckhoffs’s: the design was recovered, so only the key counted.

At one fixed rotor state, let A be the bijection carrying a keyboard contact through the plugboard and forward rotor path. Composition theorem alg-1.15 makes the return path $A^{-1}$ and the whole letter map $A^{-1}UA$ a bijection. Associativity gives its square $A^{-1}U^2A=\mathrm{id}$. If it fixed x, applying A would make U fix $A(x)$, contradicting the fixed-point-free reflector. These are statewise properties; the rotor stepping must still be synchronized for decryption.`,
      caption: String.raw`Choose rotors, rings, start positions and plugboard pairs, type a message, and slide through the key presses: the diagram shows the current through the machine for the selected letter (gold going in, green coming back through the reflector). The strip shows the windows stepping, including the double step. Below, slide a crib along the ciphertext: red cells are positions the reflector rules out. **Load 1930 manual** sets the settings of the published test message.`,
      deps: ['crypto-1.5', 'alg-1.15'],
      tags: ['Enigma', 'rotor machine'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Arthur Scherbius, patent 1918; broken from 1932 by Marian Rejewski, then at Bletchley Park (Turing, Welchman)',
      scope: String.raw`Enigma I (Army/Air Force, three rotors chosen from five, reflectors A, B, C; no Navy M4 fourth rotor). The sample message is invented for illustration.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Enigma_machine' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, full: true });
        const sS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 152, full: true });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 176, full: true });
        const names = ['I', 'II', 'III', 'IV', 'V'], fmtL = (x) => A[Math.round(x)];
        const rotL = v.select('Left rotor', names, 'I'), rotM = v.select('Middle', names, 'II'), rotR = v.select('Right', names, 'III');
        const refl = v.select('Reflector', ['A', 'B', 'C'], 'B');
        const ring = [0, 1, 2].map((i) => v.slider(`Ring ${'LMR'[i]}`, 0, 25, 0, { int: true, fmt: (x) => `${Math.round(x) + 1} (${A[Math.round(x)]})` }));
        const start = [0, 1, 2].map((i) => v.slider(`Start ${'LMR'[i]}`, 0, 25, [0, 3, 18][i], { int: true, fmt: fmtL }));
        const plugIn = v.input('Plugboard', 'AM FI NV PS TU WZ', { width: 190 });
        const msg = v.input('Message', 'ANX WETTERBERICHT KEINE BESONDEREN EREIGNISSE', { width: 330 });
        const key = v.slider('Key press #', 1, 60, 5, { int: true });
        const cribSel = v.select('Crib', ['WETTER', 'WETTERBERICHT', 'KEINEBESONDERENEREIGNISSE'], 'WETTERBERICHT');
        const cribPos = v.slider('Crib position', 0, 40, 3, { int: true });
        const load = (c) => { rotL.set(c.rotors[0]); rotM.set(c.rotors[1]); rotR.set(c.rotors[2]); refl.set(c.refl); c.rings.forEach((r, i) => ring[i].set(r)); c.pos.forEach((r, i) => start[i].set(r)); plugIn.set(c.plug); msg.set(c.msg); };
        const MANUAL = { rotors: ['II', 'I', 'III'], refl: 'A', rings: [23, 12, 21], pos: [0, 1, 11], plug: 'AM FI NV PS TU WZ', msg: 'GCDSE AHUGW TQGRK VLFGX UCALX VYMIG MMNMF DXTGN VHVRM MEVOU YFZSL RHDRR XFJWC FHUHM UNZEF RDISI KBGPM YVXUZ' };
        v.button('Load 1930 manual', () => load(MANUAL));
        v.button('Reset', () => load({ rotors: ['I', 'II', 'III'], refl: 'B', rings: [0, 0, 0], pos: [0, 3, 18], plug: 'AM FI NV PS TU WZ', msg: 'ANX WETTERBERICHT KEINE BESONDEREN EREIGNISSE' }));
        // published test vectors, independent of the controls
        const run0 = (cfg, text) => makeEnigma(cfg).run(text);
        const tests = [
          { name: 'rotors I II III, UKW B, rings AAA, start AAA: AAAAA → BDZGO', ok: run0({ rotors: ['I', 'II', 'III'], refl: 'B', rings: [0, 0, 0], pos: [0, 0, 0] }, 'AAAAA') === 'BDZGO', src: 'Wikipedia, Enigma rotor details' },
          { name: 'double step ADU → ADV → AEW → BFX → BFY', ok: (() => { const E = makeEnigma({ rotors: ['I', 'II', 'III'], refl: 'B', rings: [0, 0, 0], pos: [0, 3, 20] }); const s = [posName(E.pos)]; for (let i = 0; i < 4; i++) { E.press(0); s.push(posName(E.pos)); } return s.join(' ') === 'ADU ADV AEW BFX BFY'; })(), src: 'Wikipedia, Enigma rotor details' },
          { name: '1930 manual message: key PKPJXI → ABLABL, then 84 letters → FEIND LIQEI NFANT …', ok: (() => { const c = { rotors: ['II', 'I', 'III'], refl: 'A', rings: [23, 12, 21], pos: [5, 14, 11], plug: 'AM FI NV PS TU WZ' }; const k = run0(c, 'PKPJXI'); const p = run0({ ...c, pos: [0, 1, 11] }, norm(MANUAL.msg)); return k === 'ABLABL' && p === 'FEINDLIQEINFANTERIEKOLONNEBEOBAQTETXANFANGSUEDAUSGANGBAERWALDEXENDEDREIKMOSTWAERTSNEUSTADT'; })(), src: 'Enigma instruction manual 1930, test message (cryptocellar.org)' },
        ];
        const cfgNow = () => ({ rotors: [rotL.value, rotM.value, rotR.value], refl: refl.value, rings: ring.map((r) => r.value), pos: start.map((r) => r.value), plug: plugIn.value });
        let cache = null;
        const sim = () => {
          const cfg = cfgNow(), text = msg.value.toUpperCase(), sig = JSON.stringify(cfg) + '|' + text;
          if (cache && cache.sig === sig) return cache;
          const E = makeEnigma(cfg), L = norm(text), steps = [], init = cfg.pos.slice(); let prev = init;
          for (const ch of L) { const r = E.press(code(ch)); steps.push({ x: code(ch), out: r.out, trace: r.trace, pos: r.pos, prev }); prev = r.pos; }
          // stress test: no letter is enciphered as itself
          const S = makeEnigma(cfg); let fixed = 0; const NS = 26 * 400; for (let i = 0; i < NS; i++) if (S.press((i * 7 + (i >> 5)) % 26).out === (i * 7 + (i >> 5)) % 26) fixed++;
          cache = { sig, cfg, L, steps, ct: steps.map((s) => A[s.out]).join(''), fixed, NS, plug: parsePlug(cfg.plug) };
          return cache;
        };
        v.render(() => {
          const X = sim(), P = pix(sD), { W, H } = P;
          const t = clamp(key.value, 1, Math.max(1, X.steps.length)) - 1, S = X.steps[t] || null;
          const top = 66, bot = 28, rh = (H - top - bot) / 25, Y = (i) => top + i * rh;
          const r3 = 0.17 * W, r2 = 0.36 * W, r1 = 0.55 * W, r0 = 0.74 * W, kb = 0.93 * W;
          const pos = S ? S.pos : X.cfg.pos, prev = S ? S.prev : X.cfg.pos;
          const E = makeEnigma({ ...X.cfg, pos });
          const rails = [r0, r1, r2, r3];
          // rotor boxes with headers
          const rotX = [[r3, r2], [r2, r1], [r1, r0]];
          rotX.forEach(([xl, xr], i) => {
            const moved = pos[i] !== prev[i], nm = X.cfg.rotors[i], w = xr - xl;
            P.rect(xl, top - 8, w, H - top - bot + 16, { fill: 'accent', fillAlpha: 0.04, color: 'faint', width: 1, radius: 8 });
            P.text(`${['left', 'middle', 'right'][i]} rotor ${nm}`, (xl + xr) / 2, 12, { size: 11.5, weight: 700, color: 'muted', align: 'center', halo: false });
            P.rect((xl + xr) / 2 - 17, 22, 34, 30, { fill: moved ? 'gold' : 'accent', fillAlpha: moved ? 0.4 : 0.1, color: moved ? 'gold' : 'faint', width: 2, radius: 6 });
            P.text(A[pos[i]], (xl + xr) / 2, 38, { size: 20, weight: 800, color: 'ink', align: 'center', halo: false });
            if (pos[i] === E.notch(i)) P.text('▲ notch', (xl + xr) / 2 + 52, 38, { size: 10.5, weight: 700, color: 'orange', align: 'center', halo: false });
            P.text(`ring ${(X.cfg.rings[i] + 1)}`, (xl + xr) / 2 - 48, 38, { size: 10, color: 'muted', align: 'center', halo: false });
          });
          P.text('reflector ' + X.cfg.refl, r3 - 38, 12, { size: 11.5, weight: 700, color: 'muted', align: 'center', halo: false });
          P.text('plugboard', (r0 + kb) / 2, 12, { size: 11.5, weight: 700, color: 'muted', align: 'center', halo: false });
          P.text('keys / lamps', kb, 12, { size: 11.5, weight: 700, color: 'muted', align: 'center', halo: false });
          // rotor wires (all 26) in the machine frame
          const fw = [E.map(0), E.map(1), E.map(2)];
          rotX.forEach(([xl, xr], i) => { for (let x = 0; x < 26; x++) P.line(xr, Y(x), xl, Y(fw[i][x]), { color: 'muted', width: 0.8, alpha: 0.28 }); });
          // reflector arcs
          const rf = E.reflMap();
          for (let a = 0; a < 26; a++) { const b = rf[a]; if (b > a) { const d = 8 + (b - a) * rh * 0.22, pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, yy = (1 - u) * (1 - u) * Y(a) + 2 * u * (1 - u) * ((Y(a) + Y(b)) / 2) + u * u * Y(b), xx = (1 - u) * (1 - u) * r3 + 2 * u * (1 - u) * (r3 - 2 * d) + u * u * r3; pts.push([xx, yy]); } P.path(pts, { color: 'muted', width: 0.9, alpha: 0.3 }); } }
          // plugboard wires and keyboard
          const pl = X.plug.map;
          for (let i = 0; i < 26; i++) P.line(kb, Y(i), r0, Y(pl[i]), { color: pl[i] !== i ? 'purple' : 'muted', width: pl[i] !== i ? 1.2 : 0.7, alpha: pl[i] !== i ? 0.55 : 0.25 });
          rails.forEach((rx) => { for (let i = 0; i < 26; i++) P.dot(rx, Y(i), { r: 1.7, color: 'muted' }); });
          for (let i = 0; i < 26; i++) { P.dot(kb, Y(i), { r: 5, color: 'faint', hollow: true }); P.text(A[i], kb + 14, Y(i), { size: 9.5, color: 'muted', weight: 600, align: 'left', halo: false }); }
          // the path
          if (S) {
            const [x, p1, r2v, r1v, r0v, u, l0, l1, l2, out] = S.trace, G = 'gold', Gr = 'green', w = 2.6;
            P.line(kb, Y(x), r0, Y(p1), { color: G, width: w });
            P.line(r0, Y(p1), r1, Y(r2v), { color: G, width: w }); P.line(r1, Y(r2v), r2, Y(r1v), { color: G, width: w }); P.line(r2, Y(r1v), r3, Y(r0v), { color: G, width: w });
            const d = 8 + Math.abs(u - r0v) * rh * 0.22, pts = [];
            for (let k = 0; k <= 16; k++) { const q = k / 16, yy = (1 - q) * (1 - q) * Y(r0v) + 2 * q * (1 - q) * ((Y(r0v) + Y(u)) / 2) + q * q * Y(u), xx = (1 - q) * (1 - q) * r3 + 2 * q * (1 - q) * (r3 - 2 * d) + q * q * r3; pts.push([xx, yy]); }
            P.path(pts, { color: 'orange', width: w });
            P.line(r3, Y(u), r2, Y(l0), { color: Gr, width: w }); P.line(r2, Y(l0), r1, Y(l1), { color: Gr, width: w }); P.line(r1, Y(l1), r0, Y(l2), { color: Gr, width: w });
            P.line(r0, Y(l2), kb, Y(out), { color: Gr, width: w });
            P.dot(kb, Y(x), { r: 6.5, color: G }); P.dot(kb, Y(out), { r: 6.5, color: Gr });
            const lab = (rx, row, col, side) => P.text(A[row], rx + side * 8, Y(row), { size: 9.5, weight: 800, color: col, align: side > 0 ? 'left' : 'right' });
            lab(r0, p1, G, 1); lab(r0, l2, Gr, 1); lab(r1, r2v, G, 1); lab(r1, l1, Gr, 1); lab(r2, r1v, G, 1); lab(r2, l0, Gr, 1); lab(r3, r0v, G, 1); lab(r3, u, Gr, 1);
            P.text(`${A[x]} → ${A[out]}`, (r3 + r2) / 2, H - 9, { size: 12.5, weight: 700, color: 'ink', align: 'center', halo: false });
          }
        });
        v.render(() => {
          const X = sim(), P = pix(sS), { W } = P, n = X.steps.length, t = clamp(key.value, 1, Math.max(1, n)) - 1, cols = 28;
          const lm = 78, cw = Math.min(24, (W - lm - 8) / cols), t0 = clamp(t - 13, 0, Math.max(0, n - cols));
          const rows = [['plain', (s) => A[s.x]], ['cipher', (s) => A[s.out]], ['left', (s) => A[s.pos[0]]], ['middle', (s) => A[s.pos[1]]], ['right', (s) => A[s.pos[2]]]];
          rows.forEach(([lab, f], r) => P.text(lab, 8, 14 + r * 24, { size: 11, weight: 700, color: r < 2 ? 'ink' : 'muted', align: 'left', halo: false }));
          for (let c = 0; c < cols && t0 + c < n; c++) {
            const s = X.steps[t0 + c], x = lm + c * cw;
            if (t0 + c === t) P.rect(x, 1, cw, 128, { fill: 'gold', fillAlpha: 0.18, color: 'gold', width: 1.6, radius: 4 });
            [0, 1].forEach((i) => { if (s.pos[i] !== s.prev[i]) P.rect(x + 1, 2 + 24 * (2 + i) + 0, cw - 2, 24, { fill: i === 0 ? 'red' : 'orange', fillAlpha: 0.28, stroke: false, radius: 3 }); });
            rows.forEach(([, f], r) => P.text(f(s), x + cw / 2, 14 + r * 24, { size: 13, weight: r < 2 ? 700 : 600, color: r === 1 ? 'orange' : r === 0 ? 'blue' : 'ink', align: 'center', halo: false }));
            if (cw > 14 && (t0 + c) % 5 === 4) P.text(String(t0 + c + 1), x + cw / 2, 130, { size: 8.5, color: 'muted', align: 'center', halo: false });
          }
          P.text('red / orange cells: the left / middle rotor stepped on that key press', W - 8, 145, { size: 10, color: 'muted', align: 'right', halo: false });
        });
        const cribGeom = () => { const X = sim(), crib = cribSel.value, N = X.ct.length, m = N - crib.length + 1; const bad = []; for (let p = 0; p < Math.max(0, m); p++) { let b = false; for (let i = 0; i < crib.length; i++) if (crib[i] === X.ct[p + i]) { b = true; break; } bad.push(b); } return { X, crib, N, m, bad, truth: X.L.indexOf(crib) }; };
        v.render(() => {
          const G = cribGeom(), P = pix(sC), { W } = P, N = Math.min(G.N, 90), lm = 70, cw = Math.min(18, (W - lm - 8) / Math.max(N, 1));
          const p = clamp(cribPos.value, 0, Math.max(0, G.m - 1));
          P.text('ciphertext', 8, 22, { size: 11, weight: 700, color: 'orange', align: 'left', halo: false });
          P.text('crib', 8, 54, { size: 11, weight: 700, color: 'blue', align: 'left', halo: false });
          for (let i = 0; i < N; i++) P.text(G.X.ct[i], lm + (i + 0.5) * cw, 22, { size: 12.5, weight: 700, color: 'orange', align: 'center', halo: false });
          for (let i = 0; i < G.crib.length && p + i < N; i++) {
            const clash = G.crib[i] === G.X.ct[p + i], x = lm + (p + i) * cw;
            if (clash) P.rect(x, 8, cw, 58, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.4, radius: 3 });
            P.text(G.crib[i], x + cw / 2, 54, { size: 12.5, weight: 700, color: clash ? 'red' : 'blue', align: 'center', halo: false });
          }
          P.text(G.bad[p] ? '✗ impossible here: a plaintext letter would equal its ciphertext letter' : '✓ no letter clashes: this alignment survives', lm, 82, { size: 12, weight: 700, color: G.bad[p] ? 'red' : 'green', align: 'left', halo: false });
          P.text('every alignment of the crib:', 8, 112, { size: 11, weight: 700, color: 'muted', align: 'left', halo: false });
          const sw = Math.min(16, (W - lm - 8) / Math.max(G.m, 1));
          G.bad.forEach((b, k) => {
            const x = lm + k * sw;
            P.rect(x + 1, 124, sw - 2, 22, { fill: b ? 'red' : 'green', fillAlpha: b ? 0.55 : 0.5, stroke: false, radius: 3 });
            if (k === G.truth) P.rect(x, 121, sw, 28, { fill: false, color: 'ink', width: 2, radius: 4 });
            if (k === p) P.rect(x - 1, 119, sw + 2, 32, { fill: false, color: 'gold', width: 2.4, radius: 4 });
          });
          if (G.truth >= 0) P.text('▲ true position', lm + G.truth * sw + sw / 2, 162, { size: 10.5, weight: 700, color: 'ink', align: 'center', halo: false });
        });
        v.readout(() => {
          const X = sim(), G = cribGeom(), cfg = X.cfg, dup = new Set(cfg.rotors).size < 3;
          const surv = G.bad.filter((b) => !b).length, exp = Math.max(0, G.m) * Math.pow(25 / 26, G.crib.length);
          const tl = tests.map((t) => `${t.ok ? '✓' : '✗'} ${t.name} (${t.src})`).join('\n');
          return (dup ? '**Warning:** the same rotor is used twice — impossible on a real machine.\n' : '') +
            String.raw`Message → ciphertext: ${groups5(X.ct.slice(0, 55))}${X.ct.length > 55 ? ' …' : ''}. Typing it back at the same start settings gives ${makeEnigma(cfg).run(X.ct) === X.L ? '**the plaintext ✓ (reciprocal)**' : '✗'}.` + '\n' +
            String.raw`Self-encipherment: **${X.fixed}** of ${X.NS} test key presses mapped a letter to itself (none can, whatever the settings). Crib ${G.crib}: ${surv} of ${Math.max(0, G.m)} alignments survive; a random text would leave about $(25/26)^{${G.crib.length}}\cdot${Math.max(0, G.m)} \approx ${exp.toFixed(1)}$.` + '\n' +
            'Simulator checked against published vectors:\n' + tl;
        });
      },
    },

    // ================================================================== 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Unicity distance',
      statement: String.raw`Let a cipher with key space $\mathcal K$ encrypt text from a language of redundancy $D = \log_2|\Sigma| - h$ bits per letter, where $h$ is the language’s entropy rate. After observing $n$ ciphertext letters the attacker still faces the **key equivocation** $H(K\mid C_1\dots C_n)$; under Shannon’s random-cipher model it falls by about $D$ bits per letter, $H(K\mid C^n)\approx H(K)-nD$. The **unicity distance** $U = H(K)/D$ is the length at which the equivocation reaches $0$: beyond it, essentially one key (one meaningful decryption) remains, so an unbounded attacker can in principle recover the key; below it, many keys give equally plausible plaintexts. For simple substitution on English, $H(K)=\log_2 26!\approx 88.4$ bits and, with the textbook value $D\approx 3.2$, giving $U\approx 28$ letters.`,
      idea: String.raw`Redundancy is what lets a ciphertext identify its key: if all letter strings were equally likely (the one-time pad’s situation) every key would remain consistent with every ciphertext and $U=\infty$. For a real language, only a fraction $2^{-nD}$ of the $26^n$ strings are meaningful, so of the $|\mathcal K|$ wrong keys about $|\mathcal K|\,2^{-nD}$ produce a meaningful-looking decryption (“spurious keys”); this drops below one at $n=H(K)/D$. The picture computes the equivocation *exactly*, by enumerating all $26^L$ keys of a short Vigenère cipher and weighting each decryption by its probability under a bigram model of English.`,
      caption: String.raw`Choose a key length $L$ and the number $n$ of ciphertext letters the attacker has seen. The thick curve is the exact posterior entropy of the key, averaged over several plaintext windows (thin: the sample on the right); the dashed line is Shannon’s $H(K)-nD$. The table lists the most probable keys for the sample: at small $n$ many keys give plausible plaintexts, past the unicity distance one key wins.`,
      deps: ['crypto-1.5', 'info-11.9'],
      tags: ['unicity distance', 'entropy', 'redundancy'],
      refs: ['Boneh–Shoup ch. 2'],
      credit: 'Claude Shannon, “Communication Theory of Secrecy Systems”, 1949',
      scope: String.raw`computed for a Vigenère cipher with $L\le 4$ key letters and a *bigram* model of English ($D\approx 1.4$ bits per letter, estimated from the corpus); real English has more redundancy (the textbook value is $D\approx 3.2$, and Shannon’s 1951 bounds of 0.6–1.3 bits/letter on the entropy rate imply $D\gtrsim3.4$), so real unicity distances are shorter.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unicity_distance' },
      viz(v) {
        const D = Math.log2(26) - H2;
        const s = v.stage({ x: [0, 40], y: [0, 20], axes: 'box', gutter: true, height: 350, weight: 1.15, minWidth: 360, xlabel: 'ciphertext letters seen, n', ylabel: 'key equivocation H(K | c₁…cₙ) in bits', xticks: [0, 5, 10, 15, 20, 25, 30, 35, 40].map((x) => [x, String(x)]) });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 1, minWidth: 340 });
        const Lsel = v.select('Key length $L$ (letters)', [{ value: 1, label: '1 · 26 keys' }, { value: 2, label: '2 · 676' }, { value: 3, label: '3 · 17 576' }, { value: 4, label: '4 · 456 976' }], 3);
        const nS = v.slider('Ciphertext letters seen $n$', 0, 40, 6, { int: true });
        let off = 40; v.button('New sample', () => { off += 53; });
        const cache = {};
        const data = () => {
          const L = Lsel.value, id = `${L}|${off}`;
          if (cache[id]) return cache[id];
          const Wn = L === 4 ? 3 : 6, curves = [], samples = [];
          for (let w = 0; w < Wn; w++) {
            const o = (off + 61 * w) % (PASSAGE.length - 45), plain = PASSAGE.slice(o, o + 40), key = randomKey(v.rng(off * 13 + w * 7 + L), L), ct = vigC(plain, key);
            const codes = [...ct].map(code); curves.push(equivocation(codes, L, 40).H); samples.push({ plain, key, ct, codes });
          }
          const mean = Array.from({ length: 41 }, (_, i) => curves.reduce((a, c) => a + c[i], 0) / curves.length);
          return (cache[id] = { L, curves, mean, sample: samples[0] });
        };
        v.render(() => {
          const d = data(), HK = d.L * Math.log2(26), n = nS.value;
          s.setView([0, 40], [0, Math.max(20, HK + 1)]);
          s.path(Array.from({ length: 41 }, (_, i) => [i, Math.max(0, HK - i * D)]), { color: 'red', width: 2, dash: true });
          s.path(Array.from(d.curves[0], (y, i) => [i, y]), { color: 'orange', width: 1.4, alpha: 0.8 });
          s.path(Array.from(d.mean, (y, i) => [i, y]), { color: 'accent', width: 3.4 });
          const U = HK / D; if (U < 40) { s.vline(U, { color: 'green', width: 1.4, dash: true }); s.text(`U = ${U.toFixed(1)}`, U + 0.5, Math.max(20, HK + 1) * 0.55, { size: 11.5, color: 'green', align: 'left', weight: 700 }); }
          s.vline(n, { color: 'gold', width: 2 });
          s.dot(n, d.mean[n], { r: 6, color: 'accent' });
          s.dot(n, d.curves[0][n], { r: 4.5, color: 'orange' });
        });
        v.legend([['accent', 'exact equivocation, mean of windows'], ['orange', 'this sample'], ['red', 'Shannon: H(K) − nD', { dash: true }], ['green', 'unicity distance', { dash: true }]]);
        v.render(() => {
          const d = data(), P = pix(sL), { W } = P, n = nS.value, smp = d.sample, L = d.L;
          const keyLab = `sample key ${smp.key}`;
          P.text(`ciphertext seen (n = ${n}):`, 10, 16, { size: 11.5, weight: 700, color: 'orange', align: 'left', halo: false });
          letterRow(P, smp.ct.slice(0, n) || '—', 10, 36, 10.5, () => 'orange', { size: 13 });
          P.text(`most probable keys for these ${n} letters (${keyLab}):`, 10, 66, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false });
          if (n < 1) { P.text('(all keys equally likely: n = 0)', 10, 92, { size: 12, color: 'muted', align: 'left', halo: false }); return; }
          const top = topAt(smp.codes, L, n, 7), cw = 7.4, fit = Math.max(6, Math.floor((W - 150 - 24 - L * 9) / cw));
          top.forEach((r, i) => {
            const y = 92 + i * 34, isT = r.key === smp.key, dec = vigC(smp.ct.slice(0, n), r.key, true);
            P.rect(8, y - 13, W - 16, 30, { fill: isT ? 'green' : 'accent', fillAlpha: isT ? 0.14 : 0.04, color: isT ? 'green' : 'faint', width: 1, radius: 6 });
            P.text(r.key + (isT ? ' ★' : ''), 16, y, { size: 12.5, weight: 700, color: isT ? 'green' : 'ink', align: 'left', halo: false });
            const shown = dec.length > fit ? dec.slice(0, fit - 1) + '…' : dec;
            letterRow(P, shown, 16 + 26 + L * 9, y, cw, () => (isT ? 'green' : 'ink'), { size: 12, weight: 600 });
            const bw = 52; P.rect(W - 18 - bw - 44, y - 4, bw, 8, { fill: 'accent', fillAlpha: 0.12, stroke: false, radius: 2 });
            P.rect(W - 18 - bw - 44, y - 4, Math.max(1.5, bw * r.post), 8, { fill: isT ? 'green' : 'accent', fillAlpha: 0.7, stroke: false, radius: 2 });
            P.text(`${(100 * r.post).toFixed(r.post < 0.1 ? 1 : 0)}%`, W - 18 - 38, y, { size: 11, weight: 700, color: isT ? 'green' : 'muted', align: 'left', halo: false });
          });
        });
        v.readout(() => {
          const d = data(), HK = d.L * Math.log2(26), n = nS.value, Hn = d.mean[n], Hs = d.curves[0][n];
          const cross = d.mean.findIndex((h, i) => i > 0 && h < 1);
          return String.raw`$H(K) = ${d.L}\log_2 26 = ${HK.toFixed(1)}$ bits; redundancy of the bigram model $D = \log_2 26 - h = ${Math.log2(26).toFixed(2)} - ${H2.toFixed(2)} = ${D.toFixed(2)}$ bits/letter, so $U = H(K)/D \approx ${(HK / D).toFixed(1)}$ letters.` + '\n' +
            String.raw`At $n=${n}$: equivocation ${Hn.toFixed(1)} bits on average (${Hs.toFixed(1)} for this sample) — about $2^{${Hn.toFixed(1)}} \approx ${sciText(Math.pow(2, Hn), 2)}$ equally plausible keys. Measured: it drops below one bit at $n = ${cross > 0 ? cross : '>40'}$.` + '\n' +
            String.raw`Full substitution cipher: $H(K)=\log_2 26! = ${LOG2_FACT26.toFixed(1)}$ bits, so under this bigram model $U\approx ${(LOG2_FACT26 / D).toFixed(0)}$ letters; with the usual textbook value $D\approx3.2$ bits/letter (an English entropy rate of about 1.5 bits/letter; Shannon’s 1951 guessing experiments bounded it between about 0.6 and 1.3, which would make $D$ larger and $U$ shorter) it is $88.4/3.2\approx 28$. A one-time pad has $D$ irrelevant: its keys are as long as the text and $U=\infty$.`;
        });
      },
    },

    // ================================================================== 1.11
    {
      num: '1.11',
      kind: 'Principle',
      name: 'Principles of modern cryptography',
      statement: String.raw`Modern cryptography replaces the invent-and-break cycle of classical ciphers by three principles. (1) **Formal definitions** of security: state precisely the adversary’s capabilities (the threat model) and what it means for the scheme to be secure against it. (2) **Precise assumptions**: any unproven hardness assumption the scheme needs (a function is one-way, a block cipher is pseudorandom, factoring is hard) is stated explicitly and can be studied on its own. (3) **Rigorous proofs of security** by reduction: any adversary that breaks the scheme according to the definition yields an adversary that violates the assumption. Together with Kerckhoffs’s principle (item 1.2), the scheme itself is public and only the key is secret.`,
      idea: String.raw`Each classical failure came from skipping one of the steps. Without a definition, “nobody has broken it” was taken for security (Vigenère, for about three centuries). Without a stated threat model, designers ignored cribs and procedures (Enigma). Without explicit assumptions, a key length that was once enough silently stopped being enough (DES, 56 bits). Without proofs, every scheme stood or fell with the cleverness of its next attacker. A reduction turns “we could not break it” into “breaking it means solving a problem we have studied far longer, or one that is believed hard”.`,
      caption: String.raw`Click a box of the flow chart to read the historical failure that motivated it; click a cell of the table to see how each cipher fares against the four steps. Green ✓ = done properly, gold ~ = informal or implicit, red ✗ = missing. The table is the author’s summary of what each design’s own publication claimed, not a measurement.`,
      deps: ['crypto-1.2'],
      tags: ['principles', 'proofs'],
      refs: ['Katz–Lindell §1.4'],
      scope: String.raw`a summary of the historical record (sources: Wikipedia articles on the Vigenère cipher, Kasiski examination, Enigma, EFF DES cracker; cryptocellar.org); the table’s judgements are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Provable_security' },
      viz(v) {
        const sG = v.stage({ x: [0, 10], y: [0, 4.4], axes: false, height: 250, full: true });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 348, full: true });
        const ST = {
          T: { name: 'Threat model', col: 0, text: String.raw`**Threat model** — what can the adversary see and do? Enigma’s designers planned for an enemy holding ciphertext only. The Allies also had guessed plaintext (cribs), captured keys and operator habits: Rejewski broke the plugboard Enigma around 1932 using the way daily keys and message keys were used, and the reflector’s “no letter maps to itself” rule let cribs be placed (item 1.9). Modern practice names the attacker’s powers: eavesdropping, chosen plaintexts, chosen ciphertexts, bounded running time.` },
          D: { name: 'Definition', col: 1, text: String.raw`**Definition** — what exactly does “secure” mean? The Vigenère cipher was called *le chiffre indéchiffrable*; it stayed in use while no one published a break, though Babbage (c. 1854, unpublished) and then Kasiski (1863) broke it (items 1.7–1.8). “Unbroken so far” is not a claim one can prove or refute. A definition (perfect secrecy, indistinguishability) says what a proof must show and what an attack must achieve.` },
          S: { name: 'Assumption', col: 2, text: String.raw`**Assumption** — unproven but explicit. DES used a 56-bit key whose sufficiency was an unstated assumption about attackers’ resources; in 1998 EFF’s Deep Crack, built for under \$250,000, found a DES key in 56 hours (item 1.4). Modern schemes list what they rely on (AES is a pseudorandom permutation, factoring is hard) and choose parameters with a margin, so that when an assumption weakens it is clear what to replace.` },
          C: { name: 'Construction', col: null, text: String.raw`**Construction** — public by Kerckhoffs’s principle (1883): the scheme is published and only the key is secret, so it can be scrutinised, standardised and re-keyed after a leak (item 1.2). Secret designs fall when one device or one person is lost, and cannot be repaired by changing a key.` },
          P: { name: 'Proof by reduction', col: 3, text: String.raw`**Proof by reduction** — if an adversary $\mathcal A$ breaks the scheme, build from it an adversary $\mathcal B$ that violates the assumption, with comparable running time and success probability. Shift, substitution, Vigenère and Enigma had nothing like it: each fell to a method its designers had not considered. A reduction converts “our attackers failed” into “breaking this requires solving a problem many have attacked in vain”.` },
          X: { name: 'Cryptanalysis', col: null, text: String.raw`**Cryptanalysis** — public scrutiny feeds back into every step: al-Kindi’s frequency analysis (9th century) retired monoalphabetic ciphers, Kasiski’s and Friedman’s period tests retired Vigenère, Rejewski and Bletchley Park retired Enigma, EFF retired 56-bit DES. Each break revises the threat model, the definition or the assumption, never just the cipher.` },
        };
        const pos = { T: [1, 3.2], D: [3.1, 3.2], S: [5.2, 3.2], C: [7.3, 3.2], P: [9.1, 3.2], X: [5.2, 0.9] };
        const label = { T: 'Threat\nmodel', D: 'Formal\ndefinition', S: 'Explicit\nassumption', C: 'Public\nconstruction', P: 'Proof by\nreduction', X: 'Cryptanalysis:\nattack found' };
        const G = v.graph(sG, { directed: true, shape: 'box', layout: 'none', draggable: false, fontSize: 13, r: 14,
          nodes: Object.keys(pos).map((id) => ({ id, x: pos[id][0], y: pos[id][1], label: label[id] })),
          edges: [['T', 'D'], ['D', 'S'], ['S', 'C'], ['C', 'P'], ['C', 'X'], ['X', 'S'], ['X', 'D'], ['X', 'T']] });
        let sel = 'D', cell = null;
        G.onClick = ({ node }) => { if (node) { sel = node.id; cell = null; } return true; };
        // systems × steps
        const YES = '✓', NO = '✗', PART = '~';
        const rows = [
          { n: 'Shift cipher', c: [NO, NO, NO, NO], out: 'broken by trying all 26 keys', note: 'Caesar’s shift (item 1.3): 26 keys, so exhaustive search is the whole attack.' },
          { n: 'Monoalphabetic substitution', c: [NO, NO, NO, NO], out: 'broken by frequency analysis (al-Kindi, 9th c.)', note: 'A huge key space (26!) without any argument that the ciphertext hides the plaintext: it does not (items 1.5–1.6).' },
          { n: 'Vigenère', c: [NO, NO, NO, NO], out: 'broken: Babbage c. 1854, Kasiski 1863', note: 'Reputed unbreakable for centuries on no stated ground; its period is its weakness (items 1.7–1.8).' },
          { n: 'Enigma', c: [PART, NO, PART, NO], out: 'broken: Rejewski 1932, Bletchley Park 1940s', note: 'The threat model (ciphertext only) was implicit and wrong; the huge key space was an implicit assumption; no proof (item 1.9).' },
          { n: 'DES (1977)', c: [PART, NO, PART, NO], out: '56-bit key found in 56 h (EFF, 1998)', note: 'A careful design with no structural break, but its key length was an implicit assumption that expired (item 1.4).' },
          { n: 'One-time pad', c: [YES, YES, YES, YES], out: 'provably perfectly secret (Shannon 1949)', note: 'Threat model: unbounded eavesdropper; definition: perfect secrecy; assumption: the key is uniform, as long as the message, used once; proof: Shannon (chapter 2).' },
          { n: 'AES in counter mode', c: [YES, YES, YES, YES], out: 'no break; security relative to AES being pseudorandom', note: 'CPA-security is proved by reduction to the assumption that AES is a pseudorandom permutation (chapter 3): conditional, but explicit.' },
        ];
        const heads = [['threat model', 'stated?'], ['formal', 'definition?'], ['assumption', 'explicit?'], ['proof of', 'security?']];
        const geo = () => { const P = pix(sT), { W } = P, lw = Math.min(190, W * 0.25), tw = Math.max(64, Math.min(104, (W - lw - 160) / 4)); return { P, W, lw, tw, ox: lw + 4 * tw, rh: 40, y0: 52 }; };
        sT.onClick((x, y) => {
          const g = geo(), [px, py] = g.P.at(x, y), i = Math.floor((py - g.y0) / g.rh);
          if (i < 0 || i >= rows.length) return;
          if (px < g.lw) cell = [i, 4];
          else if (px < g.ox) { const j = Math.floor((px - g.lw) / g.tw); cell = [i, j]; sel = ['T', 'D', 'S', 'P'][j]; }
          else cell = [i, 4];
        });
        const wrap = (str, n) => { const out = []; let cur = ''; for (const w of str.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };
        v.render(() => {
          const st = ST[sel];
          G.draw({
            nodeFill: (id) => (id === sel ? 'accent' : null),
            nodeColor: (id) => (id === 'X' ? 'red' : id === 'C' ? 'teal' : null),
            edgeColor: (e) => (e.from === 'X' ? 'red' : null),
            edgeDash: (e) => (e.from === 'X' ? true : null),
          });
          sG.text('each break feeds back into the earlier steps', 9.9, 0.9, { size: 11, color: 'red', weight: 600, align: 'right' });
        });
        v.render(() => {
          const g = geo(), { P, W, lw, tw, ox, rh, y0 } = g, col = ST[sel] && ST[sel].col != null ? ST[sel].col : null;
          heads.forEach((h, j) => { const x = lw + j * tw; if (col === j) P.rect(x, 6, tw, y0 - 6 + rows.length * rh, { fill: 'accent', fillAlpha: 0.12, stroke: false }); h.forEach((l, k) => P.text(l, x + tw / 2, 20 + k * 15, { size: 11.5, weight: 700, color: col === j ? 'accent' : 'muted', align: 'center', halo: false })); });
          P.text('what happened', ox + 12, 28, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false });
          rows.forEach((r, i) => {
            const y = y0 + i * rh;
            P.line(8, y, W - 8, y, { color: 'faint', width: 1 });
            P.text(r.n, 12, y + rh / 2, { size: 12.5, weight: 700, color: 'ink', align: 'left', halo: false });
            r.c.forEach((c, j) => {
              const x = lw + j * tw, cc = c === YES ? 'green' : c === NO ? 'red' : 'gold';
              P.rect(x + 8, y + 5, tw - 16, rh - 10, { fill: cc, fillAlpha: 0.26, color: cc, width: 1.2, radius: 6 });
              P.text(c, x + tw / 2, y + rh / 2, { size: 17, weight: 800, color: cc, align: 'center', halo: false });
            });
            const lines = wrap(r.out, Math.max(14, Math.floor((W - ox - 24) / 6.4)));
            lines.forEach((l, k) => P.text(l, ox + 12, y + rh / 2 + (k - (lines.length - 1) / 2) * 14, { size: 12, color: 'ink', align: 'left', halo: false }));
          });
          P.line(8, y0 + rows.length * rh, W - 8, y0 + rows.length * rh, { color: 'faint', width: 1 });
          if (cell) P.rect(cell[1] === 4 ? 6 : lw + cell[1] * tw + 4, y0 + cell[0] * rh + 2, cell[1] === 4 ? W - 12 : tw - 8, rh - 4, { fill: false, color: 'gold', width: 2.4, radius: 8 });
        });
        v.readout(() => {
          const s0 = ST[sel];
          const extra = cell ? `\n**${rows[cell[0]].n}:** ${rows[cell[0]].note}` : '';
          return `${s0.text}${extra}`;
        });
      },
    },
  ],
};
