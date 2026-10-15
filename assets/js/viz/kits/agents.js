// Agents kit — agent-based models and cellular automata. Reference: docs/kits-world.md.
//
//   const tol = v.slider('tolerance', 0, 1, 0.4);
//   const A = v.agents(stage, { ...v.automata('schelling', { tolerance: () => tol.value }), size: 50, seed: 3 });
//   v.render(() => { A.draw(); A.plot(ts, { series: ['segregation'] }); });
//
// Grid models: `states` [{name, color, alpha}] (color null = transparent), `init(rng, i, j, model)` → state or `fill`
// {stateName: fraction}, and either a synchronous `rule(state, counts, rng, i, j, model)` → new state (counts[k] = number
// of neighbours in state k; Moore or von Neumann neighbourhood, wrapped or not) or a free-form `step(model, rng)`.
// Continuous models: `agents: n` in a `box` [w, h] with motion 'walk' | 'ballistic' | 'boids', disc collisions and an
// `interact(i, j, model, rng)` hook for contacts. Both record `stats(model)` (plus state fractions) every step into
// model.history, drawn by A.plot(stage). The kit owns the runtime animation (play/pause/restart + Step + New run);
// pass animate: false to step it yourself. Presets: v.automata('life' | 'schelling' | 'sir' | 'fire' | 'voter' |
// 'sandpile' | 'walkers' | 'gas' | 'boids' | 'contagion', params) → a spec to spread; params may be functions (live sliders).
import { rng as RNG } from '../math.js';

const val = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const MOORE = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]], VN = [[0, -1], [-1, 0], [1, 0], [0, 1]];

// ================================================================== model (DOM-free)
/** Build a model from a spec without any stage (used by the kit, and directly in tests). */
export function model(spec = {}) {
  const S = spec.agents != null ? new Swarm(spec) : new Grid(spec);
  S.reset(spec.seed ?? 1); return S;
}
class Base {
  _record() {
    const st = { ...this._fractions(), ...(this.spec.stats ? this.spec.stats(this) : {}) }; this.stats = st;
    const H = this.history; H.t.push(this.t); for (const k in st) { (H[k] ||= []).push(st[k]); }
    const max = this.spec.historyMax ?? 4000; if (H.t.length > max) for (const k in H) H[k].splice(0, H[k].length - max);
  }
  /** Advance n steps (stops early when done). */
  step(n = 1) { for (let k = 0; k < n && !this.done; k++) { this._step(); this.t++; this._record(); const sw = this.spec.stopWhen; if ((sw && sw(this)) || (this.spec.maxSteps != null && this.t >= this.spec.maxSteps)) this.done = true; } return this; }
  stateIndex(name) { if (typeof name === 'number') return name; const i = this.states.findIndex((s) => s.name === name); if (i < 0) throw new Error(`v.agents: unknown state "${name}"`); return i; }
  /** Series of a recorded statistic (or a state's fraction) over time. */
  series(name) { return this.history[name] || []; }
}
class Grid extends Base {
  constructor(spec) {
    super(); this.spec = spec;
    const sz = spec.size ?? 60; [this.w, this.h] = Array.isArray(sz) ? sz : [sz, sz];
    this.states = (spec.states || [{ name: 'off', color: null }, { name: 'on', color: 'ink' }]).map((s, i) => (typeof s === 'string' ? { name: s, color: ['faint', 'blue', 'orange', 'green', 'red', 'purple'][i] } : s));
    this.N = this.w * this.h; this.grid = new Uint8Array(this.N); this._next = new Uint8Array(this.N);
    this.wrap = spec.wrap !== false; this.nb = spec.neighborhood === 'vonneumann' || spec.neighborhood === 'vn' ? VN : MOORE;
    this.data = {}; // free scratch space for presets
  }
  reset(seed = this.seed ?? 1) {
    this.seed = seed; this.rng = RNG(seed); this.t = 0; this.done = false; this.data = {}; this.history = { t: [] };
    const sp = this.spec, r = this.rng;
    if (sp.fill) { const cum = []; let acc = 0; for (const [k, f] of Object.entries(sp.fill)) { acc += val(f); cum.push([this.stateIndex(k), acc]); } for (let i = 0; i < this.N; i++) { const u = r(); const hit = cum.find((c) => u < c[1]); this.grid[i] = hit ? hit[0] : 0; } }
    else if (sp.init) for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) this.grid[j * this.w + i] = val(sp.init(r, i, j, this)) | 0;
    else this.grid.fill(0);
    sp.setup?.(this, r); this.version = (this.version || 0) + 1; this._record(); return this;
  }
  idx(i, j) { if (this.wrap) { i = ((i % this.w) + this.w) % this.w; j = ((j % this.h) + this.h) % this.h; } else if (i < 0 || j < 0 || i >= this.w || j >= this.h) return -1; return j * this.w + i; }
  get(i, j) { const k = this.idx(i, j); return k < 0 ? -1 : this.grid[k]; }
  set(i, j, s) { const k = this.idx(i, j); if (k >= 0) { this.grid[k] = this.stateIndex(s); this.version++; } return this; }
  /** Neighbour indices of cell k (respecting wrap). */
  neighbors(k) { const i = k % this.w, j = (k / this.w) | 0, out = []; for (const [di, dj] of this.nb) { const q = this.idx(i + di, j + dj); if (q >= 0) out.push(q); } return out; }
  /** counts[s] of neighbours of cell k in each state (into `out`). */
  counts(k, out = new Int32Array(this.states.length)) { out.fill(0); const i = k % this.w, j = (k / this.w) | 0; for (const [di, dj] of this.nb) { const q = this.idx(i + di, j + dj); if (q >= 0) out[this.grid[q]]++; } return out; }
  count(s) { s = this.stateIndex(s); let n = 0; for (let k = 0; k < this.N; k++) if (this.grid[k] === s) n++; return n; }
  frac(s) { return this.count(s) / this.N; }
  _fractions() { const c = new Array(this.states.length).fill(0); for (let k = 0; k < this.N; k++) c[this.grid[k]]++; const o = {}; this.states.forEach((s, i) => (o[s.name] = c[i] / this.N)); return o; }
  _step() {
    const sp = this.spec;
    if (sp.step) { sp.step(this, this.rng); this.version++; return; }
    if (!sp.rule) return;
    const cnt = new Int32Array(this.states.length), g = this.grid, nx = this._next, w = this.w;
    for (let k = 0; k < this.N; k++) { this.counts(k, cnt); nx[k] = sp.rule(g[k], cnt, this.rng, k % w, (k / w) | 0, this); }
    this.grid = nx; this._next = g; this.version++;
  }
}
class Swarm extends Base {
  constructor(spec) {
    super(); this.spec = spec; this.n = spec.agents; [this.W, this.H] = spec.box || [100, 100];
    this.states = (spec.states || [{ name: 'agent', color: 'accent' }]).map((s) => (typeof s === 'string' ? { name: s, color: 'accent' } : s));
    const n = this.n; this.x = new Float64Array(n); this.y = new Float64Array(n); this.vx = new Float64Array(n); this.vy = new Float64Array(n);
    this.ux = new Float64Array(n); this.uy = new Float64Array(n); this.state = new Uint8Array(n); this.data = {};
  }
  get r() { return val(this.spec.radius ?? 0.8); }
  reset(seed = this.seed ?? 1) {
    this.seed = seed; this.rng = RNG(seed); this.t = 0; this.done = false; this.data = {}; this.history = { t: [] };
    const r = this.rng, sp = this.spec, v0 = val(sp.speed ?? 1);
    for (let i = 0; i < this.n; i++) {
      this.x[i] = r.uniform(this.r, this.W - this.r); this.y[i] = r.uniform(this.r, this.H - this.r);
      const a = r() * 2 * Math.PI; this.vx[i] = v0 * Math.cos(a); this.vy[i] = v0 * Math.sin(a); this.ux[i] = this.uy[i] = 0; this.state[i] = 0;
    }
    if (sp.init) for (let i = 0; i < this.n; i++) { const s = sp.init(r, i, this); if (s != null) this.state[i] = this.stateIndex(s); }
    sp.setup?.(this, r); this.version = (this.version || 0) + 1; this._record(); return this;
  }
  count(s) { s = this.stateIndex(s); let c = 0; for (let i = 0; i < this.n; i++) if (this.state[i] === s) c++; return c; }
  frac(s) { return this.count(s) / this.n; }
  _fractions() { const c = new Array(this.states.length).fill(0); for (let i = 0; i < this.n; i++) c[this.state[i]]++; const o = {}; this.states.forEach((s, i) => (o[s.name] = c[i] / this.n)); return o; }
  /** Mean squared displacement from the start (unwrapped). */
  msd() { let s = 0; for (let i = 0; i < this.n; i++) s += this.ux[i] ** 2 + this.uy[i] ** 2; return s / this.n; }
  /** Polarisation |Σ v| / Σ |v| (1 = all aligned). */
  order() { let sx = 0, sy = 0, s = 0; for (let i = 0; i < this.n; i++) { sx += this.vx[i]; sy += this.vy[i]; s += Math.hypot(this.vx[i], this.vy[i]); } return s ? Math.hypot(sx, sy) / s : 0; }
  /** Pairs (i, j) closer than d, via a uniform hash grid: fn(i, j, dx, dy, dist). */
  pairs(d, fn) {
    const cs = Math.max(d, 1e-6), gw = Math.max(1, Math.ceil(this.W / cs)), gh = Math.max(1, Math.ceil(this.H / cs)), head = new Int32Array(gw * gh).fill(-1), nxt = new Int32Array(this.n);
    const wrap = this.spec.walls === 'wrap';
    for (let i = 0; i < this.n; i++) { const c = clamp((this.x[i] / cs) | 0, 0, gw - 1) + clamp((this.y[i] / cs) | 0, 0, gh - 1) * gw; nxt[i] = head[c]; head[c] = i; }
    for (let i = 0; i < this.n; i++) {
      const ci = clamp((this.x[i] / cs) | 0, 0, gw - 1), cj = clamp((this.y[i] / cs) | 0, 0, gh - 1);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        let a = ci + di, b = cj + dj; if (wrap) { a = (a + gw) % gw; b = (b + gh) % gh; } else if (a < 0 || b < 0 || a >= gw || b >= gh) continue;
        for (let j = head[a + b * gw]; j >= 0; j = nxt[j]) {
          if (j <= i) continue; let dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
          if (wrap) { if (dx > this.W / 2) dx -= this.W; else if (dx < -this.W / 2) dx += this.W; if (dy > this.H / 2) dy -= this.H; else if (dy < -this.H / 2) dy += this.H; }
          const dd = dx * dx + dy * dy; if (dd < d * d) fn(i, j, dx, dy, Math.sqrt(dd));
        }
      }
    }
  }
  _step() {
    const sp = this.spec, r = this.rng, dt = val(sp.dt ?? 1), v0 = val(sp.speed ?? 1), n = this.n, mode = sp.move || 'walk', R = this.r;
    if (sp.step) { sp.step(this, r, dt); this.version++; return; }
    if (mode === 'walk') { // correlated random walk: heading diffuses by `turn` radians per step (π = fresh direction)
      const turn = val(sp.turn ?? Math.PI);
      for (let i = 0; i < n; i++) { const a = Math.atan2(this.vy[i], this.vx[i]) + r.uniform(-turn, turn); this.vx[i] = v0 * Math.cos(a); this.vy[i] = v0 * Math.sin(a); }
    } else if (mode === 'boids') {
      const rad = val(sp.vision ?? 6), sep = val(sp.separation ?? 1.5), wa = val(sp.align ?? 0.05), wc = val(sp.cohere ?? 0.005), ws = val(sp.avoid ?? 0.05), noise = val(sp.noise ?? 0.05);
      const ax = new Float64Array(n), ay = new Float64Array(n), cx = new Float64Array(n), cy = new Float64Array(n), sx = new Float64Array(n), sy = new Float64Array(n), cn = new Int32Array(n);
      this.pairs(rad, (i, j, dx, dy, d) => {
        ax[i] += this.vx[j]; ay[i] += this.vy[j]; ax[j] += this.vx[i]; ay[j] += this.vy[i]; cx[i] += dx; cy[i] += dy; cx[j] -= dx; cy[j] -= dy; cn[i]++; cn[j]++;
        if (d < sep && d > 1e-9) { const k = (sep - d) / d; sx[i] -= dx * k; sy[i] -= dy * k; sx[j] += dx * k; sy[j] += dy * k; }
      });
      for (let i = 0; i < n; i++) {
        if (cn[i]) { this.vx[i] += (ax[i] / cn[i] - this.vx[i]) * wa + (cx[i] / cn[i]) * wc; this.vy[i] += (ay[i] / cn[i] - this.vy[i]) * wa + (cy[i] / cn[i]) * wc; }
        this.vx[i] += sx[i] * ws + r.uniform(-noise, noise) * v0; this.vy[i] += sy[i] * ws + r.uniform(-noise, noise) * v0;
        const s = Math.hypot(this.vx[i], this.vy[i]) || 1; this.vx[i] *= v0 / s; this.vy[i] *= v0 / s;
      }
    }
    sp.update && sp.update(this, r, dt);
    for (let i = 0; i < n; i++) { const dx = this.vx[i] * dt, dy = this.vy[i] * dt; this.x[i] += dx; this.y[i] += dy; this.ux[i] += dx; this.uy[i] += dy; }
    if (sp.collide || mode === 'ballistic') this.pairs(2 * R, (i, j, dx, dy, d) => { // equal-mass elastic discs: swap normal velocities, separate
      if (d < 1e-9) return; const nx = dx / d, ny = dy / d, rv = (this.vx[j] - this.vx[i]) * nx + (this.vy[j] - this.vy[i]) * ny;
      if (rv < 0) { this.vx[i] += rv * nx; this.vy[i] += rv * ny; this.vx[j] -= rv * nx; this.vy[j] -= rv * ny; }
      const push = (2 * R - d) / 2; this.x[i] -= nx * push; this.y[i] -= ny * push; this.x[j] += nx * push; this.y[j] += ny * push;
    });
    if (sp.interact) { const range = val(sp.contact ?? 2 * R); this.pairs(range, (i, j, dx, dy, d) => sp.interact(i, j, this, r, d)); }
    const wrap = sp.walls === 'wrap';
    for (let i = 0; i < n; i++) {
      if (wrap) { this.x[i] = ((this.x[i] % this.W) + this.W) % this.W; this.y[i] = ((this.y[i] % this.H) + this.H) % this.H; continue; }
      if (this.x[i] < R) { this.x[i] = 2 * R - this.x[i]; this.vx[i] = Math.abs(this.vx[i]); } else if (this.x[i] > this.W - R) { this.x[i] = 2 * (this.W - R) - this.x[i]; this.vx[i] = -Math.abs(this.vx[i]); }
      if (this.y[i] < R) { this.y[i] = 2 * R - this.y[i]; this.vy[i] = Math.abs(this.vy[i]); } else if (this.y[i] > this.H - R) { this.y[i] = 2 * (this.H - R) - this.y[i]; this.vy[i] = -Math.abs(this.vy[i]); }
    }
  }
}

// ================================================================== presets: v.automata(name, params)
/** Life-like rule string 'B3/S23' → {born: Set, survive: Set}. */
export function lifeRule(str = 'B3/S23') { const m = String(str).toUpperCase().match(/B(\d*)\/?S(\d*)/); if (!m) throw new Error(`v.automata: bad rule "${str}"`); return { born: new Set([...m[1]].map(Number)), survive: new Set([...m[2]].map(Number)) }; }
/** Schelling: mean fraction of like neighbours among occupied neighbours, and the unhappy fraction, for tolerance t. */
export function schellingStats(M, t) {
  let like = 0, agents = 0, unhappy = 0; const c = new Int32Array(3);
  for (let k = 0; k < M.N; k++) { const s = M.grid[k]; if (!s) continue; M.counts(k, c); const occ = c[1] + c[2]; if (occ) { like += c[s] / occ; agents++; } if (occ && c[s] / occ < t) unhappy++; }
  return { segregation: agents ? like / agents : 0, unhappy: unhappy / Math.max(1, M.N - M.count(0)) };
}
export const AUTOMATA = {
  /** Conway's Game of Life (or any Life-like rule 'B36/S23'); p.density. */
  life: (p = {}) => {
    const cache = {};
    return {
      states: [{ name: 'dead', color: null }, { name: 'alive', color: p.color || 'ink' }], fill: { alive: p.density ?? 0.3, dead: 1 },
      rule: (s, c) => { const str = val(p.rule) || 'B3/S23', R = (cache[str] ||= lifeRule(str)); return s ? +R.survive.has(c[1]) : +R.born.has(c[1]); },
      paint: 'alive',
    };
  },
  /** Schelling segregation: p.tolerance (min. like fraction to stay), p.density, p.ratio. Unhappy agents move to random empty cells. */
  schelling: (p = {}) => ({
    states: [{ name: 'empty', color: null }, { name: 'A', color: p.colorA || 'blue' }, { name: 'B', color: p.colorB || 'orange' }],
    init: (r) => (r() < (val(p.density) ?? 0.9) ? (r() < (val(p.ratio) ?? 0.5) ? 1 : 2) : 0),
    step: (M, r) => {
      const t = val(p.tolerance) ?? 0.4, c = new Int32Array(3), mov = [], empty = [];
      for (let k = 0; k < M.N; k++) { const s = M.grid[k]; if (!s) { empty.push(k); continue; } M.counts(k, c); const occ = c[1] + c[2]; if (occ && c[s] / occ < t) mov.push(k); }
      for (const k of r.shuffle(mov)) { if (!empty.length) break; const e = r.int(0, empty.length - 1), dst = empty[e]; M.grid[dst] = M.grid[k]; M.grid[k] = 0; empty[e] = k; }
      M.data.moved = mov.length;
    },
    stats: (M) => schellingStats(M, val(p.tolerance) ?? 0.4),
    stopWhen: (M) => M.stats.unhappy === 0,
  }),
  /** SIR epidemic on a lattice: p.beta (per infected neighbour per step), p.gamma (recovery per step), p.seeds, p.waning (R→S). */
  sir: (p = {}) => ({
    states: [{ name: 'S', color: p.colorS || 'blue', alpha: 0.32 }, { name: 'I', color: p.colorI || 'red' }, { name: 'R', color: p.colorR || 'gray', alpha: 0.75 }],
    neighborhood: p.neighborhood || 'moore',
    setup: (M, r) => { M.grid.fill(0); const n = p.seeds ?? 5; for (let q = 0; q < n; q++) M.grid[p.center ? ((M.h / 2) | 0) * M.w + ((M.w / 2) | 0) + q : r.int(0, M.N - 1)] = 1; },
    rule: (s, c, r) => {
      if (s === 0) return c[1] && r() < 1 - (1 - val(p.beta ?? 0.25)) ** c[1] ? 1 : 0;
      if (s === 1) return r() < val(p.gamma ?? 0.1) ? 2 : 1;
      return r() < val(p.waning ?? 0) ? 0 : 2;
    },
    stopWhen: (M) => !p.waning && M.stats.I === 0,
  }),
  /** Drossel–Schwabl forest fire: p.growth (empty→tree), p.lightning (tree→fire); fire spreads to neighbouring trees, then burns out. */
  fire: (p = {}) => ({
    states: [{ name: 'empty', color: null }, { name: 'tree', color: p.colorTree || 'green' }, { name: 'fire', color: p.colorFire || 'orange' }],
    neighborhood: p.neighborhood || 'vonneumann', fill: { tree: p.density ?? 0.55, empty: 1 },
    rule: (s, c, r) => (s === 2 ? 0 : s === 1 ? (c[2] || r() < val(p.lightning ?? 2e-5) ? 2 : 1) : r() < val(p.growth ?? 0.01) ? 1 : 0),
    paint: 'fire',
  }),
  /** Voter model: each sweep, N random cells copy the opinion of a random neighbour. p.opinions (2…6). */
  voter: (p = {}) => {
    const k = p.opinions ?? 2, cols = ['blue', 'orange', 'green', 'purple', 'pink', 'teal'];
    return {
      states: Array.from({ length: k }, (_, i) => ({ name: String.fromCharCode(65 + i), color: cols[i] })), init: (r) => r.int(0, k - 1),
      step: (M, r) => { for (let q = 0; q < M.N; q++) { const a = r.int(0, M.N - 1), nb = M.neighbors(a); M.grid[a] = M.grid[nb[r.int(0, nb.length - 1)]]; } },
      stats: (M) => { let dis = 0, tot = 0; for (let a = 0; a < M.N; a++) for (const b of M.neighbors(a)) { tot++; if (M.grid[a] !== M.grid[b]) dis++; } return { interface: tot ? dis / tot : 0 }; },
      stopWhen: (M) => M.states.some((s) => M.stats[s.name] === 1),
    };
  },
  /** Bak–Tang–Wiesenfeld sandpile: one grain per step (p.drop: 'center' | 'random'); records the avalanche size (topplings). */
  sandpile: (p = {}) => ({
    states: [{ name: '0', color: null }, { name: '1', color: 'blue' }, { name: '2', color: 'teal' }, { name: '3', color: 'gold' }],
    wrap: false, neighborhood: 'vonneumann',
    setup: (M, r) => { M.grid.fill(0); M.data.sizes = []; if (p.fill != null) for (let k = 0; k < M.N; k++) M.grid[k] = r.int(0, 3); },
    step: (M, r) => {
      const g = M.grid, k0 = p.drop === 'random' ? r.int(0, M.N - 1) : ((M.h / 2) | 0) * M.w + ((M.w / 2) | 0), st = [k0]; let size = 0;
      const h = new Int32Array(g); h[k0]++;
      while (st.length) { const k = st.pop(); while (h[k] >= 4) { h[k] -= 4; size++; for (const q of M.neighbors(k)) { h[q]++; if (h[q] >= 4) st.push(q); } } }
      for (let k = 0; k < M.N; k++) g[k] = h[k]; M.data.last = size; if (size) M.data.sizes.push(size);
    },
    stats: (M) => { let s = 0; for (let k = 0; k < M.N; k++) s += M.grid[k]; return { height: s / M.N, avalanche: M.data.last || 0 }; },
  }),
  /** Random walkers in a box (diffusion): p.n, p.speed, p.turn (0 = straight, π = uncorrelated), p.collide. Stats: msd. */
  walkers: (p = {}) => ({ agents: p.n ?? 300, box: p.box || [100, 60], radius: p.radius ?? 0.7, speed: p.speed ?? 0.6, turn: p.turn ?? Math.PI, collide: p.collide ?? false, move: 'walk', states: [{ name: 'walker', color: p.color || 'accent' }], stats: (M) => ({ msd: M.msd() }), walls: p.walls || 'reflect' }),
  /** Hard-disc gas (ballistic motion, elastic collisions). Stats: msd. */
  gas: (p = {}) => ({ agents: p.n ?? 250, box: p.box || [100, 60], radius: p.radius ?? 1, speed: p.speed ?? 0.8, move: 'ballistic', states: [{ name: 'particle', color: p.color || 'accent' }], stats: (M) => ({ msd: M.msd() }) }),
  /** Boids (Reynolds): p.align, p.cohere, p.avoid, p.vision, p.noise. Stats: order (polarisation). */
  boids: (p = {}) => ({ agents: p.n ?? 220, box: p.box || [100, 60], radius: p.radius ?? 0.6, speed: p.speed ?? 0.7, move: 'boids', walls: 'wrap', align: p.align, cohere: p.cohere, avoid: p.avoid, vision: p.vision, noise: p.noise, states: [{ name: 'boid', color: p.color || 'accent' }], stats: (M) => ({ order: M.order() }), heading: true }),
  /** SIR by contact between walkers: p.beta (infection per contact step), p.gamma (recovery per step), p.seeds. */
  contagion: (p = {}) => ({
    agents: p.n ?? 300, box: p.box || [100, 60], radius: p.radius ?? 0.8, speed: p.speed ?? 0.6, move: 'walk', turn: p.turn ?? 0.6, collide: p.collide ?? true,
    states: [{ name: 'S', color: 'blue' }, { name: 'I', color: 'red' }, { name: 'R', color: 'faint' }],
    init: (r, i) => (i < (p.seeds ?? 3) ? 'I' : 'S'), contact: p.contact ?? 2,
    interact: (i, j, M, r) => { const a = M.state[i], b = M.state[j]; if (a + b !== 1 || (a !== 1 && b !== 1)) return; if (r() < val(p.beta ?? 0.3)) { M.state[i] = 1; M.state[j] = 1; } },
    update: (M, r) => { const g = val(p.gamma ?? 0.01); for (let i = 0; i < M.n; i++) if (M.state[i] === 1 && r() < g) M.state[i] = 2; },
    stopWhen: (M) => M.stats.I === 0,
  }),
};

// ================================================================== the kit
class Agents {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.agents(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage; this.spec = spec;
    stage.o.axes = false; stage.o.grid = false; stage.o.equal = true;
    this.m = model(spec); this.grid = this.m instanceof Grid;
    this._img = null; this._ver = -1; this._theme = '';
    const W = this.grid ? this.m.w : this.m.W, H = this.grid ? this.m.h : this.m.H; this.view = [[0, W], [0, H]];
    stage.setView(...this.view);
    if (spec.animate !== false) this._clock();
    if (spec.controls !== false) {
      api.button('Step', () => { this.m.step(); this.onStep?.(this.m); });
      api.button('New run', () => { this.m.reset((this.m.seed * 7919 + 13) % 2147483647); this._lastT = api.t; this.onStep?.(this.m); });
    }
    this.onStep = spec.onStep || null;
    if (this.grid && spec.paint) this._paint(spec.paint);
  }
  get model() { return this.m; }
  get t() { return this.m.t; }
  get stats() { return this.m.stats; }
  get history() { return this.m.history; }
  step(n = 1) { this.m.step(n); this.rt.invalidate(); return this; }
  /** Continue a finished run (e.g. after a slider changed a parameter) and press play. */
  resume() { this.m.done = false; this._lastT = this.api.t; if (this.spec.animate !== false) this.api.play(); return this; }
  reset(seed) { this.m.reset(seed); this.rt.invalidate(); return this; }
  _clock() {
    const api = this.api; this._lastT = 0; let acc = 0;
    api.animate((t) => {
      if (t < this._lastT - 1e-9) { this.m.reset(); acc = 0; this.onStep?.(this.m); } // restart button
      else if (!this.m.done) {
        const still = typeof window !== 'undefined' && window.__vizStill; // screenshots: run all the way to the still time at once
        acc += (t - this._lastT) * val(this.spec.speed ?? 12); let n = Math.min(Math.floor(acc), still ? 1e6 : this.spec.maxPerFrame ?? 400); acc -= Math.floor(acc);
        if (n > 0) { this.m.step(n); this.onStep?.(this.m); } if (this.m.done && api.playing) api.pause();
      }
      this._lastT = t;
    }, { period: null, autoplay: this.spec.autoplay !== false, still: this.spec.still ?? 5 });
  }
  _paint(state) {
    const s = this.s, k = this.m.stateIndex(state === true ? 1 : state);
    s.onDrag((x, y) => { const i = Math.floor(x), j = this.m.h - 1 - Math.floor(y); if (i >= 0 && j >= 0 && i < this.m.w && j < this.m.h) this.m.set(i, j, k); });
  }
  /** Draw the grid (ImageData, one pixel per cell, scaled without smoothing) or the agents (dots, o.heading arrows). */
  draw(o = {}) {
    const s = this.s, m = this.m; s.setView(...this.view);
    if (this.grid) {
      const theme = m.states.map((st) => (st.color ? this.api.color(st.color) : '')).join('|');
      if (!this._img || this._img.width !== m.w || this._img.height !== m.h) { this._img = document.createElement('canvas'); this._img.width = m.w; this._img.height = m.h; this._ver = -1; }
      if (this._ver !== m.version || this._theme !== theme || this._t !== m.t) {
        const cols = m.states.map((st) => (st.color ? [...this.api.rgb(st.color).slice(0, 3), (st.alpha ?? 1) * (o.alpha ?? 1)] : null)), ctx = this._img.getContext('2d'), im = ctx.createImageData(m.w, m.h), d = im.data;
        for (let k = 0; k < m.N; k++) { const c = cols[m.grid[k]]; if (!c) continue; const p = 4 * k; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255 * c[3]; } // state.alpha softens large uniform states
        ctx.putImageData(im, 0, 0); this._ver = m.version; this._theme = theme; this._t = m.t;
      }
      const c = s.ctx, x0 = s.X(0), y0 = s.Y(m.h), w = s.X(m.w) - x0, h = s.Y(0) - y0;
      c.save(); c.fillStyle = this.api.color(o.background || 'panel', o.background ? 0.5 : 0.6); c.fillRect(x0, y0, w, h);
      c.imageSmoothingEnabled = false; c.drawImage(this._img, x0, y0, w, h); c.restore();
      if (o.gridLines && w / m.w > 6) { const pts = []; for (let i = 0; i <= m.w; i++) pts.push([i, 0], [i, m.h], null); for (let j = 0; j <= m.h; j++) pts.push([0, j], [m.w, j], null); s.path(pts, { color: 'grid', width: 0.6 }); }
      s.rect(0, 0, m.w, m.h, { color: 'faint', width: 1 });
    } else {
      s.rect(0, 0, m.W, m.H, { color: 'faint', width: 1, fill: 'panel', fillAlpha: 0.5 });
      const r = Math.max(1.4, m.r * s.scale);
      m.states.forEach((st, k) => {
        const pts = []; for (let i = 0; i < m.n; i++) if (m.state[i] === k) pts.push([m.x[i], m.y[i]]);
        if (o.heading ?? this.spec.heading) { const c = s.ctx; c.save(); c.strokeStyle = this.api.color(st.color || 'accent', 0.55); c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < m.n; i++) if (m.state[i] === k) { const X = s.X(m.x[i]), Y = s.Y(m.y[i]), sp = Math.hypot(m.vx[i], m.vy[i]) || 1, ux = m.vx[i] / sp, uy = -m.vy[i] / sp; c.moveTo(X - ux * r * 4, Y - uy * r * 4); c.lineTo(X, Y); } c.stroke(); c.restore(); }
        s.dots(pts, { r, color: st.color || 'accent' });
      });
    }
    return this;
  }
  /**
   * Time series of recorded statistics on another stage (create it with axes: 'box'): o.series = names (default: every
   * state with a colour), o.colors = {name: colour}, o.window = steps shown (default: all), o.y = [lo, hi] (default [0, 1]).
   */
  plot(stage, o = {}) {
    const m = this.m, H = m.history, names = o.series || m.states.filter((st) => st.color).map((st) => st.name);
    const tN = H.t.length ? H.t[H.t.length - 1] : 0, win = o.window ?? Math.max(o.minWindow ?? 50, tN), t0 = Math.max(0, tN - win);
    let [lo, hi] = Array.isArray(o.y) ? o.y : [-0.04, 1.04];
    if (o.y === 'auto') { lo = Infinity; hi = -Infinity; for (const n of names) for (const v of H[n] || []) { lo = Math.min(lo, v); hi = Math.max(hi, v); } if (!(hi > lo)) { lo = 0; hi = 1; } const pad = (hi - lo) * 0.08; lo = Math.min(0, lo - pad); hi += pad; }
    stage.setView([t0, t0 + win], [lo, hi]);
    const colOf = (n) => o.colors?.[n] || m.states.find((st) => st.name === n)?.color || ['accent', 'orange', 'green', 'purple'][names.indexOf(n) % 4];
    const ends = [];
    for (const n of names) {
      const ys = H[n]; if (!ys) continue; const pts = []; for (let i = 0; i < ys.length; i++) if (H.t[i] >= t0) pts.push([H.t[i], ys[i]]);
      const col = colOf(n); stage.path(pts, { color: col, width: o.width ?? 2 }); if (pts.length) ends.push([pts[pts.length - 1], n, col]);
    }
    if (o.labels !== false) { // end labels, nudged apart vertically
      ends.sort((a, b) => b[0][1] - a[0][1]); let last = -1e9;
      for (const [p, n, col] of ends) { let Y = clamp(stage.Y(p[1]), 10, stage.height - 26); if (Y < last + 13) Y = last + 13; last = Y; stage.textPx(o.names?.[n] ?? n, Math.min(stage.X(p[0]) + 5, stage.width - 6), Y, { color: col, size: 11.5, weight: 600, align: stage.X(p[0]) + 5 > stage.width - 40 ? 'right' : 'left', dy: stage.X(p[0]) + 5 > stage.width - 40 ? -9 : 0 }); }
    }
    return this;
  }
}

export default function agents(api, rt, stage, spec) { return new Agents(api, rt, stage, spec); }
Object.assign(agents, { model, AUTOMATA, lifeRule, schellingStats });
/** v.automata(name, params) → a spec for v.agents (spread it and add size, seed, speed…); v.automata() → the preset table. */
export function automata(api, rt, name, params) {
  if (name == null) return AUTOMATA;
  const f = AUTOMATA[name]; if (!f) throw new Error(`v.automata: unknown model "${name}" (${Object.keys(AUTOMATA).join(', ')})`);
  return f(params);
}
