// Rudin, Real and Complex Analysis — Chapter 18 (part 2): Gelfand–Mazur and spectra in subalgebras

// ---------------------------------------------------------------- helpers shared by this file
// Resolvent norm of the upper-triangular 2×2 matrix [[a, s], [0, b]] (a, b complex as [re, im]) at λ = (x, y).
function res2(a, b, s, x, y) {
  const ar = x - a[0], ai = y - a[1], br = x - b[0], bi = y - b[1];
  const da = ar * ar + ai * ai, db = br * br + bi * bi, D = Math.sqrt(da * db);
  const F = da + db + s * s;
  return Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * D * D))) / 2) / D;
}
// Winding number of the closed polygon pts about (x, y) (crossing rule with orientation).
function windingAt(pts, x, y) {
  let w = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    if (p[1] <= y) { if (q[1] > y && (q[0] - p[0]) * (y - p[1]) - (x - p[0]) * (q[1] - p[1]) > 0) w++; }
    else if (q[1] <= y && (q[0] - p[0]) * (y - p[1]) - (x - p[0]) * (q[1] - p[1]) < 0) w--;
  }
  return w;
}
// All complex roots of Σ c_k z^k (coefficients as [re, im], highest degree last) by Durand–Kerner.
function polyRoots(c) {
  let n = c.length - 1; while (n > 0 && Math.hypot(...c[n]) < 1e-14) n--;
  if (n < 1) return [];
  const lead = c[n];
  const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
  const div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
  const a = c.slice(0, n + 1).map((z) => div(z, lead));
  const ev = (z) => { let s = [0, 0]; for (let k = n; k >= 0; k--) { s = mul(s, z); s = [s[0] + a[k][0], s[1] + a[k][1]]; } return s; };
  let r = Array.from({ length: n }, (_, k) => { const t = 0.4 + 0.9 * k; return [0.9 * Math.cos(t), 0.9 * Math.sin(t)]; });
  for (let it = 0; it < 200; it++) {
    let moved = 0;
    r = r.map((z, i) => {
      let den = [1, 0];
      r.forEach((w, j) => { if (j !== i) den = mul(den, [z[0] - w[0], z[1] - w[1]]); });
      const d = div(ev(z), den); moved = Math.max(moved, Math.hypot(...d));
      return [z[0] - d[0], z[1] - d[1]];
    });
    if (moved < 1e-13) break;
  }
  return r;
}
// Phase-portrait colour of w = (re, im), as in Stage.domain.
function phase(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.6, 0.42 + 0.2 * Math.pow(t, 0.7));
}

export default {
  collection: 'rca',
  chapter: 18,
  items: [
    {
      num: '18.7',
      kind: 'Theorem',
      name: 'Gelfand–Mazur theorem',
      credit: 'Gelfand & Mazur, 1938',
      statement: String.raw`If $A$ is a Banach algebra in which every nonzero element is invertible, then every $x\in A$ is a scalar multiple of the unit, $x=\lambda e$ for a unique $\lambda\in\C$. Thus $\lambda\mapsto\lambda e$ is an isometric isomorphism of $\C$ onto $A$.`,
      idea: String.raw`Take $x\in A$. By 18.5 its spectrum contains some $\lambda$, so $\lambda e-x$ is not invertible; by hypothesis the only non-invertible element is $0$, hence $x=\lambda e$. Since $\norm{\lambda e}=\abs\lambda$, the map is an isometry. The complex scalars are essential: the quaternions form a *real* Banach algebra in which every nonzero element is invertible, yet they are not $\R$ — over $\R$ spectra can be empty, because nothing like Liouville's theorem is available.`,
      caption: String.raw`Pick an algebra and drag the element's data. The right panel shows $\norm{(\lambda e-x)^{-1}}$ for $\lambda$ on the dashed line. In $\C$ the spectrum is the single point $a$ and $ae-x=0$. In $\C^2$ and $M_2(\C)$ the resolvent still blows up somewhere, but $ae-x$ is a *nonzero* non-invertible element, so these are not division algebras. In the quaternions $\mathbb H$ (real scalars only) $\lambda-q$ is invertible for every real $\lambda$: the resolvent stays bounded, the spectrum is empty, and $\mathbb H\neq\R$.`,
      deps: ['rca-18.5', 'rca-18.2'],
      see: ['fa-10.14'],
      tags: ['Gelfand–Mazur', 'spectrum', 'division algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const ALG = {
          C: { label: '$\\C$' },
          C2: { label: '$\\C^2$ (pointwise)' },
          M2: { label: '$M_2(\\C)$' },
          H: { label: '$\\mathbb H$ (real scalars)' },
        };
        let alg = 'C';
        const which = v.select('algebra', Object.entries(ALG).map(([value, o]) => ({ value, label: o.label })), 'C', { onChange: (k) => { alg = k; if (k === 'H') a.set(a.x, 0); } });
        const sR = v.slider('$\\abs{\\operatorname{Im} q}$', 0.1, 1.4, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.6, 1.6], equal: true, height: 340, weight: 1.1, xlabel: 'Re λ', title: 'the scalar plane and $\\sigma(x)$' });
        const R = v.stage({ x: [-2.6, 2.6], y: [0, 5], height: 340, axes: 'box', title: '$\\norm{(\\lambda e-x)^{-1}}$ along the dashed line' });
        const a = L.handle(-0.6, 0.35, { color: 'blue', label: 'a', constrain: (x, y) => [x, alg === 'H' ? 0 : y] });
        const b = L.handle(0.9, -0.4, { color: 'blue', label: 'b', labelPos: 'se' });
        let st = {};
        v.render(() => {
          const k = which.value; alg = k;
          b.visible = k === 'C2' || k === 'M2'; sR.el.hidden = k !== 'H';
          const A = [a.x, a.y], B = [b.x, b.y];
          // the line through the spectrum, parametrised by arclength t from its midpoint
          let o = A, u = [1, 0];
          if (b.visible) { const d = Math.hypot(B[0] - A[0], B[1] - A[1]); o = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; if (d > 1e-6) u = [(B[0] - A[0]) / d, (B[1] - A[1]) / d]; }
          if (k === 'H') o = [0, 0];
          const lam = (t) => [o[0] + t * u[0], o[1] + t * u[1]];
          const r = sR.value;
          const res = {
            C: (x, y) => 1 / Math.hypot(x - A[0], y - A[1]),
            C2: (x, y) => Math.max(1 / Math.hypot(x - A[0], y - A[1]), 1 / Math.hypot(x - B[0], y - B[1])),
            M2: (x, y) => res2(A, B, 1, x, y),
            H: (x) => 1 / Math.hypot(x - A[0], r),
          }[k];
          L.line(o[0] - 9 * u[0], o[1] - 9 * u[1], o[0] + 9 * u[0], o[1] + 9 * u[1], { color: 'muted', width: 1.2, dash: [5, 5] });
          if (k === 'H') {
            L.line(-9, 0, 9, 0, { color: 'blue', width: 5, alpha: 0.18 });
            L.text('available scalars: ℝ', L.bounds.x[0], 0, { align: 'left', dy: -12, dx: 8, color: 'blue', size: 12 });
            L.dot(A[0], r, { color: 'red', r: 6, hollow: true, width: 2 }); L.dot(A[0], -r, { color: 'red', r: 6, hollow: true, width: 2 });
            L.line(A[0], -r, A[0], r, { color: 'red', width: 1, dash: [2, 3] });
            L.tex('a\\pm i\\abs{v}', A[0] + (A[0] < 0 ? -0.12 : 0.12), r, { color: 'red', align: A[0] < 0 ? 'right' : 'left', size: 13 });
            L.corner('σ(q) = ∅ over ℝ', 'tl', { color: 'red', weight: 600 });
          } else {
            const pts = b.visible ? [A, B] : [A];
            for (const p of pts) L.dot(p[0], p[1], { color: 'blue', r: 11, hollow: true, width: 2.2 });
            L.corner(k === 'C' ? 'σ(x) = {a}, and ae − x = 0' : 'σ(x) = {a, b}: ae − x ≠ 0 is not invertible', 'tl', { color: k === 'C' ? 'green' : 'red', weight: 600 });
          }
          // right panel: the resolvent along the line
          R.hline(0, { color: 'faint', width: 1 });
          R.setTicks(k === 'H' ? null : [], undefined);
          const f = (t) => { const p = lam(t); return res(p[0], p[1]); };
          R.fn(f, { color: k === 'H' ? 'blue' : 'accent', width: 2.4, n: 800, fill: 'accent', fillAlpha: 0.08 });
          const tA = (A[0] - o[0]) * u[0] + (A[1] - o[1]) * u[1], tB = (B[0] - o[0]) * u[0] + (B[1] - o[1]) * u[1];
          if (k !== 'H') {
            R.vline(tA, { color: 'blue', width: 1.2, dash: [4, 4] }); R.text('a', tA, 4.8, { dx: 6, color: 'blue', math: true });
            if (b.visible) { R.vline(tB, { color: 'blue', width: 1.2, dash: [4, 4] }); R.text('b', tB, 4.8, { dx: 6, color: 'blue', math: true }); }
            R.corner('blows up on σ(x)', 'tr', { color: 'muted' });
          } else {
            R.hline(1 / r, { color: 'green', width: 1.2, dash: [4, 4] });
            R.text('max = 1/|v|', 2.5, 1 / r, { dy: -10, align: 'right', color: 'green', size: 12 });
            R.corner('bounded on all of ℝ', 'tr', { color: 'red', weight: 600 });
          }
          v.legend(k === 'H'
            ? [['blue', 'real scalars $\\lambda\\in\\R$', { area: true }], ['red', 'roots $a\\pm i\\abs v$ of $t^2-2at+\\abs q^2$ — not real', { dot: true }]]
            : [['blue', '$\\sigma(x)$', { dot: true }], ['accent', '$\\norm{(\\lambda e-x)^{-1}}$']]);
          st = { k, A, B, r };
        });
        v.readout(() => {
          const s = st; if (!s.k) return '';
          const z = (p) => `${v.fix(p[0], 2)}${p[1] < 0 ? '-' : '+'}${v.fix(Math.abs(p[1]), 2)}i`;
          const d = [s.A[0] - s.B[0], s.A[1] - s.B[1]];
          if (s.k === 'C') return `$x = ${z(s.A)}$ is the scalar $a$ times $e$: $\\sigma(x)=\\{a\\}$ and $ae-x=0$, exactly as the theorem predicts.`;
          if (s.k === 'C2') return `$x=(a,b)$, $\\;ae-x = (0,\\ ${z(d)})\\neq0$ but has no inverse in $\\C^2$: a nonzero non-invertible element, so $\\C^2$ is not a division algebra.`;
          if (s.k === 'M2') return `$x=\\begin{pmatrix}a&1\\\\0&b\\end{pmatrix}$, $\\;ae-x=\\begin{pmatrix}0&-1\\\\0&${z(d)}\\end{pmatrix}\\neq0$ is singular: $M_2(\\C)$ is not a division algebra.`;
          return `$q=a+v$ with $a=${v.fix(s.A[0], 2)}$, $\\abs v=${v.fix(s.r, 2)}$: $\\;\\abs{\\lambda-q}^2=(\\lambda-a)^2+\\abs v^2>0$ for real $\\lambda$, so every $\\lambda-q$ is invertible and $\\norm{(\\lambda-q)^{-1}}\\le 1/\\abs v$.`;
        });
      },
    },
    {
      num: '18.8',
      kind: 'Lemma',
      name: 'Open V ⊂ W with no boundary in W is a union of components',
      statement: String.raw`Let $V$ and $W$ be open subsets of a topological space $X$ with $V\subset W$. If no boundary point of $V$ lies in $W$, then $V$ is a union of components of $W$.`,
      idea: String.raw`Let $\Omega$ be a component of $W$ that meets $V$. Inside $\Omega$ the closure of $V$ adds nothing, because $\Omega\subset W$ contains no boundary point of $V$; so $\Omega\cap V$ and $\Omega\setminus V=\Omega\setminus\overline V$ are both open. A connected set cannot split into two disjoint open pieces, and the first is nonempty, so $\Omega\subset V$. The lemma is used in 18.9 with $W$ and $V$ the complements of two spectra.`,
      caption: String.raw`$W$ (light blue) has three components; $V=W\cap D$ (dark blue) for the disc $D$ you can drag and resize. Red arcs are boundary points of $V$ that lie *in* $W$. Whenever there are none, each component is either swallowed by $D$ or missed by it (green or grey outline), and $V$ is a union of components — as the lemma says.`,
      deps: ['pma-2.45'],
      tags: ['connectedness', 'topology'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.2, 3.2], y: [-1.9, 1.9], equal: true, height: 360, axes: false });
        const blobs = [M.blob(-1.95, 0.25, 0.78, 3, 0.22), M.blob(0.15, -0.45, 0.72, 7, 0.25), M.blob(1.95, 0.45, 0.62, 11, 0.2)];
        const ctr = S.handle(-1.2, 0.2, { color: 'orange', label: 'D', labelPos: 'n' });
        const rad = S.handle(-0.15, 0.2, { color: 'gray', r: 6 });
        let prev = [ctr.x, ctr.y];
        ctr.onDrag = () => { rad.x += ctr.x - prev[0]; rad.y += ctr.y - prev[1]; prev = [ctr.x, ctr.y]; };
        let st = {};
        v.render(() => {
          prev = [ctr.x, ctr.y];
          const c = [ctr.x, ctr.y], r = Math.max(0.12, Math.hypot(rad.x - ctr.x, rad.y - ctr.y));
          const accent = v.rgb('blue');
          S.raster((x, y) => {
            if ((x - c[0]) ** 2 + (y - c[1]) ** 2 >= r * r) return null;
            for (const B of blobs) if (M.pointInPoly([x, y], B)) return [accent[0], accent[1], accent[2], 120];
            return null;
          }, { key: `${c}|${r}`, res: 2 });
          // boundary of D inside W, component by component
          const K = 720; const arcs = blobs.map(() => []); const inside = blobs.map(() => 0);
          let cur = blobs.map(() => null);
          for (let k = 0; k <= K; k++) {
            const t = M.TAU * k / K, p = [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
            blobs.forEach((B, i) => {
              const inB = M.pointInPoly(p, B);
              if (inB) { inside[i]++; if (!cur[i]) { cur[i] = []; arcs[i].push(cur[i]); } cur[i].push(p); } else cur[i] = null;
            });
          }
          const status = blobs.map((B, i) => (inside[i] ? 'cut' : M.pointInPoly(B[0], [...Array(96)].map((_, k) => [c[0] + r * Math.cos(M.TAU * k / 96), c[1] + r * Math.sin(M.TAU * k / 96)])) ? 'in' : 'out'));
          blobs.forEach((B, i) => {
            S.poly(B, { fill: 'blue', fillAlpha: 0.13, stroke: false });
            S.poly(B, { color: status[i] === 'in' ? 'green' : status[i] === 'out' ? 'gray' : 'blue', width: status[i] === 'cut' ? 1.4 : 2.6 });
          });
          S.circle(c[0], c[1], r, { color: 'orange', width: 1.3, dash: [5, 5] });
          arcs.flat().forEach((arc) => S.path(arc, { color: 'red', width: 4.5 }));
          blobs.forEach((B, i) => { const cx = M.mean(B.map((p) => p[0])), cy = Math.max(...B.map((p) => p[1])); S.tex(`W_{${i + 1}}`, cx, cy, { baseline: 'bottom', dy: -4, color: status[i] === 'in' ? 'green' : status[i] === 'out' ? 'muted' : 'blue', size: 15 }); });
          const ok = status.every((s) => s !== 'cut');
          S.corner(ok ? 'W ∩ ∂V = ∅  ⇒  V is a union of components' : '∂V meets W (red)  —  V is not a union of components', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          v.legend([['blue', '$W$', { area: true }], ['blue', '$V=W\\cap D$ (darker)', { area: true }], ['red', '$\\partial V\\cap W$'], ['green', 'component contained in $V$'], ['gray', 'component disjoint from $V$']]);
          st = { status };
        });
        v.readout(() => {
          const s = st; if (!s.status) return '';
          const names = (w) => s.status.map((x, i) => (x === w ? `$W_{${i + 1}}$` : null)).filter(Boolean);
          const inn = names('in'), cut = names('cut');
          if (!cut.length) return inn.length ? `$V = ${inn.map((t) => t.slice(1, -1)).join('\\cup ')}$: a union of components of $W$.` : '$V=\\varnothing$ — the empty union of components.';
          return `The boundary of $V$ crosses ${cut.join(', ')}; there $V$ is a proper nonempty open part of a component, and the lemma's hypothesis fails.`;
        });
      },
    },
    {
      num: '18.9',
      kind: 'Theorem',
      name: 'Spectrum in a closed subalgebra: holes may be filled',
      statement: String.raw`Let $A$ be a closed subalgebra of a Banach algebra $B$ that contains the unit of $B$, and let $x\in A$. Write $\sigma_A(x)$ and $\sigma_B(x)$ for the spectra of $x$ relative to $A$ and to $B$. Then $\sigma_B(x)\subset\sigma_A(x)$, and $\sigma_A(x)$ is the union of $\sigma_B(x)$ and a (possibly empty) collection of *bounded* components of $\C\setminus\sigma_B(x)$. In particular $\partial\sigma_A(x)\subset\sigma_B(x)$, and $\sigma_A(x)=\sigma_B(x)$ whenever $\C\setminus\sigma_B(x)$ is connected.`,
      idea: String.raw`An inverse in $A$ is an inverse in $B$, so $\sigma_B(x)\subset\sigma_A(x)$. Put $W=\C\setminus\sigma_B(x)$ and $V=\C\setminus\sigma_A(x)\subset W$. If $\lambda\in W$ were a boundary point of $V$, pick $\lambda_n\in V$ with $\lambda_n\to\lambda$; by continuity of inversion in $B$ (18.4) the inverses $(\lambda_ne-x)^{-1}\in A$ converge to $(\lambda e-x)^{-1}$, which lies in $A$ because $A$ is closed — so $\lambda\in V$, impossible for a boundary point of an open set. By 18.8, $V$ is a union of components of $W$; it contains all $\lambda$ with $\abs\lambda>\norm x$ (18.3), hence the unbounded component.`,
      caption: String.raw`$B=C(\T)$ and $A$ = the closure of the polynomials in $z$ (the disc algebra, viewed on $\T$). For $f\in A$: $\sigma_B(f)=f(\T)$ (blue curve), while $\lambda e-f$ is invertible in $A$ only if $f-\lambda$ has no zero in the closed disc, so $\sigma_A(f)=f(\overline U)$. Left: the components of $\C\setminus f(\T)$ with winding number $\geq1$ are filled (orange, darker = larger index); they are exactly the holes $\sigma_A$ adds. Drag $\lambda$: right, the phase portrait of $f-\lambda$ on $\overline U$ shows its zeros (red), whose number is $\Ind_{f(\T)}(\lambda)$.`,
      deps: ['rca-18.8', 'rca-18.4', 'rca-18.3', 'rca-18.2'],
      see: ['rca-10.10'],
      tags: ['spectrum', 'subalgebras', 'disc algebra'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FN = {
          z: { label: '$z$', c: (c) => [[0, 0], [1, 0]] },
          q: { label: '$z+cz^2$', c: (c) => [[0, 0], [1, 0], [c, 0]] },
          k: { label: '$z+cz^3$', c: (c) => [[0, 0], [1, 0], [0, 0], [c, 0]] },
          w: { label: '$z^2+cz$', c: (c) => [[0, 0], [c, 0], [1, 0]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'q');
        const sc = v.slider('$c$', 0, 0.95, 0.72, { step: 0.01 });
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 360, weight: 1.15, xlabel: 'Re λ', title: '$\\sigma_B(f)=f(\\T)$ and $\\sigma_A(f)=f(\\overline U)$' });
        const R = v.stage({ x: [-1.2, 1.2], y: [-1.34, 1.2], equal: true, height: 360, axes: false, title: 'phase of $f-\\lambda$ on the closed disc $\\overline U$' });
        const lam = L.handle(0.15, 0.1, { color: 'gold', label: 'λ' });
        let st = {};
        v.render(() => {
          const cf = FN[which.value].c(which.value === 'z' ? 0 : sc.value);
          sc.el.hidden = which.value === 'z';
          const ev = (zr, zi) => { let sr = 0, si = 0; for (let k = cf.length - 1; k >= 0; k--) { const t = sr * zr - si * zi + cf[k][0]; si = sr * zi + si * zr + cf[k][1]; sr = t; } return [sr, si]; };
          const K = 360, curve = M.range(K).map((k) => ev(Math.cos(M.TAU * k / K), Math.sin(M.TAU * k / K)));
          const or = v.rgb('orange');
          L.raster((x, y) => { const w = windingAt(curve, x, y); return w > 0 ? [or[0], or[1], or[2], Math.min(220, 40 + 75 * w)] : null; }, { key: `${which.value}|${sc.value}`, res: 2 });
          L.axes();
          L.path(curve.concat([curve[0]]), { color: 'blue', width: 2.8 });
          for (const t of [0.05, 0.3, 0.55, 0.8]) { const p = ev(Math.cos(M.TAU * t), Math.sin(M.TAU * t)), q = ev(Math.cos(M.TAU * (t + 0.012)), Math.sin(M.TAU * (t + 0.012))); L.arrow(p[0], p[1], q[0], q[1], { color: 'blue', head: 9, width: 2 }); }
          const ind = windingAt(curve, lam.x, lam.y);
          let dmin = Infinity; for (const p of curve) dmin = Math.min(dmin, Math.hypot(p[0] - lam.x, p[1] - lam.y));
          // right panel: phase portrait of f − λ on the closed disc, and its zeros
          const g = cf.map((z) => z.slice()); g[0] = [g[0][0] - lam.x, g[0][1] - lam.y];
          R.raster((x, y) => {
            if (x * x + y * y > 1) return null;
            let sr = 0, si = 0; for (let k = g.length - 1; k >= 0; k--) { const t = sr * x - si * y + g[k][0]; si = sr * y + si * x + g[k][1]; sr = t; }
            return phase(M, sr, si);
          }, { key: `${which.value}|${sc.value}|${lam.x}|${lam.y}`, res: 2 });
          R.circle(0, 0, 1, { color: 'blue', width: 3 });
          R.text('𝕋 = ∂U: all that B = C(𝕋) sees', 0, -1.07, { align: 'center', color: 'blue', size: 12, baseline: 'top' });
          const roots = polyRoots(g), inU = roots.filter((z) => Math.hypot(z[0], z[1]) < 1 - 1e-9);
          for (const z of roots) if (Math.hypot(z[0], z[1]) <= 1.15) R.dot(z[0], z[1], { color: Math.hypot(z[0], z[1]) < 1 ? 'red' : 'muted', r: 6, hollow: Math.hypot(z[0], z[1]) >= 1 });
          L.corner(dmin < 0.02 ? 'λ ∈ f(𝕋) = σ_B(f)' : ind > 0 ? `λ ∈ σ_A(f) ∖ σ_B(f)   (index ${ind})` : 'λ ∉ σ_A(f)', 'tl', { color: dmin < 0.02 ? 'blue' : ind > 0 ? 'orange' : 'green', weight: 600 });
          v.legend([['blue', '$\\sigma_B(f)=f(\\T)$'], ['orange', '$\\sigma_A(f)\\setminus\\sigma_B(f)$ (index $\\geq1$)', { area: true }], ['red', 'zeros of $f-\\lambda$ in $U$', { dot: true }]]);
          st = { ind, zeros: inU.length, dmin };
        });
        v.readout(() => {
          const s = st; if (s.ind == null) return '';
          if (s.dmin < 0.02) return '$\\lambda$ is on $f(\\T)$: $\\lambda-f$ vanishes somewhere on $\\T$, so it is invertible in neither algebra.';
          if (s.ind > 0) return `$\\Ind_{f(\\T)}(\\lambda)=${s.ind}$ and $f-\\lambda$ has ${s.zeros} zero${s.zeros === 1 ? '' : 's'} in $U$. In $B=C(\\T)$ the inverse $1/(\\lambda-f)$ exists, but it has no holomorphic extension to $U$, so $\\lambda e-f$ is not invertible in $A$.`;
          return `$\\Ind_{f(\\T)}(\\lambda)=0$: $f-\\lambda$ has no zero in $\\overline U$, so $1/(\\lambda-f)$ belongs to $A$ and $\\lambda\\notin\\sigma_A(f)$.`;
        });
      },
    },
  ],
};
