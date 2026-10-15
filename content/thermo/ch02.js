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
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Theorem', name: 'Kelvin and Clausius statements are equivalent',
      statement: String.raw`The Kelvin–Planck and Clausius statements of the second law (2.1) are logically equivalent: if either could be violated, so could the other.

(a) A device that violated Kelvin–Planck (a cycle turning heat $Q$ from a hot reservoir entirely into work $W = Q$) could drive an ordinary refrigerator that uses $W$ to lift heat $Q_c$ from a cold reservoir and deliver $Q_c + W$ to the hot one; together they would move $Q_c$ from cold to hot with no other effect, violating Clausius.

(b) A device that violated Clausius (moving heat $Q$ from cold to hot unaided) could return to the hot reservoir exactly the waste heat $Q_c$ of an ordinary engine; together they would draw $Q_h - Q_c$ from the hot reservoir and turn it entirely into work, violating Kelvin–Planck.`,
      idea: String.raw`Both directions are proofs by composition: put the hypothetical violator next to an honest device, couple them so that one reservoir's books balance, and draw a box around the pair. Only the first law (1.11) is used to balance the flows, and only the existence of *some* engine and *some* refrigerator is assumed. Because either statement implies the other, they are two faces of one law, and later arguments (Carnot's theorem, 2.5) can use whichever is more convenient.`,
      caption: String.raw`Step through the construction with ▶. Red bands are heat into or out of the hot reservoir, blue bands the cold one, orange bands work; widths are proportional to the energy per cycle. The hypothetical violator is drawn dashed. In the last step the shaft is connected and a box drawn around both devices: the panel on the right shows the *net* effect — heat climbing uphill unaided (a) or one reservoir's heat turned wholly into work (b). Drag the sliders to resize the flows; turn on **honest device** to replace the violator by an engine or refrigerator that obeys the law, and the combination becomes harmless (net heat flows downhill, or net work is consumed). Reservoirs at 500 K and 300 K cap the honest devices at Carnot's limits.`,
      deps: ['thermo-2.1'],
      refs: ['Kardar §1.4'],
      tags: ['second law', 'proof'],
      credit: 'Clausius, 1854; the composition argument in its textbook form follows Planck, 1897',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Second_law_of_thermodynamics#Equivalence_of_the_Clausius_and_the_Kelvin_statements' },
      viz(v) {
        const TH = 500, TC = 300;
        const which = v.select('construction', [{ value: 'a', label: '(a) no Kelvin ⇒ no Clausius' }, { value: 'b', label: '(b) no Clausius ⇒ no Kelvin' }], 'a', { onChange: () => S.reset(frames(), { at: 'end' }) });
        const honest = v.toggle('honest device instead of the violator', false);
        const Qa = v.slider('heat handled by device A', 40, 120, 90, { step: 1, fmt: (x) => x.toFixed(0) + ' J' });
        const kB = v.slider('refrigerator COP $Q_c/W$ (≤ 1.5)', 0.3, 1.5, 1.2, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const eB = v.slider('engine efficiency (≤ 0.40)', 0.08, 0.4, 0.3, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const s = v.stage({ x: [0, 14], y: [0, 7.1], equal: true, height: 330, axes: false, full: true });
        const frames = () => {
          const a = which.value === 'a';
          return [
            { k: 0, note: a ? String.raw`Suppose device **A** violates Kelvin–Planck: in each cycle it takes heat $Q$ from the hot reservoir and delivers all of it as work, rejecting nothing.` : String.raw`Suppose device **A** violates Clausius: in each cycle it moves heat from the cold reservoir to the hot one with no work at all.` },
            { k: 1, note: a ? String.raw`Next to it put an ordinary refrigerator **B**: it uses work $W$ to lift heat $Q_c$ out of the cold reservoir and dumps $Q_c + W$ into the hot one (first law).` : String.raw`Next to it put an ordinary engine **B**: it takes $Q_h$ from the hot reservoir, delivers work $W$ and rejects $Q_c = Q_h - W$ into the cold one.` },
            { k: 2, note: a ? String.raw`Connect the shaft: A's work runs B exactly. Size B so that it needs just $W = Q$.` : String.raw`Size A so that it carries back to the hot reservoir exactly the $Q_c$ that B rejects each cycle.` },
            { k: 3, note: a ? String.raw`Draw a box around both. Net effect per cycle: the cold reservoir loses $Q_c$, the hot one gains $Q_c$, no work goes in — **heat flows uphill unaided, violating Clausius.**` : String.raw`Draw a box around both. Net effect per cycle: the cold reservoir is untouched, the hot one loses $Q_h - Q_c$ and exactly that much work comes out — **one reservoir's heat turned wholly into work, violating Kelvin–Planck.**` },
          ];
        };
        const S = v.steps({ frames: frames(), start: 'end', still: 3, transition: 0.35 });
        const W = (E, mx) => 3 + 30 * Math.abs(E) / mx;
        v.render(() => {
          const a = which.value === 'a', k = S.frame.k ?? 3, tw = S.tween ?? 1, hon = honest.value, xA = 2.5, xB = 6.4, y = 3.55, r = 0.72;
          reservoir(s, 0.3, 5.95, 8.7, 6.85, 'red', `hot reservoir, ${TH} K`);
          reservoir(s, 0.3, 0.2, 8.7, 1.1, 'blue', `cold reservoir, ${TC} K`);
          // flows of A
          let A, B;
          if (a) {
            const Q = Qa.value, Wa = hon ? eB.value * Q : Q, Qca = Q - Wa;   // A: engine (perfect or honest)
            const Wb = Wa, Qcb = kB.value * Wb, Qhb = Qcb + Wb;                // B: refrigerator run by A's work
            A = { hotIn: Q, coldOut: Qca, W: Wa }; B = { coldIn: Qcb, hotOut: Qhb, W: Wb };
          } else {
            const Qh = Qa.value, Wb = eB.value * Qh, Qcb = Qh - Wb;            // B: honest engine
            const Wa = hon ? Qcb / kB.value : 0;                                 // A: pump (perfect) or honest refrigerator
            A = { coldIn: Qcb, hotOut: Qcb + Wa, W: Wa }; B = { hotIn: Qh, coldOut: Qcb, W: Wb };
          }
          const mx = Math.max(...Object.values(A), ...Object.values(B), 1);
          const top = 5.95, bot = 1.1;
          const vio = !hon;
          const showB = k >= 1, joined = k >= 2;
          const al = (show) => (show ? 0.85 : 0);
          // A's heat flows
          if (A.hotIn) band(v, s, [[xA, top], [xA, y + r]], W(A.hotIn, mx), 'red');
          if (A.hotOut) band(v, s, [[xA, y + r], [xA, top]], W(A.hotOut, mx), 'red');
          if (A.coldIn) band(v, s, [[xA, bot], [xA, y - r]], W(A.coldIn, mx), 'blue');
          if (A.coldOut > 0.5) band(v, s, [[xA, y - r], [xA, bot]], W(A.coldOut, mx), 'blue');
          // B's flows
          if (showB) {
            const o = { alpha: al(showB) * (k === 1 ? Math.max(0.2, tw) : 1) };
            if (B.hotIn) band(v, s, [[xB, top], [xB, y + r]], W(B.hotIn, mx), 'red', o);
            if (B.hotOut) band(v, s, [[xB, y + r], [xB, top]], W(B.hotOut, mx), 'red', o);
            if (B.coldIn) band(v, s, [[xB, bot], [xB, y - r]], W(B.coldIn, mx), 'blue', o);
            if (B.coldOut) band(v, s, [[xB, y - r], [xB, bot]], W(B.coldOut, mx), 'blue', o);
          }
          // work: (a) A → B ; (b) B → outside and (honest) outside → A
          if (a) {
            if (joined) band(v, s, [[xA + r, y], [xB - r, y]], W(A.W, mx), 'orange', { alpha: 0.85 * (k === 2 ? Math.max(0.25, tw) : 1) });
            else { band(v, s, [[xA + r, y], [xA + r + 1.15, y]], W(A.W, mx), 'orange'); if (showB) band(v, s, [[xB - r - 1.15, y], [xB - r, y]], W(B.W, mx), 'orange', { alpha: 0.85 * tw }); }
            s.text(`W = ${A.W.toFixed(0)} J`, (xA + xB) / 2, y, { dy: -W(A.W, mx) / 2 - 10, align: 'center', size: 11.5, color: 'orange', weight: 650 });
          } else {
            if (showB) { band(v, s, [[xB + r, y], [xB + r + 1.2, y]], W(B.W, mx), 'orange', { alpha: 0.85 * (k === 1 ? tw : 1) }); s.text(`W = ${B.W.toFixed(0)} J`, xB + r + 0.15, y, { dy: -W(B.W, mx) / 2 - 10, size: 11.5, color: 'orange', weight: 650 }); }
            if (A.W > 0.5) { band(v, s, [[xA - r - 1.2, y], [xA - r, y]], W(A.W, mx), 'orange'); s.text(`W = ${A.W.toFixed(0)} J`, xA - r - 1.2, y, { dy: -W(A.W, mx) / 2 - 10, size: 11.5, color: 'orange', weight: 650 }); }
          }
          // flow labels
          const lab = (x, yy, E, col, side) => { if (E > 0.5) s.text(`${E.toFixed(0)} J`, x + (side === 'l' ? -0.2 : 0.2), yy, { align: side === 'l' ? 'right' : 'left', size: 11.5, color: col, weight: 600 }); };
          lab(xA, 4.95, A.hotIn || A.hotOut, 'red', 'l'); lab(xA, 2.1, A.coldIn || A.coldOut, 'blue', 'l');
          if (showB) { lab(xB, 4.95, B.hotIn || B.hotOut, 'red', 'r'); lab(xB, 2.1, B.coldIn || B.coldOut, 'blue', 'r'); }
          device(s, xA, y, r, 'A', vio ? 'red' : 'green', { dash: vio ? [5, 4] : null, tint: true });
          s.text(a ? (hon ? 'honest engine' : 'perfect engine?') : (hon ? 'honest refrigerator' : 'perfect heat pump?'), xA, y - r - 0.2, { align: 'center', baseline: 'top', size: 11, color: vio ? 'red' : 'green', dy: 2, plate: true });
          if (showB) { device(s, xB, y, r, 'B', 'ink', { tint: false }); s.text(a ? 'ordinary refrigerator' : 'ordinary engine', xB, y - r - 0.2, { align: 'center', baseline: 'top', size: 11, color: 'ink', dy: 2, plate: true }); }
          if (k >= 3) s.rect(xA - 1.35, y - 1.45, xB + 1.35, y + 1.25, { color: 'ink', width: 1.4, dash: [6, 5], radius: 10 });
          // net panel
          s.text('net effect of A + B', 11.35, 6.75, { align: 'center', size: 12, weight: 650 });
          reservoir(s, 9.4, 5.95, 13.3, 6.4, 'red', 'hot', null, { size: 11 }); reservoir(s, 9.4, 0.65, 13.3, 1.1, 'blue', 'cold', null, { size: 11 });
          const netHot = (A.hotOut || 0) + (B.hotOut || 0) - (A.hotIn || 0) - (B.hotIn || 0); // received by the hot reservoir
          const netCold = (A.coldOut || 0) + (B.coldOut || 0) - (A.coldIn || 0) - (B.coldIn || 0);
          const netW = a ? 0 : B.W - A.W; // work delivered to the outside
          if (k >= 3) {
            const xc = 11.35, mx2 = Math.max(Math.abs(netHot), Math.abs(netCold), Math.abs(netW), 1);
            device(s, xc, y, 0.62, 'A+B', 'ink');
            const ww = (E) => 3 + 26 * Math.abs(E) / Math.max(mx, mx2);
            if (netHot > 0.5) band(v, s, [[xc, y + 0.62], [xc, 5.95]], ww(netHot), 'red'); else if (netHot < -0.5) band(v, s, [[xc, 5.95], [xc, y + 0.62]], ww(netHot), 'red');
            if (netCold > 0.5) band(v, s, [[xc, y - 0.62], [xc, 1.1]], ww(netCold), 'blue'); else if (netCold < -0.5) band(v, s, [[xc, 1.1], [xc, y - 0.62]], ww(netCold), 'blue');
            if (netW > 0.5) band(v, s, [[xc + 0.62, y], [xc + 1.75, y]], ww(netW), 'orange'); else if (netW < -0.5) band(v, s, [[xc + 1.75, y], [xc + 0.62, y]], ww(netW), 'orange');
            s.text(`${netHot >= 0 ? '+' : '−'}${Math.abs(netHot).toFixed(0)} J`, xc - 0.25, 4.95, { align: 'right', size: 11.5, color: 'red', weight: 650 });
            s.text(`${netCold >= 0 ? '+' : '−'}${Math.abs(netCold).toFixed(0)} J`, xc - 0.25, 2.1, { align: 'right', size: 11.5, color: 'blue', weight: 650 });
            if (Math.abs(netW) > 0.5) s.text(`W ${netW > 0 ? 'out' : 'in'} ${Math.abs(netW).toFixed(0)} J`, xc + 0.7, y, { dy: -ww(netW) / 2 - 10, size: 11.5, color: 'orange', weight: 650 });
            const bad = a ? netHot > 0.5 && Math.abs(netW) < 0.5 : netW > 0.5 && Math.abs(netCold) < 0.5;
            s.text(bad ? (a ? 'heat climbs unaided: Clausius broken' : 'heat → work from one reservoir: Kelvin broken') : 'nothing forbidden happens', 11.35, 0.32, { align: 'center', size: 11.5, weight: 700, color: bad ? 'red' : 'green' });
          } else s.text('(appears in the last step)', 11.35, y, { align: 'center', size: 11.5, color: 'muted' });
        });
        v.readout(() => {
          const a = which.value === 'a', hon = honest.value;
          let netHot, netCold, netW;
          if (a) { const Q = Qa.value, Wa = hon ? eB.value * Q : Q, Qcb = kB.value * Wa; netHot = Qcb + Wa - Q; netCold = (Q - Wa) - Qcb; netW = 0; }
          else { const Qh = Qa.value, Wb = eB.value * Qh, Qcb = Qh - Wb, Wa = hon ? Qcb / kB.value : 0; netHot = Qcb + Wa - Qh; netCold = 0; netW = Wb - Wa; }
          const sum = netHot + netCold + netW;
          return `per cycle, A + B together: hot reservoir ${netHot >= 0 ? 'gains' : 'loses'} ${v.fix(Math.abs(netHot), 1)} J, cold reservoir ${netCold >= 0 ? 'gains' : 'loses'} ${v.fix(Math.abs(netCold), 1)} J, work delivered ${v.fix(netW, 1)} J · energy balance $\\Delta E_{\\text{hot}} + \\Delta E_{\\text{cold}} + W$ = ${v.fix(sum, 2)} J (first law) · ${hon ? 'with honest devices (efficiency × (1 + COP) ≤ 1 for these reservoirs) the net effect is allowed' : a ? '**a Kelvin violator manufactures a Clausius violator**' : '**a Clausius violator manufactures a Kelvin violator**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Definition', name: 'Heat engines and efficiency',
      statement: String.raw`A **heat engine** is a system taken repeatedly around a cycle that absorbs heat $Q_h$ (from hotter surroundings), delivers net work $W$ and rejects heat $Q_c$ (to colder surroundings). Since the working substance returns to its initial state, $\Delta U = 0$ over a cycle and the first law gives
$$W = Q_h - Q_c.$$
Its **efficiency** is the fraction of the absorbed heat turned into work,
$$\eta = \frac{W}{Q_h} = 1 - \frac{Q_c}{Q_h}.$$
On a $P$–$V$ diagram $W = \oint P\,dV$ is the area enclosed by the cycle, positive for clockwise traversal; run backwards the cycle consumes work and becomes a refrigerator or heat pump (2.13).`,
      idea: String.raw`Only the first law (1.11) is involved: the books of a cycle must balance, so the work out can be at most the heat in, and $\eta \le 1$. The second law (2.1) says more — $Q_c$ can never be zero, so $\eta < 1$ — and Carnot's theorem (2.5) will bound $\eta$ by the extreme temperatures the substance reaches. Note that $Q_h$ counts *all* heat absorbed around the cycle and $Q_c$ all heat rejected, even when both happen at many different temperatures.`,
      caption: String.raw`Drag the four corners of a cycle of 1 mol of ideal gas. Each leg is coloured where heat flows in (red) and out (blue) — a leg can switch colour midway, where it is tangent to an adiabat. The flow diagram on the right is drawn to scale: heat absorbed $Q_h$ enters from the top, the work $W$ leaves to the right and the waste heat $Q_c$ leaves at the bottom. The gauge compares $\eta = W/Q_h$ with the Carnot bound $1 - T_{\min}/T_{\max}$ for the hottest and coldest points on the cycle (ringed). Drag a corner across the opposite side to reverse the cycle: the work becomes negative and the device a heat pump.`,
      deps: ['thermo-1.11'],
      see: ['energy-2.1'],
      refs: ['Schroeder §4.1'],
      tags: ['engines', 'efficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_engine' },
      viz(v) {
        const gas = v.select('gas', [{ value: 3, label: 'monatomic ($f$ = 3)' }, { value: 5, label: 'diatomic ($f$ = 5)' }], 3);
        const sp = v.stage({ x: [0, 60], y: [0, 600], height: 340, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1.3, title: 'cycle of 1 mol of ideal gas' });
        const sf = v.stage({ x: [0, 10], y: [0, 10], equal: true, height: 340, axes: false, weight: 1, title: 'energy flow per cycle, to scale' });
        const con = { x: [3, 58], y: [30, 580] };
        const H = [sp.handle(12, 470, { color: 'ink', label: 'A', constrain: con }), sp.handle(38, 380, { color: 'ink', label: 'B', constrain: con }), sp.handle(50, 110, { color: 'ink', label: 'C', constrain: con }), sp.handle(16, 150, { color: 'ink', label: 'D', constrain: con })];
        let res = null;
        v.render(() => {
          const f = +gas.value, P = H.map((h) => [h.x, h.y]);
          let qin = 0, qout = 0, wsum = 0, Tmax = -1, Tmin = 1e9, pmax, pmin;
          for (let k = 0; k < 4; k++) {
            const a = P[k], b = P[(k + 1) % 4], L = segHeat(a, b, f, 80);
            qin += L.qin; qout += L.qout; wsum += L.w;
            for (const pc of L.pieces) sp.path(pc.pts, { color: pc.sign > 0 ? 'red' : 'blue', width: 3.4 });
            for (let i = 0; i <= 40; i++) { const V = lerp(a[0], b[0], i / 40), p = lerp(a[1], b[1], i / 40), T = V * p / R; if (T > Tmax) { Tmax = T; pmax = [V, p]; } if (T < Tmin) { Tmin = T; pmin = [V, p]; } }
          }
          const area = 0.5 * P.reduce((s, p, i) => { const q = P[(i + 1) % 4]; return s + p[0] * q[1] - q[0] * p[1]; }, 0); // counter-clockwise positive
          sp.poly(P, { fill: wsum >= 0 ? 'orange' : 'purple', fillAlpha: 0.12, stroke: false });
          sp.dot(pmax[0], pmax[1], { r: 9, hollow: true, color: 'red', width: 2 }); sp.dot(pmin[0], pmin[1], { r: 9, hollow: true, color: 'blue', width: 2 });
          sp.text(`T max ${Tmax.toFixed(0)} K`, pmax[0], pmax[1], { dx: 12, dy: -12, size: 11, color: 'red' });
          sp.text(`T min ${Tmin.toFixed(0)} K`, pmin[0], pmin[1], { dx: 12, dy: 12, size: 11, color: 'blue' });
          // direction arrows at leg midpoints
          for (let k = 0; k < 4; k++) { const a = P[k], b = P[(k + 1) % 4], m = [lerp(a[0], b[0], 0.55), lerp(a[1], b[1], 0.55)], m0 = [lerp(a[0], b[0], 0.45), lerp(a[1], b[1], 0.45)]; sp.arrow(m0[0], m0[1], m[0], m[1], { color: 'ink', width: 1.5, head: 9 }); }
          res = { qin, qout, W: wsum, area: -area, Tmax, Tmin };
          // flow diagram
          const mx = Math.max(qin, 1), wpx = (E) => 2 + 44 * Math.abs(E) / mx;
          const eng = wsum >= 0;
          reservoir(sf, 1.2, 8.6, 6.8, 9.6, 'red', 'heat absorbed', null, { size: 11.5 });
          reservoir(sf, 1.2, 0.4, 6.8, 1.4, 'blue', 'heat rejected', null, { size: 11.5 });
          band(v, sf, [[4, 8.6], [4, 6.2]], wpx(qin), 'red');
          band(v, sf, [[4, 3.8], [4, 1.4]], wpx(qout), 'blue');
          if (eng) band(v, sf, [[5.2, 5], [9.6, 5]], wpx(wsum), 'orange'); else band(v, sf, [[9.6, 5], [5.2, 5]], wpx(wsum), 'purple');
          device(sf, 4, 5, 1.2, eng ? 'engine' : 'heat pump', eng ? 'ink' : 'purple', { size: 12 });
          sf.text(`$Q_h$ = ${qin.toFixed(0)} J`, 4.5, 7.4, { size: 12.5, color: 'red' });
          sf.text(`$Q_c$ = ${qout.toFixed(0)} J`, 4.5, 2.6, { size: 12.5, color: 'blue' });
          sf.text(`$W$ = ${wsum.toFixed(0)} J ${eng ? 'out' : 'in'}`, 9.6, 5.85, { size: 12.5, color: eng ? 'orange' : 'purple', align: 'right' });
          // efficiency gauge on the left edge
          const gx = 0.45, g0 = 1.8, g1 = 8.2, eta = eng ? wsum / qin : 0, ec = 1 - Tmin / Tmax;
          sf.rect(gx - 0.18, g0, gx + 0.18, g1, { color: 'muted', width: 1, radius: 3 });
          sf.rect(gx - 0.18, g0, gx + 0.18, g0 + (g1 - g0) * clamp(eta, 0, 1), { fill: 'orange', fillAlpha: 0.85, stroke: false });
          sf.line(gx - 0.32, g0 + (g1 - g0) * ec, gx + 0.32, g0 + (g1 - g0) * ec, { color: 'green', width: 2.5 });
          sf.text('η', gx, g1 + 0.35, { align: 'center', math: true, size: 15 });
          sf.text('Carnot bound', gx + 0.4, g0 + (g1 - g0) * ec, { size: 10.5, color: 'green' });
        });
        v.legend([['red', 'heat flowing in'], ['blue', 'heat flowing out'], ['orange', 'enclosed area = net work', { area: true }]]);
        v.readout(() => {
          if (!res) return '';
          const { qin, qout, W, area, Tmax, Tmin } = res, eng = W >= 0;
          return `$Q_h$ = ${v.fix(qin, 0)} J, $Q_c$ = ${v.fix(qout, 0)} J, $Q_h - Q_c$ = ${v.fix(qin - qout, 1)} J = $\\oint P\\,dV$ = ${v.fix(W, 1)} J (enclosed area ${v.fix(area, 1)} J) · ${eng ? `efficiency $\\eta = W/Q_h$ = **${v.fix(W / qin, 3)}**, below the Carnot bound $1 - T_{\\min}/T_{\\max}$ = ${v.fix(1 - Tmin / Tmax, 3)}` : `the cycle runs counter-clockwise: work ${v.fix(-W, 0)} J goes **in**, so it is a heat pump`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Model', name: 'Carnot cycle',
      statement: String.raw`The **Carnot cycle** is the reversible cycle that exchanges heat with only two reservoirs, at $T_h$ and $T_c$. For an ideal gas it consists of
(1) isothermal expansion at $T_h$ from $V_1$ to $V_2$, absorbing $Q_h = nRT_h\ln(V_2/V_1)$;
(2) adiabatic expansion from $V_2$ to $V_3$, cooling from $T_h$ to $T_c$ (with $TV^{\gamma-1}$ constant);
(3) isothermal compression at $T_c$ from $V_3$ to $V_4$, rejecting $Q_c = nRT_c\ln(V_3/V_4)$;
(4) adiabatic compression back to $V_1$, warming to $T_h$.
The adiabats force $V_3/V_4 = V_2/V_1$, hence $Q_c/Q_h = T_c/T_h$ and
$$\eta = \frac{W}{Q_h} = 1 - \frac{T_c}{T_h},$$
independent of the volumes and of the gas. On a $T$–$S$ diagram the cycle is a rectangle.`,
      idea: String.raw`Heat is exchanged only along isotherms, where the gas and the reservoir have the same temperature, and the temperature is changed only adiabatically, with no heat flowing at all — so no heat ever crosses a finite temperature difference and every step can be run backwards. The adiabatic relation of 1.16, $T_hV_2^{\gamma-1} = T_cV_3^{\gamma-1}$ and $T_hV_1^{\gamma-1} = T_cV_4^{\gamma-1}$, makes the two isothermal volume ratios equal, so the logarithms cancel in $Q_c/Q_h$. The heats are areas under the horizontal edges of the $T$–$S$ rectangle, $Q_h = T_h\Delta S$ and $Q_c = T_c\Delta S$, and the work is the rectangle itself.`,
      caption: String.raw`The engine runs by itself; **drag the dot** on the $P$–$V$ or the $T$–$S$ diagram to drive it through the four strokes by hand (press ▶ to let it run again). Left: the cylinder stands on the hot block, on an insulating stand or on the cold block; arrows show heat entering and leaving and work done on the rod. The bars accumulate $Q_h$, $Q_c$ and the net work since the start of stroke 1; after a full cycle $W/Q_h$ lands exactly on $1 - T_c/T_h$ (green tick). Change the temperatures, the expansion ratio or the gas: the loop changes shape, the efficiency does not depend on anything but the temperatures.`,
      deps: ['thermo-2.3', 'thermo-1.16'],
      see: ['pchem-3.3'],
      refs: ['Schroeder §4.1'],
      tags: ['Carnot', 'engines'],
      credit: 'S. Carnot, 1824; drawn on the P–V diagram by Clapeyron, 1834',
      scope: String.raw`An idealization: every step must be quasistatic, so a real Carnot engine would deliver vanishing power (2.17). The efficiency formula holds for any working substance (2.5); the specific volumes and heats above are for an ideal gas.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carnot_cycle' },
      viz(v) {
        const Th = v.slider('$T_h$', 400, 900, 600, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const Tc = v.slider('$T_c$', 200, 390, 300, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const rr = v.slider('expansion ratio $V_2/V_1$', 1.4, 4, 2.5, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const gas = v.select('gas', [{ value: 3, label: 'monatomic' }, { value: 5, label: 'diatomic' }], 3);
        const se = v.stage({ x: [0, 6], y: [0, 10], equal: true, height: 330, axes: false, weight: 0.7, minWidth: 190 });
        const sp = v.stage({ x: [0, 80], y: [0, 600], height: 330, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1, minWidth: 250, title: '$P$–$V$ diagram' });
        const st = v.stage({ x: [-2, 10], y: [0, 1000], height: 330, axes: 'box', xlabel: 'S − S₁ (J/K)', ylabel: 'T (K)', weight: 1, minWidth: 250, title: '$T$–$S$ diagram' });
        const sb = v.stage({ x: [0, 1], y: [0, 4], height: 150, axes: false, full: true });
        const SP = 0.4; // strokes per second
        let u0 = 0, t0 = 0, uNow = 0, C = null, dragU = null;
        const cyc = () => carnot(Th.value, Math.min(Tc.value, Th.value - 10), 10, rr.value, +gas.value, 1);
        const nearest = (stage, fx) => (x, y) => {
          const c = C || cyc(); let best = 1e18, bu = 0;
          for (let k = 0; k <= 800; k++) { const u = 4 * k / 800, q = c.at(u), [X, Y] = fx(q); const d = (stage.X(X) - stage.X(x)) ** 2 + (stage.Y(Y) - stage.Y(y)) ** 2; if (d < best) { best = d; bu = u; } }
          dragU = bu % 4; return fx(c.at(bu));
        };
        const grab = () => { v.pause(); u0 = dragU; t0 = v.t; };
        const hp = sp.handle(10, 500, { color: 'gold', r: 8, constrain: nearest(sp, (q) => [q.V, q.P]), onDrag: grab });
        const ht = st.handle(0, 600, { color: 'gold', r: 8, constrain: nearest(st, (q) => [q.S, q.T]), onDrag: grab });
        const names = ['1 → 2: isothermal expansion at $T_h$', '2 → 3: adiabatic expansion', '3 → 4: isothermal compression at $T_c$', '4 → 1: adiabatic compression'];
        v.animate((t) => {
          C = cyc();
          if (v.playing) uNow = (u0 + (t - t0) * SP) % 4; else if (dragU != null && (hp.dragging || ht.dragging)) uNow = dragU; else uNow = (u0 + (t - t0) * SP) % 4;
          if (uNow < 0) uNow += 4;
          const q = C.at(uNow), s = q.stroke;
          // views
          const Pmax = C.at(0).P, Vmax = C.V3;
          sp.setView([0, Vmax * 1.12], [0, Pmax * 1.15]);
          const dS = C.dS; st.setView([-0.25 * dS, 1.25 * dS], [0, Math.max(1000, C.Th * 1.12)]);
          // P–V
          const pts = Array.from({ length: 401 }, (_, k) => C.at(4 * k / 400)).map((p) => [p.V, p.P]);
          sp.poly(pts, { fill: 'orange', fillAlpha: 0.12, stroke: false });
          const strokeCol = ['red', 'purple', 'blue', 'purple'];
          for (let k = 0; k < 4; k++) sp.path(Array.from({ length: 101 }, (_, i) => C.at(k + i / 100 * 0.9999)).map((p) => [p.V, p.P]), { color: strokeCol[k], width: k === s ? 3.6 : 2, alpha: k === s ? 1 : 0.7, dash: k % 2 ? [7, 4] : null });
          ['1', '2', '3', '4'].forEach((lb, k) => { const p = C.at(k); sp.dot(p.V, p.P, { r: 4, color: 'ink', label: lb, labelPos: k === 0 ? 'ne' : k === 1 ? 'ne' : k === 2 ? 'sw' : 'sw' }); });
          // T–S
          st.rect(0, 0, dS, C.Tc, { fill: 'blue', fillAlpha: 0.12, stroke: false });
          st.rect(0, C.Tc, dS, C.Th, { fill: 'orange', fillAlpha: 0.22, stroke: false });
          st.line(0, C.Th, dS, C.Th, { color: 'red', width: s === 0 ? 3.6 : 2.2 }); st.line(dS, C.Th, dS, C.Tc, { color: 'purple', width: s === 1 ? 3.6 : 2, dash: [7, 4] });
          st.line(dS, C.Tc, 0, C.Tc, { color: 'blue', width: s === 2 ? 3.6 : 2.2 }); st.line(0, C.Tc, 0, C.Th, { color: 'purple', width: s === 3 ? 3.6 : 2, dash: [7, 4] });
          st.text('W', dS / 2, (C.Th + C.Tc) / 2, { align: 'center', math: true, size: 17, color: 'orange' });
          st.text('Qc', dS / 2, C.Tc / 2, { align: 'center', math: true, size: 17, color: 'blue' });
          st.text(`T_h = ${C.Th.toFixed(0)} K`, dS * 1.03, C.Th, { dy: -10, size: 11, color: 'red' });
          st.text(`T_c = ${C.Tc.toFixed(0)} K`, dS * 1.03, C.Tc, { dy: 12, size: 11, color: 'blue' });
          if (!hp.dragging) hp.set(q.V, q.P); if (!ht.dragging) ht.set(q.S, q.T);
          // engine picture
          const frac = 0.16 + 0.8 * (Math.log(q.V) - Math.log(C.V1)) / (Math.log(C.V3) - Math.log(C.V1));
          const tc = pick(tRamp(v), (q.T - C.Tc) / Math.max(1, C.Th - C.Tc));
          const stand = s === 0 ? 'hot' : s === 2 ? 'cold' : 'ins';
          const top = cylinder(v, se, 1.4, 2.3, 3.2, 5.6, frac, tc, { stand, standLabel: s === 0 ? `hot ${C.Th.toFixed(0)} K` : s === 2 ? `cold ${C.Tc.toFixed(0)} K` : 'insulator' });
          if (s === 0) band(v, se, [[3, 0.6], [3, 2.3]], 10, 'red');
          if (s === 2) band(v, se, [[3, 2.3], [3, 0.6]], 10, 'blue');
          const exp = s <= 1;
          se.arrow(5.2, top + 1.2 + (exp ? -0.7 : 0.7), 5.2, top + 1.2 + (exp ? 0.7 : -0.7), { color: 'orange', width: 3, head: 10 });
          se.text(exp ? 'work out' : 'work in', 5.25, top + 2.15, { align: 'center', size: 11, color: 'orange', weight: 650 });
          se.text(`T = ${q.T.toFixed(0)} K`, 3, (2.3 + top) / 2, { align: 'center', size: 12, weight: 650, color: 'ink', plate: true });
          se.text(names[s].replace(/\$T_h\$/, 'Th').replace(/\$T_c\$/, 'Tc'), 3, 9.75, { align: 'center', size: 11, weight: 650 });
          // bars
          const mx = C.Qh * 1.05, rows = [[q.qh, 'red', 'heat in  Qh'], [q.qc, 'blue', 'heat out  Qc'], [q.w, 'orange', 'net work by gas']];
          rows.forEach(([val, col, lab], k) => {
            const yy = 3.3 - k * 1.05;
            sb.rect(0.2, yy - 0.32, 0.2 + 0.62 * clamp(val, 0, mx) / mx, yy + 0.32, { fill: col, fillAlpha: 0.75, color: col, width: 1 });
            if (val < 0) sb.rect(0.2 + 0.62 * val / mx, yy - 0.32, 0.2, yy + 0.32, { fill: col, fillAlpha: 0.35, color: col, width: 1, dash: [3, 3] });
            sb.text(lab, 0.19, yy, { align: 'right', size: 12, color: col, weight: 600 });
            sb.text(`${val.toFixed(0)} J`, 0.2 + 0.62 * Math.max(0, val) / mx + 0.01, yy, { size: 12 });
          });
          sb.line(0.2, 0.05, 0.2, 3.75, { color: 'muted', width: 1 });
          sb.line(0.2 + 0.62 * C.W / mx, 3.75 - 2.1 - 0.42, 0.2 + 0.62 * C.W / mx, 3.75 - 2.1 + 0.55, { color: 'green', width: 2.5 });
          sb.text('one full cycle: W = Qh − Qc', 0.2 + 0.62 * C.W / mx, 0.42, { align: 'center', size: 10.5, color: 'green' });
        }, { still: 3.2 });
        v.legend([['red', 'isotherm at $T_h$'], ['blue', 'isotherm at $T_c$'], ['purple', 'adiabats', { dash: true }], ['orange', 'net work', { area: true }]]);
        v.readout(() => {
          if (!C) return '';
          const q = C.at(uNow);
          return `stroke ${q.stroke + 1} of 4 · $Q_h = nRT_h\\ln(V_2/V_1)$ = ${v.fix(C.Qh, 0)} J, $Q_c$ = ${v.fix(C.Qc, 0)} J, $W$ = ${v.fix(C.W, 0)} J per cycle · $V_3/V_4$ = ${v.fix(C.V3 / C.V4, 3)} = $V_2/V_1$ = ${v.fix(C.V2 / C.V1, 3)} · $W/Q_h$ = **${v.fix(C.W / C.Qh, 4)}** and $1 - T_c/T_h$ = **${v.fix(C.eta, 4)}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Theorem', name: 'Carnot’s theorem',
      statement: String.raw`(a) No engine operating between two reservoirs at temperatures $T_h > T_c$ can be more efficient than a reversible engine operating between the same reservoirs.

(b) All reversible engines operating between the same two reservoirs have the same efficiency, whatever their working substance or design. This universal efficiency is a function of the two temperatures alone, $\eta_{\text{rev}} = \eta(T_h, T_c)$.`,
      idea: String.raw`Let engine X, with efficiency $\eta_X$, take heat $Q_h^X$ from the hot reservoir and deliver $W = \eta_X Q_h^X$. Use that work to run a reversible (Carnot) engine C backwards, as a refrigerator: it lifts heat from the cold reservoir and delivers $W/\eta_C$ to the hot one. The pair exchanges no net work with the outside, and the hot reservoir receives a net $W(1/\eta_C - 1/\eta_X)$ — positive if $\eta_X > \eta_C$, which would be heat flowing uphill with no other effect, forbidden by the Clausius statement (2.1). Hence $\eta_X \le \eta_C$. If X is itself reversible, run the argument with the roles swapped to get $\eta_C \le \eta_X$, so all reversible engines tie. The only thing that can distinguish them is the reservoirs, i.e. their temperatures.`,
      caption: String.raw`Engine X (left) takes 100 J from the hot reservoir each cycle; its work drives a reversed Carnot engine C (right). Choose a rival: a **claimed** efficiency set by the slider, a **Stirling engine without regenerator**, or an **ideal Stirling engine** with a perfect regenerator (reversible). The right panel plots the net heat the pair delivers to the hot reservoir against $\eta_X$: it is a straight line through zero exactly at the Carnot efficiency. To the right of that point heat would climb from cold to hot with nothing else happening — the shaded region the second law forbids. Change $T_h$ and $T_c$ and the forbidden region moves with $1 - T_c/T_h$.`,
      deps: ['thermo-2.4', 'thermo-2.1'],
      refs: ['Kardar §1.5'],
      tags: ['Carnot', 'second law'],
      credit: 'S. Carnot, 1824 (with caloric); re-proved from the second law by Clausius, 1850, and Kelvin, 1851',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carnot%27s_theorem_(thermodynamics)' },
      viz(v) {
        const rival = v.select('rival engine X', [{ value: 'claim', label: 'claimed efficiency' }, { value: 'stir0', label: 'Stirling, no regenerator' }, { value: 'stir1', label: 'ideal Stirling (reversible)' }], 'claim');
        const ex = v.slider('claimed $\\eta_X$', 0.05, 0.95, 0.58, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const Th = v.slider('$T_h$', 350, 900, 600, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const Tc = v.slider('$T_c$', 200, 340, 300, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const ss = v.stage({ x: [0, 10], y: [0, 7.1], equal: true, height: 320, axes: false, weight: 1.25 });
        const sg = v.stage({ x: [0, 1], y: [-100, 100], height: 320, axes: 'box', xlabel: 'efficiency of X', ylabel: 'net heat into hot reservoir (J)', weight: 1, title: 'the pair X + reversed C, per 100 J taken by X' });
        const etaX = () => {
          const h = Th.value, c = Tc.value, r = 3, lr = Math.log(r);
          if (rival.value === 'stir0') return (h - c) * lr / (h * lr + 1.5 * (h - c));
          if (rival.value === 'stir1') return 1 - c / h;
          return ex.value;
        };
        v.render(() => {
          ex.el.hidden = rival.value !== 'claim';
          const h = Th.value, c = Tc.value, eC = 1 - c / h, eX = etaX();
          const QhX = 100, W = eX * QhX, QcX = QhX - W, QhC = W / eC, QcC = QhC - W, net = QhC - QhX;
          // schematic
          const xX = 2.4, xC = 6.0, y = 3.55, r = 0.75, top = 5.95, bot = 1.1, mx = Math.max(QhX, QhC), wp = (E) => 3 + 30 * E / mx;
          reservoir(ss, 0.3, top, 9.7, 6.85, 'red', `hot reservoir ${h.toFixed(0)} K`); reservoir(ss, 0.3, 0.2, 9.7, bot, 'blue', `cold reservoir ${c.toFixed(0)} K`);
          band(v, ss, [[xX, top], [xX, y + r]], wp(QhX), 'red'); band(v, ss, [[xX, y - r], [xX, bot]], wp(QcX), 'blue');
          band(v, ss, [[xC, y + r], [xC, top]], wp(QhC), 'red'); band(v, ss, [[xC, bot], [xC, y - r]], wp(QcC), 'blue');
          band(v, ss, [[xX + r, y], [xC - r, y]], wp(W), 'orange');
          ss.text(`${QhX.toFixed(0)} J`, xX - 0.25, 4.95, { align: 'right', size: 11.5, color: 'red', weight: 650 }); ss.text(`${QcX.toFixed(0)} J`, xX - 0.25, 2.1, { align: 'right', size: 11.5, color: 'blue', weight: 650 });
          ss.text(`${QhC.toFixed(0)} J`, xC + 0.25, 4.95, { size: 11.5, color: 'red', weight: 650 }); ss.text(`${QcC.toFixed(0)} J`, xC + 0.25, 2.1, { size: 11.5, color: 'blue', weight: 650 });
          ss.text(`W = ${W.toFixed(0)} J`, (xX + xC) / 2, y, { dy: -wp(W) / 2 - 10, align: 'center', size: 11.5, color: 'orange', weight: 650 });
          const bad = net > 0.05;
          device(ss, xX, y, r, 'X', bad ? 'red' : 'ink', { tint: bad }); device(ss, xC, y, r, 'C', 'green');
          ss.text(`η = ${v.fix(eX, 3)}`, xX, y - r - 0.15, { align: 'center', baseline: 'top', size: 11, color: bad ? 'red' : 'ink', plate: true });
          ss.text('Carnot, reversed', xC, y - r - 0.15, { align: 'center', baseline: 'top', size: 11, color: 'green', plate: true });
          // net arrow
          const xn = 8.6;
          ss.text('net', xn, 5.45, { align: 'center', size: 11.5, weight: 650 });
          if (Math.abs(net) > 0.5) band(v, ss, net > 0 ? [[xn, bot + 0.2], [xn, top - 0.2]] : [[xn, top - 0.2], [xn, bot + 0.2]], 3 + 30 * Math.abs(net) / mx, net > 0 ? 'red' : 'green');
          ss.text(Math.abs(net) < 0.5 ? '0 J' : `${Math.abs(net).toFixed(0)} J ${net > 0 ? 'uphill!' : 'downhill'}`, xn, 0.75, { align: 'center', size: 11, weight: 650, color: Math.abs(net) < 0.5 ? 'green' : net > 0 ? 'red' : 'green', dy: 30 });
          // graph
          sg.setView([0, 1], [-100, Math.max(100, 100 * (1 / eC - 1) * 0.6)]);
          const ymax = sg.bounds.y[1];
          sg.rect(eC, -100, 1, ymax, { fill: 'red', fillAlpha: 0.1, stroke: false, hatch: 'red', hatchAlpha: 0.25, hatchGap: 9 });
          sg.text('forbidden: heat would flow uphill unaided', (eC + 1) / 2, ymax * 0.88, { align: 'center', size: 11, color: 'red', weight: 650 });
          sg.hline(0, { color: 'muted', width: 1 });
          sg.fn((e) => 100 * (e / eC - 1), { color: 'ink', width: 2.2, domain: [0, 1] });
          sg.vline(eC, { color: 'green', width: 2, dash: [6, 4] });
          sg.text(`η_C = 1 − Tc/Th = ${v.fix(eC, 3)}`, eC, -78, { dx: -6, align: 'right', size: 11, color: 'green', weight: 650 });
          sg.dot(eX, net, { r: 6, color: bad ? 'red' : 'accent', label: 'X', labelPos: 'nw' });
        });
        v.readout(() => {
          const h = Th.value, c = Tc.value, eC = 1 - c / h, eX = etaX(), W = 100 * eX, net = W / eC - 100;
          return `$\\eta_X$ = ${v.fix(eX, 4)}, $\\eta_C = 1 - T_c/T_h$ = ${v.fix(eC, 4)} · X delivers $W$ = ${v.fix(W, 1)} J, which lets C pump $W/\\eta_C$ = ${v.fix(W / eC, 1)} J into the hot reservoir · net heat into the hot reservoir = $W(1/\\eta_C - 1/\\eta_X)$ = **${v.fix(net, 2)} J** with no work from outside · ${net > 0.05 ? '**impossible**: the pair would violate the Clausius statement, so no engine can beat Carnot' : Math.abs(net) <= 0.05 ? 'zero: X is as good as Carnot — it must be reversible' : 'allowed: net heat flows downhill'}`;
        });
      },
    },
  ],
};
