// Condensed Matter Physics — Chapter 4: Semiconductors and devices (items 4.7–4.12; 4.1–4.6 in ch04.js)
import { PI, KB, Q, EPS0, MAT, eg, niB, pnEquilibrium } from './ch04.shared.js';

const dens = (M) => (x) => { const k = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** k; return (Math.abs(m - 1) < 0.01 ? '' : m.toFixed(1) + '×') + M.pow10Text(k); };
import{diodeAudit,HC_A,ABC,abcAudit,mosAudit,QE,wellAudit,waveAudit,HB2_A,EXCITONS,excitonRadius,excitonSpectrum}from'./cm-source-audit-devices.js';
const HB = HB2_A * Math.PI ** 2;
const colOf=(M,nm)=>nm>=380&&nm<=780?M.wavelengthRGB(nm):'muted';

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
      credit: 'Ideal long-junction diffusion model',
      statement: String.raw`For a $p$–$n$ junction with applied forward voltage $V$ (positive on the $p$ side) in low injection, the current density is
$$J=J_0\left(e^{eV/k_BT}-1\right),$$
$$J_0=en_i^2\left(\frac{D_p}{L_pN_d}+\frac{D_n}{L_nN_a}\right),$$
$$L=\sqrt{D\tau}.$$
It rises exponentially (a factor $10$ for every $k_BT\ln10/e\approx60$ mV at 300 K) in forward bias and saturates at $-J_0$ in reverse. The reverse saturation current $J_0\propto n_i^2$ grows rapidly with temperature, like $e^{-E_g/k_BT}$. Real diodes can also show a recombination current of the depletion region $\propto e^{eV/2k_BT}$ at low bias, and are limited by series resistance at high bias.`,
      idea: String.raw`The bias does not change the built-in field's job in the neutral regions but lowers the barrier to $V_{bi}-V$, so the product of the densities at the edges of the depletion region becomes $np=n_i^2e^{eV/k_BT}$ (the quasi-Fermi levels split by $eV$ and stay flat across the thin depletion layer, cm-4.3). The minority carriers injected into the neutral regions, $\Delta n_p=n_{p0}(e^{eV/k_BT}-1)$, diffuse and recombine over their diffusion length $L$ (Fick's law with Einstein's $D=\mu k_BT/e$, cm-4.6), and the current at the depletion edge is $eD\,\Delta n_p/L$. Adding electrons and holes gives the formula. Recombination in the depletion layer adds a forward $e^{eV/2k_BT}$ term; generation there contributes reverse current.

In each long, uniformly doped neutral region, steady low-injection diffusion and recombination give $D\,\delta n''-\delta n/\tau=0$ with constant $D,\tau>0$. The constant-coefficient solution theorem (ode 3.13) gives the two exponentials with characteristic roots $\pm1/L$, where $L=\sqrt{D\tau}$. Using distance into the bulk, decay removes the growing exponential and the injected edge excess fixes $\delta n(x)=\delta n(0)e^{-x/L}$. For positive forward injection its edge-current magnitude is $eD\,\delta n(0)/L$; adding the electron and hole contributions gives $J_0$. Linearity retains the sign when the edge excess is negative in ideal reverse bias. This step does not solve recombination inside the depletion region.`,
      caption: String.raw`Drag the **bias** handle on the current–voltage plot (log scale, $|J|$ against $V$; reverse currents are dashed). **Left:** the band diagram of the junction under that bias, to scale in the depletion region: the barrier shrinks by $V_j$, the quasi-Fermi levels split by the junction energy $eV_j$; the curves outside the layer are only a compressed schematic. When $V_j\ge V_{bi}$ the depletion drawing is explicitly omitted, while the current law is an extrapolation. Choose the **model**: ideal Shockley gives a straight line of slope $60$ mV per decade; adding the illustrative ideality-two current gives an approximately $120$ mV-per-decade range; adding series resistance flattens the top. The readout gives the local ideality factor $n=(dV/d\ln J)/V_T$.`,
      scope: String.raw`Long, uniformly doped junction, complete ionization and Boltzmann low injection. Mobilities are the declared Hu Table 2–1 room-temperature values (Si 1400/470, Ge 3900/1900, GaAs 8500/400 cm$^2$/Vs), deliberately held constant as temperature/doping change. Intrinsic DOS/gaps use the parameter set of cm-4.2. The built-in potential uses the full bulk Boltzmann-neutrality asinh expression; the log approximation requires dopant densities much larger than $n_i$. An explicit warning appears when the current-law majority-carrier approximation fails. The optional ideality-two term is $en_iW_0( e^{V_j/2V_T}-1)/(2\tau)$ with **constant equilibrium width** $W_0$ and assumed depletion lifetime $2\tau$; it illustrates recombination rather than solving spatial SRH kinetics. Series resistance solves $V=V_j+R_sJ(V_j)$. Currents outside low injection are extrapolations; breakdown, tunnelling and high-injection physics are absent. The log plot uses an explicitly labeled marker floor at zero current.`,
      deps: ['cm-4.7', 'ode-3.13'],
      refs: ['Chenming Hu, §§4.7–4.9.1, Eqs.(4.9.1)–(4.9.10), Figs.4–19–4–22; §2.2/Table2–1'],
      tags: ['diode', 'rectification', 'quasi-fermi levels'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley_diode_equation' },
      verify: false,
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
        const cur = () => diodeAudit(mat.value, Ts.value, Nas.value, Nds.value, taus.value, Rss.value);
        const h = sJ.handle(0.45, 1e-6, { color: 'gold', r: 7, constrain: (x) => { const V = Math.max(-1, Math.min(1.2, x)); const D = cur(); return [V, Math.max(1e-30, Math.abs(D.J(V, model.value !== 'ideal', model.value === 'rs')))]; } });
        v.legend([['accent', 'ideal'], ['orange', '+ recombination'], ['ink', 'with series $R_s$'], ['gold', 'bias'], ['purple', '$F_n$'], ['pink', '$F_p$']]);
        let info = {};
        v.render(() => {
          const D = cur(), m = MAT[mat.value], rec = model.value !== 'ideal', rs = model.value === 'rs', Vt = D.Vt;
          D.lo=Math.pow(10,Math.floor(Math.log10(D.J0*.5))-1);const jtop=2*Math.max(D.Jid(1.2),rec?D.Jjunc(1.2,true):0);sJ.setView([-1,1.2],[D.lo,jtop]);sJ.text('zero has no log coordinate',-0.95,D.lo*3,{size:10,color:'muted'});
          const seg = (f, c, wd, al) => { const neg = [], pos = []; for (let i = 0; i <= 160; i++) { const V = -1 + (2.2 * i) / 160, J = Math.abs(f(V)); (V <= 0 ? neg : pos).push([V, Math.max(J, 1e-40)]); } sJ.path(neg, { color: c, width: wd, alpha: al * 0.6, dash: [4, 4] }); sJ.path(pos, { color: c, width: wd, alpha: al }); };
          seg((V) => D.Jid(V), 'accent', model.value === 'ideal' ? 3 : 1.6, model.value === 'ideal' ? 1 : 0.55);
          if (rec) seg((V) => D.Jjunc(V, true), 'orange', model.value === 'rec' ? 3 : 1.6, model.value === 'rec' ? 1 : 0.55);
          if (rs) seg((V) => D.J(V, true, true), 'ink', 3, 1);
          const V = h.x, Jv = D.J(V, rec, rs); h.set(V, Math.max(D.lo, Math.abs(Jv)));
          const Vj = D.Vjof(V, rec, rs);
          // band diagram (depletion approximation at the junction voltage Vj)
          const Eg = D.Eg, Vbi = D.Vbi, W = D.Wj(Vj) * 1e4, xn = (W * Nas.value) / (Nas.value + Nds.value), xp = (W * Nds.value) / (Nas.value + Nds.value);
          const phiP = Vt * Math.asinh(Nas.value/(2*D.ni)), phiN = Vt * Math.asinh(Nds.value/(2*D.ni)), EcP = phiP+Eg-D.Ei, EvP = phiP - Eg / 2, bar = Vbi - Vj, EcN = EcP - bar;
          const w0 = D.Wj(0) * 1e4, wv = Math.max(2.6 * w0,1.3*W); sB.setView([-wv, wv], [Math.min(EvP,EcN-Eg,Vj)-.3,Math.max(EcP,Vj)+.35]);
          const A = (QE * Nas.value) / (2 * D.eps) * 1e-8, B = (QE * Nds.value) / (2 * D.eps) * 1e-8; // V/µm²
          const Ecx = (x) => { if (x <= -xp) return EcP; if (x >= xn) return EcN; return x <= 0 ? EcP - A * (x + xp) * (x + xp) : EcN + B * (xn - x) * (xn - x); };
          const xs = Array.from({ length: 241 }, (_, i) => -wv + (2 * wv * i) / 240);
          if(bar>0){sB.vband(-xp,xn,{color:'orange',alpha:.12});sB.path(xs.map(x=>[x,Ecx(x)]),{color:'accent',width:2.8});sB.path(xs.map(x=>[x,Ecx(x)-Eg]),{color:'green',width:2.8});}else{sB.text('depletion model invalid at this bias',0,Eg/2,{size:13,color:'red',align:'center'});}
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
          const V = h.x, dV = 0.002, J1 = Math.abs(D.J(V - dV, rec, rs)), J2 = Math.abs(D.J(V + dV, rec, rs)), nid = V > dV && J1 > 0 && J2 > J1 ? (2 * dV) / (Math.log(J2) - Math.log(J1)) / D.Vt : NaN;
          return `${D.majorityValid?'':'**Outside majority-dopant limit: diode-current extrapolation.** ' }$V=${v.fix(V, 3)}$ V ($V_j=${v.fix(I.Vj, 3)}$ V across the junction) · $J=${v.sci(Math.abs(I.Jv), 2)}$ A/cm$^2$ ${V<0?'(reverse)':V>0?'(forward)':'(equilibrium; marker at plotting floor)'} · $J_0=${v.sci(D.J0, 2)}$ A/cm$^2$ · local ideality factor $n=${isNaN(nid) ? '—' : v.fix(nid, 2)}$\n$k_BT/e=${v.fix(1000 * D.Vt, 1)}$ mV → ideal slope $${v.fix(1000 * D.Vt * Math.LN10, 1)}$ mV per decade · $V_{bi}=${v.fix(D.Vbi, 3)}$ V, $W=${v.fix(I.W, 3)}\\ \\mu$m · diffusion lengths $L_n=${v.fix(D.Ln * 1e4, 0)}$, $L_p=${v.fix(D.Lp * 1e4, 0)}\\ \\mu$m`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Light-emitting diodes',
      credit: 'Double-heterostructure and illustrative ABC rate model',
      statement: String.raw`A **light-emitting diode** is a forward-biased $p$–$n$ junction (usually a double heterostructure) in which injected electrons and holes recombine in a thin active layer and the recombination energy leaves as a photon of energy $h\nu\approx E_g$, so the colour is set by the band gap, $\lambda\,[\text{nm}]\approx1239.8/E_g\,[\text{eV}]$. The fraction of injected carriers that give photons is the **internal quantum efficiency**, in the ABC model
$$\eta_{\text{int}}=\frac{Bn^2}{An+Bn^2+Cn^3},$$
$$\frac{J}{e\,d}=An+Bn^2+Cn^3,$$
where $A$ is the rate of non-radiative (defect) recombination, $B$ the radiative coefficient, $C$ the Auger coefficient, $n$ the carrier density in the active layer of thickness $d$. In a **direct**-gap material $B$ is large; in an **indirect**-gap material (Si, Ge, GaP) radiative recombination needs a phonon and $B$ can be much smaller. The plotted four-order reduction is an assumed comparison, not a universal material ratio.`,
      idea: String.raw`Forward bias injects both carrier types into the active layer (cm-4.8); a heterostructure confines them there at densities far above equilibrium, so the product $np\gg n_i^2$ and recombination is fast. Each recombination of a conduction-band electron with a valence-band hole releases $\approx E_g$. Whether this goes into a photon depends on momentum: the selection rule of cm-4.1 makes the radiative rate $Bnp$ with a small $B$ for indirect gaps, which competes with defect and Auger channels. Efficiency is low at small current (defects: $A n$ wins), peaks where the defect and Auger losses balance, $An=Cn^3$, even if $Bn^2$ never dominates, and droops at very high current as the $n^3$ Auger term grows.

For the positive coefficients used here, the total loss $R(n)=An+Bn^2+Cn^3$ has $R'(n)=A+2Bn+3Cn^2>0$ for $n\ge0$. The derivative-sign theorem and its mean-value proof (pma 5.11) make density strictly ordered by current, so there is at most one nonnegative density root for a given current. Also $\eta(n)=Bn/(A+Bn+Cn^2)$ has derivative with the sign of $A-Cn^2$; its unique maximum occurs at $n=\sqrt{A/C}$ and remains the maximum when plotted against $J$. Its value is $B/(B+2\sqrt{AC})$, which can be small even at that optimum.`,
      caption: String.raw`Set the **band gap** (the preset buttons jump to nominal photon energies) and switch between a direct and an indirect gap. **Left:** a forward-biased double heterostructure (schematic, not to scale): electrons (blue) and holes (red, hollow) flow into the active layer and meet; a recombination ends as a **photon** of the colour for that gap (wavy line) according to a deterministic small set of glyphs weighted by $\eta_{\text{int}}$, otherwise as **heat** (orange zigzag). These glyph counts are schematic, not random samples or an accurate estimator at tiny efficiencies. Invisible light is shown in neutral false colour. **Right:** $\eta_{\text{int}}$ against current density $J$ from the ABC model for a direct and an indirect gap. Drag the handle to change $J$: the efficiency peaks and then droops; with the indirect gap it never exceeds a fraction of a per cent.`,
      scope: String.raw`Spatially uniform ABC model, equal injected electron/hole densities, unit injection efficiency and illustrative positive coefficients $A=10^7$ s$^{-1}$, $B=10^{-10}$ (direct) or $10^{-14}$ (indirect) cm$^3$/s, $C=10^{-30}$ cm$^6$/s, thickness $d=0.1\,\mu$m. These are chosen model parameters, not fits or measured silicon data. Presets label photon energies, not calibrated alloy compositions. Internal carrier-to-photon yield is not wall-plug efficiency: extraction, leakage, electrical voltage, heat exchange and spectral width are absent. Cubic loss causes droop in this assumed model; a fit alone does not establish the microscopic cause of droop in a real LED.`,
      deps: ['cm-4.8', 'cm-4.1', 'pma-5.11'],
      refs: ['Chenming Hu, §§2.6,4.13.1, Figs.2–12–2–13 and4–28–4–29; explicit ABC assumptions and independently differentiated efficiency'],
      tags: ['led', 'electroluminescence', 'recombination'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Light-emitting_diode' },
      verify: false,
      viz(v) {
        const M = v.M;
        const preset = v.select('preset', [{ value: 'custom', label: 'custom' }, { value: 'ir', label: '1.42 eV (infrared)' }, { value: 'red', label: '1.90 eV (red)' }, { value: 'green', label: '2.40 eV (green)' }, { value: 'blue', label: '2.70 eV (blue)' }], 'red');
        const Eg=v.slider('band gap $E_g$ (eV)',.7,3.4,1.9,{step:.01,onChange:()=>preset.set('custom')});
        const typ = v.select('gap type', [{ value: 'direct', label: 'direct' }, { value: 'indirect', label: 'indirect' }], 'direct');
        const PRE = { ir: 1.42, red: 1.9, green: 2.4, blue: 2.7 };
        const{A,C,B,d}=ABC;const solveN=(J,b)=>abcAudit(J,b).n,iqe=(J,b)=>abcAudit(J,b).eta;
        const sD = v.stage({ x: [0, 10], y: [-0.7, 4.1], axes: false, height: 380, title: 'forward-biased double heterostructure', weight: 1.1 });
        const sE = v.stage({ x: [0.1, 1e4], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'current density $J$ (A/cm$^2$)', ylabel: 'internal quantum efficiency', title: 'efficiency against current (ABC model)', weight: 0.9 });
        const hE = sE.handle(30, 0.5, { color: 'gold', r: 7, constrain: (x) => { const J = Math.max(0.1, Math.min(1e4, x)); return [J, iqe(J, B[typ.value])]; } });
        v.legend([['accent', 'direct gap'], ['red', 'indirect gap'], ['gold', 'operating point'], ['blue', 'electron'], ['pink', 'hole']]);
        let last = preset.value, info = {};
        const KP = 12, P = 4.8;
        v.animate((t) => {
          if (preset.value !== last) { last = preset.value; if (PRE[preset.value]) Eg.set(PRE[preset.value]); }
          const E = Eg.value, J = hE.x, Bc = B[typ.value], eta = iqe(J, Bc), lam = HC_A / E, rgb = colOf(M, lam), ph = t / P;
          sD.setView([0,10],[-.7,Math.max(4.1,E/2+3.35)]);
          // IQE panel
          for (const key of ['direct', 'indirect']) sE.fn((x) => iqe(x, B[key]), { color: key === 'direct' ? 'accent' : 'red', width: typ.value === key ? 3 : 1.4, alpha: typ.value === key ? 1 : 0.5, domain: [0.1, 1e4] });
          hE.set(J, eta); sE.text('indirect gap (never above 0.2%)', 0.15, 0.06, { size: 10, color: 'red' });
          // band diagram
          const w = 0.15, Ecc = E + w, Evc = -w;
          const ln = (c, y0, y1, x0, x1) => sD.line(x0, y0, x1, y1, { color: c, width: 2.6 });
          sD.rect(4, -0.7, 6, Math.max(4.1,E/2+3.35), { fill: 'gold', fillAlpha: 0.07, stroke: false }); sD.text('active layer', 5, -0.55, { size: 11, color: 'muted', align: 'center' });
          ln('accent', Ecc, Ecc, 0, 4); ln('accent', Ecc, E, 4, 4); ln('accent', E, E, 4, 6); ln('accent', E, Ecc, 6, 6); ln('accent', Ecc, Ecc, 6, 10);
          ln('green', Evc, Evc, 0, 4); ln('green', Evc, 0, 4, 4); ln('green', 0, 0, 4, 6); ln('green', 0, Evc, 6, 6); ln('green', Evc, Evc, 6, 10);
          sD.hline(Ecc - 0.05, { color: 'blue', width: 1.2, dash: [4, 4], alpha: 0.7 }); sD.hline(Evc + 0.05, { color: 'pink', width: 1.2, dash: [4, 4], alpha: 0.7 });
          sD.text('$n$-type', 1.2, Ecc + 0.35, { size: 11, color: 'muted', align: 'center' }); sD.text('$p$-type', 8.8, Ecc + 0.35, { size: 11, color: 'muted', align: 'center' });
          sD.text('$E_c$', 0.15, Ecc + 0.18, { size: 11, color: 'accent' }); sD.text('$E_v$', 0.15, Evc - 0.28, { size: 11, color: 'green' });
          sD.measure(7.2, 0, 7.2, E, `Eg = ${E.toFixed(2)} eV`);
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
          return `$E_g=${v.fix(I.E, 2)}$ eV → $\\lambda=${v.fix(I.lam, 0)}$ nm (${kind}) · $J=${v.fix(I.J, 1)}$ A/cm$^2$ → $n=${v.sci(I.n, 2)}$ cm$^{-3}$\n$\\eta_{\\text{int}}=${v.fix(100 * I.eta, I.eta < 0.01 ? 3 : 1)}\\%$ (${typ.value} gap, $B=${v.sci(B[typ.value], 1)}$ cm$^3$/s) · photon emission $\\approx${v.sci(flux, 2)}$ per s per cm$^2$ · nonradiative carrier fraction $1-\\eta_{\\text{int}}$ is not a wall-plug heat fraction`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Field-effect transistor (MOSFET)',
      credit: 'Ideal MOS electrostatics and long-channel current model',
      statement: String.raw`A **metal–oxide–semiconductor field-effect transistor** controls a current between source and drain with a voltage on a gate separated from the semiconductor by an oxide. On $p$-type silicon a positive gate voltage first repels holes (**depletion**, surface band bending $\psi_s>0$ with a depletion layer of width $W$), then bends the bands until the surface is as strongly $n$-type as the bulk is $p$-type, $\psi_s=2\varphi_F$ with $\varphi_F=(k_BT/e)\ln(N_a/n_i)$: **strong inversion**, a thin sheet of electrons (the channel). The gate voltage needed is the **threshold voltage**
$$V_T=V_{fb}+2\varphi_F+\frac{\sqrt{4\varepsilon eN_a\varphi_F}}{C_{ox}},\qquad C_{ox}=\varepsilon_{ox}/t_{ox}.$$
Above $V_T$ the drain current of a long channel is $I_d\approx\mu C_{ox}\tfrac WL\bigl[(V_g-V_T)V_d-\tfrac m2V_d^2\bigr]$ before pinch-off and saturates at $\tfrac1{2m}\mu C_{ox}\tfrac WL(V_g-V_T)^2$ for $V_d>(V_g-V_T)/m$, with body factor $m=1+C_d/C_{ox}$. Below $V_T$ the weak-inversion swing is $S=\ln10\,(k_BT/e)m$, at least about 60 mV per decade at 300 K in this ideal thermionic model.`,
      idea: String.raw`The gate and the semiconductor form a capacitor in series with the semiconductor's own space-charge layer, so for depletion/inversion the gate voltage divides as $V_g-V_{fb}=\psi_s+|Q_s|/C_{ox}$, where the charge $Q_s(\psi_s)$ follows from integrating Poisson's equation (vcalc-9.4) through the bent bands with Boltzmann carriers (cm-4.3). Once $\psi_s$ reaches $2\varphi_F$ the electron density at the surface grows as $e^{\psi_s/k_BT}$, so any additional gate voltage goes almost entirely into more channel charge $Q_{inv}$ instead of more band bending: $\psi_s$ pins near $2\varphi_F$. Source-to-drain, the channel charge is a resistor controlled by $V_g$; as $V_d$ approaches $(V_g-V_T)/m$ the charge at the drain end vanishes (pinch-off) and the current saturates.`,
      caption: String.raw`Drag the **gate voltage**. **Left:** the band diagram of the gate/oxide/silicon stack at a numerical Boltzmann–Poisson equilibrium surface potential: the Fermi level of the metal moves down by $eV_g$, the silicon bands bend down, the pale shading marks where the electrons outnumber the holes ($n>p$, the surface is inverted) and the dark sliver at the surface is the channel proper, where $n$ exceeds even the bulk hole density $N_a$. Choose the **right-hand panel**: the transfer curve $I_d(V_g)$ on a log scale (exponential subthreshold turn-on, then square-law-like growth), the output family $I_d(V_d)$ (linear region and saturation), or the surface potential $\psi_s(V_g)$, which rises slowly beyond $2\varphi_F$. Vary the doping and the oxide thickness: thinner oxide and lighter doping lower $V_T$ and sharpen the turn-on.`,
      scope: String.raw`Ideal uniform $p$-Si MOS capacitor at 300 K, $V_{fb}=0$, no interface charge, Boltzmann carriers and constant permittivities (Si 12, oxide 3.9). Accumulation and inversion use the signed Poisson first integral; this is a source-end equilibrium cross-section, not a biased 2D transistor solution. The energy diagram uses the conventional intrinsic-midgap approximation. The current panel uses an explicitly **smooth interpolation** with the correct weak-inversion exponential limit and Hu's long-channel square-law limit, including body factor $m=1+C_d/C_{ox}$. It is not a numerical Brews charge-sheet solution or a measured device fit. Constant assumed mobility 400 cm$^2$/Vs and $W/L=10$; no velocity saturation, leakage floor, tunnelling or short-channel effects. The threshold marks the usual depletion approximation, not an exact equality in the numerical capacitor. Dashed oxide lines continue silicon energies schematically; real oxide band offsets are not modeled.`,
      deps: ['cm-4.7', 'cm-4.3'],
      refs: ['Chenming Hu, §§5.2–5.5, Eqs.(5.3.1)–(5.5.3); §§6.5–6.6 Eqs.(6.6.1)–(6.6.6), §7.2 weak inversion; explicit interpolation limits independently checked'],
      tags: ['mosfet', 'inversion', 'transistor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET' },
      verify: false,
      viz(v) {
        const Vgs=v.slider('gate voltage $V_g$ (V)',-.5,3.5,1.6,{step:.01}),Vds=v.slider('drain voltage $V_d$ (V)',.02,3.5,.1,{step:.01}),Nas=v.slider('acceptors $N_a$ (cm$^{-3}$)',1e15,1e18,1e17,{log:true,fmt:dens(v.M)}),tox=v.slider('oxide thickness $t_{ox}$ (nm)',2,50,10,{step:.5});
        const view=v.select('right panel',[{value:'transfer',label:'$I_d(V_g)$'},{value:'output',label:'$I_d(V_d)$'},{value:'psi',label:'$\\psi_s(V_g)$'}],'transfer');
        const sB=v.stage({x:[-20,150],y:[-2,2],axes:'box',gutter:true,height:380,xlabel:'depth $z$ (nm); oxide at $z<0$',ylabel:'energy relative to bulk silicon Fermi level (eV)',title:'source-end equilibrium MOS section',weight:1.1}),sR=v.stage({x:[-.5,3.5],y:[1e-30,1],ylog:true,axes:'box',gutter:true,height:380,xlabel:'gate voltage $V_g$ (V)',ylabel:'current $I_d$ (A)',title:'declared current interpolation',weight:1});
        v.legend([['accent','$E_c$ / current'],['green','$E_v$'],['muted','$E_i$',{dash:true}],['ink','Fermi levels'],['blue','surface inverted; dark: $n>N_a$'],['gold','selected input']]);
        let key='',mos,info={};
        v.render(()=>{
          const k=`${Nas.value}|${tox.value}`;if(k!==key){key=k;mos=mosAudit(Nas.value,tox.value);}
          const Vg=Vgs.value,Vd=Vds.value,psis=mos.psiOf(Vg),prof=mos.profile(psis),phiF=mos.phiF,Eg=1.12,Ecinf=Eg/2+phiF,tx=tox.value,zmax=Math.max(40,prof.at(-1)[0]*1.04),Ec=p=>Ecinf-p;
          const low=Math.min(-Vg,Ec(psis)-Eg,Ecinf-Eg)-.3,high=Math.max(Ecinf,Ec(psis),-Vg)+.4;sB.setView([-(tx+15),zmax],[low,high]);sB.vband(-tx,0,{color:'muted',alpha:.12});sB.hline(0,{color:'ink',width:1});sB.line(-(tx+12),-Vg,-tx,-Vg,{color:'ink',width:2.5});sB.text('$E_{F,gate}$',-(tx+6),-Vg,{color:'ink',size:10,align:'center',dy:-8});sB.text('oxide',-tx/2,high-.12,{color:'muted',size:10,align:'center'});
          for(const [offset,color,dash]of[[0,'accent',null],[-Eg,'green',null],[-Eg/2,'muted',[4,4]]]){sB.path(prof.map(([z,p])=>[z,Ec(p)+offset]),{color,width:2.4,dash});sB.line(-tx,Ec(psis)+offset-(Vg-psis),0,Ec(psis)+offset,{color,width:1,dash:[4,4],alpha:.5});}
          let zi=0,zc=0;for(const[z,p]of prof){if(p>phiF)zi=z;if(p>2*phiF)zc=z;}if(zi)sB.vband(0,zi,{color:'blue',alpha:.12});if(zc)sB.vband(0,zc,{color:'blue',alpha:.3});sB.text('$E_{F,Si}$',zmax*.94,0,{color:'ink',size:10,dy:-7,align:'right'});
          if(view.value==='transfer'){const curve=Array.from({length:101},(_,i)=>{const x=-.5+i*.04;return[x,mos.Id(x,Vd)];});sR.setScale({xlog:false,ylog:true,x:[-.5,3.5],y:[Math.min(...curve.map(p=>p[1]))*.5,Math.max(...curve.map(p=>p[1]))*2]});sR.setLabels('gate voltage $V_g$ (V)','drain current $I_d$ (A)');sR.path(curve,{color:'accent',width:2.8});sR.vline(mos.VT,{color:'orange',dash:[4,4]});sR.dot(Vg,mos.Id(Vg,Vd),{color:'gold',r:6});}
          else if(view.value==='output'){const gates=[mos.VT+.3,mos.VT+.6,mos.VT+1,Vg],curves=gates.map(g=>Array.from({length:81},(_,i)=>[i*3.5/80,mos.Id(g,i*3.5/80)*1e6]));sR.setScale({xlog:false,ylog:false,x:[0,3.5],y:[0,1.1*Math.max(1,...curves.flatMap(c=>c.map(p=>p[1])))]});sR.setLabels('drain voltage $V_d$ (V)','drain current $I_d$ (µA)');curves.forEach((c,i)=>sR.path(c,{color:['teal','accent','purple','gold'][i],width:i===3?3:1.5}));sR.dot(Vd,mos.Id(Vg,Vd)*1e6,{color:'gold',r:6});sR.text('gold: selected gate; family: $V_T+0.3,0.6,1$ V',.1,sR.view.y[1]*.95,{size:9,color:'muted'});}
          else{const curve=Array.from({length:101},(_,i)=>{const x=-.5+i*.04;return[x,mos.psiOf(x)];});sR.setScale({xlog:false,ylog:false,x:[-.5,3.5],y:[Math.min(-.2,...curve.map(p=>p[1]))-.05,Math.max(2*phiF,...curve.map(p=>p[1]))+.12]});sR.setLabels('gate voltage $V_g$ (V)','surface potential $\\psi_s$ (V)');sR.path(curve,{color:'accent',width:2.8});sR.hline(2*phiF,{color:'orange',dash:[4,4]});sR.dot(Vg,psis,{color:'gold',r:6});}
          const reg=psis<0?'accumulation':psis<phiF?'depletion':psis<2*phiF?'weak inversion':'strong inversion';info={Vg,Vd,psis,reg,VT:mos.VT,phiF,Id:mos.Id(Vg,Vd),Qinv:mos.Qinv(psis),mos,prof};
        });
        v.readout(()=>{const I=info;if(!I.mos)return'';return `**${I.reg}** · $\\psi_s=${v.fix(I.psis,3)}$ V · depletion-approximation threshold $V_T=${v.fix(I.VT,3)}$ V, $2\\varphi_F=${v.fix(2*I.phiF,3)}$ V\ninterpolated current $I_d=${v.sci(I.Id,2)}$ A · equilibrium positive excess electron sheet density $${v.sci(I.Qinv/QE,2)}$ cm$^{-2}$ · body factor $m=${v.fix(I.mos.m,2)}$, weak-limit swing $${v.fix(Math.LN10*I.mos.Vt*I.mos.m*1000,1)}$ mV/decade. Current and capacitor are separate stated approximations.`;});
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Quantum wells and heterostructures',
      credit: 'Finite type-I well in the scalar envelope approximation',
      statement: String.raw`A thin layer of a small-gap semiconductor (GaAs, width $L$) between layers of a larger-gap one (Al$_x$Ga$_{1-x}$As) forms a **quantum well** for both carriers, with depths $\Delta E_c=Q_c\,\Delta E_g$ and $\Delta E_v=(1-Q_c)\Delta E_g$. In the envelope-function (effective-mass) picture the confined electron obeys $-\tfrac{\hbar^2}{2}\frac{d}{dz}\bigl(\tfrac1{m^*(z)}\tfrac{d\psi}{dz}\bigr)+V(z)\psi=E\psi$, so the allowed energies solve $\ \tfrac{k}{m_w}\tan\tfrac{kL}{2}=\tfrac{\kappa}{m_b}$ (even) or $-\tfrac{k}{m_w}\cot\tfrac{kL}{2}=\tfrac{\kappa}{m_b}$ (odd) with $k=\sqrt{2m_wE}/\hbar$, $\kappa=\sqrt{2m_b(V-E)}/\hbar$. For a wide well the levels approach the infinite-well values $E_n=\hbar^2\pi^2n^2/2m_wL^2$; a narrow well has few bound states. The lowest optical transition is
$$\hbar\omega\approx E_g^{\text{GaAs}}+E_{e1}+E_{hh1},$$
which moves to higher energy (to the blue) as $L$ shrinks, tunable by the width.`,
      idea: String.raw`Because the conduction-band edge of GaAs lies below that of AlGaAs, an electron near the band edge is described by a slowly varying envelope that obeys the one-dimensional finite square-well problem of quantum mechanics (qm-3.4) with the effective mass cm-2.3 inside and a different mass in the barrier; continuity of $\psi$ and of $\psi'/m^*$ (so that probability current is conserved) fixes the quantisation. The levels therefore have the box-eigenstate structure — alternately even and odd — but are lower than in an infinite box because the wave function leaks into the barrier. Confinement raises the zero-point energy like $1/L^2$, so a thinner well emits at a higher photon energy.`,
      caption: String.raw`Drag the **well width**, the aluminium fraction (barrier height) and the conduction-band offset fraction. **Left:** conduction and valence band edges of the heterostructure with the bound electron levels (blue) and heavy-hole levels (red) and their wave functions, which leak into the barriers. The gold arrow is the lowest interband transition, drawn in the colour of the photon it emits. **Right:** the confinement shift against width: the finite-well result (solid) against the infinite-well estimate (dashed), which overestimates the confinement of narrow wells. Wavefunctions are displayed with arbitrary vertical amplitude around their level energies. The right panel plots the positive confinement shift on log axes so the full infinite-well comparison remains visible. Turn mass mismatch off to use the well mass in the barrier too.`,
      scope: String.raw`Scalar, single rectangular type-I model with positive masses and BenDaniel–Duke flux matching. GaAs-inspired gap 1.424 eV, electron well mass 0.067 and barrier mass $0.067+0.083x$; assumed equal heavy-hole mass 0.35. The illustrative barrier-gap parameterization is $1.247x$ eV and its partition $Q_c$ is a user input, not a measured band-offset claim. No unreviewed historical experiment is reconstructed. Effective masses and offsets in real alloys depend on temperature/composition; this pedagogical parameter set is not a fitted material prediction. Excitonic binding, valence-band mixing, interface chemistry and strain are omitted. Very narrow wells can violate the slowly varying-envelope assumption.`,
      deps: ['cm-4.1', 'cm-2.3', 'qm-3.4'],
      refs: ['Barsan–Ciornei, arXiv:1610.09479v2, §II Eqs.(1)–(30), pp.5–8 (primary author derivation)', 'Tong, Quantum Mechanics §2.3.1; Hu §4.13.1 quantum-well confinement'],
      tags: ['quantum well', 'heterostructure', 'confinement'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_well' },
      verify: false,
      viz(v) {
        const M = v.M;
        const Ls = v.slider('well width $L$ (nm)', 1, 40, 8, { step: 0.1 });
        const xs = v.slider('Al fraction $x$', 0.1, 0.45, 0.3, { step: 0.01 });
        const Qc = v.slider('conduction-band offset fraction $Q_c$', 0.5, 0.9, 0.65, { step: 0.01 });
        const bdd = v.toggle('include barrier-mass mismatch (flux matching)', true);
        const EG = 1.424, ME = 0.067, MH = 0.35;
        const par = () => { const x = xs.value, dEg = 1.247 * x; return { x, Vc: Qc.value * dEg, Vv: (1 - Qc.value) * dEg, mbe: 0.067 + 0.083 * x, dEg }; };
        const sQ = v.stage({ x: [-20, 20], y: [-0.4, 2.1], axes: 'box', gutter: true, height: 380, xlabel: 'growth direction $z$ (nm)', ylabel: 'energy (eV)', title: 'GaAs well between AlGaAs barriers', weight: 1.15 });
        const sW = v.stage({ x:[1,40],y:[.1,1e4],xlog:true,ylog:true,axes: 'box', gutter: true, height: 380, xlabel: 'well width $L$ (nm)', ylabel:'confinement shift (meV)', title: 'quantum size effect', weight: 0.9 });
        v.legend([['blue', 'electron levels'], ['red', 'heavy-hole levels'], ['gold', 'optical transition'], ['ink', 'finite well'], ['muted', 'infinite well', { dash: true }]]);
        let key = '', curve = [];
        let info = {};
        v.render(() => {
          const P = par(), L = Ls.value, bd = bdd.value;
          const e = wellAudit(L, P.Vc, ME, P.mbe, bd), h = wellAudit(L, P.Vv, MH, MH, bd);
          const X = Math.max(L / 2 + 9, 14); sQ.setView([-X, X], [-P.Vv - 0.25, EG + P.Vc + 0.3]);
          sQ.path([[-X, EG + P.Vc], [-L / 2, EG + P.Vc], [-L / 2, EG], [L / 2, EG], [L / 2, EG + P.Vc], [X, EG + P.Vc]], { color: 'accent', width: 2.8 });
          sQ.path([[-X, -P.Vv], [-L / 2, -P.Vv], [-L / 2, 0], [L / 2, 0], [L / 2, -P.Vv], [X, -P.Vv]], { color: 'green', width: 2.8 });
          sQ.text('AlGaAs', -X + 1, EG + P.Vc + 0.12, { size: 11, color: 'muted' }); sQ.text('GaAs', 0, EG + P.Vc + 0.12, { size: 11, color: 'muted', align: 'center' });
          const draw = (lev, Vb, sgn, base, color) => lev.slice(0, 4).forEach((q) => {
            const y0 = base + sgn * q.E; sQ.line(-X, y0, X, y0, { color, width: 1, alpha: 0.35, dash: [3, 4] });
            const w = waveAudit(L, Vb, sgn > 0 ? ME : MH, sgn > 0 ? P.mbe : MH, q, X, 300, bd); const mx = Math.max(...w.ps.map(Math.abs));
            sQ.path(w.xs.map((x, i) => [x, y0 + (0.08 * w.ps[i]) / mx]), { color, width: 2 });
          });
          draw(e, P.Vc, 1, EG, 'blue'); draw(h, P.Vv, -1, 0, 'red');
          const e1 = e.length ? e[0].E : NaN, h1 = h.length ? h[0].E : NaN, hw = EG + e1 + h1, lam = HC_A / hw, rgb = colOf(M, lam);
          if (e.length && h.length) { sQ.arrow(0, -h1, 0, EG + e1, { color: rgb, width: 3 }); sQ.dot(0, EG + e1, { r: 5, color: 'blue' }); sQ.dot(0, -h1, { r: 5, color: 'red' }); }
          // size-effect panel
          const kk = `${P.x}|${Qc.value}|${bd}`; if (kk !== key) { key = kk; curve = Array.from({ length: 60 }, (_, i) => { const l = Math.pow(40, i / 59) * 1; const ee = wellAudit(l, P.Vc, ME, P.mbe, bd), hh = wellAudit(l, P.Vv, MH, MH, bd); return [l, ee.length && hh.length ? EG + ee[0].E + hh[0].E : null]; }); }
          const finite=curve.filter(q=>q[1]!=null).map(([l,e])=>[l,1000*(e-EG)]),infinite=l=>1000*HB2_A*Math.PI**2*(1/ME+1/MH)/(l*l);sW.setView([1,40],[.8*Math.min(...finite.map(q=>q[1])),1.15*infinite(1)]);
          sW.path(finite,{color:'ink',width:2.8});sW.fn(infinite,{color:'muted',width:1.6,dash:[5,4],domain:[1,40]});sW.vline(L,{color:'gold',width:1.2});if(isFinite(hw))sW.dot(L,1000*(hw-EG),{r:7,color:rgb});
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
      credit: 'Screened Coulomb model; Kazimierczuk et al., 2014 (Cu₂O spectroscopy)',
      statement: String.raw`An electron in the conduction band and a hole in the valence band attract each other through the screened Coulomb potential and can form a bound pair, an **exciton**. In the Wannier–Mott limit (weak binding, orbit large compared with the lattice constant) it is a hydrogen atom with the reduced mass $\mu=m_e^*m_h^*/(m_e^*+m_h^*)$ and dielectric constant $\varepsilon$:
$$E_n=E_g-\frac{\mathrm{Ry}^*}{n^2},\qquad \mathrm{Ry}^*=\frac{\mu}{m_0}\frac{13.6\ \text{eV}}{\varepsilon^2},\qquad a_B^*=\varepsilon\frac{m_0}{\mu}a_0 .$$
These discrete lines lie just below the gap in the absorption spectrum; dipole-allowed S-envelope strengths scale as $n^{-3}$. Cu$_2$O has a different selection rule: its allowed yellow P-envelope strengths scale as $(n^2-1)/n^5$, approaching $n^{-3}$ only for large $n$. The plot models discrete lines below the gap and does not calculate above-gap absorption. Real series show a **quantum defect**, $n\to n-\delta_l$, from the non-Coulombic short-range potential.`,
      idea: String.raw`The pair's relative motion in a crystal is the hydrogen problem (qm-8.12) in the effective-mass approximation (as for donors, cm-4.4, but with the hole mass in place of the infinite ionic mass, so $\mu$ appears), while the centre of mass moves freely. For an allowed S envelope, contact creation gives a line strength proportional to $|\psi_n(0)|^2\propto n^{-3}$. In Cu$_2$O the band parities forbid that dipole channel; a derivative of the P envelope gives the different finite-$n$ factor. The spacing between neighbouring lines is $\approx2\mathrm{Ry}^*/n^3$, also $\propto n^{-3}$, which makes the continuum limit smooth and means that lines merge when the spacing falls below the line width. In the cited 2014 comparison, GaAs had $\mathrm{Ry}^*\approx4.2$ meV and observed states through $n=3$; in cuprous oxide $\mathrm{Ry}^*\approx92$ meV and a very clean crystal shows lines up to $n=25$, with a mean electron–hole separation about 1.04 µm at $n=25$, or twice that as a diameter.`,
      caption: String.raw`Choose a series and an assumed **effective Lorentzian FWHM** $\Gamma$. The left panel sums model lines below the gap; narrow peaks are sampled at their true centers. The dashed unit line is a chosen high-$n$ normalization reference, not a computed continuum. Quantum defect changes line positions; strengths use the integer-$n$ S/P formulas. The spacing criterion $\Delta E>2\Gamma$ is only a resolution heuristic for this ideal sum. It does not predict which lines an experiment observes. The two width buttons are hypothetical effective widths; a laser bandwidth is not the intrinsic exciton linewidth. Right: hydrogenic mean separation $\langle r\rangle=\tfrac12[3n^2-l(l+1)]a_B^*$ using integer $n$, not a classical orbit or a radius with an assumed quantum-defect substitution.`,
      scope: String.raw`Isotropic screened Coulomb envelopes; quantum defect is an empirical energy fit, not a full wavefunction correction. Cu$_2$O yellow P series uses the original paper's $E_g=2.17208$ eV, Ry=92 meV, defect 0.23 and independently quoted P-series Bohr length 1.11 nm; the gap includes the experiment's finite photon-momentum energy shift (paper footnote 1). The plotted Lorentzians are a hypothetical low-density model, not raw experimental spectra: actual lines are asymmetric and become inhomogeneously broadened at high $n$, with power-dependent blockade. GaAs S-series Ry=4.2 meV follows the paper's comparison; its model Bohr length uses epsilon 12.9, and gap 1.519 eV is a low-temperature parameter. No universal three-state limit in present-day GaAs is claimed. Polariton, exchange and band-mixing effects are omitted.`,
      deps: ['cm-4.4', 'qm-8.12'],
      refs: ['Kazimierczuk et al., arXiv:1407.0691, full original paper pp.2–6, Supplementary Information pp.1–2 and Fig.S5; NIST CODATA2022 hydrogen scales'],
      tags: ['exciton', 'rydberg', 'absorption'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exciton', doi: 'https://doi.org/10.1038/nature13832' },
      viz(v) {
        const mat=v.select('series',[{value:'cu2o',label:'Cu$_2$O yellow P'},{value:'gaas',label:'GaAs S model'}],'cu2o'),G=v.slider('effective FWHM $\\Gamma$ (µeV)',.005,1e4,3,{log:true,sig:2}),qd=v.toggle('energy quantum defect $\\delta_P=0.23$',true),nS=v.slider('principal quantum number $n$',1,30,10,{int:true});
        v.button('hypothetical FWHM 5 neV',()=>G.set(.005));v.button('hypothetical FWHM 10 µeV',()=>G.set(10));
        const sA=v.stage({x:[.05,120],y:[.01,2e4],xlog:true,ylog:true,axes:'box',gutter:true,height:380,xlabel:'binding energy $E_g-E$ (meV)',ylabel:'relative model absorption',title:'discrete-line model below gap',weight:1.15}),sB=v.stage({x:[1,32],y:[.1,5000],xlog:true,ylog:true,axes:'box',gutter:true,height:380,xlabel:'principal quantum number $n$',ylabel:'mean electron–hole separation (nm)',title:'hydrogenic mean separation',weight:.85});
        const radius=n=>excitonRadius(EXCITONS[mat.value],n),hN=sB.handle(10,radius(10),{color:'gold',r:7,constrain:x=>{const n=Math.max(EXCITONS[mat.value].n0,Math.min(30,Math.round(x)));return[n,radius(n)];}});hN.onDrag=()=>nS.set(Math.round(hN.x));v.legend([['accent','model lines / mean separation'],['muted','chosen unit reference',{dash:true}],['gold','chosen $n$']]);let info={};
        v.render(()=>{const Mt=EXCITONS[mat.value];if(nS.value<Mt.n0)nS.set(Mt.n0);const n=nS.value,d=qd.value?Mt.delta:0,Gm=G.value/1000,S=excitonSpectrum(Mt,Gm,qd.value);sA.setView([S.lo,S.hi],[Math.min(.05,...S.pts.map(p=>p[1]))*.5,Math.max(2,...S.pts.map(p=>p[1]))*2.5]);sA.hline(1,{color:'muted',dash:[5,4]});sA.path(S.pts,{color:'accent',width:1.7});const top=sA.view.y[1];for(const q of S.lines)if([2,3,5,10,15,20,25,30].includes(q.n))sA.text(`${q.n}`,q.Eb,top/1.4,{size:9,color:'muted',align:'center'});
          const curve=Array.from({length:31-Mt.n0},(_,i)=>[i+Mt.n0,radius(i+Mt.n0)]);sB.setView([.9,32],[Math.min(.5,Mt.aB)*.7,Math.max(1000,...curve.map(p=>p[1]))*1.3]);sB.path(curve,{color:'accent',width:2.7});sB.hline(Mt.aB,{color:'green',dash:[4,4]});sB.text('Bohr length',1,Mt.aB,{size:10,color:'green',dy:-8});const wavelength=HC_A/Mt.Eg;sB.hline(wavelength,{color:'orange',dash:[4,4]});sB.text('vacuum gap wavelength',1,wavelength,{size:9,color:'orange',dy:-8});hN.set(n,radius(n));sB.vline(n,{color:'gold',width:1});info={Mt,n,d,Gm,nmax:S.nmax,r:radius(n),En:Mt.Eg-Mt.Ry/1000/(n-d)**2,S};
        });
        v.readout(()=>{const I=info;if(!I.Mt)return'';return `$\\mathrm{Ry}^*=${v.fix(I.Mt.Ry,1)}$ meV, $a_B^*=${v.fix(I.Mt.aB,2)}$ nm · $n=${I.n}$ line: $E=${v.fix(I.En,5)}$ eV · mean separation $${v.fix(I.r,1)}$ nm; twice this is $${v.fix(2*I.r/1000,3)}$ µm\nAssumed FWHM $${v.fix(I.Gm*1000,3)}$ µeV; spacing-only heuristic: ${I.nmax===null?'no adjacent pair resolved':`last adjacent pair through $n=${I.nmax}$${I.nmax===120?' (finite calculation limit)':''}`}. ${mat.value==='cu2o'?'Original 2014 experiment: lines through n=25 with a 5 neV laser bandwidth; white-light instrument 10 µeV resolved through n=17. Actual high-n line widths were a few µeV; these instrumental numbers are not the effective FWHM input.':'The 2014 paper quotes GaAs Ry=4.2 meV and then-observed n≤3; this is historical context, not a present-day observation limit.'}`;});
      },
    },
  ],
};
