// Music Theory & Acoustics — Chapter 6: Consonance and dissonance (part b: items 6.9–6.15)
import { SR, loopVoice, cbw, pl, at, dissAll, diss2, dissCurve, minima, sample, cents, gcd, lcm, factor, gradus, gradusN, nearRatio, JUST, harmonic, stretched, BEAM, TET10, ratioStr, toneBuf, mixBuf, seqBuf, loopParts, ratioTicks, plStd, plDiss65, plComplex, PL_FIG10, PL_MEDIANS, PL_FIG11, PL_FIG12, helmPair, noteOf } from './ch06.shared.js';

const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const mname = (m) => `${NOTE[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
const mfreq = (m) => 440 * 2 ** ((m - 69) / 12);
const sc = (v, x, d = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? `±${v.fix(0, d)}` : `${x >= 0 ? '+' : '−'}${v.fix(Math.abs(x), d)}`);

const isBlack = (m) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
/** Horizontal centre of key m on a keyboard whose white keys have equal width 12/7 (in semitone units), counted from C of octave lo. */
function keyX(m, lo) {
  const W = 12 / 7, oct = Math.floor((m - lo) / 12), pc = (((m - lo) % 12) + 12) % 12, whites = [0, 2, 4, 5, 7, 9, 11], wi = whites.indexOf(pc);
  if (wi >= 0) return lo + (oct * 7 + wi + 0.5) * W;
  return lo + (oct * 7 + whites.indexOf(pc - 1) + 1) * W;
}
/** Draw a piano keyboard from MIDI lo (a C) to hi on stage s (y in [0, 1]); `lit` = {midi: colour}. */
function keyboard(s, lo, hi, lit = {}) {
  const W = 12 / 7;
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) { const x = keyX(m, lo); s.rect(x - W / 2, 0, x + W / 2, 1, { fill: lit[m] || 'panel', fillAlpha: lit[m] ? 0.6 : 1, color: 'muted', width: 1 }); }
  for (let m = lo; m <= hi; m++) if (isBlack(m)) { const x = keyX(m, lo); s.rect(x - 0.3 * W, 0.38, x + 0.3 * W, 1, { fill: lit[m] || 'ink', fillAlpha: lit[m] ? 0.95 : 0.85, color: 'ink', width: 1 }); }
  for (let m = lo; m <= hi; m++) if (m % 12 === 0) s.text(mname(m), keyX(m, lo), 0.1, { color: 'muted', size: 10, align: 'center' });
}

export default {
  collection: 'music',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Phenomenon',
      name: 'The low interval limit',
      statement: String.raw`The same interval sounds rougher the lower it is played. A major or minor third that is smooth around middle C becomes thick and muddy two octaves lower, while a fifth stays clear further down and an octave further still. For each interval there is a register below which its roughness climbs steeply, and that register is lower the more consonant the interval: arrangers' rules of thumb ("low interval limits") keep thirds out of the deep bass and voice low chords in open fifths and octaves. Published tables of the limits differ from source to source.`,
      idea: String.raw`An interval of fixed ratio has partials separated by a fixed number of cents, that is by a frequency difference proportional to register; the critical band is about 100 Hz wide below 500 Hz and so is wide in cents in the bass (5.4). Lower an interval and more pairs of neighbouring partials fall within a fraction of a critical band of each other, the region of maximal roughness of the Plomp–Levelt curve (6.3). For a third the first partials already crowd together near the bottom of the keyboard; for an octave the closest neighbours are a whole fundamental apart, which stays outside a critical band to a much lower register. Plomp and Levelt computed exactly this (their Fig. 12, 6.14) and remarked that it matches the musical practice of avoiding thirds at low frequencies.`,
      caption: String.raw`Top: drag the gold key to move the interval up and down the keyboard (both notes light up). Bottom: dissonance of the interval against the pitch of its lower note for five intervals of 6-partial harmonic tones (yours in bold); the red line marks where your interval becomes rougher than on C6 by 2.5 units, an illustrative threshold. The readout names the roughest pair of partials and compares their spacing with the critical band. Play the interval, or a descent through four octaves.`,
      deps: ['music-6.3'],
      see: ['music-6.14', 'music-5.4', 'music-6.10'],
      refs: ['Sethares ch. 5'],
      tags: ['register', 'roughness'],
      credit: 'Plomp & Levelt, 1965 (Fig. 12); orchestration practice',
      scope: String.raw`Sensory roughness of steady harmonic tones in Sethares's model, equal-tempered intervals, amplitudes $0.88^{k-1}$. Real bass instruments have their own spectra; the threshold drawn is arbitrary, chosen only to make the trend visible. Practical "low interval limit" tables are rules of thumb that vary between sources.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance' },
      viz(v) {
        const M = v.M, LO = 24, HI = 84, SP = harmonic(6, 0.88);
        const IV = [{ n: 3, name: 'minor third', col: 'red' }, { n: 4, name: 'major third', col: 'orange' }, { n: 5, name: 'fourth', col: 'purple' }, { n: 7, name: 'fifth', col: 'teal' }, { n: 12, name: 'octave', col: 'green' }];
        const ivS = v.select('interval', IV.map((x, i) => ({ value: i, label: x.name })), 1, { onChange: () => sync() });
        const KX0 = keyX(LO, LO) - 6 / 7, KX1 = keyX(HI, LO) + 6 / 7;
        const kb = v.stage({ x: [KX0, KX1], y: [0, 1.05], height: 110, axes: false, full: true, title: 'drag the gold key' });
        const cv = v.stage({ x: [LO, HI], y: [0, 9.5], height: 300, axes: 'box', gutter: true, full: true, xticks: [24, 36, 48, 60, 72, 84].map((m) => [m, mname(m)]), yticks: [0, 2, 4, 6, 8].map((y) => [y, String(y)]), xlabel: 'lower note', ylabel: 'dissonance', title: 'roughness of an interval across the register' });
        let km = 48;
        const nearestKey = (x) => { let b = LO, bd = 1e9; for (let m = LO; m <= HI - 12; m++) { const d = Math.abs(keyX(m, LO) - x); if (d < bd) { bd = d; b = m; } } return b; };
        const key = kb.handle(keyX(48, LO), 0.25, { color: 'gold', r: 8, constrain: (x) => { km = nearestKey(x); return [keyX(km, LO), isBlack(km) ? 0.75 : 0.25]; } });
        const lv = loopVoice(v);
        const d = (m, n) => diss2(SP, mfreq(m), SP, mfreq(m + n));
        const curves = IV.map((iv) => { const P = []; for (let m = LO; m <= HI; m += 0.25) P.push([m, d(m, iv.n)]); return P; });
        const limit = IV.map((iv, i) => { const ref = d(84, iv.n) + 2.5; let m = 84; while (m > LO && d(m, iv.n) < ref) m -= 0.25; return { m, ref }; });
        const loopBuf = () => loopParts(at(SP, mfreq(km)).concat(at(SP, mfreq(km + IV[ivS.value].n))));
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        key.onDrag = sync;
        v.toggle('hold the interval', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('descend four octaves', (snd) => { const n = IV[ivS.value].n; snd.samples(seqBuf([72, 60, 48, 36].map((m) => [[SP, mfreq(m)], [SP, mfreq(m + n)]]), 1.1, 0.15), SR, { gain: 0.9 }); });
        v.render(() => {
          const iv = IV[ivS.value], m = km;
          keyboard(kb, LO, HI, { [m]: 'gold', [m + iv.n]: 'gold' });
          IV.forEach((x, i) => { if (i !== ivS.value) cv.path(curves[i], { color: x.col, width: 1.2, alpha: 0.5 }); });
          cv.path(curves[ivS.value], { color: iv.col, width: 2.8 });
          const L = limit[ivS.value];
          cv.vband(LO, L.m, { color: 'red', alpha: 0.04 });
          cv.vline(L.m, { color: 'red', dash: [5, 4], width: 1.3 });
          cv.text(`below ${mname(Math.round(L.m))}: rough`, L.m, 9.1, { color: 'red', size: 10.5, align: 'right', dx: -4, plate: true });
          cv.dot(m, d(m, iv.n), { r: 6, color: 'gold' });
        });
        v.legend(IV.map((x) => [x.col, x.name]));
        v.readout(() => {
          const iv = IV[ivS.value], m = km, A = at(SP, mfreq(m)), B = at(SP, mfreq(m + iv.n));
          let best = null; for (const [fa, aa] of A) for (const [fb, ab] of B) { const r = pl(fa, fb, aa, ab); if (!best || r > best.r) best = { r, df: Math.abs(fb - fa), fa, fb }; }
          const cb = cbw((best.fa + best.fb) / 2);
          return `${iv.name} on ${mname(m)} (${v.fix(mfreq(m), 1)} Hz) · dissonance ${v.fix(d(m, iv.n), 2)} (in the treble, on C6: ${v.fix(d(84, iv.n), 2)}) · roughest pair of partials ${v.fix(best.fa, 0)} and ${v.fix(best.fb, 0)} Hz, ${v.fix(best.df, 1)} Hz apart = ${v.fix(best.df / cb, 2)} of a critical band (the Plomp–Levelt maximum is near 0.25)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Model',
      name: 'Dissonance of three-note chords',
      statement: String.raw`The sensory dissonance of a chord is the sum of the Plomp–Levelt dissonances of all pairs of partials of all its notes. For a three-note chord with intervals $x$ (lower to middle) and $y$ (middle to upper) it is a function $D(x,y)$ on the plane, the sum of the three two-note curves $D_2(x)$, $D_2(y)$ and $D_2(x+y)$ (6.4) plus the intrinsic dissonance of each tone. For harmonic tones the smoothest three-note chords are those built only from octaves, fifths and fourths (C–G–C′). Among chords containing thirds, the **major** and **minor triads** in just intonation ($x,y$ = 5/4 and 6/5, in either order) and their inversions sit in sharp local valleys, the major and minor triads almost equally deep, while the diminished and augmented triads lie far higher; the equal-tempered triads sit on the valley walls, a dozen cents from the bottoms.`,
      idea: String.raw`A triad's three intervals are all consonant at once only when each of $x$, $y$ and $x+y$ falls in a dip of the two-note curve. With $x+y$ a fifth (3/2), the choices $x=5/4$, $y=6/5$ and the reverse put all three intervals on minima: those are the major and minor triads, and their dissonance comes out nearly equal in this model; diminished and augmented triads place $x+y$ on a tritone or minor sixth instead. Changing the timbre changes $D_2$ and so moves the valleys: with stretched partials the triad valleys follow the stretched scale (6.5), and with a bar's inharmonic spectrum the familiar triads are no longer special.`,
      caption: String.raw`A map of the total dissonance of three-note chords on C4: horizontally the lower interval, vertically the upper one, with contours; the stronger the colour, the rougher the chord, and smooth chords fade into the background. Named chords are marked at their equal-tempered positions (just triads as rings). Drag the gold point to choose a chord and hear it; switch the timbre to stretched partials or to a free bar's partials and watch the valleys move away from the triads.`,
      deps: ['music-6.4'],
      see: ['music-9.1', 'music-6.5', 'music-7.16'],
      refs: ['Sethares ch. 6'],
      tags: ['chords', 'dissonance'],
      credit: 'Plomp & Levelt, 1965; W. A. Sethares, 1993',
      scope: String.raw`Roughness only: the model rates major and minor triads alike, while listeners usually hear minor triads as less consonant, a difference attributed to harmonicity and to musical learning. Root at C4, 6 partials with amplitudes $0.88^{k-1}$ (stretched: $A=2.1$; free bar: the first four beam modes).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Triad_(music)' },
      viz(v) {
        const M = v.M, F0 = 261.63, X0 = 50, X1 = 850, G = 128;
        let grid = null, gk = '';
        const tim = v.select('timbre', [{ value: 'harm', label: 'harmonic' }, { value: 'str', label: 'stretched (A = 2.1)' }, { value: 'bar', label: 'free bar' }], 'harm', { onChange: () => v.invalidate() });
        const specOf = (k) => (k === 'str' ? stretched(6, 2.1) : k === 'bar' ? BEAM.slice(0, 4).map((r, i) => [r, 0.88 ** i]) : harmonic(6, 0.88));
        const s = v.stage({ x: [X0, X1], y: [X0, X1], height: 470, axes: 'box', gutter: true, full: true, xticks: [100, 200, 300, 400, 500, 600, 700, 800].map((c) => [c, String(c)]), yticks: [100, 200, 300, 400, 500, 600, 700, 800].map((c) => [c, String(c)]), xlabel: 'lower interval $x$ (cents)', ylabel: 'upper interval $y$ (cents)', title: 'total dissonance of three-note chords' });
        const h = s.handle(400, 300, { color: 'gold', r: 8, constrain: (x, y) => [M.clamp(x, X0, X1), M.clamp(y, X0, X1)] });
        const chordD = (S, x, y) => dissAll(at(S, F0).concat(at(S, F0 * 2 ** (x / 1200)), at(S, F0 * 2 ** ((x + y) / 1200))));
        function build() {
          if (gk === tim.value && grid) return grid;
          const S = specOf(tim.value), d = new Float32Array((G + 1) * (G + 1)); let lo = Infinity, hi = -Infinity;
          for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) { const x = X0 + ((X1 - X0) * i) / G, y = X0 + ((X1 - X0) * j) / G, val = chordD(S, x, y); d[j * (G + 1) + i] = val; if (val < lo) lo = val; if (val > hi) hi = val; }
          const mins = [];
          for (let j = 1; j < G; j++) for (let i = 1; i < G; i++) { const c = d[j * (G + 1) + i]; let ok = true; for (let dj = -1; dj <= 1 && ok; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && d[(j + dj) * (G + 1) + i + di] <= c) { ok = false; break; } if (ok) mins.push([X0 + ((X1 - X0) * i) / G, X0 + ((X1 - X0) * j) / G, c]); }
          const sorted = Array.from(d).sort((a, b) => a - b), p90 = sorted[Math.floor(0.9 * sorted.length)];
          const keep = mins.filter((m) => m[2] < lo + 0.45 * (p90 - lo)).filter((m, i, A) => !A.some((o) => o !== m && o[2] < m[2] && Math.hypot(o[0] - m[0], o[1] - m[1]) < 45));
          grid = { d, lo, hi: p90, mins: keep }; gk = tim.value; return grid;
        }
        const look = (x, y) => { const g = build(), u = M.clamp(((x - X0) / (X1 - X0)) * G, 0, G - 1e-9), w = M.clamp(((y - X0) / (X1 - X0)) * G, 0, G - 1e-9), i = Math.floor(u), j = Math.floor(w), a = u - i, b = w - j, D = g.d, n = G + 1; return (1 - a) * (1 - b) * D[j * n + i] + a * (1 - b) * D[j * n + i + 1] + (1 - a) * b * D[(j + 1) * n + i] + a * b * D[(j + 1) * n + i + 1]; };
        const NAMED = [['major', 400, 300], ['minor', 300, 400], ['sus4', 500, 200], ['sus2', 200, 500], ['dim', 300, 300], ['aug', 400, 400], ['quartal', 500, 500], ['maj 6/4', 500, 400], ['maj 6', 300, 500], ['min 6', 400, 500], ['min 6/4', 500, 300], ['cluster', 100, 100]];
        const JT = [[cents(5 / 4), cents(6 / 5)], [cents(6 / 5), cents(5 / 4)]];
        const play = () => { const S = specOf(tim.value); v.sound().stop(); v.sound().samples(mixBuf([[S, F0], [S, F0 * 2 ** (h.x / 1200)], [S, F0 * 2 ** ((h.x + h.y) / 1200)]], 1.6), SR, { gain: 0.9 }); };
        h.onDrag = () => v.invalidate();
        v.soundButton('play the chord', () => play());
        v.button('snap to 12-TET', () => { h.set(Math.round(h.x / 100) * 100, Math.round(h.y / 100) * 100); play(); });
        v.render(() => {
          const g = build(), span = g.hi - g.lo;
          s.raster((x, y) => v.ramp(M.clamp((look(x, y) - g.lo) / span, 0, 1), 'accent'), { key: `${gk}|${v.rgb('panel').join()}`, res: 3 });
          s.contour((x, y) => (look(x, y) - g.lo) / span, [0.15, 0.3, 0.5, 0.75], { color: 'ink', width: 0.7, alpha: 0.5, res: 80 });
          s.axes();
          for (const [x, y] of g.mins) s.dot(x, y, { r: 3, color: 'green' });
          for (const [nm, x, y] of NAMED) { s.dot(x, y, { r: 3.5, color: 'ink' }); s.text(nm, x, y, { color: 'ink', size: 10.5, align: 'left', dx: 6, dy: -6, plate: true }); }
          for (const [x, y] of JT) s.dot(x, y, { r: 6, color: 'green', hollow: true });
          s.dot(h.x, h.y, { r: 9, color: 'gold', hollow: true });
        });
        v.legend([['accent', 'stronger colour = more dissonant', { area: true }], ['green', 'local minima of the map; rings: just major and minor triads'], ['gold', 'your chord']]);
        v.readout(() => {
          const g = build(), S = specOf(tim.value), E = (x, y) => chordD(S, x, y), d = E(h.x, h.y), nm = NAMED.reduce((b, c) => (Math.hypot(c[1] - h.x, c[2] - h.y) < Math.hypot(b[1] - h.x, b[2] - h.y) ? c : b));
          const rank = (val) => (val - g.lo) / (g.hi - g.lo);
          return `intervals ${v.fix(h.x, 0)} ¢ + ${v.fix(h.y, 0)} ¢ (nearest named: ${nm[0]}) · dissonance ${v.fix(d, 2)}, ${v.fix(100 * Math.min(1, rank(d, 0)), 0)}% of the way from the smoothest chord on the map to its 90th percentile · just major ${v.fix(E(JT[0][0], JT[0][1]), 2)}, just minor ${v.fix(E(JT[1][0], JT[1][1]), 2)}, 12-TET major ${v.fix(E(400, 300), 2)}, minor ${v.fix(E(300, 400), 2)}, diminished ${v.fix(E(300, 300), 2)}, augmented ${v.fix(E(400, 400), 2)}, C–G–C′ ${v.fix(E(cents(1.5), cents(4 / 3)), 2)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Phenomenon',
      name: 'The harmonic seventh (7:4)',
      statement: String.raw`The seventh harmonic of a tone is $7f$, and the interval $7{:}4$ from the fourth harmonic, the **harmonic seventh**, measures $1200\log_2(7/4)\approx968.8$ ¢: 31.2 ¢ flatter than the equal-tempered minor seventh (1000 ¢) and 27.3 ¢ flatter than the Pythagorean $16/9$ (996.1 ¢). A dominant seventh chord tuned $4{:}5{:}6{:}7$ consists of harmonics 4–7 of one fundamental: all its notes' partials fall on a single harmonic series, so the slow beating of the seventh's partials against the 7th partials of the other notes stops; only the fast roughness between neighbouring low partials (such as the seventh against the root's octave, a whole tone above it) remains. Barbershop quartets, singing without fixed pitch, are said to tune toward this chord, the "locked" or "ringing" chord.`,
      idea: String.raw`In equal temperament the seventh's 4th, 5th and 6th partials miss the 7th partials of the root, third and fifth: on C3 ($f=130.8$ Hz) the seventh's 4th partial ($4\times233.1=932$ Hz) lies 17 Hz above the root's 7th (916 Hz), and the other two pairs beat at about 21 and 25 Hz against a just triad, squarely in the rough range (5.7). Lowering the seventh by 31 ¢ makes $4\cdot\tfrac74f=7f$ exactly, and with a just triad ($4{:}5{:}6$) every near-coincidence becomes an exact one: the chord's partials are the harmonics of $f/4$ (6.1). The dissonance curve against the position of the seventh accordingly has a local minimum at 968.8 ¢, while 1000 ¢ sits on its wall.`,
      caption: String.raw`A C dominant seventh chord on C3 with 8-partial tones. Slide the seventh between 940 and 1040 ¢ and choose a just ($4{:}5{:}6$) or equal-tempered triad below it. Left: the chord's total dissonance against the seventh's position, with 7/4, 16/9, 12-TET and 9/5 marked. Right: every pair of partials (one from the seventh, one from another note) closer than 40 Hz, as bars at their beat rate; at 7/4 over a just triad the three slow pairs (the seventh's 4th, 5th and 6th partials against the 7th partials of root, third and fifth) collapse onto 0 Hz, the "lock", while fast beats between low partials remain. Play the chord, or equal temperament followed by 4:5:6:7.`,
      deps: ['music-6.4', 'music-2.6'],
      see: ['music-7.5', 'music-7.12', 'music-5.6'],
      refs: ['Benson ch. 5'],
      tags: ['just intonation', 'seventh'],
      scope: String.raw`Sensory roughness of steady harmonic tones (Sethares's model, amplitudes $0.88^{k-1}$); singers' actual tunings vary and depend on context. The septimal seventh is not part of 5-limit just intonation (7.5); it is approximated well by 31-tone equal temperament (7.12).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Harmonic_seventh' },
      viz(v) {
        const M = v.M, F = 130.81, SP = harmonic(8, 0.88);
        const sev = v.slider('seventh (cents above the root)', 940, 1040, 1000, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} ¢` });
        const just = v.toggle('just triad 4:5:6 below it', true);
        const triad = () => (just.value ? [0, cents(5 / 4), cents(3 / 2)] : [0, 400, 700]);
        const notes = (c7 = sev.value) => [...triad(), c7].map((c) => F * 2 ** (c / 1200));
        const D = (c7) => dissAll(notes(c7).flatMap((f) => at(SP, f)));
        const cv = v.stage({ x: [940, 1040], y: [0, 1.1], height: 300, axes: 'box', gutter: true, weight: 1.2, xticks: [940, 960, 980, 1000, 1020, 1040].map((c) => [c, String(c)]), yticks: [[0, 'min'], [1, 'max']], xlabel: 'the seventh (cents)', ylabel: 'chord dissonance', title: 'dissonance of the seventh chord' });
        const bt = v.stage({ x: [0, 40], y: [0, 0.95], height: 300, axes: 'box', gutter: true, weight: 1, xticks: [0, 10, 20, 30, 40].map((x) => [x, String(x)]), yticks: [], xlabel: 'beat rate (Hz)', ylabel: 'roughness', title: 'partial pairs closer than 40 Hz' });
        let cache = null, ck = '';
        const curve = () => { const k = String(just.value); if (cache && ck === k) return cache; const P = []; for (let c = 940; c <= 1040; c += 0.5) P.push([c, D(c)]); const lo = Math.min(D(cents(7 / 4)), ...P.map((p) => p[1])), hi = Math.max(...P.map((p) => p[1])); cache = { P, lo, hi }; ck = k; return cache; };
        const pairs = () => {
          const ns = notes(), out = [], names = ['root', '3rd', '5th'];
          const S7 = at(SP, ns[3]);
          for (let n = 0; n < 3; n++) at(SP, ns[n]).forEach(([fa, aa], i) => S7.forEach(([fb, ab], j) => { const b = Math.abs(fb - fa); if (b < 40) out.push({ b, w: b < 0.5 ? Math.min(aa, ab) : pl(fa, fb, aa, ab), lab: `7th·${j + 1} – ${names[n]}·${i + 1}`, lock: i === 6 && j === 3 + n }); }));
          return out.sort((a, b) => b.w - a.w);
        };
        v.soundButton('play the chord', (snd) => snd.samples(mixBuf(notes().map((f) => [SP, f]), 2.2), SR, { gain: 0.9 }));
        v.soundButton('12-TET, then 4:5:6:7', (snd) => snd.samples(seqBuf([[0, 400, 700, 1000], [0, cents(5 / 4), cents(3 / 2), cents(7 / 4)]].map((ch) => ch.map((c) => [SP, F * 2 ** (c / 1200)])), 2.0, 0.35), SR, { gain: 0.9 }));
        v.render(() => {
          const K = curve(), nrm = (y) => (y - K.lo) / (K.hi - K.lo);
          for (const [c, lab, col, y] of [[cents(7 / 4), '7/4', 'green', 1.06], [cents(16 / 9), '16/9', 'muted', 0.96], [1000, '12-TET', 'red', 1.06], [cents(9 / 5), '9/5', 'muted', 0.96]]) { cv.vline(c, { color: col, dash: [4, 4], width: 1.2 }); cv.text(lab, c, y, { color: col, size: 10.5, align: c === 1000 ? 'left' : c < 980 ? 'center' : 'right', dx: c === 1000 ? 2 : c < 980 ? 0 : -2, plate: true }); }
          cv.path(K.P.map(([c, y]) => [c, nrm(y)]), { color: 'accent', width: 2.4 });
          cv.dot(sev.value, nrm(D(sev.value)), { r: 6, color: 'gold' });
          const P = pairs();
          const top = P.filter((p) => p.b >= 0.5).sort((a, b) => b.w - a.w)[0];
          let row = 0;
          P.slice().sort((a, b) => a.b - b.b).forEach((p) => {
            const x = Math.max(p.b, 0.35), lock = p.lock || p === top;
            bt.line(x, 0, x, p.w, { color: p.b < 0.5 ? 'green' : 'red', width: 4, alpha: 0.85 });
            if (lock) { bt.text(p.lab, x, p.w, { color: p.b < 0.5 ? 'green' : 'red', size: 10, align: x > 26 ? 'right' : 'left', dx: x > 26 ? -5 : 5, dy: -2 + 15 * (row % 2), plate: true }); row++; }
          });
          if (!P.length) bt.text('no partial pairs within 40 Hz', 20, 0.6, { color: 'muted', size: 12, align: 'center' });
          bt.vband(15, 40, { color: 'red', alpha: 0.05 });
          bt.text('rough (≳15 beats/s)', 39, 0.9, { color: 'red', size: 10, align: 'right' });
        });
        v.legend([['accent', 'chord dissonance'], ['red', 'beating pair (height: its Plomp–Levelt roughness)'], ['green', 'coinciding pair (no beats; height: weaker amplitude)']]);
        v.readout(() => {
          const P = pairs(), co = P.filter((p) => p.b < 0.5).length, beating = P.filter((p) => p.b >= 0.5), slow = beating.length ? beating.reduce((a, b) => (b.w > a.w ? b : a)) : null, K = curve();
          return `seventh ${v.fix(sev.value, 1)} ¢ = ${sc(v, sev.value - 1000, 1)} ¢ from 12-TET, ${sc(v, sev.value - cents(7 / 4), 1)} ¢ from 7/4 · ${co} coinciding pair${co === 1 ? '' : 's'}, ${beating.length} beating${slow ? `, strongest ${slow.lab} at ${v.fix(slow.b, 1)} Hz` : ''} · dissonance ${v.fix((D(sev.value) - K.lo) / (K.hi - K.lo), 3)} on the min–max scale (12-TET seventh: ${v.fix((D(1000) - K.lo) / (K.hi - K.lo), 3)}, 7/4: ${v.fix((D(cents(7 / 4)) - K.lo) / (K.hi - K.lo), 3)})`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Paper',
      name: 'Tentamen novae theoriae musicae',
      paper: { authors: 'Leonhard Euler', year: 1739, title: 'Tentamen novae theoriae musicae ex certissimis harmoniae principiis dilucide expositae',
               venue: 'St Petersburg: Academy of Sciences, 1739 (Eneström E33)', url: 'https://archive.org/details/bub_gb_aekmN1V98GcC' },
      introduces: ['music-6.8', 'music-9.12'],
      statement: String.raw`Euler's *Attempt at a new theory of music* (written 1731, printed 1739) grounds musical pleasure in the perception of order: a combination of tones pleases more the more easily the mind grasps the ratios of their vibration frequencies. To measure ease he defined the **degree of agreeableness** (*gradus suavitatis*) of a set of tones in lowest integer terms: take their least common multiple, the *exponent*, $n=\prod p_i^{e_i}$, and set
$$\Gamma(n)=1+\sum_i e_i\,(p_i-1).$$
He ranked intervals (octave 2, fifth 4, fourth 5, major sixth and major third 7, minor third and minor sixth 8, …), chords (the major triad $4{:}5{:}6$, exponent 60, has degree 9) and whole scales (*genera*), each given by an exponent of the form $2^m 3^a 5^b$. The 12-note chromatic scale is his *genus diatonico-chromaticum* with exponent $2^m\cdot3^3\cdot5^2$, which he drew as a lattice of fifths and major thirds, the diagram from which the Tonnetz descends.`,
      idea: String.raw`Before Euler, Pythagorean and Renaissance theory (Zarlino's *senario*) explained consonance by small numbers without a measure. Euler gave one, built on number theory: multiplying by a prime $p$ makes a ratio harder to grasp in proportion to $p-1$, so 2 costs 1, 3 costs 2, 5 costs 4; and a chord is judged by the period of the whole combination, the lcm. The theory predicts the traditional order of consonances, excludes 7 by fiat, and treats a chord as a set of ratios rather than a sound, so it cannot see timbre or register; Helmholtz's beating partials (6.13) replaced it as the physical explanation, while its lattice survived in Riemann's and neo-Riemannian Tonnetz theory (9.12) and in Tenney's harmonic distance (6.8).`,
      caption: String.raw`Left: Euler's lattice of the genus diatonico-chromaticum, the twelve tones $3^a5^b$ (times powers of 2) with fifths running down to the left and major thirds down to the right, F at the top, as in his diagram. Click tones to build a chord (the first one clicked is the bass). Middle: the gradus worked out step by step for your chord, or for any ratios you type (e.g. 4:5:6:7). Bottom: Euler's ranking of the intervals of the octave by gradus, with the intervals of your chord highlighted, beside the summed Plomp–Levelt roughness of harmonic tones at each interval (6.4) for comparison.`,
      deps: ['music-6.1', 'music-7.5'],
      see: ['music-6.8', 'music-9.12'],
      refs: [],
      tags: ['history', 'consonance', 'ratios'],
      credit: 'Leonhard Euler, 1739',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tentamen_novae_theoriae_musicae' },
      viz(v) {
        const M = v.M;
        const NAMES = ['F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
        const nodes = []; for (let b = 0; b < 3; b++) for (let a = 0; a < 4; a++) nodes.push({ a, b, name: NAMES[a + 4 * b], x: b - a, y: -(a + b) * 0.8 });
        let sel = [1, 5, 2], typed = null; // C, E, G
        const inp = v.input('or type ratios', '4:5:6', { width: 140, placeholder: 'e.g. 4:5:6:7', onChange: (t) => { const t2 = String(t).split(/[:\s,]+/).map(Number).filter((x) => Number.isInteger(x) && x > 0 && x < 100000); typed = t2.length >= 2 ? t2 : null; if (typed) sel = []; v.invalidate(); } });
        const lat = v.stage({ x: [-3.7, 2.7], y: [-4.8, 0.6], equal: true, height: 320, axes: false, weight: 1, minWidth: 260, title: 'Euler’s lattice (1739): click tones' });
        const wk = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: false, weight: 1.1, minWidth: 280, title: 'the gradus worked out' });
        lat.onClick((x, y) => { let best = -1, bd = 0.45; nodes.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = i; } }); if (best < 0) return; typed = null; const k = sel.indexOf(best); if (k >= 0) sel.splice(k, 1); else if (sel.length < 6) sel.push(best); const t = terms(); inp.set(t ? t.join(':') : ''); });
        // chord from lattice: first note = bass at 1, others voiced in [1, 2) above it; exact exponents of 2, 3, 5
        const fromLattice = () => {
          if (!sel.length) return null;
          const n0 = nodes[sel[0]];
          const ex = sel.map((i) => { const n = nodes[i], a = n.a - n0.a, b = n.b - n0.b, l = a * Math.log2(3) + b * Math.log2(5); return [-Math.floor(l + 1e-9), a, b]; });
          const mn = [0, 1, 2].map((k) => Math.min(...ex.map((e) => e[k])));
          const terms = ex.map((e) => 2 ** (e[0] - mn[0]) * 3 ** (e[1] - mn[1]) * 5 ** (e[2] - mn[2]));
          return terms;
        };
        const terms = () => { const t = typed || fromLattice(); if (!t) return null; const g = t.reduce((a, b) => gcd(a, b)); return t.map((x) => x / g); };
        const INT = JUST.filter(([p, q]) => p !== q && p * q < 2000);
        const rough = (() => { const C = dissCurve(harmonic(6, 0.88), 261.63, 0, 1210, 605); let mx = 0; for (const x of C.d) mx = Math.max(mx, x); return (c) => sample(C, c) / mx; })();
        const rk = v.stage({ x: [0, 1], y: [0, INT.length + 0.9], height: 350, axes: false, full: true, title: 'Euler’s ranking of the intervals, beside today’s roughness model' });
        v.soundButton('play the chord', (snd) => { const t = terms(); if (!t) return; const sorted = t.slice().sort((a, b) => a - b), base = 196 / sorted[0] * (sorted[sorted.length - 1] / sorted[0] > 4 ? 0.5 : 1); snd.samples(mixBuf(sorted.map((x) => [harmonic(6, 0.88), base * x]), 2), SR, { gain: 0.9 }); });
        v.button('clear', () => { sel = []; typed = null; inp.set(''); });
        v.render(() => {
          // lattice
          for (const n of nodes) { const r = nodes.find((m) => m.a === n.a + 1 && m.b === n.b), d = nodes.find((m) => m.a === n.a && m.b === n.b + 1); if (r) lat.line(n.x, n.y, r.x, r.y, { color: 'orange', width: 1.6 }); if (d) lat.line(n.x, n.y, d.x, d.y, { color: 'teal', width: 1.6 }); }
          lat.text('fifths ×3', -2.95, -0.55, { color: 'orange', size: 11, align: 'center' });
          lat.text('thirds ×5', 1.95, -0.55, { color: 'teal', size: 11, align: 'center' });
          nodes.forEach((n, i) => { const k = sel.indexOf(i), on = k >= 0; lat.circle(n.x, n.y, 0.3, { fill: on ? (k === 0 ? 'gold' : 'accent') : 'panel', fillAlpha: on ? 0.4 : 1, color: on ? (k === 0 ? 'gold' : 'accent') : 'muted', width: on ? 2.5 : 1.2 }); lat.text(n.name, n.x, n.y + 0.05, { color: 'ink', size: 13, align: 'center', baseline: 'middle', weight: 700 }); lat.text(String(3 ** n.a * 5 ** n.b), n.x, n.y - 0.47, { color: 'muted', size: 9.5, align: 'center' }); });
          // worked computation
          const t = terms();
          if (!t) { wk.text('click tones or type ratios', 0.5, 0.5, { color: 'muted', size: 13, align: 'center' }); }
          else {
            const L = t.reduce((a, b) => lcm(a, b), 1), F = factor(L), G = gradusN(L);
            const lines = [
              [`terms in lowest form: ${t.join(' : ')}`, 'ink'],
              [`exponent (lcm): ${L}`, 'ink'],
              [`= ${F.map(([p, e]) => (e > 1 ? `${p}${String(e).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]).join('')}` : `${p}`)).join(' · ') || '1'}`, 'muted'],
              [`Γ = 1 + ${F.map(([p, e]) => `${e}·(${p}−1)`).join(' + ') || '0'}`, 'muted'],
              [`Γ = ${G}`, 'green'],
            ];
            lines.forEach(([s, c], k) => wk.text(s, 0.04, 0.88 - k * 0.12, { color: c, size: k === 4 ? 18 : 13.5, align: 'left', weight: k === 4 ? 700 : 400 }));
            const ints = []; for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const p = Math.max(t[i], t[j]), q = Math.min(t[i], t[j]), g = gcd(p, q); ints.push(`${p / g}:${q / g} (Γ ${gradus([p / g, q / g])})`); }
            wk.text(`its intervals: ${ints.slice(0, 6).join(', ')}`, 0.04, 0.2, { color: 'muted', size: 11.5, align: 'left' });
            if (ints.length > 6) wk.text(`… and ${ints.length - 6} more`, 0.04, 0.12, { color: 'muted', size: 11.5, align: 'left' });
          }
          // ranking
          const inChord = new Set(); if (t) for (let i = 0; i < t.length; i++) for (let j = 0; j < t.length; j++) if (t[i] > t[j]) { let p = t[i], q = t[j]; while (p / q > 2) q *= 2; const g = gcd(p, q); inChord.add(`${p / g}/${q / g}`); }
          const R = INT.map(([p, q, nm]) => ({ p, q, nm, g: gradus([p, q]), r: rough(cents(p / q)) })).sort((a, b) => a.g - b.g || a.p * a.q - b.p * b.q);
          const gmax = Math.max(...R.map((r) => r.g));
          R.forEach((r, k) => {
            const y = INT.length - k - 0.5, on = inChord.has(`${r.p}/${r.q}`);
            rk.text(`${r.p}/${r.q} ${r.nm}`, 0.25, y, { color: on ? 'gold' : 'ink', size: 11.5, align: 'right', baseline: 'middle', weight: on ? 700 : 400 });
            rk.rect(0.27, y - 0.32, 0.27 + (0.33 * r.g) / gmax, y + 0.32, { fill: on ? 'gold' : 'accent', fillAlpha: on ? 0.8 : 0.45, stroke: false });
            rk.text(`Γ ${r.g}`, 0.28 + (0.33 * r.g) / gmax, y, { color: 'ink', size: 10.5, align: 'left', baseline: 'middle', dx: 4 });
            rk.rect(0.68, y - 0.32, 0.68 + 0.3 * r.r, y + 0.32, { fill: 'red', fillAlpha: on ? 0.75 : 0.35, stroke: false });
          });
          rk.text('Euler’s gradus (1739)', 0.27, INT.length + 0.45, { color: 'accent', size: 11.5, align: 'left', baseline: 'middle', weight: 600 });
          rk.text('summed roughness of harmonic tones (6.4)', 0.68, INT.length + 0.45, { color: 'red', size: 11.5, align: 'left', baseline: 'middle', weight: 600 });
        });
        v.readout(() => {
          const t = terms(); if (!t) return 'no chord selected';
          const L = t.reduce((a, b) => lcm(a, b), 1);
          const R = INT.map(([p, q]) => [gradus([p, q]), rough(cents(p / q))]);
          const rkf = (a) => { const o = a.map((x, i) => [x, i]).sort((u, w) => u[0] - w[0]), r = []; o.forEach(([, i], k) => (r[i] = k)); return r; };
          const ra = rkf(R.map((x) => x[0])), rb = rkf(R.map((x) => x[1])), n = R.length; let s6 = 0; for (let i = 0; i < n; i++) s6 += (ra[i] - rb[i]) ** 2;
          return `chord ${t.join(':')} · exponent ${L} · Euler's gradus Γ = ${gradusN(L)} (by his formula: octave 2, fifth 4, fourth 5, major triad 4:5:6 → 9) · rank agreement of Euler's gradus with today's roughness model over the ${n} intervals listed: Spearman ρ ≈ ${v.fix(1 - (6 * s6) / (n * (n * n - 1)), 2)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13',
      kind: 'Paper',
      name: 'On the Sensations of Tone',
      paper: { authors: 'Hermann Helmholtz', year: 1863, title: 'Die Lehre von den Tonempfindungen als physiologische Grundlage für die Theorie der Musik',
               venue: 'Braunschweig: F. Vieweg und Sohn, 1863 (English translation by A. J. Ellis, On the Sensations of Tone, 1875)', url: 'https://archive.org/details/b2811677x' },
      introduces: ['music-6.2', 'music-2.10', 'music-5.2'],
      statement: String.raw`Helmholtz's book founded physiological acoustics and gave the first physical theory of consonance. The ear analyses sound into partials by sympathetic resonance of elements tuned along the cochlea (the place theory, 5.2), and two partials that excite overlapping resonators beat. Slow beats are heard as such, rapid ones as **roughness**, worst at about 33 beats per second in the middle register (Ch. VIII and X). **Dissonance is the roughness of beating partials; consonance is its absence**, which for harmonic tones occurs at simple ratios. In Ch. X and Appendix XV he computed the roughness of every interval between $c'$ (taken as 264 Hz) and $c''$ for violin-like tones, the amplitude of the $m$-th partial being $1/m$, assuming that each pair of partials contributes in proportion to the product of their amplitudes, to the response of ear resonators damped so that it falls to a tenth of its intensity a semitone off tune, and to a factor in the beat rate $b$ that vanishes at $b=0$ and $b=\infty$ and peaks at about 30 beats per second, $4(b/30)^2/(1+(b/30)^2)^2$. The resulting Fig. 60 A has its deepest valleys at the octave and fifth, then the fourth, major sixth and major third, with only shallow "cols" at the minor third and minor sixth.`,
      idea: String.raw`Before Helmholtz, consonance was explained by number (Pythagoras, Euler, 6.12) or by the coincidence of vibrations (Galileo's "regular pulses on the eardrum"). Helmholtz combined Ohm's acoustic law (5.3), his own resonance theory of the cochlea and careful listening with resonators and the double siren, and made consonance a computable property of the spectrum: the ranking of intervals follows from where the partials of two tones fall. He also explained why the same interval is rougher low in the scale and why mistuned consonances beat. His fixed 30–33 beats-per-second optimum was later replaced by a fraction of the critical band (Plomp and Levelt, 6.14), and the book's account of the bowed string (2.10) introduced Helmholtz motion.`,
      caption: String.raw`Helmholtz's Fig. 60 A recomputed from his own formula (Appendix XV): the roughness of $c'$ (264 Hz) sounded with every pitch up to $c''$, the contributions of the separate pairs of partials stacked on top of each other as in his drawing, coloured by the interval at which the pair coincides and labelled upper partial : lower partial as he labels them. Drag the gold marker to choose the upper note and hear the pair; change the number of partials; switch to pure tones and every valley disappears: the roughness simply decays as the tones separate, with nothing special at any ratio. The dashed line is today's roughness model (Plomp–Levelt via Sethares) for the same tones, rescaled.`,
      deps: ['music-5.6', 'music-5.3', 'music-2.6'],
      see: ['music-6.2', 'music-6.14', 'music-5.2'],
      refs: [],
      tags: ['history', 'consonance', 'helmholtz'],
      credit: 'Hermann von Helmholtz, 1863',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/On_the_Sensations_of_Tone' },
      viz(v) {
        const M = v.M, F1 = 264, N = 600;
        const kind = v.select('tones', [{ value: 'vio', label: 'violin (amplitude 1/m)' }, { value: 'pure', label: 'pure tones' }], 'vio', { onChange: () => { cache = null; syncVis(); } });
        const nS = v.slider('partials per tone', 2, 9, 9, { int: true, onChange: () => { cache = null; } });
        const syncVis = () => { nS.el.hidden = kind.value === 'pure'; };
        const modern = v.toggle('compare today’s model', true);
        const s = v.stage({ x: [0, 1200], y: [0, 1.12], height: 360, axes: 'box', gutter: true, full: true, xticks: [[0, "c'"], [cents(6 / 5), "e♭'"], [cents(5 / 4), "e'"], [cents(4 / 3), "f'"], [cents(3 / 2), "g'"], [cents(8 / 5), "a♭'"], [cents(5 / 3), "a'"], [cents(16 / 9), "b♭'"], [1200, "c''"]], yticks: [], xlabel: 'upper note (sliding continuously; lower note fixed at c′ = 264 Hz)', ylabel: 'roughness', title: 'Helmholtz’s Fig. 60 A, recomputed' });
        const mk = s.handle(cents(3 / 2), 1.06, { color: 'gold', r: 7, constrain: (x) => [M.clamp(x, 0, 1200), 1.06] });
        let cache = null;
        const FAM = { '1:1': 'accent', '1:2': 'green', '2:3': 'teal', '3:4': 'purple', '3:5': 'orange', '4:5': 'pink', '5:6': 'gold', '5:8': 'red', '4:7': 'blue' };
        const famOf = (m1, m2) => { const g = gcd(m1, m2), a = m2 / g, b = m1 / g; return `${Math.min(a, b)}:${Math.max(a, b)}`; };
        function compute() {
          if (cache) return cache;
          const n = kind.value === 'pure' ? 1 : nS.value, pairs = [];
          for (let m1 = 1; m1 <= n; m1++) for (let m2 = 1; m2 <= n; m2++) {
            const ys = new Float64Array(N + 1); let mx = 0;
            for (let i = 0; i <= N; i++) { const f2 = F1 * 2 ** ((1200 * i) / N / 1200); ys[i] = helmPair(m1 * F1, 1 / m1, m2 * f2, 1 / m2); if (ys[i] > mx) mx = ys[i]; }
            if (mx > 1e-4) pairs.push({ m1, m2, ys, mx, fam: famOf(m1, m2) });
          }
          pairs.sort((a, b) => Math.max(a.m1, a.m2) - Math.max(b.m1, b.m2) || a.m1 + a.m2 - (b.m1 + b.m2));
          const tot = new Float64Array(N + 1); for (const p of pairs) for (let i = 0; i <= N; i++) tot[i] += p.ys[i];
          let tmax = 0; for (const x of tot) tmax = Math.max(tmax, x);
          const SP = kind.value === 'pure' ? [[1, 1]] : Array.from({ length: n }, (_, k) => [k + 1, 1 / (k + 1)]);
          const C = dissCurve(SP, F1, 0, 1200, 300); let cm = 0; for (const x of C.d) cm = Math.max(cm, x);
          cache = { pairs, tot, tmax, C, cm, SP }; return cache;
        }
        const atC = (arr, c) => { const u = (c / 1200) * N, i = Math.min(N - 1, Math.floor(u)), t = u - i; return arr[i] * (1 - t) + arr[i + 1] * t; };
        mk.onDrag = () => v.invalidate();
        v.soundButton("play c' with the marked note", (snd) => { const K = compute(); snd.samples(mixBuf([[K.SP, F1], [K.SP, F1 * 2 ** (mk.x / 1200)]], 2), SR, { gain: 0.9 }); });
        v.render(() => {
          const K = compute(), sc1 = 1 / K.tmax, base = new Float64Array(N + 1);
          for (const p of K.pairs) {
            const top = new Float64Array(N + 1); for (let i = 0; i <= N; i++) top[i] = base[i] + p.ys[i];
            const P = [], Q = []; for (let i = 0; i <= N; i++) { const c = (1200 * i) / N; P.push([c, top[i] * sc1]); Q.push([c, base[i] * sc1]); }
            const col = FAM[p.fam] || 'muted';
            s.poly(P.concat(Q.reverse()), { fill: col, fillAlpha: 0.32, color: col, width: 0.8 });
            // label at this pair's peak if its band is thick enough there
            let ip = 0; for (let i = 0; i <= N; i++) if (p.ys[i] > p.ys[ip]) ip = i;
            const multiple = gcd(p.m1, p.m2) > 1 && (p.fam === '1:1' || p.fam === '1:2'); if (p.ys[ip] * sc1 > 0.045 && !multiple) s.text(`${p.m2}:${p.m1}`, (1200 * ip) / N, (base[ip] + p.ys[ip] / 2) * sc1, { color: 'ink', size: 9.5, align: 'center', baseline: 'middle' });
            for (let i = 0; i <= N; i++) base[i] = top[i];
          }
          s.path(Array.from(K.tot, (y, i) => [(1200 * i) / N, y * sc1]), { color: 'ink', width: 1.6 });
          if (modern.value) s.path(Array.from(K.C.c, (c, i) => [c, K.C.d[i] / K.cm]), { color: 'red', width: 1.6, dash: [6, 4] });
          s.vline(mk.x, { color: 'gold', width: 1.5, alpha: 0.8 });
        });
        v.legend([['ink', 'total roughness (Helmholtz’s formula)'], ['red', 'today: summed Plomp–Levelt (Sethares), rescaled', { dash: true }], ['gold', 'marked note']]);
        v.readout(() => {
          const K = compute(), R = [['octave', 2], ['fifth', 3 / 2], ['fourth', 4 / 3], ['major sixth', 5 / 3], ['major third', 5 / 4], ['minor third', 6 / 5], ['minor sixth', 8 / 5]].map(([nm, r]) => ({ nm, d: atC(K.tot, cents(r)) / K.tmax }));
          if (kind.value === 'pure') return `pure tones: roughness falls monotonically from its peak near ${v.fix(cents((F1 + 30) / F1), 0)} ¢ (30 beats/s) and has no valleys at consonant ratios · at the marked note ${v.fix(atC(K.tot, mk.x) / K.tmax, 3)}`;
          const order = R.slice().sort((a, b) => a.d - b.d).map((r) => `${r.nm} ${v.fix(r.d, 3)}`);
          const r = nearRatio(mk.x, 8, 15);
          return `marked ${v.fix(mk.x, 0)} ¢${r ? ` (${r.p}/${r.q})` : ''}, roughness ${v.fix(atC(K.tot, mk.x) / K.tmax, 3)} · valleys, smoothest first: ${order.join(', ')} · Helmholtz's order (p. 193): octave, fifth, fourth, major sixth, major third; minor third and minor sixth only "cols"`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.14
    {
      num: '6.14',
      kind: 'Paper',
      name: 'Tonal Consonance and Critical Bandwidth',
      paper: { authors: 'R. Plomp and W. J. M. Levelt', year: 1965, title: 'Tonal Consonance and Critical Bandwidth',
               venue: 'Journal of the Acoustical Society of America 38 (4): 548–560', doi: '10.1121/1.1909741' },
      introduces: ['music-6.3'],
      statement: String.raw`Plomp and Levelt asked young adult listeners without musical training to rate pairs of **pure tones** on a seven-point scale from dissonant (1) to consonant (7), at mean frequencies of 125, 250, 500, 1000 and 2000 Hz (tones from two sine oscillators through a loudspeaker at about 65 dB SPL, each pair heard for about 4 s; 8–11 consistent subjects per frequency after a test–retest screen). Plotted against the frequency difference the ratings showed no preference for simple ratios; they fell to a minimum and recovered, and the separation of the minimum grew with frequency in proportion to the **critical bandwidth**. Their rule of thumb: maximal dissonance at about **25% of a critical band**, full consonance from about **100%**. Expressing all the data in critical-band units they drew one standard curve (their Fig. 10) and, assuming the dissonances of all *adjacent* pairs of partials add, computed the dissonance of two complex tones of **six equal harmonics**: peaks of consonance appear at $1{:}1$, $5{:}6$, $4{:}5$, $3{:}4$, $2{:}3$, $3{:}5$, $1{:}2$, sharper for simpler ratios (Fig. 11), and every interval grows dissonant below a register that is lower for more consonant intervals (Fig. 12). A statistical analysis of a Bach trio sonata and a Dvořák quartet found the spacing of simultaneous tones following the critical band.`,
      idea: String.raw`Helmholtz had explained consonance by beats between partials but with a fixed optimum of 30–40 beats a second (6.13); Stumpf's tonal fusion and learned interval recognition were rival explanations. Plomp and Levelt separated the factors by using pure tones, which have no partials to coincide, and by choosing intervals by frequency difference rather than ratio so that listeners could not recognise them. The result kept Helmholtz's mechanism and replaced his constant by the critical band, newly measured by Zwicker and colleagues (5.4). Their summation over partials turned the curve into a predictive model of consonance for complex tones (6.4), which Kameoka and Kuriyagawa refined and Sethares parametrized (6.15). Today's narrower critical bands (ERB) would put the maximum nearer 40% of a band (Greenwood, 1991).`,
      caption: String.raw`The paper's figures redrawn with its own data (read from the published graphs). **Ratings** (Figs. 3–7): median consonance against frequency difference at each mean frequency (choose one), with the standard curve mapped onto the rating scale; click anywhere to hear that separation, or run your own listening test and see your ratings in gold. **One curve** (Fig. 10): all 68 medians re-plotted against $\Delta f$ in critical bands collapse onto the standard curve; flip the toggle to scale by a fixed 132 Hz instead (Helmholtz's constant beat optimum) and the collapse gets worse. **Complex tones** (Fig. 11): the paper's computed curve (dots) and the same computation redone here (line). **Register** (Fig. 12): six intervals against the pitch of the lower tone. In Figs. 11 and 12 dissonance increases downward, as in the paper; click to hear.`,
      deps: ['music-5.4', 'music-5.7', 'music-6.2'],
      see: ['music-6.3', 'music-6.9', 'music-6.4'],
      refs: [],
      tags: ['history', 'dissonance', 'critical band'],
      credit: 'Reinier Plomp & Willem J. M. Levelt, 1965',
      links: { doi: 'https://doi.org/10.1121/1.1909741' },
      viz(v) {
        const M = v.M, FMS = [125, 250, 500, 1000, 2000], FCOL = { 125: 'red', 250: 'orange', 500: 'green', 1000: 'teal', 2000: 'purple' };
        const mode = v.select('figure', [{ value: 'rate', label: 'ratings' }, { value: 'one', label: 'one curve' }, { value: 'f11', label: 'complex tones' }, { value: 'f12', label: 'register' }], 'one', { onChange: () => vis() });
        const fmS = v.select('mean frequency', FMS.map((f) => ({ value: f, label: `${f} Hz` })), 500, { onChange: () => v.invalidate() });
        const helm = v.toggle('scale by a fixed 132 Hz (Helmholtz)', false);
        const testB = v.button('play a test interval', () => { const P = PL_MEDIANS[fmS.value].pts; pending = { fm: fmS.value, df: P[Math.floor(Math.random() * P.length)][0] }; playDf(pending.fm, pending.df); });
        const rateS = v.select('your rating', ['—', '1', '2', '3', '4', '5', '6', '7'], '—', { onChange: (x) => { if (pending && x !== '—') { mine.push({ ...pending, r: +x }); pending = null; } rateS.value = '—'; v.invalidate(); } });
        let pending = null; const mine = [];
        function vis() { const r = mode.value === 'rate'; fmS.el.hidden = !r; testB.hidden = !r; rateS.el.hidden = !r; helm.el.hidden = mode.value !== 'one'; v.invalidate(); }
        const H6 = (f) => [1, 2, 3, 4, 5, 6].map((k) => k * f);
        const f1of = (fm, df) => (-df + Math.sqrt(df * df + 4 * fm * fm)) / 2;
        const playDf = (fm, df) => { const f1 = f1of(fm, df); v.sound().stop(); v.sound().tone([[f1, 1], [f1 + df, 1]], { duration: 2.2, gain: 0.3 }); };
        // least-squares map of the standard curve onto the rating scale: rating = a − b·d
        const ALL = []; for (const fm of FMS) for (const [df, r] of PL_MEDIANS[fm].pts) ALL.push({ fm, df, r });
        const fit = (xf) => { let sx = 0, sy = 0, sxx = 0, sxy = 0; const n = ALL.length; for (const p of ALL) { const d = plStd(xf(p)); sx += d; sy += p.r; sxx += d * d; sxy += d * p.r; } const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n; let ss = 0; for (const p of ALL) ss += (p.r - (a + b * plStd(xf(p)))) ** 2; return { a, b, rms: Math.sqrt(ss / n) }; };
        const xCB = (p) => p.df / cbw(p.fm), xH = (p) => p.df / 132;
        const FCB = fit(xCB), FH = fit(xH);
        const s = v.stage({ x: [3, 3000], y: [1, 7], xlog: true, height: 380, axes: 'box', gutter: true, full: true, title: '' });
        s.onClick((x) => {
          if (mode.value === 'rate') playDf(fmS.value, x);
          else if (mode.value === 'f11') { cur11 = M.clamp(x, 240, 515); v.sound().stop(); v.sound().tone(H6(250).concat(H6(cur11)).map((f) => [f, 1]), { duration: 2, gain: 0.3 }); }
          else if (mode.value === 'f12') { cur12 = M.clamp(x, 40, 1200); v.sound().stop(); v.sound().tone(H6(cur12).concat(H6(cur12 * 1.5)).map((f) => [f, 1]), { duration: 2, gain: 0.3 }); }
          else playDf(1000, M.clamp(x, 0, 2) * cbw(1000));
        });
        let cur11 = 375, cur12 = 250;
        const F12C = { '1:2': 'green', '2:3': 'teal', '3:5': 'orange', '5:6': 'red', '3:4': 'purple', '4:5': 'pink' };
        const FLEG = FMS.map((f) => [FCOL[f], `${f} Hz`]);
        v.render(() => {
          const md = mode.value;
          if (md === 'rate') v.legend([...FLEG, ['ink', 'standard curve on the rating scale', { dash: true }], ['gold', 'your ratings']]);
          else if (md === 'one') v.legend([...FLEG, ['ink', 'Fig. 10 standard curve'], ['accent', 'Sethares fit (at 1 kHz)', { dash: true }]]);
          else if (md === 'f11') v.legend([['accent', 'recomputed here'], ['ink', 'read from the paper’s Fig. 11', { dot: true }]]);
          else v.legend([...Object.entries(F12C).map(([k, c]) => [c, k]), ['muted', 'circles: read from the paper’s Fig. 12', { dot: true }]]);
          if (md === 'rate') {
            s.setScale({ xlog: true, x: [3, 3000], y: [1, 7.2] }); s.setTitle(`Figs. 3–7: ratings of pure-tone pairs (median of the subjects at each mean frequency)`);
            s.setLabels('frequency difference $\\Delta f$ (Hz)', 'consonance rating (1–7)'); s.setTicks(null, [1, 2, 3, 4, 5, 6, 7].map((y) => [y, String(y)]));
            const fm = fmS.value, cb = cbw(fm);
            s.vline(cb / 4, { color: 'red', dash: [4, 4], width: 1.2 }); s.text('¼ CB', cb / 4, 7.05, { color: 'red', size: 10.5, align: 'center' });
            s.vline(cb, { color: 'green', dash: [4, 4], width: 1.2 }); s.text('1 CB', cb, 7.05, { color: 'green', size: 10.5, align: 'center' });
            for (const f of FMS) if (f !== fm) s.path(PL_MEDIANS[f].pts, { color: FCOL[f], width: 1, alpha: 0.35 });
            const P = []; for (let i = 0; i <= 300; i++) { const df = 3 * 1000 ** (i / 300); P.push([df, FCB.a + FCB.b * plStd(df / cbw(fm))]); }
            s.path(P, { color: 'ink', width: 1.6, dash: [6, 4] });
            s.path(PL_MEDIANS[fm].pts, { color: FCOL[fm], width: 2.4 });
            for (const [df, r] of PL_MEDIANS[fm].pts) s.dot(df, r, { r: 4.5, color: FCOL[fm] });
            for (const p of mine) if (p.fm === fm) s.dot(p.df * (1 + 0.03 * ((p.r * 7) % 3 - 1)), p.r, { r: 5, color: 'gold' });
            s.corner(`${fm} Hz: ${PL_MEDIANS[fm].n} subjects`, 'br', { color: FCOL[fm], weight: 600, plate: true });
          } else if (md === 'one') {
            const Fx = helm.value ? FH : FCB, xf = helm.value ? xH : xCB;
            s.setScale({ xlog: false, x: [0, 1.6], y: [-0.15, 1.15] }); s.setTitle(helm.value ? 'the medians scaled by a fixed 132 Hz (so that 33 Hz sits at ¼)' : 'Fig. 10: all the medians against Δf in critical bands, with the standard curve');
            s.setLabels(helm.value ? '$\\Delta f$ / 132 Hz' : '$\\Delta f$ / critical bandwidth', 'dissonance (from the ratings)'); s.setTicks([[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, '1'], [1.25, '1¼'], [1.5, '1½']], [[0, '0'], [0.5, '0.5'], [1, '1']]);
            s.path(PL_FIG10.map(([x, d]) => [x, d]).concat([[1.6, 0]]), { color: 'ink', width: 2.2 });
            const P = []; for (let i = 0; i <= 200; i++) { const x = (1.6 * i) / 200; P.push([x, pl(1000, 1000 + x * cbw(1000))]); }
            s.path(P, { color: 'accent', width: 1.4, dash: [6, 4] });
            for (const p of ALL) { const x = xf(p); if (x <= 1.6) s.dot(x, (p.r - Fx.a) / Fx.b, { r: 4, color: FCOL[p.fm] }); }
            s.corner(`rms misfit ${v.fix(Fx.rms, 2)} rating points (critical band: ${v.fix(FCB.rms, 2)}, fixed 132 Hz: ${v.fix(FH.rms, 2)})`, 'tr', { color: 'ink', weight: 600, plate: true });
          } else if (md === 'f11') {
            s.setScale({ xlog: false, x: [240, 515], y: [-0.75, 6.2] }); s.setTitle('Fig. 11: two complex tones of 6 harmonics, the lower at 250 Hz');
            s.setLabels('frequency of the upper tone (Hz)', 'dissonance ↓'); s.setTicks([250, 300, 350, 400, 450, 500].map((x) => [x, String(x)]), [0, 1, 2, 3, 4, 5, 6].map((k) => [6 - k, String(k)]));
            for (let k = -1; k <= 13; k++) { const f = 250 * 2 ** (k / 12); if (f > 240 && f < 515) s.vline(f, { color: 'grid', width: 1 }); }
            const P = []; for (let i = 0; i <= 600; i++) { const f = 242 + (273 * i) / 600; P.push([f, 6 - plComplex(H6(250).concat(H6(f)))]); }
            s.path(P, { color: 'accent', width: 2.2 });
            for (const [f, d] of PL_FIG11) s.dot(f, 6 - d, { r: 2.6, color: 'ink' });
            s.vline(cur11, { color: 'gold', width: 1.5 });
            for (const [p, q] of [[1, 1], [6, 5], [5, 4], [4, 3], [3, 2], [5, 3], [2, 1]]) { const f = (250 * p) / q; s.text(`${q}:${p}`, f, 6 - plComplex(H6(250).concat(H6(f))), { color: 'accent', size: 10.5, align: 'center', dy: -9, plate: true }); }
          } else {
            s.setScale({ xlog: true, x: [40, 1200], y: [-0.2, 4.2] }); s.setTitle('Fig. 12: six intervals of 6-harmonic tones against the pitch of the lower tone');
            s.setLabels('frequency of the lower tone (Hz)', 'dissonance ↓'); s.setTicks([[50, '50'], [100, '100'], [200, '200'], [500, '500'], [1000, '1000']], [0, 1, 2, 3, 4].map((k) => [4 - k, String(k)]));
            for (const [key, pts] of Object.entries(PL_FIG12)) {
              const [p, q] = key.split(':').map(Number), col = F12C[key], P = [];
              for (let i = 0; i <= 200; i++) { const f = 40 * 30 ** (i / 200); P.push([f, 4 - Math.min(4.2, plComplex(H6(f).concat(H6((f * q) / p))))]); }
              s.path(P, { color: col, width: 2 });
              for (const [f, d] of pts) s.dot(f, 4 - d, { r: 3.5, color: col, hollow: true });
              s.text(key, 1150, 4 - plComplex(H6(1150).concat(H6((1150 * q) / p))), { color: col, size: 10.5, align: 'right', dx: -2, dy: key === '3:5' || key === '4:5' ? 10 : -6 });
            }
            s.vline(cur12, { color: 'gold', width: 1.5 });
          }
        });
        vis();
        v.readout(() => {
          const md = mode.value;
          if (md === 'rate') { const fm = fmS.value, P = PL_MEDIANS[fm].pts, lo = P.reduce((a, b) => (b[1] < a[1] ? b : a)); return `${fm} Hz: lowest median ${v.fix(lo[1], 2)} at $\\Delta f = ${v.fix(lo[0], 1)}$ Hz = ${v.fix(lo[0] / cbw(fm), 2)} CB (critical band ${v.fix(cbw(fm), 0)} Hz) · your ratings so far: ${mine.length}${pending ? ' · a test interval is waiting for your rating' : ''}`; }
          if (md === 'one') return `standard curve fitted to all 68 medians: rating ≈ ${v.fix(FCB.a, 2)} − ${v.fix(-FCB.b, 2)}·d · misfit with critical-band scaling ${v.fix(FCB.rms, 2)} vs fixed-Hz scaling ${v.fix(FH.rms, 2)} rating points · paper: maximal dissonance at about 25% of a critical band, consonance from 100%; with today's narrower bands, about 40% (Greenwood, 1991)`;
          if (md === 'f11') { let ss = 0; for (const [f, d] of PL_FIG11) ss += (plComplex(H6(250).concat(H6(f))) - d) ** 2; return `upper tone ${v.fix(cur11, 1)} Hz: recomputed dissonance ${v.fix(plComplex(H6(250).concat(H6(cur11))), 2)} · agreement with the paper's Fig. 11 over ${PL_FIG11.length} read-off points: rms ${v.fix(Math.sqrt(ss / PL_FIG11.length), 2)} (scale 0–6) · computation: Fig. 10 curve, critical band at the mean frequency, adjacent partials only, equal amplitudes`; }
          return `lower tone ${v.fix(cur12, 0)} Hz (fifth): recomputed dissonance ${v.fix(plComplex(H6(cur12).concat(H6(cur12 * 1.5))), 2)} · the paper: "below a critical frequency, the intervals become more and more dissonant … the critical frequency is lower for more consonant intervals" · open circles: values read from the paper's Fig. 12; the recomputation runs a little rougher than the paper's below about 150 Hz, where the critical-band curve they used is uncertain`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.15
    {
      num: '6.15',
      kind: 'Paper',
      name: 'Local Consonance, Timbre and Scale',
      paper: { authors: 'William A. Sethares', year: 1993, title: 'Local consonance and the relationship between timbre and scale',
               venue: 'Journal of the Acoustical Society of America 94 (3): 1218–1228', doi: '10.1121/1.408175' },
      introduces: ['music-6.4', 'music-6.5'],
      statement: String.raw`Sethares gave the Plomp–Levelt curve an explicit form as a difference of exponentials (6.3), defined the **dissonance curve** of any spectrum by summing it over all pairs of partials of the tone and a transposed copy (6.4), and stated the **principle of local consonance**: a timbre and a scale are related when the curve's local minima fall on the scale's intervals (6.5). He proved general properties: (1) the unison is the global minimum; (2) for large intervals the dissonance tends to no more than the timbre's intrinsic dissonance; (3) a spectrum of $n$ partials has at most $2n(n-1)$ local minima, placed symmetrically on a log scale about the unison; (4) up to half of them lie exactly at ratios $f_i/f_j$ of the timbre's own partials, the others being shallow minima between widely spaced partials. He then went both ways: from timbre to scale (the free bar of a xylophone, stretched and compressed spectra, FM spectra with non-integer ratios) and from scale to timbre, by optimizing partial positions with a genetic algorithm or by choosing spectra "induced" by an equal temperament, such as spectra for 10-tone equal temperament (6.6).`,
      idea: String.raw`Plomp and Levelt (6.14) had computed curves only for harmonic tones and used them to explain the familiar consonances; Pierce (1966) had built a timbre for an 8-tone scale, and Mathews and Pierce had explored stretched partials. Sethares turned the calculation into a general tool for any spectrum and any scale, at the moment when synthesizers made arbitrary spectra playable. It changed the question "which intervals are consonant?" into "consonant for which sound?", and it underlies later work on adaptive tuning (7.16) and the book *Tuning, Timbre, Spectrum, Scale* (1998).`,
      caption: String.raw`Figures from the paper's examples, recomputed. **Two partials**: a tone of two equal partials whose ratio you set; very close partials give no local minimum, a moderate ratio gives one exactly at that ratio, a wide one gives a steep minimum at the ratio and a second, shallow one (property 4). **Free bar** (two octaves), **stretched** ($A=2.1$) and **10-TET** spectra show minima moving to the timbre's own ratios. Left: the spectrum; right: the curve, minima in green, and the timbre's partial ratios $f_i/f_j$ as orange marks on the axis. Click the curve to hear an interval with this timbre.`,
      deps: ['music-6.3', 'music-4.1'],
      see: ['music-6.4', 'music-6.5', 'music-6.6', 'music-6.7'],
      refs: [],
      tags: ['history', 'dissonance', 'timbre'],
      credit: 'William A. Sethares, 1993',
      links: { doi: 'https://doi.org/10.1121/1.408175' },
      viz(v) {
        const M = v.M;
        const fig = v.select('example', [{ value: 'two', label: 'two partials' }, { value: 'beam', label: 'free bar' }, { value: 'str', label: 'stretched' }, { value: 'tet', label: '10-TET timbre' }], 'two', { onChange: () => { cache = null; vis(); } });
        const rS = v.slider('ratio of the two partials', 1.01, 2.2, 1.86, { step: 0.01, onChange: () => { cache = null; } });
        function vis() { rS.el.hidden = fig.value !== 'two'; v.invalidate(); }
        const def = () => {
          const b = 2 ** 0.1;
          if (fig.value === 'two') return { spec: [[1, 1], [rS.value, 1]], f0: 500, cmax: 1300 };
          if (fig.value === 'beam') return { spec: BEAM.map((r, i) => [r, 0.88 ** i]), f0: 261.63, cmax: 2450 };
          if (fig.value === 'str') return { spec: stretched(7, 2.1), f0: 261.63, cmax: 1350 };
          return { spec: TET10.map((m, i) => [b ** m, 0.88 ** i]), f0: 261.63, cmax: 1250 };
        };
        let cache = null, cur = null;
        const curve = () => { if (cache) return cache; const D = def(), C = dissCurve(D.spec, D.f0, 0, D.cmax, 650); let mx = 0, mn = Infinity; for (const x of C.d) { mx = Math.max(mx, x); mn = Math.min(mn, x); } cache = { ...D, C, mx, mn, mins: minima(C, fig.value === 'two' ? 0.01 : 0.004) }; return cache; };
        const sp = v.stage({ x: [0.9, 30], y: [0, 1.15], xlog: true, height: 300, axes: 'box', gutter: true, weight: 0.6, minWidth: 220, yticks: [], xticks: [[1, '1'], [2, '2'], [5, '5'], [10, '10'], [20, '20']], xlabel: 'partial ÷ fundamental', title: 'spectrum' });
        const cv = v.stage({ x: [0, 1300], y: [-0.09, 1.12], height: 300, axes: 'box', gutter: true, weight: 1.4, yticks: [[0, '0'], [1, '1']], xlabel: 'interval (cents)', ylabel: 'dissonance', title: 'dissonance curve' });
        cv.onClick((x) => { const K = curve(); cur = M.clamp(x, 0, K.cmax); v.sound().stop(); v.sound().samples(mixBuf([[K.spec, K.f0], [K.spec, K.f0 * 2 ** (cur / 1200)]], 1.6), SR, { gain: 0.9 }); v.invalidate(); });
        const ratios = (spec, cmax) => { const out = []; for (const [a] of spec) for (const [b] of spec) if (b > a * 1.0001) { const c = cents(b / a); if (c <= cmax) out.push(c); } return out; };
        v.render(() => {
          const K = curve(), nrm = (d) => (d - K.mn) / (K.mx - K.mn);
          sp.setView([0.9, Math.max(3, 1.3 * Math.max(...K.spec.map((p) => p[0])))], [0, 1.15]);
          for (const [r, a] of K.spec) { sp.line(r, 0, r, a, { color: 'accent', width: 3 }); sp.dot(r, a, { r: 4, color: 'accent' }); sp.text(ratioStr(r), r, a, { color: 'accent', size: 10, align: 'center', dy: -10 }); }
          cv.setView([0, K.cmax], [-0.09, 1.12]);
          cv.setTicks(Array.from({ length: Math.floor(K.cmax / 200) + 1 }, (_, k) => [200 * k, String(200 * k)]), undefined);
          const R = ratios(K.spec, K.cmax);
          for (const c of R) cv.poly([[c, -0.015], [c - K.cmax * 0.007, -0.085], [c + K.cmax * 0.007, -0.085]], { fill: 'orange', fillAlpha: 0.85, color: 'orange' });
          cv.path(Array.from(K.C.c, (c, i) => [c, nrm(K.C.d[i])]), { color: 'accent', width: 2.4 });
          for (const m of K.mins) { const onR = R.some((c) => Math.abs(c - m.c) < 10); cv.dot(m.c, nrm(m.d), { r: onR ? 5 : 4, color: 'green', hollow: !onR }); }
          if (cur != null) cv.vline(cur, { color: 'gold', width: 1.6 });
        });
        v.legend([['accent', 'dissonance curve'], ['green', 'minima (filled: at a ratio $f_i/f_j$; hollow: shallow type)'], ['orange', 'ratios of the timbre’s own partials']]);
        vis();
        v.readout(() => {
          const K = curve(), R = ratios(K.spec, K.cmax), on = K.mins.filter((m) => R.some((c) => Math.abs(c - m.c) < 10)).length, n = K.spec.length;
          return `${n} partials · ${K.mins.length} local minima above the unison in this range (property 3 allows at most ${n * (n - 1)} above it, ${2 * n * (n - 1)} in all) · ${on} of them within 10 ¢ of a ratio $f_i/f_j$ of the timbre (property 4) · minima at ${K.mins.map((m) => v.fix(m.c, 0)).join(', ') || 'none'} ¢${cur != null ? ` · clicked ${v.fix(cur, 0)} ¢` : ''}`;
        });
      },
    },
  ],
};
