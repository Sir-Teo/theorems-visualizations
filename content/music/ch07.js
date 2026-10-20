// Music Theory & Acoustics — Chapter 7: Tuning and temperament (items 7.1–7.6)
import { wolfModel, wolfPoint, wolfEdgeHit, wolfAudio } from './source-audit-wolf-equal.js';
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, M3P, NOTE, sc, fold, circ, ring, cents, gcd, seqCents, chordCents, nearPairs, tuneChain, chainSemi, CHAIN } from './ch07.shared.js';
import { jiModel, jiAudio } from './source-audit-just-meantone.js';

import { pythagoreanScale, rotationModel, tuningAudio } from './source-audit-pythagorean.js';

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
      statement: String.raw`Pythagorean tuning uses exact octaves $2{:}1$ and fifths $3{:}2$. A chain of $n$ notes has $n-1$ fifths: note $k$, starting with $k=0$, has ratio $(3/2)^k$ before octave reduction. Divide by a power of 2 to put each ratio in $[1,2)$. Five consecutive notes give a pentatonic collection; seven, such as F–C–G–D–A–E–B, give a diatonic collection. Its five whole-tone steps have ratio $9/8$ (203.910 ¢), and its two smaller steps, called limmas, have ratio $256/243$ (90.225 ¢).`,
      idea: String.raw`Two fifths minus one octave give $(3/2)^2/2=9/8$. A fourth minus two whole tones gives $(4/3)/(9/8)^2=256/243$; subtracting a limma from a tone gives the larger semitone or apotome, $(9/8)/(256/243)=2187/2048$ (113.685 ¢). Cents turn multiplication into addition (1.6): the exact fifth is $1200\log_2(3/2)$ cents, approximately 701.955. The rounded decimal is a display value; the construction uses exact ratios.`,
      caption: String.raw`Choose a starting note and a number of notes, including the start. The circle shows every note and every fifth added; gold is newest. The table sorts the notes within the octave above the chosen start, then adds its closing octave at ratio 2. Each row gives its exact ratio, cents and gap to the next row. Playback uses authored pure sine tones: an ascending scale, or the last pure fifth together. One note has no last fifth.`,
      deps: ['music-1.6'],
      see: ['music-6.1', 'music-2.6', 'music-7.2', 'music-8.1'],
      refs: ['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §§5.2–5.4, pp. 154–158'],
      tags: ['tuning', 'fifths'],
      credit: 'Tuning construction and terminology: Dave Benson, Music: A Mathematical Offering, 2008 Web version; finite table and playback authored here.',
      scope: String.raw`Exact abstract ratios, without a claim about an ancient tuning practice or a listener’s consonance ratings. The selected start is the origin: F uses an authored anchor $\mathrm{F4}=(4/3)\,261.6256$ Hz, C uses $\mathrm{C4}=261.6256$ Hz. Pure sine playback has 10-ms end ramps and is uncalibrated. The last-fifth pair keeps ratio $3/2$ and may extend above the displayed octave.`,
      links: { source: 'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf' },
      verify: false,
      viz(v) {
        const from = v.select('chain starts at', [{ value: 'F', label: 'F: F C G D A E B …' }, { value: 'C', label: 'C: C G D A E B …' }], 'F');
        const n = v.slider('notes in the chain (including the start)', 1, 12, 7, { int: true });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 380, title: 'pure fifths, folded above the selected start' });
        const table = v.stage({ x: [0, 4.8], y: [-.6, 14.5], height: 430, axes: false, full: true, title: 'ratios and cents above the selected start; gap to next row' });
        let info;
        const play = kind => sd => { const a = tuningAudio(from.value, n.value, kind); sd.samples(a.samples, a.sampleRate, { gain: 1 }); };
        v.soundButton('Play ascending sine scale', play('scale'));
        const fifth = v.soundButton('Play last pure fifth', play('fifth'));
        v.button('Stop audio', () => v.sound().stop());
        v.render(() => {
          const a = pythagoreanScale(from.value, n.value); info=a;
          fifth.disabled = a.count === 1;
          ring(s, 1, { tick: 100 });
          a.chain.forEach((p, i) => { if (i) { const q = circ(a.chain[i - 1].cents, .96), r = circ(p.cents, .96); s.arrow(...q, ...r, { color: 'orange', width: 1.2, alpha: .6 }); } });
          a.chain.forEach((p, i) => { const q = circ(p.cents, 1), r = circ(p.cents, 1.18), last = i === a.count - 1; s.dot(...q, { r: last ? 7 : 5, color: last ? 'gold' : 'accent' }); s.text(p.name, ...r, { size: 12, align: 'center', baseline: 'middle', weight: 600, color: last ? 'gold' : 'ink' }); });
          s.text(`${a.count} note${a.count === 1 ? '' : 's'}`, 0, .08, { size: 13, align: 'center', baseline: 'middle', plate: true });
          s.text(`${a.fifths} fifths`, 0, -.13, { size: 12, align: 'center', baseline: 'middle', color: 'muted', plate: true });
          table.setView([0, 4.8], [-.6, a.count + 1.7]);
          ['note', 'exact ratio', 'cents', 'next gap (¢)'].forEach((t, i) => table.text(t, [.35, 1.6, 2.9, 4.1][i], a.count + 1.05, { size: 11, weight: 700, align: 'center', baseline: 'middle' }));
          [...a.order, { name: `${a.start} ↑`, ratio: '2/1', cents: 1200 }].forEach((p, i) => {
            const y = a.count - i, color = p.k === a.count - 1 ? 'gold' : 'ink';
            table.text(p.name, .35, y, { size: 12, align: 'center', baseline: 'middle', weight: 600, color });
            table.text(p.ratio, 1.6, y, { size: 11, align: 'center', baseline: 'middle', color });
            table.text(v.fix(p.cents, 3), 2.9, y, { size: 11, align: 'center', baseline: 'middle', color });
            table.text(i < a.count ? v.fix(a.gaps[i].cents, 3) : '—', 4.1, y, { size: 11, align: 'center', baseline: 'middle', color: 'orange' });
          });
        });
        v.legend([['accent', 'earlier note'], ['gold', 'newest note'], ['orange', 'exact fifth added; table: next gap']]);
        v.readout(() => { const a = info; return `${a.count} note${a.count === 1 ? '' : 's'}, ${a.fifths} fifth${a.fifths === 1 ? '' : 's'}. Newest ${a.chain.at(-1).name}: ratio ${a.chain.at(-1).ratio}, ${v.fix(a.chain.at(-1).cents, 3)} ¢ above ${a.start}. Exact consecutive gap ratios: ${a.gaps.map(g => g.ratio).join(', ')}. The gaps sum to 1200 ¢ (one octave).${a.count === 1 ? ' Last-fifth playback is disabled until a second note is added.' : ''}`; });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Theorem',
      name: 'Fifths and octaves never meet',
      statement: String.raw`There are no integers $k\ge1$ and $m$ with $(3/2)^k=2^m$. Thus $\alpha=\log_2(3/2)$ is irrational, and the exact folded notes $1200\{k\alpha\}$ cents are all distinct. Here $\{x\}=x-\lfloor x\rfloor$. Their infinite forward orbit is dense in the octave: every open pitch interval contains a note. The same conclusion holds for the pure third $5/4$. In contrast, $r=2^{7/12}$ has rational $\log_2 r=7/12$ and an orbit of exactly twelve pitches.`,
      idea: String.raw`If $(3/2)^k=2^m$, then $3^k=2^{m+k}$. If $m+k\le0$, the right side is at most 1; otherwise it is even. Both cases contradict the odd integer $3^k>1$. The same argument uses $5^k=2^{m+2k}$ for thirds. Equality of two folded notes would give such an equality for their positive index difference.

For density, this authored argument completes the finite near-miss step. Given irrational $\alpha$ and a positive integer $N$, place $0,\{\alpha\},\ldots,\{N\alpha\}$ in $N$ equal bins. Two differ by a nonzero $\delta<1/N$. For some positive $q$, the rotation $q\alpha$ is either $\delta$ or $-\delta$ modulo 1. The forward multiples $0,q\alpha,\ldots,\lfloor1/\delta\rfloor q\alpha$ form a grid around the circle in one direction, with every gap at most $\delta$. Choose $N$ sufficiently large by the Archimedean property (pma-1.20). These forward-orbit points approach every pitch arbitrarily closely. A finite chart alone does not prove this infinite assertion.`,
      caption: String.raw`Left: every step of the selected finite prefix, at an increasing authored radius; radius is an index, not a frequency. Gold marks every strict record near miss and labels the best. Right: every visible step’s distance to the nearest octave, with gold records and the best labelled. The vertical coordinate is $\log_{10}(1+d)$ for distance $d$ in cents, so exact equal-tempered zeros stay at zero. Integer arithmetic decides pure-ratio records and equalities; cents are displayed numerically.`,
      deps: ['music-7.1', 'pma-1.20'],
      see: ['music-7.10', 'music-7.3', 'music-7.14'],
      refs: ['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §§5.3–5.4 and §6.2 Lemma 6.2.1'],
      tags: ['irrationality', 'fifths'],
      credit: 'Irrationality and tuning exposition: Benson, 2008 Web version; density proof and finite comparison authored here.',
      scope: String.raw`An exact theorem about an infinite orbit, illustrated by at most 400 steps. The proof uses the exact logarithm, not the rounded fifth size 701.955 ¢. The chart gives no empirical pitch-discrimination claim. In equal temperament the primitive period is 12 because 7 and 12 are coprime; the number of completed returns depends on the displayed prefix.`,
      links: { source: 'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf' },
      verify: false,
      viz(v) {
        const which = v.select('stacked interval', [{ value: 'fifth', label: 'pure fifth 3:2' }, { value: 'third', label: 'pure third 5:4' }, { value: 'et', label: 'tempered fifth 2^(7/12)' }], 'fifth');
        const N = v.slider('number of steps', 1, 400, 60, { int: true });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 400, title: 'all selected steps on the octave spiral' });
        const e = v.stage({ x: [-1, 64], y: [-.13, 2.98], axes: 'box', gutter: true, height: 400, xlabel: 'steps k', ylabel: 'distance (¢)', yticks: [0, 1, 10, 100, 600].map(d => [Math.log10(1 + d), `${d}`]), title: 'nearest-octave distance; log10(1 + d)' });
        let info;
        v.render(() => {
          const a = rotationModel(which.value, N.value); info=a;
          const radius = k => .28 + .72 * k / a.count;
          ring(s, 1.14, { tick: 100, len: .025 });
          s.line(0, .28, 0, 1.14, { color: 'faint', dash: [4, 4] });
          s.path(a.points.map(p => circ(p.folded, radius(p.k))), { color: 'accent', width: 1, alpha: .3 });
          a.points.slice(1).forEach(p => s.dot(...circ(p.folded, radius(p.k)), { r: a.count > 150 ? 1.7 : 2.6, color: 'accent', ring: false }));
          s.dot(0, .28, { r: 5, color: 'green' });
          s.text('start: 0', 0, -.12, { size: 11, align: 'center', baseline: 'middle', color: 'green', plate: true });
          a.records.forEach(p => s.dot(...circ(p.folded, radius(p.k)), { r: 5, color: 'gold' }));
          s.text(`${a.best.k}`, ...circ(a.best.folded, radius(a.best.k) + .15), { size: 12, color: 'gold', align: 'center', baseline: 'middle', weight: 700, plate: true });
          const span = Math.max(12, a.count); e.setView([-.06 * span, 1.08 * span], [-.13, 2.98]);
          e.line(0, 0, span, 0, { color: 'faint', width: 1 });
          a.points.slice(1).forEach(p => e.dot(p.k, Math.log10(1 + p.distance), { r: 2, color: 'accent', ring: false }));
          a.records.forEach(p => e.dot(p.k, Math.log10(1 + p.distance), { r: 4, color: 'gold' }));
          e.text(`${a.best.k}`, a.best.k, Math.log10(1 + a.best.distance), { size: 11, color: 'gold', align: a.best.k > .6 * span ? 'right' : 'left', dx: a.best.k > .6 * span ? -7 : 7, dy: -10, weight: 700, plate: true });
        });
        v.legend([['green', 'start (0 steps)'], ['accent', 'every selected step'], ['gold', 'every strict record; best labelled']]);
        v.readout(() => { const a = info, p = a.best; return `${a.count} steps; ${a.distinct} distinct pitches including the start. Strict record steps: ${a.records.map(p => p.k).join(', ')}. Best: step ${p.k}, ${v.fix(p.distance, 6)} ¢ from the nearest octave (${p.octaves} octaves up, signed error ${v.fix(p.error, 6)} ¢). Closest pair in this prefix: ${v.fix(a.minGap, 6)} ¢.${a.mode === 'et' ? ` Exact primitive period 12; ${a.closures} completed return${a.closures === 1 ? '' : 's'} in this prefix. Zeros are exact, not an error floor.` : ' No exact returns; every plotted distance is positive. Density concerns the infinite continuation.'}`; });
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
      num:'7.4',kind:'Concept',name:'The wolf fifth',
      statement:String.raw`In a specified twelve-note Pythagorean cut, eleven fifths have the pure ratio $3/2$. The closing fifth must then have ratio
$$W=\frac{2^7}{(3/2)^{11}}$$
$$=\frac{262144}{177147}.$$
Its size is approximately 678.494990 cents. The ratio between a pure fifth and this closing fifth is the Pythagorean comma $531441/524288$ (7.3), approximately 23.460010 cents. This closing interval is called the wolf fifth in this model.

Eight major thirds have ratio $81/64$; the four crossing the cut have ratio $8192/6561$. Their signed errors from the pure $5/4$ are approximately $+21.506290$ and $-1.953721$ cents, respectively.`,
      idea:String.raw`Twelve pure fifths exceed seven octaves: $(3/2)^{12}/2^7=531441/524288>1$. Replacing one pure fifth by $W$ removes exactly that excess, and the product of all twelve becomes $2^7$. A sum of 8400 cents alone does not force twelve equal fifths; if they are also required to be equal, each is 700 cents.

A major third follows four consecutive steps of the chain and reduces by two octaves. Without the cut its ratio is $(3/2)^4/4=81/64$. Crossing the cut divides this ratio by the comma, giving $8192/6561$. Exactly four of the twelve starting positions cross a specified edge. These algebraic identities give interval sizes, without deciding which keys are musically usable.`,
      caption:String.raw`Choose the closing edge and the selected fifth independently. The circle shows the twelve chain positions, with the closing fifth red and the selected edge marked gold; their equally spaced positions are a diagram of chain order, not frequency distances. Click near a visible edge to select and play that pair. The complete table gives every major third, its exact ratio, cents and signed error from $5/4$. The cycle button plays twelve separately registered pairs, starting after the cut and ending on the closing pair.`,
      deps:['music-7.3'],see:['music-7.7','music-7.14','music-7.8'],
      refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §§5.3–5.4, pp.155–158; closing-cut and third identities derived here'],tags:['tuning','wolf'],
      credit:'Pythagorean tuning exposition: Dave Benson, 2008 Web version; movable finite cut, exact arithmetic and synthesis authored here.',
      scope:String.raw`A mathematical twelve-note model, without a claim about a traditional placement, historical priority, howling or measured key quality. C is fixed at the authored C4 = 261.6256-Hz anchor for every cut; each pair starts at its note in the octave above C4 and ascends by its actual fifth ratio. Exact integer ratios determine the construction; decimal cents and frequencies are numerical display values. Audio is uncalibrated mono 44,100-Hz synthesis, eight sub-Nyquist harmonics with amplitudes $1/h$, pre-output peak bound 0.12 and 10-ms end ramps. The runtime master gain/limiter and device affect output. No listening judgement is certified.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const edgeName=x=>{const a=wolfModel(x);return `${a.wolf.from}–${a.wolf.to}`;};
        const cut=v.slider('closing edge',0,11,11,{int:true,fmt:edgeName}),selected=v.slider('selected edge',0,11,11,{int:true,fmt:edgeName});
        const A=v.stage({x:[-1.5,1.5],y:[-1.45,1.45],equal:true,axes:false,height:380,minWidth:240,title:'chain order; gold marks the selected fifth'});
        const B=v.stage({x:[-.15,4.9],y:[-.7,12.5],axes:false,full:true,height:440,minWidth:240,title:'all twelve major thirds; signed error from 5/4'});
        let info;const play=(action,sd=v.sound())=>{const a=wolfAudio(cut.value,selected.value,action);sd.stop();sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play selected fifth',sd=>play('edge',sd));v.soundButton('Play closing fifth',sd=>play('wolf',sd));v.soundButton('Play twelve separate pairs',sd=>play('cycle',sd));v.button('Stop audio',()=>v.sound().stop());
        A.onClick((x,y)=>{const j=wolfEdgeHit(x,y);if(j!==null){selected.set(j);play('edge');}});
        v.render(()=>{
          const a=wolfModel(cut.value,selected.value);info=a;
          a.fifths.forEach(f=>{const p=wolfPoint(f.j),q=wolfPoint((f.j+1)%12);A.line(...p,...q,{color:f.wolf?'red':'green',width:f.wolf?4:2.2});if(f.selected)A.dot((p[0]+q[0])/2,(p[1]+q[1])/2,{r:5,ring:false,color:'gold'});});
          a.nodes.forEach(n=>{const p=n.point;A.dot(...p,{r:5,ring:false,color:'accent'});A.text(n.name,1.2*p[0],1.2*p[1],{size:12,align:'center',baseline:'middle',weight:600});});
          A.text('selected fifth',0,.18,{size:11,align:'center',baseline:'middle',color:'muted'});A.text(`${a.chosen.from}–${a.chosen.to}`,0,-.02,{size:14,align:'center',baseline:'middle',color:'gold',weight:700});A.text(a.chosen.exact,0,-.22,{size:12,align:'center',baseline:'middle',color:'gold'});
          ['note','exact ratio','cents','error (¢)'].forEach((t,i)=>B.text(t,[.28,1.5,2.9,4.2][i],11.9,{size:10.5,align:'center',baseline:'middle',weight:700}));
          a.thirds.forEach((t,j)=>{const y=11-j,col=t.crosses?'purple':'orange';B.text(t.name,.28,y,{size:12,align:'center',baseline:'middle',weight:600});B.text(t.exact,1.5,y,{size:10.5,align:'center',baseline:'middle',color:col});B.text(v.fix(t.cents,3),2.9,y,{size:10.5,align:'center',baseline:'middle'});B.text(`${t.error<0?'−':'+'}${v.fix(Math.abs(t.error),3)}`,4.2,y,{size:10.5,align:'center',baseline:'middle',color:col});});
        });
        v.legend([['green','pure fifth 3/2'],['red','closing fifth 262144/177147'],['gold','selected edge'],['purple','third crosses the cut'],['orange','third avoids the cut']]);
        v.readout(()=>{const a=info;return `Closing ${a.wolf.from}–${a.wolf.to}: ${a.wolf.exact}, ${v.fix(a.wolf.cents,6)} cents. Pure/closing ratio ${a.comma.exact}; difference ${v.fix(a.comma.cents,6)} cents. Eleven pure fifths and this closing fifth total seven octaves. Selected ${a.chosen.from}–${a.chosen.to}: ${a.chosen.exact}, ${v.fix(a.chosen.cents,6)} cents; actual pair ${a.chosen.frequencies.map(f=>v.fix(f,6)).join(', ')} Hz. Four crossed thirds: ${a.thirds.filter(t=>t.crosses).map(t=>t.name).join(', ')}. C4 remains fixed when the cut moves.`;});
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num:'7.5',kind:'Method',name:'Just intonation',
      statement:String.raw`A five-limit interval is a frequency ratio $2^a3^b5^c$ with integers $a,b,c$. Octave reduction puts a pitch ratio in $[1,2)$. A standard just major scale uses the ordered ratios $1,9/8,5/4,4/3$, then $3/2,5/3,15/8$, followed by the octave $2$. Its I, IV and V triads, voiced upward from their own roots, each have ratios $4{:}5{:}6$. The consecutive scale steps are $9/8$, $10/9$ and $16/15$; they are not equal-sized whole tones and semitones.

This is one fixed tonic-centred collection. It does not make every triad pure: for example D–A has ratio $(5/3)/(9/8)=40/27$, rather than $3/2$. Multiplying all frequencies by one positive factor does transpose the entire collection while preserving every interval.`,
      idea:String.raw`Start with C–E–G at ratios $1,5/4,3/2$. Pure IV and V triads add F–A–C at $4/3,5/3,2$ and G–B–D at $3/2,15/8,9/4$. Their seven pitch classes give Benson’s just-major table. Horizontal lattice steps multiply by $3/2$, vertical steps by $5/4$, followed by octave reduction (7.1).

For harmonic tones the specifically compared partial frequencies are integer multiples of the played fundamentals (6.2). In a $4{:}5{:}6$ triad, the root’s fifth partial equals the third’s fourth, and the root’s third equals the fifth’s second. These exact coincidences do not say that every partial coincides or that a chord has no beating, roughness or dissonance. The readout compares only these declared pairs using the actual register used in playback.`,
      caption:String.raw`The authored eight-node patch contains the seven scale notes and one extra ratio $45/32$; the full five-limit lattice is infinite. Choose the scale or one triad to highlight it. Click a visible node to select and play its just ratio, or select it with the single-note control. The table always gives the complete source scale and its closing octave. Just, equal-tempered and alternating playback use distinct frequency lists for both scales and chords, with the same C4 anchor.`,
      deps:['music-7.1','music-6.2'],see:['music-6.1','music-7.6','music-7.13','music-7.15'],
      refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §5.5, pp.159–160'],tags:['just intonation','lattice'],
      credit:'Tuning exposition: Dave Benson, 2008 Web version; finite patch, registers and synthesis authored here.',
      scope:String.raw`An exact ratio construction, not a claim about an ancient priority, a unique chromatic just scale or measured consonance. The source table is C-relative; F and G chords are voiced upward from F4 and G4, including C5 or D5 when needed. Audio is uncalibrated mono 44,100-Hz synthesis at C4 = 261.6256 Hz, six harmonics with amplitudes proportional to $1/h$, a pre-output peak bound 0.12 and 10-ms end ramps. Output uses the runtime master gain/limiter and the device; no perceived beat or loudness judgement is certified.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify: false,
      viz(v){
        const family=v.select('highlight / collection',[{value:'scale',label:'major scale'},{value:'I',label:'I: C E G'},{value:'IV',label:'IV: F A C'},{value:'V',label:'V: G B D'}],'scale');
        const base=jiModel(),node=v.select('single note',base.nodes.map(p=>({value:p.id,label:p.name==='extra'?'45/32 extra':p.name})),'0,0');
        const A=v.stage({x:[-1.7,2.7],y:[-.8,1.9],equal:true,axes:false,height:330,minWidth:280,title:'finite five-limit lattice patch'});
        const B=v.stage({x:[0,4.65],y:[-.6,9.5],axes:false,full:true,height:390,minWidth:280,title:'complete C-major scale and closing octave'});
        let info;
        const play=action=>sd=>{const a=jiAudio(family.value,node.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play just collection',play('just'));v.soundButton('Play equal-tempered collection',play('et'));v.soundButton('Alternate just / equal',play('alternate'));v.soundButton('Play selected node',play('node'));v.button('Stop audio',()=>v.sound().stop());
        A.onClick((x,y)=>{const p=base.nodes.find(p=>Math.hypot(x-p.i,y-p.j)<.36);if(p){node.set(p.id);v.sound().stop();play('node')(v.sound());}});
        v.render(()=>{
          const a=jiModel(family.value,node.value);info=a;
          for(const p of a.nodes){if(p.i<2)A.line(p.i,p.j,p.i+1,p.j,{color:'faint',width:1});if(p.j<1)A.line(p.i,p.j,p.i,p.j+1,{color:'faint',width:1});}
          const groups=family.value==='scale'?['I','IV','V']:[family.value];groups.forEach(t=>{const tri=jiModel(t).chord;const points=tri.map(p=>{const q=a.scale.find(q=>q.name===p.name);return[q.i,q.j];});A.poly(points,{fill:'green',fillAlpha:.10,color:'green',width:1.1});});
          for(const p of a.nodes){const hit=a.lit.includes(p.name);if(p.id===node.value)A.dot(p.i,p.j,{r:21,hollow:true,ring:false,color:'gold',width:1.7});A.dot(p.i,p.j,{r:hit?17:14,ring:false,hollow:!hit,color:hit?'green':'muted',width:1});A.text(p.exact,p.i,p.j,{size:10.5,align:'center',baseline:'middle',color:hit?'ink':'muted'});A.text(p.name,p.i,p.j,{size:11,align:'center',baseline:'middle',dy:-25,color:hit?'green':'muted'});}
          A.text('right: ×3/2; octave folded',.5,-.53,{size:10.5,align:'center',baseline:'middle',color:'muted'});A.text('up: ×5/4; octave folded',.5,1.62,{size:10.5,align:'center',baseline:'middle',color:'muted'});
          ['note','ratio','cents','offset ¢'].forEach((t,j)=>B.text(t,[.3,1.35,2.65,4.05][j],8.8,{size:11,weight:700,align:'center',baseline:'middle'}));
          a.table.forEach((p,k)=>{const y=7.8-k,color=a.lit.includes(p.name)?'green':'ink';[p.name,p.exact,v.fix(p.cents,3),`${p.offset<0?'−':'+'}${v.fix(Math.abs(p.offset),2)}`].forEach((t,j)=>B.text(t,[.3,1.35,2.65,4.05][j],y,{size:j===0?12:10.5,align:'center',baseline:'middle',color}));});
        });
        v.legend([['green','highlighted collection'],['gold','selected single note']]);
        v.readout(()=>{const a=info;let pairs='';if(a.chord){const j=a.chord.map(x=>x.hz),e=a.chord.map(x=>x.etHz);pairs=` Actual just frequencies: ${j.map(x=>v.fix(x,6)).join(', ')} Hz; equal-tempered: ${e.map(x=>v.fix(x,6)).join(', ')} Hz. Declared partial separations, root5–third4 / root3–fifth2: just ${v.fix(Math.abs(5*j[0]-4*j[1]),6)} / ${v.fix(Math.abs(3*j[0]-2*j[2]),6)} Hz; equal ${v.fix(Math.abs(5*e[0]-4*e[1]),6)} / ${v.fix(Math.abs(3*e[0]-2*e[2]),6)} Hz. These are frequency differences, not measured roughness.`;}return `Selected node ${a.selected.name}: ${a.selected.exact}, ${v.fix(a.selected.hz,6)} Hz. Complete scale gap ratios: ${a.gaps.map(x=>x.exact).join(', ')}.${pairs}`;});
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

