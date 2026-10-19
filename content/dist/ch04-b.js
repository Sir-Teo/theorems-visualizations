// Distributed Computing — Chapter 4, part b: items 4.5–4.8 (Ricart–Agrawala, dining philosophers, Lehmann–Rabin, linearizability)
import { range, hash01, mulberry32, drawLanes, drawMsg, ly, histViz, PCOL } from './ch04.shared.js';

// ---------------------------------------------------------------------------------------------- 4.5: Ricart–Agrawala simulation
function runRA({ n, req, seed, spread, defer, dur = 1.6 }) {
  const q = [], msgs = [], cs = []; let kk = 0;
  const push = (e) => { e.k = kk++; q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const P = range(n).map(() => ({ clock: 0, st: 'idle', ts: 0, reps: 0, def: [], reqAt: 0, csStart: 0 }));
  const send = (from, to, t, kind, ts) => { const tr = t + 0.45 + spread * hash01(seed, from, to, msgs.length); msgs.push({ from, ts: t, to, tr, kind, label: kind === 'req' ? `req ${ts}` : 'ok' }); push({ t: tr, type: 'recv', to, from, kind, ts }); };
  req.slice(0, n).forEach((t, p) => push({ t, type: 'want', p }));
  while (q.length) {
    const e = q.shift(), p = e.type === 'recv' ? e.to : e.p, S = P[p];
    if (e.type === 'want') { S.clock++; S.ts = S.clock; S.st = 'wanting'; S.reps = 0; S.reqAt = e.t; for (let j = 0; j < n; j++) if (j !== p) send(p, j, e.t, 'req', S.ts); }
    else if (e.type === 'recv' && e.kind === 'req') {
      S.clock = Math.max(S.clock, e.ts) + 1;
      const mine = S.st === 'in' || (S.st === 'wanting' && (S.ts < e.ts || (S.ts === e.ts && p < e.from)));
      if (defer && mine) S.def.push(e.from); else send(p, e.from, e.t, 'rep');
    } else if (e.type === 'recv') {
      S.clock++; S.reps++;
      if (S.reps === n - 1 && S.st === 'wanting') { S.st = 'in'; S.csStart = e.t; push({ t: e.t + dur, type: 'exit', p }); }
    } else { S.st = 'idle'; cs.push({ p, s: S.csStart, e: e.t, ts: S.ts, reqAt: S.reqAt }); S.def.forEach((j) => send(p, j, e.t, 'rep')); S.def = []; }
  }
  return { msgs, cs, n };
}

// ---------------------------------------------------------------------------------------------- 4.6 / 4.7: dining philosophers engine
// Philosopher i has fork i on its left and fork (i+1) mod n on its right.
// Each step accesses at most one fork; coin draws and failed second-fork tests
// are separate from releases, as in Lehmann–Rabin §5. Meals finish in one
// local step, then the forks are released individually (left-first here).
export function dEngine(n, o) {
  const E = { n, pc: Array(n).fill(0), own: Array(n).fill(-1), eat: Array(n).fill(0), rng: o.rng || (() => 0.5) };
  E.side = range(n).map((i) => (o.lefty && i === n - 1 ? 1 : 0));
  const first = (i) => (E.side[i] === 0 ? i : (i + 1) % n), second = (i) => (E.side[i] === 0 ? (i + 1) % n : i);
  const intent = (i, own) => {
    switch (E.pc[i]) {
      case 0: return { i, next: 1 };
      case 1: return { i, next: 2, flip: true };
      case 2: return own[first(i)] < 0 ? { i, take: first(i), next: 3 } : { i, stay: true };
      case 3:
        if (own[second(i)] < 0) return { i, take: second(i), next: 4, failed: o.rule === 'hold' ? 3 : 5 };
        return o.rule === 'hold' ? { i, stay: true } : { i, next: 5 };
      case 4: return { i, next: 6 }; // finish the finite meal
      case 5: return { i, release: first(i), next: 1 }; // unsuccessful attempt
      case 6: return { i, release: i, next: 7 };
      case 7: return { i, release: (i + 1) % n, next: 0 };
      default: throw new Error('Invalid philosopher state');
    }
  };
  const apply = (it) => {
    const i = it.i;
    if (it.stay) return;
    if (it.take !== undefined) {
      if (E.own[it.take] < 0) { E.own[it.take] = i; E.pc[i] = it.next; if (it.next === 4) E.eat[i]++; }
      else if (it.failed !== undefined) E.pc[i] = it.failed;
      return;
    }
    if (it.release !== undefined) E.own[it.release] = -1;
    E.pc[i] = it.next;
    if (it.flip && o.rule === 'coin') E.side[i] = E.rng() < 0.5 ? 0 : 1;
  };
  E.stepOne = (i) => apply(intent(i, E.own));
  // A batched round: attempted acquisitions precede local steps/releases.
  // Conflicting acquisitions are serialized by seat index, not simultaneous.
  E.lockstep = () => { const its = range(n).map((i) => intent(i, E.own.slice())); its.filter((t) => t.take !== undefined).forEach(apply); its.filter((t) => t.take === undefined).forEach(apply); };
  // Seven consecutive steps let an uncontended philosopher finish a meal.
  E.sequential = () => { for (let i = 0; i < n; i++) for (let t = 0; t < 7; t++) E.stepOne(i); };
  E.key = () => E.pc.join('') + '|' + E.own.join(',') + '|' + E.side.join('');
  return E;
}
const PHCOL = ['faint', 'gold', 'gold', 'orange', 'green', 'orange', 'purple', 'purple'];
const PHNAME = ['thinking', 'choose first fork', 'wait for first fork', 'try second fork', 'eating', 'release after failed attempt', 'release left fork', 'release right fork'];

function drawTable(s, n, E) {
  s.circle(0, 0, 0.78, { fill: 'grid', fillAlpha: 0.25, color: 'grid', width: 1 });
  const th = (i) => Math.PI / 2 - (2 * Math.PI * i) / n;
  for (let j = 0; j < n; j++) {
    const a = th(j) + Math.PI / n, bx = Math.cos(a), by = Math.sin(a), o = E.own[j];
    if (o < 0) s.line(0.45 * bx, 0.45 * by, 0.98 * bx * 0.8, 0.98 * by * 0.8, { color: 'muted', width: 3 });
    else { const px = 1.35 * Math.cos(th(o)), py = 1.35 * Math.sin(th(o)); s.line(0.82 * bx + 0.5 * (px - 0.82 * bx) * 0.7, 0.82 * by + 0.5 * (py - 0.82 * by) * 0.7, 0.82 * bx + 0.25 * (px - 0.82 * bx), 0.82 * by + 0.25 * (py - 0.82 * by), { color: 'orange', width: 4.5 }); }
  }
  for (let i = 0; i < n; i++) {
    const x = 1.35 * Math.cos(th(i)), y = 1.35 * Math.sin(th(i)), c = PHCOL[E.pc[i]];
    s.dot(x, y, { r: 18, color: c });
    s.text(String(i), x, y, { align: 'center', size: 14, color: 'ink', halo: false });
  }
}

const op = (p, kind, val, s, e, reg = 'x') => ({ p, kind, val, s, e, reg });

export default {
  collection: 'dist',
  chapter: 4,
  items: [
    {
      num: '4.5', kind: 'Algorithm', name: 'Mutual exclusion by logical timestamps (Ricart–Agrawala)',
      statement: String.raw`$n$ processes communicate by messages and keep Lamport clocks. A process that wants the critical section increments its clock to a timestamp $ts$ and sends $\mathrm{request}(ts,i)$ to all others; it enters once it has a reply from every other process. A process $j$ receiving a request replies immediately unless it is itself critical, or it is requesting with a smaller pair $(ts_j,j)<(ts_i,i)$; in those cases it defers the reply until it leaves the critical section. Mutual exclusion holds, requests are served in timestamp order, and each entry costs exactly $2(n-1)$ messages.`,
      idea: String.raw`Lamport's total order (3.2) decides every conflict. Suppose $i$ and $j$ were critical together with $(ts_i,i)<(ts_j,j)$. Then $j$ had $i$'s reply to its request. When that request reached $i$, either $i$ had not yet asked (then the clock rule would have given $i$ a timestamp larger than $ts_j$, contradicting the order), or $i$ was already requesting or critical, and with the smaller pair it defers its reply until it leaves the critical section: so $j$ could not have been critical meanwhile. This improves on the first timestamp scheme of Lamport's paper (3.12), which needs $3(n-1)$ messages per entry (request, reply, release).`,
      caption: String.raw`Space-time diagram, time to the right. Drag the orange handles to move each process's moment of wanting the resource; blue arrows are requests (labelled with their timestamp), green arrows are replies, bars are critical sections. Close requests are resolved by timestamp, and the late replies are the deferred ones. Turn off *deferral* (reply to everybody at once) and the same schedule puts two processes in the critical section: the bars turn red. The readout recomputes the message count and checks that entry order equals timestamp order.`,
      deps: ['dist-3.2', 'dist-4.1'], refs: ['Lynch §20.1.4'], tags: ['mutual exclusion', 'logical clocks'],
      scope: String.raw`Asynchronous reliable message passing (messages are never lost; delays are arbitrary but finite); no process fails — a single crash blocks everyone. The simulation uses delays $0.45+\sigma\cdot u$ with a seeded random $u$.`,
      credit: 'Ricart & Agrawala, 1981', links: { doi: 'https://doi.org/10.1145/358527.358537' },
      viz(v) {
        const nS = v.slider('processes $n$', 2, 4, 3, { int: true });
        const spread = v.slider('delay spread $\\sigma$', 0, 3, 1.2, { step: 0.05 });
        const defer = v.toggle('defer replies by timestamp', true);
        let seed = 3; v.button('new delays', () => { seed++; });
        const s = v.stage({ x: [-0.9, 14.4], y: [-0.7, 3.7], axes: false, height: 330, full: true, title: 'processes as lanes, time to the right (drag the handles to move the requests)' });
        const hs = [2, 2.6, 7.2, 9].map((t, i) => s.handle(t, 3 - i, { color: 'orange', constrain: 'x', r: 7, label: `want` }));
        hs.forEach((h) => { h.onDrag = () => { h.set(Math.max(0.3, Math.min(9.5, Math.round(h.x * 10) / 10)), h.y); }; });
        let R = null, bad = false;
        v.render(() => {
          const n = nS.value;
          s.setView([-0.9, 14.4], [-0.7, n - 0.3]);
          hs.forEach((h, i) => { h.visible = i < n; if (i < n) h.set(h.x, ly(i, n)); });
          R = runRA({ n, req: hs.map((h) => h.x), seed, spread: spread.value, defer: defer.value });
          drawLanes(s, n, 14, { names: range(n).map((i) => `P${i}`) });
          R.msgs.forEach((m) => drawMsg(s, n, m, { color: m.kind === 'req' ? 'accent' : 'green', width: 1.6, labelColor: m.kind === 'req' ? 'accent' : 'green' }));
          bad = false;
          R.cs.forEach((c) => {
            const over = R.cs.some((d) => d !== c && d.s < c.e - 1e-9 && c.s < d.e - 1e-9); bad = bad || over;
            const y = ly(c.p, n);
            s.rect(c.s, y - 0.16, c.e, y + 0.16, { fill: over ? 'red' : 'gold', fillAlpha: 0.55, color: over ? 'red' : 'gold', width: 1.6, radius: 3 });
            s.text(`ts ${c.ts}`, (c.s + c.e) / 2, y + 0.2, { align: 'center', baseline: 'bottom', size: 11, color: 'ink', halo: true });
          });
          hs.forEach((h, i) => { if (i < n) { h.set(h.x, ly(i, n)); } });
        });
        v.legend([['accent', 'request (timestamp)'], ['green', 'reply'], ['gold', 'critical section'], ['red', 'two critical at once']]);
        v.readout(() => {
          if (!R) return '';
          const byEntry = R.cs.slice().sort((a, b) => a.s - b.s).map((c) => `P${c.p}`), byTs = R.cs.slice().sort((a, b) => a.ts - b.ts || a.p - b.p).map((c) => `P${c.p}`);
          const nn = R.n, same = byEntry.join() === byTs.join();
          return `Entry order ${byEntry.join(' → ')}; timestamp order ${byTs.join(' → ')}: ${same ? 'equal' : '**different**'}. Messages sent: **${R.msgs.length}** (the formula $2(n-1)$ per entry gives ${2 * (nn - 1) * nn}). ${bad ? '**Two processes were critical at the same time**: without deferral the timestamp rule is not applied.' : 'No overlap of critical sections.'}\nTimestamps: ${R.cs.slice().sort((a, b) => a.p - b.p).map((c) => `P${c.p} asked at ${c.reqAt.toFixed(1)} with ts ${c.ts}`).join('; ')}.`;
        });
      },
    },
    {
      num: '4.6', kind: 'Theorem', name: 'No symmetric deterministic dining philosophers',
      statement: String.raw`Let $n\ge2$ identical philosophers start in the same state around a table with identical initial fork states, with a fork between each neighbouring pair, each philosopher running the *same deterministic program* that depends only on its own state and on which of its two adjacent forks are free. Then no such program solves the problem (every hungry philosopher eventually eats, and no fork is held by two). More precisely, for every program there is a fair schedule in which no philosopher ever eats, or two neighbours violate the exclusion of forks.`,
      idea: String.raw`Use the fully symmetric schedule: let all philosophers take their next step in lockstep. By induction every philosopher is in exactly the same state after every round, because they run the same program and see the same local picture. If one philosopher ever began to eat, all of them would at once, but neighbours share forks, which is impossible. So nobody ever eats while the schedule goes on forever, which is perfectly fair. This is an indistinguishability argument (1.7), and the same trap as the leader-election impossibility of 2.3: identical deterministic processes cannot break symmetry. Randomness (4.7) or a difference between seats escapes it.`,
      caption: String.raw`Choose a rule and scrub through the rounds. With *hold and wait* all philosophers grab their left fork and wait for the right one: they cannot acquire their second forks. With *polite* they put the fork down when the right one is taken, and again take it, forever: livelock (the strip shows identical rows). In *one at a time* order each seat receives seven consecutive steps before the next seat runs; this scheduler breaks the symmetry and philosophers do eat; and with *left-handed seat $n-1$* the programs are no longer identical, so the theorem does not apply (forks are then resolved by seat number when two philosophers ask at once). The readout reports when the configuration starts repeating with no meal.`,
      deps: ['dist-4.1', 'dist-2.3'], refs: ['Lynch §11.2', 'Lehmann & Rabin (1981), POPL, pp. 134–135, §§3–4, Theorem 1'], tags: ['symmetry', 'impossibility', 'resource sharing'],
      scope: String.raw`Deterministic anonymous identical processes in an oriented ring with a rotationally symmetric initial configuration, with separate acquisition of individual forks and no atomic operation acquiring both forks at once; the adversary is the lockstep schedule. It does not apply to randomized programs, to programs with distinct identifiers, or to schedulers that happen to break the symmetry.`,
      credit: 'Lehmann & Rabin, 1981', links: { doi: 'https://doi.org/10.1145/567532.567547', source: 'https://www.lix.polytechnique.fr/~catuscia/teaching/papers_and_books/ft_gateway.cfm.pdf' },
      viz(v) {
        const nS = v.slider('philosophers $n$', 3, 8, 5, { int: true });
        const rule = v.select('program', [{ value: 'hold', label: 'hold and wait' }, { value: 'polite', label: 'polite (put fork back)' }], 'hold');
        const sched = v.select('schedule', [{ value: 'lock', label: 'lockstep' }, { value: 'seq', label: 'one at a time' }], 'lock');
        const lefty = v.toggle('left-handed seat n−1', false);
        const rounds = v.slider('rounds', 0, 40, 6, { int: true });
        const sT = v.stage({ x: [-1.9, 1.9], y: [-1.85, 1.85], equal: true, axes: false, height: 340, weight: 1, minWidth: 300, title: 'the table after the chosen round' });
        const sH = v.stage({ x: [-1.6, 41], y: [-0.7, 7.4], axes: false, height: 340, weight: 1.3, minWidth: 340, title: 'state of each philosopher, round by round' });
        let info = null;
        v.render(() => {
          const n = nS.value, E = dEngine(n, { rule: rule.value, lefty: lefty.value }), H = [{ pc: E.pc.slice(), own: E.own.slice(), eat: 0 }], seen = new Map([[E.key(), 0]]);
          let cyc = null;
          for (let r = 1; r <= rounds.value; r++) {
            if (sched.value === 'lock') E.lockstep(); else E.sequential();
            H.push({ pc: E.pc.slice(), own: E.own.slice(), eat: E.eat.reduce((a, b) => a + b, 0) });
            const k = E.key(); if (!cyc && seen.has(k)) cyc = { from: seen.get(k), at: r }; seen.set(k, r);
          }
          drawTable(sT, n, E);
          sH.setView([-1.6, Math.max(8, rounds.value + 1)], [-0.7, 7.4]);
          for (let i = 0; i < n; i++) {
            const y = 7 - 0.78 * i - 0.4;
            sH.text(`${i}`, -0.5, y, { align: 'right', size: 12, color: 'ink' });
            H.forEach((h, k) => sH.rect(k, y - 0.34, k + 0.92, y + 0.34, { fill: PHCOL[h.pc[i]], fillAlpha: h.pc[i] === 0 ? 0.3 : 0.75, stroke: false }));
          }
          info = { E, cyc, total: E.eat.reduce((a, b) => a + b, 0), n };
        });
        v.legend(PHNAME.map((t, i) => [PHCOL[i], t, { area: true }]));
        v.readout(() => {
          const I = info; if (!I) return '';
          const same = I.E.pc.every((c) => c === I.E.pc[0]);
          return `Round ${rounds.value}: meals eaten so far **${I.total}** (per philosopher ${I.E.eat.join(', ')}). ${same ? 'Every philosopher is in the same state, so every rotation of the table is the same picture.' : 'The philosophers are no longer all in the same state.'}${I.cyc && I.total === 0 ? ` **The configuration after round ${I.cyc.at} equals the one after round ${I.cyc.from}: nobody has eaten and the run repeats forever.**` : ''}`;
        });
      },
    },
    {
      num: '4.7', kind: 'Algorithm', name: 'Randomized dining philosophers (Lehmann–Rabin)',
      statement: String.raw`Each hungry philosopher repeats: flip a fair coin to choose a side; wait until the fork on that side is free and take it; if the other fork is free take it too and eat, otherwise put the first fork down and start over. Against every fair scheduler (including an adversarial one that sees all past coin flips) no two neighbours eat with the same fork, and with probability 1 some hungry philosopher eventually eats. This simple retry algorithm gives **system-wide progress**, not individual lockout-freedom under every weakly fair scheduler.`,
      idea: String.raw`Random draws break the recurring symmetry. The original proof sketch first argues that, on a deadlocked run, every philosopher must keep acquiring forks. It then uses successive, disjoint configurations of coin choices: outward-facing choices by adjacent philosophers give a positive chance of progress, contradicting a positive probability of perpetual collective starvation. This is not a bound on elapsed scheduler steps. The paper omits the proofs of its supporting lemmas. It separately states that the simple protocol is not lockout-free and introduces a *courteous* variant with neighbour signals and last-meal information to prevent individual starvation. The visualization implements the simple protocol.`,
      caption: String.raw`Run the philosophers for a finite number of scheduler steps. *Random order* samples a philosopher at each step; the corresponding infinite scheduler is fair with probability 1. *Lockstep* uses batched rounds: acquisitions precede releases, with conflicting fork requests serialized by seat index. Neither finite picture proves the theorem for every fair adversary. The bars count meals and the histogram uses 300 seeded runs. Switch to the deterministic left-first rule: under lockstep nobody eats. Coin draws, failed second-fork tests and individual fork releases are separate steps.`,
      deps: ['dist-4.6', 'prob-2.1.1a'], refs: ['Lynch §11.4', 'Lehmann & Rabin (1981), POPL, pp. 134–138, §§3, 5–7, Theorems 2–5'], tags: ['randomization', 'symmetry breaking'],
      scope: String.raw`Atomic test-and-take of one fork at a time, finite meals, independent fair coins, and a proper non-anticipating scheduler: for every coin sequence, each live process is activated infinitely often. The scheduler may observe all past draws, but not future draws. Thinking processes may stop. The simple protocol guarantees collective progress with probability 1, without guaranteeing individual access. The original extended abstract provides a proof sketch with omitted lemma proofs. Here thinking and meal duration are simplified to local steps, releases are left-first, and the finite seeded simulations are illustrative. A lockstep round counts $n$ process steps; it is not an elapsed-time unit.`,
      credit: 'Lehmann & Rabin, 1981', links: { doi: 'https://doi.org/10.1145/567532.567547', source: 'https://www.lix.polytechnique.fr/~catuscia/teaching/papers_and_books/ft_gateway.cfm.pdf' },
      viz(v) {
        const nS = v.slider('philosophers $n$', 3, 8, 5, { int: true });
        const T = v.slider('steps', 50, 5000, 600, { log: true, sig: 2, int: true });
        const prog = v.select('program', [{ value: 'coin', label: 'coin flip first fork' }, { value: 'polite', label: 'always left first (deterministic)' }], 'coin');
        const sched = v.select('schedule', [{ value: 'rand', label: 'random order' }, { value: 'lock', label: 'lockstep' }], 'rand');
        let seed = 1; v.button('new seed', () => { seed++; });
        const sT = v.stage({ x: [-1.9, 1.9], y: [-1.85, 1.85], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 260, title: 'the table at the end of the run' });
        const sB = v.stage({ x: [-0.7, 8.7], y: [0, 10], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'philosopher', ylabel: 'meals', title: 'meals eaten' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'steps until the first meal', ylabel: 'runs of 300', title: 'time to the first meal' });
        const run = (n, steps, sd) => {
          const rng = mulberry32(sd * 7919 + n * 31 + (prog.value === 'coin' ? 1 : 2)), E = dEngine(n, { rule: prog.value, rng });
          let first = null;
          if (sched.value === 'lock') { for (let r = 0; r < Math.floor(steps / n); r++) { E.lockstep(); if (first === null && E.eat.some((x) => x > 0)) first = (r + 1) * n; } }
          else for (let t = 0; t < steps; t++) { E.stepOne(Math.floor(rng() * n)); if (first === null && E.eat.some((x) => x > 0)) first = t + 1; }
          return { E, first };
        };
        let stat = null;
        v.render(() => {
          const n = nS.value, steps = T.value, R = run(n, steps, seed), E = R.E;
          drawTableLR(sT, n, E);
          const mx = Math.max(...E.eat, 1);
          sB.setView([-0.7, n - 0.3], [0, mx * 1.15 + 1]);
          sB.bars(E.eat, { x0: 0, dx: 1, color: (val) => (val > 0 ? 'green' : 'red') });
          const firsts = []; let never = 0;
          for (let r = 0; r < 300; r++) { const q = run(n, steps, 100 + r); if (q.first === null) never++; else firsts.push(q.first); }
          let top = steps; sH.setView([0, steps], [0, 1]);
          if (firsts.length) {
            top = Math.max(...firsts) + 1; const hh = v.M.histogram(firsts, { bins: 20, range: [0, top] });
            sH.setView([0, top], [0, Math.max(...hh.counts) * 1.2 + 1]);
            sH.hist({ edges: hh.edges, counts: hh.counts }, { color: 'accent' });
          }
          if (never) sH.text(`${never} of 300 runs: no meal at all`, top * 0.5, 0.5, { align: 'center', size: 13, color: 'red', plate: true });
          stat = { E, never, firsts, n, steps };
        });
        v.readout(() => {
          const S = stat; if (!S) return '';
          const med = S.firsts.length ? v.M.median(S.firsts) : null;
          return `Seed ${seed}: meals per philosopher ${S.E.eat.join(', ')} (${S.E.eat.every((x) => x > 0) ? 'everybody ate' : S.E.eat.some((x) => x > 0) ? 'somebody was left out in this run' : '**nobody ate**'}). Over 300 runs: ${S.never === 0 ? 'every run produced a meal' : `**${S.never} runs never produced a meal**`}${med !== null ? `, median time to the first meal ${med} steps` : ''}.`;
        });
        function drawTableLR(s, n, E) { drawTable(s, n, E); }
      },
    },
    {
      num: '4.8', kind: 'Definition', name: 'Linearizability',
      statement: String.raw`A history of a concurrent object is a set of operations, each with an invocation time and a response time. It is *linearizable* if every operation can be assigned a single *linearization point* inside its own interval such that the operations, ordered by these points, form a legal sequential history of the object (for a read/write register: each read returns the value of the latest preceding write, or the initial value). Equivalently, there is a total order of the operations that respects real time (if $a$ responded before $b$ was invoked then $a$ comes first) and is legal. An object implementation is linearizable if all its histories are; linearizability is *local*: a system is linearizable if each of its objects is.`,
      idea: String.raw`Linearizability asks that each operation appears to take effect instantaneously at some moment between its invocation and response, so concurrent code can be reasoned about as if it were atomic (the shared-memory model of 1.4 gives the concurrency). To check a history one searches for a legal order: choose which operation goes first among those that no other operation precedes in real time, apply it to the sequential register, and recurse; the search below does exactly this with memoisation on the set of placed operations and the register's value.`,
      caption: String.raw`Operations are bars on process lanes: blue writes, orange reads, with the value after the arrow. Drag a bar's ends to change its interval, and click a bar to change its value. Green dots numbered 1, 2, … are the linearization points the search found, and the strip below shows the sequential register they define. When the history is not linearizable, the red bars are those whose removal would repair it. *Stale read* and *new-old inversion* are the classic violations; *two writers* is a subtle one.`,
      deps: ['dist-1.4'], refs: ['Lynch §13.1', 'Attiya–Welch ch. 9'], tags: ['linearizability', 'correctness conditions'],
      scope: String.raw`Single-register objects here (the definition covers any sequential specification). The search is exponential in the number of operations in the worst case; ten operations are instant.`,
      credit: 'Herlihy & Wing, 1990', links: { doi: 'https://doi.org/10.1145/78969.78972', wikipedia: 'https://en.wikipedia.org/wiki/Linearizability' },
      viz(v) {
        const presets = [
          { value: 'conc', label: 'concurrent write and reads', nProc: 3, ops: [op(0, 'w', 1, 1, 6), op(1, 'r', 1, 2, 4), op(2, 'r', 0, 3, 5)] },
          { value: 'stale', label: 'stale read', nProc: 2, ops: [op(0, 'w', 1, 0.5, 3), op(1, 'r', 0, 4, 6)] },
          { value: 'inv', label: 'new-old inversion', nProc: 2, ops: [op(0, 'w', 1, 0.5, 9), op(1, 'r', 1, 1, 3), op(1, 'r', 0, 4, 6)] },
          { value: 'two', label: 'two writers', nProc: 3, ops: [op(0, 'w', 1, 0, 4), op(1, 'w', 2, 1, 5), op(2, 'r', 2, 4.5, 6), op(2, 'r', 1, 6.5, 8)] },
          { value: 'cw', label: 'concurrent writers (fine)', nProc: 3, ops: [op(0, 'w', 1, 0, 4), op(1, 'w', 2, 1, 5), op(2, 'r', 1, 6, 7), op(2, 'r', 1, 7.5, 9)] },
        ];
        const H = histViz(v, { presets, mode: 'lin' });
        v.readout(() => H.text());
      },
    },
  ],
};
void PCOL;
