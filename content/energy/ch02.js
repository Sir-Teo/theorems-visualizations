// Energy Systems — Chapter 2: Heat engines and thermodynamic limits
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   Steam: IAPWS-IF97 tables generated with the Python package iapws 1.5.5 (see ch02.shared.js). Check values: 10 MPa and 500 °C
//     give h = 3375.1 kJ/kg and s = 6.5993 kJ/kg·K; an ideal Rankine cycle 10 MPa / 500 °C / 10 kPa gives η = 40.2 % and x₄ = 0.793.
//   Gas cycles: air-standard analysis, c_p = 1.005 kJ/kg·K and γ = 1.4 (textbook values); in the real-component Brayton items the
//     compressor and turbine isentropic efficiencies 0.86 and 0.88 are ILLUSTRATIVE round numbers of modern machines, not data.
//   2.2 plant points (Carnot item): the temperatures and efficiencies are round numbers from memory of typical plants (PWR ≈ 33 %,
//     ultra-supercritical coal ≈ 45 %, combined cycle ≈ 60 %, geothermal binary ≈ 12 %, ocean thermal ≈ 3 %), plotted against the working fluid's peak
//     temperature; they are illustrative, not a data set.
//   2.8 Curzon & Ahlborn, Am. J. Phys. 43, 22–24 (1975): the observed efficiencies of three plants in their comparison (West Thurrock
//     coal 565 °C / 25 °C, 36 %; Pickering CANDU 300 °C / 25 °C, 30 %; Larderello geothermal 250 °C / 80 °C, 16 %) are quoted from
//     memory of their table; the Carnot and Curzon–Ahlborn values are computed here from the temperatures.
//   2.10 The "second-law factor" 0.64 of the CHP model, the 540 °C steam temperature and 90 % boiler efficiency are illustrative assumptions.
//   2.11 The second-law efficiency 0.45 of the heat pump and the climate of the seasonal estimate (mean 9 °C, amplitude 8 K) are ILLUSTRATIVE.
//   2.6 Knock-limited compression ratios (8, 10, 12 for regular, premium and high-octane petrol) and the 30–35 % brake efficiency of
//     petrol engines are round numbers from memory.

import { clamp, lerp, K0, satT, satP, tsat, steamPT, dome, rankine, rankinePath, polyArea } from './ch02.shared.js';

const CP = 1.005, GAM = 1.4, RGAS = CP * (GAM - 1) / GAM, CV = CP / GAM; // air, kJ/(kg K)
const EC = 0.86, ET = 0.88; // illustrative isentropic efficiencies of compressor and turbine

/** Ideal-gas Brayton cycle: returns temperatures, specific works (kJ/kg) and efficiency. T in K. */
function brayton(r, T1, T3, ec = 1, et = 1) {
  const k = (GAM - 1) / GAM;
  const T2s = T1 * r ** k, T2 = T1 + (T2s - T1) / ec;
  const T4s = T3 / r ** k, T4 = T3 - et * (T3 - T4s);
  const wc = CP * (T2 - T1), wt = CP * (T3 - T4), w = wt - wc, qin = CP * (T3 - T2);
  return { r, T1, T2, T3, T4, T2s, T4s, wc, wt, w, qin, eta: w / qin, bwr: wc / wt };
}
/** Otto cycle polygon in (V/Vc, p/p1) with heat addition q̂ = q/(c_v T1). */
function ottoCycle(r, qh, g = GAM, n = 60) {
  const T2 = r ** (g - 1), T3 = T2 + qh, p2 = r ** g, p3 = p2 * T3 / T2;
  const P = [];
  for (let i = 0; i <= n; i++) { const V = lerp(r, 1, i / n); P.push([V, (V / r) ** -g]); } // compression 1→2 (V from r to 1)
  P.push([1, p3]);
  for (let i = 0; i <= n; i++) { const V = lerp(1, r, i / n); P.push([V, p3 * V ** -g]); } // expansion 3→4
  return { P, T2, T3, p2, p3, p4: p3 * r ** -g, eta: 1 - r ** (1 - g), q: qh };
}
function dieselCycle(r, qh, g = GAM, n = 60) {
  const T2 = r ** (g - 1), T3 = T2 + qh / g, rc = T3 / T2, p2 = r ** g;
  const P = [];
  for (let i = 0; i <= n; i++) { const V = lerp(r, 1, i / n); P.push([V, (V / r) ** -g]); }
  for (let i = 1; i <= 12; i++) P.push([lerp(1, rc, i / 12), p2]);
  for (let i = 0; i <= n; i++) { const V = lerp(rc, r, i / n); P.push([V, p2 * (V / rc) ** -g]); }
  const eta = 1 - r ** (1 - g) * (rc ** g - 1) / (g * (rc - 1));
  return { P, T2, T3, rc, p2, p3: p2, eta, q: qh };
}
const fx = (v, x, d = 1) => v.fix(x, d);
const pc1 = (v, x, d = 1) => `${v.fix(100 * x, d)} %`;

export default {
  collection: 'energy',
  chapter: 2,
  title: 'Heat engines and thermodynamic limits',
  summary: String.raw`Most of the world's electricity still comes from heat engines, and thermodynamics caps their efficiency at the Carnot limit set by the hot and cold reservoirs. The Rankine, Brayton, Otto and Diesel cycles are the practical approximations used in power stations, gas turbines and engines, and combining two cycles beats either alone. Running an engine for maximum power rather than maximum efficiency gives the Curzon–Ahlborn result, and exergy accounting, cogeneration and heat pumps show how to use heat wisely.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1', kind: 'Law', name: 'First law: energy balance of a device',
      statement: String.raw`Energy is conserved. For a device through whose boundary heat $\dot Q$ enters (positive) and shaft work $\dot W$ leaves (positive), and which is fed and drained by flows of matter, the steady-state balance is
$$\dot Q - \dot W = \sum_{\text{out}} \dot m\,(h + \tfrac12 V^2 + gz) - \sum_{\text{in}} \dot m\,(h + \tfrac12 V^2 + gz),$$
where $h$ is specific enthalpy. For a device that runs in a **cycle** (a heat engine) nothing accumulates, so the net heat taken in equals the net work given out, $Q_h - Q_c = W$. No machine can deliver more energy than it receives.`,
      idea: String.raw`The law is bookkeeping with a conserved quantity: the energy stored in the working fluid can change only by what crosses the control surface. Enthalpy $h = u + pv$ bundles the internal energy of a flowing fluid with the work needed to push it through the boundary, which is why turbines and boilers are balanced with $h$ rather than $u$. For a cycle the fluid returns to its start, so the stored energy has not changed and heat in, minus heat out, is work.`,
      caption: String.raw`Pick a device and move the sliders: the width of every arrow is proportional to its power, and the last arrow is always **computed** from the balance. Push the work of the heat engine above the heat it receives and the missing arrow turns red and points backwards: energy would have to come from nowhere.`,
      deps: ['pchem-2.1'],
      refs: ['Tester ch. 3'],
      tags: ['first law', 'energy balance'],
      scope: String.raw`Steady flow with negligible changes of kinetic and potential energy (the open-system forms); the cycle form is exact for any working fluid. Enthalpies of steam are IAPWS-IF97 values.`,
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 60], axes: false, height: 380, full: true });
        const mode = v.select('device', [{ value: 'cycle', label: 'heat engine (a cycle)' }, { value: 'turbine', label: 'steam turbine' }, { value: 'boiler', label: 'boiler' }], 'cycle', { onChange: () => vis() });
        const Qh = v.slider('heat in $Q_h$ (MW)', 20, 200, 100, { step: 1 });
        const Wc = v.slider('work out $W$ (MW)', 0, 220, 40, { step: 1 });
        const md = v.slider('steam flow $\\dot m$ (kg/s)', 10, 150, 80, { step: 1 });
        const hout = v.slider('exhaust enthalpy $h_{out}$ (kJ/kg)', 1900, 3500, 2090, { step: 10 });
        const loss = v.slider('heat loss through casing (MW)', 0, 10, 2, { step: 0.5 });
        const eb = v.slider('boiler efficiency', 0.6, 1, 0.9, { step: 0.01 });
        const vis = () => { const m = mode.value; Qh.el.hidden = Wc.el.hidden = m !== 'cycle'; md.el.hidden = m === 'cycle'; hout.el.hidden = loss.el.hidden = m !== 'turbine'; eb.el.hidden = m !== 'boiler'; };
        vis();
        const HIN = 3375.1, HF = 1085.7; // kJ/kg: 10 MPa 500 °C steam, 10 MPa 250 °C feed water (IF97)
        const flows = () => {
          const m = mode.value;
          if (m === 'cycle') return { ins: [{ lab: 'heat in  Q_h', val: Qh.value, col: 'orange', side: 'L' }], outs: [{ lab: 'work out  W', val: Wc.value, col: 'green', side: 'R' }, { lab: 'heat rejected  Q_c = Q_h − W', val: Qh.value - Wc.value, col: 'accent', side: 'B', derived: true }], note: 'cycle' };
          if (m === 'turbine') { const fin = md.value * HIN / 1000, fout = md.value * hout.value / 1000; return { ins: [{ lab: `steam in  ṁ·h = ${fx(v, fin, 0)} MW`, val: fin, col: 'orange', side: 'L' }], outs: [{ lab: `exhaust  ṁ·h_out`, val: fout, col: 'accent', side: 'R' }, { lab: 'casing loss', val: loss.value, col: 'red', side: 'B' }, { lab: 'shaft work  W = ṁ(h_in − h_out) − loss', val: fin - fout - loss.value, col: 'green', side: 'T', derived: true }], note: 'turbine' }; }
          const dh = md.value * (HIN - HF) / 1000, fuel = dh / eb.value;
          return { ins: [{ lab: 'fuel  Q', val: fuel, col: 'orange', side: 'L' }, { lab: 'feed water  ṁ·h_f', val: md.value * HF / 1000, col: 'accent', side: 'L' }], outs: [{ lab: 'steam  ṁ·h_s', val: md.value * HIN / 1000, col: 'green', side: 'R' }, { lab: 'stack and wall losses', val: fuel - dh, col: 'red', side: 'B', derived: true }], note: 'boiler' };
        };
        const arrow = (c, x0, y0, x1, y1, w, col, a = 0.85) => { // thick arrow from (x0,y0) to (x1,y1) in px, width w
          const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hw = Math.max(w, 10) * 0.9 + 6, hl = Math.min(L * 0.5, hw * 1.0);
          c.fillStyle = v.color(col, a); c.beginPath();
          c.moveTo(x0 + nx * w / 2, y0 + ny * w / 2); c.lineTo(x1 - ux * hl + nx * w / 2, y1 - uy * hl + ny * w / 2); c.lineTo(x1 - ux * hl + nx * hw / 2, y1 - uy * hl + ny * hw / 2); c.lineTo(x1, y1);
          c.lineTo(x1 - ux * hl - nx * hw / 2, y1 - uy * hl - ny * hw / 2); c.lineTo(x1 - ux * hl - nx * w / 2, y1 - uy * hl - ny * w / 2); c.lineTo(x0 - nx * w / 2, y0 - ny * w / 2); c.closePath(); c.fill();
        };
        let resid = 0, sumIn = 0, sumOut = 0, F = null;
        v.render(() => {
          F = flows(); const c = s.ctx, W = s.width, H = s.height;
          const tot = Math.max(F.ins.reduce((a, f) => a + Math.abs(f.val), 0), F.outs.reduce((a, f) => a + Math.abs(f.val), 0), 1);
          const k = Math.min(0.42 * H, 120) / tot; // px per MW for one flow = full height budget
          const bx0 = W * 0.36, bx1 = W * 0.64, by0 = H * 0.28, by1 = H * 0.7;
          c.save(); c.setLineDash([6, 4]); c.strokeStyle = v.color('muted'); c.lineWidth = 1.5; c.fillStyle = v.color('accent', 0.07);
          c.fillRect(bx0, by0, bx1 - bx0, by1 - by0); c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0); c.restore();
          s.textPx(F.note === 'cycle' ? 'engine: ΔE per cycle = 0' : F.note === 'turbine' ? 'control volume: turbine' : 'control volume: boiler', (bx0 + bx1) / 2, (by0 + by1) / 2, { size: 13, weight: 650, color: 'muted', align: 'center' });
          const sideFlows = (side) => [...F.ins, ...F.outs].filter((f) => f.side === side);
          for (const side of ['L', 'R', 'T', 'B']) {
            const fl = sideFlows(side); if (!fl.length) continue;
            const ws = fl.map((f) => Math.max(Math.abs(f.val) * k, 1.5)), gap = 10, tw = ws.reduce((a, b) => a + b, 0) + gap * (fl.length - 1);
            const horiz = side === 'L' || side === 'R';
            let pos = (horiz ? (by0 + by1) / 2 : (bx0 + bx1) / 2) - tw / 2;
            fl.forEach((f, i) => {
              const w = ws[i], mid = pos + w / 2; pos += w + gap;
              const neg = f.val < -1e-9, isIn = F.ins.includes(f);
              const col = neg ? 'red' : f.col;
              let x0, y0, x1, y1, lx, ly, al;
              if (side === 'L') { x0 = 6; y0 = mid; x1 = bx0; y1 = mid; lx = 8; ly = mid - w / 2 - 9; al = 'left'; }
              else if (side === 'R') { x0 = bx1; y0 = mid; x1 = W - 6; y1 = mid; lx = W - 8; ly = mid - w / 2 - 9; al = 'right'; }
              else if (side === 'T') { x0 = mid; y0 = by0; x1 = mid; y1 = 8; lx = mid + w / 2 + 8; ly = H * 0.14; al = 'left'; }
              else { x0 = mid; y0 = by1; x1 = mid; y1 = H - 26; lx = mid + w / 2 + 8; ly = by1 + (H - by1) / 2 - 2; al = 'left'; }
              if (isIn === (side === 'L')) {/* arrow points the natural way */ } // inputs point into the box, outputs away
              let ax0 = x0, ay0 = y0, ax1 = x1, ay1 = y1;
              if (side === 'L') { ax0 = x0; ax1 = x1; }
              if (neg) { [ax0, ax1] = [ax1, ax0]; [ay0, ay1] = [ay1, ay0]; }
              arrow(c, ax0, ay0, ax1, ay1, w, col);
              const val = `${fx(v, Math.abs(f.val), 1)} MW`;
              if (side === 'T') { s.textPx(f.lab.split('  ')[0], lx, ly - 10, { size: 12, weight: 650, color: col, align: al }); s.textPx(val + (neg ? ' (inwards!)' : ''), lx, ly + 6, { size: 12.5, weight: 700, color: col, align: al }); }
              else { s.textPx(`${f.lab}: ${val}${neg ? '  (negative: must come from nowhere)' : ''}`, lx, ly, { size: 12, weight: 600, color: col, align: al }); }
            });
          }
          sumIn = F.ins.reduce((a, f) => a + f.val, 0); sumOut = F.outs.reduce((a, f) => a + f.val, 0); resid = sumIn - sumOut;
        });
        v.readout(() => {
          const bad = F.outs.some((f) => f.val < -1e-9);
          const eta = mode.value === 'cycle' ? `\nEfficiency $W/Q_h = ${pc1(v, Wc.value / Qh.value)}$.` : mode.value === 'turbine' ? `\nThe turbine converts ${pc1(v, Math.max(0, F.outs[2].val) / F.ins[0].val)} of the incoming enthalpy flow into shaft work.` : `\nBoiler efficiency: ${pc1(v, eb.value)} of the fuel reaches the steam; the rest leaves as stack and wall losses.`;
          return `$\\sum$ in $= ${fx(v, sumIn, 1)}$ MW, $\\sum$ out $= ${fx(v, sumOut, 1)}$ MW, residual $= ${fx(v, resid, 1)}$ MW (always zero: the last, computed arrow is whatever the balance demands).${bad ? '\n**A negative flow means the assumed numbers violate the first law as stated: you cannot have that much output.**' : ''}${eta}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2', kind: 'Theorem', name: 'Carnot efficiency limit',
      statement: String.raw`A heat engine that takes heat $Q_h$ from a reservoir at absolute temperature $T_h$, rejects $Q_c$ to one at $T_c<T_h$, and delivers work $W = Q_h-Q_c$, has efficiency $\eta = W/Q_h$ bounded by
$$\eta \le \eta_C = 1-\frac{T_c}{T_h}.$$
Equality holds for a **reversible** engine, and every reversible engine between the same two reservoirs has exactly this efficiency, whatever its working substance. Temperatures are in kelvin.`,
      idea: String.raw`Run the cycle and count entropy: the reservoirs lose $Q_h/T_h$ and gain $Q_c/T_c$, so the second law $\Delta S\ge0$ requires $Q_c/T_c \ge Q_h/T_h$, that is $Q_c \ge Q_h T_c/T_h$, and then $W = Q_h - Q_c \le Q_h(1-T_c/T_h)$. On a temperature–entropy diagram a reversible cycle between two reservoirs is a rectangle: the area under the top edge is $Q_h = T_h\Delta S$, under the bottom edge $Q_c = T_c\Delta S$, and the enclosed area is the work.`,
      caption: String.raw`Left: drag the hot and cold edges of the rectangle (the cycle on the $T$–$S$ plane); the green enclosed area is the work, the orange area below it the rejected heat. Right: the Carnot curve for the current $T_c$ with typical plants as dots (all below it), and a gold handle for an inventor's claim: drag it above the curve and the entropy bookkeeping turns negative, which is what "impossible" means.`,
      deps: ['pchem-3.3', 'energy-2.1'],
      refs: ['Tester ch. 3'],
      tags: ['second law', 'carnot'],
      credit: 'Sadi Carnot, 1824; Kelvin and Clausius, 1850s',
      scope: String.raw`Any heat engine exchanging heat with just two reservoirs. Real engines use many temperatures, so their limit is that of the hottest and coldest reservoir they touch, and practical plants reach roughly half to two thirds of it.`,
      viz(v) {
        const DS = 1.0; // kJ/K per cycle in the picture
        const sA = v.stage({ x: [0, 1.6], y: [0, 1200], axes: 'box', gutter: true, height: 360, xlabel: 'entropy S (kJ/K)', ylabel: 'T (K)', title: 'Carnot cycle on a $T$–$S$ diagram' });
        const sB = v.stage({ x: [250, 2000], y: [0, 0.8], axes: 'box', gutter: true, height: 360, xlabel: 'hot temperature $T_h$ (K)', ylabel: 'efficiency', title: 'Efficiency against $T_h$' });
        const hTh = sA.handle(0.8, 800, { color: 'orange', r: 8, constrain: { x: [0.8, 0.8], y: [320, 1150] } });
        const hTc = sA.handle(0.8, 300, { color: 'accent', r: 8, constrain: { x: [0.8, 0.8], y: [150, 780] } });
        const claim = sB.handle(800, 0.5, { color: 'gold', r: 8, label: 'claim', labelPos: 'n', constrain: { x: [260, 1990], y: [0.02, 0.78] } });
        const plants = [['geothermal', 450, 0.12, 1], ['PWR nuclear', 560, 0.33, 1], ['coal', 810, 0.38, 1], ['ultra-supercritical coal', 890, 0.45, 1], ['combined cycle', 1750, 0.60, -1], ['ocean thermal', 300, 0.03, 1]];
        v.legend([['orange', 'heat rejected $Q_c$', { area: true }], ['green', 'work $W$', { area: true }], ['accent', 'Carnot limit'], ['gold', 'your claim'], ['purple', 'real plants (typical)', { dot: true }]]);
        v.render(() => {
          const Th = hTh.y, Tc = Math.min(hTc.y, Th - 40);
          sA.poly([[0.4, 0], [1.2, 0], [1.2, Tc], [0.4, Tc]], { fill: 'orange', fillAlpha: 0.28, stroke: false });
          sA.poly([[0.4, Tc], [1.2, Tc], [1.2, Th], [0.4, Th]], { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2 });
          sA.hline(Th, { color: 'orange', width: 1.5, dash: true }); sA.hline(Tc, { color: 'accent', width: 1.5, dash: true });
          sA.tex(String.raw`Q_h = T_h\Delta S`, 0.8, Th + 65, { color: 'orange', size: 14 });
          sA.tex(String.raw`T_h`, 1.42, Th + 55, { color: 'orange', size: 15 }); sA.tex(String.raw`T_c`, 1.42, Tc + 55, { color: 'accent', size: 15 });
          sA.tex(String.raw`W`, 0.8, (Th + Tc) / 2, { color: 'green', size: 18 });
          sA.tex(String.raw`Q_c = T_c\Delta S`, 0.8, Tc / 2, { color: 'ink', size: 14 });
          sA.corner(`$T_h = ${v.fix(Th, 0)}$ K,  $T_c = ${v.fix(Tc, 0)}$ K`, 'tl');
          hTc.set(0.8, Tc);
          const eC = 1 - Tc / Th;
          sB.fn((T) => 1 - Tc / T, { domain: [Math.max(251, Tc + 1), 2000], color: 'accent', width: 2.6 });
          sB.between((T) => 1 - Tc / T, () => 0.8, Math.max(251, Tc + 1), 2000, { fill: 'red', fillAlpha: 0.1 });
          sB.text('forbidden by the second law', 1500, 0.77, { color: 'red', size: 12, align: 'center' });
          sB.vline(Th, { color: 'orange', width: 1, dash: true });
          sB.dot(Th, eC, { r: 6, color: 'accent' });
          plants.forEach(([n, T, e, d]) => { sB.dot(T, e, { r: 5, color: 'purple' }); sB.text(n, T + d * 30, e - 0.035, { color: 'purple', size: 11.5, align: d > 0 ? 'left' : 'right', plate: true }); });
        });
        v.readout(() => {
          const Th = hTh.y, Tc = Math.min(hTc.y, Th - 40), eC = 1 - Tc / Th;
          const e = claim.y, Sgen = (1 - e) / Tc - 1 / claim.x; // entropy produced per unit Q_h, kJ/K per kJ
          const cC = 1 - Tc / claim.x;
          return `Carnot: $\\eta_C = 1 - T_c/T_h = ${pc1(v, eC)}$; area check $W/Q_h = ${fx(v, (Th - Tc) * DS, 0)}/${fx(v, Th * DS, 0)} = ${pc1(v, (Th - Tc) / Th)}$.\nClaim: a ${pc1(v, e, 0)} engine between ${v.fix(claim.x, 0)} K and the current $T_c$ (limit ${pc1(v, cC)}) produces entropy $\\Delta S = Q_c/T_c - Q_h/T_h = ${v.sci(Sgen * 1000, 2)}\\times10^{-3}$ per kJ of heat: ${Sgen >= -1e-12 ? '**allowed** ($\\Delta S\\ge 0$)' : '**impossible** ($\\Delta S<0$: the second law is violated)'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3', kind: 'Model', name: 'Rankine cycle',
      statement: String.raw`The Rankine cycle is the working cycle of a steam power station. Liquid water leaves the condenser (state 1) and is pumped to boiler pressure (2); it is heated at constant pressure, boiled and superheated (3); it expands through the turbine to condenser pressure (4), and condenses back to liquid (1). Per kilogram of water the net work and efficiency are
$$w = (h_3-h_4) - (h_2-h_1),\qquad \eta = \frac{w}{h_3-h_2}.$$
For the ideal cycle the expansion is isentropic, $s_4=s_3$; with turbine isentropic efficiency $\eta_t<1$ the work is $h_3-h_4 = \eta_t(h_3-h_{4s})$. Raising the boiler pressure and temperature, or lowering the condenser pressure, raises $\eta$.`,
      idea: String.raw`On a $T$–$s$ diagram heat is the area under each path, so the efficiency is the enclosed area divided by the area under the heating curve. The pump works on an incompressible liquid and costs only $v\,\Delta p$, tiny next to the turbine's work: that is the virtue of condensing the steam. Raising the mean temperature of heat addition (higher pressure, more superheat) or lowering the heat-rejection temperature (lower condenser pressure) widens the area, the same Carnot reasoning applied to a fluid that is not at one temperature.`,
      caption: String.raw`Move the boiler pressure, steam temperature, condenser pressure and turbine efficiency: states 1 to 4 follow on the $T$–$s$ diagram, with the vapour dome in grey. The right panel sweeps boiler pressure for three steam temperatures against the Carnot limit. Lower the condenser pressure or raise the pressure at fixed temperature and watch the exhaust become wet: steam below about 88 % dryness erodes turbine blades.`,
      deps: ['energy-2.2', 'pchem-4.1'],
      refs: ['Tester ch. 8'],
      tags: ['steam', 'power cycle'],
      credit: 'William Rankine, 1859',
      scope: String.raw`Steady-flow ideal cycle with a single reheat-free expansion; steam properties are IAPWS-IF97. Real plants add reheat, regenerative feed-water heating and supercritical pressure, taking efficiency from the 40 % of this simple cycle towards 45 %.`,
      viz(v) {
        const D = dome();
        const sA = v.stage({ x: [0, 9.6], y: [0, 650], axes: 'box', gutter: true, height: 400, xlabel: 'entropy s (kJ/kg·K)', ylabel: 'T (°C)', title: 'Water through pump, boiler, turbine and condenser' });
        const sB = v.stage({ x: [0.5, 22], y: [0, 0.6], axes: 'box', gutter: true, height: 400, xlabel: 'boiler pressure (MPa)', ylabel: 'efficiency', title: 'Efficiency against boiler pressure' });
        const pb = v.slider('boiler pressure (MPa)', 0.5, 21, 10, { step: 0.1 });
        const tm = v.slider('steam temperature (°C)', 200, 620, 500, { step: 5 });
        const pcn = v.slider('condenser pressure (kPa)', 4, 100, 10, { log: true, sig: 2 });
        const et = v.slider('turbine efficiency $\\eta_t$', 0.7, 1, 1, { step: 0.01 });
        v.legend([['accent', 'cycle'], ['gold', 'state points'], ['red', 'Carnot between the same extremes', { dash: true }], ['purple', 'other steam temperatures', { dash: true }]]);
        const R0 = () => rankine(pb.value, pcn.value / 1000, tm.value, et.value);
        v.render(() => {
          const R = R0(), Pth = rankinePath(R), ideal = et.value >= 0.999;
          sA.poly(D.all, { fill: 'muted', fillAlpha: 0.1, color: 'muted', width: 1.5 });
          sA.text('liquid', 0.7, 150, { color: 'muted', size: 12 }); sA.text('wet steam', 4.4, 130, { color: 'muted', size: 12, align: 'center' }); sA.text('dry vapour', 8.4, 240, { color: 'muted', size: 12, align: 'center' });
          const loop = [...Pth.econ, ...Pth.boil, ...Pth.sup, ...(ideal ? [[R.s3, R.t4s ?? R.t4]] : []), [R.s4, R.t4], ...Pth.cond.slice(0, -1)];
          const area = Pth.econ.concat(Pth.boil, Pth.sup, [[R.s4, R.t4]], Pth.cond).map(([s, T]) => [s, T]);
          sA.poly(area, { fill: 'accent', fillAlpha: 0.18, stroke: false });
          sA.path(Pth.econ.concat(Pth.boil, Pth.sup), { color: 'accent', width: 3 });
          sA.path(Pth.exp, { color: 'accent', width: 3, dash: !ideal });
          if (!ideal) { const hs = R.h3 - 0; sA.path([[R.s3, R.t3], [R.s3, rankine(pb.value, pcn.value / 1000, tm.value, 1).t4]], { color: 'faint', width: 1.5, dash: true }); }
          sA.path(Pth.cond, { color: 'accent', width: 3 });
          sA.path([[R.s1, R.c.t], [R.s1, R.c.t + 0.1]], { color: 'accent', width: 3 });
          const lab = (n, s, T, pos) => sA.dot(s, T, { r: 5.5, color: 'gold', label: n, labelPos: pos });
          lab('1', R.s1, R.c.t, 'sw'); lab('2', R.s1 + 0.12, R.c.t + 18, 'ne'); lab('3', R.s3, R.t3, 'ne'); lab('4', R.s4, R.t4, 'se');
          // right panel
          const ps = []; for (let i = 0; i <= 40; i++) ps.push(lerp(0.5, 21.5, i / 40));
          for (const dT of [-100, 100]) { const T = clamp(tm.value + dT, 200, 620); sB.path(ps.map((p) => [p, rankine(p, pcn.value / 1000, T, et.value).eta]), { color: 'purple', width: 1.6, dash: true }); }
          sB.path(ps.map((p) => [p, rankine(p, pcn.value / 1000, tm.value, et.value).eta]), { color: 'accent', width: 3 });
          sB.path(ps.map((p) => [p, rankine(p, pcn.value / 1000, tm.value, 1).carnot]), { color: 'red', width: 1.6, dash: true });
          sB.dot(pb.value, R.eta, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const R = R0(), Pth = rankinePath(R);
          const A = polyArea(Pth.econ.concat(Pth.boil, Pth.sup, [[R.s4, R.t4]], Pth.cond).map(([s, T]) => [s, T + K0]));
          const wet = R.x4 < 0.88 ? ` — **wet exhaust** ($x_4<0.88$: blade erosion)` : '';
          return `$\\eta = (w_t - w_p)/q_{in} = (${fx(v, R.wt, 0)} - ${fx(v, R.wp, 1)})/${fx(v, R.qin, 0)} = ${pc1(v, R.eta)}$ against Carnot ${pc1(v, R.carnot)} between ${v.fix(R.t3, 0)} °C and ${v.fix(R.c.t, 0)} °C.\nExhaust dryness $x_4 = ${v.fix(R.x4, 3)}$${wet}; condenser at ${v.fix(R.c.t, 1)} °C. Net work $${fx(v, R.w, 0)}$ kJ/kg${et.value >= 0.999 ? `; enclosed area $\\oint T\\,ds = ${fx(v, Math.abs(A), 0)}$ kJ/kg (equal up to the small pump/economiser approximation).` : '.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4', kind: 'Model', name: 'Brayton cycle',
      statement: String.raw`The Brayton cycle is the ideal cycle of a gas turbine: air is compressed adiabatically (1→2), heated at constant pressure in the combustor (2→3), expanded adiabatically through the turbine (3→4) and exhausted (4→1, closed in the ideal cycle by constant-pressure cooling). For a perfect gas with ratio of specific heats $\gamma$ and pressure ratio $r=p_2/p_1$,
$$\eta = 1 - r^{-(\gamma-1)/\gamma},$$
independent of the turbine inlet temperature $T_3$. The net work per kilogram, however, is $c_p\bigl[(T_3-T_4)-(T_2-T_1)\bigr]$, which rises and then falls with $r$ and is largest at $r_{\rm opt} = (T_3/T_1)^{\gamma/[2(\gamma-1)]}$ (ideal components). With real compressor and turbine efficiencies the efficiency too has a maximum at a finite $r$.`,
      idea: String.raw`Along an adiabat $T\propto p^{(\gamma-1)/\gamma}$, so compression and expansion both change the temperature by the same factor $r^{(\gamma-1)/\gamma}$, and the ratio of rejected to added heat is $T_1/T_2$: the efficiency depends on $r$ alone. The turbine produces work $c_p(T_3-T_4)$ and the compressor absorbs $c_p(T_2-T_1)$; at $r=1$ both vanish and at $r=r_{\rm opt}$ the gap is widest, while at very high $r$ the compressor swallows everything the turbine makes. Hotter $T_3$ moves the work peak to higher pressure ratios, which is why turbine blade metallurgy drives efficiency.`,
      caption: String.raw`Drag the gold handle along the efficiency curve (or use the sliders) to set the pressure ratio; the $T$–$s$ diagram shows the cycle with the ideal one in grey when real components are selected. Watch efficiency keep climbing with $r$ in the ideal case while the work (gold curve) peaks, and see the back-work ratio (compressor work over turbine work) grow.`,
      deps: ['energy-2.2', 'aero-7.5'],
      refs: ['Tester ch. 8'],
      tags: ['gas turbine', 'power cycle'],
      credit: 'George Brayton, 1870 (constant-pressure engine); Joule',
      scope: String.raw`Air-standard analysis: perfect gas with constant $c_p$ (1.005 kJ/kg·K), $\gamma=1.4$, no pressure losses, no turbine cooling flows. Real machines are a few percentage points below these numbers; the "real" setting uses isentropic efficiencies of 0.86 (compressor) and 0.88 (turbine), illustrative round numbers.`,
      viz(v) {
        const T1 = 288.15;
        const sA = v.stage({ x: [-0.15, 2.0], y: [200, 2100], axes: 'box', gutter: true, height: 380, xlabel: 'entropy s − s₁ (kJ/kg·K)', ylabel: 'T (K)', title: 'Gas turbine on a $T$–$s$ diagram' });
        const sB = v.stage({ x: [1.5, 60], y: [0, 0.8], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'pressure ratio $r$', ylabel: 'η   and   w/(cₚT₃)', title: 'Efficiency and work against $r$' });
        const rS = v.slider('pressure ratio $r$', 1.5, 60, 15, { log: true, sig: 3, onChange: () => 0 });
        const T3 = v.slider('turbine inlet temperature $T_3$ (K)', 1000, 2000, 1600, { step: 10 });
        const mode = v.select('components', [{ value: 'ideal', label: 'ideal' }, { value: 'real', label: 'real (η_c = 0.86, η_t = 0.88)' }], 'ideal');
        const comp = () => (mode.value === 'real' ? [0.86, 0.88] : [1, 1]);
        const B = (r) => { const [a, b] = comp(); return brayton(r, T1, T3.value, a, b); };
        const h = sB.handle(15, 0.4, { color: 'gold', r: 8, constrain: (x) => { const r = clamp(x, 1.5, 60); return [r, Math.max(0, B(r).eta)]; } });
        h.onDrag = () => rS.set(h.x);
        v.legend([['accent', 'efficiency'], ['gold', 'net work / $(c_pT_3)$'], ['faint', 'ideal efficiency', { dash: true }], ['red', '$r_{opt}$ (max work, ideal)', { dash: true }]]);
        const sOf = (T, r) => CP * Math.log(T / T1) - RGAS * Math.log(r);
        v.render(() => {
          const r = rS.value, b = B(r), id = brayton(r, T1, T3.value), real = mode.value === 'real';
          const draw = (c, col, w, dash) => {
            const s2 = sOf(c.T2, 1), s3 = sOf(c.T3, r), s4 = sOf(c.T4, 1);
            const heat = [], rej = []; for (let i = 0; i <= 30; i++) { const T = lerp(c.T2, c.T3, i / 30); heat.push([sOf(T, r), T]); const T4 = lerp(c.T4, c.T1, i / 30); rej.push([sOf(T4, 1), T4]); }
            return { pts: [[0, c.T1], [s2, c.T2], ...heat, [s4, c.T4], ...rej.slice(1)], heat, rej, s2, s3, s4 };
          };
          const P = draw(b);
          if (real) { const Q = draw(id); sA.path(Q.pts, { color: 'faint', width: 2, dash: true }); }
          sA.poly(P.pts, { fill: 'accent', fillAlpha: 0.2, stroke: false });
          sA.path([[0, T1], [P.s2, b.T2]], { color: 'accent', width: 3 }); sA.path(P.heat, { color: 'orange', width: 3 });
          sA.path([[P.s3, b.T3], [P.s4, b.T4]], { color: 'accent', width: 3 }); sA.path(P.rej, { color: 'teal', width: 3 });
          sA.text('compressor', P.s2 / 2 - 0.05, (T1 + b.T2) / 2 + 60, { color: 'accent', size: 12, align: 'right' });
          sA.text('combustor, heat in', (P.heat[15][0]) + 0.05, P.heat[15][1] - 30, { color: 'orange', size: 12, align: 'left' });
          sA.text('turbine', P.s4 + 0.04, (b.T3 + b.T4) / 2 + 40, { color: 'accent', size: 12, align: 'left' });
          sA.text('exhaust, heat out', P.rej[15][0] + 0.06, P.rej[15][1] - 5, { color: 'teal', size: 12, align: 'left' });
          [['1', 0, b.T1, 'nw'], ['2', P.s2, b.T2, 'nw'], ['3', P.s3, b.T3, 'ne'], ['4', P.s4, b.T4, 'se']].forEach(([n, s, T, p]) => sA.dot(s, T, { r: 5, color: 'gold', label: n, labelPos: p }));
          // right panel
          const rs = []; for (let i = 0; i <= 80; i++) rs.push(Math.exp(lerp(Math.log(1.5), Math.log(60), i / 80)));
          sB.path(rs.map((x) => [x, 1 - x ** -((GAM - 1) / GAM)]), { color: 'faint', width: 1.6, dash: true });
          const e = [], w = []; for (const x of rs) { const o = B(x); e.push(o.w > 0 ? [x, o.eta] : null); w.push(o.w > 0 ? [x, o.w / (CP * T3.value)] : null); }
          sB.path(e, { color: 'accent', width: 3 }); sB.path(w, { color: 'gold', width: 3 });
          const ropt = (T3.value / T1) ** (GAM / (2 * (GAM - 1)));
          if (ropt < 60) { sB.vline(ropt, { color: 'red', width: 1.4, dash: true }); }
          h.set(r, Math.max(0, b.eta));
        });
        v.readout(() => {
          const r = rS.value, b = B(r), id = brayton(r, T1, T3.value), ropt = (T3.value / T1) ** (GAM / (2 * (GAM - 1)));
          return `$\\eta = w/q_{in} = ${fx(v, b.w, 0)}/${fx(v, b.qin, 0)} = ${pc1(v, b.eta)}$; the formula $1-r^{-(\\gamma-1)/\\gamma} = ${pc1(v, id.eta)}$ is for ideal components.\nTurbine ${fx(v, b.wt, 0)} kJ/kg, compressor ${fx(v, b.wc, 0)} kJ/kg: back-work ratio ${pc1(v, b.bwr, 0)}. Exhaust at ${v.fix(b.T4, 0)} K. Maximum work at $r_{opt} = (T_3/T_1)^{\\gamma/2(\\gamma-1)} = ${fx(v, ropt, 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5', kind: 'Model', name: 'Combined-cycle power plant',
      statement: String.raw`In a combined-cycle plant the hot exhaust of a gas turbine (a topping Brayton cycle with efficiency $\eta_1$) raises steam in a heat-recovery boiler that drives a Rankine bottoming cycle of efficiency $\eta_2$. If all of the exhaust heat could be used, the overall efficiency would be
$$\eta_{cc} = 1-(1-\eta_1)(1-\eta_2) = \eta_1 + (1-\eta_1)\,\eta_2.$$
In practice only the fraction $\varepsilon$ of the exhaust heat between the turbine outlet and the stack temperature is recovered and the steam temperature is limited by the exhaust temperature, so $\eta_{cc}=\eta_1+(1-\eta_1)\,\varepsilon\,\eta_2$ with $\eta_2$ evaluated at the available steam temperature. Modern plants reach about 60 %.`,
      idea: String.raw`A gas turbine takes heat at 1500 K or more but rejects it at 800 K or more, which wastes most of the temperature range; a steam cycle works well from about 600 K down to ambient. Putting them in series lets each operate in the range where it is efficient: the topping cycle's rejected heat is exactly the bottoming cycle's input, so the fractions of fuel energy that are not turned into work multiply, $(1-\eta_1)(1-\eta_2)$. The hotter the exhaust, the better the steam conditions the bottoming cycle can use.`,
      caption: String.raw`Left: where 100 units of fuel energy go, row by row (gas turbine, steam turbine, stack). Raise the turbine inlet temperature or the pressure ratio and the exhaust, hence the steam, becomes hotter. Right: efficiency against inlet temperature for the gas turbine alone and for the combined plant; the dashed line is the ideal formula if every joule of exhaust heat were usable.`,
      deps: ['energy-2.3', 'energy-2.4'],
      refs: ['Tester ch. 8'],
      tags: ['combined cycle', 'power plant'],
      scope: String.raw`A single-pressure heat-recovery boiler with a simple Rankine bottoming cycle (condenser at 7 kPa, turbine efficiency 0.88, pump 0.85) and an air-standard gas turbine without cooling-air or pressure losses. Real multi-pressure plants recover more, real turbines lose more; the net numbers are of the right size but not a plant model.`,
      viz(v) {
        const T1 = 288.15;
        const sA = v.stage({ x: [0, 100], y: [0, 4.6], axes: false, height: 400, title: 'Where 100 units of fuel energy go' });
        const sB = v.stage({ x: [1000, 2000], y: [0, 0.8], axes: 'box', gutter: true, height: 400, xlabel: 'turbine inlet temperature $T_3$ (K)', ylabel: 'efficiency', title: 'Efficiency against $T_3$' });
        const rS = v.slider('pressure ratio $r$', 6, 40, 18, { step: 0.5 });
        const T3 = v.slider('turbine inlet $T_3$ (K)', 1000, 2000, 1600, { step: 10 });
        const Tst = v.slider('stack temperature (°C)', 60, 200, 100, { step: 5 });
        const pinch = v.slider('steam / exhaust gap (K)', 20, 120, 50, { step: 5 });
        const pbS = v.slider('steam pressure (MPa)', 2, 18, 12, { step: 0.5 });
        const plant = (r, T3v) => {
          const g = brayton(r, T1, T3v, 0.86, 0.88);
          const eps = clamp((g.T4 - (Tst.value + K0)) / (g.T4 - T1), 0, 1);
          const tsteam = Math.min(g.T4 - K0 - pinch.value, 600);
          let pb = pbS.value; while (pb > 0.3 && tsat(pb) > tsteam - 25) pb *= 0.97;
          const ok = tsteam > 150;
          const R = ok ? rankine(pb, 0.007, tsteam, 0.88, 0.85) : null;
          const e2 = R ? R.eta : 0;
          const gtw = g.eta, st = (1 - gtw) * eps * e2;
          return { g, eps, tsteam, pb, R, e2, gt: gtw, st, tot: gtw + st, ideal: gtw + (1 - gtw) * e2, exh: 1 - gtw, stack: (1 - gtw) * (1 - eps), cond: (1 - gtw) * eps * (1 - e2) };
        };
        v.legend([['accent', 'gas-turbine work', { area: true }], ['green', 'steam-turbine work', { area: true }], ['orange', 'exhaust heat', { area: true }], ['red', 'lost to stack', { area: true }], ['teal', 'condenser', { area: true }]]);
        v.render(() => {
          const P = plant(rS.value, T3.value), X = (f) => 100 * f;
          const row = (y, parts, h = 0.62) => { let x = 0; for (const [f, col, lab, x0] of parts) { const a = x0 ?? x; sA.rect(a, y, a + X(f), y + h, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 }); if (X(f) > 14) sA.text(`${lab} ${v.fix(X(f), 1)}`, a + X(f) / 2, y + h / 2, { size: 12, weight: 600, align: 'center', baseline: 'middle' }); x = a + X(f); } };
          row(3.6, [[1, 'ink', 'fuel']]);
          row(2.6, [[P.gt, 'accent', 'GT work'], [P.exh, 'orange', 'exhaust']]);
          const x0 = X(P.gt);
          row(1.6, [[P.st, 'green', 'ST', x0], [P.cond, 'teal', 'cond.', x0 + X(P.st)], [P.stack, 'red', 'stack', x0 + X(P.st + P.cond)]]);
          row(0.4, [[P.tot, 'green', 'total work'], [1 - P.tot, 'muted', 'rejected']]);
          const lab = (t, y) => sA.text(t, 1, y, { size: 11.5, color: 'muted', align: 'left' });
          lab('fuel', 4.35); lab('gas turbine (topping cycle)', 3.35); lab('steam cycle fed by the exhaust (bottoming cycle)', 2.35); lab('whole plant', 1.15);
          const Ts = []; for (let T = 1000; T <= 2000; T += 25) Ts.push(T);
          sB.path(Ts.map((t) => [t, plant(rS.value, t).tot]), { color: 'green', width: 3 });
          sB.path(Ts.map((t) => [t, plant(rS.value, t).ideal]), { color: 'green', width: 1.8, dash: true });
          sB.path(Ts.map((t) => [t, plant(rS.value, t).gt]), { color: 'accent', width: 3 });
          sB.hline(0.62, { color: 'muted', width: 1, dash: true }); sB.text('best commercial plants ≈ 60–63 %', 1010, 0.645, { size: 11.5, color: 'muted', align: 'left' });
          sB.dot(T3.value, P.tot, { r: 6, color: 'gold' }); sB.dot(T3.value, P.gt, { r: 6, color: 'gold' });
          sB.text('combined cycle', 1990, P.tot - 0.04, { color: 'green', size: 12, align: 'right' }); sB.text('gas turbine alone', 1990, 0.27, { color: 'accent', size: 12, align: 'right' });
          sB.legend && 0;
        });
        v.readout(() => {
          const P = plant(rS.value, T3.value);
          return `Gas turbine: $\\eta_1 = ${pc1(v, P.gt)}$, exhaust at ${v.fix(P.g.T4 - K0, 0)} °C, so steam at ${P.R ? v.fix(P.tsteam, 0) : '—'} °C and ${P.R ? v.fix(P.pb, 1) : '—'} MPa gives $\\eta_2 = ${pc1(v, P.e2)}$; heat recovered down to the stack: $\\varepsilon = ${pc1(v, P.eps, 0)}$.\nCombined: $\\eta_{cc} = \\eta_1 + (1-\\eta_1)\\,\\varepsilon\\,\\eta_2 = ${pc1(v, P.tot)}$ (ideal formula with $\\varepsilon=1$: ${pc1(v, P.ideal)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6', kind: 'Model', name: 'Otto cycle',
      statement: String.raw`The Otto cycle is the ideal cycle of a spark-ignition engine: adiabatic compression of the charge from volume $V_1$ to $V_2=V_1/r$ (1→2), heat addition at constant volume (2→3), adiabatic expansion back to $V_1$ (3→4) and heat rejection at constant volume (4→1). For a perfect gas with ratio of specific heats $\gamma$,
$$\eta = 1 - r^{\,1-\gamma},\qquad r = V_1/V_2,$$
independent of the amount of heat added. Efficiency therefore rises with the compression ratio $r$, but real petrol engines are limited by **knock** (spontaneous ignition of the end gas) to $r\approx 8$–$12$.`,
      idea: String.raw`On the adiabats $TV^{\gamma-1}$ is constant, so the temperature ratio across compression equals that across expansion, $T_2/T_1=T_3/T_4=r^{\gamma-1}$. The heat added and rejected are both proportional to temperature differences at constant volume, $c_v(T_3-T_2)$ and $c_v(T_4-T_1)$, and their ratio is therefore $T_1/T_2$. A larger compression ratio makes the mean temperature at which heat is taken in higher relative to the temperature at which it is rejected.`,
      caption: String.raw`Drag the compression ratio and the heat added; the $p$–$V$ loop is computed from the adiabats and the efficiency is read off its **area** divided by the heat in (the readout compares it with the formula). On the right, the efficiency curve with the knock limit of the chosen fuel shaded red and the 30–35 % that real petrol engines achieve in green; change $\gamma$ to the lower value of a hot fuel–air mixture and the curve drops.`,
      deps: ['energy-2.2', 'pchem-2.7'],
      refs: ['Tester ch. 17'],
      tags: ['internal combustion', 'power cycle'],
      credit: 'Nikolaus Otto, 1876',
      scope: String.raw`Air-standard analysis (a perfect gas, instantaneous heat addition, no friction or heat loss). The knock limits shown (8, 10, 12 for regular, premium and high-octane fuel) are round illustrative values; real limits depend on the engine design.`,
      viz(v) {
        const sA = v.stage({ x: [0, 17], y: [0, 100], axes: 'box', gutter: true, height: 380, xlabel: 'volume $V/V_2$', ylabel: 'pressure $p/p_1$', title: 'Otto cycle: $p$–$V$' });
        const sB = v.stage({ x: [2, 20], y: [0, 0.8], axes: 'box', gutter: true, height: 380, xlabel: 'compression ratio $r$', ylabel: 'efficiency', title: 'Efficiency against compression ratio' });
        const rS = v.slider('compression ratio $r$', 3, 20, 10, { step: 0.1 });
        const qS = v.slider('heat added $q/(c_vT_1)$', 2, 10, 5, { step: 0.1 });
        const gS = v.select('working fluid', [{ value: '1.4', label: 'air, $\\gamma=1.4$' }, { value: '1.3', label: 'hot mixture, $\\gamma=1.3$' }, { value: '1.2', label: '$\\gamma=1.2$' }], '1.4');
        const oS = v.select('fuel', [{ value: '8', label: 'regular' }, { value: '10', label: 'premium' }, { value: '12', label: 'high-octane' }], '10');
        v.legend([['accent', 'cycle'], ['red', 'knock region', { area: true }], ['green', 'real engines, 30–35 %', { area: true }], ['faint', '$\\gamma = 1.4$', { dash: true }]]);
        v.render(() => {
          const g = +gS.value, C = ottoCycle(rS.value, qS.value, g), rk = +oS.value;
          sA.setView([0, 17], [0, Math.max(30, C.p3 * 1.12)]);
          sA.poly(C.P, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 3 });
          const r = rS.value;
          [['1', r, 1, 'e'], ['2', 1, C.p2, 'ne'], ['3', 1, C.p3, 'ne'], ['4', r, C.p4, 'ne']].forEach(([n, x, y, p]) => sA.dot(x, y, { r: 5, color: 'gold', label: n, labelPos: p }));
          sA.text('compression', 5.5, C.p2 * 0.45 + 2, { size: 12, color: 'accent', align: 'center' }); sA.text('expansion', 5.5, C.p3 * 0.45, { size: 12, color: 'accent', align: 'center' });
          sA.corner(`$Q_{in}$ at constant volume`, 'tr', { color: 'orange' });
          sB.vband(rk, 20, { color: 'red', alpha: 0.1 }); sB.vline(rk, { color: 'red', width: 1.5 }); sB.text('knock', (rk + 20) / 2, 0.74, { color: 'red', size: 12, align: 'center' });
          sB.hband(0.30, 0.35, { color: 'green', alpha: 0.16 });
          sB.fn((x) => 1 - x ** (1 - 1.4), { color: 'faint', width: 1.8, dash: true });
          sB.fn((x) => 1 - x ** (1 - g), { color: 'accent', width: 3 });
          sB.dot(r, C.eta, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const g = +gS.value, C = ottoCycle(rS.value, qS.value, g), rk = +oS.value;
          const W = Math.abs(polyArea(C.P)), Qin = qS.value * rS.value / (g - 1);
          return `Area of the loop $W/(p_1V_2) = ${fx(v, W, 1)}$, heat in $Q = c_v(T_3-T_2) = ${fx(v, Qin, 1)}$ (same units), so $\\eta = ${pc1(v, W / Qin)}$; the formula $1-r^{1-\\gamma} = ${pc1(v, C.eta)}$.\nPeak temperature $T_3 = ${fx(v, C.T3, 1)}\\,T_1$, peak pressure $${fx(v, C.p3, 0)}\\,p_1$. ${rS.value > rk ? '**Above the knock limit of this fuel: the end gas would auto-ignite.**' : `Below the knock limit ($r<${rk}$).`}`;
        });
      },
    },
//@@ITEMS@@
  ],
};
