import assert from 'node:assert/strict';
import { test } from 'node:test';
import a from '../content/circ/ch04.js';
import b from '../content/circ/ch04-b.js';
import c from '../content/circ/ch04-c.js';
import { mos, shock, loadDiode, vT } from '../content/circ/ch04.shared.js';

// Execute the real visualization callbacks and inspect their computed geometry.
// Expectations below come from independent derivatives, KCL and linear stability.
function run(num, values = []) {
  const item = [...a.items, ...b.items, ...c.items].find(x => x.num === num);
  const stages = [], sliders = [], readouts = [], buttons = new Map();
  let draw;
  const v = {
    stage(options) {
      const calls = [], handles = [];
      const stage = new Proxy({ options, calls, handles,
        handle(x, y, opts = {}) {
          const h = { x, y, set(x1, y1) {
            if (typeof opts.constrain === 'function') [x1, y1] = opts.constrain(x1, y1);
            this.x = x1; this.y = y1;
          } };
          handles.push(h); return h;
        },
      }, { get(target, key) {
        if (key in target) return target[key];
        return (...args) => { calls.push([key, ...args]); if (key === 'clip') args[0](); return stage; };
      } });
      stages.push(stage); return stage;
    },
    slider(label, min, max, initial) {
      const ctl = { value: values[sliders.length] ?? initial, el: {}, set(x) { this.value = x; } };
      sliders.push(ctl); return ctl;
    },
    select(label, options, initial) { return { value: initial, el: {} }; },
    button(label, fn) { buttons.set(label, fn); },
    render(fn) { draw = fn; fn(); },
    legend() {},
    readout(fn) { readouts.push(fn); },
    fix(x, n) { return Number(x).toFixed(n); },
    sci(x, n) { return Number(x).toExponential(n); },
    rng(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; }; },
  };
  item.viz(v);
  return { stages, sliders, buttons, draw, text: () => readouts.map(fn => fn()).join('\n') };
}

test('diode load-line roots satisfy KCL even though reverse current is bounded', () => {
  for (const source of [-5, -1, 0, .5, 5]) for (const R of [100, 1e3, 1e4]) {
    const q = loadDiode(source, R, 1e-14);
    assert.ok(Math.abs(q.i - shock(q.v, 1e-14)) < 1e-14);
    assert.ok(Math.abs(source - q.v - R * q.i) < 1e-14);
  }
  assert.ok(Math.abs(vT(300) - .025851999786) < 1e-13);
});

test('MOS region boundary and reported triode transconductance match the plotted current', () => {
  for (const lambda of [0, .02, .1]) {
    const r = run('4.10', [3.5, lambda]);
    const boundary = r.stages[0].calls.find(x => x[0] === 'between')[1];
    for (const vds of [.2, 1, 3]) {
      assert.ok(Math.abs(boundary(vds) / 1e3 - mos(vds + 1, vds, 1, .002, lambda)) < 1e-12);
      assert.ok(Math.abs(mos(vds + 1, vds - 1e-8, 1, .002, lambda) - mos(vds + 1, vds + 1e-8, 1, .002, lambda)) < 1e-9);
    }
    const dg = (mos(3.5 + 1e-5, 2, 1, .002, lambda) - mos(3.5 - 1e-5, 2, 1, .002, lambda)) / 2e-5;
    const displayed = Number(r.text().match(/g_m = ([\d.]+)/)[1]) / 1e3;
    assert.ok(Math.abs(displayed - dg) < 5.1e-6);
    const view = r.stages[1].calls.findLast(x => x[0] === 'setView');
    assert.ok(view[2][1] > mos(5, 2, 1, .002, lambda) * 1e3, 'the entire transfer current fits');
  }
});

test('tanh latch has two stable equilibria above threshold and a stable critical midpoint', () => {
  for (const g of [.5, 1, 1.01, 3, 6]) {
    const r = run('4.13', [g]);
    const dots = r.stages[0].calls.filter(x => x[0] === 'dot');
    assert.equal(dots.length, g > 1 ? 3 : 1);
    assert.equal(dots.filter(x => x[3].color === 'green').length, g > 1 ? 2 : 1);
    const f = x => 2.5 * (1 - Math.tanh(g * (x / 2.5 - 1)));
    for (const [, x, y] of dots) {
      assert.ok(Math.abs(x - f(y)) < 1e-10);
      assert.ok(Math.abs(y - f(x)) < 1e-10);
    }
    r.buttons.get('Start near middle, above diagonal')();
    assert.ok(r.stages[0].handles[0].y > r.stages[0].handles[0].x);
    r.buttons.get('Start near middle, below diagonal')();
    assert.ok(r.stages[0].handles[0].y < r.stages[0].handles[0].x);
  }
});

test('point-contact model has a genuine load-line intersection under extreme drive', () => {
  for (const values of [[5, 4, .2, 3e4], [100, 0, .2, 1e3], [25, 1.5, .2, 1e4]]) {
    const r = run('4.14', values), calls = r.stages[1].calls;
    const curve = calls.filter(x => x[0] === 'fn').at(-1)[1];
    const [, voltage, current] = calls.find(x => x[0] === 'dot');
    assert.ok(Math.abs(current - (30 - voltage) / values[3] * 1e3) < 1e-10);
    assert.ok(Math.abs(current - curve(voltage)) < 1e-10);
  }
});

test('low-pass RC oscillator onset is A=29 and normalized frequency is sqrt(6)', () => {
  // det(zI-M) = z^3+5z^2+6z+(1+A); substituting i*sqrt(6)
  // leaves real part A-29. The real callbacks should therefore measure period 1
  // in units of 2*pi*RC/sqrt(6) near threshold, rather than the high-pass formula.
  const r = run('4.16', [1e4, 1e-9, 29]);
  const out = r.stages[0].calls.find(x => x[0] === 'path')[1];
  const crossings = [];
  for (let i = 1; i < out.length; i++) {
    const [t0, y0] = out[i - 1], [t1, y1] = out[i];
    if (t0 > 8 && y0 < 0 && y1 >= 0) crossings.push(t0 - y0 * (t1 - t0) / (y1 - y0));
  }
  assert.ok(crossings.length >= 6);
  const period = (crossings.at(-1) - crossings[0]) / (crossings.length - 1);
  assert.ok(Math.abs(period - 1) < .001);
});

test('equal-slope power curves have a static gap, and the marker is the dynamic/static knee', () => {
  const r = run('4.17'), calls = r.stages[0].calls;
  const [pc, pr, dynamic] = calls.filter(x => x[0] === 'fn').map(x => x[1]);
  const knee = calls.find(x => x[0] === 'vline')[1];
  const staticR = pr(0);
  assert.ok(Math.abs(dynamic(knee) / staticR - 1) < 1e-12);
  const gap = pr(1e3) - pc(1e3);
  assert.ok(gap > 0);
  for (const f of [1e5, 1e7, 1e10]) assert.ok(Math.abs((pr(f) - pc(f)) / gap - 1) < 1e-12);
  const resistor = r.stages[1].calls.find(x => x[0] === 'path')[1];
  const at8 = resistor.findIndex(x => x[0] === 8);
  assert.ok(Math.abs(resistor[at8][1] - resistor[at8 - 1][1]) < .001, 'supply current is continuous as the pull-down switches on');
});


test('ideal rectifier output never falls below the forward-conduction envelope', () => {
  const r = run('4.5', [12, 1e-5, 50]);
  const paths = r.stages[0].calls.filter(x => x[0] === 'path');
  const source = paths[0][1], out = paths[1][1];
  for (let i = 0; i < out.length; i++) {
    assert.ok(out[i][1] >= Math.max(source[i][1] - .7, 0) - 1e-12);
  }
});
