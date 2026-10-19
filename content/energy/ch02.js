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
//     coal 565 °C / 25 °C, 36 %; Pickering CANDU 300 °C / 25 °C, 30 %; Larderello geothermal 250 °C / 80 °C, 16 %) agree with the table as reproduced in secondary sources (Wikipedia, Endoreversible thermodynamics: West Thurrock 0.36, CANDU 0.30, Larderello 0.16; the 'Pickering' label for the CANDU plant is from memory of the paper); the Carnot and Curzon–Ahlborn values are computed here from the temperatures.
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
          if (m === 'turbine') { const fin = md.value * HIN / 1000, fout = md.value * hout.value / 1000; return { ins: [{ lab: "steam in  ṁ·h_in", val: fin, col: 'orange', side: 'L' }], outs: [{ lab: `exhaust  ṁ·h_out`, val: fout, col: 'accent', side: 'R' }, { lab: 'casing loss', val: loss.value, col: 'red', side: 'B' }, { lab: 'shaft work  W = ṁ(h_in − h_out) − loss', val: fin - fout - loss.value, col: 'green', side: 'T', derived: true }], note: 'turbine' }; }
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
      deps: ['energy-2.2', 'pchem-4.1', 'thermo-4.17'],
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
      deps: ['energy-2.2', 'aero-7.5', 'thermo-1.16'],
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
    // ───────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7', kind: 'Model', name: 'Diesel cycle',
      statement: String.raw`The Diesel cycle differs from the Otto cycle in how heat is added: air alone is compressed (ratio $r$), fuel is injected and burns at **constant pressure** until the volume has grown by the cut-off ratio $r_c=V_3/V_2$, and the cycle then continues with adiabatic expansion and constant-volume heat rejection. For a perfect gas
$$\eta_{\rm Diesel} = 1 - \frac{1}{r^{\gamma-1}}\;\frac{r_c^{\gamma}-1}{\gamma\,(r_c-1)}.$$
At the same compression ratio and heat input this is lower than the Otto efficiency $1-r^{1-\gamma}$ (the bracket exceeds 1), but because only air is compressed there is no knock and the diesel can use $r\approx 15$–$20$; at equal **peak pressure** the diesel cycle is the more efficient one.`,
      idea: String.raw`Adding heat while the piston is already moving down means part of the heat is taken in at a lower mean temperature than in the Otto cycle at the same compression ratio, so for equal $r$ the Otto cycle wins; the factor $(r_c^\gamma-1)/[\gamma(r_c-1)]\ge1$ measures the loss. The practical advantage is not thermodynamic ingenuity but a different constraint: a spark-ignition engine is limited by knock of the premixed charge, a compression-ignition engine by peak pressure of the structure, and under a peak-pressure limit the diesel can compress more and add heat later.`,
      caption: String.raw`Choose what is held equal: the compression ratio (Otto wins), the **peak pressure** (Diesel wins) or each engine at its own realistic compression ratio. Both loops carry the same heat per kilogram of air, drawn on the same $p$–$V$ axes; the readout computes each efficiency from the loop area and compares it with the formulas.`,
      deps: ['energy-2.6'],
      refs: ['Tester ch. 17'],
      tags: ['internal combustion', 'power cycle'],
      credit: 'Rudolf Diesel, 1892–97',
      scope: String.raw`Air-standard analysis with $\gamma=1.4$ for both cycles, equal heat input per kilogram of air; real diesel engines have a combustion process that is part constant-volume and part constant-pressure (the dual cycle) and lose heat to the cylinder walls.`,
      viz(v) {
        const sA = v.stage({ x: [0, 26], y: [0, 100], axes: 'box', gutter: true, height: 380, xlabel: 'volume $V/V_c$', ylabel: 'pressure $p/p_1$', title: 'Otto and Diesel cycles, same heat input' });
        const sB = v.stage({ x: [4, 26], y: [0.3, 0.8], axes: 'box', gutter: true, height: 380, xlabel: 'compression ratio $r$', ylabel: 'efficiency', title: 'Efficiency against compression ratio' });
        const mode = v.select('hold equal', [{ value: 'r', label: 'compression ratio' }, { value: 'p', label: 'peak pressure' }, { value: 'own', label: 'each at its own ratio' }], 'p', { onChange: () => { ro.el.hidden = mode.value !== 'own'; } });
        const rd = v.slider('Diesel compression ratio', 8, 25, 18, { step: 0.1 });
        const ro = v.slider('Otto compression ratio', 5, 14, 9, { step: 0.1 }); ro.el.hidden = true;
        const qS = v.slider('heat added $q/(c_vT_1)$', 2, 10, 5, { step: 0.1 });
        const solveO = (D, q) => { if (mode.value === 'r') return rd.value; if (mode.value === 'own') return ro.value; let a = 1.5, b = rd.value; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (m * (m ** (GAM - 1) + q) > D.p3 ? (b = m) : (a = m)); } return (a + b) / 2; };
        v.legend([['orange', 'Otto'], ['accent', 'Diesel'], ['gold', 'peak pressure', { dot: true }]]);
        v.render(() => {
          const q = qS.value, D = dieselCycle(rd.value, q), ro_ = solveO(D, q), O = ottoCycle(ro_, q);
          sA.setView([0, 26], [0, Math.max(30, 1.12 * Math.max(D.p3, O.p3))]);
          sA.poly(O.P, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 2.6 });
          sA.poly(D.P, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2.6 });
          sA.dot(1, O.p3, { r: 5.5, color: 'orange' }); sA.dot(D.rc, D.p3, { r: 5.5, color: 'accent' });
          sA.hline(D.p3, { color: 'faint', width: 1, dash: true });
          sA.text('Otto: heat at constant V', 3.5, O.p3 * 0.8, { color: 'orange', size: 12, align: 'left' });
          sA.text('Diesel: heat at constant p', D.rc + 2, D.p3 + 4, { color: 'accent', size: 12, align: 'left' });
          sB.fn((x) => 1 - x ** (1 - GAM), { color: 'orange', width: 2.6 });
          sB.path(Array.from({ length: 60 }, (_, i) => { const r = lerp(8, 26, i / 59); return [r, dieselCycle(r, q, GAM, 4).eta]; }), { color: 'accent', width: 2.6 });
          sB.dot(O.P[0][0], O.eta, { r: 6, color: 'orange' }); sB.dot(rd.value, D.eta, { r: 6, color: 'accent' });
          sB.text('Otto', 6, 1 - 6 ** (1 - GAM) - 0.04, { color: 'orange', size: 12 }); sB.text('Diesel', 14, dieselCycle(14, q, GAM, 4).eta - 0.05, { color: 'accent', size: 12 });
        });
        v.readout(() => {
          const q = qS.value, D = dieselCycle(rd.value, q), ro_ = solveO(D, q), O = ottoCycle(ro_, q);
          const Q = (r) => q * r / (GAM - 1);
          const eD = Math.abs(polyArea(D.P)) / Q(rd.value), eO = Math.abs(polyArea(O.P)) / Q(ro_);
          return `**Otto** $r=${fx(v, ro_, 1)}$: $\\eta = ${pc1(v, eO)}$ (formula ${pc1(v, O.eta)}), peak pressure $${fx(v, O.p3, 0)}\\,p_1$.\n**Diesel** $r=${fx(v, rd.value, 1)}$, cut-off $r_c = ${fx(v, D.rc, 2)}$: $\\eta = ${pc1(v, eD)}$ (formula ${pc1(v, D.eta)}), peak pressure $${fx(v, D.p3, 0)}\\,p_1$.\n${eD > eO ? '**Diesel is more efficient here.**' : '**Otto is more efficient here.**'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8', kind: 'Theorem', name: 'Curzon–Ahlborn efficiency at maximum power',
      statement: String.raw`Consider an engine that is internally reversible but exchanges heat with its reservoirs through finite thermal conductances (heat flow $=K\times$ temperature difference, the same $K$ on both sides). The working fluid is then at temperatures $T_h' < T_h$ and $T_c' > T_c$, and Carnot's efficiency applies only between those. The power output as a function of efficiency vanishes both at $\eta=0$ and at the Carnot value, so it has a maximum, at
$$\eta_{CA} = 1-\sqrt{T_c/T_h},$$
which is the efficiency at maximum power and depends only on the two reservoir temperatures.`,
      idea: String.raw`A reversible engine takes infinitely long per cycle, so its power is zero: to deliver power the fluid temperatures must differ from the reservoirs. Put $x = T_c'/T_h' = 1-\eta$ and use reversibility $Q_h/T_h' = Q_c/T_c'$ with $Q_h = K(T_h-T_h')$ and $Q_c = K(T_c'-T_c)$: the fluid temperatures follow, and the power $P = Q_h - Q_c = K\,(xT_h - T_c)(1-x)/(2x)$. Setting $dP/dx=0$ gives $x^2 = T_c/T_h$. Curzon and Ahlborn compared the result with real plants.`,
      caption: String.raw`Left: the power as a function of efficiency; drag the gold point and see the power fall to zero at the Carnot value on one side and at zero efficiency on the other. Middle: the temperatures the fluid actually works between — the bigger the power, the bigger the drops across the heat exchangers. Right: the real plants of Curzon and Ahlborn's table sit near the $\eta_{CA}$ value, not near the Carnot value.`,
      deps: ['energy-2.2', 'opt-1.4'],
      refs: ['Tester ch. 3'],
      tags: ['finite-time thermodynamics', 'maximum power'],
      credit: 'Curzon & Ahlborn, 1975 (earlier: Chambadal 1957, Novikov 1957)',
      scope: String.raw`An endoreversible engine: all irreversibility is in the heat transfer (linear law, equal conductances); friction, heat leaks and other losses are ignored. The agreement with power plants is approximate and, partly, a coincidence of the model.`,
      viz(v) {
        const PLANTS = [{ k: 'wt', n: 'coal', full: 'coal plant (West Thurrock)', Th: 565, Tc: 25, obs: 0.36 }, { k: 'ca', n: 'CANDU', full: 'CANDU nuclear (Pickering)', Th: 300, Tc: 25, obs: 0.30 }, { k: 'la', n: 'geothermal', full: 'geothermal (Larderello)', Th: 250, Tc: 80, obs: 0.16 }];
        const sA = v.stage({ x: [0, 0.7], y: [0, 0.18], axes: 'box', gutter: true, height: 340, xlabel: 'efficiency $\\eta$', ylabel: 'power / $(K\\,T_h)$', title: 'Power against efficiency', minWidth: 300 });
        const sB = v.stage({ x: [0, 4.4], y: [0, 1200], axes: 'box', gutter: true, height: 340, ylabel: 'T (K)', title: 'Temperatures along the way', xticks: [[0.75, 'source'], [1.75, 'fluid hot'], [2.75, 'fluid cold'], [3.75, 'sink']], minWidth: 300 });
        const sC = v.stage({ x: [0.4, 3.6], y: [0, 0.7], axes: 'box', gutter: true, height: 340, ylabel: 'efficiency', title: 'Real plants', xticks: PLANTS.map((p, i) => [i + 1, p.n]), minWidth: 300 });
        const pick = v.select('plant', [{ value: 'custom', label: 'custom' }, ...PLANTS.map((p) => ({ value: p.k, label: p.full }))], 'wt', { onChange: (k) => { const p = PLANTS.find((q) => q.k === k); if (p) { Th.set(p.Th); Tc.set(p.Tc); } } });
        const Th = v.slider('hot reservoir $T_h$ (°C)', 100, 1000, 565, { step: 5, onChange: () => { pick.value = 'custom'; } });
        const Tc = v.slider('cold reservoir $T_c$ (°C)', 0, 100, 25, { step: 1, onChange: () => { pick.value = 'custom'; } });
        const hP = sA.handle(0.3, 0.1, { color: 'gold', r: 8, constrain: (x) => { const t = (Tc.value + K0) / (Th.value + K0); const e = clamp(x, 0.002, 1 - t - 0.002); return [e, Pof(e, t)]; } });
        const Pof = (e, t) => (1 - e - t) * e / (2 * (1 - e));
        v.legend([['accent', 'Carnot', { area: true }], ['green', 'Curzon–Ahlborn', { area: true }], ['gold', 'observed (their table)', { area: true }]]);
        v.render(() => {
          const TH = Th.value + K0, TC = Tc.value + K0, t = TC / TH, eC = 1 - t, eCA = 1 - Math.sqrt(t);
          sA.setView([0, Math.max(0.1, eC * 1.12)], [0, Pof(eCA, t) * 1.25 + 1e-4]);
          sA.fn((e) => Pof(e, t), { domain: [0.0005, eC], color: 'ink', width: 3 });
          sA.vline(eC, { color: 'accent', width: 2 }); sA.vline(eCA, { color: 'green', width: 2, dash: true });
          sA.text('Carnot', eC - 0.008, Pof(eCA, t) * 0.5, { color: 'accent', size: 12, align: 'right' }); sA.text('CA', eCA + 0.008, Pof(eCA, t) * 1.12, { color: 'green', size: 12, align: 'left' });
          sA.dot(eCA, Pof(eCA, t), { r: 5, color: 'green' });
          hP.set(clamp(hP.x, 0.002, eC - 0.002), Pof(clamp(hP.x, 0.002, eC - 0.002), t));
          // temperature profile at the handle's efficiency
          const e = clamp(hP.x, 0.002, eC - 0.002), x = 1 - e, Thp = (TC + x * TH) / (2 * x), Tcp = x * Thp;
          sB.setView([0, 4.4], [0, TH * 1.15]);
          [[0, TH, 'orange', 'T_h'], [1, Thp, 'orange', "T_h'"], [2, Tcp, 'accent', "T_c'"], [3, TC, 'accent', 'T_c']].forEach(([i, T, c, lab]) => { sB.rect(i + 0.25, 0, i + 1.25, T, { fill: c, fillAlpha: 0.3, color: c, width: 1.6 }); sB.tex(lab.replace("'", "'"), i + 0.75, T + TH * 0.05, { color: c, size: 15 }); sB.text(`${v.fix(T, 0)} K`, i + 0.75, T / 2, { size: 12, align: 'center', color: 'ink' }); });
          sB.text('drop', 1.25, (TH + Thp) / 2, { size: 11.5, color: 'red', align: 'center' }); sB.text('drop', 3.25, (TC + Tcp) / 2 + 20, { size: 11.5, color: 'red', align: 'center' });
          sB.text(`Carnot engine inside: ${v.fix(100 * (1 - Tcp / Thp), 1)}%`, 2.2, TH * 1.08, { size: 12, align: 'center', color: 'muted' });
          // plants
          PLANTS.forEach((p, i) => {
            const a = 1 - (p.Tc + K0) / (p.Th + K0), b = 1 - Math.sqrt((p.Tc + K0) / (p.Th + K0)), sel = pick.value === p.k;
            [[a, 'accent', -0.26], [b, 'green', 0], [p.obs, 'gold', 0.26]].forEach(([val, c, dx]) => { sC.rect(i + 1 + dx - 0.12, 0, i + 1 + dx + 0.12, val, { fill: c, fillAlpha: sel ? 0.7 : 0.4, color: c, width: 1.2 }); sC.text(v.fix(100 * val, 0), i + 1 + dx, val + 0.03, { size: 11.5, align: 'center' }); });
          });
        });
        v.readout(() => {
          const TH = Th.value + K0, TC = Tc.value + K0, t = TC / TH, eC = 1 - t, eCA = 1 - Math.sqrt(t);
          let best = 0, eb = 0; for (let i = 1; i < 4000; i++) { const e = eC * i / 4000, p = Pof(e, t); if (p > best) { best = p; eb = e; } }
          const e = clamp(hP.x, 0.002, eC - 0.002);
          return `$\\eta_C = ${pc1(v, eC)}$, $\\eta_{CA} = 1-\\sqrt{T_c/T_h} = ${pc1(v, eCA)}$; the largest power found by scanning is at $\\eta = ${pc1(v, eb)}$.\nAt the gold point: $\\eta = ${pc1(v, e)}$, power $= ${v.fix(Pof(e, t) / best * 100, 0)}\\,\\%$ of the maximum.${pick.value !== 'custom' ? ' Observed efficiencies are from Curzon and Ahlborn\'s table (quoted from memory).' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9', kind: 'Concept', name: 'Exergy: the useful part of energy',
      statement: String.raw`**Exergy** is the maximum useful work obtainable from a system or flow as it comes into equilibrium with the environment (temperature $T_0$, pressure $p_0$). Energy is conserved but exergy is destroyed by every irreversible process. For heat $Q$ available at a constant temperature $T$ the exergy is
$$X_Q = Q\left(1-\frac{T_0}{T}\right),$$
and for a stream of fluid of mass $m$ and specific heat $c$ cooled from $T$ to $T_0$
$$X = m c\left[(T-T_0) - T_0\ln\frac{T}{T_0}\right].$$
Work and electricity are pure exergy; heat at ambient temperature carries none.`,
      idea: String.raw`The best that can be done with heat at $T$ is to run a reversible (Carnot) engine between $T$ and the environment, which returns the fraction $1-T_0/T$ as work; for a stream whose temperature falls as it gives up heat the Carnot factor is averaged over the cooling, which is why a hot stream is worth less than the same heat from a constant-temperature source. Exergy accounting makes the second law quantitative: **where** an energy conversion is wasteful is where exergy is destroyed, even when no energy is lost.`,
      caption: String.raw`The bars show one kilowatt-hour of energy in six forms: pale for its energy, solid for its exergy. Change the environment temperature $T_0$ and the way the heat is supplied (constant-temperature source or a cooling stream) and watch low-temperature heat lose nearly all its worth. Right: the exergy fraction as a function of temperature; drag the gold handle.`,
      deps: ['energy-2.2', 'pchem-3.11', 'thermo-3.11'],
      refs: ['Tester ch. 3'],
      tags: ['exergy', 'second law'],
      scope: String.raw`Thermal exergy only: chemical exergy of fuels (close to their heating values) and pressure exergy are not shown. Temperatures in kelvin in the formulas; the environment is taken as an infinite reservoir at $T_0$.`,
      viz(v) {
        const SRC = [['electricity', null], ['gas flame, 1500 °C', 1500], ['steam, 600 °C', 600], ['steam, 250 °C', 250], ['hot water, 90 °C', 90], ['radiator, 21 °C', 21]];
        const sA = v.stage({ x: [0, 1.3], y: [0, SRC.length], axes: false, height: 360, title: 'One kWh of energy, how much of it is exergy?', minWidth: 320 });
        const sB = v.stage({ x: [0, 1600], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'temperature of the heat (°C)', ylabel: 'exergy / energy', title: 'Exergy fraction against temperature', minWidth: 320 });
        const T0 = v.slider('environment $T_0$ (°C)', -10, 19, 10, { step: 1 });
        const how = v.select('heat is supplied', [{ value: 'res', label: 'at a constant temperature' }, { value: 'str', label: 'by a cooling stream' }], 'res');
        const hT = sB.handle(600, 0.5, { color: 'gold', r: 8, constrain: (x) => { const T = clamp(x, T0.value + 1, 1600); return [T, fr(T)]; } });
        const fr = (T) => { const a = T0.value + K0, b = T + K0; if (b <= a) return 0; return how.value === 'res' ? 1 - a / b : 1 - a * Math.log(b / a) / (b - a); };
        v.legend([['accent', 'energy', { area: true }], ['green', 'exergy', { area: true }], ['red', 'anergy (cannot be turned into work)', { area: true }]]);
        v.render(() => {
          SRC.forEach(([n, T], i) => {
            const y = SRC.length - 1 - i, f = T == null ? 1 : fr(T);
            sA.rect(0, y + 0.18, 1, y + 0.82, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1 });
            sA.rect(0, y + 0.18, f, y + 0.82, { fill: 'green', fillAlpha: 0.6, color: 'green', width: 1 });
            sA.text(n, 0.012, y + 0.5, { size: 12.5, weight: 600, baseline: 'middle', align: 'left' });
            sA.text(`${v.fix(f, 2)} kWh`, 1.02, y + 0.5, { size: 12.5, baseline: 'middle', align: 'left', color: 'green' });
          });
          sB.fn(fr, { domain: [T0.value + 0.01, 1600], color: 'green', width: 3 });
          const other = (T) => { const a = T0.value + K0, b = T + K0; if (b <= a) return 0; return how.value !== 'res' ? 1 - a / b : 1 - a * Math.log(b / a) / (b - a); };
          sB.fn(other, { domain: [T0.value + 0.01, 1600], color: 'faint', width: 1.8, dash: true });
          sB.between(fr, () => 1, T0.value + 0.01, 1600, { fill: 'red', fillAlpha: 0.08 });
          sB.text('anergy', 1250, 0.97 - 0.0, { size: 12, color: 'red' }); sB.vline(T0.value, { color: 'muted', width: 1, dash: true }); sB.text('T₀', T0.value + 25, 0.05, { size: 12, color: 'muted' });
          sB.text(how.value === 'res' ? 'dashed: cooling stream' : 'dashed: constant-temperature source', 700, 0.14, { size: 11.5, color: 'muted' });
          hT.set(clamp(hT.x, T0.value + 1, 1600), fr(clamp(hT.x, T0.value + 1, 1600)));
        });
        v.readout(() => {
          const T = hT.x, a = T0.value + K0, b = T + K0, f = fr(T);
          return `Heat at ${v.fix(T, 0)} °C with the environment at ${v.fix(T0.value, 0)} °C: $X/Q = ${how.value === 'res' ? `1 - T_0/T = 1 - ${v.fix(a, 1)}/${v.fix(b, 1)}` : `1 - T_0\\ln(T/T_0)/(T-T_0)`} = ${v.fix(f, 3)}$.\n1 kWh of this heat can be turned into at most ${v.fix(f, 2)} kWh of work; the other ${v.fix(1 - f, 2)} kWh is anergy. Electricity is 100 % exergy.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10', kind: 'Concept', name: 'Cogeneration (combined heat and power)',
      statement: String.raw`A cogeneration (CHP) plant uses the heat that a power station would reject, delivering it as steam or hot water for industry or district heating. If $W$ is the electricity and $Q_u$ the useful heat from fuel energy $F$, the **fuel utilisation** is $(W+Q_u)/F$; it can reach 80–90 %, against 35–45 % for electricity alone. But heat is worth less than electricity: the **exergy efficiency** $\bigl[W + Q_u(1-T_0/T_d)\bigr]/F_{\rm ex}$ rises much less, and raising the delivery temperature $T_d$ of the heat lowers the electricity produced.`,
      idea: String.raw`The condenser of a power station rejects more than half the fuel energy at 30–40 °C, too cold to use. Raising the turbine exhaust pressure so the heat comes out at 90–150 °C makes it useful, at the price of a smaller expansion: the electrical efficiency, roughly a fixed fraction of the Carnot factor $1-T_d/T_h$, falls. Comparing with separate production (a power station plus a boiler) shows fuel saved; weighting heat by its exergy shows how much of that saving is real thermodynamic gain.`,
      caption: String.raw`Set the temperature at which heat is delivered and the share of the rejected heat that finds a customer. The four bars give the accounting by **energy** (top pair) and by **exergy** (bottom pair) for electricity-only and for CHP: the energy bar fills up, the exergy bar hardly. Right: how the three efficiencies change with delivery temperature.`,
      deps: ['energy-2.9'],
      refs: ['Tester ch. 19'],
      tags: ['cogeneration', 'district heating'],
      scope: String.raw`A simple back-pressure model: the steam cycle reaches a fixed fraction (0.64, illustrative) of the Carnot efficiency between 540 °C steam and the heat-rejection temperature, the boiler is lossless, fuel exergy equals fuel energy, and the reference for separate production is a 90 % efficient heat boiler.`,
      viz(v) {
        const FACT = 0.64;
        const sA = v.stage({ x: [0, 100], y: [0, 5.0], axes: false, height: 400, title: 'Energy and exergy accounting of 100 units of fuel', minWidth: 340 });
        const sB = v.stage({ x: [40, 200], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'delivery temperature of the heat (°C)', ylabel: 'fraction of fuel', title: 'Efficiencies against delivery temperature', minWidth: 340 });
        const Td = v.slider('heat delivery temperature $T_d$ (°C)', 40, 200, 100, { step: 5 });
        const u = v.slider('share of rejected heat used', 0, 1, 0.9, { step: 0.01 });
        const Th = v.slider('steam temperature (°C)', 400, 600, 540, { step: 10 });
        const T0 = 283.15, TC0 = 35;
        const model = (td, uu) => {
          const TH = Th.value + K0, eP = FACT * (1 - (TC0 + K0) / TH), eC = FACT * (1 - (td + K0) / TH);
          const W = eC * 100, Qu = uu * (100 - W), Xh = Qu * (1 - T0 / (td + K0));
          return { eP, eC, W, Qu, Xh, util: (W + Qu) / 100, ex: (W + Xh) / 100, lossE: 100 - W - Qu, lossX: 100 - W - Xh, sep: eC * 100 / eP + Qu / 0.9 };
        };
        v.legend([['green', 'electricity', { area: true }], ['orange', 'useful heat (energy) or its exergy', { area: true }], ['muted', 'rejected', { area: true }], ['red', 'exergy destroyed or lost', { area: true }]]);
        v.render(() => {
          const M = model(Td.value, u.value), P = { W: M.eP * 100, Qu: 0, Xh: 0 };
          const bar = (y, parts) => { let x = 0; for (const [val, col, lab] of parts) { if (val > 0.05) { sA.rect(x, y, x + val, y + 0.62, { fill: col, fillAlpha: 0.55, color: col, width: 1.1 }); if (val > 9) sA.text(`${lab} ${v.fix(val, 0)}`, x + val / 2, y + 0.31, { size: 12, weight: 600, align: 'center', baseline: 'middle' }); } x += val; } };
          sA.text('energy', 1, 4.7, { size: 12, color: 'muted', align: 'left' }); sA.text('exergy', 1, 2.35, { size: 12, color: 'muted', align: 'left' });
          bar(3.7, [[P.W, 'green', 'electricity'], [100 - P.W, 'muted', 'rejected']]);
          bar(2.8, [[M.W, 'green', 'electricity'], [M.Qu, 'orange', 'heat'], [M.lossE, 'muted', 'rejected']]);
          bar(1.5, [[P.W, 'green', 'electricity'], [100 - P.W, 'red', 'destroyed']]);
          bar(0.6, [[M.W, 'green', 'electricity'], [M.Xh, 'orange', 'heat'], [M.lossX, 'red', 'destroyed']]);
          sA.text('electricity only', 1, 3.52, { size: 11.5, color: 'muted', align: 'left' }); sA.text('CHP', 1, 2.62, { size: 11.5, color: 'muted', align: 'left' });
          sA.text('electricity only', 1, 1.32, { size: 11.5, color: 'muted', align: 'left' }); sA.text('CHP', 1, 0.42, { size: 11.5, color: 'muted', align: 'left' });
          const xs = Array.from({ length: 60 }, (_, i) => lerp(40, 200, i / 59));
          sB.path(xs.map((t) => [t, model(t, u.value).eC]), { color: 'green', width: 2.6 }); sB.path(xs.map((t) => [t, model(t, u.value).util]), { color: 'orange', width: 2.6 }); sB.path(xs.map((t) => [t, model(t, u.value).ex]), { color: 'purple', width: 2.6 });
          sB.hline(M.eP, { color: 'green', width: 1.3, dash: true });
          sB.dot(Td.value, M.eC, { r: 5.5, color: 'green' }); sB.dot(Td.value, M.util, { r: 5.5, color: 'orange' }); sB.dot(Td.value, M.ex, { r: 5.5, color: 'purple' });
          sB.text('fuel utilisation', 195, model(195, u.value).util + 0.04, { color: 'orange', size: 12, align: 'right' }); sB.text('exergy efficiency', 195, model(195, u.value).ex + 0.05, { color: 'purple', size: 12, align: 'right' }); sB.text('electrical efficiency', 195, model(195, u.value).eC - 0.06, { color: 'green', size: 12, align: 'right' });
        });
        v.readout(() => {
          const M = model(Td.value, u.value), saving = 1 - 100 / M.sep;
          return `Electricity only: $\\eta_e = ${pc1(v, M.eP)}$. CHP at ${Td.value} °C: electricity ${pc1(v, M.eC)}, useful heat ${pc1(v, M.Qu / 100)}, so fuel utilisation $= ${pc1(v, M.util)}$ but exergy efficiency only ${pc1(v, M.ex)} (heat at ${Td.value} °C is worth ${v.fix(1 - T0 / (Td.value + K0), 2)} kWh of work per kWh).\nCompared with a power station plus a 90 % boiler making the same outputs, CHP saves ${pc1(v, saving, 0)} of the fuel.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11', kind: 'Model', name: 'Heat pumps and the coefficient of performance',
      statement: String.raw`A heat pump is a heat engine run backwards: it takes work $W$ to move heat $Q_c$ from a cold place (outdoors, $T_c$) to a warm one (the building, $T_h$), delivering $Q_h = Q_c + W$. Its figure of merit is the **coefficient of performance** $\mathrm{COP} = Q_h/W$. The second law limits it to
$$\mathrm{COP}\le \mathrm{COP}_{\rm Carnot} = \frac{T_h}{T_h-T_c},$$
which grows as the temperature lift $T_h-T_c$ shrinks. Real machines reach a fraction $\eta_{II}\approx 0.4$–$0.5$ of it, so a COP of 3–4 is typical, against 1 for resistance heating.`,
      idea: String.raw`Reverse the Carnot engine: the cycle that takes $Q_c$ at $T_c$ and gives $Q_h$ at $T_h$ with zero entropy production needs $Q_h/T_h = Q_c/T_c$, hence $W = Q_h - Q_c = Q_h(T_h-T_c)/T_h$ and $\mathrm{COP} = Q_h/W = T_h/(T_h-T_c)$. Heat is moved, not made: each unit of work brings several units of heat out of the air, which is why electricity used in a heat pump can beat burning the fuel that made the electricity.`,
      caption: String.raw`Set the outdoor temperature (drag the gold handle), the temperature at which heat is delivered (underfloor loops need about 35 °C, radiators 55 °C) and the second-law efficiency. The left plot compares the Carnot COP, the realistic COP, resistance heating and the break-even level against a gas boiler; the right panel is the reversed Carnot cycle on a $T$–$S$ diagram: green is the work, and the red strip the work wasted by real machines.`,
      deps: ['energy-2.2', 'thermo-2.13'],
      refs: ['MacKay App. E', 'Tester ch. 18'],
      tags: ['heat pump', 'refrigeration'],
      scope: String.raw`Steady operation at fixed temperatures; real COPs also drop with defrosting and part-load. The second-law efficiency (0.45) and the climate used for the seasonal figure (annual mean 9 °C, swing ±8 K, heating needed below 17 °C) are illustrative assumptions.`,
      viz(v) {
        const sA = v.stage({ x: [-20, 20], y: [0, 12], axes: 'box', gutter: true, height: 360, xlabel: 'outdoor temperature (°C)', ylabel: 'COP', title: 'COP against outdoor temperature', minWidth: 330 });
        const sB = v.stage({ x: [0, 1.6], y: [0, 400], axes: 'box', gutter: true, height: 360, xlabel: 'entropy S (arbitrary units)', ylabel: 'T (K)', title: 'The reversed Carnot cycle', minWidth: 330 });
        const Ts = v.slider('delivery temperature $T_h$ (°C)', 30, 65, 35, { step: 1 });
        const e2 = v.slider('second-law efficiency $\\eta_{II}$', 0.25, 0.7, 0.45, { step: 0.01 });
        const eg = v.slider('grid / power-plant efficiency', 0.3, 0.6, 0.4, { step: 0.01 });
        const cop = (To, Tsup = Ts.value, e = e2.value) => e * (Tsup + K0) / Math.max(Tsup - To, 1);
        const carn = (To, Tsup = Ts.value) => (Tsup + K0) / Math.max(Tsup - To, 1);
        const hO = sA.handle(2, 4, { color: 'gold', r: 8, constrain: (x) => { const t = clamp(x, -20, Math.min(20, Ts.value - 5)); return [t, Math.min(11.8, cop(t))]; } });
        v.legend([['accent', 'Carnot COP', { dash: true }], ['green', 'realistic COP'], ['red', 'electric resistance, COP = 1'], ['gold', 'break-even with a gas boiler', { dash: true }]]);
        v.render(() => {
          const To = clamp(hO.x, -20, Math.min(20, Ts.value - 5));
          const xs = Array.from({ length: 80 }, (_, i) => lerp(-20, Math.min(20, Ts.value - 3), i / 79));
          sA.path(xs.map((t) => [t, carn(t)]), { color: 'accent', width: 2, dash: true }); sA.path(xs.map((t) => [t, cop(t)]), { color: 'green', width: 3.2 });
          sA.hline(1, { color: 'red', width: 2 }); sA.hline(0.9 / eg.value, { color: 'gold', width: 1.8, dash: true });
          sA.text('gas boiler 90 % ⇔ COP ' + v.fix(0.9 / eg.value, 2), 6, 0.9 / eg.value - 0.5, { size: 11.5, color: 'gold', align: 'left' });
          sA.band && 0;
          hO.set(To, Math.min(11.8, cop(To)));
          // reversed carnot cycle
          const Th = Ts.value + K0, Tc = To + K0, Qc = Tc * 1, Wc = (Th - Tc) * 1, Wr = Wc / e2.value;
          sB.setView([0, 1.6], [0, Math.max(400, Th * 1.2)]);
          sB.poly([[0.3, 0], [1.3, 0], [1.3, Tc], [0.3, Tc]], { fill: 'accent', fillAlpha: 0.22, stroke: false });
          sB.poly([[0.3, Tc], [1.3, Tc], [1.3, Th], [0.3, Th]], { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2 });
          const ext = (Wr - Wc) / 1.0; // extra temperature-equivalent height of wasted work, drawn above Th
          sB.poly([[0.3, Th], [1.3, Th], [1.3, Th + ext], [0.3, Th + ext]], { fill: 'red', fillAlpha: 0.22, hatch: 'red', color: 'red', width: 1.2 });
          sB.text('heat from outdoors $Q_c = T_c\\Delta S$', 0.8, Tc / 2, { size: 12.5, align: 'center', color: 'accent' });
          sB.text('ideal work', 0.8, (Th + Tc) / 2, { size: 12.5, align: 'center', color: 'green', weight: 600 });
          sB.text('extra work of a real machine', 0.8, Th + ext / 2, { size: 11.5, align: 'center', color: 'red', baseline: 'middle' });
        });
        v.readout(() => {
          const To = clamp(hO.x, -20, Math.min(20, Ts.value - 5));
          // seasonal model
          let dem = 0, el = 0; for (let d = 0; d < 365; d++) { const T = 9 - 8 * Math.cos(2 * Math.PI * (d - 15) / 365), D = Math.max(0, 17 - T); dem += D; el += D / cop(T); }
          const scop = dem / el, prim = (dem / 0.9) / (el / eg.value);
          return `At ${v.fix(To, 0)} °C outside and heat delivered at ${Ts.value} °C: Carnot $\\mathrm{COP} = T_h/(T_h-T_c) = ${v.fix(carn(To), 1)}$, realistic $\\mathrm{COP} = ${v.fix(cop(To), 2)}$ (each kWh of electricity brings ${v.fix(cop(To) - 1, 2)} kWh out of the air).\nOver an illustrative year the seasonal COP is $${v.fix(scop, 2)}$, and the primary fuel needed is ${v.fix(1 / prim, 2)} times that of a gas boiler for the same heat.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12', kind: 'Model', name: 'Stirling cycle',
      statement: String.raw`The Stirling cycle encloses a fixed mass of gas and has four processes: isothermal expansion at $T_h$ (heat $Q=nRT_h\ln r$ in, work out), constant-volume cooling to $T_c$, isothermal compression at $T_c$, and constant-volume heating back to $T_h$. A **regenerator** stores the heat given up in the cooling stage and returns it in the heating stage. With regenerator effectiveness $\varepsilon$ the heat that must be supplied externally is $nRT_h\ln r + (1-\varepsilon)\,nc_v(T_h-T_c)$ and the efficiency is
$$\eta = \frac{nR\,(T_h-T_c)\ln r}{nRT_h\ln r + (1-\varepsilon)\,n c_v (T_h-T_c)},$$
which equals the Carnot value $1-T_c/T_h$ when $\varepsilon=1$.`,
      idea: String.raw`Without a regenerator the constant-volume stages need heat from the reservoirs at the wrong temperatures, wasting efficiency; the regenerator (a porous matrix the gas flows through) takes the heat of the cooling stroke and hands it back, so only the two isothermal heat exchanges remain with the reservoirs, and those are exactly a Carnot engine's. The enclosed area of the loop on the $p$–$V$ diagram is the net work, $nR(T_h-T_c)\ln r$, whatever the regenerator does.`,
      caption: String.raw`Left: the loop in the $p$–$V$ plane with a gold marker you can move round with the *phase* slider; middle: the same cycle on a $T$–$S$ diagram, whose enclosed area is again the work; right: the efficiency against regenerator effectiveness, which meets the Carnot line only at $\varepsilon=1$. Change the gas and the compression ratio to see that they do not change the perfect-regenerator result.`,
      deps: ['energy-2.2', 'thermo-2.15'],
      refs: ['Tester ch. 3'],
      tags: ['stirling engine', 'regenerator'],
      credit: 'Robert Stirling, 1816',
      scope: String.raw`Ideal gas with temperature-independent $c_v$, isothermal heat exchange, no dead volume, no pumping or leakage losses; real Stirling engines achieve a fraction of the ideal figure.`,
      viz(v) {
        const sA = v.stage({ x: [0, 7], y: [0, 3], axes: 'box', gutter: true, height: 340, xlabel: 'volume $V$ (relative)', ylabel: 'pressure $p$ (relative)', title: '$p$–$V$ diagram', minWidth: 280 });
        const sB = v.stage({ x: [0, 4], y: [0, 1300], axes: 'box', gutter: true, height: 340, xlabel: 'entropy $S/nR$', ylabel: 'T (K)', title: '$T$–$S$ diagram', minWidth: 280 });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'regenerator effectiveness $\\varepsilon$', ylabel: 'efficiency', title: 'Efficiency against regenerator', minWidth: 280 });
        const rS = v.slider('volume ratio $r = V_{max}/V_{min}$', 1.5, 6, 3, { step: 0.1 });
        const eS = v.slider('regenerator effectiveness $\\varepsilon$', 0, 1, 0.9, { step: 0.01 });
        const Th = v.slider('$T_h$ (K)', 400, 1200, 800, { step: 10 });
        const Tc = v.slider('$T_c$ (K)', 280, 500, 300, { step: 5 });
        const gas = v.select('gas', [{ value: '1.5', label: 'helium ($c_v=\\tfrac32R$)' }, { value: '2.5', label: 'air/hydrogen ($c_v=\\tfrac52R$)' }], '2.5');
        const ph = v.slider('phase round the cycle', 0, 1, 0.12, { step: 0.005 });
        const eta = (r, e, th, tc, cv) => { const l = Math.log(r); return (th - tc) * l / (th * l + (1 - e) * cv * (th - tc)); };
        const geom = () => {
          const th = Th.value, tc = Math.min(Tc.value, th - 20), r = rS.value, cv = +gas.value, p0 = 1; // units: nR = 1, V_min = 1
          const P = [], S = [], n = 40, sc = cv * Math.log(tc);
          const cvl = (T) => cv * Math.log(T);
          // A (V=1,T=th) → B (V=r,T=th) → C (V=r,T=tc) → D (V=1,T=tc) → A
          const seg = [];
          for (let i = 0; i <= n; i++) { const V = lerp(1, r, i / n); seg.push({ V, T: th, s: cvl(th) + Math.log(V) }); }
          for (let i = 1; i <= n; i++) { const T = lerp(th, tc, i / n); seg.push({ V: r, T, s: cvl(T) + Math.log(r) }); }
          for (let i = 1; i <= n; i++) { const V = lerp(r, 1, i / n); seg.push({ V, T: tc, s: cvl(tc) + Math.log(V) }); }
          for (let i = 1; i < n; i++) { const T = lerp(tc, th, i / n); seg.push({ V: 1, T, s: cvl(T) }); }
          seg.forEach((o) => { o.p = o.T / o.V; });
          return { th, tc, r, cv, seg, s0: cvl(tc) };
        };
        v.legend([['accent', 'cycle'], ['gold', 'state', { dot: true }], ['green', 'Carnot value', { dash: true }]]);
        v.render(() => {
          const G = geom(), { th, tc, r, cv, seg } = G;
          const pmax = th, pmin = tc / r;
          sA.setView([0, r * 1.25], [0, pmax * 1.15]);
          sA.poly(seg.map((o) => [o.V, o.p]), { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 3 });
          sB.setView([0, Math.log(r) + cv * Math.log(th / tc) + 0.6], [0, th * 1.15]);
          const ss = seg.map((o) => [o.s - G.s0, o.T]);
          sB.poly(ss, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 3 });
          sA.text('isothermal expansion (hot)', r / 2 + 0.3, th / (r / 2 + 0.3) + th * 0.08, { size: 12, color: 'orange', align: 'left' });
          sA.text('isothermal compression (cold)', 1.1, tc / 1.1 * 0.3, { size: 12, color: 'teal', align: 'left' });
          sB.text('regenerator exchanges heat along both vertical sides', Math.log(r) / 2 + cv * Math.log(th / tc) / 2 + 0.3, tc * 0.5, { size: 11.5, color: 'muted', align: 'center' });
          // marker
          const k = Math.round(ph.value * (seg.length - 1)), o = seg[Math.min(k, seg.length - 1)];
          sA.dot(o.V, o.p, { r: 7, color: 'gold' }); sB.dot(o.s - G.s0, o.T, { r: 7, color: 'gold' });
          // efficiency curve
          const es = Array.from({ length: 41 }, (_, i) => i / 40);
          sC.setView([0, 1], [0, Math.min(0.95, 1 - tc / th + 0.12)]);
          sC.path(es.map((e) => [e, eta(r, e, th, tc, cv)]), { color: 'accent', width: 3 });
          sC.hline(1 - tc / th, { color: 'green', width: 1.8, dash: true });
          sC.dot(eS.value, eta(r, eS.value, th, tc, cv), { r: 6, color: 'gold' });
          sC.text('Carnot', 0.02, 1 - tc / th + 0.02, { size: 12, color: 'green', align: 'left' });
        });
        v.readout(() => {
          const G = geom(), { th, tc, r, cv, seg } = G;
          const W = Math.abs(polyArea(seg.map((o) => [o.V, o.p]))), Wf = (th - tc) * Math.log(r);
          const Qiso = th * Math.log(r), Qreg = (1 - eS.value) * cv * (th - tc);
          const k = Math.round(ph.value * (seg.length - 1)), n = 40, step = k <= n ? 'isothermal expansion: heat flows in from the hot source' : k <= 2 * n ? 'cooling at constant volume: the regenerator absorbs heat' : k <= 3 * n ? 'isothermal compression: heat flows out to the cold sink' : 'heating at constant volume: the regenerator returns the heat';
          return `Loop area $= ${fx(v, W, 1)}$ in units of $nR\\,\\mathrm{K}$ (formula $(T_h-T_c)\\ln r = ${fx(v, Wf, 1)}$). Heat in: isothermal $${fx(v, Qiso, 0)}$ plus the regenerator's shortfall $${fx(v, Qreg, 0)}$.\n$\\eta = ${pc1(v, W / (Qiso + Qreg))}$ against Carnot ${pc1(v, 1 - tc / th)}$. Now: ${step}.`;
        });
      },
    },

  ],
};
