import * as H from './ch05.shared.js';
import { CONE_TABLE } from './ch05.data.js';

const colors = ['accent', 'orange', 'green'];
const f = x => Number(x).toPrecision(6);
const r = H.valueOf;
const integer = (v, label, min, max, value) => v.slider(label, min, max, value, { int: true });
const wavelength = (v, label, initial) => integer(v, label + ' (source index)', 0, 45, (initial - 390) / 5);
const wave = control => 390 + 5 * control.value;
const stage = (v, title, xlabel = '', ylabel = '') => v.stage({ x: [-.6, 3.6], y: [-.2, 1.2], height: 300, axes: 'box', gutter: true, title, xlabel, ylabel });
function bars(s, rows, labels = ['L', 'M', 'S']) {
  const flat = rows.flat(), lo = Math.min(0, ...flat), hi = Math.max(.1, ...flat), span = hi - lo;
  s.o.gutter = { l: 52 };
  s.o.xticks = [];
  const tick = x => x === 0 ? '0' : Math.abs(x) >= 1000 || Math.abs(x) < .001 ? x.toExponential(1) : Number(x.toPrecision(3)).toString();
  s.o.yticks = [...new Set([lo, lo / 2, 0, hi / 2, hi])].map(x => [x, tick(x)]);
  s.setView([-.65, labels.length - .35], [lo - .26 * span, hi + .18 * span]);
  s.hline(0, { color: 'muted' });
  rows.forEach((row, j) => row.forEach((x, k) => {
    const width = .6 / rows.length, left = k - .3 + j * width;
    s.rect(left, 0, left + width * .88, x, { fill: colors[j], fillAlpha: .55, color: colors[j], width: 1.5 });
  }));
  labels.forEach((label, j) => s.text(label, j, lo - .17 * span, { size: 11, align: 'center' }));
}
function curves(s, rows, xRange = [380, 625]) {
  const values = rows.flatMap(row => row.map(p => p[1])), lo = Math.min(0, ...values), hi = Math.max(.01, ...values), span = hi - lo;
  s.setView(xRange, [lo - .15 * span, hi + .18 * span]);
  rows.forEach((row, j) => s.path(row, { color: colors[j], width: 2 }));
}

export function univarianceWidget(v) {
  const a = wavelength(v, 'reference wavelength', 450), b = wavelength(v, 'matched wavelength', 560);
  const cone = v.select('matched cone class', ['L', 'M', 'S'], 'L'), power = integer(v, 'reference energy / 10', 0, 20, 10);
  const A = stage(v, 'published relative energy sensitivities', 'wavelength (nm)', 'relative sensitivity');
  const B = stage(v, 'two monochromatic lights: cone responses', 'cone class', 'relative catch'); let z;
  v.render(() => {
    z = H.univariance(wave(a), wave(b), ['L', 'M', 'S'].indexOf(cone.value), String(power.value / 10));
    curves(A, [0, 1, 2].map(j => CONE_TABLE.map(row => [+row[0], +row[j + 1]])));
    A.vline(wave(a), { color: 'gold', dash: [4, 3] }); A.vline(wave(b), { color: 'purple', dash: [2, 3] });
    bars(B, [z.signalsA.map(r), z.signalsB.map(r)]);
  });
  v.legend([['accent', 'L curve / reference response'], ['orange', 'M curve / matched response'], ['green', 'S sensitivity'], ['gold', 'reference wavelength'], ['purple', 'matched wavelength']]);
  v.readout(() => `Reference ${wave(a)} nm, energy ${f(r(z.power))}; comparison ${wave(b)} nm, solved energy ${f(r(z.matchedPower))}. Exactly equal ${cone.value} responses in the decimal table.\nReference LMS (${z.signalsA.map(x => f(r(x))).join(', ')}); comparison (${z.signalsB.map(x => f(r(x))).join(', ')}). Other classes distinguish the pair only if their sensitivity ratios differ. Zero energy and equal wavelengths are legitimate equality cases. No screen spectral swatch is inferred.`);
}

export function metamerWidget(v) {
  const preset = v.select('primary wavelengths', ['four distinct', 'two distinct', 'one repeated'], 'four distinct');
  const baseline = v.select('reference mixture', ['interior', 'black', 'mixed boundary'], 'interior');
  const direction = integer(v, 'requested null direction', 0, 2, 0), tick = integer(v, 'fraction toward physical endpoint (%)', -100, 100, 30);
  const A = stage(v, 'four ideal spectral-primary powers', 'primary index', 'relative energy');
  const B = stage(v, 'reference and edited cone responses', 'cone class', 'relative catch'); let z;
  v.render(() => {
    const waves = preset.value === 'four distinct' ? [440, 500, 560, 610] : preset.value === 'two distinct' ? [440, 440, 560, 560] : [500, 500, 500, 500];
    const base = baseline.value === 'black' ? ['0', '0', '0', '0'] : baseline.value === 'mixed boundary' ? ['0', '0.3', '1', '0.8'] : ['0.5', '0.5', '0.5', '0.5'];
    const dimension = 4 - H.nullSpace(H.coneMatrix(waves)).rank;
    direction.el.style.display = dimension > 1 ? '' : 'none';
    z = H.metamerModel(waves, base, tick.value, Math.min(direction.value, dimension - 1));
    bars(A, [z.base.map(r), z.edited.map(r)], ['1', '2', '3', '4']); bars(B, [z.before.map(r), z.after.map(r)]);
  });
  v.legend([['accent', 'reference mixture / catch'], ['orange', 'edited mixture / catch']]);
  v.readout(() => `Primary wavelengths (${z.wavelengths.join(', ')})nm; matrix rank ${z.rank}, null dimension ${z.basis.length}. Direction ${Math.min(direction.value, z.basis.length - 1) + 1} of ${z.basis.length}.\nReference (${z.base.map(x => f(r(x))).join(', ')}); edited (${z.edited.map(x => f(r(x))).join(', ')}). Allowed parameter [${z.interval.map(x => f(r(x))).join(', ')}]; selected ${f(r(z.parameter))}.\nExact decimal-rational cone equality: ${z.exactEqual ? 'yes' : 'NO'}. ${z.collapsed ? 'The physical interval collapses to one mixture despite a nonzero algebraic kernel.' : 'The edited powers remain in the declared 0–1 cube.'} Repeated wavelengths are separate co-located primary controls. No equality of screen appearance or individual sensation is asserted.`);
}

export function discriminationWidget(v) {
  const selected = wavelength(v, 'evaluated wavelength', 500), classes = v.select('available cone signals', ['L only', 'L and M', 'L, M and S'], 'L, M and S');
  const energy = integer(v, 'model intensity / 10', 1, 20, 10), noise = integer(v, 'model noise SD / 1000', 1, 100, 10);
  const A = stage(v, 'authored local information; unknown intensity', 'wavelength (nm)', 'information (1/nm²)'); let z;
  v.render(() => {
    const indices = classes.value === 'L only' ? [0] : classes.value === 'L and M' ? [0, 1] : [0, 1, 2];
    const model = w => H.wavelengthInformation(w, indices, energy.value / 10, noise.value / 1000);
    const points = CONE_TABLE.map(row => [+row[0], model(+row[0]).information]); curves(A, [points]); z = model(wave(selected));
    A.dot(wave(selected), z.information, { color: 'gold', r: 6 });
  });
  v.legend([['accent', 'declared Gaussian-noise calculation'], ['gold', 'selected source wavelength']]);
  v.readout(() => `${wave(selected)} nm; ${classes.value}, intensity ${energy.value / 10}, independent equal noise SD ${noise.value / 1000}. Local information ${f(z.information)} /nm². ${z.localScale === null ? 'Wavelength is unidentifiable from this one-cone measurement when intensity is unknown.' : `Inverse-square-root information scale ${f(z.localScale)} nm.`}\nSensitivity derivatives use source samples ${z.left}–${z.right} nm. This is an authored local ideal-observer calculation, not a measured JND, a fitted discrimination function or a threshold test on your display.`);
}

export function cancellationWidget(v) {
  const target = wavelength(v, 'test wavelength', 580), added = wavelength(v, 'added wavelength', 500);
  const axis = v.select('authored signed combination', ['L − wM', 'S − w(L+M)/2'], 'L − wM'), weight = integer(v, 'chosen weight / 4', 1, 16, 4), amount = integer(v, 'added energy / 10', 0, 100, 10);
  const A = stage(v, 'chosen linear combination: actual mixture path', 'added relative energy', 'signed model response'); let z;
  v.render(() => {
    z = H.cancellation(wave(target), wave(added), axis.value === 'L − wM' ? 0 : 1, weight.value / 4);
    const points = [[0, z.test], [10, z.test + 10 * z.cancel]]; curves(A, [points], [-.7, 10.7]);
    A.hline(0, { color: 'muted', dash: [3, 3] }); A.dot(amount.value / 10, z.test + amount.value / 10 * z.cancel, { color: 'gold', r: 6 });
    if (z.reachable && z.amount <= 10) A.dot(z.amount, 0, { color: 'green', r: 5 });
  });
  v.legend([['accent', 'declared combination'], ['gold', 'chosen added energy'], ['green', 'nonnegative zero, when in range']]);
  v.readout(() => `Test ${wave(target)} nm; added light ${wave(added)} nm; weight ${weight.value / 4}. Test coefficient ${f(z.test)}, added coefficient ${f(z.cancel)}; at added energy ${amount.value / 10}, response ${f(z.test + amount.value / 10 * z.cancel)}.\n${z.reachable ? `Algebraic nonnegative cancellation energy ${f(z.amount)}${z.amount > 10 ? ' lies outside the plotted0–10 range' : ' lies within the plotted range'}.` : 'This chosen additive light cannot cancel the test in this model.'} ${z.nonunique ? 'Both coefficients vanish, so every nonnegative added energy is also a model null. ' : ''}An algebraic zero does not establish a subjective hue null or identify a neural channel.`);
}

function hueRGB(degrees) {
  const h = ((degrees % 360) + 360) % 360 / 60, c = .6, x = c * (1 - Math.abs(h % 2 - 1));
  const row = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return row.map(a => 255 * (a + .2));
}
export function uniqueHueWidget(v) {
  const angle = integer(v, 'authored sRGB hue angle (deg)', 0, 359, 55), question = v.select('judgment to consider', ['red versus green', 'blue versus yellow'], 'red versus green');
  const answer = v.select('your optional report', ['not recorded', 'first hue', 'second hue', 'neither'], 'not recorded');
  const A = v.stage({ title: 'screen hue coordinate; no population distribution', x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 310 });
  v.render(() => {
    A.circle(0, 0, 1, { color: 'muted', width: 2 });
    for (let i = 0; i < 36; i++) { const t = i * Math.PI / 18; A.dot(Math.cos(t), Math.sin(t), { color: hueRGB(10 * i), r: 4, ring: false }); }
    const t = angle.value * Math.PI / 180; A.arrow(0, 0, .75 * Math.cos(t), .75 * Math.sin(t), { color: 'gold', width: 2 });
    A.circle(0, 0, .3, { fill: hueRGB(angle.value), fillAlpha: 1, stroke: false });
    A.text('0°', 1.25, 0, { size: 11, align: 'center' }); A.text('180°', -1.25, 0, { size: 11, align: 'center' });
  });
  v.readout(() => `Authored screen hue angle ${angle.value}°; judgment ${question.value}; optional report: ${answer.value}. “Neither” describes a subjective null in the selected hue pair, not a cone-response zero.\nThis is an uncalibrated sRGB patch with chosen code-value chroma and brightness. It records no population estimate, standard wavelength or calibrated unique-hue measurement. The two judgment tasks can have different nulls; an observer can also decline to report one.`);
}

export function zoneWidget(v) {
  const selected = wavelength(v, 'spectral-primary wavelength', 550), energy = integer(v, 'relative energy / 10', 0, 20, 10);
  const deletion = v.select('explicit model intervention', ['none', 'set L to zero', 'set M to zero', 'set S to zero'], 'none');
  const A = stage(v, 'cone inputs: original and intervened', 'cone class', 'relative response'), B = stage(v, 'invertible declared channel recoding', 'channel', 'signed response'); let z;
  v.render(() => {
    const original = H.coneRow(wave(selected)).map(x => r(x) * energy.value / 10), edited = original.slice(), j = ['set L to zero', 'set M to zero', 'set S to zero'].indexOf(deletion.value);
    if (j >= 0) edited[j] = 0;
    const channels = H.opponentSignals(edited), restored = H.inverseOpponent(channels); z = { original, edited, channels, restored };
    bars(A, [original, edited]); bars(B, [channels], ['sum', 'L−M', 'S−sum/2']);
  });
  v.legend([['accent', 'original cone input / recoded output'], ['orange', 'intervened cone input']]);
  v.readout(() => `${wave(selected)} nm, relative energy ${energy.value / 10}; intervention ${deletion.value}. Original LMS (${z.original.map(f).join(', ')}); intervened (${z.edited.map(f).join(', ')}).\nChannels (L+M, L−M, S−(L+M)/2) = (${z.channels.map(f).join(', ')}). Inverse reconstructs (${z.restored.map(f).join(', ')}); largest numerical reconstruction error ${f(Math.max(...z.edited.map((x, j) => Math.abs(x - z.restored[j]))))}. Dropping one cone need not silence any whole channel. These are chosen linear coordinates, not fitted neural firing or unique-hue labels.`);
}

export function aftereffectWidget(v) {
  const adaptation = integer(v, 'model adaptation time (s)', 0, 300, 60), recovery = integer(v, 'model recovery time (s)', 0, 600, 30), angle = integer(v, 'test orientation (deg)', 0, 180, 0);
  const A = stage(v, 'authored orientation-selective recovery', 'model recovery time (s)', 'signed model response'); let z;
  v.render(() => {
    const model = t => H.orientationAftereffect(adaptation.value, t, angle.value);
    z = model(recovery.value);
    const times = Array.from({ length: 121 }, (_, j) => 5 * j), sign = -z.selectivity;
    curves(A, [times.map(t => [t, model(t).response]), times.map(t => [t, sign * model(t).fast]), times.map(t => [t, sign * model(t).slow])], [-40, 640]);
    A.dot(recovery.value, z.response, { color: 'gold', r: 6 });
  });
  v.legend([['accent', 'sum'], ['orange', 'chosen fast component'], ['green', 'chosen slow component'], ['gold', 'selected recovery time']]);
  v.readout(() => `Authored adaptation ${adaptation.value} s, recovery ${recovery.value} s, test orientation ${angle.value}°. Orientation factor cos(2θ)=${f(z.selectivity)}. Fast amplitude ${f(z.fast)}, slow amplitude ${f(z.slow)}, signed sum ${f(z.response)}.\nChosen exponential time constants 30s and 600s and slow weight 0.35 are illustrative, not a fit to an observer or a replication of the source’s persistent component. The chart scrubs model time; it does not expose you to adapting gratings or predict an aftereffect on your screen.`);
}

export function testsWidget(v) {
  const mode = v.select('method illustration', ['authored dot code', 'spectral matching analogue'], 'authored dot code');
  const channel = v.select('dot-code operation', ['retain chromatic code', 'discard chromatic code'], 'retain chromatic code');
  const mix = integer(v, '610nm mixture share (%)', 0, 100, 50), brightness = integer(v, '590nm comparison energy / 100', 0, 300, 100), retained = v.select('matching equations retained', ['LM', 'L', 'M'], 'LM');
  const A = v.stage({ title: 'authored method illustration', x: [-1, 10], y: [-1, 10], equal: true, axes: false, height: 330 });
  const C = stage(v, 'retained-signal mismatch at chosen brightness', '610nm mixture share (%)', 'Euclidean response mismatch');
  const B = stage(v, '545/610 nm mixture versus 590 nm comparison', 'cone class', 'relative response'); let z;
  const mask = ['11111', '00001', '00010', '00100', '01000', '01000', '01000'];
  v.render(() => {
    const dots = mode.value === 'authored dot code';
    v.legend(dots ? [] : [['accent', 'mixture response / mismatch'], ['orange', 'comparison response'], ['gold', 'chosen mixture share']]);
    channel.el.style.display = dots ? '' : 'none';
    for (const c of [mix, brightness, retained]) c.el.style.display = dots ? 'none' : '';
    A.el.style.display = dots ? '' : 'none';
    C.el.style.display = dots ? 'none' : '';
    B.el.style.display = dots ? 'none' : '';
    if (dots) {
      A.setView([-1, 10], [-1, 10]);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        const encoded = x >= 2 && x <= 6 && y >= 1 && y <= 7 && mask[y - 1][x - 2] === '1';
        const base = .35 + ((17 * x + 11 * y) % 13) / 40, code = encoded && channel.value === 'retain chromatic code' ? .12 : 0;
        A.dot(x + .5, 8.5 - y, { color: [base + code, base - code, base].map(x => 255 * x), r: 6, ring: false });
      }
      z = null;
    } else {
      z = H.matchingAnalogue(mix.value, brightness.value / 100, retained.value);
      const points = Array.from({ length: 101 }, (_, i) => [i, H.matchingAnalogue(i, brightness.value / 100, retained.value).mismatch]);
      curves(C, [points], [-7, 107]); C.dot(mix.value, z.mismatch, { color: 'gold', r: 6 }); bars(B, [z.mixture, z.target]);
    }
  });
  v.readout(() => mode.value === 'authored dot code' ? `Synthetic numeral 7 in an authored RGB dot code; operation: ${channel.value}. Removing the encoded component removes its signal by construction. This is neither an Ishihara plate nor a protan/deutan/tritan projection. No visibility score, deficiency label or diagnosis is produced.` : `Authored 545/610 nm mixture share ${mix.value}%;590nm comparison energy ${brightness.value / 100}; equations ${retained.value}. Current retained-signal mismatch ${f(z.mismatch)}. Best nonnegative comparison energy at this mixture ${f(z.fittedTargetPower)}; residual after that brightness fit ${f(z.bestBrightnessMismatch)}.\nA single retained response can always be brightness-matched here; two independent responses also constrain the mixture ratio. This wavelength set is an authored analogue within the complete cone table, not a literal anomaloscope or a clinical matching range. Screen colours do not reproduce its spectral lights.`);
}

export function dressWidget(v) {
  const tilt = integer(v, 'assumed spectral-illuminant tilt / 100', -100, 100, 0), reflectance = integer(v, 'fixed observed spectral value / 10', 1, 6, 4), selected = integer(v, 'reported category index', 0, 3, 0);
  const A = stage(v, 'published rounded aggregate reports', 'category index', 'percent of sample'), B = stage(v, 'separate spectral factorization model', 'primary index', 'relative value'); let z;
  v.render(() => {
    A.setView([-.7, 3.7], [-10, 70]);
    H.DRESS_REPORT.forEach((row, j) => A.rect(j - .26, 0, j + .26, row.percent, { fill: j === selected.value ? 'gold' : 'accent', fillAlpha: .55, stroke: false }));
    z = H.illuminantAmbiguity(tilt.value / 100, reflectance.value / 10);
    curves(B, [z.observed.map((x, j) => [j, x]), z.illuminant.map((x, j) => [j, x]), z.inferred.map((x, j) => [j, x])], [-.4, 3.4]);
    z.reconstructed.forEach((x, j) => B.dot(j, x, { color: 'gold', r: 4 }));
  });
  v.legend([['accent', 'reported aggregate / fixed observed spectrum'], ['orange', 'chosen illuminant'], ['green', 'inferred reflectance'], ['gold', 'selected category / reconstructed product']]);
  v.readout(() => `Source category ${selected.value}: ${H.DRESS_REPORT[selected.value].label}, ${H.DRESS_REPORT[selected.value].percent}%. Aggregate N=1401; source percentages 57/30/11/2 are rounded and do not supply exact category counts. They are not labels for the model curves.\nSeparate four-primary model at (${z.wavelengths.join(', ')})nm: observed (${z.observed.map(f).join(', ')}), assumed illuminant (${z.illuminant.map(f).join(', ')}), inferred reflectance (${z.inferred.map(f).join(', ')}). Largest product residual ${f(z.productResidual)}. Different admissible factors preserve the same observed signal; this does not force a dress percept or reproduce the original photograph.`);
}
