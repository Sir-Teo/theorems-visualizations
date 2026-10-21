import { ellFT, fft2d } from './ch03.shared.js';

export function diffractionLocusAudit(phi, k0, mode = 'wave', count = 65, endpoints = false) {
  const c = Math.cos(phi), s = Math.sin(phi), points = [];
  for (let i = 0; i < count; i++) {
    const t = endpoints ? i / (count - 1) : (i + .5) / count;
    if (mode === 'wave') { const delta = (t - .5) * Math.PI, psi = phi + delta; points.push([k0 * (Math.cos(psi) - c), k0 * (Math.sin(psi) - s)]); }
    else { const q = (2 * t - 1) * Math.SQRT2 * k0; points.push([-q * s, q * c]); }
  }
  return points;
}

export function diffractionGridAudit(E, k0, angles, span, mode = 'wave', N = 64) {
  const dw = .5, theoreticalRadius = Math.SQRT2 * k0, cutoff = Math.min(theoreticalRadius, N / 4 - .5);
  const sumRe = new Float64Array(N * N), sumIm = new Float64Array(N * N), counts = new Uint32Array(N * N);
  let accepted = 0, discarded = 0, displacement = 0;
  const add = (a, b, re, im) => { const i = b * N + a; sumRe[i] += re; sumIm[i] += im; counts[i]++; };
  for (let a = 0; a < angles; a++) {
    const phi = ((a + .5) * span / angles) * Math.PI / 180;
    for (const [kx, ky] of diffractionLocusAudit(phi, k0, mode)) {
      // Symmetric nearest-cell rounding; negative half ties must not break Hermitian symmetry.
      const ix = Math.sign(kx) * Math.round(Math.abs(kx) / dw), iy = Math.sign(ky) * Math.round(Math.abs(ky) / dw);
      if (Math.hypot(ix * dw, iy * dw) > cutoff + 1e-12) { discarded++; continue; }
      const [re, im] = ellFT(E, kx, ky); // actual synthetic arc sample, never an oracle value at a snapped centre
      add(ix + N / 2, iy + N / 2, re, im);
      add(N / 2 - ix, N / 2 - iy, re, -im); // explicitly uses the chosen real-object constraint
      accepted++; displacement += (ix * dw - kx) ** 2 + (iy * dw - ky) ** 2;
    }
  }
  const gridRe = new Float64Array(N * N), gridIm = new Float64Array(N * N), re = new Float64Array(N * N), im = new Float64Array(N * N);
  let cells = 0, eligible = 0;
  for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
    const i = b * N + a, kx = (a - N / 2) * dw, ky = (b - N / 2) * dw;
    if (Math.hypot(kx, ky) <= cutoff + 1e-12) eligible++;
    if (!counts[i]) continue;
    cells++; gridRe[i] = sumRe[i] / counts[i]; gridIm[i] = sumIm[i] / counts[i];
    const phase = (-2 * Math.PI + 2 * Math.PI / N) * (kx + ky), c = Math.cos(phase), s = Math.sin(phase);
    re[i] = gridRe[i] * c - gridIm[i] * s; im[i] = gridRe[i] * s + gridIm[i] * c;
  }
  fft2d(re, im, N, N, true);
  const out = new Float64Array(N * N), scale = N * N * dw * dw; let imagMax = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const sign = (i + j) % 2 ? -1 : 1;
    out[(N - 1 - j) * N + i] = sign * re[j * N + i] * scale;
    imagMax = Math.max(imagMax, Math.abs(im[j * N + i] * scale));
  }
  return { out, gridRe, gridIm, counts, cells, eligible, accepted, discarded, theoreticalRadius, cutoff, imagMax, displacementRMS: accepted ? Math.sqrt(displacement / accepted) : 0 };
}

// Receiver-plane lateral spectrum for incident +y and outgoing G=i H0^(1)/4.
// Object Fourier transform uses cycles/unit, so beta_ang=2*pi*kappa.
export function bornReceiverSpectrumAudit(F, q, k0, receiverY) {
  const kappa = Math.sqrt(k0 * k0 - q * q); if (!(kappa > 0)) return null;
  const phase = 2 * Math.PI * kappa * receiverY, scale = 1 / (4 * Math.PI * kappa);
  return [(-F[0] * Math.sin(phase) - F[1] * Math.cos(phase)) * scale, (F[0] * Math.cos(phase) - F[1] * Math.sin(phase)) * scale];
}
