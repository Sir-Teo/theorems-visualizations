// Music Theory & Acoustics — Chapter 7: Tuning and temperament (items 7.1–7.6)
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, M3P, NOTE, sc, fold, circ, ring, cents, gcd, seqCents, chordCents, nearPairs, tuneChain, chainSemi, CHAIN } from './ch07.shared.js';

const CH = CHAIN;

export default {
  collection: 'music',
  chapter: 7,
  title: 'Tuning and temperament',
  summary: String.raw`Pure fifths and pure octaves can never be reconciled, because no power of 3/2 equals a power of 2. Every tuning system is a policy for distributing the leftover commas: Pythagorean tuning dumps them into a wolf fifth, just intonation keeps thirds pure and drifts, meantone and the well temperaments share the damage unevenly, and equal temperament shares it perfectly evenly. Continued fractions of $\log_2(3/2)$ explain why twelve equal steps work so well and point to 19, 31, 41 and 53 as the next candidates.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Method',
      name: 'Pythagorean tuning',
      statement: String.raw`Pythagorean tuning builds a scale from two intervals only, the octave $2{:}1$ and the pure fifth $3{:}2$. Start on a note, tune a pure fifth above it, another above that, and so on; after folding every note back into one octave (dividing by 2 as often as needed) each note has a frequency ratio $3^k/2^m$ to the first. Five consecutive notes of the fifth-chain (four fifths) give the pentatonic scale; seven notes, taken from F to B, give the diatonic scale with two kinds of step, the whole tone $9{:}8$ (203.9 ¢) and the semitone or **limma** $256{:}243$ (90.2 ¢). Twelve notes fill the octave with the limma and a larger semitone (the apotome, 113.7 ¢).`,
      idea: String.raw`Stacking $k$ fifths multiplies a frequency by $(3/2)^k$, which adds $k\cdot701.955$ ¢ on the logarithmic scale of pitch (1.6); folding into the octave is subtraction of multiples of 1200 ¢, so the notes are the points $k\cdot701.955 \bmod 1200$ on a circle. Two consecutive fifths minus an octave make a whole tone $(9/8)$, and the leftover between two tones and a fourth is the limma $(256/243)$. The method is old: Greek theorists built their tetrachords with $9{:}8$ tones and a $256{:}243$ remainder, and medieval European music was tuned this way until pure thirds became desirable (7.5).`,
      caption: String.raw`The slider stacks pure fifths one at a time; each new note lands on the pitch circle (one turn is one octave) and the gold note is the newest. Start the chain on F to reach the diatonic scale after seven notes, or on C to reach the pentatonic scale after five. Below, the notes laid out within the octave, with the size of each step in cents: tones (T) and limmas (L). Play the scale, or the last fifth added.`,
      deps: ['music-6.1', 'music-1.6'],
      see: ['music-2.6', 'music-7.2', 'music-8.1'],
      refs: ['Benson §5.2 pp. 154–155 (full author-hosted text)'],
      tags: ['tuning', 'fifths'],
      credit: 'Greek harmonics (the "Pythagorean" scale, traditionally attributed to Pythagoras and described by Philolaus and in Plato\'s Timaeus)',
      scope: String.raw`An abstract tuning: every fifth is exactly $3{:}2$. The attribution to Pythagoras himself rests on later tradition; the numerical scale is certainly Greek. Its major third $81/64$ (407.8 ¢) is 21.5 ¢ wider than the pure $5/4$, which is why it was later abandoned for chords.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pythagorean_tuning' },
      verify: true,
      viz(v) {
        const NM = ['F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯'];
        const from = v.select('chain starts at', [{ value: 'F', label: 'F: F C G D A E B …' }, { value: 'C', label: 'C: C G D A E B …' }], 'F');
        const n = v.slider('fifths stacked (notes in the chain)', 1, 12, 7, { int: true });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.42, 1.42], equal: true, axes: false, height: 400, title: 'the pitch circle: one turn is one octave' });
        const ld = v.stage({ x: [-40, 1240], y: [0, 1], height: 150, axes: false, full: true, title: 'the notes within the octave (cents above C)' });
        const snd = v.sound();
        const notes = () => { const k0 = from.value === 'F' ? -1 : 0; return Array.from({ length: n.value }, (_, i) => { const k = k0 + i; return { k, name: NM[k + 1], pc: fold(k * FIFTH) }; }); };
        const kind = (d) => (Math.abs(d - cents(9 / 8)) < 0.6 ? 'T' : Math.abs(d - cents(256 / 243)) < 0.6 ? 'L' : Math.abs(d - cents(32 / 27)) < 0.6 ? 'T+L' : Math.abs(d - cents(65536 / 59049)) < 0.6 ? 'T+T' : '');
        const steps = (N) => { const P = N.map((x) => x.pc).sort((a, b) => a - b); return P.map((p, i) => ({ a: p, b: i + 1 < P.length ? P[i + 1] : P[0] + 1200, d: (i + 1 < P.length ? P[i + 1] : P[0] + 1200) - p })); };
        v.soundButton('play the scale', (sd) => { const P = notes().map((x) => x.pc).sort((a, b) => a - b); sd.samples(seqCents(P.concat([P[0] + 1200]).map((c) => [c]), C4, 0.55, 0.03), SR, { gain: 0.9 }); });
        v.soundButton('play the last fifth', (sd) => { const N = notes(); if (N.length < 2) return; const p = N[N.length - 2].pc; const b = p > 600 ? p - 1200 : p; sd.samples(chordCents([b, b + FIFTH], C4, 1.6), SR, { gain: 0.9 }); });
        v.render(() => {
          const N = notes();
          ring(s, 1, { tick: 100 });
          N.forEach((x, i) => {
            if (i) { const a = circ(N[i - 1].pc, 0.97), b = circ(x.pc, 0.97); s.arrow(a[0], a[1], b[0], b[1], { color: 'orange', width: 1.4, alpha: 0.65 }); }
          });
          N.forEach((x, i) => {
            const p = circ(x.pc, 1), q = circ(x.pc, 1.17), last = i === N.length - 1;
            s.dot(p[0], p[1], { r: last ? 8 : 6, color: last ? 'gold' : 'accent' });
            s.text(x.name, q[0], q[1], { size: 12.5, color: last ? 'gold' : 'ink', align: 'center', baseline: 'middle', weight: 600 });
          });
          const st = steps(N), pat = st.map((q) => kind(q.d) || v.fix(q.d, 0)).join(' ');
          s.text(N.length > 1 ? pat : '', 0, 0, { size: 12.5, color: 'muted', align: 'center', baseline: 'middle', plate: true });
          // ladder
          ld.line(0, 0.5, 1200, 0.5, { color: 'faint', width: 1.5 });
          const sorted = N.slice().sort((a, b) => a.pc - b.pc);
          for (let c = 0; c <= 1200; c += 100) ld.line(c, 0.46, c, 0.54, { color: 'muted', width: 1 });
          sorted.forEach((x) => { ld.dot(x.pc, 0.5, { r: 5.5, color: 'accent' }); ld.text(x.name, x.pc, 0.76, { size: 12, align: 'center', weight: 600 }); ld.text(v.fix(x.pc, 1), x.pc, 0.22, { size: 9.5, color: 'muted', align: 'center' }); });
          if (sorted.length) { ld.dot(sorted[0].pc + 1200, 0.5, { r: 5.5, color: 'accent', hollow: true }); }
          st.forEach((q) => { if (q.d > 40) ld.text(kind(q.d) || v.fix(q.d, 0), (q.a + q.b) / 2, 0.5, { size: 11, color: 'orange', align: 'center', baseline: 'bottom', dy: -7, weight: 700 }); });
        });
        v.legend([['accent', 'note of the chain'], ['gold', 'newest note'], ['orange', 'fifth added (3:2 = 701.955 ¢)']]);
        v.readout(() => {
          const N = notes(), st = steps(N), last = N[N.length - 1];
          const T = st.filter((q) => kind(q.d) === 'T').length, L = st.filter((q) => kind(q.d) === 'L').length;
          const e = N.find((x) => x.name === 'E♯'), f = N.find((x) => x.name === 'F');
          return `${N.length} note${N.length > 1 ? 's' : ''}: newest ${last.name} = $(3/2)^{${last.k}}$ folded = ${v.fix(last.pc, 2)} ¢ above C · steps: ${st.map((q) => v.fix(q.d, 1)).join(', ')} ¢${T || L ? ` (${T} tone${T === 1 ? '' : 's'} of 203.9 ¢, ${L} limma${L === 1 ? '' : 's'} of 90.2 ¢)` : ''}${e && f ? ` · E♯ is ${v.fix(e.pc - f.pc, 2)} ¢ above F: the circle does not close (7.3)` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Theorem',
      name: 'Fifths and octaves never meet',
      statement: String.raw`There are no integers $k\ge1$ and $m$ with $(3/2)^k = 2^m$. Equivalently, $\log_2(3/2)$ is irrational, no stack of pure fifths ends exactly on a stack of octaves, and the folded notes $1200k\log_2(3/2) \bmod 1200$ ¢ are all different. By Kronecker's theorem (an irrational rotation has a dense orbit) they come arbitrarily close to every point of the octave: continuing the chain of pure fifths forever fills the pitch circle densely. The same holds for any stack of a pure ratio $p/q$ whose logarithm is irrational, such as the pure third $5/4$.`,
      idea: String.raw`If $(3/2)^k = 2^m$ then $3^k = 2^{m+k}$. The left side is odd and the right side is even for $k\ge1$, a contradiction (this is unique factorization into primes in its simplest form). So the rotation by $\alpha=\log_2(3/2)$ turns on the circle $\R/\Z$ by an irrational amount; the points $k\alpha \bmod 1$ are therefore distinct, and by the pigeonhole principle two of the first $N$ lie within $1/N$ of each other, which gives points arbitrarily near the starting note: taking integer multiples of these arbitrarily small rotations gives arbitrarily fine nets in the circle. The near misses (12, 41, 53 fifths) are where the spiral almost closes, and are explained by continued fractions (7.10).`,
      caption: String.raw`Left: the spiral of $k$ stacked intervals wrapped around the octave circle (one turn is 1200 ¢; the radius grows with $k$ so the spiral can be followed). Near misses are marked in gold. Right: the distance of the $k$-th note from the starting note, in cents, on a logarithmic scale; every new record low is marked. Slide the number of steps up to 400, and choose the pure third, or the equal-tempered fifth $2^{7/12}$, for which the spiral does close after exactly 12 steps (the hypothesis fails).`,
      deps: ['music-7.1', 'pma-1.20'],
      see: ['music-7.10', 'music-7.3', 'music-7.14'],
      refs: ['Benson §6.2 pp. 204–209 (irrationality and convergents)'],
      tags: ['irrationality', 'fifths'],
      credit: 'Greek harmonics (impossibility of dividing the octave into whole tones of 9:8, Euclid, Sectio canonis, and Boethius); Kronecker, 1884 (density)',
      scope: String.raw`Exact statement about the ratio $3/2$ and about any ratio $r$ with $\log_2 r\notin\Q$. For $r = 2^{7/12}$ (equal temperament) the orbit is finite, with period 12.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pythagorean_comma' },
      verify: true,
      viz(v) {
        const C = { fifth: FIFTH, third: M3J, et: 700 };
        const which = v.select('stacked interval', [{ value: 'fifth', label: 'pure fifth 3:2' }, { value: 'third', label: 'pure third 5:4' }, { value: 'et', label: 'tempered fifth 2^(7/12)' }], 'fifth');
        const N = v.slider('number of steps', 1, 400, 60, { int: true, log: true });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 400, title: 'the spiral on the octave circle' });
        const e = v.stage({ x: [1, 700], y: [0.01, 700], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'steps k', ylabel: 'distance from the start (¢)', title: 'near misses' });
        const dist = (c, k) => { const f = fold(k * c); return Math.min(f, 1200 - f); };
        const recs = (c, kmax) => { const out = []; let best = 1e9; for (let k = 1; k <= kmax; k++) { const d = dist(c, k); if (d < best - 1e-7) { best = d; out.push(k); } } return out; };
        const R = () => recs(C[which.value], 700);
        v.render(() => {
          const c = C[which.value], n = N.value, rec = R(), R0 = 0.3, R1 = 1.0;
          ring(s, 1.12, { tick: 100, len: 0.03 });
          s.text('start', 0, 1.27, { size: 10.5, color: 'muted', align: 'center' });
          s.line(0, R0, 0, 1.12, { color: 'faint', dash: [4, 4] });
          const rad = (k) => R0 + (R1 - R0) * (k / n);
          if (n <= 120) { const P = []; for (let k = 0; k <= n; k++) { const a = circ(fold(k * c), rad(k)); P.push(a); } s.path(P, { color: 'accent', width: 1, alpha: 0.35 }); }
          for (let k = 1; k <= n; k++) { const a = circ(fold(k * c), rad(k)); s.dot(a[0], a[1], { r: n > 150 ? 1.6 : 2.6, color: 'accent', alpha: 0.85 }); }
          const a0 = circ(0, R0); s.dot(a0[0], a0[1], { r: 6, color: 'green' });
          rec.filter((k) => k <= n && (k >= 5 || which.value === 'third')).forEach((k) => { const a = circ(fold(k * c), rad(k)), q = circ(fold(k * c), rad(k) + 0.16); s.dot(a[0], a[1], { r: 6, color: 'gold' }); s.text(`${k}`, q[0], q[1], { size: 11.5, color: 'gold', align: 'center', baseline: 'middle', weight: 700, plate: true }); });
          const P = []; for (let k = 1; k <= 700; k++) P.push([k, Math.max(0.01, dist(c, k))]);
          e.dots(P.filter((p) => p[0] <= n), { r: 2, color: 'accent', alpha: 0.8 });
          e.dots(P.filter((p) => p[0] > n), { r: 1.4, color: 'faint', alpha: 0.6 });
          rec.forEach((k) => { const d = Math.max(0.01, dist(c, k)); e.dot(k, d, { r: k <= n ? 5 : 3.5, color: k <= n ? 'gold' : 'faint', hollow: k > n }); if (k <= n && k >= 5 && d > 0.011) e.text(`${k}`, k, d, { size: 10.5, color: 'gold', align: 'left', dx: 6, dy: -7, plate: true, weight: 700 }); });
          e.vline(n, { color: 'orange', dash: [5, 4] });
        });
        v.legend([['green', 'start (0 steps)'], ['accent', 'k-th note'], ['gold', 'record near miss']]);
        const minGap = (c, n) => { const P = Array.from({ length: n + 1 }, (_, i) => fold(i * c)).sort((a, b) => a - b); let g = 1200 - P[n] + P[0]; for (let i = 1; i <= n; i++) g = Math.min(g, P[i] - P[i - 1]); return g; };
        v.readout(() => {
          const c = C[which.value], n = N.value, rec = recs(c, n), k = rec[rec.length - 1], d = dist(c, k), m = Math.round((k * c) / 1200);
          if (which.value === 'et') return `after 12 steps the chain returns exactly to the start (7 octaves = 8400 ¢): $(2^{7/12})^{12}=2^7$, so the orbit is finite with period 12. The theorem does not apply: $2^{7/12}$ is not a ratio of integers, let alone 3/2`;
          const base = which.value === 'fifth' ? 3 : 5, e = (which.value === 'fifth' ? k : 2 * k) + m;
          return `${n} steps · closest approach so far at step ${k}: ${v.fix(d, 3)} ¢ from the start, ${m} octave${m === 1 ? '' : 's'} up · here $${base}^{${k}}$ is odd and $2^{${e}}$ is even, so they are never equal · the ${n + 1} notes so far are all distinct, the closest pair ${v.fix(minGap(c, n), 3)} ¢ apart`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Definition',
      name: 'The Pythagorean comma',
      statement: String.raw`The **Pythagorean comma** is the amount by which twelve pure fifths overshoot seven octaves: the ratio $\dfrac{3^{12}}{2^{19}}=\dfrac{531441}{524288}\approx1.01364$, that is $12\cdot701.955-8400 = 23.46$ ¢, about a quarter of a semitone. It is the ratio between the sharp spelled by going up (B♯, the twelfth note of the chain) and the note it was meant to be (C), and, in Pythagorean tuning, between the two kinds of semitone, the apotome and the limma. By 7.2 it is not zero and no multiple of it is.`,
      idea: String.raw`Write the twelve fifths as a sum of intervals in cents: $12\log_2(3/2)=12\log_2 3-12$ octaves. Seven octaves are 7, so the leftover is $12\log_23-19=0.0195$ octaves $=23.46$ ¢. It is also the difference of the two semitones that the chain produces: the apotome $2187/2048$ (113.7 ¢) minus the limma $256/243$ (90.2 ¢). Played together, two notes this far apart do not make an interval at all but a beat: at middle C the twelfth fifth and the start differ by $261.6\times0.01364=3.6$ Hz.`,
      caption: String.raw`Twelve fifths (orange, alternating shades) laid end to end on a logarithmic ruler, above seven octaves (blue). The lower picture zooms in on the end of the rows: the gap is the comma. Slide the number of fifths; play the two notes together to hear them beat at the rate shown (choose the register) or one after the other.`,
      deps: ['music-7.2'],
      see: ['music-7.4', 'music-5.6', 'music-7.9'],
      refs: ['Benson ch. 5', 'Loy I ch. 3'],
      tags: ['comma'],
      scope: String.raw`Exact number: $3^{12}/2^{19}$. The beat rate quoted is for the fundamentals of two notes of the 6-harmonic tone; higher partials beat faster.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pythagorean_comma' },
      viz(v) {
        const n = v.slider('number of fifths', 0, 12, 12, { int: true });
        const reg = v.select('register of the C', [{ value: 0.5, label: 'C3' }, { value: 1, label: 'C4' }, { value: 2, label: 'C5' }], 1);
        const top = v.stage({ x: [-120, 8760], y: [0, 3.4], height: 220, axes: false, full: true, title: 'twelve pure fifths against seven octaves (cents, logarithmic ruler)' });
        const zm = v.stage({ x: [8350, 8450], y: [0, 3.4], height: 200, axes: false, full: true, title: 'zoom on the end of the rows' });
        const ratio = () => 3 ** 12 / 2 ** 19;
        v.soundButton('play C with the twelfth fifth (beats)', (sd) => { const f = C4 * reg.value; sd.samples(chordCents([0, PCOMMA], f, 4.2), SR, { gain: 0.9 }); });
        v.soundButton('one after the other', (sd) => sd.samples(seqCents([[0], [PCOMMA], [0], [PCOMMA]], C4 * reg.value, 0.9, 0.1), SR, { gain: 0.9 }));
        const rows = (s, x0, x1) => {
          const k = n.value, oc = Math.max(1, Math.round((k * FIFTH) / 1200));
          for (let i = 0; i < k; i++) { s.rect(i * FIFTH, 1.9, (i + 1) * FIFTH, 2.6, { fill: i % 2 ? 'orange' : 'gold', fillAlpha: 0.5, color: 'orange', width: 1 }); if (s === top) s.text(`${i + 1}`, (i + 0.5) * FIFTH, 2.25, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); }
          for (let i = 0; i < oc; i++) { s.rect(i * 1200, 0.7, (i + 1) * 1200, 1.4, { fill: 'accent', fillAlpha: i % 2 ? 0.28 : 0.5, color: 'accent', width: 1 }); if (s === top) s.text(`${i + 1}`, (i + 0.5) * 1200, 1.05, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); }
          return oc;
        };
        v.render(() => {
          const k = n.value, e = k * FIFTH, oc = rows(top);
          top.vline(0, { color: 'green', width: 1.6 });
          top.text('fifths ' + `${k} × 701.955 = ${v.fix(e, 2)} ¢`, 0, 3.0, { size: 11, color: 'orange', align: 'left', dx: 4 });
          top.text(`octaves: ${oc} × 1200 = ${oc * 1200} ¢`, 0, 0.35, { size: 11, color: 'accent', align: 'left', dx: 4 });
          if (k === 12) { top.vline(e, { color: 'red', dash: [4, 3] }); top.vline(8400, { color: 'accent', dash: [4, 3] }); top.text('gap 23.46 ¢', 8400, 3.1, { size: 12, color: 'red', align: 'right', dx: -6, weight: 700, plate: true }); }
          // zoom
          const oc2 = Math.max(1, Math.round(e / 1200)), a = Math.min(e, oc2 * 1200), b = Math.max(e, oc2 * 1200), w = Math.max(40, (b - a) * 3.2);
          zm.setView([(a + b) / 2 - w / 2, (a + b) / 2 + w / 2], [0, 3.4]);
          zm.rect(e - 0.7 * FIFTH, 1.9, e, 2.6, { fill: 'orange', fillAlpha: 0.5, color: 'orange' });
          zm.rect(oc2 * 1200 - 600, 0.7, oc2 * 1200, 1.4, { fill: 'accent', fillAlpha: 0.45, color: 'accent' });
          zm.vline(e, { color: 'orange', width: 1.6 }); zm.vline(oc2 * 1200, { color: 'accent', width: 1.6 });
          zm.text(`${k} fifths: ${v.fix(e, 2)} ¢`, e, 3.05, { size: 11.5, color: 'orange', align: e >= oc2 * 1200 ? 'left' : 'right', dx: e >= oc2 * 1200 ? 5 : -5 });
          zm.text(`${oc2} octaves: ${oc2 * 1200} ¢`, oc2 * 1200, 0.35, { size: 11.5, color: 'accent', align: e >= oc2 * 1200 ? 'right' : 'left', dx: e >= oc2 * 1200 ? -5 : 5 });
          if (Math.abs(e - oc2 * 1200) > 1e-6) zm.measure(Math.min(e, oc2 * 1200), 1.65, Math.max(e, oc2 * 1200), 1.65, `${v.fix(Math.abs(e - oc2 * 1200), 2)} ¢`, { color: 'red' });
        });
        v.readout(() => {
          const k = n.value, f = C4 * reg.value, b = f * (ratio() - 1);
          return `$3^{12}/2^{19}=531441/524288=${v.fix(ratio(), 6)}$ = ${v.fix(PCOMMA, 3)} ¢ · apotome − limma = ${v.fix(cents(2187 / 2048) - cents(256 / 243), 3)} ¢ · played with the C at ${v.fix(f, 1)} Hz the twelfth-fifth note is ${v.fix(f * ratio(), 2)} Hz: the fundamentals beat ${v.fix(b, 2)} times a second, their second partials ${v.fix(2 * b, 2)}${k < 12 ? ' (the comma shows once you reach twelve fifths)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Concept',
      name: 'The wolf fifth',
      statement: String.raw`A keyboard with twelve notes per octave tuned in Pythagorean fashion can have eleven pure fifths in a chain, but then the twelfth fifth, which closes the circle, is smaller than pure by the whole Pythagorean comma: $701.955-23.46=678.5$ ¢ (ratio $262144/177147$). This out-of-tune interval is the **wolf fifth** (it "howls"). Where it sits is a choice of the tuner: it lies between the two ends of the chain, traditionally between G♯ and E♭. The major thirds that straddle the wolf come out nearly pure ($384.4$ ¢, 2 ¢ flat of 5/4) while all the others are the wide Pythagorean thirds of 407.8 ¢.`,
      idea: String.raw`The twelve fifths of the circle sum to seven octaves only if each is $700$ ¢. With eleven fifths pure the sum of the twelve falls short of 8400 ¢ by exactly the comma (7.3), and the shortfall must go somewhere: one fifth absorbs it all. A major third is four fifths up less two octaves; if the wolf is one of the four, the third loses one comma, $407.8-23.5=384.4$ ¢, which is why the wolf's neighbours were the useful thirds. Moving the wolf to another position changes which keys are usable, never the existence of the wolf (7.2).`,
      caption: String.raw`The circle of fifths with the wolf (red) between the two notes chosen by the slider; all other fifths are pure (green). Click a fifth to hear it, or play all twelve in turn around the circle. Below, the twelve major thirds from each note: all are the wide Pythagorean third except the four that contain the wolf (red line: the pure third 5/4). Move the wolf and watch the good thirds move with it.`,
      deps: ['music-7.3'],
      see: ['music-7.7', 'music-7.14', 'music-7.8'],
      refs: ['Benson ch. 5'],
      tags: ['tuning', 'wolf'],
      scope: String.raw`Pythagorean tuning with a 12-note chain; the cents are exact. The traditional placement G♯–E♭ keeps the commonly used keys (up to three sharps or flats) free of the wolf; in practice the wolf was also moved to suit a piece. The anchor of the tuning (here the note opposite the wolf) is set to its equal-tempered pitch.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wolf_interval' },
      viz(v) {
        const WOLF = FIFTH - PCOMMA;
        const w = v.slider('the wolf is the fifth starting on…', 0, 11, 11, { int: true, fmt: (x) => `${CH[x]}–${CH[(x + 1) % 12]}` });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.42, 1.42], equal: true, axes: false, height: 380, title: 'the circle of fifths' });
        const b = v.stage({ x: [-0.6, 11.6], y: [376, 412], axes: 'box', gutter: true, height: 300, xlabel: 'major third built on …', ylabel: 'cents', xticks: [], yticks: [[380, '380'], [386.3, '386.3'], [390, '390'], [400, '400'], [407.8, '407.8']], title: 'the twelve major thirds' });
        const snd = v.sound();
        const fifths = () => CH.map((_, i) => (i === w.value ? WOLF : FIFTH));
        const tune = () => tuneChain(fifths(), w.value, (w.value + 7) % 12, chainSemi((w.value + 7) % 12) * 100);
        const ang = (j) => ((j - 3) * 30 * Math.PI) / 180;
        const pt = (j, R = 1) => [R * Math.sin(ang(j)), R * Math.cos(ang(j))];
        const play = (j) => { const P = tune(), p = P[chainSemi(j)], base = p > 600 ? p - 1200 : p, size = j === w.value ? WOLF : FIFTH; snd.stop(); snd.samples(chordCents([base, base + size], C4, 1.6), SR, { gain: 0.9 }); };
        s.onClick((x, y) => { const a = Math.atan2(x, y); let best = 0, bd = 9; for (let j = 0; j < 12; j++) { const m = ang(j) + Math.PI / 12; let d = Math.abs(Math.atan2(Math.sin(a - m), Math.cos(a - m))); if (d < bd) { bd = d; best = j; } } play(best); });
        v.soundButton('play the twelve fifths in turn', (sd) => { const P = tune(), f = fifths(); const ch = []; for (let k = 0; k < 12; k++) { const j = (w.value + 1 + k) % 12, p = P[chainSemi(j)], base = p > 600 ? p - 1200 : p; ch.push([base, base + f[j]]); } sd.samples(seqCents(ch, C4, 0.9, 0.08), SR, { gain: 0.9 }); });
        v.soundButton('play the wolf', () => play(w.value));
        v.render(() => {
          const P = tune(), f = fifths();
          for (let j = 0; j < 12; j++) {
            const a = pt(j), c = pt((j + 1) % 12), wolf = j === w.value;
            s.line(a[0], a[1], c[0], c[1], { color: wolf ? 'red' : 'green', width: wolf ? 4 : 2.2, alpha: wolf ? 0.95 : 0.75 });
            const m = pt(j + 0.5, 0.78); s.text(v.fix(f[j], 1), m[0], m[1], { size: 10.5, color: wolf ? 'red' : 'muted', align: 'center', baseline: 'middle', plate: true, weight: wolf ? 700 : 400 });
          }
          for (let j = 0; j < 12; j++) { const p = pt(j); s.dot(p[0], p[1], { r: 6, color: 'accent' }); const q = pt(j, 1.17); s.text(CH[j], q[0], q[1], { size: 12.5, align: 'center', baseline: 'middle', weight: 600 }); }
          { const q = pt(w.value + 0.5, 1.32); s.text('wolf', q[0], q[1], { size: 11, color: 'red', align: 'center', baseline: 'middle', weight: 700 }); }
          for (let r = 0; r < 12; r++) {
            const t = fold(P[(r + 4) % 12] - P[r] + 0), col = Math.abs(t - M3J) < 4 ? 'green' : t < 400 ? 'red' : 'accent';
            b.rect(r - 0.38, 376, r + 0.38, t, { fill: col, fillAlpha: 0.55, color: col });
            b.text(NOTE[r], r, 377.5, { size: 11, align: 'center', baseline: 'bottom', plate: true });
            b.text(v.fix(t, 1), r, t, { size: 10.5, align: 'center', baseline: 'bottom', dy: -3, color: 'muted' });
          }
          b.hline(M3J, { color: 'red', dash: [5, 4] });
        });
        v.legend([['green', 'pure fifth 3:2 (701.96 ¢)'], ['red', 'wolf fifth (678.5 ¢)']]);
        v.readout(() => {
          const P = tune(), nt = (j) => CH[j];
          const bad = []; for (let r = 0; r < 12; r++) { const t = fold(P[(r + 4) % 12] - P[r]); if (t < 400) bad.push(NOTE[r]); }
          return `wolf: ${nt(w.value)}–${nt((w.value + 1) % 12)} = ${v.fix(WOLF, 2)} ¢ = $3^{12}/2^{19}$ narrower than pure by ${v.fix(PCOMMA, 2)} ¢ · eleven fifths pure; sum of the twelve = ${v.fix(11 * FIFTH + WOLF, 2)} ¢ = 7 octaves · the narrow thirds of ${v.fix(M3P - PCOMMA, 1)} ¢ start on ${bad.join(', ')}; the other eight are ${v.fix(M3P, 1)} ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Method',
      name: 'Just intonation',
      statement: String.raw`**Five-limit just intonation** builds every interval from the primes 2, 3 and 5: every note has a ratio $2^a3^b5^c$ to the tonic. Laid out on a lattice with pure fifths $3{:}2$ in one direction and pure major thirds $5{:}4$ in the other, the notes of the just major scale are $1,\ 9/8,\ 5/4,\ 4/3,\ 3/2,\ 5/3,\ 15/8$ (C D E F G A B), and the three main triads on the tonic, subdominant and dominant (C E G, F A C, G B D) are all exactly $4{:}5{:}6$: their partials coincide, so they sound without beats. The price: some intervals of the scale are not what a Pythagorean ear expects (the whole tone $9{:}8$ and the smaller $10{:}9$ both occur), and the scale cannot be transposed (7.6).`,
      idea: String.raw`A consonant interval is one where partials coincide (6.2); the simplest coincidences are $3{:}2$, $4{:}3$, $5{:}4$, $6{:}5$. Choose the major scale so that the three triads on I, IV and V are $4{:}5{:}6$: this fixes the notes $1,\,5/4,\,3/2$ (I), $4/3,\,5/3,\,2$ (IV) and $3/2,\,15/8,\,9/4$ (V), seven notes in all. In the lattice the I, IV and V triads are the three triangles (upward-pointing) that share corners; the scale has three step sizes: $9/8$ (203.9 ¢), $10/9$ (182.4 ¢) and $16/15$ (111.7 ¢). Compared with equal temperament the thirds of 386.3 ¢ and sixths of 884.4 ¢ are much closer to the ratios of small numbers.`,
      caption: String.raw`The 5-limit lattice (notes folded into one octave): fifths run to the right, pure major thirds upward. Choose to light the whole just major scale or one triad; click any node to hear that note, or play the chord in just intonation, in equal temperament, or alternately. The readout gives each lit note's offset from equal temperament and the beats of the nearly coincident partials in the equal-tempered chord.`,
      deps: ['music-7.1', 'music-6.2'],
      see: ['music-6.1', 'music-7.6', 'music-7.13', 'music-7.15'],
      refs: ['Benson §5.5 pp. 159–160'],
      tags: ['just intonation', 'lattice'],
      credit: 'Ptolemy (the "intense diatonic", 2nd c.); Zarlino, Le istitutioni harmoniche, 1558',
      scope: String.raw`Tonic-centred 5-limit tuning: the triads on I, IV and V are pure, but the supertonic triad D F A has a mistuned fifth (680.4 ¢, narrower by the syntonic comma) and the scale cannot modulate (7.6). Zarlino's role in making the Ptolemaic scale the standard of just intonation is widely stated but I have not re-checked the dates.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Just_intonation' },
      verify: true,
      viz(v) {
        const SC = [['C', 0, 0], ['D', 2, 0], ['E', 0, 1], ['F', -1, 0], ['G', 1, 0], ['A', -1, 1], ['B', 1, 1]];
        const TR = { I: ['C', 'E', 'G'], IV: ['F', 'A', 'C'], V: ['G', 'B', 'D'] };
        const sel = v.select('light up', [{ value: 'scale', label: 'major scale' }, { value: 'I', label: 'I  (C E G)' }, { value: 'IV', label: 'IV  (F A C)' }, { value: 'V', label: 'V  (G B D)' }], 'scale');
        const s = v.stage({ x: [-3.6, 4.6], y: [-2.6, 3.6], equal: true, axes: false, height: 440, title: 'the 5-limit lattice' });
        const snd = v.sound();
        // exact ratio of lattice point (i, j) folded into [1, 2)
        const ratio = (i, j) => { let p = 1, q = 1; if (i >= 0) { p *= 3 ** i; q *= 2 ** i; } else { p *= 2 ** -i; q *= 3 ** -i; } if (j >= 0) { p *= 5 ** j; q *= 4 ** j; } else { p *= 4 ** -j; q *= 5 ** -j; } while (p >= 2 * q) q *= 2; while (p < q) p *= 2; const g = gcd(p, q); return [p / g, q / g]; };
        const rc = (i, j) => { const [p, q] = ratio(i, j); return cents(p / q); };
        const NAMEPOS = Object.fromEntries(SC.map(([n, i, j]) => [n, [i, j]]));
        const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const lit = () => (sel.value === 'scale' ? SC.map((x) => x[0]) : TR[sel.value]);
        const chord = () => (sel.value === 'scale' ? null : TR[sel.value]);
        const cj = (names) => { const c = names.map((n) => rc(...NAMEPOS[n])); const b0 = c[0]; return c.map((x) => { let d = x - b0; while (d < 0) d += 1200; return d; }).sort((a, b) => a - b); };
        const rootJ = () => (chord() ? rc(...NAMEPOS[chord()[0]]) : 0);
        const play = (mode) => {
          const ch = chord();
          if (!ch) { snd.stop(); snd.samples(seqCents(SC.map(([n, i, j]) => [rc(i, j)]).sort((a, b) => a[0] - b[0]).concat([[1200]]), C4, 0.5, 0.03), SR, { gain: 0.9 }); return; }
          const bj = rootJ() > 600 ? rootJ() - 1200 : rootJ(), r0 = SEMI[ch[0]] * 100, be = r0 > 600 ? r0 - 1200 : r0;
          const jj = cj(ch).map((x) => bj + x), ee = ch.map((n) => fold(SEMI[n] * 100 - r0)).sort((a, b) => a - b).map((x) => be + x);
          snd.stop();
          snd.samples(seqCents(mode === 'just' ? [jj] : mode === 'et' ? [ee] : [jj, ee, jj, ee], C4, mode === 'alt' ? 1.3 : 2.2, 0.12), SR, { gain: 0.9 });
        };
        v.soundButton('play: just', () => play('just'));
        v.soundButton('play: equal temperament', () => play('et'));
        v.soundButton('alternate: just, 12-TET', () => play('alt'));
        s.onClick((x, y) => { const i = Math.round(x), j = Math.round(y); if (Math.abs(x - i) < 0.4 && Math.abs(y - j) < 0.4) { snd.stop(); snd.samples(seqCents([[rc(i, j)]], C4, 1.4, 0), SR, { gain: 0.9 }); } });
        v.render(() => {
          const L = lit(), inSet = (i, j) => SC.find((x) => x[1] === i && x[2] === j && L.includes(x[0]));
          for (let j = -2; j <= 3; j++) for (let i = -3; i <= 4; i++) { if (i < 4) s.line(i, j, i + 1, j, { color: 'faint', width: 1, alpha: 0.5 }); if (j < 3) s.line(i, j, i, j + 1, { color: 'faint', width: 1, alpha: 0.5 }); }
          if (sel.value !== 'scale') { const P = TR[sel.value].map((n) => NAMEPOS[n]); s.poly(P.map(([i, j]) => [i, j]), { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.6 }); }
          else for (const t of Object.values(TR)) s.poly(t.map((n) => NAMEPOS[n]), { color: 'green', width: 1, alpha: 0.4, fill: 'green', fillAlpha: 0.05 });
          for (let j = -2; j <= 3; j++) for (let i = -3; i <= 4; i++) {
            const hit = inSet(i, j), [p, q] = ratio(i, j);
            s.dot(i, j, { r: hit ? 17 : 11, color: hit ? (sel.value === 'scale' ? 'green' : 'accent') : 'faint', hollow: !hit });
            s.text(`${p}/${q}`, i, j, { size: hit ? 11 : 9.5, color: hit ? 'ink' : 'muted', align: 'center', baseline: 'middle', weight: hit ? 700 : 400 });
            if (hit) s.text(hit[0], i, j, { size: 11.5, color: sel.value === 'scale' ? 'green' : 'accent', align: 'center', baseline: 'middle', dy: -26 / 1.3, weight: 700 });
          }
          s.text('× 3/2  →', 3.2, -2.35, { size: 11, color: 'muted', align: 'center' }); s.text('× 5/4  ↑', -3.2, 3.35, { size: 11, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const L = lit(), rows = SC.filter((x) => L.includes(x[0])).map(([n, i, j]) => `${n} ${ratio(i, j).join('/')} (${sc(v, rc(i, j) - SEMI[n] * 100, 1)} ¢)`);
          let bt = '';
          const ch = chord();
          if (ch) {
            const jc = cj(ch), ec = ch.map((n) => fold(SEMI[n] * 100 - SEMI[ch[0]] * 100)).sort((a, b) => a - b), f0 = C4;
            const fJ = jc.map((c) => f0 * 2 ** (c / 1200)), fE = ec.map((c) => f0 * 2 ** (c / 1200));
            const ne = nearPairs(fE, 6, 15).filter((p) => p.d > 0.05).slice(0, 3);
            bt = ` · just chord ${jc.map((c) => v.fix(c, 1)).join(', ')} ¢: coinciding partials only (${nearPairs(fJ, 6, 0.05).length} pairs, no beating pair) · 12-TET chord ${ec.join(', ')} ¢: beats at ${ne.map((p) => `${v.fix(p.d, 1)} Hz`).join(', ') || 'none below 15 Hz'} (partials ${ne[0] ? ne[0].hi + ' and ' + ne[0].hj : ''}, root at C4)`;
          }
          return `offset from 12-TET: ${rows.join(', ')}${bt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Definition',
      name: 'The syntonic comma and comma drift',
      statement: String.raw`The **syntonic comma** is the ratio $81/80=1.0125$, or $21.506$ ¢. It is the amount by which four pure fifths exceed two octaves plus a pure major third ($(3/2)^4=81/16$ against $4\cdot5/4=5$ octaves-and-third $=80/16$), equivalently the difference between the Pythagorean third $81/64$ and the pure third $5/4$, and between the two whole tones of just intonation, $9/8$ and $10/9$. If a progression is sung or played with every chord tuned pure, and each chord shares a note with the one before it, the pitch of that note is kept but the roots of the chords wander: in the cycle C–Am–Dm–G–C the final C is lower than the first by exactly one syntonic comma. Repeated, the music sinks by 21.5 ¢ every four chords.`,
      idea: String.raw`Pure intervals multiply: the root of each chord is fixed by a note it has in common with the last chord, held as a pure fifth or third. C to A minor goes down a pure third from C to A ($5/3$), Am to Dm goes down a pure fifth, Dm to G up a pure fourth, G to C down a pure fifth. The product of the ratios, taken as the exact factor by which the new C differs from the old one, is $80/81$. A comma is exactly this failure of a closed cycle of pure intervals to close: $3^4 \cdot 2^{-4}\cdot 5^{-1}\ne1$ (7.2 for the analogous fact for fifths and octaves).`,
      caption: String.raw`Top: four pure fifths (orange) against two octaves plus a pure third (blue) on a cent ruler; the gap is 21.5 ¢. Bottom: the progression C–Am–Dm–G–C, every chord tuned pure and joined to the previous one by a held common note; the graph shows how far each chord's root is from its equal-tempered position, and the staircase down is the drift. Choose the number of passes and play the result against the same progression in equal temperament (which does not drift but is never pure).`,
      deps: ['music-7.5'],
      see: ['music-7.16', 'music-7.7', 'music-7.3'],
      refs: ['Benson ch. 5'],
      tags: ['comma', 'just intonation'],
      scope: String.raw`Exact for the pure-interval chain described: the common tones C, A, D, G are held and the chords' other notes are tuned pure to them. Real singers and string players do re-tune against such a drift in various ways; the picture shows the arithmetic, not a performance practice.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Syntonic_comma' },
      viz(v) {
        const passes = v.slider('passes through the progression', 1, 8, 3, { int: true });
        const rl = v.stage({ x: [-60, 2900], y: [0, 3.2], height: 150, axes: false, full: true, title: 'four pure fifths against two octaves and a pure third (cents)' });
        const rz = v.stage({ x: [2750, 2830], y: [0, 3.2], height: 130, axes: false, full: true, title: 'zoom on the gap' });
        const g = v.stage({ x: [-0.3, 32.3], y: [-130, 18], axes: 'box', gutter: true, height: 320, full: true, xlabel: 'chord', ylabel: 'root re 12-TET (¢)', xticks: [], title: 'drift of the roots, every chord pure' });
        const NAMES = ['C', 'Am', 'Dm', 'G'], MAJ = [0, M3J, FIFTH], MIN = [0, cents(6 / 5), FIFTH];
        const KIND = [MAJ, MIN, MIN, MAJ], ETR = [0, 9, 2, 7];
        // common tone held from the previous chord: [its index in the previous chord, its index in the new chord], by new chord
        // C→Am: the root C is Am's third; Am→Dm: A is Dm's fifth; Dm→G: D is G's fifth; G→C: G is C's fifth
        const CT = [[0, 2], [0, 1], [0, 2], [0, 2]];
        const roots = (np) => {
          const out = [{ root: 0, kind: MAJ, name: 'C', et: 0 }]; let cur = 0, prevKind = MAJ;
          for (let k = 1; k <= 4 * np; k++) {
            const idx = k % 4, kind = KIND[idx], [ci, ni] = CT[idx], root = cur + prevKind[ci] - kind[ni];
            out.push({ root, kind, name: NAMES[idx], et: ETR[idx] * 100 }); cur = root; prevKind = kind;
          }
          return out;
        };
        const dev = (c) => { let d = c.root - c.et; d -= 1200 * Math.round(d / 1200); return d; };
        const fold600 = (c) => { let r = c; while (r > 400) r -= 1200; while (r < -800) r += 1200; return r; };
        const buf = (mode) => seqCents(roots(passes.value).map((c) => { const base = fold600(mode === 'et' ? c.et : c.root); return (mode === 'et' ? [0, c.kind === MAJ ? 400 : 300, 700] : c.kind).map((x) => base + x); }), C4, 0.9, 0.06);
        v.soundButton('play: pure chords', (sd) => sd.samples(buf('just'), SR, { gain: 0.9 }));
        v.soundButton('play: 12-TET', (sd) => sd.samples(buf('et'), SR, { gain: 0.9 }));
        v.soundButton('first C, then the last C', (sd) => { const R = roots(passes.value); sd.samples(seqCents([[0], [R[R.length - 1].root + 1200 * Math.round(-R[R.length - 1].root / 1200)]], C4, 1.2, 0.15), SR, { gain: 0.9 }); });
        v.render(() => {
          const row = (st, big) => {
            for (let i = 0; i < 4; i++) st.rect(i * FIFTH, 1.9, (i + 1) * FIFTH, 2.7, { fill: i % 2 ? 'orange' : 'gold', fillAlpha: 0.5, color: 'orange' });
            st.rect(0, 0.6, 2400, 1.4, { fill: 'accent', fillAlpha: 0.4, color: 'accent' }); st.rect(2400, 0.6, 2400 + M3J, 1.4, { fill: 'green', fillAlpha: 0.45, color: 'green' });
            st.vline(4 * FIFTH, { color: 'red' }); st.vline(2400 + M3J, { color: 'green' });
          };
          row(rl); row(rz);
          rl.text('4 fifths = 2807.82 ¢', 0, 2.3, { size: 11, color: 'orange', align: 'left', dx: 5, baseline: 'middle' });
          rl.text('2 octaves', 1200, 1.0, { size: 11, color: 'accent', align: 'center', baseline: 'middle' }); rl.text('pure third', 2400 + M3J / 2, 1.0, { size: 11, color: 'green', align: 'center', baseline: 'middle' });
          rz.text('2 octaves + pure third = 2786.31 ¢', 2400 + M3J, 0.2, { size: 11, color: 'green', align: 'right', dx: -5 });
          rz.text('4 fifths = 2807.82 ¢', 4 * FIFTH, 3.0, { size: 11, color: 'orange', align: 'left', dx: 5 });
          rz.measure(2400 + M3J, 1.65, 4 * FIFTH, 1.65, '21.5 ¢');
          // drift
          const R = roots(passes.value);
          g.hline(0, { color: 'muted', dash: [4, 4] });
          g.text('12-TET (fixed)', 31.8, 3, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          g.path(R.map((c, k) => [k, dev(c)]), { color: 'accent', width: 1.4, alpha: 0.5 });
          R.forEach((c, k) => { const d = dev(c); g.dot(k, d, { r: 4.5, color: k % 4 === 0 ? 'gold' : 'accent' }); if (k <= 4 || k % 4 === 0) g.text(c.name, k, d, { size: 10.5, align: 'center', dy: -9, plate: true, color: k % 4 === 0 ? 'gold' : 'muted' }); });
          g.setView([-0.3, Math.max(8.3, 4 * passes.value + 0.3)], [Math.min(-30, dev(R[R.length - 1]) - 20), 18]);
        });
        v.legend([['gold', 'C of each pass'], ['accent', 'other chord roots']]);
        v.readout(() => {
          const R = roots(passes.value), last = R[R.length - 1];
          return `$81/80$ = ${v.fix(SCOMMA, 3)} ¢ = 4 × ${v.fix(FIFTH, 3)} − 2400 − ${v.fix(M3J, 3)} · one pass C–Am–Dm–G–C: the tonic falls by ${v.fix(-dev(last) / passes.value, 3)} ¢ (ratio 80/81 each pass) · after ${passes.value} pass${passes.value > 1 ? 'es' : ''}: ${v.fix(dev(last), 2)} ¢ (${v.fix(-dev(last) / 100, 2)} semitone flat) · roots in the first pass: A ${sc(v, dev(R[1]), 1)}, D ${sc(v, dev(R[2]), 1)}, G ${sc(v, dev(R[3]), 1)} ¢ from 12-TET`;
        });
      },
    },
  ],
};

