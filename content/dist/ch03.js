// Distributed Computing — Chapter 3: Time, clocks and snapshots (items 3.1–3.5; 3.6–3.8 in ch03-b.js, 3.9–3.12 in ch03-c.js)
import { T0, NAMES, PCOL, defaultModel, randomModel, setModel, buildExec, evName, relation, chain, pairStats, vecLess, vecStr, drawExec, attachEditor, ly, runSM, SM_OPS } from './ch03.shared.js';

/** A stage with an editable space-time diagram (see attachEditor) and the usual "random execution" / "reset" buttons. */
function diagram(v, o = {}) {
  const D = { M: defaultModel(), sel: [], seed: 0, X: null, opts: o.build || {} };
  D.build = () => { D.X = buildExec(D.M, D.opts); return D.X; };
  D.build();
  D.s = v.stage({ x: [-1.3, T0 + 0.5], y: [-0.75, 2.85], axes: false, height: o.height || 300, full: true, title: o.title || 'space-time diagram (time runs to the right)' });
  D.ed = attachEditor(D.s, D.M, () => D.X, {
    onPick: (id) => { if (o.one) D.sel = [id]; else D.sel = D.sel.length >= 2 ? [id] : D.sel.includes(id) ? D.sel : [...D.sel, id]; },
    onChange: () => { D.sel = []; },
  });
  v.button('random execution', () => { D.seed++; setModel(D.M, randomModel(D.seed)); D.sel = []; });
  v.button('reset', () => { setModel(D.M, defaultModel()); D.sel = []; D.seed = 0; });
  D.draw = (x = {}) => {
    drawExec(D.s, D.X, { ghost: D.ed.ghost, ...x });
    D.s.text('drawing time →', T0 + 0.35, -0.55, { align: 'right', size: 11, color: 'muted' });
  };
  return D;
}

export default {
  collection: 'dist',
  chapter: 3,
  title: 'Time, clocks and snapshots',
  summary: String.raw`Without a shared clock, the order of events is only partial: one event happens before another if a chain of messages links them. Lamport clocks extend this order consistently to a total one, and vector clocks capture it exactly. Consistent cuts define meaningful global states, which the Chandy–Lamport algorithm records without stopping the system. Physical clocks can be synchronized only up to a bound set by uncertainty in message delays.`,
  items: [
    // ------------------------------------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Definition', name: 'The happened-before relation',
      statement: String.raw`Take a system of processes, each a sequence of events (local steps, sending a message, receiving a message). The **happened-before** relation $\to$ is the smallest relation on the set of all events with three properties: (i) if $a$ comes before $b$ in the same process, then $a\to b$; (ii) if $a$ sends a message and $b$ receives that same message, then $a\to b$; (iii) if $a\to b$ and $b\to c$, then $a\to c$. Two distinct events $a,b$ with neither $a\to b$ nor $b\to a$ are **concurrent**, written $a\parallel b$. The relation $\to$ is a strict partial order, and $a\to b$ means exactly that a chain of process steps and message deliveries leads from $a$ to $b$, so that $a$ *could* have influenced $b$.`,
      idea: String.raw`Information can travel only inside a process or along a message, and rules (i) and (ii) record exactly those two moves; rule (iii) strings moves into chains. Every move goes strictly forward in a process and every message is received after it is sent, so no chain returns to its starting event: $\to$ is irreflexive and antisymmetric, hence a strict partial order. Concurrency is the absence of a chain in either direction. It is not transitive, and it says nothing about which event "really" came first, since without a shared clock no process could tell. Lamport took the idea from special relativity, where causal order is the order of signals that could be sent; here only the messages that were actually sent count.`,
      caption: String.raw`Click an event to pick $a$ (gold), click a second to pick $b$ (orange). Everything is coloured relative to $a$: blue events happened before it, green events happen after it, grey ones are concurrent with it, and a thick gold path shows a shortest chain from one pick to the other. Edit the execution: drag from one line to another to send a message, click an empty stretch of a line to add a local event (hollow), click a message to delete it. Where an event is drawn along the time axis is only layout: find two concurrent events and notice that one is drawn to the left of the other.`,
      deps: ['dist-1.1'], refs: ['Lynch §18.1', 'Attiya–Welch ch. 6'], tags: ['causality', 'partial order'],
      credit: 'Lamport, 1978',
      scope: String.raw`Messages are reliable and each is received once; the diagram is a finite execution in which only messages actually sent count (as opposed to messages that could have been sent).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Happened-before' },
      viz(v) {
        const D = diagram(v, {});
        v.legend([['gold', 'a (first pick)', { dot: true }], ['blue', 'happened before a', { dot: true }], ['green', 'happens after a', { dot: true }], ['muted', 'concurrent with a', { dot: true }]]);
        let info = null;
        v.render(() => {
          const X = D.build(), n = X.n, [a, b] = D.sel;
          const rel = (e) => (a == null ? 'accent' : e.id === a ? 'gold' : X.hb(e.id, a) ? 'blue' : X.hb(a, e.id) ? 'green' : 'muted');
          let ch = null;
          if (a != null && b != null) ch = chain(X, a, b) || chain(X, b, a);
          if (ch) D.s.path(ch.map((id) => [X.ev[id].t, ly(X.ev[id].p, n)]), { color: 'gold', width: 7, alpha: 0.5 });
          D.draw({ dotColor: rel, label: evName, ring: (e) => (e.id === a ? 'gold' : e.id === b ? 'orange' : null), localHollow: false });
          // checks of the partial-order axioms and a non-transitivity example
          let irr = true, anti = true, trans = true, ex = null;
          for (let i = 0; i < X.N; i++) { if (X.hb(i, i)) irr = false; for (let j = 0; j < X.N; j++) { if (X.hb(i, j) && X.hb(j, i)) anti = false; if (X.hb(i, j)) for (let k = 0; k < X.N; k++) if (X.hb(j, k) && !X.hb(i, k)) trans = false; } }
          for (let i = 0; i < X.N && !ex; i++) for (let j = 0; j < X.N && !ex; j++) for (let k = 0; k < X.N; k++) if (i !== j && j !== k && i !== k && !X.hb(i, j) && !X.hb(j, i) && !X.hb(j, k) && !X.hb(k, j) && X.hb(i, k)) { ex = [i, j, k]; break; }
          info = { ch, irr, anti, trans, ex, st: pairStats(X) };
        });
        v.readout(() => {
          const X = D.X, [a, b] = D.sel, I = info;
          let l1 = '';
          if (a == null) l1 = 'Pick an event to see its causal past (blue) and future (green).';
          else if (b == null) { const A = X.ev[a]; const past = X.past[a].reduce((x, y) => x + y, 0); let fut = 0; for (let e = 0; e < X.N; e++) if (X.hb(a, e)) fut++; l1 = `$a=${evName(A)}$: ${past} events happened before it, ${fut} happen after it, ${X.N - 1 - past - fut} are concurrent with it.`; }
          else { const r = relation(X, a, b), A = X.ev[a], B = X.ev[b], na = evName(A), nb = evName(B); l1 = r === 'same' ? 'Same event picked twice.' : r === 'concurrent' ? `$${na}\\parallel ${nb}$: no chain of messages joins them in either direction${A.t < B.t ? `, although $${na}$ is drawn to the left of $${nb}$` : A.t > B.t ? `, although $${nb}$ is drawn to the left of $${na}$` : ''}.` : `$${r === 'before' ? na : nb}\\to ${r === 'before' ? nb : na}$ via a chain of ${I.ch.length - 1} step${I.ch.length === 2 ? '' : 's'}: ${I.ch.map((id) => evName(X.ev[id])).join(' → ')}.`; }
          const ex = I.ex ? ` Concurrency is not transitive here: $${evName(X.ev[I.ex[0]])}\\parallel ${evName(X.ev[I.ex[1]])}$ and $${evName(X.ev[I.ex[1]])}\\parallel ${evName(X.ev[I.ex[2]])}$ but $${evName(X.ev[I.ex[0]])}\\to ${evName(X.ev[I.ex[2]])}$.` : '';
          return `${l1}\n${X.N} events; of ${I.st.total} pairs, **${I.st.ord}** are ordered and **${I.st.conc}** concurrent. Checked on this diagram: irreflexive ${I.irr ? '✓' : '✗'}, antisymmetric ${I.anti ? '✓' : '✗'}, transitive ${I.trans ? '✓' : '✗'}.${ex}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Algorithm', name: 'Lamport clocks',
      statement: String.raw`Every process keeps an integer counter $C$, initially $0$. **(IR1)** Before each event (local step or send) the process increments $C$ and stamps the event with the new value; a sent message carries that stamp $T$. **(IR2)** On receiving a message stamped $T$, the process sets $C:=\max(C,T)+1$ and stamps the receive event with $C$. Then the **Clock Condition** holds: $a\to b$ implies $C(a)<C(b)$. The converse is false: concurrent events may get any order of stamps, or equal stamps. Breaking ties by the process number gives a total order $a\Rightarrow b$ iff $(C(a),p(a))<(C(b),p(b))$ lexicographically, which extends $\to$.`,
      idea: String.raw`Any chain of arrows is built from two kinds of steps: a step inside a process, where IR1 makes the counter grow, and a message delivery, where IR2 makes the receive stamp exceed the send stamp. By induction on the length of the chain the stamps strictly increase along it, which is the Clock Condition. The converse cannot hold: a counter is a single number, but causality has width (concurrent events), so the total order $\Rightarrow$ must order some concurrent pairs, and it does so arbitrarily. Lamport clocks therefore never contradict causality but cannot detect it; that is what vector clocks add (3.4).`,
      caption: String.raw`Numbers over events are Lamport stamps; edit the execution as in 3.1 (random execution, click, drag). The strip underneath lists all events in the total order $(C,p)$: arrows of the diagram always point rightwards in it. Switch to *increment only*, a broken rule that ignores the incoming stamp, and causal arrows whose stamp does not grow turn red. Click an event to see how its stamp was computed. The readout counts how many concurrent pairs nevertheless get $C(a)<C(b)$.`,
      deps: ['dist-3.1'], refs: ['Lynch §18.1', 'Attiya–Welch ch. 6'], tags: ['logical clocks', 'total order'],
      credit: 'Lamport, 1978',
      scope: String.raw`Reliable message delivery; no failures. The stamps give a total order consistent with causality, not real time, and carry no information about concurrency.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lamport_timestamp' },
      viz(v) {
        const D = diagram(v, { height: 285, one: true });
        const rule = v.select('rule', [{ value: 'max', label: 'Lamport: max, then +1' }, { value: 'inc', label: 'broken: +1 only' }], 'max');
        const sT = v.stage({ x: [-0.7, 12], y: [-1, 1.2], axes: false, height: 110, full: true, title: 'all events in the total order (C, process)' });
        let info = null;
        v.render(() => {
          D.opts = { lamport: rule.value };
          const X = D.build(), n = X.n, sel = D.sel[0];
          const bad = (m) => X.lam[m.r] <= X.lam[m.s];
          D.draw({ label: (e) => X.lam[e.id], dotColor: (e) => (e.id === sel ? 'gold' : PCOL[e.p]), localHollow: false, msgColor: (m) => (bad(m) ? 'red' : 'accent'), msgWidth: (m) => (bad(m) ? 3 : 2), ring: (e) => (e.id === sel ? 'gold' : null), labelSize: 13 });
          const ord = X.ev.map((e) => e.id).sort((a, b) => X.lam[a] - X.lam[b] || X.ev[a].p - X.ev[b].p || X.ev[a].t - X.ev[b].t);
          sT.setView([-0.7, Math.max(11.3, X.N - 0.3)], [-1, 1.2]);
          sT.line(-0.5, -0.45, X.N - 0.5, -0.45, { color: 'faint', width: 1.4 }); sT.text('total order', -0.6, -0.45, { align: 'right', size: 11, color: 'muted' });
          ord.forEach((id, i) => {
            const e = X.ev[id], c = PCOL[e.p];
            sT.rect(i - 0.43, -0.2, i + 0.43, 0.9, { fill: c, fillAlpha: id === sel ? 0.5 : 0.2, color: id === sel ? 'gold' : c, width: id === sel ? 2.6 : 1.4, radius: 4 });
            sT.text(evName(e), i, 0.62, { align: 'center', size: 11, color: 'ink' }); sT.text(String(X.lam[id]), i, 0.12, { align: 'center', size: 13, color: 'ink' });
          });
          let viol = 0, conc = 0, concLess = 0, causal = 0;
          for (let a = 0; a < X.N; a++) for (let b = 0; b < X.N; b++) if (a !== b) { if (X.hb(a, b)) { causal++; if (!(X.lam[a] < X.lam[b])) viol++; } else if (!X.hb(b, a) && a < b) { conc++; if (X.lam[a] !== X.lam[b]) concLess++; } }
          // is every arrow of the diagram rightwards in the total order?
          const pos = new Map(ord.map((id, i) => [id, i])); let back = 0;
          for (let a = 0; a < X.N; a++) for (let b = 0; b < X.N; b++) if (X.hb(a, b) && pos.get(a) > pos.get(b)) back++;
          info = { viol, conc, concLess, causal, back, ord };
        });
        v.readout(() => {
          const X = D.X, I = info, sel = D.sel[0];
          let l1 = 'Click an event to see how its stamp is computed.';
          if (sel != null) { const e = X.ev[sel], lp = e.prev >= 0 ? X.lam[e.prev] : 0; l1 = e.kind === 'recv' && rule.value === 'max' ? `$${evName(e)}$ is a receive: $C=\\max(${lp},${X.lam[X.msgs[e.m].s]})+1=${X.lam[sel]}$ (own counter, message stamp).` : e.kind === 'recv' ? `$${evName(e)}$ is a receive: broken rule $C=${lp}+1=${X.lam[sel]}$, the message stamp ${X.lam[X.msgs[e.m].s]} is ignored.` : `$${evName(e)}$ is a ${e.kind} event: $C=${lp}+1=${X.lam[sel]}$.`; }
          return `${l1}\nCausal pairs with $C(a)<C(b)$ violated: **${I.viol}** of ${I.causal} ${rule.value === 'max' ? '(the Clock Condition holds)' : '(the clock condition fails)'} · arrows pointing backwards in the total order: **${I.back}** · concurrent pairs with different stamps: ${I.concLess} of ${I.conc} (their order is arbitrary).`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Algorithm', name: 'Simulating a single state machine with logical time',
      statement: String.raw`Let every process hold a replica of the same deterministic state machine (here a counter, initially $1$, with operations $+k$, $-k$, $\times k$). A client request is stamped $(C,p)$ by Lamport clocks and broadcast; each receiver puts it in its queue and broadcasts an acknowledgement stamped with its own clock. A replica executes the queue's smallest request $(C,p)$ as soon as, for every other process $q$, it has received a message from $q$ stamped later than $(C,p)$. Over reliable FIFO channels without failures, all replicas then execute the same operations in the same order $\Rightarrow$ (3.2) and therefore stay in the same state, and every request is eventually executed.`,
      idea: String.raw`The stamps give every request the same place in the total order at every replica, so it is only necessary to avoid executing a request too early, before an earlier-stamped one arrives. Channels are FIFO and the stamps sent by a process increase, so a message from $q$ stamped later than $(C,p)$ is a promise that nothing from $q$ with a smaller stamp is still on its way. Acknowledgements make sure every process keeps sending such promises. When the promises of all processes are in, the minimal queued request is final and can be executed; progress follows because each request is acknowledged. The price is that every replica must hear from every process: one crashed process stalls everybody.`,
      caption: String.raw`Three replicas $P,Q,R$ and four requests. Lanes show requests (coloured, labelled with the operation) and acknowledgements (thin grey); the table lists, per replica, the operations in the order it executed them with the resulting value. In *timestamp order* every column is identical. Switch to *arrival order*, where a replica executes requests as they reach it, and the replicas disagree, because $+3$ and $\times 2$ do not commute. Change the delay spread or press *new delays*.`,
      deps: ['dist-3.2'], refs: ['Lynch §18.3.3'], tags: ['replication', 'state machine'],
      credit: 'Lamport, 1978; Schneider, 1990 (tutorial)',
      scope: String.raw`Reliable FIFO channels, no crashes (a crashed process blocks all progress); deterministic operations. Every process must be heard from before an operation executes, which is what makes the scheme slow and fragile compared with consensus-based replication.`,
      viz(v) {
        const mode = v.select('replicas execute in', [{ value: 'ts', label: 'timestamp order' }, { value: 'arrival', label: 'arrival order' }], 'ts');
        const spread = v.slider('delay spread', 0, 1, 0.5, { step: 0.05 });
        let seed = 1; v.button('new delays', () => { seed++; });
        const sL = v.stage({ x: [-1.2, 12], y: [-0.75, 2.8], axes: false, height: 290, full: true, title: 'requests and acknowledgements' });
        const sR = v.stage({ x: [0, 3], y: [-0.2, 5.4], axes: false, height: 235, full: true, title: 'the order in which each replica executed the operations (value after each)' });
        let R = null;
        const key = () => `${mode.value}|${spread.value}|${seed}`;
        let k0 = '';
        v.animate((t) => {
          if (k0 !== key()) { k0 = key(); R = runSM({ spread: spread.value, seed, mode: mode.value }); }
          const T = Math.max(8, Math.ceil(R.end + 0.5));
          sL.setView([-1.2, T + 0.3], [-0.75, 2.8]);
          for (let i = 0; i < 3; i++) { sL.line(0, 2 - i, T, 2 - i, { color: 'faint', width: 1.6 }); sL.text(NAMES[i], -0.25, 2 - i, { align: 'right', size: 14, color: 'ink' }); }
          for (const m of R.msgs) {
            if (m.ts > t) continue;
            const f = m.tr <= t ? 1 : (t - m.ts) / (m.tr - m.ts), x2 = m.ts + (m.tr - m.ts) * f, y1 = 2 - m.from, y2 = 2 - m.to, yy = y1 + (y2 - y1) * f;
            if (m.kind === 'req') { sL.line(m.ts, y1, x2, yy, { color: PCOL[m.req.id % 5], width: 2.6 }); if (f >= 1) sL.dot(m.tr, y2, { r: 3.5, color: PCOL[m.req.id % 5] }); }
            else sL.line(m.ts, y1, x2, yy, { color: 'muted', width: 1, alpha: 0.55 });
          }
          SM_OPS.forEach((op, i) => { if (op.t <= t) { sL.dot(op.t, 2 - op.p, { r: 7, color: PCOL[i % 5] }); sL.text(op.label, op.t, 2 - op.p, { align: 'center', baseline: 'bottom', dy: -10, size: 13, color: 'ink', halo: true }); } });
          for (let p = 0; p < 3; p++) for (const a of R.applied[p]) if (a.t <= t) sL.dot(a.t, 2 - p, { r: 4.5, color: 'green' });
          sL.vline(t, { color: 'gold', width: 1.4 });
          // tables
          for (let p = 0; p < 3; p++) {
            const x0 = p + 0.5; sR.text(`replica ${NAMES[p]}`, x0, 5.1, { align: 'center', size: 14, color: 'ink' });
            sR.text('start: 1', x0, 4.4, { align: 'center', size: 12.5, color: 'muted' });
            R.applied[p].filter((a) => a.t <= t).forEach((a, i) => sR.text(`${a.req.op.label}  →  ${a.val}`, x0, 3.6 - 0.75 * i, { align: 'center', size: 14, color: 'ink' }));
          }
        }, { period: 20, still: 19 });
        v.legend([['accent', 'request (coloured by operation)'], ['muted', 'acknowledgement'], ['green', 'replica executes an operation', { dot: true }]]);
        v.readout(() => {
          const x = R.x, same = x[0] === x[1] && x[1] === x[2];
          const seq = (p) => R.applied[p].map((a) => a.req.op.label).join(' ');
          const sameSeq = [1, 2].every((p) => seq(p) === seq(0));
          return `Final values: ${NAMES.map((n, p) => `$${n}{=}${x[p]}$`).join(', ')} — ${same ? '**all replicas agree**' : '**the replicas have diverged**'}; same execution order everywhere: ${sameSeq ? '**yes**' : '**no**'}.\nOrders: ${NAMES.map((n, p) => `${n}: ${seq(p)}`).join(' · ')}. Messages: ${R.msgs.filter((m) => m.kind === 'req').length} requests, ${R.msgs.filter((m) => m.kind === 'ack').length} acknowledgements.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Algorithm', name: 'Vector clocks',
      statement: String.raw`In a system of $n$ processes every process $p_i$ keeps a vector $V\in\mathbb N^n$, initially all zeros. Before each event $p_i$ increments its own component, $V[i]:=V[i]+1$; a sent message carries the vector $V$ of its send event. On receipt of a message with vector $W$, $p_i$ first sets $V:=\max(V,W)$ componentwise and then increments $V[i]$. The event is stamped with the resulting $V$. Then $V(e)[j]$ is the number of events of process $j$ that are at or before $e$ in the order $\to$ (3.1): the vector is the size of the causal past of $e$ at each process.`,
      idea: String.raw`Component $i$ of a vector only grows through two mechanisms: $p_i$ counts its own events, and every other component is copied from a message, so it can only be a count of $p_j$'s events that a chain of messages has really brought to $p_i$. Merging with the componentwise maximum on receipt is what makes a chain transitive: whatever the sender knew, the receiver now knows. A Lamport clock squeezes this knowledge into one number and loses the distinction between "before" and "concurrent"; the vector keeps one counter per process and loses nothing (3.5).`,
      caption: String.raw`Each event is labelled with its vector $[V_P,V_Q,V_R]$. Click an event: the events of its causal past are ringed in the colour of their process, and the readout shows that the number of ringed events of each colour (counting the event itself) is exactly the corresponding component. Edit the execution as in 3.1 and watch every vector recompute; at a receive the readout shows the componentwise maximum and the increment.`,
      deps: ['dist-3.1'], refs: ['Attiya–Welch ch. 6'], tags: ['vector clocks', 'causality'],
      credit: 'Fidge, 1988; Mattern, 1989 (independently)',
      scope: String.raw`Reliable messages; the vector has one entry for each process in the system, so it grows with $n$ and the set of processes is fixed in advance.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vector_clock' },
      viz(v) {
        const D = diagram(v, { height: 300, one: true });
        let info = null;
        v.render(() => {
          const X = D.build(), n = X.n, sel = D.sel[0];
          const inPast = (e) => sel != null && (e.id === sel || X.hb(e.id, sel));
          D.draw({
            label: (e) => vecStr(X.vec[e.id]), labelSize: 11.5, localHollow: false,
            dotColor: (e) => (sel != null && !inPast(e) ? 'faint' : PCOL[e.p]),
            ring: (e) => (e.id === sel ? 'gold' : inPast(e) ? PCOL[e.p] : null),
            msgColor: (m) => (sel != null && !(X.hb(m.r, sel) || m.r === sel) ? 'faint' : 'accent'),
          });
          const cnt = new Array(n).fill(0); if (sel != null) for (const e of X.ev) if (inPast(e)) cnt[e.p]++;
          info = { cnt };
        });
        v.readout(() => {
          const X = D.X, sel = D.sel[0];
          if (sel == null) return 'Click an event to ring its causal past. Rule: on a receive, $V:=\\max(V,W)$ componentwise, then every event adds 1 to its own component.';
          const e = X.ev[sel], V = X.vec[sel], own = e.prev >= 0 ? X.vec[e.prev] : new Array(X.n).fill(0);
          const how = e.kind === 'recv' ? `receive: $\\max(${vecStr(own)},${vecStr(X.vec[X.msgs[e.m].s])})=${vecStr(own.map((x, i) => Math.max(x, X.vec[X.msgs[e.m].s][i])))}$, then $+1$ at ${NAMES[e.p]}` : `${e.kind} event: ${vecStr(own)} with $+1$ at ${NAMES[e.p]}`;
          const ok = info.cnt.every((c, i) => c === V[i]);
          return `$${evName(e)}$ — ${how} $\\Rightarrow V=${vecStr(V)}$.\nEvents in its causal past, per process: $${vecStr(info.cnt)}$ ${ok ? '— equal to $V$ ✓' : '— differs from $V$ ✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Vector clocks characterize causality',
      statement: String.raw`Let $V(e)$ be the vector clock stamp of event $e$ (3.4) in any execution. For distinct events $a,b$: $$a\to b\iff V(a)\le V(b)\ \text{componentwise}$$ (and then $V(a)\ne V(b)$). Consequently $a\parallel b$ exactly when $V(a)$ and $V(b)$ are incomparable, and it suffices to compare one coordinate: if $a$ occurred at process $i$, then $a\to b$ iff $V(a)[i]\le V(b)[i]$ (for $a\ne b$). Lamport stamps (3.2) satisfy only the implication $a\to b\Rightarrow C(a)<C(b)$.`,
      idea: String.raw`($\Rightarrow$) Along every step of a chain each vector can only grow componentwise, since a process increments its own entry and a receive takes a maximum; so $a\to b$ gives $V(a)\le V(b)$. ($\Leftarrow$) If $a$ is the $k$-th event of process $i$, then $V(a)[i]=k$. If $V(b)[i]\ge k$ and $b\neq a$, the count of $i$'s events known at $b$ reached $b$ only by being copied along messages from $i$ itself, where it was produced by $i$'s own increments; hence $a$, the $k$-th event of $i$, lies on a chain to $b$. So one comparison of a single coordinate decides causality, which is what Lamport clocks cannot do.`,
      caption: String.raw`The grid has one cell per ordered pair $(a,b)$ of events (rows $a$, columns $b$, in time order); the clock under test is used to *predict* "$a\to b$" and the prediction is compared with an honest path search in the diagram. Green: both say yes; grey: both say no; red: the clock claims an order that does not exist; orange: a real order the clock misses. With vector clocks there is no red or orange cell on any execution you build. Switch to Lamport clocks, or to vector clocks that skip the merge, and the theorem fails visibly. Click a cell or two events to compare their vectors.`,
      deps: ['dist-3.4'], refs: ['Attiya–Welch ch. 6'], tags: ['vector clocks', 'causality'],
      credit: 'Fidge, 1988; Mattern, 1989',
      scope: String.raw`Holds for the vector clock rules exactly as stated, in every execution with reliable messages. For Lamport clocks only the forward implication holds; the "no merge" variant is deliberately wrong.`,
      viz(v) {
        const D = diagram(v, { height: 270 });
        const clk = v.select('clock under test', [{ value: 'vec', label: 'vector clocks' }, { value: 'lam', label: 'Lamport clocks' }, { value: 'own', label: 'vectors without the merge' }], 'vec');
        const sM = v.stage({ x: [-1.6, 12], y: [-0.2, 12.9], axes: false, equal: true, height: 360, full: true, title: 'does the clock predict a → b ?  (row a, column b)' });
        let info = null;
        sM.onClick((x, y) => { const X = D.X, b = Math.round(x), a = X.N - 1 - Math.round(y); if (a >= 0 && b >= 0 && a < X.N && b < X.N) D.sel = [a, b]; });
        v.render(() => {
          D.opts = { vector: clk.value === 'own' ? 'own' : 'merge' };
          const X = D.build(), N = X.N, [pa, pb] = D.sel;
          const claim = (a, b) => (clk.value === 'lam' ? X.lam[a] < X.lam[b] : vecLess(X.vec[a], X.vec[b]));
          D.draw({ label: (e) => (clk.value === 'lam' ? X.lam[e.id] : vecStr(X.vec[e.id])), labelSize: 11, localHollow: false, ring: (e) => (e.id === pa ? 'gold' : e.id === pb ? 'orange' : null), dotColor: (e) => PCOL[e.p] });
          sM.setView([-1.9, N + 0.2], [-0.3, N + 0.9]);
          let fp = 0, miss = 0, agree = 0;
          for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
            const x = b, y = N - 1 - a;
            if (a === b) { sM.rect(x - 0.45, y - 0.45, x + 0.45, y + 0.45, { fill: 'faint', fillAlpha: 0.25, stroke: false }); continue; }
            const t = X.hb(a, b), c = claim(a, b);
            const col = t && c ? 'green' : !t && c ? 'red' : t && !c ? 'orange' : 'faint';
            if (t !== c) { if (c) fp++; else miss++; } else agree++;
            sM.rect(x - 0.45, y - 0.45, x + 0.45, y + 0.45, { fill: col, fillAlpha: col === 'faint' ? 0.16 : 0.62, stroke: false });
          }
          for (let i = 0; i < N; i++) { const nm = evName(X.ev[i]); sM.text(nm, -0.7, N - 1 - i, { align: 'right', size: 11, color: PCOL[X.ev[i].p] }); sM.text(nm, i, N + 0.2, { align: 'center', size: 11, color: PCOL[X.ev[i].p] }); }
          if (pa != null && pb != null) sM.rect(pb - 0.47, N - 1 - pa - 0.47, pb + 0.47, N - 1 - pa + 0.47, { color: 'gold', width: 3 });
          info = { fp, miss, agree, N };
        });
        v.legend([['green', 'a → b, predicted', { area: true }], ['faint', 'not ordered, not predicted', { area: true }], ['red', 'predicted but not causal', { area: true }], ['orange', 'causal but missed', { area: true }]]);
        v.readout(() => {
          const X = D.X, I = info, [a, b] = D.sel;
          const name = clk.value === 'vec' ? 'vector clocks' : clk.value === 'lam' ? 'Lamport clocks' : 'vector clocks without the merge';
          let l1 = `${name}: **${I.fp}** false orderings, **${I.miss}** missed orders, over ${I.N * (I.N - 1)} ordered pairs.`;
          if (a != null && b != null && a !== b) {
            const A = X.ev[a], B = X.ev[b], r = relation(X, a, b), va = X.vec[a], vb = X.vec[b];
            const cmp = clk.value === 'lam' ? `$C(${evName(A)})=${X.lam[a]}$, $C(${evName(B)})=${X.lam[b]}$` : `$V(${evName(A)})=${vecStr(va)}$, $V(${evName(B)})=${vecStr(vb)}$`;
            l1 += `\n${cmp}; the one-coordinate test: $V(${evName(A)})[${NAMES[A.p]}]=${va[A.p]}$ ${va[A.p] <= vb[A.p] ? '≤' : '>'} $V(${evName(B)})[${NAMES[A.p]}]=${vb[A.p]}$; the diagram says ${r === 'before' ? `$${evName(A)}\\to ${evName(B)}$` : r === 'after' ? `$${evName(B)}\\to ${evName(A)}$` : `$${evName(A)}\\parallel ${evName(B)}$`}.`;
          } else l1 += '\nClick a cell of the grid, or two events of the diagram, to compare a pair.';
          return l1;
        });
      },
    },
  ],
};

