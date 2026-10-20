import stylometryConcept from './source-audit-stylometry.js';
import zipfPaper from './source-audit-zipf.js';
import {shannonPaper} from './source-audit-shannon.js';
// Linguistics & Language — Chapter 4, part c: items 4.11–4.14
import { corpus, TEXT_OPTS, TEXT_LABELS, MINE_DEFAULT, FED, FED_WORDS, logRanks, fitLogLog, toSyms, letterModel, guessDistribution, shannonBounds, TEXTS, TEST_TEXT } from './ch04.shared.js';

// ---- 4.14: Shannon's published bounds, 27-letter alphabet, columns N = 1..15 and 100 (Table in section 6 of the paper; read from a scan, see verify)
const SH_UP = [4.03, 3.42, 3.0, 2.6, 2.7, 2.2, 2.8, 1.8, 1.9, 2.1, 2.2, 2.3, 2.1, 1.7, 2.1, 1.3];
const SH_LO = [3.19, 2.50, 2.1, 1.7, 1.7, 1.3, 1.8, 1.0, 1.0, 1.0, 1.3, 1.3, 1.2, 0.9, 1.2, 0.6];
const SH_NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 100];
const SH_F27 = [4.76, 4.03, 3.32, 3.1], SH_F26 = [4.70, 4.14, 3.56, 3.3];


export default {
  collection: 'ling',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Similar information rates across languages',
      credit: 'Christophe Coupé, Yoon Mi Oh, Dan Dediu & François Pellegrino, 2019 (Science Advances 5, eaaw2594)',
      statement: String.raw`Languages differ widely in how much information a syllable carries ($\mathrm{ID}$, bits per syllable: about 5 for Basque to about 8 for Vietnamese in a study of 17 languages) and in how fast they are spoken ($\mathrm{SR}$, syllables per second), but the two trade off, so that the information rate
$$\mathrm{IR}\;=\;\mathrm{ID}\times\mathrm{SR}$$
is much more uniform: the pooled mean was about 39 bits per second (standard deviation about 5), with speech rate averaging about 6.6 syllables per second. Dense languages are spoken more slowly; sparse ones faster.`,
      idea: String.raw`Information density was estimated from text in each language as the average reduction in uncertainty per syllable (the predictability of a syllable from its context, in the spirit of 4.8 and 4.9), and speech rate from recordings of native speakers reading 15 short texts that were translations of each other. The coupling of ID and SR is what is surprising: the rate of 39 bits/s is an average, and cannot be read off from density or speed alone. A natural reading is that languages evolve under limits on production and comprehension (cognitive capacity for processing, articulation speed) so that whatever the structure of a language, the stream it supports carries a similar load. The study is a correlational, cross-linguistic comparison of 17 languages and says nothing about whether the load is the same in conversation.`,
      caption: String.raw`Left: the information-rate plane. The curve $\mathrm{ID}=39.15/\mathrm{SR}$ (with the $\pm1$ SD band of the paper’s pooled IR) is where languages are said to lie. Drag the language handle: its rate, $\mathrm{ID}\times\mathrm{SR}$, and its distance from the mean in SDs are read out. The hollow marks show where Basque and Vietnamese would sit if their rate equalled the pooled mean. Right: a simulation (not data) of 17 languages with and without the trade-off.`,
      scope: String.raw`Seventeen languages from several families, read-aloud speech. The numbers shown (mean IR 39.15 bits/s, SD 5.10; mean SR 6.63 syllables/s, SD 1.15; ID from 4.8 for Basque to 8.0 for Vietnamese) are the paper’s pooled and extreme values; per-language rates are not reproduced here. The right panel is a toy simulation.`,
      deps: ['ling-4.8', 'ling-2.9'],
      refs: ['Jurafsky & Martin ch. 3'],
      tags: ['information rate', 'speech rate'],
      links: { doi: 'https://doi.org/10.1126/sciadv.aaw2594' },
      viz(v) {
        const IRm = 39.15, IRsd = 5.10, SRm = 6.63, SRsd = 1.15;
        const mode = v.select('Right panel', [{ value: 'coupled', label: 'with trade-off' }, { value: 'indep', label: 'independent' }], 'coupled', { onChange: () => v.invalidate() });
        let seed = 1; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [3, 11], y: [3, 11], axes: 'box', gutter: true, xlabel: 'speech rate SR (syllables per second)', ylabel: 'information density ID (bits per syllable)', height: 360, title: 'Information-rate plane' });
        const s2 = v.stage({ x: [4, 9], y: [0, 70], axes: 'box', gutter: true, xlabel: 'ID (bits per syllable)', ylabel: 'rate ID × SR (bits/s)', height: 360, title: 'Simulation: 17 languages' });
        const h = s1.handle(7.5, 5.4, { color: 'orange', label: 'a language', labelPos: 'ne' });
        let info = {}, sim = {};
        v.render(() => {
          const xs = []; for (let i = 0; i <= 80; i++) xs.push(3 + (8 * i) / 80);
          s1.between((x) => (IRm - IRsd) / x, (x) => (IRm + IRsd) / x, 3, 11, { fill: 'green', fillAlpha: 0.15 });
          s1.fn((x) => IRm / x, { domain: [3.4, 11], color: 'green', width: 3 });
          s1.vline(SRm, { color: 'muted', dash: true }); s1.text('mean SR 6.6', SRm + 0.1, 10.6, { size: 11, color: 'muted', align: 'left' });
          for (const [nm, id] of [['Basque', 4.8], ['Vietnamese', 8.0]]) { s1.dot(IRm / id, id, { r: 6, hollow: true, color: 'purple', label: nm + ' (ID ' + id + ')', labelPos: 'e' }); }
          const IR = h.y * h.x; info = { IR, z: (IR - IRm) / IRsd, ID: h.y, SR: h.x };
          // right panel
          const r = v.rng(seed * 977 + (mode.value === 'coupled' ? 1 : 2)); const pts = [];
          for (let i = 0; i < 17; i++) {
            const id = 4.8 + 3.2 * r(); let sr;
            if (mode.value === 'coupled') { const R = IRm + IRsd * r.normal(); sr = R / id; } else sr = Math.max(3, SRm + SRsd * r.normal());
            pts.push([id, id * sr]);
          }
          s2.hband(IRm - IRsd, IRm + IRsd, { color: 'green', alpha: 0.15 }); s2.hline(IRm, { color: 'green', width: 2 });
          s2.dots(pts, { r: 5, color: mode.value === 'coupled' ? 'accent' : 'red' });
          const m = pts.reduce((a, p) => a + p[1], 0) / 17, sd = Math.sqrt(pts.reduce((a, p) => a + (p[1] - m) ** 2, 0) / 16);
          sim = { m, sd };
        });
        v.legend([['green', 'IR = 39.15 ± 5.10 bits/s'], ['purple', 'extreme IDs, if at the mean rate', { dot: true }], ['accent', 'simulated languages', { dot: true }]]);
        v.readout(() => `Your language: ID ${v.fix(info.ID, 1)} bits/syllable × SR ${v.fix(info.SR, 1)} syll/s = **${v.fix(info.IR, 1)} bits/s** (${v.fix(info.z, 1)} SD from the pooled mean).\nSimulation: IDs drawn uniformly from 4.8–8.0; ${mode.value === 'coupled' ? 'rates drawn around 39.15 so SR = IR/ID' : 'speech rates drawn independently around 6.63 ± 1.15'}: mean IR ${v.fix(sim.m, 1)}, SD ${v.fix(sim.sd, 1)} bits/s. Without the trade-off the rates spread about twice as wide.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.12
    stylometryConcept,
    // ───────────────────────────────────────────────────────────────────────── 4.13
    zipfPaper,
    // ───────────────────────────────────────────────────────────────────────── 4.14
    shannonPaper,
  ],
};
