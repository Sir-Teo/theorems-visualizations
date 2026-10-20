// Distributed Computing — Chapter 1 (part b): items 1.6–1.10
import { hash01, clamp, plural, range, ly, drawLanes, drawMsg, hitMsg, runABP, runTCP, monteCarloTCP } from './ch01.shared.js';

// ---- 1.6 helpers: a 3-process token ring.  State bits: holds_i (bit i), in-CS_i (bit 3+i), token in channel i -> i+1 (bit 6+i).
const bit = (s, b) => (s >> b) & 1;
const Hd = (s, i) => bit(s, i), Cs = (s, i) => bit(s, 3 + i), Ch = (s, i) => bit(s, 6 + i);
const pop = (s) => { let c = 0; for (let b = 0; b < 9; b++) c += bit(s, b); return c; };
const tokens = (s) => [0, 1, 2].reduce((a, i) => a + Hd(s, i) + Ch(s, i), 0);
function succ(s) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    if (Hd(s, i) && !Cs(s, i)) { out.push([s | (1 << (3 + i)), `P${i} enters its critical section`]); out.push([(s & ~(1 << i)) | (1 << (6 + i)), `P${i} passes the token to P${(i + 1) % 3}`]); }
    if (Cs(s, i)) out.push([s & ~(1 << (3 + i)), `P${i} leaves its critical section`]);
    const pi = (i + 2) % 3;
    if (Ch(s, pi)) out.push([(s & ~(1 << (6 + pi))) | (1 << i), `P${i} receives the token from P${pi}`]);
  }
  return out;
}
const INVS = {
  A: { tex: String.raw`\text{at most one process is in its critical section}`, f: (s) => Cs(s, 0) + Cs(s, 1) + Cs(s, 2) <= 1 },
  B: { tex: String.raw`\text{at most one token exists (held or in a channel)}`, f: (s) => tokens(s) <= 1 },
  C: { tex: String.raw`\text{a process in its critical section holds the token}`, f: (s) => [0, 1, 2].every((i) => !Cs(s, i) || Hd(s, i)) },
  D: { tex: String.raw`\text{the token is never lost (at least one exists)}`, f: (s) => tokens(s) >= 1 },
};
/** Draw one state of the ring: node fill = in critical section, black dot = holds token, dot on an arc = token in transit. */
function ringPic(s, cx, cy, st, title) {
  const P = [0, 1, 2].map((i) => [cx + 1.15 * Math.cos(Math.PI / 2 - (i * 2 * Math.PI) / 3), cy + 1.15 * Math.sin(Math.PI / 2 - (i * 2 * Math.PI) / 3)]);
  for (let i = 0; i < 3; i++) {
    const a = P[i], b = P[(i + 1) % 3];
    s.arrow(a[0] + (b[0] - a[0]) * 0.25, a[1] + (b[1] - a[1]) * 0.25, a[0] + (b[0] - a[0]) * 0.75, a[1] + (b[1] - a[1]) * 0.75, { color: 'faint', width: 1.5 });
    if (Ch(st, i)) s.dot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { r: 8, color: 'orange', fill: true });
  }
  for (let i = 0; i < 3; i++) {
    s.circle(P[i][0], P[i][1], 0.38, { fill: Cs(st, i) ? 'gold' : 'panel', fillAlpha: Cs(st, i) ? 0.55 : 1, color: Cs(st, i) ? 'gold' : 'ink', width: 2 });
    s.text(`P${i}`, P[i][0], P[i][1] + 0.02, { align: 'center', size: 13, color: 'ink' });
    if (Hd(st, i)) s.dot(P[i][0] + 0.42, P[i][1] + 0.42, { r: 7, color: 'ink', fill: true });
  }
  s.text(title, cx, cy + 1.95, { align: 'center', size: 12, color: 'muted' });
}

export default {
  collection: 'dist',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Method', name: 'Invariant assertions',
      statement: String.raw`To prove that a property $\varphi$ holds in every reachable state of a system with initial states $\mathrm{Init}$ and transition relation $\to$, find an *invariant* $I$ — a set of states — such that (i) every initial state is in $I$, (ii) $I$ is closed under transitions: $s\in I,\ s\to s'\Rightarrow s'\in I$ (it is *inductive*), and (iii) $I\subseteq\varphi$. Then every reachable state is in $I$, hence in $\varphi$. The property $\varphi$ itself is usually *not* inductive and must be strengthened.`,
      idea: String.raw`Induction on the length of an execution: states reachable in $0$ steps are in $I$ by (i), and if the states reachable in $k$ steps are in $I$ then so are those reachable in $k+1$ by (ii). The subtlety is that (ii) quantifies over **all** states in $I$, reachable or not, so a true invariant can fail to be inductive because of an unreachable state that satisfies it and steps out of it. The remedy is a stronger $I$ that rules such states out; searching the reachable states by breadth-first search shows what is true, the inductive check shows what is provable.

Apply mathematical induction (alg 2.1) to the integer execution length, starting at zero. The base case is precisely initial-state inclusion; the inductive step uses closure for the last transition of every length-$k+1$ execution. Only after that induction establishes membership in $I$ does $I\subseteq\varphi$ give the desired safety property. The finite explorer checks this instance's states, while the induction is the general proof rule.`,
      caption: String.raw`A token ring of three processes: a token passes around and only its holder may enter the critical section. Each cell is one of the $2^9=512$ states; green = reachable from the initial state (the slider reveals the breadth-first search depth by depth), orange = satisfies $I$ but is unreachable, grey = outside $I$. Toggle conjuncts of $I$. When $I$ is not inductive a red arrow shows a transition from a state inside $I$ to one outside it; click any cell to draw that state.`,
      deps: ['dist-1.5','alg-2.1'], refs: ['Lynch §8.5.1'], tags: ['invariants', 'induction'],
      credit: 'Floyd, 1967; Hoare, 1969 (inductive assertions); Ashcroft, 1975 (for parallel programs)',
      scope: String.raw`Bounded model: at most one token per channel and a fixed ring of three; all $2^9$ bit-vector states are enumerated.`,
      viz(v) {
        const tg = {}; for (const k of 'ABCD') tg[k] = v.toggle(k, k === 'A');
        const reach = new Map(); { reach.set(1, 0); const q = [1]; while (q.length) { const s = q.shift(); for (const [t] of succ(s)) if (!reach.has(t)) { reach.set(t, reach.get(s) + 1); q.push(t); } } }
        const maxD = Math.max(...reach.values());
        const dp = v.slider('search depth shown', 0, maxD, maxD, { int: true });
        const sG = v.stage({ x: [0, 32], y: [0, 16], axes: false, height: 330, title: 'all 512 states', weight: 1.15, minWidth: 330 });
        const sR = v.stage({ x: [0, 9], y: [-0.6, 3.6], axes: false, equal: true, height: 330, title: 'the selected state', weight: 1, minWidth: 280 });
        let sel = 1;
        const I = (s) => 'ABCD'.split('').every((k) => !tg[k].value || INVS[k].f(s));
        const analyse = () => {
          const inI = []; let cti = null;
          for (let s = 0; s < 512; s++) if (I(s)) inI.push(s);
          const cands = [];
          for (const s of inI) for (const [t, lab] of succ(s)) if (!I(t)) cands.push({ s, t, lab, w: pop(s) + (reach.has(s) ? 0 : 0) });
          cands.sort((a, b) => a.w - b.w || a.s - b.s); cti = cands[0] || null;
          const initOk = I(1), reachOk = [...reach.keys()].every(I), phi = [...reach.keys()].every(INVS.A.f);
          return { inI, cti, initOk, reachOk, phi, ind: !cti };
        };
        let lastKey = '', R = analyse(); const upd = () => { const k = 'ABCD'.split('').map((c) => +tg[c].value).join(''); if (k !== lastKey) { lastKey = k; R = analyse(); if (R.cti) sel = R.cti.s; } return R; };
        sG.onClick((x, y) => { const c = Math.floor(x), r = 15 - Math.floor(y); if (c >= 0 && c < 32 && r >= 0 && r < 16) sel = r * 32 + c; });
        const cell = (s) => [s % 32, 15 - Math.floor(s / 32)];
        v.render(() => {
          const A = upd(), inI = new Set(A.inI);
          for (let s = 0; s < 512; s++) {
            const [cx, cy] = cell(s), rd = reach.get(s), shown = rd != null && rd <= dp.value;
            const st = shown ? { fill: 'green', fillAlpha: 0.75, color: 'green' } : rd != null ? { fill: 'green', fillAlpha: 0.12, color: 'green' } : inI.has(s) ? { fill: 'orange', fillAlpha: 0.5, color: 'orange' } : { fill: 'faint', fillAlpha: 0.18, color: 'faint' };
            sG.rect(cx + 0.08, cy + 0.08, cx + 0.92, cy + 0.92, { ...st, width: 1 });
          }
          if (A.cti) {
            const [a, b] = cell(A.cti.s), [c, d] = cell(A.cti.t);
            sG.rect(c + 0.04, d + 0.04, c + 0.96, d + 0.96, { fill: 'red', fillAlpha: 0.7, color: 'red', width: 1.5 });
            sG.rect(a + 0.02, b + 0.02, a + 0.98, b + 0.98, { color: 'red', width: 2.5 });
            sG.arrow(a + 0.5, b + 0.5, c + 0.5, d + 0.5, { color: 'red', width: 2, head: 9 });
          }
          const [sx, sy] = cell(sel); sG.rect(sx - 0.1, sy - 0.1, sx + 1.1, sy + 1.1, { color: 'ink', width: 2.2, dash: true });
          ringPic(sR, 2.3, 1.45, sel, `state ${sel}${reach.has(sel) ? ` — reachable, depth ${reach.get(sel)}` : ' — unreachable'}`);
          if (A.cti) { ringPic(sR, 6.7, 1.45, A.cti.t, 'after the offending step'); sR.text('→', 4.5, 1.45, { size: 24, color: 'red', align: 'center' }); sR.text(A.cti.lab, 4.5, -0.4, { size: 10.5, color: 'red', align: 'center' }); }
        });
        v.legend([['green', 'reachable', { area: true }], ['orange', 'in $I$ but unreachable', { area: true }], ['red', 'transition out of $I$', { area: true }]]);
        v.readout(() => {
          const A = upd(), reachN = reach.size;
          const parts = 'ABCD'.split('').filter((k) => tg[k].value).map((k) => k).join('∧') || '(none: $I$ = all states)';
          return `$I$ = ${parts} · $|I|=${A.inI.length}$ states, $|\\text{reachable}|=${reachN}$ · (i) initial state in $I$: **${A.initOk ? 'yes' : 'NO'}** · every reachable state in $I$: **${A.reachOk ? 'yes' : 'NO'}** · (ii) inductive: **${A.ind ? 'yes' : 'NO'}**\n` + (A.ind ? `$I$ is inductive, so it holds on all ${reachN} reachable states; mutual exclusion (A) holds on all of them: **${A.phi ? 'verified' : 'not implied'}**.` : `Not inductive: from a state inside $I$, "${A.cti.lab}" leaves $I$. That state is ${reach.has(A.cti.s) ? 'reachable — the invariant is simply false' : '**unreachable** — the invariant may be true but is too weak to prove; strengthen it'}.`);
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Method', name: 'Indistinguishability arguments',
      statement: String.raw`A process's *view* in an execution is its initial state together with the sequence of events (message receipts, local steps) it has observed. A deterministic process's behaviour is a function of its view alone. So if two executions $E$ and $E'$ give process $p$ the same view, $p$ takes the same steps — in particular makes the same decision — in both. A lower-bound or impossibility proof builds a chain $E_0,E_1,\dots,E_N$ of executions in which consecutive ones are indistinguishable to some process, and propagates a required outcome along the chain until it contradicts another requirement.`,
      idea: String.raw`In the coordinated-attack problem two generals must either both attack or both retreat, communicating over a channel that may lose any message; if no message is delivered both must retreat, and if all are delivered both must attack. Let $E_k$ be the execution in which exactly the first $k$ messages of an alternating exchange arrive. The sender of message $k$ cannot tell whether it arrived, so its view in $E_k$ equals its view in $E_{k-1}$ and it decides identically; hence the other general, who differs, must too. The decisions are pinned to "retreat" at one end and "attack" at the other, so somewhere along the chain two consecutive executions disagree: the contradiction.`,
      caption: String.raw`Each small diagram is one execution $E_k$ ($k$ messages delivered, the next one lost). Under it, the purple note says which general's view is identical to its view in $E_{k-1}$. You choose each general's decision for every view it can have (the table: click a cell to flip attack/retreat). The first execution where they disagree, or where validity fails, turns red; the readout enumerates **every** pair of decision rules and finds none that works.`,
      deps: ['dist-1.1'], refs: ['Lynch §8.7', 'Lynch §9.3'], tags: ['indistinguishability', 'impossibility'],
      credit: 'two generals: Akkoyunlu, Ekanadham & Huber, 1975; named by Gray, 1978',
      scope: String.raw`Deterministic generals; unreliable channel that may lose any message; $N$ is the number of messages the protocol would use if none were lost.`,
      viz(v) {
        const nS = v.slider('messages $N$', 2, 8, 4, { int: true, onChange: () => fit() });
        const sE = v.stage({ x: [-0.2, 9 * 3.2], y: [-1.9, 3.1], axes: false, height: 270, title: 'the chain of executions $E_0,\\dots,E_N$', full: true });
        const sT = v.stage({ x: [0, 11], y: [-0.4, 2.4], axes: false, height: 150, title: 'decision of each general, by number of messages received (click to flip)', full: true });
        const A = [], B = [];
        const fit = () => { const N = nS.value, a = Math.floor(N / 2) + 1, b = Math.ceil(N / 2) + 1; while (A.length < a) A.push(A.length > 0); while (B.length < b) B.push(B.length > 0); A.length = a; B.length = b; };
        fit();
        const recvA = (k) => Math.floor(k / 2), recvB = (k) => Math.ceil(k / 2);
        const xs = (k, c) => { const N = nS.value; return k * 3.2 + c; };
        sT.onClick((x, y) => { const j = Math.floor((x - 1.6) / 1.5); if (j < 0) return; if (y > 1.2 && j < A.length) A[j] = !A[j]; else if (y > 0.1 && y < 1.1 && j < B.length) B[j] = !B[j]; });
        const analyse = () => {
          const N = nS.value, rows = [];
          for (let k = 0; k <= N; k++) rows.push({ a: A[recvA(k)], b: B[recvB(k)] });
          const bad = [];
          rows.forEach((r, k) => { if (r.a !== r.b) bad.push([k, 'agreement']); });
          if (rows[0].a || rows[0].b) bad.push([0, 'validity: with no delivery both must retreat']);
          if (!rows[N].a || !rows[N].b) bad.push([N, 'validity: with every message delivered both must attack']);
          return { rows, bad };
        };
        let bf = null, bfKey = '';
        const brute = () => {
          const N = nS.value; if (bfKey === String(N)) return bf; bfKey = String(N);
          const a = Math.floor(N / 2) + 1, b = Math.ceil(N / 2) + 1; let ok = 0;
          for (let ma = 0; ma < 1 << a; ma++) for (let mb = 0; mb < 1 << b; mb++) {
            let good = true;
            for (let k = 0; k <= N && good; k++) { const da = (ma >> recvA(k)) & 1, db = (mb >> recvB(k)) & 1; if (da !== db) good = false; if (k === 0 && da) good = false; if (k === N && !da) good = false; }
            if (good) ok++;
          }
          bf = { ok, total: 2 ** (a + b) }; return bf;
        };
        v.render(() => {
          const N = nS.value, R = analyse(), badK = new Set(R.bad.map((b) => b[0]));
          sE.setView([-0.2, (N + 1) * 3.2], [-1.9, 3.1]);
          const w = 2.9, slot = (w - 0.4) / N;
          for (let k = 0; k <= N; k++) {
            const ox = k * 3.2, bad = badK.has(k);
            sE.rect(ox - 0.05, -1.75, ox + w + 0.05, 2.95, { color: bad ? 'red' : 'faint', width: bad ? 2.4 : 1, fill: bad ? 'red' : 'panel', fillAlpha: bad ? 0.07 : 0, radius: 6 });
            sE.text(`$E_{${k}}$`, ox + w / 2, 2.6, { align: 'center', size: 13, color: bad ? 'red' : 'ink' });
            sE.line(ox + 0.15, 1.6, ox + w - 0.1, 1.6, { color: 'faint', width: 1.5 }); sE.line(ox + 0.15, 0.4, ox + w - 0.1, 0.4, { color: 'faint', width: 1.5 });
            sE.text('A', ox + 0.05, 1.6, { align: 'right', size: 11, color: 'muted' }); sE.text('B', ox + 0.05, 0.4, { align: 'right', size: 11, color: 'muted' });
            for (let j = 1; j <= Math.min(k + 1, N); j++) {
              const up = j % 2 === 1, ts = ox + 0.2 + (j - 1) * slot, tr = ts + slot * 0.92, y1 = up ? 1.6 : 0.4, y2 = up ? 0.4 : 1.6, lost = j === k + 1;
              if (lost) { sE.line(ts, y1, ts + (tr - ts) * 0.55, y1 + (y2 - y1) * 0.55, { color: 'orange', width: 1.5, dash: [3, 3] }); sE.text('✕', ts + (tr - ts) * 0.55, y1 + (y2 - y1) * 0.55, { color: 'red', size: 13, align: 'center', halo: true }); }
              else sE.arrow(ts, y1, tr, y2, { color: 'accent', width: 1.8, head: 6 });
            }
            const dA = R.rows[k].a, dB = R.rows[k].b;
            sE.text(`A ${dA ? 'attacks' : 'retreats'}`, ox + w / 2, -0.35, { align: 'center', size: 10.5, color: dA ? 'green' : 'muted' });
            sE.text(`B ${dB ? 'attacks' : 'retreats'}`, ox + w / 2, -0.75, { align: 'center', size: 10.5, color: dB ? 'green' : 'muted' });
            if (k > 0) sE.text(k % 2 === 1 ? 'A: same view' : 'B: same view', ox + w / 2, -1.3, { align: 'center', size: 10.5, color: 'purple' });
          }
          // decision table
          const lab = (x, y, s, c) => sT.text(s, x, y, { size: 12, color: c || 'ink', align: 'left' });
          lab(0.0, 1.75, 'A: received', 'muted'); lab(0.0, 0.65, 'B: received', 'muted');
          A.forEach((d, j) => { const x0 = 1.6 + j * 1.5; sT.rect(x0, 1.2, x0 + 1.4, 2.2, { fill: d ? 'green' : 'faint', fillAlpha: d ? 0.45 : 0.15, color: d ? 'green' : 'faint', width: 1.5, radius: 6 }); sT.text(`${j} → ${d ? 'attack' : 'retreat'}`, x0 + 0.7, 1.7, { align: 'center', size: 11.5, color: 'ink' }); });
          B.forEach((d, j) => { const x0 = 1.6 + j * 1.5; sT.rect(x0, 0.1, x0 + 1.4, 1.1, { fill: d ? 'green' : 'faint', fillAlpha: d ? 0.45 : 0.15, color: d ? 'green' : 'faint', width: 1.5, radius: 6 }); sT.text(`${j} → ${d ? 'attack' : 'retreat'}`, x0 + 0.7, 0.6, { align: 'center', size: 11.5, color: 'ink' }); });
        });
        v.legend([['accent', 'delivered message'], ['orange', 'lost message ✕', { dash: true }], ['purple', 'same view as in the previous execution'], ['red', 'requirement violated']]);
        v.readout(() => {
          const R = analyse(), bf2 = brute(), N = nS.value;
          let msg;
          if (!R.bad.length) msg = 'all requirements hold — impossible, see the count below';
          else { const [k, why] = R.bad.find((b) => b[1] === 'agreement') || R.bad[0]; msg = k > 0 && why === 'agreement' ? `first failure: **$E_{${k}}$** — A ${R.rows[k].a ? 'attacks' : 'retreats'}, B ${R.rows[k].b ? 'attacks' : 'retreats'}. ${k % 2 === 1 ? 'A' : 'B'} has the same view as in $E_{${k - 1}}$, where both did the other thing` : `first failure: **$E_{${k}}$**, ${why}`; }
          return `${msg}\nexhaustive check for $N=${N}$: of all **${bf2.total}** pairs of decision rules, **${bf2.ok}** satisfy agreement and both validity conditions in all ${N + 1} executions.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Fairness',
      statement: String.raw`An infinite execution is **weakly fair** (for processes) if no process that is continuously enabled from some point on is passed over for ever, i.e. every process that is enabled from some point on takes infinitely many steps. It is **strongly fair** if every process that is enabled infinitely often takes infinitely many steps. A fairness assumption restricts the set of executions considered; liveness properties are then required to hold on the fair executions only.`,
      idea: String.raw`Without fairness an adversarial scheduler can run one process for ever and never give the others a step, so almost no liveness property ("the program terminates", "the request is granted") is provable: the bad execution is infinite, and nothing finite refutes it (1.5). Fairness removes exactly those executions in which some enabled process starves. The program below terminates on every weakly fair execution, because P1 and P2 each remain enabled until they run and so must eventually run, after which P0 can leave its loop.`,
      caption: String.raw`P0 waits until P1 has set $x$ and P2 has set $y$, then finishes. You are the scheduler: the first row is an infinite schedule (the shaded cells repeat for ever); click a cell to change which process steps. Under it the run is unrolled. The panel on the right says whether each process is treated fairly. Try *spin P0 only*, then switch on *impose fairness* — the scheduler's loop gets every starved process added — and watch P0 finish.`,
      deps: ['dist-1.5'], refs: ['Lynch §8.3'], tags: ['fairness', 'scheduling'],
      credit: 'Lehmann, Pnueli & Stavi, 1981 (impartiality, justice, fairness); Francez, 1986 (book)',
      scope: String.raw`Weak fairness over three processes, schedules given as lassos (prefix followed by a repeated loop).`,
      viz(v) {
        const W = 12, L2 = ['0', '1', '2'], COL = ['gold', 'accent', 'purple'];
        const PRE = { spin: { w: '020000000000', k: 2 }, rr: { w: '012012012012', k: 0 }, pp: { w: '020202020202', k: 2 }, late: { w: '000000001200', k: 10 } };
        let word = PRE.spin.w.split('').map(Number);
        const kS = v.slider('loop starts at cell', 0, W - 1, PRE.spin.k, { int: true });
        const fair = v.toggle('impose fairness', false);
        v.select('example schedule', [{ value: 'spin', label: 'spin P0 only' }, { value: 'pp', label: 'P0 and P2 alternate' }, { value: 'rr', label: 'round robin' }, { value: 'late', label: 'fair, but late' }], 'spin', { onChange: (val) => { word = PRE[val].w.split('').map(Number); kS.set(PRE[val].k); } });
        const s1 = v.stage({ x: [-0.5, W + 0.5], y: [-0.1, 2.2], axes: false, height: 125, title: 'the scheduler: an infinite sequence of choices', weight: 1.4, minWidth: 360 });
        const s3 = v.stage({ x: [0, 10], y: [0, 4.2], axes: false, height: 125, title: 'is each process treated fairly?', weight: 1, minWidth: 260 });
        const s2 = v.stage({ x: [0, 36], y: [-1.2, 3.1], axes: 'box', gutter: true, height: 230, xlabel: 'step', ylabel: '', title: 'the execution', full: true });
        s1.onClick((x, y) => { const i = Math.floor(x); if (i >= 0 && i < W && y > 0 && y < 1.5) word[i] = (word[i] + 1) % 3; });
        // programs: P0 spins until x&&y then done; P1: x:=1 ; P2: y:=1
        const run = (pre, loop, steps) => {
          const seq = []; for (let i = 0; i < pre.length; i++) seq.push(pre[i]);
          while (seq.length < steps) for (const c of loop) seq.push(c);
          const st = { x: 0, y: 0, done: 0 }, tr = [];
          for (let i = 0; i < steps; i++) {
            const p = seq[i], before = { ...st }; let ev = 'idle';
            if (p === 0) { if (!st.done) { if (st.x && st.y) { st.done = 1; ev = 'done'; } else ev = 'spin'; } } else if (p === 1) { if (!st.x) { st.x = 1; ev = 'write'; } } else if (!st.y) { st.y = 1; ev = 'write'; }
            tr.push({ p, ev, before, after: { ...st }, inLoop: i >= pre.length });
          }
          return tr;
        };
        const enabled = (st, p) => (p === 0 ? !st.done : p === 1 ? !st.x : !st.y);
        const analyse = (pre, loop) => {
          const L = Math.max(1, loop.length), tr = run(pre, loop, pre.length + 6 * L), second = tr.slice(pre.length + 3 * L, pre.length + 4 * L);
          const inLoop = [0, 1, 2].map((p) => loop.includes(p));
          const unfair = [0, 1, 2].map((p) => !inLoop[p] && second.every((e) => enabled(e.before, p)));
          return { terminates: tr[tr.length - 1].after.done === 1, unfair, inLoop };
        };
        const effective = () => {
          const k = kS.value, pre = word.slice(0, k), loop = word.slice(k);
          if (!fair.value) return { pre, loop, added: [] };
          const A = analyse(pre, loop), added = [0, 1, 2].filter((p) => A.unfair[p]);
          return { pre, loop: loop.concat(added), added };
        };
        let ex = null;
        const exhaustive = () => {
          if (ex) return ex; let tot = 0, fairN = 0, fairBad = 0, unfairBad = 0, unfairGood = 0;
          const words = [[]]; for (let n = 1; n <= 3; n++) { const prev = words.filter((w) => w.length === n - 1); for (const w of prev) for (let c = 0; c < 3; c++) words.push([...w, c]); }
          for (const pre of words) for (const loop of words) { if (!loop.length) continue; tot++; const A = analyse(pre, loop), f = !A.unfair.some(Boolean); if (f) { fairN++; if (!A.terminates) fairBad++; } else if (A.terminates) unfairGood++; else unfairBad++; }
          ex = { tot, fairN, fairBad, unfairBad, unfairGood }; return ex;
        };
        v.render(() => {
          const k = kS.value, E = effective(), A = analyse(E.pre, E.loop), N = 36;
          s1.rect(k, -0.05, W, 1.55, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4, dash: true, radius: 6 });
          word.forEach((c, i) => { s1.rect(i + 0.06, 0.05, i + 0.94, 1.45, { fill: COL[c], fillAlpha: 0.3, color: COL[c], width: 1.5, radius: 5 }); s1.text(`P${c}`, i + 0.5, 0.75, { align: 'center', size: 12.5, color: 'ink' }); });
          s1.text('repeat for ever →', (k + W) / 2, 1.9, { align: 'center', size: 11.5, color: 'accent' });
          if (E.added.length) s1.text(`fairness adds ${E.added.map((p) => `P${p}`).join(', ')} to the loop`, (k + W) / 2, 1.9 - 0.0, { align: 'center', size: 11, color: 'green', dy: -14 });
          const tr = run(E.pre, E.loop, N);
          s2.setTicks(null, [[2, 'P0'], [1, 'P1'], [0, 'P2']]);
          for (let p = 0; p < 3; p++) s2.line(0, 2 - p, N, 2 - p, { color: 'faint', width: 1.2 });
          tr.forEach((e, i) => {
            const y = 2 - e.p, col = e.ev === 'done' ? 'green' : e.ev === 'write' ? 'green' : e.ev === 'spin' ? 'gold' : 'faint';
            s2.dot(i + 0.5, y, { r: 5.5, color: col, fill: e.ev === 'write' || e.ev === 'done' || e.ev === 'spin', hollow: e.ev === 'idle' });
            if (e.ev === 'write') s2.text(e.p === 1 ? 'x←1' : 'y←1', i + 0.5, y + 0.38, { size: 11, color: 'green', align: 'center' });
            if (e.ev === 'done') s2.text('done', i + 0.5, y + 0.38, { size: 11, color: 'green', align: 'center' });
          });
          const firstLoop = E.pre.length; if (E.loop.length) s2.vband(firstLoop, N, { color: 'accent', alpha: 0.05 });
          const done = tr.findIndex((e) => e.ev === 'done');
          s2.text(done >= 0 ? 'P0 terminates' : 'P0 spins for ever: the run is unrolled over 36 steps and repeats', done >= 0 ? done + 1 : 0.4, -0.75, { size: 12, color: done >= 0 ? 'green' : 'red', align: 'left' });
          for (let p = 0; p < 3; p++) {
            const y = 3.3 - p * 1.1, un = A.unfair[p], inL = A.inLoop[p];
            s3.circle(0.8, y, 0.3, { fill: COL[p], fillAlpha: 0.5, color: COL[p], width: 1.5 });
            s3.text(`P${p}`, 1.4, y, { size: 13, color: 'ink', align: 'left' });
            s3.text(inL ? 'steps infinitely often' : un ? 'STARVED: enabled, never runs' : 'finished: no longer enabled', 2.6, y, { size: 12, color: un ? 'red' : inL ? 'green' : 'muted', align: 'left' });
          }
        });
        v.legend([['gold', 'P0 spins'], ['green', 'a write / P0 finishing'], ['faint', 'step with no effect']]);
        v.readout(() => {
          const E = effective(), A = analyse(E.pre, E.loop), X = exhaustive(), fairRun = !A.unfair.some(Boolean);
          return `this schedule is **${fairRun ? 'weakly fair' : 'unfair'}**, and "P0 eventually finishes" is **${A.terminates ? 'true' : 'false'}** on it.\nexhaustive check over all ${X.tot} lasso schedules with prefix ≤ 3 and loop ≤ 3: **${X.fairN}** are fair and all but **${X.fairBad}** of them terminate; of the ${X.tot - X.fairN} unfair ones, **${X.unfairBad}** never terminate and ${X.unfairGood} terminate anyway.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Algorithm', name: 'Alternating bit protocol',
      statement: String.raw`A sender wants to deliver messages $m_1,m_2,\dots$ to a receiver over two channels (data and acknowledgements) that may lose or duplicate messages but never reorder them (FIFO). The sender attaches a bit $b$, initially 0, to the current message and retransmits it on timeout until it receives an acknowledgement carrying $b$; then it flips $b$ and moves to the next message. The receiver keeps an expected bit, initially 0; on a frame with bit $b$ it acknowledges $b$, and delivers the message only if $b$ equals the expected bit, which it then flips. Every message is delivered exactly once and in order.`,
      idea: String.raw`One bit suffices because over a FIFO channel the only ambiguity is between the current frame and its immediate predecessor: a frame with the wrong bit is always an old duplicate and is acknowledged but not delivered, and an acknowledgement with the wrong bit is always stale and ignored. The invariant that carries the proof (cf. 1.6): if $a$ messages have been acknowledged to the sender and $d$ delivered, then $a\le d\le a+1$, the sender's bit is $a \bmod 2$ and the receiver's expected bit is $d \bmod 2$. Every step preserves it, and retransmission after timeout gives progress as long as the channel does not lose everything.

The congruence classes modulo two (alg 1.30) give the precise meaning of the two bits: the sender stores the class of $a$ and the receiver the class of $d$. Flipping adds one modulo two. Under the stated invariant $d-a\in\{0,1\}$, the classes agree exactly when $d=a$; the adjacent case has the other class. This parity calculation distinguishes a current frame from its immediate predecessor under the FIFO assumptions. Parity alone does not prove progress on a channel that loses every retransmission.`,
      caption: String.raw`Space-time diagram of the sender (top) and receiver (bottom): data frames are blue (label = message·bit), acknowledgements are orange; ✕ marks a lost message, gold ticks are timeouts, a green number on the receiver's lane is a delivery. Click any arrow to force that message to be lost, or raise the loss and duplication sliders. Then break the protocol: remove the sequence bit, or the retransmission, and watch the delivered list go wrong.`,
      deps: ['dist-1.6','alg-1.30'], refs: ['Lynch §22.3'], tags: ['protocols', 'reliable delivery'],
      credit: 'Bartlett, Scantlebury & Wilkinson, 1969',
      scope: String.raw`FIFO channels with loss and duplication but no reordering and no corruption; one-way delay about $d$, timeout $\tau$.`,
      viz(v) {
        const mode = v.select('protocol', [{ value: 'abp', label: 'alternating bit' }, { value: 'nobit', label: 'no sequence bit' }, { value: 'noretx', label: 'no retransmission' }], 'abp');
        const K = v.select('messages', [{ value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' }], 4);
        const ls = v.slider('loss probability', 0, 0.6, 0.15, { step: 0.05 });
        const dp = v.slider('duplication probability', 0, 0.5, 0.2, { step: 0.05 });
        const dl = v.slider('delay $d$', 0.4, 1.6, 1, { step: 0.05 });
        const to = v.slider('timeout $\\tau$', 0.8, 5, 3, { step: 0.1 });
        let seed = 3; const forced = new Set();
        v.button('resample', () => { seed++; forced.clear(); });
        v.button('clear forced losses', () => { forced.clear(); });
        const s = v.stage({ x: [-1.5, 20], y: [-0.7, 1.7], axes: false, height: 300, title: 'sender and receiver over a lossy, duplicating channel', full: true });
        const go = () => runABP({ K: +K.value, loss: ls.value, dup: dp.value, d: dl.value, tmo: to.value, forced, mode: mode.value, seed });
        s.onClick((x, y) => { const R = go(), k = hitMsg(s, 2, R.msgs, s.X(x), s.Y(y), 11); if (k >= 0) { const key = R.msgs[k].baseKey; if (forced.has(key)) forced.delete(key); else forced.add(key); } });
        v.render(() => {
          const R = go(), T = Math.max(14, R.end + 1.2);
          s.setView([-1.9 * T / 20, T], [-0.7, 1.7]);
          drawLanes(s, 2, T, { names: ['sender', 'receiver'] });
          for (const m of R.msgs) {
            const frame = m.kind === 'D'; const col = frame ? 'accent' : 'orange';
            drawMsg(s, 2, { from: m.from, to: m.to, ts: m.ts, tr: m.tr, lost: m.lost, label: m.label }, { color: forced.has(m.baseKey) && m.lost ? 'red' : col, width: m.dup ? 1.2 : 1.9, labelColor: col, label: !m.dup });
          }
          for (const t of R.timeouts) { s.line(t, 1.0, t, 1.12, { color: 'gold', width: 3 }); s.text('timeout', t, 1.28, { align: 'center', size: 10, color: 'gold' }); }
          for (const dv of R.delivs) { s.dot(dv.t, 0, { r: 10, color: dv.dupe ? 'red' : 'green', fill: true }); s.text(String(dv.m + 1), dv.t, 0, { align: 'center', size: 10.5, color: 'panel', halo: false }); }
          s.text('time →', T - 0.1, -0.58, { align: 'right', size: 11, color: 'muted' });
        });
        v.legend([['accent', 'data frame (message·bit)'], ['orange', 'acknowledgement'], ['green', 'delivery to the receiving process', { dot: true }], ['red', 'duplicate delivery / forced loss']]);
        v.readout(() => {
          const R = go(), n = +K.value, sent = range(n).map((i) => i + 1), ok = R.delivered.length === n && R.delivered.every((m, i) => m === i);
          return `sent: ${sent.join(', ')} · delivered: **${R.delivered.map((m) => m + 1).join(', ') || '—'}** → ${ok ? '**exactly once, in order**' : '**WRONG**' + (R.delivered.length < n ? ` (only ${R.delivered.length} of ${n} arrived)` : '')}\nframes sent ${R.nFrames} (retransmissions ${R.rtx}), acks ${R.nAcks}, lost ${R.msgs.filter((m) => m.lost).length}${mode.value === 'abp' ? ` · invariant $a\\le d\\le a+1$, bits $= a, d \\bmod 2$ checked at every event: **${R.viol ? R.viol + ' violations' : 'never violated'}**` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Paper', name: 'A Protocol for Packet Network Intercommunication',
      paper: { authors: 'Vinton G. Cerf and Robert E. Kahn', year: 1974, title: 'A Protocol for Packet Network Intercommunication', venue: 'IEEE Transactions on Communications 22 (5): 637–648', doi: '10.1109/TCOM.1974.1092259' },
      introduces: ['tech-12.6'],
      statement: String.raw`Cerf and Kahn proposed a protocol for sharing resources among processes in *different* packet-switched networks. Networks are joined by **gateways**; a **transmission control program (TCP)** in each host cuts a process's messages into segments, each segment travels in an internetwork packet with a header carrying source and destination, a sequence number SEQ (the position of its first byte in the stream), a byte count CT, flags ES and EM (end of segment, end of message) and a checksum; a gateway may *fragment* a packet that is too large for the next network, rewriting SEQ and CT; the receiving TCP reassembles bytes by position. Reliability comes from timeout, retransmission and positive acknowledgement within a sliding window of $w$ bytes over sequence numbers $0,\dots,n-1$ (arithmetic modulo $n$), with $w<n/2$; the acknowledgement names the next sequence number the receiver expects.`,
      idea: String.raw`Before the paper each network had its own packet size, addressing and reliability, and nothing spanned them. The paper put reliability *end to end*, in the hosts, so the networks in between may lose, duplicate, reorder or fragment packets (the protocol is the alternating-bit idea of 1.9 generalised from one bit to a window of bytes). Numbering bytes rather than packets makes fragmentation and re-fragmentation harmless, and the window together with the bound $w<n/2$ keeps a stale retransmission from being mistaken for new data. The design became TCP, and with the gateway idea the Internet (tech-12.6).`,
      caption: String.raw`The paper's Fig. 9 and Fig. 10 in motion: a 36-byte message crosses network A to a gateway, which fragments packets for network B's smaller maximum size, then reaches the receiver. Step through (or drag the scrubber): packets are lost, the window slides, acknowledgements name the next sequence number expected. The byte rows show the sender's view (acknowledged, in flight) and the receiver's (delivered, buffered), with the left window edges marked. Squeeze the sequence space $n$ below $2w$ and some runs reassemble garbage. Packet labels use the paper's field names; the parameters are illustrative.`,
      deps: ['tech-12.5', 'dist-1.1', 'dist-1.9'], refs: [], tags: ['TCP', 'internetworking'],
      credit: 'Cerf & Kahn, 1974',
      scope: String.raw`Single message, one direction of data; losses are independent with the chosen probability on network B's hop and on acknowledgements. Not the paper's own data: the paper gives no experiment, so this reproduces its mechanisms (Figs. 9–10 and the window rules).`,
      viz(v) {
        const redo = () => { if (S) S.reset({ at: 'start' }); };
        const sg = v.slider('segment size', 4, 12, 8, { int: true, onChange: redo });
        const mx = v.slider('network B max packet', 2, 8, 3, { int: true, onChange: redo });
        const wS = v.slider('window $w$', 4, 36, 16, { int: true, onChange: redo });
        const nS = v.slider('sequence space $n$', 12, 96, 64, { int: true, onChange: redo });
        const lS = v.slider('loss probability', 0, 0.5, 0.2, { step: 0.05, onChange: redo });
        const sdS = v.select('loss pattern', [1, 2, 3, 4, 5, 6].map((x) => ({ value: x, label: `#${x}` })), 2, { onChange: redo });
        const N = 36;
        const sN = v.stage({ x: [0, 10], y: [-1.3, 3.9], axes: false, height: 220, title: 'two networks joined by a gateway', full: true });
        const sB = v.stage({ x: [-3.6, N + 0.2], y: [-1.4, 3.2], axes: false, height: 175, title: 'the byte stream (positions 0 … 35)', full: true });
        const par = () => ({ N, S: sg.value, m: mx.value, w: wS.value, n: nS.value, loss: lS.value, seed: sdS.value });
        const CODE = ['Sender: transmit segments whose text lies in L … L+w−1', 'Sender: on timeout retransmit the unacknowledged bytes', 'Sender: on ACK(e) advance the left window edge L over the acknowledged bytes', 'Gateway: split a packet that is too big for the next network; fix SEQ, CT, ES, EM in each piece', 'Receiver: SEQ at the left edge → accept, advance the edge, ACK the next sequence number expected', 'Receiver: SEQ inside the window but not at the edge → keep it, ACK the edge', 'Receiver: SEQ outside the window → discard, ACK the edge'];
        const S = v.steps({ frames: () => runTCP(par()).frames, code: CODE, codeTitle: 'the paper’s rules', still: 40, speed: 2.5 });
        const place = (kind, i) => (kind === 'A' ? [3.3, 2.7 + 0.5 * i] : kind === 'B' ? [6.7, 2.7 + 0.5 * i] : [5, 1.0 - 0.5 * i]);
        v.render(() => {
          const f = S.frame; if (!f || f.la == null) return;
          const box = (x, y, t, c) => { sN.rect(x - 1.1, y - 0.45, x + 1.1, y + 0.45, { fill: c, fillAlpha: 0.14, color: c, width: 2, radius: 8 }); sN.text(t, x, y, { align: 'center', size: 12.5, color: 'ink' }); };
          box(1.2, 1.8, 'sender TCP', 'accent'); box(5, 1.8, 'GATEWAY', 'orange'); box(8.8, 1.8, 'receiver TCP', 'green');
          sN.text('network A', 3.1, 0.95, { align: 'center', size: 11.5, color: 'muted' }); sN.text('network B (smaller packets)', 6.9, 0.95, { align: 'center', size: 11.5, color: 'muted' });
          sN.line(2.3, 1.8, 3.9, 1.8, { color: 'faint', width: 2.5 }); sN.line(6.1, 1.8, 7.7, 1.8, { color: 'faint', width: 2.5 });
          sN.text('acknowledgements travel back: ACK = next sequence number expected', 5, -0.95, { align: 'center', size: 11, color: 'orange' });
          sN.arrow(7.7, 0.35, 2.3, 0.35, { color: 'orange', width: 1.4, alpha: 0.6 });
          const cnt = { A: 0, B: 0, ACK: 0 };
          for (const t of f.flight) {
            const i = cnt[t.link]++; if (i > 3) continue;
            const [x, y] = t.link === 'ACK' ? [5, 0.05 - 0.45 * i] : t.link === 'A' ? [3.1, 2.55 + 0.5 * i] : [6.9, 2.55 + 0.5 * i];
            const c = t.lost ? 'red' : t.link === 'ACK' ? 'orange' : 'accent', w = t.link === 'ACK' ? 1.25 : 1.4;
            sN.rect(x - w, y - 0.19, x + w, y + 0.19, { fill: c, fillAlpha: t.lost ? 0.2 : 0.22, color: c, width: 1.4, radius: 5 });
            sN.text(t.label + (t.lost ? '  ✕' : ''), x, y, { align: 'center', size: 10.5, color: t.lost ? 'red' : 'ink', halo: false });
          }
          for (const k of ['A', 'B', 'ACK']) if (cnt[k] > 4) sN.text(`+${cnt[k] - 4} more`, k === 'A' ? 3.1 : k === 'B' ? 6.9 : 5, k === 'ACK' ? -0.55 : 4.45, { align: 'center', size: 10.5, color: 'muted' });
          // byte rows
          for (let b = 0; b < N; b++) {
            const acked = b < f.la, sent = b < f.next && !acked, inWin = b >= f.la && b < f.la + wS.value;
            const sc = acked ? 'green' : sent ? 'gold' : inWin ? 'accent' : 'faint';
            sB.rect(b + 0.07, 1.6, b + 0.93, 2.4, { fill: sc, fillAlpha: acked || sent ? 0.55 : inWin ? 0.2 : 0.08, color: sc, width: 1, radius: 2 });
            const deliv = b < f.R, got = f.buf[b] != null && b >= f.R, bad = f.buf[b] != null && f.buf[b] !== b;
            const rc = bad ? 'red' : deliv ? 'green' : got ? 'teal' : 'faint';
            sB.rect(b + 0.07, 0.1, b + 0.93, 0.9, { fill: rc, fillAlpha: deliv || got ? 0.55 : 0.08, color: rc, width: 1, radius: 2 });
            if (b % 4 === 0) sB.text(String(b), b + 0.5, 2.7, { align: 'center', size: 9.5, color: 'muted' });
          }
          sB.text('sender', -0.5, 2.0, { align: 'right', size: 12, color: 'ink' }); sB.text('receiver', -0.5, 0.5, { align: 'right', size: 12, color: 'ink' });
          const w = wS.value;
          sB.rect(f.la, 1.5, Math.min(N, f.la + w), 2.5, { color: 'accent', width: 2.4, radius: 3 }); sB.text(`L (window w = ${wS.value})`, f.la, 3.0, { align: 'left', size: 11.5, color: 'accent' });
          sB.rect(f.R, 0.0, Math.min(N + 0.0, f.R + w), 1.0, { color: 'green', width: 2.4, radius: 3, dash: true }); sB.text('left edge', f.R, -0.35, { align: 'center', size: 11.5, color: 'green' });
          sB.text(`SEQ is a byte position mod n = ${nS.value}`, N, -0.35, { align: 'right', size: 11, color: 'muted' });
        });
        v.legend([['green', 'acknowledged / delivered', { area: true }], ['gold', 'sent, not yet acknowledged', { area: true }], ['teal', 'buffered out of order', { area: true }], ['red', 'garbage reassembled', { area: true }]]);
        v.readout(() => {
          const f = S.frame, p = par(), last = S.frames[S.n - 1]; if (!f || f.la == null) return '';
          const mc = monteCarloTCP(p, 100), amb = 2 * p.w > p.n;
          return `SEQ/CT/flags as in Fig. 9 (ES = end of segment, EM = end of message) · time ${v.fix(f.t, 1)} · left edges: sender $L=${f.la}$, receiver $=${f.R}$ · delivered ${f.R}/${N}${f.corrupt ? ` · **${f.corrupt} wrong byte(s)**` : ''}\nthe paper requires $w<n/2$: here $w=${p.w}$, $n/2=${p.n / 2}$ → a retransmission **${amb ? 'can' : 'cannot'}** be mistaken for new data. Over 100 random loss patterns: **${mc.bad}** reassemble wrongly or stall (${mc.corrupt} garbage, ${mc.stall} incomplete).\nthe paper: 8-bit network id (256 networks), 16-bit TCP id, 16-bit ports; today's IPv4 uses 32-bit addresses and TCP still 16-bit ports.${S.i === S.n - 1 ? `\nfinal: ${last.corrupt ? '**corrupted**' : last.R === N ? '**message reassembled exactly**' : 'incomplete'}` : ''}`;
        });
      },
    },
  ],
};
