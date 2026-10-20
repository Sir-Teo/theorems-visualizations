// Music Theory & Acoustics — Chapter 7: Tuning and temperament (part b: items 7.7–7.12)
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, NOTE, sc, fold, circ, ring, cents, seqCents, chordCents, nearPairs, tuneFromFifths, CHAIN, chainSemi, ivl, triadC, triadAbs, cfExpand, convs, edoApprox } from './ch07.shared.js';
import { meantoneModel, meantoneAudio, JM_ET_ALPHA } from './source-audit-just-meantone.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export default {
  collection: 'music',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.7
    {
      num:'7.7',kind:'Method',name:'Quarter-comma meantone',
      statement:String.raw`Let $C_s=1200\log_2(81/80)$ be the syntonic comma in cents. A regular meantone fifth with narrowing fraction $\alpha$ has ratio
$$q=(3/2)(81/80)^{-\alpha}.$$
Its size is $f=1200\log_2q$. Four regular fifths minus two octaves give a major third of $4f-2400$ cents. At $\alpha=1/4$, $q^4=5$, so that third is exactly $5/4$; $f\approx696.578428$ cents. At $\alpha=1/3$, $q^3=10/3$, so the regular minor third $4/q^3$ is exactly $6/5$.

In the specified twelve-note cut, eleven fifths have ratio $q$ and the closing fifth has ratio $W=2^7/q^{11}$. At quarter comma, $W/q=128/125$: eight major thirds are pure and the four crossing the cut are higher by about 41.058858 cents.

Twelve equal fifths require $f=700$, hence
$$\alpha_{\rm ET}=\frac{1200\log_2(3/2)-700}{C_s}$$
which is approximately 0.090903680. It is close to $1/11$, but is not equal to it.`,
      idea:String.raw`The syntonic comma identity (7.6) gives $(3/2)^4/(5/4)=4(81/80)$. Removing a quarter comma from each of four fifths therefore makes the major third pure. The twelve fifths must multiply to $2^7$; eleven chosen generators determine the closing fifth, rather than forcing all twelve generators to be equal.

Our chain is E♭–B♭–F–C–G–D–A–E–B–F♯–C♯–G♯, with C anchored at ratio 1. The closing step G♯–E♭ is the cut. A major third traverses four steps: eight do not cross the cut and four do. Their difference is $1200\log_2(W/q)$. In quarter comma $q^{12}=125$, proving the diesis ratio $128/125$. In equal temperament $q^{12}=128$, so $W=q$ and the difference vanishes.`,
      caption:String.raw`The continuous $\alpha$ control covers 0–0.34. Presets use exact Pythagorean, quarter-comma, third-comma and equal-tempered definitions; the separate $1/11$ preset demonstrates its small difference from equal temperament. Left: deviations of the regular fifth, regular major/minor thirds and closing fifth from their pure ratios. Right: every major third in the specified twelve-note cut; gold selects the triad played. The plots include the entire offered range.`,
      deps:['music-7.6','music-7.5'],see:['music-7.4','music-7.12','music-7.8','music-7.9'],
      refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §5.12, pp.176–179 and exercise1'],tags:['meantone','temperament'],
      credit:'Tuning exposition: Dave Benson, 2008 Web version; twelve-note cut, continuous controls and synthesis authored here.',
      scope:String.raw`A specified mathematical twelve-note model, not a historical priority, keyboard prescription or judgement that a third is unusable. Other cuts and extra enharmonic keys are possible. Preset identities are exact symbolic definitions; general control values and displayed cents are evaluated numerically. At $1/11$, the regular fifth is approximately 699.999884 cents and the closing fifth 700.001280 cents. Audio uses the same authored C4 = 261.6256-Hz, six-harmonic, 44,100-Hz convention as 7.5, with peak bound 0.12 and 10-ms end ramps. The output is uncalibrated and does not certify a perceptual difference.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify: false,
      viz(v){
        const alpha=v.slider('syntonic-comma fraction α',0,.34,.25,{step:'any',fmt:x=>x.toPrecision(12)}),key=v.slider('triad root',0,11,0,{int:true,fmt:x=>meantoneModel(.25,x).keyName});
        [['Pythagorean',0],['1/4',.25],['1/3',1/3],['Exact 12-TET',JM_ET_ALPHA],['1/11 comparison',1/11]].forEach(([label,x])=>v.button(label,()=>alpha.set(x)));
        const A=v.stage({x:[-.7,3.7],y:[-40,75],axes:'box',gutter:true,height:340,minWidth:280,xticks:[[0,'5th'],[1,'M3'],[2,'m3'],[3,'close 5th']],ylabel:'error from pure (cents)',title:'regular intervals and closing fifth'});
        const B=v.stage({x:[-35,85],y:[-1.1,12.2],axes:false,full:true,height:430,minWidth:280,title:'all twelve major-third errors (cents)'});
        let info;const play=action=>sd=>{const a=meantoneAudio(alpha.value,key.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play selected triad',play('triad'));v.soundButton('Play closing fifth',play('closing'));v.soundButton('Regular fifth, then pure',play('compare'));v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{
          const a=meantoneModel(alpha.value,key.value);info=a;const lo=Math.min(0,...a.errors)-15,hi=Math.max(0,...a.errors)+15;A.setView([-.7,3.7],[lo,hi]);A.line(-.45,0,3.45,0,{color:'muted',width:1});
          a.errors.forEach((e,j)=>{const col=['accent','orange','purple','red'][j];A.rect(j-.3,0,j+.3,e,{fill:col,fillAlpha:.55,stroke:false});A.text(`${e<0?'−':'+'}${v.fix(Math.abs(e),3)}`,j,e,{size:10.5,align:'center',baseline:e>=0?'bottom':'top',dy:e>=0?-4:4,color:col});});
          B.text('note',-32,11.7,{size:11,weight:700,align:'left',baseline:'middle'});B.text('third error (¢)',28,11.7,{size:11,weight:700,align:'center',baseline:'middle'});B.line(0,-.3,0,11.3,{color:'muted',width:1});
          a.thirds.forEach((t,j)=>{const y=11-j,col=t.pure?'green':t.error<0?'purple':'orange';B.text(t.name,-32,y,{size:12,align:'left',baseline:'middle'});if(j===key.value)B.dot(-18,y,{r:4.5,ring:false,color:'gold'});B.rect(0,y-.22,t.error,y+.22,{fill:col,fillAlpha:.65,stroke:false});B.text(`${t.error<0?'−':'+'}${v.fix(Math.abs(t.error),3)}`,80,y,{size:10.5,align:'right',baseline:'middle',color:col});});
        });
        v.legend([['green','exact pure third at quarter-comma preset'],['purple','below the pure third'],['orange','above the pure third'],['gold','selected root']]);
        v.readout(()=>{const a=info;return `α=${a.alpha.toPrecision(12)}; ${a.kind==='equal'?'exact 12-TET preset: all twelve fifths are 700 cents':a.kind==='quarter'?'quarter-comma preset: eight exact pure major thirds':a.kind==='third'?'third-comma preset: regular minor third is exactly 6/5':a.kind==='pythagorean'?'Pythagorean generator':'general numerical parameter'}. Regular fifth ${v.fix(a.fifth,9)} cents; closing fifth ${v.fix(a.closing,9)} cents. Regular major / minor third ${v.fix(a.major,9)} / ${v.fix(a.minor,9)} cents. Cut difference ${v.fix(a.delta,9)} cents. Selected ${a.keyName} triad: ${a.triad.map(x=>v.fix(x,6)).join(', ')} Hz; intervals ${a.triadCents.map(x=>v.fix(x,6)).join(', ')} cents. At 1/11 the fifths are close to equal, and are not all 700 cents.`;});
      },
    },
    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8',
      kind: 'Method',
      name: 'Well temperaments',
      statement: String.raw`A **well temperament** distributes the Pythagorean comma unevenly around the circle of fifths without any wolf: the twelve fifths are tuned to sizes that sum to exactly seven octaves (8400 ¢) but differ from one another. Keys near C get nearly pure thirds and fifths, keys far from C get wider, brighter thirds, and every key is usable, each with its own character. Examples that survive in the literature are Werckmeister III (four fifths narrowed by a quarter of the Pythagorean comma), Kirnberger III (four fifths narrowed by a quarter of the syntonic comma, one by a schisma), and Vallotti in its modern form (six fifths narrowed by a sixth of the Pythagorean comma). Any assignment of narrowings $d_1,\dots,d_{12}$ to the twelve fifths with $\sum d_i=23.46$ ¢ is a closed twelve-note tuning.`,
      idea: String.raw`The sum constraint is just 7.3: twelve fifths of sizes $701.955-d_i$ close the circle exactly when $\sum d_i$ equals the Pythagorean comma. Given the constraint, the designer chooses where to put the narrowing. A major third is four consecutive fifths less two octaves, so its error from the pure third is the sum of the four narrowings minus the syntonic comma; the temperament determines which keys get the thirds with the least error and which with the most. The "colour of the keys" of the eighteenth-century writers is this variation.`,
      caption: String.raw`Left: how much each of the twelve fifths is narrowed from pure; drag a bar's top and the others rebalance so the sum stays at one Pythagorean comma, or load a historical tuning. Right: the circle of fifths coloured by the major third of each key (darker red = wider than the pure 5/4); the figures are the third's excess in cents. Play a cadence I–IV–V–I in C and in F♯ and listen to the difference in character.`,
      deps: ['music-7.7'],
      see: ['music-7.9', 'music-7.14'],
      refs: ['Benson ch. 5'],
      tags: ['temperament', 'keys'],
      credit: 'A. Werckmeister, Musicalische Temperatur, 1691; J. P. Kirnberger (1770s); F. A. Vallotti (c. 1728, published 1779)',
      scope: String.raw`Fifth-size recipes as commonly quoted; the Vallotti recipe used here is the modern form (six fifths F–C … E–B narrowed by 1/6 of a Pythagorean comma), which differs slightly from what Vallotti himself described, and Kirnberger's third temperament is taken to have the schisma on F♯–C♯. Werckmeister's and Kirnberger's exact dates and precise recipes should be checked against the historical sources.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Well_temperament' },
      verify: true,
      viz(v) {
        const eq = () => Array(12).fill(PCOMMA / 12), mk = (idx, amt, rest = 0) => { const d = Array(12).fill(0); idx.forEach((i) => { d[i] = amt; }); return d; };
        const PRESET = {
          pyth: { n: 'Pythagorean', d: () => { const d = Array(12).fill(0); d[11] = PCOMMA; return d; } },
          qm: { n: 'quarter-comma meantone', d: () => { const d = Array(12).fill(SCOMMA / 4); d[11] = PCOMMA - 11 * SCOMMA / 4; return d; } },
          wm3: { n: 'Werckmeister III', d: () => mk([3, 4, 5, 8], PCOMMA / 4) },
          kb3: { n: 'Kirnberger III', d: () => { const d = mk([3, 4, 5, 6], SCOMMA / 4); d[9] = PCOMMA - SCOMMA; return d; } },
          val: { n: 'Vallotti (modern)', d: () => mk([2, 3, 4, 5, 6, 7], PCOMMA / 6) },
          et: { n: 'equal temperament', d: eq },
        };
        let d = PRESET.wm3.d(), name = 'wm3';
        const pre = v.select('tuning', Object.entries(PRESET).map(([k, x]) => ({ value: k, label: x.n })).concat([{ value: 'custom', label: 'custom' }]), 'wm3', { onChange: (k) => { if (k !== 'custom') { d = PRESET[k].d(); name = k; hs.forEach((h, i) => h.set(i, d[i])); v.invalidate(); } } });
        const kk = v.select('cadence in', [{ value: 0, label: 'C' }, { value: 6, label: 'F♯' }], 0);
        const bs = v.stage({ x: [-0.6, 11.6], y: [-40, 26], axes: 'box', gutter: true, height: 340, xticks: CHAIN.map((c, i) => [i, c]), yticks: [-40, -20, 0, 10, 20].map((y) => [y, String(y)]), xlabel: 'fifth starting on …', ylabel: 'fifth narrower than pure by (¢)', title: 'drag the tops of the bars' });
        const wh = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 340, title: 'major third of each key' });
        const snd = v.sound();
        const hs = d.map((x, i) => { const h = bs.handle(i, x, { color: 'gold', r: 7, constrain: (xx, yy) => [i, clamp(yy, -40, 25)] }); h.onDrag = () => { const val = h.y, others = d.reduce((s, q, j) => (j === i ? s : s + q), 0), want = PCOMMA - val; d = d.map((q, j) => (j === i ? val : Math.abs(others) > 0.5 ? (q * want) / others : q + (want - others) / 11)); name = 'custom'; pre.value = 'custom'; v.invalidate(); }; return h; });
        const fifths = () => d.map((x) => FIFTH - x);
        const pcs = () => tuneFromFifths(fifths());
        const third = (P, r) => fold(P[(r + 4) % 12] - P[r]);
        const play = () => { const P = pcs(), r = kk.value, roots = [r, (r + 5) % 12, (r + 7) % 12, r]; snd.stop(); snd.samples(seqCents(roots.map((x) => triadAbs(P, x)), C4, 1.2, 0.12), SR, { gain: 0.9 }); };
        v.soundButton('play I–IV–V–I', play);
        v.render(() => {
          hs.forEach((h, i) => h.set(i, d[i]));
          bs.hline(0, { color: 'muted' }); bs.hline(PCOMMA / 12, { color: 'green', dash: [5, 4] });
          bs.text('equal temperament (1.95 ¢)', -0.5, PCOMMA / 12, { size: 10.5, color: 'green', align: 'left', baseline: 'bottom', dy: -3 });
          d.forEach((x, i) => { bs.rect(i - 0.3, 0, i + 0.3, x, { fill: x < 0 ? 'red' : 'orange', fillAlpha: 0.45, color: x < 0 ? 'red' : 'orange' }); });
          const P = pcs();
          for (let j = 0; j < 12; j++) {
            const r = chainSemi(j), t = third(P, r) - M3J, a0 = ((j - 3) * 30 - 15) * Math.PI / 180, a1 = a0 + Math.PI / 6, pts = [];
            for (let q = 0; q <= 6; q++) { const a = a0 + (a1 - a0) * q / 6; pts.push([1.38 * Math.sin(a), 1.38 * Math.cos(a)]); }
            for (let q = 6; q >= 0; q--) { const a = a0 + (a1 - a0) * q / 6; pts.push([0.72 * Math.sin(a), 0.72 * Math.cos(a)]); }
            const c = v.ramp(clamp((t + 2) / 24, 0, 1), 'red');
            wh.poly(pts, { fill: c, fillAlpha: 1, color: 'panel', width: 2 });
            const am = (a0 + a1) / 2, p = [1.05 * Math.sin(am), 1.05 * Math.cos(am)];
            wh.text(NOTE[r], p[0], p[1], { size: 13, align: 'center', baseline: 'bottom', weight: 700, color: 'ink' });
            wh.text(sc(v, t, 1), p[0], p[1], { size: 11, align: 'center', baseline: 'top', dy: 2, color: 'ink' });
          }
          wh.text('major thirds re 5/4', 0, 0.12, { size: 11, color: 'muted', align: 'center' });
          wh.text('circle of fifths, C at the top', 0, -0.12, { size: 10.5, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const P = pcs(), s = d.reduce((a, b) => a + b, 0), thirds = Array.from({ length: 12 }, (_, r) => ({ r, t: third(P, r) - M3J })).sort((a, b) => a.t - b.t);
          return `${name === 'custom' ? 'custom tuning' : PRESET[name].n}: Σ narrowing = ${v.fix(s, 2)} ¢ (the Pythagorean comma ${v.fix(PCOMMA, 2)} ¢); fifths from ${v.fix(FIFTH - Math.max(...d), 1)} to ${v.fix(FIFTH - Math.min(...d), 1)} ¢ · best major third ${NOTE[thirds[0].r]} (${sc(v, thirds[0].t, 1)} ¢ from pure), worst ${NOTE[thirds[11].r]} (${sc(v, thirds[11].t, 1)} ¢) · third in C ${v.fix(third(P, 0), 1)} ¢, in F♯ ${v.fix(third(P, 6), 1)} ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Invention',
      name: 'Twelve-tone equal temperament',
      statement: String.raw`**Twelve-tone equal temperament** (12-TET) divides the octave into twelve equal steps, each of frequency ratio $2^{1/12}\approx1.05946$ (100 cents), so that all keys sound alike and every interval is the same size wherever it starts. Compared with the just intervals, the fifth ($700$ ¢) is 1.96 ¢ narrow of $3/2$, the major third ($400$ ¢) is 13.7 ¢ wide of $5/4$, the minor third ($300$ ¢) is 15.6 ¢ narrow of $6/5$, and the harmonic seventh (1000 ¢) is 31.2 ¢ wide of $7/4$. Frets of a lute or guitar are placed at lengths $L\,2^{-n/12}$; the "rule of eighteen", cutting off a $1/18$ of the remaining length at each fret, is a good practical approximation.`,
      idea: String.raw`Making all semitones equal means each is the twelfth root of 2, so twelve of them make exactly the octave and the circle of fifths closes: seven semitones, $2^{7/12}=1.498307$, stand in for the pure fifth, the whole Pythagorean comma being shared out as $23.46/12=1.955$ ¢ per fifth (7.7 with $\alpha=1/11$). The thirds and sixths pay for it: four fifths up give 400 ¢ rather than the pure 386.3 ¢. A pure third differs from the equal-tempered one by 13.7 ¢, and the partials that would coincide in a just triad now beat, the 5th harmonic of the root against the 4th of the third at about 10 Hz.`,
      caption: String.raw`Top: a string of unit length with the twelve frets of equal temperament (blue) and, for the interval you pick, the position of the just fret (green): the gap is the tuning error, in cents and in millimetres on a 650 mm scale. Bottom: the error of every equal-tempered interval from its just ratio. Play the chord in equal temperament, in just intonation, or alternating, and read off the beats of the nearly coincident partials.`,
      deps: ['music-7.3', 'music-1.6'],
      see: ['music-7.11', 'music-7.5', 'music-7.7'],
      refs: ['Benson ch. 5', 'Loy I ch. 3'],
      tags: ['equal temperament'],
      credit: 'Zhu Zaiyu, 1584 (exact calculation); Simon Stevin, c. 1605 (independently, published 1884)',
      scope: String.raw`Mathematical definition; the claim of historical priority for Zhu Zaiyu is from standard secondary sources (his computation in the Complete Compendium of Music and Pitch, 1584). Stevin's treatise was published only in 1884. Musicians have used slightly unequal tunings for most of the history of keyboards: equal temperament became standard for pianos only in the 19th century.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equal_temperament' },
      verify: true,
      viz(v) {
        const IV = [[16, 15, 1, 'minor second'], [9, 8, 2, 'major second'], [6, 5, 3, 'minor third'], [5, 4, 4, 'major third'], [4, 3, 5, 'fourth'], [45, 32, 6, 'tritone'], [3, 2, 7, 'fifth'], [8, 5, 8, 'minor sixth'], [5, 3, 9, 'major sixth'], [9, 5, 10, 'minor seventh'], [15, 8, 11, 'major seventh']];
        const sel = v.select('interval', IV.map((x, i) => ({ value: i, label: x[3] })), 3);
        const chordSel = v.select('chord', [{ value: 'maj', label: 'major triad' }, { value: 'min', label: 'minor triad' }, { value: 'dom', label: 'dominant 7th (4:5:6:7)' }], 'maj');
        const fr = v.stage({ x: [-0.02, 0.53], y: [0, 1], height: 210, axes: false, full: true, title: 'the fretboard: distance from the nut, as a fraction of the string (the first octave)' });
        const eb = v.stage({ x: [0.4, 11.6], y: [-34, 34], axes: 'box', gutter: true, height: 300, full: true, xticks: IV.map((x) => [x[2], x[3].replace('minor ', 'm').replace('major ', 'M').replace('second', '2').replace('third', '3').replace('sixth', '6').replace('seventh', '7')]), yticks: [-30, -15, 0, 15, 30].map((y) => [y, String(y)]), ylabel: '12-TET − just (¢)', title: 'equal-tempered intervals against their just ratios' });
        const snd = v.sound();
        const CH = { maj: { et: [0, 400, 700], jt: [0, M3J, FIFTH] }, min: { et: [0, 300, 700], jt: [0, cents(6 / 5), FIFTH] }, dom: { et: [0, 400, 700, 1000], jt: [0, M3J, FIFTH, cents(7 / 4)] } };
        const play = (m) => { const c = CH[chordSel.value]; snd.stop(); snd.samples(seqCents(m === 'et' ? [c.et] : m === 'jt' ? [c.jt] : [c.jt, c.et, c.jt, c.et], C4, m === 'alt' ? 1.3 : 2.4, 0.12), SR, { gain: 0.9 }); };
        v.soundButton('play: equal', () => play('et')); v.soundButton('play: just', () => play('jt')); v.soundButton('alternate: just, equal', () => play('alt'));
        v.render(() => {
          const [p, q, n, nm] = IV[sel.value], pos = (x) => 1 - 1 / x;
          fr.line(0, 0.5, 0.53, 0.5, { color: 'faint', width: 3 });
          for (let k = 0; k <= 12; k++) { const x = 1 - 2 ** (-k / 12); fr.line(x, 0.36, x, 0.64, { color: k === n ? 'accent' : 'muted', width: k === n ? 3 : 1.2 }); fr.text(String(k), x, 0.3, { size: 10, color: 'muted', align: 'center', baseline: 'top' }); }
          const xj = pos(p / q), xe = 1 - 2 ** (-n / 12);
          fr.line(xj, 0.5, xj, 0.9, { color: 'green', width: 2.4 }); fr.dot(xj, 0.9, { r: 5, color: 'green' });
          fr.line(xe, 0.5, xe, 0.76, { color: 'accent', width: 2.4 }); fr.dot(xe, 0.76, { r: 5, color: 'accent' });
          fr.text(`just ${p}/${q}`, xj, 0.9, { size: 11.5, color: 'green', align: xj > xe ? 'left' : 'right', dx: xj > xe ? 8 : -8, weight: 700 });
          fr.text(`12-TET fret ${n}`, xe, 0.76, { size: 11.5, color: 'accent', align: xj > xe ? 'right' : 'left', dx: xj > xe ? -8 : 8, weight: 700 });
          fr.text('nut', 0, 0.68, { size: 10, color: 'muted', align: 'left' }); fr.text('octave: half the string', 0.5, 0.68, { size: 10, color: 'muted', align: 'right' });
          eb.hline(0, { color: 'green', width: 1.6 });
          IV.forEach(([pp, qq, nn], i) => { const e = nn * 100 - cents(pp / qq), c = i === sel.value ? 'gold' : e > 0 ? 'orange' : 'accent'; eb.rect(nn - 0.32, 0, nn + 0.32, e, { fill: c, fillAlpha: 0.55, color: c }); eb.text(sc(v, e, 1), nn, e, { size: 10.5, align: 'center', baseline: e >= 0 ? 'bottom' : 'top', dy: e >= 0 ? -3 : 3, plate: true }); });
        });
        v.readout(() => {
          const [p, q, n, nm] = IV[sel.value], e = n * 100 - cents(p / q), c = CH[chordSel.value], f = c.et.map((x) => C4 * 2 ** (x / 1200)), g = c.jt.map((x) => C4 * 2 ** (x / 1200));
          const slow = nearPairs(f, 8, 12).filter((x) => x.d > 0.05).slice(0, 3), co = nearPairs(g, 8, 0.05).length;
          return `${nm}: 12-TET ${n * 100} ¢, just ${p}/${q} = ${v.fix(cents(p / q), 2)} ¢, error ${sc(v, e, 2)} ¢ (the just fret is ${v.fix(Math.abs(1 - 2 ** (-n / 12) - (1 - q / p)) * 650, 1)} mm from the equal one on a 650 mm string) · fret ratio ${v.fix(2 ** (1 / 12), 5)} (rule of 18: ${v.fix(18 / 17, 5)}) · the equal chord's near-coincident partials beat at ${slow.map((x) => `${v.fix(x.d, 1)} Hz`).join(', ') || '—'}; the just chord has ${co} exactly coinciding pairs`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Theorem',
      name: 'Continued fractions give best approximations',
      statement: String.raw`Let $\alpha$ be irrational with continued fraction $[a_0;a_1,a_2,\dots]$ and convergents $p_k/q_k$. Then for every $k\ge1$ and every pair of integers $p,q$ with $1\le q<q_{k+1}$ one has $|q\alpha-p|\ge|q_k\alpha-p_k|$: the convergent is the best rational approximation (in the sense that $|q\alpha-p|$ is smallest) among all fractions with denominator below the next convergent's. The convergents alternate on the two sides of $\alpha$ and satisfy $\bigl|\alpha-\frac{p_k}{q_k}\bigr|<\frac1{q_kq_{k+1}}$. For $\alpha=\log_2(3/2)=[0;1,1,2,2,3,1,5,2,23,\dots]$ the convergents are $\frac01,\frac11,\frac12,\frac35,\frac7{12},\frac{24}{41},\frac{31}{53},\frac{179}{306},\frac{389}{665},\dots$`,
      idea: String.raw`The Euclidean algorithm applied to $\alpha$ and $1$ peels off the integer parts $a_k$; the convergents are generated by $p_{k+1}=a_{k+1}p_k+p_{k-1}$ and similarly for $q$, and consecutive convergents satisfy $p_{k+1}q_k-p_kq_{k+1}=\pm1$. Any fraction $p/q$ with $q<q_{k+1}$ lies in the lattice generated by $(q_k,p_k)$ and $(q_{k+1},p_{k+1})$ (a determinant $\pm1$ basis), so it is an integer combination of the two vectors; the combination with a smaller denominator but also a smaller $|q\alpha-p|$ would require coefficients of opposite sign, which the alternating signs forbid. The same fact for the ratio of two commensurable frequencies explains why the denominators 5, 12, 41, 53, 306 of the convergents of $\log_2(3/2)$ are the natural sizes of equal divisions of the octave (7.11).`,
      caption: String.raw`Each dot is a denominator $q$ (log scale) and the signed error $q\alpha-\mathrm{round}(q\alpha)$ of the nearest numerator; the convergents are the record-setters and fall alternately above (orange) and below (purple) the axis. Step $k$ with the slider to see the next record appear, the shrinking band $\pm|q_k\alpha-p_k|$ and the first denominator $q_{k+1}$ at which it is beaten (nothing earlier lies in the band). The table runs the Euclidean algorithm on $\log_2 1.5$.`,
      deps: ['music-7.2', 'pma-1.20'],
      see: ['music-7.11', 'music-7.2'],
      refs: ['Benson ch. 6'],
      tags: ['continued fractions', 'approximation'],
      credit: 'Huygens (use of convergents for the planetarium, 1680s); Lagrange, 1770 (best-approximation theorem)',
      scope: String.raw`$\alpha$ irrational (a rational number has a finite expansion). "Best" means smallest $|q\alpha-p|$ (second kind); for the smallest $|\alpha-p/q|$ (first kind) the convergents are still best but some intermediate fractions can also be best, as in 7.11. Priority attributions are from secondary sources.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Continued_fraction' },
      verify: true,
      viz(v) {
        const AL = Math.log2(1.5), a = cfExpand(AL, 11), C = convs(a), Q = C.map((c) => c[1]).slice(1); // q = 1, 2, 5, 12, 41, 53, 306, 665, ...
        const K = v.slider('convergent k (0 = 1/1)', 0, 7, 4, { int: true });
        const cl = v.stage({ x: [0.8, 900], y: [-0.5, 0.5], xlog: true, axes: 'box', gutter: true, height: 340, full: true, xlabel: 'denominator q', ylabel: 'qα − nearest integer', xticks: [1, 2, 5, 10, 20, 50, 100, 200, 500].map((x) => [x, String(x)]), title: 'denominators and the signed error of the best numerator' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: false, full: true, title: 'the Euclidean algorithm on log₂(3/2) = 0.5849625…' });
        const err = (q) => q * AL - Math.round(q * AL);
        const seq = () => { const out = []; for (let i = 1; i < C.length; i++) out.push(C[i]); return out; };
        v.render(() => {
          const S = seq(), k = K.value, cur = S[k], nxt = S[k + 1] || [0, 1e9];
          const e = Math.abs(cur[1] * AL - cur[0]);
          cl.hband(-e, e, { color: 'green', alpha: 0.13 });
          cl.vline(nxt[1], { color: 'orange', dash: [5, 4] }); cl.hline(0, { color: 'muted' });
          cl.text(`next record at q = ${nxt[1] > 1e8 ? '…' : nxt[1]}`, nxt[1], 0.45, { size: 11, color: 'orange', align: nxt[1] > 300 ? 'right' : 'left', dx: nxt[1] > 300 ? -5 : 5, plate: true });
          const P = []; for (let q = 1; q <= 900; q++) P.push([q, err(q)]);
          cl.dots(P, { r: 1.7, color: 'faint', alpha: 0.85 });
          S.forEach(([p, q], i) => { if (q > 900) return; const sg = err(q) > 0 ? 'orange' : 'purple'; cl.dot(q, err(q), { r: i <= k ? 6 : 3.5, color: i <= k ? sg : 'faint', hollow: i > k }); if (i <= k) cl.text(`${p}/${q}`, q, err(q), { size: 11, color: sg, align: 'center', baseline: err(q) > 0 ? 'bottom' : 'top', dy: err(q) > 0 ? -8 : 8, weight: 700, plate: true }); });
          const rows = Math.min(a.length, 10);
          tb.text('k', 0.03, 0.93, { size: 11, color: 'muted', align: 'left' }); tb.text('quotient aₖ', 0.12, 0.93, { size: 11, color: 'muted', align: 'left' }); tb.text('convergent pₖ/qₖ', 0.32, 0.93, { size: 11, color: 'muted', align: 'left' }); tb.text('value', 0.55, 0.93, { size: 11, color: 'muted', align: 'left' }); tb.text('|α − pₖ/qₖ| in cents', 0.75, 0.93, { size: 11, color: 'muted', align: 'left' });
          for (let i = 0; i < rows; i++) {
            const y = 0.84 - 0.082 * i, on = i <= k + 1, c = C[i], del = Math.abs(AL - c[0] / c[1]) * 1200;
            const col = on ? (i === k + 1 ? 'gold' : 'ink') : 'faint';
            tb.text(String(i), 0.03, y, { size: 12, color: col, align: 'left' }); tb.text(String(a[i]), 0.12, y, { size: 12, color: col, align: 'left' });
            tb.text(`${c[0]}/${c[1]}`, 0.32, y, { size: 12, color: col, align: 'left', weight: i === k + 1 ? 700 : 400 }); tb.text(v.fix(c[0] / c[1], 6), 0.55, y, { size: 12, color: col, align: 'left' }); tb.text(v.fix(del, 3), 0.75, y, { size: 12, color: col, align: 'left' });
          }
        });
        v.legend([['orange', 'convergent above α'], ['purple', 'convergent below α'], ['green', 'band: no smaller denominator does better', { area: true }]]);
        v.readout(() => {
          const S = seq(), k = K.value, cur = S[k], nxt = S[k + 1] || [0, 1e9], e = Math.abs(cur[1] * AL - cur[0]);
          let m = Infinity, mq = 0; for (let q = 1; q < nxt[1] && q <= 2000; q++) { const t = Math.abs(err(q)); if (t < m - 1e-12) { m = t; mq = q; } }
          return `convergent ${cur[0]}/${cur[1]}: $|q\\alpha-p|=${v.fix(e, 5)}$, below $1/q_{k+1}=${nxt[1] > 1e8 ? '0' : v.fix(1 / nxt[1], 5)}$ · smallest $|q\\alpha-\\text{round}|$ over all $q<${nxt[1] > 1e8 ? '∞' : nxt[1]}$ is ${v.fix(m, 5)} at $q=${mq}$ ${mq === cur[1] ? '(the convergent itself)' : ''} · as a fifth: ${cur[1]}-step division, ${v.fix(1200 * cur[0] / cur[1], 2)} ¢ against 701.955 ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Why twelve: 7/12 is a convergent of log₂(3/2)',
      statement: String.raw`The best fifth in an $n$-note equal division of the octave is $k$ steps with $k=\mathrm{round}(n\log_2\tfrac32)$, of error $\frac{1200}{n}|n\alpha-k|$ cents, $\alpha=\log_2(3/2)$. As $n$ grows, the divisions that set a new record low of this error are, up to 700 notes, $n=5, 7, 12, 29, 41, 53, 200, 253, 306, 359, 665$ (errors 18.0, 16.2, 1.96, 1.49, 0.48, 0.07, 0.045, 0.021, 0.006, 0.005 ¢ and below), each the denominator of a convergent ($\tfrac35,\tfrac7{12},\tfrac{24}{41},\tfrac{31}{53},\tfrac{179}{306},\tfrac{389}{665}$) or of an intermediate fraction between two of them ($\tfrac47,\tfrac{17}{29}$, …); I have checked the list up to 700 by computer, and the identification of the intermediate ones for the small cases. In particular, 7/12 is a convergent (7.10): no division with fewer than 41 notes has a fifth whose step error $|n\alpha-k|$ is smaller than the 12-note fifth's 0.0235 steps, and no division with fewer than 29 notes has a fifth closer in cents.`,
      idea: String.raw`Approximating the fifth by $k/n$ of the octave is rational approximation of $\alpha$; the quality measure in steps, $|n\alpha-k|$, is exactly what 7.10 controls, with $q=n$, $p=k$. Its record-setters are the convergents $\frac12,\frac35,\frac7{12},\frac{24}{41},\frac{31}{53}$; the quality measure in cents divides by $n$, $|\alpha-k/n|$, whose records also include intermediate fractions such as $4/7$ and $17/29$ — hence 7 and 29. The larger the next partial quotient, the longer a convergent stays unbeaten: $7/12$ survives until 41 (next quotient 3, $41=3\cdot12+5$), and $31/53$ until 306 (next quotient 5, $306=5\cdot53+41$).`,
      caption: String.raw`The error of the best fifth in an $n$-note equal division, in cents on a logarithmic axis, for $n$ from 3 to 120; record lows are orange and labelled. Choose the target interval: the fifth (records 5, 7, 12, 29, 41, 53), the major third 5/4 (records 3, 16, 19, 22, 25, 28, …) or the harmonic seventh 7/4. Slide $n$ to read the details of one division and play its fifth against a pure one.`,
      deps: ['music-7.10', 'music-7.9'],
      see: ['music-7.12', 'music-7.13', 'music-7.2'],
      refs: ['Benson ch. 6', 'Sethares ch. 4'],
      tags: ['equal temperament', 'continued fractions'],
      scope: String.raw`Mathematical statement about the octave and the fifth 3/2; whether a good fifth alone makes a good tuning depends on the thirds (7.12, 7.13). The listed records were computed by exhaustive search up to $n=700$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equal_temperament' },
      viz(v) {
        const TG = { fifth: [cents(1.5), '3/2'], third: [M3J, '5/4'], sev: [cents(7 / 4), '7/4'] };
        const which = v.select('target', [{ value: 'fifth', label: 'fifth 3/2' }, { value: 'third', label: 'major third 5/4' }, { value: 'sev', label: 'harmonic seventh 7/4' }], 'fifth');
        const n = v.slider('notes per octave n', 3, 120, 12, { int: true });
        const s = v.stage({ x: [2, 122], y: [0.02, 150], ylog: true, axes: 'box', gutter: true, height: 380, full: true, xlabel: 'notes per octave n', ylabel: 'error of the best step (¢)', xticks: [5, 7, 12, 19, 29, 31, 41, 53, 72, 100].map((x) => [x, String(x)]), title: 'how well n equal steps approximate the target' });
        const snd = v.sound();
        const data = () => { const c = TG[which.value][0], out = []; let best = 1e9; for (let m = 3; m <= 120; m++) { const [k, e] = edoApprox(m, c); const a = Math.abs(e); const rec = a < best - 1e-9; if (rec) best = a; out.push({ n: m, k, e, a, rec }); } return out; };
        v.soundButton('play the n-step fifth', (sd) => { const [k] = edoApprox(n.value, cents(1.5)); sd.samples(chordCents([0, (k * 1200) / n.value], C4, 2.0), SR, { gain: 0.9 }); });
        v.soundButton('pure fifth', (sd) => sd.samples(chordCents([0, FIFTH], C4, 2.0), SR, { gain: 0.9 }));
        v.render(() => {
          const D = data(), f = (x) => Math.max(0.02, x.a);
          s.dots(D.filter((x) => !x.rec).map((x) => [x.n, f(x)]), { r: 2.8, color: 'accent', alpha: 0.6 });
          D.filter((x) => x.rec).forEach((x) => { s.dot(x.n, f(x), { r: 6, color: 'orange' }); s.text(String(x.n), x.n, f(x), { size: 11.5, color: 'orange', align: 'center', baseline: 'bottom', dy: -8, weight: 700, plate: true }); });
          const cur = D[n.value - 3]; s.vline(n.value, { color: 'gold', dash: [5, 4] }); s.dot(n.value, f(cur), { r: 8, color: 'gold', hollow: true });
        });
        v.legend([['accent', 'error of n equal steps'], ['orange', 'new record low'], ['gold', 'your n']]);
        v.readout(() => {
          const D = data(), cur = D[n.value - 3], recs = D.filter((x) => x.rec).map((x) => x.n), [c, nm] = TG[which.value], k = cur.k;
          return `n = ${cur.n}: ${nm} is approximated by ${k} steps = ${v.fix((k * 1200) / cur.n, 2)} ¢ (pure ${v.fix(c, 2)} ¢), error ${sc(v, cur.e, 2)} ¢ · ${cur.rec ? 'a new record for n up to this point' : 'not a record: an earlier division was at least as good'} · records for ${nm} up to 120: ${recs.join(', ')}${which.value === 'fifth' ? ` · in steps, $|n\\alpha-k|=${v.fix(Math.abs(cur.n * Math.log2(1.5) - k), 4)}$` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Concept',
      name: '19- and 31-tone equal temperament',
      statement: String.raw`**19-tone equal temperament** (19-TET, step 63.16 ¢) has a fifth of 694.74 ¢ (7.2 ¢ narrow), a major third of 378.95 ¢ (7.4 ¢ narrow of 5/4) and a minor third of 315.79 ¢ (0.15 ¢ from 6/5): it is very nearly one-third-comma meantone. **31-tone equal temperament** (step 38.71 ¢) has a fifth of 696.77 ¢ (5.2 ¢ narrow), a major third of 387.10 ¢ (0.8 ¢ wide of 5/4) and a harmonic seventh of 967.74 ¢ (1.1 ¢ from 7/4): it is almost exactly quarter-comma meantone (whose fifth is 696.58 ¢, 0.2 ¢ away), and also reproduces 7-limit intervals. Twelve-tone equal temperament, by contrast, mistunes the thirds by 14–16 ¢ and the seventh by 31 ¢. Both 19 and 31 are meantone systems: their chain of fifths generates all their notes, and a closed chain of 19 or 31 fifths replaces the wolf.`,
      idea: String.raw`If the fifth is narrowed by a fraction $\alpha$ of the syntonic comma (7.7), after $n$ fifths the chain closes only when $n(701.955-21.506\alpha)$ is a whole number of octaves. For $\alpha=1/4$ no integer $n$ closes the chain exactly, but $n=31$ comes close: 31 quarter-comma fifths ($31\times696.578=21593.9$ ¢) fall 6.1 ¢ short of 18 octaves, whereas 12 of them fall 41 ¢ off. Spreading that shortfall over the 31 fifths gives the 31-TET fifth, 0.2 ¢ wider than the quarter-comma fifth, so 31-TET is the closed version of the quarter-comma chain. Likewise 19 third-comma fifths ($19\times694.786=13200.9$ ¢) overshoot 11 octaves by only 0.9 ¢. The seventh harmonic comes out well in 31 because the same chain of fifths happens to reach it with a 1.1 ¢ error.`,
      caption: String.raw`Left: the errors, from the pure ratios, of the fifth, major and minor third, harmonic seventh and the septimal minor third 7/6 in 12-, 19- and 31-TET. Right: the pitch circle of the selected division (ticks, one per step) with the just ratios marked; the orange dots are the chain of meantone fifths (quarter-comma for 31, third-comma for 19, equal for 12) whose notes the steps reproduce. Play the major triad and the 4:5:6:7 chord in the chosen division, against 12-TET.`,
      deps: ['music-7.11', 'music-7.7'],
      see: ['music-7.13', 'music-6.11', 'music-7.17'],
      refs: ['Benson ch. 6'],
      tags: ['equal temperament', 'meantone'],
      credit: '19-TET: Salinas, 1577 (as one-third-comma meantone), Woolhouse, 1835; 31-TET: Huygens, 1691 (Lemme Rossi proposed it in 1666), revival by Fokker, 1950s (31-tone organ, 1951)',
      scope: String.raw`Exact arithmetic for equal divisions; the historical attributions are from secondary sources. 19-TET's major third is flat and 31-TET's fifth is wider than the quarter-comma fifth by only 0.2 ¢. Neither division reproduces 3/2 as accurately as 12-TET (1.96 ¢ error against 5.2 and 7.2 ¢).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/31_equal_temperament' },
      verify: true,
      viz(v) {
        const EDOS = [12, 19, 31], COL = ['muted', 'accent', 'orange'];
        const which = v.select('division', EDOS.map((x) => ({ value: x, label: `${x}-TET` })), 31);
        const IV = [[3, 2, 'fifth'], [5, 4, 'major third'], [6, 5, 'minor third'], [7, 4, 'harm. seventh'], [7, 6, '7/6']];
        const eb = v.stage({ x: [-0.6, 4.6], y: [-36, 36], axes: 'box', gutter: true, height: 340, xticks: IV.map((x, i) => [i, `${x[0]}/${x[1]}`]), yticks: [-30, -15, 0, 15, 30].map((y) => [y, String(y)]), ylabel: 'error from the pure ratio (¢)', title: 'errors of three equal divisions' });
        const rg = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 340, title: 'the pitch circle' });
        const snd = v.sound();
        const GEN = { 12: 700, 19: cents(1.5) - SCOMMA / 3, 31: cents(1.5) - SCOMMA / 4 };
        const steps = (n, r) => edoApprox(n, cents(r))[0];
        const tri = (n) => [0, (steps(n, 5 / 4) * 1200) / n, (steps(n, 3 / 2) * 1200) / n], sev = (n) => tri(n).concat([(steps(n, 7 / 4) * 1200) / n]);
        v.soundButton('triad: 12-TET, then this division', (sd) => sd.samples(seqCents([tri(12), tri(which.value)], C4, 1.7, 0.2), SR, { gain: 0.9 }));
        v.soundButton('4:5:6:7: 12-TET, then this division', (sd) => sd.samples(seqCents([sev(12), sev(which.value)], C4, 1.7, 0.2), SR, { gain: 0.9 }));
        v.soundButton('4:5:6:7 pure', (sd) => sd.samples(seqCents([[0, M3J, FIFTH, cents(7 / 4)]], C4, 2.0, 0), SR, { gain: 0.9 }));
        v.render(() => {
          eb.hline(0, { color: 'green', width: 1.6 });
          IV.forEach(([p, q], i) => EDOS.forEach((n, j) => { const e = edoApprox(n, cents(p / q))[1], x = i + (j - 1) * 0.27, c = COL[j]; eb.rect(x - 0.12, 0, x + 0.12, e, { fill: c, fillAlpha: n === which.value ? 0.75 : 0.35, color: c }); eb.text(sc(v, e, 1), x, e, { size: 9, align: 'center', baseline: e >= 0 ? 'bottom' : 'top', dy: e >= 0 ? -2 : 2, color: 'muted' }); }));
          const n = which.value;
          ring(rg, 1, { tick: 1200 / n, len: 0.05 });
          for (let c = 0; c < n; c++) { if (n <= 31) { const p = circ((c * 1200) / n, 0.85); rg.dot(p[0], p[1], { r: 2, color: 'faint' }); } }
          const g = GEN[n], seen = new Set();
          for (let k = -Math.floor(n / 2); k <= Math.floor(n / 2); k++) { const c = fold(k * g), p = circ(c, 0.74); rg.dot(p[0], p[1], { r: 3.2, color: 'orange' }); }
          IV.slice(0, 4).forEach(([p, q]) => { const c = cents(p / q), a = circ(c, 1.0), b = circ(c, 1.16); rg.dot(a[0], a[1], { r: 4.5, color: 'green' }); rg.text(`${p}/${q}`, b[0], b[1], { size: 11, color: 'green', align: 'center', baseline: 'middle', weight: 700 }); });
          rg.text(`${n}-TET`, 0, 0.05, { size: 14, align: 'center', weight: 700 }); rg.text(`step ${v.fix(1200 / n, 2)} ¢`, 0, -0.12, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['green', 'pure ratio'], ['orange', 'meantone chain of fifths'], ['faint', 'steps of the division']]);
        v.readout(() => {
          const n = which.value, g = GEN[n], f = (r) => { const [k, e] = edoApprox(n, cents(r)); return `${k} steps = ${v.fix((k * 1200) / n, 2)} ¢ (${sc(v, e, 2)})`; };
          const mx = Math.max(...Array.from({ length: n }, (_, i) => { const k = i - Math.floor(n / 2), c = k * g, e = Math.abs(c - (Math.round((c * n) / 1200) * 1200) / n); return e; }));
          return `${n}-TET: fifth ${f(1.5)} · major third ${f(1.25)} · minor third ${f(1.2)} · seventh ${f(1.75)} · the ${n === 12 ? 'equal 700 ¢' : n === 19 ? 'one-third-comma' : 'quarter-comma'} fifth is ${v.fix(g, 3)} ¢ against the division's ${v.fix((steps(n, 1.5) * 1200) / n, 3)} ¢; along a chain of ${n} fifths the two differ by at most ${v.fix(mx, 1)} ¢`;
        });
      },
    },
  ],
};
