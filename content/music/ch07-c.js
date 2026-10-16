// Music Theory & Acoustics — Chapter 7: Tuning and temperament (part c: items 7.13–7.17)
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, NOTE, TIM, sc, fold, circ, ring, cents, gcd, seqCents, chordCents, edoApprox, J5, harmonic, at, dissAll, dissCurve, minima } from './ch07.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const L3 = cents(3), L5 = cents(5); // the primes 3 and 5 in cents (1901.955, 2786.314)

export default {
  collection: 'music',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Concept',
      name: '53-tone equal temperament',
      statement: String.raw`**53-tone equal temperament** divides the octave into 53 steps of $22.64$ ¢. Its fifth (31 steps, $701.89$ ¢) is only $0.07$ ¢ below $3/2$, its major third (17 steps, $384.91$ ¢) is $1.40$ ¢ below $5/4$ and its minor third (14 steps, $316.98$ ¢) is $1.34$ ¢ above $6/5$: every interval of five-limit just intonation is matched to within about $1.5$ ¢, below what most listeners can hear. The reason is arithmetical: $3^{53}$ is almost exactly $2^{84}$, the ratio $3^{53}/2^{84}\approx1.0021$ (**Mercator's comma**, 3.615 ¢) being very small because $31/53$ is a convergent of $\log_2(3/2)$ (7.10, 7.11), and $123/53$ happens also to approximate $\log_25$ to $1.4$ ¢. A chain of 53 pure fifths therefore closes to within 3.6 ¢ and the notes it produces are 53 nearly equally spaced pitches.`,
      idea: String.raw`Approximating $\log_2 3$ and $\log_2 5$ by multiples of $1/53$ is a simultaneous rational approximation: $84/53$ for $\log_23$ (this is $1+31/53$, a convergent of $\log_2 3$ (7.10, 7.11)) and $123/53$ for $\log_25$ both have small errors. The small errors in the two primes add up, with the integer coefficients of each interval, to small errors in every 5-limit interval. So one 53-note set of pitches realises, to about a cent, the whole lattice of 7.5: the lattice has been wrapped around a circle of 53 points in a way that sends nearby lattice points to the same or adjacent steps (7.15).`,
      caption: String.raw`Left: the 53 steps of the octave as ticks on a circle with the exact ratios (green) and the step each is assigned (the dots coincide at this scale; the errors are in the bars). Right: the error, in cents, of each five-limit interval in 53-TET (blue) and in 12-TET (grey). Choose a chord and play it in just intonation, in 53-TET, in 12-TET, or compare just and 53-TET alternately: try to hear a difference.`,
      deps: ['music-7.11', 'music-7.5'],
      see: ['music-7.15', 'music-7.12', 'music-7.2'],
      refs: ['Benson ch. 6'],
      tags: ['equal temperament', 'just intonation'],
      credit: 'Jing Fang (1st c. BCE) noticed that 53 fifths ≈ 31 octaves; Nicolaus Mercator (17th c.) computed the comma; Bosanquet (19th c.) built instruments',
      scope: String.raw`Exact arithmetic. Which of the early observations of the near-closure of 53 fifths belong to Jing Fang and to Mercator (including the dates) is taken from secondary sources only. Whether such differences of a cent or so are audible depends on timbre and on beats: in the pure 5-limit chord the partials coincide exactly, in 53-TET they beat at less than 1 Hz.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/53_equal_temperament' },
      verify: true,
      viz(v) {
        const N = 53;
        const CH = { maj: ['major triad 4:5:6', [1, 5 / 4, 3 / 2]], min: ['minor triad 10:12:15', [1, 6 / 5, 3 / 2]], m7: ['major seventh chord 8:10:12:15', [1, 5 / 4, 3 / 2, 15 / 8]] };
        const sel = v.select('chord', Object.entries(CH).map(([k, x]) => ({ value: k, label: x[0] })), 'maj');
        const rg = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 400, title: 'the 53 steps' });
        const eb = v.stage({ x: [-0.6, J5.length - 0.4], y: [-18, 18], axes: 'box', gutter: true, height: 400, xticks: J5.map((x, i) => [i, `${x[0]}/${x[1]}`]), yticks: [-15, -7.5, 0, 7.5, 15].map((y) => [y, String(y)]), ylabel: 'error from the just ratio (¢)', title: 'five-limit intervals' });
        const snd = v.sound();
        const edo = (n, r) => { const [k, e] = edoApprox(n, cents(r)); return { k, e, c: (k * 1200) / n }; };
        const chordC = (mode) => CH[sel.value][1].map((r) => (mode === 'just' ? cents(r) : edo(mode === '53' ? 53 : 12, r).c));
        const play = (m) => { snd.stop(); snd.samples(seqCents(m === 'alt' ? [chordC('just'), chordC('53'), chordC('just'), chordC('53')] : [chordC(m)], C4, m === 'alt' ? 1.3 : 2.4, 0.12), SR, { gain: 0.9 }); };
        v.soundButton('just', () => play('just')); v.soundButton('53-TET', () => play('53')); v.soundButton('12-TET', () => play('12')); v.soundButton('alternate: just, 53-TET', () => play('alt'));
        v.render(() => {
          ring(rg, 1, { tick: 1200 / N, len: 0.05 });
          for (let k = 0; k < 12; k++) { const a = circ(k * 100, 0.78), b = circ(k * 100, 0.85); rg.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 1.3, alpha: 0.7 }); }
          rg.text('12-TET', 0, 0.2, { size: 11, color: 'muted', align: 'center' }); rg.text('53 steps', 0, 0, { size: 14, weight: 700, align: 'center' }); rg.text('22.64 ¢ each', 0, -0.17, { size: 11, color: 'muted', align: 'center' });
          const used = CH[sel.value][1];
          J5.concat([[2, 1, 'octave']]).forEach(([p, q], i) => {
            const c = cents(p / q), r = p / q, e = edo(N, r), on = used.some((u) => Math.abs(u - r) < 1e-9 || (Math.abs(u * 2 - r) < 1e-9)), a = circ(c, 1), b = circ(e.c, 0.94), l = circ(c, 1.2);
            rg.dot(a[0], a[1], { r: on ? 6 : 4, color: 'green' }); rg.dot(b[0], b[1], { r: on ? 4 : 2.5, color: 'accent' });
            if (p / q < 2) rg.text(`${p}/${q}`, l[0], l[1], { size: on ? 12 : 10, color: on ? 'green' : 'muted', align: 'center', baseline: 'middle', weight: on ? 700 : 400 });
          });
          const a0 = circ(0, 1.2); rg.text('1/1', a0[0], a0[1], { size: 11, color: 'green', align: 'center', baseline: 'middle', weight: 700 });
          eb.hline(0, { color: 'green', width: 1.6 });
          J5.forEach(([p, q], i) => { const e53 = edo(53, p / q).e, e12 = edo(12, p / q).e; eb.rect(i - 0.34, 0, i - 0.02, e12, { fill: 'muted', fillAlpha: 0.45, color: 'muted' }); eb.rect(i + 0.02, 0, i + 0.34, e53, { fill: 'accent', fillAlpha: 0.7, color: 'accent' }); eb.text(sc(v, e53, 1), i + 0.18, e53, { size: 9.5, align: 'center', baseline: e53 >= 0 ? 'bottom' : 'top', dy: e53 >= 0 ? -2 : 2 }); });
        });
        v.legend([['green', 'just ratio'], ['accent', '53-TET'], ['muted', '12-TET']]);
        v.readout(() => {
          const rs = CH[sel.value][1], d = rs.map((r) => edo(53, r)), d12 = rs.map((r) => edo(12, r));
          const m53 = Math.max(...J5.map(([p, q]) => Math.abs(edo(53, p / q).e)));
          return `${CH[sel.value][0]} in 53-TET: steps ${d.map((x) => x.k).join(', ')} above the root, errors ${d.map((x) => sc(v, x.e, 2)).join(', ')} ¢ · in 12-TET: ${d12.map((x) => sc(v, x.e, 1)).join(', ')} ¢ · worst error of the eleven 5-limit intervals in 53-TET: ${v.fix(m53, 2)} ¢ · $3^{53}/2^{84}$ = ${v.fix(1200 * (53 * Math.log2(3) - 84), 3)} ¢ (Mercator's comma) · 53 pure fifths = 31 octaves + ${v.fix(53 * FIFTH - 37200, 3)} ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Concept',
      name: 'The circle of fifths',
      statement: String.raw`The **circle of fifths** arranges the twelve keys so that neighbours differ by a fifth, a key signature gains one sharp each step clockwise and one flat each step counter-clockwise, and relative minors sit inside their major keys. It is a circle only in a tempered tuning: with pure fifths the chain of notes $C, G, D, \dots$ is an open spiral, each turn ending 23.46 ¢ above where it began (7.3). A tuning with twelve equal fifths of exactly 700 ¢ (12-TET, 7.9), or any well temperament (7.8), closes it, so that the twelfth fifth lands on the starting note and every key has the same set of intervals. Twelve steps of $k\cdot f$ with $f$ the size of the fifth close only if $12f=8400$ ¢.`,
      idea: String.raw`Think of the tuning of the fifth as a single number $f$ and of the chain $k\mapsto kf \bmod 1200$ as a rotation of the pitch circle. After twelve steps the chain has advanced by $12f-8400=12(f-700)$ cents: zero only for $f=700$. So the spiral of pure fifths and the closed circle of tempered fifths are the two ends of a one-parameter family; shrinking each fifth by 1.955 ¢ rolls the spiral onto a circle. The circle is also the order of keys by the number of notes they share: neighbouring keys have six of seven scale notes in common.`,
      caption: String.raw`The twelve keys in circle-of-fifths order with their key signatures (relative minors inside). The slider changes the fifth from pure (701.955 ¢) to equal-tempered (700 ¢); the spiral of pure fifths (radius grows by the accumulated comma) closes up into the circle. Click a key to hear its major triad; the walk plays the triads for twelve successive fifths and ends on a C that is 23.5 ¢ sharp unless the slider is at 1.`,
      deps: ['music-7.9', 'music-7.2'],
      see: ['music-7.4', 'music-7.8', 'music-8.4'],
      refs: ['Benson ch. 5'],
      tags: ['circle of fifths'],
      scope: String.raw`Conventional key names are used (sharps clockwise to F♯, flats beyond); enharmonic pairs such as F♯ and G♭ coincide only when the circle closes. The walk plays the notes folded into the octave nearest middle C.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Circle_of_fifths' },
      viz(v) {
        const tau = v.slider('tempering: pure → equal', 0, 1, 0, { step: 0.01, fmt: (x) => `${v.fix(FIFTH - x * (FIFTH - 700), 3)} ¢` });
        const s = v.stage({ x: [-1.9, 1.9], y: [-1.85, 1.85], equal: true, axes: false, height: 520, title: 'the circle (and spiral) of fifths' });
        const snd = v.sound();
        const MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'], MIN = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
        const SIG = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];
        const f = () => FIFTH - tau.value * (FIFTH - 700);
        const kOf = (i) => (i <= 6 ? i : i - 12);
        const ang = (i) => (i * Math.PI) / 6, pt = (i, R) => [R * Math.sin(ang(i)), R * Math.cos(ang(i))];
        const rootC = (i) => { const c = kOf(i) * f(); return c - 1200 * Math.round(c / 1200); };
        const triad = (i) => { const r = rootC(i); return [r, r + 4 * f() - 2400, r + f()]; };
        s.onClick((x, y) => { const a = Math.atan2(x, y), i = ((Math.round((a * 6) / Math.PI) % 12) + 12) % 12; snd.stop(); snd.samples(seqCents([triad(i)], C4, 2.0, 0), SR, { gain: 0.9 }); });
        v.soundButton('walk around the circle', (sd) => { const ch = []; for (let k = 0; k <= 12; k++) { const c = k * f() - 1200 * Math.round((k * f()) / 1200); ch.push([c, c + 4 * f() - 2400, c + f()]); } sd.samples(seqCents(ch, C4, 0.6, 0.04), SR, { gain: 0.9 }); });
        v.render(() => {
          const e = f() - 700, rad = (k) => 1 + (0.4 * (k * e)) / PCOMMA;
          s.circle(0, 0, 1, { color: 'faint', width: 1, dash: [4, 4] });
          const P = []; for (let k = 0; k <= 12; k++) P.push([rad(k) * Math.sin(ang(k)), rad(k) * Math.cos(ang(k))]);
          s.path(P, { color: 'orange', width: 2.2, alpha: 0.8 });
          for (let i = 0; i < 12; i++) {
            const p = P[i]; s.dot(p[0], p[1], { r: 6, color: i === 0 ? 'green' : 'accent' });
            s.text(MAJ[i], pt(i, 1.52)[0], pt(i, 1.52)[1], { size: 15, align: 'center', baseline: 'middle', weight: 700 });
            s.text(SIG[i], pt(i, 1.72)[0], pt(i, 1.72)[1], { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
            s.text(MIN[i], pt(i, 0.7)[0], pt(i, 0.7)[1], { size: 12, color: 'purple', align: 'center', baseline: 'middle' });
          }
          const p12 = P[12], p0 = P[0]; s.dot(p12[0], p12[1], { r: 7, color: 'red', hollow: true });
          s.text(e > 0.01 ? `12th fifth lands ${v.fix(12 * e, 2)} ¢ above C` : 'the 12th fifth lands on C', 0, 0.12, { size: 12, color: e > 0.01 ? 'red' : 'green', align: 'center', weight: 700 });
          s.text(`fifth = ${v.fix(f(), 3)} ¢`, 0, -0.1, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['orange', 'chain of fifths of size f, drawn outward by the accumulated excess'], ['purple', 'relative minor']]);
        v.readout(() => `fifth ${v.fix(f(), 3)} ¢ · after 12 fifths the chain has risen by $12(f-700)=${v.fix(12 * (f() - 700), 3)}$ ¢ above the starting note (pure: 23.460 ¢, equal: 0) · major third of a key: ${v.fix(4 * f() - 2400, 2)} ¢ (pure 5/4: 386.31 ¢) · neighbouring keys on the circle differ by one accidental`);
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15',
      kind: 'Theorem',
      name: 'Unison vectors and periodicity blocks (Fokker)',
      statement: String.raw`Write every five-limit pitch class as $3^a5^b$ (mod octaves), a point $(a,b)$ of the lattice $\Z^2$ (fifths along $a$, major thirds along $b$). A **unison vector** is a lattice vector that is made to vanish by the tuning, such as the syntonic comma $81/80=(4,-1)$, the small diesis $128/125=(0,-3)$, or the Pythagorean comma $(12,0)$. If $u$ and $v$ are two independent unison vectors, then the points of the half-open parallelogram $\{su+tv:\ 0\le s,t<1\}$, a **periodicity block**, number exactly $|\det(u,v)|$, and every lattice point differs from exactly one of them by an integer combination of $u$ and $v$. Tempering $u$ and $v$ out therefore folds the infinite lattice onto a finite scale of $|\det(u,v)|$ notes, a torus; for $u=(4,-1)$ and $v=(0,-3)$ the determinant is 12 and the result is the twelve-note scale; $53$ comes from the schisma $(8,1)$ and the kleisma $(-5,6)$.`,
      idea: String.raw`The quotient group $\Z^2/\langle u,v\rangle$ has order $|\det(u,v)|$ (the index of a lattice in $\Z^2$ is the area of its fundamental parallelogram, by counting lattice points in a large box). A fundamental parallelogram contains exactly one representative of each coset, so the tempered scale has $|\det|$ distinct notes, and any other fundamental region (a different shape of block) gives the same scale after tempering. In the equal division $n$-TET the unison vectors are the lattice points $(a,b)$ with $a\,m_3+b\,m_5\equiv0\pmod n$, where $m_3,m_5$ are the steps assigned to the primes 3 and 5: the shortest two of them span a block of $n$ points.`,
      caption: String.raw`The lattice of $3^a5^b$; choose the equal division and the program picks two shortest unison vectors (or set your own with the sliders). The highlighted points are the periodicity block: as many as the determinant. Middle: the same block drawn on the torus (the unit square, opposite edges identified) with every lattice point inside the parallelogram marked. Right: the pitches of the block on the octave circle, as just ratios or with the unison vectors tempered out (a division of the octave); click any point of the lattice to hear it, or play the scale.`,
      deps: ['music-7.6', 'music-7.3'],
      see: ['music-7.5', 'music-7.13', 'music-7.12'],
      refs: ['Benson ch. 6'],
      tags: ['lattice', 'comma'],
      credit: 'A. D. Fokker, "Unison vectors and periodicity blocks in the three-dimensional (3-5-7-) harmonic lattice of notes", Proc. Kon. Ned. Akad. Wetensch. B 72 (1969)',
      scope: String.raw`Exact for any two independent integer vectors. The pitch of $3^a5^b$ is folded into one octave; the tempered scale is shown for the equal divisions with the patent mapping $m_3=\mathrm{round}(n\log_23)$, $m_5=\mathrm{round}(n\log_25)$. The picture is for the 5-limit (two primes besides 2); Fokker's own treatment was in the 3-5-7 lattice.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Periodicity_block' },
      verify: true,
      viz(v) {
        const PRE = [12, 19, 31, 41, 53];
        const ps = v.select('tempering', PRE.map((n) => ({ value: n, label: `${n}-TET` })).concat([{ value: 0, label: 'free choice' }]), 12, { onChange: () => sync() });
        const ua = v.slider('u: fifths', -12, 12, 4, { int: true }), ub = v.slider('u: thirds', -12, 12, -1, { int: true });
        const va = v.slider('v: fifths', -12, 12, 0, { int: true }), vb = v.slider('v: thirds', -12, 12, -3, { int: true });
        const tmp = v.toggle('temper the unison vectors out', false);
        const s = v.stage({ x: [-8.5, 10.5], y: [-4.5, 8.5], equal: true, axes: false, height: 360, title: 'the lattice (fifths →, thirds ↑)' });
        const tor = v.stage({ x: [-0.15, 1.15], y: [-0.15, 1.15], equal: true, axes: false, height: 360, title: 'the torus' });
        const rg = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 360, title: 'the scale' });
        const snd = v.sound();
        const kernel = (n) => {
          const m3 = Math.round((n * L3) / 1200), m5 = Math.round((n * L5) / 1200), K = [];
          for (let a = -14; a <= 14; a++) for (let b = -14; b <= 14; b++) { if ((a || b) && ((a > 0) || (a === 0 && b > 0)) && ((a * m3 + b * m5) % n === 0)) K.push([a, b]); }
          K.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
          const u = K[0]; let best = null;
          for (const w of K.slice(1, 40)) { const d = Math.abs(u[0] * w[1] - u[1] * w[0]); if (d && (!best || d < best.d || (d === best.d && Math.hypot(...w) < Math.hypot(...best.w)))) best = { w, d }; }
          return { u, v: best.w, m3, m5 };
        };
        const cur = () => { if (ps.value) { const k = kernel(ps.value); return { u: k.u, w: k.v, n: ps.value, m3: k.m3, m5: k.m5 }; } return { u: [ua.value, ub.value], w: [va.value, vb.value], n: 0 }; };
        const sync = () => { if (ps.value) { const k = kernel(ps.value); [ua, ub, va, vb].forEach((c, i) => c.set([k.u[0], k.u[1], k.v[0], k.v[1]][i])); } };
        const pitch = (a, b, C) => (tmp.value && C.n ? ((((a * C.m3 + b * C.m5) % C.n) + C.n) % C.n) * (1200 / C.n) : fold(a * L3 + b * L5));
        const coords = (a, b, C) => { const D = C.u[0] * C.w[1] - C.u[1] * C.w[0]; return [(a * C.w[1] - b * C.w[0]) / D, (C.u[0] * b - C.u[1] * a) / D, D]; };
        const block = (C) => { const out = [], D = C.u[0] * C.w[1] - C.u[1] * C.w[0]; if (!D) return out; for (let a = -40; a <= 40; a++) for (let b = -40; b <= 40; b++) { const [x, y] = coords(a, b, C); if (x > -1e-9 && x < 1 - 1e-9 && y > -1e-9 && y < 1 - 1e-9) out.push([a, b, x, y]); } return out; };
        const sc12 = (arr, C) => arr.map((p) => pitch(p[0], p[1], C)).sort((x, y) => x - y);
        s.onClick((x, y) => { const a = Math.round(x), b = Math.round(y); if (Math.hypot(x - a, y - b) < 0.4) { const C = cur(); snd.stop(); snd.samples(seqCents([[pitch(a, b, C)]], C4, 1.4, 0), SR, { gain: 0.9 }); } });
        v.soundButton('play the scale', (sd) => { const C = cur(), P = sc12(block(C), C); sd.samples(seqCents(P.concat([1200]).map((c) => [c]), C4, 0.45, 0.02), SR, { gain: 0.9 }); });
        v.render(() => {
          const C = cur(), B = block(C), D = C.u[0] * C.w[1] - C.u[1] * C.w[0];
          for (let a = -8; a <= 10; a++) for (let b = -4; b <= 8; b++) s.dot(a, b, { r: 2.6, color: 'faint' });
          s.arrow(0, 0, C.u[0], C.u[1], { color: 'red', width: 2.4 }); s.arrow(0, 0, C.w[0], C.w[1], { color: 'orange', width: 2.4 });
          s.text('u', C.u[0] * 0.5, C.u[1] * 0.5 + 0.4, { size: 14, color: 'red', weight: 700, align: 'center' }); s.text('v', C.w[0] * 0.5, C.w[1] * 0.5 + 0.4, { size: 14, color: 'orange', weight: 700, align: 'center' });
          s.poly([[0, 0], C.u, [C.u[0] + C.w[0], C.u[1] + C.w[1]], C.w], { color: 'accent', width: 1.4, fill: 'accent', fillAlpha: 0.08 });
          B.forEach(([a, b]) => { s.dot(a, b, { r: 5, color: 'accent' }); });
          s.dot(0, 0, { r: 6.5, color: 'green' });
          tor.rect(0, 0, 1, 1, { color: 'accent', width: 1.4, fill: 'accent', fillAlpha: 0.06 });
          for (const [a, b, x, y] of B) { tor.dot(x, y, { r: 5, color: 'accent' }); }
          tor.dot(0, 0, { r: 6.5, color: 'green' });
          tor.arrow(-0.1, 0.5, -0.02, 0.5, { color: 'muted' }); tor.arrow(1.1, 0.5, 1.02, 0.5, { color: 'muted' }); tor.arrow(0.5, -0.1, 0.5, -0.02, { color: 'muted' }); tor.arrow(0.5, 1.1, 0.5, 1.02, { color: 'muted' });
          tor.text('u →', 0.5, -0.11, { size: 11, color: 'red', align: 'center', baseline: 'top' }); tor.text('v →', 1.1, 0.5, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -4 });
          tor.text('opposite edges identified', 0.5, 1.12, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
          ring(rg, 1, { tick: 100, len: 0.04 });
          const P = sc12(B, C);
          P.forEach((c, i) => { const q = circ(c, 1); rg.dot(q[0], q[1], { r: 5.5, color: tmp.value && C.n ? 'orange' : 'accent' }); });
          rg.text(`${Math.abs(D)} notes`, 0, 0.05, { size: 18, weight: 700, align: 'center' }); rg.text(tmp.value && C.n ? `${C.n}-TET` : 'just ratios 3ᵃ5ᵇ', 0, -0.17, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['red', 'unison vector u'], ['orange', 'unison vector v'], ['accent', 'points of the periodicity block'], ['green', 'the origin (1/1)']]);
        v.readout(() => {
          const C = cur(), B = block(C), D = C.u[0] * C.w[1] - C.u[1] * C.w[0];
          const cu = fold(C.u[0] * L3 + C.u[1] * L5), cv = fold(C.w[0] * L3 + C.w[1] * L5), nm = (c) => `${v.fix(Math.min(c, 1200 - c), 2)} ¢`;
          return `u = (${C.u}) is a comma of ${nm(cu)}, v = (${C.w}) of ${nm(cv)} · $\\det(u,v)=${D}$ and the block holds ${B.length} lattice points ${B.length === Math.abs(D) ? '= |det|' : '(≠ |det|?)'} · ${tmp.value && C.n ? `tempered out: ${C.n}-TET, steps ${C.m3} for the prime 3 and ${C.m5} for the prime 5` : 'untempered: the notes are just 5-limit ratios, distinct pitches'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Method',
      name: 'Adaptive tuning',
      statement: String.raw`**Adaptive tuning** (also called dynamic or "just intonation in motion") re-tunes the notes of a chord progression as it is played, so that each chord, or each moment, is as consonant as possible. One way to define it: for every chord choose the pitches that minimise its total sensory dissonance (6.4, 6.10, the sum over all pairs of partials of the Plomp–Levelt curve), keeping notes that the chord shares with the previous one unchanged so that the melody does not jump. The result sounds in tune in every chord, but the pitch of the music is not fixed: in a progression that returns to its start the pitch generally drifts, by the syntonic comma per cycle for the progression C–Am–Dm–G–C (7.6). If instead the root of every chord is anchored to equal temperament there is no drift but the chords can only be tuned relative to their roots.`,
      idea: String.raw`Dissonance of a set of partials is a smooth function of the pitches (6.4), with sharp local minima where partials coincide, near the just ratios. Minimising it over the free notes of the chord, starting from equal temperament, lands in the nearest minimum, which is the pure triad about the held notes. Because the chords' common notes carry the pitch forward, small errors accumulate exactly as in 7.6: the optimisation does not remove the comma, it relocates it into pitch drift. Weighting each note's distance from its equal-tempered pitch trades the purity of the chords against the drift.`,
      caption: String.raw`The progression C–Am–Dm–G–C repeated. Each dot is a note of the chord, drawn at its deviation from 12-TET after the tuning has been optimised (gold: the root). Choose the rule: common tones held (the tuning follows the chords and drifts) or roots anchored to 12-TET (no drift). The slider pulls every note toward its equal-tempered pitch. Compare the sound with fixed equal temperament and read the total dissonance in the readout.`,
      deps: ['music-7.6', 'music-6.4'],
      see: ['music-6.10', 'music-6.5', 'music-7.5'],
      refs: ['Sethares ch. 8'],
      tags: ['tuning', 'dissonance'],
      credit: 'adaptive tuning after W. A. Sethares, Tuning, Timbre, Spectrum, Scale (1998/2005), ch. 8',
      scope: String.raw`A computational demonstration with 6-partial harmonic tones $0.88^{k-1}$ in Sethares's roughness model; the optimiser (Nelder–Mead from 12-TET, notes confined near their equal-tempered pitch) finds local minima, not necessarily global ones. It is an illustration of the method, not a reproduction of a particular published algorithm. Real-time retuning systems differ in how they weigh drift and purity.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Adaptive_tuning' },
      verify: true,
      viz(v) {
        const M = v.M, CHORDS = [{ n: 'C', notes: [0, 4, 7], root: 0 }, { n: 'Am', notes: [0, 4, 9], root: 9 }, { n: 'Dm', notes: [2, 5, 9], root: 2 }, { n: 'G', notes: [2, 7, 11], root: 7 }];
        const mode = v.select('rule', [{ value: 'follow', label: 'common tones held' }, { value: 'anchor', label: 'roots anchored to 12-TET' }], 'follow');
        const lam = v.slider('pull toward 12-TET', 0, 0.004, 0.0001, { step: 0.00005, fmt: (x) => v.fix(x * 1000, 2) });
        const passes = v.slider('passes', 1, 6, 3, { int: true });
        const g = v.stage({ x: [-0.3, 12.3], y: [-60, 15], axes: 'box', gutter: true, height: 340, full: true, xticks: [], xlabel: 'chord', ylabel: 'deviation from 12-TET (¢)', title: 'the retuned notes' });
        const snd = v.sound();
        const diss = (notes, d) => dissAll(notes.flatMap((s, j) => at(TIM, C4 * 2 ** ((100 * s + d[j]) / 1200))));
        const cache = {};
        const solve = () => {
          const key = `${mode.value}|${lam.value}|${passes.value}`; if (cache[key]) return cache[key];
          const out = []; let prev = null;
          for (let k = 0; k <= 4 * passes.value; k++) {
            const ch = CHORDS[k % 4], free = [], d = ch.notes.map((s, j) => { const pin = mode.value === 'anchor' ? (s === ch.root ? 0 : null) : (k === 0 ? (s === ch.root ? 0 : null) : (prev && prev.has(s) ? prev.get(s) : null)); if (pin === null) free.push(j); return pin; });
            const pinned = d.filter((x) => x !== null), x0 = pinned.length ? pinned.reduce((a, b) => a + b, 0) / pinned.length : 0;
            const f = (x) => { const dd = d.slice(); free.forEach((j, i) => { dd[j] = x[i]; }); const pen = free.reduce((a, j, i) => a + x[i] * x[i], 0); return diss(ch.notes, dd) + lam.value * pen + (x.some((q) => Math.abs(q - x0) > 35) ? 5 : 0); };
            if (free.length) { const r = M.nelderMead(f, free.map(() => x0), { step: 6, tol: 1e-7, maxIt: 400 }); free.forEach((j, i) => { d[j] = r.x[i]; }); }
            out.push({ ch, d, D: diss(ch.notes, d), D12: diss(ch.notes, ch.notes.map(() => 0)) });
            prev = new Map(ch.notes.map((s, j) => [s, d[j]]));
          }
          return (cache[key] = out);
        };
        const buf = (m) => seqCents(solve().map((c) => c.ch.notes.map((s, j) => 100 * s + (m === 'et' ? 0 : c.d[j]))), C4, 0.9, 0.06);
        v.soundButton('play: adaptive', (sd) => sd.samples(buf('ad'), SR, { gain: 0.9 }));
        v.soundButton('play: 12-TET', (sd) => sd.samples(buf('et'), SR, { gain: 0.9 }));
        v.soundButton('first C, then the last C', (sd) => { const S = solve(); sd.samples(seqCents([[S[0].d[0]], [S[S.length - 1].d[0]]], C4, 1.2, 0.15), SR, { gain: 0.9 }); });
        v.render(() => {
          const S = solve();
          g.hline(0, { color: 'muted', dash: [4, 4] });
          const lo = Math.min(-10, ...S.flatMap((c) => c.d)) - 8, hi = Math.max(8, ...S.flatMap((c) => c.d)) + 8;
          g.setView([-0.3, 4 * passes.value + 0.3], [lo, hi]);
          const voices = new Map();
          S.forEach((c, k) => c.ch.notes.forEach((s, j) => { const col = s === c.ch.root ? 'gold' : 'accent'; g.dot(k, c.d[j], { r: 4.5, color: col }); if (k) { const pv = S[k - 1].ch.notes.indexOf(s); if (pv >= 0) g.line(k - 1, S[k - 1].d[pv], k, c.d[j], { color: 'accent', width: 1.2, alpha: 0.35 }); } }));
          S.forEach((c, k) => g.text(c.ch.n, k, hi - 2, { size: 11, color: k % 4 === 0 ? 'gold' : 'muted', align: 'center', baseline: 'top', weight: k % 4 === 0 ? 700 : 400 }));
        });
        v.legend([['gold', 'root of the chord'], ['accent', 'other notes']]);
        v.readout(() => {
          const S = solve(), last = S[S.length - 1], tD = S.reduce((a, c) => a + c.D, 0), t12 = S.reduce((a, c) => a + c.D12, 0), root = (c) => c.d[c.ch.notes.indexOf(c.ch.root)];
          return `${passes.value} pass${passes.value > 1 ? 'es' : ''} · total dissonance: adaptive ${v.fix(tD, 2)}, 12-TET ${v.fix(t12, 2)} (${v.fix((100 * (t12 - tD)) / t12, 0)}% lower) · final C is ${sc(v, last.d[0], 1)} ¢ from 12-TET (${sc(v, last.d[0] / passes.value, 1)} ¢ per pass; the pure-interval value is −21.5) · first-pass roots: ${S.slice(0, 4).map((c) => `${c.ch.n} ${sc(v, root(c), 1)}`).join(', ')} ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.17
    {
      num: '7.17',
      kind: 'Concept',
      name: 'The Bohlen–Pierce scale',
      statement: String.raw`The **Bohlen–Pierce scale** divides not the octave but the **tritave**, the interval $3{:}1$ (1901.955 ¢), into 13 steps, in its equal-tempered form each a ratio $3^{1/13}$ of 146.3 ¢. It is designed for tones that have only odd harmonics (as a clarinet or any closed pipe does, 3.3): the partials of such a tone are $f, 3f, 5f, 7f,\dots$, the interval $2{:}1$ does not occur among them, and the simplest coincidences are $3{:}1$, $5{:}3$, $7{:}5$, $7{:}3$ and the chord $3{:}5{:}7$. The just version of the scale uses the ratios $1,\ \tfrac{27}{25},\ \tfrac{25}{21},\ \tfrac97,\ \tfrac75,\ \tfrac{75}{49},\ \tfrac53,\ \tfrac95,\ \tfrac{49}{25},\ \tfrac{15}{7},\ \tfrac73,\ \tfrac{63}{25},\ \tfrac{25}{9},\ 3$, built from the primes 3, 5 and 7 like the ordinary just scale from 2, 3 and 5; steps 0, 6, 10 of the equal scale approximate the basic chord $3{:}5{:}7$.`,
      idea: String.raw`Consonance of the dissonance curve (6.4) depends on the timbre (6.5): minima occur where partials of the two notes coincide. For a spectrum of odd harmonics the coincidences are at the ratios of odd numbers, such as 3, 5/3, 7/3, 7/5, 9/5 and 9/7, which lie naturally in a tritave rather than an octave; the octave itself has no coinciding partials at all (odd multiples of $f$ never equal odd multiples of $2f$). Thirteen equal steps of the tritave follow the thirteen just ratios to within about 13 ¢ (the largest deviation is at $27/25$), because $13\log_35=19.05$ and $13\log_37=23.03$ are both close to whole numbers: the primes 3, 5 and 7 are each approximated by a whole number of steps. It is the analogue, for a different timbre, of 12-TET for harmonic tones.`,
      caption: String.raw`The dissonance curve of a tone against a copy of itself over one tritave, for odd harmonics only (as a closed pipe) or for all harmonics, with the 13 equal steps of the Bohlen–Pierce scale as grey ticks and the just ratios in green; the orange dots are the curve's own minima. Notice that for odd harmonics the deep minima fall on the steps 3, 4, 6, 7, 10 and 13 (the ratios 9/7, 7/5, 5/3, 9/5, 7/3 and 3/1), and the octave has no deep valley at all; for the full harmonic series the deep minima are the octave-based ratios (2/1, 3/2, 4/3, …) and 3/1. Play the scale and the chord 3:5:7 with either timbre.`,
      deps: ['music-7.11', 'music-3.3', 'music-6.5'],
      see: ['music-6.6', 'music-6.7', 'music-7.12'],
      refs: ['Benson ch. 6'],
      tags: ['non-octave', 'tuning'],
      credit: 'Heinz Bohlen, 1972 (published 1978); Kees van Prooijen, 1978 (independently); J. R. Pierce, M. V. Mathews and L. A. Roberts, 1984 (independently)',
      scope: String.raw`Roughness model of Sethares for steady tones, 11 harmonics with amplitudes $0.88^{k-1}$ (odd ones only in the closed-pipe case), base 261.6 Hz. The thirteen just ratios above are quoted from memory of the standard list and should be checked; the dissonance minima are computed here, not quoted. Whether listeners perceive the scale as "consonant" with odd-harmonic timbres is a matter of experiment and of learning.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale' },
      verify: true,
      viz(v) {
        const JB = [[1, 1], [27, 25], [25, 21], [9, 7], [7, 5], [75, 49], [5, 3], [9, 5], [49, 25], [15, 7], [7, 3], [63, 25], [25, 9], [3, 1]];
        const TR = cents(3), ST = TR / 13;
        const tim = v.select('timbre', [{ value: 'odd', label: 'odd harmonics (closed pipe)' }, { value: 'all', label: 'all harmonics' }], 'odd');
        const spec = (k) => (k === 'odd' ? [1, 3, 5, 7, 9, 11].map((h) => [h, 0.88 ** (h - 1)]) : Array.from({ length: 11 }, (_, i) => [i + 1, 0.88 ** i]));
        const cv = v.stage({ x: [0, 2000], y: [0, 1.08], axes: 'box', gutter: true, height: 340, full: true, xticks: [0, 400, 800, 1200, 1600, 1902].map((x) => [x, String(x)]), yticks: [], xlabel: 'interval above the lower tone (cents)', ylabel: 'dissonance', title: 'dissonance curve of a tone with itself' });
        const rg = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 340, title: 'the tritave circle' });
        const snd = v.sound();
        const cache = {};
        const curve = (k) => cache[k] || (cache[k] = (() => { const c = dissCurve(spec(k), C4, 0, 2000, 800), mn = minima(c, 0.01); let lo = Infinity, hi = -Infinity; for (const x of c.d) { lo = Math.min(lo, x); hi = Math.max(hi, x); } return { c, mn, lo, hi }; })());
        const nearest = (c) => { let b = 0; for (let i = 0; i <= 13; i++) if (Math.abs(i * ST - c) < Math.abs(b * ST - c)) b = i; return b; };
        const stepC = (i) => i * ST, justC = (i) => cents(JB[i][0] / JB[i][1]);
        const sp = () => spec(tim.value);
        v.soundButton('play the scale', (sd) => sd.samples(seqCents(Array.from({ length: 14 }, (_, i) => [i * ST]), C4, 0.5, 0.03, sp()), SR, { gain: 0.9 }));
        v.soundButton('chord 3:5:7', (sd) => sd.samples(seqCents([[0, cents(5 / 3), cents(7 / 3)]], C4, 2.2, 0, sp()), SR, { gain: 0.9 }));
        v.soundButton('major triad 4:5:6', (sd) => sd.samples(seqCents([[0, M3J, FIFTH]], C4, 2.2, 0, sp()), SR, { gain: 0.9 }));
        v.render(() => {
          const K = curve(tim.value), n = (y) => (y - K.lo) / (K.hi - K.lo) * 0.95 + 0.04;
          for (let i = 0; i <= 13; i++) { cv.vline(i * ST, { color: 'muted', alpha: 0.35, width: 1 }); }
          for (let i = 0; i < JB.length; i++) { const c = justC(i); cv.vline(c, { color: 'green', width: 1.1, dash: [3, 3], alpha: 0.9 }); }
          cv.vline(1200, { color: 'red', width: 1.4, dash: [6, 4] }); cv.text('octave 2:1', 1200, 1.04, { size: 11, color: 'red', align: 'center', plate: true });
          cv.vline(TR, { color: 'green', width: 1.6 }); cv.text('tritave 3:1', TR, 1.04, { size: 11, color: 'green', align: 'right', dx: -4, plate: true });
          cv.path(Array.from(K.c.c, (c, i) => [c, n(K.c.d[i])]), { color: 'accent', width: 2.6 });
          K.mn.forEach((m) => { cv.dot(m.c, n(m.d), { r: 5, color: 'orange' }); });
          ring(rg, 1, { tick: ST, period: TR, len: 0.06 });
          for (let i = 0; i < 13; i++) { const a = circ(i * ST, 0.82, TR); rg.text(String(i), a[0], a[1], { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); }
          JB.slice(0, 13).forEach(([p, q], i) => { const a = circ(justC(i), 1, TR), l = circ(justC(i), 1.2, TR); rg.dot(a[0], a[1], { r: 4.5, color: 'green' }); rg.text(`${p}/${q}`, l[0], l[1], { size: 10.5, color: 'green', align: 'center', baseline: 'middle' }); });
          rg.text('13 steps of 3:1', 0, 0.05, { size: 13, weight: 700, align: 'center' }); rg.text(`${v.fix(ST, 2)} ¢ each`, 0, -0.14, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['accent', 'dissonance'], ['orange', 'minima of the curve'], ['green', 'just BP ratios'], ['muted', 'equal steps']]);
        v.readout(() => {
          const K = curve(tim.value), mins = K.mn.filter((m) => m.c > 20 && m.c < 1990).map((m) => { const i = nearest(m.c); return `${v.fix(m.c, 0)} ¢ (step ${i}, ${sc(v, m.c - i * ST, 0)})`; });
          const d = (c) => { const S = spec(tim.value), A = dissAll(at(S, C4).concat(at(S, C4 * 2 ** (c / 1200)))); return A; };
          return `step ${v.fix(ST, 3)} ¢ = $3^{1/13}$, tritave ${v.fix(TR, 3)} ¢ · ${tim.value === 'odd' ? 'odd harmonics' : 'all harmonics'}: minima at ${mins.slice(0, 9).join(', ')} · dissonance at 3:5:7's intervals vs octave-based: 5/3 → ${v.fix(d(cents(5 / 3)), 2)}, 3/2 → ${v.fix(d(FIFTH), 2)}, 2/1 → ${v.fix(d(1200), 2)}, 3/1 → ${v.fix(d(TR), 2)}`;
        });
      },
    },
  ],
};
