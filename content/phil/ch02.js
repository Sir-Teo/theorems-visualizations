// Philosophy & Reasoning — Chapter 2: Paradoxes of the infinite

// ---------- shared helpers ----------
/** TeX for 1/2^k. */
const halfTex = (k) => (k === 0 ? '1' : k <= 10 ? `\\tfrac{1}{${2 ** k}}` : `2^{-${k}}`);
/** A drawn arrow (shaft, head, fletching) whose tip is at (x, y); len in data units. */
function drawArrow(s, x, y, len, col, alpha = 1) {
  const hx = len * 0.24, hy = 0.13;
  s.line(x - len, y, x - hx * 0.7, y, { color: col, width: 3, alpha });
  s.poly([[x, y], [x - hx, y + hy], [x - hx, y - hy]], { fill: col, fillAlpha: alpha, stroke: false });
  for (const d of [1, -1]) s.poly([[x - len + 0.02, y], [x - len - hx * 0.6, y + d * hy * 0.9], [x - len + hx * 0.5, y + d * hy * 0.9], [x - len + hx * 0.8, y]], { fill: 'orange', fillAlpha: alpha * 0.85, stroke: false });
}

const SUBD = '₀₁₂₃₄₅₆₇₈₉';
const subNum = (n) => String(n).split('').map((d) => SUBD[+d]).join('');
const gcdInt = (a, b) => (b ? gcdInt(b, a % b) : a);
/** The rationals in [0, 1] listed by denominator: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, … (first K). */
function rationals01(K) {
  const out = [[0, 1], [1, 1]];
  for (let q = 2; out.length < K; q++) for (let p = 1; p < q && out.length < K; p++) if (gcdInt(p, q) === 1) out.push([p, q]);
  return out.slice(0, K);
}
/** Total length of a union of intervals [a, b]. */
function unionLength(iv) {
  const s = iv.map(([a, b]) => [Math.max(0, a), Math.min(1, b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let tot = 0, cur = null;
  for (const [a, b] of s) { if (!cur || a > cur[1]) { if (cur) tot += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); }
  if (cur) tot += cur[1] - cur[0];
  return tot;
}
/** Cantor's pairing ℕ×ℕ → ℕ (1-based): (c, s) ↦ (c+s−1)(c+s−2)/2 + s. */
const pairNum = (c, s) => ((c + s - 1) * (c + s - 2)) / 2 + s;
/** 12000 → "1.2·10⁴" for labels. */
const bigNum = (x) => { if (x < 1e4) return String(Math.round(x)); const e = Math.floor(Math.log10(x)); return `${(x / 10 ** e).toFixed(1)}·10${String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('')}`; };
/** Quadratic Bézier point. */
const bez = (p0, p1, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];

export default {
  collection: 'phil',
  chapter: 2,
  title: 'Paradoxes of the infinite',
  summary: String.raw`Zeno argued that motion is impossible, because moving any distance requires completing infinitely many tasks, catching a slower runner requires reaching infinitely many places it has left, and a flying arrow is motionless at every instant. Convergent series and the derivative answer the mathematical side: infinitely many intervals can have a finite total, and velocity is a limit. Philosophers still debate whether that settles the matter. Supertasks such as Thomson’s lamp, the Ross–Littlewood urn and Benardete’s reapers push the question further, by describing infinite sequences of actions whose outcome the description does not determine or cannot consistently fix. Galileo’s paradox, Hilbert’s hotel, Gabriel’s horn and Zeno’s paradox of measure show the infinite defeating ordinary intuitions about size.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Paradox',
      name: 'Zeno’s dichotomy (the racetrack)',
      statement: String.raw`**Zeno’s argument.** To run the length of a track, a runner must first reach the halfway point, then the point halfway through the remainder, and so on: infinitely many tasks, each taking some time. Nobody can complete infinitely many tasks, so the runner never arrives. (In the *regressive* version, before reaching the halfway point the runner must reach the quarter point, before that the eighth point, and so on; there is no first task, so the runner cannot even start.)

**The mathematical answer.** At constant speed, the $k$-th task covers $2^{-k}$ of the track in $2^{-k}$ of the total time. Both series converge, $\sum_{k\ge1}2^{-k}=1$, so infinitely many tasks fit into a finite time and the runner arrives at time $1$. Whether this fully answers Zeno, by showing how an infinite sequence of acts can be *completed*, is still debated.`,
      idea: String.raw`The geometric series (pma 3.26) gives $\sum_{k=1}^{n}2^{-k}=1-2^{-n}$. The partial sums never reach $1$, but their limit is $1$, so the times of the tasks have a least upper bound and the runner is at the finish line exactly then. The answer depends on the durations shrinking: if every task took the same time, the total would be infinite. A philosophical worry remains, raised by Black and Thomson in the 1950s. The sequence of tasks has no last member, so what does it mean to say the sequence has been *finished*? The standard reply (Grünbaum, Salmon) is that completing all the tasks means nothing more than being at the limit point at the limit time. Critics answer that this redefines the problem rather than solving it. The regressive version adds a different puzzle, a sequence with no first member, that series alone do not address.`,
      caption: String.raw`Drag the time $t$. The track shows the tasks already done (solid) and those still ahead (faint), and the runner in gold. Magnify the crowded end by $2^z$: at every magnification the picture looks the same, because infinitely many tasks are always left. The left chart plots the partial sums of distance and time after $n$ tasks, and the right chart counts tasks completed by time $t$, which shoots to infinity at $t=1$. Switch off constant speed (every task takes the same time) and the runner never arrives. Switch to the regressive version: then at every moment infinitely many tasks are already behind the runner.`,
      deps: ['pma-3.26'],
      refs: ['Sainsbury ch. 1', 'SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC (reported by Aristotle, Physics VI)',
      tags: ['infinity', 'series', 'motion'],
      viz(v) {
        const ver = v.select('', [{ value: 'prog', label: 'half, then half the rest' }, { value: 'reg', label: 'regressive: no first task' }], 'prog');
        const pace = v.toggle('constant speed', true);
        const tS = v.slider('time $t$', 0, 1.3, 0.97, { step: 0.0005, decimals: 4 });
        const zS = v.slider('magnify the crowded end $\\times 2^z$, $z$', 0, 12, 0, { int: true });
        const track = v.stage({ x: [-0.03, 1.03], y: [-0.62, 1.0], axes: false, height: 150, full: true });
        const P = v.stage({ x: [-0.6, 12.6], y: [-0.1, 1.42], axes: 'box', height: 270, title: 'after $n$ tasks: distance and time used', xticks: [0, 2, 4, 6, 8, 10, 12], yticks: [0, 0.25, 0.5, 0.75, 1, 1.25] });
        const C = v.stage({ x: [-0.08, 1.3], y: [-0.9, 13.5], axes: 'box', height: 270, title: 'tasks completed by time $t$', xticks: [0, 0.25, 0.5, 0.75, 1, 1.25], yticks: [0, 2, 4, 6, 8, 10, 12] });
        const TAU = 0.1; // time per task when the pace is not constant
        const state = () => {
          const t = tS.value, reg = ver.value === 'reg', speed = pace.value || reg;
          if (reg) { const ahead = t >= 1 ? 0 : Math.ceil(Math.log2(1 / Math.max(t, 1e-12)) - 1e-9); return { t, reg, speed, pos: Math.min(t, 1), ahead }; }
          if (speed) { const n = t >= 1 ? Infinity : Math.floor(-Math.log2(1 - t) + 1e-9); return { t, reg, speed, pos: Math.min(t, 1), n }; }
          const n = Math.floor(t / TAU + 1e-9), fr = t / TAU - n;
          return { t, reg, speed, n, pos: 1 - 2 ** -n + fr * 2 ** -(n + 1) };
        };
        let st = null;
        v.render(() => {
          st = state(); const { t, reg, speed, pos } = st, z = zS.value;
          pace.el.hidden = reg;
          // ---- the track (magnified near the crowded end)
          const w = 2 ** -z, xr = reg ? [-0.05 * w, 1.08 * w] : [1 - 1.08 * w, 1 + 0.05 * w];
          track.setView(xr, [-0.62, 1.0]);
          const sc = track.width / (xr[1] - xr[0]), kmax = z + 15;
          for (let k = reg ? 0 : 1; k <= kmax; k++) {
            const [a, b] = reg ? [2 ** -(k + 1), 2 ** -k] : [1 - 2 ** -(k - 1), 1 - 2 ** -k];
            if (b < xr[0] || a > xr[1]) continue;
            const done = reg ? b <= pos + 1e-12 : speed ? t >= b - 1e-12 : st.n >= k;
            const col = k % 2 ? 'blue' : 'teal';
            track.line(a, 0.25, b, 0.25, { color: col, width: 12, cap: 'butt', alpha: done ? 0.85 : 0.22 });
            track.line(a, 0.08, a, 0.42, { color: 'ink', width: 1, alpha: 0.6 });
            if ((b - a) * sc > 38) track.tex(halfTex(reg ? k + 1 : k), (a + b) / 2, 0.66, { size: 13, color: done ? col : 'muted' });
          }
          if (xr[0] <= 0) track.text('start', 0, -0.3, { align: 'center', size: 11.5, color: 'muted' });
          if (xr[1] >= 1) { track.line(1, 0.0, 1, 0.5, { color: 'green', width: 2.5 }); track.text('finish', 1, -0.3, { align: 'center', size: 11.5, weight: 600, color: 'green' }); }
          if (pos >= xr[0] && pos <= xr[1]) track.dot(pos, 0.25, { r: 7.5, color: 'gold' });
          track.corner(z ? `magnified ×${2 ** z}: still infinitely many tasks in view` : 'the whole track', 'tl', { color: 'muted' });
          // ---- partial sums
          if (!reg) {
            P.setTitle('after $n$ tasks: distance and time used');
            P.hline(1, { color: 'green', dash: [6, 4], width: 1.4 });
            const dist = [], time = [];
            for (let n = 0; n <= 12; n++) {
              const S = 1 - 2 ** -n, T = speed ? S : TAU * n;
              dist.push([n, S], [n + 1, S]); time.push([n, T], [n + 1, T]);
            }
            P.path(dist, { color: 'blue', width: 2.6 });
            P.path(time, { color: 'orange', width: 2.2, dash: [6, 4] });
            for (let n = 1; n <= 12; n++) P.dot(n, 1 - 2 ** -n, { r: 3, color: 'blue' });
            if (isFinite(st.n) && st.n <= 12) P.vline(st.n, { color: 'gold', width: 2 });
            P.text('limit 1', 12.4, 1.06, { align: 'right', size: 11, color: 'green' });
            if (!speed) P.text('time 0.1 n → ∞', 11.6, Math.min(1.2, TAU * 11.6) + 0.07, { align: 'right', size: 11, weight: 600, color: 'orange' });
          } else {
            P.setTitle('task $k$ ends at $2^{-k}$: every task has an earlier one');
            for (let k = 0; k <= 12; k++) {
              const h = 2 ** -k, done = h <= pos + 1e-12;
              P.rect(k - 0.34, 0, k + 0.34, h, { fill: k % 2 ? 'blue' : 'teal', fillAlpha: done ? 0.7 : 0.18, color: k % 2 ? 'blue' : 'teal', width: 1 });
            }
            P.text('… → 0', 12.4, 0.12, { align: 'right', size: 12, weight: 600, color: 'muted' });
          }
          // ---- tasks completed by time t
          if (!reg) {
            C.setTitle('tasks completed by time $t$');
            const pts = [[0, 0]];
            if (speed) { for (let k = 1; k <= 16; k++) { const tk = 1 - 2 ** -k; pts.push([tk, k - 1], [tk, k]); } C.vline(1, { color: 'red', dash: [5, 4], width: 1.6 }); C.text('infinitely many by t = 1 →', 0.97, 12.6, { align: 'right', size: 11, weight: 600, color: 'red' }); }
            else for (let k = 1; k <= 13; k++) pts.push([k * TAU, k - 1], [k * TAU, k]);
            pts.push([speed ? 1 : 1.3, pts[pts.length - 1][1]]);
            C.clip(() => C.path(pts, { color: 'purple', width: 2.4 }));
            C.vline(t, { color: 'gold', width: 2 });
            if (isFinite(st.n)) C.dot(t, st.n, { r: 5, color: 'gold' });
          } else {
            C.setTitle('tasks still ahead at time $t$');
            const pts = [];
            for (let k = 14; k >= 1; k--) { const a = 2 ** -k, b = 2 ** -(k - 1); pts.push([a, k], [b, k], [b, k - 1]); }
            pts.push([1.3, 0]);
            C.clip(() => C.path(pts, { color: 'purple', width: 2.4 }));
            C.vline(t, { color: 'gold', width: 2 });
            C.dot(t, st.ahead, { r: 5, color: 'gold' });
            C.text('t → 0: infinitely many ahead', 0.04, 12.6, { size: 11, weight: 600, color: 'red' });
          }
        });
        v.readout(() => {
          if (!st) return '';
          const { t, reg, speed, n } = st, f = (x) => v.fix(x, 4);
          v.legend(reg ? [['teal', 'tasks behind the runner', { area: true }], ['purple', 'tasks still ahead'], ['gold', 'now']] : [['blue', 'distance covered $1-2^{-n}$'], ['orange', 'time used', { dash: true }], ['purple', 'tasks completed'], ['gold', 'now']]);
          if (reg) return t >= 1 ? `$t = ${f(t)}$: the runner is through, and every task is done.` : `$t = ${f(t)}$: the runner is at ${f(t)}. **Infinitely many** tasks are already behind (every interval below ${f(t)}), and **${st.ahead}** are still ahead. No task came first: reaching $2^{-k}$ always required reaching $2^{-k-1}$ before.`;
          if (!speed) return `Each task takes 0.1 time units whatever its length: after **${n}** tasks the time used is ${v.fix(TAU * n, 1)} and grows without bound, while the distance $1-2^{-${n}} = ${f(1 - 2 ** -n)}$ stays below 1. The runner never arrives: the answer to Zeno needs the task times to shrink.`;
          if (!isFinite(n)) return `$t = ${f(t)} \\ge 1$: **all** the infinitely many tasks are done (although none of them is the last), and the runner has crossed the finish line. Total time $\\sum_{k\\ge1}2^{-k} = 1$ (geometric series).`;
          return `$t = ${f(t)}$: **${n}** tasks done; the runner is at $1-2^{-${n}} = ${f(1 - 2 ** -n)}$ with $2^{-${n}}$ still to go, and ${n === 0 ? 'no time has been used up by finished tasks yet' : `the finished tasks took $\\sum_{k\\le ${n}}2^{-k} = ${f(1 - 2 ** -n)}$`}. All infinitely many tasks take $\\sum_{k\\ge1}2^{-k} = 1$, so the runner arrives at $t = 1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Paradox',
      name: 'Achilles and the tortoise',
      statement: String.raw`Achilles runs $r^{-1}$ times as fast as a tortoise that starts a distance $d$ ahead ($0<r<1$). **Zeno:** by the time Achilles reaches the tortoise’s starting point, the tortoise has moved on; by the time he reaches that point, it has moved on again; and so on forever, so Achilles never catches it.

**Answer:** the catch-up stages last $\tfrac{d}{v_A},\ \tfrac{d}{v_A}r,\ \tfrac{d}{v_A}r^2,\dots$, a geometric series with sum $\dfrac{d}{v_A(1-r)}=\dfrac{d}{v_A-v_T}$. That is exactly the time at which the position–time lines $x=v_At$ and $x=d+v_Tt$ cross. There are infinitely many stages, but they all lie before the moment of overtaking.`,
      idea: String.raw`Zeno’s description cuts the time before the overtaking into infinitely many pieces. It never mentions any time after that moment, so it cannot show that the overtaking does not happen. Each stage is $r$ times the previous one, and the geometric series (pma 3.26) sums the stage times to the crossing time that elementary algebra gives directly. If the tortoise were as fast as Achilles ($r\ge1$), the stages would not shrink, the series would diverge, and Achilles would indeed never catch up. The paradox has the same structure as the dichotomy (2.1), and the same debate applies: is completing an infinite sequence of stages unproblematic once the sum is finite?`,
      caption: String.raw`Drag the time $t$. The track at the top shows Achilles (A, blue) and the tortoise (T, green), with flags where the tortoise was at the start of each stage. In the position–time diagram the stages form a gold staircase between the two lines, converging to their crossing. The bars show the stage durations and their running total, which approaches the crossing time. Push the speed ratio $r$ to 1 or beyond: the staircase no longer converges and the lines never meet.`,
      deps: ['phil-2.1', 'pma-3.26'],
      refs: ['Sainsbury ch. 1', 'SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC',
      tags: ['infinity', 'series', 'motion'],
      viz(v) {
        const vA = 10;
        const dS = v.slider('head start $d$ (m)', 10, 100, 50, { step: 1 });
        const rS = v.slider('speed ratio $r = v_T/v_A$', 0.1, 1.2, 0.5, { step: 0.01 });
        const tS = v.slider('time $t$ (s)', 0, 40, 8.5, { step: 0.01 });
        const top = v.stage({ x: [-4, 210], y: [-0.9, 1.1], axes: false, height: 110, full: true });
        const S = v.stage({ x: [0, 20], y: [0, 210], axes: 'box', height: 320, xlabel: 't (s)', ylabel: 'x (m)', weight: 1.35 });
        const B = v.stage({ x: [0.2, 12.8], y: [0, 12], axes: 'box', height: 320, title: 'stage durations and running total (s)', weight: 1, xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });
        let st = null;
        v.render(() => {
          const d = dS.value, r = rS.value, t = tS.value, vT = r * vA, conv = r < 1;
          const tStar = conv ? d / (vA - vT) : Infinity;
          const T = Math.max(12, Math.min(40, conv ? 1.3 * tStar : 30), t * 1.05), X = Math.max(vA * T, d + vT * T) * 1.04;
          S.setView([-0.06 * T, T], [-0.07 * X, X]);
          // stages: end times T_k and positions X_k (Achilles reaches X_k at T_k)
          const Tk = [0], Xk = [0];
          for (let k = 1; k <= 60; k++) { Tk.push(Tk[k - 1] + (d / vA) * r ** (k - 1)); Xk.push(Xk[k - 1] + d * r ** (k - 1)); if (Tk[k] > 1e4) break; }
          const nDone = Tk.filter((x, k) => k > 0 && x <= t + 1e-9).length;
          // ---- position-time diagram
          S.line(0, 0, T, vA * T, { color: 'blue', width: 2.6 });
          S.line(0, d, T, d + vT * T, { color: 'green', width: 2.6 });
          const cob = [[0, d]];
          for (let k = 1; k < Tk.length; k++) { if (Tk[k] > T) break; cob.push([Tk[k], Xk[k]], [Tk[k], d + vT * Tk[k]]); }
          S.path(cob, { color: 'gold', width: 1.8 });
          for (let k = 1; k < Math.min(Tk.length, 40); k++) if (Tk[k] <= T) S.dot(Tk[k], Xk[k], { r: k <= nDone ? 3.5 : 2.5, color: 'gold' });
          if (conv && tStar <= T) { S.dot(tStar, vA * tStar, { r: 6, color: 'red' }); S.text('overtaking', tStar, vA * tStar, { dx: 10, dy: 12, size: 11.5, weight: 600, color: 'red' }); }
          S.vline(t, { color: 'muted', dash: [4, 4], width: 1.2 });
          S.dot(t, vA * t, { r: 5, color: 'blue' }); S.dot(t, d + vT * t, { r: 5, color: 'green' });
          S.text('Achilles', T * 0.16, vA * T * 0.16, { dx: 8, dy: 10, size: 12, weight: 600, color: 'blue' });
          S.text('tortoise', T * 0.04, d + vT * T * 0.04, { dy: -12, size: 12, weight: 600, color: 'green' });
          // ---- track
          const xmax = Math.max(vA * t, d + vT * t, conv ? vA * tStar : 0, 60) * 1.08;
          top.setView([-0.02 * xmax, xmax], [-0.9, 1.1]);
          top.line(0, 0, xmax, 0, { color: 'faint', width: 1 });
          top.line(0, -0.25, 0, 0.25, { color: 'ink', width: 1.5 }); top.text('start', 0, -0.55, { align: 'center', size: 10.5, color: 'muted' });
          for (let k = 1; k <= Math.min(nDone + 1, 30); k++) { const x = Xk[k]; top.line(x, 0, x, 0.55, { color: 'gold', width: 1.4, alpha: k <= nDone ? 1 : 0.4 }); if (k <= 4) top.text(`${k}`, x, 0.72, { align: 'center', size: 10.5, color: 'gold' }); }
          top.dot(vA * t, 0, { r: 7, color: 'blue', label: 'A', labelPos: 's' });
          top.dot(d + vT * t, 0, { r: 7, color: 'green', label: 'T', labelPos: 's' });
          top.corner(`t = ${v.fix(t, 2)} s`, 'tr');
          // ---- stage durations
          const tot12 = Tk[Math.min(12, Tk.length - 1)], yMax = (conv ? Math.max(tStar, tot12) : tot12) * 1.15;
          B.setView([0.2, 12.8], [-0.09 * yMax, yMax]);
          const run = [];
          for (let k = 1; k <= 12 && k < Tk.length; k++) {
            const du = Tk[k] - Tk[k - 1];
            B.rect(k - 0.32, 0, k + 0.32, du, { fill: 'gold', fillAlpha: k <= nDone ? 0.75 : 0.25, color: 'gold', width: 1 });
            run.push([k - 0.5, Tk[k]], [k + 0.5, Tk[k]]);
          }
          B.path(run, { color: 'purple', width: 2.2 });
          if (conv) { B.hline(tStar, { color: 'red', dash: [6, 4], width: 1.4 }); B.text(`crossing time ${v.fix(tStar, 2)} s`, 12.6, tStar, { align: 'right', dy: -9, size: 11, weight: 600, color: 'red' }); }
          st = { d, r, t, tStar, nDone, conv, sum: conv ? (d / vA) / (1 - r) : Infinity };
        });
        v.legend([['blue', 'Achilles $x = v_A t$'], ['green', 'tortoise $x = d + v_T t$'], ['gold', 'Zeno’s stages'], ['purple', 'running total of stage times']]);
        v.readout(() => {
          if (!st) return '';
          const { d, r, t, tStar, nDone, conv, sum } = st;
          const head = `By $t = ${v.fix(t, 2)}$ s, **${nDone >= 59 ? 'all but finitely many visible' : nDone}** stage${nDone === 1 ? '' : 's'} finished · stage $k$ lasts $\\tfrac{d}{v_A}r^{k-1} = ${v.fix(d / vA, 2)}\\times${v.fix(r, 2)}^{k-1}$ s`;
          if (!conv) return head + ` · with $r = ${v.fix(r, 2)} \\ge 1$ the stages do not shrink, $\\sum r^{k}$ diverges, and the lines never cross: Achilles really never catches up.`;
          return head + ` · all stages together: $\\tfrac{d/v_A}{1-r} = ${v.fix(sum, 3)}$ s · the lines cross at $t^* = \\tfrac{d}{v_A - v_T} = ${v.fix(tStar, 3)}$ s ✓ · ${t < tStar ? 'still before the overtaking' : '**overtaken**: every one of the infinitely many stages is over'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Paradox',
      name: 'The arrow',
      statement: String.raw`**Zeno:** at any single instant a flying arrow occupies a region exactly its own size, and in an instant it has no time to move, so at that instant it is at rest. Time is made up of instants, so the arrow is at rest throughout its flight, and motion is impossible.

**The modern answer** (the *at-at theory*, Russell): motion is nothing more than being at different places at different times. Velocity at an instant is not a property visible in a snapshot. It is the limit of average velocities $\dfrac{x(t_0+h)-x(t_0)}{h}$ over shrinking intervals around $t_0$, a derivative, which can be non-zero even though the arrow covers no distance *in* the instant itself. Whether this captures what motion really is remains disputed.`,
      idea: String.raw`In a single instant the displacement is $0$ and the elapsed time is $0$, so the instantaneous ratio is $0/0$, not $0$. Zeno’s inference from “no distance covered in an instant” to “at rest at that instant” fails, because being at rest at $t_0$ means having zero velocity, a derivative (pma 5.1), and that depends on where the arrow is at neighbouring times. A snapshot of a moving arrow and of a resting arrow can be identical, while their difference quotients converge to different limits. Some philosophers (Tooley, Lange and others) object that velocity should be an intrinsic state of the arrow at the instant, the cause of where it goes next, rather than a relation to other times. On that view the at-at theory leaves something out, and the debate continues.`,
      caption: String.raw`Slide the instant $t_0$. In the gold frame the snapshot of the flying arrow is identical to that of an arrow at rest in the same place; only the neighbouring frames, at earlier and later instants, reveal the motion. In the position–time graph, shrink $h$: the secant through $t_0$ and $t_0+h$ turns into the tangent, and with **zoom with h** the curve straightens out under magnification. The right panel plots the difference quotient against $h$ on a log scale: it converges to the velocity, while at $h = 0$ itself there is only $0/0$. Toggle the arrow at rest to compare.`,
      deps: ['pma-5.1'],
      refs: ['Sainsbury ch. 1', 'SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC; at-at theory: Bertrand Russell, 1903',
      tags: ['motion', 'derivative', 'instants'],
      viz(v) {
        const t0S = v.slider('instant $t_0$', 0.2, 3.6, 1.5, { step: 0.01 });
        const hS = v.slider('interval $h$', 1e-4, 1, 0.5, { log: true });
        const zoom = v.toggle('zoom with h', false);
        const rest = v.toggle('the arrow is at rest', false);
        const xm = (t) => 0.6 + 1.1 * t - 0.12 * t * t, vm = (t) => 1.1 - 0.24 * t;
        const strip = v.stage({ x: [-0.05, 10.05], y: [-1.12, 1.55], axes: false, height: 180, full: true });
        const G = v.stage({ x: [0, 4], y: [0, 3.4], axes: 'box', height: 300, xlabel: 't', ylabel: 'x', weight: 1.1 });
        const Q = v.stage({ x: [2.5e-5, 1], y: [-0.15, 1.3], xlog: true, axes: 'box', height: 300, xlabel: 'h', title: 'difference quotient $\\frac{x(t_0+h)-x(t_0)}{h}$', weight: 1 });
        let st = null;
        v.render(() => {
          const t0 = t0S.value, h = hS.value, still = rest.value;
          const X = (t) => (still ? xm(t0) : xm(t)), V = still ? 0 : vm(t0);
          // ---- film strip: five frames around t0, for a flying arrow and for an arrow at rest
          const DT = 0.5, fx = (i, pos) => 2 * i + 0.15 + ((pos - 0.2) / 3.3) * 1.7;
          for (let i = 0; i < 5; i++) {
            const tt = t0 + (i - 2) * DT, mid = i === 2;
            strip.rect(2 * i + 0.06, -0.78, 2 * i + 1.94, 1.22, { color: mid ? 'gold' : 'faint', width: mid ? 2.6 : 1, fill: mid ? 'gold' : 'muted', fillAlpha: mid ? 0.08 : 0.03 });
            strip.text(mid ? `t₀ = ${v.fix(t0, 2)}` : `t₀ ${i < 2 ? '−' : '+'} ${v.fix(Math.abs(i - 2) * DT, 1)}`, 2 * i + 1, 1.38, { align: 'center', size: 11, weight: mid ? 700 : 500, color: mid ? 'gold' : 'muted' });
            for (const [y, col, pos] of [[0.62, 'blue', xm(tt)], [-0.3, 'purple', xm(t0)]]) {
              strip.line(2 * i + 0.15, y - 0.2, 2 * i + 1.85, y - 0.2, { color: 'faint', width: 1 });
              if (pos > 0.25 && pos < 3.55) drawArrow(strip, fx(i, pos), y, 0.42, col);
            }
          }
          strip.text('flying', 0.12, 1.03, { size: 10.5, weight: 600, color: 'blue' });
          strip.text('at rest', 0.12, 0.1, { size: 10.5, weight: 600, color: 'purple' });
          strip.text('in the gold frame the two snapshots are identical; only comparing frames reveals the motion', 5, -0.96, { align: 'center', size: 11, color: 'muted' });
          // ---- position-time graph with secant and tangent
          if (zoom.value) { const w = Math.max(2.5 * h, 0.004); G.setView([t0 - w, t0 + w], [X(t0) - w * 1.3, X(t0) + w * 1.3]); } else G.setView([0, 4], [0, 3.4]);
          G.fn(X, { color: 'blue', width: 2.6 });
          const slope = (X(t0 + h) - X(t0)) / h;
          G.fn((t) => X(t0) + V * (t - t0), { color: 'green', width: 1.6, dash: [6, 4] });
          G.fn((t) => X(t0) + slope * (t - t0), { color: 'orange', width: 2 });
          G.dot(t0, X(t0), { r: 5.5, color: 'gold' }); G.dot(t0 + h, X(t0 + h), { r: 4.5, color: 'orange' });
          // ---- difference quotient against h
          Q.hline(V, { color: 'green', dash: [6, 4], width: 1.6 });
          Q.fn((hh) => (X(t0 + hh) - X(t0)) / hh, { color: 'orange', width: 2.4 });
          Q.dot(h, slope, { r: 5, color: 'orange' });
          Q.text(`v(t₀) = ${v.fix(V, 4)}`, 1.2e-3, V, { dy: -11, size: 11.5, weight: 600, color: 'green' });
          Q.text('← h → 0: the quotient converges', 1.2e-4, 1.2, { size: 11, color: 'muted' });
          st = { t0, h, slope, V, still, x: X(t0) };
        });
        v.legend([['blue', 'position $x(t)$'], ['orange', 'secant over $[t_0, t_0+h]$'], ['green', 'tangent: velocity at $t_0$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { t0, h, slope, V, still, x } = st;
          return `At $t_0 = ${v.fix(t0, 2)}$ the arrow is at $x = ${v.fix(x, 3)}$ in both snapshots · average velocity over $h = ${v.sci(h, 2)}$: $${v.fix(slope, 5)}$ · limit as $h\\to0$: $v(t_0) = ${v.fix(V, 5)}$ · ${still ? 'the resting arrow’s quotients are all 0, so its velocity is 0' : 'non-zero, although in the instant itself the arrow covers distance 0 in time 0, and $0/0$ has no value'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Paradox',
      name: 'The stadium (moving rows)',
      statement: String.raw`Three equal rows of blocks: row $A$ is at rest, row $B$ moves left and row $C$ moves right, both at the same speed. In the time a block of $B$ passes one block of $A$, it passes *two* blocks of $C$. Aristotle reports Zeno as concluding that “half the time equals double the time”, which taken literally is just a mistake about relative motion.

The paradox has teeth on an **atomistic** view of space and time. Suppose time comes in indivisible atoms and a block moves one place per atom. Then in one atom the leading block of $B$ passes two blocks of $C$, and there is a $C$ block that it is never beside at any instant: it is on one side at one atom and on the other side at the next. To be beside it, $B$ would need half an atom, so the atoms would be divisible after all.`,
      idea: String.raw`With continuous time, the leading block of $B$ is beside the $C$ blocks at times $\tfrac12, 1, \tfrac32, 2$ and beside the $A$ blocks at times $0, 1, 2$. Its speed relative to $C$ is twice its speed relative to $A$, and nothing is paradoxical. With atomic time only the instants $0, 1, 2$ exist, so the events at $\tfrac12$ and $\tfrac32$ have no time at which to happen: $B$ jumps past those $C$ blocks. This is the classical argument that discrete space and time cannot also allow relative motion at the speed of one place per atom (2.3 raises the related question of what happens *at* an instant). Interpreters disagree about which reading Zeno intended, and about whether a discrete world must give up continuity of passing in this way (cellular automata, for example, live with it).`,
      caption: String.raw`Slide the time. In **continuous** time the leading block $B_1$ is beside $C_1$, $C_2$, $C_3$, $C_4$ in turn, at half-integer and integer times. Switch to **atoms of time**: only whole-number instants exist, and the timeline marks in red the passing events that fall between instants. At those events $B_1$ passes a $C$ block without ever being beside it.`,
      deps: ['phil-2.3'],
      refs: ['Sainsbury ch. 1', 'SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC (Aristotle, Physics VI.9)',
      tags: ['motion', 'discreteness'],
      viz(v) {
        const mode = v.select('time', [{ value: 'cont', label: 'continuous' }, { value: 'atom', label: 'atoms of time' }], 'cont');
        const tS = v.slider('time (atoms)', 0, 2, 0.5, { step: 0.01 });
        const S = v.stage({ x: [-2.6, 6.6], y: [-0.55, 3.2], axes: false, height: 230, full: true });
        const TL = v.stage({ x: [-0.12, 2.42], y: [-0.7, 2.1], axes: false, height: 160, full: true });
        const posA = (i) => i - 1, posB = (i, t) => 1 + i - t, posC = (j, t) => 2 - j + t; // B1 leads to the left, C1 leads to the right
        const ROWS = [['B', 2.35, 'orange', posB, '← moving left'], ['A', 1.35, 'muted', (i) => posA(i), 'at rest'], ['C', 0.35, 'teal', posC, 'moving right →']];
        let st = null;
        v.render(() => {
          const atom = mode.value === 'atom', t = atom ? Math.round(tS.value) : tS.value;
          if (atom && t >= 1) for (const [R, y, col, pos] of ROWS) if (R !== 'A') for (let i = 1; i <= 4; i++) { const x = pos(i, t - 1); S.rect(x + 0.04, y - 0.3, x + 0.96, y + 0.3, { color: col, width: 1.2, dash: [4, 4], alpha: 0.55 }); }
          if (atom && t >= 1) {
            const j = 2 * t - 1, sub = '₀₁₂₃₄';
            S.arrow(posB(1, t - 1) + 0.5, 2.82, posB(1, t) + 0.5, 2.82, { color: 'red', width: 2, head: 7 });
            S.arrow(posC(j, t - 1) + 0.5, -0.12, posC(j, t) + 0.5, -0.12, { color: 'red', width: 2, head: 7 });
            S.text(`B₁ and C${sub[j]} swap sides between atom ${t - 1} and atom ${t}, with no instant at which they are side by side`, 6.5, -0.42, { align: 'right', size: 10.5, weight: 600, color: 'red' });
          }
          for (const [R, y, col, pos, lab] of ROWS) {
            S.text(`row ${R}`, -2.5, y + 0.36, { size: 11.5, weight: 600, color: col === 'muted' ? 'ink' : col });
            S.text(lab, -2.5, y - 0.08, { size: 10.5, color: 'muted' });
            for (let i = 1; i <= 4; i++) {
              const x = pos(i, t), lead = (R === 'B' && i === 1);
              S.rect(x + 0.04, y - 0.3, x + 0.96, y + 0.3, { fill: col, fillAlpha: lead ? 0.75 : 0.35, color: col, width: lead ? 2.4 : 1.2 });
              S.tex(`${R}_{${i}}`, x + 0.5, y, { size: 14, color: 'ink' });
            }
          }
          // who is B1 beside right now?
          const b1 = posB(1, t), cb = [1, 2, 3, 4].find((j) => Math.abs(posC(j, t) - b1) < 1e-6), ab = [1, 2, 3, 4].find((i) => Math.abs(posA(i) - b1) < 1e-6);
          S.line(b1 + 0.5, 0.0, b1 + 0.5, 2.75, { color: 'gold', width: 1.6, dash: [5, 4] });
          S.corner(`t = ${atom ? t + ' (atom)' : v.fix(t, 2)}:  B₁ beside ${ab ? 'A' + '₀₁₂₃₄'[ab] : 'no A block'} and ${cb ? 'C' + '₀₁₂₃₄'[cb] : 'no C block'}`, 'tr', { color: 'gold', weight: 600 });
          // ---- timeline of passing events
          TL.line(0, 0.55, 2, 0.55, { color: atom ? 'faint' : 'ink', width: atom ? 1 : 2.4, dash: atom ? [3, 5] : null });
          for (const k of [0, 1, 2]) { TL.dot(k, 0.55, { r: 5, color: 'ink' }); TL.text(atom ? `atom ${k}` : `t = ${k}`, k, 0.08, { align: 'center', size: 11, color: 'muted' }); }
          const evs = [];
          for (let j = 1; j <= 4; j++) evs.push({ t: j / 2, who: `C${'₀₁₂₃₄'[j]}`, row: 'C' });
          for (let i = 1; i <= 3; i++) evs.push({ t: 3 - i, who: `A${'₀₁₂₃₄'[i]}`, row: 'A' });
          evs.forEach((e) => {
            const ok = !atom || Number.isInteger(e.t), y = e.row === 'C' ? 1.15 : 1.75, col = ok ? (e.row === 'C' ? 'teal' : 'muted') : 'red';
            TL.line(e.t, 0.6, e.t, y - 0.15, { color: col, width: 1.2, alpha: 0.7 });
            TL.dot(e.t, y, { r: 5, color: col, hollow: !ok });
            TL.text(`${ok ? '' : '✗ '}beside ${e.who}`, e.t, y, { dx: 8, size: 11, weight: 600, color: col });
          });
          TL.vline(t, { color: 'gold', width: 2 });
          const missed = atom ? evs.filter((e) => !Number.isInteger(e.t)).map((e) => e.who) : [];
          st = { t, atom, missed, ab, cb };
        });
        v.legend([['orange', 'row B (leading block $B_1$ bold)', { area: true }], ['teal', 'row C', { area: true }], ['red', 'passing with no instant beside', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { t, atom, missed } = st;
          if (atom) return `Atoms of time: between atom 0 and atom 1, $B_1$ moves one place past row $A$ but two places past row $C$. It is never beside ${missed.join(' or ')} at any instant: it is on one side at one atom and on the other side at the next. To pass them continuously it would need the instants $t = \\tfrac12$ and $t = \\tfrac32$, half-atoms that do not exist.`;
          return `Continuous time, $t = ${v.fix(t, 2)}$: $B_1$ moves at speed 1 relative to $A$ and speed 2 relative to $C$, so it is beside $C_1, C_2, C_3, C_4$ at $t = \\tfrac12, 1, \\tfrac32, 2$ and beside $A_3, A_2, A_1$ at $t = 0, 1, 2$. Every passing has its instant, and nothing is paradoxical.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Paradox',
      name: 'Thomson’s lamp',
      statement: String.raw`A lamp is off. One minute before noon it is switched on; half a minute before noon it is switched off; a quarter of a minute before noon, on again; and so on, the switch being pressed at $2^{-k}$ minutes before noon for every $k = 0, 1, 2, \dots$. The switching times converge to noon, so infinitely many presses (a **supertask**) are completed by noon. **Is the lamp on or off at noon?** Every press that turns it off is followed by one that turns it on, and vice versa.

The sequence of states, on, off, on, off, …, has **no limit**, so continuity cannot settle the question. Thomson (1954) concluded that supertasks are impossible. Benacerraf (1962) replied that the story only describes the lamp *before* noon, so it is consistent with the lamp being on at noon and also with its being off. On that view the description is incomplete, not contradictory. The debate over whether supertasks are logically or physically possible continues.`,
      idea: String.raw`The press times $1-2^{-k}$ (in minutes from the first press) converge, because the total time is a geometric series (2.1). The states form the sequence $s_k = 1, 0, 1, 0, \dots$, which does not converge (pma 3.1): its lim sup is $1$ and its lim inf is $0$. Every instruction in the story mentions a time strictly before noon, so specifying the noon state contradicts none of them. That is Benacerraf’s point, and it also defeats Thomson’s argument, which assumed that the noon state must be fixed by the earlier ones. The average of the first $n$ states tends to $\tfrac12$, the same value as the Cesàro sum of Grandi’s series $1-1+1-\dots$. That is a fact about averages, not about the lamp, which is never half on. Physical versions add further problems (a switch moving infinitely fast, or ever shorter pulses of current), and some argue these show supertasks to be physically impossible even if logically consistent.`,
      caption: String.raw`Move toward noon with the slider ($u$ counts halvings: the time is $2^{-u}$ minutes before noon). The lamp shows the current state. Below, the presses are evenly spaced on a logarithmic clock, and the state is a square wave that never settles, while the purple dots (the average of the states so far) approach $\tfrac12$. Choose the state at noon yourself: the checker confirms that **either** choice satisfies every instruction in the story.`,
      deps: ['phil-2.1', 'pma-3.1'],
      refs: ['SEP “Supertasks”', 'Thomson 1954', 'Benacerraf 1962'],
      credit: 'James F. Thomson, 1954',
      tags: ['supertasks', 'infinity', 'limits'],
      viz(v) {
        const uS = v.slider('halvings $u$ (time $= 2^{-u}$ min before noon)', -1, 16, 6.4, { step: 0.01 });
        const noon = v.select('state at noon (you decide)', [{ value: 1, label: 'on' }, { value: 0, label: 'off' }], 1);
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.75, 1.6], equal: true, axes: false, height: 260, weight: 0.55 });
        const W = v.stage({ x: [-2.9, 19.05], y: [-0.55, 1.45], axes: false, height: 260, weight: 1.45 });
        const stateAt = (u) => (u < 0 ? 0 : Math.floor(u) % 2 === 0 ? 1 : 0);
        let st = null;
        v.render(() => {
          const u = uS.value, s = stateAt(u), presses = u < 0 ? 0 : Math.floor(u) + 1, pick = +noon.value;
          // ---- the lamp
          const on = s === 1;
          if (on) for (let k = 0; k < 12; k++) { const a = (k / 12) * 2 * Math.PI; if (k >= 7 && k <= 11) continue; L.line(0.95 * Math.cos(a), 0.35 + 0.95 * Math.sin(a), 1.35 * Math.cos(a), 0.35 + 1.35 * Math.sin(a), { color: 'gold', width: 2.5 }); }
          L.circle(0, 0.35, 0.78, { fill: on ? 'gold' : 'muted', fillAlpha: on ? 0.75 : 0.15, color: on ? 'gold' : 'muted', width: 2.5 });
          L.rect(-0.32, -0.75, 0.32, -0.38, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1.5 });
          L.text(on ? 'ON' : 'OFF', 0, 0.35, { align: 'center', size: 18, weight: 700, color: on ? 'ink' : 'muted' });
          L.text(u < 0 ? 'before the first press' : `${presses} press${presses === 1 ? '' : 'es'} so far`, 0, -1.08, { align: 'center', size: 12, weight: 600, color: 'ink' });
          L.text(`${v.fix(2 ** -u * 60, u > 9 ? 4 : 2)} s before noon`, 0, -1.45, { align: 'center', size: 11.5, color: 'muted' });
          // ---- the square wave on a logarithmic clock
          W.line(-1, 0, 17.2, 0, { color: 'faint', width: 1 });
          const wave = [[-1, 0]];
          for (let k = 0; k <= 17; k++) { const a = Math.min(k, 17.2); wave.push([a, stateAt(k - 0.5)], [a, stateAt(k + 0.5)]); }
          wave.push([17.2, stateAt(16.5)]);
          W.clip(() => W.path(wave, { color: 'faint', width: 1.4 }), [-1.3, 17.2]);
          const done = wave.filter((p) => p[0] <= u);
          W.clip(() => { W.path([...done, [u, s]], { color: 'gold', width: 2.6 }); for (let k = 0; k <= Math.min(u, 17); k++) W.rect(k, 0, Math.min(k + 1, u), stateAt(k + 0.5), { fill: 'gold', fillAlpha: 0.18, stroke: false }); }, [-1.3, 17.2]);
          // running average of states after each press
          let sum = 0;
          for (let k = 0; k <= 16; k++) { sum += stateAt(k + 0.5); W.dot(k + 0.5, sum / (k + 1), { r: 3.2, color: 'purple', alpha: k <= u ? 1 : 0.3 }); }
          W.line(-1, 0.5, 17.2, 0.5, { color: 'purple', width: 1, dash: [4, 4], alpha: 0.6 });
          W.vline(u, { color: 'ink', width: 1.2, dash: [3, 3] });
          // noon column
          W.rect(17.45, -0.3, 18.5, 1.3, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.4, dash: [5, 4] });
          W.text('noon', 17.97, -0.45, { align: 'center', size: 11.5, weight: 700, color: 'accent' });
          W.dot(17.97, pick, { r: 7, color: 'accent' });
          W.text('your pick', 17.97, 1.36, { align: 'center', size: 10.5, weight: 600, color: 'accent' });
          for (const [k, lab] of [[0, '1 min'], [2, '¼'], [4, '1/16'], [8, '1/256'], [12, '1/4096'], [16, '1/65536']]) W.text(lab, k, -0.25, { align: 'center', size: 10.5, color: 'muted' });
          W.text('presses, at minutes before noon →', 3.2, 1.32, { size: 11, color: 'muted' });
          W.text('on', -1.5, 1, { align: 'right', size: 11, weight: 600, color: 'muted' }); W.text('off', -1.5, 0, { align: 'right', size: 11, weight: 600, color: 'muted' });
          st = { u, s, presses, pick, avg: presses ? sum / 17 : 0 };
        });
        v.legend([['gold', 'state before noon'], ['purple', 'average of the states so far', { dot: true }], ['accent', 'your stipulated state at noon', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { u, s, presses, pick } = st;
          let sum = 0; for (let k = 0; k < presses; k++) sum += k % 2 === 0 ? 1 : 0;
          return `${presses} presses so far, lamp **${s ? 'on' : 'off'}**${presses ? `, average of the states so far ${v.fix(sum / presses, 3)}` : ''} · the states $1,0,1,0,\\dots$ have $\\limsup = 1$ and $\\liminf = 0$: **no limit** · consistency check with noon = **${pick ? 'on' : 'off'}**: each of the infinitely many instructions (“press at $2^{-k}$ min before noon”) concerns a time before noon and is satisfied ✓. The other choice passes the check too, so the story does not determine the noon state.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Paradox',
      name: 'Ross–Littlewood balls and urn',
      statement: String.raw`Balls numbered $1, 2, 3, \dots$ are put into an urn in stages that converge to noon. At stage $n$ (at $2^{-n}$ minutes before noon) balls $10n-9, \dots, 10n$ go in and one ball is taken out. After stage $n$ the urn holds $9n$ balls, a number that grows without bound. **How many balls are in the urn at noon?** The answer depends on *which* ball is removed:
- remove ball $n$ at stage $n$: every ball is eventually removed, and the urn is **empty** at noon;
- remove ball $10n$ at stage $n$: the balls not divisible by 10 are never removed, and the urn holds **infinitely many**;
- remove a ball chosen uniformly at random: with probability 1 every ball is eventually removed, and the urn is **empty** (Ross 1976).

So the count at noon is not the limit of the counts. Whether the set-theoretic answer correctly describes the urn at noon is itself disputed: some hold that the story does not determine the state at noon at all, as with Thomson’s lamp.`,
      idea: String.raw`Ask, for each ball, *when* it leaves. If ball $b$ is removed at a finite stage, it is absent from the urn at noon. If it is never removed, it is present. With the first rule ball $b$ leaves at stage $b$, so the set of balls left at noon is the limit of the sets of balls in the urn, which is empty, even though the sizes of those sets tend to infinity. Cardinality is not continuous under such limits, and countable sets (pma 2.4) can be emptied one element at a time. In the random version ball $b$ survives stage $j$ with probability $1-\tfrac{1}{9j+1}$, and the product of these factors tends to $0$, because $\sum \tfrac1{9j+1}$ diverges. It does so very slowly, like $n^{-1/9}$, so most early balls are still present after millions of stages. Countable additivity then makes “every ball eventually removed” an event of probability 1. Allis and Koetsier defend the set-theoretic answer. Others dispute that the limit of the sets is the state of the urn at noon, or that a supertask fixes any noon state at all (compare Thomson’s lamp, 2.5).`,
      caption: String.raw`Choose a removal rule and step through the stages. In the grid each row is one stage’s ten balls: blue balls are in the urn, crossed-out balls have been removed, and the gold ring marks the ball taken out at the current stage. Under every rule the urn holds $9m$ balls after stage $m$. The right panel answers the real question: when does each ball leave? Under the first rule every ball has a finite removal stage, under the second most balls never leave, and in the random version the survival probability of every ball decays to 0, slowly.`,
      deps: ['phil-2.5', 'pma-2.4'],
      refs: ['SEP “Supertasks”', 'Littlewood 1953', 'Ross 1976'],
      credit: 'J. E. Littlewood, 1953; Sheldon Ross, 1976',
      tags: ['supertasks', 'infinity', 'limits'],
      viz(v) {
        const strat = v.select('removal rule', [{ value: 'low', label: 'remove ball $n$ at stage $n$' }, { value: 'ten', label: 'remove ball $10n$' }, { value: 'rnd', label: 'remove a random ball' }], 'low');
        const mS = v.slider('stage $m$', 0, 10, 6, { int: true });
        const G = v.stage({ x: [-1.9, 10.4], y: [-0.28, 11.3], axes: false, height: 390, weight: 1.05 });
        const R = v.stage({ x: [-8, 104], y: [-9, 116], axes: 'box', height: 390, weight: 1 });
        // one seeded random run: removal stage of every ball that ever enters (up to 400 stages)
        const SIM = 400, remRnd = new Map(), alive = [];
        { const r = v.rng(7); const urn = []; for (let s = 1; s <= SIM; s++) { for (let b = 10 * s - 9; b <= 10 * s; b++) urn.push(b); const i = r.int(0, urn.length - 1); remRnd.set(urn[i], s); urn.splice(i, 1); alive.push(urn.filter((b) => b <= 100).length); } }
        const remStage = (b, k) => (k === 'low' ? b : k === 'ten' ? (b % 10 === 0 ? b / 10 : Infinity) : remRnd.get(b) ?? Infinity);
        // survival probability of ball b through stage n: prod_{j=ceil(b/10)}^{n} (1 - 1/(9j+1)); exact logs to 2e5, then the integral tail
        const NEX = 200000, cum = new Float64Array(NEX + 1);
        for (let j = 1; j <= NEX; j++) cum[j] = cum[j - 1] + Math.log(1 - 1 / (9 * j + 1));
        const surv = (b, n) => { const j0 = Math.ceil(b / 10); if (n < j0) return 1; const m = Math.min(n, NEX); let l = cum[Math.floor(m)] - cum[j0 - 1]; if (n > NEX) l -= Math.log((9 * n + 5.5) / (9 * NEX + 5.5)) / 9; return Math.exp(l); };
        let st = null;
        v.render(() => {
          const k = strat.value, m = mS.value;
          // ---- the grid of balls, one row per stage
          for (let n = 1; n <= 10; n++) {
            const y = 10.25 - n;
            G.text(`stage ${n}`, -0.25, y, { align: 'right', size: 11, weight: n === m ? 700 : 500, color: n === m ? 'ink' : 'muted' });
            for (let j = 1; j <= 10; j++) {
              const b = 10 * (n - 1) + j, x = j - 0.5, rs = remStage(b, k);
              if (n > m) { G.circle(x, y, 0.36, { color: 'faint', width: 1 }); continue; }
              const gone = rs <= m;
              G.circle(x, y, 0.38, { fill: gone ? 'muted' : 'blue', fillAlpha: gone ? 0.1 : 0.75, color: gone ? 'faint' : 'blue', width: 1.2 });
              G.text(String(b), x, y, { align: 'center', size: b >= 100 ? 8.5 : 9.5, weight: 600, color: gone ? 'muted' : 'panel', halo: false });
              if (gone) G.line(x - 0.3, y - 0.3, x + 0.3, y + 0.3, { color: 'red', width: 1.6 });
              if (rs === m) G.circle(x, y, 0.47, { color: 'gold', width: 2.6 });
            }
          }
          const inUrn = (() => { let c = 0; for (let b = 1; b <= 10 * m; b++) if (remStage(b, k) > m) c++; return c; })();
          G.text(`after stage ${m}: ${10 * m} in, ${m} out, ${inUrn} in the urn`, 4.95, 10.9, { align: 'center', size: 12.5, weight: 700, color: 'ink' });
          // ---- right panel
          if (k !== 'rnd') {
            R.setView([-8, 104], [-9, 116]); R.setTicks([0, 20, 40, 60, 80, 100], [0, 20, 40, 60, 80, 100]);
            R.setTitle('stage at which ball $b$ is removed');
            R.hband(0, m, { color: 'red', alpha: 0.07 });
            for (let b = 1; b <= 100; b++) {
              const rs = remStage(b, k);
              if (isFinite(rs)) R.dot(b, rs, { r: 3, color: rs <= m ? 'red' : 'blue' });
              else R.line(b, 101, b, 105, { color: 'blue', width: 1.6, alpha: 0.8 });
            }
            R.text(k === 'low' ? 'ball b leaves at stage b: every removal stage is finite' : 'never removed (∞): every ball not divisible by 10', k === 'low' ? 2 : 50, k === 'low' ? 95 : 110, { align: k === 'low' ? 'left' : 'center', size: 11, weight: 600, color: k === 'low' ? 'red' : 'blue' });
            R.text(`removed by stage ${m}`, 60, m + 4, { size: 10.5, color: 'red' });
          } else {
            R.setView([-0.7, 12.4], [-0.09, 1.12]); R.setTicks([[0, '1'], [2, '100'], [4, '10⁴'], [6, '10⁶'], [8, '10⁸'], [10, '10¹⁰'], [12, '10¹²']], [0, 0.25, 0.5, 0.75, 1]);
            R.setTitle('chance a ball is still in the urn after stage $n$');
            for (const [b, col] of [[1, 'blue'], [100, 'teal']]) {
              const pts = []; for (let i = 0; i <= 240; i++) { const e = (12 * i) / 240; pts.push([e, surv(b, 10 ** e)]); }
              R.path(pts, { color: col, width: 2.4 });
              const ex = b === 1 ? 5 : 8.5; R.text(`ball ${b}`, ex, surv(b, 10 ** ex), b === 1 ? { dx: -6, dy: 10, align: 'right', size: 11, weight: 600, color: col } : { dx: 6, dy: -10, size: 11, weight: 600, color: col });
            }
            for (let n = 1; n <= SIM; n = Math.ceil(n * 1.25)) R.dot(Math.log10(n), alive[n - 1] / Math.min(100, 10 * n), { r: 2.8, color: 'gold' });
            R.text('→ 0 like n^(−1/9)', 12.2, 0.2, { align: 'right', size: 11, color: 'muted' });
            R.text('simulated run: share of balls 1–100 still inside', 0.1, 1.06, { size: 10.5, color: 'gold' });
          }
          st = { k, m, inUrn };
        });
        v.legend([['blue', 'in the urn', { dot: true }], ['red', 'removed', { dot: true }], ['gold', 'removed at the current stage', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, m } = st;
          const head = `After stage ${m}: $10\\cdot${m}$ balls in, ${m} out, **${9 * m}** in the urn (the same under every rule, and unbounded as the stages run to noon)`;
          if (k === 'low') return head + ' · ball $b$ leaves at stage $b$, so every ball is gone by noon: the urn is **empty**, although the counts tend to $\\infty$. The limit of the counts is not the count of the limit.';
          if (k === 'ten') return head + ' · only multiples of 10 ever leave, so at noon the urn holds **infinitely many** balls: all those not divisible by 10.';
          return head + ` · ball 1 is still inside after $10^6$ stages with probability ${v.fix(surv(1, 1e6), 3)}, after $10^{12}$ with ${v.fix(surv(1, 1e12), 3)}; the product $\\prod(1-\\tfrac1{9j+1})$ tends to 0, so with probability 1 every ball leaves, and the urn is **empty at noon** almost surely.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Paradox',
      name: 'Benardete’s Grim Reapers',
      statement: String.raw`A man is alive at midnight. There are infinitely many Grim Reapers, numbered $1, 2, 3, \dots$; reaper $n$ will strike at $2^{-n}$ hours past midnight (so reaper 1 at 12:30, reaper 2 at 12:15, …) **if and only if the man is still alive then**, killing him instantly. Reaper 1 guarantees that he is dead by 12:30. But no reaper can strike: reaper $n$ strikes only if the man is alive at its time, which requires every earlier reaper $n+1, n+2, \dots$ to have held back. Reaper $n+1$ would then have found him alive and struck, so reaper $n$ does not strike, and this holds for every $n$. **He is dead, but no reaper killed him.**

With finitely many reapers there is no puzzle: the earliest one strikes. With infinitely many, the reapers’ conditional instructions cannot all be carried out together.`,
      idea: String.raw`Write $s_n$ for “reaper $n$ strikes”. The instructions say $s_n \iff \neg(s_{n+1}\vee s_{n+2}\vee\cdots)$. Suppose some reaper strikes, and let $n$ be the earliest striker (the one with the largest index; if there is no largest, the striker with any index $n$ was preceded by another, violating its own instruction). Then no reaper after $n$ strikes, so reaper $n+1$ found the man alive and should have struck, a contradiction. If nobody strikes, reaper 1 found him alive and should have struck. So no assignment satisfies every instruction, much as no assignment of truth values satisfies Yablo’s infinite list of sentences (4.6). What follows is contested. Most conclude only that such an ensemble of reapers is logically impossible (the “unsatisfiable pact” reading of Hawthorne and Shackel). Pruss and Koons argue that it supports causal finitism, the view that nothing can have infinitely many causal antecedents. Critics of causal finitism reject that step.`,
      caption: String.raw`Click reapers to decide which of them strike, and choose what the infinitely many reapers beyond #10 (closer and closer to midnight) do. The checker marks every reaper whose instruction (“strike iff the man is still alive”) your assignment breaks, and below, an exhaustive search over all assignments reports how many satisfy every instruction. With infinitely many reapers the answer is always none. Tick the finite version and exactly one assignment works: the earliest reaper strikes.`,
      deps: ['phil-2.5'],
      refs: ['SEP “Supertasks”', 'Benardete 1964', 'Hawthorne 2000'],
      credit: 'José Benardete, 1964',
      tags: ['supertasks', 'infinity', 'consistency'],
      viz(v) {
        const N = 10;
        const fin = v.toggle('finite version: only these 10 reapers', false);
        const tail = v.select('reapers beyond #10', [{ value: 'none', label: 'none strike' }, { value: 'all', label: 'all strike' }], 'none');
        const S = v.stage({ x: [-12.4, 1.1], y: [-1.5, 2.45], axes: false, height: 300, full: true });
        let strike = new Set([1]);
        v.button('nobody strikes', () => { strike = new Set(); });
        v.button('only #10 strikes', () => { strike = new Set([N]); });
        S.onClick((x, y) => { const n = Math.round(-x); if (n >= 1 && n <= N && Math.abs(x + n) < 0.45 && y > 0.45 && y < 2.2) { if (strike.has(n)) strike.delete(n); else strike.add(n); } });
        const TIME = (n) => { const sec = 3600 / 2 ** n; return sec >= 60 ? `${v.fix(sec / 60, sec >= 600 ? 0 : sec % 60 ? 2 : 0)} min` : `${v.fix(sec, sec >= 10 ? 1 : 2)} s`; };
        // does the assignment (set of strikers among 1..N, tail behaviour) satisfy every instruction?
        const check = (set, tailAll, finite) => {
          const strikes = (n) => (n <= N ? set.has(n) : !finite && tailAll);
          const alive = (n) => { if (!finite && tailAll) return false; for (let m = n + 1; m <= N; m++) if (strikes(m)) return false; return true; };
          const bad = []; for (let n = 1; n <= N; n++) if (strikes(n) !== alive(n)) bad.push(n);
          return { bad, tailBad: !finite, alive, strikes };
        };
        let st = null;
        v.render(() => {
          const finite = fin.value, tailAll = tail.value === 'all';
          tail.el.hidden = finite;
          const c = check(strike, tailAll, finite);
          // exhaustive search
          let good = 0, goodSet = null;
          for (let mask = 0; mask < 1 << N; mask++) {
            const set = new Set(); for (let n = 1; n <= N; n++) if ((mask >> (n - 1)) & 1) set.add(n);
            for (const ta of finite ? [false] : [false, true]) { const r = check(set, ta, finite); if (!r.bad.length && !r.tailBad) { good++; goodSet = set; } }
          }
          // ---- timeline: midnight far left (off to −∞), 1:00 at x = 0
          S.line(-11.2, 0.25, 0.6, 0.25, { color: 'faint', width: 1 });
          const strikers = [...strike].filter((n) => n <= N);
          const death = !finite && tailAll ? -11.6 : strikers.length ? -Math.max(...strikers) : null;
          if (death == null) S.line(-11.2, 0.25, 0.6, 0.25, { color: 'green', width: 4 });
          else { S.line(-11.2, 0.25, death, 0.25, { color: 'green', width: 4 }); S.line(death, 0.25, 0.6, 0.25, { color: 'red', width: 4, alpha: 0.7 }); }
          S.text(death == null ? 'the man survives every reaper' : death < -10.8 ? 'dead before every shown reaper' : 'alive  →  dead', death == null ? -5 : Math.max(death, -10.8) + 0.1, -0.08, { size: 11, weight: 600, color: death == null ? 'green' : 'red', align: death == null ? 'center' : 'left' });
          S.text('1:00', 0.45, 0.48, { align: 'center', size: 10.5, weight: 600, color: 'muted' });
          for (let n = 1; n <= N; n++) {
            const x = -n, on = c.strikes(n), ok = !c.bad.includes(n), col = on ? 'red' : 'muted';
            S.line(x, 0.62, x, 1.6, { color: col, width: on ? 2.6 : 1.4 });
            S.curve((t) => bez([x + 0.02, 1.62], [x - 0.22, 1.82], [x - 0.5, 1.47], t), 0, 1, { color: col, width: on ? 3.4 : 2, n: 24 });
            S.text(`#${n}`, x, 1.98, { align: 'center', size: 12, weight: 700, color: on ? 'red' : 'ink' });
            S.text(TIME(n), x, 0.48, { align: 'center', size: 9.5, color: 'muted' });
            S.text(ok ? '✓' : '✗', x, -0.62, { align: 'center', size: 15, weight: 700, color: ok ? 'green' : 'red' });
            if (!ok) S.text(c.alive(n) ? 'should strike' : 'should hold back', x, -1.0, { align: 'center', size: 8.5, color: 'red' });
          }
          if (!finite) {
            S.text('…', -11.25, 1.1, { align: 'center', size: 22, weight: 700, color: tailAll ? 'red' : 'muted' });
            S.text('∞ more', -11.25, 1.98, { align: 'center', size: 11, weight: 700, color: 'ink' });
            S.text('✗', -11.25, -0.62, { align: 'center', size: 15, weight: 700, color: 'red' });
            S.text(tailAll ? 'all should hold back' : 'all should strike', -11.25, -1.0, { align: 'center', size: 8.5, color: 'red' });
          } else { S.text('no reapers', -11.35, 1.25, { align: 'center', size: 10.5, color: 'muted' }); S.text('earlier', -11.35, 0.98, { align: 'center', size: 10.5, color: 'muted' }); }
          S.text('← toward midnight          (minutes and seconds after midnight)          strike times →', -5.5, 2.35, { align: 'center', size: 10.5, color: 'muted' });
          st = { c, good, goodSet, finite, strikers, tailAll };
        });
        v.legend([['red', 'strikes (click a reaper)'], ['green', 'instruction kept ✓'], ['red', 'instruction broken ✗', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, good, goodSet, finite, strikers, tailAll } = st;
          const who = strikers.length ? strikers.sort((a, b) => a - b).map((n) => '#' + n).join(', ') : 'none of #1–#10';
          const broken = c.bad.length ? `reaper${c.bad.length > 1 ? 's' : ''} ${c.bad.map((n) => '#' + n).join(', ')}` : 'no shown reaper';
          const space = finite ? `$2^{${N}} = ${2 ** N}$` : `$2^{${N}}\\times2 = ${2 ** (N + 1)}$`;
          return `Strikers: ${who}${finite ? '' : `; beyond #10: ${tailAll ? 'all' : 'none'}`} · instructions broken: ${broken}${finite ? '' : ', and every reaper beyond #10'} · exhaustive search over all ${space} assignments: ` +
            (good ? `**exactly ${good}** keeps every instruction: ${[...goodSet].map((n) => '#' + n).join(', ')} strikes and the rest hold back.` : '**none** keeps every instruction. The infinitely many reapers’ instructions are jointly unsatisfiable, whatever the man’s fate.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Paradox',
      name: 'Galileo’s paradox',
      statement: String.raw`Some natural numbers are squares and most are not, so it seems there are fewer squares than numbers. Yet every number $n$ can be paired with its square $n^2$, and every square with its root:
$$1\leftrightarrow1,\quad 2\leftrightarrow4,\quad 3\leftrightarrow9,\quad\dots$$
so there are exactly as many squares as numbers. Galileo (1638) concluded that “equal”, “greater” and “less” do not apply to infinite quantities. Cantor took the opposite course. He defined two sets to have the **same size** when there is a one-to-one correspondence between them, and accepted that an infinite set has the same size as some of its proper parts. Dedekind made this the *definition* of an infinite set. Hilbert’s hotel dramatises the same fact: a full hotel with rooms $1, 2, 3, \dots$ can take a new guest ($n\mapsto n+1$), infinitely many new guests ($n \mapsto 2n$), or even infinitely many coachloads of them.`,
      idea: String.raw`Two intuitive principles conflict for infinite collections: “if the members of two collections can be paired off one to one, the collections are equally large” (Hume’s principle) and “the whole is larger than any proper part” (Euclid’s fifth common notion). For finite sets both hold, and a map like $n\mapsto n+1$ always leaves someone out (the pigeonhole principle). For $\N$ the maps $n\mapsto n^2$, $n\mapsto n+1$ and $n\mapsto 2n$ are bijections onto proper subsets (pma 2.4), and Cantor’s pairing function even fits countably many countable sets into one (pma 2.12). Density, the proportion $\lfloor\sqrt R\rfloor/R$ of squares below $R$, is a different measure of size, and by it the squares are negligible. Cantor’s choice of bijection as the measure of size is now standard. Benci and Di Nasso’s *numerosities* show that one can instead keep the part–whole principle, at the cost of other properties, so which notion deserves the word “size” is partly a choice.`,
      caption: String.raw`Pick a pairing and drag **move the guests** to carry each number (guest) to its partner (room). In Galileo’s pairing the lines fan out because the squares thin out, yet every number gets exactly one square. In the hotel modes, check that after the move every room holds exactly one guest and nobody is turned away. Tick **finite version** to see the same moves fail. The lower panel plots, against $R$, what share of the numbers $1, \dots, R$ the original guests end up occupying: it tends to 0, 1 or ½, even though in each case they are exactly as many as all the numbers.`,
      deps: ['pma-2.4', 'pma-2.12'],
      see: ['logic-1.1'],
      refs: ['SEP “Infinity”', 'Galileo, Two New Sciences (1638)'],
      credit: 'Galileo Galilei, 1638; the hotel: David Hilbert, 1924',
      tags: ['infinity', 'cardinality', 'bijection'],
      viz(v) {
        const mode = v.select('', [{ value: 'sq', label: 'Galileo: $n\\mapsto n^2$' }, { value: 'n1', label: 'hotel: one new guest' }, { value: '2n', label: 'hotel: a coach' }, { value: 'inf', label: 'hotel: infinitely many coaches' }], 'sq');
        const fin = v.toggle('finite version (rooms 1–20, numbers 1–100)', false);
        const pS = v.slider('move the guests', 0, 1, 1, { step: 0.01 });
        const H = v.stage({ x: [-1.3, 21.3], y: [-2.75, 3.05], axes: false, height: 310, full: true });
        const D = v.stage({ x: [1, 1e6], y: [-0.1, 1.12], xlog: true, axes: 'box', height: 170, full: true, title: 'share of $1, \\dots, R$ taken by the original guests (images)', yticks: [0, 0.5, 1] });
        const CCOL = ['gold', 'orange', 'pink', 'purple'];
        let st = null;
        v.render(() => {
          const k = mode.value, p = pS.value, finite = fin.value;
          const path = (a, b, bulge, col, lab, out = false) => H.clip(() => {
            const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bulge];
            H.curve((t) => bez(a, c, b, t), 0, 1, { color: out ? 'red' : col, width: 1.1, alpha: 0.45, n: 40 });
            const q = bez(a, c, b, p);
            H.dot(q[0], q[1], { r: 8.5, color: out && p > 0.98 ? 'red' : col });
            H.text(lab, q[0], q[1], { align: 'center', size: lab.length > 2 ? 7 : 8.5, weight: 700, color: 'panel', halo: false });
          });
          if (k === 'sq') {
            // top: numbers 1..10; bottom: the number line 1..100 with the squares marked
            const X = (n) => 0.5 + (20 * (n - 1)) / 99;
            H.text('every number n', -1.2, 2.55, { size: 11.5, weight: 600, color: 'blue' });
            H.text('its square n² on the line 1 … 100', -1.2, -0.75, { size: 11.5, weight: 600, color: 'gold' });
            // the same pairing for n = 1..100, squares on the line 1..10 000
            const top = finite ? 100 : 10000, XT = (n) => 0.5 + (20 * (n - 1)) / 99, XB = (m) => 0.5 + (20 * (m - 1)) / (top - 1);
            H.text('n = 1 … 100', -1.2, -1.12, { size: 11, weight: 600, color: 'blue' });
            H.text(finite ? 'n² must stay in the finite range 1 … 100' : 'n² on the line 1 … 10 000', -1.2, -2.62, { size: 11, weight: 600, color: finite ? 'red' : 'gold' });
            H.line(XB(1), -2.33, XB(top), -2.33, { color: 'faint', width: 1.2 });
            for (let n = 1; n <= 100; n++) {
              if (n * n <= top) { H.line(XT(n), -1.36, XB(n * n), -2.3, { color: 'blue', width: 0.8, alpha: 0.3 }); H.line(XB(n * n), -2.33, XB(n * n), -2.18, { color: 'gold', width: 1.2 }); }
              H.dot(XT(n), -1.36, { r: 1.8, color: n * n > top ? 'red' : 'blue', ring: false });
            }
            if (finite) H.text('red: 90 numbers with no square left in range ✗', 20.5, -1.12, { align: 'right', size: 11, weight: 600, color: 'red' });
            H.line(X(1), -0.15, X(100), -0.15, { color: 'faint', width: 1.4 });
            for (let m = 1; m <= 100; m++) { const sq = Number.isInteger(Math.sqrt(m)); H.line(X(m), -0.15, X(m), sq ? 0.15 : -0.02, { color: sq ? 'gold' : 'faint', width: sq ? 2 : 1 }); if (sq) H.text(String(m), X(m), -0.45, { align: 'center', size: 10, weight: 600, color: 'gold' }); }
            for (let n = 1; n <= 10; n++) {
              const x = 2 * n - 0.5;
              H.rect(x - 0.42, 1.75, x + 0.42, 2.25, { color: 'blue', width: 1.2, fill: 'blue', fillAlpha: 0.08 });
              H.text(String(n), x, 2.0, { align: 'center', size: 11, weight: 600, color: 'blue' });
              path([x, 2.0], [X(n * n), 0.15], 0.3, 'blue', String(n));
            }
          } else {
            H.text('before', -1.25, 2.0, { size: 11, weight: 600, color: 'muted' });
            H.text('after', -1.25, 0.0, { size: 11, weight: 600, color: 'muted' });
            for (let r = 1; r <= 20; r++) for (const y of [2.0, 0.0]) { H.rect(r - 0.42, y - 0.32, r + 0.42, y + 0.32, { color: 'faint', width: 1 }); H.text(String(r), r, y + 0.47, { align: 'center', size: 9, color: 'muted' }); }
            if (!finite) H.text('→ ∞', 20.85, 1.0, { align: 'center', size: 13, weight: 700, color: 'muted' });
            else { H.line(20.55, -0.5, 20.55, 2.5, { color: 'red', width: 2 }); H.text('last room', 20.75, 2.75, { align: 'center', size: 10, weight: 600, color: 'red' }); }
            const target = (n) => (k === 'n1' ? n + 1 : 2 * n);
            let ev = 0;
            for (let n = 1; n <= 20; n++) {
              const t = target(n), out = t > 20;
              if (!out) path([n, 2.0], [t, 0.0], -0.25, 'blue', String(n));
              else if (finite) path([n, 2.0], [20.95, 2.55 - 0.3 * ev++], 0, 'blue', String(n), true);
              else path([n, 2.0], [21.7 + (t - 21) * 0.5, 0.0], -0.1, 'blue', String(n));
            }
            if (finite && p > 0.98) H.text('no room!', 20.95, -0.62, { align: 'center', size: 11, weight: 700, color: 'red' });
            if (k === 'n1') {
              H.text('lobby', -0.3, -1.25, { align: 'center', size: 11, color: 'gold', weight: 600 }); path([-0.3, -0.9], [1, 0], 0.2, 'gold', 'new');
              H.text(finite ? 'the hotel ends at room 20: guest 20 has nowhere to go' : 'the rooms go on forever: guest 20 moves to room 21, guest 21 to room 22, … nobody is left out', 10.5, -1.9, { align: 'center', size: 12, weight: 600, color: finite ? 'red' : 'muted' });
            }
            if (k === '2n') {
              H.rect(0.45, -2.05, 10.55, -1.15, { color: 'gold', width: 1.4, fill: 'gold', fillAlpha: 0.07 }); H.text('coach: passengers 1, 2, 3, … → rooms 1, 3, 5, …', 11, -1.6, { size: 11, color: 'gold', weight: 600 });
              for (let s = 1; s <= 10; s++) path([s, -1.6], [2 * s - 1, 0], 0.2, 'gold', `p${s}`);
            }
            if (k === 'inf') {
              for (let c = 1; c <= 4; c++) {
                const x0 = 5 * (c - 1) + 0.55;
                H.rect(x0, -2.35, x0 + 4.4, -1.35, { color: CCOL[c - 1], width: 1.3, fill: CCOL[c - 1], fillAlpha: 0.07 });
                H.text(`coach ${c}`, x0 + 2.2, -2.58, { align: 'center', size: 10, weight: 600, color: CCOL[c - 1] });
                for (let s = 1; s <= 4; s++) {
                  const room = 2 * pairNum(c, s) - 1, src = [x0 + s - 0.3, -1.85];
                  if (room <= 20) path(src, [room, 0], 0.15, CCOL[c - 1], `${c},${s}`);
                  else { H.dot(src[0], src[1], { r: 8.5, color: CCOL[c - 1], alpha: 0.35 }); H.text(`→${room}`, src[0], src[1], { align: 'center', size: 7, weight: 700, color: 'ink' }); }
                }
              }
            }
          }
          // ---- density of the image among 1..R
          const dens = (R) => (k === 'sq' ? Math.floor(Math.sqrt(R)) / R : k === 'n1' ? (R - 1) / R : Math.floor(R / 2) / R);
          if (k !== 'sq') D.hline(1, { color: 'green', dash: [6, 4], width: 1.6 });
          D.fn((R) => dens(Math.floor(R)), { color: 'blue', width: 2.4, n: 600 });
          const R0 = k === 'sq' ? 100 : 20;
          D.dot(R0, dens(R0), { r: 5, color: 'gold', label: `R = ${R0}`, labelPos: 'ne' });
          D.text(k === 'sq' ? 'squares among 1…R: ⌊√R⌋/R → 0' : k === 'n1' ? 'old guests: (R−1)/R → 1' : 'old guests: even rooms, → ½', 9e5, k === 'sq' ? 0.32 : 0.78, { align: 'right', size: 11.5, weight: 600, color: 'blue' });
          if (k !== 'sq') D.text('all guests after the move: every room', 9e5, 1.06, { align: 'right', size: 11, color: 'green' });
          st = { k, p, finite };
        });
        v.legend([['blue', 'original numbers / guests', { dot: true }], ['gold', 'newcomers', { dot: true }], ['red', 'no room left', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, p, finite } = st, done = p > 0.98;
          if (k === 'sq' && finite) return `Finite version: within $1, \\dots, 100$ only the numbers 1–10 have their squares in range, so the 100 numbers cannot be matched one to one with the 10 squares ✗. For finite collections the part really is smaller than the whole.`;
          if (k === 'sq') return `$n\\mapsto n^2$ is one-to-one, and every square is hit, so the squares are **exactly as many** as the natural numbers. Yet only 10 of the first 100 numbers are squares, and the share $\\lfloor\\sqrt R\\rfloor/R$ tends to 0. One-to-one correspondence and proportion are different measures of size.`;
          const pre = done ? 'After the move' : `Move ${Math.round(p * 100)}% done (drag to the end to check)`;
          if (finite) return `${pre}: in a finite hotel guest${k === 'n1' ? ' 20 has' : 's 11–20 have'} **no room** ✗. A finite set is never in one-to-one correspondence with a proper part of itself (the pigeonhole principle); for Dedekind that is what *finite* means.`;
          if (k === 'n1') return `${pre}: room 1 holds the newcomer and room $n+1$ holds guest $n$, so every room has exactly one guest ✓ and nobody is turned away ✓. $n\\mapsto n+1$ is a bijection from $\\mathbb N$ onto $\\mathbb N\\setminus\\{1\\}$.`;
          if (k === '2n') return `${pre}: old guest $n$ is in room $2n$ (the even rooms) and passenger $k$ in room $2k-1$ (the odd rooms): every room is used exactly once ✓. Infinitely many newcomers fit into a full hotel.`;
          return `${pre}: old guests take the even rooms, and passenger $s$ of coach $c$ takes room $2\\pi(c,s)-1$, where $\\pi(c,s) = \\tfrac{(c+s-1)(c+s-2)}{2}+s$ is Cantor’s pairing of $\\mathbb N\\times\\mathbb N$ with $\\mathbb N$. Every room is used exactly once ✓: a countable union of countable sets is countable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Paradox',
      name: 'Gabriel’s horn: finite volume, infinite area',
      statement: String.raw`Rotate the curve $y = 1/x$, $x\ge1$, about the $x$-axis. The resulting horn has **finite volume** and **infinite surface area**:
$$V=\pi\int_1^\infty \frac{dx}{x^2}=\pi,\qquad A=2\pi\int_1^\infty \frac1x\sqrt{1+\frac1{x^4}}\,dx \;\ge\; 2\pi\int_1^\infty\frac{dx}{x}=\infty.$$
The **painter’s paradox**: the horn can be filled with $\pi$ units of paint, yet its inside surface could never be painted. More generally, for $y = x^{-p}$ the volume is finite exactly when $p>\tfrac12$ and the area exactly when $p>1$.`,
      idea: String.raw`The volume integrand is $\pi r^2 = \pi x^{-2p}$ and the area integrand is roughly $2\pi r = 2\pi x^{-p}$. These are power functions, so the same test that decides the $p$-series (pma 3.28) decides the integrals: $\int_1^\infty x^{-q}dx$ converges iff $q>1$. When $\tfrac12<p\le1$, the squared radius decays fast enough but the radius itself does not. The painter’s paradox dissolves once one sees that “painting” means a coat of fixed thickness $\varepsilon$, which needs volume about $\varepsilon\cdot A=\infty$, while “filling” lets the paint get thinner than any $\varepsilon$ deep in the horn, where the radius is smaller than $\varepsilon$. A mathematical surface can be covered by a layer of zero thickness, real paint cannot. Torricelli’s 1643 result shocked his contemporaries (Hobbes among them), because an infinitely long solid with finite size seemed to break the rule that the infinite cannot be measured.`,
      caption: String.raw`Set the length $L$ (log scale) and the exponent $p$. The 3D horn shows the first stretch of the solid (drag to rotate). On the right, the running volume (blue) levels off at its limit while the running area (orange) keeps climbing like $2\pi\ln L$. Lower $p$ below 1 and the area still diverges; raise $p$ above 1 and both converge; lower $p$ to $\tfrac12$ or below and the volume diverges too.`,
      deps: ['pma-3.28'],
      refs: ['SEP “Infinity”'],
      credit: 'Evangelista Torricelli, 1643',
      tags: ['infinity', 'integrals', 'convergence'],
      viz(v) {
        const LS = v.slider('length $L$', 1.05, 1e6, 1000, { log: true });
        const pS = v.slider('exponent $p$ in $y = x^{-p}$', 0.4, 1.6, 1, { step: 0.01 });
        const S3 = v.stage3d({ range: 5.3, height: 330, yaw: -0.22, pitch: 0.3, axes: false, weight: 0.95, persp: 0 });
        const G = v.stage({ x: [1, 1e6], y: [0.03, 1e5], xlog: true, ylog: true, axes: 'box', height: 330, weight: 1.15, title: 'running totals up to $x = L$ (log–log)', xlabel: 'L' });
        const LN = Math.log(1e6), DU = 0.005, NU = Math.ceil(LN / DU);
        let cache = { p: null, A: null };
        const areaTable = (p) => {
          if (cache.p === p) return cache.A;
          const A = new Float64Array(NU + 1), g = (u) => Math.exp(u * (1 - p)) * Math.sqrt(1 + p * p * Math.exp(-2 * u * (p + 1)));
          for (let i = 1; i <= NU; i++) A[i] = A[i - 1] + (2 * Math.PI * DU * (g((i - 1) * DU) + g(i * DU))) / 2;
          cache = { p, A }; return A;
        };
        const vol = (p, L) => (Math.abs(2 * p - 1) < 1e-9 ? Math.PI * Math.log(L) : (Math.PI * (L ** (1 - 2 * p) - 1)) / (1 - 2 * p));
        let st = null;
        v.render(() => {
          const L = LS.value, p = pS.value, A = areaTable(p);
          const areaAt = (x) => { const u = Math.log(x) / DU, i = Math.min(NU - 1, Math.floor(u)); return A[i] + (A[i + 1] - A[i]) * (u - i); };
          // ---- the horn (first stretch, x ≤ 12)
          const Xs = Math.min(L, 12), r = (x) => x ** -p;
          S3.surface((x, th) => [x - 6.5, r(x) * Math.cos(th), r(x) * Math.sin(th)], [1, Xs], [0, 2 * Math.PI], { nu: 44, nv: 26, color: 'accent', alpha: 0.9, colorFn: (x) => (x < 2 ? 'blue' : 'accent') });
          S3.curve((th) => [1 - 6.5, Math.cos(th), Math.sin(th)], 0, 2 * Math.PI, { color: 'ink', width: 1.6 });
          S3.line([-6.2, 0, 0], [6.2, 0, 0], { color: 'faint', width: 1, dash: [4, 4] });
          if (L > 12) S3.text(`… continues to x = ${bigNum(L)}`, [3.6, 0, -1.25], { size: 11.5, color: 'muted' });
          S3.text('y = 1/x' + (Math.abs(p - 1) < 0.005 ? '' : `^${v.fix(p, 2)}`) + ' rotated', [-4.2, 0, 1.6], { size: 11.5, color: 'muted' });
          // ---- running volume and area
          const Vinf = p > 0.5 ? Math.PI / (2 * p - 1) : Infinity;
          if (isFinite(Vinf) && Vinf < 1e5) { G.hline(Vinf, { color: 'blue', dash: [6, 4], width: 1.3 }); G.text(`volume limit π/(2p−1) = ${v.fix(Vinf, 3)}`, 2.5e4, Vinf, { dy: -9, size: 11, weight: 600, color: 'blue' }); }
          G.fn((x) => vol(p, x), { color: 'blue', width: 2.6 });
          G.fn((x) => areaAt(x), { color: 'orange', width: 2.6 });
          if (Math.abs(p - 1) < 0.005) G.fn((x) => 2 * Math.PI * Math.log(x), { color: 'orange', width: 1.2, dash: [3, 4], alpha: 0.7 });
          G.vline(L, { color: 'gold', width: 1.8 });
          G.dot(L, vol(p, L), { r: 5, color: 'blue' }); G.dot(L, areaAt(L), { r: 5, color: 'orange' });
          st = { L, p, V: vol(p, L), A: areaAt(L), Vinf, Ainf: p > 1 ? areaAt(1e6) + (2 * Math.PI * 1e6 ** (1 - p)) / (p - 1) : Infinity };
        });
        v.legend([['blue', 'volume $\\pi\\int_1^L x^{-2p}dx$'], ['orange', 'area $2\\pi\\int_1^L x^{-p}\\sqrt{1+p^2x^{-2p-2}}\\,dx$'], ['orange', '$2\\pi\\ln L$ (at $p = 1$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { L, p, V, A, Vinf, Ainf } = st, f = (x) => v.fix(x, 3);
          const cls = p > 1 ? 'both converge (p > 1)' : p > 0.5 ? '**finite volume, infinite area** (½ < p ≤ 1): Gabriel’s horn' : 'both diverge (p ≤ ½)';
          return `Up to $L = ${L >= 1e4 ? v.sci(L, 2) : v.fix(L, 1)}$: volume $${f(V)}$${isFinite(Vinf) ? ` (limit $${f(Vinf)}$)` : ' (→ ∞)'}, area $${f(A)}$${p > 1 ? ` (limit ≈ $${f(Ainf)}$)` : ' (→ ∞)'} · ${cls}` +
            (p > 0.5 && p <= 1 ? ` · painting this much surface with a coat 0.01 thick takes about $${f(0.01 * A)}$ units of paint, which grows without bound as $L\\to\\infty$, while filling the whole infinite horn takes only $${f(Vinf)}$` : '') + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Paradox',
      name: 'Zeno’s paradox of measure',
      statement: String.raw`**Zeno:** a line segment can be divided into infinitely many parts. If the ultimate parts have no size, the segment, being the sum of them, has no size either; if they all have some positive size, the segment is infinitely large. Either way the segment’s length is absurd.

**The modern answer** has three ingredients. (a) Length (Lebesgue measure) is **countably** additive: the length of a countable union of disjoint sets is the sum of their lengths. (b) A point has length $0$, so every **countable** set has length $0$. Indeed, it can be covered by intervals of lengths $\varepsilon/2, \varepsilon/4, \dots$, total at most $\varepsilon$. (c) The segment $[0,1]$ is **uncountable** (Cantor), so it is not a countable union of points, and additivity says nothing about an uncountable “sum” of zeros. Its length is $1$. The second horn also fails: a sum of uncountably many positive sizes is indeed infinite, but the points do not have positive size.`,
      idea: String.raw`The covering argument shows directly that any listed set $q_1, q_2, \dots$ has outer measure at most $\sum_k \varepsilon 2^{-k} = \varepsilon$ for every $\varepsilon>0$, which is why the rationals, dense as they are, have length 0 (rca 2.20). If $[0,1]$ could be listed the same way, its length would be 0 instead of 1, so it cannot be listed. Cantor’s diagonal argument (pma 2.14, pma 2.43a) shows this constructively: from any list of decimals it builds a number whose $k$-th digit differs from the $k$-th digit of the $k$-th entry, so the number differs from every entry. Zeno’s argument fails because it assumes that additivity extends to arbitrary collections of parts. It holds for countable collections only. Philosophers, from Grünbaum in the 1950s and 60s to Skyrms in 1983, have asked whether this is a solution or just a careful restriction that leaves the intuition unexplained.`,
      caption: String.raw`Left: the first $K$ points of a list each get an interval of length $\varepsilon/2^k$ (row $k$; the bottom line shows their union). However dense the points, the total stays below $\varepsilon$, far short of the segment’s length 1. Right: write any list of decimals by clicking digits (each click adds 1). The gold diagonal digits are changed (to 5, or to 4 if the digit is 5) to build a number $d$ that differs from row $k$ in its $k$-th digit, so it is missing from your list. Switch the left panel to **your list** to cover your numbers and see $d$ on the segment.`,
      deps: ['rca-2.20', 'pma-2.43a', 'pma-2.14'],
      refs: ['SEP “Zeno’s Paradoxes”'],
      credit: 'Zeno of Elea, c. 450 BC; Cantor, 1891; Lebesgue, 1902',
      tags: ['measure', 'countability', 'diagonal argument'],
      viz(v) {
        const src = v.select('list on the left', [{ value: 'rat', label: 'the rationals in [0, 1]' }, { value: 'mine', label: 'your list (right)' }], 'rat');
        const eS = v.slider('$\\varepsilon$', 0.002, 1, 0.3, { log: true });
        const KS = v.slider('points listed $K$', 1, 60, 24, { int: true });
        const Lst = v.stage({ x: [-0.05, 1.05], y: [-0.43, 1.06], axes: false, height: 340, weight: 1.15 });
        const Rst = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1 });
        const NR = 8;
        let digits = [[3, 1, 4, 1, 5, 9, 2, 6], [5, 0, 0, 0, 0, 0, 0, 0], [1, 4, 1, 4, 2, 1, 3, 5], [7, 1, 8, 2, 8, 1, 8, 2], [3, 3, 3, 3, 5, 3, 3, 3], [0, 5, 7, 7, 2, 1, 5, 6], [6, 1, 8, 0, 3, 3, 9, 8], [9, 9, 9, 0, 1, 2, 3, 4]];
        const T = v.table(Rst, { rows: NR, cols: NR, size: 15, maxCell: 30, region: [0, 0.28, 1, 1], rowLabels: (i) => `x${subNum(i + 1)} = 0.`, colLabels: (j) => String(j + 1) });
        Rst.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) digits[c.i][c.j] = (digits[c.i][c.j] + 1) % 10; });
        const rngB = v.rng(2024);
        v.button('new random list', () => { digits = digits.map((row) => row.map(() => rngB.int(0, 9))); });
        let st = null;
        v.render(() => {
          const eps = eS.value, mine = src.value === 'mine';
          KS.el.hidden = mine;
          const dDig = digits.map((row, k) => (row[k] === 5 ? 4 : 5));
          const val = (row) => row.reduce((s, dg, j) => s + dg * 10 ** -(j + 1), 0);
          const dVal = val(dDig);
          const pts = mine ? digits.map(val) : rationals01(KS.value).map(([a, b]) => a / b);
          const K = pts.length, rows = Math.min(K, 30), rowH = 0.92 / (rows + 1);
          // ---- covering intervals, one row per listed point
          Lst.line(0, -0.15, 1, -0.15, { color: 'ink', width: 1.4 });
          Lst.text('0', 0, -0.25, { align: 'center', size: 11, color: 'muted' }); Lst.text('1', 1, -0.25, { align: 'center', size: 11, color: 'muted' });
          const iv = pts.map((q, k) => { const len = eps * 2 ** -(k + 1); return [q - len / 2, q + len / 2]; });
          const pxPer = Lst.width / 1.1;
          iv.forEach(([a, b], k) => {
            const y = 1.0 - (k + 1) * rowH, q = pts[k];
            if (k < rows) {
              Lst.line(0, y, 1, y, { color: 'faint', width: 0.6, alpha: 0.5 });
              if ((b - a) * pxPer >= 1.5) Lst.line(Math.max(-0.04, a), y, Math.min(1.04, b), y, { color: k % 2 ? 'teal' : 'blue', width: Math.max(3, Math.min(8, rowH * 300)), cap: 'butt' });
              Lst.dot(q, y, { r: 2.2, color: 'ink' });
              if (k < 3) { const rt = b > 0.88; Lst.tex(`\\varepsilon/${2 ** (k + 1)}`, rt ? Math.max(-0.04, a) - 0.012 : Math.min(1.04, b) + 0.012, y, { align: rt ? 'right' : 'left', size: 12, color: k % 2 ? 'teal' : 'blue' }); }
            }
            Lst.line(Math.max(0, a), -0.15, Math.min(1, b), -0.15, { color: 'blue', width: 8, cap: 'butt', alpha: 0.85 });
          });
          if (K > rows) Lst.text(`rows ${rows + 1}–${K} too thin to draw; their intervals are in the union below`, 0.5, 1.0 - (rows + 0.6) * rowH, { align: 'center', size: 10, color: 'muted' });
          if (mine) { Lst.line(dVal, -0.22, dVal, 1.0, { color: 'green', width: 1.6, dash: [4, 4] }); Lst.dot(dVal, -0.15, { r: 6, color: 'green', label: 'd', labelPos: 'se' }); }
          Lst.text('their union on [0, 1] (true widths)', 0.5, -0.07, { align: 'center', size: 10.5, color: 'blue' });
          const U = unionLength(iv), Ssum = eps * (1 - 2 ** -K);
          Lst.text(`total length ≤ ${v.fix(Ssum, 4)} (union ${v.fix(U, 4)})  vs  length of [0, 1] = 1`, 0.5, -0.36, { align: 'center', size: 12, weight: 700, color: 'ink' });
          // ---- Cantor's diagonal
          T.draw({
            value: (i, j) => digits[i][j],
            fill: (i, j) => (i === j ? ['gold', 0.35] : null),
            textColor: (i, j) => (i === j ? 'ink' : 'muted'),
            weight: (i, j) => (i === j ? 700 : 500),
          });
          const g = T.geo, yD = 0.16;
          Rst.text('d = 0.', Rst.invX(g.X0) - 0.012, yD, { align: 'right', size: 15, weight: 700, color: 'green' });
          dDig.forEach((dg, j) => {
            const [cx] = T.cellCenter(0, j);
            Rst.rect(cx - g.w * 0.45, yD - 0.045, cx + g.w * 0.45, yD + 0.045, { fill: 'green', fillAlpha: 0.15, color: 'green', width: 1.2 });
            Rst.text(String(dg), cx, yD, { align: 'center', size: 15, weight: 700, color: 'green' });
            Rst.text(`≠ ${digits[j][j]}`, cx, yD - 0.085, { align: 'center', size: 10.5, color: 'muted' });
          });
          Rst.text('digit k of d differs from digit k of row k', 0.5, 0.265, { align: 'center', size: 11, color: 'muted' });
          const onList = digits.some((row) => row.every((dg, j) => dg === dDig[j]));
          st = { eps, K, U, Ssum, dDig, dVal, onList, mine };
        });
        v.legend([['blue', 'covering intervals, lengths $\\varepsilon/2^k$'], ['gold', 'diagonal digits', { area: true }], ['green', 'the diagonal number $d$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { eps, K, U, Ssum, dDig, onList, mine } = st;
          return `${K} listed ${mine ? 'numbers' : 'rationals'} covered by intervals of total length $\\varepsilon(1-2^{-${K}}) = ${v.fix(Ssum, 4)} \\le \\varepsilon = ${v.fix(eps, 3)}$ (their union: ${v.fix(U, 4)}) — as $\\varepsilon \\to 0$ a countable set has length 0, so no list can exhaust $[0,1]$, whose length is 1 · diagonal number $d = 0.${dDig.join('')}\\ldots$ differs from every row ${onList ? '✗' : '✓'} — it is not on the list, whatever list you write.`;
        });
      },
    },
  ],
};
