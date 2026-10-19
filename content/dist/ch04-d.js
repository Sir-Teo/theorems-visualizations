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
      statement: String.raw`In a one-page note Dijkstra posed the mutual exclusion problem for $N$ cyclic processes that communicate only through a common store whose single reads and writes are indivisible, and gave a program that solves it: at most one process is ever in its critical section, no relative-speed bounds are imposed on processes that continue taking steps, a process that stays in its remainder never blocks the others, and if several processes want to enter, one of them does so in finite time. The program uses two Boolean arrays $b[1..N]$, $c[1..N]$ (all initially true) and an integer $k\in\{1,\dots,N\}$ whose initial value is arbitrary. It does not promise that a particular process cannot be overtaken forever.`,
      idea: String.raw`Each process first makes $b[i]$ false to announce its interest. Contenders compete for $k$, but can replace it only after observing that its current owner is outside the competition. Once those already-decided assignments finish, $k$ names a contender and stays fixed until that process finishes its critical section. The other contenders must then make their $c$ flags true, allowing the chosen process to finish its scan. For safety, every entrant first makes its own $c$ flag false and then reads all the others as true; two entrants cannot both complete those scans while keeping their own flags false. This is a guarantee of system-wide progress under continued execution, without a bound on any particular process's wait.`,
      caption: String.raw`Be the scheduler for the original protocol, with the read of $k$, the read of $b[k]$ and the conditional write to $k$ shown as separate steps. *explore every schedule* searches reachable states for the chosen $N$ and reports whether its state limit was reached. It checks mutual exclusion and whether a lone contender can enter; absence of a frozen state is weaker than a proof against livelock. *3000 random steps* reports observed entries and waiting times. Compare the naive protocols: *raise a flag, then wait* deadlocks, while *look, then raise* allows simultaneous entry.`,
      deps: ['dist-1.4'], refs: ['Dijkstra (1965), CACM 8(9), p. 569; original note in scanned reprint, pp. 348–350'], tags: ['mutual exclusion', 'history'],
      credit: 'Dijkstra, 1965',
      scope: String.raw`Sequentially consistent, indivisible single-word reads and writes; only process $i$ writes $b[i]$ and $c[i]$. The simulator uses zero-based indices and a local snapshot to evaluate $b[k]$ without making the following write atomic. The original note's proof supports general $N$ under continued execution; the finite-state search here covers $N=2,3$ subject to its displayed state limit. It does not prove starvation freedom or fairness of the scheduler. Random waiting-time measurements are observations only.`,
      links: { doi: 'https://doi.org/10.1145/365559.365617', source: 'https://harrymoreno.com/assets/greatPapersInCompSci/5.2_-_Solution_to_a_problem_in_concurrent_process_control-Edsger_W._Dijkstra.pdf' },
      viz(v) {
        const nS = v.select('processes', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const kind = v.select('protocol', [{ value: 'dijkstra', label: 'Dijkstra 1965' }, { value: 'flags', label: 'raise flag, then wait' }, { value: 'look', label: 'look, then raise flag' }], 'dijkstra');
        const get = () => getSpec(kind.value, nS.value);
        const Z = mxSim(v, get, { nMax: 3, maxLines: 12, tHeight: 150, limit: 200000 });
        let B = null;
        v.button('3000 random steps', () => { B = bulk(get(), 3000, 17 + (B ? B.seed + 1 : 0)); B.seed = (B.seed || 0) + 1; B.spec = get(); });
        v.readout(() => {
          const sp = get(), ex = Z.cache.get(sp.id);
          const claims = ex ? `${ex.capped ? 'Bounded search' : 'Complete reachable-state search'} over ${ex.count} states${ex.capped ? ' (state limit reached)' : ''}: ${ex.bad >= 0 ? '**mutual exclusion fails**' : 'no mutual-exclusion violation found'}; ${ex.dead >= 0 ? '**frozen state reachable**' : 'no frozen state found'}; ${ex.solo >= 0 ? '**lone contender can be blocked**' : 'no blocked lone contender found'}. This does not check livelock or starvation freedom.` : 'Press *explore every schedule* to check all interleavings.';
          const bk = B && B.spec === sp ? ` Random run of 3000 steps: ${B.viol} steps with two processes critical; entries per process ${B.entries.join(', ')}; longest wait ${B.longest.join(', ')} steps${B.frozen ? '; no state change in the final 200 scheduler steps' : ''}.` : '';
          return `${Z.status()}\n${claims}${bk}`;
        });
      },
    },
  ],
};
void explore;
