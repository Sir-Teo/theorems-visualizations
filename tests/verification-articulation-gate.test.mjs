import assert from 'node:assert/strict';
import {test} from 'node:test';
import {articulationTurbulenceGain} from '../content/ling/ch01.js';

test('articulation noise is suppressed below the chosen onset and ramps across the declared interval', () => {
  for (const threshold of [900, 1800, 3600]) {
    for (const re of [0, threshold / 2, threshold]) assert.equal(articulationTurbulenceGain(re, threshold), 0);
    for (const re of [1.6 * threshold, 2 * threshold, 10 * threshold]) assert.equal(articulationTurbulenceGain(re, threshold), 1);
    for (const [fraction, gain] of [[.25, .15625], [.5, .5], [.75, .84375]]) {
      assert.ok(Math.abs(articulationTurbulenceGain(threshold * (1 + .6 * fraction), threshold) - gain) < 1e-12);
    }
    let last = 0;
    for (let re = 0; re <= 3 * threshold; re += threshold / 100) {
      const gain = articulationTurbulenceGain(re, threshold);
      assert.ok(Number.isFinite(gain) && gain >= last && gain <= 1);
      last = gain;
    }
  }
});
