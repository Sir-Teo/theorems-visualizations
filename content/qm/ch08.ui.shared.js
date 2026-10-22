import * as H from './ch08.shared.js';
import { ylm } from './ch07.shared.js';

const TAU = 2 * Math.PI;
const axisLabel = text => ({ 'r / a_mu': String.raw`$r/a_\mu$`, 'r / a': '$r/a$', 'theta / pi': String.raw`$\theta/\pi$`, 'phi / pi': String.raw`$\phi/\pi$`, '|u|²': '$|u|^2$', '|Y|²': '$|Y|^2$', 'j_ell': String.raw`$j_\ell$`, 'Z r / a_mu': String.raw`$Zr/a_\mu$`, '|u_Z|² / Z': '$|u_Z|^2/Z$', 'kappa (r/a − 1)': String.raw`$\kappa(r/a-1)$`, '|u|² / kappa': String.raw`$|u|^2/\kappa$` }[text] ?? text);
const plot = (v, title, xlabel = '', ylabel = '') => v.stage({ x: [-.05, 1.05], y: [-.08, 1.12], height: 300, axes: 'box', gutter: { l: 54, r: 18, t: 32, b: 46 }, title, xlabel: axisLabel(xlabel), ylabel: axisLabel(ylabel) });
const panel = (v, title) => v.stage({ x: [-.5, 10.5], y: [-.5, 10.5], height: 310, axes: false, pad: 18, title });
const samples = (f, end, count = 200) => Array.from({ length: count + 1 }, (_, j) => { const x = end * j / count; return [x, f(x)]; });
function curves(s, lists, end, colors = ['accent', 'orange']) {
  const low = Math.min(0, ...lists.flatMap(a => a.map(p => p[1]))), high = Math.max(1e-12, ...lists.flatMap(a => a.map(p => p[1]))), span = Math.max(high - low, high * .1);
  s.setView([-.025 * end, 1.025 * end], [low - .08 * span, high + .14 * span]);
  lists.forEach((a, j) => s.path(a, { color: colors[j], width: 2 }));
}
function quantum(v, { maxRadial = 4, maxEll = 3, angular = false } = {}) {
  const radial = v.slider('radial degree', 0, maxRadial, 0, { int: true });
  const ell = v.slider('angular momentum ell', 0, maxEll, 1, { int: true });
  const projection = angular ? v.select('projection', ['zero', 'maximal'], 'zero') : null;
  return () => ({ n: radial.value + ell.value + 1, ell: ell.value, m: projection?.value === 'maximal' ? ell.value : 0 });
}
const harmonicDensity = (ell, m, theta, phi) => {
  const y = ylm(ell, m, theta, phi); return y[0] * y[0] + y[1] * y[1];
};

export function boxWidget(v) {
  const s = panel(v, 'lowest energy groups'), L = ['x', 'y', 'z'].map(axis => v.slider('side ' + axis + ' in tenths', 5, 30, 10, { int: true }));
  let state;
  v.render(() => {
    state = H.boxLevels(L.map(x => x.value), 5);
    const levels = state.levels.slice(0, 8), top = H.ratioValue(levels.at(-1).energy);
    levels.forEach((x, j) => {
      const y = .7 + 1.1 * j, color = x.certifiedComplete ? 'accent' : 'orange';
      s.line(1.8, y, 7.1, y, { color, width: 2.4 });
      s.text(H.ratioValue(x.energy).toFixed(2), 1.4, y, { color: 'ink', align: 'right', baseline: 'middle', size: 11 });
      s.text(`${x.states.length}${x.certifiedComplete ? '' : '+'}`, 7.8, y, { color, baseline: 'middle', size: 12 });
    });
    s.text('energy', 1.2, 9.8, { color: 'muted', size: 12, align: 'center' });
    s.text('count', 7.8, 9.8, { color: 'muted', size: 12, align: 'center' });
  });
  v.legend([['accent', 'certified full multiplicity'], ['orange', 'uncertified lower bound (+)']]);
  v.readout(() => `Sides ${state.lengths.join(', ')}. Indices 1–5. First omitted energy at least ${v.fix(H.ratioValue(state.firstOmittedEnergy), 4)}; certification uses a strict inequality. Lowest state: ${state.levels[0].states.map(x => '(' + x.join(',') + ')').join('; ')}. Rows are equally spaced; numeric labels give the energies.`);
}

export function oscillatorWidget(v) {
  const a = panel(v, 'Cartesian basis states'), b = panel(v, 'spherical multiplets'), N = v.slider('shell N', 0, 8, 3, { int: true }); let state;
  v.render(() => {
    state = H.oscillatorShell(N.value);
    for (const [x, y] of state.cartesian) a.dot(.6 + 8.5 * x / Math.max(1, N.value), .6 + 8.5 * y / Math.max(1, N.value), { r: 3.5, color: 'accent' });
    const columns = [...new Set(state.spherical.map(x => x.ell))].sort((x, y) => x - y);
    columns.forEach((ell, j) => {
      const x = columns.length === 1 ? 5 : 1 + j * 8 / (columns.length - 1);
      for (let m = -ell; m <= ell; m++) b.dot(x, 4.8 + 3.7 * m / Math.max(1, ell), { r: 3.3, color: 'orange' });
      b.text(`ell ${ell}`, x, .1, { align: 'center', size: 11, color: 'ink' });
    });
    a.text(`n_z = ${N.value} − n_x − n_y`, 5, 9.8, { align: 'center', size: 12, color: 'muted' });
    a.text('horizontal: n_x; vertical: n_y', 5, -.12, { align: 'center', size: 10, color: 'muted' });
  });
  v.legend([['accent', 'one Cartesian triple'], ['orange', 'one radial/angular state']]);
  v.readout(() => `N=${state.N}, E/(hbar omega)=${state.energy}. Cartesian count ${state.cartesian.length}; spherical count ${state.spherical.length}; full shell multiplicity ${state.degeneracy}. Spherical radial degree is (N−ell)/2.`);
}

export function separationWidget(v) {
  const a = plot(v, 'radial probability', 'r / a_mu', '|u|²'), b = plot(v, 'angular meridian, phi=0', 'theta / pi', '|Y|²');
  const ell = v.slider('angular momentum ell', 0, 4, 1, { int: true }), mode = v.select('projection', ['zero', 'maximal'], 'zero'), theta = v.slider('probe theta / pi', 0, 1, .4, { step: 'any', decimals: 3 }); let state;
  v.render(() => {
    const l = ell.value, n = l + 2, m = mode.value === 'zero' ? 0 : l, end = 6 * n * n;
    curves(a, [samples(r => H.hydrogenRadial(n, l, r).radialProbability, end)], end);
    const angular = samples(x => harmonicDensity(l, m, x * Math.PI, 0), 1);
    curves(b, [angular], 1, ['orange']);
    const Y2 = harmonicDensity(l, m, theta.value * Math.PI, 0); b.dot(theta.value, Y2, { r: 4, color: 'gold' });
    const R2 = H.hydrogenRadial(n, l, n * n).R ** 2;
    state = { n, l, m, Y2, theta: theta.value, density: R2 * Y2 };
  });
  v.legend([['accent', 'radial measure |u|² dr'], ['orange', 'angular density per solid angle'], ['gold', 'angular probe']]);
  v.readout(() => `n=${state.n}, ell=${state.l}, m=${state.m}. At r=n² a_mu, theta/pi=${state.theta}, phi=0: |Y|²=${v.fix(state.Y2, 6)} and density per volume $${v.sci(state.density, 4)}\,a_\mu^{-3}$. The meridian alone is not an angular probability marginal.`);
}

export function barrierWidget(v) {
  const a = plot(v, 'Coulomb effective potential', 'r / a_mu', 'energy'), b = plot(v, 'regular radial probability', 'r / a_mu', '|u|²');
  const ell = v.slider('angular momentum ell', 0, 5, 1, { int: true }), probe = v.slider('probe radius / a_mu', .2, 16, 3, { step: 'any', decimals: 3 }); let state;
  v.render(() => {
    const l = ell.value, n = l + 1, rs = Array.from({ length: 181 }, (_, j) => .2 + 15.8 * j / 180);
    const attractive = rs.map(r => [r, -1 / r]), effective = rs.map(r => [r, -1 / r + l * (l + 1) / (2 * r * r)]);
    // Fixed vertical window intentionally excludes the singular high barrier.
    a.setView([-.2, 16.4], [-1.2, 2.2]);
    for (const [data, color] of [[attractive, 'accent'], [effective, 'orange']]) {
      let segment = [];
      for (const point of data) { if (point[1] > -1.16 && point[1] < 2.16) segment.push(point); else { if (segment.length > 1) a.path(segment, { color, width: 2 }); segment = []; } }
      if (segment.length > 1) a.path(segment, { color, width: 2 });
    }
    curves(b, [samples(r => H.hydrogenRadial(n, l, r).radialProbability, 6 * n * n)], 6 * n * n);
    state = H.hydrogenRadial(n, l, probe.value);
    const effectiveProbe = state.potential + state.barrier;
    if (effectiveProbe > -1.15 && effectiveProbe < 2.15) a.dot(probe.value, effectiveProbe, { color: 'gold', r: 4 });
  });
  v.legend([['accent', 'attraction / radial probability'], ['orange', 'attraction + barrier'], ['gold', 'probe when inside the energy window']]);
  v.readout(() => `ell=${state.ell}, circular radial state n=${state.n}. At r=${v.fix(state.radius, 2)}: V=${v.fix(state.potential, 5)}, barrier=${v.fix(state.barrier, 5)}, sum=${v.fix(state.potential + state.barrier, 5)}. The energy plot is restricted to −1.2..2.2; omitted singular values are not clamped into the graph.`);
}

export function sphericalWellWidget(v) {
  const a = plot(v, 'regular radial probability', 'r / a', '|u|²'), b = plot(v, 'root of j_ell', 'scaled radius', 'j_ell');
  const ell = v.slider('angular momentum ell', 0, 6, 1, { int: true }), root = v.slider('positive root index', 1, 8, 1, { int: true }); let state;
  v.render(() => {
    state = H.sphericalWellRoot(ell.value, root.value);
    curves(a, [samples(r => H.sphericalWellRadial(ell.value, root.value, r).radialProbability, 1)], 1);
    const right = state.root + 1;
    curves(b, [samples(x => H.sphericalBessel(ell.value, x), right)], right, ['orange']);
    b.dot(state.root, state.residual, { color: 'gold', r: 4 });
  });
  v.legend([['accent', 'normalized radial probability'], ['orange', 'spherical Bessel function'], ['gold', 'selected positive root']]);
  v.readout(() => `ell=${state.ell}, root index=${state.index}: z=${v.fix(state.root, 8)}, energy=${v.fix(state.energy, 5)} in hbar²/(2 mu a²), angular multiplicity=${2 * state.ell + 1}. Numerical root residual $${v.sci(state.residual, 3)}$. The origin zero is excluded.`);
}

export function energyWidget(v) {
  const s = panel(v, 'one degenerate Coulomb shell'), n = v.slider('principal n', 1, 8, 3, { int: true }), Z = v.slider('charge Z', 1, 5, 1, { int: true }); let state;
  v.render(() => {
    const N = n.value;
    for (let ell = 0; ell < N; ell++) {
      const x = N === 1 ? 5 : .6 + 8.8 * ell / (N - 1);
      for (let m = -ell; m <= ell; m++) s.dot(x, 5 + 3.3 * m / Math.max(1, N - 1), { color: 'accent', r: 3 });
      s.text(`${ell}`, x, .8, { align: 'center', color: 'ink', size: 12 });
    }
    s.text('ell', 5, .1, { color: 'muted', size: 12, align: 'center' });
    s.text('all dots have one energy', 5, 9.7, { color: 'muted', size: 12, align: 'center' });
    state = { N, count: N * N, energy: -(Z.value ** 2) / (2 * N * N) };
  });
  v.legend([['accent', 'one spatial state (ell,m); spin excluded']]);
  v.readout(() => `n=${state.N}, Z=${Z.value}: E=${v.fix(state.energy, 6)} reduced-mass Hartree. Sum of angular multiplicities=${state.count}=n². Vertical placement separates m labels visually; it does not split their energies.`);
}

export function orbitalWidget(v) {
  const a = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 320, axes: false, pad: 16, title: 'slice through nucleus: relative density' });
  const b = plot(v, 'probability per radius', 'r / a_mu', '|u|²');
  const quantumState = quantum(v, { angular: true }), plane = v.select('slice plane', ['xz', 'xy'], 'xz'), real = v.toggle('real angular combination', false); let state;
  v.render(() => {
    const q = quantumState(), extent = 2.5 * q.n * q.n;
    const density = (x, vertical) => H.orbitalSliceDensity(q.n, q.ell, q.m, x, vertical, plane.value, real.value);
    let maximum = 0;
    for (let x = -40; x <= 40; x++) for (let z = -40; z <= 40; z++) maximum = Math.max(maximum, density(x * extent / 40, z * extent / 40));
    const background = v.rgb('panel'), ink = v.rgb('accent');
    a.raster((x, z) => {
      if (Math.abs(x) > 1 || Math.abs(z) > 1) return null;
      const weight = maximum ? Math.min(1, density(x * extent, z * extent) / maximum) ** .35 : 0;
      return [0, 1, 2].map(j => background[j] + weight * (ink[j] - background[j]));
    }, { res: 3, key: `${q.n}:${q.ell}:${q.m}:${plane.value}:${real.value}:${v.color('accent')}` });
    a.line(-1, 0, 1, 0, { color: 'muted', width: .7, alpha: .5 }); a.line(0, -1, 0, 1, { color: 'muted', width: .7, alpha: .5 });
    curves(b, [samples(r => H.hydrogenRadial(q.n, q.ell, r).radialProbability, 6 * q.n * q.n)], 6 * q.n * q.n);
    state = { ...q, extent, maximum, plane: plane.value };
  });
  v.legend([['accent', 'relative slice density / radial probability']]);
  v.readout(() => `n=${state.n}, ell=${state.ell}, m=${state.m}; ${state.n - state.ell - 1} positive radial nodes. ${state.plane} slice half-width ${v.fix(state.extent, 1)} a_mu; sampled maximum $${v.sci(state.maximum, 3)}\,a_\mu^{-3}$. ${state.maximum === 0 ? 'This entire slice is an exact angular nodal plane; its blank density is intentional. ' : ''}Brightness uses power 0.35 of relative density; it is not a probability contour or a 3D integral.`);
}

export function symmetryWidget(v) {
  const s = panel(v, 'K_z output resolved by ell'), n = v.slider('principal n', 1, 6, 3, { int: true }), source = v.select('input orbital', ['s state', 'highest ell, m=0', 'stretched'], 's state'); let state;
  v.render(() => {
    const ell = source.value === 's state' ? 0 : n.value - 1, m = source.value === 'stretched' ? ell : 0;
    state = H.so4Generator(n.value, ell, m);
    const maximum = Math.max(1, ...state.rows.map(r => r.normSquared));
    state.rows.forEach((row, j) => {
      const x = state.rows.length === 1 ? 5 : 1 + 8 * j / (state.rows.length - 1), y = 1 + 7 * row.normSquared / maximum;
      s.line(x, 1, x, y, { color: 'orange', width: 8 }); s.dot(x, y, { color: 'gold', r: 4 });
      s.text(`${row.ell}`, x, .3, { color: 'ink', align: 'center', size: 12 });
    });
    s.text('squared unnormalized amplitude', 5, 9.7, { align: 'center', color: 'muted', size: 11 });
    s.text('target ell', 5, -.25, { align: 'center', color: 'muted', size: 11 });
  });
  v.legend([['orange', 'squared coefficient of K_z applied to the input'], ['gold', 'coefficient endpoint, including zero']]);
  v.readout(() => `n=${state.n}, input ell=${state.ell}, m=${state.m}; represented shell dimension ${state.dimension}. Output squared norm=${v.fix(state.imageNorm, 6)}. ${state.annihilated ? 'The generator annihilates this state; there is no normalized output.' : 'All output components retain this principal n and energy.'} Coupled/product norm difference $${v.sci(state.normResidual, 3)}$.`);
}

export function spectrumWidget(v) {
  const a = panel(v, 'selected principal transition'), b = plot(v, 'ideal vacuum series positions', 'wavelength (nm)', '');
  const lower = v.select('series', [{ value: '1', label: 'Lyman' }, { value: '2', label: 'Balmer' }, { value: '3', label: 'Paschen' }], '2');
  const gap = v.slider('upper level minus lower', 1, 12, 1, { int: true }); let state;
  v.render(() => {
    const n = Number(lower.value), upper = n + gap.value;
    state = H.hydrogenLine(n, upper);
    for (const [y, label] of [[2, `n=${n}`], [8, `n=${upper}`]]) {
      a.line(2, y, 8, y, { color: 'accent', width: 2.5 }); a.text(label, 1.5, y, { color: 'ink', size: 12, align: 'right', baseline: 'middle' });
    }
    a.arrow(5, 7.6, 5, 2.4, { color: 'orange', width: 2.5, head: 9 });
    a.text('schematic level placement', 5, 9.7, { color: 'muted', size: 11, align: 'center' });
    const lines = Array.from({ length: 12 }, (_, j) => H.hydrogenLine(n, n + j + 1));
    const limit = 1e9 * n * n / (H.COULOMB_CONSTANTS.rydberg * state.muRatio), right = lines[0].vacuumNanometers, span = right - limit;
    b.setView([limit - .08 * span, right + .08 * span], [-.15, 1.25]);
    for (const line of lines) b.line(line.vacuumNanometers, .05, line.vacuumNanometers, .8, { color: 'accent', width: 1.4 });
    b.line(limit, .05, limit, 1.05, { color: 'muted', dash: true });
    b.dot(state.vacuumNanometers, .95, { color: 'gold', r: 4 });
    state.limit = limit;
  });
  v.legend([['accent', 'ideal transition positions, equal stroke height'], ['gold', 'selected pair'], ['muted', 'series limit']]);
  v.readout(() => `n=${state.upper} to ${state.lower}: vacuum wavelength ${v.fix(state.vacuumNanometers, 3)} nm, photon energy ${v.fix(state.electronVolts, 5)} eV. Series limit ${v.fix(state.limit, 3)} nm. These are leading Coulomb calculations, without measured intensities or fine-structure corrections.`);
}

export function isotopeWidget(v) {
  const s = panel(v, 'wavelength shift from fixed nucleus');
  const lower = v.slider('lower principal level', 1, 3, 2, { int: true }), gap = v.slider('upper minus lower', 1, 6, 1, { int: true });
  const mass = v.slider('chosen nuclear mass / proton mass', .5, 3, 1.5, { step: 'any', decimals: 3 }); let state;
  v.render(() => {
    const a = lower.value, b = a + gap.value, C = H.COULOMB_CONSTANTS;
    const rows = [['H', C.protonMassRatio, 'accent'], ['D', C.deuteronMassRatio, 'orange'], ['chosen', mass.value * C.protonMassRatio, 'purple']].map(([label, M, color]) => ({ label, color, ...H.isotopeLineShift(a, b, null, M) }));
    const max = Math.max(...rows.map(r => r.vacuumNanometerShift));
    rows.forEach((row, j) => {
      const y = 7.5 - 2.5 * j, x = 2 + 6.3 * row.vacuumNanometerShift / max;
      s.line(2, y, x, y, { color: row.color, width: 3 }); s.dot(x, y, { color: row.color, r: 4 });
      s.text(row.label, 1.5, y, { color: row.color, size: 12, align: 'right', baseline: 'middle' });
    });
    s.text('positive shift: longer wavelength', 5, 9.7, { color: 'muted', size: 11, align: 'center' });
    s.text(`row maximum ${max.toFixed(4)} nm`, 5, .3, { color: 'muted', size: 11, align: 'center' });
    state = { rows, isotope: H.isotopeLineShift(a, b) };
  });
  v.legend([['accent', 'hydrogen'], ['orange', 'deuterium'], ['purple', 'chosen nuclear mass']]);
  v.readout(() => state.rows.map(r => `${r.label}: ${v.fix(r.b.vacuumNanometers, 4)} nm (shift +${v.fix(r.vacuumNanometerShift, 5)} nm)`).join('; ') + `. D minus H shift=${v.fix(state.isotope.vacuumNanometerShift, 5)} nm. All shifts are ideal reduced-mass contributions in vacuum.`);
}

export function virialWidget(v) {
  const s = plot(v, 'separately integrated energy moments', '', 'Hartree'), get = quantum(v, { maxRadial: 6, maxEll: 5 }), Z = v.slider('charge Z', 1, 5, 1, { int: true }); let state;
  v.render(() => {
    const q = get(); state = H.hydrogenMoments(q.n, q.ell, Z.value);
    const magnitude = Math.abs(state.V); s.setView([-.6, 2.6], [-1.18 * magnitude, .75 * magnitude]);
    for (const [j, value, color, label] of [[0, state.T, 'accent', 'T'], [1, state.V, 'orange', 'V'], [2, 2 * state.T + state.V, 'green', '2T+V']]) {
      s.line(j, 0, j, value, { color, width: 10 }); s.dot(j, value, { color, r: 4 });
      s.text(label, j, -.09 * magnitude, { color: 'ink', size: 11, align: 'center', baseline: 'top' });
    }
  });
  v.legend([['accent', 'kinetic gamma integral'], ['orange', 'potential gamma integral'], ['green', 'virial residual']]);
  v.readout(() => `n=${state.n}, ell=${state.ell}, Z=${state.Z}. Exact radial normalization ${state.normalization.n}/${state.normalization.d}. T=${v.fix(state.T, 7)}, V=${v.fix(state.V, 7)}, E=${v.fix(state.T + state.V, 7)} Hartree. At Z=1: T=${state.kinetic.n}/${state.kinetic.d}, V=${state.potential.n}/${state.potential.d}; 2T+V is exactly zero in rational arithmetic.`);
}

export function ionWidget(v) {
  const s = plot(v, 'radial charge scaling', 'r / a_mu', '|u|²'), get = quantum(v), Z = v.slider('charge Z', 1, 5, 2, { int: true });
  const coordinates = v.select('coordinates', ['fixed radius', 'compensated scaling'], 'fixed radius'); let state;
  v.render(() => {
    const q = get(), charge = Z.value, end = 6 * q.n * q.n, scaled = coordinates.value === 'compensated scaling';
    const a = samples(r => H.hydrogenRadial(q.n, q.ell, r).radialProbability, end);
    const b = samples(r => H.hydrogenRadial(q.n, q.ell, scaled ? r / charge : r, charge).radialProbability / (scaled ? charge : 1), end);
    curves(s, [a, b], end);
    s.setLabels(axisLabel(scaled ? 'Z r / a_mu' : 'r / a_mu'), axisLabel(scaled ? '|u_Z|² / Z' : '|u|²'));
    const moments = H.hydrogenMoments(q.n, q.ell, charge); state = { ...q, charge, moments };
  });
  v.legend([['accent', 'Z=1 reference'], ['orange', 'chosen charge, with selected coordinates']]);
  v.readout(() => `n=${state.n}, ell=${state.ell}, Z=${state.charge}. Energy ratio Z²=${state.charge ** 2}; mean radius=${v.fix(state.moments.meanR, 5)} a_mu, exactly 1/Z times the reference. The compensated curve divides density by Z as well as rescaling radius, preserving radial normalization.`);
}

export function packetWidget(v) {
  const a = plot(v, 'conditional intensity on the circle', 'phi / pi', 'density'), b = plot(v, 'finite principal-state populations', 'principal n', 'population');
  const n = v.slider('central principal n', 20, 60, 30, { int: true }), sigma = v.slider('Gaussian width', 1, 3, 2, { int: true });
  const cycles = v.slider('time / classical period', 0, 80, 0, { step: 'any', decimals: 3 });
  v.button('initial packet', () => cycles.set(0)); v.button('one classical period', () => cycles.set(1)); v.button('estimated revival time', () => cycles.set(2 * n.value / 3));
  let state;
  v.render(() => {
    state = H.rydbergPacket(n.value, sigma.value, cycles.value);
    const density = samples(x => H.packetCircleDensity(state, x * Math.PI), 2, 400);
    curves(a, [density], 2);
    const maximum = Math.max(...state.rows.map(r => r.population)), left = state.rows[0].n, right = state.rows.at(-1).n;
    b.setView([left - 1, right + 1], [-.08 * maximum, 1.15 * maximum]);
    for (const row of state.rows) { b.line(row.n, 0, row.n, row.population, { color: 'orange', width: 2 }); b.dot(row.n, row.population, { color: 'orange', r: 3 }); }
  });
  v.legend([['accent', 'conditional angular intensity, integral one'], ['orange', 'normalized full-state populations']]);
  v.readout(() => `n0=${state.n0}, ${state.rows.length} circular states, time=${state.cycles > 0 && state.cycles < 1e-4 ? state.cycles.toExponential(4) : v.fix(state.cycles, 4)} Tcl. Full-state autocorrelation=${v.fix(state.fullStateAutocorrelation, 6)}; rotating-frame fidelity=${v.fix(state.rotatingFrameFidelity, 6)}. Quadratic revival estimate ${v.fix(state.approximateRevivalPeriods, 3)} Tcl. Conditional circle radius=${state.radius} a_mu, theta=pi/2; this is not a spatial marginal.`);
}

export function rotorWidget(v) {
  const a = panel(v, 'z-polarized adjacent transition'), b = plot(v, 'ideal absorption strengths', 'energy gap / B0', 'strength');
  const J = v.slider('initial J', 0, 8, 1, { int: true }), mode = v.select('initial projection', ['m=0', 'm=J'], 'm=0');
  const inertia = v.slider('inertia / I0', .25, 4, 1, { step: 'any', decimals: 3 }), dipole = v.slider('permanent dipole in 0.05 units', 0, 40, 20, { int: true }); let state;
  v.render(() => {
    state = H.rotorAbsorption(J.value, mode.value === 'm=0' ? 0 : J.value, inertia.value, dipole.value / 20);
    a.line(2, 2, 8, 2, { color: 'accent', width: 2.5 }); a.line(2, 8, 8, 8, { color: 'accent', width: 2.5 });
    a.text(`J=${state.J}`, 5, 1.2, { color: 'ink', size: 12, align: 'center' }); a.text(`J=${state.J + 1}`, 5, 8.7, { color: 'ink', size: 12, align: 'center' });
    if (state.strength > 0) a.arrow(5, 2.4, 5, 7.6, { color: 'orange', width: 2.5, head: 9 });
    else a.text('zero E1 strength', 5, 5, { color: 'muted', size: 12, align: 'center' });
    const rows = Array.from({ length: 9 }, (_, j) => H.rotorAbsorption(j, mode.value === 'm=0' ? 0 : j, inertia.value, dipole.value / 20));
    const end = rows.at(-1).gap, top = Math.max(1, ...rows.map(r => r.strength)); b.setView([-.05 * end, 1.05 * end], [-.08 * top, 1.15 * top]);
    for (const row of rows) { b.line(row.gap, 0, row.gap, row.strength, { color: 'orange', width: 2 }); b.dot(row.gap, row.strength, { color: row.J === J.value ? 'gold' : 'orange', r: row.J === J.value ? 4 : 2.5 }); }
  });
  v.legend([['accent', 'schematic selected energy levels'], ['orange', 'E1 matrix-element strength'], ['gold', 'selected line, including zero']]);
  v.readout(() => `J=${state.J}, m=${state.m}: energies ${v.fix(state.initialEnergy, 4)} and ${v.fix(state.finalEnergy, 4)} B0; gap=${v.fix(state.gap, 4)} B0. Dipole=${v.fix(state.dipole, 2)}; z-polarized strength=${v.fix(state.strength, 6)} chosen dipole units². Adjacent line spacing=${v.fix(2 / state.inertia, 4)} B0. Initial populations are not included.`);
}

export function shallowWellWidget(v) {
  const a = plot(v, 'normalized interior radial state', 'r / a', '|u|² / kappa'), b = plot(v, 'normalized exterior radial state', 'kappa (r/a − 1)', '|u|² / kappa');
  const mode = v.select('depth setting', ['chosen depth', 'exact threshold', 'just above'], 'chosen depth'), depth = v.slider('dimensionless depth D', 0, 12, 5, { step: 'any', decimals: 4 }); let state;
  v.render(() => {
    depth.el.style.display = mode.value === 'chosen depth' ? '' : 'none';
    const D = mode.value === 'chosen depth' ? depth.value : Math.PI ** 2 / 4 + (mode.value === 'just above' ? 1e-8 : 0);
    state = H.finiteSphericalWell(D);
    if (state.bound !== true) {
      for (const s of [a, b]) { s.setView([-.05, 1.05], [-.08, 1.12]); s.text(state.bound === false ? 'No bound state' : 'Threshold unresolved', .5, .5, { color: 'muted', align: 'center', size: 12 }); }
      return;
    }
    curves(a, [samples(r => (state.normalization * Math.sin(state.q * r)) ** 2 / state.kappa, 1)], 1);
    curves(b, [samples(x => (state.normalization * Math.cos(state.offset) * Math.exp(-x)) ** 2 / state.kappa, 6)], 6, ['orange']);
  });
  v.legend([['accent', 'interior density divided by kappa'], ['orange', 'exterior density divided by kappa; horizontal axis rescaled']]);
  v.readout(() => `D=${v.fix(state.D, 10)}; threshold pi²/4=${v.fix(state.threshold, 10)}. ${state.bound === true ? `First energy $${v.sci(state.energy, 5)}$ wall units, decay kappa $${v.sci(state.kappa, 5)}$; exterior probability=${v.fix(state.outsideProbability, 8)}. Depth-equation residual $${v.sci(state.depthResidual, 3)}$. Exterior beyond the shown six decay lengths has probability $${v.sci(state.outsideProbability * Math.exp(-12), 3)}$.` : state.status + '; no normalized bound-state curve is drawn.'}`);
}
