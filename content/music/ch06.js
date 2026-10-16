// Music Theory & Acoustics — Chapter 6: Consonance and dissonance (part a: items 6.1–6.8)
import { SR, loopVoice, playhead, finish, cbw, pl, at, dissAll, diss2, dissCurve, minima, sample, cents, gcd, nearRatio, gradus, tenney, JUST, harmonic, stretched, sharc, BEAM, JUBLAG, UGAL, TET10, ratioStr, harmonicity, toneBuf, mixBuf, seqBuf, loopParts, ratioTicks, plDiss65 } from './ch06.shared.js';

/** Spectrum presets used by several items: name → [[ratio, amp], …]. */
function preset(name, n = 8) {
  if (name === 'pure') return [[1, 1]];
  if (name === 'inv') return harmonic(n, -1);
  if (name === 'odd') return harmonic(n, -1).map(([r, a]) => [r, r % 2 ? a : 0]);
  if (name === 'violin' || name === 'clarinet' || name === 'flute') { const S = sharc(name, 'E4'); return Array.from({ length: n }, (_, k) => [k + 1, S.amp[k] || 0]); }
  return harmonic(n, 0.88);
}
const nz = (spec) => spec.filter(([, a]) => a > 1e-4);
/** Label of a ratio p/q. */
const rl = (r) => `${r.p}/${r.q}`;
/** Signed cents string. */
const sc = (v, x, d = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? `±${v.fix(0, d)}` : `${x >= 0 ? '+' : '−'}${v.fix(Math.abs(x), d)}`);

export default {
  collection: 'music',
  chapter: 6,
  title: 'Consonance and dissonance',
  summary: String.raw`Why do some intervals sound smooth and others rough? The Pythagorean tradition pointed to small whole-number ratios, and Euler turned ratio simplicity into a number. Helmholtz traced the ratios to beating between partials, and Plomp and Levelt measured how strongly two pure tones clash as a function of their distance in critical bands. Summing that curve over every pair of partials, as Plomp and Levelt and then Sethares did, makes consonance a joint property of a timbre and a tuning: change the spectrum and the most consonant intervals move with it, which is why stretched pianos, gamelan metallophones and synthetic timbres call for their own scales. Roughness is not the whole story: how well the partials fit a single harmonic series, register, musical training and culture all shape what listeners call consonant.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1',
      kind: 'Phenomenon',
      name: 'Consonance and simple ratios',
      statement: String.raw`Two tones sounded together may blend smoothly (**consonance**) or sound rough and tense (**dissonance**). For the tones of voices, strings and winds, whose partials are harmonic (2.6), the smoothest intervals are those whose frequencies stand in ratios of small whole numbers: the unison $1{:}1$, octave $2{:}1$, fifth $3{:}2$ and fourth $4{:}3$, then the major sixth $5{:}3$, major third $5{:}4$ and minor third $6{:}5$. Mistuning one of these intervals slightly makes it sound worse, not better. On a monochord the two parts of a string divided by a bridge sound frequencies in the inverse ratio of their lengths (2.5), so the consonances appear at simple division points: the observation that later Greek writers credited to Pythagoras.

Three kinds of explanation compete:
(a) **ratio simplicity**: the mind prefers simple numbers (the Pythagorean tradition; Euler's gradus, 6.8);
(b) **sensory roughness**: nearby partials beat, and simple ratios are where partials coincide instead of beating (Helmholtz, 6.2; Plomp and Levelt, 6.3);
(c) **harmonicity**: at a simple ratio all the partials of both tones fit one harmonic series, so the pair resembles a single tone with a low virtual pitch (Stumpf's tonal fusion; Terhardt, 1974).`,
      idea: String.raw`For harmonic tones the three explanations agree, which is why the question stayed open for so long. At a ratio $p{:}q$ in lowest terms, the $q$-th partial of the upper tone coincides with the $p$-th of the lower, every other pair of partials is either coincident or far apart, and all the partials together are harmonics of $f/q$. Small $p$ and $q$ mean many coincidences, few close neighbours and a high common fundamental. The theories part company when the partials are not harmonic: with pure tones the roughness dips at ratios other than the unison vanish (6.3), and with stretched partials the dips move away from the simple ratios while the ratios themselves stay put (6.5). Experiments now weigh roughness and harmonicity separately; in one large study preference for consonant chords tracked preference for harmonic spectra and not aversion to beating (McDermott, Lehr and Oxenham, 2010).`,
      caption: String.raw`Top: a monochord. Drag the bridge: the two segments sound together, and the ratio of their lengths, marked at the classical division points, is the inverse ratio of their frequencies. Bottom: what each theory predicts across two octaves of intervals, higher meaning more consonant: the roughness theory (one minus the summed Plomp–Levelt dissonance, blue), the harmonicity of the combined partials (a simple harmonic-template model, purple), and ratio simplicity (orange stems, taller for smaller $\log_2 pq$); the gold line is your bridge. Click the lower panel to move the bridge there. Switch to pure tones or to stretched partials and watch the theories disagree. *Hold the sound* to hear it while you drag.`,
      deps: ['music-2.5', 'music-2.6'],
      see: ['music-6.2', 'music-6.3', 'music-6.8', 'music-5.15', 'music-5.14'],
      refs: ['Benson ch. 4', 'Sethares ch. 5'],
      tags: ['consonance', 'ratios'],
      credit: 'Pythagorean tradition (Greek, attributed to Pythagoras, 6th c. BCE); Helmholtz, 1863; Terhardt, 1974',
      scope: String.raw`The ranking holds for harmonic complex tones at moderate levels in the middle register, judged by listeners familiar with Western music. It changes with timbre (pure tones, inharmonic or stretched partials), with register (thirds are rough low down, 6.9), and with culture and period. In Hucbald's treatise (c. 900) the consonances were the octave, fifth, fourth and their compounds; thirds entered medieval theory only later, as imperfect consonances; the fourth above the bass was treated as a dissonance in Renaissance counterpoint; Bosnian *ganga* singing and the paired, deliberately detuned instruments of Balinese gamelan cultivate beating. The Tsimane' of the Bolivian Amazon, with little exposure to Western music, rated consonant and dissonant chords as equally pleasant although they could tell them apart (McDermott et al., *Nature* 535, 547–550, 2016). The harmonicity curve here is an illustrative toy model, not a calibrated one.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance' },
      viz(v) {
        const M = v.M, F = 110, FLO = 196, CMAX = 2400;
        let cache = null;
        const kind = v.select('partials', [{ value: 'harm', label: 'harmonic' }, { value: 'pure', label: 'pure tones' }, { value: 'str', label: 'stretched' }], 'harm', { onChange: () => { cache = null; sync(); } });
        const spec = () => (kind.value === 'pure' ? [[1, 1]] : kind.value === 'str' ? stretched(6, 2.1) : harmonic(6, 0.88));
        const lv = loopVoice(v);
        const ms = v.stage({ x: [-0.05, 1.05], y: [-1.05, 1.0], height: 190, axes: false, full: true, title: 'a monochord: drag the bridge' });
        const th = v.stage({ x: [0, CMAX], y: [0, 1.16], height: 290, axes: 'box', gutter: true, full: true, xticks: ratioTicks(0, CMAX, [[1, 1], [6, 5], [5, 4], [4, 3], [3, 2], [5, 3], [2, 1], [5, 2], [3, 1], [4, 1]]), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'interval between the two segments (cents; just ratios marked)', ylabel: 'predicted consonance', title: 'what three theories predict' });
        const br = ms.handle(0.4, 0, { color: 'accent', r: 7, constrain: (x) => [M.clamp(x, 0.2, 0.5), 0] });
        const segs = () => { const a = br.x, b = 1 - br.x; return { a, b, fa: F / a, fb: F / b }; };
        const iv = () => { const { fa, fb } = segs(); return cents(Math.max(fa, fb) / Math.min(fa, fb)); };
        const parts = () => { const { fa, fb } = segs(); return at(spec(), fa).concat(at(spec(), fb)); };
        const loopBuf = () => loopParts(parts().map(([f, a]) => [f, a]));
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        br.onDrag = sync;
        v.toggle('hold the sound', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('pluck both segments', (snd) => { const { fa, fb } = segs(); snd.samples(mixBuf([[spec(), fa], [spec(), fb]], 1.8, { decay: 1.6 }), SR, { gain: 0.9 }); });
        th.onClick((x) => { const c = M.clamp(x, 0, 1200 * Math.log2(4)), r = 2 ** (c / 1200); br.set(1 / (1 + r), 0); sync(); });
        // ratio stems: reduced p/q in [1, 4], p, q ≤ 8
        const STEMS = []; for (let q = 1; q <= 8; q++) for (let p = q; p <= 4 * q && p <= 16; p++) if (gcd(p, q) === 1 && p * q <= 64) STEMS.push({ p, q, c: cents(p / q), h: 1 - Math.log2(p * q) / 6.4 });
        const curves = () => {
          if (cache) return cache;
          const S = spec(), n = 600, c = [], R = [], H = [];
          for (let i = 0; i <= n; i++) {
            const ci = (CMAX * i) / n, P = at(S, FLO).concat(at(S, FLO * 2 ** (ci / 1200)));
            c.push(ci); R.push(dissAll(P)); H.push(harmonicity(P).h);
          }
          const rmax = Math.max(...R), hmax = Math.max(...H), hmin = Math.min(...H);
          cache = { c, rough: R.map((x) => 1 - x / rmax), harm: H.map((x) => (x - hmin) / (hmax - hmin || 1)) };
          return cache;
        };
        const DIV = [[4, 1], [3, 1], [5, 2], [2, 1], [5, 3], [3, 2], [4, 3], [5, 4], [6, 5], [1, 1]];
        v.render(() => {
          const { a, b, fa, fb } = segs();
          // ---- monochord
          ms.rect(-0.03, -0.99, 1.03, -0.7, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1, radius: 6 });
          ms.text('sounding box', 0.75, -0.85, { color: 'orange', size: 11, align: 'center' });
          DIV.forEach(([p, q], k) => {
            const x = q / (p + q), near = Math.abs(x - br.x) < 0.004, row = [0, 1, 0, 1, 0, 1, 0, 1, 2, 1][k];
            ms.line(x, -0.06, x, [-0.18, -0.33, -0.48][row], { color: near ? 'green' : 'muted', width: near ? 2 : 1, alpha: 0.8 });
            ms.text(`${p}:${q}`, x, [-0.28, -0.43, -0.58][row], { color: near ? 'green' : 'muted', size: near ? 12 : 10.5, align: 'center', weight: near ? 700 : 400 });
          });
          const lens = (x0, x1, amp, col) => { const P = [], Q = []; for (let i = 0; i <= 60; i++) { const u = i / 60, x = x0 + (x1 - x0) * u, y = amp * Math.sin(Math.PI * u); P.push([x, y]); Q.push([x, -y]); } ms.poly(P.concat(Q.reverse()), { fill: col, fillAlpha: 0.13, color: col, width: 1 }); };
          lens(0, a, 0.42 * Math.sqrt(a), 'accent'); lens(a, 1, 0.42 * Math.sqrt(b), 'teal');
          ms.line(0, 0, 1, 0, { color: 'ink', width: 2 });
          for (const x of [0, 1]) ms.poly([[x, 0], [x - 0.012, -0.12], [x + 0.012, -0.12]], { fill: 'ink', fillAlpha: 0.8, color: 'ink' });
          ms.poly([[br.x, 0], [br.x - 0.02, -0.17], [br.x + 0.02, -0.17]], { fill: 'accent', fillAlpha: 0.6, color: 'accent' });
          ms.text(`${v.fix(a, 3)} → ${v.fix(fa, 0)} Hz`, a / 2, 0.55, { color: 'accent', size: 12, align: 'center' });
          ms.text(`length ${v.fix(b, 3)} → ${v.fix(fb, 0)} Hz`, a + b / 2, 0.55, { color: 'teal', size: 12, align: 'center' });
          const r = nearRatio(iv(), 6, 15);
          ms.text(`frequency ratio ${v.fix(Math.max(a, b) / Math.min(a, b), 4)}${r && Math.abs(r.err) < 15 ? ` ≈ ${r.p}:${r.q} (${sc(v, r.err)} ¢)` : ''}`, 0.5, 0.86, { color: 'ink', weight: 600, size: 13, align: 'center' });
          // ---- theory curves
          const C = curves(), c0 = iv();
          for (const s of STEMS) {
            const near = Math.abs(s.c - c0) < 12;
            th.line(s.c, 0, s.c, s.h, { color: 'orange', width: near ? 3 : 1.6, alpha: near ? 1 : 0.65 });
          }
          th.path(C.c.map((x, i) => [x, C.harm[i]]), { color: 'purple', width: 1.8 });
          th.path(C.c.map((x, i) => [x, C.rough[i]]), { color: 'accent', width: 2.4 });
          th.vline(c0, { color: 'gold', width: 2 });
          const idx = Math.round((c0 / CMAX) * 600);
          th.dot(c0, C.rough[idx], { r: 5, color: 'accent' }); th.dot(c0, C.harm[idx], { r: 5, color: 'purple' });
        });
        v.legend([['accent', 'roughness theory: 1 − summed dissonance'], ['purple', 'harmonicity of the combined partials (toy model, rescaled 0–1)'], ['orange', 'ratio simplicity: 1 − log₂(pq)/6.4'], ['gold', 'your bridge']]);
        v.readout(() => {
          const c0 = iv(), C = curves(), idx = Math.round((c0 / CMAX) * 600), r = nearRatio(c0, 8, 10), P = parts(), hm = harmonicity(P);
          return `interval ${v.fix(c0, 1)} ¢ · nearest simple ratio ${r ? `${r.p}:${r.q} (${sc(v, r.err, 1)} ¢, $\\log_2 pq = ${v.fix(tenney(r.p, r.q), 2)}$)` : 'none'} · roughness-theory consonance ${v.fix(C.rough[idx], 2)} · harmonicity ${v.fix(C.harm[idx], 2)} (best common fundamental ${v.fix(hm.f0, 1)} Hz)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Model',
      name: 'Helmholtz’s theory: coinciding partials',
      statement: String.raw`**Helmholtz (1863)**: two complex tones are dissonant to the extent that partials of one lie close to, but not on, partials of the other, so that they **beat** fast enough to be heard as roughness (5.7); they are consonant when their partials either coincide exactly or lie far apart. For harmonic tones on $f_1$ and $f_2$ the $j$-th partial of the upper and the $k$-th of the lower beat at
$$b_{jk}=\lvert j f_2-k f_1\rvert,$$
and all the $b_{jk}$ for small $j,k$ vanish or are large only when $f_2/f_1=k/j$ is a ratio of small numbers. A small mistuning $\varepsilon$ of such an interval makes the coinciding partials beat at rates proportional to $\varepsilon$ and to the partial number, which is why an out-of-tune fifth "beats" (the cue used to tune by ear).`,
      idea: String.raw`At an exact ratio $p{:}q$ the partials that beat slowest are those that coincide; the other near neighbours are at least $f_1/q$ apart. As the ratio grows more complicated, fewer partials coincide and more neighbours fall into the range of rough beating. So consonance becomes a matter of counting and weighting near misses: Helmholtz weighted each pair by the product of amplitudes and by a curve of roughness against beat rate peaking near 30–33 beats a second (6.13); Plomp and Levelt replaced the fixed beat rate by a fraction of the critical band (6.3). The curve below uses their pure-tone curve in Sethares's form, summed over every pair of partials (6.4).`,
      caption: String.raw`Left: the partials of the lower tone (220 Hz) and the upper tone side by side on a logarithmic frequency scale, bar length proportional to amplitude. Pairs that coincide are joined in green; pairs close enough to roughen are joined in red, thicker for more roughness, labelled with their beat rate. Right: the total dissonance against the interval. Drag the gold point along the curve and watch the red links appear between the dips and vanish into green links at the just intervals; *snap* to the nearest just ratio or to equal temperament to compare. Hold the sound to hear the beats.`,
      deps: ['music-6.1', 'music-5.7'],
      see: ['music-6.13', 'music-5.6', 'music-6.4'],
      refs: ['Benson ch. 4', 'Sethares ch. 5'],
      tags: ['consonance', 'helmholtz'],
      credit: 'Hermann von Helmholtz, 1863',
      scope: String.raw`Applies to sustained tones with steady partials. Helmholtz's beat-rate criterion was later replaced by the critical band (6.3, 6.14), and roughness is only one component of consonance (6.1). The partial amplitudes ($0.88^{k-1}$) and the 220 Hz register are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/On_the_Sensations_of_Tone' },
      viz(v) {
        const M = v.M, F1 = 220, CMAX = 1250;
        let cur = 386, cache = null;
        const nP = v.select('partials', [{ value: 6, label: '6' }, { value: 10, label: '10' }], 6, { onChange: () => { cache = null; sync(); } });
        const spec = () => harmonic(nP.value, 0.88);
        const lv = loopVoice(v);
        const loopBuf = () => loopParts(at(spec(), F1).concat(at(spec(), F1 * 2 ** (cur / 1200))));
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the sound', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.button('snap to just ratio', () => { const r = nearRatio(cur, 8, 60); cur = cents(r.p / r.q); sync(); });
        v.button('snap to equal temperament', () => { cur = Math.round(cur / 100) * 100; sync(); });
        const ld = v.stage({ x: [0, 1], y: [0.85, 13], ylog: true, height: 400, axes: false, weight: 1, minWidth: 280, title: 'partials, side by side' });
        const cv = v.stage({ x: [0, CMAX], y: [0, 1.08], height: 400, axes: 'box', gutter: true, weight: 1.35, xticks: ratioTicks(0, CMAX, [[1, 1], [9, 8], [6, 5], [5, 4], [4, 3], [7, 5], [3, 2], [8, 5], [5, 3], [7, 4], [15, 8], [2, 1]]), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'interval (cents; just ratios marked)', ylabel: 'dissonance (rel.)', title: 'summed roughness of all partial pairs' });
        const curve = () => {
          if (cache) return cache;
          const C = dissCurve(spec(), F1, 0, CMAX, 500); let mx = 0; for (const x of C.d) mx = Math.max(mx, x);
          let mn = Infinity; for (const x of C.d) mn = Math.min(mn, x);
          cache = { C, f: (x) => (sample(C, x) - mn) / (mx - mn) }; return cache;
        };
        const h = cv.handle(cur, 0.5, { color: 'gold', r: 7, constrain: (x) => { const c = M.clamp(x, 0, CMAX); return [c, curve().f(c)]; } });
        h.onDrag = () => { cur = h.x; sync(); };
        v.render(() => {
          const S = spec(), f2 = F1 * 2 ** (cur / 1200), A = at(S, F1), B = at(S, f2), K = curve();
          h.set(cur, K.f(cur));
          // ---- ladders
          const xl = 0.36, xr = 0.64, ytop = 1.18 * nP.value * Math.max(1, f2 / F1);
          ld.setView([0, 1], [0.85, ytop]);
          ld.text('lower tone', 0.2, ytop / 1.06, { color: 'accent', size: 12, align: 'center' });
          ld.text('upper tone', 0.8, ytop / 1.06, { color: 'teal', size: 12, align: 'center' });
          const links = [];
          A.forEach(([fa, aa], i) => B.forEach(([fb, ab], j) => {
            const dc = Math.abs(cents(fb / fa)), r = pl(fa, fb, aa, ab);
            if (dc < 2) links.push({ i, j, fa, fb, kind: 'co', r });
            else if (r > 0.04) links.push({ i, j, fa, fb, kind: 'ro', r });
          }));
          for (const L of links) {
            const y1 = L.fa / F1, y2 = L.fb / F1;
            if (L.kind === 'co') ld.line(xl, y1, xr, y2, { color: 'green', width: 3.5 });
            else ld.line(xl, y1, xr, y2, { color: 'red', width: 1 + 6 * L.r, alpha: 0.35 + 0.6 * Math.min(1, L.r * 1.5) });
          }
          const tagged = links.filter((L) => L.kind === 'ro').sort((a, b) => b.r - a.r).slice(0, 5);
          for (const L of tagged) { const ym = Math.sqrt((L.fa * L.fb) / (F1 * F1)); ld.text(`${v.fix(Math.abs(L.fb - L.fa), 0)} Hz`, 0.5, ym, { color: 'red', size: 10.5, align: 'center', dy: -2, plate: true }); }
          A.forEach(([fa, aa], i) => { const y = fa / F1; ld.line(xl - 0.3 * aa, y, xl, y, { color: 'accent', width: 3 }); ld.text(String(i + 1), xl - 0.3 * aa - 0.025, y, { color: 'accent', size: 10, align: 'right', baseline: 'middle' }); });
          B.forEach(([fb, ab], j) => { const y = fb / F1; ld.line(xr, y, xr + 0.3 * ab, y, { color: 'teal', width: 3 }); ld.text(String(j + 1), xr + 0.3 * ab + 0.025, y, { color: 'teal', size: 10, align: 'left', baseline: 'middle' }); });
          // ---- curve
          cv.path(Array.from(K.C.c, (x, i) => [x, K.f(x)]), { color: 'accent', width: 2.2 });
          for (const m of minima(K.C, 0.01)) cv.dot(m.c, K.f(m.c), { r: 3, color: 'green' });
          cv.vline(cur, { color: 'gold', width: 1, alpha: 0.6 });
        });
        v.legend([['green', 'coinciding partials'], ['red', 'beating partials (width ∝ roughness)'], ['accent', 'total dissonance'], ['gold', 'your interval']]);
        v.readout(() => {
          const S = spec(), f2 = F1 * 2 ** (cur / 1200), A = at(S, F1), B = at(S, f2); let co = 0, ro = [];
          A.forEach(([fa, aa], i) => B.forEach(([fb, ab], j) => { if (Math.abs(cents(fb / fa)) < 2) co++; else { const r = pl(fa, fb, aa, ab); if (r > 0.04) ro.push([r, i + 1, j + 1, Math.abs(fb - fa)]); } }));
          ro.sort((a, b) => b[0] - a[0]);
          const r = nearRatio(cur, 8, 20);
          return `interval ${v.fix(cur, 1)} ¢${r ? ` (${rl(r)} ${sc(v, r.err, 1)} ¢)` : ''} · ${co} coinciding pair${co === 1 ? '' : 's'} · ${ro.length} beating pair${ro.length === 1 ? '' : 's'}${ro.length ? `, roughest: lower ${ro[0][1]} with upper ${ro[0][2]} at ${v.fix(ro[0][3], 1)} beats/s` : ''} · dissonance ${v.fix(curve().f(cur), 3)} (0 = smoothest within the octave)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Model',
      name: 'The Plomp–Levelt curve',
      statement: String.raw`**Plomp and Levelt (1965)**: the sensory dissonance of two equally loud pure tones depends on their frequency difference $\Delta f$ measured in units of the **critical bandwidth** $\mathrm{CB}(f)$ at their mean frequency (5.4). It is zero at the unison, rises steeply to a maximum near $\Delta f\approx\tfrac14\mathrm{CB}$, and falls back to nearly zero once $\Delta f$ exceeds about one critical band, whatever the frequency ratio. Sethares (1993) fitted the curve by
$$d(f_1,f_2)=e^{-b_1 s\,\Delta f}-e^{-b_2 s\,\Delta f},\qquad s=\frac{0.24}{0.0207\,f_{\min}+18.96},\quad b_1=3.51,\ b_2=5.75,$$
whose peak lies at $s\,\Delta f=\ln(b_2/b_1)/(b_2-b_1)\approx0.22$. Because the critical band is about 100 Hz wide below 500 Hz and about a fifth of the frequency above, the most dissonant interval is wide in the bass (several semitones near 100 Hz) and narrow in the treble (well under a semitone above 2 kHz).`,
      idea: String.raw`Two tones closer than a critical band excite overlapping regions of the basilar membrane (5.2), so one auditory filter carries both and its output fluctuates at the difference frequency: slow fluctuations are heard as beats, fast ones as roughness (5.7). Once the tones are a critical band apart each has its own filter and nothing fluctuates. Scaling by the critical band is what removes the dependence on register: plotted against $\Delta f$ in hertz the curves for different base frequencies differ, plotted against $\Delta f/\mathrm{CB}$ they collapse onto one. Note the absence of any dip at musical ratios for pure tones: those appear only when the curve is summed over the partials of complex tones (6.4).`,
      caption: String.raw`Dissonance of two pure tones against their separation. Choose the horizontal unit: in **hertz** the curves for 125, 250, 500, 1000 and 2000 Hz (faint) have different widths; in **cents** the peak moves from several semitones in the bass to a fraction of a semitone in the treble; in **critical bandwidths** they all collapse near Plomp and Levelt's own standard curve (dashed, traced from their Fig. 10). Slide the lower tone between 60 Hz and 2 kHz and drag the gold point to choose the separation; play or hold the two tones.`,
      deps: ['music-5.4', 'music-5.7'],
      see: ['music-6.14', 'music-6.4', 'music-6.9'],
      refs: ['Sethares ch. 3', 'Benson ch. 4'],
      tags: ['dissonance', 'critical band'],
      credit: 'R. Plomp & W. J. M. Levelt, 1965; parametrization: W. A. Sethares, 1993',
      scope: String.raw`Averaged ratings of musically untrained listeners for pure-tone pairs at about 65 dB SPL, with large spread between listeners (see 6.14). The critical bandwidths used then (Zwicker, Flottorp and Stevens, 1957) are wider below 500 Hz than modern ERB estimates; with narrower bands the maximum falls nearer 40% of a band (Greenwood, 1991). Sethares's fit uses $f_{\min}$ in place of the critical band and is an approximation of the measured curve, not a law.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance' },
      viz(v) {
        const M = v.M, BASES = [125, 250, 500, 1000, 2000];
        let df = 30; // separation in Hz
        const mode = v.select('horizontal unit', [{ value: 'hz', label: 'hertz' }, { value: 'c', label: 'cents' }, { value: 'cb', label: 'critical bandwidths' }], 'cb', { onChange: () => v.invalidate() });
        const fS = v.slider('lower tone $f_1$', 60, 2000, 250, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz` , onChange: () => sync() });
        const lv = loopVoice(v);
        const loopBuf = () => loopParts([[fS.value, 0.5], [fS.value + df, 0.5]]);
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the two tones', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('play', (snd) => snd.tone([[fS.value, 1], [fS.value + df, 1]], { duration: 1.6, gain: 0.3 }));
        const s = v.stage({ x: [0, 1.5], y: [0, 1.12], height: 340, axes: 'box', gutter: true, full: true, yticks: [[0, '0'], [0.25, ''], [0.5, '0.5'], [0.75, ''], [1, '1']], ylabel: 'dissonance', title: 'two pure tones' });
        // unit conversions for base f
        const toX = (f, d) => (mode.value === 'hz' ? d : mode.value === 'c' ? cents((f + d) / f) : d / cbw(f + d / 2));
        const fromX = (f, x) => {
          if (mode.value === 'hz') return x;
          if (mode.value === 'c') return f * (2 ** (x / 1200) - 1);
          let lo = 0, hi = 4000; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (m / cbw(f + m / 2) < x) lo = m; else hi = m; } return (lo + hi) / 2;
        };
        const xMax = () => (mode.value === 'hz' ? 1.5 * cbw(fS.value) : mode.value === 'c' ? 1300 : 1.5);
        const h = s.handle(0.2, 0.5, { color: 'gold', r: 7, constrain: (x) => { const f = fS.value, X = M.clamp(x, 0, xMax()), d = fromX(f, X); return [X, pl(f, f + d)]; } });
        h.onDrag = () => { df = fromX(fS.value, h.x); sync(); };
        v.render(() => {
          const f = fS.value, X1 = xMax();
          s.setView([0, X1], [0, 1.12]);
          s.setLabels(mode.value === 'hz' ? 'frequency difference $\\Delta f$ (Hz)' : mode.value === 'c' ? 'interval (cents)' : 'frequency difference in critical bandwidths, $\\Delta f/\\mathrm{CB}$');
          s.setTicks(mode.value === 'c' ? [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map((c) => [c, c % 200 ? '' : String(c)]) : mode.value === 'cb' ? [[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, '1'], [1.25, ''], [1.5, '1.5']] : null, undefined);
          if (mode.value === 'cb') { s.vline(0.25, { color: 'red', dash: [3, 4], width: 1 }); s.vline(1, { color: 'green', dash: [3, 4], width: 1 }); s.text('¼ band', 0.25, 1.08, { color: 'red', size: 10.5, align: 'left', dx: 4 }); s.text('one band', 1, 1.08, { color: 'green', size: 10.5, align: 'left', dx: 4 }); }
          let lastLX = -1e9, lift = 0;
          for (const fb of BASES) {
            const xM = mode.value === 'hz' ? X1 : mode.value === 'c' ? X1 : 1.5, P = [];
            for (let i = 0; i <= 300; i++) { const X = (xM * i) / 300, d = mode.value === 'hz' ? X : fromX(fb, X); P.push([X, pl(fb, fb + d)]); }
            s.path(P, { color: 'muted', width: 1, alpha: 0.5 });
            let im = 0; P.forEach((p, i) => { if (p[1] > P[im][1]) im = i; });
            if (mode.value !== 'cb' && P[im][0] < X1 * 0.97) { lift = P[im][0] - lastLX < X1 * 0.05 ? lift + 1 : 0; s.text(`${fb}`, P[im][0], P[im][1], { color: 'muted', size: 10, align: 'center', dy: -6 - 12 * lift }); lastLX = P[im][0]; }
          }
          // Plomp–Levelt standard curve (their Fig. 10), drawn in the current unit for this f1
          const P2 = []; for (let i = 0; i <= 300; i++) { const X = (X1 * i) / 300, d = fromX(f, X); P2.push([X, plDiss65(f, f + d)]); }
          s.path(P2, { color: 'ink', width: 1.6, dash: [6, 4] });
          const P = []; for (let i = 0; i <= 400; i++) { const X = (X1 * i) / 400, d = fromX(f, X); P.push([X, pl(f, f + d)]); }
          s.path(P, { color: 'accent', width: 2.6 });
          const Xc = toX(f, df); h.set(Math.min(Xc, X1), pl(f, f + df));
          s.vline(Math.min(Xc, X1), { color: 'gold', width: 1, alpha: 0.6 });
        });
        v.legend([['accent', 'Sethares fit at your $f_1$'], ['ink', 'Plomp–Levelt standard curve (Fig. 10)', { dash: true }], ['muted', 'Sethares fit at 125 … 2000 Hz'], ['gold', 'your separation']]);
        v.readout(() => {
          const f = fS.value, s1 = 0.24 / (0.0207 * f + 18.96), dpk = Math.log(5.75 / 3.51) / (5.75 - 3.51) / s1;
          return `$f_1 = ${v.fix(f, 0)}$ Hz, critical band ${v.fix(cbw(f), 0)} Hz · Sethares peak at $\\Delta f = ${v.fix(dpk, 1)}$ Hz = ${v.fix(cents((f + dpk) / f), 0)} ¢ = ${v.fix(dpk / cbw(f + dpk / 2), 2)} CB (Plomp–Levelt: ¼ CB = ${v.fix(cbw(f) / 4, 1)} Hz) · yours: $\\Delta f = ${v.fix(df, 1)}$ Hz = ${v.fix(cents((f + df) / f), 0)} ¢ = ${v.fix(df / cbw(f + df / 2), 2)} CB, dissonance ${v.fix(pl(f, f + df), 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Model',
      name: 'Dissonance curves of complex tones (Sethares)',
      statement: String.raw`Let a tone have partials at frequencies $f_1,\dots,f_n$ with amplitudes $a_1,\dots,a_n$. Its **dissonance curve** is the total sensory dissonance of the tone sounded with a copy of itself transposed by the ratio $\alpha$:
$$D(\alpha)=\sum_{\text{pairs }i<j\text{ of the }2n\text{ partials }\{f_k\}\cup\{\alpha f_k\}}d(\text{freq}_i,\text{freq}_j)\,\min(\text{amp}_i,\text{amp}_j),$$
with $d$ the Plomp–Levelt curve of two pure tones (6.3). For a harmonic spectrum $D$ has its global minimum at the unison and **local minima exactly at simple ratios** $\alpha=p/q$ ($p,q\le n$): $2/1$, $3/2$, $4/3$, $5/3$, $5/4$, $6/5$, …, deeper for smaller numbers. Which minima exist, and how deep they are, depends on the amplitudes of the partials.`,
      idea: String.raw`Near $\alpha=p/q$ the $q$-th partial of the upper copy approaches the $p$-th partial of the lower; their contribution to $D$ is a narrow Plomp–Levelt peak centred on the coincidence, so $D$ has a sharp notch there, of depth set by the two amplitudes and of width about a critical band. All other partial pairs vary smoothly. The curve is the sum of a broad, smooth background and these notches; notches from strong low partials (octave, fifth) are deepest, and a notch disappears when one of the partials that make it is removed. This is the model behind Plomp and Levelt's Fig. 11 (6.14) and Sethares's dissonance curves (6.15).`,
      caption: String.raw`Top: the spectrum; drag a bar up or down to change a partial's amplitude, or choose a preset (Sethares's $0.88^{k-1}$, $1/k$, odd harmonics only like a clarinet's low register, or the measured violin and clarinet spectra of SHARC). Bottom: the dissonance curve over a little more than an octave above middle C, with its local minima (green) labelled by the nearest simple ratio; the faint curve is the same for pure tones. Remove the 3rd partial and the fifth's dip weakens; with odd harmonics only the octave and fifth dips vanish while 5/3 and 7/5 survive. Click the curve to hear that interval with this timbre.`,
      deps: ['music-6.3', 'music-6.2'],
      see: ['music-6.15', 'music-6.14', 'music-4.1'],
      refs: ['Sethares ch. 5', 'Benson ch. 4'],
      tags: ['dissonance', 'timbre'],
      credit: 'Plomp & Levelt, 1965 (summation); W. A. Sethares, 1993 (dissonance curves)',
      scope: String.raw`A model of sensory roughness only (no harmonicity, masking, or loudness weighting), using Sethares's amplitude rule $\min(a_i,a_j)$; other choices (products of amplitudes, loudness in sones) change depths but not where the minima sit. Steady tones at middle-C register; SHARC spectra are single sustained notes (E4) of one recording each.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance' },
      viz(v) {
        const M = v.M, F0 = 261.63, CMAX = 1250, N = 8;
        let amps = harmonic(N, 0.88).map((p) => p[1]), cache = null, cur = null;
        const pre = v.select('spectrum', [{ value: 'set', label: '0.88ᵏ' }, { value: 'inv', label: '1/k' }, { value: 'odd', label: 'odd only' }, { value: 'violin', label: 'violin' }, { value: 'clarinet', label: 'clarinet' }], 'set', { onChange: (x) => { amps = preset(x, N).map((p) => p[1]); const m = Math.max(...amps); amps = amps.map((a) => a / m); cache = null; v.invalidate(); } });
        const sp = v.stage({ x: [0.4, N + 0.6], y: [0, 1.12], height: 170, axes: 'box', gutter: true, full: true, xticks: Array.from({ length: N }, (_, k) => [k + 1, String(k + 1)]), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'partial number', ylabel: 'amplitude', title: 'the spectrum (drag the bars)' });
        const cv = v.stage({ x: [0, CMAX], y: [0, 1.1], height: 300, axes: 'box', gutter: true, full: true, xticks: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map((c) => [c, String(c)]), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'interval above C4 (cents)', ylabel: 'dissonance (rel.)', title: 'dissonance curve: the tone against a transposed copy of itself' });
        sp.onDrag((x, y) => { const k = Math.round(x); if (k >= 1 && k <= N) { amps[k - 1] = M.clamp(y, 0, 1); cache = null; } });
        const spec = () => amps.map((a, k) => [k + 1, a]);
        const curve = () => {
          if (cache) return cache;
          const S = nz(spec()), C = dissCurve(S, F0, 0, CMAX, 625), P = dissCurve([[1, 1]], F0, 0, CMAX, 300);
          let mx = 0; for (const x of C.d) mx = Math.max(mx, x);
          let pm = 0; for (const x of P.d) pm = Math.max(pm, x);
          cache = { C, P, mx, pm, mins: minima(C, 0.006) }; return cache;
        };
        cv.onClick((x) => { cur = M.clamp(x, 0, CMAX); const S = nz(spec()); v.sound().stop(); v.sound().samples(mixBuf([[S, F0], [S, F0 * 2 ** (cur / 1200)]], 1.6), SR, { gain: 0.9 }); v.invalidate(); });
        v.soundButton('play the tone', (snd) => snd.samples(mixBuf([[nz(spec()), F0]], 1.2), SR, { gain: 0.9 }));
        v.render(() => {
          amps.forEach((a, k) => { sp.rect(k + 1 - 0.32, 0, k + 1 + 0.32, Math.max(a, 0.004), { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 }); });
          const K = curve();
          for (let c = 100; c < CMAX; c += 100) cv.vline(c, { color: 'grid', width: 1 });
          cv.path(Array.from(K.P.c, (x, i) => [x, (0.85 * K.P.d[i]) / K.pm]), { color: 'muted', width: 1.2, alpha: 0.6 });
          cv.path(Array.from(K.C.c, (x, i) => [x, K.C.d[i] / K.mx]), { color: 'accent', width: 2.4 });
          let lastX = -1e9;
          for (const m of K.mins) {
            const r0 = nearRatio(m.c, 9, 15), r = r0 && Math.abs(r0.err) <= 15 ? r0 : null, y = m.d / K.mx;
            cv.dot(m.c, y, { r: 4, color: 'green' });
            if (m.c - lastX > 45 && m.c > 30) { cv.text(r ? rl(r) : `${v.fix(m.c, 0)}¢`, m.c, y, { color: 'green', size: 10.5, align: 'center', dy: y < 0.16 ? -10 : 14 }); lastX = m.c; }
          }
          if (cur != null) { cv.vline(cur, { color: 'gold', width: 2 }); cv.dot(cur, sample(K.C, cur) / K.mx, { r: 5, color: 'gold' }); }
        });
        v.legend([['accent', 'this spectrum'], ['muted', 'pure tones (rescaled)'], ['green', 'local minima'], ['gold', 'clicked interval']]);
        v.readout(() => {
          const K = curve(), list = K.mins.filter((m) => m.c > 30).map((m) => { const r = nearRatio(m.c, 9, 15); return `${v.fix(m.c, 0)} ¢${r && Math.abs(r.err) <= 15 ? ` (${rl(r)} ${sc(v, r.err, 1)})` : ' (shallow, no simple ratio)'}`; });
          return `${list.length} local minima above the unison: ${list.join(' · ')}${cur != null ? ` · clicked ${v.fix(cur, 0)} ¢, dissonance ${v.fix(sample(K.C, cur) / K.mx, 3)}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5',
      kind: 'Principle',
      name: 'Timbre determines the most consonant tuning',
      statement: String.raw`**Principle of local consonance** (Sethares, 1993): a timbre and a scale are *related* when the local minima of the timbre's dissonance curve (6.4) fall on the intervals of the scale. Since by the coincidence argument the minima sit at ratios $f_i/f_j$ of the timbre's own partials, the consonant intervals of a sound are set by its spectrum. Harmonic spectra are related to just intonation and, approximately, to 12-tone equal temperament. For **stretched** or **compressed** spectra $f_j=f\,A^{\log_2 j}$ (Slaymaker; Mathews and Pierce) the ratio $A$ plays the role of the octave, a *pseudo-octave*: the true octave $2{:}1$ becomes rough unless $A=2$, while the minima sit near the steps $A^{k/12}$ of a correspondingly stretched 12-step scale.`,
      idea: String.raw`Stretching maps every partial ratio $j/k$ to $A^{\log_2(j/k)}$, so every coincidence of the harmonic case happens at the stretched interval instead: the octave coincidence $2f$ with $2f$ moves to $A$, the fifth's $3f$ with $3f$ moves to $A^{\log_2 1.5}$, and so on. The whole dissonance curve is the harmonic one, re-plotted on an axis stretched by $\log_2 A$ (apart from small changes from the frequency dependence of the critical band). Music built on the stretched scale with the stretched timbre therefore has the familiar pattern of consonance and dissonance; the same music with an ordinary harmonic timbre beats everywhere, and so does ordinary music with the stretched timbre.`,
      caption: String.raw`Slide the pseudo-octave $A$ from compressed (1.87) through harmonic (2.00) to stretched (2.2). The blue curve is the dissonance curve of a 6-partial tone with partials $f\,A^{\log_2 j}$; the faint curve is the harmonic one. Orange ticks mark the 12 steps of the stretched scale $A^{k/12}$; the green dots are the minima. Watch the octave (dashed) lose its dip while the pseudo-octave gains one. Play a I–IV–V–I cadence with the matched pair (stretched timbre in the stretched scale) and with each of the two mismatches; the readout gives the mean dissonance of the chords in each case.`,
      deps: ['music-6.4'],
      see: ['music-6.6', 'music-6.15', 'music-2.11'],
      refs: ['Sethares ch. 6', 'Benson ch. 4'],
      tags: ['dissonance', 'tuning'],
      credit: 'W. A. Sethares, 1993; stretched partials: F. H. Slaymaker, 1970; M. V. Mathews & J. R. Pierce, 1980',
      scope: String.raw`Concerns sensory roughness, not melody or harmonicity; listeners also hear stretched timbres as less fused and their pseudo-octaves as "wrong" octaves (Mathews and Pierce report musically usable but distinctly different results). The real stretch of piano strings (2.11) is far smaller (a few cents per octave) than these examples.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pseudo-octave' },
      viz(v) {
        const M = v.M, F0 = 261.63, CMAX = 1480;
        let cache = null;
        const aS = v.slider('pseudo-octave $A$', 1.87, 2.22, 2.1, { step: 0.005, fmt: (x) => `${v.fix(x, 3)} (${v.fix(cents(x), 0)} ¢)`, onChange: () => { cache = null; } });
        const s = v.stage({ x: [0, CMAX], y: [0, 1.12], height: 340, axes: 'box', gutter: true, full: true, xticks: [0, 200, 400, 600, 800, 1000, 1200, 1400].map((c) => [c, String(c)]), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'interval (cents)', ylabel: 'dissonance (rel.)', title: 'stretched timbre: the minima follow the partials' });
        const harm = dissCurve(harmonic(6, 0.88), F0, 0, CMAX, 540); let hm = 0; for (const x of harm.d) hm = Math.max(hm, x);
        const curve = () => {
          if (cache) return cache;
          const C = dissCurve(stretched(6, aS.value, 0.88), F0, 0, CMAX, 540); let mx = 0; for (const x of C.d) mx = Math.max(mx, x);
          cache = { C, mx, mins: minima(C, 0.006) }; return cache;
        };
        const PROG = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]];
        const chords = (step, spec, root = 196) => PROG.map((ch) => ch.map((k) => [spec, root * 2 ** ((k * step) / 1200)]));
        const meanD = (step, spec) => { const cs = chords(step, spec); return cs.reduce((s, ch) => s + dissAll(ch.flatMap(([S, f]) => at(S, f))), 0) / cs.length; };
        v.soundButton('matched: stretched timbre, stretched scale', (snd) => snd.samples(seqBuf(chords(cents(aS.value) / 12, stretched(6, aS.value)), 1.0), SR, { gain: 0.9 }));
        v.soundButton('stretched timbre, ordinary scale', (snd) => snd.samples(seqBuf(chords(100, stretched(6, aS.value)), 1.0), SR, { gain: 0.9 }));
        v.soundButton('harmonic timbre, stretched scale', (snd) => snd.samples(seqBuf(chords(cents(aS.value) / 12, harmonic(6, 0.88)), 1.0), SR, { gain: 0.9 }));
        v.render(() => {
          const K = curve(), cA = cents(aS.value);
          for (let k = 1; k <= 12; k++) { const c = (k * cA) / 12; if (c <= CMAX) s.line(c, 0, c, 0.05, { color: 'orange', width: 2 }); }
          s.text('stretched 12-step scale', (2 * cA) / 12, 0.075, { color: 'orange', size: 10.5, align: 'left' });
          s.vline(1200, { color: 'red', dash: [5, 4], width: 1.2 }); s.text('octave 2:1', 1200, 1.08, { color: 'red', size: 10.5, align: cA >= 1200 ? 'right' : 'left', dx: cA >= 1200 ? -4 : 4, plate: true });
          s.vline(cA, { color: 'green', dash: [5, 4], width: 1.2 }); s.text('pseudo-octave A', cA, 1.0, { color: 'green', size: 10.5, align: cA >= 1200 ? 'left' : 'right', dx: cA >= 1200 ? 4 : -4, plate: true });
          s.path(Array.from(harm.c, (x, i) => [x, harm.d[i] / hm]), { color: 'muted', width: 1.2, alpha: 0.6 });
          s.path(Array.from(K.C.c, (x, i) => [x, K.C.d[i] / K.mx]), { color: 'accent', width: 2.4 });
          for (const m of K.mins) s.dot(m.c, m.d / K.mx, { r: 4, color: 'green' });
        });
        v.legend([['accent', 'stretched timbre'], ['muted', 'harmonic timbre'], ['green', 'minima'], ['orange', 'steps $A^{k/12}$']]);
        v.readout(() => {
          const K = curve(), A = aS.value, cA = cents(A), st = stretched(6, A), hs = harmonic(6, 0.88);
          const dO = sample(K.C, 1200) / K.mx, dA = sample(K.C, Math.min(cA, CMAX)) / K.mx;
          const steps = [3, 4, 5, 7, 8, 9, 12].map((k) => (k * cA) / 12), near = steps.filter((c) => K.mins.some((m) => Math.abs(m.c - c) < 20)).length;
          return `dissonance at the octave ${v.fix(dO, 3)}, at the pseudo-octave ${v.fix(dA, 3)} · minima within 20 ¢ of ${near} of the 7 consonant steps (3, 4, 5, 7, 8, 9, 12) · mean chord dissonance of the cadence: matched ${v.fix(meanD(cA / 12, st), 2)}, stretched timbre in 12-TET ${v.fix(meanD(100, st), 2)}, harmonic timbre in stretched scale ${v.fix(meanD(cA / 12, hs), 2)} (harmonic in 12-TET: ${v.fix(meanD(100, hs), 2)})`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Method',
      name: 'Designing spectra for a tuning',
      statement: String.raw`Given a scale, one can choose a spectrum whose dissonance curve has its minima on the scale's steps. For an $n$-tone equal temperament with step $b=2^{1/n}$, Sethares's construction takes **induced** spectra: partials placed at powers of $b$, $f_j=f\,b^{m_j}$. Every ratio of two partials is then a power of $b$, so every coincidence, and hence (6.4) almost every minimum of the dissonance curve, falls on a step of the scale. A practical recipe starts from a harmonic spectrum and moves each partial to the nearest power of $b$. For 10-tone equal temperament, where harmonic timbres sound poor, Sethares published spectra such as $\{b^0,b^{10},b^{17},b^{20},b^{25},b^{28},b^{30}\}$, $b=2^{1/10}$.`,
      idea: String.raw`Minima of a dissonance curve arise where partials of the two copies coincide, at the ratios $f_i/f_j$ of the spectrum (6.15). Placing all partials on a lattice of powers of $b$ makes the set of ratios a subset of that lattice, so the minima are forced onto the scale; amplitudes then control which steps get deep minima. The nearest-step snap keeps the spectrum close to a familiar harmonic sound, which is why induced timbres for 12-TET come out almost harmonic, and 10-TET timbres come out noticeably bell-like. More generally Sethares posed timbre design as minimizing the dissonance at the scale steps, solved by random search or a genetic algorithm (6.15).`,
      caption: String.raw`Pick a temperament and step through the algorithm (or press play). Top: the partials on a log-frequency axis against the scale's steps (faint lines); each step moves one partial (orange arrow) from its harmonic position to the nearest step. Bottom: the dissonance curve with the scale steps marked, green where a minimum lies within 15 ¢, red where none does; the faint curve is the harmonic timbre's. For 10-TET a last step swaps in Sethares's published spectrum. Play the scale's dyads (tonic plus each step) with the designed timbre and with the harmonic one.`,
      deps: ['music-6.5'],
      see: ['music-6.15', 'music-7.9', 'music-7.12'],
      refs: ['Sethares ch. 12'],
      tags: ['timbre', 'tuning'],
      credit: 'W. A. Sethares, 1993; earlier: J. R. Pierce, 1966 (a timbre for 8-tone equal temperament)',
      scope: String.raw`Rests on the roughness model of 6.4; designed timbres can sound inharmonic (bell- or metallophone-like) and lose fusion and pitch clarity, which the model ignores. The nearest-step snap is a simple illustrative algorithm, not Sethares's optimization.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equal_temperament' },
      viz(v) {
        const M = v.M, F0 = 261.63, NP = 7;
        const edo = v.select('temperament', [{ value: 10, label: '10-TET' }, { value: 11, label: '11-TET' }, { value: 8, label: '8-TET' }, { value: 12, label: '12-TET' }], 10, { onChange: () => { curves.clear(); S.reset(build(), { at: 'end' }); } });
        const AMP = (k) => 0.88 ** k;
        function build() {
          const n = edo.value, b = 2 ** (1 / n);
          let spec = Array.from({ length: NP }, (_, k) => [k + 1, AMP(k)]);
          const frames = [{ spec: spec.map((p) => p.slice()), moved: -1, from: null, note: `Start: a harmonic spectrum, partials 1–${NP}, amplitudes $0.88^{k-1}$.`, line: 1 }];
          for (let k = 1; k < NP; k++) {
            const r = spec[k][0], m = Math.round(Math.log(r) / Math.log(b)), to = b ** m;
            spec = spec.map((p) => p.slice()); spec[k][0] = to;
            frames.push({ spec, moved: k, from: k + 1, note: `Move partial ${k + 1} from ${k + 1} to $b^{${m}} = ${to.toFixed(3)}$ (${sc(v, cents(to / (k + 1)), 0)} ¢).`, line: 2 });
          }
          if (n === 10) frames.push({ spec: TET10.map((m, i) => [b ** m, AMP(i)]), moved: -2, from: null, note: `Sethares's published 10-TET spectrum $\\{b^0, b^{10}, b^{17}, b^{20}, b^{25}, b^{28}, b^{30}\\}$.`, line: 3 });
          return frames;
        }
        const S = v.steps({ frames: build(), code: ['start from harmonic partials 1 … 7', 'for each partial $k$: move it to $b^{\\mathrm{round}(\\log_b k)}$', '(10-TET) compare Sethares’s published spectrum'], codePos: 'below', speed: 1.2, start: 'end', still: 'end' });
        const sp = v.stage({ x: [-0.08, 3.2], y: [0, 1.15], height: 190, axes: 'box', gutter: true, full: true, xticks: [0, 1, 2, 3].map((o) => [o, ['1', '2', '4', '8'][o]]), yticks: [], xlabel: 'partial frequency ÷ fundamental (log scale)', title: 'the spectrum on the scale’s lattice' });
        const cv = v.stage({ x: [0, 1250], y: [0, 1.12], height: 270, axes: 'box', gutter: true, full: true, xticks: [0, 200, 400, 600, 800, 1000, 1200].map((c) => [c, String(c)]), yticks: [[0, '0'], [1, '1']], xlabel: 'interval (cents)', ylabel: 'dissonance', title: 'dissonance curve and the scale steps' });
        const curves = new Map();
        const curveOf = (spec) => { const k = spec.map((p) => p[0].toFixed(4)).join(); if (!curves.has(k)) { const C = dissCurve(spec, F0, 0, 1250, 500); let mx = 0; for (const x of C.d) mx = Math.max(mx, x); curves.set(k, { C, mx, mins: minima(C, 0.006) }); } return curves.get(k); };
        const harmK = () => curveOf(Array.from({ length: NP }, (_, k) => [k + 1, AMP(k)]));
        const score = (K) => { const n = edo.value; let hit = 0, sum = 0; for (let k = 1; k < n; k++) { const c = (1200 * k) / n; if (K.mins.some((m) => Math.abs(m.c - c) < 15)) hit++; sum += sample(K.C, c) / K.mx; } return { hit, mean: sum / (n - 1) }; };
        const dyads = (spec) => { const n = edo.value; return Array.from({ length: n }, (_, k) => [[spec, 220], [spec, 220 * 2 ** ((k + 1) / n)]]); };
        v.soundButton('dyads, designed timbre', (snd) => snd.samples(seqBuf(dyads(S.frame.spec), 0.55, 0.06), SR, { gain: 0.9 }));
        v.soundButton('dyads, harmonic timbre', (snd) => snd.samples(seqBuf(dyads(harmonic(NP, 0.88)), 0.55, 0.06), SR, { gain: 0.9 }));
        v.render(() => {
          const n = edo.value, fr = S.frame, spec = fr.spec || [];
          for (let m = 0; m <= 3 * n; m++) sp.line(m / n, 0, m / n, 1.15, { color: 'grid', width: m % n ? 1 : 2 });
          for (let k = 2; k <= NP; k++) { sp.line(Math.log2(k), 0, Math.log2(k), AMP(k - 1), { color: 'muted', width: 1, dash: [2, 3], alpha: 0.7 }); sp.dot(Math.log2(k), AMP(k - 1), { r: 3, color: 'muted', hollow: true }); }
          spec.forEach(([r, a], i) => {
            const x = Math.log2(r), hl = i === fr.moved;
            sp.line(x, 0, x, a, { color: hl ? 'orange' : 'accent', width: hl ? 4 : 3 });
            sp.dot(x, a, { r: hl ? 5 : 3.5, color: hl ? 'orange' : 'accent' });
            if (hl && fr.from) sp.arrow(Math.log2(fr.from), a + 0.09, x, a + 0.09, { color: 'orange', width: 1.6, head: 7 });
          });
          const K = curveOf(spec), H = harmK();
          cv.path(Array.from(H.C.c, (x, i) => [x, H.C.d[i] / H.mx]), { color: 'muted', width: 1.1, alpha: 0.55 });
          cv.path(Array.from(K.C.c, (x, i) => [x, K.C.d[i] / K.mx]), { color: 'accent', width: 2.3 });
          for (let k = 1; k <= n; k++) { const c = (1200 * k) / n, ok = K.mins.some((m) => Math.abs(m.c - c) < 15); cv.line(c, 0, c, 0.08, { color: ok ? 'green' : 'red', width: 3 }); }
          for (const m of K.mins) cv.dot(m.c, m.d / K.mx, { r: 3, color: 'green' });
        });
        v.legend([['accent', 'designed spectrum'], ['muted', 'harmonic spectrum'], ['green', 'step with a minimum within 15 ¢'], ['red', 'step without one']]);
        v.readout(() => {
          const n = edo.value, K = curveOf(S.frame.spec || []), H = harmK(), a = score(K), h = score(H);
          return `${n}-TET (step ${v.fix(1200 / n, 1)} ¢) · designed spectrum: minima on ${a.hit} of ${n - 1} inner steps, mean dissonance at the steps ${v.fix(a.mean, 3)} · harmonic spectrum: ${h.hit} of ${n - 1}, mean ${v.fix(h.mean, 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7',
      kind: 'Phenomenon',
      name: 'Gamelan spectra and slendro tuning',
      statement: String.raw`The metallophones of Javanese and Balinese gamelan are struck bars (or bossed gongs) whose partials are strongly **inharmonic**: a free bar of uniform section has modes near $1:2.76:5.40:8.93$ (3.11), and measured gamelan bars scatter around such values; a jublag and an ugal from one Balinese gamelan, tuned to the same note, had overtones at $1:2.77:5.18:5.33$ and $1:2.61:4.80:4.94:6.32$ (Jones, Gee and Grimshaw, 2010). Gamelan scales are not built from simple ratios either: **slendro** divides the octave into five roughly equal steps (about 240 ¢ each, varying from ensemble to ensemble), and **pelog** into seven unequal steps. Sethares argued that the two belong together: dissonance curves computed from measured gamelan spectra have minima at or near the scale steps the ensembles use, as harmonic spectra have minima at just intervals (6.5).`,
      idea: String.raw`By the coincidence principle (6.4) the minima of a dissonance curve fall at ratios of the instrument's own partials, so a scale whose steps match those ratios lets the struck bars sound together with few rough near-misses. With partials near $2.76$ and $5.4$, the candidate ratios ($5.4/2.76\approx1.96$, $2.76/2\approx1.38$, …) are unrelated to $3/2$ or $5/4$, and an ordinary harmonic analysis would call the scale "out of tune". The fit is statistical rather than exact: bars differ, tunings differ between gamelans, and Balinese pairs of instruments are tuned apart on purpose to beat (6.1).`,
      caption: String.raw`Top: the partials of the chosen bar on a logarithmic axis, with their measured ratios; drag any upper partial sideways to retune it (amplitudes are illustrative, falling with partial number). Bottom: the bar's dissonance curve with an idealized slendro scale (five equal 240 ¢ steps, orange) and 12-TET steps (faint); green dots are minima, and the orange labels give the distance from each slendro step to the nearest minimum. The measured bars line up only partly; try to bring more minima onto the slendro steps by dragging partials, and compare with the harmonic spectrum. Strike the bar or play a slendro scale on it.`,
      deps: ['music-6.5', 'music-3.11'],
      see: ['music-3.12', 'music-6.15'],
      refs: ['Sethares ch. 10'],
      tags: ['gamelan', 'tuning'],
      credit: 'W. A. Sethares, 1998 (Tuning, Timbre, Spectrum, Scale, ch. 10); measurements: M. E. Jones, K. L. Gee & J. Grimshaw, 2010',
      scope: String.raw`Only the partial ratios are measured data (one note each of two Balinese instruments, Jones et al., *JASA* 127, EL197–EL202, 2010); amplitudes are assumed. The equal 240 ¢ slendro grid is an idealization: real slendro tunings deviate by tens of cents and differ between gamelans; pelog has no standard set of steps and is not marked. Sethares's own analysis used other measured instruments; the claim of a timbre–scale correlation is debated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Slendro' },
      viz(v) {
        const M = v.M, F0 = 392, CMAX = 1250, AM = [1, 0.62, 0.45, 0.38, 0.32, 0.27];
        const BARS = { jublag: JUBLAG, ugal: UGAL, beam: BEAM.slice(0, 4), harm: [1, 2, 3, 4, 5] };
        let ratios = BARS.jublag.slice(), cache = null;
        const bar = v.select('bar', [{ value: 'jublag', label: 'jublag (measured)' }, { value: 'ugal', label: 'ugal (measured)' }, { value: 'beam', label: 'ideal free bar' }, { value: 'harm', label: 'harmonic' }], 'jublag', { onChange: (x) => { ratios = BARS[x].slice(); cache = null; place(); v.invalidate(); } });
        const sp = v.stage({ x: [0.9, 11], y: [0, 1.2], xlog: true, height: 170, axes: 'box', gutter: true, full: true, xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [8, '8']], yticks: [], xlabel: 'partial frequency ÷ fundamental (log scale)', title: 'the bar’s partials (drag the upper ones)' });
        const cv = v.stage({ x: [0, CMAX], y: [0, 1.15], height: 290, axes: 'box', gutter: true, full: true, xticks: [0, 240, 480, 720, 960, 1200].map((c) => [c, String(c)]), yticks: [[0, '0'], [1, '1']], xlabel: 'interval (cents; slendro steps marked)', ylabel: 'dissonance', title: 'dissonance curve against slendro' });
        const H = []; for (let i = 1; i < 6; i++) { const h = sp.handle(2, 0.5, { color: 'orange', r: 6, constrain: (x) => [M.clamp(x, 1.05, 10.5), AM[i] * 0.9] }); h.onDrag = () => { ratios[i] = h.x; cache = null; }; H.push(h); }
        function place() { H.forEach((h, k) => { const i = k + 1; h.visible = i < ratios.length; if (i < ratios.length) h.set(ratios[i], AM[i] * 0.9); }); }
        place();
        const spec = () => ratios.map((r, i) => [r, AM[i]]);
        const curve = () => { if (cache) return cache; const C = dissCurve(spec(), F0, 0, CMAX, 500); let mx = 0; for (const x of C.d) mx = Math.max(mx, x); cache = { C, mx, mins: minima(C, 0.006) }; return cache; };
        const SL = [0, 240, 480, 720, 960, 1200];
        v.soundButton('strike the bar', (snd) => snd.samples(toneBuf(spec(), F0, 2.2, { decay: 2.2 }), SR, { gain: 0.9 }));
        v.soundButton('slendro scale on this bar', (snd) => snd.samples(seqBuf(SL.map((c) => [[spec(), 261.6 * 2 ** (c / 1200)]]), 0.6, 0.05, { decay: 3 }), SR, { gain: 0.9 }));
        v.soundButton('slendro dyads', (snd) => snd.samples(seqBuf(SL.slice(1).map((c) => [[spec(), 261.6], [spec(), 261.6 * 2 ** (c / 1200)]]), 0.8, 0.08, { decay: 2.5 }), SR, { gain: 0.9 }));
        v.render(() => {
          ratios.forEach((r, i) => {
            sp.line(r, 0, r, AM[i] * 0.9, { color: i ? 'orange' : 'accent', width: 3 });
            if (!i) sp.dot(r, AM[0] * 0.9, { r: 5, color: 'accent' });
            const crowd = i > 0 && r / ratios[i - 1] < 1.1 && r / ratios[i - 1] > 0.91; sp.text(ratioStr(r), r, AM[i] * 0.9, { color: i ? 'orange' : 'accent', size: 11, align: crowd ? 'left' : 'center', dx: crowd ? 6 : 0, dy: crowd ? -2 : -12 });
          });
          const K = curve();
          for (let c = 100; c < CMAX; c += 100) cv.vline(c, { color: 'grid', width: 1 });
          for (const c of SL.slice(1)) cv.vline(c, { color: 'orange', width: 1.4, dash: [5, 4] });
          cv.path(Array.from(K.C.c, (x, i) => [x, K.C.d[i] / K.mx]), { color: 'accent', width: 2.4 });
          for (const m of K.mins) cv.dot(m.c, m.d / K.mx, { r: 4, color: 'green' });
          for (const c of SL.slice(1, 5)) {
            const near = K.mins.reduce((b, m) => (Math.abs(m.c - c) < Math.abs(b - c) ? m.c : b), 1e9);
            cv.text(`${near < 1e8 ? sc(v, near - c, 0) : '—'} ¢`, c, 1.08, { color: 'orange', size: 10.5, align: 'center', plate: true });
          }
        });
        v.legend([['accent', 'dissonance curve of this bar'], ['green', 'minima'], ['orange', 'idealized slendro steps (240 ¢)']]);
        v.readout(() => {
          const K = curve(), devs = SL.slice(1, 5).map((c) => Math.min(...K.mins.map((m) => Math.abs(m.c - c)), 999));
          const hit = devs.filter((d) => d <= 20).length;
          return `partials ${ratios.map(ratioStr).join(' : ')} · minima at ${K.mins.map((m) => v.fix(m.c, 0)).join(', ') || '—'} ¢ · slendro steps 240, 480, 720, 960 ¢ have a minimum within 20 ¢: ${hit} of 4 (mean distance ${v.fix(devs.reduce((a, b) => a + b, 0) / 4, 0)} ¢)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8',
      kind: 'Model',
      name: 'Euler’s gradus and Tenney height',
      statement: String.raw`Two classical measures of the complexity of a just interval $p/q$ in lowest terms:
(a) **Euler's gradus suavitatis** (1739): write $n=\operatorname{lcm}$ of the terms (for an interval, $n=pq$) as $n=\prod p_i^{e_i}$; then $\Gamma(n)=1+\sum_i e_i\,(p_i-1)$. The octave has $\Gamma=2$, the fifth $4$, the fourth $5$, the major third and major sixth $7$, the minor third and minor sixth $8$, the whole tone $9/8$ also $8$.
(b) **Tenney height** $\mathrm{TH}(p/q)=\log_2(pq)$: octave $1$, fifth $2.58$, fourth $3.58$, major sixth $3.91$, major third $4.32$, minor third $4.91$.
Both rank the classical consonances in roughly the traditional order, and both predict the *order* of the dips in a harmonic tone's dissonance curve (6.4) quite well; neither depends on timbre or register.`,
      idea: String.raw`Both measures count how "far" a ratio is from 1 in the multiplicative lattice of primes. Tenney height is the logarithm of the period of the combined waveform in units of the common fundamental's period, $pq$ times; Euler's gradus weights each prime by $p-1$, so 5 counts more than 3, and 3 more than 2. They succeed for harmonic tones because the depth of a dip at $p/q$ in the roughness curve is governed by how low the coinciding partials are, the $q$-th of the upper tone with the $p$-th of the lower, and smaller $p,q$ also means fewer near misses (6.2). They fail as explanations exactly where roughness and ratio part company: they cannot see register (6.9) or inharmonic partials (6.5), and they assign a definite rank to ratios like $7/4$ that listeners judge very differently in different musical contexts.`,
      caption: String.raw`Top: every ratio $p/q$ in the octave with $p,q\le16$, placed at its size in cents and raised to its complexity (choose Euler's gradus or Tenney height). Drag the green cutoff: ratios simpler than it are highlighted and named. Bottom: the dissonance curve of a 6-partial harmonic tone with the highlighted ratios marked on it. The readout gives the rank correlation between complexity and dissonance over the highlighted ratios: strong for the simplest few, weaker once ratios with 7, 11 or 13 appear.`,
      deps: ['music-6.1'],
      see: ['music-6.12', 'music-6.4', 'music-7.5'],
      refs: ['Benson ch. 4'],
      tags: ['consonance', 'ratios'],
      credit: 'Leonhard Euler, 1739; James Tenney (harmonic distance), 1980s',
      scope: String.raw`Purely arithmetical measures; they describe harmonic, sustained tones at best. The dissonance curve uses Sethares's model with amplitudes $0.88^{k-1}$ on C4. The cutoff list includes ratios that no tradition treats as consonant; the correlation is computed on whatever falls below it.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tenney_height' },
      viz(v) {
        const M = v.M, F0 = 261.63;
        const meas = v.select('complexity', [{ value: 'euler', label: 'Euler gradus Γ' }, { value: 'tenney', label: 'Tenney height log₂pq' }], 'euler', { onChange: () => { cut.set(1240, meas.value === 'euler' ? 8.5 : 4.6); v.invalidate(); } });
        const R = []; for (let q = 1; q <= 16; q++) for (let p = q; p <= 2 * q && p <= 16; p++) if (gcd(p, q) === 1) R.push({ p, q, c: cents(p / q), g: gradus([p, q]), t: tenney(p, q) });
        const cx = (r) => (meas.value === 'euler' ? r.g : r.t);
        const top = v.stage({ x: [-30, 1260], y: [0, 25], height: 300, axes: 'box', gutter: true, full: true, xticks: [0, 200, 400, 600, 800, 1000, 1200].map((c) => [c, String(c)]), xlabel: 'interval (cents)', ylabel: 'complexity (lower = simpler)', title: 'just ratios and their complexity' });
        const cut = top.handle(1240, 8.5, { color: 'green', r: 7, constrain: (x, y) => [1240, M.clamp(y, 1.5, meas.value === 'euler' ? 24 : 8.2)] });
        const harm = dissCurve(harmonic(6, 0.88), F0, -30, 1260, 645); let hm = 0; for (const x of harm.d) hm = Math.max(hm, x);
        const dAt = (c) => sample(harm, c) / hm;
        const bot = v.stage({ x: [-30, 1260], y: [0, 1.15], height: 240, axes: 'box', gutter: true, full: true, xticks: [0, 200, 400, 600, 800, 1000, 1200].map((c) => [c, String(c)]), yticks: [[0, '0'], [1, '1']], xlabel: 'interval (cents)', ylabel: 'dissonance', title: 'roughness of a harmonic tone at those ratios' });
        const spearman = (xs, ys) => { const rk = (a) => { const o = a.map((x, i) => [x, i]).sort((u, w) => u[0] - w[0]), r = new Array(a.length); let i = 0; while (i < o.length) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2; i = j + 1; } return r; }; const a = rk(xs), b = rk(ys), n = a.length, ma = (n - 1) / 2; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - ma); saa += (a[i] - ma) ** 2; sbb += (b[i] - ma) ** 2; } return sab / Math.sqrt(saa * sbb); };
        const sel = () => R.filter((r) => cx(r) <= cut.y);
        v.render(() => {
          const top17 = meas.value === 'euler' ? 25 : 8.5;
          top.setView([-30, 1260], [0, top17]);
          if (meas.value === 'tenney') cut.set(1240, Math.min(cut.y, 8.2));
          top.hband(0, cut.y, { color: 'green', alpha: 0.06 });
          top.hline(cut.y, { color: 'green', width: 1.5, dash: [5, 4] });
          const S = sel(); const many = S.length > 16;
          for (const r of R) {
            const on = cx(r) <= cut.y, y = cx(r);
            top.line(r.c, 0, r.c, y, { color: on ? 'green' : 'muted', width: on ? 2 : 1, alpha: on ? 1 : 0.4 });
            top.dot(r.c, y, { r: on ? 4 : 2.5, color: on ? 'green' : 'muted' });
            if (on && (!many || r.p * r.q <= 30)) top.text(`${r.p}/${r.q}`, r.c, y, { color: 'green', size: 10, align: 'center', dy: -9 });
          }
          bot.path(Array.from(harm.c, (x, i) => [x, harm.d[i] / hm]), { color: 'accent', width: 2.2 });
          for (const r of S) { bot.vline(r.c, { color: 'green', width: 1, alpha: 0.35 }); bot.dot(r.c, dAt(r.c), { r: 4, color: 'green' }); }
        });
        v.readout(() => {
          const S = sel().filter((r) => r.p !== r.q);
          const rho = S.length >= 3 ? spearman(S.map(cx), S.map((r) => dAt(r.c))) : NaN;
          const ord = S.slice().sort((a, b) => cx(a) - cx(b) || a.c - b.c).slice(0, 8).map((r) => `${r.p}/${r.q} (${meas.value === 'euler' ? r.g : v.fix(r.t, 2)})`);
          return `${S.length} non-unison ratios below the cutoff ${v.fix(cut.y, 1)} · simplest: ${ord.join(', ')} · Spearman correlation of complexity with roughness: ${Number.isFinite(rho) ? v.fix(rho, 2) : '—'}`;
        });
      },
    },
  ],
};
