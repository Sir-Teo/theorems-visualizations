import {heatDifferenceMultiplier} from './ch13.verified.shared.js';
// Rudin, Functional Analysis — Chapter 13 (part 2): Cayley transform, spectral theorem, Stone's theorem, semigroups
//
// Source audit: complete relevant statements/proofs in Rudin, second edition, pp.347–385 inspected.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

const p10=k=>k===0?'1':'10'+(k<0?'⁻':'')+String(Math.abs(k)).replace(/[0-9]/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
const decTicks=(lo,hi)=>Array.from({length:hi-lo+1},(_,j)=>[lo+j,p10(lo+j)]);

export default {
  collection: 'fa',
  chapter: 13,
  items: [
    {
      num: '13.19',
      kind: 'Theorem',
      name: 'The Cayley transform',
      statement: String.raw`For every symmetric operator T, with density not required, its Cayley transform $U=(T-iI)(T+iI)^{-1}$ is an isometry from R(T+iI) onto R(T−iI). T is closed exactly when U is closed; I−U is one-to-one, R(I−U)=D(T), and $T=i(I+U)(I-U)^{-1}$. U is unitary exactly when T is self-adjoint. Conversely every isometry V on a subspace for which I−V is one-to-one is the Cayley transform of a symmetric operator.`,
      idea: String.raw`For $x\in\mathscr D(T)$, symmetry kills the cross terms: $\norm{(T\pm iI)x}^2=\norm{Tx}^2+\norm x^2$. So $U$ maps $(T+i)x\mapsto(T-i)x$ isometrically. Self-adjointness is equivalent to $\mathscr R(T\pm iI)=H$, which is exactly unitarity of $U$. On numbers, $\lambda\mapsto\frac{\lambda-i}{\lambda+i}$ maps the real line onto the unit circle minus the point $1$ — the spectral version of the same fact.`,
      caption: String.raw`The scalar Cayley map $\kappa(\lambda)=\frac{\lambda-i}{\lambda+i}$ sends the real axis (left, blue ticks at the integers) onto the unit circle minus $1$ (right). Drag $\lambda$: real $\lambda$ land on the circle ($|\kappa|=1$), $\lambda$ in the upper half-plane inside, lower half-plane outside. A self-adjoint $T$ with spectrum on $\R$ becomes the unitary $U$ with spectrum on $\T$; $\pm\infty$ both go to $1$, which is why $I-U$ must be one-to-one. The $3\times3$ check in the readout: for $T$ symmetric with eigenvalues $\lambda_k$, $U$ has eigenvalues $\kappa(\lambda_k)$ and $\norm{U^*U-I}\approx0$.`,
      deps: ["fa-13.16", "fa-13.17", "fa-13.18", "fa-13.13", "fa-12.13"],
      tags: ['Cayley transform', 'self-adjoint operators', 'unitary operators'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.19 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-4, 4], y: [-2.5, 2.5], equal: true, height: 320, axes: true, title: '$\\lambda$-plane' });
        const R = v.stage({ x: [-1.8, 1.8], y: [-1.5, 1.5], equal: true, height: 320, axes: true, title: '$\\kappa(\\lambda)=(\\lambda-i)/(\\lambda+i)$' });
        const hl = L.handle(1.3, 0.6, { color: 'purple', label: 'λ',constrain:(x,y)=>Math.hypot(x,y+1)<.025?[0,-1]:[x,y] });
        const kap = (z) => cdiv(csub(z, [0, 1]), cadd(z, [0, 1]));
        let st = {};
        v.legend([['blue', '$\\R$ and its image'], ['green', 'upper half-plane → inside'], ['purple', '$\\lambda$ and $\\kappa(\\lambda)$']]);
        v.render(() => {
          const z = [hl.x, hl.y],pole=z[0]===0&&z[1]===-1,w=pole?[0,0]:kap(z);
          L.hband(0, 5, { color: 'green', alpha: 0.06 });
          R.circle(0, 0, 1, { color: 'blue', width: 2.4, fill: 'green', fillAlpha: 0.06 });
          L.hline(0, { color: 'blue', width: 2.4 });
          for (let k = -4; k <= 4; k++) { L.dot(k, 0, { color: 'blue', r: 3 }); const q = kap([k, 0]); R.dot(q[0], q[1], { color: 'blue', r: 3 }); }
          R.dot(1, 0, { color: 'red', r: 5, hollow: true, label: '±∞', labelPos: 'e', math: false });
          // image of the horizontal line through λ
          R.curve((t) => kap([Math.tan(t), z[1]]), -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01, { color: 'purple', width: 1.4, dash: [5, 4], n: 300 });
          L.hline(z[1], { color: 'purple', width: 1.2, dash: [5, 4] });
          L.dot(0,-1,{color:'red',r:4,hollow:true,label:'pole −i',labelPos:'se'});if(!pole)R.dot(w[0], w[1], { color: 'purple', r: 6 });
          // 3×3 check with a real symmetric T
          const Q = [[0.6, -0.64, 0.48], [0.8, 0.48, -0.36], [0, 0.6, 0.8]], l = [-1.3, 0.4, 2.2];
          const U = [0, 1, 2].map((i) => [0, 1, 2].map((j) => l.reduce((s, lk, k) => cadd(s, [kap([lk, 0])[0] * Q[i][k] * Q[j][k], kap([lk, 0])[1] * Q[i][k] * Q[j][k]]), [0, 0])));
          const UU = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((s, k) => cadd(s, cmul([U[k][i][0], -U[k][i][1]], U[k][j])), [0, 0])));
          const def = Math.sqrt([0, 1, 2].reduce((s, i) => s + [0, 1, 2].reduce((t, j) => t + cabs(csub(UU[i][j], [i === j ? 1 : 0, 0])) ** 2, 0), 0));
          st = { z, w, r: cabs(w), def,pole };
        });
        v.readout(() => st.pole?'κ has a pole at λ=−i; no finite image is drawn. The Cayley theorem itself applies to symmetric operators.':`$|\\kappa(\\lambda)| = ${v.fix(st.r, 4)}$` + (Math.abs(st.z[1]) < 1e-3 ? ' — $\\lambda$ real, on the circle.' : st.z[1] > 0 ? ' $<1$ — upper half-plane.' : ' $>1$ — lower half-plane.') + ` For a symmetric $3\\times3$ $T$: $\\|U^*U-I\\| = ${v.sci(st.def, 1)}$.`);
      },
    },
    {
      num: '13.20',
      kind: 'Definition',
      name: 'Deficiency indices',
      statement: String.raw`For a closed densely defined symmetric T, put $n_\pm=\dim\mathscr N(T^*\mp iI)=\dim\mathscr R(T\pm iI)^\perp$. T is self-adjoint exactly when both indices vanish; maximally symmetric exactly when at least one vanishes; and it admits a self-adjoint extension exactly when they are equal. Such extensions correspond to unitary maps between the two deficiency spaces. For a closable symmetric restriction the same indices test essential self-adjointness through its closure.`,
      idea: String.raw`The Cayley transform $U$ of $T$ is an isometry between closed subspaces with orthogonal complements of dimensions $n_+$ and $n_-$; a symmetric extension of $T$ gives an isometry extending $U$, and it is unitary — the extension self-adjoint — exactly when it maps one complement onto the other. For $-i\,d/dx$ on $[0,1]$ with $f(0)=f(1)=0$, $n_\pm=1$ (spanned by $e^{\pm x}$), giving the circle of extensions $T_\theta$ of 13.15; on $[0,\infty)$, $n_+=1\ne n_-=0$ and no self-adjoint extension exists.`,
      deps: ['fa-13.19'],
      tags: ['deficiency indices', 'self-adjoint extensions'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.20 (full relevant statement and proof inspected)'],
      caption: String.raw`Compute the deficiency spaces on $C_c^\infty(I)$ for $T=-i\,d/dx$ or $T=-d^2/dx^2$. The candidates in $\mathscr N(T^*\mp i)$ are exponentials, whose moduli are drawn left: $e^{\mp x}$, or $e^{\pm x/\sqrt2}$ for the second-order operator. They count only if they are square-integrable on $I$; right: $\int|f|^2$ over growing pieces of $I$. On $\R$ nothing survives, so $T$ is essentially self-adjoint. On a half-line or an interval some survive, the deficiency indices $(n_+,n_-)$ are not $(0,0)$, and boundary conditions must be chosen.`,
      viz(v) {
        const M = v.M;
        const op = v.select('$T=$', [{ value: 'd1', label: '$-i\\,d/dx$' }, { value: 'd2', label: '$-d^2/dx^2$' }], 'd1');
        const iv = v.select('$I=$', [{ value: 'unit', label: '$(0,1)$' }, { value: 'half', label: '$(0,\\infty)$' }, { value: 'line', label: '$\\R$' }], 'half');
        const L = v.stage({ x: [-6, 6], y: [0, 4], height: 300, axes: true, title: 'moduli of the solutions of $T^*f=\\pm if$ on $I$' });
        const R = v.stage({ x: [0, 6], y: [-1, 5], height: 300, axes: 'box', xlabel: 'X', yticks: decTicks(-1, 5), title: '$\\int_{I\\cap[-X,X]}|f|^2$ (log scale)' });
        let st = {};
        v.legend([['green', 'square-integrable on $I$: counts'], ['red', 'not in $L^2(I)$']]);
        v.render(() => {
          const d1 = op.value === 'd1', I = iv.value;
          const lo = I === 'line' ? -6 : 0, hi = I === 'unit' ? 1 : 6;
          L.setView([I === 'line' ? -6 : -0.3, I === 'unit' ? 1.05 : 6], [0, 4]);
          R.setView([0, I === 'unit' ? 1 : 6], [-1, 5.5]);
          // candidates: rates r with |f| = e^{r x}; first order: +i ↦ r=−1, −i ↦ r=+1; second order: each sign has r = ±1/√2
          const cands = d1 ? [{ r: -1, sgn: '+' }, { r: 1, sgn: '−' }] : [{ r: -Math.SQRT1_2, sgn: '+' }, { r: Math.SQRT1_2, sgn: '+' }, { r: -Math.SQRT1_2, sgn: '−' }, { r: Math.SQRT1_2, sgn: '−' }];
          const inL2 = (r) => (I === 'unit' ? true : I === 'half' ? r < 0 : false);
          const np = cands.filter((c) => c.sgn === '+' && inL2(c.r)).length, nm = cands.filter((c) => c.sgn === '−' && inL2(c.r)).length;
          L.vband(lo, hi, { color: 'muted', alpha: 0.06 });
          cands.forEach((c, k) => {
            const ok = inL2(c.r), dash = c.sgn === '−' ? [6, 4] : false;
            L.fn((x) => Math.exp(c.r * x), { domain: [lo, hi], color: ok ? 'green' : 'red', width: 2.4, dash });
            const Xs = M.linspace(0.02, I === 'unit' ? 1 : 6, 120);
            R.path(Xs.map((X) => { const a = Math.max(lo, -X), b = Math.min(hi, X); const val = Math.abs(c.r) < 1e-12 ? b - a : (Math.exp(2 * c.r * b) - Math.exp(2 * c.r * a)) / (2 * c.r); return [X, Math.log10(Math.max(1e-6, val))]; }), { color: ok ? 'green' : 'red', width: 2, dash });
          });
          st = { np, nm, I, d1 };
        });
        v.readout(() => {
          const s = st, esa = s.np === 0 && s.nm === 0;
          return `Deficiency indices $(n_+,n_-)=(${s.np},${s.nm})$ (solid: $T^*f=if$, dashed: $T^*f=-if$). ` + (esa ? '**Essentially self-adjoint**: $\\overline T$ is the unique self-adjoint extension.' : s.np === s.nm ? 'Not essentially self-adjoint; there are many self-adjoint extensions (choices of boundary condition).' : 'Not essentially self-adjoint, and since $n_+\\ne n_-$ there is no self-adjoint extension at all.');
        });
      },
    },
    {
      num: '13.27',
      kind: 'Theorem',
      name: 'The spectrum of Ψ(f) is the essential range of f',
      statement: String.raw`For a spectral measure E and a measurable f, the spectrum of Ψ(f) is the E-essential range of f. A value α is an eigenvalue exactly when E(f⁻¹{α})≠0. If α is in the essential range and this projection is zero, Ψ(f)−αI is injective with dense proper range, and there are unit vectors xₙ∈D(Ψ(f)) with ‖(Ψ(f)−αI)xₙ‖→0. Outside the essential range, the inverse is the bounded multiplier1/(f−α); its norm is the reciprocal distance to that closed range. The last norm formula is a consequence of the isometric bounded calculus.`,
      idea: String.raw`If $\lambda$ is outside the essential range, at distance $d$, then $g=1/(f-\lambda)$ is bounded by $1/d$ almost everywhere $[E]$, and 13.24(c) shows that the bounded operator $\Psi(g)$ is a two-sided inverse of $\Psi(f)-\lambda I$, with norm $1/d$. If $\lambda$ is in the essential range, the projections $E(\{|f-\lambda|<\varepsilon\})$ are nonzero, and unit vectors $x$ in their ranges have $\norm{(\Psi(f)-\lambda)x}\le\varepsilon$ by 13.24(a), so $\Psi(f)-\lambda I$ has no bounded inverse. Values that $f$ takes only on an $E$-null set do not count. Eigenvalues: if $E(\omega_\alpha)\ne0$, every $x$ in its range has $\Psi(f)x=\alpha x$; conversely $\norm{(\Psi(f)-\alpha)x}^2=\int|f-\alpha|^2dE_{x,x}=0$ forces $E_{x,x}$ to live on $\omega_\alpha$.`,
      caption: String.raw`The sampled background colour approximates $\log_{10}\norm{(\Psi(f)-\lambda)^{-1}}=-\log_{10}\operatorname{dist}(\lambda,\operatorname{ess\,range}f)$; drag $\lambda$. **Laplacian**: $T=-d^2/dx^2$ on $L^2[0,\pi]$ with Dirichlet conditions is $\Psi(\lambda)$ for its resolution of the identity, which has atoms at $1,4,9,\dots$ (red). This is the essential range, so the spectrum, all real, and the readout compares the resolvent norm with $1/|\operatorname{Im}\lambda|$. **Multiplication**: $\Psi(f)$ is multiplication by a continuous complex $f$ on $L^2[0,1]$, whose essential range is the curve $f([0,1])$ (green). The readout refines the continuous-curve distance by one-dimensional minimization. Changing $f$ at the single point $t=\frac12$ (red ring) changes nothing, since a point is a null set.`,
      deps: ["fa-13.24", "fa-13.26", "fa-12.20", "fa-12.21", "fa-2.15"],
      tags: ['spectrum', 'resolution of the identity', 'resolvent'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.27 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'lap', label: 'Laplacian $-d^2/dx^2$' }, { value: 'mul', label: 'multiplication by $f$' }], 'lap', { onChange: (m) => { if (m === 'lap') hl.set(11.5, 2.2); else hl.set(0.5, 0.35); } });
        const S = v.stage({ x: [-3, 40], y: [-8, 8], height: 340, full: true, axes: true, title: '' });
        const hl = S.handle(11.5, 2.2, { color: 'purple', label: 'λ',constrain:(x,y)=>{if(mode.value==='lap'){const k=Math.max(1,Math.round(Math.sqrt(Math.max(0,x)))),e=k*k;if(Math.hypot(x-e,y)<.04)return[e,0];}else{let p=curve[0],d=Infinity;for(const q of curve){const r=Math.hypot(x-q[0],y-q[1]);if(r<d){d=r;p=q;}}if(d<.015)return p;}return[x,y];} });
        const ev = M.range(7).map((k) => (k + 1) ** 2);
        const fc = (t) => { const r = 1 + 0.35 * Math.cos(6 * Math.PI * t); return [r * Math.cos(2 * Math.PI * t), r * Math.sin(2 * Math.PI * t)]; };
        const curve = M.linspace(0, 1, 361).map(fc), spike = [1.9, 1.15];
        let st = {};
        v.render(() => {
          const lap = mode.value === 'lap', z = [hl.x, hl.y];
          if (lap) {
            S.setView([-3, 40], [-8, 8]); S.setTitle('$\\log_{10}\\|(T-\\lambda)^{-1}\\|$ for $T=-d^2/dx^2$, Dirichlet');
            S.heat((x, y) => -Math.log10(Math.min(...ev.map((e) => Math.hypot(x - e, y))) + 1e-9), { range: [-1, 1.5], cmap: 'magma', res: 3, key: 'lap' });
            S.axes();
            ev.forEach((e) => S.dot(e, 0, { color: 'red', r: 4.5 }));
            S.text('…', 39, 0.8, { color: 'red', size: 16 });
            if (Math.abs(z[1]) > 0.05) { S.hline(z[1], { color: 'purple', width: 1, dash: [4, 4] }); S.hline(-z[1], { color: 'purple', width: 1, dash: [4, 4] }); }
            const dist = Math.min(...ev.map((e) => Math.hypot(z[0] - e, z[1])));
            st = { lap,onSpectrum:dist<1e-10, res: dist>1e-10?1 / dist:0, bound: Math.abs(z[1]) > 1e-9 ? 1 / Math.abs(z[1]) : Infinity };
          } else {
            S.setView([-4.3, 4.3], [-1.7, 1.7]); S.setTitle('$\\log_{10}\\|(\\Psi(f)-\\lambda)^{-1}\\|$, $f(t)=(1+0.35\\cos6\\pi t)e^{2\\pi it}$');
            const d = (x, y) => { let m = Infinity; for (const p of curve) m = Math.min(m, Math.hypot(x - p[0], y - p[1])); return m; };
            const continuousDistance=(x,y)=>{let best=0,q=Infinity;for(let j=0;j<360;j++){const p=curve[j],r=Math.hypot(x-p[0],y-p[1]);if(r<q){q=r;best=j;}}let lo=(best-1)/360,hi=(best+1)/360;const f=t=>{const p=fc(t);return (p[0]-x)**2+(p[1]-y)**2;};for(let j=0;j<60;j++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(f(a)<f(b))hi=b;else lo=a;}return Math.sqrt(f((lo+hi)/2));};
            S.heat((x, y) => -Math.log10(d(x, y) + 1e-9), { range: [-1, 1.5], cmap: 'magma', res: 4, key: 'mul' });
            S.axes();
            S.path(curve, { color: 'green', width: 2.4 });
            S.dot(spike[0], spike[1], { color: 'red', r: 6, hollow: true });
            S.text('f(½), changed on a null set', spike[0] + 0.15, spike[1] + 0.22, { color: 'ink', size: 12, align: 'left' });
            const dist=continuousDistance(z[0],z[1]);st = { lap,onSpectrum:dist<1e-10,res:dist>1e-10?1/dist:0, spikeDist: Math.hypot(z[0] - spike[0], z[1] - spike[1]) };
          }
        });
        v.readout(() => {
          const s = st;
          if(s.onSpectrum)return 'λ is on the spectrum: there is no bounded everywhere-defined resolvent at this point.';
          if (s.lap) return `$\\|(T-\\lambda)^{-1}\\| = 1/\\operatorname{dist}(\\lambda,\\sigma(T)) = ${v.fix(s.res, 4)}$` + (isFinite(s.bound) ? ` $\\le 1/|\\operatorname{Im}\\lambda| = ${v.fix(s.bound, 4)}$.` : ' — $\\lambda$ is real: the bound gives nothing, and $\\lambda$ may be in the spectrum.');
          return `$\\|(\\Psi(f)-\\lambda)^{-1}\\|=1/\\operatorname{dist}(\\lambda,f([0,1]))=${v.fix(s.res, 4)}$` + (s.spikeDist < 0.15 ? '. $\\lambda$ is near the value taken on the null set, but that value is not in the essential range, so the resolvent stays bounded.' : '.');
        });
      },
    },
    {
      num: '13.30',
      kind: 'Theorem',
      name: 'The spectral theorem for unbounded self-adjoint operators',
      statement: String.raw`Every self-adjoint operator A in H has a unique spectral resolution E on the Borel subsets of the real line such that $(Ax,y)=\int t\,dE_{x,y}(t)$ for x∈D(A), y∈H. The measure is concentrated on σ(A)⊂ℝ, and $\mathscr D(A)=\{x:\int t^2\,dE_{x,x}(t)<\infty\}$. Measurable functional calculus then follows from13.24. A general normal operator has a complex spectrum and is treated separately in13.33.`,
      idea: String.raw`Pass to the Cayley transform $U$, a unitary with $I-U$ one-to-one, and apply the bounded spectral theorem 12.23: $U=\int_\T\mu\,dE'(\mu)$, with $E'(\{1\})=0$. Pull $E'$ back to $\R$ through $\kappa^{-1}(\mu)=i\frac{1+\mu}{1-\mu}$. Unbounded $f$ are handled by truncation, $f_n=f1_{\{|f|\le n\}}$, and the domain is where the truncations converge.`,
      caption: String.raw`$T=-d^2/dx^2$ on $[0,\pi]$ (Dirichlet), eigenvalues $k^2$, eigenfunctions $\sqrt{2/\pi}\sin kx$. Pick $f$ (top, drawn with sine coefficients $c_k$): $E_{f,f}$ puts mass $c_k^2$ at $\lambda=k^2$ (bars, log-scaled $\lambda$ axis). $f$ is in $\mathscr D(T)$ iff $\sum k^4c_k^2<\infty$. The smooth bump (vanishing at both ends, $c_k=O(k^{-3})$) qualifies. The tent does not: $c_k$ is proportional to $\sin(1.2k)/k^2$, so $k^4c_k^2$ has no summable decay — its second derivative is a point mass, not an $L^2$ function. The step ($c_k=O(k^{-1})$) is worse still. The readout shows the partial sums of $\int\lambda^2dE_{f,f}$ converging or diverging.`,
      deps: ["fa-13.19", "fa-12.23", "fa-12.29", "fa-13.24", "fa-13.27", "fa-13.15"],
      see: ['fa-12.23'],
      tags: ['spectral theorem', 'unbounded operators'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.30 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const F = {
          bump: { label: 'smooth bump', f: (x) => Math.exp(-((x - 1.5) ** 2) / 0.2) - Math.exp(-(1.5 ** 2) / 0.2) * (1 - x / Math.PI) - Math.exp(-((Math.PI - 1.5) ** 2) / 0.2) * x / Math.PI },
          tent: { label: 'tent', f: (x) => (x < 1.2 ? x / 1.2 : (Math.PI - x) / (Math.PI - 1.2)) },
          step: { label: 'step $1_{[0,2]}$', f: (x) => (x < 2 ? 1 : 0) },
        };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const NK = 120;
        const top = v.stage({ x: [0, Math.PI], y: [-0.4, 1.3], height: 200, full: true, axes: true, title: '$f$ and the partial sum of its eigen-expansion ($k\\le12$)' });
        const bot = v.stage({ x: [0, Math.log10(NK * NK)], y: [-9, 0.5], height: 220, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], xlabel: 'λ = k²', title: '$E_{f,f}$: mass $c_k^2$ at $\\lambda=k^2$ (log–log)' });
        const coefCache = new Map();
        const coefs = (key) => { if (!coefCache.has(key)) { if(key==='tent'||key==='step'){coefCache.set(key,M.range(NK).map(i=>{const k=i+1;return Math.sqrt(2/Math.PI)*(key==='step'?(1-Math.cos(2*k))/k:Math.PI*Math.sin(1.2*k)/(1.2*(Math.PI-1.2)*k*k));}));return coefCache.get(key);} const f = F[key].f, n = 6000; coefCache.set(key, M.range(NK).map((i) => { const k = i + 1; let s = 0; for (let j = 0; j <= n; j++) { const x = Math.PI * j / n, w = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * Math.PI / (3 * n); s += w * f(x) * Math.sin(k * x); } return s * Math.sqrt(2 / Math.PI); })); } return coefCache.get(key); };
        let st = {};
        v.render(() => {
          const key = which.value, c = coefs(key);
          top.fn(F[key].f, { color: 'blue', width: 2.4, n: 800 });
          top.fn((x) => c.slice(0, 12).reduce((s, ck, i) => s + ck * Math.sqrt(2 / Math.PI) * Math.sin((i + 1) * x), 0), { color: 'orange', width: 1.6, dash: [5, 4], n: 800 });
          c.forEach((ck, i) => { const k = i + 1, y = Math.log10(ck * ck + 1e-30); if (y > -9) bot.line(Math.log10(k * k), -9, Math.log10(k * k), y, { color: 'purple', width: 2, alpha: 0.8 }); });
          bot.setTicks([[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], [0, -2, -4, -6, -8].map((k) => [k, k === 0 ? '1' : `10⁻${'²⁴⁶⁸'[(-k) / 2 - 1]}`]));
          const part = (m) => c.slice(0, m).reduce((s, ck, i) => s + (i + 1) ** 4 * ck * ck, 0);
          st = { key, p30: part(30), p60: part(60), p120: part(120) };
        });
        v.legend([['blue', '$f$'], ['orange', 'eigen-expansion, $k\\le12$', { dash: true }], ['purple', '$E_{f,f}(\\{k^2\\})=c_k^2$']]);
        v.readout(() => `Partial sums of $\\int\\lambda^2dE_{f,f}=\\|Tf\\|^2$: $${v.fix(st.p30, 1)}$ ($k\\le30$), $${v.fix(st.p60, 1)}$ ($k\\le60$), $${v.fix(st.p120, 1)}$ ($k\\le120$)` + (st.key!=='bump' ? ' — the analytic coefficient decay gives divergence: $f\\notin\\mathscr D(T)$.' : ' — the analytic O(k⁻³) coefficients give convergence: $f\\in\\mathscr D(T)$. The finite sums illustrate these independently established facts.'));
      },
    },
    {
      num: '13.38',
      kind: 'Theorem',
      name: "Normal semigroups and Stone\u2019s theorem",
      statement: String.raw`Let Q(t), t≥0, be a semigroup of bounded normal operators on a complex Hilbert space, strongly continuous at0. Its infinitesimal generator A is a closed normal operator, Reσ(A) is bounded above, and Q(t)=e^{tA} through the spectral calculus. If every Q(t) is unitary, A=iS for a unique self-adjoint S, so Q(t)=e^{itS} and the formula extends to a strongly continuous unitary group for all real t. Conversely a normal A with Reσ(A) bounded above gives such a normal semigroup. The generator domain consists exactly of the vectors for which the strong difference quotient at0 exists.`,
      idea: String.raw`Fuglede makes the semigroup and its adjoints generate a commutative self-adjoint algebra. In its spectral representation the dyadic difference quotients have an almost-everywhere limit b. Spectral estimates and dominated convergence identify Ψ(b) with the generator and Q(t) with exp(tb). For unitary Q(t), b is purely imaginary, so −iA is self-adjoint. The translation-group picture illustrates this unitary special case.`,
      caption: String.raw`$T=-i\,d/dx$ on $L^2(\R)$ generates the translation group $(U_tf)(x)=f(x+t)$; equivalently, in frequency space $U_t$ multiplies by $e^{it\xi}$. Drag $t$: the blue profile slides rigidly, $\norm{U_tf}=\norm f$. Bottom: the size of the difference quotient $\norm{\frac{U_tf-f}{t}}$ as $t\to0$ — it converges to $\norm{f'}$ for the smooth $f$, and blows up like $|t|^{-1/2}$ for the step $f=1_{[0,1]}$, which is not in $\mathscr D(T)$.`,
      deps: ["fa-13.35", "fa-13.24", "fa-13.27", "fa-12.16", "fa-12.22"],
      tags: ["Stone's theorem", 'unitary groups', 'generators'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.38 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const F = { smooth: { label: 'smooth $f$', f: (x) => Math.exp(-x * x) * (1 + 0.6 * Math.sin(2 * x)) }, step: { label: 'step $1_{[0,1]}$', f: (x) => (x >= 0 && x <= 1 ? 1 : 0) } };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const tS = v.slider('$t$', -3, 3, 0.8, { step: 0.01 });
        const top = v.stage({ x: [-5, 5], y: [-0.6, 1.6], height: 220, full: true, axes: true, title: '$f$ (faint) and $U_tf=f(\\cdot+t)$' });
        const bot = v.stage({ x: [-3, 0], y: [-0.5, 2.5], height: 200, full: true, axes: 'box', xticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], xlabel: '|t|', title: '$\\log_{10}\\|(U_tf-f)/t\\|_2$ against $\\log_{10}|t|$' });
        const L2 = (g) => { let s = 0; const n = 8000; for (let i = 0; i <= n; i++) { const x = -8 + 16 * i / n; s += g(x) ** 2 * (i === 0 || i === n ? 0.5 : 1); } return Math.sqrt(s * 16 / n); };
        let st = {};
        v.render(() => {
          const key = which.value, f = F[key].f, t = tS.value;
          top.fn(f, { color: 'blue', width: 1.4, alpha: 0.35, n: 1500 });
          top.fn((x) => f(x + t), { color: 'blue', width: 2.6, n: 1500 });
          const ts = M.linspace(-3, 0, 31), q = ts.map((l) => { const h = 10 ** l; return [l, Math.log10(key==='step'?Math.sqrt(2*Math.min(h,1))/h:L2((x) => (f(x + h) - f(x)) / h))]; });
          bot.setView(null, span(q.map((p) => p[1]), 1, 0.2));
          bot.path(q, { color: key === 'smooth' ? 'green' : 'red', width: 2.4 });
          bot.dots(q, { color: key === 'smooth' ? 'green' : 'red', r: 2.6 });
          if (key === 'smooth') { const d = L2((x) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5); bot.hline(Math.log10(d), { color: 'green', width: 1.2, dash: [5, 4] }); }
          st = { key, n0: key==='step'?1:L2(f), nt: key==='step'?1:L2((x) => f(x + t)), last: 10 ** q[0][1] };
        });
        v.readout(() => `$\\|U_tf\\| = ${v.fix(st.nt, 4)} = \\|f\\| = ${v.fix(st.n0, 4)}$ (unitary). At $t=10^{-3}$: $\\|(U_tf-f)/t\\| = ${v.fix(st.last, 3)}$` + (st.key === 'smooth' ? ' — converging to $\\|Tf\\|=\\|f\'\\|$.' : ' — blowing up like $|t|^{-1/2}$: $f\\notin\\mathscr D(T)$.'));
      },
    },
    {
      num: '13.35',
      kind: 'Theorem',
      name: "Strongly continuous semigroups and their generators",
      statement: String.raw`For a semigroup Q(t) on a Banach space satisfying13.34, its generator A has dense domain and is closed. There are C≥1 and γ∈ℝ such that ‖Q(t)‖≤Ce^{γt}, and every orbit Q(t)x is norm-continuous. For x∈D(A), Q(t)x∈D(A) and $(d/dt)Q(t)x=AQ(t)x=Q(t)Ax$. With $A_\varepsilon=(Q(\varepsilon)-I)/\varepsilon$, one has $Q(t)x=\lim_{\varepsilon\downarrow0}e^{tA_\varepsilon}x$ for every x, uniformly on bounded time intervals. For Reλ>γ, $R(\lambda)x=\int_0^\infty e^{-\lambda t}Q(t)x\,dt$ is bounded, maps X onto D(A), and inverts λI−A; its norm is at most C/(Reλ−γ).`,
      idea: String.raw`Time averages of Q(t)x lie in D(A) and approximate x, proving density; their generator identity also proves closedness. Banach–Steinhaus gives a local operator bound, and the semigroup law extends it exponentially. For domain vectors, integrating a derivative bounds the difference between e^{tAε}x and Q(t)x; uniform bounds extend convergence to all x. Integration by parts identifies the Laplace transform as the resolvent.`,
      caption: String.raw`The heat semigroup on L²[0,π] has multipliers e⁻ᵏ²ᵗ. The orange curve is the source’s bounded difference-generator approximation exp(t Aε), with ε=1/n and multiplier exp(t(e⁻ᵏ²ᵋ−1)/ε). Increase n to decrease ε. Profiles and errors use the stated200-mode sine truncation; this finite computation illustrates strong convergence, not uniform operator-norm convergence.`,
      deps: ["fa-13.34", "fa-2.5", "fa-3.27"],
      tags: ['semigroups', 'Hille–Yosida', 'heat equation'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.35 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const tS = v.slider('$\\log_{10}t$', -3.5, 0, -1.5, { step: 0.01, fmt: (x) => `t = ${(10 ** x).toExponential(1)}` });
        const nS = v.slider('$n$ (ε = 1/n)', 1, 60, 3, { int: true });
        const top = v.stage({ x: [0, Math.PI], y: [-1.3, 1.3], height: 230, full: true, axes: true, title: '$f$, $Q(t)f$ and $e^{tA_\\varepsilon}f$' });
        const bot = v.stage({ x: [0, 60], y: [0, 1.05], height: 190, full: true, axes: 'box', xlabel: 'k', title: 'multipliers $e^{-k^2t}$ and $\\exp(tn(e^{-k^2/n}-1))$' });
        const K = 200;
        const f = (x) => { const s = Math.sin(5 * x) > 0 ? 1 : -1; return 0.9 * s * Math.min(1, x * 3, (Math.PI - x) * 3); };
        const c = (() => { const n = 8000; return M.range(K).map((i) => { const k = i + 1; let s = 0; for (let j = 0; j <= n; j++) { const x = Math.PI * j / n, w = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * Math.PI / (3 * n); s += w * f(x) * Math.sin(k * x); } return s * 2 / Math.PI; }); })();
        const synth = (mult) => (x) => c.reduce((s, ck, i) => s + ck * mult(i + 1) * Math.sin((i + 1) * x), 0);
        let st = {};
        v.legend([['muted', '$f$'], ['green', '$Q(t)f$'], ['orange', '$e^{tA_\\varepsilon}f$', { dash: true }]]);
        v.render(() => {
          const t = 10 ** tS.value, n = nS.value;
          const ex = (k) => Math.exp(-k * k * t), ap = (k) => heatDifferenceMultiplier(k,t,1/n);
          top.fn(f, { color: 'muted', width: 1.4, alpha: 0.7, n: 1200 });
          top.fn(synth(ex), { color: 'green', width: 2.6, n: 500 });
          top.fn(synth(ap), { color: 'orange', width: 2, dash: [6, 4], n: 500 });
          bot.path(M.range(60).map((i) => [i + 1, ex(i + 1)]), { color: 'green', width: 2.4 });
          bot.path(M.range(60).map((i) => [i + 1, ap(i + 1)]), { color: 'orange', width: 2, dash: [6, 4] });
          const err = Math.sqrt(c.reduce((s, ck, i) => s + (ck * (ex(i + 1) - ap(i + 1))) ** 2, 0) * Math.PI / 2);
          st = { err, t, n };
        });
        v.readout(() => `$t = ${v.sci(st.t, 2)}$: $\\|Q(t)f-e^{tA_\\varepsilon}f\\|_2 = ${v.sci(st.err, 2)}$ with $\\varepsilon=1/${st.n}$ — every multiplier lies in $[0,1]$, so all these operators are contractions.`);
      },
    },
  ],
};
