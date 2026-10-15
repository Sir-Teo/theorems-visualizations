// Information & Coding Theory — Chapter 1: Entropy (items 1.7–1.12; 1.1–1.6 and the house-style notes in ch01.js)

import { clamp, sum, H, LET, commas, dragBars, hashStr, viewPad, legender, titler } from './ch01.shared.js';

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUB[+d]).join('');

/** Rényi entropy of order α (bits): α = 0 Hartley, α = 1 Shannon, α = ∞ min-entropy; stable for large α. */
function renyi(p, a) {
  const q = p.filter((x) => x > 0); if (!q.length) return 0;
  if (a === 0) return Math.log2(q.length);
  if (a === Infinity) return -Math.log2(Math.max(...q));
  if (Math.abs(a - 1) < 1e-7) return H(q);
  const m = Math.max(...q); let s = 0; for (const x of q) s += Math.pow(x / m, a);
  return (a * Math.log2(m) + Math.log2(s)) / (1 - a);
}

export default {
  collection: 'info',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Chain rule for entropy',
      statement: String.raw`For discrete random variables $X$ and $Y$,
$$H(X,Y)=H(X)+H(Y\mid X)=H(Y)+H(X\mid Y),$$
and more generally, for $X_1,\dots,X_n$ taken in any order,
$$H(X_1,\dots,X_n)=\sum_{i=1}^n H(X_i\mid X_1,\dots,X_{i-1}).$$
In particular $H(X,Y)\ge\max\{H(X),H(Y)\}$, and $H(X)-H(X\mid Y)=H(Y)-H(Y\mid X)$: the two variables tell each other the same amount. (That this common amount is never negative, so that $H(X,Y)\le H(X)+H(Y)$ with equality exactly for independent variables, is info-2.7.)`,
      idea: String.raw`The identity holds pointwise before any averaging: $p(x,y)=p(x)\,p(y\mid x)$, so $\log\frac1{p(x,y)}=\log\frac1{p(x)}+\log\frac1{p(y\mid x)}$, and taking expectations over $p(x,y)$ gives $H(X,Y)=H(X)+H(Y\mid X)$ by the definitions of 1.6. Factoring the other way, $p(x,y)=p(y)\,p(x\mid y)$, gives the second form, and induction on $n$ with $p(x_1,\dots,x_n)=\prod_i p(x_i\mid x_1,\dots,x_{i-1})$ gives the general one. In the mosaic picture: to name a cell, first name its column, which costs $H(X)$ bits on average, then its row inside that column, which costs $H(Y\mid X=x)$ bits in column $x$.`,
      caption: String.raw`Every joint distribution of a $3\times3$ pair is a mosaic: drag the blue knobs on the top edge to set the column widths $p(x)$ and the teal knobs inside a column to set its heights $p(y\mid x)$; the area of each tile is $p(x,y)$. The first bar stacks $H(X)$ and $H(Y\mid X)$, the latter split into the columns' shares $p(x)H(Y\mid X=x)$; the second stacks $H(Y)$ and $H(X\mid Y)$. Both always reach the green line $H(X,Y)$, computed directly from the nine tiles. The third bar pretends the variables are independent and overshoots by the shared information (red); switch on *make Y independent of X* and the overshoot vanishes.`,
      deps: ['info-1.6'],
      refs: ['Cover–Thomas §2.5'],
      tags: ['chain rule', 'joint entropy'],
      credit: 'Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chain_rule_for_conditional_entropy' },
      viz(v) {
        let px = [0.45, 0.3, 0.25], cond = [[0.7, 0.2, 0.1], [0.15, 0.6, 0.25], [0.25, 0.3, 0.45]];
        const margY = () => [0, 1, 2].map((j) => px[0] * cond[0][j] + px[1] * cond[1][j] + px[2] * cond[2][j]);
        const ind = v.toggle('make $Y$ independent of $X$', false, { onChange: (on) => { if (on) { const py = margY(); cond = [0, 1, 2].map(() => py.slice()); } } });
        const sM = v.stage({ x: [-0.08, 1.08], y: [-0.25, 1.1], height: 350, equal: true, axes: false, title: 'mosaic: widths $p(x)$, heights $p(y\\mid x)$' });
        const sB = v.stage({ x: [0, 1], y: [0, 3.5], height: 350, axes: 'box', title: 'stacked entropies (bits)' });
        const YK = 1.045, edges = () => [0, px[0], px[0] + px[1], 1], colC = (k) => { const e = edges(); return (e[k] + e[k + 1]) / 2; };
        const cA = sM.handle(px[0], YK, { color: 'accent', constrain: (x) => [clamp(x, 0, cB.x), YK] });
        const cB = sM.handle(px[0] + px[1], YK, { color: 'accent', constrain: (x) => [clamp(x, cA.x, 1), YK] });
        cA.onDrag = cB.onDrag = () => { px = [cA.x, cB.x - cA.x, 1 - cB.x]; };
        const rH = [0, 1, 2].map((k) => [0, 1].map((j) => sM.handle(0, 0, { color: 'teal', r: 6, constrain: (x, y) => [colC(k), clamp(y, j === 0 ? 0 : rH[k][0].y, j === 0 ? rH[k][1].y : 1)] })));
        rH.forEach((pair, k) => pair.forEach((h) => { h.onDrag = () => { const a = pair[0].y, b = pair[1].y, row = [a, b - a, 1 - b]; if (ind.value) cond = [0, 1, 2].map(() => row.slice()); else cond[k] = row; }; }));
        const YC = ['teal', 'gold', 'pink'];
        const stats = () => {
          const py = margY(), rowH = cond.map((c) => H(c)), colH = [0, 1, 2].map((j) => H([0, 1, 2].map((k) => px[k] * cond[k][j])));
          const HX = H(px), HY = H(py), HXY = H(px.flatMap((w, k) => cond[k].map((q) => w * q)));
          return { py, rowH, colH, HX, HY, HXY, HYgX: sum(px.map((w, k) => w * rowH[k])), HXgY: sum(py.map((w, j) => w * colH[j])) };
        };
        v.legend([['accent', '$H(X)$ and $H(X\\mid Y)$', { area: true }], ['teal', '$H(Y)$ and $H(Y\\mid X)$', { area: true }], ['green', '$H(X,Y)$ from the tiles', { dash: true }], ['red', 'overcount', { area: true }], ['gold', 'tiles: $y_1$ teal, $y_2$ gold, $y_3$ pink', { area: true }]]);
        v.render(() => {
          const S = stats(), e = edges();
          // keep the knobs on the state
          cA.x = e[1]; cB.x = e[2]; cA.y = cB.y = YK;
          rH.forEach((pair, k) => { pair[0].x = pair[1].x = colC(k); pair[0].y = cond[k][0]; pair[1].y = cond[k][0] + cond[k][1]; pair.forEach((h) => (h.visible = px[k] > 0.02)); });
          // ── the mosaic
          for (let k = 0; k < 3; k++) {
            const x0 = e[k], x1 = e[k + 1], wpx = sM.X(x1) - sM.X(x0); let y = 0;
            for (let j = 0; j < 3; j++) {
              const h = cond[k][j];
              if (h > 0 && x1 > x0) sM.rect(x0, y, x1, y + h, { fill: YC[j], fillAlpha: 0.42, color: 'panel', width: 1 });
              if (wpx > 40 && sM.Y(y) - sM.Y(y + h) > 17) sM.text(v.fix(px[k] * h, 3), (x0 + x1) / 2, y + h / 2, { align: 'center', size: 10.5, color: 'ink', weight: 600 });
              y += h;
            }
            if (wpx > 22) sM.tex(`x_${k + 1}`, (x0 + x1) / 2, 0, { dy: 13, color: 'accent', size: 14 });
            if (wpx > 74) sM.text(`p = ${v.fix(px[k], 2)}`, (x0 + x1) / 2, 0, { dy: 31, align: 'center', size: 11, color: 'accent', weight: 600 });
            if (wpx > 74) sM.text(`H(Y|x${sub(k + 1)}) = ${v.fix(S.rowH[k], 2)}`, (x0 + x1) / 2, 0, { dy: 46, align: 'center', size: 11, color: 'teal', weight: 600 });
          }
          sM.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          [e[1], e[2]].forEach((x) => sM.line(x, 0, x, YK, { color: 'accent', width: 2 }));
          // ── the bars
          viewPad(sB, [0, 1], [0, 3.55]); sB.setTicks([[0.17, 'X, then Y'], [0.5, 'Y, then X'], [0.83, 'as if independent']], null);
          const w = 0.1;
          const seg = (x, y0, y1, col, a, lab) => {
            if (y1 - y0 <= 1e-9) return;
            sB.rect(x - w, y0, x + w, y1, { fill: col, fillAlpha: a, color: col, width: 1 });
            if (lab && sB.Y(y0) - sB.Y(y1) > 17) sB.tex(lab, x, (y0 + y1) / 2, { size: 12.5, color: 'ink' });
          };
          seg(0.17, 0, S.HX, 'accent', 0.6, 'H(X)');
          let y = S.HX; px.forEach((wk, k) => { const d = wk * S.rowH[k]; seg(0.17, y, y + d, 'teal', k % 2 ? 0.25 : 0.45, `x_${k + 1}`); y += d; });
          seg(0.5, 0, S.HY, 'teal', 0.6, 'H(Y)');
          y = S.HY; S.py.forEach((wj, j) => { const d = wj * S.colH[j]; seg(0.5, y, y + d, 'accent', j % 2 ? 0.25 : 0.45, `y_${j + 1}`); y += d; });
          const over = S.HX + S.HY - S.HXY;
          seg(0.83, 0, S.HX, 'accent', 0.6, 'H(X)'); seg(0.83, S.HX, Math.min(S.HXY, S.HX + S.HY), 'teal', 0.6, 'H(Y)');
          if (over > 1e-4) { seg(0.83, S.HXY, S.HX + S.HY, 'red', 0.45, null); sB.text(`overcount +${v.fix(over, 2)}`, 0.83, S.HX + S.HY, { dy: -10, align: 'center', size: 10.5, color: 'red', weight: 700 }); }
          sB.text(`H(Y|X) ${v.fix(S.HYgX, 2)}`, 0.17, S.HXY, { dy: -10, align: 'center', size: 10.5, color: 'teal', weight: 600 });
          sB.text(`H(X|Y) ${v.fix(S.HXgY, 2)}`, 0.5, S.HXY, { dy: -10, align: 'center', size: 10.5, color: 'accent', weight: 600 });
          sB.hline(S.HXY, { color: 'green', width: 2, dash: [7, 4] });
          sB.text('H(X,Y)', 0.335, S.HXY, { dy: 12, align: 'center', size: 11, color: 'green', weight: 700 });
          sB.text(v.fix(S.HXY, 3), 0.335, S.HXY, { dy: 26, align: 'center', size: 11, color: 'green', weight: 700 });
        });
        v.readout(() => {
          const S = stats(), over = S.HX + S.HY - S.HXY;
          return String.raw`$H(X,Y) = ${v.fix(S.HXY, 4)}$ bits from the tiles · $H(X) + H(Y\mid X) = ${v.fix(S.HX, 3)} + ${v.fix(S.HYgX, 3)} = ${v.fix(S.HX + S.HYgX, 4)}$ ✓ · $H(Y) + H(X\mid Y) = ${v.fix(S.HY, 3)} + ${v.fix(S.HXgY, 3)} = ${v.fix(S.HY + S.HXgY, 4)}$ ✓ · ` + (over > 1e-6 ? String.raw`$H(X) + H(Y) = ${v.fix(S.HX + S.HY, 3)}$ overcounts by the shared $${v.fix(over, 3)}$ bits` : String.raw`$H(X) + H(Y) = H(X,Y)$: independent, nothing shared`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Grouping property',
      statement: String.raw`Partition the outcomes of a distribution $p=(p_1,\dots,p_n)$ into groups $G_1,\dots,G_k$ with probabilities $q_g=\sum_{i\in G_g}p_i$. Then
$$H(p_1,\dots,p_n)=H(q_1,\dots,q_k)+\sum_{g:\,q_g>0}q_g\,H\Big(\frac{p_i}{q_g}:i\in G_g\Big).$$
The uncertainty of the outcome equals the uncertainty of its group plus the average uncertainty of the outcome within its group. The simplest case, merging two outcomes, reads $H(p_1,p_2,p_3,\dots)=H(p_1+p_2,p_3,\dots)+(p_1+p_2)\,h\big(\tfrac{p_1}{p_1+p_2}\big)$.`,
      idea: String.raw`Let $G$ be the label of the group containing the outcome $X$. Since $G$ is a function of $X$, the pair $(X,G)$ carries the same information as $X$, so $H(X)=H(X,G)$; the chain rule (1.7) splits this as $H(G)+H(X\mid G)$, and $H(X\mid G)=\sum_g q_g H(X\mid G=g)$ where the conditional law of $X$ given $G=g$ is $p_i/q_g$ on $G_g$. In terms of questions: ask first for the group, which costs $H(q)$ bits, then for the outcome inside it, which costs $H(\cdot\mid g)$ bits but is needed only a fraction $q_g$ of the time. Shannon used this decomposition, with continuity and monotonicity, as an axiom that characterizes entropy (1.9).`,
      caption: String.raw`Drag an outcome into another group (or click it to move it to the next group). The tree asks first *which group?* (orange, edges labelled $q_g$) and then *which outcome?* inside the group (blue, edges labelled $p_i/q_g$); under each group node is its within-group entropy. The right panel checks the bookkeeping: $H(q)$ plus the weighted within-group entropies always stacks up to $H(p)$. Switch on *forget the weights* to add the within-group entropies unweighted: the stack overshoots, because the second question is not always asked.`,
      deps: ['info-1.7'],
      refs: ['Cover–Thomas §2.5'],
      tags: ['grouping', 'entropy'],
      credit: 'Shannon, 1948',
      viz(v) {
        const P = [0.24, 0.18, 0.16, 0.13, 0.11, 0.1, 0.08];
        const DEF = { 2: [0, 0, 0, 1, 1, 1, 1], 3: [0, 0, 1, 1, 1, 2, 2], 4: [0, 0, 1, 1, 2, 2, 3] };
        let K = 3, g = DEF[3].slice(), drag = null;
        v.select('number of groups', ['2', '3', '4'], '3', { onChange: (k) => { K = +k; g = DEF[K].slice(); } });
        const wrong = v.toggle('forget the weights $q_g$', false);
        const sT = v.stage({ x: [0, 10], y: [0, 6.3], height: 350, equal: true, axes: false, weight: 1.55, title: 'first ask for the group, then for the outcome' });
        const sB = v.stage({ x: [0, 1], y: [0, 3.2], height: 350, axes: 'box', title: 'the bookkeeping (bits)' });
        const colW = () => 9.4 / K, GN = 'ABCD';
        const leafPos = () => {
          const pos = [];
          for (let k = 0; k < K; k++) { const mem = []; g.forEach((x, i) => { if (x === k) mem.push(i); }); mem.forEach((i, j) => (pos[i] = [0.3 + colW() * k + (colW() * (j + 0.5)) / mem.length, 1.3])); }
          return pos;
        };
        const hit = (x, y) => { let best = -1, bd = 0.6; leafPos().forEach(([lx, ly], i) => { const d = Math.hypot(lx - x, ly - y); if (d < bd) { bd = d; best = i; } }); return best; };
        sT.onDrag((x, y, ph) => {
          if (ph === 'start') { const i = hit(x, y); drag = i >= 0 ? { i, x, y, moved: false } : null; return; }
          if (!drag) return;
          if (Math.hypot(x - drag.x, y - drag.y) > 0.15) drag.moved = true;
          drag.x = x; drag.y = y;
          if (ph === 'end') { if (drag.moved) g[drag.i] = clamp(Math.floor((x - 0.3) / colW()), 0, K - 1); else g[drag.i] = (g[drag.i] + 1) % K; drag = null; }
        });
        const stats = () => {
          const q = new Array(K).fill(0); P.forEach((p, i) => (q[g[i]] += p));
          const Hg = q.map((_, k) => H(P.filter((__, i) => g[i] === k)));
          return { q, Hg, Hq: H(q), Hp: H(P), within: sum(q.map((qk, k) => qk * Hg[k])), plain: sum(Hg) };
        };
        const lg = legender(v);
        v.render(() => {
          const S = stats(), pos = leafPos(), cw = colW(), root = [5, 5.55];
          if (drag && drag.moved) { const t = clamp(Math.floor((drag.x - 0.3) / cw), 0, K - 1); sT.rect(0.3 + cw * t, 0.35, 0.3 + cw * (t + 1), 4.5, { fill: 'gold', fillAlpha: 0.1, stroke: false }); }
          for (let k = 1; k < K; k++) sT.line(0.3 + cw * k, 0.4, 0.3 + cw * k, 4.4, { color: 'faint', width: 1, dash: [3, 4] });
          for (let k = 0; k < K; k++) {
            const gx = 0.3 + cw * (k + 0.5), gy = 3.6, qk = S.q[k];
            sT.line(root[0], root[1], gx, gy, { color: 'orange', width: 1.2 + 5 * qk, alpha: qk > 0 ? 0.85 : 0.3 });
            const side = gx < root[0] - 0.2 ? -1 : gx > root[0] + 0.2 ? 1 : 0;
            sT.text(`q = ${v.fix(qk, 2)}`, (root[0] + gx) / 2, (root[1] + gy) / 2, { dx: side < 0 ? -6 : 8, dy: side ? -9 : 0, align: side < 0 ? 'right' : 'left', size: 11, color: 'orange', weight: 700 });
            g.forEach((x, i) => {
              if (x !== k || (drag && drag.moved && drag.i === i)) return;
              const [lx, ly] = pos[i];
              sT.line(gx, gy, lx, ly, { color: 'accent', width: 1 + 4 * (P[i] / Math.max(qk, 1e-9)) * 0.6, alpha: 0.7 });
              sT.text(v.fix(P[i] / qk, 2), (gx + 2 * lx) / 3, (gy + 2 * ly) / 3 + 0.12, { align: 'center', size: 10, color: 'accent' });
            });
            sT.dot(gx, gy, { r: 15, color: qk > 0 ? 'orange' : 'faint', hollow: true, width: 2.2 });
            sT.text(GN[k], gx, gy, { align: 'center', size: 12.5, weight: 700, color: 'orange' });
            sT.text(qk > 0 ? `H = ${v.fix(S.Hg[k], 2)}` : 'empty', gx, gy, { dx: 20, align: 'left', size: 11, color: qk > 0 ? 'accent' : 'muted', weight: 600 });
          }
          sT.dot(root[0], root[1], { r: 15, color: 'ink', hollow: true, width: 2.2 }); sT.text('?', root[0], root[1], { align: 'center', size: 14, weight: 700 });
          sT.text(`which group?  H(q) = ${v.fix(S.Hq, 3)} bits`, root[0], root[1], { dx: 22, align: 'left', size: 11.5, color: 'orange', weight: 600 });
          P.forEach((p, i) => {
            const [lx, ly] = drag && drag.moved && drag.i === i ? [drag.x, drag.y] : pos[i];
            sT.dot(lx, ly, { r: 7 + 18 * Math.sqrt(p), color: 'accent', alpha: 0.8 });
            sT.text(LET[i], lx, ly, { align: 'center', size: 12.5, weight: 700, color: 'panel', halo: false });
            sT.text(v.fix(p, 2), lx, ly, { dy: 22, align: 'center', size: 10.5, color: 'muted' });
          });
          // ── bars
          const tot = wrong.value ? S.Hq + S.plain : S.Hq + S.within;
          viewPad(sB, [0, 1], [0, Math.max(3.2, tot + 0.3)]); sB.setTicks([[0.25, 'directly'], [0.7, 'in two stages']], null);
          sB.rect(0.13, 0, 0.37, S.Hp, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.5 });
          sB.rect(0.58, 0, 0.82, S.Hq, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          if (sB.Y(0) - sB.Y(S.Hq) > 18) sB.tex('H(q)', 0.7, S.Hq / 2, { size: 13 });
          let y = S.Hq;
          for (let k = 0; k < K; k++) {
            const d = wrong.value ? S.Hg[k] : S.q[k] * S.Hg[k]; if (d <= 1e-9) continue;
            const over = wrong.value && y + d > S.Hp;
            sB.rect(0.58, y, 0.82, y + d, { fill: 'accent', fillAlpha: k % 2 ? 0.28 : 0.5, color: 'accent', width: 1 });
            if (sB.Y(y) - sB.Y(y + d) > 16) sB.tex(wrong.value ? `H_{${GN[k]}}` : `q_{${GN[k]}}H_{${GN[k]}}`, 0.7, y + d / 2, { size: 12, color: over ? 'red' : 'ink' });
            y += d;
          }
          if (wrong.value && tot > S.Hp + 1e-9) sB.rect(0.58, S.Hp, 0.82, tot, { color: 'red', width: 2.2, fill: 'red', fillAlpha: 0.18 });
          sB.hline(S.Hp, { color: 'green', width: 2, dash: [7, 4] });
          sB.text(`H(p) = ${v.fix(S.Hp, 3)}`, 0.25, S.Hp, { dy: -10, align: 'center', size: 11.5, color: 'green', weight: 700 });
          lg([['accent', 'outcomes (size: probability)', { dot: true }], ['orange', 'first question: the group'], ['accent', 'second question: inside the group'], ...(wrong.value ? [['red', 'overshoot', { area: true }]] : [['green', '$H(p)$', { dash: true }]])]);
        });
        v.readout(() => {
          const S = stats();
          if (wrong.value) return String.raw`$H(q) + \sum_g H(p\mid g) = ${v.fix(S.Hq, 3)} + ${v.fix(S.plain, 3)} = ${v.fix(S.Hq + S.plain, 3)}$ overshoots $H(p) = ${v.fix(S.Hp, 3)}$ by ${v.fix(S.Hq + S.plain - S.Hp, 3)}: the question inside group $g$ is asked only with probability $q_g$`;
          return String.raw`$H(p) = ${v.fix(S.Hp, 4)}$ bits $= H(q) + \sum_g q_g H(p\mid g) = ${v.fix(S.Hq, 3)} + (${S.q.map((qk, k) => (qk > 0 ? v.fix(qk, 2) + '\\cdot' + v.fix(S.Hg[k], 2) : null)).filter(Boolean).join(' + ')}) = ${v.fix(S.Hq + S.within, 4)}$ ✓`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Uniqueness of entropy from Shannon’s axioms',
      statement: String.raw`Let $H_n(p_1,\dots,p_n)$, $n\ge1$, be functions on finite probability vectors such that
(i) each $H_n$ is continuous in $(p_1,\dots,p_n)$;
(ii) $A(n)=H_n(\tfrac1n,\dots,\tfrac1n)$ is strictly increasing in $n$;
(iii) (grouping) $H_n(p_1,\dots,p_n)=H_{n-1}(p_1+p_2,p_3,\dots,p_n)+(p_1+p_2)\,H_2\big(\tfrac{p_1}{p_1+p_2},\tfrac{p_2}{p_1+p_2}\big)$ whenever $p_1+p_2>0$, and $H$ is symmetric in its arguments.
Then there is a constant $K>0$ with $H_n(p)=-K\sum_ip_i\log p_i$ for all $n$ and $p$. The constant is only the choice of unit (bits for $K=1/\ln 2$ with natural logs). Additivity over independent pairs, $H(P\otimes Q)=H(P)+H(Q)$, follows from the axioms but does not replace grouping: the Rényi entropies are additive and continuous yet violate (iii).`,
      idea: String.raw`Grouping applied to $mn$ equally likely outcomes split into $m$ groups of $n$ gives $A(mn)=A(m)+A(n)$; a monotone function with this property must be $A(n)=K\log n$ (compare $A(2^k)$ with $A(n^j)$ for large exponents), and monotonicity forces $K>0$. For rational probabilities $p_i=k_i/N$, refine each outcome into $k_i$ equally likely pieces: grouping (1.8) gives $K\log N=H(p)+\sum_ip_iK\log k_i$, so $H(p)=-K\sum p_i\log p_i$; continuity extends this to all real $p$. Each axiom is needed: a negative multiple of entropy satisfies everything but monotonicity, Hartley's $\log|\supp p|$ fails continuity, and the Rényi and Gini measures fail grouping.`,
      caption: String.raw`The table runs four tests on seven candidate measures of uncertainty; click a row (or use the selector) to inspect one. Continuity is tested at the edge $t\to0$ of $f(t,1-t)$, monotonicity on the uniform distributions, additivity on your distribution $P$ paired with an independent $Q=(0.7,0.3)$, and grouping on your $P$ with the first two outcomes merged. Drag the bars of $P$: Shannon's formula, in any unit, passes everything; every other candidate fails somewhere (the bottom panels show where), and the failures do not depend on the test distribution you pick, apart from degenerate ones.`,
      deps: ['info-1.8'],
      refs: ['Cover–Thomas ch. 2', 'Khinchin, Mathematical Foundations of Information Theory'],
      tags: ['axioms', 'entropy', 'uniqueness'],
      credit: 'Shannon, 1948; Khinchin, 1953; Faddeev, 1956',
      viz(v) {
        const CANDS = [
          { key: 'shannon', name: 'Shannon (bits)', tex: '-\\sum p\\log_2 p', f: (p) => H(p) },
          { key: 'nats', name: 'Shannon (nats)', tex: '-\\sum p\\ln p', f: (p) => H(p) * Math.LN2 },
          { key: 'neg', name: 'negated', tex: '+\\sum p\\log_2 p', f: (p) => -H(p) },
          { key: 'renyi', name: 'Rényi-2', tex: '-\\log_2\\sum p^2', f: (p) => -Math.log2(sum(p.map((x) => x * x))) },
          { key: 'min', name: 'min-entropy', tex: '-\\log_2\\max p', f: (p) => -Math.log2(Math.max(...p)) },
          { key: 'hartley', name: 'Hartley', tex: '\\log_2|\\supp p|', f: (p) => Math.log2(p.filter((x) => x > 0).length) },
          { key: 'gini', name: 'Gini–Simpson', tex: '1-\\sum p^2', f: (p) => 1 - sum(p.map((x) => x * x)) },
        ];
        const P = [0.5, 0.3, 0.2], Q = [0.7, 0.3];
        const cs = v.select('candidate', CANDS.map((c) => ({ value: c.key, label: c.name })), 'gini');
        const sP = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', weight: 0.85, minWidth: 240, title: 'test distribution $P$ (drag)' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, weight: 1.6, minWidth: 470, title: 'four tests, seven candidates (click a row)' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', minWidth: 230 });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', minWidth: 230 });
        const sG = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', minWidth: 230 });
        const tC = titler(sC), tA = titler(sA), tG = titler(sG);
        const DB = dragBars(sP, () => P);
        const T = v.table(sT, { rows: 7, cols: 4, square: false, cellAspect: 2.2, maxCell: 35, size: 15, labelSize: 11.5, rowLabels: CANDS.map((c) => c.name), colLabels: ['continuous', 'monotone', 'additive', 'grouping'], subSize: 9 });
        sT.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.i < 7) cs.set(CANDS[h.i].key); });
        const tests = (c) => {
          const f = c.f, jump = Math.abs(f([1e-9, 1 - 1e-9]) - f([0, 1]));
          const A = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => f(new Array(n).fill(1 / n)));
          const PQ = P.flatMap((a) => Q.map((b) => a * b)), addL = f(PQ), addR = f(P) + f(Q);
          const s12 = P[0] + P[1], grL = f(P), grR = f([s12, P[2]]) + (s12 > 0 ? s12 * f([P[0] / s12, P[1] / s12]) : 0);
          return { jump, pass: [jump < 1e-3, A.every((a, i) => i === 0 || a > A[i - 1] + 1e-12), Math.abs(addL - addR) < 1e-9, Math.abs(grL - grR) < 1e-9], A, addL, addR, grL, grR };
        };
        const cur = () => CANDS.findIndex((c) => c.key === cs.value);
        const box = (s, vals, top = 0.12) => { const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), pad = 0.12 * (hi - lo || 1); return [lo - (lo < 0 ? pad : 0), hi + (top / 0.12) * pad]; };
        v.render(() => {
          const R = CANDS.map(tests), si = cur(), c = CANDS[si], r = R[si];
          // ── P
          viewPad(sP, [-0.6, 2.6], [0, DB.fit(P, 0.75)]); sP.setTicks([[0, 'p₁'], [1, 'p₂'], [2, 'p₃']], null);
          P.forEach((p, i) => sP.rect(i - 0.34, 0, i + 0.34, p, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 }));
          const top = Math.max(P[0], P[1]) + 0.1;
          sP.path([[-0.34, top - 0.04], [-0.34, top], [1.34, top], [1.34, top - 0.04]], { color: 'orange', width: 1.6 });
          sP.text('merged in the grouping test', 0.5, top, { dy: -9, align: 'center', size: 10.5, color: 'orange' });
          sP.corner('independent partner Q = (0.7, 0.3)', 'tr', { size: 10.5 });
          // ── table
          T.draw({
            value: (i, j) => (R[i].pass[j] ? '✓' : '✗'),
            textColor: (i, j) => (R[i].pass[j] ? 'green' : 'red'), weight: () => 700,
            fill: (i, j) => [R[i].pass[j] ? 'green' : 'red', R[i].pass[j] ? 0.12 : 0.18],
            sub: (i, j) => (R[i].pass[j] ? null : j === 0 ? `jump ${v.fix(R[i].jump, 2)}` : j === 1 ? 'falls' : j === 2 ? `Δ ${v.fix(R[i].addL - R[i].addR, 2)}` : `Δ ${v.fix(R[i].grL - R[i].grR, 2)}`),
            subColor: 'red', activeRow: si, rowLabelColor: (i) => (i === si ? 'accent' : R[i].pass.every(Boolean) ? 'green' : 'muted'),
          });
          // ── continuity: t ↦ f(t, 1 − t)
          const ft = (t) => c.f([t, 1 - t]), samp = []; for (let k = 1; k < 200; k++) samp.push(ft(k / 200));
          const end = ft(0), lim = ft(1e-9);
          tC(`continuity: $f(t, 1-t)$ for ${c.name}`);
          viewPad(sC, [0, 1.03], box(sC, [...samp, end, lim], r.pass[0] ? 0.12 : 0.32));
          sC.fn(ft, { domain: [1e-6, 1 - 1e-6], color: r.pass[0] ? 'accent' : 'red', width: 2.4, n: 300 });
          [0, 1].forEach((t) => { sC.dot(t, end, { r: 4.5, color: r.pass[0] ? 'accent' : 'red' }); if (!r.pass[0]) sC.dot(t, lim, { r: 4.5, color: 'red', hollow: true, width: 2 }); });
          if (!r.pass[0]) sC.corner('jumps at the ends', 'tr', { color: 'red', weight: 600 });
          // ── monotonicity: A(n)
          tA('monotone: $A(n) = f(\\tfrac1n, \\dots, \\tfrac1n)$');
          viewPad(sA, [0.5, 8.5], box(sA, r.A)); sA.setTicks([1, 2, 3, 4, 5, 6, 7, 8], null);
          sA.path(r.A.map((a, i) => [i + 1, a]), { color: r.pass[1] ? 'accent' : 'red', width: 2 });
          r.A.forEach((a, i) => sA.dot(i + 1, a, { r: 4, color: r.pass[1] ? 'accent' : 'red' }));
          if (!r.pass[1]) sA.corner('decreasing', 'tr', { color: 'red', weight: 600 });
          // ── grouping and additivity: both sides
          tG('both sides: grouping · additivity');
          const vals = [r.grL, r.grR, r.addL, r.addR];
          viewPad(sG, [-0.5, 4.5], box(sG, vals)); sG.setTicks([[0.5, 'grouping'], [3.5, 'additivity']], null);
          vals.forEach((val, i) => {
            const x = i < 2 ? i : i + 1, ok = r.pass[i < 2 ? 3 : 2], col = i % 2 ? (ok ? 'green' : 'red') : 'accent';
            sG.rect(x - 0.36, 0, x + 0.36, val, { fill: col, fillAlpha: 0.5, color: col, width: 1.3 });
            sG.text(v.fix(val, 3), x, val, { dy: val >= 0 ? -9 : 10, align: 'center', size: 10.5, color: col, weight: 700 });
          });
          sG.hline(0, { color: 'faint', width: 1 });
        });
        v.legend([['accent', 'left side / the candidate', { area: true }], ['green', 'right side agrees, test passed', { area: true }], ['red', 'test failed', { area: true }]]);
        v.readout(() => {
          const si = cur(), c = CANDS[si], r = tests(c), mk = (b) => (b ? '✓' : '✗');
          return String.raw`${c.name} $${c.tex}$: continuity ${mk(r.pass[0])} · monotonicity ${mk(r.pass[1])} · additivity ${mk(r.pass[2])} ($${v.fix(r.addL, 3)}$ vs $${v.fix(r.addR, 3)}$) · grouping ${mk(r.pass[3])} ($${v.fix(r.grL, 3)}$ vs $${v.fix(r.grR, 3)}$)` + (r.pass.every(Boolean) ? ' — passes all: a positive multiple of $-\\sum p\\log p$' : ' — only $-K\\sum p\\log p$ with $K > 0$ passes all three axioms');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'Rényi entropies and min-entropy',
      statement: String.raw`For $\alpha\in(0,1)\cup(1,\infty)$ the **Rényi entropy** of order $\alpha$ of a distribution $p$ is
$$H_\alpha(p)=\frac1{1-\alpha}\log_2\sum_x p(x)^\alpha ,$$
extended by continuity to $H_0(p)=\log_2|\supp p|$ (**max-entropy** or Hartley entropy), $H_1(p)=H(p)$ (Shannon entropy) and $H_\infty(p)=-\log_2\max_x p(x)$ (**min-entropy**). The order 2 gives the **collision entropy** $H_2(p)=-\log_2\sum_xp(x)^2$, minus the log-probability that two independent draws coincide. $\alpha\mapsto H_\alpha(p)$ is non-increasing, so $H_\infty\le H_2\le H\le H_0$, with all equal exactly for uniform distributions on the support; each $H_\alpha$ is additive over independent variables. Min-entropy measures the chance of guessing $X$ in one try, $2^{-H_\infty}$, which is why it governs password security and randomness extraction.`,
      idea: String.raw`$H_\alpha$ is minus the logarithm of a generalized mean of the probabilities, $\big(\sum_xp(x)\,p(x)^{\alpha-1}\big)^{1/(\alpha-1)}$, the power mean of order $\alpha-1$ of $p(X)$; power means increase with their order, which gives the monotonicity in $\alpha$, and l'Hôpital's rule at $\alpha=1$ recovers $-\sum p\log p$, the geometric mean. Small $\alpha$ flattens the distribution and counts outcomes; large $\alpha$ looks only at the most likely one. The *escort distribution* $p^\alpha/\sum p^\alpha$ makes this visible. Additivity holds because $\sum_{x,y}(p(x)q(y))^\alpha$ factorizes, but grouping fails, so by 1.9 only $\alpha=1$ measures information in Shannon's operational sense.`,
      caption: String.raw`Drag the bars of $p$. The right panel plots $H_\alpha$ against $\alpha$ on a squeezed axis that shows the whole range from $0$ to $\infty$: it falls from $\log_2$ of the number of possible outcomes, through Shannon's $H$ at $\alpha=1$ and the collision entropy at $\alpha=2$, to the min-entropy. Drag the handle on the curve to choose $\alpha$; the orange outlines on the left are the escort distribution $p^\alpha/\sum p^\alpha$ that $H_\alpha$ effectively averages over. Try *one popular choice* (a password list where one entry is common) and *a rare outcome*: $H_0$ jumps when a bar leaves zero, while $H_\infty$ only sees the tallest bar.`,
      deps: ['info-1.2'],
      see: ['cplx-8.13', 'ecol-8.1'],
      refs: ['Cover–Thomas ch. 17', 'Rényi (1961)'],
      tags: ['rényi entropy', 'min-entropy'],
      credit: 'Rényi, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/R%C3%A9nyi_entropy' },
      viz(v) {
        const PRE = { mod: [0.42, 0.2, 0.14, 0.11, 0.08, 0.05], pw: [0.5, 0.1, 0.1, 0.1, 0.1, 0.1], uni: new Array(6).fill(1 / 6), tiny: [0.3, 0.26, 0.2, 0.15, 0.089, 0.001] };
        let p = PRE.mod.slice();
        v.select('distribution', [{ value: 'mod', label: 'moderate' }, { value: 'pw', label: 'one popular choice' }, { value: 'uni', label: 'uniform' }, { value: 'tiny', label: 'a rare outcome' }], 'mod', { onChange: (k) => { p = PRE[k].slice(); } });
        const sP = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', title: 'drag the bars of $p$ (orange: escort $p^\\alpha/\\sum p^\\alpha$)' });
        const sR = v.stage({ x: [0, 1], y: [0, 3], height: 320, axes: 'box', weight: 1.25, title: '$H_\\alpha(p)$ against $\\alpha$ (bits)' });
        const DB = dragBars(sP, () => p);
        const A = (u) => (u >= 1 ? Infinity : u / (1 - u)), U = (a) => (a === Infinity ? 1 : a / (1 + a));
        const hA = sR.handle(U(0.5), 0, { color: 'accent', label: 'α', labelPos: 'sw', constrain: (x) => { const u = clamp(x, 0, 1); return [u, renyi(p, A(u))]; } });
        v.legend([['accent', '$H_\\alpha$'], ['orange', '$H_0 = \\log_2|\\supp p|$', { dot: true }], ['green', '$H_1 = H$', { dot: true }], ['purple', '$H_2$ collision', { dot: true }], ['red', '$H_\\infty$ min-entropy', { dot: true }]]);
        v.render(() => {
          const n = p.length, a = A(hA.x);
          const esc = (() => { const q = p.map((x) => (x > 0 ? (a === Infinity ? 0 : Math.pow(x, a)) : 0)); if (a === Infinity) { const m = Math.max(...p); const k = p.filter((x) => x === m).length; return p.map((x) => (x === m ? 1 / k : 0)); } const s = sum(q); return q.map((x) => x / s); })();
          viewPad(sP, [-0.6, n - 0.4], [0, DB.fit(p.concat(esc), 0.5)]); sP.setTicks(p.map((_, i) => [i, LET[i]]), null);
          p.forEach((x, i) => {
            sP.rect(i - 0.34, 0, i + 0.34, x, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1.4 });
            sP.rect(i - 0.4, 0, i + 0.4, esc[i], { color: 'orange', width: 2.2 });
            if (x > 0 && x < 0.01) sP.text('tiny', i, x, { dy: -10, align: 'center', size: 10, color: 'accent' });
          });
          const H0 = renyi(p, 0), Hinf = renyi(p, Infinity);
          viewPad(sR, [0, 1.045], [0, Math.max(1, H0) * 1.12 + 0.1]);
          sR.setTicks([[0, '0'], [0.2, '¼'], [1 / 3, '½'], [0.5, '1'], [2 / 3, '2'], [0.8, '4'], [10 / 11, '10'], [1, '∞']], null);
          sR.fn((u) => renyi(p, A(u)), { domain: [0, 0.99999], color: 'accent', width: 2.6, n: 300 });
          const pts = [[0, H0, 'orange', 'H₀'], [0.5, H(p), 'green', 'H₁ = H'], [2 / 3, renyi(p, 2), 'purple', 'H₂'], [1, Hinf, 'red', 'H∞']];
          pts.forEach(([u, h, col, lab], k) => { sR.dot(u, h, { r: 5.5, color: col }); sR.text(`${lab} ${v.fix(h, 2)}`, u, h, { dx: k === 3 ? -9 : 9, dy: k === 3 ? 14 : -11, align: k === 3 ? 'right' : 'left', size: 11.5, color: col, weight: 700 }); });
          hA.y = renyi(p, a);
          sR.vline(hA.x, { color: 'muted', width: 1, dash: [3, 4] });
          sR.text('α', sR.bounds.x[1], 0, { dx: -8, dy: -14, align: 'right', size: 15, color: 'muted', math: true });
        });
        v.readout(() => {
          const a = A(hA.x), m = Math.max(...p), s2 = sum(p.map((x) => x * x)), supp = p.filter((x) => x > 0).length;
          return String.raw`$\alpha = ${a === Infinity ? '\\infty' : v.fix(a, 2)}$: $H_\alpha = ${v.fix(renyi(p, a), 3)}$ bits · $H_\infty = ${v.fix(-Math.log2(m), 3)} \le H_2 = ${v.fix(-Math.log2(s2), 3)} \le H = ${v.fix(H(p), 3)} \le H_0 = \log_2 ${supp} = ${v.fix(Math.log2(supp), 3)}$ · one guess succeeds with probability $\max p = 2^{-H_\infty} = ${v.fix(m, 3)}$ · two draws collide with probability $\sum p^2 = 2^{-H_2} = ${v.fix(s2, 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Entropy cannot increase under a function',
      statement: String.raw`For a discrete random variable $X$ and any function $f$ defined on its values,
$$H(f(X))\le H(X),$$
and the loss is exactly the information about $X$ that $f$ discards: $H(X)-H(f(X))=H(X\mid f(X))$. Equality holds if and only if $f$ is one-to-one on the support of $X$ (outcomes of probability zero may be merged freely).`,
      idea: String.raw`Expand the entropy of the pair $(X,f(X))$ with the chain rule (1.7) in both orders: $H(X)+H(f(X)\mid X)=H(f(X))+H(X\mid f(X))$. Knowing $X$ determines $f(X)$, so $H(f(X)\mid X)=0$, and therefore $H(X)-H(f(X))=H(X\mid f(X))\ge0$. The loss vanishes exactly when $X$ is determined by $f(X)$, i.e. when no two possible outcomes share a value. Pictorially, merging outcomes pools their probability into fewer, larger bars, and the surprise that distinguished them is gone.`,
      caption: String.raw`Two dice give $X=(\text{first},\text{second})$, 36 outcomes; each tile's height in the right panel is its probability. Choose a function and watch the tiles fly into the bars of $f(X)$ (*play* repeats it): outcomes with the same value merge. Above each bar is the entropy of the tiles it absorbed, $H(X\mid f(X)=y)$; their average is exactly the loss. *Both dice* is one-to-one and loses nothing; *loaded dice* change the probabilities but never the inequality.`,
      deps: ['info-1.7'],
      refs: ['Cover–Thomas §2.5'],
      tags: ['entropy', 'functions', 'data processing'],
      viz(v) {
        const FN = {
          sum: { f: (a, b) => a + b, nm: (y) => String(y) }, max: { f: (a, b) => Math.max(a, b), nm: (y) => String(y) },
          diff: { f: (a, b) => Math.abs(a - b), nm: (y) => String(y) }, par: { f: (a, b) => (a + b) % 2, nm: (y) => (y ? 'odd' : 'even') },
          first: { f: (a) => a, nm: (y) => String(y) }, pair: { f: (a, b) => 6 * (a - 1) + b - 1, nm: () => '' },
        };
        const fs = v.select('function $f$', [{ value: 'sum', label: 'sum' }, { value: 'max', label: 'max' }, { value: 'diff', label: '|difference|' }, { value: 'par', label: 'parity of sum' }, { value: 'first', label: 'first die' }, { value: 'pair', label: 'both dice' }], 'sum', { onChange: () => { v.restart(); v.play(); } });
        const load = v.toggle('loaded dice (a six 40% of the time)', false, { onChange: () => { v.restart(); v.play(); } });
        const s = v.stage({ x: [0, 21], y: [-1.5, 7.6], height: 390, axes: false, full: true });
        const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
        const model = () => {
          const face = load.value ? [0.12, 0.12, 0.12, 0.12, 0.12, 0.4] : new Array(6).fill(1 / 6), F = FN[fs.value];
          const tiles = []; for (let b = 1; b <= 6; b++) for (let a = 1; a <= 6; a++) tiles.push({ a, b, p: face[a - 1] * face[b - 1], y: F.f(a, b) });
          const vals = [...new Set(tiles.map((t) => t.y))].sort((x, y) => x - y), idx = new Map(vals.map((y, k) => [y, k]));
          const py = vals.map((y) => sum(tiles.filter((t) => t.y === y).map((t) => t.p)));
          const Hc = vals.map((y) => H(tiles.filter((t) => t.y === y).map((t) => t.p)));
          return { tiles, vals, idx, py, Hc, F, HX: H(tiles.map((t) => t.p)), HY: H(py), Hcond: sum(py.map((q, k) => q * Hc[k])) };
        };
        v.animate((t) => {
          const Mo = model(), nv = Mo.vals.length, slot = 12.2 / nv, bw = Math.min(0.92, 0.84 * slot), HS = Math.min(36, 6 / Math.max(...Mo.py));
          const stack = new Array(nv).fill(0), M = v.M;
          // grid labels
          for (let k = 1; k <= 6; k++) { s.text(String(k), 0.6 + k - 0.5, 0.25, { align: 'center', size: 11, color: 'muted' }); s.text(String(k), 0.3, 0.6 + k - 0.5, { align: 'center', size: 11, color: 'muted' }); }
          s.text('first die →', 3.6, -0.25, { align: 'center', size: 11, color: 'muted' });
          s.text('second die ↑', 0.3, 6.95, { align: 'left', size: 11, color: 'muted' });
          s.line(7.6, -0.6, 7.6, 7.2, { color: 'faint', width: 1, dash: [3, 4] });
          s.line(8.1, 0, 20.6, 0, { color: 'faint', width: 1.2 });
          Mo.tiles.forEach((T) => { const col = M.cmap(0.12 + (0.8 * Mo.idx.get(T.y)) / Math.max(1, nv - 1), 'viridis'); s.rect(0.6 + T.a - 0.96, 0.6 + T.b - 0.96, 0.6 + T.a - 0.04, 0.6 + T.b - 0.04, { fill: col, fillAlpha: 0.16, color: col, width: 1, alpha: 0.35 }); if (nv <= 12) s.text(Mo.F.nm(T.y), 0.6 + T.a - 0.5, 0.6 + T.b - 0.5, { align: 'center', size: 10.5, color: 'muted', halo: false }); });
          Mo.tiles.forEach((T, i) => {
            const k = Mo.idx.get(T.y), bx = 8.3 + slot * (k + 0.5), h = T.p * HS;
            const g0 = [0.6 + T.a - 1 + 0.04, 0.6 + T.b - 1 + 0.04, 0.6 + T.a - 0.04, 0.6 + T.b - 0.04];
            const g1 = [bx - bw / 2, stack[k], bx + bw / 2, stack[k] + h]; stack[k] += h;
            const u = ease((t - 0.5 - (0.9 * i) / 35) / 1.3), r = g0.map((z, j) => z + (g1[j] - z) * u);
            const col = M.cmap(0.12 + (0.8 * k) / Math.max(1, nv - 1), 'viridis');
            s.rect(r[0], r[1], r[2], r[3], { fill: col, fillAlpha: load.value ? 0.35 + 1.4 * T.p * (1 - u) + 0.45 * u : 0.8, color: 'panel', width: 0.8 });
            if (u < 0.5 && nv <= 12) s.text(Mo.F.nm(T.y), (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, { align: 'center', size: 11, weight: 600, color: 'ink' });
          });
          const done = t > 0.5 + 0.9 + 1.3;
          Mo.vals.forEach((y, k) => {
            const bx = 8.3 + slot * (k + 0.5);
            if (slot > 0.55) s.text(Mo.F.nm(y), bx, 0, { dy: 12, align: 'center', size: 11, color: 'muted' });
            if (done && slot > 0.9) {
              s.text(v.fix(Mo.py[k], 3), bx, Mo.py[k] * HS, { dy: -10, align: 'center', size: 10, color: 'muted' });
              s.text(`H ${v.fix(Mo.Hc[k], 2)}`, bx, Mo.py[k] * HS, { dy: -23, align: 'center', size: 10, color: 'teal', weight: 700 });
            }
          });
          s.text(`X: 36 outcomes, H(X) = ${v.fix(Mo.HX, 3)} bits`, 3.6, 7.3, { align: 'center', size: 12, weight: 600, color: 'ink' });
          s.text(`f(X): ${nv} values, H(f(X)) = ${v.fix(Mo.HY, 3)} bits`, 14.4, 7.3, { align: 'center', size: 12, weight: 600, color: 'ink' });
        }, { period: 3.6, once: true, still: 3.6 });
        v.legend([['accent', 'tiles: outcomes of $X$ (colour = value of $f$)', { area: true }], ['teal', '$H(X\\mid f(X)=y)$ above each bar']]);
        v.readout(() => {
          const Mo = model(), loss = Mo.HX - Mo.HY;
          return String.raw`$H(X) = ${v.fix(Mo.HX, 3)}$ bits $\to H(f(X)) = ${v.fix(Mo.HY, 3)}$ bits: merging lost $${v.fix(loss, 3)}$ bits $= H(X\mid f(X)) = \sum_y p(y)\,H(X\mid f(X)=y) = ${v.fix(Mo.Hcond, 3)}$ ✓` + (loss < 1e-9 ? ' · one-to-one: nothing lost' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Method',
      name: 'The weighing problem: experiments that maximize information',
      statement: String.raw`Among twelve balls one is heavier or lighter than the others, which all weigh the same; a balance compares two pans and shows *left heavier*, *balanced* or *right heavier*. There are $24$ equally likely hypotheses (which ball, and heavier or lighter), so $\log_2 24\approx4.58$ bits are unknown, and a weighing has three outcomes, so it yields at most $\log_2 3\approx1.585$ bits; at least $\lceil\log_3 24\rceil=3$ weighings are needed. **Method:** choose each experiment to maximize the entropy of its outcome under the current hypotheses, i.e. to split them into three groups as equal as possible. Doing so solves the puzzle in three weighings in the worst case, whereas a weighing whose outcome is predictable (for instance six balls against six, which can never balance) wastes capacity.`,
      idea: String.raw`The information an experiment delivers on average is the entropy of its outcome (1.2), at most $\log_2 3$ for three outcomes and largest when they are equally likely (1.4); after it the uncertainty about the hypotheses falls by exactly that amount on average (grouping, 1.8, with the outcome as the group label). Greedy entropy maximization is the questioning strategy of 1.5 with ternary questions: with 24 hypotheses the first weighing must leave at most 9 of them whatever happens (since two more weighings separate at most $3^2=9$), which forces four balls on each pan, and the later weighings typically have to bring in balls already known to be genuine. The same principle, choose the most informative measurement, underlies adaptive experimental design and active learning.`,
      caption: String.raw`Click a ball to put it on the left pan, then the right pan, then back off. The left chart shows how the remaining hypotheses would split among the three outcomes of this weighing, and its entropy; the grid on the right colours each surviving hypothesis by the outcome it predicts. *Weigh* runs the experiment (the odd ball is hidden at random, or an *adversary* picks the outcome that leaves the most hypotheses); *Best weighing* chooses pans that maximize the entropy. Balls are blue while either direction is possible, orange or teal once only heavier or only lighter remains, grey once proven genuine. Against the adversary, maximum-entropy weighings always finish in three.`,
      deps: ['info-1.5', 'info-1.4'],
      refs: ['MacKay ch. 4'],
      tags: ['experimental design', 'entropy', 'puzzle'],
      credit: 'Twelve-coin puzzle, 1945; Dyson, 1946 (general solution); MacKay, 2003 (information view)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Balance_puzzle' },
      viz(v) {
        const OUT = ['left heavier', 'balanced', 'right heavier'], OC = ['purple', 'gold', 'pink'];
        let assign = [1, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0], alive = new Array(24).fill(true), hist = [], truth = 0, pseed = 1, tilt = null;
        const nature = v.select('the odd ball is chosen', [{ value: 'random', label: 'at random' }, { value: 'adv', label: 'by an adversary' }], 'random');
        const newPuzzle = () => { alive = new Array(24).fill(true); hist = []; tilt = null; const r = v.rng(hashStr('balls|' + pseed++)); truth = Math.floor(r() * 24); };
        newPuzzle();
        // hypothesis h: ball h >> 1, heavier if h is even; outcome 0 = left heavier, 1 = balanced, 2 = right heavier
        const predict = (h, a) => { const side = a[h >> 1]; if (side === 0) return 1; return (side === 1) === ((h & 1) === 0) ? 0 : 2; };
        const counts = (a) => { const c = [0, 0, 0]; for (let h = 0; h < 24; h++) if (alive[h]) c[predict(h, a)]++; return c; };
        const pans = (a) => [a.filter((x) => x === 1).length, a.filter((x) => x === 2).length];
        const fair = (a) => { const [L, R] = pans(a); return L === R && L > 0; };
        const nAlive = () => alive.filter(Boolean).length;
        const replay = () => { alive = new Array(24).fill(true); for (const w of hist) for (let h = 0; h < 24; h++) if (alive[h] && predict(h, w.assign) !== w.out) alive[h] = false; };
        v.button('Weigh', () => {
          if (!fair(assign) || nAlive() <= 1) return;
          const c = counts(assign); let out;
          if (nature.value === 'random') {
            if (!alive[truth]) { const ok = []; alive.forEach((x, h) => x && ok.push(h)); truth = ok[Math.floor(v.rng(hashStr('re|' + pseed++))() * ok.length)]; }
            out = predict(truth, assign);
          } else out = [1, 0, 2].reduce((b, k) => (c[k] > c[b] ? k : b), 1);
          const before = nAlive();
          hist.push({ assign: assign.slice(), out, H: H(c), before });
          replay(); hist[hist.length - 1].after = nAlive(); tilt = { key: assign.join(''), out };
        });
        v.button('Best weighing', () => {
          const U = [], Hh = [], Ll = [], G = [];
          for (let i = 0; i < 12; i++) { const h = alive[2 * i], l = alive[2 * i + 1]; (h && l ? U : h ? Hh : l ? Ll : G).push(i); }
          const nU = U.length, nH = Hh.length, nL = Ll.length, nG = G.length, tot = 2 * nU + nH + nL; let best = null;
          for (let uL = 0; uL <= nU; uL++) for (let uR = 0; uR + uL <= nU; uR++) for (let hL = 0; hL <= nH; hL++) for (let hR = 0; hR + hL <= nH; hR++) for (let lL = 0; lL <= nL; lL++) for (let lR = 0; lR + lL <= nL; lR++) {
            const L0 = uL + hL + lL, R0 = uR + hR + lR, gN = Math.abs(L0 - R0); if (gN > nG || L0 + R0 === 0) continue;
            const c0 = uL + uR + hL + lR, c2 = uL + uR + hR + lL, c1 = tot - c0 - c2, h = H([c0, c1, c2]), mx = Math.max(c0, c1, c2), used = L0 + R0 + gN;
            if (!best || h > best.h + 1e-9 || (Math.abs(h - best.h) < 1e-9 && (mx < best.mx || (mx === best.mx && used < best.used)))) best = { h, mx, used, uL, uR, hL, hR, lL, lR, gL: L0 < R0 ? gN : 0, gR: R0 < L0 ? gN : 0 };
          }
          if (!best) return;
          const a = new Array(12).fill(0), take = (arr, n, side) => { for (let k = 0; k < n; k++) a[arr.shift()] = side; };
          take(U, best.uL, 1); take(U, best.uR, 2); take(Hh, best.hL, 1); take(Hh, best.hR, 2); take(Ll, best.lL, 1); take(Ll, best.lR, 2); take(G, best.gL, 1); take(G, best.gR, 2);
          assign = a;
        });
        v.button('Undo', () => { if (hist.length) { const w = hist.pop(); assign = w.assign.slice(); replay(); tilt = null; } });
        v.button('New puzzle', () => newPuzzle());
        const sT = v.stage({ x: [0, 12], y: [0, 4.3], height: 300, equal: true, axes: false, full: true });
        const sO = v.stage({ x: [0, 1], y: [0, 1], height: 230, axes: 'box' });
        const sH = v.stage({ x: [-1.6, 12.2], y: [-0.9, 2.6], height: 230, axes: false, title: 'the 24 hypotheses, coloured by the outcome each predicts' });
        const tO = titler(sO);
        const status = (i) => { const h = alive[2 * i], l = alive[2 * i + 1]; return h && l ? 'accent' : h ? 'orange' : l ? 'teal' : 'muted'; };
        let ballXY = [];
        sT.onClick((x, y) => {
          let best = -1, bd = 0.42;
          ballXY.forEach(([bx, by], i) => { const d = Math.hypot(bx - x, by - y); if (d < bd) { bd = d; best = i; } });
          for (let i = 0; i < 12; i++) { const d = Math.hypot(0.5 + i - x, 0.45 - y); if (d < bd) { bd = d; best = i; } }
          if (best >= 0 && nAlive() > 1) { assign[best] = (assign[best] + 1) % 3; }
        });
        v.render(() => {
          const key = assign.join(''), out = tilt && tilt.key === key ? tilt.out : 1, th = out === 0 ? 0.11 : out === 2 ? -0.11 : 0;
          const cx = 6, cy = 3.55, half = 3.1, ends = [[cx - half * Math.cos(th), cy - half * Math.sin(th)], [cx + half * Math.cos(th), cy + half * Math.sin(th)]];
          // stand and beam
          sT.poly([[cx - 0.5, 0.95], [cx + 0.5, 0.95], [cx, 1.35]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.2 });
          sT.line(cx, 1.3, cx, cy, { color: 'muted', width: 3 });
          sT.line(ends[0][0], ends[0][1], ends[1][0], ends[1][1], { color: 'ink', width: 3.2 });
          sT.dot(cx, cy, { r: 4, color: 'ink' });
          ballXY = new Array(12);
          [1, 2].forEach((side) => {
            const [ex, ey] = ends[side - 1], py = ey - 1.2;
            sT.line(ex, ey, ex - 1.05, py, { color: 'muted', width: 1 }); sT.line(ex, ey, ex + 1.05, py, { color: 'muted', width: 1 });
            sT.line(ex - 1.15, py, ex + 1.15, py, { color: 'ink', width: 2.6 });
            const on = []; assign.forEach((s0, i) => s0 === side && on.push(i));
            on.forEach((i, k) => { const row = Math.floor(k / 4), col = k % 4, n = Math.min(4, on.length - row * 4); ballXY[i] = [ex + (col - (n - 1) / 2) * 0.52, py + 0.27 + row * 0.5]; });
          });
          for (let i = 0; i < 12; i++) {
            const slot = [0.5 + i, 0.45], col = status(i);
            if (assign[i]) sT.circle(slot[0], slot[1], 0.24, { color: 'faint', width: 1.2, dash: [3, 3] }); else ballXY[i] = slot;
            const [bx, by] = ballXY[i];
            sT.circle(bx, by, 0.24, { fill: 'panel', fillAlpha: 1, stroke: false });
            sT.circle(bx, by, 0.24, { fill: col, fillAlpha: col === 'muted' ? 0.15 : 0.35, color: col, width: 2 });
            sT.text(String(i + 1), bx, by, { align: 'center', size: 11.5, weight: 700, color: col === 'muted' ? 'muted' : 'ink' });
          }
          const [L, R] = pans(assign);
          if (tilt && tilt.key === key) sT.text(OUT[tilt.out], cx, cy + 0.42, { align: 'center', size: 13, weight: 700, color: OC[tilt.out] });
          else if (!fair(assign)) sT.text(L === R ? 'put balls on the pans' : `pans must hold equal numbers (${L} vs ${R})`, cx, cy + 0.42, { align: 'center', size: 12.5, weight: 600, color: 'red' });
          const na = nAlive();
          sT.corner(`weighings: ${hist.length} · hypotheses left: ${na} · ${v.fix(Math.log2(Math.max(1, na)), 2)} bits unknown`, 'tl', { size: 12 });
          if (na === 1) { const h = alive.indexOf(true); sT.corner(`solved: ball ${(h >> 1) + 1} is ${(h & 1) ? 'lighter' : 'heavier'}, in ${hist.length} weighing${hist.length === 1 ? '' : 's'}`, 'tr', { size: 12.5, color: 'green', weight: 700 }); }
          // ── outcome distribution
          const c = counts(assign), tot = Math.max(1, na), Hw = fair(assign) ? H(c) : 0;
          tO(fair(assign) ? `outcomes of this weighing: $H = ${v.fix(Hw, 3)}$ bits (max $\\log_2 3$)` : 'outcomes of this weighing (pans unequal)');
          viewPad(sO, [-0.6, 2.6], [0, 1.08]); sO.setTicks([[0, 'left heavier'], [1, 'balanced'], [2, 'right heavier']], [0, 0.25, 0.5, 0.75, 1]);
          sO.hline(1 / 3, { color: 'orange', width: 1.4, dash: [6, 4] });
          c.forEach((k, j) => { const q = k / tot; sO.rect(j - 0.32, 0, j + 0.32, q, { fill: OC[j], fillAlpha: 0.55, color: OC[j], width: 1.3 }); sO.text(`${k}`, j, q, { dy: -10, align: 'center', size: 12, weight: 700, color: OC[j] }); });
          // ── hypothesis grid
          for (let i = 0; i < 12; i++) {
            sH.text(String(i + 1), i + 0.5, 2.25, { align: 'center', size: 11, color: 'muted' });
            for (let r = 0; r < 2; r++) {
              const h = 2 * i + r, y0 = r === 0 ? 1.05 : 0;
              if (alive[h]) sH.rect(i + 0.06, y0 + 0.06, i + 0.94, y0 + 0.94, { fill: fair(assign) ? OC[predict(h, assign)] : 'accent', fillAlpha: 0.6, color: na === 1 ? 'green' : 'panel', width: na === 1 ? 3 : 1 });
              else { sH.rect(i + 0.06, y0 + 0.06, i + 0.94, y0 + 0.94, { color: 'faint', width: 1 }); sH.text('×', i + 0.5, y0 + 0.5, { align: 'center', size: 12, color: 'faint' }); }
            }
          }
          sH.text('heavier', -0.15, 1.55, { align: 'right', size: 11, color: 'muted' });
          sH.text('lighter', -0.15, 0.5, { align: 'right', size: 11, color: 'muted' });
          sH.text('ball', -0.15, 2.25, { align: 'right', size: 11, color: 'muted' });
        });
        v.legend([['purple', 'left heavier', { area: true }], ['gold', 'balanced', { area: true }], ['pink', 'right heavier', { area: true }], ['accent', 'ball: either way', { dot: true }], ['orange', 'only heavier', { dot: true }], ['teal', 'only lighter', { dot: true }]]);
        v.readout(() => {
          const c = counts(assign), na = nAlive(), [L, R] = pans(assign);
          let s = fair(assign) ? String.raw`this weighing (${L} against ${R}) splits the ${na} hypothes${na === 1 ? 'is' : 'es'} ${c.join(' / ')}: outcome entropy $${v.fix(H(c), 3)}$ bits, at most $\log_2 3 = 1.585$` : 'put the same number of balls on each pan';
          if (hist.length) s += ' · so far: ' + hist.map((w, k) => `#${k + 1} → ${OUT[w.out]} (${v.fix(w.H, 2)} bits, ${w.before} → ${w.after} left)`).join('; ');
          s += String.raw` · learned $\log_2\frac{24}{${na}} = ${v.fix(Math.log2(24 / Math.max(1, na)), 2)}$ of $\log_2 24 = 4.585$ bits`;
          return s;
        });
      },
    },
  ],
};
