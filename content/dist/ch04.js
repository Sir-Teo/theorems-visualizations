// Distributed Computing — Chapter 4: Mutual exclusion and shared objects (items 4.1–4.4; 4.5–4.8 in ch04-b.js, 4.9–4.12 in ch04-c.js, 4.13 in ch04-d.js)
import { REGCOL, noneSpec, ctsSpec, tasSpec, petersonSpec, bakerySpec, mxSim, mulberry32, range, drawLanes, ly } from './ch04.shared.js';

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
      statement: String.raw`Any deadlock-free mutual exclusion algorithm for $n\ge 2$ processes that communicates only through atomic read/write registers uses at least $n$ distinct shared registers. The bound holds however large the registers are, and even if every process may write every register.`,
      idea: String.raw`A covering argument needs an additional invariant: the configuration covering $k$ registers must look, to the remaining processes, like an idle configuration. Then a new process must eventually write an uncovered register before entering its critical section; otherwise the covering writes can erase its entire trace and let another process enter too. Establishing that invariant is the hard part. Repeatedly run the first $k-1$ processes through covering configurations and back to idle. Since only finitely many sets of $k-1$ registers exist, two such configurations cover the same set. Pause the new process just before its first write outside that set, then replay the intervening execution of the earlier processes. This restores the covering set and the idle-view invariant while retaining the new pending write. Induction reaches $n$ covered registers. Simply adding a new covering process without restoring the idle-view invariant would not prove the result.`,
      caption: String.raw`Choose the number of processes $n$ and registers $m$, click the register the next process will write first, and press *next process runs alone*. A process that picks an uncovered register joins the cover. One that picks a covered register triggers the contradiction: the lower diagram is the execution built from it, in which the covering writes erase $p$ and then $q$ enters beside $p$. With $m<n$ the pigeonhole principle forces this eventually. Turn on *test-and-set* and the erasing step is no longer possible, since a test-and-set reads what it overwrites: one register suffices again, matching 4.1.`,
      deps: ['dist-4.1', 'dist-1.7', 'comb-1.2'], refs: ['Aspnes §18.7, Lemma 18.7.1, pp. 169–170', 'Lynch §10.8'], sourceUrl: 'https://www.cs.yale.edu/homes/aspnes/classes/465/notes.pdf', tags: ['lower bounds', 'covering argument'],
      scope: String.raw`Atomic read/write registers only, no restriction on register size or on the number of writers; the algorithm must be deadlock-free (the proof uses that a lone process eventually enters). The bound is tight: Burns’ one-bit algorithm uses $n$ single-writer bits. Not valid with read-modify-write primitives.`,
      credit: 'Full covering-invariant proof: J. Aspnes, Notes on Theory of Distributed Systems, §18.7, Lemma 18.7.1, pp. 169–170',
      links: { doi: 'https://doi.org/10.1006/inco.1993.1065' },
      viz(v) {
        const nS = v.slider('processes $n$', 2, 6, 4, { int: true, onChange: () => reset() });
        const mS = v.slider('registers $m$', 1, 6, 3, { int: true, onChange: () => reset() });
        const rmw = v.toggle('registers also offer test-and-set', false, { onChange: () => reset() });
        let cover = [], k = 0, fail = null, choice = -1, note = '';
        const reset = () => { cover = []; k = 0; fail = null; choice = -1; note = ''; };
        const sR = v.stage({ x: [-0.7, 6.2], y: [-2.3, 2.5], axes: false, height: 300, weight: 1.1, minWidth: 340, title: 'registers and the processes poised to write them (click a register to choose)' });
        const sL = v.stage({ x: [-0.5, 10.5], y: [-0.6, 5.6], axes: false, height: 300, weight: 1, minWidth: 340, title: 'the execution built from the contradiction' });
        sR.onClick((x) => { choice = Math.max(0, Math.min(mS.value - 1, Math.round(x))); });
        v.button('next process runs alone', () => {
          if (fail || k >= nS.value) return;
          const m = mS.value, r = choice >= 0 && choice < m ? choice : Math.max(0, cover.findIndex((c, i) => i < m && c === undefined));
          const first = range(m).find((i) => cover[i] === undefined);
          const target = choice >= 0 && choice < m ? choice : first === undefined ? 0 : first;
          void r;
          if (cover[target] === undefined) { cover[target] = k; k++; note = `p${k} writes the uncovered register R${target + 1} first and stops just before: ${k} register${k > 1 ? 's' : ''} covered.`; }
          else if (rmw.value) { note = `R${target + 1} is covered, but a covering test-and-set would read p's write instead of erasing it: no contradiction (p${k + 1} keeps going).`; }
          else { fail = { p: k, r: target }; note = `p${k + 1} writes the covered register R${target + 1}: the covering processes can erase it.`; }
          choice = -1;
        });
        v.button('reset', reset);
        v.render(() => {
          const n = nS.value, m = mS.value;
          sR.setView([-0.7, Math.max(m, 4) + 0.4], [-2.3, 2.5]);
          for (let i = 0; i < m; i++) {
            const c = cover[i], sel = (choice === i) || (choice < 0 && !fail && c === undefined && range(i).every((q) => cover[q] !== undefined));
            sR.rect(i - 0.36, 0, i + 0.36, 0.8, { fill: c !== undefined ? 'orange' : 'grid', fillAlpha: c !== undefined ? 0.4 : 0.25, color: sel ? 'gold' : 'muted', width: sel ? 3 : 1.4, radius: 4 });
            sR.text(`R${i + 1}`, i, 0.4, { align: 'center', size: 15, color: 'ink' });
            if (c !== undefined) { sR.dot(i, 1.9, { r: 14, color: 'orange' }); sR.text(`p${c + 1}`, i, 1.9, { align: 'center', size: 13, color: 'ink' }); sR.arrow(i, 1.55, i, 0.9, { color: 'orange', width: 2.2 }); }
          }
          for (let j = k; j < n; j++) { sR.dot(j * (Math.max(m, 4) - 0.3) / Math.max(1, n - 1), -1.2, { r: j === k && !fail ? 13 : 11, color: j === k ? 'gold' : 'faint' }); sR.text(`p${j + 1}`, j * (Math.max(m, 4) - 0.3) / Math.max(1, n - 1), -1.2, { align: 'center', size: 12, color: 'ink' }); }
          sR.text('processes still in the remainder', 0, -1.95, { align: 'left', size: 12, color: 'muted' });
          sL.el.style.display = fail ? '' : 'none';
          if (fail) {
            const lanes = [`q`, `p${fail.p + 1}`, ...range(k).map((i) => `p${i + 1}`)], N = lanes.length;
            drawLanes(sL, N, 10.5, { names: lanes });
            const Y = (i) => ly(i, N);
            sL.rect(0.4, Y(1) - 0.25, 3.4, Y(1) + 0.25, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.5, radius: 4 });
            sL.text(`p${fail.p + 1} runs alone, writes only covered registers`, 0.5, Y(1) + 0.55, { align: 'left', size: 11, color: 'accent' });
            sL.dot(3.9, Y(1), { r: 7, color: 'green' }); sL.text(`p${fail.p + 1} critical`, 4, Y(1), { align: 'left', dx: 6, size: 12, color: 'green', halo: true });
            for (let i = 0; i < k; i++) { sL.dot(4.4 + 0.4 * i, Y(2 + i), { r: 5, color: 'red' }); sL.text('writes', 4.4 + 0.4 * i, Y(2 + i), { align: 'left', dx: 8, baseline: 'bottom', dy: -4, size: 11, color: 'red', halo: true }); }
            sL.rect(6.2, Y(0) - 0.25, 9.0, Y(0) + 0.25, { fill: 'purple', fillAlpha: 0.3, color: 'purple', width: 1.5, radius: 4 });
            sL.text('q runs alone: sees the initial memory', 6.2, Y(0) + 0.55, { align: 'left', size: 11, color: 'purple' });
            sL.dot(9.3, Y(0), { r: 7, color: 'red' }); sL.text('q critical too', 9.4, Y(0), { align: 'right', dy: -16, size: 12, color: 'red', halo: true });
          }
        });
        v.readout(() => {
          const n = nS.value, m = mS.value, free = range(m).filter((i) => cover[i] === undefined).length;
          const state = fail ? `**Contradiction**: p${fail.p + 1} and q are both critical, so no such algorithm exists with these registers.` : k >= n ? `All $${n}$ processes cover distinct registers, which needs $m\\ge ${n}$ registers.` : free === 0 && !rmw.value ? `All ${m} registers are covered but ${n - k} process${n - k > 1 ? 'es remain' : ' remains'}: the next one must write a covered register, so mutual exclusion must fail.` : `${k} of ${n} processes poised; ${free} uncovered register${free === 1 ? '' : 's'} left.`;
          return `${note ? note + ' ' : ''}${state}\n$n=${n}$, $m=${m}$: the theorem requires $m\\ge n$ for algorithms using only reads and writes${m >= n ? ' (satisfied)' : ' (violated, so none exists)'}.`;
        });
      },
    },
  ],
};
