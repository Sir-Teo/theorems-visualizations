// Waves & Optics — Chapter 4, part b (items 4.9–4.15): total internal reflection, the evanescent wave, Stokes relations,
// prisms and the rainbow, optical fibres, the phase flip on reflection, the Beer–Lambert law
import { TAU, deg, rad, fresnel, carg, cabs2, cdiv, nWater, nFlint, dropDeviation, refractVec, reflectVec, vdot } from './ch04.shared.js';

export default {
  collection: 'waves',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Total internal reflection',
      statement: String.raw`Light travelling from a medium of index $n_1$ toward a rarer medium $n_2<n_1$ is refracted away from the normal. When the angle of incidence reaches the **critical angle**
$$\theta_c=\arcsin\frac{n_2}{n_1},$$
the refracted ray grazes the surface ($\theta_2=90^\circ$), and for $\theta_1>\theta_c$ Snell’s law has no real solution: no power is transmitted and the reflectance is exactly $R_s=R_p=1$. For glass ($n=1.5$) in air $\theta_c\approx41.8^\circ$, for water $48.6^\circ$, for diamond ($n\approx2.42$) $\approx24.4^\circ$.`,
      idea: String.raw`Snell’s law (4.6) gives $\sin\theta_2=(n_1/n_2)\sin\theta_1$, which exceeds 1 beyond $\theta_c$, so $\cos\theta_2$ becomes imaginary. In the Fresnel equations (4.7) this makes $r_s$ and $r_p$ pure phases of modulus one: all the incident power comes back, and the second medium carries only a field that decays away from the surface (4.10). Total reflection is lossless, unlike a metal mirror, which is why prisms, fibres (4.13) and diamond’s fire depend on it.`,
      caption: String.raw`Left: the incident ray (blue) in the denser medium above, the reflected ray (red) and the refracted ray (green), whose widths follow the power in each. Raise $\theta_1$ and the green ray swings toward the surface, then vanishes at $\theta_c$ (dotted), leaving the reflected ray at full strength. Right: $R_s$ and $R_p$ against angle; both reach 1 exactly at $\theta_c$ and stay there. Presets give glass, water and diamond to air.`,
      deps: ['waves-4.6', 'waves-4.7'],
      refs: ['Hecht ch. 4'],
      tags: ['total internal reflection', 'critical angle'],
      credit: 'described by Kepler, 1611',
      verify: true,
      scope: String.raw`Plane wave, real indices with $n_1>n_2$, an interface that is flat over many wavelengths. Beyond the critical angle the reflected light is totally reflected only if nothing absorbs or scatters the evanescent field (4.10).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Total_internal_reflection' },
      viz(v) {
        const n1S = v.slider('$n_1$ (dense medium, above)', 1.05, 2.6, 1.5, { step: 0.01 });
        const n2S = v.slider('$n_2$ (rare medium, below)', 1, 2.5, 1, { step: 0.01 });
        const aS = v.slider('angle of incidence $\\theta_1$ (degrees)', 0, 89.5, 30, { step: 0.1 });
        v.button('glass → air', () => { n1S.set(1.5); n2S.set(1); });
        v.button('water → air', () => { n1S.set(1.333); n2S.set(1); });
        v.button('diamond → air', () => { n1S.set(2.42); n2S.set(1); });
        v.button('glass → water', () => { n1S.set(1.5); n2S.set(1.333); });
        v.button('go to critical angle', () => { if (n1S.value > n2S.value) aS.set(Math.round(deg(Math.asin(n2S.value / n1S.value)) * 10) / 10); });
        const B = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 330, weight: 1, minWidth: 280, title: 'the rays' });
        const A = v.stage({ x: [0, 90], y: [0, 1.04], axes: 'box', gutter: true, xlabel: 'angle of incidence θ₁ (degrees)', height: 330, weight: 1.3, minWidth: 300, title: 'reflectance' });
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = n2S.value, th = rad(aS.value);
          const F = (a) => fresnel(n1, n2, rad(a));
          const tc = n1 > n2 ? deg(Math.asin(n2 / n1)) : null;
          if (tc != null) A.vband(tc, 90, { color: 'green', alpha: 0.1 });
          A.fn((a) => F(a).Rs, { color: 'accent', width: 2.2, n: 400 });
          A.fn((a) => F(a).Rp, { color: 'purple', width: 2.2, n: 400 });
          if (tc != null) A.vline(tc, { color: 'green', width: 1.2, dash: [3, 4] });
          A.vline(aS.value, { color: 'gold', width: 1.5 });
          const f = F(aS.value), Rm = (f.Rs + f.Rp) / 2, Tm = (f.Ts + f.Tp) / 2;
          B.rect(-2.2, 0, 2.2, 1.9, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n1 - 1), stroke: false });
          B.rect(-2.2, -1.9, 2.2, 0, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n2 - 1), stroke: false });
          B.line(-2.2, 0, 2.2, 0, { color: 'ink', width: 1.4 });
          B.line(0, -1.7, 0, 1.7, { color: 'faint', width: 1, dash: [3, 4] });
          const si = Math.sin(th), ci = Math.cos(th), L = 1.7;
          B.arrow(-si * L, ci * L, 0, 0, { color: 'accent', width: 3.5, head: 10 });
          B.line(0, 0, si * L, ci * L, { color: 'red', width: 0.7 + 6 * Rm });
          if (!f.tir) { const t2 = Math.asin(f.sinT); B.line(0, 0, Math.sin(t2) * L, -Math.cos(t2) * L, { color: 'green', width: 0.7 + 6 * Tm }); }
          if (tc != null) B.line(0, 0, -Math.sin(rad(tc)) * L * 0.9, Math.cos(rad(tc)) * L * 0.9, { color: 'green', width: 1, dash: [2, 4] });
          st = { f, tc, n1, n2, t2: f.tir ? null : deg(Math.asin(f.sinT)), Rm };
        });
        v.legend([['accent', '$R_s$'], ['purple', '$R_p$'], ['green', 'total reflection region', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const crit = st.tc == null ? 'no critical angle ($n_1\\le n_2$)' : `$\\theta_c=\\arcsin(n_2/n_1)=${v.fix(st.tc, 2)}^\\circ$`;
          return `${crit} · at $\\theta_1=${v.fix(aS.value, 1)}^\\circ$: ${st.t2 == null ? 'no refracted ray, $R_s=R_p=' + v.fix(st.f.Rs, 6) + '$ (total internal reflection)' : 'refracted angle $\\theta_2=' + v.fix(st.t2, 2) + '^\\circ$, mean reflectance $' + v.fix(st.Rm, 4) + '$'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Evanescent waves and frustrated TIR',
      statement: String.raw`Beyond the critical angle the field does not stop at the interface: in the rarer medium it is an **evanescent wave**, travelling along the surface with wavenumber $k_x=n_1k_0\sin\theta_1$ and decaying away from it as $e^{-\kappa z}$ with
$$\kappa=k_0\sqrt{n_1^2\sin^2\theta_1-n_2^2},$$
so its intensity falls by $1/e$ in a distance $1/(2\kappa)$, a fraction of a wavelength. It carries no net power across the interface. If a second dense medium is brought within this distance, the field there is not zero and **light tunnels across the gap** (frustrated total internal reflection). For a gap $d$ of vacuum between two identical media and s polarization, the transmitted power fraction is
$$T=\left[1+\left(\frac{k_z^2+\kappa^2}{2k_z\kappa}\right)^{2}\sinh^2(\kappa d)\right]^{-1},\qquad k_z=n_1k_0\cos\theta_1,\ \kappa=k_0\sqrt{n_1^2\sin^2\theta_1-1},$$
which decays as $e^{-2\kappa d}$ for $\kappa d\gg1$.`,
      idea: String.raw`The boundary conditions of 4.7 still hold past $\theta_c$, but $k_z$ in the rare medium, $\sqrt{n_2^2k_0^2-k_x^2}$, is imaginary: the phase is matched along the surface (so Snell's law holds in the form $k_x$ conserved), and the only decaying solution of the wave equation is $e^{-\kappa z}$. Because the decaying field is not zero, a second interface can couple it to a propagating wave; matching the fields at both gap faces (a short calculation with exponentials, the optical twin of quantum tunnelling through a barrier) gives the formula above. Newton saw light cross a small gap between two prisms; the same decay underlies near-field microscopy and the dependence of the penetration on angle in TIRF imaging.`,
      caption: String.raw`The map shows the real electric field of an s-polarized plane wave coming up from the lower prism at an angle beyond the critical angle (red and blue are opposite signs; the wave is drawn at a moving phase). In the gap the field fades exponentially; with a second prism beyond the gap a faint transmitted wave appears. Raise $\theta_1$ or the gap $d$ and the transmission (lower graph, log scale, with the exponential asymptote dashed) falls. At $d=0$ the prisms are one piece of glass: $T=1$. The readout checks that reflected plus transmitted power is 1 for each setting.`,
      deps: ['waves-4.9', 'waves-3.11'],
      refs: ['Hecht ch. 4'],
      tags: ['evanescent wave', 'tunnelling'],
      credit: 'observed by Newton (Opticks, 1704)',
      verify: true,
      scope: String.raw`Plane wave, lossless media, s polarization (p is similar with different numerical factors). Valid for angles beyond the critical angle; below it the gap acts as a thin film (6.5). A finite beam adds a lateral shift (Goos–Hänchen) not drawn here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Evanescent_field' },
      viz(v) {
        const n1S = v.slider('index of the prisms $n_1$', 1.3, 2.2, 1.5, { step: 0.01 });
        const xS = v.slider('angle above the critical angle (degrees)', 0.3, 40, 4, { step: 0.1 });
        const dS = v.slider('gap $d$ (vacuum wavelengths $\\lambda_0$)', 0, 2, 0.35, { step: 0.01 });
        const F = v.stage({ x: [-2.5, 2.5], y: [-1.8, 3.4], equal: true, axes: false, height: 400, weight: 1.2, minWidth: 320, title: 'real field of the s wave' });
        const G = v.stage({ x: [0, 2], y: [1e-4, 1.5], ylog: true, axes: 'box', gutter: true, xlabel: 'gap d (λ₀)', ylabel: 'transmitted power', height: 400, weight: 1, minWidth: 280, title: 'frustrated total internal reflection' });
        let st = null;
        const calc = (n1, thc, d, extra) => {
          const th = Math.min(rad(89.8), rad(thc + extra)), k0 = TAU;
          const kz = k0 * n1 * Math.cos(th), kap = k0 * Math.sqrt(n1 * n1 * Math.sin(th) ** 2 - 1), kx = k0 * n1 * Math.sin(th);
          const q = (kz * kz - kap * kap) / (2 * kz * kap), ch = Math.cosh(kap * d), sh = Math.sinh(kap * d);
          const t = cdiv([1, 0], [ch, -q * sh]);
          const a = [0.5 * t[0] + 0.5 * (kz / kap) * t[1], 0.5 * t[1] - 0.5 * (kz / kap) * t[0]]; // t(1 - i kz/kap)/2
          const b = [0.5 * t[0] - 0.5 * (kz / kap) * t[1], 0.5 * t[1] + 0.5 * (kz / kap) * t[0]]; // t(1 + i kz/kap)/2
          const A = [a[0] * Math.exp(kap * d), a[1] * Math.exp(kap * d)], B = [b[0] * Math.exp(-kap * d), b[1] * Math.exp(-kap * d)];
          const r = [A[0] + B[0] - 1, A[1] + B[1]];
          const T = cabs2(t), c = (kz * kz + kap * kap) / (2 * kz * kap);
          return { th, kz, kap, kx, t, A, B, r, T, R: cabs2(r), c };
        };
        v.animate((tm) => {
          const n1 = n1S.value, thc = deg(Math.asin(1 / n1)), d = dS.value, S = calc(n1, thc, d, xS.value);
          const ph = -TAU * ((tm % 4) / 4), cph = [Math.cos(ph), Math.sin(ph)];
          const Ez = (z) => { // complex amplitude E(z)
            if (z < 0) { const c1 = [Math.cos(S.kz * z), Math.sin(S.kz * z)], c2 = [Math.cos(S.kz * z), -Math.sin(S.kz * z)]; const rc = [S.r[0] * c2[0] - S.r[1] * c2[1], S.r[0] * c2[1] + S.r[1] * c2[0]]; return [c1[0] + rc[0], c1[1] + rc[1]]; }
            if (z <= d) { const e1 = Math.exp(-S.kap * z), e2 = Math.exp(S.kap * z); return [S.A[0] * e1 + S.B[0] * e2, S.A[1] * e1 + S.B[1] * e2]; }
            const c1 = [Math.cos(S.kz * (z - d)), Math.sin(S.kz * (z - d))]; return [S.t[0] * c1[0] - S.t[1] * c1[1], S.t[0] * c1[1] + S.t[1] * c1[0]];
          };
          // field map: z vertical, x horizontal; region z<0 is below the y = 0 line (lower prism)
          const key = `${n1}|${xS.value}|${d}|${(tm % 4).toFixed(2)}`;
          F.raster((x, y) => {
            const E = Ez(y); // y is z itself: the lower prism is y < 0
            ;const _ = 0, px = [Math.cos(S.kx * x), Math.sin(S.kx * x)];
            const re = (E[0] * px[0] - E[1] * px[1]) * cph[0] - (E[0] * px[1] + E[1] * px[0]) * cph[1];
            return v.diverge(Math.max(-1, Math.min(1, re / 1.9)));
          }, { res: 3, key });
          F.line(-2.5, 0, 2.5, 0, { color: 'ink', width: 1.2 });
          F.line(-2.5, d, 2.5, d, { color: 'ink', width: 1.2 });
          F.text('lower prism', -2.35, -1.5, { size: 12, color: 'ink', align: 'left', plate: true });
          F.text('gap', -2.35, d / 2, { size: 12, color: 'ink', align: 'left', plate: true });
          F.text('upper prism', -2.35, d + 0.4, { size: 12, color: 'ink', align: 'left', plate: true });
          const asym = (x) => { const s = calc(n1, thc, x, xS.value); return (4 / (s.c * s.c)) * Math.exp(-2 * s.kap * x); };
          G.fn((x) => calc(n1, thc, x, xS.value).T, { color: 'accent', width: 2.4, n: 160 });
          G.fn(asym, { color: 'orange', width: 1.5, dash: [5, 4], n: 120 });
          G.vline(d, { color: 'gold', width: 1.5 });
          G.dot(d, Math.max(S.T, 1e-4), { r: 5, color: 'gold' });
          st = { S, thc, d, th: deg(S.th) };
        }, { period: 4, still: 0.6 });
        v.readout(() => st ? `$\\theta_c=${v.fix(st.thc, 2)}^\\circ$, $\\theta_1=${v.fix(st.th, 2)}^\\circ$ · $\\kappa=${v.fix(st.S.kap / TAU, 3)}\\,k_0$: field amplitude $\\propto e^{-\\kappa z}$ with $1/\\kappa=${v.fix(1 / st.S.kap, 3)}\\,\\lambda_0$, intensity falls by $1/e$ in $1/(2\\kappa)=${v.fix(1 / (2 * st.S.kap), 3)}\\,\\lambda_0$ · at $d=${v.fix(st.d, 2)}\\,\\lambda_0$: $T=${v.sci(st.S.T, 3)}$, $R=|r|^2=${v.fix(st.S.R, 6)}$, $R+T=${v.fix(st.S.R + st.S.T, 6)}$` : '');
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Stokes relations',
      statement: String.raw`Let $r,t$ be the amplitude reflection and transmission coefficients for a wave going from medium 1 to medium 2 and $r',t'$ those for the **reversed** wave coming from medium 2 along the refracted ray (same polarization). If neither medium absorbs light, then
$$r'=-r,\qquad tt'=1-r^2 \;(=1-R).$$
The reflection for the reversed incidence therefore has the opposite sign, and $T=tt'$ for the transmitted power fraction.`,
      idea: String.raw`Maxwell's equations are invariant under time reversal when there is no absorption (the reversed solution is also a solution). Run the experiment backwards: the reflected ray (amplitude $r$) and the transmitted ray (amplitude $t$) now arrive together and must combine into a single ray of amplitude 1 along the original incident direction and nothing along the other. The first ray contributes $r\cdot r+t\cdot t'$ to the outgoing wave, which must be 1; the other direction receives $r\cdot t+t\cdot r'$, which must vanish. Those two conditions are exactly the two relations. Stokes (1849) used them to show that the centre of Newton's rings is dark (6.7). The Fresnel coefficients of 4.7 satisfy them for both polarizations, which is a good numerical check.`,
      caption: String.raw`Left: the forward experiment (amplitude 1 in, $r$ and $t$ out), then the reversed pair: two incoming rays $r$ and $t$ produce outgoing amplitudes $r^2+tt'$ (back along the original ray) and $rt+tr'$ (along the other). Set the indices, angle and polarization: the numbers on the rays are computed from the Fresnel equations for both directions. Right: $r_s(\theta)$ and $-r'_s$ at the matching angle coincide, and $r^2$ plus $tt'$ stays at 1.`,
      deps: ['waves-4.7'],
      refs: ['Hecht ch. 4'],
      tags: ['Stokes', 'time reversal'],
      credit: 'Stokes, 1849',
      verify: true,
      scope: String.raw`Lossless, non-absorbing interface and angles below the critical angle (beyond it, the relations hold with complex $t$ but the coefficients are not real). The relation with $r'=-r$ uses the amplitude conventions of 4.7; with a different sign convention for $r_p$ the sign of $r'$ changes accordingly.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fresnel_equations#Stokes_relations' },
      viz(v) {
        const n1S = v.slider('$n_1$', 1, 2.5, 1, { step: 0.01 });
        const n2S = v.slider('$n_2$', 1, 2.5, 1.5, { step: 0.01 });
        const aS = v.slider('angle of incidence $\\theta_1$ (degrees)', 0, 88, 50, { step: 0.5 });
        const pol = v.select('polarization', [{ value: 's', label: 's' }, { value: 'p', label: 'p' }], 's');
        const P1 = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: 'forward experiment' });
        const P2 = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: 'time-reversed pair' });
        const P3 = v.stage({ x: [0, 88], y: [-1, 1.1], axes: 'box', gutter: true, xlabel: 'θ₁ (degrees)', height: 300, weight: 1, minWidth: 260, title: 'the two relations' });
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = n2S.value, th = rad(aS.value);
          const key = pol.value === 's' ? 'rs' : 'rp', tk = pol.value === 's' ? 'ts' : 'tp';
          const crit = n1 > n2 ? Math.asin(n2 / n1) : Math.PI / 2;
          const ok = th < crit - 1e-6;
          const info = (a) => {
            const f = fresnel(n1, n2, a), t2 = Math.asin(Math.min(1, f.sinT)), g = fresnel(n2, n1, t2);
            return { r: f[key][0], t: f[tk][0], rp: g[key][0], tp: g[tk][0], t2 };
          };
          const draw = (P, rev) => {
            P.rect(-2, -1.7, 2, 0, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n2 - 1), stroke: false });
            P.rect(-2, 0, 2, 1.7, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n1 - 1), stroke: false });
            P.line(-2, 0, 2, 0, { color: 'ink', width: 1.3 });
          };
          draw(P1); draw(P2);
          if (ok) {
            const I = info(th), si = Math.sin(th), ci = Math.cos(th), s2 = Math.sin(I.t2), c2 = Math.cos(I.t2), L = 1.5;
            const lw = (a) => 1 + 5 * Math.abs(a);
            P1.arrow(-si * L, ci * L, 0, 0, { color: 'accent', width: 4, head: 10 });
            P1.line(0, 0, si * L, ci * L, { color: 'red', width: lw(I.r) });
            P1.line(0, 0, s2 * L, -c2 * L, { color: 'green', width: lw(I.t) });
            P1.tex('1', -si * L * 0.5 - 0.25, ci * L * 0.5 + 0.25, { size: 14, color: 'accent' });
            P1.tex(`r=${v.fix(I.r, 3)}`, 1.2, 1.45, { size: 13, color: 'red', align: 'left' });
            P1.tex(`t=${v.fix(I.t, 3)}`, 0.5, -1.55, { size: 13, color: 'green', align: 'left' });
            // reversed: rays r (along the reflected ray reversed) and t (along refracted reversed) arrive; outgoing: back along incident ray, and along the reflected-ray side with r' etc.
            P2.arrow(si * L, ci * L, 0, 0, { color: 'red', width: lw(I.r), head: 9 });
            P2.arrow(s2 * L, -c2 * L, 0, 0, { color: 'green', width: lw(I.t), head: 9 });
            const out1 = I.r * I.r + I.t * I.tp, out2 = I.r * I.t + I.t * I.rp;
            P2.line(0, 0, -si * L, ci * L, { color: 'accent', width: lw(out1) });
            P2.tex(`r^2+tt'=${v.fix(out1, 3)}`, -1.9, 1.5, { size: 13, color: 'accent', align: 'left' });
            P2.tex(`rt+tr'=${v.fix(out2, 3)}`, 0.3, 1.5, { size: 13, color: 'muted', align: 'left' });
            P2.tex(`r'=${v.fix(I.rp, 3)}`, -1.9, -1.3, { size: 13, color: 'orange', align: 'left' });
            st = { ...I, out1, out2, ok };
          } else st = { ok };
          P3.fn((a) => { if (a >= deg(crit)) return NaN; return info(rad(a)).r; }, { color: 'accent', width: 2.2, n: 300 });
          P3.fn((a) => { if (a >= deg(crit)) return NaN; const I = info(rad(a)); return -I.rp; }, { color: 'orange', width: 2, dash: [6, 4], n: 300 });
          P3.fn((a) => { if (a >= deg(crit)) return NaN; const I = info(rad(a)); return I.r * I.r + I.t * I.tp; }, { color: 'green', width: 1.6, n: 300 });
          P3.fn((a) => { if (a >= deg(crit)) return NaN; const I = info(rad(a)); return I.t * I.tp; }, { color: 'purple', width: 1.4, dash: [3, 3], n: 300 });
          P3.vline(aS.value, { color: 'gold', width: 1.4 });
        });
        v.legend([['accent', '$r(\\theta_1)$'], ['orange', '$-r\'$ at the refraction angle', { dash: true }], ['green', '$r^2+tt\'$'], ['purple', '$tt\'$', { dash: true }]]);
        v.readout(() => st && st.ok ? `$r=${v.fix(st.r, 5)}$, $r'=${v.fix(st.rp, 5)}$, so $r+r'=${v.fix(st.r + st.rp, 6)}$ · $tt'=${v.fix(st.t * st.tp, 5)}$ and $1-r^2=${v.fix(1 - st.r * st.r, 5)}$` : 'beyond the critical angle: no real refracted ray, move the angle down');
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Prisms and the rainbow',
      statement: String.raw`Because the index of a transparent material depends on wavelength (normal dispersion: $n$ is larger for blue than for red), refraction separates colours. A prism of apex angle $A$ deviates a ray by $D=\theta_1+\theta_4-A$, with a minimum $D_{\min}$ when the ray passes symmetrically, where
$$n=\frac{\sin\frac{A+D_{\min}}2}{\sin\frac A2}.$$
In a spherical raindrop, a ray with impact parameter $b=\sin i$ and $k$ internal reflections is turned through $D=k\pi+2i-2(k+1)r$ with $\sin i=n\sin r$; this has a **minimum** at $\cos^2 i=(n^2-1)/(k(k+2))$, so rays crowd into directions near $D_{\min}$ and a bright bow appears at angle $180^\circ-D_{\min}$ from the antisolar point for $k=1$ (about $42^\circ$ for red) and $D_{\min}-180^\circ$ for $k=2$ (about $51^\circ$), with the colours in reverse order.`,
      idea: String.raw`Snell's law (4.6) applied at each surface with a wavelength-dependent $n$ (3.3, em-11.13) gives the deviation of each colour. For the drop, the deviation as a function of $b$ is stationary at its minimum, so many neighbouring rays leave in nearly the same direction and their combined intensity peaks there (Descartes, 1637). Since $D_{\min}$ depends on $n$, the colours land at slightly different angles: red outermost in the primary bow, innermost in the secondary. The region between the bows is darker (Alexander's band). Rays leaving beyond the minimum angle do not exist, which is the sharp inner edge of the bright arc. This geometric picture omits the Airy interference that produces the faint supernumerary bows.`,
      caption: String.raw`Choose the drop or the prism. Drop: the slider sets the impact height $b$ (gold in the graph); the ray is traced through one or two internal reflections for the colour you pick (or all three); the right graph shows $D(b)$ with its minimum (dot). The faint bundle shows how rays crowd where the curve is flat. Prism: set the apex angle and the incidence angle; three colours leave at different angles, and the right graph shows the deviation for each against $\theta_1$, with the minimum marked. Colours use a model index (water: Cauchy fit through $n(656)$ and $n(486)$; prism glass: $n=1.6+0.012/\lambda^2$ with $\lambda$ in µm).`,
      deps: ['waves-4.6', 'em-11.13'],
      refs: ['Hecht ch. 5'],
      tags: ['dispersion', 'rainbow', 'prism'],
      credit: 'Theodoric of Freiberg, c. 1304–10; Descartes, 1637; Newton, 1666–1704',
      verify: true,
      scope: String.raw`Geometric optics of one spherical drop of radius much larger than the wavelength (drops of about 0.5 mm or more); fine structure (supernumerary bows, polarization of the bow, small-drop bows) needs wave optics. The water and glass indices are model values accurate to roughly $10^{-3}$, not catalogue data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rainbow' },
      viz(v) {
        const M = v.M;
        const mode = v.select('geometry', [{ value: 'drop', label: 'raindrop' }, { value: 'prism', label: 'prism' }], 'drop');
        const ord = v.select('bow', [{ value: 1, label: 'primary (1 reflection)' }, { value: 2, label: 'secondary (2 reflections)' }], 1);
        const col = v.select('colour', [{ value: 'all', label: 'red, green, violet' }, { value: 656, label: 'red' }, { value: 550, label: 'green' }, { value: 405, label: 'violet' }], 'all');
        const bS = v.slider('impact height $b$', 0.02, 0.995, 0.8, { step: 0.001 });
        const AS = v.slider('prism apex angle $A$ (degrees)', 30, 75, 60, { step: 1 });
        const iS = v.slider('angle of incidence $\\theta_1$ (degrees)', 25, 80, 55, { step: 0.5 });
        const G = v.stage({ x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, axes: false, height: 360, weight: 1.15, minWidth: 300, title: 'rays' });
        const D = v.stage({ x: [0, 1], y: [130, 190], axes: 'box', gutter: true, xlabel: 'impact height b', ylabel: 'deviation D (degrees)', height: 360, weight: 1, minWidth: 280, title: 'deviation' });
        const cols = { 656: 'red', 550: 'green', 405: 'purple' };
        let st = null;
        const prismDev = (A, t1, n) => { const t2 = Math.asin(Math.sin(t1) / n), t3 = A - t2, s4 = n * Math.sin(t3); if (s4 > 1 || t3 < 0) return NaN; return t1 + Math.asin(s4) - A; };
        const trace = (b, n, k) => { // returns polyline points of the ray through the drop and the final direction
          let P = [-Math.sqrt(1 - b * b), b], d = [1, 0];
          const pts = [[-3, b], P.slice()];
          d = refractVec(d, P, 1 / n);
          for (let j = 0; j < k + 1; j++) {
            const s = -2 * vdot(P, d), Q = [P[0] + s * d[0], P[1] + s * d[1]];
            pts.push(Q.slice());
            if (j < k) { d = reflectVec(d, Q); P = Q; } else { const dd = refractVec(d, [-Q[0], -Q[1]], n); d = dd; P = Q; }
          }
          pts.push([P[0] + 3.2 * d[0], P[1] + 3.2 * d[1]]);
          return { pts, d };
        };
        v.render(() => {
          const isDrop = mode.value === 'drop', k = Number(ord.value);
          ord.el.hidden = !isDrop; bS.el.hidden = !isDrop; AS.el.hidden = isDrop; iS.el.hidden = isDrop;
          const cs = col.value === 'all' ? [656, 550, 405] : [Number(col.value)];
          if (isDrop) {
            G.setView([-2.4, 2.4], [-1.6, 1.6]); D.setView([0, 1], k === 1 ? [130, 190] : [225, 365]);
            D.setLabels('impact height b', 'deviation D (degrees)');
            G.circle(0, 0, 1, { color: 'ink', fill: 'blue', fillAlpha: 0.1, width: 1.6 });
            for (let j = 0; j < 36; j++) { const b = 0.03 + (0.96 * j) / 35; const T = trace(b, nWater(550), k); G.path(T.pts, { color: 'muted', width: 0.8, alpha: 0.3 }); }
            const mins = [];
            for (const nm of cs) {
              const n = nWater(nm), T = trace(bS.value, n, k), c = cols[nm];
              G.path(T.pts, { color: c, width: 2.2 });
              D.fn((b) => deg(dropDeviation(b, n, k)), { color: c, width: 2, domain: [0.001, 0.999], n: 300 });
              // minimum by analytic formula
              const imin = Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2)))), bm = Math.sin(imin), Dm = deg(dropDeviation(bm, n, k));
              D.dot(bm, Dm, { r: 4, color: c });
              mins.push({ nm, n, bm, Dm, bow: k === 1 ? 180 - Dm : Dm - 180, Dnow: deg(dropDeviation(bS.value, n, k)), Dtr: Math.abs(deg(Math.atan2(T.d[1], T.d[0]))) });
              if (cs.length === 1) { D.vline(bS.value, { color: 'gold', width: 1.4 }); D.dot(bS.value, deg(dropDeviation(bS.value, n, k)), { r: 5, color: 'gold' }); }
            }
            if (cs.length > 1) D.vline(bS.value, { color: 'gold', width: 1.4 });
            st = { drop: true, mins, k };
          } else {
            G.setView([-4, 4], [-1.4, 3.6]); D.setView([25, 80], [30, 80]);
            D.setLabels('angle of incidence θ₁ (degrees)', 'deviation D (degrees)');
            const A = rad(AS.value), h = 2.6, w = h * Math.tan(A / 2);
            G.poly([[0, h], [-w, 0], [w, 0]], { color: 'ink', fill: 'blue', fillAlpha: 0.1, width: 1.6 });
            const nL = [-Math.cos(A / 2), Math.sin(A / 2)], nR = [Math.cos(A / 2), Math.sin(A / 2)];
            const Mx = [-0.5 * w, 0.5 * h];
            const res = [];
            for (const nm of [656, 550, 405]) {
              const n = nFlint(nm), t1 = rad(iS.value), c = cols[nm];
              const inward = [-nL[0], -nL[1]], ca = Math.cos(t1), sa = Math.sin(t1);
              const d0 = [inward[0] * ca - inward[1] * sa, inward[0] * sa + inward[1] * ca];
              const d1 = refractVec(d0, nL, 1 / n);
              if (!d1) continue;
              const s = (nR[0] * (0 - Mx[0]) + nR[1] * (h - Mx[1])) / (nR[0] * d1[0] + nR[1] * d1[1]);
              const X = [Mx[0] + s * d1[0], Mx[1] + s * d1[1]];
              const d2 = refractVec(d1, [-nR[0], -nR[1]], n);
              G.path([[Mx[0] - 3 * d0[0], Mx[1] - 3 * d0[1]], Mx, X], { color: col.value === 'all' || Number(col.value) === nm ? c : 'faint', width: 2 });
              if (d2) G.path([X, [X[0] + 4.5 * d2[0], X[1] + 4.5 * d2[1]]], { color: c, width: 2 });
              else G.dot(X[0], X[1], { r: 4, color: 'red', hollow: true });
              const Dm = deg(prismDev(A, t1, n));
              D.fn((a) => deg(prismDev(A, rad(a), n)), { color: c, width: 2, n: 300 });
              // minimum: symmetric ray, sin((A+D)/2) = n sin(A/2)
              const arg = n * Math.sin(A / 2);
              if (arg <= 1) { const Dmin = 2 * Math.asin(arg) - A, tmin = (A + Dmin) / 2; D.dot(deg(tmin), deg(Dmin), { r: 4, color: c }); res.push({ nm, n, Dm, Dmin: deg(Dmin), check: Math.sin((A + Dmin) / 2) / Math.sin(A / 2) }); }
              else res.push({ nm, n, Dm, Dmin: NaN });
            }
            D.vline(iS.value, { color: 'gold', width: 1.4 });
            st = { drop: false, res };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.drop) return st.mins.map((m) => `$\\lambda=${m.nm}$ nm, $n=${v.fix(m.n, 4)}$: $D_{\\min}=${v.fix(m.Dm, 2)}^\\circ$ at $b=${v.fix(m.bm, 3)}$, so the ${st.k === 1 ? 'primary' : 'secondary'} bow is at $${v.fix(m.bow, 2)}^\\circ$ from the antisolar point; the traced ray at the handle: $D=${v.fix(m.Dnow, 2)}^\\circ$ (formula), angle of the traced exit ray $${v.fix(m.Dtr, 2)}^\\circ$ from the forward axis (equals $D$ or $360^\\circ-D$)`).join('\n');
          return st.res.map((m) => `$\\lambda=${m.nm}$ nm, $n=${v.fix(m.n, 4)}$: $D=${v.fix(m.Dm, 2)}^\\circ$ now; $D_{\\min}=${v.fix(m.Dmin, 2)}^\\circ$ and $\\sin\\frac{A+D_{\\min}}2/\\sin\\frac A2=${v.fix(m.check, 4)}=n$`).join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Model',
      name: 'Optical fibres',
      statement: String.raw`A **step-index fibre** is a glass core (index $n_1$) inside a cladding of slightly lower index $n_2$. A ray in the core at angle $\alpha$ to the axis meets the wall at incidence angle $90^\circ-\alpha$ and is trapped by total internal reflection (4.9) provided $\alpha\le\alpha_{\max}=\arccos(n_2/n_1)$. A ray entering from air at angle $\theta_0$ is guided when $\sin\theta_0\le \mathrm{NA}=\sqrt{n_1^2-n_2^2}$, the **numerical aperture**. Different trapped rays travel different path lengths, so over a length $L$ a short pulse is spread (**modal dispersion**) by at most
$$\Delta t=\frac{Ln_1}{c}\left(\frac{n_1}{n_2}-1\right),$$
the delay of the steepest guided ray relative to the axial ray; this limits the bit rate of a multimode fibre.`,
      idea: String.raw`The condition for trapping is the critical angle of 4.9 at the core–cladding interface. The axial ray takes time $n_1L/c$; a ray at angle $\alpha$ travels $L/\cos\alpha$ at speed $c/n_1$, so its delay is $(n_1L/c)(1/\cos\alpha-1)$, which is largest at $\alpha_{\max}$, where $\cos\alpha_{\max}=n_2/n_1$. Narrowing the core until only one mode is guided (a single-mode fibre, which needs wave optics) removes modal dispersion; the remaining pulse broadening comes from the frequency dependence of the index (3.4–3.6). Kao and Hockham (1966) argued that losses in glass could be cut to a few tens of dB/km, which opened the way to fibre communications.`,
      caption: String.raw`Top: rays launched into a fibre at the angle you set. Green rays are trapped by total internal reflection; red ones leak into the cladding after the first bounce, and the faint bundle shows which launch angles are accepted (the cone of half-angle $\arcsin\mathrm{NA}$). Bottom: a short input pulse (dashed) and the pulse that arrives after length $L$, built from rays spread evenly over the launch cone you choose; accepted rays are delayed by $(n_1L/c)(1/\cos\alpha-1)$. The readout compares the measured spread with the formula.`,
      deps: ['waves-4.9', 'waves-3.4'],
      refs: ['Hecht ch. 5'],
      tags: ['optical fibre', 'modal dispersion'],
      credit: 'Colladon and Babinet, 1841–42 (light guiding); Kao and Hockham, 1966',
      verify: true,
      scope: String.raw`Ray model of a step-index multimode fibre: core diameter much larger than the wavelength; meridional rays only (skew rays travel further and are also guided); material dispersion, bends and attenuation are ignored. The numbers $n_1=1.48$, $n_2\approx1.46$ are typical, not those of a particular product.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Optical_fiber' },
      viz(v) {
        const C0 = v.M.CONST.c;
        const n1S = v.slider('core index $n_1$', 1.4, 1.7, 1.48, { step: 0.001 });
        const n2S = v.slider('cladding index $n_2$', 1.3, 1.69, 1.46, { step: 0.001 });
        const aS = v.slider('launch angle $\\theta_0$ in air (degrees)', 0, 40, 9, { step: 0.1 });
        const cS = v.slider('launch cone half-angle (degrees)', 1, 40, 20, { step: 0.5 });
        const LS = v.slider('fibre length $L$ (km)', 0.1, 20, 1, { log: true, sig: 2 });
        const wS = v.slider('input pulse width (ns)', 0.2, 20, 1, { log: true, sig: 2 });
        const F = v.stage({ x: [0, 16], y: [-2.2, 2.2], axes: false, height: 250, full: true, title: 'rays in a step-index fibre (the vertical scale is stretched)' });
        const T = v.stage({ x: [-5, 80], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'time after the axial ray (ns)', yticks: [], height: 240, full: true, title: 'a short pulse after length L' });
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = Math.min(n2S.value, n1 - 0.002), L = LS.value, sg = wS.value / 2.355;
          const NA = Math.sqrt(n1 * n1 - n2 * n2), accept = Math.asin(Math.min(1, NA)), amax = Math.acos(n2 / n1);
          F.rect(0, 1, 16, 2.2, { fill: 'orange', fillAlpha: 0.12, stroke: false }); F.rect(0, -2.2, 16, -1, { fill: 'orange', fillAlpha: 0.12, stroke: false });
          F.rect(0, -1, 16, 1, { fill: 'blue', fillAlpha: 0.1, stroke: false });
          F.line(0, 1, 16, 1, { color: 'ink', width: 1.2 }); F.line(0, -1, 16, -1, { color: 'ink', width: 1.2 });
          F.text('core $n_1$', 14.2, 0.0, { size: 12, color: 'ink', plate: true });
          F.text('cladding $n_2$', 14.2, 1.6, { size: 12, color: 'ink', plate: true });
          const rayPts = (th0deg, y0) => {
            const s0 = Math.sin(rad(th0deg)) / n1;
            if (Math.abs(s0) >= 1) return { pts: [[0, y0]], bound: false };
            const al = Math.asin(s0), slope = Math.abs(Math.tan(al)) * 0.55, bound = Math.abs(al) <= amax + 1e-12;
            const pts = [[0, y0]]; let x = 0, y = y0, dir = Math.sign(al) || 1; // stretched vertical scale
            let leak = null;
            while (x < 16) {
              const yw = dir > 0 ? 1 : -1, dx = (yw - y) / (slope * dir || 1e-9);
              if (x + dx >= 16) { pts.push([16, y + slope * dir * (16 - x)]); break; }
              x += dx; y = yw; pts.push([x, y]);
              if (!bound) { leak = [x, y, dir]; break; }
              dir = -dir;
            }
            return { pts, bound, leak };
          };
          for (let a = -accept * 1.5; a <= accept * 1.5 + 1e-9; a += (accept * 3) / 10) {
            const R = rayPts(deg(a) , 0); F.path(R.pts, { color: R.bound ? 'green' : 'red', width: 0.9, alpha: 0.28 });
          }
          const Rm = rayPts(aS.value, 0);
          F.path(Rm.pts, { color: Rm.bound ? 'green' : 'red', width: 2.6 });
          if (Rm.leak) { const [lx, ly, dr] = Rm.leak; F.line(lx, ly, Math.min(16, lx + 4), ly + dr * 1.0, { color: 'red', width: 2, dash: [5, 4] }); }
          // pulse: rays evenly spaced in launch angle over the cone
          const cone = cS.value, N = 600, t0 = (L * 1000 * n1) / C0 * 1e9; // ns
          const delays = [];
          for (let i = 0; i < N; i++) {
            const th0 = rad(cone) * (i + 0.5) / N, s = Math.sin(th0) / n1, al = Math.asin(s);
            if (al <= amax) delays.push(t0 * (1 / Math.cos(al) - 1));
          }
          const tmax = (L * 1000 * n1 / C0) * 1e9 * (n1 / n2 - 1);
          const xr = Math.max(8 * sg + 4, 1.35 * tmax + 5 * sg + 2);
          T.setView([-3 * sg - 0.04 * xr, xr], [0, 1.15]);
          const g = (x, m) => Math.exp(-0.5 * ((x - m) / sg) ** 2);
          let peak = 1e-9; const out = (x) => { let sum = 0; for (let i = 0; i < delays.length; i += 4) sum += g(x, delays[i]); return sum / Math.max(1, delays.length / 4); };
          for (let i = 0; i < 200; i++) peak = Math.max(peak, out(-3 * sg + ((xr + 3 * sg) * i) / 199));
          T.fn((x) => g(x, 0), { color: 'muted', width: 1.4, dash: [5, 4], n: 400 });
          T.fn((x) => out(x) / peak * 0.95, { color: 'accent', width: 2.4, n: 400, fill: true });
          const dm = delays.length ? Math.max(...delays) : 0;
          st = { NA, accept: deg(accept), amax: deg(amax), tmax, dm, acc: delays.length / N, Rm, cone };
        });
        v.legend([['green', 'trapped ray'], ['red', 'leaking ray'], ['muted', 'input pulse', { dash: true }], ['accent', 'output pulse']]);
        v.readout(() => st ? `$\\mathrm{NA}=\\sqrt{n_1^2-n_2^2}=${v.fix(st.NA, 4)}$, acceptance half-angle $\\arcsin\\mathrm{NA}=${v.fix(st.accept, 2)}^\\circ$ (inside the fibre: $\\alpha_{\\max}=${v.fix(st.amax, 2)}^\\circ$) · the ray you launched is ${st.Rm.bound ? 'trapped' : 'not trapped'} · ${v.fix(st.acc * 100, 0)}% of the rays in the cone are accepted\nformula $\\Delta t=(Ln_1/c)(n_1/n_2-1)=${v.fix(st.tmax, 2)}$ ns · largest delay among the accepted rays in the simulation: ${v.fix(st.dm, 2)} ns${st.cone < st.accept ? ' (cone narrower than the acceptance: smaller than the formula)' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Phenomenon',
      name: 'Phase flip on reflection',
      statement: String.raw`At normal incidence on a boundary between media of index $n_1$ and $n_2$ the reflected electric amplitude is $r=\dfrac{n_1-n_2}{n_1+n_2}$ times the incident amplitude. If $n_2>n_1$ (reflection off the *denser* medium, “external” reflection) $r<0$: the reflected wave is **inverted**, a phase shift of $\pi$ (half a wavelength of path). If $n_2<n_1$ (reflection off the rarer medium, “internal”) $r>0$ and there is no phase change. The transmitted wave is never inverted ($t=2n_1/(n_1+n_2)>0$). For s polarization the shift stays $\pi$ at all angles of external reflection; for internal reflection it is $0$ below the critical angle and then grows toward $-\pi$ at grazing incidence.`,
      idea: String.raw`Continuity of the tangential electric field at the boundary requires $1+r=t$; continuity of the tangential $H$ field, $n_1(1-r)=n_2t$, fixes $r=(n_1-n_2)/(n_1+n_2)$ (the normal-incidence case of 4.7). The same bookkeeping holds for a string joined to a heavier one (1.9), which inverts a reflected pulse. This sign decides whether interference at a thin film is constructive or destructive (6.5): it is why a soap film is black where it is thinnest, and why the centre of Newton's rings is dark (6.7); Young inferred it from the rings, and Stokes (1849) established it from time-reversal (4.11). Beyond the critical angle the coefficient is a pure phase that varies with angle (the Goos–Hänchen shift is its derivative).`,
      caption: String.raw`A single pulse of electric field meets the boundary at $x=0$ (right side shaded). Choose air to glass or glass to air, and the index of glass: for external reflection the reflected pulse comes back upside down, for internal reflection upright; its height is $|r|=|n_1-n_2|/(n_1+n_2)$ and the transmitted pulse is shorter in space but never inverted. The right graph shows the phase of $r_s$ against angle (the chosen case bold): $180^\circ$ for external reflection, $0^\circ$ up to the critical angle and then falling for internal reflection.`,
      deps: ['waves-4.7'],
      refs: ['Hecht ch. 4'],
      tags: ['phase shift', 'reflection'],
      credit: 'Young, c. 1801–02; Stokes, 1849',
      verify: true,
      scope: String.raw`Lossless dielectrics. For metals the phase shift is not $\pi$ but depends on the complex index. The sign of $r_p$ depends on the choice of axes in the textbook, which is why the graph shows $r_s$, whose sign is unambiguous.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phase_transition_of_light_on_reflection' },
      viz(v) {
        const dir = v.select('direction', [{ value: 'ext', label: 'air → glass' }, { value: 'int', label: 'glass → air' }], 'ext');
        const nS = v.slider('index of the glass $n$', 1.1, 3, 1.5, { step: 0.01 });
        const aS = v.slider('angle of incidence for the phase graph (degrees)', 0, 89, 30, { step: 0.5 });
        const E = v.stage({ x: [-8, 8], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'position x', yticks: [-1, 0, 1], height: 280, weight: 1.4, minWidth: 320, title: 'electric field of a pulse' });
        const P = v.stage({ x: [0, 90], y: [-200, 200], axes: 'box', gutter: true, xlabel: 'angle of incidence (degrees)', ylabel: 'phase of $r_s$ (degrees)', yticks: [-180, -90, 0, 90, 180], height: 280, weight: 1, minWidth: 280, title: 'phase of the s reflection coefficient' });
        let st = null;
        v.animate((t) => {
          const ext = dir.value === 'ext', n = nS.value, n1 = ext ? 1 : n, n2 = ext ? n : 1;
          const v1 = 1 / n1, v2 = 1 / n2, r = (n1 - n2) / (n1 + n2), tt = 2 * n1 / (n1 + n2);
          const g = (u) => Math.exp(-((u / 0.9) ** 2));
          const tm = (t % 16);
          E.rect(0, -1.5, 8, 1.5, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n2 - 1), stroke: false });
          E.vline(0, { color: 'ink', width: 1.3 });
          E.hline(0, { color: 'faint', width: 1 });
          E.hline(r, { color: 'red', width: 1, dash: [3, 4], alpha: 0.5 });
          const f = (x) => (x < 0 ? g(x + 7 - v1 * tm) + r * g(-x + 7 - v1 * tm) : tt * g((x * v1) / v2 + 7 - v1 * tm));
          E.fn(f, { color: 'accent', width: 2.6, n: 800 });
          E.text(`$n_1=${v.fix(n1, 2)}$`, -7.5, 1.2, { size: 13, color: 'ink' }); E.text(`$n_2=${v.fix(n2, 2)}$`, 5.5, 1.2, { size: 13, color: 'ink' });
          // reflected peak height after reflection
          const xr = 7 - v1 * tm, hasR = xr < -0.5;
          if (hasR) E.dot(xr, r, { r: 5, color: 'red' });
          const ph = (a) => { const F = fresnel(n1, n2, rad(a)); return deg(carg(F.rs)); };
          P.fn((a) => deg(carg(fresnel(1, n, rad(a)).rs)), { color: ext ? 'accent' : 'muted', width: ext ? 3 : 1.2, n: 500 });
          P.fn((a) => deg(carg(fresnel(n, 1, rad(a)).rs)), { color: ext ? 'muted' : 'accent', width: ext ? 1.2 : 3, n: 500 });
          P.vline(aS.value, { color: 'gold', width: 1.4 });
          st = { r, tt, n1, n2, hasR, ph: ph(aS.value), tc: n1 > n2 ? deg(Math.asin(n2 / n1)) : null };
        }, { period: 16, still: 9 });
        v.readout(() => st ? `$r=(n_1-n_2)/(n_1+n_2)=${v.fix(st.r, 3)}$ → the reflected pulse is ${st.r < 0 ? '**inverted**' : 'upright'}, height $|r|=${v.fix(Math.abs(st.r), 3)}$; transmitted height $t=1+r=${v.fix(st.tt, 3)}$ (never inverted) · phase of $r_s$ at $${v.fix(aS.value, 1)}^\\circ$: $${v.fix(st.ph, 1)}^\\circ$${st.tc != null ? ' · critical angle $' + v.fix(st.tc, 1) + '^\\circ$' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Law',
      name: 'Beer–Lambert law',
      statement: String.raw`When monochromatic light passes through a uniform absorbing medium, the transmitted irradiance falls exponentially with the path length $\ell$ and, for a dilute solution, with the concentration $c$ of the absorber:
$$I=I_0\,10^{-\varepsilon c\ell}=I_0e^{-\alpha\ell},\qquad A\equiv\log_{10}\frac{I_0}{I}=\varepsilon c\ell,\quad \alpha=\varepsilon c\ln10 ,$$
where $\varepsilon$ is the molar absorptivity (L mol$^{-1}$ cm$^{-1}$) and $A$ the absorbance. Each thin slice absorbs the same *fraction* of the light that reaches it, so $-\log I$ is linear in both $\ell$ and $c$. The law fails at high concentration (interactions between absorbers), with scattering, with broadband light, and with stray light in the instrument, which makes the apparent absorbance level off.`,
      idea: String.raw`In a thin slice $dx$ the irradiance (4.2) lost is proportional to the irradiance present, to the number of absorbers per volume and to their absorption cross-section: $dI=-\alpha I\,dx$, which integrates to the exponential. Bouguer (1729) found the exponential dependence on thickness, Lambert (1760) stated it as a law of thickness, and Beer (1852) showed the dependence on concentration. A spectrophotometer reads $A$ rather than $I$ because $A$ is proportional to $c$, so a calibration line gives concentrations; stray light $s$ adds a floor to the detected signal, giving $A_{\rm app}=-\log_{10}[(T+s)/(1+s)]$, which saturates at $-\log_{10}s$ however dark the sample.`,
      caption: String.raw`A cuvette (top) of an illustrative dye with $\varepsilon=10\,000$ L mol$^{-1}$ cm$^{-1}$: the dots are absorbing molecules (their number follows $c$) and the gold curve is the fraction of the light remaining, $10^{-\varepsilon cx}$. Lower graph: absorbance against concentration for the path length you set: a straight line (green). The gold dots are what an instrument with stray light $s$ would report; with $s=0$ they sit on the line, and with $s>0$ they bend over at high absorbance. Double the path length and the line steepens two-fold.`,
      deps: ['waves-4.2', 'em-11.13'],
      refs: ['Hecht ch. 3'],
      tags: ['absorption', 'spectroscopy'],
      credit: 'Bouguer, 1729; Lambert, 1760; Beer, 1852',
      scope: String.raw`Monochromatic light, uniform dilute absorbers that act independently, no scattering, no fluorescence or saturation (very intense light bleaches the absorber). The molar absorptivity used here is an illustrative value for a strongly absorbing dye, not a measurement.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beer%E2%80%93Lambert_law' },
      viz(v) {
        const EPS = 1e4; // L / (mol cm), illustrative
        const cS = v.slider('concentration $c$ (µmol/L)', 0, 300, 80, { step: 1 });
        const lS = v.slider('path length $\\ell$ (cm)', 0.1, 5, 1, { step: 0.05 });
        const sS = v.slider('stray light $s$ (% of the incident light)', 0, 10, 0, { step: 0.1 });
        const C = v.stage({ x: [0, 5], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'depth in the cuvette x (cm)', ylabel: 'I / I₀', height: 280, full: true, title: 'light in the cuvette' });
        const K = v.stage({ x: [0, 300], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 'concentration (µmol/L)', ylabel: 'absorbance A', height: 280, full: true, title: 'calibration line' });
        const rng = v.rng(7);
        const mol = []; for (let i = 0; i < 400; i++) mol.push([rng() * 5, rng() * 0.9 + 0.05]);
        let st = null;
        v.render(() => {
          const c = cS.value * 1e-6, l = lS.value, s = sS.value / 100;
          C.setView([0, Math.max(l * 1.12, 0.5)], [0, 1.15]);
          const I = (x) => Math.pow(10, -EPS * c * x);
          // beam slices, brightness = remaining light
          const NS = 50;
          for (let i = 0; i < NS; i++) { const x0 = (l * i) / NS, x1 = (l * (i + 1)) / NS; C.rect(x0, 0, x1, 1.1, { fill: 'gold', fillAlpha: 0.22 * I((x0 + x1) / 2) + 0.02, stroke: false }); }
          C.rect(0, 0, l, 1.1, { color: 'ink', width: 1.2, fill: false });
          const nm = Math.round((cS.value / 300) * 400);
          for (let i = 0; i < nm; i++) { const [x, y] = mol[i]; if (x <= l) C.dot(x, y * 1.0, { r: 2.4, color: 'purple', alpha: 0.7 }); }
          C.fn(I, { color: 'gold', width: 3, domain: [0, l], n: 120 });
          C.hline(Math.exp(-1), { color: 'muted', width: 1, dash: [3, 4] });
          const A = (cc) => EPS * cc * 1e-6 * l;
          K.fn((cc) => A(cc), { color: 'green', width: 2.4, n: 100 });
          if (s > 0) K.fn((cc) => -Math.log10((Math.pow(10, -A(cc)) + s) / (1 + s)), { color: 'gold', width: 2, dash: [5, 4], n: 200 });
          K.hline(-Math.log10(Math.max(s, 1e-12)), { color: 'red', width: 1, dash: [3, 4], alpha: s > 0 ? 0.6 : 0 });
          for (let cc = 0; cc <= 300; cc += 37.5) K.dot(cc, -Math.log10((Math.pow(10, -A(cc)) + s) / (1 + s)), { r: 3.5, color: 'gold' });
          K.vline(cS.value, { color: 'muted', width: 1 });
          const Tn = I(l);
          st = { T: Tn, A: A(cS.value), Aapp: -Math.log10((Tn + s) / (1 + s)), alpha: EPS * c * Math.LN10, s, c: cS.value, l };
        });
        v.readout(() => st ? `$T=I/I_0=10^{-\\varepsilon c\\ell}=${v.fix(st.T, 4)}$ · $A=\\varepsilon c\\ell=${v.fix(EPS, 0)}\\times${v.sci(st.c * 1e-6, 2)}\\times${v.fix(st.l, 2)}=${v.fix(st.A, 3)}$ · $\\alpha=${v.fix(st.alpha, 3)}$ cm$^{-1}$ (1/e depth $${v.fix(1 / Math.max(st.alpha, 1e-9), 2)}$ cm)${st.s > 0 ? ` · with stray light the instrument reads $A_{\\rm app}=${v.fix(st.Aapp, 3)}$, an error of $${v.fix(((st.Aapp - st.A) / Math.max(st.A, 1e-9)) * 100, 1)}\\%$, and can never read above $${v.fix(-Math.log10(st.s), 2)}$` : ''}` : '');
      },
    },
  ],
};
