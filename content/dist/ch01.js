// Distributed Computing — Chapter 1: Models of distributed systems (items 1.1–1.5; 1.6–1.10 in ch01-b.js)
import { hash01, clamp, plural, range, ly, drawLanes, drawMsg, hitMsg, laneAt, runFlood, decideEcho, incInit, incStep, incHistogram, PROPS, firstBad, unroll, extendable } from './ch01.shared.js';

export default {
  collection: 'dist',
  chapter: 1,
  title: 'Models of distributed systems',
  summary: String.raw`A distributed system is a set of processes that communicate by messages or shared memory, with no global clock and no global view. What can be done depends on the timing model — synchronous, asynchronous or partially synchronous — and on how processes may fail. Correctness splits into safety (nothing bad happens) and liveness (something good eventually happens), proved with invariants; impossibility proofs rest on indistinguishability, the fact that a process cannot tell apart executions that look the same locally.`,
  items: [
    // ------------------------------------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Message-passing systems',
      statement: String.raw`A message-passing system consists of $n$ processes $P_0,\dots,P_{n-1}$, each a state machine with its own local state, and a set of communication channels between them (here: one in each direction along every edge of a network graph). A step of a process is triggered by a local event or by the arrival of a message; in a step it may change its local state and put messages on its outgoing channels. A channel holds the messages sent but not yet delivered, and delivers each after a finite delay. There is no shared memory and no global clock: a process knows only its local state and what the messages it has received told it.`,
      idea: String.raw`The definition fixes what "distributed" means for everything that follows: the only way information moves is along channels, and only after a delay. An *execution* is therefore the interleaving of local events and message deliveries, which the space-time diagram records: one lane per process, one arrow per message. Properties of the channels (reliable or lossy, FIFO or not, bounded delay or not) are not part of this definition; they are the subject of the timing and failure models that follow.`,
      caption: String.raw`Left: the network; right: its space-time diagram (time runs right, one lane per process). Switch to *inject* and click a process to give it a new, larger value at the current time; it floods outwards as tokens that take a random delay on each edge. Edit the graph (switch back to *edit*: click empty space for a node, click two nodes for an edge, Alt-click to delete), drag the delay slider, or turn FIFO off. Each node only ever shows its own value.`,
      deps: [], refs: ['Lynch §2.1', 'Lynch §14.1'], tags: ['model', 'channels'],
      scope: String.raw`Reliable channels with finite delay are assumed in this picture; lossy or faulty channels are added by the failure models (1.3).`,
      viz(v) {
        const P = 10;
        const sN = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, title: 'network (each box shows the process’s own value)', weight: 1, minWidth: 280 });
        const sT = v.stage({ x: [-0.8, P], y: [-0.6, 4.6], axes: false, height: 320, title: 'space-time diagram', weight: 1.35, minWidth: 320 });
        const mode = v.select('click', [{ value: 'edit', label: 'edit graph' }, { value: 'inject', label: 'inject value' }], 'inject');
        const dS = v.slider('max delay', 0.4, 3, 1.4, { step: 0.05 });
        const fifo = v.toggle('FIFO channels', true);
        let inj = [{ t: 0.4, node: 0, x: 1 }, { t: 4.6, node: 4, x: 2 }], nextVal = 3;
        const G = v.graph(sN, {
          editable: true, directed: false, layout: 'none', r: 17, fontSize: 13,
          nodes: [{ id: 0, x: 1.3, y: 3.2, label: 'P0' }, { id: 1, x: 3.6, y: 5.0, label: 'P1' }, { id: 2, x: 4.2, y: 1.2, label: 'P2' }, { id: 3, x: 6.6, y: 3.4, label: 'P3' }, { id: 4, x: 8.8, y: 4.6, label: 'P4' }, { id: 5, x: 8.8, y: 1.2, label: 'P5' }],
          edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]],
          onClick: (c) => { if (mode.value !== 'inject') return undefined; const id = c.id ?? (c.node && c.node.id); if (id != null) { inj.push({ t: clamp(v.t, 0, P - 3), node: id, x: nextVal++ }); v.invalidate(); } return true; },
        });
        v.button('clear injections', () => { inj = []; nextVal = 1; });
        let key = '', run = null, ids = [];
        const compute = () => {
          ids = G.nodes.map((n) => n.id);
          const adj = Object.fromEntries(ids.map((i) => [i, []]));
          for (const e of G.edges) { if (adj[e.from] && adj[e.to]) { adj[e.from].push(e.to); adj[e.to].push(e.from); } }
          const k = JSON.stringify([adj, inj, dS.value, fifo.value]);
          if (k !== key) { key = k; run = runFlood(adj, inj, { dmin: dS.value * 0.25, dmax: dS.value, fifo: fifo.value, seed: 5 }); run.adj = adj; }
          return run;
        };
        const valAt = (id, t) => { let r = 0; for (const [tt, x] of run.hist[id] || []) if (tt <= t) r = x; return r; };
        const lastChange = (id, t) => { let r = -9; for (const [tt] of run.hist[id] || []) if (tt <= t && tt > 0) r = tt; return r; };
        v.animate((t) => {
          compute(); const n = ids.length;
          sT.setView([-0.9, P], [-0.7, n - 0.3]);
          G.draw({
            nodeNote: (id) => String(valAt(id, t)), notePos: 's', noteColor: 'ink',
            nodeFill: (id) => (t - lastChange(id, t) < 0.45 ? 'gold' : null), nodeColor: (id) => (valAt(id, t) > 0 ? 'accent' : null),
            edgeColor: () => 'faint',
          });
          // tokens in flight on the network
          for (const m of run.msgs) {
            if (m.ts > t || m.tr <= t) continue;
            const a = G.node(m.from), b = G.node(m.to); if (!a || !b) continue;
            const f = (t - m.ts) / (m.tr - m.ts), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ox = (-dy / L) * 0.17, oy = (dx / L) * 0.17;
            sN.dot(a.x + dx * f + ox, a.y + dy * f + oy, { r: 7, color: 'orange', fill: true });
            sN.text(String(m.x), a.x + dx * f + ox, a.y + dy * f + oy + 0.3, { size: 11, color: 'orange', align: 'center' });
          }
          // space-time diagram
          drawLanes(sT, n, P, { names: ids.map((i) => `P${i}`) });
          for (const m of run.msgs) {
            if (m.ts > t) continue;
            const a = ids.indexOf(m.from), b = ids.indexOf(m.to);
            drawMsg(sT, n, { from: a, to: b, ts: m.ts, tr: m.tr, label: m.x }, { frac: m.tr <= t ? 1 : (t - m.ts) / (m.tr - m.ts), color: 'orange', label: m.tr <= t });
          }
          ids.forEach((id, i) => { for (const [tt, x] of run.hist[id]) if (tt <= t && x > 0) sT.dot(tt, ly(i, n), { r: 5, color: 'accent', fill: true }); });
          sT.vline(t, { color: 'gold', width: 1.6 });
          sT.text('time →', P - 0.1, -0.55, { align: 'right', size: 11, color: 'muted' });
        }, { period: P, still: 5.2 });
        v.readout(() => {
          compute(); const t = v.t;
          const sent = run.msgs.filter((m) => m.ts <= t).length, done = run.msgs.filter((m) => m.tr <= t).length;
          // check: after quiescence every process holds the largest value injected in its connected component
          const comp = {}; let c = 0;
          for (const i of ids) { if (comp[i] != null) continue; const st = [i]; comp[i] = c; while (st.length) { const u = st.pop(); for (const w of run.adj[u]) if (comp[w] == null) { comp[w] = c; st.push(w); } } c++; }
          const best = {}; for (const e of inj) if (run.adj[e.node]) best[comp[e.node]] = Math.max(best[comp[e.node]] || 0, e.x);
          const ok = ids.every((i) => run.final[i] === (best[comp[i]] || 0));
          return `t = ${v.fix(t, 1)} · messages sent **${sent}**, delivered **${done}**, in flight **${sent - done}** · values: ${ids.map((i) => `$P_{${i}}{=}${valAt(i, t)}$`).join(' ')}\nAfter the run settles every process holds the largest value injected in its component: ${ok ? '**yes**' : '**NO**'} (a disconnected piece never hears of it — try deleting an edge).`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Definition', name: 'Synchronous, asynchronous and partially synchronous timing',
      statement: String.raw`A timing model constrains message delays and relative process speeds. In the **synchronous** model there are known bounds $\delta$ on message delay (and on the time for a step), equivalently execution proceeds in lockstep rounds. In the **asynchronous** model there is no bound at all: every message is delivered eventually, but after an arbitrary finite delay, and processes can run at arbitrarily different speeds. In the **partially synchronous** model (Dwork–Lynch–Stockmeyer) bounds exist but are either unknown, or hold only after an unknown global stabilization time (GST).`,
      idea: String.raw`A timeout is only evidence of failure if the bound it assumes is real. With a known bound $\delta$ and heartbeat period $p$, a silence longer than $p+\delta$ proves the sender crashed, so a timeout $\Delta>p+\delta$ never errs. With no bound, the adversary delays one heartbeat just beyond whatever $\Delta$ is chosen, so every timeout eventually suspects a live process. With bounds that hold only after GST, a timeout can err finitely often and then becomes accurate for ever, which is the property that protocols such as Paxos and Raft rely on.`,
      caption: String.raw`A (top lane) sends a heartbeat each time unit to B, which suspects A when no heartbeat arrives within the timeout $\Delta$ (red = a false suspicion of a live process, green = a correct suspicion). Switch the timing model, drag $\delta$, $\Delta$ and GST, and click A's lane to crash it at that instant. The lower panel plots the gap between successive arrivals against $\Delta$. The asynchronous schedule is an illustrative adversary: it holds back a short burst of heartbeats until just after $\Delta$ has expired, and does it again, longer, every 5.5 time units.`,
      deps: ['dist-1.1'], refs: ['Lynch §2.1', 'Lynch §23.4'], tags: ['timing', 'timeouts'],
      credit: 'Dwork, Lynch & Stockmeyer, 1988 (partial synchrony)',
      scope: String.raw`Heartbeat period fixed at 1; delay is uniform in $[0.1,\delta]$ except where the adversarial schedule says otherwise.`,
      viz(v) {
        const T = 14;
        const sA = v.stage({ x: [-1, T], y: [-0.7, 1.7], axes: false, height: 230, title: 'heartbeats from A to B', full: true });
        const sB = v.stage({ x: [0, T], y: [0, 6], axes: 'box', gutter: true, height: 190, xlabel: 'arrival time of a heartbeat at B', ylabel: 'gap since previous', full: true });
        const mdl = v.select('timing model', [{ value: 'sync', label: 'synchronous' }, { value: 'async', label: 'asynchronous' }, { value: 'part', label: 'partially synchronous' }], 'part');
        const dl = v.slider('delay bound $\\delta$', 0.3, 2.5, 0.9, { step: 0.05 });
        const to = v.slider('timeout $\\Delta$', 0.6, 4.5, 2.2, { step: 0.05 });
        const gs = v.slider('GST', 0, 12, 5.5, { step: 0.5 });
        let crash = null;
        v.button('remove crash', () => { crash = null; });
        const sim = () => {
          const beats = [];
          // adversarial outages (asynchronous / before GST): every beat sent in [3.2 + 5.5 j, 3.2 + 5.5 j + 1.5) is held until just after Δ has run out
          const outage = (t) => { const j = Math.floor((t - 3.2) / 5.5); if (t < 3.2 || t >= 3.2 + 5.5 * j + 1.5) return -1; return j; };
          for (let k = 0; k * 1 < T; k++) {
            const t = k + 0.2; if (crash != null && t >= crash) break;
            const d = 0.1 + (dl.value - 0.1) * hash01(3, k);
            let tr = t + d;
            const j = outage(t), adv = mdl.value === 'async' || (mdl.value === 'part' && t < gs.value);
            if (adv && j >= 0) { const start = 3.2 + 5.5 * j; tr = start + to.value + 0.5 + 0.15 * j + 0.06 * (t - start); }
            if (mdl.value === 'part' && t < gs.value) tr = Math.min(tr, Math.max(gs.value + dl.value, t + d));
            beats.push({ k, ts: t, tr, late: tr - t > dl.value + 1e-9 });
          }
          const sorted = beats.filter((b) => b.tr <= T).slice().sort((a, b) => a.tr - b.tr);
          const ints = []; let prev = 0.2; const gaps = [];
          for (const b of sorted) { if (b.tr > prev + to.value) ints.push({ a: prev + to.value, b: b.tr }); gaps.push({ at: b.tr, gap: b.tr - prev }); prev = b.tr; }
          if (T > prev + to.value) ints.push({ a: prev + to.value, b: T, open: true });
          ints.forEach((q) => { q.ok = crash != null && q.a >= crash; });
          return { beats, ints, gaps };
        };
        sA.onClick((x, y) => { if (y > 0.5 && x > 0.5 && x < T - 1) { crash = x; v.invalidate(); } });
        v.render(() => {
          const R = sim();
          if (mdl.value === 'sync') for (let k = 0; k < T; k += 2) sA.vband(k, k + 1, { color: 'accent', alpha: 0.05 });
          drawLanes(sA, 2, T, { names: ['A', 'B'], deadAt: { 0: crash } });
          for (const q of R.ints) sA.rect(q.a, -0.2, Math.min(q.b, T), 0.2, { fill: q.ok ? 'green' : 'red', fillAlpha: 0.4, stroke: false });
          for (const b of R.beats) { if (b.tr > T) continue; drawMsg(sA, 2, { from: 0, to: 1, ts: b.ts, tr: b.tr }, { color: b.late ? 'orange' : 'accent', width: 1.7 }); }
          if (mdl.value === 'part') { sA.vline(gs.value, { color: 'gold', dash: true, width: 1.6 }); sA.text('GST', gs.value + 0.1, 1.55, { size: 12, color: 'gold' }); }
          sA.text('crash: click A’s lane', T - 0.1, 1.5, { align: 'right', size: 11, color: 'muted' });
          // gap panel
          const safe = 1 + dl.value - 0.1;
          sB.setView([0, T], [0, Math.max(3.2, to.value * 1.35, ...R.gaps.map((g) => g.gap * 1.1))]);
          sB.hline(to.value, { color: 'red', dash: true, width: 1.8 }); sB.text('timeout Δ', 0.2, to.value + 0.25, { size: 11.5, color: 'red', halo: true });
          if (mdl.value !== 'async') { sB.hline(safe, { color: 'green', dash: [2, 4], width: 1.5 }); sB.text('1 + δ − 0.1: largest gap once delays are bounded', T - 0.2, safe + 0.28, { size: 11, color: 'green', halo: true, align: 'right' }); }
          for (const g of R.gaps) sB.rect(g.at - 0.14, 0, g.at + 0.14, g.gap, { fill: g.gap > to.value ? 'red' : 'accent', fillAlpha: 0.55, color: g.gap > to.value ? 'red' : 'accent', width: 1 });
          if (mdl.value === 'part') sB.vline(gs.value, { color: 'gold', dash: true });
        });
        v.legend([['accent', 'heartbeat'], ['orange', 'heartbeat held back beyond δ'], ['red', 'false suspicion', { area: true }], ['green', 'correct suspicion', { area: true }]]);
        v.readout(() => {
          const R = sim(), falseN = R.ints.filter((q) => !q.ok).length, last = R.ints.filter((q) => !q.ok).map((q) => q.b).pop();
          const lat = crash != null ? R.ints.filter((q) => q.ok)[0] : null;
          const safeΔ = 1 + dl.value - 0.1;
          return `false suspicions of a live A: **${falseN}**${falseN && mdl.value === 'part' ? ` (the last ended at $t=${v.fix(Math.min(last, T), 1)}$, GST $=${gs.value}$)` : ''} · timeout is ${to.value > safeΔ ? '**above**' : '**below**'} $1+\\delta-0.1=${v.fix(safeΔ, 2)}$` + (crash != null ? `\ncrash at $t=${v.fix(crash, 1)}$ detected after **${lat ? v.fix(lat.a - crash, 2) : '—'}** time units` : '\nclick A’s lane to crash it and measure detection time') + `\n${mdl.value === 'sync' ? 'Synchronous: any $\\Delta>p+\\delta$ is never wrong.' : mdl.value === 'async' ? 'Asynchronous: for every $\\Delta$ the adversary can make the next spike longer — no timeout is safe.' : 'Partial synchrony: false suspicions can only occur before GST + δ; afterwards the timeout is accurate for ever.'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Failure models: crash, omission and Byzantine',
      statement: String.raw`A process is **faulty** if it deviates from its specified behaviour; models differ in how it may deviate. A *crash* fault stops the process for ever (possibly in the middle of sending a batch of messages). An *omission* fault lets the process continue but fail to send (or receive) some messages. A *Byzantine* (arbitrary) fault allows any behaviour, including sending different values to different recipients. The models are nested: crash $\subset$ omission $\subset$ Byzantine, so a protocol that tolerates Byzantine faults tolerates the others. Correct processes are the ones that never deviate; guarantees are stated only for them.`,
      idea: String.raw`The only thing another process can observe of a fault is the messages that do or do not arrive, so each model is a statement about what the set of received messages can look like. Crash faults make messages disappear from some point on; omission faults make arbitrary messages disappear; Byzantine faults can also invent or alter messages and tell different lies to different recipients. The picture runs the same two-round exchange under every model and compares the decisions of the correct processes.`,
      caption: String.raw`Commander P0 sends the value 1 to the three lieutenants, who then echo to each other, and each lieutenant decides the majority of the three values it has seen. Click a process name to cycle ok → crash → omission → Byzantine. Click a crashed process's lane to move the crash instant, or click an arrow of an omission-faulty process to drop it. Watch the views on the right: one fault is always absorbed; two faults often are not. The last line of the readout is a brute-force check over every possible behaviour of the faulty processes.`,
      deps: ['dist-1.1'], refs: ['Lynch §2.2', 'Attiya–Welch ch. 5'], tags: ['faults', 'byzantine'],
      credit: 'Lamport, Shostak & Pease, 1982 (the Byzantine model)',
      scope: String.raw`Four processes, reliable synchronous delivery for the messages that are sent; a missing message is read as the default value 0.`,
      viz(v) {
        const T = 5, N = 4, KIND = ['ok', 'crash', 'omit', 'byz'], NAME = { ok: '', crash: ' crash', omit: ' omission', byz: ' Byzantine' };
        const s = v.stage({ x: [-0.7, 8.0], y: [-0.6, 4.1], axes: false, height: 330, full: true });
        const fault = ['ok', 'ok', 'ok', 'ok'], ct = [0.75, 2.7, 2.7, 2.7], drops = new Set();
        const fl = (i) => (fault[i] === 'crash' ? 'crash' : fault[i]);
        const build = () => {
          const msgs = [], r1 = {}, r2 = { 1: {}, 2: {}, 3: {} };
          for (const j of [1, 2, 3]) { // round 1: P0 -> Pj
            const ts = 0.1 + 0.3 * j, tr = ts + 0.9, f = fault[0], key = `0>${j}>1`;
            let val = 1, lost = false;
            if (f === 'crash' && ts >= ct[0]) lost = true;
            if (f === 'omit' && drops.has(key)) lost = true;
            if (f === 'byz' && j === 2) val = 0;
            msgs.push({ from: 0, to: j, ts, tr, val, lost, key, r: 1, label: lost ? '' : val }); r1[j] = lost ? null : val;
          }
          for (const i of [1, 2, 3]) {
            const others = [1, 2, 3].filter((j) => j !== i);
            others.forEach((j, q) => {
              const ts = 2.2 + 0.3 * q + 0.1 * i, tr = ts + 0.9, f = fault[i], key = `${i}>${j}>2`;
              let val = r1[i] ?? 0, lost = false;
              if (f === 'crash' && ts >= ct[i]) lost = true;
              if (f === 'omit' && drops.has(key)) lost = true;
              if (f === 'byz' && j === others[0]) val = 1 - val;
              msgs.push({ from: i, to: j, ts, tr, val, lost, key, r: 2, label: lost ? '' : val }); r2[j][i] = lost ? null : val;
            });
          }
          const dec = decideEcho(r1, r2);
          return { msgs, r1, r2, dec };
        };
        // brute force over every behaviour of the faulty set
        const check = (F) => {
          let bad = 0, tot = 0;
          const slots = [];
          for (const f of F) { if (f === 0) [1, 2, 3].forEach((j) => slots.push([0, j])); else [1, 2, 3].filter((j) => j !== f).forEach((j) => slots.push([f, j])); }
          for (let mask = 0; mask < 1 << slots.length; mask++) {
            const r1 = {}, r2 = { 1: {}, 2: {}, 3: {} };
            const wire = (a, b) => { const k = slots.findIndex((q) => q[0] === a && q[1] === b); return k < 0 ? null : (mask >> k) & 1; };
            for (const j of [1, 2, 3]) r1[j] = F.includes(0) ? wire(0, j) : 1;
            for (const i of [1, 2, 3]) for (const j of [1, 2, 3]) if (i !== j) r2[j][i] = F.includes(i) ? wire(i, j) : r1[i];
            const d = decideEcho(r1, r2), good = [1, 2, 3].filter((i) => !F.includes(i));
            const agree = good.every((i) => d[i] === d[good[0]]), valid = F.includes(0) || good.every((i) => d[i] === 1);
            tot++; if (!(agree && valid)) bad++;
          }
          return [bad, tot];
        };
        const one = [0, 1, 2, 3].map((f) => check([f])), pairs = [];
        for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push([[a, b], check([a, b])]);
        const oneBad = one.reduce((x, c) => x + c[0], 0), oneTot = one.reduce((x, c) => x + c[1], 0);
        const twoBad = pairs.reduce((x, c) => x + c[1][0], 0), twoTot = pairs.reduce((x, c) => x + c[1][1], 0);
        s.onClick((x, y) => {
          const i = laneAt(y, N);
          if (x < 0 && i >= 0) { const L = ly(i, N); void L; fault[i] = KIND[(KIND.indexOf(fault[i]) + 1) % 4]; return; }
          const R = build(), k = hitMsg(s, N, R.msgs, s.X(x), s.Y(y), 10);
          if (k >= 0 && fault[R.msgs[k].from] === 'omit') { const key = R.msgs[k].key; if (drops.has(key)) drops.delete(key); else drops.add(key); return; }
          if (i >= 0 && fault[i] === 'crash' && x > 0.1 && x < T) ct[i] = x;
        });
        v.render(() => {
          const R = build();
          const dead = {}; fault.forEach((f, i) => { if (f === 'crash') dead[i] = ct[i]; });
          s.vband(0, 1.9, { color: 'accent', alpha: 0.05 }); s.vband(2.0, 3.6, { color: 'orange', alpha: 0.05 });
          s.text('round 1: commander sends', 0.95, 3.95, { align: 'center', size: 11, color: 'muted' }); s.text('round 2: lieutenants echo', 2.8, 3.95, { align: 'center', size: 11, color: 'muted' });
          drawLanes(s, N, T, { names: ['P0', 'P1', 'P2', 'P3'], deadAt: dead, nameColor: (i) => (fault[i] === 'ok' ? 'ink' : 'red') });
          for (const m of R.msgs) drawMsg(s, N, m, { color: fault[m.from] === 'byz' ? 'red' : fault[m.from] === 'omit' ? 'orange' : 'accent', labelColor: 'ink' });
          s.text(`${NAME[fault[0]] || ' (correct)'}`, T + 0.15, ly(0, N), { size: 11.5, color: fault[0] === 'ok' ? 'muted' : 'red' });
          const good = [1, 2, 3].filter((i) => fault[i] === 'ok');
          for (const i of [1, 2, 3]) {
            const y = ly(i, N);
            if (fault[i] !== 'ok') { s.text(`faulty:${NAME[fault[i]]}`, T + 0.15, y, { size: 12, color: 'red' }); continue; }
            const seen = [R.r1[i] ?? 0, ...[1, 2, 3].filter((j) => j !== i).map((j) => R.r2[i][j] ?? 0)];
            s.text(`sees ${seen.join(', ')}`, T + 0.15, y + 0.17, { size: 12, color: 'muted' });
            s.text(`decides ${R.dec[i]}`, T + 0.15, y - 0.17, { size: 13, color: 'ink' });
            void good;
          }
        });
        v.legend([['accent', 'message (value on arrow)'], ['orange', 'omission-faulty sender'], ['red', 'Byzantine sender / ✕ lost']]);
        v.readout(() => {
          const R = build(), F = [0, 1, 2, 3].filter((i) => fault[i] !== 'ok'), good = [1, 2, 3].filter((i) => fault[i] === 'ok');
          const agree = good.every((i) => R.dec[i] === R.dec[good[0]]), valid = fault[0] !== 'ok' || good.every((i) => R.dec[i] === 1);
          return `faulty: ${F.length ? F.map((i) => `P${i}`).join(', ') : 'none'} · agreement among correct lieutenants **${agree ? 'holds' : 'FAILS'}** · validity (commander correct ⇒ decide 1) **${fault[0] !== 'ok' ? 'n/a' : valid ? 'holds' : 'FAILS'}**\nbrute force over all behaviours of the faulty set: one faulty process — ${oneBad} bad of ${oneTot}; two faulty — ${twoBad} bad of ${twoTot} (n = 4 tolerates f = 1 but not f = 2)`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Definition', name: 'Shared-memory systems',
      statement: String.raw`In a shared-memory system the $n$ processes communicate through a set of shared variables (registers). An atomic step of one process reads or writes one variable (or, with stronger primitives, does a read–modify–write on it) and updates the process's local state. An execution is a sequence of such steps chosen by a scheduler; the system is asynchronous in that any interleaving of the processes' steps is possible. Registers are atomic here: each read or write takes effect at a single instant.`,
      idea: String.raw`The program "increment $x$" is not one step: it is a read followed by a write, and other processes may run in between. The scheduler, not the programmer, decides the interleaving, so correctness must hold for every interleaving. Counting all interleavings of the same program shows how the outcomes split: with read/write steps only, some schedules lose updates; with an atomic read–modify–write step (fetch-and-add) every schedule gives the same answer.`,
      caption: String.raw`Each process runs *r := x; x := r + 1* the chosen number of times. You are the scheduler: press a process button to let it take one step, or *random* to finish the run with a seeded random schedule. The right panel counts, over **all** interleavings, how many give each final value of $x$ (exact, by dynamic programming); the gold marker shows where your run landed. Flip to atomic increments and the histogram collapses to a single bar.`,
      deps: [], refs: ['Lynch §9.1', 'Lynch §9.4'], tags: ['shared memory', 'interleavings'],
      viz(v) {
        let sched = [0, 1, 0, 1], seed = 1;
        const rs = () => { sched = []; };
        const np = v.select('processes', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 2, { onChange: rs });
        const rp = v.select('increments each', [{ value: 1, label: '1' }, { value: 2, label: '2' }], 1, { onChange: rs });
        const at = v.toggle('atomic increment (fetch-and-add)', false, { onChange: rs });
        const sP = v.stage({ x: [0, 12], y: [0, 6.2], axes: false, height: 300, title: 'registers and programs', weight: 1.25, minWidth: 300 });
        const sL = v.stage({ x: [0, 13], y: [-0.7, 3.2], axes: 'box', gutter: true, height: 190, xlabel: 'step of the schedule', ylabel: 'process', title: 'the schedule', weight: 1.1, minWidth: 280 });
        const sH = v.stage({ x: [0, 7], y: [0, 1], axes: 'box', gutter: true, height: 190, xlabel: 'final value of x', ylabel: 'interleavings', title: 'every interleaving', weight: 1, minWidth: 240 });
        const cfg = () => ({ n: +np.value, reps: +rp.value, atomic: at.value });
        const replay = () => { const { n, reps, atomic } = cfg(); let st = incInit(n); const xs = [0]; for (const i of sched) { st = incStep(st, i, reps, atomic) || st; xs.push(st.x); } return { st, xs }; };
        const stepOf = (i) => { const { reps, atomic } = cfg(), per = atomic ? 1 : 2; return replay().st.pc[i] < reps * per; };
        const mk = (i) => v.button(`step P${i + 1}`, () => { if (i < +np.value && stepOf(i)) sched.push(i); });
        const bs = [mk(0), mk(1), mk(2)];
        v.button('random schedule', () => { const { n, reps, atomic } = cfg(); let st = replay().st; const r = v.rng(seed++); for (;;) { const live = range(n).filter((i) => incStep(st, i, reps, atomic)); if (!live.length) break; const i = live[Math.floor(r() * live.length)]; sched.push(i); st = incStep(st, i, reps, atomic); } });
        v.button('undo', () => { sched.pop(); });
        v.button('reset', () => { sched = []; });
        const COL = ['accent', 'orange', 'purple'];
        v.legend([['green', 'final value = no update lost'], ['red', 'final value with lost updates', ]]);
        v.render(() => {
          const { n, reps, atomic } = cfg(); bs.forEach((b, i) => { b.hidden = i >= n; });
          // schedule from a changed configuration may be invalid: replay is tolerant
          const { st, xs } = replay(); const total = n * reps, per = atomic ? 1 : 2;
          const H = incHistogram(n, reps, atomic), M = [...H.values()].reduce((a, b) => a + b, 0), keys = [...H.keys()].sort((a, b) => a - b);
          // programs
          sP.rect(4.4, 4.9, 7.6, 6.0, { color: 'ink', width: 2, fill: 'gold', fillAlpha: 0.2, radius: 8 });
          sP.text('shared register', 6, 5.75, { align: 'center', size: 11.5, color: 'muted' });
          sP.text(`x = ${st.x}`, 6, 5.3, { align: 'center', size: 20, color: 'ink' });
          for (let i = 0; i < n; i++) {
            const X = n === 2 ? 1.2 + i * 5.8 : 0.5 + i * 4.0, W = n === 2 ? 4.9 : 3.5;
            sP.rect(X, 0.2, X + W, 4.3, { color: COL[i], width: 1.8, fill: COL[i], fillAlpha: 0.06, radius: 8 });
            sP.text(`P${i + 1}`, X + 0.3, 4.0, { size: 14, color: COL[i], align: 'left' });
            const lines = atomic ? ['x ← x + 1  (one atomic step)'] : ['r ← x           (read)', 'x ← r + 1    (write)'];
            const done = st.pc[i], cur = done % per, iter = Math.floor(done / per);
            lines.forEach((ln, q) => {
              const y = 2.9 - q * 0.8, active = done < reps * per && cur === q;
              if (active) sP.rect(X + 0.15, y - 0.35, X + W - 0.15, y + 0.35, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.2, radius: 6 });
              sP.text(ln, X + 0.35, y, { size: 12.5, color: 'ink', align: 'left' });
            });
            sP.text(done >= reps * per ? 'finished' : `repetition ${iter + 1} of ${reps}`, X + 0.3, 1.2, { size: 11, color: done >= reps * per ? 'green' : 'muted', align: 'left' });
            if (!atomic) sP.text(`local r = ${st.r[i] == null ? '—' : st.r[i]}`, X + 0.3, 0.6, { size: 12, color: 'purple', align: 'left' });
          }
          // schedule lanes
          sL.setView([0, Math.max(6, total * per + 1)], [-0.7, n - 0.3]);
          const rep = { x: 0, pc: Array(n).fill(0), r: Array(n).fill(null) }; let cur = rep;
          sched.forEach((i, k) => {
            const stp = cur.pc[i]; const isW = atomic || stp % 2 === 1; cur = incStep(cur, i, reps, atomic) || cur;
            sL.dot(k + 0.5, n - 1 - i, { r: 6, color: COL[i], fill: !isW ? false : true, hollow: !isW });
          });
          sL.setTicks(null, range(n).map((i) => [n - 1 - i, `P${i + 1}`]));
          sL.text('● write   ○ read', 0.1, n - 0.45, { size: 11, color: 'muted', align: 'left' });
          // x over time
          void xs;
          // histogram
          const mx = Math.max(...H.values()); sH.setView([keys[0] - 0.7, keys[keys.length - 1] + 0.7], [0, mx * 1.2]);
          sH.setTicks(keys, null);
          keys.forEach((k) => { sH.rect(k - 0.32, 0, k + 0.32, H.get(k), { fill: k === total ? 'green' : 'red', fillAlpha: 0.45, color: k === total ? 'green' : 'red', width: 1.2 }); sH.text(String(H.get(k)), k, H.get(k), { align: 'center', baseline: 'bottom', dy: -3, size: 12, color: 'ink' }); });
          const fin = st.pc.every((p) => p >= reps * per);
          if (fin) sH.dot(st.x, mx * 0.06, { r: 7, color: 'gold', fill: true, label: 'you', labelPos: 'n' });
        });
        v.readout(() => {
          const { n, reps, atomic } = cfg(), { st } = replay(), total = n * reps, per = atomic ? 1 : 2;
          const H = incHistogram(n, reps, atomic), M = [...H.values()].reduce((a, b) => a + b, 0), right = H.get(total) || 0, fin = st.pc.every((p) => p >= reps * per);
          return `schedule so far: ${sched.length ? sched.map((i) => `P${i + 1}`).join(' ') : '(empty)'} · $x=${st.x}$ ${fin ? `· finished: ${st.x === total ? 'all increments counted' : `**${total - st.x} lost update${total - st.x === 1 ? '' : 's'}**`}` : ''}\n**${right}** of **${M}** interleavings (${v.fix((100 * right) / M, 1)}%) end with the "right" value $x=${total}$; ${atomic ? 'with an atomic step every interleaving does.' : 'the rest lose updates.'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Definition', name: 'Safety and liveness properties',
      statement: String.raw`A *property* is a set of infinite executions (here: infinite words of events). It is a **safety** property if every execution outside it has a finite prefix none of whose infinite extensions lies in it ("something bad happens at a definite moment, and cannot be undone"). It is a **liveness** property if every finite prefix can be extended to an execution inside it ("something good eventually happens", which no finite observation can refute). Every property is the intersection of a safety and a liveness property (Alpern–Schneider).`,
      idea: String.raw`To refute a safety property one points at a finite prefix: a bad prefix, the earlier the better. To refute a liveness property no prefix will do, because any prefix could still be repaired by a good future; the whole infinite run is needed, which a computer can only exhibit as a lasso (a prefix followed by a repeated loop). The picture tests each finite prefix for extendability, so the two kinds of failure look different: a red cut-off for safety, an unbroken green row for liveness.`,
      caption: String.raw`Letters are requests (r), grants (g) and idle steps (·); click a cell to change it. The infinite run is the first cells followed by the shaded loop repeated for ever (slide the loop start). Pick a property and read the verdict. The bottom row asks, for each prefix length, whether that prefix can still be completed to a run satisfying the property: it turns red at the first bad prefix for a safety violation, but a liveness violation never turns it red.`,
      deps: ['dist-1.1'], refs: ['Lynch §8.5.3'], tags: ['safety', 'liveness'],
      credit: 'Lamport, 1977 (the terms); Alpern & Schneider, 1985 (the definitions)',
      scope: String.raw`Runs are ultimately periodic (lassos) over the alphabet {r, g, ·}; extendability is tested against a family of tail loops that is complete for these four properties.`,
      viz(v) {
        const W = 12, LET = ['.', 'r', 'g'];
        const PRE = {
          good: { w: 'r.g.rg..r.g.', k: 8 }, spur: { w: '.rg.g..rg...', k: 9 }, starve: { w: 'r.g.r.......', k: 5 }, rare: { w: 'r.gr.g......', k: 6 },
        };
        let word = PRE.starve.w.split('').map((c) => (c === '.' ? '.' : c));
        const prop = v.select('property', [{ value: 'S', label: 'safety' }, { value: 'L1', label: 'liveness: granted' }, { value: 'L2', label: 'liveness: infinitely often' }, { value: 'SL', label: 'safety ∧ liveness' }], 'L1');
        const kS = v.slider('loop starts at cell', 1, W - 1, PRE.starve.k, { int: true });
        const nS = v.slider('unrolled length', 14, 40, 28, { int: true });
        v.select('example run', [{ value: 'starve', label: 'starved request' }, { value: 'spur', label: 'spurious grant' }, { value: 'good', label: 'well behaved' }, { value: 'rare', label: 'one request ignored' }], 'starve', { onChange: (val) => { const p = PRE[val]; word = p.w.split(''); kS.set(p.k); } });
        const s1 = v.stage({ x: [-0.5, W + 0.5], y: [-0.2, 2.3], axes: false, height: 150, title: 'the run: prefix, then the loop for ever', full: true });
        const s2 = v.stage({ x: [-0.5, 40.5], y: [-0.2, 3], axes: false, height: 175, title: 'the same infinite run, unrolled', full: true });
        const colOf = (c) => (c === 'r' ? 'orange' : c === 'g' ? 'green' : 'muted');
        s1.onClick((x, y) => { const i = Math.floor(x); if (i >= 0 && i < W && y >= 0 && y <= 1.4) { word[i] = LET[(LET.indexOf(word[i]) + 1) % 3]; } });
        const lasso = () => { const k = kS.value; return { pre: word.slice(0, k), loop: word.slice(k) }; };
        v.render(() => {
          const { pre, loop } = lasso(), P = PROPS[prop.value], k = kS.value, N = nS.value;
          s1.rect(k, -0.05, W, 1.45, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4, dash: true, radius: 6 });
          word.forEach((c, i) => {
            s1.rect(i + 0.06, 0.05, i + 0.94, 1.35, { fill: colOf(c), fillAlpha: c === '.' ? 0.05 : 0.28, color: colOf(c), width: 1.5, radius: 5 });
            s1.text(c === '.' ? '·' : c, i + 0.5, 0.72, { align: 'center', size: 20, color: c === '.' ? 'muted' : colOf(c) });
          });
          s1.curve((t) => [W - 0.3 - t * (W - k - 0.6), 1.45 + 0.5 * Math.sin(Math.PI * t)], 0, 1, { color: 'accent', width: 1.8 });
          s1.arrow(k + 0.3, 1.46, k + 0.2, 1.43, { color: 'accent', width: 1.8 });
          s1.text('repeat for ever', (k + W) / 2, 2.15, { align: 'center', size: 11.5, color: 'accent' });
          s1.text('prefix', k / 2, 2.0, { align: 'center', size: 11.5, color: 'muted' });
          // unrolled word
          const un = unroll(pre, loop, Math.ceil(N / Math.max(1, loop.length)) + 1).slice(0, N), bad = firstBad(un);
          s2.setView([-0.5, N + 0.9], [-0.2, 3]);
          un.forEach((c, i) => {
            const inLoop = i >= k;
            s2.rect(i + 0.07, 1.5, i + 0.93, 2.3, { fill: colOf(c), fillAlpha: c === '.' ? 0.04 : 0.3, color: inLoop ? 'accent' : colOf(c), width: inLoop ? 1.2 : 1.4, radius: 3 });
            s2.text(c === '.' ? '·' : c, i + 0.5, 1.9, { align: 'center', size: N > 30 ? 12 : 14, color: c === '.' ? 'muted' : colOf(c) });
          });
          s2.text('…', N + 0.7, 1.9, { size: 22, color: 'muted', align: 'center' });
          const hasS = prop.value === 'S' || prop.value === 'SL';
          if (hasS && bad >= 0 && bad < N) {
            s2.rect(-0.02, 1.42, bad + 1.02, 2.38, { color: 'red', width: 2.4, radius: 4 });
            s2.text('bad prefix', (bad + 1) / 2, 2.65, { align: 'center', size: 12, color: 'red' });
          }
          // extendability row
          s2.text('prefix can still be completed?', 0, 0.95, { size: 11, color: 'muted', align: 'left' });
          for (let l = 0; l <= N; l++) {
            const ok = extendable(P, un.slice(0, l));
            s2.dot(l, 0.45, { r: N > 30 ? 3.2 : 4.2, color: ok ? 'green' : 'red', fill: true });
          }
        });
        v.legend([['orange', 'request'], ['green', 'grant / can be completed'], ['red', 'bad prefix: no completion works']]);
        v.readout(() => {
          const { pre, loop } = lasso(), P = PROPS[prop.value], un = unroll(pre, loop, 3), ok = P.sat(pre, loop), bad = firstBad(un);
          let cutoff = -1; for (let l = 0; l <= un.length; l++) if (!extendable(P, un.slice(0, l))) { cutoff = l; break; }
          const verdict = ok ? 'the infinite run **satisfies** the property.'
            : cutoff >= 0 ? `the run **violates** it, and a finite prefix of length **${cutoff}** already proves it: no continuation can repair it (a safety violation).`
              : 'the run **violates** it, but **every finite prefix** can still be completed to a good run — only the whole infinite run (the loop never helps) shows the failure (a liveness violation).';
          void bad;
          return `${P.name}: ${verdict}`;
        });
      },
    },
  ],
};
