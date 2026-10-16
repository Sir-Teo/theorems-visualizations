// Distributed Computing — Chapter 3, part c: items 3.9–3.12 (clock synchronization, TrueTime, Lamport's paper)
import { PCOL, NAMES, hash01, mulberry32, clamp, range, llDelay, llShift, rangeOf } from './ch03.shared.js';

// ---- helpers for 3.12: the events of Fig. 1 of Lamport (1978), traced from the paper
const FIG1 = {
  // [name, process, physical height read off the figure by eye]
  ev: [['p1', 0, 0.0], ['p2', 0, 2.0], ['p3', 0, 3.85], ['p4', 0, 6.0], ['q1', 1, 0], ['q2', 1, 1], ['q3', 1, 2], ['q4', 1, 3], ['q5', 1, 4], ['q6', 1, 5], ['q7', 1, 6], ['r1', 2, 0.0], ['r2', 2, 1.95], ['r3', 2, 4.0], ['r4', 2, 6.0]],
  msg: [['p1', 'q2'], ['q1', 'p2'], ['q4', 'r3'], ['q1', 'r4'], ['r2', 'q7'], ['q5', 'p4']],
};
function fig1(rule, seed) {
  const ev = FIG1.ev.map(([name, p, y], id) => ({ name, p, y, id })), by = new Map(ev.map((e) => [e.name, e]));
  const order = ev.slice().sort((a, b) => a.y - b.y || a.p - b.p), byP = [[], [], []];
  for (const e of order) { e.idx = byP[e.p].length; e.prev = e.idx ? byP[e.p][e.idx - 1] : null; byP[e.p].push(e); }
  const recvOf = new Map(); for (const [s, r] of FIG1.msg) { if (!recvOf.has(r)) recvOf.set(r, []); recvOf.get(r).push(by.get(s)); }
  const past = new Map(), C = new Map();
  for (const e of order) {
    const ps = new Set(); const src = [e.prev, ...(recvOf.get(e.name) || [])].filter(Boolean);
    for (const u of src) { ps.add(u.id); for (const x of past.get(u.id)) ps.add(x); }
    past.set(e.id, ps);
    const lp = e.prev ? C.get(e.prev.id) : 0, tm = Math.max(0, ...(recvOf.get(e.name) || []).map((s) => C.get(s.id)));
    const extra = rule === 'jumps' ? Math.floor(3 * hash01(seed, e.id, 7)) : 0;
    C.set(e.id, Math.max(lp, tm) + 1 + (recvOf.has(e.name) ? extra : 0));
  }
  return { ev, by, byP, msgs: FIG1.msg.map(([s, r]) => [by.get(s), by.get(r)]), past, C, hb: (a, b) => past.get(b.id).has(a.id) };
}

export default {
  collection: 'dist',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Algorithm', name: 'Clock synchronization by round-trip measurement',
      statement: String.raw`A client wants to set its clock to that of a time server. At local time $T_0$ it sends a request; the server replies with its clock reading $S$, which reaches the client at local time $T_1$. The client sets its clock to $S+\tfrac12(T_1-T_0)$, assuming that the reply took half the round trip. If both one-way delays $d_1,d_2$ lie in $[d_{\min},d_{\max}]$ (uncertainty $u=d_{\max}-d_{\min}$), the error of this estimate is exactly $\tfrac12(d_1-d_2)$ and so at most $u/2$ in absolute value. Using only what the client can observe, the true server time at $T_1$ lies in $[S+d_{\min},\,S+(T_1-T_0)-d_{\min}]$, so the error is at most $\tfrac12(T_1-T_0)-d_{\min}$; sending the request again and keeping the reply with the shortest round trip tightens it.`,
      idea: String.raw`The request leaves at the client's time $T_0$, the server reads its clock after $d_1$, and the reply needs $d_2$ more, so the server's clock reads $S+d_2$ when the client receives it, while the client estimates $S+\frac12(d_1+d_2)$; the difference is $\tfrac12(d_1-d_2)$, the asymmetry of the two legs. The client cannot see the legs separately, only their sum, which is why half the round trip is the best guess; and each leg is at least $d_{\min}$, which bounds how much of the round trip could have been the return leg. A single round trip can therefore never remove the uncertainty $u$ in the path; 3.10 shows that no algorithm can do better in the worst case.`,
      caption: String.raw`Top: one request (blue) and reply (orange) between client and server, drawn on the time axis of the server's clock. The bar underneath shows what the client learns: the true server time at the moment of the reply (green) lies somewhere in the orange bracket allowed by the delay bounds, and the client's estimate (gold) is the middle of the round trip. Set the two delays with the sliders: the error is half their difference, and the dashed guarantee $\pm u/2$ holds only while both delays stay inside $[d_{\min},d_{\max}]$. The histogram shows the error over many random delay pairs drawn from the allowed range; the last slider adds a systematic extra delay on the return path, which breaks the symmetric assumption and moves the whole distribution.`,
      deps: ['dist-1.2'], refs: ['Attiya–Welch ch. 6'], tags: ['clock synchronization', 'round trip'],
      credit: 'Cristian, 1989',
      scope: String.raw`An accurate server clock, a client clock that runs at the correct rate during the exchange (no drift), and independent delays in $[d_{\min},d_{\max}]$. Without a lower bound on the delay the estimate carries no guarantee at all.`,
      viz(v) {
        const dmin = v.slider('minimum delay $d_{\\min}$', 0, 2, 0.5, { step: 0.05 });
        const uS = v.slider('uncertainty $u$', 0, 3, 1.2, { step: 0.05 });
        const d1 = v.slider('request delay $d_1$', 0, 5, 1.5, { step: 0.05 });
        const d2 = v.slider('reply delay $d_2$', 0, 5, 0.8, { step: 0.05 });
        const asym = v.slider('extra delay on the return path', -1, 1.5, 0, { step: 0.05 });
        const sA = v.stage({ x: [-0.4, 8], y: [-1.9, 2.7], axes: false, height: 300, full: true, title: 'one round trip (time axis = the server clock)' });
        const sH = v.stage({ x: [-1.6, 1.6], y: [0, 1], axes: 'box', gutter: true, xlabel: 'error of the estimate (estimate − true server time)', ylabel: 'density', height: 210, full: true, title: 'error over 3000 random delay pairs' });
        const r = mulberry32(11), U = Array.from({ length: 3000 }, () => [r(), r()]);
        let info = null;
        v.render(() => {
          const lo = dmin.value, u = uS.value, a = d1.value, b = d2.value, rtt = a + b, T = Math.max(6, rtt + 1.4);
          sA.setView([-1.1, T], [-1.9, 2.7]);
          sA.line(0, 2, T, 2, { color: 'faint', width: 1.6 }); sA.line(0, 1, T, 1, { color: 'faint', width: 1.6 });
          sA.text('server', -0.15, 2, { align: 'right', size: 13, color: 'ink' }); sA.text('client', -0.15, 1, { align: 'right', size: 13, color: 'ink' });
          sA.arrow(0, 1, a, 2, { color: 'accent', width: 2.6 }); sA.arrow(a, 2, rtt, 1, { color: 'orange', width: 2.6 });
          sA.text('request', a / 2, 1.5, { align: 'center', baseline: 'bottom', dx: -26, size: 12, color: 'accent', halo: true }); sA.text('reply', a + b / 2, 1.5, { align: 'center', baseline: 'bottom', dx: 26, size: 12, color: 'orange', halo: true });
          sA.dot(0, 1, { r: 6, color: 'accent' }); sA.dot(a, 2, { r: 6, color: 'ink' }); sA.dot(rtt, 1, { r: 6, color: 'orange' });
          sA.text('$T_0$', 0, 1, { align: 'center', baseline: 'top', dy: 9, size: 12, color: 'ink' }); sA.text('$T_1$', rtt, 1, { align: 'center', baseline: 'top', dy: 9, size: 12, color: 'ink' });
          sA.text(`server reads $S=${a.toFixed(2)}$`, a, 2, { align: 'center', baseline: 'bottom', dy: -10, size: 12, color: 'ink', halo: true });
          // knowledge bar
          const y0 = -0.5, est = a + rtt / 2, L = a + lo, H = a + rtt - lo;
          sA.line(0, y0, T, y0, { color: 'faint', width: 1.2 });
          sA.text('server clock →', T - 0.05, y0 - 0.3, { align: 'right', size: 11, color: 'muted' });
          if (H >= L) { sA.line(L, y0, H, y0, { color: 'orange', width: 9, alpha: 0.55 }); sA.text('allowed by the delay bounds', (L + H) / 2, y0 - 0.38, { align: 'center', size: 11.5, color: 'orange' }); }
          sA.dot(rtt, y0, { r: 8, color: 'green' }); sA.text('true time at $T_1$', rtt, y0, { align: 'center', baseline: 'top', dy: 14 + (H >= L ? 24 : 0), size: 12, color: 'green', halo: true });
          sA.dot(est, y0, { r: 8, color: 'gold' }); sA.text('estimate', est, y0, { align: 'center', baseline: 'bottom', dy: -12, size: 12, color: 'gold', halo: true });
          sA.vline(rtt, { color: 'faint', dash: true, width: 1 });
          // histogram of errors
          const errs = U.map(([p, q]) => ((lo + u * p) - (lo + asym.value + u * q)) / 2);
          sH.setView([-1.6, 1.6], [0, 2.3 / Math.max(u, 0.2)]);
          sH.hist(errs, { bins: 40, range: [-1.6, 1.6], density: true, color: 'accent' });
          sH.vline(u / 2, { color: 'green', width: 2 }); sH.vline(-u / 2, { color: 'green', width: 2 });
          const pb = rtt / 2 - lo; sH.vline(pb, { color: 'gold', dash: true, width: 1.6 }); sH.vline(-pb, { color: 'gold', dash: true, width: 1.6 });
          sH.vline((a - b) / 2, { color: 'red', width: 2.6 });
          const inside = errs.filter((e) => Math.abs(e) <= u / 2 + 1e-9).length / errs.length;
          info = { err: (a - b) / 2, rtt, pb, inside, okDelays: a >= lo - 1e-9 && b >= lo - 1e-9 && a <= lo + u + 1e-9 && b <= lo + u + 1e-9, okMin: a >= lo - 1e-9 && b >= lo - 1e-9 };
        });
        v.legend([['red', 'this exchange', { dot: true }], ['green', 'guarantee ±u/2'], ['gold', 'bound from the round trip ±(RTT/2 − dmin)', { dash: true }]]);
        v.readout(() => {
          const I = info, f = (x) => v.fix(x, 2);
          return `Error of this exchange: $\\tfrac12(d_1-d_2)=${f(I.err)}$; round trip $=${f(I.rtt)}$ gives the bound $\\pm(\\mathrm{RTT}/2-d_{\\min})=\\pm${f(I.pb)}$ (${Math.abs(I.err) <= I.pb + 1e-9 ? 'holds' : '**violated**'}${I.okMin ? '' : ': a delay is below the assumed minimum'}); delay guarantee $\\pm u/2=\\pm${f(uS.value / 2)}$ (${I.okDelays ? 'both delays in range' : '**a delay is outside the assumed range**'}).\n${v.fix(100 * I.inside, 1)}% of the random exchanges stay within $\\pm u/2$${Math.abs(asym.value) > 1e-9 ? ' — the extra return delay makes the two legs unequal on average, so the symmetric guess is biased by half of it' : ' (all of them while the legs share one range)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Theorem', name: 'Clock synchronization lower bound (Lundelius–Lynch)',
      statement: String.raw`Consider $n\ge2$ processes with pairwise channels, hardware clocks that run at the rate of real time, no failures, and message delays that are known only to lie in $[d-u,d]$. Whatever algorithm the processes use to compute adjusted clocks, there is an admissible execution in which the adjusted clocks of two processes differ by at least $u\,(1-\tfrac1n)$ at the end. The bound is tight: the algorithm in which each process estimates every other clock assuming the midpoint delay $d-u/2$ and sets its clock to the average of the $n$ estimates achieves skew at most $u(1-\tfrac1n)$.`,
      idea: String.raw`Shift process $i$ of an execution $\alpha$ in real time by $x_i$: every event of $p_i$ moves, so a message from $p_i$ to $p_j$ has its delay changed by $x_j-x_i$, and each process, which sees only its own clock and message arrivals, cannot tell the shifted execution from $\alpha$ as long as every delay stays in $[d-u,d]$; its adjusted clock at a fixed real time is then lower by exactly $x_i$. Choose the delays of $\alpha$ as $d-u+\tfrac un\,((j-i)\bmod n)$ and the $n$ shifts $x^{(k)}_i=-\tfrac un\,((i-k)\bmod n)$: all shifted delays stay in range. In the $k$-th shifted execution the processes $p_k$ and $p_{k-1}$ are $u(1-\frac1n)$ further apart than in $\alpha$, and these $n$ differences telescope: whatever the algorithm outputs in $\alpha$, the cyclic gaps add up to a fixed total $-u(n-1)$, so one of the $n$ gaps has size at least $u(n-1)/n$.`,
      caption: String.raw`The left group is the base execution $\alpha$: drag the $n$ points to choose what an algorithm outputs there (adjusted clocks at the end, as multiples of $u$). The next $n$ groups are the shifted executions $E_0,\dots,E_{n-1}$, which every process experiences exactly as $\alpha$, with clocks $w_i-x_i^{(k)}$. Each bracket is the skew of its group; the bars compare them with the bound $u(1-1/n)$ (green line). However you drag, some bracket reaches the line, and the readout shows the cyclic gaps adding up to a constant. *All agree* is the best you can do (every shifted execution then has skew exactly the bound). The table gives the delays of $\alpha$; the readout confirms that every shifted delay stays in $[d-u,d]$.`,
      deps: ['dist-3.9', 'dist-1.7'], refs: ['Attiya–Welch ch. 6'], tags: ['clock synchronization', 'lower bound', 'shifting'],
      credit: 'Lundelius & Lynch, 1984',
      scope: String.raw`Fault-free, complete network, drift-free hardware clocks, delays in $[d-u,d]$, worst case over executions. With drifting clocks or failures the achievable skew is larger.`,
      viz(v) {
        const nS = v.slider('processes $n$', 2, 6, 4, { int: true });
        const uS = v.slider('uncertainty $u$', 0.5, 4, 2, { step: 0.1 });
        const D = 5;
        let f = [0.45, -0.25, 0.1, -0.4, 0.3, -0.05];
        const sA = v.stage({ x: [-1, 24], y: [-3, 5], axes: false, height: 320, full: true, title: 'adjusted clocks at the end: the base execution α (drag) and the shifted executions' });
        const sB = v.stage({ x: [-0.8, 7.6], y: [0, 1], axes: false, height: 230, weight: 1.1, minWidth: 320, title: 'skew of each execution' });
        const sC = v.stage({ x: [-1.2, 6.4], y: [-1.1, 6.4], axes: false, equal: true, height: 230, weight: 0.9, minWidth: 260, title: 'delay of a message from row i to column j in α' });
        const hs = range(6).map((i) => { const h = sA.handle(i, 0, { color: PCOL[i % 5], r: 8, label: String(i + 1), labelPos: 'n', constrain: (x, y) => [i, clamp(y, -1.4 * uS.value, 1.4 * uS.value)] }); h.onDrag = () => { f[i] = h.y / uS.value; }; return h; });
        v.button('all clocks agree in α (best)', () => { f = [0, 0, 0, 0, 0, 0]; });
        let seed = 0; v.button('random outputs', () => { seed++; const r = mulberry32(seed * 31 + 7); f = f.map(() => (r() - 0.5) * 1.6); });
        let info = null;
        v.render(() => {
          const n = nS.value, u = uS.value, bound = u * (1 - 1 / n), G = n + 1, W = G * (n + 1) - 1;
          sA.setView([-2.4, W], [-1.8 * u, 2.6 * u]);
          hs.forEach((h, i) => { h.visible = i < n; if (i < n) h.set(i, f[i] * u); });
          const w = range(n).map((i) => f[i] * u), skews = [], gaps = [];
          let worst = 0, worstV = -1;
          for (let g = 0; g <= n; g++) {
            const k = g - 1, vals = range(n).map((i) => (g === 0 ? w[i] : w[i] - llShift(n, k, i, u)));
            const mn = Math.min(...vals), mx = Math.max(...vals), sk = mx - mn; skews.push(sk);
            if (g > 0 && sk > worstV) { worstV = sk; worst = g; }
            if (g > 0) gaps.push(vals[k] - vals[(k - 1 + n) % n]);
          }
          for (let g = 0; g <= n; g++) {
            const x0 = g * (n + 1), k = g - 1, vals = range(n).map((i) => (g === 0 ? w[i] : w[i] - llShift(n, k, i, u)));
            const mn = Math.min(...vals), mx = Math.max(...vals), isW = g === worst, col = isW ? 'red' : g === 0 ? 'muted' : 'accent';
            sA.line(x0 - 0.55, mn, x0 - 0.55, mx, { color: col, width: 3 }); sA.line(x0 - 0.75, mn, x0 - 0.35, mn, { color: col, width: 2 }); sA.line(x0 - 0.75, mx, x0 - 0.35, mx, { color: col, width: 2 });
            sA.text(skews[g].toFixed(2), x0 - 0.6, (mn + mx) / 2, { align: 'right', size: 11.5, color: col, halo: true });
            vals.forEach((y, i) => { if (g > 0) sA.dot(x0 + i, y, { r: 6, color: PCOL[i % 5] }); sA.text(String(i + 1), x0 + i, y, { align: 'center', baseline: 'bottom', dy: -9, size: 11, color: PCOL[i % 5] }); });
            sA.text(g === 0 ? 'α' : `$E_{${k}}$`, x0 + (n - 1) / 2, -1.55 * u, { align: 'center', size: 14, color: 'ink' });
            if (g > 0) { sA.line(x0 + k, vals[k], x0 + (k - 1 + n) % n, vals[(k - 1 + n) % n], { color: 'gold', width: 2, dash: [4, 3] }); }
          }
          // bars
          const top = Math.max(1.3 * bound, 1.15 * Math.max(...skews)); sB.setView([-0.8, n + 0.8], [-0.14 * top, top]);
          skews.forEach((s, g) => { const col = g === worst ? 'red' : g === 0 ? 'muted' : 'accent'; sB.rect(g - 0.34, 0, g + 0.34, s, { fill: col, fillAlpha: 0.45, color: col, width: 1.6 }); sB.text(s.toFixed(2), g, s, { align: 'center', baseline: 'bottom', dy: -4, size: 11.5, color: 'ink' }); sB.text(g === 0 ? 'α' : `$E_{${g - 1}}$`, g, 0, { align: 'center', baseline: 'top', dy: 8, size: 12, color: 'ink' }); });
          sB.hline(bound, { color: 'green', width: 2.4 }); sB.text(`u(1−1/n) = ${bound.toFixed(2)}`, n + 0.7, bound, { align: 'right', baseline: 'bottom', dy: -5, size: 12.5, color: 'green' });
          // delays table
          sC.setView([-1.2, n + 0.4], [-0.9, n + 0.5]);
          let dmn = 1e9, dmx = -1e9;
          for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) { const dl = llDelay(n, i, j, D, u) + llShift(n, k, j, u) - llShift(n, k, i, u); dmn = Math.min(dmn, dl); dmx = Math.max(dmx, dl); }
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const x = j, y = n - 1 - i; if (i === j) { sC.rect(x - 0.45, y - 0.45, x + 0.45, y + 0.45, { fill: 'faint', fillAlpha: 0.2, stroke: false }); continue; }
            const dl = llDelay(n, i, j, D, u), t = (dl - (D - u)) / u;
            sC.rect(x - 0.45, y - 0.45, x + 0.45, y + 0.45, { fill: 'orange', fillAlpha: 0.12 + 0.55 * t, stroke: false }); sC.text(dl.toFixed(1), x, y, { align: 'center', size: 11.5, color: 'ink' });
          }
          for (let i = 0; i < n; i++) { sC.text(String(i + 1), -0.75, n - 1 - i, { align: 'right', size: 12, color: PCOL[i % 5] }); sC.text(String(i + 1), i, n - 0.1, { align: 'center', size: 12, color: PCOL[i % 5] }); }
          info = { n, u, bound, skews, gaps, worst, dmn, dmx, mx: Math.max(...skews.slice(1)) };
        });
        v.legend([['red', 'largest skew among the shifted executions'], ['gold', 'gap g_k between p_k and p_(k−1)', { dash: true }]]);
        v.readout(() => {
          const I = info, f2 = (x) => v.fix(x, 2);
          return `Bound $u(1-\\frac1n)=${f2(I.bound)}$; skews of the shifted executions: ${I.skews.slice(1).map((s) => f2(s)).join(', ')} — the largest, **${f2(I.mx)}**, is ${I.mx >= I.bound - 1e-9 ? '≥' : '<'} the bound.\nThe gaps $g_k=L_k-L_{k-1}$ of the gold segments (one per $E_k$) are ${I.gaps.map(f2).join(', ')} and add up to **${f2(I.gaps.reduce((a, b) => a + b, 0))}** $=-u(n-1)=${f2(-I.u * (I.n - 1))}$ whatever you drag, so some $|g_k|\\ge u(n-1)/n$. All shifted delays lie in $[${f2(I.dmn)},${f2(I.dmx)}]\\subseteq[d-u,d]=[${f2(5 - I.u)},5]$ ✓ (delays in the table: $d=5$).`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Concept', name: 'Bounded clock uncertainty in practice (TrueTime)',
      statement: String.raw`Instead of returning a number, a clock service returns an **interval**: $\mathrm{TT.now()}=[\text{earliest},\text{latest}]$, guaranteed to contain the absolute time of the call, with half-width $\varepsilon$ (the current clock uncertainty). Spanner uses this to give transactions timestamps that agree with real-time order (**external consistency**). A transaction takes as its commit timestamp $s\ge \mathrm{TT.now()}.\text{latest}$ read when the commit starts, and its effects are made visible only after **commit wait**, until $\mathrm{TT.after}(s)$ holds, i.e. until $\mathrm{TT.now()}.\text{earliest}>s$. Then if a transaction $T_1$ finishes committing before $T_2$ starts, their timestamps satisfy $s_1<s_2$, even if the two run on machines whose clocks disagree by as much as $\varepsilon$; commit wait lasts about $2\varepsilon$.`,
      idea: String.raw`After commit wait, $s_1<\mathrm{TT.now()}.\text{earliest}$ at the moment $T_1$ becomes visible, and the interval contains absolute time, so $s_1$ is smaller than the absolute time at which $T_1$ finished. $T_2$ starts later in absolute time, and its timestamp is at least the upper end of an interval that contains that later absolute time, so $s_2$ exceeds the absolute time at which $T_2$ started, which exceeds $s_1$. The proof needs the guarantee that the true time lies inside every interval, and an application that waits out the uncertainty: this turns a bound on clock error into an ordering guarantee, which Lamport clocks could only get by adding a message between the two transactions. Uncertainty costs latency (the wait), so the system works to keep $\varepsilon$ small.`,
      caption: String.raw`Real time runs to the right, clock readings upwards. The shaded bands are the intervals $\mathrm{TT.now()}$ of servers $A$ and $B$, whose clocks are off by $a$ and $b$ (both within $\varepsilon$). $T_1$ starts on $A$ at $t=2$ and picks $s_1$ (blue line); $T_2$ starts on $B$ a gap $g$ after $T_1$ has finished and picks $s_2$ (orange line). With commit wait (green: $A$ waits for $\mathrm{TT.after}(s_1)$) the order $s_1<s_2$ always holds. Switch commit wait off and use *worst case* ($a=+\varepsilon$, $b=-\varepsilon$): the later transaction gets the smaller timestamp. Push an offset beyond $\varepsilon$ to break the guarantee itself.`,
      deps: ['dist-3.9'], refs: ['Corbett et al. 2012 (Spanner)'], tags: ['TrueTime', 'external consistency'],
      credit: 'Corbett et al. (Google), 2012',
      scope: String.raw`Needs the TrueTime guarantee that absolute time lies within $[\text{earliest},\text{latest}]$ on every machine; a model of the commit-wait rule with one timestamp per transaction, not of the full Spanner protocol (two-phase commit, Paxos groups, locking), and no numbers for $\varepsilon$ in production are claimed here.`,
      links: { doi: 'https://doi.org/10.1145/2491245' },
      viz(v) {
        const eS = v.slider('uncertainty $\\varepsilon$', 0.2, 1.5, 0.6, { step: 0.05 });
        const aS = v.slider('clock offset of $A$', -1.8, 1.8, 0.6, { step: 0.05 });
        const bS = v.slider('clock offset of $B$', -1.8, 1.8, -0.6, { step: 0.05 });
        const gS = v.slider('gap $g$ before $T_2$ starts', 0, 2, 0.4, { step: 0.05 });
        const wait = v.toggle('commit wait', true);
        v.button('worst case: a = +ε, b = −ε', () => { aS.set(eS.value); bS.set(-eS.value); });
        const s = v.stage({ x: [0, 11], y: [0, 11], axes: 'box', gutter: true, equal: false, height: 400, full: true, xlabel: 'real time', ylabel: 'clock reading', title: 'TrueTime intervals of two servers, and the timestamps they hand out' });
        let info = null;
        v.render(() => {
          const e = eS.value, a = aS.value, b = bS.value, g = gS.value, t1 = 2;
          const s1 = t1 + a + e, w1 = s1 + e - a, done = wait.value ? w1 : t1, t2 = done + g, s2 = t2 + b + e, info0 = s1 <= s2;
          s.fn((x) => x, { color: 'faint', dash: true, width: 1.4 });
          s.between((x) => x + a - e, (x) => x + a + e, 0, 11, { fill: 'accent', fillAlpha: 0.16 }); s.fn((x) => x + a, { color: 'accent', width: 1.6, alpha: 0.7 });
          s.between((x) => x + b - e, (x) => x + b + e, 0, 11, { fill: 'orange', fillAlpha: 0.16 }); s.fn((x) => x + b, { color: 'orange', width: 1.6, alpha: 0.7 });
          s.text('server $A$', 0.2, 9.8, { color: 'accent', size: 13 }); s.text('server $B$', 0.2, 9.0, { color: 'orange', size: 13 });
          s.text('true time', 10.4, 10.4, { align: 'right', size: 11.5, color: 'muted' });
          s.line(t1, s1, 11, s1, { color: 'accent', width: 1.6, dash: [6, 4] }); s.text('$s_1$', 10.9, s1, { align: 'right', baseline: info0 ? 'top' : 'bottom', dy: info0 ? 3 : -3, size: 14, color: 'accent', halo: true });
          s.dot(t1, s1, { r: 7, color: 'accent' }); s.text('$T_1$ picks $s_1=\\mathrm{TT.now()}.\\mathrm{latest}$', t1, s1, { align: 'right', baseline: 'bottom', dx: -10, dy: -8, size: 12, color: 'accent', halo: true });
          if (wait.value) { s.line(t1, t1 + a - e, w1, w1 + a - e, { color: 'green', width: 7, alpha: 0.7 }); s.dot(w1, s1, { r: 8, color: 'green' }); s.text('commit wait ends', w1, s1, { align: 'left', baseline: 'top', dx: 8, dy: 8, size: 12, color: 'green', halo: true }); }
          s.vline(done, { color: 'gold', width: 1.6, dash: [3, 4] }); s.text('$T_1$ visible', done, 0.3, { align: 'left', dx: 5, size: 12, color: 'gold', halo: true });
          s.line(t2, s2, 11, s2, { color: 'orange', width: 1.6, dash: [6, 4] }); s.text('$s_2$', 10.9, s2, { align: 'right', baseline: info0 ? 'bottom' : 'top', dy: info0 ? -3 : 3, size: 14, color: 'orange', halo: true });
          s.dot(t2, s2, { r: 7, color: 'orange' }); s.text('$T_2$ starts on $B$', t2, s2, { align: 'left', baseline: 'bottom', dx: 8, dy: -10, size: 12, color: 'orange', halo: true });
          s.arrow(10.3, s1, 10.3, s2, { color: s2 > s1 ? 'green' : 'red', width: 3, head: 9 });
          info = { s1, s2, w1, t2, ok: s2 > s1, valid: Math.abs(a) <= e + 1e-9 && Math.abs(b) <= e + 1e-9, done };
        });
        v.legend([['accent', '$\\mathrm{TT.now()}$ interval of A'], ['orange', '$\\mathrm{TT.now()}$ interval of B'], ['green', 'commit wait']]);
        v.readout(() => {
          const I = info, f = (x) => v.fix(x, 2), e = eS.value;
          return `$s_1=${f(I.s1)}$, $s_2=${f(I.s2)}$: **${I.ok ? 'timestamp order agrees with real-time order ✓' : 'the later transaction got the smaller timestamp ✗'}** ($T_1$ is visible at real time ${f(I.done)}, $T_2$ starts at ${f(I.t2)}).\n${wait.value ? `Commit wait lasted ${f(I.w1 - 2)} $=2\\varepsilon=${f(2 * e)}$.` : 'No commit wait: $T_1$ is acknowledged at once.'} Offsets $|a|=${f(Math.abs(aS.value))}$, $|b|=${f(Math.abs(bS.value))}$ ${I.valid ? 'are within $\\varepsilon$: the TrueTime guarantee holds.' : '**exceed $\\varepsilon$: the interval no longer contains true time, so the guarantee is void.**'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Paper', name: 'Time, Clocks, and the Ordering of Events',
      paper: { authors: 'Leslie Lamport', year: 1978, title: 'Time, Clocks, and the Ordering of Events in a Distributed System', venue: 'Communications of the ACM 21 (7): 558–565', doi: '10.1145/359545.359563' },
      introduces: ['dist-3.1', 'dist-3.2', 'dist-3.3', 'dist-7.1'],
      statement: String.raw`Lamport argued that in a distributed system the order of events is only partial: an event $a$ happened before $b$ ($a\to b$) if a chain of process steps and messages leads from one to the other, and otherwise the two are concurrent. Logical clocks satisfying the Clock Condition ($a\to b\Rightarrow C(a)<C(b)$, obtained from rules IR1 and IR2) extend $\to$ to a total order $\Rightarrow$ by breaking ties with a fixed order of processes, and this order suffices to solve the mutual exclusion problem and, in general, to implement any state machine replicated across processes (the algorithm needs every process, so one failure halts it). Users may nevertheless observe orderings the system cannot see ("anomalous behaviour"); the paper's remedy is synchronized physical clocks, for which it proves that with drift rate at most $\kappa$, a message sent over every link every $\tau$ seconds with unpredictable delay below $\xi$, and diameter $d$, clocks stay within $\varepsilon\approx d(2\kappa\tau+\xi)$ after about $\tau d$ seconds, and anomalies are excluded whenever $\varepsilon/(1-\kappa)\le\mu$, with $\mu$ the shortest transmission time of an external message.`,
      idea: String.raw`Before the paper, "simultaneous" and "before" were taken from physical time even though no process can read it. Lamport started from what a process can actually know, defined causality by messages, and observed that it is exactly the structure of special relativity's light cones; a logical clock is then merely any function that respects it, and the total order $\Rightarrow$ is one of many ways to complete the partial order (the paper notes that any total order extending $\to$ arises from some system of clocks). The paper introduced the happened-before relation (3.1), Lamport clocks (3.2) and the replicated state machine (3.3, the root of 7.1), and was the first to separate what a system can order from what its users perceive. Its physical-clock section is an early analysis of clock synchronization with drift (compare 3.9 and 3.10).`,
      caption: String.raw`The paper's Fig. 1: processes $P,Q,R$ drawn as vertical lines with time upwards, dots for events and wavy lines for messages (events, messages and their order as in the paper; the heights are read off its figure by eye). The dashed lines are the tick lines of Fig. 2, one per clock value computed by IR1/IR2. Drag the slider to straighten the tick lines into horizontals: that is the paper's Fig. 3, the same system of events drawn with the clocks as the time coordinate, and nothing about the causal structure changes. *IR2 may jump* uses another admissible clock (the rule only demands a value larger than the message timestamp), which shows the paper's remark that $\Rightarrow$ is not unique. Click two events to ask for their relation: the paper states $p_1\to r_4$ and that $p_3$ and $q_3$ are concurrent, as are $p_2$ and $q_3$. The right panel evaluates the paper's physical-clock bound.`,
      deps: ['dist-1.1', 'rel-1.8'], refs: [], tags: ['logical clocks', 'happened-before'],
      credit: 'Lamport, 1978',
      scope: String.raw`Fig. 1 is reproduced event for event and message for message, but its vertical positions are only approximate, and the paper prints no clock values: the tick lines drawn here are computed from IR1 and IR2 (smallest values, or random admissible jumps). The physical-clock panel is the paper's approximate formula, valid when $\mu+\xi\ll\tau$.`,
      links: { doi: 'https://doi.org/10.1145/359545.359563', pdf: 'https://lamport.azurewebsites.net/pubs/time-clocks.pdf' },
      viz(v) {
        const str = v.slider('tick lines → horizontals (Fig. 2 → Fig. 3)', 0, 1, 0, { step: 0.01 });
        const ticks = v.toggle('tick lines', true);
        const rule = v.select('IR2', [{ value: 'min', label: 'smallest clock values' }, { value: 'jumps', label: 'IR2 may jump' }], 'min');
        let seed = 1; v.button('new jumps', () => { seed++; });
        const dS = v.slider('diameter $d$', 1, 8, 3, { int: true });
        const tauS = v.slider('$\\tau$ (seconds)', 0.1, 60, 1, { log: true, sig: 2 });
        const xiS = v.slider('$\\xi$ (milliseconds)', 0.1, 100, 10, { log: true, sig: 2 });
        const kapS = v.slider('$\\kappa$', 1e-8, 1e-2, 1e-6, { log: true, sig: 2, fmt: (x) => x.toExponential(0) });
        const muS = v.slider('$\\mu$ (milliseconds)', 1, 1000, 50, { log: true, sig: 2 });
        const sF = v.stage({ x: [-0.75, 2.75], y: [-0.7, 7.6], axes: false, height: 500, weight: 1.15, minWidth: 380, title: 'Fig. 1 of the paper: events, messages and tick lines' });
        const sE = v.stage({ x: [1e-8, 1e-2], y: [1e-4, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 500, weight: 1, minWidth: 300, xlabel: 'clock drift rate κ', ylabel: 'ε  (seconds)', title: 'PC2: ε ≈ d(2κτ + ξ)' });
        let sel = [], R = null, info = null;
        sF.onClick((x, y) => { if (!R) return; let best = null, bd = 16; const s = str.value; for (const e of R.ev) { const [ex, ey] = pos(e, s); const d = Math.hypot(sF.X(ex) - sF.X(x), sF.Y(ey) - sF.Y(y)); if (d < bd) { bd = d; best = e; } } if (best) sel = sel.length >= 2 ? [best] : sel.includes(best) ? sel : [...sel, best]; });
        let cmax = 1;
        const yC = (c) => ((c - 1) / Math.max(1, cmax - 1)) * 6;
        const pos = (e, s) => [e.p, (1 - s) * e.y + s * yC(R.C.get(e.id))];
        const tickY = (p, k, s) => {
          const L = R.byP[p], cs = L.map((e) => R.C.get(e.id)); let yp;
          if (k <= cs[0]) yp = L[0].y - (cs[0] - k) * 0.28;
          else if (k >= cs[cs.length - 1]) yp = L[L.length - 1].y + (k - cs[cs.length - 1]) * 0.28;
          else { let j = 0; while (!(cs[j] <= k && k <= cs[j + 1])) j++; yp = cs[j] === k ? L[j].y : L[j].y + (L[j + 1].y - L[j].y) * (k - cs[j]) / (cs[j + 1] - cs[j]); }
          return (1 - s) * yp + s * yC(k);
        };
        v.render(() => {
          R = fig1(rule.value, seed); const s = str.value; cmax = Math.max(...R.C.values());
          for (let p = 0; p < 3; p++) { sF.arrow(p, -0.5, p, 6.8, { color: 'faint', width: 1.8 }); sF.text(`process ${NAMES[p]}`, p, 7.3, { align: 'center', size: 13, color: 'ink' }); }
          if (ticks.value) for (let k = 1; k <= cmax; k++) sF.path([0, 1, 2].map((p) => [p, tickY(p, k, s)]), { color: 'muted', width: 1, dash: [5, 4], alpha: 0.7 });
          const A = sel[0], B = sel[1];
          for (const [a, b] of R.msgs) {
            const [x0, y0] = pos(a, s), [x1, y1] = pos(b, s), L = Math.hypot(x1 - x0, (y1 - y0) / 6 * 2) || 1;
            const nx = -(y1 - y0) / 6 * 2 / L, ny = (x1 - x0) / L;
            const reach = (x, y) => x === y || R.hb(x, y), on = !!(A && B && A !== B && ((reach(A, a) && reach(b, B)) || (reach(B, a) && reach(b, A))));
            sF.curve((t) => [x0 + (x1 - x0) * t + nx * 0.035 * Math.sin(t * Math.PI * 9) * 0.6, y0 + (y1 - y0) * t + ny * 0.035 * 3 * Math.sin(t * Math.PI * 9)], 0, 1, { color: on ? 'gold' : 'accent', width: on ? 3 : 1.8, n: 90 });
            const f = 0.93; sF.arrow(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, x1, y1, { color: on ? 'gold' : 'accent', width: 2, head: 9 });
          }
          for (const e of R.ev) {
            const [x, y] = pos(e, s), ring = e === A ? 'gold' : e === B ? 'orange' : null;
            if (ring) sF.dot(x, y, { r: 13, hollow: true, color: ring, width: 2.6 });
            sF.dot(x, y, { r: 5.5, color: 'ink' });
            sF.text(e.name, x, y, { align: e.p === 0 ? 'right' : 'left', dx: e.p === 0 ? -11 : 11, size: 13, color: 'ink', math: true, halo: true });
            sF.text(String(R.C.get(e.id)), x, y, { align: e.p === 0 ? 'left' : 'right', dx: e.p === 0 ? 10 : -10, dy: -8, size: 11, color: 'accent', halo: true });
          }
          // physical clocks
          const d = dS.value, tau = tauS.value, xi = xiS.value / 1000, mu = muS.value / 1000;
          const eps = (kap) => d * (2 * kap * tau + xi);
          sE.fn((k) => eps(k), { color: 'accent', width: 2.6, n: 200 });
          sE.vband(2e-5, 1e-4, { color: 'orange', alpha: 0.14 }); sE.text('ordinary crystal', 4.5e-5, 2.2, { align: 'center', size: 11, color: 'orange' });
          sE.vband(2e-7, 2e-6, { color: 'green', alpha: 0.14 }); sE.text('TCXO', 6e-7, 2.2, { align: 'center', size: 11, color: 'green' });
          sE.vline(1e-6, { color: 'ink', width: 1.8 }); sE.text('paper: κ ≤ 10⁻⁶', 1e-6, 0.00022, { align: 'right', dx: -5, size: 11.5, color: 'ink', halo: true });
          sE.hline(mu * (1 - kapS.value), { color: 'red', dash: true, width: 1.8 }); sE.text('μ(1−κ)', 1.3e-8, mu, { align: 'left', baseline: 'bottom', dy: -3, size: 12, color: 'red' });
          sE.dot(kapS.value, eps(kapS.value), { r: 8, color: 'gold' });
          const E = eps(kapS.value);
          info = { E, ok: E / (1 - kapS.value) <= mu, tsync: tau * d, d, tau, xi, mu, A, B, R };
        });
        v.legend([['accent', 'ε(κ) from the theorem'], ['red', 'μ(1−κ): largest ε without anomalies', { dash: true }], ['orange', 'ordinary crystal oscillator range (vendor data)', { area: true }], ['green', 'TCXO range (vendor data)', { area: true }]]);
        v.readout(() => {
          const I = info, R2 = I.R, A = I.A, B = I.B, f = (x) => v.fix(x, 1);
          const claims = [['p1', 'r4', 'before'], ['p3', 'q3', 'concurrent'], ['p2', 'q3', 'concurrent'], ['p2', 'p3', 'before']].map(([x, y, w]) => { const a = R2.by.get(x), b = R2.by.get(y), got = R2.hb(a, b) ? 'before' : R2.hb(b, a) ? 'after' : 'concurrent'; return `${x}${w === 'before' ? '→' : '∥'}${y} ${got === w ? '✓' : '✗'}`; }).join(', ');
          let rel = 'Click two events of the figure to ask for their relation.';
          if (A && B && A !== B) rel = R2.hb(A, B) ? `$${A.name}\\to ${B.name}$: a chain of arrows leads from ${A.name} to ${B.name}.` : R2.hb(B, A) ? `$${B.name}\\to ${A.name}$.` : `$${A.name}\\parallel ${B.name}$: concurrent.`;
          else if (A) rel = `$${A.name}$ picked; click a second event.`;
          const tot = R2.ev.slice().sort((a, b) => R2.C.get(a.id) - R2.C.get(b.id) || a.p - b.p || a.y - b.y).map((e) => e.name).join(' ');
          return `${rel} Paper's claims, recomputed: ${claims}. Total order $\\Rightarrow$ from these clocks: ${tot}.\nε ≈ d(2κτ + ξ) = **${f(1000 * I.E)} ms** for the chosen κ=${kapS.value.toExponential(1)}, reached after about τ·d = ${f(I.tsync)} s; anomaly-free requires ε/(1−κ) ≤ μ = ${f(1000 * I.mu)} ms: ${I.ok ? 'satisfied' : '**violated**'}. The paper puts crystal clocks at κ ≤ 10⁻⁶; ordinary packaged crystal oscillators are rated about 20–100 ppm (2·10⁻⁵ to 10⁻⁴) in vendor data, so today's cheap clocks are one to two orders worse, and ξ dominates ε unless it is tiny.`;
        });
      },
    },
  ],
};
