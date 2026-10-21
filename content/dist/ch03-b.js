// Distributed Computing — Chapter 3, part b: items 3.6–3.8 (causal broadcast, consistent cuts, Chandy–Lamport snapshot)
import { T0, NAMES, PCOL, defaultModel, randomModel, setModel, buildExec, evName, vecStr, drawLanes, drawMsg, ly, runCausal, runCL, clamp, range } from './ch03.shared.js';

export default {
  collection: 'dist',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Algorithm', name: 'Causal broadcast',
      statement: String.raw`**Causal order delivery**: if the broadcast of $m$ happened before the broadcast of $m'$ ($m\to m'$, 3.1), then every process delivers $m$ before $m'$. Implementation with vectors: process $p_i$ keeps $V_i[j]$, the number of broadcasts of $p_j$ it has delivered ($V_i[i]$ counts its own broadcasts). To broadcast $m$, $p_i$ increments $V_i[i]$ and attaches $VT(m):=V_i$. A message $m$ of $p_j$ that arrives at $p_i$ is held in a buffer until **(a)** $VT(m)[j]=V_i[j]+1$ (it is the next one from $p_j$) and **(b)** $VT(m)[k]\le V_i[k]$ for all $k\ne j$ (every broadcast $p_j$ had delivered before sending has been delivered here); then it is delivered and $V_i[j]$ is incremented. Over reliable channels that may reorder messages and delay them arbitrarily, this delivers causally and no message waits forever. Concurrent broadcasts may still be delivered in different orders at different processes.`,
      idea: String.raw`Condition (a) says that no earlier broadcast of the same sender is missing, and condition (b) says that everything the sender knew of when it broadcast has already been delivered at $p_i$; together, nothing in the causal past of $m$ is still on its way to $p_i$. By induction on the causal order, every message eventually becomes deliverable, because the messages it waits for are received eventually and are deliverable first. Per-sender FIFO order is not enough: a reply $m_2$ from another process can overtake the question $m_1$ on a faster route, which is exactly the anomaly the buffer prevents. The vectors are those of 3.4, now counting broadcasts rather than all events.`,
      caption: String.raw`$P$ broadcasts $m_1$; $Q$ answers with $m_2$ the moment it delivers $m_1$; $P$ answers that with $m_3$; independently $R$ broadcasts $m_4$. Slide the delay of $m_1$ on its way to $R$ upwards. With *on arrival* or *FIFO only*, $R$ delivers the answer $m_2$ before the question $m_1$ (red ring: a delivery that precedes its own cause). With *causal* delivery, the orange bar shows $m_2$ waiting in $R$'s buffer until $m_1$ has been delivered. Labels give each message's vector timestamp $[P,Q,R]$; $m_4$ is concurrent with the chain and may be delivered anywhere in it.`,
      deps: ['dist-3.4'], refs: ['Attiya–Welch ch. 8'], tags: ['broadcast', 'causal order'],
      credit: 'Birman & Joseph, 1987; Birman, Schiper & Stephenson, 1991 (vector timestamps)',
      scope: String.raw`Reliable channels without failures, a fixed set of processes; messages are broadcast to everybody (the vectors count broadcasts). With crashes, a buffered message may wait forever for a predecessor that died, and reliable broadcast is needed underneath.`,
      viz(v) {
        const rule = v.select('delivery rule', [{ value: 'arrival', label: 'on arrival' }, { value: 'fifo', label: 'FIFO per sender only' }, { value: 'causal', label: 'causal (vector rule)' }], 'causal');
        const slow = v.slider('delay of $m_1$ on its way to $R$', 0.5, 6, 3.2, { step: 0.1 });
        const s = v.stage({ x: [-1.3, 9.2], y: [-0.85, 2.95], axes: false, height: 320, full: true, title: 'broadcasts, arrivals (thin lines), buffers (orange) and deliveries (dots)' });
        let R = null;
        v.render(() => {
          R = runCausal({ rule: rule.value, slow: slow.value });
          const T = Math.max(6, Math.ceil(R.end + 1.2));
          s.setView([-1.3, T + 0.3], [-0.85, 2.95]);
          drawLanes(s, 3, T, { names: NAMES.slice(0, 3) });
          const col = (m) => PCOL[(m.tag - 1) % 5];
          const bad = new Set(R.viol.map((x) => `${x.p}:${x.first.tag}`));
          R.dels.forEach((L, p) => {
            for (const d of L) {
              const y = ly(p, 3), m = d.m;
              if (d.own) { s.dot(m.t, y, { r: 7, color: col(m) }); s.text(`m${m.tag} ${vecStr(m.VT)}`, m.t, y, { align: 'center', baseline: 'bottom', dy: -14, size: 11.5, color: col(m), halo: true }); continue; }
              s.line(m.t, ly(m.from, 3), d.tArr, y, { color: col(m), width: 1.5, alpha: 0.7 });
              if (d.tDel > d.tArr + 1e-6) { s.line(d.tArr, y, d.tDel, y, { color: 'orange', width: 9, alpha: 0.55 }); s.text('held', (d.tArr + d.tDel) / 2, y, { align: 'center', baseline: 'top', dy: 8, size: 11, color: 'orange', halo: true }); }
              const isBad = bad.has(`${p}:${m.tag}`);
              if (isBad) s.dot(d.tDel, y, { r: 13, hollow: true, color: 'red', width: 2.6 });
              s.dot(d.tDel, y, { r: 6, color: col(m) });
              s.text(`m${m.tag}`, d.tDel, y, { align: 'center', baseline: 'top', dy: 10, size: 12, color: isBad ? 'red' : 'ink', halo: true });
            }
          });
          s.text('time →', T + 0.15, -0.6, { align: 'right', size: 11, color: 'muted' });
        });
        v.legend([['accent', 'm1'], ['orange', 'm2'], ['green', 'm3'], ['purple', 'm4'], ['orange', 'held in a buffer', { area: true }], ['red', 'delivered before its cause', { dot: true }]]);
        v.readout(() => {
          const ord = (p) => R.dels[p].map((d) => `m${d.m.tag}`).join(' ');
          const held = []; R.dels.forEach((L, p) => L.forEach((d) => { if (d.tDel > d.tArr + 1e-6) held.push(`m${d.m.tag} at ${NAMES[p]} for ${(d.tDel - d.tArr).toFixed(1)}`); }));
          const cs = R.viol.map((x) => `${NAMES[x.p]} delivers m${x.first.tag} before m${x.second.tag}, which it depends on`);
          return `Delivery orders — ${NAMES.slice(0, 3).map((n, p) => `${n}: ${ord(p)}`).join(' · ')}.\nCausal violations: **${R.viol.length}**${cs.length ? ` (${cs.join('; ')})` : ' — causal order respected everywhere'}. Held in buffers: ${held.length ? held.join(', ') : 'nothing'}.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Definition', name: 'Consistent cuts and global states',
      statement: String.raw`A **cut** of an execution chooses, for every process, a prefix of its events (the events "before the cut"). A cut is **consistent** if no message is received inside the cut but sent outside it, equivalently if the set of events inside is closed under happened-before: $e\in C$ and $e'\to e$ imply $e'\in C$. The **global state** of a cut consists of the local state of each process after its prefix and, for every channel, the messages sent inside but not yet received inside (the messages crossing the cut). A consistent cut is a global state that the system could have passed through, as far as causality can tell; the consistent cuts of an execution are closed under union and intersection and form a lattice.`,
      idea: String.raw`A message received inside the cut but sent outside would record an effect without its cause, which no instant of any execution can show, so such cuts are exactly the ones to exclude. Conversely, if the set of events inside is closed under $\to$, listing them in any linear extension of $\to$ is an actual prefix of an execution that ends in this cut, so the state is reachable. Real time does not matter: the processes need never have been in these local states simultaneously, and a straight vertical line through a space-time diagram is just one special consistent cut. Messages crossing the cut forwards are not an error but part of the state, the channel contents, and forgetting them loses information (3.8).

Use membership and the union/intersection laws of alg 1.2 on two downward-closed event sets. If an event is in their union, one set contains it and therefore contains all its predecessors; if it is in their intersection, both sets contain every predecessor. Both results are again consistent cuts. Their union is the least containing cut and their intersection the greatest contained cut, which supplies the stated lattice operations. Per-process prefixes and causal closure, rather than a common physical instant, are the hypotheses.`,
      caption: String.raw`Drag the three handles to place the cut on each line; events at or left of a handle are inside (coloured). Messages turn **red** when received inside but sent outside (an orphan: the cut is inconsistent), **gold** when they cross the cut forwards (these are the channel contents of the global state) and blue when both ends are inside. The shaded side of the dashed cut is green when it is consistent and red when not. *Shrink* repairs it by moving each offending receiver back, *grow* by moving each sender forward. The readout counts how many of all possible cuts of this execution are consistent, and checks the two equivalent definitions against each other.`,
      deps: ['dist-3.1','alg-1.2'], refs: ['Lynch §19.2'], tags: ['global state', 'cuts'],
      credit: 'Chandy & Lamport, 1985; Mattern, 1989',
      scope: String.raw`A finite execution with reliable messages; the cut is a prefix at every process (no gaps), which is what makes "consistent" the right notion of a global state.`,
      viz(v) {
        const M = defaultModel(); let seed = 0;
        const s = v.stage({ x: [-1.3, T0 + 0.5], y: [-0.75, 2.85], axes: false, height: 310, full: true, title: 'drag the handles to move the cut' });
        const hs = range(3).map((i) => s.handle([6.5, 3.5, 5.0][i], ly(i, 3), { color: PCOL[i], r: 8, label: NAMES[i], labelPos: 's', constrain: (x) => [clamp(x, 0.1, T0 - 0.1), ly(i, 3)] }));
        v.button('shrink to a consistent cut', () => { const X = buildExec(M); for (let g = 0; g < 40; g++) { let ch = false; for (const m of X.msgs) { const so = X.ev[m.s].t <= hs[m.from].x, ro = X.ev[m.r].t <= hs[m.to].x; if (ro && !so) { hs[m.to].x = X.ev[m.r].t - 0.15; ch = true; } } if (!ch) break; } });
        v.button('grow to a consistent cut', () => { const X = buildExec(M); for (let g = 0; g < 40; g++) { let ch = false; for (const m of X.msgs) { const so = X.ev[m.s].t <= hs[m.from].x, ro = X.ev[m.r].t <= hs[m.to].x; if (ro && !so) { hs[m.from].x = X.ev[m.s].t + 0.1; ch = true; } } if (!ch) break; } });
        v.button('random execution', () => { seed++; setModel(M, randomModel(seed)); hs.forEach((h, i) => h.set([6.5, 3.5, 5.0][i], ly(i, 3))); });
        v.button('reset', () => { seed = 0; setModel(M, defaultModel()); hs.forEach((h, i) => h.set([6.5, 3.5, 5.0][i], ly(i, 3))); });
        let info = null;
        v.render(() => {
          const X = buildExec(M), n = 3, inside = (e) => e.t <= hs[e.p].x;
          const orphan = [], cross = [];
          for (const m of X.msgs) { const so = inside(X.ev[m.s]), ro = inside(X.ev[m.r]); if (ro && !so) orphan.push(m); else if (so && !ro) cross.push(m); }
          const ok = orphan.length === 0;
          const pts = hs.map((h) => [h.x, h.y]);
          const top = ly(0, 3) + 0.6, bot = ly(2, 3) - 0.6, cutPts = [[pts[0][0], top], ...pts, [pts[2][0], bot]];
          s.poly([[0, top], ...cutPts, [0, bot]], { fill: ok ? 'green' : 'red', fillAlpha: 0.1, stroke: false });
          drawLanes(s, n, T0, { names: NAMES.slice(0, 3) });
          const kind = (m) => { const so = inside(X.ev[m.s]), ro = inside(X.ev[m.r]); return ro && !so ? 'red' : so && !ro ? 'gold' : so && ro ? 'accent' : 'faint'; };
          for (const m of X.msgs) drawMsg(s, n, m, { color: kind(m), width: kind(m) === 'red' ? 3.4 : kind(m) === 'gold' ? 2.8 : 2, label: false });
          for (const e of X.ev) { s.dot(e.t, ly(e.p, n), { r: 6, color: inside(e) ? PCOL[e.p] : 'faint', hollow: !inside(e) }); s.text(evName(e), e.t, ly(e.p, n), { align: 'center', baseline: 'bottom', dy: -12, size: 11.5, color: inside(e) ? 'ink' : 'muted', halo: true }); }
          s.path(cutPts, { color: 'ink', width: 2.6, dash: [7, 5] });
          s.text(ok ? 'consistent cut' : 'inconsistent cut', T0 + 0.35, 2.7, { align: 'right', size: 14, color: ok ? 'green' : 'red' });
          // all prefixes: how many are consistent? (and the closure check)
          const cnt = X.byProc.map((L) => L.length + 1); let total = 0, good = 0;
          for (let a = 0; a < cnt[0]; a++) for (let b = 0; b < cnt[1]; b++) for (let c = 0; c < cnt[2]; c++) {
            const k = [a, b, c]; total++; let fine = true;
            for (const m of X.msgs) if (X.ev[m.r].idx < k[m.to] && !(X.ev[m.s].idx < k[m.from])) { fine = false; break; }
            if (fine) good++;
          }
          let closed = true;
          for (const e of X.ev) if (inside(e)) for (const f of X.ev) if (X.hb(f.id, e.id) && !inside(f)) closed = false;
          info = { orphan, cross, ok, total, good, closed, k: X.byProc.map((L, p) => L.filter((id) => inside(X.ev[id])).length), X };
        });
        v.legend([['accent', 'inside cut', { dot: true }], ['gold', 'crosses the cut (channel state)'], ['red', 'orphan: received inside, sent outside']]);
        v.readout(() => {
          const I = info, X = I.X, nm = (m) => `${evName(X.ev[m.s])}→${evName(X.ev[m.r])}`;
          return `Cut = (${I.k.join(', ')}) events at $P,Q,R$ — **${I.ok ? 'consistent' : 'inconsistent'}**: ${I.orphan.length ? `orphan message${I.orphan.length > 1 ? 's' : ''} ${I.orphan.map(nm).join(', ')}` : 'no orphan message'}; closed under $\\to$: ${I.closed ? 'yes' : 'no'} (the two definitions ${I.closed === I.ok ? 'agree ✓' : 'DISAGREE ✗'}).\nIn transit (channel state): ${I.cross.length ? I.cross.map(nm).join(', ') : 'nothing'}. Of the ${I.total} possible cuts of this execution, **${I.good}** are consistent.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Algorithm', name: 'Chandy–Lamport snapshot',
      statement: String.raw`Processes are joined by reliable **FIFO** channels, and the computation keeps running while a snapshot is taken. An initiator records its local state and sends a *marker* on each outgoing channel. A process that receives a marker on channel $c$ does the following. If it has not yet recorded its state, it records it, declares the state of $c$ to be empty, sends a marker on each outgoing channel, and starts recording the messages arriving on each other incoming channel. If it has already recorded, it stops recording $c$; the state of $c$ is the sequence of messages received on $c$ after the process recorded and before this marker. When every process has received a marker on every incoming channel, the recorded local states and channel states form a **consistent global state**, in the sense of 3.7: a state the computation could have passed through. In particular any conserved quantity, such as the total amount of money, is recorded exactly.`,
      idea: String.raw`FIFO makes the marker a divider on each channel: everything sent before the marker was sent before its sender recorded, and everything after was sent after. A message sent after its sender recorded travels behind the marker, so it reaches the receiver after the marker has made it record; hence the recorded cut has no orphan message. A message sent before the sender recorded but received after the receiver recorded must arrive ahead of the marker on that channel, so it is caught as channel state; hence nothing in flight is lost or counted twice. The snapshot may match no instant of real time, but it is reachable by reordering concurrent events, so any stable property that holds in it also holds in the real system once the snapshot is done.`,
      caption: String.raw`Three bank branches send each other money over FIFO channels (gold tokens carry the amount, red tokens are markers). At the chosen time $P$ records its balance and sends markers; each branch records on its first marker, and the amounts that arrive on a channel after recording but before its marker are that channel's recorded contents. The snapshot total always comes to 300. Switch to the *naive* method, where every branch just reads its balance at the same instant, and the money in flight is missed. In the time panel the green dots are the recording points: the line through them is a consistent cut (3.7). Move the start time, change the delays, press *new traffic*.`,
      deps: ['dist-3.7'], refs: ['Lynch §19.2.2'], tags: ['snapshot', 'global state'],
      credit: 'Chandy & Lamport, 1985',
      scope: String.raw`Reliable FIFO channels, no process or channel failures, a strongly connected network, and a computation that never stops while the snapshot runs. The recorded state is consistent but is not claimed to be the true state at any real instant.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chandy%E2%80%93Lamport_algorithm' },
      viz(v) {
        const mode = v.select('snapshot by', [{ value: 'cl', label: 'Chandy–Lamport markers' }, { value: 'naive', label: 'naive: read all balances at one instant' }], 'cl');
        const tS = v.slider('$P$ starts at time', 1, 9, 4, { step: 0.5 });
        const sp = v.slider('delay spread', 0, 1, 0.5, { step: 0.05 });
        let seed = 1; v.button('new traffic', () => { seed++; });
        const sN = v.stage({ x: [0, 10], y: [0, 6.3], axes: false, equal: true, height: 340, title: 'the branches and their channels', weight: 1, minWidth: 300 });
        const sT = v.stage({ x: [-1, 15.8], y: [-0.8, 2.9], axes: false, height: 340, title: 'time (marker lines in red)', weight: 1.4, minWidth: 380 });
        const POS = [[5, 5.1], [1.7, 1.2], [8.3, 1.2]], RAD = 0.8;
        let R = null, key = '', mark = null;
        const get = () => {
          const k = `${seed}|${sp.value}|${tS.value}`;
          if (k !== key) { key = k; R = runCL({ seed, spread: sp.value, tSnap: tS.value }); mark = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (const m of R.msgs) if (m.kind === 'mark') mark[m.from][m.to] = m.tr; }
          return R;
        };
        const edge = (a, b, off) => { const [x1, y1] = POS[a], [x2, y2] = POS[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux; return { x1: x1 + ux * RAD + nx * off, y1: y1 + uy * RAD + ny * off, x2: x2 - ux * RAD + nx * off, y2: y2 - uy * RAD + ny * off, nx, ny }; };
        v.animate((t) => {
          const Rn = get(), cl = mode.value === 'cl', T = 15.8;
          // network
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) { const e = edge(a, b, 0.2); sN.arrow(e.x1, e.y1, e.x2, e.y2, { color: 'faint', width: 1.5 }); }
          for (const m of Rn.msgs) {
            if (m.ts > t || m.tr <= t || (!cl && m.kind === 'mark')) continue;
            const e = edge(m.from, m.to, 0.2), f = (t - m.ts) / (m.tr - m.ts), x = e.x1 + (e.x2 - e.x1) * f, y = e.y1 + (e.y2 - e.y1) * f;
            if (m.kind === 'xfer') { sN.dot(x, y, { r: 7, color: 'gold' }); sN.text(String(m.amt), x + e.nx * 0.42, y + e.ny * 0.42, { align: 'center', size: 11.5, color: 'ink', halo: true }); }
            else sN.dot(x, y, { r: 7, color: 'red' });
          }
          for (let p = 0; p < 3; p++) {
            const [x, y] = POS[p], rec = cl ? Rn.recT[p] != null && Rn.recT[p] <= t : t >= tS.value;
            sN.circle(x, y, RAD, { fill: rec ? 'green' : 'accent', fillAlpha: rec ? 0.28 : 0.14, color: rec ? 'green' : 'accent', width: 2.4 });
            sN.text(NAMES[p], x, y + 0.22, { align: 'center', size: 17, color: 'ink' });
            sN.text(String(Rn.balAt(p, t)), x, y - 0.25, { align: 'center', size: 15, color: 'ink' });
            if (rec) sN.text(`recorded ${cl ? Rn.recBal[p] : Rn.naive[p]}`, x, y + (p === 0 ? 1.15 : -1.2), { align: 'center', size: 13, color: 'green', halo: true });
          }
          if (cl) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b && mark[a][b] <= t && mark[a][b] > 0) { const s = Rn.chan[a][b].reduce((x, y) => x + y, 0), e = edge(a, b, 0.2); if (s > 0) sN.text(`${s} in channel`, (e.x1 + e.x2) / 2 + e.nx * 0.8, (e.y1 + e.y2) / 2 + e.ny * 0.8, { align: 'center', size: 12.5, color: 'orange', halo: true }); }
          // time panel
          for (let i = 0; i < 3; i++) { sT.line(0, 2 - i, T, 2 - i, { color: 'faint', width: 1.6 }); sT.text(NAMES[i], -0.3, 2 - i, { align: 'right', size: 14, color: 'ink' }); }
          for (const m of Rn.msgs) {
            if (m.ts > t || (!cl && m.kind === 'mark')) continue;
            const f = m.tr <= t ? 1 : (t - m.ts) / (m.tr - m.ts), y1 = 2 - m.from, y2 = 2 - m.to;
            sT.line(m.ts, y1, m.ts + (m.tr - m.ts) * f, y1 + (y2 - y1) * f, { color: m.kind === 'mark' ? 'red' : 'muted', width: m.kind === 'mark' ? 2.4 : 1.2, alpha: m.kind === 'mark' ? 0.85 : 0.6 });
          }
          if (cl) {
            const rec = [0, 1, 2].filter((p) => Rn.recT[p] != null && Rn.recT[p] <= t);
            if (rec.length > 1) sT.path(rec.map((p) => [Rn.recT[p], 2 - p]), { color: 'green', width: 3, alpha: 0.8 });
            rec.forEach((p) => sT.dot(Rn.recT[p], 2 - p, { r: 8, color: 'green' }));
          } else if (t >= tS.value) { sT.vline(tS.value, { color: 'green', width: 3 }); for (let p = 0; p < 3; p++) sT.dot(tS.value, 2 - p, { r: 8, color: 'green' }); }
          sT.vline(t, { color: 'gold', width: 1.4 });
        }, { period: 17, still: 16.5 });
        v.legend([['gold', 'money in transit', { dot: true }], ['red', 'marker', { dot: true }], ['green', 'recorded', { dot: true }]]);
        v.readout(() => {
          const Rn = get(), t = v.t, cl = mode.value === 'cl';
          if (!cl) {
            const rd = t >= tS.value, sum = Rn.naive.reduce((a, b) => a + b, 0), fl = Rn.msgs.filter((m) => m.kind === 'xfer' && m.ts < tS.value && m.tr >= tS.value).reduce((a, m) => a + m.amt, 0);
            return rd ? `Balances read at time ${tS.value}: ${NAMES.slice(0, 3).map((n, p) => `$${n}{=}${Rn.naive[p]}$`).join(', ')} — sum **${sum}**, true total 300: **${300 - sum} missing**, exactly the ${fl} that was on the channels at that instant${fl === 300 - sum ? ' ✓' : ''}.` : `Waiting for time ${tS.value}: every branch will read its balance at that instant and ignore the channels.`;
          }
          const recs = Rn.recBal.map((b, p) => (Rn.recT[p] != null && Rn.recT[p] <= t ? b : null)), done = Rn.doneT != null && t >= Rn.doneT;
          let chs = 0; const parts = [];
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b && mark[a][b] <= t && mark[a][b] > 0) { const s = Rn.chan[a][b].reduce((x, y) => x + y, 0); chs += s; if (s) parts.push(`${NAMES[a]}→${NAMES[b]}: ${Rn.chan[a][b].join('+')}`); }
          const sum = recs.reduce((a, b) => a + (b || 0), 0) + chs;
          return `Recorded balances: ${NAMES.slice(0, 3).map((n, p) => (recs[p] == null ? `${n}: —` : `$${n}{=}${recs[p]}$`)).join(', ')}; channel contents so far: ${parts.length ? parts.join(', ') : 'none'}.\n${done ? `Snapshot complete at time ${v.fix(Rn.doneT, 1)}: **${sum}** recorded = true total 300 ${sum === 300 ? '✓' : '✗'}; orphan messages across the recorded cut: **${Rn.orphans}**.` : `Snapshot in progress (${v.fix(sum, 0)} recorded so far, final total will be 300).`}`;
        });
      },
    },
  ],
};
