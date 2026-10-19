// Rudin, Functional Analysis — Chapter 3 (part 2): weak topologies, 3.8–3.14

/** Unit vector, cross product and an orthonormal pair spanning the plane ⟂ n (3D helpers). */
const unit3 = (a) => { const r = Math.hypot(a[0], a[1], a[2]); return [a[0] / r, a[1] / r, a[2] / r]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function planeBasis(n) {
  const u = unit3(n), t = Math.abs(u[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const e1 = unit3(cross(u, t)), e2 = cross(u, e1);
  return [e1, e2];
}
/** Square patch of the plane through 0 with normal n. */
function planePatch(n, s) {
  const [a, b] = planeBasis(n);
  return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [0, 1, 2].map((k) => s * (i * a[k] + j * b[k])));
}

export default {
  collection: 'fa',
  chapter: 3,
  items: [
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Topologies induced by families of functions',
      statement: String.raw`Let $X$ be a set and $\mathscr F$ a nonempty family of maps $f:X\to Y_f$ into topological spaces $Y_f$. The **$\mathscr F$-topology** on $X$ is the weakest topology in which every $f\in\mathscr F$ is continuous; its basic open sets are the finite intersections $f_1^{-1}(V_1)\cap\dots\cap f_n^{-1}(V_n)$ with $V_i$ open in $Y_{f_i}$.
(a) If every $Y_f$ is Hausdorff and $\mathscr F$ separates points of $X$, the $\mathscr F$-topology is Hausdorff.
(b) If, in addition, $X$ is compact in some topology $\tau_1$ in which every $f\in\mathscr F$ is continuous, then $\tau_1$ coincides with the $\mathscr F$-topology.
(c) If a sequence of continuous real-valued functions separates points of a compact space, that space is metrizable.`,
      idea: String.raw`For (a), if $f(p)\ne f(q)$, disjoint neighbourhoods of $f(p)$ and $f(q)$ in $Y_f$ pull back to disjoint open sets. For (b), the $\mathscr F$-topology $\tau$ is contained in $\tau_1$ by minimality, so the identity $(X,\tau_1)\to(X,\tau)$ is a continuous bijection from a compact space onto a Hausdorff space, hence a homeomorphism. For (c), replace each separating function by its bounded transform $g_n=f_n/(1+|f_n|)$ and use $d(p,q)=\sum_{n\ge1}2^{-n}|g_n(p)-g_n(q)|$; continuity and (b) identify its metric topology. This is how weak and weak$^*$ topologies are built, and (b) is what makes them computable on compact sets (3.16).`,
      caption: String.raw`$X=\R^2$ with a family $\mathscr F$ of real functions. The shaded sets are basic neighbourhoods $\bigcap_{f\in\mathscr F}\{x:|f(x)-f(p)|<\eps\}$ of $p$ (blue) and $q$ (red); dashed curves are the level sets through $p$ and $q$. With one coordinate the neighbourhoods are strips, with the norm $|x|$ they are annuli. Press the button to put $q$ on the fibre of $p$: if $\mathscr F$ does not separate them, no $\eps$ makes the neighbourhoods disjoint.`,
      deps: [],
      refs: ['Rudin, Functional Analysis, 2nd ed., §3.8, pp. 62–63'],
      tags: ['weak topologies', 'Hausdorff'],
      viz(v) {
        const M = v.M;
        const lin = (th) => { const c = Math.cos(th), s = Math.sin(th); return { f: (p) => c * p[0] + s * p[1], c, s }; };
        const FAM = {
          x: { label: '$\\{x_1\\}$', fs: [lin(0)] },
          xy: { label: '$\\{x_1,x_2\\}$', fs: [lin(0), lin(Math.PI / 2)] },
          hex: { label: 'three directions', fs: [lin(0), lin(Math.PI / 3), lin(2 * Math.PI / 3)] },
          r: { label: '$\\{|x|\\}$', fs: [{ f: (p) => Math.hypot(p[0], p[1]), radial: true }] },
        };
        const fam = v.select('$\\mathscr F=$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'x');
        const eps = v.slider('$\\varepsilon$', 0.05, 0.8, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.75, 1.75], equal: true, height: 360, ticks: false });
        const p = S.handle(-0.6, 0.55, { color: 'blue', label: 'p' });
        const q = S.handle(0.9, -0.45, { color: 'red', label: 'q' });
        v.button('put $q$ on the fibre of $p$', () => {
          const F = fam.value;
          if (F === 'x') q.set(p.x, q.y === p.y ? -p.y : q.y);
          else if (F === 'r') { const r = Math.hypot(p.x, p.y), a = Math.atan2(q.y, q.x); q.set(r * Math.cos(a), r * Math.sin(a)); }
        });
        const cB = v.rgb('blue'), cR = v.rgb('red'), cP = v.rgb('purple');
        let st = {};
        v.render(() => {
          const F = FAM[fam.value], e = eps.value, P = [p.x, p.y], Q = [q.x, q.y];
          const fp = F.fs.map((o) => o.f(P)), fq = F.fs.map((o) => o.f(Q));
          S.raster((x, y) => {
            let inP = true, inQ = true;
            for (let i = 0; i < F.fs.length; i++) { const z = F.fs[i].f([x, y]); if (Math.abs(z - fp[i]) >= e) inP = false; if (Math.abs(z - fq[i]) >= e) inQ = false; }
            if (inP && inQ) return [cP[0], cP[1], cP[2], 120];
            if (inP) return [cB[0], cB[1], cB[2], 60];
            if (inQ) return [cR[0], cR[1], cR[2], 60];
            return null;
          }, { res: 2, key: `${fam.value}|${P.map((z) => z.toFixed(3))}|${Q.map((z) => z.toFixed(3))}|${e}` });
          for (const [pt, col] of [[P, 'blue'], [Q, 'red']]) for (const o of F.fs) {
            if (o.radial) S.circle(0, 0, Math.hypot(pt[0], pt[1]), { color: col, width: 1.2, dash: [5, 4] });
            else { const z = o.f(pt); S.line(z * o.c - 9 * o.s, z * o.s + 9 * o.c, z * o.c + 9 * o.s, z * o.s - 9 * o.c, { color: col, width: 1.1, dash: [5, 4], alpha: 0.8 }); }
          }
          S.dot(0, 0, { color: 'ink', r: 2.5 });
          const d = Math.max(...fp.map((z, i) => Math.abs(z - fq[i])));
          const disjoint = d >= 2 * e;
          S.corner(d < 1e-6 ? 'F does not separate p, q: not Hausdorff' : disjoint ? 'neighbourhoods disjoint' : 'neighbourhoods overlap — shrink ε', 'tl', { color: d < 1e-6 ? 'red' : disjoint ? 'green' : 'muted', weight: 600 });
          st = { d, e, n: F.fs.length };
        });
        v.legend([['blue', 'basic neighbourhood of $p$', { area: true }], ['red', 'basic neighbourhood of $q$', { area: true }], ['purple', 'overlap', { area: true }]]);
        v.readout(() => st.d < 1e-6
          ? `Every $f\\in\\mathscr F$ takes the same value at $p$ and $q$, so every $\\mathscr F$-open set containing one contains the other: the $\\mathscr F$-topology is not Hausdorff.`
          : `$\\max_{f\\in\\mathscr F}|f(p)-f(q)| = ${v.fix(st.d, 3)}$, so the basic neighbourhoods are disjoint exactly when $\\varepsilon\\le ${v.fix(st.d / 2, 3)}$ (now $\\varepsilon=${v.fix(st.e, 2)}$).`);
      },
    },
    {
      num: '3.9',
      kind: 'Lemma',
      name: 'A functional dominated by finitely many is their combination',
      statement: String.raw`Let $\Lambda_1,\dots,\Lambda_n$ and $\Lambda$ be linear functionals on a vector space $X$ and $N=\{x:\Lambda_1x=\dots=\Lambda_nx=0\}$. The following are equivalent:
(a) $\Lambda=\alpha_1\Lambda_1+\dots+\alpha_n\Lambda_n$ for some scalars $\alpha_i$;
(b) there is $\gamma<\infty$ with $|\Lambda x|\le\gamma\max_i|\Lambda_ix|$ for all $x\in X$;
(c) $\Lambda x=0$ for every $x\in N$.`,
      idea: String.raw`(a)$\Rightarrow$(b)$\Rightarrow$(c) are immediate. For (c)$\Rightarrow$(a), map $X$ to the scalars$^n$ by $\pi(x)=(\Lambda_1x,\dots,\Lambda_nx)$. By (c), $\Lambda$ is constant on the fibres of $\pi$, so $F(\pi x)=\Lambda x$ defines a linear functional on the subspace $\pi(X)$; extend it linearly to all of $\C^n$ (or $\R^n$), where it has the form $F(u)=\sum\alpha_iu_i$.`,
      caption: String.raw`$X=\R^3$, $n=2$. Left: the kernels of $\Lambda_1$ (blue) and $\Lambda_2$ (orange) meet in the line $N$; the kernel of $\Lambda=\alpha_1\Lambda_1+\alpha_2\Lambda_2+\beta\,\nu$ (where $\nu\cdot x$ measures the component along $N$) is green when it contains $N$ and red otherwise. Right: the ratio $|\Lambda x|/\max_i|\Lambda_ix|$ over the unit sphere. With $\beta=0$ it is bounded by $\gamma=|\alpha_1|+|\alpha_2|$; with $\beta\ne0$ it blows up at $\pm N$.`,
      deps: [],
      tags: ['linear algebra', 'duality'],
      viz(v) {
        const M = v.M;
        const L1 = [1, 0.15, 0.35], L2 = [-0.25, 1, -0.3];
        const Nh = unit3(cross(L1, L2));
        const a1 = v.slider('$\\alpha_1$', -1.5, 1.5, 0.8, { step: 0.01 });
        const a2 = v.slider('$\\alpha_2$', -1.5, 1.5, -0.6, { step: 0.01 });
        const bS = v.slider('$\\beta$ (component along $N$)', -1, 1, 0, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.65, height: 340, yaw: -0.75, pitch: 0.38, labels: ['x₁', 'x₂', 'x₃'], title: 'kernels in $X=\\R^3$' });
        const H = v.stage({ x: [-180, 180], y: [-90, 90], height: 340, axes: 'box', xticks: [-180, -90, 0, 90, 180], yticks: [-90, -45, 0, 45, 90], title: '$\\log_{10}\\big(|\\Lambda x|/\\max_i|\\Lambda_i x|\\big)$, $x=$ (longitude, latitude)' });
        const sph = (lo, la) => { const t = lo * Math.PI / 180, f = la * Math.PI / 180; return [Math.cos(f) * Math.cos(t), Math.cos(f) * Math.sin(t), Math.sin(f)]; };
        const ll = (x) => [Math.atan2(x[1], x[0]) * 180 / Math.PI, Math.asin(M.clamp(x[2], -1, 1)) * 180 / Math.PI];
        let st = {};
        v.render(() => {
          const al1 = a1.value, al2 = a2.value, be = bS.value;
          const Lam = [0, 1, 2].map((k) => al1 * L1[k] + al2 * L2[k] + be * Nh[k]);
          const contains = Math.abs(be) < 1e-9;
          S3.poly(planePatch(L1, 0.95), { fill: 'blue', fillAlpha: 0.11, color: 'blue', alpha: 0.55 });
          S3.poly(planePatch(L2, 0.95), { fill: 'orange', fillAlpha: 0.11, color: 'orange', alpha: 0.55 });
          if (Math.hypot(...Lam) > 1e-6) S3.poly(planePatch(Lam, 0.85), { fill: contains ? 'green' : 'red', fillAlpha: 0.2, color: contains ? 'green' : 'red', alpha: 0.95, width: 1.8 });
          S3.line(Nh.map((z) => -1.6 * z), Nh.map((z) => 1.6 * z), { color: 'ink', width: 3, bias: -0.5 });
          S3.text('N', Nh.map((z) => 1.75 * z), { color: 'ink', math: true });
          S3.arrow([0, 0, 0], unit3(L1), { color: 'blue', width: 1.6 });
          S3.arrow([0, 0, 0], unit3(L2), { color: 'orange', width: 1.6 });
          S3.text('Λ₁', unit3(L1).map((z) => 1.22 * z), { color: 'blue', math: true });
          S3.text('Λ₂', unit3(L2).map((z) => 1.22 * z), { color: 'orange', math: true });
          // ratio on the sphere
          H.heat((lo, la) => {
            const x = sph(lo, la);
            const r = Math.abs(Lam[0] * x[0] + Lam[1] * x[1] + Lam[2] * x[2]) / Math.max(Math.abs(L1[0] * x[0] + L1[1] * x[1] + L1[2] * x[2]), Math.abs(L2[0] * x[0] + L2[1] * x[1] + L2[2] * x[2]), 1e-12);
            return Math.log10(Math.max(r, 1e-3));
          }, { range: [-2, 2], cmap: 'magma', res: 3, key: `${al1}|${al2}|${be}` });
          H.corner('dark: Λx = 0 · bright: ratio ≫ 1', 'bl', { color: 'ink', size: 11.5 });
          for (const sg of [1, -1]) { const [lo, la] = ll(Nh.map((z) => sg * z)); H.dot(lo, la, { color: 'ink', r: 5, hollow: true, width: 2.2, label: sg > 0 ? 'N' : '−N', labelPos: 'ne', labelColor: 'ink' }); }
          let sup = 0;
          for (let i = 0; i < 240; i++) for (let j = 1; j < 120; j++) {
            const x = sph(-180 + 1.5 * i, -90 + 1.5 * j);
            const r = Math.abs(M.dot(Lam, x)) / Math.max(Math.abs(M.dot(L1, x)), Math.abs(M.dot(L2, x)), 1e-12);
            if (r > sup) sup = r;
          }
          st = { al1, al2, be, sup, contains };
        });
        v.legend([['blue', '$\\ker\\Lambda_1$', { area: true }], ['orange', '$\\ker\\Lambda_2$', { area: true }], ['ink', '$N=\\ker\\Lambda_1\\cap\\ker\\Lambda_2$'], ['green', '$\\ker\\Lambda\\supset N$', { area: true }], ['red', '$\\ker\\Lambda\\not\\supset N$', { area: true }]]);
        v.readout(() => {
          const s = st;
          if (s.contains) return `$\\beta=0$: $\\Lambda$ vanishes on $N$, $\\Lambda=${v.fix(s.al1, 2)}\\Lambda_1${s.al2 < 0 ? '' : '+'}${v.fix(s.al2, 2)}\\Lambda_2$, and $\\sup|\\Lambda x|/\\max_i|\\Lambda_ix| = ${v.fix(s.sup, 3)}$ (sampled) $\\le\\gamma = |\\alpha_1|+|\\alpha_2| = ${v.fix(Math.abs(s.al1) + Math.abs(s.al2), 3)}$.`;
          return `$\\beta=${v.fix(s.be, 2)}\\ne0$: $\\Lambda\\notin\\operatorname{span}\\{\\Lambda_1,\\Lambda_2\\}$, $\\Lambda\\ne0$ on $N$, and the ratio is unbounded near $\\pm N$ (sampled sup already $${v.fmt(s.sup, 3)}$) — no $\\gamma$ exists.`;
        });
      },
    },
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'The X′-topology is locally convex, with dual X′',
      statement: String.raw`Let $X$ be a vector space and $X'$ a vector space of linear functionals on $X$ that separates points. Then the $X'$-topology $\tau'$ (the weakest topology making every $\Lambda\in X'$ continuous) makes $X$ a locally convex space, and the dual of $(X,\tau')$ is exactly $X'$.`,
      idea: String.raw`The seminorms $p_\Lambda(x)=|\Lambda x|$, $\Lambda\in X'$, form a separating family, and the topology they generate (1.37) is precisely $\tau'$; so $(X,\tau')$ is locally convex. Every $\Lambda\in X'$ is $\tau'$-continuous by definition. Conversely, if $\Lambda$ is $\tau'$-continuous then $|\Lambda|<1$ on a basic neighbourhood $\{|\Lambda_ix|<r,\ i\le n\}$, which gives $|\Lambda x|\le r^{-1}\max_i|\Lambda_ix|$; by Lemma 3.9, $\Lambda$ is a combination of the $\Lambda_i$ and lies in $X'$.`,
      caption: String.raw`$X=C[0,1]$ and $X'=\spn\{\delta_t\}$, so $\tau'$ is the topology of pointwise convergence. A basic neighbourhood of $f_0$ only asks the function to pass through finitely many **gates** of half-height $\eps$ (orange). The gold function lies in it for any spike height $H$. For $\Lambda=\int_0^1$ the change $|\Lambda f-\Lambda f_0|$ grows with $H$ however many gates you add — Lebesgue measure is not in $X'$. For combinations of point evaluations whose points are gated, the change stays below $\sum|c_i|\,\eps$.`,
      deps: ['fa-3.8', 'fa-3.9', 'fa-1.37'],
      tags: ['weak topologies', 'locally convex spaces', 'duality'],
      viz(v) {
        const M = v.M;
        const f0 = (t) => 0.55 + 0.35 * Math.sin(2 * Math.PI * t) * Math.exp(-0.8 * t);
        const LAMS = {
          d: { label: '$\\delta_{1/2}$', pts: [[0.5, 1]] },
          c: { label: '$2\\delta_{0.3}-\\delta_{0.8}$', pts: [[0.3, 2], [0.8, -1]] },
          i: { label: '$\\int_0^1 f\\,dt$', pts: null },
        };
        const which = v.select('$\\Lambda=$', Object.entries(LAMS).map(([value, o]) => ({ value, label: o.label })), 'i');
        const nS = v.slider('extra gates', 0, 14, 5, { int: true });
        const eps = v.slider('$\\varepsilon$', 0.03, 0.3, 0.12, { step: 0.01 });
        const HS = v.slider('spike height $H$', -3, 3, 2.4, { step: 0.05 });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.8, 3.8], height: 280, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], title: 'a basic $\\tau\'$-neighbourhood $W$ of $f_0$ and a member $f\\in W$' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-1.5, 2.5], height: 150, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [-1, 0, 1, 2], title: '$\\Lambda$ as a measure on $[0,1]$' });
        let st = {};
        v.render(() => {
          const L = LAMS[which.value], n = nS.value, e = eps.value, H = HS.value;
          const gates = [...new Set([...(L.pts || []).map((p) => p[0]), ...M.range(n).map((i) => (i + 1) / (n + 1))].map((t) => +t.toFixed(6)))].sort((a, b) => a - b);
          const cuts = [0, ...gates, 1];
          let gi = 0; for (let i = 1; i < cuts.length; i++) if (cuts[i] - cuts[i - 1] > cuts[gi + 1] - cuts[gi]) gi = i - 1;
          const a = cuts[gi], b = cuts[gi + 1], c = (a + b) / 2, w = 0.45 * (b - a);
          const spike = (t) => (Math.abs(t - c) < w ? (1 - ((t - c) / w) ** 2) ** 2 : 0);
          const f = (t) => f0(t) + H * spike(t);
          top.setView(null, [Math.min(-0.4, 0.2 + H) - 0.35, Math.max(1.3, 1 + H) + 0.45]);
          for (const t of gates) {
            top.line(t, f0(t) - e, t, f0(t) + e, { color: 'orange', width: 4, alpha: 0.85, cap: 'butt' });
            for (const sg of [-1, 1]) top.line(t - 0.012, f0(t) + sg * e, t + 0.012, f0(t) + sg * e, { color: 'orange', width: 2 });
          }
          top.fn(f0, { color: 'ink', width: 2, domain: [0, 1] });
          top.fn(f, { color: 'gold', width: 2.4, domain: [0, 1] });
          top.tex('f_0', 0.03, f0(0.03), { color: 'ink', dy: -16 });
          top.tex('f', c, f(c), { color: 'gold', dy: H >= 0 ? -14 : 14 });
          if (L.pts) for (const [s] of L.pts) top.dot(s, top.bounds.y[0] + 0.25, { color: 'green', r: 4, label: `t=${s}`, labelPos: 'e' });
          const Lv = (F) => (L.pts ? M.sum(L.pts, ([s, cc]) => cc * F(s)) : M.integrate(F, 0, 1, 800));
          const dL = Lv(f) - Lv(f0);
          if (L.pts) { for (const [s, cc] of L.pts) { bot.line(s, 0, s, cc, { color: cc >= 0 ? 'green' : 'red', width: 3 }); bot.dot(s, cc, { color: cc >= 0 ? 'green' : 'red', r: 5 }); } }
          else { bot.rect(0, 0, 1, 1, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.5 }); bot.text('Lebesgue measure — not a finite sum of point masses', 0.5, 1.6, { align: 'center', color: 'red', size: 12 }); }
          bot.hline(0, { color: 'faint', width: 1 });
          st = { k: gates.length, dL, bound: L.pts ? M.sum(L.pts, ([, cc]) => Math.abs(cc)) * e : null, H, area: M.integrate(spike, a, b, 200) };
        });
        v.legend([['ink', '$f_0$'], ['orange', 'gates $|f(t_i)-f_0(t_i)|<\\varepsilon$'], ['gold', '$f=f_0+H\\cdot$spike $\\in W$']]);
        v.readout(() => {
          const s = st;
          const head = `$f$ passes all ${s.k} gates, so $f\\in W$. $\\;|\\Lambda f-\\Lambda f_0| = ${v.fix(Math.abs(s.dL), 4)}$`;
          if (s.bound != null) return `${head} $\\le\\sum|c_i|\\,\\varepsilon = ${v.fix(s.bound, 3)}$ for every $f\\in W$: $\\Lambda$ is $\\tau'$-continuous.`;
          return `${head} $= |H|\\cdot\\int\\text{spike} = ${v.fix(Math.abs(s.H), 2)}\\times${v.fix(s.area, 4)}$, unbounded as $H$ grows: $\\int_0^1$ is not $\\tau'$-continuous, as 3.10 predicts since it is not in $X'$.`;
        });
      },
    },
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Weak topology of a topological vector space',
      statement: String.raw`Let $X$ be a topological vector space whose dual $X^*$ separates points. The **weak topology** $\tau_w$ of $X$ is the $X^*$-topology: the weakest topology in which every $\Lambda\in X^*$ is continuous. Its basic neighbourhoods of $0$ are the sets $\{x:|\Lambda_ix|<\eps,\ i=1,\dots,n\}$. By 3.10, $X_w=(X,\tau_w)$ is locally convex with dual $X^*$; $\tau_w$ is weaker than the original topology, and $x_n\to x$ weakly iff $\Lambda x_n\to\Lambda x$ for every $\Lambda\in X^*$. If $X$ is infinite-dimensional, every weak neighbourhood of $0$ contains a subspace of finite codimension, so it is unbounded.`,
      idea: String.raw`A weak neighbourhood looks at only finitely many functionals at a time; everything in the common kernel $\bigcap\ker\Lambda_i$ is invisible to it. That is why sequences can converge weakly while staying far apart in norm.`,
      caption: String.raw`$X=L^2[0,1]$, $f_n(x)=\sqrt{2}\,\sin(n\pi x)$, an orthonormal sequence. The weak neighbourhood $W=\{f:|\langle f,g_i\rangle|<\eps,\ i=1,2,3\}$ of $0$ is defined by three test functions $g_i$ (top). Below: $|\langle f_n,g_i\rangle|$ for $n=1,\dots,60$ and the band $[0,\eps)$. Every $f_n$ with $n$ large enough lies in $W$, although $\|f_n-0\|_2=1$ for all $n$: $f_n\to0$ weakly but not in norm.`,
      deps: ['fa-3.10'],
      tags: ['weak topologies', 'Hilbert space'],
      viz(v) {
        const M = v.M;
        const G = [
          { g: () => 1, c: 'blue', name: 'g_1=1' },
          { g: (x) => 4 * x * (1 - x), c: 'green', name: 'g_2=4x(1-x)' },
          { g: (x) => (x > 0.2 && x < 0.55 ? 1.2 : 0), c: 'purple', name: 'g_3=1.2\\,\\chi_{(0.2,0.55)}' },
        ];
        const nS = v.slider('$n$', 1, 60, 7, { int: true });
        const eps = v.slider('$\\varepsilon$', 0.01, 0.3, 0.06, { step: 0.005 });
        const top = v.stage({ x: [-0.02, 1.02], y: [-1.6, 1.6], height: 230, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [-1, 0, 1] });
        const bot = v.stage({ x: [0, 61], y: [-4.3, 0.2], height: 210, full: true, axes: 'box', xticks: [10, 20, 30, 40, 50, 60], yticks: [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '0.01'], [-1, '0.1'], [0, '1']], title: '$|\\langle f_n,g_i\\rangle|$ against $n$ (log scale); shaded: below $\\varepsilon$' });
        const lg = (y) => Math.log10(Math.max(y, 1e-4));
        const fn = (n) => (x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
        const ip = G.map(({ g }) => M.range(60, 1).map((n) => Math.abs(M.integrate((x) => fn(n)(x) * g(x), 0, 1, 2400))));
        let st = {};
        v.render(() => {
          const n = nS.value, e = eps.value;
          G.forEach(({ g, c }) => top.fn(g, { color: c, width: 2, domain: [0, 1] }));
          top.fn(fn(n), { color: 'gold', width: 2, domain: [0, 1], n: 1200 });
          top.tex(`f_{${n}}`, 1.0, 1.35, { color: 'gold', align: 'right' });
          bot.hband(-4.3, Math.log10(e), { color: 'green', alpha: 0.13 });
          bot.hline(Math.log10(e), { color: 'green', width: 1.2, dash: [5, 4] });
          bot.vline(n, { color: 'gold', width: 1.4, dash: [4, 3] });
          G.forEach(({ c }, i) => bot.dots(ip[i].map((y, k) => (y > 1.2e-4 ? [k + 1 + (i - 1) * 0.18, lg(y)] : null)), { color: c, r: 2.6 }));
          G.forEach(({ c }, i) => bot.dot(n + (i - 1) * 0.18, lg(ip[i][n - 1]), { color: c, r: 4.5 }));
          bot.text('(exact zeros are not plotted)', 60.5, -4.05, { align: 'right', color: 'muted', size: 11 });
          const vals = G.map((_, i) => ip[i][n - 1]);
          const inside = vals.every((x) => x < e);
          let N0 = 61; for (let m = 60; m >= 1; m--) { if (G.every((_, i) => ip[i][m - 1] < e)) N0 = m; else break; }
          if (N0 <= 60) bot.vband(N0 - 0.5, 61, { color: 'green', alpha: 0.06 });
          top.corner(inside ? `f${n} ∈ W` : `f${n} ∉ W`, 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          st = { n, vals, inside, N0 };
        });
        v.legend([['blue', '$g_1=1$'], ['green', '$g_2=4x(1-x)$'], ['purple', '$g_3=1.2\\,\\chi_{(0.2,0.55)}$'], ['gold', '$f_n$']]);
        v.readout(() => {
          const s = st;
          return `$|\\langle f_{${s.n}},g_i\\rangle| = ${s.vals.map((x) => v.fix(x, 3)).join(',\\ ')}$ — $f_{${s.n}}${s.inside ? '\\in' : '\\notin'} W$` + (s.N0 <= 60 ? `; every $f_n$ with $${s.N0}\\le n\\le 60$ lies in $W$` : '') + `, while $\\|f_n\\|_2 = 1$ for all $n$.`;
        });
      },
    },
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Convex sets have the same weak and original closure',
      credit: 'Mazur, 1933',
      statement: String.raw`If $E$ is a convex subset of a locally convex space $X$, then the weak closure $\overline E_w$ of $E$ equals its original closure $\overline E$. In particular, a convex set is weakly closed iff it is closed.`,
      idea: String.raw`$\overline E_w$ is weakly closed, hence closed, and contains $E$, so $\overline E\subset\overline E_w$. Conversely, if $x_0\notin\overline E$, apply 3.4(b) to $\{x_0\}$ and the closed convex set $\overline E$: some $\Lambda\in X^*$ and $\gamma$ satisfy $\Re\Lambda x_0<\gamma<\Re\Lambda x$ for $x\in\overline E$. Then $\{x:\Re\Lambda x<\gamma\}$ is a weak neighbourhood of $x_0$ missing $E$, so $x_0\notin\overline E_w$. Without convexity this fails.`,
      caption: String.raw`$X=\ell^2$. The plane shows two coordinates $(x_1,x_2)$ — the most a weak neighbourhood built from these functionals can see. Drag $x$. For the **unit sphere** $S$ (not convex) and $\|x\|<1$, the points $s_n=x+\sqrt{1-\|x\|^2}\,e_n\in S$ (bars) converge weakly to $x$, so $\overline S_w$ is the whole ball. For the **ball** $B$ (convex), every $x$ outside is cut off by a single functional, as in 3.4.`,
      deps: ['fa-3.11', 'fa-3.4'],
      tags: ['weak topologies', 'convexity', 'closure'],
      viz(v) {
        const M = v.M;
        const set = v.select('$E=$', [{ value: 'S', label: 'unit sphere $S$' }, { value: 'B', label: 'closed unit ball $B$' }], 'S');
        const nS = v.slider('index $n$ of the hidden coordinate', 3, 40, 9, { int: true });
        const P = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, height: 330, ticks: false, title: 'what the functionals $x_1,x_2$ see' });
        const Bst = v.stage({ x: [0, 41], y: [-0.2, 1.1], height: 330, axes: 'box', xticks: [1, 2, 10, 20, 30, 40], yticks: [0, 0.5, 1], title: 'coordinates of the vector in $\\ell^2$' });
        const x = P.handle(0.45, 0.3, { color: 'accent', label: 'x' });
        let st = {};
        v.render(() => {
          const X = [x.x, x.y], r = Math.hypot(...X), n = nS.value, S = set.value === 'S';
          P.circle(0, 0, 1, { fill: 'blue', fillAlpha: S ? 0.07 : 0.2, color: 'blue', width: S ? 3 : 2 });
          P.dot(0, 0, { color: 'ink', r: 2.5 });
          let bars = [], state;
          if (r > 1) {
            const u = [X[0] / r, X[1] / r];
            let slab = [[-9, -9], [9, -9], [9, 9], [-9, 9]];
            slab = clipLe(slab, [-u[0], -u[1]], -1 - (r - 1) / 2);
            P.poly(slab, { fill: 'green', fillAlpha: 0.1, stroke: false });
            P.line(u[0] * (1 + r) / 2 - 9 * u[1], u[1] * (1 + r) / 2 + 9 * u[0], u[0] * (1 + r) / 2 + 9 * u[1], u[1] * (1 + r) / 2 - 9 * u[0], { color: 'green', width: 2.2 });
            bars = M.range(40).map((k) => (k < 2 ? X[k] : 0));
            state = 'out';
          } else if (S) {
            const t = Math.sqrt(1 - r * r);
            bars = M.range(40).map((k) => (k < 2 ? X[k] : k === n - 1 ? t : 0));
            state = r > 0.999 ? 'on' : 'limit';
          } else { bars = M.range(40).map((k) => (k < 2 ? X[k] : 0)); state = 'in'; }
          P.corner(S ? 'image of S under (x₁, x₂) = whole disc' : 'image of B under (x₁, x₂)', 'tl', { color: 'blue', weight: 600 });
          Bst.setView(null, [Math.min(-0.2, ...bars) - 0.05, 1.1]);
          Bst.bars(bars, { x0: 1, dx: 1, color: (b, k) => (k < 2 ? 'accent' : 'gold'), barWidth: 0.7 });
          Bst.hline(0, { color: 'faint', width: 1 });
          if (state === 'limit') Bst.tex(`s_{${n}} = x+\\sqrt{1-\\|x\\|^2}\\,e_{${n}}\\in S`, 40.3, 0.98, { align: 'right', color: 'gold', size: 15 });
          st = { state, r, n, S, t: Math.sqrt(Math.max(0, 1 - r * r)), test: Math.sqrt(Math.max(0, 1 - r * r)) / n };
        });
        v.legend([['blue', '$E$ seen through $x_1,x_2$', { area: true }], ['accent', '$x$ (first two coordinates)'], ['gold', 'hidden coordinate $\\sqrt{1-\\|x\\|^2}$ at $e_n$'], ['green', 'separating functional', { area: true }]]);
        v.readout(() => {
          const s = st;
          if (s.state === 'out') return `$\\|x\\| = ${v.fix(s.r, 3)}>1$: the functional $\\Lambda=\\langle\\cdot,x/\\|x\\|\\rangle$ has $\\Lambda x = ${v.fix(s.r, 3)}>1\\ge\\sup_{B}\\Lambda$, so the weak neighbourhood $\\{\\Lambda>\\tfrac{1+\\|x\\|}{2}\\}$ of $x$ misses ${s.S ? 'S' : 'B'}$: $x\\notin\\overline{E}_w$.`;
          if (s.state === 'in') return `$\\|x\\| = ${v.fix(s.r, 3)}\\le1$: $x\\in B$. $B$ is convex and norm-closed, hence weakly closed (3.12): $\\overline B_w=B$.`;
          if (s.state === 'on') return `$x$ lies on $S$ itself.`;
          return `$\\|x\\|=${v.fix(s.r, 3)}<1$, so $x\\notin S$; but $s_n\\in S$ and for the test vector $y=(1,\\tfrac12,\\tfrac13,\\dots)$, $|\\langle s_n-x,y\\rangle| = ${v.fix(s.t, 3)}/n = ${v.fix(s.test, 4)}\\to0$. Every weak neighbourhood of $x$ meets $S$: $x\\in\\overline S_w\\setminus\\overline S$.`;
        });
      },
    },
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Weak limits are limits of convex combinations',
      credit: 'Mazur, 1933 (normed-space antecedent)',
      statement: String.raw`Let $X$ be a metrizable locally convex space and let $\{x_n\}$ converge weakly to $x\in X$. Then there is a sequence $\{y_i\}$ in $X$ such that each $y_i$ is a convex combination of finitely many $x_n$, and $y_i\to x$ in the original topology of $X$.`,
      idea: String.raw`Let $H$ be the convex hull of $\{x_n\}$ (or of a tail $\{x_n:n\ge i\}$). Since $x$ is a weak limit of points of $H$, it lies in the weak closure of $H$, which by 3.12 equals the original closure. Metrizability turns "in the closure" into "limit of a sequence": pick $y_i$ in the hull of $\{x_n:n\ge i\}$ within distance $1/i$ of $x$.`,
      caption: String.raw`$X=\ell^2$ (bars show coordinates $1$–$60$). The sequence $x_n$ (gold) converges weakly but not in norm: $\|x_n-x\|$ stays at $1$ (red). Its tail averages $y_N=\frac1N(x_N+\dots+x_{2N-1})$ (green bars) are convex combinations that **do** converge in norm, like $N^{-1/2}$ (green curve).`,
      deps: ['fa-3.12'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §3.13 p.67 (metrizable locally convex version)', 'Mazur, Über konvexe Mengen in linearen normierten Räumen, Studia Mathematica4(1933), pp.70–84; §2 Satz3 and consequence11 pp.80–81 (normed-space version), https://matwbn.icm.edu.pl/ksiazki/sm/sm4/sm4113.pdf'],
      tags: ['weak topologies', 'convexity', 'Mazur'],
      viz(v) {
        const M = v.M;
        const D = 60;
        const BASE = M.range(D).map((k) => (k < 3 ? [0.7, 0.35, 0.2][k] : 0));
        const SEQ = {
          e: { label: '$x_n=e_n$, $x=0$', x: M.range(D).map(() => 0), term: (n) => M.range(D).map((k) => (k === n - 1 ? 1 : 0)) },
          xe: { label: '$x_n=x+e_n$', x: BASE, term: (n) => BASE.map((b, k) => b + (k === n - 1 ? 1 : 0)) },
          alt: { label: '$x_n=x+(-1)^n e_n$', x: BASE, term: (n) => BASE.map((b, k) => b + (k === n - 1 ? (n % 2 ? -1 : 1) : 0)) },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'xe');
        const NS = v.slider('$N$', 1, 30, 6, { int: true });
        const top = v.stage({ x: [0, D + 1], y: [-1.15, 1.25], height: 230, full: true, axes: 'box', xticks: [10, 20, 30, 40, 50, 60], yticks: [-1, 0, 0.5, 1], title: 'coordinates of $x_N$ (gold outline) and of $y_N$ (green)' });
        const bot = v.stage({ x: [0, 31], y: [0, 1.15], height: 190, full: true, axes: 'box', xticks: [1, 5, 10, 15, 20, 25, 30], yticks: [0, 0.5, 1], title: 'distance to the weak limit: $\\|x_N-x\\|$ (red) and $\\|y_N-x\\|$ (green)' });
        let st = {};
        v.render(() => {
          const S = SEQ[which.value], N = NS.value;
          const T = M.range(61).map((n) => (n ? S.term(n) : null));
          const avg = (m) => M.range(D).map((k) => { let a = 0; for (let n = m; n < 2 * m; n++) a += T[n][k]; return a / m; });
          const xN = T[N];
          const yN = avg(N);
          top.setView(null, [Math.min(-0.15, ...xN) - 0.1, 1.2]);
          top.bars(yN, { x0: 1, dx: 1, color: 'green', barWidth: 0.75, fillAlpha: 0.7 });
          xN.forEach((y, k) => { if (Math.abs(y - S.x[k]) > 1e-9) top.rect(k + 1 - 0.4, 0, k + 1 + 0.4, y, { color: 'gold', width: 2 }); });
          top.dots(S.x.map((y, k) => (Math.abs(y) > 1e-9 ? [k + 1, y] : null)).filter(Boolean), { color: 'ink', r: 3 });
          top.hline(0, { color: 'faint', width: 1 });
          top.vband(N - 0.5, 2 * N - 0.5, { color: 'green', alpha: 0.06 });
          const dx = M.range(30, 1).map((n) => M.norm(M.vsub(T[n], S.x)));
          const dy = M.range(30, 1).map((m) => M.norm(M.vsub(avg(m), S.x)));
          bot.path(dx.map((d, i) => [i + 1, d]), { color: 'red', width: 2 });
          bot.path(dy.map((d, i) => [i + 1, d]), { color: 'green', width: 2.2 });
          bot.fn((t) => 1 / Math.sqrt(t), { domain: [1, 30], color: 'green', width: 1, dash: [3, 4], alpha: 0.6 });
          bot.dot(N, dx[N - 1], { color: 'red', r: 4.5 });
          bot.dot(N, dy[N - 1], { color: 'green', r: 4.5 });
          st = { N, dx: dx[N - 1], dy: dy[N - 1] };
        });
        v.legend([['gold', '$x_N$'], ['ink', 'the weak limit $x$', { dot: true }], ['green', '$y_N=\\frac1N\\sum_{n=N}^{2N-1}x_n$', { area: true }], ['green', '$N^{-1/2}$', { dash: true }]]);
        v.readout(() => `$N=${st.N}$: $\\|x_N-x\\| = ${v.fix(st.dx, 3)}$, but the convex combination $y_N$ has $\\|y_N-x\\| = ${v.fix(st.dy, 4)} = 1/\\sqrt{${st.N}}$. For each fixed $y\\in\\ell^2$, $\\langle x_n-x,y\\rangle = \\pm y_n\\to0$: weak convergence without norm convergence, repaired by averaging.`);
      },
    },
    {
      num: '3.14',
      kind: 'Definition',
      name: 'Weak* topology of a dual space',
      statement: String.raw`Let $X$ be a topological vector space with dual $X^*$. Each $x\in X$ defines a linear functional $f_x(\Lambda)=\Lambda x$ on $X^*$, and $\{f_x:x\in X\}$ separates points of $X^*$. The **weak$^*$ topology** of $X^*$ is the topology induced by these functionals: $\Lambda_\alpha\to\Lambda$ weak$^*$ iff $\Lambda_\alpha x\to\Lambda x$ for every $x\in X$. By 3.10, $X^*$ with the weak$^*$ topology is a locally convex space whose dual is $X$ itself.`,
      idea: String.raw`The weak$^*$ topology tests a functional only against vectors of $X$, not against the larger family $X^{**}$; it is weaker than the weak topology of $X^*$ (when $X^*$ is normed) and is the topology in which the Banach–Alaoglu theorem holds.`,
      caption: String.raw`$X=C[0,1]$, $X^*=$ measures. The probability densities $\mu_n=n\,\chi_{[0,1/n]}\,dt$ converge weak$^*$ to $\delta_0$: for every continuous $g$, $\int g\,d\mu_n\to g(0)$ (lower panel). Yet $\|\mu_n-\delta_0\|=2$ for all $n$. Switch the test function to $\chi_{(0,1]}$, which is **not** in $X$: then $\int g\,d\mu_n=1$ while $\delta_0(g)=0$ — weak$^*$ convergence says nothing about it.`,
      deps: ['fa-3.10'],
      tags: ['weak* topology', 'measures', 'duality'],
      viz(v) {
        const M = v.M;
        const G = {
          cos: { label: '$g=\\cos 6t$', g: (t) => Math.cos(6 * t), cont: true },
          bump: { label: '$g=e^{-t}(1+2t)$', g: (t) => Math.exp(-t) * (1 + 2 * t) * 0.8, cont: true },
          ind: { label: '$g=\\chi_{(0,1]}\\notin C[0,1]$', g: (t) => (t > 0 ? 1 : 0), cont: false },
        };
        const which = v.select('test with', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'cos');
        const nS = v.slider('$n$', 1, 40, 5, { int: true });
        const top = v.stage({ x: [-0.04, 1.02], y: [-1.3, 2.4], height: 250, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [-1, 0, 1, 2], title: 'the measure $\\mu_n$ (density, clipped) and the test function $g$' });
        const bot = v.stage({ x: [0, 41], y: [-1.2, 1.4], height: 190, full: true, axes: 'box', xticks: [10, 20, 30, 40], yticks: [-1, 0, 1], title: '$\\int g\\,d\\mu_n$ against $n$; dashed: $\\delta_0(g)=g(0)$' });
        const I = (g, n) => n * M.integrate(g, 0, 1 / n, 400);
        let st = {};
        v.render(() => {
          const o = G[which.value], g = o.g, n = nS.value;
          top.rect(0, 0, 1 / n, Math.min(n, 2.3), { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.5 });
          if (n > 2.3) top.text(`height ${n} ↑`, 1 / n, 2.15, { align: 'left', dx: 6, color: 'orange', size: 12 });
          top.arrow(0, 0, 0, 1.6, { color: 'green', width: 2.6, head: 10 });
          top.text('δ₀', 0, 1.75, { color: 'green', align: 'left', dx: 6, math: true });
          top.fn(g, { color: 'blue', width: 2.4, domain: [o.cont ? 0 : 1e-6, 1] });
          if (!o.cont) { top.dot(0, 0, { color: 'blue', r: 4.5 }); top.dot(0, 1, { color: 'blue', r: 4.5, hollow: true }); }
          top.hline(0, { color: 'faint', width: 1 });
          const vals = M.range(40, 1).map((m) => I(g, m)), g0 = g(0);
          bot.hline(g0, { color: 'green', width: 1.8, dash: [6, 4] });
          bot.dots(vals.map((y, i) => [i + 1, y]), { color: o.cont ? 'blue' : 'red', r: 3 });
          bot.dot(n, vals[n - 1], { color: o.cont ? 'blue' : 'red', r: 6 });
          st = { n, val: vals[n - 1], g0, cont: o.cont };
        });
        v.legend([['orange', '$\\mu_n=n\\,\\chi_{[0,1/n]}\\,dt$', { area: true }], ['green', '$\\delta_0$'], ['blue', 'test function $g$']]);
        v.readout(() => {
          const s = st;
          const base = `$\\int g\\,d\\mu_{${s.n}} = ${v.fix(s.val, 4)}$, $\\;\\delta_0(g) = ${v.fix(s.g0, 4)}$`;
          return s.cont ? `${base}: the gap $${v.fix(Math.abs(s.val - s.g0), 4)}\\to0$ for every $g\\in C[0,1]$, so $\\mu_n\\to\\delta_0$ weak$^*$, while $\\|\\mu_n-\\delta_0\\| = 2$.` : `${base}: no convergence — but $\\chi_{(0,1]}$ is not an element of $X=C[0,1]$, so the weak$^*$ topology never tests it.`;
        });
      },
    },
  ],
};

/** Clip a convex polygon to {x : a·x ≤ b}. */
function clipLe(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a[0] * P[0] + a[1] * P[1] - b, fq = a[0] * Q[0] + a[1] * Q[1] - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
