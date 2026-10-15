// Philosophy & Reasoning — Chapter 2: Paradoxes of the infinite (items 2.1–2.5; 2.6–2.10 in ch02-b.js)

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
      caption: String.raw`Slide the instant $t_0$: the snapshot of the flying arrow is identical to that of an arrow at rest in the same place, and only the faint ghosts at nearby instants reveal the motion. In the position–time graph, shrink $h$: the secant through $t_0$ and $t_0+h$ turns into the tangent, and with **zoom with h** the curve straightens out under magnification. The right panel plots the difference quotient against $h$ on a log scale: it converges to the velocity, while at $h = 0$ itself there is only $0/0$. Toggle the arrow at rest to compare.`,
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
        const strip = v.stage({ x: [-0.05, 10.05], y: [-1.0, 1.55], axes: false, height: 170, full: true });
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
          strip.text('in the gold frame the two snapshots are identical; only comparing frames reveals the motion', 5, -0.92, { align: 'center', size: 11, color: 'muted' });
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
          if (atom && t >= 1) S.text(`dashed: positions at atom ${t - 1}`, 6.5, -0.38, { align: 'right', size: 10.5, color: 'muted' });
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
        const W = v.stage({ x: [-2.9, 18.7], y: [-0.55, 1.45], axes: false, height: 260, weight: 1.45 });
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
  ],
};
