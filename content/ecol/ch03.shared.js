// Ecology — Chapter 3: helpers for the metapopulation items (plain functions, no data files).
export * from './ch02.shared.js';

/** Solution of dp/dt = r p - c p^2 (Bernoulli): the Levins model with r = c(1-D) - e. */
export function logP(c, r, p0, t) {
  if (!(p0 > 0)) return 0;
  const y0 = 1 / p0;
  const y = Math.abs(r) < 1e-9 ? y0 + c * t : (y0 - c / r) * Math.exp(-r * t) + c / r;
  return y > 0 ? 1 / y : 0;
}

/**
 * One stochastic run of the patch-count Levins chain (all patches equally reachable).
 * N patches, a fraction D(t) of them destroyed (random patches, occupied or not), colonization c·p per empty suitable patch,
 * extinction e·exp(-k p) per occupied patch (k > 0 is a rescue effect), propagule rain eps per empty patch.
 * Returns the occupied fraction of ALL N patches at every step 0..T/dt.
 */
export function metaSeries(r, o) {
  const { N, c, e, T, dt } = o, k = o.k || 0, eps = o.eps || 0, Dfn = o.D || (() => 0);
  const steps = Math.round(T / dt), out = new Float32Array(steps + 1);
  let Ns = Math.round(N * (1 - Dfn(0))), n = Math.min(Ns, Math.round(o.p0 * N));
  out[0] = n / N;
  for (let s = 1; s <= steps; s++) {
    const t = s * dt, Nn = Math.round(N * (1 - Dfn(t)));
    if (Nn < Ns) { let keep = 0; for (let i = 0; i < n; i++) if (r() < Nn / Ns) keep++; n = keep; }
    Ns = Nn;
    const p = n / N, pe = 1 - Math.exp(-e * Math.exp(-k * p) * dt), pc = 1 - Math.exp(-(c * p + eps) * dt);
    let ext = 0, col = 0;
    for (let i = 0; i < n; i++) if (r() < pe) ext++;
    for (let i = 0; i < Ns - n; i++) if (r() < pc) col++;
    n += col - ext;
    out[s] = n / N;
  }
  return out;
}

/** Spatial grid state for the Levins pictures: L×L patches, optional destroyed mask, global or 8-neighbour dispersal, rescue k. */
export function gridInit(L, rng, p0, ok) {
  const n = L * L, occ = new Uint8Array(n), flash = new Uint8Array(n);
  for (let i = 0; i < n; i++) occ[i] = (!ok || ok[i]) && rng() < p0 ? 1 : 0;
  return { L, occ, flash, rng, ok: ok || null, t: 0, rescued: 0 };
}
export function gridFrac(st) { let s = 0; for (let i = 0; i < st.occ.length; i++) s += st.occ[i]; return s / st.occ.length; }
export function gridStep(st, dt, c, e, o = {}) {
  const { L, occ, rng, ok } = st, n = L * L, k = o.k || 0, local = !!o.local;
  const f = gridFrac(st), pe = 1 - Math.exp(-e * dt), keepProb = Math.exp(-k * f);
  const next = new Uint8Array(n);
  st.flash.fill(0); st.rescued = 0;
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x;
    if (ok && !ok[i]) continue;
    if (occ[i]) {
      if (rng() < pe) {
        if (k > 0 && rng() > keepProb) { next[i] = 1; st.flash[i] = 1; st.rescued++; } // an extinction cancelled by immigration
      } else next[i] = 1;
    } else {
      let q = f;
      if (local) {
        let m = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) m += occ[((y + dy + L) % L) * L + ((x + dx + L) % L)];
        q = m / 8;
      }
      if (rng() < 1 - Math.exp(-c * q * dt)) next[i] = 1;
    }
  }
  st.occ = next; st.t += dt;
}

/** Draw the grid on an equal-aspect stage with x, y in [0, L]. */
export function drawGrid(s, st, o = {}) {
  const { L, occ, ok, flash } = st;
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x;
    if (ok && !ok[i]) { s.rect(x + 0.08, L - y - 0.92, x + 0.92, L - y - 0.08, { fill: 'muted', fillAlpha: 0.35, stroke: false }); continue; }
    if (flash[i]) s.rect(x + 0.05, L - y - 0.95, x + 0.95, L - y - 0.05, { fill: 'gold', fillAlpha: 0.95, stroke: false });
    else if (occ[i]) s.rect(x + 0.05, L - y - 0.95, x + 0.95, L - y - 0.05, { fill: o.color || 'accent', fillAlpha: 0.9, stroke: false });
    else s.rect(x + 0.1, L - y - 0.9, x + 0.9, L - y - 0.1, { fill: 'faint', fillAlpha: 0.12, stroke: false });
  }
}

/** Real roots of F on (0,1) with their stability (F' < 0 means stable). */
export function roots01(F, n = 600) {
  const out = [];
  let a = 1e-6, fa = F(a);
  for (let i = 1; i <= n; i++) {
    const b = 1e-6 + ((1 - 2e-6) * i) / n, fb = F(b);
    if (fa === 0 || fa * fb < 0) {
      let lo = a, hi = b, flo = fa;
      for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2, fm = F(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
      out.push({ p: (lo + hi) / 2, stable: fb < fa });
    }
    a = b; fa = fb;
  }
  return out;
}
