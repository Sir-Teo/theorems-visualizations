// Rudin, Functional Analysis — Chapter 9 (part 3): bounded functions annihilated by convolution
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

export default {
  book: 'fa',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.3
    {
      num: '9.3',
      kind: 'Theorem',
      name: 'Annihilated bounded functions: supp φ̂ ⊂ Z(Y)',
      statement: String.raw`Suppose $\varphi\in L^\infty(\R^n)$, $Y\subset L^1(\R^n)$, and $f*\varphi=0$ for every $f\in Y$. Then the Fourier transform $\hat\varphi$ of $\varphi$, a tempered distribution, has its support in
$$Z(Y)=\{t\in\R^n:\hat f(t)=0\text{ for every }f\in Y\}.$$
In particular, if $Z(Y)=\emptyset$, then $\varphi=0$. For $\varphi(x)=\sum_kc_ke^{i\omega_k\cdot x}$ (finitely many terms, $c_k\ne0$), $\operatorname{supp}\hat\varphi=\{\omega_k\}$, and this is exactly $Z(Y)$ for the largest such $Y$, namely $\{f:f*\varphi=0\}$.`,
      idea: String.raw`Fix $t_0\notin Z(Y)$ and pick $f\in Y$ with $\hat f(t_0)\ne0$. Lemma 9.2 and a Neumann series let one divide by $\hat f$ near $t_0$: every $\psi\in L^1$ whose transform is a test function supported in a small neighbourhood $V$ of $t_0$ factors as $\psi=f*u$ with $u\in L^1$. Then $\psi*\varphi=u*(f*\varphi)=0$, so $\hat\psi\hat\varphi=(\psi*\varphi)^\wedge=0$ (7.19) for all such $\psi$, which says that $\hat\varphi$ vanishes on $V$. Covering the complement of $Z(Y)$ by such $V$ gives $\operatorname{supp}\hat\varphi\subset Z(Y)$. If $Z(Y)$ is empty, then $\hat\varphi=0$ and $\varphi=0$, which is the step behind Wiener's theorem 9.4.`,
      caption: String.raw`$n=1$. Top: $\hat\varphi$ (gold) and $\hat f$ for an even kernel $f$ whose transform vanishes at $\pm z_1,\pm z_2,\pm z_3$ (blue, normalised; drag the red zeros). For **three tones** $\varphi=\sum a_k\cos\omega_kx$ (drag the gold points: position $\omega_k$, height $a_k$), $\operatorname{supp}\hat\varphi=\{\pm\omega_k\}$ and $f*\varphi=\sum a_k\hat f(\omega_k)\cos\omega_kx$ (bottom, blue). It vanishes only when $\hat f$ vanishes on all of $\operatorname{supp}\hat\varphi$ (try the button), so the common zeros of the annihilating $f$ contain the support, as the theorem says. For the **wave packet** $\varphi=a\,e^{-x^2/16}\cos\omega x$ (drag $\omega_1$), $\hat\varphi\ne0$ everywhere (it is a sum of two Gaussians): its support is all of $\R$, and no kernel can kill it.`,
      deps: ['fa-9.2', 'fa-7.15', 'fa-7.19'],
      tags: ['Wiener', 'spectrum', 'convolution'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('$\\varphi=$', [{ value: 'tones', label: 'three tones' }, { value: 'packet', label: 'wave packet' }], 'tones', { onChange: (m) => { W.forEach((h, k) => { h.visible = m === 'tones' || k === 0; }); snap.hidden = m !== 'tones'; } });
        const T = v.stage({ x: [0, 6], y: [-1.25, 1.35], height: 250, full: true, axes: true, xlabel: 't', title: 'frequency side: $\\hat\\varphi$ (gold), $\\hat f$ (blue), zeros of $\\hat f$ (red)' });
        const X = v.stage({ x: [-16, 16], y: [-2, 2], height: 230, full: true, axes: true, xlabel: 'x', title: '$\\varphi$ (gold) and $f*\\varphi$ (blue)' });
        const W = [[1.1, 0.8], [2.6, -0.6], [4.2, 0.5]].map(([w, a], k) => T.handle(w, a, { color: 'gold', r: 6, label: `ω${'₁₂₃'[k]}`, constrain: (x, y) => [M.clamp(x, 0.2, 5.8), M.clamp(y, -1, 1.2)] }));
        const Zs = [[1.1, 0], [3.2, 0], [5.0, 0]].map(([z], k) => T.handle(z, 0, { color: 'red', r: 5.5, label: `z${'₁₂₃'[k]}`, labelPos: 's', constrain: (x) => [M.clamp(x, 0.1, 5.9), 0] }));
        const snap = v.button('put the zeros of $\\hat f$ on $\\omega_1,\\omega_2,\\omega_3$', () => { Zs.forEach((z, k) => z.set(W[k].x, 0)); });
        const fhatRaw = (t) => Zs.reduce((p, z) => p * (t * t - z.x * z.x) / (1 + z.x * z.x), 1) * Math.exp(-t * t / 8);
        let st = {};
        v.legend([['gold', '$\\varphi$ and $\\hat\\varphi$'], ['blue', '$\\hat f$ (normalised) and $f*\\varphi$'], ['red', 'zeros of $\\hat f$']]);
        v.render(() => {
          const packet = mode.value === 'packet';
          const ts = M.linspace(0, 6, 601);
          let mx = 0; for (const t of ts) mx = Math.max(mx, Math.abs(fhatRaw(t)));
          const fhat = (t) => fhatRaw(t) / mx;
          T.hline(0, { color: 'muted', width: 1 });
          if (packet) {
            const w = W[0].x, a = W[0].y;
            const ph = (t) => a * (Math.exp(-4 * (t - w) ** 2) + Math.exp(-4 * (t + w) ** 2));  // φ̂/(2√π), peak ≈ a
            T.fn((t) => ph(t), { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.25 });
            T.fn(fhat, { color: 'blue', width: 2.4, n: 600 });
            T.fn((t) => fhat(t) * ph(t), { color: 'blue', width: 1.4, dash: [4, 3], fill: 'blue', fillAlpha: 0.12 });
            // f*φ = (1/2π)∫ f̂(t) φ̂(t) e^{itx} dt with φ̂(t) = 2√π·(e^{−4(t−ω)²}+e^{−4(t+ω)²}) for φ = e^{−x²/16}cos ωx
            const tt = M.linspace(-8, 8, 801), dt = tt[1] - tt[0];
            const FP = tt.map((t) => fhat(t) * 2 * Math.sqrt(Math.PI) * ph(t));
            const xs = M.linspace(-16, 16, 401);
            const conv = xs.map((x) => { let s = 0; for (let i = 0; i < tt.length; i++) s += FP[i] * Math.cos(tt[i] * x); return s * dt / (2 * Math.PI); });
            const phi = (x) => a * Math.exp(-x * x / 16) * Math.cos(w * x);
            X.fn(phi, { color: 'gold', width: 2, n: 900 });
            X.path(xs.map((x, i) => [x, conv[i]]), { color: 'blue', width: 2.4 });
            st = { packet, sup: Math.max(...conv.map(Math.abs)) };
          } else {
            const tones = W.map((h) => [h.x, h.y]);
            tones.forEach(([w, a]) => { T.line(w, 0, w, a, { color: 'gold', width: 4 }); });
            T.fn(fhat, { color: 'blue', width: 2.4, n: 600 });
            tones.forEach(([w]) => { const y = fhat(w); T.dot(w, y, { color: Math.abs(y) < 0.01 ? 'green' : 'blue', r: 4 }); });
            const phi = (x) => tones.reduce((s, [w, a]) => s + a * Math.cos(w * x), 0);
            const conv = (x) => tones.reduce((s, [w, a]) => s + a * fhat(w) * Math.cos(w * x), 0);
            X.fn(phi, { color: 'gold', width: 1.8, n: 1400 });
            X.fn(conv, { color: 'blue', width: 2.6, n: 1400 });
            const surv = tones.map(([w, a]) => a * fhat(w));
            st = { packet, surv, sup: surv.reduce((s, q) => s + Math.abs(q), 0) };
          }
          Zs.forEach((z) => { T.vline(z.x, { color: 'red', width: 1, alpha: 0.35, dash: [3, 3] }); });
        });
        v.readout(() => {
          const s = st;
          if (s.packet) return `$\\sup|f*\\varphi|=${v.fix(s.sup, 4)}$. However the zeros are placed, $\\hat f\\hat\\varphi\\ne0$: the wave packet's spectrum is all of $\\R$, and $Y_\\varphi=\\{0\\}$.`;
          const ok = s.surv.map((q) => Math.abs(q) < 0.005);
          const list = s.surv.map((q, k) => `$a_${k + 1}\\hat f(\\omega_${k + 1})=${v.fix(q, 3)}$`).join(', ');
          return list + '. ' + (ok.every(Boolean) ? '**$f*\\varphi=0$**: $f\\in Y_\\varphi$, and $\\hat f$ vanishes on the whole spectrum $\\{\\pm\\omega_k\\}$.' : `$f\\notin Y_\\varphi$: ${ok.filter((q) => !q).length} frequenc${ok.filter((q) => !q).length === 1 ? 'y survives' : 'ies survive'} the convolution.`);
        });
      },
    },
  ],
};
