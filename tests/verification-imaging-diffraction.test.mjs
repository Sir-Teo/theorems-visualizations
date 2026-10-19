import test from 'node:test';
import assert from 'node:assert/strict';
import { diffractionLocusAudit, diffractionGridAudit, bornReceiverSpectrumAudit } from '../content/imaging/source-audit-diffraction.shared.js';
import { ellFT } from '../content/imaging/ch03.shared.js';

const near = (a, b, tolerance = 1e-11) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const E = [[1, .31, .18, .17, -.23, 27], [.4, .12, .17, -.29, .19, -13]];

test('every propagating locus satisfies the Ewald circle, forward hemisphere and sqrt-two cutoff in rotated coordinates', () => {
  for (const k0 of [3, 8, 14]) for (const phi of [0, .37, Math.PI / 2, 5.9]) {
    const u = [Math.cos(phi), Math.sin(phi)], P = diffractionLocusAudit(phi, k0, 'wave', 101, true);
    for (const [x, y] of P) {
      near(Math.hypot(x + k0 * u[0], y + k0 * u[1]), k0);
      assert.ok((x + k0 * u[0]) * u[0] + (y + k0 * u[1]) * u[1] >= -1e-12);
      assert.ok(Math.hypot(x, y) <= Math.SQRT2 * k0 + 1e-12);
    }
    near(Math.hypot(...P[0]), Math.SQRT2 * k0);
    near(Math.hypot(...P.at(-1)), Math.SQRT2 * k0);
    near(Math.hypot(...P[50]), 0);
  }
});

test('outgoing Green spectrum obeys the one-dimensional Helmholtz jump and the correct cycles-unit normalization', () => {
  // For beta=2*pi*kappa, outgoing g(y)=i*exp(i*beta*abs(y))/(2*beta).
  // The derivative jump is -1: (d²/dy²+beta²)g=-delta.
  for (const k0 of [3, 8, 14]) for (const q of [-.9 * k0, 0, .3 * k0]) {
    const beta = 2 * Math.PI * Math.sqrt(k0 * k0 - q * q);
    const eps = 1e-8, g0 = bornReceiverSpectrumAudit([1, 0], q, k0, 0), ge = bornReceiverSpectrumAudit([1, 0], q, k0, eps);
    near(2 * (ge[0] - g0[0]) / eps, -1, 1e-8);
    near(2 * (ge[1] - g0[1]) / eps, 0, 1e-6);
    for (const receiver of [1.5, 3.25]) {
      const F = [.7, -.21], r = bornReceiverSpectrumAudit(F, q, k0, receiver);
      const phase = beta * receiver;
      // Independent real/imaginary expansion of i*F*exp(i*phase)/(2*beta).
      near(r[0], (-F[1] * Math.cos(phase) - F[0] * Math.sin(phase)) / (2 * beta));
      near(r[1], (F[0] * Math.cos(phase) - F[1] * Math.sin(phase)) / (2 * beta));
      near(Math.hypot(...r) * 2 * beta, Math.hypot(...F));
    }
    assert.equal(bornReceiverSpectrumAudit([1, 0], k0, k0, 2), null);
    assert.equal(bornReceiverSpectrumAudit([1, 0], 1.1 * k0, k0, 2), null);
  }
});

test('straight-slice limit holds on a fixed bounded frequency window but not at fixed q/k0', () => {
  const q = 1.7, sag = k => Math.sqrt(k * k - q * q) - k;
  assert.ok(Math.abs(sag(100)) < Math.abs(sag(10)) / 9);
  near(sag(100), -q * q / (100 + Math.sqrt(10000 - q * q)));
  const relativeSag = k => (Math.sqrt(k * k - (.8 * k) ** 2) - k) / k;
  near(relativeSag(10), -.4); near(relativeSag(100), -.4);
});

test('finite gridding uses actual arc samples, averages duplicates, exposes missing cells and explicitly adds real-object conjugates', () => {
  for (const mode of ['wave', 'ray']) {
    const k0 = 3, angles = 4, span = 60, N = 16, r = diffractionGridAudit(E, k0, angles, span, mode, N);
    const buckets = new Map(); let accepted = 0, discarded = 0;
    const add = (ix, iy, re, im) => {
      const id = (iy + N / 2) * N + ix + N / 2;
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push([re, im]);
    };
    for (let a = 0; a < angles; a++) {
      const phi = (a + .5) * span / angles * Math.PI / 180;
      // Independently parameterize the open forward arc / bounded ray slice.
      for (let j = 0; j < 65; j++) {
        const t = (j + .5) / 65, delta = (t - .5) * Math.PI;
        const x = mode === 'wave' ? k0 * (Math.cos(phi + delta) - Math.cos(phi)) : -(2 * t - 1) * Math.SQRT2 * k0 * Math.sin(phi);
        const y = mode === 'wave' ? k0 * (Math.sin(phi + delta) - Math.sin(phi)) : (2 * t - 1) * Math.SQRT2 * k0 * Math.cos(phi);
        const ix = Math.sign(x) * Math.round(Math.abs(x) * 2), iy = Math.sign(y) * Math.round(Math.abs(y) * 2);
        if (Math.hypot(ix / 2, iy / 2) > r.cutoff + 1e-12) { discarded++; continue; }
        const [re, im] = ellFT(E, x, y); add(ix, iy, re, im); add(-ix, -iy, re, -im); accepted++;
      }
    }
    assert.equal(r.accepted, accepted); assert.equal(r.discarded, discarded);
    assert.equal(r.cells, buckets.size); assert.ok(r.cells < r.eligible);
    let snappedMismatch = 0;
    for (let id = 0; id < N * N; id++) {
      const b = buckets.get(id) || [];
      assert.equal(r.counts[id], b.length);
      near(r.gridRe[id], b.length ? b.reduce((s, z) => s + z[0], 0) / b.length : 0);
      near(r.gridIm[id], b.length ? b.reduce((s, z) => s + z[1], 0) / b.length : 0);
      if (b.length) {
        const snapped = ellFT(E, (id % N - N / 2) / 2, (Math.floor(id / N) - N / 2) / 2);
        snappedMismatch = Math.max(snappedMismatch, Math.hypot(r.gridRe[id] - snapped[0], r.gridIm[id] - snapped[1]));
      }
    }
    assert.ok(snappedMismatch > .005, 'snapping cannot silently replace measured samples with exact center values');
    assert.ok(r.displacementRMS > 0); assert.ok(r.imagMax < 1e-12);
  }
});

test('direct complex Fourier summation validates inverse normalization, physical coordinates and vertical display orientation', () => {
  const N = 16, r = diffractionGridAudit(E, 3, 7, 270, 'wave', N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -1 + (i + .5) * 2 / N, y = 1 - (j + .5) * 2 / N;
    let real = 0, imaginary = 0;
    for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
      const id = b * N + a, phase = 2 * Math.PI * ((a - N / 2) * .5 * x + (b - N / 2) * .5 * y);
      real += .25 * (r.gridRe[id] * Math.cos(phase) - r.gridIm[id] * Math.sin(phase));
      imaginary += .25 * (r.gridRe[id] * Math.sin(phase) + r.gridIm[id] * Math.cos(phase));
    }
    near(r.out[j * N + i], real); near(imaginary, 0);
  }
});

test('both comparison geometries use the same finite circular grid cutoff across all supported endpoints', () => {
  for (const k0 of [3, 14]) for (const angles of [4, 120]) for (const span of [60, 360]) {
    const wave = diffractionGridAudit(E, k0, angles, span), ray = diffractionGridAudit(E, k0, angles, span, 'ray');
    near(wave.cutoff, Math.min(Math.SQRT2 * k0, 15.5)); near(wave.cutoff, ray.cutoff);
    for (const r of [wave, ray]) {
      assert.equal(r.accepted + r.discarded, 65 * angles);
      assert.ok(r.cells <= r.eligible); assert.ok(r.imagMax < 1e-11);
      assert.ok(r.out.every(Number.isFinite));
    }
  }
});
