// History of Technology — Chapter 3: Materials, writing and number (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
import { yearStage, drawYears, OXIDES, reduceRatio, boudouardRatio, lump } from './ch03.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const K0 = 273.15;

export default {
  collection: 'tech',
  chapter: 3,
  title: 'Materials, writing and number',
  summary: String.raw`Kilns hot enough to fire pottery also made metallurgy possible. Copper oxides give up their oxygen to burning charcoal easily; the hard part was getting hot enough for the metal to melt and run together. Then came bronze, whose tin makes copper harder and easier to cast, iron reduced in a bloomery without ever melting, and steel hardened by carbon and a quench. Glass is sand melted at a workable temperature with soda as a flux. In the same millennia the first cities kept their accounts on clay: tallies of grain and sheep became numerals, and pictures became signs for sounds. Paper made writing cheap. Counting boards and the abacus, and then place-value numerals with a zero, turned arithmetic into a routine that anyone could follow. Each item below is a working, computed model with a way to break it, and a strip of dated evidence with the disputed dates drawn hollow and dashed.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Invention',
      name: 'Copper smelting',
      credit: 'Vinča culture, Belovode (Serbia), 49th century BCE; also Iran and Anatolia in the 5th millennium BCE',
      statement: String.raw`**Smelting** extracts a metal from its ore by heating the ore with a reducing fuel. For copper the usual early ores were the green and blue carbonates malachite, $\mathrm{Cu_2CO_3(OH)_2}$, and azurite. Heated, they lose water and $\mathrm{CO_2}$ to leave copper oxide, and carbon monoxide from the burning charcoal then takes the oxygen away:
$$\mathrm{Cu_2O + CO \to 2\,Cu + CO_2}.$$
The oldest securely dated smelting is at **Belovode**, a Vinča culture settlement in eastern Serbia, where malachite was smelted in the 49th century BCE (Radivojević et al. 2010). Crucible smelting at Tal-i Iblis in Iran is dated to the late 6th to early 5th millennium BCE, and smelting is attested in southeastern Anatolia and the Negev in the later 5th millennium. Native copper had been hammered and annealed into beads and awls at Çayönü in Anatolia since about 8000 BCE, but that is not smelting. A green "slag" from Çatalhöyük (about 6500 BCE) was long cited as the first smelting. Re-analysis showed it to be copper pigment accidentally burnt in a house fire (Radivojević et al. 2017).

Smelting needs a kiln-like furnace: the reduction runs at a few hundred degrees above a pottery firing, and the copper only melts and runs together into a lump at 1085 °C.`,
      idea: String.raw`Whether an oxide can be reduced is a question of Gibbs energy (pchem-7.16). The reaction $\mathrm{MO + CO \to M + CO_2}$ goes forward when the gas is richer in CO than a threshold ratio $p_\mathrm{CO}/p_\mathrm{CO_2} = e^{\Delta G^\circ/RT}$, where $\Delta G^\circ$ is the standard Gibbs energy of the reaction. Copper's oxide is so weakly bound that the threshold is tiny: any smoky charcoal fire reduces it. Iron's oxide needs a gas with about three parts CO to one of $\mathrm{CO_2}$, which only a deep bed of glowing charcoal supplies. The fuel sets an upper limit: at the Boudouard equilibrium, $\mathrm{C + CO_2 \rightleftharpoons 2CO}$, hot charcoal turns almost all the $\mathrm{CO_2}$ into CO above about 900 °C.

So the practical barrier for copper was not chemistry but heat. Below 1085 °C the reduced copper stays as tiny solid grains scattered through the charge. Above it they melt and collect, and the stony part of the ore has to melt into a runny slag too (about 1100–1200 °C) to let them sink. Blowpipes and later bellows, forcing air through a charcoal bed, gave those temperatures (tech-1.3, tech-1.7).`,
      caption: String.raw`Drag the gold **furnace point** on the left chart: right is hotter, up is a more reducing gas (more charcoal and less air). It cannot rise above the black dashed **charcoal limit** (Boudouard equilibrium). The selected ore turns to metal in the green region above its line. Copper is reduced almost everywhere, so the real threshold is the 1085 °C line where its grains melt and run together, shown in the furnace on the right. Choose **cassiterite** or **haematite** to see that tin oxide needs more CO, and iron oxide needs a gas that only a deep, hot charcoal bed can make.`,
      deps: ['tech-1.7', 'tech-1.3', 'pchem-7.16'],
      see: ['tech-3.3', 'pchem-7.1', 'mat-10.1'],
      refs: ['Mokyr ch. 2', 'Radivojević et al. 2010, J. Archaeol. Sci. 37:2775', 'Radivojević et al. 2017, J. Archaeol. Sci. 86:101', 'Roberts, Thornton & Pigott 2009, Antiquity 83:1012'],
      tags: ['ancient', 'c. 5000 BCE', 'metallurgy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Smelting' },
      viz(v) {
        const A = v.stage({ x: [600, 1600], y: [1e-6, 3e4], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.25, minWidth: 380, xlabel: 'furnace temperature (°C)', ylabel: 'CO / CO₂ in the furnace gas', title: 'which oxides charcoal can reduce' });
        const B = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.25], equal: true, axes: false, height: 320, weight: 1, minWidth: 300, title: 'inside the furnace after an hour' });
        const C = yearStage(v, [-9300, -3500], { height: 175, full: true, title: 'dated evidence: from hammered native copper to smelting' });
        const ORES = {
          Cu2O: { label: 'malachite (copper)', raw: 'green', metal: 'orange', mp: 1085, mname: 'copper' },
          SnO2: { label: 'cassiterite (tin)', raw: 'muted', metal: 'faint', mp: 232, mname: 'tin' },
          FeO: { label: 'haematite (iron)', raw: 'red', metal: 'ink', mp: 1538, mname: 'iron' },
        };
        const ore = v.select('ore', Object.entries(ORES).map(([k, o]) => ({ value: k, label: o.label })), 'Cu2O');
        const P = A.handle(1150, 30, { color: 'gold', label: 'furnace', labelPos: 'ne', constrain: (x, y) => { const T = clamp(x, 620, 1580); return [T, clamp(y, 0.01, boudouardRatio(T + K0) * 0.98)]; } });
        const SLAG_T = 1150; // a fayalitic slag runs freely from about here (fayalite itself melts at 1205 °C)
        // illustrative kinetics: first-order reduction, E = 120 kJ/mol, half-reduced in about an hour at 800 °C when the gas is far above threshold
        const extent = (key, Tc, r) => {
          const T = Tc + K0, th = reduceRatio(key, T); if (r <= th) return 0;
          const k = Math.log(2) * Math.exp(-120e3 / 8.314 * (1 / T - 1 / 1073)), drive = 1 - th / r;
          return 1 - Math.exp(-k * drive * 1);
        };
        v.render(() => {
          const key = ore.value, o = ORES[key], Tc = P.x, r = P.y, T = Tc + K0;
          // ---- A: threshold curves
          const curve = (k2) => (Tx) => reduceRatio(k2, Tx + K0);
          A.between(curve(key), () => 3e4, 600, 1600, { fill: 'green', fillAlpha: 0.1 });
          A.between(() => 1e-6, curve(key), 600, 1600, { fill: 'red', fillAlpha: 0.06 });
          for (const k2 of Object.keys(ORES)) {
            const on = k2 === key;
            A.fn(curve(k2), { color: on ? 'accent' : 'muted', width: on ? 2.6 : 1.3, alpha: on ? 1 : 0.7 });
          }
          A.text('Cu₂O → Cu', 1590, reduceRatio('Cu2O', 1590 + K0) * 2.2, { size: 11, color: key === 'Cu2O' ? 'accent' : 'muted', align: 'right', baseline: 'bottom' });
          A.text('SnO₂ → Sn', 1590, reduceRatio('SnO2', 1590 + K0) * 2.2, { size: 11, color: key === 'SnO2' ? 'accent' : 'muted', align: 'right', baseline: 'bottom' });
          A.text('FeO → Fe', 1590, reduceRatio('FeO', 1590 + K0) * 2.2, { size: 11, color: key === 'FeO' ? 'accent' : 'muted', align: 'right', baseline: 'bottom' });
          A.fn((Tx) => boudouardRatio(Tx + K0), { color: 'ink', width: 2, dash: [6, 4] });
          A.text('charcoal limit (C + CO₂ ⇌ 2CO)', 630, 900, { size: 10.5, color: 'ink', align: 'left', baseline: 'middle', plate: true });
          A.arrow(700, 400, 745, boudouardRatio(745 + K0) * 1.6, { color: 'ink', width: 1, head: 6 });
          for (const [t, lab, c, right] of [[1085, 'Cu melts 1085', 'orange', true], [SLAG_T, 'slag runs ~1150', 'purple', false], [1538, 'Fe melts 1538', 'red', true]]) {
            A.vline(t, { color: c, width: 1.2, dash: [4, 3] });
            A.text(lab, t, t > 1500 ? 2.5e-5 : 2.5e-6, { size: 10.5, color: c, align: right ? 'right' : 'left', dx: right ? -4 : 4, baseline: 'bottom', plate: true });
          }
          const yStab = key === 'Cu2O' ? 3e-2 : key === 'SnO2' ? 30 : 300, yOx = key === 'Cu2O' ? 1.5e-5 : key === 'SnO2' ? 3e-3 : 3e-2;
          A.text(`${o.mname} stable`, key === 'Cu2O' ? 900 : 1250, yStab, { size: 12, color: 'green', align: 'left', weight: 700, plate: true });
          A.text('oxide stable', key === 'Cu2O' ? 700 : 1250, yOx, { size: 12, color: 'red', align: 'left', weight: 700, plate: true });
          // ---- B: furnace section
          const th = reduceRatio(key, T), red = extent(key, Tc, r), liquid = red > 0.05 && Tc >= o.mp, slag = Tc >= SLAG_T;
          const glow = clamp((Tc - 600) / 1000, 0, 1);
          B.poly([[-1.15, 0.95], [-0.95, -0.85], [0.95, -0.85], [1.15, 0.95]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 2 });
          B.poly([[-0.98, 0.9], [-0.82, -0.7], [0.82, -0.7], [0.98, 0.9]], { fill: 'orange', fillAlpha: 0.08 + 0.35 * glow, color: 'faint', width: 1 });
          // blowpipes
          for (const sx of [-1, 1]) { B.line(sx * 1.25, 1.15, sx * 0.85, 0.35, { color: 'muted', width: 4 }); B.arrow(sx * 1.22, 1.1, sx * 0.95, 0.55, { color: 'accent', width: 1.5, head: 7 }); }
          B.text('air', -1.18, 1.2, { size: 10.5, color: 'accent', align: 'left' }); B.text('air', 1.18, 1.2, { size: 10.5, color: 'accent', align: 'right' });
          // charge: charcoal and ore lumps
          const rng = v.rng(7), lumps = [];
          for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) { const y = -0.22 + j * 0.24, w = 0.72 + 0.12 * (y + 0.4) / 1.1; lumps.push([-w + (i + 0.5) * (2 * w / 6) + rng.uniform(-0.04, 0.04), y + rng.uniform(-0.04, 0.04), 0.075 + 0.03 * rng(), (i + 2 * j) % 3 === 0]); }
          const pool = liquid ? 0.12 + 0.12 * red : 0, slagH = slag ? 0.12 : 0;
          for (const [x, y, rr, isOre] of lumps) {
            const pts = lump(x, y, rr, Math.round((x + 2) * 1000 + y * 77));
            if (!isOre) { B.poly(pts, { fill: 'ink', fillAlpha: 0.55, color: 'ink', width: 0.6 }); continue; }
            B.poly(pts, { fill: o.raw, fillAlpha: 0.75 * (1 - 0.8 * red), color: o.raw, width: 0.8 });
            if (red > 0.02 && !liquid) { const r2 = v.rng(Math.round(x * 1e3 + 5e3)); for (let k = 0; k < Math.round(8 * red); k++) B.dot(x + r2.uniform(-rr, rr) * 0.6, y + r2.uniform(-rr, rr) * 0.6, { r: 1.8, color: o.metal }); }
          }
          if (slag) B.rect(-0.8, -0.7 + pool, 0.8, -0.7 + pool + slagH, { fill: 'purple', fillAlpha: 0.35, stroke: false });
          if (liquid) B.poly([[-0.82, -0.7], [0.82, -0.7], [0.8, -0.7 + pool], [-0.8, -0.7 + pool]], { fill: o.metal, fillAlpha: 0.85, color: o.metal, width: 1.2 });
          if (slag) B.text('slag', 0.6, -0.7 + pool + slagH / 2, { size: 10.5, color: 'purple', align: 'center', baseline: 'middle' });
          if (liquid) B.text(`molten ${o.mname}`, 0, -0.7 + pool / 2, { size: 11, color: key === 'FeO' ? 'panel' : 'ink', align: 'center', baseline: 'middle', weight: 700 });
          const msg = r <= th ? [`gas too weak: ${o.mname} oxide is stable`, 'red']
            : red < 0.05 ? ['too cold: the ore barely reacts in an hour', 'red']
            : liquid && (slag || key === 'SnO2') ? [`${o.mname} melts and collects into a lump`, 'green']
            : liquid ? [`${o.mname} melts, but trapped in stiff slag`, 'orange']
            : [`solid ${o.mname} grains scattered in the charge`, 'orange'];
          B.corner(msg[0], 'bl', { color: msg[1], weight: 700, size: 12 });
          // ---- C: evidence
          drawYears(v, C, [
            { t: [-8200, -7000], label: 'native copper annealed, Çayönü', color: 'orange' },
            { t: -6500, label: 'Çatalhöyük "slag"', contested: true },
            { t: [-5200, -4800], label: 'crucibles, Tal-i Iblis (Iran)' },
            { t: [-4900, -4800], label: 'malachite smelted, Belovode', color: 'green' },
            { t: [-4500, -4000], label: 'smelting in Anatolia and the Negev' },
          ], { lanes: 3, ticks: [-9000, -8000, -7000, -6000, -5000, -4000] });
        });
        v.legend([['accent', 'reduction threshold of the selected ore'], ['muted', 'other ores'], ['ink', 'charcoal limit', { dash: [6, 4] }], ['gold', 'furnace state', { dot: true }]]);
        v.readout(() => {
          const key = ore.value, o = ORES[key], Tc = P.x, r = P.y, T = Tc + K0, th = reduceRatio(key, T), red = extent(key, Tc, r), co = (100 * r) / (1 + r);
          return `furnace ${Math.round(Tc)} °C, gas CO/CO₂ = ${v.fmt(r, 3)} (${v.fix(co, co > 99 ? 2 : 1)}% CO; charcoal limit ${v.fmt(boudouardRatio(T), 3)}) · ${OXIDES[key].label} needs CO/CO₂ > **${v.fmt(th, 3)}** → ${r > th ? `reducing by a factor $${v.sci(r / th, 2)}$, about **${Math.round(100 * red)}%** reduced after an hour (illustrative kinetics)` : '**no reduction**'} · ${o.mname} melts at ${o.mp} °C`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Invention',
      name: 'Bronze',
      credit: 'Balkans (Pločnik, c. 4650 BCE) and widely across the Near East from c. 3000 BCE',
      statement: String.raw`**Bronze** is copper alloyed with tin, classically about 10% by weight. Compared with copper it is harder, it work-hardens further under the hammer, it holds a sharper edge, and it melts at a lower temperature and pours more freely into a mould. The oldest known tin bronze is a foil with 11.7% tin from **Pločnik**, Serbia, from a layer of about 4650 BCE (Radivojević et al. 2013), probably smelted from mixed copper–tin ores. Deliberately alloyed bronze spread across the Near East and Europe during the 3rd millennium BCE. Because tin ores are rare and far from most copper sources, bronze created long-distance trade: the **Uluburun** shipwreck off southern Turkey (about 1300 BCE) carried about ten tonnes of Cypriot copper and one tonne of tin, the 10 : 1 ratio of a standard bronze.

Scope: tin contents up to about 15% give the ductile $\alpha$ solid solution that can be hammered cold; above that the brittle $\delta$ phase appears and the metal must be cast or worked hot.`,
      idea: String.raw`Tin atoms dissolve substitutionally in copper's face-centred cubic lattice. They are larger than copper atoms, and the strain field around each one pins the dislocations whose motion is plastic flow, so the alloy is harder (solid-solution strengthening), and hammering multiplies dislocations that tangle even more (work hardening). Edge wear follows Archard's law: the volume worn away is proportional to the load times the sliding distance divided by the hardness, so doubling the hardness halves the wear.

The phase diagram explains the casting advantage (mat-6.1): tin lowers the liquidus from 1085 °C for pure copper to about 1000 °C at 11% tin, and a long solidification range lets the metal fill fine moulds. Beyond about 14% tin the solid solution is saturated. Cast metal is cored, so the tin-rich last liquid forms hard, brittle $\alpha+\delta$ eutectoid even below that limit, and with more tin the network of brittle phase makes cold hammering crack the metal.`,
      caption: String.raw`Set the **tin content**, the **cold work** (thickness reduction by hammering) and the number of **cuts**. Left: the copper-rich side of the Cu–Sn phase diagram, with the alloy's vertical line. Pločnik's 11.7% foil and the Uluburun cargo ratio are marked on the composition axis. Middle: hardness, annealed and after the chosen hammering. Right: the edges of a copper blade and of your alloy after the same work, with edge loss from Archard's law. Push the tin past about 15% with cold work and the blade chips.`,
      deps: ['tech-3.1', 'mat-6.1'],
      see: ['mat-6.4', 'mat-6.2', 'pchem-6.8'],
      refs: ['Mokyr ch. 2', 'Radivojević et al. 2013, Antiquity 87:1030', 'Pulak 2008, in Beyond Babylon (Metropolitan Museum)', 'NIST Cu–Sn calculated phase diagram (metallurgy.nist.gov)'],
      tags: ['ancient', 'c. 3300 BCE', 'alloys'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bronze' },
      viz(v) {
        const A = v.stage({ x: [0, 30], y: [450, 1120], axes: 'box', gutter: true, height: 290, weight: 1.15, minWidth: 330, xlabel: 'tin (wt %)', ylabel: '°C', title: 'Cu–Sn phase diagram (copper side)' });
        const B = v.stage({ x: [0, 30], y: [0, 340], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 290, xlabel: 'tin (wt %)', ylabel: 'hardness (HV)', title: 'hardness' });
        const Cs = v.stage({ x: [-2.2, 2.2], y: [-0.25, 3.2], equal: true, axes: false, height: 260, weight: 1, minWidth: 290, title: 'the last 4 mm of each edge, after the same work' });
        const D = yearStage(v, [-5400, -700], { height: 200, weight: 1.3, minWidth: 380, title: 'dated evidence: bronze' });
        const sn = v.slider('tin', 0, 25, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} wt %` });
        const cw = v.slider('cold work', 0, 80, 50, { step: 1, fmt: (x) => `${Math.round(x)}%` });
        const cuts = v.slider('cuts', 0, 3000, 1000, { step: 50, int: true });
        // liquidus through (0, 1085), (11, 1000: C90700 datasheet), (26.75, 796: NIST peritectic); α solidus through (0, 1085), (11, 831), (14.3, 796)
        const liq = (x) => 1085 - 5.579 * x - 0.1953 * x * x;
        const sol = (x) => 1085 - 32.7 * x + 0.873 * x * x;
        const solvus = [[14.3, 796], [15.44, 586], [14.85, 519], [13, 440], [11.6, 400]];
        const Ha = (x) => 45 + 5.5 * Math.min(x, 14.3) + (x > 14.3 ? 12 * (x - 14.3) : 0); // annealed (illustrative fit)
        const brittle = (x) => x > 15;
        const Hc = (x, r) => Ha(x) + (brittle(x) ? 0 : (75 + 8 * x) * Math.sqrt(r)); // after cold work r (illustrative)
        v.render(() => {
          const x = sn.value, r = cw.value / 100;
          // ---- A
          A.poly([[0, 1085], ...v.M.linspace(0, 14.3, 30).map((s) => [s, sol(s)]), ...solvus, [0, 400]], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          A.fn(liq, { domain: [0, 26.75], color: 'ink', width: 2.2 });
          A.fn(sol, { domain: [0, 14.3], color: 'ink', width: 1.6 });
          A.path(solvus.slice(0, 3), { color: 'ink', width: 1.6 });
          A.path(solvus.slice(2), { color: 'muted', width: 1.2, dash: [4, 3] });
          A.line(14.3, 796, 26.75, 796, { color: 'ink', width: 1.2 });
          A.line(15.44, 586, 26, 586, { color: 'ink', width: 1.2 });
          A.line(14.85, 519, 30, 519, { color: 'ink', width: 1.2 });
          A.text('liquid', 22, 1000, { size: 12, color: 'ink', align: 'center' });
          A.text('α', 5, 700, { size: 15, color: 'accent', align: 'center', weight: 700 });
          A.text('α + L', 13, 905, { size: 11, color: 'ink', align: 'center' });
          A.text('β', 21, 690, { size: 13, color: 'ink', align: 'center' });
          A.text('α + δ (brittle)', 22.5, 480, { size: 11, color: 'red', align: 'center' });
          A.text('796', 27, 796, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          for (const [px, lab] of [[11.7, 'Pločnik'], [100 / 11, 'Uluburun 10:1']]) { A.line(px, 450, px, 490, { color: 'purple', width: 2 }); if (lab === 'Pločnik') A.text(lab, px, 548, { size: 10.5, color: 'purple', align: 'center', baseline: 'bottom', plate: true }); else A.text(lab, px - 0.4, 500, { size: 10.5, color: 'purple', align: 'right', baseline: 'bottom', plate: true }); }
          A.vline(x, { color: 'orange', width: 2 });
          A.dot(x, liq(x), { r: 4.5, color: 'orange' });
          A.text(`liquidus ${Math.round(liq(x))} °C`, x + (x > 18 ? -0.5 : 0.5), liq(x) + 18, { size: 11, color: 'orange', align: x > 18 ? 'right' : 'left', weight: 700, plate: true });
          // ---- B
          B.fn(Ha, { color: 'accent', width: 2.2, n: 300 });
          B.fn((s) => Hc(s, r), { domain: [0, 15], color: 'green', width: 2.2, n: 300 });
          B.rect(15, 0, 30, 340, { fill: 'red', fillAlpha: 0.06, hatch: 'red', hatchAlpha: 0.25, stroke: false });
          B.text('cold hammering cracks it', 22.5, 320, { size: 11, color: 'red', align: 'center', plate: true });
          B.vline(x, { color: 'orange', width: 1.6 });
          B.dot(x, Ha(x), { r: 4, color: 'accent' });
          if (r > 0) B.dot(x, Hc(x, r), { r: 5, color: brittle(x) ? 'red' : 'green' });
          B.text('annealed', 1, Ha(1) + 14, { size: 11, color: 'accent', align: 'left' });
          B.text(`hammered ${Math.round(r * 100)}%`, 1, Hc(1, r) + 14, { size: 11, color: 'green', align: 'left' });
          // ---- C: two wedge edges, worn by Archard's law (edge loss ∝ cuts / hardness)
          const kW = 0.098, MM = 0.7; // edge loss (mm) = kW · cuts / HV (illustrative: about 1 mm per 1000 cuts for hammered copper); 0.7 data units per mm
          const blades = [[-1.05, 'copper', Hc(0, r), false], [1.05, `${v.fix(x, 1)}% tin`, Hc(x, r), brittle(x) && r > 0]];
          const half = Math.tan((22 / 2) * Math.PI / 180) * 2.8;
          for (const [cx, lab, H, chip] of blades) {
            const lossMM = (kW * cuts.value) / H, loss = Math.min(2.6, lossMM * MM), tipY = 0.1 + loss, w = half * loss / 2.8;
            const pts = [[cx - half, 2.9], [cx + half, 2.9]];
            if (chip) pts.push([cx + w + 0.06, tipY + 0.25], [cx + 0.1, tipY + 0.05], [cx + 0.02, tipY + 0.35], [cx - 0.12, tipY + 0.1], [cx - w - 0.06, tipY + 0.3]);
            else pts.push([cx + w, tipY], [cx - w, tipY]);
            C2(cx, half);
            Cs.poly(pts, { fill: chip ? 'red' : 'orange', fillAlpha: chip ? 0.35 : 0.45, color: chip ? 'red' : 'orange', width: 1.4 });
            Cs.text(lab, cx, 3.05, { size: 12, color: 'ink', align: 'center', weight: 700 });
            Cs.text(chip ? 'chipped' : lossMM * MM > 2.6 ? 'worn blunt' : `edge lost ${v.fix(lossMM, 2)} mm`, cx, -0.12, { size: 11, color: chip || lossMM * MM > 2.6 ? 'red' : 'ink', align: 'center' });
            Cs.text(`${Math.round(H)} HV`, cx, 1.6, { size: 11, color: 'ink', align: 'center', plate: true });
          }
          Cs.line(-0.35, 0.3, -0.35, 0.3 + MM, { color: 'ink', width: 2 }); Cs.text('1 mm', -0.28, 0.3 + MM / 2, { size: 10.5, color: 'ink', align: 'left', baseline: 'middle' });
          function C2(cx, h) { Cs.poly([[cx - h, 2.9], [cx + h, 2.9], [cx, 0.1]], { color: 'muted', width: 1, dash: [4, 3] }); }
          // ---- D
          drawYears(v, D, [
            { t: -4650, label: 'Pločnik foil, 11.7% Sn' },
            { t: [-3300, -3000], label: 'Bronze Age begins, Near East' },
            { t: [-2600, -2400], label: 'tin bronzes, royal tombs of Ur' },
            { t: [-1600, -1046], label: 'Shang ritual bronzes, China' },
            { t: [-1330, -1300], label: 'Uluburun: 10 t copper, 1 t tin', color: 'purple' },
            { t: -1200, label: 'iron begins to replace bronze', color: 'muted' },
          ], { lanes: 4, ticks: [-5000, -4000, -3000, -2000, -1000] });
        });
        v.legend([['accent', 'annealed hardness'], ['green', 'after hammering'], ['ink', 'phase boundaries'], ['orange', 'your alloy']]);
        v.readout(() => {
          const x = sn.value, r = cw.value / 100, H = Hc(x, r), H0 = Hc(0, r);
          return `${v.fix(x, 1)}% tin: liquidus **${Math.round(liq(x))} °C** (copper 1085 °C), pour at about ${Math.round(liq(x) + 100)} °C · hardness ${Math.round(Ha(x))} HV annealed, **${Math.round(H)} HV** after ${Math.round(r * 100)}% cold work (copper ${Math.round(H0)} HV) · Archard wear ∝ 1/H, so this edge wears **${v.fix(H0 / H, 2)}×** as fast as copper${brittle(x) && r > 0 ? ' · **brittle δ phase: the edge chips under the hammer**' : ''} · hardness curves are illustrative fits to typical archaeometallurgical ranges`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Invention',
      name: 'Iron and the bloomery',
      credit: 'Anatolia and the Levant, 2nd millennium BCE; common across the Near East from the 12th century BCE',
      statement: String.raw`A **bloomery** is a shaft furnace in which iron ore is reduced by charcoal **without the iron ever melting**. Iron melts at 1538 °C, beyond any ancient furnace. Instead the ore is reduced to solid metal at about 1100–1250 °C. The stony gangue (mostly silica) combines with part of the iron oxide to form a slag of fayalite, $\mathrm{2FeO\cdot SiO_2}$, which melts at about 1205 °C and can be tapped off. What remains is a **bloom**: a spongy mass of iron particles, slag and voids, which the smith reheats and hammers to squeeze the slag out and weld the iron into a bar of wrought iron.

Before smelting, iron came from meteorites: beads from Gerzeh, Egypt (about 3200 BCE) and Tutankhamun's dagger (buried about 1323 BCE) are rich in nickel (the dagger blade about 11%, Comelli et al. 2016), the signature of meteoritic iron. Smelted iron objects became more numerous after about 1500 BCE, and iron tools and weapons became common across the eastern Mediterranean from the 12th century BCE. Securely dated smelting sites are later still, such as Tell Hammeh in Jordan (about 930 BCE). Earlier claims from Anatolia, the Ganges plain and West Africa are contested.`,
      idea: String.raw`Iron oxide needs a strongly reducing gas, about three parts CO to one of $\mathrm{CO_2}$ (tech-3.1), so the ore must sit in a deep bed of glowing charcoal. It is reduced in the solid state, grain by grain, to porous iron. The silica cannot be removed as a solid, so the furnace sacrifices iron to flux it: each molecule of silica takes two of FeO into the slag, about **1.86 kg of iron per kg of silica**. A lean, siliceous ore can give nothing at all.

The furnace must also not get too hot. Hot iron in contact with charcoal absorbs carbon, and carbon lowers the melting point, to 1147 °C at 4.3% carbon (mat-6.6). A bloomery run too hot or too rich in charcoal gives liquid cast iron, too brittle for a smith to forge. Chinese furnaces made that their method from the 5th century BCE.`,
      caption: String.raw`Step through a smelt with the player: charge, reduce, melt the slag, tap it, pull out the bloom and hammer it (six welding passes). Set the **silica** in the ore and the **furnace temperature**. The mass balance (right) shows where 100 kg of ore goes: into the bloom, or into the slag as fayalite. Try 25% silica, then a cold furnace (the slag will not run and the bloom crumbles under the hammer), then a hot one (the iron takes up carbon, melts and runs out as cast iron).`,
      deps: ['tech-3.1', 'mat-6.6'],
      see: ['tech-3.4', 'tech-7.3', 'pchem-7.16'],
      refs: ['Mokyr ch. 2', 'Comelli et al. 2016, Meteorit. Planet. Sci. 51:1301', 'Veldhuijzen & Rehren 2007, in Metals and Mines (Archetype)', 'Wagner, Iron and Steel in Ancient China (1993)'],
      tags: ['ancient', 'c. 1200 BCE', 'metallurgy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bloomery' },
      viz(v) {
        const A = v.stage({ x: [-1.3, 1.3], y: [-1.2, 2.35], equal: true, axes: false, height: 330, weight: 0.8, minWidth: 210, title: 'the bloomery' });
        const B = v.stage({ x: [-1.6, 1.6], y: [-1.0, 1.0], equal: true, axes: false, height: 330, weight: 1.1, minWidth: 250, title: 'cross-section of the bloom' });
        const Cs = v.stage({ x: [0, 1], y: [-9, 100], axes: false, height: 330, weight: 0.85, minWidth: 210, title: 'where 100 kg of ore goes' });
        const D = yearStage(v, [-3400, -300], { height: 190, full: true, title: 'dated evidence: meteoritic iron, smelted iron, cast iron' });
        const silica = v.slider('silica in the ore', 3, 30, 12, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} wt %` });
        const Tf = v.slider('hottest zone of the furnace', 1000, 1450, 1220, { step: 5, fmt: (x) => `${Math.round(x)} °C` });
        const PASSES = 6;
        const frames = [
          { k: 0, note: 'Charge the preheated shaft with alternating layers of charcoal and roasted ore; bellows blow air in at the base.' },
          { k: 1, note: 'Upper shaft, 800–1000 °C: CO rising from the charcoal reduces the ore to porous iron grains, without melting.' },
          { k: 2, note: 'Hot zone near the tuyère: the silica and some FeO form fayalite slag, which melts if the furnace is hot enough; iron grains stick together.' },
          { k: 3, note: 'Tap the liquid slag out through the arch at the base.' },
          { k: 4, note: 'Break open the furnace and pull out the bloom: iron sponge full of slag and holes.' },
        ];
        for (let p = 1; p <= PASSES; p++) frames.push({ k: 4 + p, pass: p, note: `Hammering pass ${p}: reheat to a welding heat (~1250 °C, slag liquid) and hammer; slag squirts out, voids close, the bloom becomes a bar.` });
        const S = v.steps({ frames, start: 6, still: 7, speed: 0.8 });
        // model -----------------------------------------------------------
        const model = () => {
          const s = silica.value, fe2o3 = 100 - s, T = Tf.value;
          const feTot = 0.6994 * fe2o3, feSlag = Math.min(feTot, 1.859 * s), slagMass = feSlag / 0.5481 > 0 ? (feSlag * (71.85 / 55.85) + s) : 0;
          const carbon = clamp(0.05 + 2.0 * Math.exp((T - 1350) / 60), 0, 4.3); // illustrative carbon pick-up
          const liquidIron = T > 1538 - 91 * carbon; // Fe–C liquidus, 1538 °C at 0% C to 1147 °C at 4.3% C
          const slagRuns = T >= 1150;
          return { s, T, feTot, feSlag, feBloom: feTot - feSlag, slagMass, carbon, liquidIron, slagRuns, lean: feTot - feSlag < 2 };
        };
        const blobs = (() => { const r = v.rng(11), out = []; for (let i = 0; i < 70; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 0.86; out.push({ x: d * Math.cos(a), y: d * Math.sin(a) * 0.8, r: 0.035 + 0.05 * r(), pore: r() < 0.35, depth: 0.86 - d + 0.15 * r() }); } return out; })();
        v.render(() => {
          const f = S.frame, k = f.k ?? 0, m = model(), pass = f.pass ?? 0;
          // ---- A: shaft furnace
          const glowT = k >= 1 ? m.T : 600;
          A.poly([[-1.05, -0.95], [-0.62, 2.1], [0.62, 2.1], [1.05, -0.95]], { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 2 });
          A.poly([[-0.62, -0.75], [-0.33, 2.1], [0.33, 2.1], [0.62, -0.75]], { fill: 'orange', fillAlpha: k === 0 ? 0.04 : 0.1 + 0.3 * clamp((glowT - 900) / 500, 0, 1), color: 'faint', width: 1 });
          A.line(-1.3, -0.95, 1.3, -0.95, { color: 'muted', width: 1.5 });
          A.line(1.25, -0.25, 0.6, -0.45, { color: 'muted', width: 5 }); A.arrow(1.28, -0.2, 0.75, -0.38, { color: 'accent', width: 1.5, head: 7 }); A.text('bellows', 1.25, -0.08, { size: 10.5, color: 'accent', align: 'right' });
          if (k <= 3) { // layered charge
            const r2 = v.rng(3);
            for (let i = 0; i < 26; i++) { const y = -0.35 + i * 0.09, w = 0.62 - (0.29 * (y + 0.75)) / 2.85; const x = r2.uniform(-w + 0.08, w - 0.08), ore = i % 2 === 0; const reduced = k >= 1 && y < 1.6; A.poly(lump(x, y, 0.06, i + 1), { fill: ore ? (reduced ? 'ink' : 'red') : 'muted', fillAlpha: ore ? 0.6 : 0.7, color: ore ? 'red' : 'ink', width: 0.6 }); }
          }
          if (k >= 4) A.text('opened: bloom removed', 0, 0.6, { size: 10.5, color: 'muted', align: 'center', plate: true });
          if (k >= 1 && k <= 3) { A.text('reduction', -0.3, 1.25, { size: 10.5, color: 'ink', align: 'center', plate: true }); A.text('hot zone', 0, -0.25, { size: 10.5, color: 'red', align: 'center', plate: true }); }
          if (k >= 2 && k <= 3 && !m.liquidIron) A.poly(lump(0.05, -0.57, 0.22, 5, 12, 0.35), { fill: 'ink', fillAlpha: 0.75, color: 'ink', width: 1 });
          if (k >= 2 && m.slagRuns) { const out = k >= 3; A.rect(out ? 0.62 : -0.5, -0.95, out ? 1.25 : 0.5, -0.82, { fill: 'purple', fillAlpha: 0.5, stroke: false }); A.text('slag', out ? 0.95 : 0, -1.08, { size: 10.5, color: 'purple', align: 'center' }); }
          if (k >= 2 && m.liquidIron) { A.rect(-0.55, -0.95, 0.55, -0.8, { fill: 'red', fillAlpha: 0.75, stroke: false }); A.text('liquid cast iron', 0, -1.08, { size: 10.5, color: 'red', align: 'center', weight: 700 }); }
          A.text(`${Math.round(m.T)} °C`, 0, 2.22, { size: 11.5, color: 'red', align: 'center', weight: 700 });
          // ---- B: the bloom / bar
          if (k < 4) { B.text('the bloom forms inside the furnace', 0, 0, { size: 12, color: 'muted', align: 'center' }); }
          else if (m.liquidIron) { B.text('no bloom: the iron took up carbon and melted', 0, 0.1, { size: 12, color: 'red', align: 'center', weight: 700 }); B.text(`(${v.fix(m.carbon, 1)}% C cast iron, brittle when cold)`, 0, -0.12, { size: 11, color: 'red', align: 'center' }); }
          else if (m.lean) { B.text('no bloom: all the iron went into the slag', 0, 0, { size: 12, color: 'red', align: 'center', weight: 700 }); }
          else {
            // squash into a bar as passes proceed; remove slag/pores nearest the surface first
            const sx = 1 + 0.55 * pass / PASSES, sy = 1 - 0.5 * pass / PASSES, crumble = !m.slagRuns && pass > 0;
            const outline = []; for (let i = 0; i < 48; i++) { const a = (2 * Math.PI * i) / 48, rr = 0.92 * (1 + (pass ? 0 : 0.07 * Math.sin(5 * a) + 0.05 * Math.cos(9 * a))); outline.push([rr * Math.cos(a) * sx, rr * Math.sin(a) * 0.8 * sy]); }
            B.poly(outline, { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 1.5 });
            const keep = Math.pow(0.6, pass); // fraction of slag left after `pass` passes
            const sorted = blobs.slice().sort((a, b) => b.depth - a.depth), nKeep = Math.round(sorted.length * keep);
            sorted.slice(0, nKeep).forEach((b) => { const pts = lump(b.x * sx, b.y * sy, b.r * (b.pore ? 0.8 : 1), Math.round(b.x * 1e4 + b.y * 77)); B.poly(pts.map(([x, y]) => [x, b.y * sy + (y - b.y * sy) * (pass ? 0.6 : 1)]), b.pore ? { fill: 'panel', fillAlpha: 1, color: 'faint', width: 0.6 } : { fill: 'purple', fillAlpha: 0.6, color: 'purple', width: 0.6 }); });
            if (crumble) { for (let i = 0; i < 9; i++) { const a = i * 0.7, x = Math.cos(a) * sx, y = Math.sin(a) * 0.75 * sy; B.line(x * 0.6, y * 0.6, x * 1.02, y * 1.02, { color: 'red', width: 2 }); } }
            B.text(pass ? `after ${pass} pass${pass > 1 ? 'es' : ''}` : 'raw bloom', 0, -0.93, { size: 11.5, color: 'ink', align: 'center', weight: 700 });
            if (crumble) B.corner('slag never ran: the bloom crumbles', 'tl', { color: 'red', weight: 700 });
          }
          // ---- C: mass balance bars
          const bar = (x0, x1, segs) => { let y = 0; for (const [val, col, lab] of segs) { if (val <= 0.01) continue; Cs.rect(x0, y, x1, y + val, { fill: col, fillAlpha: 0.55, color: col, width: 1 }); if (val > 5) Cs.text(lab, (x0 + x1) / 2, y + val / 2, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); y += val; } };
          const oxyIn = 100 - m.s - m.feTot;
          bar(0.06, 0.42, [[m.feTot, 'muted', `iron ${v.fix(m.feTot, 0)} kg`], [oxyIn, 'faint', 'oxygen'], [m.s, 'gold', 'silica']]);
          const feB = m.liquidIron ? 0 : m.feBloom;
          bar(0.58, 0.94, [[feB, 'accent', `bloom ${v.fix(feB, 0)} kg`], [m.liquidIron ? m.feBloom : 0, 'red', 'cast iron'], [m.feSlag, 'purple', `Fe in slag ${v.fix(m.feSlag, 0)} kg`]]);
          Cs.text('ore', 0.24, -4.5, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          Cs.text('iron out', 0.76, -4.5, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          // ---- D
          drawYears(v, D, [
            { t: -3200, label: 'meteoritic beads, Gerzeh', color: 'purple' },
            { t: [-2100, -1950], label: 'Kaman-Kalehöyük blade', contested: true },
            { t: [-1800, -1200], label: 'iron, Ganges plain', contested: true },
            { t: -1500, label: 'smelted iron objects multiply' },
            { t: -1323, label: 'Tutankhamun’s meteoritic dagger', color: 'purple' },
            { t: [-1200, -1100], label: 'iron common in the Levant' },
            { t: [-940, -850], label: 'smelting at Tell Hammeh', color: 'green' },
            { t: -450, label: 'cast iron in China', color: 'red' },
          ], { lanes: 4, ticks: [-3000, -2500, -2000, -1500, -1000, -500] });
        });
        v.legend([['muted', 'iron'], ['purple', 'slag (fayalite)', { area: true }], ['accent', 'iron recovered', { area: true }], ['red', 'liquid cast iron', { area: true }]]);
        v.readout(() => {
          const m = model(), f = S.frame, pass = f.pass ?? 0;
          const slagVol = 0.4 * Math.pow(0.6, pass), pore = 0.2 * Math.pow(0.55, pass), rho = (1 - slagVol - pore) * 7.87 + slagVol * 4.39;
          const outcome = m.liquidIron ? `**too hot**: about ${v.fix(m.carbon, 1)}% carbon taken up, liquidus ${Math.round(1538 - 91 * m.carbon)} °C < ${Math.round(m.T)} °C, so the iron melted (cast iron)`
            : m.lean ? '**ore too lean**: the silica takes all the iron into the slag'
            : !m.slagRuns ? '**too cold**: fayalite slag stays solid, so it cannot be tapped or hammered out'
            : `bloom with about ${v.fix(m.carbon, 2)}% carbon (illustrative)${f.k >= 4 ? `; slag ${Math.round(100 * slagVol)}% and voids ${Math.round(100 * pore)}% by volume, density ${v.fix(rho, 2)} g/cm³ (wrought iron 7.87)` : ''}`;
          return `100 kg ore: ${v.fix(m.feTot, 1)} kg iron, of which ${v.fix(m.feSlag, 1)} kg is fluxed into ${v.fix(m.slagMass, 1)} kg of fayalite slag (2 FeO per SiO₂: 1.86 kg Fe per kg silica) → **${v.fix(Math.max(0, m.feBloom), 1)} kg** recoverable (${Math.round(100 * Math.max(0, m.feBloom) / m.feTot)}%) · ${outcome}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Invention',
      name: 'Steel: carburising and quenching',
      credit: 'Smiths of the eastern Mediterranean, by the 12th–11th century BCE (quenched and tempered steel pick, Mount Adir)',
      statement: String.raw`Wrought iron from a bloomery is nearly pure iron, softer than work-hardened bronze. It becomes **steel**, and a better material than bronze, when it contains a few tenths of a per cent to about one per cent of carbon and is **quenched**: heated red-hot (to about 800–900 °C) and plunged into water. Smiths added the carbon by **carburising**: holding the iron for hours in glowing charcoal, so carbon diffuses in from the surface and gives a hard steel skin over a tough iron core. A quenched blade is hard but brittle, so it was then **tempered** by reheating to a few hundred degrees.

A pick from the fortress of Mount Adir in Galilee (12th–11th century BCE) is carburised, quenched and tempered iron, hardness about 38 HRC (Davis et al. 1985). Homer's *Odyssey* (9.391–394) compares the hissing of the Cyclops' eye to a smith dipping an axe in cold water, "for that is the strength of iron".`,
      idea: String.raw`At red heat iron is **austenite**, face-centred cubic, which dissolves carbon. The iron–carbon diagram (mat-6.6) gives the limit: at the carburising temperature, charcoal saturates the surface at the Acm line, about 1.3% carbon at 900 °C. Carbon then diffuses inward, so the case depth grows as $\sqrt{Dt}$ with $D = 2.3\times10^{-5}\,e^{-148\,\mathrm{kJ/mol}/RT}\ \mathrm{m^2/s}$, about a millimetre in ten hours at 900 °C.

Cooled slowly, austenite with carbon decomposes into soft ferrite and **pearlite** (layers of ferrite and cementite) in proportions given by the lever rule. Cooled fast enough, the carbon has no time to leave and the lattice shears into **martensite**, body-centred and strained by trapped carbon, which is very hard. The transformation starts at $M_s \approx 539 - 423\,C$ (°C, $C$ in wt%, Andrews 1965, for steels up to about 0.6% carbon; it keeps falling, to about 100 °C at 1.4%) and the fraction transformed by room temperature follows the Koistinen–Marburger law $1 - e^{-0.011(M_s - T)}$. That is why a carburised blade was hardened from a lower heat, about 800 °C, where the austenite holds only about 1% carbon and the excess stays as hard cementite: quenched straight from the carburising heat, the carbon-rich skin keeps soft retained austenite. Without carbon there is nothing to trap: quenching wrought iron does almost nothing.`,
      caption: String.raw`Set the **carburising time and temperature**, the **quench** and the **tempering** temperature. Top left: the iron–carbon diagram, with the edge's and the core's carbon at the carburising temperature. Top right: the carbon profile across a 6 mm blade, computed from the diffusion equation. Bottom: hardness across the blade after it is reheated to 800 °C and quenched, with the phases in a strip along the top. Set the time to zero and quench in water (soft wrought iron), then carburise and quench without tempering: the edge is glass-hard and brittle.`,
      deps: ['tech-3.3', 'mat-6.6'],
      see: ['mat-6.7', 'mat-2.6'],
      refs: ['Mokyr ch. 2', 'Davis, Maddin, Muhly & Stech 1985, J. Near Eastern Studies 44:41', 'Andrews 1965, J. Iron Steel Inst. 203:721', 'Koistinen & Marburger 1959, Acta Metall. 7:59', 'Callister, Materials Science and Engineering, Table 5.2 and §9.18'],
      tags: ['ancient', 'steel', 'heat treatment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carburizing' },
      viz(v) {
        const A = v.stage({ x: [0, 2.2], y: [500, 1600], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 320, xlabel: 'carbon (wt %)', ylabel: '°C', title: 'iron–carbon diagram (steel side)' });
        const B = v.stage({ x: [0, 6], y: [0, 1.6], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 320, xlabel: 'position across the blade (mm)', ylabel: 'carbon (wt %)', title: 'carbon after carburising' });
        const Cs = v.stage({ x: [0, 6], y: [0, 1000], axes: 'box', gutter: true, height: 270, weight: 1.2, minWidth: 380, xlabel: 'position across the blade (mm)', ylabel: 'hardness (HV)', title: 'hardness after hardening from 800 °C (phase strip on top)' });
        const D = yearStage(v, [-1400, 500], { height: 270, weight: 0.9, minWidth: 300, title: 'dated evidence: steel' });
        const hours = v.slider('carburising time', 0, 24, 10, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} h` });
        const Tc = v.slider('carburising temperature', 850, 1000, 900, { step: 5, fmt: (x) => `${Math.round(x)} °C` });
        const quench = v.select('cooling', [{ value: 1, label: 'slow (in the hearth)' }, { value: 5, label: 'air' }, { value: 60, label: 'oil' }, { value: 300, label: 'water' }, { value: 800, label: 'brine' }], 300);
        const temper = v.slider('tempering (1 h)', 0, 650, 0, { step: 10, fmt: (x) => (x < 100 ? 'none' : `${Math.round(x)} °C`) });
        const C0 = 0.05, L = 6; // bloomery iron, blade thickness mm
        const erfc = (x) => v.M.erfc(x);
        const acm = (T) => 0.76 + (T - 727) * (1.38 / 420); // Acm: (0.76%, 727 °C) → (2.14%, 1147 °C)
        const profile = (x) => {
          const t = hours.value * 3600; if (t <= 0) return C0;
          const T = Tc.value + K0, Dm = 2.3e-5 * Math.exp(-148000 / (8.314 * T)), Cs0 = Math.min(acm(Tc.value), 1.6), l = 2 * Math.sqrt(Dm * t) * 1000; // mm
          return Math.min(Cs0, C0 + (Cs0 - C0) * (erfc(x / l) + erfc((L - x) / l)));
        };
        /** Phases and hardness of steel with carbon c after cooling at `rate` °C/s and tempering (illustrative where noted). */
        const TH = 800; // hardening: the carburised blade is reheated to about 800 °C and quenched from there
        const msOf = (c) => (c <= 0.6 ? 539 - 423 * c : 285 - 231 * (c - 0.6)); // Andrews (1965) to 0.6% C; linear to ~100 °C at 1.4% C beyond
        const treat = (c, rate, Tt) => {
          const cg = Math.min(c, acm(TH)), cem = c > cg ? (c - cg) / (6.67 - cg) : 0; // austenite carbon at TH; excess carbon stays as cementite
          const logCR = 2.9 - 1.4 * Math.min(cg, 0.8); // critical cooling rate (°C/s), illustrative for plain carbon steel
          const escape = rate <= 1 ? 0 : (1 - cem) / (1 + Math.exp(-5 * (Math.log10(rate) - logCR)));
          const Ms = msOf(cg), fM = Ms > 20 ? escape * (1 - Math.exp(-0.011 * (Ms - 20))) : 0, fA = escape - fM, fP = 1 - escape - (rate > 1 ? cem : 0);
          const HM = 150 + 790 * (1 - Math.exp(-2.7 * cg));
          const HP = c < 0.76 ? 90 + (c / 0.76) * (rate > 3 ? 190 : 120) : (rate > 3 ? 280 : 210) + ((c - 0.76) / 5.91) * 600; // ferrite + pearlite by the lever rule
          const tf = Tt < 100 ? 0 : clamp((Tt - 150) / 500, 0, 1) ** 0.8, HMt = HM - (HM - Math.max(200, 0.5 * HP + 120)) * tf;
          const cemQ = rate > 1 ? cem : 0;
          return { fM, fA, fP, fC: cemQ, H: fM * HMt + fA * 250 + fP * HP + cemQ * 800, Ms, HM: HMt };
        };
        v.render(() => {
          const T = Tc.value, rate = +quench.value, Tt = temper.value;
          // ---- A
          A.poly([[0, 912], [0.76, 727], [2.14, 1147], [2.14, 1495], [0.17, 1495], [0, 1394]], { fill: 'orange', fillAlpha: 0.1, stroke: false });
          A.path([[0, 912], [0.76, 727], [2.14, 1147]], { color: 'ink', width: 2 });
          A.line(0.022, 727, 2.2, 727, { color: 'ink', width: 1.2 });
          A.line(2.14, 1147, 2.2, 1147, { color: 'ink', width: 1.2 });
          A.path([[0, 1538], [0.53, 1495], [2.14, 1380]], { color: 'muted', width: 1.4 });
          A.text('austenite γ', 1.0, 1150, { size: 12, color: 'orange', align: 'center', weight: 700 });
          A.text('ferrite + pearlite', 0.35, 600, { size: 10.5, color: 'accent', align: 'center' });
          A.text('pearlite + cementite', 1.5, 600, { size: 10.5, color: 'accent', align: 'center' });
          A.text('liquid', 1.6, 1520, { size: 10.5, color: 'muted', align: 'center' });
          A.text('Acm', 1.75, 1010, { size: 10.5, color: 'ink', align: 'left' });
          A.text('727', 2.18, 735, { size: 10, color: 'muted', align: 'right', baseline: 'bottom' });
          A.hline(T, { color: 'red', width: 1.4, dash: [5, 3] });
          const cE = profile(0), cC = profile(L / 2);
          A.dot(cE, T, { r: 5, color: 'red', label: 'edge', labelPos: 'n' });
          A.dot(cC, T, { r: 5, color: 'accent', label: 'core', labelPos: 'se' });
          // ---- B
          B.fn(profile, { color: 'red', width: 2.4, n: 240, fill: 'red', fillAlpha: 0.12 });
          B.hline(0.76, { color: 'muted', width: 1, dash: [4, 3] }); B.text('eutectoid 0.76%', 3, 0.8, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
          // ---- C: phases (stacked, scaled to the 0–1000 axis) and hardness
          const N = 120, xs = v.M.linspace(0, L, N), res = xs.map((x) => treat(profile(x), rate, Tt));
          // phase strip along the top (each column stacked by phase fraction)
          const y0 = 905, hS = 90, band = (lo, hi, col) => Cs.poly([...xs.map((x, i) => [x, y0 + hS * lo(res[i])]), ...xs.map((x, i) => [x, y0 + hS * hi(res[i])]).reverse()], { fill: col, fillAlpha: 0.55, stroke: false });
          band(() => 0, (r) => r.fM, 'red'); band((r) => r.fM, (r) => r.fM + r.fA, 'gold'); band((r) => r.fM + r.fA, (r) => r.fM + r.fA + r.fC, 'purple'); band((r) => r.fM + r.fA + r.fC, () => 1, 'accent');
          Cs.hline(y0, { color: 'faint', width: 1 });
          Cs.path(xs.map((x, i) => [x, res[i].H]), { color: 'ink', width: 2.6 });
          const e = res[0], brittle = e.fM > 0.5 && e.H > 650 && Tt < 150;
          Cs.text(`edge ${Math.round(e.H)} HV`, 0.15, Math.min(850, e.H + 40), { size: 11.5, color: brittle ? 'red' : 'ink', align: 'left', weight: 700, plate: true });
          Cs.text(`core ${Math.round(res[N >> 1].H)} HV`, 3, Math.min(850, res[N >> 1].H + 40), { size: 11.5, color: 'ink', align: 'center', weight: 700, plate: true });
          if (brittle) Cs.text('untempered martensite: hard but brittle', 3, 860, { size: 11.5, color: 'red', align: 'center', weight: 700, plate: true });
          // ---- D
          drawYears(v, D, [
            { t: [-1200, -1000], label: 'Mount Adir pick, quenched' },
            { t: -900, label: 'carbon-steel tools, Iberia' },
            { t: -800, label: 'steel swords, central Europe' },
            { t: [-750, -650], label: 'Odyssey: quenching simile', color: 'purple' },
            { t: -300, label: 'wootz steel, India', contested: true },
            { t: 200, label: 'crucible steel, India', color: 'green' },
          ], { lanes: 6, laneH: 0.13, ticks: [-1200, -800, -400, 1, 400] });
        });
        v.legend([['red', 'martensite', { area: true }], ['gold', 'retained austenite', { area: true }], ['purple', 'cementite', { area: true }], ['accent', 'ferrite + pearlite', { area: true }], ['ink', 'hardness']]);
        v.readout(() => {
          const rate = +quench.value, cE = profile(0), e = treat(cE, rate, temper.value), core = treat(profile(L / 2), rate, temper.value);
          const T = Tc.value + K0, Dm = 2.3e-5 * Math.exp(-148000 / (8.314 * T)), depth = Math.sqrt(Dm * hours.value * 3600) * 1000;
          return `surface carbon ${v.fix(cE, 2)}% (Acm limit at ${Math.round(Tc.value)} °C: ${v.fix(Math.min(acm(Tc.value), 1.6), 2)}%), $\\sqrt{Dt}$ = ${v.fix(depth, 2)} mm with $D = ${v.sci(Dm, 2)}$ m²/s · hardened from ${TH} °C: edge austenite ${v.fix(Math.min(cE, acm(TH)), 2)}% C, $M_s$ = ${Math.round(e.Ms)} °C, **${Math.round(100 * e.fM)}% martensite**${e.fA > 0.05 ? `, ${Math.round(100 * e.fA)}% retained austenite` : ''} → **${Math.round(e.H)} HV** at the edge, ${Math.round(core.H)} HV in the core · cooling rates and pearlite hardness are illustrative; Ms (Andrews, extended above 0.6% C), Koistinen–Marburger and martensite hardness are empirical laws`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Invention',
      name: 'Glass',
      credit: 'Mesopotamia, mid-3rd millennium BCE (beads); glassblowing in the Levant, 1st century BCE',
      statement: String.raw`**Glass** is a melt that has cooled too stiff to crystallise: an amorphous solid. Ancient glass, like most glass today, is **soda-lime-silica** glass. Silica sand melts at about 1700 °C, far beyond any ancient furnace, but soda ($\mathrm{Na_2O}$, from natron or plant ash) acts as a flux that brings the melting and working temperatures down to about 1000–1100 °C. Lime ($\mathrm{CaO}$, often from shell in the sand) makes the result insoluble; a glass of soda and silica alone dissolves in water.

The earliest glass objects are beads from Mesopotamia of the mid-3rd millennium BCE. Glass vessels, formed around a removable core, appear in Mesopotamia and Egypt in the 16th–15th centuries BCE, and the Uluburun ship (about 1300 BCE) carried raw glass ingots. **Glassblowing**, inflating a gather of hot glass on a tube, was invented in the Levant: the earliest evidence is workshop waste of the mid-1st century BCE from the Jewish Quarter of Jerusalem. It made glass vessels cheap across the Roman world.`,
      idea: String.raw`In silica every silicon sits in a tetrahedron of four oxygens, each oxygen bridging two tetrahedra into a continuous random network (Zachariasen's model, mat-8.9). Each $\mathrm{Na_2O}$ or $\mathrm{CaO}$ added breaks one bridge into two non-bridging oxygens, with the cations sitting in the holes. A broken network flows more easily, so viscosity falls and the whole viscosity curve shifts hundreds of degrees cooler.

Glassworking happens in a viscosity window. A glass can be gathered and blown between the working point ($10^3$ Pa·s) and the softening point ($10^{6.6}$ Pa·s), and is annealed to relieve stress near $10^{12}$ Pa·s. The temperature dependence follows the Vogel–Fulcher–Tammann law $\log_{10}\eta = A + B/(T - T_0)$, whose constants for soda-lime glasses Lakatos and colleagues (1972) fitted as linear functions of composition. The width of the window in degrees, together with how fast a gather cools, sets how many seconds a glassblower has before the glass must go back into the furnace.`,
      caption: String.raw`Set the **soda** and **lime** contents, or pick a recipe, and drag the red **furnace temperature** line. Left: viscosity curves (Lakatos model for your glass, dashed where the model is extrapolated, and fused silica for comparison) with the working window shaded. Middle: a 4 cm gather of glass taken from the furnace cools by radiation; the shaded strip is the time it stays workable. Right: a 2D sketch of the network, with the computed share of bridges broken by the flux. Turn the soda down and the window moves out of reach; remove the lime and the glass dissolves.`,
      deps: ['tech-1.7', 'mat-8.9'],
      see: ['mat-8.4', 'tech-6.1', 'tech-6.11'],
      refs: ['Mokyr ch. 2', 'Lakatos, Johansson & Simmingsköld 1972, Glass Technology 13:88', 'Corning HPFS 7980 fused silica data sheet', 'Israeli 1991, in Annales AIHV 11 (Jerusalem glassblowing waste)', 'Getty Museum, Ancient Glass (2016)'],
      tags: ['ancient', 'c. 2500 BCE', 'glass'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Glass_production' },
      viz(v) {
        const A = v.stage({ x: [500, 1800], y: [0, 15], axes: 'box', gutter: true, height: 290, weight: 1.25, minWidth: 360, xlabel: 'temperature (°C)', ylabel: 'log₁₀ viscosity (Pa·s)', title: 'viscosity of the melt' });
        const B = v.stage({ x: [0, 150], y: [500, 1350], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 300, xlabel: 'seconds out of the furnace', ylabel: '°C', title: 'a gather cooling in air' });
        const Cn = v.stage({ x: [0, 1], y: [-0.06, 1], equal: true, axes: false, height: 260, weight: 1, minWidth: 260, title: 'the network (2D sketch)' });
        const D = yearStage(v, [-2700, 200], { height: 260, weight: 1.3, minWidth: 360, title: 'dated evidence: glass' });
        const PRE = {
          modern: { label: 'modern soda-lime', na: 11.7, ca: 10.9, al: 0.12, mg: 0, k: 0.08 },
          roman: { label: 'Roman natron glass (typical)', na: 18, ca: 8.9, al: 1.5, mg: 0.9, k: 0.4 },
          nolime: { label: 'no lime', na: 18, ca: 0, al: 0, mg: 0, k: 0 },
        };
        let extra = { al: 1.5, mg: 0.9, k: 0.4 };
        const na = v.slider('soda Na₂O', 6, 20, 18, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mol %` });
        const ca = v.slider('lime CaO', 0, 12, 8.9, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mol %` });
        v.select('recipe', Object.entries(PRE).map(([k, p]) => ({ value: k, label: p.label })), 'roman', { onChange: (k) => { const p = PRE[k]; extra = { al: p.al, mg: p.mg, k: p.k }; na.set(p.na); ca.set(p.ca); } });
        const furn = A.handle(1100, 13.2, { color: 'red', label: 'furnace', labelPos: 'e', constrain: (x) => [clamp(x, 700, 1750), 13.2] });
        const comp = () => {
          const si = 100 - na.value - ca.value - extra.al - extra.mg - extra.k, n = na.value / si, c = ca.value / si, a = extra.al / si, m = extra.mg / si, kk = extra.k / si;
          const Aa = 1.4788 * n - 0.835 * kk - 1.603 * c - 5.4936 * m + 1.5183 * a - 2.455;
          const Bb = -6039.7 * n - 1439.6 * kk - 3919.3 * c + 6285.3 * m + 2253.4 * a + 5736.4;
          const T0 = -25.07 * n - 321.0 * kk + 544.3 * c - 384.0 * m + 294.4 * a + 198.1;
          const inRange = na.value >= 10.3 && na.value <= 15.1 && ca.value <= 10.2;
          return { si, A: Aa, B: Bb, T0, inRange, mod: (na.value + ca.value + extra.mg + extra.k) / si };
        };
        const logEta = (g, T) => (T > g.T0 + 5 ? g.A + g.B / (T - g.T0) : 30);
        const Tat = (g, le) => g.T0 + g.B / (le - g.A);
        const silica = (T) => -6.48 + 24300 / (T + K0); // Arrhenius through annealing 1042 °C (10^12) and softening 1585 °C (10^6.6), Corning 7980
        const cool = (T0c) => { // lumped radiative + convective cooling of a 4 cm gather (R = 2 cm)
          const out = [[0, T0c]]; let T = T0c + K0; const k = 3 / (2500 * 1200 * 0.02);
          for (let t = 0; t < 150; t += 0.5) { T -= 0.5 * k * (0.9 * 5.67e-8 * (T ** 4 - 293 ** 4) + 15 * (T - 293)); out.push([t + 0.5, T - K0]); }
          return out;
        };
        // network sketch: perturbed triangular lattice of Si, bridges to neighbours
        const net = (() => { // jittered honeycomb: every 'Si' has three bridges, as in Zachariasen's 2D drawing
          const r = v.rng(5), si = [], br = [];
          const NX = 7, NY = 8;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const x = 0.11 + i * 0.13, y = 0.06 + j * 0.115 + (((i + j) % 2) ? 0.04 : 0); si.push([x + r.uniform(-0.018, 0.018), y + r.uniform(-0.014, 0.014)]); }
          const id = (i, j) => j * NX + i;
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { if (i < NX - 1) br.push([id(i, j), id(i + 1, j), r()]); if (j < NY - 1 && (i + j) % 2 === 0) br.push([id(i, j), id(i, j + 1), r()]); }
          return { si, br };
        })();
        v.render(() => {
          const g = comp(), Tf = furn.x;
          // ---- A
          A.hband(3, 6.6, { color: 'green', alpha: 0.1 });
          A.text('working window', 1400, 4.8, { size: 11, color: 'green', align: 'center', baseline: 'middle', plate: true });
          A.hline(12, { color: 'muted', width: 1, dash: [4, 3] }); A.text('annealing point 10¹²', 1790, 12.25, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          A.fn(silica, { color: 'muted', width: 2, domain: [900, 1800] });
          A.text('fused silica', 1700, silica(1700) + 0.5, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          A.fn((T) => logEta(g, T), { color: 'accent', width: 2.6, dash: g.inRange ? null : [6, 4], domain: [g.T0 + 40, 1800] });
          A.vline(Tf, { color: 'red', width: 1.6 });
          const le = logEta(g, Tf), ls = silica(Tf);
          if (le < 15) A.dot(Tf, le, { r: 5, color: 'accent' });
          if (ls < 15 && Tf >= 900) A.dot(Tf, ls, { r: 4, color: 'muted' });
          // ---- B: gather cooling from the furnace temperature
          const tw = Tat(g, 3), ts = Tat(g, 6.6), run = cool(Tf);
          B.hband(ts, tw, { color: 'green', alpha: 0.06 });
          B.text('workable', 148, Math.min(1330, (ts + tw) / 2), { size: 11, color: 'green', align: 'right', baseline: 'middle' });
          B.path(run, { color: 'red', width: 2.4 });
          const tIn = run.find((p) => p[1] <= tw), tOut = run.find((p) => p[1] <= ts);
          const t1 = tIn ? tIn[0] : 0, t2 = tOut ? tOut[0] : 150;
          if (Tf > ts) { B.vband(Tf > tw ? t1 : 0, t2, { color: 'green', alpha: 0.12 }); B.text(`${Math.round(t2 - (Tf > tw ? t1 : 0))} s to work it`, (t1 + t2) / 2, 520, { size: 11.5, color: 'green', align: 'center', baseline: 'bottom', weight: 700, plate: true }); }
          else B.corner('below the softening point: too stiff to work', 'tr', { color: 'red', weight: 700 });
          // ---- C: network
          const fBroken = clamp(g.mod / 2, 0, 0.9);
          const order = net.br.slice().sort((a, b) => a[2] - b[2]), nB = Math.round(order.length * fBroken), broken = new Set(order.slice(0, nB));
          for (const e of net.br) {
            const p = net.si[e[0]], q = net.si[e[1]], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
            if (!broken.has(e)) { Cn.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1.4 }); Cn.dot(mx, my, { r: 2.6, color: 'red' }); }
            else { const ux = (q[0] - p[0]) * 0.28, uy = (q[1] - p[1]) * 0.28; Cn.line(p[0], p[1], p[0] + ux, p[1] + uy, { color: 'muted', width: 1.4 }); Cn.line(q[0], q[1], q[0] - ux, q[1] - uy, { color: 'muted', width: 1.4 }); Cn.dot(p[0] + ux, p[1] + uy, { r: 2.6, color: 'red', hollow: true }); Cn.dot(q[0] - ux, q[1] - uy, { r: 2.6, color: 'red', hollow: true }); Cn.dot(mx + uy * 0.4, my - ux * 0.4, { r: 3.4, color: 'gold' }); }
          }
          for (const p of net.si) Cn.dot(p[0], p[1], { r: 3.4, color: 'accent' });
          const durable = ca.value >= 4 || na.value < 12;
          Cn.corner(`${Math.round(100 * fBroken)}% of bridges broken`, 'bl', { color: 'ink', weight: 700, plate: true });
          if (!durable) Cn.corner('no lime: soluble in water', 'tl', { color: 'red', weight: 700, plate: true });
          // ---- D
          drawYears(v, D, [
            { t: [-2500, -2300], label: 'glass beads, Mesopotamia' },
            { t: [-1550, -1400], label: 'core-formed vessels' },
            { t: [-1330, -1300], label: 'glass ingots, Uluburun' },
            { t: [-50, -40], label: 'glassblowing, Jerusalem', color: 'green' },
            { t: 77, label: 'Pliny’s natron legend', color: 'purple' },
          ], { lanes: 3, ticks: [-2500, -2000, -1500, -1000, -500, 1] });
        });
        v.legend([['accent', 'your glass (Lakatos VFT)'], ['muted', 'fused silica'], ['red', 'furnace temperature / gather'], ['gold', 'Na⁺ / Ca²⁺ in a broken bridge', { dot: true }]]);
        v.readout(() => {
          const g = comp(), Tf = furn.x, le = logEta(g, Tf);
          return `${v.fix(na.value, 1)}% Na₂O, ${v.fix(ca.value, 1)}% CaO, ${v.fix(g.si, 1)}% SiO₂ (mol): VFT A = ${v.fix(g.A, 2)}, B = ${Math.round(g.B)}, T₀ = ${Math.round(g.T0)} °C · working point (10³ Pa·s) **${Math.round(Tat(g, 3))} °C**, softening ${Math.round(Tat(g, 6.6))} °C, annealing ${Math.round(Tat(g, 12))} °C (fused silica: working point ≈ ${Math.round(24300 / (3 + 6.48) - K0)} °C) · at ${Math.round(Tf)} °C the melt has $\\eta = 10^{${v.fix(Math.min(le, 15), 1)}}$ Pa·s${le < 3 ? ', runny: let it cool before gathering' : le <= 6.6 ? ', **workable**' : ', too stiff'}${g.inRange ? '' : ' · composition outside the model’s calibration (Na₂O 10.3–15.1%, CaO ≤ 10.2%): extrapolated'}`;
        });
      },
    },
  ],
};
