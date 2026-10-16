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
      idea: String.raw`Heat flows from skin at about 33 °C to the air through resistances in series: the clothing (insulation is measured in clo, $1\ \mathrm{clo} = 0.155\ \mathrm{m^2\,K/W}$, mostly still air held by fibres or fur) and the boundary layer of air at the surface. Wind thins the boundary layer, since the convective coefficient grows roughly as $h_c \approx 8.3\,v^{0.6}\ \mathrm{W/(m^2\,K)}$, and it also pumps air through gaps and openings, cutting the clothing's own insulation (thermo-7.3, thermo-7.5). For ordinary clothing the international standard ISO 9920 puts the loss at about a third at 3.5 m/s.

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
  ],
};
