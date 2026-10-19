// Mathematical Biology — Chapter 4: Structured populations (items 4.1–4.7; 4.8–4.14 in ch04-b.js)
import { SURV, FEC, survivorship, leslie, sumv, dotv, domEig, elSum, elRoot, r0T, project, normalizedProjection, nnClass } from './ch04.shared.js';

const SURV_OPTS = [{ value: 'I', label: 'Type I (late deaths)' }, { value: 'II', label: 'Type II (constant)' }, { value: 'III', label: 'Type III (early deaths)' }];

/** Poisson draw by inversion with a uniform generator r. */
function pois(r, mu) { const L = Math.exp(-mu); let k = 0, p = 1; do { k++; p *= r(); } while (p > L && k < 200); return k - 1; }

const pm = (A, d = 2) => String.raw`\begin{pmatrix}` + A.map((row) => row.map((x) => (Math.abs(x) < 5e-13 ? '0' : x.toFixed(d))).join('&')).join(String.raw`\\`) + String.raw`\end{pmatrix}`;

export default {
  collection: 'mathbio',
  chapter: 4,
  title: 'Structured populations',
  summary: String.raw`Individuals of different ages or stages contribute differently to growth, so a population is really a vector. The Leslie matrix projects it forward, and the Perron–Frobenius theorem guarantees a single dominant growth rate and a stable age distribution that any initial population approaches. The Euler–Lotka equation, reproductive value and elasticities turn this into demography that guides conservation, and the renewal and McKendrick equations carry it to continuous age.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Life table: survivorship lₓ and fecundity mₓ',
      statement: String.raw`Count the females of a cohort in age classes $x=1,2,\dots,n$ (one class per time unit). The **survivorship** $\ell_x$ is the probability that a newborn is alive in class $x$, so $\ell_1=1$ and $\ell_{x+1}=s_x\ell_x$ where $s_x$ is the probability of surviving from class $x$ to $x+1$. The **fecundity** $m_x$ is the mean number of daughters produced, over one time unit, by a female in class $x$. The pair $(\ell_x,m_x)$ is the **life table** of the population; $\ell_x m_x$ is the expected number of daughters a newborn will have produced from class $x$.`,
      idea: String.raw`A life table is the age-specific bookkeeping behind every balance law of chapter 1: deaths are encoded in how fast $\ell_x$ falls and births in $m_x$. Survivorship curves are classified as Type I (almost everyone survives until old age), Type II (constant hazard, $\ell_x$ geometric) and Type III (heavy early mortality, as in fish or marine invertebrates). Everything in this chapter is computed from the two columns $\ell_x$ and $m_x$.`,
      scope: String.raw`Female-dominant, single-sex accounting in discrete age classes with a fixed (time-independent) life table. Observed life tables carry sampling error; the cohort below is simulated from a model, not data.`,
      caption: String.raw`A simulated cohort of newborns is followed through the age classes (choose its size, the survivorship type, and how far to follow it). Bars on the left are the observed fraction still alive, the green dots the model $\ell_x$; on the right bars are the observed mean daughters per survivor, dots the model $m_x$. Small cohorts scatter around the curves; resample to see it. The fecundity schedule is a made-up illustration.`,
      deps: ['stat-2.1'],
      tags: ['life table', 'survivorship'],
      refs: ['Edelstein-Keshet ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Life_table' },
      viz(v) {
        const type = v.select('survivorship', SURV_OPTS, 'II');
        const N = v.slider('cohort size', 30, 2000, 300, { int: true, log: true });
        const follow = v.slider('follow cohort to class', 1, 8, 8, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0.3, 8.7], y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'fraction alive', title: 'survivorship ℓₓ', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const B = v.stage({ x: [0.3, 8.7], y: [0, 2.2], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'daughters per female', title: 'fecundity mₓ', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        let cache = { key: '' }, obs = null;
        function sim() {
          const key = type.value + '|' + N.value + '|' + seed;
          if (cache.key === key) return;
          const r = v.rng(1000 * seed + 7), s = SURV[type.value], alive = new Array(8).fill(0), births = new Array(8).fill(0);
          for (let i = 0; i < N.value; i++) {
            for (let x = 0; x < 8; x++) {
              alive[x]++; births[x] += pois(r, FEC[x]);
              if (x < 7 && r() > s[x]) break;
            }
          }
          cache = { key }; obs = { alive, births };
        }
        v.render(() => {
          sim();
          const l = survivorship(SURV[type.value]), f = follow.value, n = N.value;
          A.bars(obs.alive.map((a, i) => (i < f ? a / n : 0)), { x0: 1, color: 'accent' });
          A.path(l.map((p, i) => [i + 1, p]), { color: 'green', width: 1.5, alpha: 0.6 });
          A.dots(l.map((p, i) => [i + 1, p]), { r: 5, color: 'green' });
          B.bars(obs.births.map((b, i) => (i < f && obs.alive[i] ? b / obs.alive[i] : 0)), { x0: 1, color: 'orange' });
          B.dots(FEC.map((p, i) => [i + 1, p]), { r: 5, color: 'green' });
        });
        v.legend([['accent', 'observed fraction alive'], ['orange', 'observed daughters per survivor'], ['green', 'model ℓₓ, mₓ', { dot: true }]]);
        v.readout(() => {
          if (!obs) return '';
          const l = survivorship(SURV[type.value]), f = follow.value, n = N.value;
          const R0m = sumv(l.slice(0, f).map((p, i) => p * FEC[i])), R0o = sumv(obs.births.slice(0, f)) / n;
          return `Model: $\\sum_{x\\le ${f}}\\ell_x m_x=${v.fix(R0m, 3)}$ daughters per newborn; cohort of ${n}: ${v.fix(R0o, 3)}.\nClass 8: $\\ell_8=${v.fix(l[7], 3)}$, observed ${v.fix(obs.alive[7] / n, 3)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Leslie matrix model',
      credit: 'Bernardelli 1941; Lewis 1942; Leslie 1945',
      statement: String.raw`Let $n_x(t)$ be the number of females in age class $x$ at census $t$, $x=1,\dots,n$, and $\mathbf n=(n_1,\dots,n_n)^{\mathsf T}$. With fecundities $F_x\ge0$ (daughters per class-$x$ female per step, counted at the next census) and survival probabilities $s_x\in[0,1]$ from class $x$ to $x+1$,
$$\mathbf n(t+1)=L\,\mathbf n(t),\qquad L=\begin{pmatrix}F_1&F_2&\cdots&F_{n-1}&F_n\\ s_1&0&&&0\\ &s_2&&&\\ &&\ddots&&\\ &&&s_{n-1}&0\end{pmatrix}.$$
The subdiagonal moves each class up one step (and thins it by $s_x$); the top row refills class 1 from births. Hence $\mathbf n(t)=L^t\mathbf n(0)$.`,
      idea: String.raw`The model is the discrete balance law of 1.1 resolved by age: deaths act on the subdiagonal, births on the first row, and nothing else happens. Because the dynamics are linear, $L^t$ is the whole solution, and its long-run behaviour is controlled by the eigenvalues of $L$ (4.3, 4.4). With a single class the model collapses to geometric growth $n_{t+1}=F n_t$ (2.1).`,
      scope: String.raw`A linear, density-independent model with time-independent rates, one sex, and a single census per step. It ignores density dependence, so it predicts unbounded growth or extinction, and it is valid only while the population is far from its resources.`,
      caption: String.raw`Four age classes. Drag the survival and fecundity sliders and the time slider: the pyramid on the left shows $\mathbf n(t)$ (class 1 at the bottom, ghost bars are the previous census) and the right panel plots $\ln N(t)$ for the total population. After a few steps the log-total becomes a straight line of slope $\ln\lambda$ (dashed) while the pyramid keeps one shape.`,
      deps: ['mathbio-4.1', 'mathbio-2.1'],
      tags: ['Leslie matrix', 'age structure'],
      refs: ['Edelstein-Keshet ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Leslie_matrix' },
      viz(v) {
        const F2 = v.slider('$F_2$', 0, 4, 1, { step: 0.05 }), F3 = v.slider('$F_3$', 0, 4, 2, { step: 0.05 }), F4 = v.slider('$F_4$', 0, 4, 1.5, { step: 0.05 });
        const s1 = v.slider('$s_1$', 0.1, 1, 0.8, { step: 0.01 }), s2 = v.slider('$s_2$', 0.1, 1, 0.7, { step: 0.01 }), s3 = v.slider('$s_3$', 0.1, 1, 0.5, { step: 0.01 });
        const T = v.slider('census $t$', 0, 25, 6, { int: true });
        const P = v.stage({ x: [-14, 14], y: [0.3, 4.7], height: 300, axes: false, title: 'age pyramid n(t)', minWidth: 280 });
        const G = v.stage({ x: [0, 25], y: [0, 8], height: 300, axes: 'box', gutter: true, xlabel: 'census t', ylabel: 'ln N(t)', title: 'total population (log scale)', minWidth: 280 });
        const n0 = [10, 6, 4, 2];
        let info = null;
        v.render(() => {
          const A = leslie([0, F2.value, F3.value, F4.value], [s1.value, s2.value, s3.value]);
          const traj = project(A, n0, 25), t = T.value;
          const tot = traj.map(sumv), E = domEig(A), c = dotv(E.w, n0) / dotv(E.w, E.u);
          const mx = Math.max(...traj.slice(0, t + 1).flat(), 1), sc = 12 / Math.max(mx, 14);
          P.setView([-14, 14], [0.3, 4.7]);
          const draw = (st, col, a, wd) => st.forEach((nx, i) => P.rect(-nx * sc / 2 * 1, i + 1 - wd, nx * sc / 2, i + 1 + wd, { fill: col, fillAlpha: a, color: col, alpha: a > 0.2 ? 1 : 0.5 }));
          if (t > 0) draw(traj[t - 1], 'faint', 0.12, 0.42);
          draw(traj[t], 'accent', 0.55, 0.32);
          traj[t].forEach((nx, i) => P.text(v.fix(nx, 1), 13.5, i + 1, { align: 'right', size: 11, color: 'muted', baseline: 'middle' }));
          for (let i = 0; i < 4; i++) P.text('class ' + (i + 1), -13.5, i + 1, { align: 'left', size: 11, color: 'muted', baseline: 'middle' });
          const lt = tot.map((q) => Math.log(Math.max(q, 1e-9))), lo = Math.min(...lt), hi = Math.max(...lt);
          G.setView([0, 25], [Math.floor(lo - 0.3), Math.ceil(hi + 0.3)]);
          G.path(lt.map((q, i) => [i, q]), { color: 'accent', width: 2 });
          G.dots(lt.map((q, i) => [i, q]).filter((_, i) => i <= t), { r: 3, color: 'accent' });
          if (E.lam > 0) G.line(0, Math.log(c), 25, Math.log(c) + 25 * Math.log(E.lam), { color: 'green', dash: true, width: 1.5 });
          G.dot(t, lt[t], { r: 6, color: 'gold' });
          info = { A, E, N: tot[t], growth: t > 0 ? tot[t] / tot[t - 1] : NaN };
        });
        v.readout(() => `$L=${pm(info.A)}$\n$N(${T.value})=${v.fix(info.N, 1)}$, ${isFinite(info.growth) ? `last step ratio $N(t)/N(t-1)=${v.fix(info.growth, 4)}$;` : ''} dominant eigenvalue $\\lambda=${v.fix(info.E.lam, 4)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Perron–Frobenius theorem for primitive matrices',
      credit: 'Perron 1907; Frobenius 1908–1912',
      statement: String.raw`Let $A$ be a square matrix with nonnegative entries.
(a) If $A$ is **irreducible** (the directed graph with an edge $j\to i$ whenever $a_{ij}>0$ is strongly connected), its spectral radius $\rho(A)$ is a simple eigenvalue with a strictly positive right eigenvector and a strictly positive left eigenvector, and no other eigenvector is nonnegative.
(b) If $A$ is moreover **primitive** ($A^k$ has all entries positive for some $k$; equivalently the cycle lengths of the graph have gcd $1$), then every other eigenvalue has modulus strictly smaller than $\rho(A)$.
(c) If irreducible with period $h>1$, exactly $h$ eigenvalues lie on the circle $|z|=\rho$, equally spaced.
In every case $\|A^k\|^{1/k}\to\rho(A)$.`,
      idea: String.raw`For a positive matrix, Perron's argument finds the largest $\lambda$ for which $A\mathbf x\ge\lambda\mathbf x$ has a nonzero nonnegative solution; positivity of $A$ then forces equality and strictness everywhere, and a second eigenvalue of equal modulus would give an eigenvector with cancellations that positivity forbids. Frobenius extended this to nonnegative matrices by perturbation and by looking at the cycle structure of the graph. The formula $\|A^k\|^{1/k}\to\rho$ is the spectral radius formula (rca-18.9); for chains the same theorem is stoch-4.6.`,
      scope: String.raw`Finite square matrices with real nonnegative entries. A Leslie matrix with all $s_x>0$ is irreducible iff $F_n>0$, and then primitive iff the gcd of the classes $x$ with $F_x>0$ is $1$.`,
      caption: String.raw`The matrix is $\begin{pmatrix}d&a&3\\0.5&0&0\\0&e&0\end{pmatrix}$ (a three-class Leslie-type matrix with an extra self-loop $d$). Left: its eigenvalues in $\mathbb C$ and the circle $|z|=\rho$. Right: $\|A^k\|_F^{1/k}$ against $k$. Set $a=d=0$ and the matrix is a pure 3-cycle: three eigenvalues sit on the circle and no convergence of shape is possible. Set $e=0$ and it becomes reducible.`,
      deps: ['mathbio-4.2', 'rca-18.9', 'stoch-4.6'],
      tags: ['Perron–Frobenius', 'spectrum'],
      refs: ['Edelstein-Keshet ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perron%E2%80%93Frobenius_theorem' },
      viz(v) {
        const a = v.slider('$a$ (entry 1,2)', 0, 2, 1, { step: 0.05 }), d = v.slider('$d$ (self-loop)', 0, 1.5, 0, { step: 0.05 }), e = v.slider('$e$ (entry 3,2)', 0, 1, 0.6, { step: 0.05 });
        const C = v.stage({ x: [-3.6, 3.6], y: [-3, 3], equal: true, height: 320, axes: true, title: 'eigenvalues in the plane', minWidth: 280 });
        const G = v.stage({ x: [0, 60], y: [0, 4], height: 320, axes: 'box', gutter: true, xlabel: 'k', ylabel: '$\\|A^k\\|^{1/k}$', title: 'norm growth rate', minWidth: 260 });
        let info = null;
        v.render(() => {
          const A = [[d.value, a.value, 3], [0.5, 0, 0], [0, e.value, 0]];
          const ev = v.M.eig(A).values, rho = Math.max(...ev.map((z) => z.abs())), nn = nnClass(A);
          C.circle(0, 0, rho, { color: 'green', dash: true, width: 1.5 });
          ev.forEach((z) => { const onC = Math.abs(z.abs() - rho) < 1e-6; C.dot(z.re, z.im, { r: 6, color: onC ? 'gold' : 'accent', hollow: !onC && z.abs() < 1e-9 }); });
          const pts = []; let M = A.map((r) => r.slice());
          for (let k = 1; k <= 60; k++) { if (k > 1) M = v.M.matMul(M, A); const fn = Math.sqrt(sumv(M.flat().map((q) => q * q))); pts.push([k, Math.pow(fn, 1 / k)]); }
          G.setView([0, 60], [0, Math.ceil(Math.max(rho * 1.6, 1.5) * 2) / 2]);
          G.path(pts, { color: 'accent', width: 2 });
          G.hline(rho, { color: 'green', dash: true });
          const onCount = ev.filter((z) => Math.abs(z.abs() - rho) < 1e-6).length;
          info = { rho, onCount, nn, last: pts[59][1] };
        });
        v.legend([['gold', 'eigenvalues on |z| = ρ', { dot: true }], ['accent', 'other eigenvalues', { dot: true }], ['green', 'spectral radius ρ', { dash: true }]]);
        v.readout(() => {
          const t = !info.nn.irreducible ? '**reducible**: the theorem’s positivity and simplicity claims need not hold' : info.nn.period === 1 ? '**primitive**: ρ is the only eigenvalue of that modulus' : `**irreducible with period ${info.nn.period}**: ${info.onCount} eigenvalues on the circle`;
          return `$\\rho=${v.fix(info.rho, 4)}$; $\\|A^{60}\\|_F^{1/60}=${v.fix(info.last, 4)}$. ${t}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Strong ergodic theorem: convergence to the stable age distribution',
      credit: 'Lotka 1922 (stable age distribution); Perron–Frobenius proof',
      statement: String.raw`Let $L$ be a primitive Leslie matrix with dominant eigenvalue $\lambda_1>0$, right eigenvector $\mathbf u>0$ and left eigenvector $\mathbf w>0$, normalised so that $\sum u_x=1$. For every nonnegative initial vector $\mathbf n(0)\ne0$,
$$\frac{\mathbf n(t)}{\lambda_1^{\,t}}\longrightarrow\frac{\mathbf w\cdot\mathbf n(0)}{\mathbf w\cdot\mathbf u}\,\mathbf u,\qquad\text{so}\qquad\frac{\mathbf n(t)}{\sum_x n_x(t)}\to\mathbf u .$$
The age distribution tends to the **stable age distribution** $\mathbf u$ whatever the initial one, geometrically fast: the error decays like $(|\lambda_2|/\lambda_1)^t$, up to a polynomial factor if $\lambda_2$ is defective.`,
      idea: String.raw`Expand $\mathbf n(0)$ in eigenvectors of $L$ (or in the Jordan basis). By 4.3(b) the dominant mode is simple and every other mode is multiplied at each step by a factor of modulus at most $|\lambda_2|<\lambda_1$ relative to the dominant one, so after dividing by $\lambda_1^t$ only the $\mathbf u$ term survives. The coefficient is the left-eigenvector projection $\mathbf w\cdot\mathbf n(0)/\mathbf w\cdot\mathbf u$, which is where reproductive value (4.9) comes from. Without primitivity (a period $h>1$) the shape keeps rotating around a cycle and the theorem fails.`,
      scope: String.raw`The 1922 original treats continuous age and discusses limitations when fertility changes with population composition; the displayed result is its modern finite-matrix analogue, not a verbatim theorem from that paper. Fixed rates, primitive $L$ (for a Leslie matrix with every class-to-class survival probability strictly positive: $F_n>0$ and the gcd of the lengths $x$ with $F_x>0$ is $1$). Rate of convergence set by the subdominant eigenvalue; complex $\lambda_2$ gives damped age-structure oscillations.`,
      caption: String.raw`Four age classes. Left: the share of class 1 in the population for four very different starting distributions; the green line is $u_1$. Right: the $\ell^1$ distance to $\mathbf u$ on a log axis, with a dashed line of slope $\ln(|\lambda_2|/\lambda_1)$. Vary $F_3$ and $F_4$ to change the gap; set $F_3=0$ with $F_4>0$ to get period 4. With $F_4=0$ it is reducible; with both fecundities zero every population dies within four steps, so its normalized age distribution ceases to exist.`,
      deps: ['mathbio-4.3'],
      tags: ['stable age distribution', 'ergodicity'],
      refs: ['Lotka (1922), PNAS 8:339–345 (continuous-age historical source); modern finite-matrix statement follows from Perron–Frobenius as proved here'],
      links: { doi: 'https://doi.org/10.1073/pnas.8.11.339' },
      viz(v) {
        const F3 = v.slider('$F_3$', 0, 4, 1.8, { step: 0.05 }), F4 = v.slider('$F_4$', 0, 4, 1.2, { step: 0.05 });
        const s = v.slider('survival $s$', 0.3, 1, 0.8, { step: 0.01 });
        const TT = 40;
        const P = v.stage({ x: [0, TT], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'census t', ylabel: 'share in class 1', title: 'share of class 1', minWidth: 280 });
        const D = v.stage({ x: [0, TT], y: [1e-12, 2], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'census t', ylabel: 'distance to u', title: 'ℓ¹ distance to the stable distribution', minWidth: 280 });
        const starts = [[1, 0, 0, 0], [0, 0, 0, 1], [0.1, 0.2, 0.3, 0.4], [0.5, 0, 0.5, 0]];
        const cols = ['accent', 'orange', 'purple', 'teal'];
        let info = null;
        v.render(() => {
          const A = leslie([0, 0, F3.value, F4.value], [s.value, s.value, s.value]);
          const cls = nnClass(A), fertile = F3.value + F4.value > 0;
          const E = fertile ? domEig(A) : { lam: 0, u: null }, ev = fertile ? v.M.eig(A).values : [];
          const ratio = ev.length > 1 && ev[0].abs() > 0 ? ev[1].abs() / ev[0].abs() : null;
          const runs = starts.map((n0) => normalizedProjection(A, n0, TT));
          runs.forEach((r, k) => {
            P.path(r.map((q, t) => q && [t, q[0]]).filter(Boolean), { color: cols[k], width: 2 });
            if (E.u) D.path(r.map((q, t) => q && [t, Math.max(1e-12, sumv(q.map((x, i) => Math.abs(x - E.u[i]))))]).filter(Boolean), { color: cols[k], width: 2 });
          });
          if (E.u) P.hline(E.u[0], { color: 'green', dash: true, width: 1.5 });
          if (ratio > 0 && ratio < 1) { const d0 = 1.2; D.path(Array.from({ length: TT + 1 }, (_, t) => [t, d0 * Math.pow(ratio, t)]), { color: 'ink', dash: true, alpha: 0.6 }); }
          info = { cls, fertile, ratio, lam: E.lam, u: E.u, d: runs.map((r) => E.u && r[TT] ? sumv(r[TT].map((x, i) => Math.abs(x - E.u[i]))) : null) };
        });
        v.legend([['accent', 'start (1,0,0,0)'], ['orange', 'start (0,0,0,1)'], ['purple', 'start (.1,.2,.3,.4)'], ['teal', 'start (.5,0,.5,0)'], ['green', 'u₁', { dash: true }]]);
        v.readout(() => {
          if (!info.fertile) return '**No reproduction**: every population is extinct by t=4; normalized age shares are undefined after extinction.';
          const classification = info.cls.irreducible ? info.cls.period === 1 ? 'primitive: shape converges' : `imprimitive: period ${info.cls.period}` : 'reducible: the theorem does not apply to all starts';
          return `$\\lambda_1=${v.fix(info.lam, 4)}$, $|\\lambda_2|/\\lambda_1=${v.fix(info.ratio, 4)}$ → ${classification}.\nPerron age profile $\\mathbf u=(${info.u.map((x) => v.fix(x, 3)).join(',\\ ')})$; distances at $t=${TT}$: ${info.d.map(x => x === null ? 'extinct (share undefined)' : '$' + v.sci(Math.max(x, 1e-16), 2) + '$').join(', ')}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Net reproductive number R₀ and generation time',
      statement: String.raw`For a life table $(\ell_x,m_x)$ the **net reproductive number** is the expected number of daughters of a newborn over her lifetime,
$$R_0=\sum_{x}\ell_x m_x ,$$
and the **generation time** is the mean age of mothers at the birth of their daughters,
$$T=\frac{\sum_x x\,\ell_x m_x}{\sum_x \ell_x m_x}.$$
(In the convention of 4.2 the age $x$ of class $x$ is the number of census steps from birth to the census at which its offspring are counted.) The sequence $\ell_x m_x/R_0$ is a probability distribution on ages — the distribution of the age of a mother at a birth — and $T$ is its mean.`,
      idea: String.raw`$R_0$ is the factor by which the population multiplies per generation: each newborn is replaced by $R_0$ newborns on average, whatever the timing. $T$ records the timing. Together they give the quick estimate $r\approx\ln R_0/T$ (4.8), and by 4.7 whether the population grows depends only on whether $R_0>1$.`,
      scope: String.raw`Defined for a fixed life table, females only. There are other definitions of "generation time" (mean age of mothers in the stable population, or the time for the population to multiply by $R_0$); the one above is the cohort mean $T_c$.`,
      caption: String.raw`Drag the orange handles to edit the fecundity $m_x$ (left); the green curve shows $\ell_x$ for the chosen survivorship type. The right panel shows $\ell_x m_x$ as bars; its total is $R_0$ and its centre of mass (gold line) is $T$. Notice that $R_0$ is the area, $T$ the balance point.`,
      deps: ['mathbio-4.1', 'prob-1.6.1a'],
      tags: ['R0', 'generation time'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const type = v.select('survivorship', SURV_OPTS, 'II');
        const A = v.stage({ x: [0.3, 8.7], y: [0, 3], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'mₓ  /  ℓₓ', title: 'drag mₓ', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const B = v.stage({ x: [0.3, 8.7], y: [0, 1.6], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'ℓₓ mₓ', title: 'lₓmₓ: area R₀, centre T', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const hs = FEC.map((m, i) => A.handle(i + 1, m, { color: 'orange', r: 7, constrain: { x: [i + 1, i + 1], y: [0, 3] } }));
        let info = null;
        v.render(() => {
          const l = survivorship(SURV[type.value]), m = hs.map((h) => h.y), lm = l.map((p, i) => p * m[i]);
          A.path(l.map((p, i) => [i + 1, p]), { color: 'green', width: 1.5 });
          A.dots(l.map((p, i) => [i + 1, p]), { r: 3, color: 'green' });
          A.bars(m, { x0: 1, color: 'orange' });
          B.bars(lm, { x0: 1, color: 'accent' });
          const { R0, T } = r0T(l, m);
          if (R0 > 0) { B.vline(T, { color: 'gold', width: 2.5 }); B.text('T', T, 1.5, { color: 'gold', size: 13, dx: 8 }); }
          info = { R0, T };
        });
        v.legend([['orange', 'fecundity mₓ'], ['green', 'survivorship ℓₓ'], ['accent', 'ℓₓmₓ'], ['gold', 'generation time T']]);
        v.readout(() => `$R_0=\\sum \\ell_x m_x=${v.fix(info.R0, 3)}$, $T=${isFinite(info.T) ? v.fix(info.T, 3) : '—'}$ class-steps.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Euler–Lotka equation',
      credit: 'Euler 1760 (publ. 1767); Lotka 1907; Sharpe & Lotka 1911',
      statement: String.raw`Let $L$ be the Leslie matrix of the life table $(\ell_x,m_x)$, $x=1,\dots,n$, with $F_x=m_x$ and $s_x=\ell_{x+1}/\ell_x$. A real number $\lambda>0$ is an eigenvalue of $L$ with a nonnegative eigenvector if and only if
$$\sum_{x=1}^{n}\lambda^{-x}\,\ell_x\,m_x=1 .$$
The left side is strictly decreasing in $\lambda$ when some $m_x>0$, so there is exactly one positive root $\lambda^*$, and $\lambda^*$ is the dominant eigenvalue of $L$ (the asymptotic growth factor per step, $r=\ln\lambda^*$).`,
      idea: String.raw`Write the eigenvector as $u_{x+1}=s_xu_x/\lambda$, so $u_x=\ell_x\lambda^{-(x-1)}u_1$; the first row of $L\mathbf u=\lambda\mathbf u$ says $\lambda u_1=\sum F_xu_x$, which after cancelling $u_1$ is the displayed equation. Each term $\lambda^{-x}\ell_xm_x$ is the discounted number of daughters produced from class $x$, so the equation says that a newborn exactly replaces herself once offspring are discounted at the growth rate. Monotonicity makes the root unique, and 4.3 identifies it as the dominant eigenvalue.`,
      scope: String.raw`Finite age classes with fixed rates. The same equation in continuous age is $\int_0^\infty e^{-ra}\ell(a)m(a)\,da=1$, the characteristic equation of Lotka's renewal equation (4.13).`,
      caption: String.raw`Left: $\phi(\lambda)=\sum\lambda^{-x}\ell_xm_x$ plotted against $\lambda$ for the chosen survivorship type and a fecundity multiplier; drag the gold point along the curve. Right: the individual terms at that $\lambda$ stack up to $\phi$. The curve crosses level 1 exactly where the dominant eigenvalue of the Leslie matrix built from the same table sits (checked in the readout by power iteration and by a general eigenvalue solver).`,
      deps: ['mathbio-4.2', 'mathbio-4.5'],
      tags: ['Euler–Lotka', 'growth rate'],
      refs: ['Edelstein-Keshet ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler%E2%80%93Lotka_equation' },
      viz(v) {
        const type = v.select('survivorship', SURV_OPTS, 'II');
        const k = v.slider('fecundity multiplier', 0.2, 3, 1, { step: 0.02 });
        const A = v.stage({ x: [0.3, 2.5], y: [0, 4], height: 320, axes: 'box', gutter: true, xlabel: 'λ', ylabel: 'φ(λ)', title: 'φ(λ) = Σ λ⁻ˣ ℓₓ mₓ', minWidth: 280 });
        const B = v.stage({ x: [0.3, 8.7], y: [0, 2], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'λ⁻ˣ ℓₓ mₓ', title: 'terms at the chosen λ', minWidth: 260, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const phi0 = (l, m, x) => elSum(l, m, x);
        const h = A.handle(0.9, 1, { color: 'gold', r: 8, label: 'λ', labelPos: 'ne', constrain: (x) => { const X = Math.min(2.5, Math.max(0.3, x)); const l = survivorship(SURV[type.value]); return [X, Math.min(4, phi0(l, FEC.map((q) => q * k.value), X))]; } });
        let info = null;
        v.render(() => {
          const l = survivorship(SURV[type.value]), m = FEC.map((q) => q * k.value), lam = elRoot(l, m);
          h.set(h.x, Math.min(4, phi0(l, m, h.x)));
          A.fn((x) => phi0(l, m, x), { color: 'accent', width: 2, domain: [0.3, 2.5] });
          A.hline(1, { color: 'green', dash: true });
          A.vline(lam, { color: 'green', alpha: 0.5 });
          A.dot(lam, 1, { r: 6, color: 'green', label: 'λ*', labelPos: 'ne' });
          const terms = l.map((p, i) => p * m[i] * Math.pow(h.x, -(i + 1)));
          B.setView([0.3, 8.7], [0, Math.max(0.4, Math.ceil(Math.max(...terms) * 12) / 10)]);
          B.bars(terms, { x0: 1, color: 'orange' });
          B.text('Σ = ' + v.fix(sumv(terms), 3), 8.5, Math.max(0.4, Math.ceil(Math.max(...terms) * 12) / 10) * 0.92, { align: 'right', color: 'ink', size: 13 });
          const A2 = leslie(m, SURV[type.value]);
          info = { lam, pw: domEig(A2).lam, ge: v.M.eig(A2).values[0].re, phi: sumv(terms) };
        });
        v.readout(() => `$\\lambda^*=${v.fix(info.lam, 6)}$ from the equation; dominant eigenvalue of $L$: power iteration $${v.fix(info.pw, 6)}$, general solver $${v.fix(info.ge, 6)}$.\nAt your $\\lambda=${v.fix(h.x, 3)}$: $\\phi=${v.fix(info.phi, 3)}$ ${info.phi > 1 ? '> 1 (λ below the root: population still growing faster)' : '< 1'}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'λ > 1 exactly when R₀ > 1',
      statement: String.raw`For a life table with $R_0=\sum\ell_xm_x>0$ and dominant Leslie eigenvalue $\lambda$ (the root of 4.6),
$$\lambda>1\iff R_0>1,\qquad \lambda=1\iff R_0=1,\qquad \lambda<1\iff R_0<1 .$$
So the population eventually grows, stays level or declines according to whether a newborn replaces herself more than, exactly, or less than once. The values of $\lambda$ and $R_0$ are different numbers in general; only their position relative to $1$ agrees.`,
      idea: String.raw`The Euler–Lotka function $\phi(\lambda)=\sum\lambda^{-x}\ell_xm_x$ is continuous and strictly decreasing with $\phi(1)=R_0$ and $\phi(\lambda^*)=1$. If $R_0>1$ then $\phi(1)>1=\phi(\lambda^*)$, and since $\phi$ is decreasing, $\lambda^*>1$; the other cases are the same inequality reversed (the intermediate value theorem, pma-4.23, guarantees the root exists at all because $\phi\to\infty$ as $\lambda\to0^+$ and $\phi\to0$ as $\lambda\to\infty$). The sign comparison is thus a one-line consequence of monotonicity.`,
      scope: String.raw`Density-independent Leslie model with a fixed life table. The threshold statement is the demographic analogue of the epidemic threshold $\mathcal R_0>1$ (chapter 6).`,
      caption: String.raw`Scale the whole fecundity schedule by $k$ (drag the gold handle along the $k$ axis, or change the survivorship type). Left: $R_0(k)$ (straight line) and $\lambda(k)$ (curve) cross the level 1 at the same $k$. Right: the pair $(R_0-1,\lambda-1)$ traces a curve confined to the first and third quadrants.`,
      deps: ['mathbio-4.6', 'pma-4.23'],
      tags: ['R0', 'threshold'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const type = v.select('survivorship', SURV_OPTS, 'II');
        const A = v.stage({ x: [0, 2.5], y: [0, 3], height: 320, axes: 'box', gutter: true, xlabel: 'fecundity multiplier k', ylabel: 'R₀, λ', title: 'R₀(k) and λ(k)', minWidth: 280 });
        const B = v.stage({ x: [-1, 2.5], y: [-1, 1.2], height: 320, axes: true, title: '(R₀ − 1, λ − 1)', minWidth: 260 });
        const h = A.handle(1, 0, { color: 'gold', r: 8, constrain: { x: [0.02, 2.5], y: [0, 0] } });
        let table = null, tkey = '';
        function tab() {
          if (tkey === type.value) return;
          const l = survivorship(SURV[type.value]);
          table = Array.from({ length: 126 }, (_, i) => { const k = 0.02 + i * 0.02; const m = FEC.map((q) => q * k); return { k, R0: r0T(l, m).R0, lam: elRoot(l, m) }; });
          tkey = type.value;
        }
        let info = null;
        v.render(() => {
          tab();
          A.path(table.map((p) => [p.k, p.R0]), { color: 'orange', width: 2 });
          A.path(table.map((p) => [p.k, p.lam]), { color: 'accent', width: 2 });
          A.hline(1, { color: 'green', dash: true });
          B.path(table.map((p) => [p.R0 - 1, p.lam - 1]), { color: 'accent', width: 2 });
          B.rect(0, 0, 2.5, 1.2, { fill: 'green', fillAlpha: 0.07, stroke: false });
          B.rect(-1, -1, 0, 0, { fill: 'red', fillAlpha: 0.07, stroke: false });
          const k = h.x, l = survivorship(SURV[type.value]), m = FEC.map((q) => q * k), R0 = r0T(l, m).R0, lam = elRoot(l, m);
          A.dot(k, R0, { r: 5, color: 'orange' }); A.dot(k, lam, { r: 5, color: 'accent' });
          B.dot(R0 - 1, lam - 1, { r: 7, color: 'gold' });
          const kc = table.find((p) => p.R0 >= 1);
          info = { k, R0, lam, kc: kc ? kc.k : NaN };
        });
        v.legend([['orange', 'R₀(k)'], ['accent', 'λ(k)'], ['green', 'level 1', { dash: true }]]);
        v.readout(() => `$k=${v.fix(info.k, 2)}$: $R_0=${v.fix(info.R0, 3)}$, $\\lambda=${v.fix(info.lam, 4)}$ → both ${info.R0 > 1 ? '> 1' : info.R0 < 1 ? '< 1' : '= 1'} (${(info.R0 > 1) === (info.lam > 1) ? 'agree' : 'borderline'}). Both cross 1 near $k\\approx${v.fix(info.kc, 2)}$.`);
      },
    },
  ],
};

