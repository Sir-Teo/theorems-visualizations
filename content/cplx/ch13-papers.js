// Computational Complexity — Chapter 13, landmark paper: Grover (1996).
//
// Data: none needed — the paper is theoretical. The amplitudes below are computed exactly by state-vector simulation
// of Grover's iteration (sign flip of the marked items, inversion about the mean). Facts used for "today": optimality
// of Θ(√N) queries (Bennett, Bernstein, Brassard & Vazirani 1997; exact optimality of the iteration count, Zalka 1999);
// the M-solution version and the unknown-M variant (Boyer, Brassard, Høyer & Tapp 1998); first experimental runs on
// N = 4 by NMR (Chuang, Gershenfeld & Kubinec 1998, PRL 80: 3408; Jones, Mosca & Hansen 1998, Nature 393: 344).

/** Amplitudes after k Grover iterations on N items with the first M marked (real amplitudes). */
function groverRun(N, M, k, halfStep) {
  const a = new Float64Array(N).fill(1 / Math.sqrt(N));
  const steps = [];
  for (let it = 0; it < k; it++) {
    for (let i = 0; i < M; i++) a[i] = -a[i]; // oracle
    if (halfStep && it === k - 1) return { a, half: true };
    let mean = 0; for (let i = 0; i < N; i++) mean += a[i]; mean /= N;
    for (let i = 0; i < N; i++) a[i] = 2 * mean - a[i]; // inversion about the mean
  }
  return { a, half: false, steps };
}

export default {
  collection: 'cplx',
  chapter: 13,
  items: [
    {
      num: '13.9',
      kind: 'Paper',
      name: 'A Fast Quantum Mechanical Algorithm for Database Search',
      paper: { authors: 'Lov K. Grover', year: 1996, title: 'A Fast Quantum Mechanical Algorithm for Database Search', venue: 'Proceedings of the 28th Annual ACM Symposium on Theory of Computing (STOC ’96): 212–219', doi: '10.1145/237814.237866' },
      introduces: ['qinfo-5.6'],
      statement: String.raw`Given an oracle that recognises one marked item among $N$ unsorted items, a quantum computer can find it with high probability using $O(\sqrt N)$ oracle queries, whereas any classical algorithm needs $\Omega(N)$ (about $N/2$ on average). Starting from the uniform superposition $|s\rangle$, each iteration flips the sign of the marked amplitude and then **inverts every amplitude about the mean**; with $\sin\theta = 1/\sqrt N$, after $k$ iterations the marked item is found with probability
$$P_k = \sin^2\big((2k+1)\theta\big),$$
which is close to 1 after $k \approx \frac{\pi}{4}\sqrt N$ iterations, and falls again if one keeps going. With $M$ marked items, $\sin\theta = \sqrt{M/N}$ and about $\frac{\pi}{4}\sqrt{N/M}$ iterations suffice.

Scope: a quadratic, not exponential, speed-up for unstructured search, and provably optimal: no quantum algorithm can do better than $\Omega(\sqrt N)$ queries (BBBV 1997), so NP-complete problems are not solved in polynomial time this way.`,
      idea: String.raw`After Shor's factoring algorithm (1994) it was unclear which other problems quantum computers could speed up. Bennett, Bernstein, Brassard and Vazirani had just shown that unstructured search cannot be done in fewer than about $\sqrt N$ queries; Grover found an algorithm that meets this bound. Its two steps are reflections: the oracle reflects the state about the hyperplane orthogonal to the marked state $|w\rangle$, and the "diffusion" operator $2|s\rangle\langle s| - I$ (built from Hadamard gates, qinfo-4.8) reflects it about $|s\rangle$. Two reflections make a rotation by $2\theta$ in the plane spanned by $|w\rangle$ and $|s\rangle$ (qinfo-5.1), so the state turns steadily toward $|w\rangle$ — amplitude amplification. The idea generalises to amplifying any quantum subroutine's success probability, and gives quadratic speed-ups for many search, counting and optimisation problems (cplx-13.4); it was demonstrated on $N = 4$ by NMR in 1998 and on small trapped-ion and superconducting machines since.`,
      caption: String.raw`**Left**: the amplitudes of all $N$ items as bars (the marked one red; for large $N$ the unmarked items are summarised by one bar, since they stay equal). **Step** applies the oracle (the red bar flips sign) and then the inversion about the mean (dashed line); **Play** runs it. **Middle**: the state as a vector in the plane of $|w\rangle$ and the unmarked superposition, rotating by $2\theta$ per iteration. **Right**: probability of success after $k$ iterations (green) against a classical search that checks one item per query (grey): the quantum curve peaks near $\frac{\pi}{4}\sqrt N$ and then declines. Change $n$ (so $N = 2^n$) and the number $M$ of marked items.`,
      deps: ['qinfo-5.1', 'qinfo-4.8', 'cplx-13.4'],
      refs: [],
      tags: ['quantum algorithms', 'search', 'amplitude amplification'],
      credit: 'Lov K. Grover, 1996',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Grover%27s_algorithm' },
      viz(v) {
        const nq = v.slider('qubits n (N = 2ⁿ)', 2, 12, 5, { int: true, onChange: () => { k = 0; half = false; } });
        const mS = v.slider('marked items M', 1, 8, 1, { int: true, onChange: () => { k = 0; half = false; } });
        let k = 0, half = false;
        v.button('Step', () => { if (!half) half = true; else { half = false; k++; } });
        v.button('Reset', () => { k = 0; half = false; });
        const A = v.stage({ x: [-1, 33], y: [-1.05, 1.05], axes: 'box', gutter: true, height: 320, weight: 1.3, minWidth: 260, xlabel: 'item', ylabel: 'amplitude', title: 'amplitudes' });
        const G = v.stage({ x: [-0.2, 1.15], y: [-0.2, 1.15], equal: true, axes: false, height: 320, weight: 0.8, minWidth: 220, title: 'two reflections = a rotation' });
        const P = v.stage({ x: [0, 30], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 240, xlabel: 'iterations k', ylabel: 'P(success)', title: 'success probability' });
        let st = null;
        v.render(() => {
          const N = 2 ** nq.value, M = Math.min(mS.value, N / 2), th = Math.asin(Math.sqrt(M / N)), kopt = Math.floor(Math.PI / (4 * th));
          const kk = Math.min(k, 4 * kopt + 4);
          const run = groverRun(N, M, half ? kk + 1 : kk, half);
          const a = run.a;
          // amplitudes
          let mean = 0; for (let i = 0; i < N; i++) mean += a[i]; mean /= N;
          if (N <= 32) {
            A.setView([-0.8, N - 0.2], [-1.05, 1.05]);
            for (let i = 0; i < N; i++) A.rect(i - 0.38, 0, i + 0.38, a[i], { fill: i < M ? 'red' : 'accent', fillAlpha: 0.8, color: i < M ? 'red' : 'accent' });
            A.setTicks([[0, '0'], [N - 1, String(N - 1)]], null);
          } else {
            A.setView([-0.8, 2.8], [-1.05, 1.05]);
            A.rect(0 - 0.35, 0, 0 + 0.35, a[0], { fill: 'red', fillAlpha: 0.8, color: 'red' });
            A.rect(2 - 0.35, 0, 2 + 0.35, a[N - 1], { fill: 'accent', fillAlpha: 0.8, color: 'accent' });
            A.text(`each of ${M} marked`, 0, -1, { dy: -4, size: 11, color: 'red', weight: 700, baseline: 'bottom' });
            A.text(`each of ${N - M} unmarked`, 2, -1, { dy: -4, size: 11, color: 'accent', weight: 700, baseline: 'bottom' });
            A.setTicks([], null);
          }
          A.hline(0, { color: 'faint', width: 1 });
          A.hline(mean, { color: 'gold', width: 1.6, dash: [6, 4] });
          A.corner(half ? `iteration ${kk + 1}: oracle applied (sign flipped)` : `after ${kk} iteration${kk === 1 ? '' : 's'}`, 'tr', { size: 12, weight: 700, color: half ? 'red' : 'ink' });
          // geometry: angle of the state from the unmarked axis
          const ang = half ? -(2 * kk + 1) * th : (2 * kk + 1) * th;
          G.line(0, 0, 1.08, 0, { color: 'muted', width: 1 }); G.line(0, 0, 0, 1.08, { color: 'muted', width: 1 });
          G.tex(String.raw`|w\rangle`, 0, 1.08, { dx: 6, size: 14, color: 'red', align: 'left' });
          G.tex(String.raw`|s'\rangle`, 1.08, 0, { dy: 14, size: 14, color: 'accent' });
          G.curve((u) => [Math.cos(u), Math.sin(u)], -0.3, Math.PI / 2 + 0.05, { color: 'faint', width: 1 });
          G.arrow(0, 0, Math.cos(th), Math.sin(th), { color: 'muted', width: 1.4, dash: [4, 3] });
          G.tex(String.raw`|s\rangle`, Math.cos(th), Math.sin(th), { dx: 6, size: 13, color: 'muted', align: 'left' });
          G.arrow(0, 0, Math.cos(ang), Math.sin(ang), { color: 'green', width: 3 });
          G.corner(`θ = ${v.fix((th * 180) / Math.PI, 2)}°, each step turns 2θ`, 'bl', { size: 11.5, color: 'muted' });
          // success probability
          const kmax = Math.max(6, Math.ceil(2.2 * kopt) + 2);
          P.setView([0, kmax], [0, 1.05]);
          P.fn((x) => Math.min(1, ((Math.floor(x) + 1) * M) / N), { color: 'muted', width: 1.6, dash: [5, 4] });
          const pts = []; for (let j = 0; j <= kmax; j++) pts.push([j, Math.sin((2 * j + 1) * th) ** 2]);
          P.fn((x) => Math.sin((2 * x + 1) * th) ** 2, { color: 'green', width: 1, alpha: 0.4 });
          for (const [j, p] of pts) P.dot(j, p, { r: 3.5, color: 'green' });
          P.vline((Math.PI / 4) * Math.sqrt(N / M), { color: 'gold', width: 1.2, dash: [4, 3] });
          P.dot(Math.min(kk, kmax), Math.sin((2 * kk + 1) * th) ** 2, { r: 7, color: 'gold' });
          let pm = 0; for (let i = 0; i < M; i++) pm += a[i] * a[i];
          st = { N, M, th, kopt, kk, pm, half };
        });
        v.legend([['red', 'marked amplitude'], ['accent', 'unmarked amplitude'], ['gold', 'mean / your step', { dash: true }], ['green', 'quantum success P'], ['muted', 'classical, 1 item per query', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { N, M, th, kopt, kk, pm, half } = st;
          const pk = Math.sin((2 * kopt + 1) * th) ** 2;
          return `N = ${N.toLocaleString('en-US')}, M = ${M}: after ${kk}${half ? '½' : ''} iterations P(marked) = **${v.fix(pm, 4)}** (formula $\\sin^2((2k+1)\\theta)$ = ${v.fix(Math.sin((2 * kk + 1) * th) ** 2, 4)}) · optimum $k^* = \\lfloor \\pi/4\\theta \\rfloor$ = **${kopt}** queries (π/4·√(N/M) = ${v.fix((Math.PI / 4) * Math.sqrt(N / M), 2)}), success ${v.fix(pk, 4)} · a classical search needs about ${v.fix((N + 1) / (M + 1), 1)} queries on average · ratio ${v.fix((N + 1) / (M + 1) / Math.max(kopt, 1), 1)}× — and the gap grows like √N.`;
        });
      },
    },
  ],
};
