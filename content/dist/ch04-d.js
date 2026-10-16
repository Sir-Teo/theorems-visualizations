// Distributed Computing — Chapter 4, part d: item 4.13 (Dijkstra 1965, landmark paper)
import { flagSpec, mxSim, mulberry32, explore } from './ch04.shared.js';

const specs = new Map();
const getSpec = (kind, n) => { const k = kind + n; if (!specs.has(k)) specs.set(k, flagSpec(n, kind)); return specs.get(k); };

/** Long random run: violations, deadlock and entries per process. */
function bulk(spec, steps, seed) {
  const r = mulberry32(seed), S = spec.init(), n = spec.n, entries = Array(n).fill(0), wait = Array(n).fill(0), longest = Array(n).fill(0);
  let viol = 0, stuck = 0, last = '';
  for (let t = 0; t < steps; t++) {
    const p = Math.floor(r() * n), before = spec.reg(S, p);
    spec.step(S, p);
    const after = spec.reg(S, p);
    if (before !== 'C' && after === 'C') { entries[p]++; wait[p] = 0; }
    for (let q = 0; q < n; q++) if (spec.reg(S, q) === 'T') { wait[q]++; longest[q] = Math.max(longest[q], wait[q]); } else wait[q] = 0;
    if (S.pc.filter((c) => spec.prog[c].reg === 'C').length >= 2) viol++;
    const key = JSON.stringify(S); stuck = key === last ? stuck + 1 : 0; last = key;
  }
  return { viol, entries, longest, frozen: stuck > 200 };
}

export default {
  collection: 'dist',
  chapter: 4,
  items: [
    {
      num: '4.13', kind: 'Paper', name: 'Solution of a Problem in Concurrent Programming Control',
      paper: { authors: 'E. W. Dijkstra', year: 1965, title: 'Solution of a Problem in Concurrent Programming Control', venue: 'Communications of the ACM 8 (9): 569', doi: '10.1145/365559.365617' },
      introduces: ['dist-4.1'],
      statement: String.raw`In a one-page note Dijkstra posed the mutual exclusion problem for $N$ cyclic processes that communicate only through a common store whose single reads and writes are indivisible, and gave a program that solves it: at most one process is ever in its critical section, no speed assumptions are made about the processes, a process that stays in its remainder never blocks the others, and if several processes want to enter, one of them does so in finite time. The program uses two Boolean arrays $b[1..N]$, $c[1..N]$ (all initially true) and an integer $k$. It does not promise that a particular process cannot be overtaken forever.`,
      idea: String.raw`Before the paper, solutions were known only for two processes (Dekker's, communicated by Dijkstra himself), and the requirements had never been listed so cleanly: no assumption on relative speeds, no deadlock, arbitrary pauses in the remainder. The paper turned a programming trick into a problem with a specification: the properties (a)–(c) of 4.1. Its algorithm lets processes first compete for a variable $k$ naming the current candidate, and a candidate enters only after it has claimed (set $c[i]$ false) and seen that nobody else has also claimed. Knuth (1966) and de Bruijn (1967) published later notes on the possibility that an individual process is overtaken indefinitely, and Peterson's algorithm (4.2) and Lamport's bakery (4.3) later gave much simpler or fairer solutions.`,
      caption: String.raw`Be the scheduler for Dijkstra's program (the pseudocode is the one of the note as I recall it, and the exhaustive search below confirms its two safety claims for the chosen $N$). *explore every schedule* visits all reachable states: none has two processes critical and none is deadlocked. *3000 random steps* is a long fair-ish run reporting violations, entries per process and the longest wait. Switch to the naive protocols: *raise a flag, then wait* deadlocks when both raise together, and *look, then raise* lets two processes in. The readout compares the paper's claims with what is measured.`,
      deps: ['dist-1.4'], refs: [], tags: ['mutual exclusion', 'history'],
      credit: 'Dijkstra, 1965', verify: true,
      scope: String.raw`The program is transcribed from memory of the note; the search verifies safety and progress of this transcription for $N\le 3$ (all interleavings), not for general $N$. Starvation behaviour is reported from random runs, not proved.`,
      links: { doi: 'https://doi.org/10.1145/365559.365617' },
      viz(v) {
        const nS = v.select('processes', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const kind = v.select('protocol', [{ value: 'dijkstra', label: 'Dijkstra 1965' }, { value: 'flags', label: 'raise flag, then wait' }, { value: 'look', label: 'look, then raise flag' }], 'dijkstra');
        const get = () => getSpec(kind.value, nS.value);
        const Z = mxSim(v, get, { nMax: 3, maxLines: 10, tHeight: 150, limit: 200000 });
        let B = null;
        v.button('3000 random steps', () => { B = bulk(get(), 3000, 17 + (B ? B.seed + 1 : 0)); B.seed = (B.seed || 0) + 1; B.spec = get(); });
        v.readout(() => {
          const sp = get(), ex = Z.cache.get(sp.id);
          const claims = ex ? `Exhaustive search over ${ex.count} states: mutual exclusion ${ex.bad >= 0 ? '**fails**' : 'holds'}; deadlock ${ex.dead >= 0 ? '**reachable**' : 'unreachable'}.` : 'Press *explore every schedule* to check all interleavings.';
          const bk = B && B.spec === sp ? ` Random run of 3000 steps: ${B.viol} steps with two processes critical; entries per process ${B.entries.join(', ')}; longest wait ${B.longest.join(', ')} steps${B.frozen ? '; **the system froze** (deadlock)' : ''}.` : '';
          return `${Z.status()}\n${claims}${bk}`;
        });
      },
    },
  ],
};
void explore;
