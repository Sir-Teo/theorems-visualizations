import { uniform, finiteKernel, mixingProfile, cycleMixing, cubeMixing, roomKernel, bottleneck,
  cubeStatistic, cftp, memoOne, probabilityStage, drawSeries } from './ch05.shared.js';
const SOURCE = 'https://pages.uoregon.edu/dlevin/MARKOV/markovmixing.pdf';
export default {
  collection: 'stoch', chapter: 5,
  items: [
    {
      num: '5.7', kind: 'Method', name: 'Doeblin’s coupling proof of convergence',
      statement: String.raw`For a finite irreducible aperiodic chain, some integer $r$ has every entry of $P^r$ positive. Consequently there are $\delta>0$ and a probability law $\nu$ with
$$P^r(x,A)\ge\delta\nu(A)\quad\text{for all }x,A.$$
Couple each pair of $r$-step transitions by using one shared draw from $\nu$ with probability $\delta$, and couple identically after meeting. It follows that $d(t)\le(1-\delta)^{\lfloor t/r\rfloor}$, proving convergence. This finite-state minorization need not hold uniformly for an infinite irreducible chain.`,
      idea: String.raw`Write every row of $P^r$ as the common probability component $\delta\nu$ plus a remaining probability component of mass $1-\delta$. At each block, use the same independent success coin and common draw for both chains. The chance of missing that opportunity for $k$ blocks is $(1-\delta)^k$. Start the second chain in stationarity and apply the coupling bound. Positivity of a suitable power follows from finite irreducibility and aperiodicity.`,
      caption: String.raw`The example uses block length $r=6$ and uniform $\nu$, taking $\delta=6\min_{x,y}P^6(x,y)$. Compare the computed distance with this blockwise bound. The periodic cycle gives $\delta=0$, so this attempted certificate is uninformative and its law does not converge.`,
      scope: 'These six-state kernels have uniform stationary law. The minimum is taken over every entry, not selected sample rows; all displayed powers and distances are directly computed.',
      deps: ['stoch-5.5', 'stoch-4.4', 'stoch-5.6'], refs: ['LPW 2nd ed. §4.3, proof of Theorem 4.9; §5.2'], links: { source: SOURCE }, tags: ['Doeblin condition', 'minorization'],
      viz(v) {
        const kind = v.select('chain', ['cycle', 'path', 'rooms', 'periodic'], 'cycle'), t = v.slider('inspect time', 0, 80, 18, { int: true, step: 1 }), cache = memoOne();
        const get = () => cache(kind.value, () => { const m = mixingProfile(finiteKernel(kind.value), 80), delta = 6 * Math.min(...m.powers[6].flat()); return { ...m, delta, bound: m.d.map((_, j) => (1 - delta) ** Math.floor(j / 6)) }; });
        const s = probabilityStage(v, 80, 'a common component every six steps');
        v.render(() => { const m = get(); drawSeries(s, m.d, 'green'); drawSeries(s, m.bound, 'orange'); s.dot(t.value, m.d[t.value], { color: 'green', r: 4 }); s.dot(t.value, m.bound[t.value], { color: 'orange', hollow: true, r: 5 }); });
        v.legend([['green', 'computed worst-case distance'], ['orange', 'minorization bound']]);
        v.readout(() => { const m = get(); return String.raw`$\delta=${v.fix(m.delta, 6)}$. At step ${t.value}, $d(t)=${v.fix(m.d[t.value], 6)}\le${v.fix(m.bound[t.value], 6)}$. ${m.delta === 0 ? 'No positive common component at this block length.' : 'A strictly positive common component certifies geometric convergence.'}`; });
      },
    },
    {
      num: '5.8', kind: 'Theorem', name: 'Random walk on the cycle mixes in order n²',
      statement: String.raw`For the lazy symmetric walk on the $n$-cycle, $n\ge3$, stay put with probability $1/2$ and move to either neighbor with probability $1/4$. Its stationary law is uniform, and
$$\frac{n^2}{32}\le t_{\rm mix}\le n^2.$$
Thus the mixing time at the usual $1/4$ tolerance has order $n^2$. Laziness is essential to this statement on even cycles: the non-lazy walk then has period two.`,
      idea: String.raw`Until two walkers meet, choose one of them fairly and move it one step in a fair direction; after meeting, move together. Each marginal has the required lazy law. Their cyclic displacement is an absorbed simple walk on $\{0,\ldots,n\}$, with mean absorption time $k(n-k)\le n^2/4$. Markov's inequality and the coupling bound give the upper bound. For the lower bound, lift a walk to the integers: its variance is $t/2$. Chebyshev keeps most mass in a short arc before order $n^2$ steps, while uniform stationarity puts substantial mass outside.`,
      caption: String.raw`Choose the cycle size. The first panel computes its distance at every integer time up to $n^2$, displayed against normalized time $t/n^2$. The second plots computed $t_{\rm mix}/n^2$ for several sizes beside the rigorous bounds; these are computed thresholds, not a fitted slope.`,
      scope: 'The offered sizes are finite illustrations of the two uniform inequalities, not a proof of an asymptotic constant. The displayed current integer time is the floor of the chosen continuous normalized time times n².',
      deps: ['stoch-5.6', 'prob-1.6.4'], refs: ['LPW 2nd ed. §5.3.2'], links: { source: SOURCE }, tags: ['cycle walk', 'diffusive mixing'],
      viz(v) {
        const n = v.slider('cycle size', 4, 32, 12, { int: true, step: 1 }), fraction = v.slider('normalized time', 0, 1, .2, { step: 'any', decimals: 4 });
        const cache = memoOne(), get = () => cache(n.value, () => cycleMixing(n.value, n.value ** 2));
        const s = v.stage({ x: [-.04, 1.04], y: [-.06, 1.08], axes: 'box', gutter: true, height: 290, xlabel: 'time / n²', ylabel: 'TV distance' });
        const b = v.stage({ x: [2, 34], y: [-.04, 1.08], axes: 'box', gutter: true, height: 290, xlabel: 'cycle size', ylabel: 'mixing time / n²' });
        const sizes = [4, 8, 12, 16, 24, 32], ratios = sizes.map(k => cycleMixing(k, k * k).mixingTime / (k * k));
        v.render(() => {
          const m = get(), t = Math.floor(fraction.value * n.value ** 2);
          s.path(m.d.map((d, i) => [i / n.value ** 2, d]), { color: 'blue', width: 2 }); s.hline(.25, { color: 'orange', dash: true }); s.dot(t / n.value ** 2, m.d[t], { color: 'gold', r: 4 });
          b.hline(1 / 32, { color: 'orange', dash: true }); b.hline(1, { color: 'orange', dash: true });
          b.path(sizes.map((k, i) => [k, ratios[i]]), { color: 'blue' }); sizes.forEach((k, i) => b.dot(k, ratios[i], { color: 'blue', r: 3 }));
          b.dot(n.value, m.mixingTime / n.value ** 2, { color: 'gold', r: 5, hollow: true });
        });
        v.legend([['blue', 'computed distances / thresholds'], ['orange', 'tolerance / rigorous bounds'], ['gold', 'selected size or time']]);
        v.readout(() => { const m = get(), t = Math.floor(fraction.value * n.value ** 2); return String.raw`$n=${n.value}$; selected integer $t=${t}$. $d(t)=${v.fix(m.d[t], 6)}$. Computed $t_{\rm mix}=${m.mixingTime}$, so $t_{\rm mix}/n^2=${v.fix(m.mixingTime / n.value ** 2, 5)}$.`; });
      },
    },
    {
      num: '5.9', kind: 'Theorem', name: 'Lazy walk on the hypercube mixes in about ½ n log n',
      statement: String.raw`On $\{0,1\}^n$, refresh one uniformly selected coordinate to an independent fair bit at each step. This is the lazy simple walk with holding probability $1/2$ and uniform stationary law. For every fixed $\varepsilon\in(0,1)$,
$$\frac{t_{\rm mix}(\varepsilon)}{\frac12 n\log n}\longrightarrow1.$$
Sharing each coordinate refresh couples all starts by the coupon-collector time, giving an $n\log n+O_\varepsilon(n)$ upper bound. That elementary bound alone does **not** yield the sharper factor $1/2$.`,
      idea: String.raw`Products of coordinate signs diagonalize the refresh operator, giving eigenvalues $1-k/n$ with multiplicities $\binom nk$. Orthogonality and Cauchy–Schwarz give $4d(t)^2\le(1+e^{-2t/n})^n-1$, which becomes small beyond $\frac12 n\log n+cn$. For the matching lower scale, start at all zeroes and sum the coordinate signs: its mean is $n(1-1/n)^t$ and its variance is at most $n$. Before $\frac12 n\log n-cn$, this mean is many equilibrium standard deviations from zero, so Chebyshev separates the laws.`,
      caption: 'Compare the exact distance, the simple coupon-collector tail and the sharper spectral upper bound. Exact distance is computed on Hamming-weight classes: symmetry makes this equal to the full cube distance from a vertex. The vertical line marks the asymptotic half-n-log-n scale, not the exact finite-size mixing time.',
      scope: 'The transition convention is coordinate refresh, not an always-flip walk. Curves use finite-law recurrences and an analytical bound. The coupon tail and sharp bound describe different arguments.',
      deps: ['stoch-5.6', 'prob-2.2.7', 'prob-1.6.4', 'pma-1.35'], refs: ['LPW 2nd ed. §5.3.1; Proposition 7.14; Example 12.19'], links: { source: SOURCE }, tags: ['hypercube', 'cutoff'],
      viz(v) {
        const n = v.slider('dimension', 4, 64, 20, { int: true, step: 1 }), cache = memoOne();
        const get = () => cache(n.value, () => cubeMixing(n.value, Math.ceil(2 * n.value * Math.log(n.value))));
        const s = v.stage({ x: [-.08, 2.25], y: [-.06, 1.08], axes: 'box', gutter: true, height: 320, xlabel: 'time / (n log n)', ylabel: 'distance / bound' });
        v.render(() => { const m = get(), scale = n.value * Math.log(n.value); for (const [a, color, dash] of [[m.d, 'blue', false], [m.couponTail, 'orange', true], [m.upper, 'green', false]]) s.path(a.map((d, t) => [t / scale, d]), { color, dash, width: 2 }); s.vline(.5, { color: 'muted', dash: true }); s.hline(.25, { color: 'faint', dash: true }); });
        v.legend([['blue', 'exact TV distance'], ['orange', 'coupon-collector upper bound (dashed)'], ['green', 'sharper spectral upper bound']]);
        v.readout(() => { const m = get(), scale = n.value * Math.log(n.value); return String.raw`Dimension $n=${n.value}$; $\frac12n\log n=${v.fix(scale / 2, 3)}$. Computed $t_{\rm mix}(1/4)=${m.mixingTime}$; ratio to that asymptotic scale $=${v.fix(m.mixingTime / (scale / 2), 4)}$.`; });
      },
    },
    {
      num: '5.10', kind: 'Theorem', name: 'Bottleneck ratio lower bound',
      statement: String.raw`For a finite irreducible aperiodic chain with stationary law $\pi$, write $Q(x,y)=\pi(x)P(x,y)$ and
$$\Phi(A)=\frac{Q(A,A^c)}{\pi(A)}.$$
Let $\Phi_* $ be the minimum of $\Phi(A)$ over nonempty $A$ with $\pi(A)\le1/2$. Then $t_{\rm mix}(1/4)\ge1/(4\Phi_*)$. More directly, every such $A$ gives $d(t)\ge1-\pi(A)-t\Phi(A)$. Reversibility is not required.`,
      idea: String.raw`Start a stationary chain conditioned to lie in $A$. A union bound over the first $t$ transitions bounds its probability of having crossed out by $tQ(A,A^c)/\pi(A)$. It therefore retains at least $1-t\Phi(A)$ mass in $A$, while stationarity puts only $\pi(A)$ there. Some deterministic start in $A$ has at least this discrepancy. Below $1/(4\Phi(A))$ the discrepancy is larger than $1/4$; maximize the resulting lower bound over cuts.`,
      caption: 'Thin the links between two three-state rooms. Within its current room a step chooses uniformly, and it crosses to the other room with the chosen probability. Every nontrivial cut is enumerated to compute the actual bottleneck ratio; the distance is obtained by matrix iteration.',
      scope: 'The six-state model is a weighted transition kernel, not an unweighted simple graph. Its stationary law is uniform, and the room cut has ratio equal to the crossing probability.',
      deps: ['stoch-5.3'], refs: ['LPW 2nd ed. §7.2, Theorem 7.4'], links: { source: SOURCE }, tags: ['bottleneck', 'conductance'],
      viz(v) {
        const crossing = v.slider('room-crossing probability', .005, .2, .04, { step: 'any', decimals: 4 }), cache = memoOne();
        const get = () => cache(crossing.value, () => { const P = roomKernel(3, crossing.value); return { ...mixingProfile(P, 200), cut: bottleneck(P) }; });
        const s = probabilityStage(v, 200), g = v.stage({ x: [-1.5, 1.5], y: [-1.2, 1.2], axes: false, height: 290, title: 'two rooms, weighted transitions' });
        const points = [[-1, -.65], [-1, 0], [-1, .65], [1, -.65], [1, 0], [1, .65]];
        v.render(() => {
          const m = get(); drawSeries(s, m.d, 'blue'); drawSeries(s, m.d.map((_, t) => Math.max(0, .5 - t * crossing.value)), 'orange', { dash: true }); s.hline(.25, { color: 'muted', dash: true });
          for (let x = 0; x < 6; x++) for (let y = x + 1; y < 6; y++) g.segment(points[x], points[y], { color: (x < 3) === (y < 3) ? 'blue' : 'orange', width: (x < 3) === (y < 3) ? 1.7 : .5 + crossing.value * 8, alpha: .55 });
          points.forEach(([x, y], i) => g.dot(x, y, { color: i < 3 ? 'blue' : 'orange', r: 5 }));
        });
        v.legend([['blue', 'exact distance / first room'], ['orange', 'bottleneck lower bound / second room']]);
        v.readout(() => { const m = get(); return String.raw`$\Phi_*=${v.fix(m.cut.phi, 5)}$ from all cuts. $1/(4\Phi_*)=${v.fix(m.cut.lowerBound, 3)}\le t_{\rm mix}=${m.mixingTime}$. Dashed curve: $\max(0,1/2-t\Phi(A))$.`; });
      },
    },
    {
      num: '5.11', kind: 'Theorem', name: 'Diameter and distinguishing-statistic lower bounds',
      statement: String.raw`If a finite irreducible aperiodic chain has diameter $L$ in its underlying undirected transition graph (join $x,y$ when $P(x,y)+P(y,x)>0$), then $t_{\rm mix}(\varepsilon)\ge L/2$ for $\varepsilon<1/2$. More generally, every event $A$ gives $\|\mu-\pi\|_{\rm TV}\ge|\mu(A)-\pi(A)|$. If a real statistic has mean $m>0$ and variance $V$ under $\mu$, and mean zero and variance $W$ under $\pi$, Chebyshev gives
$$\|\mu-\pi\|_{\rm TV}\ge1-\frac{4(V+W)}{m^2}.$$
A negative displayed right side may be replaced by the trivial bound zero.`,
      idea: String.raw`From two points at graph distance $L$, supports after $\lfloor(L-1)/2\rfloor$ steps are disjoint. Their mutual total variation is one, so at least one lies at distance at least one half from stationarity. For a statistic, use the event where its value exceeds $m/2$: Chebyshev bounds failure of that event under $\mu$ and its occurrence under $\pi$. Subtract the two event probabilities.`,
      caption: 'In support mode, two starts on a 12-cycle can reach only the marked graph balls within the chosen number of steps. In statistic mode, compare the hypercube weight law with its stationary binomial law; the readout computes the separating sign-sum mean, variance and rigorous lower bound.',
      scope: 'Support is the set of all possible positions, not a sampled trajectory. The hypercube statistic is the number of zero bits minus the number of one bits. Its exact finite law is aggregated by Hamming weight.',
      deps: ['stoch-5.3', 'prob-1.6.4'], refs: ['LPW 2nd ed. §§7.1 and 7.3; Proposition 7.14'], links: { source: SOURCE }, tags: ['lower bounds', 'distinguishing statistic'],
      viz(v) {
        const mode = v.select('obstruction', ['support', 'statistic'], 'support'), t = v.slider('steps', 0, 100, 2, { int: true, step: 1 }), n = v.slider('cube dimension', 4, 32, 16, { int: true, step: 1 });
        const g = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 320, title: 'reachable supports' });
        const b = v.stage({ x: [-.12, 1.12], y: [-.06, 1.08], axes: 'box', gutter: true, height: 320, xlabel: 'weight / dimension', ylabel: 'probability', title: 'current and stationary weight laws' });
        v.render(() => {
          const support = mode.value === 'support'; g.el.style.display = support ? '' : 'none'; b.el.style.display = support ? 'none' : ''; n.el.hidden = support;
          if (support) {
            const pts = Array.from({ length: 12 }, (_, j) => [Math.cos(j * Math.PI / 6), Math.sin(j * Math.PI / 6)]);
            g.path([...pts, pts[0]], { color: 'grid' });
            pts.forEach(([x, y], j) => { const a = Math.min(j, 12 - j) <= t.value, c = Math.abs(j - 6) <= t.value; g.dot(x, y, { color: a ? 'blue' : 'faint', r: 5 }); if (c) g.dot(x, y, { color: 'orange', hollow: true, r: 8 }); });
          } else {
            const m = cubeMixing(n.value, t.value), step = 1 / n.value;
            b.bars(m.law, { x0: -.14 * step, dx: step, barWidth: .26, color: 'blue' });
            b.bars(m.stationary, { x0: .14 * step, dx: step, barWidth: .26, color: 'green' });
          }
        });
        v.legend([['blue', 'first support / current law'], ['orange', 'second support (ring)'], ['green', 'stationary law']]);
        v.readout(() => {
          if (mode.value === 'support') { const overlap = Array.from({ length: 12 }, (_, j) => j).filter(j => Math.min(j, 12 - j) <= t.value && Math.abs(j - 6) <= t.value).length; return `Cycle diameter L=6. At step ${t.value}, the two reachable supports share ${overlap} vertices. ${overlap ? 'The disjoint-support argument no longer applies at this time.' : 'Disjoint supports imply pairwise TV=1 and worst-case distance at least 1/2.'}`; }
          const m = cubeStatistic(n.value, t.value), law = cubeMixing(n.value, t.value);
          return String.raw`Sign-sum mean $m=${v.fix(m.mean, 4)}$, transient variance $V=${v.fix(m.variance, 4)}$, stationary variance $W=${n.value}$. Lower bound $=${v.fix(m.lower, 5)}$; exact TV $=${v.fix(law.d[t.value], 5)}$.`;
        });
      },
    },
    {
      num: '5.12', kind: 'Algorithm', name: 'Coupling from the past (Propp–Wilson)',
      statement: String.raw`Represent a finite-state transition kernel by independent identically distributed random maps $f_{-1},f_{-2},\ldots$ satisfying $\Pr(f_t(x)=y)=P(x,y)$, where $P$ has stationary law $\pi$. A realized deterministic map need not preserve $\pi$. Compose the maps from time $-T$ through time $0$. Double $T$ until this composition sends every starting state to one common state, retaining every previously used map at its original time. If such coalescence occurs almost surely, the state returned by this stopping algorithm has law exactly $\pi$. A forward meeting-time output or freshly regenerated recent maps does not inherit this guarantee.`,
      idea: String.raw`On one fixed two-sided random-map sequence, imagine a stationary chain arriving from arbitrarily far in the past. When all starts have the same image at time zero, that stationary chain has this same image, irrespective of its earlier state. Increasing the lookback must retain the recent maps so the possible images are nested. Almost-sure coalescence makes the stationary value identifiable after finitely many map queries.`,
      caption: 'Every state of a reflected path starts in the past and uses the same sequence of maps. The algorithm tests lookbacks 1, 2, 4, … and stops at the first coalesced image. Increase the allowed lookback if it has not finished. Paths show the final tested interval; bars show how many possible outputs remain in each attempt.',
      scope: 'The exact-sampling theorem assumes ideal independent random maps. Here the ideal fair-sign path kernel reflects attempted exits and has uniform stationary law. The widget uses reproducible pseudorandom signs as a finite algorithm trace, with a stated work limit. If that limit is exhausted, it returns no sample; it does not display a truncated draw or a success-conditioned histogram as stationary.',
      deps: ['stoch-5.5'], refs: ['LPW 2nd ed. §25.3; Propp and Wilson (1996), §2'], links: { source: SOURCE, original: 'https://www.stat.berkeley.edu/~aldous/206-RWG/RWGpapers/propp_wilson.pdf' }, tags: ['perfect sampling', 'coupling from the past'],
      viz(v) {
        const n = v.slider('path states', 3, 9, 6, { int: true, step: 1 }), seed = v.slider('seed', 1, 50000, 73, { int: true, step: 1 }), exponent = v.slider('maximum lookback exponent', 0, 10, 8, { int: true, step: 1 }), cache = memoOne();
        const get = () => cache(`${n.value}/${seed.value}/${exponent.value}`, () => cftp(n.value, seed.value, exponent.value));
        const s = v.stage({ x: [-1.05, .05], y: [-.6, 8.6], axes: 'box', gutter: true, height: 320, xlabel: 'time / lookback', ylabel: 'state' });
        const b = v.stage({ x: [-.65, 10.65], y: [-.4, 9.4], axes: 'box', gutter: true, height: 320, xlabel: 'lookback exponent', ylabel: 'possible outputs' });
        v.render(() => {
          const m = get(), last = m.attempts.at(-1);
          last.paths.forEach((path, i) => s.path(path.map((x, t) => [-1 + t / last.T, x]), { color: i === n.value - 1 ? 'orange' : 'blue', alpha: i === n.value - 1 ? 1 : .5, width: 1.7 }));
          last.states.forEach(x => s.dot(0, x, { color: m.complete ? 'green' : 'orange', r: 4 }));
          b.bars(m.attempts.map(a => new Set(a.states).size), { x0: 0, dx: 1, barWidth: .55, color: 'blue' });
        });
        v.legend([['blue', 'other starting states / possible-image count'], ['orange', 'top starting state / incomplete image'], ['green', 'one common output']]);
        v.readout(() => { const m = get(), last = m.attempts.at(-1); return `Tested lookbacks: ${m.attempts.map(a => a.T).join(', ')}. ${m.complete ? 'First coalesced output: ' + m.output + '.' : 'Not coalesced within the work limit: no sample returned.'} Final interval has ${last.T} maps; every older attempt retains the same recent maps. Seeded trace, not an empirical stationarity claim.`; });
      },
    },
  ],
};
