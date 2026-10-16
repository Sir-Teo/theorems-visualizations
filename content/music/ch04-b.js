// Music Theory & Acoustics — Chapter 4 (part b): formants, vowels, pitch, synthesis, timbre space, vibrato (items 4.9–4.16)
import { TAU, SR, noteOf, dB, playhead, finish, toRms, join, noiseGen, periodicLoop, partials, loopVoice, resonance, besselJ, stft, drawSpec, specRamp, centroidOf, INST, sharc, cloud } from './ch04.shared.js';

const SHORT = { flute: 'flute', oboe: 'oboe', clarinet: 'clarinet', bassoon: 'bassoon', horn: 'horn', trumpet: 'trumpet', trombone: 'trombone', violin: 'violin', cello: 'cello', pizz: 'pizzicato' };

/** Peterson & Barney (1952) average F1, F2 (Hz) of American English vowels: men and women. */
const PB = [
  ['i', 'heed', [270, 2290], [310, 2790]], ['ɪ', 'hid', [390, 1990], [430, 2480]], ['ɛ', 'head', [530, 1840], [610, 2330]], ['æ', 'had', [660, 1720], [860, 2050]],
  ['ɑ', 'hod', [730, 1090], [850, 1220]], ['ɔ', 'hawed', [570, 840], [590, 920]], ['ʊ', 'hood', [440, 1020], [470, 1160]], ['u', 'who’d', [300, 870], [370, 950]], ['ʌ', 'hud', [640, 1190], [760, 1400]],
];

/** Largest local maximum of r on (a, b), refined by a parabola: returns its abscissa. */
function peakIn(r, a, b, n = 600) {
  let best = -Infinity, at = a; const h = (b - a) / n;
  for (let i = 1; i < n; i++) { const x = a + i * h, y = r(x); if (y > best && y >= r(x - h) && y >= r(x + h)) { best = y; at = x; } }
  const y0 = r(at - h), y1 = r(at), y2 = r(at + h), d = (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2 || 1);
  return at + Math.max(-1, Math.min(1, d)) * h;
}

export default {
  collection: 'music',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Formants and the spectral envelope',
      statement: String.raw`The **spectral envelope** of a sound is the smooth curve that its harmonic levels follow when plotted against frequency, and a **formant** is a peak of that envelope: a band of frequencies emphasised whatever note is played. Formants arise when a source with a broad harmonic spectrum drives a resonant body or air cavity whose gain $|H(f)|$ is fixed in hertz:
$$A_n^{\rm out}=A_n^{\rm source}\,\big|H(nf_0)\big| .$$
Change the pitch and the harmonics slide along the same envelope: what stays constant is the envelope, not the recipe of harmonic levels. Several orchestral instruments behave this way. Measured over their whole range, the bassoon, horn and trombone have harmonic levels that line up against frequency, with broad formant regions in the few hundred hertz. The clarinet's spectrum is organised by harmonic number instead (odd against even, 3.3).`,
      idea: String.raw`A fixed linear filter multiplies each frequency component by its own gain, the convolution theorem in action (sig-5.6). So the output's harmonic levels are samples, at the points $nf_0$, of one fixed curve. A low note samples the curve densely, a high note sparsely, but the samples always fall on the same curve. When the resonance belongs to the instrument (a bell, a bore, a body) its frequency is set by size, not by the note, and the formant stays put. Speeding up a recording transposes it by scaling every frequency, envelope included. The formants then move with the pitch, and the result sounds like a smaller instrument or a chipmunk voice, not the same instrument playing higher. Vowels are formants of the vocal tract (4.10).`,
      caption: String.raw`Every dot is one harmonic of one note in the McGill recordings (SHARC data, all notes of the instrument, levels relative to each note's total). Colour runs from the lowest note (blue) to the highest (orange). Switch the horizontal axis between **frequency** and **harmonic number**: for the bassoon, horn and trombone the cloud tightens against frequency (a fixed formant), for the clarinet it tightens against harmonic number. The readout gives the scatter both ways. Drag the gold handles to fit a two-peak envelope to the cloud, or press *Fit*. Below, a synthetic note at the chosen pitch: in *keep the envelope* mode its harmonics follow your envelope; in *keep the recipe* mode they keep the levels the lowest note had, so the envelope slides along with the pitch. *Play a scale* in both modes and compare.`,
      deps: ['music-4.5'],
      see: ['ling-1.1', 'ling-1.7', 'music-3.5', 'music-11.5', 'sig-5.6'],
      refs: ['Loy I ch. 6', 'Benson ch. 2'],
      tags: ['formants', 'timbre'],
      credit: 'Fixed formants in wind instruments: Luce & Clark, 1967; data: G. J. Sandell, SHARC (McGill University Master Samples)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Formant' },
      viz(v) {
        const M = v.M, INS = ['bassoon', 'horn', 'trombone', 'oboe', 'clarinet'];
        const insS = v.select('instrument', INS.map((k) => ({ value: k, label: SHORT[k] })), 'bassoon', { onChange: () => { fit(); sync(); } });
        const axS = v.select('horizontal axis', [{ value: 'f', label: 'frequency (Hz)' }, { value: 'n', label: 'harmonic number' }], 'f');
        const mode = v.select('when the pitch changes', [{ value: 'env', label: 'keep the envelope' }, { value: 'rec', label: 'keep the recipe' }], 'env', { onChange: () => sync() });
        const pS = v.slider('pitch of the synthetic note', 55, 700, 110, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})`, onChange: () => sync() });
        // envelope model in dB: two peaks (Gaussian in log frequency, width 0.55 oct) on a straight tilt in log frequency, plus a free offset
        const P = { F1: 480, A1: 14, F2: 1300, A2: 4, tilt: -14 };
        const bump = (f, F) => Math.exp(-(Math.log2(f / F) ** 2) / (2 * 0.55 * 0.55));
        const shape = (f, p = P) => p.A1 * bump(f, p.F1) + p.A2 * bump(f, p.F2) + p.tilt * Math.log2(f / 1000);
        let key = '', C = null;
        const data = () => {
          if (key === insS.value) return C; key = insS.value;
          const notes = cloud(insS.value), pts = [];
          const k0 = Math.min(...notes.map((n) => n.key)), k1 = Math.max(...notes.map((n) => n.key));
          for (const nt of notes) {
            const tot = 10 * Math.log10(nt.db.reduce((s, d) => s + 10 ** (d / 10), 0));
            nt.db.forEach((d, i) => { if (d > -79) pts.push({ n: i + 1, f: (i + 1) * nt.f, y: d - tot, u: (nt.key - k0) / Math.max(1, k1 - k0) }); });
          }
          // scatter about the binned trend (1/3-octave bins) against each axis
          const scat = (get) => { const bins = new Map(); for (const p of pts) { const b = Math.floor(3 * Math.log2(get(p))); if (!bins.has(b)) bins.set(b, []); bins.get(b).push(p.y); } let s = 0, c = 0; const trend = []; for (const [b, ys] of [...bins].sort((a, q) => a[0] - q[0])) { const m = M.mean(ys); if (ys.length > 2) { for (const y of ys) s += (y - m) ** 2; c += ys.length; } trend.push([2 ** ((b + 0.5) / 3), m]); } return { sd: Math.sqrt(s / c), trend }; };
          const ref = notes.reduce((a, b) => (a.key < b.key ? a : b));
          C = { pts, sF: scat((p) => p.f), sN: scat((p) => p.n), notes, ref, k0, k1 };
          return C;
        };
        const resid = (p = P) => { const d = data(); let s = 0, s2 = 0; for (const q of d.pts) { const r = q.y - shape(q.f, p); s += r; s2 += r * r; } const n = d.pts.length, off = s / n; return { off, rms: Math.sqrt(Math.max(0, s2 / n - off * off)) }; };
        function fit() { // coordinate search on the five parameters
          const steps = { F1: 1.12, A1: 2, F2: 1.12, A2: 2, tilt: 2 };
          let best = resid().rms;
          for (let it = 0; it < 6; it++) {
            for (const k of Object.keys(steps)) for (const dir of [1, -1]) for (let r = 0; r < 12; r++) {
              const old = P[k]; P[k] = k[0] === 'F' ? old * steps[k] ** dir : old + steps[k] * dir;
              P.F1 = M.clamp(P.F1, 120, 2500); P.F2 = M.clamp(P.F2, 400, 4500); P.A1 = M.clamp(P.A1, 0, 40); P.A2 = M.clamp(P.A2, 0, 40); P.tilt = M.clamp(P.tilt, -40, 10);
              const e = resid().rms; if (e < best - 1e-6) best = e; else { P[k] = old; break; }
            }
            for (const k of Object.keys(steps)) steps[k] = k[0] === 'F' ? Math.sqrt(steps[k]) : steps[k] / 2;
          }
          if (P.F2 < P.F1) { const a = [P.F1, P.A1]; P.F1 = P.F2; P.A1 = P.A2; P.F2 = a[0]; P.A2 = a[1]; }
        }
        fit();
        v.button('Fit', () => { fit(); sync(); });
        const sc = v.stage({ x: [Math.log10(55), Math.log10(5200)], y: [-70, 8], height: 300, axes: 'box', full: true, yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], title: 'every harmonic of every recorded note (level re the note’s total)' });
        const sy = v.stage({ x: [Math.log10(40), Math.log10(5200)], y: [-70, 8], height: 230, axes: 'box', full: true, yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40']], title: 'a synthetic note through the envelope' });
        const fTicks = [[Math.log10(100), '100'], [Math.log10(200), '200'], [Math.log10(500), '500'], [Math.log10(1000), '1k'], [Math.log10(2000), '2k'], [Math.log10(5000), '5k Hz']];
        const nTicks = [1, 2, 3, 5, 10, 20, 50].map((n) => [Math.log10(n), String(n)]);
        const h1 = sc.handle(Math.log10(P.F1), 0, { color: 'gold', label: 'F1', labelPos: 'n' });
        const h2 = sc.handle(Math.log10(P.F2), 0, { color: 'gold', label: 'F2', labelPos: 'n' });
        const placeHandles = () => { const o = resid().off; h1.x = Math.log10(P.F1); h1.y = shape(P.F1) + o; h2.x = Math.log10(P.F2); h2.y = shape(P.F2) + o; };
        const onH = (h, which) => () => {
          const f = 10 ** h.x, o = resid().off;
          if (which === 1) { P.F1 = M.clamp(f, 120, 2500); P.A1 = M.clamp(h.y - o - P.tilt * Math.log2(P.F1 / 1000) - P.A2 * bump(P.F1, P.F2), 0, 45); }
          else { P.F2 = M.clamp(f, 300, 4500); P.A2 = M.clamp(h.y - o - P.tilt * Math.log2(P.F2 / 1000) - P.A1 * bump(P.F2, P.F1), 0, 45); }
          sync();
        };
        h1.onDrag = onH(h1, 1); h2.onDrag = onH(h2, 2);
        /** harmonic levels (linear) of a note at f0 in the current mode; the recipe is the envelope sampled at the lowest note's harmonics */
        const levels = (f0) => {
          const d = data(), fr = d.ref.f, out = [];
          for (let n = 1; n * f0 < 5000 && n <= 60; n++) { const f = mode.value === 'env' ? n * f0 : n * fr; out.push(10 ** (shape(f) / 20)); }
          return out;
        };
        const lv = loopVoice(v);
        const loopBuf = () => periodicLoop(levels(pS.value).map((a, i) => [i + 1, 0.12 * a, 0]), pS.value).buf;
        function sync() { lv.update(loopBuf, 0.7); v.invalidate(); }
        v.toggle('hold the note', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.7); else lv.stop(); } });
        const scale = (m) => { const keep = mode.value; const d = data(), f0 = d.ref.f; const bufs = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16].map((s) => { const f = f0 * 2 ** (s / 12), lev = (() => { const out = []; for (let n = 1; n * f < 5000 && n <= 60; n++) out.push(10 ** (shape(m === 'env' ? n * f : n * f0) / 20)); return out; })(); return toRms(partials(lev.map((a, i) => ({ f: (i + 1) * f, a })), 0.42, { att: 0.03, rel: 0.08 }), 0.13); }); return join(bufs, 0.05); };
        const ph = playhead(v);
        v.soundButton('Play a scale', (snd) => { snd.samples(scale(mode.value), SR, { gain: 0.9 }); ph.start(4.7, mode.value); });
        v.soundButton('envelope, then recipe', (snd) => { snd.samples(join([scale('env'), scale('rec')], 0.5), SR, { gain: 0.9 }); ph.start(9.9, 'both'); });
        const ramp = (u) => v.mix(v.color('accent'), v.color('orange'), u);
        v.render(() => {
          const d = data(), byF = axS.value === 'f', r = resid();
          if (!h1.dragging && !h2.dragging) placeHandles();
          h1.visible = h2.visible = byF;
          sc.setView(byF ? [Math.log10(55), Math.log10(5200)] : [Math.log10(0.8), Math.log10(90)], [-70, 8]);
          sc.setTicks(byF ? fTicks : nTicks, undefined);
          // dots, coloured by the note's pitch
          const groups = 6;
          for (let g = 0; g < groups; g++) sc.dots(d.pts.filter((p) => Math.min(groups - 1, Math.floor(p.u * groups)) === g).map((p) => (p.y < -62 ? null : [Math.log10(byF ? p.f : p.n), p.y])), { r: 2.4, color: ramp(g / (groups - 1)), alpha: 0.75 });
          const tr = byF ? d.sF.trend : d.sN.trend;
          sc.path(tr.map(([x, y]) => [Math.log10(x), y]), { color: 'ink', width: 1.6, alpha: 0.7 });
          if (byF) sc.fn((x) => shape(10 ** x) + r.off, { domain: [Math.log10(55), Math.log10(5200)], color: 'gold', width: 2.6 });
          sc.corner(`scatter about the trend: ${v.fix(byF ? d.sF.sd : d.sN.sd, 1)} dB`, 'tr', { color: 'ink', weight: 600, plate: true });
          sc.corner(byF ? 'x: frequency of the harmonic (Hz)' : 'x: harmonic number n', 'tl', { color: 'muted', size: 11, plate: true });
          // ---- the synthetic note
          const f0 = pS.value, lev = levels(f0), mx = Math.max(...lev);
          sy.fn((x) => shape(10 ** x) - dB(mx), { domain: [Math.log10(40), Math.log10(5200)], color: 'gold', width: 1.6, dash: mode.value === 'env' ? false : [5, 4], alpha: mode.value === 'env' ? 1 : 0.6 });
          if (mode.value === 'rec') { const k = f0 / d.ref.f; sy.fn((x) => shape(10 ** x / k) - dB(mx), { domain: [Math.log10(40), Math.log10(5200)], color: 'red', width: 2 }); }
          lev.forEach((a, i) => { const x = Math.log10((i + 1) * f0), y = dB(a / mx); if (y > -60) { sy.line(x, -60, x, y, { color: 'accent', width: 2 }); sy.dot(x, y, { r: 3, color: 'accent' }); } });
          sy.setTicks(fTicks, undefined);
          sy.corner(mode.value === 'env' ? 'harmonics sample the fixed envelope (gold)' : 'the recipe of the lowest note, transposed: its envelope (red) moves with the pitch', 'tl', { color: mode.value === 'env' ? 'ink' : 'red', size: 11.5, weight: 600 });
          if (ph.t != null) sy.corner('♪', 'tr', { color: 'gold', weight: 700 });
        });
        v.legend([['accent', 'lowest notes'], ['orange', 'highest notes'], ['ink', 'binned trend'], ['gold', 'your envelope']]);
        v.readout(() => {
          const d = data(), r = resid(), better = d.sF.sd < d.sN.sd;
          return `${INST[insS.value]}, ${d.notes.length} notes (${noteOf(M, 440 * 2 ** ((d.k0 - 69) / 12))} to ${noteOf(M, 440 * 2 ** ((d.k1 - 69) / 12))}), ${d.pts.length} harmonics · scatter about the trend: ${v.fix(d.sF.sd, 1)} dB against frequency, ${v.fix(d.sN.sd, 1)} dB against harmonic number: ${better ? 'the levels follow a fixed envelope in hertz (a formant)' : 'the levels follow harmonic number more than frequency (no fixed formant)'} · your envelope: peaks near ${v.fix(P.F1, 0)} Hz and ${v.fix(P.F2, 0)} Hz, tilt ${v.fix(P.tilt, 1)} dB/octave, rms misfit ${v.fix(r.rms, 1)} dB`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'The source–filter model of vowels',
      statement: String.raw`A sung or spoken vowel is modelled as a **source** passed through a **filter**. The source is the train of air pulses from the vibrating vocal folds, periodic at $f_0$, with harmonics falling at about 12 dB per octave (6 dB per octave once radiation from the lips is included). The filter is the vocal tract, whose resonances, the formants $F_1,F_2,F_3,\dots$, are set by the positions of tongue, jaw and lips. The two are nearly independent: the larynx sets the pitch and the tract sets the vowel. The output harmonics are $A_n=S(nf_0)\,|H(nf_0)|$, and vowel identity is carried mainly by $F_1$ and $F_2$.

Two consequences shape classical singing:
(a) when $f_0$ rises above $F_1$, no harmonic falls near the first formant. Sopranos then raise $F_1$ to sit just above $f_0$ (**formant tuning**), gaining loudness at the cost of vowel clarity;
(b) trained male singers cluster $F_3$–$F_5$ into one strong peak near 2.5–3 kHz (the **singer's formant**). There an orchestra's spectrum has fallen off, so the voice carries over the orchestra.`,
      idea: String.raw`Source and filter are coupled only weakly, so the tract acts as a linear filter on the glottal flow (4.9), and the formants are the resonances of a tube about 17 cm long, closed at the glottis and open at the lips (ling-1.8). Its quarter-wave modes near 500, 1500 and 2500 Hz are pushed around by constrictions: raising the tongue lowers $F_1$ (*ee*, *oo*), fronting it raises $F_2$ (*ee*). The harmonics sample the formant envelope at multiples of $f_0$. A low voice samples it densely, but a soprano singing at 900 Hz has only three or four harmonics below 3 kHz, too few to show where $F_1$ is: hence the vowel blurring at high pitch, and the advantage of tuning $F_1$ onto a harmonic. The singer's formant is a clustering of resonances produced by a lowered larynx and a widened pharynx (Sundberg, 1974).`,
      caption: String.raw`Left: the vowel chart with Peterson and Barney's average formants (1952) for the chosen voice. Drag the gold point to set $F_1$ and $F_2$ and hold the note to hear the vowel as you drag; *glide* sings /i/ → /a/ → /u/. Right: the harmonics (stems) under the vocal-tract envelope (gold), with the formant frequencies marked. Raise the pitch and watch the harmonics thin out until none sits near $F_1$. Then switch on **formant tuning**: $F_1$ jumps to just above $f_0$ (the arrow on the chart), and the readout reports the gain in level. Switch on the **singer's formant** and the **orchestra** curve (illustrative long-term spectrum) to see the voice's peak near 3 kHz standing clear.`,
      deps: ['music-4.9'],
      see: ['ling-1.1', 'ling-1.7', 'ling-1.8', 'ling-1.9', 'ling-1.10'],
      refs: ['Loy I ch. 6'],
      tags: ['voice', 'formants'],
      credit: 'Chiba & Kajiyama, 1941; Fant, 1960; singer’s formant: Sundberg, 1974; soprano formant tuning: Sundberg, 1975; Joliveau, Smith & Wolfe, 2004',
      scope: String.raw`A linear, time-invariant filter driven by a source it does not affect. This is accurate for most vowels at speech pitches. At high pitch and in strong singing the source and tract interact, and the bandwidths, the nasal coupling and the glottal pulse shape all vary. The orchestra curve is a schematic long-term average spectrum, not a measurement.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Source%E2%80%93filter_model' },
      viz(v) {
        const M = v.M;
        const voice = v.select('voice', [{ value: 'm', label: 'baritone' }, { value: 'w', label: 'soprano' }], 'm', { onChange: (x) => { fS.set(x === 'm' ? 130 : 440); const tgt = PB.find((p) => p[0] === 'ɑ'); h.set(...pos(tgt[x === 'm' ? 2 : 3])); sync(); } });
        const fS = v.slider('pitch $f_0$', 70, 1100, 130, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})`, onChange: () => sync() });
        const tune = v.toggle('formant tuning ($F_1$ follows $f_0$)', false, { onChange: () => sync() });
        const sf = v.toggle('singer’s formant', false, { onChange: () => sync() });
        const orch = v.toggle('orchestra (illustrative)', false);
        // chart coordinates: x = −log2(F2/1000) (front vowels on the left), y = −log2(F1/1000) (close vowels on top)
        const pos = ([F1, F2]) => [-Math.log2(F2 / 1000), -Math.log2(F1 / 1000)];
        const ch = v.stage({ x: [-1.62, 0.42], y: [-0.25, 2.12], height: 300, axes: 'box', weight: 0.85, minWidth: 260, xticks: [2500, 2000, 1500, 1000, 800].map((f) => [-Math.log2(f / 1000), String(f)]), yticks: [250, 300, 400, 500, 600, 800, 1000].map((f) => [-Math.log2(f / 1000), String(f)]), xlabel: 'F2 (Hz)', ylabel: 'F1 (Hz)', title: 'the vowel chart' });
        const sp = v.stage({ x: [-250, 5000], y: [-76, 8], height: 300, axes: 'box', xlabel: 'frequency (Hz)', weight: 1.4, xticks: [500, 1000, 2000, 3000, 4000], yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], title: 'harmonics under the vocal-tract envelope' });
        const h = ch.handle(...pos([730, 1090]), { color: 'gold', constrain: (x, y) => [M.clamp(x, -1.55, 0.35), M.clamp(y, -0.2, 1.9)] });
        const F12 = () => [1000 * 2 ** -h.y, 1000 * 2 ** -h.x];
        const formants = () => {
          const w = voice.value === 'w', k = w ? 1.17 : 1, f0 = fS.value; let [F1, F2] = F12();
          const F1raw = F1; if (tune.value && f0 * 1.04 > F1) F1 = f0 * 1.04;
          const F = [F1, F2, 2500 * k, 3300 * k, 3750 * k], B = [70, 90, 130, 180, 250].map((b) => b * (w ? 1.3 : 1));
          if (sf.value) { F[2] = 2550 * k; F[3] = 2800 * k; F[4] = 3050 * k; B[2] = 90; B[3] = 100; B[4] = 120; }
          return { F, B, F1raw };
        };
        const Hgain = (FB, f) => { let g = 1; for (let i = 0; i < 5; i++) g *= resonance(FB.F[i], FB.B[i], f); return g; };
        const src = (f, f0) => (f0 / f) / Math.sqrt(1 + (60 / f) ** 2);
        const harm = (FB = formants(), f0 = fS.value) => { const out = []; for (let n = 1; n * f0 < 5000; n++) out.push(src(n * f0, f0) * Hgain(FB, n * f0)); return out; };
        const orchDB = (f) => -9 - 10 * Math.log2(Math.max(1, f / 450)) - 6 * Math.log2(Math.max(1, 450 / f));
        const lv = loopVoice(v);
        const loopBuf = () => periodicLoop(harm().map((a, i) => [i + 1, a, 0]), fS.value).buf;
        function sync() { lv.update(() => { const b = loopBuf(); toRms(b, 0.14); return b; }, 0.8); v.invalidate(); }
        h.onDrag = () => sync();
        v.toggle('hold the note', false, { onChange: (on) => { if (on) { const b = loopBuf(); toRms(b, 0.14); lv.start(b, 0.8); } else lv.stop(); } });
        v.soundButton('glide /i/ → /a/ → /u/', (snd) => {
          const w = voice.value === 'w' ? 3 : 2, path = ['i', 'ɑ', 'u'].map((s) => PB.find((p) => p[0] === s)[w]), f0 = fS.value, dur = 2.4;
          const at = (t) => { const u = M.clamp(t / dur, 0, 1) * 2, i = Math.min(1, Math.floor(u)), a = M.smoothstep(0.15, 0.85, u - i), p = path[i], q = path[i + 1]; return [p[0] * (q[0] / p[0]) ** a, p[1] * (q[1] / p[1]) ** a]; };
          const base = formants(), parts = [];
          for (let n = 1; n * f0 < 5000; n++) parts.push({ f: n * f0, a: 1, env: (t) => { const [F1, F2] = at(t), FB = { F: [tune.value && f0 * 1.04 > F1 ? f0 * 1.04 : F1, F2, ...base.F.slice(2)], B: base.B }; return src(n * f0, f0) * Hgain(FB, n * f0); } });
          snd.samples(toRms(partials(parts, dur, { att: 0.06, rel: 0.12 }), 0.14), SR, { gain: 0.85 });
        });
        v.render(() => {
          const w = voice.value === 'w', FB = formants(), f0 = fS.value, A = harm(FB), mx = Math.max(...A.map((a, i) => a)), [F1u, F2u] = F12();
          // ---- vowel chart
          PB.forEach((p) => { const [x, y] = pos(p[w ? 3 : 2]); ch.dot(x, y, { r: 3, color: 'accent' }); ch.text(p[0], x + 0.035, y + 0.035, { color: 'accent', size: 17, math: true, align: 'left', baseline: 'bottom' }); });
          const corner = ['i', 'æ', 'ɑ', 'ɔ', 'u'].map((s) => pos(PB.find((p) => p[0] === s)[w ? 3 : 2]));
          ch.path([...corner, corner[0]], { color: 'accent', width: 1, dash: [4, 4], alpha: 0.5 });
          if (FB.F[0] !== F1u) { const [x, y] = pos([F1u, F2u]), [x2, y2] = pos([FB.F[0], F2u]); ch.arrow(x, y, x2, y2, { color: 'red', width: 2, head: 8 }); ch.dot(x2, y2, { r: 5, color: 'red' }); }
          ch.hline(-Math.log2(f0 / 1000), { color: 'orange', width: 1.4, dash: [5, 4] });
          ch.text(`f₀ = ${v.fix(f0, 0)} Hz`, 0.4, -Math.log2(f0 / 1000), { color: 'orange', size: 11, align: 'right', baseline: 'bottom', dy: -2 });
          const near = PB.map((p) => { const [x, y] = pos(p[w ? 3 : 2]); return [p, Math.hypot(x - h.x, y - h.y)]; }).sort((a, b) => a[1] - b[1])[0];
          ch.corner(`nearest: /${near[0][0]}/ as in “${near[0][1]}”`, 'tr', { color: 'ink', weight: 600, plate: true });
          // ---- spectrum
          if (orch.value) { sp.fn((f) => orchDB(f), { domain: [60, 5000], color: 'muted', width: 2.2, fill: 'muted', fillAlpha: 0.12, base: -64 }); sp.text('orchestra', 1500, orchDB(1500) + 3, { color: 'muted', size: 11.5 }); }
          const envDB = (f) => dB((src(f, f0) * Hgain(FB, f)) / mx);
          sp.fn(envDB, { domain: [40, 5000], n: 600, color: 'gold', width: 2 });
          A.forEach((a, i) => { const f = (i + 1) * f0, y = dB(a / mx); if (y > -64) { sp.line(f, -64, f, y, { color: 'accent', width: 2.2 }); sp.dot(f, y, { r: 3.2, color: 'accent' }); } });
          FB.F.slice(0, 2).forEach((F, i) => { sp.vline(F, { color: i === 0 && FB.F[0] !== F1u ? 'red' : 'ink', width: 1, dash: [3, 4], alpha: 0.7 }); sp.text(`F${i + 1}`, F, 6, { align: 'center', color: i === 0 && FB.F[0] !== F1u ? 'red' : 'ink', size: 11.5, weight: 600 }); });
          if (sf.value) sp.text('singer’s formant', 2800 * (w ? 1.17 : 1), envDB(2800 * (w ? 1.17 : 1)) + 5, { align: 'center', color: 'gold', size: 11.5, weight: 600 });
          const below = A.filter((_, i) => (i + 1) * f0 < 3000).length;
          sp.corner(`${below} harmonic${below === 1 ? '' : 's'} below 3 kHz`, 'tr', { color: below <= 4 ? 'red' : 'muted', size: 11.5, weight: below <= 4 ? 700 : 500 });
        });
        v.legend([['accent', 'harmonics / vowels'], ['gold', 'vocal-tract envelope'], ['orange', '$f_0$'], ['red', 'tuned $F_1$']]);
        v.readout(() => {
          const FB = formants(), f0 = fS.value, [F1u, F2u] = F12();
          let nn = 1; for (let n = 1; n * f0 < 5000; n++) if (Math.abs(n * f0 - F1u) < Math.abs(nn * f0 - F1u)) nn = n;
          const gap = Math.abs(nn * f0 - F1u);
          const raw = { F: [F1u, ...FB.F.slice(1)], B: FB.B }, g1 = src(f0, f0) * Hgain(FB, f0), g0 = src(f0, f0) * Hgain(raw, f0);
          const tuned = FB.F[0] !== F1u ? ` · tuning moved $F_1$ from ${v.fix(F1u, 0)} to ${v.fix(FB.F[0], 0)} Hz: the fundamental gains ${v.fix(dB(g1 / g0), 1)} dB, but the vowel drifts towards /ɑ/` : '';
          let singer = ''; if (sf.value && orch.value) { const f = 2800 * (voice.value === 'w' ? 1.17 : 1), A = harm(FB), mx = Math.max(...A); singer = ` · near ${v.fix(f, 0)} Hz the voice envelope stands ${v.fix(dB((src(f, f0) * Hgain(FB, f)) / mx) - orchDB(f), 1)} dB above the orchestra curve`; }
          return `$F_1$ = ${v.fix(F1u, 0)} Hz, $F_2$ = ${v.fix(F2u, 0)} Hz, $f_0$ = ${v.fix(f0, 0)} Hz: harmonics every ${v.fix(f0, 0)} Hz · the harmonic nearest $F_1$ is no. ${nn}, ${v.fix(gap, 0)} Hz away${f0 > F1u ? ' (the fundamental is already above $F_1$: no harmonic can show where the first formant is)' : gap > 0.35 * f0 ? '' : ''}${tuned}${singer}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'The missing fundamental',
      statement: String.raw`A complex tone made of harmonics $nf_0$ is heard with pitch $f_0$ even when the component at $f_0$ is absent, and even when several of the lowest harmonics are absent too. Harmonics 4, 5 and 6 of 200 Hz alone (800, 1000, 1200 Hz) are heard at the pitch of 200 Hz. The waveform keeps its period $1/f_0$, which is the reciprocal of the greatest common divisor of the frequencies present. The pitch persists when low-pass noise masks the region around $f_0$, so it is not produced by a distortion product in the ear: the auditory system computes it from the pattern of the harmonics. This **residue pitch** is why a small loudspeaker or a telephone line, which transmit almost nothing below 300 Hz, still convey the pitch of a bass voice.`,
      idea: String.raw`Removing harmonics does not change the period. A sum of components at $4f_0,5f_0,6f_0$ repeats after $1/f_0$, since that is the smallest interval after which every component has gone through a whole number of cycles. Its autocorrelation $r(\tau)=\sum_n\tfrac12A_n^2\cos2\pi nf_0\tau$ still has its first large peak at $\tau=1/f_0$, and a neural periodicity analysis of the kind Licklider proposed (1951) reads the pitch from that peak. Seebeck (1841) heard the residue with a siren, against Ohm's view that pitch belongs to the lowest Fourier component. Schouten (1940) cancelled the fundamental physically and showed that the pitch survived, and Licklider (1954) masked the low frequencies with noise to rule out difference tones.`,
      caption: String.raw`Click bars to switch harmonics on and off, or pick a preset. Top left: the spectrum; the dashed slot at $f_0$ marks where the absent fundamental would be. Top right: the autocorrelation computed from the components, whose highest peak beyond zero marks the period the ear is thought to read. Bottom: the waveform, with ticks every $1/f_0$. *Listen*, then *compare* plays the tone, a pure tone at $f_0$ and a pure tone at the lowest component present: the pitch matches the first. Switch on the **noise masker** below $1.5f_0$; the pitch survives, so it is not a difference tone made in the ear.`,
      deps: ['music-2.6', 'music-4.2'],
      see: ['music-4.12', 'music-5.14', 'music-12.12', 'sig-3.14'],
      refs: ['Benson ch. 1', 'Loy I ch. 6'],
      tags: ['pitch', 'perception'],
      credit: 'Seebeck, 1841; Schouten, 1940; Licklider, 1951–54',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Missing_fundamental' },
      viz(v) {
        const M = v.M, NH = 12;
        const on = new Array(NH + 1).fill(false); for (let n = 2; n <= 10; n++) on[n] = true;
        const amp = (n) => 1 / Math.sqrt(n);
        const PRE = { full: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], nof: [2, 3, 4, 5, 6, 7, 8, 9, 10], r456: [4, 5, 6], r91011: [9, 10, 11], odd: [3, 5, 7, 9] };
        const pre = v.select('harmonics', [{ value: 'full', label: '1–10' }, { value: 'nof', label: 'no fundamental' }, { value: 'r456', label: '4, 5, 6' }, { value: 'r91011', label: '9, 10, 11' }, { value: 'odd', label: '3, 5, 7, 9' }, { value: 'custom', label: 'custom' }], 'nof', { onChange: (x) => { if (PRE[x]) { on.fill(false); PRE[x].forEach((n) => { on[n] = true; }); } } });
        const fS = v.select('$f_0$', [{ value: 110, label: '110 Hz' }, { value: 165, label: '165 Hz' }, { value: 220, label: '220 Hz' }], 165);
        const mask = v.toggle('noise masker below $1.5f_0$', false);
        const sp = v.stage({ x: [-0.6, NH + 0.8], y: [-0.16, 1.15], height: 230, axes: 'box', xticks: M.range(NH, 1), yticks: [], weight: 1.2, title: 'spectrum (click bars)' });
        const ac = v.stage({ x: [0, 3.05], y: [-1.15, 1.25], height: 230, axes: 'box', xlabel: 'lag τ (periods of f₀)', xticks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yticks: [], weight: 1, title: 'autocorrelation $r(\\tau)$' });
        const wv = v.stage({ x: [0, 4], y: [-1.2, 1.25], height: 190, axes: false, full: true });
        sp.onClick((x) => { const n = Math.round(x); if (n >= 1 && n <= NH) { on[n] = !on[n]; pre.set('custom'); } });
        const list = () => M.range(NH, 1).filter((n) => on[n]);
        const gcd = (ns) => ns.reduce((a, b) => M.gcd(a, b), 0);
        const r = (tau) => { let s = 0, s0 = 0; for (const n of list()) { s += 0.5 * amp(n) ** 2 * Math.cos(TAU * n * tau); s0 += 0.5 * amp(n) ** 2; } return s0 ? s / s0 : 0; };
        const wave = (u) => { let s = 0; for (const n of list()) s += amp(n) * Math.cos(TAU * n * u); return s; };
        const maskBuf = (dur) => { // low-pass pink-ish noise below 1.5 f0 (two one-pole low-passes)
          const n = Math.round(dur * SR), out = new Float32Array(n), rnd = noiseGen(41), a = Math.exp((-TAU * 1.5 * fS.value) / SR); let y1 = 0, y2 = 0;
          for (let i = 0; i < n; i++) { y1 = (1 - a) * rnd() + a * y1; y2 = (1 - a) * y1 + a * y2; out[i] = y2; }
          return toRms(out, 0.06);
        };
        const tone = (ns, dur = 1.3) => { const b = toRms(partials(ns.map((n) => ({ f: n * fS.value, a: amp(n) })), dur, { att: 0.03, rel: 0.1 }), 0.14); if (mask.value) { const m = maskBuf(dur); for (let i = 0; i < b.length; i++) b[i] += m[i]; } return b; };
        const pure = (f, dur = 1.0) => toRms(partials([{ f, a: 1 }], dur, { att: 0.03, rel: 0.1 }), 0.12);
        const ph = playhead(v);
        v.soundButton('Listen', (snd) => { if (list().length) { snd.samples(tone(list()), SR, { gain: 0.9 }); ph.start(1.3, 'tone'); } });
        v.soundButton('compare: tone, f₀, lowest', (snd) => { const ns = list(); if (!ns.length) return; snd.samples(join([tone(ns, 1.1), pure(fS.value), tone(ns, 1.1), pure(ns[0] * fS.value)], 0.25), SR, { gain: 0.9 }); ph.start(4.6, 'cmp'); });
        v.render(() => {
          const ns = list(), g = gcd(ns), f0 = fS.value;
          // ---- spectrum
          if (mask.value) sp.rect(-0.6, 0, 1.5, 0.9, { fill: 'muted', fillAlpha: 0.18, stroke: false, hatch: 'muted', hatchAlpha: 0.35 });
          for (let n = 1; n <= NH; n++) {
            if (on[n]) sp.rect(n - 0.32, 0, n + 0.32, amp(n), { fill: 'accent', fillAlpha: 0.8, stroke: false });
            else sp.rect(n - 0.32, 0, n + 0.32, amp(n), { fill: 'panel', fillAlpha: 0, color: n === 1 ? 'red' : 'faint', width: n === 1 ? 1.6 : 1, dash: [3, 3] });
          }
          if (!on[1]) sp.text('nothing at f₀', 1, 1.06, { align: 'center', color: 'red', size: 11.5, weight: 600 });
          if (mask.value) sp.text('noise', 0.45, 0.95, { align: 'center', color: 'muted', size: 11 });
          sp.hline(0, { color: 'muted', width: 1 });
          sp.corner(`×${f0} Hz`, 'tr', { color: 'muted', size: 11 });
          // ---- autocorrelation
          ac.hline(0, { color: 'faint', width: 1 });
          for (const k of [1, 2, 3]) ac.vline(k, { color: 'faint', width: 1, dash: [3, 4] });
          ac.fn(r, { domain: [0, 3.05], n: 900, color: 'accent', width: 2 });
          if (ns.length) { const tp = peakIn(r, 0.3, 1.6); ac.dot(tp, r(tp), { r: 5, color: 'gold' }); ac.text(`peak at τ = ${v.fix(tp, 3)}/f₀`, tp + 0.05, r(tp) + 0.08, { color: 'gold', size: 11.5, weight: 600, align: 'left' }); }
          // ---- waveform
          wv.hline(0, { color: 'faint', width: 1 });
          let mxw = 1e-9; for (let i = 0; i < 400; i++) mxw = Math.max(mxw, Math.abs(wave(i / 400)));
          for (let k = 0; k <= 4; k++) wv.line(k, -1.15, k, -1.0, { color: 'gold', width: 2 });
          if (ns.length) wv.fn((x) => wave(x) / mxw, { domain: [0, 4], n: 1600, color: 'accent', width: 1.8 });
          wv.corner(`ticks every 1/f₀ = ${v.fix(1000 / f0, 2)} ms: ${g === 1 ? 'the waveform still repeats there' : g > 1 ? `the waveform now repeats every 1/${g} of that: the harmonics present are all multiples of ${g}` : ''}`, 'tl', { color: 'ink', size: 11.5, weight: 600, plate: true });
        });
        v.legend([['accent', 'components present'], ['red', 'absent fundamental', { dash: true }], ['gold', 'autocorrelation peak / period ticks']]);
        v.readout(() => {
          const ns = list(), f0 = fS.value; if (!ns.length) return 'no harmonics on: click some bars';
          const g = gcd(ns), tp = peakIn(r, 0.3, 1.6);
          return `components ${ns.map((n) => v.fix(n * f0, 0)).join(', ')} Hz · greatest common divisor ${v.fix(g * f0, 0)} Hz, so the waveform's period is ${v.fix(1000 / (g * f0), 2)} ms · autocorrelation peak at ${v.fix((1000 * tp) / f0, 2)} ms → predicted pitch ${v.fix(f0 / tp, 1)} Hz (${noteOf(M, f0 / tp)}) · lowest component present: ${v.fix(ns[0] * f0, 0)} Hz (${noteOf(M, ns[0] * f0)})${!on[1] ? ', yet the pitch heard is near the absent fundamental' : ''}${mask.value ? ' · masker on: any difference tone at f₀ would be buried, and the pitch remains' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Virtual pitch',
      statement: String.raw`The pitch of a complex tone is the fundamental of the harmonic series that best fits its partials, as computed by the auditory system: a **virtual pitch** (Terhardt). For three equally spaced partials $(N-1)g+\Delta,\ Ng+\Delta,\ (N+1)g+\Delta$, all shifted by $\Delta$ from harmonics of $g$, the spacing (and the envelope period of the waveform) stays $g$. Yet the pitch heard moves, approximately as
$$p\approx\frac{Ng+\Delta}{N}=g+\frac{\Delta}{N}$$
(de Boer's rule, the "first effect" of pitch shift), with ambiguous neighbouring pitches $(Ng+\Delta)/(N\pm1)$. Pitch is therefore set neither by the lowest partial nor by the spacing alone. It follows the best-fitting harmonic template, or equivalently the fine structure of the waveform.`,
      idea: String.raw`If the partials were harmonics of $g$, the template would fit perfectly. Shifted by $\Delta$, they are no longer harmonic, and the best compromise fundamental minimises the mismatch $\sum_k(f_k-n_kp)^2$ with $n_k=N-1,N,N+1$, which gives roughly $p=f_{\rm centre}/N$. In the time domain the waveform's envelope still repeats every $1/g$, but the fine-structure peaks under successive envelope maxima are $N/(Ng+\Delta)$ apart. A periodicity detector (an autocorrelation peak, 4.11) latches onto that interval. Schouten (1940) and de Boer (1956) measured the pitch shift; Goldstein (1973) and Terhardt (1974) built pattern-matching models of it. The shift is smaller for higher $N$, and the pitch becomes weak and ambiguous once the partials are no longer resolved by the cochlea.`,
      caption: String.raw`Three partials of equal level, centred on harmonic $N$ of $g$ = 200 Hz. Drag the shift $\Delta$. Top left: the pitch-shift diagram, with de Boer's lines $p=(Ng+\Delta)/n$ for $n=N-1,N,N+1$, the spacing $g$ (dashed, what a spacing-only theory predicts) and two estimates computed from the actual tone: the best-fitting harmonic template (accent) and the autocorrelation peak (gold). Top right: the partials with the template's teeth. Bottom: the waveform; its envelope period stays 5 ms while the fine-structure peaks move. Set **your match** with the slider and play *tone, then match* to check by ear where you hear the pitch.`,
      deps: ['music-4.11'],
      see: ['music-5.14', 'music-5.15', 'music-6.5'],
      refs: ['Sethares ch. 2', 'Benson ch. 4'],
      tags: ['pitch', 'perception'],
      credit: 'Schouten, 1940; de Boer, 1956; Schouten, Ritsma & Cardozo, 1962; Goldstein, 1973; Terhardt, 1974',
      scope: String.raw`De Boer's rule describes the dominant pitch for resolved partials of moderate harmonic number (about 3 to 12). For higher $N$ the pitch weakens and listeners may report several candidates. Real matches spread around the prediction and depend on level and on listener.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pitch_(music)#Virtual_pitch' },
      viz(v) {
        const M = v.M, G = 200;
        const nS = v.select('centre harmonic $N$', [4, 6, 8, 10, 14].map((n) => ({ value: n, label: String(n) })), 8, { onChange: () => sync() });
        const dS = v.slider('shift $\\Delta$', 0, 200, 60, { step: 1, fmt: (x) => v.fix(x, 0) + ' Hz', onChange: () => sync() });
        const uS = v.slider('your match', 150, 260, 200, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' Hz' });
        const comps = () => { const N = nS.value, d = dS.value; return [N - 1, N, N + 1].map((n) => n * G + d); };
        const ac = (tau) => comps().reduce((s, f) => s + Math.cos(TAU * f * tau), 0) / 3;
        const acPitch = () => 1 / peakIn(ac, 1 / (1.45 * G), 1 / (0.68 * G), 1200);
        const sieve = () => { // best-fitting fundamental: min over p of Σ (f_k − n_k p)², n_k = round(f_k / p)
          const fs = comps(); let best = Infinity, bp = G;
          for (let p = 0.7 * G; p <= 1.45 * G; p += 0.05) { let e = 0; for (const f of fs) { const n = Math.max(1, Math.round(f / p)); e += ((f - n * p) / n) ** 2; } if (e < best) { best = e; bp = p; } }
          const ns = fs.map((f) => Math.max(1, Math.round(f / bp))); return { p: fs.reduce((s, f, i) => s + ns[i] * f, 0) / ns.reduce((s, n) => s + n * n, 0), ns };
        };
        const lv = loopVoice(v);
        const loopBuf = () => { const fs = comps(), g = 0.5; let L = 0.5; return (() => { const n = Math.round(L * SR), out = new Float32Array(n); for (const f of fs) { const fq = Math.round(f * L) / L, w = (TAU * fq) / SR; for (let i = 0; i < n; i++) out[i] += (0.2 / 3) * Math.cos(w * i); } return out; })(); };
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the tone', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        const tone = (dur = 1.2) => toRms(partials(comps().map((f) => ({ f, a: 1 })), dur, { att: 0.03, rel: 0.1 }), 0.13);
        v.soundButton('tone, then match', (snd) => snd.samples(join([tone(), toRms(partials([{ f: uS.value, a: 1 }, { f: 2 * uS.value, a: 0.5 }, { f: 3 * uS.value, a: 0.3 }], 1.2, { att: 0.03, rel: 0.1 }), 0.13), tone()], 0.25), SR, { gain: 0.9 }));
        v.soundButton('Δ = 0 → 200 Hz in steps', (snd) => { const keep = dS.value, bufs = []; for (const d of [0, 40, 80, 120, 160, 200]) { dS.set(d); bufs.push(tone(0.55)); } dS.set(keep); snd.samples(join(bufs, 0.1), SR, { gain: 0.9 }); });
        const pd = v.stage({ x: [0, 200], y: [150, 262], height: 270, axes: 'box', xlabel: 'shift Δ (Hz)', ylabel: 'pitch (Hz)', weight: 1.2, title: 'pitch-shift diagram' });
        const ps = v.stage({ x: [0, 3400], y: [-0.12, 1.25], height: 270, axes: 'box', xlabel: 'frequency (Hz)', yticks: [], weight: 1, title: 'partials and the best-fitting template' });
        const wv = v.stage({ x: [0, 15], y: [-1.25, 1.3], height: 190, axes: 'box', xlabel: 'time (ms)', yticks: [], full: true, title: 'waveform: envelope (green dashes) repeats every 1/g = 5 ms; gold: the crest under each envelope peak' });
        v.render(() => {
          const N = nS.value, d = dS.value, fs = comps(), sv = sieve(), pa = acPitch();
          // ---- pitch-shift diagram
          for (const n of [N - 1, N, N + 1]) {
            pd.fn((x) => (N * G + x) / n, { domain: [0, 200], color: n === N ? 'ink' : 'muted', width: n === N ? 1.8 : 1.2, dash: n === N ? false : [5, 4] });
            const yEnd = (N * G + 200) / n; if (yEnd < 260 && yEnd > 152) pd.text(`n = ${n}`, 198, yEnd, { align: 'right', baseline: 'bottom', color: 'muted', size: 10.5, dy: -2 });
          }
          pd.hline(G, { color: 'green', width: 1.4, dash: [7, 4] });
          pd.text('spacing g', 4, G - 2, { color: 'green', size: 11, align: 'left', baseline: 'top' });
          pd.vline(d, { color: 'faint', width: 1.2 });
          pd.dot(d, sv.p, { r: 6, color: 'accent' });
          pd.dot(d, pa, { r: 4.5, color: 'gold' });
          pd.hline(uS.value, { color: 'orange', width: 1.2, alpha: 0.8 });
          pd.text('your match', 198, uS.value, { color: 'orange', size: 10.5, align: 'right', baseline: 'top', dy: 2 });
          // ---- partials and template
          for (let k = 1; k * sv.p < 3400; k++) ps.line(k * sv.p, 0, k * sv.p, 1.08, { color: 'accent', width: 1, alpha: 0.35 });
          for (let k = 1; k * G < 3400; k++) ps.line(k * G, -0.1, k * G, -0.02, { color: 'green', width: 1.5 });
          fs.forEach((f) => { ps.line(f, 0, f, 1, { color: 'ink', width: 3 }); ps.dot(f, 1, { r: 4, color: 'ink' }); });
          ps.text(`template p = ${v.fix(sv.p, 1)} Hz`, 60, 1.17, { color: 'accent', size: 11.5, weight: 600, align: 'left' });
          ps.hline(0, { color: 'muted', width: 1 });
          // ---- waveform: envelope period 1/g, fine-structure peaks
          const w = (tms) => { const t = tms / 1000; return fs.reduce((s, f) => s + Math.cos(TAU * f * t), 0) / 3; };
          wv.fn(w, { domain: [0, 15], n: 2400, color: 'accent', width: 1.2 });
          const env = (tms) => Math.abs(1 + 2 * Math.cos(TAU * G * tms / 1000)) / 3;
          wv.fn(env, { domain: [0, 15], n: 400, color: 'green', width: 1.4, dash: [5, 4] });
          let prev = null;
          for (let k = 0; k * 5 <= 15; k++) { // the tallest fine-structure peak under each envelope maximum
            const fcm = fs[1] / 1000; let at = Math.round(k * 5 * fcm) / fcm; if (at > 15) at -= 1 / fcm; const best = w(at); // the carrier crest nearest the envelope maximum
            wv.dot(at, best, { r: 4, color: 'gold' });
            if (prev != null) wv.text(`${v.fix(at - prev, 3)} ms`, (at + prev) / 2, 1.18, { align: 'center', color: 'gold', size: 10.5, weight: 600 });
            prev = at;
          }
          
        });
        v.legend([['accent', 'best-fitting template'], ['gold', 'autocorrelation estimate'], ['green', 'spacing g (envelope)'], ['orange', 'your match']]);
        v.readout(() => {
          const N = nS.value, d = dS.value, fs = comps(), sv = sieve(), pa = acPitch(), boer = (N * G + d) / N;
          return `partials ${fs.map((f) => v.fix(f, 0)).join(', ')} Hz, spacing ${G} Hz · de Boer: $p\\approx(Ng+\\Delta)/N$ = ${v.fix(boer, 1)} Hz · best-fitting template ${v.fix(sv.p, 1)} Hz (as harmonics ${sv.ns.join(', ')}) · autocorrelation peak ${v.fix(pa, 1)} Hz · pitch moved ${v.fix(sv.p - G, 1)} Hz for a ${v.fix(d, 0)} Hz shift (ratio ${v.fix((sv.p - G) / Math.max(1, d), 3)}, about 1/${N}) · your match ${v.fix(uS.value, 1)} Hz`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Method',
      name: 'Additive synthesis',
      statement: String.raw`**Additive synthesis** builds a sound as a sum of sinusoidal oscillators, each with its own frequency and its own amplitude envelope:
$$y(t)=\sum_{n=1}^{N}a_n(t)\cos\big(2\pi f_nt+\varphi_n\big).$$
With $f_n=nf_0$ and constant $a_n$ it reproduces any periodic tone to any accuracy (4.2). For a fixed number of oscillators, the mean-square error is smallest when the $a_n$ are the Fourier amplitudes of the target, and the error then equals the energy of the omitted harmonics (Parseval, 4.4). Giving each partial its own envelope reproduces attacks and decays (4.8). Moving the $f_n$ off the harmonic positions makes the tone inharmonic, bell-like or metallic.`,
      idea: String.raw`Truncating a Fourier series is an orthogonal projection onto the span of the first $N$ harmonics. The partial sum is the closest point (pma-8.11), and the squared distance is the tail $\tfrac12\sum_{n>N}A_n^2$ (pma-8.15, Parseval), so the error falls as fast as the target's spectrum does (4.3). Any other choice of amplitudes adds the squared differences on top. Time-varying envelopes leave this harmonic-by-harmonic bookkeeping intact over short windows, which is how analysis–resynthesis works: measure $a_n(t)$ and $f_n(t)$ from a recording, then play them back. Risset's trumpet and bell studies (1964–69) and Grey's resynthesised orchestral tones (1975) were done this way. Inharmonic partials destroy the periodicity, and with it the sense of a single pitch (4.12).`,
      caption: String.raw`Choose a target (measured SHARC spectra at E4) and the number of oscillators $N$. Top left: one period of the target (dashed) and of the $N$-oscillator sum. Top right: the relative error against $N$ (log scale), computed both from the waveform and as the omitted energy (Parseval); switch on **level errors** to see that any other amplitudes do worse. Bottom: the oscillator bank, one row per partial, with its envelope over the first second (choose steady, brass-like or plucked envelopes) and its frequency. **Stretch** the partials, $f_n=f_0\,n^{1+s}$: the periods stop repeating and the tone turns bell-like. *Build up* plays $N$ = 1, 2, 3, 4, 6, 9, 14, 24.`,
      deps: ['music-4.2', 'music-4.8', 'pma-8.11', 'pma-8.15'],
      see: ['music-4.4', 'music-4.14', 'music-3.12', 'sig-4.5'],
      refs: ['Benson ch. 8'],
      tags: ['synthesis'],
      credit: 'Telharmonium (Cahill), 1897; Hammond organ, 1935; computer additive synthesis: Risset, 1964–69; Grey & Moorer, 1975–77',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Additive_synthesis' },
      viz(v) {
        const M = v.M, NB = 24, TG = ['clarinet', 'trumpet', 'violin', 'oboe', 'flute'];
        const tS = v.select('target', TG.map((k) => ({ value: k, label: SHORT[k] })), 'clarinet');
        const nS = v.slider('oscillators $N$', 1, NB, 6, { int: true });
        const eS = v.select('envelopes', [{ value: 'steady', label: 'steady' }, { value: 'brass', label: 'brass-like' }, { value: 'pluck', label: 'plucked' }], 'steady');
        const sS = v.slider('stretch $s$', 0, 0.08, 0, { step: 0.001, fmt: (x) => (x ? v.fix(x, 3) : 'harmonic') });
        const err = v.toggle('level errors (±3 dB, random)', false);
        const target = () => { const S = sharc(tS.value, 'E4'); const n = Math.min(NB, S.n); return { f0: S.f, A: S.amp.slice(0, n), P: S.ph.slice(0, n), all: S }; };
        const pert = M.range(NB).map((i) => 10 ** ((3 * Math.sin(12.9898 * (i + 1)) * Math.cos(78.233 * (i + 1))) / 20));
        const amps = (T, N) => T.A.map((a, i) => (i < N ? a * (err.value ? pert[i] : 1) : 0));
        const fr = (n, f0) => f0 * n ** (1 + sS.value);
        const envOf = (n) => eS.value === 'steady' ? (t) => Math.min(1, t / 0.04) : eS.value === 'brass' ? (t) => M.smoothstep(0, 1, (t - 0.007 * (n - 1)) / (0.03 + 0.006 * n)) : (t) => Math.min(1, t / 0.002) * Math.exp(-(1.2 + 0.0035 * n * 330) * t);
        const relErr = (T, a) => { // waveform error over one period (harmonic case), relative to the target's RMS
          const K = 512; let e = 0, s = 0;
          for (let i = 0; i < K; i++) { const u = i / K; let y = 0, z = 0; for (let n = 0; n < T.all.n; n++) { const c = Math.cos(TAU * (n + 1) * u + T.all.ph[n]); y += T.all.amp[n] * c; if (n < a.length) z += a[n] * c; } e += (y - z) ** 2; s += y * y; }
          return Math.sqrt(e / s);
        };
        const tone = (N, dur = 1.3) => { const T = target(), a = amps(T, N); return toRms(partials(a.map((x, i) => ({ f: fr(i + 1, T.f0), a: x, ph: T.P[i], env: envOf(i + 1) })), dur, { rel: 0.1 }), 0.14); };
        v.soundButton('Listen', (snd) => snd.samples(tone(nS.value), SR, { gain: 0.9 }));
        v.soundButton('Build up', (snd) => snd.samples(join([1, 2, 3, 4, 6, 9, 14, 24].map((N) => tone(N, 0.6)), 0.1), SR, { gain: 0.9 }));
        const wv = v.stage({ x: [0, 1], y: [-1.25, 1.3], height: 240, axes: false, weight: 1, title: 'target (dashed) and the sum' });
        const es = v.stage({ x: [0, NB + 1], y: [-3.3, 0.25], height: 240, axes: 'box', xlabel: 'oscillators N', xticks: [1, 4, 8, 12, 16, 20, 24], yticks: [[0, '100%'], [-1, '10%'], [-2, '1%'], [-3, '0.1%']], weight: 1, title: 'relative rms error (log scale)' });
        const bank = v.stage({ x: [-0.16, 1.32], y: [0, NB + 1.7], height: 330, axes: false, full: true, title: 'the oscillator bank: envelope of each partial over 1 s' });
        v.render(() => {
          const T = target(), N = nS.value, a = amps(T, N), s = sS.value;
          // ---- one period (or three overlaid when stretched)
          let mx = 1e-9; const tgt = (u) => { let y = 0; for (let n = 0; n < T.all.n; n++) y += T.all.amp[n] * Math.cos(TAU * (n + 1) * u + T.all.ph[n]); return y; };
          for (let i = 0; i < 300; i++) mx = Math.max(mx, Math.abs(tgt(i / 300)));
          wv.hline(0, { color: 'faint', width: 1 });
          wv.fn((u) => tgt(u) / mx, { domain: [0, 1], n: 500, color: 'muted', width: 1.6, dash: [6, 4] });
          const sum = (u) => { let y = 0; for (let n = 0; n < N; n++) y += a[n] * Math.cos(TAU * (fr(n + 1, 1)) * u + T.P[n]); return y / mx; };
          const reps = s > 0 ? [0, 3, 9] : [0];
          reps.forEach((k, j) => wv.fn((u) => sum(u + k), { domain: [0, 1], n: 500, color: j === 0 ? 'accent' : j === 1 ? 'purple' : 'pink', width: j === 0 ? 2.4 : 1.6, alpha: j === 0 ? 1 : 0.85 }));
          if (s > 0) wv.corner('periods 1, 4 and 10 overlaid: they no longer agree', 'bl', { color: 'purple', size: 11, plate: true });
          wv.corner(`${SHORT[tS.value]} E4, ${N} oscillator${N > 1 ? 's' : ''}`, 'tl', { color: 'ink', weight: 600 });
          // ---- error curve (Parseval) and the perturbed point
          const E = T.A.reduce((x, y) => x + y * y, 0) + T.all.amp.slice(T.A.length).reduce((x, y) => x + y * y, 0);
          const pts = []; for (let k = 1; k <= NB; k++) { let kept = 0; for (let n = 0; n < Math.min(k, T.A.length); n++) kept += T.A[n] ** 2; pts.push([k, Math.log10(Math.max(1e-4, Math.sqrt(Math.max(0, 1 - kept / E))))]); }
          es.path(pts, { color: 'accent', width: 1.8 }); es.dots(pts, { r: 2.5, color: 'accent' });
          es.dot(N, pts[N - 1][1], { r: 6, color: 'accent' });
          if (err.value) { const re = relErr(T, a); es.dot(N, Math.log10(Math.max(1e-4, re)), { r: 6, color: 'red' }); es.text('with level errors', N + 0.6, Math.log10(Math.max(1e-4, re)), { color: 'red', size: 11, align: 'left' }); }
          // ---- oscillator bank
          const top = Math.max(...T.A), rowH = 0.85;
          for (let n = 1; n <= NB; n++) {
            const y0 = NB + 0.6 - n, onN = n <= N && n <= T.A.length, lev = onN ? a[n - 1] / top : 0, h = rowH * Math.max(0, (dB(lev) + 50) / 50), ev = envOf(n);
            bank.line(0, y0, 1, y0, { color: 'faint', width: 0.8 });
            if (onN && h > 0.01) { const pts2 = M.range(81).map((i) => [i / 80, y0 + h * ev(i / 80)]); bank.poly([[0, y0], ...pts2, [1, y0]], { fill: n % 2 ? 'accent' : 'teal', fillAlpha: 0.55, color: n % 2 ? 'accent' : 'teal', width: 1 }); }
            bank.text(String(n), -0.02, y0 + 0.3, { align: 'right', color: onN ? 'ink' : 'faint', size: 10.5 });
            const f = fr(n, T.f0), dc = 1200 * Math.log2(f / (n * T.f0));
            if (n <= T.A.length) bank.text(`${v.fix(f, 0)} Hz${s > 0 && n > 1 ? ` (+${v.fix(dc, 0)} ¢)` : ''}`, 1.02, y0 + 0.3, { align: 'left', color: onN ? (s > 0 ? 'purple' : 'ink') : 'faint', size: 10.5 });
          }
          bank.text('row height: level (50 dB range)', 0.5, NB + 1.15, { align: 'center', color: 'muted', size: 10.5 });
        });
        v.legend([['accent', 'sum of $N$ oscillators'], ['muted', 'target (all measured harmonics)', { dash: true }], ['red', 'with random level errors']]);
        v.readout(() => {
          const T = target(), N = nS.value, a = amps(T, N);
          const E = T.all.amp.reduce((x, y) => x + y * y, 0); let kept = 0; for (let n = 0; n < Math.min(N, T.A.length); n++) kept += T.A[n] ** 2;
          const par = Math.sqrt(Math.max(0, 1 - kept / E)), wave = relErr(T, T.A.map((x, i) => (i < N ? x : 0)));
          const st = sS.value ? ` · stretch: partial 10 is ${v.fix(1200 * Math.log2(10 ** sS.value), 0)} ¢ sharp of 10·f₀, so the tone is no longer periodic` : '';
          return `$N$ = ${N}: rms error ${v.fix(100 * wave, 2)}% measured on the waveform, ${v.fix(100 * par, 2)}% from the omitted energy (Parseval)${err.value ? ` · with ±3 dB level errors: ${v.fix(100 * relErr(T, a), 2)}%, worse, as the projection theorem says` : ''}${st}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Method',
      name: 'FM synthesis',
      statement: String.raw`In **frequency-modulation synthesis** a carrier of frequency $f_c$ is phase-modulated by a sinusoid of frequency $f_m$ with **modulation index** $I$:
$$y(t)=\sin\!\big(2\pi f_ct+I\sin2\pi f_mt\big)=\sum_{k=-\infty}^{\infty}J_k(I)\,\sin\!\big(2\pi(f_c+kf_m)t\big),$$
where $J_k$ are Bessel functions of the first kind. The spectrum has lines at $f_c\pm kf_m$ with amplitudes $|J_k(I)|$; lines at negative frequencies fold back with a sign change. Practically all the power lies within $|k|\le I+1$ (Carson's rule), and $\sum_kJ_k(I)^2=1$. If $f_c:f_m=p:q$ in lowest terms, all lines are multiples of $f_c/p$ and the tone is harmonic with fundamental $f_c/p$. An irrational ratio gives inharmonic, bell- or gong-like spectra. Varying $I$ in time makes the brightness evolve with a single control.`,
      idea: String.raw`The generating function of the Bessel functions is $e^{i\,I\sin\theta}=\sum_kJ_k(I)e^{ik\theta}$ (the Jacobi–Anger expansion). Multiplying by $e^{2\pi if_ct}$ and taking imaginary parts gives the sideband series. For small $I$ only $J_0\approx1$ and $J_{\pm1}\approx\pm I/2$ matter, a carrier with two weak sidebands. As $I$ grows the energy spreads outward, and individual lines vanish at the zeros of $J_k$; the carrier itself disappears at $I\approx2.405$. Chowning (1973) saw that this cheap computation, two oscillators, gives rich, controllable spectra. Brass tones come from $1:1$ with $I$ rising with loudness, clarinet-like ones from $1:2$ (odd harmonics only), and bells from non-integer ratios with $I$ decaying. Stanford licensed the patent to Yamaha, whose DX7 (1983) made FM the sound of the 1980s.`,
      caption: String.raw`Choose a preset or set the carrier, the ratio $f_m/f_c$ and the index $I$. Top: the spectrum, with each line's height $|J_k(I)|$ coloured by its order $k$. Folded lines from negative frequencies are drawn hollow, and the band of Carson's rule is shaded. Bottom left: the Bessel functions $J_0,\dots,J_4$ against $I$, with the current index marked; a sideband vanishes where its curve crosses zero. Bottom right: the waveform. *Listen* plays the preset with its time-varying index (a bell's brightness decays, brass brightens as it swells); *hold* plays the static spectrum while you drag.`,
      deps: ['music-4.5'],
      see: ['sig-12.7', 'sig-12.8', 'music-3.7', 'music-4.16', 'music-3.12'],
      refs: ['Benson ch. 8', 'Benson ch. 2'],
      tags: ['synthesis', 'bessel'],
      credit: 'John Chowning, “The synthesis of complex audio spectra by means of frequency modulation”, 1973; Yamaha DX7, 1983',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frequency_modulation_synthesis' },
      viz(v) {
        const M = v.M, KM = 18;
        const PRE = {
          brass: { fc: 440, r: 1, I: 5, Ienv: (t, d) => 5 * Math.min(1, t / 0.08) * (t > d - 0.15 ? Math.max(0, (d - t) / 0.15) : 1), Aenv: (t, d) => Math.min(1, t / 0.06) * (t > d - 0.15 ? Math.max(0, (d - t) / 0.15) : 1), dur: 1.2 },
          clar: { fc: 330, r: 2, I: 2, Ienv: (t) => 2 * Math.min(1, t / 0.05), Aenv: (t, d) => Math.min(1, t / 0.05) * (t > d - 0.1 ? Math.max(0, (d - t) / 0.1) : 1), dur: 1.2 },
          bell: { fc: 440, r: 1.4, I: 10, Ienv: (t) => 10 * Math.exp(-t / 0.7), Aenv: (t) => Math.min(1, t / 0.002) * Math.exp(-t / 1.1), dur: 3.5 },
          gong: { fc: 150, r: Math.SQRT2, I: 8, Ienv: (t) => 8 * Math.exp(-t / 1.6), Aenv: (t) => Math.min(1, t / 0.004) * Math.exp(-t / 1.6), dur: 4 },
          wood: { fc: 200, r: 1.4, I: 12, Ienv: (t) => 12 * Math.exp(-t / 0.03), Aenv: (t) => Math.min(1, t / 0.001) * Math.exp(-t / 0.12), dur: 0.8 },
        };
        const pre = v.select('preset', [{ value: 'brass', label: 'brass 1:1' }, { value: 'clar', label: 'clarinet 1:2' }, { value: 'bell', label: 'bell 1:1.4' }, { value: 'gong', label: 'gong 1:√2' }, { value: 'wood', label: 'woodblock' }], 'bell', { onChange: (x) => { const p = PRE[x]; cS.set(p.fc); rS.set(p.r); iS.set(p.I); sync(); } });
        const cS = v.slider('carrier $f_c$', 100, 1000, 440, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz`, onChange: () => sync() });
        const rS = v.slider('ratio $f_m/f_c$', 0.25, 4, 1.4, { step: 0.001, fmt: (x) => v.fix(x, 3), onChange: () => sync() });
        const iS = v.slider('index $I$', 0, 15, 10, { step: 0.01, fmt: (x) => v.fix(x, 2), onChange: () => sync() });
        const lines = () => { // fold negative frequencies with a sign change; merge coincident lines
          const fc = cS.value, fm = fc * rS.value, I = iS.value, map = new Map();
          for (let k = -KM - 8; k <= KM + 8; k++) { const f = fc + k * fm, a = besselJ(k, I); const key = Math.abs(f).toFixed(4); const e = map.get(key) || { f: Math.abs(f), a: 0, ks: [], folded: false }; e.a += f < 0 ? -a : a; e.ks.push(k); if (f < 0) e.folded = true; map.set(key, e); }
          return [...map.values()].filter((e) => e.f > 0.5);
        };
        const ratioPQ = () => { const r = rS.value; for (let q = 1; q <= 12; q++) { const p = Math.round(r * q); if (p > 0 && Math.abs(r - p / q) < 0.0025) { const g = M.gcd(p, q); return [p / g, q / g]; } } return null; };
        const lv = loopVoice(v);
        const loopBuf = () => { const L = 1, n = Math.round(L * SR), out = new Float32Array(n); for (const e of lines()) { if (Math.abs(e.a) < 1e-4 || e.f > 0.45 * SR) continue; const fq = Math.round(e.f * L) / L, w = (TAU * fq) / SR; for (let i = 0; i < n; i++) out[i] += 0.2 * e.a * Math.sin(w * i); } return out; };
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('Listen', (snd) => {
          const p = PRE[pre.value] || PRE.bell, fc = cS.value, fm = fc * rS.value, k = iS.value / p.I, d = p.dur, n = Math.round(d * SR), out = new Float32Array(n);
          let pc = 0, pm = 0; const wc = (TAU * fc) / SR, wm = (TAU * fm) / SR;
          for (let i = 0; i < n; i++) { const t = i / SR; out[i] = p.Aenv(t, d) * Math.sin(pc + k * p.Ienv(t, d) * Math.sin(pm)); pc += wc; pm += wm; }
          snd.samples(finish(out, 0.7, SR, 0.0005, 0.05), SR, { gain: 0.8 });
        });
        const sp = v.stage({ x: [0, 4000], y: [-0.08, 1.12], height: 250, axes: 'box', xlabel: 'frequency (Hz)', yticks: [[0.5, '0.5'], [1, '1']], full: true, title: 'spectrum: lines at $f_c+kf_m$ with heights $|J_k(I)|$' });
        const bs = v.stage({ x: [0, 15], y: [-0.5, 1.05], height: 220, axes: 'box', xlabel: 'index I', weight: 1.1, title: 'Bessel functions $J_0,\\dots,J_4$' });
        const ws = v.stage({ x: [0, 5], y: [-1.2, 1.2], height: 220, axes: 'box', xlabel: 'time (ms)', yticks: [], weight: 1, title: 'waveform' });
        const KC = ['ink', 'accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        v.render(() => {
          const fc = cS.value, fm = fc * rS.value, I = iS.value, L = lines(), pq = ratioPQ();
          const fmax = Math.min(8000, Math.max(1500, fc + (I + 3) * fm)); sp.setView([0, fmax], [-0.08, 1.12]);
          sp.vband(Math.max(0, fc - (I + 1) * fm), fc + (I + 1) * fm, { color: 'gold', alpha: 0.09 });
          if (pq && fc / pq[0] >= 80) { const f0 = fc / pq[0]; for (let k = 1; k * f0 < fmax; k++) sp.line(k * f0, -0.07, k * f0, -0.02, { color: 'green', width: 1.5 }); }
          for (const e of L) { if (e.f > fmax || Math.abs(e.a) < 0.004) continue; const k = e.ks.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a)); const col = KC[Math.min(KC.length - 1, Math.abs(k))]; sp.line(e.f, 0, e.f, Math.abs(e.a), { color: col, width: 2.4 }); sp.dot(e.f, Math.abs(e.a), { r: 4, color: col, hollow: e.folded }); }
          sp.hline(0, { color: 'muted', width: 1 });
          sp.vline(fc, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.5 });
          const harmonicQ = pq && pq[0] <= 4; sp.corner(harmonicQ ? `ratio ${pq[1]}:${pq[0]} → harmonic, fundamental ${v.fix(fc / pq[0], 1)} Hz (green ticks)` : pq ? `ratio ${pq[1]}:${pq[0]}: common fundamental only ${v.fix(fc / pq[0], 1)} Hz, heard as inharmonic (bell-like)` : 'irrational ratio → inharmonic', 'tr', { color: harmonicQ ? 'green' : 'red', weight: 600, plate: true });
          // ---- Bessel curves
          bs.hline(0, { color: 'faint', width: 1 });
          for (let k = 0; k <= 4; k++) { bs.fn((x) => besselJ(k, x), { domain: [0, 15], n: 300, color: KC[k], width: 1.8 }); bs.dot(I, besselJ(k, I), { r: 4.5, color: KC[k] }); }
          bs.vline(I, { color: 'gold', width: 1.6 });
          bs.text('J₀', 0.3, 0.98, { color: KC[0], size: 12, align: 'left' });
          [[1, 1.84, 0.62], [2, 3.05, 0.53], [3, 4.2, 0.48], [4, 5.32, 0.44]].forEach(([k, x, y]) => bs.text(`J${'₀₁₂₃₄'[k]}`, x, y + 0.07, { color: KC[k], size: 12, align: 'center' }));
          // ---- waveform
          ws.hline(0, { color: 'faint', width: 1 });
          ws.fn((tms) => Math.sin(TAU * fc * tms / 1000 + I * Math.sin(TAU * fm * tms / 1000)), { domain: [0, 5], n: 2000, color: 'accent', width: 1.4 });
        });
        v.legend([['ink', '$k=0$ (carrier)'], ['accent', '$|k|=1$'], ['orange', '$|k|=2$'], ['green', '$|k|=3$'], ['purple', '$|k|=4$'], ['gold', 'Carson band $|k|\\le I+1$', { area: true }]]);
        v.readout(() => {
          const fc = cS.value, fm = fc * rS.value, I = iS.value, L = lines(); let p = 0, pin = 0;
          for (const e of L) { p += e.a * e.a; if (Math.abs(e.f - fc) <= (I + 1) * fm + 1e-6) pin += e.a * e.a; }
          let sum = 0; for (let k = -40; k <= 40; k++) sum += besselJ(k, I) ** 2;
          const sig = L.filter((e) => Math.abs(e.a) > 0.01).length, pq = ratioPQ();
          return `$f_c$ = ${v.fix(fc, 0)} Hz, $f_m$ = ${v.fix(fm, 1)} Hz, $I$ = ${v.fix(I, 2)} · $\\sum_kJ_k(I)^2$ = ${v.fix(sum, 6)} · Carson band ${v.fix(Math.max(0, fc - (I + 1) * fm), 0)}–${v.fix(fc + (I + 1) * fm, 0)} Hz holds ${v.fix((100 * pin) / p, 1)}% of the power · ${sig} lines above 1% · carrier level $|J_0(I)|$ = ${v.fix(Math.abs(besselJ(0, I)), 3)}${Math.abs(besselJ(0, I)) < 0.03 ? ' (near a zero of $J_0$: the carrier has vanished)' : ''}${pq && pq[0] <= 4 ? ` · harmonic, fundamental ${v.fix(fc / pq[0], 1)} Hz (${noteOf(M, fc / pq[0])})` : pq ? ` · strictly periodic at ${v.fix(fc / pq[0], 1)} Hz, but the lines are a sparse, irregular subset of that series, so the ear hears no such pitch` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Model',
      name: 'Timbre space: brightness, attack and spectral flux',
      statement: String.raw`Listeners' judgements of how similar two instrument tones are (at equal pitch, loudness and duration) can be summarised by placing the tones as points in a low-dimensional **timbre space**, so that distance reflects dissimilarity. Multidimensional scaling of such judgements (Grey, 1977; McAdams et al., 1995) repeatedly finds three main dimensions, correlated with measurable features:
- **brightness**, the spectral centroid $\bar f=\sum_kf_k|X_k|^2\big/\sum_k|X_k|^2$ averaged over the tone;
- **attack**, the logarithm of the rise time;
- **spectral flux**, how much the shape of the spectrum changes from moment to moment.

The model predicts that changing one feature (brightening a spectrum, sharpening an attack) moves a tone through the space towards other instruments.`,
      idea: String.raw`Multidimensional scaling turns a table of perceived dissimilarities into a configuration of points whose distances reproduce them as well as possible, without saying beforehand what the axes mean. The axes are interpreted afterwards by correlating point positions with acoustic descriptors. The spectral centroid follows from the steady spectrum (4.1), rise time from the envelope (4.8), and flux from frame-to-frame changes in a short-time spectrum (4.7). Different studies and tone sets give somewhat different spaces, with extra "specificities" for individual instruments, but brightness and attack recur in nearly all of them. In the McAdams et al. study the third dimension was spectral flux, in others spectral irregularity.`,
      caption: String.raw`Ten synthetic tones at E4, each built from a measured SHARC spectrum with a modelled attack and fluctuation (illustrative values, not Grey's or McAdams's stimuli). Every coordinate is measured from the synthesized sound: centroid and flux from its short-time spectrum, attack time from its envelope (10% → 90% of peak). Drag the 3-D view to rotate it; the panel on the right is the attack–brightness plane, where you can click a tone to select it. Edit the selected tone with the sliders (tilt its spectrum brighter or darker, change its attack, add fluctuation) and watch it travel from its original position (hollow) towards new neighbours. *Listen* to it, or play it beside its nearest neighbours.`,
      deps: ['music-4.1', 'sig-8.13', 'music-4.8'],
      see: ['psych-3.10', 'music-4.13'],
      refs: ['Sethares ch. 2'],
      tags: ['timbre', 'perception'],
      credit: 'Grey, 1977; Krumhansl, 1989; McAdams, Winsberg, Donnadieu, De Soete & Krimphoff, 1995',
      scope: String.raw`A model of similarity judgements for isolated, sustained tones matched in pitch, loudness and duration. The dimensions and their acoustic correlates depend on the set of tones and on the listeners. The space describes timbre, it does not explain it.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Timbre#Timbre_space' },
      viz(v) {
        const M = v.M, SR2 = 22050, DUR = 0.9, KEYS = ['flute', 'oboe', 'clarinet', 'bassoon', 'horn', 'trumpet', 'trombone', 'violin', 'cello', 'pizz'];
        const FAM = { flute: 'accent', oboe: 'accent', clarinet: 'accent', bassoon: 'accent', horn: 'orange', trumpet: 'orange', trombone: 'orange', violin: 'green', cello: 'green', pizz: 'green' };
        // attack (s) and fluctuation (0–1) of each model: typical values, illustrative
        const BASE = { flute: [0.09, 0.45], oboe: [0.045, 0.2], clarinet: [0.035, 0.08], bassoon: [0.05, 0.15], horn: [0.07, 0.1], trumpet: [0.035, 0.25], trombone: [0.05, 0.2], violin: [0.12, 0.6], cello: [0.14, 0.55], pizz: [0.002, 0.9] };
        const ed = {}; KEYS.forEach((k) => { ed[k] = { tilt: 0, att: BASE[k][0], flux: BASE[k][1] }; });
        const selS = v.select('tone', KEYS.map((k) => ({ value: k, label: SHORT[k] })), 'clarinet', { onChange: (k) => { tiltS.set(ed[k].tilt); attS.set(ed[k].att * 1000); fluxS.set(ed[k].flux); } });
        const tiltS = v.slider('spectral tilt', -6, 6, 0, { step: 0.1, fmt: (x) => (x > 0 ? '+' : x < 0 ? '−' : '±') + v.fix(Math.abs(x), 1) + ' dB/oct', onChange: (x) => { ed[selS.value].tilt = x; } });
        const attS = v.slider('attack time', 2, 300, ed.clarinet.att * 1000, { log: true, fmt: (x) => v.fix(x, 0) + ' ms', onChange: (x) => { ed[selS.value].att = x / 1000; } });
        const fluxS = v.slider('fluctuation', 0, 1, ed.clarinet.flux, { step: 0.01, onChange: (x) => { ed[selS.value].flux = x; } });
        v.button('Reset this tone', () => { const k = selS.value; ed[k] = { tilt: 0, att: BASE[k][0], flux: BASE[k][1] }; tiltS.set(0); attS.set(ed[k].att * 1000); fluxS.set(ed[k].flux); });
        const synthTone = (k, p) => {
          const S = sharc(k, 'E4'), n = Math.round(DUR * SR2), out = new Float32Array(n), pl = k === 'pizz';
          for (let h = 1; h <= S.n; h++) {
            const f = h * S.f; if (f > 0.45 * SR2) break;
            const a = S.amp[h - 1] * h ** (p.tilt / 6.02), w = (TAU * f) / SR2, r1 = 3.1 + 1.7 * h, r2 = 5.3 + 0.9 * h, ph1 = 1.3 * h, ph2 = 2.7 * h, dep = 0.9 * p.flux;
            for (let i = 0; i < n; i++) {
              const t = i / SR2, att = pl ? Math.min(1, t / Math.max(0.0015, p.att)) * Math.exp(-(2 + 0.004 * f) * t) : M.smoothstep(0, 1, t / p.att);
              const fl = 1 + dep * (0.6 * Math.sin(TAU * r1 * t + ph1) + 0.4 * Math.sin(TAU * r2 * t + ph2)) * (pl ? 0 : 1);
              out[i] += a * att * Math.max(0, fl) * Math.cos(w * i + S.ph[h - 1]);
            }
          }
          const R = Math.round(0.06 * SR2); for (let i = 0; i < R; i++) out[n - 1 - i] *= i / R;
          return out;
        };
        const features = (buf) => {
          const S = stft(M, buf, SR2, { win: 0.023, hop: 0.01, fmax: 8000, pad: 1 }); let cs = 0, cw = 0, flux = 0, nf = 0, prev = null;
          for (let f = 0; f < S.nT; f++) {
            const row = new Float64Array(S.nb); let tot = 0; for (let b = 1; b < S.nb; b++) { row[b] = 10 ** (S.db[f * S.nb + b] / 20); tot += row[b] ** 2; }
            const t = f * S.dt; if (tot < 1e-10) { prev = null; continue; }
            const nrm = Math.sqrt(tot); for (let b = 1; b < S.nb; b++) row[b] /= nrm;
            if (t > 0.03 && t < DUR - 0.1) { let c = 0; for (let b = 1; b < S.nb; b++) c += b * S.df * row[b] ** 2; cs += c * tot; cw += tot; if (prev) { let d = 0; for (let b = 1; b < S.nb; b++) d += (row[b] - prev[b]) ** 2; flux += Math.sqrt(d); nf++; } }
            prev = row;
          }
          const fr = Math.round(0.002 * SR2), env = []; for (let i = 0; i + fr <= buf.length; i += fr) { let s = 0; for (let j = 0; j < fr; j++) s += buf[i + j] ** 2; env.push(Math.sqrt(s / fr)); }
          const pk = Math.max(...env), i10 = env.findIndex((e) => e >= 0.1 * pk), i90 = env.findIndex((e) => e >= 0.9 * pk);
          return { cen: cs / cw, lat: Math.log10(Math.max(0.001, ((i90 - i10) * fr) / SR2)), flux: flux / Math.max(1, nf) };
        };
        const cacheF = new Map(), base = {};
        const feat = (k) => { const p = ed[k], key = `${k}|${p.tilt}|${p.att}|${p.flux}`; if (!cacheF.has(key)) { if (cacheF.size > 80) cacheF.clear(); cacheF.set(key, features(synthTone(k, p))); } return cacheF.get(key); };
        KEYS.forEach((k) => { base[k] = features(synthTone(k, { tilt: 0, att: BASE[k][0], flux: BASE[k][1] })); });
        // normalise each axis over the original tones
        const ax = ['lat', 'cen', 'flux'], rng = {}; ax.forEach((a) => { const xs = KEYS.map((k) => base[k][a]); rng[a] = [Math.min(...xs), Math.max(...xs)]; });
        const nz = (F) => ax.map((a) => (2 * (F[a] - rng[a][0])) / (rng[a][1] - rng[a][0] || 1) - 1);
        const s3 = v.stage3d({ range: 1.75, height: 340, yaw: -0.75, pitch: 0.38, labels: null, weight: 1.15, minWidth: 300, title: 'timbre space (drag to rotate)' });
        const s2 = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.4], height: 340, axes: 'box', xticks: [], yticks: [], xlabel: 'log attack time →', ylabel: 'brightness →', weight: 1, minWidth: 280, title: 'attack against brightness (click a tone)' });
        s2.onClick((x, y) => { let best = null, bd = 0.25; for (const k of KEYS) { const [a, b] = nz(feat(k)); const d = Math.hypot(a - x, b - y); if (d < bd) { bd = d; best = k; } } if (best) { selS.set(best); tiltS.set(ed[best].tilt); attS.set(ed[best].att * 1000); fluxS.set(ed[best].flux); } });
        const near = (k) => { const p = nz(feat(k)); return KEYS.filter((q) => q !== k).map((q) => [q, Math.hypot(...nz(feat(q)).map((x, i) => x - p[i]))]).sort((a, b) => a[1] - b[1]); };
        v.soundButton('Listen', (snd) => snd.samples(toRms(synthTone(selS.value, ed[selS.value]), 0.14), SR2, { gain: 0.9 }));
        v.soundButton('with its nearest neighbours', (snd) => { const k = selS.value, nb = near(k).slice(0, 2).map((x) => x[0]); snd.samples(join([k, ...nb].map((q) => toRms(synthTone(q, ed[q]), 0.14)), 0.2, SR2), SR2, { gain: 0.9 }); });
        v.render(() => {
          const sel = selS.value;
          // ---- 3-D: box and axis labels
          const B = 1.15, cub = [[-B, -B, -B], [B, -B, -B], [B, B, -B], [-B, B, -B], [-B, -B, B], [B, -B, B], [B, B, B], [-B, B, B]];
          [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => s3.line(cub[a], cub[b], { color: 'faint', width: 1 }));
          s3.text('attack (log) →', [0, -B - 0.25, -B], { color: 'muted', size: 11.5 });
          s3.text('brightness →', [-B - 0.3, 0, -B], { color: 'muted', size: 11.5 });
          s3.text('flux ↑', [-B, -B, B + 0.18], { color: 'muted', size: 11.5 });
          for (const k of KEYS) {
            const p = nz(feat(k)), q = [p[0], p[1], p[2]], on = k === sel;
            s3.line([q[0], q[1], -B], q, { color: FAM[k], width: 1, alpha: 0.35, dash: [2, 3] });
            s3.dot(q, { r: on ? 7 : 5, color: on ? 'gold' : FAM[k] });
            s3.text(SHORT[k], [q[0], q[1], q[2] + 0.13], { color: on ? 'ink' : FAM[k], size: on ? 12.5 : 11 });
            if (on) { const o = nz(base[k]); if (Math.hypot(o[0] - p[0], o[1] - p[1], o[2] - p[2]) > 0.02) { s3.dot(o, { r: 5, color: 'muted', alpha: 0.6 }); s3.arrow(o, q, { color: 'gold', width: 1.8, head: 8 }); } }
          }
          // ---- 2-D plane
          s2.hline(0, { color: 'faint', width: 1 }); s2.vline(0, { color: 'faint', width: 1 });
          for (const k of KEYS) {
            const p = nz(feat(k)), on = k === sel;
            if (on) { const o = nz(base[k]); if (Math.hypot(o[0] - p[0], o[1] - p[1]) > 0.02) { s2.dot(o[0], o[1], { r: 5, color: 'muted', hollow: true }); s2.arrow(o[0], o[1], p[0], p[1], { color: 'gold', width: 1.8, head: 8 }); } }
            s2.dot(p[0], p[1], { r: on ? 7 : 5, color: on ? 'gold' : FAM[k], label: SHORT[k], labelPos: p[0] > 0.6 ? 'w' : 'e' });
          }
        });
        v.legend([['accent', 'woodwinds'], ['orange', 'brass'], ['green', 'strings'], ['gold', 'selected tone, and its path when edited']]);
        v.readout(() => {
          const k = selS.value, F = feat(k), nb = near(k), nb0 = (() => { const p = nz(base[k]); return KEYS.filter((q) => q !== k).map((q) => [q, Math.hypot(...nz(base[q]).map((x, i) => x - p[i]))]).sort((a, b) => a[1] - b[1])[0]; })();
          return `${INST[k]}: spectral centroid ${v.fix(F.cen, 0)} Hz, attack ${v.fix(1000 * 10 ** F.lat, 0)} ms (log ${v.fix(F.lat, 2)}), spectral flux ${v.fix(F.flux, 3)} · nearest neighbour now: ${SHORT[nb[0][0]]} (distance ${v.fix(nb[0][1], 2)}), then ${SHORT[nb[1][0]]}${nb[0][0] !== nb0[0] ? ` · originally ${SHORT[nb0[0]]}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Phenomenon',
      name: 'Vibrato and tremolo',
      statement: String.raw`**Vibrato** is a slow periodic variation of pitch, and **tremolo** a slow periodic variation of loudness. A vibrato of rate $f_v$ and depth $\pm c$ cents makes harmonic $n$ swing by $\pm n\,f_0\,(2^{c/1200}-1)$ Hz: higher harmonics wobble proportionally more. Tremolo of depth $m$ multiplies the whole tone by $1+m\cos2\pi f_tt$. Performers use rates of about 5–7 Hz: singers typically ±50–100 cents, string players ±15–30. At such rates the ear hears one tone whose pitch or loudness wavers. As the rate rises past about 15–20 Hz the wavering can no longer be followed: the modulation is resolved instead as **sidebands** at $nf_0\pm kf_v$ (Bessel-weighted for vibrato, a pair of height $m/2$ for tremolo), heard as roughness and finally as separate partials.`,
      idea: String.raw`Vibrato is frequency modulation with a tiny index: harmonic $n$ has index $\beta_n=n\,\Delta f/f_v$, so its spectrum is a line with sidebands of heights $J_k(\beta_n)$ (4.14), and tremolo is amplitude modulation with sidebands at $\pm f_t$. Which description fits what we hear depends on the time window of the analysis (4.6). If the window is short compared with the modulation period, each frame sees a single slowly moving line, and that is how both the spectrogram and the ear follow a 6 Hz vibrato. If it is long, the frames resolve the sidebands. The cochlea's filters ring for a few milliseconds and the auditory system integrates over tens of milliseconds, so slow modulation is heard as motion and fast modulation as texture. Vibrato also helps a voice stand out and fuse: all its partials move together, which binds them into one source.`,
      caption: String.raw`Choose a preset or set vibrato rate and depth and tremolo rate and depth. Top: a spectrogram of 2 s of the tone (eight harmonics of 330 Hz, 46 ms window). At slow rates each harmonic wiggles, harmonic $n$ swinging $n$ times as far as the fundamental. Push the rate past 20 Hz and the wiggles dissolve into steady sideband lines. Bottom left: the exact spectrum of the chosen harmonic over the whole 2 s, with the predicted sideband heights $J_k(\beta_n)$ marked. Bottom right: the instantaneous frequency (blue) and amplitude (orange) of the fundamental over one second. Hold the tone and drag the rates to hear wobble turn into roughness.`,
      deps: ['sig-8.13', 'music-4.8'],
      see: ['music-4.14', 'sig-12.7', 'sig-12.1', 'music-6.1', 'music-5.4'],
      refs: ['Benson ch. 8'],
      tags: ['modulation', 'timbre'],
      credit: 'Seashore, Psychology of the vibrato in voice and instrument, 1936; Sundberg, The Science of the Singing Voice, 1987',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vibrato' },
      viz(v) {
        const M = v.M, SR2 = 22050, F0 = 330, L = 2, NH = 8;
        const PRE = { singer: [6, 70, 6, 0], violin: [5.5, 25, 5.5, 0], vibes: [5, 0, 5, 60], flutter: [28, 40, 5, 0], off: [5, 0, 5, 0] };
        const pre = v.select('preset', [{ value: 'singer', label: 'singer' }, { value: 'violin', label: 'violin' }, { value: 'vibes', label: 'vibraphone' }, { value: 'flutter', label: 'fast flutter' }, { value: 'off', label: 'plain' }], 'singer', { onChange: (x) => { const p = PRE[x]; vr.set(p[0]); vd.set(p[1]); tr.set(p[2]); td.set(p[3]); sync(); } });
        const vr = v.slider('vibrato rate', 0.5, 60, 6, { log: true, fmt: (x) => v.fix(q(x), 1) + ' Hz', onChange: () => sync() });
        const vd = v.slider('vibrato depth', 0, 150, 70, { step: 1, fmt: (x) => '±' + v.fix(x, 0) + ' ¢', onChange: () => sync() });
        const tr = v.slider('tremolo rate', 0.5, 60, 6, { log: true, fmt: (x) => v.fix(q(x), 1) + ' Hz', onChange: () => sync() });
        const td = v.slider('tremolo depth', 0, 100, 0, { step: 1, fmt: (x) => v.fix(x, 0) + '%', onChange: () => sync() });
        const hS = v.select('zoom on harmonic', [1, 2, 4, 8].map((n) => ({ value: n, label: String(n) })), 1);
        function q(x) { return Math.max(0.5, Math.round(x * L) / L); } // whole number of cycles in the 2 s loop
        const make = (sr) => {
          const n = Math.round(L * sr), out = new Float32Array(n), fv = q(vr.value), ft = q(tr.value), df = F0 * (2 ** (vd.value / 1200) - 1), m = td.value / 100;
          for (let i = 0; i < n; i++) {
            const t = i / sr, ph = TAU * F0 * t + (df / fv) * Math.sin(TAU * fv * t), g = (1 + m * Math.cos(TAU * ft * t)) / (1 + m);
            let y = 0; for (let h = 1; h <= NH; h++) y += Math.cos(h * ph) / h;
            out[i] = 0.25 * g * y;
          }
          return out;
        };
        let key = '', D = null;
        const data = () => {
          const k = [q(vr.value), vd.value, q(tr.value), td.value].join(); if (k === key) return D; key = k;
          const buf = make(SR2), S = stft(M, buf, SR2, { win: 0.046, hop: 0.008, fmax: 3000 });
          const re = Float64Array.from(buf), im = new Float64Array(buf.length); M.fft(re, im); // exact lines every 1/L Hz (the loop is periodic)
          D = { buf, S, re, im, N: buf.length };
          return D;
        };
        const lv = loopVoice(v);
        function sync() { lv.update(() => make(SR2), 0.8, SR2); v.invalidate(); }
        v.toggle('hold the tone', false, { onChange: (on) => { if (on) lv.start(make(SR2), 0.8, SR2); else lv.stop(); } });
        v.soundButton('Listen', (snd) => snd.samples(make(SR2), SR2, { gain: 0.8 }));
        const sg = v.stage({ x: [-0.08, L], y: [-180, 3000], height: 260, axes: 'box', xlabel: 'time (s)', xticks: [0, 0.5, 1, 1.5, 2], yticks: [[330, '330'], [990, '990'], [1650, '1650'], [2310, '2310 Hz']], full: true, title: 'spectrogram (46 ms window)' });
        const zs = v.stage({ x: [-60, 60], y: [-0.08, 1.12], height: 230, axes: 'box', xlabel: 'f − n·f₀ (Hz)', yticks: [[0.5, '½'], [1, '1']], weight: 1, title: 'exact spectrum around one harmonic' });
        const it = v.stage({ x: [0, 1], y: [-1.3, 1.3], height: 230, axes: 'box', xlabel: 'time (s)', yticks: [], weight: 1, title: 'the fundamental: frequency and amplitude' });
        v.render(() => {
          const d = data(), fv = q(vr.value), ft = q(tr.value), df = F0 * (2 ** (vd.value / 1200) - 1), m = td.value / 100, nZ = hS.value;
          drawSpec(v, sg, d.S, { range: 55, key });
          sg.axes();
          for (let h = 1; h <= NH; h++) if (df > 0) sg.text(`±${v.fix(h * df, 0)} Hz`, L - 0.01, h * F0 + 70, { align: 'right', color: 'ink', size: 10, plate: true });
          // ---- zoom: exact DFT lines every 0.5 Hz around harmonic nZ, normalised to the harmonic's unmodulated amplitude (1/n)
          const span = Math.max(30, Math.min(140, 3 * Math.max(fv, ft) + nZ * df * 1.6)), base = nZ * F0;
          zs.setView([-span, span], [-0.08, 1.12]);
          const kc = base * L, half = Math.round(span * L);
          for (let j = -half; j <= half; j++) { const b = kc + j; const a = (2 * Math.hypot(d.re[b], d.im[b])) / d.N / (0.25 / nZ) * (1 + m); if (a > 0.004) zs.line(j / L, 0, j / L, a, { color: 'accent', width: 2.2 }); }
          // predictions: FM sidebands J_k(β_n) at ±k f_v (tremolo absent), or AM sidebands m/2 (vibrato absent)
          const beta = (nZ * df) / fv;
          if (df > 0 && m === 0) for (let k = -12; k <= 12; k++) { const x = k * fv; if (Math.abs(x) <= span) zs.dot(x, Math.abs(besselJ(k, beta)), { r: 4, color: 'gold', hollow: true }); }
          if (m > 0 && df === 0) { zs.dot(0, 1, { r: 4, color: 'gold', hollow: true }); for (const s of [-1, 1]) zs.dot(s * ft, m / 2, { r: 4, color: 'gold', hollow: true }); }
          zs.hline(0, { color: 'muted', width: 1 });
          zs.corner(df > 0 ? `β = ${nZ}·Δf/f_v = ${v.fix(beta, 2)}` : m > 0 ? `tremolo sidebands at ±${v.fix(ft, 1)} Hz` : 'a single line', 'tl', { color: 'ink', weight: 600, plate: true });
          // ---- instantaneous frequency and amplitude of the fundamental
          it.hline(0, { color: 'faint', width: 1 });
          const dfMax = Math.max(df, F0 * (2 ** (100 / 1200) - 1));
          it.fn((t) => (df * Math.cos(TAU * fv * t)) / dfMax, { domain: [0, 1], n: 1200, color: 'accent', width: 2 });
          it.fn((t) => (1 + m * Math.cos(TAU * ft * t)) / (1 + m) * 2 - 1.15, { domain: [0, 1], n: 1200, color: 'orange', width: 1.8 });
          it.corner(`frequency ${v.fix(F0, 0)} ± ${v.fix(df, 1)} Hz`, 'tl', { color: 'accent', size: 11.5, weight: 600, plate: true });
          it.corner(`amplitude ×(1 ± ${v.fix(m, 2)})`, 'bl', { color: 'orange', size: 11.5, weight: 600, plate: true });
        });
        v.legend([['accent', 'measured (spectrogram, exact DFT, instantaneous frequency)'], ['gold', 'predicted sidebands', { dot: true }], ['orange', 'amplitude']]);
        v.readout(() => {
          const fv = q(vr.value), ft = q(tr.value), c = vd.value, df = F0 * (2 ** (c / 1200) - 1), m = td.value / 100;
          const regime = (r) => (r < 10 ? 'slow enough to be heard as wavering' : r < 20 ? 'in the transition: a fast shimmer' : 'too fast to follow: heard as roughness and sidebands');
          const vib = c > 0 ? `vibrato ${v.fix(fv, 1)} Hz, ±${c} ¢: harmonic 1 swings ±${v.fix(df, 1)} Hz, harmonic 8 ±${v.fix(8 * df, 1)} Hz; index $\\beta_1$ = ${v.fix(df / fv, 2)}, $\\beta_8$ = ${v.fix((8 * df) / fv, 2)} (${regime(fv)})` : 'no vibrato';
          const trm = m > 0 ? `tremolo ${v.fix(ft, 1)} Hz at ${td.value}%: sidebands at ±${v.fix(ft, 1)} Hz of relative height ${v.fix(m / 2, 2)} (${regime(ft)})` : 'no tremolo';
          return `${vib} · ${trm}`;
        });
      },
    },
  ],
};
