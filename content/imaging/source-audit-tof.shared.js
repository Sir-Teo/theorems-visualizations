export const LIGHT_CM_PER_NS = 29.9792458;
export const tofWidthAudit = ps => LIGHT_CM_PER_NS * ps / 2000;
export const tofGainAudit = (diameter, ps) => Math.max(1, Math.sqrt(diameter / tofWidthAudit(ps)));
// A unit activity disc of radius R plus an additional activity-3 unit-radius
// lesion gives true lesion/background ratio 4 and extra mass fraction 3/(R²+3).
export function tofSourceAudit(R, u, radialUniform, angle) {
  const lesion = u < 3 / (R * R + 3), radius = (lesion ? 1 : R) * Math.sqrt(radialUniform);
  return [radius * Math.cos(angle) + (lesion ? .45 * R : 0), radius * Math.sin(angle) + (lesion ? .3 * R : 0)];
}

export function tofBackprojectionAudit(D, ps, N, randoms, NG = 56, FOV = 25) {
  const { U, AL, RR, TH, ZZ } = randoms;
  const R = D / 2, lx = .45 * R, ly = .3 * R, sigma = tofWidthAudit(ps) / (2 * Math.sqrt(2 * Math.log(2)));
  const non = new Float64Array(NG * NG), tof = new Float64Array(NG * NG), px = 2 * FOV / NG, step = .4;
  let retained = 0;
  for (let i = 0; i < N; i++) {
    const [x, y] = tofSourceAudit(R, U[i], RR[i] * RR[i], TH[i]);
    const c = Math.cos(AL[i]), s = Math.sin(AL[i]), projection = x * c + y * s;
    const halfChord = Math.sqrt(Math.max(0, projection * projection - x * x - y * y + R * R));
    const low = -projection - halfChord, high = -projection + halfChord, measured = sigma * ZZ[i];
    const points = []; let plainMass = 0, timingMass = 0;
    // Equal midpoint cells cover the complete known-support chord. A short
    // near-tangent chord still receives one cell instead of losing the event.
    const count = Math.max(1, Math.ceil((high - low) / step)), width = (high - low) / count;
    for (let j = 0; j < count; j++) {
      const t = low + (j + .5) * width, g = Math.exp(-.5 * ((t - measured) / sigma) ** 2);
      points.push([t, g]); plainMass += width; timingMass += g * width;
    }
    if (!(plainMass > 0 && timingMass > 0)) continue;
    retained++;
    for (const [t, g] of points) {
      const fi = (x + t * c + FOV) / px - .5, fj = (FOV - y - t * s) / px - .5;
      const i0 = Math.floor(fi), j0 = Math.floor(fj), a = fi - i0, b = fj - j0;
      for (const [di, dj, w] of [[0, 0, (1 - a) * (1 - b)], [1, 0, a * (1 - b)], [0, 1, (1 - a) * b], [1, 1, a * b]]) {
        const ii = i0 + di, jj = j0 + dj;
        if (ii < 0 || ii >= NG || jj < 0 || jj >= NG) continue;
        non[jj * NG + ii] += w * width / plainMass; tof[jj * NG + ii] += w * g * width / timingMass;
      }
    }
  }
  const lesionStats = image => {
    let sum = 0, n = 0, bg = 0, bn = 0;
    for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
      const X = -FOV + (i + .5) * px, Y = FOV - (j + .5) * px, dl = Math.hypot(X - lx, Y - ly);
      if (dl < 1.3) { sum += image[j * NG + i]; n++; }
      else if (Math.hypot(X, Y) < .55 * R && dl > .35 * R) { bg += image[j * NG + i]; bn++; }
    }
    return { les: sum / n, bg: bg / bn };
  };
  return { non, tof, ln: lesionStats(non), lt: lesionStats(tof), lx, ly, retained };
}
