// Rudin, Functional Analysis — Chapter 5 (part 3): Kakutani's fixed point theorem, Haar measure

// ---------------------------------------------------------------- helpers
const GOLD = Math.PI * (3 - Math.sqrt(5)); // an irrational multiple of π: rotation by GOLD has dense orbits
const rot = (a, p) => [Math.cos(a) * p[0] - Math.sin(a) * p[1], Math.sin(a) * p[0] + Math.cos(a) * p[1]];
/** Linear map A and its inverse, used to turn rotations of a disc into "affine rotations" of an ellipse. */
const AFF = [[1.45, 0.55], [0, 0.82]];
const affA = (p) => [AFF[0][0] * p[0] + AFF[0][1] * p[1], AFF[1][1] * p[1]];
const affInv = (p) => { const y = p[1] / AFF[1][1]; return [(p[0] - AFF[0][1] * y) / AFF[0][0], y]; };

export default {
  book: 'fa',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ Kakutani's fixed point theorem
    {
      num: '5.10',
      kind: 'Definition',
      name: 'Affine maps; equicontinuity on a set',
      statement: String.raw`Let $K$ be a convex subset of a topological vector space $X$. A map $T:K\to X$ is **affine** if $T((1-t)x+ty)=(1-t)Tx+tTy$ for $x,y\in K$, $0\le t\le1$. A collection $G$ of maps of $K$ into $X$ is **equicontinuous on $K$** if for every neighbourhood $W$ of $0$ in $X$ there is a neighbourhood $V$ of $0$ such that $Tx-Ty\in W$ for every $T\in G$ whenever $x,y\in K$ and $x-y\in V$.`,
      idea: String.raw`Equicontinuity on $K$ is uniform continuity, uniformly in $T$ — the same $V$ serves every member of $G$ (compare 2.3). A group of isometries of a normed space is equicontinuous with $V=W$; a group containing a map and its inverse that stretch some direction more and more is not.`,
      deps: ['fa-2.3'],
      tags: ['equicontinuity', 'fixed points'],
      verify: true,
    },
    {
      num: '5.11',
      kind: 'Theorem',
      name: "Kakutani's fixed point theorem",
      statement: String.raw`Let $K$ be a nonempty compact convex set in a locally convex space $X$, and let $G$ be a group of affine maps of $K$ onto $K$ that is equicontinuous on $K$. Then $G$ has a common fixed point: there is $p\in K$ with $Tp=p$ for every $T\in G$.`,
      idea: String.raw`Zorn's lemma gives a minimal nonempty compact convex $G$-invariant set $K_0\subset K$; the claim is that $K_0$ is a point. If not, equicontinuity and local convexity produce a continuous seminorm $\rho$ that is $G$-invariant on differences, $\rho(Tx-Ty)=\rho(x-y)$, and positive on some difference in $K_0$. Cover $K_0$ by finitely many $\rho$-balls of half its $\rho$-diameter $\delta$ and average their centres: points of $K_0$ near that average are at $\rho$-distance $<\delta$ from all of $K_0$. The set of such points is compact, convex, $G$-invariant and smaller than $K_0$ — contradicting minimality.`,
      caption: String.raw`Finite-dimensional pictures with $X=\R^2$. In the first two modes $G$ consists of "affine rotations" $x\mapsto c+AR_\alpha A^{-1}(x-c)$ of an ellipse (an infinite group, rotation angle an irrational multiple of $\pi$) or the dihedral symmetries of an affinely distorted pentagon; both are equicontinuous and the centre $c$ is the common fixed point. Watch the orbit of $x_0$ (gold) and its running averages (green) converge to $c$. In the annulus the only candidate is missing ($K$ not convex); on the strip the averages run away ($K$ not compact).`,
      deps: ['fa-5.10', 'fa-1.36', 'fa-1.35'],
      tags: ['fixed points', 'equicontinuity', 'convexity'],
      viz(v) {
        const M = v.M;
        const PENT = M.range(5).map((j) => affA([1.15 * Math.cos(Math.PI / 2 + M.TAU * j / 5), 1.15 * Math.sin(Math.PI / 2 + M.TAU * j / 5)]));
        const DIH = M.range(10).map((j) => (p) => { const q = affInv(p); const r = j < 5 ? rot(M.TAU * j / 5, q) : rot(M.TAU * (j - 5) / 5, [-q[0], q[1]]); return affA(r); });
        const MODES = {
          ell: { label: 'ellipse, irrational rotation', ok: true, T: (p) => affA(rot(GOLD, affInv(p))), inK: (p) => Math.hypot(...affInv(p)) <= 1, maxN: 240, rate: 14 },
          pent: { label: 'pentagon, dihedral group $D_5$', ok: true, inK: (p) => M.pointInPoly(p, PENT), maxN: 10, rate: 1.6 },
          ann: { label: 'annulus (not convex)', ok: false, T: (p) => rot(GOLD, p), inK: (p) => { const r = Math.hypot(...p); return r >= 0.6 && r <= 1.2; }, maxN: 240, rate: 14 },
          strip: { label: 'strip (not compact)', ok: false, T: (p) => [p[0] + 0.35, p[1]], inK: (p) => Math.abs(p[1]) <= 0.8, maxN: 60, rate: 5 },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'ell');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.3, 1.3], equal: true, height: 360, axes: false });
        const x0 = S.handle(0.9, 0.45, { color: 'gold', label: 'x₀', constrain: (x, y) => {
          const Mo = MODES[which.value]; if (Mo.inK([x, y])) return [x, y];
          if (which.value === 'strip') return [x, M.clamp(y, -0.8, 0.8)];
          if (which.value === 'ann') { const r = Math.hypot(x, y) || 1, rr = M.clamp(r, 0.6, 1.2); return [x * rr / r, y * rr / r]; }
          if (which.value === 'ell') { const q = affInv([x, y]), r = Math.hypot(...q); return affA([q[0] / r, q[1] / r]); }
          return M.closestOnConvexPoly([x, y], PENT);
        } });
        let st = {};
        v.legend([['blue', 'the set $K$', { area: true }], ['gold', 'orbit $Tx_0$, $T\\in G$', { dot: true }], ['green', 'running average of the orbit'], ['red', 'failure: no fixed point in $K$']]);
        v.animate((t) => {
          const key = which.value, Mo = MODES[key];
          const n = Math.min(Mo.maxN, 1 + Math.floor(t * Mo.rate));
          // the set K
          if (key === 'ell') S.curve((s) => affA([Math.cos(s), Math.sin(s)]), 0, M.TAU, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.14, close: true });
          if (key === 'pent') S.poly(PENT, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.14 });
          if (key === 'ann') S.rings([M.range(160).map((i) => [1.2 * Math.cos(M.TAU * i / 160), 1.2 * Math.sin(M.TAU * i / 160)]), M.range(160).map((i) => [0.6 * Math.cos(-M.TAU * i / 160), 0.6 * Math.sin(-M.TAU * i / 160)])], { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.14, evenodd: true });
          if (key === 'strip') { S.rect(-9, -0.8, 9, 0.8, { fill: 'blue', fillAlpha: 0.14, stroke: false }); S.hline(0.8, { color: 'blue', width: 2 }); S.hline(-0.8, { color: 'blue', width: 2 }); }
          // orbit and averages
          const p0 = [x0.x, x0.y], orb = [p0];
          for (let k = 1; k < n; k++) orb.push(key === 'pent' ? DIH[k](p0) : Mo.T(orb[k - 1]));
          const avg = []; let sx = 0, sy = 0;
          orb.forEach((p, k) => { sx += p[0]; sy += p[1]; avg.push([sx / (k + 1), sy / (k + 1)]); });
          S.dots(orb.slice(1), { color: 'gold', r: key === 'pent' ? 4 : 2.6 });
          if (key === 'pent') for (let k = 1; k < n; k++) S.line(p0[0], p0[1], orb[k][0], orb[k][1], { color: 'gold', width: 0.8, alpha: 0.5 });
          S.path(avg, { color: 'green', width: 1.8 });
          const a = avg[avg.length - 1];
          const inside = Mo.inK(a);
          const far = Math.hypot(a[0], a[1]) > 0.25 || key === 'strip';
          if (key !== 'strip') S.dot(0, 0, { color: Mo.ok ? 'green' : 'red', r: 9, hollow: true, width: 2.2, label: Mo.ok ? 'fixed point c' : 'c ∉ K', labelPos: 'sw' });
          S.dot(a[0], a[1], { color: Mo.ok ? 'green' : 'red', r: 4.5, label: far ? `average of ${n}` : null, labelPos: 'se' });
          if (key === 'strip') S.corner('every T ∈ G is a translation — no fixed point, averages escape', 'tl', { color: 'red', weight: 600 });
          else if (key === 'ann') S.corner('the averages converge to c, which is not in K', 'tl', { color: 'red', weight: 600 });
          else S.corner(key === 'pent' ? '|G| = 10: the average over G is fixed by every T ∈ G' : 'G infinite but equicontinuous: averages → c', 'tl', { color: 'green', weight: 600 });
          const Ta = key === 'pent' ? DIH[1](a) : Mo.T(a);
          st = { n, d: Math.hypot(a[0], a[1]), move: Math.hypot(Ta[0] - a[0], Ta[1] - a[1]), inside, key };
        }, { period: 20 });
        v.readout(() => {
          const s = st; if (!s.key) return '';
          if (s.key === 'strip') return `After ${s.n} steps the average has moved $${v.fix(0.175 * (s.n - 1), 2)}$ to the right; $|Ta-a|=${v.fix(s.move, 3)}$ for every point $a$. Without compactness there is nothing to converge to.`;
          return `$n=${s.n}$: average $a_n$ has $|a_n-c|=${v.fix(s.d, 4)}$ and $|Ta_n-a_n|=${v.fix(s.move, 4)}$ for the generator $T$. ` + (s.key === 'ann' ? 'The limit $c$ is fixed by $G$ but lies in the hole: $K$ is not convex, so 5.11 does not apply.' : 'The common fixed point is $c$, as Kakutani\'s theorem guarantees.');
        });
      },
    },
    // ------------------------------------------------------------------ Haar measure on compact groups
    {
      num: '5.12',
      kind: 'Definition',
      name: 'Topological groups, translates, Haar measure',
      statement: String.raw`A **topological group** is a group $G$ with a Hausdorff topology in which multiplication $(x,y)\mapsto xy$ and inversion $x\mapsto x^{-1}$ are continuous. For a function $f$ on $G$ and $s\in G$ the left and right translates are $(L_sf)(x)=f(sx)$ and $(R_sf)(x)=f(xs)$. A regular Borel probability measure $m$ on a compact group $G$ is a (normalized) **Haar measure** if it is left-invariant: $\int_G f(sx)\,dm(x)=\int_G f\,dm$ for all $f\in C(G)$ and $s\in G$.`,
      idea: String.raw`Examples: the circle $\T$ with normalized arc length; a finite group with the uniform measure; the torus $\T^n$; the rotation group $SO(3)$. By the Riesz representation theorem, a Haar measure is the same thing as a positive linear functional $M$ on $C(G)$ with $M(1)=1$ and $M(L_sf)=M(f)$.`,
      deps: ['rca-6.19'],
      tags: ['topological groups', 'Haar measure'],
      verify: true,
    },
    {
      num: '5.13',
      kind: 'Lemma',
      name: 'Translation is continuous into C(G)',
      statement: String.raw`Let $G$ be a compact group and $f\in C(G)$. Then the maps $s\mapsto L_sf$ and $s\mapsto R_sf$ are continuous from $G$ into the Banach space $C(G)$ (sup norm). Consequently the orbit $\{L_sf:s\in G\}$ is a compact subset of $C(G)$, and so is the closure of its convex hull.`,
      idea: String.raw`Fix $s_0$ and $\eps>0$. For each $x$ continuity of $(s,x)\mapsto f(sx)$ gives neighbourhoods on which $f$ varies by less than $\eps/2$; compactness of $G$ extracts finitely many, and their intersection is a single neighbourhood $V$ of $s_0$ with $|f(sx)-f(s_0x)|<\eps$ for all $x$ when $s\in V$ — uniform continuity of $f$. The orbit is then a continuous image of the compact $G$, and in the Banach space $C(G)$ the closed convex hull of a compact set is compact (3.20).`,
      caption: String.raw`On the circle group, $L_sf(x)=f(x+s)$. Drag $s$: the red band is $|L_sf-f|$ and the lower panel plots $\omega(s)=\|L_sf-f\|_\infty$ for all $s$. For continuous $f$ (even with a cusp) $\omega(s)\to0$ as $s\to0$; for the step function, which is not in $C(\T)$, $\omega$ jumps to the full height of the step at once — translation is not continuous into the sup norm.`,
      deps: ['fa-5.12', 'fa-3.20'],
      tags: ['topological groups', 'uniform continuity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = {
          smooth: { label: 'smooth', f: (x) => 0.55 * Math.sin(x) + 0.3 * Math.cos(3 * x) + 0.18 * Math.sin(5 * x + 1), cont: true },
          cusp: { label: 'cusp $\\sqrt{|\\sin x|}$', f: (x) => Math.sqrt(Math.abs(Math.sin(x))) - 0.6, cont: true },
          step: { label: 'step (not continuous)', f: (x) => (M.mod(x, M.TAU) < Math.PI ? 0.6 : -0.6), cont: false },
        };
        const which = v.select('$f$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'cusp');
        const sS = v.slider('$s$', -Math.PI, Math.PI, 0.45, { step: 0.005, fmt: (x) => v.fix(x, 3) });
        const XT = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']];
        const top = v.stage({ x: [0, M.TAU], y: [-1.1, 1.1], height: 240, full: true, axes: 'box', xticks: XT, title: '$f$ and its translate $L_sf=f(\\cdot+s)$ on $\\T$' });
        const bot = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1.4], height: 170, full: true, axes: 'box', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: '$\\omega(s)=\\|L_sf-f\\|_\\infty$' });
        const xs = M.linspace(0, M.TAU, 721), cache = {};
        const omega = (key) => {
          if (cache[key]) return cache[key];
          const f = F[key].f, ss = M.linspace(-Math.PI, Math.PI, 721);
          return (cache[key] = ss.map((s) => [s, s === 0 ? 0 : Math.max(...xs.map((x) => Math.abs(f(x + s) - f(x))))]));
        };
        let st = {};
        v.legend([['blue', '$f$'], ['gold', '$L_sf$'], ['red', '$|L_sf-f|$ and its sup', { area: true }]]);
        v.render(() => {
          const key = which.value, f = F[key].f, s = sS.value;
          const diff = xs.map((x) => Math.abs(f(x + s) - f(x)));
          const k = M.argmax(diff), w = diff[k];
          top.between((x) => f(x), (x) => f(x + s), 0, M.TAU, { fill: 'red', fillAlpha: 0.13, n: 720 });
          const br = F[key].cont ? [] : [Math.PI, M.mod(Math.PI - s, M.TAU), M.mod(-s, M.TAU)];
          const piece = (g, st2) => { const cuts = [0, ...br.filter((c) => c > 1e-9 && c < M.TAU - 1e-9).sort((a, b) => a - b), M.TAU]; for (let i = 0; i + 1 < cuts.length; i++) top.fn(g, { ...st2, domain: [cuts[i] + 1e-6, cuts[i + 1] - 1e-6] }); };
          piece(f, { color: 'blue', width: 2.4 });
          piece((x) => f(x + s), { color: 'gold', width: 2.2 });
          top.line(xs[k], f(xs[k]), xs[k], f(xs[k] + s), { color: 'red', width: 2.6 });
          top.dot(xs[k], f(xs[k] + s), { color: 'red', r: 3.5 });
          const W = omega(key);
          bot.path(W, { color: 'red', width: 2.2 });
          bot.vline(s, { color: 'gold', width: 1.2, dash: [4, 4] });
          bot.dot(s, w, { color: 'red', r: 5 });
          if (!F[key].cont) { bot.dot(0, 0, { color: 'red', r: 5, hollow: true }); bot.corner('ω(s) does not tend to 0: translation is discontinuous at f', 'tr', { color: 'red', weight: 600 }); }
          else bot.corner('ω(s) → 0 as s → 0: translation is continuous at f', 'tr', { color: 'green', weight: 600 });
          st = { s, w, cont: F[key].cont };
        });
        v.readout(() => `$s=${v.fix(st.s, 3)}$: $\\|L_sf-f\\|_\\infty=${v.fix(st.w, 4)}$. ` + (st.cont ? 'Halve $s$ and the sup shrinks — the same $\\delta$ works at every point of $\\T$, which is the uniform continuity behind 5.13.' : 'However small $s\\ne0$ is, the translate misses by the full jump $1.2$: the step function is not in $C(\\T)$.'));
      },
    },
    {
      num: '5.14',
      kind: 'Theorem',
      name: 'Haar measure on compact groups',
      statement: String.raw`Every compact group $G$ carries a unique regular Borel probability measure $m$ that is left-invariant, $\int_Gf(sx)\,dm(x)=\int_Gf\,dm$ $(f\in C(G),\,s\in G)$. This $m$ is also right-invariant and inversion-invariant: $\int_Gf(xs)\,dm(x)=\int_Gf(x^{-1})\,dm(x)=\int_Gf\,dm$.`,
      idea: String.raw`Fix $f\in C(G)$. By 5.13 the closed convex hull $H_f$ of the left translates of $f$ is compact in $C(G)$, and the maps $L_s$ are isometries of $C(G)$ leaving $H_f$ invariant — an equicontinuous group of affine maps. Kakutani (5.11) gives a fixed point, a function invariant under all left translations, hence a constant $c$. Doing the same with right translates gives a constant $c'$, and a short convexity argument shows $c=c'$ and that $H_f$ contains no other constant. Setting $M(f)=c$ defines a positive, normalized, linear, bi-invariant functional, and the Riesz representation theorem turns it into $m$. Any left-invariant $\mu$ satisfies $\int f\,d\mu=\int c\,d\mu=c$, which gives uniqueness.`,
      caption: String.raw`The circle group, $s_k=k\alpha$ with $\alpha/\pi$ irrational. Left: averages $\frac1n\sum_{k<n}f(x+s_k)$ of translates of $f$ — members of $H_f$ — flatten onto the constant $\int f\,dm$ (green), the fixed point Kakutani promises. Right: the same averaging applied to a probability measure $\mu$ (its density drawn radially around the circle; the green circle is the uniform density); the averages approach $m=d\theta/2\pi$, the only rotation-invariant probability.`,
      deps: ['fa-5.11', 'fa-5.13', 'fa-3.20', 'rca-6.19'],
      see: ['rca-2.20'],
      tags: ['Haar measure', 'fixed points', 'topological groups'],
      viz(v) {
        const M = v.M;
        const FS = {
          bumps: { label: 'two bumps', f: (x) => Math.exp(2.2 * Math.cos(x - 1)) / 4 + 0.6 * Math.exp(-6 * (1 - Math.cos(x - 4))) },
          saw: { label: 'smoothed sawtooth', f: (x) => M.range(8, 1).reduce((s, k) => s + Math.sin(k * x) / k * Math.exp(-0.15 * k), 0) * 0.55 + 0.3 },
          spike: { label: 'one spike', f: (x) => 1.6 * Math.exp(-12 * (1 - Math.cos(x - 2.2))) - 0.1 },
        };
        const which = v.select('$f$ and $\\mu$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const XT = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']];
        const L = v.stage({ x: [0, M.TAU], y: [-0.6, 2.2], height: 340, axes: 'box', xticks: XT, weight: 1.35, title: 'functions: averages of translates of $f$' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, height: 340, axes: false, title: 'measures: rotation-averages of $\\mu$' });
        const xs = M.linspace(0, M.TAU, 361), cache = {};
        function prep(key) {
          if (cache[key]) return cache[key];
          const f = FS[key].f, mean = M.integrate(f, 0, M.TAU, 2000) / M.TAU;
          const lo = Math.min(...xs.map(f)); const dens = (x) => f(x) - lo + 0.05; const Z = M.integrate(dens, 0, M.TAU, 2000);
          const rho = (x) => dens(x) / Z * M.TAU; // density relative to dθ/2π
          return (cache[key] = { f, mean, rho, rmax: Math.max(...xs.map(rho)) });
        }
        let st = {};
        v.legend([['blue', '$f$, and $\\mu$ (density w.r.t. $m$)'], ['muted', 'two translates / rotated copies', { dash: true }], ['gold', 'the average over $n$ translates'], ['green', '$\\int f\\,dm$ and $m$', { dash: true }]]);
        v.animate((t) => {
          const P = prep(which.value), n = Math.min(160, 1 + Math.floor(t * 9));
          const sk = M.range(n).map((k) => k * GOLD);
          const A = (x) => { let s = 0; for (const a of sk) s += P.f(x + a); return s / n; };
          const fmin = Math.min(...xs.map(P.f)), fmax = Math.max(...xs.map(P.f)), pad = 0.12 * (fmax - fmin);
          L.setView(null, [fmin - pad, fmax + pad]);
          for (const a of sk.slice(1, 3)) L.fn((x) => P.f(x + a), { color: 'muted', width: 1.1, dash: [4, 4], alpha: 0.7, domain: [0, M.TAU] });
          L.fn(P.f, { color: 'blue', width: 2, domain: [0, M.TAU] });
          L.hline(P.mean, { color: 'green', width: 1.8, dash: [6, 4] });
          L.fn(A, { color: 'gold', width: 3.2, domain: [0, M.TAU] });
          const av = xs.map(A), osc = Math.max(...av) - Math.min(...av);
          L.text('∫ f dm', M.TAU - 0.05, P.mean, { align: 'right', dy: -10, color: 'green', size: 12 });
          L.corner(`n = ${n}`, 'tl', { weight: 600 });
          // measures, radial plot r = 1 + 0.45 (density - 1)
          const kap = Math.min(0.45, 0.75 / Math.max(0.1, P.rmax - 1)), rad = (d) => 1 + kap * (d - 1);
          R.circle(0, 0, 1, { color: 'green', width: 1.8, dash: [6, 4] });
          for (const a of sk.slice(1, 3)) R.curve((th) => { const r = rad(P.rho(th - a)); return [r * Math.cos(th), r * Math.sin(th)]; }, 0, M.TAU, { color: 'muted', width: 1, dash: [4, 4], alpha: 0.7, n: 240 });
          R.curve((th) => { const r = rad(P.rho(th)); return [r * Math.cos(th), r * Math.sin(th)]; }, 0, M.TAU, { color: 'blue', width: 2, n: 360 });
          let dev = 0;
          R.curve((th) => { let s = 0; for (const a of sk) s += P.rho(th - a); s /= n; dev = Math.max(dev, Math.abs(s - 1)); const r = rad(s); return [r * Math.cos(th), r * Math.sin(th)]; }, 0, M.TAU, { color: 'gold', width: 3.2, n: 360 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          R.text('m', 0.72, 0.72, { color: 'green', math: true, size: 16 });
          st = { n, osc, mean: P.mean, dev };
        }, { period: 20, still: 6 });
        v.readout(() => `$n=${st.n}$: the average of translates has oscillation $\\max-\\min=${v.fix(st.osc, 4)}$ around $\\int f\\,dm=${v.fix(st.mean, 4)}$; the averaged density deviates from that of $m$ by at most $${v.fix(st.dev, 4)}$. Both tend to $0$: the constant is the Haar integral, and $m$ is the unique invariant probability.`);
      },
    },
  ],
};
