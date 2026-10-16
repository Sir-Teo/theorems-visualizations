// History of Technology — Chapter 1: Prehistoric foundations (items 1.6–1.9; 1.1–1.5 are in ch01.js)
import { evidenceStage, drawEvidence } from './ch01.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export default {
  collection: 'tech',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Invention',
      name: 'The eyed needle and sewn clothing',
      credit: 'Late Pleistocene people of northern Eurasia; eyed needles from c. 40,000 years ago',
      statement: String.raw`A needle with an eye carries the thread through the hole it makes, so pieces of hide can be joined quickly and closely into **fitted** garments: sleeves, trousers, hoods, boots and layered suits that close around the body. Bone awls, which punch holes for a thread pushed through separately, are older: the earliest suitable for working skins come from Blombos Cave, South Africa, about 73,000 years ago. The earliest eyed needles are from Denisova Cave in the Altai, Siberia, from about 40,000 years ago, from the Caucasus about 38,000 years ago, from East Asia about 30,000 years ago and from Europe about 26,000 years ago (Gilligan et al. 2024; d'Errico et al. 2018). A Denisova needle widely reported in 2016 as 50,000 years old is **contested**: dates for its layer range from more than 37,000 to about 50,000 years.

Fitted clothing changes the body's heat balance. A loose hide over the shoulders traps a layer of still air, but wind lifts its edges and blows the warm air out, and arms and legs stay exposed. Closed, layered, sewn garments keep the trapped air in place even in wind.`,
      idea: String.raw`Heat flows from skin at about 33 °C to the air through resistances in series: the clothing (insulation is measured in clo, $1\ \mathrm{clo} = 0.155\ \mathrm{m^2\,K/W}$, mostly still air held by fibres or fur) and the boundary layer of air at the surface. Wind thins the boundary layer, since the convective coefficient grows roughly as $h_c \approx 8.3\,v^{0.6}\ \mathrm{W/(m^2\,K)}$, and it also pumps air through gaps and openings, cutting the clothing's own insulation (thermo-7.3, thermo-7.5). For ordinary clothing the correction equation of ISO 9920 (for clothing above 0.6 clo) reduces the total insulation by about a third (a factor 0.64) at 3.5 m/s.

The body stays warm only while heat loss is no more than the metabolic heat, roughly 100 W at rest and 250–400 W when walking or working. This is the logic of Gilligan's thermal model of prehistoric clothing (Gilligan 2010). Draped clothing suffices in mild, still conditions. In the wind and cold of glacial northern Eurasia, survival needed **complex** clothing: fitted, enclosing and multi-layered, which needed sewing. Gilligan and colleagues argue that the fine eyed needle, beyond merely making fitted clothes possible, may mark close-fitting underlayers and the decoration of clothing.`,
      caption: String.raw`Set the **air temperature** and the **activity**, and **drag the wind handle**. **Top left:** heat loss from the whole body in three outfits (log scale) against the metabolic heat (gold). Where a curve rises above the gold line, that person cools without limit. **Right:** the three outfits, coloured by heat balance. **Bottom left:** the coldest air each outfit can stand at each wind speed. The garment numbers (coverage, clo, wind sensitivity) are illustrative, chosen to bracket the ISO 9920 wind correction; the convection law and the clo unit are standard.`,
      deps: ['tech-1.2', 'thermo-7.3'],
      see: ['physio-9.14', 'energy-9.3', 'thermo-7.5'],
      refs: ['Cardwell', 'Gilligan et al. 2024, Sci. Adv. 10:eadp2887', 'Gilligan 2010, J. Archaeol. Method Theory 17:15', 'd’Errico et al. 2018, J. Hum. Evol. 125:71'],
      tags: ['prehistory', 'c. 40 kya', 'heat transfer'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sewing_needle' },
      viz(v) {
        const AREA = 1.8, TS = 33, HR = 4.7, CLO = 0.155;
        const OUT = [
          { key: 'bare', label: 'unclothed', f: 0, I: 0, beta: 0, color: 'red' },
          { key: 'drape', label: 'draped hide', f: 0.7, I: 2.5, beta: 0.3, color: 'orange' },
          { key: 'fit', label: 'fitted, sewn, two layers', f: 0.95, I: 4.0, beta: 0.06, color: 'accent' },
        ];
        const A = v.stage({ x: [0, 15], y: [40, 6000], ylog: true, axes: 'box', gutter: true, height: 290, weight: 1.25, minWidth: 380, xlabel: 'wind speed (m/s)', ylabel: 'heat loss (W)', title: 'heat lost by the whole body' });
        const B = v.stage({ x: [-1.6, 1.6], y: [-0.25, 2.2], equal: true, axes: false, height: 290, weight: 0.85, minWidth: 290, title: 'in the wind' });
        const C = v.stage({ x: [0, 15], y: [-60, 30], axes: 'box', gutter: true, height: 230, weight: 1, minWidth: 360, xlabel: 'wind speed (m/s)', ylabel: 'coldest air (°C)', title: 'the coldest air each outfit can stand' });
        const D = evidenceStage(v, [1e5, 2e4], { height: 230, weight: 1.15, minWidth: 380, title: 'awls and eyed needles (years ago, log scale)' });
        const TaS = v.slider('air temperature', -40, 15, -10, { step: 1, fmt: (x) => `${x} °C` });
        const actSel = v.select('activity', [{ value: 104, label: 'resting' }, { value: 260, label: 'walking' }, { value: 420, label: 'hard work' }], 260);
        const wH = A.handle(5, 45, { color: 'ink', label: 'wind', labelPos: 'ne', constrain: (x) => [clamp(x, 0, 15), 45] });
        const Rair = (w) => 1 / (Math.max(3.1, 8.3 * w ** 0.6) + HR);
        const U = (o, w) => { const Rb = Rair(w), Rc = (o.I * CLO) / (1 + o.beta * w) + Rb; return o.f / Rc + (1 - o.f) / Rb; }; // W/(m² K)
        const loss = (o, w, Ta) => AREA * (TS - Ta) * U(o, w);
        const maxWind = (o, Ta, M) => { if (loss(o, 0, Ta) > M) return -1; if (loss(o, 15, Ta) <= M) return 16; let a = 0, b = 15; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (loss(o, m, Ta) > M) b = m; else a = m; } return a; };
        v.render(() => {
          const Ta = TaS.value, M = actSel.value, w = wH.x;
          // ---- A
          A.hline(M, { color: 'gold', width: 2.4 });
          A.text(`metabolic heat ${M} W`, 0.3, M * 0.93, { size: 11, color: 'gold', align: 'left', baseline: 'top', weight: 700, plate: true });
          for (const o of OUT) {
            A.fn((x) => loss(o, x, Ta), { color: o.color, width: 2.4 });
            const mw = maxWind(o, Ta, M);
            if (mw >= 0 && mw <= 15) A.dot(mw, M, { r: 5, color: o.color, hollow: true });
            A.dot(w, loss(o, w, Ta), { r: 4.5, color: o.color });
          }
          A.line(w, 40, w, 6000, { color: 'ink', width: 1, dash: [3, 4] });
          // ---- B: three figures
          const fig = (x0, o) => {
            const q = loss(o, w, Ta) / M, col = q <= 1 ? 'green' : q < 1.6 ? 'orange' : 'red';
            B.circle(x0, 1.72, 0.13, { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
            B.poly([[x0 - 0.2, 1.52], [x0 + 0.2, 1.52], [x0 + 0.16, 0.85], [x0 - 0.16, 0.85]], { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
            B.line(x0 - 0.1, 0.85, x0 - 0.13, 0.05, { color: col, width: 5 }); B.line(x0 + 0.1, 0.85, x0 + 0.13, 0.05, { color: col, width: 5 });
            B.line(x0 - 0.2, 1.5, x0 - 0.3, 0.95, { color: col, width: 4 }); B.line(x0 + 0.2, 1.5, x0 + 0.3, 0.95, { color: col, width: 4 });
            if (o.key === 'drape') { // a hide over the shoulders, lifted by the wind
              const lift = Math.min(0.35, 0.03 * w);
              B.poly([[x0 - 0.3, 1.58], [x0 + 0.3, 1.58], [x0 + 0.34 + lift, 0.95 + lift * 0.6], [x0 - 0.34 + lift * 0.4, 0.9]], { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.6 });
            }
            if (o.key === 'fit') { // parka with hood, trousers and boots
              B.circle(x0, 1.72, 0.17, { color: 'accent', width: 3 });
              B.poly([[x0 - 0.25, 1.55], [x0 + 0.25, 1.55], [x0 + 0.2, 0.8], [x0 - 0.2, 0.8]], { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 2 });
              B.line(x0 - 0.12, 0.8, x0 - 0.14, 0.05, { color: 'accent', width: 9, alpha: 0.55 }); B.line(x0 + 0.12, 0.8, x0 + 0.14, 0.05, { color: 'accent', width: 9, alpha: 0.55 });
              B.line(x0 - 0.24, 1.5, x0 - 0.33, 0.95, { color: 'accent', width: 8, alpha: 0.55 }); B.line(x0 + 0.24, 1.5, x0 + 0.33, 0.95, { color: 'accent', width: 8, alpha: 0.55 });
            }
            B.text(o.label, x0, -0.1, { size: 10.5, color: 'ink', align: 'center' });
            B.text(`${Math.round(loss(o, w, Ta))} W`, x0, 2.05, { size: 12, color: col, align: 'center', weight: 700 });
          };
          fig(-1.05, OUT[0]); fig(0, OUT[1]); fig(1.05, OUT[2]);
          const nArr = Math.round(clamp(w / 3, 0, 5));
          for (let k = 0; k < nArr; k++) B.arrow(-1.58, 0.3 + 0.32 * k, -1.32, 0.3 + 0.32 * k, { color: 'muted', width: 1.4, head: 6 });
          // ---- C: coldest survivable air: Ta = Ts − M/(A U)
          C.hline(Ta, { color: 'ink', width: 1, dash: [4, 4] });
          C.text(`now ${Ta} °C`, 14.8, Ta + 2, { size: 10.5, color: 'ink', align: 'right', baseline: 'bottom' });
          for (const o of OUT) C.fn((x) => TS - M / (AREA * U(o, x)), { color: o.color, width: 2.4 });
          C.line(w, -60, w, 30, { color: 'ink', width: 1, dash: [3, 4] });
          // ---- D
          drawEvidence(v, D, [
            { ago: 7.3e4, label: 'bone awls, Blombos', color: 'orange' },
            { ago: 5.0e4, label: 'Denisova needle, 50 ka claim', contested: true },
            { ago: 4.0e4, label: 'Denisova Cave' },
            { ago: 3.8e4, label: 'Caucasus' },
            { ago: 3.0e4, label: 'East Asia' },
            { ago: 2.6e4, label: 'Europe' },
          ], { lanes: 4, laneH: 0.18, ticks: [7e4, 5e4, 3e4] });
        });
        v.legend(OUT.map((o) => [o.color, o.label]).concat([['gold', 'metabolic heat']]));
        v.readout(() => {
          const Ta = TaS.value, M = actSel.value, w = wH.x;
          const parts = OUT.map((o) => { const L = loss(o, w, Ta), mw = maxWind(o, Ta, M); return `${o.label} **${Math.round(L)} W**${L > M ? ' (cooling)' : ''}, ${mw < 0 ? 'too cold even in still air' : mw > 15 ? 'fine beyond 15 m/s' : `fine up to ${v.fix(mw, 1)} m/s`}`; });
          return `at ${Ta} °C and ${v.fix(w, 1)} m/s wind, against ${M} W of metabolic heat: ${parts.join(' · ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Invention',
      name: 'Pottery',
      credit: 'Hunter-gatherers of East Asia, c. 20,000 years ago (Xianrendong Cave, China)',
      statement: String.raw`Pottery is clay shaped while plastic and then fired, which turns it irreversibly into a hard, porous ceramic that holds water and survives heating. Fired-clay figurines were made at Dolní Věstonice, Czech Republic, about 26,000 years ago, long before pots (Vandiver et al. 1989). The oldest known vessels are sherds from Xianrendong Cave, Jiangxi, China, dated to 20,000–19,000 years ago (Wu et al. 2012). Yuchanyan Cave, Hunan, follows at about 18,000 years (Boaretto et al. 2009), and Odai Yamamoto I in Japan, at the start of the Jōmon tradition, at about 16,500–15,000 years. Residues show that early Jōmon pots were used to cook fish and shellfish about 15,000 years ago (Craig et al. 2013). Pottery was thus invented by mobile hunter-gatherers in East Asia during the last ice age, millennia before farming, and invented again later in Africa, the Near East and the Americas.

Firing proceeds through stages. Pore water leaves below about 200 °C. Between about 450 and 600 °C the clay minerals lose the water bound in their crystal structure; for kaolinite, $\mathrm{Al_2Si_2O_5(OH)_4 \to Al_2Si_2O_7 + 2H_2O}$. After that the body no longer softens in water: it has become ceramic. At 573 °C quartz grains change form with a small jump in volume, which can crack a pot that is heated or cooled too fast. From about 900 °C the particles **sinter**, fusing at their contacts so that the body shrinks and its pores close. Above about 1100 °C a glassy phase forms (vitrification), giving dense stoneware at 1200–1300 °C, temperatures that need a kiln. Open bonfires reach roughly 600–900 °C for minutes to an hour.`,
      idea: String.raw`Both key changes are thermally activated, with rates $k = A\,e^{-E/RT}$ (Arrhenius, kin-2.1). Dehydroxylation has a moderate activation energy, so an hour or less at 500–600 °C completes it, which is easily reached in a bonfire. That is why the oldest pottery could be fired in the open. Sintering is driven by surface energy: atoms diffuse from the curved surfaces of particles into the necks between them (mat-2.7, mat-2.10). Diffusion in silicates has a large activation energy, so densification is negligible below about 900 °C and then accelerates steeply. A few hundred degrees separate porous earthenware from vitrified stoneware, and fuel, draught and kiln design had to supply them.`,
      caption: String.raw`Choose a firing (sun-dried, open bonfire, pit firing, stoneware kiln) or set the **peak temperature** and **hold time**. **Top left:** the firing schedule against the temperatures of each stage. **Top right:** the computed fraction of clay dehydroxylated and the porosity left. **Bottom left:** the clay particles, packed closer as the body sinters, and the soaking test: a pot that has not lost its bound water slumps back into mud. The kinetics are first-order Arrhenius laws with illustrative constants: activation energy 170 kJ/mol for dehydroxylation and 350 kJ/mol for densification.`,
      deps: ['tech-1.3', 'mat-2.7'],
      see: ['mat-8.4', 'mat-8.9', 'kin-2.1', 'mat-5.6'],
      refs: ['Cardwell', 'Wu et al. 2012, Science 336:1696', 'Boaretto et al. 2009, PNAS 106:9595', 'Craig et al. 2013, Nature 496:351', 'Vandiver et al. 1989, Science 246:1002'],
      tags: ['prehistory', 'c. 20 kya', 'ceramics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pottery' },
      viz(v) {
        const RG = 8.314, E1 = 170e3, A1 = 6e7, E2 = 350e3, A2 = 1.45e9, P0 = 0.35, PMIN = 0.01;
        const PRE = { sun: { label: 'sun-dried', T: 60, hold: 600, rate: 1 }, fire: { label: 'open bonfire', T: 750, hold: 20, rate: 25 }, pit: { label: 'pit firing', T: 900, hold: 45, rate: 10 }, kiln: { label: 'stoneware kiln', T: 1250, hold: 60, rate: 4 } };
        const A = v.stage({ x: [0, 12], y: [0, 1350], axes: 'box', gutter: true, height: 270, weight: 1.2, minWidth: 380, xlabel: 'time (h)', ylabel: 'temperature (°C)', title: 'firing schedule and the stages of clay' });
        const B = v.stage({ x: [0, 12], y: [0, 1.02], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 320, xlabel: 'time (h)', ylabel: 'fraction', title: 'what the heat has done' });
        const C = v.stage({ x: [0, 2.2], y: [0, 1.05], equal: true, axes: false, height: 220, weight: 1, minWidth: 360, title: 'inside the body, and the soaking test' });
        const D = evidenceStage(v, [3e4, 1.2e4], { height: 220, weight: 1.15, minWidth: 380, title: 'the first fired clay (years ago, log scale)' });
        let rate = 25;
        const TpS = v.slider('peak temperature', 60, 1300, 750, { step: 5, fmt: (x) => `${Math.round(x)} °C` });
        const holdS = v.slider('hold at peak', 5, 600, 20, { step: 5, log: true, fmt: (x) => `${Math.round(x)} min` });
        const preSel = v.select('firing', Object.entries(PRE).map(([k, p]) => ({ value: k, label: p.label })), 'fire', { onChange: (k) => { TpS.set(PRE[k].T); holdS.set(PRE[k].hold); rate = PRE[k].rate; } });
        /** Integrate the schedule: ramp at `rate` °C/min, hold, cool at 5 °C/min (cooling is slow enough to ignore for the reactions). */
        function fire() {
          const Tp = TpS.value, hold = holdS.value, tUp = (Tp - 20) / rate, tEnd = tUp + hold + (Tp - 20) / 5;
          let a = 0, P = P0; const out = []; const dt = 0.25; // minutes
          for (let t = 0; t <= Math.min(tEnd, 720); t += dt) {
            const T = t < tUp ? 20 + rate * t : t < tUp + hold ? Tp : Math.max(20, Tp - 5 * (t - tUp - hold)), K = T + 273.15;
            const k1 = A1 * Math.exp(-E1 / (RG * K)) * 60, k2 = A2 * Math.exp(-E2 / (RG * K)) * 60;
            a += (1 - a) * (1 - Math.exp(-k1 * dt)); P = PMIN + (P - PMIN) * Math.exp(-k2 * dt);
            if (Math.round(t / dt) % 4 === 0) out.push([t / 60, T, a, P]);
          }
          return out;
        }
        v.render(() => {
          const run = fire(), end = run[run.length - 1], a = end[2], P = end[3], survives = a > 0.9, tMax = Math.max(3, Math.ceil(end[0] * 1.08));
          A.setView([0, tMax], [0, 1350]); B.setView([0, tMax], [0, 1.02]);
          // ---- A
          const bands = [[20, 200, 'blue', 'pore water leaves'], [450, 600, 'orange', 'bound water leaves'], [900, 1100, 'gold', 'sintering'], [1100, 1350, 'red', 'vitrification']];
          for (const [lo, hi, c, lab] of bands) { A.hband(lo, hi, { color: c, alpha: 0.1 }); A.text(lab, tMax * 0.99, (lo + hi) / 2, { size: 10.5, color: c, align: 'right' }); }
          A.hline(573, { color: 'purple', width: 1, dash: [4, 3] }); A.text('quartz inversion 573 °C', tMax * 0.99, 585, { size: 10.5, color: 'purple', align: 'right', baseline: 'bottom' });
          A.path(run.map((r) => [r[0], r[1]]), { color: 'ink', width: 2.6 });
          // ---- B
          B.path(run.map((r) => [r[0], r[2]]), { color: 'orange', width: 2.6 });
          B.path(run.map((r) => [r[0], r[3] / P0]), { color: 'accent', width: 2.6 });
          B.text(`dehydroxylated ${Math.round(100 * a)}%`, tMax * 0.99, Math.min(0.94, a - 0.06), { size: 11.5, color: 'orange', align: 'right', weight: 700 });
          B.text(`porosity ${Math.round(100 * P)}% (from ${Math.round(100 * P0)}%)`, tMax * 0.99, Math.abs(P / P0 - a) < 0.15 ? Math.max(0.05, Math.min(a, P / P0) - 0.2) : Math.max(0.05, P / P0 - 0.07), { size: 11.5, color: 'accent', align: 'right', weight: 700 });
          // ---- C: particles packed closer by densification: linear shrinkage from (1 − P0)/(1 − P) = (L0/L)^3
          const s = Math.cbrt((1 - P0) / (1 - P)), sp = 0.17 * s, r0 = 0.066 + 0.012 * (1 - P / P0);
          C.rect(0.02, 0.05, 1.02, 1.0, { color: 'faint', width: 1 });
          C.clip(() => {
            for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
              const x = 0.06 + i * sp + (j % 2) * sp * 0.5 + 0.012 * Math.sin(7 * i + 3 * j), y = 0.09 + j * sp * 0.87 + 0.012 * Math.cos(5 * i + 2 * j);
              C.circle(x, y, r0, { fill: a > 0.5 ? 'orange' : 'muted', fillAlpha: 0.55, color: 'muted', width: 0.8 });
            }
          }, [0.02, 1.02], [0.05, 1.0]);
          C.text(`linear shrinkage ${v.fix(100 * (1 - s), 1)}%`, 0.52, 0.0, { size: 11, color: 'ink', align: 'center', baseline: 'top' });
          // the soaking test
          C.rect(1.25, 0.05, 2.15, 0.62, { fill: 'blue', fillAlpha: 0.14, stroke: false });
          if (survives) C.poly([[1.5, 0.12], [1.9, 0.12], [1.98, 0.42], [1.9, 0.75], [1.82, 0.8], [1.58, 0.8], [1.5, 0.75], [1.42, 0.42]], { fill: 'orange', fillAlpha: 0.65, color: 'orange', width: 1.6 });
          else C.poly([[1.32, 0.06], [2.08, 0.06], [1.95, 0.16], [1.75, 0.2], [1.55, 0.17]], { fill: 'muted', fillAlpha: 0.7, color: 'muted', width: 1.4 });
          C.text(survives ? 'pot survives soaking' : 'pot slumps back to mud', 1.7, 0.95, { size: 12, color: survives ? 'green' : 'red', align: 'center', weight: 700 });
          // ---- D
          drawEvidence(v, D, [
            { ago: 2.6e4, label: 'Dolní Věstonice figurines', color: 'orange' },
            { ago: [1.9e4, 2.0e4], label: 'Xianrendong' },
            { ago: 1.8e4, label: 'Yuchanyan' },
            { ago: [1.5e4, 1.65e4], label: 'Odai Yamamoto I' },
            { ago: 1.5e4, label: 'Jōmon cooking residues', color: 'green' },
          ], { lanes: 4, laneH: 0.18, ticks: [2.5e4, 2e4, 1.5e4] });
        });
        v.legend([['ink', 'kiln temperature'], ['orange', 'clay dehydroxylated'], ['accent', 'porosity / initial porosity']]);
        v.readout(() => {
          const run = fire(), end = run[run.length - 1], a = end[2], P = end[3];
          const kind = P < 0.04 ? 'vitrified stoneware' : P < 0.25 ? 'sintered earthenware' : a > 0.9 ? 'porous low-fired ceramic' : 'unfired clay';
          return `peak ${Math.round(TpS.value)} °C for ${Math.round(holdS.value)} min: **${Math.round(100 * a)}%** of the clay dehydroxylated, porosity **${Math.round(100 * P)}%** → **${kind}**; ${a > 0.9 ? 'it holds its shape in water' : 'it will slake in water'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Event',
      name: 'Domestication of plants and animals',
      credit: 'Early farmers of the Fertile Crescent, China, Mesoamerica, the Andes, New Guinea and Africa, from c. 11,500 years ago',
      statement: String.raw`Domestication is the evolution of plants and animals under human management into forms that depend on people and serve them better. It happened independently in several regions after the last ice age, beginning in the Fertile Crescent, where people cultivated wild wheat, barley and legumes from about 11,500 years ago and herded goats and sheep by about 10,500 years ago. Wild cereals had been harvested for far longer; at Ohalo II, Israel, they were gathered about 23,000 years ago.

The key trait of domestic cereals is the **tough rachis**. A wild ear shatters when ripe, scattering its grains to sow themselves; a rare mutant ear stays intact and waits to be harvested. In barley, loss of function in either of two genes, *Btr1* or *Btr2*, gives a non-brittle rachis (Pourkheirandish et al. 2015). Harvesting experiments by Hillman and Davies (1990) showed that if near-ripe crops are reaped with sickles or uprooted, and seed is sown on fresh ground each year, the tough-rachis type could take over in 20–200 years, perhaps only 20–30. The archaeological record says otherwise. In the Near East non-shattering ears became common only about 9,500 years ago, and shattering ones were still frequent in fields about 7,500 years ago (Tanno & Willcox 2006). Fuller and colleagues find that the change took at least 2,000–2,500 years, implying selection coefficients of order 0.003–0.005 (Purugganan & Fuller 2011; Fuller et al. 2014). How far ear counts can be read as selection rates is itself debated.`,
      idea: String.raw`Each year the next crop grows from saved harvest. If a brittle plant sheds a fraction $\ell$ of its grain before the harvest, it contributes $1-\ell$ as much seed as a tough plant, which is selection with coefficient $s=\ell$ on the shattering type. For a self-pollinating cereal the frequency $p$ of tough-rachis lines then grows like a haploid allele (popgen-4.3):
$$p' = \frac{p}{p+(1-p)(1-s)}, \qquad \text{so}\qquad \ln\frac{p_t}{1-p_t}=\ln\frac{p_0}{1-p_0}+t\ln\frac{1}{1-s}.$$
Going from one plant in a thousand to 95% takes about $9.8/s$ years for small $s$ (exactly $9.85/\ln\frac{1}{1-s}$): 28 years at $s=0.3$, but 2,500 years at $s=0.004$. Several things weaken selection. Harvesting green, before ears shatter, lowers $\ell$. Sowing the same plot lets shed grain come up again. Restocking with wild seed adds back the wild type. Beating ripe ears into baskets, the way wild stands were gathered, even favours the brittle type. In a small population random drift can lose a new mutant before selection takes hold.`,
      caption: String.raw`Choose a **harvest method**, or set the fraction of grain a brittle ear sheds before harvest; switch **fresh ground** off to let shed grain re-seed the plot, and add **wild seed**. **Right:** the tough-rachis frequency over the years, deterministic (blue) and eight random runs in a population of $N$ plants (gold), against the 20–200 years of the harvesting experiments (orange band) and the 2,000–2,500 years read from the archaeological record (green band). **Left:** the field in the year chosen with the slider: intact blue ears are tough, gold ears dropping their grain are the wild type.`,
      deps: ['tech-1.2', 'popgen-4.3'],
      see: ['bighist-5.2', 'bighist-5.3', 'popgen-6.7', 'popgen-6.2'],
      refs: ['Cardwell', 'Hillman & Davies 1990, J. World Prehist. 4:157', 'Tanno & Willcox 2006, Science 311:1886', 'Purugganan & Fuller 2011, Evolution 65:171', 'Fuller et al. 2014, PNAS 111:6147'],
      tags: ['prehistory', 'c. 10,000 BCE', 'selection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Domestication' },
      viz(v) {
        const YMAX = 3000, P0 = 0.001;
        const A = v.stage({ x: [0, 8], y: [-0.7, 6.3], equal: true, axes: false, height: 300, weight: 0.85, minWidth: 290, title: 'the field' });
        const B = v.stage({ x: [1, YMAX], y: [0, 1.02], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1.35, minWidth: 420, xlabel: 'years of cultivation', ylabel: 'tough-rachis frequency', title: 'the tough rachis spreading' });
        const METHODS = { beat: { label: 'beat into baskets', l: -0.05 }, green: { label: 'reap green', l: 0.004 }, sickle: { label: 'sickle, near ripe', l: 0.3 }, uproot: { label: 'uproot, ripe', l: 0.6 } };
        const lS = v.slider('grain shed by a brittle ear before harvest', 0.001, 0.6, 0.004, { log: true, fmt: (x) => `${(100 * x).toPrecision(2)}%` });
        let against = false;
        const mSel = v.select('harvest', Object.entries(METHODS).map(([k, m]) => ({ value: k, label: m.label })), 'green', { onChange: (k) => { against = k === 'beat'; lS.set(Math.abs(METHODS[k].l)); } });
        const fresh = v.toggle('sow on fresh ground each year', true);
        const wildS = v.slider('wild seed mixed in each year', 0, 0.05, 0, { step: 0.001, fmt: (x) => `${(100 * x).toFixed(1)}%` });
        const NSel = v.select('plants $N$', [{ value: 200, label: '200' }, { value: 2000, label: '2,000' }, { value: 20000, label: '20,000' }], 20000);
        const yS = v.slider('year shown in the field', 1, YMAX, 1800, { log: true, fmt: (x) => `${Math.round(x)}` });
        const sEff = () => (against ? -lS.value : lS.value * (fresh.value ? 1 : 0.4)); // shed grain that re-seeds the plot gives back 60% of the loss
        const step = (p, s, m) => (1 - m) * (p / (p + (1 - p) * (1 - s)));
        function binom(rng, n, p) { // binomial sample: normal or Poisson approximations away from the middle
          if (p <= 0) return 0; if (p >= 1) return n;
          const mu = n * p;
          if (mu < 25) { let k = 0, t = Math.exp(-mu), c = t; const u = rng(); while (u > c && k < n) { k++; t *= mu / k; c += t; } return k; }
          if (n - mu < 25) return n - binom(rng, n, 1 - p);
          return clamp(Math.round(mu + Math.sqrt(mu * (1 - p)) * rng.normal()), 0, n);
        }
        let key = '', det = [], reps = [];
        function simulate() {
          const s = sEff(), m = wildS.value, N = NSel.value, k = `${s}|${m}|${N}`;
          if (k === key) return; key = k;
          det = [P0]; for (let t = 1; t <= YMAX; t++) det.push(step(det[t - 1], s, m));
          reps = [];
          for (let r = 0; r < 8; r++) {
            const rng = v.rng(17 + r), arr = new Float32Array(YMAX + 1); let n = Math.max(1, Math.round(P0 * N)); arr[0] = n / N;
            for (let t = 1; t <= YMAX; t++) { n = binom(rng, N, step(n / N, s, m)); if (n === 0 && m === 0 && r < 8) n = 0; arr[t] = n / N; }
            reps.push(arr);
          }
        }
        const yearTo = (q) => { const i = det.findIndex((p) => p >= q); return i < 0 ? null : i; };
        v.render(() => {
          simulate();
          const yr = Math.round(yS.value);
          // ---- B
          B.vband(20, 200, { color: 'orange', alpha: 0.13 });
          B.vband(2000, 2500, { color: 'green', alpha: 0.16 });
          B.text('harvest experiments', 63, 0.95, { size: 10.5, color: 'orange', align: 'center' });
          B.text('archaeology', 1900, 0.95, { size: 10.5, color: 'green', align: 'right' });
          for (const arr of reps) B.path(Array.from(arr, (q, t) => [t + 1, q]).filter((_, t) => t % 3 === 0 || t < 60), { color: 'gold', width: 1, alpha: 0.6 });
          B.path(det.map((q, t) => [t + 1, q]), { color: 'accent', width: 2.8 });
          B.vline(yr + 1, { color: 'ink', dash: [3, 4], width: 1 });
          B.dot(yr + 1, det[yr], { r: 5, color: 'accent' });
          // ---- A: 48 plants drawn with the expected frequency in year yr
          const pf = det[yr], rng = v.rng(5), cols = 8, rows = 6;
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const x = i + 0.5 + 0.2 * (rng() - 0.5), y = j - 0.05, tough = rng() < pf;
            A.line(x, y, x + 0.04, y + 0.42, { color: 'green', width: 1.4, alpha: 0.8 });
            for (let k = 0; k < 6; k++) {
              const ex = x + 0.04 + (k % 2 ? 0.07 : -0.07), ey = y + 0.47 + 0.075 * k;
              if (tough || k < 3) A.circle(ex, ey, 0.055, { fill: tough ? 'accent' : 'gold', fillAlpha: 0.9, stroke: false });
              else A.circle(x + 0.22 + 0.18 * rng(), y + 0.05 + 0.25 * rng(), 0.045, { fill: 'gold', fillAlpha: 0.75, stroke: false });
            }
          }
          A.text(`year ${yr}: ${Math.round(100 * det[yr])}% tough (expected)`, 4, -0.45, { size: 12, color: 'ink', align: 'center', weight: 700 });
        });
        v.legend([['accent', 'expected (no drift)'], ['gold', 'random runs, $N$ plants'], ['orange', 'Hillman & Davies: 20–200 yr', { area: true }], ['green', 'archaeology: ≥ 2,000–2,500 yr', { area: true }]]);
        v.readout(() => {
          simulate();
          const s = sEff(), y50 = yearTo(0.5), y95 = yearTo(0.95), lost = reps.filter((a) => a[YMAX] < 0.01).length;
          const need = Math.log((0.95 / 0.05) * ((1 - P0) / P0)) / 2250;
          return `selection coefficient $s$ = **${v.fix(s, 4)}** · from 1 plant in 1,000: 50% in **${y50 ?? '> 3000'}** years, 95% in **${y95 ?? '> 3000'}** years${wildS.value > 0 && !y95 ? ' (wild seed holds it back)' : ''} · ${lost} of 8 random runs lost the mutant · to take 2,250 years needs $s \\approx ${v.fix(need, 4)}$, the archaeological order of magnitude`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Invention',
      name: 'Spinning and the loom',
      credit: 'Twisted cord by c. 45,000 years ago; loom weights from the Early Neolithic, 7th–6th millennium BCE',
      statement: String.raw`**Spinning** twists short fibres into a continuous yarn: twist makes the fibres press on one another, so friction holds them together under tension. Twisting two yarns together the opposite way (plying) gives a balanced cord that does not kink. **Weaving** interlaces two sets of yarns at right angles: the *warp*, held taut on a loom, and the *weft*, passed through the *shed*, the gap opened by lifting some warp threads and not others. Which warp threads rise on each pass, the lifting sequence, fixes the weave: alternate threads give **plain weave**, a lift that steps over by one thread each pass gives a diagonal **twill**, and lifts spread out so that no two neighbouring threads interlace together give a smooth-faced **satin**.

The oldest evidence of twisted cord is a three-ply fragment of inner-bark fibre on a stone tool from Abri du Maras, France, made by Neanderthals 41,000–52,000 years ago (Hardy et al. 2020). Twisted, partly dyed wild flax fibres at Dzudzuana Cave, Georgia, date to about 36,000–31,000 calibrated years ago (Kvavadze et al. 2009). Impressions of plain-woven and twined fabrics in fired clay from Pavlov I and Dolní Věstonice, Czech Republic, are about 26,000 years old (Adovasio, Soffer & Klíma 1996). Clay loom weights show that the **warp-weighted loom**, with its warp hanging from a beam and tensioned by weights, was in use in the Early Neolithic, in the 7th–6th millennia BCE, between Anatolia and central Europe. Spindle whorls, which give a hand spindle the momentum to keep twisting, become common in the same period, as people grew flax and kept sheep.`,
      idea: String.raw`A fibre wound in a helix at angle $\alpha$ around a yarn of diameter $d$ with $T$ turns per unit length satisfies $\tan\alpha = \pi d T$, by unrolling one turn of the helix into a right triangle. The radial pressure that grips the fibres grows with twist, so a yarn gets stronger as twist is added. Each fibre, though, then pulls at an angle and contributes only about $\cos^2\alpha$ of its stiffness along the yarn, so past an optimum more twist weakens the yarn.

A weave is a binary matrix: entry $(i,j)$ says whether warp $j$ lies over weft $i$. With a straight threading (warp $j$ on shaft $j \bmod n$) the matrix is generated entirely by the loom's lifting plan, so a handful of shafts gives every periodic pattern up to that repeat. The pattern controls the cloth. Frequent interlacing (plain weave) makes a firm, stable fabric. Long floats (satin) make a smooth, supple fabric that snags easily. With threads of two colours, the same weave produces striking colour-and-weave effects, such as houndstooth from a 2/2 twill with four dark and four light threads. The idea that a lifting plan generates the pattern runs from this loom to the Jacquard loom's punched cards.`,
      caption: String.raw`Pick a **weave** and a **colour order**, or **click the lifting plan** (right of the draft) to raise or lower a shaft on a given pass and invent your own. The threading (top) is a straight draw, and the drawdown (centre) is computed from the two. The close-up shows warp (vertical) and weft (horizontal) passing over and under each other. The readout reports the repeat, the longest float and how often the threads interlace. **Bottom left:** the spun yarn, with fibres at the helix angle $\tan\alpha=\pi d T$ set by the twist slider.`,
      deps: ['tech-1.6', 'tech-1.8'],
      see: ['tech-8.6'],
      refs: ['Usher, “Textile machinery”', 'Hardy et al. 2020, Sci. Rep. 10:4889', 'Kvavadze et al. 2009, Science 325:1359', 'Adovasio, Soffer & Klíma 1996, Antiquity 70:526'],
      tags: ['prehistory', 'textiles', 'patterns'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Warp-weighted_loom' },
      viz(v) {
        const N = 16, D2R = Math.PI / 180;
        const PRE = {
          plain: { label: 'plain', S: 2, lift: (r, k) => (r + k) % 2 === 0 },
          twill22: { label: '2/2 twill', S: 4, lift: (r, k) => (k - r + 8) % 4 < 2 },
          twill31: { label: '3/1 twill', S: 4, lift: (r, k) => (k - r + 8) % 4 < 3 },
          satin: { label: '5-end satin', S: 5, lift: (r, k) => k === (2 * r) % 5 },
        };
        const A = v.stage({ x: [-0.6, 22.8], y: [-1.4, 22.4], equal: true, axes: false, height: 360, weight: 1.15, minWidth: 360, title: 'weaving draft: threading, lifting plan, drawdown' });
        const B = v.stage({ x: [0, 8], y: [0, 8], equal: true, axes: false, height: 360, weight: 1, minWidth: 320, title: 'close-up: over and under' });
        const C = v.stage({ x: [-2.3, 2.3], y: [-0.95, 0.95], equal: true, axes: false, height: 170, weight: 0.9, minWidth: 300, title: 'spun yarn' });
        const D = evidenceStage(v, [6e4, 6e3], { height: 170, weight: 1.3, minWidth: 400, title: 'cord, cloth and loom (years ago, log scale)' });
        let S = 4, lift = [];
        const load = (k) => { const p = PRE[k]; S = p.S; lift = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, kk) => p.lift(r, kk))); };
        const weave = v.select('weave', Object.entries(PRE).map(([k, p]) => ({ value: k, label: p.label })), 'twill22', { onChange: load });
        const colSel = v.select('colour order', [{ value: 0, label: 'one colour' }, { value: 1, label: '1 dark : 1 light' }, { value: 2, label: '2 : 2' }, { value: 4, label: '4 : 4' }], 4);
        const twS = v.slider('twist (yarn 1.2 mm thick)', 0.5, 8, 1.5, { step: 0.1, fmt: (x) => `${x.toFixed(1)} turns/cm` });
        load('twill22');
        const up = (r, c) => lift[r % S][c % S]; // is warp c over weft r?
        const dark = (i) => colSel.value > 0 && Math.floor(i / colSel.value) % 2 === 0;
        A.onClick((x, y) => {
          const k = Math.floor(x - 16.6), r = Math.floor(15.5 - y + 0.5);
          if (k >= 0 && k < S && r >= 0 && r < N) { const rr = r % S; lift[rr][k] = !lift[rr][k]; }
        });
        function stats() {
          let maxWarp = 0, maxWeft = 0, inter = 0, tot = 0, warpUp = 0; const dead = [];
          for (let r = 0; r < S; r++) { const row = lift[r]; if (row.every((b) => b) || row.every((b) => !b)) dead.push(r + 1); }
          for (let c = 0; c < S; c++) { let run = 0, best = 0; for (let r = 0; r < 2 * S; r++) { if (up(r, c)) { run++; best = Math.max(best, run); } else run = 0; if (up(r, c) !== up(r + 1, c)) inter++; tot++; } maxWarp = Math.max(maxWarp, Math.min(best, S)); }
          for (let r = 0; r < S; r++) { let run = 0, best = 0; for (let c = 0; c < 2 * S; c++) { if (!up(r, c)) { run++; best = Math.max(best, run); } else run = 0; if (up(r, c) !== up(r, c + 1)) inter++; tot++; if (c < S && up(r, c)) warpUp++; } maxWeft = Math.max(maxWeft, Math.min(best, S)); }
          return { maxWarp, maxWeft, inter: inter / tot, warpFace: warpUp / (S * S), dead };
        }
        v.render(() => {
          // ---- A: the draft
          for (let c = 0; c < N; c++) for (let k = 0; k < S; k++) { const x = 15 - c, y = 16.6 + k; A.rect(x, y, x + 1, y + 1, { fill: c % S === k ? 'ink' : 'panel', fillAlpha: c % S === k ? 0.8 : 1, color: 'faint', width: 0.6 }); }
          for (let r = 0; r < N; r++) for (let k = 0; k < S; k++) { const x = 16.6 + k, y = 15 - r; A.rect(x, y, x + 1, y + 1, { fill: lift[r % S][k] ? 'accent' : 'panel', fillAlpha: lift[r % S][k] ? (r < S ? 0.9 : 0.4) : 1, color: 'faint', width: 0.6 }); }
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            const x = 15 - c, y = 15 - r, wu = up(r, c), dk = wu ? dark(c) : dark(r);
            const fill = colSel.value === 0 ? (wu ? 'ink' : 'panel') : dk ? 'purple' : 'gold';
            A.rect(x, y, x + 1, y + 1, { fill, fillAlpha: colSel.value === 0 ? (wu ? 0.75 : 1) : 0.85, color: 'faint', width: 0.4 });
          }
          A.rect(16 - S, 16 - S, 16, 16, { color: 'red', width: 1.8 });
          A.text('threading', 8, 17.1 + S, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          A.text('lifting plan', 16.6 + S / 2, 16.9, { size: 11, color: 'accent', align: 'center', baseline: 'bottom' });
          A.text('drawdown', 8, -0.15, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
          // ---- B: close-up of 8 × 8 crossings
          const wcol = (c) => (colSel.value === 0 ? 'orange' : dark(c) ? 'purple' : 'gold'), fcol = (r) => (colSel.value === 0 ? 'accent' : dark(r) ? 'purple' : 'gold');
          for (let c = 0; c < 8; c++) B.rect(7 - c + 0.18, 0, 7 - c + 0.82, 8, { fill: wcol(c), fillAlpha: 0.5, color: wcol(c), width: 1 });
          for (let r = 0; r < 8; r++) B.rect(0, 7 - r + 0.18, 8, 7 - r + 0.82, { fill: fcol(r), fillAlpha: 0.85, color: 'ink', width: 0.8 });
          for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (up(r, c)) { const x = 7 - c, y = 7 - r; B.rect(x + 0.18, y + 0.05, x + 0.82, y + 0.95, { fill: wcol(c), fillAlpha: 1, color: 'ink', width: 0.8 }); B.line(x + 0.5, y + 0.15, x + 0.5, y + 0.85, { color: 'panel', width: 1, alpha: 0.5 }); }
          // ---- C: yarn helix
          const T = twS.value, d = 0.12, alpha = Math.atan(Math.PI * d * T); // d in cm
          const Rv = 0.6, pitch = (2 * Math.PI * Rv) / Math.tan(alpha);
          C.rect(-2.2, -Rv, 2.2, Rv, { fill: 'gold', fillAlpha: 0.25, stroke: false, radius: 6 });
          C.clip(() => { for (let x0 = -2.2 - 2 * pitch; x0 < 2.2; x0 += pitch / 5) C.curve((t) => [x0 + (pitch * t) / (2 * Math.PI), Rv * Math.cos(t)], 0, Math.PI, { color: 'orange', width: 1.4 }); }, [-2.2, 2.2], [-Rv, Rv]);
          C.text(`helix angle α = ${v.fix(alpha / D2R, 0)}° · cos²α = ${v.fix(Math.cos(alpha) ** 2, 2)}`, 0, -0.82, { size: 11.5, color: 'ink', align: 'center', weight: 700 });
          // ---- D
          drawEvidence(v, D, [
            { ago: [4.1e4, 5.2e4], label: 'Abri du Maras cord' },
            { ago: [3.1e4, 3.6e4], label: 'Dzudzuana flax' },
            { ago: 2.6e4, label: 'Pavlov woven impressions' },
            { ago: [7.5e3, 9e3], label: 'loom weights', color: 'orange' },
          ], { lanes: 3, laneH: 0.24, ticks: [5e4, 2e4, 1e4] });
        });
        v.legend([['accent', 'shaft lifted on that pass'], ['red', 'one repeat of the pattern']]);
        v.readout(() => {
          const st = stats();
          const name = { plain: 'plain weave', twill22: '2/2 twill', twill31: '3/1 twill', satin: 'satin' }[weave.value];
          return `${S} shafts, repeat ${S} × ${S} · longest float: warp over ${st.maxWarp}, weft over ${st.maxWeft} · threads change sides at **${Math.round(100 * st.inter)}%** of crossings (plain weave: 100%) · warp shows on ${Math.round(100 * st.warpFace)}% of the face${st.dead.length ? ` · **pass ${st.dead.join(', ')} never interlaces: that weft would lie loose**` : ''}${colSel.value === 4 && weave.value === 'twill22' ? ' · 4 : 4 colours on a 2/2 twill: houndstooth' : ''} (started from ${name})`;
        });
      },
    },
  ],
};
