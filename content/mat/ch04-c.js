// Materials Science — Chapter 4, part c: items 4.9–4.11 (precipitation hardening and Orowan bypass, annealing of cold-worked metal, hardness testing)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ── precipitation hardening model (4.9) ───────────────────────────────────────────────────────────────────────────────
const G_AL = 26e9, B_AL = 0.286e-9, M_TAYLOR = 3.06, SIG_MATRIX = 60;
/** Orowan stress increment (MPa, tensile): tau = G b / lambda, lambda the surface-to-surface spacing on the slip plane. */
function orowan(r_nm, f) {
  const lam = r_nm * (Math.sqrt((2 * Math.PI) / (3 * f)) - 2);
  return lam > 0.5 * r_nm ? (M_TAYLOR * G_AL * B_AL) / (lam * 1e-9) / 1e6 : Infinity;
}
/** Shearing increment (MPa, tensile): proportional to sqrt(r f); the constant is fixed so that it crosses the Orowan curve at r_c for f = 3 %. */
function shearing(r_nm, f, rc) {
  const A = orowan(rc, 0.03) / Math.sqrt(rc * 0.03);
  return A * Math.sqrt(r_nm * f);
}
/** Coarsening: r^3 = r0^3 + K(T) t (Lifshitz–Slyozov–Wagner), K calibrated to reach 6 nm in 10 h at 190 C, with activation energy Q. */
function radiusAt(tH, TC, Q) {
  const r0 = 1.2, Kref = (Math.pow(6, 3) - r0 ** 3) / 10, kB = 8.617333e-5;
  const K = Kref * Math.exp((-Q / kB) * (1 / (TC + 273.15) - 1 / 463.15));
  return Math.cbrt(r0 ** 3 + K * tH);
}

// ── Potts model of annealing (4.10) ───────────────────────────────────────────────────────────────────────────────────
const NBX = [-1, 0, 1, -1, 1, -1, 0, 1], NBY = [-1, -1, -1, 0, 0, 1, 1, 1];
function mcInit(N, nuc, seed, v) {
  const r = v.rng(seed), o = new Int32Array(N * N), f = new Uint8Array(N * N), nGr = 52, sx = [], sy = [];
  for (let k = 0; k < nGr; k++) { sx.push(r() * N); sy.push(r() * N); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let b = 1e9, bi = 0;
    for (let k = 0; k < nGr; k++) { let dx = Math.abs(x - sx[k]); dx = Math.min(dx, N - dx); let dy = Math.abs(y - sy[k]); dy = Math.min(dy, N - dy); const d = (dx / 1.7) ** 2 + (dy * 1.7) ** 2; if (d < b) { b = d; bi = k; } }
    o[y * N + x] = bi + 1; f[y * N + x] = 1;
  }
  let id = nGr + 1;
  for (let k = 0; k < nuc; k++) {
    const cx = Math.floor(r() * N), cy = Math.floor(r() * N);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (Math.abs(dx) + Math.abs(dy) > 1) continue; const i = ((cy + dy + N) % N) * N + ((cx + dx + N) % N); o[i] = id; f[i] = 0; }
    id++;
  }
  const st = { N, o, f, r, t: 0, hist: [] }; const q = mcStats(st); st.hist.push({t:0,fx:1-q.fdef,ng:q.ng}); return st;
}
function mcSweep(S, Es) {
  const { N, o, f, r } = S, NN = N * N;
  for (let n = 0; n < NN; n++) {
    const i = Math.floor(r() * NN), x = i % N, y = (i - x) / N, k = Math.floor(r() * 8);
    const j = ((y + NBY[k] + N) % N) * N + ((x + NBX[k] + N) % N);
    if (o[j] === o[i]) continue;
    let before = 0, after = 0; const oi = o[i], oj = o[j];
    for (let q = 0; q < 8; q++) { const val = o[((y + NBY[q] + N) % N) * N + ((x + NBX[q] + N) % N)]; if (val !== oi) before++; if (val !== oj) after++; }
    if (after - before + Es * (f[j] - f[i]) <= 0) { o[i] = oj; f[i] = f[j]; }
  }
  S.t++;
}
function mcStats(S) {
  const { N, o, f } = S; let fd = 0; for (let i = 0; i < N * N; i++) fd += f[i];
  const seen = new Uint8Array(N * N), st = []; let ng = 0;
  for (let i = 0; i < N * N; i++) {
    if (seen[i]) continue; ng++; seen[i] = 1; st.push(i);
    while (st.length) { const p = st.pop(), x = p % N, y = (p - x) / N; for (let q = 0; q < 4; q++) { const nx = (x + (q === 0) - (q === 1) + N) % N, ny = (y + (q === 2) - (q === 3) + N) % N, w = ny * N + nx; if (!seen[w] && o[w] === o[p]) { seen[w] = 1; st.push(w); } } }
  }
  return { fdef: fd / (N * N), ng };
}

export default {
  collection: 'mat',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Precipitation hardening and Orowan bypass',
      statement: String.raw`A supersaturated alloy aged at a moderate temperature precipitates fine second-phase particles of volume fraction $f$ and radius $r$ that grow with time. A gliding dislocation either **shears** a particle, at a stress that rises as $\Delta\tau_{\rm sh}\propto\sqrt{rf}$ (more interface area and more resistance to cutting for larger particles), or **bypasses** it by bowing between particles and leaving a loop around each (the **Orowan mechanism**), at the stress $$\Delta\tau_{\rm Or}\approx\frac{Gb}{\lambda},\qquad \lambda\approx r\Big(\sqrt{\tfrac{2\pi}{3f}}-2\Big),$$ which falls as particles coarsen and spread apart. The softer mechanism operates, so the strength increment is $\min(\Delta\tau_{\rm sh},\Delta\tau_{\rm Or})$: it rises while the particles are sheared, **peaks** where the two curves cross, and falls with further aging (**overaging**).`,
      idea: String.raw`At fixed $f$, both curves depend on $r$ in opposite directions: cutting gets harder as $r$ grows, bypass gets easier because the gaps $\lambda$ widen and the bowing stress $Gb/\lambda$ (the Frank–Read estimate, 3.7, with line tension $\tfrac12Gb^2$) drops. A dislocation takes whichever is easier, so the strength is the lower envelope with a maximum at the crossing radius $r_c$, a few nanometres in Al–Cu alloys. Aging time enters through coarsening: the Lifshitz–Slyozov–Wagner law $r^3-r_0^3=K(T)\,t$, whose rate $K$ is thermally activated, so aging at a higher temperature reaches the peak sooner and peaks lower if $f$ is smaller. Adding the Taylor factor turns the shear-stress increment into a tensile one (3.8).`,
      caption: String.raw`Drag the handle along the aging curve (or the time slider) to age the alloy. Top: a row of particles on the slip plane and the dislocation passing it: small particles are sheared (the two halves offset by $b$), large ones are bypassed and left with loops. Bottom: strength increment against aging time for shearing (blue), Orowan bypass (red) and the actual envelope (black), and the particle radius from coarsening. Raise the temperature to move the peak earlier, or lower $f$ to see the peak drop and shift.`,
      deps: ['mat-3.6', 'mat-4.8'],
      refs: ['Callister §11.10', 'Porter–Easterling ch. 5'],
      tags: ['age hardening', 'precipitates', 'Orowan'],
      credit: 'A. Wilm, 1906 (age hardening of Al alloys); A. Guinier and G. D. Preston, 1938 (G.P. zones); E. Orowan, 1948 (bypass mechanism); I. M. Lifshitz and V. V. Slyozov, and C. Wagner, 1961 (coarsening)',
      scope: String.raw`A schematic model: $G=26$ GPa, $b=0.286$ nm (aluminium), Taylor factor 3.06 and a matrix strength of 60 MPa; spherical particles on a regular array; the coarsening rate is calibrated so that $r=6$ nm after 10 h at 190 °C with activation energy $Q$ (a model value), and the shearing constant is fixed by putting the crossover at $r_c$ for $f=3\%$. Real Al–Cu alloys pass through $\mathrm{GP}\to\theta''\to\theta'\to\theta$ with changing shape, coherency and fraction, none of which is modelled, so absolute strengths are illustrative.`,
      verify: true,
      viz(v) {
        const fS = v.slider('volume fraction $f$ (%)', 1, 8, 3, { step: 0.1 });
        const TS = v.slider('aging temperature (°C)', 150, 240, 190, { step: 1 });
        const rcS = v.slider('shearing → bypass radius $r_c$ (nm, at $f=3\\,\\%$)', 3, 12, 6, { step: 0.5 });
        const QS = v.slider('activation energy $Q$ (eV)', 0.8, 1.6, 1.2, { step: 0.05 });
        const tS = v.slider('aging time (h)', 0.01, 10000, 10, { log: true, decimals: 2 });
        const A = v.stage({ x: [-10, 90], y: [-30, 30], equal: true, axes: false, height: 230, full: true, title: 'a dislocation meets a row of particles on its slip plane' });
        const B = v.stage({ x: [0.01, 10000], y: [0, 700], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: 'aging time (h)', ylabel: 'yield strength (MPa)', title: 'strength against aging time' });
        const C = v.stage({ x: [0.01, 10000], y: [0, 60], xlog: true, axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 250, xlabel: 'aging time (h)', ylabel: 'particle radius $r$ (nm)', title: 'coarsening' });
        const curve = (t) => {
          const f = fS.value / 100, r = radiusAt(t, TS.value, QS.value), sh = shearing(r, f, rcS.value), orr = orowan(r, f);
          return { r, sh, orr, s: SIG_MATRIX + Math.min(sh, orr) };
        };
        const hB = B.handle(10, 300, { color: 'accent', r: 8, constrain: (x) => { const tt = clamp(x, 0.01, 1e4); return [tt, curve(tt).s]; } });
        hB.onDrag = () => tS.set(clamp(hB.x, 0.01, 1e4));
        let info = null;
        v.render(() => {
          const f = fS.value / 100, t = tS.value, cur = curve(t);
          // peak
          let pk = { s: 0, t: 0 };
          for (let k = 0; k <= 300; k++) { const tt = 0.01 * Math.pow(1e6, k / 300), c = curve(tt); if (c.s > pk.s) pk = { s: c.s, t: tt, r: c.r }; }
          B.setView([0.01, 10000], [0, Math.max(300, pk.s * 1.2)]);
          B.fn((x) => SIG_MATRIX + shearing(radiusAt(x, TS.value, QS.value), f, rcS.value), { domain: [0.01, 10000], color: 'accent', width: 1.8, dash: true, alpha: 0.7 });
          B.fn((x) => SIG_MATRIX + orowan(radiusAt(x, TS.value, QS.value), f), { domain: [0.01, 10000], color: 'red', width: 1.8, dash: true, alpha: 0.7 });
          B.fn((x) => curve(x).s, { domain: [0.01, 10000], color: 'ink', width: 3 });
          B.vline(pk.t, { color: 'green', dash: true, alpha: 0.7 }); B.text('peak', pk.t * 1.08, pk.s * 0.12, { color: 'green', size: 12, align: 'left' });
          B.text('under-aged: sheared', 0.02, pk.s * 1.12, { color: 'accent', size: 11.5, align: 'left' });
          B.text('over-aged: bypassed', 9000, pk.s * 1.12, { color: 'red', size: 11.5, align: 'right' });
          hB.set(t, cur.s);
          C.setView([0.01, 10000], [0, Math.max(60, radiusAt(10000, TS.value, QS.value) * 1.08)]);
          C.fn((x) => radiusAt(x, TS.value, QS.value), { domain: [0.01, 10000], color: 'orange', width: 2.6 });
          const rc = (() => { let lo = 0.01, hi = 1e4; const g = (x) => shearing(radiusAt(x, TS.value, QS.value), f, rcS.value) - orowan(radiusAt(x, TS.value, QS.value), f); for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (g(m) < 0) lo = m; else hi = m; } return Math.sqrt(lo * hi); })();
          C.vline(pk.t, { color: 'green', dash: true, alpha: 0.7 }); C.vline(t, { color: 'accent', alpha: 0.4, dash: true });
          C.dot(t, cur.r, { r: 6, color: 'accent', fill: 'accent' });
          // picture: row of particles, centre spacing Lc, radius r
          const r = cur.r, Lc = r * Math.sqrt((2 * Math.PI) / (3 * f)), lam = Lc - 2 * r, sheared = cur.sh < cur.orr;
          const x0 = -Lc * 0.6, x1 = Lc * 3.6, span = x1 - x0, hh = span * 0.3;
          A.setView([x0, x1], [-hh, hh]);
          A.line(x0, 0, x1, 0, { color: 'faint', dash: true, alpha: 0.5 });
          const b = Math.max(0.12 * r, 0.04 * Lc);
          for (let k = 0; k < 4; k++) {
            const cx = k * Lc + Lc / 2 * 0 + Lc * 0.2;
            if (sheared) {
              A.circle(cx, 0, r, { fill: 'purple', fillAlpha: 0.35, color: 'purple', width: 1.5 });
              A.circle(cx, b, r, { fill: 'purple', fillAlpha: 0.0, color: 'purple', width: 1.5, dash: true });
            } else {
              A.circle(cx, 0, r, { fill: 'purple', fillAlpha: 0.35, color: 'purple', width: 1.5 });
              A.circle(cx, 0, r * 1.5, { color: 'orange', width: 2, alpha: 0.9 });
            }
          }
          // dislocation line: straight through particles when sheared, bowed arcs between particles when bypassed
          const pts = [];
          if (sheared) { A.line(x0, -0.3 * Lc, x1, -0.3 * Lc, { color: 'accent', width: 3 }); A.text('shears the particles: offsets exaggerated (not to scale)', x0 + 0.1 * span, -0.5 * Lc, { color: 'accent', size: 12, align: 'left' }); }
          else {
            for (let k = -1; k < 4; k++) {
              const ca = k * Lc + Lc * 0.2 + r, cb = (k + 1) * Lc + Lc * 0.2 - r, mid = (ca + cb) / 2, R = Math.max((cb - ca) / 2, 1e-3);
              A.curve((q) => [mid + R * Math.cos(q), R * Math.sin(q) * 0.999 + 0], Math.PI, 0, { n: 30, color: 'accent', width: 3 });
            }
            A.text('bows between particles, leaves loops around them', x0 + 0.1 * span, -0.5 * Lc, { color: 'accent', size: 12, align: 'left' });
          }
          A.text(`$r=${r.toFixed(1)}$ nm,  $\\lambda=${Math.max(lam, 0).toFixed(0)}$ nm`, x1 - 0.02 * span, hh * 0.85, { color: 'muted', size: 12, align: 'right' });
          info = { cur, pk, rc, sheared, f, lam };
        });
        v.legend([['accent', 'shearing', { dash: true }], ['red', 'Orowan bypass', { dash: true }], ['ink', 'strength = matrix + the softer increment'], ['green', 'peak', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { cur, pk, sheared } = info;
          return `$t=${v.fmt(tS.value, 3)}$ h at ${TS.value} °C: $r=${v.fix(cur.r, 1)}$ nm, shearing $+${v.fix(cur.sh, 0)}$ MPa, Orowan $+${v.fix(Number.isFinite(cur.orr) ? cur.orr : 9999, 0)}$ MPa → strength ${v.fix(cur.s, 0)} MPa by ${sheared ? 'shearing (under-aged)' : 'bypass (over-aged)'}.\nPeak ${v.fix(pk.s, 0)} MPa at $t^*=${v.fmt(pk.t, 3)}$ h, $r^*=${v.fix(pk.r, 1)}$ nm. Aged 100 times longer than $t^*$ the alloy has lost ${v.fix(pk.s - curve(pk.t * 100).s, 0)} MPa.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Recovery, recrystallization and grain growth',
      statement: String.raw`Cold work stores energy in a metal as dislocations (the energy density grows like the dislocation density $\rho$, 3.8). Heating it releases that energy in three overlapping stages. **Recovery**: point defects annihilate and dislocations rearrange into low-energy arrays; the strength falls only a little, the coarse grain structure is largely retained. **Recrystallization**: new strain-free grains nucleate and their boundaries sweep through the deformed metal, driven by the stored energy; the dislocation density drops by orders of magnitude and the strength falls to its annealed value. **Grain growth**: with the stored energy gone, the boundary energy drives the strain-free grains to coarsen, and ideal normal grain growth with constant boundary mobility and energy, without pinning, gives $d^2-d_0^2=kt$ (Burke and Turnbull).`,
      idea: String.raw`Each stage has its own driving force and its own kinetics. Recrystallization trades stored energy $E_s$ per volume for boundary energy: a nucleus grows into the deformed matrix wherever the energy released by consuming strained metal outweighs the curvature cost of the boundary, so it has a threshold stored energy (a sluggish or heavily recovered metal never recrystallizes). The stored energy also feeds the hardness through Taylor's $\sigma\propto\sqrt\rho$ (3.8), so the hardness falls in proportion to the square root of the unrecrystallized, unrecovered fraction. Grain growth after recrystallization is pure curvature-driven boundary motion, which a lattice Monte Carlo (Potts) model with an energy for every unlike neighbour pair reproduces. Temperature enters through the Arrhenius law (2.7) for the rates, represented here by running the clock faster.`,
      caption: String.raw`Press play: a 96×96 patch of cold-worked metal (elongated deformed grains, grey) with strain-free nuclei (coloured) grows by a Monte Carlo grain-boundary model. Right: the recrystallized fraction (green), the relative hardness (blue), the remaining stored energy (orange), and the mean area of all connected grains, including the deformed grains before recrystallization. Lower the stored energy or switch on recovery and the nuclei stop growing: recrystallization has a threshold. Change the nuclei count and watch the final grain size.`,
      deps: ['mat-3.8', 'mat-2.7', 'thermo-4.10'],
      refs: ['Bhadeshia, Metals and Alloys, Lectures6–7 pp37–45; NPTEL Physical Metallurgy, PartVII module2 normal-grain-growth kinetics'],
      tags: ['annealing', 'recrystallization', 'grain growth'],
      credit: 'J. E. Burke and D. Turnbull, 1952 (review of recrystallization and grain growth); M. P. Anderson, D. J. Srolovitz, G. S. Grest and P. S. Sahni, 1984 (Monte Carlo grain growth)',
      scope: String.raw`A two-dimensional $Q$-state Potts model at zero temperature with eight-neighbour boundary energy 1 per unlike pair, periodic edges, and a stored energy $E_s$ (in the same units) for each deformed site; it illustrates the qualitative sequence, with possible grid pinning; it does not guarantee a $\sqrt t$ law or predict absolute times or sizes (a Monte Carlo step is not a second). The recovery law $E_s(t)=E_s(0)\,[\,0.4+0.6e^{-t/40}\,]$ and the hardness range (60 to 140 HV, copper-like) are assumptions of the illustration.`,
      viz(v) {
        const N = 96;
        let S;
        const reset = () => { S.reset(); };
        const EsS = v.slider('stored energy $E_s$ (per site)', 0.4, 3, 1.5, { step: 0.05, onChange: reset });
        const nucS = v.slider('number of nuclei', 0, 300, 120, { step: 1, int: true, onChange: reset });
        const recT = v.toggle('recovery acts first', false, { onChange: reset });
        const seedS = v.slider('random seed', 1, 40, 5, { step: 1, int: true, onChange: reset });
        const DT = 1 / 30;
        const R = (t) => (recT.value ? 0.4 + 0.6 * Math.exp(-t / 40) : 1);
        S = v.sim(() => mcInit(N, nucS.value, seedS.value, v), (st) => {
          mcSweep(st, EsS.value * R(st.t));
          if (st.t % 4 === 0) { const q = mcStats(st); st.hist.push({ t: st.t, fx: 1 - q.fdef, ng: q.ng }); }
        }, { dt: DT, maxSteps: 400 });
        const A = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 380, weight: 1.05, title: 'microstructure (strain-free = bright, deformed = grey)' });
        const B = v.stage({ x: [0, 720], y: [0, 1.05], axes: 'box', gutter: true, height: 380, weight: 1.15, xlabel: 'Monte Carlo steps ("annealing time")', ylabel: 'relative', title: 'what annealing does' });
        const C = v.stage({ x: [0, 720], y: [0, 400], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'Monte Carlo steps', ylabel: 'mean grain area (sites)', title: 'mean grain area' });
        const names = ['accent', 'orange', 'green', 'teal', 'purple', 'pink', 'gold'];
        const base = names.map((n) => v.rgb(n)), grey = v.rgb('muted'), pan = v.rgb('panel');
        let info = null, lastKey = '';
        v.animate((t) => {
          S.advance(t);
          const st = S.state, o = st.o, f = st.f;
          A.raster((x, y) => {
            const i = Math.floor(y), j = Math.floor(x); if (i < 0 || j < 0 || i >= N || j >= N) return null;
            const p = i * N + j, id = o[p];
            let c = base[(id * 5 + (id >> 3)) % names.length];
            const shade = 0.82 + 0.18 * (((id * 2654435761) >>> 0) / 4294967296);
            let col;
            if (f[p]) col = [grey[0] * 0.55 + pan[0] * 0.45, grey[1] * 0.55 + pan[1] * 0.45, grey[2] * 0.55 + pan[2] * 0.45].map((q) => q * (0.85 + 0.3 * (((id * 40503) % 97) / 97) * 0.5));
            else col = [c[0] * shade, c[1] * shade, c[2] * shade];
            const edge = o[i * N + ((j + 1) % N)] !== id || o[((i + 1) % N) * N + j] !== id;
            if (edge) col = col.map((q, k) => q * 0.42 + (v.rgb('ink')[k]) * 0.1);
            return [col[0], col[1], col[2], 255];
          }, { res: 3, key: `${st.t}|${seedS.value}|${nucS.value}|${EsS.value}|${recT.value}` });
          // plots
          const h = st.hist, Hm = (p) => 0;
          const tmax = Math.max(720, st.t + 20);
          B.setView([0, 720], [0, 1.05]); C.setView([0, 720], [0, Math.max(100, ...h.filter(p => p.ng > 0).map((p) => (N * N) / p.ng)) * 1.1]);
          const rel = h.map((p) => ({ t: p.t, fx: p.fx, rho: Math.sqrt((1 - p.fx) * R(p.t)), er: R(p.t) * (1 - p.fx) }));
          B.path(rel.map((p) => [p.t, p.fx]), { color: 'green', width: 2.6 });
          B.path(rel.map((p) => [p.t, p.rho]), { color: 'accent', width: 2.6 });
          B.path(rel.map((p) => [p.t, p.er]), { color: 'orange', width: 2.2, dash: true });
          const last = h[h.length - 1] || { fx: 0, ng: 0, t: 0 };
          C.path(h.filter(p => p.ng > 0).map((p) => [p.t, (N * N) / p.ng]), { color: 'purple', width: 2.4 });
          // power-law exponent of the mean diameter after recrystallization (fx > 0.98)
          const post = h.filter((p) => p.fx > 0.98 && p.t > 0);
          let nExp = NaN;
          if (post.length > 12 && post[post.length - 1].ng >= 8) { const a = post[Math.floor(post.length * 0.3)].t; const pp = post.filter((p) => p.t >= a); if (pp.length > 6) nExp = v.M.linreg(pp.map((p) => Math.log(p.t)), pp.map((p) => 0.5 * Math.log((N * N) / p.ng))).slope; }
          info = { st, last, nExp, Es: EsS.value * R(st.t), hard: 60 + 80 * Math.sqrt((1 - last.fx) * R(st.t)) };
        }, { period: 24, still: 20 });
        v.legend([['green', 'recrystallized fraction'], ['accent', 'relative hardness $\\sqrt{\\rho}$'], ['orange', 'stored energy remaining', { dash: true }], ['purple', 'mean grain area']]);
        v.readout(() => {
          if (!info) return '';
          const { st, last, nExp, Es, hard } = info;
          return `Step ${st.t}: ${v.fix(last.fx * 100, 0)} % recrystallized, hardness ≈ ${v.fix(hard, 0)} HV (60 annealed, 140 cold-worked), stored energy per deformed site ${v.fix(Es, 2)}, ${last.ng} grains of mean area ${last.ng ? v.fix((N * N) / last.ng, 0) : 'undefined'} sites.\n${Number.isFinite(nExp) ? `After recrystallization the fitted growth exponent of the mean diameter is $${v.fix(nExp, 2)}$ in this run (Burke–Turnbull's ideal is $1/2$)${nExp < 0.25 ? ': growth has nearly stalled, because at zero temperature the boundaries of a small lattice pin on the grid, a known artifact of the Potts model' : ''}.` : last.fx < 0.02 && st.t > 200 ? 'The nuclei have not grown: the stored energy is below the threshold set by boundary curvature.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Method',
      name: 'Hardness testing and Tabor’s relation',
      statement: String.raw`Hardness is the resistance to permanent indentation, measured by pressing a hard indenter into the surface under a load $P$ and measuring the impression. **Brinell** (ball of diameter $D$, chordal impression diameter $d$): $\mathrm{HB}=\dfrac{2P}{\pi D\big(D-\sqrt{D^2-d^2}\big)}$. **Vickers** (136° diamond pyramid, mean diagonal $d$): $\mathrm{HV}=1.854\,P/d^2$. **Rockwell** reads the permanent *depth difference* $h$ between preliminary-load readings before and after the major-load cycle of a cone or ball on an arbitrary scale ($\mathrm{HRC}=100-h/0.002\,\mathrm{mm}$). **Tabor's relation**: the mean contact pressure (Meyer hardness) of a plastic indentation is about three times the flow stress at a representative strain, $H\approx3\sigma_r$, with $\sigma_r$ read at $\varepsilon_r\approx0.08$ for sharp indenters; so for a metal that does not harden $H\approx3\sigma_y$, and for steels the tensile strength is roughly $3.45\,$HB (in MPa).`,
      idea: String.raw`Under the indenter the metal is constrained by the elastic material around the plastic zone, so it can flow only at a higher stress than in a tensile test: slip-line and cavity-expansion analyses give a constraint factor of about 3, so the average pressure is $p_m\approx3\sigma_r$. The flow stress has to be taken at the strain the indenter imposes, which is roughly $0.2\cot\alpha$ for a cone or pyramid of half-angle $\alpha$ (about 8 % for Vickers) and $0.4\,a/D$ for a ball of contact radius $a$. For a hardening metal $\sigma_r$ exceeds the 0.2 % yield stress by the factor $(\varepsilon_r/0.002)^n$ from Hollomon's law (4.5), which is why $H/\sigma_y$ is above 3 for work-hardened metals. Here the impression size is computed by solving $P=p_m\,A_{\rm proj}$ with that $\sigma_r$.`,
      caption: String.raw`Choose a test and a load; set the material's yield strength $\sigma_{0.2}$ and hardening exponent $n$. Left: the impression seen from above (with its measured size) and in cross-section. Right: $H/\sigma_{0.2}$ against $n$ for this indenter's representative strain: the constraint factor 3 appears only for a metal that does not harden, and the dashed line shows where yours sits. The readout converts the model to HB or HV and compares its tensile strength with $3.45\,$HB. For Rockwell C, set the independently measured depth difference; no HB/HV conversion is inferred.`,
      deps: ['mat-4.3', 'mat-4.5'],
      refs: ['Callister §6.10'],
      tags: ['hardness', 'indentation', 'Tabor'],
      credit: 'J. A. Brinell, 1900 (ball test); R. L. Smith and G. E. Sandland, 1922 (Vickers pyramid); S. P. Rockwell, patent 1914 (depth test); D. Tabor, 1951 (The Hardness of Metals)',
      scope: String.raw`A rigid-plastic indentation model with a constraint factor $C=3$ and the Hollomon flow stress $\sigma=K\varepsilon_p^n$ at the representative strain; elastic recovery, pile-up and sink-in are ignored. Rockwell C is computed only from an independent measured depth difference, not converted from the model HV. Its cone outline is a schematic for the depth increment, not the complete indentation profile. The right-hand cone constraint-factor reference is independent of that depth reading. The $3.45\,$HB rule for the tensile strength is the usual steel correlation quoted in textbooks; it is an empirical rule of thumb, not a theorem.`,
      verify: true,
      viz(v) {
        const test = v.select('test', [{ value: 'brinell', label: 'Brinell (10 mm ball)' }, { value: 'vickers', label: 'Vickers (pyramid)' }, { value: 'rockwell', label: 'Rockwell C (150 kgf)' }], 'vickers', { onChange: (id) => { P.set({ brinell: 3000, vickers: 30, rockwell: 150 }[id]); } });
        const s0S = v.slider('yield strength $\\sigma_{0.2}$ (MPa)', 50, 1800, 250, { step: 5 });
        const nS = v.slider('hardening exponent $n$', 0, 0.5, 0.2, { step: 0.01 });
        const P = v.slider('load $P$ (kgf)', 1, 3000, 30, { log: true, decimals: 0 });
        const hS = v.slider('measured Rockwell depth difference $h$ (mm)', 0.02, 0.16, 0.08, {step:0.001});
        const A = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 280, weight: 1, minWidth: 240, title: 'impression, from above' });
        const B = v.stage({ x: [-1.2, 1.2], y: [-1.1, 0.6], equal: true, axes: false, height: 280, weight: 1, minWidth: 240, title: 'cross-section' });
        const C = v.stage({ x: [0, 0.5], y: [1.5, 5.5], axes: 'box', gutter: true, height: 280, weight: 1, minWidth: 250, xlabel: 'hardening exponent $n$', ylabel: '$H/\\sigma_{0.2}$', title: 'constraint-factor reference' });
        const hC = C.handle(0.2, 3, { color: 'accent', r: 7, constrain: 'x' });
        hC.onDrag = () => nS.set(clamp(hC.x, 0, 0.5));
        const g = 9.80665;
        function solve(tt, s0, n, Pk) {
          const K = s0 * Math.pow(500, n), flow = (e) => K * Math.pow(Math.max(e, 1e-6), n), PN = Pk * g;
          if (tt === 'brinell') {
            const D = 10; let lo = 1e-3, hi = D / 2 - 1e-6;
            const f = (a) => PN / (Math.PI * a * a) - 3 * flow((0.4 * a) / D);
            if (f(hi) > 0) return { sat: true, D, a: hi, pm: PN / (Math.PI * hi * hi) };
            for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
            const a = (lo + hi) / 2, d = 2 * a, HB = (2 * Pk) / (Math.PI * D * (D - Math.sqrt(D * D - d * d)));
            return { D, a, d, pm: PN / (Math.PI * a * a), HB, er: (0.4 * a) / D, h: (D / 2) * (1 - Math.sqrt(1 - (d / D) ** 2)) };
          }
          const er = tt === 'vickers' ? 0.2 / Math.tan((68 * Math.PI) / 180) : 0.2 / Math.tan((60 * Math.PI) / 180);
          const pm = 3 * flow(er), dV = Math.sqrt((2 * PN) / pm), HV = (1.8544 * Pk) / (dV * dV);
          if (tt === 'vickers') return { d: dV, pm, HV, er, h: dV / 7 };
          const hR = hS.value, dR = 2 * hR * Math.tan(Math.PI / 3), HRC = 100 - hR / 0.002;
          return { d: dR, pm, er, h: hR, HRC };
        }
        let info = null;
        v.render(() => {
          const tt = test.value, s0 = s0S.value, n = nS.value, Pk = tt === 'rockwell' ? 150 : P.value;
          P.el.hidden = tt === 'rockwell'; hS.el.hidden = tt !== 'rockwell';
          const r = solve(tt, s0, n, Pk);
          // top view
          const half = tt === 'brinell' ? r.D / 2 * 0.9 : r.d * 1.1;
          A.setView([-half, half], [-half, half]); B.setView([-half * 1.2, half * 1.2], [-half * 1.05, half * 0.45]);
          if (tt === 'brinell') {
            A.circle(0, 0, r.a, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2.5 });
            A.arrow(-r.a, -r.a * 0.15 - half * 0.1, r.a, -r.a * 0.15 - half * 0.1, { both: true, color: 'red', head: 6 });
            A.text(`$d=${r.d.toFixed(2)}$ mm`, 0, -r.a * 0.15 - half * 0.2, { color: 'red', size: 13, plate: true });
          } else if (tt === 'rockwell') { A.circle(0,0,r.d/2,{fill:'accent',fillAlpha:.18,color:'accent'}); A.text('depth increment',0,-r.d*.7,{size:11}); } else {
            const d = r.d / 2; A.poly([[d, 0], [0, d], [-d, 0], [0, -d]], { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2.5 });
            A.arrow(-d, 0, d, 0, { both: true, color: 'red', head: 6 });
            A.text(`$d=${r.d.toFixed(3)}$ mm`, 0, -d * 0.4, { color: 'red', size: 13, plate: true });
          }
          // section: the surface at y = 0 and the impression below; the indenter dashed
          B.hline(0, { color: 'muted' });
          B.rect(-half * 1.2, -half * 1.05, half * 1.2, 0, { fill: 'muted', fillAlpha: 0.08, stroke: false });
          if (tt === 'brinell') {
            const R = r.D / 2, cy = R - r.h;
            B.curve((q) => [R * Math.sin(q), cy - R * Math.cos(q) - 0 * q], -Math.asin(r.a / R), Math.asin(r.a / R), { n: 60, color: 'accent', width: 3 });
            B.curve((q) => [R * Math.sin(q), cy + R * Math.cos(q)], 0, 2 * Math.PI, { n: 90, color: 'faint', dash: true, alpha: 0.6 });
            B.arrow(half * 0.9, 0, half * 0.9, -r.h, { both: true, color: 'red', head: 5 }); B.text(`$h=${r.h.toFixed(2)}$ mm`, 0, -half * 0.55, { color: 'red', size: 12, plate: true });
          } else if (tt === 'vickers') {
            const hw = r.d / 2, depth = r.d / 7;
            B.path([[-hw, 0], [0, -depth], [hw, 0]], { color: 'accent', width: 3 });
            B.arrow(half * 0.95, 0, half * 0.95, -depth, { both: true, color: 'red', head: 5 }); B.text(`$h\\approx d/7=${depth.toFixed(3)}$ mm`, 0, -half * 0.55, { color: 'red', size: 12, plate: true });
          } else {
            const hw = r.h * Math.tan((60 * Math.PI) / 180);
            B.path([[-hw, 0], [0, -r.h], [hw, 0]], { color: 'accent', width: 3 });
            B.arrow(half * 0.95, 0, half * 0.95, -r.h, { both: true, color: 'red', head: 5 }); B.text(`$h=${r.h.toFixed(3)}$ mm`, 0, -half * 0.55, { color: 'red', size: 12, plate: true });
          }
          // H/sigma0.2 against n
          const ratio = (nn) => 3 * Math.pow(500 * r.er, nn);
          C.setView([0, 0.5], [0, Math.max(5.5, ratio(0.5) * 1.05)]);
          C.fn(ratio, { domain: [0, 0.5], color: 'ink', width: 2.6 });
          C.hline(3, { color: 'red', dash: true }); C.text('$H=3\\sigma_{0.2}$ (no hardening)', 0.495, 3.35, { color: 'red', size: 11.5, align: 'right', plate: true });
          hC.set(n, ratio(n));
          const su = s0 * Math.pow(500, n) * Math.pow(n, n) * Math.exp(-n);
          const HBeq = tt === 'brinell' ? r.HB : r.pm / g;
          info = { r, tt, n, s0, su, HBeq, ratio: ratio(n) };
        });
        v.readout(() => {
          if (!info) return '';
          const { r, tt, su, HBeq, ratio: ra } = info;
          if (r.sat) return 'The ball would sink in beyond its equator: lower the load.';
          if(tt === 'rockwell')return `Measured depth difference $h=${v.fix(r.h,3)}$ mm gives $\\mathrm{HRC}=100-h/0.002=${v.fix(r.HRC,1)}$. The preliminary load is 10 kgf and total load 150 kgf. The cone outline and Tabor reference do not infer an HV/HB conversion.`;
          const name = tt === 'brinell' ? `HB $=${v.fix(r.HB, 0)}$` : tt === 'vickers' ? `HV $=${v.fix(r.HV, 0)}$` : `HRC $=${v.fix(r.HRC, 0)}$ (HV $=${v.fix(r.HV, 0)}$)`;
          const comparison = tt === 'brinell' ? `The steel rule of thumb $3.45\\,$HB gives ${v.fix(3.45 * r.HB, 0)} MPa.` : 'The steel HB correlation requires a Brinell measurement; none is inferred from HV.';
          return `Representative strain $\\varepsilon_r=${v.fix(r.er, 3)}$; contact pressure (Meyer hardness) $p_m=3\\sigma_r=${v.fix(r.pm, 0)}$ MPa $=${v.fix(ra, 2)}\\,\\sigma_{0.2}$. ${name}.\nModel tensile strength $Kn^ne^{-n}=${v.fix(su, 0)}$ MPa. ${comparison}`;
        });
      },
    },
  ],
};

export { radiusAt, shearing, orowan, mcInit, mcSweep, mcStats };
