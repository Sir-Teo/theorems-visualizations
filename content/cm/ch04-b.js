// Condensed Matter Physics — Chapter 4: Semiconductors and devices (items 4.7–4.12; 4.1–4.6 in ch04.js)
import { PI, KB, Q, EPS0, MAT, eg, niB, pnEquilibrium, mosModel, wellLevels, wellPsi } from './ch04.shared.js';

const dens = (M) => (x) => { const k = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** k; return (Math.abs(m - 1) < 0.01 ? '' : m.toFixed(1) + '×') + M.pow10Text(k); };
const MOB = { Si: [1350, 480], Ge: [3900, 1900], GaAs: [8500, 400] }; // lightly doped electron/hole mobilities at 300 K, cm²/Vs (textbook values, quoted from memory)
const colOf = (M, nm) => (nm >= 380 && nm <= 780 ? M.wavelengthRGB(nm) : 'muted');

/** Current density (A/cm²) of an ideal-plus-recombination silicon-like diode, with optional series resistance. */
function diodeModel(m, T, Na, Nd, tau, Rs) {
  const Vt = KB * T, ni = niB(m, T), [mun, mup] = MOB[m.name], Dn = mun * Vt, Dp = mup * Vt, Ln = Math.sqrt(Dn * tau), Lp = Math.sqrt(Dp * tau);
  const J0 = Q * ni * ni * (Dp / (Lp * Nd) + Dn / (Ln * Na)), eps = m.eps * EPS0, Vbi = Vt * Math.log((Na * Nd) / (ni * ni)), W0 = Math.sqrt((2 * eps * Vbi * (1 / Na + 1 / Nd)) / Q);
  const Wj = (Vj) => W0 * Math.sqrt(Math.max(0.03, 1 - Vj / Vbi));
  const Jid = (Vj) => J0 * Math.expm1(Math.min(Vj / Vt, 600));
  const Jrec = (Vj) => ((Q * ni * Wj(Vj)) / (2 * tau)) * Math.expm1(Math.min(Vj / (2 * Vt), 600));
  const Jjunc = (Vj, rec) => Jid(Vj) + (rec ? Jrec(Vj) : 0);
  const Vjof = (V, rec, rs) => { if (!rs || Rs <= 0) return V; let lo = -4, hi = Math.max(V, 0) + 0.2; for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (mid + Rs * Jjunc(mid, rec) > V) hi = mid; else lo = mid; } return (lo + hi) / 2; };
  return { Vt, ni, J0, Ln, Lp, Vbi, W0, Wj, Jid, Jrec, Jjunc, Vjof, J: (V, rec, rs) => Jjunc(Vjof(V, rec, rs), rec) };
}

export default {
  collection: 'cm',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'The p–n junction',
      credit: 'Ohl, 1940 (first junction); Shockley, 1949 (theory)',
      statement: String.raw`When $p$-type material (acceptors $N_a$) is joined to $n$-type material (donors $N_d$), electrons diffuse into the $p$ side and holes into the $n$ side and leave behind uncompensated ions. The resulting **depletion layer** carries a space charge and an electric field that stops the diffusion at equilibrium, where the Fermi level is flat across the junction and the bands bend by the **built-in potential**
$$V_{bi}=\frac{k_BT}{e}\ln\frac{N_aN_d}{n_i^2}.$$
In the depletion approximation (mobile carriers absent over $-x_p<x<x_n$, neutral outside), Poisson's equation gives
$$x_n=W\frac{N_a}{N_a+N_d},\quad x_p=W\frac{N_d}{N_a+N_d},\quad W=\sqrt{\frac{2\varepsilon V_{bi}}{e}\Bigl(\frac1{N_a}+\frac1{N_d}\Bigr)},\quad E_{\max}=\frac{eN_dx_n}{\varepsilon},$$
so the layer extends mostly into the lightly doped side.`,
      idea: String.raw`In equilibrium the drift current driven by the built-in field cancels the diffusion current of each carrier species, which is the Einstein relation (cm-4.6) applied across the junction; equivalently the chemical potential is constant, so the band edges must shift by the difference of the two bulk chemical potentials, $V_{bi}$. Charge neutrality demands equal total ionic charge on the two sides, $N_ax_p=N_dx_n$. Integrating Gauss's law (vcalc-9.4, Poisson's equation) once across a uniformly charged slab gives the triangular field; integrating again gives the parabolic band bending whose total height must be $V_{bi}$, which fixes $W$.`,
      caption: String.raw`The equation $\psi''=(2\sinh\psi-C(x)/n_i)/\lambda^2$ for the potential is solved **numerically** on a grid (Newton's method), with exact Boltzmann carriers and no assumption of an abrupt depletion edge. **Left:** band diagram with $E_c$, $E_i$, $E_v$ and the flat Fermi level. **Right:** the net charge density $\rho/e=p-n+N_d-N_a$ (blue positive, red negative) and the field $E(x)$ (gold), each scaled to its own peak. Dashed: the depletion approximation. Move the doping sliders: the layer spreads into the lighter side, $V_{bi}$ rises only logarithmically, and with doping near $10^{18}$ cm$^{-3}$ the bands bend by most of the gap.`,
      scope: String.raw`Abrupt step junction, equilibrium (no applied bias), Boltzmann statistics (valid for doping below $\sim10^{18}$–$10^{19}$ cm$^{-3}$; heavier doping degenerates), complete ionization, $T=300$ K, one-dimensional geometry. The depletion approximation is accurate to about the Debye length of the more lightly doped side.`,
      deps: ['cm-4.6', 'vcalc-9.4'],
      refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 8'],
      tags: ['p-n junction', 'depletion', 'built-in potential'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/P%E2%80%93n_junction' },
      viz(v) {
        const mat = v.select('material', [{ value: 'Si', label: 'Si' }, { value: 'Ge', label: 'Ge' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const Nas = v.slider('acceptors $N_a$ (cm$^{-3}$)', 1e14, 1e19, 1e16, { log: true, fmt: dens(v.M) });
        const Nds = v.slider('donors $N_d$ (cm$^{-3}$)', 1e14, 1e19, 1e16, { log: true, fmt: dens(v.M) });
        const ap = v.toggle('show the depletion approximation', true);
        const sB = v.stage({ x: [-1, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 360, xlabel: 'position $x$ (µm)', ylabel: 'energy $E-E_F$ (eV)', title: 'band diagram', weight: 1.1 });
        const sR = v.stage({ x: [-1, 1], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 360, xlabel: 'position $x$ (µm)', ylabel: 'scaled $\\rho/e$ and $E$', title: 'space charge and electric field', weight: 1 });
        v.legend([['accent', '$E_c$'], ['green', '$E_v$'], ['muted', '$E_i$', { dash: true }], ['gold', 'Fermi level'], ['blue', '$\\rho>0$ (donor ions)'], ['red', '$\\rho<0$ (acceptor ions)'], ['orange', '$E(x)$']]);
        let key = '', S = null, info = {};
        v.render(() => {
          const k = `${mat.value}|${Nas.value}|${Nds.value}`;
          if (k !== key) { key = k; S = pnEquilibrium(MAT[mat.value], 300, Nas.value, Nds.value); }
          const m = MAT[mat.value], Eg = eg(m, 300), kT = S.kT, N = S.x.length, w = 2.1 * Math.max(S.xn, S.xp);
          sB.setView([-w, w], [-(Eg / 2 + S.Vbi / 2 + 0.35), Eg / 2 + S.Vbi / 2 + 0.35]); sR.setView([-w, w], [-1.25, 1.25]);
          const pts = (f) => { const a = []; for (let i = 0; i < N; i++) if (Math.abs(S.x[i]) <= w * 1.05) a.push([S.x[i], f(i)]); return a; };
          const Ei = (i) => -kT * S.psi[i];
          sB.path(pts((i) => Ei(i) + Eg / 2), { color: 'accent', width: 2.8 }); sB.path(pts((i) => Ei(i) - Eg / 2), { color: 'green', width: 2.8 }); sB.path(pts(Ei), { color: 'muted', width: 1.2, dash: [4, 4] });
          sB.hline(0, { color: 'gold', width: 1.6 });
          if (ap.value) sB.vband(-S.xp, S.xn, { color: 'orange', alpha: 0.12 });
          sB.text('$p$-type', -w * 0.55, -(Eg / 2 + S.Vbi / 2 + 0.2), { size: 12, color: 'red', align: 'center' }); sB.text('$n$-type', w * 0.55, Eg / 2 + S.Vbi / 2 + 0.2, { size: 12, color: 'blue', align: 'center', baseline: 'top' });
          // charge density and field
          const rho = new Float64Array(N), E = new Float64Array(N); let rmax = 0, emax = 0;
          for (let i = 0; i < N; i++) rho[i] = S.ni * (Math.exp(-S.psi[i]) - Math.exp(S.psi[i]) + S.C[i]);
          for (let i = 1; i < N - 1; i++) { E[i] = (-(kT) * (S.psi[i + 1] - S.psi[i - 1])) / ((S.x[i + 1] - S.x[i - 1]) * 1e-4); if (Math.abs(S.x[i]) <= w) { rmax = Math.max(rmax, Math.abs(rho[i])); emax = Math.max(emax, Math.abs(E[i])); } }
          sR.hline(0, { color: 'faint', width: 1 });
          for (let i = 0; i < N - 1; i++) if (Math.abs(S.x[i]) <= w) { const r = rho[i] / rmax; if (Math.abs(r) > 0.004) sR.poly([[S.x[i], 0], [S.x[i], r], [S.x[i + 1], rho[i + 1] / rmax], [S.x[i + 1], 0]], { fill: r > 0 ? 'blue' : 'red', fillAlpha: 0.55, stroke: false }); }
          sR.path(pts((i) => E[i] / emax), { color: 'orange', width: 2.6 });
          const Eapx = (Q * Nds.value * S.xn * 1e-4) / S.eps;
          if (ap.value) {
            const big = Math.max(Nds.value, Nas.value);
            sR.path([[-w, 0], [-S.xp, 0], [-S.xp, -Nas.value / big], [0, -Nas.value / big], [0, Nds.value / big], [S.xn, Nds.value / big], [S.xn, 0], [w, 0]], { color: 'ink', width: 1.3, dash: [4, 4] });
            sR.path([[-w, 0], [-S.xp, 0], [0, -Eapx / emax], [S.xn, 0], [w, 0]], { color: 'ink', width: 1.3, dash: [4, 4] });
          }
          sR.text('$\\rho/e$ (relative)', -w * 0.97, 1.08, { size: 11, color: 'muted' }); sR.text('$E(x)$ (points from $n$ to $p$)', w * 0.1, -1.12, { size: 11, color: 'orange' });
          info = { Vnum: (S.psi[N - 1] - S.psi[0]) * kT, emax, Eapx, Eg, m };
        });
        v.readout(() => {
          if (!S) return '';
          const I = info;
          return `$V_{bi}=${v.fix(S.Vbi, 3)}$ V (numerical total band bending $${v.fix(I.Vnum, 3)}$ V) · depletion approximation: $W=${v.fix(S.W, 3)}\\ \\mu$m with $x_p=${v.fix(S.xp, 3)}$, $x_n=${v.fix(S.xn, 3)}\\ \\mu$m\n$E_{\\max}$: numerical $${v.sci(I.emax, 2)}$ V/cm vs approximation $${v.sci(I.Eapx, 2)}$ V/cm · intrinsic Debye length $\\lambda=${v.fix(S.lam, 0)}\\ \\mu$m · bulk $E_c-E_F$ on the $n$ side: $${v.fix(I.Eg / 2 - S.kT * Math.log(Nds.value / S.ni), 3)}$ eV`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Law',
      name: 'Shockley diode equation',
      credit: 'Shockley, 1949',
      statement: String.raw`For a $p$–$n$ junction with applied forward voltage $V$ (positive on the $p$ side) in low injection, the current density is
$$J=J_0\left(e^{eV/k_BT}-1\right),\qquad J_0=en_i^2\left(\frac{D_p}{L_pN_d}+\frac{D_n}{L_nN_a}\right),\quad L=\sqrt{D\tau}.$$
It rises exponentially (a factor $10$ for every $k_BT\ln10/e\approx60$ mV at 300 K) in forward bias and saturates at $-J_0$ in reverse. The reverse saturation current $J_0\propto n_i^2$ grows rapidly with temperature, like $e^{-E_g/k_BT}$. Real diodes also show a recombination current of the depletion region $\propto e^{eV/2k_BT}$ at low bias, and are limited by series resistance at high bias.`,
      idea: String.raw`The bias does not change the built-in field's job in the neutral regions but lowers the barrier to $V_{bi}-V$, so the product of the densities at the edges of the depletion region becomes $np=n_i^2e^{eV/k_BT}$ (the quasi-Fermi levels split by $eV$ and stay flat across the thin depletion layer, cm-4.3). The minority carriers injected into the neutral regions, $\Delta n_p=n_{p0}(e^{eV/k_BT}-1)$, diffuse and recombine over their diffusion length $L$ (Fick's law with Einstein's $D=\mu k_BT/e$, cm-4.6), and the current at the depletion edge is $eD\,\Delta n_p/L$. Adding electrons and holes gives the formula. Carriers generated in the depletion layer and lost to recombination there add the $e^{eV/2k_BT}$ term.`,
      caption: String.raw`Drag the **bias** handle on the current–voltage plot (log scale, $|J|$ against $V$; reverse currents are dashed). **Left:** the band diagram of the junction under that bias, to scale in the depletion region: the barrier shrinks by $V$, the quasi-Fermi levels $F_n$, $F_p$ split by $eV$ over the depletion layer and merge again over a diffusion length (drawn compressed, not to scale). Choose the **model**: ideal Shockley gives a straight line of slope $60$ mV per decade; adding depletion-layer recombination bends the low-bias part to $120$ mV per decade; adding series resistance flattens the top. The readout gives the local ideality factor $n=(dV/d\ln J)/V_T$.`,
      scope: String.raw`Abrupt junction, low-level injection, narrow-base-free "long diode" ($L$ much shorter than the contact distance), uniform lifetime $\tau$ and constant mobilities $\mu_n,\mu_p$ (lightly-doped textbook values: Si $1350/480$, Ge $3900/1900$, GaAs $8500/400$ cm$^2$/Vs, from memory); recombination current in the Sah–Noyce–Shockley form $\tfrac{en_iW}{2\tau}(e^{eV/2k_BT}-1)$ with $W(V)$ from the depletion approximation. Breakdown, high-level injection and tunnelling are not modelled.`,
      deps: ['cm-4.7'],
      refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 8'],
      tags: ['diode', 'rectification', 'quasi-fermi levels'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley_diode_equation' },
      verify: true,
      viz(v) {
        const mat = v.select('material', [{ value: 'Si', label: 'Si' }, { value: 'Ge', label: 'Ge' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const model = v.select('model', [{ value: 'ideal', label: 'ideal (Shockley)' }, { value: 'rec', label: '+ depletion recombination' }, { value: 'rs', label: '+ series resistance' }], 'ideal');
        const Ts = v.slider('temperature $T$ (K)', 250, 400, 300, { step: 5 });
        const Nas = v.slider('acceptors $N_a$ (cm$^{-3}$)', 1e14, 1e18, 1e16, { log: true, fmt: dens(v.M) });
        const Nds = v.slider('donors $N_d$ (cm$^{-3}$)', 1e14, 1e18, 1e16, { log: true, fmt: dens(v.M) });
        const taus = v.slider('lifetime $\\tau$ (s)', 1e-9, 1e-5, 1e-6, { log: true, fmt: (x) => v.M.pow10Text(Math.round(Math.log10(x))) });
        const Rss = v.slider('series resistance $R_s$ ($\\Omega$ cm$^2$)', 0.01, 10, 1, { log: true, sig: 2 });
        const sB = v.stage({ x: [-1, 1], y: [-0.6, 1.6], axes: 'box', gutter: true, height: 360, xlabel: 'position (µm, depletion region to scale)', ylabel: 'energy (eV)', title: 'junction under bias', weight: 1 });
        const sJ = v.stage({ x: [-1, 1.2], y: [1e-16, 1e4], ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'applied voltage $V$ (V)', ylabel: '$|J|$ (A/cm$^2$)', title: 'current–voltage characteristic', weight: 1.1 });
        const cur = () => diodeModel(MAT[mat.value], Ts.value, Nas.value, Nds.value, taus.value, Rss.value);
        const h = sJ.handle(0.45, 1e-6, { color: 'gold', r: 7, constrain: (x) => { const V = Math.max(-1, Math.min(1.2, x)); const D = cur(); return [V, Math.max(D.lo * 0.2, Math.abs(D.J(V, model.value !== 'ideal', model.value === 'rs')) || D.lo)]; } });
        v.legend([['accent', 'ideal'], ['orange', '+ recombination'], ['ink', 'with series $R_s$'], ['gold', 'bias'], ['purple', '$F_n$'], ['pink', '$F_p$']]);
        let info = {};
        v.render(() => {
          const D = cur(), m = MAT[mat.value], rec = model.value !== 'ideal', rs = model.value === 'rs', Vt = D.Vt;
          D.lo = Math.pow(10, Math.floor(Math.log10(Math.max(1e-30, D.J0 * 0.5))) - 1); sJ.setView([-1, 1.2], [Math.max(D.lo, 1e-28), 1e4]);
          const seg = (f, c, wd, al) => { const neg = [], pos = []; for (let i = 0; i <= 160; i++) { const V = -1 + (2.2 * i) / 160, J = Math.abs(f(V)); (V <= 0 ? neg : pos).push([V, Math.max(J, 1e-40)]); } sJ.path(neg, { color: c, width: wd, alpha: al * 0.6, dash: [4, 4] }); sJ.path(pos, { color: c, width: wd, alpha: al }); };
          seg((V) => D.Jid(V), 'accent', model.value === 'ideal' ? 3 : 1.6, model.value === 'ideal' ? 1 : 0.55);
          if (rec) seg((V) => D.Jjunc(V, true), 'orange', model.value === 'rec' ? 3 : 1.6, model.value === 'rec' ? 1 : 0.55);
          if (rs) seg((V) => D.J(V, true, true), 'ink', 3, 1);
          const V = h.x, Jv = D.J(V, rec, rs); h.set(V, Math.max(1e-40, Math.abs(Jv)));
          const Vj = D.Vjof(V, rec, rs);
          // band diagram (depletion approximation at the junction voltage Vj)
          const Eg = eg(m, Ts.value), Vbi = D.Vbi, W = D.Wj(Vj) * 1e4, xn = (W * Nas.value) / (Nas.value + Nds.value), xp = (W * Nds.value) / (Nas.value + Nds.value);
          const phiP = Vt * Math.log(Nas.value / D.ni), phiN = Vt * Math.log(Nds.value / D.ni), EcP = phiP + Eg / 2, EvP = phiP - Eg / 2, bar = Math.max(0.02, Vbi - Vj), EcN = EcP - bar;
          const w0 = D.Wj(0) * 1e4, wv = 2.6 * w0; sB.setView([-wv, wv], [Math.min(EvP, EcN - Eg) - 0.3, EcP + 0.35]);
          const A = (Q * Nas.value) / (2 * m.eps * EPS0) * 1e-8, B = (Q * Nds.value) / (2 * m.eps * EPS0) * 1e-8; // V/µm²
          const Ecx = (x) => { if (x <= -xp) return EcP; if (x >= xn) return EcN; return x <= 0 ? EcP - A * (x + xp) * (x + xp) : EcN + B * (xn - x) * (xn - x); };
          const xs = Array.from({ length: 241 }, (_, i) => -wv + (2 * wv * i) / 240);
          sB.vband(-xp, xn, { color: 'orange', alpha: 0.12 });
          sB.path(xs.map((x) => [x, Ecx(x)]), { color: 'accent', width: 2.8 }); sB.path(xs.map((x) => [x, Ecx(x) - Eg]), { color: 'green', width: 2.8 });
          // quasi-Fermi levels: F_n = V_j on the n side and across the depletion layer, relaxing to 0 on the p side; F_p the reverse (decay drawn compressed)
          const ell = 0.5 * wv;
          sB.path(xs.map((x) => [x, x < -xp ? Vj * Math.exp((x + xp) / ell) : Vj]), { color: 'purple', width: 2.2 });
          sB.path(xs.map((x) => [x, x > xn ? Vj * (1 - Math.exp(-(x - xn) / ell)) : 0]), { color: 'pink', width: 2.2 });
          sB.text('$F_n$', wv * 0.78, Vj + 0.07, { size: 12, color: 'purple' }); sB.text('$F_p$', -wv * 0.78, -0.09, { size: 12, color: 'pink', baseline: 'top' });
          sB.text('quasi-Fermi levels relax over $L_{n,p}\\gg W$ (compressed)', 0, EcP + 0.22, { size: 10, color: 'muted', align: 'center' });
          sB.text(`barrier $e(V_{bi}-V_j)=${bar.toFixed(2)}$ eV`, 0, EvP - 0.18 - Math.max(0, EcP - EcN - Eg), { size: 10, color: 'muted', align: 'center', baseline: 'top' });
          info = { Vj, Jv, Vbi, W, D, bar };
        });
        v.readout(() => {
          const I = info; if (!I.D) return '';
          const D = I.D, rec = model.value !== 'ideal', rs = model.value === 'rs';
          const V = h.x, dV = 0.002, J1 = Math.abs(D.J(V - dV, rec, rs)), J2 = Math.abs(D.J(V + dV, rec, rs)), nid = J1 > 0 && J2 > J1 ? (2 * dV) / (Math.log(J2) - Math.log(J1)) / D.Vt : NaN;
          return `$V=${v.fix(V, 3)}$ V ($V_j=${v.fix(I.Vj, 3)}$ V across the junction) · $J=${v.sci(Math.abs(I.Jv), 2)}$ A/cm$^2$ ${V < 0 ? '(reverse)' : '(forward)'} · $J_0=${v.sci(D.J0, 2)}$ A/cm$^2$ · local ideality factor $n=${isNaN(nid) ? '—' : v.fix(nid, 2)}$\n$k_BT/e=${v.fix(1000 * D.Vt, 1)}$ mV → ideal slope $${v.fix(1000 * D.Vt * Math.LN10, 1)}$ mV per decade · $V_{bi}=${v.fix(D.Vbi, 3)}$ V, $W=${v.fix(I.W, 3)}\\ \\mu$m · diffusion lengths $L_n=${v.fix(D.Ln * 1e4, 0)}$, $L_p=${v.fix(D.Lp * 1e4, 0)}\\ \\mu$m`;
        });
      },
    },
  ],
};
