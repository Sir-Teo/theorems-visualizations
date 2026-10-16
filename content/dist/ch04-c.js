// Distributed Computing — Chapter 4, part c: items 4.9–4.12 (sequential consistency, atomic snapshots, ABD, majority bound)
import { range, hash01, histViz, checkHistory, drawHistory, drawLanes, drawMsg, ly, opLabel, clamp } from './ch04.shared.js';

const op = (p, kind, val, s, e, reg = 'x') => ({ p, kind, val, s, e, reg });

// ---------------------------------------------------------------------------------------------- 4.10: atomic snapshots (generators replayed from the schedule)
const NS = 3;
function simSnap(full, sched) {
  const sh = { R: range(NS).map(() => ({ v: 0, seq: 0, view: [0, 0, 0] })) };
  const mem = [[0, 0, 0]], scans = [], reads = []; let t = 0;
  function* collect(rec, who) { const c = []; for (let j = 0; j < NS; j++) { yield; if (rec && rec.start == null) rec.start = t; if (who === 0) reads.push([t, j]); c.push({ ...sh.R[j] }); } return c; }
  function* scan(rec, who) {
    const moved = Array(NS).fill(0); let a = yield* collect(rec, who); rec.collects = 1;
    for (;;) {
      const b = yield* collect(rec, who); rec.collects++; let same = true;
      for (let j = 0; j < NS; j++) if (a[j].seq !== b[j].seq) { same = false; moved[j]++; if (full && moved[j] >= 2) return { view: b[j].view.slice(), how: `borrowed from U${j + 1}, which moved twice` }; }
      if (same) return { view: b.map((x) => x.v), how: 'two equal collects' };
      a = b;
    }
  }
  function* scanner() { for (;;) { const rec = { start: null, collects: 0, end: null }; scans.push(rec); const r = yield* scan(rec, 0); rec.end = t; rec.view = r.view; rec.how = r.how; } }
  function* updater(i) { for (let k = 1; ; k++) { let view = null; if (full) view = (yield* scan({ start: null, collects: 0 }, i + 1)).view; yield; sh.R[i] = { v: i * 10 + k, seq: sh.R[i].seq + 1, view }; } }
  const g = [scanner(), updater(0), updater(1), updater(2)]; g.forEach((x) => x.next());
  for (const p of sched) { t++; g[p].next(); mem.push(sh.R.map((r) => r.v)); }
  return { mem, scans, reads, t };
}

// ---------------------------------------------------------------------------------------------- 4.11: ABD simulation
function runABD({ n = 5, crashed = 0, seed = 1, spread = 1, writeBack = true, ops }) {
  const alive = (p) => p < n - crashed, maj = Math.floor(n / 2) + 1;
  const q = [], msgs = []; let kk = 0, wts = 0;
  const push = (e) => { e.k = kk++; q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const rep = range(n).map(() => ({ ts: 0, val: 0 })), res = ops.map((o) => ({ ...o, s: o.t, e: null, ret: null, phase: 0, got: [], acks: 0, id: 0 }));
  const send = (from, to, t, kind, payload, opi) => {
    if (!alive(from) || !alive(to)) return;
    const d = from === to ? 0.02 : 0.3 + spread * hash01(seed, from, to, msgs.length);
    if (from !== to) msgs.push({ from, ts: t, to, tr: t + d, kind });
    push({ t: t + d, type: 'recv', from, to, kind, payload, opi });
  };
  res.forEach((o, i) => { if (alive(o.p)) push({ t: o.t, type: 'start', opi: i }); });
  while (q.length) {
    const e = q.shift(), o = res[e.opi];
    if (e.type === 'start') {
      if (o.kind === 'w') { o.wts = ++wts; o.phase = 2; for (let j = 0; j < n; j++) send(o.p, j, e.t, 'W', { ts: o.wts, val: o.val }, e.opi); }
      else { o.phase = 1; for (let j = 0; j < n; j++) send(o.p, j, e.t, 'Q', null, e.opi); }
    } else if (e.kind === 'Q') send(e.to, e.from, e.t, 'QR', { ...rep[e.to] }, e.opi);
    else if (e.kind === 'W') { if (e.payload.ts > rep[e.to].ts) rep[e.to] = { ...e.payload }; send(e.to, e.from, e.t, 'A', null, e.opi); }
    else if (e.kind === 'QR' && o.phase === 1) {
      o.got.push(e.payload);
      if (o.got.length === maj) {
        const best = o.got.reduce((a, b) => (b.ts > a.ts ? b : a)); o.ret = best.val;
        if (writeBack) { o.phase = 2; o.acks = 0; for (let j = 0; j < n; j++) send(o.p, j, e.t, 'W', best, e.opi); } else { o.phase = 3; o.e = e.t; }
      }
    } else if (e.kind === 'A' && o.phase === 2) { o.acks++; if (o.acks === maj) { o.phase = 3; o.e = e.t; } }
  }
  return { msgs, ops: res, maj, n };
}
const abdHistory = (R) => R.ops.filter((o) => o.s != null && (o.e != null || o.kind === 'w') && !(o.kind === 'w' && o.e == null && false)).map((o) => ({ p: o.p, kind: o.kind, val: o.kind === 'w' ? o.val : o.ret, s: o.s, e: o.e == null ? 1e9 : o.e, reg: 'x' }));

export default {
  collection: 'dist',
  chapter: 4,
  items: [
    {
      num: '4.9', kind: 'Definition', name: 'Sequential consistency',
      statement: String.raw`A history of a shared object is *sequentially consistent* if there is a total order of all its operations that is legal for the object's sequential specification (each read returns the latest preceding write to the same register, initially 0) and that preserves the program order of every process. Unlike linearizability (4.8) it does not have to respect the real-time order of operations of *different* processes. Every linearizable history is sequentially consistent, but not conversely, and sequential consistency is not local: two objects, each sequentially consistent on its own, can be inconsistent together.`,
      idea: String.raw`Lamport's definition describes a multiprocessor that behaves as if all processors' operations were interleaved in one sequence, each processor's own operations in the order its program issued them, but with no promise about how that sequence relates to the clock. That permissive reading is what makes caches and store buffers legal, and also what makes composition fail: the legal order for register $x$ alone and the legal order for register $y$ alone may contradict each other once program order links them. The checker is the one of 4.8 with the real-time constraint replaced by program order.`,
      caption: String.raw`Same editor as 4.8 (drag interval ends, click an operation to change its value), now with two verdicts. In *stale read* and *new then old* the history is sequentially consistent, with the order shown as purple numbers, but not linearizable: the red arrow marks an operation that finished in real time before another began and yet is placed after it. *Store buffering* uses two registers: each register alone is sequentially consistent (see the readout), the pair is not, which is the non-locality.`,
      deps: ['dist-4.8'], refs: ['Attiya–Welch ch. 9'], tags: ['consistency models', 'sequential consistency'],
      scope: String.raw`Read/write registers with initial value 0; each process issues one operation at a time. The histories are small illustrative examples that the search checks, not traces of a real machine.`,
      credit: 'Lamport, 1979', links: { doi: 'https://doi.org/10.1109/TC.1979.1675439', wikipedia: 'https://en.wikipedia.org/wiki/Sequential_consistency' },
      viz(v) {
        const presets = [
          { value: 'stale', label: 'stale read', nProc: 2, ops: [op(0, 'w', 1, 0.5, 3), op(1, 'r', 0, 4, 6)] },
          { value: 'newold', label: 'new then old (two readers)', nProc: 3, ops: [op(0, 'w', 1, 0, 5), op(1, 'r', 1, 1, 2), op(2, 'r', 0, 3, 4)] },
          { value: 'sb', label: 'store buffering (two registers)', nProc: 2, ops: [op(0, 'w', 1, 0.5, 2.5, 'x'), op(0, 'r', 0, 3, 5, 'y'), op(1, 'w', 1, 0.5, 2.5, 'y'), op(1, 'r', 0, 3, 5, 'x')] },
          { value: 'inv', label: 'one reader sees new, then old', nProc: 2, ops: [op(0, 'w', 1, 0.5, 9), op(1, 'r', 1, 1, 3), op(1, 'r', 0, 4, 6)] },
          { value: 'ok', label: 'fine for both', nProc: 2, ops: [op(0, 'w', 1, 1, 3), op(1, 'r', 1, 4, 6)] },
        ];
        const H = histViz(v, { presets, mode: 'sc' });
        v.readout(() => {
          const ops = H.st.ops, regs = [...new Set(ops.map((o) => o.reg))];
          const proj = regs.length > 1 ? ` Each register on its own: ${regs.map((r) => `${r}: ${checkHistory(ops.filter((o) => o.reg === r), 'sc').ok ? 'sequentially consistent' : 'not'}`).join(', ')}.` : '';
          return H.text() + proj;
        });
      },
    },
    {
      num: '4.10', kind: 'Algorithm', name: 'Wait-free atomic snapshots',
      statement: String.raw`Several processes each own one single-writer register; an *atomic snapshot object* offers $\mathrm{update}_i(v)$ (write to one's own component) and $\mathrm{scan}()$ (return all components as of a single instant). It can be implemented wait-free from single-writer read/write registers (Afek et al.): each register holds the value, a sequence number and the *view* returned by the writer's own embedded scan. A scan collects all registers repeatedly; if two successive collects are identical it returns their values, and if some process is seen to move twice during the scan it returns the view stored in that process's latest register. Every scan finishes after at most $2n-1$ collects of $n$ registers, and every returned view is the content of the registers at some instant during the scan.`,
      idea: String.raw`Two equal collects prove that nothing changed in between, so the values existed together at any instant between them (the double collect of 4.8's linearization idea). The trouble is starvation: updaters can change something before every second collect forever. The remedy is cooperation. An update first performs a scan and writes the view along with its value. If a scanner sees process $j$ move twice, then a whole update of $j$, including its embedded scan, started and finished inside the scanner's interval, so that stored view is a legal instant of the scanner's interval too. Each of the other $n-1$ processes can foil a collect at most twice, which bounds the number of collects.`,
      caption: String.raw`Three register lanes (values over time), the scanner S below, and three updaters U1–U3 that update their registers in a loop. Step the processes by hand, or let the *adversary* interleave one scanner step with one step of each updater in turn. With *double collect only* (no embedded views) the scan never returns: the counter of collects keeps growing. With *embedded views* the same schedule returns after a few collects, sometimes by borrowing a view (the how-line says which); the green dot is an instant at which the registers really held the returned view.`,
      deps: ['dist-4.8'], refs: ['Lynch §13.3'], tags: ['snapshots', 'wait-free'],
      scope: String.raw`Asynchronous shared memory with atomic single-writer multi-reader registers, any number of crashes (wait-freedom). The sequence numbers grow without bound; the pictures show one scanner and three updaters.`,
      credit: 'Afek, Attiya, Dolev, Gafni, Merritt & Shavit, 1993', links: { doi: 'https://doi.org/10.1145/153724.153741' },
      viz(v) {
        const algo = v.select('scan', [{ value: 'naive', label: 'double collect only' }, { value: 'full', label: 'with embedded views' }], 'naive');
        const sched = range(120).map((k) => k % 4);
        const lab = ['S', 'U1', 'U2', 'U3'];
        range(4).forEach((p) => v.button(`step ${lab[p]}`, () => sched.push(p)));
        v.button('adversary ×120', () => { for (let k = 0; k < 120; k++) sched.push(k % 4); });
        v.button('random ×40', () => { const base = sched.length; for (let k = 0; k < 40; k++) sched.push(Math.floor(hash01(base, k, 7) * 4)); });
        v.button('reset', () => { sched.length = 0; });
        const s = v.stage({ x: [-3, 40], y: [-0.7, 4.3], axes: false, height: 330, full: true, title: 'registers over time (one column per step) and the scans' });
        let R = null;
        v.render(() => {
          R = simSnap(algo.value === 'full', sched);
          const X1 = Math.max(36, R.t + 1);
          s.setView([-3, X1], [-0.7, 4.3]);
          const yR = (j) => 3 - j;
          ['R1', 'R2', 'R3'].forEach((nm, j) => { s.text(nm, -0.4, yR(j), { align: 'right', size: 13, color: 'ink' }); s.line(0, yR(j), X1, yR(j), { color: 'grid', width: 1 }); });
          s.text('S', -0.4, 0, { align: 'right', size: 13, color: 'ink' });
          for (let j = 0; j < NS; j++) {
            let st = 0;
            for (let k = 1; k <= R.t + 1; k++) {
              if (k > R.t || R.mem[k][j] !== R.mem[st][j]) {
                const val = R.mem[st][j], col = val === 0 ? 'faint' : 'accent';
                s.rect(st, yR(j) - 0.28, k, yR(j) + 0.28, { fill: col, fillAlpha: val === 0 ? 0.25 : 0.4, color: col, width: 1, radius: 2 });
                if (k - st >= 3) s.text(String(val), (st + k) / 2, yR(j), { align: 'center', size: 11.5, color: 'ink' });
                st = k;
              }
            }
          }
          R.reads.forEach(([t, j]) => s.dot(t - 0.5, 0.0, { r: 2.2, color: 'orange' }));
          R.scans.forEach((c) => {
            if (c.start == null) return;
            const x0 = c.start - 1, x1 = c.end == null ? R.t : c.end;
            s.rect(x0, -0.3, x1, 0.3, { fill: 'orange', fillAlpha: c.end == null ? 0.1 : 0.25, color: 'orange', width: 1.4, dash: c.end == null ? [4, 3] : undefined, radius: 3 });
            if (c.end != null) {
              s.text(`[${c.view.join(', ')}]`, (x0 + x1) / 2, -0.55, { align: 'center', size: 11, color: 'ink' });
              let m = -1; for (let k = c.start - 1; k <= c.end; k++) if (R.mem[k].join() === c.view.join()) { m = k; break; }
              c.match = m;
              if (m >= 0) { s.line(m, 0.4, m, 3.3, { color: 'green', width: 1.8, dash: [4, 3] }); s.dot(m, 0, { r: 5, color: 'green' }); }
              else s.text('✕ no instant', x1, 0.5, { color: 'red', size: 12 });
            }
          });
        });
        v.legend([['orange', 'scanner reads / scan interval'], ['accent', 'register value written'], ['green', 'instant matching the returned view']]);
        v.readout(() => {
          const done = R.scans.filter((c) => c.end != null), last = R.scans[R.scans.length - 1];
          const ok = done.filter((c) => c.match >= 0).length, mx = Math.max(0, ...done.map((c) => c.collects));
          const pend = last && last.end == null && last.start != null ? ` The current scan has made **${last.collects}** collect${last.collects === 1 ? '' : 's'} (${last.collects * NS} reads) and has not returned${algo.value === 'naive' && last.collects > 5 ? ': starved by the updaters' : ''}.` : '';
          return `Step ${R.t}. Scans returned: **${done.length}**, of which ${ok} show a view that the registers held at one instant of the scan. Most collects in one returned scan: ${mx} (the bound for ${NS} updaters is $2\\cdot${NS}+1=${2 * NS + 1}$).${pend}\n${done.length ? 'Latest: ' + `[${done[done.length - 1].view.join(', ')}] by ${done[done.length - 1].how}.` : 'Press *adversary ×120* to run an interleaving that tries to starve the scanner.'}`;
        });
      },
    },
    {
      num: '4.11', kind: 'Algorithm', name: 'ABD: atomic registers over message passing',
      statement: String.raw`In a system of $n$ message-passing processes of which fewer than $n/2$ may crash, a single-writer multi-reader atomic (linearizable) register can be emulated: every process stores a pair (timestamp, value). A **write** increments the timestamp, sends the pair to all and finishes after acknowledgements from a majority. A **read** (1) asks all processes for their pairs and waits for a majority of replies, takes the pair with the largest timestamp, (2) writes that pair back to all and waits for a majority of acknowledgements, and then returns the value. All operations of correct processes terminate and every history is linearizable.`,
      idea: String.raw`Any two majorities intersect, so a read's first phase meets at least one process that has seen every earlier completed write, and it finds a timestamp at least as large. The write-back makes the value it is about to return also visible to a majority before the read returns, so every later read, whose majority intersects that one, cannot return anything older; without the write-back a later read could return an older value (new-old inversion, as in 4.8). Majorities replace waiting for everyone, so up to $\lfloor (n-1)/2\rfloor$ crashes are harmless (4.12 shows this cannot be improved).`,
      caption: String.raw`Five processes, one writer (P0) and readers; bars are operations, arrows are messages (every operation uses two or four phases of $n$ messages). *Crashed processes* removes the last ones: with two crashes everything still completes, with three no operation can collect a majority and stays pending (dashed). The verdict below runs the checker of 4.8 on the produced history. Switch off the *write-back* and press *find a bad seed*: the simulator searches the seeded delay patterns for one in which the history is no longer linearizable.`,
      deps: ['dist-4.8', 'dist-1.3'], refs: ['Lynch §17.1.3', 'Attiya–Welch ch. 10'], tags: ['register emulation', 'quorums'],
      scope: String.raw`Single writer, crash failures of a minority, reliable asynchronous channels. The delays are seeded pseudo-random; the checker covers the operations that finished (pending writes are kept as possibly taking effect).`,
      credit: 'Attiya, Bar-Noy & Dolev, 1995', links: { doi: 'https://doi.org/10.1145/200836.200869' },
      viz(v) {
        const crash = v.select('crashed processes', [0, 1, 2, 3].map((c) => ({ value: c, label: String(c) })), 0);
        const wb = v.toggle('read write-back', true);
        const spread = v.slider('delay spread', 0, 4, 1.6, { step: 0.1 });
        let seed = 1; v.button('new delays', () => { seed++; });
        const opsDef = [{ p: 0, kind: 'w', val: 1, t: 1 }, { p: 1, kind: 'r', t: 1.6 }, { p: 2, kind: 'r', t: 3.5 }, { p: 1, kind: 'r', t: 6 }, { p: 0, kind: 'w', val: 2, t: 7 }, { p: 3, kind: 'r', t: 8.2 }, { p: 2, kind: 'r', t: 9.5 }];
        const lin = (sd) => { const R = runABD({ crashed: crash.value, seed: sd, spread: spread.value, writeBack: wb.value, ops: opsDef }); return { R, ok: checkHistory(abdHistory(R), 'lin').ok }; };
        const bad = v.button('find a bad seed', () => { for (let k = 1; k < 3000; k++) { if (!lin(k).ok) { seed = k; return; } } });
        const s = v.stage({ x: [-0.9, 16], y: [-0.7, 4.7], axes: false, height: 340, full: true, title: 'five processes; each is a replica, and some also run client operations' });
        let cur = null;
        v.render(() => {
          bad.hidden = wb.value;
          const { R, ok } = lin(seed); cur = { R, ok };
          drawLanes(s, 5, 16, { names: range(5).map((i) => `P${i}`), deadAt: range(5).map((i) => (i >= 5 - crash.value ? 0.02 : null)) });
          R.msgs.forEach((m) => drawMsg(s, 5, m, { color: m.kind === 'Q' || m.kind === 'W' ? 'accent' : 'green', width: 0.9, label: false }));
          R.ops.forEach((o) => {
            if (o.p >= 5 - crash.value) return;
            const y = ly(o.p, 5), pend = o.e == null;
            s.rect(o.s, y - 0.2, pend ? 16 : o.e, y + 0.2, { fill: o.kind === 'w' ? 'gold' : 'orange', fillAlpha: pend ? 0.12 : 0.5, color: o.kind === 'w' ? 'gold' : 'orange', width: 1.8, dash: pend ? [5, 4] : undefined, radius: 4 });
            s.text(o.kind === 'w' ? `W(${o.val})` : pend ? 'R…' : `R→${o.ret}`, o.s + 0.1, y + 0.03, { align: 'left', size: 12, color: 'ink', halo: true });
          });
          s.corner(ok ? 'history linearizable' : 'NOT linearizable', 'tr', { color: ok ? 'green' : 'red', weight: 700, plate: true });
        });
        v.legend([['accent', 'query / write messages'], ['green', 'replies / acknowledgements'], ['gold', 'write'], ['orange', 'read']]);
        v.readout(() => {
          const { R, ok } = cur, done = R.ops.filter((o) => o.e != null).length, tot = R.ops.filter((o) => o.p < 5 - crash.value).length;
          return `Seed ${seed}: ${done} of ${tot} operations at live processes finished (majority = ${R.maj} of ${R.n}; ${crash.value} crashed, ${5 - crash.value} alive). Messages sent: ${R.msgs.length}. The history of finished operations is **${ok ? 'linearizable' : 'not linearizable'}**.${done < tot ? ' The pending operations cannot collect a majority of replies.' : ''}\nReturned values: ${R.ops.filter((o) => o.kind === 'r' && o.e != null).map((o) => `P${o.p}@${o.t}→${o.ret}`).join(', ') || 'none'}.`;
        });
      },
    },
    {
      num: '4.12', kind: 'Theorem', name: 'Register emulation needs a correct majority',
      statement: String.raw`Suppose $n$ message-passing processes, up to $f$ of which may crash, emulate a single-writer atomic register so that every operation of a non-crashed process eventually terminates. Then $n>2f$. If $n\le 2f$ the processes can be split into two groups of size at most $f$ each, and for every implementation there is an execution in which a read that starts after a write has finished still returns the old value.`,
      idea: String.raw`An indistinguishability argument (1.7). Let $A$ and $B$ be the two groups. In execution $E_1$ the processes of $B$ crash at the start (allowed, since $|B|\le f$): a write by a process in $A$ must still finish, using only $A$. In $E_2$, $A$ crashes instead and a read by a process in $B$ must finish, using only $B$. Combine them: let $A$ write while all messages between $A$ and $B$ are delayed (asynchrony allows it), then let a process in $B$ read, still with those messages delayed. The reader's view is identical to that in $E_2$, so it returns the initial value, although the write had completed: no linearization exists. With $n>2f$ any two sets of $n-f$ processes intersect, which is exactly what ABD (4.11) uses.`,
      caption: String.raw`Pick $n$ and the number $f$ of crashes to survive; each operation then waits for $n-f$ replies. Choose who the $n-f$ responders of the write and of the read are with *edit write quorum* / *edit read quorum* and click replicas (gold ring: acknowledged the write; blue ring: answered the read). If the two sets are disjoint, which is possible exactly when $n\le 2f$, the read misses the write: the history on the right is not linearizable. The table shows the region $n>2f$.`,
      deps: ['dist-4.11', 'dist-1.7'], refs: ['Lynch §17.1.4'], tags: ['impossibility', 'quorums'],
      scope: String.raw`Asynchronous message passing with crash failures; the bound is for emulations that tolerate $f$ crashes with no further assumptions (with failure detectors or synchrony the situation changes). The bound is tight: ABD achieves $n>2f$.`,
      credit: 'Attiya, Bar-Noy & Dolev, 1995', links: { doi: 'https://doi.org/10.1145/200836.200869' },
      viz(v) {
        const nS = v.slider('processes $n$', 3, 9, 5, { int: true, onChange: () => init() });
        const fS = v.slider('crashes tolerated $f$', 0, 8, 3, { int: true, onChange: () => init() });
        const mode = v.select('click edits', [{ value: 'w', label: 'write quorum' }, { value: 'r', label: 'read quorum' }], 'w');
        let W = [], Rq = [];
        const qn = () => Math.max(1, nS.value - Math.min(fS.value, nS.value - 1));
        const init = () => { const q = qn(), n = nS.value; W = range(q); Rq = range(n).slice(n - q); };
        init();
        v.button('make them as disjoint as possible', init);
        const sA = v.stage({ x: [-0.8, 9.2], y: [-1.6, 2.2], axes: false, height: 250, weight: 1.15, minWidth: 340, title: 'replicas: who answered the write and who answers the read' });
        const sB = v.stage({ x: [-2.4, 10.2], y: [-0.7, 2.0], axes: false, height: 250, weight: 1, minWidth: 300, title: 'the resulting history' });
        const sC = v.stage({ x: [0.5, 9.5], y: [-1.4, 8.8], axes: false, height: 270, full: true, title: 'n > 2f: possible (green) or impossible (red)' });
        sA.onClick((x) => {
          const i = Math.round(x); if (i < 0 || i >= nS.value) return;
          const L = mode.value === 'w' ? W : Rq, q = qn();
          if (L.includes(i)) L.splice(L.indexOf(i), 1); else { L.push(i); if (L.length > q) L.shift(); }
        });
        let info = null;
        v.render(() => {
          const n = nS.value, f = Math.min(fS.value, n - 1), q = qn();
          W = W.filter((i) => i < n); Rq = Rq.filter((i) => i < n);
          sA.setView([-0.8, Math.max(n - 0.2, 4)], [-1.6, 2.2]);
          const val = (i) => (W.includes(i) ? 1 : 0);
          for (let i = 0; i < n; i++) {
            const inW = W.includes(i), inR = Rq.includes(i);
            if (inW) sA.dot(i, 0.5, { r: 26, hollow: true, color: 'gold', width: 3.2 });
            if (inR) sA.dot(i, 0.5, { r: 21, hollow: true, color: 'accent', width: 3.2 });
            sA.dot(i, 0.5, { r: 14, color: val(i) ? 'green' : 'faint' });
            sA.text(`${val(i)}`, i, 0.5, { align: 'center', size: 13, color: 'ink', halo: false });
            sA.text(`P${i}`, i, -0.35, { align: 'center', size: 12, color: 'muted' });
          }
          sA.text(`waits for n − f = ${q} replies (write ${W.length}/${q}, read ${Rq.length}/${q})`, -0.6, 1.7, { align: 'left', size: 11.5, color: 'muted' });
          const inter = W.filter((i) => Rq.includes(i)), full = W.length === q && Rq.length === q;
          const ret = Rq.length ? Math.max(...Rq.map(val)) : 0;
          const ops = [op(0, 'w', 1, 0.5, 3), op(1, 'r', ret, 4, 6)];
          const ok = checkHistory(ops, 'lin').ok;
          sB.setView([-2.4, 10.2], [-0.7, 1.9]);
          drawHistory(sB, ops, 2, 10, { names: ['writer', 'reader'], color: (k) => (k === 1 ? (ok ? 'orange' : 'red') : 'accent') });
          sB.corner(ok ? 'linearizable' : 'not linearizable', 'tr', { color: ok ? 'green' : 'red', weight: 700, plate: true });
          sC.setView([0.5, 9.5], [-1.4, 8.8]);
          for (let nn = 1; nn <= 9; nn++) for (let ff = 0; ff <= 8; ff++) {
            if (ff >= nn) continue;
            const good = nn > 2 * ff, cur = nn === n && ff === f;
            sC.rect(nn - 0.45, ff - 0.45, nn + 0.45, ff + 0.45, { fill: good ? 'green' : 'red', fillAlpha: good ? 0.3 : 0.28, color: cur ? 'ink' : good ? 'green' : 'red', width: cur ? 3 : 0.8, radius: 2 });
          }
          for (let nn = 1; nn <= 9; nn++) sC.text(String(nn), nn, -0.95, { align: 'center', size: 11, color: 'muted' });
          sC.text('n (processes), f (crashes tolerated) up the side', 5, 8.5, { align: 'center', size: 11, color: 'muted' });
                    info = { n, f, q, inter, full, ret, ok };
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          return `$n=${I.n}$, $f=${I.f}$: operations wait for $${I.q}$ replies. The write and read sets share ${I.inter.length} replica${I.inter.length === 1 ? '' : 's'}, so the read returns **${I.ret}** although the write(1) had finished. ${I.ok ? 'The history is linearizable.' : '**Stale read: not linearizable.**'} Two sets of $${I.q}$ out of $${I.n}$ must intersect when $2(${I.q})>${I.n}$, i.e. ${2 * I.q > I.n ? 'here they must (n > 2f holds)' : 'here they need not (n ≤ 2f)'}.`;
        });
      },
    },
  ],
};
void clamp; void opLabel;
