// Distributed Computing — Chapter 4: Mutual exclusion and shared objects (items 4.1–4.4; 4.5–4.8 in ch04-b.js, 4.9–4.12 in ch04-c.js, 4.13 in ch04-d.js)
import { REGCOL, noneSpec, ctsSpec, tasSpec, petersonSpec, bakerySpec, mxSim, mulberry32, range, drawLanes, ly } from './ch04.shared.js';
import {erasureExperiment} from './concurrency-sources-audit.shared.js';

const specCache = new Map();
const cached = (key, mk) => { if (!specCache.has(key)) specCache.set(key, mk()); return specCache.get(key); };
const entries = (Z) => { const e = [0, 0, 0]; Z.hist.forEach((h, k) => { if (k) h.reg.forEach((r, p) => { if (r === 'C' && Z.hist[k - 1].reg[p] !== 'C') e[p]++; }); }); return e; };

export default {
  collection: 'dist',
  chapter: 4,
  title: 'Mutual exclusion and shared objects',
  summary: String.raw`Mutual exclusion with only reads and writes is subtle: Peterson’s and Lamport’s bakery algorithms achieve it, and any solution needs as many registers as processes. Over networks, logical clocks order the requests. Symmetric resource sharing, as among dining philosophers, needs asymmetry or randomness. Linearizability defines what it means for a concurrent object to behave atomically; snapshot objects can be built wait-free, and atomic registers can be emulated over messages as long as a majority survives.`,
  items: [
    {
      num: '4.1', kind: 'Definition', name: 'The mutual exclusion problem',
      statement: String.raw`$n$ processes share memory and each repeatedly passes through four regions: **remainder** (not interested), **trying** (running the entry protocol), **critical** (using the shared resource) and **exit** (running the exit protocol). A *mutual exclusion algorithm* is a choice of entry and exit code such that, in every execution in which no process stays forever in its critical or exit region:
(a) **mutual exclusion**: at no moment are two processes in the critical region;
(b) **progress** (deadlock-freedom): if some process is trying and nobody is critical, some process eventually becomes critical;
(c) often also **lockout-freedom**: every trying process eventually becomes critical. Stronger fairness such as bounded bypass or first-come-first-served may be asked as well.`,
      idea: String.raw`The definition separates the guarantee from the mechanism. Mutual exclusion is a safety property (1.5), so one finite bad prefix refutes an algorithm, and an exhaustive search can find it; progress and lockout-freedom are liveness properties, refuted only by an infinite run, usually a loop in which a process spins forever. With plain reads and writes the difficulty is that a process can look at a register and be overtaken before it acts on what it saw; the shared-memory model is 1.4.`,
      caption: String.raw`Pick a protocol and be the scheduler: *step P0/P1/P2* executes one atomic action of that process, *20 random steps* lets chance drive. With no protocol two processes soon sit in the critical section (red columns). The look-then-set lock fails only under a specific interleaving, which *explore every schedule* finds exhaustively and *replay* runs. The test-and-set lock is safe, because its test and write are one atomic step, but a schedule can still starve a process: press the starvation button and watch P2 spin forever while P0 and P1 pass the lock back and forth.`,
      deps: ['dist-1.4', 'dist-1.5'], refs: ['Lynch §10.2', 'Attiya–Welch ch. 4'], tags: ['mutual exclusion', 'safety and liveness'],
      scope: String.raw`Asynchronous shared memory; the properties are required of every execution in which processes keep taking steps. The third protocol needs an atomic read-modify-write, not just reads and writes.`,
      credit: 'Dijkstra, 1965', links: { wikipedia: 'https://en.wikipedia.org/wiki/Mutual_exclusion' },
      viz(v) {
        const proto = v.select('protocol', [{ value: 'none', label: 'no protocol' }, { value: 'cts', label: 'look, then set a lock' }, { value: 'tas', label: 'atomic test-and-set lock' }], 'none');
        const get = () => cached('4.1' + proto.value, () => (proto.value === 'none' ? noneSpec(3) : proto.value === 'cts' ? ctsSpec(3) : tasSpec(3)));
        const Z = mxSim(v, get, { nMax: 3, maxLines: 5 });
        const starve = v.button('starve P2 (adversarial schedule)', () => {
          Z.reset();
          const sched = [0, 0, 1, 2];
          for (let c = 0; c < 8; c++) { const h = c % 2, o = 1 - h; sched.push(2, h, 2, h, o, 2, h); }
          Z.run(sched);
        });
        v.render(() => { starve.hidden = proto.value !== 'tas'; });
        v.readout(() => `${Z.status()}\nEntries into the critical section so far: P0 ${entries(Z)[0]}, P1 ${entries(Z)[1]}, P2 ${entries(Z)[2]}. ${Z.exText()}`);
      },
    },
    {
      num: '4.2', kind: 'Algorithm', name: 'Peterson’s algorithm',
      statement: String.raw`Two processes $i\in\{0,1\}$ (with $j=1-i$) share the bits $\mathrm{flag}[0],\mathrm{flag}[1]$ (initially false) and a variable $\mathrm{turn}$. Entry: set $\mathrm{flag}[i]\leftarrow\text{true}$, then $\mathrm{turn}\leftarrow j$, then wait until $\neg\mathrm{flag}[j]$ or $\mathrm{turn}=i$. Exit: $\mathrm{flag}[i]\leftarrow\text{false}$. Using only atomic reads and writes this guarantees mutual exclusion and lockout-freedom, with bounded bypass: after $i$ starts waiting, $j$ enters at most once before $i$ does.`,
      idea: String.raw`A process announces interest by its flag and then *yields* by giving the turn to the other. If both are interested, whoever wrote $\mathrm{turn}$ last has handed priority away, so exactly one wait condition holds. Mutual exclusion is the invariant "if $i$ is critical then $\mathrm{flag}[i]$ is true and either $\mathrm{flag}[j]$ is false or $\mathrm{turn}=i$", plus the observation that the later of the two writes to $\mathrm{turn}$ decides. The order of the first two lines matters: writing $\mathrm{turn}$ before raising the flag breaks the proof, and the explorer finds the interleaving.`,
      caption: String.raw`The program, the schedule strip and the *state-space table*: rows are P0's line, columns P1's line, and each cell counts the reachable states (flag and turn values) with that pair of positions; the gold ring is where your schedule is now. For the correct algorithm the (critical, critical) cell stays empty. Switch to *turn before flag*, *flags only* or *turn only* and press *explore every schedule*: the first lets both in (replay shows the bad schedule), the second deadlocks, the third is safe but P0 cannot enter while P1 stays in the remainder.`,
      deps: ['dist-4.1'], refs: ['Lynch §10.5.1'], tags: ['mutual exclusion', 'shared memory'],
      scope: String.raw`Two processes, atomic read/write registers. Generalisations to $n$ processes use a tournament tree of such locks (or a filter lock).`,
      credit: 'Peterson, 1981', links: { doi: 'https://doi.org/10.1016/0020-0190(81)90106-X', wikipedia: 'https://en.wikipedia.org/wiki/Peterson%27s_algorithm' },
      viz(v) {
        const variant = v.select('version', [{ value: 'ok', label: 'Peterson' }, { value: 'swap', label: 'turn before flag' }, { value: 'flags', label: 'flags only' }, { value: 'turn', label: 'turn only' }], 'ok');
        const get = () => cached('4.2' + variant.value, () => petersonSpec(variant.value));
        const Z = mxSim(v, get, { nMax: 2, maxLines: 6, tHeight: 150 });
        const sTab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true, title: 'reachable states by position of P0 (rows) and P1 (columns)' });
        const T = v.table(sTab, { rows: 6, cols: 6, square: true, maxCell: 40, cornerLabel: 'P0 \\ P1' });
        v.render(() => {
          const sp = get(), ex = Z.explore(), L = sp.prog.length;
          const lab = (k) => `${k}${sp.prog[k].reg === 'C' ? '*' : ''}`;
          const crit = (k) => sp.prog[k].reg === 'C';
          T.draw({
            rows: L, cols: L, rowLabels: range(L).map(lab), colLabels: range(L).map(lab),
            rowLabelColor: (k) => REGCOL[sp.prog[k].reg] === 'faint' ? 'muted' : REGCOL[sp.prog[k].reg], colLabelColor: (k) => REGCOL[sp.prog[k].reg] === 'faint' ? 'muted' : REGCOL[sp.prog[k].reg],
            value: (i, j) => (ex.cnt[i][j] || (crit(i) && crit(j)) ? ex.cnt[i][j] : null),
            fill: (i, j) => (crit(i) && crit(j) ? ['red', ex.cnt[i][j] ? 0.55 : 0.15] : ex.cnt[i][j] ? ['accent', 0.2] : null),
            highlight: [[Z.S.pc[0], Z.S.pc[1], 'gold']],
          });
        });
        v.readout(() => `${Z.status()}\n${Z.exText()} A star marks the critical section; a nonzero cell with a star on both sides would be a violation.`);
      },
    },
    {
      num: '4.3', kind: 'Algorithm', name: 'Lamport’s bakery algorithm',
      statement: String.raw`Each of $n$ processes owns two registers it alone writes: a flag $\mathrm{choosing}[i]$ and a ticket $\mathrm{number}[i]$ (0 = not interested). To enter, $i$ raises $\mathrm{choosing}[i]$, reads all tickets and writes $\mathrm{number}[i]=1+\max_j \mathrm{number}[j]$ (the reads need not be atomic together), lowers $\mathrm{choosing}[i]$, and then for every $j\ne i$ waits until $\neg\mathrm{choosing}[j]$ and until $\mathrm{number}[j]=0$ or $(\mathrm{number}[i],i)<(\mathrm{number}[j],j)$ lexicographically. On exit $\mathrm{number}[i]\leftarrow0$. The algorithm guarantees mutual exclusion and first-come-first-served order among processes whose ticket-taking does not overlap; tickets can grow without bound.`,
      idea: String.raw`Tickets give a total priority order, as at a bakery counter. Two processes may read the same maximum and take *equal* tickets, so ties are broken by process id. The choosing flag closes the one remaining gap: without it, a process could compare against a ticket that another is just about to replace by a smaller or equal one and slip in, and the explorer shows the resulting violation. Because each register has a single writer, Lamport observed that the algorithm even survives reads that overlap a write and return arbitrary values; the pictures here use atomic registers.`,
      caption: String.raw`Bars show each process's ticket (a hatch marks $\mathrm{choosing}$). *Equal tickets* runs the schedule in which P0 and P1 both read the old maximum before either writes; both take ticket 1, and stepping on shows P0 enter first on the id tie-break. Switch to *no choosing flag* or *ties not broken* and explore: the first admits two processes into the critical section, the second deadlocks on equal tickets. The exploration is exhaustive for the chosen number of processes with tickets capped at 4 (two processes) or 3 (three).`,
      deps: ['dist-4.1'], refs: ['Lynch §10.7'], tags: ['mutual exclusion', 'tickets'],
      scope: String.raw`Asynchronous read/write registers, any number of processes; exhaustive search is bounded by the ticket cap stated in the readout, whereas the correctness proof is for unbounded tickets.`,
      credit: 'Lamport, 1974', links: { doi: 'https://doi.org/10.1145/361082.361093', wikipedia: 'https://en.wikipedia.org/wiki/Lamport%27s_bakery_algorithm' },
      viz(v) {
        const nS = v.select('processes', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const variant = v.select('version', [{ value: 'ok', label: 'bakery' }, { value: 'nochoose', label: 'no choosing flag' }, { value: 'strict', label: 'ties not broken' }], 'ok');
        const get = () => cached(`4.3${nS.value}${variant.value}`, () => { const s = bakerySpec(nS.value, variant.value); s.variant = variant.value; return s; });
        const Z = mxSim(v, get, { nMax: 3, maxLines: 9, tHeight: 150, exploreSpec: (sp) => bakerySpec(sp.n, sp.variant, sp.n === 2 ? 4 : 3), limit: 200000 });
        v.button('equal tickets', () => { Z.reset(); const n = Z.spec.n, k = n + 2; Z.run([...Array(k).fill(0), ...Array(k).fill(1), 0, 1]); });
        const sB = v.stage({ x: [-0.7, 3.1], y: [0, 6], axes: false, height: 200, weight: 1, minWidth: 300, title: 'tickets (bar height) and choosing flags' });
        v.render(() => {
          const sp = get(), n = sp.n, S = Z.S;
          sB.setView([-0.7, 3.1], [-0.4, Math.max(4, ...S.sh.num) + 1.2]);
          for (let i = 0; i < n; i++) {
            const reg = sp.reg(S, i), col = REGCOL[reg] === 'faint' ? 'muted' : REGCOL[reg], h = S.sh.num[i];
            if (h) sB.rect(i - 0.3, 0, i + 0.3, h, { fill: col, fillAlpha: 0.55, color: col, width: 1.5, hatch: !!(S.sh.ch && S.sh.ch[i]) });
            sB.text(h ? String(h) : '0', i, h + 0.45, { align: 'center', size: 14, color: 'ink' });
            sB.text(`P${i}`, i, -0.25, { align: 'center', size: 13, color: 'ink' });
          }
        });
        v.readout(() => {
          const S = Z.S, num = S.sh.num, tie = num.map((x, i) => (x && num.some((y, j) => j !== i && y === x) ? i : -1)).filter((i) => i >= 0);
          return `${Z.status()}${tie.length > 1 ? ` Equal tickets held by ${tie.map((i) => 'P' + i).join(', ')}: the smaller id goes first.` : ''}\n${Z.exText()}${Z.cache.get(Z.spec.id) ? ' (tickets capped at ' + (Z.spec.n === 2 ? 4 : 3) + ' for the search)' : ''}`;
        });
      },
    },
    {
      num: '4.4', kind: 'Theorem', name: 'Mutual exclusion needs n registers (Burns–Lynch)',
      statement: String.raw`A deterministic asynchronous read/write system solving mutual exclusion with **global progress** for $n\ge2$ processes needs at least $n$ shared variables, regardless of their sizes or number of writers. Each atomic communication action is one read or one write. A process may stop in its remainder region; other active processes continue. The lower bound is tight without a symmetry requirement: the same paper supplies an algorithm with $n$ single-writer bits. Read-modify-write primitives are a different model.`,
      idea: String.raw`A process covers a variable when it is poised to write it. A process is hidden when, since a remainder state, every one of its writes has been overwritten before another process reads it. Lemma 5.3 deletes hidden steps to obtain a reachable state with that process in the remainder and identical memory and other local states. Thus a hidden process's solo path to critical must write outside the other processes' current cover: otherwise their pending writes hide it again; a fair execution of the existing other processes then reaches another critical section, contradicting exclusion (Lemma 5.4). No extra fresh process is needed.

The induction also has to preserve hiddenness, not just cover distinct cells. Lemma 5.5 repeatedly builds $k$ hidden coverers, returns them to the remainder and rebuilds. The new process's solo side branch must reach a pending write outside each current cover. Some outside target recurs because there are finitely many variables. Insert the earlier side branch before the next covering block, which erases its earlier writes, then continue to the later recurrence. All $k+1$ processes are hidden and cover distinct variables there. Repeating from $k=1$ to $n$ gives $n$ variables.

The recurring outside target in the covering argument is a finite pigeonhole step (comb 1.2). If there are $q$ possible shared-variable targets, $q+1$ side-branch choices must repeat a target, yielding the earlier and later occurrence used by the insertion argument. This counting step does not prove hiddenness: the intervening covering block must still erase the earlier writes under the source proof's premises. It also does not extend the result to stronger atomic read-modify-write actions.`,
      caption: String.raw`A finite memory experiment illustrates the erasure step, not a run of an arbitrary mutual-exclusion algorithm or the full induction. Click cells to choose up to $n-1$ pending coverers. Compare a baseline block with a hypothetical process $p$ writing 1, followed by that same block of plain writes of 0. A surviving write outside the cover distinguishes the memories. With test-and-set, final memories may agree but returned old bits distinguish the coverers' local states. The theorem's hiddenness and solo-critical-path premises must be justified separately.`,
      deps: ['dist-4.1','dist-1.7','comb-1.2'], refs: ['Burns–Lynch (1993), Theorem 4.1, pp. 175–177; Theorem 5.1 and Lemmas 5.3–5.5, pp. 177–183'], tags: ['lower bounds', 'covering argument'],
      scope: String.raw`Global progress, atomic read/write communication, finitely many processes and shared variables; arbitrary variable domains and multiple writers. The $n$-bit upper-bound algorithm uses static priorities and does not supply the stronger symmetry requested by Dijkstra. The memory experiment verifies a conditional erasure premise only; no choice of a covered first write alone proves a contradiction.`,
      credit: 'Burns & Lynch; preliminary version Allerton 1980, journal version 1993',
      links: { doi: 'https://doi.org/10.1006/inco.1993.1065', source: 'https://groups.csail.mit.edu/tds/papers/Lynch/ic93.pdf' },
      viz(v) {
        let covered = new Set([0,1,2]), phase = 0, note = '';
        const reset = () => { covered=new Set(Array.from({length:Math.min(nS.value-1,mS.value)},(_,i)=>i));phase=0;note=''; };
        const nS = v.slider('processes $n$',2,6,4,{int:true,onChange:reset}),mS = v.slider('registers $m$',1,6,3,{int:true,onChange:reset});
        const outside=v.toggle('p also writes one uncovered cell',false,{onChange:()=>{phase=0;note='';}}),rmw=v.toggle('coverers use test-and-set instead of plain writes',false,{onChange:()=>{phase=0;note='';}});
        const s=v.stage({x:[-1.8,6.2],y:[-0.5,4.7],axes:false,height:360,full:true,title:'hypothetical writes and the covering block: compare the final rows'});
        s.onClick((x,y)=>{if(y<3.2)return;const i=Math.round(x);if(i<0||i>=mS.value)return;if(covered.has(i))covered.delete(i);else if(covered.size<nS.value-1)covered.add(i);else note='At most n−1 other processes can cover distinct cells.';phase=0;});
        v.button("apply p's hypothetical writes",()=>{phase=1;});v.button('apply covering block',()=>{phase=2;});v.button('reset illustration',reset);
        let info={};
        v.render(()=>{
          info=erasureExperiment(mS.value,covered,outside.value,rmw.value);s.setView([-1.8,Math.max(mS.value,3)+.5],[-.5,4.7]);
          const rows=[['pending coverers',null,3.8],['after p writes',phase>=1?info.afterP:info.before,2.7],['baseline block',phase>=2?info.baseline:info.before,1.6],['p then block',phase>=2?info.afterBlock:phase>=1?info.afterP:info.before,.5]];
          for(const[label,values,y]of rows){s.text(label,-.7,y,{align:'right',size:12,color:'muted'});for(let i=0;i<mS.value;i++){const selected=covered.has(i),diff=phase>=2&&label==='p then block'&&info.afterBlock[i]!==info.baseline[i];s.rect(i-.34,y-.33,i+.34,y+.33,{fill:diff?'red':selected?'orange':'grid',fillAlpha:.25,color:diff?'red':selected?'orange':'muted',width:1.5});s.text(values?String(values[i]):selected?`q${info.cover.indexOf(i)+1}`:'—',i,y,{align:'center',size:14,color:'ink'});}}
          if(phase>=2&&rmw.value)s.text(`returned bits: baseline [${info.returns0}]; after p [${info.returns1}]`,0,-.25,{align:'left',size:12,color:info.sameLocals?'muted':'red'});
        });
        v.readout(()=>`${note?note+' ':''}${covered.size} distinct pending coverers among ${nS.value-1} other processes. ${outside.value&&info.free===undefined?'No uncovered cell is available. ':''}`+
          (phase<2?'Apply the hypothetical writes and then the covering block to compare states.':`Final memory ${info.sameMemory?'agrees':'differs'}; coverer return values ${info.sameLocals?'agree':'differ'}. ${info.erased?'This chosen write trace is erased from the other processes’ view.':'This trace is not hidden by the block.'}`)+
          `\n${rmw.value?'Test-and-set is outside the read/write lower-bound model; one such lock bit can suffice for exclusion with global progress.':`The source theorem requires m≥n: m=${mS.value}, n=${nS.value} ${mS.value>=nS.value?'satisfies that necessary bound':'violates it for a hypothetical globally progressing read/write solution'}.`} The table is an erasure experiment, not an existence test for an algorithm.`);
      },
    },
  ],
};
