// Microeconomics — Chapter 1 (papers): Smith, The Wealth of Nations (1776); Ricardo, Principles (1817)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const fmtInt = (x) => Math.round(x).toLocaleString('en-US');
const texInt = (x) => fmtInt(x).replace(/,/g, '{,}');

// ── Smith's pin factory (Wealth of Nations, Book I, ch. 1) ──
// The operations Smith names, in his order; he says the trade is divided into "about eighteen distinct operations"
// but itemises only these eleven (the head takes "two or three"; three are counted here).
const PIN_OPS = ['draw out the wire', 'straighten it', 'cut it', 'point it', 'grind the top', 'make the head (1)', 'make the head (2)', 'make the head (3)', 'put the head on', 'whiten the pins', 'put them into the paper'];
const NOPS = 18;
// Smith does not apportion the gain among his three causes; this split of the exponent is illustrative only.
const CAUSES = [{ key: 'dex', label: 'dexterity', share: 0.45 }, { key: 'time', label: 'no time lost passing between tasks', share: 0.25 }, { key: 'mach', label: 'machines', share: 0.3 }];
/** Operations 1..18 split into n contiguous groups as evenly as possible → [[first, last], …] (0-based). */
function splitOps(n) { const out = []; let a = 0; for (let k = 0; k < n; k++) { const len = Math.floor(NOPS / n) + (k < NOPS % n ? 1 : 0); out.push([a, a + len - 1]); a += len; } return out; }

// ── Ricardo's example (chapter "On Foreign Trade"): labour of men for one year per unit ──
const RIC = { cE: 100, wE: 120, cP: 90, wP: 80 };
const LAB = { E: 220, P: 170 }; // each country's labour force in Ricardo's example: enough for one unit of each good

export default {
  collection: 'micro',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Paper',
      name: 'The Wealth of Nations',
      paper: { authors: 'Adam Smith', year: 1776, title: 'An Inquiry into the Nature and Causes of the Wealth of Nations', venue: 'London: W. Strahan and T. Cadell (2 vols)', url: 'https://www.gutenberg.org/ebooks/3300' },
      introduces: ['micro-1.7'],
      credit: 'Adam Smith, 1776',
      statement: String.raw`Smith argued that the wealth of a nation is the annual produce of its labour, and that the greatest improvement in the productive powers of labour comes from the **division of labour**. His example (Book I, ch. 1) is a pin manufactory: a workman doing everything himself "could scarce, perhaps, with his utmost industry, make one pin in a day, and certainly could not make twenty", whereas in a small shop where the trade was split into "about eighteen distinct operations" ten men made "about twelve pounds of pins in a day", upwards of 4,000 to the pound — over **48,000** pins, or **4,800** per person. He traced the gain to three causes: greater dexterity of each worker, the saving of the time lost in passing from one task to another, and the invention of machines by people focused on one operation; and he argued (ch. 3) that how far the division can go is limited by the extent of the market. The same logic extends to nations (Book IV, ch. 2): "If a foreign country can supply us with a commodity cheaper than we ourselves can make it, better buy it of them" — trade by **absolute advantage** (micro-1.7).`,
      idea: String.raw`Before Smith, mercantilist writers identified national wealth with the stock of gold and silver and recommended export surpluses, protected monopolies and regulated trades. Smith moved attention to production: specialization raises output per worker, exchange lets specialists obtain what they do not make, and markets coordinate many specialists without central direction — the "invisible hand" of Book IV. The pin factory, drawn from contemporary descriptions of the French trade, became the emblem of the argument; the numbers are Smith's report of one small shop, not a measurement, and they bound the gain only loosely (at least 240-fold, perhaps 4,800-fold). Book IV's case for buying abroad whatever is cheaper there rests on **absolute** costs (micro-1.7); forty years later Ricardo showed that comparative costs are what matter (micro-1.13, micro-1.8). Economists now add learning-by-doing, scale economies and the coordination costs that limit the division of labour inside firms, but Smith's link between specialization, market size and productivity remains the starting point of growth and trade theory.`,
      caption: String.raw`The shop: slide the number of workers and watch the eighteen operations (top row, numbered; the first eleven are the ones Smith names) shared out among them, while pins travel down the line and the counter runs through a ten-hour day. Right: pins per day against the number of workers on a log scale. The two gold points are **Smith's numbers** — a lone untrained worker (between 1 and 20 pins; set it with the slider) and his ten men with 48,000. The blue curve in between is an *illustrative* model, output $\propto n^{1+\gamma}$, calibrated to pass through Smith's two points; switch off his three causes one by one to see how much of the gain each carries in the model (Smith gives no split). The dashed line is the market: when it is small, there is no point in dividing the work finely.`,
      deps: [],
      see: ['micro-1.9', 'micro-1.13'],
      refs: [],
      tags: ['division of labour', 'specialization', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/The_Wealth_of_Nations' },
      viz(v) {
        const nS = v.slider('workers $n$', 1, 10, 10, { int: true });
        const lone = v.slider('lone worker’s pins a day', 1, 20, 20, { int: true });
        const mkt = v.slider('market: pins sold a day', 100, 1e5, 1e5, { log: true, fmt: (x) => fmtInt(x) });
        const tg = CAUSES.map((c) => v.toggle(c.label, true));
        const F = v.stage({ x: [-0.2, 10.4], y: [-2.05, 3.35], axes: false, height: 330, weight: 1.3, minWidth: 330, title: 'the pin shop' });
        const G = v.stage({ x: [0.6, 10.6], y: [0.5, 1.5e6], ylog: true, axes: 'box', height: 330, weight: 1, minWidth: 270, xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], xlabel: 'workers n', title: 'pins made in a day' });
        const model = () => {
          const L = lone.value, gFull = Math.log(48000 / (10 * L)) / Math.log(10); // per-worker gain 4800/L at n = 10
          const g = CAUSES.reduce((s, c, i) => s + (tg[i].value ? c.share * gFull : 0), 0);
          return { L, gFull, g, out: (n) => L * n * n ** g };
        };
        v.animate((t) => {
          const n = nS.value, mo = model(), out = mo.out(n), groups = splitOps(n), DAY = 8;
          const hour = Math.min(10, (t / DAY) * 10), made = Math.min(out, (out * hour) / 10);
          // operations strip
          const ow = 10 / NOPS;
          for (let k = 0; k < NOPS; k++) {
            const wk = groups.findIndex(([a, b]) => k >= a && k <= b), x0 = k * ow + 0.02;
            const col = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'accent', 'muted'][wk % 10];
            F.rect(x0, 2.45, x0 + ow - 0.06, 3.0, { fill: col, fillAlpha: k < PIN_OPS.length ? 0.45 : 0.2, color: col, width: 1.1, dash: k < PIN_OPS.length ? null : [3, 2] });
            F.text(String(k + 1), x0 + ow / 2 - 0.03, 2.72, { size: 10, color: 'ink', align: 'center' });
          }
          F.text('the eighteen operations (1–11 named by Smith, 12–18 not itemised)', 0, 3.22, { size: 10.5, color: 'muted' });
          // workers and the line
          F.line(0.1, 0.55, 10.1, 0.55, { color: 'faint', width: 6 });
          groups.forEach(([a, b], k) => {
            const cx = ((a + b + 1) / 2) * ow, col = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'accent', 'muted'][k % 10];
            F.line(cx, 2.42, cx, 1.35, { color: col, width: 1, dash: [2, 3] });
            F.dot(cx, 1.05, { r: n > 6 ? 9 : 12, color: col, alpha: 0.85 });
            F.text(a === b ? `${a + 1}` : `${a + 1}–${b + 1}`, cx, 0.12, { size: n > 7 ? 9.5 : 10.5, color: 'muted', align: 'center' });
          });
          // pins moving down the line: more and faster when the shop is more productive
          const lg = Math.log10(out), np = clamp(Math.round(lg * 3), 2, 16), sp = 0.08 + lg * 0.05;
          for (let k = 0; k < np; k++) { const u = (((t * sp + k / np) % 1) + 1) % 1; F.dot(0.15 + u * 9.9, 0.55, { r: 3, color: 'gold' }); }
          F.text(n === 1 ? 'one man does every operation' : `${n} men, ${groups.map(([a, b]) => b - a + 1).join(' + ')} operations`, 0, -0.45, { size: 11.5, color: 'ink' });
          F.text('1 draw out the wire · 2 straighten it · 3 cut it · 4 point it · 5 grind the top ·', 0, -1.05, { size: 10, color: 'muted' });
          F.text('6–8 make the head · 9 put it on · 10 whiten the pins · 11 put them into the paper', 0, -1.45, { size: 10, color: 'muted' });
          F.text(`hour ${v.fix(hour, 1)} of 10 · ${fmtInt(made)} pins`, 10.3, -0.45, { size: 11.5, color: 'ink', weight: 700, align: 'right' });
          // chart
          const M = mkt.value;
          G.hband(M, 2e6, { color: 'red', alpha: 0.06 });
          G.hline(M, { color: 'red', width: 1.6, dash: [6, 4] });
          G.text('market: more would not sell', 0.75, M * 1.5, { size: 10.5, color: 'red', align: 'left' });
          G.fn((x) => mo.L * x, { domain: [1, 10], color: 'muted', width: 1.4, dash: [3, 4] });
          const full = (x) => mo.L * x * x ** mo.gFull;
          G.fn(full, { domain: [1, 10], color: 'accent', width: 1, alpha: 0.4 });
          G.fn((x) => mo.out(x), { domain: [1, 10], color: 'accent', width: 2.4 });
          for (let k = 1; k <= 10; k++) G.dot(k, mo.out(k), { r: k === n ? 6 : 3, color: k === n ? 'accent' : 'accent', hollow: k !== n });
          G.dot(1, mo.L, { r: 6.5, color: 'gold' }); G.dot(10, 48000, { r: 6.5, color: 'gold' });
          G.text('Smith: 10 men, 48,000', 9.7, 48000 / 2.4, { size: 10.5, color: 'gold', align: 'right', weight: 600 });
          G.text('Smith: one man', 1.25, mo.L * 0.5, { size: 10.5, color: 'gold', align: 'left', weight: 600 });
          G.text('no division gains', 10.4, mo.L * 10 * 0.55, { size: 10, color: 'muted', align: 'right' });
        }, { period: 9, still: 8.5 });
        v.legend([['gold', 'Smith’s numbers', { dot: true }], ['accent', 'illustrative model'], ['muted', 'n × lone worker', { dash: true }], ['red', 'market size', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, mo = model(), out = mo.out(n), M = mkt.value;
          let useful = 11; for (let k = 10; k >= 1; k--) if (mo.out(k) >= M) useful = k;
          const parts = CAUSES.map((c, i) => `${c.label} ×${v.fix(10 ** (c.share * mo.gFull), 1)}${tg[i].value ? '' : ' (off)'}`).join(', ');
          return `${n} worker${n > 1 ? 's' : ''}: ${fmtInt(out)} pins a day, ${fmtInt(out / n)} each — ${v.fix(out / n / mo.L, 1)} times the lone worker · Smith: 12 lb × 4,000 pins = 48,000 for ten men, 4,800 each, working alone they could make "certainly, not the two hundred and fortieth, perhaps not the four thousand eight hundredth, part" of that (with ${mo.L} pins each: 1/${fmtInt(4800 / mo.L)}) · model gain at ten workers split as ${parts} (illustrative) · a market of ${fmtInt(M)} pins a day ${useful > 10 ? 'absorbs the whole output of the ten-man shop' : `is already supplied by ${useful} worker${useful > 1 ? 's' : ''}: dividing the work more finely would only make unsold pins`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Paper',
      name: 'On the Principles of Political Economy and Taxation',
      paper: { authors: 'David Ricardo', year: 1817, title: 'On the Principles of Political Economy, and Taxation', venue: 'London: John Murray', url: 'https://www.gutenberg.org/ebooks/33310' },
      introduces: ['micro-1.8', 'micro-1.11'],
      credit: 'David Ricardo, 1817',
      statement: String.raw`In the chapter "On Foreign Trade" (chapter VI of the 1817 edition, whose numbering repeats a V; chapter 7 from the third edition) Ricardo showed that two countries gain from trade even when one of them is more efficient at producing everything. In his example England needs the labour of 100 men for a year to make a quantity of cloth and 120 for a quantity of wine; Portugal needs 90 for the cloth and 80 for the wine. Portugal is better at both, yet wine costs Portugal only $80/90\approx 0.89$ of the cloth while it costs England $120/100 = 1.2$ cloth, so England should export cloth and import wine and Portugal the reverse: "England would give the produce of the labour of 100 men for the produce of the labour of 80" — each country obtains its import with less labour than making it at home would take. In modern terms: with labour the only cost and labour immobile between countries, specialization according to **comparative advantage** raises both countries' consumption whenever the terms of trade lie between the two autarky price ratios, and there is nothing to gain when the ratios are equal (micro-1.8, micro-1.11).`,
      idea: String.raw`Smith had argued for buying abroad what is cheaper abroad (micro-1.12), which leaves open what happens to a country that is less efficient at everything. Ricardo's answer turns on opportunity cost: England's labour is not wasted on cloth merely because Portugal could make cloth more cheaply, because what matters is what each country gives up. The argument needs labour (or capital) not to move between countries — Ricardo stressed that capital stays at home from attachment and insecurity — since otherwise production would simply relocate to Portugal. His four numbers, written in a few lines in a book mostly about rent, wages and taxation, became the most famous example in economics; later readers (Mill, Torrens' priority claim, the modern "four magic numbers" debate) formalized the terms of trade and the world frontier (micro-1.11). The principle survives as a theorem of the two-good Ricardian model; real trade patterns also reflect factor endowments, scale economies and policy, and gains are unevenly distributed within each country.`,
      caption: String.raw`**Drag the four ends of the frontiers** (England blue, 220 man-years; Portugal orange, 170 man-years — the labour each needs for one unit of each good): the cloth end sits at $L/a_{\text{cloth}}$, the wine end at $L/a_{\text{wine}}$, so dragging changes Ricardo's labour costs, shown in the table. The slider sets the terms of trade. Left: the ledger, in Ricardo's own unit — the man-years each country needs for its import if it makes it at home (grey) or buys it with its export (green when cheaper, red when dearer). Right: each country specializes at one end of its frontier and trades one unit of wine at the chosen price; the gold consumption points lie beyond both frontiers. Make the two cost ratios equal and the gains vanish; move the price outside the band between them and one side loses.`,
      deps: ['micro-1.12', 'micro-1.7'],
      see: ['micro-1.9', 'micro-1.10'],
      refs: [],
      tags: ['trade', 'comparative advantage', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Comparative_advantage' },
      viz(v) {
        const pS = v.slider('terms of trade $p$: cloth per unit of wine', 0.6, 1.6, 1, { step: 0.01 });
        v.button('Ricardo’s numbers', () => { cE.set(LAB.E / RIC.cE, 0); wE.set(0, LAB.E / RIC.wE); cP.set(LAB.P / RIC.cP, 0); wP.set(0, LAB.P / RIC.wP); pS.set(1); });
        const T = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 360, weight: 1, minWidth: 300, title: 'Ricardo’s table and the labour ledger' });
        const P = v.stage({ x: [-0.05, 2.75], y: [-0.05, 2.6], equal: true, axes: 'box', height: 360, weight: 1, minWidth: 300, xlabel: 'cloth', ylabel: 'wine', title: 'frontiers, specialization and trade' });
        const lim = { x: [0.55, 2.7], y: [0.55, 2.5] };
        const cE = P.handle(LAB.E / RIC.cE, 0, { color: 'blue', constrain: (x) => [clamp(x, ...lim.x), 0] });
        const wE = P.handle(0, LAB.E / RIC.wE, { color: 'blue', constrain: (x, y) => [0, clamp(y, ...lim.y)] });
        const cP = P.handle(LAB.P / RIC.cP, 0, { color: 'orange', constrain: (x) => [clamp(x, ...lim.x), 0] });
        const wP = P.handle(0, LAB.P / RIC.wP, { color: 'orange', constrain: (x, y) => [0, clamp(y, ...lim.y)] });
        const costs = () => ({ cE: LAB.E / cE.x, wE: LAB.E / wE.y, cP: LAB.P / cP.x, wP: LAB.P / wP.y });
        const analysis = () => {
          const a = costs(), p = pS.value, rE = a.wE / a.cE, rP = a.wP / a.cP; // wine's cost in cloth at home
          const same = Math.abs(rE - rP) < 0.005;
          const pWine = rP < rE ? 'P' : 'E';                      // who exports wine
          // man-years to obtain one unit of the import: at home vs by trading the export at price p
          const E = pWine === 'P' ? { imp: 'wine', home: a.wE, trade: p * a.cE } : { imp: 'cloth', home: a.cE, trade: a.wE / p };
          const Pp = pWine === 'P' ? { imp: 'cloth', home: a.cP, trade: a.wP / p } : { imp: 'wine', home: a.wP, trade: p * a.cP };
          return { a, p, rE, rP, same, pWine, E, P: Pp };
        };
        v.render(() => {
          const A = analysis(), { a, p } = A;
          // ---- Ricardo's table
          const row = (y, name, col, c, w, r) => {
            T.text(name, 0.2, y, { size: 13, color: col, weight: 700 });
            T.text(String(Math.round(c)), 4.0, y, { size: 13, color: 'ink', align: 'center' });
            T.text(String(Math.round(w)), 5.9, y, { size: 13, color: 'ink', align: 'center' });
            T.text(v.fix(r, 2), 8.4, y, { size: 13, color: 'ink', align: 'center' });
          };
          T.text('men for a year', 4.95, 9.55, { size: 10.5, color: 'muted', align: 'center' });
          T.text('cloth', 4.0, 9.0, { size: 11.5, color: 'muted', align: 'center' }); T.text('wine', 5.9, 9.0, { size: 11.5, color: 'muted', align: 'center' });
          T.text('1 wine costs', 8.4, 9.55, { size: 10.5, color: 'muted', align: 'center' }); T.text('(cloth)', 8.4, 9.0, { size: 11.5, color: 'muted', align: 'center' });
          T.line(0.1, 8.65, 9.9, 8.65, { color: 'grid', width: 1 });
          row(8.1, 'England', 'blue', a.cE, a.wE, A.rE); row(7.2, 'Portugal', 'orange', a.cP, a.wP, A.rP);
          if (!A.same) { // comparative advantage cells
            const yE = 8.1, yP = 7.2, eC = A.pWine === 'P';
            T.rect(eC ? 3.4 : 5.3, yE - 0.38, eC ? 4.6 : 6.5, yE + 0.38, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.1 });
            T.rect(eC ? 5.3 : 3.4, yP - 0.38, eC ? 6.5 : 4.6, yP + 0.38, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.1 });
          }
          T.text(A.same ? 'equal cost ratios: no comparative advantage' : 'green: the good each country should export', 0.2, 6.35, { size: 11, color: A.same ? 'red' : 'green' });
          // ---- ledger
          const sc = 5.6 / 160, X0 = 3.6;
          T.text('man-years for one unit of the import', 0.2, 5.55, { size: 11.5, color: 'ink', weight: 600 });
          [['E', 'England', 'blue', A.E, 4.55], ['P', 'Portugal', 'orange', A.P, 2.35]].forEach(([k, name, col, L, y]) => {
            T.text(`${name} buys ${L.imp}`, 0.2, y + 0.45, { size: 11, color: col, weight: 600 });
            T.text('made at home', X0 - 0.15, y, { size: 10.5, color: 'muted', align: 'right' });
            T.rect(X0, y - 0.28, X0 + L.home * sc, y + 0.28, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1 });
            T.text(v.fix(L.home, 0), X0 + L.home * sc + 0.12, y, { size: 10.5, color: 'ink' });
            const good = L.trade < L.home - 1e-9 && !A.same, gc = A.same ? 'muted' : good ? 'green' : 'red';
            T.text('by trade', X0 - 0.15, y - 0.75, { size: 10.5, color: 'muted', align: 'right' });
            T.rect(X0, y - 1.03, X0 + Math.min(L.trade, 200) * sc, y - 0.47, { fill: gc, fillAlpha: 0.45, color: gc, width: 1 });
            T.text(`${v.fix(L.trade, 0)}  (${good ? 'saves' : 'costs'} ${v.fix(Math.abs(L.home - L.trade), 1)})`, X0 + Math.min(L.trade, 200) * sc + 0.12, y - 0.75, { size: 10.5, color: gc });
          });
          T.text(`band where both gain: ${v.fix(Math.min(A.rE, A.rP), 2)} < p < ${v.fix(Math.max(A.rE, A.rP), 2)}`, 0.2, 0.4, { size: 11, color: A.same ? 'red' : p > Math.min(A.rE, A.rP) && p < Math.max(A.rE, A.rP) ? 'green' : 'red' });
          // ---- frontiers
          P.segment([cE.x, 0], [0, wE.y], { color: 'blue', width: 2.4 });
          P.segment([cP.x, 0], [0, wP.y], { color: 'orange', width: 2.4 });
          P.text('England', cE.x * 0.88 + 0.06, wE.y * 0.12 + 0.24, { size: 11, color: 'blue', weight: 600 });
          P.text('Portugal', cP.x * 0.12 + 0.08, wP.y * 0.88 + 0.08, { size: 11, color: 'orange', weight: 600 });
          // autarky points: equal amounts of both goods
          const xE = LAB.E / (a.cE + a.wE), xP = LAB.P / (a.cP + a.wP);
          P.dot(xE, xE, { r: 4.5, color: 'blue', hollow: true }); P.dot(xP, xP, { r: 4.5, color: 'orange', hollow: true });
          if (!A.same) {
            // specialization and the exchange of one unit of wine for p cloth
            const ex = A.pWine === 'P'
              ? { E: [cE.x, 0], P: [0, wP.y], cE: [cE.x - p, 1], cP: [p, wP.y - 1] }
              : { E: [0, wE.y], P: [cP.x, 0], cE: [p, wE.y - 1], cP: [cP.x - p, 1] };
            P.rect(ex.E[0] - 0.035, ex.E[1] - 0.035, ex.E[0] + 0.035, ex.E[1] + 0.035, { fill: 'blue', fillAlpha: 1, stroke: false });
            P.rect(ex.P[0] - 0.035, ex.P[1] - 0.035, ex.P[0] + 0.035, ex.P[1] + 0.035, { fill: 'orange', fillAlpha: 1, stroke: false });
            P.arrow(ex.E[0], ex.E[1], ex.cE[0], ex.cE[1], { color: 'blue', width: 1.4, dash: [4, 3], head: 7 });
            P.arrow(ex.P[0], ex.P[1], ex.cP[0], ex.cP[1], { color: 'orange', width: 1.4, dash: [4, 3], head: 7 });
            P.dot(...ex.cE, { r: 6, color: 'gold' }); P.dot(...ex.cP, { r: 6, color: 'gold' });
            P.text('England consumes', ex.cE[0] + 0.06, ex.cE[1] + 0.1, { size: 10.5, color: 'blue', align: 'left' });
            P.text('Portugal consumes', ex.cP[0] + 0.06, ex.cP[1] + 0.1, { size: 10.5, color: 'orange', align: 'left' });
          }
        });
        v.legend([['blue', 'England'], ['orange', 'Portugal'], ['gold', 'consumption with trade', { dot: true }], ['muted', 'autarky (equal amounts)', { dot: true }]]);
        v.readout(() => {
          const A = analysis(), { a, p } = A;
          if (A.same) return `wine costs ${v.fix(A.rE, 3)} cloth in England and ${v.fix(A.rP, 3)} in Portugal: equal ratios, so no exchange saves anyone labour — the gains from trade vanish`;
          const wx = A.pWine === 'P' ? 'Portugal' : 'England', cx = A.pWine === 'P' ? 'England' : 'Portugal';
          const worldC = A.pWine === 'P' ? cE.x : cP.x, worldW = A.pWine === 'P' ? wP.y : wE.y;
          const xE = LAB.E / (a.cE + a.wE), xP = LAB.P / (a.cP + a.wP);
          return `wine costs ${v.fix(A.rE, 2)} cloth in England (${Math.round(a.wE)}/${Math.round(a.cE)}) and ${v.fix(A.rP, 2)} in Portugal (${Math.round(a.wP)}/${Math.round(a.cP)}) → ${wx} exports wine, ${cx} cloth · at $p = ${v.fix(p, 2)}$: England obtains ${A.E.imp} with ${v.fix(A.E.trade, 1)} man-years instead of ${v.fix(A.E.home, 1)}, Portugal ${A.P.imp} with ${v.fix(A.P.trade, 1)} instead of ${v.fix(A.P.home, 1)}` +
            ` · the same 390 man-years make ${v.fix(xE + xP, 2)} cloth + ${v.fix(xE + xP, 2)} wine without trade and ${v.fix(worldC, 3)} cloth + ${v.fix(worldW, 3)} wine with full specialization` + (Math.abs(a.cE - 100) + Math.abs(a.wE - 120) + Math.abs(a.cP - 90) + Math.abs(a.wP - 80) < 1.5 && Math.abs(p - 1) < 0.005 ? ' — Ricardo: "England would give the produce of the labour of 100 men for the produce of the labour of 80"' : '');
        });
      },
    },
  ],
};
