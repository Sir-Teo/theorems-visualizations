// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part c: 4.11–4.15)
import { clamp, RHO_BLOOD, MU_BLOOD, priesRel, twoLayerRel, hnoise, womersleyU, womersleyCentre } from './ch04.shared.js';

export default {
  collection: 'physio',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Fåhræus–Lindqvist effect',
      statement: String.raw`When blood flows through glass tubes narrower than about 0.3 mm, its **apparent viscosity** (the viscosity a Newtonian fluid would need for the same flow at the same pressure drop) falls with the tube diameter, reaching a minimum near a diameter of 7 µm, instead of being constant as Poiseuille's law (physio-4.2) assumes for a fixed fluid. At 45% haematocrit it drops from about 3 times the plasma viscosity in wide tubes to about 1.3–1.5 times in tubes of 10–20 µm. Below about 7 µm the apparent viscosity rises steeply again.`,
      idea: String.raw`Red cells migrate toward the axis of the tube, where the shear rate is low, and leave a thin, cell-free plasma layer of thickness $\delta$ at the wall. The layer is a few micrometres thick whatever the tube, so it is a small fraction of a wide tube and a large fraction of a narrow one. Plasma, the thin low-viscosity lubricant, carries a share of the shear that grows as the tube narrows, and the cell-rich core slides on it. In a two-layer model the apparent viscosity is $\eta_\text{app}=\eta_p/\bigl[1-(1-\eta_p/\eta_c)(1-\delta/R)^4\bigr]$, which tends to the core viscosity $\eta_c$ as $\delta/R\to0$ and shows the fall. Cell crowding in the narrowest capillaries (where the cells must deform to pass) brings the rise back; the two-layer model does not capture that.`,
      caption: String.raw`The **left** panel draws red cells (7 µm across) in a tube drawn to scale (for wide tubes only the wall region is shown), with the cell-free layer at the wall. The **right** panel plots relative apparent viscosity against diameter: the empirical in-vitro fit of Pries and colleagues (blue) and a simple two-layer sketch (orange, dashed). Drag the **diameter** from 300 µm down to 8 µm: the layer grows in proportion and the viscosity falls. Change the **haematocrit** to see the effect grow with it.`,
      scope: String.raw`The blue curve is the empirical fit to in-vitro (glass-tube) data at high shear, as reproduced in Secomb and Pries (2013); in-vivo microvessels have a surface layer (the glycocalyx) that makes their apparent viscosity higher than in glass tubes of the same diameter, so the in-vitro curve should not be used for living capillaries without that correction. The orange curve is a sketch (constant layer thickness up to a haematocrit cap), not a fit.`,
      deps: ['physio-4.2'],
      see: ['physio-4.3'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['viscosity', 'haematocrit', 'microcirculation'],
      credit: 'R. Fåhræus and T. Lindqvist, 1931',
      links: { doi: 'https://doi.org/10.1152/ajplegacy.1931.96.3.562' },
      viz(v) {
        const sD = v.slider('tube diameter $D$', 4, 1000, 60, { log: true, sig: 2, fmt: (x) => `${v.fix(x, x < 20 ? 1 : 0)} µm` });
        const sH = v.slider('haematocrit', 0.2, 0.6, 0.45, { step: 0.01, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sd = v.slider('cell-free layer $\\delta$', 0, 6, 3, { step: 0.25, fmt: (x) => `${v.fix(x, 2)} µm` });
        const re = v.button('Reshuffle cells', () => { seed++; });
        let seed = 1, o = null;
        const a = v.stage({ x: [0, 1], y: [-1, 1], equal: true, axes: false, height: 300, weight: 1.15 });
        const b = v.stage({ x: [3, 1000], y: [0, 4.2], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: 'tube diameter (µm)', ylabel: 'relative apparent viscosity', weight: 1, minWidth: 260 });
        const etaC = (H) => Math.exp(2.6 * H);
        const effDelta = (R, d0, H) => Math.min(d0, R * (1 - Math.sqrt(H / 0.65)));
        v.render(() => {
          const D = sD.value, R = D / 2, H = sH.value, d = effDelta(R, sd.value, H);
          const Hc = H / (1 - d / R) ** 2;
          // left: cell picture. Window shows the whole tube for D ≤ 120 µm, else a strip near the upper wall.
          const win = D <= 120 ? [-R - 3, R + 3] : [R - 62, R + 6];
          const hgt = win[1] - win[0], wid = 1.9 * hgt;
          a.setView([0, wid], win);
          a.rect(0, R, wid, R + 40, { fill: 'muted', fillAlpha: 0.35, stroke: false }); a.rect(0, -R - 40, wid, -R, { fill: 'muted', fillAlpha: 0.35, stroke: false });
          a.line(0, R, wid, R, { color: 'muted', width: 2.5 }); a.line(0, -R, wid, -R, { color: 'muted', width: 2.5 });
          if (d > 0.05) { a.hband(R - d, R, { color: 'green', alpha: 0.18, edges: false }); a.hband(-R, -R + d, { color: 'green', alpha: 0.18, edges: false }); }
          const rng = v.rng(seed * 977 + Math.round(D * 10)), cells = [], rc = 3.5, coreR = R - d;
          const yLo = Math.max(-coreR + rc * 0.2, win[0]), yHi = Math.min(coreR - rc * 0.2, win[1]);
          const area = wid * (yHi - yLo), target = Math.min(900, Math.round((Math.min(Hc, 0.62) * area) / (Math.PI * rc * rc) * 0.9));
          for (let k = 0, tries = 0; k < target && tries < 12000; tries++) {
            const x = rng.uniform(rc, wid - rc), y = rng.uniform(yLo, yHi);
            if (Math.abs(y) > coreR - rc * 0.55 && D < 20) continue;
            if (cells.every((c) => (c[0] - x) ** 2 + (c[1] - y) ** 2 > (2 * rc * 0.92) ** 2)) { cells.push([x, y]); k++; }
          }
          for (const [x, y] of cells) a.circle(x, y, rc, { fill: 'red', fillAlpha: 0.55, color: 'red', width: 1 });
          a.corner(`D = ${v.fix(D, D < 20 ? 1 : 0)} µm${D > 120 ? ' (wall region shown)' : ''}`, 'bl', { color: 'ink', weight: 700, plate: true });
          if (d > 0.5) a.text(`δ = ${v.fix(d, 1)} µm`, wid * 0.98, R - d / 2, { size: 11, color: 'green', align: 'right', baseline: 'middle', weight: 700, plate: true });
          // right: curves
          const Ds = Array.from({ length: 80 }, (_, k) => 3 * Math.pow(1000 / 3, k / 79));
          b.path(Ds.map((x) => [x, priesRel(x, H)]), { color: 'accent', width: 2.6 });
          b.path(Ds.filter((x) => x >= 7).map((x) => [x, twoLayerRel(x / 2, effDelta(x / 2, sd.value, H), etaC(H / (1 - effDelta(x / 2, sd.value, H) / (x / 2)) ** 2))]), { color: 'orange', width: 2.2, dash: [6, 4] });
          b.hline(etaC(H), { color: 'faint', dash: [3, 4] }); b.text('bulk (wide tube)', 900, etaC(H) + 0.12, { size: 11, color: 'muted', align: 'right' });
          b.vline(D, { color: 'gold', dash: [4, 4] });
          const eP = priesRel(D, H), eT = twoLayerRel(R, d, etaC(Hc));
          b.dot(D, eP, { r: 7, color: 'gold' });
          o = { eP, eT, d, Hc, bulk: priesRel(1000, H) };
        });
        v.legend([['accent', 'in-vitro fit (Pries et al., 1992)'], ['orange', 'two-layer sketch', { dash: true }]]);
        v.readout(() => `at $D=${v.fix(sD.value, 1)}$ µm: relative apparent viscosity ${v.fix(o.eP, 2)} (empirical fit) vs ${v.fix(o.bulk, 2)} in a wide tube → at the same $\\Delta P$ the flow is ${v.fix(100 * (o.bulk / o.eP - 1), 0)}% larger than the bulk viscosity predicts\ntwo-layer sketch: ${v.fix(o.eT, 2)};  core haematocrit ${v.fix(100 * o.Hc, 0)}%, layer ${v.fix(o.d, 1)} µm`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Law',
      name: 'Starling’s law of capillary filtration',
      statement: String.raw`The net volume flux of fluid per unit area across a capillary wall is proportional to the difference between the hydrostatic and the (effective) oncotic pressure differences across it:
$$J_v = L_p\bigl[(P_c-P_i)-\sigma(\pi_c-\pi_i)\bigr],$$
where $P_c, P_i$ are the capillary and interstitial hydrostatic pressures, $\pi_c,\pi_i$ the plasma and interstitial colloid osmotic pressures, $L_p$ the hydraulic conductivity and $\sigma\le1$ the reflection coefficient of the wall for the proteins. Because $P_c$ falls along the capillary while $\pi_c$ stays nearly constant, fluid is filtered out near the arterial end ($J_v>0$) and drawn back near the venous end ($J_v<0$) in the classical picture; the net flow over the whole capillary is small and the excess returns by the lymph.`,
      idea: String.raw`Water crosses the wall through pores that are permeable to water but nearly impermeable to plasma proteins, so the proteins exert an osmotic pull (physio-1.4, van 't Hoff) on the water that opposes the hydrostatic push. Each pressure acts on the flux linearly, with the same conductivity $L_p$ for both, and the sign of the bracket is the direction. The picture shown here, with a constant $\pi_c$ and reabsorption at the venous end, is the classical form; the modern "revised Starling principle" holds that in most tissues the effective oncotic term is set by the protein concentration in a sub-glycocalyx space, so that steady filtration occurs along the whole capillary and the reabsorption at the venous end is transient (Levick & Michel, 2010).`,
      caption: String.raw`**Left:** hydraulic pressure difference $P_c-P_i$ (red) falls along the capillary while the effective oncotic pressure $\sigma(\pi_c-\pi_i)$ (blue) stays put; the crossing point is where flow reverses. **Right:** the net driving pressure, shaded out (filtration) and in (reabsorption). Slide the **venous pressure** up or the **plasma protein** (oncotic pressure) down: the crossing point moves toward the venous end and the net filtration grows. The readout integrates along the capillary.`,
      scope: String.raw`A single, uniform, linear capillary with constant $L_p$, $\sigma$ and interstitial values; $P_c$ falls linearly (Poiseuille flow in a uniform tube, physio-4.2). Typical textbook values (Guyton style): $P_c$ about 30 → 10 mmHg is common; the defaults here (27 → 8) are tuned so that the mean net pressure is near zero, as the textbook mean-pressure analysis gives. The interstitial values are not exact.`,
      deps: ['physio-1.4'],
      see: ['physio-4.13', 'physio-4.20'],
      refs: ['Guyton–Hall', 'Keener–Sneyd ch. 11'],
      tags: ['Starling', 'capillary', 'oncotic'],
      credit: 'E. H. Starling, 1896',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1896.sp000596' },
      viz(v) {
        const sPa = v.slider('arterial-end pressure $P_a$', 15, 45, 27, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sPv = v.slider('venous-end pressure $P_v$', 0, 30, 8, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sPi = v.slider('plasma oncotic pressure $\\pi_c$', 8, 35, 28, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sTi = v.slider('interstitial $\\pi_i$', 0, 20, 8, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sP0 = v.slider('interstitial pressure $P_i$', -8, 8, -3, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sS = v.slider('reflection coefficient $\\sigma$', 0.3, 1, 1, { step: 0.05 });
        const a = v.stage({ x: [0, 1], y: [-5, 45], height: 300, axes: 'box', gutter: true, xlabel: 'position along the capillary (0 = arterial end, 1 = venous end)', ylabel: 'pressure (mmHg)', weight: 1.1 });
        const b = v.stage({ x: [0, 1], y: [-20, 25], height: 300, axes: 'box', gutter: true, xlabel: 'position along the capillary', ylabel: 'net driving pressure (mmHg)', weight: 1 });
        let o = null;
        v.render(() => {
          const Pa = sPa.value, Pv = sPv.value, pc = sPi.value, pi = sTi.value, P0 = sP0.value, sg = sS.value;
          const hyd = (x) => Pa + (Pv - Pa) * x - P0, onc = () => sg * (pc - pi), nd = (x) => hyd(x) - onc();
          a.fn(hyd, { color: 'red', width: 2.8 }); a.fn(onc, { color: 'accent', width: 2.8 });
          a.between(hyd, onc, 0, 1, { fill: 'gold', fillAlpha: 0.12 });
          a.text('hydraulic  Pc − Pi', 0.03, hyd(0.03) + 3, { size: 12, color: 'red', align: 'left', weight: 700 }); a.text('oncotic  σ(πc − πi)', 0.97, onc() + 3, { size: 12, color: 'accent', align: 'right', weight: 700 });
          const xs = Math.abs(Pa - Pv) < 1e-9 ? NaN : (Pa - P0 - onc()) / (Pa - Pv);
          b.fn((x) => Math.max(nd(x), 0), { color: 'red', width: 0, fill: 'red', fillAlpha: 0.25, domain: [0, 1] });
          b.fn((x) => Math.min(nd(x), 0), { color: 'accent', width: 0, fill: 'accent', fillAlpha: 0.25, domain: [0, 1] });
          b.fn(nd, { color: 'ink', width: 2.6 }); b.hline(0, { color: 'muted', width: 1.2 });
          if (xs > 0 && xs < 1) { a.vline(xs, { color: 'green', dash: [4, 4] }); b.vline(xs, { color: 'green', dash: [4, 4] }); b.dot(xs, 0, { r: 6, color: 'green' }); }
          const N = 400; let fo = 0, fi = 0; for (let k = 0; k < N; k++) { const q = nd((k + 0.5) / N) / N; if (q > 0) fo += q; else fi -= q; }
          o = { nd0: nd(0), nd1: nd(1), xs, fo, fi, net: fo - fi };
        });
        v.readout(() => `net driving pressure ${v.fix(o.nd0, 1)} mmHg at the arterial end, ${v.fix(o.nd1, 1)} mmHg at the venous end;  flow reverses at ${o.xs > 0 && o.xs < 1 ? `x = ${v.fix(o.xs, 2)}` : o.nd0 > 0 ? 'no point (filtration all along)' : 'no point (reabsorption all along)'}\nmean outward ${v.fix(o.fo, 1)} − inward ${v.fix(o.fi, 1)} = net ${v.fix(o.net, 1)} mmHg (× $L_p$ × area = net filtration); ${o.fo > 0 ? v.fix(100 * o.fi / o.fo, 0) : 0}% of the filtrate is reabsorbed in this classical picture`);
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'Oedema from unbalanced Starling forces',
      statement: String.raw`Oedema is an excess of fluid in the interstitial space. The interstitial volume $V$ obeys $\dot V=J_v(V)-J_\text{lymph}(V)$, with the filtration $J_v=K_f[(P_c-P_i(V))-(\pi_c-\pi_i(V))]$ of Starling's law (physio-4.12) and a lymph return that grows with interstitial pressure up to a ceiling. Oedema results when something pushes the filtration beyond what the lymph can remove: a **raised capillary pressure** (venous obstruction, heart failure), a **lowered plasma protein** (liver disease, nephrotic syndrome), a **leakier wall** (a lowered $\sigma$), or a **lymphatic obstruction**. A "safety factor" of several mmHg is provided by the rise of $P_i$ with volume, the washout of interstitial protein and the lymph increase.`,
      idea: String.raw`At steady state the filtration and the lymph flow balance; the stable volume is the intersection of the two curves of flow against volume. As the interstitium swells, $P_i$ rises (reducing filtration), the interstitial protein is diluted (raising the net inward pull) and the lymph increases, all negative feedback; this is why a modest rise in capillary pressure produces no visible swelling. Once the pressure in the tissue becomes positive its compliance rises sharply (the gel loosens and free fluid collects), the feedback weakens, and the curves may no longer cross: the volume then grows without bound until another limit is reached.`,
      caption: String.raw`**Left:** filtration (red) and lymph flow (blue) against the excess interstitial volume; the filled dot is the steady state (no dot: no equilibrium, runaway oedema). **Right:** the volume over ten days starting from normal. Raise **venous pressure** or lower **plasma protein**, or block the **lymphatics**, and watch the steady state move, then disappear. The readout shows the steady excess volume and the interstitial pressure.`,
      scope: String.raw`A reconstruction with round-number parameters in the style of the textbook analysis ($K_f$ about 7 mL/min/mmHg for the whole body, $P_i$ about −3 mmHg, a capillary pressure of 17.3 mmHg and plasma oncotic pressure 28 mmHg, a lymph ceiling of 25 times its resting flow); the interstitial pressure–volume curve and the lymph law are schematic. The conclusions are qualitative: which direction each factor pushes, and that there is a threshold. Nothing here is a clinical prediction.`,
      deps: ['physio-4.12'],
      see: ['physio-4.20'],
      refs: ['Guyton–Hall'],
      tags: ['oedema', 'lymph', 'Starling'],
      verify: true,
      viz(v) {
        const sPv = v.slider('rise in venous pressure', 0, 30, 10, { step: 0.5, fmt: (x) => `+${x} mmHg` });
        const sPi = v.slider('plasma oncotic pressure $\\pi_c$', 8, 28, 28, { step: 0.5, fmt: (x) => `${x} mmHg` });
        const sL = v.slider('lymph function', 0, 1, 1, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sK = v.slider('capillary leakiness (σ lowered)', 0, 0.6, 0, { step: 0.05, fmt: (x) => `σ = ${v.fix(1 - x, 2)}` });
        const KF = 7, PC0 = 17.3, J0 = 2.1, JMAX = 25 * J0, V0 = 12;
        const Pi = (x) => (x < 1.5 ? -3 + 2 * x : 0.3 * (x - 1.5));
        const piI = (x) => (8 * V0) / (V0 + x);
        const a = v.stage({ x: [0, 15], y: [-25, 60], height: 300, axes: 'box', gutter: true, xlabel: 'excess interstitial volume (L)', ylabel: 'flow (mL/min)', weight: 1 });
        const b = v.stage({ x: [0, 10], y: [0, 15], height: 300, axes: 'box', gutter: true, xlabel: 'time (days)', ylabel: 'excess volume (L)', weight: 1 });
        let o = null;
        v.render(() => {
          const Pc = PC0 + 0.8 * sPv.value, pc = sPi.value, sg = 1 - sK.value, f = sL.value;
          const Jf = (x) => KF * ((Pc - Pi(x)) - sg * (pc - piI(x)));
          const Jl = (x) => f * (J0 + (JMAX - J0) * (1 - Math.exp(-Math.max(Pi(x) + 3, 0) / 3)));
          a.fn(Jf, { color: 'red', width: 2.8 }); a.fn(Jl, { color: 'accent', width: 2.8 });
          a.hline(0, { color: 'muted', width: 1 }); a.vline(1.5, { color: 'faint', dash: [4, 4] }); a.text('Pi = 0', 1.6, 56, { size: 11, color: 'muted', align: 'left' });
          // steady state: first sign change of Jf − Jl from x = 0
          let xs = null; { let prev = Jf(0) - Jl(0); if (prev <= 0) xs = 0; else for (let x = 0.02; x <= 15 && xs === null; x += 0.02) { const cur = Jf(x) - Jl(x); if (cur <= 0) { let lo = x - 0.02, hi = x; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (Jf(m) - Jl(m) > 0) lo = m; else hi = m; } xs = (lo + hi) / 2; } prev = cur; } }
          if (xs !== null) a.dot(xs, Jf(xs), { r: 8, color: 'green' }); else a.text('no equilibrium: runaway', 7.5, 30, { size: 14, color: 'red', align: 'center', weight: 700 });
          // time course (explicit steps of 10 min)
          const pts = []; let x = 0; const dt = 10, nS = 10 * 144; for (let k = 0; k <= nS; k++) { if (k % 6 === 0) pts.push([k / 144, Math.min(x, 15)]); x = Math.max(0, x + ((Jf(x) - Jl(x)) * dt) / 1000); }
          b.path(pts, { color: 'purple', width: 2.8 }); b.hline(1.5, { color: 'faint', dash: [4, 4] }); b.text('Pi turns positive', 9.9, 1.8, { size: 11, color: 'muted', align: 'right' });
          if (xs !== null) b.hline(xs, { color: 'green', dash: [5, 4] });
          o = { xs, Pi: xs === null ? null : Pi(xs), Jl0: Jl(0), Jf0: Jf(0), end: pts[pts.length - 1][1] };
        });
        v.legend([['red', 'filtration $J_v$'], ['accent', 'lymph flow'], ['purple', 'volume over time']]);
        v.readout(() => `at the start: filtration ${v.fix(o.Jf0, 1)} mL/min vs lymph ${v.fix(o.Jl0, 1)} mL/min (normal ≈ 2 mL/min each)\n${o.xs === null ? 'no steady state below 15 L: the filtration outruns the lymph (the volume plotted is clipped at 15 L)' : `steady state: excess ${v.fix(o.xs, 2)} L, interstitial pressure ${v.fix(o.Pi, 1)} mmHg → ${o.Pi > 0 ? 'oedema (positive tissue pressure)' : 'no visible oedema (the feedback has absorbed the load)'}`}\nin this model the first oedema appears once the capillary pressure has risen by about 9 mmHg (a textbook "safety factor" is larger, around 17 mmHg)`);
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Concept',
      name: 'Reynolds number, turbulence and bruits',
      statement: String.raw`The **Reynolds number** $\mathrm{Re}=\rho \bar u D/\mu$ compares inertial to viscous forces. Steady flow in a straight tube is laminar for $\mathrm{Re}$ below about 2000–2300 and turbulent well above that; in between it is unstable. In the body $\mathrm{Re}$ is large only in the aorta and big arteries and in narrowed or abnormal places (a stenosis, a high-output state), where the flow becomes turbulent. Turbulence makes the wall vibrate and is heard through the stethoscope as a **murmur** (in the heart) or a **bruit** (over a vessel); a lowered blood viscosity (anaemia) raises $\mathrm{Re}$ and can produce a flow murmur.`,
      idea: String.raw`Dimensional analysis (the dynamic similarity of fluid-6.5) shows that the character of the flow depends on $\mathrm{Re}$ alone, not on the three variables separately: a thin fast jet and a wide slow vessel behave alike when $\mathrm{Re}$ agrees. Laminar flow keeps its parabolic profile (physio-4.2); beyond the critical value small disturbances grow, the profile flattens, momentum is exchanged across the stream, the wall shear and the pressure drop increase above the Poiseuille values, and the fluctuating pressure at the wall is what the ear picks up. The 2000 figure is an empirical number for steady flow in a smooth straight tube; pulsatile flow, curvature and a rough wall change it.`,
      caption: String.raw`**Left:** the tube with dye particles (a schematic, not a flow simulation): in laminar flow they move on parallel paths with a parabolic speed profile, and above the critical Reynolds number they get a flat mean profile and random cross-stream motion. **Right:** a map of tube diameter against mean velocity with lines of constant $\mathrm{Re}$; drag the **handle** to choose a vessel, or look at the labelled points. Lower the **viscosity** (as in anaemia) to push the same vessel toward turbulence. The speaker button plays the noise your stethoscope would hear (silent when laminar).`,
      scope: String.raw`The critical value (about 2000) is for steady flow in a long, straight, smooth tube; the pulsatile aorta can stay laminar in part of the cycle at a peak Re above that, and a stenotic jet becomes turbulent downstream of the narrowing. The animation is a cartoon of laminar vs turbulent flow, not a Navier–Stokes solution. The labelled vessel values are rounded orders of magnitude.`,
      deps: ['physio-4.2', 'fluid-6.5'],
      see: ['physio-4.18'],
      refs: ['Guyton–Hall'],
      tags: ['Reynolds', 'turbulence', 'murmur'],
      credit: 'O. Reynolds, 1883',
      links: { doi: 'https://doi.org/10.1098/rstl.1883.0029' },
      verify: true,
      viz(v) {
        const sMu = v.slider('blood viscosity $\\mu$', 1.5, 6, 3.5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mPa·s` });
        const sCrit = v.slider('critical $\\mathrm{Re}$', 1500, 3000, 2000, { step: 50 });
        const snd = v.sound();
        v.soundButton('Listen (stethoscope)', (s) => { if (cur.Re > sCrit.value) s.noise({ color: 'pink', duration: 1.4, gain: Math.min(0.5, 0.08 + 0.1 * Math.log10(cur.Re / sCrit.value + 1)) }); });
        const A = v.stage({ x: [0, 10], y: [-1.4, 1.4], height: 260, axes: false, weight: 1.1 });
        const B = v.stage({ x: [0.005, 50], y: [1e-4, 10], xlog: true, ylog: true, height: 300, axes: 'box', gutter: true, xlabel: 'tube diameter (mm)', ylabel: 'mean velocity (m/s)', weight: 1 });
        const h = B.handle(14, 0.4, { color: 'gold', label: 'your vessel', labelPos: 'ne', constrain: (x, y) => [clamp(x, 0.005, 50), clamp(y, 1e-4, 10)] });
        const P = [
          { n: 'aorta, mean', D: 25, u: 0.2, dy: 0.5 }, { n: 'aorta, peak', D: 25, u: 1.0 }, { n: 'femoral', D: 6, u: 0.15, dy: 0.5 }, { n: 'capillary', D: 0.008, u: 0.0004 },
          { n: 'stenotic jet', D: 4, u: 4 },
        ];
        const cur = { Re: 0 };
        const reOf = (D, u, mu) => (RHO_BLOOD * u * (D * 1e-3)) / (mu * 1e-3);
        const prs = Array.from({ length: 70 }, (_, k) => ({ y: ((k * 0.6180339) % 1) * 2 - 1, x: (k * 0.4142135) % 1, ph: k * 2.399 }));
        v.animate((t) => {
          const mu = sMu.value, Rec = sCrit.value;
          const D = h.x, u = h.y, Re = reOf(D, u, mu); cur.Re = Re;
          const turb = clamp((Re - Rec * 0.9) / (Rec * 0.3), 0, 1);
          // left: tube
          A.rect(0, -1, 10, 1, { fill: 'red', fillAlpha: 0.06, stroke: false });
          A.line(0, 1, 10, 1, { color: 'muted', width: 3 }); A.line(0, -1, 10, -1, { color: 'muted', width: 3 });
          const spd = 0.35 + 0.18 * Math.log10(Math.max(Re, 1) / 1 + 1);
          for (const p of prs) {
            const lam = 1.5 * (1 - p.y * p.y) * 0.8, tb = 1.0 * (1 - Math.abs(p.y) ** 7) ** 0.7 * 1.15; // laminar parabola vs flat turbulent mean profile
            const sp = (1 - turb) * lam + turb * tb;
            const x = (((p.x * 10 + t * spd * 3 * sp) % 10) + 10) % 10;
            const wob = turb * 0.45 * (hnoise(Math.floor(t * 7 + p.ph) + p.ph, 1) * (1 - 0.5 * Math.abs(p.y)));
            const y = clamp(p.y * 0.92 + wob * Math.sin(t * 9 + p.ph * 3), -0.95, 0.95);
            A.dot(x, y, { r: 3, color: turb > 0.5 ? 'orange' : 'accent' });
          }
          A.text(turb > 0.5 ? 'turbulent' : turb > 0 ? 'transitional' : 'laminar', 0.2, 1.22, { size: 13, color: turb > 0.5 ? 'orange' : turb > 0 ? 'gold' : 'accent', align: 'left', weight: 700 });
          A.text(`Re = ${v.fix(Re, Re < 10 ? 3 : 0)}`, 9.8, 1.22, { size: 13, color: 'ink', align: 'right', weight: 700 });
          // right: map
          for (const r of [1, 100, 1e4]) { const f = (d) => (r * mu * 1e-3) / (RHO_BLOOD * d * 1e-3); B.fn(f, { color: 'faint', width: 1.2, dash: [4, 4], domain: [0.005, 50] }); }
          B.fn((d) => (Rec * mu * 1e-3) / (RHO_BLOOD * d * 1e-3), { color: 'red', width: 2.4, domain: [0.005, 50] });
          B.text('Re = 1', 0.0075, 1 * 3.5e-3 / (RHO_BLOOD * 7.5e-6) * 1.8, { size: 10, color: 'muted', align: 'left' });
          B.text('Re = 100', 0.0075, 100 * 3.5e-3 / (RHO_BLOOD * 7.5e-6) * 1.8, { size: 10, color: 'muted', align: 'left' });
          B.text('critical Re', 2.5, (Rec * mu * 1e-3) / (RHO_BLOOD * 2.5e-3) * 1.7, { size: 11, color: 'red', align: 'left', weight: 700 });
          for (const q of P) { B.dot(q.D, q.u, { r: 4, color: 'ink' }); B.text(q.n, q.D, q.u * (q.dy || 1.7), { size: 10, color: 'muted', align: 'center' }); }
        }, { period: 4, still: 1.7 });
        v.readout(() => `$\\mathrm{Re}=\\rho\\bar uD/\\mu=${v.fix(cur.Re, cur.Re < 10 ? 3 : 0)}$ (ρ = 1060 kg/m³) → ${cur.Re < sCrit.value * 0.9 ? 'laminar: a quiet vessel' : cur.Re < sCrit.value * 1.2 ? 'transitional' : 'turbulent: expect a murmur / bruit'}\nat the normal viscosity of 3.5 mPa·s this vessel would have $\\mathrm{Re}=${v.fix(cur.Re * sMu.value / 3.5, 0)}$; with your viscosity of ${v.fix(sMu.value, 1)} mPa·s it has ${v.fix(cur.Re, 0)}`);
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Concept',
      name: 'Womersley number and pulsatile flow',
      statement: String.raw`For an oscillatory pressure gradient of angular frequency $\omega$ in a tube of radius $R$, the dimensionless **Womersley number** $\alpha=R\sqrt{\omega\rho/\mu}$ is the ratio of the unsteady inertial force to the viscous force. For $\alpha\lesssim1$ the profile is a parabola that rises and falls in step with the pressure gradient (a "breathing" Poiseuille flow); for $\alpha\gg1$ the fluid in the core moves as a flat plug that lags the gradient by almost 90°, and the shear is confined to a thin Stokes layer of thickness about $R/\alpha$ at the wall. The exact solution for the velocity is
$$u(r,t)=\operatorname{Re}\!\Bigl\{\tfrac{-iG}{\rho\omega}\Bigl[1-\tfrac{J_0(\alpha i^{3/2}r/R)}{J_0(\alpha i^{3/2})}\Bigr]e^{i\omega t}\Bigr\}\quad\text{for } -\partial_z p=G\cos\omega t.$$
In the human aorta $\alpha\approx 15$–20 at resting heart rate, in the femoral artery about 4–5, and in the arterioles and capillaries well below 1.`,
      idea: String.raw`Write $u=\operatorname{Re}[\hat u(r)e^{i\omega t}]$ in the axisymmetric momentum equation: $i\omega\rho\hat u=G+\mu(\hat u''+\hat u'/r)$, whose regular solution is a Bessel function of complex argument, $J_0(\alpha i^{3/2}r/R)$. For small $\alpha$ the viscous term wins and the series reproduces the Poiseuille parabola (physio-4.2) at each instant; for large $\alpha$ the inertia wins in the core, the velocity is $G/(i\omega\rho)$ there (90° behind the gradient), and the wall layer is thin. The reason that this matters is that the oscillatory flow in large arteries is not quasi-steady, so Poiseuille's law gives the wrong resistance to the pulsatile components of flow.`,
      caption: String.raw`The **left** panel shows the velocity profile across the tube as it oscillates (animated, with eight phases of the cycle drawn faintly); the **right** panel plots the pressure gradient (grey) and the centre-line velocity (blue) over one cycle. Raise the **Womersley number** with the slider or choose a vessel: the parabola flattens into a plug, the centre-line response shrinks, and its lag grows from 0° towards 90°. The profile is computed from the exact Bessel-function solution, with a complex Bessel series evaluated numerically.`,
      scope: String.raw`Exact for a rigid straight tube, an incompressible Newtonian fluid and a sinusoidal gradient (physiological waveforms are sums of such harmonics, each with its own $\alpha$). Vessel elasticity changes the flow (Womersley's elastic-tube theory), and the vessel values of $\alpha$ assume a heart rate of 75 beats/min, a blood density of 1060 kg/m³ and viscosity 3.5 mPa·s.`,
      deps: ['physio-4.2'],
      see: ['physio-4.9'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['Womersley', 'pulsatile flow', 'Bessel'],
      credit: 'J. R. Womersley, 1955',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1955.sp005276' },
      verify: true,
      viz(v) {
        const w = 2 * Math.PI * 1.25, aOf = (Rmm) => Rmm * 1e-3 * Math.sqrt((w * RHO_BLOOD) / MU_BLOOD);
        const sA = v.slider('Womersley number $\\alpha$', 0.1, 20, 4.6, { log: true, sig: 2, fmt: (x) => v.fix(x, x < 1 ? 2 : 1) });
        const pre = v.select('or pick a vessel', [{ value: 12, label: 'aorta' }, { value: 3, label: 'femoral' }, { value: 0.5, label: 'small artery' }, { value: 0.015, label: 'arteriole' }], 3, {
          onChange: (Rmm) => sA.set(clamp(aOf(+Rmm), 0.1, 20)),
        });
        const a = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.05], height: 330, axes: 'box', gutter: true, xlabel: 'radius r/R', ylabel: 'velocity (units of $GR^2/4\\mu$)', weight: 1.1 });
        const b = v.stage({ x: [0, 1], y: [-1.15, 1.15], height: 330, axes: 'box', gutter: true, xlabel: 'time (fraction of a cycle)', ylabel: 'relative to Poiseuille peak', weight: 1 });
        const prof = (al, ph) => Array.from({ length: 81 }, (_, k) => { const s = -1 + k / 40; return [s, womersleyU(al, Math.abs(s), ph)]; });
        let o = null;
        v.animate((t) => {
          const al = sA.value, ph = 2 * Math.PI * (t % 1);
          for (let k = 0; k < 8; k++) { const p2 = (2 * Math.PI * k) / 8; a.path(prof(al, p2), { color: 'faint', width: 1, alpha: 0.6 }); }
          let amp = 0.05; for (let k = 0; k < 8; k++) for (const [, u] of prof(al, (2 * Math.PI * k) / 8)) amp = Math.max(amp, Math.abs(u));
          const yr = Math.min(1.05, amp * 1.25); a.setView([-1.05, 1.05], [-yr, yr]); b.setView([0, 1], [-1.15, 1.15]);
          const pr = prof(al, ph);
          a.poly([[-1, 0], ...pr.map(([s, u]) => [s, u]), [1, 0]], { fill: 'accent', fillAlpha: 0.18, stroke: false });
          a.path(pr, { color: 'accent', width: 2.8 }); a.hline(0, { color: 'muted', width: 1 });
          const c = womersleyCentre(al), gain = Math.hypot(c[0], c[1]), lag = -Math.atan2(c[1], c[0]) * 180 / Math.PI;
          b.fn((x) => Math.cos(2 * Math.PI * x), { color: 'muted', width: 2, dash: [5, 4] });
          b.fn((x) => womersleyU(al, 0, 2 * Math.PI * x), { color: 'accent', width: 2.8 });
          b.vline(t % 1, { color: 'gold', dash: [3, 4] }); b.dot(t % 1, womersleyU(al, 0, ph), { r: 6, color: 'gold' });
          o = { al, gain, lag, ph, uc: womersleyU(al, 0, ph), delta: 1 / al };
        }, { period: 1, still: 0.12 });
        v.legend([['muted', 'pressure gradient $G\\cos\\omega t$', { dash: true }], ['accent', 'centre-line velocity']]);
        v.readout(() => `$\\alpha=${v.fix(o.al, 2)}$: centre-line amplitude ${v.fix(100 * o.gain, 0)}% of the quasi-steady (Poiseuille) value, lagging the gradient by ${v.fix(o.lag, 0)}°;  Stokes layer ≈ $R/\\alpha$ = ${v.fix(100 * o.delta, 0)}% of the radius`);
      },
    },
  ],
};
