// Microeconomics — Chapter 1: Scarcity, opportunity cost and the gains from trade

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// Piecewise-linear frontier of linear producers {F, C} (full-time outputs): food is made first by the
// producers listed in `order`, so the vertices run from (0, ΣC) to (ΣF, 0).
function chain(prods, order) {
  let x = 0, y = prods.reduce((t, p) => t + p.C, 0); const pts = [[x, y]];
  for (const i of order) { x += prods[i].F; y -= prods[i].C; pts.push([x, y]); }
  return pts;
}
function onChain(pts, x) {
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0] + 1e-12) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return pts[pts.length - 1][1];
}
const PERSON = { Ana: 'blue', Ben: 'orange' };

export default {
  collection: 'micro',
  chapter: 1,
  title: 'Scarcity, opportunity cost and the gains from trade',
  summary: String.raw`Economics begins with the observation that time, labour and materials are limited, so every choice gives something up. The production possibility frontier turns that trade-off into a curve whose slope is an opportunity cost. Comparing opportunity costs across people or countries yields Ricardo's insight: if each specializes where its comparative advantage lies and trades, everyone can consume beyond what they could produce alone.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Concept', name: 'Scarcity and choice',
      statement: String.raw`A resource is **scarce** when the uses people would like to put it to need more of it than there is. Then the possible plans form a bounded set: more of one use means less of some other, and choosing is unavoidable. If the resource were unlimited, every want could be met to the point of satiation at the same time, and there would be nothing to give up and nothing to choose.`,
      idea: String.raw`With a fixed endowment (here 60 hours a week) the feasible plans satisfy $h_{\text{study}} + h_{\text{work}} + h_{\text{rest}} \le 60$, a triangle. Whenever the satiation levels of the uses add up to more than the endowment, the best plan lies on the edge of that triangle, where every hour is spoken for; moving along the edge trades one use against another. Remove the bound and the triangle becomes the whole quadrant, and the best plan is simply each use at its own satiation point.`,
      caption: String.raw`Drag the plan inside the triangle of feasible weeks (rest is whatever is left of the 60 hours). The shading shows total benefit; the green dot is the best plan, found by searching the triangle. Switch on **unlimited time**: the boundary disappears and every activity can sit at its satiation point at once.`,
      deps: [], refs: ['Mankiw Ch. 1', 'CORE Unit 3'], tags: ['scarcity'],
      credit: 'Lionel Robbins, 1932 (economics as the study of scarce means)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Scarcity' },
      viz(v) {
        const H = 60, B = { s: 30, w: 35, r: 45 };
        const u = (h, b) => { const t = clamp(h, 0, b) / b; return 1 - (1 - t) * (1 - t); };
        const total = (s, w, r) => u(s, B.s) + u(w, B.w) + u(r, B.r);
        let best = { s: 0, w: 0, U: -1 };
        for (let s = 0; s <= H; s += 0.25) for (let w = 0; w <= H - s + 1e-9; w += 0.25) { const U = total(s, w, H - s - w); if (U > best.U) best = { s, w, U }; }
        const proj = (x, y) => { x = clamp(x, 0, 68); y = clamp(y, 0, 68); if (x + y > H) { const e = (x + y - H) / 2; x -= e; y -= e; if (x < 0) { y += x; x = 0; } if (y < 0) { x += y; y = 0; } } return [x, y]; };
        const free = v.toggle('unlimited time', false, { onChange: (on) => { if (!on) { const [x, y] = proj(P.x, P.y); P.set(x, y); } } });
        const s = v.stage({ x: [0, 78], y: [0, 70], height: 330, axes: 'box', xlabel: 'study (h)', ylabel: 'work (h)', title: 'possible plans for one week' });
        const b = v.stage({ x: [-17, 122], y: [0, 4.7], height: 330, axes: false, title: 'where the hours go' });
        const P = s.handle(12, 34, { color: 'gold', label: 'plan', constrain: (x, y) => (free.value ? [clamp(x, 0, 68), clamp(y, 0, 68)] : proj(x, y)) });
        const cols = { s: 'blue', w: 'orange', r: 'purple' };
        v.legend([['gold', 'your plan', { dot: true }], ['green', 'best plan', { dot: true }], ['muted', 'satiation point', { dash: true }]]);
        v.render(() => {
          const lim = !free.value, rest = lim ? H - P.x - P.y : B.r, tc = v.rgb('teal');
          s.raster((x, y) => { if (lim && x + y > H) return null; const t = total(x, y, lim ? H - x - y : B.r) / 3; return [tc[0], tc[1], tc[2], 255 * (0.03 + 0.45 * t ** 5)]; }, { key: lim ? 'lim' : 'free', res: 3 });
          if (lim) {
            for (const r of [10, 20, 30, 40, 50]) { s.line(0, H - r, H - r, 0, { color: 'faint', width: 1, dash: [3, 4] }); s.text(`rest ${r}`, (H - r) * 0.7, (H - r) * 0.3, { color: 'muted', size: 10.5, align: 'center', dy: -2 }); }
            s.line(0, H, H, 0, { color: 'green', width: 2.4 }); s.text('all 60 h used', 44, 18, { color: 'green', size: 12, dx: 6 });
          } else s.corner('no time constraint', 'tr', { color: 'muted' });
          const bs = lim ? best.s : B.s, bw = lim ? best.w : B.w;
          s.dot(bs, bw, { r: 5, color: 'green', label: 'best', labelPos: 'e' });
          s.line(P.x, 0, P.x, P.y, { color: 'muted', dash: [3, 3], width: 1 }); s.line(0, P.y, P.x, P.y, { color: 'muted', dash: [3, 3], width: 1 });
          // bars
          const rows = [['study', 's', P.x, 3.85], ['work', 'w', P.y, 2.85], ['rest', 'r', rest, 1.85]];
          for (const [name, k, h, y] of rows) {
            b.text(name, -3, y, { align: 'right', baseline: 'middle', color: cols[k], size: 12.5 });
            b.rect(0, y - 0.27, h, y + 0.27, { fill: cols[k], fillAlpha: 0.55, stroke: false });
            b.line(B[k], y - 0.42, B[k], y + 0.42, { color: 'muted', dash: [3, 3], width: 1.2 });
            b.text(`${v.fix(h, 1)} h`, Math.max(h, B[k]), y, { dx: 6, baseline: 'middle', color: 'ink', size: 11.5 });
          }
          const yW = 0.7; let x0 = 0;
          b.text('week', -3, yW, { align: 'right', baseline: 'middle', color: 'ink', size: 12.5, weight: 600 });
          for (const [, k, h] of rows) { b.rect(x0, yW - 0.3, x0 + h, yW + 0.3, { fill: cols[k], fillAlpha: 0.6, color: 'panel', width: 1 }); x0 += h; }
          b.line(H, 0.18, H, 1.25, { color: lim ? 'red' : 'faint', width: lim ? 3 : 1.5, dash: lim ? null : [4, 3] });
          b.text(lim ? '60 h available' : 'no limit', H, 1.25, { dy: -8, align: 'center', color: lim ? 'red' : 'muted', size: 11 });
          b.line(0, 0.1, 0, 4.4, { color: 'faint', width: 1 });
        });
        v.readout(() => {
          const f = (x) => v.fix(x, 1), lim = !free.value, rest = lim ? H - P.x - P.y : B.r, U = total(P.x, P.y, rest);
          if (lim) return `study ${f(P.x)} h + work ${f(P.y)} h + rest ${f(rest)} h = **60 h**: an extra hour for one activity must come out of another. Total benefit ${v.fix(U, 3)} of a possible 3 · best plan under the limit (${f(best.s)}, ${f(best.w)}, ${f(H - best.s - best.w)}) h with benefit ${v.fix(best.U, 3)} — the satiation levels 30 + 35 + 45 = 110 h do not fit into 60.`;
          return `study ${f(P.x)} h + work ${f(P.y)} h + rest 45 h = ${f(P.x + P.y + 45)} h. With unlimited time each activity can sit at its satiation point (30, 35, 45 h) at once, for the maximal benefit 3.000 — nothing is given up, so there is nothing to choose.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Concept', name: 'Opportunity cost',
      statement: String.raw`The **opportunity cost** of a choice is the value of the best alternative that has to be given up to make it. If the options have values $V_1, \dots, V_n$ and option $i$ is chosen, its opportunity cost is $\max_{j \ne i} V_j$. An option is the best choice exactly when its value is at least its opportunity cost.`,
      idea: String.raw`Because resources are scarce (1.1), choosing one use rules out the others; only the *best* forgone use matters, since that is what would have been done instead. Comparing $V_i$ with $\max_{j\ne i}V_j$ is therefore the same as asking whether $i$ is the maximum. The opportunity cost is a maximum of the other values, so it is continuous but kinked: it switches from following one rival to following another exactly when the rivals' values cross.`,
      caption: String.raw`Set the three values and pick an option. The red bar is the best alternative given up and the dashed line its value, the opportunity cost. The right panel varies one rival's value: the opportunity cost stays flat until that rival overtakes the runner-up, then rises with it. The region where it exceeds the value of your choice (red) is where your choice is a mistake.`,
      deps: ['micro-1.1'], refs: ['Mankiw Ch. 1'], tags: ['scarcity', 'cost'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Opportunity_cost' },
      viz(v) {
        const names = ['work a shift', 'concert', 'study'], cols = ['orange', 'purple', 'teal'];
        const val = [v.slider('value of the shift ($)', 0, 100, 80, { step: 1 }), v.slider('value of the concert ($)', 0, 100, 65, { step: 1 }), v.slider('value of studying ($)', 0, 100, 50, { step: 1 })];
        const pick = v.select('you choose', names.map((n, i) => ({ value: String(i), label: n })), '1');
        const s = v.stage({ x: [0.35, 3.65], y: [-9, 112], height: 320, axes: 'box', ylabel: 'value ($)', xticks: names.map((n, i) => [i + 1, n]), title: 'three ways to spend Saturday' });
        const t = v.stage({ x: [0, 100], y: [0, 112], height: 320, axes: 'box', xticks: [20, 40], ylabel: 'opportunity cost ($)' });
        v.render(() => {
          const c = +pick.value, V = val.map((x) => x.value), oth = [0, 1, 2].filter((i) => i !== c);
          const ru = V[oth[0]] >= V[oth[1]] ? oth[0] : oth[1], oc = V[ru], net = V[c] - oc;
          s.hline(oc, { color: 'red', dash: [6, 4], width: 1.5 });
          for (let i = 0; i < 3; i++) {
            const x = i + 1, me = i === c, gone = i === ru;
            s.rect(x - 0.28, 0, x + 0.28, V[i], { fill: cols[i], fillAlpha: me ? 0.8 : gone ? 0.45 : 0.18, color: me ? 'ink' : gone ? 'red' : cols[i], width: me || gone ? 2.4 : 1 });
            s.text(`$${V[i]}`, x, V[i], { dy: -9, align: 'center', color: 'ink', size: 12 });
            if (me || gone) s.text(me ? 'chosen' : 'given up', x, Math.max(V[i], 3) / 2, { align: 'center', color: me ? 'ink' : 'red', size: 11.5, weight: 700 });
          }
          s.text(`opportunity cost $${oc}`, 0.4, oc, { dy: 10, color: 'red', size: 11.5 });
          if (Math.abs(net) > 3) s.measure(c + 1.36, V[c], c + 1.36, oc, net >= 0 ? `+${net}` : `${net}`, { color: net >= 0 ? 'green' : 'red', offset: -14 });
          // right panel: opportunity cost as the first rival's value varies
          const A = oth[0], Bo = oth[1], vb = V[Bo], vc = V[c], OC = (x) => Math.max(x, vb);
          t.o.xlabel = `value of “${names[A]}” ($)`; t.setTitle(`opportunity cost of “${names[c]}”`);
          t.between((x) => Math.min(OC(x), vc), () => vc, 0, 100, { fill: 'green', fillAlpha: 0.13 });
          t.between(() => vc, (x) => Math.max(OC(x), vc), 0, 100, { fill: 'red', fillAlpha: 0.15 });
          t.hline(vc, { color: 'ink', dash: [5, 4], width: 1.3 }); t.text(`value of your choice $${vc}`, 1.5, vc, { dy: vc > 100 ? 10 : -9, color: 'ink', size: 11 });
          t.line(0, vb, vb, vb, { color: cols[Bo], width: 3 }); t.line(vb, vb, 100, 100, { color: cols[A], width: 3 });
          t.text(`= ${names[Bo]}`, Math.min(vb / 2, 30), vb, { dy: 11, align: 'center', color: cols[Bo], size: 11 });
          t.text(`= ${names[A]}`, Math.max(vb, 50) + 22, Math.max(vb, 50) + 22, { dx: 8, dy: 8, color: cols[A], size: 11 });
          t.dot(vb, vb, { r: 3.5, color: 'muted' });
          t.dot(V[A], OC(V[A]), { r: 6, color: 'gold' });
        });
        v.legend([['red', 'best alternative given up'], ['green', 'choice beats its opportunity cost'], ['gold', 'current values', { dot: true }]]);
        v.readout(() => {
          const c = +pick.value, V = val.map((x) => x.value), oth = [0, 1, 2].filter((i) => i !== c);
          const ru = V[oth[0]] >= V[oth[1]] ? oth[0] : oth[1], oc = V[ru], net = V[c] - oc;
          const d = (x) => `$\\$${x}$`;
          const head = `Opportunity cost of “${names[c]}” = max(${oth.map((i) => `${names[i]} ${d(V[i])}`).join(', ')}) = **${d(oc)}** (${names[ru]}).`;
          return net >= 0 ? `${head} Value ${d(V[c])} ≥ ${d(oc)}: this is the best option, worth ${d(net)} more than the next best.` : `${head} Value ${d(V[c])} < ${d(oc)}: choosing it forgoes ${d(-net)} — “${names[ru]}” is the better choice.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Principle', name: 'Thinking at the margin',
      statement: String.raw`Let an activity at level $q$ have total benefit $B(q)$ and total cost $C(q)$, with marginal benefit $MB = B'$ and marginal cost $MC = C'$. Net benefit $NB(q) = B(q) - C(q) = NB(0) + \int_0^q (MB - MC)$ is maximised at an interior level $q^*$ only if $MB(q^*) = MC(q^*)$. If $MB$ is decreasing and $MC$ increasing, the crossing is the unique maximiser: below it one more unit adds net benefit, above it one more unit subtracts it.`,
      idea: String.raw`At an interior maximum the derivative of $NB$ vanishes (5.8 in Rudin), and $NB' = MB - MC$. When $MB - MC$ is decreasing it changes sign once, from positive to negative, so $NB$ rises up to the crossing and falls after it. The decision rule never needs totals: compare the benefit and the cost of the *next* unit.`,
      caption: String.raw`Drag the four handles to reshape the marginal-benefit and marginal-cost lines and the gold handle to choose the activity level $q$. Green area: units whose benefit exceeds their cost; red area: units that cost more than they bring. Below, the net benefit (integrated numerically) peaks exactly at the crossing; the dots step through it in increments of $\Delta q$, red once each step loses.`,
      deps: ['micro-1.2', 'pma-5.8'], refs: ['Mankiw Ch. 1', 'CORE Unit 3'], tags: ['marginal analysis'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginalism' },
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 118], height: 300, axes: 'box', xlabel: 'q', ylabel: '$ per unit', title: 'marginal benefit and marginal cost' });
        const n = v.stage({ x: [0, 100], y: [-500, 2600], height: 220, axes: 'box', xlabel: 'q', ylabel: 'net benefit', title: String.raw`net benefit $NB(q)=\int_0^q (MB-MC)\,dq$` });
        const step = v.slider('step $\\Delta q$', 2, 20, 8, { step: 1 });
        const H = v.curves(s, { demand: { linear: [[4, 92], [88, 22]] }, supply: { linear: [[4, 8], [88, 82]] } }), L = v.curves(s, {});
        const Q = s.handle(68, 3, { color: 'gold', label: 'q', constrain: (x) => [clamp(x, 0.5, 99.5), 3] });
        let st = {};
        v.legend([['blue', 'MB'], ['orange', 'MC'], ['green', 'net gain'], ['red', 'net loss']]);
        v.render(() => {
          const MB = H.D, MC = H.S, g = (x) => MB(x) - MC(x), q = Q.x;
          const r = v.econ('root', g, 0, 100), qs = r ?? (g(50) > 0 ? 100 : 0);
          const a = Math.min(q, qs);
          if (a > 0) s.between(MB, MC, 0, a, { fill: 'green', fillAlpha: 0.25 });
          if (q > qs) s.between(MC, MB, qs, q, { fill: 'red', fillAlpha: 0.3 });
          if (q < qs) s.between(MB, MC, q, qs, { fill: 'green', fillAlpha: 0.07 });
          L.curve(MB, { color: 'blue', label: 'MB' }); L.curve(MC, { color: 'orange', label: 'MC' }); L.draw();
          s.vline(q, { color: 'gold', width: 1.6 });
          if (r != null) { s.vline(qs, { color: 'green', dash: [5, 4], width: 1.2 }); s.dot(qs, MB(qs), { r: 4.5, color: 'green', label: 'MB = MC', labelPos: 'ne' }); }
          // net benefit
          const N = 400, xs = [], ys = [0]; for (let i = 0; i <= N; i++) xs.push((100 * i) / N);
          for (let i = 1; i <= N; i++) ys.push(ys[i - 1] + ((g(xs[i - 1]) + g(xs[i])) / 2) * (100 / N));
          const lo = Math.min(...ys), hi = Math.max(...ys), pad = 0.12 * (hi - lo || 1);
          n.setView([0, 100], [lo - pad, hi + pad]);
          const NB = (x) => v.econ('simpson', g, 0, x, 200);
          n.hline(0, { color: 'faint' });
          n.path(xs.map((x, i) => [x, ys[i]]), { color: 'accent', width: 2.4 });
          const d = step.value; let prev = 0;
          for (let k = d; k <= q + 1e-9; k += d) { const y = NB(k); n.line(k - d, prev, k, y, { color: y >= prev ? 'green' : 'red', width: 2.2 }); n.dot(k, y, { r: 3.2, color: y >= prev ? 'green' : 'red' }); prev = y; }
          n.vline(qs, { color: 'green', dash: [5, 4], width: 1.2 }); n.dot(qs, NB(qs), { r: 5, color: 'green', label: 'peak', labelPos: 'n' });
          n.vline(q, { color: 'gold', width: 1.4 }); n.dot(q, NB(q), { r: 5, color: 'gold' });
          st = { q, mb: MB(q), mc: MC(q), qs, cross: r != null, nbq: NB(q), nbs: NB(qs), ms: MB(qs) };
        });
        v.readout(() => {
          const f = (x) => v.fix(x, 1), d = st.mb - st.mc;
          const where = st.cross ? `$NB$ peaks at $q^* = ${f(st.qs)}$, where $MB = MC = ${f(st.ms)}$: $NB(q^*) = ${f(st.nbs)}$ vs $NB(q) = ${f(st.nbq)}$.` : 'The lines do not cross in view: the best level is a corner.';
          return `At $q = ${f(st.q)}$: $MB = ${f(st.mb)}$, $MC = ${f(st.mc)}$, so the next unit ${d >= 0 ? 'adds' : 'subtracts'} about ${f(Math.abs(d))} ${d >= 0 ? 'to' : 'from'} net benefit. ${where}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Model', name: 'Production possibility frontier',
      statement: String.raw`Given fixed resources and technology, the **production possibility frontier** (PPF) is the set of output combinations of two goods that are attainable with every resource used efficiently: one good can be increased only by decreasing the other. Points inside the frontier are attainable but waste resources (idle or misallocated); points outside are unattainable with present resources. The magnitude of the frontier's slope at a point is the opportunity cost of the horizontal good in units of the vertical one.`,
      scope: String.raw`A two-good snapshot: resources, technology and the labour force are held fixed; growth or better technology shifts the whole frontier outward.`,
      idea: String.raw`Here 100 workers can make food $F = 10\sqrt{L_F}$ or cloth $C = 8\sqrt{L_C}$ with $L_F + L_C \le 100$. Moving one worker from cloth to food raises $F$ and lowers $C$, so the efficient outputs trace a decreasing curve. A bundle $(F, C)$ needs $(F/10)^2 + (C/8)^2$ workers: fewer than 100 means some are idle (inside), more than 100 means it cannot be made (outside). The slope $dC/dF = -0.8\sqrt{L_F/L_C}$ is what the next unit of food costs in cloth (1.2).`,
      caption: String.raw`The slider moves workers between the two industries and the point $P$ runs along the frontier; the step triangle shows what 10 more food would cost. Drag the bundle $A$ inside the frontier (gold: idle workers) or beyond it (red: unattainable); the bar chart counts the workers it would need.`,
      deps: ['micro-1.1', 'micro-1.2'], refs: ['Mankiw Ch. 2', 'CORE Unit 3'], tags: ['production', 'scarcity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Production%E2%80%93possibility_frontier' },
      viz(v) {
        const N = 100, F = (L) => 10 * Math.sqrt(Math.max(0, L)), C = (L) => 8 * Math.sqrt(Math.max(0, L));
        const need = (f, c) => (f / 10) ** 2 + (c / 8) ** 2;
        const Lf = v.slider('workers in food', 0, 100, 36, { int: true });
        const s = v.stage({ x: [0, 118], y: [0, 96], height: 340, axes: 'box', xlabel: 'food', ylabel: 'cloth', title: 'what 100 workers can make' });
        const w = v.stage({ x: [-16, 215], y: [0, 2.3], height: 130, axes: false, full: true, title: 'workers needed' });
        const A = s.handle(46, 38, { color: 'gold', label: 'A', constrain: (x, y) => [clamp(x, 0, 116), clamp(y, 0, 94)] });
        v.legend([['green', 'frontier'], ['orange', 'food workers'], ['teal', 'cloth workers'], ['gold', 'idle'], ['red', 'missing']]);
        v.render(() => {
          const pts = []; for (let i = 0; i <= 200; i++) { const L = i / 2; pts.push([F(L), C(N - L)]); }
          s.poly([[0, 0], ...pts], { fill: 'green', fillAlpha: 0.08, stroke: false }); s.path(pts, { color: 'green', width: 2.6 });
          s.text('PPF', F(80), C(20), { dx: 8, dy: -6, color: 'green', size: 13, weight: 700 });
          const L = Lf.value, px = F(L), py = C(N - L), oc = L >= N ? Infinity : 0.8 * Math.sqrt(L / (N - L));
          if (isFinite(oc) && L > 0) { const d = 14; s.line(px - d, py + oc * d, px + d, py - oc * d, { color: 'accent', width: 1.2, dash: [5, 4] }); }
          if (px + 10 <= 100) { const L2 = ((px + 10) / 10) ** 2, y2 = C(N - L2); s.line(px, py, px + 10, py, { color: 'muted', width: 1.2 }); s.line(px + 10, py, px + 10, y2, { color: 'red', width: 2 }); s.text('+10 food', px + 5, py, { dy: -8, align: 'center', color: 'muted', size: 10.5 }); s.text(`−${v.fix(py - y2, 1)} cloth`, px + 10, (py + y2) / 2, { dx: 5, baseline: 'middle', color: 'red', size: 10.5 }); }
          s.dot(px, py, { r: 5, color: 'accent', label: 'P', labelPos: 'sw' });
          const nA = need(A.x, A.y), stA = Math.abs(nA - N) < 2 ? 'on' : nA < N ? 'inside' : 'outside';
          A.color = stA === 'on' ? 'green' : stA === 'inside' ? 'gold' : 'red';
          // workforce bars
          const row = (y, lab, a, b2) => {
            w.text(lab, -4, y, { align: 'right', baseline: 'middle', color: 'ink', size: 12.5, weight: 600 });
            const a1 = Math.min(a, 212), b1 = Math.min(a + b2, 212);
            w.rect(0, y - 0.3, a1, y + 0.3, { fill: 'orange', fillAlpha: 0.6, stroke: false }); w.rect(a1, y - 0.3, b1, y + 0.3, { fill: 'teal', fillAlpha: 0.6, stroke: false });
            const tot = a + b2;
            if (tot < N - 0.5) { w.rect(tot, y - 0.3, N, y + 0.3, { fill: 'gold', fillAlpha: 0.25, color: 'gold', width: 1.2, dash: [3, 3] }); w.text(`${v.fix(N - tot, 0)} idle`, (tot + N) / 2, y, { align: 'center', baseline: 'middle', color: 'ink', size: 11 }); }
            if (tot > N + 0.5) { w.rect(N, y - 0.3, Math.min(tot, 212), y + 0.3, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.4 }); w.text(`${v.fix(tot - N, 0)} missing`, (N + Math.min(tot, 212)) / 2, y, { align: 'center', baseline: 'middle', color: 'red', size: 11, weight: 600 }); }
          };
          row(1.55, 'P', L, N - L); row(0.55, 'A', (A.x / 10) ** 2, (A.y / 8) ** 2);
          w.line(N, 0.1, N, 2.05, { color: 'ink', width: 2 }); w.text('100 workers', N, 2.05, { dy: -7, align: 'center', color: 'ink', size: 11 });
        });
        v.readout(() => {
          const L = Lf.value, px = F(L), py = C(N - L), oc = L >= N ? Infinity : 0.8 * Math.sqrt(L / (N - L)), f = (x) => v.fix(x, 1), nA = need(A.x, A.y);
          const a = Math.abs(nA - N) < 2 ? `on the frontier (needs ${f(nA)} ≈ 100 workers)` : nA < N ? `**inside**: it needs only ${f(nA)} workers, ${f(N - nA)} would be idle` : `**outside**: it would need ${f(nA)} workers — unattainable, ${f(nA - N)} short`;
          return `$P$: ${L} workers on food, ${N - L} on cloth → (food, cloth) = (${f(px)}, ${f(py)}); the next unit of food costs ${isFinite(oc) ? v.fix(oc, 2) : '∞'} cloth (slope of the frontier). $A = (${f(A.x)}, ${f(A.y)})$ is ${a}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Definition', name: 'Marginal rate of transformation',
      statement: String.raw`If the frontier is the graph of a differentiable decreasing function $C = T(F)$, the **marginal rate of transformation** at output $F$ is $\mathrm{MRT}(F) = -T'(F)$: the amount of the second good that must be given up per extra unit of the first, for a small change. It is the limit of the finite opportunity costs $-\Delta C/\Delta F$ as $\Delta F \to 0$.`,
      idea: String.raw`A finite change from $F$ to $F + \Delta F$ along the frontier costs $T(F) - T(F+\Delta F)$ units of cloth, so the cost per unit is the slope of a secant. Differentiability (Rudin 5.1) says these secant slopes converge to the tangent's slope; for a smooth frontier the error of the one-sided secant shrinks in proportion to $\Delta F$ (Taylor's theorem).`,
      caption: String.raw`Drag $P$ along the frontier. The blue tangent's slope is the MRT; the gold secant uses a finite step $\Delta F$. Shrink the step (log slider) and watch the secant swing onto the tangent; the right panel shows the error falling along a line of slope one on log–log axes. With curvature $k = 1$ the frontier is straight and every secant is exact.`,
      deps: ['micro-1.4'], refs: ['CORE Unit 3', 'Varian Ch. 33'], tags: ['production', 'marginal analysis'],
      viz(v) {
        const a = 10, b = 8;
        const Y = (x, k) => b * Math.pow(Math.max(0, 1 - Math.pow(Math.max(x, 0) / a, k)), 1 / k);
        const dY = (x, k) => -(b / a) * Math.pow(x / a, k - 1) * Math.pow(Math.max(1e-12, 1 - Math.pow(x / a, k)), 1 / k - 1);
        const kS = v.slider('curvature $k$', 1, 4, 2, { step: 0.05, onChange: (k) => P.set(P.x, Y(P.x, k)) });
        const hS = v.slider('step $\\Delta F$', 0.001, 3, 1.5, { log: true, decimals: 3 });
        const s = v.stage({ x: [0, 12.6], y: [0, 9.4], height: 340, axes: 'box', xlabel: 'food F', ylabel: 'cloth C', title: String.raw`frontier $(F/a)^k + (C/b)^k = 1$` });
        const e = v.stage({ x: [0.001, 8], y: [1e-6, 10], xlog: true, ylog: true, height: 340, xlabel: 'step ΔF', ylabel: 'error', title: String.raw`$\left|\,{-\Delta C/\Delta F} - \mathrm{MRT}\,\right|$` });
        const P = s.handle(5, Y(5, 2), { color: 'accent', label: 'P', labelPos: 'sw', constrain: (x) => { const xx = clamp(x, 0.3, a - 0.6); return [xx, Y(xx, kS.value)]; } });
        const err = (x, h, k) => { const x2 = Math.min(x + h, a); return Math.abs(-(Y(x2, k) - Y(x, k)) / (x2 - x) + dY(x, k)); };
        v.legend([['green', 'frontier'], ['accent', 'tangent (MRT)'], ['gold', 'secant over ΔF', { dash: true }]]);
        v.render(() => {
          const k = kS.value, x = P.x, y = Y(x, k), m = dY(x, k), h = hS.value, x2 = Math.min(x + h, a), y2 = Y(x2, k), ms = (y2 - y) / (x2 - x);
          const pts = []; for (let i = 0; i <= 300; i++) { const t = (a * i) / 300; pts.push([t, Y(t, k)]); }
          s.poly([[0, 0], ...pts], { fill: 'green', fillAlpha: 0.08, stroke: false }); s.path(pts, { color: 'green', width: 2.6 });
          s.line(x - 4, y - 4 * m, x + 4, y + 4 * m, { color: 'accent', width: 1.8 });
          s.line(x - 3, y - 3 * ms, x2 + 3, y2 + 3 * ms, { color: 'gold', width: 1.6, dash: [6, 4] });
          if (h > 0.25) { s.line(x, y, x2, y, { color: 'muted', width: 1 }); s.line(x2, y, x2, y2, { color: 'red', width: 1.8 }); s.tex(String.raw`\Delta F`, (x + x2) / 2, y, { dy: -4, baseline: 'bottom', align: 'center', color: 'muted', size: 13 }); s.tex(String.raw`\Delta C`, x2, (y + y2) / 2, { dx: 5, align: 'left', color: 'red', size: 13 }); }
          s.dot(x2, y2, { r: 4, color: 'gold' });
          const hs = []; for (let i = 0; i <= 160; i++) { const hh = 0.001 * 3000 ** (i / 160); if (x + hh <= a) hs.push([hh, err(x, hh, k)]); }
          if (k > 1.001) { e.path(hs.filter((p) => p[1] > 1e-7), { color: 'purple', width: 2.2 }); const E = err(x, h, k); if (E > 1e-7) e.dot(h, E, { r: 5, color: 'gold' }); }
          else e.corner('straight frontier: every secant is exact', 'tl', { color: 'green' });
        });
        v.readout(() => {
          const k = kS.value, x = P.x, h = hS.value, x2 = Math.min(x + h, a), ms = (Y(x2, k) - Y(x, k)) / (x2 - x), mrt = -dY(x, k);
          return `At $F = ${v.fix(x, 2)}$: $\\mathrm{MRT} = -T'(F) = ${v.fix(mrt, 4)}$ cloth per food (the tangent). Secant over $\\Delta F = ${v.fix(x2 - x, 3)}$: $-\\Delta C/\\Delta F = ${v.fix(-ms, 4)}$, error ${v.fix(Math.abs(-ms - mrt), 5)}. Each tenfold cut in $\\Delta F$ cuts the error about tenfold.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Concept', name: 'Increasing opportunity cost',
      statement: String.raw`When resources differ in how well suited they are to each good, the opportunity cost of a good rises as more of it is produced: the frontier is bowed outward (concave), and the MRT increases along it. If all resources are equally suited to both goods, the opportunity cost is constant and the frontier is a straight line.`,
      idea: String.raw`An efficient economy shifts first the workers who give up the least of the other good per unit gained, that is, those with the lowest ratio $c_i/f_i$ of cloth skill to food skill. Each further unit of food must therefore come from a worker with a higher ratio, so the frontier's segments get steeper. The frontier is concave because its slopes are the sorted ratios; with identical ratios all segments have the same slope.`,
      caption: String.raw`Each coloured segment is one worker, moved from cloth to food in order of suitability (lowest cloth-per-food ratio first). Drag $P$ along the frontier; the right panel shows the opportunity cost of the next unit of food as a rising staircase. Try 30 workers for a nearly smooth bowed frontier, then switch on **identical skills**: the staircase flattens and the frontier straightens.`,
      deps: ['micro-1.5'], refs: ['Mankiw Ch. 2'], tags: ['production'],
      viz(v) {
        const nSel = v.select('workers', ['3', '6', '30'], '6', { onChange: () => resnap() });
        const same = v.toggle('identical skills', false, { onChange: () => resnap() });
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 340, axes: 'box', xlabel: 'food', ylabel: 'cloth', xticks: [2, 4, 6, 8, 10], title: 'frontier traced worker by worker' });
        const c = v.stage({ x: [0, 13], y: [0, 4.6], height: 340, axes: 'box', xlabel: 'food', xticks: [2, 4, 6, 8, 10], ylabel: 'cloth per food', title: 'opportunity cost of the next unit of food' });
        const workers = () => {
          const N = +nSel.value, r = Array.from({ length: N }, (_, i) => (same.value ? 1 : Math.exp(Math.log(0.25) + Math.log(16) * ((i + 0.5) / N))));
          const S = 10 / r.reduce((t, x) => t + 1 / Math.sqrt(x), 0); return r.map((x) => ({ r: x, F: S / Math.sqrt(x), C: S * Math.sqrt(x) }));
        };
        const frontier = () => { const W = workers(); return { W, pts: chain(W, W.map((_, i) => i)) }; };
        const P = s.handle(4, 0, { color: 'gold', label: 'P', labelPos: 'sw', constrain: (x) => { const xx = clamp(x, 0, 10); return [xx, onChain(frontier().pts, xx)]; } });
        function resnap() { P.set(P.x, onChain(frontier().pts, P.x)); }
        resnap();
        const pal = ['blue', 'orange', 'purple', 'teal', 'pink', 'red'];
        let st = {};
        v.render(() => {
          const { W, pts } = frontier(), N = W.length, col = (i) => (N <= 6 ? pal[i % 6] : i % 2 ? 'green' : 'teal');
          if (!same.value) { s.line(0, 10, 10, 0, { color: 'muted', dash: [5, 4], width: 1.2 }); s.text('identical skills', 0.9, 6.6, { color: 'muted', size: 11 }); }
          s.poly([[0, 0], ...pts], { fill: 'green', fillAlpha: 0.07, stroke: false });
          let j = 0; for (let i = 0; i < N; i++) if (P.x > pts[i][0] + 1e-9) j = i;
          for (let i = 0; i < N; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
            s.line(x0, y0, x1, y1, { color: col(i), width: i === j ? 4.5 : 2.8 });
            if (N <= 6) s.text(`#${i + 1}`, (x0 + x1) / 2, (y0 + y1) / 2, { dx: 9, dy: -8, color: col(i), size: 11.5, weight: 600 });
          }
          if (N <= 30) s.dots(pts, { r: N <= 6 ? 3.2 : 2, color: 'ink' });
          // staircase
          let x = 0; for (let i = 0; i < N; i++) { const w = W[i]; c.rect(x, 0, x + w.F, w.r, { fill: col(i), fillAlpha: i === j ? 0.55 : 0.25, color: col(i), width: 1.4 }); x += w.F; }
          c.vline(P.x, { color: 'gold', width: 1.5 }); c.dot(P.x, W[j].r, { r: 5, color: 'gold' });
          st = { W, j, N, done: pts.filter((p, i) => i > 0 && p[0] <= P.x + 1e-9).length };
        });
        v.readout(() => {
          const { W, j, N } = st; if (!W) return '';
          if (same.value) return `All ${N} workers give up exactly 1 cloth per food: every segment has slope −1, the frontier is a straight line and the opportunity cost of food is constant.`;
          return `Worker #${j + 1} of ${N} is now switching to food (${st.done} already moved). The next unit of food costs **${v.fix(W[j].r, 2)}** cloth; the first worker moved gave up only ${v.fix(W[0].r, 2)}, the last will give up ${v.fix(W[N - 1].r, 2)}. Rising costs = steeper segments = a frontier bowed outward.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Concept', name: 'Absolute advantage',
      statement: String.raw`A producer has an **absolute advantage** in a good if it can produce a unit of it with fewer resources (here, fewer hours) than another producer; equivalently, with equal resources it can produce more of it. One producer may have the absolute advantage in both goods.`,
      idea: String.raw`With $T$ hours and $a_F$ hours per unit of food, a producer's frontier is the line from $(T/a_F, 0)$ to $(0, T/a_C)$. Comparing intercepts on each axis compares hours per unit, good by good. Nothing in this comparison involves the trade-off between the two goods; that is what comparative advantage (1.8) adds.`,
      caption: String.raw`Drag the four intercept handles (Ana blue, Ben orange; 40 hours each). The thick strip on each axis shows who reaches further, that is, who has the absolute advantage in that good; the bars compare hours per unit directly.`,
      deps: ['micro-1.4'], refs: ['Mankiw Ch. 3'], tags: ['trade'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Absolute_advantage' },
      viz(v) {
        const T = 40;
        const s = v.stage({ x: [0, 46], y: [0, 46], height: 340, axes: 'box', xlabel: 'food', ylabel: 'cloth', title: 'frontiers with 40 hours each' });
        const hb = v.stage({ x: [0.35, 2.65], y: [-0.45, 5.6], height: 340, axes: 'box', ylabel: 'hours per unit', xticks: [[1, 'food'], [2, 'cloth']], title: 'hours needed per unit' });
        const hx = (col, x, lab) => s.handle(x, 0, { color: col, label: lab, labelPos: 'n', constrain: (x) => [clamp(x, 8, 44), 0] });
        const hy = (col, y) => s.handle(0, y, { color: col, constrain: (x, y) => [0, clamp(y, 8, 44)] });
        const aF = hx('blue', 40, 'Ana'), aC = hy('blue', 20), bF = hx('orange', 14, 'Ben'), bC = hy('orange', 16);
        v.legend([['blue', 'Ana'], ['orange', 'Ben']]);
        const who = (a, b) => (Math.abs(a - b) < 0.25 ? null : a > b ? 'Ana' : 'Ben');
        v.render(() => {
          for (const [F, C, col] of [[aF.x, aC.y, 'blue'], [bF.x, bC.y, 'orange']]) { s.poly([[0, 0], [F, 0], [0, C]], { fill: col, fillAlpha: 0.08, stroke: false }); s.line(F, 0, 0, C, { color: col, width: 2.6 }); }
          const wf = who(aF.x, bF.x), wc = who(aC.y, bC.y);
          if (wf) s.line(Math.min(aF.x, bF.x), 0.35, Math.max(aF.x, bF.x), 0.35, { color: PERSON[wf], width: 7, alpha: 0.6 });
          if (wc) s.line(0.35, Math.min(aC.y, bC.y), 0.35, Math.max(aC.y, bC.y), { color: PERSON[wc], width: 7, alpha: 0.6 });
          s.text(`food: ${wf ? wf + ' has the absolute advantage' : 'tie'}`, 45, 44, { align: 'right', color: wf ? PERSON[wf] : 'muted', size: 12, weight: 600 });
          s.text(`cloth: ${wc ? wc + ' has the absolute advantage' : 'tie'}`, 45, 41, { align: 'right', color: wc ? PERSON[wc] : 'muted', size: 12, weight: 600 });
          const H = [[T / aF.x, T / bF.x], [T / aC.y, T / bC.y]];
          H.forEach(([ha, hb2], g) => {
            const x = g + 1; for (const [h, dx, col, other] of [[ha, -0.17, 'blue', hb2], [hb2, 0.17, 'orange', ha]]) {
              const win = h < other - 0.02; hb.rect(x + dx - 0.15, 0, x + dx + 0.15, h, { fill: col, fillAlpha: win ? 0.75 : 0.3, color: win ? 'green' : col, width: win ? 2.4 : 1 });
              hb.text(v.fix(h, 2), x + dx, h, { dy: -9, align: 'center', color: 'ink', size: 11 });
            }
          });
        });
        v.readout(() => {
          const f = (x) => v.fix(x, 2), wf = who(aF.x, bF.x), wc = who(aC.y, bC.y);
          const both = wf && wf === wc ? ` ${wf} is absolutely better at **both** goods — yet, as 1.8 shows, it still pays both to trade.` : '';
          return `Ana: ${f(T / aF.x)} h per food, ${f(T / aC.y)} h per cloth · Ben: ${f(T / bF.x)} h per food, ${f(T / bC.y)} h per cloth. Absolute advantage in food: **${wf ?? 'nobody'}**; in cloth: **${wc ?? 'nobody'}**.${both}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Principle', name: 'Comparative advantage (Ricardo)',
      statement: String.raw`A producer has a **comparative advantage** in a good if its opportunity cost of producing it is lower than another producer's. With two producers and two goods and different opportunity costs, each has a comparative advantage in exactly one good, even if one of them has the absolute advantage in both; and total output is largest, in the sense that the joint frontier is reached, when each good is produced first by the producer with the comparative advantage in it.`,
      scope: String.raw`Two goods, constant hours per unit (linear frontiers), resources that can be reallocated within but not between producers.`,
      idea: String.raw`Ana's opportunity cost of food is $a_F/a_C$ cloth and Ben's is $b_F/b_C$; if Ana's is lower then Ben's opportunity cost of cloth, $b_C/b_F$, is lower than Ana's, so each has a comparative advantage in one good. The joint frontier is built by assigning each extra unit of food to whoever gives up the least cloth for it (1.2): Ana's segment first, then Ben's, giving a frontier bowed outward. Reversing the order bows it inward and wastes output; when the two ratios are equal the two orders give the same straight line.`,
      caption: String.raw`Set hours per unit with the sliders (40 hours each). The green frontier assigns food first to the producer with the lower opportunity cost; the red dashed one does the reverse, and the red area is output lost by getting comparative advantage backwards. The strip below places both opportunity costs on a log scale: the assignment flips only when one dot passes the other.`,
      deps: ['micro-1.2', 'micro-1.7'], refs: ['Mankiw Ch. 3', 'Varian Ch. 33'], tags: ['trade'],
      credit: 'David Ricardo, 1817 (Principles of Political Economy and Taxation)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Comparative_advantage' },
      viz(v) {
        const T = 40;
        const sl = [['Ana: hours per food', 1], ['Ana: hours per cloth', 2], ['Ben: hours per food', 4], ['Ben: hours per cloth', 2.5]].map(([l, x]) => v.slider(l, 0.5, 5, x, { step: 0.05 }));
        const s = v.stage({ x: [0, 50], y: [0, 40], height: 330, axes: 'box', xlabel: 'food', ylabel: 'cloth', title: 'joint frontier of Ana and Ben' });
        const o = v.stage({ x: [0.1, 10], y: [0, 1], xlog: true, height: 120, full: true, yticks: [], xlabel: 'cloth per food (log)', title: 'opportunity cost of one unit of food' });
        let st = {};
        v.legend([['green', 'food made first by the lower opportunity cost'], ['red', 'reverse assignment', { dash: true }]]);
        v.render(() => {
          const [af, ac, bf, bc] = sl.map((x) => x.value), P = [{ F: T / af, C: T / ac }, { F: T / bf, C: T / bc }];
          const oA = af / ac, oB = bf / bc, ord = oA <= oB ? [0, 1] : [1, 0], good = chain(P, ord), bad = chain(P, ord.slice().reverse());
          const Fs = P[0].F + P[1].F, Cs = P[0].C + P[1].C; s.setView([0, Fs * 1.1], [0, Cs * 1.12]);
          s.poly([...good, ...bad.slice().reverse()], { fill: 'red', fillAlpha: 0.16, stroke: false });
          s.poly([[0, 0], ...good], { fill: 'green', fillAlpha: 0.07, stroke: false });
          s.path(bad, { color: 'red', width: 2, dash: [6, 4] }); s.path(good, { color: 'green', width: 2.8 });
          const K = good[1], Kb = bad[1], eq = Math.abs(oA - oB) < 1e-9;
          s.dot(K[0], K[1], { r: 5, color: 'green', label: eq ? null : `${ord[0] ? 'Ben' : 'Ana'}: all food, ${ord[0] ? 'Ana' : 'Ben'}: all cloth`, labelPos: 'ne' });
          s.dot(Kb[0], Kb[1], { r: 4, color: 'red', hollow: true });
          const loss = K[1] - onChain(bad, K[0]);
          if (eq) s.corner('equal opportunity costs: both orders give the same line', 'tr', { color: 'red' });
          // opportunity-cost strip
          const lab = (x, name, col, up) => { o.dot(x, 0.42, { r: 7, color: col }); o.text(`${name} ${v.fix(x, 2)}`, x, 0.42, { dy: up ? -16 : 18, align: 'center', color: col, size: 12, weight: 600 }); };
          lab(clamp(oA, 0.1, 10), 'Ana', 'blue', true); lab(clamp(oB, 0.1, 10), 'Ben', 'orange', Math.abs(Math.log(oA / oB)) < 0.35 ? false : true);
          if (!eq) { const lo = Math.min(oA, oB), hi = Math.max(oA, oB); o.line(lo, 0.42, hi, 0.42, { color: 'muted', width: 1.5 }); o.text('lower: makes food', lo, 0.42, { dx: -12, align: 'right', baseline: 'middle', color: 'green', size: 11.5 }); o.text('higher: makes cloth', hi, 0.42, { dx: 12, align: 'left', baseline: 'middle', color: 'muted', size: 11.5 }); }
          st = { af, ac, bf, bc, oA, oB, loss, K, eq };
        });
        v.readout(() => {
          const { af, ac, bf, bc, oA, oB, loss, K, eq } = st, f = (x) => v.fix(x, 2);
          const abs = af < bf && ac < bc ? 'Ana is faster at both goods (absolute advantage in both), yet ' : bf < af && bc < ac ? 'Ben is faster at both goods, yet ' : '';
          if (eq) return `Both give up ${f(oA)} cloth per food: nobody has a comparative advantage, both assignments give the same straight frontier, and specializing gains nothing.`;
          const fa = oA < oB ? 'Ana' : 'Ben', cb = oA < oB ? 'Ben' : 'Ana';
          return `${abs}one food costs Ana ${f(oA)} cloth and Ben ${f(oB)} cloth, so **${fa}** has the comparative advantage in food and **${cb}** in cloth. Specializing this way reaches (${f(K[0])}, ${f(K[1])}); the reverse assignment gets only ${f(K[1] - loss)} cloth with the same food — ${f(loss)} cloth lost.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Principle', name: 'Gains from specialization and trade',
      statement: String.raw`If two producers have different opportunity costs, each can specialize in its comparative-advantage good and exchange at a rate strictly between the two opportunity costs; then both can consume bundles outside their own production possibility frontiers, which no amount of self-sufficient effort could reach. If their opportunity costs are equal, the only rate both accept is that common cost, and trade leaves every consumption point on its owner's frontier: no gains.`,
      idea: String.raw`Ana (40 food or 20 cloth, opportunity cost 0.5) and Ben (10 food or 16 cloth, opportunity cost 1.6) specialize as comparative advantage dictates (1.8). At 0.8 cloth per food, every food Ana sells brings 0.8 cloth instead of the 0.5 she could make, and every cloth Ben sells brings $1/0.8 = 1.25$ food instead of $1/1.6$. So both consumption lines lie above the frontiers: Ana's cloth gain is $(0.8 - 0.5)X$ and Ben's is $(1.6 - 0.8)X$ for $X$ food traded.`,
      caption: String.raw`Switch between **self-sufficiency** and **specialize & trade**; the slider sets how much food Ana ships (Ben pays 0.8 cloth for each). The gold points are what each consumes; the green arrows measure how far each lies beyond its own frontier. Switch on **identical opportunity costs** (Ben becomes 10 food or 5 cloth): the only acceptable price is 0.5 and both points fall back onto the frontiers.`,
      deps: ['micro-1.8'], refs: ['Mankiw Ch. 3'], tags: ['trade'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gains_from_trade' },
      viz(v) {
        const mode = v.select('', [{ value: 'auto', label: 'self-sufficiency' }, { value: 'trade', label: 'specialize & trade' }], 'trade');
        const same = v.toggle('identical opportunity costs', false);
        const X = v.slider('food Ana ships to Ben', 0, 10, 8, { step: 0.1 });
        const A = v.stage({ x: [0, 48], y: [-1.8, 24], height: 300, xticks: [10, 20, 30, 40], axes: 'box', xlabel: 'food', ylabel: 'cloth', title: 'Ana (40 food or 20 cloth)' });
        const B = v.stage({ x: [-0.6, 13.5], y: [-1.4, 19], height: 300, xticks: [2, 4, 6, 8, 10], axes: 'box', xlabel: 'food', ylabel: 'cloth' });
        let st = {};
        v.legend([['ink', 'production', { dot: true }], ['gold', 'consumption', { dot: true }], ['muted', 'self-sufficient bundle', { dot: true }], ['green', 'beyond own frontier']]);
        v.render(() => {
          const tr = mode.value === 'trade', Cb = same.value ? 5 : 16, p = same.value ? 0.5 : 0.8, x = X.value;
          X.el.hidden = !tr; B.setTitle(`Ben (10 food or ${Cb} cloth)`);
          const people = [
            { S: A, name: 'Ana', col: 'blue', Fm: 40, Cm: 20, aut: [30, 5], prod: [40, 0], cons: [40 - x, p * x] },
            { S: B, name: 'Ben', col: 'orange', Fm: 10, Cm: Cb, aut: [5, Cb / 2], prod: [0, Cb], cons: [x, Cb - p * x] },
          ];
          const out = [];
          for (const q of people) {
            const S = q.S, Yf = (f) => q.Cm * (1 - f / q.Fm);
            S.poly([[0, 0], [q.Fm, 0], [0, q.Cm]], { fill: q.col, fillAlpha: 0.1, stroke: false }); S.line(q.Fm, 0, 0, q.Cm, { color: q.col, width: 2.6 });
            S.dot(q.aut[0], q.aut[1], { r: 5, color: tr ? 'muted' : 'gold', hollow: tr, label: tr ? null : 'consume', labelPos: 'ne' });
            if (!tr) continue;
            const [cf, cc] = q.cons, gain = cc - Yf(cf);
            S.line(q.prod[0], q.prod[1], cf, cc, { color: 'muted', width: 1.6, dash: [5, 4] });
            S.arrow(q.aut[0], q.aut[1], cf, cc, { color: 'muted', width: 1, head: 5, alpha: 0.6 });
            if (gain > 0.05) S.arrow(cf, Yf(cf), cf, cc, { color: 'green', width: 2.2, head: 7 });
            S.dot(q.prod[0], q.prod[1], { r: 5, color: 'ink', label: 'produce', labelPos: q.name === 'Ana' ? 'nw' : 'ne' });
            S.dot(cf, cc, { r: 6, color: 'gold', label: 'consume', labelPos: 'ne' });
            out.push({ ...q, gain, gainF: cf - q.Fm * (1 - cc / q.Cm) });
          }
          st = { tr, p, x, out, same: same.value };
        });
        v.readout(() => {
          const { tr, p, x, out, same: eq } = st, f = (z) => v.fix(z, 2);
          if (!tr) return `Alone, each consumes on its own frontier: Ana (30, 5), Ben (5, ${eq ? 2.5 : 8}). Nothing outside a frontier can be reached by self-sufficient effort.`;
          const [a, b] = out;
          if (eq) return `Identical opportunity costs (0.5 cloth per food for both): Ana gains only if $p > 0.5$, Ben only if $p < 0.5$, so the only price both accept is $p = 0.5$ — and at it Ana consumes (${f(a.cons[0])}, ${f(a.cons[1])}) and Ben (${f(b.cons[0])}, ${f(b.cons[1])}), exactly on their frontiers: gains ${f(a.gain)} and ${f(b.gain)}.`;
          return `Ana makes 40 food, ships ${f(x)} for ${f(p * x)} cloth and consumes (${f(a.cons[0])}, ${f(a.cons[1])}): **${f(a.gain)} cloth** (or ${f(a.gainF)} food) beyond her frontier. Ben makes 16 cloth and consumes (${f(b.cons[0])}, ${f(b.cons[1])}): **${f(b.gain)} cloth** (or ${f(b.gainF)} food) beyond his. Total food rises from 35 to 40 and cloth from 13 to 16.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Concept', name: 'Terms of trade',
      statement: String.raw`The **terms of trade** are the rate at which one good exchanges for the other, here $p$ units of cloth per unit of food. Between two producers with opportunity costs of food $o_A < o_B$, voluntary exchange (Ana selling food, Ben selling cloth) benefits both exactly when $o_A < p < o_B$; at $p = o_A$ or $p = o_B$ one side gains nothing, and outside $[o_A, o_B]$ one side is better off not trading.`,
      idea: String.raw`Selling a unit of food earns Ana $p$ cloth while making that cloth herself would have cost her the food's opportunity cost $o_A$, so she gains $p - o_A$ per unit. Ben gains $1/p - 1/o_B$ food per cloth he sells. Both are positive exactly on the band between the opportunity costs. Where in the band the price lands decides how the gains are split, not whether they exist.`,
      caption: String.raw`Drag the price $p$. Left: each side's gain per unit traded; the green band between the opportunity costs is where both are positive (red dashed: that side would refuse). Right: each producer's trading line through its specialization point; where it lies outside the frontier (shaded) trade beats self-sufficiency.`,
      deps: ['micro-1.9'], refs: ['Mankiw Ch. 3'], tags: ['trade', 'prices'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Terms_of_trade' },
      viz(v) {
        const oA = 0.5, oB = 1.6;
        const g = v.stage({ x: [0, 2.6], y: [-1.1, 1.4], height: 330, xlabel: 'price p (cloth per food)', ylabel: 'gain per unit sold', title: 'who gains at price p' });
        const q = v.stage({ x: [0, 48], y: [-2, 40], height: 330, xticks: [10, 20, 30, 40], axes: 'box', xlabel: 'food', ylabel: 'cloth', title: 'trading lines vs frontiers' });
        const P = g.handle(1, 0, { color: 'gold', label: 'p', constrain: (x) => [clamp(x, 0.15, 2.55), 0] });
        const gA = (p) => p - oA, gB = (p) => 1 / p - 1 / oB;
        v.legend([['blue', 'Ana: cloth gained per food sold'], ['orange', 'Ben: food gained per cloth sold'], ['green', 'both gain']]);
        v.render(() => {
          const p = P.x;
          g.vband(oA, oB, { color: 'green', alpha: 0.12 });
          g.vline(oA, { color: 'blue', dash: [4, 4], width: 1 }); g.vline(oB, { color: 'orange', dash: [4, 4], width: 1 });
          g.text('Ana’s cost 0.5', oA, -1.0, { dx: -4, align: 'right', color: 'blue', size: 11 }); g.text('Ben’s cost 1.6', oB, -1.0, { dx: 4, color: 'orange', size: 11 });
          g.fn(gA, { domain: [oA, 2.6], color: 'blue', width: 2.4 }); g.fn(gA, { domain: [0, oA], color: 'red', width: 2, dash: [5, 4] });
          g.fn(gB, { domain: [0.4, oB], color: 'orange', width: 2.4 }); g.fn(gB, { domain: [oB, 2.6], color: 'red', width: 2, dash: [5, 4] });
          g.vline(p, { color: 'gold', width: 1.4 }); g.dot(p, gA(p), { r: 5, color: 'blue' }); if (gB(p) < 1.4) g.dot(p, gB(p), { r: 5, color: 'orange' });
          if (p < oA) g.text('Ana refuses', 0.25, -0.5, { color: 'red', size: 11.5, weight: 600 });
          if (p > oB) g.text('Ben refuses', 2.1, -0.5, { color: 'red', size: 11.5, weight: 600, align: 'center' });
          // trading lines
          const PA = (f) => 20 * (1 - f / 40), TA = (f) => p * (40 - f), PB = (f) => Math.max(0, 16 * (1 - f / 10)), TB = (f) => Math.max(0, 16 - p * f);
          q.between(TA, PA, 0, 40, { fill: gA(p) >= 0 ? 'blue' : 'red', fillAlpha: 0.15, n: 80 });
          q.between(TB, PB, 0, Math.max(10, 16 / p), { fill: gB(p) >= 0 ? 'orange' : 'red', fillAlpha: 0.15, n: 120 });
          q.line(40, 0, 0, 20, { color: 'blue', width: 2.4 }); q.line(10, 0, 0, 16, { color: 'orange', width: 2.4 });
          q.fn(TA, { domain: [0, 40], color: 'blue', width: 1.6, dash: [6, 4] }); q.fn(TB, { domain: [0, 16 / p], color: 'orange', width: 1.6, dash: [6, 4] });
          q.dot(40, 0, { r: 5, color: 'blue', label: 'Ana', labelPos: 'n' }); q.dot(0, 16, { r: 5, color: 'orange', label: 'Ben', labelPos: 'e' });
        });
        v.readout(() => {
          const p = P.x, f = (x) => v.fix(x, 2), a = gA(p), b = gB(p);
          const verdict = a > 0.005 && b > 0.005 ? 'Both gain: $p$ lies strictly between the opportunity costs.' : Math.abs(a) <= 0.005 ? 'At Ana’s own opportunity cost she gains nothing.' : Math.abs(b) <= 0.005 ? 'At Ben’s own opportunity cost he gains nothing.' : a < 0 ? 'Ana refuses: selling food earns less cloth than she could make herself.' : 'Ben refuses: buying food costs more cloth than making it himself.';
          return `$p = ${f(p)}$ cloth per food. Ana gains $p - 0.5 = ${f(a)}$ cloth per food sold; Ben gains $1/p - 1/1.6 = ${f(b)}$ food per cloth sold. ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Model', name: 'Ricardian model of international trade',
      statement: String.raw`Two countries produce two goods with labour alone at constant (and different) labour costs per unit. Their combined, world frontier is kinked at the point where each country is fully specialized in its comparative-advantage good. Under free trade the world relative price $p$ of food lies in the closed interval between the two autarky prices (the opportunity costs): if it lies strictly inside, both countries specialize completely; if it equals one country's autarky price, that country produces both goods and gains nothing from trade, while the other gains.`,
      scope: String.raw`One factor (labour), constant returns, perfect competition, no transport costs; world demand here comes from a Cobb–Douglas consumer spending share $s$ on food.`,
      idea: String.raw`At price $p$ each country produces only the good whose price exceeds its opportunity cost, so world relative supply $F/C$ is a staircase: zero below Home's autarky price, vertical at the fully specialized ratio between the two autarky prices, unbounded above Foreign's. Relative demand $F/C = s/((1-s)p)$ is decreasing. Their intersection is the equilibrium; strong demand for food pushes it onto Foreign's flat step, weak demand onto Home's.`,
      caption: String.raw`Slide the world's spending share on food. Left: the kinked world frontier, the equilibrium production point, the price line and the indifference curve touching there. Right: the staircase of relative supply against the relative-demand curve; their intersection moves along the two autarky-price steps or up the vertical segment at the kink.`,
      deps: ['micro-1.8', 'micro-1.10'], refs: ['Varian Ch. 33', 'CORE Unit 18'], tags: ['trade'],
      credit: 'David Ricardo, 1817; general equilibrium version by J. S. Mill, 1848',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ricardian_model' },
      viz(v) {
        const Hm = { F: 100, C: 50 }, Fo = { F: 30, C: 40 }, oH = Hm.C / Hm.F, oF = Fo.C / Fo.F, k = Hm.F / Fo.C;
        const sh = v.slider('world spending share on food $s$', 0.05, 0.95, 0.65, { step: 0.01 });
        const w = v.stage({ x: [0, 150], y: [0, 100], height: 340, axes: 'box', xticks: [25, 50, 75, 100], xlabel: 'world food', ylabel: 'world cloth', title: 'world frontier: Home + Foreign' });
        const r = v.stage({ x: [0, 6], y: [0, 2.3], height: 340, axes: 'box', xticks: [1, 2, 3], xlabel: 'relative quantity F/C', ylabel: 'relative price p', title: 'relative supply and demand' });
        const eq = (s) => {
          const rd = (p) => s / ((1 - s) * p), pk = s / ((1 - s) * k);
          if (pk <= oH) { const rr = rd(oH), CH = (Hm.F - rr * Fo.C) / (rr + Hm.F / Hm.C), FH = Hm.F - (Hm.F / Hm.C) * CH; return { p: oH, F: FH, C: CH + Fo.C, reg: 'home', FH, CH, FF: 0, CF: Fo.C }; }
          if (pk >= oF) { const rr = rd(oF), CF = (1 + Hm.F / Fo.F) / (rr / Fo.F + 1 / Fo.C), FF = Fo.F * (1 - CF / Fo.C); return { p: oF, F: Hm.F + FF, C: CF, reg: 'foreign', FH: Hm.F, CH: 0, FF, CF }; }
          return { p: pk, F: Hm.F, C: Fo.C, reg: 'both', FH: Hm.F, CH: 0, FF: 0, CF: Fo.C };
        };
        v.legend([['green', 'world frontier / relative supply'], ['purple', 'world demand'], ['gold', 'equilibrium', { dot: true }], ['accent', 'price line', { dash: true }]]);
        v.render(() => {
          const s = sh.value, E = eq(s), W = [[0, Hm.C + Fo.C], [Hm.F, Fo.C], [Hm.F + Fo.F, 0]];
          w.poly([[0, 0], ...W], { fill: 'green', fillAlpha: 0.08, stroke: false }); w.path(W, { color: 'green', width: 2.6 });
          w.text('Home: all food · Foreign: all cloth', Hm.F, Fo.C, { dx: -10, dy: 16, align: 'right', color: 'green', size: 11 });
          w.text('Home’s slope −0.5', 18, 64, { color: 'muted', size: 10.5 }); w.text('Foreign’s slope −1.33', 112, 15, { color: 'muted', size: 10.5, align: 'right', dx: -6 });
          const U = E.F ** s * E.C ** (1 - s), Cind = (f) => (U / f ** s) ** (1 / (1 - s));
          w.fn(Cind, { domain: [3, 145], color: 'purple', width: 1.8 });
          w.fn((f) => E.C - E.p * (f - E.F), { domain: [0, 145], color: 'accent', width: 1.4, dash: [6, 4] });
          w.dot(E.F, E.C, { r: 6, color: 'gold' });
          // RS–RD
          r.hline(oH, { color: 'faint', dash: [3, 4] }); r.hline(oF, { color: 'faint', dash: [3, 4] });
          r.text('Home autarky price 0.5', 5.95, oH, { dy: -9, align: 'right', color: 'muted', size: 11 }); r.text('Foreign autarky price 1.33', 5.95, oF, { dy: -9, align: 'right', color: 'muted', size: 11 });
          r.path([[0, oH], [k, oH], [k, oF], [6, oF]], { color: 'green', width: 3 }); r.text('RS', k, (oH + oF) / 2, { dx: 8, color: 'green', size: 14, math: true });
          r.fn((x) => s / ((1 - s) * x), { domain: [0.05, 6], color: 'purple', width: 2.4 }); { const xl = clamp(s / ((1 - s) * 1.9), 0.5, 5.4); r.text('RD', xl, s / ((1 - s) * xl), { dx: 10, dy: -4, color: 'purple', size: 14, math: true }); }
          r.dot(E.F / E.C, E.p, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const E = eq(sh.value), f = (x) => v.fix(x, 2);
          const reg = E.reg === 'both' ? 'Both countries specialize completely and the price lies **strictly between** the autarky prices: both gain.' : E.reg === 'home' ? `Demand for food is weak: Home produces both goods (${f(E.FH)} food, ${f(E.CH)} cloth), so $p$ equals **Home’s autarky price** — Home gains nothing, Foreign takes all the gains.` : `Demand for food is strong: Foreign produces both goods (${f(E.FF)} food, ${f(E.CF)} cloth), so $p$ equals **Foreign’s autarky price** — Foreign gains nothing, Home takes all the gains.`;
          return `Equilibrium $p = ${f(E.p)}$ cloth per food, world output (${f(E.F)}, ${f(E.C)}), $F/C = ${f(E.F / E.C)}$. ${reg}`;
        });
      },
    },
  ],
};
