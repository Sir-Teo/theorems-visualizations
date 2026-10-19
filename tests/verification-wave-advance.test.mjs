import assert from 'node:assert/strict';
import {test} from 'node:test';
import {advanceResponse} from '../content/waves/ch03-b.js';

// Integrate a causal exponential shifted in TIME; this checks the production
// frequency-domain transform without constructing its expected complex phase.
test('positive advance matches the Fourier integral of h(t+tau), including its negative-time support', () => {
  for (const tau of [0, .4, 1.7, 3]) for (const omega of [-3, -.5, 0, .7, 2.4]) {
    const n = 12000, left = -tau, right = 35 - tau, dt = (right - left) / n;
    const integral = [0, 0];
    for (let j = 0; j <= n; j++) {
      const t = left + j * dt, weight = j === 0 || j === n ? 1 : j % 2 ? 4 : 2;
      const h = Math.exp(-(t + tau));
      integral[0] += weight * h * Math.cos(omega * t) * dt / 3;
      integral[1] += weight * h * Math.sin(omega * t) * dt / 3;
    }
    const actual = advanceResponse(1 / (1 + omega * omega), omega / (1 + omega * omega), omega, tau);
    for (let k = 0; k < 2; k++) assert.ok(Math.abs(actual[k] - integral[k]) < 1e-10, JSON.stringify({tau, omega, actual, integral}));
  }
});
