// History of Technology — Chapter 3: Materials, writing and number (items 3.6–3.10; 3.1–3.5 are in ch03.js)
import { yearStage, drawYears } from './ch03.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- proto-cuneiform numerals (shapes after Englund; values: mesomath / Unicode L2/19-284)
const SYS_S = [[3600, 'LC'], [600, 'BCC'], [60, 'BC'], [10, 'SC'], [1, 'N1']]; // sexagesimal system S: discrete objects (sheep, people, jars)
const SYS_SE = [[6, 'SC'], [1, 'N1']]; // ŠE system (barley capacity): the same small circle is worth 6, not 10
function decompose(n, sys) { const out = []; for (const [val, sign] of sys) { const k = Math.floor(n / val); n -= k * val; out.push([sign, k, val]); } return out; }
/** Draw one impressed numeral sign centred at (x, y) on stage s; u = size unit. */
function numSign(s, sign, x, y, u) {
  const st = { fill: 'ink', fillAlpha: 0.32, color: 'ink', width: 1.2 };
  const notch = (w, h) => s.poly([[x - w / 2, y + h / 2], [x + w / 2, y + h / 2], [x + w * 0.18, y - h / 2], [x - w * 0.18, y - h / 2]], st);
  if (sign === 'N1') notch(0.2 * u, 0.5 * u);
  else if (sign === 'SC') s.circle(x, y, 0.17 * u, st);
  else if (sign === 'BC' || sign === 'BCC') { notch(0.36 * u, 0.85 * u); if (sign === 'BCC') s.circle(x, y + 0.12 * u, 0.1 * u, { fill: 'panel', fillAlpha: 0.9, color: 'ink', width: 1.1 }); }
  else if (sign === 'LC') s.circle(x, y, 0.36 * u, st);
}
const signW = { N1: 0.32, SC: 0.42, BC: 0.48, BCC: 0.48, LC: 0.82 };

// ---------------------------------------------------------------- abacus helpers
function digitsOf(n, base, len) { const d = []; for (let i = 0; i < len; i++) { d.push(n % base); n = Math.floor(n / base); } return d; }
const beadsOf = (v) => { const u = v >= 10 ? 2 : v >= 5 ? 1 : 0; return [u, v - 5 * u]; };
function beadMoves(a, b) { let m = 0; for (let i = 0; i < a.length; i++) { const [u1, l1] = beadsOf(a[i]), [u2, l2] = beadsOf(b[i]); m += Math.abs(u1 - u2) + Math.abs(l1 - l2); } return m; }

// ---------------------------------------------------------------- Roman numerals (additive form, as used in reckoning)
const RVAL = [[1000, 'M'], [500, 'D'], [100, 'C'], [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I']];
function romanAdd(n) { let s = ''; for (const [v, c] of RVAL) { while (n >= v) { s += c; n -= v; } } return s; }
const RV = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
/** Count the symbol operations of Roman multiplication: every symbol of a times every symbol of b (a lookup), write each product additively, then regroup the pile (IIIII → V, VV → X, …). */
function romanCost(a, b) {
  const sa = romanAdd(a), sb = romanAdd(b); let written = 0; const pile = { M: 0, D: 0, C: 0, L: 0, X: 0, V: 0, I: 0 };
  for (const x of sa) for (const y of sb) { const p = romanAdd(RV[x] * RV[y]); written += p.length; for (const c of p) pile[c]++; }
  let ex = 0; const up = [['I', 5, 'V'], ['V', 2, 'X'], ['X', 5, 'L'], ['L', 2, 'C'], ['C', 5, 'D'], ['D', 2, 'M']];
  for (const [c, k, nx] of up) { const q = Math.floor(pile[c] / k); ex += q; pile[c] -= q * k; pile[nx] += q; }
  return { sa, sb, products: sa.length * sb.length, written, exchanges: ex, total: sa.length * sb.length + written + ex };
}
/** Long multiplication in base 10: digit products, digits written in the partial products, column additions. */
function decimalCost(a, b) {
  const da = String(a).split('').reverse().map(Number), db = String(b).split('').reverse().map(Number), rows = [];
  let written = 0;
  for (let j = 0; j < db.length; j++) { const p = a * db[j]; rows.push(p * 10 ** j); written += String(p).length; }
  const cols = String(a * b).length;
  return { products: da.length * db.length, written, adds: db.length > 1 ? cols : 0, total: da.length * db.length + written + (db.length > 1 ? cols : 0), rows };
}

// ---------------------------------------------------------------- base 60
function toSexa(x, places) { const ip = Math.floor(x); let f = x - ip; const d = []; for (let i = 0; i < places; i++) { f *= 60; const k = Math.floor(f + 1e-12); d.push(k); f -= k; } return { ip, d }; }
function roundSexa(x, places) { const s = 60 ** places, r = Math.round(x * s) / s; return { val: r, ...toSexa(r + 1e-13, places) }; }
/** Cuneiform digit 1–59 at (x, y): Winkelhaken (tens) then vertical wedges (units). Returns the width used. */
function cuneiDigit(s, n, x, y, u, col = 'ink') {
  const tens = Math.floor(n / 10), ones = n % 10; let cx = x;
  const st = { fill: col, fillAlpha: 0.55, color: col, width: 1 };
  for (let i = 0; i < tens; i++) { s.poly([[cx + 0.3 * u, y + 0.22 * u], [cx, y], [cx + 0.3 * u, y - 0.22 * u], [cx + 0.18 * u, y]], st); cx += 0.27 * u; }
  if (tens && ones) cx += 0.08 * u;
  const rows = ones > 3 ? [Math.ceil(ones / 2), Math.floor(ones / 2)] : [ones];
  const cols = rows[0];
  rows.forEach((k, r) => { for (let i = 0; i < k; i++) { const wx = cx + i * 0.2 * u, wy = rows.length > 1 ? y + (r === 0 ? 0.2 : -0.2) * u : y; s.poly([[wx - 0.09 * u, wy + 0.2 * u], [wx + 0.09 * u, wy + 0.2 * u], [wx, wy + 0.07 * u], [wx, wy - (rows.length > 1 ? 0.14 : 0.3) * u]], st); s.line(wx, wy + 0.07 * u, wx, wy - (rows.length > 1 ? 0.18 : 0.34) * u, { color: col, width: 1.3 }); } });
  cx += cols * 0.2 * u;
  return cx - x;
}

export default {
  collection: 'tech',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Invention',
      name: 'Writing (Mesopotamia and Egypt)',
      credit: 'Scribes of Uruk, southern Mesopotamia, c. 3350–3200 BCE; Egypt (Abydos), c. 3300–3150 BCE',
      statement: String.raw`**Writing** is a system of visible marks that records language, or at least the categories of an administration, so that a reader who was not present can recover it. It was invented at least twice in the Old World at about the same time. In southern Mesopotamia the **proto-cuneiform** tablets of Uruk (Uruk IV phase, about 3350–3200 BCE) are almost all accounts: numerals impressed into clay with the round end of a stylus, next to incised pictographic signs for the goods and the officials. In Egypt, bone and ivory labels from tomb U-j at Abydos (about 3300–3150 BCE) carry signs already used for their sounds. Whether the Egyptian script was invented independently is still debated.

Proto-cuneiform used different numerical systems for different things: about a dozen of them, sexagesimal for discrete objects, others for capacities of grain, areas and time. The same impressed sign could have different values: the small circle was worth ten small "cones" when counting sheep, but six when measuring barley. In the Jemdet Nasr period (about 3100–2900 BCE) signs began to be used for their **sounds** (the rebus principle): the sign for "arrow", Sumerian *ti*, was also used to write *ti*, "life". That step let writing record names, grammar and finally whole languages.`,
      idea: String.raw`Schmandt-Besserat's hypothesis (ling-7.2) traces the numerals to clay counting tokens used across the Near East from about 8000 BCE, which were sealed into clay envelopes whose surfaces were impressed with the tokens inside, until the envelope itself became a tablet. The details are disputed, but the economics are clear: one token per unit grows linearly with the amount, whereas grouped numerals grow only with the number of digits. A receipt for 3,600 sheep needs one sign instead of 3,600 tokens.

The second step is separating number from thing. A token for "a jar of oil" counts and names at once; a numeral sign and a commodity sign can be combined freely. The third step, using signs for sounds (ling-7.3), is what made writing a record of speech rather than a bookkeeping code (ling-7.1).`,
      caption: String.raw`Choose a **commodity** and an **amount** and switch between **tokens** (one per unit, sealed in an envelope), the **tablet** that replaced them, and the **rebus** step. The tablet groups the amount into the signs of the right numerical system: compare sheep (sexagesimal, small circle = 10) with barley (small circle = 6). The chart counts the marks needed for every amount: tokens grow in proportion, numerals only with the digits.`,
      deps: ['ling-7.2', 'ling-7.3', 'tech-1.7'],
      see: ['ling-7.1', 'ling-7.4', 'tech-3.9'],
      refs: ['Mokyr ch. 2', 'Englund, Texts from the Late Uruk Period (1998)', 'Damerow & Englund 1987, in ATU 2', 'Schmandt-Besserat, Before Writing (1992)', 'Dreyer et al. 1998, Umm el-Qaab I', 'Unicode proposal L2/19-284 (proto-cuneiform)'],
      tags: ['ancient', 'c. 3200 BCE', 'writing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Proto-cuneiform' },
      viz(v) {
        const A = v.stage({ x: [0, 10], y: [0, 6.2], equal: true, axes: false, height: 300, weight: 1.25, minWidth: 360, title: 'the record' });
        const B = v.stage({ x: [1, 5000], y: [1, 5000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 300, xlabel: 'amount recorded', ylabel: 'marks needed', title: 'tokens against numerals' });
        const C = yearStage(v, [-8400, -2400], { height: 185, full: true, title: 'dated evidence: from tokens to writing' });
        const mode = v.select('show', [{ value: 'tok', label: 'tokens in an envelope' }, { value: 'tab', label: 'numerals on a tablet' }, { value: 'reb', label: 'the rebus step' }], 'tab');
        const com = v.select('commodity', [{ value: 'sheep', label: 'sheep' }, { value: 'barley', label: 'barley' }], 'sheep');
        const qty = v.slider('amount', 1, 3999, 1234, { int: true, log: true });
        const amount = () => (com.value === 'barley' ? Math.min(qty.value, 59) : qty.value);
        const sys = () => (com.value === 'barley' ? SYS_SE : SYS_S);
        const nMarks = (n, sy) => decompose(n, sy).reduce((t, [, k]) => t + k, 0);
        const envS = (() => { const out = []; let mx = 0; for (let q = 1; q <= 5000; q++) { const k = nMarks(q, SYS_S); if (k > mx) { if (q > 1) out.push([q, mx]); mx = k; out.push([q, mx]); } } out.push([5000, mx]); return out; })();
        const commoditySign = (x, y, u) => {
          if (com.value === 'sheep') { A.circle(x, y, 0.4 * u, { color: 'ink', width: 2 }); A.line(x - 0.4 * u, y, x + 0.4 * u, y, { color: 'ink', width: 2 }); A.line(x, y - 0.4 * u, x, y + 0.4 * u, { color: 'ink', width: 2 }); }
          else { A.line(x, y - 0.55 * u, x, y + 0.6 * u, { color: 'ink', width: 2 }); for (let k = 0; k < 4; k++) { const yy = y - 0.25 * u + k * 0.22 * u; A.line(x, yy, x - 0.22 * u, yy + 0.16 * u, { color: 'ink', width: 1.8 }); A.line(x, yy, x + 0.22 * u, yy + 0.16 * u, { color: 'ink', width: 1.8 }); } }
        };
        v.render(() => {
          const n = amount(), m = mode.value;
          // ---- A
          if (m === 'tok') {
            A.circle(5, 3.1, 2.7, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 2 });
            const shown = Math.min(n, 300), r = v.rng(4);
            for (let i = 0; i < shown; i++) { const a = r() * 6.283, d = 2.45 * Math.sqrt(r()), x = 5 + d * Math.cos(a), y = 3.1 + d * Math.sin(a);
              if (com.value === 'sheep') { A.circle(x, y, 0.09, { fill: 'muted', fillAlpha: 0.8, color: 'ink', width: 0.6 }); }
              else A.poly([[x - 0.07, y - 0.06], [x + 0.07, y - 0.06], [x, y + 0.12]], { fill: 'muted', fillAlpha: 0.8, color: 'ink', width: 0.6 }); }
            A.text(n > 300 ? `${n} tokens (300 drawn)` : `${n} token${n > 1 ? 's' : ''}`, 5, 0.12, { size: 12, color: 'ink', align: 'center', baseline: 'bottom', weight: 700, plate: true });
          } else {
            A.rect(0.4, 0.4, 9.6, 5.8, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2, radius: 18 });
            A.line(0.6, 3.1, 9.4, 3.1, { color: 'orange', width: 1, alpha: 0.6 });
            // line 1: numerals + commodity
            const parts = decompose(n, sys()).filter(([, k]) => k > 0), u = 1;
            let x = 0.9; const y = 4.45;
            for (const [sign, k, val] of parts) { const cols = Math.min(k, 5), rows = Math.ceil(k / 5); for (let i = 0; i < k; i++) { const cx = x + (i % 5) * signW[sign] * u + signW[sign] / 2, cy = y + (rows > 1 ? (Math.floor(i / 5) === 0 ? 0.45 : -0.45) : 0); numSign(A, sign, cx, cy, u); } A.text(`${k}×${val}`, x + cols * signW[sign] / 2, 3.4, { size: 10.5, color: 'muted', align: 'center' }); x += cols * signW[sign] + 0.25; }
            commoditySign(Math.min(x + 0.5, 9.0), y, 1.1);
            A.text(com.value, Math.min(x + 0.5, 9.0), 3.4, { size: 10.5, color: 'muted', align: 'center' });
            // line 2: the same signs read as the other commodity, or the rebus
            if (m === 'tab') {
              const other = com.value === 'sheep' ? 'barley' : 'sheep', small = parts.every(([sign]) => sign === 'SC' || sign === 'N1');
              const kSC = (parts.find(([sg]) => sg === 'SC') || [0, 0])[1], kN1 = (parts.find(([sg]) => sg === 'N1') || [0, 0])[1];
              const re = other === 'barley' ? 6 * kSC + kN1 : 10 * kSC + kN1;
              A.text(small ? `the same impressions read as ${other}: ${re} units` : `in the barley system the large signs mean other amounts`, 5, 2.3, { size: 12, color: 'purple', align: 'center', weight: 700 });
              A.text(`${nMarks(n, sys())} impressions + 1 commodity sign, where tokens needed ${n}`, 5, 1.3, { size: 12, color: 'ink', align: 'center' });
            } else {
              // arrow sign TI, read as "arrow" and as "life"
              A.line(2.1, 1.75, 3.9, 1.75, { color: 'ink', width: 2.2 }); A.poly([[3.9, 1.95], [4.3, 1.75], [3.9, 1.55]], { fill: 'ink', fillAlpha: 0.6, color: 'ink', width: 1.4 }); A.line(2.1, 1.75, 1.8, 2.0, { color: 'ink', width: 1.6 }); A.line(2.1, 1.75, 1.8, 1.5, { color: 'ink', width: 1.6 });
              A.text('TI', 3.0, 2.35, { size: 13, color: 'ink', align: 'center', weight: 700 });
              A.text('picture: "arrow" (ti)', 6.9, 2.15, { size: 12, color: 'accent', align: 'center' });
              A.text('rebus: "life" (ti)', 6.9, 1.35, { size: 12, color: 'green', align: 'center', weight: 700 });
              A.arrow(4.5, 1.85, 5.3, 2.1, { color: 'accent', width: 1.2, head: 6 }); A.arrow(4.5, 1.65, 5.5, 1.4, { color: 'green', width: 1.2, head: 6 });
            }
          }
          // ---- B
          B.fn((x) => x, { color: 'orange', width: 2.4 });
          B.path(envS, { color: 'accent', width: 2 });
          B.text('tokens: one per unit', 30, 60, { size: 11, color: 'orange', align: 'right' });
          B.text('numerals (most needed up to that amount)', 60, 30, { size: 11, color: 'accent', align: 'center' });
          B.dot(n, n, { r: 4.5, color: 'orange' });
          B.dot(n, Math.max(1, nMarks(n, com.value === 'barley' ? SYS_SE : SYS_S)), { r: 5, color: 'accent' });
          // ---- C
          drawYears(v, C, [
            { t: -8000, label: 'clay tokens across the Near East', contested: false, color: 'orange' },
            { t: [-3500, -3300], label: 'tokens in sealed envelopes' },
            { t: [-3350, -3200], label: 'proto-cuneiform, Uruk IV' },
            { t: [-3300, -3150], label: 'labels, Abydos tomb U-j' },
            { t: [-3100, -2900], label: 'rebus signs, Jemdet Nasr', color: 'green' },
            { t: -2600, label: 'Sumerian literary texts' },
          ], { lanes: 6, laneH: 0.12, ticks: [-8000, -7000, -6000, -5000, -4000, -3000] });
        });
        v.legend([['orange', 'tokens'], ['accent', 'impressed numerals'], ['purple', 'same signs, other system']]);
        v.readout(() => {
          const n = amount(), parts = decompose(n, sys()).filter(([, k]) => k > 0);
          const names = { N1: 'small cone', SC: 'small circle', BC: 'large cone', BCC: 'large cone with circle', LC: 'large circle' };
          return `${n}${com.value === 'barley' && qty.value > 59 ? ' (capped at 59: larger barley units not drawn)' : ''} ${com.value === 'sheep' ? 'sheep' : 'units of barley'} = ${parts.map(([sg, k, val]) => `${k} × ${names[sg]} (${val})`).join(' + ')} → **${nMarks(n, sys())} impressions** instead of **${n} tokens**${com.value === 'sheep' ? ' · sexagesimal system S: 1, 10, 60, 600, 3600' : ' · ŠE grain system: small circle = 6 small cones'} · token hypothesis after Schmandt-Besserat (its details are disputed)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Invention',
      name: 'Paper',
      credit: 'Han China, 2nd century BCE; improved and reported to the throne by Cai Lun, 105 CE',
      statement: String.raw`**Paper** is a sheet of plant fibres that have been separated in water, deposited on a screen as a random mat, pressed and dried, so that they bond to one another without any glue. The oldest known paper is Chinese: a fragment with a map from a tomb at Fangmatan, Gansu, of 179–141 BCE. In 105 CE the court official Cai Lun presented an improved process using bark, hemp, rags and old fishing nets, and Chinese tradition credits him with the invention. Paper spread west along the trade routes: papermaking was established in Samarkand by the 8th century and in Baghdad by the 790s, reached Islamic Spain by the 1150s (Xàtiva) and Italy by the 1270s (Fabriano).

Its rivals were **papyrus**, made in Egypt since the 3rd millennium BCE (the logbooks of Merer from Wadi al-Jarf, about 2560 BCE, are the oldest inscribed papyri), which grows only in the Nile valley, and **parchment**, made from animal skins. A large codex used one calfskin for each folded sheet: the Codex Amiatinus (c. 700 CE), 1,030 leaves, needed over five hundred calves. Paper could be made anywhere, from waste, in any quantity.`,
      idea: String.raw`Beating in water frays the surface of each fibre into fine fibrils and makes the fibre flexible (tech-1.9). When the wet mat dries, surface tension pulls the fibres into close contact and hydrogen bonds form between the cellulose surfaces wherever they touch. The strength of the sheet depends on how much of each fibre's surface is bonded, the **relative bonded area** (RBA), and on fibre length. Page's equation (1969) combines the two failure modes, breaking fibres and breaking bonds:
$$\frac1T = \frac{9}{8Z} + \frac{12\,A\rho}{b\,P\,L\cdot \mathrm{RBA}},$$
with $Z$ the strength of the fibres themselves, $A$ and $P$ the fibre's cross-section area and perimeter, $\rho$ its density, $L$ its length and $b$ the shear strength of a bond. Unbeaten fibres barely bond; beaten long bast fibres make a strong sheet. Cheap, short wood fibres (19th century) give a weaker one.`,
      caption: String.raw`Step through the papermaking: beat, suspend in the vat, dip the mould, press, dry. Choose the **fibre** and the **beating**: the sheet shows the random fibre mat, with the crossings found by geometry, bonded (green) in proportion to the relative bonded area. The middle chart is Page's equation for the tensile strength against beating. On the right, set the size and length of a **book** to compare the calves needed for parchment with the rags needed for paper.`,
      deps: ['tech-3.6', 'tech-1.9'],
      see: ['tech-6.2', 'tech-6.4'],
      refs: ['Mokyr ch. 3', 'Tsien, Paper and Printing (Science and Civilisation in China V.1, 1985)', 'Bloom, Paper Before Print (2001)', 'Page 1969, Tappi 52:674', 'Tallet, The Red Sea Scrolls (2021)'],
      tags: ['ancient', 'c. 100 CE', 'writing materials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/History_of_paper' },
      viz(v) {
        const A = v.stage({ x: [0, 30], y: [0, 30], equal: true, axes: false, height: 300, weight: 1, minWidth: 280, title: 'a 3 cm patch of the sheet' });
        const B = v.stage({ x: [0, 1], y: [0, 110], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280, xlabel: 'beating (0 = raw, 1 = well beaten)', ylabel: 'tensile index (N·m/g)', title: 'strength: Page’s equation' });
        const Cb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1, minWidth: 280, title: 'materials for one book' });
        const D = yearStage(v, [-2800, 1450], { height: 190, full: true, title: 'dated evidence: papyrus, paper and its spread' });
        const FIB = { kozo: { label: 'mulberry bark', L: 10 }, rag: { label: 'linen rags', L: 6 }, wood: { label: 'wood pulp (1840s)', L: 2.5 } };
        const fib = v.select('fibre', Object.entries(FIB).map(([k, f]) => ({ value: k, label: f.label })), 'kozo');
        const beat = v.slider('beating', 0, 1, 0.6, { step: 0.01 });
        const size = v.select('page', [{ value: 's', label: '15 × 22 cm' }, { value: 'm', label: '25 × 35 cm' }, { value: 'l', label: '34 × 50.5 cm (Amiatinus)' }], 'l');
        const leaves = v.slider('leaves', 50, 1100, 1030, { int: true });
        const S = v.steps({ frames: [
          { k: 0, note: 'Cook the fibre in lye and beat it in water: fibres fray into fibrils and soften.' },
          { k: 1, note: 'Stir the pulp into a vat of water: about one part fibre in a hundred.' },
          { k: 2, note: 'Dip the mould (a screen on a frame) and lift: water drains, fibres settle as a random mat.' },
          { k: 3, note: 'Couch the wet sheet onto felt and press: most of the remaining water is squeezed out.' },
          { k: 4, note: 'Dry: surface tension pulls fibres together and hydrogen bonds form at the contacts.' },
        ], start: 4, still: 4 });
        const RBA = (b) => 0.08 + 0.5 * (1 - Math.exp(-3 * b)); // illustrative beating curve
        const tensile = (b, Lmm) => { const Z = 120, Aa = 3e-10, rho = 1.5e6, bond = 3e6, P = 8e-5; return 1 / (9 / (8 * Z) + (12 * Aa * rho) / (bond * P * Lmm * 1e-3 * RBA(b))); };
        // fibre mat (cached per fibre type): fibres of length L mm in a 30 mm window, count ∝ 1/L (same grammage)
        const cache = {};
        const mat = (key) => {
          if (cache[key]) return cache[key];
          const L = FIB[key].L, n = Math.round(700 / L), r = v.rng(21), fibres = [];
          for (let i = 0; i < n; i++) { let x = r.uniform(-L / 2, 30 + L / 2), y = r.uniform(-L / 2, 30 + L / 2), a = r() * Math.PI; const pts = [[x, y]]; for (let k = 0; k < 4; k++) { a += r.uniform(-0.25, 0.25); x += (L / 4) * Math.cos(a); y += (L / 4) * Math.sin(a); pts.push([x, y]); } fibres.push(pts); }
          const cross = [];
          const segX = (p, q, r2, s2) => { const d = (q[0] - p[0]) * (s2[1] - r2[1]) - (q[1] - p[1]) * (s2[0] - r2[0]); if (Math.abs(d) < 1e-12) return null; const t = ((r2[0] - p[0]) * (s2[1] - r2[1]) - (r2[1] - p[1]) * (s2[0] - r2[0])) / d, u = ((r2[0] - p[0]) * (q[1] - p[1]) - (r2[1] - p[1]) * (q[0] - p[0])) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])] : null; };
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const c = segX(fibres[i][a], fibres[i][a + 1], fibres[j][b], fibres[j][b + 1]); if (c && c[0] > 0 && c[0] < 30 && c[1] > 0 && c[1] < 30) cross.push([c[0], c[1], r()]); }
          return (cache[key] = { fibres, cross, n });
        };
        const dims = { s: [0.15, 0.22], m: [0.25, 0.35], l: [0.34, 0.505] };
        v.render(() => {
          const k = S.frame.k ?? 4, M = mat(fib.value), b = beat.value, rba = RBA(b);
          // ---- A
          if (k <= 1) A.rect(0, 0, 30, 30, { fill: 'accent', fillAlpha: 0.14, stroke: false });
          if (k === 2) A.rect(0, 0, 30, 30, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          if (k >= 2 && k <= 3) for (let g = 1.5; g < 30; g += 1.5) A.line(g, 0, g, 30, { color: 'faint', width: 0.6 });
          A.clip(() => {
            const r = v.rng(3);
            for (const pts of M.fibres) {
              let q = pts;
              if (k <= 1) { const dx = r.uniform(-1.2, 1.2), dy = r.uniform(-1.2, 1.2); q = pts.map(([x, y]) => [x + dx, y + dy]); }
              A.path(q, { color: k <= 1 ? 'muted' : 'gold', width: 1.4 + 1.6 * b * (k >= 2 ? 1 : 0.5), alpha: k <= 1 ? 0.55 : 0.85 });
              if (b > 0.3 && k >= 2) for (let s = 1; s < 4; s++) { const [x, y] = q[s]; A.line(x, y, x + 0.4 * b, y + 0.35 * b, { color: 'gold', width: 0.7, alpha: 0.6 }); }
            }
            if (k >= 4) for (const [x, y, h] of M.cross) A.dot(x, y, { r: 2, color: h < rba ? 'green' : 'muted' });
          });
          if (k === 3) A.corner('pressing: water squeezed out', 'tl', { color: 'accent', weight: 700, plate: true });
          const bonded = M.cross.filter((c) => c[2] < rba).length;
          if (k >= 4) A.corner(`${M.cross.length} crossings, ${bonded} bonded`, 'bl', { color: 'ink', weight: 700, plate: true });
          // ---- B
          for (const [key, f] of Object.entries(FIB)) { const on = key === fib.value; B.fn((x) => tensile(x, f.L), { color: on ? 'accent' : 'muted', width: on ? 2.6 : 1.3 }); B.text(f.label, 0.98, tensile(1, f.L) + 3, { size: 10.5, color: on ? 'accent' : 'muted', align: 'right', baseline: 'bottom' }); }
          B.hline(1 / (9 / (8 * 120)), { color: 'faint', width: 1, dash: [4, 3] }); B.text('fibre strength limit 8Z/9', 0.02, 1 / (9 / 960) - 2, { size: 10.5, color: 'muted', align: 'left', baseline: 'top' });
          B.dot(b, tensile(b, FIB[fib.value].L), { r: 5, color: 'accent' });
          // ---- C: calves vs rags
          const [w, h] = dims[size.value], nl = leaves.value, biArea = 2 * w * h, perSkin = Math.max(1, Math.floor(0.45 / biArea)), calves = Math.ceil(nl / 2 / perSkin);
          const paperKg = (nl * w * h * 80) / 1000, ragKg = paperKg / 0.75;
          Cb.text('parchment', 0.04, 0.93, { size: 12, color: 'ink', align: 'left', weight: 700 });
          Cb.text(`${calves} calfskins`, 0.96, 0.93, { size: 12, color: 'red', align: 'right', weight: 700 });
          const icons = Math.min(100, Math.ceil(calves / 10));
          for (let i = 0; i < icons; i++) { const cx = 0.07 + (i % 20) * 0.045, cy = 0.82 - Math.floor(i / 20) * 0.065; Cb.poly([[cx - 0.017, cy + 0.02], [cx + 0.017, cy + 0.02], [cx + 0.012, cy - 0.022], [cx - 0.012, cy - 0.022]], { fill: 'red', fillAlpha: 0.45, color: 'red', width: 0.8 }); }
          Cb.text('each mark = 10 skins', 0.04, 0.45, { size: 10.5, color: 'muted', align: 'left' });
          Cb.text('paper', 0.04, 0.33, { size: 12, color: 'ink', align: 'left', weight: 700 });
          Cb.text(`${v.fix(paperKg, 1)} kg of paper from ~${v.fix(ragKg, 1)} kg of rags`, 0.96, 0.33, { size: 12, color: 'green', align: 'right', weight: 700 });
          Cb.rect(0.04, 0.13, 0.04 + 0.92 * Math.min(1, ragKg / 80), 0.23, { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1 });
          Cb.text(`${nl} leaves of ${Math.round(w * 100)} × ${v.fix(h * 100, 1)} cm`, 0.5, 0.03, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
          // ---- D
          drawYears(v, D, [
            { t: -2560, label: 'Merer’s papyri, Wadi al-Jarf' },
            { t: [-179, -141], label: 'Fangmatan paper map' },
            { t: 105, label: 'Cai Lun’s report', color: 'green' },
            { t: 700, label: 'Codex Amiatinus (parchment)', color: 'red' },
            { t: 751, label: 'Samarkand: Talas prisoners', contested: true },
            { t: 794, label: 'paper mill, Baghdad' },
            { t: 1151, label: 'Xàtiva, Spain' },
            { t: 1276, label: 'Fabriano, Italy' },
          ], { lanes: 5, laneH: 0.14, ticks: [-2500, -2000, -1500, -1000, -500, 1, 500, 1000] });
        });
        v.legend([['gold', 'fibres'], ['green', 'bonded crossing', { dot: true }], ['muted', 'unbonded crossing', { dot: true }], ['accent', 'tensile index of the chosen fibre']]);
        v.readout(() => {
          const b = beat.value, L = FIB[fib.value].L, T = tensile(b, L), [w, h] = dims[size.value], perSkin = Math.max(1, Math.floor(0.45 / (2 * w * h)));
          return `${FIB[fib.value].label}, fibres ${L} mm: RBA ${v.fix(RBA(b), 2)} → Page tensile index **${v.fix(T, 0)} N·m/g** (breaking length ${v.fix(T / 9.81, 1)} km) · parchment: ${perSkin} folded sheet${perSkin > 1 ? 's' : ''} per calfskin at this size (usable skin taken as 0.45 m², one bifolium per calf for Amiatinus) · paper at 80 g/m², 75% yield from rags · fibre and beating constants are illustrative typical values`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Invention',
      name: 'Counting boards and the abacus',
      credit: 'Greek and Roman counting boards (Salamis tablet, c. 300 BCE); Chinese suanpan, documented from the Ming dynasty',
      statement: String.raw`A **counting board** or **abacus** holds a number as counters in columns, one column per power of the base, so that arithmetic becomes moving counters by fixed rules: when a column fills up, clear it and carry one counter to the next. The Greeks and Romans reckoned with pebbles (*calculi*) on ruled boards; the marble **Salamis tablet** (about 300 BCE, found in 1846) is the oldest surviving one. Romans also had small bronze hand abaci with beads in slots. Medieval Europe reckoned "on the lines" with counters until written Hindu–Arabic arithmetic displaced it.

The Chinese **suanpan** has rods with two beads worth five above a beam and five beads worth one below. A book by Xu Yue of about 190 CE mentions bead calculation, though what device it meant is unclear; the suanpan is clearly illustrated in Ming books from 1573 and was standard by the late 16th century, when it spread to Japan. Each rod can hold up to 15, which suited the traditional Chinese weight units (16 *liang* to the *jin*).`,
      idea: String.raw`A number is held in place-value form (tech-3.9 writes the same idea on paper): each column stands for a power of the base, and grouping the counters in fives keeps each column readable at a glance. Addition is column by column with carries. Multiplication is a sum of single-digit products, each added at the position given by the sum of the digits' places, which is the distributive law. Every step is local and mechanical, so a trained operator is fast: the abacus stored the intermediate number that a person without written place-value numerals could not hold in the head (tech-3.6).`,
      caption: String.raw`Choose **add** or **multiply** and set the two numbers. The player moves through the calculation: each step adds one digit (or one digit product) to a rod and resolves the carries. Top: the suanpan with the beads that moved highlighted; below: the same state on a Roman-style counting board (pebbles on the lines for 1, 10, 100, …, one pebble in the space above for 5, 50, …). Switch to **base 16** to use all the suanpan's beads as for jin and liang (the counting board has no such mode).`,
      deps: ['tech-3.6'],
      see: ['tech-3.9', 'tech-11.10'],
      refs: ['Mokyr ch. 2', 'Menninger, Number Words and Number Symbols (1969)', 'Lang 1957, Hesperia 26:271 (Salamis tablet)', 'Martzloff, A History of Chinese Mathematics (1997)'],
      tags: ['ancient', 'computation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Abacus' },
      viz(v) {
        const R = 7;
        const A = v.stage({ x: [-0.6, R - 0.4], y: [-0.4, 3.0], axes: false, height: 230, full: true, title: 'suanpan (rods: units on the right)' });
        const Bd = v.stage({ x: [-0.6, R - 0.4], y: [-0.2, 2.6], axes: false, height: 200, weight: 1.3, minWidth: 380, title: 'the same number on a counting board' });
        const D = yearStage(v, [-500, 1700], { height: 200, weight: 1, minWidth: 300, title: 'dated evidence: boards and beads' });
        const op = v.select('operation', [{ value: 'add', label: 'add' }, { value: 'mul', label: 'multiply' }], 'add', { onChange: () => S.reset(undefined, { at: 'start' }) });
        const base = v.select('base', [{ value: 10, label: 'base 10' }, { value: 16, label: 'base 16 (jin, liang)' }], 10, { onChange: () => S.reset(undefined, { at: 'start' }) });
        const aS = v.slider('a', 1, 9999, 4782, { int: true, onChange: () => S.reset(undefined, { at: 'start' }) });
        const bS = v.slider('b', 1, 999, 659, { int: true, onChange: () => S.reset(undefined, { at: 'start' }) });
        const build = () => {
          const B = +base.value, a = aS.value, b = bS.value, frames = []; let rods = new Array(R).fill(0), moves = 0;
          const push = (note, line, hi) => frames.push({ rods: rods.slice(), note, line, hi, moves });
          const addAt = (pos, d) => { // add digit d at rod pos, then carry
            const before = rods.slice(); rods[pos] += d; let p = pos;
            while (p < R && rods[p] >= B) { rods[p] -= B; if (p + 1 < R) rods[p + 1] += 1; p++; }
            moves += beadMoves(before, rods); return p;
          };
          if (op.value === 'add') {
            digitsOf(a, B, R).forEach((d, i) => { rods[i] = d; }); moves = rods.reduce((t, d) => t + beadsOf(d)[0] + beadsOf(d)[1], 0);
            push(`Set a = ${a.toString(B).toUpperCase()} on the rods.`, 1, []);
            const db = digitsOf(b, B, R); const nd = b.toString(B).length;
            for (let i = 0; i < nd; i++) { const top = addAt(i, db[i]); push(`Add ${db[i].toString(B).toUpperCase()} to the ${['units', B === 10 ? 'tens' : 'sixteens', B === 10 ? 'hundreds' : '256s', B === 10 ? 'thousands' : '4096s'][i] || `rod ${i + 1}`} rod${top > i ? `, carry ${top - i} rod${top - i > 1 ? 's' : ''} left` : ''}.`, top > i ? 4 : 3, [i, ...Array.from({ length: top - i }, (_, k) => i + k + 1)]); }
            push(`Read the answer: ${(a + b).toString(B).toUpperCase()}.`, 5, []);
          } else {
            const da = digitsOf(a, B, R), db = digitsOf(b, B, R), na = a.toString(B).length, nb = b.toString(B).length;
            push(`Clear the rods. Multiply ${a.toString(B).toUpperCase()} × ${b.toString(B).toUpperCase()} digit by digit.`, 1, []);
            for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
              const p = da[i] * db[j]; if (!p) continue; const lo = p % B, hi = Math.floor(p / B), pos = i + j;
              if (pos >= R) continue;
              let top = addAt(pos, lo); if (hi && pos + 1 < R) top = Math.max(top, addAt(pos + 1, hi));
              push(`${da[i].toString(B).toUpperCase()} × ${db[j].toString(B).toUpperCase()} = ${p.toString(B).toUpperCase()}: add it at rod ${pos + 1}${top > pos + (hi ? 1 : 0) ? ' with carries' : ''}.`, 3, [pos, pos + 1]);
            }
            push(`Read the answer: ${(a * b).toString(B).toUpperCase()}${a * b >= B ** R ? ' (overflows the 7 rods)' : ''}.`, 5, []);
          }
          return frames;
        };
        const S = v.steps({ frames: build, code: ['set the first number', 'for each digit (or digit product):', '  add it to its rod', '  rod full? clear it, carry 1 left', 'read the rods'], codeTitle: 'rules', still: 'end', speed: 1.2 });
        v.render(() => {
          const f = S.frame, rods = f.rods || new Array(R).fill(0), B = +base.value, hi = new Set(f.hi || []);
          // ---- suanpan: x = R-1-i for rod i
          A.rect(-0.5, -0.3, R - 0.5, 2.9, { color: 'orange', width: 4, radius: 6 });
          A.line(-0.5, 2.0, R - 0.5, 2.0, { color: 'orange', width: 4 });
          for (let i = 0; i < R; i++) {
            const x = R - 1 - i, [u, l] = beadsOf(rods[i]), col = hi.has(i) ? 'gold' : 'accent';
            A.line(x, -0.3, x, 2.9, { color: 'muted', width: 2 });
            for (let k = 0; k < 2; k++) { const on = k < u, y = on ? 1.82 - k * 0.3 : 2.72 - (1 - k) * 0.3; A.rect(x - 0.33, y - 0.12, x + 0.33, y + 0.12, { fill: on ? col : 'muted', fillAlpha: on ? 0.85 : 0.3, color: on ? col : 'muted', width: 1, radius: 8 }); }
            for (let k = 0; k < 5; k++) { const on = k < l, y = on ? 1.75 - 0.33 - k * 0.27 : -0.15 + (4 - k) * 0.27; A.rect(x - 0.33, y - 0.11, x + 0.33, y + 0.11, { fill: on ? col : 'muted', fillAlpha: on ? 0.85 : 0.3, color: on ? col : 'muted', width: 1, radius: 8 }); }
            A.text(rods[i].toString(B).toUpperCase(), x, -0.38, { size: 12, color: hi.has(i) ? 'gold' : 'ink', align: 'center', baseline: 'top', weight: 700 });
          }
          // ---- counting board (base 10 only)
          if (B === 10) {
            for (let i = 0; i < R; i++) {
              const x = R - 1 - i, d = rods[i], fives = Math.floor(d / 5), ones = d % 5;
              Bd.line(x - 0.45, 0.9, x + 0.45, 0.9, { color: 'muted', width: 1.4 });
              Bd.text(['I', 'X', 'C', 'M', 'X̄', 'C̄', 'M̄'][i], x, 0.08, { size: 11, color: 'muted', align: 'center' });
              Bd.text(['V', 'L', 'D', 'V̄', 'L̄', 'D̄', ''][i], x, 2.45, { size: 11, color: 'muted', align: 'center' });
              for (let k = 0; k < ones; k++) Bd.dot(x - 0.32 + k * 0.16, 0.9, { r: 5, color: hi.has(i) ? 'gold' : 'ink' });
              if (fives) Bd.dot(x, 1.65, { r: 5, color: hi.has(i) ? 'gold' : 'ink' });
            }
            Bd.text('lines: 1, 10, 100 … · spaces: 5, 50, 500 …', (R - 1) / 2, 1.3, { size: 10.5, color: 'muted', align: 'center' });
          } else Bd.text('a counting board is decimal: no base-16 mode', (R - 1) / 2, 1.2, { size: 12, color: 'red', align: 'center' });
          drawYears(v, D, [
            { t: -300, label: 'Salamis tablet' },
            { t: 50, label: 'Roman hand abacus' },
            { t: 190, label: 'Xu Yue: bead reckoning', contested: true },
            { t: 1573, label: 'suanpan illustrated (Ming)', color: 'green' },
            { t: 1600, label: 'soroban in Japan' },
            { t: [1100, 1550], label: 'reckoning on the lines, Europe', color: 'purple' },
          ], { lanes: 4, ticks: [-500, 1, 500, 1000, 1500] });
        });
        v.legend([['accent', 'beads set'], ['gold', 'rods changed in this step'], ['muted', 'idle beads']]);
        v.readout(() => {
          const f = S.frame, B = +base.value, a = aS.value, b = bS.value, val = (f.rods || []).reduce((t, d, i) => t + d * B ** i, 0);
          const exact = op.value === 'add' ? a + b : a * b;
          return `rods hold **${val.toString(B).toUpperCase()}**${B === 16 ? ` (= ${val} decimal)` : ''} · target ${exact.toString(B).toUpperCase()} · bead moves so far: **${f.moves ?? 0}** · step ${S.i + 1} of ${S.n}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Invention',
      name: 'Place-value numerals with zero',
      credit: 'Babylonian base-60 place value (c. 2000 BCE); decimal place value with a zero digit, India, by the 7th century CE',
      statement: String.raw`In a **place-value** numeral the value of a digit depends on its position: in base $b$, $d_k d_{k-1}\dots d_0$ means $\sum d_i b^i$. A **zero** digit marks an empty place, so that 205 and 25 differ. With a few digits and positions any number can be written, and arithmetic reduces to a small table of single-digit facts plus carrying.

The Babylonians wrote numbers in base 60 with place value from about 2000 BCE, but at first without a zero or a "sexagesimal point". The tablet **YBC 7289** (about 1800–1600 BCE) gives the diagonal of a square of side 30 and the number $1;24,51,10 = 1 + 24/60 + 51/60^2 + 10/60^3 \approx 1.414213$, which is $\sqrt2$ correct to about one part in two million. A placeholder sign for an empty middle place appears in the first millennium BCE. Decimal place value with a true zero digit comes from India: Brahmagupta gave rules for computing with zero in 628 CE, and the oldest firmly dated zero digit is in the Khmer inscription of Sambor, dated 605 of the Śaka era (683 CE). Through al-Khwārizmī's arithmetic (9th century) and Fibonacci's *Liber Abaci* (1202) the system replaced Roman numerals and the counting board in Europe.`,
      idea: String.raw`Place value is the counting board (tech-3.8) written down: positions are the columns, digits the number of counters. Zero is the empty column. Once the board is on paper, written algorithms work directly on the numerals, and the work stays on the page to be checked. Roman numerals are additive, so a product needs every symbol of one factor times every symbol of the other and then a long regrouping of the pile. The decimal algorithm needs one table lookup per pair of digits and a few column additions.

Without a zero the notation is ambiguous: a Babylonian "1 4" might mean $64$, $3604$ or $1\tfrac{4}{60}$, and the reader had to judge from context.`,
      caption: String.raw`**Roman vs decimal:** set two numbers and count the symbol operations of each multiplication (lookups, symbols written, regroupings), with the scatter of counts for 200 random pairs. **Base 60:** YBC 7289 drawn with its cuneiform numbers. Choose how many sexagesimal places to keep and see the error, and Heron's (the Babylonian) iteration converge. **Without zero:** pick a number and see every value its zero-less Babylonian digits could have.`,
      deps: ['tech-3.8'],
      see: ['tech-3.6', 'tech-11.10'],
      refs: ['Mokyr ch. 3', 'Fowler & Robson 1998, Historia Math. 25:366 (YBC 7289)', 'Plofker, Mathematics in India (2009)', 'Ifrah, The Universal History of Numbers (2000)', 'Coedès 1931 (Sambor inscription)'],
      tags: ['medieval', 'c. 600 CE', 'numerals'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Positional_notation' },
      viz(v) {
        const A = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 290, weight: 1.2, minWidth: 360, title: 'the working' });
        const B = v.stage({ x: [1, 10000], y: [1, 2000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 300, xlabel: 'product', ylabel: 'symbol operations', title: 'cost of a multiplication' });
        const C = yearStage(v, [-1950, 1300], { height: 190, full: true, title: 'dated evidence: place value and zero' });
        const mode = v.select('show', [{ value: 'mul', label: 'Roman vs decimal' }, { value: 's60', label: 'base 60: YBC 7289' }, { value: 'zero', label: 'without zero' }], 'mul');
        const aS = v.slider('a', 2, 99, 47, { int: true });
        const bS = v.slider('b', 2, 99, 38, { int: true });
        const places = v.slider('sexagesimal places', 1, 5, 3, { int: true });
        const zS = v.slider('number', 1, 216000, 3604, { int: true, log: true });
        const pairs = (() => { const r = v.rng(8), out = []; for (let i = 0; i < 200; i++) { const a = r.int(2, 99), b = r.int(2, 99); out.push([a * b, romanCost(a, b).total, decimalCost(a, b).total]); } return out; })();
        const tri = (x0, y0, w) => A.poly([[x0, y0], [x0 + w, y0], [x0 + w / 2, y0 - w * 0.9]], { fill: 'ink' });
        v.render(() => {
          const m = mode.value;
          aS.el.hidden = bS.el.hidden = m !== 'mul'; places.el.hidden = m !== 's60'; zS.el.hidden = m !== 'zero';
          if (m === 'mul') {
            const a = aS.value, b = bS.value, rc = romanCost(a, b), dc = decimalCost(a, b);
            B.setView([1, 10000], [1, 2000]); B.setScale({ xlog: true, ylog: true }); B.setLabels('product', 'symbol operations'); B.setTitle('cost of a multiplication');
            for (const [p, r, d] of pairs) { B.dot(p, r, { r: 2.2, color: 'red' }); B.dot(p, d, { r: 2.2, color: 'accent' }); }
            B.dot(a * b, rc.total, { r: 6, color: 'red', hollow: true }); B.dot(a * b, dc.total, { r: 6, color: 'accent', hollow: true });
            // working
            A.text('Roman', 0.2, 5.6, { size: 13, color: 'red', align: 'left', weight: 700 });
            A.text(`${rc.sa} × ${rc.sb}`, 0.2, 5.0, { size: 13, color: 'ink', align: 'left', math: false });
            A.text(`${rc.products} symbol products, each written out:`, 0.2, 4.4, { size: 11.5, color: 'ink', align: 'left' });
            const sample = []; for (const x of new Set(rc.sa)) for (const y of new Set(rc.sb)) sample.push(`${x}×${y}=${romanAdd(RV[x] * RV[y])}`);
            A.text(sample.slice(0, 6).join('  '), 0.2, 3.9, { size: 11, color: 'muted', align: 'left' });
            A.text(`${rc.written} symbols in the pile, ${rc.exchanges} regroupings → ${romanAdd(a * b)}`, 0.2, 3.35, { size: 11.5, color: 'ink', align: 'left' });
            A.line(0.2, 2.95, 9.8, 2.95, { color: 'faint', width: 1 });
            A.text('decimal', 0.2, 2.55, { size: 13, color: 'accent', align: 'left', weight: 700 });
            const rows = [String(a), '× ' + b, ...dc.rows.map(String), String(a * b)];
            rows.forEach((s, i) => A.text(s, 4.0, 2.55 - i * 0.42, { size: 13, color: i === rows.length - 1 ? 'accent' : 'ink', align: 'right', weight: i === rows.length - 1 ? 700 : 500 }));
            A.line(2.6, 2.55 - 1.5 * 0.42 + 0.02, 4.1, 2.55 - 1.5 * 0.42 + 0.02, { color: 'ink', width: 1 });
            if (dc.rows.length > 1) A.line(2.6, 2.55 - (rows.length - 1.5) * 0.42, 4.1, 2.55 - (rows.length - 1.5) * 0.42, { color: 'ink', width: 1 });
            A.text(`${dc.products} digit products, ${dc.written} digits written, ${dc.adds} column sums`, 4.6, 1.9, { size: 11.5, color: 'ink', align: 'left' });
            A.text(`total ${dc.total} vs ${rc.total} for Roman`, 4.6, 1.35, { size: 12, color: 'accent', align: 'left', weight: 700 });
          } else if (m === 's60') {
            // tablet: square with diagonals, numbers in cuneiform
            const cx = 2.6, cy = 3.0, h = 1.9, rot = Math.PI / 4, P = (x, y) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
            A.circle(cx, cy, 2.75, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2 });
            const sq = [P(-h / 2 * 1.41, -h / 2 * 1.41), P(h / 2 * 1.41, -h / 2 * 1.41), P(h / 2 * 1.41, h / 2 * 1.41), P(-h / 2 * 1.41, h / 2 * 1.41)];
            A.poly(sq, { color: 'ink', width: 1.6 }); A.line(sq[0][0], sq[0][1], sq[2][0], sq[2][1], { color: 'ink', width: 1.2 }); A.line(sq[1][0], sq[1][1], sq[3][0], sq[3][1], { color: 'ink', width: 1.2 });
            cuneiDigit(A, 30, 0.55, 4.35, 0.75);
            let x = 1.25; for (const d of [1, 24, 51, 10]) { x += cuneiDigit(A, d, x, 3.2, 0.6, 'accent') + 0.22; }
            x = 1.45; for (const d of [42, 25, 35]) { x += cuneiDigit(A, d, x, 2.45, 0.6, 'green') + 0.22; }
            A.text('30', 0.4, 4.95, { size: 10.5, color: 'ink', align: 'left' });
            A.text('1;24,51,10', 2.6, 3.65, { size: 10.5, color: 'accent', align: 'center' });
            A.text('42;25,35', 2.6, 1.95, { size: 10.5, color: 'green', align: 'center' });
            // iteration table
            const n = places.value, r = roundSexa(Math.SQRT2, n);
            let xk = 1.5; const it = [];
            for (let k = 0; k < 4; k++) { it.push(xk); xk = (xk + 2 / xk) / 2; }
            A.text(`√2 to ${n} place${n > 1 ? 's' : ''}: 1;${r.d.join(',')}`, 5.6, 5.4, { size: 12.5, color: 'accent', align: 'left', weight: 700 });
            A.text(`= ${r.val.toFixed(10)}, error ${v.fmt(r.val - Math.SQRT2, 2)}`, 5.6, 4.9, { size: 11.5, color: 'ink', align: 'left' });
            A.text('Heron: x ← (x + 2/x) / 2', 5.6, 4.1, { size: 11.5, color: 'ink', align: 'left' });
            it.forEach((xv, k) => { const s = toSexa(xv, 5); A.text(`x${k} = 1;${s.d.map((d) => String(d).padStart(2, '0')).join(',')}`, 5.6, 3.55 - k * 0.48, { size: 11, color: k === 2 ? 'green' : 'muted', align: 'left' }); });
            A.text('x₂ already rounds to the tablet’s 1;24,51,10', 5.6, 1.45, { size: 10.5, color: 'green', align: 'left' });
            // B: error vs places
            B.setScale({ xlog: false, ylog: true }); B.setView([0.5, 5.5], [1e-12, 1]); B.setLabels('sexagesimal places kept', '|error|'); B.setTitle('error of the rounded value');
            for (let k = 1; k <= 5; k++) { const e = Math.abs(roundSexa(Math.SQRT2, k).val - Math.SQRT2); B.rect(k - 0.3, 1e-12, k + 0.3, Math.max(e, 1e-12), { fill: k === n ? 'accent' : 'muted', fillAlpha: k === 3 ? 0.8 : 0.4, color: k === 3 ? 'gold' : 'muted', width: k === 3 ? 2 : 1 }); }
            B.text('YBC 7289', 3, 3e-6, { size: 11, color: 'gold', align: 'center', weight: 700, plate: true });
          } else {
            const N = zS.value, d60 = []; let t = N; while (t > 0) { d60.unshift(t % 60); t = Math.floor(t / 60); }
            const nz = d60.filter((d) => d > 0);
            A.text('written with place value and zero', 0.2, 5.55, { size: 12, color: 'green', align: 'left', weight: 700 });
            let x = 0.4; d60.forEach((d) => { if (d === 0) { tri(x + 0.05, 4.95, 0.22); tri(x + 0.3, 4.95, 0.22); x += 0.85; } else x += cuneiDigit(A, d, x, 4.75, 0.7) + 0.45; });
            A.text(`= ${d60.join(', ')} (base 60) = ${N}`, 5.0, 4.75, { size: 11.5, color: 'ink', align: 'left' });
            A.text('without zero or spacing', 0.2, 3.9, { size: 12, color: 'red', align: 'left', weight: 700 });
            x = 0.4; nz.forEach((d) => { x += cuneiDigit(A, d, x, 3.15, 0.7) + 0.25; });
            // all readings: the nonzero digits placed in any increasing positions, shifts allowed (integers and fractions)
            const readings = new Set(); const k = nz.length, maxPos = Math.min(5, k + 2);
            const rec = (i, lastPos, acc) => { if (i === k) { readings.add(acc); return; } for (let p = lastPos - 1; p >= -2; p--) { if (p < -2) break; rec(i + 1, p, acc + nz[i] * 60 ** p); } };
            for (let p0 = maxPos; p0 >= k - 3; p0--) rec(1, p0, nz[0] * 60 ** p0);
            const list = [...readings].filter((r) => r < 1e7).sort((a, b) => a - b);
            A.text(`could be read ${list.length} ways, e.g.:`, 0.2, 2.35, { size: 11.5, color: 'ink', align: 'left' });
            const show = list.filter((r) => Number.isInteger(r)).slice(0, 6).concat(list.filter((r) => !Number.isInteger(r)).slice(-2));
            A.text(show.map((r) => (Number.isInteger(r) ? String(r) : v.fix(r, 4))).join(',  '), 0.2, 1.8, { size: 11.5, color: 'red', align: 'left' });
            A.text(`(the true value ${N} is one of them)`, 0.2, 1.25, { size: 11, color: 'muted', align: 'left' });
            B.setScale({ xlog: false, ylog: false }); B.setView([0, 1], [0, 1]); B.setLabels(null, null); B.setTitle('a digit’s value depends on its place');
            B.text('the same two digits, 1 and 4:', 0.5, 0.88, { size: 12, color: 'ink', align: 'center' });
            [['1,4', '64'], ['1,0,4', '3,604'], ['1,4,0', '3,840'], ['1;4', '1 + 4/60'], ['0;1,4', '1/60 + 4/3600']].forEach(([w, val], i) => { B.text(w, 0.32, 0.72 - i * 0.14, { size: 12.5, color: 'accent', align: 'right', weight: 700 }); B.text(`= ${val}`, 0.38, 0.72 - i * 0.14, { size: 12, color: 'ink', align: 'left' }); });
          }
          drawYears(v, C, [
            { t: [-1800, -1600], label: 'YBC 7289: √2 in base 60' },
            { t: -700, label: 'placeholder sign, Kish' },
            { t: -36, label: 'Maya Long Count with zero', color: 'purple' },
            { t: 150, label: 'Ptolemy’s zero symbol', color: 'muted' },
            { t: [224, 383], label: 'Bakhshali folio', contested: true },
            { t: 628, label: 'Brahmagupta’s rules for zero' },
            { t: 683, label: 'Sambor zero digit', color: 'green' },
            { t: 876, label: 'Gwalior zero' },
            { t: 825, label: 'al-Khwārizmī' },
            { t: 1202, label: 'Liber Abaci' },
          ], { lanes: 5, laneH: 0.14, ticks: [-1500, -1000, -500, 1, 500, 1000] });
        });
        v.legend([['red', 'Roman numerals'], ['accent', 'decimal place value'], ['green', 'with zero / converged']]);
        v.readout(() => {
          const m = mode.value;
          if (m === 'mul') { const a = aS.value, b = bS.value, rc = romanCost(a, b), dc = decimalCost(a, b); return `${a} × ${b} = ${a * b}: Roman **${rc.total}** symbol operations (${rc.products} lookups + ${rc.written} symbols + ${rc.exchanges} regroupings), decimal **${dc.total}** (${dc.products} digit products + ${dc.written} digits + ${dc.adds} column sums): ${v.fix(rc.total / dc.total, 1)}× the work`; }
          if (m === 's60') { const n = places.value, r = roundSexa(Math.SQRT2, n); return `YBC 7289: 1;24,51,10 = 305470/216000 = ${(305470 / 216000).toFixed(9)}, √2 = ${Math.SQRT2.toFixed(9)}, relative error ${v.fmt((305470 / 216000 - Math.SQRT2) / Math.SQRT2, 2)} · 30 × 1;24,51,10 = 42;25,35 = ${(42 + 25 / 60 + 35 / 3600).toFixed(6)} (exact 30√2 = ${(30 * Math.SQRT2).toFixed(6)}) · rounded to ${n} place${n > 1 ? 's' : ''}: 1;${r.d.join(',')}`; }
          const N = zS.value; let t = N; const d = []; while (t > 0) { d.unshift(t % 60); t = Math.floor(t / 60); }
          return `${N} = ${d.join(',')} in base 60 · ${d.includes(0) ? '**an empty place**: without a zero sign it is indistinguishable from the shorter numerals' : 'no empty place, but without a sexagesimal point the scale is still ambiguous'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Invention',
      name: 'The balance and standard weights',
      credit: 'Egypt and Mesopotamia, 3rd millennium BCE (Sneferu’s weights, c. 2600 BCE); steelyard: Greece and China, 1st millennium BCE',
      statement: String.raw`An **equal-arm balance** compares a load with standard weights: by the law of the lever (tech-2.1) it balances when the two masses are equal, whatever the local gravity. Its use needs a **set of standard weights**: polished stone weights are known from Egypt in the reign of Sneferu (about 2600 BCE), and the Indus cities (about 2400–1800 BCE) used cubes of chert in a binary series, ratios 1, 2, 4, 8, 16, 32, 64 and then larger decimal multiples, with the 16 unit at about 13.7 g. With a binary set every whole number of units up to the total can be made with one pan; placing weights in both pans, as in Bachet's weight problem, the powers of three do even better.

A **steelyard** has unequal arms: the load hangs close to the fulcrum and a single small counterpoise slides along a graduated long arm until the beam balances, so the reading is a distance. It was in use in Greece by the 5th–4th century BCE, perhaps earlier, and in Rome and China. A balance of the state of Chu (4th–3rd century BCE) is the earliest excavated in China.`,
      idea: String.raw`Both instruments are the law of the lever: equilibrium when the moments match, $W a = w x + M_b c$, where $M_b$ is the beam's own weight acting at distance $c$ from the fulcrum. The equal-arm balance sets $a = x$ and reads $W = w$ by adding weights. The steelyard keeps $w$ fixed and reads $W = (w x + M_b c)/a$, which is linear in $x$, so the graduations are equally spaced. A second hook closer to the fulcrum (smaller $a$) gives a heavy-load scale.

Standard weights are a coding problem: with one pan, a set of $n$ weights can make at most $2^n - 1$ different loads, which the binary set $1, 2, 4, \dots$ attains. With weights allowed on both pans each weight can be added, subtracted or left off, so $n$ weights reach $(3^n - 1)/2$ loads, attained by $1, 3, 9, 27, \dots$ (balanced ternary).`,
      caption: String.raw`**Balance:** set the load and choose a weight set. The weights the algorithm chooses go into the pans; the strip below shows which whole loads each set can weigh (gaps in red). **Steelyard:** drag the gold counterpoise along the beam. The beam tilts until the moments balance, and the computed graduations show the load that balances at each mark; switch to the heavy hook for a second scale.`,
      deps: ['tech-2.1'],
      see: ['tech-2.6', 'tech-3.9'],
      refs: ['Mokyr ch. 2', 'Kenoyer, in Weights and Marketplaces (2010) — Harappan weights', 'Petruso, Ayia Irini: The Balance Weights (1992)', 'Ialongo & Lago 2021, PNAS 118:e2105873118 (Bronze Age weight systems)'],
      tags: ['ancient', 'measurement'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Steelyard_balance' },
      viz(v) {
        const A = v.stage({ x: [-6, 6], y: [-3.2, 3.2], equal: true, axes: false, height: 300, weight: 1.3, minWidth: 380, title: 'weighing' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1, minWidth: 300, title: 'which loads each set can weigh' });
        const C = yearStage(v, [-2800, 1700], { height: 185, full: true, title: 'dated evidence: weights and balances' });
        const mode = v.select('instrument', [{ value: 'bal', label: 'equal-arm balance' }, { value: 'sy', label: 'steelyard' }], 'bal');
        const SETS = {
          bin: { label: 'binary 1–64 (Indus)', w: [1, 2, 4, 8, 16, 32, 64], two: false },
          dec: { label: 'decimal 1, 2, 2, 5, 10, 20, 20, 50', w: [1, 2, 2, 5, 10, 20, 20, 50], two: false },
          ter: { label: 'powers of 3, both pans', w: [1, 3, 9, 27, 81], two: true },
        };
        const set = v.select('weights', Object.entries(SETS).map(([k, s]) => ({ value: k, label: s.label })), 'bin');
        const load = v.slider('load (units)', 1, 130, 45, { int: true });
        const heavy = v.toggle('heavy hook', false);
        const UNIT = 0.856; // g, smallest Harappan weight (harappa.com)
        // solve: one pan subset (greedy works for binary and this decimal set? use exact subset search) or balanced ternary
        const solve = (key, W) => {
          const s = SETS[key];
          if (s.two) { const right = [], left = []; let n = W; for (const w of s.w) { const r = ((n % 3) + 3) % 3; if (r === 1) { right.push(w); n -= 1; } else if (r === 2) { left.push(w); n += 1; } n /= 3; } return n === 0 ? { right, left, ok: true } : { right: [], left: [], ok: false }; }
          const ws = s.w, nW = ws.length; let best = null;
          for (let mask = 0; mask < 1 << nW; mask++) { let t = 0, c = 0; for (let i = 0; i < nW; i++) if (mask & (1 << i)) { t += ws[i]; c++; } if (t === W && (!best || c < best.c)) best = { mask, c }; }
          if (!best) return { right: [], left: [], ok: false };
          return { right: ws.filter((_, i) => best.mask & (1 << i)), left: [], ok: true };
        };
        const cover = {}; for (const k of Object.keys(SETS)) cover[k] = Array.from({ length: 131 }, (_, W) => (W === 0 ? true : solve(k, W).ok));
        // steelyard geometry (data units = dm): fulcrum at 0, hooks at a = 0.8 (light) / 0.35 (heavy), beam weight 1.2 kg at c = 1.0 on the long side, counterpoise 1 kg
        const wC = 1, Mb = 1.2, cB = 1.0;
        const cp = A.handle(3, 0.3, { color: 'gold', label: 'counterpoise', labelPos: 'n', constrain: (x) => [clamp(x, 1.0, 5.4), 0.3] });
        v.render(() => {
          const m = mode.value; cp.visible = m === 'sy'; set.el.hidden = m !== 'bal'; load.el.hidden = m !== 'bal'; heavy.el.hidden = m !== 'sy';
          if (m === 'bal') {
            const W = load.value, sol = solve(set.value, W), right = sol.right, left = sol.left;
            const sumR = right.reduce((a, b) => a + b, 0), sumL = left.reduce((a, b) => a + b, 0), diff = W + sumL - sumR;
            const th = sol.ok ? 0 : clamp(Math.atan(diff / 40), -0.18, 0.18);
            A.poly([[0, 1.9], [-0.5, -2.8], [0.5, -2.8]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.4 });
            A.line(-5, -2.8, 5, -2.8, { color: 'muted', width: 1.5 });
            const P = (x) => [x * Math.cos(th), 2.0 - x * Math.sin(th)];
            const L = P(-4), Rr = P(4); A.line(L[0], L[1], Rr[0], Rr[1], { color: 'ink', width: 4 }); A.dot(0, 2.0, { r: 4, color: 'ink' });
            const pan = (p, items, col, isLoad) => {
              const y = p[1] - 2.6; A.line(p[0], p[1], p[0] - 1.1, y, { color: 'muted', width: 1 }); A.line(p[0], p[1], p[0] + 1.1, y, { color: 'muted', width: 1 });
              A.path([[p[0] - 1.3, y], [p[0] - 1.0, y - 0.25], [p[0] + 1.0, y - 0.25], [p[0] + 1.3, y]], { color: 'ink', width: 2 });
              let x = p[0] - 1.05;
              if (isLoad) { A.rect(p[0] - 0.75, y, p[0] - 0.75 + 0.9, y + 0.25 + 0.012 * W, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.2, radius: 3 }); A.text(`${W}`, p[0] - 0.3, y + 0.12 + 0.006 * W, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); x = p[0] + 0.25; }
              for (const w of items) { const s = 0.18 + 0.05 * Math.log2(w + 1); A.rect(x, y, x + s, y + s, { fill: col, fillAlpha: 0.6, color: col, width: 1 }); A.text(`${w}`, x + s / 2, y + s + 0.05, { size: 9.5, color: 'ink', align: 'center', baseline: 'bottom' }); x += s + 0.06; }
            };
            pan(L, left, 'purple', true); pan(Rr, right, 'accent', false);
            A.corner(sol.ok ? `balanced: ${W} = ${right.join(' + ')}${left.length ? ` − (${left.join(' + ')})` : ''}` : `cannot make ${W} with this set`, 'tl', { color: sol.ok ? 'green' : 'red', weight: 700, plate: true });
            // B: coverage strips
            Object.entries(SETS).forEach(([k, s], r) => {
              const y = 0.78 - r * 0.28, on = k === set.value, maxW = s.two ? (s.w.reduce((a, b) => a + b, 0)) : s.w.reduce((a, b) => a + b, 0);
              B.text(`${s.label}: ${s.w.length} weights`, 0.02, y + 0.12, { size: 11, color: on ? 'ink' : 'muted', align: 'left', weight: on ? 700 : 500 });
              for (let Wx = 1; Wx <= 130; Wx++) { const x0 = 0.02 + (Wx - 1) * (0.96 / 130); B.rect(x0, y - 0.04, x0 + 0.96 / 130, y + 0.05, { fill: cover[k][Wx] ? (on ? 'green' : 'muted') : 'red', fillAlpha: cover[k][Wx] ? (on ? 0.7 : 0.35) : 0.55, stroke: false }); }
              const reach = cover[k].findIndex((c, i) => i > 0 && !c); B.text(`every load 1–${reach < 0 ? 130 : reach - 1}${reach < 0 ? '+' : ''} (max ${maxW})`, 0.98, y - 0.09, { size: 10.5, color: on ? 'green' : 'muted', align: 'right', baseline: 'top' });
            });
            const xW = 0.02 + (load.value - 0.5) * (0.96 / 130); B.line(xW, 0.0, xW, 0.92, { color: 'orange', width: 1.5, dash: [4, 3] });
            B.text('loads 1 → 130 units', 0.5, 0.0, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
          } else {
            const a = heavy.value ? 0.35 : 0.8, x = cp.x;
            // load fixed for the picture: the load that would balance at the current mark
            const Wbal = (wC * x + Mb * cB) / a;
            const Wshow = heavy.value ? 12 : 5; // a fixed sack (kg) hanging on the hook
            const tau = wC * x + Mb * cB - Wshow * a, th = clamp(Math.atan(tau / 6), -0.25, 0.25);
            const P = (u) => [u * Math.cos(th), 0.3 + u * Math.sin(th)];
            A.line(-5.8, -3.0, 5.8, -3.0, { color: 'muted', width: 1 });
            A.line(0, 0.3, 0, 2.6, { color: 'muted', width: 1.4 }); A.dot(0, 0.3, { r: 4, color: 'ink' });
            const e1 = P(-1.2), e2 = P(5.6); A.line(e1[0], e1[1], e2[0], e2[1], { color: 'ink', width: 4 });
            // graduations: load that balances with the counterpoise at u
            for (let Wg = 0; Wg <= 30; Wg += heavy.value ? 1 : 0.5) { const u = (Wg * a - Mb * cB) / wC; if (u < 1.0 || u > 5.4) continue; const p = P(u); A.line(p[0], p[1] - 0.12, p[0], p[1] + 0.12, { color: 'ink', width: 1 }); if (Wg % (heavy.value ? 2 : 1) === 0) A.text(`${Wg}`, p[0], p[1] - 0.2, { size: 9.5, color: 'muted', align: 'center', baseline: 'top' }); }
            const hk = P(-a); A.line(hk[0], hk[1], hk[0], hk[1] - 1.2, { color: 'muted', width: 1.2 });
            A.poly([[hk[0] - 0.55, hk[1] - 1.2], [hk[0] + 0.55, hk[1] - 1.2], [hk[0] + 0.75, hk[1] - 2.5], [hk[0] - 0.75, hk[1] - 2.5]], { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.4 });
            A.text(`${v.fix(Wshow, 1)} kg`, hk[0], hk[1] - 1.85, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
            const pc = P(x); cp.set(x, 0.3); A.line(pc[0], pc[1], pc[0], pc[1] - 0.8, { color: 'gold', width: 1.2 }); A.circle(pc[0], pc[1] - 1.05, 0.25, { fill: 'gold', fillAlpha: 0.7, color: 'gold', width: 1.2 });
            const ok = Math.abs(tau) < 0.15;
            A.corner(ok ? `balanced: reads ${v.fix(Wbal, 1)} kg` : `${tau > 0 ? 'long arm down' : 'load side down'}: mark reads ${v.fix(Wbal, 1)} kg`, 'tl', { color: ok ? 'green' : 'red', weight: 700, plate: true });
            // B: reading vs position, both hooks
            B.text('reading = (w·x + M_b·c) / a', 0.5, 0.94, { size: 12, color: 'ink', align: 'center' });
            const X0 = 0.1, X1 = 0.95, Y0 = 0.1, Y1 = 0.82, Wmax = 25;
            B.line(X0, Y0, X1, Y0, { color: 'muted', width: 1 }); B.line(X0, Y0, X0, Y1, { color: 'muted', width: 1 });
            for (const [aa, col, lab] of [[0.8, 'accent', 'light hook'], [0.35, 'purple', 'heavy hook']]) {
              const pts = []; for (let u = 1; u <= 5.4; u += 0.1) pts.push([X0 + (X1 - X0) * (u / 5.4), Y0 + (Y1 - Y0) * Math.min(1, ((wC * u + Mb * cB) / aa) / Wmax)]);
              B.path(pts, { color: col, width: (aa === a) ? 2.6 : 1.3 }); const last = pts[pts.length - 1]; B.text(lab, Math.min(last[0], 0.93), Math.min(last[1], 0.8) + 0.02, { size: 10.5, color: col, align: 'right', baseline: 'bottom' });
            }
            B.dot(X0 + (X1 - X0) * (x / 5.4), Y0 + (Y1 - Y0) * Math.min(1, Wbal / Wmax), { r: 5, color: 'gold' });
            B.text('counterpoise position', (X0 + X1) / 2, 0.02, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
            B.text(`0–${Wmax} kg`, X0 + 0.01, Y1, { size: 10, color: 'muted', align: 'left', baseline: 'top' });
          }
          drawYears(v, C, [
            { t: -2600, label: 'Sneferu’s weights, Egypt' },
            { t: [-2400, -1800], label: 'Indus binary cubes', color: 'green' },
            { t: [-2300, -800], label: 'shared 8–10.5 g units, Britain to Mesopotamia' },
            { t: [-500, -300], label: 'Greek steelyard', contested: true },
            { t: [-400, -200], label: 'Chu balance, China' },
            { t: 79, label: 'steelyards at Pompeii' },
            { t: 1202, label: 'Fibonacci’s weight problem', color: 'purple' },
            { t: 1612, label: 'Bachet: powers of three', color: 'purple' },
          ], { lanes: 4, ticks: [-2500, -2000, -1500, -1000, -500, 1, 500, 1000, 1500] });
        });
        v.legend([['orange', 'load'], ['accent', 'weights / light hook'], ['purple', 'weights on the load pan / heavy hook'], ['gold', 'counterpoise', { dot: true }]]);
        v.readout(() => {
          if (mode.value === 'bal') { const W = load.value, s = SETS[set.value], sol = solve(set.value, W), n = s.w.length; return `load ${W} units (${v.fix(W * UNIT, 1)} g with the Harappan unit of ${UNIT} g) · ${sol.ok ? `**${sol.right.length + sol.left.length} weights** used` : '**not possible with this set**'} · ${n} weights can make at most ${s.two ? `$(3^{${n}}-1)/2 = ${(3 ** n - 1) / 2}$` : `$2^{${n}}-1 = ${2 ** n - 1}$`} loads`; }
          const a = heavy.value ? 0.35 : 0.8, x = cp.x, W = (wC * x + Mb * cB) / a;
          return `moments: $W a = w x + M_b c$ with $w$ = ${wC} kg, $M_b$ = ${Mb} kg at $c$ = ${cB} dm, hook $a$ = ${a} dm → counterpoise at ${v.fix(x, 2)} dm balances **${v.fix(W, 2)} kg**, ${v.fix(W / wC, 1)} times its own weight · graduations every ${v.fix(a / wC, 2)} dm per kg, evenly spaced (illustrative dimensions)`;
        });
      },
    },
  ],
};
