// Condensed Matter Physics — Chapter 3: Lattice vibrations, binding and defects (items 3.9–3.16; 3.1–3.8 in ch03.js)
import { PI, bose, bgJ5, bgRho, debyeI1, debyeU2, feynman } from './ch03.shared.js';

export default {
  collection: 'cm',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Phenomenon',
      name: 'Thermal expansion from anharmonicity',
      statement: String.raw`If the potential between neighbouring atoms were exactly harmonic, $V=\tfrac12fx^2$, the atoms would vibrate more strongly as $T$ rises but their mean separation would not change: there would be **no thermal expansion**. Expansion needs an asymmetric well. With the cubic term $V=\tfrac12fx^2-gx^3$ (the repulsive wall steeper than the attractive tail), the classical thermal average of the displacement is
$$\langle x\rangle=\frac{3g}{f^2}\,k_BT,$$
so the linear expansion coefficient is $\alpha=\dfrac{1}{r_0}\dfrac{d\langle x\rangle}{dT}=\dfrac{3gk_B}{f^2r_0}$, independent of $T$ in the classical regime; a purely symmetric anharmonic term ($x^4$) gives none.`,
      idea: String.raw`The Boltzmann weight $e^{-V/k_BT}$ of a harmonic well is symmetric about the minimum, so $\langle x\rangle=0$ at every $T$ however large the amplitude of vibration (the Einstein oscillator of thermo-5.3 is exactly this harmonic case). Adding the cubic term tilts the weight toward the soft side: $e^{gx^3/k_BT}\approx1+gx^3/k_BT$, and $\langle x\rangle=(g/k_BT)\langle x^4\rangle_0=(g/k_BT)\cdot3(k_BT/f)^2$ by the Gaussian fourth moment. In a real crystal the same asymmetry makes the phonon frequencies depend on volume (Grüneisen parameter), which is where the quantum $T\to0$ freeze-out of $\alpha$ comes from.`,
      caption: String.raw`The potential well of a pair of atoms (left, $D=a=1$; the Morse form $D(1-e^{-ax})^2$ is a standard asymmetric model) with the Boltzmann weight $e^{-V/k_BT}$ shaded and its mean position marked by a gold line. Raise $k_BT$: in the **Morse** well the mean separation drifts to larger $x$; in the **harmonic** and **symmetric-quartic** wells it stays at $0$ however wide the weight becomes. **Right:** $\langle x\rangle$ against temperature, with the cubic-term prediction as a dashed line.`,
      scope: String.raw`Classical statistics (high $T$, above the Debye temperature) and a single bond; the average is over the bound well $-1.2\le ax\le3.5$ (dissociation excluded), accurate for $k_BT\lesssim0.15D$. Real $\alpha(T)$ vanishes as $T\to0$ (quantum freeze-out) and depends on the whole phonon spectrum, not on one bond.`,
      deps: ['cm-3.2'],
      refs: ['Ashcroft–Mermin ch. 25', 'Kittel ch. 5'],
      tags: ['anharmonicity', 'thermal expansion', 'morse potential'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermal_expansion' },
      viz(v) {
        const POT = { morse: (x) => (1 - Math.exp(-x)) ** 2, harm: (x) => x * x, quart: (x) => x * x + 0.6 * x ** 4 };
        const sel = v.select('potential', [{ value: 'morse', label: 'Morse (asymmetric)' }, { value: 'harm', label: 'harmonic' }, { value: 'quart', label: 'symmetric $x^2+0.6x^4$' }], 'morse');
        const kT = v.slider('temperature $k_BT/D$', 0.005, 0.15, 0.05, { step: 0.001 });
        const X0 = -1.2, X1 = 3.5, NX = 500;
        const mean = (V, t) => { let z = 0, m = 0; for (let i = 0; i <= NX; i++) { const x = X0 + ((X1 - X0) * i) / NX, w = Math.exp(-V(x) / t); z += w; m += w * x; } return m / z; };
        const sW = v.stage({ x: [X0, X1], y: [-0.05, 1.2], axes: 'box', gutter: true, height: 340, xlabel: 'bond stretch $ax$', ylabel: '$V/D$', title: 'pair potential and Boltzmann weight', weight: 1.1 });
        const sT = v.stage({ x: [0, 0.15], y: [-0.02, 0.2], axes: 'box', gutter: true, height: 340, xlabel: '$k_BT/D$', ylabel: 'mean stretch $\\langle ax\\rangle$', title: 'thermal expansion', weight: 0.9 });
        v.legend([['accent', 'potential'], ['orange', 'Boltzmann weight (arb. scale)'], ['gold', 'mean $\\langle x\\rangle$'], ['muted', '$\\tfrac34k_BT/D$ (cubic term)', { dash: true }]]);
        v.render(() => {
          const V = POT[sel.value], t = kT.value;
          sW.fn((x) => Math.min(V(x), 1.2), { color: 'accent', width: 2.6, domain: [X0, X1] });
          sW.fn((x) => 1.1 * Math.exp(-(V(x) - 0) / t) * 0.55, { color: 'orange', width: 2, fill: true, fillAlpha: 0.2, base: 0, domain: [X0, X1] });
          const m = mean(V, t); sW.vline(m, { color: 'gold', width: 2.4 }); sW.vline(0, { color: 'faint', width: 1, dash: [3, 4] });
          const pts = []; for (let i = 1; i <= 50; i++) { const tt = (0.15 * i) / 50; pts.push([tt, mean(V, tt)]); }
          sT.path(pts, { color: 'accent', width: 2.6 }); sT.fn((x) => 0.75 * x, { color: 'muted', width: 1.4, dash: [5, 4] });
          sT.dot(t, m, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const V = POT[sel.value], t = kT.value, m = mean(V, t), h = 0.004, sl = (mean(V, t + h) - mean(V, Math.max(0.002, t - h))) / (t + h - Math.max(0.002, t - h));
          return `$k_BT=${v.fix(t, 3)}\\,D$: mean stretch $\\langle ax\\rangle=${v.fix(m, 4)}$ · slope $d\\langle ax\\rangle/d(k_BT/D)=${v.fix(sl, 3)}$ ${sel.value === 'morse' ? '(cubic-term prediction $3/4$; the slope rises above it at higher $T$ as the next anharmonic terms and the soft tail of the well enter)' : '(expected $0$: no cubic term ⇒ no expansion)'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Thermal conductivity of insulators and Umklapp scattering',
      credit: 'Peierls, 1929',
      statement: String.raw`In an electrical insulator heat is carried by phonons, with $\kappa=\tfrac13Cv\ell$ ($C$ the heat capacity per volume, $v$ the sound speed, $\ell$ the mean free path). **Normal** phonon collisions ($\mathbf q_1+\mathbf q_2=\mathbf q_3$) conserve the total crystal momentum, and so cannot by themselves restore equilibrium of a drifting phonon gas: they give no thermal resistance. Resistance comes from **Umklapp** processes, $\mathbf q_1+\mathbf q_2=\mathbf q_3+\mathbf G$, which change the total crystal momentum by a reciprocal-lattice vector and so degrade the flow, together with defects and the sample boundaries. Umklapp needs phonons of wave vector $\sim G/2$, thermally available only when $k_BT\gtrsim\Theta/\text{few}$: $\ell_U\propto e^{\Theta/bT}$ ($b\approx2$–$3$), so $\kappa$ rises exponentially as a pure crystal is cooled, until the boundary mean free path stops it: a **peak** at $T\sim\Theta/20$ and $\kappa\propto T^3$ below.`,
      idea: String.raw`A phonon gas carrying heat has a net drift: its distribution is shifted in crystal momentum. If every collision conserved $\sum\mathbf q$, the shift would persist for ever. Umklapp collisions send two phonons whose momenta add to beyond the zone back into the first zone with the reverse sign of the large component (the "flip-over", $\mathbf G$ absorbed by the lattice, cm-3.5), which destroys the drift. The Boltzmann factor $e^{-\Theta/bT}$ is the probability that two phonons carry enough momentum, so as $T$ falls Umklapp switches off exponentially and conduction is limited by the sample size $L$.`,
      caption: String.raw`**Left:** the Brillouin zone of a square lattice with two phonons $\mathbf q_1,\mathbf q_2$ (drag the handles) combining into $\mathbf q_1+\mathbf q_2$ (dashed). Inside the zone it is a **normal** process; outside, the result is folded back by $\mathbf G$ (blue square) and the process is **Umklapp**, the $x$ or $y$ component of the energy current reverses. **Right:** a model $\kappa(T)$ built from a Debye spectrum with $\tau_U^{-1}\propto\omega^2Te^{-\Theta/3T}$ and boundary scattering $v/L$: the peak, the $T^3$ law below it, and (dashed) the unlimited $\kappa$ that would remain without Umklapp.`,
      scope: String.raw`The left panel is a kinematic bookkeeping of the crystal momentum for a square-lattice model band, **energy conservation is not imposed** (real three-phonon processes need several branches or dispersion; the energy mismatch is shown). The right panel is the phenomenological Debye–Callaway-type model with a single speed and relaxation times $\tau_B^{-1}=v/L$, $\tau_U^{-1}=B\omega^2Te^{-\Theta/3T}$ (fixed form, adjustable $B$ and $L$), with no isotope or impurity scattering, and not a fit to any data.`,
      deps: ['cm-3.5', 'xtal-5.4'],
      refs: ['Ashcroft–Mermin ch. 25', 'Kittel ch. 5'],
      tags: ['thermal conductivity', 'umklapp', 'phonon scattering'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Umklapp_scattering' },
      viz(v) {
        const Lb = v.slider('sample size $L$ (relative)', 1, 1e5, 1e3, { log: true, sig: 2 });
        const Bs = v.slider('Umklapp strength $B$', 0.1, 100, 8, { log: true, sig: 2 });
        const w = (kx, ky) => Math.sqrt(Math.sin(kx / 2) ** 2 + Math.sin(ky / 2) ** 2);
        const vel = (kx, ky) => { const ww = Math.max(w(kx, ky), 1e-6); return [Math.sin(kx) / (4 * ww), Math.sin(ky) / (4 * ww)]; };
        const tk = [[-2 * PI, '−2π'], [-PI, '−π'], [0, '0'], [PI, 'π'], [2 * PI, '2π']];
        const sK = v.stage({ x: [-2 * PI - 0.3, 2 * PI + 0.3], y: [-2 * PI - 0.3, 2 * PI + 0.3], equal: true, axes: 'box', gutter: true, height: 360, xlabel: '$q_xa$', ylabel: '$q_ya$', xticks: tk, yticks: tk, title: 'phonon collision in the extended zone', weight: 1 });
        const sT = v.stage({ x: [0.005, 2], y: [1e-2, 1e3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'temperature $T/\\Theta$', ylabel: 'conductivity $\\kappa$ (arb.)', title: 'model $\\kappa(T)$', weight: 1 });
        const h1 = sK.handle(2.2, 0.4, { color: 'accent', r: 7, constrain: { x: [-PI, PI], y: [-PI, PI] } });
        const h2 = sK.handle(1.9, 1.4, { color: 'orange', r: 7, constrain: { x: [-PI, PI], y: [-PI, PI] } });
        v.legend([['accent', 'with all processes'], ['red', 'no Umklapp (normal only)', { dash: true }]]);
        const kappa = (T, L, B, umk) => { // units: Θ = v = 1, ħ = k_B = 1; ∫ x⁴ eˣ/(eˣ−1)² τ(x) dx with τ^{-1} = v/L + B (T x)² T e^{−1/(3T)}
          const X = 1 / T, n = 160, h = X / n; let s = 0;
          for (let i = 1; i <= n; i++) { const x = (i - 0.5) * h, ex = Math.exp(x), f = (x ** 4 * ex) / ((ex - 1) ** 2), inv = 1 / L + (umk ? B * 1e-3 * (T * x) ** 2 * T * Math.exp(-1 / (3 * T)) * 1e3 : 0); s += f / inv * h; }
          return s * T ** 3;
        };
        let info = {};
        v.render(() => {
          const q1 = [h1.x, h1.y], q2 = [h2.x, h2.y];
          const sx = q1[0] + q2[0], sy = q1[1] + q2[1], outx = Math.abs(sx) > PI, outy = Math.abs(sy) > PI, U = outx || outy;
          const fx = outx ? sx - 2 * PI * Math.sign(sx) : sx, fy = outy ? sy - 2 * PI * Math.sign(sy) : sy;
          for (const gx of [-PI, PI]) { sK.vline(gx, { color: 'ink', width: 1.2, alpha: 0.5 }); sK.hline(gx, { color: 'ink', width: 1.2, alpha: 0.5 }); }
          sK.rect(-PI, -PI, PI, PI, { fill: 'accent', fillAlpha: 0.05, color: 'accent', width: 1.5 });
          sK.text('first zone', -PI + 0.3, PI - 0.4, { size: 11, color: 'accent' });
          sK.arrow(0, 0, q1[0], q1[1], { color: 'accent', width: 2 }); sK.arrow(q1[0], q1[1], sx, sy, { color: 'orange', width: 2 });
          sK.arrow(0, 0, sx, sy, { color: 'ink', width: 1.4, dash: [4, 4] });
          sK.dot(sx, sy, { r: 7, color: U ? 'red' : 'green', hollow: true });
          if (U) { sK.arrow(sx, sy, fx, fy, { color: 'red', width: 1.8, dash: [3, 3] }); sK.dot(fx, fy, { r: 7, color: 'red' }); sK.text('$\\mathbf q_3$ (folded)', fx - 0.1, fy + 0.65, { size: 11, color: 'red' }); }
          else sK.text('$\\mathbf q_3$', sx + 0.2, sy - 0.45, { size: 11, color: 'green' });
          sK.tex('\\mathbf q_1', q1[0] + 0.25, q1[1] - 0.5, { color: 'accent', size: 13 }); sK.tex('\\mathbf q_2', q2[0] - 0.55, q2[1] + 0.5, { color: 'orange', size: 13 });
          const e1 = w(q1[0], q1[1]), e2 = w(q2[0], q2[1]), e3 = w(fx, fy), v1 = vel(q1[0], q1[1]), v3 = vel(fx, fy);
          info = { U, sx, sy, fx, fy, mism: e1 + e2 - e3, J1: [e1 * v1[0], e1 * v1[1]], J3: [e3 * v3[0], e3 * v3[1]] };
          const ts = []; for (let i = 0; i <= 80; i++) ts.push(0.006 * Math.pow(2 / 0.006, i / 80));
          sT.path(ts.map((T) => [T, kappa(T, Lb.value, Bs.value, true)]), { color: 'accent', width: 2.6 });
          sT.path(ts.map((T) => [T, kappa(T, Lb.value, Bs.value, false)]), { color: 'red', width: 1.8, dash: [5, 4] });
          let bi = 0, bk = 0; for (const T of ts) { const kk = kappa(T, Lb.value, Bs.value, true); if (kk > bk) { bk = kk; bi = T; } }
          info.peakT = bi; info.peakK = bk; sT.dot(bi, bk, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const I = info; if (!I.sx && I.sx !== 0) return '';
          return `$\\mathbf q_1+\\mathbf q_2=(${v.fix(I.sx / PI, 2)},${v.fix(I.sy / PI, 2)})\\pi/a$ → **${I.U ? 'Umklapp' : 'normal'}** process${I.U ? `: absorbed $\\mathbf G=(${v.fix((I.sx - I.fx) / PI, 0)},${v.fix((I.sy - I.fy) / PI, 0)})\\,2\\pi/a$; the energy current of the final phonon, $\\omega\\mathbf v=(${v.fix(I.J3[0], 2)},${v.fix(I.J3[1], 2)})$, has changed sign in the folded component` : ': total crystal momentum conserved'} · energy mismatch $\\omega_1+\\omega_2-\\omega_3=${v.fix(I.mism, 2)}\\omega_m$ (not imposed)\nmodel peak of $\\kappa$ at $T/\\Theta=${v.fix(I.peakT, 3)}$ (about $\\Theta/${v.fix(1 / I.peakT, 0)}$)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Law',
      name: 'Lindemann melting criterion',
      credit: 'Lindemann, 1910',
      statement: String.raw`A crystal melts when the root-mean-square thermal displacement of its atoms reaches a fixed fraction of the nearest-neighbour distance, $\sqrt{\langle u^2\rangle}\approx c\,d$ with $c\approx0.1$–$0.2$ for many elements. In the Debye model the high-temperature value is
$$\langle u^2\rangle=\frac{9\hbar^2T}{mk_B\Theta^2},\qquad\text{so}\qquad T_m\approx\frac{c^2d^2\,mk_B\Theta^2}{9\hbar^2},$$
which makes $T_m$ rise with the square of the Debye temperature (stiff lattices melt higher) and with the atomic mass.`,
      idea: String.raw`Each Debye mode contributes $\langle u^2\rangle\propto\hbar\omega(\bar n+\tfrac12)/(m\omega^2)$; summing over the Debye spectrum (cm-3.5, thermo-9.13's density of states) gives $\langle u^2\rangle=\frac{9\hbar^2}{mk_B\Theta}\big[\tfrac14+(T/\Theta)^2\int_0^{\Theta/T}\frac{x\,dx}{e^x-1}\big]$: a zero-point term at low $T$ and linear growth at high $T$. The criterion is empirical: it says that once atoms wander over a fixed fraction of a bond length, the cage of neighbours no longer holds the structure together, but it does not say why this ratio should be universal.`,
      caption: String.raw`Pick an element: the curve is $\sqrt{\langle u^2\rangle}/d$ from the Debye formula against temperature (dashed: the classical high-$T$ line, which overestimates at low $T$). The vertical line is the real melting point, and the gold dot the ratio there; the horizontal line is the Lindemann constant $c$ you choose, whose intersection with the curve predicts a melting temperature. The bars (right) give the ratio at $T_m$ for nine elements: all fall between about $0.10$ and $0.15$.`,
      scope: String.raw`A rule of thumb with large element-to-element scatter in $c$ (it also depends on whether the total or one-component rms is quoted; here the total three-dimensional rms). Debye temperatures are the low-temperature calorimetric values of Kittel's table (via a secondary compilation), melting points the recommended values on Wikipedia's melting-point data page, nearest-neighbour distances and atomic masses standard handbook values quoted from memory; the Debye model is applied to the whole range, though $\Theta$ itself varies with $T$.`,
      deps: ['thermo-5.3', 'cm-3.5'],
      refs: ['Ashcroft–Mermin ch. 21'],
      tags: ['melting', 'lindemann', 'debye model'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lindemann_index' },
      verify: true,
      viz(v) {
        const C = v.M.CONST, hb = C.hbar, kB = C.kB, u = C.u;
        const EL = { Na: [158, 370.944, 22.99, 3.72], K: [91, 336.7, 39.1, 4.62], Al: [428, 933.47, 26.98, 2.86], Fe: [470, 1811, 55.85, 2.48], Ni: [450, 1728, 58.69, 2.49], Cu: [343, 1357.77, 63.55, 2.56], Ag: [225, 1234.93, 107.87, 2.89], Au: [165, 1337.33, 196.97, 2.88], Pb: [105, 600.61, 207.2, 3.5] };
        const names = Object.keys(EL);
        const sel = v.select('element', names, 'Cu');
        const cS = v.slider('Lindemann constant $c$', 0.05, 0.25, 0.11, { step: 0.005 });
        const ratio = (el, T) => { const [th, , m, d] = EL[el]; return (Math.sqrt(debyeU2(T, th, m * u, hb, kB)) * 1e10) / d; };
        const sA = v.stage({ x: [0, 2000], y: [0, 0.25], axes: 'box', gutter: true, height: 340, xlabel: 'temperature $T$ (K)', ylabel: '$\\sqrt{\\langle u^2\\rangle}/d$', title: 'rms vibration amplitude relative to nearest-neighbour distance', weight: 1.2 });
        const sB = v.stage({ x: [0.3, 9.7], y: [0, 0.2], axes: 'box', gutter: true, height: 340, ylabel: 'ratio at the melting point', title: 'ratio at $T_m$ for nine elements', weight: 0.9, xticks: names.map((n, i) => [i + 1, n]) });
        v.legend([['accent', 'Debye model'], ['muted', 'classical high-$T$ limit', { dash: true }], ['red', 'melting point'], ['orange', 'constant $c$']]);
        v.render(() => {
          const el = sel.value, [th, tm, m, d] = EL[el], c = cS.value;
          sA.fn((T) => ratio(el, T), { color: 'accent', width: 2.6, domain: [1, 2000], n: 200 });
          sA.fn((T) => (Math.sqrt((9 * hb * hb * T) / (m * u * kB * th * th)) * 1e10) / d, { color: 'muted', width: 1.4, dash: [5, 4], domain: [1, 2000] });
          sA.vline(tm, { color: 'red', width: 2 }); sA.dot(tm, ratio(el, tm), { r: 6, color: 'gold' });
          sA.hline(c, { color: 'orange', width: 1.6, dash: [4, 3] });
          sB.bars(names.map((n) => ratio(n, EL[n][1])), { x0: 1, dx: 1, color: (val, i) => (names[i] === el ? 'accent' : 'faint') });
          sB.hline(c, { color: 'orange', width: 1.6, dash: [4, 3] });
        });
        v.readout(() => {
          const el = sel.value, [th, tm, m, d] = EL[el], c = cS.value, r = ratio(el, tm);
          let lo = 1, hi = 3000; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (ratio(el, mid) < c) lo = mid; else hi = mid; }
          return `${el}: $\\Theta=${th}$ K, $d=${d}$ Å, $T_m=${v.fix(tm, 0)}$ K · ratio at $T_m$: $\\sqrt{\\langle u^2\\rangle}/d=${v.fix(r, 3)}$ (rms per direction $${v.fix(r / Math.sqrt(3), 3)}\\,d$) · with $c=${v.fix(c, 3)}$ the criterion predicts $T_m=${v.fix(lo, 0)}$ K (${Math.round(((lo - tm) / tm) * 100) || 0}% off)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Lyddane–Sachs–Teller relation and polaritons',
      credit: 'Lyddane, Sachs & Teller, 1941',
      statement: String.raw`In a cubic ionic crystal with a single infrared-active optical mode, the dielectric function is $\varepsilon(\omega)=\varepsilon_\infty+(\varepsilon_0-\varepsilon_\infty)\,\omega_{TO}^2/(\omega_{TO}^2-\omega^2)$. It vanishes at the longitudinal optical frequency, and the three numbers are tied by the **Lyddane–Sachs–Teller relation**
$$\frac{\omega_{LO}^2}{\omega_{TO}^2}=\frac{\varepsilon(0)}{\varepsilon(\infty)}.$$
Between $\omega_{TO}$ and $\omega_{LO}$ one has $\varepsilon<0$: light cannot propagate (**reststrahlen band**, high reflectivity). Coupling the transverse mode to the electromagnetic wave $c^2k^2=\varepsilon(\omega)\omega^2$ gives two **polariton** branches that avoid crossing the TO line and leave the gap $[\omega_{TO},\omega_{LO}]$.`,
      idea: String.raw`The longitudinal mode has $\nabla\cdot\mathbf D=0$ so the field $\mathbf E=-\mathbf P/\varepsilon_0\varepsilon_\infty$ acts as an extra restoring force and stiffens the oscillation to $\omega_{LO}$; in terms of the Lorentz oscillator (em-11.12) this is the zero of $\varepsilon$. Equivalently, the pole of $\varepsilon(\omega)$ is at $\omega_{TO}$ and its zero at $\omega_{LO}$, so $\varepsilon(0)/\varepsilon(\infty)=\omega_{LO}^2/\omega_{TO}^2$ is the ratio of the product over zeros and poles. Inserting $\varepsilon(\omega)$ into the dispersion of light gives a quartic in $\omega$ with two positive roots for each $k$: far from the crossing the branches are photon-like or phonon-like, near it they mix.`,
      caption: String.raw`**Left:** $\varepsilon(\omega)$ (pole at $\omega_{TO}$, zero at $\omega_{LO}$, negative between). **Middle:** the polariton dispersion $\omega(k)$: the lower branch starts as light with the slope $c/\sqrt{\varepsilon_0}$ and flattens to $\omega_{TO}$; the upper branch begins at $\omega_{LO}$ and approaches the line $c/\sqrt{\varepsilon_\infty}$; nothing propagates in the gap. **Right:** the reflectivity at normal incidence, with the damping $\gamma$ you set. Try the **NaCl** preset ($\varepsilon_0=5.9$, $\varepsilon_\infty=2.25$, $\nu_{TO}\approx4.9$ THz, values from Wikipedia) and compare the predicted $\nu_{LO}$ with the edge of the reflectivity band.`,
      scope: String.raw`One oscillator, isotropic (cubic) crystal, nonmagnetic, wave vectors small enough that retardation matters but spatial dispersion is negligible. Many-mode crystals satisfy the generalised relation $\prod_j\omega_{LO,j}^2/\omega_{TO,j}^2=\varepsilon(0)/\varepsilon(\infty)$. The NaCl numbers are from the Wikipedia article on the relation (secondary) and are given to the precision there.`,
      deps: ['cm-3.3', 'em-11.12'],
      refs: ['Ashcroft–Mermin ch. 27', 'Kittel ch. 14'],
      tags: ['polariton', 'lst relation', 'reststrahlen'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lyddane%E2%80%93Sachs%E2%80%93Teller_relation' },
      verify: true,
      viz(v) {
        const e0 = v.slider('static $\\varepsilon(0)$', 2, 20, 5.9, { step: 0.05 });
        const ei = v.slider('high-frequency $\\varepsilon_\\infty$', 1, 8, 2.25, { step: 0.05 });
        const gam = v.slider('damping $\\gamma/\\omega_{TO}$', 0, 0.25, 0.02, { step: 0.005 });
        const pre = v.select('preset', [{ value: 'free', label: 'free' }, { value: 'nacl', label: 'NaCl (Wikipedia values)' }], 'nacl', { onChange: (x) => { if (x === 'nacl') { e0.set(5.9); ei.set(2.25); } } });
        const epsC = (w, E0, Ei, g) => { // returns [re, im]
          const d = [1 - w * w, -g * w], den = d[0] * d[0] + d[1] * d[1], f = (E0 - Ei); return [Ei + (f * d[0]) / den, (f * -d[1]) / den];
        };
        const refl = (w, E0, Ei, g) => { const [a, b] = epsC(w, E0, Ei, g), mod = Math.hypot(a, b), nr = Math.sqrt(Math.max(0, (mod + a) / 2)), ni = Math.sign(b || 1) * Math.sqrt(Math.max(0, (mod - a) / 2)); return ((nr - 1) ** 2 + ni * ni) / ((nr + 1) ** 2 + ni * ni); };
        const sE = v.stage({ x: [0, 2.2], y: [-12, 14], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega/\\omega_{TO}$', ylabel: '$\\mathrm{Re}\\,\\varepsilon$', title: 'dielectric function', weight: 0.9 });
        const sP = v.stage({ x: [0, 4], y: [0, 2.2], axes: 'box', gutter: true, height: 340, xlabel: '$ck/\\omega_{TO}$', ylabel: '$\\omega/\\omega_{TO}$', title: 'polariton dispersion', weight: 1.1 });
        const sR = v.stage({ x: [0, 2.2], y: [0, 1.02], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega/\\omega_{TO}$', ylabel: 'reflectivity $R$', title: 'normal-incidence reflectivity', weight: 0.9 });
        v.legend([['accent', 'upper / lower polariton'], ['muted', 'light lines $ck/\\sqrt{\\varepsilon}$', { dash: true }], ['orange', 'gap $\\omega_{TO}\\ldots\\omega_{LO}$']]);
        v.render(() => {
          const E0 = Math.max(e0.value, ei.value + 0.05), Ei = ei.value, g = gam.value, wl = Math.sqrt(E0 / Ei);
          sE.fn((w) => epsC(w, E0, Ei, 0)[0], { color: 'accent', width: 2.4, domain: [0, 2.2], n: 800 });
          sE.hline(0, { color: 'ink', width: 0.8, alpha: 0.5 }); sE.vline(1, { color: 'orange', width: 1.4, dash: [4, 3] }); sE.vline(wl, { color: 'orange', width: 1.4, dash: [4, 3] });
          sE.hband(-12, 0, { color: 'orange', alpha: 0.07 });
          sE.text('$\\omega_{TO}$', 1.03, 12, { size: 11, color: 'orange' }); sE.text('$\\omega_{LO}$', wl + 0.03, 12, { size: 11, color: 'orange' });
          const lo = [], up = [];
          for (let i = 0; i <= 200; i++) { const q = (4 * i) / 200, A = Ei, B = q * q + E0, Cc = q * q, disc = Math.sqrt(Math.max(0, B * B - 4 * A * Cc)); lo.push([q, Math.sqrt(Math.max(0, (B - disc) / (2 * A)))]); up.push([q, Math.sqrt(Math.max(0, (B + disc) / (2 * A)))]); }
          sP.path(lo, { color: 'accent', width: 2.6 }); sP.path(up, { color: 'accent', width: 2.6 });
          sP.line(0, 0, 4, 4 / Math.sqrt(E0), { color: 'muted', width: 1.2, dash: [4, 4] }); sP.line(0, 0, 4, 4 / Math.sqrt(Ei), { color: 'muted', width: 1.2, dash: [4, 4] });
          sP.hband(1, wl, { color: 'orange', alpha: 0.12 }); sP.hline(1, { color: 'orange', width: 1.2, dash: [4, 3] }); sP.hline(wl, { color: 'orange', width: 1.2, dash: [4, 3] });
          sR.fn((w) => refl(w, E0, Ei, g), { color: 'accent', width: 2.4, domain: [0.01, 2.2], n: 800 });
          sR.vband(1, wl, { color: 'orange', alpha: 0.12 });
        });
        v.readout(() => {
          const E0 = Math.max(e0.value, ei.value + 0.05), Ei = ei.value, wl = Math.sqrt(E0 / Ei);
          const nacl = pre.value === 'nacl' && Math.abs(E0 - 5.9) < 1e-6 && Math.abs(Ei - 2.25) < 1e-6 ? ` · NaCl: $\\nu_{LO}=${v.fix(4.9 * wl, 1)}$ THz from $\\nu_{TO}=4.9$ THz` : '';
          const wm = (1 + wl) / 2;
          return `$\\omega_{LO}/\\omega_{TO}=\\sqrt{\\varepsilon(0)/\\varepsilon(\\infty)}=${v.fix(wl, 3)}$ · check: $\\mathrm{Re}\\,\\varepsilon(\\omega_{LO})=${v.fix(epsC(wl, E0, Ei, 0)[0], 3)}$, $\\varepsilon(0)=${v.fix(epsC(1e-6, E0, Ei, 0)[0], 3)}$ · inside the band ($\\omega=${v.fix(wm, 2)}\\,\\omega_{TO}$) $\\mathrm{Re}\\,\\varepsilon=${v.fix(epsC(wm, E0, Ei, 0)[0], 2)}<0$ and $R=${v.fix(refl(wm, E0, Ei, gam.value), 3)}$${nacl}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'Ferroelectrics and the soft mode',
      credit: 'Cochran, 1959–1960; Anderson, 1960',
      statement: String.raw`In a **displacive ferroelectric** the paraelectric phase becomes unstable because one zone-centre transverse optical mode softens: $\omega_{TO}^2\propto T-T_0$ as $T\to T_0$ from above (Cochran's law). By the Lyddane–Sachs–Teller relation, with $\omega_{LO}$ and $\varepsilon_\infty$ nearly temperature independent, the static dielectric constant then obeys the **Curie–Weiss law** $\varepsilon(0)\propto1/(T-T_0)$, diverging as the mode frequency goes to zero. Below the transition the frozen-in displacement is a spontaneous polarization $P_s(T)$, described by a Landau free energy $F=\tfrac12a(T-T_0)P^2+\tfrac14bP^4+\tfrac16cP^6$: for $b>0$ a continuous transition at $T_c=T_0$, for $b<0$ a first-order one with a jump of $P_s$ at $T_c=T_0+3b^2/16ac$.`,
      idea: String.raw`The restoring force on the polar displacement is the second derivative of the Landau free energy, $\omega_{TO}^2\propto\partial^2F/\partial P^2=a(T-T_0)+3bP^2+5cP^4$, which is the inverse susceptibility $1/\chi$. The soft mode is therefore the thermodynamic susceptibility seen as a phonon (the two measurements of $\varepsilon(0)$: dielectric and via LST from $\omega_{TO}$ agree), and the transition is the condition that the lattice forces and long-range dipole fields cancel. Below $T_c$ the mode hardens again, at twice the rate in the continuous case, because the curvature at a minimum of $F$ is $2a(T_c-T)$ there.`,
      caption: String.raw`Choose a **continuous** or **first-order** transition and sweep $T$. **Left:** the free energy as a function of $P$ with its global minimum marked (a ball in the double well); **Right:** the soft-mode frequency squared $\omega_{TO}^2\propto1/\varepsilon$ (blue, falling linearly to zero and rising again at twice the slope) and the spontaneous polarization $P_s$ (green). In the first-order case the mode never quite softens and $P_s$ jumps at $T_c$. The LST check in the readout converts $\omega_{TO}$ into $\varepsilon(0)$.`,
      scope: String.raw`Mean-field Landau theory in dimensionless units ($a=c=1$): hysteresis, domains, fluctuation corrections and the order–disorder type of ferroelectric (where no phonon softens fully) are not modelled. Soft-mode ferroelectrics include titanates such as SrTiO$_3$ (incipient) and BaTiO$_3$ (first-order); the model here is generic, not a fit to a material.`,
      deps: ['cm-3.12', 'thermo-11.13'],
      refs: ['Kittel ch. 16', 'Ashcroft–Mermin ch. 27'],
      tags: ['ferroelectric', 'soft mode', 'landau theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ferroelectricity' },
      viz(v) {
        const typ = v.select('transition', [{ value: 'c', label: 'continuous ($b>0$)' }, { value: 'f', label: 'first order ($b<0$)' }], 'c');
        const tS = v.slider('temperature $T-T_c$', -0.5, 0.5, -0.25, { step: 0.005 });
        const par = () => (typ.value === 'c' ? { b: 1, c: 1, T0: 0, Tc: 0 } : { b: -1, c: 1, T0: 0, Tc: 3 / 16 }); // a = 1
        const F = (P, T, p) => 0.5 * (T - p.T0) * P * P + 0.25 * p.b * P ** 4 + (p.c / 6) * P ** 6;
        const d2F = (P, T, p) => (T - p.T0) + 3 * p.b * P * P + 5 * p.c * P ** 4;
        const Ps = (T, p) => { let best = 0, bf = 0; for (let i = 1; i <= 800; i++) { const P = (i / 800) * 1.4, f = F(P, T, p); if (f < bf - 1e-12) { bf = f; best = P; } } if (best > 0) { let lo = Math.max(0, best - 0.002), hi = best + 0.002; for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (F(m1, T, p) < F(m2, T, p)) hi = m2; else lo = m1; } best = (lo + hi) / 2; } return best; };
        const sF = v.stage({ x: [-1.3, 1.3], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 340, xlabel: 'polarization $P$', ylabel: 'free energy $F$', title: 'Landau free energy', weight: 1 });
        const sT = v.stage({ x: [-1, 1], y: [0, 1.25], axes: 'box', gutter: true, height: 340, xlabel: '$T-T_c$', ylabel: '$\\omega_{TO}^2$, $P_s$ (arb.)', title: 'soft mode and spontaneous polarization', weight: 1.1 });
        v.legend([['accent', '$\\omega_{TO}^2\\propto1/\\varepsilon$'], ['green', '$P_s$'], ['muted', 'Cochran line $a(T-T_0)$', { dash: true }]]);
        v.render(() => {
          const p = par(), T = p.Tc + tS.value, P0 = Ps(T, p);
          let fm = 1e9; for (let i = 0; i <= 80; i++) fm = Math.min(fm, F(-1.3 + (2.6 * i) / 80, T, p));
          sF.setView([-1.3, 1.3], [fm - 0.03, fm + 0.3]);
          sF.fn((P) => F(P, T, p), { color: 'accent', width: 2.6, domain: [-1.3, 1.3], n: 300 });
          sF.hline(0, { color: 'faint', width: 1 }); sF.dot(P0, F(P0, T, p), { r: 8, color: 'gold' }); if (P0 > 0) sF.dot(-P0, F(P0, T, p), { r: 5, color: 'gold', hollow: true });
          const ws = [], ps = [];
          for (let i = 0; i <= 200; i++) { const t = -0.5 + i / 200, TT = p.Tc + t, P = Ps(TT, p); ws.push([t, Math.max(0, d2F(P, TT, p))]); ps.push([t, P]); }
          sT.setView([-0.5, 0.5], [0, 1.1 * Math.max(...ps.map((q) => q[1]), ...ws.map((q) => q[1]), 0.5)]);
          sT.path(ps, { color: 'green', width: 2.4 }); sT.path(ws, { color: 'accent', width: 2.6 });
          sT.fn((x) => Math.max(0, x + (p.Tc - p.T0)), { color: 'muted', width: 1.4, dash: [5, 4], domain: [-0.5, 0.5] });
          sT.vline(0, { color: 'faint', width: 1, dash: [3, 4] }); sT.dot(tS.value, Math.max(0, d2F(P0, T, p)), { r: 6, color: 'gold' });
          sT.text('$T_c$', 0.01, 0.05, { size: 11, color: 'muted' });
        });
        v.readout(() => {
          const p = par(), T = p.Tc + tS.value, P0 = Ps(T, p), w2 = d2F(P0, T, p);
          const eps = w2 > 1e-6 ? 5 * (1 / w2) : Infinity; // ε(0) = ε∞ ω_LO²/ω_TO² with ε∞ = 5 and ω_LO² = 1 (arbitrary units)
          return `$T-T_c=${v.fix(T - p.Tc, 3)}$ · $P_s=${v.fix(P0, 3)}$ · $\\omega_{TO}^2=\\partial^2F/\\partial P^2=${v.fix(w2, 3)}$ ⇒ LST: $\\varepsilon(0)=\\varepsilon_\\infty\\omega_{LO}^2/\\omega_{TO}^2=${isFinite(eps) ? v.fix(eps, 1) : '\\infty'}$ (with $\\varepsilon_\\infty=5$, $\\omega_{LO}^2=1$) · ${P0 > 0 ? 'ferroelectric phase' : 'paraelectric phase'}${typ.value === 'f' ? ` · $T_0$ lies ${v.fix(p.Tc - p.T0, 3)} below $T_c$: on the paraelectric side the soft mode stops at $\\omega^2=${v.fix(p.Tc - p.T0, 3)}$ at $T_c$` : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Phenomenon',
      name: 'Polarons',
      credit: 'Landau, 1933; Pekar, 1946; Fröhlich, 1954; Feynman, 1955',
      statement: String.raw`An electron in a polar crystal polarizes the lattice around it (longitudinal optical phonons of frequency $\omega_{LO}$ are excited) and moves together with its cloud of distortion: a **polaron**, with a lower energy and a larger mass than the bare band electron. In the Fröhlich model the coupling is one number,
$$\alpha=\frac{e^2}{4\pi\varepsilon_0\hbar}\sqrt{\frac{m}{2\hbar\omega_{LO}}}\left(\frac1{\varepsilon_\infty}-\frac1{\varepsilon_0}\right),$$
and for weak coupling the ground-state energy shifts by $-\alpha\hbar\omega_{LO}$ and the band mass becomes $m^*\simeq m(1+\alpha/6)$. For strong coupling (roughly $\alpha\gtrsim6$) the electron is self-trapped in its own distortion, the energy $\propto-\alpha^2\hbar\omega_{LO}$ and the mass grows like $\alpha^4$; between the two the change is a smooth crossover.`,
      idea: String.raw`For weak coupling second-order perturbation theory in the electron–phonon vertex (cm-3.12's LO phonon, cm-2.3's effective mass) gives $E=-\alpha-0.0159\alpha^2$ and $m^*/m=1+\alpha/6+0.0236\alpha^2$. For strong coupling the Landau–Pekar variational state, an electron in a self-consistent potential well produced by the polarization it sources, gives energy $\propto-\alpha^2$. Feynman's 1955 path-integral variational method treats both with one trial model of the electron tied to a fictitious particle by a spring ($v$ is the oscillator frequency, $w$ its coupling decay rate), and interpolates smoothly between the two regimes; the picture below evaluates that bound numerically.`,
      caption: String.raw`The variational ground-state energy $E(\alpha)$ (left) and the mass of Feynman's trial system $(v/w)^2$ (right, log scale), computed from Feynman's functional by numerical minimisation over $v,w$. Dashed: the weak-coupling series $-\alpha-0.0159\alpha^2$ and $1+\alpha/6+0.0236\alpha^2$, which the computed curves follow for $\alpha\lesssim3$; beyond $\alpha\approx6$ the mass climbs steeply and $|E|/\alpha^2$ settles towards a constant (readout): the crossover to self-trapping. Drag the handle to pick $\alpha$; the ticks mark coupling constants quoted for ionic crystals (KBr $3.05$, KCl $3.44$, AgCl $1.84$, CsI $3.67$; Wikipedia table).`,
      scope: String.raw`Fröhlich Hamiltonian: one electron on a parabolic band, one dispersionless LO branch, $T=0$, no lattice discreteness. The trial-model mass $(v/w)^2$ is a variational-model quantity, not Feynman's published effective mass (his method for $m^*$ differs and is less accurate at strong coupling); the energy is an upper bound. Small-polaron physics (short-range coupling, narrow bands) is a different regime.`,
      deps: ['cm-3.12', 'cm-2.3'],
      refs: ['Kittel ch. 14'],
      tags: ['polaron', 'electron-phonon', 'feynman'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polaron' },
      verify: true,
      viz(v) {
        const aS = v.slider('coupling $\\alpha$', 0.5, 12, 3, { step: 0.05 });
        const sE = v.stage({ x: [0, 12], y: [-16, 0.5], axes: 'box', gutter: true, height: 340, xlabel: 'coupling $\\alpha$', ylabel: '$E/\\hbar\\omega_{LO}$', title: 'ground-state energy', weight: 1 });
        const sM = v.stage({ x: [0, 12], y: [0.9, 200], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'coupling $\\alpha$', ylabel: 'mass $m^*/m$ (trial system)', title: 'mass enhancement', weight: 1 });
        v.legend([['accent', 'Feynman variational'], ['muted', 'weak coupling', { dash: true }], ['red', 'material couplings']]);
        let curve = null;
        const build = () => { if (curve) return; curve = []; for (let a = 0.5; a <= 12.001; a += 0.25) { const f = feynman(a); curve.push({ a, ...f }); } };
        const MAT = [['KBr', 3.05], ['KCl', 3.44], ['AgCl', 1.84], ['CsI', 3.67]];
        v.render(() => {
          build();
          sE.path(curve.map((c) => [c.a, c.E]), { color: 'accent', width: 2.6 });
          sE.fn((a) => -a - 0.0159 * a * a, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, 5] });
          sM.path(curve.map((c) => [c.a, c.mass]), { color: 'accent', width: 2.6 });
          sM.fn((a) => 1 + a / 6 + 0.0236 * a * a, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, 6] });
          for (const [n, a] of MAT) { sE.vline(a, { color: 'red', width: 0.8, alpha: 0.35 }); sE.text(n, a, -14.6 + 1.1 * (MAT.findIndex((q) => q[0] === n) % 2), { size: 9, color: 'red', align: 'center' }); }
          const f = feynman(Math.round(aS.value * 4) / 4); sE.dot(aS.value, f.E, { r: 6, color: 'gold' }); sM.dot(aS.value, f.mass, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const a = Math.round(aS.value * 4) / 4, f = feynman(a);
          return `$\\alpha=${v.fix(a, 2)}$: $E=${v.fix(f.E, 3)}\\,\\hbar\\omega_{LO}$ (weak-coupling series $${v.fix(-a - 0.0159 * a * a, 3)}$, $-E/\\alpha^2=${v.fix(-f.E / (a * a), 3)}$) · Feynman parameters $v=${v.fix(f.v, 2)}$, $w=${v.fix(f.w, 2)}$ · trial-system mass $(v/w)^2=${v.fix(f.mass, 2)}$ (weak-coupling series $${v.fix(1 + a / 6 + 0.0236 * a * a, 2)}$)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Law',
      name: 'Bloch–Grüneisen law for phonon resistivity',
      credit: 'Bloch, 1930; Grüneisen, 1933',
      statement: String.raw`Electrons scattering from phonons in a simple metal give a resistivity
$$\rho_{ph}(T)=A\left(\frac T\Theta\right)^5\int_0^{\Theta/T}\frac{x^5\,dx}{(e^x-1)(1-e^{-x})},$$
where $\Theta$ is close to the Debye temperature. It is **linear** in $T$ for $T\gtrsim\Theta/3$ (every phonon is excited, $\rho\propto$ phonon number $\propto T$) and falls as $T^5$ for $T\ll\Theta$ (only phonons with $q\sim k_BT/\hbar v$ exist and they change the electron's direction by only a small angle $\propto q/k_F$, one power each from $q^2$ in the coupling, the angle factor $(q/k_F)^2$, and the phonon number). With impurities, Matthiessen's rule adds the temperature-independent residual $\rho_0$.`,
      idea: String.raw`The scattering rate is $\propto\int d^3q\,q^2\,\bar n(\omega_q)\,\ldots$ with the weight $(1-\cos\theta)\propto q^2$ for momentum relaxation (the "transport" factor that makes small-angle scattering inefficient), and the Bose factor $n(n+1)$ from absorption plus emission. At low $T$ the integral up to $x=\Theta/T$ converges to a constant, leaving the prefactor $T^5$. At high $T$ the integrand is $\sim x^3$, the integral $\sim(\Theta/T)^4/4$, and $\rho\propto T$. Combining with cm-2.7: $\rho=\rho_0+\rho_{ph}(T)$.`,
      caption: String.raw`**Left:** the integrand $x^5/[(e^x-1)(1-e^{-x})]$ in the scattering rate; the shaded area up to $x_{\max}=\Theta/T$ is the resistivity. At low $T$ the cut-off lies beyond the peak and nothing is gained by raising it; at high $T$ only the small-$x$ region counts. **Right:** $\rho(T)/\rho(\Theta)$ on log axes with the $T^5$ and $T$ asymptotes; drag $T$ and read the local exponent. Presets set $\Theta$ for sodium ($158$ K) and copper ($343$ K), low-temperature values from Kittel's table; the curves are the model, no data are overlaid.`,
      scope: String.raw`Free-electron-like metals with a spherical Fermi surface, a single acoustic Debye branch and no Umklapp electron–phonon processes; real transition metals (s–d scattering, $T^3$ Bloch–Wilson), anisotropic Fermi surfaces and metals with large Umklapp contributions deviate. The exponent $n=5$ is Bloch's value for these assumptions.`,
      deps: ['cm-3.5', 'cm-2.7', 'thermo-9.13'],
      refs: ['Ashcroft–Mermin ch. 26'],
      tags: ['resistivity', 'electron-phonon', 'bloch-gruneisen'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bloch%E2%80%93Gr%C3%BCneisen_temperature' },
      viz(v) {
        const th = v.slider('$\\Theta$ (K)', 50, 500, 343, { step: 1 });
        const pre = v.select('preset', ['Na', 'Cu', 'custom'], 'Cu', { onChange: (x) => { if (x === 'Na') th.set(158); else if (x === 'Cu') th.set(343); } });
        const Ts = v.slider('temperature $T/\\Theta$', 0.02, 2, 0.3, { log: true, sig: 2 });
        const r0 = v.slider('residual $\\rho_0/\\rho(\\Theta)$ (Matthiessen)', 0, 0.3, 0, { step: 0.005 });
        const f = (x) => (x < 1e-6 ? x ** 3 : x ** 5 / ((Math.exp(x) - 1) * (1 - Math.exp(-x))));
        const sI = v.stage({ x: [0, 14], y: [0, 24], axes: 'box', gutter: true, height: 340, xlabel: '$x=\\hbar\\omega/k_BT$', ylabel: 'integrand', title: 'integrand and cut-off $x_{\\max}=\\Theta/T$', weight: 1 });
        const sR = v.stage({ x: [0.02, 2], y: [1e-4, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: '$T/\\Theta$', ylabel: '$\\rho(T)/\\rho(\\Theta)$', title: 'resistivity', weight: 1 });
        v.legend([['accent', '$\\rho_{ph}+\\rho_0$'], ['green', '$\\propto T^5$', { dash: true }], ['orange', '$\\propto T$', { dash: true }]]);
        v.render(() => {
          const t = Ts.value, xm = 1 / t, rz = r0.value;
          sI.fn(f, { color: 'ink', width: 1.6, domain: [0.001, 14], n: 400 });
          sI.fn(f, { color: 'accent', width: 0, fill: true, fillAlpha: 0.3, base: 0, domain: [0.001, Math.min(14, xm)], n: 300 });
          sI.vline(Math.min(14, xm), { color: 'orange', width: 2 });
          sI.text('area $\\propto\\rho_{ph}$', 6.2, 12, { size: 12, color: 'accent' });
          const tot = (T) => bgRho(T, 1) + rz;
          sR.fn(tot, { color: 'accent', width: 2.6, domain: [0.02, 2], n: 200 });
          sR.fn((T) => bgRho(0.1, 1) * (T / 0.1) ** 5, { color: 'green', width: 1.3, dash: [5, 4], domain: [0.02, 0.4] });
          sR.fn((T) => bgRho(1.5, 1) * (T / 1.5), { color: 'orange', width: 1.3, dash: [5, 4], domain: [0.3, 2] });
          sR.dot(t, tot(t), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const t = Ts.value, e = 0.01, p = (Math.log(bgRho(t * (1 + e), 1)) - Math.log(bgRho(t * (1 - e), 1))) / (Math.log(1 + e) - Math.log(1 - e));
          return `$T=${v.fix(t * th.value, 0)}$ K ($T/\\Theta=${v.fix(t, 3)}$): $\\rho_{ph}/\\rho_{ph}(\\Theta)=${v.fix(bgRho(t, 1), 4)}$ · local exponent $d\\ln\\rho_{ph}/d\\ln T=${v.fix(p, 2)}$ (→ 5 at low $T$, → 1 at high $T$) · with $\\rho_0$: total $${v.fix(bgRho(t, 1) + r0.value, 4)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Phenomenon',
      name: 'Dislocations and the weakness of real crystals',
      credit: 'Orowan, Polanyi & Taylor, 1934',
      statement: String.raw`Shearing a perfect crystal by sliding one whole plane over another requires a stress of the order of the ideal shear strength $\tau_{\rm ideal}\approx G/2\pi$ ($G$ the shear modulus), thousands of megapascals for a metal; real crystals deform at a thousand times less. Plastic flow is carried by **line defects**. An **edge dislocation**, an extra half-plane of atoms ending in the crystal with Burgers vector $\mathbf b$ perpendicular to the line, moves under shear by a one-row-at-a-time rearrangement of bonds, which needs only the **Peierls–Nabarro stress** $\tau_P\sim\dfrac{2G}{1-\nu}\,e^{-2\pi W/b}$, with width $W$ of the core, exponentially small for wide cores.`,
      idea: String.raw`Slip of a whole plane breaks every bond across the plane at once, so the restoring stress follows $\tau=\frac{G}{2\pi}\sin(2\pi s/b)$ (the sinusoidal estimate, with $s$ the slip) and its peak is the ideal strength. A dislocation concentrates the misfit in one place: the lattice around it carries the Volterra elastic field, so moving the core by one lattice spacing shifts atoms by only a fraction of $b$ and breaks bonds only near the core, and the energy barrier per step (the Peierls barrier) is exponentially small if the core is wide. Dislocations are produced in the crystal when it forms or deforms, and their motion, multiplication and tangling underlie ductility and work hardening.`,
      caption: String.raw`A square-lattice crystal containing one edge dislocation (the elastic displacement field of Volterra is added to every atomic position; bonds are coloured by strain: red compressed, blue stretched). **Drag the core** (gold) along its glide plane: the extra half-plane moves with it and far from the core the bonds are strained by only a few percent. Switch to **rigid slip** and push the whole top half over the bottom: every bond across the plane is stretched at the same moment. The bars compare the stress needed for rigid slip, the Peierls–Nabarro estimate and the typical yield stress of a metal crystal.`,
      scope: String.raw`Isotropic linear elasticity; the displacement field is the continuum solution, accurate away from the core and not relaxed near it. The Peierls–Nabarro prefactor and the definition of the width $W$ differ between authors by a factor of two in the exponent; the point is its exponential sensitivity. The yield-stress range $0.5$–$10$ MPa for metal crystals is as given on Wikipedia's dislocation page (secondary), not specific to any metal.`,
      deps: ['xtal-1.1'],
      refs: ['Kittel ch. 21', 'Ashcroft–Mermin ch. 30'],
      tags: ['dislocation', 'plasticity', 'peierls-nabarro'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dislocation' },
      verify: true,
      viz(v) {
        const mode = v.select('deformation', [{ value: 'disl', label: 'edge dislocation glide' }, { value: 'slip', label: 'rigid slip of the top half' }], 'disl');
        const sS = v.slider('slip $s/b$ (rigid case)', 0, 1, 0.25, { step: 0.005 });
        const nu = v.slider('Poisson ratio $\\nu$', 0, 0.45, 0.3, { step: 0.01 });
        const wS = v.slider('core width $W/b$', 0.3, 4, 1.2, { step: 0.05, log: true, sig: 2 });
        const NX = 13, NY = 8; // atoms: x in [−6, 6] b, rows y = (j + ½) b, j = −4 … 3
        const sC = v.stage({ x: [-7, 7], y: [-4.5, 4.5], equal: true, axes: false, height: 400, title: 'two-dimensional crystal', weight: 1.4 });
        const sB = v.stage({ x: [0.3, 3.7], y: [1e-6, 1], ylog: true, axes: 'box', gutter: true, height: 400, ylabel: 'stress $\\tau/G$', title: 'stress needed to slip', weight: 0.8, xticks: [[1, 'ideal'], [2, 'dislocation'], [3, 'observed']] });
        v.legend([['orange', 'glide plane', { dash: true }], ['red', 'compressed bond'], ['blue', 'stretched bond'], ['gold', 'dislocation core']]);
        const hd = sC.handle(-1.2, 0, { color: 'gold', r: 8, constrain: 'x' });
        const disp = (x, y, x0, nuv) => { const dx = x - x0, r2 = dx * dx + y * y; if (r2 < 1e-6) return [0, 0]; const th = Math.atan2(y, dx), k = 1 / (4 * (1 - nuv)); return [(1 / (2 * PI)) * (th + (dx * y) / (2 * (1 - nuv) * r2)), -(1 / (2 * PI)) * ((1 - 2 * nuv) * k * Math.log(r2) + (k * (dx * dx - y * y)) / r2)]; };
        v.render(() => {
          const x0 = hd.x, nuv = nu.value, pos = [], slipMode = mode.value === 'slip', s = sS.value; hd.visible = !slipMode; hd.set(Math.max(-4, Math.min(4, hd.x)), 0);
          for (let j = 0; j < NY; j++) { const row = []; for (let i = 0; i < NX; i++) { const X = i - 6, Y = j - 3.5; let u = [0, 0]; if (slipMode) u = [Y > 0 ? s : 0, 0]; else { const d = disp(X, Y, x0, nuv); u = [d[0], d[1]]; } row.push([X + u[0], Y + u[1]]); } pos.push(row); }
          const bond = (a, b) => { const len = Math.hypot(a[0] - b[0], a[1] - b[1]); const c = len > 1 ? 'blue' : 'red'; const e = Math.min(1, Math.abs(len - 1) * 8); sC.line(a[0], a[1], b[0], b[1], { color: e < 0.12 ? 'muted' : c, width: 1.2 + 2.5 * e, alpha: e < 0.12 ? 0.6 : 0.45 + 0.55 * e }); };
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
            if (i + 1 < NX) bond(pos[j][i], pos[j][i + 1]);
            if (j + 1 < NY && j !== 3) bond(pos[j][i], pos[j + 1][i]);
            if (j === 3) { // across the glide plane each atom bonds to the nearest atom of the row above (the partner shifts by one column near the dislocation)
              let bi = -1, bd = 9; for (let k = Math.max(0, i - 2); k <= Math.min(NX - 1, i + 2); k++) { const d = Math.hypot(pos[3][i][0] - pos[4][k][0], pos[3][i][1] - pos[4][k][1]); if (d < bd) { bd = d; bi = k; } }
              if (bi >= 0 && bd < 1.3) bond(pos[3][i], pos[4][bi]);
            }
          }
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) sC.dot(pos[j][i][0], pos[j][i][1], { r: 4.5, color: 'accent' });
          sC.hline(0, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.6 }); 
          if (!slipMode) sC.text('⊥', x0, -0.55, { size: 14, color: 'gold', align: 'center' });
          const ideal = 1 / (2 * PI), pn = (2 / (1 - nuv)) * Math.exp(-2 * PI * wS.value), obs = [0.5e6 / 40e9, 10e6 / 40e9];
          sB.rect(0.7, 1e-6, 1.3, ideal, { color: 'red', fill: 'red', fillAlpha: 0.35 });
          sB.rect(1.7, 1e-6, 2.3, Math.max(pn, 2e-6), { color: 'accent', fill: 'accent', fillAlpha: 0.35 });
          sB.rect(2.7, obs[0], 3.3, obs[1], { color: 'green', fill: 'green', fillAlpha: 0.3 });
          sB.text('$G/2\\pi$', 1, ideal * 1.6, { size: 11, color: 'red', align: 'center' }); sB.text('$\\tau_P$', 2, Math.max(pn, 1.5e-6) * 1.8, { size: 11, color: 'accent', align: 'center' });
        });
        v.readout(() => {
          const nuv = nu.value, pn = (2 / (1 - nuv)) * Math.exp(-2 * PI * wS.value), slipMode = mode.value === 'slip', s = sS.value;
          const g = `ideal $G/2\\pi=0.159\\,G$ · $\\tau_P/G=${v.sci(pn, 2)}$ for $W/b=${v.fix(wS.value, 2)}$, $\\nu=${v.fix(nuv, 2)}$ (a ${v.fix(0.159 / pn, 0)}-fold reduction) · yield range $0.5$–$10$ MPa, i.e. $\\tau/G\\approx10^{-5}$–$10^{-4}$ for $G\\sim40$ GPa (illustrative)`;
          return slipMode ? `rigid slip $s=${v.fix(s, 3)}\\,b$: restoring stress $\\tau=\\frac{G}{2\\pi}\\sin(2\\pi s/b)=${v.fix(Math.sin(2 * PI * s) / (2 * PI), 3)}\\,G$ on **all** bonds across the plane at once\n${g}` : `dislocation core at $x=${v.fix(hd.x, 2)}\\,b$: the pattern moved with it; away from the core every bond is strained by only a few percent\n${g}`;
        });
      },
    },
  ],
};
