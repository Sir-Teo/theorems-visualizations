// Music Theory & Acoustics — Chapter 8 (part c): items 8.15–8.21, Fourier and interval content, rows, notation, keys, change ringing
import { SR, C4, NOTE, mod, norm, Tn, In, key, setStr, braceStr, ic, clk, pcAt, drawClock, polyOf, dotsOf, CLOCK_STAGE, seqCents, PRESETS, complement, icv, vecStr, classes, fromMask, fcoef, fmag, ifun, droneScale, LETTERS, LET_PC, accStr, stepMidi, stepName, spell, midiFreq, drawStaff, noteHead, teStr } from './ch08.shared.js';

const MAJ = [0, 2, 4, 5, 7, 9, 11];
const preSets = { diat: ['diatonic', PRESETS.diatonic], pent: ['pentatonic', PRESETS.pentatonic], whole: ['whole-tone', PRESETS.wholetone], oct: ['octatonic', PRESETS.octatonic], dom7: ['dominant 7th', [0, 4, 7, 10]], hex: ['hexachord 6-Z3', [0, 1, 2, 3, 5, 6]], z4: ['all-interval tetrachord', [0, 1, 4, 6]] };
const preOpts = Object.entries(preSets).map(([value, [label]]) => ({ value, label }));
const gcdN = (a, b) => (b ? gcdN(b, a % b) : a);

export default {
  collection: 'music',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.15
    {
      num: '8.15',
      kind: 'Theorem',
      name: 'Interval content from Fourier magnitudes',
      statement: String.raw`For $S\subseteq\Z/12$ let $\mathrm{IF}_S(d)=\#\{(a,b)\in S^2: b-a\equiv d\}$ (the **interval function**, an autocorrelation) and $f_k(S)=\sum_{j\in S}e^{-2\pi ijk/12}$. Then
$$|f_k(S)|^2=\sum_{d=0}^{11}\mathrm{IF}_S(d)\,e^{-2\pi ikd/12},\qquad \mathrm{IF}_S(d)=\frac1{12}\sum_{k=0}^{11}|f_k(S)|^2\,e^{2\pi ikd/12}.$$
So the interval content (the interval vector, since $\mathrm{IF}_S(d)$ equals the entry $v_{\operatorname{ic}(d)}$ for $d\ne0,6$ and $2v_6$ for $d=6$) and the Fourier magnitudes determine each other. Consequently two sets of the same cardinality have the same interval vector exactly when $|f_k|$ agrees for all $k$. A set and its complement always agree at $k\ne0$; they also agree at $k=0$ precisely when both are hexachords, giving the hexachord theorem. Every Z-related pair agrees at all frequencies.`,
      idea: String.raw`Multiplying $f_k$ by its conjugate gives $\sum_{a,b\in S}e^{-2\pi ik(b-a)/12}$, a sum over all ordered pairs grouped by their difference, which is the first formula; the second is its inverse transform (compare Parseval, 8.16 in Rudin: $\sum|f_k|^2=12|S|$). Complement: $f_k(\Z/12)=0$ for $k\ne0$, so $f_k(S^c)=-f_k(S)$ and the magnitudes agree for $k\ge1$; only $|f_0|^2=|S|^2$ versus $(12-|S|)^2$ differ, and their difference spread over the 12 differences, $\frac{(12-k)^2-k^2}{12}=12-2k$ for $k=|S|$, is the shift of 8.12.`,
      caption: String.raw`Choose a set and what to compare it with. Top right: the interval function of the set (blue) and of the comparison (red), with purple rings showing the interval function rebuilt from the squared Fourier magnitudes below. Bottom: $|f_k|^2$ for both. Complements share all magnitudes for $k\ge1$; a Z-mate shares everything; the transposed or inverted copy shares everything too.`,
      deps: ['music-8.14', 'music-8.12', 'pma-8.16'],
      see: ['music-8.13', 'music-8.11'],
      refs: ['Tymoczko, A Geometry of Music'],
      tags: ['fourier', 'interval vector'],
      credit: 'The interval function is David Lewin\'s (1959 onward); its relation to Fourier magnitudes is developed by Ian Quinn and Emmanuel Amiot (2000s); attributions from secondary sources, not checked against the originals',
      scope: String.raw`Finite sets on the 12-element circle; the identity is a convolution theorem for $\Z/12$ and holds for any finite cyclic group. The bridge to "same vector $\Rightarrow$ same magnitudes" uses that $\mathrm{IF}_S$ (including $\mathrm{IF}_S(0)=|S|$) is determined by the vector and the size.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Autocorrelation#Wiener%E2%80%93Khinchin_theorem' },
      verify: true,
      viz(v) {
        let S = PRESETS.diatonic.slice();
        const pre = v.select('set A', [...preOpts, { value: 'free', label: 'free' }], 'diat', { onChange: (x) => { if (preSets[x]) S = preSets[x][1].slice(); } });
        const rel = v.select('compare with', [{ value: 'comp', label: 'complement' }, { value: 'ti', label: 'moved copy (T/I)' }, { value: 'z', label: 'Z-mate' }], 'comp');
        const tn = v.slider('copy: transpose by', 0, 11, 4, { int: true });
        const inv = v.toggle('copy: invert', true);
        const s = v.stage({ ...CLOCK_STAGE, height: 340, title: 'set A (blue) and B (red); click to edit A' });
        const ib = v.stage({ x: [-0.7, 11.7], y: [0, 8], axes: 'box', gutter: true, height: 340, xlabel: 'difference $d$', ylabel: 'IF(d)', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], title: 'interval function and its rebuild' });
        const fb = v.stage({ x: [-0.7, 6.7], y: [0, 10], axes: 'box', gutter: true, full: true, height: 230, xlabel: 'k', ylabel: '$|f_k|^2$', title: 'squared Fourier magnitudes' });
        s.onClick((x, y) => { if (Math.hypot(x, y) < 0.3) return; const k = pcAt(x, y); S = S.includes(k) ? S.filter((q) => q !== k) : norm([...S, k]); pre.value = 'free'; v.invalidate(); });
        const zmate = (A) => { const { ti, tiOf } = classes(), V = key(icv(A)), ma = A.reduce((m, x) => m | (1 << x), 0), my = tiOf[ma]; for (let c = 0; c < ti.length; c++) { if (c === my) continue; const B = fromMask(ti[c][0]); if (B.length === A.length && key(icv(B)) === V) return B; } return null; };
        const other = () => { if (rel.value === 'comp') return complement(S); if (rel.value === 'ti') return inv.value ? In(S, tn.value) : Tn(S, tn.value); return zmate(S); };
        v.soundButton('play A, then B', (sd) => { const B = other(); if (S.length && B && B.length) sd.samples(seqCents([S.map((k) => k * 100), B.map((k) => k * 100)], C4, 1.6, 0.2), SR, { gain: 0.9 }); });
        const sq = (X, k) => fmag(X, k) ** 2;
        v.render(() => {
          const B = other() || S, ok = !!other();
          drawClock(s, { names: true });
          polyOf(s, S, 1, { color: 'accent' }); dotsOf(s, S, 1, { color: 'accent', r: 8 });
          if (ok) { polyOf(s, B, 0.8, { color: 'red' }); dotsOf(s, B, 0.8, { color: 'red', r: 6 }); }
          if (!ok) s.text('no Z-mate: A is alone in its vector class', 0, 0, { size: 13, color: 'muted', align: 'center', baseline: 'middle', plate: true });
          const FA = ifun(S), FB = ifun(B), top = Math.max(2, ...FA, ...FB) + 1;
          ib.setView([-0.7, 11.7], [0, top]);
          for (let d = 0; d < 12; d++) {
            ib.rect(d - 0.38, 0, d, FA[d], { fill: 'accent', fillAlpha: 0.75, stroke: false }); if (ok) ib.rect(d, 0, d + 0.38, FB[d], { fill: 'red', fillAlpha: 0.75, stroke: false });
            let rec = 0; for (let k = 0; k < 12; k++) rec += sq(S, k) * Math.cos((2 * Math.PI * k * d) / 12); rec /= 12;
            ib.dot(d - 0.19, rec, { r: 5, color: 'purple', hollow: true });
          }
          const mx = Math.max(S.length ** 2, B.length ** 2, ...[1, 2, 3, 4, 5, 6].map((k) => Math.max(sq(S, k), sq(B, k)))) * 1.1 + 0.5;
          fb.setView([-0.7, 6.7], [0, mx]);
          for (let k = 0; k <= 6; k++) { fb.rect(k - 0.38, 0, k, sq(S, k), { fill: 'accent', fillAlpha: 0.75, stroke: false }); if (ok) fb.rect(k, 0, k + 0.38, sq(B, k), { fill: 'red', fillAlpha: 0.75, stroke: false }); }
        });
        v.legend([['accent', 'A'], ['red', 'B'], ['purple', 'IF of A rebuilt from $|f_k|^2$', { dot: true }]]);
        v.readout(() => {
          const B = other();
          if (!B) return `A = $${braceStr(S)}$ has no Z-mate (no other class shares its interval vector).`;
          const dm = Math.max(...[1, 2, 3, 4, 5, 6].map((k) => Math.abs(sq(S, k) - sq(B, k)))), FA = ifun(S), FB = ifun(B);
          const di = Math.max(...FA.slice(1).map((x, i) => Math.abs(x - FB[i + 1])));
          let err = 0; for (let d = 0; d < 12; d++) { let rec = 0; for (let k = 0; k < 12; k++) rec += sq(S, k) * Math.cos((2 * Math.PI * k * d) / 12); err = Math.max(err, Math.abs(rec / 12 - FA[d])); }
          return `$|A|=${S.length}$, $|B|=${B.length}$ · largest difference of $|f_k|^2$ for $k=1..6$: ${v.fix(dm, 6)} · largest difference of IF for $d\\ne0$: ${di}${di > 0 && dm < 1e-9 ? ` (it equals $|12-2|A||=${Math.abs(12 - 2 * S.length)}$: only $|f_0|$ differs)` : ''} · interval vectors ${key(icv(S)) === key(icv(B)) ? 'equal' : 'differ'} · rebuild error ${v.fix(err, 10)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.16
    {
      num: '8.16',
      kind: 'Concept',
      name: 'Twelve-tone rows and the row matrix',
      statement: String.raw`A **twelve-tone row** is an ordering $p=(p_0,\dots,p_{11})$ of the twelve pitch classes. Its 48 standard forms are the prime forms $P_n$ ($T_n$ of the row), the retrogrades $R_n$ (reversed), the inversions $I_n$ ($p_j\mapsto 2p_0-p_j$, then transposed) and the retrograde inversions $RI_n$. The **row matrix** is the $12\times12$ array with entries $m_{ij}=p_j-p_i+p_0 \pmod{12}$: row $i$ is a prime form (it starts on $2p_0-p_i$), column $j$ is an inversion form (starting on $p_j$), and reading rows backwards or columns upwards gives all retrogrades. Every row and every column contains each pitch class exactly once, and the 48 forms are distinct unless the row has a symmetry (such as being its own retrograde inversion at some transposition).`,
      idea: String.raw`The forms are the images of $p$ under the group generated by $T_n$ and $I$ (8.7) together with reversal of order, a group of order $4\cdot12=48$ acting on orderings; the matrix writes out all $12$ transpositions of $P$ in its rows and all 12 transpositions of the inversion in its columns by the formula $p_j-p_i+p_0$, in which fixing $i$ translates the row and fixing $j$ gives $p_j$ plus the (negated) differences $p_i-p_0$. Permutation property: for fixed $i$, $j\mapsto p_j+c$ is a bijection of $\Z/12$.`,
      caption: String.raw`The matrix of the row of Berg's Violin Concerto, or type your own row (12 numbers 0–11, or note names like C, Eb, F#). Click a row, column or any edge label to select a form: the form is outlined and its pitches listed and played. Random rows and rows with symmetry (try the chromatic scale and the circle of fifths) change the count of distinct forms.`,
      deps: ['music-8.7'],
      see: ['music-8.8'],
      refs: ['Benson §9.8 pp. 322–324; §9.13 pp. 330–332'],
      tags: ['serialism', 'symmetry'],
      credit: 'Arnold Schoenberg (method developed from about 1921; the Suite for Piano, Op. 25 is generally cited as the first piece to use it throughout) and, independently, Josef Matthias Hauer (a twelve-note system from about 1920); the default row is that of Alban Berg\'s Violin Concerto (1935)',
      scope: String.raw`The 48 forms count the orderings obtained by transposition, inversion and retrograde; symmetric rows give fewer distinct forms. The default row is given as G B♭ D F♯ A C E G♯ B C♯ E♭ F (program notes), checked against two sources.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Twelve-tone_technique' },
      verify: true,
      viz(v) {
        const BERG = [7, 10, 2, 6, 9, 0, 4, 8, 11, 1, 3, 5];
        const EX = { berg: ['Berg, Violin Concerto', BERG], chrom: ['chromatic scale (very symmetric)', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]], allint: ['an all-interval row', [0, 11, 1, 10, 2, 9, 3, 8, 4, 7, 5, 6]], fifths: ['circle of fifths', [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]] };
        let p = BERG.slice(), sel = { t: 'P', i: 0 }, seed = 1, err = '';
        const parse = (txt) => {
          const toks = txt.replace(/[,;]/g, ' ').trim().split(/\s+/).filter(Boolean), out = [];
          for (const t of toks) {
            let x; if (/^\d+$/.test(t)) x = +t; else if (t === 'T' || t === 't') x = 10; else if (t === 'E' || t === 'e') x = 11; else { const m = t.match(/^([A-Ga-g])([#♯b♭]*)$/); if (!m) return null; x = LET_PC[LETTERS.indexOf(m[1].toUpperCase())]; for (const ch of m[2]) x += ch === '#' || ch === '♯' ? 1 : -1; }
            out.push(mod(x));
          }
          return out.length === 12 && new Set(out).size === 12 ? out : null;
        };
        const inp = v.input('row (12 distinct pitch classes)', teStr(p), { width: 330, onChange: (t) => { const r = parse(t); if (r) { p = r; err = ''; sel = { t: 'P', i: 0 }; } else err = 'not a row: need 12 distinct pitch classes'; v.invalidate(); } });
        v.select('start from', [...Object.entries(EX).map(([value, [label]]) => ({ value, label })), { value: 'own', label: 'my row' }], 'berg', { onChange: (x) => { if (EX[x]) { p = EX[x][1].slice(); inp.set(teStr(p)); err = ''; sel = { t: 'P', i: 0 }; } } });
        v.button('random row', () => { const r = v.rng(++seed * 7717); p = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); inp.set(teStr(p)); err = ''; sel = { t: 'P', i: 0 }; });
        const names = v.select('show', [{ value: 'num', label: 'numbers' }, { value: 'name', label: 'note names' }], 'num');
        const s = v.stage({ x: [-3.2, 15.2], y: [-1.9, 13.9], equal: true, axes: false, full: true, height: 520, title: 'the row matrix (click a row, a column or a label)' });
        const form = () => { const m = matrix(); if (sel.t === 'P') return m[sel.i].slice(); if (sel.t === 'R') return m[sel.i].slice().reverse(); const col = m.map((r) => r[sel.i]); return sel.t === 'I' ? col : col.reverse(); };
        const matrix = () => p.map((pi) => p.map((pj) => mod(pj - pi + p[0])));
        s.onClick((x, y) => {
          const j = Math.floor(x), i = 11 - Math.floor(y); const inside = j >= 0 && j < 12 && i >= 0 && i < 12;
          if (inside) sel = { t: 'P', i };
          else if (x < 0 && i >= 0 && i < 12) sel = { t: 'P', i };
          else if (x >= 12 && i >= 0 && i < 12) sel = { t: 'R', i };
          else if (y >= 12 && j >= 0 && j < 12) sel = { t: 'I', i: j };
          else if (y < 0 && j >= 0 && j < 12) sel = { t: 'RI', i: j };
          v.invalidate();
        });
        v.soundButton('play the selected form', (sd) => { const f = form(); sd.samples(seqCents(f.map((k) => [k * 100 + (k > 6 ? -1200 : 0)]), C4, 0.34, 0.02), SR, { gain: 0.9 }); });
        const lab = (x) => (names.value === 'num' ? teStr([x]) : NOTE[x]);
        v.render(() => {
          const m = matrix();
          for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
            const x = m[i][j], y = 11 - i, hl = (sel.t === 'P' && sel.i === i) || (sel.t === 'R' && sel.i === i) || (sel.t === 'I' && sel.i === j) || (sel.t === 'RI' && sel.i === j);
            s.rect(j + 0.04, y + 0.04, j + 0.96, y + 0.96, { fill: v.ramp(0.12 + 0.55 * (x / 11), hl ? 'orange' : 'accent'), fillAlpha: 1, stroke: false, radius: 3 });
            s.text(lab(x), j + 0.5, y + 0.5, { size: names.value === 'num' ? 13 : 11, color: 'ink', align: 'center', baseline: 'middle', weight: hl ? 700 : 400 });
          }
          for (let i = 0; i < 12; i++) { s.text(`P${m[i][0]}`, -0.25, 11 - i + 0.5, { size: 10.5, color: sel.t === 'P' && sel.i === i ? 'orange' : 'muted', align: 'right', baseline: 'middle', weight: 600 }); s.text(`R${m[i][0]}`, 12.25, 11 - i + 0.5, { size: 10.5, color: sel.t === 'R' && sel.i === i ? 'orange' : 'muted', align: 'left', baseline: 'middle', weight: 600 }); }
          for (let j = 0; j < 12; j++) { s.text(`I${p[j]}`, j + 0.5, 12.35, { size: 10.5, color: sel.t === 'I' && sel.i === j ? 'orange' : 'muted', align: 'center', baseline: 'middle', weight: 600 }); s.text(`RI${p[j]}`, j + 0.5, -0.4, { size: 10, color: sel.t === 'RI' && sel.i === j ? 'orange' : 'muted', align: 'center', baseline: 'middle', weight: 600 }); }
          // selected-form outline and direction arrow
          if (sel.t === 'P' || sel.t === 'R') { const y = 11 - sel.i + 0.5, rev = sel.t === 'R'; s.rect(0, y - 0.5, 12, y + 0.5, { color: 'orange', width: 2.4, fill: false }); s.arrow(rev ? 11.8 : 0.2, y + 0.62, rev ? 0.2 : 11.8, y + 0.62, { color: 'orange', width: 1.5 }); }
          else { const x = sel.i + 0.5, rev = sel.t === 'RI'; s.rect(x - 0.5, 0, x + 0.5, 12, { color: 'orange', width: 2.4, fill: false }); s.arrow(x + 0.62, rev ? 0.2 : 11.8, x + 0.62, rev ? 11.8 : 0.2, { color: 'orange', width: 1.5 }); }
        });
        v.readout(() => {
          if (err) return err;
          const f = form(), forms = new Set(); const m = matrix();
          for (let i = 0; i < 12; i++) { const r = m[i]; forms.add(key(r)); forms.add(key(r.slice().reverse())); }
          for (let j = 0; j < 12; j++) { const c = m.map((r) => r[j]); forms.add(key(c)); forms.add(key(c.slice().reverse())); }
          const iv = p.slice(1).map((x, i) => mod(x - p[i])), allInt = new Set(iv.map((d) => ic(d))).size === 6 && new Set(iv).size === 11;
          const ok = m.every((r) => new Set(r).size === 12) && m[0].every((_, j) => new Set(m.map((r) => r[j])).size === 12);
          const nm = sel.t === 'P' ? `P${m[sel.i][0]}` : sel.t === 'R' ? `R${m[sel.i][0]}` : sel.t === 'I' ? `I${p[sel.i]}` : `RI${p[sel.i]}`;
          return `selected **${nm}**: ${teStr(f)} · row $p=(${teStr(p, ',')})$ · successive intervals ${iv.join(' ')} (${new Set(iv).size} distinct${allInt ? ', an all-interval row' : ''}) · every row and column is a permutation: ${ok ? 'yes ✓' : 'no'} · distinct forms among the 48: ${forms.size}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.17
    {
      num: '8.17',
      kind: 'Concept',
      name: 'Staff notation, note names and the keyboard',
      statement: String.raw`Western notation places a note on a **staff** of five lines whose vertical position is a diatonic step (a letter name A–G and an octave): going up one line-or-space is one letter. A **clef** fixes which letter sits on which line (treble: G above middle C on the second line; bass: F below middle C on the fourth line; alto: middle C on the middle line), and an **accidental** (♯ raise a semitone, ♭ lower, ♮ cancel) alters the pitch by semitones. A note therefore has a **spelling** (letter, accidental, octave), and its pitch is $12(o+1)+\{0,2,4,5,7,9,11\}[\text{letter}]+\text{accidental}$ in MIDI numbers (C4 = 60). Different spellings (C♯4 and D♭4) of one pitch are **enharmonic**: one key of the keyboard, one frequency $440\cdot2^{(m-69)/12}$ Hz in twelve-tone equal temperament, two places on the staff.`,
      idea: String.raw`A spelling is a point of a two-dimensional lattice (diatonic steps, semitones), and the pitch is a linear function on it; the kernel of that function consists of pairs like (one letter up, two semitones down), the enharmonic equivalences. The staff shows the first coordinate by height, accidentals show the correction, the keyboard and the frequency axis show only the sum (the logarithm of the frequency, 1.6), which is why the three views agree on pitch but not on spelling.`,
      caption: String.raw`Click a position on the staff, a key of the keyboard, or the frequency axis, and the selected note lights in all three. Choose how black keys are spelled and watch the notehead jump between C♯ and D♭ while the key and the frequency stay put; change the clef and the notehead moves while the sound does not. The tone plays when you click.`,
      deps: ['music-8.1', 'music-8.3'],
      see: ['music-8.18', 'music-8.20'],
      refs: ['Benson app. M'],
      tags: ['notation'],
      scope: String.raw`Twelve-tone equal temperament with A4 = 440 Hz. In other tunings (7.1–7.3) C♯ and D♭ are different pitches; in equal temperament they coincide.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Scientific_pitch_notation' },
      viz(v) {
        let m = 61;
        const clef = v.select('clef', [{ value: 'treble', label: 'treble (G)' }, { value: 'bass', label: 'bass (F)' }, { value: 'alto', label: 'alto (C)' }], 'treble');
        const sp = v.select('spell black keys with', [{ value: 1, label: 'sharps ♯' }, { value: 0, label: 'flats ♭' }], 1);
        const ac = v.select('accidental for staff clicks', [{ value: 0, label: '♮' }, { value: 1, label: '♯' }, { value: -1, label: '♭' }], 0);
        const snd = v.sound();
        const play = () => snd.tone(midiFreq(m), { duration: 0.9, harmonics: 6 });
        const CL = { treble: [30, 'G', 2], bass: [18, 'F', 6], alto: [24, 'C', 4] };
        const st = v.stage({ x: [0, 12], y: [-7, 15], axes: false, full: true, height: 300, title: 'the staff (click a line or space)' });
        const kb = v.stage({ x: [0, 22], y: [0, 1.4], axes: false, full: true, height: 150, title: 'the keyboard, C3 to B5 (click a key)' });
        const fq = v.stage({ x: [120, 1100], xlog: true, y: [0, 1], axes: false, full: true, height: 130, title: 'the frequency axis (logarithmic, Hz)' });
        const wk = []; for (let q = 48; q < 84; q++) if ([0, 2, 4, 5, 7, 9, 11].includes(q % 12)) wk.push(q);
        const wx = (q) => wk.indexOf(q);
        const bx = (q) => wx(q - 1) + 0.65;
        st.onClick((x, y) => { const step = CL[clef.value][0] + Math.round(y); m = Math.min(95, Math.max(36, stepMidi(step, +ac.value))); play(); v.invalidate(); });
        kb.onClick((x, y) => { let hit = null; for (let q = 49; q < 84; q++) if (!wk.includes(q) && x >= bx(q) && x <= bx(q) + 0.7 && y >= 0.4) hit = q; if (hit == null && x >= 0 && x < wk.length) hit = wk[Math.floor(x)]; if (hit != null) { m = hit; play(); v.invalidate(); } });
        fq.onClick((x) => { m = Math.min(83, Math.max(48, Math.round(69 + 12 * Math.log2(x / 440)))); play(); v.invalidate(); });
        v.render(() => {
          const [bot, cl, cy] = CL[clef.value], sh = !!+sp.value, [step, acc] = spell(m, sh), [step2, acc2] = spell(m, !sh), y = step - bot, y2 = step2 - bot, black = ![0, 2, 4, 5, 7, 9, 11].includes(m % 12);
          drawStaff(st, 0.5, 11.5);
          st.text(`${cl} clef`, 1.2, cy, { size: 22, color: 'muted', align: 'center', baseline: 'middle', weight: 700, plate: true });
          noteHead(st, 6, y, { color: 'orange', r: 8, acc: accStr(acc) });
          if (black) noteHead(st, 9, y2, { color: 'faint', r: 8, acc: accStr(acc2) });
          st.text(stepName(step, acc), 6, y + (y > 4 ? -2.2 : 2.2), { size: 13, color: 'orange', align: 'center', baseline: 'middle', weight: 700 });
          if (black) st.text(`also ${stepName(step2, acc2)}`, 9, y2 + (y2 > 4 ? -2.2 : 2.2), { size: 12, color: 'muted', align: 'center', baseline: 'middle' });
          wk.forEach((q, i) => { kb.rect(i, 0, i + 1, 1.4, { fill: q === m ? 'orange' : 'panel', fillAlpha: q === m ? 0.85 : 1, color: 'muted', width: 1 }); if (q % 12 === 0) kb.text(`C${q / 12 - 1}`, i + 0.5, 0.15, { size: 10.5, color: 'muted', align: 'center' }); });
          for (let q = 49; q < 84; q++) if (![0, 2, 4, 5, 7, 9, 11].includes(q % 12)) kb.rect(bx(q), 0.4, bx(q) + 0.7, 1.4, { fill: q === m ? 'orange' : [30, 30, 30], fillAlpha: 1, color: 'muted', width: 1 });
          for (let q = 48; q <= 84; q++) { const f = midiFreq(q), on = q === m; fq.line(f, 0.25, f, on ? 0.9 : 0.5, { color: on ? 'orange' : 'muted', width: on ? 3 : 1 }); if (q % 12 === 0 || on) fq.text(`${v.fix(f, f < 200 ? 1 : 0)} Hz`, f, on ? 0.98 : 0.1, { size: 11, color: on ? 'orange' : 'muted', align: 'center', baseline: on ? 'top' : 'bottom', weight: on ? 700 : 400 }); }
        });
        v.readout(() => {
          const [step, acc] = spell(m, !!+sp.value), [step2, acc2] = spell(m, !+sp.value), black = ![0, 2, 4, 5, 7, 9, 11].includes(m % 12);
          return `**${stepName(step, acc)}**${black ? ` = ${stepName(step2, acc2)} (enharmonic)` : ''} · MIDI ${m} · pitch class ${m % 12} · frequency ${v.fix(midiFreq(m), 2)} Hz = $440\\cdot2^{(${m}-69)/12}$ · key ${[0, 2, 4, 5, 7, 9, 11].includes(m % 12) ? 'white' : 'black'} · staff position ${step - CL[clef.value][0]} steps above the bottom line (${clef.value} clef).`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.18
    {
      num: '8.18',
      kind: 'Definition',
      name: 'Interval names: number and quality',
      statement: String.raw`The **number** of an interval is the count of letter names it spans, inclusive: from C to the E above, C D E, a third; from C to the next C, an octave (8). Its **quality** records the semitone size relative to the number: unisons, fourths, fifths and octaves are *perfect* (P) at $0,5,7,12$ semitones, seconds, thirds, sixths and sevenths are *major* (M) at $2,4,9,11$ or one semitone smaller, *minor* (m). One semitone more than perfect or major is *augmented* (A); one less than perfect or one less than minor is *diminished* (d). **Inversion** moves the lower note up an octave: the numbers add to 9 and the qualities swap (P↔P, M↔m, A↔d). The tritone is both A4 and d5.`,
      idea: String.raw`Number is the difference of the letter coordinates of 8.17 and semitones the difference of the pitch coordinate; the quality is the discrepancy between the semitone count and the standard (major or perfect) size for that number. Inversion replaces number $n$ by $9-n$ (letters counted from the other end) and semitones $s$ by $12-s$, and the discrepancy changes sign, which exchanges M with m and A with d.`,
      caption: String.raw`Pick the lower note (letter and accidental) and click the staff for the upper note (set its accidental first). The staff gives the number, the semitone count gives the quality; the table below marks which (number, semitone) pairs exist and where yours falls: A4 and d5 share a column. The invert button moves the lower note up an octave.`,
      deps: ['music-8.17', 'music-8.2'],
      see: ['music-8.2', 'music-8.17'],
      refs: ['Benson app. I', 'Benson app. M'],
      tags: ['intervals'],
      scope: String.raw`Twelve-tone equal temperament naming (semitone counts). Compound intervals larger than an octave are named by the same rule with number $n+7k$; doubly augmented and doubly diminished intervals are shown but rarely used.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Interval_(music)#Main_intervals' },
      viz(v) {
        let up = { step: 30, acc: 0 }; const lo = { step: 28, acc: 0 };
        const ll = v.select('lower note', LETTERS.map((l, i) => ({ value: i, label: l })), 0, { onChange: (i) => { lo.step = 28 + i; } });
        const la = v.select('lower accidental', [{ value: -1, label: '♭' }, { value: 0, label: '♮' }, { value: 1, label: '♯' }], 0, { onChange: (a) => { lo.acc = +a; } });
        const ua = v.select('accidental for the clicked upper note', [{ value: -1, label: '♭' }, { value: 0, label: '♮' }, { value: 1, label: '♯' }], 0);
        v.button('invert the interval', () => { const lm = lo.step, la0 = lo.acc, u = up; lo.step = 28 + mod(u.step, 7); lo.acc = u.acc; up = { step: Math.min(42, lm + 7), acc: la0 }; ll.value = lo.step - 28; la.value = lo.acc; });
        const s = v.stage({ x: [0, 12], y: [-6, 16], axes: false, full: true, height: 260, title: 'the staff (treble clef): click for the upper note' });
        const g = v.stage({ x: [-1.3, 12.7], y: [-0.4, 9.2], axes: false, full: true, height: 340, title: 'which names exist: number (rows) and semitones (columns)' });
        s.onClick((x, y) => { up = { step: Math.max(28, 30 + Math.round(y)), acc: +ua.value }; v.invalidate(); });
        const nameOf = (num, semi) => {
          const base = ((num - 1) % 7) + 1, oct = Math.floor((num - 1) / 7), perf = [1, 4, 5].includes(base), d = semi - (MAJ[base - 1] + 12 * oct);
          if (perf) return { 0: 'P', 1: 'A', 2: 'AA', '-1': 'd', '-2': 'dd' }[d] || null;
          return { 0: 'M', '-1': 'm', 1: 'A', 2: 'AA', '-2': 'd', '-3': 'dd' }[d] || null;
        };
        const cur = () => { const num = up.step - lo.step + 1, semi = stepMidi(up.step, up.acc) - stepMidi(lo.step, lo.acc); return { num, semi, q: nameOf(num, semi) }; };
        v.soundButton('play lower, upper, both', (sd) => { const a = stepMidi(lo.step, lo.acc), b = stepMidi(up.step, up.acc); sd.samples(seqCents([[(a - 60) * 100], [(b - 60) * 100], [(a - 60) * 100, (b - 60) * 100]], C4, 0.8, 0.1), SR, { gain: 0.9 }); });
        v.render(() => {
          drawStaff(s, 0.5, 11.5); s.text('G clef', 1.3, 2, { size: 18, color: 'muted', align: 'center', baseline: 'middle', weight: 700, plate: true });
          const c = cur();
          noteHead(s, 4, lo.step - 30, { color: 'accent', r: 8, acc: accStr(lo.acc) }); noteHead(s, 8, up.step - 30, { color: 'orange', r: 8, acc: accStr(up.acc) });
          s.text(stepName(lo.step, lo.acc), 4, lo.step - 30 - 2.4, { size: 12, color: 'accent', align: 'center', weight: 700 }); s.text(stepName(up.step, up.acc), 8, up.step - 30 + 2.4, { size: 12, color: 'orange', align: 'center', weight: 700 });
          s.text(c.q ? `${c.q}${c.num}` : `${c.num}th`, 6, 13, { size: 24, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          for (let n = 1; n <= 8; n++) {
            g.text(String(n), -0.8, 9 - n, { size: 13, color: 'muted', align: 'center', baseline: 'middle', weight: 600 });
            for (let sm = 0; sm <= 12; sm++) {
              const q = nameOf(n, sm), on = c.num === n && c.semi === sm;
              g.rect(sm - 0.46, 9 - n - 0.42, sm + 0.46, 9 - n + 0.42, { fill: on ? 'orange' : q ? (q === 'P' || q === 'M' || q === 'm' ? 'accent' : 'faint') : 'panel', fillAlpha: on ? 0.9 : q ? 0.25 : 0.2, color: on ? 'orange' : 'faint', width: on ? 2 : 0.6 });
              if (q && Math.abs(sm - (MAJ[(n - 1) % 7] + 12 * Math.floor((n - 1) / 7))) < 3) g.text(`${q}${n}`, sm, 9 - n, { size: 10.5, color: on ? 'ink' : 'muted', align: 'center', baseline: 'middle', weight: on ? 700 : 400 });
            }
          }
          for (let sm = 0; sm <= 12; sm++) g.text(String(sm), sm, 0.05, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          g.text('semitones', -0.8, 0.05, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
        });
        v.readout(() => {
          const c = cur(), inv = c.num <= 8 ? { num: 9 - c.num, q: c.q ? ({ P: 'P', M: 'm', m: 'M', A: 'd', d: 'A', AA: 'dd', dd: 'AA' }[c.q] || '') : '' } : null;
          return `${stepName(lo.step, lo.acc)} to ${stepName(up.step, up.acc)}: letters span ${c.num} → number **${c.num}**, ${c.semi} semitones → ${c.q ? `quality **${c.q}**, the interval is **${c.q}${c.num}**` : 'no standard name (more than doubly augmented or diminished)'}${inv && c.num > 1 && c.num <= 8 && c.q ? ` · inverted: ${inv.q}${inv.num} (numbers sum to ${c.num + inv.num}, semitones ${c.semi} + ${12 - c.semi} = 12)` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.19
    {
      num: '8.19',
      kind: 'Concept',
      name: 'Major and minor scales; relative and parallel keys',
      statement: String.raw`The **major scale** is the diatonic scale started on its Ionian degree, steps 2 2 1 2 2 2 1 (8.3). The **natural minor** scale (Aeolian) has steps 2 1 2 2 1 2 2 and is the major scale with degrees 3, 6, 7 lowered; the **harmonic minor** raises the seventh again (steps 2 1 2 2 1 3 1, with an augmented second between degrees 6 and 7); the **melodic minor** (ascending) raises both sixth and seventh (2 1 2 2 2 2 1). Two keys are **relative** if they use the same seven notes: a major key and the minor key on its sixth degree (C major and A minor), whose tonics are 3 semitones apart. Two keys are **parallel** if they share a tonic: C major and C minor, which share only four notes (natural minor), five (harmonic), or six (melodic).`,
      idea: String.raw`The relative minor is the Aeolian mode of the same pitch-class set (8.3): the set is unchanged and only the tonic moves 9 semitones up (3 down). The parallel minor keeps the tonic and changes the set, lowering three degrees, a move of three steps on the line of fifths (7.14); the harmonic and melodic forms then adjust degrees 6 and 7 to restore a leading tone a semitone below the tonic.`,
      caption: String.raw`Left: the major scale and its relative minor on the same clock; the same polygon, two homes (gold: major tonic, red: minor tonic). Right: the major scale and the parallel minor on one tonic, where the differing notes are marked and labelled. Choose the minor form; slide the tonic; play either scale over its drone.`,
      deps: ['music-8.3'],
      see: ['music-8.20', 'music-7.14'],
      refs: ['Benson app. M'],
      tags: ['scales', 'keys'],
      scope: String.raw`Equal-tempered pitch classes. The "melodic minor" is given in its ascending form; descending, tradition uses natural minor.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relative_key' },
      viz(v) {
        const MIN = { nat: ['natural', [0, 2, 3, 5, 7, 8, 10]], harm: ['harmonic', [0, 2, 3, 5, 7, 8, 11]], mel: ['melodic (ascending)', [0, 2, 3, 5, 7, 9, 11]] };
        const t = v.slider('tonic of the major key', 0, 11, 0, { int: true });
        const form = v.select('minor form', Object.entries(MIN).map(([value, [label]]) => ({ value, label })), 'nat');
        const a = v.stage({ ...CLOCK_STAGE, height: 360, title: 'relative keys: one set, two tonics' });
        const b = v.stage({ ...CLOCK_STAGE, height: 360, title: 'parallel keys: one tonic, two sets' });
        const minS = (tn) => Tn(MIN[form.value][1], tn);
        v.soundButton('play major', (sd) => sd.samples(droneScale(Tn(MAJ, t.value), t.value, 0.45), SR, { gain: 0.9 }));
        v.soundButton('play relative minor (natural)', (sd) => sd.samples(droneScale(Tn(MAJ, t.value), mod(t.value + 9), 0.45), SR, { gain: 0.9 }));
        v.soundButton('play parallel minor', (sd) => sd.samples(droneScale(minS(t.value), t.value, 0.45), SR, { gain: 0.9 }));
        const DEG = ['1', '2', '3', '4', '5', '6', '7'];
        v.render(() => {
          const M = Tn(MAJ, t.value), r = mod(t.value + 9), P = minS(t.value);
          drawClock(a, { names: true }); drawClock(b, { names: true });
          polyOf(a, M, 1, { color: 'accent' }); dotsOf(a, M, 1, { color: 'accent', r: 7 });
          const q = clk(t.value, 1), w = clk(r, 1); a.dot(q[0], q[1], { r: 12, color: 'gold', hollow: true }); a.dot(w[0], w[1], { r: 12, color: 'red', hollow: true });
          const pts = []; for (let i = 0; i <= 24; i++) pts.push(clk(t.value + (9 * i) / 24, 0.55)); a.arrow(...pts[23], ...pts[24], { color: 'red' }); a.path(pts, { color: 'red', width: 1.5, alpha: 0.8 });
          a.text(`${NOTE[t.value]} major = ${NOTE[r]} minor`, 0, 0, { size: 14, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          const Mm = M; polyOf(b, Mm, 1, { color: 'accent', fillAlpha: 0.05, alpha: 0.5 }); polyOf(b, P, 0.84, { color: 'red', fillAlpha: 0.06, alpha: 0.6 });
          dotsOf(b, M.filter((x) => P.includes(x)), 1, { color: 'ink', r: 7 });
          M.filter((x) => !P.includes(x)).forEach((x) => { const p = clk(x, 1); b.dot(p[0], p[1], { r: 7, color: 'accent' }); });
          P.filter((x) => !M.includes(x)).forEach((x) => { const p = clk(x, 0.84); b.dot(p[0], p[1], { r: 7, color: 'red' }); });
          const mn = MIN[form.value][1], difs = []; MAJ.forEach((x, i) => { const d = mn[i] - x; if (d) difs.push(`${d < 0 ? '♭' : '♯'}${DEG[i]}`); });
          b.text(`${NOTE[t.value]} major vs ${NOTE[t.value]} minor`, 0, 0.1, { size: 13, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          b.text(`differences: ${difs.join(' ')}`, 0, -0.12, { size: 12.5, color: 'red', align: 'center', baseline: 'middle' });
          if (form.value === 'harm') { const p1 = clk(P[5], 0.6), p2 = clk(P[6], 0.6); b.text('augmented 2nd', (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, { size: 11, color: 'orange', align: 'center', baseline: 'middle', plate: true }); }
        });
        v.legend([['accent', 'major scale'], ['red', 'minor scale'], ['ink', 'notes both share'], ['gold', 'major tonic']]);
        v.readout(() => {
          const M = Tn(MAJ, t.value), P = minS(t.value), common = M.filter((x) => P.includes(x)).length, mn = MIN[form.value][1];
          const gaps = mn.map((x, i) => (mn[(i + 1) % 7] - x + 12) % 12 || 12);
          return `${NOTE[t.value]} major and ${NOTE[mod(t.value + 9)]} minor are relative: same 7 notes, tonics 9 semitones apart (3 down) · parallel ${NOTE[t.value]} minor (${MIN[form.value][0]}) shares ${common} notes with ${NOTE[t.value]} major · its steps: ${gaps.map((g) => (g === 3 ? 'A2' : g)).join(' ')}${form.value === 'harm' ? ' (an augmented second between degrees 6 and 7)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.20
    {
      num: '8.20',
      kind: 'Concept',
      name: 'Key signatures',
      statement: String.raw`The key signature of a key lists the accidentals needed to write its scale with the letters in order. Moving from a major key up a fifth adds one sharp, and the sharps are added in the order F C G D A E B; moving down a fifth adds one flat, in the order B E A D G C F. The key with $k>0$ sharps (or $-k$ flats, $k<0$) is the major key whose tonic is $k$ places from C on the line of fifths $\dots,F,C,G,D,A,E,B,\dots$, i.e. the tonic is one semitone above the last sharp or is the second-to-last flat; the relative minor has the same signature and its tonic is 3 places further along the line (A minor at 0, E minor at 1 sharp, D minor at 1 flat). Fifteen signatures (7 sharps to 7 flats) cover 15 major and 15 minor keys; the three pairs C♯/D♭, F♯/G♭ and B/C♭ are enharmonic.`,
      idea: String.raw`The diatonic scale of a key is seven consecutive places on the line of fifths (7.1, 7.14); sliding the window one place right replaces its first note F by F♯ (the subdominant becomes the new leading tone), i.e. adds the next sharp in the order F C G D A E B. The tonic is the third place of the window counting from the left, which gives the rule "one semitone above the last sharp". Because the line has no end, there are keys beyond seven accidentals in either direction (double sharps), which is why the circle closes only enharmonically in twelve-tone equal temperament.`,
      caption: String.raw`Step along the line of fifths with the slider: the circle of fifths marks the key, the staff shows the signature, and the keyboard lights the seven scale notes with the altered notes in orange. Switch between major and minor to see the same signature with a new tonic; the readout works out the tonic from the last sharp or the last-but-one flat and checks it.`,
      deps: ['music-8.19', 'music-7.14'],
      see: ['music-7.14', 'music-8.19'],
      refs: ['Benson app. M'],
      tags: ['keys', 'circle of fifths'],
      scope: String.raw`Equal-tempered keys with signatures from 7 flats to 7 sharps; keys with double accidentals exist theoretically but are not covered by a signature.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Key_signature' },
      viz(v) {
        const k = v.slider('sharps (+) or flats (−)', -7, 7, 2, { int: true });
        const md = v.select('mode', [{ value: 'major', label: 'major' }, { value: 'minor', label: 'natural minor' }], 'major');
        const L = 'FCGDAEB';
        const nameAt = (p) => { const l = L[mod(p + 1, 7)], a = Math.floor((p + 1) / 7); return { l, a, str: `${l}${accStr(a)}` }; };
        const SH = 'FCGDAEB', FL = 'BEADGCF', STEP_SH = { F: 38, C: 35, G: 39, D: 36, A: 33, E: 37, B: 32 }, STEP_FL = { B: 32, E: 37, A: 33, D: 36, G: 31, C: 35, F: 29 };
        const c = v.stage({ ...CLOCK_STAGE, height: 340, title: 'circle of fifths (outer: major, inner: minor)' });
        const st = v.stage({ x: [0, 10], y: [-3, 11], axes: false, height: 340, title: 'treble staff with the key signature' });
        const kb = v.stage({ x: [0, 7], y: [0, 1.4], axes: false, full: true, height: 170, title: 'the scale on the keyboard (orange: altered by the signature)' });
        const tonicP = () => k.value + (md.value === 'minor' ? 3 : 0);
        const notes = () => { const out = []; for (let p = k.value - 1; p <= k.value + 5; p++) out.push({ p, pc: mod(7 * p, 12), ...nameAt(p) }); return out; };
        const scalePcs = () => notes().map((q) => q.pc);
        v.soundButton('play the scale', (sd) => { const T = mod(7 * tonicP(), 12); sd.samples(droneScale(scalePcs(), T, 0.45), SR, { gain: 0.9 }); });
        v.render(() => {
          const kk = k.value;
          c.circle(0, 0, 1.0, { color: 'faint', width: 1 }); c.circle(0, 0, 0.68, { color: 'faint', width: 1 });
          for (let q = -7; q <= 7; q++) {
            const ang = (2 * Math.PI * q) / 12, outer = q < -5 || q > 6, R = outer ? 1.28 : 1.0, on = q === kk, nm = nameAt(q), mn = nameAt(q + 3);
            const px = R * Math.sin(ang), py = R * Math.cos(ang);
            c.dot(px, py, { r: on ? 15 : 3, color: on ? (md.value === 'major' ? 'orange' : 'accent') : 'faint', alpha: on ? 0.9 : 1 });
            c.text(nm.str, px, py, { size: on ? 14 : 11.5, color: on && md.value === 'major' ? 'ink' : 'ink', align: 'center', baseline: 'middle', weight: on ? 700 : 500 });
            if (!outer) { const x2 = 0.68 * Math.sin(ang), y2 = 0.68 * Math.cos(ang); c.dot(x2, y2, { r: on ? 13 : 2, color: on ? (md.value === 'minor' ? 'orange' : 'accent') : 'faint', alpha: on ? 0.9 : 1 }); c.text(`${mn.str.toLowerCase()}`, x2, y2, { size: on ? 12.5 : 10, color: 'muted', align: 'center', baseline: 'middle', weight: on ? 700 : 400 }); }
            if (q === 0) c.text(`${kk > 0 ? kk + '♯' : kk < 0 ? -kk + '♭' : '0'}`, 0, 0, { size: 24, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          }
          const ai = (2 * Math.PI * kk) / 12; c.arrow(0, 0, 0.3 * Math.sin(ai), 0.3 * Math.cos(ai), { color: 'orange', width: 3 });
          // staff
          for (let i = 0; i < 5; i++) st.line(0.5, 2 * i, 9.5, 2 * i, { color: 'muted', width: 1.2 });
          st.text('G', 1.2, 2, { size: 22, color: 'muted', align: 'center', baseline: 'middle', weight: 700, plate: true });
          const list = kk >= 0 ? SH.slice(0, kk) : FL.slice(0, -kk);
          list.split('').forEach((l, i) => { const y = (kk >= 0 ? STEP_SH[l] : STEP_FL[l]) - 30; st.text(kk >= 0 ? '♯' : '♭', 2.3 + 0.7 * i, y, { size: 24, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); });
          st.text(list.split('').join(' ') || 'no accidentals', 5, -2, { size: 14, color: 'orange', align: 'center', weight: 700 });
          // keyboard: one octave
          const byPc = new Map(notes().map((n) => [n.pc, n]));
          [0, 2, 4, 5, 7, 9, 11].forEach((q, i) => { const n = byPc.get(q); kb.rect(i, 0, i + 1, 1.4, { fill: n ? (n.a ? 'orange' : 'accent') : 'panel', fillAlpha: n ? 0.7 : 1, color: 'muted', width: 1 }); if (n) kb.text(n.str, i + 0.5, 0.2, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); });
          [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]].forEach(([q, wi]) => { const n = byPc.get(q); kb.rect(wi + 0.65, 0.4, wi + 1.35, 1.4, { fill: n ? 'orange' : [30, 30, 30], fillAlpha: n ? 0.9 : 1, color: 'muted', width: 1 }); if (n) kb.text(n.str, wi + 1, 0.9, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); });
        });
        v.legend([['orange', 'key (circle) and altered notes'], ['accent', 'unaltered scale notes']]);
        v.readout(() => {
          const kk = k.value, T = nameAt(tonicP()), list = kk >= 0 ? SH.slice(0, kk) : FL.slice(0, -kk);
          const chk = (pc) => (pc === mod(7 * kk, 12) ? ' ✓' : ' ✗');
          const rule = kk > 0 ? `last sharp ${list[list.length - 1]}♯ (pitch class ${mod(LET_PC[LETTERS.indexOf(list[list.length - 1])] + 1)}); the major tonic is a semitone above it: pitch class ${mod(LET_PC[LETTERS.indexOf(list[list.length - 1])] + 2)}${chk(mod(LET_PC[LETTERS.indexOf(list[list.length - 1])] + 2))}` : kk < -1 ? `second-to-last flat ${list[list.length - 2]}♭ is the major tonic (pitch class ${mod(LET_PC[LETTERS.indexOf(list[list.length - 2])] - 1)}${chk(mod(LET_PC[LETTERS.indexOf(list[list.length - 2])] - 1))})` : kk === -1 ? 'one flat: the tonic is F (a fifth below C), the only case with no second-to-last flat' : 'no accidentals: C major or A minor';
          const mt = nameAt(kk);
          return `${kk === 0 ? 'no sharps or flats' : kk > 0 ? `${kk} sharp${kk > 1 ? 's' : ''}: ${list.split('').join(' ')}` : `${-kk} flat${kk < -1 ? 's' : ''}: ${list.split('').join(' ')}`} · major key **${mt.str} major**, relative minor **${nameAt(kk + 3).str} minor** · selected tonic ${T.str}${md.value === 'minor' ? ' minor' : ' major'} (pitch class ${mod(7 * tonicP(), 12)}) · ${rule}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.21
    {
      num: '8.21',
      kind: 'Concept',
      name: 'Change ringing and permutations',
      statement: String.raw`In **change ringing**, $n$ tuned bells are rung one after another in a **row**, an ordering of the bells $1,\dots,n$ (bell 1, the treble, is highest). Between consecutive rows a **change** is made: the bells swap places in disjoint adjacent pairs, so each change is a product of commuting adjacent transpositions, and a bell moves by at most one place. Written in **place notation**, a change lists the places that stay (e.g. $14$ on four bells leaves places 1 and 4 and swaps places 2 and 3; $x$ swaps every adjacent pair). A **method** is a sequence of changes repeated until rounds $(1,2,\dots,n)$ returns; the rows rung must be distinct in a true performance, and a method that rings all $n!$ rows once is an **extent**. **Plain hunt** on four bells ($x14x14x14x14$) returns to rounds after 8 rows; **Plain Bob Minimus** ($x14x14x14x12$, the last change a "lead end" that shifts the dodge) rings all 24 rows of four bells exactly once before rounds returns.`,
      idea: String.raw`Each change is an involution $\sigma_c$ in the symmetric group $S_n$, and a row is the product of the changes so far applied to rounds. Plain hunt uses the two involutions $a=(12)(34)\cdots$ and $b=(23)(45)\cdots$ alternately; $(ab)$ has order $n$ (a rotation of the sequence), so $2n$ rows return to rounds. Plain Bob replaces the last change of each lead by one that fixes bells 1 and 2 so the lead end is a different permutation, and the group generated is all of $S_4$, whose 24 elements are visited once: counting them is Lagrange's theorem and the walk is a Hamiltonian cycle in the Cayley graph for these generators.`,
      caption: String.raw`Each bell's path across the rows is drawn as a line (the treble in gold; choose another bell to follow in orange). Move the slider to ring the changes row by row, and press the speaker to hear the whole composition (bell 1 is the highest note). Pick a method or type your own place notation: the check counts how many distinct rows occur before rounds returns, and compares with $n!$.`,
      deps: ['comb-1.5'],
      see: ['music-8.7', 'comb-1.5'],
      refs: ['Benson §9.4 pp. 314–316', 'Tintinnalogia, 1671 edition, title page and sections Of the Changes / Plain Changes on four Bells (Project Gutenberg18567)'],
      tags: ['permutations', 'bells'],
      credit: 'Change ringing in England from the early seventeenth century; the first printed treatments are Tintinnalogia (1668, published by Fabian Stedman, text attributed to Richard Duckworth) and Stedman\'s Campanalogia (1677); dates from secondary sources (one gives 1667 for Tintinnalogia)',
      scope: String.raw`Plain methods on 4–6 bells as given by their place notation. A "true" extent of $n!$ rows is feasible only for small $n$ (24 rows on 4 bells, 120 on 5, 720 on 6, 40320 on 8); the viz stops after 130 changes.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Change_ringing' },
      verify: true,
      viz(v) {
        const PRE = { hunt4: ['plain hunt, 4 bells', 4, 'x14x14x14x14'], bob: ['Plain Bob Minimus', 4, 'x14x14x14x12'], hunt5: ['plain hunt, 5 bells (Doubles)', 5, '5.1.5.1.5.1.5.1.5.1'], hunt6: ['plain hunt, 6 bells (Minor)', 6, 'x16x16x16x16x16x16'] };
        const nb = v.select('bells', [4, 5, 6].map((n) => ({ value: n, label: String(n) })), 4);
        const inp = v.input('place notation', 'x14x14x14x12', { width: 320, onChange: () => v.invalidate() });
        const pre = v.select('method', [...Object.entries(PRE).map(([value, [label]]) => ({ value, label })), { value: 'own', label: 'my own' }], 'bob', { onChange: (x) => { if (PRE[x]) { nb.set(PRE[x][1]); inp.set(PRE[x][2]); } } });
        const fol = v.select('follow bell', [2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) })), 2);
        const pos = v.slider('change number', 0, 48, 48, { int: true });
        const s = v.stage({ x: [-0.5, 25.5], y: [0.3, 6.7], axes: false, full: true, height: 330, title: 'the path of each bell through the rows' });
        const parse = (pn, n) => { const toks = pn.split(/(x|-|\.)/).filter((t) => t && t !== '.'); if (!toks.length) return null; const out = []; for (const t of toks) { if (t === 'x' || t === '-') { out.push([]); continue; } const pl = []; for (const ch of t) { const q = ch === '0' ? 10 : ch === 'E' ? 11 : ch === 'T' ? 12 : +ch; if (!(q >= 1 && q <= n)) return null; pl.push(q); } out.push(pl); } return out; };
        const ring = (pn, n) => {
          const ch = parse(pn.trim(), n); if (!ch) return { err: 'cannot read the place notation for this number of bells' };
          let row = Array.from({ length: n }, (_, i) => i + 1); const rows = [row.slice()];
          for (let it = 0; it < 130; it++) { const pl = new Set(ch[it % ch.length]), nr = row.slice(); let i = 0; while (i < n) { if (pl.has(i + 1)) { i++; continue; } if (i + 1 < n && !pl.has(i + 2)) { [nr[i], nr[i + 1]] = [nr[i + 1], nr[i]]; i += 2; } else return { err: `a change leaves bell at place ${i + 1} with no partner to swap with (a place must be made or paired)` }; } row = nr; rows.push(row.slice()); if (row.every((x, j) => x === j + 1)) return { rows, back: true }; }
          return { rows, back: false };
        };
        const res = () => ring(inp.value, nb.value);
        const pitch = (b, n) => [0, 200, 400, 500, 700, 900, 1100, 1200][n - b];
        v.soundButton('ring the whole thing', (sd) => { const r = res(); if (!r.rows) return; const n = nb.value, parts = []; r.rows.slice(0, 48).forEach((row) => { parts.push(seqCents(row.map((b) => [pitch(b, n)]), C4, 0.17, 0.0)); parts.push(new Float32Array(Math.round(0.07 * SR))); }); const L = parts.reduce((a, q) => a + q.length, 0), out = new Float32Array(L); let o = 0; parts.forEach((q) => { out.set(q, o); o += q.length; }); sd.samples(out, SR, { gain: 0.9 }); });
        v.render(() => {
          const r = res(), n = nb.value;
          if (!r.rows) {
            s.setView([0, 10], [0, 4]);
            s.text('No rows: invalid place notation', 5, 2.6, { size: 18, weight: 700, color: 'red', align: 'center' });
            s.text(`For ${n} bells, every unfixed place needs an adjacent swap partner.`, 5, 2, { size: 14, color: 'ink', align: 'center' });
            s.text('Choose a matching method, or edit the place notation.', 5, 1.4, { size: 14, color: 'muted', align: 'center' });
            return;
          }
          const R = r.rows, last = R.length - 1, cur = Math.min(pos.value, last), xs = (i) => i;
          s.setView([-1, Math.max(8, last + 1)], [0.3, n + 0.7]);
          const f = Math.min(fol.value, n);
          for (let i = 0; i <= last; i++) if (i === cur) s.rect(i - 0.4, 0.4, i + 0.4, n + 0.6, { fill: 'orange', fillAlpha: 0.1, stroke: false });
          for (let b = 1; b <= n; b++) { const P = R.map((row, i) => [xs(i), n + 1 - (row.indexOf(b) + 1)]); s.path(P, { color: b === 1 ? 'gold' : b === f ? 'orange' : 'accent', width: b === 1 || b === f ? 3.4 : 1.2, alpha: b === 1 || b === f ? 1 : 0.35 }); }
          if (last <= 40) R.forEach((row, i) => row.forEach((b, j) => { if (b === 1 || b === f || last <= 12) s.text(String(b), i, n - j, { size: 10, color: 'ink', align: 'center', baseline: 'middle', plate: b === 1 || b === f }); }));
          R[cur].forEach((b, j) => s.dot(cur, n - j, { r: 6, color: b === 1 ? 'gold' : b === f ? 'orange' : 'accent' }));
          s.text(`row ${cur}: ${R[cur].join(' ')}`, Math.max(8, last + 1) / 2 - 0.5, n + 0.55, { size: 14, color: 'ink', align: 'center', baseline: 'middle', weight: 700, plate: true });
        });
        v.legend([['gold', 'treble (bell 1)'], ['orange', 'followed bell']]);
        v.readout(() => {
          const r = res(), n = nb.value; if (!r.rows) return r.err;
          const R = r.rows, distinct = new Set(R.slice(0, R.length - (r.back ? 1 : 0)).map((x) => x.join(''))).size, fact = [1, 1, 2, 6, 24, 120, 720][n], len = R.length - 1;
          return `${n} bells: ${r.back ? `rounds returns after ${len} changes` : `no return to rounds within ${len} changes`} · distinct rows rung: ${distinct} of $${n}!=${fact}$ · ${r.back && distinct === len ? 'every row is different (a true method)' : 'some rows repeat'}${distinct === fact && r.back ? ' · all $n!$ rows are rung: an extent ✓' : ''} · each change is a product of disjoint adjacent swaps, so a bell moves at most one place per change.`;
        });
      },
    },
  ],
};
