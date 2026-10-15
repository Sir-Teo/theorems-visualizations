// Thermodynamics & Statistical Mechanics — Chapter 2: The second law, engines and entropy
import { clamp, lerp, hsGas, pick, drawGas, simClock, tRamp, R, carnot, segHeat, band, packets, reservoir, device, cylinder, along } from './ch02.shared.js';

// ---------- helpers for this file ----------
/** Rounded "ledger" bar from 0 to val at x (data units), half-width hw. */
/** Running mean over the last k samples of a history of {t, Q, S, …} records. */
const smooth = (h, k = 9) => h.map((p, i) => { const a = Math.max(0, i - k + 1), n = i - a + 1; let Q = 0, S = 0; for (let j = a; j <= i; j++) { Q += h[j].Q; S += h[j].S; } return { t: p.t, Q: Q / n, S: S / n }; });
const bar = (s, x, val, hw, color, o = {}) => s.rect(x - hw, 0, x + hw, val, { fill: color, fillAlpha: o.alpha ?? 0.78, color, width: 1 });
/** Closed axis-aligned ellipse in the P–V plane: centre (Vc, Pc), semi-axes a (L) and b (kPa). */
const ellipse = (Vc, Pc, a, b, n = 720) => Array.from({ length: n + 1 }, (_, i) => { const t = 2 * Math.PI * i / n; return [Vc + a * Math.cos(t), Pc + b * Math.sin(t)]; });
/** State quantities of n mol of ideal gas along a P–V polyline: T, S (relative), cumulative heat and work. */
function walk(pts, f, n = 1) {
  const out = [{ V: pts[0][0], P: pts[0][1], T: pts[0][0] * pts[0][1] / (n * R), S: 0, Q: 0, W: 0 }];
  for (let i = 1; i < pts.length; i++) {
    const [V0, P0] = pts[i - 1], [V1, P1] = pts[i], Vm = (V0 + V1) / 2, Pm = (P0 + P1) / 2, dV = V1 - V0, dP = P1 - P0;
    const dq = (f / 2 + 1) * Pm * dV + f / 2 * Vm * dP, T = V1 * P1 / (n * R), Tm = Vm * Pm / (n * R), o = out[i - 1];
    out.push({ V: V1, P: P1, T, S: o.S + dq / Tm, Q: o.Q + dq, W: o.W + Pm * dV, dq });
  }
  return out;
}

export default {
  collection: 'thermo',
  chapter: 2,
  title: 'The second law, engines and entropy',
  summary: String.raw`Heat flows by itself only from hot to cold, and no cyclic device can turn the heat of a single reservoir wholly into work: the Clausius and Kelvin–Planck statements of the second law, which are equivalent. Carnot's reversible cycle is the most efficient engine between two temperatures, and the universality of its efficiency defines an absolute temperature scale with $\eta = 1 - T_c/T_h$. The Clausius inequality $\oint \delta Q/T \le 0$ turns reversible heat over temperature into a state function, entropy, which never decreases in an isolated system and which Carathéodory showed is forced on us by the mere existence of adiabatically inaccessible states. Real cycles — Otto, Diesel, Stirling, refrigerators and heat pumps — and engines run for power rather than efficiency show how far practice falls from the Carnot limit. The chapter closes with the two founding texts: Carnot's *Réflexions* of 1824 and Clausius's 1865 paper that named entropy. Several pictures are exact simulations of hard-sphere gases whose work and heat are tallied collision by collision.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Law', name: 'Second law: Kelvin–Planck and Clausius statements',
      statement: String.raw`**Kelvin–Planck statement.** No process is possible whose *sole* result is the absorption of heat from a single reservoir and the conversion of all of it into work. Equivalently, a device working in a cycle and exchanging heat with only one reservoir can deliver no net work: $W_{\text{by}} \le 0$ per cycle (it can only turn work into heat).

**Clausius statement.** No process is possible whose *sole* result is the transfer of heat from a colder body to a hotter one. Heat flows of its own accord only from hot to cold; moving it uphill always leaves some other change behind, such as work spent.

The word *sole* matters: an ideal gas expanding isothermally does turn all the heat it absorbs into work, but it ends up expanded, so the process is not a cycle and its result is not only the conversion.`,
      idea: String.raw`Both statements are distilled experience — every attempt to build a "perpetual motion machine of the second kind" (a ship powered by cooling the sea) has failed — and both single out a direction that the first law (1.11) does not: work can always be turned entirely into heat (Joule's paddle wheel, friction), but the reverse is impossible in a cycle. Molecularly, work is ordered motion of a piston, heat the disordered motion of molecules; an engine fed from one bath would have to collect the random kicks of its molecules into a systematic push, and fluctuations average that to nothing or less. The statement is about averages over macroscopic systems: a small gas can deliver a little net work in a single lucky cycle, never on average (5.7).`,
      caption: String.raw`**Kelvin–Planck**: a simulated hard-sphere gas (150 molecules) in a cylinder with a *single* heat bath at $kT = 1$; red walls are in contact with the bath, black walls are insulating. Pick a plan for the piston — slow strokes, a fast expansion that outruns the molecules, insulating the walls during the squeeze or the expansion — and watch the cycles run. The dots are the measured pressure against volume; the bars tally each completed cycle's work delivered by the gas (orange) and heat drawn from the bath. Every plan delivers *negative* net work: the loop runs counter-clockwise and the bath ends up receiving heat. **Clausius**: hot and cold gases share a light, freely jiggling wall that is the only path for energy. Heat always crosses toward the colder side, whatever the wall's mass (which sets only the rate), and the total entropy rises.`,
      deps: ['thermo-1.11'],
      see: ['pchem-3.1', 'thermo-5.7', 'thermo-5.19'],
      refs: ['Kardar §1.4', 'Tong ch. 4'],
      tags: ['second law', 'irreversibility'],
      credit: 'Clausius, 1850 and 1854; W. Thomson (Kelvin), 1851; Planck, 1897',
      scope: String.raw`Holds for macroscopic systems and for averages over many cycles. In systems of a few molecules the work or heat of a single cycle fluctuates and can briefly have the "wrong" sign; fluctuation theorems quantify how rarely, and the averages still obey the law.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Second_law_of_thermodynamics' },
      viz(v) {
        const L = 10, N = 150, X1 = 12, X2 = 30, BATH = [1, 0, 1, 1, 1, 1], INS = [0, 0, 0, 0, 0, 0], SLOW = 0.05, FAST = 1.2, A = L * L;
        const PLANS = {
          slow: { start: X1, strokes: [{ to: X2, U: SLOW, bath: 1, name: 'slow expansion on the bath' }, { to: X1, U: SLOW, bath: 1, name: 'slow compression on the bath' }] },
          fast: { start: X1, strokes: [{ to: X2, U: FAST, bath: 1, name: 'fast expansion (outrunning the molecules)' }, { wait: 40, bath: 1, name: 'resting on the bath' }, { to: X1, U: SLOW, bath: 1, name: 'slow compression on the bath' }] },
          adC: { start: X2, strokes: [{ to: X1, U: SLOW, bath: 0, name: 'insulated compression (gas heats)' }, { wait: 80, bath: 1, name: 'dumping heat into the bath' }, { to: X2, U: SLOW, bath: 1, name: 'slow expansion on the bath' }] },
          adE: { start: X1, strokes: [{ to: X2, U: SLOW, bath: 0, name: 'insulated expansion (gas cools)' }, { wait: 80, bath: 1, name: 'warming on the bath' }, { to: X1, U: SLOW, bath: 1, name: 'slow compression on the bath' }] },
        };
        const mode = v.select('statement', [{ value: 'K', label: 'Kelvin–Planck: one reservoir' }, { value: 'C', label: 'Clausius: hot and cold, no work' }], 'K', { onChange: () => make() });
        const plan = v.select('plan', [{ value: 'slow', label: 'slow out, slow back' }, { value: 'fast', label: 'fast out, slow back' }, { value: 'adC', label: 'insulated squeeze' }, { value: 'adE', label: 'insulated expansion' }], 'adC', { onChange: () => make() });
        const mass = v.slider('wall mass (Clausius)', 1, 30, 4, { log: true, fmt: (x) => v.fix(x, 1) + ' m', onChange: () => make() });
        const TL0 = v.slider('left side starts at kT', 0.3, 2.5, 2, { step: 0.05, fmt: (x) => v.fix(x, 2), onChange: () => make() });
        v.button('Restart', () => make());
        const sc = v.stage({ x: [-1.5, X2 + 4], y: [-2, L + 1.4], equal: true, height: 200, axes: false, full: true });
        const sp = v.stage({ x: [0, 3400], y: [0, 0.3], height: 270, axes: 'box', weight: 1.15 });
        const sl = v.stage({ x: [0, 6], y: [-200, 200], height: 270, axes: 'box', weight: 1 });
        let G, si, tS, dirS, W0, Q0, cycles, pts, last, cyc, hist, Tsum, nsum;
        const kick = { K: 1700, C: 70 };
        const ck = simClock(110, 0.05, 0), cc = simClock(20, 0.05, 0);
        const applyStroke = () => {
          const st = PLANS[plan.value].strokes[si];
          G.thermal = st.bath ? BATH.slice() : INS.slice();
          if (st.wait != null) { G.setU(0); tS = G.t; } else { dirS = Math.sign(st.to - G.pist.X); G.setU(dirS * st.U); }
          last = G.snap(); Tsum = 0; nsum = 0;
        };
        const make = () => {
          const K = mode.value === 'K';
          plan.el.hidden = !K; mass.el.hidden = K; TL0.el.hidden = K;
          if (K) {
            G = hsGas({ species: [{ m: 1, d: 0.6 }], counts: [N], Ly: L, Lz: L, T: 1, rng: v.rng(3), piston: { X: PLANS[plan.value].start }, thermal: BATH, Tb: 1 });
            si = 0; cycles = []; pts = []; cyc = 0; W0 = G.Wp; Q0 = G.Qb; applyStroke(); ck.kick(kick.K);
            sp.setTitle('measured pressure against volume'); sp.setLabels('V (σ³)', 'P (kT/σ³)'); sp.setView([0, 3400], [0, 0.3]);
            sl.setTitle('ledger per completed cycle'); sl.setLabels(null, 'energy (kT)');
          } else {
            G = hsGas({ species: [{ m: 1, d: 0.6 }, { m: 1, d: 0.6 }], counts: [80, 80], side: [0, 1], Ly: L, Lz: L, T: 1, rng: v.rng(11), piston: { X: 32 }, plate: { X: 16, M: mass.value, lo: 15.5, hi: 16.5 }, diffuse: [1, 0, 1, 1, 1, 1] });
            G.setT(TL0.value, 0); G.setT(1, 1);
            hist = [{ t: 0, TL: TL0.value, TR: 1, Q: 0, S: 0 }]; cc.kick(kick.C);
            sp.setTitle('temperature of each side'); sp.setLabels('time', 'kT'); sl.setTitle('heat across the wall and total entropy'); sl.setLabels('time', 'kT  ·  k');
          }
        };
        const stepK = (T, ms) => {
          const t0 = performance.now(); let done = 0;
          while (done < T - 1e-9 && performance.now() - t0 < ms) {
            const P = PLANS[plan.value], st = P.strokes[si];
            let h = Math.min(0.5, T - done);
            const left = st.wait != null ? st.wait - (G.t - tS) : Math.abs(st.to - G.pist.X) / st.U;
            h = Math.max(1e-7, Math.min(h, left));
            G.advance(h); done += h; Tsum += G.stats().T * h; nsum += h;
            const fin = st.wait != null ? G.t - tS >= st.wait - 1e-9 : (st.to - G.pist.X) * dirS <= 1e-7;
            const moved = st.wait != null ? G.t - last.t >= 10 : (G.t - last.t) * st.U >= (st.U > 0.5 ? 2 : 1);
            if (moved || fin) {
              const b = G.snap(), r = G.meas(last, b);
              if (r.dt > 0.5) pts.push({ V: r.V, P: r.pAll, bath: st.bath, out: st.wait == null && dirS > 0, c: cyc, T: Tsum / nsum });
              if (pts.length > 700) pts.shift();
              last = b; Tsum = 0; nsum = 0;
            }
            if (fin) {
              if (st.wait == null) { G.pist.X = st.to; G.setU(0); }
              si++;
              if (si >= P.strokes.length) { cycles.push({ W: -(G.Wp - W0), Q: G.Qb - Q0 }); if (cycles.length > 40) cycles.shift(); W0 = G.Wp; Q0 = G.Qb; si = 0; cyc++; }
              applyStroke();
            }
          }
        };
        const stepC = (T, ms) => {
          const t0 = performance.now(); let done = 0;
          while (done < T - 1e-9 && performance.now() - t0 < ms) {
            const h = Math.min(1, T - done); G.advance(h); done += h;
            if (G.t - hist[hist.length - 1].t >= 1) {
              const a = G.stats(0), b = G.stats(1), h0 = hist[0];
              hist.push({ t: G.t, TL: a.Ttr, TR: b.Ttr, Q: G.Ep[1], S: 1.5 * 80 * (Math.log(a.Ttr / h0.TL) + Math.log(b.Ttr / h0.TR)) });
              if (hist.length > 1500) hist.splice(1, 1);
            }
          }
        };
        make();
        v.animate((t) => {
          const K = mode.value === 'K', rp = tRamp(v);
          if (K) {
            const add = ck(t, () => make()); stepK(add, ck.ms());
            const st = PLANS[plan.value].strokes[si], bath = !!st.bath;
            sc.setView([-1.5, X2 + 4], [-2, L + 1.4]);
            drawGas(sc, G, { rod: 3, len: X2 + 1.2, color: (i) => pick(rp, Math.hypot(G.vx[i], G.vy[i], G.vz[i]) / 3.6), wallColor: bath ? 'red' : 'ink', leftColor: bath ? 'red' : 'ink' });
            sc.text(bath ? 'walls in contact with the heat bath (kT = 1)' : 'walls insulated', 0, -1.05, { size: 11.5, color: bath ? 'red' : 'muted', weight: 600 });
            sc.text(`cycle ${cyc + 1} · ${st.name}`, X2 + 3.5, L + 0.75, { size: 11.5, align: 'right', color: 'ink' });
            sc.text(`gas kT = ${v.fix(G.stats().T, 2)}`, X2 + 3.5, -1.05, { size: 11.5, align: 'right', color: 'ink' });
            // P–V
            sp.fn((V) => N / V, { color: 'blue', width: 1.4, dash: [6, 4], domain: [X1 * A * 0.9, 3400] });
            sp.text('isotherm kT = 1', 3350, N / 3350, { dy: 13, align: 'right', size: 11, color: 'blue' });
            for (const p of pts) sp.dot(p.V, p.P, { r: p.c === cyc ? 3.4 : 2.6, color: p.bath ? 'red' : 'purple', alpha: p.c === cyc ? 0.95 : 0.25, ring: false });
            sp.vline(G.volume(), { color: 'faint', width: 1 });
            // ledger
            const show = cycles.slice(-5), mx = Math.max(60, ...show.flatMap((c) => [Math.abs(c.W), Math.abs(c.Q)])) * 1.3;
            sl.setView([0, 6], [-mx, mx]);
            sl.setTicks(show.map((c, k) => [k + 0.5, `#${cycles.length - show.length + k + 1}`]).concat([[5.5, 'mean']]), null);
            sl.hline(0, { color: 'muted', width: 1 });
            const mean = (k) => cycles.reduce((s, c) => s + c[k], 0) / Math.max(1, cycles.length);
            show.forEach((c, k) => { bar(sl, k + 0.5 - 0.17, c.W, 0.15, 'orange'); bar(sl, k + 0.5 + 0.17, c.Q, 0.15, c.Q >= 0 ? 'red' : 'blue'); });
            if (cycles.length) { bar(sl, 5.5 - 0.17, mean('W'), 0.15, 'orange'); bar(sl, 5.5 + 0.17, mean('Q'), 0.15, mean('Q') >= 0 ? 'red' : 'blue'); }
            sl.vline(5, { color: 'faint', dash: [4, 4] });
            if (!cycles.length) sl.text('first cycle running…', 3, mx * 0.5, { align: 'center', color: 'muted', size: 12 });
            sl.text('net work out > 0 would break the law', 3, mx * 0.88, { size: 11, color: 'red', align: 'center' });
            v.legend([['red', 'bath connected', { dot: true }], ['purple', 'insulated', { dot: true }], ['orange', 'work delivered by the gas $W_{\\text{by}}$', { area: true }], ['red', 'heat from bath $Q$ (blue: into bath)', { area: true }]]);
          } else {
            const add = cc(t, () => make()); stepC(add, cc.ms());
            sc.setView([-1.5, 33.5], [-2, L + 1.4]);
            const a = G.stats(0), b = G.stats(1);
            drawGas(sc, G, { piston: false, len: 32, color: (i) => pick(rp, Math.hypot(G.vx[i], G.vy[i], G.vz[i]) / 3.6), plateColor: 'orange' });
            sc.text(`left kT = ${v.fix(a.Ttr, 2)}`, 0, L + 0.8, { size: 12, weight: 600, color: a.Ttr > b.Ttr ? 'red' : 'blue' });
            sc.text(`right kT = ${v.fix(b.Ttr, 2)}`, 32, L + 0.8, { size: 12, weight: 600, align: 'right', color: b.Ttr > a.Ttr ? 'red' : 'blue' });
            sc.text(`jiggling wall, mass ${v.fix(mass.value, 1)} m: the only path for energy`, 16, -1.05, { size: 11.5, align: 'center', color: 'orange' });
            const tm = Math.max(120, G.t);
            sp.setView([0, tm], [0, Math.max(2.6, TL0.value + 0.2)]);
            sp.path(hist.map((p) => [p.t, p.TL]), { color: 'orange', width: 2.2 }); sp.path(hist.map((p) => [p.t, p.TR]), { color: 'teal', width: 2.2 });
            sp.hline((TL0.value + 1) / 2, { color: 'green', dash: [6, 4], width: 1.2 });
            sp.text('common final kT', tm * 0.98, (TL0.value + 1) / 2, { dy: -10, align: 'right', size: 11, color: 'green' });
            const sm = smooth(hist), qs = sm.map((p) => p.Q), ss = sm.map((p) => p.S), lo = Math.min(-5, ...qs, ...ss), hi = Math.max(5, ...qs, ...ss);
            sl.setTicks(null, null); sl.setView([0, tm], [lo - 0.15 * (hi - lo), hi + 0.15 * (hi - lo)]);
            sl.hline(0, { color: 'muted', width: 1 });
            sl.path(hist.map((p) => [p.t, p.Q]), { color: 'red', width: 1, alpha: 0.3 }); sl.path(hist.map((p) => [p.t, p.S]), { color: 'green', width: 1, alpha: 0.3 });
            sl.path(sm.map((p) => [p.t, p.Q]), { color: 'red', width: 2.4 }); sl.path(sm.map((p) => [p.t, p.S]), { color: 'green', width: 2.4 });
            // net heat-flow arrow over the wall (from the smoothed slope)
            const k0 = sm.length - 1, k1 = Math.max(0, k0 - 15), rate = k0 > k1 ? (sm[k0].Q - sm[k1].Q) / Math.max(1e-9, sm[k0].t - sm[k1].t) : 0;
            if (Math.abs(rate) > 0.02) { const d = Math.sign(rate), w = clamp(1.5 + Math.abs(rate) * 6, 1.5, 7); sc.arrow(16 - 3 * d, L + 0.8, 16 + 3 * d, L + 0.8, { color: 'red', width: w, head: 10 }); }
            else sc.text('no net flow', 16, L + 0.8, { align: 'center', size: 11.5, color: 'green', weight: 600 });
            v.legend([['orange', 'left side'], ['teal', 'right side'], ['red', 'heat crossed left → right (running mean)'], ['green', '$\\Delta S_{\\text{total}}$ in units of $k$ (running mean)']]);
          }
        }, { still: 14 });
        v.readout(() => {
          if (mode.value === 'K') {
            const n = cycles.length, mW = n ? cycles.reduce((s, c) => s + c.W, 0) / n : NaN, mQ = n ? cycles.reduce((s, c) => s + c.Q, 0) / n : NaN, best = n ? Math.max(...cycles.map((c) => c.W)) : NaN;
            return n ? `${n} cycle${n > 1 ? 's' : ''} completed · mean work delivered per cycle $W_{\\text{by}}$ = **${v.fix(mW, 1)} kT** (best single cycle ${v.fix(best, 1)}) · mean heat drawn from the bath ${v.fix(mQ, 1)} kT · ${mW < 0 ? 'the engine **consumes** work and dumps it into the bath as heat, as Kelvin–Planck demands' : 'positive so far: a fluctuation of a small gas — keep it running'}` : 'first cycle under way…';
          }
          const h = hist[hist.length - 1], a = G.stats(0), b = G.stats(1);
          return `heat that has crossed the wall: ${v.fix(h.Q, 1)} kT ${h.Q >= 0 ? 'left → right' : 'right → left'} · the left side started ${TL0.value > 1 ? 'hotter' : TL0.value < 1 ? 'colder' : 'equal'}, so heat ${TL0.value === 1 ? 'only fluctuates' : `flows ${TL0.value > 1 ? 'left → right' : 'right → left'}, from hot to cold`} · now $kT_L$ = ${v.fix(a.Ttr, 3)}, $kT_R$ = ${v.fix(b.Ttr, 3)} · $\\Delta S_{\\text{total}} = \\tfrac32 N_L k\\ln\\tfrac{T_L}{T_{L0}} + \\tfrac32 N_R k\\ln\\tfrac{T_R}{T_{R0}}$ = ${v.fix(h.S, 1)} k ≥ 0`;
        });
      },
    },
  ],
};
