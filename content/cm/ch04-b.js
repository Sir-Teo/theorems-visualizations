// Condensed Matter Physics — Chapter 4: Semiconductors and devices (items 4.7–4.12; 4.1–4.6 in ch04.js)
import { PI, KB, Q, EPS0, MAT, eg, niB, pnEquilibrium, mosModel, wellLevels, wellPsi } from './ch04.shared.js';

const dens = (M) => (x) => { const k = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** k; return (Math.abs(m - 1) < 0.01 ? '' : m.toFixed(1) + '×') + M.pow10Text(k); };
const MOB = { Si: [1350, 480], Ge: [3900, 1900], GaAs: [8500, 400] }; // lightly doped electron/hole mobilities at 300 K, cm²/Vs (textbook values, quoted from memory)
const HB = 0.0380998 * Math.PI ** 2; // ħ²π²/2m0 in eV nm²
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
      caption: String.raw`The equation $\psi''=(2\sinh\psi-C(x)/n_i)/\lambda^2$ for the potential is solved **numerically** on a grid (Newton's method), with exact Boltzmann carriers and no assumption of an abrupt depletion edge. **Left:** band diagram with $E_c$, $E_i$, $E_v$ and the flat Fermi level. **Right:** the net charge density $\rho/e=p-n+N_d-N_a$ (blue positive, red negative) and the field $E(x)$ (orange), each scaled to its own peak. Dashed: the depletion approximation. Move the doping sliders: the layer spreads into the lighter side, $V_{bi}$ rises only logarithmically, and with doping near $10^{18}$ cm$^{-3}$ the bands bend by most of the gap.`,
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
          sB.text('$F_n$', wv * 0.78, Vj + 0.07, { size: 12, color: 'purple' }); sB.text('$F_p$', -wv * 0.6, 0.07, { size: 12, color: 'pink' });
          sB.text('quasi-Fermi levels relax over $L_{n,p}\\gg W$ (compressed)', 0, EcP + 0.27, { size: 10, color: 'muted', align: 'center' });
          sB.text(`barrier $e(V_{bi}-V_j)=${bar.toFixed(2)}$ eV`, 0, EcP + 0.12, { size: 10, color: 'muted', align: 'center' });
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

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Invention',
      name: 'Light-emitting diodes',
      credit: 'Round, 1907 (electroluminescence of SiC); Losev, 1920s; Holonyak, 1962 (red GaAsP); Nakamura, Akasaki & Amano, 1990s (blue GaN, Nobel Prize 2014)',
      statement: String.raw`A **light-emitting diode** is a forward-biased $p$–$n$ junction (usually a double heterostructure) in which injected electrons and holes recombine in a thin active layer and the recombination energy leaves as a photon of energy $h\nu\approx E_g$, so the colour is set by the band gap, $\lambda\,[\text{nm}]\approx1239.8/E_g\,[\text{eV}]$. The fraction of injected carriers that give photons is the **internal quantum efficiency**, in the ABC model
$$\eta_{\text{int}}=\frac{Bn^2}{An+Bn^2+Cn^3},\qquad \frac{J}{e\,d}=An+Bn^2+Cn^3,$$
where $A$ is the rate of non-radiative (defect) recombination, $B$ the radiative coefficient, $C$ the Auger coefficient, $n$ the carrier density in the active layer of thickness $d$. In a **direct**-gap material $B$ is large; in an **indirect**-gap material (Si, Ge, GaP) radiative recombination needs a phonon and $B$ is smaller by $10^{3}$–$10^{5}$, so almost all recombination makes heat.`,
      idea: String.raw`Forward bias injects both carrier types into the active layer (cm-4.8); a heterostructure confines them there at densities far above equilibrium, so the product $np\gg n_i^2$ and recombination is fast. Each recombination of a conduction-band electron with a valence-band hole releases $\approx E_g$. Whether this goes into a photon depends on momentum: the selection rule of cm-4.1 makes the radiative rate $Bnp$ with a small $B$ for indirect gaps, which cannot compete with defect and Auger channels. Efficiency is low at small current (defects: $A n$ wins), peaks where $Bn^2$ dominates, and droops at very high current as the $n^3$ Auger term grows.`,
      caption: String.raw`Set the **band gap** (the preset buttons jump to typical LED materials) and switch between a direct and an indirect gap. **Left:** a forward-biased double heterostructure (schematic, not to scale): electrons (blue) and holes (red, hollow) flow into the active layer and meet; a recombination ends as a **photon** of the colour for that gap (wavy line) with probability $\eta_{\text{int}}$, otherwise as **heat** (orange zigzag, phonons). **Right:** $\eta_{\text{int}}$ against current density $J$ from the ABC model for a direct and an indirect gap. Drag the handle to change $J$: the efficiency peaks and then droops; with the indirect gap it never exceeds a fraction of a per cent.`,
      scope: String.raw`Rate-equation (ABC) model with illustrative coefficients $A=10^{7}\,\text{s}^{-1}$, $C=10^{-30}\,\text{cm}^6/\text{s}$, $B=10^{-10}\,\text{cm}^3/\text{s}$ (direct) and $10^{-14}\,\text{cm}^3/\text{s}$ (indirect), active layer $d=0.1\,\mu$m — orders of magnitude, not fits to any device; the radiative coefficient of silicon is of order $10^{-14}\,\text{cm}^3/\text{s}$ in the literature (quoted from memory). Internal efficiency only: light extraction, injection efficiency and spectral width ($\sim$ a few $k_BT$) are ignored. Gap values for the presets are nominal: GaAs $1.42$ eV, GaAsP (red) $\sim1.9$ eV, InGaN green $\sim2.4$ eV and blue $\sim2.7$ eV.`,
      deps: ['cm-4.8', 'cm-4.1'],
      refs: ['Kittel ch. 17', 'Ashcroft–Mermin ch. 29'],
      tags: ['led', 'electroluminescence', 'recombination'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Light-emitting_diode' },
      verify: true,
      viz(v) {
        const M = v.M;
        const preset = v.select('preset', [{ value: 'custom', label: 'custom' }, { value: 'ir', label: 'GaAs (infrared)' }, { value: 'red', label: 'GaAsP (red)' }, { value: 'green', label: 'InGaN (green)' }, { value: 'blue', label: 'InGaN (blue)' }], 'red');
        const Eg = v.slider('band gap $E_g$ (eV)', 0.7, 3.4, 1.9, { step: 0.01 });
        const typ = v.select('gap type', [{ value: 'direct', label: 'direct' }, { value: 'indirect', label: 'indirect' }], 'direct');
        const PRE = { ir: 1.42, red: 1.9, green: 2.4, blue: 2.7 };
        const A = 1e7, C = 1e-30, B = { direct: 1e-10, indirect: 1e-14 }, d = 1e-5; // d in cm (0.1 µm)
        const solveN = (J, Bc) => { let lo = 1, hi = 1e22; const tgt = J / (Q * d); for (let it = 0; it < 100; it++) { const mid = Math.sqrt(lo * hi); const r = A * mid + Bc * mid * mid + C * mid ** 3; if (r > tgt) hi = mid; else lo = mid; } return Math.sqrt(lo * hi); };
        const iqe = (J, Bc) => { const n = solveN(J, Bc); return (Bc * n * n) / (A * n + Bc * n * n + C * n ** 3); };
        const sD = v.stage({ x: [0, 10], y: [-0.7, 4.1], axes: false, height: 380, title: 'forward-biased double heterostructure', weight: 1.1 });
        const sE = v.stage({ x: [0.1, 1e4], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'current density $J$ (A/cm$^2$)', ylabel: 'internal quantum efficiency', title: 'efficiency against current (ABC model)', weight: 0.9 });
        const hE = sE.handle(30, 0.5, { color: 'gold', r: 7, constrain: (x) => { const J = Math.max(0.1, Math.min(1e4, x)); return [J, iqe(J, B[typ.value])]; } });
        v.legend([['accent', 'direct gap'], ['red', 'indirect gap'], ['gold', 'operating point'], ['blue', 'electron'], ['pink', 'hole']]);
        let last = preset.value, info = {};
        const KP = 12, P = 4.8;
        v.animate((t) => {
          if (preset.value !== last) { last = preset.value; if (PRE[preset.value]) Eg.set(PRE[preset.value]); }
          const E = Eg.value, J = hE.x, Bc = B[typ.value], eta = iqe(J, Bc), lam = 1239.84 / E, rgb = colOf(M, lam), ph = t / P;
          // IQE panel
          for (const key of ['direct', 'indirect']) sE.fn((x) => iqe(x, B[key]), { color: key === 'direct' ? 'accent' : 'red', width: typ.value === key ? 3 : 1.4, alpha: typ.value === key ? 1 : 0.5, domain: [0.1, 1e4] });
          hE.set(J, eta);
          // band diagram
          const w = 0.15, Ecc = E + w, Evc = -w;
          const ln = (c, y0, y1, x0, x1) => sD.line(x0, y0, x1, y1, { color: c, width: 2.6 });
          sD.rect(4, -0.7, 6, 4.1, { fill: 'gold', fillAlpha: 0.07, stroke: false }); sD.text('active layer', 5, 3.85, { size: 11, color: 'muted', align: 'center' });
          ln('accent', Ecc, Ecc, 0, 4); ln('accent', Ecc, E, 4, 4); ln('accent', E, E, 4, 6); ln('accent', E, Ecc, 6, 6); ln('accent', Ecc, Ecc, 6, 10);
          ln('green', Evc, Evc, 0, 4); ln('green', Evc, 0, 4, 4); ln('green', 0, 0, 4, 6); ln('green', 0, Evc, 6, 6); ln('green', Evc, Evc, 6, 10);
          sD.hline(Ecc - 0.05, { color: 'blue', width: 1.2, dash: [4, 4], alpha: 0.7 }); sD.hline(Evc + 0.05, { color: 'pink', width: 1.2, dash: [4, 4], alpha: 0.7 });
          sD.text('$n$-type', 1.2, Ecc + 0.35, { size: 11, color: 'muted', align: 'center' }); sD.text('$p$-type', 8.8, Ecc + 0.35, { size: 11, color: 'muted', align: 'center' });
          sD.text('$E_c$', 0.15, Ecc + 0.08, { size: 11, color: 'accent' }); sD.text('$E_v$', 0.15, Evc - 0.28, { size: 11, color: 'green' });
          sD.measure(6.6, 0, 6.6, E, `$E_g$ = ${E.toFixed(2)} eV`);
          for (let k = 0; k < KP; k++) {
            const f = (ph + k / KP) % 1, rad = ((k + 1) * 0.6180339) % 1 < eta, ym = E / 2, xc = 4.5 + 1.0 * ((k * 0.73) % 1);
            if (f < 0.5) {
              const s = f / 0.5; // carriers approach the recombination point
              const xe = 0.4 + (xc - 0.4) * s, xh = 9.6 + (xc - 9.6) * s;
              sD.dot(xe, xe < 4 ? Ecc - 0.05 : E - 0.05, { r: 5, color: 'blue' }); sD.dot(xh, xh > 6 ? Evc + 0.05 : 0.05, { r: 5, color: 'pink', hollow: true });
            } else {
              const s = (f - 0.5) / 0.5;
              if (rad) { // photon: a short wave packet leaving upward
                const y0 = ym + s * 2.6, xs = xc + ((k % 3) - 1) * 0.3 * s, wave = [];
                for (let i = 0; i <= 18; i++) { const q = i / 18; wave.push([xs + 0.16 * Math.sin(q * 18 - s * 20), y0 + q * 0.55]); }
                sD.path(wave, { color: rgb, width: 2.6, alpha: Math.max(0, 1 - 0.55 * s) });
              } else { // heat: lattice vibrations spreading sideways
                const rr = 0.2 + 0.9 * s, dir = k % 2 ? 1 : -1, zz = [];
                for (let i = 0; i <= 8; i++) zz.push([xc + dir * rr * (i / 8), ym + 0.12 * (i % 2 ? 1 : -1) * (1 - s * 0.6)]);
                sD.path(zz, { color: 'orange', width: 1.6, alpha: Math.max(0, 0.9 - 0.8 * s) });
              }
            }
          }
          info = { E, lam, eta, J, n: solveN(J, Bc), rad: lam >= 380 && lam <= 780 };
        }, { period: P, still: 0.62 * P });
        v.readout(() => {
          const I = info; if (!I.E) return '';
          const kind = I.lam < 380 ? 'ultraviolet' : I.lam > 780 ? 'infrared (invisible)' : I.lam > 620 ? 'red' : I.lam > 590 ? 'orange' : I.lam > 570 ? 'yellow' : I.lam > 495 ? 'green' : I.lam > 450 ? 'blue' : 'violet';
          const flux = (I.eta * I.J) / Q;
          return `$E_g=${v.fix(I.E, 2)}$ eV → $\\lambda=${v.fix(I.lam, 0)}$ nm (${kind}) · forward voltage at least $\\approx E_g/e$ · $J=${v.fix(I.J, 1)}$ A/cm$^2$ → $n=${v.sci(I.n, 2)}$ cm$^{-3}$\n$\\eta_{\\text{int}}=${v.fix(100 * I.eta, I.eta < 0.01 ? 3 : 1)}\\%$ (${typ.value} gap, $B=${v.sci(B[typ.value], 1)}$ cm$^3$/s) · photon emission $\\approx${v.sci(flux, 2)}$ per s per cm$^2$ · the rest of the electrical power becomes heat`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Invention',
      name: 'Field-effect transistor (MOSFET)',
      credit: 'Lilienfeld, 1925 (field-effect concept); Kahng & Atalla, Bell Labs, 1959–60 (silicon MOSFET)',
      statement: String.raw`A **metal–oxide–semiconductor field-effect transistor** controls a current between source and drain with a voltage on a gate separated from the semiconductor by an oxide. On $p$-type silicon a positive gate voltage first repels holes (**depletion**, surface band bending $\psi_s>0$ with a depletion layer of width $W$), then bends the bands until the surface is as strongly $n$-type as the bulk is $p$-type, $\psi_s=2\varphi_F$ with $\varphi_F=(k_BT/e)\ln(N_a/n_i)$: **strong inversion**, a thin sheet of electrons (the channel). The gate voltage needed is the **threshold voltage**
$$V_T=V_{fb}+2\varphi_F+\frac{\sqrt{4\varepsilon eN_a\varphi_F}}{C_{ox}},\qquad C_{ox}=\varepsilon_{ox}/t_{ox}.$$
Above $V_T$ the drain current of a long channel is $I_d\approx\mu C_{ox}\tfrac WL\bigl[(V_g-V_T)V_d-\tfrac12V_d^2\bigr]$ (linear regime) and saturates at $\tfrac12\mu C_{ox}\tfrac WL(V_g-V_T)^2$ for $V_d>V_g-V_T$; below $V_T$ it falls exponentially, one decade per $\sim60$–$100$ mV.`,
      idea: String.raw`The gate and the semiconductor form a capacitor in series with the semiconductor's own space-charge layer, so the gate voltage divides as $V_g-V_{fb}=\psi_s+|Q_s|/C_{ox}$, where the charge $Q_s(\psi_s)$ follows from integrating Poisson's equation (vcalc-9.4) through the bent bands with Boltzmann carriers (cm-4.3). Once $\psi_s$ reaches $2\varphi_F$ the electron density at the surface grows as $e^{\psi_s/k_BT}$, so any additional gate voltage goes almost entirely into more channel charge $Q_{inv}$ instead of more band bending: $\psi_s$ pins near $2\varphi_F$. Source-to-drain, the channel charge is a resistor controlled by $V_g$; as $V_d$ approaches $V_g-V_T$ the charge at the drain end vanishes (pinch-off) and the current saturates.`,
      caption: String.raw`Drag the **gate voltage**. **Left:** the band diagram of the gate/oxide/silicon stack at the true surface potential (from the exact Poisson solution): the Fermi level of the metal moves down by $eV_g$, the silicon bands bend down, and the shaded layer near the surface where $n>p$ is the inversion channel. Choose the **right-hand panel**: the transfer curve $I_d(V_g)$ on a log scale (exponential subthreshold turn-on, then square-law-like growth), the output family $I_d(V_d)$ (linear region and saturation), or the surface potential $\psi_s(V_g)$, which stops rising near $2\varphi_F$. Vary the doping and the oxide thickness: thinner oxide and lighter doping lower $V_T$ and sharpen the turn-on.`,
      scope: String.raw`Ideal $n$-channel device on $p$-type Si at 300 K: no interface charge, equal work functions ($V_{fb}=0$), uniform doping, one-dimensional (long-channel, no short-channel effects, velocity saturation or tunnelling through thin oxide), constant inversion-layer mobility $400$ cm$^2$/Vs and $W/L=10$. The current is a numerical charge-sheet integral (Brews), including weak inversion; the textbook threshold formula marks where $\psi_s=2\varphi_F$.`,
      deps: ['cm-4.7'],
      refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 17'],
      tags: ['mosfet', 'inversion', 'transistor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET' },
      verify: true,
      viz(v) {
        const Vgs = v.slider('gate voltage $V_g$ (V)', -0.5, 3.5, 1.6, { step: 0.01 });
        const Vds = v.slider('drain voltage $V_d$ (V)', 0.02, 3.5, 0.1, { step: 0.01 });
        const Nas = v.slider('acceptors $N_a$ (cm$^{-3}$)', 1e15, 1e18, 1e17, { log: true, fmt: dens(v.M) });
        const tox = v.slider('oxide thickness $t_{ox}$ (nm)', 2, 50, 10, { step: 0.5 });
        const view = v.select('right panel', [{ value: 'transfer', label: '$I_d(V_g)$' }, { value: 'output', label: '$I_d(V_d)$' }, { value: 'psi', label: '$\\psi_s(V_g)$' }], 'transfer');
        const sB = v.stage({ x: [-20, 150], y: [-2, 2], axes: 'box', gutter: true, height: 380, xlabel: 'depth $z$ (nm); gate and oxide at $z<0$', ylabel: 'energy relative to the silicon Fermi level (eV)', title: 'gate–oxide–silicon band diagram', weight: 1.1 });
        const sR = v.stage({ x: [0, 3.5], y: [1e-14, 1e-3], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'gate voltage $V_g$ (V)', ylabel: 'drain current $I_d$ (A)', title: 'device characteristics', weight: 1 });
        v.legend([['accent', '$E_c$'], ['green', '$E_v$'], ['muted', '$E_i$', { dash: true }], ['ink', 'Fermi levels'], ['blue', 'inversion layer ($n>p$)']]);
        let key = '', mos = null, cache = {};
        let info = {};
        v.render(() => {
          const k = `${Nas.value}|${tox.value}`;
          if (k !== key) { key = k; mos = mosModel(Nas.value, tox.value); cache = {}; }
          const Vg = Vgs.value, Vd = Vds.value, Eg = 1.12;
          const psis = Math.max(-0.3, mos.psiOf(Vg)), prof = mos.profile(Math.max(psis, 0.0));
          const phiF = mos.phiF, Ecinf = Eg / 2 + phiF, tx = tox.value;
          const zEnd = prof[prof.length - 1][0], zmax = Math.max(40, zEnd * 1.15);
          const Ec = (psi) => Ecinf - psi;
          const ymin = Math.min(-Vg, Ecinf - Eg, Ec(Math.max(psis, 0)) - Eg) - 0.25, ymax = Ecinf + 0.45;
          sB.setView([-(tx + 14), zmax], [ymin, ymax]);
          // metal, oxide
          sB.rect(-(tx + 12), ymin, -tx, ymax, { fill: 'muted', fillAlpha: 0.12, stroke: false }); sB.rect(-tx, ymin, 0, ymax, { fill: 'orange', fillAlpha: 0.1, stroke: false });
          sB.text('gate', -(tx + 6), ymax - 0.12, { size: 11, color: 'muted', align: 'center', baseline: 'top' }); sB.text('oxide', -tx / 2, ymax - 0.12, { size: 11, color: 'orange', align: 'center', baseline: 'top' });
          sB.line(-(tx + 12), -Vg, -tx, -Vg, { color: 'ink', width: 2.2 });
          const Vox = Vg - psis, Ec0 = Ec(Math.max(psis, 0));
          sB.line(-tx, Ec0 - Vox, 0, Ec0, { color: 'accent', width: 1.4, dash: [4, 4], alpha: 0.7 }); sB.line(-tx, Ec0 - Vox - Eg, 0, Ec0 - Eg, { color: 'green', width: 1.4, dash: [4, 4], alpha: 0.7 });
          // silicon bands
          const zs = prof.map((p) => p[0]), ps = prof.map((p) => p[1]);
          const path = (f) => { const a = zs.map((z, i) => [z, f(ps[i])]); a.push([zmax, f(0)]); return a; };
          // inversion layer: region where ψ > φF
          let zi = 0; for (let i = 0; i < zs.length; i++) if (ps[i] > phiF) zi = zs[i];
          if (zi > 0) sB.vband(0, zi, { color: 'blue', alpha: 0.2 });
          if (zEnd > 0.5) sB.line(zEnd, ymin, zEnd, ymax, { color: 'faint', width: 1, dash: [3, 4] });
          sB.path(path((p) => Ec(p)), { color: 'accent', width: 2.8 }); sB.path(path((p) => Ec(p) - Eg), { color: 'green', width: 2.8 }); sB.path(path((p) => Ec(p) - Eg / 2), { color: 'muted', width: 1.2, dash: [4, 4] });
          sB.hline(0, { color: 'ink', width: 1.6, alpha: 0.8 }); sB.text('$E_F$', zmax * 0.94, 0.07, { size: 11, color: 'ink' }); sB.text(`$-eV_g$`, -(tx + 6), -Vg + 0.08, { size: 10, color: 'ink', align: 'center' });
          sB.text(psis < phiF ? 'depletion' : psis < 2 * phiF - 0.03 ? 'weak inversion' : 'strong inversion', zmax * 0.5, ymax - 0.12, { size: 12, color: 'blue', align: 'center', baseline: 'top' });
          // right panel
          const VT = mos.VT;
          if (view.value === 'transfer') {
            sR.setScale({ ylog: true, x: [0, 3.5], y: [1e-14, 1e-3] }); sR.setLabels('gate voltage $V_g$ (V)', 'drain current $I_d$ (A)');
            const kk = `T${Vd.toFixed(3)}`; if (!cache[kk]) cache[kk] = Array.from({ length: 71 }, (_, i) => [i * 0.05, mos.Id(i * 0.05, Vd)]);
            sR.path(cache[kk].map(([x, y]) => [x, Math.max(y, 1e-30)]), { color: 'accent', width: 3 });
            sR.vline(VT, { color: 'orange', width: 1.2, dash: [4, 4] }); sR.text('$V_T$', VT + 0.03, 3e-14, { size: 11, color: 'orange' });
            sR.vline(Math.max(0, Vg), { color: 'gold', width: 1.6 }); sR.dot(Math.max(0.0001, Vg), Math.max(1e-14, mos.Id(Vg, Vd)), { r: 6, color: 'gold' });
          } else if (view.value === 'output') {
            sR.setScale({ ylog: false, x: [0, 3.5], y: [0, 1] }); sR.setLabels('drain voltage $V_d$ (V)', 'drain current $I_d$ (µA)');
            const vgs = [VT + 0.3, VT + 0.6, VT + 1.0].filter((x) => x < 3.5); const kk = `O${vgs.map((q) => q.toFixed(2)).join()}`;
            if (!cache[kk]) cache[kk] = vgs.map((vg) => Array.from({ length: 60 }, (_, i) => { const vd = 0.02 + i * 0.06; return [vd, mos.Id(vg, vd) * 1e6]; }));
            const ymx = Math.max(1, ...cache[kk].map((c) => Math.max(...c.map((p) => p[1])))) * 1.1; sR.setView([0, 3.5], [0, ymx]);
            cache[kk].forEach((c, i) => { sR.path(c, { color: ['teal', 'accent', 'purple'][i], width: 2.2 }); sR.text(`$V_g=V_T+${[0.3, 0.6, 1.0][i].toFixed(1)}$`, 3.45, c[c.length - 1][1], { size: 10, color: ['teal', 'accent', 'purple'][i], align: 'right', dy: -8 }); });
            const cur = Array.from({ length: 60 }, (_, i) => { const vd = 0.02 + i * 0.06; return [vd, mos.Id(Vg, vd) * 1e6]; }); sR.path(cur, { color: 'gold', width: 3 });
            sR.vline(Vd, { color: 'gold', width: 1, dash: [3, 4] }); sR.dot(Vd, mos.Id(Vg, Vd) * 1e6, { r: 6, color: 'gold' });
          } else {
            sR.setScale({ ylog: false, x: [-0.5, 3.5], y: [-0.4, 1.4] }); sR.setLabels('gate voltage $V_g$ (V)', 'surface potential $\\psi_s$ (V)');
            if (!cache.psi) cache.psi = Array.from({ length: 81 }, (_, i) => [-0.5 + i * 0.05, mos.psiOf(-0.5 + i * 0.05)]);
            sR.path(cache.psi, { color: 'accent', width: 3 }); sR.hline(phiF, { color: 'faint', width: 1.2, dash: [4, 4] }); sR.hline(2 * phiF, { color: 'orange', width: 1.4, dash: [5, 4] });
            sR.text('$\\varphi_F$', -0.45, phiF + 0.03, { size: 11, color: 'muted' }); sR.text('$2\\varphi_F$', -0.45, 2 * phiF + 0.03, { size: 11, color: 'orange' }); sR.vline(VT, { color: 'orange', width: 1, dash: [4, 4] });
            sR.vline(Vg, { color: 'gold', width: 1.6 }); sR.dot(Vg, psis, { r: 6, color: 'gold' });
          }
          // subthreshold swing from the transfer curve of this device
          const sw = (() => { const a = Math.max(0.05, VT - 0.5), b = VT - 0.25; const i1 = mos.Id(a, Vd), i2 = mos.Id(b, Vd); return i1 > 0 && i2 > i1 ? ((b - a) / Math.log10(i2 / i1)) * 1000 : NaN; })();
          const Cd = mos.eps / mos.Wm, ideal = mos.Vt * Math.LN10 * (1 + Cd / mos.Cox) * 1000;
          info = { psis, VT, phiF, Id: mos.Id(Vg, Vd), Qinv: mos.Qinv(Math.max(psis, 0)), sw, ideal, Wm: mos.Wm, zEnd, mos };
        });
        v.readout(() => {
          const I = info; if (!I.mos) return '';
          const reg = I.psis < 0 ? 'accumulation' : I.psis < I.phiF ? 'depletion' : I.psis < 2 * I.phiF - 0.03 ? 'weak inversion' : 'strong inversion';
          return `**${reg}** · $\\psi_s=${v.fix(I.psis, 3)}$ V (pins near $2\\varphi_F=${v.fix(2 * I.phiF, 3)}$ V) · threshold $V_T=${v.fix(I.VT, 3)}$ V · max depletion width $${v.fix(I.Wm * 1e7, 0)}$ nm · $C_{ox}=${v.fix(I.mos.Cox * 1e6, 2)}\\ \\mu$F/cm$^2$\n$I_d(V_g,V_d)=${v.sci(I.Id, 2)}$ A · channel charge $Q_{inv}=${v.sci(I.Qinv / 1.602e-19, 2)}\\ e/\\text{cm}^2$ · subthreshold swing: computed $${isNaN(I.sw) ? '—' : v.fix(I.sw, 0)}$ mV/decade, textbook $\\ln10\\,(k_BT/e)(1+C_d/C_{ox})=${v.fix(I.ideal, 0)}$ mV/decade`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Quantum wells and heterostructures',
      credit: 'Esaki & Tsu, 1970 (proposal); Dingle, Wiegmann & Henry, 1974 (observation in GaAs/AlGaAs)',
      statement: String.raw`A thin layer of a small-gap semiconductor (GaAs, width $L$) between layers of a larger-gap one (Al$_x$Ga$_{1-x}$As) forms a **quantum well** for both carriers, with depths $\Delta E_c=Q_c\,\Delta E_g$ and $\Delta E_v=(1-Q_c)\Delta E_g$. In the envelope-function (effective-mass) picture the confined electron obeys $-\tfrac{\hbar^2}{2}\frac{d}{dz}\bigl(\tfrac1{m^*(z)}\tfrac{d\psi}{dz}\bigr)+V(z)\psi=E\psi$, so the allowed energies solve $\ \tfrac{k}{m_w}\tan\tfrac{kL}{2}=\tfrac{\kappa}{m_b}$ (even) or $-\tfrac{k}{m_w}\cot\tfrac{kL}{2}=\tfrac{\kappa}{m_b}$ (odd) with $k=\sqrt{2m_wE}/\hbar$, $\kappa=\sqrt{2m_b(V-E)}/\hbar$. For a wide well the levels approach the infinite-well values $E_n=\hbar^2\pi^2n^2/2m_wL^2$; a narrow well has few bound states. The lowest optical transition is
$$\hbar\omega\approx E_g^{\text{GaAs}}+E_{e1}+E_{hh1},$$
which moves to higher energy (to the blue) as $L$ shrinks, tunable by the width.`,
      idea: String.raw`Because the conduction-band edge of GaAs lies below that of AlGaAs, an electron near the band edge is described by a slowly varying envelope that obeys the one-dimensional finite square-well problem of quantum mechanics (qm-3.4) with the effective mass cm-2.3 inside and a different mass in the barrier; continuity of $\psi$ and of $\psi'/m^*$ (so that probability current is conserved) fixes the quantisation. The levels therefore have the box-eigenstate structure — alternately even and odd — but are lower than in an infinite box because the wave function leaks into the barrier. Confinement raises the zero-point energy like $1/L^2$, so a thinner well emits at a higher photon energy. Dingle, Wiegmann and Henry saw the steps of this quantisation in the absorption spectra of GaAs layers between $\sim$ 7 and $\sim$ 40 nm.`,
      caption: String.raw`Drag the **well width**, the aluminium fraction (barrier height) and the conduction-band offset fraction. **Left:** conduction and valence band edges of the heterostructure with the bound electron levels (blue) and heavy-hole levels (red) and their wave functions, which leak into the barriers. The gold arrow is the lowest interband transition, drawn in the colour of the photon it emits. **Right:** the emission energy against width: the finite-well result (solid) against the infinite-well estimate (dashed), which overestimates the confinement of narrow wells. Turn the BenDaniel–Duke condition off to use the well mass in the barrier too.`,
      scope: String.raw`Single rectangular well, parabolic bands at $300$ K, heavy hole only (mass $0.35\,m_0$ taken equal in well and barrier), electron masses $0.067\,m_0$ (GaAs) and $0.067+0.083x$ (AlGaAs), gap $E_g^{\text{AlGaAs}}-E_g^{\text{GaAs}}=1.247x$ eV for $x<0.45$ (direct-gap range), conduction offset fraction $Q_c\approx0.6$–$0.65$ in modern work (Dingle's early value was $\approx0.85$–$0.88$). Excitonic binding ($\sim 10$ meV) and strain are ignored. Material constants quoted from standard references from memory (unverified).`,
      deps: ['cm-4.1', 'cm-2.3', 'qm-3.4'],
      refs: ['Kittel ch. 18', 'Kittel ch. 17'],
      tags: ['quantum well', 'heterostructure', 'confinement'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_well' },
      verify: true,
      viz(v) {
        const M = v.M;
        const Ls = v.slider('well width $L$ (nm)', 1, 40, 8, { step: 0.1 });
        const xs = v.slider('Al fraction $x$', 0.1, 0.45, 0.3, { step: 0.01 });
        const Qc = v.slider('conduction-band offset fraction $Q_c$', 0.5, 0.9, 0.65, { step: 0.01 });
        const bdd = v.toggle('BenDaniel–Duke boundary condition', true);
        const EG = 1.424, ME = 0.067, MH = 0.35;
        const par = () => { const x = xs.value, dEg = 1.247 * x; return { x, Vc: Qc.value * dEg, Vv: (1 - Qc.value) * dEg, mbe: 0.067 + 0.083 * x, dEg }; };
        const sQ = v.stage({ x: [-20, 20], y: [-0.4, 2.1], axes: 'box', gutter: true, height: 380, xlabel: 'growth direction $z$ (nm)', ylabel: 'energy (eV)', title: 'GaAs well between AlGaAs barriers', weight: 1.15 });
        const sW = v.stage({ x: [1, 40], y: [1.4, 2.0], axes: 'box', gutter: true, height: 380, xlabel: 'well width $L$ (nm)', ylabel: 'emission energy $\\hbar\\omega$ (eV)', title: 'quantum size effect', weight: 0.9 });
        v.legend([['blue', 'electron levels'], ['red', 'heavy-hole levels'], ['gold', 'optical transition'], ['ink', 'finite well'], ['muted', 'infinite well', { dash: true }]]);
        let key = '', curve = [];
        let info = {};
        v.render(() => {
          const P = par(), L = Ls.value, bd = bdd.value;
          const e = wellLevels(L, P.Vc, ME, P.mbe, bd), h = wellLevels(L, P.Vv, MH, MH, bd);
          const X = Math.max(L / 2 + 9, 14); sQ.setView([-X, X], [-P.Vv - 0.25, EG + P.Vc + 0.3]);
          sQ.path([[-X, EG + P.Vc], [-L / 2, EG + P.Vc], [-L / 2, EG], [L / 2, EG], [L / 2, EG + P.Vc], [X, EG + P.Vc]], { color: 'accent', width: 2.8 });
          sQ.path([[-X, -P.Vv], [-L / 2, -P.Vv], [-L / 2, 0], [L / 2, 0], [L / 2, -P.Vv], [X, -P.Vv]], { color: 'green', width: 2.8 });
          sQ.text('AlGaAs', -X + 1, EG + P.Vc + 0.12, { size: 11, color: 'muted' }); sQ.text('GaAs', 0, EG + P.Vc + 0.12, { size: 11, color: 'muted', align: 'center' });
          const draw = (lev, Vb, sgn, base, color) => lev.slice(0, 4).forEach((q) => {
            const y0 = base + sgn * q.E; sQ.line(-X, y0, X, y0, { color, width: 1, alpha: 0.35, dash: [3, 4] });
            const w = wellPsi(L, Vb, sgn > 0 ? ME : MH, sgn > 0 ? P.mbe : MH, q, X, 300, bd); const mx = Math.max(...w.ps.map(Math.abs));
            sQ.path(w.xs.map((x, i) => [x, y0 + (0.08 * w.ps[i]) / mx]), { color, width: 2 });
          });
          draw(e, P.Vc, 1, EG, 'blue'); draw(h, P.Vv, -1, 0, 'red');
          const e1 = e.length ? e[0].E : NaN, h1 = h.length ? h[0].E : NaN, hw = EG + e1 + h1, lam = 1239.84 / hw, rgb = colOf(M, lam);
          if (e.length && h.length) { sQ.arrow(0, -h1, 0, EG + e1, { color: rgb, width: 3 }); sQ.dot(0, EG + e1, { r: 5, color: 'blue' }); sQ.dot(0, -h1, { r: 5, color: 'red' }); }
          // size-effect panel
          const kk = `${P.x}|${Qc.value}|${bd}`; if (kk !== key) { key = kk; curve = Array.from({ length: 60 }, (_, i) => { const l = Math.pow(40, i / 59) * 1; const ee = wellLevels(l, P.Vc, ME, P.mbe, bd), hh = wellLevels(l, P.Vv, MH, MH, bd); return [l, ee.length && hh.length ? EG + ee[0].E + hh[0].E : null]; }); }
          sW.setView([1, 40], [1.38, Math.max(1.9, Math.min(2.3, EG + P.dEg * 0.9))]);
          sW.path(curve.filter((q) => q[1] != null && q[0] >= 1), { color: 'ink', width: 2.8 });
          sW.fn((l) => EG + (HB * (1 / ME + 1 / MH)) / (l * l), { color: 'muted', width: 1.6, dash: [5, 4], domain: [2.5, 40] });
          sW.hline(EG, { color: 'faint', width: 1, dash: [3, 4] }); sW.text('bulk GaAs', 36, EG + 0.015, { size: 10, color: 'muted', align: 'right' });
          sW.hline(EG + P.Vc * 0 + 0, { color: 'faint', width: 0 });
          sW.vline(L, { color: 'gold', width: 1.2 }); if (isFinite(hw)) sW.dot(L, Math.min(hw, 2.28), { r: 7, color: rgb });
          info = { e, h, hw, lam, P };
        });
        v.readout(() => {
          const I = info; if (!I.P) return '';
          const ee = I.e.slice(0, 3).map((q) => v.fix(1000 * q.E, 0)).join(', '), hh = I.h.slice(0, 3).map((q) => v.fix(1000 * q.E, 0)).join(', ');
          const inf = (HB * (1 / ME + 1 / MH)) / (Ls.value ** 2);
          return `well depths $\\Delta E_c=${v.fix(1000 * I.P.Vc, 0)}$ meV, $\\Delta E_v=${v.fix(1000 * I.P.Vv, 0)}$ meV (barrier electron mass $${v.fix(I.P.mbe, 3)}\\,m_0$) · ${I.e.length} electron and ${I.h.length} heavy-hole bound states · electron levels $${ee}$ meV, hole levels $${hh}$ meV\nlowest transition $\\hbar\\omega=E_g+E_{e1}+E_{hh1}=${isFinite(I.hw) ? v.fix(I.hw, 3) : '—'}$ eV ($\\lambda=${isFinite(I.hw) ? v.fix(I.lam, 0) : '—'}$ nm), a shift of $${isFinite(I.hw) ? v.fix(1000 * (I.hw - 1.424), 0) : '—'}$ meV from bulk GaAs; infinite-well estimate $+${v.fix(1000 * inf, 0)}$ meV`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Excitons',
      credit: 'Frenkel, 1931; Wannier, 1937; Gross, 1951 (Rydberg series in Cu₂O); Kazimierczuk et al., 2014 (n up to 25)',
      statement: String.raw`An electron in the conduction band and a hole in the valence band attract each other through the screened Coulomb potential and can form a bound pair, an **exciton**. In the Wannier–Mott limit (weak binding, orbit large compared with the lattice constant) it is a hydrogen atom with the reduced mass $\mu=m_e^*m_h^*/(m_e^*+m_h^*)$ and dielectric constant $\varepsilon$:
$$E_n=E_g-\frac{\mathrm{Ry}^*}{n^2},\qquad \mathrm{Ry}^*=\frac{\mu}{m_0}\frac{13.6\ \text{eV}}{\varepsilon^2},\qquad a_B^*=\varepsilon\frac{m_0}{\mu}a_0 .$$
These discrete lines lie just below the gap in the absorption spectrum; their strengths fall as $n^{-3}$, and they pass into the continuum above $E_g$ (Elliott). Real series show a **quantum defect**, $n\to n-\delta_l$, from the non-Coulombic short-range potential.`,
      idea: String.raw`The pair's relative motion in a crystal is the hydrogen problem (qm-8.12) in the effective-mass approximation (as for donors, cm-4.4, but with the hole mass in place of the infinite ionic mass, so $\mu$ appears), while the centre of mass moves freely. A photon creates an exciton at zero relative separation, so the line strength is proportional to $|\psi_n(0)|^2\propto n^{-3}$; the spacing between neighbouring lines is $\approx2\mathrm{Ry}^*/n^3$, also $\propto n^{-3}$, which makes the continuum limit smooth and means that lines merge when the spacing falls below the line width. In ordinary semiconductors $\mathrm{Ry}^*\sim$ a few meV, so only $n=1,2,3$ are seen; in cuprous oxide $\mathrm{Ry}^*\approx92$ meV and a very clean crystal shows lines up to $n=25$, with orbits larger than a micron.`,
      caption: String.raw`Choose the crystal and the **resolution** (linewidth $\Gamma$). **Left:** absorption below the gap against the binding energy $E_b=E_g-E$ on a logarithmic axis, so the series appears as peaks that bunch up towards the gap (the dashed line at $1$ is the smooth continuum that the lines approach). Sharpen the resolution to see more lines; the peaks of order $n$ merge once $2\mathrm{Ry}^*/n^3<\Gamma$. The buttons set the two resolutions of the Cu$_2$O experiment (a 5 neV laser and a 10 $\mu$eV white-light spectrometer). **Right:** the size of the orbit, $\langle r\rangle\approx\tfrac12[3n^2-l(l+1)]\,a_B^*$, against $n$ (drag the handle) compared with the lattice constant and the wavelength of light.`,
      scope: String.raw`Wannier–Mott excitons with isotropic hydrogenic Coulomb binding (no exchange splitting, no polaritons, no phonon broadening beyond the chosen $\Gamma$). Cu$_2$O yellow $P$ series: $E_g=2.17208$ eV, $\mathrm{Ry}^*=92$ meV, $\delta_P=0.23$ (fit parameters of Kazimierczuk et al. 2014, sample at 1.2 K; the plotted lines are the fit formula, not raw spectra); the Cu$_2$O static dielectric constant $\varepsilon\approx7.5$ used for the orbit size is quoted from memory. GaAs: $\mathrm{Ry}^*=4.2$ meV (the value quoted in the same paper); $\varepsilon=12.9$.`,
      deps: ['cm-4.4'],
      refs: ['Kittel ch. 15'],
      tags: ['exciton', 'rydberg', 'absorption'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exciton', doi: 'https://doi.org/10.1038/nature13832' },
      viz(v) {
        const mat = v.select('crystal', [{ value: 'cu2o', label: 'Cu$_2$O yellow $P$ series' }, { value: 'gaas', label: 'GaAs $S$ series' }], 'cu2o');
        const G = v.slider('linewidth $\\Gamma$ (µeV)', 0.005, 1e4, 3, { log: true, sig: 2 });
        const qd = v.toggle('quantum defect $\\delta_P=0.23$', true);
        const nS = v.slider('principal quantum number $n$', 1, 30, 10, { int: true });
        const b1 = v.button('laser, 5 neV', () => G.set(0.005)), b2 = v.button('white light, 10 µeV', () => G.set(10));
        void b1; void b2;
        const MATS = { cu2o: { Ry: 92, Eg: 2.17208, delta: 0.23, n0: 2, l: 1, eps: 7.5, a: 0.427, label: 'Cu$_2$O' }, gaas: { Ry: 4.2, Eg: 1.5192, delta: 0, n0: 1, l: 0, eps: 12.9, a: 0.565, label: 'GaAs' } };
        const sA = v.stage({ x: [0.05, 120], y: [0.1, 2e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'binding energy $E_g-E$ (meV)', ylabel: 'absorption / continuum edge', title: 'absorption lines below the gap', weight: 1.2 });
        const sB = v.stage({ x: [0.8, 32], y: [0.1, 5000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'principal quantum number $n$', ylabel: 'orbit size $\\langle r\\rangle$ (nm)', title: 'how big is the exciton?', weight: 0.8 });
        const rOf = (n) => { const Mt = MATS[mat.value], d = qd.value ? Mt.delta : 0, aB = (13.606 * 0.052918 * 1) / (Mt.eps * Mt.Ry / 1000); const ne = Math.max(0.3, n - d); return 0.5 * (3 * ne * ne - Mt.l * (Mt.l + 1)) * aB; };
        let last = mat.value;
        const hN = sB.handle(10, 100, { color: 'gold', r: 7, constrain: (x) => { const n = Math.max(1, Math.min(30, Math.round(x))); return [n, rOf(n)]; } });
        hN.onDrag = () => nS.set(Math.round(hN.x));
        v.legend([['accent', 'absorption'], ['muted', 'continuum level 1', { dash: true }], ['gold', 'chosen $n$']]);
        let info = {};
        v.render(() => {
          if (mat.value !== last) { last = mat.value; G.set(mat.value === 'cu2o' ? 3 : 100); nS.set(mat.value === 'cu2o' ? 10 : 2); }
          const Mt = MATS[mat.value], d = qd.value && mat.value === 'cu2o' ? Mt.delta : 0, Gm = G.value / 1000, Ry = Mt.Ry;
          sA.setView([Ry / 1600 * 0.7, Ry * 1.4], [0.1, 2e4]);
          const lines = []; for (let n = Mt.n0; n <= 120; n++) { const ne = n - d; lines.push({ n, Eb: Ry / (ne * ne), f: (2 * Ry) / (ne * ne * ne) }); }
          const NS = 900, lo = Math.log(Ry / 1600 * 0.7), hi = Math.log(Ry * 1.4), pts = [];
          for (let i = 0; i <= NS; i++) { const Eb = Math.exp(lo + ((hi - lo) * i) / NS); let a = 0; for (const q of lines) { const dE = Eb - q.Eb; if (Math.abs(dE) < 40 * Gm + 3 * q.Eb / q.n) a += q.f * (Gm / 2 / Math.PI) / (dE * dE + (Gm / 2) ** 2); } pts.push([Eb, Math.max(a, 1e-3)]); }
          sA.hline(1, { color: 'muted', width: 1.4, dash: [5, 4] });
          sA.path(pts, { color: 'accent', width: 2 });
          // mark the lines
          lines.filter((q) => q.n <= 12 || q.n % 5 === 0).slice(0, 14).forEach((q) => { if (q.Eb > Ry / 1600 * 0.8) sA.text(`${q.n}`, q.Eb, 1.4e4, { size: 10, color: 'muted', align: 'center' }); });
          sA.text('$n$ =', Ry * 1.25, 1.4e4, { size: 10, color: 'muted', align: 'center' });
          // orbit-size panel
          sB.path(Array.from({ length: 30 }, (_, i) => [i + 1, rOf(i + 1)]), { color: 'accent', width: 2.6 });
          sB.hline(Mt.a, { color: 'green', width: 1.4, dash: [5, 4] }); sB.text('lattice constant', 1, Mt.a * 1.25, { size: 10, color: 'green' });
          sB.hline(570, { color: 'orange', width: 1.4, dash: [5, 4] }); sB.text('wavelength of yellow light', 1, 570 * 1.25, { size: 10, color: 'orange' });
          const n = nS.value; hN.set(n, rOf(n)); sB.vline(n, { color: 'faint', width: 1 });
          // resolved lines: spacing between n and n+1 exceeds 2Γ
          let nmax = Mt.n0; for (const q of lines) { const nx = lines.find((z) => z.n === q.n + 1); if (nx && q.Eb - nx.Eb > 2 * Gm) nmax = q.n + 1; else if (nx) break; }
          info = { Mt, n, r: rOf(n), nmax, Gm, d, ne: n - d };
        });
        v.readout(() => {
          const I = info; if (!I.Mt) return '';
          const Mt = I.Mt, aB = (13.606 * 0.052918) / (Mt.eps * Mt.Ry / 1000), En = Mt.Eg - Mt.Ry / 1000 / (I.ne * I.ne);
          const text = `$\\mathrm{Ry}^*=${v.fix(Mt.Ry, 1)}$ meV, $a_B^*=${v.fix(aB, 1)}$ nm · line $n=${I.n}$ at $E=${v.fix(En, mat.value === 'cu2o' ? 5 : 4)}$ eV, ${v.fix(1000 * Mt.Ry / 1000 / (I.ne * I.ne), I.ne > 5 ? 3 : 1)} meV below the gap · $\\langle r\\rangle=${I.r < 1000 ? v.fix(I.r, 1) + '$ nm' : v.fix(I.r / 1000, 2) + '$ µm'} (${v.fix(I.r / Mt.a, 0)} lattice constants)`;
          const res = `at $\\Gamma=${v.fix(1000 * I.Gm, I.Gm < 0.01 ? 3 : 1)}$ µeV the lines are resolved up to about $n=${I.nmax}$ (spacing $>2\\Gamma$)`;
          const paper = mat.value === 'cu2o' ? ' · measured (Kazimierczuk et al. 2014, 1.2 K): lines to $n=25$ with a 5 neV laser, to $n=17$ with a 10 µeV white-light resolution; their widths fall as $n^{-3}$ down to a few µeV' : ' · measured in GaAs: only $n=1,2,3$ (the paper quotes $\\mathrm{Ry}^*=4.2$ meV)';
          return `${text}\n${res}${paper}`;
        });
      },
    },
  ],
};
