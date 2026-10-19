// Rudin, Functional Analysis — Chapter 8 (part 2): elliptic operators
//
// Full second-edition source review is recorded in docs/verification/fa-source-review.md.

const PRESETS = {
  lap: { label: 'Laplace $\\xi_1^2+\\xi_2^2$', a: 1, b: 0, c: 1 },
  ell: { label: 'elliptic $\\xi_1^2+\\xi_1\\xi_2+2\\xi_2^2$', a: 1, b: 0.5, c: 2 },
  wave: { label: 'wave $\\xi_1^2-\\xi_2^2$', a: 1, b: 0, c: -1 },
  heat: { label: 'degenerate $\\xi_1^2$', a: 1, b: 0, c: 0 },
};

/** Exact real quadratic principal-symbol minimum and a rigorous exterior radius. */
export function quadraticExterior(a,b,c,b1=0,b2=0,b0=0){
 const d=Math.hypot(a-c,2*b),lo=(a+c-d)/2,hi=(a+c+d)/2;
 const m=lo>0?lo:hi<0?-hi:0;
 const B=Math.hypot(b1,b2),C=Math.abs(b0),R=m>0?(B+Math.sqrt(B*B+2*m*C))/m:null;
 return {m,R};
}

/** Real characteristic lines, including tangent zeros of a degenerate quadratic. */
export function quadraticZeroDirections(a,b,c){
 const mu=(a+c)/2,d=Math.hypot((a-c)/2,b),phase=Math.atan2(b,(a-c)/2);
 if(d<1e-14)return Math.abs(mu)<1e-14?[0,Math.PI/4,Math.PI/2,3*Math.PI/4]:[];
 if(Math.abs(mu)>d+1e-12)return[];
 const alpha=Math.acos(Math.max(-1,Math.min(1,-mu/d))),mod=x=>((x%Math.PI)+Math.PI)%Math.PI;
 const x=mod((phase+alpha)/2),y=mod((phase-alpha)/2);return Math.abs(x-y)<1e-10?[x]:[x,y];
}

export default {
  collection: 'fa',
  chapter: 8,
  items: [
    {
      num: '8.7',
      kind: 'Definition',
      name: 'Elliptic operators',
      statement: String.raw`Let $\Omega\subset\R^n$ be open, $N$ a positive integer, and $f_\alpha\in C^\infty(\Omega)$ for $|\alpha|\le N$, with some $f_\alpha$, $|\alpha|=N$, not identically $0$. These define the linear differential operator $L=\sum_{|\alpha|\le N}f_\alpha D_\alpha$ of order $N$, whose **characteristic polynomial** (principal symbol) is
$$p(x,y)=\sum_{|\alpha|=N}f_\alpha(x)\,y^\alpha\qquad(x\in\Omega,\ y\in\R^n).$$
$L$ is **elliptic** if $p(x,y)\ne0$ for every $x\in\Omega$ and every $y\ne0$. For constant coefficients, $L=P(D)$ and $p=P_N$, the principal part of $P$.`,
      idea: String.raw`Ellipticity is a condition on the highest-order terms only, pointwise in $x$. For constant coefficients, since $P_N$ is homogeneous of degree $N$, it says $|P_N(\xi)|\ge m|\xi|^N$ with $m=\min_{|\omega|=1}|P_N(\omega)|>0$. The Laplacian ($P_2=-|\xi|^2$) is elliptic; the wave operator ($\xi_1^2-\xi_2^2$) and the heat operator (principal part $\xi_1^2$ in the variables $(x,t)$) are not — their principal symbols vanish along "characteristic" directions.`,
      caption: String.raw`Real constant-coefficient second-order symbols in the plane: $P_2(\xi)=a\xi_1^2+2b\xi_1\xi_2+c\xi_2^2$ (choose a preset or tune $a,b,c$). Left: $P_2$ coloured by sign and size over the $\xi$-plane, with its zero set in red — the characteristic directions. Right: $P_2$ on the unit circle. The operator is elliptic exactly when the curve never touches $0$, i.e. when $ac-b^2>0$.`,
      deps: ['fa-8.1'],
      tags: ['differential equations', 'elliptic operators'],
      viz(v) {
        const M = v.M;
        const pre = v.select('preset', Object.entries(PRESETS).map(([value, o]) => ({ value, label: o.label })), 'ell', { onChange: (k) => { aS.set(PRESETS[k].a); bS.set(PRESETS[k].b); cS.set(PRESETS[k].c); } });
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.01 });
        const bS = v.slider('$b$', -2, 2, 0.5, { step: 0.01 });
        const cS = v.slider('$c$', -2, 2, 2, { step: 0.01 });
        const L = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 320, axes: true, ticks: false, title: '$P_2(\\xi)$ on the $\\xi$-plane; zero set in red' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-3, 3], height: 320, axes: true, xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], xlabel: 'θ', title: '$P_2(\\cos\\theta,\\sin\\theta)$' });
        let st = {};
        v.legend([['blue', '$P_2>0$', { area: true }], ['orange', '$P_2<0$', { area: true }], ['red', 'characteristic directions $P_2=0$']]);
        v.render(() => {
          const a = aS.value, b = bS.value, c = cS.value;
          const P = (x, y) => a * x * x + 2 * b * x * y + c * y * y;
          L.raster((x, y) => { const p = P(x, y) / (x * x + y * y + 1e-9), t = Math.min(1, Math.abs(p) / 2.5); const col = p > 0 ? v.rgb('blue') : v.rgb('orange'); return [col[0], col[1], col[2], 40 + 170 * t]; }, { key: `${a},${b},${c}`, res: 3 });
          // zero directions: a cos² + 2b cos sin + c sin² = 0
          const zs=quadraticZeroDirections(a,b,c);
          for (const t of zs) L.line(-3 * Math.cos(t), -3 * Math.sin(t), 3 * Math.cos(t), 3 * Math.sin(t), { color: 'red', width: 2.6 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.2, dash: [4, 4] });
          R.hline(0, { color: 'red', width: 1, dash: [3, 3] });
          R.fn((t) => P(Math.cos(t), Math.sin(t)), { color: zs.length ? 'red' : 'green', width: 2.6 });
          for (const t of zs) { R.dot(t, 0, { color: 'red', r: 4.5 }); R.dot(t - Math.PI, 0, { color: 'red', r: 4.5 }); }
          const mn=quadraticExterior(a,b,c).m;
          st = { disc: a * c - b * b, mn, ell: a * c - b * b > 1e-9 };
        });
        v.readout(() => `$ac-b^2 = ${v.fix(st.disc, 3)}$, $\\;\\min_{|\\omega|=1}|P_2(\\omega)| = ${v.fix(st.mn, 3)}$: ` + (st.ell ? '**elliptic**, $|P_2(\\xi)|\\ge' + v.fix(st.mn, 3) + '\\,|\\xi|^2$.' : 'not elliptic — $P_2$ vanishes on the red lines.'));
      },
    },
    {
      num: '8.7a',
      kind: 'Corollary',
      name: 'Elliptic symbols are large at infinity',
      statement: String.raw`If $P(D)$ is elliptic of order $N$, there are constants $c>0$ and $R<\infty$ such that
$$|P(\xi)|\ge c\,|\xi|^N\qquad(\xi\in\R^n,\ |\xi|\ge R).$$
In particular $P$ has no zeros outside a compact set, and $1/P$ is smooth and $O(|\xi|^{-N})$ there.`,
      idea: String.raw`$|P_N(\xi)|\ge m|\xi|^N$ with $m=\min_{|\omega|=1}|P_N(\omega)|>0$, while the lower-order part satisfies $|P(\xi)-P_N(\xi)|\le C(1+|\xi|)^{N-1}$. For $|\xi|$ large the latter is at most $\frac m2|\xi|^N$, so $c=\frac m2$ works. Rudin uses this inequality in the proof of 8.12 rather than stating it separately. Without ellipticity $m=0$ and the lower-order terms decide: zeros of $P$ may run off to infinity along characteristic directions.`,
      caption: String.raw`The full symbol $P(\xi)=P_2(\xi)+\beta_1\xi_1+\beta_2\xi_2+\beta_0$ (real coefficients, so its zero set is a conic, drawn in red). Left: for an elliptic $P_2$ the zeros stay inside a disc (dashed: the radius $R$ beyond which $|P|\ge\frac m2|\xi|^2$); for the wave or degenerate symbols they escape to infinity. Right: angular samples of $\min_{|\xi|=\rho}|P(\xi)|/\rho^2$ against $\rho$ (log scale) — it tends to $m>0$ (green dashed) exactly in the elliptic case.`,
      deps: ['fa-8.7'],
      tags: ['elliptic operators', 'symbols'],
      viz(v) {
        const M = v.M;
        const pre = v.select('$P_2$', Object.entries(PRESETS).map(([value, o]) => ({ value, label: o.label })), 'ell');
        const b1S = v.slider('$\\beta_1$', -4, 4, 2.5, { step: 0.05 });
        const b2S = v.slider('$\\beta_2$', -4, 4, -1.5, { step: 0.05 });
        const b0S = v.slider('$\\beta_0$', -6, 6, -3, { step: 0.05 });
        const L = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, height: 330, axes: true, title: 'zeros of the full symbol $P$' });
        const R = v.stage({ x: [-1, 2.5], y: [-0.2, 3], height: 330, axes: 'box', xticks: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100']], xlabel: 'ρ', title: '$\\min_{|\\xi|=\\rho}|P(\\xi)|\\,/\\,\\rho^2$' });
        let st = {};
        v.legend([['red', '$P=0$'], ['ink', '$\\min_{|\\xi|=\\rho}|P|/\\rho^2$'], ['green', '$m=\\min_{|\\omega|=1}|P_2|$', { dash: true }], ['muted', 'radius $R$', { dash: true }]]);
        v.render(() => {
          const pr = PRESETS[pre.value], b1 = b1S.value, b2 = b2S.value, b0 = b0S.value;
          const P2 = (x, y) => pr.a * x * x + 2 * pr.b * x * y + pr.c * y * y;
          const P = (x, y) => P2(x, y) + b1 * x + b2 * y + b0;
          L.raster((x, y) => { const p = P(x, y); return p > 0 ? [60, 110, 220, 38] : [230, 130, 40, 38]; }, { key: `${pre.value},${b1},${b2},${b0}`, res: 3 });
          // zero set by marching over a grid (sign changes)
          const n = 240, h = 12 / n, segs = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const x = -6 + i * h, y = -6 + j * h, p00 = P(x, y), p10 = P(x + h, y), p01 = P(x, y + h);
            if (p00 * p10 < 0) segs.push([x + h * p00 / (p00 - p10), y]);
            if (p00 * p01 < 0) segs.push([x, y + h * p00 / (p00 - p01)]);
          }
          L.dots(segs, { color: 'red', r: 1.6 });
          const {m,R:Rr}=quadraticExterior(pr.a,pr.b,pr.c,b1,b2,b0);
          const ls = M.linspace(-1, 2.5, 141), ratio = ls.map((l) => { const rho = 10 ** l; let mn = Infinity; for (let i = 0; i < 360; i++) { const t = M.TAU * i / 360; mn = Math.min(mn, Math.abs(P(rho * Math.cos(t), rho * Math.sin(t)))); } return mn / (rho * rho); });
          if (Rr !== null && Rr < 8.5) L.circle(0, 0, Rr, { color: 'muted', width: 1.6, dash: [6, 4] });
          R.setView(null, [-0.1, Math.max(1.2, m * 1.6, Math.max(...ratio.slice(40)) * 1.1)]);
          if (m > 1e-9) { R.hline(m, { color: 'green', width: 1.8, dash: [6, 4] }); R.hline(m / 2, { color: 'green', width: 1, dash: [2, 3], alpha: 0.7 }); }
          R.path(ls.map((l, i) => [l, ratio[i]]), { color: 'ink', width: 2.4 });
          if (Rr > 0) R.vline(Math.log10(Rr), { color: 'muted', width: 1.2, dash: [4, 4] });
          const farZero = segs.some(([x, y]) => Math.hypot(x, y) > 5.5);
          st = { m, Rr, farZero, last: ratio[ratio.length - 1] };
        });
        v.readout(() => {
          const s = st;
          if (s.m > 1e-9) return `$m = ${v.fix(s.m, 3)}>0$: elliptic. $|P(\\xi)|\\ge\\frac m2|\\xi|^2$ for $|\\xi|\\ge R\\approx${v.fix(s.Rr, 2)}$; all zeros lie inside that disc by the analytic bound $m\\rho^2-|\\beta|\\rho-|\\beta_0|$.`;
          return `$m = 0$: not elliptic. sampled ratio at the right endpoint $${v.fix(s.last, 3)}$` + (s.farZero ? ', and zeros reach the edge of this finite plot.' : '.');
        });
      },
    },
    {
      num: '8.12',
      kind: 'Theorem',
      name: 'Elliptic regularity',
      statement: String.raw`Suppose $\Omega\subset\mathbb R^n$ is open and $L=\sum_{|\alpha|\le N}f_\alpha D_\alpha$ is elliptic of order $N\ge1$, with smooth coefficients, and every coefficient of order exactly $N$ is constant. If $Lu=v$ in $\mathscr D'(\Omega)$ and $v$ is locally $H^s$, then $u$ is locally $H^{s+N}$. Consequently smooth $v$ implies smooth $u$. Rudin notes after the theorem that the constant-principal-coefficient assumption can be dropped, but proves the stated version.`,
      idea: String.raw`First a compact cutoff of $u$ lies in some $H^t$ by 8.9(a). For nested cutoffs $\psi=1$ near $\operatorname{supp}\varphi$, assume $\psi u\in H^t$ with $t\le s+N-1$. The commutator $[L,\varphi]$ has order at most $N-1$, so $L(\varphi u)\in H^{t-N+1}$. The constant elliptic principal symbol has a Fourier multiplier inverse of order $-N$ after adding a bounded order-zero multiplier; all lower-order terms have order at most $N-1$. Applying this inverse gives $\varphi u\in H^{t+1}$. Iteration over nested balls reaches $H^{s+N}$. Repeating for every $s$ and using Sobolev's lemma gives the smooth corollary.`,
      caption: String.raw`Left: an elliptic case. $u$ is harmonic in the disc ($\Delta u=0\in C^\infty$), with boundary values a square wave on the circle that jumps $2k$ times. However rough the boundary data, $u$ is smooth — even real-analytic — inside: the readout shows a sampled maximum of $|\nabla u|$ on the disc of radius $0.9$. Right: the wave operator $\partial_t^2-\partial_x^2$ is not elliptic, and $u(x,t)=H(x-t-x_0)$ solves $u_{tt}-u_{xx}=0$ while jumping along a characteristic line; switch to the heat operator to see a non-elliptic operator that nonetheless smooths for $t>0$ (hypoellipticity is weaker than ellipticity).`,
      deps: ['fa-8.7', 'fa-8.7a', 'fa-8.9', 'fa-8.11', 'fa-7.25'],
      tags: ['elliptic operators', 'regularity'],
      viz(v) {
        const M = v.M;
        const kS = v.slider('jumps of the boundary data: $2k$, $k=$', 1, 6, 2, { int: true });
        const op = v.select('right panel', [{ value: 'wave', label: 'wave $u_{tt}=u_{xx}$' }, { value: 'heat', label: 'heat $u_t=u_{xx}$' }], 'wave');
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 330, axes: false, ticks: false, title: '$\\Delta u=0$ in the disc, square-wave boundary values' });
        const R = v.stage({ x: [-1.5, 1.5], y: [0, 2], height: 330, axes: 'box', xlabel: 'x', ylabel: 't', title: '' });
        const x0S = v.slider('initial jump position $x_0$', -1, 1, -0.4, { step: 0.01 });
        // harmonic extension of sgn(cos kθ): (4/π) Σ_j (−1)^j r^{(2j+1)k} cos((2j+1)kθ)/(2j+1)
        const harm = (k, x, y) => { const r = Math.hypot(x, y), th = Math.atan2(y, x); let s = 0, rp = Math.pow(r, k), rk2 = Math.pow(r, 2 * k); for (let j = 0; j < 400; j++) { const m = 2 * j + 1; s += (j % 2 ? -1 : 1) * rp * Math.cos(m * k * th) / m; rp *= rk2; if (rp < 1e-9) break; } return 4 / Math.PI * s; };
        const erf = (x) => { const t = 1 / (1 + 0.5 * Math.abs(x)); const r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? 1 - r : r - 1; };
        let st = {};
        v.legend([['blue', '$u>0$', { area: true }], ['orange', '$u<0$', { area: true }]]);
        v.render(() => {
          const k = kS.value, x0 = x0S.value, wave = op.value === 'wave';
          L.raster((x, y) => { if (x * x + y * y > 1) return null; const u = harm(k, x, y), t = Math.min(1, Math.abs(u)); const c = u > 0 ? v.rgb('blue') : v.rgb('orange'); return [c[0], c[1], c[2], 30 + 200 * t]; }, { key: `h${k}`, res: 2 });
          L.curve((t) => [1.04 * Math.cos(t), 1.04 * Math.sin(t)], 0, M.TAU, { color: 'muted', width: 1 });
          for (let i = 0; i < 2 * k; i++) { const a0 = (Math.PI / 2 + i * Math.PI) / k - Math.PI / (2 * k) * 0, a1 = a0 + Math.PI / k; const pos = Math.cos(k * (a0 + a1) / 2) > 0; L.curve((t) => [1.04 * Math.cos(t), 1.04 * Math.sin(t)], (i - 0.5) * Math.PI / k, (i + 0.5) * Math.PI / k, { color: i % 2 ? 'orange' : 'blue', width: 5 }); }
          L.circle(0, 0, 0.9, { color: 'ink', width: 1, dash: [4, 4] });
          // sup |∇u| on r ≤ 0.9 (attained on r = 0.9): differentiate the series
          let g = 0; for (let i = 0; i < 360; i++) { const th = M.TAU * i / 360, x = 0.9 * Math.cos(th), y = 0.9 * Math.sin(th), h = 1e-4; const gx = (harm(k, x + h, y) - harm(k, x - h, y)) / (2 * h), gy = (harm(k, x, y + h) - harm(k, x, y - h)) / (2 * h); g = Math.max(g, Math.hypot(gx, gy)); }
          // right panel
          R.setTitle(wave ? '$u=H(x-t-x_0)$: $u_{tt}-u_{xx}=0$, but $u$ jumps' : '$u=\\frac12\\big(1+\\operatorname{erf}\\frac{x-x_0}{2\\sqrt t}\\big)$: $u_t-u_{xx}=0$, smooth for $t>0$');
          R.raster((x, t) => { const u = wave ? (x - t - x0 > 0 ? 1 : 0) : (t < 1e-6 ? (x > x0 ? 1 : 0) : 0.5 * (1 + erf((x - x0) / (2 * Math.sqrt(t))))); const c = v.rgb('blue'); return [c[0], c[1], c[2], 20 + 190 * u]; }, { key: `${op.value}${x0}`, res: 2 });
          if (wave) R.line(x0, 0, x0 + 2, 2, { color: 'red', width: 2.6 });
          else R.dot(x0, 0, { color: 'red', r: 5 });
          st = { g, k, wave };
        });
        v.readout(() => `Elliptic sampled maximum on $|x|=0.9$: $|\\nabla u| = ${v.fix(st.g, 3)}$ — finite, though the boundary data have $${2 * st.k}$ jumps (the bound grows only as the disc approaches the boundary). ` + (st.wave ? 'Wave: $P(D)u=0$ is smooth, yet $u$ is discontinuous along the red characteristic — no regularity without ellipticity.' : 'Heat: also $P(D)u=0$, and $u$ is smooth for $t>0$; the only singularity is the initial point (red). The heat operator is hypoelliptic but not elliptic.'));
      },
    },
    {
      num: '8.12a',
      kind: 'Corollary',
      name: "Weyl's lemma: harmonic distributions are smooth",
      credit: 'Weyl',
      statement: String.raw`If $u\in\mathscr D'(\Omega)$ and $\Delta u=0$ in $\Omega$, then $u$ is (equal to) a $C^\infty$ — indeed real-analytic — harmonic function in $\Omega$.`,
      idea: String.raw`The Laplacian is elliptic, so 8.12 applies. A direct argument: for a radial mollifier $h_\varepsilon$, harmonic functions satisfy $u*h_\varepsilon=u$ (mean value property). For a harmonic distribution, $u*h_\varepsilon$ is a smooth harmonic function and $(u*h_\varepsilon)*h_\delta=(u*h_\delta)*h_\varepsilon$; letting $\delta\to0$ gives $u*h_\varepsilon=u$ near each point, so $u$ is smooth.`,
      caption: String.raw`The mechanism behind Weyl's lemma: averaging over discs. For a function $u$ on the plane (left) we compute $u*h_\varepsilon-u$ (right, log scale) with a radial mollifier of radius $\varepsilon$. For harmonic $u$ it vanishes to rounding error everywhere — except within $\varepsilon$ of the singularity of $\log|z-a|$, where $\Delta u=2\pi\delta_a\ne0$. For a non-harmonic $u$ such as $|z|^2$ or $x|y|$ the defect is of size $\varepsilon^2\Delta u$, concentrated where $\Delta u\ne0$.`,
      deps: ['fa-8.12', 'fa-6.32'],
      see: ['rca-11.13'],
      tags: ['harmonic functions', 'regularity', "Weyl's lemma"],
      viz(v) {
        const M = v.M;
        const U = {
          cubic: { label: '$\\mathrm{Re}\\,z^3$', f: (x, y) => x * x * x - 3 * x * y * y },
          log: { label: '$\\log|z-a|$', f: (x, y) => 0.5 * Math.log((x - 0.4) ** 2 + (y + 0.3) ** 2 + 1e-300) },
          sq: { label: '$|z|^2$', f: (x, y) => x * x + y * y },
          kink: { label: '$x\\,|y|$', f: (x, y) => x * Math.abs(y) },
        };
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'log');
        const eS = v.slider('mollifier radius $\\varepsilon$', 0.05, 0.4, 0.15, { step: 0.01 });
        const T = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 290, axes: false, ticks: false, title: '$u$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 290, axes: false, ticks: false, title: '$|u*h_\\varepsilon-u|$ (log scale, $10^{-14}$ to $1$)' });
        // radial mollifier weights on a polar grid
        const NR = 10, NT = 48, W = [];
        { let tot = 0; for (let i = 0; i < NR; i++) { const s = (i + 0.5) / NR, w = Math.exp(-1 / (1 - s * s)) * s; for (let j = 0; j < NT; j++) { W.push([s, M.TAU * (j + 0.5) / NT, w]); tot += w; } } W.forEach((p) => { p[2] /= tot; }); }
        let st = {};
        v.render(() => {
          const key = which.value, f = U[key].f, eps = eS.value;
          T.heat((x, y) => f(x, y), { range: key === 'log' ? [-2.5, 0.5] : [-1, 1.5], cmap: 'diverging', res: 3, key });
          let mx = 0, mxH = 0;
          const defect = (x, y) => { let s = 0; for (const [r, t, w] of W) s += w * f(x + eps * r * Math.cos(t), y + eps * r * Math.sin(t)); return Math.abs(s - f(x, y)); };
          B.raster((x, y) => { const d = defect(x, y); const l = M.clamp((Math.log10(d + 1e-16) + 14) / 14, 0, 1); return M.cmap(l, 'magma'); }, { key: `${key}|${eps}`, res: 5 });
          if (key === 'log') { B.circle(0.4, -0.3, eps, { color: 'green', width: 1.6, dash: [4, 3] }); T.dot(0.4, -0.3, { color: 'ink', r: 4, label: 'a' }); }
          for (let i = 0; i < 400; i++) { const x = -0.9 + 1.8 * (i % 20) / 19, y = -0.9 + 1.8 * Math.floor(i / 20) / 19; const d = defect(x, y); if (key === 'log' && Math.hypot(x - 0.4, y + 0.3) < eps * 2) continue; mx = Math.max(mx, d); }
          st = { key, mx, eps };
        });
        v.readout(() => {
          const s = st, harmonic = s.key === 'cubic' || s.key === 'log';
          return `$\\max|u*h_\\varepsilon-u| = ${v.sci(s.mx + 1e-300, 2)}$` + (s.key === 'log' ? ' at distance $\\ge2\\varepsilon$ from $a$' : '') + (harmonic ? ': the mean value property, $u*h_\\varepsilon=u$ — the identity that makes harmonic distributions smooth.' : `: of order $\\varepsilon^2\\Delta u$ ($\\varepsilon^2 = ${v.fix(s.eps * s.eps, 4)}$), because $u$ is not harmonic.`);
        });
      },
    },
  ],
};
