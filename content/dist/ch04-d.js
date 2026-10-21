// Distributed Computing — Chapter 4, part d: item 4.13 (Dijkstra 1965, landmark paper)
import { flagSpec, mxSim, explore } from './ch04.shared.js';
import {bulkConcurrency as bulk} from './concurrency-sources-audit.shared.js';

const specs = new Map();
const getSpec = (kind, n) => { const k = kind + n; if (!specs.has(k)) specs.set(k, flagSpec(n, kind)); return specs.get(k); };

export default {
  collection: 'dist',
  chapter: 4,
  items: [
    {
      num: '4.13', kind: 'Paper', name: 'Solution of a Problem in Concurrent Programming Control',
      paper: { authors: 'E. W. Dijkstra', year: 1965, title: 'Solution of a Problem in Concurrent Programming Control', venue: 'Communications of the ACM 8 (9): 569', doi: '10.1145/365559.365617' },
      introduces: ['dist-4.1'],
      statement: String.raw`In a one-page note Dijkstra posed the mutual exclusion problem for $N$ cyclic processes that communicate only through a common store whose single reads and writes are indivisible, and gave a program that solves it: at most one process is ever in its critical section, no speed assumptions are made about the processes, a process that stays in its remainder never blocks the others, and if several processes want to enter, one of them does so in finite time. The program uses two Boolean arrays $b[1..N]$, $c[1..N]$ (all initially true) and an integer $k$. It does not promise that a particular process cannot be overtaken forever.`,
      idea: String.raw`The note explicitly lists symmetry, arbitrary relative speeds, harmless stopping in the remainder, and absence of infinite global blocking. Each process sets its own $b_i$ false, competes for the current candidate $k$, sets its own $c_i$ false only when $k=i$, and scans the other $c_j$. Two successful scans cannot overlap while both own flags remain false. For progress, once all pending assignments to $k$ have completed, $k$ points to an active contender until it finishes; the others eventually restore their $c_j$, letting that contender enter. The proof allows reads and their consequent writes to be separated by arbitrary delays. This is global progress, not a guarantee for every individual contender.`,
      caption: String.raw`Schedule a transcription checked against the original note. Every displayed instruction performs at most one shared-word read or write; the index read in $b[k]$, the Boolean read, and the subsequent write to $k$ are separate. Explore every schedule checks the finite state graph for two critical processes and a state where every scheduler step leaves the entire state unchanged. The latter is a fixed-state deadlock check, not a proof excluding every infinite livelock. Random steps are one finite seeded sample. The two naive protocols provide actual counterexamples.`,
      deps: ['dist-1.4'], refs: ['Dijkstra (1965), complete one-page note, p. 569'], tags: ['mutual exclusion', 'history'],
      credit: 'Dijkstra, 1965',
      scope: String.raw`Atomic single-word reads and writes, initially true $b_i,c_i$ and any valid candidate $k$. Source reasoning is for general $N$ under continued activity outside the remainder; the finite model checker is limited to the selected $N=2,3$ and reports an inconclusive result if capped. A random-run wait is measured in all scheduled steps and can be censored by the finite run. It does not establish starvation freedom.`,
      links: { doi: 'https://doi.org/10.1145/365559.365617', source: 'https://rust-class.org/static/classes/class19/dijkstra.pdf' },
      viz(v) {
        const nS = v.select('processes', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const kind = v.select('protocol', [{ value: 'dijkstra', label: 'Dijkstra 1965' }, { value: 'flags', label: 'raise flag, then wait' }, { value: 'look', label: 'look, then raise flag' }], 'dijkstra');
        const get = () => getSpec(kind.value, nS.value);
        const Z = mxSim(v, get, { nMax: 3, maxLines: 12, tHeight: 150, limit: 200000 });
        let B = null, nextSeed = 17;
        v.button('3000 random steps', () => { B = bulk(get(), 3000, nextSeed++); B.spec = get(); });
        v.readout(() => {
          const sp = get(), ex = Z.cache.get(sp.id);
          const claims = ex ? `Explored ${ex.count}${ex.capped?'+':''} states${ex.capped?' (capped: incomplete)':''}: ${ex.bad>=0?'**mutual exclusion fails**':ex.capped?'no safety violation found in the explored subset':'mutual exclusion holds in the complete finite graph'}; ${ex.dead>=0?'**fixed-state deadlock reachable**':ex.capped?'no fixed-state deadlock found in the explored subset':'no fixed-state deadlock in that graph'}. Infinite-run progress is a separate source argument.` : 'Press *explore every schedule* to search the finite state graph.';
          const bk = B && B.spec === sp ? ` Seed ${B.seed}, 3000 scheduled steps: ${B.viol} states with two critical processes; entries ${B.entries.join(', ')}; longest observed trying stretches ${B.longest.join(', ')} steps (possibly censored)${B.frozen?'; **fixed-state deadlock at the final state**':''}.` : '';
          return `${Z.status()}\n${claims}${bk}`;
        });
      },
    },
  ],
};
void explore;
